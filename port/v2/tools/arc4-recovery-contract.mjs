/* Arc 4 real-time recovery certificate contract.

   This module owns no browser, clock, DOM, storage or report file. The
   collector supplies monotonically timestamped service receipts from one
   reopened target; this contract independently requires a full real
   20-minute interval, uninterrupted foreground eligibility, a tightly
   bracketed next-cycle crossing, and an exact terminal report lifecycle. */
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
    && facts.rows.every((row) => row.status === 'depleted'
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
    && recoveredCaptureFacts(authority?.recoveredCaptureFacts, authority.exhaustedCycle + 1)
    && capturePoints.every((point) => point.activePlayMs < expectedBoundary
      ? exhaustedCaptureFacts(point.capture, authority.exhaustedCycle)
      : exhaustedCaptureFacts(point.capture, authority.exhaustedCycle)
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
  const forbiddenVirtualTime = 'Emulation.setVirtual' + 'TimePolicy';
  const checks = Object.freeze({
    fixedDuration: source.includes(
      'const ACTIVE_OBSERVATION_MS = ARC4_RECOVERY_ACTIVE_OBSERVATION_MS;',
    ),
    noDurationOverride: !source.includes('--duration')
      && !source.includes('RECOVERY_DURATION_MS'),
    noVirtualTime: !source.includes(forbiddenVirtualTime),
    noPageClockOverride: !/Object\.defineProperty\s*\(\s*(?:globalThis\.)?(?:performance|Date)/.test(
      joinedPageSources,
    ),
    noActivePlayWriter: !/(?:^|[^=!<>])\.activePlayMs\s*(?:=(?!=)|\*\*=|>>>=|<<=|>>=|&&=|\|\|=|\?\?=|\+=|-=|\*=|\/=|%=|&=|\^=|\|=|\+\+|--)/mu.test(
      joinedPageSources,
    ),
    exactProductionBoundary: productionBoundaryCount === 1,
    noProductionActivePlayWriter: !/(?:\.activePlayMs|\[\s*['"]activePlayMs['"]\s*\])\s*(?:=(?!=)|\*\*=|>>>=|<<=|>>=|&&=|\|\|=|\?\?=|\+=|-=|\*=|\/=|%=|&=|\^=|\|=|\+\+|--)/mu.test(
      productionSource,
    ),
    noProductionClockOverride: !/(?:Object\.defineProperty\s*\([^\n]*(?:Date|performance)|(?:Date|performance)(?:\.now|\[\s*['"]now['"]\s*\])\s*=)/mu.test(
      productionSource,
    ),
    targetDestroyedDerived: source.includes(
      "message.method === 'Target.targetDestroyed'",
    ) && source.includes('targetDestroyedEvents.push({'),
    postCloseInventoryDerived: source.includes("send('Target.getTargets')")
      && source.includes('postCloseTargetInventory:'),
  });
  return Object.freeze({ ok: Object.values(checks).every(Boolean), checks });
}

export function terminalArc4RecoveryReportErrors(report, {
  expectedRunId, currentSource, replayedDomainAssessment,
  replayedObservationVerdict, replayedAuthorityBinding,
  currentBuild, currentInputs, ordinarySliceSeal, instrumentSeal,
} = {}) {
  const errors = [];
  if (report?.schema !== ARC4_RECOVERY_REPORT_SCHEMA) errors.push('report schema');
  if (report?.status !== 'pass') errors.push('report status is not pass');
  if (report?.runId !== expectedRunId) errors.push('report run ID');
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
  if (report?.firstFailure !== null) errors.push('first failure must be null');
  if (!same(report?.fatalEvents, [])) errors.push('fatal-event inventory');
  if (!same(report?.findings, [])) errors.push('finding inventory');
  return errors;
}
