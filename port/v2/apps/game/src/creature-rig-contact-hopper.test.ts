import fs from 'node:fs';
import {afterAll, beforeAll, expect, it, vi} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {createSkeletonPoseProgram} from '../../../tools/creature-animation/skeleton-pose.mjs';
import {createFamilyContactSolver, observedContactSupports, predictContactSupport} from './creature-rig-contact.js';
import type {CreaturePoseV1} from './creature-rig.js';
import {compileBodyCard} from './motion/body-card.js';
import {buildTimeline} from './motion/timeline.js';
import {createGsapPlayer} from './motion/gsap-adapter.js';

const root = new URL('../../../../../', import.meta.url);
const read = (name: string) => JSON.parse(fs.readFileSync(new URL('audits/ARCHETYPE_FINISH_20260923/06-hopper/fit-01/' + name, root), 'utf8'));
const record = read('record.json'), binding = read('binding.json');
const supports = observedContactSupports(record, binding), card = compileBodyCard(record, record.genome);
const template = contracts.familyContractForRecord(record), program = createSkeletonPoseProgram(template, record.landmarks);
const hind = ['hindFarAnkle', 'hindNearAnkle'];
const fore = ['foreFarKnee', 'foreFarAnkle', 'foreFarPaw', 'foreNearKnee', 'foreNearAnkle', 'foreNearPaw'];
const ids = ['melee:bite', 'cast', 'victory', 'dodge', 'idle', 'faint'];
const timelines = Object.fromEntries(ids.map(id => [id, buildTimeline(card, id, card.identity.seed)]));
const readers = new Map<string, {sample(ms: number): CreaturePoseV1; stop(): void}>();
function sample(id: string, ms: number) {
  let reader = readers.get(id);
  if (!reader) {
    let pose: Record<string, {rotation: number; dx: number; dy: number}> = {};
    const player = createGsapPlayer(timelines[id]!, {setJoint(joint, rotation, dx, dy) {pose[joint] = {rotation, dx, dy};}}, {now: () => 0});
    reader = {sample(at) {pose = {}; player.seek(at); return pose;}, stop() {player.stop();}};
    readers.set(id, reader);
  }
  return reader.sample(ms);
}
// The static producer owns every melee translation in stage space.
const phase = (actionId: string, elapsedMs: number) => ({actionId, elapsedMs, durationMs: timelines[actionId]!.durationMs, realm: card.realm, ...(actionId.startsWith('melee:') ? {travel: 'stage' as const} : {})});
const keyTimes = (id: string) => [...new Set([0, ...timelines[id]!.root.dx.map(k => k.ms), ...timelines[id]!.root.dy.map(k => k.ms), timelines[id]!.bodyMs, timelines[id]!.durationMs])].sort((a, b) => a - b);
beforeAll(() => {
  expect(record.recipeHash).toBe('8952129f96a3ff22e92b4f409843ce24e55fd3cdf4d3431f2d26a5d8e80dbbba');
  expect(binding.bindingHash).toBe('aff5f77d4822ec0b8f1eddf2a9835792b1f4dc3709137ebd0552ede5c7efeb41');
  expect(Object.keys(supports)).toHaveLength(4);
});
afterAll(() => {for (const reader of readers.values()) reader.stop();});

