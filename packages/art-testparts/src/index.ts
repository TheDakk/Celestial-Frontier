import { readFileSync } from 'node:fs';
import { parseCatalogueText } from '@cf/art-format';
import type { Catalogue } from '@cf/art-format';

let cached: Catalogue | undefined;

/** The placeholder quadruped catalogue (plain blocks and bars, test inputs only), parsed once from quadruped.txt. */
export function testCatalogue(): Catalogue {
  cached ??= parseCatalogueText(readFileSync(new URL('./quadruped.txt', import.meta.url), 'utf8'));
  return cached;
}
