/* Storage repository — Phase 2 deliverable 2 ("IndexedDB repository and
   transaction recovery"). The seam is StorageBackend: the repository logic
   (generations, recovery, reset law) is backend-agnostic and fully tested
   against the in-memory backend; IndexedDBBackend implements the same
   contract for the browser and gets its end-to-end proof in Phase 3's
   vertical slice (a jsdom/node test proving IDB semantics would prove the
   shim, not the browser — the codefixtures lesson). */

export const STORES = [
  'meta',          /* save metadata + schema version */
  'player',        /* player/progression state */
  'creatures',     /* creature/genome records */
  'catalog',       /* catalog/Atlas/log records */
  'inventory',     /* inventory/equipment/materials */
  'settings',      /* settings/accessibility/audio */
  'journal',       /* migration journal + recovery snapshots */
  'receipts',      /* immutable exact-once mutation witnesses */
  'assetcache',    /* OPTIONAL, explicitly disposable */
] as const;
export type StoreName = typeof STORES[number];

/** An exact raw-value precondition for one atomic storage transaction. */
export interface StorageCheck {
  readonly store: StoreName;
  readonly key: string;
  /** `undefined` means the key must be absent. */
  readonly value: string | undefined;
}

export interface StorageOperation {
  readonly store: StoreName;
  readonly key: string;
  /** `undefined` deletes the key. */
  readonly value?: string;
}

export interface StorageBackend {
  get(store: StoreName, key: string): Promise<string | undefined>;
  /** Atomically apply every write/delete or none — the transaction contract. */
  apply(ops: readonly StorageOperation[]): Promise<void>;
  /** Atomically check exact raw values then apply every operation. `false`
      means a competing writer changed one checked key; it is not an I/O
      failure and callers must surface a stale/duplicate outcome. */
  compareAndApply(
    checks: readonly StorageCheck[],
    ops: readonly StorageOperation[],
    /** Stores cleared inside the same successful transaction, before `ops`.
        This is reserved for whole-authority replacement; ordinary mutations
        should leave historical rows intact. */
    clearStores?: readonly StoreName[],
  ): Promise<boolean>;
  keys(store: StoreName): Promise<string[]>;
  clear(stores: readonly StoreName[]): Promise<void>;
}

const PRIMARY = 'save';
export const V4_BACKUP_KEY = 'save_bak';    /* last-known-good — the SAVE_KEY_bak pattern */
/* This legacy v4 repository must never mutate backup/primary state after any
   v5 authority exists. Keep these storage-schema pins local rather than making
   this base repository import its dependent revision/lease authority layers;
   revisioned.ts also consumes STORES here and would form an init cycle. */
const F3_REVISION_KEY = 'f3:revision';
const F3_ACTIVE_PLAY_LEASE_KEY = 'f3:lease:active-play';

export interface SaveRepository {
  /** Write the authoritative save payload (one atomic transaction). */
  write(payload: string): Promise<void>;
  /** Read the primary payload; undefined = genuinely fresh. */
  readPrimary(): Promise<string | undefined>;
  /** Call ONLY after a payload has proven it loads. Returns true only when
      those bytes are still the legacy primary and no v5 authority exists. */
  promoteLastKnownGood(payload: string): Promise<boolean>;
  /** CF-RR-002 recovery: read and classify the backup, then restore it ONCE
      only when the supplied predicate proves those exact bytes supported.
      Returns the recovered payload, or undefined when no safe legacy recovery
      exists or a competing/v5 authority wins. */
  recover(isSupported: (payload: string) => boolean): Promise<string | undefined>;
  /** The reset law: primary AND backup die together — a reset must not
      resurrect via the backup. Disposable caches go too. */
  reset(): Promise<void>;
}

export type StoredPayloadStatus = 'supported' | 'future-version' | 'invalid';
export type SaveReadOutcome =
  | { kind: 'fresh' }
  | { kind: 'loaded'; raw: string; recovered: boolean }
  | { kind: 'protected'; raw: string; reason: 'future-version' | 'invalid' }
  | { kind: 'transient-read' };

/** Read/classify/recover orchestration shared by boot and a later storage
 * retry. A thrown primary read is UNKNOWN, never evidence of corruption: it
 * must not invoke recover(), which would re-read a valid newer primary and
 * replace it with a stale backup. */
