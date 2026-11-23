import { describe, expect, it } from 'vitest';
import {
  F3_MAX_REVISION,
  F3_REVISION_KEY,
  F4_AUTHORITY_NAMESPACE,
  V4_PRIMARY_KEY,
  V5_SCHEMA_KEY,
  V5_SNAPSHOT_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  exportPortableV5Save,
  prepareV5Replacement,
  type StorageBackend,
} from '@cf/persistence';
import { withFakeIndexedDB } from '../../../tests/support/fake-indexeddb';
import { SAVE_DATABASE, bootSave, createWriteGate, openSaveBackend, retryHeldRead, REGISTRY } from '../src/save/index';
import { NOW, SOL_ROUTE, dump, namedState, seedCurrentSave } from './save-support';

const boot = (backend: StorageBackend) => bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE });

async function setRow(backend: StorageBackend, store: 'meta' | 'player' | 'journal', key: string, change: (row: Record<string, unknown>) => unknown): Promise<void> {
  const raw = await backend.get(store, key);
  if (raw === undefined) throw new Error(`no row ${store}/${key}`);
  await backend.apply([{ store, key, value: JSON.stringify(change(JSON.parse(raw) as Record<string, unknown>)) }]);
}

/** A save replaced from a backup: it carries a portable recovery snapshot of the explorer `name`. */
async function seedWithSnapshot(backend: StorageBackend, name: string): Promise<void> {
  await seedCurrentSave(backend, 'Before');
  const portable = exportPortableV5Save({ state: namedState(name), extensions: {} }, REGISTRY, NOW);
  const prepared = prepareV5Replacement(portable, REGISTRY, NOW);
  if (prepared.kind !== 'prepared') throw new Error(`replacement was ${prepared.kind}`);
  const replaced = await createRevisionedRepository(backend).replace({ expectedRevision: 2, writes: prepared.operations });
  expect(replaced.kind).toBe('committed');
}

/** A backend whose reads fail, and which counts every write that reaches it. */
function failingReads(inner: StorageBackend): { backend: StorageBackend; writes: () => number } {
  let writes = 0;
  const backend: StorageBackend = {
    get: () => Promise.reject(new Error('storage unavailable')),
    keys: (store) => inner.keys(store),
    apply: (ops) => { writes++; return inner.apply(ops); },
    compareAndApply: (checks, ops, clear) => { writes++; return inner.compareAndApply(checks, ops, clear); },
    clear: (stores) => { writes++; return inner.clear(stores); },
  };
  return { backend, writes: () => writes };
}

