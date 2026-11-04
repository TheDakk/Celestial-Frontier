/* §20 Guardian PARTY combat settlement (S2b step 2), end to end through the real persistence owner.
 *
 * Every case builds a veteran save migrated to v5 with N real Arc 5 companions, plans a party fight with
 * `planCombatPartySettlementV1`, commits it through `createCombatSettlementPersistenceOwnerV1`, then READS THE SAVE BACK
 * (revision, receipts, v4 Compendium mirror and the durable Arc 5 ownership carrier) and asserts the outcome there — never the
 * code path. Design: audits/COMBAT_S2_PARTY_20260925/DESIGN.md; decision: port/DECISIONS.md §20.
 * The harness is a copy of the single-champion one in combat-settlement.test.ts, generalised to N creatures. */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  canonicalJson,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
  planCombatPartySettlementV1,
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type CombatSettlementPlanV1,
} from '@cf/domain-combatcore';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  createActivePlayPersistenceOwner,
  createCombatSettlementPersistenceOwnerV1,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  encodeArc4Ownership,
  migrateStoredV4ToV5,
  prepareArc5OwnershipMigration,
  readArc5OwnershipMigration,
  readCombatSettlementAuthorityV1,
  readRevisionedSaveV5WithRecovery,
  readSaveV5,
  verifyCommittedCombatSettlementV1,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type TabLeaseGrant,
  type V5WritableState,
} from '@cf/persistence';

installCaptureHooks();

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const fixtures = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>;
};
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(baseline, 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_060_000;
const VETERAN_RAW = JSON.stringify(fixtures.inputs.veteran_rich);
const resolved = resolveCF1WorldAddress({
  galaxy: { seed: 1594395733, x: -5501.81, y: -11753.64 },
  star: { seed: 4077594722, x: -271.54, y: -67.36 },
  planet: { seed: 488332735 },
});
if (!resolved.ok) throw new Error(`combat party world failed: ${resolved.reason}`);
const WORLD = resolved.address;
const OPPORTUNITY = projectWorldOpportunity(WORLD);
const projectedEncounter = projectGuardianPrimeEncounterV1({
  world: WORLD,
  descriptor: { worldType: OPPORTUNITY.source.planetType },
  regionIndex: 0,
  faunaRoster: [{ speciesId: 'combat-persistence-defender', genome: makeGenome(999, 'fauna', 0.5) }],
  claimedSignatureIds: [],
  conquered: false,
});
if (projectedEncounter === null || projectedEncounter.defender.kind !== 'fauna') {
  throw new Error('combat party fixture did not select ordinary fauna');
}
const ENCOUNTER = projectedEncounter;
/** The settlement clock (active play) of every party plan and commit snapshot below. */
const CLOCK = 40_000;
const READY_AT = CLOCK + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1;
const GENOME_WEIGHT = 0.5;

type Assignment = { readonly kind: 'recovery'; readonly readyAtActivePlayMs: number } | null;
type Plan = CombatSettlementPlanV1;
type PartyBlock = NonNullable<Plan['party']>;

function creatureIdFor(seed: number): CreatureInstanceId {
  return ownershipContentId('creature', `combat-party-${seed}`) as CreatureInstanceId;
}

/** The exact bred genome the harness stores (canonical identity + mutable xp/hurt), so a plan built from it binds to the row. */
function storedGenome(seed: number, hurt = 0): Genome {
  const genome = makeGenome(seed, 'fauna', GENOME_WEIGHT);
  genome.gen = 1;
  genome.parents = [101, 202];
  genome.xp = 0;
  genome.hurt = hurt;
  const identity = canonicalGenomeIdentityV1(genome);
  return { ...identity.genome, xp: 0, hurt } as unknown as Genome;
}

function championFor(seed: number, hurt = 0) {
  return Object.freeze({
    kind: 'owned-fauna' as const,
    creatureId: creatureIdFor(seed),
    name: `Companion ${seed}`,
    genome: storedGenome(seed, hurt),
    legacyBredLineage: true,
  });
}

function partyPlan(seeds: readonly number[], battleId: string, activePlayMs = CLOCK, receiptOrdinal = 0): Plan {
  const planned = planCombatPartySettlementV1({
    battleId,
    receiptOrdinal,
    encounter: ENCOUNTER,
    worldTier: OPPORTUNITY.effectiveTier,
    mode: 'auto',
    party: seeds.map((seed) => ({ champion: championFor(seed), stance: 'balanced' as const })),
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds: [],
      lossXp: { kind: 'known-target', awardedTarget: 0 },
      activePlayMs,
    },
  });
  if (planned.status !== 'planned') throw new Error(`combat party plan refused ${planned.reason}`);
  return planned;
}

