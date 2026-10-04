import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createArapScratch, solveArapSkin} from './arap-skin.mjs';
import {applyPaintPart, paintPartAreas, assertPaintPartShape} from './paint-skin.mjs';
import {compileRigidParentFrames, applyRigidParentFrames} from './rigid-parent-frame.mjs';
import {familyContractForRecord} from './family-contracts.mjs';
import {createSkeletonPoseProgram} from './skeleton-pose.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('./test-fixtures/centipede-approach-orientation.json', import.meta.url)));
const repo = new URL('../../../../', import.meta.url);
const bytes = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength);
const hash = a => createHash('sha256').update(a).digest('hex');
function readPinned(file, expected) {
  const data = fs.readFileSync(new URL(file, repo));
  assert.equal(hash(data), expected, 'The captured topology must remain the actual failing source');
  return JSON.parse(data);
}
const record = readPinned(fixture.record, fixture.recordSha256);
const binding = readPinned(fixture.binding, fixture.bindingSha256), skin = binding.paintSkin;
const create = () => createArapScratch(skin.vertices, skin.triangles, fixture.width, fixture.height, skin.solver);
function target(name) {
  const row = fixture.targets[name], data = Buffer.from(row.float32LittleEndianBase64, 'base64');
  assert.equal(hash(data), row.sha256);
  return Float32Array.from({length: data.length / 4}, (_, i) => data.readFloatLE(i * 4));
}
function compareState(a, b) {
  assert.deepEqual(a.stats, b.stats);
  for (const key of ['position', 'target', 'rotation', 'rhs']) assert.deepEqual(bytes(a[key]), bytes(b[key]), key);
  for (const key of ['heap', 'location', 'priority']) assert.deepEqual(bytes(a.orientationQueue[key]), bytes(b.orientationQueue[key]), key);
  for (const key of ['size', 'projections', 'visits', 'stalled']) assert.equal(a.orientationQueue[key], b.orientationQueue[key], key);
}

test('captured Centipede approach publishes intact paint with exact WASM/JS parity inside the original budget', () => {
  const native = create(), fallback = create(), input = target('refusal'), saved = input.slice();
  assert.ok(native.orientationActiveKernel, 'The production active leaf must admit');
  fallback.orientationActiveKernel = null;
  const a = new Float32Array(input.length), b = a.slice();
  solveArapSkin(native, input, a); solveArapSkin(fallback, input, b);
  assert.deepEqual(a, b); compareState(native, fallback); assert.deepEqual(input, saved);
  assert.equal(hash(bytes(a)), fixture.acceptedRefusalOutputSha256, 'Exact output measured in the signed candidate proof');
  assert.equal(native.stats.flippedTriangles, 0);
  assert.ok(native.stats.minimumAreaRatio > 0);
  assert.ok(native.orientationQueue.visits < skin.triangles.length / 3 * 2, 'The retained oscillation must settle, not exhaust 64 sweeps');
  assert.ok(native.orientationQueue.visits <= native.orientationIterations * native.areas.length);
  for (let i = 0; i < native.n; i++) if (native.pins[i]) assert.deepEqual(a.slice(i * 2, i * 2 + 2), input.slice(i * 2, i * 2 + 2));

  // Check the Float32 parts the renderer publishes, including rigid parent frames.
  const definition = familyContractForRecord(record), matrices = createSkeletonPoseProgram(definition, record.landmarks).evaluate(fixture.targets.refusal.resolved);
  const positions = Object.fromEntries(skin.parts.map(part => {
    const output = new Float32Array(part.vertices.length * 2); applyPaintPart(part, a, output); return [part.id, output];
  }));
  applyRigidParentFrames(compileRigidParentFrames(skin, binding.parts, definition, fixture.width, fixture.height), matrices, positions);
  for (const part of skin.parts) assertPaintPartShape(part, skin, positions[part.id], fixture.width, fixture.height, paintPartAreas(part, skin));
  const part = skin.parts[0], reflected = positions[part.id].slice();
  for (let i = 0; i < reflected.length; i += 2) reflected[i] = -reflected[i];
  assert.throws(() => assertPaintPartShape(part, skin, reflected, fixture.width, fixture.height, paintPartAreas(part, skin)), /folded triangle/);
});

test('removing delayed damping reproduces the actual fold and exhausted budget; prior safe pose remains unchanged', () => {
  // Restore only the old scalar step; do not change topology, targets or admission limits.
  const source = fs.readFileSync(new URL('./orientation-active-reference.mjs', import.meta.url), 'utf8');
  const current = '*sign/norm*(q.visits>count?.5:1)', previous = '*sign/norm';
  assert.equal(source.split(current).length, 2, 'Unique historical-step control');
  const oldStage = new Function(source.replace(current, previous).replace('export function runOrientationActiveReference', 'function runOrientationActiveReference') + ';return runOrientationActiveReference;')();
  const old = create(), fresh = create();
  old.orientationActiveKernel = {run(position, orientationQueue, orientationIterations) { return oldStage({...old, position, orientationQueue, orientationIterations}); }};
  const sentinel = new Float32Array(old.n * 2).fill(-77);
  assert.throws(() => solveArapSkin(old, target('refusal'), sentinel), /unresolved folded triangles: 1/);
  assert.ok(sentinel.every(x => x === -77), 'Refused output must stay atomic');
  assert.equal(old.orientationQueue.visits, old.areas.length * old.orientationIterations);
  assert.ok(old.stats.minimumAreaRatio < 0);
  const input = target('previous'), a = new Float32Array(input.length), b = a.slice();
  solveArapSkin(old, input, a); solveArapSkin(fresh, input, b);
  assert.deepEqual(a, b, 'The prior early-converging pose must retain exact output');
  assert.deepEqual(old.stats, fresh.stats);
  const expected = b.slice(); solveArapSkin(fresh, target('refusal'), b); solveArapSkin(fresh, input, b);
  assert.deepEqual(b, expected, 'No warm start or preceding-pose dependency');
});

test('contradictory pinned folds and nonfinite input still refuse without publishing output', () => {
  for (const fallback of [false, true]) {
    const scratch = createArapScratch([{x: 0, y: 0}, {x: 40, y: 0}, {x: 0, y: 40}], [0, 1, 2], 40, 40, {pins: [0, 1, 2]});
    if (fallback) scratch.orientationActiveKernel = null;
    const output = new Float32Array(6).fill(-77), input = new Float32Array([0, 0, 1, 0, 0, -1]);
    assert.throws(() => solveArapSkin(scratch, input, output), /unresolved folded/);
    assert.ok(output.every(x => x === -77));
    input[2] = NaN;
    assert.throws(() => solveArapSkin(scratch, input, output), /nonfinite target/);
    assert.ok(output.every(x => x === -77));
  }
});
