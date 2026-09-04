import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const glassSource = readFileSync(path.join(here, '..', 'tools', 'glassmatrix.mjs'), 'utf8');

const DISCOVER_LIFE_REQUIRED = Object.freeze([
  'living planet’s Survey card offers Discover Life before or after landing',
  'Ordinary card inspection remains write-free',
  'records that exact living world and resolves one deterministic hazard draw',
  'catalogues no species and spends no Biosphere Yield',
  'assigned Field Scout takes the nonlethal wound and is capped at Critical',
  'otherwise the explorer remains at or above 1 HP',
]);

const BIOSCAN_REQUIRED = Object.freeze([
  'first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol',
  'banks that world’s one Chapter 2 life-discovery tick in the same capture transaction',
  'A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing',
  'Chapter 2 capture milestone is separate from the live Discover Life action',
  'Accepted and weekly bioscan Charters remain unavailable',
]);

const BIOSCAN_CONTRADICTIONS = Object.freeze([
  'Capture completes an accepted or weekly bioscan Charter.',
  'Ordinary Survey inspection records the living world.',
  'Discover Life catalogues one species.',
  'Discover Life spends 1 Biosphere Yield.',
  'A safe Discover Life scan grants survivor.',
  'A Scout-intercepted hostile Discover Life scan grants no survivor.',
]);

const DISCOVER_LIFE_CONTRADICTION =
  'Discover Life completes an accepted bioscan Charter.';

function exactSpan(source: string, start: string, end: string): string | null {
  const startIndex = source.indexOf(start);
  if (startIndex < 0 || startIndex !== source.lastIndexOf(start)) return null;
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (endIndex < 0 || endIndex !== source.lastIndexOf(end)) return null;
  return source.slice(startIndex, endIndex);
}

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function glassBioscanCopyContract(source: string): boolean {
  const ingress = exactSpan(
    source,
    'const renderedGuideIngress = await evalIn',
    'const guideReleaseBaseline = await evalIn',
  );
  const assessment = exactSpan(
    source,
    'const developmentDetailCheck = `',
    'const developmentDetail = await evalIn(developmentDetailCheck);',
  );
  const controls = exactSpan(
    source,
    'const detailControls = await evalIn',
    'if (!detailControls.ok)',
  );
  if (!ingress || !assessment || !controls) return false;

  const renderedGuideContract = ingress.includes("name:'discover-bioscan'")
    && occurrences(ingress,
      'requiredControls:[...discoverLifeRequired,...bioscanRequired]') === 1
    && occurrences(ingress,
      'requiredControls:[...bioscanRequired,...breedCharterRequired]') === 2
    && DISCOVER_LIFE_REQUIRED.every((copy) => ingress.includes(copy))
    && BIOSCAN_REQUIRED.every((copy) => ingress.includes(copy))
    && BIOSCAN_CONTRADICTIONS
      .every((copy) => ingress.includes(copy))
    && !ingress.includes("required:['Capture never banks the Charter’s separate bioscan milestone")
    && !ingress.includes("required:['Planetside capture is separate and never banks the Charter’s bioscan milestone")
    && !ingress.includes("required:['Planetside capture never banks the Charter’s separate bioscan milestone")
    && !ingress.includes('v2’s current replacement for v1.8.9’s separate Discover Life action')
    && !ingress.includes('Survey Records and accepted or weekly bioscan Charters remain unavailable');

  const releaseAssessmentContract = assessment.includes('captureBioscanContradiction=')
    && assessment.includes('discoverLifeContradiction=')
    && assessment.includes("captureText.includes('living planet’s Survey card offers explicit Discover Life before or after landing')")
    && assessment.includes("captureText.includes('Ordinary inspection stays write-free')")
    && assessment.includes("captureText.includes('action records that exact world and resolves one shown deterministic hazard without cataloguing a species or spending Biosphere Yield')")
    && assessment.includes("captureText.includes('Any hostile outcome owns survivor in that same receipt whether Scout or explorer absorbs the wound')")
    && assessment.includes("captureText.includes('safe scans do not')")
    && assessment.includes("captureText.includes('Capture remains a separate landed action')")
    && assessment.includes("captureText.includes('first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction')")
    && assessment.includes("captureText.includes('That Chapter 2 milestone is separate from Discover Life')")
    && assessment.includes("captureText.includes('Accepted and weekly bioscan Charters remain unavailable')")
    && assessment.includes('||captureBioscanContradiction')
    && assessment.includes('&&!captureContradiction&&!discoverLifeContradiction')
    && assessment.includes('honest=!overclaim&&!captureContradiction&&!discoverLifeContradiction')
    && assessment.includes('captureBioscanContradiction,discoverLifeContradiction')
    && !assessment.includes('discoverLifeAvailabilityContradiction=')
    && !assessment.includes('v2’s current replacement for v1.8.9’s separate Discover Life action');

  const releaseControlContract = controls.includes('captureLimitControls.length===11')
    && controls.includes('captureContradictions.length===5')
    && controls.includes('bioscanContradictions.length===6')
    && controls.includes('living planet’s Survey card offers explicit Discover Life before or after landing')
    && controls.includes('Any hostile outcome owns survivor in that same receipt whether Scout or explorer absorbs the wound')
    && controls.includes('Capture remains a separate landed action')
    && controls.includes('Accepted and weekly bioscan Charters remain unavailable')
    && BIOSCAN_CONTRADICTIONS.every((copy) => controls.includes(copy))
    && controls.includes(DISCOVER_LIFE_CONTRADICTION)
    && controls.includes('row.result?.discoverLifeContradiction===true')
    && controls.includes('discoverLifeChanged&&discoverLifeContradictory?.ok===false')
    && controls.includes('discoverLifeContradictory?.discoverLifeContradiction===true')
    && !controls.includes('discoverLifeAvailabilityContradiction')
    && !controls.includes('v2’s current replacement for v1.8.9’s separate Discover Life action');

  return renderedGuideContract && releaseAssessmentContract && releaseControlContract;
}

describe('Glass Charter bioscan Guide/copy source contract', () => {
  it('binds rendered Guide and release evidence to the durable non-Sol first-success rule', () => {
    expect(glassBioscanCopyContract(glassSource)).toBe(true);
  });

  it('fails closed when any required rule, contradiction, or independent availability control is removed', () => {
    const mutationMarkers = [
      "name:'discover-bioscan'",
      ...DISCOVER_LIFE_REQUIRED,
      ...BIOSCAN_REQUIRED,
      ...BIOSCAN_CONTRADICTIONS,
      DISCOVER_LIFE_CONTRADICTION,
      'captureBioscanContradiction=',
      'discoverLifeContradiction=',
      'captureLimitControls.length===11',
      'bioscanContradictions.length===6',
      'discoverLifeChanged&&discoverLifeContradictory?.ok===false',
      'discoverLifeContradictory?.discoverLifeContradiction===true',
    ];
    for (const [index, marker] of mutationMarkers.entries()) {
      const mutated = glassSource.replace(marker, `glass-bioscan-mutation-${index}`);
      expect(mutated, marker).not.toBe(glassSource);
      expect(glassBioscanCopyContract(mutated), marker).toBe(false);
    }
  });
});
