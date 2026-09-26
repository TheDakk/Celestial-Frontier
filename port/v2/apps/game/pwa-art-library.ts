import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** G3 (audits/G3_ART_DELIVERY_20260926): the on-demand art library served from `library/`, OUTSIDE the precached pack. The build
 * verifies the whole `library/` inventory against its manifest (no unlisted file, every size and digest exact) and returns the
 * manifest's pin for the service worker. Library bytes are never counted in the 128 MiB shipped pack. */
export const ART_LIBRARY_MANIFEST_PATH = 'library/art-library.json';
export interface ArtLibraryManifestPin { readonly path: string; readonly sha256: string; readonly bytes: number; readonly files: number; readonly libraryBytes: number; }
const sha = (b: Uint8Array): string => createHash('sha256').update(b).digest('hex');

export function verifyArtLibraryFiles(filesRoot: string): ArtLibraryManifestPin | null {
  const manifestFile = resolve(filesRoot, ART_LIBRARY_MANIFEST_PATH);
  if (!existsSync(manifestFile)) {
    if (existsSync(resolve(filesRoot, 'library'))) throw Error('art library files require library/art-library.json');
    return null;
  }
  const bytes = readFileSync(manifestFile), body = JSON.parse(bytes.toString('utf8')) as { schema?: unknown; files?: unknown };
  if (body.schema !== 'cf-art-library/v1' || !Array.isArray(body.files)) throw Error('Invalid art library manifest');
  const listed = new Map<string, { bytes: number; sha256: string }>();
  for (const f of body.files as { path: string; bytes: number; sha256: string }[]) {
    if (!f || typeof f.path !== 'string' || !/^library\/[A-Za-z0-9_./-]+$/u.test(f.path) || f.path.split('/').some((p) => !p || p === '.' || p === '..')
      || !Number.isSafeInteger(f.bytes) || f.bytes <= 0 || typeof f.sha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(f.sha256) || listed.has(f.path)) throw Error('Unsafe or duplicate art library entry');
    listed.set(f.path, { bytes: f.bytes, sha256: f.sha256 });
  }
  const discovered: string[] = [];
  const walk = (relative: string): void => {
    const full = resolve(filesRoot, relative), stat = lstatSync(full);
    if (stat.isSymbolicLink()) throw Error('art library symlinks are forbidden');
    if (stat.isDirectory()) for (const name of readdirSync(full).sort()) walk(relative + '/' + name);
    else if (stat.isFile()) { if (relative !== ART_LIBRARY_MANIFEST_PATH) discovered.push(relative); }
    else throw Error('art library file is not a regular file');
  };
  walk('library');
  if (JSON.stringify(discovered.sort()) !== JSON.stringify([...listed.keys()].sort())) throw Error('art library inventory differs from its manifest');
  let libraryBytes = 0;
  for (const [path, pin] of listed) {
    const b = readFileSync(resolve(filesRoot, path));
    if (b.byteLength !== pin.bytes || sha(b) !== pin.sha256) throw Error('art library bytes differ from pin: ' + path);
    libraryBytes += b.byteLength;
  }
  return Object.freeze({ path: ART_LIBRARY_MANIFEST_PATH, sha256: sha(bytes), bytes: bytes.byteLength, files: listed.size, libraryBytes });
}