it.each(['melee:bite', 'cast', 'victory'])('%s holds exactly the hind pair at canonical keys while preserving authored foreleg motion', id => {
  const solver = createFamilyContactSolver(record, supports), before = JSON.stringify({record, binding});
  const times = keyTimes(id); let movingForeleg = false;
  for (const ms of times) {
    const input = sample(id, ms), inputBefore = JSON.stringify(input), solved = solver.resolve(input, phase(id, ms));
    expect(solved.contacts.map(contact => contact.joint).sort(), id + '@' + ms).toEqual(hind);
    expect(solved.contacts.every(contact => contact.stance)).toBe(true);
    expect(solved.maxError).toBeLessThanOrEqual(1e-8);
    const matrices = program.evaluate(solved.pose);
    for (const contact of solved.contacts) {
      const actual = predictContactSupport(supports[contact.joint]!, matrices);
      expect(Math.hypot((actual.x - contact.paintedTarget.x) * record.geometry.width, (actual.y - contact.paintedTarget.y) * record.geometry.height)).toBeLessThanOrEqual(.25);
    }
    for (const joint of fore) {
      expect(input[joint], joint).toBeDefined();
      expect(solved.pose[joint], joint).toEqual(input[joint]);
      movingForeleg ||= input[joint]!.rotation !== 0;
    }
    expect(JSON.stringify(input)).toBe(inputBefore);
  }
  expect(movingForeleg).toBe(true);
  expect(JSON.stringify({record, binding})).toBe(before);
  console.log(JSON.stringify({scope: 'hopper stance keytimes only', action: id, samples: times.length, contacts: 2}));
});

it('standalone raw bite retains its real reach refusal when stage travel ownership is omitted', () => {
  const id = 'melee:bite', ms = 230;
  expect(keyTimes(id)).toContain(ms);
  const input = sample(id, ms), inputBefore = JSON.stringify(input);
  const {travel, ...standalone} = phase(id, ms);
  expect(travel).toBe('stage');
  let refusal: unknown;
  try {createFamilyContactSolver(record, supports).resolve(input, standalone);} catch (error) {refusal = error;}
  expect(refusal).toBeInstanceOf(Error);
  const outer = refusal as Error;
  expect(outer.message).toBe('Contact: melee:bite@230 hindFar outside accommodatable reach');
  expect(outer.cause).toBeInstanceOf(Error);
  expect((outer.cause as Error).message).toBe('Contact: melee:bite@230 hindFar rigid support outside accommodatable reach');
  expect(JSON.stringify(input)).toBe(inputBefore);
});

it('dodge keeps its real airborne tuck without contacts and still rejects a released-joint limit violation', () => {
  const solver = createFamilyContactSolver(record, supports); let moving = false;
  expect(contracts.contactStanceForAction(template, 'dodge')).toBe('none');
  for (const ms of keyTimes('dodge')) {
    const input = sample('dodge', ms), solved = solver.resolve(input, phase('dodge', ms));
    expect(solved.contacts).toEqual([]); expect(solved.pose).toBe(input);
    moving ||= fore.some(joint => input[joint]!.rotation !== 0);
  }
  expect(moving).toBe(true);
  const joint = 'foreNearKnee', input = sample('dodge', 0);
  const mutant = {...input, [joint]: {...input[joint], rotation: (template.limitsDeg[joint]!.max + 1) * Math.PI / 180}};
  expect(() => solver.resolve(mutant, phase('dodge', 0))).toThrow('Contact: raw clip joint limit ' + joint);
});

it('idle and faint retain all four declared contacts at canonical rest', () => {
  const solver = createFamilyContactSolver(record, supports);
  for (const id of ['idle', 'faint']) {
    expect(contracts.contactStanceForAction(template, id)).toBe('all');
    const solved = solver.resolve(sample(id, 0), phase(id, 0));
    expect(solved.contacts.map(contact => contact.joint).sort()).toEqual(Object.keys(supports).sort());
    expect(solved.contacts).toHaveLength(4);
  }
});

it('the former all-leg declaration cannot pass the hind-only or airborne contact inventories', () => {
  const former = {...template, contactStance: {default: 'all' as const, actions: {}}};
  const spy = vi.spyOn(contracts, 'familyContractForRecord').mockReturnValue(former);
  try {
    const solver = createFamilyContactSolver(record, supports);
    for (const id of ['melee:bite', 'cast', 'victory', 'dodge']) {
      const solved = solver.resolve(sample(id, 0), phase(id, 0));
      expect(solved.contacts).toHaveLength(4);
      expect(solved.contacts.map(contact => contact.joint).sort()).not.toEqual(hind);
      expect(solved.contacts).not.toEqual([]);
    }
  } finally {spy.mockRestore();}
});
