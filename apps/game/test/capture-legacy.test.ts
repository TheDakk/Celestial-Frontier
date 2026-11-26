// The capture rules against the legacy game's own answers. fixtures/v1/recorded/capture-press.json was recorded
// from the legacy game (tools/record-v1-fixtures.mjs, `capture-press`): `captureOdds` 14825-14834, `_captureRing`
// 14815-14824, `bioPool` and `_bioUsed` 14852-14863, `tryCapture` 14865-14887.
// The legacy cases name species as {seed 1000 + i, kingdom, tier}; here species i is row i of Earth's real roster,
// whose kingdoms are the same in the same order.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  canonicalGenomeIdentityV1,
  captureChanceV1,
  captureHitV1,
  createBiosphereProgressV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createSpecimenLotV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  preflightCaptureV1,
  type AcquisitionVerbV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import { registerAcquisitionSnapshotV1 } from '@cf/domain-acquisition/snapshot-internal';
import { readArc2AcquisitionCapabilities } from '@cf/persistence';
import { CAPTURE_VERB_COPY, captureRefusalNotice, captureResultNotices, rareFindStardustV1 } from '../src/capture';
import { bootstrapCarriers } from '../src/save/index';
import { EARTH, earthRows } from './capture-support';
import { namedState } from './save-support';

type Toast = [string, string] | null;
type PressOutput = [number | null, [number, number] | null, Toast, string[], number];
interface PressInput { kind: 'fauna' | 'flora' | 'microbe'; kingdoms: string[]; known: number[]; used: number; pick: number; success: number; pool?: number }
type Case =
  | { group: 'odds'; input: { kind: AcquisitionVerbV1; tier: number; ring: number; contact: number }; output: number }
  | { group: 'ring'; input: { name: string; region?: number }; output: number }
  | { group: 'pool'; input: { seed: number }; output: number[] }
  | { group: 'used'; input: { used: number | null; stamp: number; epoch: number; species: number }; output: [number, number, [number, number] | null] }
  | { group: 'press' | 'worked-out'; input: PressInput; output: PressOutput }
  | { group: 'edge'; input: { kind: 'fauna' | 'flora' | 'microbe'; tier: number; success: number }; output: [number, number | null] }
  | { group: 'chain'; input: { kingdoms: string[]; kinds: Array<'fauna' | 'flora' | 'microbe'>; values: Array<[number, number]>; turn: number[] }; output: PressOutput[] };
const fixture = JSON.parse(readFileSync(new URL('../../../fixtures/v1/recorded/capture-press.json', import.meta.url), 'utf8')) as { cases: Case[] };
type Presses = Extract<Case, { group: 'press' | 'worked-out' }>;
const group = <G extends Case['group']>(name: G) => fixture.cases.filter((c) => c.group === name) as Array<G extends 'press' | 'worked-out' ? Presses : Extract<Case, { group: G }>>;
const VERB = { fauna: 'tame', flora: 'scavenge', microbe: 'sample' } as const;

const rows = earthRows();
/** The gear of a new expedition: nothing worn, no contact points. */
const gear = readArc2AcquisitionCapabilities(bootstrapCarriers(namedState('Vega'), {}).extensions);
if (gear.kind !== 'loaded') throw new Error(`gear was ${gear.kind}`);
const { capabilities } = gear;

/** Earth's snapshot with these roster rows already in the Compendium and `used` attempts spent in `usedCycle`. */
function snapshotOf(known: readonly number[], used: number | null, cycle = 0, usedCycle = 0, count = rows.length) {
  const identities = known.map((i) => canonicalGenomeIdentityV1(rows[i]));
  const discoveries = identities.map((identity, n) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `known-${known[n]}`) as DiscoveryRecordId, speciesId: identity.speciesId,
    legacyCodexId: `s${identity.genome.seed as number}`, legacySourceIndex: n, from: 'Earth', legacyLocation: null, firstForSpecies: true,
  }));
  const ownership = createInitialOwnershipStateV1({
    catalogSpecies: identities.map((identity, n) => createCatalogSpeciesV1({ identity, alias: null, firstObservationId: discoveries[n]!.recordId })),
    discoveries,
    creatures: identities.flatMap((identity, n) => identity.kingdom !== 'fauna' ? [] : [createCreatureInstanceV1({
      creatureId: ownershipContentId('creature', `known-${known[n]}`) as CreatureInstanceId, speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity, genome: identity.genome, nickname: null, origin: 'legacy',
      acquisitionRecordId: discoveries[n]!.recordId, lineage: { kind: 'none', generation: 0 },
      xp: null, hurt: null, fed: null, brood: null, assignment: null, bond: null,
    })]),
    specimenLots: identities.flatMap((identity, n) => identity.kingdom === 'fauna' ? [] : [createSpecimenLotV1({
      lotId: ownershipContentId('specimen', `known-${known[n]}`) as SpecimenLotId, speciesId: identity.speciesId,
      kind: identity.kingdom, quantity: 1, origin: 'legacy', acquisitionRecordId: discoveries[n]!.recordId,
    })]),
    biosphereProgress: used === null ? [] : [createBiosphereProgressV1({ worldAddress: EARTH, cycle: usedCycle, used, successful: [] })],
    legacyBioX: [], scoutCreatureId: null,
  });
  return registerAcquisitionSnapshotV1({
    address: EARTH, worldKey: EARTH.key, ecologyEpoch: 0, fullRosterFingerprint: 'legacy-parity', biosphereKey: 'complex',
    rosterRows: rows.slice(0, count), capabilities, ownership,
    f4Authority: { activePlayMs: cycle * 1_200_000, sessionRng: { seed: 1, ordinal: 0, draws: {} } },
  });
}

