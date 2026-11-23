import { cacheStorageBytes } from '../platform/byte-cache';

/** Verified packs kept for offline use, each under its SHA-256. */
export interface PackCache {
  get(sha256: string): Promise<Uint8Array | null>;
  put(sha256: string, bytes: Uint8Array): Promise<void>;
  keys(): Promise<string[]>;
  delete(sha256: string): Promise<void>;
}

/** Its own Cache Storage cache, apart from the shell's, so a shell update never removes a pack. */
export const PACK_CACHE_NAME = 'cf-v2-pixel-packs';

export function cacheStoragePackCache(name: string = PACK_CACHE_NAME): PackCache {
  return cacheStorageBytes(name);
}
