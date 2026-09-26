/* §20 Command (step 4): the OPEN-ENCOUNTER record, end to end through the real F4 owners.
 *
 * A Command party fight is sealed in its own receipt, each Break answer is appended through the F4/F3 CAS (plus a decision-count
 * content CAS), a reload re-simulates to the same pending Break, and the ordinary combat settlement consumes the record in ONE
 * receipt. Every case READS THE SAVE BACK and asserts there. Design: audits/COMBAT_S2_PARTY_20260925/DESIGN.md §4; decision
 * port/DECISIONS.md §20. The harness is a verbatim copy of combat-party-settlement.test.ts's (itself generalised from the
 * single-champion one). */
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
  projectGuardianPrimeEncounterV1,
  runEncounterV1,
  autoEncounterDecisionV1,
  type CombatSettlementPlanV1,
  type EncounterDecisionV1,
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
  COMBAT_OPEN_ENCOUNTER_DECIDE_OPERATION_V1,
  COMBAT_OPEN_ENCOUNTER_NAMESPACE_V1,
  COMBAT_OPEN_ENCOUNTER_OPEN_OPERATION_V1,
  COMBAT_SETTLEMENT_OPERATION_V1,
  combatOpenEncounterMemberIdsV1,
  consumeCombatOpenEncounterV1,
  createF4DeterministicProductTransactionOwner,
  deriveCombatOpenEncounterDecisionV1,
  deriveCombatOpenEncounterOpenV1,
  planF4DeterministicProductReceipt,
  readCombatOpenEncounterV1,
  simulateCombatOpenEncounterV1,
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


function idOf(member: PartyBlock['members'][number]): string {
  if (member.champion.kind !== 'owned-fauna') throw new Error('party fixture holds only owned fauna');
  return member.champion.creatureId;
}


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

/* ---------- Command helpers ---------- */
const DEFENDER = Object.freeze({ name: ENCOUNTER.defender.name, genome: ENCOUNTER.defender.battleGenome as never });
const commandParty = (seeds: readonly number[]) => seeds.map((seed) => ({ champion: championFor(seed), stance: 'balanced' as const }));
const simulate = (seeds: readonly number[], decisions: readonly EncounterDecisionV1[]) => runEncounterV1({
  mode: 'command', defender: DEFENDER,
  party: seeds.map((seed) => ({ name: `Companion ${seed}`, genome: storedGenome(seed) as never, stance: 'balanced' as const })),
}, decisions);
/** Answer every Break the way Auto would: the complete decision list of a finished Command fight. */
function autoAnswers(seeds: readonly number[]): readonly EncounterDecisionV1[] {
  const decisions: EncounterDecisionV1[] = [];
  for (let guard = 0; guard < 16; guard++) {
    const result = simulate(seeds, decisions);
    if (result.status === 'finished') return decisions;
    decisions.push(autoEncounterDecisionV1(result.pendingBreak));
  }
  throw new Error('Command fixture never finished');
}
/** The first 3-member party whose Command fight reaches at least `breaks` Breaks. */
function findCommandParty(breaks: number): readonly number[] {
  for (let base = 3; base < 6_000; base += 7) {
    const seeds = [base, base + 1_000, base + 2_000];
    try { if (autoAnswers(seeds).length >= breaks) return seeds; } catch { /* next */ }
  }
  throw new Error(`no Command party fixture with ${breaks} Breaks`);
}
const COMMAND_SEEDS = findCommandParty(2);
const LONG_SEEDS = findCommandParty(3);

async function current(fixture: PartyHarness) {
  const loaded = await reload(fixture);
  return { revision: loaded.revision, writable: { state: loaded.state, extensions: loaded.extensions } as V5WritableState };
}

async function openFight(fixture: PartyHarness, battleId: string, seeds = COMMAND_SEEDS) {
  const { revision, writable } = await current(fixture);
  return createF4DeterministicProductTransactionOwner(createRevisionedRepository(fixture.backend), REGISTRY).commit({
    expectedRevision: revision, grant: fixture.grant, writable, snapshot: { activePlayMs: CLOCK }, now: NOW,
    operation: COMBAT_OPEN_ENCOUNTER_OPEN_OPERATION_V1, receiptKind: COMBAT_OPEN_ENCOUNTER_OPEN_OPERATION_V1,
    derive: ({ draft, extensions, receiptOrdinal }) => deriveCombatOpenEncounterOpenV1({
      draft, extensions, receiptOrdinal, battleId, encounter: ENCOUNTER, party: commandParty(seeds),
    }),
  });
}