function idOf(member: PartyBlock['members'][number]): string {
  if (member.champion.kind !== 'owned-fauna') throw new Error('party fixture holds only owned fauna');
  return member.champion.creatureId;
}

/** Deterministic seed search (like the domain tests): the first `size`-member party whose plan satisfies `accept`. */
function findParty(label: string, accept: (plan: Plan) => boolean, size: 2 | 3 = 3): readonly number[] {
  for (let base = 3; base < 3_000; base += 7) {
    const seeds = Array.from({ length: size }, (_, index) => base + index * 1_000);
    let plan: Plan;
    try {
      plan = partyPlan(seeds, `party-search-${base}`);
    } catch {
      continue;
    }
    if (plan.party !== undefined && accept(plan)) return seeds;
  }
  throw new Error(`no party fixture: ${label}`);
}
const someoneFell = (plan: Plan): boolean => plan.party!.members.some((m) => m.injury?.status === 'set-recovery');
const someoneIdle = (plan: Plan): boolean => plan.party!.members.some((m) => m.legEnd === 'not-fought');

interface PartyHarness {
  readonly backend: StorageBackend;
  readonly grant: TabLeaseGrant;
  readonly writable: V5WritableState;
  readonly ownership: OwnershipStateV2;
  readonly seeds: readonly number[];
}

interface MemberOptions {
  readonly assignment?: Assignment;
  readonly hurt?: number;
}

