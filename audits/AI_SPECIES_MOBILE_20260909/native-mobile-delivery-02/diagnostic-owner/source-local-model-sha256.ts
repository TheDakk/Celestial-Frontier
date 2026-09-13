/* Incremental byte SHA-256 for local model verification. Compression, initial
   state and round constants derive from the existing dependency-free implementation
   in packages/domain/acquisition/src/canonical.ts. That domain helper stays unchanged.
   Input chunks are consumed synchronously and never retained. Memory is bounded to
   one 64-byte partial block, one 64-word schedule and the eight-word digest state. */

const SHA256_K = Object.freeze([
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
]);

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}


const MAX_HASH_BYTES = Math.floor(Number.MAX_SAFE_INTEGER / 8);

export class LocalModelSha256V1 {
  private readonly block = new Uint8Array(64);
  private readonly words = new Uint32Array(64);
  private readonly state = new Uint32Array([
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
  ]);
  private blockLength = 0;
  private totalBytes = 0;
  private digest: string | null = null;

  update(bytes: Uint8Array): this {
    if (this.digest !== null) throw new Error('local model SHA-256 is already finalized');
    if (bytes.byteLength > MAX_HASH_BYTES - this.totalBytes) {
      throw new RangeError('local model SHA-256 exceeds the safe bit-length limit');
    }
    this.totalBytes += bytes.byteLength;
    let offset = 0;
    if (this.blockLength > 0) {
      const count = Math.min(64 - this.blockLength, bytes.byteLength);
      this.block.set(bytes.subarray(0, count), this.blockLength);
      this.blockLength += count;
      offset += count;
      if (this.blockLength === 64) {
        this.compress(this.block, 0);
        this.blockLength = 0;
      }
    }
    while (offset + 64 <= bytes.byteLength) {
      this.compress(bytes, offset);
      offset += 64;
    }
    if (offset < bytes.byteLength) {
      this.block.set(bytes.subarray(offset), this.blockLength);
      this.blockLength += bytes.byteLength - offset;
    }
    return this;
  }

  /** Finalize once; repeated reads return the same digest. Further updates fail. */
  digestHex(): string {
    if (this.digest !== null) return this.digest;
    this.block[this.blockLength] = 0x80;
    this.block.fill(0, this.blockLength + 1);
    if (this.blockLength >= 56) {
      this.compress(this.block, 0);
      this.block.fill(0);
    }
    const bitLength = this.totalBytes * 8;
    const high = Math.floor(bitLength / 0x1_0000_0000);
    const low = bitLength >>> 0;
    for (let index = 0; index < 4; index++) {
      this.block[56 + index] = (high >>> (24 - index * 8)) & 0xFF;
      this.block[60 + index] = (low >>> (24 - index * 8)) & 0xFF;
    }
    this.compress(this.block, 0);
    this.digest = Array.from(this.state, (word) => word.toString(16).padStart(8, '0')).join('');
    return this.digest;
  }

  private compress(bytes: Uint8Array, offset: number): void {
    const words = this.words;
    const h = this.state;
    for (let index = 0; index < 16; index++) {
      const at = offset + index * 4;
      words[index] = (
        (bytes[at]! << 24) | (bytes[at + 1]! << 16) | (bytes[at + 2]! << 8) | bytes[at + 3]!
      ) >>> 0;
    }
    for (let index = 16; index < 64; index++) {
      const a = words[index - 15]!;
      const b = words[index - 2]!;
      const s0 = rotateRight(a, 7) ^ rotateRight(a, 18) ^ (a >>> 3);
      const s1 = rotateRight(b, 17) ^ rotateRight(b, 19) ^ (b >>> 10);
      words[index] = (words[index - 16]! + s0 + words[index - 7]! + s1) >>> 0;
    }
    let a = h[0]!, b = h[1]!, c = h[2]!, d = h[3]!;
    let e = h[4]!, f = h[5]!, g = h[6]!, hh = h[7]!;
    for (let index = 0; index < 64; index++) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + choice + SHA256_K[index]! + words[index]!) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      hh = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h[0] = (h[0]! + a) >>> 0; h[1] = (h[1]! + b) >>> 0;
    h[2] = (h[2]! + c) >>> 0; h[3] = (h[3]! + d) >>> 0;
    h[4] = (h[4]! + e) >>> 0; h[5] = (h[5]! + f) >>> 0;
    h[6] = (h[6]! + g) >>> 0; h[7] = (h[7]! + hh) >>> 0;
  }
}
