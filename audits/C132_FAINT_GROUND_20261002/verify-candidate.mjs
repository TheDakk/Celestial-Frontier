import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {registerHooks, createRequire} from 'node:module';
import {resolve} from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';
registerHooks({resolve});
const {compileBodyCard} = await import('../../port/v2/apps/game/src/motion/body-card.ts');
const {withPaintedContactSupports} = await import('../../port/v2/apps/game/src/motion/painted-supports.ts');
const {buildTimeline, fnv1a} = await import('../../port/v2/apps/game/src/motion/timeline.ts');
const {buildTurnPlan, sampleTurn, sampleClip} = await import('../../port/v2/apps/game/src/battle2/choreography.ts');
const {createPaintPublication} = await import('./paint-publication.mjs');
const {authorCurveCandidate} = await import('./curve-candidate.mjs');
const {rasterPaint} = await import('./render-mesh.mjs');
const {traceBelowGround} = await import('./paint-pixel-trace.mjs');
const {createOpaqueSeamSamplingGuard, applyOpaqueSeamSamplingGuard} = await import('../../port/v2/tools/creature-animation/seam-sampling-guard.mjs');
const require = createRequire(new URL('../../port/v2/package.json', import.meta.url)), {PNG} = require('pngjs');
const dir = import.meta.dirname, repo = path.resolve(dir, '../..');
const read = p => JSON.parse(fs.readFileSync(path.join(repo, p))), sha = b => createHash('sha256').update(b).digest('hex');
const prefix = 'audits/C132_FAINT_GROUND_20261002';
const manifest = read(prefix + '/input-manifest.json');
for (const f of manifest.inputs) assert.equal(sha(fs.readFileSync(path.join(repo, f.path))), f.sha256);
const captureBytes = fs.readFileSync(path.join(os.homedir(), 'Projects/celestial-frontier-anthropic-mac/audits/G1_AUTO_AUTHOR_20260926/native-g2c136/03-alligator/report.json'));
assert.equal(sha(captureBytes), manifest.captureSha256);
const capture = JSON.parse(captureBytes), capturedTurn = capture.gates.turns[3];
const sourcePaths = [
  'port/v2/apps/game/src/motion/body-card.ts', 'port/v2/apps/game/src/motion/painted-supports.ts',
  'port/v2/apps/game/src/motion/timeline.ts', 'port/v2/apps/game/src/motion/stance-envelope.ts',
  'port/v2/apps/game/src/motion/grounded-quadruped.ts', 'port/v2/apps/game/src/battle2/choreography.ts',
  'port/v2/apps/game/src/creature-rig.ts', 'port/v2/apps/game/src/creature-rig-contact.ts',
  ...['family-contracts', 'skeleton-pose', 'compiled-skin-field', 'arap-skin', 'paint-skin', 'rigid-parent-frame', 'seam-sampling-guard', 'orientation-projector', 'orientation-active-reference', 'wasm-orientation-active', 'orientation-active-bytes', 'wasm-orientation-forward', 'orientation-forward-bytes', 'wasm-arap-sweep', 'arap-sweep-bytes'].map(n => 'port/v2/tools/creature-animation/' + n + '.mjs'),
  ...['paint-publication', 'curve-candidate', 'render-mesh', 'paint-pixel-trace', 'verify-candidate'].map(n => prefix + '/' + n + '.mjs'),
  'audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json',
];
const sourcePins = sourcePaths.map(p => ({path: p, sha256: sha(fs.readFileSync(path.join(repo, p)))}));
const record = read(prefix + '/inputs/fit/record.json'), binding = read(prefix + '/inputs/fit/binding.json');
const card = withPaintedContactSupports(compileBodyCard(record, record.genome), record, binding);
const original = buildTimeline(card, 'faint', card.identity.seed), publication = createPaintPublication(record, binding, card.realm);
const joints = card.parts.filter(p => p.joint === 'head' || /^neck\d*$/.test(p.joint)).map(p => p.joint);
assert.deepEqual(joints, ['neck', 'head']);
const scopedParts = binding.parts.filter(p => card.parts.find(b => b.joint === p.joint)?.group === 'head').map(p => p.id);
assert.deepEqual([...scopedParts].sort(), ['head', 'jaw', 'neck'], 'Exact nonempty captured head-paint inventory required');
const seed = read('audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json').seed;
const plans = ['left', 'right'].map(side => {
  const other = side === 'left' ? 'right' : 'left';
  const actor = s => ({side: s, mass: card.massClass.multiplier, card, seed: s === 'left' ? 1 : 2, label: 'source-bound diagnostic'});
  const base = buildTurnPlan({seed, attacker: actor(other), target: actor(side), delivery: 'melee', theme: 'wild', outcome: 'hit', damage: 21, targetFaints: true, effect: null, readyMs: 600, commandMs: 300, arena: {groundLineY: .78, stands: capture.gates.stands}});
  // Exact captured target timing; attacker action/run-up is irrelevant to target
  // pose. The actual sampleTurn owns idle fade, hitstop and final settle.
  return {...base, beats: capturedTurn.beats};
});
const phase = elapsedMs => ({actionId: 'faint', elapsedMs, durationMs: original.durationMs, weight: 1});
function samples(timeline, elapsedMs) {
  const clip = {source: 'timeline', timeline};
  return [{mode: 'standalone', facing: 1, pose: sampleClip(clip, elapsedMs), context: phase(elapsedMs)}, ...plans.map(plan => {
    const p = {...plan, clips: {...plan.clips, target: {...plan.clips.target, reaction: clip}}};
    const target = sampleTurn(p, p.beats.reactionStart + elapsedMs).target;
    return {mode: 'actual-layered-' + plan.target.side, ...target};
  })];
}
const headClearance = out => Math.min(...out.extrema.filter(e => scopedParts.includes(e.part)).map(e => e.clearancePx));
const sampleTimes = [original.durationMs, ...Array.from({length: 65}, (_, i) => original.durationMs * i / 64)];
let authorPublications = 0;
const fits = timeline => {
  for (const t of sampleTimes) for (const s of samples(timeline, t)) {
    const out = publication.publish(s.pose, s.context); authorPublications++;
    if (headClearance(out) < 2) return false;
  }
  return true;
};
const before = performance.now(), candidate = authorCurveCandidate(original, joints, fits, fnv1a), authorMs = performance.now() - before;
assert.equal(candidate.changed, true); assert(candidate.gain > 0 && candidate.gain < 1);
const rows = [], denseStart = performance.now();
for (const [name, timeline] of [['original', original], ['candidate', candidate.timeline]]) {
  const modes = new Map();
  const times = [...Array.from({length: Math.ceil(original.durationMs) + 1}, (_, i) => Math.min(i, original.durationMs)), original.durationMs - .001, original.durationMs + .001, 1500, 1499.9999999999993];
  for (const elapsedMs of times) for (const sample of samples(timeline, elapsedMs)) {
    const out = publication.publish(sample.pose, sample.context), key = sample.mode;
    const value = modes.get(key) ?? {mode: key, facing: sample.facing, samples: 0, minimumHeadClearancePx: Infinity, minimumAllPaintClearancePx: Infinity, maximumContactError: 0, maximumPublishedContactDriftPx: 0, worst: null, worstAllPaint: null};
    value.samples++;
    value.maximumContactError = Math.max(value.maximumContactError, out.contactError);
    value.maximumPublishedContactDriftPx = Math.max(value.maximumPublishedContactDriftPx, ...out.publishedContacts.map(c => c.driftPx));
    const worstAll = out.extrema.reduce((a, b) => a.clearancePx < b.clearancePx ? a : b);
    if (worstAll.clearancePx < value.minimumAllPaintClearancePx) { value.minimumAllPaintClearancePx = worstAll.clearancePx; value.worstAllPaint = {elapsedMs, ...worstAll}; }
    const minimum = headClearance(out);
    if (minimum < value.minimumHeadClearancePx) { value.minimumHeadClearancePx = minimum; value.worst = {elapsedMs, ...out.extrema.filter(e => scopedParts.includes(e.part)).sort((a,b) => a.clearancePx - b.clearancePx)[0]}; }
    modes.set(key, value);
  }
  rows.push({name, modes: [...modes.values()]});
}
assert(rows[0].modes.every(m => m.minimumHeadClearancePx < -100), 'Retained original must fail');
assert(rows[1].modes.every(m => m.minimumHeadClearancePx >= 2), 'Dense candidate must retain clearance');
assert(rows[1].modes.some(m => m.minimumAllPaintClearancePx < 0), 'Head-only repair must retain the separate body-paint failure');
const untouched = ['root', 'phases', 'durationMs', 'bodyMs', 'limitsRad', 'deform', 'stanceEnvelope', 'secondary'];
for (const k of untouched) assert.deepEqual(candidate.timeline[k], original[k], k + ' unchanged');
for (const [joint, keys] of Object.entries(original.tracks)) if (!joints.includes(joint)) assert.deepEqual(candidate.timeline.tracks[joint], keys);
for (const joint of joints) for (let i = 0; i < original.tracks[joint].length; i++) {
  const a = original.tracks[joint][i], b = candidate.timeline.tracks[joint][i];
  assert.deepEqual({...b, value: a.value}, a); assert.equal(b.value, a.value * candidate.gain);
}
const atlas = PNG.sync.read(fs.readFileSync(path.join(dir, 'inputs/fit/parts/atlas/03-alligator.png')));
const keyed = PNG.sync.read(fs.readFileSync(path.join(dir, 'inputs/fit/parts/keyed.png')));
let alphaTop = keyed.height;
for (let y = 0; y < keyed.height && alphaTop === keyed.height; y++) for (let x = 0; x < keyed.width; x++) if (keyed.data[(y * keyed.width + x) * 4 + 3] > 8) { alphaTop = y; break; }
const stageScales = Object.fromEntries(['left', 'right'].map(side => [side, capture.gates.restFill[side] * capture.gates.frame.height / (record.geometry.groundLineY - alphaTop / record.geometry.height)]));
const stagePoint = (x, y, side) => ({x: capture.gates.stands[side].x * capture.gates.frame.width + (side === 'left' ? 1 : -1) * (x - record.landmarks.root[0]) * stageScales[side], y: capture.gates.stands[side].y * capture.gates.frame.height + (y - record.geometry.groundLineY) * stageScales[side]});
for (const row of rows) for (const mode of row.modes) if (mode.mode.startsWith('actual-layered-')) { const side = mode.mode.split('-').at(-1); mode.worst.stage = stagePoint(mode.worst.x, mode.worst.y, side); mode.worstAllPaint.stage = stagePoint(mode.worstAllPaint.x, mode.worstAllPaint.y, side); }
const samplingGuard = createOpaqueSeamSamplingGuard({record, binding, atlas: {width: atlas.width, height: atlas.height, rgba: atlas.data}});
const guardedAtlas = {...atlas, data: applyOpaqueSeamSamplingGuard(atlas.data, atlas.width, atlas.height, samplingGuard)};
const held = [];
for (const [name, timeline] of [['original', original], ['candidate', candidate.timeline]]) {
  const sample = samples(timeline, 1500).find(s => s.mode === 'actual-layered-right'), out = publication.publish(sample.pose, sample.context);
  held.push({name, extrema: out.extrema.map(e => ({...e, stageRight: stagePoint(e.x, e.y, 'right')})), resolved: out.resolved, belowGroundPaint: out.extrema.filter(e => e.clearancePx < 0).map(e => { const trace = traceBelowGround(record, binding, atlas, out.positions, e.part); if (trace.deepest) trace.deepest.stageRight = stagePoint(trace.deepest.publishedX, trace.deepest.publishedY, 'right'); return trace; })});
  for (const facing of [1, -1]) fs.writeFileSync(path.join(dir, name + '-held-' + (facing === 1 ? 'left' : 'right') + '.png'), PNG.sync.write(rasterPaint(record, binding, guardedAtlas, out.positions, facing)));
}
for (const f of manifest.inputs) assert.equal(sha(fs.readFileSync(path.join(repo, f.path))), f.sha256);
for (const f of sourcePins) assert.equal(sha(fs.readFileSync(path.join(repo, f.path))), f.sha256, 'Source drift');
fs.writeFileSync(path.join(dir, 'original-faint.json'), JSON.stringify(original, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'candidate-faint.json'), JSON.stringify(candidate.timeline, null, 2) + '\n');
const report = {
  schema: 'cf.c132-faint-ground-candidate/v1', status: 'HEAD_CLEARANCE_CANDIDATE_WHOLE_PAINT_HELD', runtimeChanged: false, nativeRun: false, visualAcceptance: false,
  limitations: ['Audit-only author invokes full contact/skin/ARAP publication and is not wired into runtime.', 'Dense one-millisecond sampling is not a mathematical all-times proof.', 'A separate spine-owned painted fragment remains below ground; no complete Alligator repair or gallery acceptance.', 'Other safe creature geometries and all idle start phases remain unqualified.'],
  captureSha256: manifest.captureSha256, sourcePins, recordRecipeHash: record.recipeHash, bindingHash: binding.bindingHash,
  scopedParts, joints, gain: candidate.gain, clearanceReserveSourcePx: 2, originalDurationMs: original.durationMs, authorPublications, authorMs, verificationMs: performance.now() - denseStart,
  rigidParentGroups: publication.rigidParents, stageCoordinates: {frame: capture.gates.frame, stands: capture.gates.stands, alphaTop, stageScales, groundPixels: .78 * capture.gates.frame.height, policy: 'Source-normalized mesh, actual captured stands and scale reconstructed from actual restFill + source alphaBox (>8), before common stage-root camera shake; held pose shake is zero.'}, samplingGuard: samplingGuard.receipt, rows, held,
  preserved: untouched.concat('all other tracks', 'each key time/ease', 'all five input hashes', 'ground/supports/contact/shape/ARAP limits'),
};
fs.writeFileSync(path.join(dir, 'candidate-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({status: report.status, gain: report.gain, authorMs, authorPublications, rows}, null, 2));
