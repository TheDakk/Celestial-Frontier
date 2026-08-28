/* Arc 4 real-time recovery certificate contract.

   This module owns no browser, clock, DOM, storage or report file. The
   collector supplies monotonically timestamped service receipts from one
   reopened target; this contract independently requires a full real
   20-minute interval, uninterrupted foreground eligibility, a tightly
   bracketed next-cycle crossing, and an exact terminal report lifecycle. */
import { createHash } from 'node:crypto';
import {
  ARC4_ACTIVE_PLAY_CYCLE_MS,
} from './arc4-browser-contract.mjs';

export const ARC4_RECOVERY_INPUT_SCHEMA =
  'cf-v2-arc4-recovery-certificate-input/v1';
export const ARC4_RECOVERY_OBSERVATION_SCHEMA =
  'cf-v2-arc4-recovery-active-observation/v1';
export const ARC4_RECOVERY_SERVICE_SCHEMA =
  'cf-v2-arc4-recovery-service-turn/v1';
export const ARC4_RECOVERY_OBSERVER_SCHEMA =
  'cf-v2-arc4-recovery-lifecycle-observer/v1';
export const ARC4_RECOVERY_REPORT_SCHEMA =
  'cf-v2-arc4-recovery-report/v1';
export const ARC4_RECOVERY_LIFECYCLE_SCHEMA =
  'cf-v2-arc4-recovery-report-lifecycle/v1';
export const ARC4_RECOVERY_RUNTIME_CAPTURE_WITNESS_SCHEMA =
  'cf-v2-arc4-recovery-runtime-capture-witness/v1';
const ARC4_RECOVERY_SUPPRESSION_SOURCE_SHA256 =
  '22e8704122103323d0dd0079ce0d2821d69f249a860f31e4062f51b9f8e68771';
export const ARC4_RECOVERY_PRECONDITION_CHECK_KEYS = Object.freeze([
  'captured', 'routeSettled', 'durableEvidence', 'fixtureIdentity', 'route',
  'renderedReceipt', 'authorityReady', 'activePlayProjection',
  'runtimeCaptureOrder', 'acquisitionSource', 'ownershipReady',
  'ownershipV2Ready', 'uiComplete', 'surfaceCopy', 'finiteYield',
  'randomFullPool', 'actionsIdle',
]);

export const ARC4_RECOVERY_ACTIVE_OBSERVATION_MS = ARC4_ACTIVE_PLAY_CYCLE_MS;
export const ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS = 6_500;
export const ARC4_RECOVERY_BOUNDARY_SERVICE_GAP_MAX_MS = 1_000;
export const ARC4_RECOVERY_CLOCK_GAP_MAX_MS = 1_000;
export const ARC4_RECOVERY_SERVICE_TURN_MAX_MS = 3_000;
export const ARC4_RECOVERY_TOTAL_CLOCK_PARITY_MAX_MS = 2_000;
export const ARC4_RECOVERY_MIN_BOUNDARY_WAIT_MS = 1_100_000;
export const ARC4_RECOVERY_UI_TRANSITION_LATENCY_MAX_MS =
  ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS;
export const ARC4_RECOVERY_AUTHORITY_BINDING_SCHEMA =
  'cf-v2-arc4-recovery-observation-authority/v1';

export const ARC4_RECOVERY_STAGE_ORDER = Object.freeze([
  'fixture',
  'burn-down',
  'exhausted',
  'close-checkpoint',
  'offline-closed',
  'offline-reopened',
  'active-observation',
  'boundary-crossed',
  'recovered',
  'cleanup',
]);

const record = (value) => value !== null && typeof value === 'object'
  && !Array.isArray(value);
const exactKeys = (value, expected) => record(value)
  && same(Object.keys(value).sort(), [...expected].sort());
const integer = (value) => Number.isSafeInteger(value) && value >= 0;
const finite = (value) => typeof value === 'number' && Number.isFinite(value)
  && value >= 0;
const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (record(value)) return `{${Object.keys(value).sort().map(
    (key) => `${JSON.stringify(key)}:${stableJson(value[key])}`,
  ).join(',')}}`;
  return JSON.stringify(value);
};
const same = (left, right) => stableJson(left) === stableJson(right);
const outcome = (id, pass, message) => Object.freeze({ id, pass, message });
const exactBrowser = (value) => record(value)
  && typeof value.executable === 'string' && value.executable.length > 0
  && typeof value.product === 'string' && value.product.length > 0
  && typeof value.revision === 'string' && value.revision.length > 0
  && typeof value.userAgent === 'string' && value.userAgent.length > 0
  && typeof value.jsVersion === 'string' && value.jsVersion.length > 0
  && typeof value.protocolVersion === 'string' && value.protocolVersion.length > 0;
const serviceBrowser = (browser) => browser ? {
  product: browser.product,
  revision: browser.revision,
  protocolVersion: browser.protocolVersion,
} : null;
const sessionRngOfRuntime = (runtime) => record(runtime) ? {
  seed: runtime.sessionSeed,
  ordinal: runtime.sessionOrdinal,
  draws: runtime.sessionDraws,
} : null;
const sessionRngOfRaw = (raw) => raw?.authority?.sessionRng ?? null;
const documentTokenOf = (state) => state?.persistence?.documentToken ?? null;
const runtimeOf = (state) => state?.persistence?.runtime ?? null;
const captureFactsOfUi = (ui) => Object.freeze({
  budget: Object.freeze({
    yield: ui?.budget?.yield ?? null,
    used: ui?.budget?.used ?? null,
    remaining: ui?.budget?.remaining ?? null,
    cycle: ui?.budget?.cycle ?? null,
  }),
  rows: Object.freeze((Array.isArray(ui?.rows) ? ui.rows : []).map((row) =>
    Object.freeze({
      verb: row?.verb ?? null,
      status: row?.status ?? null,
      modelEnabled: row?.button?.modelEnabled ?? null,
      disabled: row?.button?.disabled ?? null,
      ariaDisabled: row?.button?.ariaDisabled ?? null,
    }))),
});

export function projectArc4RecoveryObservationAuthority(bundle) {
  if (!record(bundle)) return null;
  return Object.freeze({
    schema: ARC4_RECOVERY_AUTHORITY_BINDING_SCHEMA,
    closedDocumentToken: bundle.closure?.closedDocumentToken ?? null,
    reopenedDocumentToken: bundle.closure?.reopenedDocumentToken ?? null,
    exhaustedStateDocumentToken: documentTokenOf(bundle.exhaustedState),
    closedStateDocumentToken: documentTokenOf(bundle.closedState),
    offlineStateDocumentToken: documentTokenOf(bundle.offlineState),
    recoveredStateDocumentToken: documentTokenOf(bundle.recoveredState),
    exhaustedCycle: bundle.exhaustedUi?.budget?.cycle ?? null,
    offlineCycle: bundle.offlineUi?.budget?.cycle ?? null,
    recoveredCycle: bundle.recoveredUi?.budget?.cycle ?? null,
    expectedBoundaryActivePlayMs: integer(bundle.exhaustedUi?.budget?.cycle)
      ? (bundle.exhaustedUi.budget.cycle + 1) * ARC4_ACTIVE_PLAY_CYCLE_MS
      : null,
    exhaustedActivePlayMs: bundle.exhaustedRaw?.authority?.activePlayMs ?? null,
    closedActivePlayMs: bundle.closedRaw?.authority?.activePlayMs ?? null,
    offlineDurableActivePlayMs: bundle.offlineRaw?.authority?.activePlayMs ?? null,
    offlineRuntimeActivePlayMs:
      bundle.offlineState?.persistence?.runtime?.activePlayMs ?? null,
    recoveredDurableActivePlayMs: bundle.recoveredRaw?.authority?.activePlayMs ?? null,
    recoveredRuntimeActivePlayMs:
      bundle.recoveredState?.persistence?.runtime?.activePlayMs ?? null,
    exhaustedCaptureFacts: captureFactsOfUi(bundle.exhaustedUi),
    offlineCaptureFacts: captureFactsOfUi(bundle.offlineUi),
    recoveredCaptureFacts: captureFactsOfUi(bundle.recoveredUi),
    exhaustedSessionRng: sessionRngOfRaw(bundle.exhaustedRaw),
    exhaustedStateSessionRng: sessionRngOfRuntime(runtimeOf(bundle.exhaustedState)),
    closedSessionRng: sessionRngOfRaw(bundle.closedRaw),
    closedStateSessionRng: sessionRngOfRuntime(runtimeOf(bundle.closedState)),
    offlineSessionRng: sessionRngOfRaw(bundle.offlineRaw),
    offlineStateSessionRng: sessionRngOfRuntime(runtimeOf(bundle.offlineState)),
    offlineUiSessionRng: sessionRngOfRuntime(runtimeOf(bundle.offlineUi)),
    recoveredSessionRng: sessionRngOfRaw(bundle.recoveredRaw),
    recoveredStateSessionRng: sessionRngOfRuntime(runtimeOf(bundle.recoveredState)),
    recoveredUiSessionRng: sessionRngOfRuntime(runtimeOf(bundle.recoveredUi)),
  });
}
const eligibleRuntime = (runtime) => record(runtime)
  && runtime.visible === true && runtime.answerable === true
  && runtime.leaseOwned === true && runtime.accruing === true
  && integer(runtime.activePlayMs) && integer(runtime.revision)
  && integer(runtime.sessionSeed) && integer(runtime.sessionOrdinal)
  && record(runtime.sessionDraws);
const exactCaptureFacts = (facts) => record(facts)
  && record(facts.budget)
  && ['yield', 'used', 'remaining', 'cycle'].every(
    (key) => integer(facts.budget[key]),
  )
  && Array.isArray(facts.rows) && facts.rows.length === 3
  && facts.rows.every((row) => record(row)
    && ['tame', 'scavenge', 'sample'].includes(row.verb)
    && typeof row.status === 'string' && row.status.length > 0
    && ['true', 'false'].includes(row.modelEnabled)
    && typeof row.disabled === 'boolean'
    && ['true', 'false'].includes(row.ariaDisabled))
  && new Set(facts.rows.map(({ verb }) => verb)).size === 3;
