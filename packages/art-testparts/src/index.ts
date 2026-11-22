import { readFileSync } from 'node:fs';
import { parseCatalogueText } from '@cf/art-format';
import type { Catalogue, Part } from '@cf/art-format';

let cached: Catalogue | undefined;
let routed: Catalogue | undefined;

/** The placeholder quadruped catalogue (plain blocks and bars, test inputs only), parsed once from quadruped.txt. */
export function testCatalogue(): Catalogue {
  cached ??= parseCatalogueText(readFileSync(new URL('./quadruped.txt', import.meta.url), 'utf8'));
  return cached;
}

/** The entries of two maps; a key in both throws. */
function joined<T>(what: string, a: ReadonlyMap<string, T>, b: ReadonlyMap<string, T>): Map<string, T> {
  for (const key of b.keys()) if (a.has(key)) throw new Error(`bodies.txt: duplicate ${what} ${key}`);
  return new Map([...a, ...b]);
}

/**
 * The placeholder catalogue for the routed builder (buildRoutedRecipe): quadruped.txt, then bodies.txt, the parts only
 * the routed bodies ask for. Each file is parsed on its own; bodies.txt holds no palette. A part of bodies.txt replaces
 * the quadruped.txt part of the same id (the sturdy torso, given a translucent layer); a scaffold, fallback or species
 * in both throws. Parsed once. Removed in Task 17, when the two files merge.
 */
export function routedTestCatalogue(): Catalogue {
  if (routed === undefined) {
    const base = testCatalogue();
    const bodies = parseCatalogueText(readFileSync(new URL('./bodies.txt', import.meta.url), 'utf8'));
    routed = {
      parts: new Map<string, Part>([...base.parts, ...bodies.parts]),
      scaffolds: joined('scaffold', base.scaffolds, bodies.scaffolds),
      palette: base.palette,
      fallbacks: joined('fallback', base.fallbacks, bodies.fallbacks),
      species: joined('species', base.species, bodies.species),
    };
  }
  return routed;
}
