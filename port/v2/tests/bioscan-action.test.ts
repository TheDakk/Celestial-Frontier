import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  ownershipSourceStateV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  preflightArc5BioscanV1,
  settleArc5BioscanParagonV1,
  settleArc5BioscanV1,
} from '@cf/domain-acquisition/bioscan-internal';
import { makeGenome } from '@cf/domain-genome';
import {
  MAX_PENDING_GEAR_REWARDS,
  createGearInstance,
  getFixedCraftGenerationPlan,
  makeGearSourceActionId,
} from '@cf/domain-loot';
import { MAX_UNLOCKED_ACHIEVEMENT_IDS } from '@cf/domain-progression';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  migrateLegacyEngineeringState,
  projectWorldOpportunity,
} from '@cf/domain-opportunity';
import { createSessionRNG, DOMAINS } from '@cf/domain-sessionrng';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import {
  ARC3_ENGINEERING_NAMESPACE,
  ARC3_ENGINEERING_SEGMENT,
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc3EngineeringCarrier,
  encodeArc4Ownership,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc2LootLegacyMigration,
  prepareArc2LootInventoryWrite,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  projectLegacyOwnershipMirror,
  readArc4Ownership,
  readArc2EngineeringLoadout,
  readArc2Loot,
  projectArc2LootLegacyMirror,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  BIOSCAN_ACTION_DOMAIN_V1,
  commitBioscanActionV1,
  projectBioscanActionV1,
  publishBioscanActionV1,
} from '../apps/game/src/bioscan-action.js';
import { prepareArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-projection.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  findArc9ParagonAtCurrentWorldV1,
  projectArc9ParagonFinderV1,
  projectArc9ParagonLegacyCodexEntryV1,
} from '../apps/game/src/paragon-finder.js';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_060_000;
const HOME = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL = Object.freeze({ seed: 424242, x: 560, y: 170 });

beforeAll(() => installCaptureHooks());

function earth() {
  const result = resolveCF1WorldAddress({ galaxy: HOME, star: SOL, planet: { seed: 133 } });
  if (!result.ok) throw new Error(result.reason);
  return result.address;
}

function emptyOwnership() {
  return createInitialOwnershipStateV1({
    catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  });
}

function scoutOwnership(hurt = 0.8) {
  const identity = canonicalGenomeIdentityV1(makeGenome(71, 'fauna', 0.4));
  const recordId = ownershipContentId('discovery', 'bioscan-scout') as DiscoveryRecordId;
  const creatureId = ownershipContentId('creature', 'bioscan-scout') as CreatureInstanceId;
  const discovery = createLegacyDiscoveryRecordV1({
    recordId, speciesId: identity.speciesId, legacyCodexId: 'bioscan-scout',
    legacySourceIndex: 0, from: 'Legacy', legacyLocation: null, firstForSpecies: true,
  });
  const creature = createCreatureInstanceV1({
    creatureId, speciesId: identity.speciesId, genomeIdentity: identity.genomeIdentity,
    genome: identity.genome, nickname: 'Aegis', origin: 'legacy', acquisitionRecordId: recordId,
    lineage: { kind: 'none', generation: identity.genome.gen as number },
    xp: 9, hurt, fed: 7, brood: 3, assignment: null, bond: null,
  });
  return migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({ identity, alias: null, firstObservationId: recordId })],
    discoveries: [discovery], creatures: [creature], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: creatureId,
  }));
}

