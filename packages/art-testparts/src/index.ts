import { readFileSync } from 'node:fs';
import { parseCatalogueText } from '@cf/art-format';
import type { Catalogue } from '@cf/art-format';

const read = (name: string): string => readFileSync(new URL(name, import.meta.url), 'utf8');
/** The placeholder pack's text (quadruped.txt): a palette and its parts, a catalogue alone. */
export const testPartsText = (): string => read('./quadruped.txt');
/** The placeholder species pack's text (species.txt): read after testPartsText, it does not parse alone. */
export const testSpeciesPackText = (): string => read('./species.txt');

let cached: Catalogue | undefined;

/**
 * The placeholder catalogue (plain blocks and bars, test inputs only): a scaffold and the parts buildRecipe asks for,
 * for every family and shape at the medium tier, and a fallback for every family at every tier. Parsed once from
 * quadruped.txt.
 */
export function testCatalogue(): Catalogue {
  cached ??= parseCatalogueText(testPartsText());
  return cached;
}

let cachedSpecies: Catalogue | undefined;

/**
 * The placeholder catalogue with the placeholder named species read after it (species.txt): a bird of family `avian`
 * (template `biped-bird`), a headless urchin of family `radial`, a snail of family `gastropod` with no windup or strike,
 * and a plant of family `flora` (template `plant`), each on its own scaffold at the medium tier. A catalogue of its own:
 * testCatalogue holds none of it.
 */
export function testSpeciesCatalogue(): Catalogue {
  cachedSpecies ??= parseCatalogueText(`${testPartsText()}\n${testSpeciesPackText()}`);
  return cachedSpecies;
}
export const testInterfaceSheetText = (): string => read('./interface.txt');