async function decide(fixture: PartyHarness, battleId: string, expectedDecisions: number, decision: EncounterDecisionV1) {
  const { revision, writable } = await current(fixture);
  return createF4DeterministicProductTransactionOwner(createRevisionedRepository(fixture.backend), REGISTRY).commit({
    expectedRevision: revision, grant: fixture.grant, writable, snapshot: { activePlayMs: CLOCK }, now: NOW,
    operation: COMBAT_OPEN_ENCOUNTER_DECIDE_OPERATION_V1, receiptKind: COMBAT_OPEN_ENCOUNTER_DECIDE_OPERATION_V1,
    derive: ({ draft, extensions }) => deriveCombatOpenEncounterDecisionV1({ draft, extensions, battleId, expectedDecisions, decision }),
  });
}

async function commandPlan(fixture: PartyHarness, battleId: string, decisions: readonly EncounterDecisionV1[], seeds = COMMAND_SEEDS,
  mode: 'auto' | 'command' = 'command', stances?: readonly ('balanced' | 'press' | 'guard' | 'evade')[]): Promise<Plan> {
  const { writable } = await current(fixture);
  const receipt = planF4DeterministicProductReceipt(writable.extensions, COMBAT_SETTLEMENT_OPERATION_V1);
  if (receipt.kind !== 'planned') throw new Error('receipt');
  const planned = planCombatPartySettlementV1({
    battleId, receiptOrdinal: receipt.plan.receiptOrdinal, encounter: ENCOUNTER, worldTier: OPPORTUNITY.effectiveTier,
    mode, party: commandParty(seeds).map((m, i) => ({ ...m, stance: stances?.[i] ?? m.stance })), decisions,
    authority: { worldConquered: false, claimedPrimeSignatureIds: [], lossXp: { kind: 'known-target', awardedTarget: 0 }, activePlayMs: CLOCK },
  });
  if (planned.status !== 'planned') throw new Error(`command plan refused ${planned.reason}`);
  return planned;
}

async function settle(fixture: PartyHarness, plan: Plan) {
  const { revision, writable } = await current(fixture);
  const outcome = await createCombatSettlementPersistenceOwnerV1(createRevisionedRepository(fixture.backend), REGISTRY).commit({
    expectedRevision: revision, grant: fixture.grant, writable, snapshot: { activePlayMs: CLOCK }, now: NOW,
    plan, opportunity: OPPORTUNITY, ownershipV2: fixture.ownership, brinkAchievementJoin: null,
  });
  return { outcome, revision };
}

function openRecord(extensions: V5WritableState['extensions']) {
  const read = readCombatOpenEncounterV1(extensions);
  if (read.kind !== 'loaded') throw new Error(`open encounter carrier ${read.reason}`);
  return read.record;
}

