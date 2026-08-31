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
const HISTORICAL_WORKER_ART_DIAGNOSTICS_SCHEMA =
  'cf-v2-species-art-worker-diagnostics/v1';
const WORKER_ART_DIAGNOSTICS_SCHEMA = 'cf-v2-species-art-worker-diagnostics/v2';
export const PROFILES = Object.freeze(['phone', 'desktop']);
export const COMMAND_TIMEOUT_MS = 2000;
export const CANDIDATE_TRANSPORT_TIMEOUT_MS = 5000;
export const BASELINE_OBSERVATION_TIMEOUT_MS = 180000;
export const CANDIDATE_BROWSER_LABEL = 'Compendium memory/resource gate';
export const COMPENDIUM_BROWSER_AUTHORITY_SCHEMA =
  'cf-v2-compendium-browser-authority/v2';
export const COMPENDIUM_BROWSER_AUTHORITY_SCOPE = 'arc1a-compendium-memory-only';
export const COMPENDIUM_BROWSER_FAMILY = 'microsoft-edge';
export const COMPENDIUM_BROWSER_CAPABILITY_CONTRACT =
  'cf-v2-compendium-cdp-capabilities/v1';
export const COMPENDIUM_BROWSER_PROTOCOL_VERSION = '1.3';
export const COMPENDIUM_BROWSER_REQUIRED_CDP_METHODS = Object.freeze([
  'Browser.getVersion',
  'Emulation.setDeviceMetricsOverride',
  'Emulation.setFocusEmulationEnabled',
  'Emulation.setTouchEmulationEnabled',
  'HeapProfiler.collectGarbage',
  'HeapProfiler.enable',
  'Input.dispatchKeyEvent',
  'Input.dispatchMouseEvent',
  'Input.insertText',
  'Memory.getDOMCounters',
  'Page.addScriptToEvaluateOnNewDocument',
  'Page.bringToFront',
  'Page.captureScreenshot',
  'Page.enable',
  'Page.navigate',
  'Runtime.enable',
  'Runtime.evaluate',
  'Runtime.getHeapUsage',
  'Target.activateTarget',
  'Target.attachToTarget',
  'Target.createBrowserContext',
  'Target.createTarget',
]);
export const COMPENDIUM_BROWSER_BEST_EFFORT_CDP_METHODS = Object.freeze([
  'Target.detachFromTarget',
  'Target.disposeBrowserContext',
]);
export const COMPENDIUM_BROWSER_CAPABILITY_CONTRACT_SHA256 =
  sha256(JSON.stringify(COMPENDIUM_BROWSER_REQUIRED_CDP_METHODS));
export const COMPENDIUM_BROWSER_HISTORICAL_CAPABILITY_CONTRACT_SHA256S = Object.freeze([
  '6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476',
]);
export const COMPENDIUM_MEASUREMENT_AUTHORITY_SCHEMA =
  'cf-v2-compendium-measurement-authority/v1';
export const COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS = Object.freeze([
  'fixtureSpec', 'fixtureRows', 'fixtureGenerator',
  'budgetSchema', 'outcomeContract', 'collector',
  'browserCdp', 'browserPath', 'workspaceLock',
  'package', 'packageLock', 'appPackage', 'baselineSaveFixtures',
  'speciesArtBuildGraph', 'outcomeInventory',
]);
const HISTORICAL_COMPENDIUM_PRODUCER_AUTHORITY_SCHEMA =
  'cf-v2-compendium-producer-authority/v1';
export const COMPENDIUM_PRODUCER_AUTHORITY_SCHEMA =
  'cf-v2-compendium-producer-authority/v2';
const HISTORICAL_COMPENDIUM_PRODUCER_AUTHORITY_INPUT_KEYS = Object.freeze([
  'index', 'owner', 'worker', 'painter',
]);
export const COMPENDIUM_PRODUCER_AUTHORITY_INPUT_KEYS = Object.freeze([
  ...HISTORICAL_COMPENDIUM_PRODUCER_AUTHORITY_INPUT_KEYS, 'serviceWorker',
]);
export const COMPENDIUM_FIXED_RULER_AUTHORITY_SCHEMA =
  'cf-v2-compendium-fixed-ruler-authority/v1';
export const COMPENDIUM_FIXED_RULER_CALIBRATION_STATUS = 'sealed-exact-input';
export const COMPENDIUM_FIXED_RULER_CEILING_SCOPE = 'numeric-ceilings-only';
export const COMPENDIUM_CURRENT_CERTIFICATION_REQUIREMENT =
  'fresh-exact-producer-required';
export const CANDIDATE_CDP_TIMEOUT_SCHEMA = 'cf-v2-compendium-cdp-timeout/v1';
export const CANDIDATE_COMMAND_SCHEMA = 'cf-v2-compendium-candidate-command/v1';
export const PLAIN_EVALUATE_COMMAND_SCHEMA = 'cf-v2-compendium-plain-evaluate-command/v1';
export const RAW_CDP_COMMAND_SCHEMA = 'cf-v2-compendium-raw-cdp-command/v1';
export const PARTIAL_FAILURE_SCHEMA = 'cf-v2-compendium-partial-failure/v1';
export const PARTIAL_PROFILE_SCHEMA = 'cf-v2-compendium-partial-profile/v6';
export const FILTER_TRANSITION_SCHEMA = 'cf-v2-compendium-filter-transition/v3';
export const PRODUCER_ERROR_WITNESS_SCHEMA =
  'cf-v2-compendium-producer-error-witness/v1';
export const BACK_ACTION_WITNESS_SCHEMA =
  'cf-v2-compendium-back-action-witness/v1';
export const PRODUCER_ERROR_ARM_MESSAGE = 'compendiummem injected producer error';
export const PRODUCER_ERROR_ARM_SENTINEL = 'cf-v2-compendium-producer-error-armed/v1';
export const THUMB_SETTLEMENT_OBSERVATION_SCHEMA =
  'cf-v2-compendium-thumb-settlement-observation/v3';
export const THUMB_SETTLEMENT_RECEIPT_SCHEMA =
  'cf-v2-compendium-thumb-settlement-receipt/v1';
export const THUMB_SETTLEMENT_ACTIVE_SCHEMA =
  'cf-v2-compendium-thumb-settlement-active/v1';
export const THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS = 30_000;
export const FOREGROUND_SERVICE_OBSERVATION_SCHEMA =
  'cf-v2-compendium-foreground-service-observation/v1';
export const FOREGROUND_SERVICE_RECEIPT_SCHEMA =
  'cf-v2-compendium-foreground-service-receipt/v1';
export const FOREGROUND_SERVICE_RECEIPT_LABELS = Object.freeze([
  'fresh lazy-control', 'veteran Earth', 'final lazy-control',
]);
export const FOREGROUND_SERVICE_RECEIPT_TIMEOUT_MS = 5_000;
export const MAX_THUMB_SETTLEMENT_IMAGES = 64;
export const MAX_THUMB_SETTLEMENT_BROKER_KEYS = 256;
export const MAX_THUMB_SETTLEMENT_FILTER_COUNT = 1_000_000;
export const MAX_THUMB_SETTLEMENT_REASONS = 384;
export const REQUIRED_WARM_CYCLES = 4;
export const REQUIRED_QUIESCENT_UNLEASED_THUMB_ENTRIES = 17;
const REQUIRED_WARM_PLANETSIDE_THUMB_ENTRIES = 8;
const thumbSettlementPlanEntry = (label, surface, expectedCount = null) => Object.freeze({
  label, surface, expectedCount,
});
const numberedThumbSettlementPlan = (prefix, count) => Array.from(
  { length: count }, (_, index) => thumbSettlementPlanEntry(
    `${prefix}-${String(index + 1).padStart(2, '0')}-list`, 'list', null,
  ),
);
export const THUMB_SETTLEMENT_RECEIPT_PLAN = Object.freeze([
  thumbSettlementPlanEntry('veteran-earth-planetside', 'planetside'),
  thumbSettlementPlanEntry('viewport-contracted-list', 'list', 1500),
  thumbSettlementPlanEntry('viewport-expanded-list', 'list', 1500),
  thumbSettlementPlanEntry('viewport-restored-list', 'list', 1500),
  thumbSettlementPlanEntry('identity-reopen-list', 'list', 1500),
  thumbSettlementPlanEntry('sentinel-filter-list', 'list', 2),
  thumbSettlementPlanEntry('post-churn-planetside', 'planetside'),
  thumbSettlementPlanEntry('post-churn-reopen-list', 'list', 1500),
  thumbSettlementPlanEntry('middle-scroll-list', 'list'),
  thumbSettlementPlanEntry('last-scroll-list', 'list'),
  thumbSettlementPlanEntry('filter-beacon-list', 'list', 1),
  thumbSettlementPlanEntry('filter-reset-list', 'list', 1500),
  thumbSettlementPlanEntry('detail-primary-scroll-list', 'list'),
  thumbSettlementPlanEntry('detail-primary-row-activation-list', 'list', 1500),
  thumbSettlementPlanEntry('detail-back-reopen-list', 'list', 1500),
  thumbSettlementPlanEntry('detail-back-scroll-list', 'list'),
  thumbSettlementPlanEntry('detail-back-row-activation-list', 'list', 1500),
  thumbSettlementPlanEntry('detail-back-return-list', 'list', 1500),
  thumbSettlementPlanEntry('detail-back-post-layout-list', 'list', 1500),
  thumbSettlementPlanEntry('focus-reopen-list', 'list', 1500),
  thumbSettlementPlanEntry('focus-off-window-scroll-list', 'list'),
  thumbSettlementPlanEntry('focus-snapshot-pre-list', 'list', 1500),
  thumbSettlementPlanEntry('focus-snapshot-post-list', 'list', 1500),
  thumbSettlementPlanEntry('close-reopen-list', 'list', 1500),
  thumbSettlementPlanEntry('close-planetside', 'planetside'),
  thumbSettlementPlanEntry('lifecycle-reveal-planetside', 'planetside'),
  thumbSettlementPlanEntry('warm-fill-open-list', 'list', 1500),
  ...numberedThumbSettlementPlan('warm-fill-scroll', 21),
  thumbSettlementPlanEntry('warm-anchor-scroll-list', 'list'),
  thumbSettlementPlanEntry('warm-precondition-planetside', 'planetside'),
  ...Array.from({ length: REQUIRED_WARM_CYCLES }, (_, index) => {
    const cycle = index + 1;
    return [
      thumbSettlementPlanEntry(`warm-cycle-${cycle}-open-list`, 'list', 1500),
      thumbSettlementPlanEntry(`warm-cycle-${cycle}-anchor-scroll-list`, 'list'),
      thumbSettlementPlanEntry(`warm-cycle-${cycle}-planetside`, 'planetside'),
    ];
  }).flat(),
  thumbSettlementPlanEntry('cap-open-list', 'list', 1500),
  ...numberedThumbSettlementPlan('cap-fill-scroll', 21),
  thumbSettlementPlanEntry('post-cap-planetside', 'planetside'),
]);
export const MAX_THUMB_SETTLEMENT_RECEIPT_HISTORY =
  THUMB_SETTLEMENT_RECEIPT_PLAN.length * 50;
export const MAX_PARTIAL_COMMAND_LEDGER_ENTRIES = 2_048;
export const MAX_PARTIAL_COMMAND_LEDGER_BYTES = 2_097_152;
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
  'warm-precondition',
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
  'outcomeContract', 'collector', 'browserCdp', 'browserPath', 'workspaceLock',
  'package', 'packageLock', 'appPackage', 'baselineSaveFixtures',
  'speciesArtBuildGraph', 'outcomeInventory',
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
function boundedString(value, { allowEmpty = false, max = 512 } = {}) {
  return typeof value === 'string' && value.length <= max && (allowEmpty || value.length > 0);
}
function boundedCount(value, max = 1_000_000) {
  return integer(value) && value >= 0 && value <= max;
}
function absoluteExecutable(value) {
  return typeof value === 'string' && value.length > 0
    && (value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value));
}
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

function validBackAnchorSample(sample, expectedLogicalId) {
  const keys = [
    'logicalId', 'offsetPx', 'scrollTop', 'window',
    'selectedLogicalId', 'selectedIndex', 'selectedMounted', 'selectedIntersects',
    'selectedInWindow', 'selectedPinned', 'activeLogicalId',
  ];
  const windowKeys = ['start', 'end', 'beforePx', 'afterPx'];
  return isObject(sample) && sameJson(Object.keys(sample).sort(), [...keys].sort())
    && boundedString(sample.logicalId)
    && finite(sample.offsetPx) && finite(sample.scrollTop)
    && isObject(sample.window)
    && sameJson(Object.keys(sample.window).sort(), [...windowKeys].sort())
    && integer(sample.window.start) && sample.window.start >= 0
    && integer(sample.window.end) && sample.window.end > sample.window.start
    && nonnegative(sample.window.beforePx) && nonnegative(sample.window.afterPx)
    && sample.selectedLogicalId === expectedLogicalId
    && integer(sample.selectedIndex) && sample.selectedIndex >= 0
    && typeof sample.selectedMounted === 'boolean'
    && typeof sample.selectedIntersects === 'boolean'
    && typeof sample.selectedInWindow === 'boolean'
    && typeof sample.selectedPinned === 'boolean'
    && sample.selectedMounted === true && sample.selectedIntersects === true
    && (sample.selectedInWindow === true || sample.selectedPinned === true)
    && (sample.activeLogicalId === null || boundedString(sample.activeLogicalId));
}

export function validCompendiumBackActionWitness(
  witness, { logicalId, logicalIndex, documentToken } = {},
) {
  const witnessKeys = [
    'schema', 'expectedLogicalId', 'expectedLogicalIndex', 'expectedDocumentToken',
    'settlementAttempt', 'arm', 'observationCount', 'events', 'cleanup',
  ];
  const armKeys = [
    'documentToken', 'scrollerCount', 'targetRowCount',
    'pointHitLogicalId', 'pointX', 'pointY',
  ];
  const eventKeys = [
    'sequence', 'type', 'trusted', 'button', 'detail',
    'eventPhase', 'currentTargetIsDocument',
    'clientX', 'clientY', 'targetLogicalId', 'hitLogicalId',
    'targetIndex', 'targetRowCount', 'scrollerCount',
    'targetOwnerDocument', 'targetConnected', 'documentToken', 'panel', 'anchor',
  ];
  const panelKeys = ['mode', 'query', 'sourceCount', 'filteredCount'];
  const cleanupKeys = ['controllerAborted', 'carrierPresent'];
  if (!boundedString(logicalId) || !integer(logicalIndex) || logicalIndex < 0
    || !boundedString(documentToken)
    || !isObject(witness)
    || !sameJson(Object.keys(witness).sort(), [...witnessKeys].sort())
    || witness.schema !== BACK_ACTION_WITNESS_SCHEMA
    || witness.expectedLogicalId !== logicalId
    || witness.expectedLogicalIndex !== logicalIndex
    || witness.expectedDocumentToken !== documentToken
    || !integer(witness.settlementAttempt)
    || witness.settlementAttempt < 1 || witness.settlementAttempt > 8
    || !isObject(witness.arm)
    || !sameJson(Object.keys(witness.arm).sort(), [...armKeys].sort())
    || witness.arm.documentToken !== documentToken
    || witness.arm.scrollerCount !== 1 || witness.arm.targetRowCount !== 1
    || witness.arm.pointHitLogicalId !== logicalId
    || !finite(witness.arm.pointX) || !finite(witness.arm.pointY)
    || witness.observationCount !== 1
    || !Array.isArray(witness.events) || witness.events.length !== 1
    || !isObject(witness.cleanup)
    || !sameJson(Object.keys(witness.cleanup).sort(), [...cleanupKeys].sort())
    || witness.cleanup.controllerAborted !== true
    || witness.cleanup.carrierPresent !== false) return false;
  const event = witness.events[0];
  return isObject(event)
    && sameJson(Object.keys(event).sort(), [...eventKeys].sort())
    && event.sequence === 1
    && event.type === 'click' && event.trusted === true && event.button === 0
    && event.detail === 1
    && event.eventPhase === 1 && event.currentTargetIsDocument === true
    && finite(event.clientX) && finite(event.clientY)
    && Math.abs(event.clientX - witness.arm.pointX) <= 0.5
    && Math.abs(event.clientY - witness.arm.pointY) <= 0.5
    && event.targetLogicalId === logicalId && event.hitLogicalId === logicalId
    && event.targetIndex === logicalIndex
    && event.targetRowCount === 1 && event.scrollerCount === 1
    && event.targetOwnerDocument === true && event.targetConnected === true
    && event.documentToken === documentToken
    && isObject(event.panel)
    && sameJson(Object.keys(event.panel).sort(), [...panelKeys].sort())
    && event.panel.mode === 'list' && event.panel.query === ''
    && event.panel.sourceCount === 1500 && event.panel.filteredCount === 1500
    && validBackAnchorSample(event.anchor, logicalId)
    && event.anchor.selectedIndex === logicalIndex;
}

function validCurrentBackActionMeasurement(measurement) {
  const navigation = measurement?.phases?.backNavigation;
  const logicalId = measurement?.targets?.detail;
  const documentToken = measurement?.pageAuthorities?.main?.documentToken;
  const actionWitness = navigation?.actionWitness;
  return isObject(navigation) && isObject(navigation.setup) && isObject(navigation.before)
    && validCompendiumBackActionWitness(actionWitness, {
      logicalId, logicalIndex: 777, documentToken,
    })
    && sameJson(navigation.before, actionWitness.events[0].anchor);
}

