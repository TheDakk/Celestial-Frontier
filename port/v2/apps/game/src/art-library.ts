/** @module art-library [app] — G3 of the Generated Creature Pipeline (audits/GENERATION_PIPELINE_20260926/PROGRAM.md): painted
 * archetype art delivered ON DEMAND from the origin, outside the precached PWA pack.
 *
 * Trust chain: the bundle carries ONE pin (`ART_LIBRARY_MANIFEST_PIN`, generated) of the library manifest; the manifest lists every
 * library file with its exact byte count and SHA-256. A file is fetched, bounded by its pinned size and hashed BEFORE any caller sees
 * a byte — so no decode, cache lease or Pixi allocation ever touches unverified art. Refusals are named (`ArtLibraryRefusal.code`).
 * The service worker applies the same pins before it caches (pwa-build.ts), and serves verified copies offline; without a worker
 * (dev server) this module is the only check. The per-file table is private: callers ask by served path and get frozen answers.
 * D56 (2026-11-04): the page resolves a file through a second bundled pin, the SHARD INDEX (bucket → pinned shard); it holds the
 * index only and reads a bucket's shard per lookup (FINISH F4); the whole manifest (every file) is the worker's and the build's. Same pins-before-bytes rule at every step. */
import { ART_LIBRARY_MANIFEST_PIN, ART_LIBRARY_SHARD_INDEX_PIN } from './art-library.generated.js';

export const ART_LIBRARY_MANIFEST_SCHEMA = 'cf-art-library/v1' as const;
export const ART_LIBRARY_SHARD_INDEX_SCHEMA = 'cf-art-library-shards/v1' as const;
export const ART_LIBRARY_SHARD_SCHEMA = 'cf-art-library-shard/v1' as const;
export type ArtLibraryRefusalCode = 'manifest-unavailable' | 'manifest-mismatch' | 'manifest-invalid' | 'not-in-library' | 'http' | 'size-mismatch' | 'digest-mismatch';
export class ArtLibraryRefusal extends Error {
  readonly code: ArtLibraryRefusalCode;
  constructor(code: ArtLibraryRefusalCode, detail: string) { super(`art library ${code}: ${detail}`); this.name = 'ArtLibraryRefusal'; this.code = code; }
}
export interface ArtLibraryEntryV1 { readonly path: string; readonly bytes: number; readonly sha256: string; }
export interface ArtLibraryOptionsV1 {
  /** Site base URL the served paths resolve against (default: the app's own base). */
  readonly base?: string;
  readonly fetchImpl?: typeof fetch;
  /** Test seam: the manifest pin (default: the bundled generated pin). Given explicitly, lookups use that whole manifest. */
  readonly pin?: Readonly<{ path: string; sha256: string; bytes: number }>;
  /** Test seam: the shard index pin (default: the bundled generated pin; null = no index, use the whole manifest). */
  readonly shardPin?: Readonly<{ path: string; sha256: string; bytes: number }> | null;
}
const HEX64 = /^[a-f0-9]{64}$/u, SAFE = /^library\/[A-Za-z0-9_./-]+$/u;
const defaultBase = (): string => {
  try { const b = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL; if (typeof b === 'string' && typeof location !== 'undefined') return new URL(b, location.href).href; } catch { /* no env */ }
  return typeof location !== 'undefined' ? new URL('/', location.href).href : 'http://localhost/';
};
export async function sha256HexV1(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
/** Reads a response body, refusing more bytes than the pin allows (a lying server cannot make us buffer more). */
async function boundedBytes(response: Response, limit: number, what: string): Promise<Uint8Array> {
  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength !== limit) throw new ArtLibraryRefusal('size-mismatch', `${what}: ${buffer.byteLength} bytes, pinned ${limit}`);
  return buffer;
}
/** Fetches a pinned library JSON (manifest, shard index or shard), refusing it unless its size and digest match the pin. */
async function pinnedJson(pin: Readonly<{ path: string; sha256: string; bytes: number }>, base: string, fetchImpl: typeof fetch): Promise<Record<string, unknown>> {
  let response: Response;
  try { response = await fetchImpl(new URL(pin.path, base).href, { credentials: 'same-origin', redirect: 'error' }); } catch (error) { throw new ArtLibraryRefusal('manifest-unavailable', error instanceof Error ? error.message : String(error)); }
  if (!response.ok) throw new ArtLibraryRefusal('manifest-unavailable', `HTTP ${response.status}`);
  const bytes = await boundedBytes(response, pin.bytes, pin.path).catch((e) => { throw e instanceof ArtLibraryRefusal ? new ArtLibraryRefusal('manifest-mismatch', e.message) : e; });
  if (await sha256HexV1(bytes) !== pin.sha256) throw new ArtLibraryRefusal('manifest-mismatch', pin.path + ': digest differs from its pin');
  try { const v: unknown = JSON.parse(new TextDecoder().decode(bytes)); if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>; } catch { /* below */ }
  throw new ArtLibraryRefusal('manifest-invalid', pin.path + ': not a JSON object');
}
const safePath = (p: unknown): p is string => typeof p === 'string' && SAFE.test(p) && !p.split('/').some((x) => !x || x === '.' || x === '..');
/** The library file table of a validated `files` list; every entry is well formed and unique (and, for a shard, inside its group). */
function fileTable(files: unknown, group: string | null): Map<string, ArtLibraryEntryV1> {
  if (!Array.isArray(files)) throw new ArtLibraryRefusal('manifest-invalid', 'schema');
  const table = new Map<string, ArtLibraryEntryV1>();
  for (const f of files as ArtLibraryEntryV1[]) {
    if (!f || !safePath(f.path) || !Number.isSafeInteger(f.bytes) || f.bytes <= 0 || typeof f.sha256 !== 'string' || !HEX64.test(f.sha256) || table.has(f.path)
      || (group !== null && artLibraryGroupOfV1(f.path) !== group)) throw new ArtLibraryRefusal('manifest-invalid', 'entry ' + JSON.stringify(f?.path));
    table.set(f.path, Object.freeze({ path: f.path, bytes: f.bytes, sha256: f.sha256 }));
  }
  return table;
}
/** Memoizes one verified load per key; a failure is not cached, so the next use retries. */
function memo<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>): Promise<T> {
  let pending = cache.get(key);
  if (!pending) { pending = load(); cache.set(key, pending); const p = pending; p.catch(() => { if (cache.get(key) === p) cache.delete(key); }); }
  return pending;
}
/** D56/F4: a served path's shard = the hash bucket of its first three segments (its archetype directory, `library/cards/wolf`):
 * FNV-1a-32 mod 64 → `bucket-00` … `bucket-3f`. The manifest tool (tools/morph/art-library-tiers.mjs) buckets by the same rule. */
