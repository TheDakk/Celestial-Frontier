import { describe, expect, it } from 'vitest';
import {
  F3_MAX_REVISION,
  F3_REVISION_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  exportPortableV5Save,
  initializeFreshV5,
  prepareV5Replacement,
  readF4Authority,
  readSaveV5,
  type SaveStateV2,
  type StorageBackend,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import { REGISTRY } from '../src/save/registry';
import { HEARTBEAT_MS, LEASE_TTL_MS, createSaveRuntime, type SaveRuntimeInput } from '../src/save/runtime';
import { NOW, controlledClock, dump, namedState } from './save-support';

/** A new expedition stored at revision 1, read back as a boot reads it. */
async function stored(backend: StorageBackend = createMemoryBackend()) {
  const started = await initializeFreshV5(backend, { state: namedState('Vega'), extensions: {} }, REGISTRY, NOW);
  if (started.kind !== 'initialized') throw new Error(`seed was ${started.kind}`);
  return { backend, loaded: await load(backend) };
}

async function load(backend: StorageBackend): Promise<{ state: SaveStateV2; extensions: V5Extensions }> {
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`expected a loaded save; got ${loaded.kind}`);
  return loaded;
}

function runtimeOn(
  backend: StorageBackend,
  loaded: { state: SaveStateV2; extensions: V5Extensions },
  over: Partial<SaveRuntimeInput> = {},
) {
  return createSaveRuntime({
    backend, registry: REGISTRY,
    initialRevision: 1, initialExtensions: loaded.extensions, initialState: loaded.state,
    restoredAuthority: null, freshSessionSeed: 7,
    ownerId: 'tab-a', token: 'token-a', leaseTtlMs: 100,
    now: () => 0, visible: true, answerable: true,
    ...over,
  });
}

