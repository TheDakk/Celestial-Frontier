import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  ENGINEERING_STATE_SCHEMA,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  decodeEngineeringState,
  encodeEngineeringState,
  type MiningResult,
  type StellarSkimResult,
} from '@cf/domain-opportunity';
import {
  applyV5ExtensionWrites,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  initializeFreshV5,
  prepareArc2LootLegacyMigration,
  readArc2Loot,
  readF4Authority,
  readArc2EngineeringLoadout,
  readArc3Engineering,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import {
  NAV_HOME,
  navFromCanonicalCF1Address,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
  type SurfaceNav,
  type SystemNav,
} from '@cf/scene';
import {
  buildArc3EngineeringAddressInventory,
  deriveArc3FixedFabricationAction,
  deriveArc3MineAction,
  deriveArc3ResearchAction,
  deriveArc3SkimAction,
  prepareArc3AppBootstrap,
  publishArc3FixedFabricationFields,
  publishArc3LegacyCompatibilityFields,
  publishArc3MiningFields,
  publishArc3ResearchFields,
  stageArc3BootstrapLegacyProjection,
  verifyArc3CommittedAction,
  verifyArc3CommittedFixedFabricationAction,
  verifyArc3CommittedResearchAction,
  type Arc3AppDerivation,
  type Arc3EngineeringAddressSources,
} from '../apps/game/src/arc3-engineering-actions.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(
  fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8'),
) as ContentRegistry;
const NOW = 1_753_900_060_000;
const SOL = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 424242, x: 560, y: 170 },
};
const MARS = { ...SOL, planet: { seed: 134 } };
const REMNANT_STAR = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 3363971653, x: -386.2348864697851, y: 453.95830733468756 },
};
const COLLISION_WORLD_A = {
  galaxy: { seed: 2168115821, x: -1104.3939002789557, y: -1400.6738864816725 },
  star: { seed: 2404948836, x: 79.28673347271979, y: 172.30901278089732 },
  planet: { seed: 2525295284 },
};
const COLLISION_WORLD_B = {
  galaxy: { seed: 742431365, x: 357.33832279220223, y: 1882.66924303025 },
  star: { seed: 134687484, x: 219.1186681254767, y: -157.20003835111856 },
  planet: { seed: 2525295284 },
};

beforeAll(() => installCaptureHooks());

function world(candidate: unknown): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress(candidate);
  if (!result.ok) throw new Error(`world fixture failed: ${result.reason}`);
  return result.address;
}

function star(candidate: unknown): CanonicalCF1StarAddress {
  const result = resolveCF1StarAddress(candidate);
  if (!result.ok) throw new Error(`star fixture failed: ${result.reason}`);
  return result.address;
}

function surface(address: CanonicalCF1WorldAddress): SurfaceNav {
  const result = navFromCanonicalCF1Address(address);
  if (!result.ok || result.state.mode !== 'surface') throw new Error('surface fixture failed');
  return result.state;
}

function system(address: CanonicalCF1StarAddress): SystemNav {
  const result = navFromCanonicalCF1Address(address);
  if (!result.ok || result.state.mode !== 'system') throw new Error('system fixture failed');
  return result.state;
}

function engineeringStateForWorlds(
  rows: readonly Readonly<{ address: CanonicalCF1WorldAddress; count: number }>[],
) {
  return decodeEngineeringState(JSON.stringify({
    schema: ENGINEERING_STATE_SCHEMA,
    revision: 7,
    worlds: rows.map(({ address, count }) => ({
      key: address.key,
      address: {
        format: 'CF1', key: address.key,
        galaxy: {
          seed: address.galaxy.seed, x: address.galaxy.x, y: address.galaxy.y,
          size: address.galaxy.size, sp: address.galaxy.sp,
          tilt: address.galaxy.tilt, rot: address.galaxy.rot,
          home: address.galaxy.home, quasar: address.galaxy.quasar,
          dwarf: address.galaxy.dwarf,
          parentCell: { x: address.galaxy.parentCell.x, y: address.galaxy.parentCell.y },
        },
        star: {
          seed: address.star.seed, x: address.star.x, y: address.star.y,
          layer: address.star.layer,
          parentCell: { x: address.star.parentCell.x, y: address.star.parentCell.y },
        },
        planet: { seed: address.planet.seed, ordinal: address.planet.ordinal },
      },
      extractionsTaken: count,
      autoExtractorCursor: null,
    })).sort((left, right) => left.key < right.key ? -1 : left.key > right.key ? 1 : 0),
    stars: [],
    research: [],
  }), SCENE_ENGINEERING_ADDRESS_RESOLVER);
}

function freshSave(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`fresh save failed: ${imported.reason}`);
  return imported.state;
}

function sources(current: Arc3EngineeringAddressSources['current']): Arc3EngineeringAddressSources {
  return Object.freeze({ current, saved: null, atlas: Object.freeze([]) });
}

function productExtensions(input: Readonly<{
  save: SaveStateV2;
  sources: Arc3EngineeringAddressSources;
  items?: readonly (readonly [string, number])[];
  capacity?: number;
}>): V5Extensions {
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: {
      items: (input.items ?? []).map(([id, count]) => [id, count]),
      equip: {},
      equipAff: {},
    },
    capacity: input.capacity ?? 32,
  });
  if (loot.kind !== 'prepared') throw new Error(`Arc 2 fixture was ${loot.kind}`);
  const engineering = prepareArc3AppBootstrap({
    extensions: loot.extensions,
    save: input.save,
    sources: input.sources,
  });
  if (engineering.kind !== 'prepared') {
    throw new Error(`Arc 3 fixture was ${engineering.kind}:${engineering.kind === 'protected' ? engineering.detail : ''}`);
  }
  return engineering.extensions;
}

function withEngineeringState(
  extensions: V5Extensions,
  state: ReturnType<typeof engineeringStateForWorlds>,
): V5Extensions {
  const candidate = structuredClone(extensions) as unknown as
    Record<string, Record<string, { version: number; json: string }>>;
  const carrier = candidate.player?.['arc3.engineering'];
  if (carrier === undefined) throw new Error('Arc 3 fixture carrier was absent');
  candidate.player!['arc3.engineering'] = {
    ...carrier,
    json: encodeEngineeringState(state),
  };
  return candidate as V5Extensions;
}

function controlledClock(start = 0) {
  let value = start;
  return { now: () => value, advance: (amount: number) => { value += amount; } };
}

async function seededRuntime(input: Readonly<{
  save: SaveStateV2;
  extensions: V5Extensions;
  seed?: number;
}>): Promise<Readonly<{
  backend: StorageBackend;
  repository: ReturnType<typeof createRevisionedRepository>;
  runtime: ReturnType<typeof createF4RuntimeAuthority>;
  time: ReturnType<typeof controlledClock>;
}>> {
  const backend = createMemoryBackend();
  const repository = createRevisionedRepository(backend);
  const initialized = await initializeFreshV5(
    backend,
    { state: input.save, extensions: input.extensions },
    REGISTRY,
    NOW,
  );
  if (initialized.kind !== 'initialized') {
    throw new Error(`fresh v5 fixture was ${initialized.kind}`);
  }
  const time = controlledClock(100);
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: initialized.revision,
    initialExtensions: input.extensions,
    restoredAuthority: null,
    freshSessionSeed: input.seed ?? 0xA3C30001,
    ownerId: 'arc3-test-tab',
    token: 'arc3-test-document',
    leaseTtlMs: 10_000,
    now: time.now,
    visible: true,
    answerable: true,
  });
  await expect(runtime.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
  await expect(runtime.commit(input.save, NOW)).resolves.toMatchObject({ kind: 'committed' });
  return Object.freeze({ backend, repository, runtime, time });
}

