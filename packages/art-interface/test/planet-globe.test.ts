import { describe, expect, it } from 'vitest';
import { LEAN_SINE, SINE, globePoints, globeTable, type GlobeTable } from '../src/index';

/** The two globes the kits are made for: its width, and its map's width and height. */
const SIZES = [[129, 384, 128], [65, 192, 64]] as const;
const at = (t: GlobeTable, dx: number, dy: number): number => (dy + ((t.side - 1) >> 1)) * t.side + dx + ((t.side - 1) >> 1);
/** A pixel's column as steps east (or, below 0, west) of the meridian at the globe's middle. */
const east = (t: GlobeTable, i: number): number => ((t.col[i]! + t.mapW / 2) % t.mapW) - t.mapW / 2;

/** The artist's projector in fractions, with no viewing latitude: where the pixel (dx, dy) of a globe leaning `tilt`
 *  degrees reads its map, as [row, steps east]. */
function projected(side: number, mapW: number, mapH: number, tilt: number, dx: number, dy: number): [number, number, number, number] {
  const [x, y] = [dx / (side / 2), dy / (side / 2)];
  const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
  const a = (tilt * Math.PI) / 180;
  const u = x * Math.cos(a) + y * Math.sin(a);
  const v = -x * Math.sin(a) + y * Math.cos(a);
  const row = Math.min(mapH - 1, Math.max(0, Math.floor((0.5 + Math.asin(Math.min(1, Math.max(-1, v))) / Math.PI) * mapH)));
  return [row, Math.floor((Math.atan2(u, z) / (2 * Math.PI)) * mapW), (0.5 + Math.asin(Math.min(1, Math.max(-1, v))) / Math.PI) * mapH, (Math.atan2(u, z) / (2 * Math.PI)) * mapW];
}
/** True when a place on the map lies within a hundredth of a row or a step of the line between two. */
const onLine = (place: number): boolean => Math.abs(place - Math.round(place)) < 0.01;
/** How many pixels of a table differ from the projector in fractions, and the widest difference in rows or steps,
 *  counting a difference of more than one only in the three rows at either pole, where a pixel spans many columns.
 *  With `clear`, pixels the projector puts on the line between two rows or steps are left out: there the fractions
 *  and the 65536ths may each fall either way. */
function apart(t: GlobeTable, tilt: number, clear = false): { count: number; widest: number; awayFromPole: number } {
  const r = (t.side - 1) >> 1;
  let [count, widest, awayFromPole] = [0, 0, 0];
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const i = at(t, dx, dy);
      if (t.row[i]! < 0) continue;
      const [row, step, rowAt, stepAt] = projected(t.side, t.mapW, t.mapH, tilt, dx, dy);
      if (clear && (onLine(rowAt) || onLine(stepAt))) continue;
      const far = Math.max(Math.abs(t.row[i]! - row), Math.abs(east(t, i) - step));
      if (far > 0) count++;
      widest = Math.max(widest, far);
      if (far > 1 && row > 2 && row < t.mapH - 3) awayFromPole++;
    }
  }
  return { count, widest, awayFromPole };
}

describe('the sine tables', () => {
  it('SINE is a quarter wave in 192 steps and LEAN_SINE one in 90 degrees, each value the nearest 65536th', () => {
    expect(SINE).toHaveLength(193);
    expect(LEAN_SINE).toHaveLength(91);
    SINE.forEach((value, k) => expect(value).toBe(Math.round(65536 * Math.sin((k * Math.PI) / 384))));
    LEAN_SINE.forEach((value, k) => expect(value).toBe(Math.round(65536 * Math.sin((k * Math.PI) / 180))));
  });
  it('each rises all the way, and a value squared and its fellow squared are within 2^17 of 2^32', () => {
    for (const table of [SINE, LEAN_SINE]) {
      const last = table.length - 1;
      expect([table[0], table[last]]).toEqual([0, 65536]);
      for (let k = 1; k <= last; k++) expect(table[k]!).toBeGreaterThan(table[k - 1]!);
      for (let k = 0; k <= last; k++) expect(Math.abs(table[k]! * table[k]! + table[last - k]! * table[last - k]! - 2 ** 32)).toBeLessThanOrEqual(2 ** 17);
    }
  });
});

