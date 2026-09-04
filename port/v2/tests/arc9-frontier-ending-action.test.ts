import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { PRIME_SIGNATURES_V1 } from '@cf/domain-combatcore';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readSaveV5,
  type CodexEntry,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  ARC9_FRONTIER_ENDING_OPERATION_V1,
  ARC9_FRONTIER_ENDING_RECEIPT_KIND_V1,
  commitArc9FrontierEndingChoiceV1,
  prepareArc9FrontierEndingChoiceV1,
} from '../apps/game/src/arc9-frontier-ending-action.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;

function baseState(complete = true): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Frontier ending base save failed: ${imported.reason}`);
  if (complete) {
    for (const signature of PRIME_SIGNATURES_V1) {
      imported.state.primeFill[signature.id] = {
        title: signature.guardianName,
        sub: signature.signatureName,
        tier: signature.tier,
        hex: '#9fb6d6',
        where: null,
      };
    }
    imported.state.frontierUnlocked = true;
  }
  return imported.state;
}

function unlockBalance(state: SaveStateV2): SaveStateV2 {
  state.conquered = Array.from({ length: 3 }, (_, index) => [
    index + 1, { t: 0, tier: 1 },
  ]);
  state.codex = Array.from({ length: 40 }, (_, index): [string, CodexEntry] => {
    const id = `species-${index}`;
    return [id, {
      id, name: `Species ${index}`, kind: 'fauna', tier: null,
      realm: 'material', sapient: 0, from: 'test', hybrid: false, g: {}, where: null,
    }];
  });
  return state;
}

async function fixture(options: Readonly<{
  failStorage?: boolean;
  configureState?: (state: SaveStateV2) => void;
}> = {}) {
  const state = baseState();
  options.configureState?.(state);
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA9000009).state(),
  );
  const base = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`Frontier ending fixture was ${migration.kind}`);
  await base.apply(initial.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) throw new Error('forced Frontier ending storage failure');
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
    ownerId: 'arc9-ending-tab',
    token: 'arc9-ending-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Frontier ending lease was ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state: initial.canonicalState,
    receiptCas: () => receiptCas,
  };
}

describe('Arc 9 Frontier ending preparation', () => {
  it('prepares each exact imported ending id without mutating the caller', () => {
    for (const endingId of ['conquer', 'protect', 'terraform', 'preserve'] as const) {
      const state = baseState();
      const before = JSON.stringify(state);
      expect(prepareArc9FrontierEndingChoiceV1(state, endingId)).toMatchObject({
        kind: 'ready', endingId, successorState: { frontierEnding: endingId },
        successor: { frontier: { kind: 'chosen', ending: { id: endingId } } },
      });
      expect(JSON.stringify(state)).toBe(before);
    }
  });

  it('enforces locked, Balance, unknown, and one-choice protection', () => {
    expect(prepareArc9FrontierEndingChoiceV1(baseState(false), 'conquer')).toEqual({
      kind: 'protected', reason: 'frontier-locked',
    });
    expect(prepareArc9FrontierEndingChoiceV1(baseState(), 'balance')).toEqual({
      kind: 'protected', reason: 'balance-locked',
    });
    expect(prepareArc9FrontierEndingChoiceV1(unlockBalance(baseState()), 'balance')).toMatchObject({
      kind: 'ready', endingId: 'balance',
      successor: { frontier: { kind: 'chosen', ending: { id: 'balance' } } },
    });
    expect(prepareArc9FrontierEndingChoiceV1(baseState(), 'future-path')).toEqual({
      kind: 'protected', reason: 'ending-id-malformed',
    });
    const protectedImport = baseState();
    protectedImport.frontierEnding = 'future-path';
    expect(prepareArc9FrontierEndingChoiceV1(protectedImport, 'conquer')).toEqual({
      kind: 'protected', reason: 'frontier-ending-unknown',
    });
    const chosen = baseState();
    chosen.frontierEnding = 'protect';
    expect(prepareArc9FrontierEndingChoiceV1(chosen, 'protect')).toMatchObject({
      kind: 'current', endingId: 'protect',
    });
    expect(prepareArc9FrontierEndingChoiceV1(chosen, 'conquer')).toEqual({
      kind: 'protected', reason: 'ending-already-chosen',
    });
  });
});

describe('Arc 9 Frontier ending transaction', () => {
  it('commits the codec-canonical ending state when an unrelated veteran mining stamp moves', async () => {
    const test = await fixture({
      configureState(state) {
        state.mined = [['veteran-clock-floor', NOW - 30 * 6e5]];
        state.mineX = [['veteran-clock-floor', 1]];
      },
    });
    const before = JSON.stringify(test.state);
    const outcome = await commitArc9FrontierEndingChoiceV1({
      runtime: test.runtime,
      state: test.state,
      requestedEndingId: 'conquer',
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

  it('commits one receipt/CAS, reopens fixed, and treats replay as current', async () => {
    const test = await fixture();
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const callerBefore = JSON.stringify(test.state);
    const outcome = await commitArc9FrontierEndingChoiceV1({
      runtime,
      state: test.state,
      requestedEndingId: 'conquer',
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      endingId: 'conquer',
      transaction: {
        revision: 1,
        plan: { operation: ARC9_FRONTIER_ENDING_OPERATION_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_FRONTIER_ENDING_RECEIPT_KIND_V1 },
        state: { frontierEnding: 'conquer' },
      },
    });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    expect(JSON.stringify(test.state)).toBe(callerBefore);
    expect(await test.repository.readReceipt(0)).toEqual(
      outcome.kind === 'committed' ? outcome.transaction.receipt : null,
    );
    const loaded = await readSaveV5(test.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') expect(loaded.state.frontierEnding).toBe('conquer');
    if (outcome.kind !== 'committed') return;
    const replay = await commitArc9FrontierEndingChoiceV1({
      runtime,
      state: outcome.transaction.state,
      requestedEndingId: 'conquer',
      codecNow: NOW,
    });
    expect(replay).toMatchObject({ kind: 'current', durability: 'none', transaction: null });
    expect(commitCalls).toBe(1);
    expect(await test.repository.readReceipt(1)).toBeUndefined();
    await test.runtime.release();
  });

  it('rejects unavailable and protected inputs before invoking a writer', async () => {
    let commitCalls = 0;
    const runtime = {
      async commitAction() {
        commitCalls++;
        return { kind: 'lease-unavailable' as const };
      },
    };
    await expect(commitArc9FrontierEndingChoiceV1({
      runtime, state: baseState(false), requestedEndingId: 'conquer', codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:frontier-locked', transaction: null,
    });
    await expect(commitArc9FrontierEndingChoiceV1({
      runtime, state: baseState(), requestedEndingId: 'balance', codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:balance-locked', transaction: null,
    });
    const future = baseState();
    future.frontierEnding = 'future-path';
    await expect(commitArc9FrontierEndingChoiceV1({
      runtime, state: future, requestedEndingId: 'protect', codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:frontier-ending-unknown', transaction: null,
    });
    expect(commitCalls).toBe(0);
  });

  it('fails one stale CAS without retry, receipt, or optimistic mutation', async () => {
    const test = await fixture();
    const before = JSON.stringify(test.state);
    await test.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'arc9-ending-race', value: 'other-tab' }],
    });
    const outcome = await commitArc9FrontierEndingChoiceV1({
      runtime: test.runtime,
      state: test.state,
      requestedEndingId: 'terraform',
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(test.receiptCas()).toBe(0);
    expect(await test.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(test.state)).toBe(before);
  });

  it('contains storage failure and committed evidence ambiguity without publishing', async () => {
    const failed = await fixture({ failStorage: true });
    const failedBefore = JSON.stringify(failed.state);
    await expect(commitArc9FrontierEndingChoiceV1({
      runtime: failed.runtime,
      state: failed.state,
      requestedEndingId: 'preserve',
      codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced Frontier ending storage failure',
    });
    expect(await failed.repository.revision()).toBe(0);
    expect(await failed.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(failed.state)).toBe(failedBefore);

    const ambiguous = await fixture();
    const outcome = await commitArc9FrontierEndingChoiceV1({
      runtime: {
        async commitAction(input) {
          const committed = await ambiguous.runtime.commitAction(input);
          if (committed.kind !== 'committed') return committed;
          return Object.freeze({
            ...committed,
            state: { ...committed.state, frontierEnding: null },
          });
        },
      },
      state: ambiguous.state,
      requestedEndingId: 'protect',
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-ending-fixed-point-mismatch',
    });
    expect(ambiguous.state.frontierEnding).toBeNull();
  });

  it('rejects accessors without touching them or invoking the writer', async () => {
    let getterTouched = false;
    let commitCalls = 0;
    const hostile = baseState() as SaveStateV2 & { hostile?: unknown };
    Object.defineProperty(hostile, 'hostile', {
      enumerable: true,
      get() { getterTouched = true; return 'no'; },
    });
    const outcome = await commitArc9FrontierEndingChoiceV1({
      runtime: {
        async commitAction() {
          commitCalls++;
          return { kind: 'lease-unavailable' };
        },
      },
      state: hostile,
      requestedEndingId: 'conquer',
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', detail: 'input:invalid-or-unregistered', transaction: null,
    });
    expect(getterTouched).toBe(false);
    expect(commitCalls).toBe(0);
  });
});
