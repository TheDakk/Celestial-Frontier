import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { MAX_UNLOCKED_ACHIEVEMENT_IDS } from '@cf/domain-progression';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  getProvenGalaxyKey,
  navFromCanonicalCF1Address,
  navToView,
  resolveCF1GalaxyAddress,
  resolveCF1StarAddress,
  type NavState,
} from '@cf/scene';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1,
  ARC9_WORMHOLE_TRAVERSAL_RECEIPT_KIND_V1,
  commitArc9GalaxyArrivalRouteV1,
  commitArc9TravelSettlementV1,
  deriveArc9TravelFactV1,
  operationForArc9TravelV1,
  prepareArc9GalaxyArrivalJoinV1,
  prepareArc9GalaxyArrivalRouteSettlementV1,
  prepareArc9TravelSettlementV1,
  publishArc9TravelFieldsV1,
  type Arc9TravelActionOutcomeV1,
} from '../apps/game/src/arc9-travel-action.js';
import { prepareArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-projection.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;

const GALAXY = Object.freeze({
  home: Object.freeze({ seed: 999, x: 90, y: -60 }),
  worm: Object.freeze({
    seed: 4036278526,
    x: -7644.230776309205,
    y: -4938.782567664424,
  }),
  dwarf: Object.freeze({
    seed: 815478345,
    x: -7635.054955642622,
    y: -4199.1791000457915,
  }),
  quasar: Object.freeze({
    seed: 2137920851,
    x: -6561.32964072749,
    y: 1572.95924089849,
  }),
} as const);
const SOL = Object.freeze({
  galaxy: GALAXY.home,
  star: Object.freeze({ seed: 424242, x: 560, y: 170 }),
});

type GalaxyNav = Extract<NavState, { readonly mode: 'galaxy' }>;

beforeAll(() => installCaptureHooks());

const GALAXY_NAVS = new Map<keyof typeof GALAXY, GalaxyNav>();

function galaxy(name: keyof typeof GALAXY): GalaxyNav {
  const cached = GALAXY_NAVS.get(name);
  if (cached) return cached;
  const address = resolveCF1GalaxyAddress({ galaxy: GALAXY[name] });
  if (!address.ok) throw new Error(`Travel galaxy fixture ${name} failed: ${address.reason}`);
  const nav = navFromCanonicalCF1Address(address.address);
  if (!nav.ok || nav.state.mode !== 'galaxy') {
    throw new Error(`Travel galaxy navigation fixture ${name} failed`);
  }
  GALAXY_NAVS.set(name, nav.state);
  return nav.state;
}

function systemSavedView(): Readonly<Record<string, unknown>> {
  const address = resolveCF1StarAddress(SOL);
  if (!address.ok) throw new Error(`Travel Sol fixture failed: ${address.reason}`);
  const nav = navFromCanonicalCF1Address(address.address);
  if (!nav.ok || nav.state.mode !== 'system') {
    throw new Error('Travel Sol navigation fixture failed');
  }
  const view = navToView(nav.state);
  if (view === null) throw new Error('Travel Sol saved view was unavailable');
  return view;
}

function galaxySavedView(name: keyof typeof GALAXY): Readonly<Record<string, unknown>> {
  const view = navToView(galaxy(name));
  if (view === null) throw new Error(`Travel galaxy saved view ${name} was unavailable`);
  return view;
}

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Arc 9 Travel base save failed: ${imported.reason}`);
  return imported.state;
}

function cloneState(state: SaveStateV2): SaveStateV2 {
  return JSON.parse(JSON.stringify(state)) as SaveStateV2;
}

async function fixture(
  sourceState: SaveStateV2 = baseState(),
  options: Readonly<{ failStorage?: boolean }> = {},
) {
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA9000006).state(),
  );
  const base = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state: sourceState, extensions: f4.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`Arc 9 Travel fixture was ${migration.kind}`);
  await base.apply(initial.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) throw new Error('forced Arc 9 Travel storage failure');
      }
      return base.compareAndApply(checks, operations, clearStores);
    },
  };
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: 0,
    initialExtensions: f4.extensions,
    restoredAuthority: f4.authority,
    freshSessionSeed: 0,
    ownerId: 'arc9-travel-tab',
    token: 'arc9-travel-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Arc 9 Travel lease was ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state: initial.canonicalState,
    receiptCas: () => receiptCas,
  };
}

async function expectStandaloneRouteCommit(
  galaxyNav: GalaxyNav,
  acceptedSavedView: Readonly<Record<string, unknown>>,
  targetMode: 'galaxy' | 'system',
): Promise<void> {
  const test = await fixture();
  let commitCalls = 0;
  const runtime = {
    commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
      commitCalls++;
      return test.runtime.commitAction(input);
    },
  };
  const before = JSON.stringify(test.state);
  const outcome = await commitArc9GalaxyArrivalRouteV1({
    runtime, state: test.state, galaxyNav, acceptedSavedView, codecNow: NOW,
  });
  expect(outcome).toMatchObject({
    kind: 'committed', durability: 'committed', convergence: 'none',
    route: { targetMode, acceptedSavedView },
    successor: { savedView: acceptedSavedView },
    transaction: {
      plan: { operation: operationForArc9TravelV1('galaxy-arrival', galaxyNav) },
      receipt: { ordinal: 0, kind: ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1 },
    },
  });
  expect(commitCalls).toBe(1);
  expect(test.receiptCas()).toBe(1);
  expect(JSON.stringify(test.state)).toBe(before);
  if (outcome.kind !== 'committed') return;
  expect(outcome.transaction.state.savedView).toEqual(acceptedSavedView);
  const reloaded = await readSaveV5(test.backend, REGISTRY, NOW);
  expect(reloaded.kind).toBe('loaded');
  if (reloaded.kind === 'loaded') {
    expect(reloaded.state.savedView).toEqual(acceptedSavedView);
    expect(reloaded.state.galSeen).toEqual([getProvenGalaxyKey(galaxyNav.gal)]);
  }
  const second = await commitArc9GalaxyArrivalRouteV1({
    runtime,
    state: outcome.transaction.state,
    galaxyNav,
    acceptedSavedView,
    codecNow: NOW,
  });
  expect(second).toMatchObject({ kind: 'current', durability: 'none', transaction: null });
  expect(commitCalls).toBe(1);
  expect(test.receiptCas()).toBe(1);
  await test.runtime.release();
}

describe('Arc 9 canonical Travel fact and fixed-point preparation', () => {
  it('derives quasar/dwarf/worm owners only from registered production galaxies', () => {
    expect(deriveArc9TravelFactV1('galaxy-arrival', galaxy('quasar'))).toMatchObject({
      actionKind: 'galaxy-arrival', galaxySeed: GALAXY.quasar.seed,
      quasar: true, dwarf: false, eventAchievementIds: ['quasar'],
    });
    expect(deriveArc9TravelFactV1('galaxy-arrival', galaxy('dwarf'))).toMatchObject({
      actionKind: 'galaxy-arrival', galaxySeed: GALAXY.dwarf.seed,
      quasar: false, dwarf: true, eventAchievementIds: ['dwarfg'],
    });
    expect(deriveArc9TravelFactV1('wormhole-traversal', galaxy('worm'))).toMatchObject({
      actionKind: 'wormhole-traversal', galaxySeed: GALAXY.worm.seed,
      eventAchievementIds: ['worm'],
      wormhole: { x: expect.any(Number), y: expect.any(Number) },
    });
    expect(prepareArc9TravelSettlementV1(
      baseState(), 'wormhole-traversal', galaxy('home'),
    )).toEqual({ kind: 'protected', reason: 'wormhole-absent' });
    expect(prepareArc9TravelSettlementV1(
      baseState(), 'galaxy-arrival', { ...galaxy('quasar') } as GalaxyNav,
    )).toEqual({ kind: 'protected', reason: 'source-unproven' });
  });

  it('atomically appends the exact galaxy key, event id, gal5 aggregate, and rank mirror', () => {
    const state = baseState();
    state.galSeen = ['legacy:a', 'legacy:b', 'legacy:c', 'legacy:d'];
    const before = JSON.stringify(state);
    const plan = prepareArc9TravelSettlementV1(state, 'galaxy-arrival', galaxy('quasar'));
    expect(plan).toMatchObject({
      kind: 'ready',
      facts: { quasar: true, dwarf: false, eventAchievementIds: ['quasar'] },
      route: { targetMode: 'galaxy' },
      source: { galSeen: state.galSeen, unlocked: [] },
      addedEventAchievementIds: ['quasar'],
      addedAggregateAchievementIds: ['gal5'],
    });
    expect(JSON.stringify(state)).toBe(before);
    if (plan.kind !== 'ready') return;
    const key = getProvenGalaxyKey(galaxy('quasar').gal);
    expect(key).not.toBeNull();
    expect(plan.successor.galSeen).toEqual([...state.galSeen, key]);
    expect(plan.successor.unlocked).toEqual(['quasar', 'gal5']);
    expect(plan.successor.bestRank).toBe(plan.projection.savedBestRankIndex);
    expect(plan.successor.savedView).toEqual(navToView(galaxy('quasar')));
    expect(prepareArc9ProgressionRefreshV1(plan.successorState).kind).toBe('current');
    expect(prepareArc9TravelSettlementV1(
      plan.successorState, 'galaxy-arrival', galaxy('quasar'),
    )).toMatchObject({ kind: 'current' });
  });

  it('dedupes the legacy numeric seed but not a different canonical coordinate key', () => {
    const numeric = baseState();
    numeric.galSeen = [GALAXY.quasar.seed];
    const migrated = prepareArc9TravelSettlementV1(
      numeric, 'galaxy-arrival', galaxy('quasar'),
    );
    expect(migrated).toMatchObject({
      kind: 'ready', source: { galSeen: [GALAXY.quasar.seed] },
      successor: { galSeen: [GALAXY.quasar.seed], unlocked: ['quasar'] },
    });
    if (migrated.kind === 'ready') {
      expect(prepareArc9TravelSettlementV1(
        migrated.successorState, 'galaxy-arrival', galaxy('quasar'),
      )).toMatchObject({ kind: 'current' });
    }

    const collision = baseState();
    collision.galSeen = [`CF1|g:${GALAXY.quasar.seed}@0,0`];
    const exact = prepareArc9TravelSettlementV1(
      collision, 'galaxy-arrival', galaxy('quasar'),
    );
    expect(exact.kind).toBe('ready');
    if (exact.kind === 'ready') {
      expect(exact.successor.galSeen).toEqual([
        collision.galSeen[0],
        getProvenGalaxyKey(galaxy('quasar').gal),
      ]);
    }
  });

  it('preserves an accepted system route when Follow folds arrival into its existing receipt', () => {
    const state = baseState();
    const accepted = systemSavedView();
    const joined = prepareArc9GalaxyArrivalJoinV1(state, galaxy('home'), accepted);
    expect(joined).toMatchObject({
      kind: 'ready',
      facts: { actionKind: 'galaxy-arrival', galaxySeed: GALAXY.home.seed },
      route: { targetMode: 'system', acceptedSavedView: accepted },
      successor: { savedView: accepted },
      successorState: { savedView: accepted },
    });
    expect(prepareArc9GalaxyArrivalRouteSettlementV1(
      state, galaxy('home'), accepted,
    )).toMatchObject({
      kind: 'ready',
      operation: operationForArc9TravelV1('galaxy-arrival', galaxy('home')),
      receiptKind: ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1,
      route: { targetMode: 'system', acceptedSavedView: accepted },
      successor: { savedView: accepted },
    });
    if (joined.kind !== 'ready') return;
    expect(joined.successor.galSeen).toEqual([getProvenGalaxyKey(galaxy('home').gal)]);
    expect(prepareArc9ProgressionRefreshV1(joined.successorState).kind).toBe('current');
    expect(prepareArc9GalaxyArrivalJoinV1(
      joined.successorState, galaxy('home'), accepted,
    )).toMatchObject({ kind: 'current', route: { targetMode: 'system' } });
    expect(prepareArc9GalaxyArrivalJoinV1(
      baseState(), galaxy('quasar'), accepted,
    )).toEqual({ kind: 'protected', reason: 'source-mismatch' });
  });

  it('uses Universe/null for worm traversal and fails closed at both bounded capacities', async () => {
    const worm = prepareArc9TravelSettlementV1(
      baseState(), 'wormhole-traversal', galaxy('worm'),
    );
    expect(worm).toMatchObject({
      kind: 'ready', route: { targetMode: 'universe', acceptedSavedView: null },
      successor: { galSeen: [], unlocked: ['worm'], savedView: null },
    });

    let commits = 0;
    const runtime = { async commitAction() { commits++; return { kind: 'lease-unavailable' as const }; } };
    const ledger = baseState();
    ledger.galSeen = Array.from({ length: 20_000 }, (_, index) => `legacy:${index}`);
    await expect(commitArc9TravelSettlementV1({
      runtime, state: ledger, actionKind: 'galaxy-arrival',
      galaxyNav: galaxy('quasar'), codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:galaxy-ledger-capacity', transaction: null,
    });

    const achievements = baseState();
    achievements.unlocked = Array.from(
      { length: MAX_UNLOCKED_ACHIEVEMENT_IDS },
      (_, index) => `compat:${index}`,
    );
    await expect(commitArc9TravelSettlementV1({
      runtime, state: achievements, actionKind: 'galaxy-arrival',
      galaxyNav: galaxy('quasar'), codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:achievement:achievement-capacity', transaction: null,
    });
    await expect(commitArc9GalaxyArrivalRouteV1({
      runtime,
      state: baseState(),
      galaxyNav: galaxy('quasar'),
      acceptedSavedView: systemSavedView(),
      codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:source-mismatch', transaction: null,
    });
    expect(commits).toBe(0);
  });

  it('rejects forged input objects before derivation or writer access', async () => {
    let commits = 0;
    const runtime = { async commitAction() { commits++; return { kind: 'lease-unavailable' as const }; } };
    await expect(commitArc9TravelSettlementV1({
      runtime,
      state: baseState(),
      actionKind: 'galaxy-arrival',
      galaxyNav: { ...galaxy('quasar') } as GalaxyNav,
      codecNow: NOW,
    })).resolves.toEqual({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
    await expect(commitArc9GalaxyArrivalRouteV1({
      runtime,
      state: baseState(),
      galaxyNav: galaxy('quasar'),
      acceptedSavedView: undefined as unknown as Readonly<Record<string, unknown>>,
      codecNow: NOW,
    })).resolves.toEqual({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
    expect(commits).toBe(0);
  });
});

describe('Arc 9 durable Travel settlement', () => {
  it('commits the codec-canonical route state when an unrelated veteran mining stamp moves', async () => {
    const state = baseState();
    state.mined = [['veteran-clock-floor', NOW - 30 * 6e5]];
    state.mineX = [['veteran-clock-floor', 1]];
    const test = await fixture(state);
    const before = JSON.stringify(test.state);
    const outcome = await commitArc9TravelSettlementV1({
      runtime: test.runtime,
      state: test.state,
      actionKind: 'galaxy-arrival',
      galaxyNav: galaxy('quasar'),
      codecNow: NOW + 1,
    });

    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
    });
    expect(JSON.stringify(test.state)).toBe(before);
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.state).toEqual(outcome.transaction.saved.canonicalState);
    expect(new Map(outcome.transaction.state.mined).get('veteran-clock-floor'))
      .toBe(NOW + 1 - 30 * 6e5);
    await test.runtime.release();
  });

  it('commits arrival in one receipt/CAS, preserves RNG domains, publishes, and becomes current', async () => {
    const source = baseState();
    source.galSeen = ['legacy:a', 'legacy:b', 'legacy:c', 'legacy:d'];
    const test = await fixture(source);
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const callerBefore = JSON.stringify(test.state);
    const outcome = await commitArc9TravelSettlementV1({
      runtime, state: test.state, actionKind: 'galaxy-arrival',
      galaxyNav: galaxy('quasar'), codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      facts: { quasar: true, eventAchievementIds: ['quasar'] },
      addedEventAchievementIds: ['quasar'],
      addedAggregateAchievementIds: ['gal5'],
      transaction: {
        revision: 1,
        plan: {
          operation: operationForArc9TravelV1('galaxy-arrival', galaxy('quasar')),
          receiptOrdinal: 0,
        },
        receipt: { ordinal: 0, kind: ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1 },
      },
    });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    expect(JSON.stringify(test.state)).toBe(callerBefore);
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.plan.nextSessionRng).toMatchObject({
      seed: outcome.transaction.plan.currentAuthority.sessionRng.seed,
      ordinal: outcome.transaction.plan.currentAuthority.sessionRng.ordinal + 1,
      draws: outcome.transaction.plan.currentAuthority.sessionRng.draws,
    });
    expect(await test.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    const reloaded = await readSaveV5(test.backend, REGISTRY, NOW);
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind === 'loaded') {
      expect(reloaded.state.galSeen).toEqual(outcome.successor.galSeen);
      expect(reloaded.state.unlocked).toEqual(['quasar', 'gal5']);
      expect(reloaded.state.savedView).toEqual(navToView(galaxy('quasar')));
    }

    const live = cloneState(test.state);
    const unrelatedCrafts = live.stats.crafts;
    publishArc9TravelFieldsV1(live, outcome);
    expect(live.galSeen).toEqual(outcome.successor.galSeen);
    expect(live.unlocked).toEqual(outcome.successor.unlocked);
    expect(live.savedView).toEqual(outcome.successor.savedView);
    expect(live.stats).toMatchObject({
      bestRank: outcome.successor.bestRank,
      crafts: unrelatedCrafts,
    });
    const wrongParent = cloneState(test.state);
    wrongParent.galSeen = ['unrelated'];
    expect(() => publishArc9TravelFieldsV1(wrongParent, outcome)).toThrow(/exact live parent/u);

    const second = await commitArc9TravelSettlementV1({
      runtime, state: outcome.transaction.state, actionKind: 'galaxy-arrival',
      galaxyNav: galaxy('quasar'), codecNow: NOW,
    });
    expect(second).toMatchObject({ kind: 'current', durability: 'none', transaction: null });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    await test.runtime.release();
  });

  it('atomically retains an accepted galaxy route in the standalone Travel receipt', async () => {
    await expectStandaloneRouteCommit(
      galaxy('quasar'),
      galaxySavedView('quasar'),
      'galaxy',
    );
  });

  it('atomically retains an accepted star/world system route in the standalone Travel receipt', async () => {
    await expectStandaloneRouteCommit(
      galaxy('home'),
      systemSavedView(),
      'system',
    );
  });

  it('commits worm traversal once with its exact receipt and Universe/null route', async () => {
    const test = await fixture();
    const outcome = await commitArc9TravelSettlementV1({
      runtime: test.runtime, state: test.state, actionKind: 'wormhole-traversal',
      galaxyNav: galaxy('worm'), codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed',
      facts: { actionKind: 'wormhole-traversal', eventAchievementIds: ['worm'] },
      route: { targetMode: 'universe', acceptedSavedView: null },
      successor: { galSeen: [], unlocked: ['worm'], savedView: null },
      transaction: {
        plan: { operation: operationForArc9TravelV1('wormhole-traversal', galaxy('worm')) },
        receipt: { ordinal: 0, kind: ARC9_WORMHOLE_TRAVERSAL_RECEIPT_KIND_V1 },
      },
    });
    expect(test.receiptCas()).toBe(1);
    await test.runtime.release();
  });

  it('contains stale and storage failures once with no receipt, retry, or caller mutation', async () => {
    const stale = await fixture();
    await stale.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'travel-race-winner', value: 'other-tab' }],
    });
    const staleBefore = JSON.stringify(stale.state);
    const staleOutcome = await commitArc9TravelSettlementV1({
      runtime: stale.runtime, state: stale.state, actionKind: 'wormhole-traversal',
      galaxyNav: galaxy('worm'), codecNow: NOW,
    });
    expect(staleOutcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(stale.receiptCas()).toBe(0);
    expect(await stale.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(stale.state)).toBe(staleBefore);
    await stale.runtime.release();

    const storage = await fixture(baseState(), { failStorage: true });
    let calls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof storage.runtime.commitAction>[0]) {
        calls++;
        return storage.runtime.commitAction(input);
      },
    };
    const storageBefore = JSON.stringify(storage.state);
    const storageOutcome = await commitArc9TravelSettlementV1({
      runtime, state: storage.state, actionKind: 'galaxy-arrival',
      galaxyNav: galaxy('quasar'), codecNow: NOW,
    });
    expect(storageOutcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 9 Travel storage failure',
      transaction: { kind: 'storage-error' },
    });
    expect(calls).toBe(1);
    expect(storage.receiptCas()).toBe(1);
    expect(await storage.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(storage.state)).toBe(storageBefore);
    await storage.runtime.release();
  });

  it('turns missing or altered postcommit evidence into read-only convergence', async () => {
    const missing = await fixture();
    const missingRuntime = {
      commitAction(input: Parameters<typeof missing.runtime.commitAction>[0]) {
        return missing.runtime.commitAction({
          ...input,
          derive: ({ draft }) => Object.freeze({ state: draft, witness: 'missing-travel-evidence' }),
        });
      },
    };
    const missingOutcome = await commitArc9TravelSettlementV1({
      runtime: missingRuntime, state: missing.state, actionKind: 'galaxy-arrival',
      galaxyNav: galaxy('quasar'), codecNow: NOW,
    });
    expect(missingOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
      detail: 'committed-travel-evidence-missing',
    });
    await missing.runtime.release();

    const altered = await fixture();
    const alteredRuntime = {
      async commitAction(input: Parameters<typeof altered.runtime.commitAction>[0]) {
        const result = await altered.runtime.commitAction(input);
        if (result.kind !== 'committed') return result;
        return Object.freeze({
          ...result,
          state: { ...result.state, galSeen: [] },
        }) as Extract<Arc9TravelActionOutcomeV1, { kind: 'committed' }>['transaction'];
      },
    };
    const alteredOutcome = await commitArc9TravelSettlementV1({
      runtime: alteredRuntime, state: altered.state, actionKind: 'galaxy-arrival',
      galaxyNav: galaxy('quasar'), codecNow: NOW,
    });
    expect(alteredOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
      detail: 'committed-travel-fixed-point-mismatch',
    });
    await altered.runtime.release();
  });
});
