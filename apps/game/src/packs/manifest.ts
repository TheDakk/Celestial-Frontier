import { sha256Hex } from './sha256';

export const PACK_MAX_BYTES = 15_728_640;
/** One art pack: a UTF-8 text file in an existing text format (a part catalogue or an interface sheet). */
export interface PackEntry { readonly name: string; readonly kind: 'parts' | 'interface'; readonly file: string; readonly bytes: number; readonly sha256: string }
export interface PackManifest { readonly format: 1; readonly packs: readonly PackEntry[] }
export type PackCheck = { ok: true } | { ok: false; reason: 'wrong-hash' | 'wrong-size' };

const HASH = /^[0-9a-f]{64}$/;
// A plain file name: it is joined to a folder and to an address, so it may not climb out of either.
const FILE = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

function parseEntry(value: unknown, index: number): PackEntry {
  if (typeof value !== 'object' || value === null) throw new Error(`pack manifest: pack ${index} is not an object`);
  const { name, kind, file, bytes, sha256 } = value as Record<string, unknown>;
  if (typeof name !== 'string' || name === '') throw new Error(`pack manifest: pack ${index} has no name`);
  if (kind !== 'parts' && kind !== 'interface') throw new Error(`pack manifest: pack ${name} has an unknown kind`);
  if (typeof file !== 'string' || !FILE.test(file)) throw new Error(`pack manifest: pack ${name} needs a plain file name`);
  if (typeof bytes !== 'number' || !Number.isInteger(bytes) || bytes < 1 || bytes > PACK_MAX_BYTES) {
    throw new Error(`pack manifest: pack ${name} has a size outside 1 to ${PACK_MAX_BYTES} bytes`);
  }
  if (typeof sha256 !== 'string' || !HASH.test(sha256)) throw new Error(`pack manifest: pack ${name} needs a hash of 64 lower-case hex characters`);
  return { name, kind, file, bytes, sha256 };
}

/** Throws on an unknown format, a repeated name, a hash that is not 64 hex characters, a size outside 1 to
 *  PACK_MAX_BYTES, or a file that is not a plain file name. */
export function parseManifest(json: unknown): PackManifest {
  const { format, packs } = (typeof json === 'object' && json !== null ? json : {}) as Record<string, unknown>;
  if (format !== 1) throw new Error('pack manifest: unknown format');
  if (!Array.isArray(packs)) throw new Error('pack manifest: packs is not a list');
  const entries = packs.map(parseEntry);
  const names = new Set<string>();
  for (const { name } of entries) {
    if (names.has(name)) throw new Error(`pack manifest: repeated name ${name}`);
    names.add(name);
  }
  return { format: 1, packs: entries };
}

/** Whether `bytes` are the pack the manifest entry names. */
export function checkPackBytes(entry: PackEntry, bytes: Uint8Array): PackCheck {
  if (bytes.byteLength !== entry.bytes) return { ok: false, reason: 'wrong-size' };
  if (sha256Hex(bytes) !== entry.sha256) return { ok: false, reason: 'wrong-hash' };
  return { ok: true };
}
