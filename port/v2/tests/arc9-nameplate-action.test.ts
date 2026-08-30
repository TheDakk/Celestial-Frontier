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
  ARC9_NAMEPLATE_CHOICE_OPERATION_V1,
  ARC9_NAMEPLATE_CHOICE_RECEIPT_KIND_V1,
  commitArc9NameplateChoiceV1,
  prepareArc9NameplateChoiceV1,
} from '../apps/game/src/arc9-nameplate-action.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Arc 9 nameplate base save failed: ${imported.reason}`);
  imported.state.stats.bestRank = 3;
  imported.state.nameHue = -1;
  return imported.state;
}

async function fixture(options: Readonly<{
  failStorage?: boolean;
  configureState?: (state: SaveStateV2) => void;
}> = {}) {
  const state = baseState();
  options.configureState?.(state);
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA9000002).state(),
  );
  const base = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`Arc 9 nameplate fixture was ${migration.kind}`);
  await base.apply(initial.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) throw new Error('forced nameplate storage failure');
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
    ownerId: 'arc9-nameplate-tab',
    token: 'arc9-nameplate-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Arc 9 nameplate lease was ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state: initial.canonicalState,
    receiptCas: () => receiptCas,
  };
}

describe('Arc 9 saved nameplate preparation', () => {
  it('prepares only Auto or a durable earned rank without mutating the caller', () => {
    const state = baseState();
    const before = JSON.stringify(state);
    expect(prepareArc9NameplateChoiceV1(state, -1)).toMatchObject({
      kind: 'current', choiceIndex: -1,
    });
    expect(prepareArc9NameplateChoiceV1(state, 2)).toMatchObject({
      kind: 'ready', choiceIndex: 2, priorChoiceIndex: -1,
      successorState: { nameHue: 2 },
      nameplate: { rankIndex: 2, usedSavedChoice: true },
    });
    expect(prepareArc9NameplateChoiceV1(state, 4)).toEqual({
      kind: 'protected', reason: 'choice-locked',
    });
    for (const malformed of [-2, 10, 1.5, Number.NaN, '2', null]) {
      expect(prepareArc9NameplateChoiceV1(state, malformed)).toEqual({
        kind: 'protected', reason: 'choice-malformed',
      });
    }
    expect(JSON.stringify(state)).toBe(before);
  });

  it('preserves a locked imported choice as read-compatible but never re-writes it', () => {
    const state = baseState();
    state.nameHue = 8;
    expect(prepareArc9NameplateChoiceV1(state, 8)).toEqual({
      kind: 'protected', reason: 'choice-locked',
    });
    expect(prepareArc9NameplateChoiceV1(state, 1)).toMatchObject({
      kind: 'ready', priorChoiceIndex: 8, choiceIndex: 1,
      successorState: { nameHue: 1 },
    });
  });
});

describe('Arc 9 saved nameplate transaction', () => {
  it('commits the codec-canonical choice state when an unrelated veteran mining stamp moves', async () => {
    const test = await fixture({
      configureState(state) {
        state.mined = [['veteran-clock-floor', NOW - 30 * 6e5]];
        state.mineX = [['veteran-clock-floor', 1]];
      },
    });
    const before = JSON.stringify(test.state);
    const outcome = await commitArc9NameplateChoiceV1({
      runtime: test.runtime,
      state: test.state,
      requestedChoiceIndex: 2,
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

  it('commits one receipt/CAS, reopens fixed, and treats the same choice as current', async () => {
    const test = await fixture();
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const callerBefore = JSON.stringify(test.state);
    const outcome = await commitArc9NameplateChoiceV1({
      runtime,
      state: test.state,
      requestedChoiceIndex: 2,
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      choiceIndex: 2, priorChoiceIndex: -1,
      transaction: {
        revision: 1,
        plan: { operation: ARC9_NAMEPLATE_CHOICE_OPERATION_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_NAMEPLATE_CHOICE_RECEIPT_KIND_V1 },
        state: { nameHue: 2 },
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
    if (loaded.kind === 'loaded') expect(loaded.state.nameHue).toBe(2);
    if (outcome.kind !== 'committed') return;
    const second = await commitArc9NameplateChoiceV1({
      runtime,
      state: outcome.transaction.state,
      requestedChoiceIndex: 2,
      codecNow: NOW,
    });
    expect(second).toMatchObject({ kind: 'current', durability: 'none', transaction: null });
    expect(commitCalls).toBe(1);
    expect(await test.repository.readReceipt(1)).toBeUndefined();
    await test.runtime.release();
  });

  it('rejects locked, malformed, and protected projection inputs before a writer', async () => {
    let commitCalls = 0;
    const state = baseState();
    const runtime = {
      async commitAction() {
        commitCalls++;
        return { kind: 'lease-unavailable' as const };
      },
    };
    await expect(commitArc9NameplateChoiceV1({
      runtime, state, requestedChoiceIndex: 4, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:choice-locked', transaction: null,
    });
    await expect(commitArc9NameplateChoiceV1({
      runtime, state, requestedChoiceIndex: 1.5, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:choice-malformed', transaction: null,
    });
    const protectedState = baseState();
    protectedState.unlocked = ['first', 'first'];
    await expect(commitArc9NameplateChoiceV1({
      runtime, state: protectedState, requestedChoiceIndex: 1, codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:achievement-id-shape', transaction: null,
    });
    expect(commitCalls).toBe(0);
  });

  it('fails one stale CAS without retry, receipt, or optimistic caller mutation', async () => {
    const test = await fixture();
    const before = JSON.stringify(test.state);
    await test.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'arc9-nameplate-race', value: 'other-tab' }],
    });
    const outcome = await commitArc9NameplateChoiceV1({
      runtime: test.runtime,
      state: test.state,
      requestedChoiceIndex: 1,
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

  it('contains storage failure and postcommit evidence ambiguity without publishing', async () => {
    const failed = await fixture({ failStorage: true });
    const failedBefore = JSON.stringify(failed.state);
    await expect(commitArc9NameplateChoiceV1({
      runtime: failed.runtime,
      state: failed.state,
      requestedChoiceIndex: 1,
      codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced nameplate storage failure',
    });
    expect(await failed.repository.revision()).toBe(0);
    expect(await failed.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(failed.state)).toBe(failedBefore);

    const ambiguous = await fixture();
    const outcome = await commitArc9NameplateChoiceV1({
      runtime: {
        async commitAction(input) {
          const committed = await ambiguous.runtime.commitAction(input);
          if (committed.kind !== 'committed') return committed;
          return Object.freeze({
            ...committed,
            state: { ...committed.state, nameHue: -1 },
          });
        },
      },
      state: ambiguous.state,
      requestedChoiceIndex: 1,
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-nameplate-fixed-point-mismatch',
    });
    expect(ambiguous.state.nameHue).toBe(-1);
  });

  it('rejects accessors without touching them or invoking the writer', async () => {
    let getterTouched = false;
    let commitCalls = 0;
    const hostile = baseState() as SaveStateV2 & { hostile?: unknown };
    Object.defineProperty(hostile, 'hostile', {
      enumerable: true,
      get() { getterTouched = true; return 'no'; },
    });
    const outcome = await commitArc9NameplateChoiceV1({
      runtime: {
        async commitAction() {
          commitCalls++;
          return { kind: 'lease-unavailable' };
        },
      },
      state: hostile,
      requestedChoiceIndex: 1,
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', detail: 'input:invalid-or-unregistered', transaction: null,
    });
    expect(getterTouched).toBe(false);
    expect(commitCalls).toBe(0);
  });
});
