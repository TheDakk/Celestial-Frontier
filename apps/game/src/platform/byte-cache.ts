export interface ByteCache {
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, bytes: Uint8Array): Promise<void>;
  keys(): Promise<string[]>;
  delete(key: string): Promise<void>;
}

/** Bytes kept under plain keys (letters and digits) in the Cache Storage cache `name`. A page on a plain
 *  connection has no Cache Storage: there nothing is kept, and every read finds nothing. */
export function cacheStorageBytes(name: string, storage: CacheStorage | undefined = globalThis.caches): ByteCache {
  // Cache Storage keys are addresses; each key is the last step of one under the cache's own name.
  const prefix = `/${name}/`;
  const open = (): Promise<Cache> | null => (storage === undefined ? null : storage.open(name));
  return {
    async get(key) {
      const response = await (await open())?.match(prefix + key);
      return response === undefined ? null : new Uint8Array(await response.arrayBuffer());
    },
    async put(key, bytes) {
      await (await open())?.put(prefix + key, new Response(bytes.slice().buffer));
    },
    async keys() {
      const requests = (await (await open())?.keys()) ?? [];
      return requests.map((request) => new URL(request.url).pathname.slice(prefix.length));
    },
    async delete(key) {
      await (await open())?.delete(prefix + key);
    },
  };
}
