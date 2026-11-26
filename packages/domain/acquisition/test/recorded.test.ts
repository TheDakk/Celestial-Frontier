import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GEAR_INVENTORY_SCHEMA,
  decodeGearInventory,
  makeGearSourceActionId,
  migrateLegacyGear,
  projectAcquisitionCapabilities,
} from '@cf/domain-loot';
import { registerArc2EngineeringLoadout } from '@cf/domain-loot/engineering-internal';
import { DOMAINS, createSessionRNG, planSessionRNGDraws } from '@cf/domain-sessionrng';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import {
  TAME_ODDS_V1,
  canonicalGenomeIdentityV1,
  captureChanceV1,
  captureHitV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createEmptyOwnershipStateV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  ownershipStateDigestV1,
  planCaptureV1,
  preflightCaptureV1,
  type AcquisitionVerbV1,
  type CaptureRingV1,
  type CaptureTierV1,
  type CreatureAssignmentV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV1,
} from '../src/index.js';
import { migrateOwnershipStateV1ToV2, ownershipStateDigestV2 } from '../src/model-v2.js';
import { registerAcquisitionSnapshotV1, registerCaptureDrawBundleV1 } from '../src/snapshot-internal.js';
import {
  earnedStardustBonusV1,
  planArc5BreedScenariosV1,
  preflightArc5BreedV1,
  settleArc5BreedScenariosV1,
  type Arc5BreedScenarioV1,
} from '../src/breed.js';
import { projectCompanionAvailabilityV1 } from '../src/companion-availability.js';
import { withCompanionBondMemoriesV1 } from '../src/companion-care.js';
import { preflightArc5ExplorerMealV1, settleArc5ExplorerMealV1 } from '../src/explorer-meal.js';
import { createSpecimenLotV1, type SpecimenLotId } from '../src/model.js';
import { AMBIENT_READS, withoutAmbientSources } from '../../../../tests/support/ambient.js';
import { preflightArc5RestV1, settleArc5RestV1 } from '../src/rest.js';
import {
  COMPANION_MISSION_DOMAIN_V1,
  COMPANION_MISSION_LENGTHS_V1,
  companionMissionClaimSuccessorV1,
  companionMissionDispatchRefusalV1,
  sealCompanionMissionV1,
  type CompanionMissionLengthV1,
  type CompanionMissionSealedV1,
  type CompanionMissionTypeV1,
} from '../src/companion-missions.js';

/* fixtures/current/acquisition.json was recorded from the unmodified current game by
   tools/record-fixtures.mjs (the acquisition recorder): taming (capture) and breeding outcomes. Every
   case holds its whole input beside the answer. The only clock is the injected active-play time and
   the only random source is the injected SessionRNG state, both given in each input. The recorder
   installed the current game's capture hooks first; here the descriptors package imports them. */

type Json = Record<string, unknown>;
interface World { galaxy: { seed: number; x: number; y: number }; star: { seed: number; x: number; y: number }; planetSeed: number; biosphereKey: string; rows: Json[] }
interface Gear { itemCounts: [string, number][]; equipped: Record<string, string>; equippedAffixes: Record<string, unknown>; revision: number; capacity: number }
interface SessionRngInput { seed: number; ordinal: number; draws: Record<string, number> }
interface CaptureCase { input: { world: string; gear: string; verb: AcquisitionVerbV1; activePlayMs: number; sessionRng: SessionRngInput }; snapshot: Json; preflight: Json; plan: Json | null }
interface ChainStep { input: { verb: AcquisitionVerbV1; activePlayMs: number; sessionRng: SessionRngInput }; snapshot: Json; preflight: Json; plan: Json | null }
interface Parent { genome: Json; xp: number; hurt: number | null; fed: number | null; brood: number | null; assignment: CreatureAssignmentV1 | null }
interface BreedInput { parents: [Parent, Parent]; activePlayMs: number; earnedStardust: number; sessionRng: SessionRngInput; speciesPairFirst: boolean; fixedDraws: number[] }
interface BreedCase { input: BreedInput; preflight: Json; plan: Json | null; draw: Json | null; settled: Json[] | null; recovery: Json[] | null }
interface SealCase { input: { type: CompanionMissionTypeV1; length: CompanionMissionLengthV1; bondMemories: number; deposits: string[]; sessionRng: SessionRngInput }; draws: number[]; sealed: Json }
interface ClaimCase { input: { length: CompanionMissionLengthV1; type: CompanionMissionTypeV1; worldKey: string; missionId: string; activePlayMs: number; sessionRng: SessionRngInput }; sealed: Json; creatureAfter: Json; memento: string | null; successorDigest: string }
interface AcquisitionFixture {
  freeGlobals: Record<string, string>;
  injected: Record<string, string>;
  taming: {
    tameOdds: number[];
    chance: { verb: AcquisitionVerbV1; contactCapturePoints: number; byTierThenRing: number[][] }[];
    hitEdges: { successDraw: number; chance: number; hit: boolean }[];
    worlds: Record<string, World>;
    gear: Record<string, Gear>;
    captures: CaptureCase[];
    chains: { world: string; gear: string; steps: ChainStep[] }[];
  };
  breeding: { world: string; epoch: number; cases: BreedCase[]; injectedOnly: BreedCase[] };
  missions: { deposits: string[]; seals: SealCase[]; claims: ClaimCase[] };
}

