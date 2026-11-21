import type { SizeTier, ThemeName } from '@cf/art-format';
import { GENE_LENGTHS, marked, wrap } from './resolve';

/** A row of a game name table: the game's name, and whether the original's name tests make it aquatic and airborne. */
export type StateRow = readonly [name: string, aquatic: boolean, airborne: boolean];

const rows = (table: readonly StateRow[]): readonly StateRow[] => Object.freeze(table.map((row) => Object.freeze(row)));

/** The game's movement table (FA_LOCO), in its order. A test holds each row to the original's name tests. */
export const LOCO_STATE: readonly StateRow[] = rows([
  ['grazers', false, false], ['burrowers', false, false], ['pack hunters', false, false], ['gliders', false, true],
  ['swimmers', true, false], ['floaters', false, true], ['ambush predators', false, false], ['climbers', false, false],
  ['herd-beasts', false, false], ['filter-feeders', true, false], ['leapers', false, false], ['drifters', false, true],
  ['runners', false, false], ['jet-propelled swimmers', true, false], ['tentacle-walkers', false, false],
  ['rollers', false, false], ['wall-clingers', false, false], ['current-drifters', false, true],
]);

/** The game's extremophile movement table (EX_LOCO), in its order. */
export const EX_LOCO_STATE: readonly StateRow[] = rows([
  ['vent-clingers', false, false], ['magma-swimmers', true, false], ['under-ice drifters', false, true],
  ['pressure-walkers', false, false], ['acid-cloud floaters', false, true], ['storm-riders', false, true],
  ['winged hunters', false, true], ['thermal-soarers', false, true], ['brine-crawlers', true, false],
]);

/** The game's habitat table (FA_HABITAT), in its order. */
export const HABITAT_STATE: readonly StateRow[] = rows([
  ['the deep forest canopy', false, false], ['open grassland plains', false, false], ['rocky highland ridges', false, false],
  ['coastal shallows', true, false], ['river deltas and wetlands', false, false], ['subterranean caverns', false, false],
  ['windswept tundra', false, false], ['the twilight terminator zone', false, false], ['floating reef colonies', true, false],
  ['volcanic ash fields', false, false], ['the open ocean', true, false], ['desert dunes', false, false],
  ['methane lakeshores', true, false], ['ammonia-sea shallows', true, false], ['high cloud decks', false, true],
  ['hydrothermal vent fields', true, false], ['salt-flat pans', false, false], ['mangrove tangles', false, false],
  ['crystal caverns', false, false],
]);

/** The game's extremophile habitat table (EX_HABITAT), in its order. */
export const EX_HABITAT_STATE: readonly StateRow[] = rows([
  ['hydrothermal vent fields', true, false], ['cooling lava margins', false, false], ['beneath the ice sheets', false, false],
  ['abyssal trenches', true, false], ['the acid cloud layers', false, false], ['storm-eye updrafts', false, true],
  ['brine pools', false, false], ['deep cave systems', false, false], ['the crushing lower decks', false, false],
]);

/**
 * Whether a fauna genome is aquatic and airborne, as the original's two name tests answer it on the movement and
 * habitat names. An extremophile (marker `x`) reads both genes from the extremophile tables, as the game does.
 *
 * The original's body-family chooser also tests a habitat number (3, 8, 10, 13, 15) for the fish body. That test is
 * never true: the chooser is reached only from the creature drawer, whose input is always the visual-genes object
 * built from the genome (portrait and every landing-vista caller), and that object has no `habitat` key (it keeps
 * the habitat as `heat`); the Earth recipes merged into it carry none either. So the number reads as 0 and only the
 * name tests decide, which is the rule here.
 */
export function stateOf(genome: Readonly<Record<string, unknown>>): { aquatic: boolean; airborne: boolean } {
  const L = GENE_LENGTHS;
  const x = marked(genome['x']);
  const loco = x ? EX_LOCO_STATE[wrap(genome['loco'], L.extremophileLoco)]! : LOCO_STATE[wrap(genome['loco'], L.loco)]!;
  const habitat = x ? EX_HABITAT_STATE[wrap(genome['habitat'], L.extremophileHabitat)]! : HABITAT_STATE[wrap(genome['habitat'], L.habitat)]!;
  return { aquatic: loco[1] || habitat[1], airborne: loco[2] || habitat[2] };
}

/**
 * The size tier by size gene. The original draws size gene 0 (and a missing size) as size 2, by its `(g.size||2)`,
 * so gene 0 takes the medium tier; genes 1 to 5 equal `tierForSize`. Not yet read by the live recipe.
 */
export const SIZE_TIER_BY_GENE: readonly Exclude<SizeTier, 'guardian'>[] = Object.freeze(['medium', 'small', 'medium', 'medium', 'large', 'large']);

/** The game's theme by habitat gene (HAB_THEME in the combat package), in its order. A cross test holds it to the game's rule. */
export const THEME_BY_HABITAT: readonly ThemeName[] = Object.freeze([
  'venom', 'wild', 'stone', 'tide', 'tide', 'stone', 'frost', 'void', 'psionic', 'fire',
  'tide', 'sand', 'chem', 'chem', 'storm', 'fire', 'sand', 'venom', 'frost',
]);

/** The movement genes that set the theme whatever the habitat, as the game's abilityTheme overrides it. */
const THEME_BY_LOCO: Readonly<Record<number, ThemeName>> = Object.freeze({ 1: 'stone', 3: 'storm', 4: 'tide', 5: 'psionic', 11: 'psionic', 13: 'tide', 17: 'psionic' });

/**
 * A fauna genome's theme, as the game's abilityTheme gives it: the habitat's theme, unless the movement gene sets
 * one. As in the game, the extremophile marker is not read (both genes index the normal tables); out-of-range genes
 * wrap, as every gene does in the renderer.
 */
export function themeOf(genome: Readonly<Record<string, unknown>>): ThemeName {
  const L = GENE_LENGTHS;
  return THEME_BY_LOCO[wrap(genome['loco'], L.loco)] ?? THEME_BY_HABITAT[wrap(genome['habitat'], L.habitat)]!;
}

/** The iris ramp each theme's eyes take: eleven themes share the eight ramps (IRIS_RAMP_COUNT). */
export const IRIS_BY_THEME: Readonly<Record<ThemeName, number>> = Object.freeze({
  fire: 0, frost: 1, wild: 1, storm: 2, tide: 3, stone: 4, sand: 4, venom: 5, chem: 5, void: 6, psionic: 7,
});
