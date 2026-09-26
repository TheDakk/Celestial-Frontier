/** @module battle2-master-pin-admission [app] — C13 (2026-09-25): the runtime BYTE PREFLIGHT of a painted archetype against its
 * build-generated pin (`battle2-master-pins.generated.ts`), run by the battle2 wiring BEFORE any image decode, morph-cache lease,
 * marking-mask fetch, master fetch or Pixi allocation. Codex's review amendments
 * (`audits/ART_BATTLE_FOCUS_20260925/master-pin-review-01/README.md`), in its check order:
 *   1. private identity: the pin must be one of the generated module's exact frozen entries (a clone, a JSON round trip or a
 *      look-alike refuses `untrusted-pin-authority` before any pin field is read or any byte hashed); it must name this creature;
 *   2. the full record: stableJSON hash and recipe hash;
 *   3. the master identity: the record's cut-out hash and canonical `source` path (and dimensions) equal the pin's;
 *   4. the alpha: requested path canonical and equal, exact bytes hash, PNG header dimensions = pin = record geometry;
 *   5. the binding (exact DECOMPRESSED bytes) and the atlas (exact bytes; header dimensions = the binding's atlas size).
 * Only after all of that is the binding parsed — from the very bytes that were hashed. `loadPinnedCreatureRigV1` snapshots
 * and preflights these inputs, decodes the pinned alpha, runs the shared semantic record admission and enters the same private
 * binding/parts/skin/seam tail as byte admission. Only the master-byte hash is supplied by the bundled build pin. The hash definitions
 * are the ONE shared contract `tools/morph/battle2-pin-contract.mjs`. */
import { isBattle2MasterPin, type Battle2MasterPinV1 } from './battle2-master-pins.generated.js';
import { canonicalRepoPath, pinRecordSha256, pngHeaderSize } from '../../../tools/morph/battle2-pin-contract.mjs';
import { hashBytes } from '../../../tools/creature-animation/quadruped-template.mjs';
import { repoRelativeSource } from '../../../tools/creature-animation/record-source.mjs';

export type Battle2PinRefusalCode = 'missing-pin' | 'untrusted-pin-authority' | 'pin-creature-mismatch' | 'record-mismatch' | 'master-mismatch'
  | 'path-mismatch' | 'alpha-mismatch' | 'binding-mismatch' | 'atlas-mismatch';
export class Battle2PinRefusal extends Error {
  readonly code: Battle2PinRefusalCode;
  constructor(code: Battle2PinRefusalCode, detail: string) { super(`battle2 pin refused (${code}): ${detail}`); this.name = 'Battle2PinRefusal'; this.code = code; }
}
export interface Battle2PinnedBytesV1 {
  /** The pin object as looked up (authority is checked by identity; never trust its shape). */
  readonly pin: unknown;
  readonly creatureId: string;
  readonly record: unknown;
  /** Repo-relative paths the caller fetched the bytes from (`audits/…`). */
  readonly alphaPath: string; readonly alpha: Uint8Array;
  /** The DECOMPRESSED binding bytes (see `gunzipTransportBytes`). */
  readonly bindingBytes: Uint8Array;
  readonly atlasPath: string; readonly atlas: Uint8Array;
}
export interface Battle2PinAdmissionV1 { readonly pin: Battle2MasterPinV1; readonly binding: unknown; readonly alphaSize: { readonly width: number; readonly height: number }; }

const refuse = (code: Battle2PinRefusalCode, detail: string): never => { throw new Battle2PinRefusal(code, detail); };

/** A shipped `.gz` body as its decompressed bytes. The bytes are sniffed: a server that already decoded the transport still works. */
export async function gunzipTransportBytes(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes;
  const copy = new Uint8Array(bytes.length); copy.set(bytes);
  return new Uint8Array(await new Response(new Blob([copy.buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
}

/** The preflight (see the module header). Throws `Battle2PinRefusal`; returns the binding parsed from the hashed bytes. */
export async function preflightBattle2PinnedBytesV1(input: Battle2PinnedBytesV1): Promise<Battle2PinAdmissionV1> {
  // 1. identity BEFORE any field read or hash
  if (!isBattle2MasterPin(input.pin)) return refuse('untrusted-pin-authority', 'not a bundled build pin (clone, JSON copy or look-alike)');
  const pin = input.pin;
  if (pin.creatureId !== input.creatureId) refuse('pin-creature-mismatch', `pin ${pin.creatureId} offered for ${input.creatureId}`);
  // 2. the record
  const record = input.record as { recipeHash?: unknown; source?: unknown; geometry?: { cutoutAssetHash?: unknown; width?: unknown; height?: unknown } } | null;
  if (!record || typeof record !== 'object') return refuse('record-mismatch', 'no record');
  if (await pinRecordSha256(record) !== pin.recordSha256) refuse('record-mismatch', 'record bytes differ from the pinned record');
  if (record.recipeHash !== pin.recipeHash) refuse('record-mismatch', 'recipe hash differs from the pin');
  // 3. the master identity (the master itself is not fetched here)
  if (record.geometry?.cutoutAssetHash !== pin.masterSha256) refuse('master-mismatch', 'record cut-out hash differs from the pinned master');
  let masterPath: string | null = null; try { masterPath = canonicalRepoPath(repoRelativeSource(record.source as string)); } catch { masterPath = null; }
  if (masterPath === null || masterPath !== pin.masterPath) refuse('master-mismatch', `record source ${JSON.stringify(record.source)} is not the pinned master path`);
  if (record.geometry?.width !== pin.masterWidth || record.geometry?.height !== pin.masterHeight) refuse('master-mismatch', 'record geometry differs from the pinned master size');
  // 4. the alpha cut-out
  for (const [what, got, want] of [['alpha', input.alphaPath, pin.alphaPath], ['atlas', input.atlasPath, pin.atlasPath]] as const)
    if (canonicalRepoPath(got) === null || got !== want) refuse('path-mismatch', `${what} path ${JSON.stringify(got)} is not the canonical pinned path`);
  if (await hashBytes(input.alpha) !== pin.alphaSha256) refuse('alpha-mismatch', 'alpha bytes differ from the pin');
  const alphaSize = pngHeaderSize(input.alpha);
  if (!alphaSize || alphaSize.width !== pin.alphaWidth || alphaSize.height !== pin.alphaHeight || alphaSize.width !== pin.masterWidth || alphaSize.height !== pin.masterHeight) refuse('alpha-mismatch', 'alpha PNG header dimensions differ from the pin');
  // 5. binding + atlas
  if (await hashBytes(input.bindingBytes) !== pin.bindingSha256) refuse('binding-mismatch', 'decompressed binding bytes differ from the pin');
  if (await hashBytes(input.atlas) !== pin.atlasSha256) refuse('atlas-mismatch', 'atlas bytes differ from the pin');
  let binding: { recordRecipeHash?: unknown; atlasSize?: { width?: unknown; height?: unknown } };
  try { binding = JSON.parse(new TextDecoder().decode(input.bindingBytes)); } catch { return refuse('binding-mismatch', 'pinned binding bytes are not JSON'); }
  if (binding.recordRecipeHash !== pin.recipeHash) refuse('binding-mismatch', 'binding belongs to another record');
  const atlasSize = pngHeaderSize(input.atlas);
  if (!atlasSize || atlasSize.width !== binding.atlasSize?.width || atlasSize.height !== binding.atlasSize?.height) refuse('atlas-mismatch', 'atlas PNG header dimensions differ from the binding');
  return Object.freeze({ pin, binding, alphaSize: Object.freeze(alphaSize!) });
}
