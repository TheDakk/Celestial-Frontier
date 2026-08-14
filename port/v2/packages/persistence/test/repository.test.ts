import { describe, it, expect } from 'vitest';
import {
  createSaveRepository, createMemoryBackend, createIndexedDBBackend,
  readSaveWithRecovery, STORES, type StoredPayloadStatus,
} from '@cf/persistence';

const classifyFixturePayload = (raw: string): StoredPayloadStatus => {
  if (raw.startsWith('supported:')) return 'supported';
  if (raw.startsWith('future:')) return 'future-version';
  return 'invalid';
};

describe('@cf/persistence — repository + the CF-RR-002 recovery semantics', () => {
  it('write / readPrimary round-trips', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    await repo.write('{"epoch":3}');
    expect(await repo.readPrimary()).toBe('{"epoch":3}');
  });
  it('backup is promoted ONLY explicitly (after a proven load), never at write time', async () => {
    const be = createMemoryBackend();
    const repo = createSaveRepository(be);
    await repo.write('v1');
    /* corrupt the primary before any promotion — nothing to recover */
    await repo.write('###corrupt###');
    expect(await repo.recover((raw) => raw === 'v2')).toBeUndefined();
    /* now a payload proves it loads and is promoted; corruption recovers */
    await repo.write('v2');
    await repo.promoteLastKnownGood('v2');
    await repo.write('###corrupt###');
    expect(await repo.recover((raw) => raw === 'v2')).toBe('v2');
    expect(await repo.readPrimary()).toBe('v2');
  });
  it('recover on a genuinely fresh store is a no-op (no phantom resurrection)', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    expect(await repo.recover(() => true)).toBeUndefined();
  });
  it('a transient read never rolls a newer primary back to an older backup', async () => {
    let reads = 0, recoveries = 0;
    const repository = {
      async readPrimary() {
        reads++;
        if (reads === 1) throw new Error('injected first-open failure');
        return 'newer-valid-primary';
      },
      async recover() { recoveries++; return 'older-valid-backup'; },
    };
    const classify = (raw: string) => raw.includes('valid') ? 'supported' as const : 'invalid' as const;
    expect(await readSaveWithRecovery(repository, classify)).toEqual({ kind: 'transient-read' });
    expect(recoveries).toBe(0);
    expect(await readSaveWithRecovery(repository, classify)).toEqual({
      kind: 'loaded', raw: 'newer-valid-primary', recovered: false,
    });
    expect(recoveries, 'retry replaced a valid newer primary with the stale backup').toBe(0);
  });
  it('only a successful retry proving the store is empty authorizes a fresh save', async () => {
    let reads = 0, recoveries = 0;
    const repository = {
      async readPrimary() {
        reads++;
        if (reads === 1) throw new Error('injected first-open failure');
        return undefined;
      },
      async recover() { recoveries++; return 'must-not-run'; },
    };
    const classify = () => 'supported' as const;
    expect(await readSaveWithRecovery(repository, classify)).toEqual({ kind: 'transient-read' });
    expect(await readSaveWithRecovery(repository, classify)).toEqual({ kind: 'fresh' });
    expect(recoveries).toBe(0);
  });
  it('classifies a backup before replacement and preserves the invalid primary when no backup proves safe', async () => {
    for (const unsafeBackup of ['invalid:truncated-backup', 'future:v99-backup']) {
      const repo = createSaveRepository(createMemoryBackend());
      await repo.write('invalid:original-primary');
      await repo.promoteLastKnownGood(unsafeBackup);

      expect(await readSaveWithRecovery(repo, classifyFixturePayload), unsafeBackup).toEqual({
        kind: 'protected', raw: 'invalid:original-primary', reason: 'invalid',
      });
      expect(await repo.readPrimary(), `${unsafeBackup} replaced the protected primary before classification`)
        .toBe('invalid:original-primary');
    }
  });
  it('orchestrated recovery replaces an invalid primary only with a supported backup', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    await repo.write('invalid:broken-primary');
    await repo.promoteLastKnownGood('supported:last-known-good');

    expect(await readSaveWithRecovery(repo, classifyFixturePayload)).toEqual({
      kind: 'loaded', raw: 'supported:last-known-good', recovered: true,
    });
    expect(await repo.readPrimary()).toBe('supported:last-known-good');
  });
  it('a future-version primary never invokes recovery or yields to an older backup', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    await repo.write('future:v99-primary');
    await repo.promoteLastKnownGood('supported:older-backup');

    expect(await readSaveWithRecovery(repo, classifyFixturePayload)).toEqual({
      kind: 'protected', raw: 'future:v99-primary', reason: 'future-version',
    });
    expect(await repo.readPrimary()).toBe('future:v99-primary');
  });
  it('★ THE RESET LAW: primary AND backup die together — a reset must not resurrect via the backup', async () => {
    /* ⚠ REWRITTEN after its own negative control PASSED while the defect was
       live (2026-07-31): asserting recover()===undefined right after reset is
       VACUOUS — recover() short-circuits on the missing primary and never
       looks at the backup, so a surviving backup was invisible to it. The
       REAL resurrection scenario is: reset → NEW expedition writes → that
       write corrupts → recovery must NOT dig up the pre-reset save. Assert
       through that path — the scenario CF-RR-002's reset law exists for. */
    const repo = createSaveRepository(createMemoryBackend());
    await repo.write('real progress');
    await repo.promoteLastKnownGood('real progress');
    await repo.reset();
    expect(await repo.readPrimary()).toBeUndefined();
    await repo.write('###corrupt new expedition###');
    expect(await repo.recover(() => true), 'a pre-reset save resurrected through recovery').toBeUndefined();
    expect(await repo.readPrimary()).toBe('###corrupt new expedition###');
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
  it('the §19.3 store set is complete, incl. the disposable asset cache', () => {
    expect([...STORES]).toEqual(['meta', 'player', 'creatures', 'catalog', 'inventory', 'settings', 'journal', 'assetcache']);
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
        return tx;
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
        return req;
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
        return tx;
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
        return req;
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