const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/acquisition.json', import.meta.url), 'utf8'),
) as AcquisitionFixture;
const { taming, breeding, missions } = fixture;

/** The fixture is JSON: compare both sides through the same round trip. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');


/* ---- taming: rebuild each case from its recorded input, exactly as the recorder did ---- */

const gearSource = makeGearSourceActionId({ kind: 'legacy-migration', ownerId: 'acquisition-recorder', actionKey: 'items-v1', receiptId: 'migration:v4-v5' });
function capabilitiesOf(gear: Gear) {
  const migrated = migrateLegacyGear({ sourceActionId: gearSource, itemCounts: gear.itemCounts, equipped: gear.equipped, equippedAffixes: gear.equippedAffixes } as never);
  const inventory = decodeGearInventory(JSON.stringify({
    schema: GEAR_INVENTORY_SCHEMA, revision: gear.revision, capacity: gear.capacity,
    entries: migrated.instances.map((instance) => ({ instance, favorite: false, locked: false })),
    equipped: migrated.equipped, pendingRewards: [],
  }));
  return projectAcquisitionCapabilities(registerArc2EngineeringLoadout(inventory, []));
}

const addresses = new Map<string, CanonicalCF1WorldAddress>();
function addressOf(name: string): CanonicalCF1WorldAddress {
  const known = addresses.get(name);
  if (known) return known;
  const w = taming.worlds[name]!;
  const resolved = resolveCF1WorldAddress({ galaxy: w.galaxy, star: w.star, planet: { seed: w.planetSeed } });
  if (!resolved.ok) throw new Error(`${name} address did not resolve: ${resolved.reason}`);
  addresses.set(name, resolved.address);
  return resolved.address;
}

const CAPTURE_DOMAINS = [DOMAINS.captureCandidate, DOMAINS.captureSuccess];
function attemptCapture(world: string, gear: string, verb: AcquisitionVerbV1, ownership: OwnershipStateV1, sessionRng: SessionRngInput, activePlayMs: number) {
  const address = addressOf(world);
  const roster = taming.worlds[world]!;
  const snapshot = registerAcquisitionSnapshotV1({
    address, worldKey: address.key, ecologyEpoch: 0,
    fullRosterFingerprint: `recorded-roster:${address.key}:0:${roster.rows.length}`,
    biosphereKey: roster.biosphereKey, rosterRows: roster.rows,
    capabilities: capabilitiesOf(taming.gear[gear]!), ownership,
    f4Authority: { activePlayMs, sessionRng },
  });
  const snapshotOut = {
    fingerprint: snapshot.fingerprint, captureRing: snapshot.captureRing, biosphereYield: snapshot.biosphereYield,
    cycle: snapshot.cycle, contactCapturePoints: snapshot.contactCapturePoints, candidates: snapshot.candidates.length,
  };
  const preflight = preflightCaptureV1(snapshot, verb);
  if (preflight.kind !== 'ready') return { snapshot: snapshotOut, preflight: plain(preflight), plan: null, next: null };
  const sessionPlan = planSessionRNGDraws(createSessionRNG(sessionRng.seed, { ...sessionRng.draws }, sessionRng.ordinal).state(), CAPTURE_DOMAINS);
  const bundle = registerCaptureDrawBundleV1({
    snapshot,
    plan: {
      draws: sessionPlan.draws.map(({ domain, value }) => ({ domain, value })),
      receiptOrdinal: sessionPlan.receiptOrdinal,
      currentAuthority: { activePlayMs, sessionRng },
      nextSessionRng: sessionPlan.nextState,
      sessionPlan,
    },
  });
  const planned = planCaptureV1(preflight, bundle);
  if (planned.kind !== 'planned') return { snapshot: snapshotOut, preflight: { kind: 'ready' }, plan: plain(planned), next: null };
  const { successor, ...rest } = planned.plan;
  return {
    snapshot: snapshotOut,
    preflight: {
      kind: 'ready', pool: preflight.pool.map((c) => c.sourceOrdinal), used: preflight.used,
      remainingBefore: preflight.remainingBefore, requiredHitHeadroom: preflight.requiredHitHeadroom,
    },
    plan: { ...(plain(rest) as Json), successorDigest: ownershipStateDigestV1(successor) },
    next: { ownership: successor, sessionRng: plain(bundle.nextSessionRng) as SessionRngInput },
  };
}

