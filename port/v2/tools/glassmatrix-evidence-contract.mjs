/* Pure terminal-evidence contract shared by Glass and Arc 4 recovery.

   Keep this module free of CLI parsing, browser launch, filesystem access, and
   process state. A downstream certificate can then re-prove the complete
   Glass outcome/control inventory instead of trusting summary booleans. */

import { assessF4HeartbeatCycleReceipt } from './arc4-browser-contract.mjs';

export const GLASS_MATRIX_REPORT_SCHEMA = 'cf-v2-glassmatrix/v2';
export const GLASS_MATRIX_LEGACY_REPORT_SCHEMA = 'cf-v2-glassmatrix/v1';

export const GLASS_MATRIX_VIEWPORTS = Object.freeze([
  { width: 320, height: 568, dpr: 2, mobile: true, label: 'small-phone' },
  { width: 360, height: 640, dpr: 2, mobile: true, label: 'compact-phone' },
  { width: 390, height: 844, dpr: 3, mobile: true, label: 'primary-phone' },
  { width: 412, height: 915, dpr: 3, mobile: true, label: 'large-phone' },
  { width: 844, height: 390, dpr: 2, mobile: true, label: 'phone-landscape', safe: { top: 0, right: 44, bottom: 21, left: 44 } },
  { width: 768, height: 1024, dpr: 2, mobile: true, label: 'tablet-portrait' },
  { width: 1024, height: 768, dpr: 2, mobile: true, label: 'tablet-landscape' },
  { width: 1280, height: 720, dpr: 1, mobile: false, label: 'laptop-720p' },
  { width: 1440, height: 900, dpr: 1, mobile: false, label: 'desktop' },
  { width: 1920, height: 1080, dpr: 1, mobile: false, label: 'desktop-1080p' },
  { width: 2560, height: 1080, dpr: 1, mobile: false, label: 'ultrawide' },
  { width: 7680, height: 4320, dpr: 1, mobile: false, label: 'desktop-8k' },
]);

export const GLASS_NEGATIVE_CONTROLS = Object.freeze([
  'target-floor', 'visible-focus', 'accessible-name', 'keyboard-reachability',
  'centre-hit-test', 'text-contrast', 'glass-fallback', 'populated-copy',
  'viewport-fit', 'safe-area-override', 'viewport-metrics', 'surface-overlap',
  'scene-transform-delta', 'canvas-css-fit', 'canvas-backing-density',
  'non-glass-background-chain', 'preference-computed-outcome',
  'settings-pressed-focus', 'settings-creature-voice-control',
  'settings-audio-non-replay', 'settings-close-gutter-clearance',
  'guide-render-focus', 'motion-css-policy',
  'ordinary-panel-centre-close', 'dpr-card-preservation',
  'opener-expanded-controls', 'dock-toggle-pressed', 'survey-expanded-controls',
  'pseudo-placeholder-contrast', 'cumulative-opacity-contrast', 'control-on-off-contrast',
  'typography-no-shrink-hierarchy', 'backing-pixel-ceiling', 'forced-colors-system-mapping',
  'panel-open-focus', 'hp-label-dual-background', 'clipped-without-scroll',
  'training-focused-action-visibility', 'settings-horizontal-overflow',
  'planetside-surface-ownership', 'panel-planetside-layering',
  'mobile-chrome-yield-restore', 'mobile-landscape-surface-chrome-yield', 'planetside-top-chrome-clearance',
  'planetside-portrait-band-viability', 'planetside-portrait-trail-fallback',
  'mobile-surface-objective-yield',
  'modal-background-containment-restore', 'modal-live-error', 'panel-close-accessible-name',
  'hidden-panel-opener-focus-fallback',
  'replacement-document-loader-token-phase',
  'import-phase-sequence',
  'replacement-ticker-quiescence',
  'replacement-boot-phase-sequence',
  'reload-resource-release',
  'reload-audio-release',
  'ready-confirmation-heartbeat',
  'ready-confirmation-ticker-progress',
  'nonmodal-dock-button-contrast',
  'phone-dock-inventory',
  'phone-dock-exact-membership',
  'inventory-control-floor',
  'inventory-missing-row',
  'inventory-duplicate-row',
  'inventory-raw-authority-parity',
  'inventory-disabled-pager-contrast',
  'inventory-condition-wording',
  'inventory-modal-duplication',
  'inventory-modal-retention',
  'inventory-modal-focus',
  'inventory-focus-wrap',
  'inventory-protected-action',
  'inventory-action-publication',
  'inventory-convergence-retry',
  'shipyard-preview-uniqueness',
  'shipyard-dom-state-parity',
  'shipyard-contact-effect-oracle',
  'shipyard-close-release',
  'shipyard-opener-path',
  'shipyard-geometry-focus',
  'arc4-capture-full-pool-copy',
  'arc4-capture-model-disabled-parity',
  'arc4-capture-earth-title',
  'arc4-capture-roster-counts',
  'arc4-capture-roster-fingerprint',
  'arc4-capture-yield',
  'arc4-capture-tame-odds',
  'arc4-capture-scavenge-odds',
  'arc4-capture-sample-odds',
  'arc4-capture-native-survey-return',
  'arc4-capture-ownership-mutation',
  'arc4-capture-session-rng-mutation',
  'arc4-capture-receipt-mutation',
  'arc4-capture-epoch-mutation',
  'arc4-capture-v4-counter-mutation',
  'arc4-capture-native-activation',
  'arc4-capture-control-overlap',
  'orbital-mineral-survey-disclosure',
  'orbital-title-semantic-copy',
  'orbital-row-containment-restore',
  'rarity-opaque-contrast',
  'ultra-viewport-render-budget',
  'ultra-same-backing-resize',
]);

