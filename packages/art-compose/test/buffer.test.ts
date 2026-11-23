import { describe, expect, it } from 'vitest';
import { TIER_SIZE, type PartFrame, type SizeTier } from '@cf/art-format';
import { blit, createBuffer, hashBuffer, toAscii, type PixelBuffer } from '@cf/art-compose';

function frameOf(w: number, h: number, values: number[], anchor: [number, number]): PartFrame {
  return { w, h, pixels: Uint8Array.from(values), anchor, attach: {} };
}

// Independent FNV-1a (BigInt arithmetic, no Math.imul) used to cross-check hashBuffer.
function referenceHash(w: number, h: number, pixels: Uint8Array): string {
  const bytes = [(w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w & 255, (h >> 24) & 255, (h >> 16) & 255, (h >> 8) & 255, h & 255, ...pixels];
  let hash = 0x811c9dc5n;
  for (const b of bytes) hash = ((hash ^ BigInt(b)) * 0x01000193n) % 0x100000000n;
  return hash.toString(16).padStart(8, '0');
}

describe('createBuffer', () => {
  it.each(Object.keys(TIER_SIZE) as SizeTier[])('has the %s tier size and starts transparent', (tier) => {
    const [w, h] = TIER_SIZE[tier];
    const b = createBuffer(tier);
    expect([b.w, b.h, b.pixels.length]).toEqual([w, h, w * h]);
    expect(b.pixels.every((p) => p === 0)).toBe(true);
  });
});

describe('blit', () => {
  it('sets exactly the four pixels of a 2x2 frame at (1,1)', () => {
    const b = createBuffer('small');
    blit(b, frameOf(2, 2, [1, 2, 3, 4], [0, 0]), 1, 1);
    const expected = new Uint8Array(48 * 32);
    expected[1 * 48 + 1] = 1;
    expected[1 * 48 + 2] = 2;
    expected[2 * 48 + 1] = 3;
    expected[2 * 48 + 2] = 4;
    expect(b.pixels).toEqual(expected);
  });

  it('lands the anchor pixel on (x, y)', () => {
    const b = createBuffer('small');
    blit(b, frameOf(3, 3, [0, 0, 0, 0, 7, 0, 0, 0, 0], [1, 1]), 20, 10);
    expect(b.pixels[10 * 48 + 20]).toBe(7);
    expect(b.pixels.reduce((n, p) => n + (p === 0 ? 0 : 1), 0)).toBe(1);
  });

  it('leaves the target unchanged under transparent source pixels', () => {
    const b = createBuffer('small');
    b.pixels[1 * 48 + 1] = 9;
    b.pixels[1 * 48 + 2] = 9;
    blit(b, frameOf(2, 2, [0, 5, 0, 6], [0, 0]), 1, 1);
    expect(b.pixels[1 * 48 + 1]).toBe(9);
    expect(b.pixels[1 * 48 + 2]).toBe(5);
    expect(b.pixels[2 * 48 + 1]).toBe(0);
    expect(b.pixels[2 * 48 + 2]).toBe(6);
  });

  it('mirror reverses each row about the anchor column', () => {
    const b = createBuffer('small');
    // anchor at column 1: frame column 0 lands right of x, column 2 lands left of x
    blit(b, frameOf(3, 2, [1, 2, 3, 4, 5, 6], [1, 0]), 10, 5, true);
    const row = (y: number) => Array.from(b.pixels.slice(y * 48 + 9, y * 48 + 12));
    expect(row(5)).toEqual([3, 2, 1]);
    expect(row(6)).toEqual([6, 5, 4]);
    expect(b.pixels.reduce((n, p) => n + (p === 0 ? 0 : 1), 0)).toBe(6);
  });

  // 3x3 frame, anchor in the centre:  1 2 3 / 4 5 6 / 7 8 9
  const frame = frameOf(3, 3, [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 1]);
  type Case = [string, number, number, boolean, Array<[number, number, number]>];
  const cases: Case[] = [
    ['left edge', 0, 10, false, [[0, 9, 2], [0, 10, 5], [0, 11, 8], [1, 9, 3], [1, 10, 6], [1, 11, 9]]],
    ['left edge mirrored', 0, 10, true, [[0, 9, 2], [0, 10, 5], [0, 11, 8], [1, 9, 1], [1, 10, 4], [1, 11, 7]]],
    ['right edge', 47, 10, false, [[46, 9, 1], [46, 10, 4], [46, 11, 7], [47, 9, 2], [47, 10, 5], [47, 11, 8]]],
    ['right edge mirrored', 47, 10, true, [[46, 9, 3], [46, 10, 6], [46, 11, 9], [47, 9, 2], [47, 10, 5], [47, 11, 8]]],
    ['top edge', 10, 0, false, [[9, 0, 4], [10, 0, 5], [11, 0, 6], [9, 1, 7], [10, 1, 8], [11, 1, 9]]],
    ['top edge mirrored', 10, 0, true, [[9, 0, 6], [10, 0, 5], [11, 0, 4], [9, 1, 9], [10, 1, 8], [11, 1, 7]]],
    ['bottom edge', 10, 31, false, [[9, 30, 1], [10, 30, 2], [11, 30, 3], [9, 31, 4], [10, 31, 5], [11, 31, 6]]],
    ['bottom edge mirrored', 10, 31, true, [[9, 30, 3], [10, 30, 2], [11, 30, 1], [9, 31, 6], [10, 31, 5], [11, 31, 4]]],
    ['top-left corner', 0, 0, false, [[0, 0, 5], [1, 0, 6], [0, 1, 8], [1, 1, 9]]],
    ['top-left corner mirrored', 0, 0, true, [[0, 0, 5], [1, 0, 4], [0, 1, 8], [1, 1, 7]]],
    ['bottom-right corner', 47, 31, false, [[46, 30, 1], [47, 30, 2], [46, 31, 4], [47, 31, 5]]],
    ['bottom-right corner mirrored', 47, 31, true, [[46, 30, 3], [47, 30, 2], [46, 31, 6], [47, 31, 5]]],
    ['fully outside', -5, -5, false, []],
    ['fully outside far', 60, 40, true, []],
  ];
  it.each(cases)('clips at the %s without wrapping', (_name, x, y, mirror, written) => {
    const b = createBuffer('small');
    blit(b, frame, x, y, mirror);
    const expected = new Uint8Array(48 * 32);
    for (const [px, py, v] of written) expected[py * 48 + px] = v;
    expect(b.pixels).toEqual(expected);
  });
});

describe('hashBuffer', () => {
  it('hashes an empty medium buffer to a fixed literal', () => {
    const b = createBuffer('medium');
    expect(hashBuffer(b)).toBe('64fee505');
    expect(referenceHash(b.w, b.h, b.pixels)).toBe('64fee505');
  });
  it('matches the independent reference on a patterned buffer', () => {
    const b = createBuffer('small');
    for (let i = 0; i < b.pixels.length; i++) b.pixels[i] = (i * 7) % 17;
    expect(hashBuffer(b)).toBe(referenceHash(b.w, b.h, b.pixels));
    expect(hashBuffer(b)).toMatch(/^[0-9a-f]{8}$/);
  });
  it('changes when one pixel changes', () => {
    const a = createBuffer('small');
    const b = createBuffer('small');
    b.pixels[100] = 1;
    expect(hashBuffer(a)).not.toBe(hashBuffer(b));
  });
  it('is the same for a picture whose values all fit a byte, whatever holds them', () => {
    const b = createBuffer('small');
    for (let i = 0; i < b.pixels.length; i++) b.pixels[i] = (i * 7) % 256;
    expect(hashBuffer({ w: b.w, h: b.h, pixels: Uint32Array.from(b.pixels) })).toBe(hashBuffer(b));
  });
  it('takes a value above 255 whole, in one step: it is not its low byte, nor its bytes in turn', () => {
    // Worked by hand in BigInt: the eight size bytes, then each value in one step.
    let hash = 0x811c9dc5n;
    for (const value of [0, 0, 0, 2, 0, 0, 0, 1, 5000, 3]) hash = ((hash ^ BigInt(value)) * 0x01000193n) % 0x100000000n;
    const wide = hashBuffer({ w: 2, h: 1, pixels: Uint32Array.of(5000, 3) });
    expect(wide).toBe(hash.toString(16).padStart(8, '0'));
    expect(wide).not.toBe(hashBuffer({ w: 2, h: 1, pixels: Uint32Array.of(5000 & 255, 3) }));
    expect(wide).not.toBe(hashBuffer({ w: 2, h: 1, pixels: Uint32Array.of(5000 >> 8, 5000 & 255, 3) }));
    expect(hashBuffer({ w: 2, h: 1, pixels: Uint32Array.of(16777215, 3) })).not.toBe(wide);
  });
  it('differs for equal pixels at different sizes', () => {
    const a: PixelBuffer = { w: 4, h: 6, pixels: new Uint8Array(24) };
    const b: PixelBuffer = { w: 6, h: 4, pixels: new Uint8Array(24) };
    expect(hashBuffer(a)).not.toBe(hashBuffer(b));
  });
});

describe('blit with iris', () => {
  const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  it('writes 5-8 as 17-20 and leaves 1-4 and 9-15 alone', () => {
    const b = createBuffer('small');
    blit(b, frameOf(15, 1, all, [0, 0]), 0, 0, false, true);
    expect([...b.pixels.slice(0, 15)]).toEqual([1, 2, 3, 4, 17, 18, 19, 20, 9, 10, 11, 12, 13, 14, 15]);
  });
  it('without iris leaves 5-8 alone', () => {
    const b = createBuffer('small');
    blit(b, frameOf(15, 1, all, [0, 0]), 0, 0);
    expect([...b.pixels.slice(0, 15)]).toEqual(all);
  });
  it('writes the same values when mirrored', () => {
    const b = createBuffer('small');
    blit(b, frameOf(2, 1, [5, 8], [0, 0]), 5, 0, true, true);
    expect([b.pixels[5], b.pixels[4]]).toEqual([17, 20]);
  });
});

describe('toAscii', () => {
  it('writes one line per row with the part-text characters', () => {
    const b: PixelBuffer = { w: 4, h: 1, pixels: Uint8Array.from([17, 20, 28, 29]) };
    expect(toAscii(b)).toBe('hks?');
  });
});