const exhaustedCaptureFacts = (facts, cycle) => {
  return exactCaptureFacts(facts)
    && facts.budget.yield === 16 && facts.budget.used === 16
    && facts.budget.remaining === 0 && facts.budget.cycle === cycle
    && facts.rows.some((row) => row.status === 'depleted')
    && facts.rows.every((row) => ['empty', 'depleted'].includes(row.status)
      && row.modelEnabled === 'false' && row.disabled === true
      && row.ariaDisabled === 'true');
};
const recoveredCaptureFacts = (facts, cycle) => exactCaptureFacts(facts)
  && facts.budget.yield === 16 && facts.budget.used === 0
  && facts.budget.remaining === 16 && facts.budget.cycle === cycle
  && facts.rows.every((row) => row.status === 'ready'
    && row.modelEnabled === 'true' && row.disabled === false
    && row.ariaDisabled === 'false');

function exactServiceTurn(sample, index, documentToken, browser) {
  const before = sample?.target?.before;
  const after = sample?.target?.after;
  const expectedBrowser = serviceBrowser(browser);
  return sample?.schema === ARC4_RECOVERY_SERVICE_SCHEMA
    && sample?.index === index
    && integer(sample?.nodeStartedAtMonotonicMs)
    && integer(sample?.nodeEndedAtMonotonicMs)
    && sample.nodeStartedAtMonotonicMs <= sample.nodeEndedAtMonotonicMs
    && same(sample?.browserBefore, expectedBrowser)
    && same(sample?.browserAfter, expectedBrowser)
    && before?.sequence === index && after?.sequence === index
    && before?.documentToken === documentToken
    && after?.documentToken === documentToken
    && before?.visibilityState === 'visible'
    && after?.visibilityState === 'visible'
    && before?.hidden === false && after?.hidden === false
    && before?.focused === true && after?.focused === true
    && finite(before?.performanceNow) && finite(after?.performanceNow)
    && before.performanceNow < after.performanceNow
    && integer(before?.tickerTicks) && integer(after?.tickerTicks)
    && after.tickerTicks > before.tickerTicks
    && eligibleRuntime(before?.runtime) && eligibleRuntime(after?.runtime)
    && after.runtime.activePlayMs >= before.runtime.activePlayMs
    && after.runtime.revision >= before.runtime.revision
    && before.runtime.sessionSeed === after.runtime.sessionSeed
    && before.runtime.sessionOrdinal === after.runtime.sessionOrdinal
    && same(before.runtime.sessionDraws, after.runtime.sessionDraws)
    && exactCaptureFacts(before?.capture)
    && exactCaptureFacts(after?.capture);
}

