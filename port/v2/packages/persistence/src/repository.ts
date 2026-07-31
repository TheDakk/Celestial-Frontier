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
  /** CF-RR-002 recovery: primary corrupt ⇒ restore backup ONCE. Returns the
      recovered payload, or undefined when there is nothing to recover. */
  recover(): Promise<string | undefined>;
  /** The reset law: primary AND backup die together — a reset must not
      resurrect via the backup. Disposable caches go too. */
  reset(): Promise<void>;
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
    async recover(): Promise<string | undefined> {
      const primary = await backend.get('meta', PRIMARY);
      if (primary === undefined) return undefined;        /* genuinely fresh — nothing to recover */
      const bak = await backend.get('meta', BACKUP);
      if (bak === undefined) return undefined;
      await backend.apply([{ store: 'meta', key: PRIMARY, value: bak }]);
      return bak;
    },
    async reset(): Promise<void> {
      await backend.apply([
        { store: 'meta', key: PRIMARY },
        { store: 'meta', key: BACKUP },
      ]);
      await backend.clear(['assetcache', 'journal']);
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
    if (!dbp) dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, version);
      req.onupgradeneeded = () => { const db = req.result; for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error as Error);
    });
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
