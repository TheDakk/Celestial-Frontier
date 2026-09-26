/** @module art-library [app] — G3 of the Generated Creature Pipeline (audits/GENERATION_PIPELINE_20260926/PROGRAM.md): painted
 * archetype art delivered ON DEMAND from the origin, outside the precached PWA pack.
 *
 * Trust chain: the bundle carries ONE pin (`ART_LIBRARY_MANIFEST_PIN`, generated) of the library manifest; the manifest lists every
 * library file with its exact byte count and SHA-256. A file is fetched, bounded by its pinned size and hashed BEFORE any caller sees
 * a byte — so no decode, cache lease or Pixi allocation ever touches unverified art. Refusals are named (`ArtLibraryRefusal.code`).
 * The service worker applies the same pins before it caches (pwa-build.ts), and serves verified copies offline; without a worker
 * (dev server) this module is the only check. The per-file table is private: callers ask by served path and get frozen answers. */
import { ART_LIBRARY_MANIFEST_PIN } from './art-library.generated.js';

export const ART_LIBRARY_MANIFEST_SCHEMA = 'cf-art-library/v1' as const;
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
  /** Test seam: the manifest pin (default: the bundled generated pin). */
  readonly pin?: Readonly<{ path: string; sha256: string; bytes: number }>;
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
const manifests = new Map<string, Promise<ReadonlyMap<string, ArtLibraryEntryV1>>>();
/** The verified manifest (memoized per base + pin; a failure is not cached, so the next use retries). */
export function loadArtLibraryManifestV1(options: ArtLibraryOptionsV1 = {}): Promise<ReadonlyMap<string, ArtLibraryEntryV1>> {
  const base = options.base ?? defaultBase(), pin = options.pin ?? ART_LIBRARY_MANIFEST_PIN, fetchImpl = options.fetchImpl ?? fetch, key = base + '|' + pin.sha256;
  let pending = manifests.get(key);
  if (!pending) {
    pending = (async () => {
      let response: Response;
      try { response = await fetchImpl(new URL(pin.path, base).href, { credentials: 'same-origin', redirect: 'error' }); } catch (error) { throw new ArtLibraryRefusal('manifest-unavailable', error instanceof Error ? error.message : String(error)); }
      if (!response.ok) throw new ArtLibraryRefusal('manifest-unavailable', `HTTP ${response.status}`);
      const bytes = await boundedBytes(response, pin.bytes, pin.path).catch((e) => { throw e instanceof ArtLibraryRefusal ? new ArtLibraryRefusal('manifest-mismatch', e.message) : e; });
      if (await sha256HexV1(bytes) !== pin.sha256) throw new ArtLibraryRefusal('manifest-mismatch', 'digest differs from the bundled pin');
      let body: { schema?: unknown; files?: unknown };
      try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new ArtLibraryRefusal('manifest-invalid', 'not JSON'); }
      if (body.schema !== ART_LIBRARY_MANIFEST_SCHEMA || !Array.isArray(body.files)) throw new ArtLibraryRefusal('manifest-invalid', 'schema');
      const table = new Map<string, ArtLibraryEntryV1>();
      for (const f of body.files as ArtLibraryEntryV1[]) {
        if (!f || typeof f.path !== 'string' || !SAFE.test(f.path) || f.path.split('/').some((p) => !p || p === '.' || p === '..')
          || !Number.isSafeInteger(f.bytes) || f.bytes <= 0 || typeof f.sha256 !== 'string' || !HEX64.test(f.sha256) || table.has(f.path)) throw new ArtLibraryRefusal('manifest-invalid', 'entry ' + JSON.stringify(f?.path));
        table.set(f.path, Object.freeze({ path: f.path, bytes: f.bytes, sha256: f.sha256 }));
      }
      return table;
    })();
    manifests.set(key, pending);
    pending.catch(() => { if (manifests.get(key) === pending) manifests.delete(key); });
  }
  return pending;
}
/** A served path's library entry, or null when the path is not a library file (or the manifest cannot be verified). */
export async function artLibraryEntryV1(servedPath: string, options: ArtLibraryOptionsV1 = {}): Promise<ArtLibraryEntryV1 | null> {
  try { return (await loadArtLibraryManifestV1(options)).get(servedPath) ?? null; } catch { return null; }
}
/** Fetches ONE library file and returns its bytes only after its size and digest match the manifest pin. */
export async function fetchArtLibraryBytesV1(servedPath: string, options: ArtLibraryOptionsV1 = {}): Promise<Uint8Array> {
  const entry = (await loadArtLibraryManifestV1(options)).get(servedPath);
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
export function resetArtLibraryForTestsV1(): void { manifests.clear(); }
