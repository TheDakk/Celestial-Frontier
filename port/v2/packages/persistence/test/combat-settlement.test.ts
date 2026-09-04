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
  sha256Hex,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  projectGuardianCompanionsV1,
} from '@cf/domain-acquisition/guardian-companion-internal';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  PRIME_SIGNATURE_IDS_V1,
  isCombatSettlementPlanV1,
  planCombatSettlementV1,
  projectGuardianPrimeEncounterV1,
  runDuel,
  type CombatSettlementPlanV1,
} from '@cf/domain-combatcore';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { MAX_UNLOCKED_ACHIEVEMENT_IDS } from '@cf/domain-progression';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  COMBAT_SETTLEMENT_AUTHORITY_NAMESPACE_V1,
  COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1,
  COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1,
  COMBAT_STARTER_CONQUEST_CHARTER_ID_V1,
  COMBAT_STARTER_CONQUEST_CHARTER_STARDUST_V1,
  COMBAT_BRINK_ACHIEVEMENT_ID_V1,
  COMBAT_BRINK_ACHIEVEMENT_OWNER_V1,
  GUARDIAN_ACQUISITION_NAMESPACE_V1,
  GUARDIAN_COMPANION_NAMESPACE_V1,
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
  projectLegacyPlayerSettlementChampionV1,
  projectGuardianCombatLossXpAuthorityV1,
  readArc5OwnershipMigration,
  readCombatSettlementAuthorityV1,
  readGuardianAcquisitionCarrierV1,
  readGuardianCompanionCarrierV1,
  readRevisionedSaveV5WithRecovery,
  readSaveV5,
  verifyCommittedCombatSettlementV1,
  type CombatSettlementAuthorityV1,
  type CombatSettlementBrinkAchievementJoinV1,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type TabLeaseGrant,
  type V5Extensions,
  type V5WritableState,
} from '@cf/persistence';
import {
  ARC6_PLAYER_CHAMPION_ID,
  commitArc6CombatActionV1,
  projectArc6CombatChampionV1,
  projectArc6CombatChampionRosterV1,
} from '../../../apps/game/src/arc6-combat-action.js';
import {
  prepareArc9EventAchievementJoinV1,
  projectArc9ProgressionStateV1,
} from '../../../apps/game/src/arc9-progression-projection.js';

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
const WORLD_INPUT = Object.freeze({
  galaxy: Object.freeze({ seed: 1594395733, x: -5501.81, y: -11753.64 }),
  star: Object.freeze({ seed: 4077594722, x: -271.54, y: -67.36 }),
  planet: Object.freeze({ seed: 488332735 }),
});
const resolved = resolveCF1WorldAddress(WORLD_INPUT);
if (!resolved.ok) throw new Error(`combat persistence world failed: ${resolved.reason}`);
const WORLD = resolved.address;
const OPPORTUNITY = projectWorldOpportunity(WORLD);
const DEFENDER = makeGenome(999, 'fauna', 0.5);
const projectedEncounter = projectGuardianPrimeEncounterV1({
  world: WORLD,
  descriptor: { worldType: OPPORTUNITY.source.planetType },
  regionIndex: 0,
  faunaRoster: [{ speciesId: 'combat-persistence-defender', genome: DEFENDER }],
  claimedSignatureIds: [],
  conquered: false,
});
if (projectedEncounter === null || projectedEncounter.defender.kind !== 'fauna') {
  throw new Error('combat persistence fixture did not select ordinary fauna');
}
const ENCOUNTER = projectedEncounter;

function controlledClock(): { now: () => number } {
  return { now: () => 0 };
}

function xpStageKey(ledgerIdentity: string, stage: 'base' | 'near-brink-upgrade'): string {
  return sha256Hex(canonicalJson({
    schema: 'cf-v2-combat-loss-xp-stage/v1', ledgerIdentity, stage,
  }));
}

function cloneState(state: SaveStateV2): SaveStateV2 {
  return JSON.parse(JSON.stringify(state)) as SaveStateV2;
}

function combatRosterAuthorityKey(
  ownershipV2: OwnershipStateV2,
  extensions: V5Extensions,
): string {
  const roster = projectArc6CombatChampionRosterV1({ ownershipV2, extensions });
  if (roster.kind !== 'projected') throw new Error(`combat roster protected: ${roster.reason}`);
  return roster.authorityKey;
}

interface Harness {
  readonly backend: StorageBackend;
  readonly grant: TabLeaseGrant;
  readonly writable: V5WritableState;
  readonly ownership: OwnershipStateV2;
  readonly creatureId: CreatureInstanceId;
  readonly legacyId: string;
  readonly target: 0 | 3 | 5;
  readonly seed: number;
}

