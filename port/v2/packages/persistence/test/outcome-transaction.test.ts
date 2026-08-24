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
  createF4DeterministicProductTransactionOwner,
  F4_NO_RNG_PRODUCT_OPERATIONS,
  createF4OutcomeTransactionOwner,
  createF4NoRngProductTransactionOwner,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  migrateStoredV4ToV5,
  planF4DeterministicProductReceipt,
  planF4OutcomeDraw,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type F4OutcomeTransactionInput,
  type F4DeterministicProductTransactionInput,
  type F4NoRngProductTransactionInput,
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
  extensions: V5Extensions = {},
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
    writable: { state: initial.state, extensions: {
      ...initial.extensions,
      ...extensions,
      player: {
        ...(initial.extensions.player ?? {}),
        ...(extensions.player ?? {}),
      },
    } },
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
      async compareAndApply(checks, operations, clearStores) {
        if (armed && operations.some((operation) => operation.store === 'receipts')) {
          captured = { checks: [...checks], operations: [...operations] };
        }
        return base.compareAndApply(checks, operations, clearStores);
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
      async compareAndApply(checks, operations, clearStores) {
        if (failNextOutcome && operations.some((operation) => operation.store === 'receipts')) {
          failNextOutcome = false;
          throw new Error('injected atomic write failure');
        }
        return base.compareAndApply(checks, operations, clearStores);
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
    const firstStat = Object.keys(harness.writable.state.stats)[0];
    const beforeFirstStat = firstStat === undefined ? undefined : harness.writable.state.stats[firstStat];
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
        expect(draft.stats).not.toBe(harness.writable.state.stats);
        draft.essence += 999;
        if (firstStat !== undefined) draft.stats[firstStat] = 999_999;
        throw new Error('product policy refused');
      },
    });
    expect(rejected).toMatchObject({ kind: 'rejected', stage: 'derive', message: 'product policy refused' });
    expect(harness.writable.state.essence).toBe(beforeEssence);
    if (firstStat !== undefined) expect(harness.writable.state.stats[firstStat]).toBe(beforeFirstStat);
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

  it('applies checked product extension writes before protected F4 authority and preserves unrelated namespaces', async () => {
    const harness = await seededHarness(
      createMemoryBackend(),
      createSessionRNG(0xC0FFEE, { existing: 3 }, 7).state(),
      100,
      {
        inventory: {
          'arc2.inventory': { version: 1, json: '{"entries":["old"]}' },
          'other.inventory': { version: 4, json: '{"keep":true}' },
        },
        settings: { 'arc7.audio': { version: 1, json: '{"muted":false}' } },
      },
    );
    const originalExtensions = harness.writable.extensions;
    const originalInventoryCarrier = originalExtensions.inventory?.['arc2.inventory'];
    let observedExtensions: V5Extensions | null = null;
    const owner = createF4OutcomeTransactionOwner(createRevisionedRepository(harness.backend), REGISTRY);
    const result = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 175 },
      domain: 'loot.rarity',
      receiptKind: 'loot-settlement',
      now: NOW,
      derive: ({ draft, extensions }) => {
        observedExtensions = extensions;
        expect(extensions).not.toBe(originalExtensions);
        expect(extensions.inventory?.['arc2.inventory']).not.toBe(originalInventoryCarrier);
        expect(Object.isFrozen(extensions)).toBe(true);
        expect(Object.isFrozen(extensions.inventory)).toBe(true);
        expect(() => {
          (extensions.inventory as Record<string, { version: number; json: string }>)[
            'arc2.inventory'
          ] = { version: 99, json: '{"mutated":true}' };
        }).toThrow();
        return {
          state: draft,
          witness: 'loot:item-7',
          extensionWrites: [
            {
              segment: 'inventory',
              namespace: 'arc2.inventory',
              carrier: { version: 2, json: '{"entries":["new"]}' },
            },
            {
              segment: 'catalog',
              namespace: 'arc2.discovery',
              carrier: { version: 1, json: '{"ids":["item-7"]}' },
            },
          ],
        };
      },
    });
    expect(result.kind).toBe('committed');
    expect(observedExtensions).not.toBeNull();
    expect(originalExtensions.inventory?.['arc2.inventory']).toEqual({
      version: 1, json: '{"entries":["old"]}',
    });
    const loaded = await readSaveV5(harness.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded' || result.kind !== 'committed') return;
    expect(loaded.extensions.inventory?.['arc2.inventory']).toEqual({
      version: 2, json: '{"entries":["new"]}',
    });
    expect(loaded.extensions.inventory?.['other.inventory']).toEqual({
      version: 4, json: '{"keep":true}',
    });
    expect(loaded.extensions.settings?.['arc7.audio']).toEqual({
      version: 1, json: '{"muted":false}',
    });
    expect(loaded.extensions.catalog?.['arc2.discovery']).toEqual({
      version: 1, json: '{"ids":["item-7"]}',
    });
    expect(readF4Authority(loaded.extensions)).toEqual({ kind: 'loaded', authority: result.authority });
    expect(result.authority.sessionRng.draws).toEqual({ existing: 3, 'loot.rarity': 1 });
  });

  it('rejects duplicate extension targets and any direct player/f4.authority product write', async () => {
    const harness = await seededHarness();
    const owner = createF4OutcomeTransactionOwner(createRevisionedRepository(harness.backend), REGISTRY);
    const base = {
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 150 },
      domain: 'loot.rarity',
      receiptKind: 'loot-settlement',
      now: NOW,
    } as const;
    const carrier = { version: 1, json: '{"ok":true}' } as const;
    const duplicate = await owner.commit({
      ...base,
      derive: ({ draft }) => ({
        state: draft,
        witness: 'duplicate-control',
        extensionWrites: [
          { segment: 'inventory', namespace: 'arc2.inventory', carrier },
          { segment: 'inventory', namespace: 'arc2.inventory', carrier },
        ],
      }),
    });
    expect(duplicate).toMatchObject({
      kind: 'rejected',
      stage: 'extension-writes',
      message: 'duplicate product extension write for inventory/arc2.inventory',
    });

    const forbidden = await owner.commit({
      ...base,
      derive: ({ draft }) => ({
        state: draft,
        witness: 'authority-control',
        extensionWrites: [{
          segment: 'player',
          namespace: F4_AUTHORITY_NAMESPACE,
          carrier: { version: 1, json: '{"activePlayMs":999,"sessionRng":{}}' },
        }],
      }),
    });
    expect(forbidden).toMatchObject({
      kind: 'rejected',
      stage: 'extension-writes',
      message: 'product extension writes cannot overwrite player/f4.authority',
    });
    expect(await createRevisionedRepository(harness.backend).revision()).toBe(1);
    expect(await createRevisionedRepository(harness.backend).readReceipt(0)).toBeUndefined();
    const loaded = await readSaveV5(harness.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind === 'loaded') {
      expect(readF4Authority(loaded.extensions)).toEqual({
        kind: 'loaded',
        authority: { activePlayMs: 100, sessionRng: { seed: 0xC0FFEE, ordinal: 0, draws: {} } },
      });
    }
  });
});

