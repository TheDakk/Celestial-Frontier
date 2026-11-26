// What the game's production paths say of a world is what the legacy game says of it: for real stars of real
// galaxies, the line built from the opportunity snapshot, the roster, the descent policy and the survey card equals
// the line the legacy game's own functions gave (fixtures/v1/recorded/census-addressed.json, from LEGACY
// celestial-frontier.html by tools/census.mjs). Here the depth boost and the ring cap are the legacy game's too.
// The recording must meet every outcome of type, band and life and every biome that the legacy game's seeded census
// of 100,000 worlds met, and hold every real world the ring cuts: a thinner recording fails here.
// CF_CENSUS_REF=<folder holding celestial-frontier.html> names the fields of any star that differs; that branch
// is not run by the gate.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CensusHitCounter, censusSystem, censusSystemDigest, type CensusHits, type CensusSources, type CensusSystemEntry } from '@cf/domain-worldkinds';
import { loadRecorded } from '../../../tests/support/v1-recorded.js';
import { productionCensusSources, type CensusPlace } from './census-support';

interface StarCase { group: 'star'; input: CensusPlace; output: { planets: number; digest: string } }
interface RingCase { group: 'ring'; output: { galaxies: number; stars: number; planets: number; cut: Record<string, number> } }
interface HitsCase { group: 'hits'; output: CensusHits }

const recorded = loadRecorded('census-addressed').cases as (StarCase | RingCase | HitsCase)[];
const stars = recorded.filter((c): c is StarCase => c.group === 'star');
const recordedHits = recorded.find((c): c is HitsCase => c.group === 'hits')!.output;
/** What the recorder read of every real star under a ring that caps; absent from a recording that did not look. */
const ring = recorded.find((c): c is RingCase => c.group === 'ring')?.output;
/** What the legacy game's seeded census of 100,000 worlds met (fixtures/v1/recorded/census.json). */
const seededHits = (loadRecorded('census').cases as { group: string; hits?: CensusHits }[]).find((c) => c.group === 'full')!.hits!;
const places = stars.map((c) => c.input);

/** The legacy game's lines for these stars, when its file is at hand; else nothing. */
async function legacyLines(): Promise<CensusSources | null> {
  const ref = process.env.CF_CENSUS_REF;
  if (ref === undefined) return null;
  const tool = '../../../tools/census-legacy.mjs';
  const { legacyCensusSources } = await import(/* @vite-ignore */ tool) as { legacyCensusSources: (script: string, placeOf: (seed: number) => CensusPlace | undefined) => CensusSources };
  const html = readFileSync(join(ref, 'celestial-frontier.html'), 'utf8');
  const script = html.slice(html.indexOf('<script>') + '<script>'.length, html.indexOf('</script>'));
  const placeOf = new Map(places.map((place) => [place.star.seed, place]));
  return legacyCensusSources(script, (seed) => placeOf.get(seed));
}

/** The fields of a star's lines that differ from the legacy game's, by planet. */
function differingFields(mine: CensusSystemEntry, theirs: CensusSystemEntry): string[] {
  const parts = (row: string): Map<string, string> => new Map(row.split('|').map((part) => {
    const at = part.indexOf('=');
    return at < 0 ? ['ordinal', part] : [part.slice(0, at), part.slice(at + 1)];
  }));
  return mine.worlds.flatMap((world, i) => {
    const a = parts(world.row);
    const b = parts(theirs.worlds[i]?.row ?? '');
    return [...a.keys()].filter((key) => a.get(key) !== b.get(key)).map((key) => `planet ${world.ordinal} ${key}: game ${a.get(key)} / legacy ${b.get(key)}`);
  });
}

