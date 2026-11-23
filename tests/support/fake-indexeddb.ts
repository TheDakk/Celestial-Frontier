/* A small in-memory IndexedDB for tests that run the real IndexedDB backend (no fake-indexeddb package).
   It keeps committed rows per database name and records every name opened, so a test reads the stored
   bytes and the databases touched straight from it rather than through the code under test. */

type Rows = Map<string, Map<string, string>>;
type Listener = (event: { target: unknown; type: string }) => void;

class FakeTarget {
  private readonly listeners = new Map<string, Set<Listener>>();
  addEventListener(type: string, listener: Listener): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }
  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }
  emit(type: string, target: unknown = this): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener({ target, type });
  }
}

class FakeRequest extends FakeTarget {
  result: unknown = undefined;
  error: Error | null = null;
  constructor(readonly transaction: FakeTransaction | null) { super(); }
}

/** One transaction: reads see its own earlier writes; rows reach the database only on complete. */
class FakeTransaction extends FakeTarget {
  error: Error | null = null;
  private readonly working: Rows;
  private pending = 0;
  private finished = false;
  constructor(readonly db: FakeDatabase, private readonly mode: string) {
    super();
    this.working = new Map([...db.rows].map(([store, rows]) => [store, new Map(rows)]));
    this.settleLater();
  }
  objectStore(store: string) {
    const rows = this.working.get(store);
    if (rows === undefined) throw new Error(`no object store ${store}`);
    const write = (change: () => void): void => {
      if (this.mode !== 'readwrite') throw new Error('read-only transaction');
      if (this.finished) throw new Error('transaction is not active');
      change();
    };
    return {
      get: (key: string) => this.request(() => rows.get(key)),
      getAllKeys: () => this.request(() => [...rows.keys()].sort()),
      put: (value: string, key: string) => write(() => { rows.set(key, String(value)); }),
      delete: (key: string) => write(() => { rows.delete(key); }),
      clear: () => write(() => { rows.clear(); }),
    };
  }
  abort(): void {
    if (this.finished) throw new Error('transaction already finished');
    this.finished = true;
    this.error = new Error('transaction aborted');
    queueMicrotask(() => this.db.emit('abort', this));
  }
  private request(read: () => unknown): FakeRequest {
    const request = new FakeRequest(this);
    this.pending++;
    queueMicrotask(() => {
      this.pending--;
      if (this.finished) return;
      request.result = read();
      this.db.emit('success', request);
      this.settleLater();
    });
    return request;
  }
  private settleLater(): void {
    queueMicrotask(() => queueMicrotask(() => {
      if (this.finished || this.pending > 0) return;
      this.finished = true;
      if (this.mode === 'readwrite') {
        for (const [store, rows] of this.working) this.db.rows.set(store, rows);
      }
      this.db.emit('complete', this);
    }));
  }
}

class FakeDatabase extends FakeTarget {
  onclose: (() => void) | null = null;
  onversionchange: (() => void) | null = null;
  readonly objectStoreNames = { contains: (store: string) => this.rows.has(store) };
  constructor(readonly rows: Rows) { super(); }
  createObjectStore(store: string): void { this.rows.set(store, new Map()); }
  transaction(stores: string | string[], mode = 'readonly'): FakeTransaction {
    for (const store of [stores].flat()) if (!this.rows.has(store)) throw new Error(`no object store ${store}`);
    return new FakeTransaction(this, mode);
  }
  close(): void {}
}

export function fakeIndexedDB() {
  const databases = new Map<string, Rows>();
  const opened: Array<{ name: string; version: number }> = [];
  const factory = {
    open(name: string, version: number): FakeRequest {
      opened.push({ name, version });
      const request = new FakeRequest(null);
      queueMicrotask(() => {
        const existing = databases.get(name);
        const rows: Rows = existing ?? new Map();
        databases.set(name, rows);
        request.result = new FakeDatabase(rows);
        if (existing === undefined) request.emit('upgradeneeded');
        request.emit('success');
      });
      return request;
    },
  };
  /** The committed bytes of one database, read from the fake itself. */
  const bytes = (name: string): Record<string, Record<string, string>> => Object.fromEntries(
    [...(databases.get(name) ?? new Map())].map(([store, rows]) => [store, Object.fromEntries(rows)]),
  );
  return { factory, databases, opened, bytes };
}

export async function withFakeIndexedDB<T>(run: (fake: ReturnType<typeof fakeIndexedDB>) => Promise<T>): Promise<T> {
  const fake = fakeIndexedDB();
  const scope = globalThis as { indexedDB?: unknown };
  const prior = scope.indexedDB;
  scope.indexedDB = fake.factory;
  try {
    return await run(fake);
  } finally {
    scope.indexedDB = prior;
  }
}
