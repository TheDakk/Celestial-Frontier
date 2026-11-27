// A world's tier, veins and reserve read by seed alone: what the reading is and what it refuses. That its answers
// are the legacy game's is held by veins-legacy.test.ts (every tier, every place) and, for real worlds through the
// snapshot itself, by apps/game/test/census-addressed.test.ts.
import { describe, expect, it } from 'vitest';
import { hashInt } from '@cf/domain-rand';
import { isWorldOpportunitySnapshot, worldVeinsAt, worldVeinsBySeed } from '../src/index.js';

describe('a world read by seed alone', () => {
  it('is not a snapshot: it carries no address and no authority', () => {
    const read = worldVeinsBySeed({ planetSeed: 134, planetType: 'desert', biosphereLevel: 'No known life', biomeKey: null, earth: false, depthBoost: 0, tierCap: 14, rules: null });
    expect(isWorldOpportunitySnapshot(read)).toBe(false);
    expect(Object.isFrozen(read)).toBe(true);
    expect('address' in read).toBe(false);
  });

  it('refuses a depth boost or a cap that is not a whole tier', () => {
    const base = { planetSeed: 134, planetType: 'desert', biosphereLevel: 'No known life', biomeKey: null, earth: false };
    expect(() => worldVeinsBySeed({ ...base, depthBoost: 0.5, tierCap: 14, rules: null })).toThrow(RangeError);
    expect(() => worldVeinsBySeed({ ...base, depthBoost: 0, tierCap: 15, rules: null })).toThrow(RangeError);
  });

  it('read at a place, refuses a place that is not one', () => {
    const world = { planetSeed: 134, planetType: 'desert', biosphereLevel: 'No known life', biomeKey: null, earth: false, rules: null };
    const home = { seed: 999, x: 90, y: -60 };
    expect(Object.isFrozen(worldVeinsAt({ galaxy: home, star: { x: 560, y: 170 } }, world))).toBe(true);
    expect(() => worldVeinsAt({ galaxy: { seed: 999, x: Number.NaN, y: -60 }, star: { x: 560, y: 170 } }, world)).toThrow(RangeError);
    expect(() => worldVeinsAt({ galaxy: home, star: { x: Number.POSITIVE_INFINITY, y: 170 } }, world)).toThrow(RangeError);
  });

  it('moves with each input it reads', () => {
    const seeds = Array.from({ length: 400 }, (_, i) => hashInt(0x5EED, i, 1));
    const read = (over: object): string => JSON.stringify(seeds.map((planetSeed) => worldVeinsBySeed({
      planetSeed, planetType: 'rocky', biosphereLevel: 'No known life', biomeKey: null, earth: false, depthBoost: 0, tierCap: 14, rules: null, ...over,
    })));
    const plain = read({});
    expect(read({})).toBe(plain);
    expect(read({ planetType: 'gas' })).not.toBe(plain);
    expect(read({ biosphereLevel: 'Abundant — flora and fauna' })).not.toBe(plain);
    expect(read({ biomeKey: 'geode' })).not.toBe(plain);
    expect(read({ earth: true })).not.toBe(plain);
    expect(read({ depthBoost: 2 })).not.toBe(plain);
    expect(read({ tierCap: 0 })).not.toBe(plain);
  });
});
