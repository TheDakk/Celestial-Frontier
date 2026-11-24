import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { systemFor } from '@cf/domain-worldgen';
import { planetDescriptorAtEcologyEpoch } from '@cf/domain-descriptors';

type Raw = Record<string, unknown>;
const sol = systemFor(424242) as unknown as Raw & { planets: Array<Raw & { P: Raw & { seed: number } }> };
const earth = sol.planets.find((p) => p.P.seed === 133)!;
const species = (epoch: number): string[] =>
  (planetDescriptorAtEcologyEpoch(earth.P, sol, earth, epoch).rows as unknown as string[][])
    .filter((row) => typeof row[3] === 'string' && row[3].startsWith('sp:'))
    .map((row) => `${row[0]}:${row[1]!.split(' — ')[0]}`);

const STARTERS = [
  'Flora:Persimmon', "Flora:Devil's Club", 'Flora:Cranberry', 'Flora:Rambutan', 'Flora:Wild Guava',
  'Flora:Barrel Cactus Fruit', 'Fungi:Mildew', 'Fungi:Giant Puffball', 'Microbe:Red-Tide Algae',
  'Microbe:Halophile', 'Microbe:Euglena', 'Fauna:Platypus', 'Fauna:Civet', 'Fauna:Brittle Star',
  'Fauna:Frog', 'Fauna:Pheasant', 'Fauna:Oryx', 'Fauna:Sea Urchin', 'Fauna:Prawn',
];
const VISITORS: Record<number, string[]> = {
  1: ['Fauna:Harpy Eagle'], 2: ['Fauna:Capuchin'], 3: ['Fauna:Polychaete Worm', 'Fauna:Sea Snail'],
  4: ['Flora:Redwood'], 5: ['Flora:Cedar', 'Flora:Date'], 6: ['Flora:Wild Mango'],
};

describe("Earth's roster, by name", () => {
  it('a new game shows exactly the 19 starters, in card order', () => {
    expect(species(0)).toEqual(STARTERS);
  });
  it('each of the first six epochs adds its visitors after the same 19', () => {
    for (const [epoch, names] of Object.entries(VISITORS)) {
      expect(species(Number(epoch))).toEqual([...STARTERS, ...names]);
    }
  });
  it("the recorded base roster is the same 19 genomes at every recorded epoch", () => {
    const rosters = JSON.parse(readFileSync(new URL('../../fixtures/current/rosters.json', import.meta.url), 'utf8')) as { earth: unknown[][] };
    expect(rosters.earth).toHaveLength(6);
    for (const roster of rosters.earth) expect(roster).toEqual(rosters.earth[0]);
    expect(rosters.earth[0]).toHaveLength(19);
  });
  it('no descriptor hook is a global after the cards are built', () => {
    for (const name of ['_earthNamePass', '_cardFactsSet', 'GAL_KIND', 'COSMIC_EPOCH', '_earthArt']) expect(name in globalThis).toBe(false);
  });
});
