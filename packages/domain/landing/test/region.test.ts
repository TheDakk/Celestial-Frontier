// The region a landing touches down in, against the legacy game's own answers (LEGACY celestial-frontier.html:
// biomeComposition 13294-13322, Earth's table 13330-13343, biomeForLanding 13344-13356, the salt 12974-12978).
// fixtures/v1/recorded/landing-region.json holds what those functions returned; tools/record-v1-fixtures.mjs wrote it.
import { describe, expect, it } from 'vitest';
import { loadRecorded } from '../../../../tests/support/v1-recorded.js';
import { biomeComposition, biomeForLanding, earthLandingComposition, landingSalt } from '@cf/domain-landing';
import type { LandingPlanet } from '@cf/domain-landing';

interface Recorded {
  readonly group: 'composition' | 'roll' | 'salt' | 'earth' | 'edge';
  readonly input: { seed: number; type: string; band: string; iceAmt?: number | null; salts?: number[] };
  readonly output: unknown;
}
const recorded = loadRecorded('landing-region').cases as Recorded[];
const cases = (group: Recorded['group']): Recorded[] => recorded.filter((c) => c.group === group);
const one = (group: Recorded['group']): Recorded => {
  const found = cases(group);
  if (found.length !== 1) throw new Error(`the fixture holds ${found.length} ${group} cases, not one`);
  return found[0]!;
};
/** The planet as the recorder built it: iceAmt is left off when the case says null. */
const planetOf = (input: Recorded['input']): LandingPlanet =>
  input.iceAmt == null ? { seed: input.seed, type: input.type } : { seed: input.seed, type: input.type, iceAmt: input.iceAmt };

const EARTH: LandingPlanet = { seed: 133, type: 'terran' };
const EARTH_KEYS = ['opensea', 'coral', 'archipelago', 'stormsea', 'volcisle', 'temperate', 'jungle', 'savanna', 'tundra', 'saltflat', 'karst', 'marsh', 'swamp', 'mangrove'];
const WATER = new Set(EARTH_KEYS.slice(0, 5));

describe('the mix of regions on a world', () => {
  it('every recorded composition is reproduced: same regions, same order, same shares', () => {
    expect(cases('composition').length).toBe(1281);
    for (const c of cases('composition')) {
      const got = biomeComposition(planetOf(c.input), c.input.band);
      expect(got === null ? null : got.map((s) => [s.biome.k, s.pct]), JSON.stringify(c.input)).toEqual(c.output);
    }
  });

  it('a world type with no regions has no mix', () => {
    expect(biomeComposition({ seed: 131, type: 'unknown' }, 'temperate')).toBeNull();
  });

  it('the shares of a mix sum to 1, largest first', () => {
    const mix = biomeComposition({ seed: 131, type: 'terran' }, 'temperate')!;
    expect(mix.reduce((a, s) => a + s.pct, 0)).toBeCloseTo(1, 12);
    expect(mix.map((s) => s.pct)).toEqual([...mix.map((s) => s.pct)].sort((a, b) => b - a));
  });

  it("Earth's table: 14 regions in table order summing to 1, water 71 parts in 99.5", () => {
    // LEGACY 13330-13333: the 14 weights sum to 99.5, not 100, so water (58 + 4 + 5 + 3 + 1) is 71 / 99.5 of the landings.
    const comp = earthLandingComposition();
    expect(comp.map((s) => s.biome.k)).toEqual(EARTH_KEYS);
    expect(comp.reduce((a, s) => a + s.pct, 0)).toBeCloseTo(1, 12);
    expect(comp.slice(0, 5).reduce((a, s) => a + s.pct, 0)).toBeCloseTo(71 / 99.5, 12);
    expect(comp[0]!.pct).toBe(58 / 99.5);
    expect(comp[5]!.biome.n).toBe('Temperate world');
  });
});

describe('the region of one landing', () => {
  it('every recorded landing rolls the recorded region', () => {
    expect(cases('roll').length).toBe(360);
    for (const c of cases('roll')) {
      const got = Array.from({ length: 40 }, (_, salt) => biomeForLanding(planetOf(c.input), c.input.band, salt)?.k ?? null);
      expect(got, JSON.stringify(c.input)).toEqual(c.output);
    }
  });

  it('a salt that is negative, fractional or past 32 bits rolls the recorded region', () => {
    expect(cases('salt').length).toBe(3);
    for (const c of cases('salt')) {
      const got = c.input.salts!.map((salt) => biomeForLanding(planetOf(c.input), c.input.band, salt)?.k ?? null);
      expect(got, JSON.stringify(c.input)).toEqual(c.output);
    }
  });

  it("Earth's 5,000 recorded landings are reproduced one for one", () => {
    const got = Array.from({ length: 5000 }, (_, salt) => biomeForLanding(EARTH, 'temperate', salt)!.k);
    expect(got).toEqual(one('earth').output);
  });

  it('Earth lands on water between 69 and 73 times in 100 over the recorded 5,000', () => {
    const wet = (one('earth').output as string[]).filter((k) => WATER.has(k)).length;
    expect(wet).toBeGreaterThanOrEqual(3450);
    expect(wet).toBeLessThanOrEqual(3650);
  });

  it('Earth rolls its own table whatever band it is given, and never the same region every time', () => {
    const temperate = Array.from({ length: 40 }, (_, salt) => biomeForLanding(EARTH, 'temperate', salt)!.k);
    expect(Array.from({ length: 40 }, (_, salt) => biomeForLanding(EARTH, 'frozen', salt)!.k)).toEqual(temperate);
    expect(new Set(temperate).size).toBeGreaterThan(3);
  });

  it('a world type with no regions lands nowhere', () => {
    expect(biomeForLanding({ seed: 131, type: 'unknown' }, 'temperate', 0)).toBeNull();
  });

  it('no recorded draw sits within one part in a million of a boundary', () => {
    // Engines may round Math.pow differently; a draw this close to a boundary could land elsewhere on another browser.
    expect((one('edge').output as { smallest: number }).smallest).toBeGreaterThan(1e-6);
  });
});

describe('the salt of a landing', () => {
  it('the salt is epoch * 997 + landings + views * 131', () => {
    expect(landingSalt(0, 0, 0)).toBe(0);
    expect(landingSalt(2, 5, 3)).toBe(2 * 997 + 5 + 3 * 131);
  });

  it('the first landing view after a reload has the salt of one view, so the regions restart on reload', () => {
    // LEGACY 12974 and 13507: the count starts at 0 with the page and is raised each time the landing view is
    // composed (a real landing 13476, or the survey card's view with no held picture 14253), before the roll.
    expect(landingSalt(0, 0, 1)).toBe(131);
    expect(biomeForLanding(EARTH, 'temperate', landingSalt(0, 0, 1))!.k).toBe((one('earth').output as string[])[131]);
  });
});
