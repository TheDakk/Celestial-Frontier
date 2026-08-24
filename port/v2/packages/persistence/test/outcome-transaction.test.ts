import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  F3_REVISION_KEY,
  F4_AUTHORITY_NAMESPACE,
  V4_PRIMARY_KEY,
  createActivePlayPersistenceOwner,
  createF4OutcomeTransactionOwner,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  migrateStoredV4ToV5,
  planF4OutcomeDraw,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type F4OutcomeTransactionInput,
  type StorageBackend,
  type StorageCheck,
  type StorageOperation,
  type TabLeaseClient,
  type TabLeaseGrant,
  type V5Extensions,
  type V5WritableState,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const fixtures = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>;
};
const REGISTRY = JSON.parse(fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_060_000;
const VETERAN_RAW = JSON.stringify(fixtures.inputs.veteran_rich);

function controlledClock(start = 0): { now: () => number; advance: (ms: number) => void } {
  let value = start;
  return { now: () => value, advance: (ms) => { value += ms; } };
}

async function acquire(
  backend: StorageBackend,
  ownerId: string,
  token: string,
  clock: ReturnType<typeof controlledClock>,
  ttlMs = 10,
): Promise<{ client: TabLeaseClient; grant: TabLeaseGrant }> {
  const client = createTabLeaseClient(backend, { ownerId, token, ttlMs, now: clock.now });
  const outcome = await client.acquire();
  if (outcome.kind !== 'acquired') throw new Error(`expected acquisition, received ${outcome.kind}`);
  return { client, grant: outcome.grant };
}

interface SeededHarness {
  readonly backend: StorageBackend;
  readonly writable: V5WritableState;
  readonly revision: 1;
  readonly grant: TabLeaseGrant;
  readonly client: TabLeaseClient;
  readonly clock: ReturnType<typeof controlledClock>;
}

async function seededHarness(
  backend: StorageBackend = createMemoryBackend(),
  sessionRng = createSessionRNG(0xC0FFEE).state(),
  activePlayMs = 100,
): Promise<SeededHarness> {
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: VETERAN_RAW }]);
  expect((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind).toBe('migrated');
  const initial = await readSaveV5(backend, REGISTRY, NOW);
  if (initial.kind !== 'loaded') throw new Error(`expected loaded v5, received ${initial.kind}`);
  const clock = controlledClock();
  const { client, grant } = await acquire(backend, 'tab-a', 'session-a', clock);
  const authority = await createActivePlayPersistenceOwner(
    createRevisionedRepository(backend),
    REGISTRY,
  ).commit({
    expectedRevision: 0,
    grant,
    writable: { state: initial.state, extensions: initial.extensions },
    snapshot: { activePlayMs },
    sessionRng,
    now: NOW,
  });
  if (authority.kind !== 'committed') throw new Error(`expected F4 seed commit, received ${authority.kind}`);
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`expected seeded v5, received ${loaded.kind}`);
  return {
    backend,
    writable: { state: loaded.state, extensions: loaded.extensions },
    revision: 1,
    grant,
    client,
    clock,
  };
}

function essenceDerivation(witnessPrefix = 'essence'):
  F4OutcomeTransactionInput['derive'] {
  return ({ draft, value }) => {
    draft.essence += value < 0.5 ? 1 : 2;
    return { state: draft, witness: `${witnessPrefix}:${draft.essence}` };
  };
}

function authorityExtensions(
  seed: number,
  draws: Record<string, number>,
  ordinal: number,
  activePlayMs = 0,
): V5Extensions {
  return Object.freeze({
    player: Object.freeze({
      [F4_AUTHORITY_NAMESPACE]: Object.freeze({
        version: 1,
        json: JSON.stringify({ activePlayMs, sessionRng: { seed, draws, ordinal } }),
      }),
    }),
  });
}

