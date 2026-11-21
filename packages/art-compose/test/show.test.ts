import { describe, expect, it } from 'vitest';
import { PIXEL_CHARS } from '@cf/art-format';
import { hashBuffer, rimPixels, showColours, type PixelBuffer } from '@cf/art-compose';

/** Rows of pixel characters ('.' is 0) as a buffer. */
const bufferOf = (rows: readonly string[]): PixelBuffer => ({
  w: (rows[0] as string).length, h: rows.length, pixels: Uint8Array.from(rows.join('').split('').map((c) => PIXEL_CHARS.indexOf(c))),
});
/** A 0/1 array as rows of '.' and '#'. */
const marked = (b: PixelBuffer, m: Uint8Array): string[] =>
  Array.from({ length: b.h }, (_, y) => Array.from(m.subarray(y * b.w, (y + 1) * b.w), (v) => (v === 1 ? '#' : v === 0 ? '.' : '?')).join(''));
/** A table whose entry v is v * 0x010101 + 0x000100, so every value has its own colour. */
const TABLE = Array.from({ length: 21 }, (_, v) => v * 0x010101 + 0x000100);

describe('rimPixels', () => {
  it('rimPixels marks the top and left edge of a block, and nothing inside it', () => {
    // A finished block: outline 16 ('g') round ramp pixels, on a transparent canvas.
    const b = bufferOf([
      '.......',
      '.gggg..',
      'g4321g.',
      'g3215g.',
      'g219cg.',
      '.gggg..',
    ]);
    expect(marked(b, rimPixels(b))).toEqual([
      '.......',
      '.......',
      '.####..',
      '.#.....',
      '.#.....', // 'c' (12) is inside; no pixel below the top row and right of the left column is marked
      '.......',
    ]);
  });

  it('counts the canvas edge as clear, and never marks 0 or 13 to 20', () => {
    const b = bufferOf(['1def', 'ghij', '2k3.']);
    // (0,0) 1 has both neighbours off the canvas; (0,2) 2 has 16 above; (2,2) 3 has 20 to its left and 18 above: not clear.
    expect(marked(b, rimPixels(b))).toEqual(['#...', '....', '#...']);
    // (1,1) has only its left neighbour clear in the first, only its upper neighbour clear in the second: a rim pixel both times.
    expect(marked(bufferOf(['11', '.1']), rimPixels(bufferOf(['11', '.1'])))).toEqual(['##', '.#']);
    expect(marked(bufferOf(['1.', '11']), rimPixels(bufferOf(['1.', '11'])))).toEqual(['#.', '##']);
  });

  it('leaves the buffer and its hash unchanged, and gives the same answer twice', () => {
    const b = bufferOf(['..g..', '.g3g.', 'g345g', '.g9g.', '..g..']);
    const before = hashBuffer(b);
    const copy = b.pixels.slice();
    const first = rimPixels(b);
    expect(b.pixels).toEqual(copy);
    expect(hashBuffer(b)).toBe(before);
    expect(rimPixels(b)).toEqual(first);
    expect(first).not.toBe(rimPixels(b));
  });
});

describe('showColours', () => {
  it('percent 0 is the plain table lookup', () => {
    const b = bufferOf(['.g12', '9cdk']);
    const out = showColours(b, TABLE, { colour: 0xffffff, percent: 0 });
    expect(Array.from(out)).toEqual(Array.from(b.pixels, (v) => TABLE[v]));
  });

  it('adds the rim colour only on rim pixels', () => {
    // Row 0: 16, then 1 (16 to its left: rim). Row 1: 0, then 2 (0 to its left: rim). Rows 2 and 3: 1s, whose
    // right-hand pixels have drawn pixels above and to the left: not rim.
    const b = bufferOf(['g1', '.2', '11', '11']);
    const out = Array.from(showColours(b, TABLE, { colour: 0x020406, percent: 50 }));
    expect(out).toEqual([TABLE[16], TABLE[1]! + 0x010203, TABLE[0], TABLE[2]! + 0x010203, TABLE[1]! + 0x010203, TABLE[1], TABLE[1]! + 0x010203, TABLE[1]]);
  });

  it('showColours adds the rim colour at 50 and 75 percent, clamped', () => {
    // A single rim pixel of value 1, each channel the same, against every colour and rim channel value.
    const b = bufferOf(['1']);
    for (const percent of [50, 75] as const) {
      const bad: string[] = [];
      for (let c = 0; c < 256; c++) {
        const table = [0, c * 0x010101];
        for (let r = 0; r < 256; r++) {
          const want = Math.min(255, c + Math.round((r * percent) / 100));
          const got = showColours(b, table, { colour: r * 0x010101, percent })[0]!;
          if (got !== want * 0x010101) bad.push(`${percent} c=${c} r=${r} got ${got.toString(16)} want ${want}`);
        }
      }
      expect(bad).toEqual([]);
    }
  });
});
