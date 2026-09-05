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
  type CreatureInstanceId,
  type DiscoveryRecordId,
} from '@cf/domain-acquisition';
import {
  preflightArc5BioscanV1,
  settleArc5BioscanV1,
} from '@cf/domain-acquisition/bioscan-internal';
import { makeGenome } from '@cf/domain-genome';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  migrateLegacyEngineeringState,
  projectWorldOpportunity,
} from '@cf/domain-opportunity';
import { createSessionRNG, DOMAINS } from '@cf/domain-sessionrng';
import { resolveCF1WorldAddress } from '@cf/scene';
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
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc2EngineeringLoadout,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';
import {
  BIOSCAN_ACTION_DOMAIN_V1,
  commitBioscanActionV1,
  projectBioscanActionV1,
  publishBioscanActionV1,
} from '../apps/game/src/bioscan-action.js';
import { prepareArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-projection.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
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
) {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const state: SaveStateV2 = {
    ...imported.state, hp: 7, HP_MAX: 100,
    pstats: { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 }, techOwned: [],
    stats: { ...imported.state.stats, bestRank: 0 },
    unlocked: [...compatibilityAchievementIds],
  };
  const engineering = migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA, revision: 0,
    worlds: [], stars: [], research: [],
  }, { resolveWorldSeed: () => [], resolveStarSeed: () => [] });
  const loot = prepareArc2LootLegacyMigration({
    extensions: {}, legacy: { items: [], equip: {}, equipAff: {} }, capacity: 8,
  });
  if (loot.kind !== 'prepared') throw new Error(loot.kind);
  const engineered = applyV5ExtensionWrites(loot.extensions, [{
    segment: ARC3_ENGINEERING_SEGMENT, namespace: ARC3_ENGINEERING_NAMESPACE,
    carrier: encodeArc3EngineeringCarrier(engineering),
  }]).extensions;
  const f4 = prepareF4AuthorityUpdate(
    engineered, { activePlayMs: 0 }, createSessionRNG(sessionSeed).state(),
  );
  const arc4 = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(emptyOwnership()).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(arc5.kind);
  const loadout = readArc2EngineeringLoadout(arc5.extensions);
  if (loadout.kind !== 'loaded') throw new Error(loadout.kind);
  const backend = createMemoryBackend();
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
  const address = earth();
  const roster = canonicalWorldRoster(address, 0);
  if (!roster.ok) throw new Error(roster.reason);
  return {
    state, engineering, capabilities: loadout.capabilities, ownershipV2: arc5.state,
    backend, repository, runtime, address, roster: roster.roster,
    opportunity: projectWorldOpportunity(address),
  };
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
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction).toMatchObject({
      revision: 1, plan: { domain: BIOSCAN_ACTION_DOMAIN_V1, receiptOrdinal: 0 },
    });
    expect(outcome.transaction.plan.domain).toBe(DOMAINS.surveyHazard);
    expect(outcome.state.surveyedSet).toEqual([f.address.key]);
    expect(outcome.state.stats.surveys).toBe(1);
    expect(outcome.state.hp).toBeGreaterThanOrEqual(1);
    expect(outcome.settlement.hostile).toBe(false);
    expect(outcome.achievementIdsAdded).toEqual([]);
    expect(outcome.postHazardAggregateAchievementIdsAdded).toEqual([]);
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
});
