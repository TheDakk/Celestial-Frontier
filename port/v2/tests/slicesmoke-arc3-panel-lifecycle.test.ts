import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);

const OWNER_START = '  /* The retained read-only card owns the right-hand glass until its real\n';
const OWNER_END = "  const engineeringRouteClose = await closeEngineeringPanel('Arc 3 route to remnant');";

const GLOBAL_BINDINGS = [
  ['closed lifecycle assessor', 'const assessArc3SurveyClosedRailLifecycle = ({', 1],
  ['dock lifecycle assessor', 'const assessArc3SurveyDockReopenLifecycle = ({', 1],
  ['trusted close event', "pointer?.trusted === true && pointer?.label === 'Close Survey card'", 1],
  ['trusted dock event', "pointer?.trusted === true && pointer?.id === 'docksurvey'", 1],
  ['closed body chrome', 'bodyReleased: surface?.bodyCardOpen === false', 1],
  ['closed Survey chrome', "surface?.survey?.ariaHidden === 'true'", 1],
  ['collapsed dock chrome', "surface?.dock?.ariaExpanded === 'false'", 1],
  ['hittable launcher button', "surface?.shipyard?.buttonId === 'dockshipyard'", 1],
  ['native launcher button', "surface?.shipyard?.buttonTag === 'BUTTON'", 1],
  ['current launcher owner', "rightRailReady: surface?.rightRail?.id === 'dock'", 1],
  ['route preservation', 'canonicalJson(arc3SurveyRouteProjection(beforeState))', 2],
  ['durable preservation', 'durableReadOnly: readOnly.ok === true', 2],
  ['visible Survey chrome', "surface?.survey?.ariaHidden === 'false'", 1],
  ['expanded dock chrome', "surface?.dock?.ariaExpanded === 'true'", 1],
  ['retained row authority', 'exactRetainedSurvey: survey.ok === true', 1],
  ['non-cascading failure guard',
    'const failSliceWithoutCascade = (message, { alreadyReported = false } = {}) => {', 1],
] as const;

const OWNER_MUTATION_TARGETS = [
  ['omitted Close', 'omittedClose: assessArc3SurveyClosedRailLifecycle'],
  ['untrusted Close', 'untrustedClose: assessArc3SurveyClosedRailLifecycle'],
  ['wrong Close', 'wrongClose: assessArc3SurveyClosedRailLifecycle'],
  ['closed-card stale card', 'staleCard: assessArc3SurveyClosedRailLifecycle'],
  ['closed-card stale body', 'staleBody: assessArc3SurveyClosedRailLifecycle'],
  ['closed-card stale Survey', 'staleSurvey: assessArc3SurveyClosedRailLifecycle'],
  ['hidden rail', 'hiddenRail: assessArc3SurveyClosedRailLifecycle'],
  ['closed-card route drift', 'routeDrift: assessArc3SurveyClosedRailLifecycle'],
  ['closed-card durable drift', 'durableDrift: assessArc3SurveyClosedRailLifecycle'],
  ['omitted dock reopen', 'omittedDock: assessArc3SurveyDockReopenLifecycle'],
  ['wrong dock reopen', 'wrongDock: assessArc3SurveyDockReopenLifecycle'],
  ['reopened stale card', 'staleCard: assessArc3SurveyDockReopenLifecycle'],
  ['reopened stale body', 'staleBody: assessArc3SurveyDockReopenLifecycle'],
  ['reopened stale Survey', 'staleSurvey: assessArc3SurveyDockReopenLifecycle'],
  ['collapsed reopened dock', 'collapsedDock: assessArc3SurveyDockReopenLifecycle'],
  ['reopened route drift', 'routeDrift: assessArc3SurveyDockReopenLifecycle'],
  ['reopened durable drift', 'durableDrift: assessArc3SurveyDockReopenLifecycle'],
  ['missing retained row', 'missingRow: assessArc3SurveyDockReopenLifecycle'],
  ['wrong retained row', 'wrongRow: assessArc3SurveyDockReopenLifecycle'],
  ['close controls required', 'if (!biomePreRailAssessment.ok || !biomePreRailControlsIsolated) {'],
  ['dock controls required', 'if (!biomeOwnedDockAssessment.ok || !biomeOwnedDockControlsIsolated) {'],
  ['fixed close required', 'if (!biomeFixedRailAssessment.ok) {'],
] as const;