async function harness(
  seed: number,
  target: 0 | 3 | 5,
  backend: StorageBackend = createMemoryBackend(),
  creatureXp: number = target,
  strengthen = false,
  claimedPrimeSignatureIds: readonly (typeof PRIME_SIGNATURE_IDS_V1)[number][] = [],
  configureState: ((state: SaveStateV2) => void) | null = null,
): Promise<Harness> {
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
  expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`expected base v5, received ${loaded.kind}`);

  const legacyId = `s${seed}`;
  const creatureId = ownershipContentId('creature', `combat-persistence-${seed}`) as CreatureInstanceId;
  const discoveryId = ownershipContentId('discovery', `combat-persistence-${seed}`) as DiscoveryRecordId;
  const genome = makeGenome(seed, 'fauna', 0.5);
  genome.gen = 1;
  genome.parents = [101, 202];
  genome.xp = creatureXp;
  genome.hurt = 0;
  if (strengthen) {
    genome.fed = 200;
    genome.brood = 200;
  }
  const identity = canonicalGenomeIdentityV1(genome);
  const discovery = createLegacyDiscoveryRecordV1({
    recordId: discoveryId,
    speciesId: identity.speciesId,
    legacyCodexId: legacyId,
    legacySourceIndex: 0,
    from: 'Persistence fixture (bred)',
    legacyLocation: null,
    firstForSpecies: true,
  });
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity,
      alias: null,
      firstObservationId: discovery.recordId,
    })],
    discoveries: [discovery],
    creatures: [createCreatureInstanceV1({
      creatureId,
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: null,
      origin: 'legacy',
      acquisitionRecordId: discovery.recordId,
      lineage: { kind: 'legacy-parent-seeds', generation: 1, parentSeeds: [101, 202] },
      xp: creatureXp,
      hurt: 0,
      fed: strengthen ? 200 : null,
      brood: strengthen ? 200 : null,
      assignment: null,
      bond: null,
    })],
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  let extensions = applyV5ExtensionWrites(
    loaded.extensions,
    encodeArc4Ownership(source).writes,
  ).extensions;
  const arc5 = prepareArc5OwnershipMigration({
    extensions,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(`Arc 5 fixture refused ${arc5.kind}`);
  extensions = arc5.extensions;

  const state = cloneState(loaded.state);
  state.conquered = [];
  state.primeFill = Object.fromEntries(claimedPrimeSignatureIds.map((id) => [id, {
    title: `Prior ${id}`,
    sub: 'prior claim',
    tier: 14,
    hex: '#ffd96a',
    where: null,
  }]));
  state.frontierUnlocked = claimedPrimeSignatureIds.length >= PRIME_SIGNATURE_IDS_V1.length;
  state.equip = {};
  state.equipAff = {};
  state.chacc = [];
  state.scoutId = null;
  state.stats.duels = 0;
  state.stats.duelwins = 0;
  state.stats.guardians = 0;
  state.codex = [[legacyId, {
    id: legacyId,
    name: `Champion ${seed}`,
    kind: 'Fauna',
    tier: null,
    realm: 'Wild',
    sapient: 0,
    from: 'Persistence fixture (bred)',
    hybrid: true,
    g: {
      ...identity.genome, xp: creatureXp, hurt: 0,
      ...(strengthen ? { fed: 200, brood: 200 } : {}),
    },
    where: null,
  }]];
  state.xpFirstsBinding = null;
  configureState?.(state);
  const ledgerIdentity = `combat-loss-xp/v1|${creatureId}|${WORLD.key}`;
  const legacyKey = `${legacyId}|conqloss:${WORLD.planet.seed}`.slice(0, 64);
  const keys = target === 0 ? [] : [legacyKey, xpStageKey(ledgerIdentity, 'base')];
  if (target === 5) keys.push(xpStageKey(ledgerIdentity, 'near-brink-upgrade'));
  state.xpFirsts = keys;
  if (target !== 0) {
    const authority: CombatSettlementAuthorityV1 = {
      schema: COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1,
      version: COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1,
      battles: [],
      conquests: [],
      lossXp: [{ creatureId, ledgerIdentity, target, worldKey: WORLD.key }],
    };
    extensions = applyV5ExtensionWrites(extensions, [{
      segment: 'player',
      namespace: COMBAT_SETTLEMENT_AUTHORITY_NAMESPACE_V1,
      carrier: { version: 1, json: canonicalJson(authority) },
    }]).extensions;
  }

  const clock = controlledClock();
  const client = createTabLeaseClient(backend, {
    ownerId: `combat-tab-${seed}-${target}`,
    token: `combat-token-${seed}-${target}`,
    ttlMs: 10,
    now: clock.now,
  });
  const acquired = await client.acquire();
  if (acquired.kind !== 'acquired') throw new Error(`lease fixture received ${acquired.kind}`);
  const seeded = await createActivePlayPersistenceOwner(
    createRevisionedRepository(backend),
    REGISTRY,
  ).commit({
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
  const ownership = readArc5OwnershipMigration(
    current.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  if (ownership.kind !== 'loaded') throw new Error(`ownership fixture received ${ownership.kind}`);
  return Object.freeze({
    backend,
    grant: acquired.grant,
    writable: { state: current.state, extensions: current.extensions },
    ownership: ownership.state,
    creatureId,
    legacyId,
    target,
    seed,
  });
}

function planForEncounter(
  fixture: Harness,
  battleId: string,
  encounter: typeof ENCOUNTER,
  opportunity: typeof OPPORTUNITY,
  claimedPrimeSignatureIds: readonly (typeof PRIME_SIGNATURE_IDS_V1)[number][],
  receiptOrdinal = 0,
): CombatSettlementPlanV1 {
  const creature = fixture.ownership.creatures.find((row) => row.creatureId === fixture.creatureId);
  if (!creature) throw new Error('combat fixture creature vanished');
  const genome: Genome = { ...creature.genome } as Genome;
  if (creature.xp !== null) genome.xp = creature.xp;
  if (creature.hurt !== null) genome.hurt = creature.hurt;
  if (creature.fed !== null) genome.fed = creature.fed;
  if (creature.brood !== null) genome.brood = creature.brood;
  const champion = {
    kind: 'owned-fauna' as const,
    creatureId: creature.creatureId,
    name: `Champion ${fixture.seed}`,
    genome,
    legacyBredLineage: true,
  };
  const transcript = runDuel(
    { name: champion.name, genome },
    { name: encounter.defender.name, genome: encounter.defender.battleGenome as Genome },
  );
  const outcome = transcript.winner === 'A' ? 'champion-win'
    : transcript.winner === 'B' ? 'defender-win' : 'draw';
  const planned = planCombatSettlementV1({
    battleId,
    receiptOrdinal,
    encounter,
    champion,
    transcript,
    outcome,
    worldTier: opportunity.effectiveTier,
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds,
      lossXp: { kind: 'known-target', awardedTarget: fixture.target },
    },
  });
  if (planned.status !== 'planned') throw new Error(`combat plan refused ${planned.reason}`);
  return planned;
}

function planFor(fixture: Harness, battleId: string, receiptOrdinal = 0): CombatSettlementPlanV1 {
  return planForEncounter(fixture, battleId, ENCOUNTER, OPPORTUNITY, [], receiptOrdinal);
}

function guardianChampionPlanFor(input: Readonly<{
  writable: V5WritableState;
  battleId: string;
  encounter: typeof ENCOUNTER;
  opportunity: typeof OPPORTUNITY;
  claimedPrimeSignatureIds: readonly (typeof PRIME_SIGNATURE_IDS_V1)[number][];
  receiptOrdinal: number;
}>): Readonly<{
  plan: CombatSettlementPlanV1;
  creatureId: CreatureInstanceId;
  xpBefore: number;
  hurtBefore: number | null;
}> {
  const source = readGuardianAcquisitionCarrierV1(
    input.writable.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  const overlay = readGuardianCompanionCarrierV1(input.writable.extensions);
  if (source.kind !== 'loaded' || overlay.kind !== 'loaded') {
    throw new Error('Guardian champion fixture carrier is protected');
  }
  const roster = projectGuardianCompanionsV1({
    source: source.state,
    overlay: overlay.state,
  });
  if (roster.kind !== 'projected' || roster.creatures.length !== 1) {
    throw new Error('Guardian champion fixture did not project one live creature');
  }
  const creature = roster.creatures[0]!;
  const genome: Genome = { ...creature.genome } as Genome;
  if (creature.xp !== null) genome.xp = creature.xp;
  if (creature.hurt !== null) genome.hurt = creature.hurt;
  const champion = Object.freeze({
    kind: 'owned-fauna' as const,
    creatureId: creature.creatureId,
    name: `Guardian ${creature.genome.seed}`,
    genome,
    legacyBredLineage: false,
  });
  const transcript = runDuel(
    { name: champion.name, genome },
    {
      name: input.encounter.defender.name,
      genome: input.encounter.defender.battleGenome as Genome,
    },
  );
  const outcome = transcript.winner === 'A' ? 'champion-win'
    : transcript.winner === 'B' ? 'defender-win' : 'draw';
  const lossXp = projectGuardianCombatLossXpAuthorityV1({
    state: input.writable.state,
    extensions: input.writable.extensions,
    guardianAcquisitions: source.state,
    guardianCompanions: overlay.state,
    creature,
    worldKey: input.opportunity.key,
    planetSeed: input.opportunity.address.planet.seed,
  });
  if (lossXp.kind !== 'ready') {
    throw new Error(`Guardian loss-XP authority protected: ${lossXp.reason}`);
  }
  const planned = planCombatSettlementV1({
    battleId: input.battleId,
    receiptOrdinal: input.receiptOrdinal,
    encounter: input.encounter,
    champion,
    transcript,
    outcome,
    worldTier: input.opportunity.effectiveTier,
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds: input.claimedPrimeSignatureIds,
      lossXp: lossXp.authority,
    },
  });
  if (planned.status !== 'planned') {
    throw new Error(`Guardian champion combat plan refused ${planned.reason}`);
  }
  return Object.freeze({
    plan: planned,
    creatureId: creature.creatureId,
    xpBefore: creature.xp ?? 0,
    hurtBefore: creature.hurt,
  });
}

const PLAYER_DAMAGE = Math.round(16 + ENCOUNTER.defender.power / 24);

function configurePlayerBrinkState(
  hpAfter: number,
  unlocked: readonly string[] = [],
): (state: SaveStateV2) => void {
  return (state) => {
    state.hp = PLAYER_DAMAGE + hpAfter;
    state.HP_MAX = Math.max(100, state.hp);
    state.pstats = { vit: 50, fer: 1, res: 1, agi: 1, ins: 1 };
    state.unlocked = [...unlocked];
  };
}

function playerPlanFor(fixture: Harness, battleId: string): CombatSettlementPlanV1 {
  const champion = projectLegacyPlayerSettlementChampionV1(fixture.writable.state);
  const transcript = runDuel(
    { name: champion.name, genome: { seed: champion.genomeSeed }, stats: champion.stats },
    { name: ENCOUNTER.defender.name, genome: ENCOUNTER.defender.battleGenome as Genome },
  );
  const outcome = transcript.winner === 'A' ? 'champion-win'
    : transcript.winner === 'B' ? 'defender-win' : 'draw';
  const planned = planCombatSettlementV1({
    battleId,
    receiptOrdinal: 0,
    encounter: ENCOUNTER,
    champion,
    transcript,
    outcome,
    worldTier: OPPORTUNITY.effectiveTier,
    authority: {
      worldConquered: false,
      claimedPrimeSignatureIds: [],
      lossXp: null,
    },
  });
  if (planned.status !== 'planned') throw new Error(`player combat plan refused ${planned.reason}`);
  if (planned.injury.status !== 'damage-player') {
    throw new Error(`player brink fixture did not lose: ${planned.outcome}`);
  }
  return planned;
}

function preparedBrinkJoin(state: SaveStateV2): CombatSettlementBrinkAchievementJoinV1 {
  const join = prepareArc9EventAchievementJoinV1(state, 'brink');
  if (join.kind !== 'prepared'
    || join.achievementId !== COMBAT_BRINK_ACHIEVEMENT_ID_V1
    || join.owner !== COMBAT_BRINK_ACHIEVEMENT_OWNER_V1) {
    throw new Error(`brink join refused ${join.kind === 'protected' ? join.reason : 'identity'}`);
  }
  return Object.freeze({
    kind: 'prepared',
    achievementId: COMBAT_BRINK_ACHIEVEMENT_ID_V1,
    owner: COMBAT_BRINK_ACHIEVEMENT_OWNER_V1,
    added: join.added,
    priorUnlockedCount: join.priorUnlockedCount,
    nextUnlockedIds: join.nextUnlockedIds,
  });
}

async function commitPlayer(
  fixture: Harness,
  plan: CombatSettlementPlanV1,
  brinkAchievementJoin: CombatSettlementBrinkAchievementJoinV1 | null,
) {
  return createCombatSettlementPersistenceOwnerV1(
    createRevisionedRepository(fixture.backend),
    REGISTRY,
  ).commit({
    expectedRevision: 1,
    grant: fixture.grant,
    writable: fixture.writable,
    snapshot: { activePlayMs: 250 },
    now: NOW,
    plan,
    opportunity: OPPORTUNITY,
    ownershipV2: null,
    brinkAchievementJoin,
  });
}

async function commit(fixture: Harness, plan: CombatSettlementPlanV1, expectedRevision = 1) {
  return createCombatSettlementPersistenceOwnerV1(
    createRevisionedRepository(fixture.backend),
    REGISTRY,
  ).commit({
    expectedRevision,
    grant: fixture.grant,
    writable: fixture.writable,
    snapshot: { activePlayMs: 250 },
    now: NOW,
    plan,
    opportunity: OPPORTUNITY,
    ownershipV2: fixture.ownership,
    brinkAchievementJoin: null,
  });
}

async function commitGuardianChampion(
  fixture: Harness,
  writable: V5WritableState,
  plan: CombatSettlementPlanV1,
  opportunity: typeof OPPORTUNITY,
  expectedRevision: number,
) {
  const ownership = readArc5OwnershipMigration(
    writable.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  if (ownership.kind !== 'loaded') {
    throw new Error(`Guardian champion Arc 5 collision authority is ${ownership.kind}`);
  }
  return createCombatSettlementPersistenceOwnerV1(
    createRevisionedRepository(fixture.backend),
    REGISTRY,
  ).commit({
    expectedRevision,
    grant: fixture.grant,
    writable,
    snapshot: { activePlayMs: 350 },
    now: NOW,
    plan,
    opportunity,
    ownershipV2: ownership.state,
    brinkAchievementJoin: null,
  });
}

async function reload(fixture: Harness) {
  const loaded = await readRevisionedSaveV5WithRecovery(fixture.backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`combat reload received ${loaded.kind}`);
  return loaded;
}

describe('Arc 6 combat persistence — conquest-loss XP order correction', () => {
  it('commits the ordinary +3 lesson and reloads exact v4/v5/receipt/ownership evidence', async () => {
    const fixture = await harness(2, 0);
    const plan = planFor(fixture, 'combat-loss-base');
    expect(plan.xp).toMatchObject({
      status: 'loss-target', previousTarget: 0, nextTarget: 3, totalDelta: 3,
    });
    const outcome = await commit(fixture, plan);
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const loaded = await reload(fixture);
    const receipt = await createRevisionedRepository(fixture.backend).readReceipt(0);
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome,
      revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions },
      receipt,
    })).toMatchObject({ kind: 'verified', revision: 2, plan });
    expect(receipt).toEqual(plan.receipt);
    expect(loaded.state.stats.duels).toBe(1);
    const codex = loaded.state.codex.find(([id]) => id === fixture.legacyId)?.[1];
    expect(codex?.g).toMatchObject({ xp: 3, hurt: 0.85 });
    const ownership = readArc5OwnershipMigration(
      loaded.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(ownership.kind).toBe('loaded');
    if (ownership.kind === 'loaded') {
      expect(ownership.state.creatures[0]).toMatchObject({ xp: 3, hurt: 0.85 });
    }
    const authority = readCombatSettlementAuthorityV1(loaded.extensions);
    expect(authority).toMatchObject({
      kind: 'loaded',
      authority: {
        battles: [{ sourceRevision: 1, receiptOrdinal: 0 }],
        lossXp: [{ creatureId: fixture.creatureId, target: 3, worldKey: WORLD.key }],
      },
    });
    expect(loaded.state.xpFirsts).toHaveLength(2);
  });

  it('upgrades 3→5 by exactly +2, and a prior 5 makes the later ordinary loss a zero-XP fixed point', async () => {
    const upgrade = await harness(51, 3);
    const upgradePlan = planFor(upgrade, 'combat-loss-upgrade');
    expect(upgradePlan.xp).toMatchObject({
      status: 'loss-target', previousTarget: 3, nextTarget: 5, totalDelta: 2,
    });
    expect((await commit(upgrade, upgradePlan)).kind).toBe('committed');
    const upgradeLoaded = await reload(upgrade);
    const upgradeAuthority = readCombatSettlementAuthorityV1(upgradeLoaded.extensions);
    expect(upgradeAuthority).toMatchObject({
      kind: 'loaded', authority: { lossXp: [{ target: 5 }] },
    });
    expect(upgradeLoaded.state.codex[0]?.[1].g.xp).toBe(5);
    expect(upgradeLoaded.state.xpFirsts).toHaveLength(3);

    const reverse = await harness(2, 5);
    const reversePlan = planFor(reverse, 'combat-loss-reverse-fixed-point');
    expect(reversePlan.xp).toMatchObject({
      status: 'loss-target', previousTarget: 5, nextTarget: 5, totalDelta: 0,
    });
    expect((await commit(reverse, reversePlan)).kind).toBe('committed');
    const reverseLoaded = await reload(reverse);
    expect(reverseLoaded.state.codex[0]?.[1].g.xp).toBe(5);
    expect(readCombatSettlementAuthorityV1(reverseLoaded.extensions)).toMatchObject({
      kind: 'loaded', authority: { lossXp: [{ target: 5 }] },
    });
  });

  it('pays the near-brink +5 in one settlement when it happens first', async () => {
    const fixture = await harness(51, 0);
    const plan = planFor(fixture, 'combat-loss-near-brink-first');
    expect(plan.xp).toMatchObject({
      status: 'loss-target', previousTarget: 0, nextTarget: 5, totalDelta: 5,
    });
    expect((await commit(fixture, plan)).kind).toBe('committed');
    const loaded = await reload(fixture);
    expect(loaded.state.codex[0]?.[1].g.xp).toBe(5);
    expect(readCombatSettlementAuthorityV1(loaded.extensions)).toMatchObject({
      kind: 'loaded', authority: { lossXp: [{ target: 5 }] },
    });
  });
});

describe('Arc 6 combat persistence — ordinary conquest compatibility', () => {
  it('atomically lands an ordinary win across counters, XP/wound, conquest, Stardust, progression, and the canonical ledger', async () => {
    const fixture = await harness(3, 0);
    const plan = planFor(fixture, 'combat-ordinary-conquest');
    expect(plan.outcome).toBe('champion-win');
    expect(plan.guardianCapture).toEqual({ status: 'none' });
    const outcome = await commit(fixture, plan);
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const loaded = await reload(fixture);
    expect(loaded.state.stats).toMatchObject({ duels: 1, duelwins: 1, guardians: 0 });
    expect(loaded.state.conquered).toEqual([[
      WORLD.planet.seed,
      { t: NOW - 3_600_000, tier: OPPORTUNITY.effectiveTier },
    ]]);
    expect(loaded.state.essence).toBe(fixture.writable.state.essence + plan.rewards.stardust.amount);
    expect(loaded.state.stats.essenceEarned).toBe(
      (fixture.writable.state.stats.essenceEarned ?? 0) + plan.rewards.stardust.amount,
    );
    expect(loaded.state.unlocked).toContain('settle1');
    if (loaded.state.tutDone && loaded.state.ascCh <= 1) {
      expect(loaded.state.ascProg['c2-conq']).toBe(1);
    }
    const authority = readCombatSettlementAuthorityV1(loaded.extensions);
    expect(authority).toMatchObject({
      kind: 'loaded',
      authority: {
        battles: [{ outcome: 'champion-win', worldKey: WORLD.key }],
        conquests: [{
          worldKey: WORLD.key,
          planetSeed: WORLD.planet.seed,
          tier: OPPORTUNITY.effectiveTier,
          legacyEpoch: 0,
        }],
      },
    });
    const ownership = readArc5OwnershipMigration(
      loaded.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(ownership.kind).toBe('loaded');
    if (ownership.kind === 'loaded') {
      expect(ownership.state.creatures[0]?.xp).toBe(plan.xp.status === 'award' ? plan.xp.amount : -1);
    }
  });

  it('settles the accepted starter conquest Charter and Chapter 2 in the same verified CAS', async () => {
    const fixture = await harness(3, 0, createMemoryBackend(), 0, false, [], (state) => {
      state.tutDone = true;
      state.chDone = ['st-land', 'st-mine', 'st-scan', 'st-scout'];
      state.chacc = [COMBAT_STARTER_CONQUEST_CHARTER_ID_V1];
      state.stats.charters = 4;
      state.ascCh = 1;
      state.ascProg = {
        'c2-land': 3,
        'c2-scan': 2,
        'c2-conq': 0,
        'c2-array': 1,
      };
      state.items = [
        ...state.items.filter(([id]) => id !== 'array'),
        ['array', 1],
      ];
    });
    const plan = planFor(fixture, 'combat-starter-conquest-charter');
    const priorEssence = fixture.writable.state.essence;
    const priorEarned = fixture.writable.state.stats.essenceEarned ?? 0;
    const outcome = await commit(fixture, plan);
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const verified = verifyCommittedCombatSettlementV1({
      committed: outcome,
      revision: outcome.revision,
      writable: {
        state: outcome.transaction.saved.canonicalState,
        extensions: outcome.transaction.saved.extensions,
      },
      receipt: outcome.transaction.receipt,
    });
    expect(verified).toMatchObject({
      kind: 'verified',
      starterConquestCharter: {
        id: COMBAT_STARTER_CONQUEST_CHARTER_ID_V1,
        stardustReward: COMBAT_STARTER_CONQUEST_CHARTER_STARDUST_V1,
        honoredChartersBefore: 4,
        honoredChartersAfter: 5,
      },
    });
    const loaded = await reload(fixture);
    expect(loaded.state.chDone).toEqual([
      'st-land', 'st-mine', 'st-scan', 'st-scout',
      COMBAT_STARTER_CONQUEST_CHARTER_ID_V1,
    ]);
    expect(loaded.state.chacc).toEqual([]);
    expect(loaded.state.stats.charters).toBe(5);
    expect(loaded.state.essence).toBe(
      priorEssence + plan.rewards.stardust.amount + COMBAT_STARTER_CONQUEST_CHARTER_STARDUST_V1,
    );
    expect(loaded.state.stats.essenceEarned).toBe(
      priorEarned + plan.rewards.stardust.amount + COMBAT_STARTER_CONQUEST_CHARTER_STARDUST_V1,
    );
    expect(loaded.state.ascProg['c2-conq']).toBe(1);
    expect(loaded.state.ascCh).toBe(2);
  });

  it('rejects starter Charter counter saturation without a partial conquest or reward', async () => {
    const fixture = await harness(3, 0, createMemoryBackend(), 0, false, [], (state) => {
      state.tutDone = true;
      state.chacc = [COMBAT_STARTER_CONQUEST_CHARTER_ID_V1];
      state.stats.charters = 1_000_000_000;
    });
    const outcome = await commit(fixture, planFor(fixture, 'combat-starter-charter-capacity'));
    expect(outcome).toMatchObject({
      kind: 'rejected', stage: 'derive',
      message: expect.stringContaining('charters'),
    });
    const loaded = await reload(fixture);
    expect(loaded.revision).toBe(1);
    expect(loaded.state.conquered).toEqual([]);
    expect(loaded.state.chacc).toEqual([COMBAT_STARTER_CONQUEST_CHARTER_ID_V1]);
    expect(loaded.state.chDone).not.toContain(COMBAT_STARTER_CONQUEST_CHARTER_ID_V1);
  });
});

describe('Arc 6 player-live app settlement seam', () => {
  it('drives the registered app action through the real combat writer and returns only the verified durable result', async () => {
    const fixture = await harness(3, 0);
    const writer = createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend),
      REGISTRY,
    );
    let commitCalls = 0;
    const runtime = Object.freeze({
      async commitCombatSettlement(input: Parameters<typeof writer.commit>[0] extends never
        ? never
        : Omit<Parameters<typeof writer.commit>[0], 'expectedRevision' | 'grant' | 'writable' | 'snapshot' | 'now'> & {
          readonly state: SaveStateV2;
          readonly codecNow: number;
        }) {
        commitCalls++;
        return writer.commit({
          expectedRevision: 1,
          grant: fixture.grant,
          writable: { state: input.state, extensions: fixture.writable.extensions },
          snapshot: { activePlayMs: 250 },
          now: input.codecNow,
          plan: input.plan,
          opportunity: input.opportunity,
          ownershipV2: input.ownershipV2,
          brinkAchievementJoin: input.brinkAchievementJoin,
        });
      },
    });
    const champion = projectArc6CombatChampionV1({
      state: fixture.writable.state,
      ownershipV2: fixture.ownership,
      championId: fixture.creatureId,
    });
    expect(champion).toMatchObject({
      kind: 'owned-fauna', creatureId: fixture.creatureId, legacyBredLineage: true,
    });
    const outcome = await commitArc6CombatActionV1({
      runtime,
      state: fixture.writable.state,
      extensions: fixture.writable.extensions,
      encounter: ENCOUNTER,
      opportunity: OPPORTUNITY,
      ownershipV2: fixture.ownership,
      championId: fixture.creatureId,
      championRosterAuthorityKey: combatRosterAuthorityKey(
        fixture.ownership, fixture.writable.extensions,
      ),
      observedActivePlayMs: 250,
      codecNow: NOW,
    });
    expect(commitCalls).toBe(1);
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.verification).toMatchObject({
      kind: 'verified', revision: 2,
      plan: { outcome: 'champion-win', conquest: { status: 'settle' } },
    });
    const loaded = await reload(fixture);
    expect(loaded.revision).toBe(2);
    expect(loaded.state.conquered).toHaveLength(1);
    expect(await createRevisionedRepository(fixture.backend).readReceipt(0)).toEqual(
      outcome.verification.plan.receipt,
    );
  });

  it('admits the exact starter conquest Charter through the verified app writer', async () => {
    const fixture = await harness(3, 0, createMemoryBackend(), 0, false, [], (state) => {
      state.tutDone = true;
      state.chacc = [COMBAT_STARTER_CONQUEST_CHARTER_ID_V1];
    });
    const writer = createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend),
      REGISTRY,
    );
    let commitCalls = 0;
    const outcome = await commitArc6CombatActionV1({
      runtime: Object.freeze({
        async commitCombatSettlement(input: Parameters<typeof writer.commit>[0] extends never
          ? never
          : Omit<Parameters<typeof writer.commit>[0], 'expectedRevision' | 'grant' | 'writable' | 'snapshot' | 'now'> & {
            readonly state: SaveStateV2;
            readonly codecNow: number;
          }) {
          commitCalls++;
          return writer.commit({
            expectedRevision: 1,
            grant: fixture.grant,
            writable: { state: input.state, extensions: fixture.writable.extensions },
            snapshot: { activePlayMs: 250 },
            now: input.codecNow,
            plan: input.plan,
            opportunity: input.opportunity,
            ownershipV2: input.ownershipV2,
            brinkAchievementJoin: input.brinkAchievementJoin,
          });
        },
      }),
      state: fixture.writable.state,
      extensions: fixture.writable.extensions,
      encounter: ENCOUNTER,
      opportunity: OPPORTUNITY,
      ownershipV2: fixture.ownership,
      championId: fixture.creatureId,
      championRosterAuthorityKey: combatRosterAuthorityKey(
        fixture.ownership, fixture.writable.extensions,
      ),
      observedActivePlayMs: 250,
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed',
      verification: {
        starterConquestCharter: { id: COMBAT_STARTER_CONQUEST_CHARTER_ID_V1 },
      },
    });
    expect(commitCalls).toBe(1);
    expect((await reload(fixture)).state.chDone).toContain(COMBAT_STARTER_CONQUEST_CHARTER_ID_V1);
  });

  it('keeps an accepted weekly conquest Charter fail-closed before the writer', async () => {
    const fixture = await harness(3, 0);
    const state = cloneState(fixture.writable.state);
    state.chacc = ['wk-conq'];
    let commitCalls = 0;
    const outcome = await commitArc6CombatActionV1({
      runtime: Object.freeze({
        async commitCombatSettlement() {
          commitCalls++;
          throw new Error('weekly writer must remain unreachable');
        },
      }),
      state,
      extensions: fixture.writable.extensions,
      encounter: ENCOUNTER,
      opportunity: OPPORTUNITY,
      ownershipV2: fixture.ownership,
      championId: fixture.creatureId,
      championRosterAuthorityKey: combatRosterAuthorityKey(
        fixture.ownership, fixture.writable.extensions,
      ),
      observedActivePlayMs: 250,
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({ kind: 'refused', durability: 'none', convergence: 'none' });
    expect(outcome.kind === 'refused' ? outcome.detail : '').toContain('weekly lifecycle');
    expect(commitCalls).toBe(0);
    expect((await reload(fixture)).revision).toBe(1);
  });
});

