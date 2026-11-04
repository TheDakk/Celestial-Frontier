import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export const BATTLE2_ASSET_MANIFEST = 'battle2-assets.json';
export const BATTLE2_ASSET_SCHEMA = 'cf-battle2-assets/v1';
export interface Battle2AssetPin {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

/** The producer writes this manifest outside public/, avoiding a self hash.
 * No filesystem enumeration silently admits an unlisted public file. */
export function readBattle2AssetPins(gameRoot: string): readonly Battle2AssetPin[] {
  const manifest = resolve(gameRoot, BATTLE2_ASSET_MANIFEST);
  if (!existsSync(manifest)) {
    if (existsSync(resolve(gameRoot, 'public/battle2'))) throw Error('battle2 assets require battle2-assets.json');
    return Object.freeze([]);
  }
  const value = JSON.parse(readFileSync(manifest, 'utf8'));
  if (value?.schema !== BATTLE2_ASSET_SCHEMA || !Array.isArray(value.files) || value.files.length > 2048) {
    throw Error('Invalid battle2 asset manifest');
  }
  const seen = new Set<string>();
  const files = value.files.map((file: Battle2AssetPin) => {
    if (!file || typeof file.path !== 'string' || !/^battle2\/[A-Za-z0-9_.\/-]+$/u.test(file.path)
      || file.path.split('/').some((part) => !part || part === '.' || part === '..')
      || !Number.isSafeInteger(file.bytes) || file.bytes <= 0 || file.bytes > 134_217_728
      || typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(file.sha256) || seen.has(file.path)) {
      throw Error('Unsafe or duplicate battle2 asset pin');
    }
    seen.add(file.path);
    return Object.freeze({path:file.path, bytes:file.bytes, sha256:file.sha256});
  }).sort((a: Battle2AssetPin, b: Battle2AssetPin) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  verifyBattle2AssetFiles(resolve(gameRoot, 'public'), files);
  return Object.freeze(files);
}

export function verifyBattle2AssetFiles(filesRoot: string, files: readonly Battle2AssetPin[]): void {
  const discovered: string[] = [];
  const walk = (relative: string): void => {
    const full = resolve(filesRoot, relative), stat = lstatSync(full);
    if (stat.isSymbolicLink()) throw Error('battle2 asset symlinks are forbidden');
    if (stat.isDirectory()) for (const name of readdirSync(full).sort()) walk(relative + '/' + name);
    else if (stat.isFile()) discovered.push(relative);
    else throw Error('battle2 asset is not a regular file');
  };
  if (existsSync(resolve(filesRoot, 'battle2'))) walk('battle2');
  if (JSON.stringify(discovered.sort()) !== JSON.stringify(files.map((f) => f.path).sort())) {
    throw Error('battle2 asset inventory differs from pinned manifest');
  }
  for (const file of files) {
    const bytes = readFileSync(resolve(filesRoot, file.path));
    if (bytes.byteLength !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) {
      throw Error('battle2 asset bytes differ from pin: ' + file.path);
    }
  }
}
