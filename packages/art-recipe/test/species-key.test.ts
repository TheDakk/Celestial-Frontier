import { describe, expect, it } from 'vitest';
import { parseCatalogueText, partId } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import { testCatalogue } from '@cf/art-testparts';
import rosters from '../../../fixtures/current/rosters.json' with { type: 'json' };
import { buildRecipe, buildSpeciesRecipe } from '../src/recipe';
import { recipeFor, speciesKeyOf } from '../src/species-key';

type Genome = Record<string, unknown>;

/** The 19 starters and the eight first visitors of Earth, by the name the game gives each, and the key of its pack. */
const KEYS: readonly (readonly [string, string])[] = [
  ['Platypus', 'platypus'], ['Civet', 'civet'], ['Brittle Star', 'brittlestar'], ['Frog', 'frog'], ['Pheasant', 'pheasant'],
  ['Oryx', 'oryx'], ['Sea Urchin', 'seaurchin'], ['Prawn', 'prawn'], ['Harpy Eagle', 'harpyeagle'], ['Capuchin', 'capuchin'],
  ['Polychaete Worm', 'polychaeteworm'], ['Sea Snail', 'seasnail'], ['Persimmon', 'persimmon'], ["Devil's Club", 'devilsclub'],
  ['Cranberry', 'cranberry'], ['Rambutan', 'rambutan'], ['Wild Guava', 'wildguava'], ['Barrel Cactus Fruit', 'barrelcactusfruit'],
  ['Mildew', 'mildew'], ['Giant Puffball', 'giantpuffball'], ['Red-Tide Algae', 'redtidealgae'], ['Halophile', 'halophile'],
  ['Euglena', 'euglena'], ['Redwood', 'redwood'], ['Cedar', 'cedar'], ['Date', 'date'], ['Wild Mango', 'wildmango'],
];

/**
 * The Civet's recorded genome: the second fauna genome of Earth's recorded roster, with the name the game's name pass
 * writes on it (tests/cross/art-species-key.test.ts holds this genome to that name by the game's own pass).
 */
const CIVET_SEED = 3212817920;
const earth = (rosters as unknown as { earth: Genome[][] }).earth[0]!;
const recorded = earth.find((g) => g.seed === CIVET_SEED)!;
const civet = (): Genome => ({ ...recorded, _earthName: 'Civet' });

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';
const partText = (id: string): string => `part ${id}\nframe rest anchor=0,0\n1\n`;
const SCAFFOLD = 'scaffold quadruped/civet/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n';
const CIVET_LINE = 'species civet quadruped medium legs=4 eyes=2 iris=3 tail=1';
const q = (slot: SlotName, kind: string): string => partId('quadruped', slot, kind, 'medium', 0);
const CIVET_PARTS = [
  q('torso', 'civet'), q('head', 'civet'), q('tail', 'civet'), q('eyes', 'eye'),
  ...(['farLimbs', 'nearLimbs'] as const).flatMap((slot) => [q(slot, 'fore'), q(slot, 'hind')]),
];
/** A catalogue with the Civet's pack in it, or the same parts with no species line. */
const catalogue = (withCivet: boolean): Catalogue =>
  parseCatalogueText(`${HEADER}${CIVET_PARTS.map(partText).join('\n')}\n${SCAFFOLD}\n${withCivet ? CIVET_LINE : ''}\n`);

describe('speciesKeyOf', () => {
  it('the 19 starters and the eight first visitors map to these keys', () => {
    expect(KEYS).toHaveLength(27);
    expect(KEYS.map(([name]) => [name, speciesKeyOf({ _earthName: name })])).toEqual(KEYS.map(([name, key]) => [name, key]));
  });

  it('a genome with no Earth name has no key', () => {
    expect(speciesKeyOf(recorded)).toBeNull();
    expect(speciesKeyOf({ _earthName: '' })).toBeNull();
    expect(speciesKeyOf({ _earthName: 7 })).toBeNull();
  });

  it('an Earth blend has no key', () => {
    expect(speciesKeyOf({ _earthBlend: 'Civet' })).toBeNull();
    expect(speciesKeyOf({ ...civet(), _earthBlend: 'Tiger' })).toBeNull();
  });
});

describe('recipeFor', () => {
  it("the Civet's recorded genome gives the species recipe when its pack is in the catalogue, and the generated recipe with one counted gap when it is not", () => {
    expect(recorded.kingdom).toBe('fauna');
    const held = catalogue(true);
    const drawn = recipeFor(civet(), [], held);
    expect(drawn).toEqual(buildSpeciesRecipe('civet', held));
    expect(drawn.gaps).toEqual([]);

    const bare = catalogue(false);
    const generated = buildRecipe(civet(), [], bare);
    const fallen = recipeFor(civet(), [], bare);
    expect(fallen).toEqual({ ...generated, gaps: [...generated.gaps, 'species:civet'] });
    expect(fallen.gaps.filter((gap) => gap.startsWith('species:'))).toEqual(['species:civet']);
    expect(Object.isFrozen(fallen) && Object.isFrozen(fallen.gaps)).toBe(true);
  });

  it('the generated recipe of a named species without a pack is the one the lineage and the bulk step give', () => {
    // The Platypus's recorded genome: a medium body, which the placeholder catalogue holds a torso for at each bulk step.
    const platypus: Genome = { ...earth.find((g) => g.seed === 4049771185)!, _earthName: 'Platypus' };
    const bare = testCatalogue();
    const generated = buildRecipe(platypus, ['a', 'b'], bare, { bulk: 2 });
    expect(recipeFor(platypus, ['a', 'b'], bare, { bulk: 2 })).toEqual({ ...generated, gaps: [...generated.gaps, 'species:platypus'] });
    expect(generated).not.toEqual(buildRecipe(platypus, [], bare, { bulk: 2 }));
    expect(generated).not.toEqual(buildRecipe(platypus, ['a', 'b'], bare));
  });

  it("two genomes that are equal give equal recipes; the recipe's identity is the species key", () => {
    const held = catalogue(true);
    const one = recipeFor(civet(), [], held);
    const other = recipeFor(JSON.parse(JSON.stringify(civet())) as Genome, [], held);
    expect(other).toEqual(one);
    expect(one.identity).toBe('species:civet');
    expect(one.identity).toBe(`species:${speciesKeyOf(civet())}`);
  });

  it('an Earth blend (_earthBlend set) is not a named species: it takes the generated recipe', () => {
    const held = catalogue(true);
    const blend: Genome = { ...recorded, _earthBlend: 'Civet' };
    expect(recipeFor(blend, [], held)).toEqual(buildRecipe(blend, [], held));
    const both: Genome = { ...civet(), _earthBlend: 'Tiger' };
    expect(recipeFor(both, [], held)).toEqual(buildRecipe(both, [], held));
  });

  it('a genome with no Earth name takes the generated recipe, with no species gap', () => {
    const held = catalogue(true);
    expect(recipeFor(recorded, [], held)).toEqual(buildRecipe(recorded, [], held));
  });
});
