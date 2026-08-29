import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const glassSource = readFileSync(path.join(here, '..', 'tools', 'glassmatrix.mjs'), 'utf8');

const BIOSCAN_REQUIRED = Object.freeze([
  'first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol',
  'banks that world’s one Chapter 2 life-discovery tick in the same capture transaction',
  'A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing',
  'v2’s current replacement for v1.8.9’s separate Discover Life action',
  'Survey Records and accepted or weekly bioscan Charters remain unavailable',
]);

const BIOSCAN_CONTRADICTIONS = Object.freeze([
  'A miss banks one Chapter 2 life-discovery tick.',
  'A successful capture on Sol banks one Charter bioscan tick.',
  'A later success on the same world banks another life-discovery tick.',
  'A stale tab still banks one life-discovery tick.',
  'A failed write advances the Charter bioscan.',
]);

const DISCOVER_LIFE_AVAILABILITY_CONTRADICTION =
  'The separate Discover Life action is now available.';

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
    'if (!renderedGuideIngress.ok)',
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
    && occurrences(ingress, 'requiredControls:bioscanRequired') === 1
    && occurrences(ingress,
      'requiredControls:[...bioscanRequired,...breedCharterRequired]') === 2
    && BIOSCAN_REQUIRED.every((copy) => ingress.includes(copy))
    && [...BIOSCAN_CONTRADICTIONS, DISCOVER_LIFE_AVAILABILITY_CONTRADICTION]
      .every((copy) => ingress.includes(copy))
    && !ingress.includes("required:['Capture never banks the Charter’s separate bioscan milestone")
    && !ingress.includes("required:['Planetside capture is separate and never banks the Charter’s bioscan milestone")
    && !ingress.includes("required:['Planetside capture never banks the Charter’s separate bioscan milestone");

  const releaseAssessmentContract = assessment.includes('captureBioscanContradiction=')
    && assessment.includes('discoverLifeAvailabilityContradiction=')
    && assessment.includes("captureText.includes('first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction')")
    && BIOSCAN_REQUIRED.slice(2).every((copy) => assessment.includes(copy))
    && assessment.includes('||captureBioscanContradiction')
    && assessment.includes('&&!captureContradiction&&!discoverLifeAvailabilityContradiction')
    && assessment.includes('honest=!overclaim&&!captureContradiction&&!discoverLifeAvailabilityContradiction')
    && assessment.includes('captureBioscanContradiction,discoverLifeAvailabilityContradiction')
    && !assessment.includes('Capture never banks the Charter’s separate bioscan milestone');

  const releaseControlContract = controls.includes('captureLimitControls.length===9')
    && controls.includes('captureContradictions.length===5')
    && controls.includes('bioscanContradictions.length===6')
    && BIOSCAN_REQUIRED.every((copy) => controls.includes(copy))
    && BIOSCAN_CONTRADICTIONS.every((copy) => controls.includes(copy))
    && controls.includes(DISCOVER_LIFE_AVAILABILITY_CONTRADICTION)
    && controls.includes('row.result?.captureBioscanContradiction===true')
    && controls.includes('row.result?.discoverLifeAvailabilityContradiction===false')
    && controls.includes('discoverLifeAvailabilityChanged&&discoverLifeAvailabilityContradictory?.ok===false')
    && controls.includes('discoverLifeAvailabilityContradictory?.captureBioscanContradiction===false')
    && controls.includes('discoverLifeAvailabilityContradictory?.discoverLifeAvailabilityContradiction===true')
    && !controls.includes('Capture never banks the Charter’s separate bioscan milestone');

  return renderedGuideContract && releaseAssessmentContract && releaseControlContract;
}

describe('Glass Charter bioscan Guide/copy source contract', () => {
  it('binds rendered Guide and release evidence to the durable non-Sol first-success rule', () => {
    expect(glassBioscanCopyContract(glassSource)).toBe(true);
  });

  it('fails closed when any required rule, contradiction, or independent availability control is removed', () => {
    const mutationMarkers = [
      "name:'discover-bioscan'",
      ...BIOSCAN_REQUIRED,
      ...BIOSCAN_CONTRADICTIONS,
      DISCOVER_LIFE_AVAILABILITY_CONTRADICTION,
      'captureBioscanContradiction=',
      'discoverLifeAvailabilityContradiction=',
      'bioscanContradictions.length===6',
      'discoverLifeAvailabilityChanged&&discoverLifeAvailabilityContradictory?.ok===false',
      'discoverLifeAvailabilityContradictory?.discoverLifeAvailabilityContradiction===true',
    ];
    for (const [index, marker] of mutationMarkers.entries()) {
      const mutated = glassSource.replace(marker, `glass-bioscan-mutation-${index}`);
      expect(mutated, marker).not.toBe(glassSource);
      expect(glassBioscanCopyContract(mutated), marker).toBe(false);
    }
  });
});
