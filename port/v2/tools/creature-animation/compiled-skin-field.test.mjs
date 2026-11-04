import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {rolldown} from 'rolldown';
import {createCompiledSkinField, applyCompiledSkinField} from './compiled-skin-field.mjs';
import {applyPaintSkin} from './paint-skin.mjs';

const root = path.resolve(import.meta.dirname, '../../../..');
const source = () => ({schema: 'cf.paint-skin/v1', parts: [], vertices: [
  {x: 2, y: 3, weights: [['head', 1]]},
  {x: 11, y: 3, weights: [['head', 0.25], ['jaw', 0.75]]},
  {x: 5, y: 17, weights: [['jaw', 1]]},
]});
const matrices = () => ({head: [1, 0, 0, 1, 0.2, 0.4], jaw: [0.8, 0.6, -0.6, 0.8, 0.1, -0.1]});
const sameBytes = (a, b) => assert.deepEqual(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), new Uint8Array(b.buffer, b.byteOffset, b.byteLength));

test('compiled field preserves weight order and bitwise Float32/Float64 output parity', () => {
  const skin = source(), state = createCompiledSkinField(skin, 20, 30), current = matrices();
  assert.deepEqual(Object.keys(state), ['vertexCount', 'jointCount', 'weightCount']);
  assert.equal(Object.isFrozen(state), true); assert.equal(state.jointCount, 2); assert.equal(state.weightCount, 4);
  for (const Buffer of [Float32Array, Float64Array]) {
    const expected = new Buffer(6), output = new Buffer(6);
    applyPaintSkin(skin, current, 20, 30, expected);
    applyCompiledSkinField(state, current, output); sameBytes(output, expected);
  }
});

test('each current matrix and each component is read once; in-place edits cannot hide behind a cache', () => {
  const skin = source(), state = createCompiledSkinField(skin, 20, 30), current = matrices();
  const jointReads = {head: 0, jaw: 0}, componentReads = {head: Array(6).fill(0), jaw: Array(6).fill(0)};
  const tracked = {};
  for (const name of ['head', 'jaw']) {
    const matrix = new Proxy(current[name], {get(target, key) {
      if (/^[0-5]$/.test(String(key))) componentReads[name][Number(key)]++;
      return Reflect.get(target, key);
    }});
    Object.defineProperty(tracked, name, {get() { jointReads[name]++; return matrix; }});
  }
  const output = new Float32Array(6), original = output.slice();
  applyCompiledSkinField(state, tracked, output);
  assert.deepEqual(jointReads, {head: 1, jaw: 1});
  assert.deepEqual(componentReads, {head: Array(6).fill(1), jaw: Array(6).fill(1)});
  original.set(output); current.jaw[4] += 0.123;
  applyCompiledSkinField(state, tracked, output); assert.notDeepEqual(output, original);
  const expected = output.slice(); applyPaintSkin(skin, current, 20, 30, expected); sameBytes(output, expected);
  current.jaw[2] = NaN;
  assert.throws(() => applyCompiledSkinField(state, tracked, output), /matrix: jaw/);
  sameBytes(output, expected);
});

test('source geometry and sparse weights are captured immutably; recompilation observes source edits', () => {
  const skin = source(), current = matrices(), state = createCompiledSkinField(skin, 20, 30);
  const before = new Float64Array(6); applyCompiledSkinField(state, current, before);
  skin.vertices[0].x += 3; skin.vertices[1].weights[0][1] = 0.4; skin.vertices[1].weights[1][1] = 0.6;
  skin.vertices[2].weights[0][0] = 'head';
  const output = before.slice(); applyCompiledSkinField(state, current, output); sameBytes(output, before);
  const recompiled = createCompiledSkinField(skin, 20, 30), expected = output.slice();
  applyCompiledSkinField(recompiled, current, output); applyPaintSkin(skin, current, 20, 30, expected);
  sameBytes(output, expected); assert.notDeepEqual(output, before);
});