describe('a globe\'s table of map rows and columns', () => {
  it('its disc is the painter\'s disc, at both sizes and at any lean', () => {
    for (const [width, mapW, mapH] of SIZES) {
      const points = globePoints((width - 1) >> 1);
      for (const tilt of [0, 1, 14, -23, 45, -67, 89, 90, -90]) {
        const t = globeTable(width, mapW, mapH, tilt);
        expect([t.side, t.mapW, t.mapH, t.row.length, t.col.length]).toEqual([width, mapW, mapH, width * width, width * width]);
        for (let i = 0; i < width * width; i++) {
          expect(t.row[i]! >= 0).toBe(points.on[i] === 1);
          expect(t.col[i]! >= 0).toBe(points.on[i] === 1);
          if (points.on[i] === 1) expect(t.row[i]! < mapH && t.col[i]! < mapW).toBe(true);
          else expect([t.row[i], t.col[i]]).toEqual([-1, -1]);
        }
      }
    }
  });
  it('holds from the narrowest globe to the widest, and at the two smaller tiers: the painter\'s disc, every row and column on the map', () => {
    for (const [width, mapW, mapH] of [[3, 384, 128], [17, 48, 16], [33, 96, 32], [511, 384, 128], [511, 768, 384]] as const) {
      const points = globePoints((width - 1) >> 1);
      for (const tilt of [0, 37, -90]) {
        const t = globeTable(width, mapW, mapH, tilt);
        let bad = 0;
        for (let i = 0; i < width * width; i++) {
          const on = points.on[i] === 1;
          if (on ? !(t.row[i]! >= 0 && t.row[i]! < mapH && t.col[i]! >= 0 && t.col[i]! < mapW) : !(t.row[i] === -1 && t.col[i] === -1)) bad++;
        }
        expect(bad).toBe(0);
        if (width > 3) expect(apart(t, tilt, true).awayFromPole).toBe(0);
      }
    }
    expect(() => globeTable(513, 384, 128, 0)).toThrow('a globe is an odd number of pixels wide, from 3 to 511, not 513');
  });
  it('upright, a screen row reads one map row, the rows run north to south, and each is mirrored about the middle and never falls left to right', () => {
    for (const [width, mapW, mapH] of SIZES) {
      const t = globeTable(width, mapW, mapH, 0);
      const r = (width - 1) >> 1;
      let before = -1;
      for (let dy = -r; dy <= r; dy++) {
        const row = t.row[at(t, 0, dy)]!;
        expect(row).toBeGreaterThanOrEqual(before);
        before = row;
        expect(east(t, at(t, 0, dy))).toBe(0);
        for (let dx = 1; dx <= r && t.row[at(t, dx, dy)]! >= 0; dx++) {
          expect([t.row[at(t, dx, dy)], t.row[at(t, -dx, dy)]]).toEqual([row, row]);
          expect(east(t, at(t, -dx, dy))).toBe(-1 - east(t, at(t, dx, dy)));
          expect(east(t, at(t, dx, dy))).toBeGreaterThanOrEqual(east(t, at(t, dx - 1, dy)));
        }
      }
      // Rows are even in latitude: the topmost pixel's middle is 83 degrees north at 129 wide and 80 at 65 wide.
      expect([t.row[at(t, 0, -r)], t.row[at(t, 0, 0)], t.row[at(t, 0, r)]]).toEqual(width === 129 ? [5, 64, 122] : [3, 32, 60]);
    }
  });
  it('the middle row spans half the map as a ball shows it: halfway to the rim is a third of the way round', () => {
    const big = globeTable(129, 384, 128, 0);
    const small = globeTable(65, 192, 64, 0);
    // 32 of 64.5 pixels out is 29.7 degrees round, of 0.9375 a step; the rim pixel is 82.9 degrees round.
    expect([east(big, at(big, 32, 0)), east(big, at(big, 64, 0)), east(big, at(big, -64, 0))]).toEqual([31, 88, -89]);
    expect([east(small, at(small, 16, 0)), east(small, at(small, 32, 0)), east(small, at(small, -32, 0))]).toEqual([15, 42, -43]);
    for (const t of [big, small]) {
      const r = (t.side - 1) >> 1;
      for (let dx = -r; dx <= r; dx++) {
        expect(Math.abs(2 * east(t, at(t, dx, 0)) + 1)).toBeLessThan(t.mapW / 2);
        expect(east(t, at(t, dx, 0))).toBe(projected(t.side, t.mapW, t.mapH, 0, dx, 0)[1]);
      }
    }
  });
  it('upright it is the artist\'s projector in fractions at every pixel that is clear of a line between two rows or steps', () => {
    for (const [width, mapW, mapH] of SIZES) expect(apart(globeTable(width, mapW, mapH, 0), 0, true)).toEqual({ count: 0, widest: 0, awayFromPole: 0 });
  });
  it('at every whole lean from 90 one way to 90 the other it is that projector, but for a pixel or two a hair from a line', () => {
    for (let tilt = -90; tilt <= 90; tilt++) {
      const small = apart(globeTable(65, 192, 64, tilt), tilt, true);
      expect(small.count).toBeLessThanOrEqual(2);
      expect(small.widest).toBeLessThanOrEqual(1);
      const big = apart(globeTable(129, 384, 128, tilt), tilt, true);
      expect(big.count).toBeLessThanOrEqual(8);
      expect(big.widest).toBeLessThanOrEqual(4);
      expect(big.awayFromPole).toBe(0);
    }
  });
  it('a lean of 90 degrees is the upright table turned a quarter, either way', () => {
    for (const [width, mapW, mapH] of SIZES) {
      const [up, right, left] = [globeTable(width, mapW, mapH, 0), globeTable(width, mapW, mapH, 90), globeTable(width, mapW, mapH, -90)];
      const r = (width - 1) >> 1;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          expect([right.row[at(right, dx, dy)], right.col[at(right, dx, dy)]]).toEqual([up.row[at(up, dy, -dx)], up.col[at(up, dy, -dx)]]);
          expect([left.row[at(left, dx, dy)], left.col[at(left, dx, dy)]]).toEqual([up.row[at(up, -dy, dx)], up.col[at(up, -dy, dx)]]);
        }
      }
    }
  });
  it('a lean above 0 tips the north pole to the right, and one below 0 to the left', () => {
    const [right, left] = [globeTable(129, 384, 128, 30), globeTable(129, 384, 128, -30)];
    expect(right.row[at(right, 32, -55)]).toBeLessThanOrEqual(6);
    expect(left.row[at(left, -32, -55)]).toBeLessThanOrEqual(6);
    expect(right.row[at(right, -32, -55)]).toBeGreaterThan(20);
    expect(right.row[at(right, -32, 55)]).toBeGreaterThanOrEqual(121);
  });
  it('a map of half the size reads every second row and column of the same globe', () => {
    for (const tilt of [0, 17, -90]) {
      const [full, half] = [globeTable(129, 384, 128, tilt), globeTable(129, 192, 64, tilt)];
      for (let i = 0; i < 129 * 129; i++) {
        if (full.row[i]! < 0) continue;
        expect(half.row[i]).toBe(full.row[i]! >> 1);
        expect(east(half, i)).toBe(east(full, i) >> 1);
      }
    }
  });
  it('refuses a width that is not odd, a map no whole number of table steps fits, and a lean that is not whole or past 90', () => {
    expect(() => globeTable(128, 384, 128, 0)).toThrow('a globe is an odd number of pixels wide, from 3 to 511, not 128');
    expect(() => globeTable(129, 400, 128, 0)).toThrow('a map 400 wide does not fit the sine table: its width divides 768');
    expect(() => globeTable(129, 384, 100, 0)).toThrow('a map 100 high does not fit the sine table: its height divides 384');
    expect(() => globeTable(129, 384, 128, 91)).toThrow('a globe leans a whole number of degrees, 90 at most either way, not 91');
    expect(() => globeTable(129, 384, 128, 0.5)).toThrow('a globe leans a whole number of degrees, 90 at most either way, not 0.5');
  });
});
