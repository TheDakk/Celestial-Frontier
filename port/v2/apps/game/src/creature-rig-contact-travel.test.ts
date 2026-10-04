import fs from 'node:fs';
import {afterAll, expect, it, vi} from 'vitest';
import {createFamilyContactSolver, observedContactSupports, predictContactSupport, type ContactPhase} from './creature-rig-contact.js';
import type {CreaturePoseV1} from './creature-rig.js';
import {compileBodyCard} from './motion/body-card.js';
import {actionsFor} from './motion/family-actions.js';
import {buildTimeline, sampleKeys} from './motion/timeline.js';
import {createGsapPlayer} from './motion/gsap-adapter.js';
import {blendCreaturePoses, closedLoopPose} from './motion-pose-blend.js';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {createFullRowSchedule} from '../../../tools/animation-completion/review-schedule.mjs';

const root = new URL('../../../../../', import.meta.url);
const read = (name: string) => JSON.parse(fs.readFileSync(new URL('audits/ARCHETYPE_FINISH_20260923/04-insect/fit-04/' + name, root), 'utf8'));
const record = read('record.json'), binding = read('binding.json');
const card = compileBodyCard(record, record.genome), template = contracts.familyContractForRecord(record);
const program = createSkeletonPoseProgram(template, record.landmarks);
const supports = observedContactSupports(record, binding);
const timelines = Object.fromEntries(Object.keys(actionsFor(card.template.id, card.anatomy)!).map(id => [id, buildTimeline(card, id, record.identity.seed)]));
const readers = new Map<string, {sample(ms: number): CreaturePoseV1; stop(): void}>();
function sample(id: string, ms: number): CreaturePoseV1 {
  let reader = readers.get(id);
  if (!reader) {
    let pose: Record<string, {rotation: number; dx: number; dy: number}> = {};
    const player = createGsapPlayer(timelines[id]!, {setJoint(joint, rotation, dx, dy) { pose[joint] = {rotation, dx, dy}; }}, {now: () => 0});
    reader = {sample(at) { pose = {}; player.seek(at); return pose; }, stop() { player.stop(); }};
    readers.set(id, reader);
  }
  return reader.sample(ms);
}
afterAll(() => { for (const reader of readers.values()) reader.stop(); });
const phase = (id: string, ms: number, extra: Partial<ContactPhase> = {}): ContactPhase => ({actionId: id, elapsedMs: ms, durationMs: timelines[id]!.durationMs, realm: card.realm, ...extra});
const makeSolver = () => createFamilyContactSolver(record, supports);
type Solver = ReturnType<typeof makeSolver>;
type Solved = ReturnType<Solver['resolve']>;
// GSAP rounds its sampled root to six decimals. Preserve that actual input
// residual when checking the canonical travel curve, without relaxing gates.
function expectedDx(input: CreaturePoseV1, context: ContactPhase, planned: number) {
  return planned + (input.root?.dx ?? 0) - sampleKeys(timelines[context.actionId]!.root.dx, context.elapsedMs) * (context.weight ?? 1);
}

// Independently evaluate the published skeleton and exact source-bound support.
// A travel assertion cannot pass by dropping feet or relaxing numerical limits.
function physical(solver: Solver, solved: Solved) {
  expect(solved.contacts.map(c => c.joint).sort()).toEqual(Object.keys(supports).sort());
  expect(solved.contacts).toHaveLength(6);
  expect(solved.maxError).toBeLessThanOrEqual(1e-8);
  expect(solved.compression).toBeDefined();
  expect(solved.compression!).toBeLessThanOrEqual(solver.scaleLength * .08);
  const matrices = program.evaluate(solved.pose);
  for (const contact of solved.contacts) {
    const chain = solver.chains.find(c => c.end === contact.joint)!;
    const actual = predictContactSupport(supports[contact.joint]!, matrices);
    expect(Math.hypot((actual.x - contact.paintedTarget.x) * record.geometry.width, (actual.y - contact.paintedTarget.y) * record.geometry.height), contact.joint).toBeLessThanOrEqual(.25);
    for (const joint of [chain.knee, chain.end]) {
      const deg = solved.pose[joint]!.rotation * 180 / Math.PI;
      const limit = (template.contactLimitsDeg ?? template.limitsDeg)[joint]!;
      expect(deg, joint).toBeGreaterThanOrEqual(limit.min - 1e-7);
      expect(deg, joint).toBeLessThanOrEqual(limit.max + 1e-7);
    }
  }
}
function translatedTargets(solver: Solver, solved: Solved, displacement: number) {
  for (const contact of solved.contacts) {
    const rest = solver.chains.find(c => c.end === contact.joint)!.endPoint;
    expect(contact.target.x).toBeCloseTo(rest.x + displacement, 12);
    expect(contact.target.y).toBeCloseTo(rest.y, 12);
  }
}

