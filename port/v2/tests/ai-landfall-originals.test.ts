import { describe, expect, it } from 'vitest';
import {
  aiLandfallInputKeyV1, createAiLandfallOriginalStoreV1, AI_LANDFALL_ORIGINAL_MAX_BYTES_V1,
  type AiLandfallInputV1,
} from '../apps/game/src/ai-landfall-originals.js';

const input: AiLandfallInputV1 = Object.freeze({ recipeKey: 'recipe-1', worldKey: 'world-1',
  environmentId: 'environment-1', ecologyEpoch: 0, snapshotDigest: 'a'.repeat(64), recipeJson: '{"seed":133}' });
const generated = (value = 'original') => ({ blob: new Blob([value], { type: 'image/png' }), width: 2, height: 1 });

// Deterministic transaction adapter, not native IDB qualification. The actual
// browser separately proves persistent Blob cloning and transaction durability.
function idbFixture() {
  const stores = new Map<string, Map<string, unknown>>();
  let initialized = false;
  const writes: { complete(): void; abort(): void; staged: Map<string, Map<string, unknown>> }[] = [];
  const control = { holdWrites: false, abortWrites: false, closed: 0, failOpen: false, opens: 0 };
  let markWriteStaged!: () => void;
  const writeStaged = new Promise<void>(resolve => { markWriteStaged = resolve; });
  const db = {
    createObjectStore(name: string) { stores.set(name, new Map()); },
    close() { control.closed++; },
    onversionchange: null as null | (() => void),
    transaction(_names: string[], mode: string) {
      const staged = new Map([...stores].map(([key, rows]) => [key, new Map(rows)]));
      let pending = 0, finished = false;
      const tx = {
        oncomplete: null as null | (() => void), onabort: null as null | (() => void),
        onerror: null as null | (() => void), error: null as Error | null,
        abort() {
          if (finished) return;
          finished = true; tx.error = new Error('Synthetic transaction abort'); tx.onabort?.();
        },
        complete() {
          if (finished || pending) return;
          if (mode === 'readwrite' && control.abortWrites) { tx.abort(); return; }
          finished = true;
          if (mode === 'readwrite') for (const [name, values] of staged) stores.set(name, values);
          tx.oncomplete?.();
        },
        objectStore(name: string) {
          const request = (action: () => unknown) => {
            const result = { result: undefined as unknown, onsuccess: null as null | (() => void) };
            pending++;
            queueMicrotask(() => {
              if (finished) return;
              result.result = action(); result.onsuccess?.(); pending--;
              queueMicrotask(() => {
                if (mode === 'readwrite' && pending === 0) markWriteStaged();
                if (mode !== 'readwrite' || !control.holdWrites) tx.complete();
              });
            });
            return result;
          };
          return {
            get(key: string) { return request(() => staged.get(name)?.get(key)); },
            add(value: unknown, key: string) {
              return request(() => {
                if (staged.get(name)!.has(key)) throw new Error('Duplicate original');
                staged.get(name)!.set(key, structuredClone(value)); return key;
              });
            },
            put(value: unknown, key: string) {
              return request(() => { staged.get(name)!.set(key, structuredClone(value)); return key; });
            },
          };
        },
      };
      if (mode === 'readwrite') writes.push({ complete: tx.complete, abort: tx.abort, staged });
      return tx;
    },
  };
  const factory = {
    open() {
      control.opens++;
      const request = { result: db, onupgradeneeded: null as null | (() => void),
        onsuccess: null as null | (() => void), onerror: null as null | (() => void), onblocked: null };
      queueMicrotask(() => {
        if (control.failOpen) { request.onerror?.(); return; }
        if (!initialized) { initialized = true; request.onupgradeneeded?.(); }
        request.onsuccess?.();
      });
      return request;
    },
  } as unknown as IDBFactory;
  return { factory, stores, writes, control, writeStaged, db };
}

