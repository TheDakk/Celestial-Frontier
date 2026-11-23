import { describe, expect, it } from 'vitest';
import {
  F3_ACTIVE_PLAY_LEASE_KEY,
  STORES,
  createMemoryBackend,
  initializeFreshV5,
  readSaveV5,
  type StorageBackend,
} from '@cf/persistence';
import { REGISTRY } from '../src/save/registry';
import { createSaveRuntime, type SaveRuntimeInput } from '../src/save/runtime';
import { NOW, controlledClock, dump, namedState } from './save-support';

async function runtimeOn(backend: StorageBackend, over: Partial<SaveRuntimeInput> = {}) {
  if (await backend.get('meta', 'v5:schema') === undefined) {
    const started = await initializeFreshV5(backend, { state: namedState('Vega'), extensions: {} }, REGISTRY, NOW);
    if (started.kind !== 'initialized') throw new Error(`seed was ${started.kind}`);
  }
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(`expected a loaded save; got ${loaded.kind}`);
  const runtime = createSaveRuntime({
    backend, registry: REGISTRY,
    initialRevision: 1, initialExtensions: loaded.extensions, initialState: loaded.state,
    restoredAuthority: null, freshSessionSeed: 7,
    ownerId: 'tab', token: 'document-a', leaseTtlMs: 100,
    now: () => 0, visible: true, answerable: true,
    ...over,
  });
  return { runtime, state: loaded.state };
}

