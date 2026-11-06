import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { LocalModelSha256V1 } from '../apps/game/src/local-model-sha256.js';

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const ABC_SHA256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

function fixture(length: number): Uint8Array {
  return Uint8Array.from({ length }, (_, index) => ((index * 31) ^ (index >>> 3) ^ 0xA5) & 0xFF);
}

function nodeDigest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function streamDigest(bytes: Uint8Array, boundaries: readonly number[]): string {
  const hasher = new LocalModelSha256V1();
  let offset = 0;
  let boundary = 0;
  hasher.update(bytes.subarray(0, 0));
  while (offset < bytes.byteLength) {
    const end = Math.min(bytes.byteLength, offset + boundaries[boundary % boundaries.length]!);
    hasher.update(bytes.subarray(offset, end));
    hasher.update(bytes.subarray(end, end));
    offset = end;
    boundary++;
  }
  return hasher.digestHex();
}

describe('incremental local model SHA-256', () => {
  it('matches the empty and abc known answers, including one-byte updates', () => {
    expect(new LocalModelSha256V1().digestHex()).toBe(EMPTY_SHA256);
    expect(new LocalModelSha256V1().update(new Uint8Array()).digestHex()).toBe(EMPTY_SHA256);
    const abc = Uint8Array.of(0x61, 0x62, 0x63);
    expect(new LocalModelSha256V1().update(abc).digestHex()).toBe(ABC_SHA256);
    expect(streamDigest(abc, [1])).toBe(ABC_SHA256);
  });

  it('matches the million-a known answer without retaining the input chunks', () => {
    const hasher = new LocalModelSha256V1();
    const chunk = new Uint8Array(1_000).fill(0x61);
    for (let index = 0; index < 1_000; index++) hasher.update(chunk);
    expect(hasher.digestHex())
      .toBe('cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
  });

  it.each([0, 1, 55, 56, 63, 64, 65, 127, 128, 129, 1_048_576])(
    'matches Node crypto for %i deterministic bytes across block and padding boundaries',
    (length) => {
      const bytes = fixture(length);
      const expected = nodeDigest(bytes);
      expect(new LocalModelSha256V1().update(bytes).digestHex()).toBe(expected);
      expect(streamDigest(bytes, [1])).toBe(expected);
      expect(streamDigest(bytes, [7, 64, 3, 55, 128, 1, 56, 4_093])).toBe(expected);
    },
  );

  it('matches every split position through three blocks and the padding region', () => {
    const bytes = fixture(193);
    const expected = nodeDigest(bytes);
    for (let split = 0; split <= bytes.byteLength; split++) {
      const hasher = new LocalModelSha256V1();
      hasher.update(bytes.subarray(0, split));
      hasher.update(bytes.subarray(split, split));
      hasher.update(bytes.subarray(split));
      expect(hasher.digestHex(), `split at byte ${split}`).toBe(expected);
    }
  });

  it('honors nonzero byte offsets and consumes partial and complete blocks immediately', () => {
    const backing = new Uint8Array(221).fill(0xEE);
    const bytes = fixture(193);
    backing.set(bytes, 13);
    const view = new Uint8Array(backing.buffer, 13, bytes.byteLength);
    expect(new LocalModelSha256V1().update(view).digestHex()).toBe(nodeDigest(bytes));
    expect(streamDigest(view, [13, 64, 1, 55])).toBe(nodeDigest(bytes));

    const hasher = new LocalModelSha256V1();
    hasher.update(view.subarray(0, 13));
    view.fill(0, 0, 13);
    hasher.update(view.subarray(13));
    view.fill(0);
    expect(hasher.digestHex()).toBe(nodeDigest(bytes));
  });

  it('returns a cached digest and rejects all updates after finalization', () => {
    const hasher = new LocalModelSha256V1();
    expect(hasher.update(Uint8Array.of(0x61, 0x62, 0x63))).toBe(hasher);
    expect(hasher.digestHex()).toBe(ABC_SHA256);
    expect(hasher.digestHex()).toBe(ABC_SHA256);
    expect(() => hasher.update(new Uint8Array())).toThrow(/already finalized/);
    expect(() => hasher.update(Uint8Array.of(0x64))).toThrow(/already finalized/);
    expect(hasher.digestHex()).toBe(ABC_SHA256);
  });

  it('rejects a byte-count overflow before consuming any of the rejected chunk', () => {
    const hasher = new LocalModelSha256V1();
    // A synthetic counter exercises the unreachable-size guard without allocating petabytes.
    const counter = hasher as unknown as { totalBytes: number };
    const limit = Math.floor(Number.MAX_SAFE_INTEGER / 8);
    counter.totalBytes = limit - 1;
    expect(hasher.update(Uint8Array.of(0x61))).toBe(hasher);
    expect(counter.totalBytes).toBe(limit);
    expect(hasher.update(new Uint8Array())).toBe(hasher);
    expect(() => hasher.update(Uint8Array.of(0x62))).toThrow(/safe bit-length limit/);
    expect(counter.totalBytes).toBe(limit);
    counter.totalBytes = 1;
    expect(hasher.digestHex()).toBe(nodeDigest(Uint8Array.of(0x61)));
  });

  it('makes the same digest assertion reject altered bytes and a corrupt expected digest', () => {
    const original = fixture(129);
    const expected = nodeDigest(original);
    const assertMatches = (bytes: Uint8Array, digest: string) => {
      expect(streamDigest(bytes, [55, 1, 64, 9])).toBe(digest);
    };
    assertMatches(original, expected);
    const altered = original.slice();
    altered[64] = altered[64]! ^ 0x01;
    expect(() => assertMatches(altered, expected)).toThrow();
    const corruptExpected = `${expected[0] === '0' ? '1' : '0'}${expected.slice(1)}`;
    expect(() => assertMatches(original, corruptExpected)).toThrow();
    assertMatches(original, expected);
  });
});
