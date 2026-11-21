import type { Catalogue } from '@cf/art-format';
import { buildRecipe, RENDERER_VERSION } from '@cf/art-recipe';
import { compose, type Composed } from '@cf/art-compose';

export interface ArtFixtureEntry {
  label: string;
  genome: Record<string, unknown>;
  guardian: boolean;
  pose: string;
  hash: string;
  gaps: string[];
}
export interface ArtFixture { rendererVersion: number; catalogue: string; entries: ArtFixtureEntry[]; }

export interface Mismatch { index: number; label: string; expected: string; actual: string; gapsDiffer: boolean; }
export interface Report { rendererVersion: number; total: number; matched: number; mismatches: Mismatch[]; }

/** Recomposes one fixture entry exactly as the golden test does. */
export function composeEntry(catalogue: Catalogue, entry: ArtFixtureEntry): Composed {
  const recipe = buildRecipe(entry.genome, [], catalogue, { guardian: entry.guardian });
  return compose(recipe, entry.pose, catalogue);
}

/** Recomposes every entry. An entry matches only when both its hash and its gaps equal the fixture's. */
export function buildReport(catalogue: Catalogue, fixture: ArtFixture): Report {
  const mismatches: Mismatch[] = [];
  fixture.entries.forEach((entry, index) => {
    const actual = composeEntry(catalogue, entry);
    const gapsDiffer = JSON.stringify(actual.gaps) !== JSON.stringify(entry.gaps);
    if (actual.hash !== entry.hash || gapsDiffer) {
      mismatches.push({ index, label: entry.label, expected: entry.hash, actual: actual.hash, gapsDiffer });
    }
  });
  return {
    rendererVersion: RENDERER_VERSION,
    total: fixture.entries.length,
    matched: fixture.entries.length - mismatches.length,
    mismatches,
  };
}