export const ART_LIBRARY_SHARD_BUCKETS = 64;
const BUCKET = /^bucket-[0-9a-f]{2}$/u;
export function artLibraryGroupOfV1(servedPath: string): string {
  const key = servedPath.split('/').slice(0, 3).join('/'); let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return 'bucket-' + (h % ART_LIBRARY_SHARD_BUCKETS).toString(16).padStart(2, '0');
}
type ShardPinV1 = Readonly<{ group: string; path: string; sha256: string; bytes: number }>;
const manifests = new Map<string, Promise<ReadonlyMap<string, ArtLibraryEntryV1>>>();
const shardIndexes = new Map<string, Promise<ReadonlyMap<string, ShardPinV1>>>();
const shards = new Map<string, Promise<ReadonlyMap<string, ArtLibraryEntryV1>>>();
/** The verified shard index: group → its shard's pin. */
function loadShardIndex(pin: Readonly<{ path: string; sha256: string; bytes: number }>, base: string, fetchImpl: typeof fetch): Promise<ReadonlyMap<string, ShardPinV1>> {
  return memo(shardIndexes, base + '|' + pin.sha256, async () => {
    const body = await pinnedJson(pin, base, fetchImpl);
    if (body.schema !== ART_LIBRARY_SHARD_INDEX_SCHEMA || !Array.isArray(body.shards)) throw new ArtLibraryRefusal('manifest-invalid', 'shard index schema');
    const index = new Map<string, ShardPinV1>();
    for (const s of body.shards as ShardPinV1[]) {
      if (!s || typeof s.group !== 'string' || !BUCKET.test(s.group) || parseInt(s.group.slice(7), 16) >= ART_LIBRARY_SHARD_BUCKETS || index.has(s.group) || !safePath(s.path)
        || !Number.isSafeInteger(s.bytes) || s.bytes <= 0 || typeof s.sha256 !== 'string' || !HEX64.test(s.sha256)) throw new ArtLibraryRefusal('manifest-invalid', 'shard ' + JSON.stringify(s?.group));
      index.set(s.group, Object.freeze({ group: s.group, path: s.path, sha256: s.sha256, bytes: s.bytes }));
    }
    return index;
  });
}
/** Shares one in-flight load per key and keeps NOTHING afterwards (FINISH F4: a page that touched nine buckets held ~160 KB of
 * shard tables on the phone Compendium path; a bucket is small and the worker/HTTP cache serves the repeat). */