describe('separate exact landfall originals', () => {
  it('retains exact bytes and full identity across a new store instance', async () => {
    const fixture = idbFixture();
    const first = createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory });
    const original = await first.retain(input, generated());
    expect(original.input).toEqual(input);
    expect(Object.isFrozen(original)).toBe(true);
    expect(await original.blob.text()).toBe('original');
    first.close();
    const reopened = createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory });
    expect((await reopened.find(input))?.originalId).toBe(original.originalId);
    expect(await (await reopened.read(input, original.originalId))!.blob.text()).toBe('original');
    expect(await reopened.find({ ...input, ecologyEpoch: 1 })).toBeNull();
    await expect(reopened.read({ ...input, recipeJson: '{"seed":134}' }, original.originalId)).rejects.toThrow(/verification/);
  });

  it('detaches provider output before the first hashing await', async () => {
    const fixture = idbFixture();
    const store = createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory });
    const mutable = generated();
    const result = store.retain(input, mutable);
    mutable.blob = generated('replaced').blob; mutable.width = 7;
    const original = await result;
    expect(await original.blob.text()).toBe('original'); expect(original.width).toBe(2);
  });

  it('never resolves retention at request success and refuses a later abort', async () => {
    const fixture = idbFixture(); fixture.control.holdWrites = true;
    const store = createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory });
    let ready = false;
    const result = store.retain(input, generated());
    void result.then(() => { ready = true; }, () => {});
    await fixture.writeStaged;
    expect(fixture.writes).toHaveLength(1);
    expect(fixture.writes[0]!.staged.get('originals')!.size).toBe(1);
    expect(fixture.stores.get('originals')!.size).toBe(0);
    expect(ready).toBe(false);
    fixture.writes[0]!.abort();
    await expect(result).rejects.toThrow(/abort/);
    expect(ready).toBe(false);
    expect(await store.find(input)).toBeNull();
  });

  it('resolves only after commit and preserves every original when latest changes', async () => {
    const fixture = idbFixture(); fixture.control.holdWrites = true;
    const store = createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory });
    const result = store.retain(input, generated('first'));
    await fixture.writeStaged; fixture.writes[0]!.complete();
    const first = await result;
    fixture.control.holdWrites = false;
    const second = await store.retain(input, generated('second'));
    expect(second.originalId).not.toBe(first.originalId);
    expect(fixture.stores.get('originals')!.size).toBe(2);
    expect((await store.find(input))?.originalId).toBe(second.originalId);
    expect(await (await store.read(input, first.originalId))!.blob.text()).toBe('first');
    await store.retain(input, generated('second'));
    expect(fixture.stores.get('originals')!.size).toBe(2);
  });

  it('refuses quota-style transaction failure without publishing latest or an original', async () => {
    const fixture = idbFixture(); fixture.control.abortWrites = true;
    const store = createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory });
    await expect(store.retain(input, generated())).rejects.toThrow(/abort/);
    expect(fixture.stores.get('originals')!.size).toBe(0);
    expect(fixture.stores.get('latest')!.size).toBe(0);
  });

  it('rejects corrupted bytes and identities, then accepts the restored exact record', async () => {
    const fixture = idbFixture();
    const store = createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory });
    const original = await store.retain(input, generated());
    const rows = fixture.stores.get('originals')!;
    const exact = rows.get(original.originalId) as object;
    rows.set(original.originalId, { ...exact, blob: generated('corrupt').blob });
    await expect(store.find(input)).rejects.toThrow(/verification/);
    rows.set(original.originalId, { ...exact, input: { ...input, snapshotDigest: 'b'.repeat(64) } });
    await expect(store.read(input, original.originalId)).rejects.toThrow(/verification/);
    rows.set(original.originalId, exact);
    expect((await store.find(input))?.sha256).toBe(original.sha256);
  });

  it('refuses a latest index whose original disappeared', async () => {
    const fixture = idbFixture();
    const store = createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory });
    const original = await store.retain(input, generated());
    fixture.stores.get('originals')!.delete(original.originalId);
    await expect(store.find(input)).rejects.toThrow(/original is missing/);
  });

  it('bounds original bytes, dimensions and namespaces before starting a write', async () => {
    const fixture = idbFixture();
    const store = createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory });
    await expect(store.retain(input, { ...generated(), width: 0 })).rejects.toThrow(/Invalid/);
    await expect(store.retain(input, { ...generated(), blob: new Blob([
      new Uint8Array(AI_LANDFALL_ORIGINAL_MAX_BYTES_V1 + 1),
    ], { type: 'image/png' }) })).rejects.toThrow(/oversized/);
    expect(fixture.writes).toHaveLength(0);
    expect(() => createAiLandfallOriginalStoreV1({ indexedDB: fixture.factory, databaseName: 'game-save' })).toThrow(/Separate/);
    expect(aiLandfallInputKeyV1(input)).not.toBe(aiLandfallInputKeyV1({ ...input, recipeJson: '{"seed":133,"steps":4}' }));
    store.close();
    await expect(store.find(input)).rejects.toThrow(/closed/);
  });
});

it('failed opening retries and versionchange reopens, while explicit close stays closed', async () => {
  const f = idbFixture(), store = createAiLandfallOriginalStoreV1({ indexedDB: f.factory });
  f.control.failOpen = true; await expect(store.find(input)).rejects.toThrow('open failed');
  f.control.failOpen = false; expect(await store.find(input)).toBeNull(); expect(f.control.opens).toBe(2);
  f.db.onversionchange?.(); expect(await store.find(input)).toBeNull(); expect(f.control.opens).toBe(3);
  store.close(); await expect(store.find(input)).rejects.toThrow('closed'); expect(f.control.opens).toBe(3);
});
