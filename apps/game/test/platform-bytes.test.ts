import { describe, expect, it } from 'vitest';
import { cacheStorageBytes } from '../src/platform/byte-cache';
import { readBytes } from '../src/platform/http';

const ORIGIN = 'https://game.example';

/** Cache Storage as the adapter uses it, held in memory: caches by name, entries by absolute address. */
function fakeCacheStorage(): { storage: CacheStorage; caches: Map<string, Map<string, Response>> } {
  const held = new Map<string, Map<string, Response>>();
  const absolute = (url: string): string => new URL(url, ORIGIN).href;
  const storage = {
    open: async (name: string) => {
      const entries = held.get(name) ?? new Map<string, Response>();
      held.set(name, entries);
      return {
        match: async (url: string) => entries.get(absolute(url))?.clone(),
        put: async (url: string, response: Response) => { entries.set(absolute(url), response); },
        keys: async () => [...entries.keys()].map((url) => new Request(url)),
        delete: async (url: string) => entries.delete(absolute(url)),
      };
    },
  };
  return { storage: storage as unknown as CacheStorage, caches: held };
}

describe('bytes kept in Cache Storage', () => {
  const bytes = Uint8Array.of(1, 2, 3, 250);

  it('bytes put under a key are read back under it, listed by it, and gone once deleted', async () => {
    const { storage, caches } = fakeCacheStorage();
    const cache = cacheStorageBytes('cf-test', storage);
    expect(await cache.get('abc')).toBeNull();
    expect(await cache.keys()).toEqual([]);
    await cache.put('abc', bytes);
    await cache.put('def', Uint8Array.of(9));
    expect(await cache.get('abc')).toEqual(bytes);
    expect(await cache.get('abc')).toEqual(bytes);
    expect((await cache.keys()).sort()).toEqual(['abc', 'def']);
    expect([...caches.keys()]).toEqual(['cf-test']);
    await cache.delete('abc');
    expect(await cache.get('abc')).toBeNull();
    expect(await cache.keys()).toEqual(['def']);
  });

  it('two caches with different names share nothing', async () => {
    const { storage } = fakeCacheStorage();
    await cacheStorageBytes('one', storage).put('abc', bytes);
    expect(await cacheStorageBytes('two', storage).get('abc')).toBeNull();
    expect(await cacheStorageBytes('one', storage).get('abc')).toEqual(bytes);
  });

  it('where the browser offers no Cache Storage, nothing is kept and nothing fails', async () => {
    const cache = cacheStorageBytes('cf-test', undefined);
    await cache.put('abc', bytes);
    expect(await cache.get('abc')).toBeNull();
    expect(await cache.keys()).toEqual([]);
    await expect(cache.delete('abc')).resolves.toBeUndefined();
  });
});

describe('reading bytes from an address', () => {
  const answering = (status: number, body: Uint8Array | null) => {
    const asked: string[] = [];
    const fetcher = async (url: string): Promise<Response> => { asked.push(url); return new Response(body?.slice().buffer ?? null, { status }); };
    return { asked, fetcher };
  };

  it('gives the bytes of a file that is there', async () => {
    const { asked, fetcher } = answering(200, Uint8Array.of(7, 8, 255));
    expect(await readBytes('/art-packs/a.txt', fetcher)).toEqual(Uint8Array.of(7, 8, 255));
    expect(asked).toEqual(['/art-packs/a.txt']);
  });

  it('gives null for a file the server says is not there', async () => {
    expect(await readBytes('/art-packs/a.txt', answering(404, null).fetcher)).toBeNull();
    expect(await readBytes('/art-packs/a.txt', answering(410, null).fetcher)).toBeNull();
  });

  it('fails when the server cannot be reached or answers with an error', async () => {
    await expect(readBytes('/art-packs/a.txt', answering(500, null).fetcher)).rejects.toThrow(/500/);
    await expect(readBytes('/art-packs/a.txt', async () => { throw new TypeError('Failed to fetch'); })).rejects.toThrow(/Failed to fetch/);
  });
});