/** What the legacy press did, read from its output: nothing left of the kind, a spent world, or the species picked. */
function legacyPress(output: PressOutput): { refusal: 'empty' | 'depleted' | null; picked: number | null; hit: boolean } {
  const [caught, , toast] = output;
  if (caught !== null) return { refusal: null, picked: caught - 1000, hit: true };
  if (toast![0].endsWith('Worked Out')) return { refusal: 'depleted', picked: null, hit: false };
  const eluded = /^Species (\d+) eluded you/u.exec(toast![1]);
  return eluded ? { refusal: null, picked: Number(eluded[1]) - 1000, hit: false } : { refusal: 'empty', picked: null, hit: false };
}

/** Holds one legacy press against the rules here, for the Compendium and the attempts the legacy game had. */
function expectSamePress(input: Pick<PressInput, 'kind' | 'pick'>, known: readonly number[], used: number | null, output: PressOutput, cycle = 0, usedCycle = 0): void {
  const legacy = legacyPress(output);
  const preflight = preflightCaptureV1(snapshotOf(known, used, cycle, usedCycle), VERB[input.kind]);
  if (legacy.refusal !== null) {
    expect(preflight).toEqual({ kind: 'refused', reason: legacy.refusal });
    expect(output[4]).toBe(2); // the legacy game drew nothing either
    return;
  }
  expect(preflight.kind).toBe('ready');
  if (preflight.kind !== 'ready') return;
  // The pick is the first value over the pool, in roster order (14873).
  expect(preflight.pool[(input.pick * preflight.pool.length) | 0]!.sourceOrdinal).toBe(legacy.picked);
  expect(known).not.toContain(legacy.picked);
  // One attempt is spent, hit or miss (14875).
  expect(output[1]![0]).toBe(preflight.used + 1);
  expect(output[4]).toBe(0);
}

