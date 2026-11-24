import type { Catalogue } from '@cf/art-format';
import { buildRecipe, buildSpeciesRecipe } from './recipe';
import type { Condition, Recipe } from './recipe';

/** The start of the gap a named species leaves when the catalogue holds no pack for it: `species:<key>`. */
const SPECIES_GAP = 'species:';

/** A genome field that is set: a string that is not empty, as the game reads `_earthName` and `_earthBlend`. */
const isSet = (value: unknown): value is string => typeof value === 'string' && value !== '';

/**
 * The key of the species pack a genome is drawn from: its Earth name (`_earthName`) in lower case, letters and digits
 * only ('Harpy Eagle' is 'harpyeagle', "Devil's Club" 'devilsclub'). Null when the genome has no Earth name, when it is
 * an Earth blend (`_earthBlend` set: a bred creature, not the named species), or when the name holds no letter or digit.
 */
export function speciesKeyOf(genome: Readonly<Record<string, unknown>>): string | null {
  const name = genome._earthName;
  if (!isSet(name) || isSet(genome._earthBlend)) return null;
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return key === '' ? null : key;
}

/**
 * The recipe a creature is drawn from. A named species (speciesKeyOf) whose pack the catalogue holds takes its species
 * recipe (buildSpeciesRecipe): one look, whatever the lineage or condition. One whose pack it lacks takes the generated
 * recipe (buildRecipe) with the gap `species:<key>` after its own gaps. Every other genome takes the generated recipe.
 */
export function recipeFor(
  genome: Readonly<Record<string, unknown>>,
  lineage: readonly string[],
  catalogue: Catalogue,
  condition?: Condition,
): Recipe {
  const key = speciesKeyOf(genome);
  if (key !== null && catalogue.species.has(key)) return buildSpeciesRecipe(key, catalogue);
  const generated = buildRecipe(genome, lineage, catalogue, condition);
  if (key === null) return generated;
  return Object.freeze({ ...generated, gaps: Object.freeze([...generated.gaps, `${SPECIES_GAP}${key}`]) });
}