describe('§20 Command — the open-encounter record through the real owners', () => {
  it('OPEN seals the plan in its own Recovery-free receipt; a reload re-simulates to the same pending Break', async () => {
    const fixture = await partyHarness(COMMAND_SEEDS);
    const opened = await openFight(fixture, 'cmd-open');
    if (opened.kind !== 'committed') throw new Error(JSON.stringify({ kind: opened.kind, stage: (opened as never)['stage'], message: (opened as never)['message'] }));
    const repository = createRevisionedRepository(fixture.backend);
    expect(await repository.revision()).toBe(2);
    expect((await repository.readReceipt(0))?.kind).toBe(COMBAT_OPEN_ENCOUNTER_OPEN_OPERATION_V1);
    const loaded = await reload(fixture);
    const record = openRecord(loaded.extensions)!;
    expect(record).toMatchObject({ battleId: 'cmd-open', decisions: [], openedAtReceiptOrdinal: 0 });
    expect(record.party.map((m) => (m.champion.kind === 'owned-fauna' ? m.champion.creatureId : '')))
      .toEqual(COMMAND_SEEDS.map((seed) => creatureIdFor(seed)));
    // the reload lands on exactly the Break a fresh simulation of the same plan reaches
    const fresh = simulate(COMMAND_SEEDS, []);
    expect(fresh.status).toBe('paused');
    expect(simulateCombatOpenEncounterV1(record)).toEqual(fresh);
    // Recovery-free: no ownership row, counter or combat ledger moved
    expect(canonicalJson(durableOwnership(loaded.extensions))).toBe(canonicalJson(fixture.ownership));
    expect(loaded.state.stats.duels).toBe(0);
    expect(readCombatSettlementAuthorityV1(loaded.extensions)).toMatchObject({ kind: 'loaded', authority: { battles: [] } });
    // the members are held; a second fight cannot open
    expect(combatOpenEncounterMemberIdsV1(loaded.extensions)).toEqual(COMMAND_SEEDS.map((seed) => creatureIdFor(seed)));
    expect(await openFight(fixture, 'cmd-open-2')).toMatchObject({ kind: 'rejected', stage: 'derive', message: expect.stringContaining('already-open') });
    expect(await repository.revision()).toBe(2);
  });

  it('DECIDE appends by CAS: each answer is durable, a stale count or an unoffered answer writes nothing', async () => {
    const fixture = await partyHarness(COMMAND_SEEDS);
    expect((await openFight(fixture, 'cmd-decide')).kind).toBe('committed');
    const first = autoAnswers(COMMAND_SEEDS)[0]!;
    expect((await decide(fixture, 'cmd-decide', 0, first)).kind).toBe('committed');
    let loaded = await reload(fixture);
    expect(loaded.revision).toBe(3);
    expect(openRecord(loaded.extensions)!.decisions).toEqual([first]);
    expect(simulateCombatOpenEncounterV1(openRecord(loaded.extensions)!)).toEqual(simulate(COMMAND_SEEDS, [first]));
    // content CAS: a second tab still showing 0 decisions cannot append
    expect(await decide(fixture, 'cmd-decide', 0, first)).toMatchObject({ kind: 'rejected', stage: 'derive', message: expect.stringContaining('decision-count-stale') });
    expect(await decide(fixture, 'another-battle', 1, 'hold')).toMatchObject({ kind: 'rejected', message: expect.stringContaining('battle-mismatch') });
    // an answer the pending Break does not offer (a lone last fighter is never offered Swap; find such a Break or a next-fighter one)
    const pending = simulate(COMMAND_SEEDS, [first]);
    if (pending.status !== 'paused') throw new Error('fixture needs a second Break');
    const unoffered = (['hold', 'swap', 'withdraw'] as const).find((d) => !pending.pendingBreak.options.includes(d));
    if (unoffered !== undefined) {
      expect(await decide(fixture, 'cmd-decide', 1, unoffered)).toMatchObject({ kind: 'rejected', stage: 'derive', message: expect.stringContaining('decision-not-offered') });
    }
    loaded = await reload(fixture);
    expect(loaded.revision).toBe(3);
    expect(openRecord(loaded.extensions)!.decisions).toEqual([first]);
  });

  it('SETTLE consumes the record in ONE receipt: same outcome and rewards as Auto answering the same way; record closed on reload', async () => {
    const fixture = await partyHarness(COMMAND_SEEDS);
    expect((await openFight(fixture, 'cmd-settle')).kind).toBe('committed');
    const answers = autoAnswers(COMMAND_SEEDS);
    for (let i = 0; i < answers.length - 1; i++) expect((await decide(fixture, 'cmd-settle', i, answers[i]!)).kind).toBe('committed');
    // the final answer rides the settlement's own CAS
    const plan = await commandPlan(fixture, 'cmd-settle', answers);
    const { outcome, revision } = await settle(fixture, plan);
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const loaded = await reload(fixture);
    expect(loaded.revision).toBe(revision + 1);
    expect(openRecord(loaded.extensions)).toBeNull();
    expect(combatOpenEncounterMemberIdsV1(loaded.extensions)).toEqual([]);
    const receipt = await createRevisionedRepository(fixture.backend).readReceipt(plan.receiptOrdinal);
    expect(receipt).toEqual(plan.receipt);
    expect(verifyCommittedCombatSettlementV1({ committed: outcome, revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions }, receipt })).toMatchObject({ kind: 'verified' });
    expect(loaded.state.stats.duels).toBe(1);
    // identical rewards: Auto with the same plan answers every Break the same way, so outcome, rewards, conquest and XP are equal
    const auto = await commandPlan(await partyHarness(COMMAND_SEEDS), 'cmd-settle-auto', [], COMMAND_SEEDS, 'auto');
    expect(auto.outcome).toBe(plan.outcome);
    expect(plan.rewards).toEqual(auto.rewards);
    expect(plan.conquest.status).toBe(auto.conquest.status);
    expect(plan.xp).toEqual(auto.xp);
  });

  it('WITHDRAW at the first Break settles as a fight not won; the leaving fighter is in Recovery, unwounded; nothing is conquered', async () => {
    const fixture = await partyHarness(COMMAND_SEEDS);
    expect((await openFight(fixture, 'cmd-withdraw')).kind).toBe('committed');
    const plan = await commandPlan(fixture, 'cmd-withdraw', ['withdraw']);
    expect(plan.outcome).not.toBe('champion-win');
    expect(plan.rewards.stardust.amount).toBe(0);
    const { outcome } = await settle(fixture, plan);
    expect(outcome.kind).toBe('committed');
    const loaded = await reload(fixture);
    expect(openRecord(loaded.extensions)).toBeNull();
    expect(loaded.state.conquered).toEqual([]);
    const after = durableOwnership(loaded.extensions);
    const decisiveId = plan.champion.kind === 'owned-fauna' ? plan.champion.creatureId : '';
    const decisive = after.creatures.find((row) => row.creatureId === decisiveId)!;
    expect(decisive.assignment).toEqual({ kind: 'recovery', readyAtActivePlayMs: READY_AT });
    expect(decisive.hurt).toBe(0);
    const idle = plan.party!.members.filter((m) => m.legEnd === 'not-fought');
    expect(idle.length).toBeGreaterThanOrEqual(1);
    for (const member of idle) {
      expect(after.creatures.find((row) => row.creatureId === idOf(member))).toEqual(fixture.ownership.creatures.find((row) => row.creatureId === idOf(member)));
    }
  });
});

