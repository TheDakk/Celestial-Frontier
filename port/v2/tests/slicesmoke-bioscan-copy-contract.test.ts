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
  'Discover Life completes an accepted bioscan Charter.',
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
      'catalogues no species and spends no Biosphere Yield',
      'Field Scout interception is live on hostile Discover Life',
      'first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol',
      'Accepted and weekly bioscan Charters remain unavailable',
    ]) expect(guide, marker).toContain(marker);

    const charter = section(
      '  const renderedCharterGuideCheck = (expectedTitle) => `',
      '  const renderedTrainingRestoreGuideCheck = (expectedTitle) => `',
    );
    expect(charter).toContain('Discover Life (?:Survey )?action is live|live Discover Life action');
    expect(charter).toContain('accepted Discover-life Charter remains unavailable');
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
      'Accepted and weekly bioscan Charters remain unavailable',
    ]) expect(oracle, marker).toContain(marker);

    const controls = section(
      '  const releaseCaptureCopyCtl = await evalIn(',
      '  const releaseLiveProgressionCtl = await evalIn(',
    );
    for (const marker of [
      'bioscanMissing', 'bioscanExclusionMissing', 'discoverLifeMissing', 'matureBioscanMissing',
      'releaseCaptureCopyCtl.contradictions?.length !== 10',
      ...mutants,
    ]) expect(controls, marker).toContain(marker);
  });

  it('does not retain the superseded replacement-action claim', () => {
    expect(source).not.toContain('v2’s current replacement for v1.8.9’s separate Discover Life action');
    expect(source).not.toContain('The separate Discover Life action is now available.');
  });
});