const leaseRow = async (backend: StorageBackend) => JSON.parse((await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!) as Record<string, unknown>;

/** A backend whose reads of the lease row fail while `failing.on` is set. */
function leaseReadsFail(message: string): { backend: StorageBackend; failing: { on: boolean } } {
  const base = createMemoryBackend();
  const failing = { on: false };
  const backend: StorageBackend = {
    ...base,
    async get(store, key) {
      if (failing.on && store === 'meta' && key === F3_ACTIVE_PLAY_LEASE_KEY) throw new Error(message);
      return base.get(store, key);
    },
  };
  return { backend, failing };
}

describe('save runtime: the tab lease', () => {
  it('a failed first lease read grants nothing; an explicit heartbeat acquires it later', async () => {
    const { backend, failing } = leaseReadsFail('injected lease acquire rejection');
    const time = controlledClock(100);
    const { runtime, state } = await runtimeOn(backend, { now: time.now });
    failing.on = true;
    time.advance(40);
    await expect(runtime.heartbeat()).resolves.toEqual({
      kind: 'storage-error', operation: 'acquire', message: 'injected lease acquire rejection',
    });
    time.advance(5_000);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 0, accruing: false, leaseOwned: false, leaseHeartbeat: null, leaseLosses: 0 });
    await expect(runtime.commit(state, NOW)).resolves.toEqual({ kind: 'lease-unavailable' });

    failing.on = false;
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 0 });
    time.advance(25);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 25, accruing: true, leaseOwned: true });
  });

  it('a failed renewal revokes the lease and stops accrual at once', async () => {
    const { backend, failing } = leaseReadsFail('injected lease renew rejection');
    const time = controlledClock();
    const { runtime, state } = await runtimeOn(backend, { now: time.now });
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 0 });
    time.advance(40);
    failing.on = true;
    await expect(runtime.heartbeat()).resolves.toEqual({
      kind: 'storage-error', operation: 'renew', message: 'injected lease renew rejection',
    });
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 40, accruing: false, leaseOwned: false, leaseHeartbeat: null, leaseLosses: 1 });
    time.advance(5_000);
    expect(runtime.activePlayMs()).toBe(40);
    await expect(runtime.commit(state, NOW)).resolves.toEqual({ kind: 'lease-unavailable' });

    failing.on = false;
    await expect(runtime.heartbeat()).resolves.toEqual({ kind: 'owned', heartbeat: 1 });
    time.advance(25);
    expect(runtime.diagnostics()).toMatchObject({ activePlayMs: 65, accruing: true, leaseOwned: true });
  });

  it('a page whose lease another page took over can neither commit nor replace; nothing is written', async () => {
    const backend = createMemoryBackend();
    for (const act of ['commit', 'replace'] as const) {
      await backend.clear(STORES);
      const { runtime: first, state } = await runtimeOn(backend);
      await expect(first.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
      const time = controlledClock();
      const { runtime: successor } = await runtimeOn(backend, { token: 'document-b', now: time.now });
      await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'held-by-other' });
      time.advance(150); // the first page's lease ran out unrenewed
      await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
      const before = await dump(backend);

      const changed = structuredClone(state);
      changed.essence = 999;
      const outcome = act === 'commit'
        ? await first.commit(changed, NOW)
        : await first.replace([{ store: 'player', key: 'v5:player', value: '{}' }]);
      expect(outcome.kind).toBe(act === 'commit' ? 'lost' : 'fence-lost');
      expect(first.diagnostics()).toMatchObject({ leaseOwned: false, accruing: false });
      expect(await dump(backend)).toEqual(before);
    }
  });

  it('hide, show and release wait behind a heartbeat in flight, so no late grant survives', async () => {
    const base = createMemoryBackend();
    const control: { release: (() => void) | null } = { release: null };
    let delayNext = false;
    let entered: Promise<void> = Promise.resolve();
    let markEntered: (() => void) | null = null;
    const armDelay = (): void => {
      delayNext = true;
      entered = new Promise<void>((resolve) => { markEntered = resolve; });
    };
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (delayNext) {
          delayNext = false;
          markEntered?.();
          await new Promise<void>((resolve) => { control.release = resolve; });
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const { runtime } = await runtimeOn(backend);

    armDelay();
    const heartbeat = runtime.heartbeat();
    await entered;
    const hidden = runtime.setVisible(false);
    const shown = runtime.setVisible(true);
    control.release?.();
    await expect(heartbeat).resolves.toEqual({ kind: 'lost' });
    await hidden;
    await expect(shown).resolves.toMatchObject({ kind: 'owned' });
    expect(runtime.diagnostics()).toMatchObject({ visible: true, leaseOwned: true, accruing: true });

    armDelay();
    const renewing = runtime.heartbeat();
    await entered;
    const released = runtime.release();
    control.release?.();
    await expect(renewing).resolves.toEqual({ kind: 'lost' });
    await released;
    expect(runtime.diagnostics()).toMatchObject({ visible: false, leaseOwned: false, accruing: false });
    expect((await leaseRow(backend)).held).toBe(false);
  });

  it('a rejected release on hide is retried once by release, and never releases a successor', async () => {
    const base = createMemoryBackend();
    let rejectNextRelease = true;
    let releaseAttempts = 0;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        const releasesFirstDocument = operations.some((operation) => {
          if (operation.store !== 'meta' || operation.key !== F3_ACTIVE_PLAY_LEASE_KEY || operation.value === undefined) return false;
          const record = JSON.parse(operation.value) as { held?: unknown; token?: unknown };
          return record.held === false && record.token === 'document-a';
        });
        if (releasesFirstDocument) {
          releaseAttempts++;
          if (rejectNextRelease) {
            rejectNextRelease = false;
            throw new Error('injected first lease release rejection');
          }
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const time = controlledClock();
    const { runtime: first } = await runtimeOn(backend, { now: time.now });
    await expect(first.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    time.advance(40);

    await expect(first.setVisible(false)).rejects.toThrow('injected first lease release rejection');
    expect(first.diagnostics()).toMatchObject({ visible: false, leaseOwned: false, accruing: false, activePlayMs: 40 });
    time.advance(500);
    expect(first.activePlayMs()).toBe(40);
    await expect(first.setVisible(true)).resolves.toEqual({ kind: 'lost' });
    time.advance(500);
    expect(first.diagnostics()).toMatchObject({ visible: true, leaseOwned: false, accruing: false, activePlayMs: 40 });

    await first.release();
    expect(releaseAttempts).toBe(2);
    expect(await leaseRow(backend)).toMatchObject({ held: false, token: 'document-a' });

    const { runtime: successor } = await runtimeOn(backend, { token: 'document-b', now: time.now });
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    const successorRaw = await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY);
    await first.release();
    expect(releaseAttempts).toBe(2);
    expect(await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY)).toBe(successorRaw);
    expect(JSON.parse(successorRaw!)).toMatchObject({ held: true, token: 'document-b' });
  });

  it('a replacement that neither commits nor moves the revision blocks this page and frees its lease', async () => {
    const base = createMemoryBackend();
    let refuseReplacement = false;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (refuseReplacement && clearStores?.includes('receipts')) return false;
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const { runtime: first } = await runtimeOn(backend);
    await expect(first.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    refuseReplacement = true;
    await expect(first.replace([])).resolves.toEqual({ kind: 'conflict', expectedRevision: 1 });
    expect(first.diagnostics()).toMatchObject({ staleBlocked: true, leaseOwned: false, accruing: false });
    expect(await leaseRow(backend)).toMatchObject({ held: false, token: 'document-a' });

    const { runtime: successor } = await runtimeOn(backend, { token: 'document-b' });
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    const successorRaw = await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY);
    expect(JSON.parse(successorRaw!)).toMatchObject({ held: true, token: 'document-b' });
    await first.release();
    expect(await backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY)).toBe(successorRaw);
  });
});