async function partyHarness(
  seeds: readonly number[],
  options: Readonly<Record<number, MemberOptions>> = {},
  backend: StorageBackend = createMemoryBackend(),
): Promise<PartyHarness> {
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
  expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`expected base v5, received ${loaded.kind}`);

  const rows = seeds.map((seed, index) => {
    const hurt = options[seed]?.hurt ?? 0;
    const genome = makeGenome(seed, 'fauna', GENOME_WEIGHT);
    genome.gen = 1;
    genome.parents = [101, 202];
    genome.xp = 0;
    genome.hurt = hurt;
    return {
      seed, index, hurt,
      identity: canonicalGenomeIdentityV1(genome),
      legacyId: `s${seed}`,
      creatureId: creatureIdFor(seed),
      discoveryId: ownershipContentId('discovery', `combat-party-${seed}`) as DiscoveryRecordId,
      assignment: options[seed]?.assignment ?? null,
    };
  });
  const firstOfSpecies = (row: typeof rows[number]): boolean => (
    rows.findIndex((other) => other.identity.speciesId === row.identity.speciesId) === row.index
  );
  const source = createInitialOwnershipStateV1({
    catalogSpecies: rows.filter(firstOfSpecies).map((row) => createCatalogSpeciesV1({
      identity: row.identity, alias: null, firstObservationId: row.discoveryId,
    })),
    discoveries: rows.map((row) => createLegacyDiscoveryRecordV1({
      recordId: row.discoveryId,
      speciesId: row.identity.speciesId,
      legacyCodexId: row.legacyId,
      legacySourceIndex: row.index,
      from: 'Persistence fixture (bred)',
      legacyLocation: null,
      firstForSpecies: firstOfSpecies(row),
    })),
    creatures: rows.map((row) => createCreatureInstanceV1({
      creatureId: row.creatureId,
      speciesId: row.identity.speciesId,
      genomeIdentity: row.identity.genomeIdentity,
      genome: row.identity.genome,
      nickname: null,
      origin: 'legacy',
      acquisitionRecordId: row.discoveryId,
      lineage: { kind: 'legacy-parent-seeds', generation: 1, parentSeeds: [101, 202] },
      xp: 0,
      hurt: row.hurt,
      fed: null,
      brood: null,
      assignment: row.assignment,
      bond: null,
    })),
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  let extensions = applyV5ExtensionWrites(loaded.extensions, encodeArc4Ownership(source).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({ extensions, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(`Arc 5 fixture refused ${arc5.kind}`);
  extensions = arc5.extensions;

  const state = JSON.parse(JSON.stringify(loaded.state)) as SaveStateV2;
  state.conquered = [];
  state.primeFill = {};
  state.frontierUnlocked = false;
  state.equip = {};
  state.equipAff = {};
  state.chacc = [];
  state.scoutId = null;
  state.stats.duels = 0;
  state.stats.duelwins = 0;
  state.stats.guardians = 0;
  state.codex = rows.map((row) => [row.legacyId, {
    id: row.legacyId,
    name: `Companion ${row.seed}`,
    kind: 'Fauna',
    tier: null,
    realm: 'Wild',
    sapient: 0,
    from: 'Persistence fixture (bred)',
    hybrid: true,
    g: { ...row.identity.genome, xp: 0, hurt: row.hurt },
    where: null,
  }]);
  state.xpFirstsBinding = null;
  state.xpFirsts = [];

  const client = createTabLeaseClient(backend, {
    ownerId: `combat-party-tab-${seeds.join('-')}`,
    token: `combat-party-token-${seeds.join('-')}`,
    ttlMs: 10,
    now: () => 0,
  });
  const acquired = await client.acquire();
  if (acquired.kind !== 'acquired') throw new Error(`lease fixture received ${acquired.kind}`);
  const seeded = await createActivePlayPersistenceOwner(createRevisionedRepository(backend), REGISTRY).commit({
    expectedRevision: 0,
    grant: acquired.grant,
    writable: { state, extensions },
    snapshot: { activePlayMs: 100 },
    sessionRng: createSessionRNG(0xC0FFEE).state(),
    now: NOW,
  });
  if (seeded.kind !== 'committed') throw new Error(`F4 fixture received ${seeded.kind}`);
  const current = await readRevisionedSaveV5WithRecovery(backend, REGISTRY, NOW);
  if (current.kind !== 'loaded') throw new Error(`current fixture received ${current.kind}`);
  const ownership = readArc5OwnershipMigration(current.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(`ownership fixture received ${ownership.kind}`);
  return Object.freeze({
    backend,
    grant: acquired.grant,
    writable: { state: current.state, extensions: current.extensions },
    ownership: ownership.state,
    seeds,
  });
}

async function commit(fixture: PartyHarness, plan: Plan, activePlayMs = CLOCK, expectedRevision = 1) {
  return createCombatSettlementPersistenceOwnerV1(createRevisionedRepository(fixture.backend), REGISTRY).commit({
    expectedRevision,
    grant: fixture.grant,
    writable: fixture.writable,
    snapshot: { activePlayMs },
    now: NOW,
    plan,
    opportunity: OPPORTUNITY,
    ownershipV2: fixture.ownership,
    brinkAchievementJoin: null,
  });
}

async function reload(fixture: PartyHarness) {
  const loaded = await readRevisionedSaveV5WithRecovery(fixture.backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`combat party reload received ${loaded.kind}`);
  return loaded;
}

function durableOwnership(extensions: V5WritableState['extensions']): OwnershipStateV2 {
  const read = readArc5OwnershipMigration(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (read.kind !== 'loaded') throw new Error(`durable ownership received ${read.kind}`);
  return read.state;
}

/** Nothing was written: the revision, receipt slot, ownership carrier and counters are exactly the fixture's. */
async function expectNothingWritten(fixture: PartyHarness): Promise<void> {
  const repository = createRevisionedRepository(fixture.backend);
  expect(await repository.revision()).toBe(1);
  expect(await repository.readReceipt(0)).toBeUndefined();
  const loaded = await reload(fixture);
  expect(loaded.state.stats.duels).toBe(0);
  expect(canonicalJson(durableOwnership(loaded.extensions))).toBe(canonicalJson(fixture.ownership));
  expect(readCombatSettlementAuthorityV1(loaded.extensions)).toMatchObject({ kind: 'loaded', authority: { battles: [] } });
}

/** The expected decisive row: a single fight's XP and injury, exactly as its plan says. */
function expectedDecisiveRow(plan: Plan, before: OwnershipStateV2['creatures'][number]) {
  const xpDelta = plan.xp.status === 'award' ? plan.xp.amount
    : plan.xp.status === 'loss-target' ? plan.xp.totalDelta : 0;
  const hurt = plan.injury.status === 'set-hurt' || plan.injury.status === 'set-recovery'
    ? plan.injury.hurtAfter : before.hurt;
  const assignment = plan.injury.status === 'set-recovery'
    ? { kind: 'recovery', readyAtActivePlayMs: plan.injury.readyAtActivePlayMs } : before.assignment;
  return { xp: (before.xp ?? 0) + xpDelta, hurt, assignment };
}

const PARTY_SEEDS = findParty('a non-decisive member fought', someoneFell);
const IDLE_PARTY_SEEDS = findParty('one member fought, one never did', (plan) => someoneFell(plan) && someoneIdle(plan));
/** A party LOSS (rare: only 2-member parties lose against this defender): the decisive champion is the last fighter and takes
 *  the single-fight wound + Recovery + loss XP, while the member who fell first takes Recovery only. */
const LOSS_PARTY_SEEDS = findParty('the party lost with a fallen member', (plan) => plan.outcome === 'defender-win' && someoneFell(plan), 2);

describe('§20 Guardian party settlement — one receipt through the persistence owner', () => {
  it.each([
    ['a won 3-member', PARTY_SEEDS],
    ['a lost 2-member', LOSS_PARTY_SEEDS],
  ] as const)('settles %s party in ONE revision and ONE receipt; every fallen member is in Recovery, unwounded, on reload', async (_label, seeds) => {
    const fixture = await partyHarness(seeds);
    const plan = partyPlan(seeds, 'combat-party-e2e');
    const party = plan.party!;
    expect(party.members).toHaveLength(seeds.length);
    const fallen = party.members.filter((m) => m.injury?.status === 'set-recovery');
    const idle = party.members.filter((m) => m.legEnd === 'not-fought');
    const decisive = party.members.find((m) => m.legEnd === 'decisive')!;
    expect(fallen.length).toBeGreaterThanOrEqual(1);
    expect(decisive.index).toBe(party.decisiveIndex);
    expect(plan.champion).toMatchObject({ kind: 'owned-fauna', creatureId: idOf(decisive) });
    // the pre-commit durable rows are the neutral fixture, so every expectation below is a real change
    for (const row of fixture.ownership.creatures) expect(row).toMatchObject({ xp: 0, hurt: 0, assignment: null });

    const outcome = await commit(fixture, plan);
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const repository = createRevisionedRepository(fixture.backend);
    expect(await repository.revision()).toBe(2);
    const receipt = await repository.readReceipt(0);
    expect(receipt).toEqual(plan.receipt);
    expect(await repository.readReceipt(1)).toBeUndefined();

    const loaded = await reload(fixture);
    expect(loaded.revision).toBe(2);
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome, revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions }, receipt,
    })).toMatchObject({ kind: 'verified', convergence: 'none', revision: 2, plan });

    const after = durableOwnership(loaded.extensions);
    expect(after.revision).toBe(fixture.ownership.revision + 1);
    // nothing removed or tombstoned
    expect(after.creatures.map((row) => row.creatureId).sort())
      .toEqual(fixture.ownership.creatures.map((row) => row.creatureId).sort());
    expect(after.creatureTombstones).toEqual(fixture.ownership.creatureTombstones);
    const rowOf = (state: OwnershipStateV2, id: string) => state.creatures.find((row) => row.creatureId === id)!;

    for (const member of fallen) {
      const before = rowOf(fixture.ownership, idOf(member));
      expect(rowOf(after, idOf(member))).toEqual({
        ...before,
        assignment: { kind: 'recovery', readyAtActivePlayMs: (plan.authority.activePlayMs ?? Number.NaN) + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 },
      });
      expect(rowOf(after, idOf(member)).hurt).toBe(before.hurt);   // §20: no wound for a fallen/swapped member
      expect(rowOf(after, idOf(member)).xp).toBe(before.xp);       // no member XP until S4
    }
    for (const member of idle) expect(rowOf(after, idOf(member))).toEqual(rowOf(fixture.ownership, idOf(member)));

    const decisiveBefore = rowOf(fixture.ownership, idOf(decisive));
    expect(rowOf(after, idOf(decisive))).toMatchObject(expectedDecisiveRow(plan, decisiveBefore));
    // the v4 Compendium mirror moves the decisive champion only; members keep their v4 rows byte-for-byte
    const codexOf = (id: string) => loaded.state.codex.find(([rowId]) => rowId === id)?.[1];
    const expected = expectedDecisiveRow(plan, decisiveBefore);
    expect(codexOf(`s${decisive.champion.kind === 'owned-fauna' ? decisive.champion.genome.seed : -1}`)?.g)
      .toMatchObject({ xp: expected.xp, hurt: expected.hurt ?? 0 });
    for (const member of [...fallen, ...idle]) {
      const seed = member.champion.kind === 'owned-fauna' ? member.champion.genome.seed : -1;
      expect(codexOf(`s${seed}`)).toEqual(fixture.writable.state.codex.find(([rowId]) => rowId === `s${seed}`)?.[1]);
    }
    expect(loaded.state.codex).toHaveLength(seeds.length);
    expect(loaded.state.stats.duels).toBe(1);
    expect(readCombatSettlementAuthorityV1(loaded.extensions)).toMatchObject({
      kind: 'loaded', authority: { battles: [{ sourceRevision: 1, receiptOrdinal: 0 }] },
    });
  });

  it('a party with a member that never fought leaves that member untouched on disk', async () => {
    const fixture = await partyHarness(IDLE_PARTY_SEEDS);
    const plan = partyPlan(IDLE_PARTY_SEEDS, 'combat-party-idle');
    const idle = plan.party!.members.filter((m) => m.legEnd === 'not-fought');
    expect(idle.length).toBeGreaterThanOrEqual(1);
    for (const member of idle) expect(member.injury).toEqual({ status: 'none', reason: 'not-fought' });
    const outcome = await commit(fixture, plan);
    expect(outcome.kind).toBe('committed');
    const after = durableOwnership((await reload(fixture)).extensions);
    for (const member of idle) {
      expect(after.creatures.find((row) => row.creatureId === idOf(member)))
        .toEqual(fixture.ownership.creatures.find((row) => row.creatureId === idOf(member)));
    }
  });
});

describe('§20 Guardian party settlement — Recovery never stacks', () => {
  function fallenSeed(): number {
    const plan = partyPlan(PARTY_SEEDS, 'combat-party-probe');
    const member = plan.party!.members.find((m) => m.injury?.status === 'set-recovery')!;
    return PARTY_SEEDS[member.index]!;
  }
  function decisiveSeed(): number {
    const plan = partyPlan(PARTY_SEEDS, 'combat-party-probe');
    return PARTY_SEEDS[plan.party!.decisiveIndex]!;
  }

  it('a fallen member still in an UNFINISHED Recovery rejects the whole commit; nothing is written', async () => {
    const seed = fallenSeed();
    const fixture = await partyHarness(PARTY_SEEDS, { [seed]: { assignment: { kind: 'recovery', readyAtActivePlayMs: CLOCK + 1 } } });
    const outcome = await commit(fixture, partyPlan(PARTY_SEEDS, 'combat-party-busy'));
    expect(outcome).toMatchObject({
      kind: 'rejected', stage: 'derive', message: 'combat fighter is still on assignment',
    });
    await expectNothingWritten(fixture);
  });

  it('a FINISHED Recovery (readyAt ≤ the settlement clock) is replaced by the new one and commits', async () => {
    const seed = fallenSeed();
    const fixture = await partyHarness(PARTY_SEEDS, { [seed]: { assignment: { kind: 'recovery', readyAtActivePlayMs: CLOCK } } });
    const plan = partyPlan(PARTY_SEEDS, 'combat-party-finished');
    const outcome = await commit(fixture, plan);
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const loaded = await reload(fixture);
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome, revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions },
      receipt: await createRevisionedRepository(fixture.backend).readReceipt(0),
    }).kind).toBe('verified');
    expect(durableOwnership(loaded.extensions).creatures.find((row) => row.creatureId === creatureIdFor(seed))?.assignment)
      .toEqual({ kind: 'recovery', readyAtActivePlayMs: READY_AT });
  });

  it('the decisive champion in an unfinished Recovery is refused before any write (the owner\'s availability gate)', async () => {
    const seed = decisiveSeed();
    const fixture = await partyHarness(PARTY_SEEDS, { [seed]: { assignment: { kind: 'recovery', readyAtActivePlayMs: CLOCK + 1 } } });
    expect(await commit(fixture, partyPlan(PARTY_SEEDS, 'combat-party-busy-decisive')))
      .toEqual({ kind: 'refused', reason: 'champion-assignment-unavailable' });
    await expectNothingWritten(fixture);
  });
});

