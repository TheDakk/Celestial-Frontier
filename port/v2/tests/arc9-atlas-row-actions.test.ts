import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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
  ARC9_ATLAS_HOME_RECEIPT_KIND_V1,
  ARC9_ATLAS_REMOVE_RECEIPT_KIND_V1,
  ARC9_ATLAS_UNDO_RECEIPT_KIND_V1,
  commitArc9AtlasHomeV1,
  commitArc9AtlasRemoveV1,
  commitArc9AtlasUndoV1,
  operationForArc9AtlasHomeV1,
  operationForArc9AtlasRemoveV1,
  operationForArc9AtlasUndoV1,
  prepareArc9AtlasHomeV1,
  prepareArc9AtlasRemoveV1,
  prepareArc9AtlasUndoV1,
  publishArc9AtlasHomeFieldsV1,
  publishArc9AtlasRemoveFieldsV1,
  publishArc9AtlasUndoFieldsV1,
  type Arc9AtlasRemoveActionOutcomeV1,
} from '../apps/game/src/arc9-atlas-row-actions.js';
import {
  createF4RuntimeAuthority,
  type F4RuntimeAuthority,
} from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;
const BEFORE_ID = 'atlas:before';
const TARGET_ID = 'atlas:target';
const AFTER_ID = 'atlas:after';

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Arc 9 Atlas row base save failed: ${imported.reason}`);
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
    badge: ordinal === 1 ? 'Life' : '',
    where: {
      gal: { x: 90 + ordinal, y: -60, seed: 999, size: 1_500 },
      star: { x: ordinal, y: -ordinal, seed: 424_242 + ordinal },
      pseed: 133 + ordinal,
      type: 'planet',
    },
    fav: favorite,
    t: NOW - ordinal,
    star: ordinal === 1 ? 'G' : '',
    retained: { ordinal, nested: [`row:${ordinal}`] },
  }];
}

function atlasState(homeId: string | null = BEFORE_ID): SaveStateV2 {
  const state = baseState();
  state.logMap = [
    atlasEntry(BEFORE_ID, true, 0),
    atlasEntry(TARGET_ID, false, 1),
    atlasEntry(AFTER_ID, false, 2),
  ];
  state.homeId = homeId;
  return state;
}

type ActionKind = 'home' | 'remove';

async function fixture(
  state: SaveStateV2 = atlasState(),
  options: Readonly<{
    failStorage?: boolean;
    duplicateReceipt?: ActionKind;
  }> = {},
) {
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA9000007).state(),
  );
  const base = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') {
    throw new Error(`Arc 9 Atlas row fixture was ${migration.kind}`);
  }
  await base.apply(initial.operations);
  if (options.duplicateReceipt !== undefined) {
    await base.apply([{
      store: 'receipts',
      key: 'receipt:0',
      value: JSON.stringify({
        ordinal: 0,
        kind: options.duplicateReceipt === 'home'
          ? ARC9_ATLAS_HOME_RECEIPT_KIND_V1 : ARC9_ATLAS_REMOVE_RECEIPT_KIND_V1,
        witness: 'preexisting-atlas-row-receipt',
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
          throw new Error('forced Arc 9 Atlas row storage failure');
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
    ownerId: 'arc9-atlas-row-tab',
    token: 'arc9-atlas-row-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Arc 9 Atlas row lease was ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state: initial.canonicalState,
    receiptCas: () => receiptCas,
  };
}

describe('Arc 9 Atlas Home and Remove pure settlement', () => {
  it('sets, switches, and clears only exact Home while unchanged requests are receipt-free', async () => {
    const state = atlasState(BEFORE_ID);
    const before = JSON.stringify(state);
    const rows = structuredClone(state.logMap);
    const set = prepareArc9AtlasHomeV1(state, TARGET_ID, true);
    expect(set).toMatchObject({
      kind: 'ready',
      action: 'home',
      operation: operationForArc9AtlasHomeV1(TARGET_ID),
      receiptKind: ARC9_ATLAS_HOME_RECEIPT_KIND_V1,
      targetIndex: 1,
      desired: true,
      homeIdBefore: BEFORE_ID,
      homeIdAfter: TARGET_ID,
    });
    expect(JSON.stringify(state)).toBe(before);
    if (set.kind !== 'ready') return;
    expect(set.successorState.logMap).toEqual(rows);
    expect(set.sourceRowsSeal).toBe(set.successorRowsSeal);
    expect(set.sourceStateSeal).not.toBe(set.successorStateSeal);

    const clear = prepareArc9AtlasHomeV1(set.successorState, TARGET_ID, false);
    expect(clear).toMatchObject({
      kind: 'ready', homeIdBefore: TARGET_ID, homeIdAfter: null,
    });
    const nonHomeClear = prepareArc9AtlasHomeV1(state, TARGET_ID, false);
    expect(nonHomeClear).toMatchObject({
      kind: 'current', desired: false, homeId: BEFORE_ID,
    });

    let commits = 0;
    const current = await commitArc9AtlasHomeV1({
      runtime: { async commitAction() {
        commits++;
        return { kind: 'lease-unavailable' } as const;
      } },
      state, atlasId: TARGET_ID, desired: false, codecNow: NOW,
    });
    expect(current).toMatchObject({ kind: 'current', durability: 'none', transaction: null });
    expect(commits).toBe(0);
  });

  it('removes one exact row, preserves every surviving field/order, and clears Home iff target', () => {
    const targetHome = atlasState(TARGET_ID);
    const before = JSON.stringify(targetHome);
    const sourceRows = structuredClone(targetHome.logMap);
    const removed = prepareArc9AtlasRemoveV1(targetHome, TARGET_ID);
    expect(removed).toMatchObject({
      kind: 'ready',
      action: 'remove',
      operation: operationForArc9AtlasRemoveV1(TARGET_ID),
      receiptKind: ARC9_ATLAS_REMOVE_RECEIPT_KIND_V1,
      targetIndex: 1,
      homeIdBefore: TARGET_ID,
      homeIdAfter: null,
      countBefore: 3,
      countAfter: 2,
    });
    expect(JSON.stringify(targetHome)).toBe(before);
    if (removed.kind !== 'ready') return;
    expect(removed.successorState.logMap).toEqual([sourceRows[0], sourceRows[2]]);
    expect(removed.successorState.homeId).toBeNull();

    const otherHome = prepareArc9AtlasRemoveV1(atlasState(BEFORE_ID), TARGET_ID);
    expect(otherHome).toMatchObject({
      kind: 'ready', homeIdBefore: BEFORE_ID, homeIdAfter: BEFORE_ID,
    });
    if (otherHome.kind === 'ready') expect(otherHome.successorState.homeId).toBe(BEFORE_ID);
  });

  it('protects malformed, duplicate, missing, over-capacity, accessor, and invalid-home parents atomically', () => {
    const state = atlasState();
    const before = JSON.stringify(state);
    expect(prepareArc9AtlasHomeV1(state, '', true)).toEqual({
      kind: 'protected', reason: 'atlas-id-shape',
    });
    expect(prepareArc9AtlasHomeV1(state, TARGET_ID, 'yes' as never)).toEqual({
      kind: 'protected', reason: 'desired-shape',
    });
    expect(prepareArc9AtlasRemoveV1(state, 'atlas:missing')).toEqual({
      kind: 'protected', reason: 'atlas-target-missing',
    });

    const malformed = atlasState();
    malformed.logMap[1]![1].fav = 'yes';
    expect(prepareArc9AtlasRemoveV1(malformed, TARGET_ID)).toEqual({
      kind: 'protected', reason: 'atlas-target-shape',
    });
    const duplicate = atlasState();
    duplicate.logMap.push(atlasEntry(TARGET_ID, false, 4));
    expect(prepareArc9AtlasHomeV1(duplicate, TARGET_ID, true)).toEqual({
      kind: 'protected', reason: 'atlas-id-duplicate',
    });
    const invalidHome = atlasState('atlas:missing');
    expect(prepareArc9AtlasRemoveV1(invalidHome, TARGET_ID)).toEqual({
      kind: 'protected', reason: 'atlas-home-shape',
    });
    const overCapacity = atlasState(null);
    overCapacity.logMap = Array.from(
      { length: 121 },
      (_, index) => atlasEntry(`atlas:bounded:${index}`, false, index),
    );
    expect(prepareArc9AtlasRemoveV1(overCapacity, 'atlas:bounded:0')).toEqual({
      kind: 'protected', reason: 'atlas-capacity',
    });
    const accessor = atlasState();
    Object.defineProperty(accessor.logMap[1]![1], 'fav', {
      get: () => false, enumerable: true, configurable: true,
    });
    expect(prepareArc9AtlasHomeV1(accessor, TARGET_ID, true)).toEqual({
      kind: 'protected', reason: 'state-shape',
    });
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('Arc 9 durable Atlas Home and Remove transaction and publication', () => {
  it('commits Home exactly once without RNG or optimistic mutation, reloads, and publishes only homeId', async () => {
    const test = await fixture(atlasState(BEFORE_ID));
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const callerBefore = JSON.stringify(test.state);
    const rngBefore = structuredClone(test.runtime.sessionRng);
    const outcome = await commitArc9AtlasHomeV1({
      runtime, state: test.state, atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      plan: {
        action: 'home', targetIndex: 1,
        homeIdBefore: BEFORE_ID, homeIdAfter: TARGET_ID,
      },
      transaction: {
        revision: 1,
        plan: { operation: operationForArc9AtlasHomeV1(TARGET_ID), receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_ATLAS_HOME_RECEIPT_KIND_V1 },
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
    if (loaded.kind === 'loaded') expect(loaded.state.homeId).toBe(TARGET_ID);

    const live = test.state;
    const rows = live.logMap;
    const pairs = [...rows];
    const entries = rows.map(([, entry]) => entry);
    const routes = new WeakMap<object, string>(entries.map(
      (entryValue, index) => [entryValue, `route:${index}`] as const,
    ));
    publishArc9AtlasHomeFieldsV1(live, outcome);
    expect(live.homeId).toBe(TARGET_ID);
    expect(live.logMap).toBe(rows);
    pairs.forEach((pair, index) => expect(live.logMap[index]).toBe(pair));
    entries.forEach((entryValue, index) => {
      expect(live.logMap[index]![1]).toBe(entryValue);
      expect(routes.get(entryValue)).toBe(`route:${index}`);
    });

    const second = await commitArc9AtlasHomeV1({
      runtime, state: outcome.transaction.state,
      atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(second).toMatchObject({ kind: 'current', durability: 'none', transaction: null });
    expect(commitCalls).toBe(1);
    expect(await test.repository.readReceipt(1)).toBeUndefined();
    await test.runtime.release();
  });

  it('commits Remove once, then Undo once at the original index with the retained exact route identity', async () => {
    const test = await fixture(atlasState(TARGET_ID));
    const callerBefore = JSON.stringify(test.state);
    const rngBefore = structuredClone(test.runtime.sessionRng);
    const outcome = await commitArc9AtlasRemoveV1({
      runtime: test.runtime, state: test.state, atlasId: TARGET_ID, codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      plan: {
        action: 'remove', targetIndex: 1,
        homeIdBefore: TARGET_ID, homeIdAfter: null,
        countBefore: 3, countAfter: 2,
      },
      transaction: {
        revision: 1,
        plan: { operation: operationForArc9AtlasRemoveV1(TARGET_ID), receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_ATLAS_REMOVE_RECEIPT_KIND_V1 },
      },
    });
    expect(test.receiptCas()).toBe(1);
    expect(JSON.stringify(test.state)).toBe(callerBefore);
    expect(test.runtime.sessionRng).toEqual({
      seed: rngBefore.seed,
      ordinal: rngBefore.ordinal + 1,
      draws: rngBefore.draws,
    });
    if (outcome.kind !== 'committed') return;
    expect(Object.isFrozen(outcome.undoReceipt)).toBe(true);
    expect(outcome.undoReceipt).toMatchObject({
      schema: 'cf-v2-arc9-atlas-delete-receipt/v1',
      removeOperation: operationForArc9AtlasRemoveV1(TARGET_ID),
      removeReceiptOrdinal: 0,
      removeWitness: outcome.witness,
      atlasId: TARGET_ID,
      targetIndex: 1,
      countAfterDelete: 2,
      homeIdBeforeDelete: TARGET_ID,
      homeIdAfterDelete: null,
      wasHome: true,
    });
    expect(operationForArc9AtlasUndoV1(outcome.undoReceipt)).toMatch(
      /^arc9\.atlas-undo:[a-f0-9]{64}$/u,
    );
    const undoPlan = prepareArc9AtlasUndoV1(
      outcome.transaction.state, outcome.undoReceipt,
    );
    expect(undoPlan).toMatchObject({
      kind: 'ready', action: 'undo', targetIndex: 1,
      homeIdBefore: null, homeIdAfter: TARGET_ID,
      countBefore: 2, countAfter: 3,
    });
    if (undoPlan.kind === 'ready') {
      expect(undoPlan.successorState.logMap.map(([id]) => id))
        .toEqual([BEFORE_ID, TARGET_ID, AFTER_ID]);
    }
    const loaded = await readSaveV5(test.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.state.logMap.map(([id]) => id)).toEqual([BEFORE_ID, AFTER_ID]);
      expect(loaded.state.homeId).toBeNull();
    }

    const live = test.state;
    const rows = live.logMap;
    const beforePair = rows[0]!;
    const beforeEntry = beforePair[1];
    const targetPair = rows[1]!;
    const targetEntry = targetPair[1];
    const afterPair = rows[2]!;
    const afterEntry = afterPair[1];
    const routes = new WeakMap<object, string>([
      [beforeEntry, 'before'], [targetEntry, 'target'], [afterEntry, 'after'],
    ]);
    publishArc9AtlasRemoveFieldsV1(live, outcome);
    expect(live.logMap).toBe(rows);
    expect(live.logMap).toHaveLength(2);
    expect(live.logMap[0]).toBe(beforePair);
    expect(live.logMap[1]).toBe(afterPair);
    expect(routes.get(live.logMap[0]![1])).toBe('before');
    expect(routes.get(live.logMap[1]![1])).toBe('after');
    expect(live.logMap.some(([, entryValue]) => entryValue === targetEntry)).toBe(false);
    expect(live.homeId).toBeNull();

    const undoCallerBefore = JSON.stringify(outcome.transaction.state);
    const undoRngBefore = structuredClone(test.runtime.sessionRng);
    const undoOutcome = await commitArc9AtlasUndoV1({
      runtime: test.runtime,
      state: outcome.transaction.state,
      deleteReceipt: outcome.undoReceipt,
      codecNow: NOW,
    });
    expect(undoOutcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      plan: { action: 'undo', targetIndex: 1, homeIdAfter: TARGET_ID },
      transaction: {
        revision: 2,
        plan: {
          operation: operationForArc9AtlasUndoV1(outcome.undoReceipt),
          receiptOrdinal: 1,
        },
        receipt: { ordinal: 1, kind: ARC9_ATLAS_UNDO_RECEIPT_KIND_V1 },
      },
    });
    expect(test.receiptCas()).toBe(2);
    expect(JSON.stringify(outcome.transaction.state)).toBe(undoCallerBefore);
    expect(test.runtime.sessionRng).toEqual({
      seed: undoRngBefore.seed,
      ordinal: undoRngBefore.ordinal + 1,
      draws: undoRngBefore.draws,
    });
    if (undoOutcome.kind !== 'committed') return;
    const undoLoaded = await readSaveV5(test.backend, REGISTRY, NOW);
    expect(undoLoaded.kind).toBe('loaded');
    if (undoLoaded.kind === 'loaded') {
      expect(undoLoaded.state.logMap.map(([id]) => id))
        .toEqual([BEFORE_ID, TARGET_ID, AFTER_ID]);
      expect(undoLoaded.state.homeId).toBe(TARGET_ID);
    }
    const wrongPair = structuredClone(targetPair);
    wrongPair[1].title = 'Forged retained route row';
    const beforeWrongPublication = JSON.stringify(live);
    expect(() => publishArc9AtlasUndoFieldsV1(live, undoOutcome, wrongPair))
      .toThrow(/exact current successor and retained pair/u);
    expect(JSON.stringify(live)).toBe(beforeWrongPublication);
    publishArc9AtlasUndoFieldsV1(live, undoOutcome, targetPair);
    expect(live.logMap).toBe(rows);
    expect(live.logMap).toHaveLength(3);
    expect(live.logMap[0]).toBe(beforePair);
    expect(live.logMap[1]).toBe(targetPair);
    expect(live.logMap[2]).toBe(afterPair);
    expect(routes.get(live.logMap[1]![1])).toBe('target');
    expect(live.homeId).toBe(TARGET_ID);
    expect(prepareArc9AtlasUndoV1(undoOutcome.transaction.state, outcome.undoReceipt))
      .toEqual({ kind: 'protected', reason: 'undo-successor-mismatch' });
    await test.runtime.release();
  });

  it.each(['home', 'remove'] as const)(
    'contains stale and storage %s outcomes once without optimistic mutation',
    async (kind) => {
      const stale = await fixture(atlasState(kind === 'remove' ? TARGET_ID : BEFORE_ID));
      await stale.repository.mutate({
        expectedRevision: 0,
        writes: [{ store: 'player', key: `atlas-${kind}-race`, value: 'other-tab' }],
      });
      const staleBefore = JSON.stringify(stale.state);
      const staleOutcome = kind === 'home'
        ? await commitArc9AtlasHomeV1({
          runtime: stale.runtime, state: stale.state,
          atlasId: TARGET_ID, desired: true, codecNow: NOW,
        })
        : await commitArc9AtlasRemoveV1({
          runtime: stale.runtime, state: stale.state, atlasId: TARGET_ID, codecNow: NOW,
        });
      expect(staleOutcome).toMatchObject({
        kind: 'refused', durability: 'none', convergence: 'read-only-reload',
        detail: 'transaction:stale', transaction: { kind: 'stale' },
      });
      expect(stale.receiptCas()).toBe(0);
      expect(JSON.stringify(stale.state)).toBe(staleBefore);
      await stale.runtime.release();

      const storage = await fixture(
        atlasState(kind === 'remove' ? TARGET_ID : BEFORE_ID),
        { failStorage: true },
      );
      const storageBefore = JSON.stringify(storage.state);
      const storageOutcome = kind === 'home'
        ? await commitArc9AtlasHomeV1({
          runtime: storage.runtime, state: storage.state,
          atlasId: TARGET_ID, desired: true, codecNow: NOW,
        })
        : await commitArc9AtlasRemoveV1({
          runtime: storage.runtime, state: storage.state, atlasId: TARGET_ID, codecNow: NOW,
        });
      expect(storageOutcome).toMatchObject({
        kind: 'refused', durability: 'none', convergence: 'read-only-reload',
        detail: 'transaction:forced Arc 9 Atlas row storage failure',
        transaction: { kind: 'storage-error' },
      });
      expect(storage.receiptCas()).toBe(1);
      expect(JSON.stringify(storage.state)).toBe(storageBefore);
      await storage.runtime.release();
    },
  );

  it('expires Undo after any intervening Atlas mutation and contains stale Undo once', async () => {
    const test = await fixture(atlasState(TARGET_ID));
    const removed = await commitArc9AtlasRemoveV1({
      runtime: test.runtime, state: test.state, atlasId: TARGET_ID, codecNow: NOW,
    });
    expect(removed.kind).toBe('committed');
    if (removed.kind !== 'committed') return;
    expect(prepareArc9AtlasUndoV1(removed.transaction.state, {
      ...removed.undoReceipt,
      removedPairJson: `${removed.undoReceipt.removedPairJson} `,
    })).toEqual({ kind: 'protected', reason: 'undo-receipt-shape' });

    for (const mutate of [
      (state: SaveStateV2) => { state.logMap[0]![1].fav = false; },
      (state: SaveStateV2) => { state.homeId = BEFORE_ID; },
      (state: SaveStateV2) => { state.logMap.push(atlasEntry('atlas:next', false, 4)); },
    ]) {
      const advanced = structuredClone(removed.transaction.state);
      mutate(advanced);
      expect(prepareArc9AtlasUndoV1(advanced, removed.undoReceipt))
        .toEqual({ kind: 'protected', reason: 'undo-successor-mismatch' });
    }

    await test.repository.mutate({
      expectedRevision: 1,
      writes: [{ store: 'player', key: 'atlas-undo-race', value: 'other-tab' }],
    });
    const callerBefore = JSON.stringify(removed.transaction.state);
    const stale = await commitArc9AtlasUndoV1({
      runtime: test.runtime,
      state: removed.transaction.state,
      deleteReceipt: removed.undoReceipt,
      codecNow: NOW,
    });
    expect(stale).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale', transaction: { kind: 'stale' },
    });
    expect(test.receiptCas()).toBe(1);
    expect(JSON.stringify(removed.transaction.state)).toBe(callerBefore);
    await test.runtime.release();
  });

  it('contains missing and altered postcommit evidence and rejects live-parent drift before mutation', async () => {
    const missing = await fixture(atlasState(BEFORE_ID));
    const missingOutcome = await commitArc9AtlasHomeV1({
      runtime: {
        commitAction(input) {
          return missing.runtime.commitAction({
            ...input,
            derive: ({ draft }) => Object.freeze({
              state: draft,
              extensionWrites: Object.freeze([]),
              witness: 'missing-atlas-home-evidence',
            }),
          });
        },
      },
      state: missing.state, atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(missingOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-atlas-row-evidence-missing',
    });
    await missing.runtime.release();

    const altered = await fixture(atlasState(TARGET_ID));
    const alteredOutcome = await commitArc9AtlasRemoveV1({
      runtime: {
        async commitAction(input) {
          const result = await altered.runtime.commitAction(input);
          if (result.kind !== 'committed') return result;
          const state = structuredClone(result.state);
          state.logMap[0]![1].badge = 'FORGED';
          return Object.freeze({ ...result, state }) as Extract<
            Arc9AtlasRemoveActionOutcomeV1,
            { readonly kind: 'committed' }
          >['transaction'];
        },
      },
      state: altered.state, atlasId: TARGET_ID, codecNow: NOW,
    });
    expect(alteredOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-atlas-row-fixed-point-mismatch',
    });
    await altered.runtime.release();

    const exactHome = await fixture(atlasState(BEFORE_ID));
    const homeOutcome = await commitArc9AtlasHomeV1({
      runtime: exactHome.runtime, state: exactHome.state,
      atlasId: TARGET_ID, desired: true, codecNow: NOW,
    });
    expect(homeOutcome.kind).toBe('committed');
    if (homeOutcome.kind === 'committed') {
      const drift = structuredClone(exactHome.state);
      drift.logMap[0]![1].badge = 'DRIFT';
      const before = JSON.stringify(drift);
      expect(() => publishArc9AtlasHomeFieldsV1(drift, homeOutcome))
        .toThrow(/exact live parent/u);
      expect(JSON.stringify(drift)).toBe(before);

      const readonlyHome = structuredClone(exactHome.state);
      Object.defineProperty(readonlyHome, 'homeId', {
        value: BEFORE_ID, enumerable: true, configurable: true, writable: false,
      });
      const readonlyBefore = JSON.stringify(readonlyHome);
      expect(() => publishArc9AtlasHomeFieldsV1(readonlyHome, homeOutcome))
        .toThrow(/exact live parent/u);
      expect(JSON.stringify(readonlyHome)).toBe(readonlyBefore);
    }
    await exactHome.runtime.release();

    const exactRemove = await fixture(atlasState(TARGET_ID));
    const removeOutcome = await commitArc9AtlasRemoveV1({
      runtime: exactRemove.runtime, state: exactRemove.state,
      atlasId: TARGET_ID, codecNow: NOW,
    });
    expect(removeOutcome.kind).toBe('committed');
    if (removeOutcome.kind === 'committed') {
      const readonlyRows = structuredClone(exactRemove.state);
      Object.defineProperty(readonlyRows.logMap, '1', {
        value: readonlyRows.logMap[1], enumerable: true, configurable: true, writable: false,
      });
      const readonlyBefore = JSON.stringify(readonlyRows);
      expect(() => publishArc9AtlasRemoveFieldsV1(readonlyRows, removeOutcome))
        .toThrow(/writable exact row list/u);
      expect(JSON.stringify(readonlyRows)).toBe(readonlyBefore);
    }
    await exactRemove.runtime.release();
  });

  it.each(['home', 'remove'] as const)(
    'converges one duplicate/lost %s result without retrying',
    async (kind) => {
      const duplicate = await fixture(
        atlasState(kind === 'remove' ? TARGET_ID : BEFORE_ID),
        { duplicateReceipt: kind },
      );
      const outcome = kind === 'home'
        ? await commitArc9AtlasHomeV1({
          runtime: duplicate.runtime, state: duplicate.state,
          atlasId: TARGET_ID, desired: true, codecNow: NOW,
        })
        : await commitArc9AtlasRemoveV1({
          runtime: duplicate.runtime, state: duplicate.state, atlasId: TARGET_ID, codecNow: NOW,
        });
      expect(outcome).toMatchObject({
        kind: 'refused', durability: 'none', convergence: 'read-only-reload',
        detail: 'transaction:duplicate-receipt',
      });
      await duplicate.runtime.release();

      let calls = 0;
      const lostRuntime = {
        async commitAction() {
          calls++;
          return { kind: 'lost', reason: 'conflict', plan: {} } as unknown as Awaited<
            ReturnType<F4RuntimeAuthority['commitAction']>
          >;
        },
      };
      const state = atlasState(kind === 'remove' ? TARGET_ID : BEFORE_ID);
      const before = JSON.stringify(state);
      const lost = kind === 'home'
        ? await commitArc9AtlasHomeV1({
          runtime: lostRuntime, state, atlasId: TARGET_ID, desired: true, codecNow: NOW,
        })
        : await commitArc9AtlasRemoveV1({
          runtime: lostRuntime, state, atlasId: TARGET_ID, codecNow: NOW,
        });
      expect(lost).toMatchObject({
        kind: 'refused', durability: 'none', convergence: 'read-only-reload',
        detail: 'transaction:lost:conflict',
      });
      expect(calls).toBe(1);
      expect(JSON.stringify(state)).toBe(before);
    },
  );
});

describe('Arc 9 Atlas row dependency sentinel', () => {
  it('stays browser-free, route-free, clock-free, entropy-free, and disconnected from Main', () => {
    const source = fs.readFileSync(path.join(
      here, '..', 'apps', 'game', 'src', 'arc9-atlas-row-actions.ts',
    ), 'utf8');
    expect(source).not.toMatch(/from ['"]\.\/main\.js['"]/u);
    expect(source).not.toMatch(/\bdocument\s*\.|\bwindow\s*\.|\blocalStorage\b/u);
    expect(source).not.toMatch(/\bMath\s*\.\s*random\s*\(|\bDate\s*\.\s*now\s*\(/u);
    expect(source).not.toMatch(/CanonicalCF1|savedView|atlasWhere|routeFor/u);
  });
});