describe('save runtime: active play and checkpoints', () => {
  it('the lease lasts ten seconds and is renewed twice in that time', () => {
    expect(LEASE_TTL_MS).toBe(10_000);
    expect(HEARTBEAT_MS).toBe(5_000);
  });

  it('a visible, answerable page holding the lease accrues active play; a hidden page does not', async () => {
    const { backend, loaded } = await stored();
    const time = controlledClock(100);
    const runtime = runtimeOn(backend, loaded, { now: time.now, answerable: false });

    time.advance(200);
    expect(runtime.activePlayMs()).toBe(0); // no lease yet
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 0 });
    time.advance(300);
    expect(runtime.activePlayMs()).toBe(0); // not answerable
    expect(runtime.diagnostics()).toMatchObject({ accruing: false, leaseOwned: true });
    runtime.setAnswerable(true);
    time.advance(450);
    expect(runtime.activePlayMs()).toBe(450);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 450, accruing: true });

    await expect(runtime.setVisible(false)).resolves.toEqual({ kind: 'lost' });
    time.advance(5_000);
    expect(runtime.activePlayMs()).toBe(450);
    expect(runtime.diagnostics()).toMatchObject({ accruing: false, leaseOwned: false });
    await expect(runtime.commit(loaded.state, NOW)).resolves.toEqual({ kind: 'lease-unavailable' });

    await expect(runtime.setVisible(true)).resolves.toMatchObject({ kind: 'owned' });
    time.advance(25);
    expect(runtime.activePlayMs()).toBe(475);
  });

  it('a commit stores the state, the active-play total and the random state in one revision step', async () => {
    const { backend, loaded } = await stored();
    const time = controlledClock(100);
    const runtime = runtimeOn(backend, loaded, { now: time.now, freshSessionSeed: 0xAABBCCDD });
    await runtime.heartbeat();
    time.advance(450);

    const next = structuredClone(loaded.state);
    next.essence = 31;
    const outcome = await runtime.commit(next, NOW);
    expect(outcome.kind).toBe('committed');
    expect(runtime.revision).toBe(2);
    expect(await backend.get('meta', F3_REVISION_KEY)).toBe('2');
    const after = await load(backend);
    expect(after.state.essence).toBe(31);
    expect(readF4Authority(after.extensions)).toEqual({
      kind: 'loaded',
      authority: { activePlayMs: 450, sessionRng: { seed: 0xAABBCCDD, ordinal: 0, draws: {} } },
    });
    expect(runtime.extensions).toEqual(after.extensions);
    expect(runtime.diagnostics()).toMatchObject({ commits: 1, staleWrites: 0, leaseLosses: 0 });
  });

  it('a second page cannot commit while the first holds the lease; its commit writes nothing', async () => {
    const { backend, loaded } = await stored();
    const first = runtimeOn(backend, loaded);
    await expect(first.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    const time = controlledClock();
    const second = runtimeOn(backend, loaded, { ownerId: 'tab-b', token: 'token-b', now: time.now });
    await expect(second.heartbeat()).resolves.toMatchObject({ kind: 'held-by-other' });
    time.advance(40);
    expect(second.activePlayMs()).toBe(0);

    const before = await dump(backend);
    const changed = structuredClone(loaded.state);
    changed.essence = 999;
    await expect(second.commit(changed, NOW)).resolves.toEqual({ kind: 'lease-unavailable' });
    await expect(second.replace([{ store: 'meta', key: 'save', value: '{}' }])).resolves.toEqual({ kind: 'lease-unavailable' });
    expect(await dump(backend)).toEqual(before);
    expect((await first.commit(loaded.state, NOW)).kind).toBe('committed');
  });

  it('a commit against a moved revision is refused as stale; the stored bytes are the other writer\'s', async () => {
    const { backend, loaded } = await stored();
    const runtime = runtimeOn(backend, loaded);
    await runtime.heartbeat();
    await createRevisionedRepository(backend).mutate({ expectedRevision: 1, writes: [{ store: 'player', key: 'race', value: 'won' }] });
    const others = await dump(backend);

    const changed = structuredClone(loaded.state);
    changed.essence = 999;
    await expect(runtime.commit(changed, NOW)).resolves.toEqual({ kind: 'stale', expectedRevision: 1, actualRevision: 2 });
    expect(runtime.diagnostics()).toMatchObject({ revision: 1, leaseOwned: false, staleBlocked: true, accruing: false, staleWrites: 1 });
    await expect(runtime.commit(changed, NOW)).resolves.toEqual({ kind: 'lease-unavailable' });
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'lost' });
    const now = await dump(backend);
    expect(JSON.parse(now.meta!['f3:lease:active-play']!)).toMatchObject({ held: false, token: 'token-a' });
    delete now.meta!['f3:lease:active-play'];
    delete others.meta!['f3:lease:active-play'];
    expect(now).toEqual(others);
  });

  it('the active-play total and the random state are the same after release and a new runtime', async () => {
    const { backend, loaded } = await stored();
    const clockA = controlledClock();
    const runtimeA = runtimeOn(backend, loaded, { now: clockA.now, freshSessionSeed: 33, token: 'document-a' });
    await runtimeA.heartbeat();
    clockA.advance(450);
    expect((await runtimeA.commit(loaded.state, NOW)).kind).toBe('committed');
    clockA.advance(60); // play after the last checkpoint is not stored
    await runtimeA.release();

    const again = await load(backend);
    const authority = readF4Authority(again.extensions);
    if (authority.kind !== 'loaded') throw new Error('expected a stored authority');
    const runtimeB = runtimeOn(backend, again, {
      initialRevision: 2, restoredAuthority: authority.authority, freshSessionSeed: 99, token: 'document-b',
    });
    await expect(runtimeB.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    expect(runtimeB.activePlayMs()).toBe(450);
    expect(runtimeB.diagnostics()).toMatchObject({ sessionSeed: 33, sessionOrdinal: 0, sessionDraws: {} });
  });

  it('a stored authority is restored exactly and the fresh seed is not used', async () => {
    const { backend, loaded } = await stored();
    const time = controlledClock(10);
    const runtime = runtimeOn(backend, loaded, {
      now: time.now, freshSessionSeed: 999,
      restoredAuthority: { activePlayMs: 9_000, sessionRng: { seed: 42, ordinal: 3, draws: { capture: 2 } } },
    });
    await runtime.heartbeat();
    time.advance(5);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 9_005, sessionSeed: 42, sessionOrdinal: 3, sessionDraws: { capture: 2 } });
  });

  it('the checkpoint parent is a detached copy of the last stored state', async () => {
    const { backend, loaded } = await stored();
    const runtime = runtimeOn(backend, loaded);
    const first = runtime.checkpointParent();
    expect(first).not.toBeNull();
    first!.essence = 999;
    expect(runtime.checkpointParent()?.essence).toBe(loaded.state.essence);

    await runtime.heartbeat();
    const next = structuredClone(loaded.state);
    next.essence = loaded.state.essence + 7;
    expect((await runtime.commit(next, NOW)).kind).toBe('committed');
    next.essence += 100;
    expect(runtime.checkpointParent()?.essence).toBe(loaded.state.essence + 7);

    await expect(runtime.replace([])).resolves.toMatchObject({ kind: 'committed' });
    expect(runtime.checkpointParent()).toBeNull();
  });

  it('a checkpoint at the last revision is refused for good and stores nothing', async () => {
    const { backend, loaded } = await stored();
    await backend.apply([{ store: 'meta', key: F3_REVISION_KEY, value: String(F3_MAX_REVISION) }]);
    const runtime = runtimeOn(backend, loaded, { initialRevision: F3_MAX_REVISION });
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 0 });
    const before = await load(backend);

    await expect(runtime.commit(loaded.state, NOW)).resolves.toEqual({ kind: 'revision-exhausted', revision: F3_MAX_REVISION });
    expect(runtime.diagnostics()).toMatchObject({
      revision: F3_MAX_REVISION, commits: 0, staleWrites: 0, staleBlocked: true, leaseOwned: false, accruing: false,
    });
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'lost' });
    const after = await load(backend);
    expect(JSON.stringify(after.state)).toBe(JSON.stringify(before.state));
    expect(readF4Authority(after.extensions)).toEqual({ kind: 'absent' });
    expect(await backend.get('meta', F3_REVISION_KEY)).toBe(String(F3_MAX_REVISION));
  });

  it('a replacement clears the old expedition\'s receipts in the same transaction', async () => {
    const base = createMemoryBackend();
    const transactions: Array<{ rows: boolean; receiptsCleared: boolean }> = [];
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        const rows = operations.some((operation) => operation.store === 'player');
        const receiptsCleared = clearStores?.includes('receipts') === true;
        if (rows || receiptsCleared) transactions.push({ rows, receiptsCleared });
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const { loaded } = await stored(backend);
    const repository = createRevisionedRepository(backend);
    await repository.mutate({
      expectedRevision: 1, writes: [], receipt: { ordinal: 0, kind: 'old-settlement', witness: 'old:0' },
    });
    expect(await repository.readReceipt(0)).toBeDefined();
    const runtime = runtimeOn(backend, loaded, { initialRevision: 2 });
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');
    expect(await backend.keys('receipts')).toHaveLength(1); // an ordinary checkpoint keeps receipts

    const replacement = namedState('Replacement');
    replacement.essence = 9;
    const prepared = prepareV5Replacement(
      exportPortableV5Save({ state: replacement, extensions: {} }, REGISTRY, NOW), REGISTRY, NOW,
    );
    if (prepared.kind !== 'prepared') throw new Error('expected a prepared replacement');
    transactions.length = 0;
    await expect(runtime.replace(prepared.operations)).resolves.toMatchObject({ kind: 'committed', revision: 4 });
    expect(transactions).toEqual([{ rows: true, receiptsCleared: true }]);
    expect(await backend.keys('receipts')).toEqual([]);
    expect(runtime.revision).toBe(4);
    const after = await load(backend);
    expect(after.state.explorerName).toBe('Replacement');
    expect(after.state.essence).toBe(9);
    expect(readF4Authority(after.extensions)).toEqual({ kind: 'absent' });
  });

  it('a stale checkpoint leaves the stored state, carriers and receipts as they were', async () => {
    const { backend, loaded } = await stored();
    const repository = createRevisionedRepository(backend);
    const runtime = runtimeOn(backend, loaded);
    await runtime.heartbeat();
    const carrier: V5ExtensionWrite = { segment: 'inventory', namespace: 'test.carrier', carrier: { version: 1, json: '{"n":1}' } };
    expect((await runtime.commit(loaded.state, NOW, [carrier])).kind).toBe('committed');
    expect(runtime.extensions.inventory?.['test.carrier']).toEqual(carrier.carrier);
    const priorExtensions = runtime.extensions;
    await repository.mutate({ expectedRevision: 2, writes: [{ store: 'player', key: 'stale-control', value: 'winner' }] });
    const before = await load(backend);

    const candidate = structuredClone(loaded.state);
    candidate.essence = 555;
    await expect(runtime.commit(candidate, NOW, [{ ...carrier, carrier: { version: 1, json: '{"n":2}' } }]))
      .resolves.toEqual({ kind: 'stale', expectedRevision: 2, actualRevision: 3 });
    expect(runtime.extensions).toEqual(priorExtensions);
    const after = await load(backend);
    expect(after.state.essence).toBe(before.state.essence);
    expect(after.extensions).toEqual(before.extensions);
  });

  it('a checkpoint whose transaction aborts leaves this page at its revision and the store unchanged', async () => {
    const base = createMemoryBackend();
    let rejectNext = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (rejectNext && operations.some(({ store }) => store === 'player')) {
          rejectNext = false;
          throw new Error('injected transaction abort');
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const { loaded } = await stored(backend);
    const runtime = runtimeOn(backend, loaded);
    await runtime.heartbeat();
    expect((await runtime.commit(loaded.state, NOW)).kind).toBe('committed');
    const before = await dump(base);
    const candidate = structuredClone(loaded.state);
    candidate.essence = 555;
    rejectNext = true;
    await expect(runtime.commit(candidate, NOW)).rejects.toThrow('injected transaction abort');
    expect(runtime.revision).toBe(2);
    expect(await dump(base)).toEqual(before);
    expect((await runtime.commit(candidate, NOW)).kind).toBe('committed'); // the caller may try again
    expect((await load(base)).state.essence).toBe(555);
  });
});