export const GLASS_ARC4_CAPTURE_OUTCOME_CODES = Object.freeze([
  'ARC4_CAPTURE_NATIVE_SURVEY_RETURN',
  'ARC4_CAPTURE_PRESENTATION_TRUTH',
  'ARC4_CAPTURE_GEOMETRY_FOCUS',
]);

/* These are the complete Node-assessor result keys emitted for each retained
   Arc 4 outcome. A terminal certificate may not replace them with an
   unrelated all-true object or silently omit one of the production clauses. */
export const GLASS_ARC4_CAPTURE_CHECK_KEYS = Object.freeze({
  ARC4_CAPTURE_NATIVE_SURVEY_RETURN: Object.freeze([
    'captured', 'setupCloseTrusted', 'openerTrusted', 'idleKeyboardFocus',
    'closeTrusted', 'openerReturn', 'reopenTrusted', 'noCaptureActivation',
    'surfaceUnchanged', 'planetsideUnchanged', 'captureUnchanged',
    'persistenceUnchanged',
  ]),
  ARC4_CAPTURE_PRESENTATION_TRUTH: Object.freeze([
    'captured', 'uiComplete', 'surfaceRoute', 'homeworldTitle', 'epochExact',
    'rosterCounts', 'rosterFingerprint', 'contextIdentity', 'verbsExact',
    'tameOdds', 'scavengeOdds', 'sampleOdds', 'yieldExact', 'fullPoolCopy',
    'modelDisabledParity',
  ]),
  ARC4_CAPTURE_GEOMETRY_FOCUS: Object.freeze([
    'captured', 'commonLayoutCoordinates', 'viewport', 'uiComplete',
    'oneSurfaceOneClose', 'horizontalContainment',
    'stackedSurfaceSeparation', 'controlsExact', 'noControlOverlap',
    'closeGeometry', 'closeFocus', 'pendingFocus', 'settlementFocus',
    'controlsGeometry',
  ]),
});

const exactJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const fullSha = (value) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const codeUnitCompare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const CHROMIUM_PRODUCT = /^(?:Chrome|Edg)\/(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const exactKeys = (value, keys) => record(value)
  && exactJson(Object.keys(value).sort(codeUnitCompare), [...keys].sort(codeUnitCompare));
const nonEmpty = (value) => typeof value === 'string' && value.length > 0;
const exactNonBlank = (value) => nonEmpty(value) && value === value.trim();

const SHIPYARD_KEYBOARD_DESCRIPTOR_KEYS = Object.freeze([
  'tag', 'id', 'focusKey', 'surveyClose', 'captureAction',
  'engineeringSection', 'accessibleName',
]);
const SHIPYARD_KEYBOARD_INSTRUMENT_CHECK_KEYS = Object.freeze([
  'heartbeatRequirement', 'setupCarrier', 'setupDocument', 'setupQueryWitness',
  'setupDescriptor', 'receiptCarrier', 'trustedEnter', 'documentIdentity',
  'currentQueryWitness', 'receiptDescriptors', 'heartbeatLifecycle',
  'heartbeatCycleCarrier', 'shipyardRefreshCompleted',
  'heartbeatReplacementScenario', 'heartbeatReceiptReplacementCoherence',
  'heartbeatCurrentDescriptor',
]);
const SHIPYARD_KEYBOARD_PRODUCT_CHECK_KEYS = Object.freeze([
  'setupReady', 'currentTarget', 'semanticIdentity', 'eventOrigin',
  'activeTarget', 'replacementLineage', 'heartbeatFocusRestored',
  'heartbeatSemanticIdentity',
]);

function shipyardKeyboardDescriptor(value) {
  return exactKeys(value, SHIPYARD_KEYBOARD_DESCRIPTOR_KEYS)
    && value.tag === 'SUMMARY'
    && value.id === null
    && value.focusKey === 'section:mining'
    && value.surveyClose === false
    && value.captureAction === null
    && value.engineeringSection === 'mining'
    && exactNonBlank(value.accessibleName);
}

function shipyardKeyboardDescriptorMatches(value, expected) {
  return shipyardKeyboardDescriptor(value)
    && SHIPYARD_KEYBOARD_DESCRIPTOR_KEYS
      .every((key) => value[key] === expected[key]);
}

function rectAtLeast44(value) {
  return Array.isArray(value) && value.length === 4
    && value.every(Number.isFinite)
    && value[2] - value[0] >= 44
    && value[3] - value[1] >= 44;
}

export function shipyardKeyboardHeartbeatInventoryErrors(inventory) {
  const errors = [];
  const outcomes = inventory?.outcomes;
  if (!exactKeys(inventory, [
    'plannedViewports', 'complete', 'expectedCount', 'observedCount', 'omitted', 'outcomes',
  ])
    || !exactJson(inventory.plannedViewports, ['large-phone'])
    || inventory.complete !== true || inventory.expectedCount !== 1
    || inventory.observedCount !== 1 || !exactJson(inventory.omitted, [])
    || !Array.isArray(outcomes) || outcomes.length !== 1) {
    return ['Glass Shipyard keyboard heartbeat inventory is malformed or incomplete'];
  }
  const row = outcomes[0];
  const setup = row?.setup;
  const heartbeat = row?.heartbeat;
  const receipt = row?.receipt;
  const outcome = row?.outcome;
  const documentToken = setup?.documentToken;
  const documentHref = setup?.documentHref;
  const setupDescriptor = SHIPYARD_KEYBOARD_DESCRIPTOR_KEYS
    .reduce((value, key) => ({ ...value, [key]: setup?.[key] }), {});
  const setupOk = exactKeys(setup, [
    'schema', 'ok', 'selector', 'documentToken', 'documentHref', 'targetCount',
    'instrumentReady', 'productReady', 'targetConnected', 'focused', 'visible',
    ...SHIPYARD_KEYBOARD_DESCRIPTOR_KEYS, 'display', 'visibility', 'opacity',
    'effectiveOpacity', 'rect',
  ])
    && setup.schema === 'cf-v2-glass-keyboard-activation-setup/v1'
    && setup.ok === true
    && setup.selector === '#shipyardpanel details[data-engineering-section="mining"] > summary'
    && nonEmpty(documentToken) && nonEmpty(documentHref)
    && setup.targetCount === 1 && setup.instrumentReady === true
    && setup.productReady === true && setup.targetConnected === true
    && setup.focused === true && setup.visible === true
    && nonEmpty(setup.display) && setup.display !== 'none'
    && setup.visibility === 'visible'
    && Number.isFinite(setup.opacity) && setup.opacity > 0
    && Number.isFinite(setup.effectiveOpacity) && setup.effectiveOpacity > 0
    && rectAtLeast44(setup.rect) && shipyardKeyboardDescriptor(setupDescriptor);
  const snapshotKeys = [
    'documentToken', 'documentHref', 'heartbeatRunning', 'currentCount',
    'currentConnected', 'currentFocused', 'current',
    'originalTargetDisconnected', 'replacementAcquired',
  ];
  const initialOk = exactKeys(heartbeat?.initial, snapshotKeys)
    && heartbeat.initial.documentToken === documentToken
    && heartbeat.initial.documentHref === documentHref
    && heartbeat.initial.heartbeatRunning === true
    && heartbeat.initial.currentCount === 1
    && heartbeat.initial.currentConnected === true
    && heartbeat.initial.currentFocused === true
    && heartbeat.initial.originalTargetDisconnected === false
    && heartbeat.initial.replacementAcquired === false
    && shipyardKeyboardDescriptorMatches(heartbeat.initial.current, setupDescriptor);
  const afterOk = exactKeys(heartbeat?.after, snapshotKeys)
    && heartbeat.after.documentToken === documentToken
    && heartbeat.after.documentHref === documentHref
    && heartbeat.after.heartbeatRunning === true
    && heartbeat.after.currentCount === 1
    && heartbeat.after.currentConnected === true
    && heartbeat.after.currentFocused === true
    && heartbeat.after.originalTargetDisconnected === true
    && heartbeat.after.replacementAcquired === true
    && shipyardKeyboardDescriptorMatches(heartbeat.after.current, setupDescriptor);
  const cycle = assessF4HeartbeatCycleReceipt(heartbeat?.cycleReceipt, documentToken);
  const heartbeatOk = exactKeys(heartbeat, [
    'schema', 'required', 'stateFound', 'seamsAvailable', 'setupDocumentToken',
    'setupDocumentHref', 'initial', 'quiescence', 'resume', 'cycleReceipt',
    'after', 'cleanup', 'error',
  ])
    && heartbeat.schema === 'cf-v2-glass-keyboard-activation-heartbeat/v1'
    && heartbeat.required === true && heartbeat.stateFound === true
    && heartbeat.seamsAvailable === true
    && heartbeat.setupDocumentToken === documentToken
    && heartbeat.setupDocumentHref === documentHref
    && initialOk
    && exactKeys(heartbeat.quiescence, [
      'schema', 'documentToken', 'wasRunning', 'stopped', 'cycleSettled',
    ])
    && heartbeat.quiescence.schema === 'cf-v2-f4-heartbeat-quiescence/v1'
    && heartbeat.quiescence.documentToken === documentToken
    && heartbeat.quiescence.wasRunning === true
    && heartbeat.quiescence.stopped === true
    && heartbeat.quiescence.cycleSettled === true
    && exactKeys(heartbeat.resume, ['schema', 'documentToken', 'running'])
    && heartbeat.resume.schema === 'cf-v2-f4-heartbeat-resume/v1'
    && heartbeat.resume.documentToken === documentToken
    && heartbeat.resume.running === true
    && cycle.ok === true
    && heartbeat.cycleReceipt.cycle === 'completed'
    && heartbeat.cycleReceipt.reason === null
    && heartbeat.cycleReceipt.refresh.shipyard === 'completed'
    && afterOk
    && exactKeys(heartbeat.cleanup, ['attempted', 'receipt', 'error'])
    && heartbeat.cleanup.attempted === false
    && heartbeat.cleanup.receipt === null && heartbeat.cleanup.error === null
    && heartbeat.error === null;
  const receiptOk = exactKeys(receipt, [
    'schema', 'key', 'code', 'trusted', 'setupDocumentToken', 'setupDocumentHref',
    'documentToken', 'documentHref', 'tag', 'focusKey', 'surveyClose',
    'ignoredUntrustedEnterCount', 'currentCount', 'currentConnected', 'currentVisible',
    'currentDisplay', 'currentVisibility', 'currentOpacity', 'currentEffectiveOpacity',
    'currentRect',
    'originalTargetDisconnected', 'replacementAcquired', 'eventTargetIsCurrent',
    'activeIsCurrent', 'current', 'eventTarget', 'active',
  ])
    && receipt.schema === 'cf-v2-glass-keyboard-activation-receipt/v1'
    && receipt.key === 'Enter' && receipt.code === 'Enter' && receipt.trusted === true
    && receipt.setupDocumentToken === documentToken && receipt.documentToken === documentToken
    && receipt.setupDocumentHref === documentHref && receipt.documentHref === documentHref
    && receipt.tag === 'SUMMARY' && receipt.focusKey === 'section:mining'
    && receipt.surveyClose === false
    && Number.isInteger(receipt.ignoredUntrustedEnterCount)
    && receipt.ignoredUntrustedEnterCount >= 0
    && receipt.currentCount === 1 && receipt.currentConnected === true
    && receipt.currentVisible === true && nonEmpty(receipt.currentDisplay)
    && receipt.currentDisplay !== 'none'
    && receipt.currentVisibility === 'visible'
    && Number.isFinite(receipt.currentOpacity) && receipt.currentOpacity > 0
    && Number.isFinite(receipt.currentEffectiveOpacity)
    && receipt.currentEffectiveOpacity > 0
    && rectAtLeast44(receipt.currentRect)
    && receipt.originalTargetDisconnected === true
    && receipt.replacementAcquired === true
    && receipt.eventTargetIsCurrent === true && receipt.activeIsCurrent === true
    && shipyardKeyboardDescriptorMatches(receipt.current, setupDescriptor)
    && shipyardKeyboardDescriptorMatches(receipt.eventTarget, setupDescriptor)
    && shipyardKeyboardDescriptorMatches(receipt.active, setupDescriptor);
  const outcomeOk = exactKeys(outcome, [
    'schema', 'ok', 'instrumentOk', 'productOk', 'instrumentChecks', 'productChecks',
  ])
    && outcome.schema === 'cf-v2-glass-keyboard-activation-assessment/v1'
    && outcome.ok === true && outcome.instrumentOk === true && outcome.productOk === true
    && exactKeys(outcome.instrumentChecks, SHIPYARD_KEYBOARD_INSTRUMENT_CHECK_KEYS)
    && Object.values(outcome.instrumentChecks).every((value) => value === true)
    && exactKeys(outcome.productChecks, SHIPYARD_KEYBOARD_PRODUCT_CHECK_KEYS)
    && Object.values(outcome.productChecks).every((value) => value === true);
  if (!exactKeys(row, [
    'schema', 'viewport', 'sectionId', 'beforeOpen', 'afterOpen',
    'setup', 'heartbeat', 'receipt', 'outcome',
  ])
    || row.schema !== 'cf-v2-glass-shipyard-keyboard-heartbeat-outcome/v1'
    || row.viewport !== 'large-phone' || row.sectionId !== 'mining'
    || row.beforeOpen !== true || row.afterOpen !== false
    || !setupOk || !heartbeatOk || !receiptOk || !outcomeOk) {
    errors.push('Glass Shipyard keyboard heartbeat outcome is malformed, contradictory, or not green');
  }
  return errors;
}

/* Shared data-only fixture for the Glass and Recovery selftests. Keeping one
   canonical green carrier avoids two large fixtures silently disagreeing,
   while each consumer still applies independent destructive mutations before
   trusting its verifier. This helper is never used by a live collector. */
export function glassShipyardKeyboardHeartbeatSelftestInventory() {
  const documentToken = 'glass-shipyard-selftest-document';
  const documentHref = 'http://127.0.0.1:4321/';
  const descriptor = {
    tag: 'SUMMARY', id: null, focusKey: 'section:mining', surveyClose: false,
    captureAction: null, engineeringSection: 'mining', accessibleName: 'Mining',
  };
  const snapshot = ({ replaced }) => ({
    documentToken, documentHref, heartbeatRunning: true,
    currentCount: 1, currentConnected: true, currentFocused: true,
    current: { ...descriptor },
    originalTargetDisconnected: replaced,
    replacementAcquired: replaced,
  });
  return {
    plannedViewports: ['large-phone'], complete: true,
    expectedCount: 1, observedCount: 1, omitted: [],
    outcomes: [{
      schema: 'cf-v2-glass-shipyard-keyboard-heartbeat-outcome/v1',
      viewport: 'large-phone', sectionId: 'mining',
      beforeOpen: true, afterOpen: false,
      setup: {
        schema: 'cf-v2-glass-keyboard-activation-setup/v1', ok: true,
        selector: '#shipyardpanel details[data-engineering-section="mining"] > summary',
        documentToken, documentHref, targetCount: 1,
        instrumentReady: true, productReady: true,
        targetConnected: true, focused: true, visible: true,
        ...descriptor,
        display: 'list-item', visibility: 'visible', opacity: 1, effectiveOpacity: 1,
        rect: [20, 40, 220, 84],
      },
      heartbeat: {
        schema: 'cf-v2-glass-keyboard-activation-heartbeat/v1', required: true,
        stateFound: true, seamsAvailable: true,
        setupDocumentToken: documentToken, setupDocumentHref: documentHref,
        initial: snapshot({ replaced: false }),
        quiescence: {
          schema: 'cf-v2-f4-heartbeat-quiescence/v1', documentToken,
          wasRunning: true, stopped: true, cycleSettled: true,
        },
        resume: {
          schema: 'cf-v2-f4-heartbeat-resume/v1', documentToken, running: true,
        },
        cycleReceipt: {
          schema: 'cf-v2-f4-heartbeat-cycle-receipt/v1', documentToken,
          cycle: 'completed', reason: null,
          refresh: {
            shipyard: 'completed', compendium: 'panel-closed', capture: 'card-hidden',
          },
        },
        after: snapshot({ replaced: true }),
        cleanup: { attempted: false, receipt: null, error: null },
        error: null,
      },
      receipt: {
        schema: 'cf-v2-glass-keyboard-activation-receipt/v1',
        key: 'Enter', code: 'Enter', trusted: true,
        setupDocumentToken: documentToken, setupDocumentHref: documentHref,
        documentToken, documentHref,
        tag: descriptor.tag, focusKey: descriptor.focusKey,
        surveyClose: descriptor.surveyClose, ignoredUntrustedEnterCount: 0,
        currentCount: 1, currentConnected: true, currentVisible: true,
        currentDisplay: 'list-item', currentVisibility: 'visible',
        currentOpacity: 1, currentEffectiveOpacity: 1, currentRect: [20, 40, 220, 84],
        originalTargetDisconnected: true, replacementAcquired: true,
        eventTargetIsCurrent: true, activeIsCurrent: true,
        current: { ...descriptor }, eventTarget: { ...descriptor }, active: { ...descriptor },
      },
      outcome: {
        schema: 'cf-v2-glass-keyboard-activation-assessment/v1',
        ok: true, instrumentOk: true, productOk: true,
        instrumentChecks: Object.fromEntries(
          SHIPYARD_KEYBOARD_INSTRUMENT_CHECK_KEYS.map((key) => [key, true]),
        ),
        productChecks: Object.fromEntries(
          SHIPYARD_KEYBOARD_PRODUCT_CHECK_KEYS.map((key) => [key, true]),
        ),
      },
    }],
  };
}

export function glassViewportInventory() {
  return GLASS_MATRIX_VIEWPORTS.map((viewport) => ({
    label: viewport.label,
    width: viewport.width,
    height: viewport.height,
    dpr: viewport.dpr,
    mobile: viewport.mobile,
    safeArea: viewport.safe || { top: 0, right: 0, bottom: 0, left: 0 },
  }));
}

function exactSource(left, right) {
  return record(left) && record(right)
    && left.commit === right.commit
    && left.branch === right.branch
    && left.state === right.state
    && left.statusSha256 === right.statusSha256
    && left.workingTreeSha256 === right.workingTreeSha256;
}

function sourceShape(source) {
  return record(source)
    && typeof source.commit === 'string' && /^[0-9a-f]{40}$/.test(source.commit)
    && typeof source.branch === 'string' && source.branch.length > 0
    && ['committed', 'dirty-diagnostic'].includes(source.state)
    && fullSha(source.statusSha256) && fullSha(source.workingTreeSha256);
}

function findingsSummary(report) {
  if (!Array.isArray(report?.findings) || !Array.isArray(report?.instrumentFailures)) {
    return { ok: false, counts: null };
  }
  const counts = new Map();
  for (const finding of report.findings) {
    if (!record(finding) || typeof finding.code !== 'string' || !finding.code) {
      return { ok: false, counts: null };
    }
    counts.set(finding.code, (counts.get(finding.code) || 0) + 1);
  }
  const exactCounts = Object.fromEntries([...counts]
    .sort(([left], [right]) => codeUnitCompare(left, right)));
  return {
    ok: report.summary?.findingCount === report.findings.length
      && report.summary?.instrumentFailureCount === report.instrumentFailures.length
      && exactJson(report.summary?.counts, exactCounts),
    counts: exactCounts,
  };
}

function fullViewportEvidenceErrors(report) {
  const errors = [];
  const expectedInventory = glassViewportInventory();
  if (!exactJson(report?.viewportInventory, expectedInventory)) {
    errors.push('Glass viewport inventory is not the exact ordered 12-row matrix');
  }
  const timings = report?.viewportTimings;
  const expectedLabels = GLASS_MATRIX_VIEWPORTS.map(({ label }) => label);
  if (!Array.isArray(timings)
    || !exactJson(timings.map((row) => row?.label), expectedLabels)
    || timings.some((row) => !record(row)
      || !Number.isFinite(row.durationMs) || row.durationMs <= 0)) {
    errors.push('Glass viewport timing inventory is malformed, missing, duplicated, or out of order');
  }
  return errors;
}

function fullArc4OutcomeErrors(report) {
  const errors = [];
  const inventory = report?.arc4CaptureOutcomeInventory;
  const outcomes = inventory?.outcomes;
  const expectedIds = GLASS_MATRIX_VIEWPORTS.flatMap(({ label }) => (
    GLASS_ARC4_CAPTURE_OUTCOME_CODES.map((code) => `${label}\0${code}`)
  ));
  const actualIds = Array.isArray(outcomes)
    ? outcomes.map((row) => `${row?.viewport}\0${row?.code}`) : [];
  const rowsValid = Array.isArray(outcomes)
    && outcomes.every((row) => record(row)
      && row.surface === 'survey-capture'
      && row.ok === true
      && record(row.checks)
      && exactJson(
        Object.keys(row.checks).sort(codeUnitCompare),
        [...(GLASS_ARC4_CAPTURE_CHECK_KEYS[row.code] || [])].sort(codeUnitCompare),
      )
      && Object.values(row.checks).every((value) => value === true)
      && Array.isArray(row.reasons) && row.reasons.length === 0);
  if (!rowsValid || !exactJson(actualIds, expectedIds)
    || !exactJson(inventory?.plannedOutcomeCodes, GLASS_ARC4_CAPTURE_OUTCOME_CODES)
    || inventory?.complete !== true
    || inventory?.expectedCount !== expectedIds.length
    || inventory?.observedCount !== expectedIds.length
    || !exactJson(inventory?.omitted, [])) {
    errors.push('Glass Arc 4 capture outcome inventory is empty, malformed, contradictory, or incomplete');
  }
  return errors;
}

function fullNegativeControlErrors(report) {
  const controls = report?.controlSummary;
  const expectedExecuted = [...GLASS_NEGATIVE_CONTROLS].sort(codeUnitCompare);
  if (!record(controls)
    || controls.selftestRan !== true
    || !exactJson(controls.plannedNegativeControls, GLASS_NEGATIVE_CONTROLS)
    || !exactJson(controls.negativeControls, expectedExecuted)
    || !exactJson(controls.blockedNegativeControls, [])
    || !exactJson(controls.omittedNegativeControls, [])) {
    return ['Glass planned-vs-executed negative-control ledger is missing, malformed, or incomplete'];
  }
  return [];
}

export function glassBrowserAuthorityErrors(report) {
  const browser = report?.browser;
  const exactFields = [
    'consistentAcrossViewports', 'executable', 'js_version', 'product',
    'protocol_version', 'revision', 'user_agent',
  ];
  if (!record(browser)
    || !exactJson(Object.keys(browser).sort(codeUnitCompare), exactFields)
    || typeof browser.executable !== 'string' || browser.executable.length === 0
    || typeof browser.product !== 'string' || !CHROMIUM_PRODUCT.test(browser.product)
    || typeof browser.revision !== 'string' || browser.revision.length === 0
    || typeof browser.user_agent !== 'string' || browser.user_agent.length === 0
    || typeof browser.js_version !== 'string' || browser.js_version.length === 0
    || browser.protocol_version !== '1.3'
    || browser.consistentAcrossViewports !== true) {
    return ['Glass browser authority is not a complete version-tolerant Chrome/Edge + CDP 1.3 provenance tuple'];
  }
  return [];
}

export function glassTerminalEvidenceErrors(report, {
  runId,
  reportPath,
  expectedSource = null,
  expectedSlice = null,
  requirePass = true,
} = {}) {
  const errors = [];
  if (!record(report)) return ['report is not an object'];
  if (![GLASS_MATRIX_LEGACY_REPORT_SCHEMA, GLASS_MATRIX_REPORT_SCHEMA]
    .includes(report.schema)) {
    errors.push(`schema drifted: ${JSON.stringify(report.schema)}`);
  }
  if (report.status === 'pass' && report.schema !== GLASS_MATRIX_REPORT_SCHEMA) {
    errors.push(`current Glass PASS schema is required: ${JSON.stringify(report.schema)}`);
  }
  if (report.terminal !== true || !['pass', 'fail', 'instrument-fail'].includes(report.status)) {
    errors.push(`run is not terminal: ${JSON.stringify({ terminal: report.terminal, status: report.status })}`);
  }
  if (requirePass && report.status !== 'pass') {
    errors.push(`Glass predecessor is not PASS: ${JSON.stringify(report.status)}`);
  }
  if (report.run?.id !== runId) {
    errors.push(`run ID mismatch: expected ${runId}, observed ${JSON.stringify(report.run?.id)}`);
  }
  if (report.run?.artifactPath !== reportPath) {
    errors.push(`immutable report path mismatch: ${JSON.stringify(report.run?.artifactPath)}`);
  }
  const startMs = Date.parse(report.startedAt);
  const endMs = Date.parse(report.endedAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs
    || !Number.isSafeInteger(report.durationMs) || report.durationMs !== endMs - startMs) {
    errors.push('terminal timestamps/duration are malformed or unbound');
  }
  if (requirePass && report.scope !== 'full-certifying') {
    errors.push(`targeted/non-full Glass report refused: ${JSON.stringify(report.scope)}`);
  }
  if (!sourceShape(report.source) || !sourceShape(report.sourceEnd)
    || !exactSource(report.source, report.sourceEnd)
    || report.sourceChange?.detected !== false || report.sourceChange?.ending !== null) {
    errors.push('begin/end source identity is missing, changed, or contradictory');
  }
  if (expectedSource && !exactSource(report.source, expectedSource)) {
    errors.push('Glass report source does not match current source');
  }
  if (requirePass && report.source?.state !== 'committed') {
    errors.push(`Glass source is not clean committed: ${JSON.stringify(report.source?.state)}`);
  }
  const expectedCertifying = report.status === 'pass'
    && report.scope === 'full-certifying'
    && report.source?.state === 'committed'
    && record(report.predecessors?.slice);
  if (report.certifying !== expectedCertifying || (requirePass && report.certifying !== true)) {
    errors.push('Glass certifying flag contradicts terminal PASS/scope/source/predecessor authority');
  }
  if (report.controlSummary?.automaticRetries !== 0) {
    errors.push('automatic retry count is not exactly zero');
  }
  if (report.status === 'pass' && report.exit?.code !== 0) {
    errors.push('Glass PASS exit code is not zero');
  }
  if (report.status !== 'pass' && (!Number.isInteger(report.exit?.code) || report.exit.code === 0)) {
    errors.push('non-PASS Glass report carries an absent or zero exit code');
  }
  const summary = findingsSummary(report);
  if (!summary.ok) errors.push('Glass summary/findings/instrument-failures counts contradict their exact arrays');
  if (requirePass) {
    if (report.summary?.viewportCount !== GLASS_MATRIX_VIEWPORTS.length
      || report.findings?.length !== 0 || report.instrumentFailures?.length !== 0) {
      errors.push('Glass full matrix PASS carries incomplete viewport count or actual findings');
    }
    errors.push(...glassBrowserAuthorityErrors(report));
    errors.push(...fullViewportEvidenceErrors(report));
    errors.push(...fullArc4OutcomeErrors(report));
    errors.push(...shipyardKeyboardHeartbeatInventoryErrors(
      report.shipyardKeyboardHeartbeatInventory,
    ));
    errors.push(...fullNegativeControlErrors(report));
  }
  if (requirePass && !record(report.predecessors?.slice)) {
    errors.push('exact Slice predecessor binding is missing');
  }
  if (requirePass && (report.predecessors?.slice?.schema !== 'cf-v2-slice-smoke-ci/v2'
    || !['develop', 'production'].includes(
      report.predecessors?.slice?.assuranceProfile,
    ))) {
    errors.push('Glass Slice predecessor is not current profile-bound v2 evidence');
  }
  if (expectedSlice && !exactJson(report.predecessors?.slice, expectedSlice)) {
    errors.push('Glass Slice predecessor descriptor/hash does not exactly match the selected immutable Slice report');
  }
  return errors;
}
