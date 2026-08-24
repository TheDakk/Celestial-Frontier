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
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  initializeFreshV5,
  prepareArc2LootLegacyMigration,
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
  deriveArc3MineAction,
  deriveArc3SkimAction,
  prepareArc3AppBootstrap,
  publishArc3LegacyCompatibilityFields,
  publishArc3MiningFields,
  stageArc3BootstrapLegacyProjection,
  verifyArc3CommittedAction,
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
}>): V5Extensions {
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: {
      items: (input.items ?? []).map(([id, count]) => [id, count]),
      equip: {},
      equipAff: {},
    },
    capacity: 32,
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
  it('terminally quiesces a hidden-first bootstrap refusal with only one write site', () => {
    const source = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
    const ensureStart = source.indexOf('async function ensureF4SeedBootstrap(');
    const ensureEnd = source.indexOf('\nfunction f4RuntimeMayMutate(', ensureStart);
    expect(ensureStart).toBeGreaterThanOrEqual(0);
    expect(ensureEnd).toBeGreaterThan(ensureStart);
    const ensure = source.slice(ensureStart, ensureEnd);

    /* There is one write site. Arc 3 live publication is reachable only after
       that write reports committed; a rejection cannot publish the detached
       candidate or leave a pending bit that a later visibility edge retries. */
    expect(ensure.match(/runtime\.commit\(/g) ?? []).toHaveLength(1);
    const durableEdge = ensure.indexOf('durable = true;');
    const publication = ensure.indexOf('publishArc3LegacyCompatibilityFields(');
    expect(durableEdge).toBeGreaterThanOrEqual(0);
    expect(publication).toBeGreaterThan(durableEdge);
    const refusal = ensure.slice(ensure.indexOf('/* Any pre-durable bootstrap refusal'));
    expect(refusal).toContain('f4SeedBootstrapPending = false;');
    expect(refusal).toContain('arc2LootBootstrapPending = false;');
    expect(refusal).toContain('arc3EngineeringBootstrapPending = false;');
    expect(refusal).toContain('arc3EngineeringBootstrapCandidate = null;');
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
    const failedBootstrapReturn = show.indexOf('&& !await ensureF4SeedBootstrap(runtime)) return;');
    const answerability = show.indexOf('runtime.setAnswerable(f4RuntimeMayAnswer(runtime)');
    const heartbeatRestart = show.indexOf('startF4Heartbeat();');
    expect(failedBootstrapReturn).toBeGreaterThanOrEqual(0);
    expect(show).toContain('if (persistHold || runtime !== f4Runtime) return;');
    expect(answerability).toBeGreaterThan(failedBootstrapReturn);
    expect(heartbeatRestart).toBeGreaterThan(answerability);
  });
});