describe('§20 Guardian party settlement — one-member parity', () => {
  it('a lone Balanced Auto party commits byte-identically to the single-champion path', async () => {
    const seed = PARTY_SEEDS[0]!;
    const champion = championFor(seed);
    const partyPlanned = partyPlan([seed], 'combat-party-lone');
    const transcript = runDuel(
      { name: champion.name, genome: champion.genome },
      { name: ENCOUNTER.defender.name, genome: ENCOUNTER.defender.battleGenome as Genome },
    );
    const single = planCombatSettlementV1({
      battleId: 'combat-party-lone', receiptOrdinal: 0, encounter: ENCOUNTER, champion, transcript,
      outcome: transcript.winner === 'A' ? 'champion-win' : transcript.winner === 'B' ? 'defender-win' : 'draw',
      worldTier: OPPORTUNITY.effectiveTier,
      authority: {
        worldConquered: false, claimedPrimeSignatureIds: [],
        lossXp: { kind: 'known-target', awardedTarget: 0 }, activePlayMs: CLOCK,
      },
    });
    if (single.status !== 'planned') throw new Error(`single plan refused ${single.reason}`);
    expect(partyPlanned.party).toBeUndefined();
    expect(partyPlanned.witness).toBe(single.witness);

    const viaParty = await partyHarness([seed]);
    const viaSingle = await partyHarness([seed]);
    expect((await commit(viaParty, partyPlanned)).kind).toBe('committed');
    expect((await commit(viaSingle, single)).kind).toBe('committed');
    const partyReceipt = await createRevisionedRepository(viaParty.backend).readReceipt(0);
    const singleReceipt = await createRevisionedRepository(viaSingle.backend).readReceipt(0);
    expect(partyReceipt).toEqual(singleReceipt);
    expect(partyReceipt?.witness).toBe(single.witness);
    const a = await reload(viaParty);
    const b = await reload(viaSingle);
    expect(a.revision).toBe(b.revision);
    expect(canonicalJson(a.state)).toBe(canonicalJson(b.state));
    expect(canonicalJson(a.extensions)).toBe(canonicalJson(b.extensions));
  });
});

