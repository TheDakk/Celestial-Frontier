import type { Catalogue } from '@cf/art-format';
import { buildRecipe, RENDERER_VERSION } from '@cf/art-recipe';
import { compose, type Composed } from '@cf/art-compose';

export interface ArtFixtureEntry {
  label: string;
  genome: Record<string, unknown>;
  pose: string;
  hash: string;
  gaps: string[];
  contact: [number, number] | null;
}
export interface ArtFixture { rendererVersion: number; catalogue: string; entries: ArtFixtureEntry[]; }

export interface Mismatch { index: number; label: string; expected: string; actual: string; gapsDiffer: boolean; }
export interface Report { rendererVersion: number; fixtureVersion: number; total: number; matched: number; mismatches: Mismatch[]; }

/** The outcome of recomposing one entry: the composed picture, or the message of what it threw. */
export type EntryResult = { composed: Composed } | { error: string };

/** Recomposes one fixture entry exactly as the golden test does. */
export function composeEntry(catalogue: Catalogue, entry: ArtFixtureEntry): Composed {
  const recipe = buildRecipe(entry.genome, [], catalogue);
  return compose(recipe, entry.pose, catalogue);
}

/** Like composeEntry, but a throw becomes a result so one bad entry cannot stop the rest. */
export function tryComposeEntry(catalogue: Catalogue, entry: ArtFixtureEntry): EntryResult {
  try {
    return { composed: composeEntry(catalogue, entry) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Compares one result per fixture entry with the recorded values. An entry matches only when both its hash and its gaps equal the fixture's. */
export function reportFromResults(fixture: ArtFixture, results: EntryResult[]): Report {
  const mismatches: Mismatch[] = [];
  fixture.entries.forEach((entry, index) => {
    const result = results[index];
    if (result === undefined || 'error' in result) {
      const actual = result === undefined ? 'error: no result' : `error: ${result.error}`;
      mismatches.push({ index, label: entry.label, expected: entry.hash, actual, gapsDiffer: false });
      return;
    }
    const gapsDiffer = JSON.stringify(result.composed.gaps) !== JSON.stringify(entry.gaps);
    if (result.composed.hash !== entry.hash || gapsDiffer) {
      mismatches.push({ index, label: entry.label, expected: entry.hash, actual: result.composed.hash, gapsDiffer });
    }
  });
  return {
    rendererVersion: RENDERER_VERSION,
    fixtureVersion: fixture.rendererVersion,
    total: fixture.entries.length,
    matched: fixture.entries.length - mismatches.length,
    mismatches,
  };
}

/** Recomposes every entry and compares. */
export function buildReport(catalogue: Catalogue, fixture: ArtFixture): Report {
  return reportFromResults(fixture, fixture.entries.map((entry) => tryComposeEntry(catalogue, entry)));
}

/** A pass needs something checked, every entry matching, and the fixture recorded by this renderer version. */
export function verdict(report: Report): { ok: boolean; text: string } {
  if (report.total === 0) return { ok: false, text: 'FAIL: nothing to check (0 entries)' };
  if (report.fixtureVersion !== report.rendererVersion) {
    return { ok: false, text: `FAIL: fixture is renderer version ${report.fixtureVersion}, code is version ${report.rendererVersion}` };
  }
  if (report.matched !== report.total) return { ok: false, text: `FAIL ${report.matched} / ${report.total}` };
  return { ok: true, text: `PASS ${report.matched} / ${report.total}` };
}