describe('Arc 6 combat persistence — exact On the Brink event owner', () => {
  it('uses the Arc 9 event-owner adapter and publishes brink only after verified durable 19 HP', async () => {
    const fixture = await harness(
      71, 0, createMemoryBackend(), 0, false, [], configurePlayerBrinkState(19),
    );
    const writer = createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend),
      REGISTRY,
    );
    let commitCalls = 0;
    const runtime = Object.freeze({
      async commitCombatSettlement(input: Parameters<typeof writer.commit>[0] extends never
        ? never
        : Omit<Parameters<typeof writer.commit>[0], 'expectedRevision' | 'grant' | 'writable' | 'snapshot' | 'now'> & {
          readonly state: SaveStateV2;
          readonly codecNow: number;
        }) {
        commitCalls++;
        return writer.commit({
          expectedRevision: 1,
          grant: fixture.grant,
          writable: { state: input.state, extensions: fixture.writable.extensions },
          snapshot: { activePlayMs: 250 },
          now: input.codecNow,
          plan: input.plan,
          opportunity: input.opportunity,
          ownershipV2: input.ownershipV2,
          brinkAchievementJoin: input.brinkAchievementJoin,
        });
      },
    });
    const outcome = await commitArc6CombatActionV1({
      runtime,
      state: fixture.writable.state,
      extensions: fixture.writable.extensions,
      encounter: ENCOUNTER,
      opportunity: OPPORTUNITY,
      ownershipV2: fixture.ownership,
      championId: ARC6_PLAYER_CHAMPION_ID,
      championRosterAuthorityKey: combatRosterAuthorityKey(
        fixture.ownership, fixture.writable.extensions,
      ),
      observedActivePlayMs: 250,
      codecNow: NOW,
    });
    expect(commitCalls).toBe(1);
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.verification).toMatchObject({
      kind: 'verified',
      plan: { injury: { status: 'damage-player', hpAfter: 19 } },
      brinkAchievement: {
        id: 'brink', owner: 'survival:below-twenty-hp', added: true,
        priorUnlockedCount: fixture.writable.state.unlocked.length,
      },
    });
    const loaded = await reload(fixture);
    expect(loaded.state.hp).toBe(19);
    expect(loaded.state.unlocked.filter((id) => id === 'brink')).toEqual(['brink']);
    expect(projectArc9ProgressionStateV1(loaded.state)).toMatchObject({
      kind: 'projected',
      projection: { achievements: { rows: expect.arrayContaining([
        expect.objectContaining({ id: 'brink', status: 'unlocked' }),
      ]) } },
    });
  });

  it('keeps 20 HP outside the event and includes the exact mercy-floor boundary at 1 HP', async () => {
    const safe = await harness(
      72, 0, createMemoryBackend(), 0, false, [], configurePlayerBrinkState(20),
    );
    const safePlan = playerPlanFor(safe, 'combat-brink-safe-boundary');
    expect(safePlan.injury).toMatchObject({ status: 'damage-player', hpAfter: 20 });
    const safeOutcome = await commitPlayer(safe, safePlan, null);
    expect(safeOutcome.kind).toBe('committed');
    if (safeOutcome.kind !== 'committed') return;
    const safeLoaded = await reload(safe);
    expect(safeLoaded.state.unlocked).not.toContain('brink');
    expect(verifyCommittedCombatSettlementV1({
      committed: safeOutcome,
      revision: safeLoaded.revision,
      writable: { state: safeLoaded.state, extensions: safeLoaded.extensions },
      receipt: await createRevisionedRepository(safe.backend).readReceipt(0),
    })).toMatchObject({ kind: 'verified', brinkAchievement: null });

    const floor = await harness(
      73, 0, createMemoryBackend(), 0, false, [], configurePlayerBrinkState(1),
    );
    const floorPlan = playerPlanFor(floor, 'combat-brink-mercy-floor');
    expect(floorPlan.injury).toMatchObject({ status: 'damage-player', hpAfter: 1 });
    const floorOutcome = await commitPlayer(
      floor,
      floorPlan,
      preparedBrinkJoin(floor.writable.state),
    );
    expect(floorOutcome.kind).toBe('committed');
    const floorLoaded = await reload(floor);
    expect(floorLoaded.state.hp).toBe(1);
    expect(floorLoaded.state.unlocked.filter((id) => id === 'brink')).toEqual(['brink']);
  });

  it('treats an already durable brink as a fixed point even at the exact 146-id bound', async () => {
    const full = Object.freeze([
      'brink',
      ...Array.from(
        { length: MAX_UNLOCKED_ACHIEVEMENT_IDS - 1 },
        (_, index) => `compat-brink-${index}`,
      ),
    ]);
    const fixture = await harness(
      74, 0, createMemoryBackend(), 0, false, [], configurePlayerBrinkState(19, full),
    );
    const join = preparedBrinkJoin(fixture.writable.state);
    expect(join).toMatchObject({ added: false, priorUnlockedCount: MAX_UNLOCKED_ACHIEVEMENT_IDS });
    const outcome = await commitPlayer(
      fixture,
      playerPlanFor(fixture, 'combat-brink-already-durable'),
      join,
    );
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const loaded = await reload(fixture);
    expect(loaded.state.unlocked).toHaveLength(MAX_UNLOCKED_ACHIEVEMENT_IDS);
    expect(loaded.state.unlocked.filter((id) => id === 'brink')).toEqual(['brink']);
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome,
      revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions },
      receipt: await createRevisionedRepository(fixture.backend).readReceipt(0),
    })).toMatchObject({
      kind: 'verified',
      brinkAchievement: { alreadyUnlocked: true, added: false },
    });
  });

  it('refuses capacity before the writer and rejects a missing eligible join without partial mutation', async () => {
    const full = Object.freeze(Array.from(
      { length: MAX_UNLOCKED_ACHIEVEMENT_IDS },
      (_, index) => `compat-full-${index}`,
    ));
    const capacity = await harness(
      75, 0, createMemoryBackend(), 0, false, [], configurePlayerBrinkState(19, full),
    );
    let commitCalls = 0;
    const capacityOutcome = await commitArc6CombatActionV1({
      runtime: Object.freeze({
        async commitCombatSettlement() {
          commitCalls++;
          throw new Error('capacity refusal must not reach the writer');
        },
      }),
      state: capacity.writable.state,
      extensions: capacity.writable.extensions,
      encounter: ENCOUNTER,
      opportunity: OPPORTUNITY,
      ownershipV2: capacity.ownership,
      championId: ARC6_PLAYER_CHAMPION_ID,
      championRosterAuthorityKey: combatRosterAuthorityKey(
        capacity.ownership, capacity.writable.extensions,
      ),
      observedActivePlayMs: 250,
      codecNow: NOW,
    });
    expect(capacityOutcome).toMatchObject({
      kind: 'refused', durability: 'none', detail: 'achievement:achievement-capacity',
    });
    expect(commitCalls).toBe(0);
    expect((await reload(capacity)).revision).toBe(1);

    const missing = await harness(
      76, 0, createMemoryBackend(), 0, false, [], configurePlayerBrinkState(19),
    );
    const missingOutcome = await commitPlayer(
      missing,
      playerPlanFor(missing, 'combat-brink-missing-join'),
      null,
    );
    expect(missingOutcome).toMatchObject({
      kind: 'rejected', stage: 'derive',
      message: 'combat brink achievement join is missing or invalid',
    });
    const missingLoaded = await reload(missing);
    expect(missingLoaded.revision).toBe(1);
    expect(missingLoaded.state.hp).toBe(missing.writable.state.hp);
    expect(missingLoaded.state.unlocked).not.toContain('brink');
    expect(await createRevisionedRepository(missing.backend).readReceipt(0)).toBeUndefined();
  });
});