describe('save boot', () => {
  it('an empty store boots a new expedition parked at Sol and stores it at revision 1', async () => {
    const backend = createMemoryBackend();
    const first = await boot(backend);
    expect(first).toMatchObject({ kind: 'fresh', hold: false, detail: null, revision: 1, restoredAuthority: null });
    expect(first.state.tutDone).toBe(false);
    expect(first.state.savedView).toEqual(SOL_ROUTE);
    expect(await backend.get('meta', F3_REVISION_KEY)).toBe('1');
    const again = await boot(backend);
    expect(again).toMatchObject({ kind: 'current', hold: false, revision: 1 });
    expect(again.state.tutDone).toBe(false);
    expect(again.state.savedView).toEqual(SOL_ROUTE);
  });

  it('a stored expedition boots as current with its own state and revision', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega');
    const before = await dump(backend);
    const result = await boot(backend);
    expect(result).toMatchObject({ kind: 'current', hold: false, detail: null, revision: 2 });
    expect(result.state.explorerName).toBe('Vega');
    expect(result.state.tutDone).toBe(true);
    expect(await dump(backend)).toEqual(before);
  });

  it('a future-version save boots held, shows a fresh state, and leaves the stored bytes unchanged', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega');
    await setRow(backend, 'meta', V5_SCHEMA_KEY, (row) => ({ ...row, schema: 6 }));
    const before = await dump(backend);
    const result = await boot(backend);
    expect(result.kind).toBe('future-protected');
    expect(result.hold).toBe('protected-payload');
    expect(result.state.tutDone).toBe(true); // the placeholder state, not a new game
    expect(result.state.explorerName).not.toBe('Vega');
    expect(await dump(backend)).toEqual(before);
  });

  it('a future player row, a future snapshot and a future clock carrier each boot held; bytes unchanged', async () => {
    const futureRow = createMemoryBackend();
    await seedCurrentSave(futureRow);
    await setRow(futureRow, 'player', 'v5:player', (row) => ({ ...row, schema: 6 }));

    const futureSnapshot = createMemoryBackend();
    await seedWithSnapshot(futureSnapshot, 'Snapshot');
    await futureSnapshot.apply([{ store: 'player', key: 'v5:player', value: '{broken' }]);
    await setRow(futureSnapshot, 'journal', V5_SNAPSHOT_KEY, (row) => ({ ...row, schema: 6 }));

    const futureClock = createMemoryBackend();
    await seedCurrentSave(futureClock, 'Vega', { player: { [F4_AUTHORITY_NAMESPACE]: { version: 2, json: '{}' } } });

    for (const backend of [futureRow, futureSnapshot, futureClock]) {
      const before = await dump(backend);
      expect(await boot(backend)).toMatchObject({ kind: 'future-protected', hold: 'protected-payload' });
      expect(await dump(backend)).toEqual(before);
    }
  });

  it('a corrupt player row with no snapshot boots held; bytes unchanged', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega');
    await backend.apply([{ store: 'player', key: 'v5:player', value: '{broken' }]);
    const before = await dump(backend);
    const result = await boot(backend);
    expect(result).toMatchObject({ kind: 'corrupt-protected', hold: 'protected-payload', revision: 0 });
    expect(result.state.explorerName).not.toBe('Vega');
    expect(await dump(backend)).toEqual(before);
  });

  it('a corrupt row with a portable snapshot shows the snapshot read-only; bytes unchanged', async () => {
    const backend = createMemoryBackend();
    await seedWithSnapshot(backend, 'Snapshot');
    await backend.apply([{ store: 'player', key: 'v5:player', value: '{broken' }]);
    const before = await dump(backend);
    const result = await boot(backend);
    expect(result).toMatchObject({ kind: 'recovered-protected', hold: 'protected-payload' });
    expect(result.state.explorerName).toBe('Snapshot');
    expect(await dump(backend)).toEqual(before);
  });

  it('a store holding only a v4 primary boots held as corrupt; bytes unchanged', async () => {
    const backend = createMemoryBackend();
    await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: JSON.stringify({ v: 4, essence: 12 }) }]);
    const before = await dump(backend);
    expect(await boot(backend)).toMatchObject({ kind: 'corrupt-protected', hold: 'protected-payload' });
    expect(await dump(backend)).toEqual(before);
  });

  it('a save at the last revision boots held, showing its own state; bytes unchanged', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega');
    await backend.apply([{ store: 'meta', key: F3_REVISION_KEY, value: String(F3_MAX_REVISION) }]);
    const before = await dump(backend);
    const result = await boot(backend);
    expect(result).toMatchObject({ kind: 'revision-exhausted-protected', hold: 'protected-payload' });
    expect(result.state.explorerName).toBe('Vega');
    expect(await dump(backend)).toEqual(before);
  });

  it('a read error boots held as transient and writes nothing', async () => {
    const inner = createMemoryBackend();
    await seedCurrentSave(inner, 'Vega');
    const before = await dump(inner);
    const failing = failingReads(inner);
    const result = await boot(failing.backend);
    expect(result).toMatchObject({ kind: 'transient-protected', hold: 'transient-read', detail: 'storage unavailable' });
    expect(failing.writes()).toBe(0);
    expect(await dump(inner)).toEqual(before);
  });

  it('one failed read boots held as transient even when storage answers again at once', async () => {
    const inner = createMemoryBackend();
    await seedCurrentSave(inner, 'Vega');
    const before = await dump(inner);
    let failed = false;
    const backend: StorageBackend = {
      ...inner,
      get: (store, key) => {
        if (failed) return inner.get(store, key);
        failed = true;
        return Promise.reject(new Error('storage unavailable'));
      },
    };
    expect(await boot(backend)).toMatchObject({ kind: 'transient-protected', hold: 'transient-read' });
    expect(await dump(inner)).toEqual(before);
  });

  it('a read error on an empty store does not start a new expedition', async () => {
    const inner = createMemoryBackend();
    const failing = failingReads(inner);
    expect((await boot(failing.backend)).hold).toBe('transient-read');
    expect(failing.writes()).toBe(0);
    expect(await inner.get('meta', F3_REVISION_KEY)).toBeUndefined();
  });

  it('two boots racing on an empty store end with one save, and both show it', async () => {
    const backend = createMemoryBackend();
    const [a, b] = await Promise.all([
      bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE }),
      bootSave({ backend, registry: REGISTRY, wallNow: NOW + 5, freshRoute: null }),
    ]);
    expect([a.kind, b.kind].sort()).toEqual(['current', 'fresh']);
    expect(a.hold).toBe(false);
    expect(b.hold).toBe(false);
    expect(await backend.get('meta', F3_REVISION_KEY)).toBe('1');
    const stored = await boot(backend);
    for (const page of [a, b]) {
      expect(page.revision).toBe(1);
      expect(page.state.savedView).toEqual(stored.state.savedView);
      expect(page.state.tutDone).toBe(false);
    }
  });
});

