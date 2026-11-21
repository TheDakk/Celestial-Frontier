import { describe, expect, it } from 'vitest';
import fixtureJson from '../../../../fixtures/current/rosters.json' with { type: 'json' };
import { biosphere, planetSpeciesAtEcologyEpoch } from '@cf/domain-ecology';
import { systemFor } from '@cf/domain-worldgen';
import { climateBand } from '@cf/domain-surveyphrases';
import { mulberry32 } from '@cf/domain-rand';

const fixture = fixtureJson as Record<string, unknown[][]>;
const EPOCHS = [0, 1, 2, 3, 6, 12];
const WORLDS: Record<string, { planet: number; star: number }> = {
  earth: { planet: 133, star: 424242 },
  kaum: { planet: 1757105165, star: 2737406570 },
  osum: { planet: 51464061, star: 1074947061 },
};

// Same derivation as tools/record-fixtures.mjs (the rosters recorder).
function derive(star: number, planetSeed: number, epoch: number) {
  const sys = systemFor(star);
  const found = sys.planets.find((entry) => entry.P['seed'] === planetSeed) as { P: { seed: number; type?: string }; orb: number } | undefined;
  if (!found) throw new Error(`planet ${planetSeed} not found in system ${star}`);
  const band = climateBand(found.P, sys, found.orb);
  const key = biosphere(found.P, sys as { sol?: boolean }, band, mulberry32((found.P.seed ^ 0x1234567) >>> 0)).key;
  const level = key === 'earth' ? 'complex' : key;
  const roster = planetSpeciesAtEcologyEpoch(found.P, sys, band, level, epoch);
  // JSON round-trip: the fixture is JSON, which cannot hold undefined, so compare both sides
  // through the same round-trip. The package's roster may be memoised and shared: never mutate it.
  return { key, roster: JSON.parse(JSON.stringify(roster)) as Array<Record<string, unknown>> };
}
const rosterOf = (world: string, epoch: number) => derive(WORLDS[world]!.star, WORLDS[world]!.planet, epoch).roster;
const GENES = ['body', 'head', 'tail', 'pattern', 'skin', 'limbs', 'eyes', 'size', 'color', 'accent', 'loco'] as const;
/** `<index>.<gene>` for each listed gene that is not a non-negative integer. */
const badGenes = (roster: ReadonlyArray<Record<string, unknown>>): string[] =>
  roster.flatMap((species, i) => GENES.filter((k) => {
    const v = species[k];
    return !(typeof v === 'number' && Number.isInteger(v) && v >= 0);
  }).map((k) => `${i}.${k}`));
const rosterOfSolPlanet = (planetSeed: number) => derive(424242, planetSeed, 0).roster;

describe('@cf/domain-ecology — rosters pinned against the current game', () => {
  it.each(['earth', 'kaum', 'osum'])('%s roster matches the current game at every recorded epoch', (world) => {
    EPOCHS.forEach((epoch, i) => expect(rosterOf(world, epoch)).toEqual(fixture[world]![i]));
  });
  it('biosphere keys are as in the current game', () => {
    expect(derive(424242, 133, 0).key).toBe('earth');
    expect(derive(2737406570, 1757105165, 0).key).toBe('complex');
    expect(derive(1074947061, 51464061, 0).key).toBe('aquatic');
    expect(derive(424242, 134, 0).key).toBe('none');
  });
  it('Earth has 19 species at epoch 0 and ignores the epoch', () => {
    expect(rosterOf('earth', 0)).toHaveLength(19);
    expect(rosterOf('earth', 12)).toEqual(rosterOf('earth', 0));
  });
  it('a lifeless world has an empty roster', () => {
    expect(rosterOfSolPlanet(134)).toEqual([]); // Mars
  });
  it('rejects a non-integer epoch', () => {
    expect(() => rosterOf('kaum', 1.5)).toThrow(RangeError);
  });
  it('Kaum at the epoch ceiling has 16 species, differs from epoch 0 and keeps every gene a non-negative integer', () => {
    const ceiling = rosterOf('kaum', 10_000);
    expect(ceiling).toHaveLength(16);
    expect(ceiling).not.toEqual(rosterOf('kaum', 0));
    expect(badGenes(ceiling)).toEqual([]);
  }, 120_000);
  it('the gene checker flags a negative, fractional or missing gene', () => {
    const species = rosterOf('kaum', 0);
    expect(badGenes(species)).toEqual([]);
    expect(badGenes([{ ...species[0], body: -1 }, { ...species[1], eyes: 2.5 }, { ...species[2], loco: undefined }]))
      .toEqual(['0.body', '1.eyes', '2.loco']);
  });
  it('notices a changed gene (negative control)', () => {
    const copy = structuredClone(fixture.kaum![0]!) as any[];
    copy[0].head += 1;
    expect(rosterOf('kaum', 0)).not.toEqual(copy);
  });
});
