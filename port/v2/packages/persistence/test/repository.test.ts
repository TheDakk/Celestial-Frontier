import { describe, it, expect } from 'vitest';
import {
  createSaveRepository, createMemoryBackend, createIndexedDBBackend, createRevisionedRepository,
  readSaveWithRecovery, F3_ACTIVE_PLAY_LEASE_KEY, F3_REVISION_KEY, STORES, V4_BACKUP_KEY,
  type StorageBackend, type StorageOperation, type StoredPayloadStatus,
} from '@cf/persistence';

const classifyFixturePayload = (raw: string): StoredPayloadStatus => {
  if (raw.startsWith('supported:')) return 'supported';
  if (raw.startsWith('future:')) return 'future-version';
  return 'invalid';
};

function blockOneMatchingCompareAndApply(
  target: StorageBackend,
  matches: (ops: readonly StorageOperation[]) => boolean,
): { backend: StorageBackend; entered: Promise<void>; release: () => void } {
  let markEntered!: () => void;
  let release!: () => void;
  const entered = new Promise<void>((resolve) => { markEntered = resolve; });
  const held = new Promise<void>((resolve) => { release = resolve; });
  let armed = true;
  return {
    backend: {
      ...target,
      async compareAndApply(checks, ops, clearStores) {
        if (armed && matches(ops)) {
          armed = false;
          markEntered();
          await held;
        }
        return target.compareAndApply(checks, ops, clearStores);
      },
    },
    entered,
    release,
  };
}

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
    expect(await repo.promoteLastKnownGood('v2'), 'non-primary bytes were promoted').toBe(false);
    expect(await be.get('meta', V4_BACKUP_KEY)).toBeUndefined();
    /* corrupt the primary before any promotion — nothing to recover */
    await repo.write('###corrupt###');
    expect(await repo.recover((raw) => raw === 'v2')).toBeUndefined();
    /* now a payload proves it loads and is promoted; corruption recovers */
    await repo.write('v2');
    expect(await repo.promoteLastKnownGood('v2')).toBe(true);
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
      const backend = createMemoryBackend();
      const repo = createSaveRepository(backend);
      await repo.write('invalid:original-primary');
      /* Hostile storage is the input under test; the safe promotion API must
         not be abused to manufacture bytes that never proved loadable. */
      await backend.apply([{ store: 'meta', key: V4_BACKUP_KEY, value: unsafeBackup }]);
      expect(await backend.get('meta', V4_BACKUP_KEY)).toBe(unsafeBackup);

      expect(await readSaveWithRecovery(repo, classifyFixturePayload), unsafeBackup).toEqual({
        kind: 'protected', raw: 'invalid:original-primary', reason: 'invalid',
      });
      expect(await repo.readPrimary(), `${unsafeBackup} replaced the protected primary before classification`)
        .toBe('invalid:original-primary');
    }
  });
  it('orchestrated recovery replaces an invalid primary only with a supported backup', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    await repo.write('supported:last-known-good');
    expect(await repo.promoteLastKnownGood('supported:last-known-good')).toBe(true);
    await repo.write('invalid:broken-primary');

    expect(await readSaveWithRecovery(repo, classifyFixturePayload)).toEqual({
      kind: 'loaded', raw: 'supported:last-known-good', recovered: true,
    });
    expect(await repo.readPrimary()).toBe('supported:last-known-good');
  });
  it('a future-version primary never invokes recovery or yields to an older backup', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    await repo.write('supported:older-backup');
    expect(await repo.promoteLastKnownGood('supported:older-backup')).toBe(true);
    await repo.write('future:v99-primary');

    expect(await readSaveWithRecovery(repo, classifyFixturePayload)).toEqual({
      kind: 'protected', raw: 'future:v99-primary', reason: 'future-version',
    });
    expect(await repo.readPrimary()).toBe('future:v99-primary');
  });
  it('retires legacy promotion and recovery once revisioned v5 authority exists', async () => {
    for (const authority of [
      { key: F3_REVISION_KEY, value: '1' },
      { key: F3_ACTIVE_PLAY_LEASE_KEY, value: 'minted-lease' },
    ]) {
      const backend = createMemoryBackend();
      const repo = createSaveRepository(backend);
      await repo.write('supported:current');
      expect(await repo.promoteLastKnownGood('supported:current')).toBe(true);
      await repo.write('invalid:current');
      await backend.apply([{ store: 'meta', ...authority }]);

      expect(await repo.recover((raw) => raw.startsWith('supported:')), authority.key).toBeUndefined();
      expect(await repo.readPrimary()).toBe('invalid:current');
      expect(await repo.promoteLastKnownGood('invalid:current'), authority.key).toBe(false);
      expect(await backend.get('meta', V4_BACKUP_KEY)).toBe('supported:current');
    }
  });
  it('two backends cannot reinsert a predecessor backup after v5 replacement wins promotion race', async () => {
    const backend = createMemoryBackend();
    const predecessor = 'supported:predecessor';
    await createSaveRepository(backend).write(predecessor);
    const blocked = blockOneMatchingCompareAndApply(
      backend,
      (ops) => ops.some((op) => op.store === 'meta' && op.key === V4_BACKUP_KEY && op.value === predecessor),
    );
    const delayedPromotion = createSaveRepository(blocked.backend).promoteLastKnownGood(predecessor);
    await blocked.entered;

    const replacement = await createRevisionedRepository(backend).replace({
      expectedRevision: 0,
      writes: [
        { store: 'meta', key: 'save', value: 'supported:successor' },
        { store: 'meta', key: V4_BACKUP_KEY },
      ],
    });
    blocked.release();

    expect(replacement).toEqual({ kind: 'committed', revision: 1, receiptKey: null });
    await expect(delayedPromotion).resolves.toBe(false);
    expect(await backend.get('meta', 'save')).toBe('supported:successor');
    expect(await backend.get('meta', V4_BACKUP_KEY)).toBeUndefined();
    expect(await backend.get('meta', F3_REVISION_KEY)).toBe('1');

    const controlBackend = createMemoryBackend();
    const control = createSaveRepository(controlBackend);
    await control.write(predecessor);
    expect(await control.promoteLastKnownGood(predecessor)).toBe(true);
    expect(await controlBackend.get('meta', V4_BACKUP_KEY)).toBe(predecessor);
  });
  it('a writer that wins while recovery is classified cannot be rolled back', async () => {
    const backend = createMemoryBackend();
    const setup = createSaveRepository(backend);
    await setup.write('supported:last-known-good');
    expect(await setup.promoteLastKnownGood('supported:last-known-good')).toBe(true);
    await setup.write('invalid:observed-primary');
    const blocked = blockOneMatchingCompareAndApply(
      backend,
      (ops) => ops.some((op) => op.store === 'meta' && op.key === 'save' && op.value === 'supported:last-known-good'),
    );
    const delayedRecovery = createSaveRepository(blocked.backend)
      .recover((raw) => raw.startsWith('supported:'));
    await blocked.entered;

    await createSaveRepository(backend).write('supported:newer-primary');
    blocked.release();

    await expect(delayedRecovery).resolves.toBeUndefined();
    expect(await backend.get('meta', 'save')).toBe('supported:newer-primary');

    const controlBackend = createMemoryBackend();
    const control = createSaveRepository(controlBackend);
    await control.write('supported:last-known-good');
    expect(await control.promoteLastKnownGood('supported:last-known-good')).toBe(true);
    await control.write('invalid:observed-primary');
    expect(await control.recover((raw) => raw.startsWith('supported:'))).toBe('supported:last-known-good');
  });
  it('recovery binds the exact classified backup bytes as well as the primary', async () => {
    const backend = createMemoryBackend();
    const setup = createSaveRepository(backend);
    await setup.write('supported:classified-backup');
    expect(await setup.promoteLastKnownGood('supported:classified-backup')).toBe(true);
    await setup.write('invalid:observed-primary');
    const blocked = blockOneMatchingCompareAndApply(
      backend,
      (ops) => ops.some((op) => op.store === 'meta' && op.key === 'save' && op.value === 'supported:classified-backup'),
    );
    const delayedRecovery = createSaveRepository(blocked.backend)
      .recover((raw) => raw.startsWith('supported:'));
    await blocked.entered;

    await backend.apply([{ store: 'meta', key: V4_BACKUP_KEY, value: 'supported:changed-after-classification' }]);
    blocked.release();

    await expect(delayedRecovery).resolves.toBeUndefined();
    expect(await backend.get('meta', 'save')).toBe('invalid:observed-primary');
    expect(await backend.get('meta', V4_BACKUP_KEY)).toBe('supported:changed-after-classification');
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