describe('Arc 6 combat persistence — refusal, CAS, and convergence controls', () => {
  it('protects misplaced, future, and corrupt Guardian acquisition and companion carriers', () => {
    expect(readGuardianAcquisitionCarrierV1({
      player: { [GUARDIAN_ACQUISITION_NAMESPACE_V1]: { version: 1, json: '{}' } },
    })).toEqual({ kind: 'protected', reason: 'wrong-segment' });
    expect(readGuardianAcquisitionCarrierV1({
      creatures: { [GUARDIAN_ACQUISITION_NAMESPACE_V1]: { version: 2, json: '{}' } },
    })).toEqual({ kind: 'protected', reason: 'future-version', version: 2 });
    expect(readGuardianAcquisitionCarrierV1({
      creatures: { [GUARDIAN_ACQUISITION_NAMESPACE_V1]: { version: 1, json: '{}' } },
    })).toEqual({ kind: 'protected', reason: 'corrupt' });
    expect(readGuardianCompanionCarrierV1({
      player: { [GUARDIAN_COMPANION_NAMESPACE_V1]: { version: 1, json: '{}' } },
    })).toEqual({ kind: 'protected', reason: 'wrong-segment' });
    expect(readGuardianCompanionCarrierV1({
      creatures: { [GUARDIAN_COMPANION_NAMESPACE_V1]: { version: 2, json: '{}' } },
    })).toEqual({ kind: 'protected', reason: 'future-version', version: 2 });
    expect(readGuardianCompanionCarrierV1({
      creatures: { [GUARDIAN_COMPANION_NAMESPACE_V1]: { version: 1, json: '{}' } },
    })).toEqual({ kind: 'protected', reason: 'corrupt' });
  });

  it('atomically settles an Apex Guardian into conquest, Compendium, living ownership, and receipt-bound provenance', async () => {
    const fixture = await harness(
      42, 0, createMemoryBackend(), 0, true, PRIME_SIGNATURE_IDS_V1,
    );
    const guardianWorld = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 },
      planet: { seed: 2456455053 },
    });
    if (!guardianWorld.ok) throw new Error(guardianWorld.reason);
    const opportunity = projectWorldOpportunity(guardianWorld.address);
    const guardian = projectGuardianPrimeEncounterV1({
      world: guardianWorld.address,
      descriptor: { worldType: opportunity.source.planetType },
      regionIndex: 0,
      faunaRoster: [{ speciesId: 'guardian-native', genome: makeGenome(1, 'fauna', 0.5) }],
      claimedSignatureIds: PRIME_SIGNATURE_IDS_V1,
      conquered: false,
    });
    if (!guardian || guardian.defender.kind !== 'guardian') {
      throw new Error('Guardian refusal fixture did not select an Apex Guardian');
    }
    const planned = planForEncounter(
      fixture,
      'combat-guardian-capture',
      guardian,
      opportunity,
      PRIME_SIGNATURE_IDS_V1,
    );
    expect(planned.outcome).toBe('champion-win');
    expect(planned.guardianCapture.status).toBe('ownership-writer-required');
    const outcome = await createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend), REGISTRY,
    ).commit({
      expectedRevision: 1, grant: fixture.grant, writable: fixture.writable,
      snapshot: { activePlayMs: 250 }, now: NOW, plan: planned,
      opportunity, ownershipV2: fixture.ownership, brinkAchievementJoin: null,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const loaded = await reload(fixture);
    const receipt = await createRevisionedRepository(fixture.backend).readReceipt(0);
    const verified = verifyCommittedCombatSettlementV1({
      committed: outcome,
      revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions },
      receipt,
    });
    expect(verified).toMatchObject({
      kind: 'verified', revision: 2,
      guardianAcquisitions: { revision: 1 },
    });
    expect(receipt).toEqual(planned.receipt);
    expect(loaded.state.stats).toMatchObject({ duels: 1, duelwins: 1, guardians: 1 });
    expect(loaded.state.unlocked).toEqual(expect.arrayContaining(['settle1', 'guard1']));
    expect(loaded.state.conquered).toEqual([[
      guardianWorld.address.planet.seed,
      { t: NOW - 3_600_000, tier: opportunity.effectiveTier },
    ]]);
    const codex = loaded.state.codex.find(([id]) => (
      id === `s${guardian.defender.capturableGenome?.seed}`
    ))?.[1];
    expect(codex).toMatchObject({
      kind: 'Fauna', from: 'Apex Guardian of a world',
      where: { pseed: guardianWorld.address.planet.seed, type: 'planet' },
    });
    expect(codex?.g).not.toHaveProperty('_mult');
    expect(codex?.g).not.toHaveProperty('_wf');
    const carrier = readGuardianAcquisitionCarrierV1(
      loaded.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(carrier).toMatchObject({
      kind: 'loaded',
      state: {
        revision: 1,
        entries: [{
          acquisition: {
            provenance: {
              defenderKind: 'guardian',
              sourceId: guardian.defender.sourceId,
              worldKey: guardianWorld.address.key,
              receipt: { ordinal: 0, actionKind: 'combat-settlement' },
            },
          },
          creature: { origin: 'guardian', xp: null, hurt: null },
        }],
      },
    });
  });

  it('reuses a captured Guardian as a live champion and reloads exact XP, injury, Compendium, and receipt evidence', async () => {
    const fixture = await harness(
      142, 0, createMemoryBackend(), 0, true, PRIME_SIGNATURE_IDS_V1,
    );
    const guardianWorld = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 },
      planet: { seed: 2456455053 },
    });
    if (!guardianWorld.ok) throw new Error(guardianWorld.reason);
    const guardianOpportunity = projectWorldOpportunity(guardianWorld.address);
    const guardian = projectGuardianPrimeEncounterV1({
      world: guardianWorld.address,
      descriptor: { worldType: guardianOpportunity.source.planetType },
      regionIndex: 0,
      faunaRoster: [{ speciesId: 'guardian-champion-native', genome: makeGenome(1, 'fauna', 0.5) }],
      claimedSignatureIds: PRIME_SIGNATURE_IDS_V1,
      conquered: false,
    });
    if (!guardian || guardian.defender.kind !== 'guardian') {
      throw new Error('Guardian champion capture fixture drifted');
    }
    const capturePlan = planForEncounter(
      fixture,
      'combat-guardian-champion-capture',
      guardian,
      guardianOpportunity,
      PRIME_SIGNATURE_IDS_V1,
    );
    const captured = await createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend), REGISTRY,
    ).commit({
      expectedRevision: 1,
      grant: fixture.grant,
      writable: fixture.writable,
      snapshot: { activePlayMs: 250 },
      now: NOW,
      plan: capturePlan,
      opportunity: guardianOpportunity,
      ownershipV2: fixture.ownership,
      brinkAchievementJoin: null,
    });
    expect(captured.kind).toBe('committed');
    const afterCapture = await reload(fixture);
    const ordinary = projectGuardianPrimeEncounterV1({
      world: WORLD,
      descriptor: { worldType: OPPORTUNITY.source.planetType },
      regionIndex: 0,
      faunaRoster: [{ speciesId: 'captured-guardian-opponent', genome: DEFENDER }],
      claimedSignatureIds: PRIME_SIGNATURE_IDS_V1,
      conquered: false,
    });
    if (!ordinary || ordinary.defender.kind !== 'fauna') {
      throw new Error('Captured Guardian ordinary opponent fixture drifted');
    }
    const champion = guardianChampionPlanFor({
      writable: { state: afterCapture.state, extensions: afterCapture.extensions },
      battleId: 'combat-captured-guardian-champion-win',
      encounter: ordinary,
      opportunity: OPPORTUNITY,
      claimedPrimeSignatureIds: PRIME_SIGNATURE_IDS_V1,
      receiptOrdinal: 1,
    });
    expect(champion.plan).toMatchObject({
      outcome: 'champion-win',
      champion: {
        kind: 'owned-fauna',
        creatureId: champion.creatureId,
        legacyBredLineage: false,
      },
      xp: { status: 'award', creatureId: champion.creatureId },
    });
    const outcome = await commitGuardianChampion(
      fixture,
      { state: afterCapture.state, extensions: afterCapture.extensions },
      champion.plan,
      OPPORTUNITY,
      2,
    );
    if (outcome.kind !== 'committed') {
      throw new Error(`Guardian champion commit failed: ${JSON.stringify(outcome)}`);
    }
    const loaded = await reload(fixture);
    const receipt = await createRevisionedRepository(fixture.backend).readReceipt(1);
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome,
      revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions },
      receipt,
    })).toMatchObject({
      kind: 'verified',
      revision: 3,
      guardianAcquisitions: { revision: 1 },
      guardianCompanions: { revision: 1 },
    });
    expect(receipt).toEqual(champion.plan.receipt);

    const source = readGuardianAcquisitionCarrierV1(
      loaded.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    const overlay = readGuardianCompanionCarrierV1(loaded.extensions);
    expect(source.kind).toBe('loaded');
    expect(overlay.kind).toBe('loaded');
    if (source.kind !== 'loaded' || overlay.kind !== 'loaded') return;
    expect(source.state.entries[0]?.creature).toMatchObject({ xp: null, hurt: null });
    const roster = projectGuardianCompanionsV1({
      source: source.state,
      overlay: overlay.state,
    });
    expect(roster.kind).toBe('projected');
    if (roster.kind !== 'projected') return;
    const live = roster.creatures.find((row) => row.creatureId === champion.creatureId);
    expect(live).toBeDefined();
    const xpAward = champion.plan.xp.status === 'award' ? champion.plan.xp.amount : 0;
    const hurtAfter = champion.plan.injury.status === 'set-hurt'
      ? champion.plan.injury.hurtAfter : champion.hurtBefore;
    expect(live).toMatchObject({
      xp: champion.xpBefore + xpAward,
      hurt: hurtAfter,
    });
    expect(roster.tombstones).toEqual([]);
    const codex = loaded.state.codex.find(([id]) => (
      id === `s${live!.genome.seed}`
    ))?.[1];
    expect(Number(codex?.g.xp ?? 0)).toBe(live!.xp);
    expect(Number(codex?.g.hurt ?? 0)).toBe(live!.hurt ?? 0);
  });

  it('claims a Titan into the Prime Codex and rejects a missing ownership authority before CAS', async () => {
    const fixture = await harness(42, 0, createMemoryBackend(), 0, true);
    const titanWorld = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 1870336732, x: -835.7104268185794, y: -279.0773200504482 },
      planet: { seed: 3933259603 },
    });
    if (!titanWorld.ok) throw new Error(titanWorld.reason);
    const opportunity = projectWorldOpportunity(titanWorld.address);
    const titan = projectGuardianPrimeEncounterV1({
      world: titanWorld.address,
      descriptor: { worldType: opportunity.source.planetType },
      regionIndex: 2,
      faunaRoster: [],
      claimedSignatureIds: [],
      conquered: false,
    });
    if (!titan || titan.defender.kind !== 'titan' || titan.defender.signatureId !== 'void') {
      throw new Error('Titan persistence fixture did not select Nullreth');
    }
    const planned = planForEncounter(
      fixture, 'combat-titan-capture', titan, opportunity, [],
    );
    expect(planned).toMatchObject({
      outcome: 'champion-win',
      primeClaim: { status: 'claim', signatureId: 'void', sub: 'titan felled' },
    });
    const missing = await createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend), REGISTRY,
    ).commit({
      expectedRevision: 1, grant: fixture.grant, writable: fixture.writable,
      snapshot: { activePlayMs: 250 }, now: NOW, plan: planned,
      opportunity, ownershipV2: null, brinkAchievementJoin: null,
    });
    expect(missing).toEqual({ kind: 'refused', reason: 'ownership-unregistered' });
    expect(await createRevisionedRepository(fixture.backend).revision()).toBe(1);

    const outcome = await createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend), REGISTRY,
    ).commit({
      expectedRevision: 1, grant: fixture.grant, writable: fixture.writable,
      snapshot: { activePlayMs: 250 }, now: NOW, plan: planned,
      opportunity, ownershipV2: fixture.ownership, brinkAchievementJoin: null,
    });
    expect(outcome.kind).toBe('committed');
    const loaded = await reload(fixture);
    expect(loaded.state.primeFill.void).toMatchObject({
      title: `Void — ${titan.defender.name}`,
      sub: 'titan felled', tier: 14, hex: '#ffd96a',
      where: { pseed: titanWorld.address.planet.seed, type: 'planet' },
    });
    expect(loaded.state.frontierUnlocked).toBe(false);
    expect(loaded.state.stats.guardians).toBe(1);
    const carrier = readGuardianAcquisitionCarrierV1(
      loaded.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(carrier).toMatchObject({
      kind: 'loaded',
      state: { entries: [{ acquisition: { provenance: {
        defenderKind: 'titan', signatureId: 'void',
      } } }] },
    });
    if (carrier.kind === 'loaded') {
      expect(carrier.state.entries[0]?.catalogSpecies.genome._titan).toBe('void');
      expect(carrier.state.entries[0]?.catalogSpecies.genome).not.toHaveProperty('_mult');
      expect(carrier.state.entries[0]?.catalogSpecies.genome).not.toHaveProperty('_wf');
    }
  });

  it('permanently tombstones a defeated captured Guardian without erasing its immutable capture or Prime Codex', async () => {
    const fixture = await harness(
      242, 0, createMemoryBackend(), 0, true, PRIME_SIGNATURE_IDS_V1,
    );
    const captureWorld = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 },
      planet: { seed: 2456455053 },
    });
    if (!captureWorld.ok) throw new Error(captureWorld.reason);
    const captureOpportunity = projectWorldOpportunity(captureWorld.address);
    const capturedGuardian = projectGuardianPrimeEncounterV1({
      world: captureWorld.address,
      descriptor: { worldType: captureOpportunity.source.planetType },
      regionIndex: 0,
      faunaRoster: [{ speciesId: 'guardian-loss-native', genome: makeGenome(1, 'fauna', 0.5) }],
      claimedSignatureIds: PRIME_SIGNATURE_IDS_V1,
      conquered: false,
    });
    if (!capturedGuardian || capturedGuardian.defender.kind !== 'guardian') {
      throw new Error('Captured Guardian loss setup drifted');
    }
    const capturePlan = planForEncounter(
      fixture,
      'combat-guardian-permanent-loss-capture',
      capturedGuardian,
      captureOpportunity,
      PRIME_SIGNATURE_IDS_V1,
    );
    expect(capturePlan).toMatchObject({ outcome: 'champion-win' });
    const captured = await createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend), REGISTRY,
    ).commit({
      expectedRevision: 1,
      grant: fixture.grant,
      writable: fixture.writable,
      snapshot: { activePlayMs: 250 },
      now: NOW,
      plan: capturePlan,
      opportunity: captureOpportunity,
      ownershipV2: fixture.ownership,
      brinkAchievementJoin: null,
    });
    if (captured.kind !== 'committed') {
      throw new Error(`Captured Guardian setup failed: ${JSON.stringify(captured)}`);
    }
    const afterCapture = await reload(fixture);

    const challengerWorld = resolveCF1WorldAddress({
      galaxy: { seed: 121725964, x: -2839.856471773237, y: 3305.7031123898923 },
      star: { seed: 4090947280, x: -94.33730058884248, y: -12.052213123999536 },
      planet: { seed: 3386214749 },
    });
    if (!challengerWorld.ok) throw new Error(challengerWorld.reason);
    const challengerOpportunity = projectWorldOpportunity(challengerWorld.address);
    const challenger = projectGuardianPrimeEncounterV1({
      world: challengerWorld.address,
      descriptor: { worldType: challengerOpportunity.source.planetType },
      regionIndex: 0,
      faunaRoster: [{ speciesId: 'guardian-loss-challenger-native', genome: makeGenome(991, 'fauna', 0.5) }],
      claimedSignatureIds: PRIME_SIGNATURE_IDS_V1,
      conquered: false,
    });
    if (!challenger || challenger.defender.kind !== 'guardian'
      || challenger.defender.tier !== 14) {
      throw new Error(`Captured Guardian challenger drifted: ${JSON.stringify(challenger?.defender)}`);
    }
    const champion = guardianChampionPlanFor({
      writable: { state: afterCapture.state, extensions: afterCapture.extensions },
      battleId: 'combat-captured-guardian-permanent-loss',
      encounter: challenger,
      opportunity: challengerOpportunity,
      claimedPrimeSignatureIds: PRIME_SIGNATURE_IDS_V1,
      receiptOrdinal: 1,
    });
    expect(champion.plan).toMatchObject({
      outcome: 'defender-win',
      champion: { creatureId: champion.creatureId, legacyBredLineage: false },
      injury: {
        status: 'remove-creature',
        reason: 'wild-or-unbred-defeat',
        creatureId: champion.creatureId,
      },
      guardianCapture: { status: 'none' },
      primeClaim: { status: 'none' },
    });
    const outcome = await commitGuardianChampion(
      fixture,
      { state: afterCapture.state, extensions: afterCapture.extensions },
      champion.plan,
      challengerOpportunity,
      2,
    );
    if (outcome.kind !== 'committed') {
      throw new Error(`Captured Guardian loss failed: ${JSON.stringify(outcome)}`);
    }
    const loaded = await reload(fixture);
    const receipt = await createRevisionedRepository(fixture.backend).readReceipt(1);
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome,
      revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions },
      receipt,
    })).toMatchObject({
      kind: 'verified',
      revision: 3,
      guardianAcquisitions: { revision: 1 },
      guardianCompanions: { revision: 1 },
    });
    const source = readGuardianAcquisitionCarrierV1(
      loaded.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    const overlay = readGuardianCompanionCarrierV1(loaded.extensions);
    expect(source).toMatchObject({ kind: 'loaded', state: { revision: 1, entries: [{}] } });
    expect(overlay).toMatchObject({
      kind: 'loaded',
      state: {
        revision: 1,
        rows: [{
          kind: 'tombstone',
          tombstone: {
            creatureId: champion.creatureId,
            disposition: { ordinal: 1, actionKind: 'combat-settlement' },
          },
        }],
      },
    });
    if (source.kind !== 'loaded' || overlay.kind !== 'loaded') return;
    const roster = projectGuardianCompanionsV1({
      source: source.state,
      overlay: overlay.state,
    });
    expect(roster).toMatchObject({
      kind: 'projected',
      creatures: [],
      tombstones: [{ creatureId: champion.creatureId }],
    });
    const capturedSeed = source.state.entries[0]!.creature.genome.seed;
    expect(loaded.state.codex.some(([id]) => id === `s${capturedSeed}`)).toBe(false);
    expect(Object.keys(loaded.state.primeFill).sort())
      .toEqual([...PRIME_SIGNATURE_IDS_V1].sort());
    expect(loaded.state.frontierUnlocked).toBe(true);
  });

  it('opens the Frontier only when the Titan receipt completes the ninth Prime Signature', async () => {
    const prior = PRIME_SIGNATURE_IDS_V1.filter((id) => id !== 'void');
    const fixture = await harness(42, 0, createMemoryBackend(), 0, true, prior);
    const resolvedWorld = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 1870336732, x: -835.7104268185794, y: -279.0773200504482 },
      planet: { seed: 3933259603 },
    });
    if (!resolvedWorld.ok) throw new Error(resolvedWorld.reason);
    const opportunity = projectWorldOpportunity(resolvedWorld.address);
    const titan = projectGuardianPrimeEncounterV1({
      world: resolvedWorld.address,
      descriptor: { worldType: opportunity.source.planetType },
      regionIndex: 2,
      faunaRoster: [],
      claimedSignatureIds: prior,
      conquered: false,
    });
    if (!titan || titan.defender.signatureId !== 'void') throw new Error('ninth Prime fixture drifted');
    const planned = planForEncounter(
      fixture, 'combat-ninth-Prime-claim', titan, opportunity, prior,
    );
    const outcome = await createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend), REGISTRY,
    ).commit({
      expectedRevision: 1, grant: fixture.grant, writable: fixture.writable,
      snapshot: { activePlayMs: 250 }, now: NOW, plan: planned,
      opportunity, ownershipV2: fixture.ownership, brinkAchievementJoin: null,
    });
    expect(outcome.kind).toBe('committed');
    const loaded = await reload(fixture);
    expect(Object.keys(loaded.state.primeFill).sort())
      .toEqual([...PRIME_SIGNATURE_IDS_V1].sort());
    expect(loaded.state.frontierUnlocked).toBe(true);
  });

  it('rejects a forged structural plan before reaching storage', async () => {
    const fixture = await harness(2, 0);
    const plan = planFor(fixture, 'combat-forged-plan');
    expect(isCombatSettlementPlanV1({ ...plan })).toBe(false);
    const revision = await createRevisionedRepository(fixture.backend).revision();
    const outcome = await createCombatSettlementPersistenceOwnerV1(
      createRevisionedRepository(fixture.backend), REGISTRY,
    ).commit({
      expectedRevision: 1,
      grant: fixture.grant,
      writable: fixture.writable,
      snapshot: { activePlayMs: 250 },
      now: NOW,
      plan: { ...plan } as CombatSettlementPlanV1,
      opportunity: OPPORTUNITY,
      ownershipV2: fixture.ownership,
      brinkAchievementJoin: null,
    });
    expect(outcome).toEqual({ kind: 'refused', reason: 'plan-unregistered' });
    expect(await createRevisionedRepository(fixture.backend).revision()).toBe(revision);
    expect(await createRevisionedRepository(fixture.backend).readReceipt(0)).toBeUndefined();
  });

  it('reports stale and immutable duplicate receipts without retry or mutation', async () => {
    const fixture = await harness(2, 0);
    const plan = planFor(fixture, 'combat-stale-duplicate');
    expect((await commit(fixture, plan, 0)).kind).toBe('stale');
    expect(await createRevisionedRepository(fixture.backend).revision()).toBe(1);
    expect((await commit(fixture, plan)).kind).toBe('committed');
    const committedRevision = await createRevisionedRepository(fixture.backend).revision();
    expect(committedRevision).toBe(2);
    const duplicate = await commit(fixture, plan, 2);
    expect(duplicate.kind).toBe('duplicate-receipt');
    expect(await createRevisionedRepository(fixture.backend).revision()).toBe(2);
    expect(await createRevisionedRepository(fixture.backend).readReceipt(0)).toEqual(plan.receipt);
  });

  it('rejects the same semantic battle under the next fresh receipt ordinal', async () => {
    const fixture = await harness(2, 0);
    const first = planFor(fixture, 'combat-semantic-single-use');
    expect((await commit(fixture, first)).kind).toBe('committed');
    const loaded = await reload(fixture);
    const ownership = readArc5OwnershipMigration(
      loaded.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (ownership.kind !== 'loaded') throw new Error(`ownership reload received ${ownership.kind}`);
    const current: Harness = {
      ...fixture,
      writable: { state: loaded.state, extensions: loaded.extensions },
      ownership: ownership.state,
      target: 3,
    };
    const repeated = planFor(current, 'combat-semantic-single-use', 1);
    const outcome = await commit(current, repeated, 2);
    expect(outcome).toMatchObject({
      kind: 'rejected', stage: 'derive', message: 'combat battle identity is already settled',
    });
    expect(await createRevisionedRepository(fixture.backend).revision()).toBe(2);
    expect(await createRevisionedRepository(fixture.backend).readReceipt(1)).toBeUndefined();
  });

  it('returns storage failure with the old save, F4 ordinal, and receipt still intact', async () => {
    const base = createMemoryBackend();
    let armed = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (armed && operations.some((operation) => operation.store === 'receipts')) {
          throw new Error('injected combat storage failure');
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const fixture = await harness(2, 0, backend);
    const plan = planFor(fixture, 'combat-storage-failure');
    armed = true;
    const outcome = await commit(fixture, plan);
    expect(outcome).toMatchObject({ kind: 'storage-error', message: 'injected combat storage failure' });
    expect(await createRevisionedRepository(backend).revision()).toBe(1);
    expect(await createRevisionedRepository(backend).readReceipt(0)).toBeUndefined();
    const loaded = await reload(fixture);
    expect(loaded.state.stats.duels).toBe(0);
    expect(readCombatSettlementAuthorityV1(loaded.extensions)).toEqual({
      kind: 'loaded',
      authority: {
        schema: COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1,
        version: 1,
        battles: [], conquests: [], lossXp: [],
      },
    });
  });

  it('rejects current ownership XP capacity before F3 can mutate any row', async () => {
    const fixture = await harness(2, 0, createMemoryBackend(), 486);
    const plan = planFor(fixture, 'combat-xp-capacity');
    expect(plan.xp).toMatchObject({ status: 'loss-target', totalDelta: 3 });
    const outcome = await commit(fixture, plan);
    expect(outcome).toMatchObject({
      kind: 'rejected', stage: 'derive',
      message: 'combat ownership refused champion-xp-unrepresentable',
    });
    expect(await createRevisionedRepository(fixture.backend).revision()).toBe(1);
    expect(await createRevisionedRepository(fixture.backend).readReceipt(0)).toBeUndefined();
    const loaded = await reload(fixture);
    expect(loaded.state.codex[0]?.[1].g).toMatchObject({ xp: 486, hurt: 0 });
  });

  it('requires exact reload revision/receipt/save evidence before publication', async () => {
    const fixture = await harness(2, 0);
    const plan = planFor(fixture, 'combat-verification-controls');
    const outcome = await commit(fixture, plan);
    if (outcome.kind !== 'committed') throw new Error(`expected commit, received ${outcome.kind}`);
    const loaded = await reload(fixture);
    const receipt = await createRevisionedRepository(fixture.backend).readReceipt(0);
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome, revision: 1,
      writable: { state: loaded.state, extensions: loaded.extensions }, receipt,
    })).toEqual({
      kind: 'mismatch', convergence: 'read-only-reload', reason: 'revision-mismatch',
    });
    expect(verifyCommittedCombatSettlementV1({
      committed: { ...outcome }, revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions }, receipt,
    })).toEqual({
      kind: 'mismatch', convergence: 'read-only-reload', reason: 'commit-unregistered',
    });
    expect(verifyCommittedCombatSettlementV1({
      committed: outcome, revision: loaded.revision,
      writable: { state: loaded.state, extensions: loaded.extensions },
      receipt: receipt && { ...receipt, witness: `${receipt.witness}!` },
    })).toEqual({
      kind: 'mismatch', convergence: 'read-only-reload', reason: 'receipt-mismatch',
    });
  });
});