describe('the census of addressed worlds, read through the production paths', () => {
  it('is the legacy game\'s, star for star', async () => {
    const production = productionCensusSources(places);
    const legacy = await legacyLines();
    const hits = new CensusHitCounter();
    const differing: string[] = [];
    let planets = 0;
    for (const { input, output } of stars) {
      const entry = censusSystem(production, input.star.seed);
      hits.system(entry.system);
      for (const world of entry.worlds) hits.world(world);
      planets += entry.worlds.length;
      if (entry.worlds.length === output.planets && censusSystemDigest(entry) === output.digest) continue;
      const fields = legacy === null ? [] : differingFields(entry, censusSystem(legacy, input.star.seed));
      differing.push(`star ${input.star.seed} of galaxy ${input.galaxy.seed}${fields.length ? `: ${fields.join('; ')}` : ''}`);
    }
    expect(differing.slice(0, 12), `${differing.length} stars differ from the legacy game`).toEqual([]);
    expect(hits.hits()).toEqual(recordedHits);
    expect(planets).toBeGreaterThan(1500);
  });

  it('covers the Neighborhood, the home galaxy, two galaxies of each region and the deep worlds', () => {
    const galaxies = new Set(places.map((place) => place.galaxy.seed));
    expect(galaxies.size).toBeGreaterThanOrEqual(13);
    expect(places.filter((place) => place.galaxy.seed === 999).length).toBeGreaterThan(120);
    expect(Object.keys(recordedHits.tier!)).toEqual(expect.arrayContaining(['9', '10', '14']));
  });

  it('meets every outcome of type, band and life the legacy game\'s seeded census met, three times or as often as that census did', () => {
    // The rules of life (LEGACY 4944-4967) give 89 outcomes of type, band and life, Earth's and barren Mars's among
    // them; every frozen, hot, cold and temperate world of every type is in them.
    const seeded = seededHits['life of a type in a band']!;
    const met = recordedHits['life of a type in a band'] ?? {};
    expect(Object.keys(seeded)).toHaveLength(89);
    expect(Object.keys(seeded).filter((entry) => (met[entry] ?? 0) < Math.min(3, seeded[entry]!)), 'outcomes the recording is short of').toEqual([]);
    expect(Object.keys(met).sort()).toEqual(Object.keys(seeded).sort());
  });

  it('meets every biome of every type three times, and Earth, the one world with none', () => {
    // BIOME_SETS (LEGACY 13221-13281) holds 43 biomes.
    const seeded = seededHits.biome!;
    const met = recordedHits.biome ?? {};
    expect(Object.keys(seeded)).toHaveLength(44);
    expect(Object.keys(seeded).filter((entry) => (met[entry] ?? 0) < Math.min(3, seeded[entry]!)), 'biomes the recording is short of').toEqual([]);
    expect(met['terran: none']).toBe(1);
    expect(Object.keys(met).sort()).toEqual(Object.keys(seeded).sort());
  });

  it('meets every entry the seeded census met of the type, band, life, landing, damage, vein and moon tables', () => {
    for (const table of ['planet type', 'climate band', 'life', 'first-landing odds', 'damage rung', 'biome vein', 'deposit count', 'exceptional vein', 'moon type']) {
      expect(Object.keys(recordedHits[table] ?? {}).sort(), table).toEqual(Object.keys(seededHits[table]!).sort());
    }
    // Every kind of star that holds a planet: a protostar holds none (LEGACY 4029).
    expect(Object.keys(recordedHits['star kind']!).sort()).toEqual(Object.keys(seededHits['star kind']!).filter((kind) => kind !== 'PROTO').sort());
  });

  it('holds every real world the ring cuts: four in the Neighborhood and one in the Local Cluster', () => {
    // The recorder read every real star with planets under a ring that caps: the whole home galaxy and every
    // galaxy of the three inner regions. The legacy game cuts five of those worlds and no more: no real world
    // rolls above the caps of 8, 9 and 11. Each of those caps is held at made places by
    // packages/domain/opportunity/test/veins-legacy.test.ts, through the rule this snapshot is built by.
    expect(ring, 'the recording holds what the search of the capped rings read').toBeDefined();
    expect(ring!.galaxies).toBe(119);
    expect(ring!.planets).toBeGreaterThan(600000);
    expect(ring!.cut).toEqual({ 'to 5': 4, 'to 10': 1 });
    expect(recordedHits['a tier the ring cut']).toEqual({ 'to 10': 1, 'to 5': 4 });
  });
});