const OWNER_GUARDS = [
  {
    label: 'pre-purchase Close guard',
    start: '  if (!biomePreRailAssessment.ok || !biomePreRailControlsIsolated) {',
    end: '  const biomeResearchOpenFailureCount = fails.length;',
  },
  {
    label: 'owned dock-reopen guard',
    start: '  if (!biomeOwnedDockAssessment.ok || !biomeOwnedDockControlsIsolated) {',
    end: '  const biomePostAssessment = assessArc3OrbitalSurvey({ observation: biomePostObservation, owned: true });',
  },
  {
    label: 'pre-fabrication Close guard',
    start: '  if (!biomeFixedRailAssessment.ok) {',
    end: '  const biomeFixedOpenFailureCount = fails.length;',
  },
] as const;

const ORDER_RULES = [
  {
    label: 'pre-purchase Survey Close -> Engineering rail opener',
    first: "const biomePreRailClose = await pressArc3SurveyLifecyclePointer('close');",
    second: "const biomeResearchOpen = await openEngineeringPanel('ARC 3 DEEP SCANNERS PURCHASE');",
  },
  {
    label: 'native Deep Scanners action guard -> commit wait',
    first: 'if (!researchTarget.ok || !researchTarget.focused) {',
    second: "await waitDesktopValue('Arc 3 Deep Scanners commit'",
  },
  {
    label: 'Engineering panel Close -> Survey dock reopen',
    first: "const biomePostClose = await closeEngineeringPanel('Arc 3 owned biome Survey');",
    second: "const biomeOwnedDockReopen = await pressArc3SurveyLifecyclePointer('dock');",
  },
  {
    label: 'Survey dock reopen -> owned Mineral row observation',
    first: "const biomeOwnedDockReopen = await pressArc3SurveyLifecyclePointer('dock');",
    second: "'Arc 3 owned biome Survey row',",
  },
  {
    label: 'pre-fabrication Survey Close -> Engineering rail opener',
    first: "const biomeFixedRailClose = await pressArc3SurveyLifecyclePointer('close');",
    second: "const biomeFixedOpen = await openEngineeringPanel('ARC 3 FIXED FABRICATION RETURN');",
  },
] as const;

const MINE_CAUSAL_STOP_RULES = [
  {
    label: 'held Mine baseline -> pending controls',
    finding: "fails.push('ARC 3 MINE HOLD/LIFECYCLE:",
    stop: "failSliceWithoutCascade('ARC 3 MINE HOLD/LIFECYCLE: red held-action baseline stopped",
    dependent: 'const minePendingUiControls = {',
  },
  {
    label: 'held Mine controls -> real Mine release',
    finding: "fails.push('ARC 3 MINE HOLD CONTROLS FAILED",
    stop: "failSliceWithoutCascade('ARC 3 MINE HOLD CONTROLS FAILED: a green mutant stopped",
    dependent: 'const mineReleased = await evalIn',
  },
  {
    label: 'real Mine outcome -> durable deletion controls',
    finding: "fails.push('ARC 3 MINE ACTION: one trusted",
    stop: "failSliceWithoutCascade('ARC 3 MINE ACTION: red native outcome stopped",
    dependent: 'const mineDurableDeletionControls = mineAssessment.ok',
  },
  {
    label: 'durable deletion controls -> later Mine controls',
    finding: "fails.push('ARC 3 ACTION DURABLE-EVIDENCE CONTROLS FAILED",
    stop: "failSliceWithoutCascade('ARC 3 ACTION DURABLE-EVIDENCE CONTROLS FAILED: a green durable mutant stopped",
    dependent: 'const mineReceiptKey = `receipt:${mineBeforeRaw.authority.sessionRng.ordinal}`;',
  },
  {
    label: 'final Mine controls -> Survey',
    finding: "fails.push('ARC 3 MINE ACTION CONTROLS FAILED",
    stop: "failSliceWithoutCascade('ARC 3 MINE ACTION CONTROLS FAILED: a green Mine mutant stopped",
    dependent: "const biomeRouteClose = await closeEngineeringPanel('Arc 3 biome Survey route');",
  },
] as const;

