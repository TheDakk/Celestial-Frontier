import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { rolldown } from 'rolldown';

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-stage-contract-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));
const input = path.resolve(import.meta.dirname, '../../apps/game/src/battle2');
const bundle = await rolldown({ input: { stage: path.join(input, 'stage.ts'), arena: path.join(input, 'arena.ts') }, platform: 'node' });
try { await bundle.write({ dir: scratch, format: 'es', entryFileNames: '[name].mjs' }); } finally { await bundle.close(); }
const { BattleStage, GUARDIAN_FRAME_FILL } = await import(pathToFileURL(path.join(scratch, 'stage.mjs')));
const { composeArena, combatantScale } = await import(pathToFileURL(path.join(scratch, 'arena.mjs')));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
function node() {
  const n = { x: 0, y: 0, alpha: 1, visible: true, text: '', children: [], destroyed: false };
  n.scale = { x: 1, y: 1, set(x, y) { this.x = x; this.y = y; } };
  n.anchor = { set() {} };
  n.addChild = child => { n.children.push(child); return child; };
  n.removeChild = child => { n.children.splice(n.children.indexOf(child), 1); };
  n.destroy = () => { n.destroyed = true; };
  n.clear = n.rect = n.fill = () => n;
  return n;
}
function fixture(options = {}, guardian = false) {
  let wall = 0, cpu = 0, allocated = 0;
  const frames = [], calls = { left: [], right: [] }, sides = ['left', 'right'];
  const rigs = Object.fromEntries(sides.map(side => [side, {
    recipeHash: side, templateId: 'quadruped', kind: 'portrait', label: side, parts: [], root: node(),
    bounds: { width: .4, height: .5, groundLineY: .8 }, cutout: { width: 1, height: 1 }, foot: { x: .3, y: .8 }, bodyLength: .5, stanceReach: .2,
    ...(guardian ? { guardian: {}, tallestHeight: .7 } : {}),
    applyPose(pose, context) { calls[side].push({ pose, context }); cpu += side === 'left' ? 3 : 5; }, dispose() {},
  }]));
  const texture = { width: 1024, height: 576 }, plates = { far: texture, mid: texture, near: texture };
  const layout = composeArena({ id: 'contract', groundLineNormalized: .8, plates }, { width: 1024, height: 576 });
  const base = { factory: { container: make, sprite: make, text: make, graphics: make }, clock: () => wall, layout, plates, rigs, masses: { left: 1, right: 2 } };
  function make() { allocated++; return node(); }
  const timing = { now: () => (cpu += .125), sample: sample => frames.push(sample) };
  const stage = new BattleStage({ ...base, ...options, ...(options.timing === true ? { timing } : {}) });
  const holder = side => stage.root.children.find(n => n.children.includes(rigs[side].root));
  const turn = (side = 'left', reducedMotion = false) => ({ seed: 7, attacker: { side, mass: base.masses[side], card: null, seed: 1, label: side }, target: { side: side === 'left' ? 'right' : 'left', mass: 1, card: null, seed: 2, label: 'target' }, delivery: 'melee', theme: 'wild', outcome: 'hit', damage: 3, critical: false, targetFaints: false, effect: null, arena: { groundLineY: layout.groundLineY, stands: layout.stands }, readyMs: 600, commandMs: 300, reducedMotion });
  return { stage, base, rigs, holder, turn, frames, calls, setTime: value => { wall = value; }, allocations: () => allocated };
}
function expectedScale(f, side) {
  const rig = f.rigs[side];
  return combatantScale(rig.bounds, rig.cutout.height, f.base.masses[side], f.base.layout.frame.height,
    rig.guardian ? { frameFill: GUARDIAN_FRAME_FILL, tallestHeight: rig.tallestHeight } : {}).scale;
}

test('explicit scales govern the actual holder transform, width and cadence, and are copied', () => {
  const scales = { left: 120, right: 90 }, f = fixture({ presentationScales: scales });
  scales.left = 999;
  for (const side of ['left', 'right']) {
    const expected = side === 'left' ? 120 : 90, h = f.holder(side), rig = f.rigs[side];
    close(Math.abs(h.scale.x), expected); close(h.scale.y, expected);
    close(f.stage.halfWidths()[side], rig.bounds.width * expected / (2 * 1024));
    // An off-centre actual mesh point uses exactly the declared foot and scale.
    close(h.y + h.scale.y * (rig.root.y + .25), f.base.layout.stands[side].y * 576 + expected * (.25 - rig.foot.y));
    const plan = f.stage.play(f.turn(side));
    close(plan.cadence.bodyLength, rig.bodyLength * expected / 1024);
  }
});

test('omitted scales retain exact ordinary and guardian arithmetic and turn output', () => {
  for (const guardian of [false, true]) {
    const oldDefault = fixture({}, guardian), scales = Object.fromEntries(['left', 'right'].map(side => [side, expectedScale(oldDefault, side)]));
    const explicit = fixture({ presentationScales: scales }, guardian);
    assert.deepEqual(oldDefault.stage.halfWidths(), explicit.stage.halfWidths());
    for (const side of ['left', 'right']) close(Math.abs(oldDefault.holder(side).scale.x), scales[side]);
    assert.deepEqual(oldDefault.stage.play(oldDefault.turn()), explicit.stage.play(explicit.turn()));
    for (const time of [0, 700, 1100, 1900]) {
      oldDefault.setTime(time); explicit.setTime(time);
      assert.deepEqual(oldDefault.stage.tick(), explicit.stage.tick());
      assert.deepEqual(oldDefault.calls, explicit.calls);
    }
  }
});

test('invalid or incomplete presentation scales refuse before the stage can render', () => {
  for (const value of [0, -1, NaN, Infinity, undefined, '120']) {
    for (const side of ['left', 'right']) assert.throws(() => fixture({ presentationScales: { left: 1, right: 1, [side]: value } }), /finite and positive/);
  }
});

test('timing records constructor rest, play implicit ticks, transitions and both actual rig sides', () => {
  const f = fixture({ timing: true });
  assert.equal(f.frames.length, 1); assert.equal(f.frames[0].kind, 'rest');
  f.stage.play(f.turn('left')); f.setTime(300); f.stage.tick();
  f.stage.play(f.turn('right')); f.setTime(350); f.stage.tick();
  assert.equal(f.frames.length, 5);
  for (const event of f.frames) {
    close(event.rigMs.left, 3.125); close(event.rigMs.right, 5.125);
    close(event.sampleTurnMs, event.kind === 'rest' ? 0 : .125);
  }
  // A transition frame charges both play() and tick(), without dividing shared sampling.
  const transition = f.frames.slice(-2);
  close(transition.reduce((sum, e) => sum + e.sampleTurnMs + e.rigMs.left, 0), 6.5);
  close(transition.reduce((sum, e) => sum + e.sampleTurnMs + e.rigMs.right, 0), 10.5);
});

test('reduced-motion play rest is measured but ticks do not fabricate rig updates', () => {
  const f = fixture({ timing: true });
  f.stage.play(f.turn('left', true)); f.stage.tick();
  assert.deepEqual(f.frames.map(e => e.kind), ['rest', 'rest', 'tick', 'tick']);
  for (const event of f.frames.slice(2)) assert.deepEqual(event.rigMs, { left: 0, right: 0 });
  assert.deepEqual(Object.values(f.calls).map(c => c.length), [2, 2]);
});