describe('the capture rules are the legacy game\'s', () => {
  it('Earth\'s roster has the kingdoms of the recorded cases, in their order', () => {
    expect(rows.map((row) => row.kingdom)).toEqual(group('press')[0]!.input.kingdoms);
  });

  it('the odds for every verb, tier, ring and worn contact points', () => {
    const cases = group('odds');
    expect(cases).toHaveLength(3 * 17 * 6 * 6);
    for (const { input, output } of cases.filter(({ input: i }) => i.tier <= 14)) {
      expect(captureChanceV1({ verb: input.kind, tier: input.tier as 0, ring: input.ring as 0, contactCapturePoints: input.contact }), JSON.stringify(input)).toBe(output);
    }
    // The legacy table has 15 rows and holds a higher tier to its last; no species here grades above 14.
    for (const { input, output } of cases.filter(({ input: i }) => i.tier > 14)) {
      expect(captureChanceV1({ verb: input.kind, tier: 14, ring: input.ring as 0, contactCapturePoints: input.contact })).toBe(output);
    }
  });

  it('the roll lands when the success value is below the odds', () => {
    const cases = group('edge');
    expect(cases).toHaveLength(45);
    for (const { input, output: [odds, caught] } of cases) expect(captureHitV1(input.success, odds), JSON.stringify(input)).toBe(caught !== null);
  });

  it('Earth is in the innermost ring, and its Yield pool is the legacy pool for every roster size', () => {
    expect(group('ring').find(({ input }) => input.name === 'sol')!.output).toBe(0);
    expect(snapshotOf([], null).captureRing).toBe(0);
    const pool = group('pool').find(({ input }) => input.seed === 133)!.output;
    for (let count = 0; count <= 19; count++) expect(snapshotOf([], null, 0, 0, count).biosphereYield, String(count)).toBe(pool[count]);
  });

  it('the attempts spent are forgotten when the pool\'s period has turned, and only then', () => {
    for (const { input, output: [used, left] } of group('used')) {
      const preflight = preflightCaptureV1(snapshotOf([], input.used, input.epoch, input.stamp), 'tame');
      if (input.stamp > input.epoch) continue; // a stamp from the future: the legacy game keeps counting it; here the press is refused (below)
      if (left === 0) expect(preflight).toEqual({ kind: 'refused', reason: 'depleted' });
      else expect(preflight).toMatchObject({ kind: 'ready', used, remainingBefore: left });
    }
    expect(preflightCaptureV1(snapshotOf([], 3, 2, 5), 'tame')).toEqual({ kind: 'refused', reason: 'future-cycle-progress' });
  });

  it('every recorded press: the pool leaves out what the Compendium holds, and nothing left is said before a spent world', () => {
    const cases = [...group('press'), ...group('worked-out')];
    expect(cases).toHaveLength(378 + 30);
    for (const { input, output } of cases) expectSamePress(input, input.known, input.used === 0 ? null : input.used, output);
    expect(new Set(cases.map(({ output }) => legacyPress(output).refusal))).toEqual(new Set([null, 'empty', 'depleted']));
  });

  it('both recorded chains: a species once caught is never offered again, on the same day or after the pool refills', () => {
    for (const { input, output } of group('chain')) {
      const known: number[] = [];
      let used: number | null = null;
      let cycle = 0;
      let usedCycle = 0;
      input.kinds.forEach((kind, step) => {
        if (input.turn.includes(step)) cycle++;
        expectSamePress({ kind, pick: input.values[step]![0] }, known, used, output[step]!, cycle, usedCycle);
        const legacy = legacyPress(output[step]!);
        if (legacy.hit) known.push(legacy.picked!);
        if (legacy.refusal === null) { used = output[step]![1]![0]; usedCycle = cycle; }
      });
    }
  });
});

describe('a rare first find', () => {
  it('pays its tier less 3 in Stardust from tier 5, and nothing below or for a species already held', () => {
    // LEGACY 14936-14939: `if(fresh.grade.tier>=5){ const _b=fresh.grade.tier-3; essence+=_b; ...`.
    expect([0, 4, 5, 6, 9, 14].map((tier) => rareFindStardustV1(tier, true))).toEqual([0, 0, 2, 3, 6, 11]);
    expect(rareFindStardustV1(9, false)).toBe(0);
    expect(captureResultNotices({
      verb: 'tame', worldKey: EARTH.key, hit: true, sourceOrdinal: 0, speciesId: 's1', name: 'Auroch', tier: 6, chance: 0.09,
      left: 3, stardust: 3, essence: 41, scoutXp: null, achievementIds: [],
    })[1]).toEqual({ icon: 'stardust', title: 'Rare Find Bonus', message: ['+3 Stardust for a legendary specimen. Total: 41.'] });
  });
});

describe('what a press says is what the legacy game said', () => {
  const plain = (title: string): string => title.replace(/^\P{L}+/u, '');

  it('a miss, with its odds and the attempts left; nothing left of a kind; a spent world', () => {
    let seen = 0;
    for (const { input, output } of [...group('press'), ...group('worked-out')]) {
      const toast = output[2];
      if (toast === null) continue;
      const legacy = legacyPress(output);
      const verb = VERB[input.kind];
      const notice = legacy.refusal !== null ? captureRefusalNotice(verb, legacy.refusal)! : captureResultNotices({
        verb, worldKey: EARTH.key, hit: false, sourceOrdinal: legacy.picked!, speciesId: `s${1000 + legacy.picked!}`, name: `Species ${1000 + legacy.picked!}`,
        tier: 0, chance: captureChanceV1({ verb, tier: 0, ring: 0, contactCapturePoints: 0 }),
        left: (input.pool ?? group('pool').find(({ input: i }) => i.seed === 133)!.output[19]!) - output[1]![0], stardust: 0, essence: 0, scoutXp: null, achievementIds: [],
      })[0]!;
      expect([notice.title, notice.message.join('')], JSON.stringify(input)).toEqual([plain(toast[0]), toast[1]]);
      seen++;
    }
    expect(seen).toBeGreaterThan(200);
    expect(CAPTURE_VERB_COPY.tame.label).toBe('Tame');
  });
});
