// Every seeded world's numbers are the legacy game's: the census of 100,000 worlds read through this game equals
// the fingerprint recorded from LEGACY celestial-frontier.html's own functions (fixtures/v1/recorded/census.json).
// The gate reads all of it. Worlds with an address are held through the production paths in
// apps/game/test/census-addressed.test.ts; the tiers this census cannot reach in
// packages/domain/opportunity/test/veins-legacy.test.ts.
import { describe, expect, it } from 'vitest';
import { BIOME_VEIN, DEPOSIT_PROFILES } from '@cf/domain-opportunity';
import { mulberry32, hashInt } from '@cf/domain-rand';
import { BIOME_SETS } from '@cf/domain-strays';
import { censusFingerprint, type CensusSources } from '@cf/domain-worldkinds';
import { DESCENT_TYPE_TIERS_V1, descentDamageRangeForBaseSuccessV1, type DescentPlanetTypeV1 } from '../apps/game/src/landing/descent-policy';
import { gameSources, loadCensusFixture } from './support/census';

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
  it('is the legacy game\'s, world for world, for all 100,000', () => {
    const want = fixture.full;
    expect(want.planets).toBe(100000);
    const print = censusFingerprint(game, want.planets);
    // Thousand by thousand first, so a failure names where the worlds differ.
    const differing = print.perThousand.flatMap((digest, i) => (digest === fixture.perThousand[i] ? [] : [i]));
    expect(differing, 'the thousands whose worlds differ from the legacy game\'s').toEqual([]);
    expect(print.perThousand).toHaveLength(100);
    expect(print.total).toBe(want.total);
    expect(print.shares).toEqual(want.shares);
    expect(print.hits).toEqual(want.hits);
  });

  it('reads the same on a second run', () => {
    expect(censusFingerprint(game, 3000)).toEqual(censusFingerprint(game, 3000));
  });

  it('holds the legacy game\'s shares: three in ten planets are gas giants, and Sol is counted', () => {
    const { shares, planets } = fixture.full;
    expect(fixture.gate.planets).toBe(20000);
    expect(shares.types.gas! / planets).toBeGreaterThan(0.29);
    expect(shares.types.gas! / planets).toBeLessThan(0.31);
    expect(shares.starKinds.G).toBeGreaterThan(0);
    expect(Object.keys(shares.types).sort()).toEqual(['desert', 'gas', 'ice', 'lava', 'ocean', 'rocky', 'terran', 'venus']);
    expect(Object.keys(shares.bands).sort()).toEqual(['cold', 'frozen', 'hot', 'temperate']);
  });

  describe('what the recorded worlds hit', () => {
    const { hits } = fixture.full;
    const entries = (table: string): string[] => Object.keys(hits[table]!);
    const fewest = (table: string, but: readonly string[] = []): number =>
      Math.min(...Object.entries(hits[table]!).filter(([entry]) => !but.includes(entry)).map(([, count]) => count));

    it('every biome of every type, many times', () => {
      const all = Object.entries(BIOME_SETS).flatMap(([type, set]) => set.map((biome) => `${type}: ${String(biome.k)}`));
      expect(entries('biome').sort()).toEqual([...all, 'terran: none'].sort());
      // Earth alone has no biome of its own.
      expect(hits.biome!['terran: none']).toBe(1);
      expect(fewest('biome', ['terran: none'])).toBeGreaterThanOrEqual(100);
    });

    it('every star kind, band, planet type, life level, moon type and damage rung, many times', () => {
      expect(entries('star kind')).toHaveLength(13);
      expect(fewest('star kind')).toBeGreaterThanOrEqual(100);
      expect(fewest('climate band')).toBeGreaterThanOrEqual(1000);
      expect(fewest('planet type')).toBeGreaterThanOrEqual(1000);
      expect(entries('life').sort()).toEqual(['aerial', 'aquatic', 'complex', 'earth', 'flora', 'microbial', 'none', 'sparse', 'subsurface', 'xfauna']);
      expect(fewest('life', ['earth'])).toBeGreaterThanOrEqual(400);
      expect(entries('moon type').sort()).toEqual(['Captured asteroid', 'Earth’s moon', 'Icy moon', 'Rocky moon', 'Volcanic moon']);
      expect(fewest('moon type', ['Earth’s moon'])).toBeGreaterThanOrEqual(90000);
      expect(entries('damage rung').sort()).toEqual(['2-2', '3-4', '4-6', '5-7', '6-8']);
      expect(fewest('damage rung')).toBeGreaterThanOrEqual(5000);
      expect(entries('first-landing odds')).toHaveLength(17);
      expect(fewest('first-landing odds')).toBeGreaterThanOrEqual(600);
    });

    it('every civilisation era and population, many times', () => {
      // The ten ages (LEGACY 4980-5000): the primordial age is the wilderness note, the other nine can hold a people.
      expect(entries('civilisation era')).toHaveLength(10);
      expect(fewest('civilisation era')).toBeGreaterThanOrEqual(30);
      // Six sizes of a people and Earth's own. The smallest is rare: a Stone Age people on a low roll.
      expect(entries('civilisation population')).toHaveLength(7);
      expect(hits['civilisation population']!['a few thousand']).toBe(5);
      expect(fewest('civilisation population', ['~8 billion', 'a few thousand'])).toBeGreaterThanOrEqual(70);
    });

    it('every entry of every type\'s deposit list, and every biome vein, many times', () => {
      const profiles = DEPOSIT_PROFILES as Readonly<Record<string, readonly string[]>>;
      for (const type of Object.keys(fixture.full.shares.types)) {
        for (const symbol of profiles[type] ?? profiles.rocky!) expect(hits['deposit of a type']![`${type}: ${symbol}`], `${type} ${symbol}`).toBeGreaterThanOrEqual(1000);
      }
      expect(entries('biome vein').sort()).toEqual(Object.values(BIOME_VEIN).sort());
      expect(fewest('biome vein')).toBeGreaterThanOrEqual(500);
      expect(entries('deposit count').sort()).toEqual(['3', '4', '5', '6']);
    });

    it('but tiers above 9 never and cosmic veins six times: those are held by the veins cases, not here', () => {
      expect(entries('tier').map(Number).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(Object.values(hits['cosmic vein']!).reduce((a, b) => a + b, 0)).toBe(6);
    });
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
