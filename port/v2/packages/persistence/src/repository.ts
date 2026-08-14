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
  'assetcache',    /* OPTIONAL, explicitly disposable */
] as const;
export type StoreName = typeof STORES[number];

export interface StorageBackend {
  get(store: StoreName, key: string): Promise<string | undefined>;
  /** Atomically apply every write/delete or none — the transaction contract. */
  apply(ops: Array<{ store: StoreName; key: string; value?: string }>): Promise<void>;
  keys(store: StoreName): Promise<string[]>;
  clear(stores: readonly StoreName[]): Promise<void>;
}

const PRIMARY = 'save';
const BACKUP = 'save_bak';    /* last-known-good — the SAVE_KEY_bak pattern */

export interface SaveRepository {
  /** Write the authoritative save payload (one atomic transaction). */
  write(payload: string): Promise<void>;
  /** Read the primary payload; undefined = genuinely fresh. */
  readPrimary(): Promise<string | undefined>;
  /** Call ONLY after a payload has proven it loads — promotes it to backup. */
  promoteLastKnownGood(payload: string): Promise<void>;
  /** CF-RR-002 recovery: read and classify the backup, then restore it ONCE
      only when the supplied predicate proves those exact bytes supported.
      Returns the recovered payload, or undefined when no safe recovery exists. */
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
    async promoteLastKnownGood(payload: string): Promise<void> {
      await backend.apply([{ store: 'meta', key: BACKUP, value: payload }]);
    },
    async recover(isSupported): Promise<string | undefined> {
      const primary = await backend.get('meta', PRIMARY);
      if (primary === undefined) return undefined;        /* genuinely fresh — nothing to recover */
      const bak = await backend.get('meta', BACKUP);
      if (bak === undefined) return undefined;
      /* The backup is untrusted storage input too. Classify the exact bytes
         before any write: corrupt/future backup data must never destroy the
         invalid primary whose evidence the caller is protecting. */
      if (!isSupported(bak)) return undefined;
      await backend.apply([{ store: 'meta', key: PRIMARY, value: bak }]);
      return bak;
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
    async keys(store) { return [...table(store).keys()]; },
    async clear(stores) { for (const s of stores) data.delete(s); },
  };
}

/* ---------- IndexedDB backend (browser; proven end-to-end in Phase 3) ---------- */
export function createIndexedDBBackend(dbName = 'cf-v2', version = 1): StorageBackend {
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
