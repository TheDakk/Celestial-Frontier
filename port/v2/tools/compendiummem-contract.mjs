/* Pure contract for the Compendium real-browser budget gate.

   The browser collector records raw product/CDP/DOM observations. This file
   turns those observations into a sealed outcome inventory and verifies the
   current-run report. Keeping this layer browser-free lets the selftest break
   every required dimension independently without trusting Chromium. */
import crypto from 'node:crypto';

export const REPORT_SCHEMA = 'cf-v2-compendium-memory-report/v1';
export const BUDGET_SCHEMA = 'cf-v2-compendium-memory-budget/v1';
export const DIAGNOSTICS_SCHEMA = 'cf-v2-compendium-diagnostics/v1';
export const ART_DIAGNOSTICS_SCHEMA = 'cf-v2-species-art-diagnostics/v1';
export const PROFILES = Object.freeze(['phone', 'desktop']);
export const COMMAND_TIMEOUT_MS = 2000;
export const CANDIDATE_TRANSPORT_TIMEOUT_MS = 5000;
export const BASELINE_OBSERVATION_TIMEOUT_MS = 180000;
export const CANDIDATE_BROWSER_LABEL = 'Compendium memory/resource gate';
export const CANDIDATE_CDP_TIMEOUT_SCHEMA = 'cf-v2-compendium-cdp-timeout/v1';
export const CANDIDATE_COMMAND_SCHEMA = 'cf-v2-compendium-candidate-command/v1';
export const PLAIN_EVALUATE_COMMAND_SCHEMA = 'cf-v2-compendium-plain-evaluate-command/v1';
export const RAW_CDP_COMMAND_SCHEMA = 'cf-v2-compendium-raw-cdp-command/v1';
export const PARTIAL_FAILURE_SCHEMA = 'cf-v2-compendium-partial-failure/v1';
export const PARTIAL_PROFILE_SCHEMA = 'cf-v2-compendium-partial-profile/v4';
export const FILTER_TRANSITION_SCHEMA = 'cf-v2-compendium-filter-transition/v3';
export const REQUIRED_WARM_CYCLES = 4;
export const OUTCOME_IDS = Object.freeze([
  'input-fixture-1500-distinct',
  'lazy-art-not-eager',
  'list-populated',
  'list-source-count-1500',
  'first-row-reached',
  'middle-row-reached',
  'last-row-reached',
  'filter-result',
  'detail-opened',
  'back-restores-focus',
  'close-restores-focus',
  'close-dom-cleanup',
  'focus-row-pinned',
  'planetside-bounded',
  'planetside-hide-release-reacquire',
  'mounted-window-bounded',
  'mounted-natural-dimensions',
  'list-source-132',
  'art-release',
  'art-disposal',
  'art-dedupe',
  'full-identity-key',
  'generation-guard',
  'error-contained',
  'error-recoverable',
  'cap-shrink',
  'canvas-thumb-path',
  'no-full-portrait-thumb-path',
  'settled-jobs',
  'resource-live-limits',
  'warm-plateau',
  'heap-ceiling',
  'dom-ceiling',
  'byte-ceiling',
  'target-answerable-first',
  'heartbeat-first',
  'target-answerable-last',
  'heartbeat-last',
]);
export const EXPECTED_OUTCOMES = Object.freeze(PROFILES.flatMap((profile) =>
  OUTCOME_IDS.map((id) => `${profile}/${id}`)));
export const REPORT_INPUT_KEYS = Object.freeze([
  'fixtureSpec', 'fixtureRows', 'fixtureGenerator', 'budget', 'budgetSchema',
  'outcomeContract', 'collector', 'package', 'packageLock', 'appPackage',
  'baselineSaveFixtures', 'outcomeInventory',
]);
export const REVIEW_PACKET_STATES = Object.freeze(['list', 'detail', 'focus-pinned']);
export const BROKEN_BASELINE_EXPECTED_FAULTS = Object.freeze([
  'unwindowed-1500-rows', 'list-source-440',
  'full-portrait-dom-exposure', 'eager-art-import',
]);
export const BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA =
  'cf-v2-compendium-broken-thumb-observer/v1';