describe('§20 Command — the open record cannot be escaped or forged (negative controls)', () => {
  it('while a record is open, an Auto fight (even of the same party) is refused and nothing is written', async () => {
    const fixture = await partyHarness(COMMAND_SEEDS);
    expect((await openFight(fixture, 'cmd-block')).kind).toBe('committed');
    const auto = await commandPlan(fixture, 'cmd-block-auto', [], COMMAND_SEEDS, 'auto');
    const { outcome } = await settle(fixture, auto);
    expect(outcome).toMatchObject({ kind: 'rejected', stage: 'derive', message: expect.stringContaining('must be answered') });
    expect(await createRevisionedRepository(fixture.backend).revision()).toBe(2);
  });

  it('a settlement that is not the sealed fight is refused: another battle id, a changed stance, another history, unappended answers', async () => {
    const fixture = await partyHarness(LONG_SEEDS);
    expect((await openFight(fixture, 'cmd-seal', LONG_SEEDS)).kind).toBe('committed');
    const answers = autoAnswers(LONG_SEEDS);
    expect(answers.length).toBeGreaterThanOrEqual(3);
    expect((await decide(fixture, 'cmd-seal', 0, answers[0]!)).kind).toBe('committed');
    const { writable } = await current(fixture);
    // POSITIVE control first: the true two-answer history passes the very rule the refusals below exercise
    // (a finished plan needs a finishing history: Withdraw at the 2nd Break always finishes)
    const truePlan = await commandPlan(fixture, 'cmd-seal', [answers[0]!, 'withdraw'], LONG_SEEDS);
    expect(consumeCombatOpenEncounterV1(writable.extensions, truePlan)).not.toBeNull();
    const wrongBattle = await commandPlan(fixture, 'cmd-seal-other', [answers[0]!, 'withdraw'], LONG_SEEDS);
    expect(() => consumeCombatOpenEncounterV1(writable.extensions, wrongBattle)).toThrow(/not the sealed open encounter/);
    // another history: Withdraw at the FIRST Break instead of the appended answer (Auto never withdraws, so it differs)
    expect(answers[0]).not.toBe('withdraw');
    const other = await commandPlan(fixture, 'cmd-seal', ['withdraw'], LONG_SEEDS);
    expect(() => consumeCombatOpenEncounterV1(writable.extensions, other)).toThrow(/not the appended ones/);
    // two unappended answers at once
    const leapt = await commandPlan(fixture, 'cmd-seal', [answers[0]!, answers[1]!, 'withdraw'], LONG_SEEDS);
    expect(() => consumeCombatOpenEncounterV1(writable.extensions, leapt)).toThrow(/not the appended ones/);
    // a changed stance is another fight (Withdraw at the first Break of the guarded fight always settles)
    const guarded = await commandPlan(fixture, 'cmd-seal', ['withdraw'], LONG_SEEDS, 'command', ['guard', 'balanced', 'balanced']).catch(() => null);
    if (guarded !== null) expect(() => consumeCombatOpenEncounterV1(writable.extensions, guarded)).toThrow(/not the sealed open encounter/);
    const guardedAll = await commandPlan(fixture, 'cmd-seal', [answers[0]!, 'withdraw'], LONG_SEEDS, 'command', ['balanced', 'balanced', 'evade']).catch(() => null);
    expect(guarded !== null || guardedAll !== null).toBe(true);
    if (guardedAll !== null) expect(() => consumeCombatOpenEncounterV1(writable.extensions, guardedAll)).toThrow(/not the sealed open encounter/);
  });

  it('a Command settlement WITH decisions but no open record is refused (answers must have been appended)', async () => {
    const fixture = await partyHarness(COMMAND_SEEDS);
    const plan = await commandPlan(fixture, 'cmd-no-record', autoAnswers(COMMAND_SEEDS));
    const { outcome } = await settle(fixture, plan);
    expect(outcome).toMatchObject({ kind: 'rejected', stage: 'derive', message: expect.stringContaining('needs its open-encounter record') });
    await expectNothingWritten(fixture);
  });

  it('a tampered carrier (a forged answer, a broken seal, a wrong segment) reads as PROTECTED, never as "no open fight"', async () => {
    const fixture = await partyHarness(COMMAND_SEEDS);
    expect((await openFight(fixture, 'cmd-tamper')).kind).toBe('committed');
    const loaded = await reload(fixture);
    const carrier = loaded.extensions.player![COMBAT_OPEN_ENCOUNTER_NAMESPACE_V1]!;
    // control: the untouched carrier loads
    expect(readCombatOpenEncounterV1(loaded.extensions).kind).toBe('loaded');
    const withJson = (json: string) => ({ ...loaded.extensions, player: { ...loaded.extensions.player, [COMBAT_OPEN_ENCOUNTER_NAMESPACE_V1]: { ...carrier, json } } });
    const forged = carrier.json.replace('"decisions":[]', '"decisions":["swap","swap","swap","swap"]');
    expect(forged).not.toBe(carrier.json);
    expect(readCombatOpenEncounterV1(withJson(forged))).toMatchObject({ kind: 'protected', reason: 'corrupt' });
    expect(combatOpenEncounterMemberIdsV1(withJson(forged))).toBeNull();
    const sealBroken = carrier.json.replace('"stance":"balanced"', '"stance":"press"');
    expect(sealBroken).not.toBe(carrier.json);
    expect(readCombatOpenEncounterV1(withJson(sealBroken))).toMatchObject({ kind: 'protected', reason: 'corrupt' });
    const moved = applyV5ExtensionWrites(loaded.extensions, [{ segment: 'settings', namespace: COMBAT_OPEN_ENCOUNTER_NAMESPACE_V1, carrier }]).extensions;
    expect(readCombatOpenEncounterV1(moved)).toMatchObject({ kind: 'protected', reason: 'wrong-segment' });
  });
});
