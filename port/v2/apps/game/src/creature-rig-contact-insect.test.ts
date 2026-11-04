import fs from 'node:fs';
import {expect, it, vi} from 'vitest';
import * as contracts from '../../../tools/creature-animation/family-contracts.mjs';
import {createFamilyContactSolver, observedContactSupports} from './creature-rig-contact.js';
import type {CreaturePoseV1} from './creature-rig.js';
import {compileBodyCard} from './motion/body-card.js';
import * as motionTimeline from './motion/timeline.js';

const root = new URL('../../../../../', import.meta.url);
const read = (path: string) => JSON.parse(fs.readFileSync(new URL(path, root), 'utf8'));
const packet = 'audits/ARCHETYPE_FINISH_20260923/04-insect/';
const record = read(packet + 'fit-04/record.json');
const binding = read(packet + 'fit-04/binding.json');
const diagnosis = read(packet + 'contact-diagnosis-01.json');
const supports = observedContactSupports(record, binding);
const template = contracts.familyContractForRecord(record);
const chains = contracts.familyContactChains(template);
const hindFeet = ['legHindFarFoot', 'legHindNearFoot'];
const releasedJoints = ['legFrontFar', 'legFrontNear', 'legMidFar', 'legMidNear']
  .flatMap(id => [id + 'Knee', id + 'Foot']);

// These are captured raw GSAP attempts, not static.firstRefusal.pose: the latter
// is the previous published paint pose when contact refused before publication.
function sourceSample(actionId: string) {
  expect(diagnosis.recordRecipeHash).toBe(record.recipeHash);
  expect(diagnosis.bindingHash).toBe(binding.bindingHash);
  const sample = diagnosis.results.find((row: {id: string}) => row.id === actionId);
  expect(sample, 'retained actual source attempt ' + actionId).toBeDefined();
  return {pose: structuredClone(sample.attemptedPose) as CreaturePoseV1, phase: sample.phase};
}

it.each(['cast', 'victory'])('%s retains exactly the two observed hind supports and the released front/mid source keys', actionId => {
  expect(record.template.id).toBe('insect');
  expect(Object.keys(supports)).toHaveLength(6);
  const {pose, phase} = sourceSample(actionId), before = JSON.stringify(pose);
  const solver = createFamilyContactSolver(record, supports);
  expect(solver.chains).toHaveLength(6);
  const solved = solver.resolve(pose, phase);
  expect(solved.contacts.map(contact => contact.joint).sort()).toEqual(hindFeet);
  expect(solved.contacts.every(contact => contact.stance)).toBe(true);
  expect(releasedJoints.some(joint => pose[joint]!.rotation !== 0)).toBe(true);
  for (const joint of releasedJoints) expect(solved.pose[joint], joint).toEqual(pose[joint]);
  expect(JSON.stringify(pose)).toBe(before);
});

it('dodge explicitly releases all six contacts for its authored aerial tuck without dropping raw leg limits', () => {
  expect(contracts.contactStanceForAction(template, 'dodge')).toBe('none');
  const {pose, phase} = sourceSample('dodge'), solver = createFamilyContactSolver(record, supports);
  const before = JSON.stringify(pose), solved = solver.resolve(pose, phase);
  expect(solved.contacts).toEqual([]);
  expect(solved.pose).toBe(pose);
  const legJoints = chains.flatMap(chain => [chain.knee, chain.end]);
  expect(legJoints).toHaveLength(12);
  expect(legJoints.some(joint => pose[joint]!.rotation !== 0)).toBe(true);
  for (const joint of legJoints) expect(solved.pose[joint], joint).toEqual(pose[joint]);
  const joint = 'legMidNearKnee';
  const mutant: CreaturePoseV1 = {...pose, [joint]: {...pose[joint], rotation: (template.limitsDeg[joint]!.max + 1) * Math.PI / 180}};
  expect(() => solver.resolve(mutant, phase)).toThrow('Contact: raw clip joint limit ' + joint);
  expect(JSON.stringify(pose)).toBe(before);
});

it.each([NaN, Infinity, -Infinity])('dodge rejects a nonfinite released leg or root value (%s)', value => {
  const {pose, phase} = sourceSample('dodge'), solver = createFamilyContactSolver(record, supports);
  const leg = {...pose, legMidNearKnee: {...pose.legMidNearKnee, rotation: value}};
  expect(() => solver.resolve(leg, phase)).toThrow(/raw clip joint limit|Skeleton pose: nonfinite pose/);
  const root = {...pose, root: {...pose.root, rotation: value}};
  expect(() => solver.resolve(root, phase)).toThrow('Skeleton pose: nonfinite pose');
});

it('source-step travel refuses a looped source timeline before constructing a stepping plan', () => {
  const card = compileBodyCard(record, record.genome);
  const timeline = motionTimeline.buildTimeline(card, 'hit', card.identity.seed);
  expect(timeline.loop).toBe(false);
  const spy = vi.spyOn(motionTimeline, 'buildTimeline').mockReturnValue({...timeline, loop: true});
  try {
    const {pose, phase} = sourceSample('hit');
    expect(() => createFamilyContactSolver(record, supports).resolve(pose, phase))
      .toThrow('Contact: source-step travel requires a nonloop timeline');
    expect(spy).toHaveBeenCalledTimes(1);
  } finally { spy.mockRestore(); }
});

it.each(['absent', 'misspelled'] as const)('a declared hind stance with %s hind inventory refuses instead of passing with zero contacts', mode => {
  // Corrupt only the in-memory resolved inventory; preserve the actual graph,
  // landmarks and observed supports. Never edit the family or fixture files.
  const corrupt = mode === 'absent'
    ? chains.filter(chain => !chain.id.startsWith('legHind'))
    : chains.map(chain => ({...chain, id: chain.id.replace('legHind', 'legHidn')}));
  const wanted = new Set(corrupt.map(chain => chain.end));
  const controlSupports = Object.fromEntries(Object.entries(supports).filter(([joint]) => wanted.has(joint)));
  const spy = vi.spyOn(contracts, 'familyContactChains');
  try {
    spy.mockReturnValue(corrupt);
    const solver = createFamilyContactSolver(record, controlSupports);
    expect(solver.chains.length).toBe(mode === 'absent' ? 4 : 6);
    for (const actionId of ['cast', 'victory']) {
      const {pose, phase} = sourceSample(actionId);
      expect(() => solver.resolve(pose, phase)).toThrow('Contact: declared hind stance has no chains');
    }
  } finally { spy.mockRestore(); }
});
