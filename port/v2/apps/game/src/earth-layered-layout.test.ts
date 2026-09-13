import { describe, expect, it } from 'vitest';
import { earthLayeredMountLayoutV1, type EarthLayeredLayoutInputV1 } from './earth-layered-layout.js';

const PHONE = Object.freeze({ viewportWidth: 390, viewportHeight: 844, topChromeBottom: 137, rosterTop: 420 });

describe('earthLayeredMountLayoutV1', () => {
  it('keeps the complete phone scene above the Biosphere and below upper chrome', () => {
    const box = earthLayeredMountLayoutV1(PHONE)!;
    expect(box.left).toBeCloseTo(12); expect(box.top).toBeCloseTo(196.53125);
    expect(box.width).toBeCloseTo(366); expect(box.height).toBeCloseTo(163.9375);
    expect(box.centerX).toBe(195); expect(box.centerY).toBe(278.5); expect(box.scale).toBeCloseTo(0.38125);
    expect(box.top).toBeGreaterThanOrEqual(149);
    expect(box.top + box.height).toBeLessThanOrEqual(408);
    expect(PHONE).toEqual({ viewportWidth: 390, viewportHeight: 844, topChromeBottom: 137, rosterTop: 420 });
  });

  it('uses the available desktop width while preserving the authored aspect ratio', () => {
    const box = earthLayeredMountLayoutV1({ viewportWidth: 1440, viewportHeight: 1000,
      topChromeBottom: 96, rosterTop: 850 })!;
    expect(box.left).toBeCloseTo(12); expect(box.width).toBeCloseTo(1416);
    expect(box.height).toBeCloseTo(634.25); expect(box.scale).toBeCloseTo(1.475);
    expect(box.centerX).toBe(720); expect(box.centerY).toBe(473);
    expect(box.top).toBeCloseTo(155.875);
    expect(box.top + box.height).toBeLessThanOrEqual(838);
  });

  it('reduces both dimensions when a desktop roster makes height the limiting boundary', () => {
    const box = earthLayeredMountLayoutV1({ viewportWidth: 1440, viewportHeight: 1000,
      topChromeBottom: 120, rosterTop: 600 })!;
    expect(box.top).toBeCloseTo(132); expect(box.height).toBeCloseTo(456);
    expect(box.top + box.height).toBeCloseTo(588);
    expect(box.centerX).toBe(720); expect(box.centerY).toBe(360);
    expect(box.width / box.height).toBeCloseTo(960 / 430);
    expect(box.left).toBeGreaterThan(12); expect(box.left + box.width).toBeLessThan(1428);
  });

  it('allows a small positive band on narrow large-text phones without cropping or relocating UI', () => {
    const input = Object.freeze({ viewportWidth: 240, viewportHeight: 844, topChromeBottom: 200, rosterTop: 225 });
    const box = earthLayeredMountLayoutV1(input)!;
    expect(box.top).toBe(212); expect(box.height).toBe(1); expect(box.centerY).toBe(212.5);
    expect(box.width).toBeCloseTo(960 / 430); expect(box.centerX).toBe(120);
    expect(box.scale).toBeGreaterThan(0); expect(box.left).toBeGreaterThan(12);
    expect(input.topChromeBottom).toBe(200); expect(input.rosterTop).toBe(225);
  });

  it.each([
    { ...PHONE, rosterTop: 161 },
    { ...PHONE, rosterTop: 160 },
    { ...PHONE, rosterTop: 100 },
    { ...PHONE, viewportWidth: 24 },
    { ...PHONE, viewportWidth: 23 },
  ])('returns null when the measured band has no usable room %#', input => {
    expect(earthLayeredMountLayoutV1(input)).toBeNull();
  });

  it.each([
    ['viewportWidth', 0], ['viewportWidth', -1], ['viewportWidth', NaN], ['viewportWidth', Infinity],
    ['viewportHeight', 0], ['viewportHeight', -1], ['viewportHeight', NaN], ['viewportHeight', -Infinity],
    ['topChromeBottom', -1], ['topChromeBottom', 845], ['topChromeBottom', NaN], ['topChromeBottom', Infinity],
    ['rosterTop', -1], ['rosterTop', 845], ['rosterTop', NaN], ['rosterTop', -Infinity],
  ] as const)('rejects an invalid or out-of-viewport %s boundary (%s)', (field, value) => {
    expect(earthLayeredMountLayoutV1({ ...PHONE, [field]: value })).toBeNull();
  });

  it.each([
    { viewportWidth: 320.5, viewportHeight: 667.5, topChromeBottom: 136.25, rosterTop: 399.75 },
    { viewportWidth: 1024, viewportHeight: 768, topChromeBottom: 0, rosterTop: 768 },
    { viewportWidth: 25, viewportHeight: 80, topChromeBottom: 0, rosterTop: 80 },
  ] satisfies EarthLayeredLayoutInputV1[])('keeps fractional and edge-aligned inputs fully contained %#', input => {
    const box = earthLayeredMountLayoutV1(input)!;
    expect(box.left).toBeGreaterThanOrEqual(12 - 1e-9);
    expect(box.left + box.width).toBeLessThanOrEqual(input.viewportWidth - 12 + 1e-9);
    expect(box.top).toBeGreaterThanOrEqual(input.topChromeBottom + 12 - 1e-9);
    expect(box.top + box.height).toBeLessThanOrEqual(input.rosterTop - 12 + 1e-9);
    expect(box.width / box.height).toBeCloseTo(960 / 430);
    expect(box.centerX).toBe(input.viewportWidth / 2);
    expect(box.centerY).toBeCloseTo((input.topChromeBottom + input.rosterTop) / 2);
  });
});