const captureAnswer = (c: CaptureCase) => {
  const i = structuredClone(c.input);
  const out = attemptCapture(i.world, i.gear, i.verb, createEmptyOwnershipStateV1(), i.sessionRng, i.activePlayMs);
  return { input: c.input, snapshot: out.snapshot, preflight: out.preflight, plan: out.plan };
};

function chainAnswer(chain: AcquisitionFixture['taming']['chains'][number]) {
  let ownership = createEmptyOwnershipStateV1();
  let sessionRng = chain.steps[0]!.input.sessionRng;
  return chain.steps.map(({ input }) => {
    const out = attemptCapture(chain.world, chain.gear, input.verb, ownership, structuredClone(sessionRng), input.activePlayMs);
    const step = { input: { verb: input.verb, activePlayMs: input.activePlayMs, sessionRng: plain(sessionRng) }, snapshot: out.snapshot, preflight: out.preflight, plan: out.plan };
    if (out.next) ({ ownership, sessionRng } = out.next);
    return step;
  });
}

/** The recorded steps of a chain the legacy rule agrees with: those before the capture cycle turns (the first six). */
const legacySteps = (chain: AcquisitionFixture['taming']['chains'][number]): ChainStep[] =>
  chain.steps.filter(({ input }) => input.activePlayMs < 1_200_000);

/* ---- breeding ---- */

function ownershipOf(parents: Parent[]) {
  const identities = parents.map((p) => canonicalGenomeIdentityV1(p.genome));
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `breed-${index}`) as DiscoveryRecordId, speciesId: identity.speciesId,
    legacyCodexId: `breed-${index}`, legacySourceIndex: index, from: 'Legacy', legacyLocation: null, firstForSpecies: true,
  }));
  const ids = parents.map((_, index) => ownershipContentId('creature', `breed-${index}`) as CreatureInstanceId);
  const creatures = parents.map((p, index) => createCreatureInstanceV1({
    creatureId: ids[index]!, speciesId: identities[index]!.speciesId, genomeIdentity: identities[index]!.genomeIdentity,
    genome: identities[index]!.genome, nickname: `Parent ${index}`, origin: 'legacy', acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: identities[index]!.genome.gen as number }, xp: p.xp, hurt: p.hurt, fed: p.fed, brood: p.brood,
    assignment: p.assignment, bond: null,
  }));
  const source = createInitialOwnershipStateV1({
    catalogSpecies: identities.map((identity, index) => createCatalogSpeciesV1({ identity, alias: null, firstObservationId: discoveries[index]!.recordId })),
    discoveries, creatures, specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: ids[0]!,
  });
  return { state: migrateOwnershipStateV1ToV2(source), ids };
}

function scenarioOut(s: Arc5BreedScenarioV1) {
  const { successor, preflight: _preflight, parentsBefore: _before, parentsAfter, ...rest } = s;
  return { ...(plain(rest) as Json), parentAssignmentsAfter: plain(parentsAfter.map((p) => p.assignment)), successorDigest: ownershipStateDigestV2(successor) };
}

