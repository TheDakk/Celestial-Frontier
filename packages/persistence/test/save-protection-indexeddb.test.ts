import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  createEmptyOwnershipStateV1,
  migrateOwnershipStateV1ToV2,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
} from '@cf/domain-acquisition';
import {
  ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
  F3_REVISION_KEY,
  V4_PRIMARY_KEY,
  V5_SCHEMA_KEY,
  applyV5ExtensionWrites,
  classifyV4Save,
  createIndexedDBBackend,
  createRevisionedRepository,
  encodeArc4Ownership,
  initializeFreshV5,
  migrateStoredV4ToV5,
  prepareArc5OwnershipMigration,
  prepareV5SaveWrite,
  readArc5OwnershipMigration,
  readRevisionedSaveV5WithRecovery,
  type ContentRegistry,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';

/* A save from a future version, or a corrupt one, is never overwritten: every package entry the
   game's boot and save path use refuses it, and the bytes in the database are unchanged. These
   tests run the real IndexedDB backend under its default database name, `cf-v2-pixel`, against a
   small in-memory IndexedDB below (no fake-indexeddb package; SOURCE's tests use hand-written
   fakes too). The fake keeps committed rows per database name, so a test reads the stored bytes
   straight from it rather than through the code under test. */

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', 'fixtures', 'v1');
const FIXTURES = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>;
};
const REGISTRY = JSON.parse(fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_060_000;
const VETERAN_RAW = JSON.stringify(FIXTURES.inputs.veteran_rich);
const DATABASE = 'cf-v2-pixel';

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

function fakeIndexedDB() {
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

async function withFakeIndexedDB<T>(run: (fake: ReturnType<typeof fakeIndexedDB>) => Promise<T>): Promise<T> {
  const fake = fakeIndexedDB();
  const prior = globalThis.indexedDB;
  globalThis.indexedDB = fake.factory as unknown as IDBFactory;
  try {
    return await run(fake);
  } finally {
    globalThis.indexedDB = prior;
  }
}

function writable() {
  const classified = classifyV4Save(VETERAN_RAW, REGISTRY, NOW);
  if (classified.kind !== 'supported') throw new Error(`veteran fixture was ${classified.kind}`);
  return { state: classified.state, extensions: {} };
}

/** A complete, current v5 save in the default database, then one row replaced by `damage`. */
async function storedSave(backend: StorageBackend, damage: { store: 'meta' | 'player'; key: string; value: string } | null) {
  expect(await initializeFreshV5(backend, writable(), REGISTRY, NOW)).toMatchObject({ kind: 'initialized', revision: 1 });
  if (damage !== null) await backend.apply([damage]);
}

const FUTURE_SCHEMA = JSON.stringify({ schema: 6, codec: 'a-later-codec', sourceSchema: 4, segments: [] });
const FUTURE_SEGMENT = JSON.stringify({ schema: 6, segment: 'player', data: { me: 'later' } });
const CASES = [
  { name: 'a schema row from a future version', damage: { store: 'meta', key: V5_SCHEMA_KEY, value: FUTURE_SCHEMA }, reason: 'future-version', scope: 'schema' },
  { name: 'a player row from a future version', damage: { store: 'player', key: 'v5:player', value: FUTURE_SEGMENT }, reason: 'future-version', scope: 'player' },
  { name: 'a corrupt schema row', damage: { store: 'meta', key: V5_SCHEMA_KEY, value: '{"schema":5,"codec":' }, reason: 'corrupt', scope: 'schema' },
  { name: 'a corrupt player row', damage: { store: 'player', key: 'v5:player', value: '{"schema":5,"segment":"player","data":[]}' }, reason: 'corrupt', scope: 'player' },
] as const;

describe('@cf/persistence — saves live in the v2 database cf-v2-pixel', () => {
  it('opens cf-v2-pixel at version 2 by default, and no other database', async () => {
    await withFakeIndexedDB(async (fake) => {
      const backend = createIndexedDBBackend();
      expect(await backend.get('meta', V4_PRIMARY_KEY)).toBeUndefined();
      expect(fake.opened).toEqual([{ name: DATABASE, version: 2 }]);
      expect([...fake.databases.keys()]).toEqual([DATABASE]);
    });
  });

  it('a fresh save written and read back through the fake reaches the fake database (the instrument works)', async () => {
    await withFakeIndexedDB(async (fake) => {
      const backend = createIndexedDBBackend();
      await storedSave(backend, null);
      expect(fake.bytes(DATABASE).meta?.[F3_REVISION_KEY]).toBe('1');
      expect(fake.bytes(DATABASE).meta?.[V5_SCHEMA_KEY]).toContain('"schema":5');
      const loaded = await readRevisionedSaveV5WithRecovery(backend, REGISTRY, NOW);
      expect(loaded.kind).toBe('loaded');
      // An ordinary save write at the loaded revision commits, so the refusals below are not the fake refusing everything.
      const prepared = prepareV5SaveWrite(writable(), REGISTRY, NOW + 1);
      const written = await createRevisionedRepository(backend).mutate({ expectedRevision: 1, writes: prepared.operations });
      expect(written.kind).toBe('committed');
      expect(fake.bytes(DATABASE).meta?.[F3_REVISION_KEY]).toBe('2');
    });
  });
});

describe('@cf/persistence — a future-version or corrupt save in cf-v2-pixel is refused and never overwritten', () => {
  for (const { name, damage, reason, scope } of CASES) {
    it(`${name}: boot read, migration and fresh start all refuse; the stored bytes are unchanged`, async () => {
      await withFakeIndexedDB(async (fake) => {
        await storedSave(createIndexedDBBackend(), damage);
        const before = fake.bytes(DATABASE);
        expect(before[damage.store]?.[damage.key]).toBe(damage.value);

        // A new connection, as a later boot would open.
        const backend = createIndexedDBBackend();
        expect(await readRevisionedSaveV5WithRecovery(backend, REGISTRY, NOW)).toEqual({ kind: reason, scope });
        expect(await migrateStoredV4ToV5(backend, REGISTRY, NOW)).toEqual({ kind: 'protected', reason });
        expect(await initializeFreshV5(backend, writable(), REGISTRY, NOW)).toEqual({ kind: 'not-fresh' });

        expect(fake.bytes(DATABASE)).toEqual(before);
        expect(fake.opened.every((open) => open.name === DATABASE)).toBe(true);
      });
    });
  }

  it('a corrupt revision row refuses the boot read and every save write; the stored bytes are unchanged', async () => {
    await withFakeIndexedDB(async (fake) => {
      await storedSave(createIndexedDBBackend(), { store: 'meta', key: F3_REVISION_KEY, value: 'one' });
      const before = fake.bytes(DATABASE);

      const backend = createIndexedDBBackend();
      expect(await readRevisionedSaveV5WithRecovery(backend, REGISTRY, NOW)).toEqual({
        kind: 'storage-error', message: 'stored F3 revision is corrupt',
      });
      const prepared = prepareV5SaveWrite(writable(), REGISTRY, NOW + 1);
      for (const expectedRevision of [0, 1, 2]) {
        await expect(createRevisionedRepository(backend).mutate({ expectedRevision, writes: prepared.operations }))
          .rejects.toThrow('stored F3 revision is corrupt');
      }
      expect(await initializeFreshV5(backend, writable(), REGISTRY, NOW)).toEqual({
        kind: 'storage-error', message: 'stored F3 revision is corrupt',
      });

      expect(fake.bytes(DATABASE)).toEqual(before);
    });
  });
});

/** Arc 4 ownership plus the version-1 Arc 5 certificate the old game wrote, aligned with it. */
function arc5VersionOneCertificate(): V5Extensions {
  const source = createEmptyOwnershipStateV1();
  const target = migrateOwnershipStateV1ToV2(source);
  const arc4 = applyV5ExtensionWrites({}, encodeArc4Ownership(source).writes).extensions;
  return applyV5ExtensionWrites(arc4, [{
    segment: 'player',
    namespace: ARC5_OWNERSHIP_MIGRATION_NAMESPACE,
    carrier: {
      version: 1,
      json: canonicalJson({
        schema: 'cf-v2-ownership-v1-to-v2/v1',
        version: 1,
        sourceSchema: source.schema,
        sourceVersion: source.version,
        sourceRevision: source.revision,
        sourceMode: source.mode,
        sourceDigest: ownershipStateDigestV1(source),
        targetSchema: target.schema,
        targetVersion: target.version,
        targetRevision: target.revision,
        targetMode: target.mode,
        targetDigest: ownershipStateDigestV2(target),
      }),
    },
  }]).extensions;
}

describe('@cf/persistence — a save shape only the old game wrote is refused in cf-v2-pixel and never overwritten', () => {
  it('an Arc 5 version-1 ownership certificate is refused as corrupt, no write is prepared, and the stored bytes are unchanged', async () => {
    await withFakeIndexedDB(async (fake) => {
      expect(await initializeFreshV5(
        createIndexedDBBackend(),
        { state: writable().state, extensions: arc5VersionOneCertificate() },
        REGISTRY,
        NOW,
      )).toMatchObject({ kind: 'initialized', revision: 1 });
      const before = fake.bytes(DATABASE);

      const backend = createIndexedDBBackend();
      const loaded = await readRevisionedSaveV5WithRecovery(backend, REGISTRY, NOW);
      if (loaded.kind !== 'loaded') throw new Error(`expected the save itself to load, received ${loaded.kind}`);
      expect(readArc5OwnershipMigration(loaded.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER)).toEqual({ kind: 'corrupt' });
      expect(prepareArc5OwnershipMigration({
        extensions: loaded.extensions,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      })).toEqual({ kind: 'protected', reason: 'target-corrupt' });

      expect(fake.bytes(DATABASE)).toEqual(before);
    });
  });
});
