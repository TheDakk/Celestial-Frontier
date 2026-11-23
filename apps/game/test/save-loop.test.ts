import { describe, expect, it } from 'vitest';
import { EPOCH_TICK } from '@cf/domain-progression';
import {
  F3_ACTIVE_PLAY_LEASE_KEY,
  F3_REVISION_KEY,
  V5_SCHEMA_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  readF4Authority,
  type StorageBackend,
} from '@cf/persistence';
import { createBus } from '../src/bus';
import type { GameEvents } from '../src/events';
import { CHECKPOINT_MS } from '../src/save/save-loop';
import { LEASE_TTL_MS, REGISTRY, bootSave, createSaveLoop, createSaveRuntime, createWriteGate } from '../src/save/index';
import { boot, bootedHarness, pausable } from './save-loop-support';
import { GALAXY_ROUTE, NOW, controlledClock, dump, seedCurrentSave } from './save-support';

const TICK_MS = EPOCH_TICK * 1000;
const withoutLease = (rows: Record<string, Record<string, string>>) => {
  const meta = { ...rows.meta };
  delete meta[F3_ACTIVE_PLAY_LEASE_KEY];
  return { ...rows, meta };
};

describe('save loop', () => {
  it('a changed setting and route are in the stored save after request() and after a new boot', async () => {
    const h = await bootedHarness();
    h.live.fsMode = 'fs-xl';
    h.setRoute(GALAXY_ROUTE);
    expect(await h.loop.request('settings')).toBe(true);
    expect(h.committed).toEqual([3]);
    expect(h.live.savedView).toEqual(GALAXY_ROUTE);
    const again = await boot(h.backend);
    expect(again.kind).toBe('current');
    expect(again.revision).toBe(3);
    expect(again.state.fsMode).toBe('fs-xl');
    expect(again.state.savedView).toEqual(GALAXY_ROUTE);
  });

  it('only the route, the settings and the epoch are laid over the stored state', async () => {
    const h = await bootedHarness();
    h.live.essence = 5_000; // not a checkpoint field: it changes only through its own transaction
    h.live.sndOn = false;
    expect(await h.loop.request('settings')).toBe(true);
    const again = await boot(h.backend);
    expect(again.state.sndOn).toBe(false);
    expect(again.state.essence).toBe(0);
  });

  it.each(['transient', 'future', 'corrupt'] as const)('under a %s hold request() resolves false and the stored bytes are unchanged', async (kind) => {
    const inner = createMemoryBackend();
    await seedCurrentSave(inner, 'Vega');
    if (kind === 'future') {
      const row = JSON.parse((await inner.get('meta', V5_SCHEMA_KEY))!) as Record<string, unknown>;
      await inner.apply([{ store: 'meta', key: V5_SCHEMA_KEY, value: JSON.stringify({ ...row, schema: 6 }) }]);
    }
    if (kind === 'corrupt') await inner.apply([{ store: 'player', key: 'v5:player', value: '{broken' }]);
    let failed = kind !== 'transient';
    const backend: StorageBackend = {
      ...inner,
      get: (store, key) => {
        if (failed) return inner.get(store, key);
        failed = true;
        return Promise.reject(new Error('storage unavailable'));
      },
    };
    const before = await dump(inner);

    const h = await bootedHarness(backend);
    expect(h.booted.hold).toBe(kind === 'transient' ? 'transient-read' : 'protected-payload');
    expect(h.loop.status).toBe('held');
    h.live.fsMode = 'fs-xl';
    h.setRoute(GALAXY_ROUTE);
    for (const reason of ['route', 'settings', 'epoch-edge', 'lifecycle'] as const) {
      expect(await h.loop.request(reason)).toBe(false);
    }
    h.time.advance(CHECKPOINT_MS + TICK_MS);
    await h.loop.beat();
    await h.loop.hide();
    await h.loop.show();
    await h.loop.flush();
    expect(h.committed).toEqual([]);
    expect(h.loop.publishedEpoch()).toBe(h.booted.state.EPOCH_BASE);
    expect(await dump(inner)).toEqual(before);
  });

  it('a refused commit makes the page read-only and emits save:reload-required once', async () => {
    const h = await bootedHarness();
    await createRevisionedRepository(h.backend).mutate({ expectedRevision: 2, writes: [{ store: 'player', key: 'race', value: 'won' }] });
    const others = await dump(h.backend);

    h.live.fsMode = 'fs-xl';
    expect(await h.loop.request('settings')).toBe(false);
    expect(h.loop.status).toBe('reload-required');
    expect(h.reloads).toEqual(['stale revision 2/3']);
    expect(await h.loop.request('settings')).toBe(false);
    expect(await h.loop.request('route')).toBe(false);
    await h.loop.beat();
    await h.loop.hide();
    await h.loop.show();
    expect(h.reloads).toHaveLength(1);
    expect(h.committed).toEqual([]);
    expect(h.runtime.diagnostics()).toMatchObject({ leaseOwned: false, accruing: false });
    const now = await dump(h.backend);
    expect(JSON.parse(now.meta![F3_ACTIVE_PLAY_LEASE_KEY]!)).toMatchObject({ held: false });
    expect(withoutLease(now)).toEqual(withoutLease(others));
  });

  it('a lease another page took over, and a write that storage aborts, each make the page read-only', async () => {
    const lost = await bootedHarness();
    const time = controlledClock();
    const successor = await bootedHarness(lost.backend, 'document-b', time);
    expect(await successor.loop.request('settings')).toBe(false); // the first page holds the lease
    expect(successor.loop.status).toBe('idle');
    time.advance(LEASE_TTL_MS + 1); // the first page stopped renewing
    await successor.loop.beat();
    expect(await successor.loop.request('settings')).toBe(true);
    lost.live.fsMode = 'fs-xl';
    expect(await lost.loop.request('settings')).toBe(false);
    expect(lost.loop.status).toBe('reload-required');
    expect(lost.reloads).toHaveLength(1);
    expect((await boot(lost.backend)).state.fsMode).toBe('');

    const base = createMemoryBackend();
    let abort = false;
    const aborted = await bootedHarness({
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (abort && operations.some((operation) => operation.store === 'player')) throw new Error('injected abort');
        return base.compareAndApply(checks, operations, clearStores);
      },
    });
    abort = true;
    aborted.live.fsMode = 'fs-xl';
    expect(await aborted.loop.request('settings')).toBe(false);
    expect(aborted.loop.status).toBe('reload-required');
    expect(aborted.reloads).toEqual(['save attempt rejected (injected abort)']);
    expect(await base.get('meta', F3_REVISION_KEY)).toBe('2');
  });

  it('ten requests during one write produce at most two commits', async () => {
    const storage = pausable();
    const h = await bootedHarness(storage.backend);
    const entered = storage.pauseNext();
    h.live.fsMode = 'fs-lg';
    const first = h.loop.request('settings');
    await entered;
    expect(h.loop.status).toBe('writing');
    const later: Array<Promise<boolean>> = [];
    for (let i = 0; i < 10; i++) {
      h.live.sfxVol = i / 10;
      later.push(h.loop.request(i % 2 === 0 ? 'settings' : 'route'));
    }
    h.live.fsMode = 'fs-xl';
    storage.release();
    expect(await first).toBe(true);
    expect(await Promise.all(later)).toEqual(new Array(10).fill(true));
    await h.loop.flush();
    expect(h.loop.status).toBe('idle');
    expect(h.committed).toEqual([3, 4]);
    const again = await boot(h.backend);
    expect(again.revision).toBe(4);
    expect(again.state.fsMode).toBe('fs-xl');
    expect(again.state.sfxVol).toBe(0.9);
  });

  it('a request made the moment a write finishes still waits its turn', async () => {
    const h = await bootedHarness();
    const results: boolean[] = [];
    const chain = async (): Promise<void> => {
      for (let i = 0; i < 4; i++) {
        h.live.sfxVol = i / 10;
        results.push(await h.loop.request('settings'));
      }
    };
    await Promise.all([chain(), chain(), chain()]);
    await h.loop.flush();
    expect(results).toEqual(new Array(12).fill(true));
    expect(h.reloads).toEqual([]);
    expect(h.loop.status).toBe('idle');
  });

  it('a request made while a heartbeat is checking the revision is stored, not mistaken for another writer', async () => {
    const base = createMemoryBackend();
    let armed = false;
    let entered: () => void = () => undefined;
    let release: () => void = () => undefined;
    const h = await bootedHarness({
      ...base,
      async get(store, key) {
        const value = await base.get(store, key);
        if (armed && key === F3_REVISION_KEY) {
          armed = false;
          entered();
          await new Promise<void>((resolve) => { release = resolve; });
        }
        return value;
      },
    });
    const reading = new Promise<void>((resolve) => { entered = resolve; });
    h.time.advance(CHECKPOINT_MS); // a checkpoint is due by time as well: the request's write is that checkpoint
    armed = true;
    const beat = h.loop.beat();
    await reading;
    h.live.fsMode = 'fs-xl';
    const stored = h.loop.request('settings');
    await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
    release();
    await beat;
    expect(await stored).toBe(true);
    await h.loop.flush();
    expect(h.committed).toEqual([3]);
    expect(h.reloads).toEqual([]);
    expect(h.loop.status).toBe('idle');
    expect((await boot(base)).state.fsMode).toBe('fs-xl');
  });

  it('crossing an epoch tick publishes the new epoch after the commit, never before', async () => {
    const storage = pausable();
    const h = await bootedHarness(storage.backend);
    const start = h.loop.publishedEpoch();
    h.time.advance(TICK_MS - 100);
    expect(await h.loop.request('settings')).toBe(true); // a checkpoint just before the tick
    expect(await h.loop.request('epoch-edge')).toBe(false); // no tick crossed: nothing to store
    expect(h.committed).toEqual([3]);
    expect(h.loop.publishedEpoch()).toBe(start);

    h.time.advance(200);
    expect(h.loop.publishedEpoch()).toBe(start);
    const entered = storage.pauseNext();
    const beat = h.loop.beat(); // the heartbeat sees the tick and stores it
    await entered;
    expect(h.loop.publishedEpoch()).toBe(start);
    expect(h.live.EPOCH_BASE).toBe(start);
    storage.release();
    await beat;
    expect(h.committed).toEqual([3, 4]);
    expect(h.loop.publishedEpoch()).toBe(start + 1);
    expect(h.live.EPOCH_BASE).toBe(start + 1);
    expect(h.reloads).toEqual([]);

    await h.loop.hide();
    const again = await bootedHarness(h.backend, 'document-b');
    expect(again.booted.state.EPOCH_BASE).toBe(start + 1);
    expect(again.loop.publishedEpoch()).toBe(start + 1);
  });

  it('an epoch tick whose commit is refused is never published', async () => {
    const h = await bootedHarness();
    const start = h.loop.publishedEpoch();
    h.time.advance(TICK_MS + 5);
    await createRevisionedRepository(h.backend).mutate({ expectedRevision: 2, writes: [{ store: 'player', key: 'race', value: 'won' }] });
    expect(await h.loop.request('epoch-edge')).toBe(false);
    expect(h.loop.status).toBe('reload-required');
    expect(h.loop.publishedEpoch()).toBe(start);
    expect(h.live.EPOCH_BASE).toBe(start);
  });

  it('a hidden page does not advance the epoch', async () => {
    const h = await bootedHarness();
    const start = h.loop.publishedEpoch();
    h.time.advance(TICK_MS - 1_000);
    await h.loop.hide();
    h.time.advance(3 * TICK_MS);
    await h.loop.beat(); // a heartbeat while hidden does nothing
    expect(await h.loop.request('epoch-edge')).toBe(false);
    await h.loop.show();
    await h.loop.beat();
    expect(h.loop.publishedEpoch()).toBe(start);
    expect(h.runtime.activePlayMs()).toBe(TICK_MS - 1_000);

    h.time.advance(1_000);
    await h.loop.beat();
    expect(h.loop.publishedEpoch()).toBe(start + 1);
    expect(h.reloads).toEqual([]);
  });

  it('hiding the page stops accrual, stores a lifecycle checkpoint and frees the lease', async () => {
    const storage = pausable();
    const h = await bootedHarness(storage.backend);
    h.live.fsMode = 'fs-lg';
    h.setRoute(GALAXY_ROUTE);
    h.time.advance(4_500);
    const entered = storage.pauseNext();
    const hidden = h.loop.hide();
    await entered;
    h.time.advance(1_000); // the checkpoint is still being stored: accrual stopped when the page hid
    storage.release();
    await hidden;
    h.time.advance(60_000);
    expect(h.committed).toEqual([3]);
    expect(h.runtime.activePlayMs()).toBe(4_500);
    expect(JSON.parse((await h.backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!)).toMatchObject({ held: false });
    const again = await boot(h.backend);
    expect(again.state.fsMode).toBe('fs-lg');
    expect(again.state.savedView).toEqual(GALAXY_ROUTE);
    expect(again.restoredAuthority?.activePlayMs).toBe(4_500);
    expect(readF4Authority(again.extensions).kind).toBe('loaded');

    await h.loop.show();
    h.time.advance(500);
    expect(h.runtime.activePlayMs()).toBe(5_000);
    expect(await h.loop.request('settings')).toBe(true);
  });

  it('a lease that storage refuses to free on hide is freed by a second attempt', async () => {
    const base = createMemoryBackend();
    let rejectNextRelease = true;
    const h = await bootedHarness({
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        const frees = operations.some((operation) => operation.key === F3_ACTIVE_PLAY_LEASE_KEY
          && operation.value !== undefined && (JSON.parse(operation.value) as { held?: unknown }).held === false);
        if (frees && rejectNextRelease) {
          rejectNextRelease = false;
          throw new Error('injected lease release rejection');
        }
        return base.compareAndApply(checks, operations, clearStores);
      },
    });
    h.live.fsMode = 'fs-lg';
    await h.loop.hide();
    expect(h.committed).toEqual([3]);
    expect(JSON.parse((await base.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!)).toMatchObject({ held: false });
    expect(h.runtime.diagnostics()).toMatchObject({ leaseOwned: false, accruing: false });
  });

  it('a heartbeat stores a checkpoint once thirty seconds have passed since the last one', async () => {
    expect(CHECKPOINT_MS).toBe(30_000);
    const h = await bootedHarness();
    h.live.fsMode = 'fs-lg';
    h.time.advance(CHECKPOINT_MS - 1);
    await h.loop.beat();
    expect(h.committed).toEqual([]);
    h.time.advance(1);
    await h.loop.beat();
    expect(h.committed).toEqual([3]);
    h.time.advance(CHECKPOINT_MS - 1);
    await h.loop.beat();
    expect(h.committed).toEqual([3]);
    expect((await boot(h.backend)).state.fsMode).toBe('fs-lg');
  });

  it('a page that takes the lease after another page wrote becomes read-only without writing', async () => {
    const a = await bootedHarness();
    let holdReads = false;
    const waiting: Array<() => void> = [];
    const b = await bootedHarness({
      ...a.backend,
      async get(store, key) {
        const value = await a.backend.get(store, key);
        if (holdReads && key === F3_REVISION_KEY) await new Promise<void>((resolve) => { waiting.push(resolve); });
        return value;
      },
    }, 'document-b', a.time);
    a.live.fsMode = 'fs-xl';
    expect(await a.loop.request('settings')).toBe(true);
    await a.loop.hide();
    const before = withoutLease(await dump(a.backend));

    b.live.fsMode = 'fs-lg';
    holdReads = true;
    const both = Promise.all([b.loop.beat(), b.loop.show()]); // both take the lease and both find the moved revision
    while (waiting.length < 2) await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
    holdReads = false;
    for (const resume of waiting) resume();
    await both;
    expect(b.loop.status).toBe('reload-required');
    expect(b.reloads).toEqual(['lease acquisition observed revision 2/4']); // the write and the hide checkpoint; asked once
    expect(await b.loop.request('settings')).toBe(false);
    expect(withoutLease(await dump(a.backend))).toEqual(before);
    expect(JSON.parse((await a.backend.get('meta', F3_ACTIVE_PLAY_LEASE_KEY))!)).toMatchObject({ held: false });
  });

  it('hiding twice at once stores one checkpoint; showing during a hide ends visible and accruing', async () => {
    const h = await bootedHarness();
    h.live.fsMode = 'fs-lg';
    await Promise.all([h.loop.hide(), h.loop.hide()]);
    expect(h.committed).toEqual([3]);

    await h.loop.show();
    const before = h.runtime.activePlayMs();
    const hiding = h.loop.hide();
    const showing = h.loop.show();
    await Promise.all([hiding, showing]);
    h.time.advance(700);
    expect(h.runtime.activePlayMs()).toBe(before + 700);
    expect(h.runtime.diagnostics()).toMatchObject({ visible: true, leaseOwned: true });
    expect(await h.loop.request('settings')).toBe(true);
    expect(h.reloads).toEqual([]);
  });

  it('a page that gets the lease on a later heartbeat starts accruing then', async () => {
    const a = await bootedHarness();
    const time = controlledClock();
    const b = await bootedHarness(a.backend, 'document-b', time);
    await b.loop.show(); // the lease is still the first page's
    time.advance(2_000);
    expect(b.runtime.activePlayMs()).toBe(0);
    time.advance(LEASE_TTL_MS); // the first page stopped renewing
    await b.loop.beat();
    time.advance(500);
    expect(b.runtime.activePlayMs()).toBe(500);
    expect(a.reloads).toEqual([]);
  });

  it('a listener that fails on hearing of a stored checkpoint costs the page nothing: it is stored and the page keeps writing', async () => {
    const h = await bootedHarness();
    h.bus.on('save:committed', () => { throw new Error('listener failed'); });
    h.live.fsMode = 'fs-xl';
    expect(await h.loop.request('settings')).toBe(true);
    expect([h.loop.status, h.reloads, h.loop.mayWrite()]).toEqual(['idle', [], true]);
    h.live.toneMode = 'tone-max';
    expect(await h.loop.request('settings')).toBe(true);
    const stored = (await boot(h.backend)).state;
    expect([stored.fsMode, stored.toneMode]).toEqual(['fs-xl', 'tone-max']);
  });
});