describe('§20 Guardian party settlement — negative controls (the checks above are not vacuous)', () => {
  it('a single tampered member Recovery on the reloaded save fails verification', async () => {
    const fixture = await partyHarness(PARTY_SEEDS);
    const plan = partyPlan(PARTY_SEEDS, 'combat-party-tamper');
    const outcome = await commit(fixture, plan);
    if (outcome.kind !== 'committed') throw new Error(`expected commit, received ${outcome.kind}`);
    const loaded = await reload(fixture);
    const receipt = await createRevisionedRepository(fixture.backend).readReceipt(0);
    const needle = `readyAtActivePlayMs\\":${READY_AT}`;
    const raw = JSON.stringify(loaded.extensions);
    expect(raw.includes(needle)).toBe(true);   // the control really edits the member Recovery bytes
    const tampered = JSON.parse(raw.replace(needle, `readyAtActivePlayMs\\":${READY_AT - 1}`)) as typeof loaded.extensions;
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome, revision: loaded.revision, writable: { state: loaded.state, extensions: tampered }, receipt,
    })).toEqual({ kind: 'mismatch', convergence: 'read-only-reload', reason: 'save-mismatch' });
    // and the untampered reload still verifies, so the mismatch is the edit
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome, revision: loaded.revision, writable: { state: loaded.state, extensions: loaded.extensions }, receipt,
    }).kind).toBe('verified');
  });

  it('a cloned (unregistered) party plan is refused and writes nothing', async () => {
    const fixture = await partyHarness(PARTY_SEEDS);
    const plan = partyPlan(PARTY_SEEDS, 'combat-party-clone');
    expect(await commit(fixture, { ...plan } as Plan)).toEqual({ kind: 'refused', reason: 'plan-unregistered' });
    await expectNothingWritten(fixture);
  });

  it('a fallen member whose durable row disagrees with the plan (stale hurt) rejects the whole party', async () => {
    const plan = partyPlan(PARTY_SEEDS, 'combat-party-stale-member');
    const member = plan.party!.members.find((m) => m.injury?.status === 'set-recovery')!;
    const fixture = await partyHarness(PARTY_SEEDS, { [PARTY_SEEDS[member.index]!]: { hurt: 0.25 } });
    expect(await commit(fixture, plan)).toMatchObject({
      kind: 'rejected', stage: 'derive', message: 'combat party ownership refused champion-source-mismatch',
    });
    await expectNothingWritten(fixture);
  });
});

