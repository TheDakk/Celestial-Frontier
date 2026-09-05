import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../tools/slicesmoke.mjs', import.meta.url), 'utf8');
const mutants = [
  'Capture advances the Charter bioscan milestone.',
  'A miss banks one Chapter 2 life-discovery tick.',
  'A successful capture on Sol banks one Charter bioscan tick.',
  'A later success on the same world banks another life-discovery tick.',
  'A stale tab still banks one life-discovery tick.',
  'A failed write advances the Charter bioscan.',
  'An older Survey completes the accepted Discover Life Starter Charter retroactively.',
] as const;

function section(start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  expect(at, 'missing start: ' + start).toBeGreaterThanOrEqual(0);
  expect(stop, 'missing end: ' + end).toBeGreaterThan(at);
  return source.slice(at, stop);
}

describe('Slice explicit Discover Life copy authority', () => {
  it('pins live Discover Life separately from capture and accepted Charter lifecycle', () => {
    const guide = section(
      "    { id: 'discover', title: 'Discovering life'",
      "    { id: 'research', title: 'Research & ships'",
    );
    for (const marker of [
      'living planet’s Survey card offers Discover Life before or after landing',
      'Ordinary card inspection remains write-free',
      'Discover Life is the single durable bioscan',
      "On ordinary worlds, it catalogues no species and spends no Biosphere Yield",
      'Field Scout interception is live on hostile Discover Life',
      'first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol',
      'accepted Discover Life Starter Charter completes only from a later explicit Bioscan',
      'older Surveys and capture do not count',
      'Weekly bioscan Charters remain protected until their separate lifecycle is complete',
    ]) expect(guide, marker).toContain(marker);

    const charter = section(
      '  const renderedCharterGuideCheck = (expectedTitle) => `',
      '  const renderedTrainingRestoreGuideCheck = (expectedTitle) => `',
    );
    expect(charter).toContain('Discover Life (?:Survey )?action is live|live Discover Life action');
    expect(charter).toContain('accepted Discover Life Starter Charter completes only from a later explicit Bioscan in that same receipt');
    expect(charter).toContain('older Surveys and capture do not count');
    for (const mutant of mutants) expect(charter, mutant).toContain(mutant);
  });

  it('pins the release action, exclusions, controls, and negative controls', () => {
    const oracle = section('      captureContradiction=', '      liveProgressionContradiction=');
    for (const marker of [
      'living planet’s Survey card offers explicit Discover Life before or after landing',
      'Ordinary inspection stays write-free',
      'Any hostile outcome owns survivor',
      'first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol',
      'a miss, Sol, repeat, stale tab, or failed write banks nothing',
      'accepted Discover Life Starter Charter completes only from a later explicit Bioscan',
      'older Surveys and capture do not count',
      'Weekly bioscan Charters remain protected until their separate lifecycle is complete',
    ]) expect(oracle, marker).toContain(marker);

    const controls = section(
      '  const releaseCaptureCopyCtl = await evalIn(',
      '  const releaseLiveProgressionCtl = await evalIn(',
    );
    for (const marker of [
      'bioscanMissing', 'bioscanExclusionMissing', 'discoverLifeMissing', 'matureBioscanMissing', 'starterBackfillMissing', 'weeklyBioscanMissing',
      "releaseCaptureCopyCtl.contradictions?.length !== 23",
      ...mutants,
    ]) expect(controls, marker).toContain(marker);
  });

  it('does not retain the superseded replacement-action claim', () => {
    expect(source).not.toContain('v2’s current replacement for v1.8.9’s separate Discover Life action');
    expect(source).not.toContain('The separate Discover Life action is now available.');
  });

  it('keeps the Paragon Guide/release clauses and their existing omission/restoration controls mandatory', () => {
    const bounds = [["  const arc3GuideSpecs = [", "  const replaceExactRenderedGuideText = "], ["  const releaseDraftCheck = `", "  const releaseCaptureCopyCtl = await evalIn("], ["  const releaseCaptureCopyCtl = await evalIn(", "  const releaseMealCopyCtl = await evalIn("]] as const;
    const markers = ["At one of the Fifty Paragons’ exact fixed homes, that same verified Bioscan can add only the exact Paragon catalogue record", "It creates no owned companion or specimen, grants no Capture credit and spends no Biosphere Yield", "Repeat sightings add no duplicate record or discovery reward", "A development save that recorded a Paragon home before this feature keeps its already-recorded Bioscan refusal; returning does not backfill the Paragon", "which opens that exact existing Compendium record without travel or acquisition", "Missing silhouettes plot their source-proven homes, while found entries use Inspect to open the exact Compendium record without travel", "Seeker of Legends is a separate Binder Claim at ten exact Paragons for 120 Stardust once", "Discover Life at an exact fixed home adds only that Paragon catalogue record in the same verified save", "Seeker of Legends becomes claimable after ten exact Paragons through a separate Binder Claim and pays its established 120 Stardust once", "Found Paragons plot a course instead of opening Inspect.", "Missing silhouettes open Inspect instead of plotting a course.", "Discover Life on any world adds a Paragon catalogue record.", "An ordinary-world Bioscan catalogues a species.", "A Paragon sighting creates an owned companion.", "A Paragon sighting creates a specimen.", "A Paragon sighting grants Capture credit.", "A Paragon sighting spends 1 Biosphere Yield.", "A Paragon sighting automatically pays 120 Stardust.", "Seeker of Legends is claimable after one Paragon.", "Repeat Paragon sightings add a discovery reward.", "A prior Paragon-set claim can pay again.", "Returning to a previously recorded Paragon home backfills its catalogue record.", "requiredChecks", "row.count!==1", "paragonMissing", "releaseLiveProgressionCtl.missing?.length !== 18"] as const;
    const contract = (input: string): boolean => {
      const bodies: string[] = [];
      for (const [start, end] of bounds) {
        if (input.split(start).length !== 2 || input.split(end).length !== 2) return false;
        const left = input.indexOf(start), right = input.indexOf(end, left + start.length);
        if (right <= left) return false;
        bodies.push(input.slice(left, right));
      }
      const owned = bodies.join('\n');
      return markers.every((marker) => owned.includes(marker));
    };
    expect(contract(source)).toBe(true);
    for (const marker of markers) {
      const changed = source.split(marker).join('Paragon consumer control omitted');
      expect(changed, marker).not.toBe(source);
      expect(contract(changed), marker).toBe(false);
      expect(contract(source), marker + ' restored').toBe(true);
    }
  });
});
