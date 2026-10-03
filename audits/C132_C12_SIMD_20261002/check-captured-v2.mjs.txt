import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
import { resolve } from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';
import { createArapScratch, solveArapSkin } from '../../port/v2/tools/creature-animation/arap-skin.mjs';
import { ARAP_SWEEP_BYTES as baselineBytes } from '../../port/v2/tools/creature-animation/arap-sweep-bytes.mjs';
import { ARAP_SWEEP_BYTES as candidateBytes } from '../C132_C12_20261001/arap-sweep-bytes.mjs';
import { familyContractForRecord } from '../../port/v2/tools/creature-animation/family-contracts.mjs';
import { createSkeletonPoseProgram } from '../../port/v2/tools/creature-animation/skeleton-pose.mjs';
import { createCompiledSkinField, applyCompiledSkinField } from '../../port/v2/tools/creature-animation/compiled-skin-field.mjs';
import { applyPaintPart, paintPartAreas, assertPaintPartShape } from '../../port/v2/tools/creature-animation/paint-skin.mjs';
import { compileRigidParentFrames, applyRigidParentFrames } from '../../port/v2/tools/creature-animation/rigid-parent-frame.mjs';

registerHooks({ resolve });
const { compileBodyCard } = await import('../../port/v2/apps/game/src/motion/body-card.ts');
const { makeClip, sampleClip, addPose } = await import('../../port/v2/apps/game/src/battle2/choreography.ts');
const { createFamilyContactSolver } = await import('../../port/v2/apps/game/src/creature-rig-contact.ts');
const root = path.resolve(import.meta.dirname, '../..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p)));
const sha = b => createHash('sha256').update(b).digest('hex');
const bytes = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength);
const capturePath = 'audits/C132_C12_20261001/native-baseline-correct-fit-02/report.json';
const capture = read(capturePath), event = capture.capture.refusalLog[0], turn = capture.gates.turns[event.turn];
const fit = 'audits/ARCHETYPE_FINISH_20260923/12-myriapod/fit-11';
const record = read(fit + '/record.json'), binding = read(fit + '/binding.json'), skin = binding.paintSkin;
const { width, height } = record.geometry;
const sources = [fit + '/record.json', fit + '/binding.json', 'audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json'];
for (const p of sources) assert.equal(sha(fs.readFileSync(path.join(root, p))), capture.sources.find(s => s.path === p).sha256);
const previous = read('audits/C132_C12_REPAIR_20261002/candidate-check.json');
const card = compileBodyCard(record, record.genome), definition = familyContractForRecord(record);
const skeleton = createSkeletonPoseProgram(definition, record.landmarks);
const field = createCompiledSkinField(skin, width, height), solver = createFamilyContactSolver(record);
const groups = compileRigidParentFrames(skin, binding.parts, definition, width, height);
const seed = (read(sources[2]).seed ^ 2) >>> 0;
const actor = { side: 'right', mass: card.massClass.multiplier, card, seed: 2, label: 'Centipede' };
const idle = makeClip(actor, 'idle', seed), approach = makeClip(actor, 'approach', seed);
const perCycle = event.context.stageDisplacement / (event.context.elapsedMs / event.context.durationMs - .5);
const native = globalThis.WebAssembly;
function scratch(binary, vertices = skin.vertices, triangles = skin.triangles, w = width, h = height, options = skin.solver) {
  function Module(b) { return new native.Module(Buffer.from(b).equals(Buffer.from(baselineBytes)) ? binary : b); }
  Module.imports = native.Module.imports; Module.exports = native.Module.exports;
  try {
    globalThis.WebAssembly = { Module, Instance: native.Instance, Memory: native.Memory };
    return createArapScratch(vertices, triangles, w, h, options);
  } finally { globalThis.WebAssembly = native; }
}
const baseline = scratch(baselineBytes), candidate = scratch(candidateBytes);
assert.equal(baseline.sweepBackend, 'wasm'); assert.equal(candidate.sweepBackend, 'wasm');
const parts = skin.parts.map(p => ({ p, areas: paintPartAreas(p, skin) }));
let paintedParts = 0, hardPins = 0;
function solve(s, target) {
  const saved = target.slice(), output = target.slice();
  const result = solveArapSkin(s, target, output);
  assert(bytes(target).equals(bytes(saved)), 'target must remain immutable');
  for (let i = 0; i < s.n; i++) if (s.pins[i]) {
    assert.equal(output[i * 2], target[i * 2]); assert.equal(output[i * 2 + 1], target[i * 2 + 1]); hardPins++;
  }
  return { result, output };
}
const frames = capture.capture.frameSamples.filter(f => f.turn === 1 && f.phase === 'approach');
const extras = [-8, -4, -2, -1, -.25, .25, 1, 2, 4, 8].map(d => ({ localMs: event.ms - turn.offsetMs + d, ms: event.ms + d }));
const measurements = [];
for (const frame of [...frames, ...extras]) {
  const local = frame.localMs, k = ((local - turn.beats.commandEnd) / 420) % 1;
  const context = frame.ms === event.ms ? event.context : { ...event.context, elapsedMs: k * 420, stageDisplacement: perCycle * (k - (k >= .5 ? .5 : 0)) };
  const pose = addPose(sampleClip(idle, local), sampleClip(approach, context.elapsedMs));
  const resolved = solver.resolve(pose, { ...context, realm: card.realm }).pose;
  const matrices = skeleton.evaluate(resolved), target = new Float32Array(skin.vertices.length * 2);
  applyCompiledSkinField(field, matrices, target);
  assert.equal(sha(bytes(target)), previous.measurements.find(r => r.ms === frame.ms).targetSha256, 'same real captured target');
  const a = solve(baseline, target), b = solve(candidate, target);
  assert.deepEqual(a.result, b.result); assert(bytes(a.output).equals(bytes(b.output)), 'complete published field bytes');
  assert.deepEqual(baseline.stats, candidate.stats);
  for (const name of ['position', 'target', 'rotation', 'rhs']) assert(bytes(baseline[name]).equals(bytes(candidate[name])), name + ' exact state');
  for (const name of ['heap', 'location', 'priority']) assert(bytes(baseline.orientationQueue[name]).equals(bytes(candidate.orientationQueue[name])), name + ' exact queue');
  for (const name of ['size', 'projections', 'visits', 'stalled']) assert.equal(baseline.orientationQueue[name], candidate.orientationQueue[name], name + ' queue metadata');
  const positions = Object.fromEntries(parts.map(({ p }) => {
    const dest = new Float32Array(p.vertices.length * 2); applyPaintPart(p, b.output, dest); return [p.id, dest];
  }));
  applyRigidParentFrames(groups, matrices, positions);
  for (const { p, areas } of parts) { assertPaintPartShape(p, skin, positions[p.id], width, height, areas); paintedParts++; }
  measurements.push({ ms: frame.ms, targetSha256: sha(bytes(target)), outputSha256: sha(bytes(b.output)), visits: candidate.orientationQueue.visits });
}
const controls = [];
for (const binary of [baselineBytes, candidateBytes]) {
  const s = scratch(binary, [{ x: 1, y: 1 }, { x: 9, y: 1 }, { x: 1, y: 9 }], [0, 1, 2], 10, 10, { pins: [0, 1, 2] });
  const target = new Float32Array([.1, .1, .9, .1, .1, -.9]), output = new Float32Array(6).fill(-77), saved = output.slice();
  assert.throws(() => solveArapSkin(s, target, output), /unresolved folded triangles/);
  assert(bytes(output).equals(bytes(saved)), 'refusal publication stays atomic');
  target[2] = NaN; assert.throws(() => solveArapSkin(s, target, output), /nonfinite target/);
}
controls.push('contradictory pinned fold refuses atomically in both kernels', 'nonfinite input refuses in both kernels');
const signedZero = new Float64Array([-0, 1]), mutant = signedZero.slice(); mutant[0] = 0;
assert(!bytes(signedZero).equals(bytes(mutant)));
const oneBit = signedZero.slice(); new Uint8Array(oneBit.buffer)[9] ^= 1;
assert(!bytes(signedZero).equals(bytes(oneBit))); controls.push('byte comparison independently distinguishes signed zero and one-bit mutations');
const report = {
  schema: 'cf.c132-centipede-simd-captured-parity/v1', status: 'PASS_EXACT_NATIVE_PENDING',
  scope: 'Same 56 captured/adjacent real Centipede targets after bounded orientation correction; exact output and solver state. No native timing or whole-library claim.',
  capture: { path: capturePath, sha256: sha(fs.readFileSync(path.join(root, capturePath))) },
  baselineModuleSha256: sha(baselineBytes), candidateModuleSha256: sha(candidateBytes),
  verifierSha256: sha(fs.readFileSync(new URL('./check-captured.mjs', import.meta.url))),
  targets: measurements.length, paintedParts, hardPins, controls, measurements,
};
fs.writeFileSync(new URL('./captured-parity-v2.json', import.meta.url), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, targets: report.targets, paintedParts, hardPins }));