it('integrates signed hit intervals at their canonical waypoints instead of a positive duration-wide stride', () => {
  const solver = makeSolver(), timeline = timelines.hit!, keys = timeline.root.dx;
  expect(keys.map(k => Math.sign(k.value))).toEqual([0, -1, -1, 0]);
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]!, b = keys[i]!, ms = (a.ms + b.ms) / 2;
    const middleInput = sample('hit', ms), middlePhase = phase('hit', ms);
    const middle = solver.resolve(middleInput, middlePhase);
    physical(solver, middle);
    expect(middle.pose.root!.dx).toBeCloseTo(expectedDx(middleInput, middlePhase, (a.value + b.value) / 2), 12);
    expect(Math.sign(b.value - a.value)).toBe(i === keys.length - 1 ? 1 : -1);
    const waypointInput = sample('hit', b.ms), waypointPhase = phase('hit', b.ms);
    const waypoint = solver.resolve(waypointInput, waypointPhase);
    physical(solver, waypoint);
    expect(waypoint.pose.root!.dx).toBeCloseTo(expectedDx(waypointInput, waypointPhase, b.value), 12);
    translatedTargets(solver, waypoint, b.value * program.bodyLength);
  }
  const settled = solver.resolve(sample('hit', timeline.durationMs), phase('hit', timeline.durationMs));
  expect(settled.pose.root!.dx).toBe(0);
  expect(settled.contacts.every(c => c.stance)).toBe(true);
});

it('keeps every tame hold interval planted at its completed forward displacement without modulo drift', () => {
  const solver = makeSolver(), timeline = timelines.tame!, keys = timeline.root.dx;
  expect(keys[1]!.value).toBeGreaterThan(0);
  const movingMs = keys[1]!.ms / 4;
  const movingInput = sample('tame', movingMs), movingPhase = phase('tame', movingMs);
  const moving = solver.resolve(movingInput, movingPhase);
  physical(solver, moving);
  expect(moving.pose.root!.dx).toBeCloseTo(expectedDx(movingInput, movingPhase, keys[1]!.value / 4), 12);
  expect(moving.contacts.some(c => !c.stance)).toBe(true);
  for (let i = 2; i < keys.length; i++) {
    const a = keys[i - 1]!, b = keys[i]!, ms = (a.ms + b.ms) / 2;
    expect(b.value).toBe(a.value);
    const holdInput = sample('tame', ms), holdPhase = phase('tame', ms);
    const hold = solver.resolve(holdInput, holdPhase);
    physical(solver, hold);
    expect(hold.pose.root!.dx).toBeCloseTo(expectedDx(holdInput, holdPhase, a.value), 12);
    expect(hold.contacts.every(c => c.stance)).toBe(true);
    translatedTargets(solver, hold, a.value * program.bodyLength);
  }
  const heldInput = sample('tame', timeline.durationMs * 2), heldPhase = phase('tame', timeline.durationMs * 2);
  const held = solver.resolve(heldInput, heldPhase);
  physical(solver, held);
  expect(held.pose.root!.dx).toBeCloseTo(expectedDx(heldInput, heldPhase, keys.at(-1)!.value), 12);
  expect(held.contacts.every(c => c.stance)).toBe(true);
  translatedTargets(solver, held, keys.at(-1)!.value * program.bodyLength);
});

