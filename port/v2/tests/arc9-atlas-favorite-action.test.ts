import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MAX_UNLOCKED_ACHIEVEMENT_IDS } from '@cf/domain-progression';
import { createSessionRNG } from '@cf/domain-sessionrng';
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
  ARC9_ATLAS_FAVORITE_RECEIPT_KIND_V1,
  commitArc9AtlasFavoriteV1,
  operationForArc9AtlasFavoriteV1,
  prepareArc9AtlasFavoriteV1,
  publishArc9AtlasFavoriteFieldsV1,
  type Arc9AtlasFavoriteActionOutcomeV1,
} from '../apps/game/src/arc9-atlas-favorite-action.js';
import { prepareArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-projection.js';
import {
  createF4RuntimeAuthority,
  type F4RuntimeAuthority,
} from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;
const TARGET_ID = 'atlas:galaxy-parent-a:star-parent-a:world-488332735';

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Arc 9 Atlas favorite base save failed: ${imported.reason}`);
  return imported.state;
}

function atlasEntry(
  id: string,
  favorite: boolean,
  ordinal: number,
): [string, Record<string, unknown>] {
  return [id, {
    id,
    title: `Chart ${ordinal}`,
    sub: `Exact Atlas row ${ordinal}`,
    thumb: null,
    sq: ordinal % 2 === 0,
    badge: ordinal === 1 ? 'LIFE' : '',
    where: {
      gal: { x: 90 + ordinal, y: -60, seed: 999, size: 1500 },
      star: { x: ordinal, y: -ordinal, seed: 424242 + ordinal },
      pseed: 133 + ordinal,
      type: 'planet',
    },
    fav: favorite,
    t: NOW - ordinal,
    star: ordinal === 1 ? 'G' : '',
  }];
}

function atlasState(
  targetFavorite = false,
  unlocked: readonly string[] = [],
): SaveStateV2 {
  const state = baseState();
  state.logMap = [
    atlasEntry('atlas:unrelated-before', true, 0),
    atlasEntry(TARGET_ID, targetFavorite, 1),
    atlasEntry('atlas:unrelated-after', false, 2),
  ];
  state.unlocked = [...unlocked];
  state.stats = { ...state.stats, bestRank: 0 };
  return state;
}

async function fixture(
  state: SaveStateV2 = atlasState(),
  options: Readonly<{ failStorage?: boolean; duplicateReceipt?: boolean }> = {},
) {
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA9000006).state(),
  );
  const base = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') {
    throw new Error(`Arc 9 Atlas favorite fixture was ${migration.kind}`);
  }
  await base.apply(initial.operations);
  if (options.duplicateReceipt === true) {
    await base.apply([{
      store: 'receipts',
      key: 'receipt:0',
      value: JSON.stringify({
        ordinal: 0,
        kind: ARC9_ATLAS_FAVORITE_RECEIPT_KIND_V1,
        witness: 'preexisting-atlas-favorite-receipt',
      }),
    }]);
  }
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) {
          throw new Error('forced Arc 9 Atlas favorite storage failure');
        }
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
    ownerId: 'arc9-atlas-favorite-tab',
    token: 'arc9-atlas-favorite-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') {
    throw new Error(`Arc 9 Atlas favorite lease was ${heartbeat.kind}`);
  }
  return {
    backend,
    repository,
    runtime,
    state: initial.canonicalState,
    receiptCas: () => receiptCas,
  };
}

describe('Arc 9 Atlas favorite pure settlement', () => {
  it('changes only the exact target fav, joins Curator on false -> true, and reaches a fixed point', () => {
    const state = atlasState(false);
    const before = JSON.stringify(state);
    const beforeRows = structuredClone(state.logMap);
    const targetKeys = Object.keys(state.logMap[1]![1]);
    const result = prepareArc9AtlasFavoriteV1(state, TARGET_ID, true);
    expect(result).toMatchObject({
      kind: 'ready',
      operation: operationForArc9AtlasFavoriteV1(TARGET_ID),
      receiptKind: ARC9_ATLAS_FAVORITE_RECEIPT_KIND_V1,
      atlasId: TARGET_ID,
      targetIndex: 1,
      favoriteBefore: false,
      favoriteAfter: true,
      curatorAdded: true,
      priorUnlockedIds: [],
      nextUnlockedIds: ['curator'],
    });
    expect(JSON.stringify(state)).toBe(before);
    if (result.kind !== 'ready') return;
    expect(result.successorState.logMap).toHaveLength(3);
    expect(result.successorState.logMap[0]).toEqual(beforeRows[0]);
    expect(result.successorState.logMap[2]).toEqual(beforeRows[2]);
    expect(result.successorState.logMap[1]![1]).toEqual({
      ...beforeRows[1]![1], fav: true,
    });
    expect(Object.keys(result.successorState.logMap[1]![1])).toEqual(targetKeys);
    expect(result.sourceAtlasSeal).not.toBe(result.successorAtlasSeal);
    expect(prepareArc9ProgressionRefreshV1(result.successorState).kind).toBe('current');
  });

  it('makes unchanged values receipt-free and never infers Curator from imported fav:true', async () => {
    let commits = 0;
    const runtime = {
      async commitAction() {
        commits++;
        return { kind: 'lease-unavailable' as const };
      },
    };
    const importedFavorite = atlasState(true);
    const favorite = await commitArc9AtlasFavoriteV1({
      runtime, state: importedFavorite, atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(favorite).toMatchObject({
      kind: 'current', durability: 'none', favorite: true, transaction: null,
      projection: { unlockedIds: [] },
    });
    const ordinary = await commitArc9AtlasFavoriteV1({
      runtime, state: atlasState(false), atlasId: TARGET_ID, desired: false, codecNow: NOW,
    });
    expect(ordinary).toMatchObject({
      kind: 'current', durability: 'none', favorite: false, transaction: null,
    });
    expect(commits).toBe(0);
  });

  it('never removes Curator on true -> false and does not mint it when absent', () => {
    const permanent = prepareArc9AtlasFavoriteV1(
      atlasState(true, ['compat:retained', 'curator']),
      TARGET_ID,
      false,
    );
    expect(permanent).toMatchObject({
      kind: 'ready', favoriteBefore: true, favoriteAfter: false,
      curatorAdded: false, priorUnlockedIds: ['compat:retained', 'curator'],
      nextUnlockedIds: ['compat:retained', 'curator'],
    });
    const imported = prepareArc9AtlasFavoriteV1(atlasState(true), TARGET_ID, false);
    expect(imported).toMatchObject({
      kind: 'ready', favoriteBefore: true, favoriteAfter: false,
      curatorAdded: false, priorUnlockedIds: [], nextUnlockedIds: [],
    });
  });

  it('refuses forged ids, wrong exact parents, malformed/duplicate/capacity rows, and achievement capacity atomically', () => {
    const state = atlasState(false);
    const before = JSON.stringify(state);
    expect(prepareArc9AtlasFavoriteV1(state, '', true)).toEqual({
      kind: 'protected', reason: 'atlas-id-shape',
    });
    expect(prepareArc9AtlasFavoriteV1(state, TARGET_ID, 'true' as never)).toEqual({
      kind: 'protected', reason: 'desired-shape',
    });
    expect(prepareArc9AtlasFavoriteV1(
      state,
      'atlas:galaxy-parent-b:star-parent-b:world-488332735',
      true,
    )).toEqual({ kind: 'protected', reason: 'atlas-target-missing' });

    const malformed = atlasState(false);
    malformed.logMap[1]![1].fav = 'yes';
    expect(prepareArc9AtlasFavoriteV1(malformed, TARGET_ID, true)).toEqual({
      kind: 'protected', reason: 'atlas-target-shape',
    });
    const duplicate = atlasState(false);
    duplicate.logMap.push(atlasEntry(TARGET_ID, false, 4));
    expect(prepareArc9AtlasFavoriteV1(duplicate, TARGET_ID, true)).toEqual({
      kind: 'protected', reason: 'atlas-id-duplicate',
    });
    const overAtlasCapacity = atlasState(false);
    overAtlasCapacity.logMap = Array.from(
      { length: 121 },
      (_, index) => atlasEntry(`atlas:bounded:${index}`, false, index),
    );
    expect(prepareArc9AtlasFavoriteV1(
      overAtlasCapacity,
      'atlas:bounded:0',
      true,
    )).toEqual({ kind: 'protected', reason: 'atlas-capacity' });
    const fullAchievements = atlasState(false, Array.from(
      { length: MAX_UNLOCKED_ACHIEVEMENT_IDS },
      (_, index) => `compat:${index}`,
    ));
    expect(prepareArc9AtlasFavoriteV1(fullAchievements, TARGET_ID, true)).toEqual({
      kind: 'protected', reason: 'achievement:achievement-capacity',
    });
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('Arc 9 durable Atlas favorite transaction and publication', () => {
  it('commits exactly one receipt/CAS without RNG, reloads, publishes in place, and becomes receipt-free current', async () => {
    const test = await fixture();
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const callerBefore = JSON.stringify(test.state);
    const rngBefore = structuredClone(test.runtime.sessionRng);
    const outcome = await commitArc9AtlasFavoriteV1({
      runtime, state: test.state, atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      atlasId: TARGET_ID, targetIndex: 1,
      favoriteBefore: false, favoriteAfter: true, curatorAdded: true,
      priorUnlockedIds: [], nextUnlockedIds: ['curator'],
      transaction: {
        revision: 1,
        plan: { operation: operationForArc9AtlasFavoriteV1(TARGET_ID), receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_ATLAS_FAVORITE_RECEIPT_KIND_V1 },
      },
    });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    expect(JSON.stringify(test.state)).toBe(callerBefore);
    expect(test.runtime.sessionRng).toEqual({
      seed: rngBefore.seed,
      ordinal: rngBefore.ordinal + 1,
      draws: rngBefore.draws,
    });
    if (outcome.kind !== 'committed') return;
    expect(await test.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    const loaded = await readSaveV5(test.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.state.logMap[1]![1].fav).toBe(true);
      expect(loaded.state.unlocked).toContain('curator');
    }

    const live = test.state;
    const logIdentity = live.logMap;
    const pairIdentities = [...live.logMap];
    const entryIdentities = live.logMap.map(([, entry]) => entry);
    const routes = new WeakMap<object, string>(entryIdentities.map(
      (entry, index) => [entry, `route:${index}`] as const,
    ));
    const unrelatedBefore = structuredClone(live.logMap[0]);
    const unrelatedAfter = structuredClone(live.logMap[2]);
    publishArc9AtlasFavoriteFieldsV1(live, outcome);
    expect(live.logMap).toBe(logIdentity);
    pairIdentities.forEach((pair, index) => expect(live.logMap[index]).toBe(pair));
    entryIdentities.forEach((entry, index) => {
      expect(live.logMap[index]![1]).toBe(entry);
      expect(routes.get(entry)).toBe(`route:${index}`);
    });
    expect(live.logMap[1]![1].fav).toBe(true);
    expect(live.logMap[0]).toEqual(unrelatedBefore);
    expect(live.logMap[2]).toEqual(unrelatedAfter);
    expect(live.unlocked).toEqual(outcome.nextUnlockedIds);

    const second = await commitArc9AtlasFavoriteV1({
      runtime, state: outcome.transaction.state, atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(second).toMatchObject({ kind: 'current', durability: 'none', transaction: null });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    expect(await test.repository.readReceipt(1)).toBeUndefined();
    await test.runtime.release();
  });

  it('rejects stale, storage, duplicate, and lost outcomes once without optimistic mutation', async () => {
    const stale = await fixture();
    await stale.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'atlas-favorite-race', value: 'other-tab' }],
    });
    const staleBefore = JSON.stringify(stale.state);
    await expect(commitArc9AtlasFavoriteV1({
      runtime: stale.runtime, state: stale.state,
      atlasId: TARGET_ID, desired: true, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale', transaction: { kind: 'stale' },
    });
    expect(stale.receiptCas()).toBe(0);
    expect(await stale.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(stale.state)).toBe(staleBefore);
    await stale.runtime.release();

    const storage = await fixture(atlasState(), { failStorage: true });
    const storageBefore = JSON.stringify(storage.state);
    await expect(commitArc9AtlasFavoriteV1({
      runtime: storage.runtime, state: storage.state,
      atlasId: TARGET_ID, desired: true, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 9 Atlas favorite storage failure',
      transaction: { kind: 'storage-error' },
    });
    expect(storage.receiptCas()).toBe(1);
    expect(await storage.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(storage.state)).toBe(storageBefore);
    await storage.runtime.release();

    const duplicate = await fixture(atlasState(), { duplicateReceipt: true });
    const duplicateBefore = JSON.stringify(duplicate.state);
    await expect(commitArc9AtlasFavoriteV1({
      runtime: duplicate.runtime, state: duplicate.state,
      atlasId: TARGET_ID, desired: true, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:duplicate-receipt', transaction: { kind: 'duplicate-receipt' },
    });
    expect(JSON.stringify(duplicate.state)).toBe(duplicateBefore);
    expect((await duplicate.repository.readReceipt(0))?.witness)
      .toBe('preexisting-atlas-favorite-receipt');
    await duplicate.runtime.release();

    let lostCalls = 0;
    const lostRuntime = {
      async commitAction() {
        lostCalls++;
        return {
          kind: 'lost', reason: 'conflict', plan: {},
        } as unknown as Awaited<ReturnType<F4RuntimeAuthority['commitAction']>>;
      },
    };
    const lostState = atlasState();
    const lostBefore = JSON.stringify(lostState);
    await expect(commitArc9AtlasFavoriteV1({
      runtime: lostRuntime, state: lostState,
      atlasId: TARGET_ID, desired: true, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:lost:conflict', transaction: { kind: 'lost', reason: 'conflict' },
    });
    expect(lostCalls).toBe(1);
    expect(JSON.stringify(lostState)).toBe(lostBefore);
  });

  it('contains missing or altered postcommit evidence and refuses every live-parent drift before mutation', async () => {
    const missing = await fixture();
    const missingOutcome = await commitArc9AtlasFavoriteV1({
      runtime: {
        commitAction(input) {
          return missing.runtime.commitAction({
            ...input,
            derive: ({ draft }) => Object.freeze({
              state: draft,
              extensionWrites: Object.freeze([]),
              witness: 'missing-atlas-favorite-evidence',
            }),
          });
        },
      },
      state: missing.state, atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(missingOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-atlas-favorite-evidence-missing',
    });
    await missing.runtime.release();

    const altered = await fixture();
    const alteredOutcome = await commitArc9AtlasFavoriteV1({
      runtime: {
        async commitAction(input) {
          const result = await altered.runtime.commitAction(input);
          if (result.kind !== 'committed') return result;
          const state = structuredClone(result.state);
          state.logMap[0]![1].badge = 'FORGED';
          return Object.freeze({ ...result, state }) as Extract<
            Arc9AtlasFavoriteActionOutcomeV1,
            { readonly kind: 'committed' }
          >['transaction'];
        },
      },
      state: altered.state, atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(alteredOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-atlas-favorite-fixed-point-mismatch',
    });
    await altered.runtime.release();

    const exact = await fixture();
    const outcome = await commitArc9AtlasFavoriteV1({
      runtime: exact.runtime, state: exact.state,
      atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    for (const mutate of [
      (state: SaveStateV2) => { state.logMap[0]![1].badge = 'DRIFT'; },
      (state: SaveStateV2) => { state.logMap = [state.logMap[1]!, state.logMap[0]!, state.logMap[2]!]; },
      (state: SaveStateV2) => { state.logMap[1]![1].fav = true; },
      (state: SaveStateV2) => { state.unlocked = ['compat:drift']; },
    ]) {
      const wrong = structuredClone(exact.state);
      mutate(wrong);
      const before = JSON.stringify(wrong);
      const favoriteBefore = wrong.logMap.find(([id]) => id === TARGET_ID)?.[1].fav;
      expect(() => publishArc9AtlasFavoriteFieldsV1(wrong, outcome))
        .toThrow(/exact live parent/u);
      expect(JSON.stringify(wrong)).toBe(before);
      expect(wrong.logMap.find(([id]) => id === TARGET_ID)?.[1].fav).toBe(favoriteBefore);
    }
    const readonly = structuredClone(exact.state);
    Object.defineProperty(readonly.logMap[1]![1], 'fav', {
      value: false, enumerable: true, configurable: true, writable: false,
    });
    const readonlyBefore = JSON.stringify(readonly);
    expect(() => publishArc9AtlasFavoriteFieldsV1(readonly, outcome))
      .toThrow(/not writable and exact/u);
    expect(JSON.stringify(readonly)).toBe(readonlyBefore);
    await exact.runtime.release();
  });
});

describe('Arc 9 Atlas favorite dependency sentinel', () => {
  it('stays browser-free, route-free, clock-free, entropy-free, and disconnected from Main', () => {
    const source = fs.readFileSync(path.join(
      here, '..', 'apps', 'game', 'src', 'arc9-atlas-favorite-action.ts',
    ), 'utf8');
    expect(source).not.toMatch(/from ['"]\.\/main\.js['"]/u);
    expect(source).not.toMatch(/\bdocument\s*\.|\bwindow\s*\.|\blocalStorage\b/u);
    expect(source).not.toMatch(/\bMath\s*\.\s*random\s*\(|\bDate\s*\.\s*now\s*\(/u);
    expect(source).not.toMatch(/CanonicalCF1|savedView|atlasWhere|routeFor/u);
  });
});
