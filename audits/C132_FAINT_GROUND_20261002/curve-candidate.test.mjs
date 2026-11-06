import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorCurveCandidate, scaleWholeCurves} from './curve-candidate.mjs';
import {createHash} from 'node:crypto';
const hash = text => createHash('sha256').update(text).digest('hex');
const keys = value => [{ms: 0, t: 0, value: 0, ease: 'ease-out'}, {ms: 840, t: 1, value, ease: 'sine-in-out'}];
const fixture = () => ({tracks: {neck: keys(.43), head: keys(.52), jaw: keys(.12), root: keys(.02)}, root: {dx: keys(0), dy: keys(.01)}, secondary: [{joint: 'tail', keys: keys(.2)}], durationMs: 840, phases: [['fall', 840]], hash: 'original'});
const fitsGeometry = ({length, clearance, jawDepth}) => timeline => {
  const angle = timeline.tracks.neck[1].value + timeline.tracks.head[1].value;
  return length * Math.sin(angle) + jawDepth <= clearance;
};
test('already-safe short and long neck geometric controls preserve the exact original object and bytes', () => {
  for (const geometry of [{length: .08, clearance: .18, jawDepth: .025}, {length: .3, clearance: .38, jawDepth: .06}]) {
    const original = fixture(), bytes = JSON.stringify(original), result = authorCurveCandidate(original, ['neck', 'head'], fitsGeometry(geometry), hash);
    assert.equal(result.timeline, original); assert.equal(result.gain, 1); assert.equal(result.changed, false); assert.equal(JSON.stringify(original), bytes);
  }
});
test('a lower jaw can fail while its head centre is safe; one fixed nonzero gain changes only selected complete curves', () => {
  const original = fixture(), bytes = JSON.stringify(original), geometry = {length: .3, clearance: .26, jawDepth: .08};
  assert(fitsGeometry({...geometry, jawDepth: 0})(original)); assert(!fitsGeometry(geometry)(original));
  const result = authorCurveCandidate(original, ['neck', 'head'], fitsGeometry(geometry), hash);
  assert(result.gain > 0 && result.gain < 1); assert(fitsGeometry(geometry)(result.timeline));
  assert.equal(JSON.stringify(original), bytes); assert.deepEqual(result.timeline.root, original.root); assert.deepEqual(result.timeline.secondary, original.secondary);
  assert.deepEqual(result.timeline.tracks.jaw, original.tracks.jaw); assert.deepEqual(result.timeline.phases, original.phases);
  for (const joint of ['neck', 'head']) for (let i = 0; i < original.tracks[joint].length; i++) assert.deepEqual(result.timeline.tracks[joint][i], {...original.tracks[joint][i], value: original.tracks[joint][i].value * result.gain});
  assert(!fitsGeometry(geometry)(original), 'Restoring the retained original must fail the same checker');
});
test('impossible geometry refuses without deleting the pose, and selected secondaries scale continuously', () => {
  const original = fixture(), result = authorCurveCandidate(original, ['neck', 'head'], fitsGeometry({length: .3, clearance: .01, jawDepth: .02}), hash);
  assert.equal(result.timeline, original); assert.equal(result.gain, null); assert(result.refusal);
  const withSecondary = {...original, secondary: [...original.secondary, {joint: 'head', keys: keys(.4)}]}, changed = scaleWholeCurves(withSecondary, ['head'], .5, hash);
  assert.deepEqual(changed.secondary[1].keys, keys(.2)); assert.equal(scaleWholeCurves(withSecondary, ['head'], 1, hash), withSecondary);
  assert.throws(() => scaleWholeCurves(original, ['head'], NaN, hash));
});
