import { readFileSync } from 'node:fs';
import { parseCatalogueText } from '@cf/art-format';
import type { Catalogue } from '@cf/art-format';

let cached: Catalogue | undefined;

/**
 * The placeholder catalogue (plain blocks and bars, test inputs only): a scaffold and the parts buildRecipe asks for,
 * for every family and shape at the medium tier, and a fallback for every family at every tier. Parsed once from
 * quadruped.txt.
 */
export function testCatalogue(): Catalogue {
  cached ??= parseCatalogueText(readFileSync(new URL('./quadruped.txt', import.meta.url), 'utf8'));
  return cached;
}
export const testInterfaceSheetText = (): string => readFileSync(new URL('./interface.txt', import.meta.url), 'utf8');