function inFlight<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>): Promise<T> {
  let pending = cache.get(key);
  if (!pending) { pending = load(); cache.set(key, pending); const p = pending, drop = () => { if (cache.get(key) === p) cache.delete(key); }; p.then(drop, drop); }
  return pending;
}
/** One verified shard: only files of its own bucket. Loaded per lookup (shared while in flight), never retained. */
function loadShard(pin: ShardPinV1, base: string, fetchImpl: typeof fetch): Promise<ReadonlyMap<string, ArtLibraryEntryV1>> {
  return inFlight(shards, base + '|' + pin.sha256, async () => {
    const body = await pinnedJson(pin, base, fetchImpl);
    if (body.schema !== ART_LIBRARY_SHARD_SCHEMA || body.group !== pin.group) throw new ArtLibraryRefusal('manifest-invalid', 'shard schema ' + pin.group);
    return fileTable(body.files, pin.group);
  });
}
/** A served path's pinned entry (undefined when the library does not list it): through the shard index when one is pinned, else the
 * whole manifest. Errors (unavailable / mismatch / invalid) propagate. */
async function entryOf(servedPath: string, options: ArtLibraryOptionsV1): Promise<ArtLibraryEntryV1 | undefined> {
  const shardPin = options.pin === undefined ? (options.shardPin === undefined ? ART_LIBRARY_SHARD_INDEX_PIN : options.shardPin) : null;
  if (shardPin === null) return (await loadArtLibraryManifestV1(options)).get(servedPath);
  const base = options.base ?? defaultBase(), fetchImpl = options.fetchImpl ?? fetch;
  const pin = (await loadShardIndex(shardPin, base, fetchImpl)).get(artLibraryGroupOfV1(servedPath));
  return pin ? (await loadShard(pin, base, fetchImpl)).get(servedPath) : undefined;
}
/** The verified WHOLE manifest (memoized per base + pin; a failure is not cached, so the next use retries). The page resolves files
 * through the shard index (D56); the whole table is for the explicit `pin` seam and for builds without a shard index. */
export function loadArtLibraryManifestV1(options: ArtLibraryOptionsV1 = {}): Promise<ReadonlyMap<string, ArtLibraryEntryV1>> {
  const base = options.base ?? defaultBase(), pin = options.pin ?? ART_LIBRARY_MANIFEST_PIN, fetchImpl = options.fetchImpl ?? fetch;
  return memo(manifests, base + '|' + pin.sha256, async () => {
    const body = await pinnedJson(pin, base, fetchImpl);
    if (body.schema !== ART_LIBRARY_MANIFEST_SCHEMA || !Array.isArray(body.files)) throw new ArtLibraryRefusal('manifest-invalid', 'schema');
    return fileTable(body.files, null);
  });
}
/** A served path's library entry, or null when the path is not a library file (or the manifest cannot be verified). */
export async function artLibraryEntryV1(servedPath: string, options: ArtLibraryOptionsV1 = {}): Promise<ArtLibraryEntryV1 | null> {
  try { return (await entryOf(servedPath, options)) ?? null; } catch { return null; }
}
/** Fetches ONE library file and returns its bytes only after its size and digest match the manifest pin. */
export async function fetchArtLibraryBytesV1(servedPath: string, options: ArtLibraryOptionsV1 = {}): Promise<Uint8Array> {
  const entry = await entryOf(servedPath, options);
  if (!entry) throw new ArtLibraryRefusal('not-in-library', servedPath);
  const base = options.base ?? defaultBase(), fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try { response = await fetchImpl(new URL(entry.path, base).href, { credentials: 'same-origin', redirect: 'error' }); } catch (error) { throw new ArtLibraryRefusal('http', `${servedPath}: ${error instanceof Error ? error.message : String(error)}`); }
  if (!response.ok) throw new ArtLibraryRefusal('http', `${servedPath}: HTTP ${response.status}`);
  const bytes = await boundedBytes(response, entry.bytes, servedPath);
  if (await sha256HexV1(bytes) !== entry.sha256) throw new ArtLibraryRefusal('digest-mismatch', servedPath);
  return bytes;
}
/** The library served path of a battle2 arena URL (`…/battle2/audits/X` → `library/battle2/audits/X`), or null. */
export function libraryPathOfArenaUrl(url: string): string | null {
  const pathname = new URL(url).pathname, i = pathname.indexOf('/battle2/');
  return i < 0 ? null : 'library' + pathname.slice(i);
}
/** Test seam: forget memoized manifests. */
export function resetArtLibraryForTestsV1(): void { manifests.clear(); shardIndexes.clear(); shards.clear(); }
