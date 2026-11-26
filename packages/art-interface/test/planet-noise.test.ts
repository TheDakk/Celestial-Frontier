import { describe, expect, it } from 'vitest';
import { testInterfaceSheetText } from '@cf/art-testparts';
import { globePoints, noise3, paintSpace, parseInterfaceSheet, quotient, type Gaps } from '../src/index';

/** A plain seeded counter for the tests: whole numbers below 2^32. */
const counter = (seed: number) => () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0);
/** A coordinate within 2^24 either side of 0: six octaves keep it under 2^31. */
const place = (next: () => number): number => (next() | 0) >> 7;

describe('whole-number noise', () => {
  it('is a whole number from 0 to 65535 at 100,000 seeded places, with 1 to 6 octaves', () => {
    const next = counter(7);
    let bad = 0;
    for (let i = 0; i < 100_000; i++) {
      const v = noise3(next(), place(next), place(next), place(next), 1 + (i % 6));
      if (!Number.isInteger(v) || v < 0 || v > 65535) bad++;
    }
    expect(bad).toBe(0);
    for (const seed of [0, 0xffffffff]) for (const far of [-(2 ** 24), 2 ** 24]) expect(noise3(seed, far, far, far, 6)).toBeLessThanOrEqual(65535);
  });
  it('is smooth: 256 apart it moves by less than 2,000; a whole cell apart, by more for most places', () => {
    const next = counter(11);
    let rough = 0;
    let moved = 0;
    for (let i = 0; i < 1000; i++) {
      const [seed, x, y, z] = [next(), place(next), place(next), place(next)];
      if (Math.abs(noise3(seed, x + 256, y, z, 4) - noise3(seed, x, y, z, 4)) >= 2000) rough++;
      if (Math.abs(noise3(seed, x + 65536, y, z, 4) - noise3(seed, x, y, z, 4)) > 2000) moved++;
    }
    expect(rough).toBe(0);
    expect(moved).toBeGreaterThan(500);
  });
  it('one seed and place give one value; another seed gives another field', () => {
    const next = counter(13);
    let differ = 0;
    for (let i = 0; i < 1000; i++) {
      const [x, y, z] = [place(next), place(next), place(next)];
      expect(noise3(1, x, y, z, 4)).toBe(noise3(1, x, y, z, 4));
      if (noise3(1, x, y, z, 4) !== noise3(2, x, y, z, 4)) differ++;
    }
    expect(differ).toBeGreaterThan(900);
  });
  it('an octave of one seed is not the first octave of the next seed', () => {
    const next = counter(19);
    let same = 0;
    for (let i = 0; i < 1000; i++) {
      const [x, y, z] = [place(next), place(next), place(next)];
      const second = noise3(2, x, y, z, 2) - noise3(2, x, y, z, 1);
      if (second === noise3(3, 2 * x, 2 * y, 2 * z, 1) >> 1) same++;
    }
    expect(same).toBeLessThan(100);
  });
  it('the next seed is not the same field mirrored inside each cell', () => {
    const next = counter(23);
    let close = 0;
    for (let i = 0; i < 1000; i++) {
      const [x, y, z] = [place(next) & ~0x10000, place(next), place(next)];
      const mirrored = (x & ~0xffff) + (0xffff - (x & 0xffff));
      if (Math.abs(noise3(3, x, y, z, 1) - noise3(2, mirrored, y, z, 1)) < 600) close++;
    }
    expect(close).toBeLessThan(250);
  });
});

describe('a globe in whole numbers', () => {
  it('quotient is the whole part of a division, for 10,000 pairs', () => {
    const next = counter(17);
    for (let i = 0; i < 10_000; i++) {
      const [a, b] = [next() >>> 1, 1 + (next() % 70_000)];
      expect(quotient(a, b)).toBe(Math.floor(a / b));
    }
    expect(quotient(2 ** 31 - 1, 1)).toBe(2 ** 31 - 1);
  });
  it('covers exactly the pixels the painter fills for a disc, for every radius from 1 to 100', () => {
    const sheet = parseInterfaceSheet(testInterfaceSheetText());
    const gaps: Gaps = { glyphs: [], icons: [], elements: [] };
    for (let r = 1; r <= 100; r++) {
      const side = 2 * r + 1;
      const painted = paintSpace(side, side, [{ kind: 'disc', x: r, y: r, r, bands: [0xffffff] }], sheet, gaps).pixels;
      const points = globePoints(r);
      expect(points.side).toBe(side);
      for (let i = 0; i < side * side; i++) expect(points.on[i] === 1).toBe(painted[i] !== 0);
    }
  });
  it('every point is on or inside the ball, and the middle faces the eye', () => {
    for (const r of [1, 8, 64, 96]) {
      const p = globePoints(r);
      for (let i = 0; i < p.on.length; i++) {
        if (p.on[i] !== 1) { expect([p.x[i], p.y[i], p.z[i]]).toEqual([0, 0, 0]); continue; }
        expect(Math.max(Math.abs(p.x[i]!), Math.abs(p.y[i]!), p.z[i]!)).toBeLessThanOrEqual(65536);
        expect(p.z[i]).toBeGreaterThanOrEqual(0);
      }
      if (r >= 8) expect(p.z[r * p.side + r]).toBeGreaterThan(60000);
    }
  });
});