function breedAnswer(input: BreedInput) {
  const c = structuredClone(input);
  const { state, ids } = ownershipOf(c.parents);
  const preflight = preflightArc5BreedV1(state, {
    parentCreatureIds: [ids[0]!, ids[1]!], activePlayMs: c.activePlayMs, earnedStardustBonus: earnedStardustBonusV1(c.earnedStardust),
  });
  const row = { input, preflight: plain(preflight), plan: null as unknown, draw: null as unknown, settled: null as unknown, recovery: null as unknown };
  if (preflight.kind !== 'ready') return row;
  const sessionPlan = planSessionRNGDraws(createSessionRNG(c.sessionRng.seed, { ...c.sessionRng.draws }, c.sessionRng.ordinal).state(), [DOMAINS.breedOutcome]);
  const planned = planArc5BreedScenariosV1(preflight.preflight, sessionPlan.receiptOrdinal, c.speciesPairFirst);
  if (planned.kind !== 'planned') return { ...row, plan: plain(planned) };
  const { plan } = planned;
  return {
    ...row,
    plan: { kind: 'planned', receiptOrdinal: plan.receiptOrdinal, success: scenarioOut(plan.success), failure: scenarioOut(plan.failure) },
    draw: { value: sessionPlan.draws[0]!.value, nextSessionRng: plain(sessionPlan.nextState) },
    settled: [sessionPlan.draws[0]!.value, ...c.fixedDraws].map((d) => ({ draw: d, result: settleArc5BreedScenariosV1(plan, d).scenario.result })),
    recovery: (['success', 'failure'] as const).map((result) => {
      const s = plan[result];
      return { result, at: [s.recoveryReadyAtActivePlayMs - 1, s.recoveryReadyAtActivePlayMs].map((t) => ({
        activePlayMs: t,
        parents: s.parentsAfter.map((p) => plain(projectCompanionAvailabilityV1(p, t))),
      })) };
    }),
  };
}

/* ---- companion missions ---- */

const bondOf = (memories: number) => withCompanionBondMemoriesV1(null, Array.from({ length: memories }, (_, i) => ({ id: `taste:m${i}`, kind: 'taste' })), 0);
const missionDraws = (sessionRng: SessionRngInput): [number, number, number] => planSessionRNGDraws(
  createSessionRNG(sessionRng.seed, { ...sessionRng.draws }, sessionRng.ordinal).state(),
  [COMPANION_MISSION_DOMAIN_V1, COMPANION_MISSION_DOMAIN_V1, COMPANION_MISSION_DOMAIN_V1],
).draws.map((d) => d.value) as [number, number, number];

function sealAnswer(input: SealCase['input']) {
  const c = structuredClone(input);
  const draws = missionDraws(c.sessionRng);
  return { input, draws, sealed: plain(sealCompanionMissionV1({ type: c.type, length: c.length, bond: bondOf(c.bondMemories), deposits: c.deposits, draws })) };
}