function occurrenceCount(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function extractGuardedOwner(candidate: string): { owner: string; guards: string[]; errors: string[] } {
  const errors: string[] = [];
  if (occurrenceCount(candidate, OWNER_START) !== 1) errors.push('owner start is not unique');
  if (occurrenceCount(candidate, OWNER_END) !== 1) errors.push('owner end is not unique');
  const start = candidate.indexOf(OWNER_START);
  const end = candidate.indexOf(OWNER_END, start + OWNER_START.length);
  const owner = start >= 0 && end > start ? candidate.slice(start, end) : '';
  if (owner.trim().length === 0) errors.push('owner section is empty');
  const guards = OWNER_GUARDS.map(({ label, start: guardStart, end: guardEnd }) => {
    if (occurrenceCount(owner, guardStart) !== 1) errors.push(`${label} start is not unique in owner`);
    if (occurrenceCount(owner, guardEnd) !== 1) errors.push(`${label} end is not unique in owner`);
    const left = owner.indexOf(guardStart);
    const right = owner.indexOf(guardEnd, left + guardStart.length);
    const guard = left >= 0 && right > left ? owner.slice(left, right) : '';
    if (guard.trim().length === 0) errors.push(`${label} is empty`);
    return guard;
  });
  return { owner, guards, errors };
}

function ownerErrors(owner: string): string[] {
  const errors: string[] = [];
  if (owner.trim().length === 0) errors.push('owner section is empty');
  for (const [label, target] of OWNER_MUTATION_TARGETS) {
    const count = occurrenceCount(owner, target);
    if (count !== 1) errors.push(`${label}: expected one in-owner target, got ${count}`);
  }
  for (const { label, first, second } of ORDER_RULES) {
    const firstCount = occurrenceCount(owner, first);
    const secondCount = occurrenceCount(owner, second);
    if (firstCount !== 1 || secondCount !== 1) {
      errors.push(`${label}: non-unique order fields (${firstCount}, ${secondCount})`);
    } else if (owner.indexOf(first) >= owner.indexOf(second)) {
      errors.push(`${label}: reversed`);
    }
  }
  return errors;
}

function mineCausalStopErrors(candidate: string): string[] {
  const errors: string[] = [];
  for (const { label, finding, stop, dependent } of MINE_CAUSAL_STOP_RULES) {
    const findingCount = occurrenceCount(candidate, finding);
    const stopCount = occurrenceCount(candidate, stop);
    const dependentCount = occurrenceCount(candidate, dependent);
    if (findingCount !== 1 || stopCount !== 1 || dependentCount !== 1) {
      errors.push(`${label}: non-unique causal fields (${findingCount}, ${stopCount}, ${dependentCount})`);
      continue;
    }
    const findingIndex = candidate.indexOf(finding);
    const stopIndex = candidate.indexOf(stop);
    const dependentIndex = candidate.indexOf(dependent);
    if (!(findingIndex < stopIndex && stopIndex < dependentIndex)) {
      errors.push(`${label}: red finding does not fail-stop before dependent work`);
    }
  }
  return errors;
}

function swapUnique(owner: string, first: string, second: string, index: number): string {
  expect(occurrenceCount(owner, first)).toBe(1);
  expect(occurrenceCount(owner, second)).toBe(1);
  const marker = `__ARC3_ORDER_MUTANT_${index}__`;
  expect(owner).not.toContain(marker);
  return owner.replace(first, marker).replace(second, first).replace(marker, second);
}

describe('Slice Arc 3 Survey/panel lifecycle evidence', () => {
  const extracted = extractGuardedOwner(source);

  it('extracts one nonempty guarded owner with exact global and in-owner authority', () => {
    expect(extracted.errors).toEqual([]);
    expect(extracted.owner.trim().length).toBeGreaterThan(0);
    expect(extracted.guards).toHaveLength(3);
    expect(extracted.guards.every((guard) => guard.trim().length > 0)).toBe(true);
    for (const [label, binding, expectedCount] of GLOBAL_BINDINGS) {
      expect(occurrenceCount(source, binding), label).toBe(expectedCount);
    }
    expect(ownerErrors(extracted.owner)).toEqual([]);
  });

  it('proves every section-local lifecycle mutant changes its unique owner field and produces its focused red', () => {
    for (const [index, [label, target]] of OWNER_MUTATION_TARGETS.entries()) {
      expect(occurrenceCount(extracted.owner, target), label).toBe(1);
      const marker = `__ARC3_FIELD_MUTANT_${index}__`;
      expect(extracted.owner).not.toContain(marker);
      const mutant = extracted.owner.replace(target, marker);
      expect(mutant, label).not.toBe(extracted.owner);
      expect(mutant, label).toContain(marker);
      expect(occurrenceCount(mutant, target), label).toBe(0);
      expect(ownerErrors(mutant), label).toContain(
        `${label}: expected one in-owner target, got 0`,
      );
    }
  });

  it('makes all five lifecycle/order reversals focused red while retaining both unique fields', () => {
    for (const [index, rule] of ORDER_RULES.entries()) {
      const mutant = swapUnique(extracted.owner, rule.first, rule.second, index);
      expect(mutant, rule.label).not.toBe(extracted.owner);
      expect(occurrenceCount(mutant, rule.first), rule.label).toBe(1);
      expect(occurrenceCount(mutant, rule.second), rule.label).toBe(1);
      expect(ownerErrors(mutant), rule.label).toContain(`${rule.label}: reversed`);
    }
  });

  it('fail-stops every Mine dependency boundary before controls or mutable successor stages', () => {
    expect(mineCausalStopErrors(source)).toEqual([]);
  });

  it('makes every removed or reordered Mine causal stop focused red', () => {
    for (const [index, rule] of MINE_CAUSAL_STOP_RULES.entries()) {
      expect(occurrenceCount(source, rule.stop), rule.label).toBe(1);
      const removed = source.replace(rule.stop, `__ARC3_MINE_STOP_REMOVED_${index}__`);
      expect(mineCausalStopErrors(removed), `${rule.label} removal`).toContain(
        `${rule.label}: non-unique causal fields (1, 0, 1)`,
      );

      const reversed = swapUnique(source, rule.stop, rule.dependent, index + 100);
      expect(mineCausalStopErrors(reversed), `${rule.label} reversal`).toContain(
        `${rule.label}: red finding does not fail-stop before dependent work`,
      );
    }
  });

  it('preserves exact develop/production Slice ledgers and the recovery non-claim', () => {
    expect(source).toContain(
      'const ARC4_SLICE_DEVELOP_LEDGER_EXPECTED_JSON = \'{"schema":"cf-v2-slice-arc4-ledger/v2","assuranceProfile":"develop","stages":["precondition","pending-no-optimism","hit","storage-refusal","stale-convergence","miss","burn-down","disabled-suppression"],"burnSteps":14,"publicationConvergence":"not-selected-by-develop-profile","recoveryClaimed":false,"ok":true}\';',
    );
    expect(source).toContain(
      'const ARC4_SLICE_PRODUCTION_LEDGER_EXPECTED_JSON = \'{"schema":"cf-v2-slice-arc4-ledger/v2","assuranceProfile":"production","stages":["precondition","pending-no-optimism","hit","storage-refusal","stale-convergence","miss","burn-down","disabled-suppression","publication-convergence"],"burnSteps":14,"publicationConvergence":"passed","recoveryClaimed":false,"ok":true}\';',
    );
    expect(source).toContain("if (SLICE_ASSURANCE_PROFILE === 'production') {");
    expect(source).toContain("? 'passed' : 'not-selected-by-develop-profile'");
  });
});