export function evaluateArc4RecoveryObservation(input) {
  const observation = input?.observation;
  const browser = input?.browser;
  const authority = input?.authorityBinding;
  const samples = Array.isArray(observation?.samples) ? observation.samples : [];
  const documentToken = observation?.documentToken;
  const first = samples[0];
  const last = samples.at(-1);
  const firstActive = first?.target?.before?.runtime?.activePlayMs;
  const lastActive = last?.target?.after?.runtime?.activePlayMs;
  const firstBrowserAt = first?.target?.before?.performanceNow;
  const lastBrowserAt = last?.target?.after?.performanceNow;
  const expectedBoundary = integer(firstActive)
    ? (Math.floor(firstActive / ARC4_ACTIVE_PLAY_CYCLE_MS) + 1)
      * ARC4_ACTIVE_PLAY_CYCLE_MS
    : null;
  const firstAtOrAfterBoundary = expectedBoundary === null ? -1
    : samples.findIndex((sample) => (
      sample?.target?.after?.runtime?.activePlayMs >= expectedBoundary
    ));
  const beforeBoundaryIndex = firstAtOrAfterBoundary - 1;
  const beforeBoundary = samples[beforeBoundaryIndex];
  const afterBoundary = samples[firstAtOrAfterBoundary];
  const browserElapsedMs = finite(firstBrowserAt) && finite(lastBrowserAt)
    ? lastBrowserAt - firstBrowserAt : Number.NaN;
  const nodeElapsedMs = integer(observation?.startedAtMonotonicMs)
    && integer(observation?.endedAtMonotonicMs)
    ? observation.endedAtMonotonicMs - observation.startedAtMonotonicMs
    : Number.NaN;
  const activeElapsedMs = integer(firstActive) && integer(lastActive)
    ? lastActive - firstActive : Number.NaN;

  const schemaPass = input?.schema === ARC4_RECOVERY_INPUT_SCHEMA
    && observation?.schema === ARC4_RECOVERY_OBSERVATION_SCHEMA;
  const browserPass = exactBrowser(browser);
  const policyPass = same(input?.policy, {
    attemptCount: 1,
    automaticRetries: 0,
    activeObservationRequiredMs: ARC4_RECOVERY_ACTIVE_OBSERVATION_MS,
    regularServiceGapMaxMs: ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS,
    boundaryServiceGapMaxMs: ARC4_RECOVERY_BOUNDARY_SERVICE_GAP_MAX_MS,
    activeClockGapMaxMs: ARC4_RECOVERY_CLOCK_GAP_MAX_MS,
    serviceTurnMaxMs: ARC4_RECOVERY_SERVICE_TURN_MAX_MS,
    totalClockParityMaxMs: ARC4_RECOVERY_TOTAL_CLOCK_PARITY_MAX_MS,
    minimumBoundaryWaitMs: ARC4_RECOVERY_MIN_BOUNDARY_WAIT_MS,
    uiTransitionLatencyMaxMs: ARC4_RECOVERY_UI_TRANSITION_LATENCY_MAX_MS,
  });
  const inventoryPass = samples.length >= 3
    && typeof documentToken === 'string' && documentToken.length >= 16
    && samples.every((sample, index) => exactServiceTurn(
      sample, index, documentToken, browser,
    ));
  const turnTimingPass = inventoryPass && samples.every((sample) => {
    const nodeDuration = sample.nodeEndedAtMonotonicMs
      - sample.nodeStartedAtMonotonicMs;
    const browserDuration = sample.target.after.performanceNow
      - sample.target.before.performanceNow;
    return nodeDuration >= 0 && browserDuration >= 0
      && nodeDuration <= ARC4_RECOVERY_SERVICE_TURN_MAX_MS
      && browserDuration <= ARC4_RECOVERY_SERVICE_TURN_MAX_MS
      && Math.abs(nodeDuration - browserDuration)
        <= ARC4_RECOVERY_CLOCK_GAP_MAX_MS;
  });
  const cadencePass = turnTimingPass && samples.slice(1).every((sample, index) => {
    const prior = samples[index];
    const nodeGap = sample.nodeStartedAtMonotonicMs
      - prior.nodeEndedAtMonotonicMs;
    const browserGap = sample.target.before.performanceNow
      - prior.target.after.performanceNow;
    return nodeGap >= 0 && browserGap >= 0
      && nodeGap <= ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS
      && browserGap <= ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS
      && Math.abs(nodeGap - browserGap) <= ARC4_RECOVERY_CLOCK_GAP_MAX_MS
      && sample.target.before.runtime.activePlayMs
        >= prior.target.after.runtime.activePlayMs;
  });
  const observer = observation?.observer;
  const observerPass = observer?.schema === ARC4_RECOVERY_OBSERVER_SCHEMA
    && observer?.documentToken === documentToken
    && observer?.initial?.visibilityState === 'visible'
    && observer?.initial?.hidden === false
    && observer?.initial?.focused === true
    && observer?.initial?.answerable === true
    && observer?.initial?.accruing === true
    && observer?.initial?.leaseOwned === true
    && same(observer?.events, [])
    && observer?.serviceTurns === samples.length
    && observer?.final?.visibilityState === 'visible'
    && observer?.final?.hidden === false
    && observer?.final?.focused === true
    && observer?.final?.answerable === true
    && observer?.final?.accruing === true
    && observer?.final?.leaseOwned === true;
  const realtimePass = inventoryPass
    && observation.startedAtMonotonicMs === first.nodeStartedAtMonotonicMs
    && observation.endedAtMonotonicMs === last.nodeEndedAtMonotonicMs
    && nodeElapsedMs >= ARC4_RECOVERY_ACTIVE_OBSERVATION_MS
    && browserElapsedMs >= ARC4_RECOVERY_ACTIVE_OBSERVATION_MS
    && Math.abs(nodeElapsedMs - browserElapsedMs)
      <= ARC4_RECOVERY_TOTAL_CLOCK_PARITY_MAX_MS;
  const activeClockPoints = samples.flatMap((sample) => [
    sample?.target?.before, sample?.target?.after,
  ]);
  const prefixClockPass = realtimePass && activeClockPoints.every((point) =>
    finite(point?.performanceNow) && integer(point?.runtime?.activePlayMs)
      && Math.abs(
        (point.performanceNow - firstBrowserAt)
          - (point.runtime.activePlayMs - firstActive),
      ) <= ARC4_RECOVERY_CLOCK_GAP_MAX_MS);
  const clockPass = prefixClockPass
    && activeElapsedMs >= ARC4_RECOVERY_ACTIVE_OBSERVATION_MS
    && Math.abs(browserElapsedMs - activeElapsedMs)
      <= ARC4_RECOVERY_CLOCK_GAP_MAX_MS
    && samples.slice(1).every((sample, index) => (
      sample.target.before.runtime.activePlayMs
        >= samples[index].target.after.runtime.activePlayMs
    ));
  const boundaryPass = clockPass && expectedBoundary !== null
    && observation?.boundary?.activePlayMs === expectedBoundary
    && observation?.boundary?.beforeSampleIndex === beforeBoundaryIndex
    && observation?.boundary?.afterSampleIndex === firstAtOrAfterBoundary
    && beforeBoundaryIndex >= 0
    && beforeBoundary?.target?.after?.runtime?.activePlayMs < expectedBoundary
    && afterBoundary?.target?.after?.runtime?.activePlayMs >= expectedBoundary
    && afterBoundary.nodeStartedAtMonotonicMs
      - beforeBoundary.nodeEndedAtMonotonicMs
      <= ARC4_RECOVERY_BOUNDARY_SERVICE_GAP_MAX_MS
    && afterBoundary.target.before.performanceNow
      - beforeBoundary.target.after.performanceNow
      <= ARC4_RECOVERY_BOUNDARY_SERVICE_GAP_MAX_MS
    && Math.abs(
      (afterBoundary.nodeStartedAtMonotonicMs
        - beforeBoundary.nodeEndedAtMonotonicMs)
      - (afterBoundary.target.before.performanceNow
        - beforeBoundary.target.after.performanceNow),
    ) <= ARC4_RECOVERY_CLOCK_GAP_MAX_MS
    && Math.floor(lastActive / ARC4_ACTIVE_PLAY_CYCLE_MS)
      === Math.floor(firstActive / ARC4_ACTIVE_PLAY_CYCLE_MS) + 1;
  const bindingPass = authority?.schema === ARC4_RECOVERY_AUTHORITY_BINDING_SCHEMA
    && authority?.closedDocumentToken === authority?.exhaustedStateDocumentToken
    && authority?.closedDocumentToken === authority?.closedStateDocumentToken
    && authority?.reopenedDocumentToken === authority?.offlineStateDocumentToken
    && authority?.reopenedDocumentToken === authority?.recoveredStateDocumentToken
    && authority?.closedDocumentToken !== authority?.reopenedDocumentToken
    && authority?.reopenedDocumentToken === documentToken
    && integer(authority?.exhaustedCycle)
    && authority?.offlineCycle === authority.exhaustedCycle
    && authority?.recoveredCycle === authority.exhaustedCycle + 1
    && authority?.expectedBoundaryActivePlayMs
      === (authority.exhaustedCycle + 1) * ARC4_ACTIVE_PLAY_CYCLE_MS
    && authority?.expectedBoundaryActivePlayMs === expectedBoundary
    && integer(authority?.exhaustedActivePlayMs)
    && integer(authority?.closedActivePlayMs)
    && authority.closedActivePlayMs >= authority.exhaustedActivePlayMs
    && authority?.offlineDurableActivePlayMs === authority.closedActivePlayMs
    && integer(authority?.offlineRuntimeActivePlayMs)
    && authority.offlineRuntimeActivePlayMs >= authority.offlineDurableActivePlayMs
    && firstActive >= authority.offlineRuntimeActivePlayMs
    && firstActive - authority.offlineRuntimeActivePlayMs
      <= ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS
    && integer(authority?.recoveredDurableActivePlayMs)
    && authority.recoveredDurableActivePlayMs >= expectedBoundary
    && authority.recoveredDurableActivePlayMs <= lastActive
    && integer(authority?.recoveredRuntimeActivePlayMs)
    && authority.recoveredRuntimeActivePlayMs >= lastActive
    && authority.recoveredRuntimeActivePlayMs - lastActive
      <= ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS;
  const recoveryWindowPass = bindingPass
    && expectedBoundary - firstActive >= ARC4_RECOVERY_MIN_BOUNDARY_WAIT_MS;
  const capturePoints = samples.flatMap((sample) => [
    {
      sampleIndex: sample.index, phase: 'before',
      activePlayMs: sample.target.before.runtime.activePlayMs,
      capture: sample.target.before.capture,
    },
    {
      sampleIndex: sample.index, phase: 'after',
      activePlayMs: sample.target.after.runtime.activePlayMs,
      capture: sample.target.after.capture,
    },
  ]);
  const firstRecoveredPointIndex = capturePoints.findIndex((point) =>
    recoveredCaptureFacts(point.capture, authority?.exhaustedCycle + 1));
  const firstRecoveredPoint = capturePoints[firstRecoveredPointIndex];
  const transitionPass = recoveryWindowPass
    && same(first?.target?.before?.capture, authority?.offlineCaptureFacts)
    && same(last?.target?.after?.capture, authority?.recoveredCaptureFacts)
    && exhaustedCaptureFacts(authority?.exhaustedCaptureFacts, authority.exhaustedCycle)
    && exhaustedCaptureFacts(authority?.offlineCaptureFacts, authority.exhaustedCycle)
    && same(authority?.offlineCaptureFacts, authority?.exhaustedCaptureFacts)
    && recoveredCaptureFacts(authority?.recoveredCaptureFacts, authority.exhaustedCycle + 1)
    && capturePoints.every((point) => point.activePlayMs < expectedBoundary
      ? same(point.capture, authority.exhaustedCaptureFacts)
      : same(point.capture, authority.exhaustedCaptureFacts)
        || recoveredCaptureFacts(point.capture, authority.exhaustedCycle + 1))
    && firstRecoveredPointIndex >= 0
    && firstRecoveredPoint.activePlayMs >= expectedBoundary
    && firstRecoveredPoint.activePlayMs - expectedBoundary
      <= ARC4_RECOVERY_UI_TRANSITION_LATENCY_MAX_MS
    && capturePoints.slice(firstRecoveredPointIndex).every((point) =>
      recoveredCaptureFacts(point.capture, authority.exhaustedCycle + 1));
  const expectedSessionRng = authority?.exhaustedSessionRng;
  const rngPass = bindingPass && record(expectedSessionRng)
    && same(authority?.exhaustedStateSessionRng, expectedSessionRng)
    && same(authority?.closedSessionRng, expectedSessionRng)
    && same(authority?.closedStateSessionRng, expectedSessionRng)
    && same(authority?.offlineSessionRng, expectedSessionRng)
    && same(authority?.offlineStateSessionRng, expectedSessionRng)
    && same(authority?.offlineUiSessionRng, expectedSessionRng)
    && same(authority?.recoveredSessionRng, expectedSessionRng)
    && same(authority?.recoveredStateSessionRng, expectedSessionRng)
    && same(authority?.recoveredUiSessionRng, expectedSessionRng)
    && samples.every((sample) => same(
      sessionRngOfRuntime(sample?.target?.before?.runtime), expectedSessionRng,
    ) && same(
      sessionRngOfRuntime(sample?.target?.after?.runtime), expectedSessionRng,
    ));

  const outcomes = Object.freeze([
    outcome('schema', schemaPass, 'exact certificate/observation schemas'),
    outcome('browser-provenance', browserPass, 'complete owned-browser provenance'),
    outcome('zero-retry-policy', policyPass, 'one attempt, zero retries, fixed real-time bounds'),
    outcome('service-inventory', inventoryPass, 'every service receipt binds the same visible focused answerable target'),
    outcome('turn-timing', turnTimingPass, 'every Node/browser service turn is bounded and duration-parity checked'),
    outcome('service-cadence', cadencePass, 'no unobserved service gap exceeds the fixed cadence'),
    outcome('sticky-lifecycle', observerPass, 'no focus, visibility, pagehide or freeze loss was observed'),
    outcome('real-time-duration', realtimePass, 'both Node and browser monotonic clocks span a full real 20 minutes'),
    outcome('active-clock-continuity', clockPass, 'active play advances with the browser monotonic clock without a hidden gap'),
    outcome('domain-observation-binding', bindingPass, 'closure, offline authority, samples and recovered authority form one exact chain'),
    outcome('recovery-window', recoveryWindowPass, 'the next-cycle boundary remains at least 18m20s away when observation begins'),
    outcome('capture-recovery-transition', transitionPass, 'every pre-boundary control stays exhausted and the first recovered control appears only after the exact boundary within one service window'),
    outcome('session-rng-fixed-point', rngPass, 'SessionRNG is byte-stable from exhaustion through every service turn and recovery'),
    outcome('exact-next-boundary', boundaryPass, 'consecutive near-boundary receipts bracket exactly the next cycle'),
  ]);
  const failures = outcomes.filter((entry) => !entry.pass);
  return Object.freeze({
    schema: 'cf-v2-arc4-recovery-observation-verdict/v1',
    status: failures.length ? 'fail' : 'pass', outcomes,
    failures, metrics: Object.freeze({
      sampleCount: samples.length, nodeElapsedMs, browserElapsedMs,
      activeElapsedMs, expectedBoundary,
      beforeBoundaryIndex, afterBoundaryIndex: firstAtOrAfterBoundary,
      firstRecoveredPointIndex,
  }),
});
}

const runtimeCaptureProjection = (runtime) => record(runtime) ? Object.freeze({
  activePlayMs: runtime.activePlayMs ?? null,
  revision: runtime.revision ?? null,
  sessionSeed: runtime.sessionSeed ?? null,
  sessionOrdinal: runtime.sessionOrdinal ?? null,
  sessionDraws: runtime.sessionDraws ?? null,
}) : null;

export function projectArc4RecoveryRuntimeCaptureSnapshot(value) {
  return Object.freeze({
    persistence: Object.freeze({
      documentToken: documentTokenOf(value),
      runtime: runtimeCaptureProjection(runtimeOf(value)),
    }),
  });
}

/** Validates how the recovery collector obtained its two live snapshots.
 * Runtime direction is deliberately diagnostic rather than part of `ok`:
 * malformed/swapped receipts are instrument evidence, while a backward
 * runtime under a trusted UI→state receipt remains a product verdict owned by
 * the shared Arc 4 precondition. */