export const BROKEN_BASELINE_THUMB_CACHE_CAP = 600;
export const BROKEN_BASELINE_PORTRAIT_CACHE_CAPS = Object.freeze({ phone: 96, desktop: 256 });
export const COMPENDIUM_RAW_SNAPSHOT_REQUIRED_TOKENS = Object.freeze([
  'return {diagnostics:d,raw:{',
  'mountedRowCount:', 'mountedLogicalIds:', 'rowRects:',
  'listImages:', 'planetsideImages:',
  'detailNaturalWidth:', 'detailNaturalHeight:', 'detailImageCount:', 'detailSrcPresent:',
  'activeLogicalId:', 'activeElementId:', 'focusedOutsideNormalWindow:',
  'viewportHeight:', 'scrollerHeight:', 'scrollTop:', 'focusRing:',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function nonnegative(value) { return finite(value) && value >= 0; }
function integer(value) { return Number.isSafeInteger(value); }
function sameJson(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function exactKeys(value, expected, where, errors) {
  if (!isObject(value)) { errors.push(`${where} must be an object`); return false; }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (!sameJson(actual, wanted)) {
    errors.push(`${where} keys must be exactly ${wanted.join(', ')}`);
    return false;
  }
  return true;
}

const FILTER_ART_LIVE_FIELDS = Object.freeze([
  'cacheEntries', 'decodedPixels', 'decodedBytes', 'encodedBytes',
  'queuedJobs', 'activeJobs', 'leases', 'subscribers',
  'portraitCacheEntries', 'portraitEncodedBytes',
]);
const FILTER_ART_TOTAL_FIELDS = Object.freeze([
  'leaseAcquires', 'releases', 'jobStarts', 'jobCompletes', 'jobCancels',
  'jobErrors', 'dedupeHits', 'disposals', 'thumbCanvasRenders',
  'fullPortraitRendersForThumb', 'fullPortraitDecodesForThumb',
  'maxQueuedJobs', 'maxActiveJobs',
]);

function validFilterArtTelemetry(art) {
  return isObject(art)
    && sameJson(Object.keys(art).sort(), ['live', 'totals'])
    && isObject(art.live) && isObject(art.totals)
    && sameJson(Object.keys(art.live).sort(), [...FILTER_ART_LIVE_FIELDS].sort())
    && sameJson(Object.keys(art.totals).sort(), [...FILTER_ART_TOTAL_FIELDS].sort())
    && FILTER_ART_LIVE_FIELDS.every((field) => nonnegative(art.live[field]))
    && FILTER_ART_TOTAL_FIELDS.every((field) => nonnegative(art.totals[field]));
}

export function validFilterTelemetrySnapshot(snapshot) {
  return isObject(snapshot)
    && sameJson(Object.keys(snapshot).sort(), ['art', 'generation'])
    && integer(snapshot.generation) && snapshot.generation >= 0
    && validFilterArtTelemetry(snapshot.art);
}

/* Poll rows stay deliberately cheap: the collector reads only Search and the
   Compendium panel's DOM carrier. Full generation/art diagnostics are sampled
   once around the native edit and stored separately in the witness. */
export function validFilterInputObservation(observation) {
  const keys = [
    'ready', 'focused', 'value', 'selectionStart', 'selectionEnd', 'panelMode',
  ];
  if (!isObject(observation) || !sameJson(Object.keys(observation).sort(), keys.sort())
    || typeof observation.ready !== 'boolean'
    || typeof observation.focused !== 'boolean'
    || typeof observation.value !== 'string'
    || typeof observation.panelMode !== 'string') return false;
  const start = observation.selectionStart;
  const end = observation.selectionEnd;
  if (start === null || end === null) return start === null && end === null;
  return integer(start) && integer(end) && start >= 0 && end >= start
    && end <= observation.value.length;
}

export function validFilterTransitionObservation(observation) {
  const keys = [
    'ready', 'mode', 'query', 'filteredCount', 'sourceCount', 'generation', 'art',
  ];
  return isObject(observation)
    && sameJson(Object.keys(observation).sort(), keys.sort())
    && typeof observation.ready === 'boolean'
    && typeof observation.mode === 'string'
    && typeof observation.query === 'string'
    && integer(observation.filteredCount) && observation.filteredCount >= 0
    && integer(observation.sourceCount) && observation.sourceCount >= 0
    && integer(observation.generation) && observation.generation >= 0
    && validFilterArtTelemetry(observation.art);
}

export function validFilterTargetObservation(observation) {
  const keys = ['ready', 'x', 'y'];
  return isObject(observation) && sameJson(Object.keys(observation).sort(), keys.sort())
    && typeof observation.ready === 'boolean'
    && (observation.ready
      ? finite(observation.x) && finite(observation.y)
      : observation.x === null && observation.y === null);
}

function validFilterTargetObservationGroup(group) {
  const keys = ['accepted', 'falsyObservations', 'observationCount'];
  if (!isObject(group) || !sameJson(Object.keys(group).sort(), keys.sort())
    || !integer(group.observationCount) || group.observationCount < 0
    || !Array.isArray(group.falsyObservations)
    || !group.falsyObservations.every((observation) =>
      validFilterTargetObservation(observation) && observation.ready === false)
    || (group.accepted !== null
      && (!validFilterTargetObservation(group.accepted) || group.accepted.ready !== true))) return false;
  return group.observationCount === group.falsyObservations.length
    + (group.accepted === null ? 0 : 1);
}

function validFilterInputObservationGroup(group) {
  const keys = ['accepted', 'falsyObservations', 'observationCount'];
  if (!isObject(group) || !sameJson(Object.keys(group).sort(), keys.sort())
    || !integer(group.observationCount) || group.observationCount < 0
    || !Array.isArray(group.falsyObservations)
    || !group.falsyObservations.every((observation) =>
      validFilterInputObservation(observation) && observation.ready === false)
    || (group.accepted !== null
      && (!validFilterInputObservation(group.accepted) || group.accepted.ready !== true))) return false;
  return group.observationCount === group.falsyObservations.length
    + (group.accepted === null ? 0 : 1);
}

function validAcceptedSelection(observation, priorValue, panelMode) {
  return observation?.ready === true && observation.focused === true
    && observation.value === priorValue && observation.selectionStart === 0
    && observation.selectionEnd === priorValue.length
    && observation.panelMode === panelMode;
}

function validAcceptedFocus(observation, panelMode) {
  return observation?.ready === true && observation.focused === true
    && observation.panelMode === panelMode;
}

function validAcceptedClear(observation, panelMode) {
  return observation?.ready === true && observation.focused === true
    && observation.value === '' && observation.selectionStart === 0
    && observation.selectionEnd === 0 && observation.panelMode === panelMode;
}

function validAcceptedExactInput(observation, expectedValue, panelMode) {
  return observation?.ready === true && observation.focused === true
    && observation.value === expectedValue
    && observation.selectionStart === expectedValue.length
    && observation.selectionEnd === expectedValue.length
    && observation.panelMode === panelMode;
}

export function validFilterTransitionWitness(witness, { allowPending = false } = {}) {
  const keys = [
    'schema', 'entryMode', 'expectedQuery', 'expectedFilteredCount',
    'entryTarget', 'reopenTarget', 'focus',
    'beforeShortcut', 'selection', 'cleared', 'afterClear', 'exactInput', 'inputTelemetry',
    'baselineGeneration', 'observationCount', 'falsyObservations',
    'settled', 'generationDelta',
  ];
  const expectedPanelMode = witness?.entryMode === 'visible' ? 'list' : 'closed';
  if (!isObject(witness) || !sameJson(Object.keys(witness).sort(), keys.sort())
    || witness.schema !== FILTER_TRANSITION_SCHEMA
    || !['visible', 'hidden', 'reopen'].includes(witness.entryMode)
    || typeof witness.expectedQuery !== 'string'
    || !integer(witness.expectedFilteredCount) || witness.expectedFilteredCount < 0
    || (witness.entryMode === 'visible'
      ? witness.entryTarget !== null
      : !validFilterTargetObservationGroup(witness.entryTarget))
    || (witness.entryMode === 'reopen'
      ? !validFilterTargetObservationGroup(witness.reopenTarget)
      : witness.reopenTarget !== null)
    || !validFilterInputObservationGroup(witness.focus)
    || (witness.beforeShortcut !== null
      && !validFilterTelemetrySnapshot(witness.beforeShortcut))
    || !validFilterInputObservationGroup(witness.selection)
    || !validFilterInputObservationGroup(witness.cleared)
    || (witness.afterClear !== null && !validFilterTelemetrySnapshot(witness.afterClear))
    || !validFilterInputObservationGroup(witness.exactInput)
    || (witness.inputTelemetry !== null
      && !validFilterTelemetrySnapshot(witness.inputTelemetry))
    || (witness.baselineGeneration !== null
      && (!integer(witness.baselineGeneration) || witness.baselineGeneration < 0))
    || !integer(witness.observationCount) || witness.observationCount < 0
    || !Array.isArray(witness.falsyObservations)
    || !witness.falsyObservations.every((observation) =>
      validFilterTransitionObservation(observation) && observation.ready === false
        && !(observation.mode === 'list'
          && observation.query === witness.expectedQuery
          && observation.filteredCount === witness.expectedFilteredCount))) return false;
  const focusAccepted = witness.focus.accepted;
  const selectionAccepted = witness.selection.accepted;
  const clearAccepted = witness.cleared.accepted;
  const exactInputAccepted = witness.exactInput.accepted;
  const falsyMatches = (group, predicate) => group.falsyObservations.some((observation) =>
    predicate({ ...observation, ready: true }));
  if ((focusAccepted !== null && !validAcceptedFocus(focusAccepted, expectedPanelMode))
    || falsyMatches(witness.focus, (observation) =>
      validAcceptedFocus(observation, expectedPanelMode))
    || (witness.beforeShortcut !== null && focusAccepted === null)
    || (witness.selection.observationCount > 0
      && (focusAccepted === null || witness.beforeShortcut === null))
    || (selectionAccepted !== null && (focusAccepted === null
      || witness.beforeShortcut === null
      || !validAcceptedSelection(selectionAccepted, focusAccepted.value, expectedPanelMode)))
    || (focusAccepted !== null && falsyMatches(witness.selection, (observation) =>
      validAcceptedSelection(observation, focusAccepted.value, expectedPanelMode)))
    || (witness.cleared.observationCount > 0 && selectionAccepted === null)
    || (clearAccepted !== null && (selectionAccepted === null
      || !validAcceptedClear(clearAccepted, expectedPanelMode)))
    || falsyMatches(witness.cleared, (observation) =>
      validAcceptedClear(observation, expectedPanelMode))
    || (witness.afterClear !== null && clearAccepted === null)
    || (witness.exactInput.observationCount > 0 && witness.afterClear === null)
    || (exactInputAccepted !== null && (witness.afterClear === null
      || !validAcceptedExactInput(
        exactInputAccepted, witness.expectedQuery, expectedPanelMode,
      )))
    || falsyMatches(witness.exactInput, (observation) =>
      validAcceptedExactInput(observation, witness.expectedQuery, expectedPanelMode))
    || (witness.inputTelemetry !== null && exactInputAccepted === null)
    || ((witness.baselineGeneration === null) !== (witness.inputTelemetry === null))) return false;
  if (witness.beforeShortcut !== null && witness.afterClear !== null
    && witness.beforeShortcut.generation !== witness.afterClear.generation) return false;
  if (witness.inputTelemetry !== null
    && (witness.inputTelemetry.generation !== witness.baselineGeneration
      || witness.afterClear.generation !== witness.baselineGeneration)) return false;
  if (witness.settled === null || witness.generationDelta === null) {
    return allowPending && witness.settled === null && witness.generationDelta === null
      && witness.observationCount === witness.falsyObservations.length;
  }
  return (witness.entryMode === 'visible' || witness.entryTarget.accepted !== null)
    && (witness.entryMode !== 'reopen' || witness.reopenTarget.accepted !== null)
    && focusAccepted !== null && witness.beforeShortcut !== null
    && selectionAccepted !== null && clearAccepted !== null
    && witness.afterClear !== null && exactInputAccepted !== null
    && witness.inputTelemetry !== null && witness.baselineGeneration !== null
    && validFilterTransitionObservation(witness.settled)
    && witness.settled.ready === true
    && witness.settled.mode === 'list'
    && witness.settled.query === witness.expectedQuery
    && witness.settled.filteredCount === witness.expectedFilteredCount
    && witness.observationCount === witness.falsyObservations.length + 1
    && integer(witness.generationDelta)
    && witness.generationDelta === witness.settled.generation - witness.baselineGeneration;
}

export function candidateNativeKeyDispatches(keyName, code, modifiers = 0, commands = []) {
  if (typeof keyName !== 'string' || !keyName || typeof code !== 'string' || !code
    || !integer(modifiers) || modifiers < 0
    || !Array.isArray(commands) || !commands.every((command) =>
      typeof command === 'string' && command)) {
    throw new TypeError('candidate native key dispatch is invalid');
  }
  const keyCode = keyName === 'Enter' ? 13 : keyName === 'Tab' ? 9
    : keyName === 'Backspace' ? 8 : keyName.toUpperCase().charCodeAt(0);
  const shared = { key: keyName, code, windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode, modifiers };
  return Object.freeze([
    Object.freeze({ type: 'rawKeyDown', ...shared,
      ...(commands.length ? { commands: Object.freeze([...commands]) } : {}) }),
    Object.freeze({ type: 'keyUp', ...shared }),
  ]);
}

const FILTER_TRANSITION_EXPECTATIONS = Object.freeze([
  Object.freeze({
    entryMode: 'visible', priorValue: '', query: 'Same Seed Sentinel', filteredCount: 2,
  }),
  Object.freeze({
    entryMode: 'hidden', priorValue: 'Same Seed Sentinel',
    query: 'Compendium Filter Beacon', filteredCount: 1,
  }),
  Object.freeze({
    entryMode: 'reopen', priorValue: 'Compendium Filter Beacon', query: '', filteredCount: 1500,
  }),
]);

function filterTransitionTerminalStage(expectation) {
  return `filter ${expectation.query || '<clear>'}`;
}

function filterTransitionStages(expectation) {
  const name = expectation.query || '<clear>';
  return Object.freeze({
    focus: `filter ${name} input focus`,
    beforeShortcut: `filter ${name} before shortcut telemetry`,
    selection: `filter ${name} full selection`,
    cleared: `filter ${name} input cleared`,
    afterClear: `filter ${name} cleared telemetry`,
    exactInput: `filter ${name} exact input`,
    inputTelemetry: `filter ${name} exact input telemetry`,
    terminal: filterTransitionTerminalStage(expectation),
  });
}

function filterTransitionOrderedStages(expectation) {
  const name = expectation.query || '<clear>';
  return Object.freeze([
    ...(expectation.entryMode === 'visible'
      ? [`focus visible filter ${name}`]
      : [`search ${name} target`, `search ${name} mouse press`, `search ${name} mouse release`]),
    `filter ${name} input focus`, `filter ${name} before shortcut telemetry`,
    `filter ${name} select-all key a down`, `filter ${name} select-all key a up`,
    `filter ${name} full selection`,
    `filter ${name} delete key Backspace down`, `filter ${name} delete key Backspace up`,
    `filter ${name} input cleared`, `filter ${name} cleared telemetry`,
    ...(expectation.query ? [`insert filter ${name}`] : []),
    `filter ${name} exact input`, `filter ${name} exact input telemetry`,
    ...(expectation.entryMode === 'reopen'
      ? ['ordinary Compendium reopen target', 'ordinary Compendium reopen mouse press',
        'ordinary Compendium reopen mouse release']
      : [`filter ${name} submit key Enter down`, `filter ${name} submit key Enter up`]),
    filterTransitionTerminalStage(expectation),
  ]);
}

function filterTransitionCandidateStages(expectation) {
  const stages = filterTransitionStages(expectation);
  const name = expectation.query || '<clear>';
  return Object.freeze([
    ...(expectation.entryMode === 'visible'
      ? [] : [Object.freeze({ label: `search ${name} target`, kind: 'entryTarget' })]),
    Object.freeze({ label: stages.focus, kind: 'focus' }),
    Object.freeze({ label: stages.beforeShortcut, kind: 'telemetry' }),
    Object.freeze({ label: stages.selection, kind: 'selection' }),
    Object.freeze({ label: stages.cleared, kind: 'cleared' }),
    Object.freeze({ label: stages.afterClear, kind: 'telemetry' }),
    Object.freeze({ label: stages.exactInput, kind: 'exactInput' }),
    Object.freeze({ label: stages.inputTelemetry, kind: 'telemetry' }),
    ...(expectation.entryMode === 'reopen'
      ? [Object.freeze({
        label: 'ordinary Compendium reopen target', kind: 'reopenTarget',
      })] : []),
    Object.freeze({ label: stages.terminal, kind: 'terminal' }),
  ]);
}

function filterTransitionFailureOwner(stage) {
  for (let index = 0; index < FILTER_TRANSITION_EXPECTATIONS.length; index += 1) {
    const expectation = FILTER_TRANSITION_EXPECTATIONS[index];
    const stageIndex = filterTransitionOrderedStages(expectation).indexOf(stage);
    if (stageIndex >= 0) return { index, stageIndex };
  }
  return null;
}

function countStage(completedStages, stage) {
  return completedStages.filter((candidate) => candidate === stage).length;
}

function validPendingFilterTransitionProgress(measurement, transition, expectation, failure) {
  const stages = filterTransitionStages(expectation);
  const name = expectation.query || '<clear>';
  const targetMilestones = [
    ...(expectation.entryMode === 'visible' ? [] : [[
      transition.entryTarget, `search ${name} target`,
    ]]),
    ...(expectation.entryMode === 'reopen' ? [[
      transition.reopenTarget, 'ordinary Compendium reopen target',
    ]] : []),
  ];
  const completed = (stage) => countStage(measurement.completedStages, stage) === 1;
  const noDuplicate = (stage) => countStage(measurement.completedStages, stage) <= 1;
  if (![stages.focus, stages.beforeShortcut, stages.selection, stages.cleared,
    stages.afterClear, stages.exactInput, stages.inputTelemetry,
    ...targetMilestones.map(([, stage]) => stage)].every(noDuplicate)) return false;
  if (targetMilestones.some(([group, stage]) =>
    (group.accepted !== null) !== completed(stage)
      || (group.falsyObservations.length > 0
        && !completed(stage) && measurement.failingStage !== stage))) return false;
  const milestones = [
    [transition.focus.accepted !== null, stages.focus],
    [transition.beforeShortcut !== null, stages.beforeShortcut],
    [transition.selection.accepted !== null, stages.selection],
    [transition.cleared.accepted !== null, stages.cleared],
    [transition.afterClear !== null, stages.afterClear],
    [transition.exactInput.accepted !== null, stages.exactInput],
    [transition.inputTelemetry !== null, stages.inputTelemetry],
  ];
  if (milestones.some(([present, stage]) => present !== completed(stage))) return false;
  for (const [group, stage] of [
    [transition.focus, stages.focus], [transition.selection, stages.selection],
    [transition.cleared, stages.cleared], [transition.exactInput, stages.exactInput],
  ]) {
    if (group.falsyObservations.length > 0
      && !completed(stage) && measurement.failingStage !== stage) return false;
    const ledgerCount = measurement.commandLedger.filter((command) =>
      command?.schema === CANDIDATE_COMMAND_SCHEMA && command.label === stage).length;
    const expectedExtra = failure.command?.schema === CANDIDATE_COMMAND_SCHEMA
      && failure.command.label === stage ? 1 : 0;
    if (ledgerCount !== group.observationCount + expectedExtra) return false;
  }
  const terminalLedgerCount = measurement.commandLedger.filter((command) =>
    command?.schema === CANDIDATE_COMMAND_SCHEMA && command.label === stages.terminal).length;
  if (measurement.failingStage === stages.terminal) {
    const expectedExtra = failure.command?.schema === CANDIDATE_COMMAND_SCHEMA
      && failure.command.label === stages.terminal ? 1 : 0;
    if (terminalLedgerCount !== transition.observationCount + expectedExtra) return false;
  } else if (transition.observationCount !== 0 || terminalLedgerCount !== 0) return false;
  return transition.settled === null && transition.generationDelta === null;
}

function validCompletedFilterTransitionLedger(measurement, transition, expectation) {
  const stages = filterTransitionStages(expectation);
  return [[transition.focus, stages.focus], [transition.selection, stages.selection],
    [transition.cleared, stages.cleared], [transition.exactInput, stages.exactInput]]
    .every(([group, stage]) => measurement.commandLedger.filter((command) =>
      command?.schema === CANDIDATE_COMMAND_SCHEMA && command.label === stage).length
      === group.observationCount)
    && measurement.commandLedger.filter((command) =>
      command?.schema === CANDIDATE_COMMAND_SCHEMA && command.label === stages.terminal).length
      === transition.observationCount;
}

function validFilterCandidateLedgerOrder(measurement, transitions, failure) {
  const allLabels = new Set(FILTER_TRANSITION_EXPECTATIONS.flatMap((expectation) =>
    filterTransitionCandidateStages(expectation).map((stage) => stage.label)));
  const actualLabels = measurement.commandLedger.filter((command) =>
    command?.schema === CANDIDATE_COMMAND_SCHEMA && allLabels.has(command.label))
    .map((command) => command.label);
  const expectedLabels = [];
  for (let index = 0; index < transitions.length; index += 1) {
    const transition = transitions[index];
    const expectation = FILTER_TRANSITION_EXPECTATIONS[index];
    for (const stage of filterTransitionCandidateStages(expectation)) {
      const count = measurement.commandLedger.filter((command) =>
        command?.schema === CANDIDATE_COMMAND_SCHEMA && command.label === stage.label).length;
      const reached = measurement.completedStages.includes(stage.label)
        || measurement.failingStage === stage.label;
      if (!reached) {
        if (count !== 0) return false;
        continue;
      }
      const failedAttempt = failure.command?.schema === CANDIDATE_COMMAND_SCHEMA
        && failure.command.label === stage.label ? 1 : 0;
      const group = stage.kind === 'focus' ? transition.focus
        : stage.kind === 'selection' ? transition.selection
          : stage.kind === 'cleared' ? transition.cleared
            : stage.kind === 'exactInput' ? transition.exactInput
              : stage.kind === 'entryTarget' ? transition.entryTarget
                : stage.kind === 'reopenTarget' ? transition.reopenTarget : null;
      const expectedCount = stage.kind === 'telemetry' ? 1
          : stage.kind === 'terminal' ? transition.observationCount + failedAttempt
            : group.observationCount + failedAttempt;
      if (count !== expectedCount) return false;
      expectedLabels.push(...Array.from({ length: expectedCount }, () => stage.label));
    }
  }
  return sameJson(actualLabels, expectedLabels);
}

function validPartialFilterTransitionPrefix(measurement, failure) {
  const transitions = measurement.filterTransitions;
  const terminalStages = FILTER_TRANSITION_EXPECTATIONS.map(filterTransitionTerminalStage);
  const terminalIndices = terminalStages.map((stage) => measurement.completedStages.indexOf(stage));
  const completionFlags = terminalIndices.map((index) => index >= 0);
  const firstIncomplete = completionFlags.indexOf(false);
  const completedCount = firstIncomplete < 0 ? completionFlags.length : firstIncomplete;
  if (completionFlags.slice(completedCount).some(Boolean)
    || terminalIndices.slice(0, completedCount).some((index, position, indices) =>
      (position > 0 && index <= indices[position - 1])
        || measurement.completedStages.filter((stage) => stage === terminalStages[position]).length !== 1)
    || transitions.length < completedCount || transitions.length > completedCount + 1
    || !transitions.slice(0, completedCount).every((transition, index) =>
      transition.settled !== null && transition.generationDelta !== null
        && validCompletedFilterTransitionLedger(
          measurement, transition, FILTER_TRANSITION_EXPECTATIONS[index],
        ))) return false;
  const failureOwner = filterTransitionFailureOwner(measurement.failingStage);
  if (failureOwner?.index !== null && failureOwner?.index !== undefined
    && failureOwner.index !== completedCount) return false;
  const failureRequiresPending = failureOwner !== null;
  const allFilterStages = new Set(FILTER_TRANSITION_EXPECTATIONS.flatMap(
    filterTransitionOrderedStages,
  ));
  const observedFilterStages = measurement.completedStages.filter((stage) =>
    allFilterStages.has(stage));
  const completedPrefix = FILTER_TRANSITION_EXPECTATIONS.slice(0, completedCount)
    .flatMap(filterTransitionOrderedStages);
  const expectedFilterStages = failureOwner
    ? completedPrefix.concat(filterTransitionOrderedStages(
      FILTER_TRANSITION_EXPECTATIONS[completedCount],
    ).slice(0, failureOwner.stageIndex))
    : completedPrefix;
  if (!sameJson(observedFilterStages, expectedFilterStages)
    || !validFilterCandidateLedgerOrder(measurement, transitions, failure)) return false;
  if (transitions.length === completedCount) return !failureRequiresPending;
  const pending = transitions[completedCount];
  const pendingExpectation = FILTER_TRANSITION_EXPECTATIONS[completedCount];
  return failureRequiresPending
    && validPendingFilterTransitionProgress(measurement, pending, pendingExpectation, failure);
}

function validFilterTransitionSequence(transitions, {
  allowPending = false, requireCompleteSet = false, requireProductSuccess = true,
} = {}) {
  if (!Array.isArray(transitions)
    || transitions.length > FILTER_TRANSITION_EXPECTATIONS.length
    || (requireCompleteSet && transitions.length !== FILTER_TRANSITION_EXPECTATIONS.length)) return false;
  return transitions.every((transition, index) => {
    const expectation = FILTER_TRANSITION_EXPECTATIONS[index];
    const pending = transition?.settled === null && transition?.generationDelta === null;
    return validFilterTransitionWitness(transition, { allowPending })
      && transition.entryMode === expectation.entryMode
      && transition.expectedQuery === expectation.query
      && transition.expectedFilteredCount === expectation.filteredCount
      && (!pending || (allowPending && index === transitions.length - 1))
      && (!requireProductSuccess || (transition.focus.accepted === null
        ? pending : transition.focus.accepted.value === expectation.priorValue))
      && (!requireProductSuccess || pending || (transition.settled.sourceCount === 1500
        && transition.generationDelta === 1));
  });
}
export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function compendiumRawSnapshotExpression() {
  return `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();
    const rows=[...document.querySelectorAll('#codexpanel [data-sel="codex-entry"][data-cid]')];
    const imgs=[...document.querySelectorAll('#codexpanel [data-sel="codex-entry"] img')].map(img=>({
      logicalId:img.closest('[data-cid]')?.dataset.cid||'',naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
      visualKey:img.dataset.visualKey||null,thumbState:img.dataset.thumbState||'unbound'}));
    const ps=[...document.querySelectorAll('#planetside [data-sel="planetside-sp"] img')].map(img=>({
      logicalId:img.closest('[data-cid]')?.dataset.cid||'',naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
      visualKey:img.dataset.visualKey||null,thumbState:img.dataset.thumbState||'unbound'}));
    const detailImage=document.querySelector('#codexpanel [data-sel="detail-portrait"]');
    const scroller=document.querySelector('[data-sel="codex-scroll"]');
    const active=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const activeRow=active?.closest('[data-cid]');const ci=Number(activeRow?.dataset.ci);
    const activeRect=activeRow?.getBoundingClientRect(),scrollRect=scroller?.getBoundingClientRect(),activeStyle=activeRow?getComputedStyle(activeRow):null;
    const outlineWidth=activeStyle?(parseFloat(activeStyle.outlineWidth)||0):0;
    const outlineOffset=activeStyle?(parseFloat(activeStyle.outlineOffset)||0):0;
    const outlineExtension=Math.max(0,outlineWidth+outlineOffset);
    return {diagnostics:d,raw:{mountedRowCount:rows.length,mountedLogicalIds:rows.map(r=>r.dataset.cid),
      rowRects:rows.map(r=>{const x=r.getBoundingClientRect();return {logicalId:r.dataset.cid||'',top:x.top,bottom:x.bottom,height:x.height}}),
      listImages:imgs,planetsideImages:ps,detailNaturalWidth:d.surfaces.detail.naturalWidth,
      detailNaturalHeight:d.surfaces.detail.naturalHeight,detailImageCount:detailImage?1:0,
      detailSrcPresent:!!detailImage?.getAttribute('src'),activeLogicalId:activeRow?.dataset.cid||null,
      activeElementId:active?.id||null,focusedOutsideNormalWindow:Number.isFinite(ci)&&(ci<d.window.start||ci>=d.window.end),
      viewportHeight:window.innerHeight,scrollerHeight:scroller?.clientHeight||0,scrollTop:scroller?.scrollTop||0,
      focusRing:activeRect&&scrollRect&&activeStyle?{outlineWidth,outlineOffset,outlineExtension,outlineStyle:activeStyle.outlineStyle,
        rowLeft:activeRect.left,rowRight:activeRect.right,scrollerLeft:scrollRect.left,scrollerRight:scrollRect.right,
        ringLeft:activeRect.left-outlineExtension,ringRight:activeRect.right+outlineExtension,
        horizontallyContained:activeRect.left-outlineExtension>=scrollRect.left-0.5
          &&activeRect.right+outlineExtension<=scrollRect.right+0.5}:null}}})()`;
}

export function validCompendiumRawSnapshotExpression(source) {
  if (typeof source !== 'string'
    || COMPENDIUM_RAW_SNAPSHOT_REQUIRED_TOKENS.some((token) => !source.includes(token))) {
    return false;
  }
  try { new Function(`"use strict"; return (${source});`); }
  catch { return false; }
  return true;
}

export function validTransportTimeoutPolicy({
  candidateTransportTimeoutMs,
  candidateTargetTimeoutMs,
  baselineTransportTimeoutMs,
  baselineObservationTimeoutMs,
}) {
  return integer(candidateTransportTimeoutMs)
    && candidateTransportTimeoutMs === CANDIDATE_TRANSPORT_TIMEOUT_MS
    && candidateTargetTimeoutMs === COMMAND_TIMEOUT_MS
    && integer(baselineTransportTimeoutMs)
    && baselineTransportTimeoutMs === BASELINE_OBSERVATION_TIMEOUT_MS
    && integer(baselineObservationTimeoutMs)
    && baselineObservationTimeoutMs === BASELINE_OBSERVATION_TIMEOUT_MS;
}

export function compendiumCdpOptions(kind, options) {
  if (!['candidate', 'baseline'].includes(kind) || !isObject(options)
    || Object.hasOwn(options, 'commandTimeoutMs')) {
    throw new Error('Compendium CDP options require one sealed transport kind and no timeout override');
  }
  return Object.freeze({
    ...options,
    commandTimeoutMs: kind === 'baseline'
      ? BASELINE_OBSERVATION_TIMEOUT_MS : CANDIDATE_TRANSPORT_TIMEOUT_MS,
  });
}

export function validProfileEmulationOptions(profile, viewport, options) {
  if (!['phone', 'desktop'].includes(profile) || !isObject(viewport) || !isObject(options)
    || !sameJson(Object.keys(options).sort(), ['deviceMetrics', 'touch'])
    || !isObject(options.deviceMetrics) || !isObject(options.touch)
    || !integer(viewport.width) || viewport.width <= 0
    || !integer(viewport.height) || viewport.height <= 0
    || !finite(viewport.dpr) || viewport.dpr <= 0
    || typeof viewport.mobile !== 'boolean') return false;
  const deviceKeys = Object.keys(options.deviceMetrics).sort();
  const expectedDeviceKeys = ['deviceScaleFactor', 'height', 'mobile', 'width'];
  if (!sameJson(deviceKeys, expectedDeviceKeys)
    || options.deviceMetrics.width !== viewport.width
    || options.deviceMetrics.height !== viewport.height
    || options.deviceMetrics.deviceScaleFactor !== viewport.dpr
    || options.deviceMetrics.mobile !== viewport.mobile
    || viewport.mobile !== (profile === 'phone')) return false;
  const touchKeys = Object.keys(options.touch).sort();
  return profile === 'phone'
    ? sameJson(touchKeys, ['enabled', 'maxTouchPoints'])
      && options.touch.enabled === true && options.touch.maxTouchPoints === 5
    : sameJson(touchKeys, ['enabled']) && options.touch.enabled === false;
}

export function compendiumProfileEmulationOptions(profile, viewport) {
  const options = Object.freeze({
    deviceMetrics: Object.freeze({
      width: viewport?.width, height: viewport?.height,
      deviceScaleFactor: viewport?.dpr, mobile: viewport?.mobile,
    }),
    touch: Object.freeze(profile === 'phone'
      ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }),
  });
  if (!validProfileEmulationOptions(profile, viewport, options)) {
    throw new Error('Compendium profile emulation options are invalid');
  }
  return options;
}

export function remainingCommandTimeoutMs(deadlineMs, nowMs, transportTimeoutMs) {
  if (!finite(deadlineMs) || !finite(nowMs) || !integer(transportTimeoutMs)
    || transportTimeoutMs <= 0 || deadlineMs - nowMs < 1) return null;
  return Math.min(transportTimeoutMs, Math.max(1, Math.floor(deadlineMs - nowMs)));
}

export function phaseObservationAccepted(deadlineMs, completedAtMs, value) {
  return finite(deadlineMs) && finite(completedAtMs)
    && completedAtMs < deadlineMs && Boolean(value);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function candidateTimeoutIdentity(error, method, timeoutMs) {
  return error instanceof Error
    && error.message === `${CANDIDATE_BROWSER_LABEL}: timed out waiting for ${method}`
    ? Object.freeze({ schema: CANDIDATE_CDP_TIMEOUT_SCHEMA, method, timeoutMs }) : null;
}

function commandSettlement(settlement, issuedAtMs, commandDeadlineMs, phaseDeadlineMs) {
  const completedAtMs = settlement.completedAtMs;
  return Object.freeze({
    method: settlement.method,
    status: settlement.status,
    completedAtMs,
    durationMs: completedAtMs - issuedAtMs,
    timely: completedAtMs < commandDeadlineMs && completedAtMs < phaseDeadlineMs,
    ...(settlement.status === 'rejected' ? {
      error: errorMessage(settlement.error),
      timeout: settlement.timeout,
    } : {}),
    ...(settlement.method === 'Browser.getVersion' && settlement.status === 'fulfilled'
      ? { product: typeof settlement.value?.product === 'string' ? settlement.value.product : null }
      : {}),
    ...(settlement.method === 'Runtime.evaluate' && settlement.status === 'fulfilled'
      ? { resultState: settlement.value?.exceptionDetails ? 'page-exception'
        : isObject(settlement.value?.result) && Object.hasOwn(settlement.value.result, 'value')
          ? 'value' : 'missing-value' }
      : {}),
  });
}

function candidateCommandEvidence({
  profile, label, issuedAtMs, phaseDeadlineMs, timeoutMs, target, heartbeat,
}) {
  const commandDeadlineMs = Math.min(phaseDeadlineMs, issuedAtMs + timeoutMs);
  return Object.freeze({
    schema: CANDIDATE_COMMAND_SCHEMA,
    profile,
    label,
    issuedAtMs,
    phaseDeadlineMs,
    commandDeadlineMs,
    timeoutMs,
    target: commandSettlement(target, issuedAtMs, commandDeadlineMs, phaseDeadlineMs),
    heartbeat: commandSettlement(heartbeat, issuedAtMs, commandDeadlineMs, phaseDeadlineMs),
  });
}

export class CandidateObservationError extends Error {
  constructor(classification, message, command = null, options = {}) {
    super(message, options);
    this.name = 'CandidateObservationError';
    this.classification = classification;
    this.command = command;
  }
}

export function isCandidateObservationError(error) {
  return error instanceof CandidateObservationError
    && ['product-unanswerable', 'instrument'].includes(error.classification);
}

function plainEvaluateCommand({
  profile, label, timeoutMs, issuedAtMs, completedAtMs, status, error,
}) {
  return Object.freeze({
    schema: PLAIN_EVALUATE_COMMAND_SCHEMA,
    profile,
    label,
    method: 'Runtime.evaluate',
    timeoutMs,
    issuedAtMs,
    completedAtMs,
    durationMs: completedAtMs - issuedAtMs,
    status,
    error,
  });
}

export async function evaluateCandidateExpression({
  send, sessionId, expression, profile, label, awaitPromise = true,
  timeoutMs = CANDIDATE_TRANSPORT_TIMEOUT_MS, now,
}) {
  if (typeof send !== 'function' || typeof now !== 'function'
    || typeof sessionId !== 'string' || !sessionId
    || typeof expression !== 'string' || !expression
    || !PROFILES.includes(profile) || typeof label !== 'string' || !label
    || !integer(timeoutMs) || timeoutMs < 1 || timeoutMs > CANDIDATE_TRANSPORT_TIMEOUT_MS
    || typeof awaitPromise !== 'boolean') {
    throw new Error(`${String(profile)} ${String(label)}: plain candidate evaluation inputs are invalid`);
  }
  const issuedAtMs = now('issued');
  let result;
  try {
    result = await send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise,
    }, sessionId, { timeoutMs });
  } catch (cause) {
    const command = plainEvaluateCommand({
      profile, label, timeoutMs, issuedAtMs, completedAtMs: now('Runtime.evaluate'),
      status: 'rejected', error: errorMessage(cause),
    });
    const error = new Error(
      `${profile} ${label}: Runtime.evaluate failed under the ${timeoutMs}ms transport cap (${command.error})`,
      { cause },
    );
    error.compendiumCommand = command;
    throw error;
  }
  if (result?.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description
      || result.exceptionDetails.text || 'unknown exception';
    const command = plainEvaluateCommand({
      profile, label, timeoutMs, issuedAtMs, completedAtMs: now('Runtime.evaluate'),
      status: 'page-exception', error: detail,
    });
    const error = new Error(`${profile} ${label}: page evaluation threw (${detail})`);
    error.compendiumCommand = command;
    throw error;
  }
  if (!isObject(result?.result) || !Object.hasOwn(result.result, 'value')) {
    const command = plainEvaluateCommand({
      profile, label, timeoutMs, issuedAtMs, completedAtMs: now('Runtime.evaluate'),
      status: 'page-exception', error: 'Runtime.evaluate returned no by-value result',
    });
    const error = new Error(`${profile} ${label}: Runtime.evaluate returned no by-value result`);
    error.compendiumCommand = command;
    throw error;
  }
  return result.result.value;
}

/* One phase-owned candidate observation. The target and root-session heartbeat
   are armed together under the same strict deadline. Callers may issue another
   observation only after this one completed on time with a falsy product value;
   a command failure is terminal and is never retried. */
export async function observeCandidateValue({
  send, sessionId, expression, profile, label, phaseDeadlineMs, now,
}) {
  if (typeof send !== 'function' || typeof now !== 'function'
    || typeof sessionId !== 'string' || !sessionId
    || typeof expression !== 'string' || !expression
    || !PROFILES.includes(profile) || typeof label !== 'string' || !label
    || !finite(phaseDeadlineMs)) {
    throw new CandidateObservationError(
      'instrument', `${String(profile)} ${String(label)}: candidate observation inputs are invalid`,
    );
  }
  const issuedAtMs = now('issued');
  const timeoutMs = remainingCommandTimeoutMs(
    phaseDeadlineMs, issuedAtMs, COMMAND_TIMEOUT_MS,
  );
  if (timeoutMs === null) {
    throw new CandidateObservationError(
      'instrument', `${profile} ${label}: phase deadline expired before candidate observation`,
    );
  }
  const settle = (method, promise) => promise.then(
    (value) => ({ method, status: 'fulfilled', value, completedAtMs: now(method) }),
    (error) => ({
      method, status: 'rejected', error, completedAtMs: now(method),
      timeout: candidateTimeoutIdentity(error, method, timeoutMs),
    }),
  );
  /* Promise continuations ensure a synchronous target throw cannot prevent the
     independent root heartbeat from being armed in the same observation. */
  const targetPending = settle('Runtime.evaluate', Promise.resolve().then(() => send(
    'Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true },
    sessionId, { timeoutMs },
  )));
  const heartbeatPending = settle('Browser.getVersion', Promise.resolve().then(() => send(
    'Browser.getVersion', {}, undefined, { timeoutMs },
  )));
  const [target, heartbeat] = await Promise.all([targetPending, heartbeatPending]);
  const command = candidateCommandEvidence({
    profile, label, issuedAtMs, phaseDeadlineMs, timeoutMs, target, heartbeat,
  });
  const healthyHeartbeat = command.heartbeat.status === 'fulfilled'
    && command.heartbeat.timely === true
    && typeof command.heartbeat.product === 'string'
    && command.heartbeat.product.length > 0;
  if (!healthyHeartbeat) {
    const detail = command.heartbeat.status === 'rejected'
      ? command.heartbeat.error
      : command.heartbeat.timely ? 'invalid Browser.getVersion product' : 'late heartbeat';
    throw new CandidateObservationError(
      'instrument', `${profile} ${label}: root Browser.getVersion heartbeat failed (${detail})`, command,
    );
  }
  if (command.target.status === 'rejected') {
    const missedTargetDeadline = command.target.timeout !== null
      && command.target.timely === false && command.target.durationMs >= timeoutMs;
    const classification = missedTargetDeadline ? 'product-unanswerable' : 'instrument';
    const diagnosis = missedTargetDeadline
      ? `target Runtime.evaluate missed the ${timeoutMs}ms deadline while the root heartbeat remained timely`
      : `Runtime.evaluate failed (${command.target.error})`;
    throw new CandidateObservationError(
      classification, `${profile} ${label}: ${diagnosis}`, command,
    );
  }
  if (!command.target.timely) {
    throw new CandidateObservationError(
      'product-unanswerable',
      `${profile} ${label}: target Runtime.evaluate completed after its ${timeoutMs}ms deadline while the root heartbeat remained timely`,
      command,
    );
  }
  if (target.value?.exceptionDetails) {
    const detail = target.value.exceptionDetails.exception?.description
      || target.value.exceptionDetails.text || 'unknown exception';
    throw new CandidateObservationError(
      'instrument', `${profile} ${label}: page evaluation threw (${detail})`, command,
    );
  }
  if (!isObject(target.value?.result) || !Object.hasOwn(target.value.result, 'value')) {
    throw new CandidateObservationError(
      'instrument', `${profile} ${label}: Runtime.evaluate returned no by-value result`, command,
    );
  }
  return Object.freeze({ value: target.value.result.value, command });
}

export async function waitForCandidateValue({
  send, sessionId, expression, profile, label, phaseDeadlineMs, now, sleep, onCommand,
  acceptValue = Boolean, onObservation = () => {},
}) {
  if (typeof sleep !== 'function' || typeof onCommand !== 'function'
    || typeof acceptValue !== 'function' || typeof onObservation !== 'function') {
    throw new CandidateObservationError(
      'instrument', `${String(profile)} ${String(label)}: candidate wait dependencies are invalid`,
    );
  }
  let last = null;
  while (now('phase-check') < phaseDeadlineMs) {
    let observation;
    try {
      observation = await observeCandidateValue({
        send, sessionId, expression, profile, label, phaseDeadlineMs, now,
      });
    } catch (error) {
      if (isCandidateObservationError(error) && error.command) onCommand(error.command);
      throw error;
    }
    onCommand(observation.command);
    last = observation.value;
    onObservation(last, observation.command);
    if (acceptValue(last)) return last;
    const remainingMs = phaseDeadlineMs - now('phase-after-observation');
    if (remainingMs < 1) break;
    await sleep(Math.min(50, Math.max(1, Math.floor(remainingMs))));
  }
  throw new CandidateObservationError(
    'instrument', `${profile} ${label}: phase timed out after on-time falsy observations (${JSON.stringify(last)})`,
  );
}

/* Serialized into Page.addScriptToEvaluateOnNewDocument by the collector.
   Keep this function closure-free: the browser document receives only the
   explicit arguments below. The wrapper calls the original first with the
   exact receiver/arguments, observes only a successful exact-132 return, and
   preserves the original property flags. Observation errors never replace a
   product return value or exception. */
export function installBrokenBaselineThumbObserver(
  globalObject, CanvasConstructor, TextEncoderConstructor, clock,
  schema, cacheCap,
) {
  const key = '__CF_COMPENDIUM_BASELINE_THUMBS__';
  if (!globalObject || !CanvasConstructor?.prototype || globalObject[key]) {
    throw new Error('broken-baseline thumb observer target is invalid or already installed');
  }
  const descriptor = Object.getOwnPropertyDescriptor(CanvasConstructor.prototype, 'toDataURL');
  if (!descriptor || typeof descriptor.value !== 'function'
    || !Number.isSafeInteger(cacheCap) || cacheCap <= 0
    || typeof TextEncoderConstructor !== 'function' || typeof clock?.now !== 'function') {
    throw new Error('broken-baseline thumb observer dependencies are invalid');
  }
  const original = descriptor.value;
  const state = {
    schema,
    phase: 'pre-owner',
    totalExact132Completions: 0,
    preOwnerExact132Completions: null,
    initialListCompletions: 0,
    initialListCacheEncodedByteLengths: [],
    initialListStableQuietMs: null,
    observerErrors: 0,
    lastCompletionAt: clock.now(),
    originalDescriptor: {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: descriptor.writable,
    },
    descriptorPreserved: false,
  };
  const wrapped = function (...args) {
    const value = Reflect.apply(original, this, args);
    try {
      if (this?.width === 132 && this?.height === 132
        && typeof value === 'string' && value.length > 30) {
        const encodedBytes = new TextEncoderConstructor().encode(value).byteLength;
        state.totalExact132Completions += 1;
        state.lastCompletionAt = clock.now();
        if (state.phase === 'initial-list') {
          state.initialListCompletions += 1;
          state.initialListCacheEncodedByteLengths.push(encodedBytes);
          if (state.initialListCacheEncodedByteLengths.length > cacheCap) {
            state.initialListCacheEncodedByteLengths.shift();
          }
        }
      }
    } catch { state.observerErrors += 1; }
    return value;
  };
  Object.defineProperty(CanvasConstructor.prototype, 'toDataURL', {
    ...descriptor,
    value: wrapped,
  });
  const installed = Object.getOwnPropertyDescriptor(CanvasConstructor.prototype, 'toDataURL');
  state.descriptorPreserved = Boolean(installed)
    && installed.configurable === descriptor.configurable
    && installed.enumerable === descriptor.enumerable
    && installed.writable === descriptor.writable;
  Object.defineProperty(globalObject, key, {
    configurable: false, enumerable: false, writable: false, value: state,
  });
  return state;
}

export function validBrokenBaselineThumbObservation(observation) {
  return integer(observation?.preOwnerExact132Completions)
    && observation.preOwnerExact132Completions >= 0
    && observation?.initialListCompletions === 1500
    && observation?.cacheEntries === BROKEN_BASELINE_THUMB_CACHE_CAP
    && integer(observation?.cacheEncodedBytes) && observation.cacheEncodedBytes > 0
    && observation?.totalExact132Completions
      === observation.preOwnerExact132Completions + observation.initialListCompletions
    && observation?.observerErrors === 0
    && observation?.descriptorPreserved === true
    && finite(observation?.quietMs) && observation.quietMs >= 1000;
}

export function brokenBaselineFaults({ profile, list, eagerResource, speciesChunk }) {
  const faults = [];
  if (list?.mountedRows === 1500) faults.push('unwindowed-1500-rows');
  const fullSizeList = list?.imageCount === 1500
    && Array.isArray(list?.naturalWidths) && list.naturalWidths.length === 1500
    && Array.isArray(list?.naturalHeights) && list.naturalHeights.length === 1500
    && list.naturalWidths.every((value) => value === 440)
    && list.naturalHeights.every((value) => value === 440);
  if (fullSizeList) faults.push('list-source-440');
  const portraitCacheCap = BROKEN_BASELINE_PORTRAIT_CACHE_CAPS[profile];
  if (fullSizeList && list?.sourceInstanceCount === 1500
    && list?.dataImageCount === 1500
    && list?.referencedPixels === 1500 * 440 * 440
    && integer(list?.distinctSources) && list.distinctSources > portraitCacheCap
    && finite(list?.sourceInstanceEncodedBytes) && list.sourceInstanceEncodedBytes > 0) {
    faults.push('full-portrait-dom-exposure');
  }
  if (typeof eagerResource === 'string' && typeof speciesChunk === 'string'
    && speciesChunk && eagerResource.endsWith(`/${speciesChunk}`)) faults.push('eager-art-import');
  return faults;
}

export function brokenBaselineCacheMetrics(profile, list, warm) {
  const portraitCacheCap = BROKEN_BASELINE_PORTRAIT_CACHE_CAPS[profile];
  if (!integer(portraitCacheCap)
    || !validBrokenBaselineThumbObservation({
      preOwnerExact132Completions: list?.thumbObserverPreOwnerExact132Completions,
      initialListCompletions: list?.thumbRenderCompletions,
      cacheEntries: list?.modeledThumbCacheEntries,
      cacheEncodedBytes: list?.thumbCacheEncodedBytes,
      totalExact132Completions: list?.thumbObserverTotalExact132Completions,
      observerErrors: list?.thumbObserverErrors,
      descriptorPreserved: list?.thumbObserverDescriptorPreserved,
      quietMs: list?.thumbObserverStableQuietMs,
    })
    || list?.sourceInstanceCount !== 1500
    || list?.modeledPortraitCacheEntries !== portraitCacheCap
    || !integer(list?.modeledPortraitCacheEncodedBytes)
    || list.modeledPortraitCacheEncodedBytes <= 0
    || !Array.isArray(warm) || warm.length !== REQUIRED_WARM_CYCLES
    || warm.some((point) => point?.renderStartThumbCacheEntries !== BROKEN_BASELINE_THUMB_CACHE_CAP
      || !integer(point?.renderStartThumbCacheEncodedBytes)
      || point.renderStartThumbCacheEncodedBytes <= 0)) return null;
  const cacheStates = [
    { entries: list.modeledThumbCacheEntries, encodedBytes: list.thumbCacheEncodedBytes },
    ...warm.map((point) => ({
      entries: point.renderStartThumbCacheEntries,
      encodedBytes: point.renderStartThumbCacheEncodedBytes,
    })),
  ];
  const liveCacheEntries = Math.max(...cacheStates.map((state) => state.entries));
  const liveDecodedPixels = liveCacheEntries * 132 * 132;
  const liveEncodedBytes = Math.max(...cacheStates.map((state) => state.encodedBytes));
  const warmTail = warm.slice(-3);
  const warmDecodedBytes = warmTail.map(
    (point) => point.renderStartThumbCacheEntries * 132 * 132 * 4,
  );
  const warmEncodedBytes = warmTail.map((point) => point.renderStartThumbCacheEncodedBytes);
  return Object.freeze({
    liveCacheEntries,
    liveDecodedPixels,
    liveDecodedBytes: liveDecodedPixels * 4,
    liveEncodedBytes,
    queuedJobsPeak: 0,
    activeJobsPeak: 0,
    liveLeases: 0,
    liveSubscribers: 0,
    livePortraitCacheEntries: portraitCacheCap,
    livePortraitEncodedBytes: list.modeledPortraitCacheEncodedBytes,
    warmDecodedBytesRange: Math.max(...warmDecodedBytes) - Math.min(...warmDecodedBytes),
    warmEncodedBytesRange: Math.max(...warmEncodedBytes) - Math.min(...warmEncodedBytes),
  });
}

export function brokenBaselineFailureEvidence(measurements) {
  const completed = Array.isArray(measurements) ? measurements : [];
  return Object.freeze({
    evidenceStatus: 'partial-diagnostic-not-budget-samples',
    profiles: Object.freeze(Object.fromEntries(completed
      .filter((measurement) => PROFILES.includes(measurement?.profile))
      .map((measurement) => [measurement.profile, measurement]))),
  });
}

export const CEILING_FIELDS = Object.freeze([
  'mountedRowsMax', 'heapUsedBytesMax', 'documentsMax', 'nodesMax',
  'jsEventListenersMax', 'liveCacheEntriesMax', 'liveDecodedPixelsMax',
  'liveDecodedBytesMax', 'liveEncodedBytesMax', 'queuedJobsPeakMax',
  'activeJobsPeakMax', 'liveLeasesMax', 'liveSubscribersMax',
  'livePortraitCacheEntriesMax', 'livePortraitEncodedBytesMax', 'warmHeapRangeBytesMax',
  'warmDecodedBytesRangeMax', 'warmEncodedBytesRangeMax',
]);
export const SAMPLE_METRIC_FIELDS = Object.freeze([
  'mountedRows', 'heapUsedBytes', 'documents', 'nodes', 'jsEventListeners',
  'liveCacheEntries', 'liveDecodedPixels', 'liveDecodedBytes', 'liveEncodedBytes',
  'queuedJobsPeak', 'activeJobsPeak', 'liveLeases', 'liveSubscribers',
  'livePortraitCacheEntries', 'livePortraitEncodedBytes',
  'warmHeapRangeBytes', 'warmDecodedBytesRange', 'warmEncodedBytesRange',
]);

function validateCalibrationSample(sample, profile, index, errors, expectedFaults = null) {
  const where = `calibration.samples.${profile}[${index}]`;
  if (!isObject(sample)) { errors.push(`${where} must be an object`); return; }
  exactKeys(sample, [
    'runId', 'commit', 'workingTreeDigest', 'inputDigest', 'sourceState',
    'sourceChanged', 'fixtureRowsSha256', 'measuredAt', 'browser', 'metrics',
    ...(expectedFaults ? ['observedFaults'] : []),
  ], where, errors);
  if (typeof sample.runId !== 'string' || !sample.runId) errors.push(`${where}.runId is missing`);
  if (!/^[a-f0-9]{40}$/.test(String(sample.commit || ''))) errors.push(`${where}.commit is invalid`);
  if (!/^[a-f0-9]{64}$/.test(String(sample.workingTreeDigest || ''))) {
    errors.push(`${where}.workingTreeDigest is invalid`);
  }
  if (!/^[a-f0-9]{64}$/.test(String(sample.inputDigest || ''))) {
    errors.push(`${where}.inputDigest is invalid`);
  }
  if (sample.sourceState !== 'committed') errors.push(`${where}.sourceState must be committed`);
  if (sample.sourceChanged !== false) errors.push(`${where}.sourceChanged must be false`);
  if (!/^[a-f0-9]{64}$/.test(String(sample.fixtureRowsSha256 || ''))) {
    errors.push(`${where}.fixtureRowsSha256 is invalid`);
  }
  if (typeof sample.measuredAt !== 'string' || !Number.isFinite(Date.parse(sample.measuredAt))) {
    errors.push(`${where}.measuredAt is invalid`);
  }
  const browserFields = [
    'executable', 'product', 'revision', 'userAgent', 'jsVersion', 'protocolVersion',
  ];
  if (!isObject(sample.browser)
    || browserFields.some((field) => typeof sample.browser[field] !== 'string'
      || sample.browser[field].length === 0)) {
    errors.push(`${where}.browser provenance is incomplete`);
  } else {
    exactKeys(sample.browser, browserFields, `${where}.browser`, errors);
  }
  if (!isObject(sample.metrics)) { errors.push(`${where}.metrics is missing`); return; }
  exactKeys(sample.metrics, SAMPLE_METRIC_FIELDS, `${where}.metrics`, errors);
  for (const field of SAMPLE_METRIC_FIELDS) {
    if (!nonnegative(sample.metrics[field])) errors.push(`${where}.metrics.${field} is invalid`);
  }
  if (expectedFaults) {
    if (!Array.isArray(sample.observedFaults)
      || new Set(sample.observedFaults).size !== sample.observedFaults.length
      || !sameJson([...sample.observedFaults].sort(), [...expectedFaults].sort())) {
      errors.push(`${where}.observedFaults must prove every sealed broken-baseline fault`);
    }
  }
}

function enforceSharedSampleIdentity(samples, label, errors, expectedCommit = null,
  expectedFixture = null) {
  if (!samples.length) return;
  const identity = (sample) => [sample.commit, sample.workingTreeDigest,
    sample.inputDigest, sample.fixtureRowsSha256,
    sample.browser?.executable, sample.browser?.product, sample.browser?.revision,
    sample.browser?.userAgent, sample.browser?.jsVersion, sample.browser?.protocolVersion].join('\0');
  const first = identity(samples[0]);
  if (samples.some((sample) => identity(sample) !== first)) {
    errors.push(`${label} samples do not share one exact commit/working-tree/input/fixture identity`);
  }
  if (expectedCommit && samples.some((sample) => sample.commit !== expectedCommit)) {
    errors.push(`${label} samples do not match the recorded baseline commit`);
  }
  if (expectedFixture && samples.some((sample) => sample.fixtureRowsSha256 !== expectedFixture)) {
    errors.push(`${label} samples do not match the budget fixture digest`);
  }
}

function enforceIndependentRuns(samples, label, errors) {
  const runIds = samples.map((sample) => sample?.runId);
  const measuredAt = samples.map((sample) => sample?.measuredAt);
  if (new Set(runIds).size !== runIds.length) errors.push(`${label} sample runIds are not independent`);
  if (new Set(measuredAt).size !== measuredAt.length) errors.push(`${label} sample timestamps are not independent`);
}

/** Strict semantic validation supplements the checked-in JSON Schema. */
export function validateBudgetRecord(record, fixtureRowsSha256 = null,
  brokenBaselineProjectionRowsSha256 = null) {
  const errors = [];
  if (!isObject(record)) return { ok: false, errors: ['budget must be an object'] };
  exactKeys(record, [
    'schema', 'status', 'fixture', 'requirements', 'calibration',
    'pairedBrokenBaseline', 'ceilings',
  ], 'budget', errors);
  if (record.schema !== BUDGET_SCHEMA) errors.push(`budget schema must be ${BUDGET_SCHEMA}`);
  if (!['calibration-required', 'active'].includes(record.status)) {
    errors.push('budget status must be calibration-required or active');
  }
  if (!isObject(record.requirements)) errors.push('budget requirements are missing');
  else {
    exactKeys(record.requirements, [
      'fixtureCount', 'listNaturalDimensionMax', 'commandTimeoutMs', 'warmCycles',
    ], 'requirements', errors);
    if (record.requirements.fixtureCount !== 1500) errors.push('fixtureCount must remain exactly 1500');
    if (record.requirements.listNaturalDimensionMax !== 132) {
      errors.push('listNaturalDimensionMax must remain exactly 132');
    }
    if (record.requirements.commandTimeoutMs !== COMMAND_TIMEOUT_MS) {
      errors.push(`commandTimeoutMs must remain exactly ${COMMAND_TIMEOUT_MS}`);
    }
    if (record.requirements.warmCycles !== REQUIRED_WARM_CYCLES) {
      errors.push(`warmCycles must remain exactly ${REQUIRED_WARM_CYCLES}`);
    }
  }
  if (!isObject(record.fixture)
    || record.fixture.schema !== 'cf-v2-compendium-fixture/v1'
    || record.fixture.generator !== 'compendium-realistic-genomes/v1'
    || record.fixture.count !== 1500
    || !/^[a-f0-9]{64}$/.test(String(record.fixture.rowsSha256 || ''))) {
    errors.push('budget fixture provenance is invalid');
  } else if (fixtureRowsSha256 && record.fixture.rowsSha256 !== fixtureRowsSha256) {
    errors.push('budget fixture digest does not match the current deterministic input');
  }
  if (isObject(record.fixture)) exactKeys(record.fixture,
    ['schema', 'generator', 'count', 'rowsSha256'], 'fixture', errors);
  if (!isObject(record.calibration)
    || record.calibration.requiredIndependentRunsPerProfile !== 3
    || typeof record.calibration.selectionRule !== 'string'
    || !record.calibration.selectionRule.trim()
    || typeof record.calibration.headroomRationaleRequired !== 'boolean'
    || record.calibration.headroomRationaleRequired !== true
    || !isObject(record.calibration.samples)) {
    errors.push('calibration workflow is incomplete');
  } else {
    exactKeys(record.calibration, [
      'requiredIndependentRunsPerProfile', 'selectionRule',
      'headroomRationaleRequired', 'samples',
    ], 'calibration', errors);
    exactKeys(record.calibration.samples, PROFILES, 'calibration.samples', errors);
    for (const profile of PROFILES) {
      const samples = record.calibration.samples[profile];
      if (!Array.isArray(samples)) errors.push(`calibration.samples.${profile} must be an array`);
      else {
        samples.forEach((sample, index) => validateCalibrationSample(sample, profile, index, errors));
        enforceIndependentRuns(samples, `candidate ${profile}`, errors);
      }
    }
    const allCandidateSamples = PROFILES.flatMap((profile) =>
      Array.isArray(record.calibration.samples[profile]) ? record.calibration.samples[profile] : []);
    enforceSharedSampleIdentity(allCandidateSamples, 'candidate calibration', errors,
      null, record.fixture?.rowsSha256 || null);
  }
  if (!isObject(record.pairedBrokenBaseline)
    || !['measurement-required', 'measured'].includes(record.pairedBrokenBaseline.status)
    || !/^[a-f0-9]{40}$/.test(String(record.pairedBrokenBaseline.commit || ''))
    || !(record.pairedBrokenBaseline.collectorCommit === null
      || /^[a-f0-9]{40}$/.test(String(record.pairedBrokenBaseline.collectorCommit || '')))
    || !/^[a-f0-9]{64}$/.test(String(record.pairedBrokenBaseline.projectionRowsSha256 || ''))
    || !Array.isArray(record.pairedBrokenBaseline.expectedFaults)
    || !sameJson([...record.pairedBrokenBaseline.expectedFaults].sort(),
      [...BROKEN_BASELINE_EXPECTED_FAULTS].sort())
    || !isObject(record.pairedBrokenBaseline.samples)) {
    errors.push('paired pre-Arc1A broken-baseline provenance is incomplete');
  } else {
    exactKeys(record.pairedBrokenBaseline,
      ['status', 'commit', 'collectorCommit', 'projectionRowsSha256', 'expectedFaults', 'samples'],
      'pairedBrokenBaseline', errors);
    exactKeys(record.pairedBrokenBaseline.samples, PROFILES,
      'pairedBrokenBaseline.samples', errors);
    for (const profile of PROFILES) {
      const samples = record.pairedBrokenBaseline.samples[profile];
      if (!Array.isArray(samples)) errors.push(`pairedBrokenBaseline.samples.${profile} must be an array`);
      else {
        samples.forEach((sample, index) => validateCalibrationSample(
          sample, `pairedBrokenBaseline.${profile}`, index, errors,
          record.pairedBrokenBaseline.expectedFaults,
        ));
        enforceIndependentRuns(samples, `paired broken-baseline ${profile}`, errors);
      }
    }
    const allBaselineSamples = PROFILES.flatMap((profile) =>
      Array.isArray(record.pairedBrokenBaseline.samples[profile])
        ? record.pairedBrokenBaseline.samples[profile] : []);
    enforceSharedSampleIdentity(allBaselineSamples, 'paired broken-baseline', errors,
      record.pairedBrokenBaseline.commit, record.fixture?.rowsSha256 || null);
    if (brokenBaselineProjectionRowsSha256
      && record.pairedBrokenBaseline.projectionRowsSha256
        !== brokenBaselineProjectionRowsSha256) {
      errors.push('paired broken-baseline projection digest does not match the deterministic adapter input');
    }
    if (record.pairedBrokenBaseline.status === 'measured'
      && !/^[a-f0-9]{40}$/.test(String(record.pairedBrokenBaseline.collectorCommit || ''))) {
      errors.push('measured paired broken baseline requires its exact collector commit');
    }
  }
  if (record.status === 'calibration-required') {
    if (record.ceilings !== null) errors.push('calibration-required budget must keep ceilings null');
  } else {
    if (isObject(record.ceilings)) exactKeys(record.ceilings, PROFILES, 'ceilings', errors);
    if (!isObject(record.ceilings)) errors.push('active budget ceilings are missing');
    for (const profile of PROFILES) {
      const samples = record.calibration?.samples?.[profile];
      if (!Array.isArray(samples) || samples.length < 3) {
        errors.push(`active budget needs at least three ${profile} calibration samples`);
      }
      const baselineSamples = record.pairedBrokenBaseline?.samples?.[profile];
    if (record.pairedBrokenBaseline?.status !== 'measured'
        || !Array.isArray(baselineSamples) || baselineSamples.length < 1) {
        errors.push(`active budget needs a measured paired broken baseline for ${profile}`);
      }
      const ceiling = record.ceilings?.[profile];
      if (!isObject(ceiling)) { errors.push(`active ${profile} ceilings are missing`); continue; }
      exactKeys(ceiling, ['rationale', ...CEILING_FIELDS], `ceilings.${profile}`, errors);
      if (typeof ceiling.rationale !== 'string' || !ceiling.rationale.trim()) {
        errors.push(`active ${profile} ceiling rationale is missing`);
      }
      for (const field of CEILING_FIELDS) {
        if (!nonnegative(ceiling[field])) errors.push(`active ${profile}.${field} is invalid`);
      }
      if (Array.isArray(samples) && samples.length) {
        for (let i = 0; i < CEILING_FIELDS.length; i++) {
          const ceilingField = CEILING_FIELDS[i];
          const sampleField = SAMPLE_METRIC_FIELDS[i];
          const measuredMax = Math.max(...samples.map((sample) => sample.metrics?.[sampleField] ?? Infinity));
          if (finite(ceiling[ceilingField]) && ceiling[ceilingField] < measuredMax) {
            errors.push(`active ${profile}.${ceilingField} is below measured ${sampleField} max`);
          }
        }
      }
    }
    const candidateCommit = record.calibration?.samples?.phone?.[0]?.commit;
    if (!/^[a-f0-9]{40}$/.test(String(record.pairedBrokenBaseline?.collectorCommit || ''))
      || record.pairedBrokenBaseline.collectorCommit !== candidateCommit) {
      errors.push('active broken-baseline collectorCommit must match the candidate calibration commit');
    }
    const candidatePhoneRuns = record.calibration?.samples?.phone?.map((sample) => sample.runId).sort();
    const candidateDesktopRuns = record.calibration?.samples?.desktop?.map((sample) => sample.runId).sort();
    if (!sameJson(candidatePhoneRuns, candidateDesktopRuns)) {
      errors.push('active candidate phone/desktop samples do not come from the same independent runs');
    }
    const baselinePhoneRuns = record.pairedBrokenBaseline?.samples?.phone?.map((sample) => sample.runId).sort();
    const baselineDesktopRuns = record.pairedBrokenBaseline?.samples?.desktop?.map((sample) => sample.runId).sort();
    if (!sameJson(baselinePhoneRuns, baselineDesktopRuns)) {
      errors.push('active broken-baseline phone/desktop samples do not come from the same independent runs');
    }
  }
  return { ok: errors.length === 0, errors };
}

function values(object) { return isObject(object) ? Object.values(object) : []; }
function listImages(snapshot) {
  return Array.isArray(snapshot?.raw?.listImages) ? snapshot.raw.listImages : [];
}
function planetsideImages(snapshot) {
  return Array.isArray(snapshot?.raw?.planetsideImages) ? snapshot.raw.planetsideImages : [];
}
function art(snapshot) { return snapshot?.diagnostics?.art || null; }
function liveWithinLimits(snapshot, profile) {
  const a = art(snapshot);
  if (!isObject(a) || a.schema !== ART_DIAGNOSTICS_SCHEMA
    || !isObject(a.live) || !isObject(a.limits)
    || a.deviceClass !== profile
    || a.limits.budgetStatus !== 'provisional-candidate'
    || a.limits.encodedByteBasis !== 'utf8-data-url') return false;
  const pairs = [
    ['cacheEntries', 'cacheEntries'], ['decodedPixels', 'decodedPixels'],
    ['decodedBytes', 'decodedBytes'], ['encodedBytes', 'encodedBytes'],
    ['queuedJobs', 'queuedJobs'], ['activeJobs', 'activeJobs'],
    ['leases', 'leases'],
    ['portraitCacheEntries', 'portraitEntries'],
    ['portraitEncodedBytes', 'portraitEncodedBytes'],
  ];
  return pairs.every(([liveField, limitField]) => nonnegative(a.live[liveField])
    && nonnegative(a.limits[limitField]) && a.live[liveField] <= a.limits[limitField]);
}
function allPositive132(images) {
  return images.length > 0 && images.every((image) =>
    typeof image.logicalId === 'string' && image.logicalId
    && image.naturalWidth === 132 && image.naturalHeight === 132);
}
function settled(snapshot) {
  const a = art(snapshot);
  return !!a && a.live.queuedJobs === 0 && a.live.activeJobs === 0;
}
function range(numbers) {
  return numbers.length ? Math.max(...numbers) - Math.min(...numbers) : Infinity;
}
function maxAt(snapshots, getter) {
  const read = snapshots.map(getter);
  return read.length && read.every(nonnegative) ? Math.max(...read) : Infinity;
}

export function evaluateProfile(measurement, budget, fixture) {
  const profile = measurement?.profile;
  if (!PROFILES.includes(profile)) throw new Error(`unknown Compendium profile ${String(profile)}`);
  const ceiling = budget?.ceilings?.[profile];
  if (budget?.status !== 'active' || !isObject(ceiling)) {
    throw new Error(`${profile}: an active measured budget is required for certification`);
  }
  const points = measurement.points || {};
  const warm = Array.isArray(points.warm) ? points.warm : [];
  const resize = measurement.phases?.viewportResize;
  const resizePoints = [resize?.base, resize?.expanded, resize?.contracted, resize?.restored]
    .filter(Boolean);
  const selected = [points.first, points.middle, points.last, points.filtered,
    points.detail, points.detailClosed, points.back, points.focusPinned, points.closed,
    points.planetside, ...resizePoints, ...warm].filter(Boolean);
  const final = warm[warm.length - 1] || points.planetside || points.closed;
  const finalArt = art(final);
  const outcomes = [];
  const add = (id, ok, diagnosis, evidence = null) => outcomes.push({
    id: `${profile}/${id}`, profile, check: id,
    status: ok ? 'pass' : 'fail', diagnosis: ok ? null : `${profile}: ${diagnosis}`,
    evidence,
  });
  const fixtureOk = measurement.fixture?.count === 1500
    && measurement.fixture?.uniqueLogicalIds === 1500
    && measurement.fixture?.uniqueCompleteGenomes === 1500
    && measurement.fixture?.rowsSha256 === fixture.rowsSha256
    && measurement.fixture?.sameSeedShared === true
    && measurement.fixture?.sameSeedCompleteDistinct === true;
  add('input-fixture-1500-distinct', fixtureOk,
    'fixture was empty, short, duplicated, or did not match the sealed 1,500-genome input', measurement.fixture);
  const initial = points.lazyBoot;
  const lazyEnd = points.lazyEnd;
  const lazyResource = measurement.lazySpeciesResource;
  add('lazy-art-not-eager', initial?.diagnostics?.lazyArt?.state === 'idle'
    && initial?.diagnostics?.lazyArt?.importStarts === 0 && initial?.diagnostics?.art === null
    && lazyEnd?.diagnostics?.documentToken === initial?.diagnostics?.documentToken
    && lazyEnd?.diagnostics?.lazyArt?.state === 'idle'
    && lazyEnd?.diagnostics?.lazyArt?.importStarts === 0 && lazyEnd?.diagnostics?.art === null
    && typeof lazyResource?.path === 'string' && lazyResource.path.endsWith('.js')
    && /^[a-f0-9]{64}$/.test(String(lazyResource?.sha256 || ''))
    && Array.isArray(lazyResource?.matches) && lazyResource.matches.length === 0
    && Array.isArray(lazyResource?.endMatches) && lazyResource.endMatches.length === 0,
  'the semantically identified species-art executable loaded before a Compendium/Planetside owner requested it',
  { loader: initial?.diagnostics?.lazyArt, resource: lazyResource });
  const firstDiag = points.first?.diagnostics;
  add('list-populated', firstDiag?.panel?.open === true && firstDiag?.panel?.mode === 'list'
    && firstDiag?.schema === DIAGNOSTICS_SCHEMA
    && typeof firstDiag?.documentToken === 'string' && firstDiag.documentToken
    && firstDiag?.window?.mountedRowCount > 0 && listImages(points.first).length > 0,
  'the measured list was empty or not mounted', {
    panel: firstDiag?.panel, mounted: firstDiag?.window?.mountedRowCount,
  });
  add('list-source-count-1500', firstDiag?.panel?.sourceCount === 1500
    && firstDiag?.panel?.filteredCount === 1500,
  'the browser did not measure the full 1,500-row source', firstDiag?.panel);
  add('first-row-reached', points.first?.raw?.mountedLogicalIds?.includes(measurement.targets?.first),
    'the first logical row was not mounted', points.first?.raw?.mountedLogicalIds);
  add('middle-row-reached', points.middle?.raw?.mountedLogicalIds?.includes(measurement.targets?.middle),
    'the middle logical row was not mounted after native scrolling', points.middle?.raw?.mountedLogicalIds);
  add('last-row-reached', points.last?.raw?.mountedLogicalIds?.includes(measurement.targets?.last),
    'the last logical row was not mounted after native scrolling', points.last?.raw?.mountedLogicalIds);
  add('filter-result', points.filtered?.diagnostics?.panel?.filteredCount === 1
    && points.filtered?.raw?.mountedLogicalIds?.includes(measurement.targets?.filter),
  'the native search did not isolate and mount the filter beacon', {
    panel: points.filtered?.diagnostics?.panel, ids: points.filtered?.raw?.mountedLogicalIds,
  });
  add('detail-opened', points.detail?.diagnostics?.panel?.mode === 'detail'
    && points.detail?.diagnostics?.surfaces?.detail?.open === true
    && points.detail?.diagnostics?.surfaces?.detail?.logicalId === measurement.targets?.detail
    && points.detail?.raw?.detailNaturalWidth === 440 && points.detail?.raw?.detailNaturalHeight === 440,
  'native row activation did not render the selected detail portrait', {
    panel: points.detail?.diagnostics?.panel, detail: points.detail?.diagnostics?.surfaces?.detail,
  });
  const backNavigation = measurement.phases?.backNavigation;
  const backWasDeepAndVisible = backNavigation?.before?.window?.start > 0
    && backNavigation?.before?.selectedLogicalId === measurement.targets?.detail
    && backNavigation?.before?.selectedIndex === 777
    && backNavigation?.before?.selectedMounted === true
    && backNavigation?.before?.selectedIntersects === true;
  const backAnchorStable = typeof backNavigation?.before?.logicalId === 'string'
    && backNavigation.before.logicalId
    && backNavigation.before.logicalId === backNavigation?.after?.logicalId
    && backNavigation.before.logicalId === backNavigation?.afterSettled?.logicalId
    && finite(backNavigation.before.offsetPx) && finite(backNavigation?.after?.offsetPx)
    && finite(backNavigation?.afterSettled?.offsetPx)
    && Math.abs(backNavigation.before.offsetPx - backNavigation.after.offsetPx) <= 2
    && Math.abs(backNavigation.before.offsetPx - backNavigation.afterSettled.offsetPx) <= 2;
  const backSelectionStable = [backNavigation?.after, backNavigation?.afterSettled]
    .every((sample) => sample?.selectedLogicalId === measurement.targets?.detail
      && sample?.selectedIndex === 777 && sample?.selectedMounted === true
      && sample?.selectedIntersects === true
      && (sample?.selectedInWindow === true || sample?.selectedPinned === true)
      && sample?.activeLogicalId === measurement.targets?.detail);
  add('back-restores-focus', points.back?.diagnostics?.panel?.mode === 'list'
    && points.back?.raw?.activeLogicalId === measurement.targets?.detail
    && points.back?.diagnostics?.panel?.filteredCount === 1500
    && points.back?.diagnostics?.panel?.query === ''
    && backWasDeepAndVisible && backAnchorStable && backSelectionStable,
  'Back did not restore the selected deep row and logical top-anchor/offset after two settlements', {
    mode: points.back?.diagnostics?.panel?.mode, active: points.back?.raw?.activeLogicalId,
    navigation: backNavigation,
  });
  const closedPlanetsideCount = points.closed?.diagnostics?.surfaces?.planetside?.visible
    ? points.closed.diagnostics.surfaces.planetside.logicalIds?.length ?? 0 : 0;
  add('close-restores-focus', points.closed?.diagnostics?.panel?.mode === 'closed'
    && ['dockcodex', 'railcodex'].includes(points.closed?.raw?.activeElementId)
    && art(points.closed)?.live?.leases === closedPlanetsideCount
    && art(points.closed)?.live?.subscribers <= closedPlanetsideCount,
  'Close did not return focus to its opener or release Compendium ownership', {
    panel: points.closed?.diagnostics?.panel, activeElementId: points.closed?.raw?.activeElementId,
    planetsideCount: closedPlanetsideCount, live: art(points.closed)?.live,
  });
  add('close-dom-cleanup', points.detailClosed?.diagnostics?.panel?.mode === 'closed'
    && points.detailClosed?.raw?.mountedRowCount === 0
    && points.detailClosed?.raw?.listImages?.length === 0
    && (points.detailClosed?.raw?.detailImageCount === 0
      || (points.detailClosed?.raw?.detailImageCount === 1
        && points.detailClosed?.raw?.detailSrcPresent === false
        && points.detailClosed?.raw?.detailNaturalWidth === 0
        && points.detailClosed?.raw?.detailNaturalHeight === 0))
    && points.closed?.raw?.mountedRowCount === 0
    && points.closed?.raw?.listImages?.length === 0,
  'detail→Close retained a decoded 440px source or final list→Close retained mounted rows/images', {
    detailClosed: points.detailClosed?.raw, listClosed: points.closed?.raw,
  });
  const pinnedId = measurement.targets?.pinned;
  const focusRing = points.focusPinned?.raw?.focusRing;
  const keyboardTraversal = measurement.phases?.keyboardTraversal;
  const traversalSamples = Array.isArray(keyboardTraversal?.samples)
    ? keyboardTraversal.samples : [];
  const keyboardTraversalOk = traversalSamples.length > keyboardTraversal?.initialWindowEnd
    && keyboardTraversal?.crossedWindowBoundary === true
    && keyboardTraversal?.reviewFocus?.intersects === true
    && keyboardTraversal?.reviewFocus?.outlineWidth >= 3
    && keyboardTraversal?.reviewFocus?.outlineOffset
      <= -keyboardTraversal?.reviewFocus?.outlineWidth
    && traversalSamples.every((sample, index) => sample.expectedIndex === index
      && sample.actualIndex === index
      && sample.expectedLogicalId === fixture.rows?.[index]?.[0]
      && sample.actualLogicalId === fixture.rows?.[index]?.[0]
      && sample.mounted === true && sample.mountedRowCount > 0
      && sample.mountedRowCount <= ceiling.mountedRowsMax && sample.mountedRowCount < 1500);
  add('focus-row-pinned', points.focusPinned?.diagnostics?.window?.focusedLogicalId === pinnedId
    && points.focusPinned?.diagnostics?.window?.pinnedLogicalIds?.includes(pinnedId)
    && points.focusPinned?.raw?.mountedLogicalIds?.includes(pinnedId)
    && points.focusPinned?.raw?.focusedOutsideNormalWindow === true
    && focusRing?.outlineStyle !== 'none' && focusRing?.outlineWidth >= 3
    && focusRing?.outlineOffset <= -focusRing?.outlineWidth
    && focusRing?.outlineExtension === Math.max(0,
      focusRing?.outlineWidth + focusRing?.outlineOffset)
    && Math.abs(focusRing?.ringLeft
      - (focusRing?.rowLeft - focusRing?.outlineExtension)) <= 0.1
    && Math.abs(focusRing?.ringRight
      - (focusRing?.rowRight + focusRing?.outlineExtension)) <= 0.1
    && focusRing?.ringLeft >= focusRing?.scrollerLeft - 0.5
    && focusRing?.ringRight <= focusRing?.scrollerRight + 0.5
    && focusRing?.horizontallyContained === true
    && keyboardTraversalOk,
  'focus pin/ring containment or native Tab traversal across a virtual-window boundary failed', {
    window: points.focusPinned?.diagnostics?.window,
    focusedOutsideNormalWindow: points.focusPinned?.raw?.focusedOutsideNormalWindow,
    focusRing, keyboardTraversal,
  });
  const psIds = points.planetside?.diagnostics?.surfaces?.planetside?.logicalIds;
  const psRawIds = planetsideImages(points.planetside).map((image) => image.logicalId);
  const psLifecycle = measurement.phases?.planetsideLifecycle;
  add('planetside-bounded', points.planetside?.diagnostics?.surfaces?.planetside?.visible === true
    && Array.isArray(psIds) && psIds.length > 0 && psIds.length <= 8
    && new Set(psIds).size === psIds.length && sameJson(psRawIds, psIds)
    && allPositive132(planetsideImages(points.planetside)),
  'Planetside did not expose a populated, unique, at-most-eight 132px thumb surface', {
    planetside: points.planetside?.diagnostics?.surfaces?.planetside,
    images: planetsideImages(points.planetside),
  });
  add('planetside-hide-release-reacquire', psLifecycle?.hidden?.computedHidden === true
    && psLifecycle?.hidden?.liveLeases === 0
    && Array.isArray(psLifecycle?.hidden?.images)
    && psLifecycle.hidden.images.length === psIds.length
    && psLifecycle.hidden.images.every((image) => image.srcPresent === false
      && image.visualKeyPresent === false && image.thumbState === 'released')
    && sameJson(psLifecycle?.revealed?.logicalIds, psIds)
    && psLifecycle?.revealed?.liveLeases === psIds.length
    && allPositive132(psLifecycle?.revealed?.images || []),
  'hidden Planetside retained a lease/source/key or failed to reacquire the same ready 132px roster',
  psLifecycle);
  const mountedMax = maxAt(selected, (snapshot) => snapshot.raw?.mountedRowCount);
  const resizeWindowOk = resizePoints.length === 4
    && resize.base.raw?.viewportHeight === measurement.viewport?.height
    && resize.contracted.raw?.viewportHeight < resize.base.raw.viewportHeight
    && resize.expanded.raw?.viewportHeight > resize.base.raw.viewportHeight
    && resize.restored.raw?.viewportHeight === resize.base.raw.viewportHeight
    && resize.contracted.raw?.scrollerHeight < resize.base.raw?.scrollerHeight - 0.5
    && resize.contracted.diagnostics?.window?.end < resize.base.diagnostics?.window?.end
    && resize.contracted.raw?.mountedRowCount < resize.base.raw?.mountedRowCount
    && resize.expanded.raw?.scrollerHeight > resize.contracted.raw?.scrollerHeight + 0.5
    && resize.expanded.diagnostics?.window?.end > resize.contracted.diagnostics?.window?.end
    && resize.expanded.raw?.mountedRowCount > resize.contracted.raw?.mountedRowCount
    && resize.restored.raw?.scrollerHeight > resize.contracted.raw?.scrollerHeight + 0.5
    && resize.restored.diagnostics?.window?.end > resize.contracted.diagnostics?.window?.end
    && resize.restored.raw?.mountedRowCount > resize.contracted.raw?.mountedRowCount
    && resizePoints.every((snapshot) => snapshot.raw?.mountedRowCount > 0
      && Math.abs(snapshot.raw.scrollTop - resize.base.raw.scrollTop) <= 1);
  add('mounted-window-bounded', mountedMax <= ceiling.mountedRowsMax && mountedMax < 1500
    && resizeWindowOk,
  'mounted rows exceeded the measured ceiling, or measured scroller contraction/expansion/restoration stayed stale/blank',
  { observedMax: mountedMax, ceiling: ceiling.mountedRowsMax, viewportResize: resize });
  add('mounted-natural-dimensions', selected.every((snapshot) => {
    const rows = snapshot.raw?.mountedLogicalIds;
    const images = listImages(snapshot);
    const rects = snapshot.raw?.rowRects;
    const sortedRects = Array.isArray(rects)
      ? [...rects].sort((left, right) => left.top - right.top) : [];
    return Array.isArray(rows) && rows.length === snapshot.raw?.mountedRowCount
      && new Set(rows).size === rows.length && images.length === rows.length
      && new Set(images.map((image) => image.logicalId)).size === images.length
      && sameJson(images.map((image) => image.logicalId), rows)
      && Array.isArray(rects) && rects.length === rows.length
      && new Set(rects.map((rect) => rect.logicalId)).size === rects.length
      && sameJson(rects.map((rect) => rect.logicalId), rows)
      && rects.every((rect) => finite(rect.top) && finite(rect.bottom)
        && finite(rect.height) && rect.height >= 44
        && Math.abs((rect.bottom - rect.top) - rect.height) < 0.5)
      && sortedRects.every((rect, index) => index === 0
        || rect.top >= sortedRects[index - 1].bottom - 0.5);
  }), 'raw mounted rows/images/rects disagreed, overlapped, or violated the 44px measured floor');
  const allThumbImages = selected.flatMap((snapshot) => listImages(snapshot))
    .concat(planetsideImages(points.planetside));
  add('list-source-132', allPositive132(allThumbImages),
    'a list/Planetside source was empty, zero-sized, or used a 440/full-size asset', allThumbImages);
  add('art-release', measurement.phases?.close?.releasesDelta > 0
    && measurement.phases?.close?.beforeLeases > measurement.phases?.close?.afterLeases
    && measurement.phases?.close?.afterLeases === closedPlanetsideCount
    && finalArt?.totals?.releases <= finalArt?.totals?.leaseAcquires,
  'the scoped list Close did not release ownership down to the Planetside-only baseline', {
    close: measurement.phases?.close, totals: finalArt?.totals,
  });
  add('art-disposal', points.capShrink?.disposalsDelta > 0,
    'the scoped immediate cap shrink did not dispose real assets', points.capShrink);
  add('art-dedupe', measurement.phases?.dedupe?.dedupeHitsDelta > 0,
    'the scoped native retained-row filter handoff did not hit the shared producer/cache',
  measurement.phases?.dedupe);
  add('full-identity-key', typeof measurement.identity?.alphaKey === 'string'
    && typeof measurement.identity?.betaKey === 'string'
    && measurement.identity.alphaKey !== measurement.identity.betaKey,
  'same-seed/different-complete-genome rows collapsed to one art key', measurement.identity);
  const filterTransitions = measurement.phases?.filterTransitions;
  const filterTransitionsExact = validFilterTransitionSequence(filterTransitions, {
    requireCompleteSet: true,
  }) && filterTransitions.every((transition) => transition.generationDelta === 1);
  add('generation-guard', integer(points.initial?.diagnostics?.generation)
    && integer(final?.diagnostics?.generation)
    && final.diagnostics.generation > points.initial.diagnostics.generation
    && nonnegative(final.diagnostics.panel.staleCompletionDrops)
    && final.diagnostics.panel.closedCompletionCommits === 0
    && measurement.phases?.churn?.jobCancelsDelta > 0
    && filterTransitionsExact,
  'generation did not advance exactly once per native filter/clear transition, invalidated work was not cancelled, or closed DOM was mutated', {
    initial: points.initial?.diagnostics?.generation, final: final?.diagnostics?.generation,
    panel: final?.diagnostics?.panel, churn: measurement.phases?.churn,
    filterTransitions,
  });
  add('error-contained', points.error?.jobErrorsDelta === 1
    && points.error?.uiResponsive === true && points.error?.poisonedCacheEntry === false,
  'one-shot producer failure did not remain contained and answerable', points.error);
  add('error-recoverable', points.error?.recoveryJobCompletesDelta >= 1
    && typeof points.error?.recoveredKey === 'string' && points.error.recoveredKey,
  'the failed key did not recover through a later real request', points.error);
  add('cap-shrink', points.capShrink?.beforeEntries > points.capShrink?.afterEntries
    && points.capShrink?.afterEntries <= points.capShrink?.phoneLimit
    && points.capShrink?.afterDecodedBytes <= points.capShrink?.phoneDecodedBytesLimit
    && points.capShrink?.beforeDeviceClass === 'desktop'
    && points.capShrink?.afterDeviceClass === 'phone'
    && points.capShrink?.restoredDeviceClass === profile
    && points.capShrink?.disposalsDelta > 0,
  'immediate phone-class trim did not shrink entries/decoded bytes and dispose assets', points.capShrink);
  add('canvas-thumb-path', finalArt?.totals?.thumbCanvasRenders > 0
    && finalArt.totals.thumbCanvasRenders >= finalArt.totals.jobCompletes,
  'thumb jobs bypassed the owned 132×132 canvas render path', finalArt?.totals);
  const beforeDetail = [points.first, points.middle, points.last, points.filtered].filter(Boolean);
  const afterDetail = [points.detailClosed, points.back, points.focusPinned,
    points.planetside, ...warm].filter(Boolean);
  const detailPortraitEntries = art(points.detail)?.live?.portraitCacheEntries;
  const detailPortraitBytes = art(points.detail)?.live?.portraitEncodedBytes;
  add('no-full-portrait-thumb-path', finalArt?.totals?.fullPortraitRendersForThumb === 0
    && finalArt?.totals?.fullPortraitDecodesForThumb === 0
    && beforeDetail.every((snapshot) => art(snapshot)?.live?.portraitCacheEntries === 0
      && art(snapshot)?.live?.portraitEncodedBytes === 0)
    && detailPortraitEntries === 1 && detailPortraitBytes > 0
    && afterDetail.every((snapshot) => art(snapshot)?.live?.portraitCacheEntries <= detailPortraitEntries
      && art(snapshot)?.live?.portraitEncodedBytes <= detailPortraitBytes),
  'thumb traffic rendered/decoded or grew the full-portrait cache beyond the one legitimate detail portrait', {
    totals: finalArt?.totals, detailPortraitEntries, detailPortraitBytes,
    after: afterDetail.map((snapshot) => ({
      entries: art(snapshot)?.live?.portraitCacheEntries,
      bytes: art(snapshot)?.live?.portraitEncodedBytes,
    })),
  });
  add('settled-jobs', warm.length >= REQUIRED_WARM_CYCLES && warm.every(settled),
    'warm-cycle evidence was short or retained queued/active jobs', warm.map((snapshot) => art(snapshot)?.live));
  const mainToken = points.initial?.diagnostics?.documentToken;
  const jobPeaks = measurement.phases?.jobPeaks;
  add('resource-live-limits', typeof mainToken === 'string' && mainToken
    && points.lazyBoot?.diagnostics?.documentToken !== mainToken
    && points.initial?.diagnostics?.documentToken === mainToken
    && liveWithinLimits(points.initial, profile)
    && jobPeaks?.deviceClass === profile
    && integer(jobPeaks?.queuedJobsPeak) && jobPeaks.queuedJobsPeak >= 1
    && integer(jobPeaks?.activeJobsPeak) && jobPeaks.activeJobsPeak >= 1
    && integer(jobPeaks?.queuedJobsLimit) && jobPeaks.queuedJobsPeak <= jobPeaks.queuedJobsLimit
    && integer(jobPeaks?.activeJobsLimit) && jobPeaks.activeJobsPeak <= jobPeaks.activeJobsLimit
    && selected.every((snapshot) => snapshot.diagnostics?.schema === DIAGNOSTICS_SCHEMA
      && snapshot.diagnostics?.documentToken === mainToken && liveWithinLimits(snapshot, profile)),
    'a live resource dimension exceeded or lacked its product-owned limit');
  const plateauTail = warm.slice(-3);
  const warmHeapRange = range(plateauTail.map((snapshot) => snapshot.heap?.usedSize));
  const warmDecodedRange = range(plateauTail.map((snapshot) => art(snapshot)?.live?.decodedBytes));
  const warmEncodedRange = range(plateauTail.map((snapshot) => art(snapshot)?.live?.encodedBytes));
  add('warm-plateau', warm.length >= REQUIRED_WARM_CYCLES
    && warmHeapRange <= ceiling.warmHeapRangeBytesMax
    && warmDecodedRange <= ceiling.warmDecodedBytesRangeMax
    && warmEncodedRange <= ceiling.warmEncodedBytesRangeMax,
  'settled warm cycles did not plateau within measured ranges', {
    warmHeapRange, warmDecodedRange, warmEncodedRange,
    ceilings: {
      heap: ceiling.warmHeapRangeBytesMax,
      decoded: ceiling.warmDecodedBytesRangeMax,
      encoded: ceiling.warmEncodedBytesRangeMax,
    },
  });
  const heapMax = maxAt(selected, (snapshot) => snapshot.heap?.usedSize);
  add('heap-ceiling', heapMax <= ceiling.heapUsedBytesMax,
    'Runtime.getHeapUsage usedSize exceeded the measured ceiling', {
      observedMax: heapMax, ceiling: ceiling.heapUsedBytesMax,
  });
  const documentsMax = maxAt(selected, (snapshot) => snapshot.dom?.documents);
  const nodesMax = maxAt(selected, (snapshot) => snapshot.dom?.nodes);
  const listenersMax = maxAt(selected, (snapshot) => snapshot.dom?.jsEventListeners);
  add('dom-ceiling', documentsMax <= ceiling.documentsMax && nodesMax <= ceiling.nodesMax
    && listenersMax <= ceiling.jsEventListenersMax,
  'Memory.getDOMCounters exceeded a measured document/node/listener ceiling', {
    observed: { documentsMax, nodesMax, listenersMax },
    ceilings: {
      documentsMax: ceiling.documentsMax, nodesMax: ceiling.nodesMax,
      jsEventListenersMax: ceiling.jsEventListenersMax,
    },
  });
  const cacheMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.cacheEntries);
  const decodedPixelsMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.decodedPixels);
  const decodedBytesMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.decodedBytes);
  const encodedBytesMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.encodedBytes);
  const queuedJobsPeak = jobPeaks?.queuedJobsPeak;
  const activeJobsPeak = jobPeaks?.activeJobsPeak;
  const leasesMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.leases);
  const subscribersMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.subscribers);
  const portraitEntriesMax = maxAt(selected,
    (snapshot) => art(snapshot)?.live?.portraitCacheEntries);
  const portraitEncodedBytesMax = maxAt(selected,
    (snapshot) => art(snapshot)?.live?.portraitEncodedBytes);
  add('byte-ceiling', cacheMax <= ceiling.liveCacheEntriesMax
    && decodedPixelsMax <= ceiling.liveDecodedPixelsMax
    && decodedBytesMax <= ceiling.liveDecodedBytesMax
    && encodedBytesMax <= ceiling.liveEncodedBytesMax
    && queuedJobsPeak >= 1 && queuedJobsPeak <= ceiling.queuedJobsPeakMax
    && activeJobsPeak >= 1 && activeJobsPeak <= ceiling.activeJobsPeakMax
    && leasesMax <= ceiling.liveLeasesMax
    && subscribersMax <= ceiling.liveSubscribersMax
    && portraitEntriesMax <= ceiling.livePortraitCacheEntriesMax
    && portraitEncodedBytesMax <= ceiling.livePortraitEncodedBytesMax,
  'resource counts, jobs, ownership, portrait cache, or byte/pixel totals exceeded a measured ceiling', {
    observed: { cacheMax, decodedPixelsMax, decodedBytesMax, encodedBytesMax,
      queuedJobsPeak, activeJobsPeak, leasesMax, subscribersMax,
      portraitEntriesMax, portraitEncodedBytesMax },
    ceilings: {
      cache: ceiling.liveCacheEntriesMax, decodedPixels: ceiling.liveDecodedPixelsMax,
      decodedBytes: ceiling.liveDecodedBytesMax, encodedBytes: ceiling.liveEncodedBytesMax,
      queuedJobsPeak: ceiling.queuedJobsPeakMax, activeJobsPeak: ceiling.activeJobsPeakMax,
      leases: ceiling.liveLeasesMax, subscribers: ceiling.liveSubscribersMax,
      portraitEntries: ceiling.livePortraitCacheEntriesMax,
      portraitEncodedBytes: ceiling.livePortraitEncodedBytesMax,
    },
  });
  const answerability = Array.isArray(measurement.answerability) ? measurement.answerability : [];
  const firstAnswer = answerability[0];
  const lastAnswer = answerability[1];
  const answerabilityShapeOk = answerability.length === 2;
  const targetOk = (probe, expected) => probe?.target?.ok === true
    && nonnegative(probe.target.ms) && probe.target.ms <= COMMAND_TIMEOUT_MS
    && probe.target.expected === expected && probe.target.value === expected;
  const heartbeatOk = (probe) => probe?.heartbeat?.ok === true
    && nonnegative(probe.heartbeat.ms) && probe.heartbeat.ms <= COMMAND_TIMEOUT_MS
    && typeof probe.heartbeat.product === 'string' && probe.heartbeat.product;
  add('target-answerable-first', answerabilityShapeOk && targetOk(firstAnswer, `${profile}-first`),
    'first post-load target task missed the 2s answerability deadline', firstAnswer?.target);
  add('heartbeat-first', answerabilityShapeOk && heartbeatOk(firstAnswer),
    'first independent browser heartbeat missed the 2s deadline', firstAnswer?.heartbeat);
  add('target-answerable-last', answerabilityShapeOk && targetOk(lastAnswer, `${profile}-last`),
    'final warm-cycle target task missed the 2s answerability deadline', lastAnswer?.target);
  add('heartbeat-last', answerabilityShapeOk && heartbeatOk(lastAnswer),
    'final independent browser heartbeat missed the 2s deadline', lastAnswer?.heartbeat);
  if (!sameJson(outcomes.map((outcome) => outcome.id),
    OUTCOME_IDS.map((id) => `${profile}/${id}`))) {
    throw new Error(`${profile}: internal outcome inventory order drifted`);
  }
  return outcomes;
}

