// A world's tier, veins and reserve read by seed alone equal the ones its addressed snapshot carries.
// LEGACY celestial-frontier.html: the designation's tier 5158-5163, depositsFor 21260-21275, cosmicVeinFor
// 21308-21316, exVeinFor 21335-21341, reserveFor 21407-21411, the biome's vein 21285.
import { describe, expect, it } from 'vitest';
import { hashInt } from '@cf/domain-rand';
import { gradeCapAt, regionAt } from '@cf/domain-strays';
import { galaxyProfile, starsInCell, systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import { isCanonicalEarthWorldAddress, isWorldOpportunitySnapshot, projectWorldOpportunity, worldVeinsBySeed } from '../src/index.js';

const HOME = { seed: 999, x: 90, y: -60 };

/** Every world of the home galaxy's cells around Sol, and three far worlds whose tiers are deep. */
function addresses(): CanonicalCF1WorldAddress[] {
  const out: CanonicalCF1WorldAddress[] = [];
  const add = (galaxy: object, star: { seed: number; x: number; y: number }): void => {
    for (const planet of systemFor(star.seed).planets) {
      const resolved = resolveCF1WorldAddress({ galaxy, star, planet: { seed: planet.P.seed } });
      if (!resolved.ok) throw new Error(`a world did not resolve: ${resolved.reason}`);
      out.push(resolved.address);
    }
  };
  const profile = galaxyProfile(HOME.seed);
  for (let cy = -2; cy <= 10; cy++) for (let cx = 4; cx <= 22; cx++) {
    for (const star of starsInCell(HOME.seed, profile, cx, cy).stars) add(HOME, { seed: star.seed, x: star.x, y: star.y });
  }
  add({ seed: 2775120088, x: -15585.946043489894, y: -13862.482918268226 }, { seed: 510510541, x: -550.8509466005489, y: -8.055439678020775 });
  add({ seed: 1012779741, x: -599.7658047693408, y: -6073.942273357868 }, { seed: 3589953231, x: -138.81464905291796, y: -21.96363354055211 });
  add(HOME, { seed: 3037235558, x: -897.1608293121681, y: -86.20030916528776 });
  return out;
}

describe('a world read by seed alone', () => {
  const worlds = addresses();

  it('carries the tier, veins and reserve of its addressed snapshot, for every world tried', () => {
    expect(worlds.length).toBeGreaterThan(150);
    let capped = 0;
    let deep = 0;
    for (const address of worlds) {
      const snapshot = projectWorldOpportunity(address);
      const depthBoost = Math.floor(regionAt(address.galaxy.x, address.galaxy.y) / 2);
      const tierCap = gradeCapAt({ gal: address.galaxy, star: address.star });
      if (snapshot.effectiveTier < snapshot.rawTier) capped++;
      if (depthBoost > 0) deep++;
      expect(worldVeinsBySeed({
        planetSeed: snapshot.source.planetSeed,
        planetType: snapshot.source.planetType,
        biosphereLevel: snapshot.source.biosphereLevel,
        biomeKey: snapshot.source.biomeKey,
        earth: isCanonicalEarthWorldAddress(address),
        depthBoost,
        tierCap,
      })).toEqual({
        rawTier: snapshot.rawTier,
        effectiveTier: snapshot.effectiveTier,
        depositProfile: snapshot.depositProfile,
        deposits: snapshot.deposits,
        biomeVein: snapshot.biomeVein,
        cosmicVein: snapshot.cosmicVein,
        exceptionalVein: snapshot.exceptionalVein,
        reservePulls: snapshot.reservePulls,
      });
    }
    // The worlds tried include ones whose ring cap bites and ones far from home.
    expect(capped).toBeGreaterThan(0);
    expect(deep).toBeGreaterThan(0);
  });

  it('is not a snapshot: it carries no address and no authority', () => {
    const read = worldVeinsBySeed({ planetSeed: 134, planetType: 'desert', biosphereLevel: 'No known life', biomeKey: null, earth: false, depthBoost: 0, tierCap: 14 });
    expect(isWorldOpportunitySnapshot(read)).toBe(false);
    expect(Object.isFrozen(read)).toBe(true);
    expect('address' in read).toBe(false);
  });

  it('refuses a depth boost or a cap that is not a whole tier', () => {
    const base = { planetSeed: 134, planetType: 'desert', biosphereLevel: 'No known life', biomeKey: null, earth: false };
    expect(() => worldVeinsBySeed({ ...base, depthBoost: 0.5, tierCap: 14 })).toThrow(RangeError);
    expect(() => worldVeinsBySeed({ ...base, depthBoost: 0, tierCap: 15 })).toThrow(RangeError);
  });

  it('moves with each input it reads', () => {
    const seeds = Array.from({ length: 400 }, (_, i) => hashInt(0x5EED, i, 1));
    const read = (over: object): string => JSON.stringify(seeds.map((planetSeed) => worldVeinsBySeed({
      planetSeed, planetType: 'rocky', biosphereLevel: 'No known life', biomeKey: null, earth: false, depthBoost: 0, tierCap: 14, ...over,
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