export function assessArc4RecoveryRuntimeCaptureWitness({
  witness, state, ui, expectedDocumentToken,
} = {}) {
  const captures = Array.isArray(witness?.captures) ? witness.captures : [];
  const uiCapture = captures[0];
  const stateCapture = captures[1];
  const captureKeys = [
    'kind', 'ordinal', 'documentTokenBefore', 'documentTokenAfter',
    'snapshotDocumentToken', 'startedAtPerformanceMs',
    'endedAtPerformanceMs', 'runtime',
  ];
  const runtimeKeys = [
    'activePlayMs', 'revision', 'sessionSeed', 'sessionOrdinal', 'sessionDraws',
  ];
  const receiptShape = (capture) => exactKeys(capture, captureKeys)
    && exactKeys(capture.runtime, runtimeKeys);
  const uiRuntime = runtimeOf(ui);
  const stateRuntime = runtimeOf(state);
  const checks = Object.freeze({
    captured: record(witness) && record(state) && record(ui),
    envelope: exactKeys(witness, ['schema', 'documentToken', 'captures'])
      && witness.schema === ARC4_RECOVERY_RUNTIME_CAPTURE_WITNESS_SCHEMA
      && captures.length === 2,
    receiptShape: captures.length === 2 && captures.every(receiptShape),
    uiThenState: uiCapture?.kind === 'ui' && uiCapture?.ordinal === 0
      && stateCapture?.kind === 'state' && stateCapture?.ordinal === 1,
    documentToken: typeof expectedDocumentToken === 'string'
      && expectedDocumentToken.length > 0
      && witness?.documentToken === expectedDocumentToken
      && documentTokenOf(ui) === expectedDocumentToken
      && documentTokenOf(state) === expectedDocumentToken
      && captures.length === 2 && captures.every((capture) => (
        capture.documentTokenBefore === expectedDocumentToken
        && capture.documentTokenAfter === expectedDocumentToken
        && capture.snapshotDocumentToken === expectedDocumentToken
      )),
    monotonicReceipt: finite(uiCapture?.startedAtPerformanceMs)
      && finite(uiCapture?.endedAtPerformanceMs)
      && finite(stateCapture?.startedAtPerformanceMs)
      && finite(stateCapture?.endedAtPerformanceMs)
      && uiCapture.startedAtPerformanceMs <= uiCapture.endedAtPerformanceMs
      && uiCapture.endedAtPerformanceMs <= stateCapture.startedAtPerformanceMs
      && stateCapture.startedAtPerformanceMs <= stateCapture.endedAtPerformanceMs,
    exactProjection: same(
      uiCapture?.runtime, runtimeCaptureProjection(uiRuntime),
    ) && same(
      stateCapture?.runtime, runtimeCaptureProjection(stateRuntime),
    ),
  });
  return Object.freeze({
    ok: Object.values(checks).every(Boolean), checks,
    observed: Object.freeze({
      order: Object.freeze(captures.map((capture) => capture?.kind ?? null)),
      ordinals: Object.freeze(captures.map((capture) => capture?.ordinal ?? null)),
      uiActivePlayMs: uiCapture?.runtime?.activePlayMs ?? null,
      stateActivePlayMs: stateCapture?.runtime?.activePlayMs ?? null,
      runtimeNondecreasing: integer(uiCapture?.runtime?.activePlayMs)
        && integer(stateCapture?.runtime?.activePlayMs)
        && uiCapture.runtime.activePlayMs <= stateCapture.runtime.activePlayMs,
    }),
  });
}

export function assessOrdinarySliceRecoverySeal(source) {
  const expectedLedger = 'const ARC4_SLICE_LEDGER_EXPECTED_JSON = \'{"schema":"cf-v2-slice-arc4-ledger/v1","stages":["precondition","pending-no-optimism","hit","storage-refusal","stale-convergence","miss","burn-down","disabled-suppression","publication-convergence"],"burnSteps":14,"recoveryClaimed":false,"ok":true}\';';
  const expectedMarker = '20-minute next-cycle recovery is not claimed by this browser run.';
  const text = String(source ?? '');
  const count = (needle) => text.split(needle).length - 1;
  const checks = Object.freeze({
    exactLedger: count(expectedLedger) === 1,
    exactActualNonClaim: count('recoveryClaimed: false,') === 1,
    noPositiveClaim: !/\brecoveryClaimed\s*:\s*true\b/u.test(text),
    exactNonClaimMarker: count(expectedMarker) === 1,
  });
  return Object.freeze({ ok: Object.values(checks).every(Boolean), checks });
}