export async function readSaveWithRecovery(
  repository: Pick<SaveRepository, 'readPrimary' | 'recover'>,
  classify: (raw: string) => StoredPayloadStatus,
): Promise<SaveReadOutcome> {
  let raw: string | undefined;
  try { raw = await repository.readPrimary(); }
  catch { return { kind: 'transient-read' }; }
  if (raw === undefined) return { kind: 'fresh' };
  const status = classify(raw);
  if (status === 'supported') return { kind: 'loaded', raw, recovered: false };
  if (status === 'future-version') return { kind: 'protected', raw, reason: status };
  try {
    const recovered = await repository.recover((candidate) => classify(candidate) === 'supported');
    if (recovered !== undefined) {
      return { kind: 'loaded', raw: recovered, recovered: true };
    }
  } catch { /* the known-invalid primary remains protected */ }
  return { kind: 'protected', raw, reason: 'invalid' };
}

export function createSaveRepository(backend: StorageBackend): SaveRepository {
  return {
    async write(payload: string): Promise<void> {
      await backend.apply([{ store: 'meta', key: PRIMARY, value: payload }]);
    },
    async readPrimary(): Promise<string | undefined> {
      return backend.get('meta', PRIMARY);
    },
    async promoteLastKnownGood(payload: string): Promise<boolean> {
      /* Promotion belongs only to the legacy v4 authority. Bind the exact
         primary bytes that proved loadable and require the revisioned v5
         authority to be absent in the SAME transaction. A delayed legacy tab
         therefore cannot reinsert a predecessor after v5 replacement. */
      return backend.compareAndApply([
        { store: 'meta', key: PRIMARY, value: payload },
        { store: 'meta', key: F3_REVISION_KEY, value: undefined },
        { store: 'meta', key: F3_ACTIVE_PLAY_LEASE_KEY, value: undefined },
      ], [{ store: 'meta', key: V4_BACKUP_KEY, value: payload }]);
    },
    async recover(isSupported): Promise<string | undefined> {
      const primary = await backend.get('meta', PRIMARY);
      if (primary === undefined) return undefined;        /* genuinely fresh — nothing to recover */
      const bak = await backend.get('meta', V4_BACKUP_KEY);
      if (bak === undefined) return undefined;
      /* The backup is untrusted storage input too. Classify the exact bytes
         before any write: corrupt/future backup data must never destroy the
         invalid primary whose evidence the caller is protecting. */
      if (!isSupported(bak)) return undefined;
      /* Bind every byte observed above and exclude the revisioned v5 authority
         atomically. A newer primary, changed backup, or completed v5
         replacement makes recovery lose cleanly instead of rolling it back. */
      const recovered = await backend.compareAndApply([
        { store: 'meta', key: PRIMARY, value: primary },
        { store: 'meta', key: V4_BACKUP_KEY, value: bak },
        { store: 'meta', key: F3_REVISION_KEY, value: undefined },
        { store: 'meta', key: F3_ACTIVE_PLAY_LEASE_KEY, value: undefined },
      ], [{ store: 'meta', key: PRIMARY, value: bak }]);
      return recovered ? bak : undefined;
    },
    async reset(): Promise<void> {
      /* One canonical list owns both schema creation and wipe coverage. A
         future authoritative store therefore joins reset automatically. */
      await backend.clear(STORES);
    },
  };
}

/* ---------- in-memory backend (tests + SSR-safe fallback) ---------- */
export function createMemoryBackend(): StorageBackend {
  const data = new Map<string, Map<string, string>>();
  const table = (s: StoreName) => { let t = data.get(s); if (!t) { t = new Map(); data.set(s, t); } return t; };
  return {
    async get(store, key) { return table(store).get(key); },
    async apply(ops) {
      /* all-or-nothing: stage on copies, then swap */
      const touched = new Map<StoreName, Map<string, string>>();
      for (const op of ops) {
        let t = touched.get(op.store);
        if (!t) { t = new Map(table(op.store)); touched.set(op.store, t); }
        if (op.value === undefined) t.delete(op.key); else t.set(op.key, op.value);
      }
      for (const [s, t] of touched) data.set(s, t);
    },
    async compareAndApply(checks, ops, clearStores = []) {
      for (const check of checks) {
        if (table(check.store).get(check.key) !== check.value) return false;
      }
      /* Keep the check and write in this same synchronous turn. The memory
         backend deliberately models one serializable transaction, so tests
         can reproduce two-tab stale writers instead of hiding them behind
         last-writer-wins awaits. */
      const touched = new Map<StoreName, Map<string, string>>();
      for (const store of clearStores) touched.set(store, new Map());
      for (const op of ops) {
        let t = touched.get(op.store);
        if (!t) { t = new Map(table(op.store)); touched.set(op.store, t); }
        if (op.value === undefined) t.delete(op.key); else t.set(op.key, op.value);
      }
      for (const [s, t] of touched) data.set(s, t);
      return true;
    },
    async keys(store) { return [...table(store).keys()]; },
    async clear(stores) { for (const s of stores) data.delete(s); },
  };
}