async function fixture(
  sessionSeed = 0xB105CA7,
  compatibilityAchievementIds: readonly string[] = Object.freeze([]),
  options: Readonly<{
    configureState?: (state: SaveStateV2) => void;
    inventoryCapacity?: number;
    pendingRewardCapacityExhausted?: boolean;
    inventoryRevisionExhausted?: boolean;
    ownershipV2?: OwnershipStateV2;
    address?: CanonicalCF1WorldAddress;
  }> = {},
) {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const state: SaveStateV2 = {
    ...imported.state, hp: 7, HP_MAX: 100,
    pstats: { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 }, techOwned: [],
    stats: { ...imported.state.stats, bestRank: 0 },
    unlocked: [...compatibilityAchievementIds],
  };
  options.configureState?.(state);
  const engineering = migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA, revision: 0,
    worlds: [], stars: [], research: [],
  }, { resolveWorldSeed: () => [], resolveStarSeed: () => [] });
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: state.items, equip: state.equip, equipAff: state.equipAff },
    capacity: options.inventoryCapacity ?? 8,
  });
  if (loot.kind !== 'prepared') throw new Error(loot.kind);
  let lootExtensions = loot.extensions;
  if (options.pendingRewardCapacityExhausted === true) {
    if (loot.state.kind !== 'inventory') throw new Error('pending fixture requires exact inventory');
    if (loot.state.inventory.entries.length !== loot.state.inventory.capacity) {
      throw new Error('pending fixture requires a full inventory');
    }
    const pendingRewards = Array.from({ length: MAX_PENDING_GEAR_REWARDS }, (_, index) => ({
      instance: createGearInstance(makeGearSourceActionId({
        kind: 'expedition', ownerId: 'p', actionKey: String(index),
      }), 0, getFixedCraftGenerationPlan('earpiece', index)),
      reason: 'capacity' as const,
    }));
    const baseInventory = loot.state.inventory;
    const baseStackableCounts = loot.state.stackableCounts;
    const prepareCount = (count: number) => {
      const inventory = Object.freeze({
        ...baseInventory,
        revision: baseInventory.revision + count,
        pendingRewards: pendingRewards.slice(0, count),
      });
      return prepareArc2LootInventoryWrite({
        extensions: loot.extensions,
        inventory,
        stackableCounts: baseStackableCounts,
      });
    };
    let low = 0;
    let high = MAX_PENDING_GEAR_REWARDS + 1;
    let boundary = prepareCount(0);
    if (boundary.kind !== 'prepared') throw new Error('pending fixture baseline was protected');
    while (low + 1 < high) {
      const count = Math.floor((low + high) / 2);
      if (count > MAX_PENDING_GEAR_REWARDS) {
        high = count;
        continue;
      }
      const prepared = prepareCount(count);
      if (prepared.kind === 'prepared') {
        low = count;
        boundary = prepared;
      } else {
        if (prepared.reason !== 'extension-bounds') {
          throw new Error(`pending fixture was protected:${prepared.reason}`);
        }
        high = count;
      }
    }
    if (high > MAX_PENDING_GEAR_REWARDS || boundary.kind !== 'prepared') {
      throw new Error('pending fixture did not reach the carrier boundary');
    }
    lootExtensions = boundary.extensions;
    const mirror = projectArc2LootLegacyMirror(boundary.state);
    state.items = mirror.items.map(([id, count]) => [id, count]);
    state.equip = { ...mirror.equip };
    state.equipAff = { ...mirror.equipAff };
  }
  if (options.inventoryRevisionExhausted === true) {
    if (loot.state.kind !== 'inventory') throw new Error('revision fixture requires exact inventory');
    const inventory = Object.freeze({ ...loot.state.inventory, revision: 0xFFFF_FFFF });
    const prepared = prepareArc2LootInventoryWrite({
      extensions: lootExtensions,
      inventory,
      stackableCounts: loot.state.stackableCounts,
    });
    if (prepared.kind !== 'prepared') throw new Error(`revision fixture was ${prepared.kind}`);
    lootExtensions = prepared.extensions;
    const mirror = projectArc2LootLegacyMirror(prepared.state);
    state.items = mirror.items.map(([id, count]) => [id, count]);
    state.equip = { ...mirror.equip };
    state.equipAff = { ...mirror.equipAff };
  }
  const engineered = applyV5ExtensionWrites(lootExtensions, [{
    segment: ARC3_ENGINEERING_SEGMENT, namespace: ARC3_ENGINEERING_NAMESPACE,
    carrier: encodeArc3EngineeringCarrier(engineering),
  }]).extensions;
  const f4 = prepareF4AuthorityUpdate(
    engineered, { activePlayMs: 0 }, createSessionRNG(sessionSeed).state(),
  );
  const sourceOwnership = options.ownershipV2 === undefined
    ? emptyOwnership()
    : ownershipSourceStateV1(options.ownershipV2);
  const arc4 = applyV5ExtensionWrites(
    f4.extensions,
    encodeArc4Ownership(sourceOwnership).writes,
  ).extensions;
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(arc5.kind);
  const loadout = readArc2EngineeringLoadout(arc5.extensions);
  if (loadout.kind !== 'loaded') throw new Error(loadout.kind);
  const baseBackend = createMemoryBackend();
  let failReceiptCommit = false;
  const backend: StorageBackend = {
    ...baseBackend,
    async compareAndApply(checks, operations, clearStores) {
      if (failReceiptCommit && operations.some(({ store }) => store === 'receipts')) {
        throw new Error('forced Paragon Bioscan storage failure');
      }
      return baseBackend.compareAndApply(checks, operations, clearStores);
    },
  };
  const initial = prepareV5SaveWrite({ state, extensions: arc5.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(migrated.kind);
  await backend.apply(initial.operations);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: 0,
    initialExtensions: arc5.extensions, restoredAuthority: f4.authority, freshSessionSeed: 0,
    ownerId: 'bioscan-tab', token: 'bioscan-document', leaseTtlMs: 1_000,
    now: () => 0, visible: true, answerable: true,
  });
  if ((await runtime.heartbeat()).kind !== 'owned') throw new Error('bioscan lease unavailable');
  const address = options.address ?? earth();
  const roster = canonicalWorldRoster(address, 0);
  if (!roster.ok) throw new Error(roster.reason);
  return {
    state, engineering, capabilities: loadout.capabilities, ownershipV2: arc5.state,
    backend, repository, runtime, address, roster: roster.roster,
    opportunity: projectWorldOpportunity(address),
    armReceiptStorageFailure() { failReceiptCommit = true; },
  };
}

