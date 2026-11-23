import { describe, expect, it } from 'vitest';
import { angleOf, expOf, lnOf } from '../src/space/exact';

describe('exact-operation maths for the map', () => {
  it('the exponential agrees with the library to one part in a million million, and is exact at 0', () => {
    expect(expOf(0)).toBe(1);
    for (let x = -30; x <= 30; x += 0.37) expect(Math.abs(expOf(x) / Math.exp(x) - 1), `${x}`).toBeLessThan(1e-12);
    expect(expOf(-2000)).toBe(0);
  });

  it('the natural logarithm agrees with the library, and is exact at 1', () => {
    expect(lnOf(1)).toBe(0);
    for (const x of [1e-9, 0.001, 0.3, 0.7071, 1.0001, 1.4143, 2, 18, 66.6, 1200, 9e12]) expect(Math.abs(lnOf(x) - Math.log(x)), `${x}`).toBeLessThan(1e-12);
    for (let x = 0.05; x < 40; x += 0.173) expect(Math.abs(expOf(lnOf(x)) / x - 1), `${x}`).toBeLessThan(1e-12);
  });

  it('the angle of a direction agrees with the library in every quadrant and on every axis', () => {
    for (const [y, x] of [[0, 1], [1, 0], [0, -1], [-1, 0], [0, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
      expect(Math.abs(angleOf(y, x) - Math.atan2(y, x)), `${y},${x}`).toBeLessThan(1e-12);
    }
    for (let a = -3.14; a <= 3.14; a += 0.0137) {
      for (const r of [0.001, 1, 730]) expect(Math.abs(angleOf(Math.sin(a) * r, Math.cos(a) * r) - a), `${a} at ${r}`).toBeLessThan(1e-12);
    }
  });
});