describe('the save database', () => {
  it('the app opens cf-v2-pixel and no other database', async () => {
    await withFakeIndexedDB(async (fake) => {
      const backend = openSaveBackend();
      expect((await boot(backend)).kind).toBe('fresh');
      expect((await boot(backend)).kind).toBe('current');
      expect(SAVE_DATABASE).toBe('cf-v2-pixel');
      expect(fake.opened.length).toBeGreaterThan(0);
      expect([...new Set(fake.opened.map((o) => o.name))]).toEqual(['cf-v2-pixel']);
      expect(fake.bytes('cf-v2-pixel').meta?.[F3_REVISION_KEY]).toBe('1');
    });
  });

  it('stores of the older games are never opened or changed', async () => {
    await withFakeIndexedDB(async (fake) => {
      fake.databases.set('cf-v2-slice', new Map([['meta', new Map([['save', '{"old":"slice"}']])]]));
      fake.databases.set('cf-v2', new Map([['meta', new Map([['save', '{"old":"v2"}']])]]));
      const touched: string[] = [];
      const prior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: new Proxy({}, { get: (_target, name) => { touched.push(String(name)); return undefined; } }),
      });
      try {
        const result = await boot(openSaveBackend());
        expect(result.kind).toBe('fresh');
        expect(result.state.essence).toBe(0);
      } finally {
        if (prior === undefined) delete (globalThis as { localStorage?: unknown }).localStorage;
        else Object.defineProperty(globalThis, 'localStorage', prior);
      }
      expect(touched).toEqual([]);
      expect(fake.opened.map((o) => o.name)).not.toContain('cf-v2-slice');
      expect(fake.opened.map((o) => o.name)).not.toContain('cf-v2');
      expect(fake.bytes('cf-v2-slice')).toEqual({ meta: { save: '{"old":"slice"}' } });
      expect(fake.bytes('cf-v2')).toEqual({ meta: { save: '{"old":"v2"}' } });
    });
  });
});

describe('the write hold', () => {
  it('a hold can tighten from transient to protected and never loosens', () => {
    const open = createWriteGate(false);
    expect(open.mayWrite()).toBe(true);
    const gate = createWriteGate('transient-read');
    expect(gate.mayWrite()).toBe(false);
    gate.protect('a newer build wrote this save');
    expect(gate.hold).toBe('protected-payload');
    expect(gate.detail).toBe('a newer build wrote this save');
    expect(gate.mayWrite()).toBe(false);
    open.protect('the save moved');
    expect(open.hold).toBe('protected-payload');
    expect(open.mayWrite()).toBe(false);
    expect(Object.keys(gate).sort()).toEqual(['detail', 'hold', 'holdTransient', 'mayWrite', 'protect']); // no way to loosen
    gate.holdTransient('storage failed');
    expect([gate.hold, gate.detail]).toEqual(['protected-payload', 'a newer build wrote this save']);
    const writable = createWriteGate(false);
    writable.holdTransient('storage failed');
    expect([writable.hold, writable.detail, writable.mayWrite()]).toEqual(['transient-read', 'storage failed', false]);
    expect(() => { (gate as { hold: unknown }).hold = false; }).toThrow();
    expect(gate.mayWrite()).toBe(false);
  });

  it('trying again after a transient read: a good read asks for a reload and the hold stays', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend);
    const before = await dump(backend);
    const gate = createWriteGate('transient-read');
    expect(await retryHeldRead({ backend, registry: REGISTRY, wallNow: NOW, gate })).toBe('reload');
    expect(gate.hold).toBe('transient-read');
    expect(await retryHeldRead({ backend: createMemoryBackend(), registry: REGISTRY, wallNow: NOW, gate })).toBe('reload');
    expect(await dump(backend)).toEqual(before);
  });

  it('trying again and finding a future or corrupt save tightens the hold; bytes unchanged', async () => {
    const future = createMemoryBackend();
    await seedCurrentSave(future);
    await setRow(future, 'meta', V5_SCHEMA_KEY, (row) => ({ ...row, schema: 6 }));
    const corrupt = createMemoryBackend();
    await seedCurrentSave(corrupt);
    await corrupt.apply([{ store: 'player', key: 'v5:player', value: '{broken' }]);
    for (const backend of [future, corrupt]) {
      const before = await dump(backend);
      const gate = createWriteGate('transient-read');
      expect(await retryHeldRead({ backend, registry: REGISTRY, wallNow: NOW, gate })).toBe('protected');
      expect(gate.hold).toBe('protected-payload');
      expect(await dump(backend)).toEqual(before);
    }
  });

  it('trying again while storage still fails leaves the transient hold', async () => {
    const gate = createWriteGate('transient-read');
    const failing = failingReads(createMemoryBackend());
    expect(await retryHeldRead({ backend: failing.backend, registry: REGISTRY, wallNow: NOW, gate })).toBe('unavailable');
    expect(gate.hold).toBe('transient-read');
    expect(failing.writes()).toBe(0);
  });
});
