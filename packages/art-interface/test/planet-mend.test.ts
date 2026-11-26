import { describe, expect, it } from 'vitest';
import { loneRuns, mendMap } from '../src/index';

const counter = (seed: number) => () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 8;
const seeded = (w: number, h: number, seed: number, least: number, most: number): Uint8Array => {
  const next = counter(seed);
  return Uint8Array.from({ length: w * h }, () => least + (next() % (most - least + 1)));
};
const row = (text: string): Uint8Array => Uint8Array.from(text, (c) => Number(c));

describe('the one-pixel runs of a wrapped map', () => {
  it('are counted along each row, the run across the seam as one', () => {
    expect(loneRuns(row('1122211'), 7, 1)).toBe(0);
    expect(loneRuns(row('1121211'), 7, 1)).toBe(3);
    // The value at each end is one run of two across the seam; the 1 beside it in the second row stands alone.
    expect(loneRuns(row('1223331'), 7, 1)).toBe(0);
    expect(loneRuns(row('1133322'.concat('2233312')), 7, 2)).toBe(1);
    // A pixel alone at each edge: two runs of one, side by side across the seam.
    expect(loneRuns(row('2113331'), 7, 1)).toBe(2);
    expect(loneRuns(row('1111111'), 7, 1)).toBe(0);
    expect(loneRuns(row('12'), 2, 1)).toBe(2);
    expect(loneRuns(row('1212'), 4, 1)).toBe(4);
    // A run is along a row: a pixel alone in its column is no run of one.
    expect(loneRuns(row('111'.concat('222', '111')), 3, 3)).toBe(0);
  });
});

describe('a wrapped map mended', () => {
  it('has no run of one pixel left in any row, the seam included, whatever it began as', () => {
    for (const [w, h, seed, least, most] of [[384, 128, 1, 1, 16], [192, 64, 2, 1, 16], [384, 128, 3, 0, 1], [192, 64, 4, 0, 3], [96, 32, 5, 1, 2], [7, 9, 6, 1, 3], [2, 5, 7, 1, 2], [3, 5, 8, 1, 3]] as const) {
      const values = seeded(w, h, seed, least, most);
      expect(loneRuns(values, w, h)).toBeGreaterThan(0);
      mendMap(values, w, h);
      expect(loneRuns(values, w, h)).toBe(0);
    }
    for (const text of ['1212121212', '1231231231', '1211111112', '2111111111', '1111111112', '1213141516']) {
      const values = row(text);
      mendMap(values, text.length, 1);
      expect(loneRuns(values, text.length, 1)).toBe(0);
    }
  });
  it('rewrites only pixels that stood alone in their row, each to the value beside it, and says how many', () => {
    for (const seed of [11, 12, 13]) {
      const before = seeded(192, 64, seed, 1, 4);
      const after = before.slice();
      const rewritten = mendMap(after, 192, 64);
      let changed = 0;
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 192; x++) {
          const i = y * 192 + x;
          if (after[i] === before[i]) continue;
          changed++;
          const [west, east] = [y * 192 + ((x + 191) % 192), y * 192 + ((x + 1) % 192)];
          expect(before[west] !== before[i] && before[east] !== before[i]).toBe(true);
          expect(after[i] === after[west] || after[i] === after[east]).toBe(true);
        }
      }
      expect(rewritten).toBe(changed);
      expect(changed).toBeGreaterThan(1000);
    }
  });
  it('leaves a map with no run of one as it is, and mends the same map the same way', () => {
    const kept = row('1122233'.concat('3311122'));
    expect(mendMap(kept, 7, 2)).toBe(0);
    expect(kept).toEqual(row('1122233'.concat('3311122')));
    const [one, other] = [seeded(384, 128, 21, 1, 16), seeded(384, 128, 21, 1, 16)];
    mendMap(one, 384, 128);
    mendMap(other, 384, 128);
    expect(one).toEqual(other);
    expect(mendMap(one, 384, 128)).toBe(0);
  });
  it('a pixel alone between two of one value joins them; between two values it joins the one the row above or below continues', () => {
    const joined = row('1121133');
    mendMap(joined, 7, 1);
    expect(joined).toEqual(row('1111133'));
    // The lone 5 has 1 to its west and 2 to its east; the row above holds 2 over it, the row below 1.
    const above = row('1122222'.concat('1115222', '3333333'));
    mendMap(above, 7, 3);
    expect(above.slice(7, 14)).toEqual(row('1112222'));
    const below = row('3333333'.concat('1115222', '1111122'));
    mendMap(below, 7, 3);
    expect(below.slice(7, 14)).toEqual(row('1111222'));
    const neither = row('3333333'.concat('1115222', '4444444'));
    mendMap(neither, 7, 3);
    expect(neither.slice(7, 14)).toEqual(row('1111222'));
  });
  it('mends across the seam: a pixel alone at either edge takes its neighbour on the far side into account', () => {
    const west = row('2111133');
    mendMap(west, 7, 1);
    expect(west).toEqual(row('3111133'));
    const east = row('1122332');
    mendMap(east, 7, 1);
    expect(east).toEqual(row('1122333'));
    // Not alone: the 1 at each edge is one run of two across the seam.
    const whole = row('1223331');
    expect(mendMap(whole, 7, 1)).toBe(0);
  });
  it('treats clear as a value: a gap one pixel wide in a cloud closes, and a cloud one pixel wide goes', () => {
    const clouds = row('0011011000100'.concat('0000000000000'));
    mendMap(clouds, 13, 2);
    expect(clouds.slice(0, 13)).toEqual(row('0011111000000'));
  });
  it('refuses a map that is not as long as its width times its height', () => {
    expect(() => mendMap(new Uint8Array(10), 4, 3)).toThrow('a map 4 by 3 holds 12 values, not 10');
    expect(() => loneRuns(new Uint8Array(10), 4, 3)).toThrow('a map 4 by 3 holds 12 values, not 10');
  });
});