describe('@cf/persistence — F4 exact-outcome transaction owner', () => {
  it('atomically commits product rows, next clock/RNG authority, receipt, lease fence, and revision', async () => {
    const base = createMemoryBackend();
    let captured: { checks: readonly StorageCheck[]; operations: readonly StorageOperation[] } | null = null;
    let armed = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations) {
        if (armed && operations.some((operation) => operation.store === 'receipts')) {
          captured = { checks: [...checks], operations: [...operations] };
        }
        return base.compareAndApply(checks, operations);
      },
    };
    const harness = await seededHarness(backend);
    armed = true;
    const beforeEssence = harness.writable.state.essence;
    const owner = createF4OutcomeTransactionOwner(createRevisionedRepository(backend), REGISTRY);
    const result = await owner.commit({
      expectedRevision: harness.revision,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 275 },
      domain: 'capture.success',
      receiptKind: 'capture-settlement',
      now: NOW,
      derive: essenceDerivation('capture'),
    });

    expect(result.kind).toBe('committed');
    if (result.kind !== 'committed') return;
    const increment = result.plan.value < 0.5 ? 1 : 2;
    expect(result.revision).toBe(2);
    expect(result.plan.receiptOrdinal).toBe(0);
    expect(result.authority).toEqual({
      activePlayMs: 275,
      sessionRng: { seed: 0xC0FFEE, ordinal: 1, draws: { 'capture.success': 1 } },
    });
    expect(result.receipt).toEqual({
      ordinal: 0,
      kind: 'capture-settlement',
      witness: `capture:${beforeEssence + increment}`,
    });
    expect(harness.writable.state.essence).toBe(beforeEssence);
    expect(captured).not.toBeNull();
    expect(captured!.checks).toEqual([
      { store: 'meta', key: F3_REVISION_KEY, value: '1' },
      { store: 'receipts', key: 'receipt:0', value: undefined },
      harness.grant.check,
    ]);
    expect(captured!.operations).toEqual([
      ...result.saved.operations,
      { store: 'receipts', key: 'receipt:0', value: JSON.stringify(result.receipt) },
      { store: 'meta', key: F3_REVISION_KEY, value: '2' },
    ]);

    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.state.essence).toBe(beforeEssence + increment);
    expect(readF4Authority(loaded.extensions)).toEqual({ kind: 'loaded', authority: result.authority });
    expect(await createRevisionedRepository(backend).readReceipt(0)).toEqual(result.receipt);
  });

  it('lets only the live tab commit; a predecessor lease loses without consuming the planned roll', async () => {
    const harness = await seededHarness();
    const beforeEssence = harness.writable.state.essence;
    const successorClock = controlledClock(50_000);
    const successor = createTabLeaseClient(harness.backend, {
      ownerId: 'tab-b', token: 'session-b', ttlMs: 10, now: successorClock.now,
    });
    await expect(successor.acquire()).resolves.toMatchObject({ kind: 'held-by-other' });
    successorClock.advance(10);
    const takeover = await successor.acquire();
    if (takeover.kind !== 'acquired') throw new Error(`expected takeover, received ${takeover.kind}`);

    const owner = createF4OutcomeTransactionOwner(createRevisionedRepository(harness.backend), REGISTRY);
    const oldResult = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 150 },
      domain: 'loot.rarity',
      receiptKind: 'loot-settlement',
      now: NOW,
      derive: essenceDerivation('loot'),
    });
    expect(oldResult.kind).toBe('lost');
    if (oldResult.kind !== 'lost') return;
    expect(oldResult.reason).toBe('lease-lost');
    expect(await createRevisionedRepository(harness.backend).readReceipt(0)).toBeUndefined();

    const liveResult = await owner.commit({
      expectedRevision: 1,
      grant: takeover.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 150 },
      domain: 'loot.rarity',
      receiptKind: 'loot-settlement',
      now: NOW,
      derive: essenceDerivation('loot'),
    });
    expect(liveResult.kind).toBe('committed');
    if (liveResult.kind !== 'committed') return;
    expect(liveResult.plan.value).toBe(oldResult.plan.value);
    const loaded = await readSaveV5(harness.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.state.essence).toBe(beforeEssence + (liveResult.plan.value < 0.5 ? 1 : 2));
    }
  });

  it('turns a same-parent double action into one commit and one duplicate receipt, never two products', async () => {
    const harness = await seededHarness();
    const beforeEssence = harness.writable.state.essence;
    const owner = createF4OutcomeTransactionOwner(createRevisionedRepository(harness.backend), REGISTRY);
    const input: F4OutcomeTransactionInput = {
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 125 },
      domain: 'engineering.roll',
      receiptKind: 'engineering-settlement',
      now: NOW,
      derive: essenceDerivation('engineering'),
    };
    const [left, right] = await Promise.all([owner.commit(input), owner.commit(input)]);
    expect([left.kind, right.kind].sort()).toEqual(['committed', 'duplicate-receipt']);
    const committed = left.kind === 'committed' ? left : right.kind === 'committed' ? right : null;
    expect(committed).not.toBeNull();
    if (committed === null) return;
    expect(await createRevisionedRepository(harness.backend).revision()).toBe(2);
    expect(await harness.backend.keys('receipts')).toEqual(['receipt:0']);
    const loaded = await readSaveV5(harness.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(loaded.state.essence).toBe(beforeEssence + (committed.plan.value < 0.5 ? 1 : 2));
    }
  });

  it('surfaces a stale revision without landing or rerolling the detached product', async () => {
    const harness = await seededHarness();
    const repository = createRevisionedRepository(harness.backend);
    await expect(repository.mutate({
      expectedRevision: 1,
      writes: [{ store: 'player', key: 'unrelated-authority', value: 'advanced-first' }],
    })).resolves.toMatchObject({ kind: 'committed', revision: 2 });
    const beforeEssence = harness.writable.state.essence;
    const owner = createF4OutcomeTransactionOwner(repository, REGISTRY);
    const stale = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 140 },
      domain: 'capture.success',
      receiptKind: 'capture-settlement',
      now: NOW,
      derive: essenceDerivation('stale-attempt'),
    });
    expect(stale).toMatchObject({ kind: 'stale', expectedRevision: 1, actualRevision: 2 });
    expect(await repository.readReceipt(0)).toBeUndefined();
    const reloaded = await readSaveV5(harness.backend, REGISTRY, NOW);
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind !== 'loaded' || stale.kind !== 'stale') return;
    expect(reloaded.state.essence).toBe(beforeEssence);

    const retry = await owner.commit({
      expectedRevision: 2,
      grant: harness.grant,
      writable: { state: reloaded.state, extensions: reloaded.extensions },
      snapshot: { activePlayMs: 140 },
      domain: 'capture.success',
      receiptKind: 'capture-settlement',
      now: NOW,
      derive: essenceDerivation('stale-attempt'),
    });
    expect(retry.kind).toBe('committed');
    if (retry.kind === 'committed') expect(retry.plan.value).toBe(stale.plan.value);
  });

  it('replays the identical value after an atomic write failure and reload', async () => {
    const base = createMemoryBackend();
    let failNextOutcome = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations) {
        if (failNextOutcome && operations.some((operation) => operation.store === 'receipts')) {
          failNextOutcome = false;
          throw new Error('injected atomic write failure');
        }
        return base.compareAndApply(checks, operations);
      },
    };
    const harness = await seededHarness(backend);
    const beforeEssence = harness.writable.state.essence;
    const observedValues: number[] = [];
    const derive: F4OutcomeTransactionInput['derive'] = ({ draft, value }) => {
      observedValues.push(value);
      draft.essence += 1;
      return { state: draft, witness: `failure-replay:${draft.essence}` };
    };
    const owner = createF4OutcomeTransactionOwner(createRevisionedRepository(backend), REGISTRY);
    failNextOutcome = true;
    const failed = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 160 },
      domain: 'companion.temperament',
      receiptKind: 'companion-settlement',
      now: NOW,
      derive,
    });
    expect(failed).toMatchObject({ kind: 'storage-error', message: 'injected atomic write failure' });
    expect(await createRevisionedRepository(backend).revision()).toBe(1);
    expect(await createRevisionedRepository(backend).readReceipt(0)).toBeUndefined();

    const afterFailure = await readSaveV5(backend, REGISTRY, NOW);
    expect(afterFailure.kind).toBe('loaded');
    if (afterFailure.kind !== 'loaded' || failed.kind !== 'storage-error') return;
    expect(afterFailure.state.essence).toBe(beforeEssence);
    expect(readF4Authority(afterFailure.extensions)).toEqual({
      kind: 'loaded',
      authority: { activePlayMs: 100, sessionRng: { seed: 0xC0FFEE, ordinal: 0, draws: {} } },
    });

    const retry = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: { state: afterFailure.state, extensions: afterFailure.extensions },
      snapshot: { activePlayMs: 160 },
      domain: 'companion.temperament',
      receiptKind: 'companion-settlement',
      now: NOW,
      derive,
    });
    expect(retry.kind).toBe('committed');
    if (retry.kind !== 'committed') return;
    expect(retry.plan.value).toBe(failed.plan.value);
    expect(observedValues).toEqual([failed.plan.value, failed.plan.value]);
  });

  it('keeps arbitrary semantic domains isolated when unrelated counters and order are perturbed', () => {
    const clean = planF4OutcomeDraw(
      authorityExtensions(12345, { 'capture.success': 4 }, 8),
      'capture.success',
    );
    const noisy = planF4OutcomeDraw(
      authorityExtensions(12345, { 'capture.success': 4, 'ui.picker': 99, 'loot.rarity': 7 }, 110),
      'capture.success',
    );
    expect(clean.kind).toBe('planned');
    expect(noisy.kind).toBe('planned');
    if (clean.kind !== 'planned' || noisy.kind !== 'planned') return;
    expect(noisy.plan.value).toBe(clean.plan.value);
    expect(clean.plan.receiptOrdinal).toBe(8);
    expect(noisy.plan.receiptOrdinal).toBe(110);
    expect(clean.plan.nextSessionRng.draws).toEqual({ 'capture.success': 5 });
    expect(noisy.plan.nextSessionRng.draws).toEqual({
      'capture.success': 5,
      'loot.rarity': 7,
      'ui.picker': 99,
    });
    expect(Object.isFrozen(noisy.plan.nextSessionRng.draws)).toBe(true);
  });

  it('protects absent, corrupt, and future F4 authority before derivation or mutation', async () => {
    const harness = await seededHarness();
    const currentState = harness.writable.state;
    const cases: Array<{ extensions: V5Extensions; expected: object }> = [
      { extensions: {}, expected: { kind: 'protected', reason: 'authority-absent' } },
      {
        extensions: { player: {
          [F4_AUTHORITY_NAMESPACE]: { version: 1, json: '{"activePlayMs":-1,"sessionRng":{}}' },
        } },
        expected: { kind: 'protected', reason: 'authority-corrupt' },
      },
      {
        extensions: { player: {
          [F4_AUTHORITY_NAMESPACE]: { version: 9, json: '{"future":true}' },
        } },
        expected: { kind: 'protected', reason: 'authority-future', version: 9 },
      },
    ];
    let mutationCalls = 0;
    let derivationCalls = 0;
    const owner = createF4OutcomeTransactionOwner({
      async mutate() {
        mutationCalls++;
        throw new Error('must not reach mutation');
      },
    }, REGISTRY);
    for (const control of cases) {
      const result = await owner.commit({
        expectedRevision: 1,
        grant: harness.grant,
        writable: { state: currentState, extensions: control.extensions },
        snapshot: { activePlayMs: 150 },
        domain: 'capture.success',
        receiptKind: 'capture-settlement',
        now: NOW,
        derive: ({ draft }) => {
          derivationCalls++;
          return { state: draft, witness: 'must-not-run' };
        },
      });
      expect(result).toEqual(control.expected);
    }
    expect(derivationCalls).toBe(0);
    expect(mutationCalls).toBe(0);
  });

  it('keeps derivation failures detached and preserves the immutable receipt witness on collision', async () => {
    const harness = await seededHarness();
    const beforeEssence = harness.writable.state.essence;
    const owner = createF4OutcomeTransactionOwner(createRevisionedRepository(harness.backend), REGISTRY);
    const rejected = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 150 },
      domain: 'capture.success',
      receiptKind: 'capture-settlement',
      now: NOW,
      derive: ({ draft }) => {
        expect(draft).not.toBe(harness.writable.state);
        draft.essence += 999;
        throw new Error('product policy refused');
      },
    });
    expect(rejected).toMatchObject({ kind: 'rejected', stage: 'derive', message: 'product policy refused' });
    expect(harness.writable.state.essence).toBe(beforeEssence);
    expect(await createRevisionedRepository(harness.backend).revision()).toBe(1);
    expect(await createRevisionedRepository(harness.backend).readReceipt(0)).toBeUndefined();

    const existing = { ordinal: 0, kind: 'capture-settlement', witness: 'already-owned-product' };
    await harness.backend.apply([{
      store: 'receipts', key: 'receipt:0', value: JSON.stringify(existing),
    }]);
    const duplicate = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 150 },
      domain: 'capture.success',
      receiptKind: 'capture-settlement',
      now: NOW,
      derive: essenceDerivation('replacement-witness'),
    });
    expect(duplicate).toMatchObject({
      kind: 'duplicate-receipt',
      receiptKey: 'receipt:0',
      existing,
    });
    expect(await createRevisionedRepository(harness.backend).readReceipt(0)).toEqual(existing);
    const loaded = await readSaveV5(harness.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') expect(loaded.state.essence).toBe(beforeEssence);

    await harness.backend.apply([{ store: 'receipts', key: 'receipt:0' }]);
    const emptyWitness = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 150 },
      domain: 'capture.success',
      receiptKind: 'capture-settlement',
      now: NOW,
      derive: ({ draft }) => ({ state: draft, witness: '' }),
    });
    expect(emptyWitness).toMatchObject({ kind: 'rejected', stage: 'derive' });
    expect(await createRevisionedRepository(harness.backend).revision()).toBe(1);
  });
});