const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
const schedule = createFullRowSchedule(timelines);
const tameRow = schedule.rows.find((row: {id: string}) => row.id === 'tame')!;
function finalTame(ms: number) {
  const idle = closedLoopPose(at => sample('idle', at), ms, timelines.idle!.durationMs);
  if (ms >= tameRow.endMs) return {pose: idle, phase: phase('idle', ms, {weight: 1})};
  const age = ms - tameRow.startMs, weight = Math.min(smooth(age / 120), smooth((tameRow.endMs - ms) / 160));
  const elapsed = Math.max(0, age - 120);
  return {pose: blendCreaturePoses(idle, sample('tame', elapsed), weight), phase: phase('tame', elapsed, {weight})};
}
it('returns final tame presentation travel continuously to rest before the idle boundary', () => {
  const solver = makeSolver(), end = tameRow.endMs, finalDx = timelines.tame!.root.dx.at(-1)!.value;
  let previous = finalDx;
  for (const remaining of [160, 120, 80, 40, 1, .001]) {
    const input = finalTame(end - remaining);
    expect(input.phase.elapsedMs).toBeGreaterThanOrEqual(timelines.tame!.durationMs);
    const solved = solver.resolve(input.pose, input.phase);
    physical(solver, solved);
    expect(solved.pose.root!.dx).toBeCloseTo(expectedDx(input.pose, input.phase, finalDx * input.phase.weight!), 12);
    expect(solved.pose.root!.dx!).toBeLessThanOrEqual(previous + 1e-12);
    previous = solved.pose.root!.dx!;
  }
  const before = finalTame(end - .001), at = finalTame(end);
  const approaching = solver.resolve(before.pose, before.phase), rest = solver.resolve(at.pose, at.phase);
  physical(solver, rest);
  expect(rest.pose.root!.dx).toBe(at.pose.root!.dx);
  expect(Math.abs(approaching.pose.root!.dx! - rest.pose.root!.dx!)).toBeLessThan(1e-7);
  for (const contact of approaching.contacts) {
    const target = rest.contacts.find(c => c.joint === contact.joint)!.target;
    expect(Math.hypot(contact.target.x - target.x, contact.target.y - target.y)).toBeLessThan(1e-7);
  }
  // Same idle pose through the final zero-weight tame step must not snap feet.
  const zero = solver.resolve(at.pose, phase('tame', timelines.tame!.durationMs + 160, {weight: 0}));
  expect(zero).toEqual(rest);
});

it.each(['hit', 'tame'])('stage-owned %s does not reintroduce source dx or source-step foot displacement', id => {
  const solver = makeSolver(), ms = timelines[id]!.root.dx[1]!.ms / 2, input = sample(id, ms);
  expect(input.root!.dx).not.toBe(0);
  const context = phase(id, ms, {travel: 'stage', stageDisplacement: 0});
  const stage = solver.resolve(input, context);
  physical(solver, stage);
  expect(stage.pose.root!.dx).toBe(0);
  expect(stage.contacts.every(c => c.stance)).toBe(true);
  translatedTargets(solver, stage, 0);
  const changedDx: CreaturePoseV1 = {...input, root: {...input.root!, dx: 99}};
  expect(solver.resolve(changedDx, context)).toEqual(stage);
  const local = solver.resolve(input, phase(id, ms));
  expect(local.pose.root!.dx).not.toBe(0);
});

it('repeated and interleaved source-step samples are deterministic without input or source mutation', () => {
  const solver = makeSolver(), sourceBefore = JSON.stringify({record, binding});
  const ms = timelines.hit!.root.dx[1]!.ms / 2, input = sample('hit', ms), context = phase('hit', ms);
  for (const key of Object.values(input)) Object.freeze(key);
  Object.freeze(input); Object.freeze(context);
  const before = JSON.stringify({input, context}), first = solver.resolve(input, context);
  physical(solver, first);
  const fade = finalTame(tameRow.endMs - 40);
  solver.resolve(fade.pose, fade.phase);
  solver.resolve(sample('hit', timelines.hit!.durationMs), phase('hit', timelines.hit!.durationMs));
  expect(solver.resolve(input, context)).toEqual(first);
  expect(makeSolver().resolve(input, context)).toEqual(first);
  expect(JSON.stringify({input, context})).toBe(before);
  expect(JSON.stringify({record, binding})).toBe(sourceBefore);
});


it('does not erase an impossible external root offset on a canonical source-step clock', () => {
  const ms = timelines.hit!.root.dx[1]!.ms / 2, input = sample('hit', ms), context = phase('hit', ms);
  const solver = makeSolver(), ordinary = solver.resolve(input, context);
  physical(solver, ordinary);
  const invalid: CreaturePoseV1 = {...input, root: {...input.root!, dx: 99}};
  expect(() => solver.resolve(invalid, context)).toThrow('Contact: hit@' + ms + ' legFrontFar outside accommodatable reach');
});

it('keeps an external clip clock identical to the no-travel fixed-stance policy', () => {
  const ms = timelines.hit!.root.dx[1]!.ms / 2, input = sample('hit', ms);
  const context = phase('hit', ms, {durationMs: timelines.hit!.durationMs + 17});
  const solver = makeSolver(), actual = solver.resolve(input, context);
  physical(solver, actual);
  expect(actual.pose.root!.dx).toBe(input.root!.dx);
  expect(actual.contacts.every(c => c.stance)).toBe(true);
  translatedTargets(solver, actual, 0);
  const fixed = {...template, contactStance: {...template.contactStance!, travel: {}}};
  const spy = vi.spyOn(contracts, 'familyContractForRecord').mockReturnValue(fixed);
  try { expect(makeSolver().resolve(input, context)).toEqual(actual); }
  finally { spy.mockRestore(); }
});
