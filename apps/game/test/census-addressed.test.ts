// What the game's production paths say of a world is what the legacy game says of it: for real stars of real
// galaxies, the line built from the opportunity snapshot, the roster, the descent policy and the survey card equals
// the line the legacy game's own functions gave (fixtures/v1/recorded/census-addressed.json, from LEGACY
// celestial-frontier.html by tools/census.mjs). Here the depth boost and the ring cap are the legacy game's too.
// CF_CENSUS_REF=<folder holding celestial-frontier.html> names the fields of any star that differs.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CensusHitCounter, censusSystem, censusSystemDigest, type CensusHits, type CensusSources, type CensusSystemEntry } from '@cf/domain-worldkinds';
import { loadRecorded } from '../../../tests/support/v1-recorded.js';
import { productionCensusSources, type CensusPlace } from './census-support';

interface StarCase { group: 'star'; input: CensusPlace; output: { planets: number; digest: string } }
interface HitsCase { group: 'hits'; output: CensusHits }

const recorded = loadRecorded('census-addressed').cases as (StarCase | HitsCase)[];
const stars = recorded.filter((c): c is StarCase => c.group === 'star');
const recordedHits = recorded.find((c): c is HitsCase => c.group === 'hits')!.output;
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

  it('covers the Neighborhood, the home galaxy and two galaxies of each region, and a world the ring cap cut', () => {
    const galaxies = new Set(places.map((place) => place.galaxy.seed));
    expect(galaxies.size).toBeGreaterThanOrEqual(13);
    expect(places.filter((place) => place.galaxy.seed === 999).length).toBeGreaterThan(120);
    expect(Object.keys(recordedHits.tier!)).toEqual(expect.arrayContaining(['9', '10', '14']));
    // A tier the ring cut is in the lines: the cap is read from the game, not only stated. Most caps bite too
    // rarely for real stars to show them; packages/domain/opportunity/test/veins-legacy.test.ts holds each one.
    expect(recordedHits['tier before the ring cap']).not.toEqual(recordedHits.tier);
  });
});
