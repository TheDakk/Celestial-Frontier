import { describe, it, expect } from 'vitest';
import {
  createSaveRepository, createMemoryBackend, createIndexedDBBackend, STORES,
} from '@cf/persistence';


const fakeEvents = {
  addEventListener(this: unknown, kind: string, listener: (event: unknown) => void) { (this as Record<string, unknown>)[`on${kind}`] = () => listener({target:this,type:kind}); },
  removeEventListener(this: unknown, kind: string) { (this as Record<string, unknown>)[`on${kind}`]=null; },
};
describe('@cf/persistence — repository and the CF-RR-002 reset law', () => {
  it('write / readPrimary round-trips', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    await repo.write('{"epoch":3}');
    expect(await repo.readPrimary()).toBe('{"epoch":3}');
  });
  it('apply() is atomic: a staged batch lands whole', async () => {
    const be = createMemoryBackend();
    await be.apply([
      { store: 'player', key: 'a', value: '1' },
      { store: 'player', key: 'b', value: '2' },
      { store: 'settings', key: 'vol', value: '0.8' },
    ]);
    expect(await be.keys('player')).toEqual(['a', 'b']);
    expect(await be.get('settings', 'vol')).toBe('0.8');
  });
  it('the F3 store set is complete, including immutable receipts and the disposable asset cache', () => {
    expect([...STORES]).toEqual(['meta', 'player', 'creatures', 'catalog', 'inventory', 'settings', 'journal', 'receipts', 'assetcache']);
  });
  it('reset clears every current store so split data cannot resurrect later', async () => {
    const backend = createMemoryBackend();
    const repo = createSaveRepository(backend);
    for (const store of STORES) {
      await backend.apply([{ store, key: `sentinel:${store}`, value: `held:${store}` }]);
    }

    await repo.reset();

    for (const store of STORES) {
      expect(await backend.keys(store), `${store} survived the repository reset`).toEqual([]);
    }
  });
  it('a rejected IndexedDB open is retried instead of poisoning the repository forever', async () => {
    const prior = globalThis.indexedDB;
    let attempts = 0;
    const fakeDb = {
      objectStoreNames: { contains: () => true },
      createObjectStore: () => ({}),
      close: () => {},
      onclose: null,
      onversionchange: null,
      transaction: () => {
        const tx = {
          oncomplete: null as null | (() => void),
          onerror: null,
          onabort: null,
          error: null,
          objectStore: () => ({ get: () => ({ result: 'recovered' }) }),
        };
        queueMicrotask(() => tx.oncomplete?.());
        return Object.assign(tx, fakeEvents);
      },
    };
    globalThis.indexedDB = {
      open: () => {
        attempts++;
        const req = {
          result: fakeDb,
          error: new Error('first open failed'),
          onupgradeneeded: null as null | (() => void),
          onsuccess: null as null | (() => void),
          onerror: null as null | (() => void),
          onblocked: null as null | (() => void),
        };
        queueMicrotask(() => { if (attempts === 1) req.onerror?.(); else req.onsuccess?.(); });
        return Object.assign(req, fakeEvents);
      },
    } as unknown as IDBFactory;
    try {
      const backend = createIndexedDBBackend('retry-test');
      await expect(backend.get('meta', 'save')).rejects.toThrow('first open failed');
      await expect(backend.get('meta', 'save')).resolves.toBe('recovered');
      expect(attempts).toBe(2);
    } finally {
      globalThis.indexedDB = prior;
    }
  });
  it('a blocked attempt that later succeeds closes its abandoned database', async () => {
    const prior = globalThis.indexedDB;
    let attempts = 0;
    let firstRequest: {
      result: IDBDatabase;
      onupgradeneeded: null | (() => void);
      onsuccess: null | (() => void);
      onerror: null | (() => void);
      onblocked: null | (() => void);
    } | null = null;
    let orphanCloses = 0;
    const transactionDb = (value: string, onClose = () => {}): IDBDatabase => ({
      objectStoreNames: { contains: () => true },
      createObjectStore: () => ({}),
      close: onClose,
      onclose: null,
      onversionchange: null,
      transaction: () => {
        const tx = {
          oncomplete: null as null | (() => void), onerror: null, onabort: null, error: null,
          objectStore: () => ({ get: () => ({ result: value }) }),
        };
        queueMicrotask(() => tx.oncomplete?.());
        return Object.assign(tx, fakeEvents);
      },
    } as unknown as IDBDatabase);
    const orphan = transactionDb('orphan', () => { orphanCloses++; });
    const live = transactionDb('live');
    globalThis.indexedDB = {
      open: () => {
        attempts++;
        const req = {
          result: attempts === 1 ? orphan : live,
          error: null,
          onupgradeneeded: null as null | (() => void),
          onsuccess: null as null | (() => void),
          onerror: null as null | (() => void),
          onblocked: null as null | (() => void),
        };
        if (attempts === 1) {
          firstRequest = req as typeof firstRequest;
          queueMicrotask(() => req.onblocked?.());
        } else queueMicrotask(() => req.onsuccess?.());
        return Object.assign(req, fakeEvents);
      },
    } as unknown as IDBFactory;
    try {
      const backend = createIndexedDBBackend('blocked-retry-test');
      await expect(backend.get('meta', 'save')).rejects.toThrow('IndexedDB open blocked');
      await expect(backend.get('meta', 'save')).resolves.toBe('live');
      firstRequest!.onsuccess?.();
      expect(orphanCloses).toBe(1);
      expect(attempts).toBe(2);
    } finally {
      globalThis.indexedDB = prior;
    }
  });
});