test('missing/nonfinite/malformed matrices and Float32/Float64 overflow refuse atomically', () => {
  const skin = source(), state = createCompiledSkinField(skin, 20, 30);
  for (const mutate of [m => delete m.jaw, m => m.jaw[5] = Infinity, m => m.jaw.pop(), m => m.jaw.push(1)]) {
    const current = matrices(), output = new Float32Array(6).fill(9), before = output.slice(); mutate(current);
    assert.throws(() => applyCompiledSkinField(state, current, output), /matrix/); sameBytes(output, before);
  }
  for (const [Buffer, overflow] of [[Float32Array, 1e39], [Float64Array, Number.MAX_VALUE]]) {
    const current = matrices(), output = new Buffer(6).fill(9), before = output.slice();
    current.jaw = [overflow, overflow, overflow, overflow, overflow, overflow];
    assert.throws(() => applyCompiledSkinField(state, current, output), /overflow/); sameBytes(output, before);
  }
});

test('failure after a valid call and later recovery do not leak partially computed scratch', () => {
  const state = createCompiledSkinField(source(), 20, 30), output = new Float32Array(6), current = matrices();
  applyCompiledSkinField(state, current, output); const original = output.slice();
  current.jaw[5] = 1e39;
  assert.throws(() => applyCompiledSkinField(state, current, output), /overflow/); sameBytes(output, original);
  current.jaw[5] = 0.25;
  applyCompiledSkinField(state, current, output); const expected = output.slice();
  applyPaintSkin(source(), current, 20, 30, expected); sameBytes(output, expected);
});

test('invalid source/foreign state and destination refuse, without accepting inherited matrices', () => {
  for (const mutate of [s => s.vertices[0].x = NaN, s => s.vertices[0].weights[0][1] = 0.5,
    s => s.vertices[1].weights[1][0] = 'head', s => s.vertices[0].weights[0][1] = -1]) {
    const skin = source(); mutate(skin); assert.throws(() => createCompiledSkinField(skin, 20, 30), /source/);
  }
  assert.throws(() => createCompiledSkinField(source(), 0, 30), /dimensions/);
  const state = createCompiledSkinField(source(), 20, 30), output = new Float32Array(6).fill(9);
  assert.throws(() => applyCompiledSkinField({...state}, matrices(), output), /unknown compiled state/);
  assert.throws(() => applyCompiledSkinField(state, matrices(), new Float32Array(2)), /position buffer/);
  assert.throws(() => applyCompiledSkinField(state, Object.create(matrices()), output), /matrix/);
  assert.ok(output.every(x => x === 9));
});

test('candidate-03 actual Civet field is bitwise equal at every retained named native pose', async () => {
  const binding = JSON.parse(fs.readFileSync(path.join(root, 'audits/C2_CONTINUOUS_SKIN_20260916/candidate-03/civet.binding.json')));
  const record = JSON.parse(fs.readFileSync(path.join(root, 'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json')));
  const native = JSON.parse(fs.readFileSync(path.join(root, 'audits/C2_CONTINUOUS_SKIN_20260916/native-01/report.json')));
  const poses = native.skinGates.rows.find(row => row.id === 'civet').poses;
  for (const name of ['rest', 'strike', 'hit-recoil', 'approach-quarter', 'approach-three-quarter']) assert.ok(poses[name]);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-compiled-skin-parity-'));
  try {
    const bundle = await rolldown({input: path.join(root, 'port/v2/apps/game/src/creature-rig-contact.ts'), platform: 'node'});
    const entry = path.join(directory, 'contact.mjs');
    try { await bundle.write({file: entry, format: 'es'}); } finally { await bundle.close(); }
    const {poseMatrices} = await import(pathToFileURL(entry).href);
    const {width, height} = record.geometry, state = createCompiledSkinField(binding.paintSkin, width, height);
    assert.equal(state.vertexCount, 2304);
    for (const Buffer of [Float32Array, Float64Array]) {
      const output = new Buffer(state.vertexCount * 2), expected = output.slice();
      for (const {pose} of Object.values(poses)) {
        const current = poseMatrices(record, pose);
        applyPaintSkin(binding.paintSkin, current, width, height, expected);
        applyCompiledSkinField(state, current, output); sameBytes(output, expected);
      }
      const current = poseMatrices(record, poses.strike.pose), joint = binding.paintSkin.vertices[0].weights[0][0];
      applyCompiledSkinField(state, current, output); const original = output.slice();
      current[joint] = [...current[joint]]; current[joint][4] += 0.005;
      applyCompiledSkinField(state, current, output); assert.notDeepEqual(output, original);
      applyPaintSkin(binding.paintSkin, current, width, height, expected); sameBytes(output, expected);
    }
  } finally { fs.rmSync(directory, {recursive: true, force: true}); }
});
