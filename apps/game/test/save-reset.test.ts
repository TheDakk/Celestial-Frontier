import { describe, expect, it } from 'vitest';
import {
  V5_SNAPSHOT_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  initializeFreshV5,
  prepareV5SaveWrite,
  type StorageBackend,
} from '@cf/persistence';
import { createBus } from '../src/bus';
import type { GameEvents, WriteHold } from '../src/events';
import { devicePreferences, deviceStorage } from '../src/platform/preferences';
import { REGISTRY, bootSave, createSaveLoop, resetExpedition } from '../src/save/index';
import { freshExpeditionPortable } from '../src/save/reset';
import { GALAXY_ROUTE, NOW, SOL_ROUTE, bootedPage, dump, namedState, withDeviceStorage } from './save-support';

const boot = (backend: StorageBackend) => bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE });

/** A played expedition with one receipt, as a product transaction leaves it: revision 2. */
async function playedBackend(): Promise<StorageBackend> {
  const backend = createMemoryBackend();
  const state = namedState('Nova');
  state.essence = 420;
  state.tutDone = true;
  state.savedView = GALAXY_ROUTE;
  const started = await initializeFreshV5(backend, { state, extensions: {} }, REGISTRY, NOW);
  if (started.kind !== 'initialized') throw new Error(started.kind);
  const written = await createRevisionedRepository(backend).mutate({
    expectedRevision: 1,
    writes: prepareV5SaveWrite({ state, extensions: {} }, REGISTRY, NOW).operations,
    receipt: { ordinal: 0, kind: 'old-settlement', witness: 'old:0' },
  });
  if (written.kind !== 'committed') throw new Error(written.kind);
  return backend;
}

async function resetHarness(hold?: Exclude<WriteHold, false>) {
  const page = await bootedPage(await playedBackend());
  if (hold === 'protected-payload') page.gate.protect('test');
  const gate = hold === 'transient-read' ? { ...page.gate, hold, mayWrite: () => false } : page.gate;
  const reloads: number[] = [];
  const deps = {
    runtime: page.runtime, gate, registry: REGISTRY, clocks: page.clocks, solView: SOL_ROUTE,
    settle: () => Promise.resolve(),
    reload: () => { reloads.push(1); },
  };
  return { ...page, deps, reloads };
}