function priorParagonOwnership(
  index: number,
  address: CanonicalCF1WorldAddress,
): OwnershipStateV2 {
  const parent = migrateOwnershipStateV1ToV2(emptyOwnership());
  const preflight = preflightArc5BioscanV1(parent);
  if (preflight.kind !== 'ready') throw new Error(preflight.reason);
  const bioscan = settleArc5BioscanV1(preflight.preflight, false, 0, 0, address.key);
  const joined = settleArc5BioscanParagonV1(bioscan, index, address);
  if (joined.kind !== 'added') throw new Error('Paragon ownership fixture was not added');
  return joined.successor;
}

function paragonLocation(index = 0) {
  const location = projectArc9ParagonFinderV1(index);
  if (location.kind !== 'located') throw new Error(`Paragon ${index} was ${location.kind}`);
  return location;
}

describe('hostile bioscan action', () => {
  it('caps an active Scout at Critical without deletion or unrelated ownership change', () => {
    const parent = scoutOwnership();
    const preflight = preflightArc5BioscanV1(parent);
    if (preflight.kind !== 'ready') throw new Error(preflight.reason);
    const result = settleArc5BioscanV1(preflight.preflight, true, 40, 7, earth().key);
    expect(result).toMatchObject({
      hostile: true, damage: 40, target: 'scout',
      scoutAfter: { creatureId: parent.scoutCreatureId, hurt: 0.85 },
      successor: { scoutCreatureId: parent.scoutCreatureId },
    });
    expect(result.successor?.creatures).toHaveLength(1);
    expect(result.successor?.creatureTombstones).toEqual([]);
    expect(result.successor?.creatures[0]?.genomeIdentity)
      .toBe(parent.creatures[0]?.genomeIdentity);
    expect(result.successor?.creatures[0]?.genome).toEqual(parent.creatures[0]?.genome);
    const low = settleArc5BioscanV1(preflight.preflight, true, 1, 8, earth().key);
    expect(low.scoutAfter?.hurt).toBe(0.85);
    const fresh = preflightArc5BioscanV1(scoutOwnership(0));
    if (fresh.kind !== 'ready') throw new Error(fresh.reason);
    expect(settleArc5BioscanV1(fresh.preflight, true, 1, 9, earth().key).scoutAfter?.hurt)
      .toBe(0.12);
    expect(settleArc5BioscanV1(fresh.preflight, true, 100, 10, earth().key).scoutAfter?.hurt)
      .toBe(0.6);
  });

  it('refuses an imported Scout beyond Critical instead of silently healing it', () => {
    expect(preflightArc5BioscanV1(scoutOwnership(0.9))).toEqual({
      kind: 'refused', reason: 'scout-hurt-unsupported',
    });
  });

  it('commits one Survey ledger successor and one hazard draw atomically without mutating input', async () => {
    const f = await fixture();
    const input = {
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    };
    expect(projectBioscanActionV1(input).kind).toBe('ready');
    const before = JSON.stringify(f.state);
    const outcome = await commitBioscanActionV1(input);
    expect(outcome.kind, JSON.stringify(outcome)).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction).toMatchObject({
      revision: 1, plan: { domain: BIOSCAN_ACTION_DOMAIN_V1, receiptOrdinal: 0 },
    });
    expect(outcome.transaction.plan.domain).toBe(DOMAINS.surveyHazard);
    expect(outcome.state.surveyedSet).toEqual([f.address.key]);
    expect(outcome.state.stats.surveys).toBe(1);
    expect(outcome.state.hp).toBeGreaterThanOrEqual(1);
    expect(outcome.settlement.hostile).toBe(false);
    expect(outcome.paragon).toEqual({ kind: 'none', index: null, codexId: null });
    expect(outcome.achievementIdsAdded).toEqual([]);
    expect(outcome.postHazardAggregateAchievementIdsAdded).toEqual([]);
    expect(outcome.starterCharter).toMatchObject({
      changed: false,
      event: { kind: 'bioscan', worldKey: f.address.key, planetSeed: f.address.planet.seed },
    });
    expect(JSON.parse(outcome.transaction.receipt.witness)).toEqual({
      bioscanWitness: expect.stringMatching(/^arc9bv1:/u),
    });
    expect(outcome.state.unlocked).not.toContain('survivor');
    expect(prepareArc9ProgressionRefreshV1(outcome.state).kind).toBe('current');
    expect(JSON.stringify(f.state)).toBe(before);
    const published = structuredClone(f.state);
    publishBioscanActionV1(published, outcome);
    expect(published).toEqual(outcome.state);
    const changedParent = structuredClone(f.state);
    changedParent.hp += 1;
    expect(() => publishBioscanActionV1(changedParent, outcome))
      .toThrow('exact live parent');
    expect(await f.repository.revision()).toBe(1);
    const saved = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') {
      expect(saved.state.surveyedSet).toEqual([f.address.key]);
      expect(readF4Authority(saved.extensions)).toMatchObject({
        kind: 'loaded', authority: { sessionRng: { ordinal: 1, draws: { [DOMAINS.surveyHazard]: 1 } } },
      });
    }
    const repeat = await commitBioscanActionV1({ ...input, state: outcome.state });
    expect(repeat).toMatchObject({ kind: 'refused', detail: 'already-recorded', transaction: null });
    await f.runtime.release();
  });

  it('settles the accepted Field naturalist weekly in the same first Discover Life receipt', async () => {
    const f = await fixture(0xB105CA8, Object.freeze([]), {
      configureState: (save) => {
        save.chDone = ['st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq'];
        /* NOW is wall week 2899; one-week-ahead saved authority is deliberately
           preserved and its exact week-2900 slate contains wk-scan. */
        save.chWeek = 2900;
        save.chacc = ['wk-scan'];
        save.chProg = { 'wk-scan': 2 };
      },
    });
    const input = {
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    };
    const before = structuredClone(f.state);
    const outcome = await commitBioscanActionV1(input);
    expect(outcome.kind, JSON.stringify(outcome)).toBe('committed');
    expect(f.state).toEqual(before);
    if (outcome.kind !== 'committed') return;
    expect(outcome.weeklyCharter).toMatchObject({
      changed: true,
      events: [{ kind: 'bioscan', worldKey: f.address.key, first: true }],
      rollover: { status: 'backward-preserved', wallWeek: 2899, effectiveWeek: 2900 },
      progressIds: ['wk-scan'],
      completions: [{ id: 'wk-scan', stardust: 25 }],
    });
    expect(outcome.state).toMatchObject({
      chWeek: 2900, chacc: [], chProg: { 'wk-scan': 3 },
      essence: before.essence + 25,
      stats: {
        essenceEarned: (before.stats.essenceEarned ?? 0) + 25,
        charters: (before.stats.charters ?? 0) + 1,
      },
    });
    expect(JSON.parse(outcome.transaction.receipt.witness)).toMatchObject({
      bioscanWitness: expect.stringMatching(/^arc9bv1:/u),
      weeklyCharter: { events: [{ kind: 'bioscan', first: true }] },
    });
    const repeat = await commitBioscanActionV1({ ...input, state: outcome.state });
    expect(repeat).toMatchObject({ kind: 'refused', detail: 'already-recorded' });
    expect(await f.repository.revision()).toBe(1);
    await f.runtime.release();
  });

  it('catalogues the exact home-world Paragon in the same Bioscan receipt without capture or Yield', async () => {
    const location = paragonLocation();
    const f = await fixture(0xB105CA7, [], {
      address: location.address,
      configureState(state) {
        state.chDone = ['st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq'];
        state.chWeek = 2899;
        state.chacc = ['wk-sp'];
        state.chProg = { 'wk-sp': 4 };
      },
    });
    const before = JSON.stringify(f.state);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome.kind, JSON.stringify(outcome)).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.paragon).toEqual({
      kind: 'added', index: location.index, codexId: location.codexId,
    });
    expect(outcome.transaction).toMatchObject({
      revision: 1,
      plan: { domain: DOMAINS.surveyHazard, receiptOrdinal: 0 },
    });
    expect(outcome.state.stats.paragons).toBe(1);
    expect(outcome.weeklyCharter).toMatchObject({
      changed: true,
      events: [
        { kind: 'bioscan', worldKey: f.address.key, first: true },
        { kind: 'species', codexId: location.codexId, first: true },
      ],
      progressIds: ['wk-sp'],
      completions: [{ id: 'wk-sp', stardust: 25 }],
    });
    expect(outcome.state).toMatchObject({
      chWeek: 2899, chacc: [], chProg: { 'wk-sp': 5 },
      stats: { charters: 1 },
    });
    expect(outcome.state.codex).toHaveLength(1);
    expect(outcome.state.codex[0]).toEqual([
      location.codexId,
      projectArc9ParagonLegacyCodexEntryV1(location),
    ]);
    expect(outcome.postHazardAggregateAchievementIdsAdded).toContain('first');
    expect(outcome.state.unlocked).toContain('first');
    const source = ownershipSourceStateV1(outcome.ownershipV2);
    expect(source).toMatchObject({ revision: 1, scoutCreatureId: null });
    expect(source.catalogSpecies).toHaveLength(1);
    expect(source.discoveries).toHaveLength(1);
    expect(source.discoveries[0]).toMatchObject({
      acquisition: 'paragon', firstForSpecies: true,
      provenance: {
        kind: 'paragon', paragonIndex: location.index,
        worldKey: location.address.key, receiptOrdinal: 0,
      },
    });
    expect(source.creatures).toEqual([]);
    expect(source.specimenLots).toEqual([]);
    expect(source.biosphereProgress).toEqual([]);
    expect(outcome.ownershipV2.creatures).toEqual([]);
    expect(outcome.ownershipV2.specimenLots).toEqual([]);
    expect(outcome.ownershipWrites).toHaveLength(23);
    expect(JSON.stringify(f.state)).toBe(before);
    expect(await f.repository.revision()).toBe(1);
    expect(await f.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    expect(f.runtime.sessionRng).toEqual({
      seed: 0xB105CA7,
      ordinal: 1,
      draws: { [DOMAINS.surveyHazard]: 1 },
    });
    const durableArc4 = readArc4Ownership(
      f.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(durableArc4.kind).toBe('loaded');
    if (durableArc4.kind === 'loaded') {
      expect(durableArc4.state).toEqual(source);
      expect(projectLegacyOwnershipMirror(durableArc4.state)).toMatchObject({
        kind: 'projected',
        codex: [{ legacyCodexId: location.codexId, f: 'Paragon site #1' }],
      });
    }
    const published = structuredClone(f.state);
    publishBioscanActionV1(published, outcome);
    expect(published).toEqual(outcome.state);
    await f.runtime.release();
  });

  it('treats an exact already-catalogued Paragon as a fixed point with no repeat reward', async () => {
    const location = paragonLocation();
    const ownershipV2 = priorParagonOwnership(location.index, location.address);
    const legacyEntry = projectArc9ParagonLegacyCodexEntryV1(location);
    const ownershipMirror = projectLegacyOwnershipMirror(ownershipSourceStateV1(ownershipV2));
    expect(ownershipMirror.kind).toBe('projected');
    if (ownershipMirror.kind !== 'projected') return;
    expect({
      legacyCodexId: legacyEntry.id,
      g: legacyEntry.g,
      f: legacyEntry.from,
      w: legacyEntry.where,
    }).toEqual(ownershipMirror.codex[0]);
    const f = await fixture(0xB105CA7, [], {
      address: location.address,
      ownershipV2,
      configureState(state) {
        state.codex = [[legacyEntry.id, structuredClone(legacyEntry)]];
        state.stats = {
          ...state.stats,
          paragons: 1,
          best: legacyEntry.tier ?? 0,
          maxGen: typeof legacyEntry.g.gen === 'number' ? legacyEntry.g.gen : 0,
        };
        const refresh = prepareArc9ProgressionRefreshV1(state);
        if (refresh.kind === 'ready') {
          state.unlocked = [...refresh.successorState.unlocked];
          state.stats = { ...refresh.successorState.stats };
        }
      },
    });
    const sourceBefore = ownershipSourceStateV1(f.ownershipV2);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome.kind, JSON.stringify(outcome)).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.paragon).toEqual({
      kind: 'repeat', index: location.index, codexId: location.codexId,
    });
    expect(outcome.state.stats.paragons).toBe(1);
    expect(outcome.state.codex).toEqual(f.state.codex);
    expect(outcome.ownershipWrites).toEqual([]);
    expect(ownershipSourceStateV1(outcome.ownershipV2)).toEqual(sourceBefore);
    expect(outcome.ownershipV2.revision).toBe(f.ownershipV2.revision);
    expect(outcome.postHazardAggregateAchievementIdsAdded).toEqual([]);
    expect(await f.repository.revision()).toBe(1);
    await f.runtime.release();
  });

  it('completes accepted st-scan with Stardust, honored count, and one auto-equipped Earpiece in the Bioscan CAS', async () => {
    const f = await fixture(5, [], {
      ownershipV2: scoutOwnership(0),
      configureState(state) {
        state.chDone = ['st-land', 'st-mine'];
        state.chacc = ['st-scan'];
        state.stats = { ...state.stats, charters: 2, essenceEarned: 40 };
        state.essence = 25;
      },
    });
    const before = JSON.stringify(f.state);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.starterCharter).toMatchObject({
      changed: true,
      event: { kind: 'bioscan', worldKey: f.address.key, planetSeed: f.address.planet.seed },
      progressIds: ['st-scan'],
      completions: [{
        id: 'st-scan', title: 'Discover life', stardust: 15,
        gearId: 'earpiece', alreadyProven: false,
      }],
    });
    expect(outcome.transaction.state).toMatchObject({
      chDone: ['st-land', 'st-mine', 'st-scan'],
      chacc: [],
      chProg: { 'st-scan': 1 },
      essence: 40,
      stats: { essenceEarned: 55, charters: 3 },
      items: [['earpiece', 1]],
      equip: { ears: 'earpiece' },
    });
    expect(outcome.settlement).toMatchObject({ hostile: true, target: 'scout' });
    expect(outcome.ownershipWrites).toHaveLength(5);
    expect(outcome.extensionWrites).toHaveLength(6);
    expect(JSON.stringify(f.state)).toBe(before);
    expect(await f.repository.revision()).toBe(1);
    expect(await f.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    expect(f.runtime.sessionRng).toEqual({
      seed: 5,
      ordinal: 1,
      draws: { [DOMAINS.surveyHazard]: 1 },
    });
    const witness = JSON.parse(outcome.transaction.receipt.witness) as Record<string, unknown>;
    expect(witness).toMatchObject({
      bioscanWitness: expect.stringMatching(/^arc9bv1:/u),
      starterCharter: { event: { kind: 'bioscan', worldKey: f.address.key } },
    });
    const loot = readArc2Loot(f.runtime.extensions);
    expect(loot.kind).toBe('loaded');
    if (loot.kind === 'loaded' && loot.state.kind === 'inventory') {
      expect(loot.state.inventory.entries).toHaveLength(1);
      expect(loot.state.inventory.entries[0]?.instance).toMatchObject({ baseId: 'earpiece' });
      expect(loot.state.inventory.equipped).toEqual([
        { slot: 'ears', instanceId: loot.state.inventory.entries[0]!.instance.instanceId },
      ]);
      expect(loot.state.inventory.pendingRewards).toEqual([]);
    }
    const published = structuredClone(f.state);
    publishBioscanActionV1(published, outcome);
    expect(published).toEqual(outcome.state);
    await f.runtime.release();
  });

  it('refuses at the exact pending-reward carrier boundary before saving Discover Life', async () => {
    const f = await fixture(0xB105CA7, [], {
      inventoryCapacity: 1,
      pendingRewardCapacityExhausted: true,
      configureState(state) {
        state.chDone = ['st-land', 'st-mine'];
        state.chacc = ['st-scan'];
        state.items = [['resonator', 1]];
      },
    });
    const before = JSON.stringify(f.state);
    const beforeExtensions = JSON.stringify(f.runtime.extensions);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'transaction:rejected',
      transaction: {
        kind: 'rejected', stage: 'derive',
        message: 'bioscan starter Charter starter-gear:write-extension-bounds',
      },
    });
    expect(JSON.stringify(f.state)).toBe(before);
    expect(JSON.stringify(f.runtime.extensions)).toBe(beforeExtensions);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.repository.readReceipt(0)).toBeUndefined();
    expect(f.runtime.sessionRng).toMatchObject({ ordinal: 0, draws: {} });
    const saved = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') {
      expect(saved.state.surveyedSet).toEqual([]);
      expect(saved.state.chacc).toEqual(['st-scan']);
      expect(saved.state.chDone).toEqual(['st-land', 'st-mine']);
    }
    await f.runtime.release();
  });

  it('refuses protected post-hazard progression before Survey, Charter, receipt, or RNG', async () => {
    const compatibility = Array.from(
      { length: MAX_UNLOCKED_ACHIEVEMENT_IDS - 1 },
      (_, index) => `compat-bioscan-${index}`,
    );
    const f = await fixture(5, compatibility, {
      configureState(state) {
        state.chDone = ['st-land', 'st-mine'];
        state.chacc = ['st-scan'];
      },
    });
    const before = JSON.stringify(f.state);
    const beforeExtensions = JSON.stringify(f.runtime.extensions);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'transaction:rejected',
      transaction: {
        kind: 'rejected', stage: 'derive',
        message: 'bioscan starter Charter starter-progression:achievement-capacity',
      },
    });
    expect(JSON.stringify(f.state)).toBe(before);
    expect(JSON.stringify(f.runtime.extensions)).toBe(beforeExtensions);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.repository.readReceipt(0)).toBeUndefined();
    expect(f.runtime.sessionRng).toMatchObject({ ordinal: 0, draws: {} });
    const saved = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') expect(saved.state.surveyedSet).toEqual([]);
    await f.runtime.release();
  });

  it('requires the exact committed Earpiece carrier, not only its legacy mirror', async () => {
    const f = await fixture(5, [], {
      ownershipV2: scoutOwnership(0),
      configureState(state) {
        state.chDone = ['st-land', 'st-mine'];
        state.chacc = ['st-scan'];
      },
    });
    const runtime = {
      commitOutcome: async (...args: Parameters<typeof f.runtime.commitOutcome>) => {
        const committed = await f.runtime.commitOutcome(...args);
        if (committed.kind !== 'committed') return committed;
        const loaded = readArc2Loot(committed.saved.extensions);
        if (loaded.kind !== 'loaded' || loaded.state.kind !== 'inventory') return committed;
        const original = loaded.state.inventory.entries[0]?.instance;
        if (!original) return committed;
        const replacement = createGearInstance(makeGearSourceActionId({
          kind: 'expedition', ownerId: 'bioscan-postcommit-substitution',
          actionKey: 'wrong-earpiece', receiptId: 'fixture',
        }), 0, getFixedCraftGenerationPlan('earpiece', original.generation.seed));
        const inventory = Object.freeze({
          ...loaded.state.inventory,
          entries: loaded.state.inventory.entries.map((entry) => Object.freeze({
            ...entry,
            instance: entry.instance.instanceId === original.instanceId ? replacement : entry.instance,
          })),
          equipped: loaded.state.inventory.equipped.map((binding) => Object.freeze({
            ...binding,
            instanceId: binding.instanceId === original.instanceId
              ? replacement.instanceId : binding.instanceId,
          })),
        });
        const altered = prepareArc2LootInventoryWrite({
          extensions: committed.saved.extensions,
          inventory,
          stackableCounts: loaded.state.stackableCounts,
        });
        if (altered.kind !== 'prepared') throw new Error(altered.kind);
        expect(projectArc2LootLegacyMirror(altered.state)).toEqual({
          items: committed.state.items,
          equip: committed.state.equip,
          equipAff: committed.state.equipAff,
        });
        return Object.freeze({
          ...committed,
          saved: Object.freeze({ ...committed.saved, extensions: altered.extensions }),
        });
      },
    };
    const outcome = await commitBioscanActionV1({
      runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
      detail: 'committed-bioscan-fixed-point-mismatch',
    });
    expect(await f.repository.revision()).toBe(1);
    expect(f.runtime.sessionRng).toMatchObject({
      ordinal: 1, draws: { [DOMAINS.surveyHazard]: 1 },
    });
    await f.runtime.release();
  });

  it('leaves worn ears intact and routes the Earpiece to pending reward when inventory is full', async () => {
    const f = await fixture(0xB105CA7, [], {
      inventoryCapacity: 1,
      configureState(state) {
        state.chDone = ['st-land', 'st-mine'];
        state.chacc = ['st-scan'];
        state.items = [['resonator', 1]];
        state.equip = { ears: 'resonator' };
      },
    });
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.state.equip).toEqual({ ears: 'resonator' });
    expect(outcome.state.items).toEqual([['earpiece', 1], ['resonator', 1]]);
    const loot = readArc2Loot(f.runtime.extensions);
    expect(loot.kind).toBe('loaded');
    if (loot.kind === 'loaded' && loot.state.kind === 'inventory') {
      expect(loot.state.inventory.entries).toHaveLength(1);
      expect(loot.state.inventory.entries[0]?.instance.baseId).toBe('resonator');
      expect(loot.state.inventory.equipped).toEqual([
        { slot: 'ears', instanceId: loot.state.inventory.entries[0]!.instance.instanceId },
      ]);
      expect(loot.state.inventory.pendingRewards).toHaveLength(1);
      expect(loot.state.inventory.pendingRewards[0]?.instance.baseId).toBe('earpiece');
    }
    await f.runtime.release();
  });

  it('refuses a Charter reward overflow before saving Survey, reward, gear, receipt, or RNG', async () => {
    const f = await fixture(0xB105CA7, [], {
      configureState(state) {
        state.chDone = ['st-land', 'st-mine'];
        state.chacc = ['st-scan'];
        state.essence = Number.MAX_SAFE_INTEGER;
      },
    });
    const before = JSON.stringify(f.state);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'transaction:rejected',
      transaction: {
        kind: 'rejected', stage: 'derive',
        message: 'bioscan starter Charter starter Charter reward would overflow',
      },
    });
    expect(JSON.stringify(f.state)).toBe(before);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.repository.readReceipt(0)).toBeUndefined();
    expect(f.runtime.sessionRng).toMatchObject({ ordinal: 0, draws: {} });
    const saved = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') {
      expect(saved.state.surveyedSet).toEqual([]);
      expect(saved.state.chacc).toEqual(['st-scan']);
      expect(saved.state.chDone).toEqual(['st-land', 'st-mine']);
      expect(saved.state.items).toEqual([]);
    }
    await f.runtime.release();
  });

  it('refuses protected gear revision exhaustion before saving any part of Discover Life', async () => {
    const f = await fixture(0xB105CA7, [], {
      inventoryRevisionExhausted: true,
      configureState(state) {
        state.chDone = ['st-land', 'st-mine'];
        state.chacc = ['st-scan'];
      },
    });
    const before = JSON.stringify(f.state);
    const beforeExtensions = JSON.stringify(f.runtime.extensions);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'transaction:rejected',
      transaction: {
        kind: 'rejected', stage: 'derive',
        message: 'bioscan starter Charter starter-gear:revision-exhausted',
      },
    });
    expect(JSON.stringify(f.state)).toBe(before);
    expect(JSON.stringify(f.runtime.extensions)).toBe(beforeExtensions);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.repository.readReceipt(0)).toBeUndefined();
    expect(f.runtime.sessionRng).toMatchObject({ ordinal: 0, draws: {} });
    const saved = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') {
      expect(saved.state.surveyedSet).toEqual([]);
      expect(saved.state.chacc).toEqual(['st-scan']);
      expect(saved.state.chDone).toEqual(['st-land', 'st-mine']);
    }
    await f.runtime.release();
  });

  it('joins survivor to the same hostile Discover Life receipt without a second write', async () => {
    const f = await fixture(5, ['compat-a', 'compat-b', 'compat-c', 'compat-d']);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.hostile).toBe(true);
    expect(outcome.achievementIdsAdded).toEqual(['survivor']);
    expect(outcome.postHazardAggregateAchievementIdsAdded).toEqual([]);
    expect(outcome.state.unlocked).toContain('survivor');
    expect(outcome.survey.successor.bestRank).toBe(0);
    expect(outcome.state.stats.bestRank).toBe(1);
    expect(prepareArc9ProgressionRefreshV1(outcome.state).kind).toBe('current');
    expect(outcome.transaction.revision).toBe(1);
    expect(await f.repository.revision()).toBe(1);
    const saved = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') expect(saved.state.unlocked).toContain('survivor');
    await f.runtime.release();
  });

  it('refuses a stale Scout projection before any hazard draw or save revision', async () => {
    const f = await fixture();
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: scoutOwnership(), engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:rejected',
      transaction: { kind: 'rejected', stage: 'derive', message: 'bioscan authorities diverged' },
    });
    expect(await f.repository.revision()).toBe(0);
    const saved = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') {
      expect(readF4Authority(saved.extensions)).toMatchObject({
        kind: 'loaded', authority: { sessionRng: { ordinal: 0 } },
      });
    }
    await f.runtime.release();
  });

  it('refuses a stale exact-home Paragon Bioscan without a retry, receipt, or RNG advance', async () => {
    const location = paragonLocation();
    const f = await fixture(0xB105CA7, [], { address: location.address });
    const savedBefore = await readSaveV5(f.backend, REGISTRY, NOW);
    await f.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'paragon-race-winner', value: 'other-tab' }],
    });
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(await f.repository.readReceipt(0)).toBeUndefined();
    expect(f.runtime.sessionRng).toEqual({ seed: 0xB105CA7, ordinal: 0, draws: {} });
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    await f.runtime.release();
  });

  it('fails exact-home Paragon storage once with no receipt, revision, or optimistic publication', async () => {
    const location = paragonLocation();
    const f = await fixture(0xB105CA7, [], { address: location.address });
    const before = JSON.stringify(f.state);
    const savedBefore = await readSaveV5(f.backend, REGISTRY, NOW);
    f.armReceiptStorageFailure();
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:storage-error',
      transaction: { kind: 'storage-error', message: 'forced Paragon Bioscan storage failure' },
    });
    expect(JSON.stringify(f.state)).toBe(before);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.repository.readReceipt(0)).toBeUndefined();
    expect(f.runtime.sessionRng).toEqual({ seed: 0xB105CA7, ordinal: 0, draws: {} });
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    await f.runtime.release();
  });

  it('refuses an exhausted Paragon counter before saving any transaction consequence', async () => {
    const location = paragonLocation();
    const f = await fixture(0xB105CA7, [], {
      address: location.address,
      configureState(state) {
        state.stats = { ...state.stats, paragons: 1_000_000_000 };
      },
    });
    const before = JSON.stringify(f.state);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'transaction:rejected',
      transaction: {
        kind: 'rejected', stage: 'derive',
        message: 'Paragon discovery counter is exhausted',
      },
    });
    expect(JSON.stringify(f.state)).toBe(before);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.repository.readReceipt(0)).toBeUndefined();
    expect(f.runtime.sessionRng).toEqual({ seed: 0xB105CA7, ordinal: 0, draws: {} });
    await f.runtime.release();
  });

  it('requires the exact postcommit Paragon Arc 4 and Arc 5 carriers', async () => {
    const location = paragonLocation();
    const f = await fixture(0xB105CA7, [], { address: location.address });
    const extensionsBefore = f.runtime.extensions;
    const runtime = {
      commitOutcome: async (...args: Parameters<typeof f.runtime.commitOutcome>) => {
        const committed = await f.runtime.commitOutcome(...args);
        return committed.kind === 'committed'
          ? Object.freeze({
              ...committed,
              saved: Object.freeze({ ...committed.saved, extensions: extensionsBefore }),
            })
          : committed;
      },
    };
    const outcome = await commitBioscanActionV1({
      runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-bioscan-fixed-point-mismatch',
      transaction: { kind: 'committed', revision: 1 },
    });
    expect(await f.repository.revision()).toBe(1);
    expect(await f.repository.readReceipt(0)).toBeDefined();
    const durableArc4 = readArc4Ownership(
      f.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(durableArc4.kind).toBe('loaded');
    if (durableArc4.kind === 'loaded') {
      expect(durableArc4.state.discoveries[0]?.provenance).toMatchObject({
        kind: 'paragon', paragonIndex: 0,
      });
    }
    await f.runtime.release();
  });

  it('refuses a divergent legacy gear mirror before any hazard draw or save revision', async () => {
    const f = await fixture();
    f.state.items = [['headlamp', 1]];
    const before = JSON.stringify(f.state);
    const beforeExtensions = JSON.stringify(f.runtime.extensions);
    const outcome = await commitBioscanActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, engineering: f.engineering,
      capabilities: f.capabilities, state: f.state, address: f.address,
      roster: f.roster, opportunity: f.opportunity, settled: false, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:rejected',
      transaction: { kind: 'rejected', stage: 'derive', message: 'bioscan authorities diverged' },
    });
    expect(JSON.stringify(f.state)).toBe(before);
    expect(JSON.stringify(f.runtime.extensions)).toBe(beforeExtensions);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.repository.readReceipt(0)).toBeUndefined();
    expect(f.runtime.sessionRng).toMatchObject({ ordinal: 0, draws: {} });
    const saved = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') expect(saved.state.items).toEqual([]);
    await f.runtime.release();
  });
});