function claimAnswer(input: ClaimCase['input']) {
  const c = structuredClone(input);
  const sealed = sealCompanionMissionV1({ type: c.type, length: c.length, bond: null, deposits: missions.deposits, draws: missionDraws(c.sessionRng) });
  const [first, second] = breeding.injectedOnly[0]!.input.parents;
  const { state, ids } = ownershipOf([{ ...first, assignment: { kind: 'mission', missionId: c.missionId } }, second]);
  const out = companionMissionClaimSuccessorV1(state, { creatureId: ids[0]!, missionId: c.missionId, type: c.type, length: c.length, worldKey: c.worldKey, sealed, activePlayMs: c.activePlayMs });
  return { input, sealed: plain(sealed), creatureAfter: plain(out.creatureAfter), memento: out.memento, successorDigest: ownershipStateDigestV2(out.successor) };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('@cf/domain-acquisition — recorded taming outcomes', () => {
  it('the tame odds and the whole capture chance table match the current game', () => {
    expect([...TAME_ODDS_V1]).toEqual(taming.tameOdds);
    expect(taming.chance).toHaveLength(21);
    for (const row of taming.chance) {
      const actual = Array.from({ length: 15 }, (_, tier) => Array.from({ length: 6 }, (_, ring) => captureChanceV1({
        verb: row.verb, tier: tier as CaptureTierV1, ring: ring as CaptureRingV1, contactCapturePoints: row.contactCapturePoints,
      })));
      expect(actual).toEqual(row.byTierThenRing);
    }
    expect(taming.hitEdges.map(({ successDraw, chance }) => ({ successDraw, chance, hit: captureHitV1(successDraw, chance) }))).toEqual(taming.hitEdges);
  });

  it('every capture case on six worlds (Kaum and Osum among them), both gear sets, three verbs, three SessionRNG seeds and two clocks', () => {
    expect(taming.captures).toHaveLength(216);
    expect(Object.keys(taming.worlds)).toEqual(['earth', 'ring3', 'ring4', 'deepLiving', 'kaum', 'osum']);
    for (const world of ['kaum', 'osum']) expect(taming.captures.filter((c) => c.input.world === world && c.plan !== null)).toHaveLength(36);
    const outcomes = new Set(taming.captures.map((c) => (c.plan ? (c.plan.hit ? 'hit' : 'miss') : String(c.preflight.reason))));
    expect([...outcomes].sort()).toEqual(['empty', 'hit', 'miss']);
    expect(plain(taming.captures.map(captureAnswer))).toEqual(taming.captures);
  });

  it('repeated captures from each successor and next SessionRNG state, up to the capture cycle\'s turn', () => {
    expect(taming.chains).toHaveLength(2);
    for (const chain of taming.chains) {
      expect(legacySteps(chain)).toHaveLength(6);
      expect((plain(chainAnswer(chain)) as unknown[]).slice(0, 6)).toEqual(legacySteps(chain));
    }
  });

  it('the recorded steps after the cycle\'s turn offer a species already caught, which the legacy game never does', () => {
    // LEGACY celestial-frontier.html 1.8.9, `tryCapture` 14867: the pool is the species not in the Compendium.
    // The fixture was recorded from the painted port, where a caught species came back when the cycle turned.
    // Steps 6 and 7 of both chains (at 1,200,000 and 1,201,000 ms) are those cases; they are not held here.
    // The fixture is left as it is: retiring or re-recording those four steps needs Dakk's word.
    const contradicting = taming.chains.map((chain) => {
      const caught = new Set<number>();
      return chain.steps.flatMap((step, index) => {
        const offered = ((step.preflight.pool as number[] | undefined) ?? []).filter((ordinal) => caught.has(ordinal));
        const plan = step.plan as { hit?: boolean; candidate?: { sourceOrdinal: number } } | null;
        if (plan?.hit) caught.add(plan.candidate!.sourceOrdinal);
        return offered.length > 0 ? [{ step: index, activePlayMs: step.input.activePlayMs, offered }] : [];
      });
    });
    expect(contradicting).toEqual([
      [{ step: 6, activePlayMs: 1200000, offered: [2] }, { step: 7, activePlayMs: 1201000, offered: [2] }],
      [{ step: 6, activePlayMs: 1200000, offered: [11, 14] }, { step: 7, activePlayMs: 1201000, offered: [14] }],
    ]);
    // Here the caught species stay out of the pool after the turn.
    for (const [index, chain] of taming.chains.entries()) {
      const answered = chainAnswer(chain);
      for (const { step, offered } of contradicting[index]!) {
        const pool = (answered[step]!.preflight as { pool?: number[] }).pool ?? [];
        for (const ordinal of offered) expect(pool).not.toContain(ordinal);
      }
    }
  });
});

describe('@cf/domain-acquisition — recorded breeding outcomes (Kaum fauna, both parent orders)', () => {
  it('every ordered pair of Kaum fauna: child genome, Recovery, settlement and availability', () => {
    expect(breeding.world).toBe('kaum');
    expect(breeding.cases).toHaveLength(56);
    const pairs = new Set(breeding.cases.map((c) => `${c.input.parents[0].genome.seed}>${c.input.parents[1].genome.seed}`));
    for (const pair of pairs) expect(pairs.has(pair.split('>').reverse().join('>'))).toBe(true);
    expect(plain(breeding.cases.map((c) => breedAnswer(c.input)))).toEqual(breeding.cases);
  });
});

/* Review Focus 3: a gameplay function handed no clock or random source must throw or refuse, and the
   injected source alone decides the result. */
describe('@cf/domain-acquisition — injected clock and random source', () => {
  it('the recorded results differ when only the injected SessionRNG seed differs, and repeat for the same seed', () => {
    const tames = taming.captures.filter((c) => c.input.world === 'deepLiving' && c.input.gear === 'none' && c.input.verb === 'tame' && c.input.activePlayMs === 0);
    expect(tames.map((c) => c.input.sessionRng.seed)).toEqual([12345, 777, 3735928559]);
    const draws = tames.map((c) => [c.plan!.candidateDraw, c.plan!.successDraw]);
    expect(new Set(draws.map((d) => JSON.stringify(d))).size).toBe(3);
    expect(tames.map((c) => c.plan!.hit)).toEqual([false, true, true]);
    for (const c of tames) {
      expect(plain(captureAnswer(c))).toEqual(plain(captureAnswer(c)));
      expect(plain(captureAnswer(c))).toEqual(c);
    }

    const bySeed = breeding.injectedOnly.filter((c) => c.input.activePlayMs === 1000);
    expect(bySeed.map((c) => c.input.sessionRng.seed)).toEqual([1, 4, 10]);
    expect(bySeed.map((c) => (c.settled![0] as { result: string }).result)).toEqual(['failure', 'success', 'failure']);
    expect(new Set(bySeed.map((c) => JSON.stringify(c.plan))).size).toBe(1); // the seed moves only the draw
    for (const c of bySeed) expect(plain(breedAnswer(c.input))).toEqual(c);
  });

  it('the recorded results differ when only the injected active-play clock differs', () => {
    const [early, late] = [0, 1250000].map((t) => taming.captures.find((c) => c.input.world === 'earth' && c.input.gear === 'contact' && c.input.verb === 'tame' && c.input.sessionRng.seed === 777 && c.input.activePlayMs === t)!);
    expect([early!.snapshot.cycle, late!.snapshot.cycle]).toEqual([0, 1]);
    expect(early!.snapshot.fingerprint).not.toBe(late!.snapshot.fingerprint);
    expect(early!.plan!.witness).not.toBe(late!.plan!.witness);
    for (const c of [early!, late!]) expect(plain(captureAnswer(c))).toEqual(c);

    const byClock = breeding.injectedOnly.filter((c) => c.input.sessionRng.seed === 4);
    expect(byClock.map((c) => c.input.activePlayMs)).toEqual([1000, 90000]);
    expect(byClock.map((c) => (c.plan as { success: { recoveryReadyAtActivePlayMs: number } }).success.recoveryReadyAtActivePlayMs)).toEqual([481000, 570000]);
    for (const c of byClock) expect(plain(breedAnswer(c.input))).toEqual(c);
  });

  it('no recorded case reads the device clock or Math.random', () => {
    withoutAmbientSources(() => {
      expect(plain(taming.captures.map(captureAnswer))).toEqual(taming.captures);
      for (const chain of taming.chains) expect((plain(chainAnswer(chain)) as unknown[]).slice(0, 6)).toEqual(legacySteps(chain));
      expect(plain([...breeding.cases, ...breeding.injectedOnly].map((c) => breedAnswer(c.input))))
        .toEqual([...breeding.cases, ...breeding.injectedOnly]);
      expect(missions.seals.map((c) => sealAnswer(c.input))).toEqual(missions.seals);
      expect(missions.claims.map((c) => claimAnswer(c.input))).toEqual(missions.claims);
    });
    // The guard itself works: each ambient source throws inside it.
    for (const read of AMBIENT_READS) expect(() => withoutAmbientSources(read)).toThrow(/^ambient /u);
  });

  it('refuses or throws when the clock or random source is missing', () => {
    const c = taming.captures.find((x) => x.input.world === 'earth' && x.input.verb === 'tame' && x.plan !== null)!;
    const address = addressOf('earth');
    const roster = taming.worlds.earth!;
    const mint = (f4Authority: unknown) => registerAcquisitionSnapshotV1({
      address, worldKey: address.key, ecologyEpoch: 0, fullRosterFingerprint: 'missing-source', biosphereKey: roster.biosphereKey,
      rosterRows: roster.rows, capabilities: capabilitiesOf(taming.gear.none!), ownership: createEmptyOwnershipStateV1(),
      f4Authority: f4Authority as never,
    });
    expect(() => mint({ sessionRng: c.input.sessionRng })).toThrow(/activePlayMs/u);
    expect(() => mint({ activePlayMs: 0 })).toThrow(/reading 'seed'/u);
    const snapshot = mint({ activePlayMs: 0, sessionRng: c.input.sessionRng });
    const preflight = preflightCaptureV1(snapshot, 'tame');
    expect(preflight.kind).toBe('ready');
    expect(planCaptureV1(preflight, undefined)).toEqual({ kind: 'refused', reason: 'draw-bundle-unregistered' });
    expect(() => registerCaptureDrawBundleV1({ snapshot, plan: { currentAuthority: { activePlayMs: 0, sessionRng: c.input.sessionRng } } as never }))
      .toThrow(/capture draws do not match the canonical ordered F4 plan/u);

    const breedInput = breeding.injectedOnly[0]!.input;
    const { state, ids } = ownershipOf(breedInput.parents);
    expect(preflightArc5BreedV1(state, { parentCreatureIds: [ids[0]!, ids[1]!], earnedStardustBonus: 0 } as never))
      .toEqual({ kind: 'refused', reason: 'input-invalid' });
    const ready = preflightArc5BreedV1(state, { parentCreatureIds: [ids[0]!, ids[1]!], activePlayMs: 1000, earnedStardustBonus: 0 });
    if (ready.kind !== 'ready') throw new Error(ready.reason);
    const planned = planArc5BreedScenariosV1(ready.preflight, 1, true);
    if (planned.kind !== 'planned') throw new Error(planned.reason);
    expect(() => settleArc5BreedScenariosV1(planned.plan, undefined as never)).toThrow(/outcome draw/u);
    const parent = state.creatures[0]!;
    expect(() => projectCompanionAvailabilityV1(parent, undefined as never)).toThrow(/companion activePlayMs must be an integer/u);
  });

  it('Rest and mission dispatch refuse or throw without a clock, and the clock alone sets the Rest ready time', () => {
    const [first, second] = breeding.injectedOnly[0]!.input.parents;
    const { state, ids } = ownershipOf([{ ...first, hurt: 0.5 }, second]);
    const target = { creatureId: ids[0]! };
    expect(preflightArc5RestV1(state, target, undefined as never)).toEqual({ kind: 'refused', reason: 'input-invalid' });
    const rest = preflightArc5RestV1(state, target, 1000);
    if (rest.kind !== 'ready') throw new Error(rest.reason);
    expect(() => settleArc5RestV1(rest.preflight, 1, undefined as never)).toThrow(/active-play time/u);
    const settled = [1000, 1000, 90000].map((t) => settleArc5RestV1(rest.preflight, 1, t));
    expect(settled.map((x) => x.readyAtActivePlayMs)).toEqual([1000 + rest.preflight.durationActivePlayMs, 1000 + rest.preflight.durationActivePlayMs, 90000 + rest.preflight.durationActivePlayMs]);
    expect(settled[0]!.witness).toBe(settled[1]!.witness);
    expect(settled[0]!.witness).not.toBe(settled[2]!.witness);
    expect(() => companionMissionDispatchRefusalV1(state, ids[1]!, COMPANION_MISSION_LENGTHS_V1[0], undefined as never)).toThrow(/companion activePlayMs must be an integer/u);
  });

  it('mission seals: the injected companion-mission draws alone decide the sealed result, and a missing draw throws', () => {
    expect(missions.seals).toHaveLength(48);
    expect(missions.seals.map((c) => sealAnswer(c.input))).toEqual(missions.seals);
    // One offer, four SessionRNG seeds: four different draw triples, at least two different sealed results.
    const bySeed = missions.seals.filter((c) => c.input.type === 'survey' && c.input.length === 'long' && c.input.bondMemories === 0);
    expect(bySeed.map((c) => c.input.sessionRng.seed)).toEqual([5, 6, 7, 3735928559]);
    expect(new Set(bySeed.map((c) => JSON.stringify(c.draws))).size).toBe(4);
    expect(new Set(bySeed.map((c) => JSON.stringify(c.sealed))).size).toBeGreaterThan(1);
    const prospect = missions.seals.filter((c) => c.input.type === 'prospect' && c.input.length === 'long' && c.input.bondMemories === 0);
    expect(new Set(prospect.map((c) => JSON.stringify(c.sealed))).size).toBeGreaterThan(1);
    for (const c of [...bySeed, ...prospect]) expect(sealAnswer(c.input)).toEqual(sealAnswer(c.input));
    const base = { type: 'survey' as const, length: 'long' as const, bond: null, deposits: missions.deposits };
    expect(() => sealCompanionMissionV1({ ...base, draws: [0.5, 0.5] as never })).toThrow(/companion mission draw must be in \[0, 1\)/u);
    expect(() => sealCompanionMissionV1({ ...base, draws: undefined as never })).toThrow(/reading '0'/u);
  });

  it('mission claims: the injected clock alone stamps the new bond memories, and a missing clock throws', () => {
    expect(missions.claims).toHaveLength(4);
    expect(missions.claims.map((c) => claimAnswer(c.input))).toEqual(missions.claims);
    for (const length of ['short', 'long']) {
      const [early, late] = missions.claims.filter((c) => c.input.length === length);
      expect([early!.input.activePlayMs, late!.input.activePlayMs]).toEqual([1000, 90000]);
      expect(early!.sealed).toEqual(late!.sealed);
      const stamps = (c: ClaimCase) => (c.creatureAfter.bond as { memories: { atActivePlayMs: number }[] }).memories.map((m) => m.atActivePlayMs);
      expect(new Set(stamps(early!))).toEqual(new Set([1000]));
      expect(new Set(stamps(late!))).toEqual(new Set([90000]));
      expect(early!.successorDigest).not.toBe(late!.successorDigest);
    }
    const input = missions.claims[0]!.input;
    const sealed = sealCompanionMissionV1({ type: input.type, length: input.length, bond: null, deposits: missions.deposits, draws: missionDraws(input.sessionRng) });
    const [first, second] = breeding.injectedOnly[0]!.input.parents;
    const { state, ids } = ownershipOf([{ ...first, assignment: { kind: 'mission', missionId: input.missionId } }, second]);
    expect(() => companionMissionClaimSuccessorV1(state, { creatureId: ids[0]!, missionId: input.missionId, type: input.type, length: input.length, worldKey: input.worldKey, sealed: sealed as CompanionMissionSealedV1 } as never))
      .toThrow(/bond memory active-play time is invalid/u);
  });

  it('explorer meal: the outcome draw alone decides poisoning, and a missing draw throws', () => {
    const genome = breeding.injectedOnly[0]!.input.parents[0]!.genome;
    const flora = { ...genome, kingdom: 'flora' };
    const identity = canonicalGenomeIdentityV1(flora);
    const discovery = createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'meal-0') as DiscoveryRecordId, speciesId: identity.speciesId,
      legacyCodexId: 'meal-0', legacySourceIndex: 0, from: 'Legacy', legacyLocation: null, firstForSpecies: true,
    });
    const lotId = ownershipContentId('specimen', 'meal-0') as SpecimenLotId;
    const state = migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
      catalogSpecies: [createCatalogSpeciesV1({ identity, alias: null, firstObservationId: discovery.recordId })],
      discoveries: [discovery], creatures: [],
      specimenLots: [createSpecimenLotV1({ lotId, speciesId: identity.speciesId, kind: 'flora', quantity: 2, origin: 'legacy', acquisitionRecordId: discovery.recordId })],
      biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    }));
    const ready = preflightArc5ExplorerMealV1(state, { foodLotId: lotId });
    if (ready.kind !== 'ready') throw new Error(ready.reason);
    const physiology = { hp: 40, hpMax: 100, stats: { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 } };
    const settle = (draw: unknown) => settleArc5ExplorerMealV1(ready.preflight, physiology, 0, false, draw as number, 3);
    expect(() => settle(undefined)).toThrow(/explorer meal outcome draw must be in \[0, 1\)/u);
    const poisoned = settle(0);
    const fine = settle(0.999999);
    expect(plain(settle(0))).toEqual(plain(poisoned));
    expect([poisoned.consequence.poisoned, fine.consequence.poisoned]).toEqual([true, false]);
    expect(poisoned.witness).not.toBe(fine.witness);
  });
});