export function assessArc4RecoveryInstrumentSeal(collectorSource, pageSources) {
  const source = String(collectorSource ?? '');
  const productionBoundary = '\nfunction syntheticBrowser()';
  const productionBoundaryCount = source.split(productionBoundary).length - 1;
  const productionSource = productionBoundaryCount === 1
    ? source.slice(0, source.indexOf(productionBoundary)) : source;
  const joinedPageSources = Array.isArray(pageSources)
    ? pageSources.map(String).join('\n') : '';
  const pageClockDirectWriter = /(?:(?:\.\s*(?:now|performance|Date|globalThis)\b|\[\s*['"\x60](?:now|performance|Date|globalThis)['"\x60]\s*\]|\b(?:performance|Date|globalThis)\b)\s*(?:=(?!=)|&&=|\|\|=|\?\?=|\*\*=|>>>=|<<=|>>=|\+=|-=|\*=|\/=|%=|&=|\^=|\|=|\+\+|--)|(?:\+\+|--)\s*(?:\.\s*(?:now|performance|Date|globalThis)\b|\[\s*['"\x60](?:now|performance|Date|globalThis)['"\x60]\s*\]|\b(?:performance|Date|globalThis)\b))/mu;
  const pageClockDescriptorWriter = /(?:Object|Reflect)(?:\.definePropert(?:y|ies)|\[\s*['"\x60]definePropert(?:y|ies)['"\x60]\s*\])\s*\(\s*[^,\n]+,\s*(?:['"\x60](?:now|performance|Date|globalThis)['"\x60]|\{[^}\n]*\b(?:now|performance|Date|globalThis)\b\s*:)/mu;
  const pageClockReflectWriter = /\bReflect\b/mu;
  const pageClockAssignWriter = /Object(?:\.assign\b|\[\s*['"\x60]assign['"\x60]\s*\])/mu;
  const pageClockPrototypeWriter = /(?:(?:Object|Reflect)(?:\.setPrototypeOf\b|\[\s*['"\x60]setPrototypeOf['"\x60]\s*\])|(?:\.__proto__\b|\[\s*['"\x60]__proto__['"\x60]\s*\])\s*(?:=(?!=)|&&=|\|\|=|\?\?=|\*\*=|>>>=|<<=|>>=|\+=|-=|\*=|\/=|%=|&=|\^=|\|=))/mu;
  const pageClockLegacyAccessorWriter = /(?:\.__define(?:Getter|Setter)__\b|\[\s*['"\x60]__define(?:Getter|Setter)__['"\x60]\s*\])/mu;
  const pageClockDestructuringWriter = /(?:\{[^}\n]*(?:\.\s*(?:now|performance|Date|globalThis)\b|\[\s*['"\x60](?:now|performance|Date|globalThis)['"\x60]\s*\])[^}\n]*\}|\[[^\]\n]*(?:\.\s*(?:now|performance|Date|globalThis)\b|\[\s*['"\x60](?:now|performance|Date|globalThis)['"\x60]\s*\])[^\]\n]*\])\s*=(?!=)/mu;
  const pageClockIterationWriter = /\bfor\s*(?:await\s*)?\(\s*(?:(?:\.\s*)?[^;\n]*?)?(?:\.\s*(?:now|performance|Date|globalThis)\b|\[\s*['"\x60](?:now|performance|Date|globalThis)['"\x60]\s*\])[^;\n]*?\s+(?:of|in)\b/mu;
  const pageDynamicComputedWriter = /\b(?!(?:const|let|var)\b)[A-Za-z_$][\w$]*\s*\[(?!\s*\d+\s*\])\s*[^\]\n]+\]\s*(?:=(?!=)|&&=|\|\|=|\?\?=|\*\*=|>>>=|<<=|>>=|\+=|-=|\*=|\/=|%=|&=|\^=|\|=|\+\+|--)/mu;
  const pageClockBindingShadow = /(?:\b(?:const|let|var|class)\s+(?:globalThis|performance|Date)\b|\b(?:async\s+)?function\s*\*?\s*(?:globalThis|performance|Date)\b|\b(?:const|let|var)\s*(?:\{[^}\n]*\b(?:globalThis|performance|Date)\b[^}\n]*\}|\[[^\]\n]*\b(?:globalThis|performance|Date)\b[^\]\n]*\]))/mu;
  const pageClockDeleteWriter = /\bdelete\s+(?:[^;\n]*?)(?:\.\s*(?:now|performance|Date|globalThis)\b|\[\s*['"\x60](?:now|performance|Date|globalThis)['"\x60]\s*\])/mu;
  const seedDescriptorPrefix = "Object.defineProperty(globalThis.crypto,'getRandomValues'";
  const descriptorInventoryTrusted = (text) => text.length === 0 || (
    text.split('definePropert').length - 1 === 1
      && text.split(seedDescriptorPrefix).length - 1 === 1
  );
  const objectInventoryTrusted = (text) => text.length === 0 || (
    [...text.matchAll(/\bObject\b/gmu)].length === 1
      && text.split(seedDescriptorPrefix).length - 1 === 1
  );
  const forbiddenVirtualTime = 'Emulation.setVirtual' + 'TimePolicy';
  const pertarSurfaceStart = source.indexOf('async function waitForPertarSurface');
  const pertarSurfaceEnd = pertarSurfaceStart >= 0
    ? source.indexOf('\n}\n\nasync function activateSurveyDock', pertarSurfaceStart)
    : -1;
  const pertarSurfaceSource = pertarSurfaceStart >= 0 && pertarSurfaceEnd > pertarSurfaceStart
    ? source.slice(pertarSurfaceStart, pertarSurfaceEnd) : '';
  const suppressionPreparationStart = source.indexOf(
    'async function prepareDisabledSuppressionTarget(send, sessionId)',
  );
  const suppressionPreparationEnd = suppressionPreparationStart >= 0
    ? source.indexOf('\n}\n\nasync function collectSuppression', suppressionPreparationStart)
    : -1;
  const suppressionPreparationSource = suppressionPreparationStart >= 0
    && suppressionPreparationEnd > suppressionPreparationStart
    ? source.slice(suppressionPreparationStart, suppressionPreparationEnd) : '';
  const suppressionCollectorStart = source.indexOf(
    'async function collectSuppression(send, sessionId)',
  );
  const suppressionCollectorEnd = suppressionCollectorStart >= 0
    ? source.indexOf('\n}\n\nfunction initialStages', suppressionCollectorStart)
    : -1;
  const suppressionCollectorSource = suppressionCollectorStart >= 0
    && suppressionCollectorEnd > suppressionCollectorStart
    ? source.slice(suppressionCollectorStart, suppressionCollectorEnd) : '';
  const suppressionSourceSha256 = createHash('sha256').update(
    `${suppressionPreparationSource}\0${suppressionCollectorSource}`,
  ).digest('hex');
  const countInProduction = (needle) => productionSource.split(needle).length - 1;
  const countInSuppressionPreparation = (needle) => (
    suppressionPreparationSource.split(needle).length - 1
  );
  const countInSuppressionCollector = (needle) => (
    suppressionCollectorSource.split(needle).length - 1
  );
  const suppressionNativeRevealNeedle =
    "button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});";
  const suppressionFirstSettledSampleNeedle =
    'await settle();\n      const first=sample();';
  const suppressionSecondSettledSampleNeedle =
    'await settle();\n      const second=sample();';
  const suppressionNativeRevealIndex = suppressionPreparationSource.indexOf(
    suppressionNativeRevealNeedle,
  );
  const suppressionFirstSettledSampleIndex = suppressionPreparationSource.indexOf(
    suppressionFirstSettledSampleNeedle,
  );
  const suppressionSecondSettledSampleIndex = suppressionPreparationSource.indexOf(
    suppressionSecondSettledSampleNeedle,
  );
  const suppressionScrollRestorationNeedle =
    'if(attempted&&survey&&before){survey.scrollLeft=before.left;survey.scrollTop=before.top}';
  const suppressionCleanupSettlementNeedle =
    'await new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(\n          ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));';
  const suppressionScrollRestorationIndex = suppressionCollectorSource.indexOf(
    suppressionScrollRestorationNeedle,
  );
  const suppressionCleanupSettlementIndex = suppressionCollectorSource.indexOf(
    suppressionCleanupSettlementNeedle,
  );
  const suppressionAbortNeedle = 'controller?.abort();';
  const suppressionGlobalDeleteNeedle =
    'delete window.__cfArc4RecoverySuppressionAbort;\n        delete window.__cfArc4RecoverySuppressionTrace;\n        delete window.__cfArc4RecoverySuppressionPreparation;';
  const suppressionAbortIndex = suppressionCollectorSource.indexOf(
    suppressionAbortNeedle,
  );
  const suppressionGlobalDeleteIndex = suppressionCollectorSource.indexOf(
    suppressionGlobalDeleteNeedle,
  );
  const suppressionTargetInstrumentNeedle =
    "instrumentAssert(finalTargetAssessment.instrumentOk,\n    'disabled Tame target instrument evidence is red',";
  const suppressionCleanupInstrumentNeedle =
    "instrumentAssert(cleanupIntegrity,\n    'disabled suppression cleanup integrity is red',";
  const suppressionCollectionInstrumentNeedle =
    'instrumentAssert(collectionError === null,';
  const suppressionAssessmentInstrumentNeedle =
    "instrumentAssert(assessment.instrumentOk, 'disabled suppression instrument evidence is red',";
  const suppressionTargetProductNeedle =
    "productAssert(finalTargetAssessment.productOk,\n    'disabled Tame target product evidence is red',";
  const suppressionAuthorityProductNeedle =
    "productAssert(same(beforeRaw, exhaustedRaw),\n    'durable authority moved before disabled suppression',";
  const suppressionOutcomeProductNeedle =
    "productAssert(assessment.productOk, 'disabled suppression product evidence is red',";
  const suppressionTargetInstrumentIndex = suppressionCollectorSource.indexOf(
    suppressionTargetInstrumentNeedle,
  );
  const suppressionCleanupInstrumentIndex = suppressionCollectorSource.indexOf(
    suppressionCleanupInstrumentNeedle,
  );
  const suppressionCollectionInstrumentIndex = suppressionCollectorSource.indexOf(
    suppressionCollectionInstrumentNeedle,
  );
  const suppressionAssessmentInstrumentIndex = suppressionCollectorSource.indexOf(
    suppressionAssessmentInstrumentNeedle,
  );
  const suppressionTargetProductIndex = suppressionCollectorSource.indexOf(
    suppressionTargetProductNeedle,
  );
  const suppressionAuthorityProductIndex = suppressionCollectorSource.indexOf(
    suppressionAuthorityProductNeedle,
  );
  const suppressionOutcomeProductIndex = suppressionCollectorSource.indexOf(
    suppressionOutcomeProductNeedle,
  );
  const suppressionInstrumentVerdictIndexes = [
    suppressionCollectionInstrumentIndex,
    suppressionTargetInstrumentIndex,
    suppressionCleanupInstrumentIndex,
    suppressionAssessmentInstrumentIndex,
  ];
  const suppressionAllInstrumentVerdictIndexes = [
    ...suppressionCollectorSource.matchAll(/\binstrumentAssert\(/gu),
  ].map((match) => match.index);
  const suppressionProductVerdictIndexes = [
    suppressionTargetProductIndex,
    suppressionAuthorityProductIndex,
    suppressionOutcomeProductIndex,
  ];
  const suppressionAllProductVerdictIndexes = [
    ...suppressionCollectorSource.matchAll(/\bproductAssert\(/gu),
  ].map((match) => match.index);
  const suppressionCleanupFinallyIndex = suppressionCollectorSource.indexOf('} finally {');
  const suppressionPostCleanupReadIndex = suppressionCollectorSource.indexOf(
    'if (dispatch.inputDispatched && collectionError === null) {',
  );
  const suppressionOutcomeAssemblyIndex = suppressionCollectorSource.indexOf(
    'const suppressed = Object.freeze({',
  );
  const suppressionPreparationCallIndex = suppressionCollectorSource.indexOf(
    'target = await prepareDisabledSuppressionTarget(',
  );
  const suppressionHeartbeatQuiesceIndex = suppressionCollectorSource.indexOf(
    "'window.__CF_SLICE__.api.__smokeQuiesceF4Heartbeat()'",
  );
  const suppressionHeartbeatResumeIndex = suppressionCollectorSource.indexOf(
    "'window.__CF_SLICE__.api.__smokeResumeF4Heartbeat()'",
  );
  const suppressionSynchronizedRawIndex = suppressionCollectorSource.indexOf(
    "'read synchronized exhausted authority'",
  );
  const suppressionSynchronizedStateIndex = suppressionCollectorSource.indexOf(
    "'read synchronized exhausted state'",
  );
  const suppressionSynchronizedUiIndex = suppressionCollectorSource.indexOf(
    "'read synchronized exhausted UI'",
  );
  const directlyDeadBranched = (text, index) => index >= 0 && /(?:\bif\s*\(\s*(?:false|0|Boolean\s*\(\s*(?:false|0)\s*\))\s*\)|\bfalse\s*&&)\s*\{?\s*$/u.test(
    text.slice(Math.max(0, index - 96), index),
  );
  const suppressionRootEarlyReturn = /^ {2}if\s*\(\s*(?:true|1|Boolean\s*\(\s*(?:true|1)\s*\))\s*\)\s*(?:\{\s*)?return\b/mu.test(
    suppressionCollectorSource,
  );
  const suppressionRootReturns = [
    ...suppressionCollectorSource.matchAll(/^ {2}return\s+([^;]+);/gmu),
  ].map((match) => match[1]);
  const uiCaptureIndex = pertarSurfaceSource.indexOf(
    "uiCapture=capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION})",
  );
  const stateCaptureIndex = pertarSurfaceSource.indexOf(
    "stateCapture=capture('state',()=>S?.api?.state?.()??null)",
  );
  const countInPertarSurface = (needle) => pertarSurfaceSource.split(needle).length - 1;
  const checks = Object.freeze({
    fixedDuration: source.includes(
      'const ACTIVE_OBSERVATION_MS = ARC4_RECOVERY_ACTIVE_OBSERVATION_MS;',
    ),
    noDurationOverride: !source.includes('--duration')
      && !source.includes('RECOVERY_DURATION_MS'),
    noVirtualTime: !source.includes(forbiddenVirtualTime),
    noPageClockOverride: descriptorInventoryTrusted(joinedPageSources)
      && objectInventoryTrusted(joinedPageSources)
      && !pageClockDirectWriter.test(joinedPageSources)
      && !pageClockDescriptorWriter.test(joinedPageSources)
      && !pageClockReflectWriter.test(joinedPageSources)
      && !pageClockAssignWriter.test(joinedPageSources)
      && !pageClockPrototypeWriter.test(joinedPageSources)
      && !pageClockLegacyAccessorWriter.test(joinedPageSources)
      && !pageClockDestructuringWriter.test(joinedPageSources)
      && !pageClockIterationWriter.test(joinedPageSources)
      && !pageDynamicComputedWriter.test(joinedPageSources)
      && !pageClockBindingShadow.test(joinedPageSources)
      && !pageClockDeleteWriter.test(joinedPageSources),
    noActivePlayWriter: !/(?:^|[^=!<>])\.activePlayMs\s*(?:=(?!=)|\*\*=|>>>=|<<=|>>=|&&=|\|\|=|\?\?=|\+=|-=|\*=|\/=|%=|&=|\^=|\|=|\+\+|--)/mu.test(
      joinedPageSources,
    ),
    exactProductionBoundary: productionBoundaryCount === 1,
    noProductionActivePlayWriter: !/(?:\.activePlayMs|\[\s*['"]activePlayMs['"]\s*\])\s*(?:=(?!=)|\*\*=|>>>=|<<=|>>=|&&=|\|\|=|\?\?=|\+=|-=|\*=|\/=|%=|&=|\^=|\|=|\+\+|--)/mu.test(
      productionSource,
    ),
    noProductionClockOverride: descriptorInventoryTrusted(productionSource)
      && !pageClockDirectWriter.test(productionSource)
      && !pageClockDescriptorWriter.test(productionSource)
      && !pageClockReflectWriter.test(productionSource)
      && !pageClockAssignWriter.test(productionSource)
      && !pageClockPrototypeWriter.test(productionSource)
      && !pageClockLegacyAccessorWriter.test(productionSource)
      && !pageClockDestructuringWriter.test(productionSource)
      && !pageClockIterationWriter.test(productionSource)
      && !pageClockBindingShadow.test(productionSource)
      && !pageClockDeleteWriter.test(productionSource),
    targetDestroyedDerived: source.includes(
      "message.method === 'Target.targetDestroyed'",
    ) && source.includes('targetDestroyedEvents.push({'),
    postCloseInventoryDerived: source.includes("send('Target.getTargets')")
      && source.includes('postCloseTargetInventory:'),
    pertarReadyUiThenState: uiCaptureIndex >= 0
      && stateCaptureIndex > uiCaptureIndex,
    pertarCaptureWitnessDerived: pertarSurfaceSource.includes(
      'const ordinal=captures.length',
    ) && pertarSurfaceSource.includes(
      'runtimeCaptureWitness={schema:${JSON.stringify(ARC4_RECOVERY_RUNTIME_CAPTURE_WITNESS_SCHEMA)}',
    ),
    pertarCaptureTimestampDerived: pertarSurfaceSource.includes(
      'startedAtPerformanceMs=globalThis.performance.now(),value=read(),',
    ) && pertarSurfaceSource.includes(
      'endedAtPerformanceMs=globalThis.performance.now(),',
    ),
    pertarSamplerBoundary: pertarSurfaceSource.includes(
      '`(()=>{const S=window.__CF_SLICE__',
    ) && pertarSurfaceSource.includes(
      'runtimeCaptureWitness,diagnostic}})()`',
    ),
    noPertarClockShadow: countInPertarSurface('globalThis') === 2
      && countInPertarSurface('performance') === 2
      && !/\b(?:const|let|var)\s+(?:globalThis|performance)\b/u.test(
        pertarSurfaceSource,
      ) && !/\b(?:globalThis|performance)\s*(?:=(?!=)|&&=|\|\|=|\?\?=|\*\*=|>>>=|<<=|>>=|\+=|-=|\*=|\/=|%=|&=|\^=|\|=)/u.test(
      pertarSurfaceSource,
    ),
    pertarCaptureTokenDerived: pertarSurfaceSource.includes(
      'documentTokenBefore=S?.documentToken??null,',
    ) && pertarSurfaceSource.includes(
      'documentTokenAfter=S?.documentToken??null,p=value?.persistence??null,',
    ) && pertarSurfaceSource.includes(
      'snapshotDocumentToken:p?.documentToken??null,startedAtPerformanceMs,',
    ),
    pertarCaptureValueBound: countInPertarSurface(
      "capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION})",
    ) === 1 && countInPertarSurface(
      "capture('state',()=>S?.api?.state?.()??null)",
    ) === 1 && pertarSurfaceSource.includes(
      'ui=uiCapture.value,state=stateCapture.value,',
    ) && pertarSurfaceSource.includes(
      'documentToken:S?.documentToken??null,captures};',
    ),
    pertarCaptureWitnessEnforced: productionSource.includes(
      'const runtimeCaptureReceipt = assessArc4RecoveryRuntimeCaptureWitness({\n      witness: surface.runtimeCaptureWitness,\n      state: surface.state,\n      ui: surface.ui,\n      expectedDocumentToken: fixtureToken,\n    });',
    ) && productionSource.includes(
      "instrumentAssert(runtimeCaptureReceipt.ok,\n      'Pertar recovery runtime capture receipt is red', runtimeCaptureEvidence);",
    ),
    pertarCaptureEvidenceBound: productionSource.includes(
      'const runtimeCaptureEvidence = Object.freeze({\n      witness: surface.runtimeCaptureWitness,\n      snapshots: Object.freeze({\n        ui: projectArc4RecoveryRuntimeCaptureSnapshot(surface.ui),\n        state: projectArc4RecoveryRuntimeCaptureSnapshot(surface.state),\n      }),\n      receipt: runtimeCaptureReceipt,\n    });',
    ),
    pertarPreconditionInputBound: productionSource.includes(
      'const preconditionInput = Object.freeze({\n      raw: preRaw, state: surface.state, ui: surface.ui,\n      routeError: null, authorityReady: true,\n    });\n    const precondition = assessArc4CapturePrecondition(preconditionInput);',
    ),
    pertarPreconditionProductClassified: productionSource.includes(
      "productAssert(precondition.ok, 'Pertar recovery precondition is red', {\n      runtimeCapture: runtimeCaptureEvidence, preconditionInput, precondition,\n    });",
    ),
    pertarFixtureEvidenceBound: productionSource.includes(
      "passStage('fixture', {\n      documentToken: fixtureToken, seedWitness, preconditionInput, precondition,\n      runtimeCapture: runtimeCaptureEvidence,",
    ),
    typedFailureAssertions: productionSource.includes(
      'if (!condition) throw new InstrumentFailure(message, evidence);',
    ) && productionSource.includes(
      'if (!condition) throw new ProductFailure(message, evidence);',
    ),
    failureClassificationPath: productionSource.includes(
      'const classification = classifyRecoveryFailure(error);',
    ) && productionSource.includes(
      'provisionalStatus = classification.status;',
    ) && productionSource.includes(
      'provisionalExitCode = classification.exitCode;',
    ),
    fixturePreconditionVerifierBound: productionSource.includes(
      "const fixtureEvidence = terminal.stages.find(\n        (stage) => stage?.id === 'fixture',\n      )?.evidence;\n      const replayedFixturePrecondition = assessArc4CapturePrecondition(\n        fixtureEvidence?.preconditionInput,\n      );",
    ) && source.includes(
      "const fixtureEvidence = report.stages.find(\n    (stage) => stage?.id === 'fixture',\n  )?.evidence;\n  const replayedFixturePrecondition = assessArc4CapturePrecondition(\n    fixtureEvidence?.preconditionInput,\n  );",
    ),
    suppressionDedicatedPreparation: suppressionPreparationSource.length > 0
      && suppressionCollectorSource.length > 0
      && countInProduction(
        'async function prepareDisabledSuppressionTarget(send, sessionId)',
      ) === 1
      && countInProduction(
        'async function collectSuppression(send, sessionId)',
      ) === 1
      && countInSuppressionCollector(
        'target = await prepareDisabledSuppressionTarget(send, sessionId);',
      ) === 1
      && countInProduction('prepareDisabledSuppressionTarget(send, sessionId)') === 2,
    suppressionSourceDigest: suppressionPreparationSource.length > 0
      && suppressionCollectorSource.length > 0
      && suppressionSourceSha256 === ARC4_RECOVERY_SUPPRESSION_SOURCE_SHA256,
    suppressionNoEarlyReturn: !suppressionRootEarlyReturn
      && suppressionRootReturns.length === 1
      && suppressionRootReturns[0].startsWith('Object.freeze({'),
    suppressionExactOwner: countInSuppressionPreparation(
      "selector='#survey button[data-capture-action=\"tame\"]'",
    ) === 1 && countInSuppressionPreparation(
      "survey=document.querySelector('#survey')",
    ) === 1 && countInSuppressionPreparation(
      'card=survey,',
    ) === 1 && countInSuppressionPreparation(
      'matches=[...document.querySelectorAll(selector)]',
    ) === 1 && countInSuppressionPreparation(
      'button=matches.length===1?matches[0]:null',
    ) === 1,
    suppressionNativeScroll: countInSuppressionPreparation(
      suppressionNativeRevealNeedle,
    ) === 1,
    suppressionSettledSamples: countInSuppressionPreparation(
      'const settle=()=>new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(',
    ) === 1 && countInSuppressionPreparation(
      '()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));',
    ) === 1 && countInSuppressionPreparation(
      suppressionFirstSettledSampleNeedle,
    ) === 1 && countInSuppressionPreparation(
      suppressionSecondSettledSampleNeedle,
    ) === 1 && suppressionCollectorSource.includes(
      'targetAssessment = assessArc4DisabledTargetEvidence(target);',
    ) && suppressionCollectorSource.includes(
      "const armedSample = await evaluate(send, sessionId,\n        'window.__cfArc4RecoverySuppressionPreparation?.sample?.()??null',\n        'revalidate armed disabled suppression target');\n      target = Object.freeze({ ...target, second: armedSample });\n      targetAssessment = assessArc4DisabledTargetEvidence(target);",
    ) && suppressionCollectorSource.includes(
      'const finalTargetAssessment = targetAssessment ?? assessArc4DisabledTargetEvidence(target);',
    ),
    suppressionPreparationOrder: suppressionNativeRevealIndex >= 0
      && suppressionFirstSettledSampleIndex > suppressionNativeRevealIndex
      && suppressionSecondSettledSampleIndex > suppressionFirstSettledSampleIndex
      && !directlyDeadBranched(
        suppressionPreparationSource, suppressionNativeRevealIndex,
      )
      && !directlyDeadBranched(
        suppressionPreparationSource, suppressionFirstSettledSampleIndex,
      )
      && !directlyDeadBranched(
        suppressionPreparationSource, suppressionSecondSettledSampleIndex,
      ),
    suppressionEvidenceInventory: suppressionPreparationSource.includes(
      'documentTokenBefore=window.__CF_SLICE__?.documentToken??null,',
    ) && suppressionPreparationSource.includes(
      'return {documentToken:S?.documentToken??null,sameButton:currentButton===button,',
    ) && suppressionPreparationSource.includes(
      "button:{tag:button?.tagName??null,\n              verb:button?.getAttribute('data-capture-action')??null,",
    ) && suppressionPreparationSource.includes(
      'rect:r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,',
    ) && suppressionPreparationSource.includes(
      'cardRect:cr?{left:cr.left,top:cr.top,right:cr.right,bottom:cr.bottom,',
    ) && suppressionPreparationSource.includes(
      'viewport:{width:innerWidth,height:innerHeight},scroll:survey?{left:survey.scrollLeft,',
    ) && suppressionPreparationSource.includes(
      'point:{x:Number.isFinite(x)?x:null,y:Number.isFinite(y)?y:null,',
    ) && suppressionPreparationSource.includes(
      'hitTag:hit?.tagName??null,hitVerb:hit instanceof Element',
    ) && suppressionPreparationSource.includes(
      'owned:!!hit&&!!button&&(hit===button||button.contains(hit))',
    ) && suppressionPreparationSource.includes(
      'requestedVerb,priorScroll,initial,first,second}})()`',
    ),
    suppressionDispatchBinding: suppressionCollectorSource.includes(
      'requested: false, inputDispatched: false, documentToken: null, x: null, y: null,',
    ) && suppressionCollectorSource.includes(
      'if (targetAssessment.instrumentOk && targetAssessment.productOk\n      && same(beforeRaw, exhaustedRaw)) {',
    ) && suppressionCollectorSource.includes(
      'if (targetAssessment.instrumentOk && targetAssessment.productOk) {\n        dispatch.requested = true;\n        dispatch.documentToken = target.documentTokenAfter;\n        dispatch.x = target.second.point.x;\n        dispatch.y = target.second.point.y;',
    ) && suppressionCollectorSource.includes(
      "type: 'mousePressed', x: dispatch.x, y: dispatch.y, button: 'left', clickCount: 1,",
    ) && suppressionCollectorSource.includes(
      "type: 'mouseReleased', x: dispatch.x, y: dispatch.y, button: 'left', clickCount: 1,",
    ) && countInSuppressionCollector(
      "}, sessionId);",
    ) === 3 && suppressionCollectorSource.includes(
      "type: 'mouseMoved', x: dispatch.x, y: dispatch.y,\n        }, sessionId);",
    ) && suppressionCollectorSource.includes(
      'dispatch.inputDispatched = true;',
    ) && suppressionCollectorSource.includes(
      'target, trace, dispatch: Object.freeze({ ...dispatch }),',
    ),
    suppressionTraceInventory: suppressionPreparationSource.includes(
      'controller=new AbortController(),',
    ) && suppressionPreparationSource.includes(
      'window.__cfArc4RecoverySuppressionAbort=controller;',
    ) && suppressionCollectorSource.includes(
      'button=record?.button,controller=window.__cfArc4RecoverySuppressionAbort??null,\n      trace={pointer:[],clicks:[]},',
    ) && suppressionCollectorSource.includes(
      "if(!(controller instanceof AbortController)||controller.signal.aborted)throw new Error(\n        'disabled suppression AbortController ownership is red');",
    ) && suppressionCollectorSource.includes(
      "if(eventButton!==button)return null;return {verb:eventButton.getAttribute('data-capture-action'),",
    ) && suppressionCollectorSource.includes(
      'clientX:Number.isFinite(event.clientX)?event.clientX:null,',
    ) && suppressionCollectorSource.includes(
      'clientY:Number.isFinite(event.clientY)?event.clientY:null,',
    ) && suppressionCollectorSource.includes(
      'documentToken:window.__CF_SLICE__?.documentToken??null',
    ) && suppressionCollectorSource.includes(
      "document.addEventListener('pointerdown',(event)=>{const value=row(event);if(value)trace.pointer.push(value)},",
    ) && suppressionCollectorSource.includes(
      "document.addEventListener('click',(event)=>{const value=row(event);if(value)trace.clicks.push(value)},",
    ) && countInSuppressionCollector(
      '{capture:true,signal:controller.signal}',
    ) === 2 && suppressionCollectorSource.includes(
      'trace = cleanup?.trace ?? null;',
    ),
    suppressionFinallyCleanup: countInSuppressionCollector('} finally {') === 1
      && suppressionCollectorSource.includes(
        'captured=window.__cfArc4RecoverySuppressionTrace??null,',
      ) && suppressionCollectorSource.includes(
        'restoration = cleanup?.restoration ?? restoration;',
      ) && suppressionPostCleanupReadIndex > suppressionCleanupFinallyIndex
      && suppressionCollectorSource.includes(
        "if (dispatch.inputDispatched && collectionError === null) {\n    try {\n      afterRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,\n        'read suppression after cleanup authority');\n      afterState = await evaluate(send, sessionId, 'window.__CF_SLICE__.api.state()',\n        'read suppression after cleanup state');",
      ),
    suppressionHeartbeatQuiescence: countInSuppressionCollector(
      '__smokeQuiesceF4Heartbeat()',
    ) === 1 && countInSuppressionCollector(
      '__smokeResumeF4Heartbeat()',
    ) === 1 && suppressionCollectorSource.includes(
      'let heartbeat = Object.freeze({ quiesced: null, resumed: null });',
    ) && suppressionHeartbeatQuiesceIndex >= 0
      && suppressionPreparationCallIndex > suppressionHeartbeatQuiesceIndex
      && suppressionSynchronizedRawIndex > suppressionHeartbeatQuiesceIndex
      && suppressionSynchronizedStateIndex > suppressionSynchronizedRawIndex
      && suppressionSynchronizedUiIndex > suppressionSynchronizedStateIndex
      && suppressionPreparationCallIndex > suppressionSynchronizedUiIndex
      && suppressionHeartbeatResumeIndex > suppressionCleanupFinallyIndex
      && suppressionOutcomeAssemblyIndex > suppressionHeartbeatResumeIndex
      && suppressionCollectorSource.includes(
        'heartbeat = Object.freeze({ quiesced, resumed: null });',
      ) && suppressionCollectorSource.includes(
        'heartbeat = Object.freeze({ ...heartbeat, resumed });',
      ) && suppressionCollectorSource.includes(
        'target, trace, dispatch: Object.freeze({ ...dispatch }), heartbeat,',
      ) && suppressionCollectorSource.includes(
        'return Object.freeze({ suppressed, exhaustedRaw, exhaustedState, exhaustedUi });',
      ),
    suppressionCleanupReceipt: suppressionCollectorSource.includes(
      'controller=window.__cfArc4RecoverySuppressionAbort??null,',
    ) && suppressionCollectorSource.includes(
      'attempted=record!==null;',
    ) && countInSuppressionCollector(
      suppressionAbortNeedle,
    ) === 1 && suppressionAbortIndex >= 0 && !directlyDeadBranched(
      suppressionCollectorSource, suppressionAbortIndex,
    ) && suppressionCollectorSource.includes(
      'scrollComplete=before===null?survey===null&&after===null:',
    ) && suppressionCollectorSource.includes(
      'survey?.isConnected===true&&after?.left===before.left&&after?.top===before.top,',
    ) && suppressionCollectorSource.includes(
      'complete=attempted&&scrollComplete;',
    ) && countInSuppressionCollector(
      suppressionGlobalDeleteNeedle,
    ) === 1 && suppressionGlobalDeleteIndex >= 0 && !directlyDeadBranched(
      suppressionCollectorSource, suppressionGlobalDeleteIndex,
    ) && suppressionCollectorSource.includes(
      'const abortSignalAborted=controller?.signal?.aborted===true,',
    ) && suppressionCollectorSource.includes(
      "abort:!('__cfArc4RecoverySuppressionAbort' in window),\n            trace:!('__cfArc4RecoverySuppressionTrace' in window),\n            preparation:!('__cfArc4RecoverySuppressionPreparation' in window)",
    ) && suppressionCollectorSource.includes(
      'return {trace:captured,restoration:{attempted,complete,documentToken,before,after,\n          abortSignalAborted,globalsAbsent}}',
    ) && suppressionCollectorSource.includes(
      'abortSignalAborted: false,\n    globalsAbsent: Object.freeze({ abort: false, trace: false, preparation: false }),',
    ),
    suppressionCleanupOrder: suppressionScrollRestorationIndex >= 0
      && suppressionCleanupSettlementIndex > suppressionScrollRestorationIndex
      && countInSuppressionCollector(suppressionCleanupSettlementNeedle) === 1
      && !directlyDeadBranched(
        suppressionCollectorSource, suppressionScrollRestorationIndex,
      )
      && !directlyDeadBranched(
        suppressionCollectorSource, suppressionCleanupSettlementIndex,
      ),
    suppressionAssessmentEnforced: suppressionCollectorSource.includes(
      'const assessment = assessArc4DisabledSuppressionEvidence(\n    suppressed, { exhaustedRaw, exhaustedState },\n  );',
    ) && suppressionCollectorSource.includes(
      'const cleanupChecks = Object.freeze({\n    restorationShape: assessment.instrumentChecks.restorationShape === true,\n    restorationComplete: assessment.instrumentChecks.restorationComplete === true,\n  });',
    ) && suppressionCollectorSource.includes(
      'assertDisabledSuppressionVerdicts({\n    collectionError, suppressed, finalTargetAssessment, assessment,\n    cleanupIntegrity, cleanupChecks, exhaustedRaw, beforeRaw,\n  });',
    ) && suppressionCollectorSource.includes(
      'instrumentAssert(collectionError === null,\n    collectionError?.message || \'disabled suppression collection is red\',',
    ) && suppressionCollectorSource.includes(
      'instrumentAssert(finalTargetAssessment.instrumentOk,\n    \'disabled Tame target instrument evidence is red\',',
    ) && suppressionCollectorSource.includes(
      'instrumentAssert(cleanupIntegrity,\n    \'disabled suppression cleanup integrity is red\',',
    ) && suppressionCollectorSource.includes(
      'productAssert(finalTargetAssessment.productOk,\n    \'disabled Tame target product evidence is red\',',
    ) && suppressionCollectorSource.includes(
      "productAssert(same(beforeRaw, exhaustedRaw),\n    'durable authority moved before disabled suppression',",
    ) && suppressionCollectorSource.includes(
      "instrumentAssert(assessment.instrumentOk, 'disabled suppression instrument evidence is red',",
    ) && suppressionCollectorSource.includes(
      "productAssert(assessment.productOk, 'disabled suppression product evidence is red',",
    ),
    suppressionTargetVerdictOrder: suppressionTargetInstrumentIndex >= 0
      && suppressionProductVerdictIndexes.every((index) => index >= 0)
      && suppressionAllProductVerdictIndexes.length === 3
      && suppressionAllProductVerdictIndexes.every(
        (index) => suppressionProductVerdictIndexes.includes(index),
      )
      && suppressionAllProductVerdictIndexes.every(
        (index) => index > suppressionTargetInstrumentIndex,
      )
      && !directlyDeadBranched(
        suppressionCollectorSource, suppressionTargetInstrumentIndex,
      ),
    suppressionCleanupVerdictOrder: suppressionCleanupInstrumentIndex >= 0
      && suppressionProductVerdictIndexes.every((index) => index >= 0)
      && suppressionAllProductVerdictIndexes.length === 3
      && suppressionAllProductVerdictIndexes.every(
        (index) => suppressionProductVerdictIndexes.includes(index),
      )
      && suppressionAllProductVerdictIndexes.every(
        (index) => index > suppressionCleanupInstrumentIndex,
      )
      && !directlyDeadBranched(
        suppressionCollectorSource, suppressionCleanupInstrumentIndex,
      ),
    suppressionInstrumentVerdictOrder: suppressionInstrumentVerdictIndexes.every(
      (index) => index >= 0,
    ) && suppressionAllInstrumentVerdictIndexes.length === 4
      && suppressionAllInstrumentVerdictIndexes.every(
        (index) => suppressionInstrumentVerdictIndexes.includes(index),
      ) && suppressionCollectionInstrumentIndex < suppressionTargetProductIndex
      && suppressionTargetInstrumentIndex < suppressionTargetProductIndex
      && suppressionCleanupInstrumentIndex < suppressionTargetProductIndex
      && suppressionTargetProductIndex < suppressionAssessmentInstrumentIndex
      && suppressionAssessmentInstrumentIndex < suppressionAuthorityProductIndex
      && suppressionAssessmentInstrumentIndex < suppressionOutcomeProductIndex,
    suppressionNoCollapsedOracle: !suppressionPreparationSource.includes('target?.ok')
      && !suppressionCollectorSource.includes('target?.ok')
      && !suppressionPreparationSource.includes('locate disabled Tame control')
      && !suppressionCollectorSource.includes('locate disabled Tame control')
      && !suppressionCollectorSource.includes('trace?.pointer?.[0]')
      && !suppressionCollectorSource.includes('clickCount: trace?.clicks?.length'),
  });
  return Object.freeze({ ok: Object.values(checks).every(Boolean), checks });
}

export function terminalArc4RecoveryReportErrors(report, {
  expectedRunId, currentSource, replayedDomainAssessment,
  replayedObservationVerdict, replayedAuthorityBinding,
  replayedFixturePrecondition,
  currentBuild, currentInputs, ordinarySliceSeal, instrumentSeal,
  expectedPredecessors, expectedArtifactPath,
} = {}) {
  const errors = [];
  if (report?.schema !== ARC4_RECOVERY_REPORT_SCHEMA) errors.push('report schema');
  if (report?.status !== 'pass') errors.push('report status is not pass');
  if (report?.terminal !== true) errors.push('report terminal boundary');
  if (report?.runId !== expectedRunId) errors.push('report run ID');
  if (report?.artifact?.path !== expectedArtifactPath) errors.push('immutable report artifact binding');
  const startedMs = Date.parse(report?.startedAt);
  const endedMs = Date.parse(report?.endedAt);
  if (!Number.isFinite(startedMs) || !Number.isFinite(endedMs)
    || endedMs < startedMs || report?.durationMs !== endedMs - startedMs) {
    errors.push('terminal timestamp/duration binding');
  }
  if (report?.lifecycle?.schema !== ARC4_RECOVERY_LIFECYCLE_SCHEMA
    || report?.lifecycle?.status !== 'complete') errors.push('report lifecycle');
  if (!same(report?.cleanup, {
    browser: true, server: true, browserContext: true, workspaceLock: true,
  })) errors.push('terminal cleanup');
  if (report?.policy?.attemptCount !== 1
    || report?.policy?.automaticRetries !== 0) errors.push('zero-retry policy');
  if (!same(report?.policy, report?.observationInput?.policy)) {
    errors.push('report-observation policy binding');
  }
  if (!same(report?.browser, report?.observationInput?.browser)) {
    errors.push('report-observation browser binding');
  }
  if (report?.source?.begin?.state !== 'committed'
    || report?.source?.end?.state !== 'committed'
    || !same(report?.source?.begin, report?.source?.end)
    || !same(report?.source?.end, currentSource)) errors.push('source authority');
  if (!record(report?.predecessors)
    || !record(report.predecessors.slice) || !record(report.predecessors.glass)
    || !same(report.predecessors, expectedPredecessors)) {
    errors.push('exact Slice/Glass predecessor chain');
  }
  if (report?.predecessorSelection?.sliceRunId !== report?.predecessors?.slice?.runId
    || report?.predecessorSelection?.glassRunId !== report?.predecessors?.glass?.runId) {
    errors.push('requested-to-resolved predecessor binding');
  }
  if (!same(report?.predecessors?.glass?.slicePredecessor,
    report?.predecessors?.slice)) errors.push('Glass-to-Slice nested predecessor binding');
  if (!same(report?.build, currentBuild)) errors.push('build byte authority');
  if (!same(report?.inputs, currentInputs)) errors.push('input byte authority');
  if (!same(report?.domainAssessment, replayedDomainAssessment)
    || replayedDomainAssessment?.ok !== true) errors.push('domain assessment replay');
  if (!same(report?.observationVerdict, replayedObservationVerdict)
    || replayedObservationVerdict?.status !== 'pass') errors.push('observation verdict replay');
  const projectedAuthorityBinding = projectArc4RecoveryObservationAuthority(
    report?.recoveryBundle,
  );
  if (!same(replayedAuthorityBinding, projectedAuthorityBinding)
    || !same(report?.observationInput?.authorityBinding, replayedAuthorityBinding)) {
    errors.push('domain-observation authority binding replay');
  }
  if (!same(report?.ordinarySliceSeal, ordinarySliceSeal)
    || ordinarySliceSeal?.ok !== true) errors.push('ordinary Slice non-recovery seal');
  if (!same(report?.instrumentSeal, instrumentSeal)
    || instrumentSeal?.ok !== true) errors.push('instrument no-forged-time seal');
  const stages = Array.isArray(report?.stages) ? report.stages : [];
  if (!same(stages.map((stage) => stage?.id), ARC4_RECOVERY_STAGE_ORDER)
    || stages.some((stage) => stage?.status !== 'pass')) errors.push('stage ledger');
  const fixtureEvidence = stages.find((stage) => stage?.id === 'fixture')?.evidence;
  const runtimeCapture = fixtureEvidence?.runtimeCapture;
  if (fixtureEvidence?.documentToken !== documentTokenOf(
    report?.recoveryBundle?.exhaustedState,
  ) || fixtureEvidence?.documentToken !== documentTokenOf(
    report?.recoveryBundle?.closedState,
  ) || fixtureEvidence?.documentToken
    !== report?.recoveryBundle?.closure?.closedDocumentToken) {
    errors.push('fixture-to-recovery document chain');
  }
  const replayedRuntimeCaptureReceipt = assessArc4RecoveryRuntimeCaptureWitness({
    witness: runtimeCapture?.witness,
    state: runtimeCapture?.snapshots?.state,
    ui: runtimeCapture?.snapshots?.ui,
    expectedDocumentToken: fixtureEvidence?.documentToken,
  });
  if (!exactKeys(runtimeCapture, ['witness', 'snapshots', 'receipt'])
    || !exactKeys(runtimeCapture?.snapshots, ['ui', 'state'])
    || replayedRuntimeCaptureReceipt.ok !== true
    || !same(runtimeCapture?.receipt, replayedRuntimeCaptureReceipt)
    || replayedRuntimeCaptureReceipt?.observed?.runtimeNondecreasing !== true
    || replayedRuntimeCaptureReceipt?.observed?.runtimeNondecreasing
      !== fixtureEvidence?.precondition?.checks?.runtimeCaptureOrder
    || !same(runtimeCapture?.snapshots?.ui,
      projectArc4RecoveryRuntimeCaptureSnapshot(
        fixtureEvidence?.preconditionInput?.ui,
      ))
    || !same(runtimeCapture?.snapshots?.state,
      projectArc4RecoveryRuntimeCaptureSnapshot(
        fixtureEvidence?.preconditionInput?.state,
      ))
    || fixtureEvidence?.precondition?.ok !== true
    || !record(fixtureEvidence?.precondition?.checks)
    || Object.values(fixtureEvidence.precondition.checks).some((value) => value !== true)
    || !same(fixtureEvidence?.precondition?.reasons, [])) {
    errors.push('fixture runtime-capture evidence replay');
  }
  if (!exactKeys(fixtureEvidence?.preconditionInput, [
    'raw', 'state', 'ui', 'routeError', 'authorityReady',
  ]) || !same(fixtureEvidence?.precondition, replayedFixturePrecondition)
    || replayedFixturePrecondition?.ok !== true
    || !exactKeys(replayedFixturePrecondition?.checks,
      ARC4_RECOVERY_PRECONDITION_CHECK_KEYS)
    || Object.values(replayedFixturePrecondition.checks).some(
      (value) => value !== true,
    ) || !same(replayedFixturePrecondition?.reasons, [])) {
    errors.push('fixture product-precondition replay');
  }
  if (report?.firstFailure !== null) errors.push('first failure must be null');
  if (!same(report?.fatalEvents, [])) errors.push('fatal-event inventory');
  if (!same(report?.findings, [])) errors.push('finding inventory');
  return errors;
}