function runtimeMine(
  runtime: ReturnType<typeof createF4RuntimeAuthority>,
  save: SaveStateV2,
  currentSurface: SurfaceNav,
  codecNow = NOW,
  onPlan: (plan: Arc3AppDerivation) => void = () => undefined,
) {
  return runtime.commitAction({
    state: save,
    operation: 'arc3.mine-world',
    receiptKind: 'arc3-mine-world',
    codecNow,
    derive: ({ draft, extensions, activePlayMs, receiptOrdinal }) => {
      const outcome = deriveArc3MineAction({
        draft, extensions, currentSurface, activePlayMs, receiptOrdinal, codecNow,
      });
      if (outcome.kind !== 'ready') throw new Error(outcome.detail);
      onPlan(outcome.derivation);
      return {
        state: outcome.derivation.state,
        extensionWrites: outcome.derivation.extensionWrites,
        witness: outcome.derivation.witness,
      };
    },
  });
}

function runtimeResearch(
  runtime: ReturnType<typeof createF4RuntimeAuthority>,
  save: SaveStateV2,
  researchId: string,
  onPlan: (plan: Arc3AppDerivation) => void = () => undefined,
) {
  return runtime.commitAction({
    state: save,
    operation: 'arc3.purchase-research',
    receiptKind: 'arc3-purchase-research',
    codecNow: NOW,
    derive: ({ draft, extensions, receiptOrdinal }) => {
      const outcome = deriveArc3ResearchAction({
        draft, extensions, researchId, receiptOrdinal, codecNow: NOW,
      });
      if (outcome.kind !== 'ready') throw new Error(outcome.detail);
      onPlan(outcome.derivation);
      return {
        state: outcome.derivation.state,
        extensionWrites: outcome.derivation.extensionWrites,
        witness: outcome.derivation.witness,
      };
    },
  });
}

function runtimeFixedFabrication(
  runtime: ReturnType<typeof createF4RuntimeAuthority>,
  save: SaveStateV2,
  baseId: string,
  onPlan: (plan: Arc3AppDerivation) => void = () => undefined,
) {
  return runtime.commitAction({
    state: save,
    operation: 'arc3.fabricate-fixed',
    receiptKind: 'arc3-fabricate-fixed',
    codecNow: NOW,
    derive: ({ draft, extensions, activePlayMs, receiptOrdinal }) => {
      const outcome = deriveArc3FixedFabricationAction({
        draft, extensions, baseId, activePlayMs, receiptOrdinal, codecNow: NOW,
      });
      if (outcome.kind !== 'ready') throw new Error(outcome.detail);
      onPlan(outcome.derivation);
      return {
        state: outcome.derivation.state,
        extensionWrites: outcome.derivation.extensionWrites,
        witness: outcome.derivation.witness,
      };
    },
  });
}

