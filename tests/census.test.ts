// Every seeded world's numbers are the legacy game's: the census read through this game equals the fingerprint
// recorded from LEGACY celestial-frontier.html's own functions (fixtures/current/census-v1.json).
// The gate reads the first 20,000 worlds; CF_CENSUS=full reads all 100,000, as tools/census.mjs does.
import { describe, expect, it } from 'vitest';
import { mulberry32, hashInt } from '@cf/domain-rand';
import { BIOME_SETS } from '@cf/domain-strays';
import { censusFingerprint, type CensusSources } from '@cf/domain-worldkinds';
import { DESCENT_TYPE_TIERS_V1, descentDamageRangeForBaseSuccessV1, type DescentPlanetTypeV1 } from '../apps/game/src/landing/descent-policy';
import { censusCount, gameSources, loadCensusFixture } from './support/census';

const fixture = loadCensusFixture();
const game = gameSources();

type BiomeEntry = { k: string; w: number; land: number; bands?: string[] };
type BiomeSets = Record<string, BiomeEntry[]>;

/** A stand-in for the game's biome and landing readers: the legacy picker (13282-13292) over a table handed in. */
function withBiomeTable(sets: BiomeSets): CensusSources {
  const pick = (P: { seed: number; type: string }, band: string): BiomeEntry | null => {
    if (P.seed === 133) return null;
    const set = sets[P.type];
    if (!set) return null;
    const bd = band === 'frozen' ? 'cold' : band;
    const cands = set.filter((b) => !b.bands || b.bands.includes(bd));
    const pool = cands.length ? cands : set;
    const r = mulberry32(hashInt(P.seed, 0xB10E, 7) >>> 0);
    let v = r() * pool.reduce((total, b) => total + b.w, 0);
    for (const b of pool) { v -= b.w; if (v <= 0) return b; }
    return pool[pool.length - 1]!;
  };
  return {
    ...game,
    biome: (planet, band) => pick(planet.P, band)?.k ?? null,
    descent: (planet, _system, band) => {
      const percent = pick(planet.P, band)?.land ?? DESCENT_TYPE_TIERS_V1[planet.P.type as DescentPlanetTypeV1].successPercent;
      return { percent, ...descentDamageRangeForBaseSuccessV1(percent) };
    },
  };
}

const tableCopy = (): BiomeSets => JSON.parse(JSON.stringify(BIOME_SETS)) as BiomeSets;

describe('the census of seeded worlds', () => {
  it('is the legacy game\'s, world for world', () => {
    const want = censusCount(fixture);
    const print = censusFingerprint(game, want.planets);
    const thousands = want.planets / 1000;
    // Thousand by thousand first, so a failure names where the worlds differ.
    const differing = print.perThousand.flatMap((digest, i) => (digest === fixture.perThousand[i] ? [] : [i]));
    expect(differing, 'the thousands whose worlds differ from the legacy game\'s').toEqual([]);
    expect(print.perThousand).toHaveLength(thousands);
    expect(print.total).toBe(want.total);
    expect(print.shares).toEqual(want.shares);
    expect(print.planets).toBe(want.planets);
  });

  it('reads the same on a second run', () => {
    expect(censusFingerprint(game, 3000)).toEqual(censusFingerprint(game, 3000));
  });

  it('holds the legacy game\'s shares: three in ten planets are gas giants, and Sol is counted', () => {
    const { shares, planets } = fixture.full;
    expect(planets).toBe(100000);
    expect(fixture.gate.planets).toBe(20000);
    expect(shares.types.gas! / planets).toBeGreaterThan(0.29);
    expect(shares.types.gas! / planets).toBeLessThan(0.31);
    expect(shares.starKinds.G).toBeGreaterThan(0);
    expect(Object.keys(shares.types).sort()).toEqual(['desert', 'gas', 'ice', 'lava', 'ocean', 'rocky', 'terran', 'venus']);
    expect(Object.keys(shares.bands).sort()).toEqual(['cold', 'frozen', 'hot', 'temperate']);
  });

  describe('proved both ways with a stand-in biome table', () => {
    it('the legacy table reproduces the recorded worlds', () => {
      expect(censusFingerprint(withBiomeTable(tableCopy()), 5000).perThousand).toEqual(fixture.perThousand.slice(0, 5));
    });

    it('one changed biome weight fails it', () => {
      const sets = tableCopy();
      sets.gas![0]!.w += 1;
      const print = censusFingerprint(withBiomeTable(sets), 5000);
      expect(print.perThousand).not.toEqual(fixture.perThousand.slice(0, 5));
      expect(print.shares).toEqual(censusFingerprint(game, 5000).shares);
    });

    it('one changed landing value fails it', () => {
      const sets = tableCopy();
      sets.lava!.find((b) => b.k === 'magmasea')!.land += 5;
      expect(censusFingerprint(withBiomeTable(sets), 5000).perThousand).not.toEqual(fixture.perThousand.slice(0, 5));
    });
  });
});