describe('@cf/persistence — deterministic product transaction owner', () => {
  const engineeringCarrier = (owned: readonly string[]) => ({
    version: 1,
    json: JSON.stringify({ owned }),
  });

  it('atomically commits an arc-neutral action and advances only the global receipt ordinal', async () => {
    const harness = await seededHarness(
      createMemoryBackend(),
      createSessionRNG(0xA3C3, { 'capture.success': 4, 'loot.rarity': 2 }, 9).state(),
      250,
      {
        player: {
          'arc3.engineering': engineeringCarrier(['drive1']),
          'other.player': { version: 3, json: '{"keep":true}' },
        },
      },
    );
    const beforeEssence = harness.writable.state.essence;
    const owner = createF4DeterministicProductTransactionOwner(
      createRevisionedRepository(harness.backend),
      REGISTRY,
    );
    const result = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 275 },
      operation: 'research:drive2',
      receiptKind: 'arc3-research',
      now: NOW,
      derive: ({ operation, receiptOrdinal, draft, extensions }) => {
        expect(operation).toBe('research:drive2');
        expect(receiptOrdinal).toBe(9);
        expect(extensions).not.toBe(harness.writable.extensions);
        draft.essence -= 25;
        return {
          state: draft,
          witness: 'research:drive2:cost=25',
          extensionWrites: [{
            segment: 'player',
            namespace: 'arc3.engineering',
            carrier: engineeringCarrier(['drive1', 'drive2']),
          }],
        };
      },
    });

    expect(result.kind).toBe('committed');
    if (result.kind !== 'committed') return;
    expect(result.revision).toBe(2);
    expect(result.plan).toMatchObject({ operation: 'research:drive2', receiptOrdinal: 9 });
    expect(result.receipt).toEqual({
      ordinal: 9,
      kind: 'arc3-research',
      witness: 'research:drive2:cost=25',
    });
    expect(result.authority).toEqual({
      activePlayMs: 275,
      sessionRng: {
        seed: 0xA3C3,
        ordinal: 10,
        draws: { 'capture.success': 4, 'loot.rarity': 2 },
      },
    });
    expect(result.plan.currentAuthority.sessionRng.draws)
      .toEqual(result.plan.nextSessionRng.draws);
    expect(harness.writable.state.essence).toBe(beforeEssence);

    const loaded = await readSaveV5(harness.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.state.essence).toBe(beforeEssence - 25);
    expect(loaded.extensions.player?.['arc3.engineering'])
      .toEqual(engineeringCarrier(['drive1', 'drive2']));
    expect(loaded.extensions.player?.['other.player']).toEqual({
      version: 3, json: '{"keep":true}',
    });
    expect(readF4Authority(loaded.extensions)).toEqual({
      kind: 'loaded', authority: result.authority,
    });
    expect(await createRevisionedRepository(harness.backend).readReceipt(9))
      .toEqual(result.receipt);
  });

  it('protects authority, bounds identity, and replays the same ordinal after storage failure', async () => {
    const planned = planF4DeterministicProductReceipt(
      authorityExtensions(77, { existing: 8 }, 12),
      'fabricate:thermal',
    );
    expect(planned.kind).toBe('planned');
    if (planned.kind !== 'planned') return;
    expect(planned.plan.nextSessionRng).toEqual({
      seed: 77, ordinal: 13, draws: { existing: 8 },
    });
    expect(planF4DeterministicProductReceipt(
      authorityExtensions(77, {}, 0xFFFF_FFFF),
      'fabricate:thermal',
    )).toEqual({ kind: 'protected', reason: 'receipt-ordinal-exhausted' });
    expect(planF4DeterministicProductReceipt({}, 'fabricate:thermal'))
      .toEqual({ kind: 'protected', reason: 'authority-absent' });
    expect(() => planF4DeterministicProductReceipt(
      authorityExtensions(77, {}, 0),
      'bad\noperation',
    )).toThrow('deterministic product operation must be 1–96 printable characters');

    const base = createMemoryBackend();
    let failNext = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (failNext && operations.some((operation) => operation.store === 'receipts')) {
          failNext = false;
          throw new Error('injected deterministic action failure');
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const harness = await seededHarness(
      backend,
      createSessionRNG(77, { existing: 8 }, 12).state(),
      400,
    );
    const owner = createF4DeterministicProductTransactionOwner(
      createRevisionedRepository(backend),
      REGISTRY,
    );
    const input: F4DeterministicProductTransactionInput = {
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 425 },
      operation: 'fabricate:thermal',
      receiptKind: 'arc3-fabricate',
      now: NOW,
      derive: ({ draft }) => ({ state: draft, witness: 'fabricate:thermal:1' }),
    };
    failNext = true;
    const failed = await owner.commit(input);
    expect(failed).toMatchObject({
      kind: 'storage-error',
      message: 'injected deterministic action failure',
      plan: { receiptOrdinal: 12 },
    });
    expect(await createRevisionedRepository(backend).revision()).toBe(1);
    expect(await createRevisionedRepository(backend).readReceipt(12)).toBeUndefined();

    const afterFailure = await readSaveV5(backend, REGISTRY, NOW);
    expect(afterFailure.kind).toBe('loaded');
    if (afterFailure.kind !== 'loaded') return;
    const retry = await owner.commit({
      ...input,
      writable: { state: afterFailure.state, extensions: afterFailure.extensions },
    });
    expect(retry.kind).toBe('committed');
    if (retry.kind === 'committed') {
      expect(retry.plan.receiptOrdinal).toBe(12);
      expect(retry.authority.sessionRng).toEqual({
        seed: 77, ordinal: 13, draws: { existing: 8 },
      });
    }
  });
});