describe('Arc 3 app bootstrap boundary', () => {
  it('dedupes only complete keys from current, saved, and Atlas sidecars', () => {
    const mars = surface(world(MARS));
    const inventory = buildArc3EngineeringAddressInventory({
      current: mars,
      saved: mars,
      atlas: [mars],
    });
    expect(inventory).toMatchObject({
      kind: 'ready',
      diagnostics: {
        candidates: 3,
        contributedWorlds: 3,
        contributedStars: 3,
        duplicateWorldKeys: 2,
        duplicateStarKeys: 2,
        uniqueWorlds: 1,
        uniqueStars: 1,
      },
    });
    if (inventory.kind === 'ready') {
      expect(inventory.worlds[0]!.key).toBe(world(MARS).key);
      expect(inventory.stars[0]!.key).toBe(star(SOL).key);
    }
  });

  it('classifies an owned current carrier before touching migration-only route evidence', () => {
    const save = freshSave();
    const mars = surface(world(MARS));
    const extensions = productExtensions({ save, sources: sources(mars) });
    let sourceReads = 0;
    const hostileSources = Object.defineProperties({}, {
      current: { get: () => { sourceReads++; throw new Error('migration inventory consulted'); } },
      saved: { get: () => { sourceReads++; throw new Error('migration inventory consulted'); } },
      atlas: { get: () => { sourceReads++; throw new Error('migration inventory consulted'); } },
    }) as Arc3EngineeringAddressSources;
    const outcome = prepareArc3AppBootstrap({ extensions, save, sources: hostileSources });
    expect(outcome).toMatchObject({
      kind: 'already-loaded', addressDiagnostics: null, legacyDiagnostics: null,
    });
    expect(sourceReads).toBe(0);
  });

  it('classifies future and corrupt carriers before touching migration-only route evidence', () => {
    const save = freshSave();
    let sourceReads = 0;
    const hostileSources = Object.defineProperties({}, {
      current: { get: () => { sourceReads++; throw new Error('migration inventory consulted'); } },
      saved: { get: () => { sourceReads++; throw new Error('migration inventory consulted'); } },
      atlas: { get: () => { sourceReads++; throw new Error('migration inventory consulted'); } },
    }) as Arc3EngineeringAddressSources;
    const fixtures: readonly Readonly<{
      carrier: Readonly<{ version: number; json: string }>;
      expected: Readonly<{ reason: string; detail: string }>;
    }>[] = [
      { carrier: { version: 2, json: '{}' }, expected: { reason: 'future-version', detail: 'version:2' } },
      { carrier: { version: 1, json: '{}' }, expected: { reason: 'corrupt', detail: 'carrier-corrupt' } },
    ];
    for (const fixture of fixtures) {
      const outcome = prepareArc3AppBootstrap({
        extensions: { player: { 'arc3.engineering': fixture.carrier } },
        save,
        sources: hostileSources,
      });
      expect(outcome).toMatchObject({
        kind: 'protected', ...fixture.expected,
        addressDiagnostics: null, legacyDiagnostics: null,
      });
    }
    expect(sourceReads).toBe(0);
  });

  it('stages bootstrap minedw refresh without live mutation and preserves loaded reconciliation stamps', () => {
    const mars = surface(world(MARS));
    for (const priorMined of [[[134, 1]], [[134, 4_102_444_800_000]], []] as const) {
      const save = freshSave();
      save.mineX = [[134, 1]];
      save.mined = priorMined.map(([seed, timestamp]) => [seed, timestamp]);
      const extensions = productExtensions({ save, sources: sources(mars) });
      const loaded = readArc3Engineering(extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
      if (loaded.kind !== 'loaded') throw new Error(`Arc 3 carrier was ${loaded.kind}`);
      const before = structuredClone(save);
      const staged = stageArc3BootstrapLegacyProjection({
        source: save,
        state: loaded.state,
        codecNow: NOW,
        intent: 'legacy-bootstrap',
      });
      expect(save).toEqual(before);
      expect(staged.candidate.mined).toEqual([[134, NOW]]);
      expect(staged.changed).toBe(JSON.stringify(priorMined) !== JSON.stringify([[134, NOW]]));

      const reconciled = stageArc3BootstrapLegacyProjection({
        source: save,
        state: loaded.state,
        codecNow: NOW,
        intent: 'loaded-reconciliation',
      });
      expect(reconciled.candidate.mined).toEqual(priorMined);
      expect(save).toEqual(before);
      const liveIdentity = save;
      const atlasIdentity = save.logMap;
      publishArc3LegacyCompatibilityFields(save, staged.candidate);
      expect(save).toBe(liveIdentity);
      expect(save.logMap).toBe(atlasIdentity);
      expect(save.mined).toEqual([[134, NOW]]);
    }
  });

  it('refresh-all bootstrap still holds both sides of a real same-leaf collision', () => {
    const first = world(COLLISION_WORLD_A);
    const second = world(COLLISION_WORLD_B);
    const save = freshSave();
    save.mineX = [[2525295284, 41]];
    save.mined = [[2525295284, 444]];
    const staged = stageArc3BootstrapLegacyProjection({
      source: save,
      state: engineeringStateForWorlds([
        { address: first, count: 3 },
        { address: second, count: 88 },
      ]),
      codecNow: NOW,
      intent: 'legacy-bootstrap',
    });
    expect(staged.candidate.mineX).toEqual([[2525295284, 41]]);
    expect(staged.candidate.mined).toEqual([[2525295284, 444]]);
    expect(staged.projection.diagnostics).toMatchObject([{
      disposition: 'collision-held', carriers: { mineX: 'held', mined: 'held' },
    }]);
    expect(staged.changed).toBe(false);
    expect(save.mineX).toEqual([[2525295284, 41]]);
    expect(save.mined).toEqual([[2525295284, 444]]);
  });

  it('protects only Arc 3 when a legacy seed is missing or ambiguous and retains colliding full keys', () => {
    const missingSave = freshSave();
    missingSave.mineX = [[134, 7]];
    const loot = prepareArc2LootLegacyMigration({
      extensions: {}, legacy: { items: [], equip: {}, equipAff: {} }, capacity: 8,
    });
    if (loot.kind !== 'prepared') throw new Error('Arc 2 setup failed');
    const missingBefore = JSON.stringify(missingSave);
    const missing = prepareArc3AppBootstrap({
      extensions: loot.extensions,
      save: missingSave,
      sources: sources(NAV_HOME),
    });
    expect(missing).toMatchObject({
      kind: 'protected', reason: 'legacy-refused', detail: 'legacy-seed-missing',
      legacyDiagnostics: { missingWorldSeeds: [134] },
    });
    expect(JSON.stringify(missingSave)).toBe(missingBefore);
    expect(readArc2EngineeringLoadout(loot.extensions).kind).toBe('loaded');

    const first = surface(world(COLLISION_WORLD_A));
    const second = surface(world(COLLISION_WORLD_B));
    const collisionInventory = buildArc3EngineeringAddressInventory({
      current: first, saved: null, atlas: [second],
    });
    expect(collisionInventory).toMatchObject({
      kind: 'ready',
      diagnostics: { uniqueWorlds: 2, uniqueStars: 2, duplicateWorldKeys: 0 },
    });
    if (collisionInventory.kind === 'ready') {
      expect(new Set(collisionInventory.worlds.map(({ key }) => key)).size).toBe(2);
      expect(new Set(collisionInventory.worlds.map(({ planet }) => planet.seed))).toEqual(new Set([2525295284]));
    }
    const collisionSave = freshSave();
    collisionSave.mineX = [[2525295284, 41]];
    const collision = prepareArc3AppBootstrap({
      extensions: loot.extensions,
      save: collisionSave,
      sources: { current: first, saved: null, atlas: [second] },
    });
    expect(collision).toMatchObject({
      kind: 'protected', reason: 'legacy-refused', detail: 'legacy-seed-ambiguous',
      legacyDiagnostics: { ambiguousWorldSeeds: [2525295284] },
    });
  });

  it('ignores minedw wall time as accrual authority and initializes Auto-Extractor at action active-play time', () => {
    const mars = surface(world(MARS));
    const firstSave = freshSave();
    firstSave.mineX = [[134, 1]];
    firstSave.mined = [[134, 1]];
    firstSave.items = [['autoext', 1]];
    const secondSave = structuredClone(firstSave);
    secondSave.mined = [[134, 4_102_444_800_000]];
    const firstExtensions = productExtensions({
      save: firstSave, sources: sources(mars), items: [['autoext', 1]],
    });
    const secondExtensions = productExtensions({
      save: secondSave, sources: sources(mars), items: [['autoext', 1]],
    });
    const firstCarrier = readArc3Engineering(firstExtensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    const secondCarrier = readArc3Engineering(secondExtensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    expect(firstCarrier.kind).toBe('loaded');
    expect(secondCarrier.kind).toBe('loaded');
    if (firstCarrier.kind !== 'loaded' || secondCarrier.kind !== 'loaded') return;
    expect(encodeEngineeringState(firstCarrier.state)).toBe(encodeEngineeringState(secondCarrier.state));
    expect(firstCarrier.state.worlds[0]!.autoExtractorCursor).toBeNull();

    const first = deriveArc3MineAction({
      draft: structuredClone(firstSave), extensions: firstExtensions, currentSurface: mars,
      activePlayMs: 9_000_000, receiptOrdinal: 8, codecNow: 10,
    });
    const second = deriveArc3MineAction({
      draft: structuredClone(secondSave), extensions: secondExtensions, currentSurface: mars,
      activePlayMs: 9_000_000, receiptOrdinal: 8, codecNow: 4_102_444_800_000,
    });
    expect(first.kind).toBe('ready');
    expect(second.kind).toBe('ready');
    if (first.kind !== 'ready' || second.kind !== 'ready') return;
    expect(first.derivation.result).toMatchObject({
      autoExtractor: { initialized: true, matured: 0, grantedLoads: 0 },
      loads: 1,
    });
    expect(second.derivation.result).toMatchObject({
      autoExtractor: { initialized: true, matured: 0, grantedLoads: 0 },
      loads: 1,
    });
    expect(first.derivation.witness).toBe(second.derivation.witness);
  });
});

describe('Arc 3 app action transaction seam', () => {
  it('banks one mined action tick in the same candidate even when Auto-Extractor grants many loads', () => {
    const save = freshSave();
    save.items = [['autoext', 1]];
    const mars = surface(world(MARS));
    const extensions = productExtensions({ save, sources: sources(mars), items: save.items });
    const first = deriveArc3MineAction({
      draft: structuredClone(save), extensions, currentSurface: mars,
      activePlayMs: 100, receiptOrdinal: 0, codecNow: NOW,
    });
    expect(first.kind).toBe('ready');
    if (first.kind !== 'ready') return;
    expect(first.derivation.state.ascProg).toMatchObject({ 'c1-mine': 1, 'c3-mine': 1 });
    const applied = applyV5ExtensionWrites(extensions, first.derivation.extensionWrites);
    const second = deriveArc3MineAction({
      draft: structuredClone(first.derivation.state), extensions: applied.extensions,
      currentSurface: mars, activePlayMs: 1_800_100, receiptOrdinal: 1, codecNow: NOW + 1,
    });
    expect(second.kind).toBe('ready');
    if (second.kind !== 'ready') return;
    expect((second.derivation.result as MiningResult).loads).toBeGreaterThan(1);
    expect(second.derivation.state.ascProg).toMatchObject({ 'c1-mine': 2, 'c3-mine': 2 });
  });

  it('commits research once with exact exceptional-first economy, no Charter credit, and refusal byte stability', async () => {
    const save = freshSave();
    save.cargo = [['Fe', 8], ['Si', 5]];
    save.cgx = [['Fe', 2], ['Si', 1]];
    save.essence = 20;
    save.ascProg = { 'c1-part': 3 };
    const mars = surface(world(MARS));
    const extensions = productExtensions({ save, sources: sources(mars) });
    const { backend, runtime } = await seededRuntime({ save, extensions, seed: 0xA3C3A11 });
    const beforeRng = runtime.sessionRng;
    const holder: { value: Arc3AppDerivation | null } = { value: null };
    const committed = await runtimeResearch(runtime, save, 'scan1', (plan) => { holder.value = plan; });
    expect(committed.kind).toBe('committed');
    const plan = holder.value;
    if (committed.kind !== 'committed' || plan === null) return;
    expect(plan.state).toMatchObject({
      cargo: [['Fe', 2], ['Si', 1]], cgx: [['Fe', 0], ['Si', 0]], essence: 0,
      techOwned: ['scan1'], ascProg: { 'c1-part': 3 },
    });
    expect(runtime.sessionRng).toEqual({
      seed: beforeRng.seed, ordinal: 1, draws: beforeRng.draws,
    });
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);
    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`reload was ${reloaded.kind}`);
    expect(verifyArc3CommittedResearchAction({
      extensions: reloaded.extensions,
      committed: reloaded.state,
      expectedOwnedState: plan.state,
      expectedState: plan.nextEngineeringState,
      codecNow: NOW,
      minedTimestampIntent: plan.minedTimestampIntent,
    }).kind).toBe('verified');
    const ownedMismatch = structuredClone(reloaded.state);
    ownedMismatch.cargo = [['Fe', 3], ['Si', 1]];
    expect(verifyArc3CommittedResearchAction({
      extensions: reloaded.extensions,
      committed: ownedMismatch,
      expectedOwnedState: plan.state,
      expectedState: plan.nextEngineeringState,
      codecNow: NOW,
      minedTimestampIntent: plan.minedTimestampIntent,
    })).toMatchObject({ kind: 'mismatch', detail: 'research-owned-cargo-mismatch' });

    const live = freshSave();
    const liveIdentity = live;
    const atlasIdentity = live.logMap;
    publishArc3ResearchFields(live, reloaded.state);
    expect(live).toBe(liveIdentity);
    expect(live.logMap).toBe(atlasIdentity);
    expect(live).toMatchObject({
      cargo: [['Fe', 2], ['Si', 1]], cgx: [['Fe', 0], ['Si', 0]],
      essence: 0, techOwned: ['scan1'],
    });
    const beforeRefusal = JSON.stringify(reloaded);
    const replay = await runtimeResearch(runtime, committed.state, 'scan1');
    expect(replay).toMatchObject({ kind: 'rejected', stage: 'derive' });
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);
    const afterRefusal = await readSaveV5(backend, REGISTRY, NOW);
    expect(JSON.stringify(afterRefusal)).toBe(beforeRefusal);
    expect(plan.state.ascProg).toEqual({ 'c1-part': 3 });
  });

  it('lands one dual-carrier fixed craft under one CAS/receipt and verifies every owned projection', async () => {
    const save = freshSave();
    save.cargo = [['Fe', 10]];
    save.cgx = [['Fe', 2]];
    const mars = surface(world(MARS));
    const extensions = productExtensions({ save, sources: sources(mars) });
    const relabelControl = deriveArc3FixedFabricationAction({
      draft: structuredClone(save), extensions, baseId: 'plate',
      /* Hostile presentation metadata is deliberately outside the authority
         type and ignored; the canonical catalogue still owns `part`. */
      category: 'gear',
      activePlayMs: 0, receiptOrdinal: 0, codecNow: NOW,
    } as Parameters<typeof deriveArc3FixedFabricationAction>[0] & { category: 'gear' });
    expect(relabelControl.kind).toBe('ready');
    if (relabelControl.kind === 'ready') {
      expect(relabelControl.derivation.state.ascProg).toMatchObject({ 'c1-part': 1 });
      expect(relabelControl.derivation.state.ascProg['c3-gear']).toBeUndefined();
    }
    const { backend, runtime } = await seededRuntime({ save, extensions, seed: 0xA3C3FAB });
    const beforeRng = runtime.sessionRng;
    const holder: { value: Arc3AppDerivation | null } = { value: null };
    const parentRevision = runtime.revision;
    const [winner, stale] = await Promise.all([
      runtimeFixedFabrication(runtime, save, 'plate', (plan) => { holder.value = plan; }),
      runtimeFixedFabrication(runtime, save, 'plate'),
    ]);
    expect(winner.kind).toBe('committed');
    expect(stale).toMatchObject({ kind: 'stale', expectedRevision: parentRevision });
    const plan = holder.value;
    if (winner.kind !== 'committed' || plan === null || plan.nextArc2State === null) return;
    expect(plan.extensionWrites).toHaveLength(2);
    expect(plan.state).toMatchObject({
      cargo: [['Fe', 6]], cgx: [['Fe', 0]], items: [['plate', 1]],
      ascProg: { 'c1-part': 1 },
    });
    expect(plan.state.stats.crafts).toBe(1);
    expect(runtime.sessionRng).toEqual({
      seed: beforeRng.seed, ordinal: 1, draws: beforeRng.draws,
    });
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);
    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`reload was ${reloaded.kind}`);
    expect(readArc2Loot(reloaded.extensions)).toMatchObject({
      kind: 'loaded', state: { kind: 'inventory', stackableCounts: [{ baseId: 'plate', count: 1 }] },
    });
    const verified = verifyArc3CommittedFixedFabricationAction({
      extensions: reloaded.extensions,
      committed: reloaded.state,
      expectedOwnedState: plan.state,
      expectedEngineeringState: plan.nextEngineeringState,
      expectedArc2State: plan.nextArc2State,
      codecNow: NOW,
      minedTimestampIntent: plan.minedTimestampIntent,
    });
    expect(verified.kind).toBe('verified');
    const cargoMismatch = structuredClone(reloaded.state);
    cargoMismatch.cargo = [['Fe', 7]];
    expect(verifyArc3CommittedFixedFabricationAction({
      extensions: reloaded.extensions, committed: cargoMismatch,
      expectedOwnedState: plan.state, expectedEngineeringState: plan.nextEngineeringState,
      expectedArc2State: plan.nextArc2State, codecNow: NOW,
      minedTimestampIntent: plan.minedTimestampIntent,
    })).toMatchObject({ kind: 'mismatch', detail: 'fixed-owned-cargo-mismatch' });
    const mirrorMismatch = structuredClone(reloaded.state);
    mirrorMismatch.items = [];
    expect(verifyArc3CommittedFixedFabricationAction({
      extensions: reloaded.extensions, committed: mirrorMismatch,
      expectedOwnedState: plan.state, expectedEngineeringState: plan.nextEngineeringState,
      expectedArc2State: plan.nextArc2State, codecNow: NOW,
      minedTimestampIntent: plan.minedTimestampIntent,
    })).toMatchObject({ kind: 'mismatch', detail: 'arc2-carrier-legacy-projection-mismatch' });

    const live = freshSave();
    const liveIdentity = live;
    const atlasIdentity = live.logMap;
    publishArc3FixedFabricationFields(live, reloaded.state);
    expect(live).toBe(liveIdentity);
    expect(live.logMap).toBe(atlasIdentity);
    expect(live).toMatchObject({ items: [['plate', 1]], ascProg: { 'c1-part': 1 } });
  });

  it('anchors a newly fabricated Auto-Extractor to active play and refreshes its v4 timestamps', async () => {
    const save = freshSave();
    save.mineX = [[134, 1]];
    save.mined = [[134, 444]];
    save.items = [['cell', 1], ['navcore', 1], ['servo', 2]];
    save.essence = 40;
    const mars = surface(world(MARS));
    const extensions = productExtensions({ save, sources: sources(mars), items: save.items });
    const { backend, runtime, time } = await seededRuntime({ save, extensions, seed: 0xA3C3A070 });
    time.advance(12_345);
    const holder: { value: Arc3AppDerivation | null } = { value: null };
    const committed = await runtimeFixedFabrication(
      runtime,
      save,
      'autoext',
      (plan) => { holder.value = plan; },
    );
    expect(committed.kind).toBe('committed');
    const plan = holder.value;
    if (committed.kind !== 'committed' || plan === null || plan.nextArc2State === null) return;
    expect(plan.minedTimestampIntent).toEqual({ kind: 'refresh-all' });
    expect(plan.result).toMatchObject({
      baseId: 'autoext', arc2: { autoExtractorReanchoredWorlds: 1 },
    });
    expect(plan.arc2Settlement).toMatchObject({ outputLocation: 'system' });
    expect(plan.nextEngineeringState.worlds[0]!.autoExtractorCursor).toEqual({
      schema: 'cf-v2-recurring-accrual-cursor/v1', collectedThroughActivePlayMs: 12_345,
    });
    expect(plan.state).toMatchObject({
      mineX: [[134, 1]], mined: [[134, NOW]], items: [['autoext', 1]], essence: 0,
    });
    expect(plan.state.stats.crafts).toBe(1);
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);

    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`reload was ${reloaded.kind}`);
    const engineering = readArc3Engineering(reloaded.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    if (engineering.kind !== 'loaded') throw new Error(`carrier was ${engineering.kind}`);
    expect(engineering.state.worlds[0]!.autoExtractorCursor).toEqual({
      schema: 'cf-v2-recurring-accrual-cursor/v1', collectedThroughActivePlayMs: 12_345,
    });
    expect(reloaded.state.mined).toEqual([[134, NOW]]);
    expect(verifyArc3CommittedFixedFabricationAction({
      extensions: reloaded.extensions,
      committed: reloaded.state,
      expectedOwnedState: plan.state,
      expectedEngineeringState: plan.nextEngineeringState,
      expectedArc2State: plan.nextArc2State,
      codecNow: NOW,
      minedTimestampIntent: plan.minedTimestampIntent,
    }).kind).toBe('verified');
  });

  it('refresh-all Auto-Extractor fabrication preserves ambiguous v4 collision rows', () => {
    const first = world(COLLISION_WORLD_A);
    const second = world(COLLISION_WORLD_B);
    const save = freshSave();
    save.mineX = [[2525295284, 41]];
    save.mined = [[2525295284, 444]];
    save.items = [['cell', 1], ['navcore', 1], ['servo', 2]];
    save.essence = 40;
    const carrierSeed = structuredClone(save);
    carrierSeed.mineX = [];
    carrierSeed.mined = [];
    const baseExtensions = productExtensions({
      save: carrierSeed, sources: sources(surface(world(MARS))), items: carrierSeed.items,
    });
    const extensions = withEngineeringState(baseExtensions, engineeringStateForWorlds([
      { address: first, count: 3 },
      { address: second, count: 88 },
    ]));
    const outcome = deriveArc3FixedFabricationAction({
      draft: save, extensions, baseId: 'autoext',
      activePlayMs: 91_337, receiptOrdinal: 4, codecNow: NOW,
    });
    expect(outcome.kind).toBe('ready');
    if (outcome.kind !== 'ready') return;
    expect(outcome.derivation.minedTimestampIntent).toEqual({ kind: 'refresh-all' });
    expect(outcome.derivation.result).toMatchObject({
      baseId: 'autoext', arc2: { autoExtractorReanchoredWorlds: 2 },
    });
    expect(outcome.derivation.nextEngineeringState.worlds).toMatchObject([
      { autoExtractorCursor: {
        schema: 'cf-v2-recurring-accrual-cursor/v1', collectedThroughActivePlayMs: 91_337,
      } },
      { autoExtractorCursor: {
        schema: 'cf-v2-recurring-accrual-cursor/v1', collectedThroughActivePlayMs: 91_337,
      } },
    ]);
    expect(outcome.derivation.state.mineX).toEqual([[2525295284, 41]]);
    expect(outcome.derivation.state.mined).toEqual([[2525295284, 444]]);
    expect(outcome.derivation.projection.diagnostics).toMatchObject([{
      disposition: 'collision-held', carriers: { mineX: 'held', mined: 'held' },
    }]);
  });

  it('mirrors pending gear, banks it as non-relic gear, and fails closed on Signature/protected carriers', () => {
    const mars = surface(world(MARS));
    const pendingSave = freshSave();
    pendingSave.cargo = [['Ni', 2], ['C', 1]];
    pendingSave.items = [['fieldsuit', 1]];
    const pendingExtensions = productExtensions({
      save: pendingSave, sources: sources(mars), items: pendingSave.items, capacity: 1,
    });
    const pendingDraft = structuredClone(pendingSave);
    const pending = deriveArc3FixedFabricationAction({
      draft: pendingDraft, extensions: pendingExtensions, baseId: 'meteor',
      activePlayMs: 0, receiptOrdinal: 4, codecNow: NOW,
    });
    expect(pending.kind).toBe('ready');
    if (pending.kind === 'ready') {
      expect(pending.derivation.arc2Settlement).toMatchObject({ outputLocation: 'pending' });
      expect(pending.derivation.state.items).toEqual([['fieldsuit', 1], ['meteor', 1]]);
      expect(pending.derivation.state.equip).toEqual({});
      expect(pending.derivation.state.ascProg).toMatchObject({ 'c3-gear': 1 });
    }

    const relicSave = freshSave();
    relicSave.cargo = [['Fe', 8], ['W', 4], ['Nd', 1]];
    relicSave.items = [['hullseg', 1]];
    const relicExtensions = productExtensions({
      save: relicSave, sources: sources(mars), items: relicSave.items,
    });
    const relicDraft = structuredClone(relicSave);
    const relicBefore = JSON.stringify(relicDraft);
    expect(deriveArc3FixedFabricationAction({
      draft: relicDraft, extensions: relicExtensions, baseId: 'rl-stone',
      activePlayMs: 0, receiptOrdinal: 0, codecNow: NOW,
    })).toMatchObject({ kind: 'refused', detail: 'fabrication-signature-missing' });
    expect(JSON.stringify(relicDraft)).toBe(relicBefore);

    const signedRelicDraft = structuredClone(relicSave);
    signedRelicDraft.primeFill.stone = {
      title: 'Stone Signature', sub: 'verified fixture', tier: 0,
      hex: '#c9a878', where: null,
    };
    const signedRelic = deriveArc3FixedFabricationAction({
      draft: signedRelicDraft, extensions: relicExtensions, baseId: 'rl-stone',
      activePlayMs: 0, receiptOrdinal: 0, codecNow: NOW,
    });
    expect(signedRelic.kind).toBe('ready');
    if (signedRelic.kind === 'ready') {
      expect(signedRelic.derivation.arc2Settlement).toMatchObject({
        baseId: 'rl-stone', outputLocation: 'equipped',
        preservedGates: { prerequisiteId: null, signatureId: 'stone' },
      });
      expect(signedRelic.derivation.state.items).toEqual([['rl-stone', 1]]);
      expect(signedRelic.derivation.state.equip).toMatchObject({ suit: 'rl-stone' });
      expect(signedRelic.derivation.state.primeFill.stone).toEqual(
        signedRelicDraft.primeFill.stone,
      );
      expect(signedRelic.derivation.state.ascProg['c3-gear']).toBeUndefined();
    }

    const protectedCarriers = [
      { segment: 'player', namespace: 'arc3.engineering', carrier: { version: 99, json: '{}' } },
      { segment: 'player', namespace: 'arc3.engineering', carrier: { version: 1, json: '{}' } },
      { segment: 'inventory', namespace: 'arc2.loot', carrier: { version: 99, json: '{}' } },
      { segment: 'inventory', namespace: 'arc2.loot', carrier: { version: 1, json: '{}' } },
    ] as const;
    for (const fixture of protectedCarriers) {
      const protectedExtensions = structuredClone(relicExtensions) as unknown as
        Record<string, Record<string, { version: number; json: string }>>;
      protectedExtensions[fixture.segment]![fixture.namespace] = fixture.carrier;
      const draft = structuredClone(relicSave);
      const before = JSON.stringify(draft);
      expect(deriveArc3ResearchAction({
        draft, extensions: protectedExtensions as V5Extensions,
        researchId: 'scan1', receiptOrdinal: 0, codecNow: NOW,
      })).toMatchObject({ kind: 'refused' });
      expect(JSON.stringify(draft)).toBe(before);
    }
  });

  it('refuses divergent Arc 2 legacy mirrors before skim, research, or fixed planning writes', () => {
    const remnant = system(star(REMNANT_STAR));
    const skimSave = freshSave();
    skimSave.items = [['jumpdrive', 1]];
    const skimExtensions = productExtensions({
      save: skimSave, sources: sources(remnant), items: skimSave.items,
    });
    const skimDraft = structuredClone(skimSave);
    skimDraft.items = [];
    const skimDraftBefore = JSON.stringify(skimDraft);
    const skimExtensionsBefore = JSON.stringify(skimExtensions);
    expect(deriveArc3SkimAction({
      draft: skimDraft, extensions: skimExtensions, currentSystem: remnant,
      activePlayMs: 0, receiptOrdinal: 0, codecNow: NOW,
    })).toEqual({ kind: 'refused', detail: 'arc2-loadout-legacy-mirror-mismatch' });
    expect(JSON.stringify(skimDraft)).toBe(skimDraftBefore);
    expect(JSON.stringify(skimExtensions)).toBe(skimExtensionsBefore);

    const authoritySave = freshSave();
    authoritySave.cargo = [['Fe', 8], ['Si', 5]];
    authoritySave.cgx = [['Fe', 2], ['Si', 1]];
    authoritySave.essence = 20;
    const mars = surface(world(MARS));
    const authorityExtensions = productExtensions({ save: authoritySave, sources: sources(mars) });
    const researchDraft = structuredClone(authoritySave);
    researchDraft.items = [['plate', 1]];
    const researchDraftBefore = JSON.stringify(researchDraft);
    const researchExtensionsBefore = JSON.stringify(authorityExtensions);
    expect(deriveArc3ResearchAction({
      draft: researchDraft, extensions: authorityExtensions,
      researchId: 'scan1', receiptOrdinal: 0, codecNow: NOW,
    })).toEqual({ kind: 'refused', detail: 'arc2-loadout-legacy-mirror-mismatch' });
    expect(JSON.stringify(researchDraft)).toBe(researchDraftBefore);
    expect(JSON.stringify(authorityExtensions)).toBe(researchExtensionsBefore);

    const fixedDraft = structuredClone(authoritySave);
    fixedDraft.items = [['plate', 1]];
    const fixedDraftBefore = JSON.stringify(fixedDraft);
    expect(deriveArc3FixedFabricationAction({
      draft: fixedDraft, extensions: authorityExtensions, baseId: 'plate',
      activePlayMs: 0, receiptOrdinal: 0, codecNow: NOW,
    })).toEqual({ kind: 'refused', detail: 'arc2-loadout-legacy-mirror-mismatch' });
    expect(JSON.stringify(fixedDraft)).toBe(fixedDraftBefore);
    expect(JSON.stringify(authorityExtensions)).toBe(researchExtensionsBefore);
  });

  it('refuses divergent Arc 3 legacy mirrors before every action plan and preserves all bytes', () => {
    const mars = surface(world(MARS));
    const remnant = system(star(REMNANT_STAR));

    const mineSave = freshSave();
    const mineExtensions = productExtensions({ save: mineSave, sources: sources(mars) });
    const mineDraft = structuredClone(mineSave);
    mineDraft.mineX = [[134, 1]];
    const mineBefore = JSON.stringify(mineDraft);
    const mineExtensionsBefore = JSON.stringify(mineExtensions);
    expect(deriveArc3MineAction({
      draft: mineDraft, extensions: mineExtensions, currentSurface: mars,
      activePlayMs: 0, receiptOrdinal: 0, codecNow: NOW,
    })).toEqual({ kind: 'refused', detail: 'arc3-carrier-legacy-projection-mismatch' });
    expect(JSON.stringify(mineDraft)).toBe(mineBefore);
    expect(JSON.stringify(mineExtensions)).toBe(mineExtensionsBefore);

    const skimSave = freshSave();
    skimSave.items = [['jumpdrive', 1]];
    const skimExtensions = productExtensions({
      save: skimSave, sources: sources(remnant), items: skimSave.items,
    });
    const skimDraft = structuredClone(skimSave);
    skimDraft.skimX = [[REMNANT_STAR.star.seed, 1]];
    const skimBefore = JSON.stringify(skimDraft);
    const skimExtensionsBefore = JSON.stringify(skimExtensions);
    expect(deriveArc3SkimAction({
      draft: skimDraft, extensions: skimExtensions, currentSystem: remnant,
      activePlayMs: 0, receiptOrdinal: 0, codecNow: NOW,
    })).toEqual({ kind: 'refused', detail: 'arc3-carrier-legacy-projection-mismatch' });
    expect(JSON.stringify(skimDraft)).toBe(skimBefore);
    expect(JSON.stringify(skimExtensions)).toBe(skimExtensionsBefore);

    const researchSave = freshSave();
    researchSave.cargo = [['Fe', 6], ['Si', 4]];
    researchSave.essence = 20;
    const researchExtensions = productExtensions({ save: researchSave, sources: sources(mars) });
    const researchDraft = structuredClone(researchSave);
    researchDraft.techOwned = ['scan1'];
    const researchBefore = JSON.stringify(researchDraft);
    const researchExtensionsBefore = JSON.stringify(researchExtensions);
    expect(deriveArc3ResearchAction({
      draft: researchDraft, extensions: researchExtensions,
      researchId: 'scan1', receiptOrdinal: 0, codecNow: NOW,
    })).toEqual({ kind: 'refused', detail: 'arc3-carrier-legacy-projection-mismatch' });
    expect(JSON.stringify(researchDraft)).toBe(researchBefore);
    expect(JSON.stringify(researchExtensions)).toBe(researchExtensionsBefore);

    const fixedSave = freshSave();
    fixedSave.cargo = [['Fe', 4]];
    const fixedExtensions = productExtensions({ save: fixedSave, sources: sources(mars) });
    const fixedDraft = structuredClone(fixedSave);
    fixedDraft.mined = [[134, NOW - 1]];
    const fixedBefore = JSON.stringify(fixedDraft);
    const fixedExtensionsBefore = JSON.stringify(fixedExtensions);
    expect(deriveArc3FixedFabricationAction({
      draft: fixedDraft, extensions: fixedExtensions, baseId: 'plate',
      activePlayMs: 0, receiptOrdinal: 0, codecNow: NOW,
    })).toEqual({ kind: 'refused', detail: 'arc3-carrier-legacy-projection-mismatch' });
    expect(JSON.stringify(fixedDraft)).toBe(fixedBefore);
    expect(JSON.stringify(fixedExtensions)).toBe(fixedExtensionsBefore);
  });

  it('commits one exact mine, reloads carrier/v4 parity, and preserves seed/draws with the exact receipt ordinal', async () => {
    const save = freshSave();
    const mars = surface(world(MARS));
    const extensions = productExtensions({ save, sources: sources(mars) });
    const { backend, repository, runtime, time } = await seededRuntime({
      save, extensions, seed: 0xA3C3F400,
    });
    const beforeRng = runtime.sessionRng;
    time.advance(12_345);
    const planHolder: { value: Arc3AppDerivation | null } = { value: null };
    const committed = await runtimeMine(runtime, save, mars, NOW, (value) => { planHolder.value = value; });
    expect(committed.kind).toBe('committed');
    const plan = planHolder.value;
    if (committed.kind !== 'committed' || plan === null) return;
    const result = plan.result as MiningResult;
    expect(result).toMatchObject({ sourceKey: world(MARS).key, loads: 1, firstMine: true });
    expect(plan.receiptOrdinal).toBe(0);
    expect(committed.plan).toMatchObject({
      operation: 'arc3.mine-world', receiptOrdinal: 0,
      currentAuthority: { activePlayMs: 0, sessionRng: beforeRng },
    });
    expect(committed.receipt).toEqual({
      ordinal: 0, kind: 'arc3-mine-world', witness: plan.witness,
    });
    expect(JSON.parse(plan.witness)).toMatchObject({
      operation: 'mine-world', receiptOrdinal: 0, activePlayMs: 12_345,
    });
    expect(runtime.sessionRng).toEqual({
      seed: beforeRng.seed, ordinal: 1, draws: beforeRng.draws,
    });
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);
    expect((await repository.readReceipt(0))?.witness).toBe(plan.witness);

    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind !== 'loaded') return;
    expect(readF4Authority(reloaded.extensions)).toMatchObject({
      kind: 'loaded', authority: { activePlayMs: 12_345 },
    });
    const carrier = readArc3Engineering(reloaded.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    expect(carrier.kind).toBe('loaded');
    if (carrier.kind !== 'loaded') return;
    expect(carrier.state.worlds).toMatchObject([{
      key: world(MARS).key, extractionsTaken: 1,
      autoExtractorCursor: null,
    }]);
    expect(reloaded.state.mineX).toEqual([[134, 1]]);
    expect(reloaded.state.mined).toEqual([[134, NOW]]);
    expect(reloaded.state.stats.mines).toBe(1);
    const verification = verifyArc3CommittedAction({
      extensions: reloaded.extensions,
      committed: reloaded.state,
      expectedState: plan.nextEngineeringState,
      codecNow: NOW,
      minedTimestampIntent: plan.minedTimestampIntent,
    });
    expect(verification.kind).toBe('verified');

    const live = freshSave();
    const liveIdentity = live;
    const atlasIdentity = live.logMap;
    publishArc3MiningFields(live, reloaded.state);
    expect(live).toBe(liveIdentity);
    expect(live.logMap).toBe(atlasIdentity);
    expect(live.mineX).toEqual([[134, 1]]);
  });

  it('binds Auto-Extractor initialization to the transaction-owned active-play snapshot, not wall or caller time', async () => {
    const save = freshSave();
    save.mineX = [[134, 1]];
    save.mined = [[134, 4_102_444_800_000]];
    save.items = [['autoext', 1]];
    const mars = surface(world(MARS));
    const extensions = productExtensions({
      save, sources: sources(mars), items: [['autoext', 1]],
    });
    const forgedActivePlayMs = 9_000_000;
    const negativeControl = deriveArc3MineAction({
      draft: structuredClone(save), extensions, currentSurface: mars,
      activePlayMs: forgedActivePlayMs, receiptOrdinal: 0, codecNow: 4_102_444_800_000,
    });
    expect(negativeControl.kind).toBe('ready');
    if (negativeControl.kind === 'ready') {
      expect(negativeControl.derivation.nextEngineeringState.worlds[0]!.autoExtractorCursor)
        .toEqual({ schema: 'cf-v2-recurring-accrual-cursor/v1', collectedThroughActivePlayMs: forgedActivePlayMs });
    }

    const { backend, runtime, time } = await seededRuntime({ save, extensions });
    time.advance(12_345);
    const planHolder: { value: Arc3AppDerivation | null } = { value: null };
    const committed = await runtimeMine(
      runtime,
      save,
      mars,
      4_102_444_800_000,
      (value) => { planHolder.value = value; },
    );
    expect(committed.kind).toBe('committed');
    const plan = planHolder.value;
    if (committed.kind !== 'committed' || plan === null) return;
    expect((plan.result as MiningResult).autoExtractor).toMatchObject({
      initialized: true, priorCollectedThroughActivePlayMs: null,
      nextCollectedThroughActivePlayMs: 12_345, matured: 0, grantedLoads: 0,
    });
    expect(plan.nextEngineeringState.worlds[0]!.autoExtractorCursor).toEqual({
      schema: 'cf-v2-recurring-accrual-cursor/v1', collectedThroughActivePlayMs: 12_345,
    });
    expect(JSON.parse(plan.witness)).toMatchObject({ activePlayMs: 12_345 });
    expect(plan.witness).not.toContain(String(forgedActivePlayMs));
    expect(plan.witness).not.toContain('4102444800000');

    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`reload was ${reloaded.kind}`);
    expect(readF4Authority(reloaded.extensions)).toMatchObject({
      kind: 'loaded', authority: { activePlayMs: 12_345 },
    });
    const engineering = readArc3Engineering(reloaded.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    if (engineering.kind !== 'loaded') throw new Error(`carrier was ${engineering.kind}`);
    expect(engineering.state.worlds[0]!.autoExtractorCursor).toEqual({
      schema: 'cf-v2-recurring-accrual-cursor/v1', collectedThroughActivePlayMs: 12_345,
    });
  });

  it('refuses cargo overflow before receipt, progress, or live mutation', async () => {
    const save = freshSave();
    save.cargo = REGISTRY.materials.map((id) => [id, 1_000_000]);
    const before = structuredClone(save);
    const mars = surface(world(MARS));
    const extensions = productExtensions({ save, sources: sources(mars) });
    const { backend, runtime } = await seededRuntime({ save, extensions });
    const beforeCarrier = readArc3Engineering(runtime.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    const outcome = await runtimeMine(runtime, save, mars);
    expect(outcome).toMatchObject({ kind: 'rejected', stage: 'derive' });
    expect((outcome as { message?: string }).message).toMatch(/cargo total/);
    expect(runtime.sessionRng).toMatchObject({ ordinal: 0, draws: {} });
    expect(await backend.keys('receipts')).toEqual([]);
    expect(readArc3Engineering(runtime.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER)).toEqual(beforeCarrier);
    expect(save).toEqual(before);
  });

  it('refuses remnant cargo overflow before applying HP damage', () => {
    const save = freshSave();
    save.hp = 5;
    save.cargo = [['Crn', 1_000_000]];
    save.items = [['jumpdrive', 1]];
    const remnant = system(star(REMNANT_STAR));
    const extensions = productExtensions({
      save, sources: sources(remnant), items: [['jumpdrive', 1]],
    });
    const draft = structuredClone(save);
    const before = structuredClone(draft);
    const outcome = deriveArc3SkimAction({
      draft,
      extensions,
      currentSystem: remnant,
      activePlayMs: 8_000,
      receiptOrdinal: 0,
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({ kind: 'refused' });
    if (outcome.kind === 'refused') expect(outcome.detail).toMatch(/cargo total Crn/);
    expect(draft).toEqual(before);
    expect(draft.hp).toBe(5);

    const room = structuredClone(save);
    room.cargo = [['Crn', 999_999]];
    const planned = deriveArc3SkimAction({
      draft: room,
      extensions,
      currentSystem: remnant,
      activePlayMs: 8_000,
      receiptOrdinal: 0,
      codecNow: NOW,
    });
    expect(planned.kind).toBe('ready');
    if (planned.kind === 'ready') {
      expect(planned.derivation.result as StellarSkimResult).toMatchObject({
        material: 'Crn', damage: 3, priorHp: 5, nextHp: 2,
      });
      expect(planned.derivation.state.hp).toBe(2);
      expect(planned.derivation.state.cargo).toEqual([['Crn', 1_000_000]]);
      expect(planned.derivation.state.skimX).toEqual([[3363971653, 1]]);
      expect(planned.derivation.state.stats).toMatchObject({ skims: 1, cosmics: 1 });
      expect(planned.derivation.extensionWrites).toHaveLength(1);
    }
  });

  it('binds two submitted mines to one parent: one receipt commits and the other is terminal stale', async () => {
    const save = freshSave();
    const mars = surface(world(MARS));
    const extensions = productExtensions({ save, sources: sources(mars) });
    const { backend, runtime } = await seededRuntime({ save, extensions, seed: 0xA3C3DB1E });
    const parentRevision = runtime.revision;
    const first = runtimeMine(runtime, save, mars);
    const second = runtimeMine(runtime, save, mars);
    const [winner, loser] = await Promise.all([first, second]);
    expect(winner.kind).toBe('committed');
    expect(loser).toMatchObject({
      kind: 'stale', expectedRevision: parentRevision, actualRevision: parentRevision + 1,
      plan: { operation: 'arc3.mine-world', receiptOrdinal: 0 },
    });
    expect(runtime.diagnostics()).toMatchObject({
      revision: parentRevision + 1, staleBlocked: true, leaseOwned: false,
      sessionOrdinal: 1, sessionDraws: {},
    });
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);
    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`reload was ${reloaded.kind}`);
    const carrier = readArc3Engineering(reloaded.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    if (carrier.kind !== 'loaded') throw new Error(`carrier was ${carrier.kind}`);
    expect(carrier.state.worlds[0]!.extractionsTaken).toBe(1);
    expect(reloaded.state.stats.mines).toBe(1);
  });

  it('treats durability as terminal when publication fails and converges from reload without retry', async () => {
    const save = freshSave();
    const mars = surface(world(MARS));
    const extensions = productExtensions({ save, sources: sources(mars) });
    const { backend, runtime } = await seededRuntime({ save, extensions });
    let deriveCalls = 0;
    const committed = await runtimeMine(runtime, save, mars, NOW, () => { deriveCalls++; });
    expect(committed.kind).toBe('committed');
    expect(deriveCalls).toBe(1);
    /* Simulate the app's injected post-durable publication failure by leaving
       the live object untouched. The only legal recovery is the stored row. */
    expect(save.mineX).toEqual([]);
    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`reload was ${reloaded.kind}`);
    expect(reloaded.state.mineX).toEqual([[134, 1]]);
    expect(reloaded.state.stats.mines).toBe(1);
    expect(await backend.keys('receipts')).toEqual(['receipt:0']);
    expect(deriveCalls).toBe(1);
  });
});