describe('§20 Guardian party settlement — every fighter owned and free (two bugs found by this suite, fixed 2026-09-25)', () => {
  /* WAS A BUG: a member on NEITHER carrier was skipped by both party helpers, so a phantom companion could fight and the party
     committed. deriveCombatSettlement now requires every owned fighter on exactly one carrier. */
  it('refuses a party whose fallen member is owned on neither carrier', async () => {
    const plan = partyPlan(PARTY_SEEDS, 'combat-party-phantom');
    const member = plan.party!.members.find((m) => m.injury?.status === 'set-recovery')!;
    const owned = PARTY_SEEDS.filter((_, index) => index !== member.index);
    const fixture = await partyHarness(owned);
    const outcome = await commit(fixture, plan);
    expect(outcome.kind).not.toBe('committed');
    await expectNothingWritten(fixture);
  });

  /* WAS A BUG (DESIGN.md §3): a NOT-FOUGHT member still in Recovery was never checked. The derive now checks every owned fighter's
     availability at the committed active-play clock. */
  it('refuses a party whose not-fought member is still in an unfinished Recovery', async () => {
    const plan = partyPlan(IDLE_PARTY_SEEDS, 'combat-party-busy-idle');
    const member = plan.party!.members.find((m) => m.legEnd === 'not-fought')!;
    const fixture = await partyHarness(IDLE_PARTY_SEEDS, {
      [IDLE_PARTY_SEEDS[member.index]!]: { assignment: { kind: 'recovery', readyAtActivePlayMs: CLOCK + 1 } },
    });
    const outcome = await commit(fixture, plan);
    expect(outcome.kind).not.toBe('committed');
    await expectNothingWritten(fixture);
  });
});