export function compendiumBrowserCapabilityInventoryErrors({
  collectorSource, browserCdpSource,
} = {}) {
  const errors = [];
  if (typeof collectorSource !== 'string' || typeof browserCdpSource !== 'string') {
    return ['Compendium browser capability inventory sources are unavailable'];
  }
  const domains = '(?:Browser|Emulation|HeapProfiler|Input|Memory|Page|Runtime|Target)';
  const methodPattern = new RegExp(`["'](${domains}\\.[A-Za-z]+)["']`, 'g');
  const collectorMethods = [...collectorSource.matchAll(methodPattern)].map((match) => match[1]);
  const actual = [...new Set(collectorMethods)].sort();
  const expected = [
    ...COMPENDIUM_BROWSER_REQUIRED_CDP_METHODS
      .filter((method) => method !== 'Browser.getVersion'),
    ...COMPENDIUM_BROWSER_BEST_EFFORT_CDP_METHODS,
  ].sort();
  if (!sameJson(actual, expected)) {
    const missing = expected.filter((method) => !actual.includes(method));
    const extra = actual.filter((method) => !expected.includes(method));
    if (missing.length) errors.push(`Compendium collector capability inventory is missing ${missing.join(', ')}`);
    if (extra.length) errors.push(`Compendium collector capability inventory has unsealed ${extra.join(', ')}`);
  }
  if (!/["']Browser\.getVersion["']/.test(browserCdpSource)) {
    errors.push('Compendium browser transport lacks Browser.getVersion provenance');
  }
  return errors;
}

export function compendiumMeasurementAuthority(inputs) {
  if (!isObject(inputs) || COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS.some((key) =>
    !/^[a-f0-9]{64}$/.test(String(inputs[key] || '')))) return null;
  const hashes = Object.freeze(Object.fromEntries(
    COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS.map((key) => [key, inputs[key]]),
  ));
  return Object.freeze({
    schema: COMPENDIUM_MEASUREMENT_AUTHORITY_SCHEMA,
    sha256: sha256(JSON.stringify(hashes)),
    inputs: hashes,
  });
}
function validMeasurementAuthority(value) {
  if (!isObject(value)
    || !exactKeys(value, ['schema', 'sha256', 'inputs'], 'measurementAuthority', [])
    || value.schema !== COMPENDIUM_MEASUREMENT_AUTHORITY_SCHEMA
    || !/^[a-f0-9]{64}$/.test(String(value.sha256 || ''))
    || !isObject(value.inputs)
    || !sameJson(Object.keys(value.inputs), [...COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS])
    || COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS.some((key) =>
      !/^[a-f0-9]{64}$/.test(String(value.inputs[key] || '')))) return false;
  return value.sha256 === sha256(JSON.stringify(value.inputs));
}

function validProducerAuthorityPart(value, key) {
  return isObject(value)
    && sameJson(Object.keys(value).sort(), ['relativePath', 'sha256'])
    && typeof value.relativePath === 'string' && value.relativePath.length > 0
    && !value.relativePath.startsWith('/') && !value.relativePath.includes('..')
    && (key === 'index' ? value.relativePath === 'index.html'
      : key === 'serviceWorker' ? value.relativePath === 'service-worker.js'
        : value.relativePath.endsWith('.js'))
    && /^[a-f0-9]{64}$/.test(String(value.sha256 || ''));
}
export function compendiumProducerAuthority(buildGraph) {
  const inputKeys = isObject(buildGraph) && buildGraph.serviceWorker !== undefined
    ? COMPENDIUM_PRODUCER_AUTHORITY_INPUT_KEYS
    : HISTORICAL_COMPENDIUM_PRODUCER_AUTHORITY_INPUT_KEYS;
  if (!isObject(buildGraph) || inputKeys.some((key) =>
    !validProducerAuthorityPart(buildGraph[key], key))) return null;
  const inputs = Object.freeze(Object.fromEntries(
    inputKeys.map((key) => [key, Object.freeze({
      relativePath: buildGraph[key].relativePath,
      sha256: buildGraph[key].sha256,
    })]),
  ));
  return Object.freeze({
    schema: inputKeys === COMPENDIUM_PRODUCER_AUTHORITY_INPUT_KEYS
      ? COMPENDIUM_PRODUCER_AUTHORITY_SCHEMA
      : HISTORICAL_COMPENDIUM_PRODUCER_AUTHORITY_SCHEMA,
    sha256: sha256(JSON.stringify(inputs)),
    inputs,
  });
}
function validProducerAuthority(value) {
  const inputKeys = value?.schema === COMPENDIUM_PRODUCER_AUTHORITY_SCHEMA
    ? COMPENDIUM_PRODUCER_AUTHORITY_INPUT_KEYS
    : value?.schema === HISTORICAL_COMPENDIUM_PRODUCER_AUTHORITY_SCHEMA
      ? HISTORICAL_COMPENDIUM_PRODUCER_AUTHORITY_INPUT_KEYS : null;
  if (!isObject(value)
    || !exactKeys(value, ['schema', 'sha256', 'inputs'], 'producerAuthority', [])
    || inputKeys === null
    || !/^[a-f0-9]{64}$/.test(String(value.sha256 || ''))
    || !isObject(value.inputs)
    || !sameJson(Object.keys(value.inputs), [...inputKeys])
    || inputKeys.some((key) =>
      !validProducerAuthorityPart(value.inputs[key], key))) return false;
  return value.sha256 === sha256(JSON.stringify(value.inputs));
}

export function validCompendiumFixedRulerAuthority(value) {
  return isObject(value)
    && exactKeys(value, [
      'schema', 'calibrationStatus', 'ceilingScope',
      'measurementAuthoritySha256', 'producerAuthoritySha256',
      'currentCertification',
    ], 'calibration.rulerAuthority', [])
    && value.schema === COMPENDIUM_FIXED_RULER_AUTHORITY_SCHEMA
    && value.calibrationStatus === COMPENDIUM_FIXED_RULER_CALIBRATION_STATUS
    && value.ceilingScope === COMPENDIUM_FIXED_RULER_CEILING_SCOPE
    && /^[a-f0-9]{64}$/.test(String(value.measurementAuthoritySha256 || ''))
    && /^[a-f0-9]{64}$/.test(String(value.producerAuthoritySha256 || ''))
    && value.currentCertification === COMPENDIUM_CURRENT_CERTIFICATION_REQUIREMENT;
}

const COMPENDIUM_BROWSER_AUTHORITY_FIELDS = Object.freeze([
  'family', 'protocolVersion', 'capabilityContract', 'capabilityContractSha256',
]);
const COMPENDIUM_EDGE_PRODUCT = /^Edg\/(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;

/** Version-tolerant Arc 1A browser compatibility authority. Exact product
 * version, revision, JavaScript version, executable and user agent remain
 * mandatory per-run provenance, but auto-update drift cannot change the
 * ruler. The live preflight and collector own the capability contract. */
export function compendiumBrowserAuthority(browser) {
  if (!isObject(browser)) return null;
  const product = browser.product;
  const revision = browser.revision;
  const jsVersion = browser.jsVersion ?? browser.js_version;
  const protocolVersion = browser.protocolVersion ?? browser.protocol_version;
  if (typeof product !== 'string' || !COMPENDIUM_EDGE_PRODUCT.test(product)
    || typeof revision !== 'string' || revision.length === 0
    || typeof jsVersion !== 'string' || jsVersion.length === 0
    || protocolVersion !== COMPENDIUM_BROWSER_PROTOCOL_VERSION) return null;
  const authority = {
    schema: COMPENDIUM_BROWSER_AUTHORITY_SCHEMA,
    scope: COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
    family: COMPENDIUM_BROWSER_FAMILY,
    protocolVersion,
    capabilityContract: COMPENDIUM_BROWSER_CAPABILITY_CONTRACT,
    capabilityContractSha256: COMPENDIUM_BROWSER_CAPABILITY_CONTRACT_SHA256,
  };
  return Object.freeze(authority);
}

export function validCompendiumBrowserAuthority(authority) {
  return isObject(authority)
    && sameJson(Object.keys(authority).sort(), [
      'schema', 'scope', ...COMPENDIUM_BROWSER_AUTHORITY_FIELDS,
    ].sort())
    && authority.schema === COMPENDIUM_BROWSER_AUTHORITY_SCHEMA
    && authority.scope === COMPENDIUM_BROWSER_AUTHORITY_SCOPE
    && authority.family === COMPENDIUM_BROWSER_FAMILY
    && authority.protocolVersion === COMPENDIUM_BROWSER_PROTOCOL_VERSION
    && authority.capabilityContract === COMPENDIUM_BROWSER_CAPABILITY_CONTRACT
    && [COMPENDIUM_BROWSER_CAPABILITY_CONTRACT_SHA256,
      ...COMPENDIUM_BROWSER_HISTORICAL_CAPABILITY_CONTRACT_SHA256S]
      .includes(authority.capabilityContractSha256);
}

export function compendiumBrowserAuthorityMatches(browser, authority) {
  const observed = compendiumBrowserAuthority(browser);
  return observed !== null && validCompendiumBrowserAuthority(authority)
    && ['schema', 'scope', 'family', 'protocolVersion', 'capabilityContract']
      .every((field) => observed[field] === authority[field]);
}

export function compendiumBudgetBrowserAuthority(record) {
  return validCompendiumBrowserAuthority(record?.browserAuthority)
    && record.browserAuthority.capabilityContractSha256
      === COMPENDIUM_BROWSER_CAPABILITY_CONTRACT_SHA256
    ? record.browserAuthority : null;
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

const PRODUCER_ERROR_ART_LIVE_FIELDS = Object.freeze([
  'cacheEntries', 'queuedJobs', 'activeJobs', 'leases', 'subscribers',
]);
const PRODUCER_ERROR_ART_TOTAL_FIELDS = Object.freeze([
  'leaseAcquires', 'releases', 'jobStarts', 'jobCompletes',
  'jobCancels', 'jobErrors', 'disposals',
]);

function validProducerErrorArtTelemetry(art) {
  return isObject(art)
    && sameJson(Object.keys(art).sort(), ['cacheLimit', 'cachedKeyCount', 'live', 'totals'])
    && integer(art.cacheLimit) && art.cacheLimit > 0
    && integer(art.cachedKeyCount) && art.cachedKeyCount >= 0
    && isObject(art.live) && isObject(art.totals)
    && sameJson(Object.keys(art.live).sort(), [...PRODUCER_ERROR_ART_LIVE_FIELDS].sort())
    && sameJson(Object.keys(art.totals).sort(), [...PRODUCER_ERROR_ART_TOTAL_FIELDS].sort())
    && PRODUCER_ERROR_ART_LIVE_FIELDS.every((field) =>
      integer(art.live[field]) && art.live[field] >= 0)
    && PRODUCER_ERROR_ART_TOTAL_FIELDS.every((field) =>
      integer(art.totals[field]) && art.totals[field] >= 0)
    && art.cachedKeyCount === art.live.cacheEntries
    && art.cachedKeyCount <= art.cacheLimit;
}

export function validProducerErrorPreArmObservation(observation) {
  const keys = [
    'ready', 'panelMode', 'sourceCount', 'listImageCount', 'planetsideVisible',
    'planetsideImageCount', 'planetsideReadyCount',
    'planetsideDistinctVisualKeys', 'cachedKeys', 'art',
  ];
  if (!isObject(observation) || !sameJson(Object.keys(observation).sort(), keys.sort())
    || typeof observation.ready !== 'boolean'
    || typeof observation.panelMode !== 'string'
    || typeof observation.planetsideVisible !== 'boolean'
    || !Array.isArray(observation.cachedKeys)
    || !observation.cachedKeys.every((key) => typeof key === 'string' && key.length > 0)
    || new Set(observation.cachedKeys).size !== observation.cachedKeys.length
    || !sameJson(observation.cachedKeys, [...observation.cachedKeys].sort())
    || !['sourceCount', 'listImageCount', 'planetsideImageCount',
      'planetsideReadyCount', 'planetsideDistinctVisualKeys'].every((field) =>
      integer(observation[field]) && observation[field] >= 0)
    || !validProducerErrorArtTelemetry(observation.art)
    || observation.cachedKeys.length !== observation.art.cachedKeyCount) return false;
  const expectedReady = observation.panelMode === 'closed' && observation.sourceCount === 1500
    && observation.listImageCount === 0 && observation.planetsideVisible
    && observation.planetsideImageCount > 0 && observation.planetsideImageCount <= 8
    && observation.planetsideReadyCount === observation.planetsideImageCount
    && observation.planetsideDistinctVisualKeys === observation.planetsideImageCount
    && observation.art.live.queuedJobs === 0 && observation.art.live.activeJobs === 0
    && observation.art.live.leases === observation.planetsideImageCount
    && observation.art.live.subscribers === 0;
  return observation.ready === expectedReady;
}

function validProducerErrorRow(row) {
  const keys = [
    'logicalId', 'index', 'visualKey', 'thumbState',
    'naturalWidth', 'naturalHeight', 'complete', 'cached',
  ];
  return isObject(row) && sameJson(Object.keys(row).sort(), keys.sort())
    && typeof row.logicalId === 'string'
    && integer(row.index) && row.index >= 0
    && (row.visualKey === null || typeof row.visualKey === 'string')
    && typeof row.thumbState === 'string'
    && integer(row.naturalWidth) && row.naturalWidth >= 0
    && integer(row.naturalHeight) && row.naturalHeight >= 0
    && typeof row.complete === 'boolean'
    && typeof row.cached === 'boolean';
}

export function validProducerErrorWorkObservation(observation) {
  const keys = [
    'ready', 'panelMode', 'sourceCount', 'generation', 'mountedRowCount',
    'mountedDistinctLogicalIds', 'mountedDistinctVisualKeys',
    'stateCounts', 'rows', 'art',
  ];
  const stateKeys = ['placeholder', 'ready', 'error', 'released', 'other'];
  if (!isObject(observation) || !sameJson(Object.keys(observation).sort(), keys.sort())
    || typeof observation.ready !== 'boolean' || typeof observation.panelMode !== 'string'
    || !['sourceCount', 'generation', 'mountedRowCount', 'mountedDistinctLogicalIds',
      'mountedDistinctVisualKeys'].every((field) =>
      integer(observation[field]) && observation[field] >= 0)
    || !isObject(observation.stateCounts)
    || !sameJson(Object.keys(observation.stateCounts).sort(), stateKeys.sort())
    || !stateKeys.every((field) =>
      integer(observation.stateCounts[field]) && observation.stateCounts[field] >= 0)
    || !Array.isArray(observation.rows) || !observation.rows.every(validProducerErrorRow)
    || observation.rows.length !== observation.mountedRowCount
    || !validProducerErrorArtTelemetry(observation.art)) return false;
  const actualStateCounts = { placeholder: 0, ready: 0, error: 0, released: 0, other: 0 };
  for (const row of observation.rows) {
    const field = Object.hasOwn(actualStateCounts, row.thumbState) ? row.thumbState : 'other';
    actualStateCounts[field]++;
  }
  const logicalIds = observation.rows.map((row) => row.logicalId).filter(Boolean);
  const visualKeys = observation.rows.map((row) => row.visualKey).filter(Boolean);
  const expectedReady = observation.panelMode === 'list' && observation.sourceCount === 1500
    && observation.rows.length > 0
    && observation.art.live.queuedJobs === 0 && observation.art.live.activeJobs === 0
    && logicalIds.length === observation.rows.length
    && visualKeys.length === observation.rows.length
    && new Set(logicalIds).size === observation.rows.length
    && new Set(visualKeys).size === observation.rows.length
    && observation.rows.every((row, index) => row.index === index
      && (row.thumbState !== 'ready' || (row.complete
        && row.naturalWidth === 132 && row.naturalHeight === 132)));
  return stateKeys.every((field) => observation.stateCounts[field] === actualStateCounts[field])
    && observation.mountedDistinctLogicalIds === new Set(logicalIds).size
    && observation.mountedDistinctVisualKeys === new Set(visualKeys).size
    && observation.ready === expectedReady;
}

function validProducerErrorObservationGroup(group, validator) {
  const keys = ['accepted', 'falsyObservations', 'observationCount'];
  if (!isObject(group) || !sameJson(Object.keys(group).sort(), keys.sort())
    || !integer(group.observationCount) || group.observationCount < 0
    || !Array.isArray(group.falsyObservations)
    || !group.falsyObservations.every((observation) =>
      validator(observation) && observation.ready === false)
    || (group.accepted !== null
      && (!validator(group.accepted) || group.accepted.ready !== true))) return false;
  return group.observationCount === group.falsyObservations.length
    + (group.accepted === null ? 0 : 1);
}

function validProducerErrorAnswerability(receipt, profile) {
  const keys = ['target', 'heartbeat'];
  const targetKeys = ['ok', 'ms', 'value', 'expected'];
  const heartbeatKeys = ['ok', 'ms', 'product'];
  return isObject(receipt) && sameJson(Object.keys(receipt).sort(), keys.sort())
    && isObject(receipt.target)
    && sameJson(Object.keys(receipt.target).sort(), targetKeys.sort())
    && typeof receipt.target.ok === 'boolean' && nonnegative(receipt.target.ms)
    && receipt.target.expected === `${profile}-error`
    && receipt.target.ok === (receipt.target.value === receipt.target.expected
      && receipt.target.ms <= COMMAND_TIMEOUT_MS)
    && isObject(receipt.heartbeat)
    && sameJson(Object.keys(receipt.heartbeat).sort(), heartbeatKeys.sort())
    && typeof receipt.heartbeat.ok === 'boolean' && nonnegative(receipt.heartbeat.ms)
    && (receipt.heartbeat.product === null
      || typeof receipt.heartbeat.product === 'string')
    && receipt.heartbeat.ok === (typeof receipt.heartbeat.product === 'string'
      && receipt.heartbeat.product.length > 0
      && receipt.heartbeat.ms <= COMMAND_TIMEOUT_MS);
}

function producerErrorWitnessShape(witness, profile) {
  const keys = [
    'schema', 'preArm', 'armSentinel', 'openTarget', 'publication',
    'answerability', 'closeTarget', 'recoveryOpenTarget', 'recovery', 'commands',
  ];
  const candidateLabels = producerErrorCandidateLabels(profile);
  return isObject(witness) && sameJson(Object.keys(witness).sort(), keys.sort())
    && witness.schema === PRODUCER_ERROR_WITNESS_SCHEMA
    && validProducerErrorObservationGroup(
      witness.preArm, validProducerErrorPreArmObservation,
    )
    && (witness.armSentinel === null
      || witness.armSentinel === PRODUCER_ERROR_ARM_SENTINEL)
    && validFilterTargetObservationGroup(witness.openTarget)
    && validProducerErrorObservationGroup(
      witness.publication, validProducerErrorWorkObservation,
    )
    && (witness.answerability === null
      || validProducerErrorAnswerability(witness.answerability, profile))
    && validFilterTargetObservationGroup(witness.closeTarget)
    && validFilterTargetObservationGroup(witness.recoveryOpenTarget)
    && validProducerErrorObservationGroup(
      witness.recovery, validProducerErrorWorkObservation,
    )
    && Array.isArray(witness.commands)
    && witness.commands.every((command) =>
      validCandidateCommandEvidence(command)
      && command.profile === profile && candidateLabels.includes(command.label));
}

export function validProducerErrorWitness(witness, profile, { allowPending = false } = {}) {
  if (!PROFILES.includes(profile) || !producerErrorWitnessShape(witness, profile)) return false;
  if (allowPending) return true;
  return witness.preArm.accepted !== null
    && witness.armSentinel === PRODUCER_ERROR_ARM_SENTINEL
    && witness.openTarget.accepted !== null
    && witness.publication.accepted !== null
    && witness.answerability !== null
    && witness.closeTarget.accepted !== null
    && witness.recoveryOpenTarget.accepted !== null
    && witness.recovery.accepted !== null;
}

function producerErrorRowsDistinct(observation) {
  const rows = observation?.rows;
  return Array.isArray(rows) && rows.length > 0
    && new Set(rows.map((row) => row.logicalId)).size === rows.length
    && new Set(rows.map((row) => row.visualKey)).size === rows.length
    && rows.every((row, index) => row.logicalId && row.visualKey && row.index === index);
}

function producerErrorColdMountedKeyCount(witness) {
  const cachedKeys = witness?.preArm?.accepted?.cachedKeys;
  const rows = witness?.publication?.accepted?.rows;
  if (!Array.isArray(cachedKeys) || !Array.isArray(rows)) return -1;
  const cached = new Set(cachedKeys);
  return new Set(rows.map((row) => row?.visualKey)
    .filter((key) => typeof key === 'string' && key.length > 0 && !cached.has(key))).size;
}

export function producerErrorColdProof(witness, profile) {
  return PROFILES.includes(profile) && producerErrorWitnessShape(witness, profile)
    && producerErrorColdProofObservations(witness);
}

function producerErrorRow(witness) {
  return witness?.publication?.accepted?.rows?.find((row) => row.thumbState === 'error') ?? null;
}

function producerErrorTotalsMonotone(before, after) {
  return PRODUCER_ERROR_ART_TOTAL_FIELDS.every((field) =>
    after?.art?.totals?.[field] >= before?.art?.totals?.[field]);
}

function producerErrorLifetimeBalanced(observation) {
  const art = observation?.art;
  return validProducerErrorArtTelemetry(art)
    && art.totals.leaseAcquires >= art.totals.releases
    && art.totals.leaseAcquires - art.totals.releases === art.live.leases
    && art.totals.jobStarts === art.totals.jobCompletes + art.totals.jobErrors
    && art.live.cacheEntries === art.totals.jobCompletes - art.totals.disposals;
}

function producerErrorPublicationWorkBound(witness) {
  const pre = witness?.preArm?.accepted;
  const publication = witness?.publication?.accepted;
  if (!pre || !publication || !producerErrorTotalsMonotone(pre, publication)
    || !producerErrorLifetimeBalanced(pre)
    || !producerErrorLifetimeBalanced(publication)) return false;
  const leaseAcquireDelta = publication.art.totals.leaseAcquires
    - pre.art.totals.leaseAcquires;
  const releaseDelta = publication.art.totals.releases - pre.art.totals.releases;
  const jobStartDelta = publication.art.totals.jobStarts - pre.art.totals.jobStarts;
  const jobCompleteDelta = publication.art.totals.jobCompletes
    - pre.art.totals.jobCompletes;
  const jobErrorDelta = publication.art.totals.jobErrors - pre.art.totals.jobErrors;
  const disposalDelta = publication.art.totals.disposals - pre.art.totals.disposals;
  const minimumColdStarts = producerErrorColdMountedKeyCount(witness);
  const cachedMountedKeys = new Set(publication.rows
    .filter((row) => row.cached).map((row) => row.visualKey)).size;
  return publication.art.cacheLimit === pre.art.cacheLimit
    && publication.art.live.leases === pre.art.live.leases + publication.mountedRowCount
    && publication.art.live.subscribers === 0
    && leaseAcquireDelta - releaseDelta === publication.mountedRowCount
    && jobStartDelta <= leaseAcquireDelta
    && minimumColdStarts > 0
    && jobStartDelta >= minimumColdStarts
    && jobStartDelta === jobCompleteDelta + jobErrorDelta
    && jobErrorDelta === 1
    && publication.art.live.cacheEntries
      === pre.art.live.cacheEntries + jobCompleteDelta - disposalDelta
    && publication.art.live.cacheEntries >= cachedMountedKeys
    && publication.art.live.cacheEntries <= publication.art.cacheLimit;
}

function producerErrorRecoveryWorkBound(witness) {
  const pre = witness?.preArm?.accepted;
  const publication = witness?.publication?.accepted;
  const recovery = witness?.recovery?.accepted;
  if (!pre || !publication || !recovery
    || !producerErrorTotalsMonotone(publication, recovery)
    || !producerErrorLifetimeBalanced(recovery)) return false;
  const leaseAcquireDelta = recovery.art.totals.leaseAcquires
    - publication.art.totals.leaseAcquires;
  const releaseDelta = recovery.art.totals.releases - publication.art.totals.releases;
  const jobStartDelta = recovery.art.totals.jobStarts - publication.art.totals.jobStarts;
  const jobCompleteDelta = recovery.art.totals.jobCompletes
    - publication.art.totals.jobCompletes;
  const jobErrorDelta = recovery.art.totals.jobErrors - publication.art.totals.jobErrors;
  const disposalDelta = recovery.art.totals.disposals - publication.art.totals.disposals;
  const cachedMountedKeys = new Set(recovery.rows
    .filter((row) => row.cached).map((row) => row.visualKey)).size;
  return recovery.art.cacheLimit === publication.art.cacheLimit
    && recovery.art.live.leases === pre.art.live.leases + recovery.mountedRowCount
    && recovery.art.live.subscribers === 0
    && leaseAcquireDelta - releaseDelta === 0
    && leaseAcquireDelta >= recovery.mountedRowCount + (jobStartDelta - 1)
    && releaseDelta >= recovery.mountedRowCount + (jobStartDelta - 1)
    && jobCompleteDelta >= 1 && jobErrorDelta === 0
    && jobStartDelta === jobCompleteDelta + jobErrorDelta
    && recovery.art.live.cacheEntries
      === publication.art.live.cacheEntries + jobCompleteDelta - disposalDelta
    && recovery.art.live.cacheEntries >= cachedMountedKeys
    && recovery.art.live.cacheEntries <= recovery.art.cacheLimit;
}

export function producerErrorContained(witness, profile) {
  if (!producerErrorColdProof(witness, profile)
    || !producerErrorPublicationWorkBound(witness)) return false;
  const publication = witness.publication.accepted;
  const errorRows = publication.rows.filter((row) => row.thumbState === 'error');
  const row = errorRows[0];
  return errorRows.length === 1 && publication.stateCounts.error === 1
    && row === publication.rows[0] && row.index === 0
    && publication.stateCounts.ready === publication.mountedRowCount - 1
    && publication.stateCounts.placeholder === 0
    && publication.stateCounts.released === 0 && publication.stateCounts.other === 0
    && publication.rows.every((item) => item === row
      ? item.cached === false && item.naturalWidth === 0 && item.naturalHeight === 0
      : item.thumbState === 'ready' && item.cached === true
        && item.naturalWidth === 132 && item.naturalHeight === 132)
    && row.logicalId.length > 0
    && row.visualKey !== null && row.visualKey.length > 0
    && witness.answerability?.target?.ok === true
    && witness.answerability?.heartbeat?.ok === true;
}

export function producerErrorRecoverable(witness, profile) {
  if (!producerErrorContained(witness, profile)
    || !producerErrorRecoveryWorkBound(witness)) return false;
  const errored = producerErrorRow(witness);
  const publication = witness.publication.accepted;
  const recovery = witness.recovery.accepted;
  const recovered = recovery.rows.find((row) => row.logicalId === errored.logicalId);
  return recovery.ready === true && recovery.panelMode === 'list'
    && recovery.sourceCount === 1500
    && sameJson(
      recovery.rows.map((row) => [row.logicalId, row.index, row.visualKey]),
      publication.rows.map((row) => [row.logicalId, row.index, row.visualKey]),
    )
    && recovered?.index === errored.index
    && recovered.visualKey === errored.visualKey
    && recovered.thumbState === 'ready'
    && recovered.naturalWidth === 132 && recovered.naturalHeight === 132
    && recovered.cached === true
    && recovery.stateCounts.ready === recovery.mountedRowCount
    && recovery.stateCounts.placeholder === 0 && recovery.stateCounts.error === 0
    && recovery.stateCounts.released === 0 && recovery.stateCounts.other === 0
    && recovery.rows.every((row) => row.thumbState === 'ready'
      && row.naturalWidth === 132 && row.naturalHeight === 132 && row.cached === true);
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

export function producerErrorStages(profile) {
  if (!PROFILES.includes(profile)) throw new TypeError('producer-error profile is invalid');
  const stages = {
    preArm: 'producer error pre-arm baseline',
    arm: 'arm producer error',
    openTarget: 'producer error open target',
    openPress: 'producer error open mouse press',
    openRelease: 'producer error open mouse release',
    publication: 'producer error publication',
    coldProof: 'producer error cold-key proof',
    answerability: `answerability ${profile}-error`,
    closeTarget: 'producer error close target',
    closePress: 'producer error close mouse press',
    closeRelease: 'producer error close mouse release',
    recoveryOpenTarget: 'producer error recovery open target',
    recoveryOpenPress: 'producer error recovery open mouse press',
    recoveryOpenRelease: 'producer error recovery open mouse release',
    recovery: 'producer error recovery',
  };
  return Object.freeze({
    ...stages,
    sequence: Object.freeze([
      stages.preArm, stages.arm,
      stages.openTarget, stages.openPress, stages.openRelease,
      stages.publication, stages.coldProof, stages.answerability,
      stages.closeTarget, stages.closePress, stages.closeRelease,
      stages.recoveryOpenTarget, stages.recoveryOpenPress,
      stages.recoveryOpenRelease, stages.recovery,
    ]),
  });
}

function producerErrorCandidateLabels(profile) {
  const stages = producerErrorStages(profile);
  return [
    stages.preArm, stages.openTarget, stages.publication, stages.answerability,
    stages.closeTarget, stages.recoveryOpenTarget, stages.recovery,
  ];
}

function producerErrorColdProofObservations(witness) {
  const pre = witness?.preArm?.accepted;
  const publication = witness?.publication?.accepted;
  return validProducerErrorPreArmObservation(pre)
    && validProducerErrorWorkObservation(publication)
    && pre.ready === true && pre.panelMode === 'closed' && pre.sourceCount === 1500
    && pre.listImageCount === 0 && pre.planetsideVisible === true
    && pre.planetsideImageCount > 0 && pre.planetsideImageCount <= 8
    && pre.planetsideReadyCount === pre.planetsideImageCount
    && pre.planetsideDistinctVisualKeys === pre.planetsideImageCount
    && pre.art.live.queuedJobs === 0 && pre.art.live.activeJobs === 0
    && pre.art.live.leases === pre.planetsideImageCount
    && pre.art.live.subscribers === 0
    && publication.ready === true && publication.panelMode === 'list'
    && publication.sourceCount === 1500 && producerErrorRowsDistinct(publication)
    && publication.mountedDistinctLogicalIds === publication.mountedRowCount
    && publication.mountedDistinctVisualKeys === publication.mountedRowCount
    && producerErrorColdMountedKeyCount(witness) > 0
    && publication.rows[0]?.index === 0
    && !pre.cachedKeys.includes(publication.rows[0]?.visualKey);
}

function groupProgressValid(group, stage, completed, failingStage) {
  const stageCompleted = completed.has(stage);
  const stageFailing = failingStage === stage;
  if (stageCompleted) return group.accepted !== null;
  if (stageFailing) return group.accepted === null;
  return group.observationCount === 0 && group.accepted === null;
}

function validPartialProducerErrorPrefix(measurement, failure) {
  const witness = measurement.producerErrorWitness;
  const stages = producerErrorStages(measurement.profile);
  const ownedCompleted = measurement.completedStages.filter((stage) =>
    stages.sequence.includes(stage));
  const failingIndex = stages.sequence.indexOf(measurement.failingStage);
  if (witness === null) {
    const installed = measurement.completedStages.includes('install exact fixture');
    return ownedCompleted.length === 0 && failingIndex < 0
      && (!installed || measurement.failingStage === 'validate exact fixture');
  }
  if (!validProducerErrorWitness(witness, measurement.profile, { allowPending: true })) {
    return false;
  }
  const expectedCompleted = failingIndex >= 0
    ? stages.sequence.slice(0, failingIndex) : stages.sequence;
  if (!sameJson(ownedCompleted, expectedCompleted)) return false;
  const phaseStart = measurement.completedStages.indexOf(stages.preArm);
  if (expectedCompleted.length > 0
    && (phaseStart < 0
      || !sameJson(
        measurement.completedStages.slice(phaseStart, phaseStart + expectedCompleted.length),
        expectedCompleted,
      )
      || (failingIndex >= 0
        && phaseStart + expectedCompleted.length !== measurement.completedStages.length))) {
    return false;
  }
  const completed = new Set(ownedCompleted);
  if (!groupProgressValid(witness.preArm, stages.preArm, completed, measurement.failingStage)
    || (completed.has(stages.arm)
      ? witness.armSentinel !== PRODUCER_ERROR_ARM_SENTINEL
      : witness.armSentinel !== null)
    || !groupProgressValid(
      witness.openTarget, stages.openTarget, completed, measurement.failingStage,
    )
    || !groupProgressValid(
      witness.publication, stages.publication, completed, measurement.failingStage,
    )
    || (completed.has(stages.answerability)
      ? witness.answerability === null : witness.answerability !== null)
    || !groupProgressValid(
      witness.closeTarget, stages.closeTarget, completed, measurement.failingStage,
    )
    || !groupProgressValid(
      witness.recoveryOpenTarget, stages.recoveryOpenTarget,
      completed, measurement.failingStage,
    )
    || !groupProgressValid(
      witness.recovery, stages.recovery, completed, measurement.failingStage,
    )) return false;
  const coldProofHealthy = producerErrorColdProofObservations(witness);
  if ((completed.has(stages.coldProof) && !coldProofHealthy)
    || (measurement.failingStage === stages.coldProof && coldProofHealthy)) return false;
  if (failingIndex < 0) return validProducerErrorWitness(witness, measurement.profile)
    && producerErrorColdProofObservations(witness);
  return true;
}

function validProducerErrorCandidateLedger(measurement, failure, browserProduct) {
  const witness = measurement.producerErrorWitness;
  if (witness === null) return true;
  const stages = producerErrorStages(measurement.profile);
  const carrierByLabel = new Map([
    [stages.preArm, witness.preArm],
    [stages.openTarget, witness.openTarget],
    [stages.publication, witness.publication],
    [stages.closeTarget, witness.closeTarget],
    [stages.recoveryOpenTarget, witness.recoveryOpenTarget],
    [stages.recovery, witness.recovery],
  ]);
  const labels = producerErrorCandidateLabels(measurement.profile);
  const mirrored = measurement.commandLedger
    .filter((command) => command.schema === CANDIDATE_COMMAND_SCHEMA
      && labels.includes(command.label));
  if (!sameJson(witness.commands, mirrored)) return false;
  const producerFailure = failure.command?.schema === CANDIDATE_COMMAND_SCHEMA
    && labels.includes(failure.command.label) ? failure.command : null;
  let priorCompletedAtMs = -Infinity;
  for (let index = 0; index < witness.commands.length; index += 1) {
    const command = witness.commands[index];
    const isReportedFailure = producerFailure !== null
      && sameJson(command, producerFailure);
    if (command.issuedAtMs < priorCompletedAtMs
      || (typeof browserProduct === 'string' && browserProduct
        && candidateCommandFailed(command, browserProduct) !== isReportedFailure)
      || (isReportedFailure && index !== witness.commands.length - 1)) return false;
    priorCompletedAtMs = commandCompletedAt(command);
  }
  if (producerFailure !== null
    && !sameJson(witness.commands.at(-1) ?? null, producerFailure)) return false;
  const actual = witness.commands.map((command) => command.label);
  const expected = [];
  for (const label of labels) {
    const failedAttempt = producerFailure?.label === label ? 1 : 0;
    const count = label === stages.answerability
      ? (witness.answerability === null ? 0 : 1) + failedAttempt
      : carrierByLabel.get(label).observationCount + failedAttempt;
    expected.push(...Array.from({ length: count }, () => label));
  }
  if (!sameJson(actual, expected)) return false;
  if (witness.answerability !== null) {
    const command = witness.commands.find((item) => item.label === stages.answerability);
    if (!command
      || witness.answerability.target.ms !== command.target.durationMs
      || witness.answerability.heartbeat.ms !== command.heartbeat.durationMs
      || witness.answerability.heartbeat.product !== command.heartbeat.product
      || witness.answerability.target.ok !== (command.target.status === 'fulfilled'
        && command.target.timely === true && command.target.resultState === 'value')
      || witness.answerability.heartbeat.ok !== (command.heartbeat.status === 'fulfilled'
        && command.heartbeat.timely === true
        && typeof command.heartbeat.product === 'string'
        && command.heartbeat.product.length > 0)) return false;
  }
  return true;
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

const THUMB_SETTLEMENT_SELECTORS = Object.freeze({
  list: '#codexpanel [data-sel="codex-entry"] img',
  planetside: '#planetside [data-sel="planetside-sp"] img',
});
const THUMB_SETTLEMENT_TOP_KEYS = Object.freeze([
  'schema', 'surface', 'expectedCount', 'receiptToken', 'ready', 'reasons',
  'ownership', 'diagnostic', 'images', 'art', 'lazyArt', 'worker', 'broker', 'page',
]);
const THUMB_SETTLEMENT_IMAGE_KEYS = Object.freeze([
  'index', 'logicalId', 'visualKeyLength', 'leasedIndex', 'cachedIndex', 'thumbState',
  'srcPresent', 'complete', 'naturalWidth', 'naturalHeight',
]);
const THUMB_SETTLEMENT_LAZY_PHASE_FIELDS = Object.freeze([
  'importStarts', 'importCompletes',
  'thumbJobStarts', 'thumbRenderCompletes', 'thumbEncodeStarts', 'thumbEncodeCompletes',
  'portraitJobStarts', 'portraitRenderCompletes',
  'portraitEncodeStarts', 'portraitEncodeCompletes',
]);
const THUMB_SETTLEMENT_LAZY_RESULT_FIELDS = Object.freeze([
  'count', 'maxImportDurationMs', 'maxRenderDurationMs', 'maxEncodeDurationMs',
]);
const THUMB_SETTLEMENT_LAZY_ERROR_FIELDS = Object.freeze([
  'capability', 'protocol', 'import', 'paint', 'encode',
]);

function nullableBoundedString(value) {
  return value === null || boundedString(value);
}

function thumbSettlementExpected(expected) {
  return isObject(expected)
    && sameJson(Object.keys(expected).sort(), [
      'documentToken', 'expectedCount', 'receiptToken', 'sessionId', 'surface', 'targetId',
    ])
    && ['list', 'planetside'].includes(expected.surface)
    && ['targetId', 'sessionId', 'documentToken']
      .every((field) => boundedString(expected[field]))
    && boundedString(expected.receiptToken, { max: 256 })
    && (expected.surface === 'planetside'
      ? expected.expectedCount === null
      : expected.expectedCount === null
        || boundedCount(expected.expectedCount, MAX_THUMB_SETTLEMENT_FILTER_COUNT));
}

function thumbSettlementObservationShapeErrors(observation) {
  const errors = [];
  if (!exactKeys(observation, THUMB_SETTLEMENT_TOP_KEYS, 'thumb settlement observation', errors)) {
    return errors;
  }
  if (!boundedString(observation.schema)) errors.push('thumb settlement schema shape');
  if (!boundedString(observation.surface, { max: 32 })) errors.push('thumb settlement surface shape');
  if (observation.expectedCount !== null
    && !boundedCount(observation.expectedCount, MAX_THUMB_SETTLEMENT_FILTER_COUNT)) {
    errors.push('thumb settlement expected count shape');
  }
  if (!boundedString(observation.receiptToken, { max: 256 })) {
    errors.push('thumb settlement receipt token shape');
  }
  if (typeof observation.ready !== 'boolean') errors.push('thumb settlement ready shape');
  if (!Array.isArray(observation.reasons)
    || observation.reasons.length > MAX_THUMB_SETTLEMENT_REASONS
    || !observation.reasons.every((reason) => boundedString(reason))
    || new Set(observation.reasons).size !== observation.reasons.length) {
    errors.push('thumb settlement reasons shape');
  }

  const ownershipKeys = [
    'selector', 'rawImageCount', 'rawLogicalIds',
    'diagnosticImageCount', 'diagnosticLogicalIds',
  ];
  if (exactKeys(observation.ownership, ownershipKeys, 'thumb settlement ownership', errors)) {
    const ownership = observation.ownership;
    if (!boundedString(ownership.selector)) errors.push('thumb settlement selector shape');
    if (!boundedCount(ownership.rawImageCount, MAX_THUMB_SETTLEMENT_FILTER_COUNT)) {
      errors.push('thumb settlement raw image count shape');
    }
    if (!boundedCount(ownership.diagnosticImageCount, MAX_THUMB_SETTLEMENT_FILTER_COUNT)) {
      errors.push('thumb settlement diagnostic image count shape');
    }
    for (const [field, values] of [
      ['raw logical ids', ownership.rawLogicalIds],
      ['diagnostic logical ids', ownership.diagnosticLogicalIds],
    ]) {
      if (!Array.isArray(values) || values.length > MAX_THUMB_SETTLEMENT_IMAGES
        || !values.every(nullableBoundedString)) errors.push(`thumb settlement ${field} shape`);
    }
  }

  const diagnosticKeys = ['panelMode', 'filteredCount', 'visible', 'thumbStates'];
  if (exactKeys(observation.diagnostic, diagnosticKeys, 'thumb settlement diagnostic', errors)) {
    const diagnostic = observation.diagnostic;
    if (!boundedString(diagnostic.panelMode, { max: 32 })) {
      errors.push('thumb settlement panel mode shape');
    }
    if (!boundedCount(diagnostic.filteredCount)) {
      errors.push('thumb settlement filtered count shape');
    }
    if (typeof diagnostic.visible !== 'boolean') {
      errors.push('thumb settlement visibility shape');
    }
    if (!Array.isArray(diagnostic.thumbStates)
      || diagnostic.thumbStates.length > MAX_THUMB_SETTLEMENT_IMAGES
      || !diagnostic.thumbStates.every((state) => boundedString(state, { max: 64 }))) {
      errors.push('thumb settlement diagnostic states shape');
    }
  }

  if (!Array.isArray(observation.images)
    || observation.images.length > MAX_THUMB_SETTLEMENT_IMAGES) {
    errors.push('thumb settlement images shape');
  } else {
    observation.images.forEach((image, index) => {
      const where = `thumb settlement image ${index}`;
      if (!exactKeys(image, THUMB_SETTLEMENT_IMAGE_KEYS, where, errors)) return;
      if (!boundedCount(image.index, MAX_THUMB_SETTLEMENT_IMAGES - 1)) {
        errors.push(`${where} index shape`);
      }
      if (!nullableBoundedString(image.logicalId)) errors.push(`${where} logical id shape`);
      for (const [field, label, max] of [
        ['visualKeyLength', 'visual key length', MAX_THUMB_SETTLEMENT_FILTER_COUNT],
        ['leasedIndex', 'leased index', MAX_THUMB_SETTLEMENT_BROKER_KEYS - 1],
        ['cachedIndex', 'cached index', MAX_THUMB_SETTLEMENT_BROKER_KEYS - 1],
      ]) {
        if (image[field] !== null && !boundedCount(image[field], max)) {
          errors.push(`${where} ${label} shape`);
        }
      }
      if (!nullableBoundedString(image.thumbState)) errors.push(`${where} thumb state shape`);
      if (typeof image.srcPresent !== 'boolean') errors.push(`${where} source shape`);
      if (typeof image.complete !== 'boolean') errors.push(`${where} completion shape`);
      if (!boundedCount(image.naturalWidth, 8192)) errors.push(`${where} width shape`);
      if (!boundedCount(image.naturalHeight, 8192)) errors.push(`${where} height shape`);
    });
  }

  const artKeys = ['available', 'schema', 'queuedJobs', 'activeJobs'];
  if (exactKeys(observation.art, artKeys, 'thumb settlement art', errors)) {
    const art = observation.art;
    if (typeof art.available !== 'boolean') errors.push('thumb settlement art availability shape');
    if (art.available === true) {
      if (!boundedString(art.schema)) errors.push('thumb settlement art schema shape');
      if (!boundedCount(art.queuedJobs)) errors.push('thumb settlement art queued shape');
      if (!boundedCount(art.activeJobs)) errors.push('thumb settlement art active shape');
    } else if (art.schema !== null || art.queuedJobs !== null || art.activeJobs !== null) {
      errors.push('thumb settlement unavailable art carried values');
    }
  }

  const lazyKeys = [
    'available', 'schema', 'state', 'importStarts', 'identity', 'lastEvent', 'lastError',
    'phases', 'results', 'errors',
  ];
  if (exactKeys(observation.lazyArt, lazyKeys, 'thumb settlement lazy art', errors)) {
    const lazyArt = observation.lazyArt;
    if (typeof lazyArt.available !== 'boolean') {
      errors.push('thumb settlement lazy art availability shape');
    }
    if (lazyArt.available === true) {
      if (!boundedString(lazyArt.schema)) errors.push('thumb settlement lazy art schema shape');
      if (!boundedString(lazyArt.state, { max: 64 })) errors.push('thumb settlement lazy art state shape');
      if (!boundedCount(lazyArt.importStarts)) errors.push('thumb settlement lazy art imports shape');
      const identityKeys = ['documentToken', 'lastProducerEpoch', 'lastWorkerInstanceId'];
      if (exactKeys(lazyArt.identity, identityKeys, 'thumb settlement lazy art identity', errors)) {
        if (!boundedString(lazyArt.identity.documentToken)) {
          errors.push('thumb settlement lazy art document shape');
        }
        for (const field of ['lastProducerEpoch', 'lastWorkerInstanceId']) {
          if (!boundedCount(lazyArt.identity[field])) {
            errors.push(`thumb settlement lazy art identity ${field} shape`);
          }
        }
      }
      if (lazyArt.lastEvent !== null) {
        const eventKeys = ['producerEpoch', 'workerInstanceId', 'jobId', 'kind', 'event'];
        if (exactKeys(lazyArt.lastEvent, eventKeys, 'thumb settlement lazy art last event', errors)) {
          for (const field of ['producerEpoch', 'workerInstanceId', 'jobId']) {
            if (!boundedCount(lazyArt.lastEvent[field])) {
              errors.push(`thumb settlement lazy art event ${field} shape`);
            }
          }
          if (!boundedString(lazyArt.lastEvent.kind, { max: 64 })) {
            errors.push('thumb settlement lazy art event kind shape');
          }
          if (!boundedString(lazyArt.lastEvent.event, { max: 64 })) {
            errors.push('thumb settlement lazy art event name shape');
          }
        }
      }
      if (lazyArt.lastError !== null) {
        const errorKeys = [
          'producerEpoch', 'workerInstanceId', 'jobId', 'kind', 'stage', 'code', 'message',
        ];
        if (exactKeys(lazyArt.lastError, errorKeys,
          'thumb settlement lazy art last error', errors)) {
          for (const field of ['producerEpoch', 'workerInstanceId']) {
            if (!integer(lazyArt.lastError[field]) || lazyArt.lastError[field] < 1) {
              errors.push(`thumb settlement lazy art last error ${field} shape`);
            }
          }
          if (lazyArt.lastError.jobId !== null
            && (!integer(lazyArt.lastError.jobId) || lazyArt.lastError.jobId < 1)) {
            errors.push('thumb settlement lazy art last error jobId shape');
          }
          if (lazyArt.lastError.kind !== null
            && !['thumb132', 'portrait440'].includes(lazyArt.lastError.kind)) {
            errors.push('thumb settlement lazy art last error kind shape');
          }
          if ((lazyArt.lastError.jobId === null)
            !== (lazyArt.lastError.kind === null)) {
            errors.push('thumb settlement lazy art last error ownership tuple shape');
          }
          if (!['capability', 'protocol', 'import', 'paint', 'encode']
            .includes(lazyArt.lastError.stage)) {
            errors.push('thumb settlement lazy art last error stage shape');
          }
          if (typeof lazyArt.lastError.code !== 'string'
            || !/^[a-z0-9-]{1,48}$/.test(lazyArt.lastError.code)) {
            errors.push('thumb settlement lazy art last error code shape');
          }
          if (!boundedString(lazyArt.lastError.message, { max: 512 })) {
            errors.push('thumb settlement lazy art last error message shape');
          }
        }
      }
      if (exactKeys(lazyArt.phases, THUMB_SETTLEMENT_LAZY_PHASE_FIELDS,
        'thumb settlement lazy art phases', errors)) {
        for (const field of THUMB_SETTLEMENT_LAZY_PHASE_FIELDS) {
          if (!boundedCount(lazyArt.phases[field])) {
            errors.push(`thumb settlement lazy art phase ${field} shape`);
          }
        }
      }
      if (exactKeys(lazyArt.results, THUMB_SETTLEMENT_LAZY_RESULT_FIELDS,
        'thumb settlement lazy art results', errors)) {
        if (!boundedCount(lazyArt.results.count)) {
          errors.push('thumb settlement lazy art result count shape');
        }
        for (const field of THUMB_SETTLEMENT_LAZY_RESULT_FIELDS.slice(1)) {
          if (!nonnegative(lazyArt.results[field]) || lazyArt.results[field] > 1_000_000_000) {
            errors.push(`thumb settlement lazy art result ${field} shape`);
          }
        }
      }
      if (exactKeys(lazyArt.errors, THUMB_SETTLEMENT_LAZY_ERROR_FIELDS,
        'thumb settlement lazy art errors', errors)) {
        for (const field of THUMB_SETTLEMENT_LAZY_ERROR_FIELDS) {
          if (!boundedCount(lazyArt.errors[field])) {
            errors.push(`thumb settlement lazy art error ${field} shape`);
          }
        }
      }
    } else if (lazyKeys.slice(1).some((field) => lazyArt[field] !== null)) {
      errors.push('thumb settlement unavailable lazy art carried values');
    }
  }

  const workerKeys = [
    'available', 'live', 'starts', 'ready', 'disposals', 'fatals', 'protocolErrors',
  ];
  if (exactKeys(observation.worker, workerKeys, 'thumb settlement worker', errors)) {
    const worker = observation.worker;
    if (typeof worker.available !== 'boolean') {
      errors.push('thumb settlement worker availability shape');
    }
    if (worker.available === true) {
      if (typeof worker.live !== 'boolean') errors.push('thumb settlement worker live shape');
      for (const field of ['starts', 'ready', 'disposals', 'fatals', 'protocolErrors']) {
        if (!boundedCount(worker[field])) errors.push(`thumb settlement worker ${field} shape`);
      }
    } else if (['live', 'starts', 'ready', 'disposals', 'fatals', 'protocolErrors']
      .some((field) => worker[field] !== null)) {
      errors.push('thumb settlement unavailable worker carried values');
    }
  }

  const brokerKeys = [
    'available', 'cacheEntries', 'leases', 'subscribers', 'queuedJobs', 'activeJobs',
    'leasedKeyCount', 'cachedKeyCount',
    'leasedDistinctKeyCount', 'cachedDistinctKeyCount',
  ];
  if (exactKeys(observation.broker, brokerKeys, 'thumb settlement broker', errors)) {
    const broker = observation.broker;
    if (typeof broker.available !== 'boolean') {
      errors.push('thumb settlement broker availability shape');
    }
    if (broker.available === true) {
      for (const field of [
        'cacheEntries', 'leases', 'subscribers', 'queuedJobs', 'activeJobs',
      ]) {
        if (!boundedCount(broker[field])) errors.push(`thumb settlement broker ${field} shape`);
      }
      for (const field of [
        'leasedKeyCount', 'cachedKeyCount',
        'leasedDistinctKeyCount', 'cachedDistinctKeyCount',
      ]) {
        if (!boundedCount(broker[field], MAX_THUMB_SETTLEMENT_BROKER_KEYS)) {
          errors.push(`thumb settlement broker ${field} shape`);
        }
      }
    } else if ([
      'cacheEntries', 'leases', 'subscribers', 'queuedJobs', 'activeJobs',
      'leasedKeyCount', 'cachedKeyCount',
      'leasedDistinctKeyCount', 'cachedDistinctKeyCount',
    ]
      .some((field) => broker[field] !== null)) {
      errors.push('thumb settlement unavailable broker carried values');
    }
  }

  const pageKeys = [
    'targetId', 'sessionId', 'documentToken', 'visibilityState', 'hidden', 'focused',
  ];
  if (exactKeys(observation.page, pageKeys, 'thumb settlement page', errors)) {
    const page = observation.page;
    if (!boundedString(page.targetId)) errors.push('thumb settlement target identity shape');
    if (!boundedString(page.sessionId)) errors.push('thumb settlement session identity shape');
    if (!boundedString(page.documentToken)) errors.push('thumb settlement document identity shape');
    if (!boundedString(page.visibilityState, { max: 32 })) {
      errors.push('thumb settlement page visibility shape');
    }
    if (typeof page.hidden !== 'boolean') errors.push('thumb settlement page hidden shape');
    if (typeof page.focused !== 'boolean') errors.push('thumb settlement page focus shape');
  }
  return errors;
}

function sealedThumbSettlementDecision(status, reasons) {
  const boundedReasons = reasons.length <= MAX_THUMB_SETTLEMENT_REASONS
    ? reasons
    : [`thumb settlement reason cardinality ${reasons.length}/${MAX_THUMB_SETTLEMENT_REASONS}`];
  return Object.freeze({ status, reasons: Object.freeze(boundedReasons) });
}

/* Recompute settlement solely from the structured browser observation. The
   carrier retains every bounded miss instead of collapsing a 30-second phase
   to `null`, while `validCompendiumThumbSettlementObservation` prevents a
   copied `ready` flag or copied reason list from laundering changed facts. */
export function classifyCompendiumThumbSettlement(observation, expected) {
  if (!thumbSettlementExpected(expected)) {
    throw new TypeError('thumb settlement requires exact page authority and sealed surface/count semantics');
  }
  const shapeErrors = thumbSettlementObservationShapeErrors(observation);
  if (shapeErrors.length) return sealedThumbSettlementDecision('error', shapeErrors);

  const errors = [];
  const productErrors = [];
  const pending = [];
  if (observation.schema !== THUMB_SETTLEMENT_OBSERVATION_SCHEMA) {
    errors.push(`observation schema ${JSON.stringify(observation.schema)}`);
  }
  if (observation.surface !== expected.surface) {
    errors.push(`surface identity ${JSON.stringify(observation.surface)}`);
  }
  if (observation.expectedCount !== expected.expectedCount) {
    errors.push(`expected count identity ${JSON.stringify(observation.expectedCount)}`);
  }
  if (observation.receiptToken !== expected.receiptToken) {
    errors.push(`receipt token identity ${JSON.stringify(observation.receiptToken)}`);
  }
  const selector = THUMB_SETTLEMENT_SELECTORS[expected.surface];
  if (observation.ownership.selector !== selector) {
    errors.push(`raw selector ownership ${JSON.stringify(observation.ownership.selector)}`);
  }
  for (const [field, label] of [
    ['targetId', 'target identity'],
    ['sessionId', 'session identity'],
    ['documentToken', 'document identity'],
  ]) {
    if (observation.page[field] !== expected[field]) {
      errors.push(`${label} ${JSON.stringify(observation.page[field])}`);
    }
  }
  if (observation.page.visibilityState !== 'visible' || observation.page.hidden !== false) {
    errors.push(`page visibility ${JSON.stringify(observation.page.visibilityState)}/${JSON.stringify(observation.page.hidden)}`);
  }
  if (observation.page.focused !== true) errors.push('page unfocused');

  if (expected.surface === 'list') {
    if (observation.diagnostic.panelMode !== 'list') {
      pending.push(`list panel mode ${JSON.stringify(observation.diagnostic.panelMode)}`);
    }
    if (expected.expectedCount !== null
      && observation.diagnostic.filteredCount !== expected.expectedCount) {
      pending.push(`list filtered count ${observation.diagnostic.filteredCount}/${expected.expectedCount}`);
    }
  } else if (observation.diagnostic.visible !== true) {
    pending.push('Planetside surface hidden');
  }

  const images = observation.images;
  const rawLogicalIds = images.map((image) => image.logicalId);
  const visualKeyLengths = images.map((image) => image.visualKeyLength);
  const leasedIndices = images.map((image) => image.leasedIndex);
  const cachedIndices = images.map((image) => image.cachedIndex);
  const thumbStates = images.map((image) => image.thumbState);
  if (images.length < 1 || images.length > MAX_THUMB_SETTLEMENT_IMAGES) {
    pending.push(`raw image array count ${images.length}/1..${MAX_THUMB_SETTLEMENT_IMAGES}`);
  }
  if (observation.ownership.rawImageCount !== images.length) {
    pending.push(`raw image count ${observation.ownership.rawImageCount}/${images.length}`);
  }
  if (observation.ownership.diagnosticImageCount !== images.length) {
    pending.push(`diagnostic image count ${observation.ownership.diagnosticImageCount}/${images.length}`);
  }
  if (!sameJson(observation.ownership.rawLogicalIds, rawLogicalIds)) {
    pending.push('raw logical-id ownership mismatch');
  }
  if (!sameJson(observation.ownership.diagnosticLogicalIds, rawLogicalIds)) {
    pending.push('diagnostic logical-id ownership mismatch');
  }
  if (!sameJson(observation.diagnostic.thumbStates, thumbStates)) {
    pending.push('diagnostic thumb-state ownership mismatch');
  }
  if (new Set(rawLogicalIds).size !== images.length || rawLogicalIds.some((id) => !id)) {
    pending.push('raw logical ids absent or non-distinct');
  }
  if (visualKeyLengths.some((length) => !Number.isSafeInteger(length) || length <= 0)) {
    pending.push('raw visual keys absent');
  }
  const allLeasedIndicesPresent = leasedIndices.every((index) =>
    observation.broker.available === true
    && Number.isSafeInteger(index) && index >= 0
    && index < observation.broker.leasedKeyCount);
  if (!allLeasedIndicesPresent) {
    pending.push('raw visual keys absent from broker lease inventory');
  } else if (new Set(leasedIndices).size !== images.length) {
    pending.push('raw visual keys non-distinct in broker lease inventory');
  }
  const allCachedIndicesPresent = cachedIndices.every((index) =>
    observation.broker.available === true
    && Number.isSafeInteger(index) && index >= 0
    && index < observation.broker.cachedKeyCount);
  if (!allCachedIndicesPresent) {
    pending.push('raw visual keys absent from broker cache inventory');
  } else if (new Set(cachedIndices).size !== images.length) {
    pending.push('raw visual keys non-distinct in broker cache inventory');
  }
  images.forEach((image, index) => {
    if (image.index !== index) pending.push(`image ${index} index ${image.index}`);
    if (image.thumbState === 'error') {
      productErrors.push(`image ${index} thumb state "error"`);
    } else if (image.thumbState !== 'ready') {
      pending.push(`image ${index} thumb state ${JSON.stringify(image.thumbState)}`);
    }
    if (image.srcPresent !== true) pending.push(`image ${index} source absent`);
    if (image.complete !== true) pending.push(`image ${index} decode incomplete`);
    if (image.naturalWidth !== 132 || image.naturalHeight !== 132) {
      pending.push(`image ${index} dimensions ${image.naturalWidth}x${image.naturalHeight}`);
    }
  });

  if (observation.art.available !== true) pending.push('art diagnostics unavailable');
  else {
    if (observation.art.schema !== ART_DIAGNOSTICS_SCHEMA) {
      pending.push(`art schema ${JSON.stringify(observation.art.schema)}`);
    }
    if (observation.art.queuedJobs !== 0) {
      pending.push(`art queued jobs ${observation.art.queuedJobs}`);
    }
    if (observation.art.activeJobs !== 0) {
      pending.push(`art active jobs ${observation.art.activeJobs}`);
    }
  }
  if (observation.lazyArt.available !== true) pending.push('lazy-art diagnostics unavailable');
  else {
    if (observation.lazyArt.schema !== WORKER_ART_DIAGNOSTICS_SCHEMA) {
      errors.push(`lazy-art schema ${JSON.stringify(observation.lazyArt.schema)}`);
    }
    if (observation.lazyArt.state === 'error') {
      productErrors.push('lazy-art state "error"');
    } else if (observation.lazyArt.state !== 'ready') {
      pending.push(`lazy-art state ${JSON.stringify(observation.lazyArt.state)}`);
    }
    if (observation.lazyArt.identity.documentToken !== observation.page.documentToken) {
      errors.push('lazy-art document identity');
    }
    const phases = observation.lazyArt.phases;
    const results = observation.lazyArt.results;
    const lazyErrors = observation.lazyArt.errors;
    if (observation.lazyArt.importStarts !== phases.importStarts) {
      pending.push('lazy-art import-start summary mismatch');
    }
    if (phases.importCompletes > phases.importStarts
      || phases.thumbRenderCompletes > phases.thumbJobStarts
      || phases.thumbEncodeStarts > phases.thumbRenderCompletes
      || phases.thumbEncodeCompletes > phases.thumbEncodeStarts
      || phases.portraitRenderCompletes > phases.portraitJobStarts
      || phases.portraitEncodeStarts > phases.portraitRenderCompletes
      || phases.portraitEncodeCompletes > phases.portraitEncodeStarts) {
      pending.push('lazy-art phase counters are causally inconsistent');
    }
    if (results.count !== phases.thumbEncodeCompletes + phases.portraitEncodeCompletes) {
      pending.push('lazy-art result count does not match encoded completions');
    }
    if (observation.lazyArt.lastEvent !== null
      && (observation.lazyArt.lastEvent.producerEpoch
          !== observation.lazyArt.identity.lastProducerEpoch
        || observation.lazyArt.lastEvent.workerInstanceId
          !== observation.lazyArt.identity.lastWorkerInstanceId)) {
      errors.push('lazy-art last-event producer identity');
    }
    const currentProductError = productErrors.length > 0;
    const lastError = observation.lazyArt.lastError;
    if (currentProductError && lastError === null) {
      errors.push('terminal thumbnail state omitted last-error evidence');
    } else if (currentProductError
      && (lastError.producerEpoch !== observation.lazyArt.identity.lastProducerEpoch
        || lastError.workerInstanceId
          !== observation.lazyArt.identity.lastWorkerInstanceId)) {
      errors.push('terminal lazy-art last-error producer identity');
    } else if (currentProductError && lazyErrors[lastError.stage] < 1) {
      errors.push('terminal lazy-art last-error counter');
    }
    const lastErrorWitness = lastError === null ? 'null'
      : `${lastError.producerEpoch},${lastError.workerInstanceId},${lastError.jobId},${lastError.kind},${lastError.stage},${lastError.code},message=${lastError.message.length},${sha256(lastError.message)}`;
    pending.push(`lazy-art witness epoch=${observation.lazyArt.identity.lastProducerEpoch};worker=${observation.lazyArt.identity.lastWorkerInstanceId};phases=${THUMB_SETTLEMENT_LAZY_PHASE_FIELDS.map((field) => phases[field]).join(',')};results=${THUMB_SETTLEMENT_LAZY_RESULT_FIELDS.map((field) => results[field]).join(',')};errors=${THUMB_SETTLEMENT_LAZY_ERROR_FIELDS.map((field) => lazyErrors[field]).join(',')};last=${observation.lazyArt.lastEvent === null ? 'null' : `${observation.lazyArt.lastEvent.producerEpoch},${observation.lazyArt.lastEvent.workerInstanceId},${observation.lazyArt.lastEvent.jobId},${observation.lazyArt.lastEvent.kind},${observation.lazyArt.lastEvent.event}`};lastError=${lastErrorWitness}`);
  }
  if (observation.worker.available !== observation.lazyArt.available) {
    pending.push('worker/lazy-art availability mismatch');
  }
  if (productErrors.length > 0
    && (observation.broker.available !== true
      || observation.art.available !== true
      || observation.art.schema !== ART_DIAGNOSTICS_SCHEMA
      || observation.lazyArt.available !== true
      || observation.lazyArt.schema !== WORKER_ART_DIAGNOSTICS_SCHEMA
      || observation.worker.available !== true)) {
    errors.push('terminal thumbnail state lacks complete producer diagnostics');
  }
  if (observation.broker.available !== observation.art.available) {
    pending.push('broker/art availability mismatch');
  }
  if (observation.broker.available === true && observation.art.available === true) {
    if (observation.broker.leasedKeyCount !== observation.broker.leases) {
      pending.push(`broker leased key count ${observation.broker.leasedKeyCount}/${observation.broker.leases}`);
    }
    if (observation.broker.cachedKeyCount !== observation.broker.cacheEntries) {
      pending.push(`broker cached key count ${observation.broker.cachedKeyCount}/${observation.broker.cacheEntries}`);
    }
    if (observation.broker.leasedDistinctKeyCount !== observation.broker.leasedKeyCount) {
      pending.push(`broker leased keys non-distinct ${observation.broker.leasedDistinctKeyCount}/${observation.broker.leasedKeyCount}`);
    }
    if (observation.broker.cachedDistinctKeyCount !== observation.broker.cachedKeyCount) {
      pending.push(`broker cached keys non-distinct ${observation.broker.cachedDistinctKeyCount}/${observation.broker.cachedKeyCount}`);
    }
    if (observation.broker.queuedJobs !== observation.art.queuedJobs) {
      pending.push('broker/art queued-job mismatch');
    }
    if (observation.broker.activeJobs !== observation.art.activeJobs) {
      pending.push('broker/art active-job mismatch');
    }
  }
  const lazyWitnessIndex = pending.findIndex((reason) => reason.startsWith('lazy-art witness '));
  const lazyWitness = lazyWitnessIndex < 0 ? [] : pending.splice(lazyWitnessIndex, 1);
  if (errors.length) {
    return sealedThumbSettlementDecision(
      'error', [...errors, ...productErrors, ...pending, ...lazyWitness],
    );
  }
  if (productErrors.length) {
    return sealedThumbSettlementDecision(
      'product-error', [...productErrors, ...pending, ...lazyWitness],
    );
  }
  if (pending.length) {
    return sealedThumbSettlementDecision('pending', [...pending, ...lazyWitness]);
  }
  return sealedThumbSettlementDecision('ready', lazyWitness);
}

export function validCompendiumThumbSettlementObservation(observation, expected) {
  if (!thumbSettlementExpected(expected)
    || thumbSettlementObservationShapeErrors(observation).length) return false;
  const decision = classifyCompendiumThumbSettlement(observation, expected);
  return observation.ready === (decision.status === 'ready')
    && sameJson(observation.reasons, decision.reasons);
}

function thumbSettlementPlanIndex(label) {
  return THUMB_SETTLEMENT_RECEIPT_PLAN.findIndex((entry) => entry.label === label);
}

export function compendiumThumbSettlementReceiptToken(profile, label, attempt) {
  const planIndex = thumbSettlementPlanIndex(label);
  if (!PROFILES.includes(profile) || planIndex < 0
    || !integer(attempt) || attempt < 1 || attempt > 50) {
    throw new TypeError('thumbnail settlement receipt token authority is invalid');
  }
  return `${profile}-compendium-thumb-${label}-${attempt}`;
}

export function compendiumThumbSettlementProductErrorDiagnosis(profile, label) {
  if (!PROFILES.includes(profile) || thumbSettlementPlanIndex(label) < 0) {
    throw new TypeError('thumbnail settlement product-error authority is invalid');
  }
  return `${profile} ${label}: thumbnail producer reached a terminal error`;
}

function exactThumbSettlementPageAuthority(authority) {
  const keys = ['targetId', 'sessionId', 'documentToken'];
  return isObject(authority)
    && sameJson(Object.keys(authority).sort(), [...keys].sort())
    && keys.every((field) => boundedString(authority[field]));
}

function exactThumbSettlementPlanEntry(entry, planIndex) {
  const sealed = THUMB_SETTLEMENT_RECEIPT_PLAN[planIndex];
  return integer(planIndex) && planIndex >= 0 && sealed !== undefined
    && isObject(entry)
    && sameJson(Object.keys(entry).sort(), ['expectedCount', 'label', 'surface'])
    && sameJson(entry, sealed);
}

/* One accepted phase is retained with the exact successful dual-command turn,
   not merely the final browser value. The phase-level 30s ruler is distinct
   from each command's remaining capped transport ruler. */
export function validCompendiumThumbSettlementReceipt(receipt, {
  profile, pageAuthority, browserProduct, planIndex,
} = {}) {
  const receiptKeys = [
    'schema', 'label', 'attempt', 'expected', 'observation', 'command', 'timing',
  ];
  const timingKeys = ['issuedAtMs', 'deadlineMs', 'receivedAtMs', 'timeoutMs'];
  const planEntry = THUMB_SETTLEMENT_RECEIPT_PLAN[planIndex];
  if (!PROFILES.includes(profile) || !exactThumbSettlementPageAuthority(pageAuthority)
    || !boundedString(browserProduct) || !exactThumbSettlementPlanEntry(planEntry, planIndex)
    || !isObject(receipt) || !sameJson(Object.keys(receipt).sort(), receiptKeys.sort())
    || receipt.schema !== THUMB_SETTLEMENT_RECEIPT_SCHEMA
    || receipt.label !== planEntry.label
    || !integer(receipt.attempt) || receipt.attempt < 1 || receipt.attempt > 50
    || !thumbSettlementExpected(receipt.expected)
    || receipt.expected.surface !== planEntry.surface
    || receipt.expected.expectedCount !== planEntry.expectedCount
    || ['targetId', 'sessionId', 'documentToken']
      .some((field) => receipt.expected[field] !== pageAuthority[field])
    || receipt.expected.receiptToken !== compendiumThumbSettlementReceiptToken(
      profile, planEntry.label, receipt.attempt,
    )
    || !validCompendiumThumbSettlementObservation(receipt.observation, receipt.expected)
    || receipt.observation.ready !== true
    || classifyCompendiumThumbSettlement(receipt.observation, receipt.expected).status !== 'ready'
    || !validCandidateCommandEvidence(receipt.command)
    || receipt.command.profile !== profile
    || receipt.command.label !== `${planEntry.label} thumb settlement`
    || receipt.command.target.status !== 'fulfilled'
    || receipt.command.target.timely !== true
    || receipt.command.target.resultState !== 'value'
    || receipt.command.heartbeat.status !== 'fulfilled'
    || receipt.command.heartbeat.timely !== true
    || receipt.command.heartbeat.product !== browserProduct
    || !isObject(receipt.timing)
    || !sameJson(Object.keys(receipt.timing).sort(), timingKeys.sort())
    || !finite(receipt.timing.issuedAtMs) || receipt.timing.issuedAtMs < 0
    || !finite(receipt.timing.deadlineMs) || receipt.timing.deadlineMs < 0
    || !finite(receipt.timing.receivedAtMs) || receipt.timing.receivedAtMs < 0
    || receipt.timing.timeoutMs !== THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS
    || receipt.timing.deadlineMs
      !== receipt.timing.issuedAtMs + receipt.timing.timeoutMs
    || receipt.timing.issuedAtMs > receipt.command.issuedAtMs
    || receipt.command.phaseDeadlineMs !== receipt.timing.deadlineMs
    || receipt.timing.receivedAtMs !== Math.max(
      receipt.command.target.completedAtMs, receipt.command.heartbeat.completedAtMs,
    )
    || receipt.timing.receivedAtMs >= receipt.timing.deadlineMs) return false;
  return true;
}

const FOREGROUND_PHASE_KEYS = Object.freeze([
  'observed', 'sequence', 'visibilityState', 'hidden', 'focused',
]);

function foregroundAuthorityExpected(expected) {
  return isObject(expected)
    && sameJson(Object.keys(expected).sort(), [
      'documentToken', 'serviceToken', 'sessionId', 'targetId',
    ])
    && ['targetId', 'sessionId', 'documentToken', 'serviceToken']
      .every((field) => boundedString(expected[field]));
}

function foregroundPhaseShape(phase) {
  if (!isObject(phase)
    || !sameJson(Object.keys(phase).sort(), [...FOREGROUND_PHASE_KEYS].sort())
    || typeof phase.observed !== 'boolean') return false;
  if (phase.observed === false) {
    return phase.sequence === null && phase.visibilityState === null
      && phase.hidden === null && phase.focused === null;
  }
  return boundedCount(phase.sequence, 2)
    && boundedString(phase.visibilityState, { max: 32 })
    && typeof phase.hidden === 'boolean' && typeof phase.focused === 'boolean';
}

export function validCompendiumForegroundServiceObservation(observation) {
  const topKeys = [
    'schema', 'targetId', 'sessionId', 'documentToken',
    'visibilityState', 'hidden', 'focused', 'service',
  ];
  const serviceKeys = [
    'token', 'visibilityChanges', 'focusLosses', 'arm', 'raf', 'laterTask',
  ];
  return isObject(observation) && sameJson(Object.keys(observation).sort(), topKeys.sort())
    && observation.schema === FOREGROUND_SERVICE_OBSERVATION_SCHEMA
    && ['targetId', 'sessionId', 'documentToken'].every((field) => boundedString(observation[field]))
    && boundedString(observation.visibilityState, { max: 32 })
    && typeof observation.hidden === 'boolean' && typeof observation.focused === 'boolean'
    && isObject(observation.service)
    && sameJson(Object.keys(observation.service).sort(), serviceKeys.sort())
    && boundedString(observation.service.token)
    && boundedCount(observation.service.visibilityChanges)
    && boundedCount(observation.service.focusLosses)
    && foregroundPhaseShape(observation.service.arm)
    && foregroundPhaseShape(observation.service.raf)
    && foregroundPhaseShape(observation.service.laterTask);
}

/* Runtime.evaluate responsiveness is not a rendering opportunity. This
   classifier binds the observed service turn to the exact attach-derived
   target/session/document and requires one visible, focused arm -> rAF ->
   later-task sequence with no intervening visibility or focus loss. */
export function classifyCompendiumForegroundServiceTurn(observation, expected) {
  if (!foregroundAuthorityExpected(expected)) {
    throw new TypeError('foreground service authority requires exact target, session, document, and service tokens');
  }
  if (!validCompendiumForegroundServiceObservation(observation)) {
    return Object.freeze({ status: 'error', reasons: Object.freeze(['foreground observation shape']) });
  }
  const errors = [];
  const pending = [];
  for (const [field, expectedField, label] of [
    ['targetId', 'targetId', 'target identity'],
    ['sessionId', 'sessionId', 'session identity'],
    ['documentToken', 'documentToken', 'document identity'],
  ]) {
    if (observation[field] !== expected[expectedField]) {
      errors.push(`${label} ${JSON.stringify(observation[field])}`);
    }
  }
  if (observation.visibilityState !== 'visible' || observation.hidden !== false) {
    errors.push(`page visibility ${JSON.stringify(observation.visibilityState)}/${JSON.stringify(observation.hidden)}`);
  }
  if (observation.focused !== true) errors.push('page unfocused');
  const service = observation.service;
  if (service.token !== expected.serviceToken) {
    errors.push(`service identity ${JSON.stringify(service.token)}`);
  }
  if (service.visibilityChanges !== 0) {
    errors.push(`visibility changed ${service.visibilityChanges} time(s)`);
  }
  if (service.focusLosses !== 0) errors.push(`focus lost ${service.focusLosses} time(s)`);

  for (const [name, phase, sequence] of [
    ['arm', service.arm, 0], ['rendering opportunity', service.raf, 1],
    ['later task', service.laterTask, 2],
  ]) {
    if (phase.observed !== true) {
      pending.push(`${name} pending`);
      continue;
    }
    if (phase.sequence !== sequence) {
      errors.push(`${name} sequence ${JSON.stringify(phase.sequence)}/${sequence}`);
    }
    if (phase.visibilityState !== 'visible' || phase.hidden !== false) {
      errors.push(`${name} visibility ${JSON.stringify(phase.visibilityState)}/${JSON.stringify(phase.hidden)}`);
    }
    if (phase.focused !== true) errors.push(`${name} unfocused`);
  }
  if (service.arm.observed !== true) errors.push('service arm absent');
  if (service.laterTask.observed === true && service.raf.observed !== true) {
    errors.push('service phase order');
  }
  if (errors.length) {
    return Object.freeze({ status: 'error', reasons: Object.freeze([...errors, ...pending]) });
  }
  if (pending.length) {
    return Object.freeze({ status: 'pending', reasons: Object.freeze(pending) });
  }
  return Object.freeze({ status: 'ready', reasons: Object.freeze([]) });
}

export function classifyCompendiumForegroundServiceTurnReceipt(
  observation, expected, deadlineMs, receivedAtMs,
) {
  if (!finite(deadlineMs) || !finite(receivedAtMs)
    || deadlineMs < 0 || receivedAtMs < 0) {
    throw new TypeError('foreground service receipt requires nonnegative finite monotonic times');
  }
  const decision = classifyCompendiumForegroundServiceTurn(observation, expected);
  if (receivedAtMs < deadlineMs) return decision;
  return Object.freeze({
    status: 'error',
    reasons: Object.freeze([
      `foreground observation received at/after deadline (${receivedAtMs} >= ${deadlineMs})`,
      ...decision.reasons,
    ]),
  });
}

export function validCompendiumForegroundServiceReceipt(receipt, expectedLabel = null) {
  const receiptKeys = [
    'schema', 'label', 'expected', 'observation', 'timing', 'cleanup',
  ];
  const timingKeys = ['issuedAtMs', 'deadlineMs', 'receivedAtMs', 'timeoutMs'];
  const cleanupKeys = ['cleanupPresent', 'servicePresent'];
  if (expectedLabel !== null && !FOREGROUND_SERVICE_RECEIPT_LABELS.includes(expectedLabel)) {
    throw new TypeError('foreground service receipt label authority is invalid');
  }
  if (!isObject(receipt)
    || !sameJson(Object.keys(receipt).sort(), receiptKeys.sort())
    || receipt.schema !== FOREGROUND_SERVICE_RECEIPT_SCHEMA
    || !FOREGROUND_SERVICE_RECEIPT_LABELS.includes(receipt.label)
    || (expectedLabel !== null && receipt.label !== expectedLabel)
    || !foregroundAuthorityExpected(receipt.expected)
    || !validCompendiumForegroundServiceObservation(receipt.observation)
    || !isObject(receipt.timing)
    || !sameJson(Object.keys(receipt.timing).sort(), timingKeys.sort())
    || !finite(receipt.timing.issuedAtMs) || receipt.timing.issuedAtMs < 0
    || !finite(receipt.timing.deadlineMs) || receipt.timing.deadlineMs < 0
    || !finite(receipt.timing.receivedAtMs) || receipt.timing.receivedAtMs < 0
    || receipt.timing.timeoutMs !== FOREGROUND_SERVICE_RECEIPT_TIMEOUT_MS
    || receipt.timing.issuedAtMs > receipt.timing.receivedAtMs
    || receipt.timing.deadlineMs
      !== receipt.timing.issuedAtMs + receipt.timing.timeoutMs
    || !isObject(receipt.cleanup)
    || !sameJson(Object.keys(receipt.cleanup).sort(), cleanupKeys.sort())
    || receipt.cleanup.cleanupPresent !== false
    || receipt.cleanup.servicePresent !== false) return false;
  return classifyCompendiumForegroundServiceTurnReceipt(
    receipt.observation, receipt.expected,
    receipt.timing.deadlineMs, receipt.timing.receivedAtMs,
  ).status === 'ready';
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
    && ['product-unanswerable', 'product-fail', 'instrument'].includes(error.classification);
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
    expectedPreOwnerExact132Completions: null,
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

/* Serialized into the broken-baseline document only after every visible
   Planetside owner has produced its exact 132px scratch completion and that
   producer has been quiet for one second. The capture listener seals the
   pre-owner count on the actual Compendium opener click, before the app's
   click handler can enqueue any list work. The retained expected owner count
   makes any completion after the arm turn the final evidence red. */
export function installBrokenBaselineInitialListArm(
  globalObject, ElementConstructor, clock, schema, selector,
  expectedPreOwnerExact132Completions,
) {
  const key = '__CF_COMPENDIUM_BASELINE_THUMBS__';
  const state = globalObject?.[key];
  const now = clock?.now?.();
  if (!state || state.schema !== schema || state.phase !== 'pre-owner'
    || state.descriptorPreserved !== true || state.observerErrors !== 0
    || !Number.isFinite(now) || !Number.isFinite(state.lastCompletionAt)
    || !Number.isSafeInteger(expectedPreOwnerExact132Completions)
    || expectedPreOwnerExact132Completions <= 0
    || typeof ElementConstructor !== 'function'
    || typeof selector !== 'string' || !selector
    || typeof globalObject.addEventListener !== 'function'
    || typeof globalObject.removeEventListener !== 'function') {
    throw new Error('broken-baseline initial-list arm target is invalid');
  }
  if (state.totalExact132Completions < expectedPreOwnerExact132Completions) return null;
  if (state.totalExact132Completions > expectedPreOwnerExact132Completions) {
    throw new Error('broken-baseline pre-owner completion count exceeded its visible owner count');
  }
  const quietMs = now - state.lastCompletionAt;
  if (quietMs < 1000) return null;
  const stableTotal = state.totalExact132Completions;
  const onClick = (event) => {
    const target = event?.target;
    if (!(target instanceof ElementConstructor) || target.closest(selector) === null) return;
    state.preOwnerExact132Completions = state.totalExact132Completions;
    state.initialListCompletions = 0;
    state.initialListCacheEncodedByteLengths.length = 0;
    state.phase = 'initial-list';
    state.lastCompletionAt = clock.now();
    globalObject.removeEventListener('click', onClick, true);
  };
  state.expectedPreOwnerExact132Completions = expectedPreOwnerExact132Completions;
  state.phase = 'awaiting-initial-list-click';
  globalObject.addEventListener('click', onClick, true);
  return Object.freeze({
    phase: state.phase, stableTotal,
    expectedPreOwnerExact132Completions, quietMs,
  });
}

/* The terminal list count is sealed in the same document turn that first
   proves its quiet interval. Keeping the read and phase transition together
   prevents one late completion from landing between two CDP commands. */
export function sealBrokenBaselineInitialListObservation(
  globalObject, clock, schema, cacheCap, requiredCompletions,
) {
  const state = globalObject?.__CF_COMPENDIUM_BASELINE_THUMBS__;
  const now = clock?.now?.();
  if (!state || state.schema !== schema || state.phase !== 'initial-list'
    || !Number.isSafeInteger(cacheCap) || cacheCap <= 0
    || !Number.isSafeInteger(requiredCompletions) || requiredCompletions <= 0
    || !Number.isFinite(now) || !Number.isFinite(state.lastCompletionAt)) {
    throw new Error('broken-baseline initial-list seal target is invalid');
  }
  const quietMs = now - state.lastCompletionAt;
  if (state.initialListCompletions < requiredCompletions || quietMs < 1000) return null;
  state.initialListStableQuietMs = quietMs;
  state.phase = 'post-initial-list';
  return Object.freeze({
    expectedPreOwnerExact132Completions: state.expectedPreOwnerExact132Completions,
    preOwnerExact132Completions: state.preOwnerExact132Completions,
    initialListCompletions: state.initialListCompletions,
    cacheEntries: state.initialListCacheEncodedByteLengths.length,
    cacheEncodedBytes: state.initialListCacheEncodedByteLengths.reduce(
      (sum, value) => sum + value, 0,
    ),
    totalExact132Completions: state.totalExact132Completions,
    observerErrors: state.observerErrors,
    descriptorPreserved: state.descriptorPreserved,
    quietMs: state.initialListStableQuietMs,
    cacheCap,
  });
}

export function validBrokenBaselineThumbObservation(observation) {
  return integer(observation?.expectedPreOwnerExact132Completions)
    && observation.expectedPreOwnerExact132Completions > 0
    && integer(observation?.preOwnerExact132Completions)
    && observation.preOwnerExact132Completions >= 0
    && observation.preOwnerExact132Completions
      === observation.expectedPreOwnerExact132Completions
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
      expectedPreOwnerExact132Completions:
        list?.thumbObserverExpectedPreOwnerExact132Completions,
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
  'embedderHeapUsedBytesMax', 'backingStorageBytesMax', 'heapAggregateBytesMax',
  'jsEventListenersMax', 'liveCacheEntriesMax', 'liveDecodedPixelsMax',
  'liveDecodedBytesMax', 'liveEncodedBytesMax', 'queuedJobsPeakMax',
  'activeJobsPeakMax', 'liveLeasesMax', 'liveSubscribersMax',
  'livePortraitCacheEntriesMax', 'livePortraitEncodedBytesMax',
  'warmHeapAggregateRangeBytesMax',
  'warmEncodedBytesRangeMax',
]);
export const SAMPLE_METRIC_FIELDS = Object.freeze([
  'mountedRows', 'heapUsedBytes', 'documents', 'nodes',
  'embedderHeapUsedBytes', 'backingStorageBytes', 'heapAggregateBytes',
  'jsEventListeners',
  'liveCacheEntries', 'liveDecodedPixels', 'liveDecodedBytes', 'liveEncodedBytes',
  'queuedJobsPeak', 'activeJobsPeak', 'liveLeases', 'liveSubscribers',
  'livePortraitCacheEntries', 'livePortraitEncodedBytes',
  'warmHeapAggregateRangeBytes', 'warmEncodedBytesRange',
]);
export const CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA =
  'cf-v2-compendium-candidate-calibration-evidence/v1';
export const BASELINE_CALIBRATION_EVIDENCE_SCHEMA =
  'cf-v2-compendium-broken-baseline-calibration-evidence/v1';
const CANDIDATE_CALIBRATION_POINT_KEYS = Object.freeze([
  'first', 'middle', 'last', 'filtered', 'detail', 'detailClosed', 'back',
  'focusPinned', 'closed', 'planetside', 'warmCachePrecondition', 'postCapRestored',
  'resizeBase', 'resizeContracted', 'resizeExpanded', 'resizeRestored',
]);

function candidateCalibrationTuple(snapshot) {
  const a = art(snapshot);
  return [
    snapshot?.raw?.mountedRowCount,
    snapshot?.heap?.usedSize,
    snapshot?.heap?.embedderHeapUsedSize,
    snapshot?.heap?.backingStorageSize,
    snapshot?.dom?.documents,
    snapshot?.dom?.nodes,
    snapshot?.dom?.jsEventListeners,
    a?.live?.cacheEntries,
    a?.live?.decodedPixels,
    a?.live?.decodedBytes,
    a?.live?.encodedBytes,
    a?.live?.leases,
    a?.live?.subscribers,
    a?.live?.portraitCacheEntries,
    a?.live?.portraitEncodedBytes,
  ];
}

function baselineCalibrationTuple(snapshot) {
  return [
    snapshot?.raw?.mountedRows,
    snapshot?.heap?.usedSize,
    snapshot?.heap?.embedderHeapUsedSize,
    snapshot?.heap?.backingStorageSize,
    snapshot?.dom?.documents,
    snapshot?.dom?.nodes,
    snapshot?.dom?.jsEventListeners,
  ];
}

export function candidateCalibrationEvidence(measurement, { runId } = {}) {
  if (!isObject(measurement) || !PROFILES.includes(measurement.profile)
    || typeof runId !== 'string' || !runId) return null;
  const resize = measurement.phases?.viewportResize;
  const sources = {
    first: measurement.points?.first,
    middle: measurement.points?.middle,
    last: measurement.points?.last,
    filtered: measurement.points?.filtered,
    detail: measurement.points?.detail,
    detailClosed: measurement.points?.detailClosed,
    back: measurement.points?.back,
    focusPinned: measurement.points?.focusPinned,
    closed: measurement.points?.closed,
    planetside: measurement.points?.planetside,
    warmCachePrecondition: measurement.phases?.warmCachePrecondition,
    postCapRestored: measurement.points?.postCapRestored,
    resizeBase: resize?.base,
    resizeContracted: resize?.contracted,
    resizeExpanded: resize?.expanded,
    resizeRestored: resize?.restored,
  };
  const warm = Array.isArray(measurement.points?.warm) ? measurement.points.warm : [];
  return Object.freeze({
    schema: CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA,
    runId,
    profile: measurement.profile,
    points: Object.freeze(Object.fromEntries(CANDIDATE_CALIBRATION_POINT_KEYS
      .map((key) => [key, Object.freeze(candidateCalibrationTuple(sources[key]))]))),
    warm: Object.freeze(warm.map((snapshot) => Object.freeze(candidateCalibrationTuple(snapshot)))),
    jobPeaks: Object.freeze({
      queuedJobsPeak: measurement.phases?.jobPeaks?.queuedJobsPeak,
      activeJobsPeak: measurement.phases?.jobPeaks?.activeJobsPeak,
    }),
  });
}

function naturalDimensionHistogram(raw) {
  if (!Array.isArray(raw?.naturalWidths) || !Array.isArray(raw?.naturalHeights)
    || raw.naturalWidths.length !== raw.naturalHeights.length) return null;
  const counts = new Map();
  for (let index = 0; index < raw.naturalWidths.length; index += 1) {
    const width = raw.naturalWidths[index];
    const height = raw.naturalHeights[index];
    if (!integer(width) || width < 0 || !integer(height) || height < 0) return null;
    const key = `${width}\0${height}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts].map(([key, count]) => {
    const [width, height] = key.split('\0').map(Number);
    return [width, height, count];
  }).sort((left, right) => left[0] - right[0] || left[1] - right[1]);
}

export function brokenBaselineCalibrationEvidence({
  runId, profile, list, detail, warm, eagerResource, speciesChunk,
} = {}) {
  if (typeof runId !== 'string' || !runId || !PROFILES.includes(profile)
    || !isObject(list) || !isObject(detail) || !Array.isArray(warm)) return null;
  const histogram = naturalDimensionHistogram(list.raw);
  if (histogram === null) return null;
  return Object.freeze({
    schema: BASELINE_CALIBRATION_EVIDENCE_SCHEMA,
    runId,
    profile,
    list: Object.freeze(baselineCalibrationTuple(list)),
    detail: Object.freeze(baselineCalibrationTuple(detail)),
    warm: Object.freeze(warm.map((point) => Object.freeze({
      point: Object.freeze(baselineCalibrationTuple(point)),
      renderStartThumbCacheEntries: point?.raw?.renderStartThumbCacheEntries,
      renderStartThumbCacheEncodedBytes: point?.raw?.renderStartThumbCacheEncodedBytes,
    }))),
    listWitness: Object.freeze({
      naturalDimensionHistogram: Object.freeze(histogram.map((entry) => Object.freeze(entry))),
      distinctSources: list.raw?.distinctSources,
      sourceInstanceCount: list.raw?.sourceInstanceCount,
      dataImageCount: list.raw?.dataImageCount,
      sourceInstanceEncodedBytes: list.raw?.sourceInstanceEncodedBytes,
      thumbObserver: Object.freeze({
        expectedPreOwnerExact132Completions:
          list.raw?.thumbObserverExpectedPreOwnerExact132Completions,
        preOwnerExact132Completions: list.raw?.thumbObserverPreOwnerExact132Completions,
        initialListCompletions: list.raw?.thumbRenderCompletions,
        cacheEntries: list.raw?.modeledThumbCacheEntries,
        cacheEncodedBytes: list.raw?.thumbCacheEncodedBytes,
        totalExact132Completions: list.raw?.thumbObserverTotalExact132Completions,
        errors: list.raw?.thumbObserverErrors,
        descriptorPreserved: list.raw?.thumbObserverDescriptorPreserved,
        stableQuietMs: list.raw?.thumbObserverStableQuietMs,
      }),
      portraitCache: Object.freeze({
        entries: list.raw?.modeledPortraitCacheEntries,
        encodedBytes: list.raw?.modeledPortraitCacheEncodedBytes,
      }),
    }),
    eagerImport: Object.freeze({ observedResource: eagerResource, speciesChunk }),
  });
}

function validNumericTuple(value, length) {
  return Array.isArray(value) && value.length === length
    && value.every((entry) => integer(entry) && entry >= 0);
}

export function reduceCalibrationEvidence(evidence) {
  if (!isObject(evidence) || typeof evidence.runId !== 'string' || !evidence.runId
    || !PROFILES.includes(evidence.profile)) return null;
  if (evidence.schema === CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA) {
    if (!exactKeys(evidence, ['schema', 'runId', 'profile', 'points', 'warm', 'jobPeaks'],
      'candidate calibration evidence', [])
      || !isObject(evidence.points)
      || !sameJson(Object.keys(evidence.points), [...CANDIDATE_CALIBRATION_POINT_KEYS])
      || CANDIDATE_CALIBRATION_POINT_KEYS.some((key) =>
        !validNumericTuple(evidence.points[key], 15))
      || !Array.isArray(evidence.warm) || evidence.warm.length !== REQUIRED_WARM_CYCLES
      || evidence.warm.some((tuple) => !validNumericTuple(tuple, 15))
      || !isObject(evidence.jobPeaks)
      || !sameJson(Object.keys(evidence.jobPeaks).sort(), ['activeJobsPeak', 'queuedJobsPeak'])
      || !integer(evidence.jobPeaks.queuedJobsPeak) || evidence.jobPeaks.queuedJobsPeak < 0
      || !integer(evidence.jobPeaks.activeJobsPeak) || evidence.jobPeaks.activeJobsPeak < 0) {
      return null;
    }
    const selected = [...CANDIDATE_CALIBRATION_POINT_KEYS.map((key) => evidence.points[key]),
      ...evidence.warm];
    const tail = evidence.warm.slice(-3);
    const maxima = (index) => Math.max(...selected.map((tuple) => tuple[index]));
    const aggregate = (tuple) => tuple[1] + tuple[2] + tuple[3];
    const metrics = {
      mountedRows: maxima(0), heapUsedBytes: maxima(1),
      documents: maxima(4), nodes: maxima(5),
      embedderHeapUsedBytes: maxima(2), backingStorageBytes: maxima(3),
      heapAggregateBytes: Math.max(...selected.map(aggregate)),
      jsEventListeners: maxima(6), liveCacheEntries: maxima(7),
      liveDecodedPixels: maxima(8), liveDecodedBytes: maxima(9),
      liveEncodedBytes: maxima(10),
      queuedJobsPeak: evidence.jobPeaks.queuedJobsPeak,
      activeJobsPeak: evidence.jobPeaks.activeJobsPeak,
      liveLeases: maxima(11), liveSubscribers: maxima(12),
      livePortraitCacheEntries: maxima(13), livePortraitEncodedBytes: maxima(14),
      warmHeapAggregateRangeBytes: range(tail.map(aggregate)),
      warmEncodedBytesRange: range(tail.map((tuple) => tuple[10])),
    };
    return { metrics, observedFaults: null };
  }
  if (evidence.schema !== BASELINE_CALIBRATION_EVIDENCE_SCHEMA
    || !exactKeys(evidence,
      ['schema', 'runId', 'profile', 'list', 'detail', 'warm', 'listWitness', 'eagerImport'],
      'baseline calibration evidence', [])
    || !validNumericTuple(evidence.list, 7) || !validNumericTuple(evidence.detail, 7)
    || !Array.isArray(evidence.warm) || evidence.warm.length !== REQUIRED_WARM_CYCLES
    || evidence.warm.some((entry) => !isObject(entry)
      || !sameJson(Object.keys(entry).sort(), [
        'point', 'renderStartThumbCacheEncodedBytes', 'renderStartThumbCacheEntries',
      ])
      || !validNumericTuple(entry.point, 7)
      || !integer(entry.renderStartThumbCacheEntries)
      || entry.renderStartThumbCacheEntries < 0
      || !integer(entry.renderStartThumbCacheEncodedBytes)
      || entry.renderStartThumbCacheEncodedBytes < 0)
    || !isObject(evidence.listWitness)
    || !sameJson(Object.keys(evidence.listWitness).sort(), [
      'dataImageCount', 'distinctSources', 'naturalDimensionHistogram',
      'portraitCache', 'sourceInstanceCount', 'sourceInstanceEncodedBytes', 'thumbObserver',
    ])
    || !Array.isArray(evidence.listWitness.naturalDimensionHistogram)
    || ['distinctSources', 'sourceInstanceCount', 'dataImageCount',
      'sourceInstanceEncodedBytes'].some((field) =>
      !integer(evidence.listWitness[field]) || evidence.listWitness[field] < 0)
    || !isObject(evidence.listWitness.thumbObserver)
    || !isObject(evidence.listWitness.portraitCache)
    || !isObject(evidence.eagerImport)
    || !sameJson(Object.keys(evidence.eagerImport).sort(), ['observedResource', 'speciesChunk'])) {
    return null;
  }
  const histogram = evidence.listWitness.naturalDimensionHistogram;
  if (histogram.some((entry) => !Array.isArray(entry) || entry.length !== 3
    || !integer(entry[0]) || entry[0] < 0 || !integer(entry[1]) || entry[1] < 0
    || !integer(entry[2]) || entry[2] <= 0)
    || !sameJson(histogram, [...histogram].sort((left, right) =>
      left[0] - right[0] || left[1] - right[1]))
    || new Set(histogram.map((entry) => `${entry[0]}\0${entry[1]}`)).size !== histogram.length) {
    return null;
  }
  const imageCount = histogram.reduce((sum, entry) => sum + entry[2], 0);
  const referencedPixels = histogram.reduce(
    (sum, [width, height, count]) => sum + width * height * count, 0,
  );
  const observer = evidence.listWitness.thumbObserver;
  const portrait = evidence.listWitness.portraitCache;
  if (!sameJson(Object.keys(observer).sort(), [
    'cacheEncodedBytes', 'cacheEntries', 'descriptorPreserved', 'errors',
    'expectedPreOwnerExact132Completions', 'initialListCompletions',
    'preOwnerExact132Completions', 'stableQuietMs',
    'totalExact132Completions',
  ]) || !sameJson(Object.keys(portrait).sort(), ['encodedBytes', 'entries'])) return null;
  const list = {
    mountedRows: evidence.list[0], imageCount,
    sourceInstanceCount: evidence.listWitness.sourceInstanceCount,
    dataImageCount: evidence.listWitness.dataImageCount,
    referencedPixels,
    distinctSources: evidence.listWitness.distinctSources,
    sourceInstanceEncodedBytes: evidence.listWitness.sourceInstanceEncodedBytes,
    thumbObserverExpectedPreOwnerExact132Completions:
      observer.expectedPreOwnerExact132Completions,
    thumbObserverPreOwnerExact132Completions: observer.preOwnerExact132Completions,
    thumbRenderCompletions: observer.initialListCompletions,
    modeledThumbCacheEntries: observer.cacheEntries,
    thumbCacheEncodedBytes: observer.cacheEncodedBytes,
    thumbObserverTotalExact132Completions: observer.totalExact132Completions,
    thumbObserverErrors: observer.errors,
    thumbObserverDescriptorPreserved: observer.descriptorPreserved,
    thumbObserverStableQuietMs: observer.stableQuietMs,
    modeledPortraitCacheEntries: portrait.entries,
    modeledPortraitCacheEncodedBytes: portrait.encodedBytes,
  };
  const warmRaw = evidence.warm.map((entry) => ({
    renderStartThumbCacheEntries: entry.renderStartThumbCacheEntries,
    renderStartThumbCacheEncodedBytes: entry.renderStartThumbCacheEncodedBytes,
  }));
  const cacheMetrics = brokenBaselineCacheMetrics(evidence.profile, list, warmRaw);
  if (!cacheMetrics) return null;
  const points = [evidence.list, evidence.detail, ...evidence.warm.map((entry) => entry.point)];
  const tail = evidence.warm.slice(-3).map((entry) => entry.point);
  const maxima = (index) => Math.max(...points.map((tuple) => tuple[index]));
  const aggregate = (tuple) => tuple[1] + tuple[2] + tuple[3];
  const fullSizeList = sameJson(histogram, [[440, 440, 1500]]);
  const faults = [];
  if (evidence.list[0] === 1500) faults.push('unwindowed-1500-rows');
  if (fullSizeList) faults.push('list-source-440');
  if (fullSizeList && list.sourceInstanceCount === 1500 && list.dataImageCount === 1500
    && referencedPixels === 1500 * 440 * 440
    && integer(list.distinctSources)
    && list.distinctSources > BROKEN_BASELINE_PORTRAIT_CACHE_CAPS[evidence.profile]
    && finite(list.sourceInstanceEncodedBytes) && list.sourceInstanceEncodedBytes > 0) {
    faults.push('full-portrait-dom-exposure');
  }
  if (typeof evidence.eagerImport.observedResource === 'string'
    && typeof evidence.eagerImport.speciesChunk === 'string'
    && evidence.eagerImport.speciesChunk
    && evidence.eagerImport.observedResource.endsWith(`/${evidence.eagerImport.speciesChunk}`)) {
    faults.push('eager-art-import');
  }
  return {
    metrics: {
      mountedRows: maxima(0), heapUsedBytes: maxima(1),
      documents: maxima(4), nodes: maxima(5),
      embedderHeapUsedBytes: maxima(2), backingStorageBytes: maxima(3),
      heapAggregateBytes: Math.max(...points.map(aggregate)),
      jsEventListeners: maxima(6), liveCacheEntries: cacheMetrics.liveCacheEntries,
      liveDecodedPixels: cacheMetrics.liveDecodedPixels,
      liveDecodedBytes: cacheMetrics.liveDecodedBytes,
      liveEncodedBytes: cacheMetrics.liveEncodedBytes,
      queuedJobsPeak: cacheMetrics.queuedJobsPeak, activeJobsPeak: cacheMetrics.activeJobsPeak,
      liveLeases: cacheMetrics.liveLeases, liveSubscribers: cacheMetrics.liveSubscribers,
      livePortraitCacheEntries: cacheMetrics.livePortraitCacheEntries,
      livePortraitEncodedBytes: cacheMetrics.livePortraitEncodedBytes,
      warmHeapAggregateRangeBytes: range(tail.map(aggregate)),
      warmEncodedBytesRange: cacheMetrics.warmEncodedBytesRange,
    },
    observedFaults: faults,
  };
}

export function compendiumCalibrationEvaluatorBudget(producerAuthority) {
  if (!validProducerAuthority(producerAuthority)) return null;
  const ceiling = Object.freeze(Object.fromEntries([
    ['rationale', 'Calibration-only unbounded evaluator; never a certifying budget.'],
    ...CEILING_FIELDS.map((field) => [field, Number.MAX_SAFE_INTEGER]),
  ]));
  return Object.freeze({
    status: 'active', producerAuthority,
    ceilings: Object.freeze({ phone: ceiling, desktop: ceiling }),
  });
}

function validateCalibrationSample(
  sample, profile, index, errors, expectedFaults = null,
  wherePrefix = 'calibration.samples',
) {
  const where = `${wherePrefix}.${profile}[${index}]`;
  if (!isObject(sample)) { errors.push(`${where} must be an object`); return; }
  exactKeys(sample, [
    'runId', 'commit', 'workingTreeDigest', 'inputDigest',
    'measurementAuthoritySha256', 'sourceState',
    'sourceChanged', 'fixtureRowsSha256', 'measuredAt', 'browser', 'metrics', 'evidence',
    ...(!expectedFaults ? ['producerAuthoritySha256'] : []),
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
  if (!/^[a-f0-9]{64}$/.test(String(sample.measurementAuthoritySha256 || ''))) {
    errors.push(`${where}.measurementAuthoritySha256 is invalid`);
  }
  if (!expectedFaults
    && !/^[a-f0-9]{64}$/.test(String(sample.producerAuthoritySha256 || ''))) {
    errors.push(`${where}.producerAuthoritySha256 is invalid`);
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
      || sample.browser[field].length === 0)
    || !absoluteExecutable(sample.browser.executable)) {
    errors.push(`${where}.browser provenance is incomplete`);
  } else {
    exactKeys(sample.browser, browserFields, `${where}.browser`, errors);
  }
  if (!isObject(sample.metrics)) { errors.push(`${where}.metrics is missing`); return; }
  exactKeys(sample.metrics, SAMPLE_METRIC_FIELDS, `${where}.metrics`, errors);
  for (const field of SAMPLE_METRIC_FIELDS) {
    if (!nonnegative(sample.metrics[field])) errors.push(`${where}.metrics.${field} is invalid`);
  }
  const reduced = reduceCalibrationEvidence(sample.evidence);
  if (!reduced || sample.evidence?.runId !== sample.runId
    || sample.evidence?.profile !== profile) {
    errors.push(`${where}.evidence is invalid or not bound to its run/profile`);
  } else if (!sameJson(reduced.metrics, sample.metrics)) {
    errors.push(`${where}.metrics do not recompute from raw calibration evidence`);
  }
  if (expectedFaults) {
    if (!Array.isArray(sample.observedFaults)
      || new Set(sample.observedFaults).size !== sample.observedFaults.length
      || !sameJson([...sample.observedFaults].sort(), [...expectedFaults].sort())) {
      errors.push(`${where}.observedFaults must prove every sealed broken-baseline fault`);
    }
    if (reduced && !sameJson(reduced.observedFaults, sample.observedFaults)) {
      errors.push(`${where}.observedFaults do not recompute from raw calibration evidence`);
    }
  } else if (reduced?.observedFaults !== null) {
    errors.push(`${where}.candidate evidence used the broken-baseline evidence schema`);
  }
}

function enforceSharedSampleIdentity(samples, label, errors, expectedCommit = null,
  expectedFixture = null) {
  if (!samples.length) return;
  const identity = (sample) => [sample.commit, sample.workingTreeDigest,
    sample.inputDigest, sample.fixtureRowsSha256].join('\0');
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

function enforceSameRunBrowserProvenance(samplesByProfile, label, errors) {
  if (!isObject(samplesByProfile)) return;
  const browserKey = (browser) => [
    browser?.executable, browser?.product, browser?.revision,
    browser?.userAgent, browser?.jsVersion, browser?.protocolVersion,
  ].join('\0');
  const byRun = new Map();
  for (const profile of PROFILES) {
    const samples = Array.isArray(samplesByProfile[profile]) ? samplesByProfile[profile] : [];
    for (const sample of samples) {
      if (!byRun.has(sample?.runId)) byRun.set(sample?.runId, new Map());
      const profiles = byRun.get(sample?.runId);
      if (profiles.has(profile)) {
        errors.push(`${label} run ${String(sample?.runId)} has duplicate ${profile} provenance`);
      } else profiles.set(profile, {
        browser: sample?.browser,
        measuredAt: sample?.measuredAt,
      });
    }
  }
  for (const [runId, profiles] of byRun) {
    if (profiles.size !== PROFILES.length || PROFILES.some((profile) => !profiles.has(profile))) {
      errors.push(`${label} run ${String(runId)} is not represented once in every profile`);
      continue;
    }
    const first = browserKey(profiles.get(PROFILES[0])?.browser);
    if (PROFILES.some((profile) => browserKey(profiles.get(profile)?.browser) !== first)) {
      errors.push(`${label} run ${String(runId)} does not bind one exact browser provenance tuple across profiles`);
    }
    const measuredAt = profiles.get(PROFILES[0])?.measuredAt;
    if (PROFILES.some((profile) => profiles.get(profile)?.measuredAt !== measuredAt)) {
      errors.push(`${label} run ${String(runId)} does not bind one exact measurement timestamp across profiles`);
    }
  }
  const runSets = PROFILES.map((profile) => new Set(
    (Array.isArray(samplesByProfile[profile]) ? samplesByProfile[profile] : [])
      .map((sample) => sample?.runId),
  ));
  if (!sameJson([...runSets[0]].sort(), [...runSets[1]].sort())) {
    errors.push(`${label} profile run-id inventories differ`);
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
  brokenBaselineProjectionRowsSha256 = null, expectedMeasurementAuthority = null,
  expectedProducerAuthority = null) {
  const errors = [];
  if (!isObject(record)) return { ok: false, errors: ['budget must be an object'] };
  exactKeys(record, [
    'schema', 'status', 'fixture', 'requirements', 'calibration',
    'browserAuthority', 'measurementAuthority', 'producerAuthority',
    'pairedBrokenBaseline', 'ceilings',
  ], 'budget', errors);
  if (record.schema !== BUDGET_SCHEMA) errors.push(`budget schema must be ${BUDGET_SCHEMA}`);
  if (!['calibration-required', 'active'].includes(record.status)) {
    errors.push('budget status must be calibration-required or active');
  }
  const browserAuthority = compendiumBudgetBrowserAuthority(record);
  if (!validCompendiumBrowserAuthority(browserAuthority)) {
    errors.push('budget browser authority is invalid');
  }
  if (!validMeasurementAuthority(record.measurementAuthority)) {
    errors.push('budget measurement authority is invalid');
  } else if (expectedMeasurementAuthority !== null
    && (!validMeasurementAuthority(expectedMeasurementAuthority)
      || !sameJson(record.measurementAuthority, expectedMeasurementAuthority))) {
    errors.push('budget measurement authority does not match the current collector/evaluator inputs');
  }
  if (!validProducerAuthority(record.producerAuthority)) {
    errors.push('budget producer authority is invalid');
  } else if (expectedProducerAuthority !== null
    && (!validProducerAuthority(expectedProducerAuthority)
      || !sameJson(record.producerAuthority, expectedProducerAuthority))) {
    errors.push('budget producer authority does not match the current built index/owner/worker/painter/service-worker');
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
    || !validCompendiumFixedRulerAuthority(record.calibration.rulerAuthority)
    || !isObject(record.calibration.samples)) {
    errors.push('calibration workflow is incomplete');
  } else {
    exactKeys(record.calibration, [
      'requiredIndependentRunsPerProfile', 'selectionRule',
      'headroomRationaleRequired', 'rulerAuthority', 'samples',
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
    enforceSameRunBrowserProvenance(record.calibration.samples, 'candidate calibration', errors);
    if (allCandidateSamples.some((sample) => sample.measurementAuthoritySha256
      !== record.calibration.rulerAuthority.measurementAuthoritySha256)) {
      errors.push('candidate calibration samples do not match the fixed ruler measurement authority');
    }
    if (allCandidateSamples.some((sample) => sample.producerAuthoritySha256
      !== record.calibration.rulerAuthority.producerAuthoritySha256)) {
      errors.push('candidate calibration samples do not match the fixed ruler producer authority');
    }
    if (allCandidateSamples.some((sample) =>
      !compendiumBrowserAuthorityMatches(sample?.browser, browserAuthority))) {
      errors.push('candidate calibration browser does not match the Arc 1A calibration authority');
    }
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
          sample, profile, index, errors,
          record.pairedBrokenBaseline.expectedFaults, 'pairedBrokenBaseline.samples',
        ));
        enforceIndependentRuns(samples, `paired broken-baseline ${profile}`, errors);
      }
    }
    const allBaselineSamples = PROFILES.flatMap((profile) =>
      Array.isArray(record.pairedBrokenBaseline.samples[profile])
        ? record.pairedBrokenBaseline.samples[profile] : []);
    enforceSharedSampleIdentity(allBaselineSamples, 'paired broken-baseline', errors,
      record.pairedBrokenBaseline.commit, record.fixture?.rowsSha256 || null);
    enforceSameRunBrowserProvenance(
      record.pairedBrokenBaseline.samples, 'paired broken-baseline', errors,
    );
    if (allBaselineSamples.some((sample) => sample.measurementAuthoritySha256
      !== record.calibration?.rulerAuthority?.measurementAuthoritySha256)) {
      errors.push('paired broken-baseline samples do not match the fixed ruler measurement authority');
    }
    if (allBaselineSamples.some((sample) =>
      !compendiumBrowserAuthorityMatches(sample?.browser, browserAuthority))) {
      errors.push('paired broken-baseline browser does not match the Arc 1A calibration authority');
    }
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
    if (validCompendiumFixedRulerAuthority(record.calibration?.rulerAuthority)
      && validMeasurementAuthority(record.measurementAuthority)
      && record.calibration.rulerAuthority.measurementAuthoritySha256
        !== record.measurementAuthority.sha256) {
      errors.push('calibration-required fixed ruler measurement authority must match the top-level measurement authority');
    }
    if (validCompendiumFixedRulerAuthority(record.calibration?.rulerAuthority)
      && validProducerAuthority(record.producerAuthority)
      && record.calibration.rulerAuthority.producerAuthoritySha256
        !== record.producerAuthority.sha256) {
      errors.push('calibration-required fixed ruler producer authority must match the top-level producer authority');
    }
    if (record.ceilings !== null) errors.push('calibration-required budget must keep ceilings null');
    if (PROFILES.some((profile) => record.calibration?.samples?.[profile]?.length !== 0)) {
      errors.push('calibration-required budget must not retain stale candidate samples');
    }
    if (record.pairedBrokenBaseline?.status !== 'measurement-required'
      || record.pairedBrokenBaseline?.collectorCommit !== null
      || PROFILES.some((profile) =>
        record.pairedBrokenBaseline?.samples?.[profile]?.length !== 0)) {
      errors.push('calibration-required budget must require a fresh paired broken baseline');
    }
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
          const measuredMax = Math.max(...samples.map((sample) =>
            reduceCalibrationEvidence(sample.evidence)?.metrics?.[sampleField] ?? Infinity));
          if (finite(ceiling[ceilingField]) && ceiling[ceilingField] <= measuredMax) {
            errors.push(`active ${profile}.${ceilingField} must be strictly above measured ${sampleField} max`);
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
    || a.limits.budgetStatus !== 'active-measured'
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
const WORKER_STATE_FIELDS = Object.freeze([
  'live', 'starts', 'ready', 'disposals', 'fatals', 'protocolErrors',
]);
const WORKER_PHASE_FIELDS = Object.freeze([
  'importStarts', 'importCompletes',
  'thumbJobStarts', 'thumbRenderCompletes', 'thumbEncodeStarts', 'thumbEncodeCompletes',
  'portraitJobStarts', 'portraitRenderCompletes', 'portraitEncodeStarts', 'portraitEncodeCompletes',
]);
const WORKER_RESULT_FIELDS = Object.freeze([
  'count', 'maxImportDurationMs', 'maxRenderDurationMs', 'maxEncodeDurationMs',
]);
const WORKER_ERROR_FIELDS = Object.freeze([
  'capability', 'protocol', 'import', 'paint', 'encode',
]);
function validWorkerArtLastError(value) {
  return value === null || (isObject(value)
    && sameJson(Object.keys(value).sort(), [
      'producerEpoch', 'workerInstanceId', 'jobId', 'kind', 'stage', 'code', 'message',
    ].sort())
    && integer(value.producerEpoch) && value.producerEpoch >= 1
    && integer(value.workerInstanceId) && value.workerInstanceId >= 1
    && (value.jobId === null || integer(value.jobId) && value.jobId >= 1)
    && (value.kind === null || ['thumb132', 'portrait440'].includes(value.kind))
    && (value.jobId === null) === (value.kind === null)
    && ['capability', 'protocol', 'import', 'paint', 'encode'].includes(value.stage)
    && typeof value.code === 'string' && /^[a-z0-9-]{1,48}$/.test(value.code)
    && boundedString(value.message, { max: 512 }));
}
function validWorkerArtDiagnostics(value) {
  const historical = value?.schema === HISTORICAL_WORKER_ART_DIAGNOSTICS_SCHEMA;
  const current = value?.schema === WORKER_ART_DIAGNOSTICS_SCHEMA;
  const keys = [
    'schema', 'state', 'importStarts', 'identity', 'lastEvent',
    ...(current ? ['lastError'] : []),
    'worker', 'phases', 'results', 'errors',
  ];
  return isObject(value)
    && (historical || current)
    && sameJson(Object.keys(value).sort(), keys.sort())
    && ['idle', 'loading', 'ready', 'error'].includes(value.state)
    && integer(value.importStarts) && value.importStarts >= 0
    && isObject(value.identity)
    && sameJson(Object.keys(value.identity).sort(), [
      'documentToken', 'lastProducerEpoch', 'lastWorkerInstanceId',
    ].sort())
    && typeof value.identity.documentToken === 'string'
    && value.identity.documentToken.length >= 1 && value.identity.documentToken.length <= 160
    && integer(value.identity.lastProducerEpoch) && value.identity.lastProducerEpoch >= 0
    && integer(value.identity.lastWorkerInstanceId) && value.identity.lastWorkerInstanceId >= 0
    && (value.lastEvent === null || (isObject(value.lastEvent)
      && sameJson(Object.keys(value.lastEvent).sort(), [
        'producerEpoch', 'workerInstanceId', 'jobId', 'kind', 'event',
      ].sort())
      && integer(value.lastEvent.producerEpoch) && value.lastEvent.producerEpoch >= 1
      && integer(value.lastEvent.workerInstanceId) && value.lastEvent.workerInstanceId >= 1
      && integer(value.lastEvent.jobId) && value.lastEvent.jobId >= 1
      && ['thumb132', 'portrait440'].includes(value.lastEvent.kind)
      && typeof value.lastEvent.event === 'string'
      && /^(?:phase:(?:import-start|import-complete|job-start|render-complete|encode-start|encode-complete)|result|error:(?:capability|protocol|import|paint|encode))$/.test(value.lastEvent.event)))
    && (historical || validWorkerArtLastError(value.lastError))
    && isObject(value.worker)
    && sameJson(Object.keys(value.worker).sort(), [...WORKER_STATE_FIELDS].sort())
    && typeof value.worker.live === 'boolean'
    && WORKER_STATE_FIELDS.filter((field) => field !== 'live')
      .every((field) => integer(value.worker[field]) && value.worker[field] >= 0)
    && isObject(value.phases)
    && sameJson(Object.keys(value.phases).sort(), [...WORKER_PHASE_FIELDS].sort())
    && WORKER_PHASE_FIELDS.every((field) => integer(value.phases[field]) && value.phases[field] >= 0)
    && isObject(value.results)
    && sameJson(Object.keys(value.results).sort(), [...WORKER_RESULT_FIELDS].sort())
    && integer(value.results.count) && value.results.count >= 0
    && WORKER_RESULT_FIELDS.filter((field) => field !== 'count')
      .every((field) => nonnegative(value.results[field]))
    && isObject(value.errors)
    && sameJson(Object.keys(value.errors).sort(), [...WORKER_ERROR_FIELDS].sort())
    && WORKER_ERROR_FIELDS.every((field) => integer(value.errors[field]) && value.errors[field] >= 0);
}
function workerArtDormant(snapshot) {
  const value = snapshot?.diagnostics?.lazyArt;
  return validWorkerArtDiagnostics(value)
    && value.state === 'idle' && value.importStarts === 0
    && value.identity.documentToken === snapshot?.diagnostics?.documentToken
    && value.identity.lastProducerEpoch === 0
    && value.identity.lastWorkerInstanceId === 0
    && value.lastEvent === null
    && (value.schema === HISTORICAL_WORKER_ART_DIAGNOSTICS_SCHEMA
      || value.lastError === null)
    && value.worker.live === false
    && WORKER_STATE_FIELDS.filter((field) => field !== 'live')
      .every((field) => value.worker[field] === 0)
    && WORKER_PHASE_FIELDS.every((field) => value.phases[field] === 0)
    && WORKER_RESULT_FIELDS.every((field) => value.results[field] === 0)
    && WORKER_ERROR_FIELDS.every((field) => value.errors[field] === 0);
}
function workerArtReleased(snapshot) {
  const value = snapshot?.diagnostics?.lazyArt;
  return validWorkerArtDiagnostics(value)
    && value.identity.documentToken === snapshot?.diagnostics?.documentToken
    && value.worker.live === false
    && value.identity.lastProducerEpoch === value.worker.starts
    && value.identity.lastWorkerInstanceId === value.worker.starts
    && value.lastEvent !== null
    && value.lastEvent.producerEpoch === value.identity.lastProducerEpoch
    && value.lastEvent.workerInstanceId === value.identity.lastWorkerInstanceId
    && value.lastEvent.jobId
      === value.phases.thumbJobStarts + value.phases.portraitJobStarts
    && value.lastEvent.event === 'result'
    && (value.schema === HISTORICAL_WORKER_ART_DIAGNOSTICS_SCHEMA
      || value.lastError === null)
    && value.worker.ready === value.worker.starts
    && value.worker.disposals === value.worker.starts
    && value.worker.fatals === 0
    && value.worker.protocolErrors === 0;
}
function workerArtFinalEvidence(snapshot) {
  const value = snapshot?.diagnostics?.lazyArt;
  const a = art(snapshot);
  if (!workerArtReleased(snapshot) || !a) return false;
  const phases = value.phases;
  const errors = value.errors;
  const successfulThumbs = phases.thumbEncodeCompletes;
  const successfulPortraits = phases.portraitEncodeCompletes;
  return value.state === 'ready'
    && value.lastEvent.kind === 'thumb132'
    && value.importStarts === value.worker.starts
    && phases.importStarts === value.worker.starts
    && phases.importCompletes === phases.importStarts
    && phases.thumbJobStarts === phases.thumbRenderCompletes + errors.paint
    && phases.thumbRenderCompletes === phases.thumbEncodeStarts
    && phases.thumbEncodeStarts === successfulThumbs
    && phases.portraitJobStarts > 0
    && phases.portraitJobStarts === phases.portraitRenderCompletes
    && phases.portraitRenderCompletes === phases.portraitEncodeStarts
    && phases.portraitEncodeStarts === successfulPortraits
    && value.results.count === successfulThumbs + successfulPortraits
    && errors.capability === 0 && errors.protocol === 0 && errors.import === 0
    && errors.paint === 1 && errors.encode === 0
    && a.totals.thumbCanvasRenders === successfulThumbs
    && a.totals.fullPortraitRendersForThumb === 0
    && a.totals.fullPortraitDecodesForThumb === 0;
}
function heapAggregateBytes(snapshot) {
  const heap = snapshot?.heap;
  if (!isObject(heap)
    || !nonnegative(heap.usedSize)
    || !nonnegative(heap.embedderHeapUsedSize)
    || !nonnegative(heap.backingStorageSize)) return Infinity;
  const aggregate = heap.usedSize + heap.embedderHeapUsedSize + heap.backingStorageSize;
  return Number.isSafeInteger(aggregate) ? aggregate : Infinity;
}
function warmCompendiumDomClosed(snapshot) {
  const diagnostics = snapshot?.diagnostics;
  const panel = diagnostics?.panel;
  const window = diagnostics?.window;
  const list = diagnostics?.surfaces?.list;
  const detail = diagnostics?.surfaces?.detail;
  const raw = snapshot?.raw;
  return panel?.open === false
    && panel?.mode === 'closed'
    && window?.start === 0
    && window?.end === 0
    && window?.overscan === 0
    && window?.beforePx === 0
    && window?.afterPx === 0
    && window?.mountedRowCount === 0
    && Array.isArray(window?.mountedLogicalIds) && window.mountedLogicalIds.length === 0
    && window?.focusedLogicalId === null
    && Array.isArray(window?.pinnedLogicalIds) && window.pinnedLogicalIds.length === 0
    && list?.imageCount === 0
    && Array.isArray(list?.naturalWidths) && list.naturalWidths.length === 0
    && Array.isArray(list?.naturalHeights) && list.naturalHeights.length === 0
    && Array.isArray(list?.thumbStates) && list.thumbStates.length === 0
    && Array.isArray(list?.logicalIds) && list.logicalIds.length === 0
    && detail?.open === false
    && detail?.logicalId === null
    && detail?.naturalWidth === 0
    && detail?.naturalHeight === 0
    && raw?.mountedRowCount === 0
    && Array.isArray(raw?.mountedLogicalIds) && raw.mountedLogicalIds.length === 0
    && Array.isArray(raw?.rowRects) && raw.rowRects.length === 0
    && Array.isArray(raw?.listImages) && raw.listImages.length === 0
    && raw?.detailNaturalWidth === 0
    && raw?.detailNaturalHeight === 0
    && raw?.detailImageCount === 0
    && raw?.detailSrcPresent === false;
}
function warmResourceStateReady(snapshot, profile) {
  const a = art(snapshot);
  const cachedKeys = a?.keys?.cached;
  const leasedKeys = a?.keys?.leased;
  const queuedKeys = a?.keys?.queued;
  const activeKeys = a?.keys?.active;
  const planetside = planetsideImages(snapshot);
  const planetsideLogicalIds = planetside.map((image) => image?.logicalId);
  const planetsideVisualKeys = planetside.map((image) => image?.visualKey);
  const cachedKeySet = Array.isArray(cachedKeys) ? new Set(cachedKeys) : null;
  const leasedKeySet = Array.isArray(leasedKeys) ? new Set(leasedKeys) : null;
  const unleasedCachedKeys = cachedKeySet !== null && leasedKeySet !== null
    ? cachedKeys.filter((key) => !leasedKeySet.has(key)) : null;
  const expectedDecodedPixels = a?.live?.cacheEntries * 132 * 132;
  const expectedDecodedBytes = expectedDecodedPixels * 4;
  return isObject(a)
    && a.deviceClass === profile
    && liveWithinLimits(snapshot, profile)
    && warmCompendiumDomClosed(snapshot)
    && snapshot?.diagnostics?.surfaces?.planetside?.visible === true
    && planetside.length === REQUIRED_WARM_PLANETSIDE_THUMB_ENTRIES
    && planetsideLogicalIds.every((id) => typeof id === 'string' && id.length > 0)
    && new Set(planetsideLogicalIds).size === REQUIRED_WARM_PLANETSIDE_THUMB_ENTRIES
    && sameJson(snapshot.diagnostics.surfaces.planetside.logicalIds, planetsideLogicalIds)
    && planetsideVisualKeys.every((key) => typeof key === 'string' && key.length > 0)
    && new Set(planetsideVisualKeys).size === REQUIRED_WARM_PLANETSIDE_THUMB_ENTRIES
    && planetside.every((image) => image?.naturalWidth === 132
      && image?.naturalHeight === 132 && image?.thumbState === 'ready')
    && Array.isArray(cachedKeys)
    && cachedKeys.every((key) => typeof key === 'string' && key.length > 0)
    && cachedKeySet.size === cachedKeys.length
    && Array.isArray(leasedKeys)
    && leasedKeys.every((key) => typeof key === 'string' && key.length > 0)
    && new Set(leasedKeys).size === leasedKeys.length
    && leasedKeys.every((key) => cachedKeySet.has(key))
    && sameJson([...leasedKeys].sort(), [...planetsideVisualKeys].sort())
    && a.live?.leases === leasedKeys.length
    && Array.isArray(unleasedCachedKeys)
    && unleasedCachedKeys.length === REQUIRED_QUIESCENT_UNLEASED_THUMB_ENTRIES
    && a.live?.cacheEntries
      === leasedKeys.length + REQUIRED_QUIESCENT_UNLEASED_THUMB_ENTRIES
    && cachedKeys.length === a.live.cacheEntries
    && Number.isSafeInteger(expectedDecodedPixels)
    && Number.isSafeInteger(expectedDecodedBytes)
    && a.live?.decodedPixels === expectedDecodedPixels
    && a.live?.decodedBytes === expectedDecodedBytes
    && nonnegative(a.live?.encodedBytes)
    && nonnegative(a.limits?.encodedBytes)
    && a.live.encodedBytes <= a.limits.encodedBytes
    && a.live?.queuedJobs === 0
    && a.live?.activeJobs === 0
    && a.live?.subscribers === 0
    && a.live?.portraitCacheEntries === 0
    && a.live?.portraitEncodedBytes === 0
    && Array.isArray(queuedKeys) && queuedKeys.length === 0
    && Array.isArray(activeKeys) && activeKeys.length === 0
    && workerArtReleased(snapshot);
}
function normalizedCachedKeys(snapshot) {
  const cached = art(snapshot)?.keys?.cached;
  return Array.isArray(cached) ? [...cached].sort() : null;
}
function warmResourceStateEvidence(snapshot) {
  const a = art(snapshot);
  const cachedKeys = normalizedCachedKeys(snapshot);
  const leased = a?.keys?.leased;
  const leasedKeys = Array.isArray(leased) ? [...leased].sort() : null;
  const planetside = planetsideImages(snapshot);
  const planetsideLogicalIds = planetside.map((image) => image?.logicalId);
  const planetsideVisualKeys = planetside.map((image) => image?.visualKey).sort();
  const leasedKeySet = Array.isArray(leasedKeys) ? new Set(leasedKeys) : null;
  const unleasedCachedKeys = Array.isArray(cachedKeys) && leasedKeySet !== null
    ? cachedKeys.filter((key) => !leasedKeySet.has(key)) : null;
  const diagnostics = snapshot?.diagnostics;
  const raw = snapshot?.raw;
  return {
    art: a?.live,
    limits: a?.limits,
    cachedKeys,
    leasedKeys,
    unleasedCachedKeys,
    planetside: {
      requiredEntries: REQUIRED_WARM_PLANETSIDE_THUMB_ENTRIES,
      logicalIds: planetsideLogicalIds,
      visualKeys: planetsideVisualKeys,
      ready132: planetside.every((image) => image?.naturalWidth === 132
        && image?.naturalHeight === 132 && image?.thumbState === 'ready'),
    },
    compendiumDom: {
      closed: warmCompendiumDomClosed(snapshot),
      panel: diagnostics?.panel,
      window: diagnostics?.window,
      list: diagnostics?.surfaces?.list,
      detail: diagnostics?.surfaces?.detail,
      raw: {
        mountedRowCount: raw?.mountedRowCount,
        mountedLogicalIds: raw?.mountedLogicalIds,
        rowRects: raw?.rowRects,
        listImages: raw?.listImages,
        detailNaturalWidth: raw?.detailNaturalWidth,
        detailNaturalHeight: raw?.detailNaturalHeight,
        detailImageCount: raw?.detailImageCount,
        detailSrcPresent: raw?.detailSrcPresent,
      },
    },
    expected: {
      unleasedThumbEntries: REQUIRED_QUIESCENT_UNLEASED_THUMB_ENTRIES,
      cacheEntries: Array.isArray(leasedKeys)
        ? leasedKeys.length + REQUIRED_QUIESCENT_UNLEASED_THUMB_ENTRIES : null,
      decodedPixels: a?.live?.cacheEntries * 132 * 132,
      decodedBytes: a?.live?.cacheEntries * 132 * 132 * 4,
    },
    totals: {
      jobStarts: a?.totals?.jobStarts,
      disposals: a?.totals?.disposals,
    },
    worker: snapshot?.diagnostics?.lazyArt?.worker,
  };
}
function stableWarmCacheIdentity(warm) {
  const tail = warm.slice(-3).map(normalizedCachedKeys);
  return tail.length === 3 && tail.every((keys) => Array.isArray(keys))
    && tail.every((keys) => sameJson(keys, tail[0]));
}
function stableWarmReuse(warm) {
  const tail = warm.slice(-3);
  if (tail.length !== 3) return false;
  const counters = (snapshot) => ({
    jobStarts: art(snapshot)?.totals?.jobStarts,
    disposals: art(snapshot)?.totals?.disposals,
    workerStarts: snapshot?.diagnostics?.lazyArt?.worker?.starts,
    workerDisposals: snapshot?.diagnostics?.lazyArt?.worker?.disposals,
  });
  const first = counters(tail[0]);
  return Object.values(first).every(nonnegative)
    && tail.every((snapshot) => sameJson(counters(snapshot), first));
}
function range(numbers) {
  return numbers.length ? Math.max(...numbers) - Math.min(...numbers) : Infinity;
}
function maxAt(snapshots, getter) {
  const read = snapshots.map(getter);
  return read.length && read.every(nonnegative) ? Math.max(...read) : Infinity;
}

export function evaluateProfile(measurement, budget, fixture) {
  if (arguments.length !== 3) {
    throw new TypeError('Compendium evaluator accepts only current strict profile authority');
  }
  const profile = measurement?.profile;
  if (!PROFILES.includes(profile)) throw new Error(`unknown Compendium profile ${String(profile)}`);
  const ceiling = budget?.ceilings?.[profile];
  if (budget?.status !== 'active' || !isObject(ceiling)) {
    throw new Error(`${profile}: an active measured budget is required for certification`);
  }
  const points = measurement.points || {};
  const warm = Array.isArray(points.warm) ? points.warm : [];
  const warmCachePrecondition = measurement.phases?.warmCachePrecondition;
  const postCapRestored = points.postCapRestored;
  const resize = measurement.phases?.viewportResize;
  const resizePoints = [resize?.base, resize?.expanded, resize?.contracted, resize?.restored]
    .filter(Boolean);
  const selected = [points.first, points.middle, points.last, points.filtered,
    points.detail, points.detailClosed, points.back, points.focusPinned, points.closed,
    points.planetside, ...resizePoints, warmCachePrecondition, ...warm,
    postCapRestored].filter(Boolean);
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
  const foregroundAuthorityValid = validCompleteProfileForegroundServices(measurement, profile);
  const thumbnailSettlementAuthorityValid = validCompleteProfileThumbnailSettlements(
    measurement, profile, completeProfileBrowserProduct(measurement),
  );
  const measuredProducerAuthority = compendiumProducerAuthority({
    index: {
      relativePath: lazyResource?.indexPath,
      sha256: lazyResource?.indexSha256,
    },
    owner: {
      relativePath: lazyResource?.ownerPath,
      sha256: lazyResource?.ownerSha256,
    },
    worker: {
      relativePath: lazyResource?.workerPath,
      sha256: lazyResource?.workerSha256,
    },
    painter: {
      relativePath: lazyResource?.path,
      sha256: lazyResource?.sha256,
    },
    ...(typeof lazyResource?.serviceWorkerPath === 'string' ? {
      serviceWorker: {
        relativePath: lazyResource.serviceWorkerPath,
        sha256: lazyResource.serviceWorkerSha256,
      },
    } : {}),
  });
  const splitWorkerPainter = lazyResource?.workerPath !== lazyResource?.path
    && lazyResource?.ownership === 'dedicated-worker-dynamic-import';
  const sealedWorkerPainter = lazyResource?.workerPath === lazyResource?.path
    && lazyResource?.workerSha256 === lazyResource?.sha256
    && lazyResource?.ownership === 'dedicated-worker-sealed-entry';
  add('lazy-art-not-eager', foregroundAuthorityValid && thumbnailSettlementAuthorityValid
    && workerArtDormant(initial) && initial?.diagnostics?.art === null
    && lazyEnd?.diagnostics?.documentToken === initial?.diagnostics?.documentToken
    && workerArtDormant(lazyEnd) && lazyEnd?.diagnostics?.art === null
    && typeof lazyResource?.ownerPath === 'string' && lazyResource.ownerPath.endsWith('.js')
    && lazyResource.ownerPath !== lazyResource.path
    && lazyResource.ownerPath !== lazyResource.workerPath
    && /^[a-f0-9]{64}$/.test(String(lazyResource?.ownerSha256 || ''))
    && typeof lazyResource?.path === 'string' && lazyResource.path.endsWith('.js')
    && /^[a-f0-9]{64}$/.test(String(lazyResource?.sha256 || ''))
    && typeof lazyResource?.workerPath === 'string' && lazyResource.workerPath.endsWith('.js')
    && /^[a-f0-9]{64}$/.test(String(lazyResource?.workerSha256 || ''))
    && (budget?.producerAuthority?.schema === HISTORICAL_COMPENDIUM_PRODUCER_AUTHORITY_SCHEMA
      || lazyResource?.serviceWorkerPath === 'service-worker.js'
        && /^[a-f0-9]{64}$/.test(String(lazyResource?.serviceWorkerSha256 || '')))
    && measuredProducerAuthority !== null
    && validProducerAuthority(budget?.producerAuthority)
    && sameJson(measuredProducerAuthority, budget.producerAuthority)
    && (splitWorkerPainter || sealedWorkerPainter)
    && Array.isArray(lazyResource?.matches) && lazyResource.matches.length === 0
    && Array.isArray(lazyResource?.endMatches) && lazyResource.endMatches.length === 0,
  'the semantically identified species-art executable loaded before a Compendium/Planetside owner requested it, or the exact foreground/thumbnail receipt authority was incomplete',
  {
    loader: initial?.diagnostics?.lazyArt, resource: lazyResource,
    measuredProducerAuthority, expectedProducerAuthority: budget?.producerAuthority,
    pageAuthorities: measurement.pageAuthorities,
    foregroundServices: measurement.phases?.foregroundServices,
    thumbnailSettlements: measurement.phases?.thumbnailSettlements,
  });
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
  const currentBackSchema = isObject(backNavigation)
    && (Object.hasOwn(backNavigation, 'setup') || Object.hasOwn(backNavigation, 'actionWitness'));
  const backActionWitnessValid = currentBackSchema
    && validCompendiumBackActionWitness(backNavigation?.actionWitness, {
      logicalId: measurement.targets?.detail,
      logicalIndex: 777,
      documentToken: measurement.pageAuthorities?.main?.documentToken,
    });
  const backActionAnchor = backActionWitnessValid
    ? backNavigation.actionWitness.events[0].anchor
    : currentBackSchema ? null : backNavigation?.before;
  const backActionWitnessBound = !currentBackSchema || (backActionWitnessValid
    && sameJson(backNavigation?.before, backActionAnchor));
  const backSetupWasDeepAndVisible = !currentBackSchema
    || (backNavigation?.setup?.window?.start > 0
      && backNavigation?.setup?.selectedLogicalId === measurement.targets?.detail
      && backNavigation?.setup?.selectedIndex === 777
      && backNavigation?.setup?.selectedMounted === true
      && backNavigation?.setup?.selectedIntersects === true);
  const backWasDeepAndVisible = backActionAnchor?.window?.start > 0
    && backActionAnchor?.selectedLogicalId === measurement.targets?.detail
    && backActionAnchor?.selectedIndex === 777
    && backActionAnchor?.selectedMounted === true
    && backActionAnchor?.selectedIntersects === true;
  const backAnchorStable = typeof backActionAnchor?.logicalId === 'string'
    && backActionAnchor.logicalId
    && backActionAnchor.logicalId === backNavigation?.after?.logicalId
    && backActionAnchor.logicalId === backNavigation?.afterSettled?.logicalId
    && finite(backActionAnchor.offsetPx) && finite(backNavigation?.after?.offsetPx)
    && finite(backNavigation?.afterSettled?.offsetPx)
    && Math.abs(backActionAnchor.offsetPx - backNavigation.after.offsetPx) <= 2
    && Math.abs(backActionAnchor.offsetPx - backNavigation.afterSettled.offsetPx) <= 2;
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
    && backActionWitnessBound && backSetupWasDeepAndVisible
    && backWasDeepAndVisible && backAnchorStable && backSelectionStable,
  'Back did not restore the trusted action-time selected row and logical top-anchor/offset after two settlements', {
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
  const producerErrorWitness = measurement.phases?.producerErrorWitness;
  add('error-contained', producerErrorContained(producerErrorWitness, profile),
    'one-shot producer failure was not cold-key proven, uniquely published, uncached, and answerable',
    producerErrorWitness);
  add('error-recoverable', producerErrorRecoverable(producerErrorWitness, profile),
    'the exact failed logical identity/key did not complete and become a cached ready 132px row on stable reopen',
    producerErrorWitness);
  add('cap-shrink', points.capShrink?.beforeEntries > points.capShrink?.afterEntries
    && points.capShrink?.afterEntries <= points.capShrink?.phoneLimit
    && points.capShrink?.afterDecodedBytes <= points.capShrink?.phoneDecodedBytesLimit
    && points.capShrink?.beforeDeviceClass === 'desktop'
    && points.capShrink?.afterDeviceClass === 'phone'
    && points.capShrink?.restoredDeviceClass === profile
    && postCapRestored?.diagnostics?.art?.deviceClass === profile
    && settled(postCapRestored) && workerArtReleased(postCapRestored)
    && workerArtFinalEvidence(postCapRestored)
    && postCapRestored?.diagnostics?.art?.live?.subscribers === 0
    && points.capShrink?.disposalsDelta > 0
    && points.capShrink?.warmCyclesSealed === REQUIRED_WARM_CYCLES
    && integer(points.capShrink?.warmTerminalJobStarts)
    && integer(points.capShrink?.beforeJobStarts)
    && points.capShrink.beforeJobStarts >= points.capShrink.warmTerminalJobStarts
    && integer(points.capShrink?.warmTerminalDisposals)
    && integer(points.capShrink?.beforeDisposals)
    && points.capShrink.beforeDisposals >= points.capShrink.warmTerminalDisposals
    && sameJson(measurement.phases?.resourceOrder, [
      'warm-precondition', 'warm-1', 'warm-2', 'warm-3', 'warm-4',
      'cap-before', 'cap-after', 'profile-restored', 'post-cap-restored',
    ]),
  'phone-class trim or post-cap recovered-worker closure failed (entries/decoded bytes/disposal/settlement/release evidence)', points.capShrink);
  add('canvas-thumb-path', finalArt?.totals?.thumbCanvasRenders > 0
    && finalArt.totals.thumbCanvasRenders >= finalArt.totals.jobCompletes,
  'thumb jobs bypassed the owned 132×132 canvas render path', finalArt?.totals);
  const beforeDetail = [points.first, points.middle, points.last, points.filtered].filter(Boolean);
  const afterDetail = [points.detailClosed, points.back, points.focusPinned,
    points.planetside, ...warm, postCapRestored].filter(Boolean);
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
  add('settled-jobs', warm.length >= REQUIRED_WARM_CYCLES
    && selected.every((snapshot) => settled(snapshot) && workerArtReleased(snapshot))
    && workerArtFinalEvidence(final),
  'warm-cycle evidence was short, retained queued/active/worker work, or lacked exact worker phase/error/release proof', {
    warm: warm.map((snapshot) => art(snapshot)?.live),
    worker: final?.diagnostics?.lazyArt,
  });
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
  add('warm-precondition', warm.length === REQUIRED_WARM_CYCLES
    && warmResourceStateReady(warmCachePrecondition, profile)
    && warm.every((snapshot) => warmResourceStateReady(snapshot, profile))
    && stableWarmCacheIdentity(warm)
    && stableWarmReuse(warm)
    && sameJson(measurement.phases?.resourceOrder, [
      'warm-precondition', 'warm-1', 'warm-2', 'warm-3', 'warm-4',
      'cap-before', 'cap-after', 'profile-restored', 'post-cap-restored',
    ]),
  'warm measurements were not taken with a fully closed and empty Compendium DOM, the exact bounded quiescent cache of 17 unleased thumbnails plus the eight distinct ready Planetside leases, exact 132px decoded accounting, zero portraits/work/subscribers, and a released worker', {
    precondition: warmResourceStateEvidence(warmCachePrecondition),
    warm: warm.map(warmResourceStateEvidence),
  });
  const plateauTail = warm.slice(-3);
  const warmHeapAggregateRange = range(plateauTail.map(heapAggregateBytes));
  const warmDecodedRange = range(plateauTail.map((snapshot) => art(snapshot)?.live?.decodedBytes));
  const warmEncodedRange = range(plateauTail.map((snapshot) => art(snapshot)?.live?.encodedBytes));
  add('warm-plateau', warm.length >= REQUIRED_WARM_CYCLES
    && warmHeapAggregateRange <= ceiling.warmHeapAggregateRangeBytesMax
    && warmEncodedRange <= ceiling.warmEncodedBytesRangeMax,
  'settled warm cycles did not plateau within measured ranges', {
    warmHeapAggregateRange, warmDecodedRange, warmEncodedRange,
    ceilings: {
      heapAggregate: ceiling.warmHeapAggregateRangeBytesMax,
      encoded: ceiling.warmEncodedBytesRangeMax,
    },
  });
  const heapMax = maxAt(selected, (snapshot) => snapshot.heap?.usedSize);
  const embedderHeapMax = maxAt(selected, (snapshot) => snapshot.heap?.embedderHeapUsedSize);
  const backingStorageMax = maxAt(selected, (snapshot) => snapshot.heap?.backingStorageSize);
  const heapAggregateMax = maxAt(selected, heapAggregateBytes);
  add('heap-ceiling', heapMax <= ceiling.heapUsedBytesMax
    && embedderHeapMax <= ceiling.embedderHeapUsedBytesMax
    && backingStorageMax <= ceiling.backingStorageBytesMax
    && heapAggregateMax <= ceiling.heapAggregateBytesMax,
  'a Runtime.getHeapUsage used/embedder/backing/aggregate dimension exceeded the measured ceiling', {
    observed: {
      used: heapMax, embedder: embedderHeapMax,
      backing: backingStorageMax, aggregate: heapAggregateMax,
    },
    ceilings: {
      used: ceiling.heapUsedBytesMax, embedder: ceiling.embedderHeapUsedBytesMax,
      backing: ceiling.backingStorageBytesMax, aggregate: ceiling.heapAggregateBytesMax,
    },
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

function validCompleteProfileForegroundServices(measurement, profile) {
  const services = measurement?.phases?.foregroundServices;
  const documentTokens = measurement?.documentTokens;
  const pageAuthorities = measurement?.pageAuthorities;
  const pageAuthorityKeys = ['targetId', 'sessionId', 'documentToken'];
  const validPageAuthority = (authority) => isObject(authority)
    && sameJson(Object.keys(authority).sort(), [...pageAuthorityKeys].sort())
    && pageAuthorityKeys.every((field) => boundedString(authority[field]));
  if (!PROFILES.includes(profile)
    || !Array.isArray(services) || services.length !== FOREGROUND_SERVICE_RECEIPT_LABELS.length
    || !isObject(documentTokens)
    || !sameJson(Object.keys(documentTokens).sort(), ['lazy', 'lazyEnd', 'main'])
    || !['lazy', 'lazyEnd', 'main'].every((field) => boundedString(documentTokens[field]))
    || documentTokens.lazy !== documentTokens.lazyEnd
    || documentTokens.lazy === documentTokens.main
    || !isObject(pageAuthorities)
    || !sameJson(Object.keys(pageAuthorities).sort(), ['lazy', 'main'])
    || !validPageAuthority(pageAuthorities.lazy)
    || !validPageAuthority(pageAuthorities.main)
    || pageAuthorities.lazy.documentToken !== documentTokens.lazy
    || pageAuthorities.main.documentToken !== documentTokens.main
    || pageAuthorities.lazy.targetId === pageAuthorities.main.targetId
    || pageAuthorities.lazy.sessionId === pageAuthorities.main.sessionId) return false;
  for (let index = 0; index < services.length; index += 1) {
    const receipt = services[index];
    const pageAuthority = index === 1 ? pageAuthorities.main : pageAuthorities.lazy;
    if (!validCompendiumForegroundServiceReceipt(
      receipt, FOREGROUND_SERVICE_RECEIPT_LABELS[index],
    )
      || receipt.expected.serviceToken !== `${profile}-compendium-foreground-${index + 1}`
      || !pageAuthorityKeys.every((field) => receipt.expected[field] === pageAuthority[field])) {
      return false;
    }
  }
  const expected = services.map((receipt) => receipt.expected);
  return new Set(expected.map((authority) => authority.serviceToken)).size === services.length
    && services.every((receipt, index) => index === 0
      || receipt.timing.issuedAtMs > services[index - 1].timing.receivedAtMs
      && receipt.timing.receivedAtMs > services[index - 1].timing.receivedAtMs
      && receipt.timing.deadlineMs > services[index - 1].timing.deadlineMs);
}

function completeProfileBrowserProduct(measurement) {
  const probes = measurement?.answerability;
  if (!Array.isArray(probes) || probes.length !== 2) return null;
  const products = probes.map((probe) => probe?.heartbeat?.product);
  return products.every((product) => boundedString(product))
    && products[0] === products[1] ? products[0] : null;
}

function validCompendiumThumbSettlementHistory(history, receipts, {
  profile, pageAuthority, browserProduct, requireComplete = false,
} = {}) {
  if (!Array.isArray(history) || !Array.isArray(receipts)
    || history.length > MAX_THUMB_SETTLEMENT_RECEIPT_HISTORY
    || receipts.length > THUMB_SETTLEMENT_RECEIPT_PLAN.length
    || (requireComplete && receipts.length !== THUMB_SETTLEMENT_RECEIPT_PLAN.length)) {
    return false;
  }
  const latestByPlanIndex = [];
  let priorReceipt = null;
  let priorPlanIndex = -1;
  let expectedAttempt = 0;
  for (const receipt of history) {
    const planIndex = thumbSettlementPlanIndex(receipt?.label);
    if (planIndex === priorPlanIndex) {
      expectedAttempt += 1;
    } else {
      if (planIndex !== priorPlanIndex + 1) return false;
      priorPlanIndex = planIndex;
      expectedAttempt = 1;
    }
    if (receipt?.attempt !== expectedAttempt
      || !validCompendiumThumbSettlementReceipt(receipt, {
        profile, pageAuthority, browserProduct, planIndex,
      })) return false;
    if (priorReceipt !== null
      && (receipt.timing.issuedAtMs <= priorReceipt.timing.receivedAtMs
        || receipt.timing.receivedAtMs <= priorReceipt.timing.receivedAtMs
        || receipt.timing.deadlineMs <= priorReceipt.timing.deadlineMs)) {
      return false;
    }
    latestByPlanIndex[planIndex] = receipt;
    priorReceipt = receipt;
  }
  if (new Set(history.map((receipt) => receipt.expected.receiptToken)).size
    !== history.length
    || latestByPlanIndex.length !== receipts.length) return false;
  for (let planIndex = 0; planIndex < receipts.length; planIndex += 1) {
    if (!sameJson(latestByPlanIndex[planIndex], receipts[planIndex])) return false;
  }
  return !requireComplete
    || latestByPlanIndex.length === THUMB_SETTLEMENT_RECEIPT_PLAN.length;
}

function validCompleteProfileThumbnailSettlements(measurement, profile, browserProduct) {
  const receipts = measurement?.phases?.thumbnailSettlements;
  const history = measurement?.phases?.thumbnailSettlementHistory;
  const foregroundServices = measurement?.phases?.foregroundServices;
  const pageAuthority = measurement?.pageAuthorities?.main;
  if (!PROFILES.includes(profile) || !boundedString(browserProduct)
    || !exactThumbSettlementPageAuthority(pageAuthority)
    || !Array.isArray(receipts)
    || receipts.length !== THUMB_SETTLEMENT_RECEIPT_PLAN.length
    || !validCompendiumThumbSettlementHistory(history, receipts, {
      profile, pageAuthority, browserProduct, requireComplete: true,
    })
    || !Array.isArray(foregroundServices)
    || foregroundServices.length !== FOREGROUND_SERVICE_RECEIPT_LABELS.length
    || !validCompleteProfileForegroundServices(measurement, profile)) return false;
  return history[0].timing.issuedAtMs > foregroundServices[1].timing.receivedAtMs
    && foregroundServices[2].timing.issuedAtMs > history.at(-1).timing.receivedAtMs;
}

function boundedJsonCarrier(value, maxBytes = 131_072) {
  try {
    const encoded = JSON.stringify(value);
    return typeof encoded === 'string' && Buffer.byteLength(encoded, 'utf8') <= maxBytes;
  } catch { return false; }
}

function exactThumbSettlementDecision(decision, observation, expected) {
  if (!isObject(decision)
    || !sameJson(Object.keys(decision).sort(), ['reasons', 'status'])
    || !['ready', 'pending', 'product-error', 'error'].includes(decision.status)
    || !Array.isArray(decision.reasons)
    || decision.reasons.length > MAX_THUMB_SETTLEMENT_REASONS
    || !decision.reasons.every((reason) => boundedString(reason))) return false;
  const recomputed = classifyCompendiumThumbSettlement(observation, expected);
  return sameJson(decision, recomputed);
}

export function validCompendiumActiveThumbSettlement(active, {
  profile, pageAuthority, browserProduct, planIndex,
  allowReadyReceiptFailure = false,
} = {}) {
  const keys = [
    'schema', 'label', 'attempt', 'expected', 'lastObservation',
    'lastDecision', 'lastCommand', 'timing',
  ];
  const timingKeys = ['issuedAtMs', 'deadlineMs', 'receivedAtMs', 'timeoutMs'];
  const planEntry = THUMB_SETTLEMENT_RECEIPT_PLAN[planIndex];
  if (!PROFILES.includes(profile) || !exactThumbSettlementPageAuthority(pageAuthority)
    || typeof allowReadyReceiptFailure !== 'boolean'
    || !exactThumbSettlementPlanEntry(planEntry, planIndex)
    || !isObject(active) || !sameJson(Object.keys(active).sort(), keys.sort())
    || active.schema !== THUMB_SETTLEMENT_ACTIVE_SCHEMA
    || active.label !== planEntry.label
    || !integer(active.attempt) || active.attempt < 1 || active.attempt > 50
    || !thumbSettlementExpected(active.expected)
    || active.expected.surface !== planEntry.surface
    || active.expected.expectedCount !== planEntry.expectedCount
    || ['targetId', 'sessionId', 'documentToken']
      .some((field) => active.expected[field] !== pageAuthority[field])
    || active.expected.receiptToken !== compendiumThumbSettlementReceiptToken(
      profile, planEntry.label, active.attempt,
    )
    || !isObject(active.timing)
    || !sameJson(Object.keys(active.timing).sort(), timingKeys.sort())
    || !finite(active.timing.issuedAtMs) || active.timing.issuedAtMs < 0
    || !finite(active.timing.deadlineMs) || active.timing.deadlineMs < 0
    || active.timing.timeoutMs !== THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS
    || active.timing.deadlineMs
      !== active.timing.issuedAtMs + active.timing.timeoutMs
    || (active.timing.receivedAtMs !== null
      && (!finite(active.timing.receivedAtMs) || active.timing.receivedAtMs < 0))
    || !boundedJsonCarrier(active.lastObservation)) return false;

  if (active.lastCommand === null) {
    return active.lastObservation === null && active.lastDecision === null
      && active.timing.receivedAtMs === null;
  }
  if (!boundedString(browserProduct)
    || !validCandidateCommandEvidence(active.lastCommand)
    || active.lastCommand.profile !== profile
    || active.lastCommand.label !== `${planEntry.label} thumb settlement`
    || active.lastCommand.phaseDeadlineMs !== active.timing.deadlineMs
    || active.lastCommand.issuedAtMs < active.timing.issuedAtMs
    || active.timing.receivedAtMs !== Math.max(
      active.lastCommand.target.completedAtMs, active.lastCommand.heartbeat.completedAtMs,
    )
    || (active.lastCommand.heartbeat.status === 'fulfilled'
      && active.lastCommand.heartbeat.product !== browserProduct)) return false;
  const observedValue = active.lastCommand.target.status === 'fulfilled'
    && active.lastCommand.target.timely === true
    && active.lastCommand.target.resultState === 'value';
  if (!observedValue) {
    return active.lastObservation === null && active.lastDecision === null
      || active.lastDecision !== null
        && exactThumbSettlementDecision(
          active.lastDecision, active.lastObservation, active.expected,
        )
        && active.lastDecision.status !== 'ready';
  }
  return active.lastDecision !== null
    && exactThumbSettlementDecision(
      active.lastDecision, active.lastObservation, active.expected,
    )
    && (active.lastDecision.status !== 'ready' || allowReadyReceiptFailure);
}

function validPartialPageAuthorities(pageAuthorities) {
  if (!isObject(pageAuthorities)
    || !sameJson(Object.keys(pageAuthorities).sort(), ['lazy', 'main'])) return false;
  const lazy = pageAuthorities.lazy;
  const main = pageAuthorities.main;
  if ((lazy !== null && !exactThumbSettlementPageAuthority(lazy))
    || (main !== null && !exactThumbSettlementPageAuthority(main))
    || (main !== null && lazy === null)) return false;
  return lazy === null || main === null
    || lazy.targetId !== main.targetId
      && lazy.sessionId !== main.sessionId
      && lazy.documentToken !== main.documentToken;
}

function validPartialThumbnailSettlements(measurement, profile, browserProduct, failure) {
  const receipts = measurement.thumbnailSettlements;
  const history = measurement.thumbnailSettlementHistory;
  const active = measurement.activeThumbnailSettlement;
  if (!Array.isArray(receipts)
    || !Array.isArray(history)
    || receipts.length > THUMB_SETTLEMENT_RECEIPT_PLAN.length) return false;
  const failingPlanIndex = THUMB_SETTLEMENT_RECEIPT_PLAN.findIndex((entry) =>
    failure.failingStage === `${entry.label} thumb settlement`);
  if (receipts.length === 0 && active === null) {
    return history.length === 0 && failingPlanIndex < 0;
  }
  const pageAuthority = measurement.pageAuthorities.main;
  if (!boundedString(browserProduct) || !exactThumbSettlementPageAuthority(pageAuthority)) {
    return false;
  }
  if (!validCompendiumThumbSettlementHistory(history, receipts, {
    profile, pageAuthority, browserProduct,
  })) return false;
  if (active === null) return failingPlanIndex < 0;
  const priorReceipt = receipts.at(-1) ?? null;
  const priorHistoryReceipt = history.at(-1) ?? null;
  const nextPlanEntry = THUMB_SETTLEMENT_RECEIPT_PLAN[receipts.length] ?? null;
  const nextPlanActive = nextPlanEntry !== null
    && active.label === nextPlanEntry.label && active.attempt === 1;
  const retryActive = priorReceipt !== null && priorHistoryReceipt !== null
    && active.label === priorReceipt.label
    && active.label === priorHistoryReceipt.label
    && active.attempt === priorHistoryReceipt.attempt + 1;
  if (nextPlanActive === retryActive) return false;
  const planIndex = retryActive ? receipts.length - 1 : receipts.length;
  const readyReceiptFailureDiagnosis =
    `${profile} ${active.label}: accepted thumbnail settlement receipt is invalid`;
  const allowReadyReceiptFailure = failure.classification === 'instrument'
    && failure.command === null && active.lastDecision?.status === 'ready'
    && (failure.diagnosis === readyReceiptFailureDiagnosis
      || failure.diagnosis.startsWith(`${readyReceiptFailureDiagnosis}; `));
  if (!validCompendiumActiveThumbSettlement(active, {
    profile, pageAuthority, browserProduct, planIndex, allowReadyReceiptFailure,
  })
    || failure.failingStage !== `${active.label} thumb settlement`
    || (priorHistoryReceipt !== null
      && active.timing.issuedAtMs <= priorHistoryReceipt.timing.receivedAtMs)
    || (failure.command !== null && failure.command?.schema === CANDIDATE_COMMAND_SCHEMA
      && !sameJson(failure.command, active.lastCommand))) return false;
  return !history.some((receipt) =>
    receipt.expected.receiptToken === active.expected.receiptToken);
}

function validCompleteProfileMeasurement(measurement, profile, browserProduct) {
  return isObject(measurement) && measurement.profile === profile
    && isObject(measurement.viewport) && isObject(measurement.fixture)
    && isObject(measurement.documentTokens) && isObject(measurement.points)
    && isObject(measurement.pageAuthorities)
    && isObject(measurement.phases)
    && validProducerErrorWitness(measurement.phases.producerErrorWitness, profile)
    && producerErrorColdProofObservations(measurement.phases.producerErrorWitness)
    && validProducerErrorCandidateLedger({
      profile,
      producerErrorWitness: measurement.phases.producerErrorWitness,
      commandLedger: measurement.phases.producerErrorWitness.commands,
    }, { command: null }, browserProduct)
    && validFilterTransitionSequence(measurement.phases.filterTransitions, {
      requireCompleteSet: true, requireProductSuccess: false,
    })
    && validCurrentBackActionMeasurement(measurement)
    && validCompleteProfileForegroundServices(measurement, profile)
    && validCompleteProfileThumbnailSettlements(measurement, profile, browserProduct)
    && isObject(measurement.lazySpeciesResource)
    && Array.isArray(measurement.answerability)
    && Array.isArray(measurement.reviewPacket);
}

function validPartialProfileMeasurement(
  measurement, profile, runId, verifyArtifact, failure, browserProduct,
) {
  const keys = [
    'schema', 'profile', 'viewport', 'evidenceStatus', 'lastCompletedStage',
    'failingStage', 'completedStages', 'commandLedger', 'producerErrorWitness',
    'filterTransitions', 'reviewPacket', 'diagnosis', 'thumbnailSettlements',
    'thumbnailSettlementHistory', 'activeThumbnailSettlement', 'pageAuthorities',
  ];
  if (!isObject(measurement) || !sameJson(Object.keys(measurement).sort(), keys.sort())
    || measurement.schema !== PARTIAL_PROFILE_SCHEMA || measurement.profile !== profile
    || !isObject(measurement.viewport)
    || measurement.evidenceStatus !== 'partial-non-certifying'
    || !boundedString(measurement.diagnosis, { max: 32_768 })
    || (measurement.lastCompletedStage !== null
      && (typeof measurement.lastCompletedStage !== 'string' || !measurement.lastCompletedStage))
    || typeof measurement.failingStage !== 'string' || !measurement.failingStage
    || !Array.isArray(measurement.completedStages)
    || !measurement.completedStages.every((stage) => typeof stage === 'string' && stage)
    || (measurement.completedStages.includes(measurement.failingStage)
      && !(measurement.activeThumbnailSettlement?.attempt > 1
        && measurement.failingStage
          === `${measurement.activeThumbnailSettlement.label} thumb settlement`))
    || !Array.isArray(measurement.commandLedger)
    || measurement.commandLedger.length > MAX_PARTIAL_COMMAND_LEDGER_ENTRIES
    || !boundedJsonCarrier(measurement.commandLedger, MAX_PARTIAL_COMMAND_LEDGER_BYTES)
    || !measurement.commandLedger.every((command) =>
      validCandidateCommandEvidence(command) || validPlainEvaluateCommand(command)
        || validRawCdpCommand(command))
    || !validPartialPageAuthorities(measurement.pageAuthorities)
    || !validPartialProducerErrorPrefix(measurement, failure)
    || !validProducerErrorCandidateLedger(measurement, failure, browserProduct)
    || !validFilterTransitionSequence(measurement.filterTransitions, { allowPending: true })
    || !validPartialFilterTransitionPrefix(measurement, failure)
    || !validPartialThumbnailSettlements(measurement, profile, browserProduct, failure)
    || !validPartialReviewPacket(measurement.reviewPacket, runId, verifyArtifact)
    || !measurement.reviewPacket.every((item) => item.profile === profile)) return false;
  if (measurement.lastCompletedStage !== (measurement.completedStages.at(-1) ?? null)) return false;
  const thumbStageSet = new Set(THUMB_SETTLEMENT_RECEIPT_PLAN.map(
    (entry) => `${entry.label} thumb settlement`,
  ));
  const completedThumbStages = measurement.completedStages.filter((stage) =>
    thumbStageSet.has(stage));
  const history = measurement.thumbnailSettlementHistory;
  const receiptStages = measurement.thumbnailSettlements.map((receipt) =>
    receipt.command.label);
  const completedThumbPlanIndexes = completedThumbStages.map((stage) =>
    THUMB_SETTLEMENT_RECEIPT_PLAN.findIndex(
      (entry) => `${entry.label} thumb settlement` === stage,
    ));
  if (completedThumbPlanIndexes.some((planIndex, index) =>
    index > 0 && planIndex < completedThumbPlanIndexes[index - 1])) return false;
  const firstCompletedThumbStages = completedThumbStages.filter((stage, index) =>
    completedThumbStages.indexOf(stage) === index);
  const active = measurement.activeThumbnailSettlement;
  if (completedThumbStages.length !== history.length
    || !sameJson(firstCompletedThumbStages, receiptStages)) return false;
  const deadlineGroups = (label) => {
    const commands = measurement.commandLedger.filter((command) =>
      command.schema === CANDIDATE_COMMAND_SCHEMA && command.label === label);
    const groups = [];
    for (const command of commands) {
      const group = groups.at(-1);
      if (!group || group.phaseDeadlineMs !== command.phaseDeadlineMs) {
        if (group && command.phaseDeadlineMs <= group.phaseDeadlineMs) return null;
        groups.push({ phaseDeadlineMs: command.phaseDeadlineMs, commands: [command] });
      } else group.commands.push(command);
    }
    return groups;
  };
  const historyByLabel = new Map();
  for (const receipt of history) {
    const label = receipt.command.label;
    const phaseHistory = historyByLabel.get(label) ?? [];
    phaseHistory.push(receipt);
    historyByLabel.set(label, phaseHistory);
  }
  for (const [label, phaseHistory] of historyByLabel) {
    const groups = deadlineGroups(label);
    const retryInProgress = active !== null && `${active.label} thumb settlement` === label;
    const expectedGroups = phaseHistory.length
      + (retryInProgress && active.lastCommand !== null ? 1 : 0);
    if (groups === null || groups.length !== expectedGroups
      || groups.some((group) => group.commands.length !== 1)
      || countStage(measurement.completedStages, label) !== phaseHistory.length
      || phaseHistory.some((receipt, index) => !sameJson(
        groups[index]?.commands.at(-1), receipt.command,
      ))) return false;
  }
  if (active !== null) {
    const label = `${active.label} thumb settlement`;
    const groups = deadlineGroups(label);
    const acceptedAttempts = historyByLabel.get(label)?.length ?? 0;
    const completedAttempts = countStage(measurement.completedStages, label);
    const expectedGroups = acceptedAttempts + (active.lastCommand === null ? 0 : 1);
    if (groups === null || groups.length !== expectedGroups
      || groups.some((group) => group.commands.length !== 1)
      || acceptedAttempts !== active.attempt - 1
      || completedAttempts !== acceptedAttempts
      || (active.lastCommand !== null
        && !sameJson(groups.at(-1)?.commands.at(-1), active.lastCommand))) return false;
  }
  if (!validSnapshotSubstagePrefix(measurement)) return false;
  if (!validPartialReviewStageDependencies(measurement)) return false;
  const completedReviewStates = measurement.completedStages
    .filter((stage) => stage.startsWith('review ')).map((stage) => stage.slice('review '.length));
  const packetStates = measurement.reviewPacket.map((item) => item.state);
  return sameJson([...completedReviewStates].sort(), [...packetStates].sort())
    && new Set(completedReviewStates).size === completedReviewStates.length;
}

const PARTIAL_SNAPSHOT_STAGE_SUFFIXES = Object.freeze([
  ' animation task', ' garbage collection', ' heap usage',
  ' product/DOM snapshot', ' DOM counters',
]);
const partialSnapshotStageGroup = (base) =>
  PARTIAL_SNAPSHOT_STAGE_SUFFIXES.map((suffix) => `${base}${suffix}`);
const PARTIAL_MILESTONE_SEQUENCE = Object.freeze([
  ...partialSnapshotStageGroup('fresh lazy-control'),
  ...partialSnapshotStageGroup('main initial'),
  'set device class', 'install exact fixture', 'validate exact fixture',
  ...partialSnapshotStageGroup('first rows'),
  'screenshot list', 'review list',
  ...partialSnapshotStageGroup('contracted viewport'),
  ...partialSnapshotStageGroup('expanded viewport'),
  ...partialSnapshotStageGroup('restored viewport'),
  'screenshot focus-pinned', 'review focus-pinned',
  ...partialSnapshotStageGroup('middle rows'),
  ...partialSnapshotStageGroup('last rows'),
  ...partialSnapshotStageGroup('filtered row'),
  ...partialSnapshotStageGroup('detail'),
  'screenshot detail', 'review detail',
  ...partialSnapshotStageGroup('detail Close'),
  ...partialSnapshotStageGroup('Back'),
  ...partialSnapshotStageGroup('focused off-window row'),
  ...partialSnapshotStageGroup('closed cleanup'),
  ...partialSnapshotStageGroup('Planetside'),
  ...partialSnapshotStageGroup('warm cache precondition'),
  ...partialSnapshotStageGroup('warm cycle 1'),
  ...partialSnapshotStageGroup('warm cycle 2'),
  ...partialSnapshotStageGroup('warm cycle 3'),
  ...partialSnapshotStageGroup('warm cycle 4'),
  ...partialSnapshotStageGroup('post-cap restored'),
  ...partialSnapshotStageGroup('final lazy-control'),
]);
const PARTIAL_MILESTONE_SET = new Set(PARTIAL_MILESTONE_SEQUENCE);

/* Project every retained snapshot/review milestone onto the exact source
   order. This makes the partial carrier a prefix rather than an unordered
   bag: whole snapshot groups, screenshot-before-review order, duplicates,
   and deleted boot/resize/detail/warm prerequisites all fail closed. */
function validPartialReviewStageDependencies(measurement) {
  const observed = measurement.completedStages.filter((stage) =>
    PARTIAL_MILESTONE_SET.has(stage));
  if (!sameJson(observed, PARTIAL_MILESTONE_SEQUENCE.slice(0, observed.length))) {
    return false;
  }
  const failingMilestoneIndex = PARTIAL_MILESTONE_SEQUENCE.indexOf(measurement.failingStage);
  if (failingMilestoneIndex >= 0 && failingMilestoneIndex !== observed.length) return false;
  const completedThrough = (stage) => {
    const index = PARTIAL_MILESTONE_SEQUENCE.indexOf(stage);
    return index >= 0 && observed.length > index;
  };
  const reachedMilestone = (stage) => {
    const index = PARTIAL_MILESTONE_SEQUENCE.indexOf(stage);
    return index >= 0 && (observed.length > index || failingMilestoneIndex >= index);
  };
  const stageBefore = (left, right) => countStage(measurement.completedStages, left) === 1
    && countStage(measurement.completedStages, right) === 1
    && measurement.completedStages.indexOf(left) < measurement.completedStages.indexOf(right);
  if (measurement.producerErrorWitness !== null) {
    if (!completedThrough('validate exact fixture')) return false;
    const producerStages = producerErrorStages(measurement.profile);
    const preArmIndex = measurement.completedStages.indexOf(producerStages.preArm);
    const validateIndex = measurement.completedStages.indexOf('validate exact fixture');
    if ((preArmIndex >= 0 && validateIndex >= preArmIndex)
      || (measurement.failingStage === producerStages.preArm
        && measurement.lastCompletedStage !== 'validate exact fixture')) return false;
  }
  if (measurement.filterTransitions.length > 0
    && !completedThrough('review focus-pinned')) return false;
  if (reachedMilestone('first rows animation task')) {
    const producerStages = producerErrorStages(measurement.profile);
    if (measurement.producerErrorWitness === null
      || !stageBefore('validate exact fixture', producerStages.preArm)
      || !stageBefore(producerStages.recovery, 'first rows animation task')) return false;
  }
  const filterBounds = [
    {
      nextMilestone: 'middle rows animation task', previous: 'review focus-pinned', index: 0,
    },
    {
      nextMilestone: 'filtered row animation task', previous: 'last rows DOM counters', index: 1,
    },
    {
      nextMilestone: 'detail animation task', previous: 'filtered row DOM counters', index: 2,
    },
  ];
  for (const bound of filterBounds) {
    const expectation = FILTER_TRANSITION_EXPECTATIONS[bound.index];
    const ordered = filterTransitionOrderedStages(expectation);
    const terminal = filterTransitionTerminalStage(expectation);
    const failureOwner = filterTransitionFailureOwner(measurement.failingStage);
    const transitionPresent = measurement.filterTransitions.length > bound.index
      || failureOwner?.index === bound.index;
    if (transitionPresent) {
      if (countStage(measurement.completedStages, bound.previous) !== 1
        || (measurement.failingStage !== ordered[0]
          && !stageBefore(bound.previous, ordered[0]))) return false;
    }
    if (reachedMilestone(bound.nextMilestone)
      && (measurement.filterTransitions.length <= bound.index
        || !stageBefore(terminal, bound.nextMilestone))) return false;
  }
  return true;
}

/* A snapshot is one indivisible evidence transaction at the report layer, but
   the collector deliberately records its rAF -> GC -> heap -> product -> DOM
   CDP substages. A failure at a later substage cannot truthfully omit or
   reorder the exact earlier prefix. */
function validSnapshotSubstagePrefix(measurement) {
  const suffixes = PARTIAL_SNAPSHOT_STAGE_SUFFIXES;
  const stagePart = (stage) => {
    const position = suffixes.findIndex((suffix) => stage.endsWith(suffix));
    return position < 0 ? null : {
      position, base: stage.slice(0, -suffixes[position].length),
    };
  };
  for (let index = 0; index < measurement.completedStages.length; index += 1) {
    const part = stagePart(measurement.completedStages[index]);
    if (!part || !part.base) continue;
    if (countStage(measurement.completedStages, measurement.completedStages[index]) !== 1) {
      return false;
    }
    for (let position = 0; position <= part.position; position += 1) {
      if (measurement.completedStages[index - part.position + position]
        !== `${part.base}${suffixes[position]}`) return false;
    }
    if (part.position < suffixes.length - 1) {
      const next = `${part.base}${suffixes[part.position + 1]}`;
      if (measurement.completedStages[index + 1] !== next
        && !(index === measurement.completedStages.length - 1
          && measurement.failingStage === next)) return false;
    }
  }
  const failingPart = stagePart(measurement.failingStage);
  if (!failingPart) return true;
  const { position, base } = failingPart;
  if (!base) return false;
  const expected = suffixes.slice(0, position).map((suffix) => `${base}${suffix}`);
  return countStage(measurement.completedStages, measurement.failingStage) === 0
    && (expected.length === 0
      || sameJson(measurement.completedStages.slice(-expected.length), expected))
    && expected.every((stage) => countStage(measurement.completedStages, stage) === 1);
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
    'failingStage', 'command', 'diagnosis',
  ];
  if (!isObject(failure) || !sameJson(Object.keys(failure).sort(), keys.sort())
    || failure.schema !== PARTIAL_FAILURE_SCHEMA
    || !['product-unanswerable', 'product-fail', 'instrument']
      .includes(failure.classification)
    || !boundedString(failure.diagnosis, { max: 32_768 })
    || (failure.profile !== null && !PROFILES.includes(failure.profile))
    || (failure.lastCompletedStage !== null
      && (typeof failure.lastCompletedStage !== 'string' || !failure.lastCompletedStage))
    || typeof failure.failingStage !== 'string' || !failure.failingStage
    || !isObject(report.profiles)
    || Object.keys(report.profiles).some((profile) => !PROFILES.includes(profile))
    || !validPartialReviewPacket(report.reviewPacket, expectedRunId, verifyArtifact)
    || !sameReviewPacket(report.reviewPacket, profileReviewPacket(report.profiles))) return false;
  const diagnosisPrefix = failure.classification === 'instrument'
    ? 'instrument' : 'product';
  if (!sameJson(report.findings, [`${diagnosisPrefix}: ${failure.diagnosis}`])) return false;
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
  const productErrorProfiles = [];
  for (const [profile, measurement] of Object.entries(report.profiles)) {
    if (measurement?.schema === PARTIAL_PROFILE_SCHEMA) {
      partialCount += 1;
      if (!validPartialProfileMeasurement(
        measurement, profile, expectedRunId, verifyArtifact, failure,
        report.browser?.product,
      )
        || profile !== failure.profile
        || measurement.diagnosis !== failure.diagnosis
        || measurement.lastCompletedStage !== failure.lastCompletedStage
        || measurement.failingStage !== failure.failingStage
        || !validPartialCommandLedger(
          measurement, failure, report.browser?.product,
        )) return false;
      if (measurement.activeThumbnailSettlement?.lastDecision?.status === 'product-error') {
        productErrorProfiles.push(profile);
      }
    } else if (!validCompleteProfileMeasurement(
      measurement, profile, report.browser?.product,
    )) return false;
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
  if (failure.classification === 'product-fail') {
    const measurement = report.profiles[failure.profile];
    const active = measurement?.activeThumbnailSettlement;
    return failure.profile !== null
      && failure.command === null
      && sameJson(productErrorProfiles, [failure.profile])
      && active?.lastDecision?.status === 'product-error'
      && failure.failingStage === `${active.label} thumb settlement`
      && failure.diagnosis
        === compendiumThumbSettlementProductErrorDiagnosis(failure.profile, active.label);
  }
  if (productErrorProfiles.length !== 0) return false;
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

function validProfileMeasurements(profiles, browserProduct) {
  if (!isObject(profiles)
    || !sameJson(Object.keys(profiles).sort(), [...PROFILES].sort())) return false;
  return PROFILES.every((profile) =>
    validCompleteProfileMeasurement(profiles[profile], profile, browserProduct));
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

function completeProducerErrorEvidenceBound(profiles, outcomes) {
  if (!isObject(profiles) || !Array.isArray(outcomes)) return false;
  return PROFILES.every((profile) => {
    const witness = profiles[profile]?.phases?.producerErrorWitness;
    const contained = outcomes.find((outcome) =>
      outcome?.id === `${profile}/error-contained`);
    const recoverable = outcomes.find((outcome) =>
      outcome?.id === `${profile}/error-recoverable`);
    return (producerErrorContained(witness, profile) || contained?.status === 'fail')
      && (producerErrorRecoverable(witness, profile) || recoverable?.status === 'fail');
  });
}

function validBrowserProvenance(browser) {
  const fields = [
    'executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version',
  ];
  return isObject(browser) && fields.every((field) =>
    typeof browser[field] === 'string' && browser[field].length > 0)
    && absoluteExecutable(browser.executable);
}

function validateReportBudgetAuthority(report, errors) {
  const budget = report.budget;
  const keys = [
    'status', 'path', 'sha256', 'browserAuthority', 'browserAuthorityMatch',
    'producerAuthority', 'observedProducerAuthority', 'producerAuthorityMatch',
  ];
  if (!isObject(budget) || !sameJson(Object.keys(budget).sort(), keys.sort())
    || !['unavailable', 'calibration-required', 'active'].includes(budget.status)
    || budget.path !== 'budgets/compendium-memory-v1.json'
    || !/^[a-f0-9]{64}$/.test(String(budget.sha256 || ''))
    || !(budget.browserAuthority === null
      || validCompendiumBrowserAuthority(budget.browserAuthority))
    || !(budget.browserAuthorityMatch === null
      || typeof budget.browserAuthorityMatch === 'boolean')
    || !(budget.producerAuthority === null || validProducerAuthority(budget.producerAuthority))
    || !(budget.observedProducerAuthority === null
      || validProducerAuthority(budget.observedProducerAuthority))
    || !(budget.producerAuthorityMatch === null
      || typeof budget.producerAuthorityMatch === 'boolean')) {
    errors.push('report budget/browser/producer authority evidence is incomplete');
    return;
  }
  const hasBrowser = validBrowserProvenance(report.browser);
  const expectedMatch = hasBrowser && budget.browserAuthority !== null
    ? compendiumBrowserAuthorityMatches(report.browser, budget.browserAuthority) : null;
  if (budget.browserAuthorityMatch !== expectedMatch) {
    errors.push('report browserAuthorityMatch does not match recorded browser provenance');
  }
  const expectedProducerMatch = budget.producerAuthority !== null
    && budget.observedProducerAuthority !== null
    ? sameJson(budget.producerAuthority, budget.observedProducerAuthority) : null;
  if (budget.producerAuthorityMatch !== expectedProducerMatch) {
    errors.push('report producerAuthorityMatch does not match the recorded built graph');
  }
  const browserMeasuredOutcome = hasBrowser
    && ['pass', 'fail', 'calibration', 'product-unanswerable', 'product-fail']
      .includes(report.status);
  if (browserMeasuredOutcome && budget.browserAuthorityMatch !== true) {
    errors.push('complete Compendium outcome lacks the Arc 1A browser compatibility authority');
  }
  if (report.status === 'instrument-fail' && budget.browserAuthorityMatch === false) {
    const exactAuthorityMismatch = report.partialFailure?.classification === 'instrument'
      && report.partialFailure?.profile === null
      && report.partialFailure?.lastCompletedStage === null
      && report.partialFailure?.failingStage === 'Arc 1A browser compatibility authority'
      && report.partialFailure?.command === null
      && isObject(report.profiles) && Object.keys(report.profiles).length === 0
      && Array.isArray(report.reviewPacket) && report.reviewPacket.length === 0;
    if (!exactAuthorityMismatch) {
      errors.push('browser-authority mismatch was not terminal before product measurement');
    }
  }
  const completeProducerOutcome = [
    'pass', 'fail', 'calibration', 'product-unanswerable', 'product-fail',
  ]
    .includes(report.status);
  if (completeProducerOutcome && budget.producerAuthorityMatch !== true) {
    errors.push('complete Compendium outcome lacks the exact built producer authority');
  }
  if (report.status === 'instrument-fail' && budget.producerAuthorityMatch === false) {
    const exactProducerMismatch = report.partialFailure?.classification === 'instrument'
      && report.partialFailure?.profile === null
      && report.partialFailure?.lastCompletedStage === null
      && report.partialFailure?.failingStage === 'Arc 1A producer authority'
      && report.partialFailure?.command === null
      && report.browser === null
      && isObject(report.profiles) && Object.keys(report.profiles).length === 0
      && Array.isArray(report.reviewPacket) && report.reviewPacket.length === 0;
    if (!exactProducerMismatch) {
      errors.push('producer-authority mismatch was not terminal before browser/product measurement');
    }
  }
}

export function verifyTerminalReport(report, expectedRunId, {
  allowCalibration = false, verifyArtifact = null,
  budgetRecord = null, expectedBudgetSha256 = null,
  fixture = null, expectedInputs = null, expectedSourceIdentity = null,
} = {}) {
  const errors = [];
  if (!isObject(report)) return { ok: false, errors: ['report must be an object'] };
  if (report.schema !== REPORT_SCHEMA) errors.push(`report schema must be ${REPORT_SCHEMA}`);
  if (report.runId !== expectedRunId) errors.push('report runId is not the requested current run');
  const terminal = allowCalibration
    ? ['pass', 'fail', 'instrument-fail', 'product-unanswerable', 'product-fail', 'calibration']
    : ['pass', 'fail', 'instrument-fail', 'product-unanswerable', 'product-fail'];
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
  validateReportBudgetAuthority(report, errors);
  if (budgetRecord !== null) {
    const expectedAuthority = compendiumBudgetBrowserAuthority(budgetRecord);
    if (report.budget?.status !== budgetRecord?.status) {
      errors.push('report budget status does not match the exact budget record');
    }
    if (!sameJson(report.budget?.browserAuthority ?? null, expectedAuthority)) {
      errors.push('report Arc 1A browser compatibility authority does not match the budget record');
    }
    if (!sameJson(report.budget?.producerAuthority ?? null,
      budgetRecord?.producerAuthority ?? null)) {
      errors.push('report producer authority does not match the exact budget record');
    }
    if (!/^[a-f0-9]{64}$/.test(String(expectedBudgetSha256 || ''))
      || report.budget?.sha256 !== expectedBudgetSha256
      || report.inputs?.budget !== expectedBudgetSha256) {
      errors.push('report budget hash does not match the exact verified budget bytes');
    }
    if (!isObject(expectedInputs)
      || !sameJson(Object.keys(expectedInputs), REPORT_INPUT_KEYS)
      || !sameJson(report.inputs, expectedInputs)) {
      errors.push('report inputs do not match the exact current input bytes');
    }
    if (!isObject(expectedSourceIdentity)
      || !sameSourceIdentity(report.source?.begin, expectedSourceIdentity)
      || !sameSourceIdentity(report.source?.end, expectedSourceIdentity)) {
      errors.push('report source does not match the exact current source identity');
    }
  }
  if (['instrument-fail', 'product-unanswerable', 'product-fail'].includes(report.status)) {
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
      if (report.partialFailure?.classification !== report.status
        || report.findings.some((finding) => typeof finding !== 'string'
          || !finding.startsWith('product: '))) {
        errors.push(`${report.status} report classification or diagnosis is invalid`);
      }
      if (!validCommittedSourceIdentity(report.source?.begin)
        || !validCommittedSourceIdentity(report.source?.end)) {
        errors.push(`${report.status} evidence requires one clean committed source identity`);
      }
      if (!validBrowserProvenance(report.browser)) {
        errors.push(`${report.status} browser provenance is incomplete`);
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
  if (!validProfileMeasurements(report.profiles, report.browser?.product)) {
    errors.push('raw phone/desktop profile measurements are incomplete');
  }
  const replayBudget = budgetRecord?.status === 'active' && ['pass', 'fail'].includes(report.status)
    ? budgetRecord
    : budgetRecord?.status === 'calibration-required'
      && ['calibration', 'fail'].includes(report.status)
      && allowCalibration
      ? compendiumCalibrationEvaluatorBudget(budgetRecord.producerAuthority) : null;
  if (replayBudget !== null) {
    const fixtureBound = isObject(fixture)
      && Array.isArray(fixture.rows) && fixture.rows.length === 1500
      && fixture.rowsSha256 === budgetRecord.fixture?.rowsSha256
      && report.inputs?.fixtureRows === fixture.rowsSha256;
    if (!fixtureBound) {
      errors.push('outcome replay lacks the exact bound 1,500-row fixture');
    } else {
      try {
        const replayedOutcomes = PROFILES.flatMap((profile) =>
          evaluateProfile(report.profiles?.[profile], replayBudget, fixture));
        if (!sameJson(replayedOutcomes, report.outcomes)) {
          errors.push('reported outcomes do not exactly match replay from raw profiles and bound budget mode');
        }
      } catch (error) {
        errors.push(`outcome replay failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  if (!completeFilterProductEvidenceBound(report.profiles, report.outcomes)) {
    errors.push('raw native-filter product evidence is not bound to generation-guard FAIL');
  }
  if (!completeProducerErrorEvidenceBound(report.profiles, report.outcomes)) {
    errors.push('raw producer-error evidence is not bound to contained/recoverable FAIL');
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
  if (report.status === 'fail') {
    if (!failed.length) errors.push('FAIL report contains no failed outcome');
    const expectedFindings = failed.map((outcome) => outcome.diagnosis);
    if (!sameJson(report.findings, expectedFindings)) {
      errors.push('FAIL findings do not exactly match ordered failed-outcome diagnoses');
    }
  }
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
    measurement.points?.planetside, measurement.phases?.warmCachePrecondition,
    measurement.points?.postCapRestored,
    resize?.base, resize?.contracted, resize?.expanded, resize?.restored,
    ...(measurement.points?.warm || [])].filter(Boolean);
  const tail = (measurement.points?.warm || []).slice(-3);
  return {
    mountedRows: maxAt(selected, (snapshot) => snapshot.raw?.mountedRowCount),
    heapUsedBytes: maxAt(selected, (snapshot) => snapshot.heap?.usedSize),
    documents: maxAt(selected, (snapshot) => snapshot.dom?.documents),
    nodes: maxAt(selected, (snapshot) => snapshot.dom?.nodes),
    embedderHeapUsedBytes: maxAt(selected,
      (snapshot) => snapshot.heap?.embedderHeapUsedSize),
    backingStorageBytes: maxAt(selected,
      (snapshot) => snapshot.heap?.backingStorageSize),
    heapAggregateBytes: maxAt(selected, heapAggregateBytes),
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
    warmHeapAggregateRangeBytes: range(tail.map(heapAggregateBytes)),
    warmEncodedBytesRange: range(tail.map((snapshot) => art(snapshot)?.live?.encodedBytes)),
  };
}