/* ---------- IndexedDB backend (browser; proven end-to-end in Phase 3) ---------- */
export function createIndexedDBBackend(dbName = 'cf-v2', version = 2): StorageBackend {
  let dbp: Promise<IDBDatabase> | null = null;
  const open = (): Promise<IDBDatabase> => {
    if (!dbp) {
      const pending = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(dbName, version);
      let abandoned = false;
      req.onupgradeneeded = () => { const db = req.result; for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s); };
      req.onsuccess = () => {
        const db = req.result;
        /* `blocked` is not terminal for the native request: after the old
           tab closes, this same request may still succeed. If our bounded
           attempt already rejected and a retry owns `dbp`, close that late
           orphan immediately or it can accumulate and block upgrades/reset. */
        if (abandoned) { db.close(); return; }
        db.onclose = () => { if (dbp === pending) dbp = null; };
        db.onversionchange = () => { db.close(); if (dbp === pending) dbp = null; };
        resolve(db);
      };
      req.onerror = () => { abandoned = true; reject(req.error as Error); };
      req.onblocked = () => { abandoned = true; reject(new Error(`IndexedDB open blocked: ${dbName}`)); };
      });
      dbp = pending;
      /* A rejected open is a transient attempt, not a permanent repository
         state. Retaining that rejected Promise makes every later player
         retry fail without issuing a new indexedDB.open(). */
      void pending.catch(() => { if (dbp === pending) dbp = null; });
    }
    return dbp;
  };
  const done = (tx: IDBTransaction): Promise<void> => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error as Error);
    tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'));
  });
  return {
    async get(store, key) {
      const db = await open();
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      await done(tx);
      return req.result === undefined ? undefined : String(req.result);
    },
    async apply(ops) {
      if (!ops.length) return;
      const db = await open();
      const stores = [...new Set(ops.map((o) => o.store))];
      const tx = db.transaction(stores, 'readwrite');   /* one IDB tx = the atomicity contract */
      for (const op of ops) {
        const os = tx.objectStore(op.store);
        if (op.value === undefined) os.delete(op.key); else os.put(op.value, op.key);
      }
      await done(tx);
    },
    async compareAndApply(checks, ops, clearStores = []) {
      if (!checks.length && !clearStores.length) { await this.apply(ops); return true; }
      const db = await open();
      const stores = [...new Set([
        ...checks.map((entry) => entry.store),
        ...ops.map((entry) => entry.store),
        ...clearStores,
      ])];
      return new Promise<boolean>((resolve, reject) => {
        const tx = db.transaction(stores, 'readwrite');
        let remaining = checks.length;
        let stale = false;
        let completed = false;
        const finish = (value: boolean): void => {
          if (completed) return;
          completed = true;
          resolve(value);
        };
        const rejectFailure = (): void => {
          if (completed) return;
          completed = true;
          reject(tx.error ?? new Error('transaction aborted'));
        };
        tx.oncomplete = () => finish(!stale);
        tx.onerror = () => stale ? finish(false) : rejectFailure();
        tx.onabort = () => stale ? finish(false) : rejectFailure();
        const write = (): void => {
          for (const store of clearStores) tx.objectStore(store).clear();
          for (const op of ops) {
            const os = tx.objectStore(op.store);
            if (op.value === undefined) os.delete(op.key); else os.put(op.value, op.key);
          }
        };
        if (checks.length === 0) {
          write();
          return;
        }
        for (const check of checks) {
          const req = tx.objectStore(check.store).get(check.key);
          req.onerror = () => { try { tx.abort(); } catch { /* tx will report the request failure */ } };
          req.onsuccess = () => {
            const actual = req.result === undefined ? undefined : String(req.result);
            if (actual !== check.value) {
              stale = true;
              try { tx.abort(); } catch { finish(false); }
              return;
            }
            remaining--;
            if (remaining === 0) write();
          };
        }
      });
    },
    async keys(store) {
      const db = await open();
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAllKeys();
      await done(tx);
      return (req.result || []).map(String);
    },
    async clear(stores) {
      if (!stores.length) return;
      const db = await open();
      const tx = db.transaction(stores as StoreName[], 'readwrite');
      for (const s of stores) tx.objectStore(s).clear();
      await done(tx);
    },
  };
}
