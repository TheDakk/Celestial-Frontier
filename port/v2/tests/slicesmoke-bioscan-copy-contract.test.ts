import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);

const scopedRule = 'first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol banks that world’s one Chapter 2 life-discovery tick in the same capture transaction';
const scopedReleaseRule = scopedRule.replace('Sol banks', 'Sol also banks');
const excludedOutcomes = 'A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing';
const discoverLifeReplacement = 'v2’s current replacement for v1.8.9’s separate Discover Life action';
const unavailableMatureSystems = 'Survey Records and accepted or weekly bioscan Charters remain unavailable';

const bioscanMutants = [
  'Capture advances the Charter bioscan milestone.',
  'A miss banks one Chapter 2 life-discovery tick.',
  'A successful capture on Sol banks one Charter bioscan tick.',
  'A later success on the same world banks another life-discovery tick.',
  'A stale tab still banks one life-discovery tick.',
  'A failed write advances the Charter bioscan.',
  'The separate Discover Life action is now available.',
] as const;

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  expect(at, `missing section start: ${start}`).toBeGreaterThanOrEqual(0);
  expect(stop, `missing section end: ${end}`).toBeGreaterThan(at);
  return source.slice(at, stop);
}

function runtimeCapturePattern(owner: string, marker: string): RegExp {
  const line = owner.split('\n').find((candidate) => candidate.includes(marker));
  expect(line, `missing capture contradiction: ${marker}`).toBeDefined();
  const literal = line!.match(/\/(.*)\/i[.]test\(captureText\)/);
  expect(literal, `malformed capture contradiction: ${marker}`).not.toBeNull();
  return new RegExp(literal![1]!.replaceAll('\\\\', '\\'), 'i');
}

describe('Slice bioscan player-copy contract', () => {
  it('requires the exact durable per-world rule in Discover, Charter, Ascent, and release evidence', () => {
    const discoverGuide = section(
      sliceSource,
      "    { id: 'discover', title: 'Discovering life'",
      "    { id: 'research', title: 'Research & ships'",
    );
    for (const marker of [scopedReleaseRule, excludedOutcomes, discoverLifeReplacement, unavailableMatureSystems]) {
      expect(discoverGuide, marker).toContain(marker);
    }
    for (const mutant of bioscanMutants) expect(discoverGuide, mutant).toContain(mutant);

    const charterGuide = section(
      sliceSource,
      '  const renderedCharterGuideCheck = (expectedTitle) => `',
      '  const renderedTrainingRestoreGuideCheck = (expectedTitle) => `',
    );
    for (const marker of [scopedRule, excludedOutcomes, unavailableMatureSystems]) {
      expect(charterGuide, marker).toContain(marker);
    }
    expect(charterGuide).toContain('v2’s current replacement for v1[.]8[.]9’s separate Discover Life action');
    for (const mutant of bioscanMutants) expect(charterGuide, mutant).toContain(mutant);

    const releaseOracle = section(
      sliceSource,
      '      captureContradiction=',
      '      audioContradiction=',
    );
    for (const marker of [scopedReleaseRule, excludedOutcomes, discoverLifeReplacement, unavailableMatureSystems]) {
      expect(releaseOracle, marker).toContain(marker);
    }
    expect(sliceSource).not.toContain('Capture never banks the Charter’s separate bioscan milestone');
    expect(sliceSource).not.toContain('writer remains unavailable');
  });

  it('uses the release oracle itself to reject unscoped, miss, Sol, repeat, stale, failed-write, and standalone-action claims', () => {
    const releaseOracle = section(
      sliceSource,
      '      captureContradiction=',
      '      audioContradiction=',
    );
    const patterns = [
      runtimeCapturePattern(releaseOracle, 'source-proven world beyond Sol'),
      runtimeCapturePattern(releaseOracle, '(?:miss|later success|repeat|stale tab|failed write)'),
      runtimeCapturePattern(releaseOracle, '(?:on|in) Sol'),
      runtimeCapturePattern(releaseOracle, '(?:separate )?Discover Life action'),
    ];
    const contradicts = (copy: string) => patterns.some((pattern) => pattern.test(copy));

    expect(contradicts(`The ${scopedReleaseRule}. ${excludedOutcomes}. This is ${discoverLifeReplacement}; ${unavailableMatureSystems}.`)).toBe(false);
    expect(contradicts(`The ${scopedRule}. ${excludedOutcomes}. This is ${discoverLifeReplacement}; ${unavailableMatureSystems}.`)).toBe(false);
    for (const mutant of bioscanMutants) expect(contradicts(mutant), mutant).toBe(true);
  });

  it('negative-controls every release mutation and does not blacklist the live Chapter 2 goal', () => {
    const releaseControls = section(
      sliceSource,
      '  const releaseCaptureCopyCtl = await evalIn(',
      '  const releaseMealCopyCtl = await evalIn(',
    );
    for (const marker of [
      'bioscanMissing', 'bioscanExclusionMissing', 'discoverLifeMissing', 'matureBioscanMissing',
      'releaseCaptureCopyCtl.contradictions?.length !== 10',
      ...bioscanMutants,
    ]) expect(releaseControls, marker).toContain(marker);

    const charterPanel = section(
      sliceSource,
      '  /* CHARTERS: every rendered goal has a live Land/Mine/fixed-Fabricator,',
      '  /* 4c-release.',
    );
    expect(charterPanel).toContain("marker.textContent='Conquer a world'");
    expect(charterPanel).toContain("marker.textContent='Discover life on 2 alien worlds'");
    expect(charterPanel).toContain('hasUnavailableCharterDirective(chp.bioscanInjected)');
    expect(charterPanel).toContain('hasLiveBioscanCharterDirective(chp.bioscanInjected)');
    expect(section(
      sliceSource,
      'const hasUnavailableCharterDirective =',
      '/* Legacy decodeWhere',
    )).not.toContain('/Discover life on 2 alien worlds|');
  });
});