describe('@cf/persistence — no-RNG Arc 2 product transaction owner', () => {
  const inventoryCarrier = (entries: readonly string[], claimed: readonly string[] = []) => ({
    version: 1,
    json: JSON.stringify({ entries, claimed }),
  });

  const equipDerivation = (
    nextEntries: readonly string[],
    witness = 'equip:gear-1',
  ): F4NoRngProductTransactionInput['derive'] => ({ draft, extensions, operation }) => {
    expect(operation).toBe('equip');
    expect(extensions.inventory?.['arc2.inventory']).toBeDefined();
    return {
      state: draft,
      witness,
      extensionWrites: [{
        segment: 'inventory',
        namespace: 'arc2.inventory',
        carrier: inventoryCarrier(nextEntries),
      }],
    };
  };

  it('supports exactly equip, unequip, salvage, and pending claim', () => {
    expect(F4_NO_RNG_PRODUCT_OPERATIONS).toEqual([
      'equip', 'unequip', 'salvage', 'pending-claim',
    ]);
  });

  it('atomically commits one deterministic operation with revision, lease, receipt, and final F4 authority', async () => {
    const base = createMemoryBackend();
    let captured: { checks: readonly StorageCheck[]; operations: readonly StorageOperation[] } | null = null;
    let armed = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (armed && operations.some((operation) => operation.store === 'receipts')) {
          captured = { checks: [...checks], operations: [...operations] };
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const harness = await seededHarness(
      backend,
      createSessionRNG(5150, { 'capture.success': 4, 'loot.rarity': 2 }, 9).state(),
      250,
      {
        inventory: {
          'arc2.inventory': inventoryCarrier(['gear-1']),
          'other.inventory': { version: 2, json: '{"keep":"exact"}' },
        },
        settings: { 'arc7.audio': { version: 1, json: '{"volume":0.5}' } },
      },
    );
    armed = true;
    const owner = createF4NoRngProductTransactionOwner(
      createRevisionedRepository(backend),
      REGISTRY,
    );
    const result = await owner.commit({
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 275 },
      operation: 'equip',
      now: NOW,
      derive: equipDerivation(['gear-1', 'equipped:gear-1']),
    });

    expect(result.kind).toBe('committed');
    if (result.kind !== 'committed') return;
    expect(result.plan).toMatchObject({ operation: 'equip', receiptOrdinal: 9 });
    expect(result.receipt).toEqual({ ordinal: 9, kind: 'arc2-equip', witness: 'equip:gear-1' });
    expect(result.authority).toEqual({
      activePlayMs: 275,
      sessionRng: {
        seed: 5150,
        ordinal: 10,
        draws: { 'capture.success': 4, 'loot.rarity': 2 },
      },
    });
    expect(result.plan.nextSessionRng.draws).toEqual(result.plan.currentAuthority.sessionRng.draws);
    expect(captured).not.toBeNull();
    expect(captured!.checks).toEqual([
      { store: 'meta', key: F3_REVISION_KEY, value: '1' },
      { store: 'receipts', key: 'receipt:9', value: undefined },
      harness.grant.check,
    ]);
    expect(captured!.operations).toEqual([
      ...result.saved.operations,
      { store: 'receipts', key: 'receipt:9', value: JSON.stringify(result.receipt) },
      { store: 'meta', key: F3_REVISION_KEY, value: '2' },
    ]);
    expect(new Set(result.saved.operations.map(({ store, key }) => `${store}/${key}`)).size)
      .toBe(result.saved.operations.length);

    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.extensions.inventory?.['arc2.inventory']).toEqual(
      inventoryCarrier(['gear-1', 'equipped:gear-1']),
    );
    expect(loaded.extensions.inventory?.['other.inventory']).toEqual({
      version: 2, json: '{"keep":"exact"}',
    });
    expect(loaded.extensions.settings?.['arc7.audio']).toEqual({
      version: 1, json: '{"volume":0.5}',
    });
    expect(await createRevisionedRepository(backend).readReceipt(9)).toEqual(result.receipt);
  });

  it('turns a same-parent double operation into one commit and one duplicate receipt, then rejects a stale parent', async () => {
    const harness = await seededHarness(
      createMemoryBackend(),
      createSessionRNG(44, { existing: 8 }, 3).state(),
      100,
      { inventory: { 'arc2.inventory': inventoryCarrier(['gear-1']) } },
    );
    const owner = createF4NoRngProductTransactionOwner(
      createRevisionedRepository(harness.backend),
      REGISTRY,
    );
    const input: F4NoRngProductTransactionInput = {
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 125 },
      operation: 'equip',
      now: NOW,
      derive: equipDerivation(['gear-1', 'equipped:gear-1']),
    };
    const [left, right] = await Promise.all([owner.commit(input), owner.commit(input)]);
    expect([left.kind, right.kind].sort()).toEqual(['committed', 'duplicate-receipt']);
    expect(await createRevisionedRepository(harness.backend).revision()).toBe(2);
    expect(await harness.backend.keys('receipts')).toEqual(['receipt:3']);

    const stale = await owner.commit(input);
    expect(stale).toMatchObject({ kind: 'stale', expectedRevision: 1, actualRevision: 2 });
    const loaded = await readSaveV5(harness.backend, REGISTRY, NOW);
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.extensions.inventory?.['arc2.inventory']).toEqual(
      inventoryCarrier(['gear-1', 'equipped:gear-1']),
    );
    expect(readF4Authority(loaded.extensions)).toEqual({
      kind: 'loaded',
      authority: {
        activePlayMs: 125,
        sessionRng: { seed: 44, ordinal: 4, draws: { existing: 8 } },
      },
    });
  });

  it('leaves every product, receipt, revision, and RNG counter untouched on atomic failure', async () => {
    const base = createMemoryBackend();
    let failNext = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (failNext && operations.some((operation) => operation.store === 'receipts')) {
          failNext = false;
          throw new Error('injected no-RNG atomic failure');
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const harness = await seededHarness(
      backend,
      createSessionRNG(88, { 'capture.success': 6 }, 12).state(),
      400,
      { inventory: { 'arc2.inventory': inventoryCarrier(['pending:gear-2']) } },
    );
    const owner = createF4NoRngProductTransactionOwner(createRevisionedRepository(backend), REGISTRY);
    const input: F4NoRngProductTransactionInput = {
      expectedRevision: 1,
      grant: harness.grant,
      writable: harness.writable,
      snapshot: { activePlayMs: 425 },
      operation: 'pending-claim',
      now: NOW,
      derive: ({ draft, extensions, operation }) => {
        expect(operation).toBe('pending-claim');
        expect(extensions).not.toBe(harness.writable.extensions);
        return {
          state: draft,
          witness: 'pending-claim:gear-2',
          extensionWrites: [{
            segment: 'inventory',
            namespace: 'arc2.inventory',
            carrier: inventoryCarrier(['gear-2'], ['gear-2']),
          }],
        };
      },
    };
    failNext = true;
    const failed = await owner.commit(input);
    expect(failed).toMatchObject({
      kind: 'storage-error',
      message: 'injected no-RNG atomic failure',
    });
    expect(await createRevisionedRepository(backend).revision()).toBe(1);
    expect(await createRevisionedRepository(backend).readReceipt(12)).toBeUndefined();
    const afterFailure = await readSaveV5(backend, REGISTRY, NOW);
    expect(afterFailure.kind).toBe('loaded');
    if (afterFailure.kind !== 'loaded' || failed.kind !== 'storage-error') return;
    expect(afterFailure.extensions.inventory?.['arc2.inventory']).toEqual(
      inventoryCarrier(['pending:gear-2']),
    );
    expect(readF4Authority(afterFailure.extensions)).toEqual({
      kind: 'loaded',
      authority: {
        activePlayMs: 400,
        sessionRng: { seed: 88, ordinal: 12, draws: { 'capture.success': 6 } },
      },
    });

    const retry = await owner.commit({
      ...input,
      writable: { state: afterFailure.state, extensions: afterFailure.extensions },
    });
    expect(retry.kind).toBe('committed');
    if (retry.kind === 'committed') {
      expect(retry.plan.receiptOrdinal).toBe(failed.plan.receiptOrdinal);
      expect(retry.authority.sessionRng.draws).toEqual({ 'capture.success': 6 });
      expect(retry.authority.sessionRng.ordinal).toBe(13);
    }
  });
});
