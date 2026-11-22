import { readFileSync } from 'node:fs';
import { parseCatalogueText } from '@cf/art-format';
import type { Catalogue } from '@cf/art-format';

let cached: Catalogue | undefined;
let routed: Catalogue | undefined;

/** The placeholder quadruped catalogue (plain blocks and bars, test inputs only), parsed once from quadruped.txt. */
export function testCatalogue(): Catalogue {
  cached ??= parseCatalogueText(readFileSync(new URL('./quadruped.txt', import.meta.url), 'utf8'));
  return cached;
}

/** The one part bodies.txt may hold that quadruped.txt also holds: the sturdy torso, given a translucent layer. */
export const REPLACED_PART = 'quadruped/torso/sturdy/medium/v0';

/** The entries of two maps; a key in both throws, except the `allowed` one, which takes b's value. */
function joined<T>(what: string, a: ReadonlyMap<string, T>, b: ReadonlyMap<string, T>, allowed?: string): Map<string, T> {
  for (const key of b.keys()) if (a.has(key) && key !== allowed) throw new Error(`bodies.txt: duplicate ${what} ${key}`);
  return new Map([...a, ...b]);
}

/**
 * The quadruped.txt catalogue followed by the bodies.txt one: parts, scaffolds, fallbacks and species of both, the
 * palette of the first. A repeated id throws, except REPLACED_PART, which bodies.txt's version replaces.
 * Removed in Task 17, when the two files merge.
 */
export function joinBodies(base: Catalogue, bodies: Catalogue): Catalogue {
  return {
    parts: joined('part', base.parts, bodies.parts, REPLACED_PART),
    scaffolds: joined('scaffold', base.scaffolds, bodies.scaffolds),
    palette: base.palette,
    fallbacks: joined('fallback', base.fallbacks, bodies.fallbacks),
    species: joined('species', base.species, bodies.species),
  };
}

/**
 * The placeholder catalogue for the routed builder (buildRoutedRecipe): quadruped.txt, then bodies.txt (joinBodies),
 * which holds a scaffold and the parts the routed planner asks for for every family and shape at the medium tier.
 * Each file is parsed on its own; bodies.txt holds no palette. Parsed once. Removed in Task 17, when the files merge.
 */
export function routedTestCatalogue(): Catalogue {
  routed ??= joinBodies(testCatalogue(), parseCatalogueText(readFileSync(new URL('./bodies.txt', import.meta.url), 'utf8')));
  return routed;
}