export function sameSourceIdentity(left, right) {
  return isObject(left) && isObject(right)
    && left.commit === right.commit && left.branch === right.branch
    && left.state === right.state
    && left.statusSha256 === right.statusSha256
    && left.workingTreeSha256 === right.workingTreeSha256;
}

function validCommittedSourceIdentity(source) {
  return isObject(source) && /^[a-f0-9]{40}$/.test(String(source.commit || ''))
    && typeof source.branch === 'string' && source.branch.length > 0
    && source.state === 'committed'
    && /^[a-f0-9]{64}$/.test(String(source.statusSha256 || ''))
    && /^[a-f0-9]{64}$/.test(String(source.workingTreeSha256 || ''));
}

function validReviewItem(item, runId, verifyArtifact) {
  return isObject(item) && PROFILES.includes(item.profile)
    && REVIEW_PACKET_STATES.includes(item.state)
    && typeof item.file === 'string'
    && item.file === `apps/game/smoke/compendiummem-${runId}-${item.profile}-${item.state}.png`
    && Number.isSafeInteger(item.bytes) && item.bytes > 0
    && /^[a-f0-9]{64}$/.test(String(item.sha256 || ''))
    && (typeof verifyArtifact !== 'function' || verifyArtifact(item) === true);
}

function validPartialReviewPacket(packet, runId, verifyArtifact) {
  if (!Array.isArray(packet)) return false;
  const identities = packet.map((item) => `${item?.profile}/${item?.state}`);
  const files = packet.map((item) => item?.file);
  return new Set(identities).size === identities.length
    && new Set(files).size === files.length
    && packet.every((item) => validReviewItem(item, runId, verifyArtifact));
}

