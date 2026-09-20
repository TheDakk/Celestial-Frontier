import { describe, expect, it } from 'vitest';
import { aiCreatureFinishInputKeyV1, createAiCreatureOriginalStoreV1, type AiCreatureFinishInputV1 } from '../apps/game/src/creature-originals.js';

const input: AiCreatureFinishInputV1 = Object.freeze({ creatureId: 'crab', recordRecipeHash: 'a'.repeat(64), cutoutAssetHash: 'b'.repeat(64),
  finishSettingsHash: 'c'.repeat(64), modelRevision: '3bffc0efef1d9f84727036cdbc44df3b6ab51131' });
const generated = (value = 'finished') => ({ blob: new Blob([value], { type: 'image/png' }), width: 880, height: 880 });

// Minimal deterministic IDB adapter (same shape as the landfall fixture): staged readwrite commits on complete.
function idbFixture() {
  const stores = new Map<string, Map<string, unknown>>();
  let initialized = false;
  const db = {
    createObjectStore(name: string) { stores.set(name, new Map()); },
    close() {}, onversionchange: null as null | (() => void),
    transaction(_names: string[], mode: string) {
      const staged = new Map([...stores].map(([key, rows]) => [key, new Map(rows)]));
      let pending = 0, finished = false;
      const tx = { oncomplete: null as null | (() => void), onabort: null as null | (() => void), onerror: null as null | (() => void), error: null as Error | null,
        abort() { if (finished) return; finished = true; tx.error = new Error('abort'); tx.onabort?.(); },
        complete() { if (finished || pending) return; finished = true; if (mode === 'readwrite') for (const [name, values] of staged) stores.set(name, values); tx.oncomplete?.(); },
        objectStore(name: string) {
          const request = (action: () => unknown) => { const result = { result: undefined as unknown, onsuccess: null as null | (() => void) }; pending++;
            queueMicrotask(() => { if (finished) return; result.result = action(); result.onsuccess?.(); pending--; queueMicrotask(() => tx.complete()); }); return result; };
          return { get: (key: string) => request(() => staged.get(name)?.get(key)),
            add: (value: unknown, key: string) => request(() => { if (staged.get(name)!.has(key)) throw new Error('Duplicate'); staged.get(name)!.set(key, structuredClone(value)); return key; }),
            put: (value: unknown, key: string) => request(() => { staged.get(name)!.set(key, structuredClone(value)); return key; }) };
        } };
      return tx;
    },
  };
  const factory = { open() { const request = { result: db, onupgradeneeded: null as null | (() => void), onsuccess: null as null | (() => void), onerror: null, onblocked: null };
    queueMicrotask(() => { if (!initialized) { initialized = true; request.onupgradeneeded?.(); } request.onsuccess?.(); }); return request; } } as unknown as IDBFactory;
  return { factory, stores };
}

describe('finished creature originals', () => {
  it('retains exact bytes under the exact finish input and serves them with no inference across a new store instance', async () => {
    const fixture = idbFixture();
    const first = createAiCreatureOriginalStoreV1({ indexedDB: fixture.factory });
    const original = await first.retain(input, generated());
    expect(original.input).toEqual(input); expect(Object.isFrozen(original)).toBe(true); expect(await original.blob.text()).toBe('finished');
    first.close();
    const reopened = createAiCreatureOriginalStoreV1({ indexedDB: fixture.factory });
    expect((await reopened.find(input))?.originalId).toBe(original.originalId);
    expect(await (await reopened.read(input, original.originalId))!.blob.text()).toBe('finished');
    expect(await reopened.find({ ...input, finishSettingsHash: 'd'.repeat(64) })).toBeNull();
    await expect(reopened.read({ ...input, cutoutAssetHash: 'e'.repeat(64) }, original.originalId)).rejects.toThrow(/verification/);
  });
  it('refuses regeneration for an input that already has an original, and a different input key never collides', async () => {
    const fixture = idbFixture();
    const store = createAiCreatureOriginalStoreV1({ indexedDB: fixture.factory });
    const original = await store.retain(input, generated());
    await expect(store.retain(input, generated('finished-again'))).rejects.toThrow(/already retained/);
    expect((await store.retain(input, generated())).originalId).toBe(original.originalId);
    const other = { ...input, modelRevision: '0'.repeat(40) };
    expect(aiCreatureFinishInputKeyV1(other)).not.toBe(aiCreatureFinishInputKeyV1(input));
    expect((await store.retain(other, generated('other'))).originalId).not.toBe(original.originalId);
  });
  it('bounds identity, bytes, type, dimensions and the namespace before any write', async () => {
    const store = createAiCreatureOriginalStoreV1({ indexedDB: idbFixture().factory });
    await expect(store.retain({ ...input, creatureId: 'Crab!' }, generated())).rejects.toThrow(/creature id/);
    await expect(store.retain({ ...input, recordRecipeHash: 'zz' }, generated())).rejects.toThrow(/record hash/);
    await expect(store.retain(input, { ...generated(), blob: new Blob(['x'], { type: 'image/jpeg' }) })).rejects.toThrow(/Invalid or oversized/);
    await expect(store.retain(input, { ...generated(), width: 8 })).rejects.toThrow(/Invalid or oversized/);
    expect(() => createAiCreatureOriginalStoreV1({ indexedDB: idbFixture().factory, databaseName: 'cf-ai-landfall-originals-v1' })).toThrow(/unavailable/);
    expect(await store.find(input)).toBeNull();
  });
});
