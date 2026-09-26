import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { surfaceColor, planetParams, type PlanetParams } from '@cf/domain-planetgen';
import { makeNoise } from '@cf/domain-rand';
import { SOL_PLANETS } from '@cf/domain-starcatalog';
import {
  createEarthSurfaceAtlasV1,
  PLANET_TURN_ATLAS_WIDTH,
  PLANET_TURN_ATLAS_HEIGHT,
  PLANET_TURN_ATLAS_U_EXTENT,
  type EarthSurfaceAtlasV1,
} from '../apps/game/src/planet-surface-atlas.js';

const canonicalEarth = SOL_PLANETS.find((planet) => planet.name === 'Earth')?.P;
if (!canonicalEarth) throw new Error('canonical Sol Earth fixture is missing');
const earth = structuredClone(canonicalEarth);
const sourceBefore = structuredClone(canonicalEarth);
let atlas: EarthSurfaceAtlasV1;
const digest = (bytes: Uint8ClampedArray): string => createHash('sha256').update(bytes).digest('hex');
const pixel = (image: EarthSurfaceAtlasV1, x: number, y: number): number[] =>
  [...image.pixels.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];

beforeAll(() => { atlas = createEarthSurfaceAtlasV1(Object.freeze(earth), null); });

describe('canonical unlit finite-turn Earth atlas', () => {
  it('uses the real Sol override and exactly bounded opaque RGBA storage', () => {
    expect(earth).toMatchObject({ seed: 133, type: 'terran', landHue: 115, iceAmt: 0.5 });
    expect(planetParams(133)).not.toEqual(earth);
    expect([PLANET_TURN_ATLAS_WIDTH, PLANET_TURN_ATLAS_HEIGHT]).toEqual([768, 384]);
    expect(PLANET_TURN_ATLAS_U_EXTENT).toBe(Math.PI * 0.7 + 0.35);
    expect(atlas).toMatchObject({ width: 768, height: 384, sourceSeed: 133, uExtent: Math.PI * 0.7 + 0.35 });
    expect(atlas.pixels.byteLength).toBe(1_179_648);
    expect(atlas.pixels.every((channel, index) => index % 4 !== 3 || channel === 255)).toBe(true);
    expect(canonicalEarth).toEqual(sourceBefore);
    expect(earth).toEqual(sourceBefore);
  });

  it('matches the real surface owner at poles, center, coasts and both finite-turn edges', () => {
    const coordinates = [[0, 0], [767, 383], [383, 191], [101, 95], [600, 230], [0, 192], [767, 192]] as const;
    const colors = new Set<string>();
    for (const [x, y] of coordinates) {
      // Independent native surfaceColor oracle: no atlas code or baked sprite lighting.
      const u = -Math.PI * 0.7 - 0.35 + (x + 0.5) * (Math.PI * 1.4 + 0.7) / 768;
      const latitude = -1 + (y + 0.5) / 192;
      const expected = new Uint8ClampedArray([
        ...surfaceColor(structuredClone(earth) as PlanetParams, u, latitude, makeNoise(133)), 255,
      ]);
      const actual = pixel(atlas, x, y);
      expect(actual, `native unlit sample ${x},${y}`).toEqual([...expected]);
      colors.add(actual.join(','));
    }
    expect(colors.size).toBeGreaterThan(3);
  });

  it('repeats the byte hash from a fresh reversed-order source without sharing storage', () => {
    const reversed = Object.fromEntries(Object.entries(earth).reverse());
    const repeated = createEarthSurfaceAtlasV1(reversed, null);
    expect(digest(repeated.pixels)).toBe(digest(atlas.pixels));
    expect(repeated.pixels).not.toBe(atlas.pixels);
    const originalFirst = atlas.pixels[0];
    repeated.pixels[0] = (repeated.pixels[0]! + 1) % 256;
    expect(digest(repeated.pixels)).not.toBe(digest(atlas.pixels));
    expect(atlas.pixels[0]).toBe(originalFirst);
    expect(reversed).toEqual(earth);
  });

  it('preserves supplied climate/vegetation facts and never bakes city lights', () => {
    // These are the actual temperate/living Earth card values; civLights is deliberately
    // unused by surfaceColor and belongs to the separate night-side sprite pass.
    const facts = Object.freeze({ band: 'temperate', lush: true, civLights: 0.5 });
    const withFacts = createEarthSurfaceAtlasV1(earth, facts);
    expect(digest(withFacts.pixels)).toBe(digest(atlas.pixels));
    expect(facts).toEqual({ band: 'temperate', lush: true, civLights: 0.5 });
    const cold = Object.freeze({ band: 'cold', lush: false, civLights: 0 });
    const control = createEarthSurfaceAtlasV1(earth, cold);
    expect(digest(control.pixels)).not.toBe(digest(atlas.pixels));
    const x = 383, y = 191;
    const u = -Math.PI * 0.7 - 0.35 + (x + 0.5) * (Math.PI * 1.4 + 0.7) / 768;
    const expected = new Uint8ClampedArray([
      ...surfaceColor(structuredClone(earth) as PlanetParams, u, -1 + (y + 0.5) / 192, makeNoise(133), cold), 255,
    ]);
    expect(pixel(control, x, y)).toEqual([...expected]);
    expect(cold).toEqual({ band: 'cold', lush: false, civLights: 0 });
  });

  it('rejects wrong worlds and malformed source/facts before allocating any pixels', () => {
    const missingHue = { ...earth }; delete missingHue.landHue;
    const missingIce = { ...earth }; delete missingIce.iceAmt;
    const getter = vi.fn(() => 115);
    const accessor = { ...earth };
    Object.defineProperty(accessor, 'landHue', { enumerable: true, get: getter });
    const cyclic: Record<string, unknown> = { ...earth }; cyclic.self = cyclic;
    const sources: unknown[] = [
      null, [], new Date(0), { ...earth, seed: 134 }, { ...earth, seed: '133' },
      { ...earth, type: 'gas' }, missingHue, missingIce, accessor, cyclic,
      { ...earth, landHue: Number.NaN }, { ...earth, iceAmt: Infinity },
      { ...earth, seaHue: -Infinity }, { ...earth, landHue: '115' },
      { ...earth, extra: () => 1 }, { ...earth, [Symbol('hidden')]: 1 },
    ];
    const badFacts: unknown[] = [
      undefined, [], { band: 'wrong' }, {}, { band: 'temperate', lush: 'yes' },
      { band: 'temperate', civLights: Infinity }, { band: 'temperate', civLights: '0.5' },
      { band: 'temperate', nested: { value: Number.NaN } },
    ];
    const allocation = vi.fn(() => { throw new Error('pixel allocation happened before validation'); });
    vi.stubGlobal('Uint8ClampedArray', allocation);
    try {
      for (const source of sources) {
        expect(() => createEarthSurfaceAtlasV1(source as Record<string, unknown>, null)).toThrow(/planet surface atlas:/);
      }
      for (const facts of badFacts) {
        expect(() => createEarthSurfaceAtlasV1(earth, facts as Record<string, unknown>)).toThrow(/planet surface atlas:/);
      }
      expect(allocation).not.toHaveBeenCalled();
      expect(getter).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
});
