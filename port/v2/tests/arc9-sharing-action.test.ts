import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  ascend,
  getProvenGalaxyKey,
  navFromCanonicalCF1Address,
  navToView,
  parseStrictCF1Code,
  resolveCF1GalaxyAddress,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1Address,
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
  ARC9_SHARE_FOLLOW_OPERATION_V1,
  ARC9_SHARE_FOLLOW_RECEIPT_KIND_V1,
  ARC9_SHARE_SEND_OPERATION_V1,
  ARC9_SHARE_SEND_RECEIPT_KIND_V1,
  commitArc9SharingActionV1,
  prepareArc9SharingActionV1,
  publishArc9SharingFieldsV1,
} from '../apps/game/src/arc9-sharing-action.js';
import { prepareArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-projection.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;
const GALAXY = 'CF1-eyJ0IjoiZyIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV19';
const STAR = 'CF1-eyJ0IjoicyIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV0sInMiOls1NjAsMTcwLDQyNDI0Ml19';
const EARTH = 'CF1-eyJ0IjoicCIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV0sInMiOls1NjAsMTcwLDQyNDI0Ml0sInAiOjEzM30';
const TRAVEL_GALAXY = Object.freeze({
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

type GalaxyNav = Extract<NavState, { readonly mode: 'galaxy' }>;

beforeAll(() => installCaptureHooks());

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Arc 9 sharing base save failed: ${imported.reason}`);
  return imported.state;
}

function acceptedSavedView(code: string): Readonly<Record<string, unknown>> {
  const parsed = parseStrictCF1Code(code);
  if (parsed.kind !== 'valid') throw new Error('sharing fixture code was invalid');
  const resolved = parsed.tier === 'galaxy'
    ? resolveCF1GalaxyAddress(parsed.candidate)
    : parsed.tier === 'star'
      ? resolveCF1StarAddress(parsed.candidate)
      : resolveCF1WorldAddress(parsed.candidate);
  if (!resolved.ok) throw new Error(`sharing fixture address failed: ${resolved.reason}`);
  const nav = navFromCanonicalCF1Address(resolved.address as CanonicalCF1Address);
  if (!nav.ok) throw new Error(`sharing fixture navigation failed: ${nav.reason}`);
  const committed = nav.state.mode === 'surface' ? ascend(nav.state) : nav;
  if (!committed.ok || committed.state.mode === 'surface') {
    throw new Error('sharing fixture could not compose its committed route');
  }
  const view = navToView(committed.state);
  if (view === null) throw new Error('sharing fixture view was unavailable');
  return view as Readonly<Record<string, unknown>>;
}

function galaxyNav(candidate: Readonly<{ seed: number; x: number; y: number }>): GalaxyNav {
  const address = resolveCF1GalaxyAddress({ galaxy: candidate });
  if (!address.ok) throw new Error(`sharing galaxy fixture failed: ${address.reason}`);
  const nav = navFromCanonicalCF1Address(address.address);
  if (!nav.ok || nav.state.mode !== 'galaxy') {
    throw new Error('sharing galaxy fixture did not produce GalaxyNav');
  }
  return nav.state;
}

function galaxyCode(candidate: Readonly<{ seed: number; x: number; y: number }>): string {
  const nav = galaxyNav(candidate);
  const flags = (nav.gal.home ? 1 : 0) | (nav.gal.quasar ? 2 : 0) | (nav.gal.dwarf ? 4 : 0);
  const payload = {
    t: 'g',
    g: [
      Math.round(nav.gal.x * 100) / 100,
      Math.round(nav.gal.y * 100) / 100,
      nav.gal.size,
      nav.gal.sp,
      nav.gal.tilt,
      nav.gal.rot,
      nav.gal.seed,
      flags,
    ],
  };
  return `CF1-${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`;
}

async function fixture(
  sourceState: SaveStateV2 = baseState(),
  options: Readonly<{ failStorage?: boolean }> = {},
) {
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA9000004).state(),
  );
  const base = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state: sourceState, extensions: f4.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`Arc 9 sharing fixture was ${migration.kind}`);
  await base.apply(initial.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) throw new Error('forced sharing storage failure');
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
    ownerId: 'arc9-sharing-tab',
    token: 'arc9-sharing-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Arc 9 sharing lease was ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state: initial.canonicalState,
    receiptCas: () => receiptCas,
  };
}

describe('Arc 9 CF1 sharing preparation', () => {
  it('matches legacy Share/Follow ownership without mutating or inferring from counters', () => {
    const state = baseState();
    const before = JSON.stringify(state);
    const sent = prepareArc9SharingActionV1(state, 'send', EARTH, null);
    expect(sent).toMatchObject({
      kind: 'ready', actionKind: 'send', operation: ARC9_SHARE_SEND_OPERATION_V1,
      receiptKind: ARC9_SHARE_SEND_RECEIPT_KIND_V1,
      counterKey: 'shares', counterBefore: 0, counterAfter: 1,
      achievementId: 'share', achievementAdded: true,
      nextUnlockedIds: ['share'],
      route: { tier: 'planet' },
      arrival: null,
      successorState: { stats: { shares: 1 }, unlocked: ['share'] },
    });
    expect(prepareArc9SharingActionV1(state, 'send', GALAXY, null)).toEqual({
      kind: 'protected', reason: 'send-requires-world-code',
    });
    expect(prepareArc9SharingActionV1(state, 'send', EARTH, acceptedSavedView(EARTH))).toEqual({
      kind: 'protected', reason: 'accepted-route-invalid',
    });

    for (const [code, tier] of [
      [GALAXY, 'galaxy'], [STAR, 'star'], [EARTH, 'planet'],
    ] as const) {
      const accepted = acceptedSavedView(code);
      const followed = prepareArc9SharingActionV1(state, 'follow', code, accepted);
      const homeKey = getProvenGalaxyKey(galaxyNav({ seed: 999, x: 90, y: -60 }).gal);
      expect(followed).toMatchObject({
        kind: 'ready', actionKind: 'follow', operation: ARC9_SHARE_FOLLOW_OPERATION_V1,
        receiptKind: ARC9_SHARE_FOLLOW_RECEIPT_KIND_V1,
        counterKey: 'jumps', counterBefore: 0, counterAfter: 1,
        achievementId: 'wayfarer', achievementAdded: true,
        nextUnlockedIds: ['wayfarer'], route: { tier, acceptedSavedView: accepted },
        arrival: {
          facts: { actionKind: 'galaxy-arrival', galaxySeed: 999 },
          sourceGalSeen: [], nextGalSeen: [homeKey],
          addedEventAchievementIds: [], addedAggregateAchievementIds: [],
        },
        successorState: {
          stats: { jumps: 1 }, unlocked: ['wayfarer'],
          galSeen: [homeKey], savedView: accepted,
        },
      });
    }
    expect(prepareArc9SharingActionV1(
      state, 'follow', EARTH, acceptedSavedView(GALAXY),
    )).toEqual({ kind: 'protected', reason: 'accepted-route-mismatch' });
    expect(prepareArc9SharingActionV1(state, 'follow', 'CF1-not-base64', null)).toEqual({
      kind: 'protected', reason: 'code-invalid',
    });
    expect(JSON.stringify(state)).toBe(before);
  });

  it('joins quasar/dwarf and galaxy aggregates from the parsed CF1 source hierarchy', () => {
    const quasarCode = galaxyCode(TRAVEL_GALAXY.quasar);
    const quasarState = baseState();
    quasarState.galSeen = ['legacy:a', 'legacy:b', 'legacy:c', 'legacy:d'];
    const quasarBefore = JSON.stringify(quasarState);
    const quasar = prepareArc9SharingActionV1(
      quasarState, 'follow', quasarCode, acceptedSavedView(quasarCode),
    );
    const quasarKey = getProvenGalaxyKey(galaxyNav(TRAVEL_GALAXY.quasar).gal);
    expect(quasar).toMatchObject({
      kind: 'ready',
      arrival: {
        facts: { quasar: true, dwarf: false, eventAchievementIds: ['quasar'] },
        sourceGalSeen: quasarState.galSeen,
        nextGalSeen: [...quasarState.galSeen, quasarKey],
        addedEventAchievementIds: ['quasar'],
        addedAggregateAchievementIds: ['gal5'],
      },
      successorState: {
        stats: { jumps: 1 },
        galSeen: [...quasarState.galSeen, quasarKey],
        unlocked: ['wayfarer', 'quasar', 'gal5'],
      },
    });
    expect(JSON.stringify(quasarState)).toBe(quasarBefore);

    const dwarfCode = galaxyCode(TRAVEL_GALAXY.dwarf);
    const dwarf = prepareArc9SharingActionV1(
      baseState(), 'follow', dwarfCode, acceptedSavedView(dwarfCode),
    );
    expect(dwarf).toMatchObject({
      kind: 'ready',
      arrival: {
        facts: { quasar: false, dwarf: true, eventAchievementIds: ['dwarfg'] },
        addedEventAchievementIds: ['dwarfg'],
      },
      successorState: { unlocked: ['wayfarer', 'dwarfg'] },
    });

    expect(prepareArc9SharingActionV1(
      baseState(), 'follow', quasarCode, acceptedSavedView(GALAXY),
    )).toEqual({ kind: 'protected', reason: 'accepted-route-mismatch' });
  });

  it('dedupes legacy numeric/canonical galaxy identities without same-seed key collapse', () => {
    const code = galaxyCode(TRAVEL_GALAXY.quasar);
    const accepted = acceptedSavedView(code);
    const exactKey = getProvenGalaxyKey(galaxyNav(TRAVEL_GALAXY.quasar).gal);
    expect(exactKey).not.toBeNull();

    for (const existing of [TRAVEL_GALAXY.quasar.seed, exactKey] as const) {
      const state = baseState();
      state.galSeen = [existing];
      const plan = prepareArc9SharingActionV1(state, 'follow', code, accepted);
      expect(plan).toMatchObject({
        kind: 'ready',
        arrival: { sourceGalSeen: [existing], nextGalSeen: [existing] },
      });
    }

    const coordinateCollision = baseState();
    coordinateCollision.galSeen = [`CF1|g:${TRAVEL_GALAXY.quasar.seed}@0,0`];
    const distinct = prepareArc9SharingActionV1(
      coordinateCollision, 'follow', code, accepted,
    );
    expect(distinct).toMatchObject({
      kind: 'ready',
      arrival: {
        sourceGalSeen: coordinateCollision.galSeen,
        nextGalSeen: [coordinateCollision.galSeen[0], exactKey],
      },
    });
  });

  it('protects compatibility-counter and achievement capacity before any writer', async () => {
    let commits = 0;
    const runtime = {
      async commitAction() {
        commits++;
        return { kind: 'lease-unavailable' as const };
      },
    };
    const malformed = baseState();
    malformed.stats.shares = -1;
    await expect(commitArc9SharingActionV1({
      runtime, state: malformed, actionKind: 'send', code: EARTH,
      acceptedSavedView: null, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:counter-shape', transaction: null,
    });
    const capped = baseState();
    capped.stats.jumps = 1_000_000_000;
    await expect(commitArc9SharingActionV1({
      runtime, state: capped, actionKind: 'follow', code: EARTH,
      acceptedSavedView: acceptedSavedView(EARTH), codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:counter-capacity', transaction: null,
    });
    const duplicate = baseState();
    duplicate.unlocked = ['share', 'share'];
    await expect(commitArc9SharingActionV1({
      runtime, state: duplicate, actionKind: 'send', code: EARTH,
      acceptedSavedView: null, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:achievement-id-shape', transaction: null,
    });
    expect(commits).toBe(0);
  });
});

describe('Arc 9 durable CF1 Share/Follow transactions', () => {
  it('commits the codec-canonical sharing state when an unrelated veteran mining stamp moves', async () => {
    const state = baseState();
    state.mined = [['veteran-clock-floor', NOW - 30 * 6e5]];
    state.mineX = [['veteran-clock-floor', 1]];
    const test = await fixture(state);
    const before = JSON.stringify(test.state);
    const outcome = await commitArc9SharingActionV1({
      runtime: test.runtime,
      state: test.state,
      actionKind: 'send',
      code: EARTH,
      acceptedSavedView: null,
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

  it('commits Share in one receipt/CAS and increments again without duplicating its event id', async () => {
    const test = await fixture();
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const callerBefore = JSON.stringify(test.state);
    const first = await commitArc9SharingActionV1({
      runtime, state: test.state, actionKind: 'send', code: EARTH,
      acceptedSavedView: null, codecNow: NOW,
    });
    expect(first).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      counterKey: 'shares', counterBefore: 0, counterAfter: 1,
      achievementId: 'share', achievementAdded: true,
      transaction: {
        revision: 1,
        plan: { operation: ARC9_SHARE_SEND_OPERATION_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_SHARE_SEND_RECEIPT_KIND_V1 },
        state: { stats: { shares: 1 }, unlocked: ['share'] },
      },
    });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    expect(JSON.stringify(test.state)).toBe(callerBefore);
    if (first.kind !== 'committed') return;
    expect(await test.repository.readReceipt(0)).toEqual(first.transaction.receipt);
    const second = await commitArc9SharingActionV1({
      runtime, state: first.transaction.state, actionKind: 'send', code: EARTH,
      acceptedSavedView: null, codecNow: NOW,
    });
    expect(second).toMatchObject({
      kind: 'committed', counterBefore: 1, counterAfter: 2, achievementAdded: false,
      nextUnlockedIds: ['share'],
      transaction: { revision: 2, receipt: { ordinal: 1 } },
    });
    expect(commitCalls).toBe(2);
    expect(test.receiptCas()).toBe(2);
    const loaded = await readSaveV5(test.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.state.stats.shares).toBe(2);
      expect(loaded.state.unlocked.filter((id) => id === 'share')).toEqual(['share']);
    }
    expect(test.runtime.sessionRng).toEqual({ seed: 0xA9000004, ordinal: 2, draws: {} });
    await test.runtime.release();
  });

  it('commits only the actually accepted Follow route with its counter and event', async () => {
    const test = await fixture();
    const accepted = acceptedSavedView(EARTH);
    const callerBefore = JSON.stringify(test.state);
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const outcome = await commitArc9SharingActionV1({
      runtime, state: test.state, actionKind: 'follow', code: EARTH,
      acceptedSavedView: accepted, codecNow: NOW,
    });
    const homeKey = getProvenGalaxyKey(galaxyNav({ seed: 999, x: 90, y: -60 }).gal);
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      counterKey: 'jumps', counterBefore: 0, counterAfter: 1,
      achievementId: 'wayfarer', achievementAdded: true,
      route: { tier: 'planet', acceptedSavedView: accepted },
      arrival: {
        facts: { galaxySeed: 999, eventAchievementIds: [] },
        sourceGalSeen: [], nextGalSeen: [homeKey],
      },
      transaction: {
        revision: 1,
        plan: { operation: ARC9_SHARE_FOLLOW_OPERATION_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_SHARE_FOLLOW_RECEIPT_KIND_V1 },
        state: {
          stats: { jumps: 1 }, unlocked: ['wayfarer'],
          galSeen: [homeKey], savedView: accepted,
        },
      },
    });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    expect(JSON.stringify(test.state)).toBe(callerBefore);
    if (outcome.kind !== 'committed') return;
    expect(outcome.transaction.plan.nextSessionRng).toEqual({
      seed: outcome.transaction.plan.currentAuthority.sessionRng.seed,
      ordinal: outcome.transaction.plan.currentAuthority.sessionRng.ordinal + 1,
      draws: outcome.transaction.plan.currentAuthority.sessionRng.draws,
    });
    expect(prepareArc9ProgressionRefreshV1(outcome.transaction.state).kind).toBe('current');
    const loaded = await readSaveV5(test.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.state.stats.jumps).toBe(1);
      expect(loaded.state.unlocked).toContain('wayfarer');
      expect(loaded.state.galSeen).toEqual([homeKey]);
      expect(loaded.state.savedView).toEqual(accepted);
    }
    const second = await commitArc9SharingActionV1({
      runtime, state: outcome.transaction.state, actionKind: 'follow', code: EARTH,
      acceptedSavedView: accepted, codecNow: NOW,
    });
    expect(second).toMatchObject({
      kind: 'committed', counterBefore: 1, counterAfter: 2,
      arrival: {
        sourceGalSeen: [homeKey], nextGalSeen: [homeKey],
        addedEventAchievementIds: [], addedAggregateAchievementIds: [],
      },
      nextUnlockedIds: ['wayfarer'],
      transaction: { revision: 2, receipt: { ordinal: 1 } },
    });
    expect(commitCalls).toBe(2);
    expect(test.receiptCas()).toBe(2);
    await test.runtime.release();
  });

  it('settles Follow, quasar arrival, gal5, rank, and route in the same one-CAS receipt', async () => {
    const source = baseState();
    source.galSeen = ['legacy:a', 'legacy:b', 'legacy:c', 'legacy:d'];
    const test = await fixture(source);
    const code = galaxyCode(TRAVEL_GALAXY.quasar);
    const accepted = acceptedSavedView(code);
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const outcome = await commitArc9SharingActionV1({
      runtime, state: test.state, actionKind: 'follow', code,
      acceptedSavedView: accepted, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed',
      nextUnlockedIds: ['wayfarer', 'quasar', 'gal5'],
      arrival: {
        facts: { eventAchievementIds: ['quasar'] },
        addedEventAchievementIds: ['quasar'],
        addedAggregateAchievementIds: ['gal5'],
      },
      transaction: {
        revision: 1,
        receipt: { ordinal: 0, kind: ARC9_SHARE_FOLLOW_RECEIPT_KIND_V1 },
        state: {
          stats: { jumps: 1, bestRank: expect.any(Number) },
          unlocked: ['wayfarer', 'quasar', 'gal5'],
          savedView: accepted,
        },
      },
    });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    expect(await test.repository.readReceipt(1)).toBeUndefined();
    if (outcome.kind === 'committed') {
      expect(outcome.transaction.state.stats.bestRank).toBe(outcome.arrival?.nextBestRank);
      expect(prepareArc9ProgressionRefreshV1(outcome.transaction.state).kind).toBe('current');
    }
    await test.runtime.release();
  });

  it('fails stale and storage outcomes once, with no retry, receipt, or optimistic mutation', async () => {
    const stale = await fixture();
    const staleBefore = JSON.stringify(stale.state);
    await stale.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'arc9-sharing-race', value: 'other-tab' }],
    });
    await expect(commitArc9SharingActionV1({
      runtime: stale.runtime, state: stale.state, actionKind: 'send', code: EARTH,
      acceptedSavedView: null, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(stale.receiptCas()).toBe(0);
    expect(await stale.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(stale.state)).toBe(staleBefore);
    await stale.runtime.release();

    const failed = await fixture(baseState(), { failStorage: true });
    const failedBefore = JSON.stringify(failed.state);
    let failedCalls = 0;
    const failedRuntime = {
      commitAction(input: Parameters<typeof failed.runtime.commitAction>[0]) {
        failedCalls++;
        return failed.runtime.commitAction(input);
      },
    };
    await expect(commitArc9SharingActionV1({
      runtime: failedRuntime, state: failed.state, actionKind: 'follow', code: STAR,
      acceptedSavedView: acceptedSavedView(STAR), codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced sharing storage failure',
    });
    expect(await failed.repository.revision()).toBe(0);
    expect(await failed.repository.readReceipt(0)).toBeUndefined();
    expect(failedCalls).toBe(1);
    expect(JSON.stringify(failed.state)).toBe(failedBefore);
    await failed.runtime.release();
  });

  it('contains postcommit evidence ambiguity and publishes only verified owned fields', async () => {
    const ambiguous = await fixture();
    const ambiguousBefore = JSON.stringify(ambiguous.state);
    const ambiguousOutcome = await commitArc9SharingActionV1({
      runtime: {
        async commitAction(input) {
          const committed = await ambiguous.runtime.commitAction(input);
          if (committed.kind !== 'committed') return committed;
          return Object.freeze({
            ...committed,
            state: { ...committed.state, stats: { ...committed.state.stats, shares: 0 } },
          });
        },
      },
      state: ambiguous.state, actionKind: 'send', code: EARTH,
      acceptedSavedView: null, codecNow: NOW,
    });
    expect(ambiguousOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-sharing-fixed-point-mismatch',
    });
    expect(JSON.stringify(ambiguous.state)).toBe(ambiguousBefore);
    await ambiguous.runtime.release();

    const alteredArrival = await fixture();
    const alteredArrivalOutcome = await commitArc9SharingActionV1({
      runtime: {
        async commitAction(input) {
          const committed = await alteredArrival.runtime.commitAction(input);
          if (committed.kind !== 'committed') return committed;
          return Object.freeze({ ...committed, state: { ...committed.state, galSeen: [] } });
        },
      },
      state: alteredArrival.state, actionKind: 'follow', code: GALAXY,
      acceptedSavedView: acceptedSavedView(GALAXY), codecNow: NOW,
    });
    expect(alteredArrivalOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-sharing-fixed-point-mismatch',
    });
    await alteredArrival.runtime.release();

    const test = await fixture();
    const outcome = await commitArc9SharingActionV1({
      runtime: test.runtime, state: test.state, actionKind: 'follow', code: GALAXY,
      acceptedSavedView: acceptedSavedView(GALAXY), codecNow: NOW,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    const live = test.state;
    const itemsIdentity = live.items;
    const codexIdentity = live.codex;
    const wrongLedgerParent = JSON.parse(JSON.stringify(live)) as SaveStateV2;
    wrongLedgerParent.galSeen = ['unrelated'];
    expect(() => publishArc9SharingFieldsV1(wrongLedgerParent, outcome))
      .toThrow('requires its exact live parent');
    const wrongRankParent = JSON.parse(JSON.stringify(live)) as SaveStateV2;
    wrongRankParent.stats.bestRank = (wrongRankParent.stats.bestRank ?? 0) + 1;
    expect(() => publishArc9SharingFieldsV1(wrongRankParent, outcome))
      .toThrow('requires its exact live parent');
    publishArc9SharingFieldsV1(live, outcome);
    expect(live.stats.jumps).toBe(1);
    expect(live.unlocked).toEqual(['wayfarer']);
    expect(live.galSeen).toEqual(outcome.arrival?.nextGalSeen);
    expect(live.stats.bestRank).toBe(outcome.arrival?.nextBestRank);
    expect(live.savedView).toEqual(acceptedSavedView(GALAXY));
    expect(live.items).toBe(itemsIdentity);
    expect(live.codex).toBe(codexIdentity);
    expect(() => publishArc9SharingFieldsV1(live, outcome))
      .toThrow('requires its exact live parent');
    await test.runtime.release();
  });
});