function validReviewPacket(packet, runId, verifyArtifact) {
  if (!validPartialReviewPacket(packet, runId, verifyArtifact)) return false;
  const expected = PROFILES.flatMap((profile) =>
    REVIEW_PACKET_STATES.map((state) => `${profile}/${state}`));
  const actual = packet.map((item) => `${item?.profile}/${item?.state}`);
  return actual.length === expected.length
    && sameJson([...actual].sort(), [...expected].sort())
    && new Set(actual).size === actual.length;
}

function validCommandSettlement(settlement, command, method) {
  if (!isObject(settlement) || settlement.method !== method
    || !['fulfilled', 'rejected'].includes(settlement.status)
    || !finite(settlement.completedAtMs) || !nonnegative(settlement.durationMs)
    || settlement.durationMs !== settlement.completedAtMs - command.issuedAtMs) return false;
  const expectedTimely = settlement.completedAtMs < command.commandDeadlineMs
    && settlement.completedAtMs < command.phaseDeadlineMs;
  if (settlement.timely !== expectedTimely) return false;
  const base = ['method', 'status', 'completedAtMs', 'durationMs', 'timely'];
  const expectedKeys = settlement.status === 'rejected'
    ? [...base, 'error', 'timeout']
    : method === 'Browser.getVersion' ? [...base, 'product'] : [...base, 'resultState'];
  if (!sameJson(Object.keys(settlement).sort(), expectedKeys.sort())) return false;
  if (settlement.status === 'rejected') {
    const expectedMessage = `${CANDIDATE_BROWSER_LABEL}: timed out waiting for ${method}`;
    const timeoutKeys = ['schema', 'method', 'timeoutMs'];
    const validTimeout = settlement.timeout === null
      ? settlement.error !== expectedMessage
      : isObject(settlement.timeout)
        && sameJson(Object.keys(settlement.timeout).sort(), timeoutKeys.sort())
        && settlement.timeout.schema === CANDIDATE_CDP_TIMEOUT_SCHEMA
        && settlement.timeout.method === method
        && settlement.timeout.timeoutMs === command.timeoutMs
        && settlement.error === expectedMessage;
    return typeof settlement.error === 'string' && settlement.error.length > 0 && validTimeout;
  }
  return method === 'Browser.getVersion'
    ? settlement.product === null
      || (typeof settlement.product === 'string' && settlement.product.length > 0)
    : ['value', 'page-exception', 'missing-value'].includes(settlement.resultState);
}