describe('Reset expedition', () => {
  it('after a reset the store boots as a new expedition parked at Sol with training not done, and no receipt of the old one remains', async () => {
    const h = await resetHarness();
    expect(h.booted.state).toMatchObject({ explorerName: 'Nova', essence: 420, tutDone: true });
    expect(await h.backend.keys('receipts')).toHaveLength(1);

    expect(await resetExpedition(h.deps)).toBe('reset');
    expect(h.reloads).toHaveLength(1);
    for (let read = 0; read < 2; read++) {
      const again = await boot(h.backend);
      expect(again.kind).toBe('current');
      expect(again.hold).toBe(false);
      expect(again.state).toMatchObject({ explorerName: '', essence: 0, tutDone: false, savedView: SOL_ROUTE });
      expect(again.extensions).toEqual({});
    }
    expect(await h.backend.keys('receipts')).toEqual([]);
  });

  it('the page that reset gives up its lease, so the reloaded page can write at once', async () => {
    const h = await resetHarness();
    expect(await resetExpedition(h.deps)).toBe('reset');
    const next = await bootedPage(h.backend, 'document-b');
    expect(next.booted.kind).toBe('current');
    expect((await next.runtime.commit(next.live, NOW)).kind).toBe('committed');
  });

  it('the payload is exactly the state a new explorer boots with', async () => {
    const fresh = await boot(createMemoryBackend());
    expect(fresh.kind).toBe('fresh');
    const backend = createMemoryBackend();
    const h = await bootedPage(backend);
    expect(await resetExpedition({
      runtime: h.runtime, gate: h.gate, registry: REGISTRY, clocks: h.clocks, solView: SOL_ROUTE,
      settle: () => Promise.resolve(), reload: () => undefined,
    })).toBe('reset');
    expect((await boot(backend)).state).toEqual(fresh.state);
    expect(freshExpeditionPortable({ registry: REGISTRY, wallNow: NOW, solView: null }))
      .not.toBe(freshExpeditionPortable({ registry: REGISTRY, wallNow: NOW, solView: SOL_ROUTE }));
  });

  it('the reset\'s recovery snapshot is a portable one: a later corrupt row recovers from it', async () => {
    const h = await resetHarness();
    expect(await resetExpedition(h.deps)).toBe('reset');
    const snapshot = JSON.parse((await h.backend.get('journal', V5_SNAPSHOT_KEY))!) as { sourceSchema: number; raw: string };
    expect(snapshot.sourceSchema).toBe(5);
    expect(snapshot.raw).toBe(freshExpeditionPortable({ registry: REGISTRY, wallNow: NOW, solView: SOL_ROUTE }));

    await h.backend.apply([{ store: 'player', key: 'v5:player', value: '{broken' }]);
    const recovered = await boot(h.backend);
    expect(recovered.kind).toBe('recovered-protected');
    expect(recovered.state).toMatchObject({ explorerName: '', essence: 0, tutDone: false, savedView: SOL_ROUTE });
  });

  it.each(['transient-read', 'protected-payload'] as const)('a reset under a %s hold is refused and changes nothing', async (hold) => {
    const h = await resetHarness(hold);
    const before = await dump(h.backend);
    expect(await resetExpedition(h.deps)).toBe('refused');
    expect(await dump(h.backend)).toEqual(before);
    expect(h.reloads).toEqual([]);
  });

  it('a reset by a page that lost its lease is refused, changes nothing and leaves the page as it was', async () => {
    const h = await resetHarness();
    await h.runtime.setVisible(false);
    const before = await dump(h.backend);
    expect(await resetExpedition(h.deps)).toBe('refused');
    expect(await dump(h.backend)).toEqual(before);
    expect(h.reloads).toEqual([]);
    expect(h.gate.hold).toBe(false);
  });

  it('a reset another page\'s write beat is refused, keeps that write, and holds this page until it reloads', async () => {
    const h = await resetHarness();
    const other = namedState('Other');
    const moved = await createRevisionedRepository(h.backend).mutate({
      expectedRevision: 2, writes: prepareV5SaveWrite({ state: other, extensions: {} }, REGISTRY, NOW).operations,
    });
    expect(moved.kind).toBe('committed');
    expect(await resetExpedition(h.deps)).toBe('refused');
    expect(h.reloads).toEqual([]);
    expect(h.gate.hold).toBe('protected-payload');
    expect((await boot(h.backend)).state.explorerName).toBe('Other');
  });

  it('a reset asked for while a checkpoint is being stored waits for it and still resets', async () => {
    const h = await resetHarness();
    const loop = createSaveLoop({
      runtime: h.runtime, gate: h.gate, bus: createBus<GameEvents>(), clocks: h.clocks, backend: h.backend,
      live: () => h.live, route: () => h.live.savedView,
    });
    h.live.sndOn = false;
    const storing = loop.request('settings');
    expect(await resetExpedition({ ...h.deps, settle: () => loop.flush() })).toBe('reset');
    expect(await storing).toBe(true);
    expect((await boot(h.backend)).state).toMatchObject({ explorerName: '', tutDone: false, sndOn: true });
  });

  it('device preferences are untouched by a reset', async () => {
    await withDeviceStorage(async (rows) => {
      const preferences = devicePreferences(deviceStorage());
      expect(preferences.write('audio-accessibility/v1', '{"mono":true}')).toBe(true);
      const before = new Map(rows);
      expect(before.size).toBe(1);
      const h = await resetHarness();
      expect(await resetExpedition(h.deps)).toBe('reset');
      expect(rows).toEqual(before);
      expect(preferences.read('audio-accessibility/v1')).toBe('{"mono":true}');
    });
  });
});
