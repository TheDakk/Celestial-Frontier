import { describe, expect, it } from 'vitest';
import { browserClocks, wallDateParts } from '../src/platform/clock';
import { presentationRandom, token, uint32 } from '../src/platform/entropy';

describe('platform clocks', () => {
  it('wallNow is the wall time in milliseconds', () => {
    const before = Date.now();
    const now = browserClocks.wallNow();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
  it('monotonicNow never runs backwards', () => {
    let last = browserClocks.monotonicNow();
    for (let i = 0; i < 1000; i++) {
      const now = browserClocks.monotonicNow();
      expect(now).toBeGreaterThanOrEqual(last);
      last = now;
    }
  });
  it('wallDateParts gives the local calendar date and time of day, months counted from 1', () => {
    expect(wallDateParts(new Date(2026, 10, 22, 9, 5, 59, 999).getTime())).toEqual({ y: 2026, mo: 11, d: 22, h: 9, mi: 5 });
    expect(wallDateParts(new Date(2027, 0, 1, 0, 0).getTime())).toEqual({ y: 2027, mo: 1, d: 1, h: 0, mi: 0 });
    expect(wallDateParts(new Date(2028, 11, 31, 23, 59).getTime())).toEqual({ y: 2028, mo: 12, d: 31, h: 23, mi: 59 });
  });
});

describe('platform entropy', () => {
  it('uint32 is a whole number from 0 to 2^32 - 1, and not one fixed value', () => {
    const drawn = new Set<number>();
    for (let i = 0; i < 16; i++) {
      const n = uint32();
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(0xffffffff);
      drawn.add(n);
    }
    expect(drawn.size).toBeGreaterThan(1);
  });
  it('token is a fresh identifier each call', () => {
    const a = token();
    const b = token();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(b).not.toBe(a);
  });
  it('presentationRandom(1) returns the same sequence twice, each value in [0, 1)', () => {
    const draw = (seed: number): number[] => {
      const next = presentationRandom(seed);
      return Array.from({ length: 200 }, next);
    };
    const first = draw(1);
    expect(draw(1)).toEqual(first);
    for (const v of first) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(new Set(first).size).toBeGreaterThan(100);
    expect(draw(2)).not.toEqual(first);
  });
});