export function validCandidateCommandEvidence(command, { requireProductTimeout = false } = {}) {
  const keys = [
    'schema', 'profile', 'label', 'issuedAtMs', 'phaseDeadlineMs',
    'commandDeadlineMs', 'timeoutMs', 'target', 'heartbeat',
  ];
  if (!isObject(command) || !sameJson(Object.keys(command).sort(), keys.sort())
    || command.schema !== CANDIDATE_COMMAND_SCHEMA || !PROFILES.includes(command.profile)
    || typeof command.label !== 'string' || !command.label
    || !finite(command.issuedAtMs) || !finite(command.phaseDeadlineMs)
    || command.phaseDeadlineMs <= command.issuedAtMs
    || !integer(command.timeoutMs) || command.timeoutMs < 1
    || command.timeoutMs !== remainingCommandTimeoutMs(
      command.phaseDeadlineMs, command.issuedAtMs, COMMAND_TIMEOUT_MS,
    )
    || command.commandDeadlineMs !== Math.min(
      command.phaseDeadlineMs, command.issuedAtMs + command.timeoutMs,
    )
    || !validCommandSettlement(command.target, command, 'Runtime.evaluate')
    || !validCommandSettlement(command.heartbeat, command, 'Browser.getVersion')) return false;
  if (!requireProductTimeout) return true;
  const heartbeatHealthy = command.heartbeat.status === 'fulfilled'
    && command.heartbeat.timely === true
    && typeof command.heartbeat.product === 'string'
    && command.heartbeat.product.length > 0;
  const targetMissed = command.target.timely === false
    && (command.target.status === 'fulfilled'
      || (command.target.status === 'rejected' && command.target.timeout !== null
        && command.target.durationMs >= command.timeoutMs));
  return heartbeatHealthy && targetMissed;
}

