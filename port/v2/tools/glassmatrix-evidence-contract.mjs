/* Pure terminal-evidence contract shared by Glass and Arc 4 recovery.

   Keep this module free of CLI parsing, browser launch, filesystem access, and
   process state. A downstream certificate can then re-prove the complete
   Glass outcome/control inventory instead of trusting summary booleans. */

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

function fullBrowserAuthorityErrors(report) {
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
  if (report.schema !== 'cf-v2-glassmatrix/v1') {
    errors.push(`schema drifted: ${JSON.stringify(report.schema)}`);
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
    errors.push(...fullBrowserAuthorityErrors(report));
    errors.push(...fullViewportEvidenceErrors(report));
    errors.push(...fullArc4OutcomeErrors(report));
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
