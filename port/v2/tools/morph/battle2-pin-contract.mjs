// C13 (2026-09-25): the ONE definition of the build-pinned master contract, shared by the build-time generator
// (`battle2-master-pins.mjs`) and the runtime byte preflight (`apps/game/src/battle2-master-pin-admission.ts`), so the two can
// never disagree about what a hash covers or which path is canonical. Codex's accepted amendments:
// `audits/ART_BATTLE_FOCUS_20260925/master-pin-review-01/README.md`.
import { hashBytes, stableJSON } from '../creature-animation/quadruped-template.mjs';

export const BATTLE2_MASTER_PINS_SCHEMA = 'cf-battle2-master-pins/v1';
/** Exactly what each hash covers (emitted into the generated module's header too). */
export const BATTLE2_PIN_HASH_CONVENTION = Object.freeze({
  recordSha256: 'SHA-256 of the UTF-8 bytes of stableJSON(full record, recipeHash included), no trailing newline',
  masterSha256: 'SHA-256 of the exact original master PNG bytes (equals record.geometry.cutoutAssetHash)',
  alphaSha256: 'SHA-256 of the exact shipped parts/alpha.png bytes',
  bindingSha256: 'SHA-256 of the exact DECOMPRESSED binding.json bytes (never a reserialisation, never the .gz transport)',
  atlasSha256: 'SHA-256 of the exact atlas PNG bytes',
  paths: 'canonical repo-relative POSIX: no leading slash, empty/./.. segment, backslash, control char, URL scheme, query or fragment',
});
export const SHA256_PATTERN = /^[a-f0-9]{64}$/;

/** A canonical repo-relative POSIX path, or null. Nothing is decoded, resolved or suffix-matched: a non-canonical spelling is refused. */
export function canonicalRepoPath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) return null;
  if (value.startsWith('/') || value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return null;
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) || value.includes('?') || value.includes('#') || value.includes('%')) return null;
  const segments = value.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) return null;
  return value;
}
export function requireCanonicalRepoPath(value, what) {
  const p = canonicalRepoPath(value); if (p === null) throw Error(`battle2 pin: non-canonical ${what} path ${JSON.stringify(value)}`); return p;
}
/** recordSha256 as defined above. */
export function pinRecordSha256(record) { return hashBytes(new TextEncoder().encode(stableJSON(record))); }
/** The PNG IHDR width/height read from the header bytes alone (no decode, no allocation), or null when the bytes are not a PNG. */
export function pngHeaderSize(bytes) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!(bytes instanceof Uint8Array) || bytes.length < 24 || sig.some((b, i) => bytes[i] !== b)) return null;
  if (String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]) !== 'IHDR') return null;
  const u32 = (o) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
  const width = u32(16), height = u32(20);
  return width > 0 && height > 0 ? { width, height } : null;
}