function validPlainEvaluateCommand(command) {
  const keys = [
    'schema', 'profile', 'label', 'method', 'timeoutMs', 'issuedAtMs',
    'completedAtMs', 'durationMs', 'status', 'error',
  ];
  return isObject(command) && sameJson(Object.keys(command).sort(), keys.sort())
    && command.schema === PLAIN_EVALUATE_COMMAND_SCHEMA
    && PROFILES.includes(command.profile) && typeof command.label === 'string' && command.label
    && command.method === 'Runtime.evaluate'
    && integer(command.timeoutMs) && command.timeoutMs > 0
    && command.timeoutMs <= CANDIDATE_TRANSPORT_TIMEOUT_MS
    && finite(command.issuedAtMs) && finite(command.completedAtMs)
    && nonnegative(command.durationMs)
    && command.durationMs === command.completedAtMs - command.issuedAtMs
    && ['rejected', 'page-exception'].includes(command.status)
    && typeof command.error === 'string' && command.error.length > 0;
}

function validRawCdpCommand(command) {
  const keys = [
    'schema', 'profile', 'label', 'method', 'timeoutMs', 'issuedAtMs',
    'completedAtMs', 'durationMs', 'status', 'error',
  ];
  return isObject(command) && sameJson(Object.keys(command).sort(), keys.sort())
    && command.schema === RAW_CDP_COMMAND_SCHEMA
    && PROFILES.includes(command.profile) && typeof command.label === 'string' && command.label
    && typeof command.method === 'string' && command.method.length > 0
    && integer(command.timeoutMs) && command.timeoutMs > 0
    && command.timeoutMs <= CANDIDATE_TRANSPORT_TIMEOUT_MS
    && finite(command.issuedAtMs) && finite(command.completedAtMs)
    && nonnegative(command.durationMs)
    && command.durationMs === command.completedAtMs - command.issuedAtMs
    && command.status === 'rejected'
    && typeof command.error === 'string' && command.error.length > 0;
}