describe('Arc 3 app bootstrap wiring contract', () => {
  it('keeps first render read-only and couples only an explicit durable route repair', () => {
    const source = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
    const assess = (candidate: string): string[] => {
      const errors: string[] = [];
      const ensureStart = candidate.indexOf('async function ensureBootAuthorityCommit(');
      const ensureEnd = candidate.indexOf('\nfunction f4RuntimeMayMutate(', ensureStart);
      if (ensureStart < 0 || ensureEnd <= ensureStart) return ['boot-helper'];
      const ensure = candidate.slice(ensureStart, ensureEnd);
      if ((ensure.match(/runtime\.commit\(/g) ?? []).length !== 1) errors.push('single-commit');
      if (!ensure.slice(0, ensure.indexOf('const seeded = await runtime.commit(')).includes(
        '!f4SeedBootstrapPending && !bootRouteRepairPending',
      )) errors.push('pending-entry');
      const durable = ensure.indexOf('durable = true;');
      const successfulRouteClear = ensure.indexOf('bootRouteRepairPending = false;');
      if (durable < 0 || successfulRouteClear <= durable) errors.push('durability-order');
      const refusal = ensure.slice(ensure.indexOf('/* Any pre-durable bootstrap refusal'));
      if (!refusal.includes('bootRouteRepairPending = false;')) errors.push('terminal-cleanup');

      const mayMutate = candidate.slice(
        candidate.indexOf('function f4RuntimeMayMutate('),
        candidate.indexOf('\nfunction f4RuntimeMayAnswer(', candidate.indexOf('function f4RuntimeMayMutate(')),
      );
      if (!mayMutate.includes('f4SeedBootstrapPending || bootRouteRepairPending')) {
        errors.push('mutation-hold');
      }
      if ((candidate.match(/ensureBootAuthorityCommit\(runtime\)/g) ?? []).length !== 3) {
        errors.push('lifecycle-entrypoints');
      }

      const loadStart = candidate.indexOf('async function loadSave(');
      const loadEnd = candidate.indexOf('\n/* ---- boot ---- */', loadStart);
      const load = candidate.slice(loadStart, loadEnd);
      const durableProjection = load.indexOf(
        'const durableBootRouteProjection = bootRouteProjection(save);',
      );
      const savedRouteResolution = load.indexOf('const savedRoute = resolveViewToNav(');
      const routeClassifier = load.indexOf('const bootRouteRepair = classifyBootRouteRepair({');
      const routeIntent = load.indexOf('bootRouteRepairPending = bootRouteRepair.pending;');
      const arc2Bootstrap = load.indexOf('/* Arc 2 owns an independently versioned Inventory carrier.');
      if (!(durableProjection >= 0 && savedRouteResolution > durableProjection
        && routeClassifier > savedRouteResolution && routeIntent > routeClassifier && arc2Bootstrap > routeIntent)) {
        errors.push('route-intent-order');
      }
      const routeClassifierSource = load.slice(routeClassifier, routeIntent);
      for (const guard of [
        'persistenceHeld: persistHold !== false', 'savedRouteWriteHeld',
        'trainingCheckpointWriteHeld', 'trainingBootRouteBlocked',
        'trainingBootRuntimeOnlySeat',
      ]) {
        if (!routeClassifierSource.includes(guard)) errors.push('route-intent-guards');
      }
      const heldRestore = load.slice(routeIntent, arc2Bootstrap);
      if (!heldRestore.includes('if (bootRouteRepair.changed && !bootRouteRepair.pending)')
        || !heldRestore.includes('save.savedView = durableBootSavedView;')
        || !heldRestore.includes('for (const { entry, where } of durableBootAtlasRoutes) entry.where = where;')) {
        errors.push('held-route-restore');
      }

      const bootRenderStart = candidate.indexOf("emitBootPhase('save-load-start');");
      const bootRenderEnd = candidate.indexOf("emitBootPhase('scene-rendered');", bootRenderStart);
      const bootRender = candidate.slice(bootRenderStart, bootRenderEnd);
      if (!bootRender.includes('await loadSave();')
        || !bootRender.includes('rerender({ skipPersist: true });')
        || bootRender.includes('skipPersist: trainingBootRuntimeOnlySeat')) {
        errors.push('initial-render-write');
      }
      if (!candidate.includes('seedBootstrapPending: f4SeedBootstrapPending,\n          bootRouteRepairPending,')) {
        errors.push('diagnostics');
      }
      return [...new Set(errors)];
    };

    expect(assess(source)).toEqual([]);
    const controls = [
      {
        expected: 'initial-render-write',
        mutant: source.replace('rerender({ skipPersist: true });\n  trainingBootRuntimeOnlySeat = false;',
          'rerender({ skipPersist: trainingBootRuntimeOnlySeat });\n  trainingBootRuntimeOnlySeat = false;'),
      },
      {
        expected: 'route-intent-guards',
        mutant: source.replace('      savedRouteWriteHeld,\n', ''),
      },
      {
        expected: 'held-route-restore',
        mutant: source.replace('    save.savedView = durableBootSavedView;\n', ''),
      },
      {
        expected: 'pending-entry',
        mutant: source.replace('if (!f4SeedBootstrapPending && !bootRouteRepairPending\n',
          'if (!f4SeedBootstrapPending\n'),
      },
      {
        expected: 'durability-order',
        mutant: source.replace('      durable = true;\n      if (engineeringBootstrapWasPending)',
          '      bootRouteRepairPending = false;\n      durable = true;\n      if (engineeringBootstrapWasPending)'),
      },
      {
        expected: 'diagnostics',
        mutant: source.replace('          bootRouteRepairPending,\n          productBootstrapPending:',
          '          productBootstrapPending:'),
      },
    ];
    for (const control of controls) {
      expect(control.mutant, control.expected).not.toBe(source);
      expect(assess(control.mutant), control.expected).toContain(control.expected);
    }
  });

  it('terminally quiesces a hidden-first bootstrap refusal with only one write site', () => {
    const source = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
    const ensureStart = source.indexOf('async function ensureBootAuthorityCommit(');
    const ensureEnd = source.indexOf('\nfunction f4RuntimeMayMutate(', ensureStart);
    expect(ensureStart).toBeGreaterThanOrEqual(0);
    expect(ensureEnd).toBeGreaterThan(ensureStart);
    const ensure = source.slice(ensureStart, ensureEnd);

    /* There is one write site. Arc 3 and Arc 4 live publication are reachable
       only after that write reports committed; a rejection cannot publish the
       shared detached candidate or leave a pending bit for a visibility retry. */
    expect(ensure.match(/runtime\.commit\(/g) ?? []).toHaveLength(1);
    const durableEdge = ensure.indexOf('durable = true;');
    const publication = ensure.indexOf('publishArc3LegacyCompatibilityFields(');
    const ownershipPublication = ensure.indexOf('publishArc4LegacyCompatibilityFields(');
    expect(durableEdge).toBeGreaterThanOrEqual(0);
    expect(publication).toBeGreaterThan(durableEdge);
    expect(ownershipPublication).toBeGreaterThan(durableEdge);
    const refusal = ensure.slice(ensure.indexOf('/* Any pre-durable bootstrap refusal'));
    expect(refusal).toContain('f4SeedBootstrapPending = false;');
    expect(refusal).toContain('bootRouteRepairPending = false;');
    expect(refusal).toContain('arc2LootBootstrapPending = false;');
    expect(refusal).toContain('arc3EngineeringBootstrapPending = false;');
    expect(refusal).toContain('arc4OwnershipBootstrapPending = false;');
    expect(refusal).toContain('bootProductBootstrapCandidate = null;');
    expect(refusal).toContain('arc4OwnershipState = null;');
    expect(refusal).toContain('runtime.setAnswerable(false);');
    expect(refusal).toContain('await runtime.release().catch(() => undefined);');
    expect(refusal).toContain('if (f4Runtime === runtime) f4Runtime = null;');
    expect(refusal.indexOf('if (durable) {')).toBeLessThan(
      refusal.indexOf('await runtime.release().catch(() => undefined);'),
    );

    const heartbeatStart = source.slice(
      source.indexOf('const startF4Heartbeat ='),
      source.indexOf('\nlet persistedPagehideCount', source.indexOf('const startF4Heartbeat =')),
    );
    expect(heartbeatStart).toContain('if (!f4Runtime || persistHold || !f4PageVisible()');
    const show = source.slice(
      source.indexOf('const showF4 ='),
      source.indexOf("\naddEventListener('pagehide'", source.indexOf('const showF4 =')),
    );
    const failedBootstrapReturn = show.indexOf('&& !await ensureBootAuthorityCommit(runtime)) return;');
    const answerability = show.indexOf('runtime.setAnswerable(f4RuntimeMayAnswer(runtime)');
    const heartbeatRestart = show.indexOf('startF4Heartbeat();');
    expect(failedBootstrapReturn).toBeGreaterThanOrEqual(0);
    expect(show).toContain('if (persistHold || runtime !== f4Runtime) return;');
    expect(answerability).toBeGreaterThan(failedBootstrapReturn);
    expect(heartbeatRestart).toBeGreaterThan(answerability);
  });
});
