/** Content hashing only. Storage identity, schema, ownership and limits are unchanged.
 * Secure contexts use native Web Crypto. The compatibility path yields between fixed
 * chunks and snapshots bytes before yielding; clocks never enter the digest. */
import {LocalModelSha256V1} from './local-model-sha256.js';
export const LANDFALL_HASH_MAX_BYTES_V1 = 16 * 1024 * 1024;
const CHUNK = 64 * 1024;
export async function hashLandfallBufferV1(buffer: ArrayBuffer, options: {
  readonly subtle?: Pick<SubtleCrypto, 'digest'> | null;
  readonly yieldTask?: () => Promise<void>;
} = {}): Promise<string> {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 1 || buffer.byteLength > LANDFALL_HASH_MAX_BYTES_V1) {
    throw new Error('Invalid or oversized landfall hash input');
  }
  const subtle = options.subtle === undefined ? globalThis.crypto?.subtle : options.subtle;
  if (subtle) {
    // digest snapshots the BufferSource when invoked. Do not silently fall back on failure.
    const result = await subtle.digest('SHA-256', buffer);
    if (result.byteLength !== 32) throw new Error('Invalid native SHA-256 result');
    return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  const bytes = new Uint8Array(buffer.slice(0)), hasher = new LocalModelSha256V1();
  const yieldTask = options.yieldTask ?? (() => new Promise<void>(resolve => setTimeout(resolve, 0)));
  for (let start = 0; start < bytes.byteLength; start += CHUNK) {
    hasher.update(bytes.subarray(start, start + CHUNK));
    if (start + CHUNK < bytes.byteLength) await yieldTask();
  }
  return hasher.digestHex();
}
export async function hashLandfallBlobV1(blob: Blob): Promise<string> {
  if (!(blob instanceof Blob)) throw new Error('Landfall blob required');
  // Read intrinsic Blob bytes rather than a subclass's mutable stream implementation.
  const snapshot = Blob.prototype.slice.call(blob) as Blob;
  if (snapshot.size !== blob.size || snapshot.size < 1 || snapshot.size > LANDFALL_HASH_MAX_BYTES_V1) {
    throw new Error('Invalid or oversized landfall original');
  }
  const bytes = await snapshot.arrayBuffer();
  if (bytes.byteLength !== snapshot.size) throw new Error('Landfall original byte count changed');
  return hashLandfallBufferV1(bytes);
}