function validCompleteProfileMeasurement(measurement, profile) {
  return isObject(measurement) && measurement.profile === profile
    && isObject(measurement.viewport) && isObject(measurement.fixture)
    && isObject(measurement.documentTokens) && isObject(measurement.points)
    && isObject(measurement.phases)
    && validFilterTransitionSequence(measurement.phases.filterTransitions, {
      requireCompleteSet: true, requireProductSuccess: false,
    })
    && isObject(measurement.lazySpeciesResource)
    && Array.isArray(measurement.answerability)
    && Array.isArray(measurement.reviewPacket);
}

function validPartialProfileMeasurement(measurement, profile, runId, verifyArtifact, failure) {
  const keys = [
    'schema', 'profile', 'viewport', 'evidenceStatus', 'lastCompletedStage',
    'failingStage', 'completedStages', 'commandLedger', 'filterTransitions', 'reviewPacket',
  ];
  if (!isObject(measurement) || !sameJson(Object.keys(measurement).sort(), keys.sort())
    || measurement.schema !== PARTIAL_PROFILE_SCHEMA || measurement.profile !== profile
    || !isObject(measurement.viewport)
    || measurement.evidenceStatus !== 'partial-non-certifying'
    || (measurement.lastCompletedStage !== null
      && (typeof measurement.lastCompletedStage !== 'string' || !measurement.lastCompletedStage))
    || typeof measurement.failingStage !== 'string' || !measurement.failingStage
    || !Array.isArray(measurement.completedStages)
    || !measurement.completedStages.every((stage) => typeof stage === 'string' && stage)
    || !Array.isArray(measurement.commandLedger)
    || !measurement.commandLedger.every((command) =>
      validCandidateCommandEvidence(command) || validPlainEvaluateCommand(command)
        || validRawCdpCommand(command))
    || !validFilterTransitionSequence(measurement.filterTransitions, { allowPending: true })
    || !validPartialFilterTransitionPrefix(measurement, failure)
    || !validPartialReviewPacket(measurement.reviewPacket, runId, verifyArtifact)
    || !measurement.reviewPacket.every((item) => item.profile === profile)) return false;
  if (measurement.lastCompletedStage !== (measurement.completedStages.at(-1) ?? null)) return false;
  const completedReviewStates = measurement.completedStages
    .filter((stage) => stage.startsWith('review ')).map((stage) => stage.slice('review '.length));
  const packetStates = measurement.reviewPacket.map((item) => item.state);
  return sameJson([...completedReviewStates].sort(), [...packetStates].sort())
    && new Set(completedReviewStates).size === completedReviewStates.length;
}

function profileReviewPacket(profiles) {
  return Object.values(profiles).flatMap((measurement) =>
    Array.isArray(measurement?.reviewPacket) ? measurement.reviewPacket : []);
}

function sameReviewPacket(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  const normalize = (packet) => packet.map((item) => JSON.stringify(item)).sort();
  return sameJson(normalize(left), normalize(right));
}

function commandCompletedAt(command) {
  return command?.schema === CANDIDATE_COMMAND_SCHEMA
    ? Math.max(command.target.completedAtMs, command.heartbeat.completedAtMs)
    : command?.completedAtMs;
}

function candidateCommandFailed(command, browserProduct) {
  return command?.schema === CANDIDATE_COMMAND_SCHEMA
    && (command.target.status === 'rejected' || command.target.timely !== true
      || command.target.resultState !== 'value'
      || command.heartbeat.status === 'rejected' || command.heartbeat.timely !== true
      || command.heartbeat.product !== browserProduct);
}

function validPartialCommandLedger(measurement, failure, browserProduct) {
  const ledger = measurement.commandLedger;
  let priorCompletedAtMs = -Infinity;
  for (let index = 0; index < ledger.length; index += 1) {
    const command = ledger[index];
    const stageOwned = command.label === measurement.failingStage
      || measurement.completedStages.includes(command.label);
    if (command.profile !== measurement.profile || !stageOwned
      || command.issuedAtMs < priorCompletedAtMs) return false;
    if (command.schema === CANDIDATE_COMMAND_SCHEMA) {
      if (command.heartbeat.status === 'fulfilled'
        && command.heartbeat.product !== browserProduct) return false;
      const isReportedFailure = failure.command !== null
        && sameJson(command, failure.command);
      if (candidateCommandFailed(command, browserProduct) !== isReportedFailure) return false;
    } else if ([PLAIN_EVALUATE_COMMAND_SCHEMA, RAW_CDP_COMMAND_SCHEMA]
      .includes(command.schema)) {
      if (index !== ledger.length - 1 || !sameJson(command, failure.command)) return false;
    } else return false;
    priorCompletedAtMs = commandCompletedAt(command);
  }
  const terminal = ledger.at(-1) ?? null;
  if (failure.command !== null && !sameJson(terminal, failure.command)) return false;
  return !(failure.command === null && candidateCommandFailed(terminal, browserProduct));
}

function validPartialFailure(report, expectedRunId, verifyArtifact) {
  const failure = report.partialFailure;
  const keys = [
    'schema', 'classification', 'profile', 'lastCompletedStage',
    'failingStage', 'command',
  ];
  if (!isObject(failure) || !sameJson(Object.keys(failure).sort(), keys.sort())
    || failure.schema !== PARTIAL_FAILURE_SCHEMA
    || !['product-unanswerable', 'instrument'].includes(failure.classification)
    || (failure.profile !== null && !PROFILES.includes(failure.profile))
    || (failure.lastCompletedStage !== null
      && (typeof failure.lastCompletedStage !== 'string' || !failure.lastCompletedStage))
    || typeof failure.failingStage !== 'string' || !failure.failingStage
    || !isObject(report.profiles)
    || Object.keys(report.profiles).some((profile) => !PROFILES.includes(profile))
    || !validPartialReviewPacket(report.reviewPacket, expectedRunId, verifyArtifact)
    || !sameReviewPacket(report.reviewPacket, profileReviewPacket(report.profiles))) return false;
  const mayOmitBrowser = failure.profile === null && Object.keys(report.profiles).length === 0;
  if (!validBrowserProvenance(report.browser)
    && !(mayOmitBrowser && report.browser === null)) return false;
  if (failure.command !== null
    && (failure.profile === null || failure.command?.profile !== failure.profile
      || failure.command?.label !== failure.failingStage)) return false;
  const heartbeatProduct = failure.command?.schema === CANDIDATE_COMMAND_SCHEMA
    && failure.command?.heartbeat?.status === 'fulfilled'
    ? failure.command.heartbeat.product : null;
  if (heartbeatProduct !== null && heartbeatProduct !== report.browser?.product) return false;
  if (failure.command?.schema === RAW_CDP_COMMAND_SCHEMA) {
    const rawFinding = `instrument: ${failure.command.profile} ${failure.command.label}: `
      + `${failure.command.method} failed under the ${failure.command.timeoutMs}ms transport cap `
      + `(${failure.command.error})`;
    if (!Array.isArray(report.findings) || !report.findings.includes(rawFinding)) return false;
  }
  let partialCount = 0;
  for (const [profile, measurement] of Object.entries(report.profiles)) {
    if (measurement?.schema === PARTIAL_PROFILE_SCHEMA) {
      partialCount += 1;
      if (!validPartialProfileMeasurement(
        measurement, profile, expectedRunId, verifyArtifact, failure,
      )
        || profile !== failure.profile
        || measurement.lastCompletedStage !== failure.lastCompletedStage
        || measurement.failingStage !== failure.failingStage
        || !validPartialCommandLedger(
          measurement, failure, report.browser?.product,
        )) return false;
    } else if (!validCompleteProfileMeasurement(measurement, profile)) return false;
  }
  if (failure.profile === null) {
    if (partialCount !== 0 || failure.command !== null) return false;
  } else if (partialCount !== 1) return false;
  const profileKeys = Object.keys(report.profiles);
  const phonePartial = report.profiles.phone?.schema === PARTIAL_PROFILE_SCHEMA;
  const desktopPartial = report.profiles.desktop?.schema === PARTIAL_PROFILE_SCHEMA;
  const phoneComplete = report.profiles.phone !== undefined && !phonePartial;
  const desktopComplete = report.profiles.desktop !== undefined && !desktopPartial;
  const validPrefixShape = profileKeys.length === 0 && failure.profile === null
    || sameJson(profileKeys, ['phone']) && failure.profile === 'phone' && phonePartial
    || sameJson(profileKeys, ['phone', 'desktop']) && failure.profile === 'desktop'
      && phoneComplete && desktopPartial
    || sameJson(profileKeys, ['phone', 'desktop']) && failure.profile === null
      && phoneComplete && desktopComplete;
  if (!validPrefixShape) return false;
  if (failure.classification === 'product-unanswerable') {
    return failure.profile !== null
      && validCandidateCommandEvidence(failure.command, { requireProductTimeout: true });
  }
  if (validCandidateCommandEvidence(failure.command, { requireProductTimeout: true })) return false;
  return failure.command === null
    || validCandidateCommandEvidence(failure.command)
    || validPlainEvaluateCommand(failure.command)
    || validRawCdpCommand(failure.command);
}

function validProfileMeasurements(profiles) {
  if (!isObject(profiles)
    || !sameJson(Object.keys(profiles).sort(), [...PROFILES].sort())) return false;
  return PROFILES.every((profile) => validCompleteProfileMeasurement(profiles[profile], profile));
}

function completeFilterProductEvidenceBound(profiles, outcomes) {
  if (!isObject(profiles) || !Array.isArray(outcomes)) return false;
  return PROFILES.every((profile) => {
    const productSemanticsOk = validFilterTransitionSequence(
      profiles[profile]?.phases?.filterTransitions, { requireCompleteSet: true },
    );
    const generationOutcome = outcomes.find((outcome) =>
      outcome?.id === `${profile}/generation-guard`);
    return productSemanticsOk || generationOutcome?.status === 'fail';
  });
}

function validBrowserProvenance(browser) {
  const fields = [
    'executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version',
  ];
  return isObject(browser) && fields.every((field) =>
    typeof browser[field] === 'string' && browser[field].length > 0);
}

export function verifyTerminalReport(report, expectedRunId, {
  allowCalibration = false, verifyArtifact = null,
} = {}) {
  const errors = [];
  if (!isObject(report)) return { ok: false, errors: ['report must be an object'] };
  if (report.schema !== REPORT_SCHEMA) errors.push(`report schema must be ${REPORT_SCHEMA}`);
  if (report.runId !== expectedRunId) errors.push('report runId is not the requested current run');
  const terminal = allowCalibration
    ? ['pass', 'fail', 'instrument-fail', 'product-unanswerable', 'calibration']
    : ['pass', 'fail', 'instrument-fail', 'product-unanswerable'];
  if (!terminal.includes(report.status)) errors.push('report is not terminal');
  const policyKeys = [
    'attemptCount', 'automaticRetries', 'commandTimeoutMs', 'targetTimeoutMs',
    'heartbeatTimeoutMs', 'transportTimeoutMs',
  ];
  if (!isObject(report.policy)
    || !sameJson(Object.keys(report.policy).sort(), policyKeys.sort())
    || report.policy.attemptCount !== 1 || report.policy.automaticRetries !== 0
    || report.policy.commandTimeoutMs !== COMMAND_TIMEOUT_MS
    || report.policy.targetTimeoutMs !== COMMAND_TIMEOUT_MS
    || report.policy.heartbeatTimeoutMs !== COMMAND_TIMEOUT_MS
    || report.policy.transportTimeoutMs !== CANDIDATE_TRANSPORT_TIMEOUT_MS) {
    errors.push('one-attempt/no-retry/2s target+heartbeat/5s transport policy is invalid');
  }
  if (typeof report.startedAt !== 'string' || !Number.isFinite(Date.parse(report.startedAt))
    || typeof report.endedAt !== 'string' || !Number.isFinite(Date.parse(report.endedAt))
    || Date.parse(report.endedAt) < Date.parse(report.startedAt)) {
    errors.push('report timing is invalid');
  }
  if (!isObject(report.source) || !sameSourceIdentity(report.source.begin, report.source.end)) {
    errors.push('source identity changed or is incomplete');
  }
  if (!isObject(report.inputs)
    || !sameJson(Object.keys(report.inputs), REPORT_INPUT_KEYS)
    || values(report.inputs).some((value) => typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value))) {
    errors.push('exact input provenance is incomplete');
  }
  if (!sameJson(report.expectedOutcomes, EXPECTED_OUTCOMES)) {
    errors.push('sealed expected-outcome inventory drifted');
  }
  if (['instrument-fail', 'product-unanswerable'].includes(report.status)) {
    if (!Array.isArray(report.outcomes) || report.outcomes.length !== 0) {
      errors.push('partial terminal report must not claim completed product outcomes');
    }
    if (!Array.isArray(report.findings) || report.findings.length < 1) {
      errors.push('partial terminal report lacks a diagnosis');
    }
    if (!sameJson(report.blockedOutcomes, EXPECTED_OUTCOMES)) {
      errors.push('partial terminal report must block the complete sealed outcome inventory');
    }
    if (!validPartialFailure(report, expectedRunId, verifyArtifact)) {
      errors.push('partial terminal profile/stage/command/review evidence is invalid');
    }
    if (report.status === 'instrument-fail') {
      if (report.partialFailure?.classification !== 'instrument'
        || report.findings.some((finding) => typeof finding !== 'string'
          || !finding.startsWith('instrument: '))) {
        errors.push('instrument-fail report classification or diagnosis is invalid');
      }
    } else {
      if (report.partialFailure?.classification !== 'product-unanswerable'
        || report.findings.some((finding) => typeof finding !== 'string'
          || !finding.startsWith('product: '))) {
        errors.push('product-unanswerable report classification or diagnosis is invalid');
      }
      if (!validCommittedSourceIdentity(report.source?.begin)
        || !validCommittedSourceIdentity(report.source?.end)) {
        errors.push('product-unanswerable evidence requires one clean committed source identity');
      }
      if (!validBrowserProvenance(report.browser)) {
        errors.push('product-unanswerable browser provenance is incomplete');
      }
    }
    return { ok: errors.length === 0, errors };
  }
  if (report.partialFailure !== null) {
    errors.push('complete terminal report retained partial-failure evidence');
  }
  if (!Array.isArray(report.blockedOutcomes) || report.blockedOutcomes.length !== 0) {
    errors.push('complete terminal report retained blocked outcomes');
  }
  if (!validCommittedSourceIdentity(report.source?.begin)
    || !validCommittedSourceIdentity(report.source?.end)) {
    errors.push('certifying/calibration evidence requires one clean committed 40-hex source identity');
  }
  if (!validBrowserProvenance(report.browser)) {
    errors.push('browser provenance is incomplete');
  }
  if (!Array.isArray(report.outcomes)) errors.push('outcomes are missing');
  else {
    const ids = report.outcomes.map((outcome) => outcome?.id);
    if (!sameJson(ids, EXPECTED_OUTCOMES)) errors.push('current-run outcome inventory is missing, duplicated, or reordered');
    for (const outcome of report.outcomes) {
      if (!['pass', 'fail'].includes(outcome?.status)) errors.push(`outcome ${String(outcome?.id)} has invalid status`);
      if (outcome?.status === 'fail' && (typeof outcome.diagnosis !== 'string' || !outcome.diagnosis)) {
        errors.push(`failed outcome ${String(outcome?.id)} lacks a diagnosis`);
      }
    }
  }
  const failed = Array.isArray(report.outcomes)
    ? report.outcomes.filter((outcome) => outcome?.status === 'fail') : [];
  if (!validProfileMeasurements(report.profiles)) {
    errors.push('raw phone/desktop profile measurements are incomplete');
  }
  if (!completeFilterProductEvidenceBound(report.profiles, report.outcomes)) {
    errors.push('raw native-filter product evidence is not bound to generation-guard FAIL');
  }
  if (!validReviewPacket(report.reviewPacket, expectedRunId, verifyArtifact)) {
    errors.push('run-bound phone/desktop visual review packet is incomplete');
  }
  if (report.status === 'pass' && failed.length) errors.push('PASS report contains failed outcomes');
  if (report.status === 'pass' && report.budget?.status !== 'active') {
    errors.push('PASS report did not use an active measured budget');
  }
  if (report.status === 'pass' && (!Array.isArray(report.findings) || report.findings.length !== 0)) {
    errors.push('PASS report contains findings');
  }
  if (report.status === 'fail' && !failed.length) errors.push('FAIL report contains no failed outcome');
  if (report.status === 'calibration') {
    if (!allowCalibration) errors.push('calibration report is not certifying evidence');
    if (failed.length) errors.push('calibration report contains failed behavioral outcomes');
    if (!Array.isArray(report.findings) || report.findings.length !== 0) {
      errors.push('calibration report contains findings');
    }
    if (report.budget?.status !== 'calibration-required') {
      errors.push('calibration report did not retain the fail-closed budget state');
    }
  }
  return { ok: errors.length === 0, errors };
}

export function calibrationMetrics(measurement) {
  const resize = measurement.phases?.viewportResize;
  const selected = [measurement.points?.first, measurement.points?.middle,
    measurement.points?.last, measurement.points?.filtered, measurement.points?.detail,
    measurement.points?.detailClosed, measurement.points?.back,
    measurement.points?.focusPinned, measurement.points?.closed,
    measurement.points?.planetside,
    resize?.base, resize?.contracted, resize?.expanded, resize?.restored,
    ...(measurement.points?.warm || [])].filter(Boolean);
  const tail = (measurement.points?.warm || []).slice(-3);
  return {
    mountedRows: maxAt(selected, (snapshot) => snapshot.raw?.mountedRowCount),
    heapUsedBytes: maxAt(selected, (snapshot) => snapshot.heap?.usedSize),
    documents: maxAt(selected, (snapshot) => snapshot.dom?.documents),
    nodes: maxAt(selected, (snapshot) => snapshot.dom?.nodes),
    jsEventListeners: maxAt(selected, (snapshot) => snapshot.dom?.jsEventListeners),
    liveCacheEntries: maxAt(selected, (snapshot) => art(snapshot)?.live?.cacheEntries),
    liveDecodedPixels: maxAt(selected, (snapshot) => art(snapshot)?.live?.decodedPixels),
    liveDecodedBytes: maxAt(selected, (snapshot) => art(snapshot)?.live?.decodedBytes),
    liveEncodedBytes: maxAt(selected, (snapshot) => art(snapshot)?.live?.encodedBytes),
    queuedJobsPeak: measurement.phases?.jobPeaks?.queuedJobsPeak,
    activeJobsPeak: measurement.phases?.jobPeaks?.activeJobsPeak,
    liveLeases: maxAt(selected, (snapshot) => art(snapshot)?.live?.leases),
    liveSubscribers: maxAt(selected, (snapshot) => art(snapshot)?.live?.subscribers),
    livePortraitCacheEntries: maxAt(selected,
      (snapshot) => art(snapshot)?.live?.portraitCacheEntries),
    livePortraitEncodedBytes: maxAt(selected,
      (snapshot) => art(snapshot)?.live?.portraitEncodedBytes),
    warmHeapRangeBytes: range(tail.map((snapshot) => snapshot.heap?.usedSize)),
    warmDecodedBytesRange: range(tail.map((snapshot) => art(snapshot)?.live?.decodedBytes)),
    warmEncodedBytesRange: range(tail.map((snapshot) => art(snapshot)?.live?.encodedBytes)),
  };
}
