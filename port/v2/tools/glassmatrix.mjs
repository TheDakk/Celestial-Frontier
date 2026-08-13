/* glassmatrix.mjs — responsive glass-shell and accessibility outcome audit.

   The v2 HUD can look correct while an opened panel, fresh-training card,
   safe-area inset, keyboard focus ring, or reduced-motion scene is broken.
   This tool drives the real built app in Chromium/CDP and reports stable,
   machine-readable diagnostic codes. It writes no screenshots: rendered
   geometry, hit testing, accessibility names, contrast, and scene outcomes
   are the contract.

   Every matrix target owns an isolated browser context so a prior Skip does
   not turn the next viewport into a veteran and make the Training checks
   vacuous. The first matrix target also runs injected controls in both
   directions. Exit 1 means product findings; exit 2 means the instrument or
   its controls failed and its product verdict must not be trusted.
*/
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'apps', 'game');
const dist = path.join(appDir, 'dist');
const repoRoot = path.resolve(here, '..', '..', '..');
const evidenceDir = path.join(appDir, 'smoke');
/* The renderer and its texture-backed 2D backdrop coexist. Ordinary
   viewports retain the 4096² aggregate budget, split equally. A CSS viewport
   larger than one ordinary half-budget selects a 2,073,600-pixel per-canvas
   ultra tier; otherwise an 8K software renderer can publish ready while
   monopolising every later target turn or same-backing resize. */
const DEFAULT_CANVAS_BACKING_PIXELS = 8_388_608;
const ULTRA_VIEWPORT_CSS_PIXELS = 8_388_608;
const ULTRA_CANVAS_BACKING_PIXELS = 2_073_600;
const MAX_TWIN_BACKING_PIXELS = DEFAULT_CANVAS_BACKING_PIXELS * 2;
const backingPixelCapForViewport = (width, height) => (
  Number.isFinite(width) && Number.isFinite(height)
  && width > 0 && height > 0
  && width * height > ULTRA_VIEWPORT_CSS_PIXELS
    ? ULTRA_CANVAS_BACKING_PIXELS
    : DEFAULT_CANVAS_BACKING_PIXELS
);
const roundedBackingPixels = (width, height, resolution) =>
  Math.max(1, Math.round(width * resolution)) * Math.max(1, Math.round(height * resolution));
function fitResolutionToPixelCap(requested, width, height, pixelCap) {
  const dimensionFloor = Math.min(1 / width, 1 / height);
  let low = dimensionFloor;
  let high = Math.max(dimensionFloor, requested);
  if (roundedBackingPixels(width, height, high) <= pixelCap) return high;
  for (let index = 0; index < 64; index++) {
    const mid = low + (high - low) / 2;
    if (mid === low || mid === high) break;
    if (roundedBackingPixels(width, height, mid) <= pixelCap) low = mid;
    else high = mid;
  }
  return low;
}
function expectedDensityPlan(viewport) {
  const width = Number(viewport?.width);
  const height = Number(viewport?.height);
  const deviceDpr = Number(viewport?.dpr ?? 1);
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0
    || !Number.isFinite(deviceDpr) || deviceDpr <= 0) return null;
  const backingPixelCapPerCanvas = backingPixelCapForViewport(width, height);
  const requested = Math.min(
    Math.max(1, deviceDpr), viewport?.mobile ? 2 : 3,
    Math.sqrt(backingPixelCapPerCanvas / (width * height)),
  );
  const dpr = fitResolutionToPixelCap(requested, width, height, backingPixelCapPerCanvas);
  return {
    width, height, dpr, backingPixelCapPerCanvas,
    backingWidth: Math.max(1, Math.round(width * dpr)),
    backingHeight: Math.max(1, Math.round(height * dpr)),
  };
}
/* Import settlement, navigation commit, and replacement boot are separate
   observable phases. Bound each to the same budget as a fresh slice boot;
   never let time spent waiting for the old loader to leave consume the new
   document's boot budget. */
const SLICE_READY_TIMEOUT_MS = 20000;
const IMPORT_SETTLE_TIMEOUT_MS = SLICE_READY_TIMEOUT_MS;
const NAVIGATION_COMMIT_TIMEOUT_MS = 5000;
const REPLACEMENT_READY_TIMEOUT_MS = SLICE_READY_TIMEOUT_MS;
const MAX_RELOAD_EVENTS = 48;
const IMPORT_PHASE_BINDING = '__cfImportPhaseWitness';
const RELOAD_RELEASE_BINDING = '__cfReloadReleaseWitness';
const BOOT_PHASE_BINDING = '__cfBootPhaseWitness';
const SLICE_READY_BINDING = '__cfSliceReadyWitness';
const PHASE_PROBE_TIMEOUT_MS = 2000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const startedAt = Date.now();
let runSource = null;
let runReloadEvidence = [];
class ProductAnswerabilityFinding extends Error {
  constructor(message, evidence, finding = null) {
    super(message);
    this.name = 'ProductAnswerabilityFinding';
    this.evidence = evidence;
    this.finding = finding;
  }
}
const VETERAN_PREF_RAW = (() => {
  const fixture = JSON.parse(fs.readFileSync(
    path.join(here, '..', '..', 'baseline-v1.8.9', 'save-fixtures.json'), 'utf8',
  )).inputs.veteran_rich;
  fixture.fs = 'fs-xl';
  fixture.tone = 'tone-max';
  fixture.font = 'font-mono';
  fixture.tut = 0;
  /* This fixture supplies populated panels and display preferences, not a
     navigation starting point. veteran_rich is saved on Earth's surface;
     retaining that route leaves universe nodes unbuilt and makes every
     later galaxy/survey setup fail for the wrong reason. */
  fixture.view = null;
  return JSON.stringify(fixture);
})();

const VIEWPORTS = Object.freeze([
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
const viewportArg = process.argv.find((arg) => arg.startsWith('--viewport='));
const viewportLabel = viewportArg ? viewportArg.slice('--viewport='.length) : null;
const reportPath = path.join(evidenceDir, viewportLabel
  ? `glassmatrix-${viewportLabel}-diagnostic.json` : 'glassmatrix-report.json');
const selftestOnly = process.argv.includes('--selftest');
const unknownArgs = process.argv.slice(2).filter((arg) => arg !== '--selftest' && !arg.startsWith('--viewport='));
if (unknownArgs.length || (selftestOnly && viewportArg)) {
  throw new Error('usage: node tools/glassmatrix.mjs [--viewport=<label> | --selftest]');
}
const MATRIX_VIEWPORTS = viewportLabel ? VIEWPORTS.filter((vp) => vp.label === viewportLabel) : VIEWPORTS;
if (viewportLabel && MATRIX_VIEWPORTS.length !== 1) {
  throw new Error(`unknown --viewport=${JSON.stringify(viewportLabel)}; choose ${VIEWPORTS.map((vp) => vp.label).join(', ')}`);
}

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch { return null; }
}
function gitRaw(args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch { return null; }
}
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function sourceSnapshot() {
  const status = gitRaw(['status', '--porcelain=v1', '-z', '--untracked-files=all']) || '';
  const diff = gitRaw(['diff', '--binary', '--no-ext-diff', 'HEAD', '--']) || '';
  const untracked = (gitRaw(['ls-files', '--others', '--exclude-standard', '-z']) || '')
    .split('\0').filter(Boolean).sort();
  const digest = crypto.createHash('sha256');
  digest.update('tracked-diff\0').update(diff).update('\0untracked\0');
  const rootPrefix = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;
  for (const relative of untracked) {
    const absolute = path.resolve(repoRoot, relative);
    if (!absolute.startsWith(rootPrefix)) throw new Error(`unsafe untracked source path: ${relative}`);
    const stat = fs.lstatSync(absolute);
    digest.update(relative).update('\0');
    if (stat.isSymbolicLink()) digest.update('symlink\0').update(fs.readlinkSync(absolute));
    else if (stat.isFile()) digest.update('file\0').update(fs.readFileSync(absolute));
    else throw new Error(`untracked source is not a file or symlink: ${relative}`);
    digest.update('\0');
  }
  return { dirty: status.length > 0, statusSha256: sha256(status), workingTreeSha256: digest.digest('hex') };
}
function sourceIdentity() {
  const snapshot = sourceSnapshot();
  return {
    commit: process.env.GITHUB_SHA || git(['rev-parse', 'HEAD']),
    branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME
      || git(['branch', '--show-current']) || 'detached',
    state: snapshot.dirty ? 'dirty-diagnostic' : 'committed',
    statusSha256: snapshot.statusSha256,
    workingTreeSha256: snapshot.workingTreeSha256,
  };
}
function viewportInventory() {
  return MATRIX_VIEWPORTS.map((vp) => ({
    label: vp.label, width: vp.width, height: vp.height, dpr: vp.dpr,
    mobile: vp.mobile, safeArea: vp.safe || { top: 0, right: 0, bottom: 0, left: 0 },
  }));
}
const NEGATIVE_CONTROLS = Object.freeze([
  'target-floor', 'visible-focus', 'accessible-name', 'keyboard-reachability',
  'centre-hit-test', 'text-contrast', 'glass-fallback', 'populated-copy',
  'viewport-fit', 'safe-area-override', 'viewport-metrics', 'surface-overlap',
  'scene-transform-delta', 'canvas-css-fit', 'canvas-backing-density',
  'non-glass-background-chain', 'preference-computed-outcome',
  'settings-pressed-focus', 'guide-render-focus', 'motion-css-policy',
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
  'ready-confirmation-heartbeat',
  'ready-confirmation-ticker-progress',
  'ultra-viewport-render-budget',
  'ultra-same-backing-resize',
]);

function compactReloadEvent(event, requestUrls, at) {
  const method = typeof event?.method === 'string' ? event.method : '';
  const params = event?.params && typeof event.params === 'object' ? event.params : {};
  if (method === 'Network.requestWillBeSent') {
    if (typeof params.requestId === 'string' && typeof params.request?.url === 'string') {
      requestUrls.set(params.requestId, params.request.url);
    }
    return null;
  }
  if (method === 'Network.loadingFinished') {
    if (typeof params.requestId === 'string') requestUrls.delete(params.requestId);
    return null;
  }
  if (method === 'Network.loadingFailed') {
    const row = {
      at, method, requestId: params.requestId || null,
      url: requestUrls.get(params.requestId) || null,
      type: params.type || null, errorText: params.errorText || null,
      canceled: params.canceled === true, blockedReason: params.blockedReason || null,
    };
    if (typeof params.requestId === 'string') requestUrls.delete(params.requestId);
    return row;
  }
  if (method === 'Page.lifecycleEvent') {
    return {
      at, method, name: params.name || null, frameId: params.frameId || null,
      loaderId: params.loaderId || null,
    };
  }
  if (method === 'Page.frameNavigated') {
    const frame = params.frame && typeof params.frame === 'object' ? params.frame : {};
    return {
      at, method, frameId: frame.id || null, parentId: frame.parentId || null,
      loaderId: frame.loaderId || null, url: frame.url || null,
      unreachableUrl: frame.unreachableUrl || null,
    };
  }
  if (method === 'Page.frameStartedLoading' || method === 'Page.frameStoppedLoading') {
    return { at, method, frameId: params.frameId || null };
  }
  if (method === 'Page.loadEventFired' || method === 'Page.domContentEventFired') {
    return { at, method };
  }
  if (method === 'Runtime.exceptionThrown') {
    const details = params.exceptionDetails && typeof params.exceptionDetails === 'object'
      ? params.exceptionDetails : {};
    return {
      at, method, text: details.text || null, url: details.url || null,
      lineNumber: Number.isInteger(details.lineNumber) ? details.lineNumber : null,
      columnNumber: Number.isInteger(details.columnNumber) ? details.columnNumber : null,
      description: details.exception?.description || null,
    };
  }
  if (method === 'Inspector.targetCrashed' || method === 'Target.targetCrashed') {
    return {
      at, method, targetId: params.targetId || null,
      status: params.status || null, errorCode: params.errorCode ?? null,
    };
  }
  return null;
}

function pushBoundedReloadEvent(events, row) {
  if (!row) return;
  events.push(row);
  if (events.length > MAX_RELOAD_EVENTS) events.splice(0, events.length - MAX_RELOAD_EVENTS);
}

function fatalReloadEvent(events) {
  return events.find((row) => row.method === 'Inspector.targetCrashed'
    || row.method === 'Target.targetCrashed'
    || row.method === 'Runtime.exceptionThrown'
    || (row.method === 'Page.frameNavigated' && !!row.unreachableUrl)
    || (row.method === 'Network.loadingFailed' && row.type === 'Document'
      && !row.canceled && row.errorText !== 'net::ERR_ABORTED')) || null;
}

function validateReloadReleaseWitness(payload, viewport) {
  let witness = payload;
  if (typeof witness === 'string') {
    try { witness = JSON.parse(witness); }
    catch { return { ok: false, why: 'release witness payload is not JSON', witness: null }; }
  }
  if (!witness || typeof witness !== 'object' || Array.isArray(witness)) {
    return { ok: false, why: 'release witness payload is not an object', witness: null };
  }
  if (witness.schema !== 'cf-v2-reload-release/v1') {
    return { ok: false, why: 'release witness schema mismatch', witness };
  }
  if (witness.status !== 'released' || witness.error !== null) {
    return { ok: false, why: `release witness reported ${JSON.stringify(witness.status)} / ${JSON.stringify(witness.error)}`, witness };
  }
  if (!['training-restart', 'save-import', 'storage-retry'].includes(witness.reason)) {
    return { ok: false, why: 'release witness reason is invalid', witness };
  }
  if (typeof witness.documentToken !== 'string' || !witness.documentToken) {
    return { ok: false, why: 'release witness document token is missing', witness };
  }
  for (const field of ['rendererReleased', 'stageReleased', 'viewDetached']) {
    if (witness[field] !== true) return { ok: false, why: `release witness ${field} is not true`, witness };
  }
  const beforePixels = {};
  for (const name of ['appCanvas', 'backdropCanvas']) {
    const canvas = witness[name];
    if (!canvas || typeof canvas !== 'object' || Array.isArray(canvas)) {
      return { ok: false, why: `release witness ${name} is missing`, witness };
    }
    const values = ['beforeWidth', 'beforeHeight', 'afterWidth', 'afterHeight'];
    if (!values.every((field) => Number.isInteger(canvas[field]) && canvas[field] >= 0)) {
      return { ok: false, why: `release witness ${name} dimensions are invalid`, witness };
    }
    beforePixels[name] = canvas.beforeWidth * canvas.beforeHeight;
    if (canvas.afterWidth > 1 || canvas.afterHeight > 1) {
      return { ok: false, why: `release witness ${name} retained a canvas larger than 1x1`, witness };
    }
  }
  const plan = expectedDensityPlan(viewport);
  if (!plan) {
    return { ok: false, why: 'release witness viewport policy is invalid', witness };
  }
  const backingPixelCapPerCanvas = plan.backingPixelCapPerCanvas;
  const combinedBeforePixels = beforePixels.appCanvas + beforePixels.backdropCanvas;
  if (combinedBeforePixels > backingPixelCapPerCanvas * 2) {
    return { ok: false, why: 'release witness canvases exceeded the selected aggregate twin backing-pixel budget', witness };
  }
  for (const name of ['appCanvas', 'backdropCanvas']) {
    const canvas = witness[name];
    if (canvas.beforeWidth <= 1 || canvas.beforeHeight <= 1 || beforePixels[name] <= 1
      || beforePixels[name] > backingPixelCapPerCanvas) {
      return { ok: false, why: `release witness ${name} did not capture a meaningful bounded selected-tier pre-release canvas`, witness };
    }
    if (canvas.beforeWidth !== plan.backingWidth || canvas.beforeHeight !== plan.backingHeight) {
      return { ok: false, why: `release witness ${name} did not match the exact selected-density backing dimensions`, witness };
    }
  }
  return { ok: true, why: null, witness };
}

function validateSliceReadyWitness(payload, expectedViewport) {
  let witness = payload;
  if (typeof witness === 'string') {
    try { witness = JSON.parse(witness); }
    catch { return { ok: false, why: 'slice-ready witness payload is not JSON', witness: null }; }
  }
  if (!witness || typeof witness !== 'object' || Array.isArray(witness)) {
    return { ok: false, why: 'slice-ready witness payload is not an object', witness: null };
  }
  if (witness.schema !== 'cf-v2-slice-ready/v1' || witness.status !== 'ready') {
    return { ok: false, why: 'slice-ready witness schema/status mismatch', witness };
  }
  if (typeof witness.token !== 'string' || !witness.token
    || typeof witness.href !== 'string' || !witness.href) {
    return { ok: false, why: 'slice-ready witness token/URL is missing', witness };
  }
  if (witness.readyState !== 'complete' || witness.saveReady !== true
    || witness.viewConnected !== true || witness.rendererReady !== true
    || witness.stageReady !== true || !Number.isInteger(witness.tickerTicks)
    || witness.tickerTicks < 1) {
    return { ok: false, why: 'slice-ready witness did not report a complete wired app', witness };
  }
  const backingFields = [
    'backingWidth', 'backingHeight', 'backdropBackingWidth', 'backdropBackingHeight',
    'combinedBackingPixels', 'backingPixelCapPerCanvas', 'viewportWidth', 'viewportHeight',
  ];
  if (!backingFields.every((field) => Number.isInteger(witness[field]))) {
    return { ok: false, why: 'slice-ready witness twin backing dimensions are invalid', witness };
  }
  if (witness.viewportWidth <= 0 || witness.viewportHeight <= 0
    || witness.backingPixelCapPerCanvas <= 0) {
    return { ok: false, why: 'slice-ready witness viewport backing policy is invalid', witness };
  }
  const plan = expectedDensityPlan(expectedViewport ?? {
    width: witness.viewportWidth, height: witness.viewportHeight, dpr: witness.rendererDpr,
  });
  const selectedCap = backingPixelCapForViewport(witness.viewportWidth, witness.viewportHeight);
  if (witness.backingPixelCapPerCanvas !== selectedCap
    || !plan || !Number.isFinite(witness.rendererDpr)
    || Math.abs(witness.rendererDpr - plan.dpr) > 1e-12
    || (expectedViewport && (witness.viewportWidth !== expectedViewport.width
      || witness.viewportHeight !== expectedViewport.height
      || selectedCap !== backingPixelCapForViewport(expectedViewport.width, expectedViewport.height)))) {
    return { ok: false, why: 'slice-ready witness selected backing tier/viewport is invalid', witness };
  }
  const appPixels = witness.backingWidth * witness.backingHeight;
  const backdropPixels = witness.backdropBackingWidth * witness.backdropBackingHeight;
  if (witness.backingWidth <= 1 || witness.backingHeight <= 1
    || witness.backdropBackingWidth <= 1 || witness.backdropBackingHeight <= 1
    || appPixels > selectedCap
    || backdropPixels > selectedCap
    || witness.backingWidth !== witness.backdropBackingWidth
    || witness.backingHeight !== witness.backdropBackingHeight
    || witness.backingWidth !== plan.backingWidth
    || witness.backingHeight !== plan.backingHeight
    || witness.combinedBackingPixels !== appPixels + backdropPixels
    || witness.combinedBackingPixels > selectedCap * 2) {
    return { ok: false, why: 'slice-ready witness twin backing budget is invalid', witness };
  }
  if (!Number.isFinite(witness.performanceNow) || witness.performanceNow < 0
    || witness.performanceNow >= REPLACEMENT_READY_TIMEOUT_MS) {
    return { ok: false, why: 'slice-ready witness performance timestamp is invalid', witness };
  }
  return { ok: true, why: null, witness };
}

const IMPORT_PHASE_STAGES = Object.freeze([
  'invoked', 'validation-rejected', 'claim-rejected', 'claimed',
  'waiting-active-persist', 'no-active-persist', 'active-persist-settled',
  'primary-write-started', 'primary-write-complete', 'primary-write-rejected',
  'release-started', 'release-complete',
]);
function validateImportPhaseWitness(payload) {
  let witness = payload;
  if (typeof witness === 'string') {
    try { witness = JSON.parse(witness); }
    catch { return { ok: false, why: 'import-phase witness payload is not JSON', witness: null }; }
  }
  if (!witness || typeof witness !== 'object' || Array.isArray(witness)) {
    return { ok: false, why: 'import-phase witness payload is not an object', witness: null };
  }
  if (witness.schema !== 'cf-v2-import-phase/v1'
    || witness.reason !== 'save-import'
    || typeof witness.phaseId !== 'string' || !witness.phaseId
    || typeof witness.documentToken !== 'string' || !witness.documentToken
    || !IMPORT_PHASE_STAGES.includes(witness.stage)
    || !Number.isInteger(witness.sequence) || witness.sequence < 1
    || typeof witness.tickerStarted !== 'boolean'
    || !Number.isFinite(witness.performanceNow) || witness.performanceNow < 0
    || !(witness.error === null || typeof witness.error === 'string')) {
    return { ok: false, why: 'import-phase witness fields are invalid', witness };
  }
  return { ok: true, why: null, witness };
}

function importPhaseOutcome(rows, {
  phaseId, priorToken, priorLoaderId, priorFrameId, priorContextUniqueId,
  priorContextGeneration, expectedOrigin, expectedSessionId, importDeadline,
}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { status: 'pending', rows: [], lastStage: null, why: null };
  }
  let sequence = 0;
  const stages = [];
  for (const row of rows) {
    if (!row.validation?.ok) {
      return { status: 'failed', rows, lastStage: stages.at(-1) || null,
        why: row.validation?.why || 'import-phase witness is invalid' };
    }
    const witness = row.validation.witness;
    if (row.sessionId !== expectedSessionId || row.loaderId !== priorLoaderId
      || !row.context?.active || !row.context.isDefault
      || row.context.frameId !== priorFrameId
      || row.context.uniqueId !== priorContextUniqueId
      || row.context.generation !== priorContextGeneration
      || row.context.origin !== expectedOrigin
      || witness.phaseId !== phaseId || witness.documentToken !== priorToken) {
      return { status: 'failed', rows, lastStage: stages.at(-1) || null,
        why: 'import-phase witness did not come from the armed old top-frame operation' };
    }
    if (row.at >= importDeadline) {
      return { status: 'failed', rows, lastStage: witness.stage,
        why: `import deadline expired at ${witness.stage}` };
    }
    if (witness.sequence !== ++sequence) {
      return { status: 'failed', rows, lastStage: witness.stage,
        why: 'import-phase witness sequence is missing, duplicate, or reordered' };
    }
    if (witness.stage === 'invoked' && !witness.tickerStarted) {
      return { status: 'failed', rows, lastStage: witness.stage,
        why: 'outgoing renderer ticker was not active when import began' };
    }
    if (witness.stage !== 'invoked' && witness.tickerStarted) {
      return { status: 'failed', rows, lastStage: witness.stage,
        why: `outgoing renderer ticker remained active at ${witness.stage}` };
    }
    stages.push(witness.stage);
  }
  if (stages[0] !== 'invoked') {
    return { status: 'failed', rows, lastStage: stages.at(-1) || null,
      why: 'import-phase sequence did not begin at invoked' };
  }
  const terminal = stages.at(-1);
  if (['validation-rejected', 'claim-rejected', 'primary-write-rejected'].includes(terminal)) {
    return { status: 'failed', rows, lastStage: terminal, why: `import stopped at ${terminal}` };
  }
  const path = stages.includes('waiting-active-persist')
    ? ['invoked', 'claimed', 'waiting-active-persist', 'active-persist-settled',
      'primary-write-started', 'primary-write-complete', 'release-started', 'release-complete']
    : ['invoked', 'claimed', 'no-active-persist', 'primary-write-started',
      'primary-write-complete', 'release-started', 'release-complete'];
  if (stages.length > path.length
    || !stages.every((stage, index) => path[index] === stage)) {
    return { status: 'failed', rows, lastStage: terminal,
      why: `import-phase stages are out of order (${stages.join(' -> ')})` };
  }
  return terminal === 'release-complete'
    ? { status: 'ready', rows, lastStage: terminal, why: null }
    : { status: 'pending', rows, lastStage: terminal, why: null };
}

const BOOT_PHASE_STAGES = Object.freeze([
  'app-init-start', 'app-init-complete', 'backdrop-complete',
  'save-load-start', 'save-load-complete', 'scene-rendered',
  'slice-published', 'wiring-complete', 'ticker-started', 'first-tick',
  'ready-scheduled', 'ready-emitted',
]);
function validateBootPhaseWitness(payload) {
  let witness = payload;
  if (typeof witness === 'string') {
    try { witness = JSON.parse(witness); }
    catch { return { ok: false, why: 'boot-phase witness payload is not JSON', witness: null }; }
  }
  if (!witness || typeof witness !== 'object' || Array.isArray(witness)) {
    return { ok: false, why: 'boot-phase witness payload is not an object', witness: null };
  }
  if (witness.schema !== 'cf-v2-boot-phase/v1'
    || typeof witness.documentToken !== 'string' || !witness.documentToken
    || !BOOT_PHASE_STAGES.includes(witness.stage)
    || !Number.isInteger(witness.sequence) || witness.sequence < 1
    || typeof witness.tickerStarted !== 'boolean'
    || !Number.isFinite(witness.performanceNow) || witness.performanceNow < 0
    || witness.performanceNow >= REPLACEMENT_READY_TIMEOUT_MS
    || witness.error !== null) {
    return { ok: false, why: 'boot-phase witness fields are invalid', witness };
  }
  return { ok: true, why: null, witness };
}

function replacementBootPhaseOutcome(rows, {
  priorToken, priorFrameId, priorContextUniqueId, priorContextGeneration,
  expectedOrigin, expectedSessionId, replacementLoaderId,
  releaseAt, commitAt, bootDeadline, contextStillActive = true,
}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { status: 'pending', rows: [], lastStage: null, documentToken: null, why: null };
  }
  if (rows.length > BOOT_PHASE_STAGES.length) {
    return { status: 'failed', rows, lastStage: rows.at(-1)?.validation?.witness?.stage || null,
      documentToken: rows[0]?.validation?.witness?.documentToken || null,
      why: 'boot-phase witness sequence is duplicate or overlong' };
  }
  const first = rows[0];
  const firstContext = first.context;
  const firstToken = first.validation?.witness?.documentToken || null;
  let priorPerformanceNow = -1;
  let priorReceiptAt = -1;
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (!row.validation?.ok) {
      return { status: 'failed', rows, lastStage: index ? rows[index - 1].validation?.witness?.stage : null,
        documentToken: firstToken, why: row.validation?.why || 'boot-phase witness is invalid' };
    }
    const witness = row.validation.witness;
    if (!contextStillActive || row.sessionId !== expectedSessionId
      || row.loaderId !== replacementLoaderId
      || !row.context?.active || !row.context.isDefault
      || row.context.frameId !== priorFrameId
      || typeof row.context.uniqueId !== 'string' || !row.context.uniqueId
      || row.context.uniqueId === priorContextUniqueId
      || !Number.isInteger(row.context.generation)
      || row.context.generation <= priorContextGeneration
      || row.context.origin !== expectedOrigin
      || row.context.createdAt < releaseAt
      || row.executionContextId !== first.executionContextId
      || row.context.uniqueId !== firstContext?.uniqueId
      || row.context.generation !== firstContext?.generation) {
      return { status: 'failed', rows, lastStage: witness.stage,
        documentToken: firstToken,
        why: 'boot-phase witness did not come from the active replacement top-frame context' };
    }
    if (!firstToken || firstToken === priorToken || witness.documentToken !== firstToken) {
      return { status: 'failed', rows, lastStage: witness.stage,
        documentToken: firstToken, why: 'boot-phase witness retained or changed document identity' };
    }
    if (row.at < commitAt || row.at >= bootDeadline) {
      return { status: 'failed', rows, lastStage: witness.stage,
        documentToken: firstToken, why: `replacement boot deadline/commit boundary failed at ${witness.stage}` };
    }
    if (witness.sequence !== index + 1 || witness.stage !== BOOT_PHASE_STAGES[index]) {
      return { status: 'failed', rows, lastStage: witness.stage,
        documentToken: firstToken,
        why: 'boot-phase witness sequence is missing, duplicate, or reordered' };
    }
    const tickerShouldRun = index >= BOOT_PHASE_STAGES.indexOf('ticker-started');
    if (witness.tickerStarted !== tickerShouldRun) {
      return { status: 'failed', rows, lastStage: witness.stage,
        documentToken: firstToken,
        why: `replacement ticker state is invalid at ${witness.stage}` };
    }
    if (witness.performanceNow < priorPerformanceNow || row.at < priorReceiptAt) {
      return { status: 'failed', rows, lastStage: witness.stage,
        documentToken: firstToken, why: 'boot-phase clocks moved backwards' };
    }
    priorPerformanceNow = witness.performanceNow;
    priorReceiptAt = row.at;
  }
  const lastStage = rows.at(-1).validation.witness.stage;
  return rows.length === BOOT_PHASE_STAGES.length
    ? { status: 'ready', rows, lastStage, documentToken: firstToken, why: null }
    : { status: 'pending', rows, lastStage, documentToken: firstToken, why: null };
}

function replacementNavigationOutcome(events, {
  priorLoaderId, priorFrameId, expectedUrl, releaseAt, navigationDeadline,
}) {
  const topChanges = events.filter((row) => row.method === 'Page.frameNavigated'
    && row.parentId === null && row.loaderId && row.loaderId !== priorLoaderId
    && row.at >= releaseAt);
  if (!topChanges.length) return { status: 'pending', row: null, why: null };
  const row = topChanges[0];
  if (topChanges.some((entry) => entry.loaderId !== row.loaderId)) {
    return { status: 'failed', row, why: 'top-frame loader changed more than once during replacement' };
  }
  if (row.frameId !== priorFrameId) {
    return { status: 'failed', row, why: 'replacement navigation changed the top-frame identity' };
  }
  if (row.url !== expectedUrl || row.unreachableUrl) {
    return { status: 'failed', row, why: 'replacement navigation left the expected app URL' };
  }
  if (row.at >= navigationDeadline) {
    return { status: 'failed', row, why: 'navigation commit deadline expired before changed loader' };
  }
  return { status: 'ready', row, why: null };
}

function importReleaseOutcome(witnesses, {
  priorToken, priorLoaderId, priorFrameId, priorContextUniqueId, priorContextGeneration,
  expectedOrigin, expectedSessionId, importDeadline,
}) {
  if (!Array.isArray(witnesses) || witnesses.length === 0) {
    return { status: 'pending', row: null, why: null };
  }
  if (witnesses.length !== 1) {
    return { status: 'failed', row: witnesses[0] || null, why: `replacement emitted ${witnesses.length} release witnesses` };
  }
  const row = witnesses[0];
  if (!row.validation?.ok) {
    return { status: 'failed', row, why: row.validation?.why || 'release witness is invalid' };
  }
  const witness = row.validation.witness;
  if (witness.reason !== 'save-import' || witness.documentToken !== priorToken) {
    return { status: 'failed', row, why: 'release witness is not owned by the armed save import' };
  }
  if (row.sessionId !== expectedSessionId || row.loaderId !== priorLoaderId
    || !row.context?.active || !row.context.isDefault
    || row.context.frameId !== priorFrameId
    || row.context.uniqueId !== priorContextUniqueId
    || row.context.generation !== priorContextGeneration
    || row.context.origin !== expectedOrigin) {
    return { status: 'failed', row, why: 'release witness did not come from the armed old top-frame context' };
  }
  if (row.at >= importDeadline) {
    return { status: 'failed', row, why: 'import transaction deadline expired before release witness' };
  }
  return { status: 'ready', row, why: null };
}

function importReleaseSequenceOutcome(importPhase, release, now, importDeadline) {
  if (!importPhase || !release || !Number.isFinite(now) || !Number.isFinite(importDeadline)) {
    return { status: 'failed', why: 'import/release sequence evidence is invalid' };
  }
  if (importPhase.status === 'failed') {
    return { status: 'failed', why: `import phase failed (${importPhase.why || 'unknown'})` };
  }
  if (release.status === 'failed') {
    return { status: 'failed', why: `release witness failed (${release.why || 'unknown'})` };
  }
  if (importPhase.status === 'ready' && release.status === 'pending') {
    return { status: 'failed', why: 'release-complete arrived before the release witness' };
  }
  if (release.status === 'ready' && importPhase.status === 'pending') {
    if (importPhase.lastStage !== 'release-started') {
      return { status: 'failed', why: `release witness arrived before release-started (phase ${importPhase.lastStage || 'none'})` };
    }
    const releaseStarted = importPhase.rows.at(-1);
    if (!Number.isInteger(releaseStarted?.receiptOrdinal)
      || !Number.isInteger(release.row?.receiptOrdinal)
      || release.row.receiptOrdinal !== releaseStarted.receiptOrdinal + 1) {
      return { status: 'failed', why: 'release witness was not the binding immediately after release-started' };
    }
    if (now >= importDeadline) {
      return { status: 'failed', why: `import/release sequence did not settle before the import deadline (phase ${importPhase.lastStage || 'none'}; release ${release.status})` };
    }
    return { status: 'pending', why: null };
  }
  if (importPhase.status === 'pending' || release.status === 'pending') {
    if (now >= importDeadline) {
      return { status: 'failed', why: `import/release sequence did not settle before the import deadline (phase ${importPhase.lastStage || 'none'}; release ${release.status})` };
    }
    return { status: 'pending', why: null };
  }
  if (importPhase.status !== 'ready' || release.status !== 'ready') {
    return { status: 'failed', why: 'import/release sequence entered an unknown state' };
  }
  const releaseStarted = importPhase.rows.at(-2);
  const releaseComplete = importPhase.rows.at(-1);
  if (releaseStarted?.validation?.witness?.stage !== 'release-started'
    || releaseComplete?.validation?.witness?.stage !== 'release-complete'
    || !Number.isInteger(releaseStarted.receiptOrdinal)
    || !Number.isInteger(release.row?.receiptOrdinal)
    || !Number.isInteger(releaseComplete.receiptOrdinal)
    || release.row.receiptOrdinal !== releaseStarted.receiptOrdinal + 1
    || releaseComplete.receiptOrdinal !== release.row.receiptOrdinal + 1) {
    return { status: 'failed', why: 'release bindings were not the exact release-started -> released -> release-complete tail' };
  }
  return { status: 'ready', why: null };
}

function replacementReadyOutcome(witnesses, {
  priorToken, priorFrameId, priorContextUniqueId, priorContextGeneration,
  expectedUrl, expectedOrigin,
  expectedSessionId, replacementLoaderId, releaseAt, commitAt, bootDeadline,
  contextStillActive = true,
}) {
  if (!Array.isArray(witnesses) || witnesses.length === 0) {
    return { status: 'pending', row: null, why: null };
  }
  if (witnesses.length !== 1) {
    return { status: 'failed', row: witnesses[0] || null, why: `replacement emitted ${witnesses.length} slice-ready witnesses` };
  }
  const row = witnesses[0];
  if (!row.validation?.ok) {
    return { status: 'failed', row, why: row.validation?.why || 'slice-ready witness is invalid' };
  }
  const witness = row.validation.witness;
  if (row.sessionId !== expectedSessionId || !contextStillActive
    || !row.context?.active || !row.context.isDefault
    || row.context.frameId !== priorFrameId
    || typeof row.context.uniqueId !== 'string' || !row.context.uniqueId
    || row.context.uniqueId === priorContextUniqueId
    || !Number.isInteger(row.context.generation)
    || row.context.generation <= priorContextGeneration
    || row.context.origin !== expectedOrigin
    || row.context.createdAt < releaseAt) {
    return { status: 'failed', row, why: 'slice-ready witness did not come from the default top-frame context' };
  }
  if (row.loaderId !== replacementLoaderId) {
    return { status: 'failed', row, why: 'slice-ready witness was not bound to the replacement loader' };
  }
  if (witness.token === priorToken) {
    return { status: 'failed', row, why: 'slice-ready witness retained the prior document token' };
  }
  if (witness.href !== expectedUrl) {
    return { status: 'failed', row, why: 'slice-ready witness URL does not match the app URL' };
  }
  if (row.at < commitAt) {
    return { status: 'failed', row, why: 'slice-ready witness arrived before replacement navigation committed' };
  }
  if (row.at >= bootDeadline) {
    return { status: 'failed', row, why: 'replacement boot deadline expired before slice-ready witness' };
  }
  return { status: 'ready', row, why: null };
}

function confirmationDeadlineOutcome(endedAt, bootDeadline) {
  if (!Number.isFinite(endedAt) || !Number.isFinite(bootDeadline)) {
    return { ok: false, why: 'slice-ready confirmation deadline evidence is invalid' };
  }
  return endedAt < bootDeadline
    ? { ok: true, why: null }
    : { ok: false, why: 'bounded slice-ready confirmation completed after the replacement boot deadline' };
}

function confirmationCommandDeadlineOutcome(endedAt, startedAt, timeoutMs) {
  if (!Number.isFinite(endedAt) || !Number.isFinite(startedAt)
    || !Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    return { ok: false, why: 'slice-ready confirmation command deadline evidence is invalid' };
  }
  return endedAt < startedAt + timeoutMs
    ? { ok: true, why: null }
    : { ok: false, why: 'bounded slice-ready confirmation command completed at or after its exact timeout' };
}

async function runBoundedReadyConfirmation({
  send, sessionId, executionContextId, expression, readyReceiptAt, bootDeadline,
  maxTimeoutMs = PHASE_PROBE_TIMEOUT_MS, now = Date.now, cycle = 1,
  postRenderPriority = null,
}) {
  if (!Number.isFinite(readyReceiptAt) || !Number.isFinite(bootDeadline)
    || readyReceiptAt >= bootDeadline) {
    return {
      ok: false, classification: 'instrument-or-transport-failure',
      why: 'slice-ready confirmation was not anchored to a timely ready witness',
      commands: [], result: null, heartbeat: null,
    };
  }
  const timeoutMs = maxTimeoutMs;
  const startedAt = now();
  const observe = (method, role, params, commandSessionId) => {
    let pending;
    try { pending = send(method, params, commandSessionId, { timeoutMs }); }
    catch (error) { pending = Promise.reject(error); }
    return Promise.resolve(pending).then((result) => {
      const endedAt = now();
      return {
        result, error: null,
        command: { method, role, cycle, startedAt, endedAt,
          durationMs: endedAt - startedAt, timeoutMs, status: 'completed',
          sessionId: commandSessionId ?? null,
          executionContextId: method === 'Runtime.evaluate' ? params.contextId ?? null : null,
          awaitPromise: method === 'Runtime.evaluate' ? params.awaitPromise === true : null,
          postRenderPriority: method === 'Runtime.evaluate' ? postRenderPriority : null },
      };
    }, (error) => {
      const endedAt = now();
      const message = error instanceof Error ? error.message : String(error);
      const timedOut = new RegExp(`timed out waiting for ${method.replace('.', '\\.')}`, 'i').test(message);
      return {
        result: null, error: message, timedOut,
        command: { method, role, cycle, startedAt, endedAt,
          durationMs: endedAt - startedAt, timeoutMs,
          status: timedOut ? 'timed-out' : 'failed', error: message,
          sessionId: commandSessionId ?? null,
          executionContextId: method === 'Runtime.evaluate' ? params.contextId ?? null : null,
          awaitPromise: method === 'Runtime.evaluate' ? params.awaitPromise === true : null,
          postRenderPriority: method === 'Runtime.evaluate' ? postRenderPriority : null },
      };
    });
  }
  /* Send both commands before awaiting either. Browser.getVersion bypasses
     the target session/main thread, so it discriminates page starvation from
     a dead CDP/browser transport without granting either command more time. */
  const awaitPromise = Number.isFinite(postRenderPriority);
  const targetExpression = awaitPromise
    ? `new Promise((resolve)=>{ const S=window.__CF_SLICE__;
        if(!S?.app?.ticker?.started){ resolve({ready:false,token:S?.documentToken||null,
          href:location.href,readyState:document.readyState,error:'ticker is not running'}); return; }
        S.app.ticker.addOnce(()=>resolve(${expression}),undefined,${postRenderPriority});
      })`
    : expression;
  const targetPending = observe('Runtime.evaluate', 'target-exact-context', {
    expression: targetExpression, contextId: executionContextId, returnByValue: true, awaitPromise,
  }, sessionId);
  const heartbeatPending = observe('Browser.getVersion', 'browser-process-heartbeat', {}, undefined);
  const [target, heartbeat] = await Promise.all([targetPending, heartbeatPending]);
  const commands = [target.command, heartbeat.command];
  const heartbeatCommandDeadline = confirmationCommandDeadlineOutcome(
    heartbeat.command.endedAt, heartbeat.command.startedAt, heartbeat.command.timeoutMs,
  );
  const targetCommandDeadline = confirmationCommandDeadlineOutcome(
    target.command.endedAt, target.command.startedAt, target.command.timeoutMs,
  );
  if (!heartbeat.error && !heartbeatCommandDeadline.ok) {
    heartbeat.command.status = 'completed-late';
  }
  if (!target.error && !targetCommandDeadline.ok) {
    target.command.status = 'completed-late';
  }
  const heartbeatValid = !heartbeat.error && heartbeatCommandDeadline.ok
    && typeof heartbeat.result?.product === 'string' && !!heartbeat.result.product
    && typeof heartbeat.result?.protocolVersion === 'string' && !!heartbeat.result.protocolVersion;
  if (!heartbeatValid) {
    const detail = heartbeat.error || heartbeatCommandDeadline.why
      || 'Browser.getVersion returned incomplete provenance';
    return {
      ok: false, classification: 'instrument-or-transport-failure',
      why: `bounded slice-ready browser heartbeat failed (${detail})`,
      commands, result: target.result, heartbeat: heartbeat.result,
    };
  }
  if (target.error) {
    const contextLost = /(?:execution context (?:was )?destroyed|cannot find context|cannot find context with specified id|inspected target navigated or closed)/i
      .test(target.error);
    return target.timedOut || contextLost
      ? {
        ok: false, classification: 'product-unanswerable-after-ready',
        why: target.timedOut
          ? `replacement app emitted ready but its exact target context was unanswerable within ${timeoutMs}ms while the browser process remained responsive`
          : `replacement app emitted ready but then lost its exact target context while the browser process remained responsive (${target.error})`,
        commands, result: null, heartbeat: heartbeat.result,
      }
      : {
        ok: false, classification: 'instrument-or-transport-failure',
        why: `bounded slice-ready target confirmation failed (${target.error})`,
        commands, result: null, heartbeat: heartbeat.result,
      };
  }
  if (!targetCommandDeadline.ok) {
    const lateWhy = targetCommandDeadline.why;
    return {
      ok: false, classification: 'product-unanswerable-after-ready',
      why: `replacement app emitted ready but its exact target context completed outside the ${timeoutMs}ms command bound while the browser process remained responsive (${lateWhy})`,
      commands, result: target.result, heartbeat: heartbeat.result,
    };
  }
  return {
    ok: true, classification: 'confirmed', why: null,
    commands, result: target.result, heartbeat: heartbeat.result,
  };
}

async function runBoundedOutcomeHeartbeatProbe({
  send, sessionId, executionContextId, expression,
  maxTimeoutMs = PHASE_PROBE_TIMEOUT_MS, now = Date.now,
  cycle = 0, postRenderPriority = null,
}) {
  const anchoredAt = now();
  return runBoundedReadyConfirmation({
    send, sessionId, executionContextId, expression,
    /* This helper reuses the same concurrent target/browser transport seam;
       its one-millisecond synthetic anchor is only the prerequisite accepted
       by that seam. The outcome owns a fresh independent command deadline. */
    readyReceiptAt: anchoredAt, bootDeadline: anchoredAt + 1,
    maxTimeoutMs, now, cycle, postRenderPriority,
  });
}

function reloadCommandLedgerOutcome(commands, { sessionId, executionContextId }) {
  if (!Array.isArray(commands) || commands.length !== 5) {
    return { ok: false, why: 'replacement command ledger did not contain one import arm and two target/heartbeat cycles' };
  }
  const expected = [
    ['Runtime.evaluate/import-arm', 'import-arm', 0, sessionId, null, false, null],
    ['Runtime.evaluate', 'target-exact-context', 1, sessionId, executionContextId, false, null],
    ['Browser.getVersion', 'browser-process-heartbeat', 1, null, null, null, null],
    ['Runtime.evaluate', 'target-exact-context', 2, sessionId, executionContextId, true, -50],
    ['Browser.getVersion', 'browser-process-heartbeat', 2, null, null, null, null],
  ];
  for (let index = 0; index < expected.length; index++) {
    const row = commands[index];
    const [method, role, cycle, expectedSessionId, expectedContextId,
      expectedAwaitPromise, expectedPostRenderPriority] = expected[index];
    if (!row || row.method !== method || row.role !== role || row.cycle !== cycle
      || row.status !== 'completed' || row.sessionId !== expectedSessionId
      || row.executionContextId !== expectedContextId
      || row.awaitPromise !== expectedAwaitPromise
      || row.postRenderPriority !== expectedPostRenderPriority
      || !Number.isFinite(row.startedAt) || !Number.isFinite(row.endedAt)
      || row.endedAt < row.startedAt || !Number.isInteger(row.timeoutMs) || row.timeoutMs <= 0
      || row.endedAt >= row.startedAt + row.timeoutMs) {
      return { ok: false, why: `replacement command ledger row ${index + 1} is missing, duplicated, mis-scoped, or late` };
    }
  }
  return { ok: true, why: null };
}

function confirmationStateOutcome(state, witnessed, expectedUrl, expectedViewport, priorTickerTicks = null) {
  const expectedPlan = expectedDensityPlan(expectedViewport);
  const expectedCap = expectedPlan?.backingPixelCapPerCanvas;
  if (!state?.ready || state.token !== witnessed.token || state.href !== expectedUrl
    || state.readyState !== 'complete' || state.viewConnected !== true
    || state.rendererReady !== true || state.stageReady !== true || state.tickerStarted !== true
    || !Number.isInteger(state.tickerTicks) || state.tickerTicks < 1
    || state.backingWidth !== witnessed.backingWidth
    || state.backingHeight !== witnessed.backingHeight
    || state.backdropBackingWidth !== witnessed.backdropBackingWidth
    || state.backdropBackingHeight !== witnessed.backdropBackingHeight
    || state.combinedBackingPixels !== witnessed.combinedBackingPixels
    || !Number.isFinite(state.rendererDpr)
    || Math.abs(state.rendererDpr - witnessed.rendererDpr) > 1e-12
    || Math.abs(state.rendererDpr - expectedPlan?.dpr) > 1e-12
    || state.backingPixelCapPerCanvas !== witnessed.backingPixelCapPerCanvas
    || state.backingPixelCapPerCanvas !== expectedCap
    || state.viewportWidth !== witnessed.viewportWidth
    || state.viewportHeight !== witnessed.viewportHeight
    || state.viewportWidth !== expectedViewport?.width
    || state.viewportHeight !== expectedViewport?.height) {
    return { ok: false, why: 'bounded slice-ready confirmation disagreed with the witness or selected viewport tier', state };
  }
  if (priorTickerTicks !== null && state.tickerTicks <= priorTickerTicks) {
    return { ok: false, why: 'second bounded slice-ready confirmation did not observe a newer ticker turn', state };
  }
  if (state.tickerTicks < witnessed.tickerTicks) {
    return { ok: false, why: 'bounded slice-ready confirmation observed a ticker count older than the ready witness', state };
  }
  return { ok: true, why: null, state };
}

async function runBoundedImportArm({
  send, sessionId, expression, importDeadline,
  maxTimeoutMs = IMPORT_SETTLE_TIMEOUT_MS, now = Date.now,
}) {
  const remaining = importDeadline - now();
  if (remaining <= 0) {
    return { ok: false, why: 'import arm began after its import deadline', command: null, result: null };
  }
  const timeoutMs = Math.max(1, Math.min(maxTimeoutMs, remaining));
  const startedAt = now();
  try {
    const result = await send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: false,
    }, sessionId, { timeoutMs });
    const endedAt = now();
    const command = { method: 'Runtime.evaluate/import-arm', role: 'import-arm', cycle: 0,
      startedAt, endedAt, durationMs: endedAt - startedAt, timeoutMs, status: 'completed',
      sessionId, executionContextId: null, awaitPromise: false, postRenderPriority: null };
    return endedAt < importDeadline
      ? { ok: true, why: null, command, result }
      : { ok: false, why: 'bounded import arm completed after its import deadline', command, result };
  } catch (error) {
    const endedAt = now();
    return {
      ok: false, why: `bounded import arm instrument failed (${error.message})`,
      command: { method: 'Runtime.evaluate/import-arm', role: 'import-arm', cycle: 0,
        startedAt, endedAt, durationMs: endedAt - startedAt, timeoutMs,
        status: 'failed', error: error.message, sessionId, executionContextId: null,
        awaitPromise: false, postRenderPriority: null },
      result: null,
    };
  }
}

async function reloadPhaseSelftest() {
  const failures = [];
  const priorToken = 'old-document-token', priorLoaderId = 'old-loader';
  const ordinaryViewport = { width: 4096, height: 2048, dpr: 1, mobile: false };
  const ultraViewport = { width: 7680, height: 4320, dpr: 1, mobile: false };
  const eventRequests = new Map([['document-request', 'http://127.0.0.1:1234/']]);
  const fatalFixtures = [
    compactReloadEvent({ method: 'Runtime.exceptionThrown', params: {
      exceptionDetails: { text: 'Uncaught', url: 'app.js', lineNumber: 3,
        exception: { description: 'Error: injected replacement boot failure' } },
    } }, eventRequests, 1),
    compactReloadEvent({ method: 'Inspector.targetCrashed', params: {} }, eventRequests, 2),
    compactReloadEvent({ method: 'Network.loadingFailed', params: {
      requestId: 'document-request', type: 'Document', errorText: 'net::ERR_FAILED', canceled: false,
    } }, eventRequests, 3),
  ];
  for (const [index, row] of fatalFixtures.entries()) {
    if (!row || fatalReloadEvent([row]) !== row) {
      failures.push(`fatal reload-event fixture ${index} was not diagnosed: ${JSON.stringify(row)}`);
    }
  }
  const canceledRequest = compactReloadEvent({ method: 'Network.loadingFailed', params: {
    requestId: 'canceled-request', type: 'Document', errorText: 'net::ERR_ABORTED', canceled: true,
  } }, new Map([['canceled-request', 'http://127.0.0.1:1234/']]), 4);
  if (!canceledRequest || fatalReloadEvent([canceledRequest])) {
    failures.push(`benign canceled document request was treated as fatal: ${JSON.stringify(canceledRequest)}`);
  }
  const validRelease = {
    schema: 'cf-v2-reload-release/v1', status: 'released', error: null,
    reason: 'save-import', documentToken: priorToken,
    rendererReleased: true, stageReleased: true, viewDetached: true,
    appCanvas: { beforeWidth: 4096, beforeHeight: 2048, afterWidth: 1, afterHeight: 1 },
    backdropCanvas: { beforeWidth: 4096, beforeHeight: 2048, afterWidth: 0, afterHeight: 0 },
  };
  const releaseAccepted = validateReloadReleaseWitness(JSON.stringify(validRelease), ordinaryViewport);
  if (!releaseAccepted.ok) {
    failures.push(`valid reload-resource witness was rejected: ${JSON.stringify(releaseAccepted)}`);
  }
  if (NAVIGATION_COMMIT_TIMEOUT_MS !== 5000 || REPLACEMENT_READY_TIMEOUT_MS !== 20000) {
    failures.push(`reload phase budgets drifted: navigation=${NAVIGATION_COMMIT_TIMEOUT_MS} boot=${REPLACEMENT_READY_TIMEOUT_MS}`);
  }
  const phaseOptions = {
    phaseId: 'phase-1', priorToken, priorLoaderId, priorFrameId: 'top-frame',
    priorContextUniqueId: 'old-context', priorContextGeneration: 1,
    expectedOrigin: 'http://127.0.0.1:1234', expectedSessionId: 'target-session',
    importDeadline: 110,
  };
  const phaseStages = [
    ['invoked', true], ['claimed', false], ['no-active-persist', false],
    ['primary-write-started', false], ['primary-write-complete', false],
    ['release-started', false], ['release-complete', false],
  ];
  const phaseRows = phaseStages.map(([stage, tickerStarted], index) => ({
    at: index >= 5 ? 105 : 100 + index,
    receiptOrdinal: index < 6 ? index + 1 : index + 2,
    sessionId: 'target-session', executionContextId: 5,
    loaderId: priorLoaderId,
    context: { active: true, isDefault: true, frameId: 'top-frame', generation: 1,
      uniqueId: 'old-context', origin: 'http://127.0.0.1:1234' },
    validation: validateImportPhaseWitness({
      schema: 'cf-v2-import-phase/v1', phaseId: 'phase-1', reason: 'save-import',
      documentToken: priorToken, stage, sequence: index + 1, tickerStarted,
      performanceNow: 500 + index, error: null,
    }),
  }));
  const phaseSuccess = importPhaseOutcome(phaseRows, phaseOptions);
  if (phaseSuccess.status !== 'ready' || phaseSuccess.lastStage !== 'release-complete') {
    failures.push(`valid import-phase sequence was rejected: ${JSON.stringify(phaseSuccess)}`);
  }
  const waitingRows = [phaseRows[0], phaseRows[1], {
    ...phaseRows[2], validation: validateImportPhaseWitness({
      ...phaseRows[2].validation.witness, stage: 'waiting-active-persist', sequence: 3,
    }),
  }];
  const waiting = importPhaseOutcome(waitingRows, phaseOptions);
  if (waiting.status !== 'pending' || waiting.lastStage !== 'waiting-active-persist') {
    failures.push(`pending active-persist phase was not diagnosed: ${JSON.stringify(waiting)}`);
  }
  const phaseControls = [
    ['missing-start', phaseRows.slice(1), 'failed'],
    ['duplicate', [...phaseRows.slice(0, 2), phaseRows[1]], 'failed'],
    ['wrong-phase', phaseRows.map((row, index) => index === 2 ? {
      ...row, validation: validateImportPhaseWitness({ ...row.validation.witness, phaseId: 'other-phase' }),
    } : row), 'failed'],
    ['wrong-token', phaseRows.map((row, index) => index === 2 ? {
      ...row, validation: validateImportPhaseWitness({ ...row.validation.witness, documentToken: 'other-token' }),
    } : row), 'failed'],
    ['wrong-session', phaseRows.map((row, index) => index === 2 ? { ...row, sessionId: 'other-session' } : row), 'failed'],
    ['wrong-context', phaseRows.map((row, index) => index === 2 ? {
      ...row, context: { ...row.context, uniqueId: 'other-context' },
    } : row), 'failed'],
    ['wrong-loader', phaseRows.map((row, index) => index === 2 ? { ...row, loaderId: 'other-loader' } : row), 'failed'],
    ['ticker-stopped-before-invoked', phaseRows.map((row, index) => index === 0 ? {
      ...row, validation: validateImportPhaseWitness({ ...row.validation.witness, tickerStarted: false }),
    } : row), 'failed'],
    ['ticker-running-after-claim', phaseRows.map((row, index) => index === 1 ? {
      ...row, validation: validateImportPhaseWitness({ ...row.validation.witness, tickerStarted: true }),
    } : row), 'failed'],
    ['just-late', phaseRows.map((row, index) => index === phaseRows.length - 1 ? { ...row, at: 110 } : row), 'failed'],
    ['overlong-terminal', [...phaseRows, {
      ...phaseRows.at(-1), receiptOrdinal: 9,
      validation: validateImportPhaseWitness({
        ...phaseRows.at(-1).validation.witness, sequence: 8,
      }),
    }], 'failed'],
  ];
  for (const [label, rows, status] of phaseControls) {
    const outcome = importPhaseOutcome(rows, phaseOptions);
    if (outcome.status !== status) {
      failures.push(`${label} import-phase control was accepted: ${JSON.stringify(outcome)}`);
    }
  }
  const retainedCanvas = structuredClone(validRelease);
  retainedCanvas.appCanvas.afterWidth = 2;
  const retainedRejected = validateReloadReleaseWitness(JSON.stringify(retainedCanvas), ordinaryViewport);
  if (retainedRejected.ok || !/larger than 1x1/.test(retainedRejected.why || '')) {
    failures.push(`retained reload canvas was accepted: ${JSON.stringify(retainedRejected)}`);
  }
  const unreleasedRenderer = structuredClone(validRelease);
  unreleasedRenderer.rendererReleased = false;
  const rendererRejected = validateReloadReleaseWitness(unreleasedRenderer, ordinaryViewport);
  if (rendererRejected.ok || !/rendererReleased/.test(rendererRejected.why || '')) {
    failures.push(`unreleased renderer witness was accepted: ${JSON.stringify(rendererRejected)}`);
  }
  const oversizedCanvas = structuredClone(validRelease);
  oversizedCanvas.backdropCanvas.beforeWidth = 4096;
  oversizedCanvas.backdropCanvas.beforeHeight = 2049;
  const oversizedRejected = validateReloadReleaseWitness(oversizedCanvas, ordinaryViewport);
  if (oversizedRejected.ok || !/aggregate twin/.test(oversizedRejected.why || '')) {
    failures.push(`over-budget reload canvas was accepted: ${JSON.stringify(oversizedRejected)}`);
  }
  const underResolvedRelease = structuredClone(validRelease);
  underResolvedRelease.appCanvas.beforeWidth = 1;
  underResolvedRelease.appCanvas.beforeHeight = 1;
  const underResolvedReleaseRejected = validateReloadReleaseWitness(underResolvedRelease, ordinaryViewport);
  if (underResolvedReleaseRejected.ok || !/meaningful bounded selected-tier/.test(underResolvedReleaseRejected.why || '')) {
    failures.push(`under-resolved reload canvas was accepted: ${JSON.stringify(underResolvedReleaseRejected)}`);
  }
  const asymmetricRelease = structuredClone(validRelease);
  asymmetricRelease.backdropCanvas.beforeWidth = 4095;
  const asymmetricReleaseRejected = validateReloadReleaseWitness(asymmetricRelease, ordinaryViewport);
  if (asymmetricReleaseRejected.ok || !/exact selected-density/.test(asymmetricReleaseRejected.why || '')) {
    failures.push(`asymmetric reload canvases were accepted: ${JSON.stringify(asymmetricReleaseRejected)}`);
  }
  /* With exactly two strict half-budget canvases, the aggregate ceiling is
     mathematically implied. Keep the explicit sum invariant anyway, and
     exercise its own diagnosis with two dimensions that were individually
     plausible under the former 4096²-per-canvas rule. */
  const combinedOversized = structuredClone(validRelease);
  combinedOversized.appCanvas.beforeWidth = 3072;
  combinedOversized.appCanvas.beforeHeight = 3072;
  combinedOversized.backdropCanvas.beforeWidth = 3072;
  combinedOversized.backdropCanvas.beforeHeight = 3072;
  const combinedRejected = validateReloadReleaseWitness(combinedOversized, ordinaryViewport);
  if (combinedRejected.ok || !/aggregate twin/.test(combinedRejected.why || '')) {
    failures.push(`combined over-budget reload canvases were accepted: ${JSON.stringify(combinedRejected)}`);
  }
  const readyPayload = {
    schema: 'cf-v2-slice-ready/v1', status: 'ready', token: 'replacement-token',
    href: 'http://127.0.0.1:1234/', readyState: 'complete', saveReady: true,
    viewConnected: true, rendererReady: true, stageReady: true, tickerTicks: 2,
    backingWidth: 4096, backingHeight: 2048,
    backdropBackingWidth: 4096, backdropBackingHeight: 2048,
    combinedBackingPixels: MAX_TWIN_BACKING_PIXELS,
    rendererDpr: 1,
    backingPixelCapPerCanvas: DEFAULT_CANVAS_BACKING_PIXELS,
    viewportWidth: ordinaryViewport.width, viewportHeight: ordinaryViewport.height,
    performanceNow: 123,
  };
  const readyValidation = validateSliceReadyWitness(JSON.stringify(readyPayload), ordinaryViewport);
  const readyRow = {
    at: 129, sessionId: 'target-session', executionContextId: 7, loaderId: 'replacement-loader',
    context: { active: true, isDefault: true, frameId: 'top-frame', generation: 2,
      uniqueId: 'replacement-context', origin: 'http://127.0.0.1:1234',
      createdAt: 111 }, validation: readyValidation,
  };
  const navigationRows = [{
    at: 110, method: 'Page.frameNavigated', frameId: 'top-frame', parentId: null,
    loaderId: 'replacement-loader', url: readyPayload.href, unreachableUrl: null,
  }];
  const navigationOutcome = replacementNavigationOutcome(navigationRows, {
    priorLoaderId, priorFrameId: 'top-frame', expectedUrl: readyPayload.href,
    releaseAt: 100, navigationDeadline: 120,
  });
  if (navigationOutcome.status !== 'ready' || navigationOutcome.row?.loaderId !== 'replacement-loader') {
    failures.push(`valid event-owned replacement navigation was rejected: ${JSON.stringify(navigationOutcome)}`);
  }
  const childNavigation = replacementNavigationOutcome([{
    ...navigationRows[0], parentId: 'top-frame', frameId: 'child-frame',
  }], {
    priorLoaderId, priorFrameId: 'top-frame', expectedUrl: readyPayload.href,
    releaseAt: 100, navigationDeadline: 120,
  });
  if (childNavigation.status !== 'pending') {
    failures.push(`child-frame navigation manufactured replacement boot: ${JSON.stringify(childNavigation)}`);
  }
  const lateNavigationCommit = replacementNavigationOutcome([
    { ...navigationRows[0], at: 120 },
  ], {
    priorLoaderId, priorFrameId: 'top-frame', expectedUrl: readyPayload.href,
    releaseAt: 100, navigationDeadline: 120,
  });
  if (lateNavigationCommit.status !== 'failed' || !/deadline/.test(lateNavigationCommit.why || '')) {
    failures.push(`just-late event-owned navigation was accepted: ${JSON.stringify(lateNavigationCommit)}`);
  }
  const readyOptions = {
    priorToken, priorFrameId: 'top-frame', priorContextUniqueId: 'old-context',
    priorContextGeneration: 1,
    expectedUrl: readyPayload.href, expectedOrigin: 'http://127.0.0.1:1234',
    expectedSessionId: 'target-session', replacementLoaderId: 'replacement-loader',
    releaseAt: 100, commitAt: 110,
    bootDeadline: 130,
  };
  const bootRows = BOOT_PHASE_STAGES.map((stage, index) => ({
    at: 111 + index, sessionId: 'target-session', executionContextId: 7,
    loaderId: 'replacement-loader',
    context: { ...readyRow.context },
    validation: validateBootPhaseWitness({
      schema: 'cf-v2-boot-phase/v1', documentToken: readyPayload.token,
      stage, sequence: index + 1,
      tickerStarted: index >= BOOT_PHASE_STAGES.indexOf('ticker-started'),
      performanceNow: index + 1, error: null,
    }),
  }));
  const bootOptions = {
    priorToken, priorFrameId: 'top-frame', priorContextUniqueId: 'old-context',
    priorContextGeneration: 1, expectedOrigin: 'http://127.0.0.1:1234',
    expectedSessionId: 'target-session', replacementLoaderId: 'replacement-loader',
    releaseAt: 100, commitAt: 110, bootDeadline: 130,
  };
  const exactBoot = replacementBootPhaseOutcome(bootRows, bootOptions);
  if (exactBoot.status !== 'ready' || exactBoot.documentToken !== readyPayload.token
    || exactBoot.lastStage !== 'ready-emitted') {
    failures.push(`valid replacement boot-phase sequence was rejected: ${JSON.stringify(exactBoot)}`);
  }
  const partialBoot = replacementBootPhaseOutcome(bootRows.slice(0, 5), bootOptions);
  if (partialBoot.status !== 'pending' || partialBoot.lastStage !== 'save-load-complete') {
    failures.push(`valid partial replacement boot-phase sequence was not pending: ${JSON.stringify(partialBoot)}`);
  }
  const missingBoot = bootRows.filter((_, index) => index !== 5);
  const reorderedBoot = [...bootRows];
  [reorderedBoot[4], reorderedBoot[5]] = [reorderedBoot[5], reorderedBoot[4]];
  const bootControls = [
    ['missing', missingBoot, {}, /sequence/],
    ['reordered', reorderedBoot, {}, /sequence/],
    ['duplicate', [...bootRows.slice(0, 5), bootRows[4], ...bootRows.slice(5)], {}, /duplicate or overlong/],
    ['early-ticker', bootRows.map((row, index) => index === 4 ? {
      ...row, validation: validateBootPhaseWitness({ ...row.validation.witness, tickerStarted: true }),
    } : row), {}, /ticker state/],
    ['stopped-after-start', bootRows.map((row, index) => index === 9 ? {
      ...row, validation: validateBootPhaseWitness({ ...row.validation.witness, tickerStarted: false }),
    } : row), {}, /ticker state/],
    ['just-late', bootRows.map((row, index) => index === 10 ? {
      ...row, at: bootOptions.bootDeadline,
    } : row), {}, /deadline/],
    ['wrong-token', bootRows.map((row, index) => index === 4 ? {
      ...row, validation: validateBootPhaseWitness({ ...row.validation.witness, documentToken: 'wrong-token' }),
    } : row), {}, /document identity/],
    ['wrong-context', bootRows.map((row, index) => index === 4 ? {
      ...row, context: { ...row.context, uniqueId: 'wrong-context' },
    } : row), {}, /active replacement top-frame context/],
    ['wrong-session', bootRows.map((row, index) => index === 4 ? {
      ...row, sessionId: 'wrong-session',
    } : row), {}, /active replacement top-frame context/],
    ['wrong-loader', bootRows.map((row, index) => index === 4 ? {
      ...row, loaderId: 'wrong-loader',
    } : row), {}, /active replacement top-frame context/],
    ['destroyed-context', bootRows, { contextStillActive: false }, /active replacement top-frame context/],
  ];
  for (const [label, rows, overrides, diagnosis] of bootControls) {
    const outcome = replacementBootPhaseOutcome(rows, { ...bootOptions, ...overrides });
    if (outcome.status !== 'failed' || !diagnosis.test(outcome.why || '')) {
      failures.push(`${label} replacement boot-phase control was accepted: ${JSON.stringify(outcome)}`);
    }
  }
  const eventReady = replacementReadyOutcome([readyRow], readyOptions);
  if (eventReady.status !== 'ready') {
    failures.push(`valid event-owned slice readiness was rejected: ${JSON.stringify(eventReady)}`);
  }
  /* Observer scheduling is not product timing. A witness received before
     its deadline remains timely even if the next Node loop turn is 60s
     later; the bounded confirmation below is diagnosed separately. */
  const delayedObserverReady = replacementReadyOutcome([readyRow], readyOptions);
  if (delayedObserverReady.status !== 'ready') {
    failures.push(`timely binding became late when observer processing was delayed: ${JSON.stringify(delayedObserverReady)}`);
  }
  const confirmationBeforeDeadline = confirmationDeadlineOutcome(129, 130);
  const confirmationAtDeadline = confirmationDeadlineOutcome(130, 130);
  if (!confirmationBeforeDeadline.ok || confirmationAtDeadline.ok
    || !/after the replacement boot deadline/.test(confirmationAtDeadline.why || '')) {
    failures.push(`bounded confirmation deadline control failed: ${JSON.stringify({ confirmationBeforeDeadline, confirmationAtDeadline })}`);
  }
  const heartbeatFixture = { product: 'Chrome/150', protocolVersion: '1.3' };
  const makeConfirmationControl = ({ cycle = 1, postRenderPriority = null } = {}) => {
    let fakeNow = 100;
    const calls = [];
    const pending = new Map();
    const outcome = runBoundedReadyConfirmation({
      send(method, params, commandSessionId, options) {
        calls.push({ method, params, commandSessionId, options });
        return new Promise((resolve, reject) => pending.set(method, { resolve, reject }));
      },
      sessionId: 'target-session', executionContextId: 7, expression: 'true',
      readyReceiptAt: 99, bootDeadline: 10_000, maxTimeoutMs: PHASE_PROBE_TIMEOUT_MS,
      now: () => fakeNow, cycle, postRenderPriority,
    });
    return {
      calls, pending, outcome,
      settle(method, value, at, reject = false) {
        fakeNow = at;
        const owner = pending.get(method);
        if (!owner) throw new Error(`missing confirmation control command ${method}`);
        reject ? owner.reject(value) : owner.resolve(value);
      },
    };
  };
  const bothPass = makeConfirmationControl();
  bothPass.settle('Runtime.evaluate', { result: { value: true } }, 101);
  await Promise.resolve();
  bothPass.settle('Browser.getVersion', heartbeatFixture, 102);
  const bothPassOutcome = await bothPass.outcome;
  if (!bothPassOutcome.ok || bothPassOutcome.classification !== 'confirmed'
    || bothPass.calls.length !== 2 || bothPassOutcome.commands.length !== 2
    || bothPass.calls[0]?.method !== 'Runtime.evaluate'
    || bothPass.calls[0]?.commandSessionId !== 'target-session'
    || bothPass.calls[0]?.params?.contextId !== 7
    || bothPass.calls[1]?.method !== 'Browser.getVersion'
    || bothPass.calls[1]?.commandSessionId !== undefined
    || bothPassOutcome.commands.some((row) => row.status !== 'completed'
      || row.startedAt !== 100 || row.timeoutMs !== PHASE_PROBE_TIMEOUT_MS)) {
    failures.push(`target/heartbeat positive control failed: ${JSON.stringify({ calls: bothPass.calls, outcome: bothPassOutcome })}`);
  }
  const postRenderPass = makeConfirmationControl({ cycle: 2, postRenderPriority: -50 });
  postRenderPass.settle('Runtime.evaluate', { result: { value: true } }, 101);
  await Promise.resolve();
  postRenderPass.settle('Browser.getVersion', heartbeatFixture, 102);
  const postRenderPassOutcome = await postRenderPass.outcome;
  if (!postRenderPassOutcome.ok || postRenderPassOutcome.classification !== 'confirmed'
    || postRenderPass.calls[0]?.params?.awaitPromise !== true
    || !/ticker is not running/.test(postRenderPass.calls[0]?.params?.expression || '')
    || !/ticker\.addOnce/.test(postRenderPass.calls[0]?.params?.expression || '')
    || !/,undefined,-50\)/.test(postRenderPass.calls[0]?.params?.expression || '')) {
    failures.push(`post-render confirmation scheduling control failed: ${JSON.stringify({ calls: postRenderPass.calls, outcome: postRenderPassOutcome })}`);
  }
  {
    let fakeNow = 10_050;
    const nearDeadline = runBoundedReadyConfirmation({
      send: async (method) => method === 'Runtime.evaluate'
        ? { result: { value: true } } : heartbeatFixture,
      sessionId: 'target-session', executionContextId: 7, expression: 'true',
      readyReceiptAt: 9_999, bootDeadline: 10_000,
      maxTimeoutMs: PHASE_PROBE_TIMEOUT_MS, now: () => fakeNow,
    });
    fakeNow = 10_100;
    const nearDeadlineOutcome = await nearDeadline;
    if (!nearDeadlineOutcome.ok
      || nearDeadlineOutcome.commands.some((row) => row.timeoutMs !== PHASE_PROBE_TIMEOUT_MS)) {
      failures.push(`timely near-deadline ready witness lost its independent confirmation window: ${JSON.stringify(nearDeadlineOutcome)}`);
    }
    const lateReadyOutcome = await runBoundedReadyConfirmation({
      send: async () => { throw new Error('late ready must not issue a command'); },
      sessionId: 'target-session', executionContextId: 7, expression: 'true',
      readyReceiptAt: 10_000, bootDeadline: 10_000, now: () => 10_001,
    });
    if (lateReadyOutcome.ok || lateReadyOutcome.commands.length
      || !/timely ready witness/.test(lateReadyOutcome.why || '')) {
      failures.push(`late ready witness was granted a confirmation window: ${JSON.stringify(lateReadyOutcome)}`);
    }
  }
  const commandLedger = [
    { method: 'Runtime.evaluate/import-arm', role: 'import-arm', cycle: 0,
      startedAt: 90, endedAt: 99, durationMs: 9, timeoutMs: PHASE_PROBE_TIMEOUT_MS,
      status: 'completed', sessionId: 'target-session', executionContextId: null,
      awaitPromise: false, postRenderPriority: null },
    ...bothPassOutcome.commands,
    ...postRenderPassOutcome.commands,
  ];
  const commandLedgerOptions = { sessionId: 'target-session', executionContextId: 7 };
  const commandLedgerAccepted = reloadCommandLedgerOutcome(commandLedger, commandLedgerOptions);
  if (!commandLedgerAccepted.ok) {
    failures.push(`valid replacement command ledger was rejected: ${JSON.stringify(commandLedgerAccepted)}`);
  }
  const commandLedgerControls = [
    ['missing', commandLedger.slice(0, -1)],
    ['duplicate', [...commandLedger, commandLedger.at(-1)]],
    ['wrong-role', commandLedger.map((row, index) => index === 2 ? { ...row, role: 'target-exact-context' } : row)],
    ['wrong-cycle', commandLedger.map((row, index) => index === 3 ? { ...row, cycle: 1 } : row)],
    ['wrong-session', commandLedger.map((row, index) => index === 1 ? { ...row, sessionId: null } : row)],
    ['wrong-context', commandLedger.map((row, index) => index === 3 ? { ...row, executionContextId: 8 } : row)],
    ['wrong-await', commandLedger.map((row, index) => index === 3 ? { ...row, awaitPromise: false } : row)],
    ['wrong-priority', commandLedger.map((row, index) => index === 3 ? { ...row, postRenderPriority: 0 } : row)],
  ];
  for (const [label, rows] of commandLedgerControls) {
    const outcome = reloadCommandLedgerOutcome(rows, commandLedgerOptions);
    if (outcome.ok) failures.push(`${label} replacement command-ledger control stayed green`);
  }
  const targetTimeout = makeConfirmationControl();
  targetTimeout.settle('Browser.getVersion', heartbeatFixture, 101);
  await Promise.resolve();
  targetTimeout.settle('Runtime.evaluate', new Error('timed out waiting for Runtime.evaluate'), 2_100, true);
  const targetTimeoutOutcome = await targetTimeout.outcome;
  if (targetTimeoutOutcome.ok || targetTimeoutOutcome.classification !== 'product-unanswerable-after-ready'
    || targetTimeout.calls.length !== 2
    || targetTimeoutOutcome.commands.find((row) => row.method === 'Runtime.evaluate')?.status !== 'timed-out'
    || targetTimeoutOutcome.commands.find((row) => row.method === 'Browser.getVersion')?.status !== 'completed') {
    failures.push(`target-timeout/browser-heartbeat control was not classified as product-unanswerable: ${JSON.stringify({ calls: targetTimeout.calls, outcome: targetTimeoutOutcome })}`);
  }
  {
    let fakeNow = 100;
    const pending = new Map();
    const outcomePending = runBoundedOutcomeHeartbeatProbe({
      send(method) {
        return new Promise((resolve, reject) => pending.set(method, { resolve, reject }));
      },
      sessionId: 'target-session', executionContextId: 7,
      expression: `({ok:false,error:'injected product state'})`,
      maxTimeoutMs: PHASE_PROBE_TIMEOUT_MS, now: () => fakeNow,
    });
    fakeNow = 101;
    pending.get('Browser.getVersion').resolve(heartbeatFixture);
    await Promise.resolve();
    fakeNow = 2_100;
    pending.get('Runtime.evaluate').reject(new Error('timed out waiting for Runtime.evaluate'));
    const outcome = await outcomePending;
    if (outcome.ok || outcome.classification !== 'product-unanswerable-after-ready'
      || outcome.commands.length !== 2) {
      failures.push(`bounded product-outcome heartbeat seam misclassified target starvation: ${JSON.stringify(outcome)}`);
    }
  }
  const targetContextLost = makeConfirmationControl();
  targetContextLost.settle('Browser.getVersion', heartbeatFixture, 101);
  await Promise.resolve();
  targetContextLost.settle('Runtime.evaluate', new Error('Cannot find context with specified id'), 102, true);
  const targetContextLostOutcome = await targetContextLost.outcome;
  if (targetContextLostOutcome.ok
    || targetContextLostOutcome.classification !== 'product-unanswerable-after-ready'
    || !/lost its exact target context/.test(targetContextLostOutcome.why || '')) {
    failures.push(`lost-target-context/browser-heartbeat control was misclassified: ${JSON.stringify(targetContextLostOutcome)}`);
  }
  const targetProtocolFailure = makeConfirmationControl();
  targetProtocolFailure.settle('Browser.getVersion', heartbeatFixture, 101);
  await Promise.resolve();
  targetProtocolFailure.settle('Runtime.evaluate', new Error('Malformed CDP response'), 102, true);
  const targetProtocolFailureOutcome = await targetProtocolFailure.outcome;
  if (targetProtocolFailureOutcome.ok
    || targetProtocolFailureOutcome.classification !== 'instrument-or-transport-failure') {
    failures.push(`target protocol failure was not kept instrument-fail: ${JSON.stringify(targetProtocolFailureOutcome)}`);
  }
  const bothTimeout = makeConfirmationControl();
  bothTimeout.settle('Runtime.evaluate', new Error('timed out waiting for Runtime.evaluate'), 2_100, true);
  await Promise.resolve();
  bothTimeout.settle('Browser.getVersion', new Error('timed out waiting for Browser.getVersion'), 2_100, true);
  const bothTimeoutOutcome = await bothTimeout.outcome;
  if (bothTimeoutOutcome.ok || bothTimeoutOutcome.classification !== 'instrument-or-transport-failure'
    || bothTimeout.calls.length !== 2
    || bothTimeoutOutcome.commands.some((row) => row.status !== 'timed-out')) {
    failures.push(`dual-timeout control was not classified as instrument/transport failure: ${JSON.stringify({ calls: bothTimeout.calls, outcome: bothTimeoutOutcome })}`);
  }
  const heartbeatLate = makeConfirmationControl();
  heartbeatLate.settle('Runtime.evaluate', { result: { value: true } }, 101);
  await Promise.resolve();
  heartbeatLate.settle('Browser.getVersion', heartbeatFixture, 2_100);
  const heartbeatLateOutcome = await heartbeatLate.outcome;
  if (heartbeatLateOutcome.ok || heartbeatLateOutcome.classification !== 'instrument-or-transport-failure'
    || heartbeatLateOutcome.commands.find((row) => row.method === 'Browser.getVersion')?.status !== 'completed-late'
    || !/heartbeat failed/.test(heartbeatLateOutcome.why || '')) {
    failures.push(`exact-boundary heartbeat control was accepted: ${JSON.stringify(heartbeatLateOutcome)}`);
  }
  const targetLate = makeConfirmationControl();
  targetLate.settle('Browser.getVersion', heartbeatFixture, 101);
  await Promise.resolve();
  targetLate.settle('Runtime.evaluate', { result: { value: true } }, 2_100);
  const targetLateOutcome = await targetLate.outcome;
  if (targetLateOutcome.ok || targetLateOutcome.classification !== 'product-unanswerable-after-ready'
    || targetLateOutcome.commands.find((row) => row.method === 'Runtime.evaluate')?.status !== 'completed-late'
    || !/2000ms command bound/.test(targetLateOutcome.why || '')) {
    failures.push(`exact-boundary target control was accepted: ${JSON.stringify(targetLateOutcome)}`);
  }
  const confirmedState = {
    ready: true, token: readyPayload.token, href: readyPayload.href,
    readyState: 'complete', viewConnected: true, rendererReady: true,
    stageReady: true, tickerStarted: true, tickerTicks: 2,
    backingWidth: readyPayload.backingWidth, backingHeight: readyPayload.backingHeight,
    backdropBackingWidth: readyPayload.backdropBackingWidth,
    backdropBackingHeight: readyPayload.backdropBackingHeight,
    combinedBackingPixels: readyPayload.combinedBackingPixels,
    rendererDpr: readyPayload.rendererDpr,
    backingPixelCapPerCanvas: readyPayload.backingPixelCapPerCanvas,
    viewportWidth: readyPayload.viewportWidth, viewportHeight: readyPayload.viewportHeight,
  };
  const firstState = confirmationStateOutcome(confirmedState, readyPayload, readyPayload.href, ordinaryViewport);
  const secondState = confirmationStateOutcome({ ...confirmedState, tickerTicks: 3 }, readyPayload,
    readyPayload.href, ordinaryViewport, confirmedState.tickerTicks);
  const stalledSecondState = confirmationStateOutcome(confirmedState, readyPayload,
    readyPayload.href, ordinaryViewport, confirmedState.tickerTicks);
  const olderThanWitnessState = confirmationStateOutcome({
    ...confirmedState, tickerTicks: readyPayload.tickerTicks - 1,
  }, readyPayload, readyPayload.href, ordinaryViewport);
  const staleDprState = confirmationStateOutcome({
    ...confirmedState, rendererDpr: confirmedState.rendererDpr / 2,
  }, readyPayload, readyPayload.href, ordinaryViewport);
  if (!firstState.ok || !secondState.ok || stalledSecondState.ok
    || !/newer ticker turn/.test(stalledSecondState.why || '')
    || olderThanWitnessState.ok || !/older than the ready witness/.test(olderThanWitnessState.why || '')
    || staleDprState.ok || !/selected viewport tier/.test(staleDprState.why || '')) {
    failures.push(`two-cycle ticker-progress control failed: ${JSON.stringify({ firstState, secondState, stalledSecondState, olderThanWitnessState, staleDprState })}`);
  }
  let importArmTimeoutCalls = 0;
  const importArmTimeout = await runBoundedImportArm({
    send: async () => { importArmTimeoutCalls++; throw new Error('timed out waiting for Runtime.evaluate'); },
    sessionId: 'target-session', expression: 'true', importDeadline: 130,
    now: (() => { const times = [120, 121, 129]; return () => times.shift() ?? 129; })(),
  });
  if (importArmTimeout.ok || importArmTimeoutCalls !== 1
    || importArmTimeout.command?.status !== 'failed'
    || !/instrument failed/.test(importArmTimeout.why || '')) {
    failures.push(`bounded import-arm timeout did not fail once without retry: ${JSON.stringify({ importArmTimeoutCalls, importArmTimeout })}`);
  }
  let lateImportArmCalls = 0;
  const lateImportArm = await runBoundedImportArm({
    send: async () => { lateImportArmCalls++; return { result: { value: true } }; },
    sessionId: 'target-session', expression: 'true', importDeadline: 130,
    now: (() => { const times = [120, 121, 130]; return () => times.shift() ?? 130; })(),
  });
  if (lateImportArm.ok || lateImportArmCalls !== 1
    || lateImportArm.command?.status !== 'completed'
    || !/after its import deadline/.test(lateImportArm.why || '')) {
    failures.push(`late successful import arm did not fail once with coherent evidence: ${JSON.stringify({ lateImportArmCalls, lateImportArm })}`);
  }
  const readyControls = [
    ['missing', [], 'pending'],
    ['duplicate', [readyRow, readyRow], 'failed'],
    ['same-token', [{ ...readyRow, validation: validateSliceReadyWitness({ ...readyPayload, token: priorToken }, ordinaryViewport) }], 'failed'],
    ['wrong-url', [{ ...readyRow, validation: validateSliceReadyWitness({ ...readyPayload, href: 'http://wrong.invalid/' }, ordinaryViewport) }], 'failed'],
    ['wrong-context', [{ ...readyRow, context: { isDefault: false, frameId: 'top-frame' } }], 'failed'],
    ['wrong-session', [{ ...readyRow, sessionId: 'other-session' }], 'failed'],
    ['destroyed-context', [readyRow], 'failed', { contextStillActive: false }],
    ['old-context-reuse', [{ ...readyRow, context: { ...readyRow.context, uniqueId: 'old-context' } }], 'failed'],
    ['old-context-generation', [{ ...readyRow, context: { ...readyRow.context, generation: 1 } }], 'failed'],
    ['wrong-origin', [{ ...readyRow, context: { ...readyRow.context, origin: 'http://wrong.invalid' } }], 'failed'],
    ['wrong-loader', [{ ...readyRow, loaderId: 'other-loader' }], 'failed'],
    ['before-commit', [{ ...readyRow, at: 109 }], 'failed'],
    ['just-late', [{ ...readyRow, at: 130 }], 'failed'],
  ];
  for (const [label, rows, status, overrides = {}] of readyControls) {
    const outcome = replacementReadyOutcome(rows, { ...readyOptions, ...overrides });
    if (outcome.status !== status) {
      failures.push(`${label} slice-ready control was accepted: ${JSON.stringify(outcome)}`);
    }
  }
  const incompleteReady = validateSliceReadyWitness({ ...readyPayload, viewConnected: false }, ordinaryViewport);
  if (incompleteReady.ok || !/complete wired/.test(incompleteReady.why || '')) {
    failures.push(`incomplete slice-ready payload was accepted: ${JSON.stringify(incompleteReady)}`);
  }
  const malformedReady = validateSliceReadyWitness('{bad json', ordinaryViewport);
  if (malformedReady.ok || !/not JSON/.test(malformedReady.why || '')) {
    failures.push(`malformed slice-ready payload was accepted: ${JSON.stringify(malformedReady)}`);
  }
  const missingTwinReadyPayload = { ...readyPayload };
  delete missingTwinReadyPayload.backdropBackingWidth;
  const missingTwinReady = validateSliceReadyWitness(missingTwinReadyPayload, ordinaryViewport);
  if (missingTwinReady.ok || !/twin backing dimensions/.test(missingTwinReady.why || '')) {
    failures.push(`slice-ready payload missing backdrop evidence was accepted: ${JSON.stringify(missingTwinReady)}`);
  }
  const falseCombinedReady = validateSliceReadyWitness({
    ...readyPayload, combinedBackingPixels: readyPayload.combinedBackingPixels - 1,
  }, ordinaryViewport);
  if (falseCombinedReady.ok || !/twin backing budget/.test(falseCombinedReady.why || '')) {
    failures.push(`slice-ready payload with a false combined count was accepted: ${JSON.stringify(falseCombinedReady)}`);
  }
  const ultra5kViewport = { width: 5120, height: 2880, dpr: 1, mobile: false };
  const ultra8kPlan = expectedDensityPlan(ultraViewport);
  const ultra5kPlan = expectedDensityPlan(ultra5kViewport);
  if (ultra8kPlan?.dpr !== 0.25 || ultra5kPlan?.dpr !== 0.375
    || ultra8kPlan?.backingPixelCapPerCanvas !== ULTRA_CANVAS_BACKING_PIXELS
    || ultra5kPlan?.backingPixelCapPerCanvas !== ULTRA_CANVAS_BACKING_PIXELS
    || ultra8kPlan?.backingWidth !== 1920 || ultra8kPlan?.backingHeight !== 1080
    || ultra5kPlan?.backingWidth !== 1920 || ultra5kPlan?.backingHeight !== 1080
    || ultra8kPlan.backingWidth * ultra8kPlan.backingHeight * 2 !== 4_147_200
    || ultra5kPlan.backingWidth * ultra5kPlan.backingHeight * 2 !== 4_147_200) {
    failures.push(`exact 8K/5K ultra-density policy drifted: ${JSON.stringify({ ultra8kPlan, ultra5kPlan })}`);
  }
  const ultraReadyPayload = {
    ...readyPayload,
    backingWidth: 1920, backingHeight: 1080,
    backdropBackingWidth: 1920, backdropBackingHeight: 1080,
    combinedBackingPixels: 1920 * 1080 * 2,
    rendererDpr: ultra8kPlan.dpr,
    backingPixelCapPerCanvas: ULTRA_CANVAS_BACKING_PIXELS,
    viewportWidth: ultraViewport.width, viewportHeight: ultraViewport.height,
  };
  const ultraReady = validateSliceReadyWitness(ultraReadyPayload, ultraViewport);
  if (!ultraReady.ok) {
    failures.push(`valid ultra-viewport selected-tier witness was rejected: ${JSON.stringify(ultraReady)}`);
  }
  const staleUltraDpr = validateSliceReadyWitness({
    ...ultraReadyPayload, rendererDpr: readyPayload.rendererDpr,
  }, ultraViewport);
  if (staleUltraDpr.ok || !/selected backing tier/.test(staleUltraDpr.why || '')) {
    failures.push(`stale ultra renderer DPR was accepted: ${JSON.stringify(staleUltraDpr)}`);
  }
  const underResolvedUltra = validateSliceReadyWitness({
    ...ultraReadyPayload,
    backingWidth: 2, backingHeight: 2,
    backdropBackingWidth: 2, backdropBackingHeight: 2,
    combinedBackingPixels: 8,
  }, ultraViewport);
  if (underResolvedUltra.ok || !/twin backing budget/.test(underResolvedUltra.why || '')) {
    failures.push(`under-resolved ultra witness was accepted: ${JSON.stringify(underResolvedUltra)}`);
  }
  const asymmetricUltra = validateSliceReadyWitness({
    ...ultraReadyPayload,
    backdropBackingWidth: ultraReadyPayload.backdropBackingWidth - 1,
    combinedBackingPixels: ultraReadyPayload.backingWidth * ultraReadyPayload.backingHeight
      + (ultraReadyPayload.backdropBackingWidth - 1) * ultraReadyPayload.backdropBackingHeight,
  }, ultraViewport);
  if (asymmetricUltra.ok || !/twin backing budget/.test(asymmetricUltra.why || '')) {
    failures.push(`asymmetric ultra witness was accepted: ${JSON.stringify(asymmetricUltra)}`);
  }
  if (backingPixelCapForViewport(4096, 2048) !== DEFAULT_CANVAS_BACKING_PIXELS
    || backingPixelCapForViewport(4097, 2048) !== ULTRA_CANVAS_BACKING_PIXELS) {
    failures.push('ultra backing tier did not switch strictly above the 8,388,608 CSS-pixel threshold');
  }
  const nativeUhdPlan = expectedDensityPlan({ width: 3840, height: 2160, dpr: 1, mobile: false });
  if (nativeUhdPlan?.dpr !== 1 || nativeUhdPlan?.backingWidth !== 3840
    || nativeUhdPlan?.backingHeight !== 2160
    || nativeUhdPlan?.backingPixelCapPerCanvas !== DEFAULT_CANVAS_BACKING_PIXELS) {
    failures.push(`native UHD backing was degraded by the ultra tier: ${JSON.stringify(nativeUhdPlan)}`);
  }
  const supersededUltraReady = validateSliceReadyWitness({
    ...ultraReadyPayload,
    /* Retain the new selected-cap field so only the superseded dimensions
       can make this control red. */
    backingPixelCapPerCanvas: ULTRA_CANVAS_BACKING_PIXELS,
    backingWidth: 2365, backingHeight: 1330,
    backdropBackingWidth: 2365, backdropBackingHeight: 1330,
    combinedBackingPixels: 2365 * 1330 * 2,
  }, ultraViewport);
  if (supersededUltraReady.ok || !/twin backing budget/.test(supersededUltraReady.why || '')) {
    failures.push(`superseded 3,145,728-pixel ultra dimensions survived the answerability repair: ${JSON.stringify(supersededUltraReady)}`);
  }
  const supersededUltraRelease = validateReloadReleaseWitness({
    ...validRelease,
    appCanvas: { ...validRelease.appCanvas, beforeWidth: 2365, beforeHeight: 1330 },
    backdropCanvas: { ...validRelease.backdropCanvas, beforeWidth: 2365, beforeHeight: 1330 },
  }, ultraViewport);
  if (supersededUltraRelease.ok || !/selected aggregate twin/.test(supersededUltraRelease.why || '')) {
    failures.push(`superseded 3,145,728-pixel ultra release survived the answerability repair: ${JSON.stringify(supersededUltraRelease)}`);
  }
  const priorUltraReady = validateSliceReadyWitness({
    ...ultraReadyPayload,
    backingWidth: 2730, backingHeight: 1536,
    backdropBackingWidth: 2730, backdropBackingHeight: 1536,
    combinedBackingPixels: 2730 * 1536 * 2,
  }, ultraViewport);
  if (priorUltraReady.ok || !/twin backing budget/.test(priorUltraReady.why || '')) {
    failures.push(`prior 4,194,304-pixel ultra policy survived the answerability repair: ${JSON.stringify(priorUltraReady)}`);
  }
  const priorUltraRelease = validateReloadReleaseWitness({
    ...validRelease,
    appCanvas: { ...validRelease.appCanvas, beforeWidth: 2730, beforeHeight: 1536 },
    backdropCanvas: { ...validRelease.backdropCanvas, beforeWidth: 2730, beforeHeight: 1536 },
  }, ultraViewport);
  if (priorUltraRelease.ok || !/selected aggregate twin/.test(priorUltraRelease.why || '')) {
    failures.push(`prior 4,194,304-pixel ultra release survived the answerability repair: ${JSON.stringify(priorUltraRelease)}`);
  }
  const oldUltraReady = validateSliceReadyWitness({
    ...ultraReadyPayload,
    backingWidth: 3862, backingHeight: 2172,
    backdropBackingWidth: 3862, backdropBackingHeight: 2172,
    combinedBackingPixels: 3862 * 2172 * 2,
  }, ultraViewport);
  if (oldUltraReady.ok || !/twin backing budget/.test(oldUltraReady.why || '')) {
    failures.push(`old 8K half-budget dimensions survived the ultra policy: ${JSON.stringify(oldUltraReady)}`);
  }
  const oldUltraRelease = validateReloadReleaseWitness({
    ...validRelease,
    appCanvas: { ...validRelease.appCanvas, beforeWidth: 3862, beforeHeight: 2172 },
    backdropCanvas: { ...validRelease.backdropCanvas, beforeWidth: 3862, beforeHeight: 2172 },
  }, ultraViewport);
  if (oldUltraRelease.ok || !/selected aggregate twin/.test(oldUltraRelease.why || '')) {
    failures.push(`old 8K release dimensions survived the ultra policy: ${JSON.stringify(oldUltraRelease)}`);
  }
  const productClockLate = validateSliceReadyWitness({
    ...readyPayload, performanceNow: REPLACEMENT_READY_TIMEOUT_MS,
  }, ordinaryViewport);
  if (productClockLate.ok || !/performance timestamp/.test(productClockLate.why || '')) {
    failures.push(`just-late browser-native slice-ready timestamp was accepted: ${JSON.stringify(productClockLate)}`);
  }
  const releaseRow = {
    at: 100, receiptOrdinal: 7, sessionId: 'target-session', loaderId: priorLoaderId,
    context: { active: true, isDefault: true, frameId: 'top-frame', generation: 1,
      uniqueId: 'old-context', origin: 'http://127.0.0.1:1234' },
    validation: releaseAccepted,
  };
  const releaseOptions = {
    priorToken, priorLoaderId, priorFrameId: 'top-frame', priorContextUniqueId: 'old-context',
    priorContextGeneration: 1,
    expectedOrigin: 'http://127.0.0.1:1234', expectedSessionId: 'target-session',
    importDeadline: 110,
  };
  const importRelease = importReleaseOutcome([releaseRow], releaseOptions);
  if (importRelease.status !== 'ready') {
    failures.push(`valid import-owned release was rejected: ${JSON.stringify(importRelease)}`);
  }
  const releaseControls = [
    ['missing', [], 'pending'],
    ['duplicate', [releaseRow, releaseRow], 'failed'],
    ['malformed', [{ ...releaseRow, validation: validateReloadReleaseWitness('{bad json', ordinaryViewport) }], 'failed'],
    ['wrong-reason', [{ ...releaseRow, validation: validateReloadReleaseWitness({ ...validRelease, reason: 'training-restart' }, ordinaryViewport) }], 'failed'],
    ['wrong-token', [{ ...releaseRow, validation: validateReloadReleaseWitness({ ...validRelease, documentToken: 'other-token' }, ordinaryViewport) }], 'failed'],
    ['wrong-context', [{ ...releaseRow, context: { ...releaseRow.context, uniqueId: 'other-context' } }], 'failed'],
    ['wrong-frame', [{ ...releaseRow, context: { ...releaseRow.context, frameId: 'other-frame' } }], 'failed'],
    ['wrong-generation', [{ ...releaseRow, context: { ...releaseRow.context, generation: 2 } }], 'failed'],
    ['wrong-origin', [{ ...releaseRow, context: { ...releaseRow.context, origin: 'http://127.0.0.1:9999' } }], 'failed'],
    ['nondefault-context', [{ ...releaseRow, context: { ...releaseRow.context, isDefault: false } }], 'failed'],
    ['inactive-context', [{ ...releaseRow, context: { ...releaseRow.context, active: false } }], 'failed'],
    ['wrong-loader', [{ ...releaseRow, loaderId: 'other-loader' }], 'failed'],
    ['wrong-session', [{ ...releaseRow, sessionId: 'other-session' }], 'failed'],
    ['just-late', [{ ...releaseRow, at: 110 }], 'failed'],
  ];
  for (const [label, rows, status] of releaseControls) {
    const outcome = importReleaseOutcome(rows, releaseOptions);
    if (outcome.status !== status) {
      failures.push(`${label} import-release control was accepted: ${JSON.stringify(outcome)}`);
    }
  }
  const alignedReleaseRow = { ...releaseRow, at: 105 };
  const alignedRelease = importReleaseOutcome([alignedReleaseRow], releaseOptions);
  const releaseFirstPending = importReleaseSequenceOutcome(
    importPhaseOutcome(phaseRows.slice(0, -1), phaseOptions), alignedRelease, 105, 110,
  );
  if (releaseFirstPending.status !== 'pending') {
    failures.push(`adjacent release-first event ordering did not remain pending: ${JSON.stringify(releaseFirstPending)}`);
  }
  const releaseFirstComplete = importReleaseSequenceOutcome(
    phaseSuccess, alignedRelease, 106, 110,
  );
  if (releaseFirstComplete.status !== 'ready') {
    failures.push(`adjacent release-first event ordering did not settle ready: ${JSON.stringify(releaseFirstComplete)}`);
  }
  const missingReleaseComplete = importReleaseSequenceOutcome(
    importPhaseOutcome(phaseRows.slice(0, -1), phaseOptions), alignedRelease, 110, 110,
  );
  if (missingReleaseComplete.status !== 'failed' || !/deadline/.test(missingReleaseComplete.why || '')) {
    failures.push(`missing release-complete did not fail at the exact import deadline: ${JSON.stringify(missingReleaseComplete)}`);
  }
  const phaseFirstPending = importReleaseSequenceOutcome(
    phaseSuccess, importReleaseOutcome([], releaseOptions), 106, 110,
  );
  if (phaseFirstPending.status !== 'failed' || !/before the release witness/.test(phaseFirstPending.why || '')) {
    failures.push(`impossible phase-complete-first ordering was not rejected: ${JSON.stringify(phaseFirstPending)}`);
  }
  const phaseFirstComplete = importReleaseSequenceOutcome(
    phaseSuccess, importReleaseOutcome([{ ...alignedReleaseRow, at: 107, receiptOrdinal: 9 }], releaseOptions), 107, 110,
  );
  if (phaseFirstComplete.status !== 'failed' || !/exact release-started/.test(phaseFirstComplete.why || '')) {
    failures.push(`late phase-first release was accepted: ${JSON.stringify(phaseFirstComplete)}`);
  }
  const missingReleaseWitness = importReleaseSequenceOutcome(
    importPhaseOutcome(phaseRows.slice(0, -1), phaseOptions), importReleaseOutcome([], releaseOptions), 110, 110,
  );
  if (missingReleaseWitness.status !== 'failed' || !/deadline/.test(missingReleaseWitness.why || '')) {
    failures.push(`missing release witness did not fail at the exact import deadline: ${JSON.stringify(missingReleaseWitness)}`);
  }
  const prematureRelease = importReleaseSequenceOutcome(
    importPhaseOutcome(phaseRows.slice(0, 5), phaseOptions), alignedRelease, 105, 110,
  );
  if (prematureRelease.status !== 'failed' || !/before release-started/.test(prematureRelease.why || '')) {
    failures.push(`release before release-started was accepted: ${JSON.stringify(prematureRelease)}`);
  }
  const interposedBinding = importReleaseSequenceOutcome(
    importPhaseOutcome(phaseRows.slice(0, -1), phaseOptions),
    importReleaseOutcome([{ ...alignedReleaseRow, receiptOrdinal: 8 }], releaseOptions), 105, 110,
  );
  if (interposedBinding.status !== 'failed' || !/immediately after release-started/.test(interposedBinding.why || '')) {
    failures.push(`non-adjacent release binding was accepted: ${JSON.stringify(interposedBinding)}`);
  }
  const lifecycle = compactReloadEvent({ method: 'Page.lifecycleEvent', params: {
    name: 'DOMContentLoaded', frameId: 'top-frame', loaderId: 'replacement-loader',
  } }, new Map(), 5);
  if (!lifecycle || lifecycle.name !== 'DOMContentLoaded'
    || lifecycle.loaderId !== 'replacement-loader') {
    failures.push(`reload lifecycle evidence was not retained: ${JSON.stringify(lifecycle)}`);
  }
  const secondLoader = replacementNavigationOutcome([
    navigationRows[0], { ...navigationRows[0], at: 115, loaderId: 'second-loader' },
  ], {
    priorLoaderId, priorFrameId: 'top-frame', expectedUrl: readyPayload.href,
    releaseAt: 100, navigationDeadline: 120,
  });
  if (secondLoader.status !== 'failed' || !/more than once/.test(secondLoader.why || '')) {
    failures.push(`second replacement loader was accepted: ${JSON.stringify(secondLoader)}`);
  }
  const stickyFatal = [];
  stickyFatal.push(fatalFixtures[0]);
  const diagnosticRing = [];
  pushBoundedReloadEvent(diagnosticRing, fatalFixtures[0]);
  for (let i = 0; i < MAX_RELOAD_EVENTS + 10; i++) {
    pushBoundedReloadEvent(diagnosticRing, { at: i, method: 'Page.lifecycleEvent', name: `benign-${i}` });
  }
  if (diagnosticRing.includes(fatalFixtures[0]) || fatalReloadEvent(stickyFatal) !== fatalFixtures[0]) {
    failures.push('sticky fatal authority did not survive diagnostic-ring eviction');
  }
  return failures;
}
function writeReport({ status, exitCode, browser, findings, instrumentFailures, controlsRun,
  executedControls = [], blockedControls = [], source = runSource || sourceIdentity() }) {
  const counts = new Map();
  for (const { row } of findings) counts.set(row.code, (counts.get(row.code) || 0) + 1);
  const endedAt = Date.now();
  const coverage = controlCoverageOutcome(executedControls, blockedControls);
  if (!coverage.ok) throw new Error(`invalid negative-control coverage: ${coverage.why}`);
  const report = {
    schema: 'cf-v2-glassmatrix/v1',
    status,
    scope: viewportLabel ? 'targeted-diagnostic' : 'full-certifying',
    certifying: !viewportLabel,
    exit: { code: exitCode },
    source,
    browser: browser || null,
    viewportInventory: viewportInventory(),
    controlSummary: {
      selftestRan: controlsRun,
      /* This is an execution ledger, not a planned-coverage claim. A
         targeted viewport remains diagnostic and reports only controls that
         actually ran; controls conditioned on other matrix classes stay in
         omittedNegativeControls. A product failure may explicitly block
         later controls; those stay visible in blockedNegativeControls and
         can never produce PASS. A full run is rejected below if any planned
         control is neither executed nor product-blocked. */
      negativeControls: coverage.executed,
      plannedNegativeControls: [...NEGATIVE_CONTROLS],
      blockedNegativeControls: coverage.blocked,
      omittedNegativeControls: coverage.omitted,
      automaticRetries: 0,
    },
    summary: {
      viewportCount: MATRIX_VIEWPORTS.length,
      findingCount: findings.length,
      instrumentFailureCount: instrumentFailures.length,
      counts: Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b))),
    },
    findings: findings.map(({ context, row }) => ({
      viewport: context.viewport, surface: context.surface, code: row.code,
      element: row.element, actual: row.actual, expected: row.expected,
    })),
    reloadEvidence: [...runReloadEvidence],
    instrumentFailures: [...instrumentFailures],
    durationMs: endedAt - startedAt,
  };
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  return report;
}

async function reportSelftest() {
  const reloadFailures = await reloadPhaseSelftest();
  if (reloadFailures.length) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: replacement-document controls failed (${reloadFailures.join('; ')})`);
  }
  const fixture = {
    status: 'fail', exitCode: 1,
    browser: { product: 'Selftest/1', protocol_version: '1' },
    findings: [{
      context: { viewport: 'primary-phone', surface: 'guide' },
      row: { code: 'TARGET_TOO_SMALL', element: '#fixture', actual: { height: 20 }, expected: { height: 44 } },
    }],
    instrumentFailures: [], controlsRun: true,
  };
  const counts = new Map();
  for (const { row } of fixture.findings) counts.set(row.code, (counts.get(row.code) || 0) + 1);
  const reportCommands = [
    { method: 'Runtime.evaluate/import-arm', role: 'import-arm', cycle: 0,
      startedAt: 1, endedAt: 2, durationMs: 1, timeoutMs: 2000, status: 'completed',
      sessionId: 'target-session', executionContextId: null, awaitPromise: false, postRenderPriority: null },
    { method: 'Runtime.evaluate', role: 'target-exact-context', cycle: 1,
      startedAt: 3, endedAt: 4, durationMs: 1, timeoutMs: 2000, status: 'completed',
      sessionId: 'target-session', executionContextId: 7, awaitPromise: false, postRenderPriority: null },
    { method: 'Browser.getVersion', role: 'browser-process-heartbeat', cycle: 1,
      startedAt: 3, endedAt: 4, durationMs: 1, timeoutMs: 2000, status: 'completed',
      sessionId: null, executionContextId: null, awaitPromise: null, postRenderPriority: null },
    { method: 'Runtime.evaluate', role: 'target-exact-context', cycle: 2,
      startedAt: 5, endedAt: 6, durationMs: 1, timeoutMs: 2000, status: 'completed',
      sessionId: 'target-session', executionContextId: 7, awaitPromise: true, postRenderPriority: -50 },
    { method: 'Browser.getVersion', role: 'browser-process-heartbeat', cycle: 2,
      startedAt: 5, endedAt: 6, durationMs: 1, timeoutMs: 2000, status: 'completed',
      sessionId: null, executionContextId: null, awaitPromise: null, postRenderPriority: null },
  ];
  const reportLedger = reloadCommandLedgerOutcome(reportCommands, {
    sessionId: 'target-session', executionContextId: 7,
  });
  if (!reportLedger.ok) throw new Error(`GLASS MATRIX REPORT SELFTEST: valid command ledger rejected (${reportLedger.why})`);
  const executedBeforeProductFailure = [NEGATIVE_CONTROLS[0]];
  const productBlocks = [{ name: 'ultra-same-backing-resize',
    viewport: 'desktop-8k', findingCode: 'REPLACEMENT_UNANSWERABLE_AFTER_READY' }];
  const productBlockedCoverage = controlCoverageOutcome(executedBeforeProductFailure, productBlocks);
  const overlapCoverage = controlCoverageOutcome(
    [...executedBeforeProductFailure, productBlocks[0].name], productBlocks,
  );
  if (!productBlockedCoverage.ok
    || productBlockedCoverage.omitted.length !== NEGATIVE_CONTROLS.length - 2
    || productBlockedCoverage.blocked.length !== 1
    || overlapCoverage.ok) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: product-blocked control accounting failed (${JSON.stringify({ productBlockedCoverage, overlapCoverage })})`);
  }
  const pointerPass = ultraPointerOutcome({ x: 53, y: 47 }, 53, 47);
  const missingPointer = ultraPointerOutcome(null, 53, 47);
  const offsetPointer = ultraPointerOutcome({ x: 70, y: 47 }, 53, 47);
  if (!combineUltraResizePointerOutcome({ ok: true }, pointerPass).ok
    || combineUltraResizePointerOutcome({ ok: true }, missingPointer).ok
    || combineUltraResizePointerOutcome({ ok: true }, offsetPointer).ok) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: real-pointer resize outcome controls failed');
  }
  const resizeExecuted = ultraControlExecutionOutcome({
    downshift: { ok: true }, restored: { ok: true }, controlsDiscriminated: true,
  });
  const resizeBlockedDown = ultraControlExecutionOutcome({
    downshift: { ok: false }, restored: { ok: true }, controlsDiscriminated: true,
  });
  const resizeBlockedRestore = ultraControlExecutionOutcome({
    downshift: { ok: true }, restored: { ok: false }, controlsDiscriminated: true,
  });
  const resizeVacuous = ultraControlExecutionOutcome({
    downshift: { ok: true }, restored: { ok: true }, controlsDiscriminated: false,
  });
  if (!resizeExecuted.executed || resizeExecuted.blocked
    || !resizeBlockedDown.blocked || resizeBlockedDown.executed
    || !resizeBlockedRestore.blocked || resizeBlockedRestore.executed
    || resizeVacuous.executed || resizeVacuous.blocked) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: same-backing positive/control accounting failed');
  }
  const injectedRows = Array.from({ length: 8 }, () => ({
    controlApplied: true, restored: true, outcome: { ok: false },
  }));
  if (!ultraResizeInjectionControlsOutcome(injectedRows).ok
    || ultraResizeInjectionControlsOutcome(injectedRows.slice(0, 3)).ok
    || ultraResizeInjectionControlsOutcome(injectedRows.map((row, index) => index === 1
      ? { ...row, error: 'injected control threw' } : row)).ok
    || ultraResizeInjectionControlsOutcome(injectedRows.map((row, index) => index === 1
      ? { ...row, outcome: { ok: false, error: 'predicate state unavailable' } } : row)).ok
    || ultraResizeInjectionControlsOutcome(injectedRows.map((row, index) => index === 2
      ? { ...row, controlApplied: false } : row)).ok
    || ultraResizeInjectionControlsOutcome(injectedRows.map((row, index) => index === 3
      ? { ...row, outcome: { ok: true } } : row)).ok) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: same-backing live injection evidence failed closed incorrectly');
  }
  if (!targetedProductRemainderBlocked('primary-phone', true)
    || targetedProductRemainderBlocked(null, true)
    || targetedProductRemainderBlocked('primary-phone', false)) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: targeted product-failure remainder accounting failed');
  }
  const primaryBlocked = productBlockedSuffixForViewport(
    'primary-phone', 'REPLACEMENT_UNANSWERABLE_AFTER_READY', [],
  );
  const landscapeBlocked = productBlockedSuffixForViewport(
    'phone-landscape', 'REPLACEMENT_UNANSWERABLE_AFTER_READY', [],
  );
  const ultraBlocked = productBlockedSuffixForViewport(
    'desktop-8k', 'REPLACEMENT_UNANSWERABLE_AFTER_READY', [],
  );
  const primaryAlreadyExecuted = productBlockedSuffixForViewport(
    'primary-phone', 'REPLACEMENT_UNANSWERABLE_AFTER_READY', ['forced-colors-system-mapping'],
  );
  if (primaryBlocked.length !== 1 || primaryBlocked[0].name !== 'forced-colors-system-mapping'
    || landscapeBlocked.length !== 1 || landscapeBlocked[0].name !== 'mobile-landscape-surface-chrome-yield'
    || ultraBlocked.length !== 1 || ultraBlocked[0].name !== 'ultra-same-backing-resize'
    || primaryAlreadyExecuted.length !== 0
    || productBlockedSuffixForViewport('small-phone', 'REPLACEMENT_UNANSWERABLE_AFTER_READY', []).length) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: full/targeted product-blocked suffix accounting failed');
  }
  const shaped = {
    schema: 'cf-v2-glassmatrix/v1', status: fixture.status, scope: 'full-certifying', certifying: true,
    viewportInventory: viewportInventory(),
    controlSummary: {
      selftestRan: fixture.controlsRun,
      negativeControls: [...NEGATIVE_CONTROLS],
      plannedNegativeControls: [...NEGATIVE_CONTROLS],
      blockedNegativeControls: [],
      omittedNegativeControls: [],
      automaticRetries: 0,
    },
    summary: { findingCount: fixture.findings.length, instrumentFailureCount: fixture.instrumentFailures.length, counts: Object.fromEntries(counts) },
    findings: fixture.findings.map(({ context, row }) => ({ viewport: context.viewport, surface: context.surface, ...row })),
    reloadEvidence: [{
      viewport: 'desktop-8k', status: 'failed', failure: 'injected boot stall',
      priorLoaderId: 'old-loader', replacementLoaderId: 'replacement-loader',
      releaseWitness: { validation: { ok: true } },
      bootPhases: [{ validation: { ok: true }, at: 9 }],
      readyWitness: { validation: { ok: true }, at: 10 },
      commands: reportCommands,
      events: [{ method: 'Page.lifecycleEvent', name: 'DOMContentLoaded', loaderId: 'replacement-loader' }],
    }],
    instrumentFailures: fixture.instrumentFailures,
  };
  if (shaped.schema !== 'cf-v2-glassmatrix/v1' || shaped.status !== 'fail'
    || shaped.scope !== 'full-certifying' || shaped.certifying !== true
    || shaped.viewportInventory.length !== 12 || shaped.summary.counts.TARGET_TOO_SMALL !== 1
    || shaped.findings[0].actual.height !== 20 || shaped.controlSummary.automaticRetries !== 0
    || shaped.controlSummary.blockedNegativeControls.length !== 0
    || shaped.controlSummary.omittedNegativeControls.length !== 0
    || shaped.reloadEvidence[0]?.viewport !== 'desktop-8k'
    || shaped.reloadEvidence[0]?.status !== 'failed'
    || shaped.reloadEvidence[0]?.failure !== 'injected boot stall'
    || shaped.reloadEvidence[0]?.releaseWitness?.validation?.ok !== true
    || shaped.reloadEvidence[0]?.bootPhases?.[0]?.validation?.ok !== true
    || shaped.reloadEvidence[0]?.readyWitness?.validation?.ok !== true
    || shaped.reloadEvidence[0]?.commands?.[0]?.timeoutMs !== PHASE_PROBE_TIMEOUT_MS
    || shaped.reloadEvidence[0]?.commands?.length !== 5
    || shaped.reloadEvidence[0]?.commands?.[0]?.method !== 'Runtime.evaluate/import-arm'
    || shaped.reloadEvidence[0]?.commands?.filter((row) => row.method === 'Runtime.evaluate').length !== 2
    || shaped.reloadEvidence[0]?.commands?.filter((row) => row.method === 'Browser.getVersion').length !== 2
    || shaped.reloadEvidence[0]?.commands?.[3]?.cycle !== 2
    || shaped.reloadEvidence[0]?.commands?.[3]?.sessionId !== 'target-session'
    || shaped.reloadEvidence[0]?.commands?.[3]?.executionContextId !== 7
    || shaped.reloadEvidence[0]?.commands?.[3]?.awaitPromise !== true
    || shaped.reloadEvidence[0]?.commands?.[3]?.postRenderPriority !== -50
    || shaped.reloadEvidence[0]?.events?.[0]?.name !== 'DOMContentLoaded'
    || !['non-glass-background-chain', 'settings-pressed-focus', 'guide-render-focus',
      'motion-css-policy', 'ordinary-panel-centre-close', 'opener-expanded-controls',
      'pseudo-placeholder-contrast', 'typography-no-shrink-hierarchy', 'backing-pixel-ceiling',
      'forced-colors-system-mapping', 'panel-open-focus', 'replacement-document-loader-token-phase',
      'replacement-boot-phase-sequence', 'reload-resource-release']
      .every((name) => shaped.controlSummary.negativeControls.includes(name))) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: injected finding/report grouping drifted');
  }
  console.log('GLASS MATRIX REPORT SELFTEST: PASS');
  console.log('  injected finding retained; 12 viewport definitions retained; retry policy remains zero');
  console.log('  import, release, exact boot subphases, twin-canvas budgets, navigation, and boot-ready deadlines fail closed');
}

const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
});

function installAuditHarness() {
  const round = (n) => Number.isFinite(n) ? Math.round(n * 100) / 100 : n;
  const issue = (code, surface, element, actual, expected) => ({ code, surface, element, actual, expected });
  const visible = (el) => {
    if (!(el instanceof Element)) return false;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    const clippedAway = (s.clip && s.clip !== 'auto' && /rect\(0(?:px)?[, ]+0(?:px)?[, ]+0(?:px)?[, ]+0(?:px)?\)/.test(s.clip))
      || (s.clipPath && s.clipPath !== 'none' && /inset\((?:50|100)%/.test(s.clipPath));
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0
      && !clippedAway && r.width > 0 && r.height > 0;
  };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { left: round(r.left), top: round(r.top), right: round(r.right), bottom: round(r.bottom), width: round(r.width), height: round(r.height) };
  };
  const visualBounds = (safe = {}) => {
    const v = window.visualViewport;
    const left0 = v ? v.offsetLeft : 0, top0 = v ? v.offsetTop : 0;
    const width = v ? v.width : innerWidth, height = v ? v.height : innerHeight;
    return {
      left: left0 + Number(safe.left || 0),
      top: top0 + Number(safe.top || 0),
      right: left0 + width - Number(safe.right || 0),
      bottom: top0 + height - Number(safe.bottom || 0),
      width, height,
    };
  };
  const inside = (r, bounds, slack = 1) => r.left >= bounds.left - slack && r.top >= bounds.top - slack
    && r.right <= bounds.right + slack && r.bottom <= bounds.bottom + slack;
  const overlaps = (a, b, slack = 1) => a.left < b.right - slack && a.right > b.left + slack
    && a.top < b.bottom - slack && a.bottom > b.top + slack;
  const selectorName = (el) => {
    if (!(el instanceof Element)) return String(el);
    if (el.id) return '#' + CSS.escape(el.id);
    const stable = ['data-pref', 'data-value', 'data-sel', 'data-act', 'data-pnx', 'data-motion', 'data-gt', 'data-release-index', 'name'];
    const attrs = stable.filter((name) => el.hasAttribute(name))
      .map((name) => `[${name}=${JSON.stringify(el.getAttribute(name))}]`).join('');
    let part = el.tagName.toLowerCase() + attrs;
    if (!attrs) {
      const classes = [...el.classList].filter((name) => !/^is-|^active$/.test(name)).slice(0, 2);
      if (classes.length) part += classes.map((name) => '.' + CSS.escape(name)).join('');
      const parent = el.parentElement;
      if (parent) {
        const peers = [...parent.children].filter((node) => node.tagName === el.tagName);
        if (peers.length > 1) part += `:nth-of-type(${peers.indexOf(el) + 1})`;
      }
    }
    const parent = el.parentElement;
    if (!parent || parent === document.body || parent === document.documentElement) return part;
    const owner = parent.id ? '#' + CSS.escape(parent.id)
      : parent.getAttribute('data-sel') ? `[data-sel=${JSON.stringify(parent.getAttribute('data-sel'))}]`
        : parent.classList.length ? parent.tagName.toLowerCase() + '.' + CSS.escape(parent.classList[0])
          : parent.tagName.toLowerCase();
    return owner + ' > ' + part;
  };
  const hit = (el) => {
    const r = el.getBoundingClientRect();
    const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
    const node = document.elementFromPoint(x, y);
    const description = node ? selectorName(node) + ((node.textContent || '').trim()
      ? ':' + (node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32) : '') : null;
    return { ok: !!node && (node === el || el.contains(node)), at: [round(x), round(y)], hit: description };
  };
  const parseColor = (raw) => {
    const m = String(raw).match(/rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])] : null;
  };
  const composite = (front, back) => {
    const a = front[3] + back[3] * (1 - front[3]);
    if (a <= 0) return [0, 0, 0, 0];
    return [0, 1, 2].map((i) => (front[i] * front[3] + back[i] * back[3] * (1 - front[3])) / a).concat(a);
  };
  const luminance = (c) => {
    const f = c.slice(0, 3).map((n) => {
      const v = n / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const contrast = (a, b) => {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const cumulativeOpacity = (el) => {
    let opacity = 1;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const value = Number(getComputedStyle(n).opacity);
      opacity *= Number.isFinite(value) ? value : 1;
    }
    return Math.max(0, Math.min(1, opacity));
  };
  const glassBackground = (el) => {
    let bg = [255, 255, 255, 1]; /* worst bright artwork beneath translucent glass */
    /* The canvas is a sibling below the HUD, so body/html backgrounds are
       not the rendered backdrop. Composite every real element background
       from the outermost overlay ancestor through the sampled text node;
       this covers trail/ctx/import/custom surfaces without requiring a
       `.glass` class and handles nested translucent fills honestly. */
    const chain = [];
    for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) chain.push(n);
    for (const n of chain.reverse()) {
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0) bg = composite(c, bg);
    }
    return bg;
  };
  const expectedCssColor = (value) => {
    const probe = document.createElement('span');
    probe.style.cssText = `position:fixed;display:block;color:${value};pointer-events:none`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  };
  const preferenceOutcome = (rootSelector, sampleSelector, expectedColor = 'var(--dim)') => {
    const root = document.querySelector(rootSelector), sample = document.querySelector(sampleSelector);
    if (!root || !sample || !visible(root) || !visible(sample)) {
      return { ok: false, root: !!root, sample: !!sample, rootVisible: !!root && visible(root), sampleVisible: !!sample && visible(sample) };
    }
    const hierarchyNodes = [...root.querySelectorAll('[data-sel="title"],h1,h2,h3,h4,h5,h6,.guide-icon,b,label,#tutstephead')]
      .filter((node) => node !== sample && visible(node));
    const readType = () => {
      const style = getComputedStyle(sample);
      return {
        fontSize: round(parseFloat(style.fontSize) || 0),
        fontFamily: style.fontFamily,
        color: style.color,
        hierarchy: hierarchyNodes.map((node) => ({
          element: selectorName(node), size: round(parseFloat(getComputedStyle(node).fontSize) || 0),
        })),
      };
    };
    const current = readType();
    const priorClasses = document.body.className;
    document.body.classList.remove('fs-lg', 'fs-xl', 'tone-bright', 'tone-max', 'font-sys', 'font-mono');
    const baseline = readType();
    document.body.className = priorClasses;
    const hierarchyComparisons = baseline.hierarchy.map((before, index) => {
      const after = current.hierarchy[index];
      const baselineDelta = before.size - baseline.fontSize;
      const currentDelta = after.size - current.fontSize;
      const meaningful = Math.abs(baselineDelta) >= 0.5;
      const noShrink = after.size + 0.01 >= before.size;
      return {
        element: before.element, baselineSize: before.size, currentSize: after.size,
        baselineDelta: round(baselineDelta), currentDelta: round(currentDelta), meaningful,
        noShrink,
        /* A small uppercase eyebrow may become a conventional larger heading
           at A++; semantic order can legitimately cross the body size. Keep
           every hierarchy node from shrinking and keep meaningful hierarchy
           differentiated, without falsely requiring the old sign. */
        preserved: noShrink && (!meaningful || Math.abs(currentDelta) >= 0.5),
      };
    });
    const hierarchyViolations = hierarchyComparisons.filter((row) => !row.preserved);
    const hierarchyPreserved = hierarchyViolations.length === 0;
    const actual = {
      bodyClasses: document.body.className,
      populatedTextLength: (root.textContent || '').trim().length,
      ...current,
      baselineFontSize: baseline.fontSize,
      noTextShrink: current.fontSize + 0.01 >= baseline.fontSize,
      hierarchyPreserved,
      hierarchyViolations: hierarchyViolations.slice(0, 8),
      expectedColor: expectedCssColor(expectedColor),
      expectedColorSource: expectedColor,
    };
    return {
      ok: document.body.classList.contains('fs-xl')
        && document.body.classList.contains('tone-max')
        && document.body.classList.contains('font-mono')
        && actual.populatedTextLength > 0
        && actual.fontSize >= 16 && actual.noTextShrink && actual.hierarchyPreserved
        && /mono/i.test(actual.fontFamily)
        && actual.color === actual.expectedColor,
      ...actual,
    };
  };
  const choiceOutcome = (rootSelector, itemSelector, expectedSelector, requireFocus = true) => {
    const root = document.querySelector(rootSelector);
    const items = root ? [...root.querySelectorAll(itemSelector)] : [];
    const expected = root?.querySelector(expectedSelector) || null;
    const pressed = items.map((item) => ({ selector: selectorName(item), value: item.getAttribute('aria-pressed') }));
    const trueItems = items.filter((item) => item.getAttribute('aria-pressed') === 'true');
    const exactBooleans = items.every((item) => ['true', 'false'].includes(item.getAttribute('aria-pressed') || ''));
    const focused = !!expected && document.activeElement === expected;
    return {
      ok: !!root && !!expected && items.length >= 2 && exactBooleans && trueItems.length === 1
        && trueItems[0] === expected && (!requireFocus || focused),
      itemCount: items.length, pressed, expected: expected ? selectorName(expected) : null,
      active: document.activeElement instanceof Element ? selectorName(document.activeElement) : null,
      focused, requireFocus,
    };
  };
  const navigationOutcome = (rootSelector, expectedFocusSelector, requiredSelector, textMin = 1) => {
    const root = document.querySelector(rootSelector);
    const expected = root?.querySelector(expectedFocusSelector) || null;
    const required = root ? [...root.querySelectorAll(requiredSelector)].filter(visible) : [];
    const textLength = required.reduce((sum, node) => sum + (node.textContent || '').trim().length, 0);
    return {
      ok: !!root && visible(root) && !!expected && visible(expected)
        && document.activeElement === expected && required.length > 0 && textLength >= textMin,
      expected: expected ? selectorName(expected) : null,
      active: document.activeElement instanceof Element ? selectorName(document.activeElement) : null,
      requiredVisible: required.length, textLength,
    };
  };
  const openFocusOutcome = (rootSelector, expectedSelector = '[data-pnx]') => {
    const root = document.querySelector(rootSelector);
    const expected = root?.querySelector(expectedSelector) || null;
    return {
      ok: !!root && visible(root) && !!expected && visible(expected) && document.activeElement === expected,
      expected: expected ? selectorName(expected) : null,
      active: document.activeElement instanceof Element ? selectorName(document.activeElement) : null,
    };
  };
  const forcedColorsOutcome = (selectors) => {
    const active = matchMedia('(forced-colors: active)').matches;
    const rows = selectors.map((selector) => {
      const el = document.querySelector(selector);
      const style = el ? getComputedStyle(el) : null;
      return {
        selector, exists: !!el, visible: !!el && visible(el),
        forcedColorAdjust: style?.forcedColorAdjust || null,
        color: style?.color || null, background: style?.backgroundColor || null,
      };
    });
    return {
      ok: active && rows.every((row) => row.exists && row.visible && row.forcedColorAdjust !== 'none'),
      active, rows,
    };
  };
  const timeMs = (raw) => {
    const first = String(raw || '').split(',')[0].trim();
    const value = parseFloat(first) || 0;
    return first.endsWith('ms') ? value : value * 1000;
  };
  const motionPolicyOutcome = (expectedMode) => {
    let style = document.getElementById('cf-motion-policy-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'cf-motion-policy-style';
      style.textContent = '@keyframes cfMotionPolicy{from{opacity:.8}to{opacity:1}}#cf-motion-policy-probe{animation:cfMotionPolicy 2s linear infinite;transition:transform 2s linear}';
      document.head.appendChild(style);
    }
    let probe = document.getElementById('cf-motion-policy-probe');
    if (!probe) {
      probe = document.createElement('div'); probe.id = 'cf-motion-policy-probe';
      probe.style.cssText = 'position:fixed;width:2px;height:2px;pointer-events:none';
      document.body.appendChild(probe);
    }
    const s = getComputedStyle(probe), mediaReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animationMs = timeMs(s.animationDuration), transitionMs = timeMs(s.transitionDuration);
    const shouldReduce = expectedMode === 1 || (expectedMode === -1 && mediaReduced);
    const cssReduced = animationMs <= 10 && transitionMs <= 10;
    const classReduced = document.body.classList.contains('motion-reduced');
    const stateMode = window.__CF_SLICE__?.api?.state?.().motionMode;
    return {
      ok: stateMode === expectedMode && classReduced === shouldReduce
        && (shouldReduce ? cssReduced : animationMs >= 1000 && transitionMs >= 1000),
      expectedMode, stateMode, mediaReduced, shouldReduce, classReduced, cssReduced,
      animationDuration: s.animationDuration, transitionDuration: s.transitionDuration,
      animationMs: round(animationMs), transitionMs: round(transitionMs),
    };
  };
  const closeIntegrityOutcome = (rootSelector, closeSelector, forbiddenSelector = null, requireDirect = false) => {
    const root = document.querySelector(rootSelector);
    const closes = root ? [...root.querySelectorAll(closeSelector)] : [];
    const forbidden = root && forbiddenSelector ? [...root.querySelectorAll(forbiddenSelector)] : [];
    const close = closes[0] || null;
    const a = root?.getBoundingClientRect(), b = close?.getBoundingClientRect();
    const hit = b ? document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2) : null;
    const inside = !!a && !!b && b.left >= a.left - 1 && b.top >= a.top - 1
      && b.right <= a.right + 1 && b.bottom <= a.bottom + 1;
    const rightGap = a && b ? a.right - b.right : null;
    const scrollbarGutter = root instanceof HTMLElement ? Math.max(0, root.offsetWidth - root.clientWidth) : 0;
    const contentRightGap = rightGap === null ? null : rightGap - scrollbarGutter;
    const topGap = a && b ? b.top - a.top : null;
    const topRight = inside && contentRightGap >= -1 && contentRightGap <= 20 && topGap >= -1 && topGap <= 20;
    const centreOwned = !!close && !!hit && (hit === close || close.contains(hit));
    const direct = !!close && close.parentElement === root;
    return {
      ok: !!root && visible(root) && closes.length === 1 && forbidden.length === 0
        && !!close && visible(close) && topRight && centreOwned && (!requireDirect || direct),
      closeCount: closes.length, forbiddenCount: forbidden.length, direct, inside, topRight,
      rightGap: rightGap === null ? null : round(rightGap), scrollbarGutter: round(scrollbarGutter),
      contentRightGap: contentRightGap === null ? null : round(contentRightGap), topGap: topGap === null ? null : round(topGap),
      centreOwned, hit: hit ? selectorName(hit) : null,
      root: a ? [round(a.left), round(a.top), round(a.right), round(a.bottom)] : null,
      close: b ? [round(b.left), round(b.top), round(b.right), round(b.bottom)] : null,
    };
  };
  const rightBottomAnchorOutcome = (selector, dockSelector = '#dock') => {
    const el = document.querySelector(selector), dock = document.querySelector(dockSelector);
    const a = el?.getBoundingClientRect(), d = dock?.getBoundingClientRect();
    const root = getComputedStyle(document.documentElement);
    const safeRight = parseFloat(root.getPropertyValue('--safe-right')) || 0;
    const safeBottom = parseFloat(root.getPropertyValue('--safe-bottom')) || 0;
    const dockHeight = parseFloat(root.getPropertyValue('--dock-h')) || d?.height || 0;
    const rightGap = a ? innerWidth - a.right : null;
    const bottomGap = a ? innerHeight - a.bottom : null;
    const expectedRight = safeRight + 12;
    const expectedBottom = safeBottom + dockHeight + 24;
    const dockClearance = a && d ? d.top - a.bottom : null;
    return {
      ok: innerWidth > 900 && !!el && visible(el) && !!dock && visible(dock)
        && rightGap !== null && Math.abs(rightGap - expectedRight) <= 2
        && bottomGap !== null && Math.abs(bottomGap - expectedBottom) <= 2
        && dockClearance !== null && dockClearance >= 8,
      rightGap: rightGap === null ? null : round(rightGap), expectedRight: round(expectedRight),
      bottomGap: bottomGap === null ? null : round(bottomGap), expectedBottom: round(expectedBottom),
      dockClearance: dockClearance === null ? null : round(dockClearance),
      rect: a ? [round(a.left), round(a.top), round(a.right), round(a.bottom)] : null,
      dock: d ? [round(d.left), round(d.top), round(d.right), round(d.bottom)] : null,
    };
  };
  const panelCloseOutcome = (panelSelector, closeSelector, openerSelector, preservedSelector) => {
    const panel = document.querySelector(panelSelector), close = panel?.querySelector(closeSelector) || null;
    const opener = document.querySelector(openerSelector), preserved = document.querySelector(preservedSelector);
    const r = close?.getBoundingClientRect();
    const node = r ? document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2) : null;
    const centreOwned = !!close && !!node && (node === close || close.contains(node));
    if (centreOwned) close.click();
    const panelClosed = !!panel && !visible(panel);
    const preservedVisible = !!preserved && visible(preserved);
    const focusRestored = !!opener && document.activeElement === opener;
    return {
      ok: centreOwned && panelClosed && preservedVisible && focusRestored,
      centreOwned, centre: r ? [round((r.left + r.right) / 2), round((r.top + r.bottom) / 2)] : null,
      hit: node ? selectorName(node) : null, panelClosed, preservedVisible, focusRestored,
      active: document.activeElement instanceof Element ? selectorName(document.activeElement) : null,
    };
  };
  const openerOutcome = (openerSelector, controlledSelector, expectedExpanded) => {
    const opener = document.querySelector(openerSelector), controlled = document.querySelector(controlledSelector);
    const expectedId = controlled?.id || null;
    const actual = opener ? {
      controls: opener.getAttribute('aria-controls'),
      expanded: opener.getAttribute('aria-expanded'),
      pressed: opener.getAttribute('aria-pressed'),
    } : null;
    return {
      ok: !!opener && !!controlled && actual.controls === expectedId
        && actual.expanded === String(expectedExpanded),
      opener: opener ? selectorName(opener) : null, controlled: controlled ? selectorName(controlled) : null,
      actual, expected: { controls: expectedId, expanded: String(expectedExpanded) },
    };
  };
  const pressedOutcome = (selector, expected) => {
    const control = document.querySelector(selector);
    return {
      ok: !!control && control.getAttribute('aria-pressed') === String(expected),
      selector, actual: control?.getAttribute('aria-pressed') ?? null, expected: String(expected),
    };
  };
  const accessibleName = (el) => {
    const aria = el.getAttribute('aria-label');
    if (aria && aria.trim()) return aria.trim();
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
      if (text) return text;
    }
    if ('labels' in el && el.labels) {
      const text = [...el.labels].map((label) => label.textContent || '').join(' ').trim();
      if (text) return text;
    }
    if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'LABEL' || el.getAttribute('role') === 'button') {
      const text = (el.textContent || '').trim();
      if (text) return text;
    }
    const alt = el.getAttribute('alt');
    if (alt && alt.trim()) return alt.trim();
    const title = el.getAttribute('title');
    return title && title.trim() ? title.trim() : '';
  };
  const interactives = (roots) => {
    const result = new Set();
    const sel = 'button,input:not([type="hidden"]),textarea,select,a[href],[role="button"],label:has(input[type="file"]),[tabindex]:not([tabindex="-1"])';
    for (const root of roots) {
      if (!(root instanceof Element)) continue;
      if (root.matches(sel)) result.add(root);
      for (const el of root.querySelectorAll(sel)) result.add(el);
    }
    return [...result].filter((el) => visible(el) && !el.disabled);
  };
  const clippedBounds = (el, root, viewport) => {
    const bounds = { ...viewport };
    for (let n = el.parentElement; n; n = n.parentElement) {
      const s = getComputedStyle(n), r = n.getBoundingClientRect();
      if (s.overflowX !== 'visible') { bounds.left = Math.max(bounds.left, r.left); bounds.right = Math.min(bounds.right, r.right); }
      if (s.overflowY !== 'visible') { bounds.top = Math.max(bounds.top, r.top); bounds.bottom = Math.min(bounds.bottom, r.bottom); }
      if (n === root) break;
    }
    return bounds;
  };
  const scrollControlIntoView = (el, root, viewport) => {
    let r = box(el), bounds = clippedBounds(el, root, viewport);
    if (inside(r, bounds)) return { rect: r, bounds };
    for (let n = el.parentElement; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if ((n.scrollHeight > n.clientHeight + 1 && /(auto|scroll)/.test(s.overflowY))
        || (n.scrollWidth > n.clientWidth + 1 && /(auto|scroll)/.test(s.overflowX))) {
        const nr = n.getBoundingClientRect(), er = el.getBoundingClientRect();
        if (n.scrollHeight > n.clientHeight + 1) n.scrollTop += (er.top + er.bottom - nr.top - nr.bottom) / 2;
        if (n.scrollWidth > n.clientWidth + 1) n.scrollLeft += (er.left + er.right - nr.left - nr.right) / 2;
        r = box(el);
        bounds = clippedBounds(el, root, viewport);
        if (inside(r, bounds)) return { rect: r, bounds };
      }
      if (n === root) break;
    }
    return { rect: r, bounds };
  };
  const focusEvidence = (el) => {
    try { el.blur(); } catch { /* non-focusable */ }
    const before = getComputedStyle(el);
    const b = { outline: before.outline, shadow: before.boxShadow, border: before.borderColor, background: before.backgroundColor };
    try { el.focus({ preventScroll: true }); } catch { /* reported below */ }
    const after = getComputedStyle(el);
    const outlineWidth = parseFloat(after.outlineWidth) || 0;
    const outline = after.outlineStyle !== 'none' && outlineWidth >= 1 && parseColor(after.outlineColor)?.[3] !== 0;
    const changed = b.shadow !== after.boxShadow || b.border !== after.borderColor || b.background !== after.backgroundColor;
    return {
      focused: document.activeElement === el,
      visible: outline || (after.boxShadow !== 'none' && after.boxShadow !== b.shadow) || changed,
      before: b,
      after: { outline: after.outline, shadow: after.boxShadow, border: after.borderColor, background: after.backgroundColor },
    };
  };
  const safeProbe = () => {
    const probe = document.createElement('div');
    probe.id = 'cf-safe-probe';
    probe.style.cssText = 'position:fixed;pointer-events:none;left:env(safe-area-inset-left,0px);top:env(safe-area-inset-top,0px);right:env(safe-area-inset-right,0px);bottom:env(safe-area-inset-bottom,0px)';
    document.body.appendChild(probe);
    const r = probe.getBoundingClientRect();
    probe.remove();
    return { top: round(r.top), right: round(innerWidth - r.right), bottom: round(innerHeight - r.bottom), left: round(r.left) };
  };
  const viewportIssues = (surface, expected) => {
    const actual = { width: innerWidth, height: innerHeight, dpr: round(devicePixelRatio) };
    const wrong = Math.abs(actual.width - Number(expected.width)) > 1
      || Math.abs(actual.height - Number(expected.height)) > 1
      || Math.abs(actual.dpr - Number(expected.dpr)) > 0.01;
    return wrong ? [issue('VIEWPORT_METRICS_MISMATCH', surface, 'window', actual, expected)] : [];
  };
  const canvasIssues = (surface, expectedDpr, maxBackingPixels = Infinity) => {
    const out = [], canvas = document.querySelector('canvas');
    if (!canvas) return [issue('CANVAS_MISSING', surface, 'canvas', null, 'mounted Pixi canvas')];
    const r = canvas.getBoundingClientRect();
    if (Math.abs(r.width - innerWidth) > 1 || Math.abs(r.height - innerHeight) > 1) {
      out.push(issue('CANVAS_CSS_VIEWPORT', surface, 'canvas', { box: box(canvas), viewport: [innerWidth, innerHeight] }, 'CSS box equals layout viewport'));
    }
    const ratio = { x: canvas.width / Math.max(1, r.width), y: canvas.height / Math.max(1, r.height) };
    if (Math.abs(ratio.x - expectedDpr) > 0.12 || Math.abs(ratio.y - expectedDpr) > 0.12) {
      out.push(issue('CANVAS_DPR_DRIFT', surface, 'canvas', { ratio: [round(ratio.x), round(ratio.y)], devicePixelRatio: round(devicePixelRatio) }, 'backing/CSS ratio ' + expectedDpr));
    }
    const state = window.__CF_SLICE__?.api?.state?.();
    if (!state || Math.abs(Number(state.rendererDpr) - expectedDpr) > 0.01
      || Number(state.backingWidth) !== canvas.width || Number(state.backingHeight) !== canvas.height
      || Number(state.backingPixelCapPerCanvas) !== Number(maxBackingPixels)
      || Number(state.viewportWidth) !== innerWidth || Number(state.viewportHeight) !== innerHeight) {
      out.push(issue('RENDERER_DPR_CONTRACT', surface, 'canvas', state ? {
        rendererDpr: state.rendererDpr, reportedBacking: [state.backingWidth, state.backingHeight],
        canvasBacking: [canvas.width, canvas.height],
        backingPixelCapPerCanvas: state.backingPixelCapPerCanvas,
        viewport: [state.viewportWidth, state.viewportHeight],
      } : null, { rendererDpr: expectedDpr, reportedBacking: 'matches live canvas backing',
        backingPixelCapPerCanvas: maxBackingPixels, viewport: [innerWidth, innerHeight] }));
    }
    const backingPixels = canvas.width * canvas.height;
    if (backingPixels > maxBackingPixels) {
      out.push(issue('CANVAS_BACKING_PIXEL_CEILING', surface, 'canvas', {
        width: canvas.width, height: canvas.height, pixels: backingPixels,
        css: [round(r.width), round(r.height)], rendererDpr: state?.rendererDpr ?? null,
      }, { maxPixels: maxBackingPixels, rationale: 'selected ordinary/ultra backing-store budget at extreme viewport areas' }));
    }
    return out;
  };
  const audit = (opts) => {
    const out = [], surface = opts.surface || 'unknown';
    const root = document.querySelector(opts.root);
    if (!root || !visible(root)) {
      out.push(issue('SURFACE_NOT_VISIBLE', surface, opts.root, root ? box(root) : null, 'visible populated surface'));
      return out;
    }
    const text = (root.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < Number(opts.textMin || 1)) out.push(issue('SURFACE_EMPTY', surface, opts.root, { textLength: text.length }, 'text length >= ' + Number(opts.textMin || 1)));
    for (const req of opts.required || []) {
      const nodes = [...root.querySelectorAll(req.selector)];
      if (root.matches(req.selector)) nodes.unshift(root);
      const live = nodes.filter(visible);
      if (live.length < Number(req.min || 1)) out.push(issue('REQUIRED_CONTENT_MISSING', surface, req.selector, { visible: live.length, total: nodes.length }, 'visible >= ' + Number(req.min || 1)));
      if (req.textMin) {
        const len = live.reduce((n, el) => n + (el.textContent || '').trim().length, 0);
        if (len < req.textMin) out.push(issue('REQUIRED_COPY_EMPTY', surface, req.selector, { textLength: len }, 'text length >= ' + req.textMin));
      }
    }
    const bounds = visualBounds(opts.safe || {});
    const fitNodes = new Set([root]);
    for (const sel of opts.fitSelectors || []) for (const el of document.querySelectorAll(sel)) if (visible(el)) fitNodes.add(el);
    for (const el of fitNodes) {
      const r = box(el);
      /* Full-bleed document/canvas roots intentionally paint beneath a
         notch; their interactive chrome must remain within the safe box. */
      const elementBounds = /^(BODY|HTML)$/.test(el.tagName) ? visualBounds() : bounds;
      if (!inside(r, elementBounds)) out.push(issue('OUTSIDE_VIEWPORT', surface, selectorName(el), { rect: r, bounds: elementBounds }, 'inside visual viewport and safe area'));
      const s = getComputedStyle(el);
      if (!/^(BODY|HTML)$/.test(el.tagName) && el.scrollHeight > el.clientHeight + 1 && !/(auto|scroll)/.test(s.overflowY)) {
        out.push(issue('CLIPPED_WITHOUT_SCROLL', surface, selectorName(el), { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, overflowY: s.overflowY }, 'vertical scrolling when content clips'));
      }
    }
    const roots = (opts.interactiveRoots || [opts.root]).map((sel) => document.querySelector(sel)).filter(Boolean);
    const controls = interactives(roots);
    const targetFloor = Number(opts.targetFloor || 44);
    const controlLimit = Number(opts.maxControlReports || 6), controlCounts = new Map(), controlReported = new Map();
    const controlIssue = (row) => {
      controlCounts.set(row.code, (controlCounts.get(row.code) || 0) + 1);
      const n = controlReported.get(row.code) || 0;
      if (n < controlLimit) { out.push(row); controlReported.set(row.code, n + 1); }
    };
    for (const el of controls) {
      const scrolled = scrollControlIntoView(el, root, bounds), r = scrolled.rect, controlBounds = scrolled.bounds;
      const name = selectorName(el), h = hit(el);
      if (r.width + 0.5 < targetFloor || r.height + 0.5 < targetFloor) {
        controlIssue(issue('TARGET_TOO_SMALL', surface, name, { width: r.width, height: r.height }, 'both dimensions >= ' + targetFloor + 'px'));
      }
      if (!inside(r, controlBounds)) controlIssue(issue('CONTROL_OUTSIDE_VIEWPORT', surface, name, { rect: r, bounds: controlBounds }, 'control scrolls fully inside every clipping ancestor, the visual viewport, and safe area'));
      if (!h.ok) controlIssue(issue('CONTROL_NOT_HITTABLE', surface, name, h, 'control owns its centre point after scrolling into reach'));
      const a11y = accessibleName(el);
      if (!a11y) controlIssue(issue('ACCESSIBLE_NAME_MISSING', surface, name, { tag: el.tagName.toLowerCase(), type: el.getAttribute('type') }, 'non-empty accessible name'));
      const nativeKeyboard = /^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || (el.tagName === 'A' && el.hasAttribute('href'));
      if (!nativeKeyboard && el.tabIndex < 0) {
        controlIssue(issue('KEYBOARD_UNREACHABLE', surface, name, { tag: el.tagName.toLowerCase(), tabIndex: el.tabIndex }, 'native keyboard control or tabIndex >= 0'));
      }
    }
    for (const [code, count] of controlCounts) {
      if (count > controlLimit) out.push(issue('CONTROL_DIAGNOSTICS_TRUNCATED', surface, code, { total: count, reported: controlLimit }, 'repair the reported examples, then rerun for any remaining instances'));
    }
    for (const sel of opts.focusSelectors || []) {
      const el = document.querySelector(sel);
      if (!el || !visible(el)) {
        out.push(issue('FOCUS_TARGET_MISSING', surface, sel, null, 'visible focus target'));
        continue;
      }
      const evidence = focusEvidence(el);
      if (!evidence.focused) out.push(issue('FOCUS_NOT_OWNED', surface, sel, evidence, 'document.activeElement is target'));
      else if (!evidence.visible) out.push(issue('FOCUS_INVISIBLE', surface, sel, evidence, 'rendered focus indicator'));
    }
    const contrastNodes = new Set();
    for (const sel of opts.contrastSelectors || []) {
      for (const el of document.querySelectorAll(sel)) if (visible(el)) {
        contrastNodes.add(el);
        for (const child of el.querySelectorAll('p,li,small,b,label,button,h1,h2,h3,h4,h5,h6,.sub,.cur,.sep,.guide-status,[role="status"],[style*="color"]')) {
          if (visible(child)) contrastNodes.add(child);
        }
      }
    }
    let contrastReports = 0;
    for (const el of contrastNodes) {
      if (contrastReports >= Number(opts.maxContrastReports || 4)) break;
      const sample = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!sample) continue;
      const s = getComputedStyle(el), fg0 = parseColor(s.color);
      if (!fg0) continue;
      fg0[3] *= cumulativeOpacity(el);
      const bg = glassBackground(el), fg = composite(fg0, bg), ratio = contrast(fg, bg);
      const size = parseFloat(s.fontSize) || 13, weight = parseInt(s.fontWeight, 10) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700), threshold = large ? 3 : 4.5;
      if (ratio + 0.01 < threshold) {
        contrastReports++;
        out.push(issue('TEXT_CONTRAST_LOW', surface, selectorName(el), { ratio: round(ratio), threshold, color: s.color, background: bg.map(round), sample: sample.slice(0, 80) }, 'WCAG contrast against bright artwork beneath glass'));
      }
    }
    for (const sel of opts.placeholderSelectors || []) {
      for (const el of document.querySelectorAll(sel)) {
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || !visible(el) || !el.placeholder) continue;
        const s = getComputedStyle(el, '::placeholder'), fg0 = parseColor(s.color);
        if (!fg0) {
          out.push(issue('PLACEHOLDER_COLOR_UNRESOLVED', surface, selectorName(el) + '::placeholder', s.color, 'computed RGB/RGBA placeholder color'));
          continue;
        }
        fg0[3] *= (Number.isFinite(Number(s.opacity)) ? Number(s.opacity) : 1) * cumulativeOpacity(el);
        const bg = glassBackground(el), fg = composite(fg0, bg), ratio = contrast(fg, bg);
        if (ratio + 0.01 < 4.5) {
          out.push(issue('PLACEHOLDER_CONTRAST_LOW', surface, selectorName(el) + '::placeholder', {
            ratio: round(ratio), threshold: 4.5, color: s.color, opacity: s.opacity,
            background: bg.map(round), sample: el.placeholder.slice(0, 80),
          }, 'WCAG 4.5:1 placeholder contrast against bright artwork beneath every translucent background'));
        }
      }
    }
    const glassNodes = new Set();
    if (root.classList.contains('glass')) glassNodes.add(root);
    for (const el of root.querySelectorAll('.glass')) if (visible(el)) glassNodes.add(el);
    for (const el of glassNodes) {
      const s = getComputedStyle(el), bg = parseColor(s.backgroundColor);
      if (!bg || bg[3] < 0.40) out.push(issue('GLASS_ALPHA_FLOOR', surface, selectorName(el), s.backgroundColor, 'alpha >= 0.40'));
      const filter = s.backdropFilter || s.webkitBackdropFilter || 'none';
      if ((!filter || filter === 'none') && bg && bg[3] < 0.88) {
        out.push(issue('GLASS_FALLBACK_WEAK', surface, selectorName(el), { filter, background: s.backgroundColor }, 'blur support or near-solid fallback alpha >= 0.88'));
      }
    }
    for (const pair of opts.overlapPairs || []) {
      const a = document.querySelector(pair[0]), b = document.querySelector(pair[1]);
      if (a && b && visible(a) && visible(b) && overlaps(box(a), box(b), Number(pair[2] || 1))) {
        out.push(issue('SURFACE_OVERLAP', surface, pair[0] + ' × ' + pair[1], { a: box(a), b: box(b) }, 'non-overlapping rendered rectangles'));
      }
    }
    if (opts.safeExpected) {
      const actual = safeProbe();
      for (const edge of ['top', 'right', 'bottom', 'left']) {
        if (Math.abs(actual[edge] - Number(opts.safeExpected[edge] || 0)) > 1) {
          out.push(issue('SAFE_AREA_OVERRIDE_MISSING', surface, edge, actual, opts.safeExpected));
          break;
        }
      }
    }
    if (opts.viewportExpected) out.push(...viewportIssues(surface, opts.viewportExpected));
    if (document.documentElement.scrollWidth > innerWidth + 1) {
      out.push(issue('HORIZONTAL_OVERFLOW', surface, 'document', { scrollWidth: document.documentElement.scrollWidth, innerWidth }, 'no horizontal document overflow'));
    }
    if (opts.canvas) out.push(...canvasIssues(surface, Number(opts.expectedDpr), Number(opts.maxBackingPixels ?? Infinity)));
    return out;
  };
  const sceneSnapshot = () => {
    const root = window.__CF_SLICE__?.world;
    if (!root) return [];
    const out = [], stack = [{ node: root, path: 'world' }];
    while (stack.length && out.length < 5000) {
      const { node, path } = stack.pop();
      if (!node || node.visible === false || node.renderable === false) continue;
      out.push({ path, x: round(node.x || 0), y: round(node.y || 0), rotation: round(node.rotation || 0), alpha: round(node.alpha ?? 1), sx: round(node.scale?.x ?? 1), sy: round(node.scale?.y ?? 1) });
      const children = Array.isArray(node.children) ? node.children : [];
      for (let i = children.length - 1; i >= 0; i--) stack.push({ node: children[i], path: path + '/' + i });
    }
    return out;
  };
  const sceneDelta = (before, after) => {
    const later = new Map(after.map((row) => [row.path, row]));
    const fields = ['x', 'y', 'rotation', 'alpha', 'sx', 'sy'], changed = [];
    for (const a of before) {
      const b = later.get(a.path);
      if (!b) continue;
      const drift = fields.filter((field) => Math.abs(Number(a[field]) - Number(b[field])) > 0.001);
      if (drift.length) changed.push({ path: a.path, fields: drift, before: Object.fromEntries(drift.map((f) => [f, a[f]])), after: Object.fromEntries(drift.map((f) => [f, b[f]])) });
    }
    return changed;
  };
  const selftest = () => {
    const failures = [];
    const expect = (label, list, code, elementPart) => {
      if (!list.some((row) => row.code === code && (!elementPart || row.element.includes(elementPart)))) failures.push(label + ': expected ' + code + ' for ' + elementPart + '; got ' + JSON.stringify(list));
    };
    const reject = (label, list, code, elementPart) => {
      if (list.some((row) => row.code === code && (!elementPart || row.element.includes(elementPart)))) failures.push(label + ': clean control emitted ' + code + ' for ' + elementPart + '; got ' + JSON.stringify(list));
    };
    const root = document.createElement('section');
    root.id = 'cf-control-surface'; root.className = 'glass';
    root.style.cssText = 'position:fixed;left:8px;top:70px;width:280px;height:190px;padding:8px;box-sizing:border-box;background:rgba(10,16,30,.96);color:#fff;z-index:1000';
    root.innerHTML = '<p id="cf-control-copy" style="margin:0">Readable control copy</p><ul style="margin:0"><li id="cf-control-list-copy">List copy</li></ul><small id="cf-control-small-copy">Small copy</small><button id="cf-control-button" aria-label="control button" style="display:block;width:44px;height:44px;outline:3px solid white">x</button>';
    document.body.appendChild(root);
    const base = { surface: 'selftest', root: '#cf-control-surface', textMin: 4, required: [{ selector: '#cf-control-copy', min: 1, textMin: 4 }], interactiveRoots: ['#cf-control-surface'], focusSelectors: ['#cf-control-button'], contrastSelectors: ['#cf-control-surface'], targetFloor: 44 };
    let list = audit(base);
    reject('positive viewport geometry', list, 'OUTSIDE_VIEWPORT', '#cf-control-surface');
    reject('positive clipping geometry', list, 'CLIPPED_WITHOUT_SCROLL', '#cf-control-surface');
    reject('positive geometry', list, 'TARGET_TOO_SMALL', '#cf-control-button');
    reject('positive focus', list, 'FOCUS_INVISIBLE', '#cf-control-button');
    reject('positive contrast', list, 'TEXT_CONTRAST_LOW', '#cf-control-copy');
    const button = root.querySelector('#cf-control-button');
    button.style.width = '20px'; list = audit(base); expect('small target injection', list, 'TARGET_TOO_SMALL', '#cf-control-button'); button.style.width = '44px';
    button.style.outline = 'none'; button.style.boxShadow = 'none'; list = audit(base); expect('focus injection', list, 'FOCUS_INVISIBLE', '#cf-control-button'); button.style.outline = '3px solid white';
    button.removeAttribute('aria-label'); button.textContent = ''; list = audit(base); expect('accessible-name injection', list, 'ACCESSIBLE_NAME_MISSING', '#cf-control-button'); button.setAttribute('aria-label', 'control button'); button.textContent = 'x';
    const custom = document.createElement('span'); custom.id = 'cf-control-custom'; custom.setAttribute('role', 'button'); custom.textContent = 'custom'; custom.style.cssText = 'display:inline-flex;width:44px;height:44px'; root.appendChild(custom);
    list = audit(base); expect('keyboard reachability injection', list, 'KEYBOARD_UNREACHABLE', '#cf-control-custom'); custom.remove();
    const buttonRect = button.getBoundingClientRect();
    const shield = document.createElement('div'); shield.id = 'cf-control-shield';
    shield.style.cssText = `position:fixed;left:${buttonRect.left}px;top:${buttonRect.top}px;width:${buttonRect.width}px;height:${buttonRect.height}px;z-index:1001`;
    document.body.appendChild(shield);
    list = audit(base); expect('hit-test injection', list, 'CONTROL_NOT_HITTABLE', '#cf-control-button'); shield.remove();
    const copy = root.querySelector('#cf-control-copy');
    copy.style.color = 'rgb(100,100,100)'; root.style.background = 'rgba(10,16,30,.4)'; list = audit(base); expect('contrast injection', list, 'TEXT_CONTRAST_LOW', '#cf-control-copy'); copy.style.color = '#fff'; root.style.background = 'rgba(10,16,30,.96)';
    const listCopy = root.querySelector('#cf-control-list-copy'), smallCopy = root.querySelector('#cf-control-small-copy');
    listCopy.style.color = 'rgb(100,100,100)'; smallCopy.style.color = 'rgb(100,100,100)';
    list = audit(base); expect('list contrast injection', list, 'TEXT_CONTRAST_LOW', '#cf-control-list-copy'); expect('small contrast injection', list, 'TEXT_CONTRAST_LOW', '#cf-control-small-copy');
    listCopy.style.color = '#fff'; smallCopy.style.color = '#fff';
    copy.style.opacity = '.15'; list = audit(base); expect('cumulative opacity contrast injection', list, 'TEXT_CONTRAST_LOW', '#cf-control-copy'); copy.style.opacity = '1';
    const nonGlass = document.createElement('section');
    nonGlass.id = 'cf-control-nonglass';
    nonGlass.style.cssText = 'position:fixed;left:8px;top:8px;width:180px;height:60px;background:rgba(0,0,0,.1);z-index:1000';
    nonGlass.innerHTML = '<div style="background:rgba(0,0,0,.1)"><span id="cf-control-nonglass-copy" style="color:#fff">bright-chain control</span></div>';
    document.body.appendChild(nonGlass);
    list = audit({ surface: 'selftest-nonglass', root: '#cf-control-nonglass', textMin: 4, interactiveRoots: [], contrastSelectors: ['#cf-control-nonglass-copy'] });
    expect('non-glass translucent-chain injection', list, 'TEXT_CONTRAST_LOW', '#cf-control-nonglass-copy');
    nonGlass.remove();
    const placeholderStyle = document.createElement('style');
    placeholderStyle.id = 'cf-control-placeholder-style';
    placeholderStyle.textContent = '#cf-control-placeholder::placeholder{color:#fff;opacity:1}';
    const placeholder = document.createElement('input');
    placeholder.id = 'cf-control-placeholder'; placeholder.placeholder = 'placeholder control';
    placeholder.style.cssText = 'position:fixed;left:8px;top:8px;width:180px;height:44px;background:#05070c;color:#fff;z-index:1000';
    document.head.appendChild(placeholderStyle); document.body.appendChild(placeholder);
    list = audit({ surface: 'selftest-placeholder', root: '#cf-control-placeholder', textMin: 0, interactiveRoots: [], contrastSelectors: [], placeholderSelectors: ['#cf-control-placeholder'] });
    reject('placeholder contrast positive', list, 'PLACEHOLDER_CONTRAST_LOW', '#cf-control-placeholder');
    placeholderStyle.textContent = '#cf-control-placeholder::placeholder{color:rgb(100,100,100);opacity:1}';
    list = audit({ surface: 'selftest-placeholder', root: '#cf-control-placeholder', textMin: 0, interactiveRoots: [], contrastSelectors: [], placeholderSelectors: ['#cf-control-placeholder'] });
    expect('placeholder contrast injection', list, 'PLACEHOLDER_CONTRAST_LOW', '#cf-control-placeholder');
    placeholder.remove(); placeholderStyle.remove();
    root.style.backdropFilter = 'none'; root.style.webkitBackdropFilter = 'none'; root.style.background = 'rgba(10,16,30,.4)'; list = audit(base); expect('glass fallback injection', list, 'GLASS_FALLBACK_WEAK', '#cf-control-surface');
    root.style.background = 'rgba(10,16,30,.96)'; list = audit(base); reject('glass fallback positive', list, 'GLASS_FALLBACK_WEAK', '#cf-control-surface'); root.style.backdropFilter = ''; root.style.webkitBackdropFilter = '';
    copy.textContent = ''; list = audit(base); expect('empty-surface injection', list, 'REQUIRED_COPY_EMPTY', '#cf-control-copy'); copy.textContent = 'Readable control copy';
    const filler = document.createElement('div'); filler.style.height = '260px'; root.appendChild(filler);
    root.style.overflowY = 'hidden'; list = audit(base); expect('clipped-without-scroll injection', list, 'CLIPPED_WITHOUT_SCROLL', '#cf-control-surface');
    filler.remove(); root.style.overflowY = '';
    root.style.left = '-30px'; list = audit(base); expect('viewport injection', list, 'OUTSIDE_VIEWPORT', '#cf-control-surface'); root.style.left = '8px';
    const safe = safeProbe();
    list = audit({ ...base, safeExpected: safe }); reject('safe-area positive', list, 'SAFE_AREA_OVERRIDE_MISSING');
    list = audit({ ...base, safeExpected: { ...safe, left: safe.left + 17 } }); expect('safe-area injection', list, 'SAFE_AREA_OVERRIDE_MISSING', 'left');
    const metrics = { width: innerWidth, height: innerHeight, dpr: devicePixelRatio };
    list = audit({ ...base, viewportExpected: metrics }); reject('viewport metrics positive', list, 'VIEWPORT_METRICS_MISMATCH');
    list = audit({ ...base, viewportExpected: { ...metrics, width: metrics.width + 17 } }); expect('viewport metrics injection', list, 'VIEWPORT_METRICS_MISMATCH', 'window');
    const preference = document.createElement('section');
    preference.id = 'cf-control-preference';
    preference.style.cssText = 'position:fixed;left:8px;top:72px;width:180px;height:44px;z-index:1000';
    preference.innerHTML = '<span id="cf-control-preference-copy" style="display:block;color:var(--dim);font:16px ui-monospace">preference control</span>';
    document.body.appendChild(preference);
    const priorClasses = document.body.className;
    document.body.classList.add('fs-xl', 'tone-max', 'font-mono');
    let preferenceResult = preferenceOutcome('#cf-control-preference', '#cf-control-preference-copy');
    if (!preferenceResult.ok) failures.push('preference positive control failed: ' + JSON.stringify(preferenceResult));
    const hierarchyControl = document.createElement('b'); hierarchyControl.textContent = 'Hierarchy'; preference.prepend(hierarchyControl);
    const hierarchyStyle = document.createElement('style');
    hierarchyStyle.textContent = '#cf-control-preference b{font-size:20px}body.fs-xl #cf-control-preference b{font-size:14px}';
    document.head.appendChild(hierarchyStyle);
    preferenceResult = preferenceOutcome('#cf-control-preference', '#cf-control-preference-copy');
    if (preferenceResult.ok || preferenceResult.hierarchyPreserved !== false) failures.push('preference hierarchy-flattening injection stayed green: ' + JSON.stringify(preferenceResult));
    hierarchyControl.remove(); hierarchyStyle.remove();
    const shrinkStyle = document.createElement('style');
    shrinkStyle.textContent = 'body.fs-xl #cf-control-preference-copy{font-size:12px!important}'; document.head.appendChild(shrinkStyle);
    preferenceResult = preferenceOutcome('#cf-control-preference', '#cf-control-preference-copy');
    if (preferenceResult.ok || preferenceResult.noTextShrink !== false) failures.push('preference text-shrink injection stayed green: ' + JSON.stringify(preferenceResult));
    shrinkStyle.remove();
    preference.querySelector('#cf-control-preference-copy').style.fontFamily = 'system-ui';
    preferenceResult = preferenceOutcome('#cf-control-preference', '#cf-control-preference-copy');
    if (preferenceResult.ok) failures.push('preference font omission stayed green');
    preference.querySelector('#cf-control-preference-copy').remove();
    preferenceResult = preferenceOutcome('#cf-control-preference', '#cf-control-preference-copy');
    if (preferenceResult.ok || preferenceResult.sample !== false || preferenceResult.sampleVisible !== false) {
      failures.push('preference missing-sample omission did not return a scoped failure: ' + JSON.stringify(preferenceResult));
    }
    document.body.className = priorClasses;
    preference.remove();
    const choice = document.createElement('section');
    choice.id = 'cf-control-choice'; choice.style.cssText = 'position:fixed;left:8px;top:120px;z-index:1000';
    choice.innerHTML = '<button data-choice="a" aria-pressed="false">A</button><button data-choice="b" aria-pressed="true">B</button>';
    document.body.appendChild(choice);
    const chosen = choice.querySelector('[data-choice="b"]'); chosen.focus();
    let choiceResult = choiceOutcome('#cf-control-choice', '[data-choice]', '[data-choice="b"]');
    if (!choiceResult.ok) failures.push('choice pressed/focus positive control failed: ' + JSON.stringify(choiceResult));
    chosen.removeAttribute('aria-pressed');
    choiceResult = choiceOutcome('#cf-control-choice', '[data-choice]', '[data-choice="b"]');
    if (choiceResult.ok) failures.push('choice aria-pressed omission stayed green');
    choice.remove();
    const navigation = document.createElement('section');
    navigation.id = 'cf-control-navigation'; navigation.style.cssText = 'position:fixed;left:8px;top:168px;z-index:1000';
    navigation.innerHTML = '<button data-nav-back>Back</button><article data-nav-copy>Rendered destination copy</article>';
    document.body.appendChild(navigation);
    navigation.querySelector('[data-nav-back]').focus();
    let navigationResult = navigationOutcome('#cf-control-navigation', '[data-nav-back]', '[data-nav-copy]', 10);
    if (!navigationResult.ok) failures.push('navigation render/focus positive control failed: ' + JSON.stringify(navigationResult));
    navigation.querySelector('[data-nav-copy]').remove();
    navigationResult = navigationOutcome('#cf-control-navigation', '[data-nav-back]', '[data-nav-copy]', 10);
    if (navigationResult.ok) failures.push('navigation rendered-content omission stayed green');
    navigation.remove();
    const motionMode = window.__CF_SLICE__?.api?.state?.().motionMode;
    const motionPositive = motionPolicyOutcome(motionMode);
    if (!motionPositive.ok) failures.push('motion CSS positive control failed: ' + JSON.stringify(motionPositive));
    document.body.classList.toggle('motion-reduced', !motionPositive.classReduced);
    const motionNegative = motionPolicyOutcome(motionMode);
    if (motionNegative.ok) failures.push('motion CSS class omission stayed green');
    document.body.classList.toggle('motion-reduced', motionPositive.classReduced);
    const panelOpener = document.createElement('button'); panelOpener.id = 'cf-control-panel-opener'; panelOpener.textContent = 'open';
    const panel = document.createElement('section'); panel.id = 'cf-control-panel'; panel.style.cssText = 'position:fixed;left:200px;top:8px;width:100px;height:80px;z-index:1001;background:#000';
    panel.innerHTML = '<button data-control-close style="position:absolute;right:0;top:0;width:44px;height:44px">close</button>';
    const preserved = document.createElement('div'); preserved.id = 'cf-control-preserved'; preserved.textContent = 'preserved'; preserved.style.cssText = 'position:fixed;left:200px;top:100px;width:80px;height:30px;z-index:1000';
    document.body.append(panelOpener, panel, preserved);
    panel.querySelector('[data-control-close]').addEventListener('click', () => { panel.style.display = 'none'; panelOpener.focus(); });
    panel.querySelector('[data-control-close]').focus();
    let openFocusResult = openFocusOutcome('#cf-control-panel', '[data-control-close]');
    if (!openFocusResult.ok) failures.push('panel open-focus positive control failed: ' + JSON.stringify(openFocusResult));
    panelOpener.focus();
    openFocusResult = openFocusOutcome('#cf-control-panel', '[data-control-close]');
    if (openFocusResult.ok) failures.push('panel open-focus omission stayed green');
    panel.querySelector('[data-control-close]').focus();
    const close = panel.querySelector('[data-control-close]');
    let closeIntegrity = closeIntegrityOutcome('#cf-control-panel', '[data-control-close]', null, true);
    if (!closeIntegrity.ok) failures.push('panel close-integrity positive control failed: ' + JSON.stringify(closeIntegrity));
    const duplicateClose = close.cloneNode(true); duplicateClose.removeAttribute('data-control-close'); duplicateClose.setAttribute('data-control-close-duplicate', ''); panel.appendChild(duplicateClose);
    closeIntegrity = closeIntegrityOutcome('#cf-control-panel', '[data-control-close],[data-control-close-duplicate]', null, true);
    if (closeIntegrity.ok || closeIntegrity.closeCount !== 2) failures.push('duplicate panel-close injection stayed green: ' + JSON.stringify(closeIntegrity));
    duplicateClose.remove();
    close.style.left = '0'; close.style.right = 'auto';
    closeIntegrity = closeIntegrityOutcome('#cf-control-panel', '[data-control-close]', null, true);
    if (closeIntegrity.ok || closeIntegrity.topRight) failures.push('upper-left panel-close injection stayed green: ' + JSON.stringify(closeIntegrity));
    close.style.left = ''; close.style.right = '0px';
    let panelResult = panelCloseOutcome('#cf-control-panel', '[data-control-close]', '#cf-control-panel-opener', '#cf-control-preserved');
    if (!panelResult.ok) failures.push('panel centre-close positive control failed: ' + JSON.stringify(panelResult));
    panel.style.display = 'block';
    const closeRect = close.getBoundingClientRect();
    const panelShield = document.createElement('div'); panelShield.id = 'cf-control-panel-shield'; panelShield.style.cssText = `position:fixed;left:${closeRect.left}px;top:${closeRect.top}px;width:44px;height:44px;z-index:1002`; document.body.appendChild(panelShield);
    panelResult = panelCloseOutcome('#cf-control-panel', '[data-control-close]', '#cf-control-panel-opener', '#cf-control-preserved');
    if (panelResult.ok) failures.push('panel centre blocker stayed green');
    panelOpener.remove(); panel.remove(); preserved.remove(); panelShield.remove();
    const controlled = document.createElement('section'); controlled.id = 'cf-control-controlled';
    const disclosure = document.createElement('button'); disclosure.id = 'cf-control-disclosure'; disclosure.setAttribute('aria-controls', controlled.id); disclosure.setAttribute('aria-expanded', 'true');
    const toggle = document.createElement('button'); toggle.id = 'cf-control-toggle'; toggle.setAttribute('aria-pressed', 'true');
    document.body.append(controlled, disclosure, toggle);
    let openerResult = openerOutcome('#cf-control-disclosure', '#cf-control-controlled', true);
    if (!openerResult.ok) failures.push('opener relationship positive control failed: ' + JSON.stringify(openerResult));
    disclosure.removeAttribute('aria-controls');
    openerResult = openerOutcome('#cf-control-disclosure', '#cf-control-controlled', true);
    if (openerResult.ok) failures.push('opener aria-controls omission stayed green');
    disclosure.setAttribute('aria-controls', controlled.id); disclosure.removeAttribute('aria-expanded');
    openerResult = openerOutcome('#cf-control-disclosure', '#cf-control-controlled', true);
    if (openerResult.ok) failures.push('opener aria-expanded omission stayed green');
    let pressedResult = pressedOutcome('#cf-control-toggle', true);
    if (!pressedResult.ok) failures.push('pressed positive control failed: ' + JSON.stringify(pressedResult));
    toggle.removeAttribute('aria-pressed'); pressedResult = pressedOutcome('#cf-control-toggle', true);
    if (pressedResult.ok) failures.push('pressed omission stayed green');
    controlled.remove(); disclosure.remove(); toggle.remove();
    const other = document.createElement('div'); other.id = 'cf-control-overlap'; other.style.cssText = 'position:fixed;left:400px;top:100px;width:80px;height:80px;background:#000;z-index:1000'; document.body.appendChild(other);
    root.style.left = '400px'; list = audit({ ...base, overlapPairs: [['#cf-control-surface', '#cf-control-overlap']] }); expect('overlap injection', list, 'SURFACE_OVERLAP', '#cf-control-surface');
    const still = [{ path: 'x', x: 1, y: 2, rotation: 0, alpha: 1, sx: 1, sy: 1 }];
    if (sceneDelta(still, structuredClone(still)).length) failures.push('scene positive control: identical snapshots moved');
    const moved = structuredClone(still); moved[0].rotation = 1;
    if (!sceneDelta(still, moved).some((row) => row.fields.includes('rotation'))) failures.push('scene negative control: injected rotation was accepted');
    root.remove(); other.remove(); document.getElementById('cf-motion-policy-probe')?.remove(); document.getElementById('cf-motion-policy-style')?.remove();
    return failures;
  };
  window.__CF_GLASS_AUDIT__ = Object.freeze({
    audit, canvasIssues, safeProbe, viewportIssues, preferenceOutcome, choiceOutcome,
    navigationOutcome, openFocusOutcome, forcedColorsOutcome, motionPolicyOutcome, closeIntegrityOutcome,
    rightBottomAnchorOutcome, panelCloseOutcome, openerOutcome, pressedOutcome,
    sceneSnapshot, sceneDelta, selftest,
  });
}

function staticServer() {
  const root = fs.realpathSync(dist);
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
  return http.createServer((req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
      const decoded = decodeURIComponent(requestUrl.pathname);
      const requested = decoded === '/' ? '/index.html' : decoded;
      const file = path.resolve(root, '.' + requested);
      if (!(file === root || file.startsWith(rootPrefix))) throw new Error('outside dist');
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not a regular file');
      const body = fs.readFileSync(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
    }
  });
}

function formatIssue(context, row) {
  return `[${row.code}] ${context.viewport}/${context.surface} ${row.element}: actual=${JSON.stringify(row.actual)} expected=${JSON.stringify(row.expected)}`;
}

function ultraPointerOutcome(pointer, expectedX, expectedY) {
  const ok = Number.isFinite(pointer?.x) && Number.isFinite(pointer?.y)
    && Math.abs(pointer.x - expectedX) < 2 && Math.abs(pointer.y - expectedY) < 2;
  return { ok, pointer: pointer ?? null, expected: [expectedX, expectedY] };
}

function combineUltraResizePointerOutcome(resize, pointer) {
  return { ...(resize || { ok: false }), ok: resize?.ok === true && pointer?.ok === true,
    realPointer: pointer || { ok: false, pointer: null } };
}

function ultraControlExecutionOutcome({ downshift, restored, controlsDiscriminated }) {
  if (downshift?.ok !== true) {
    return { executed: false, blocked: true, findingCode: 'ULTRA_VIEWPORT_RESIZE_STALE' };
  }
  if (restored?.ok !== true) {
    return { executed: false, blocked: true, findingCode: 'ULTRA_VIEWPORT_RESIZE_NOT_RESTORED' };
  }
  return controlsDiscriminated === true
    ? { executed: true, blocked: false, findingCode: null }
    : { executed: false, blocked: false, findingCode: null };
}

function ultraResizeInjectionControlsOutcome(rows) {
  if (!Array.isArray(rows) || rows.length !== 8) {
    return { ok: false, why: 'same-backing resize control set was incomplete' };
  }
  for (const row of rows) {
    if (!row || row.error || row.controlApplied !== true || row.restored !== true
      || !row.outcome || row.outcome.error || row.outcome.ok !== false) {
      return { ok: false, why: 'same-backing resize injection did not apply, restore, and reject its predicate', row };
    }
  }
  return { ok: true, why: null };
}

function targetedProductRemainderBlocked(selectedViewport, productFailure) {
  return typeof selectedViewport === 'string' && !!selectedViewport && productFailure === true;
}

function productBlockedSuffixForViewport(viewport, findingCode, executedControls = []) {
  const uniqueReachableSuffix = {
    'primary-phone': ['forced-colors-system-mapping'],
    'phone-landscape': ['mobile-landscape-surface-chrome-yield'],
    'desktop-8k': ['ultra-same-backing-resize'],
  }[viewport] || [];
  const executed = new Set(executedControls);
  return uniqueReachableSuffix.filter((name) => !executed.has(name)).map((name) => ({
    name, viewport, findingCode,
  }));
}

function controlCoverageOutcome(executedControls = [], blockedControls = []) {
  const executed = [...new Set(executedControls)];
  const blockedRows = blockedControls.map((row) => typeof row === 'string'
    ? { name: row, viewport: null, findingCode: null } : row);
  const blockedNames = blockedRows.map((row) => row?.name);
  const invalid = [...executed, ...blockedNames].filter((name) => !NEGATIVE_CONTROLS.includes(name));
  const duplicateBlocked = blockedNames.filter((name, index) => blockedNames.indexOf(name) !== index);
  const overlap = blockedNames.filter((name) => executed.includes(name));
  if (invalid.length || duplicateBlocked.length || overlap.length
    || blockedRows.some((row) => typeof row?.name !== 'string')) {
    return { ok: false, why: 'negative-control coverage contained unknown, duplicate, or executed-and-blocked rows' };
  }
  return {
    ok: true,
    executed: executed.filter((name) => NEGATIVE_CONTROLS.includes(name)).sort(),
    blocked: blockedRows.slice().sort((a, b) => a.name.localeCompare(b.name)),
    omitted: NEGATIVE_CONTROLS.filter((name) => !executed.includes(name) && !blockedNames.includes(name)),
  };
}

async function main() {
  if (selftestOnly) {
    await reportSelftest();
    return;
  }
  runReloadEvidence = [];
  const releaseLock = acquireWorkspaceLock('v2 responsive glass matrix');
  try {
    runSource = sourceIdentity();
    if (!/^[0-9a-f]{40}$/.test(runSource.commit || '') || !runSource.branch) {
      throw new Error(`source identity unavailable: ${JSON.stringify(runSource)}`);
    }
    execSync('npx vite build', { cwd: appDir, stdio: 'inherit' });
  const server = staticServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('glass matrix server did not expose a TCP port');
  const url = `http://127.0.0.1:${address.port}/`;
  const findings = [], instrumentFailures = [];
  const browserVersions = [];
  const executedControls = new Set();
  const productBlockedControls = new Map();
  let targetedProductFailure = false;
  const recordControls = (...names) => {
    for (const name of names) {
      if (!NEGATIVE_CONTROLS.includes(name)) throw new Error(`unknown negative control ${JSON.stringify(name)}`);
      executedControls.add(name);
      productBlockedControls.delete(name);
    }
  };
  for (const failure of await reloadPhaseSelftest()) {
    instrumentFailures.push(`RELOAD PHASE SELFTEST ${failure}`);
  }
  recordControls(
    'replacement-document-loader-token-phase', 'import-phase-sequence',
    'replacement-ticker-quiescence', 'replacement-boot-phase-sequence',
    'reload-resource-release', 'ready-confirmation-heartbeat',
    'ready-confirmation-ticker-progress', 'ultra-viewport-render-budget',
  );
  let controlsRun = false, hpControlRun = false, settingsWidthControlRun = false,
    planetsideControlRun = false, panelPlanetsideControlRun = false,
    closeIntegrityControlRun = false, toastAnchorControlRun = false,
    settingsAnchorControlRun = false, recordsAnchorObserved = false,
    chromeYieldControlRun = false, chromeRestoreControlRun = false, chromeLandscapeControlRun = false,
    objectiveYieldControlRun = false, topChromeControlRun = false, portraitBandControlRun = false,
    portraitFallbackControlRun = false,
    modalControlRun = false, modalLiveControlRun = false, closeLabelControlRun = false,
    hiddenOpenerControlRun = false, reloadBindingControlRun = false,
    releaseDetailControlRun = false, releaseTailControlRun = false;
  const add = (viewport, surface, rows) => {
    for (const row of rows || []) findings.push({ context: { viewport, surface }, row });
  };
  const addOutcome = (viewport, surface, code, element, outcome, expected) => {
    if (!outcome?.ok) findings.push({
      context: { viewport, surface },
      row: { code, surface, element, actual: outcome, expected },
    });
  };
  try {
    for (const vp of MATRIX_VIEWPORTS) {
      /* A fresh owned browser per viewport is deliberate. Pixi/WebGL
         resources can outlive a disposed incognito target long enough for a
         late matrix row to inherit GPU pressure from the first ten rows. */
      let browser = null, browserContextId = null, targetId = null;
      let eventSessionId = null, reloadCaptureArmed = false;
      let contextSequence = 0, currentTopLoaderId = null, reloadBindingReceiptOrdinal = 0;
      const runtimeContexts = new Map();
      const reloadEvents = [], reloadImportPhases = [], reloadReleaseWitnesses = [], reloadBootPhases = [], reloadReadyWitnesses = [],
        reloadTopNavigations = [], reloadFatalEvents = [], reloadCommands = [], requestUrls = new Map();
      const onBrowserEvent = (event) => {
        if (event?.sessionId && eventSessionId && event.sessionId !== eventSessionId) return;
        if (event?.sessionId && !eventSessionId) return;
        if (event?.method === 'Target.targetCrashed' && targetId
          && event.params?.targetId && event.params.targetId !== targetId) return;
        const at = Date.now();
        if (event?.method === 'Runtime.executionContextsCleared') {
          runtimeContexts.clear();
        } else if (event?.method === 'Runtime.executionContextDestroyed') {
          runtimeContexts.delete(event.params?.executionContextId);
        } else if (event?.method === 'Runtime.executionContextCreated') {
          const context = event.params?.context;
          const id = context?.id;
          if (Number.isInteger(id)) runtimeContexts.set(id, {
            active: true, id, uniqueId: typeof context.uniqueId === 'string' ? context.uniqueId : null,
            generation: ++contextSequence,
            origin: typeof context.origin === 'string' ? context.origin : null,
            frameId: typeof context.auxData?.frameId === 'string' ? context.auxData.frameId : null,
            isDefault: context.auxData?.isDefault === true, createdAt: at,
          });
        }
        if (event?.method === 'Page.frameNavigated' && !event.params?.frame?.parentId) {
          const frame = event.params?.frame || {};
          currentTopLoaderId = typeof frame.loaderId === 'string' ? frame.loaderId : null;
          if (reloadCaptureArmed) reloadTopNavigations.push({
            at, method: 'Page.frameNavigated', frameId: frame.id || null, parentId: null,
            loaderId: frame.loaderId || null, url: frame.url || null,
            unreachableUrl: frame.unreachableUrl || null,
          });
        }
        if (reloadCaptureArmed && event?.method === 'Runtime.bindingCalled'
          && [IMPORT_PHASE_BINDING, RELOAD_RELEASE_BINDING, BOOT_PHASE_BINDING, SLICE_READY_BINDING].includes(event.params?.name)) {
          const executionContextId = event.params.executionContextId ?? null;
          const context = runtimeContexts.get(executionContextId);
          const validation = event.params.name === IMPORT_PHASE_BINDING
            ? validateImportPhaseWitness(event.params.payload)
            : event.params.name === RELOAD_RELEASE_BINDING
              ? validateReloadReleaseWitness(event.params.payload, vp)
              : event.params.name === BOOT_PHASE_BINDING
                ? validateBootPhaseWitness(event.params.payload)
                : validateSliceReadyWitness(event.params.payload, vp);
          const target = event.params.name === IMPORT_PHASE_BINDING
            ? reloadImportPhases
            : event.params.name === RELOAD_RELEASE_BINDING
              ? reloadReleaseWitnesses
              : event.params.name === BOOT_PHASE_BINDING
                ? reloadBootPhases : reloadReadyWitnesses;
          const receiptOrdinal = [IMPORT_PHASE_BINDING, RELOAD_RELEASE_BINDING].includes(event.params.name)
            ? ++reloadBindingReceiptOrdinal : null;
          target.push({
            at, sessionId: event.sessionId || null, executionContextId,
            loaderId: currentTopLoaderId, context: context ? { ...context } : null,
            receiptOrdinal, validation,
          });
          pushBoundedReloadEvent(reloadEvents, {
            at, method: 'Runtime.bindingCalled', name: event.params.name,
            executionContextId, receiptOrdinal,
            valid: validation.ok, why: validation.why,
          });
          return;
        }
        const row = compactReloadEvent(event, requestUrls, at);
        if (reloadCaptureArmed) {
          pushBoundedReloadEvent(reloadEvents, row);
          if (row && fatalReloadEvent([row])) reloadFatalEvents.push(row);
        }
      };
      try {
        browser = await openChromiumCdp({
          label: `glass matrix ${vp.label}`, userDataPrefix: 'cf-glassmatrix',
          commandTimeoutMs: 30000, onEvent: onBrowserEvent,
        });
        browserVersions.push(browser.browser);
        const send = browser.send;
        const context = await send('Target.createBrowserContext', { disposeOnDetach: true });
        browserContextId = context.browserContextId;
        const target = await send('Target.createTarget', { url: 'about:blank', browserContextId });
        targetId = target.targetId;
        const attached = await send('Target.attachToTarget', { targetId, flatten: true });
        const session = attached.sessionId;
        eventSessionId = session;
        await send('Runtime.enable', {}, session);
        await send('Runtime.addBinding', { name: IMPORT_PHASE_BINDING }, session);
        await send('Runtime.addBinding', { name: RELOAD_RELEASE_BINDING }, session);
        await send('Runtime.addBinding', { name: BOOT_PHASE_BINDING }, session);
        await send('Runtime.addBinding', { name: SLICE_READY_BINDING }, session);
        await send('Page.enable', {}, session);
        await send('Inspector.enable', {}, session);
        await send('Network.enable', {}, session);
        await send('Page.setLifecycleEventsEnabled', { enabled: true }, session);
        await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr, mobile: vp.mobile }, session);
        await send('Emulation.setTouchEmulationEnabled', { enabled: vp.mobile, maxTouchPoints: vp.mobile ? 5 : 1 }, session);
        if (vp.safe) {
          try {
            await send('Emulation.setSafeAreaInsetsOverride', { insets: vp.safe }, session);
          } catch (error) {
            instrumentFailures.push(`${vp.label}: Chromium could not apply the required real safe-area override (${error.message})`);
          }
        }
        await send('Page.navigate', { url }, session);
        const evalIn = async (expression) => {
          const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, session);
          if (result.exceptionDetails) throw new Error(String(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'page evaluation failed'));
          return result.result.value;
        };
        const topFrameState = async () => {
          const tree = await send('Page.getFrameTree', {}, session);
          const frame = tree?.frameTree?.frame;
          const loaderId = frame?.loaderId;
          if (typeof loaderId !== 'string' || !loaderId) {
            throw new Error(`${vp.label}: top-frame loader id unavailable (${JSON.stringify(frame || null)})`);
          }
          return {
            loaderId, frameId: typeof frame.id === 'string' ? frame.id : null,
            url: typeof frame.url === 'string' ? frame.url : null,
            unreachableUrl: typeof frame.unreachableUrl === 'string' && frame.unreachableUrl
              ? frame.unreachableUrl : null,
            mimeType: typeof frame.mimeType === 'string' ? frame.mimeType : null,
          };
        };
        const deadline = Date.now() + SLICE_READY_TIMEOUT_MS;
        let ready = null;
        while (Date.now() < deadline) {
          try {
            ready = await evalIn(`(()=>{ const S=window.__CF_SLICE__; try { const s=S?.api?.state(); return {
              ready:!!s?.save,token:S?.documentToken||null,
              why:!S?'slice absent':!S.api?'slice api absent':s?.save?'':'slice state incomplete',
              readyState:document.readyState,href:location.href};
            } catch(error) { return {ready:false,token:S?.documentToken||null,why:String(error?.message||error),
              readyState:document.readyState,href:location.href}; } })()`);
          } catch (error) { ready = { ready: false, why: error.message }; }
          if (ready?.ready && ready.token) break;
          await sleep(50);
        }
        if (!ready?.ready || !ready.token) {
          instrumentFailures.push(`${vp.label}: slice did not become ready (${ready?.why || 'no diagnostic'})`);
          continue;
        }
        await evalIn(`(${installAuditHarness.toString()})()`);
        const audit = (options) => evalIn(`window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(options)})`);
        const waitFor = async (label, expression, timeoutMs = 5000) => {
          const until = Date.now() + timeoutMs;
          let last = null;
          while (Date.now() < until) {
            last = await evalIn(expression);
            if (last) return last;
            await sleep(50);
          }
          throw new Error(`${vp.label}/${label}: outcome did not arrive within ${timeoutMs}ms (last ${JSON.stringify(last)})`);
        };
        /* Geometry/state predicates are product outcomes, while target
           starvation and browser transport loss are distinct failures. Poll
           through a short exact-context command paired with a root-browser
           heartbeat. Answerable false state is returned to addOutcome;
           heartbeat-proven target starvation becomes a product liveness
           finding; heartbeat loss remains instrument/transport failure. */
        const observeOutcome = async (expression, accept, executionContextId, timeoutMs, {
          cycle = 0, postRenderPriority = null, singleAttempt = false,
        } = {}) => {
          const until = Date.now() + timeoutMs;
          let last = null;
          const commands = [];
          while (Date.now() < until) {
            const remaining = until - Date.now();
            const probe = await runBoundedOutcomeHeartbeatProbe({
              send, sessionId: session, executionContextId, expression,
              maxTimeoutMs: Math.max(1, Math.min(PHASE_PROBE_TIMEOUT_MS, remaining)),
              cycle, postRenderPriority,
            });
            commands.push(...probe.commands);
            if (!probe.ok) {
              const evidence = { viewport: vp.label, expression, commands, last,
                classification: probe.classification, why: probe.why };
              if (probe.classification === 'product-unanswerable-after-ready') {
                throw new ProductAnswerabilityFinding(
                  `${vp.label}: product outcome target was unanswerable while the browser process remained responsive (${probe.why})`,
                  evidence,
                  {
                    code: 'ULTRA_VIEWPORT_RESIZE_UNANSWERABLE',
                    surface: 'ultra-same-backing-resize', element: 'canvas',
                    expected: 'the same-backing viewport transition remains externally answerable within the bounded target command while the browser process is responsive',
                  },
                );
              }
              throw new Error(`${vp.label}: bounded product outcome probe failed (${JSON.stringify(evidence)})`);
            }
            if (probe.result?.exceptionDetails) {
              throw new Error(`${vp.label}: bounded product outcome expression threw (${String(
                probe.result.exceptionDetails.exception?.description
                || probe.result.exceptionDetails.text || 'page evaluation failed')})`);
            }
            last = probe.result?.result?.value;
            if (accept(last)) return { settled: true, value: last, commands };
            if (singleAttempt) return { settled: false, value: last, commands };
            if (Date.now() < until) await sleep(50);
          }
          return { settled: false, value: last, commands };
        };
        const waitForReload = async (label, priorToken, priorFrame, priorContext, phaseId, importDeadline, {
          importTimeoutMs = IMPORT_SETTLE_TIMEOUT_MS,
          navigationTimeoutMs = NAVIGATION_COMMIT_TIMEOUT_MS,
          replacementTimeoutMs = REPLACEMENT_READY_TIMEOUT_MS,
          } = {}) => {
          const beganAt = importDeadline - importTimeoutMs;
          let navigationDeadline = null, bootDeadline = null, commit = null;
          const expectedOrigin = new URL(url).origin;
          const diagnosticEvidence = (failure = null) => ({
            viewport: vp.label, label, status: failure ? 'failed' : 'running', failure,
            priorFrame, priorContext, expectedUrl: url, elapsedMs: Date.now() - beganAt,
            clocks: { importDeadline, navigationDeadline, bootDeadline,
              replacementLoaderId: commit?.loaderId || null },
            importPhases: [...reloadImportPhases],
            releaseWitnesses: [...reloadReleaseWitnesses],
            bootPhases: [...reloadBootPhases],
            readyWitnesses: [...reloadReadyWitnesses],
            topNavigations: [...reloadTopNavigations],
            fatalEvents: [...reloadFatalEvents],
            commands: [...reloadCommands],
            events: [...reloadEvents],
          });
          const fail = (why, classification = 'instrument-or-transport-failure') => {
            const evidence = diagnosticEvidence(why);
            evidence.classification = classification;
            runReloadEvidence.push(evidence);
            const message = `${vp.label}/${label}: ${why} (evidence ${JSON.stringify(evidence)})`;
            if (classification === 'product-unanswerable-after-ready') {
              throw new ProductAnswerabilityFinding(message, evidence);
            }
            throw new Error(message);
          };
          const confirmReady = async (readyRow) => {
            const witnessed = readyRow.validation.witness;
            const expression = `(()=>{ const S=window.__CF_SLICE__; try { const s=S?.api?.state(); return {
                ready:!!s?.save,token:S?.documentToken||null,href:location.href,
                readyState:document.readyState,viewConnected:!!S?.app?.canvas?.isConnected,
                rendererReady:!!S?.app?.renderer&&S.app.canvas.width>1&&S.app.canvas.height>1,
                stageReady:!!S?.app?.stage,tickerStarted:!!S?.app?.ticker?.started,
                tickerTicks:s?.tickerTicks??null,
                backingWidth:s?.backingWidth||0,backingHeight:s?.backingHeight||0,
                backdropBackingWidth:s?.backdropBackingWidth||0,
                backdropBackingHeight:s?.backdropBackingHeight||0,
                combinedBackingPixels:s?.combinedBackingPixels||0,
                rendererDpr:s?.rendererDpr??null,
                backingPixelCapPerCanvas:s?.backingPixelCapPerCanvas||0,
                viewportWidth:s?.viewportWidth||0,viewportHeight:s?.viewportHeight||0};
              } catch(error) { return {ready:false,token:S?.documentToken||null,href:location.href,
                readyState:document.readyState,error:String(error?.message||error)}; } })()`;
            const confirmCycle = async (cycle, priorTickerTicks = null) => {
              /* Cycle two installs one one-shot callback after Pixi's LOW
                 render listener (UTILITY=-50). The command itself waits for
                 that exact completed ticker/render turn inside the same 2s
                 bound; an arbitrary Node sleep can race ahead of the next
                 rAF and falsely report a healthy slow renderer as stalled. */
              const confirmation = await runBoundedReadyConfirmation({
                send, sessionId: session, executionContextId: readyRow.executionContextId,
                readyReceiptAt: readyRow.at, bootDeadline, expression, cycle,
                postRenderPriority: priorTickerTicks === null ? null : -50,
              });
              reloadCommands.push(...confirmation.commands);
              if (!confirmation.ok) fail(confirmation.why, confirmation.classification);
              const result = confirmation.result;
              if (result.exceptionDetails) {
                fail(`bounded slice-ready confirmation threw (${String(result.exceptionDetails.exception?.description
                  || result.exceptionDetails.text || 'page evaluation failed')})`);
              }
              const state = result.result?.value;
              if (!state || typeof state !== 'object' || Array.isArray(state)) {
                fail(`bounded slice-ready confirmation returned no structured state (${JSON.stringify(result)})`);
              }
              const stateOutcome = confirmationStateOutcome(state, witnessed, url, vp, priorTickerTicks);
              if (!stateOutcome.ok) fail(`${stateOutcome.why} (${JSON.stringify(state)})`,
                'product-unanswerable-after-ready');
              const active = runtimeContexts.get(readyRow.executionContextId);
              if (!active || active.uniqueId !== readyRow.context?.uniqueId
                || currentTopLoaderId !== commit.loaderId) {
                fail('replacement context/loader changed during slice-ready confirmation',
                  'product-unanswerable-after-ready');
              }
              if (reloadFatalEvents.length) {
                fail(`replacement target failed (${JSON.stringify(reloadFatalEvents[0])})`,
                  'product-unanswerable-after-ready');
              }
              const navigationNow = replacementNavigationOutcome(reloadTopNavigations, {
                priorLoaderId: priorFrame.loaderId, priorFrameId: priorFrame.frameId,
                expectedUrl: url, releaseAt: reloadReleaseWitnesses[0].at, navigationDeadline,
              });
              if (navigationNow.status !== 'ready' || navigationNow.row.loaderId !== commit.loaderId) {
                fail(`replacement loader changed during confirmation (${navigationNow.why || navigationNow.status})`,
                  'product-unanswerable-after-ready');
              }
              return state;
            };
            const first = await confirmCycle(1);
            return confirmCycle(2, first.tickerTicks);
          };
          while (true) {
            if (reloadFatalEvents.length) fail(`replacement target failed (${JSON.stringify(reloadFatalEvents[0])})`);
            const importPhase = importPhaseOutcome(reloadImportPhases, {
              phaseId, priorToken, priorLoaderId: priorFrame.loaderId,
              priorFrameId: priorFrame.frameId,
              priorContextUniqueId: priorContext.uniqueId,
              priorContextGeneration: priorContext.generation, expectedOrigin,
              expectedSessionId: session, importDeadline,
            });
            if (importPhase.status === 'failed') fail(`import phase failed closed (${importPhase.why})`);
            const release = importReleaseOutcome(reloadReleaseWitnesses, {
              priorToken, priorLoaderId: priorFrame.loaderId, priorFrameId: priorFrame.frameId,
              priorContextUniqueId: priorContext.uniqueId,
              priorContextGeneration: priorContext.generation, expectedOrigin,
              expectedSessionId: session, importDeadline,
            });
            if (release.status === 'failed') fail(`reload resource release failed closed (${release.why})`);
            if (release.status === 'ready') {
              /* The product deliberately emits the generic released-resource
                 binding immediately before its operation-specific
                 release-complete binding. CDP can wake this loop between
                 those adjacent events. Anchor navigation to the immutable
                 release receipt now, but let the exact phase ledger settle
                 under the original import deadline. */
              navigationDeadline ??= release.row.at + navigationTimeoutMs;
            }
            const importReleaseSequence = importReleaseSequenceOutcome(
              importPhase, release, Date.now(), importDeadline,
            );
            if (importReleaseSequence.status === 'failed') {
              fail(`import/release sequence failed closed (${importReleaseSequence.why})`);
            }
            if (importReleaseSequence.status === 'pending') {
              if (reloadReadyWitnesses.length) fail('slice-ready witness arrived before import release/navigation');
              if (reloadBootPhases.length) fail('replacement boot phase arrived before import release/navigation');
              await sleep(20);
              continue;
            }
            const liveStages = importPhase.rows.map((row) => row.validation.witness.stage);
            const expectedLiveStages = [
              'invoked', 'claimed', 'no-active-persist', 'primary-write-started',
              'primary-write-complete', 'release-started', 'release-complete',
            ];
            if (JSON.stringify(liveStages) !== JSON.stringify(expectedLiveStages)) {
              fail(`preference import inherited unexpected prior persistence (${liveStages.join(' -> ')})`);
            }
            const navigation = replacementNavigationOutcome(reloadTopNavigations, {
              priorLoaderId: priorFrame.loaderId, priorFrameId: priorFrame.frameId,
              expectedUrl: url, releaseAt: release.row.at, navigationDeadline,
            });
            if (navigation.status === 'failed') fail(`import/reload failed closed (${navigation.why})`);
            if (navigation.status === 'pending') {
              if (reloadReadyWitnesses.length) fail('slice-ready witness arrived before replacement navigation committed');
              if (reloadBootPhases.length) fail('replacement boot phase arrived before replacement navigation committed');
              if (Date.now() >= navigationDeadline) {
                fail(`top-frame loader did not change within ${navigationTimeoutMs}ms after resource release`);
              }
              await sleep(20);
              continue;
            }
            commit ??= navigation.row;
            bootDeadline ??= commit.at + replacementTimeoutMs;
            const bootFirst = reloadBootPhases[0];
            const bootPhase = replacementBootPhaseOutcome(reloadBootPhases, {
              priorToken, priorFrameId: priorFrame.frameId,
              priorContextUniqueId: priorContext.uniqueId,
              priorContextGeneration: priorContext.generation,
              expectedOrigin, expectedSessionId: session,
              replacementLoaderId: commit.loaderId,
              releaseAt: release.row.at, commitAt: commit.at, bootDeadline,
              contextStillActive: !!bootFirst
                && runtimeContexts.get(bootFirst.executionContextId)?.uniqueId
                  === bootFirst.context?.uniqueId,
            });
            if (bootPhase.status === 'failed') {
              fail(`replacement boot phase failed closed (${bootPhase.why})`);
            }
            const readyOutcome = replacementReadyOutcome(reloadReadyWitnesses, {
              priorToken, priorFrameId: priorFrame.frameId,
              priorContextUniqueId: priorContext.uniqueId,
              priorContextGeneration: priorContext.generation,
              expectedUrl: url, expectedOrigin,
              expectedSessionId: session, replacementLoaderId: commit.loaderId,
              releaseAt: release.row.at, commitAt: commit.at, bootDeadline,
              contextStillActive: !!reloadReadyWitnesses[0]
                && runtimeContexts.get(reloadReadyWitnesses[0].executionContextId)?.uniqueId
                  === reloadReadyWitnesses[0].context?.uniqueId,
            });
            if (readyOutcome.status === 'failed') fail(`import/reload failed closed (${readyOutcome.why})`);
            if (readyOutcome.status === 'pending') {
              if (Date.now() >= bootDeadline) {
                fail(`replacement document did not emit boot-ready within ${replacementTimeoutMs}ms after the loader changed; last boot phase ${bootPhase.lastStage || 'none'}`);
              }
              await sleep(20);
              continue;
            }
            if (bootPhase.status !== 'ready') {
              fail(`slice-ready witness arrived before the complete boot-phase sequence (last ${bootPhase.lastStage || 'none'})`);
            }
            const finalBootRow = bootPhase.rows.at(-1);
            if (bootPhase.documentToken !== readyOutcome.row.validation.witness.token
              || finalBootRow.at > readyOutcome.row.at
              || finalBootRow.executionContextId !== readyOutcome.row.executionContextId
              || finalBootRow.context?.uniqueId !== readyOutcome.row.context?.uniqueId) {
              fail('slice-ready witness did not follow the exact replacement boot operation/context');
            }
            const state = await confirmReady(readyOutcome.row);
            const commandLedger = reloadCommandLedgerOutcome(reloadCommands, {
              sessionId: session, executionContextId: readyOutcome.row.executionContextId,
            });
            if (!commandLedger.ok) fail(`replacement confirmation command ledger failed closed (${commandLedger.why})`);
            const now = Date.now();
            return {
              ...state, elapsedMs: now - beganAt,
              reloadEvidence: {
                status: 'pass',
                priorLoaderId: priorFrame.loaderId,
                replacementLoaderId: commit.loaderId,
                elapsedMs: now - beganAt,
                importPhases: [...reloadImportPhases],
                releaseWitness: release.row,
                bootPhases: [...reloadBootPhases],
                readyWitness: readyOutcome.row,
                commands: [...reloadCommands],
                events: [...reloadEvents],
              },
            };
          }
        };
        /* Use one unambiguous product floor everywhere. Desktop users may
           still be on touch laptops, and a narrower desktop exemption made
           the same control pass or fail based only on emulation metadata. */
        const targetFloor = 44;
        const maxBackingPixels = backingPixelCapForViewport(vp.width, vp.height);
        const expectedDpr = expectedDensityPlan(vp).dpr;
        const common = {
          targetFloor,
          safe: vp.safe || {},
          safeExpected: vp.safe || undefined,
          viewportExpected: { width: vp.width, height: vp.height, dpr: vp.dpr },
          fitSelectors: ['#playerchip', '#hpbar', '#searchbox', '#trail', '#objchip', '#ctxbar', '#hintpill', '#dock', '#raillft', '#railrgt'],
          overlapPairs: [['#playerchip', '#searchbox'], ['#ctxbar', '#hintpill'], ['#ctxbar', '#dock'], ['#hintpill', '#dock']],
        };
        /* Fresh-player surface: check before Skip so every viewport proves it. */
        await waitFor('Training initial focus', `document.getElementById('tutcard')?.contains(document.activeElement)`);
        const trainingFocusCheck = `(()=>{ const card=document.getElementById('tutcard'),active=document.activeElement;
          if(!card||!(active instanceof HTMLElement)||!card.contains(active))return {ok:false,why:'focus outside Training',active:active?.id||active?.tagName||null};
          const cr=card.getBoundingClientRect(),ar=active.getBoundingClientRect();
          const inside=ar.left>=cr.left-1&&ar.top>=cr.top-1&&ar.right<=cr.right+1&&ar.bottom<=cr.bottom+1;
          return {ok:inside,active:active.getAttribute('data-sel')||active.id||active.tagName,
            card:[cr.left,cr.top,cr.right,cr.bottom],rect:[ar.left,ar.top,ar.right,ar.bottom],scrollTop:card.scrollTop}; })()`;
        addOutcome(vp.label, 'training-focus', 'TRAINING_FOCUSED_ACTION_CLIPPED', '#tutcard :focus', await evalIn(trainingFocusCheck),
          'the automatically focused lesson action is visible inside the safe, scrollable Training card');
        if (!controlsRun) {
          const trainingFocusControl = await evalIn(`(()=>{ const active=document.activeElement,prior=active.style.transform;
            active.style.transform='translateY(1000px)';const result=${trainingFocusCheck};active.style.transform=prior;return result;})()`);
          if (trainingFocusControl.ok) instrumentFailures.push(`${vp.label}: offscreen Training-focus injection stayed green (${JSON.stringify(trainingFocusControl)})`);
          recordControls('training-focused-action-visibility');
        }
        add(vp.label, 'training', await audit({
          ...common, surface: 'training', root: '#tutcard', textMin: 80,
          required: [{ selector: '[data-sel=tuttext]', min: 1, textMin: 60 }, { selector: '[data-sel=tutskip]', min: 1 }],
          interactiveRoots: ['#tutcard'], contrastSelectors: ['#tutcard'],
          focusSelectors: ['[data-sel=tutskip]'],
          overlapPairs: [...common.overlapPairs, ['#tutcard', '#dock']],
          canvas: true, expectedDpr, maxBackingPixels,
        }));
        {
          /* Import a real rich expedition with an intentionally unfinished
             tutorial and persisted display preferences. The reload proves
             Training is freshly rendered from saved state, while keeping
             Compendium/Records/Atlas/Charters populated for the panel pass. */
          const priorToken = ready.token;
          const priorFrame = await topFrameState();
          const priorContexts = [...runtimeContexts.values()].filter((row) => row.active
            && row.isDefault && row.frameId === priorFrame.frameId);
          const priorContext = priorContexts.length === 1 ? priorContexts[0] : null;
          if (!priorContext?.uniqueId || priorContext.origin !== new URL(url).origin) {
            throw new Error(`${vp.label}/preference fixture import: default top-frame context unavailable (${JSON.stringify({ priorFrame, contexts: [...runtimeContexts.values()] })})`);
          }
          if (!reloadBindingControlRun) {
            reloadEvents.length = 0;
            reloadImportPhases.length = 0;
            reloadReleaseWitnesses.length = 0;
            reloadBootPhases.length = 0;
            reloadReadyWitnesses.length = 0;
            reloadTopNavigations.length = 0;
            reloadFatalEvents.length = 0;
            reloadCommands.length = 0;
            reloadCaptureArmed = true;
            try {
              await evalIn(`window.${IMPORT_PHASE_BINDING}('{bad json')`);
              for (let i = 0; i < 50 && reloadImportPhases.length < 1; i++) await sleep(10);
              const malformedPhase = reloadImportPhases[0];
              if (reloadImportPhases.length !== 1 || malformedPhase?.validation?.ok
                || malformedPhase?.context?.uniqueId !== priorContext.uniqueId
                || malformedPhase?.sessionId !== session) {
                throw new Error(`${vp.label}: malformed live import-phase binding control was not rejected (${JSON.stringify(reloadImportPhases)})`);
              }
              reloadImportPhases.length = 0;
              await evalIn(`window.${BOOT_PHASE_BINDING}('{bad json')`);
              for (let i = 0; i < 50 && reloadBootPhases.length < 1; i++) await sleep(10);
              const malformedBoot = reloadBootPhases[0];
              if (reloadBootPhases.length !== 1 || malformedBoot?.validation?.ok
                || malformedBoot?.context?.uniqueId !== priorContext.uniqueId
                || malformedBoot?.sessionId !== session) {
                throw new Error(`${vp.label}: malformed live boot-phase binding control was not rejected (${JSON.stringify(reloadBootPhases)})`);
              }
              reloadBootPhases.length = 0;
              await evalIn(`window.${SLICE_READY_BINDING}('{bad json')`);
              for (let i = 0; i < 50 && reloadReadyWitnesses.length < 1; i++) await sleep(10);
              const malformed = reloadReadyWitnesses[0];
              if (reloadReadyWitnesses.length !== 1 || malformed?.validation?.ok
                || malformed?.context?.uniqueId !== priorContext.uniqueId
                || malformed?.sessionId !== session) {
                throw new Error(`${vp.label}: malformed live slice-ready binding control was not rejected (${JSON.stringify(reloadReadyWitnesses)})`);
              }
              reloadReadyWitnesses.length = 0;
              await evalIn(`(()=>{ const S=window.__CF_SLICE__,s=S.api.state(),payload=JSON.stringify({
                schema:'cf-v2-slice-ready/v1',status:'ready',token:S.documentToken,href:location.href,
                readyState:document.readyState,saveReady:!!s.save,viewConnected:S.app.canvas.isConnected,
                rendererReady:!!S.app.renderer&&S.app.canvas.width>1&&S.app.canvas.height>1,
                stageReady:!!S.app.stage,tickerTicks:s.tickerTicks,
                backingWidth:S.app.canvas.width,backingHeight:S.app.canvas.height,
                backdropBackingWidth:s.backdropBackingWidth,backdropBackingHeight:s.backdropBackingHeight,
                combinedBackingPixels:s.combinedBackingPixels,
                rendererDpr:s.rendererDpr,
                backingPixelCapPerCanvas:s.backingPixelCapPerCanvas,
                viewportWidth:s.viewportWidth,viewportHeight:s.viewportHeight,
                performanceNow:performance.now()});
                window.${SLICE_READY_BINDING}(payload);window.${SLICE_READY_BINDING}(payload);return true;})()`);
              for (let i = 0; i < 50 && reloadReadyWitnesses.length < 2; i++) await sleep(10);
              const duplicate = replacementReadyOutcome(reloadReadyWitnesses, {
                priorToken: 'synthetic-other-token', priorFrameId: priorFrame.frameId,
                priorContextUniqueId: 'synthetic-old-context',
                priorContextGeneration: priorContext.generation - 1,
                expectedUrl: url, expectedOrigin: new URL(url).origin,
                expectedSessionId: session, replacementLoaderId: priorFrame.loaderId,
                releaseAt: 0, commitAt: 0, bootDeadline: Date.now() + 1000,
              });
              if (duplicate.status !== 'failed' || !/2 slice-ready witnesses/.test(duplicate.why || '')) {
                throw new Error(`${vp.label}: duplicate live slice-ready binding control stayed green (${JSON.stringify({ duplicate, rows: reloadReadyWitnesses })})`);
              }
              reloadBindingControlRun = true;
            } finally {
              reloadCaptureArmed = false;
              reloadEvents.length = 0;
              reloadImportPhases.length = 0;
              reloadReleaseWitnesses.length = 0;
              reloadBootPhases.length = 0;
              reloadReadyWitnesses.length = 0;
              reloadTopNavigations.length = 0;
              reloadFatalEvents.length = 0;
              reloadCommands.length = 0;
              reloadBindingReceiptOrdinal = 0;
              requestUrls.clear();
            }
          }
          const phaseId = crypto.randomUUID();
          reloadEvents.length = 0;
          reloadImportPhases.length = 0;
          reloadReleaseWitnesses.length = 0;
          reloadBootPhases.length = 0;
          reloadReadyWitnesses.length = 0;
          reloadTopNavigations.length = 0;
          reloadFatalEvents.length = 0;
          reloadCommands.length = 0;
          reloadBindingReceiptOrdinal = 0;
          requestUrls.clear();
          reloadCaptureArmed = true;
          try {
            const importStartedAt = Date.now();
            const importDeadline = importStartedAt + IMPORT_SETTLE_TIMEOUT_MS;
            const importArm = await runBoundedImportArm({
              send, sessionId: session, importDeadline,
              expression: `(()=>{ const S=window.__CF_SLICE__;
              if(!S?.api?.importBlob||S.documentToken!==${JSON.stringify(priorToken)})return {armed:false,why:'slice/token changed before import arm'};
              const phase={id:${JSON.stringify(phaseId)},status:'import-pending',error:null};
              Object.defineProperty(window,'__CF_GLASS_RELOAD_PHASE__',{value:phase,writable:false,configurable:true});
              try {
                const tickerStarted=!!S.app?.ticker?.started;
                const pending=S.api.importBlob(${JSON.stringify(VETERAN_PREF_RAW)},${JSON.stringify(phaseId)});
                const tickerStopped=S.app?.ticker?.started===false;
                void Promise.resolve(pending).then((error)=>{
                  if(error===null)phase.status='reload-requested';
                  else { phase.status='import-rejected'; phase.error=String(error||'import returned no success'); }
                },(error)=>{ phase.status='import-threw'; phase.error=String(error?.message||error); });
                return {armed:true,token:S.documentToken,phase:{...phase},tickerStarted,tickerStopped};
              } catch(error) { phase.status='import-threw'; phase.error=String(error?.message||error); }
              return {armed:true,token:S.documentToken,phase:{...phase},tickerStarted:!!S.app?.ticker?.started,tickerStopped:false};
            })()`,
            });
            if (importArm.command) reloadCommands.push(importArm.command);
            if (!importArm.ok) {
              throw new Error(`${vp.label}/preference fixture import: ${importArm.why}`);
            }
            const armed = importArm.result.result?.value;
            if (!armed?.armed || armed.token !== priorToken || armed.phase?.id !== phaseId) {
              throw new Error(`${vp.label}/preference fixture import: could not arm observed replacement transaction (${JSON.stringify(armed)})`);
            }
            if (!armed.tickerStarted || !armed.tickerStopped) {
              throw new Error(`${vp.label}/preference fixture import: replacement claim did not synchronously quiesce the outgoing ticker (${JSON.stringify(armed)})`);
            }
            ready = await waitForReload(
              'preference fixture import', priorToken, priorFrame, priorContext,
              phaseId, importDeadline,
            );
            runReloadEvidence.push({ viewport: vp.label, ...ready.reloadEvidence });

          } finally {
            reloadCaptureArmed = false;
            requestUrls.clear();
          }
          await evalIn(`(${installAuditHarness.toString()})()`);
          await waitFor('preference Training', `window.__CF_SLICE__.api.state().tutActive && window.__CF_SLICE__.api.state().codexCount>=3 && document.querySelector('[data-sel=tuttext]')?.textContent?.trim().length>60`);
          add(vp.label, 'training-preferences', await audit({
            ...common, surface: 'training-preferences', root: '#tutcard', textMin: 80,
            required: [{ selector: '[data-sel=tuttext]', min: 1, textMin: 60 }, { selector: '[data-sel=tutskip]', min: 1 }],
            interactiveRoots: ['#tutcard'], contrastSelectors: ['#tutcard'], focusSelectors: ['[data-sel=tutskip]'],
            overlapPairs: [...common.overlapPairs, ['#tutcard', '#dock']],
          }));
          const trainingPreference = await evalIn(`window.__CF_GLASS_AUDIT__.preferenceOutcome('#tutcard','[data-sel=tuttext]','var(--ink)')`);
          addOutcome(vp.label, 'training-preferences', 'PREFERENCE_SURFACE_INERT', '#tutcard [data-sel=tuttext]', trainingPreference,
            'fresh populated Training computes A++ size, Max tone, and Mono font');
        }
        await evalIn(`document.querySelector('[data-sel=tutskip]')?.click()`);
        await waitFor('skip training', `!window.__CF_SLICE__.api.state().tutActive && !document.getElementById('tutcard')`);
        const matrixStart = await evalIn('window.__CF_SLICE__.api.state()');
        if (matrixStart.mode !== 'universe') {
          instrumentFailures.push(`${vp.label}: preference fixture did not return to the universe after Training Skip (${JSON.stringify(matrixStart)})`);
        }
        if (vp.label === 'desktop-8k') {
          /* 8K and 5120×2880 deliberately share an exact 1920×1080
             backing, but not a logical viewport or renderer/EventSystem
             resolution. Exercise the transition only after Training releases
             pointer containment so a genuine CDP pointer event can prove
             Pixi maps client coordinates into the resized stage. */
          const plan8k = expectedDensityPlan(vp);
          const downshiftViewport = { width: 5120, height: 2880, dpr: vp.dpr, mobile: vp.mobile };
          const plan5k = expectedDensityPlan(downshiftViewport);
          if (plan8k.backingWidth !== plan5k.backingWidth
            || plan8k.backingHeight !== plan5k.backingHeight) {
            throw new Error(`${vp.label}: same-backing resize fixture premise drifted (${JSON.stringify({ plan8k, plan5k })})`);
          }
          const expectedTransitionPeakPixels = plan8k.backingWidth * plan8k.backingHeight * 2;
          const expectedTransitionBudgetPixels = Math.max(
            plan8k.backingPixelCapPerCanvas, plan5k.backingPixelCapPerCanvas,
          ) * 2;
          const resizeFrame = await topFrameState();
          const resizeContexts = [...runtimeContexts.values()].filter((row) => row.active
            && row.isDefault && row.frameId === resizeFrame.frameId);
          const resizeContext = resizeContexts.length === 1 ? resizeContexts[0] : null;
          if (!resizeContext?.uniqueId || resizeContext.origin !== new URL(url).origin) {
            throw new Error(`${vp.label}: same-backing resize exact context unavailable (${JSON.stringify({ resizeFrame, resizeContexts })})`);
          }
          const beforeResize = await evalIn('window.__CF_SLICE__.api.state()');
          if (!Number.isInteger(beforeResize.tickerTicks)) {
            throw new Error(`${vp.label}: same-backing resize began without a valid ticker baseline (${JSON.stringify(beforeResize)})`);
          }
          const ultraResizeOutcome = (width, height, plan, priorGeneration, priorTickerTicks) => `(()=>{
            try { const S=window.__CF_SLICE__; if(!S?.api?.state||!S?.app?.canvas||!S?.app?.renderer?.events)
              return {ok:false,error:'slice/app/state/EventSystem unavailable after resize'};
            const s=S.api.state(),c=S.app.canvas,r=c.getBoundingClientRect(),p={x:0,y:0};
            S.app.renderer.events.mapPositionToPoint(p,${width}*.37,${height}*.61);
            return {ok:innerWidth===${width}&&innerHeight===${height}
                &&s?.viewportWidth===${width}&&s?.viewportHeight===${height}
                &&S?.app?.screen?.width===${width}&&S?.app?.screen?.height===${height}
                &&Math.abs((r?.width||0)-${width})<0.5&&Math.abs((r?.height||0)-${height})<0.5
                &&Math.abs((s?.rendererDpr??-1)-${plan.dpr})<1e-12
                &&Math.abs((s?.eventResolution??-1)-${plan.dpr})<1e-12
                &&Math.abs(p.x-${width}*.37)<2&&Math.abs(p.y-${height}*.61)<2
                &&s?.backingPixelCapPerCanvas===${plan.backingPixelCapPerCanvas}
                &&s?.backingWidth===${plan.backingWidth}&&s?.backingHeight===${plan.backingHeight}
                &&s?.backdropBackingWidth===${plan.backingWidth}
                &&s?.backdropBackingHeight===${plan.backingHeight}
                &&s?.combinedBackingPixels===${plan.backingWidth * plan.backingHeight * 2}
                &&Math.abs((s?.backdropLogicalWidth??-1)-${width})<0.01
                &&Math.abs((s?.backdropLogicalHeight??-1)-${height})<0.01
                &&s?.backdropGeneration>${priorGeneration}
                &&S.app.ticker.started===true&&Number.isInteger(s?.tickerTicks)
                &&s.tickerTicks>${priorTickerTicks}
                &&Number.isInteger(s?.backdropTransitionPeakPixels)
                &&Number.isInteger(s?.backdropTransitionBudgetPixels)
                &&s.backdropTransitionPeakPixels===${expectedTransitionPeakPixels}
                &&s.backdropTransitionBudgetPixels===${expectedTransitionBudgetPixels},
              viewport:[innerWidth,innerHeight],reported:[s?.viewportWidth,s?.viewportHeight],
              screen:[S?.app?.screen?.width,S?.app?.screen?.height],rect:[r?.width,r?.height],
              dpr:[s?.rendererDpr,s?.eventResolution],mapped:[p.x,p.y],
              backing:[s?.backingWidth,s?.backingHeight,s?.backdropBackingWidth,s?.backdropBackingHeight],
              backdrop:[s?.backdropLogicalWidth,s?.backdropLogicalHeight,s?.backdropGeneration],
              ticker:[S.app.ticker.started,s?.tickerTicks],
              transition:[s?.backdropTransitionPeakPixels,s?.backdropTransitionBudgetPixels],
              combined:s?.combinedBackingPixels,cap:s?.backingPixelCapPerCanvas};
            } catch(error) { return {ok:false,error:String(error?.message||error)}; } })()`;
          await send('Emulation.setDeviceMetricsOverride', {
            width: downshiftViewport.width, height: downshiftViewport.height,
            deviceScaleFactor: downshiftViewport.dpr, mobile: downshiftViewport.mobile,
          }, session);
          const downshiftObservation = await observeOutcome(ultraResizeOutcome(
            downshiftViewport.width, downshiftViewport.height, plan5k, beforeResize.backdropGeneration,
            beforeResize.tickerTicks,
          ), (value) => value?.ok === true, resizeContext.id, 10000);
          let downshift = downshiftObservation.value || {
            ok: false, why: 'same-backing 5K resize returned no structured product state',
          };
          downshift.settledWithinBound = downshiftObservation.settled;
          if (downshift.ok) {
            const postRenderPriorTicks = downshift.ticker[1];
            const postRenderObservation = await observeOutcome(ultraResizeOutcome(
              downshiftViewport.width, downshiftViewport.height, plan5k,
              beforeResize.backdropGeneration, postRenderPriorTicks,
            ), (value) => value?.ok === true, resizeContext.id, PHASE_PROBE_TIMEOUT_MS, {
              cycle: 2, postRenderPriority: -50, singleAttempt: true,
            });
            downshift.postRender = postRenderObservation.value;
            downshift.postRenderCommands = postRenderObservation.commands;
            downshift.ok = postRenderObservation.settled && postRenderObservation.value?.ok === true;
          }
          const pointerArm = await observeOutcome(`(()=>{try{const S=window.__CF_SLICE__;
            if(!S?.app?.stage?.once)return {ok:false,error:'stage pointer wiring unavailable'};
            window.__CF_ULTRA_POINTER__=null;S.app.stage.once('globalpointermove',
              (event)=>{window.__CF_ULTRA_POINTER__={x:event.global.x,y:event.global.y};});
            return {ok:true};}catch(error){return {ok:false,error:String(error?.message||error)};}})()`,
          () => true, resizeContext.id, PHASE_PROBE_TIMEOUT_MS);
          const pointerX = downshiftViewport.width * 0.53, pointerY = downshiftViewport.height * 0.47;
          let pointerObservation = { settled: false, value: null, commands: [] };
          if (pointerArm.value?.ok) {
            await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pointerX, y: pointerY,
              button: 'none' }, session);
            pointerObservation = await observeOutcome(
              `(()=>{try{return window.__CF_ULTRA_POINTER__||null;}catch(error){return {error:String(error?.message||error)};}})()`,
              (value) => Number.isFinite(value?.x) && Number.isFinite(value?.y),
              resizeContext.id, 5000,
            );
          }
          const pointerResult = ultraPointerOutcome(pointerObservation.value, pointerX, pointerY);
          downshift = combineUltraResizePointerOutcome(downshift, pointerResult);
          downshift.pointerArm = pointerArm.value;
          downshift.pointerSettledWithinBound = pointerObservation.settled;
          addOutcome(vp.label, 'ultra-same-backing-resize', 'ULTRA_VIEWPORT_RESIZE_STALE', 'canvas', downshift,
            'a same-backing 8K→5K transition updates DPR, EventSystem mapping, CSS, Pixi screen, pointer hit geometry and the logical backdrop atomically');
          let resizeControlsDiscriminated = false;
          if (downshift.ok) {
            const injectedOutcome = async (expression) => (await observeOutcome(
              expression, () => true, resizeContext.id, PHASE_PROBE_TIMEOUT_MS,
            )).value;
            const staleGeometryControl = await injectedOutcome(`(()=>{ let c=null,priorStyle=null,priorScreen=null;
              try { const S=window.__CF_SLICE__;c=S.app.canvas;priorStyle=c.style.width;priorScreen=S.app.screen.width;
                c.style.width='4000px';S.app.screen.width=4000;
                const controlApplied=c.style.width==='4000px'&&S.app.screen.width===4000;
                const outcome=${ultraResizeOutcome(downshiftViewport.width, downshiftViewport.height, plan5k, beforeResize.backdropGeneration, beforeResize.tickerTicks)};
                c.style.width=priorStyle;S.app.screen.width=priorScreen;
                return {controlApplied,restored:c.style.width===priorStyle&&S.app.screen.width===priorScreen,outcome};
              } catch(error) { if(c&&priorStyle!==null)c.style.width=priorStyle;if(window.__CF_SLICE__&&priorScreen!==null)window.__CF_SLICE__.app.screen.width=priorScreen;
                return {controlApplied:false,restored:false,outcome:null,error:String(error?.message||error)}; } })()`);
            const staleEventControl = await injectedOutcome(`(()=>{ let events=null,prior=null;
              try { const S=window.__CF_SLICE__;events=S.app.renderer.events;prior=events.resolution;
                events.resolution=${plan8k.dpr};const controlApplied=Math.abs(events.resolution-${plan8k.dpr})<1e-12;
                const outcome=${ultraResizeOutcome(downshiftViewport.width, downshiftViewport.height, plan5k, beforeResize.backdropGeneration, beforeResize.tickerTicks)};
                events.resolution=prior;return {controlApplied,restored:events.resolution===prior,outcome};
              } catch(error) { if(events&&prior!==null)events.resolution=prior;
                return {controlApplied:false,restored:false,outcome:null,error:String(error?.message||error)}; } })()`);
            const staleBackdropControl = await injectedOutcome(`(()=>{ let S=null,prior=null;
              try { S=window.__CF_SLICE__;prior=S.api.state;
                S.api.state=()=>({...prior(),backdropLogicalWidth:${vp.width},backdropGeneration:${beforeResize.backdropGeneration}});
                const controlApplied=S.api.state!==prior;
                const outcome=${ultraResizeOutcome(downshiftViewport.width, downshiftViewport.height, plan5k, beforeResize.backdropGeneration, beforeResize.tickerTicks)};
                S.api.state=prior;return {controlApplied,restored:S.api.state===prior,outcome};
              } catch(error) { if(S&&prior)S.api.state=prior;
                return {controlApplied:false,restored:false,outcome:null,error:String(error?.message||error)}; } })()`);
            const transitionPeakControl = await injectedOutcome(`(()=>{ let S=null,prior=null;
              try { S=window.__CF_SLICE__;prior=S.api.state;
                S.api.state=()=>{const s=prior();return {...s,backdropTransitionPeakPixels:s.backdropTransitionBudgetPixels+1};};
                const controlApplied=S.api.state().backdropTransitionPeakPixels===S.api.state().backdropTransitionBudgetPixels+1;
                const outcome=${ultraResizeOutcome(downshiftViewport.width, downshiftViewport.height, plan5k, beforeResize.backdropGeneration, beforeResize.tickerTicks)};
                S.api.state=prior;return {controlApplied,restored:S.api.state===prior,outcome};
              } catch(error) { if(S&&prior)S.api.state=prior;
                return {controlApplied:false,restored:false,outcome:null,error:String(error?.message||error)}; } })()`);
            const transitionUnderreportControl = await injectedOutcome(`(()=>{ let S=null,prior=null;
              try { S=window.__CF_SLICE__;prior=S.api.state;
                S.api.state=()=>{const s=prior();return {...s,backdropTransitionPeakPixels:${expectedTransitionPeakPixels - 1}};};
                const controlApplied=S.api.state().backdropTransitionPeakPixels===${expectedTransitionPeakPixels - 1};
                const outcome=${ultraResizeOutcome(downshiftViewport.width, downshiftViewport.height, plan5k, beforeResize.backdropGeneration, beforeResize.tickerTicks)};
                S.api.state=prior;return {controlApplied,restored:S.api.state===prior,outcome};
              } catch(error) { if(S&&prior)S.api.state=prior;
                return {controlApplied:false,restored:false,outcome:null,error:String(error?.message||error)}; } })()`);
            const transitionInflatedBudgetControl = await injectedOutcome(`(()=>{ let S=null,prior=null;
              try { S=window.__CF_SLICE__;prior=S.api.state;
                S.api.state=()=>{const s=prior();return {...s,backdropTransitionBudgetPixels:${expectedTransitionBudgetPixels + 1}};};
                const controlApplied=S.api.state().backdropTransitionBudgetPixels===${expectedTransitionBudgetPixels + 1};
                const outcome=${ultraResizeOutcome(downshiftViewport.width, downshiftViewport.height, plan5k, beforeResize.backdropGeneration, beforeResize.tickerTicks)};
                S.api.state=prior;return {controlApplied,restored:S.api.state===prior,outcome};
              } catch(error) { if(S&&prior)S.api.state=prior;
                return {controlApplied:false,restored:false,outcome:null,error:String(error?.message||error)}; } })()`);
            const stoppedTickerControl = await injectedOutcome(`(()=>{ let ticker=null,wasStarted=false;
              try { const S=window.__CF_SLICE__;ticker=S.app.ticker;wasStarted=ticker.started;ticker.stop();
                const controlApplied=ticker.started===false;
                const outcome=${ultraResizeOutcome(downshiftViewport.width, downshiftViewport.height, plan5k, beforeResize.backdropGeneration, beforeResize.tickerTicks)};
                if(wasStarted)ticker.start();return {controlApplied,restored:ticker.started===wasStarted,outcome};
              } catch(error) { if(ticker&&wasStarted)ticker.start();
                return {controlApplied:false,restored:false,outcome:null,error:String(error?.message||error)}; } })()`);
            const staleTickerControl = await injectedOutcome(`(()=>{ let S=null,prior=null;
              try { S=window.__CF_SLICE__;prior=S.api.state;
                S.api.state=()=>({...prior(),tickerTicks:${beforeResize.tickerTicks}});
                const controlApplied=S.api.state().tickerTicks===${beforeResize.tickerTicks};
                const outcome=${ultraResizeOutcome(downshiftViewport.width, downshiftViewport.height, plan5k, beforeResize.backdropGeneration, beforeResize.tickerTicks)};
                S.api.state=prior;return {controlApplied,restored:S.api.state===prior,outcome};
              } catch(error) { if(S&&prior)S.api.state=prior;
                return {controlApplied:false,restored:false,outcome:null,error:String(error?.message||error)}; } })()`);
            const missingPointerControl = combineUltraResizePointerOutcome(
              { ...downshift, ok: true }, ultraPointerOutcome(null, pointerX, pointerY),
            );
            const offsetPointerControl = combineUltraResizePointerOutcome(
              { ...downshift, ok: true }, ultraPointerOutcome({ x: pointerX + 20, y: pointerY }, pointerX, pointerY),
            );
            const injectedControls = ultraResizeInjectionControlsOutcome([
              staleGeometryControl, staleEventControl, staleBackdropControl, transitionPeakControl,
              transitionUnderreportControl, transitionInflatedBudgetControl,
              stoppedTickerControl, staleTickerControl,
            ]);
            if (!injectedControls.ok || missingPointerControl.ok || offsetPointerControl.ok) {
              instrumentFailures.push(`${vp.label}: same-backing resize injection stayed green (${JSON.stringify({ staleGeometryControl, staleEventControl, staleBackdropControl, transitionPeakControl, transitionUnderreportControl, transitionInflatedBudgetControl, stoppedTickerControl, staleTickerControl, missingPointerControl, offsetPointerControl })})`);
            } else {
              resizeControlsDiscriminated = true;
            }
          }
          const downshiftGeneration = Number.isInteger(downshift?.backdrop?.[2])
            ? downshift.backdrop[2] : beforeResize.backdropGeneration;
          const downshiftTickerTicks = Number.isInteger(downshift?.postRender?.ticker?.[1])
            ? downshift.postRender.ticker[1]
            : Number.isInteger(downshift?.ticker?.[1]) ? downshift.ticker[1] : beforeResize.tickerTicks;
          await send('Emulation.setDeviceMetricsOverride', {
            width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr, mobile: vp.mobile,
          }, session);
          const restoreObservation = await observeOutcome(ultraResizeOutcome(
            vp.width, vp.height, plan8k, downshiftGeneration, downshiftTickerTicks,
          ), (value) => value?.ok === true, resizeContext.id, 10000);
          const restored = restoreObservation.value || {
            ok: false, why: 'same-backing 8K restore returned no structured product state',
          };
          restored.settledWithinBound = restoreObservation.settled;
          if (restored.ok) {
            const postRenderPriorTicks = restored.ticker[1];
            const postRenderObservation = await observeOutcome(ultraResizeOutcome(
              vp.width, vp.height, plan8k, downshiftGeneration, postRenderPriorTicks,
            ), (value) => value?.ok === true, resizeContext.id, PHASE_PROBE_TIMEOUT_MS, {
              cycle: 2, postRenderPriority: -50, singleAttempt: true,
            });
            restored.postRender = postRenderObservation.value;
            restored.postRenderCommands = postRenderObservation.commands;
            restored.ok = postRenderObservation.settled && postRenderObservation.value?.ok === true;
          }
          addOutcome(vp.label, 'ultra-same-backing-resize', 'ULTRA_VIEWPORT_RESIZE_NOT_RESTORED', 'canvas', restored,
            'restoring 8K restores its exact DPR, pointer mapping, CSS/Pixi screen and a fresh logical backdrop');
          const resizeControlOutcome = ultraControlExecutionOutcome({
            downshift, restored, controlsDiscriminated: resizeControlsDiscriminated,
          });
          if (resizeControlOutcome.executed) {
            recordControls('ultra-same-backing-resize');
          } else if (resizeControlOutcome.blocked) {
            productBlockedControls.set('ultra-same-backing-resize', {
              name: 'ultra-same-backing-resize', viewport: vp.label,
              findingCode: resizeControlOutcome.findingCode,
            });
          } else {
            instrumentFailures.push(`${vp.label}: same-backing resize controls did not discriminate from green positive baselines`);
          }
        }

        /* Synthetic controls must run outside Training's real focus scope.
           Running them on the welcome lesson makes the product correctly
           redirect their focus and turns the instrument red for the wrong
           reason. The real Training surface is audited above before Skip. */
        if (!controlsRun) {
          controlsRun = true;
          const controlFailures = await evalIn('window.__CF_GLASS_AUDIT__.selftest()');
          for (const failure of controlFailures) instrumentFailures.push('SELFTEST ' + failure);
          recordControls(
            'target-floor', 'visible-focus', 'accessible-name', 'keyboard-reachability',
            'centre-hit-test', 'text-contrast', 'glass-fallback', 'populated-copy',
            'viewport-fit', 'safe-area-override', 'viewport-metrics', 'surface-overlap',
            'scene-transform-delta', 'non-glass-background-chain', 'preference-computed-outcome',
            'settings-pressed-focus', 'guide-render-focus', 'motion-css-policy',
            'ordinary-panel-centre-close', 'opener-expanded-controls', 'dock-toggle-pressed',
            'survey-expanded-controls', 'pseudo-placeholder-contrast', 'cumulative-opacity-contrast',
            'typography-no-shrink-hierarchy', 'panel-open-focus', 'clipped-without-scroll',
          );
          const canvasBaseline = await evalIn(`window.__CF_GLASS_AUDIT__.canvasIssues('selftest',${expectedDpr},${maxBackingPixels})`);
          if (canvasBaseline.some((row) => row.code === 'CANVAS_CSS_VIEWPORT'
            || row.code === 'CANVAS_DPR_DRIFT' || row.code === 'RENDERER_DPR_CONTRACT')) {
            instrumentFailures.push(`SELFTEST canvas baseline was already red (${JSON.stringify(canvasBaseline)})`);
          }
          const canvasControl = await evalIn(`(()=>{ const canvas=document.querySelector('canvas'),prior=[canvas.style.width,canvas.style.height]; canvas.style.width=Math.max(100,innerWidth/2)+'px';const out=window.__CF_GLASS_AUDIT__.canvasIssues('selftest',${expectedDpr},${maxBackingPixels});canvas.style.width=prior[0];canvas.style.height=prior[1];return out;})()`);
          if (!canvasControl.some((row) => row.code === 'CANVAS_CSS_VIEWPORT')) instrumentFailures.push('SELFTEST injected narrow CSS canvas was accepted');
          if (!canvasControl.some((row) => row.code === 'CANVAS_DPR_DRIFT')) instrumentFailures.push('SELFTEST injected backing/CSS density drift was accepted');
          recordControls('canvas-css-fit', 'canvas-backing-density');
          const backingControl = await evalIn(`(()=>{ const c=document.querySelector('canvas'); return window.__CF_GLASS_AUDIT__.canvasIssues('selftest',window.__CF_SLICE__.api.state().rendererDpr,c.width*c.height-1); })()`);
          if (!backingControl.some((row) => row.code === 'CANVAS_BACKING_PIXEL_CEILING')) instrumentFailures.push('SELFTEST injected backing-pixel ceiling was accepted');
          recordControls('backing-pixel-ceiling');
        }

        add(vp.label, 'hud', await audit({
          ...common, surface: 'hud', root: 'body', textMin: 20,
          required: [{ selector: '#dock', min: 1 }, { selector: '#searchbox', min: 1 }, { selector: '#hintpill', min: 1, textMin: 8 }],
          interactiveRoots: ['#dock', '#raillft', '#railrgt', '#searchbox'],
          contrastSelectors: ['#playerchip', '#hpbar', '#searchbox', '#trail', '#objchip', '#ctxbar', '#hintpill', '#raillft button', '#railrgt button'],
          placeholderSelectors: ['#searchbox'], maxContrastReports: 24,
          focusSelectors: vp.label === 'primary-phone' || vp.label === 'desktop' ? ['#searchbox', '#dockguide', '#docksets'] : [],
          canvas: true, expectedDpr, maxBackingPixels,
        }));
        const hpLabelCheck = `(()=>{ const track=document.querySelector('#hpbar .track'),fill=document.querySelector('#hpbar .fill'),txt=document.querySelector('#hpbar .txt');
          if(!track||!fill||!txt)return {ok:false,why:'missing'};
          const tr=track.getBoundingClientRect(),xr=txt.getBoundingClientRect(),s=getComputedStyle(txt);
          const parseAll=(v)=>[...String(v).matchAll(/rgba?\\(\\s*([\\d.]+)[, ]+([\\d.]+)[, ]+([\\d.]+)(?:\\s*[,/]\\s*([\\d.]+))?/gi)]
            .map(m=>[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]);
          const parse=(v)=>parseAll(v)[0]||null;
          const comp=(f,b)=>{const a=f[3]+b[3]*(1-f[3]);return [0,1,2].map(i=>(f[i]*f[3]+b[i]*b[3]*(1-f[3]))/a).concat(a)};
          const lum=(c)=>{const q=c.slice(0,3).map(n=>{const v=n/255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*q[0]+.7152*q[1]+.0722*q[2]};
          const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
          const fg=parse(s.color),label=parse(s.backgroundColor),trackBg=parse(getComputedStyle(track).backgroundColor),
            fillStyle=getComputedStyle(fill),fillStops=parseAll(fillStyle.backgroundImage),fillBg=parse(fillStyle.backgroundColor),
            backgrounds=[trackBg,...(fillStops.length?fillStops:[fillBg])].filter(Boolean),
            composites=label?backgrounds.map(bg=>comp(label,bg)):[],ratios=fg?composites.map(bg=>ratio(fg,bg)):[];
          const contained=xr.left>=tr.left-1&&xr.top>=tr.top-1&&xr.right<=tr.right+1&&xr.bottom<=tr.bottom+1;
          return {ok:contained&&ratios.length>=3&&ratios.every(v=>v>=4.5),contained,ratios:ratios.map(v=>Math.round(v*100)/100),
            txt:[xr.left,xr.top,xr.right,xr.bottom],track:[tr.left,tr.top,tr.right,tr.bottom],color:s.color,background:s.backgroundColor}; })()`;
        addOutcome(vp.label, 'hud-hp', 'HP_LABEL_CONTRAST_OR_GEOMETRY', '#hpbar .txt', await evalIn(hpLabelCheck),
          'HP label remains inside the track and meets 4.5:1 over both filled and unfilled regions');
        if (!hpControlRun) {
          hpControlRun = true;
          const hpControl = await evalIn(`(()=>{ const txt=document.querySelector('#hpbar .txt'),prior=[txt.style.color,txt.style.backgroundColor];
            txt.style.setProperty('color','rgb(63,174,82)','important');txt.style.setProperty('background-color','transparent','important');
            const result=${hpLabelCheck};txt.style.color=prior[0];txt.style.backgroundColor=prior[1];return result;})()`);
          if (hpControl.ok) instrumentFailures.push(`${vp.label}: HP dual-background contrast injection stayed green (${JSON.stringify(hpControl)})`);
          recordControls('hp-label-dual-background');
        }
        const hudState = await evalIn('window.__CF_SLICE__.api.state()');
        addOutcome(vp.label, 'hud-controls', 'DOCK_CHARTS_PRESSED_STATE', '#dockcharts',
          await evalIn(`window.__CF_GLASS_AUDIT__.pressedOutcome('#dockcharts',${JSON.stringify(hudState.chartsOn)})`),
          'aria-pressed exactly mirrors the real star-chart state');
        addOutcome(vp.label, 'hud-controls', 'SURVEY_DISCLOSURE_STATE', '#docksurvey',
          await evalIn(`window.__CF_GLASS_AUDIT__.openerOutcome('#docksurvey','#survey',false)`),
          'aria-controls names the real survey and aria-expanded is false while it is closed');
        add(vp.label, `dockcharts-${hudState.chartsOn ? 'on' : 'off'}`, await audit({
          surface: `dockcharts-${hudState.chartsOn ? 'on' : 'off'}`, root: '#dockcharts', textMin: 1, targetFloor,
          safe: vp.safe || {}, safeExpected: vp.safe || undefined,
          viewportExpected: { width: vp.width, height: vp.height, dpr: vp.dpr }, fitSelectors: ['#dockcharts'],
          interactiveRoots: ['#dockcharts'], contrastSelectors: ['#dockcharts'], overlapPairs: [],
        }));
        const toggledCharts = !hudState.chartsOn;
        await evalIn(`document.getElementById('dockcharts')?.click()`);
        await waitFor('chart toggle', `window.__CF_SLICE__.api.state().chartsOn===${JSON.stringify(toggledCharts)}`);
        addOutcome(vp.label, 'hud-controls', 'DOCK_CHARTS_PRESSED_STATE', '#dockcharts',
          await evalIn(`window.__CF_GLASS_AUDIT__.pressedOutcome('#dockcharts',${JSON.stringify(toggledCharts)})`),
          'aria-pressed updates after the real star-chart toggle');
        add(vp.label, `dockcharts-${toggledCharts ? 'on' : 'off'}`, await audit({
          surface: `dockcharts-${toggledCharts ? 'on' : 'off'}`, root: '#dockcharts', textMin: 1, targetFloor,
          safe: vp.safe || {}, safeExpected: vp.safe || undefined,
          viewportExpected: { width: vp.width, height: vp.height, dpr: vp.dpr }, fitSelectors: ['#dockcharts'],
          interactiveRoots: ['#dockcharts'], contrastSelectors: ['#dockcharts'], overlapPairs: [],
        }));
        await evalIn(`document.getElementById('dockcharts')?.click()`);
        await waitFor('chart toggle restore', `window.__CF_SLICE__.api.state().chartsOn===${JSON.stringify(hudState.chartsOn)}`);
        recordControls('control-on-off-contrast');

        if (vp.label === 'primary-phone' || vp.label === 'desktop') {
          const keyboardStart = await evalIn(`(()=>{ const canvas=document.querySelector('canvas'); canvas.focus(); const ev=(key)=>canvas.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})); ev('ArrowRight'); const S=window.__CF_SLICE__,ring=document.getElementById('cosmosfocus'),live=document.getElementById('cosmoslive'); return {focused:document.activeElement===canvas,target:S.api.state().keyboardTarget,ringDisplay:getComputedStyle(ring).display,ringText:ring.textContent,live:live.textContent}; })()`);
          if (!keyboardStart.focused || !keyboardStart.target || keyboardStart.ringDisplay === 'none' || keyboardStart.live.length < 20) {
            findings.push({ context: { viewport: vp.label, surface: 'keyboard-canvas' }, row: { code: 'KEYBOARD_TARGET_NOT_RENDERED', surface: 'keyboard-canvas', element: 'canvas', actual: keyboardStart, expected: 'focus + Arrow selects and visibly/verbally announces a world target' } });
          }
          const keyboardSurvey = await evalIn(`(()=>{ const before=window.__CF_SLICE__.api.state(); const canvas=document.querySelector('canvas'); canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})); const after=window.__CF_SLICE__.api.state(); return {beforeTarget:before.keyboardTarget,cardOpen:after.cardOpen,cardTitle:after.cardTitle,focus:document.activeElement?.getAttribute('data-act')||document.activeElement?.id||document.activeElement?.tagName}; })()`);
          if (!keyboardSurvey.beforeTarget || !keyboardSurvey.cardOpen || !keyboardSurvey.cardTitle || keyboardSurvey.focus !== 'travel') {
            findings.push({ context: { viewport: vp.label, surface: 'keyboard-canvas' }, row: { code: 'KEYBOARD_ENTER_OUTCOME', surface: 'keyboard-canvas', element: 'canvas', actual: keyboardSurvey, expected: 'Enter opens selected survey and focuses its real travel action' } });
          }
          await evalIn(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})); document.getElementById('searchbox')?.blur()`);
        }

        /* A real Charter rejection populates the toast; it must not be an
           empty fixture that collapses away from the geometry under test. */
        /* toast() intentionally ignores the first 1.8 seconds of a document;
           wait past that product rule instead of calling a helper directly. */
        await sleep(1900);
        const blocked = await evalIn(`(()=>{ const S=window.__CF_SLICE__; const entered=S.api.descendGalaxy(999); S.api.descendSystem({seed:31337,x:300,y:300}); return {entered,state:S.api.state()}; })()`);
        if (!blocked.entered || blocked.state.mode !== 'galaxy' || blocked.state.gal !== 999) {
          instrumentFailures.push(`${vp.label}: could not enter the home galaxy to populate the toast (${JSON.stringify(blocked)})`);
        }
        try { await waitFor('charter toast', `window.__CF_SLICE__.api.state().toastOn && Number(getComputedStyle(document.getElementById('toast')).opacity)>0.1 && document.getElementById('toast')?.textContent?.trim().length>20`); }
        catch (error) { instrumentFailures.push(error.message); }
        add(vp.label, 'toast', await audit({
          ...common, surface: 'toast', root: '#toast', textMin: 20, fitSelectors: ['#toast'],
          interactiveRoots: [], contrastSelectors: ['#toast'], overlapPairs: [['#toast', '#dock']],
        }));
        if (vp.width > 900) {
          addOutcome(vp.label, 'toast', 'DESKTOP_UTILITY_ANCHOR', '#toast',
            await evalIn(`window.__CF_GLASS_AUDIT__.rightBottomAnchorOutcome('#toast')`),
            'desktop notifications share the measured bottom-right utility edge above the dock');
          if (!toastAnchorControlRun) {
            toastAnchorControlRun = true;
            const leftToastControl = await evalIn(`(()=>{ const toast=document.getElementById('toast'),prior=toast.getAttribute('style');
              toast.style.setProperty('left','12px','important');toast.style.setProperty('right','auto','important');
              const result=window.__CF_GLASS_AUDIT__.rightBottomAnchorOutcome('#toast');
              if(prior===null)toast.removeAttribute('style');else toast.setAttribute('style',prior);return result;})()`);
            if (leftToastControl.ok || !Array.isArray(leftToastControl.rect)
              || Math.abs(leftToastControl.rect[0] - 12) > 2) {
              instrumentFailures.push(`${vp.label}: injected left-anchored toast stayed on the bottom-right utility edge (${JSON.stringify(leftToastControl)})`);
            }
            /* The standing viewport-fit control now also owns the reported
               side-anchor regression; keep the sealed 57-name inventory. */
            recordControls('viewport-fit');
          }
        }

        /* Populate the real Earth survey and Planetside strip through the
           same public browser-audit API used by the standing smoke journey. */
        const surveyReady = await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.api.descendSystem({seed:424242,x:560,y:170}); return S.api.surveyOn(2); })()`);
        if (!surveyReady) instrumentFailures.push(`${vp.label}: could not populate the Earth survey`);
        /* The rich veteran fixture intentionally preserves custom names, so
           Earth may be labelled Homeworld. surveyOn(2) already selects the
           deterministic Sol body; bind readiness to its real Land action
           and exact system rather than erasing or rejecting player naming. */
        await waitFor('Earth survey', `(()=>{ const s=window.__CF_SLICE__.api.state(); return s.mode==='system'&&s.star===424242&&s.cardOpen&&!!document.querySelector('#survey [data-act="landcta"]'); })()`);
        const chromeYieldCheck = `(()=>{ const ids=['trail','objchip'],rows=ids.map(id=>{const el=document.getElementById(id);
          return {id,text:(el?.textContent||'').trim(),display:el?getComputedStyle(el).display:'missing'};});
          return {ok:rows.every(r=>r.text.length>0&&r.display==='none'),rows}; })()`;
        addOutcome(vp.label, 'survey-chrome-yield', 'MOBILE_CHROME_NOT_YIELDED', '#trail,#objchip', await evalIn(chromeYieldCheck),
          'opening a survey yields the mobile trail and objective instead of painting the card over them');
        if (!chromeYieldControlRun) {
          chromeYieldControlRun = true;
          const yieldControl = await evalIn(`(()=>{ const el=document.getElementById('trail'),prior=el.getAttribute('style');
            el.style.setProperty('display','block','important');const result=${chromeYieldCheck};
            if(prior===null)el.removeAttribute('style');else el.setAttribute('style',prior);return result;})()`);
          if (yieldControl.ok) instrumentFailures.push(`${vp.label}: visible trail-under-survey injection stayed green (${JSON.stringify(yieldControl)})`);
        }
        addOutcome(vp.label, 'survey', 'SURVEY_DISCLOSURE_STATE', '#docksurvey',
          await evalIn(`window.__CF_GLASS_AUDIT__.openerOutcome('#docksurvey','#survey',true)`),
          'aria-controls names the real survey and aria-expanded is true while it is open');
        addOutcome(vp.label, 'survey', 'SURVEY_CLOSE_INTEGRITY', '#survey [data-survey-close]',
          await evalIn(`window.__CF_GLASS_AUDIT__.closeIntegrityOutcome('#survey','[data-survey-close]','[data-pnx]')`),
          'the survey owns exactly one reachable top-right close and no generic panel close');
        const surveyDisclosure = await evalIn(`(()=>{ const S=window.__CF_SLICE__,card=document.getElementById('survey'),
          landed=S.api.state().save.landed.includes(133),rarity=[...card.querySelectorAll('[data-row="Rarity"]')],
          spectral=card.querySelectorAll('[data-row="Spectral class"]'),label=(rarity[0]?.querySelector('span')?.textContent||'').trim();
          return {ok:spectral.length===0&&rarity.length===(landed?1:0)&&(!landed||label==='Rarity'),landed,
            rarityCount:rarity.length,spectralCount:spectral.length,label};})()`);
        addOutcome(vp.label, 'survey', 'SURVEY_RARITY_DISCLOSURE', '#survey [data-row]', surveyDisclosure,
          'player-facing survey hides internal Spectral class and shows one plain Rarity row only after planetfall');
        if (!closeIntegrityControlRun) {
          closeIntegrityControlRun = true;
          const duplicateCloseControl = await evalIn(`(()=>{ const card=document.getElementById('survey'),extra=document.createElement('button');
            extra.dataset.pnx='legacy-survey';extra.className='surface-close panel-close';extra.textContent='✕';
            extra.style.cssText='position:fixed;left:0;top:0;right:auto;bottom:auto';card.appendChild(extra);
            const result=window.__CF_GLASS_AUDIT__.closeIntegrityOutcome('#survey','[data-survey-close]','[data-pnx]');extra.remove();return result;})()`);
          if (duplicateCloseControl.ok || duplicateCloseControl.forbiddenCount !== 1) {
            instrumentFailures.push(`${vp.label}: injected generic duplicate/upper-left survey close stayed green (${JSON.stringify(duplicateCloseControl)})`);
          }
          const misplacedCloseControl = await evalIn(`(()=>{ const close=document.querySelector('#survey [data-survey-close]'),prior=close.getAttribute('style');
            close.style.setProperty('position','fixed','important');close.style.setProperty('left','0','important');
            close.style.setProperty('top','0','important');close.style.setProperty('right','auto','important');close.style.setProperty('margin','0','important');
            const result=window.__CF_GLASS_AUDIT__.closeIntegrityOutcome('#survey','[data-survey-close]','[data-pnx]');
            if(prior===null)close.removeAttribute('style');else close.setAttribute('style',prior);return result;})()`);
          if (misplacedCloseControl.ok || misplacedCloseControl.topRight) {
            instrumentFailures.push(`${vp.label}: injected upper-left survey close stayed green (${JSON.stringify(misplacedCloseControl)})`);
          }
          /* Extend the existing close control rather than growing the sealed
             57-name inventory: it now rejects duplicates and bad corners. */
          recordControls('ordinary-panel-centre-close');
        }
        add(vp.label, 'survey', await audit({
          ...common, surface: 'survey', root: '#survey', textMin: 80,
          required: [{ selector: '[data-sel=title]', min: 1, textMin: 5 }, { selector: '[data-row]', min: 3 },
            { selector: '[data-survey-close]', min: 1 }, { selector: '[data-act=landcta]', min: 1 }],
          interactiveRoots: ['#survey'], contrastSelectors: ['#survey'], overlapPairs: [['#survey', '#dock']],
        }));
        await evalIn('window.__CF_SLICE__.api.landHere()');
        await waitFor('Planetside', `window.__CF_SLICE__.api.state().mode==='surface' && document.getElementById('planetside')?.textContent?.trim().length>20`, 10000);
        add(vp.label, 'planetside', await audit({
          ...common, surface: 'planetside', root: '#planetside', textMin: 20,
          required: [{ selector: '[data-sel=planetside-sp]', min: 1 }], interactiveRoots: [], contrastSelectors: ['#planetside'],
          overlapPairs: [['#planetside', '#ctxbar'], ['#planetside', '#hintpill'], ['#planetside', '#dock']],
        }));
        const planetsideOwnershipCheck = `(()=>{ const side=document.getElementById('planetside'),survey=document.getElementById('survey'),
          specimen=side?.querySelector('[data-sel=planetside-sp]'); if(!side||!survey||!specimen)return {ok:false,why:'missing'};
          const a=side.getBoundingClientRect(),b=survey.getBoundingClientRect(),p=specimen.getBoundingClientRect();
          const overlap=a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
          const left=Math.max(a.left,p.left),right=Math.min(a.right,p.right),top=Math.max(a.top,p.top),bottom=Math.min(a.bottom,p.bottom),
            visibleIntersection=right-left>2&&bottom-top>2,x=(left+right)/2,y=(top+bottom)/2;
          const hit=document.elementFromPoint(x,y),owned=!!hit&&side.contains(hit);
          return {ok:!overlap&&visibleIntersection&&owned,overlap,visibleIntersection,owned,hit:hit?.id||hit?.getAttribute?.('data-sel')||hit?.tagName||null,
            side:[a.left,a.top,a.right,a.bottom],survey:[b.left,b.top,b.right,b.bottom],specimen:[p.left,p.top,p.right,p.bottom],point:[x,y]}; })()`;
        addOutcome(vp.label, 'planetside', 'PLANETSIDE_SURFACE_OCCLUDED', '#planetside', await evalIn(planetsideOwnershipCheck),
          'the populated living-world strip does not overlap the open survey and owns a representative rendered point');
        if (!planetsideControlRun) {
          planetsideControlRun = true;
          const shieldControl = await evalIn(`(()=>{ const side=document.getElementById('planetside'),p=side.querySelector('[data-sel=planetside-sp]').getBoundingClientRect(),
            shield=document.createElement('div');shield.id='cf-planetside-shield';Object.assign(shield.style,{position:'fixed',left:p.left+'px',top:p.top+'px',width:p.width+'px',height:p.height+'px',zIndex:'9999',pointerEvents:'auto'});document.body.appendChild(shield);
            const result=${planetsideOwnershipCheck};shield.remove();return result;})()`);
          if (shieldControl.ok) instrumentFailures.push(`${vp.label}: Planetside hit-ownership shield injection stayed green (${JSON.stringify(shieldControl)})`);
          const overlapControl = await evalIn(`(()=>{ const side=document.getElementById('planetside'),survey=document.getElementById('survey'),
            a=side.getBoundingClientRect(),b=survey.getBoundingClientRect(),prior=side.style.transform;
            side.style.transform='translate('+(b.left-a.left)+'px,'+(b.top-a.top)+'px)';const result=${planetsideOwnershipCheck};side.style.transform=prior;return result;})()`);
          if (overlapControl.ok) instrumentFailures.push(`${vp.label}: Planetside/survey overlap injection stayed green (${JSON.stringify(overlapControl)})`);
          recordControls('planetside-surface-ownership');
        }
        const planetsidePreference = await evalIn(`window.__CF_GLASS_AUDIT__.preferenceOutcome('#planetside','#planetside > div:first-child','var(--dim)')`);
        addOutcome(vp.label, 'planetside-preferences', 'PREFERENCE_SURFACE_INERT', '#planetside > div:first-child', planetsidePreference,
          'populated Planetside computes A++ size, Max tone, and Mono font without shrinking text or flattening hierarchy');
        const chromePreference = await evalIn(`window.__CF_GLASS_AUDIT__.preferenceOutcome('body','#hintpill','var(--ink)')`);
        addOutcome(vp.label, 'top-chrome-preferences', 'PREFERENCE_SURFACE_INERT', '#hintpill', chromePreference,
          'top chrome computes A++ size, Max tone, and Mono font without shrinking text or flattening hierarchy');
        if (vp.width > 900) {
          const railPreference = await evalIn(`window.__CF_GLASS_AUDIT__.preferenceOutcome('#raillft','#railcharters','var(--ink)')`);
          addOutcome(vp.label, 'rail-preferences', 'PREFERENCE_SURFACE_INERT', '#railcharters', railPreference,
            'desktop rail label computes A++ size, Max tone, and Mono font without shrinking text or flattening hierarchy');
        }

        /* Every ordinary panel is deliberately exercised with populated real
           data. Left-rail desktop panels and all phone dock panels remain over
           Survey; the desktop right rail is intentionally reached after the
           card yields it. Both compositions prove geometry and focus. */
        const ordinaryPanels = [
          { id: 'codex', name: 'compendium', dock: '#dockcodex', rail: '#railcodex', panel: '#codexpanel', required: '[data-sel=codex-entry]', min: 1, textMin: 80 },
          { id: 'rec', name: 'records', dock: '#dockrecords', rail: '#railrecords', panel: '#recpanel', required: '#recpanel .row', min: 6, textMin: 80 },
          { id: 'atlas', name: 'atlas', dock: '#dockatlas', rail: '#railatlas', panel: '#atlaspanel', required: '[data-sel=atlas-entry]', min: 1, textMin: 25 },
          { id: 'ch', name: 'charters', dock: '#dockcharters', rail: '#railcharters', panel: '#chpanel', required: '[data-sel=charter-ch]', min: 1, textMin: 120 },
        ];
        for (const item of ordinaryPanels) {
          const opener = vp.width > 900 ? item.rail : item.dock;
          /* A populated desktop survey deliberately yields the right rail,
             so Records/Atlas are reached *instead of* the card, while the
             left rail and every phone dock panel remain operable over it. */
          const overSurvey = !(vp.width > 900 && (item.id === 'rec' || item.id === 'atlas'));
          const cardBeforePanel = await evalIn('window.__CF_SLICE__.api.state().cardOpen');
          if (cardBeforePanel !== overSurvey) {
            await evalIn(`document.getElementById('docksurvey')?.click()`);
            await waitFor(`${item.name} survey composition`, `window.__CF_SLICE__.api.state().cardOpen===${JSON.stringify(overSurvey)}`);
          }
          const openerReady = await evalIn(`(()=>{ const b=document.querySelector(${JSON.stringify(opener)});if(!b)return false;const s=getComputedStyle(b),r=b.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;})()`);
          if (!openerReady) instrumentFailures.push(`${vp.label}: ${item.name} has no visible opener in its intended ${overSurvey ? 'over-survey' : 'instead-of-survey'} composition`);
          await evalIn(`(()=>{ const b=document.querySelector(${JSON.stringify(opener)}); b?.focus(); b?.click(); })()`);
          await waitFor(`${item.name} panel`, `window.__CF_SLICE__.api.state().panelOpen===${JSON.stringify(item.id)} && document.querySelectorAll(${JSON.stringify(item.required)}).length>=${item.min} && window.__CF_SLICE__.api.state().cardOpen===${JSON.stringify(overSurvey)}`);
          const composition = `${item.name}-${overSurvey ? 'over' : 'instead-of'}-survey`;
          addOutcome(vp.label, composition, 'PANEL_OPEN_FOCUS_OUTCOME', `${item.panel} [data-pnx]`,
            await evalIn(`window.__CF_GLASS_AUDIT__.openFocusOutcome(${JSON.stringify(item.panel)})`),
            'the real opener moves focus into the newly opened panel before any audit focuses it');
          addOutcome(vp.label, composition, 'PANEL_DISCLOSURE_STATE', opener,
            await evalIn(`window.__CF_GLASS_AUDIT__.openerOutcome(${JSON.stringify(opener)},${JSON.stringify(item.panel)},true)`),
            'visible opener names its panel and exposes expanded=true while the panel is open');
          addOutcome(vp.label, composition, 'PANEL_CLOSE_INTEGRITY', `${item.panel} [data-pnx]`,
            await evalIn(`window.__CF_GLASS_AUDIT__.closeIntegrityOutcome(${JSON.stringify(item.panel)},'[data-pnx]','[data-survey-close]',true)`),
            'the registered panel owns exactly one direct, reachable top-right close');
          if (vp.width > 900 && item.id === 'rec') {
            recordsAnchorObserved = true;
            addOutcome(vp.label, composition, 'DESKTOP_UTILITY_PANEL_ANCHOR', item.panel,
              await evalIn(`window.__CF_GLASS_AUDIT__.rightBottomAnchorOutcome(${JSON.stringify(item.panel)})`),
              'desktop Records shares the measured bottom-right utility edge above the dock');
          }
          add(vp.label, composition, await audit({
            ...common, surface: composition, root: item.panel, textMin: item.textMin,
            required: [{ selector: '[data-pnx]', min: 1 }, { selector: item.required, min: item.min }],
            fitSelectors: [item.panel], interactiveRoots: [item.panel], contrastSelectors: [item.panel, opener],
            maxContrastReports: 16, overlapPairs: [],
          }));
          const closeLabel = await evalIn(`(()=>{ const panel=document.querySelector(${JSON.stringify(item.panel)}),close=panel?.querySelector('[data-pnx]');
            const expected='Close '+(panel?.getAttribute('aria-label')||'');return {ok:!!close&&close.getAttribute('aria-label')===expected,
              actual:close?.getAttribute('aria-label')||null,expected};})()`);
          addOutcome(vp.label, composition, 'PANEL_CLOSE_NAME_WRONG', `${item.panel} [data-pnx]`, closeLabel,
            'the sticky close button names the player-facing panel, not an internal id');
          if (!closeLabelControlRun) {
            closeLabelControlRun = true;
            const labelControl = await evalIn(`(()=>{ const close=document.querySelector(${JSON.stringify(item.panel)}+' [data-pnx]'),prior=close.getAttribute('aria-label');
              close.setAttribute('aria-label','Close internal-id');const panel=document.querySelector(${JSON.stringify(item.panel)}),expected='Close '+panel.getAttribute('aria-label');
              const result={ok:close.getAttribute('aria-label')===expected,actual:close.getAttribute('aria-label'),expected};close.setAttribute('aria-label',prior);return result;})()`);
            if (labelControl.ok) instrumentFailures.push(`${vp.label}: internal-id close-label injection stayed green (${JSON.stringify(labelControl)})`);
            recordControls('panel-close-accessible-name');
          }
          const panelPlanetsideCheck = `(()=>{ const panel=document.querySelector(${JSON.stringify(item.panel)}),side=document.getElementById('planetside');
            if(!panel||!side)return {ok:false,why:'missing'};const a=panel.getBoundingClientRect(),b=side.getBoundingClientRect(),
              left=Math.max(a.left,b.left),right=Math.min(a.right,b.right),top=Math.max(a.top,b.top),bottom=Math.min(a.bottom,b.bottom),
              overlap=right-left>1&&bottom-top>1;if(!overlap)return {ok:true,overlap:false};
            const x=(left+right)/2,y=(top+bottom)/2,hit=document.elementFromPoint(x,y),owned=!!hit&&panel.contains(hit);
            return {ok:owned,overlap:true,owned,hit:hit?.id||hit?.getAttribute?.('data-sel')||hit?.tagName||null,point:[x,y],
              panel:[a.left,a.top,a.right,a.bottom],side:[b.left,b.top,b.right,b.bottom]}; })()`;
          addOutcome(vp.label, `${item.name}-over-planetside`, 'PANEL_PLANETSIDE_LAYERING', item.panel,
            await evalIn(panelPlanetsideCheck), 'an active ordinary panel owns any rendered overlap with the noninteractive Planetside strip');
          if (!panelPlanetsideControlRun) {
            panelPlanetsideControlRun = true;
            const layerControl = await evalIn(`(()=>{ const panel=document.querySelector(${JSON.stringify(item.panel)}),side=document.getElementById('planetside'),
              a=panel.getBoundingClientRect(),b=side.getBoundingClientRect(),priorZ=panel.style.zIndex,priorT=panel.style.transform;
              panel.style.setProperty('transform','translate('+(b.left-a.left)+'px,'+(b.top-a.top)+'px)','important');
              panel.style.setProperty('z-index','20','important');const result=${panelPlanetsideCheck};panel.style.zIndex=priorZ;panel.style.transform=priorT;return result;})()`);
            if (layerControl.ok) instrumentFailures.push(`${vp.label}: synthesized panel-under-Planetside injection stayed green (${JSON.stringify(layerControl)})`);
            recordControls('panel-planetside-layering');
          }
          const preservedSurface = overSurvey ? '#survey' : '#planetside';
          const closed = await evalIn(`window.__CF_GLASS_AUDIT__.panelCloseOutcome(${JSON.stringify(item.panel)},'[data-pnx]',${JSON.stringify(opener)},${JSON.stringify(preservedSurface)})`);
          addOutcome(vp.label, composition, 'ORDINARY_PANEL_CLOSE_OUTCOME', `${item.panel} [data-pnx]`, closed,
            `close owns its centre, closes the panel, preserves ${overSurvey ? 'the survey' : 'Planetside'}, and restores logical opener focus`);
          if (!closed.ok) await evalIn(`document.querySelector(${JSON.stringify(item.panel)}+' [data-pnx]')?.click()`);
          await waitFor(`${item.name} closed`, `window.__CF_SLICE__.api.state().panelOpen===null && window.__CF_SLICE__.api.state().cardOpen===${JSON.stringify(overSurvey)}`);
          addOutcome(vp.label, composition, 'PANEL_DISCLOSURE_STATE', opener,
            await evalIn(`window.__CF_GLASS_AUDIT__.openerOutcome(${JSON.stringify(opener)},${JSON.stringify(item.panel)},false)`),
            'visible opener exposes expanded=false after its panel closes');
          add(vp.label, `${item.name}-opener-off`, await audit({
            surface: `${item.name}-opener-off`, root: opener, textMin: 1, targetFloor,
            safe: vp.safe || {}, safeExpected: vp.safe || undefined,
            viewportExpected: { width: vp.width, height: vp.height, dpr: vp.dpr },
            fitSelectors: [opener], interactiveRoots: [opener], contrastSelectors: [opener], overlapPairs: [],
          }));
        }

        if (vp.width > 900 && !hiddenOpenerControlRun) {
          /* Reach the real focus edge: open Records from its visible right
             rail, reopen Survey (which hides that rail), then close Records.
             Focus must choose the visible Survey dock fallback. */
          if ((await evalIn('window.__CF_SLICE__.api.state().cardOpen'))) {
            await evalIn(`document.getElementById('docksurvey')?.click()`);
            await waitFor('hidden-opener setup survey closed', `!window.__CF_SLICE__.api.state().cardOpen`);
          }
          await evalIn(`document.getElementById('railrecords')?.click()`);
          await waitFor('hidden-opener Records open', `window.__CF_SLICE__.api.state().panelOpen==='rec'`);
          const hiddenOpenerSetup = await evalIn(`(()=>{ document.getElementById('docksurvey')?.click();const s=window.__CF_SLICE__.api.state();return {
            panel:s.panelOpen,cardOpen:s.cardOpen,cardTitle:s.cardTitle,bodyClass:document.body.className,
            railDisplay:getComputedStyle(document.getElementById('railrecords')).display,railRootDisplay:getComputedStyle(document.getElementById('railrgt')).display};})()`);
          if (hiddenOpenerSetup.panel !== 'rec' || !hiddenOpenerSetup.cardOpen || hiddenOpenerSetup.railRootDisplay !== 'none') {
            instrumentFailures.push(`${vp.label}: could not construct hidden panel-opener focus state (${JSON.stringify(hiddenOpenerSetup)})`);
          }
          await evalIn(`document.querySelector('#recpanel [data-pnx]')?.click()`);
          await waitFor('hidden-opener panel close', `window.__CF_SLICE__.api.state().panelOpen===null`);
          const fallbackCheck = `(()=>{ const rail=document.getElementById('railrecords'),survey=document.getElementById('docksurvey');return {
            ok:rail.getClientRects().length===0&&document.activeElement===survey&&window.__CF_SLICE__.api.state().cardOpen,
            railRendered:rail.getClientRects().length>0,focus:document.activeElement?.id||null,cardOpen:window.__CF_SLICE__.api.state().cardOpen};})()`;
          addOutcome(vp.label, 'hidden-panel-opener-focus', 'PANEL_HIDDEN_OPENER_FOCUS_LOST', '#docksurvey', await evalIn(fallbackCheck),
            'closing a panel whose rail opener became hidden restores focus to the visible Survey control');
          const fallbackControl = await evalIn(`(()=>{ document.querySelector('canvas')?.focus();return ${fallbackCheck};})()`);
          if (fallbackControl.ok) instrumentFailures.push(`${vp.label}: wrong hidden-opener fallback focus stayed green (${JSON.stringify(fallbackControl)})`);
          await evalIn(`document.getElementById('docksurvey')?.focus()`);
          hiddenOpenerControlRun = true;
          recordControls('hidden-panel-opener-focus-fallback');
        }

        /* With the card closed, the living-world strip must also clear every
           visible top-chrome surface that just returned. This catches short
           landscape+A++ layouts where a bottom-anchored strip can rise over
           HP/search/trail/objective despite clearing the dock. */
        await evalIn(`document.getElementById('docksurvey')?.click()`);
        await waitFor('survey closed for top-chrome clearance', `!window.__CF_SLICE__.api.state().cardOpen`);
        await waitFor('deferred lower/top chrome measurement after survey close', `(()=>{ const root=getComputedStyle(document.documentElement),ctx=document.getElementById('ctxbar'),dock=document.getElementById('dock'),trail=document.getElementById('trail'),fixed=['topbar','searchbox','objchip'].map(id=>document.getElementById(id)),fallback=document.body.classList.contains('surface-trail-yield');
          const visibleBottom=(el)=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0?r.bottom:0;},
            expectedTop=Math.max(...fixed.map(visibleBottom),fallback?0:visibleBottom(trail));
          return Math.abs(parseFloat(root.getPropertyValue('--ctx-h'))-ctx.offsetHeight)<0.6&&Math.abs(parseFloat(root.getPropertyValue('--dock-h'))-dock.offsetHeight)<0.6&&Math.abs(parseFloat(root.getPropertyValue('--surface-chrome-bottom'))-expectedTop)<0.6;})()`);
        const mobileSurfaceYieldsObjective = vp.width <= 900;
        const landscapeSurfaceYieldsTrail = vp.width <= 900 && vp.width > vp.height;
        const portraitSurface = vp.width <= 900 && vp.width <= vp.height;
        const chromeRestoreCheck = `(()=>{ const fallback=document.body.classList.contains('surface-trail-yield'),rows=['trail','objchip'].map(id=>{const el=document.getElementById(id);return {id,text:(el?.textContent||'').trim(),display:el?getComputedStyle(el).display:'missing'};});
          return {ok:rows.every(r=>r.text.length>0&&(r.id==='trail'?${landscapeSurfaceYieldsTrail ? "r.display==='none'" : portraitSurface ? "r.display===(fallback?'none':'block')" : "r.display!=='none'"}:${mobileSurfaceYieldsObjective ? "r.display==='none'" : "r.display!=='none'"})),rows,fallback};})()`;
        addOutcome(vp.label, 'survey-chrome-restore', 'MOBILE_CHROME_NOT_RESTORED', '#trail,#objchip', await evalIn(chromeRestoreCheck),
          landscapeSurfaceYieldsTrail
            ? 'short-landscape surface mode keeps populated trail/objective rows yielded to Planetside'
            : mobileSurfaceYieldsObjective
              ? 'landed portrait restores the trail when a useful band fits, otherwise marks the bounded trail-yield fallback; the objective yields throughout'
              : 'closing the last card restores every populated desktop trail/objective surface');
        if (!chromeRestoreControlRun) {
          chromeRestoreControlRun = true;
          const restoreControl = await evalIn(`(()=>{ const el=document.getElementById('trail'),prior=el.getAttribute('style');
            el.style.setProperty('display',${JSON.stringify(landscapeSurfaceYieldsTrail ? 'block' : 'none')},'important');const result=${chromeRestoreCheck};
            if(prior===null)el.removeAttribute('style');else el.setAttribute('style',prior);return result;})()`);
          if (restoreControl.ok) instrumentFailures.push(`${vp.label}: wrong trail restoration policy injection stayed green (${JSON.stringify(restoreControl)})`);
          recordControls('mobile-chrome-yield-restore');
        }
        if (landscapeSurfaceYieldsTrail && !chromeLandscapeControlRun) {
          chromeLandscapeControlRun = true;
          const landscapeControl = await evalIn(`(()=>{ const el=document.getElementById('trail'),prior=el.getAttribute('style');
            el.style.setProperty('display','block','important');const result=${chromeRestoreCheck};
            if(prior===null)el.removeAttribute('style');else el.setAttribute('style',prior);return result;})()`);
          if (landscapeControl.ok) instrumentFailures.push(`${vp.label}: forced-visible surface trail injection stayed green (${JSON.stringify(landscapeControl)})`);
          recordControls('mobile-landscape-surface-chrome-yield');
        }
        if (mobileSurfaceYieldsObjective && !objectiveYieldControlRun) {
          objectiveYieldControlRun = true;
          const objectiveControl = await evalIn(`(()=>{ const el=document.getElementById('objchip'),prior=el.getAttribute('style');
            el.style.setProperty('display','block','important');const result=${chromeRestoreCheck};
            if(prior===null)el.removeAttribute('style');else el.setAttribute('style',prior);return result;})()`);
          if (objectiveControl.ok) instrumentFailures.push(`${vp.label}: forced-visible landed objective injection stayed green (${JSON.stringify(objectiveControl)})`);
          recordControls('mobile-surface-objective-yield');
        }
        if (portraitSurface) {
          /* This is intentionally POST-card-close. Earlier Planetside checks
             run while Survey hides the trail and cannot see the reported
             320x568/A++ collision or a false-green one-pixel strip. */
          const portraitBandCheck = `(()=>{ const side=document.getElementById('planetside'),trail=document.getElementById('trail'),
            head=side?.firstElementChild,specimen=side?.querySelector('[data-sel="planetside-sp"]');
            if(!side||!trail||!head||!specimen)return {ok:false,why:'missing populated band surface'};
            const a=side.getBoundingClientRect(),t=trail.getBoundingClientRect(),ts=getComputedStyle(trail),ss=getComputedStyle(side),prior=side.scrollTop;
            const trailVisible=ts.display!=='none'&&ts.visibility!=='hidden'&&t.width>0&&t.height>0,
              gap=trailVisible?a.top-t.bottom:null,inside=(r)=>r.bottom>a.top+1&&r.top<a.bottom-1;
            const headAtRest=head.getBoundingClientRect(),specimenAtRest=specimen.getBoundingClientRect(),headVisible=inside(headAtRest),specimenVisible=inside(specimenAtRest);
            const clipped=side.scrollHeight>side.clientHeight+1,maxScroll=Math.max(0,side.scrollHeight-side.clientHeight);
            side.scrollTop=side.scrollHeight;const observedScroll=side.scrollTop,specimenAfterScroll=specimen.getBoundingClientRect(),specimenReachable=specimenVisible||inside(specimenAfterScroll);side.scrollTop=prior;
            const scrollContract=!clipped||((ss.overflowY==='auto'||ss.overflowY==='scroll')&&maxScroll>0&&observedScroll>0&&specimenReachable),
              meaningful=a.height>=71&&side.clientHeight>=68,clear=trailVisible?gap>=5.5:document.body.classList.contains('surface-trail-yield'),
              policy=trailVisible?!document.body.classList.contains('surface-trail-yield'):document.body.classList.contains('surface-trail-yield');
            return {ok:meaningful&&clear&&policy&&headVisible&&specimenReachable&&scrollContract,meaningful,clear,policy,headVisible,specimenVisible,specimenReachable,scrollContract,
              trailVisible,gap,side:[a.left,a.top,a.right,a.bottom],trail:[t.left,t.top,t.right,t.bottom],clientHeight:side.clientHeight,scrollHeight:side.scrollHeight,
              overflowY:ss.overflowY,maxScroll,observedScroll,surfaceChromeBottom:getComputedStyle(document.documentElement).getPropertyValue('--surface-chrome-bottom').trim(),
              fallback:document.body.classList.contains('surface-trail-yield')}; })()`;
          addOutcome(vp.label, 'planetside-portrait-band', 'PLANETSIDE_PORTRAIT_BAND_UNUSABLE', '#planetside', await evalIn(portraitBandCheck),
            'post-close Planetside keeps at least a useful 72px band, 6px trail clearance, a visible heading, and a visible or vertically reachable specimen');
          if (!portraitBandControlRun) {
            portraitBandControlRun = true;
            /* Reproduce the reported geometry directly. Removing a cap and
               appending arbitrary content only collided on the shortest
               portrait and went green in a targeted primary-phone run. */
            const bandControl = await evalIn(`(()=>{ const side=document.getElementById('planetside'),trail=document.getElementById('trail'),prior=side.style.getPropertyValue('transform'),priority=side.style.getPropertyPriority('transform'),
              a=side.getBoundingClientRect(),t=trail.getBoundingClientRect(),dy=t.bottom-1-a.top;
              side.style.setProperty('transform','translateY('+dy+'px)','important');const result=${portraitBandCheck};
              if(prior)side.style.setProperty('transform',prior,priority);else side.style.removeProperty('transform');return result;})()`);
            if (bandControl.ok || !bandControl.trailVisible || !(bandControl.gap < 5.5)) {
              instrumentFailures.push(`${vp.label}: explicit portrait-band/trail collision stayed green (${JSON.stringify(bandControl)})`);
            }
            recordControls('planetside-portrait-band-viability');
          }
          if (!portraitFallbackControlRun) {
            portraitFallbackControlRun = true;
            /* Tighten the lower safe rectangle through the same CSS variable
               the product reads. The fallback must be an observable policy,
               not a one-way class toggle that leaves the strip collapsed. */
            const fallbackControl = await evalIn(`(()=>{ const root=document.documentElement,side=document.getElementById('planetside'),trail=document.getElementById('trail'),prior=root.style.getPropertyValue('--safe-bottom'),
              beforeSide=side.getBoundingClientRect(),beforeTrail=trail.getBoundingClientRect(),baseSafe=parseFloat(getComputedStyle(root).getPropertyValue('--safe-bottom'))||0,
              forcedSafe=baseSafe+Math.max(8,beforeSide.bottom-beforeTrail.bottom-6-64);
              root.style.setProperty('--safe-bottom',forcedSafe+'px');window.dispatchEvent(new Event('resize'));
              const a=side.getBoundingClientRect(),t=trail.getBoundingClientRect(),ss=getComputedStyle(side),ts=getComputedStyle(trail),fallback=document.body.classList.contains('surface-trail-yield'),
                meaningful=a.height>=71&&side.clientHeight>=68,scrollOk=side.scrollHeight<=side.clientHeight+1||((ss.overflowY==='auto'||ss.overflowY==='scroll')&&side.scrollHeight>side.clientHeight),
                fixedRows=['playerchip','hpbar','searchbox','objchip'].map(id=>{const el=document.getElementById(id),s=getComputedStyle(el),r=el.getBoundingClientRect(),visible=s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;return {id,visible,gap:a.top-r.bottom};}),
                fixedClear=fixedRows.every(row=>!row.visible||row.gap>=5.5);
              const tight={ok:fallback&&ts.display==='none'&&meaningful&&scrollOk&&fixedClear,fallback,trailDisplay:ts.display,side:[a.left,a.top,a.right,a.bottom],trail:[t.left,t.top,t.right,t.bottom],clientHeight:side.clientHeight,scrollHeight:side.scrollHeight,overflowY:ss.overflowY,fixedClear,fixedRows,baseSafe,forcedSafe};
              if(prior)root.style.setProperty('--safe-bottom',prior);else root.style.removeProperty('--safe-bottom');window.dispatchEvent(new Event('resize'));
              const restoredStyle=getComputedStyle(trail),restored=!document.body.classList.contains('surface-trail-yield')&&restoredStyle.display!=='none';
              return {ok:tight.ok&&restored,tight,restored,restoredClass:document.body.classList.contains('surface-trail-yield'),restoredDisplay:restoredStyle.display};})()`);
            if (!fallbackControl.ok) instrumentFailures.push(`${vp.label}: forced-tight portrait did not yield trail with a useful strip and restore exactly (${JSON.stringify(fallbackControl)})`);
            recordControls('planetside-portrait-trail-fallback');
          }
        }
        const topChromeCheck = `(()=>{ const side=document.getElementById('planetside'),a=side?.getBoundingClientRect();if(!side||!a)return {ok:false,why:'missing'};
          const rows=['playerchip','hpbar','searchbox','trail','objchip'].map(id=>{const el=document.getElementById(id),s=el?getComputedStyle(el):null,r=el?.getBoundingClientRect();
            const visible=!!el&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
            const overlap=visible&&a.left<r.right-1&&a.right>r.left+1&&a.top<r.bottom-1&&a.bottom>r.top+1;
            return {id,visible,overlap,rect:r?[r.left,r.top,r.right,r.bottom]:null};});return {ok:rows.every(r=>!r.overlap),side:[a.left,a.top,a.right,a.bottom],rows};})()`;
        addOutcome(vp.label, 'planetside-top-clearance', 'PLANETSIDE_TOP_CHROME_OVERLAP', '#planetside', await evalIn(topChromeCheck),
          'Planetside clears every visible player/HP/search/trail/objective surface');
        if (!topChromeControlRun) {
          topChromeControlRun = true;
          const topControl = await evalIn(`(()=>{ const side=document.getElementById('planetside'),trail=document.getElementById('trail'),visible=(el)=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&r.width>0&&r.height>0;},
            target=visible(trail)?trail:['playerchip','hpbar','searchbox','objchip'].map(id=>document.getElementById(id)).find(visible),
            a=side.getBoundingClientRect(),b=target.getBoundingClientRect(),prior=side.style.transform;
            side.style.setProperty('transform','translate('+(b.left-a.left)+'px,'+(b.top-a.top)+'px)','important');const result=${topChromeCheck};side.style.transform=prior;return result;})()`);
          if (topControl.ok) instrumentFailures.push(`${vp.label}: Planetside/top-chrome overlap injection stayed green (${JSON.stringify(topControl)})`);
          recordControls('planetside-top-chrome-clearance');
        }

        await evalIn(`(()=>{ const b=document.getElementById('dockguide'); b?.focus(); b?.click(); })()`);
        await waitFor('Guide menu open', `window.__CF_SLICE__.api.state().panelOpen==='guide' && document.querySelectorAll('#guidepanel .guide-category').length===9`);
        addOutcome(vp.label, 'guide', 'PANEL_OPEN_FOCUS_OUTCOME', '#guidepanel [data-pnx]',
          await evalIn(`window.__CF_GLASS_AUDIT__.openFocusOutcome('#guidepanel')`),
          'the real Guide opener moves focus into Guide before any audit focuses it');
        addOutcome(vp.label, 'guide', 'PANEL_DISCLOSURE_STATE', '#dockguide',
          await evalIn(`window.__CF_GLASS_AUDIT__.openerOutcome('#dockguide','#guidepanel',true)`),
          'Guide opener names its panel and exposes expanded=true while open');
        addOutcome(vp.label, 'guide', 'PANEL_CLOSE_INTEGRITY', '#guidepanel [data-pnx]',
          await evalIn(`window.__CF_GLASS_AUDIT__.closeIntegrityOutcome('#guidepanel','[data-pnx]','[data-survey-close]',true)`),
          'Guide owns exactly one direct, reachable top-right close');
        const guideBuildIdentity = await evalIn(`(()=>{ const S=window.__CF_SLICE__,panel=document.getElementById('guidepanel'),
          builds=[...document.querySelectorAll('[data-sel="guide-build"]')],text=(builds[0]?.textContent||'').trim();
          return {ok:builds.length===1&&panel.contains(builds[0])&&/Celestial Frontier v2\\.0 development/i.test(text)
            &&S.api.state().releasePending===null,count:builds.length,inside:builds.length===1&&panel.contains(builds[0]),
            text,releasePending:S.api.state().releasePending};})()`);
        addOutcome(vp.label, 'guide', 'GUIDE_DEVELOPMENT_IDENTITY', '#guidepanel [data-sel="guide-build"]', guideBuildIdentity,
          'one Guide-only v2.0 development identity is visible without a pending shipped-release popup');
        add(vp.label, 'guide', await audit({
          ...common, surface: 'guide', root: '#guidepanel', textMin: 200,
          required: [{ selector: '[data-pnx]', min: 1 }, { selector: '[data-sel="guide-build"]', min: 1, textMin: 25 },
            { selector: '#guidesearch', min: 1 }, { selector: '[data-guide-releases]', min: 1 }, { selector: '.guide-category', min: 9, textMin: 180 }],
          interactiveRoots: ['#guidepanel'], contrastSelectors: ['#guidepanel'], placeholderSelectors: ['#guidesearch'], focusSelectors: ['#guidepanel [data-pnx]'],
          overlapPairs: [['#guidepanel', '#dock']],
        }));
        if (vp.label === 'primary-phone') {
          const forcedSelectors = ['#guidepanel', '#guidepanel h3', '#guidepanel .guide-scope',
            '#guidepanel .guide-item', '#guidepanel .guide-item small', '#guidepanel [data-pnx]', '#guidesearch'];
          await send('Emulation.setEmulatedMedia', {
            media: '', features: [
              { name: 'forced-colors', value: 'active' },
              { name: 'prefers-reduced-motion', value: 'no-preference' },
            ],
          }, session);
          await waitFor('forced colors active', `matchMedia('(forced-colors: active)').matches`);
          addOutcome(vp.label, 'guide-forced-colors', 'FORCED_COLORS_AUTHOR_OVERRIDE', '#guidepanel',
            await evalIn(`window.__CF_GLASS_AUDIT__.forcedColorsOutcome(${JSON.stringify(forcedSelectors)})`),
            'Guide, controls, headings, and secondary copy remain mapped to user-agent system colors');
          add(vp.label, 'guide-forced-colors', await audit({
            ...common, surface: 'guide-forced-colors', root: '#guidepanel', textMin: 200,
            required: [{ selector: '[data-pnx]', min: 1 }, { selector: '#guidesearch', min: 1 }, { selector: '.guide-category', min: 9 }],
            fitSelectors: ['#guidepanel'], interactiveRoots: ['#guidepanel'],
            contrastSelectors: forcedSelectors, placeholderSelectors: ['#guidesearch'],
            focusSelectors: ['#guidepanel [data-pnx]'], overlapPairs: [['#guidepanel', '#dock']], maxContrastReports: 16,
          }));
          const forcedControl = await evalIn(`(()=>{
            const style=document.createElement('style'); style.id='cf-forced-colors-control';
            style.textContent='#guidepanel{forced-color-adjust:none!important}#guidepanel .guide-scope{forced-color-adjust:none!important;color:rgb(250,250,250)!important;background:rgb(250,250,250)!important}';
            document.head.appendChild(style);
            const outcome=window.__CF_GLASS_AUDIT__.forcedColorsOutcome(${JSON.stringify(forcedSelectors)});
            const rows=window.__CF_GLASS_AUDIT__.audit({surface:'forced-colors-control',root:'#guidepanel',textMin:1,interactiveRoots:[],contrastSelectors:['#guidepanel .guide-scope'],maxContrastReports:4});
            style.remove(); return {outcome,rows};
          })()`);
          if (forcedControl.outcome.ok || !forcedControl.rows.some((row) => row.code === 'TEXT_CONTRAST_LOW')) {
            instrumentFailures.push(`${vp.label}: forced-colors author-override injection stayed green (${JSON.stringify(forcedControl)})`);
          }
          recordControls('forced-colors-system-mapping');
          await send('Emulation.setEmulatedMedia', {
            media: '', features: [
              { name: 'forced-colors', value: 'none' },
              { name: 'prefers-reduced-motion', value: 'no-preference' },
            ],
          }, session);
          await waitFor('forced colors restored', `!matchMedia('(forced-colors: active)').matches`);
        }
        const guidePreference = await evalIn(`window.__CF_GLASS_AUDIT__.preferenceOutcome('#guidepanel','.guide-scope','var(--dim)')`);
        addOutcome(vp.label, 'guide-preferences', 'PREFERENCE_SURFACE_INERT', '#guidepanel .guide-scope', guidePreference,
          'populated Guide computes A++ size, Max tone, and Mono font without shrinking copy or flattening icons/headings');

        /* Simulate an engine without backdrop-filter support by activating
           the product's own @supports-not .glass background while disabling
           the effect. If the fallback declaration is absent, the ordinary
           translucent background remains and the rendered audit turns red. */
        if (vp.label === 'primary-phone' || vp.label === 'desktop') {
          const fallback = await evalIn(`(()=>{ let background=''; const walk=(rules)=>{for(const rule of rules||[]){if(rule.cssRules){if(/^not\\s*\\(/i.test(rule.conditionText||'')){for(const inner of rule.cssRules){if(inner.selectorText==='.glass'&&inner.style?.background) background=inner.style.background;}}walk(rule.cssRules);}}};for(const sheet of document.styleSheets){try{walk(sheet.cssRules)}catch{}}const style=document.createElement('style');style.id='cf-no-blur';style.textContent='.glass{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;'+(background?'background:'+background+'!important;':'')+'}';document.head.appendChild(style);return {background};})()`);
          if (!fallback.background) {
            /* This is a product finding, not an instrument failure: the
               rendered no-blur audit below names the weak background. */
          }
          add(vp.label, 'guide-no-blur-fallback', await audit({
            ...common, surface: 'guide-no-blur-fallback', root: '#guidepanel', textMin: 200,
            required: [{ selector: '[data-pnx]', min: 1 }, { selector: '.guide-category', min: 9 }],
            fitSelectors: ['#guidepanel'], interactiveRoots: ['#guidepanel'], contrastSelectors: ['#guidepanel'], overlapPairs: [['#guidepanel', '#dock']],
          }));
          await evalIn(`document.getElementById('cf-no-blur')?.remove()`);
        }

        await evalIn(`document.querySelector('#guidepanel .guide-category')?.click()`);
        await waitFor('Guide category', `document.querySelectorAll('#guidepanel [data-sel=guide-topic]').length>=2`);
        addOutcome(vp.label, 'guide-category', 'GUIDE_NAVIGATION_FOCUS_OUTCOME', '#guidepanel [data-guide-home]',
          await evalIn(`window.__CF_GLASS_AUDIT__.navigationOutcome('#guidepanel','[data-guide-home]','[data-sel=guide-topic]',100)`),
          'category navigation renders populated topics and places focus on the logical Back control');
        add(vp.label, 'guide-category', await audit({
          ...common, surface: 'guide-category', root: '#guidepanel', textMin: 160,
          required: [{ selector: '[data-guide-home]', min: 1 }, { selector: '[data-sel=guide-topic]', min: 2, textMin: 100 }],
          interactiveRoots: ['#guidepanel'], contrastSelectors: ['#guidepanel'], overlapPairs: [['#guidepanel', '#dock']],
        }));
        await evalIn(`document.querySelector('#guidepanel [data-sel=guide-topic]')?.click()`);
        await waitFor('Guide topic', `document.querySelector('#guidepanel .guide-topic')?.textContent?.trim().length>160 && document.querySelectorAll('#guidepanel .guide-topic [data-gt]').length>=1`);
        addOutcome(vp.label, 'guide-topic', 'GUIDE_NAVIGATION_FOCUS_OUTCOME', '#guidepanel [data-guide-category]',
          await evalIn(`window.__CF_GLASS_AUDIT__.navigationOutcome('#guidepanel','[data-guide-category]','.guide-topic',160)`),
          'topic navigation renders populated copy and places focus on the logical category Back control');
        add(vp.label, 'guide-topic', await audit({
          ...common, surface: 'guide-topic', root: '#guidepanel', textMin: 220,
          required: [{ selector: '.guide-topic', min: 1, textMin: 160 }, { selector: '.guide-status', min: 1 }, { selector: '.guide-topic [data-gt]', min: 1 }],
          interactiveRoots: ['#guidepanel'], contrastSelectors: ['#guidepanel'], overlapPairs: [['#guidepanel', '#dock']],
        }));
        await evalIn(`document.querySelector('#guidepanel .guide-topic [data-gt]')?.click()`);
        await waitFor('Guide cross-link', `document.querySelector('#guidepanel .guide-topic h4')?.textContent?.toLowerCase().includes('landing')`);
        addOutcome(vp.label, 'guide-cross-link', 'GUIDE_NAVIGATION_FOCUS_OUTCOME', '#guidepanel [data-guide-category]',
          await evalIn(`window.__CF_GLASS_AUDIT__.navigationOutcome('#guidepanel','[data-guide-category]','.guide-topic',160)`),
          'Guide cross-link renders its destination and places focus on the destination Back control');
        const guideReleaseBaseline = await evalIn(`(()=>{ const state=window.__CF_SLICE__.api.state();
          return {rnSeen:state.rnSeen,releasePending:state.releasePending};})()`);
        await evalIn(`document.querySelector('#guidepanel .guide-tools [data-guide-releases]')?.click()`);
        await waitFor('release archive', `document.querySelectorAll('#guidepanel [data-release-index]').length>=50`);
        const developmentArchive = await evalIn(`(()=>{ const first=document.querySelector('#guidepanel [data-release-index="0"]'),text=first?.textContent||'',
          state=window.__CF_SLICE__.api.state();return {ok:!!first&&text.includes('v2.0')&&/UNRELEASED DEVELOPMENT/.test(text)
            &&state.rnSeen===${JSON.stringify(guideReleaseBaseline.rnSeen)}&&state.releasePending===${JSON.stringify(guideReleaseBaseline.releasePending)},
            text,rnSeen:state.rnSeen,releasePending:state.releasePending};})()`);
        addOutcome(vp.label, 'release-history', 'GUIDE_DEVELOPMENT_RELEASE_IDENTITY', '#guidepanel [data-release-index="0"]', developmentArchive,
          'the draft archive row displays v2.0 while remaining explicitly unreleased development copy');
        addOutcome(vp.label, 'release-history', 'GUIDE_NAVIGATION_FOCUS_OUTCOME', '#guidepanel [data-guide-home]',
          await evalIn(`window.__CF_GLASS_AUDIT__.navigationOutcome('#guidepanel','[data-guide-home]','[data-release-index]',600)`),
          'release navigation renders the populated archive and places focus on the logical Guide Back control');
        add(vp.label, 'release-history', await audit({
          ...common, surface: 'release-history', root: '#guidepanel', textMin: 1000,
          required: [{ selector: '.guide-release-intro', min: 1, textMin: 80 }, { selector: '[data-release-index]', min: 50, textMin: 600 }],
          interactiveRoots: ['#guidepanel'], contrastSelectors: ['#guidepanel'], overlapPairs: [['#guidepanel', '#dock']],
        }));
        await evalIn(`document.querySelector('#guidepanel [data-release-index]')?.click()`);
        await waitFor('release detail', `document.querySelector('#guidepanel .guide-topic')?.textContent?.trim().length>200`);
        addOutcome(vp.label, 'release-detail', 'GUIDE_NAVIGATION_FOCUS_OUTCOME', '#guidepanel [data-sel="guide-body"] [data-guide-releases]',
          await evalIn(`window.__CF_GLASS_AUDIT__.navigationOutcome('#guidepanel','[data-sel="guide-body"] [data-guide-releases]','.guide-topic',180)`),
          'release detail renders populated copy and places focus on the logical archive Back control');
        add(vp.label, 'release-detail', await audit({
          ...common, surface: 'release-detail', root: '#guidepanel', textMin: 220,
          required: [{ selector: '.guide-topic', min: 1, textMin: 180 }, { selector: '.guide-status', min: 1 }, { selector: '.guide-topic h5', min: 1 }, { selector: '.guide-topic li', min: 1 }],
          interactiveRoots: ['#guidepanel'], contrastSelectors: ['#guidepanel'], overlapPairs: [['#guidepanel', '#dock']],
        }));
        const developmentDetailCheck = `(()=>{ const S=window.__CF_SLICE__,panel=document.getElementById('guidepanel'),article=panel?.querySelector('.guide-topic'),
          headings=article?[...article.querySelectorAll('h5')].map((node)=>(node.textContent||'').trim()):[],
          bullets=article?[...article.querySelectorAll('li')].map((node)=>(node.textContent||'').trim()):[],text=article?.textContent||'',lower=text.toLowerCase(),state=S.api.state(),
          title=article?.querySelector('[data-guide-heading]')?.textContent||'';
          const expected=['New Features & Systems','UI Enhancements','Gameplay','Bug Fixes','Under the Hood'];
          const overclaim=/\\b(?:mining|crafting|combat|capture|breeding)\\b[^.!?]{0,80}\\b(?:is|are)\\s+(?:now\\s+)?(?:playable|available|live)\\b/i.test(text)
            ||/\\bv2(?:\\.0)?\\s+(?:port|game|build)\\s+(?:is\\s+)?(?:complete|finished|production[- ]ready|fully ported)\\b/i.test(text)
            ||/\\b(?:all|every)\\s+legacy\\s+(?:system|mechanic|feature)s?\\b[^.!?]{0,80}\\b(?:ported|playable|available|live)\\b/i.test(text);
          const identity=title.includes('v2.0 · A New Foundation'),honest=!overclaim&&lower.includes('mechanics that are not yet playable are labelled instead of promised');
          return {ok:identity
            &&article?.querySelector('[data-guide-status]')?.getAttribute('data-guide-status')==='draft'
            &&JSON.stringify(headings)===JSON.stringify(expected)&&bullets.length===43&&bullets.every((bullet)=>bullet.length>0)
            &&/NEW FOUNDATION/.test(text)&&/ONE SURFACE, ONE CLOSE/.test(text)&&/RARITY IS NOT A SPECTRAL CLASS/.test(text)
            &&/DEVELOPMENT PUBLISHING IS ISOLATED/.test(text)&&state.rnSeen===${JSON.stringify(guideReleaseBaseline.rnSeen)}
            &&honest&&state.releasePending===${JSON.stringify(guideReleaseBaseline.releasePending)},
            identity,honest,headings,bulletCount:bullets.length,populated:bullets.every((bullet)=>bullet.length>0),rnSeen:state.rnSeen,
            releasePending:state.releasePending};})()`;
        const developmentDetail = await evalIn(developmentDetailCheck);
        addOutcome(vp.label, 'release-detail', 'GUIDE_DEVELOPMENT_RELEASE_INVENTORY', '#guidepanel .guide-topic', developmentDetail,
          'A New Foundation renders the exact five-section, 43-outcome development inventory without changing shipped-release state');
        if (!releaseDetailControlRun) {
          releaseDetailControlRun = true;
          const detailControls = await evalIn(`(()=>{ const S=window.__CF_SLICE__,article=document.querySelector('#guidepanel .guide-topic'),
            headings=[...article.querySelectorAll('h5')],items=[...article.querySelectorAll('li')],title=article.querySelector('[data-guide-heading]'),priorState=S.api.state;
            const a=headings[0]?.textContent||'',b=headings[1]?.textContent||'',middle=items[12],parent=middle?.parentNode,next=middle?.nextSibling;
            const titleText=title?.textContent||'',claim=items[1],claimText=claim?.textContent||'';
            let order=null,inventory=null,identity=null,overclaim=null,authority=null,error=null;
            try {
              if(!headings[0]||!headings[1]||!middle||!parent||!title||!claim)throw new Error('development-detail control fixture missing');
              headings[0].textContent=b;headings[1].textContent=a;order=${developmentDetailCheck};
              headings[0].textContent=a;headings[1].textContent=b;
              middle.remove();inventory=${developmentDetailCheck};parent.insertBefore(middle,next);
              title.textContent=titleText.replace('v2.0','v2x0');identity=${developmentDetailCheck};title.textContent=titleText;
              claim.textContent='Mining is now playable.';overclaim=${developmentDetailCheck};claim.textContent=claimText;
              S.api.state=()=>({...priorState(),rnSeen:'v2-control'});authority=${developmentDetailCheck};
            } catch(cause) { error=String(cause?.message||cause); }
            finally {
              if(headings[0])headings[0].textContent=a;if(headings[1])headings[1].textContent=b;
              if(middle&&parent&&!middle.isConnected)parent.insertBefore(middle,next);if(title)title.textContent=titleText;if(claim)claim.textContent=claimText;S.api.state=priorState;
            }
            const restored=headings[0]?.textContent===a&&headings[1]?.textContent===b&&middle?.isConnected===true
              &&title?.textContent===titleText&&claim?.textContent===claimText&&S.api.state===priorState;
            return {ok:!error&&order?.ok===false&&inventory?.ok===false&&inventory?.bulletCount===42
              &&identity?.ok===false&&identity?.identity===false&&overclaim?.ok===false&&overclaim?.honest===false
              &&authority?.ok===false&&authority?.rnSeen==='v2-control'&&restored,
              order,inventory,identity,overclaim,authority,restored,error};})()`);
          if (!detailControls.ok) {
            instrumentFailures.push(`${vp.label}: development-release reorder/inventory/authority controls did not fail closed (${JSON.stringify(detailControls)})`);
          }
          recordControls('guide-render-focus');
        }
        if (vp.label === 'primary-phone' || vp.label === 'desktop') {
          const releaseTailCheck = `(()=>{ const panel=document.getElementById('guidepanel'),items=panel?[...panel.querySelectorAll('.guide-topic li')]:[],tail=items.at(-1);
            if(!panel||!tail)return {ok:false,why:'missing panel or tail'};const p=panel.getBoundingClientRect(),r=tail.getBoundingClientRect(),overflowY=getComputedStyle(panel).overflowY,
              maxScroll=Math.max(0,panel.scrollHeight-panel.clientHeight),scrollable=/^(auto|scroll)$/.test(overflowY)&&maxScroll>0,
              advanced=panel.scrollTop>0&&panel.scrollTop>=maxScroll-2,visible=r.top>=p.top-1&&r.bottom<=p.bottom+1;
            return {ok:scrollable&&advanced&&visible&&(tail.textContent||'').toLowerCase().includes('production remains the v1.8.9 main-branch site'),
              overflowY,advanced,visible,scrollTop:panel.scrollTop,maxScroll,text:tail.textContent||''};})()`;
          const releasePoint = await evalIn(`(()=>{ const panel=document.getElementById('guidepanel'),r=panel.getBoundingClientRect();panel.scrollTop=0;
            return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};})()`);
          for (let i = 0; i < 3; i++) {
            await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: releasePoint.x, y: releasePoint.y,
              deltaX: 0, deltaY: 10000 }, session);
          }
          await sleep(100);
          addOutcome(vp.label, 'release-detail', 'GUIDE_DEVELOPMENT_RELEASE_TAIL_REACH', '#guidepanel .guide-topic li:last-child',
            await evalIn(releaseTailCheck),
            'real user scrolling reaches the final v2.0 development note inside the visible Guide viewport');
          if (vp.label === 'primary-phone') {
            const priorOverflow = await evalIn(`(()=>{ const panel=document.getElementById('guidepanel'),style=panel.style,
              prior={value:style.getPropertyValue('overflow-y'),priority:style.getPropertyPriority('overflow-y')};
              style.setProperty('overflow-y','hidden','important');panel.scrollTop=0;return prior;})()`);
            for (let i = 0; i < 3; i++) {
              await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: releasePoint.x, y: releasePoint.y,
                deltaX: 0, deltaY: 10000 }, session);
            }
            await sleep(100);
            const hiddenTailControl = await evalIn(releaseTailCheck);
            await evalIn(`(()=>{ const panel=document.getElementById('guidepanel'),prior=${JSON.stringify(priorOverflow)};
              if(prior.value)panel.style.setProperty('overflow-y',prior.value,prior.priority);else panel.style.removeProperty('overflow-y');panel.scrollTop=0;})()`);
            if (hiddenTailControl.ok || hiddenTailControl.overflowY !== 'hidden' || hiddenTailControl.scrollTop !== 0) {
              instrumentFailures.push(`${vp.label}: hidden-overflow release-tail injection stayed user-reachable (${JSON.stringify(hiddenTailControl)})`);
            } else {
              releaseTailControlRun = true;
            }
          }
        }
        await evalIn(`document.querySelector('#guidepanel [data-pnx]')?.click()`);
        addOutcome(vp.label, 'guide', 'PANEL_DISCLOSURE_STATE', '#dockguide',
          await evalIn(`window.__CF_GLASS_AUDIT__.openerOutcome('#dockguide','#guidepanel',false)`),
          'Guide opener exposes expanded=false after close');

        await evalIn(`(()=>{ const b=document.getElementById('docksets'); b?.focus(); b?.click(); })()`);
        await waitFor('Settings open', `window.__CF_SLICE__.api.state().panelOpen==='set' && document.querySelectorAll('#setpanel .row').length>=6`);
        addOutcome(vp.label, 'settings', 'PANEL_OPEN_FOCUS_OUTCOME', '#setpanel [data-pnx]',
          await evalIn(`window.__CF_GLASS_AUDIT__.openFocusOutcome('#setpanel')`),
          'the real Settings opener moves focus into Settings before any audit focuses it');
        addOutcome(vp.label, 'settings', 'PANEL_DISCLOSURE_STATE', '#docksets',
          await evalIn(`window.__CF_GLASS_AUDIT__.openerOutcome('#docksets','#setpanel',true)`),
          'Settings opener names its panel and exposes expanded=true while open');
        addOutcome(vp.label, 'settings', 'PANEL_CLOSE_INTEGRITY', '#setpanel [data-pnx]',
          await evalIn(`window.__CF_GLASS_AUDIT__.closeIntegrityOutcome('#setpanel','[data-pnx]','[data-survey-close]',true)`),
          'Settings owns exactly one direct, reachable top-right close');
        if (vp.width > 900) {
          addOutcome(vp.label, 'settings', 'DESKTOP_UTILITY_PANEL_ANCHOR', '#setpanel',
            await evalIn(`window.__CF_GLASS_AUDIT__.rightBottomAnchorOutcome('#setpanel')`),
            'desktop Settings shares the measured bottom-right utility edge above the dock');
          if (!settingsAnchorControlRun) {
            settingsAnchorControlRun = true;
            const leftSettingsControl = await evalIn(`(()=>{ const panel=document.getElementById('setpanel'),prior=panel.getAttribute('style');
              panel.style.setProperty('left','12px','important');panel.style.setProperty('right','auto','important');
              const result=window.__CF_GLASS_AUDIT__.rightBottomAnchorOutcome('#setpanel');
              if(prior===null)panel.removeAttribute('style');else panel.setAttribute('style',prior);return result;})()`);
            if (leftSettingsControl.ok || !Array.isArray(leftSettingsControl.rect)
              || Math.abs(leftSettingsControl.rect[0] - 12) > 2) {
              instrumentFailures.push(`${vp.label}: injected left-anchored Settings did not turn the bottom-right anchor outcome red (${JSON.stringify(leftSettingsControl)})`);
            }
            recordControls('viewport-fit');
          }
        }
        add(vp.label, 'settings', await audit({
          ...common, surface: 'settings', root: '#setpanel', textMin: 80,
          required: [{ selector: '[data-pnx]', min: 1 }, { selector: '.row', min: 6 }, { selector: 'input[type=range]', min: 2 }],
          interactiveRoots: ['#setpanel'], contrastSelectors: ['#setpanel'],
          focusSelectors: vp.label === 'primary-phone' || vp.label === 'desktop' ? ['#setpanel [data-pnx]', '#setvol', '#setglass', '#setimport'] : [],
          overlapPairs: [['#setpanel', '#dock']],
        }));
        const settingsWidthCheck = `(()=>{ const panel=document.getElementById('setpanel');
          return panel?{ok:panel.scrollWidth<=panel.clientWidth+1,scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth}: {ok:false,why:'missing'}; })()`;
        addOutcome(vp.label, 'settings', 'SETTINGS_HORIZONTAL_OVERFLOW', '#setpanel', await evalIn(settingsWidthCheck),
          'all Settings rows fit the panel width without horizontal scrolling');
        if (!settingsWidthControlRun) {
          settingsWidthControlRun = true;
          const settingsWidthControl = await evalIn(`(()=>{ const panel=document.getElementById('setpanel'),wide=document.createElement('div');
            wide.style.width='2000px';wide.textContent='overflow control';panel.appendChild(wide);const result=${settingsWidthCheck};wide.remove();return result;})()`);
          if (settingsWidthControl.ok) instrumentFailures.push(`${vp.label}: Settings horizontal-overflow injection stayed green (${JSON.stringify(settingsWidthControl)})`);
          recordControls('settings-horizontal-overflow');
        }
        for (const [pref, value] of [['size', 'fs-xl'], ['tone', 'tone-max'], ['font', 'font-mono']]) {
          addOutcome(vp.label, 'settings', 'SETTINGS_CHOICE_STATE', `[data-pref="${pref}"][data-value="${value}"]`,
            await evalIn(`window.__CF_GLASS_AUDIT__.choiceOutcome('#setpanel','[data-pref=${JSON.stringify(pref)}]','[data-pref=${JSON.stringify(pref)}][data-value=${JSON.stringify(value)}]',false)`),
            'exactly one aria-pressed choice mirrors the persisted display preference');
        }
        add(vp.label, 'settings-preferences', await audit({
          ...common, surface: 'settings-preferences', root: '#setpanel', textMin: 80,
          required: [{ selector: '[data-pnx]', min: 1 }, { selector: '.row', min: 9 }, { selector: '[data-pref]', min: 9 }],
          interactiveRoots: ['#setpanel'], contrastSelectors: ['#setpanel'], overlapPairs: [['#setpanel', '#dock']],
        }));
        const settingsPreference = await evalIn(`window.__CF_GLASS_AUDIT__.preferenceOutcome('#setpanel','.row label','var(--dim)')`);
        addOutcome(vp.label, 'settings-preferences', 'PREFERENCE_SURFACE_INERT', '#setpanel .row label', settingsPreference,
          'populated Settings computes A++ size, Max tone, and Mono font without shrinking copy or flattening headings');

        /* Player-authored text size/tone/font are saved product surfaces.
           Drive the real controls, assert computed results, then rerun the
           geometry audit at the largest text tier. */
        if (vp.label === 'primary-phone' || vp.label === 'desktop') {
          await evalIn(`(()=>{
            for(const [pref,value] of [['size',''],['tone',''],['font','']]){
              const b=document.querySelector('#setpanel [data-pref="'+pref+'"][data-value="'+value+'"]'); b?.focus(); b?.click();
            }
          })()`);
          await waitFor('baseline display preferences', `!document.body.classList.contains('fs-xl') && !document.body.classList.contains('tone-max') && !document.body.classList.contains('font-mono')`);
          const displayBefore = await evalIn(`(()=>{ const panel=document.getElementById('setpanel'),label=panel.querySelector('.row label');return {fontSize:parseFloat(getComputedStyle(panel).fontSize),color:getComputedStyle(label).color,font:getComputedStyle(panel).fontFamily};})()`);
          await evalIn(`(()=>{ const b=document.querySelector('#setpanel [data-pref="size"][data-value="fs-xl"]'); b?.focus(); b?.click(); })()`);
          await waitFor('A++ text preference', `document.body.classList.contains('fs-xl') && parseFloat(getComputedStyle(document.getElementById('setpanel')).fontSize)>=16`);
          addOutcome(vp.label, 'settings-text-xl', 'SETTINGS_CHOICE_STATE_FOCUS', '[data-pref="size"][data-value="fs-xl"]',
            await evalIn(`window.__CF_GLASS_AUDIT__.choiceOutcome('#setpanel','[data-pref="size"]','[data-pref="size"][data-value="fs-xl"]')`),
            'one exact aria-pressed choice and logical focus retained on the newly rendered A++ button');
          await evalIn(`(()=>{ const b=document.querySelector('#setpanel [data-pref="tone"][data-value="tone-max"]'); b?.focus(); b?.click(); })()`);
          await waitFor('tone preference', `document.body.classList.contains('tone-max')`);
          addOutcome(vp.label, 'settings-text-xl', 'SETTINGS_CHOICE_STATE_FOCUS', '[data-pref="tone"][data-value="tone-max"]',
            await evalIn(`window.__CF_GLASS_AUDIT__.choiceOutcome('#setpanel','[data-pref="tone"]','[data-pref="tone"][data-value="tone-max"]')`),
            'one exact aria-pressed choice and logical focus retained on the newly rendered Max button');
          await evalIn(`(()=>{ const b=document.querySelector('#setpanel [data-pref="font"][data-value="font-mono"]'); b?.focus(); b?.click(); })()`);
          await waitFor('tone/font preferences', `document.body.classList.contains('tone-max') && document.body.classList.contains('font-mono')`);
          addOutcome(vp.label, 'settings-text-xl', 'SETTINGS_CHOICE_STATE_FOCUS', '[data-pref="font"][data-value="font-mono"]',
            await evalIn(`window.__CF_GLASS_AUDIT__.choiceOutcome('#setpanel','[data-pref="font"]','[data-pref="font"][data-value="font-mono"]')`),
            'one exact aria-pressed choice and logical focus retained on the newly rendered Mono button');
          const displayAfter = await evalIn(`(()=>{ const panel=document.getElementById('setpanel'),label=panel.querySelector('.row label');return {fontSize:parseFloat(getComputedStyle(panel).fontSize),color:getComputedStyle(label).color,font:getComputedStyle(panel).fontFamily,classes:document.body.className};})()`);
          if (!(displayAfter.fontSize >= 16 && displayAfter.fontSize > displayBefore.fontSize)) {
            findings.push({ context: { viewport: vp.label, surface: 'settings-text-xl' }, row: { code: 'TEXT_SIZE_PREF_INERT', surface: 'settings-text-xl', element: '#setpanel', actual: { before: displayBefore.fontSize, after: displayAfter.fontSize }, expected: 'A++ increases panel copy to at least 16px' } });
          }
          if (displayAfter.color === displayBefore.color) {
            findings.push({ context: { viewport: vp.label, surface: 'settings-text-xl' }, row: { code: 'TEXT_TONE_PREF_INERT', surface: 'settings-text-xl', element: '#setpanel .row label', actual: { before: displayBefore.color, after: displayAfter.color }, expected: 'Max tone changes rendered secondary copy' } });
          }
          if (!/mono/i.test(displayAfter.font)) {
            findings.push({ context: { viewport: vp.label, surface: 'settings-text-xl' }, row: { code: 'FONT_PREF_INERT', surface: 'settings-text-xl', element: '#setpanel', actual: displayAfter.font, expected: 'computed monospace family' } });
          }
          add(vp.label, 'settings-text-xl', await audit({
            ...common, surface: 'settings-text-xl', root: '#setpanel', textMin: 80,
            required: [{ selector: '[data-pnx]', min: 1 }, { selector: '.row', min: 9 }, { selector: '[data-pref]', min: 9 }],
            interactiveRoots: ['#setpanel'], contrastSelectors: ['#setpanel'], focusSelectors: ['#setpanel [data-pnx]', '#setvol', '#setglass', '#setimport'], overlapPairs: [['#setpanel', '#dock']],
          }));
        }

        await evalIn(`(()=>{ const keep=document.createElement('div'),plain=document.createElement('div');
          keep.id='cf-modal-state-keep';keep.inert=true;keep.setAttribute('aria-hidden','keep');
          plain.id='cf-modal-state-plain';document.body.append(keep,plain);document.getElementById('setimport')?.click();})()`);
        await waitFor('Import open', `getComputedStyle(document.getElementById('importsheet')).display!=='none' && document.activeElement?.id==='importtext'`);
        add(vp.label, 'import', await audit({
          ...common, surface: 'import', root: '#importsheet > div', textMin: 140,
          required: [{ selector: '#importtext', min: 1 }, { selector: '#importgo', min: 1 }, { selector: '#importclose', min: 1 }],
          fitSelectors: ['#importsheet > div'], interactiveRoots: ['#importsheet > div'], contrastSelectors: ['#importsheet > div'],
          focusSelectors: ['#importtext', '#importgo', '#importclose'], overlapPairs: [],
        }));
        const importPreference = await evalIn(`window.__CF_GLASS_AUDIT__.preferenceOutcome('#importsheet > div','#importsheet > div > span','var(--dim)')`);
        addOutcome(vp.label, 'import-preferences', 'PREFERENCE_SURFACE_INERT', '#importsheet > div > span', importPreference,
          'populated import guidance computes A++ size, Max tone, and Mono font without shrinking text or flattening hierarchy');
        const modalCheck = `(()=>{ const sheet=document.getElementById('importsheet'),background=[...document.body.children].filter(el=>el!==sheet&&el instanceof HTMLElement);
          const contained=sheet.contains(document.activeElement),locked=background.every(el=>el.inert&&el.getAttribute('aria-hidden')==='true');
          return {ok:contained&&locked,contained,locked,focus:document.activeElement?.id||null,unlocked:background.filter(el=>!el.inert||el.getAttribute('aria-hidden')!=='true').map(el=>el.id||el.tagName)};})()`;
        addOutcome(vp.label, 'import-modal', 'MODAL_BACKGROUND_NOT_CONTAINED', '#importsheet', await evalIn(`(()=>{ document.querySelector('canvas')?.focus();return ${modalCheck};})()`),
          'programmatic background focus is redirected and every direct background surface is inert/hidden while the modal is open');
        if (!modalControlRun) {
          modalControlRun = true;
          const modalControl = await evalIn(`(()=>{ const canvas=document.querySelector('canvas'),stop=e=>e.stopImmediatePropagation();document.addEventListener('focusin',stop,true);
            canvas.inert=false;canvas.removeAttribute('aria-hidden');canvas.focus();const result=${modalCheck};canvas.inert=true;canvas.setAttribute('aria-hidden','true');
            document.removeEventListener('focusin',stop,true);document.getElementById('importtext').focus();return result;})()`);
          if (modalControl.ok) instrumentFailures.push(`${vp.label}: unlocked background-focus modal injection stayed green (${JSON.stringify(modalControl)})`);
        }
        const modalErrorCheck = `(()=>{ const msg=document.getElementById('importmsg');return {ok:msg?.getAttribute('role')==='alert'&&msg?.getAttribute('aria-live')==='assertive'&&!!msg.textContent.trim(),
          role:msg?.getAttribute('role')||null,live:msg?.getAttribute('aria-live')||null,text:msg?.textContent||''};})()`;
        await evalIn(`(()=>{ const input=document.getElementById('importtext');input.value='{bad';document.getElementById('importgo').click();return true;})()`);
        const modalError = await waitFor('Import live error', modalErrorCheck);
        addOutcome(vp.label, 'import-modal', 'MODAL_ERROR_NOT_ANNOUNCED', '#importmsg', modalError,
          'invalid import renders a nonempty assertive live error without replacing the expedition');
        if (!modalLiveControlRun) {
          modalLiveControlRun = true;
          const liveControl = await evalIn(`(()=>{ const msg=document.getElementById('importmsg'),role=msg.getAttribute('role'),live=msg.getAttribute('aria-live');msg.removeAttribute('role');msg.removeAttribute('aria-live');
            const result=${modalErrorCheck};msg.setAttribute('role',role);msg.setAttribute('aria-live',live);return result;})()`);
          if (liveControl.ok) instrumentFailures.push(`${vp.label}: plain-div import-error injection stayed green (${JSON.stringify(liveControl)})`);
          recordControls('modal-live-error');
        }
        const importClose = await evalIn(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); return {display:getComputedStyle(document.getElementById('importsheet')).display,focus:document.activeElement?.id||null}; })()`);
        if (importClose.display !== 'none' || importClose.focus !== 'docksets') {
            findings.push({ context: { viewport: vp.label, surface: 'import' }, row: { code: 'MODAL_ESCAPE_RESTORE', surface: 'import', element: '#importsheet', actual: importClose, expected: { display: 'none', focus: 'docksets' } } });
        }
        const modalRestoreCheck = `(()=>{ const keep=document.getElementById('cf-modal-state-keep'),plain=document.getElementById('cf-modal-state-plain'),canvas=document.querySelector('canvas'),dock=document.getElementById('dock');
          return {ok:!!keep&&keep.inert&&keep.getAttribute('aria-hidden')==='keep'&&!!plain&&!plain.inert&&plain.getAttribute('aria-hidden')===null&&!canvas.inert&&!dock.inert,
            keepInert:keep?.inert,keepAria:keep?.getAttribute('aria-hidden')||null,plainInert:plain?.inert,plainAria:plain?.getAttribute('aria-hidden')||null,
            canvasInert:canvas?.inert,dockInert:dock?.inert};})()`;
        const modalRestore = await evalIn(modalRestoreCheck);
        addOutcome(vp.label, 'import-modal', 'MODAL_BACKGROUND_NOT_RESTORED', '#importsheet', modalRestore,
          'closing restores each background surface’s exact prior inert/aria-hidden state');
        const modalRestoreControl = await evalIn(`(()=>{ const keep=document.getElementById('cf-modal-state-keep');keep.inert=false;keep.removeAttribute('aria-hidden');
          const result=${modalRestoreCheck};keep.inert=true;keep.setAttribute('aria-hidden','keep');return result;})()`);
        if (modalRestoreControl.ok) instrumentFailures.push(`${vp.label}: exact modal-state restoration corruption stayed green (${JSON.stringify(modalRestoreControl)})`);
        if (modalControlRun) recordControls('modal-background-containment-restore');
        await evalIn(`(()=>{ document.getElementById('cf-modal-state-keep')?.remove();document.getElementById('cf-modal-state-plain')?.remove();})()`);
        addOutcome(vp.label, 'settings', 'PANEL_DISCLOSURE_STATE', '#docksets',
          await evalIn(`window.__CF_GLASS_AUDIT__.openerOutcome('#docksets','#setpanel',false)`),
          'Settings opener exposes expanded=false after opening the import modal');

        /* Browser zoom changes the CSS viewport and triggers reflow. Model
           150% by reducing CSS pixels while retaining DPR, rather than using
           pageScaleFactor (which is pinch magnification and permits panning). */
        if (vp.label === 'primary-phone' || vp.label === 'desktop') {
          await evalIn(`document.getElementById('dockguide').click()`);
          const zoomWidth = Math.floor(vp.width / 1.5), zoomHeight = Math.floor(vp.height / 1.5);
          await send('Emulation.setDeviceMetricsOverride', { width: zoomWidth, height: zoomHeight, deviceScaleFactor: vp.dpr, mobile: vp.mobile }, session);
          await sleep(150);
          const zoomState = await evalIn(`({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})`);
          if (zoomState.width !== zoomWidth || zoomState.height !== zoomHeight) instrumentFailures.push(`${vp.label}: browser-zoom viewport did not reflow (${JSON.stringify(zoomState)})`);
          add(vp.label, 'guide-browser-zoom-150', await audit({
            ...common, surface: 'guide-browser-zoom-150', root: '#guidepanel', textMin: 200,
            viewportExpected: { width: zoomWidth, height: zoomHeight, dpr: vp.dpr },
            required: [{ selector: '[data-pnx]', min: 1 }, { selector: '.guide-category', min: 9 }],
            fitSelectors: ['#guidepanel', '#guidepanel [data-pnx]'], interactiveRoots: ['#guidepanel'], contrastSelectors: ['#guidepanel'],
            focusSelectors: ['#guidepanel [data-pnx]'], overlapPairs: [],
          }));
          await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr, mobile: vp.mobile }, session);
          await sleep(100);
          await evalIn(`document.querySelector('#guidepanel [data-pnx]')?.click()`);
        }

        /* Under an OS reduce request, Auto and Reduced must apply both CSS
           and Pixi reduction, while an explicit Full choice must override
           both. This three-way policy check prevents a class-only pass. */
        if (vp.label === 'primary-phone') {
          await evalIn(`document.querySelector('#survey [data-act=leaveworld]')?.click()`);
          await waitFor('return to system', `window.__CF_SLICE__.api.state().mode==='system'`);
          await send('Emulation.setEmulatedMedia', { media: '', features: [
            { name: 'forced-colors', value: 'none' },
            { name: 'prefers-reduced-motion', value: 'reduce' },
          ] }, session);
          await waitFor('OS reduce active', `matchMedia('(prefers-reduced-motion: reduce)').matches`);
          await evalIn(`document.getElementById('docksets').click(); (()=>{const b=document.querySelector('#setpanel [data-motion="-1"]');b?.focus();b?.click()})()`);
          await waitFor('Auto motion selected', `window.__CF_SLICE__.api.state().motionMode===-1 && document.body.classList.contains('motion-reduced')`);
          addOutcome(vp.label, 'motion-auto-os-reduce', 'MOTION_CSS_POLICY_MISMATCH', '[data-motion="-1"]',
            await evalIn(`window.__CF_GLASS_AUDIT__.motionPolicyOutcome(-1)`),
            'Auto under OS reduce applies reduced CSS policy and the matching body state');
          addOutcome(vp.label, 'motion-auto-os-reduce', 'SETTINGS_CHOICE_STATE_FOCUS', '[data-motion="-1"]',
            await evalIn(`window.__CF_GLASS_AUDIT__.choiceOutcome('#setpanel','[data-motion]','[data-motion="-1"]')`),
            'Auto owns the sole aria-pressed state and logical focus after Settings rerenders');
          await evalIn(`(()=>{const b=document.querySelector('#setpanel [data-motion="1"]');b?.focus();b?.click()})()`);
          await waitFor('Reduced motion selected', `window.__CF_SLICE__.api.state().motionMode===1 && document.body.classList.contains('motion-reduced')`);
          addOutcome(vp.label, 'motion-reduced-os-reduce', 'MOTION_CSS_POLICY_MISMATCH', '[data-motion="1"]',
            await evalIn(`window.__CF_GLASS_AUDIT__.motionPolicyOutcome(1)`),
            'Reduced applies reduced CSS policy under OS reduce');
          addOutcome(vp.label, 'motion-reduced-os-reduce', 'SETTINGS_CHOICE_STATE_FOCUS', '[data-motion="1"]',
            await evalIn(`window.__CF_GLASS_AUDIT__.choiceOutcome('#setpanel','[data-motion]','[data-motion="1"]')`),
            'Reduced owns the sole aria-pressed state and logical focus after Settings rerenders');
          await evalIn(`document.querySelector('#setpanel [data-pnx]')?.click()`);
          await sleep(1000);
          const before = await evalIn('window.__CF_GLASS_AUDIT__.sceneSnapshot()');
          await sleep(350);
          const after = await evalIn('window.__CF_GLASS_AUDIT__.sceneSnapshot()');
          const changes = await evalIn(`window.__CF_GLASS_AUDIT__.sceneDelta(${JSON.stringify(before)},${JSON.stringify(after)})`);
          if (changes.length) {
              findings.push({ context: { viewport: vp.label, surface: 'reduced-motion' }, row: { code: 'REDUCED_MOTION_SCENE_DRIFT', surface: 'reduced-motion', element: 'Pixi world', actual: { changed: changes.length, examples: changes.slice(0, 8) }, expected: 'stable visible scene transforms across 350ms' } });
          }

          /* Discriminating direction: Full on the same reduced-OS scene must
             restore CSS duration and a real transform delta. */
          await evalIn(`document.getElementById('docksets').click(); (()=>{const b=document.querySelector('#setpanel [data-motion="0"]');b?.focus();b?.click()})()`);
          await waitFor('Full motion selected', `window.__CF_SLICE__.api.state().motionMode===0 && !document.body.classList.contains('motion-reduced')`);
          addOutcome(vp.label, 'motion-full-os-reduce', 'MOTION_CSS_POLICY_MISMATCH', '[data-motion="0"]',
            await evalIn(`window.__CF_GLASS_AUDIT__.motionPolicyOutcome(0)`),
            'explicit Full overrides the OS reduce request for CSS and body state');
          addOutcome(vp.label, 'motion-full-os-reduce', 'SETTINGS_CHOICE_STATE_FOCUS', '[data-motion="0"]',
            await evalIn(`window.__CF_GLASS_AUDIT__.choiceOutcome('#setpanel','[data-motion]','[data-motion="0"]')`),
            'Full owns the sole aria-pressed state and logical focus after Settings rerenders');
          await evalIn(`document.querySelector('#setpanel [data-pnx]')?.click()`);
          await sleep(150);
          const fullBefore = await evalIn('window.__CF_GLASS_AUDIT__.sceneSnapshot()');
          await sleep(350);
          const fullAfter = await evalIn('window.__CF_GLASS_AUDIT__.sceneSnapshot()');
          const fullChanges = await evalIn(`window.__CF_GLASS_AUDIT__.sceneDelta(${JSON.stringify(fullBefore)},${JSON.stringify(fullAfter)})`);
          if (!fullChanges.length) instrumentFailures.push(`${vp.label}: full-motion scene did not move, so the reduced-motion pass is vacuous`);

          /* A live DPR transition catches the once-only DPR constant. A
             responsive canvas must update backing density as well as CSS,
             without discarding the player's selected body/action. */
          await evalIn(`window.__CF_SLICE__.api.surveyOn(2)`);
          const densityCardBefore = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state(),card=document.getElementById('survey'),action=card?.querySelector('[data-act="landcta"]'),r=action?.getBoundingClientRect();
            const hit=r?document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2):null;
            return {ok:s.mode==='system'&&s.cardOpen&&!!s.cardTitle&&!!action&&r.width>=44&&r.height>=44&&(hit===action||action?.contains(hit)),
              mode:s.mode,title:s.cardTitle,action:action?.textContent||null,width:r?.width||0,height:r?.height||0,hit:hit?.tagName||null}; })()`);
          if (!densityCardBefore.ok) findings.push({ context: { viewport: vp.label, surface: 'dpr-card-preservation' }, row: {
            code: 'DPR_CARD_SETUP_UNREACHABLE', surface: 'dpr-card-preservation', element: '#survey [data-act="landcta"]',
            actual: densityCardBefore, expected: 'an open, centre-hittable 44px planet action before the live DPR transition',
          } });
          const densityCardCheck = `(()=>{ const s=window.__CF_SLICE__.api.state(),card=document.getElementById('survey'),action=card?.querySelector('[data-act="landcta"]'),r=action?.getBoundingClientRect();
            const hit=r?document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2):null;
            return {ok:s.mode==='system'&&s.cardOpen&&s.cardTitle===${JSON.stringify(densityCardBefore.title)}&&!!action&&r.width>=44&&r.height>=44&&(hit===action||action?.contains(hit)),
              mode:s.mode,title:s.cardTitle,action:action?.textContent||null,width:r?.width||0,height:r?.height||0,hit:hit?.tagName||null}; })()`;
          const dprWidth = vp.width - 1;
          const dprPlan = expectedDensityPlan({
            width: dprWidth, height: vp.height, dpr: 1, mobile: vp.mobile,
          });
          await send('Emulation.setDeviceMetricsOverride', { width: dprWidth, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile }, session);
          await sleep(500);
          const liveDpr = await evalIn('devicePixelRatio');
          if (Math.abs(liveDpr - 1) > 0.01) instrumentFailures.push(`${vp.label}: live DPR override did not reach the document (${liveDpr})`);
          add(vp.label, 'dpr-change', await audit({
            ...common, surface: 'dpr-change', root: '#dock', textMin: 1,
            viewportExpected: { width: dprWidth, height: vp.height, dpr: 1 },
            interactiveRoots: ['#dock'], contrastSelectors: [], canvas: true,
            expectedDpr: dprPlan.dpr,
            maxBackingPixels: dprPlan.backingPixelCapPerCanvas,
          }));
          const densityCardAfter = await evalIn(densityCardCheck);
          if (!densityCardAfter.ok) findings.push({ context: { viewport: vp.label, surface: 'dpr-card-preservation' }, row: {
            code: 'DPR_SURVEY_STATE_LOST', surface: 'dpr-card-preservation', element: '#survey [data-act="landcta"]',
            actual: densityCardAfter, expected: 'same selected body, title, open survey and reachable Land action after density-only rebuild',
          } });
          const densityCardControl = await evalIn(`(()=>{ const card=document.getElementById('survey'),html=card.innerHTML;
            card.querySelector('[data-act="landcta"]')?.remove(); const result=${densityCardCheck}; card.innerHTML=html; return result; })()`);
          if (densityCardControl.ok) instrumentFailures.push(`${vp.label}: removing the preserved DPR card action stayed green`);
          recordControls('dpr-card-preservation');
        }
      } catch (error) {
        if (error instanceof ProductAnswerabilityFinding) {
          const findingCode = error.finding?.code || 'REPLACEMENT_UNANSWERABLE_AFTER_READY';
          if (viewportLabel) targetedProductFailure = true;
          const findingSurface = error.finding?.surface || 'replacement-ready-answerability';
          findings.push({ context: { viewport: vp.label, surface: findingSurface }, row: {
            code: findingCode,
            surface: findingSurface, element: error.finding?.element || 'replacement target main thread',
            actual: { message: error.message, evidence: error.evidence },
            expected: error.finding?.expected || 'two exact-context confirmations each answer within 2000ms with a concurrent responsive browser-process heartbeat and a newer ticker turn on cycle 2',
          } });
          /* Record only controls uniquely reachable in the aborted
             viewport's remaining suffix. Controls belonging to other
             viewport classes stay omitted in targeted reports; full reports
             can distinguish product-blocked coverage from instrument loss. */
          for (const row of productBlockedSuffixForViewport(
            vp.label, findingCode, executedControls,
          )) {
            productBlockedControls.set(row.name, row);
          }
        } else {
          instrumentFailures.push(`${vp.label}: ${error.message}`);
        }
      } finally {
        if (targetId && browser) {
          try { await browser.send('Target.closeTarget', { targetId }); } catch { /* disposal below is authoritative */ }
        }
        if (browserContextId && browser) {
          try { await browser.send('Target.disposeBrowserContext', { browserContextId }); }
          catch (error) { instrumentFailures.push(`${vp.label}: browser context cleanup failed (${error.message})`); }
        }
        if (browser) {
          try { await browser.close(); }
          catch (error) { instrumentFailures.push(`${vp.label}: owned browser cleanup failed (${error.message})`); }
        }
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  const endingSource = sourceIdentity();
  if (endingSource.commit !== runSource.commit || endingSource.branch !== runSource.branch
    || endingSource.statusSha256 !== runSource.statusSha256
    || endingSource.workingTreeSha256 !== runSource.workingTreeSha256) {
    instrumentFailures.push(`source changed during matrix: start=${JSON.stringify(runSource)} end=${JSON.stringify(endingSource)}`);
  }
  /* A targeted diagnostic that is itself product-blocked cannot execute the
     remainder of that one viewport. Full certification still requires all
     global sentinels; only the explicit reachable suffix in the control
     ledger may be product-blocked there. */
  const targetedProductBlocked = targetedProductRemainderBlocked(viewportLabel, targetedProductFailure);
  if (!controlsRun && !targetedProductBlocked) instrumentFailures.push('injected matrix controls never ran');
  if (!hpControlRun && !targetedProductBlocked) instrumentFailures.push('HP dual-background contrast control never ran');
  if (!settingsWidthControlRun && !targetedProductBlocked) instrumentFailures.push('Settings horizontal-overflow control never ran');
  if (!planetsideControlRun && !targetedProductBlocked) instrumentFailures.push('Planetside surface-ownership controls never ran');
  if (!panelPlanetsideControlRun && !targetedProductBlocked) instrumentFailures.push('panel/Planetside synthesized layering control never ran');
  if (!chromeYieldControlRun && !targetedProductBlocked) instrumentFailures.push('mobile chrome yield control never ran');
  if (!chromeRestoreControlRun && !targetedProductBlocked) instrumentFailures.push('mobile chrome restore-direction control never ran');
  if (!objectiveYieldControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width <= 900)) {
    instrumentFailures.push('mobile landed-objective yield control never ran');
  }
  if (!topChromeControlRun && !targetedProductBlocked) instrumentFailures.push('Planetside/top-chrome clearance control never ran');
  if (!portraitBandControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width <= 900 && vp.width <= vp.height)) {
    instrumentFailures.push('Planetside portrait-band viability control never ran');
  }
  if (!portraitFallbackControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width <= 900 && vp.width <= vp.height)) {
    instrumentFailures.push('Planetside portrait trail-fallback control never ran');
  }
  if (!modalControlRun && !targetedProductBlocked) instrumentFailures.push('import modal containment control never ran');
  if (!modalLiveControlRun && !targetedProductBlocked) instrumentFailures.push('import live-error control never ran');
  if (!closeLabelControlRun && !targetedProductBlocked) instrumentFailures.push('panel close accessible-name control never ran');
  if (!closeIntegrityControlRun && !targetedProductBlocked) instrumentFailures.push('duplicate/misplaced close integrity controls never ran');
  if (!toastAnchorControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width > 900)) {
    instrumentFailures.push('desktop left-anchored toast control never ran');
  }
  if (!settingsAnchorControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width > 900)) {
    instrumentFailures.push('desktop left-anchored Settings control never ran');
  }
  if (!recordsAnchorObserved && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width > 900)) {
    instrumentFailures.push('desktop Records bottom-right anchor outcome never ran');
  }
  if (!hiddenOpenerControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width > 900)) {
    instrumentFailures.push('hidden panel-opener focus fallback control never ran');
  }
  if (!releaseDetailControlRun && !targetedProductBlocked) {
    instrumentFailures.push('development release detail controls never ran');
  }
  if (!releaseTailControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.label === 'primary-phone')) {
    instrumentFailures.push('development release hidden-overflow tail control never ran');
  }
  if (!reloadBindingControlRun && !targetedProductBlocked) instrumentFailures.push('live slice-ready binding controls never ran');
  const browser = browserVersions.length ? {
    ...browserVersions[0],
    consistentAcrossViewports: browserVersions.every((row) => JSON.stringify(row) === JSON.stringify(browserVersions[0])),
  } : null;
  if (browser && !browser.consistentAcrossViewports) instrumentFailures.push('browser version changed within the matrix');
  const blockedControls = [...productBlockedControls.values()]
    .filter((row) => !executedControls.has(row.name));
  const coverage = controlCoverageOutcome([...executedControls], blockedControls);
  if (!coverage.ok) {
    instrumentFailures.push(`negative-control coverage failed closed: ${coverage.why}`);
  } else if (!viewportLabel && coverage.omitted.length) {
    instrumentFailures.push(`full matrix omitted planned negative controls: ${coverage.omitted.join(', ')}`);
  }
  if (instrumentFailures.length) {
    writeReport({ status: 'instrument-fail', exitCode: 2, browser, findings, instrumentFailures, controlsRun,
      executedControls: [...executedControls], blockedControls });
    console.error('GLASS MATRIX INSTRUMENT FAILURE');
    for (const failure of instrumentFailures) console.error('- ' + failure);
    if (findings.length) {
      console.error(`PRODUCT FINDINGS WITHHELD (${findings.length}) — instrument must be repaired first`);
      for (const finding of findings.slice(0, 20)) console.error('- ' + formatIssue(finding.context, finding.row));
    }
    process.exitCode = 2;
    return;
  }
  if (findings.length) {
    writeReport({ status: 'fail', exitCode: 1, browser, findings, instrumentFailures, controlsRun,
      executedControls: [...executedControls], blockedControls });
    const counts = new Map();
    for (const { row } of findings) counts.set(row.code, (counts.get(row.code) || 0) + 1);
    console.error(`GLASS MATRIX PRODUCT FINDINGS — ${findings.length} across ${MATRIX_VIEWPORTS.length} viewport classes`);
    console.error('COUNTS ' + JSON.stringify(Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)))));
    for (const finding of findings) console.error('- ' + formatIssue(finding.context, finding.row));
    process.exitCode = 1;
    return;
  }
  writeReport({ status: 'pass', exitCode: 0, browser, findings, instrumentFailures, controlsRun,
    executedControls: [...executedControls], blockedControls });
  if (viewportLabel) {
    console.log(`GLASS MATRIX TARGETED DIAGNOSTIC PASS — ${viewportLabel}; this does not certify the 12-viewport matrix.`);
    console.log(`diagnostic evidence: apps/game/smoke/${path.basename(reportPath)}`);
  } else {
    console.log(`GLASS MATRIX PASS — ${MATRIX_VIEWPORTS.length} isolated viewport classes; populated Training, toast, survey, Planetside, Guide, Settings and import surfaces; safe-area, zoom, focus, target, contrast, reduced-motion and DPR controls all passed.`);
    console.log('structured evidence: apps/game/smoke/glassmatrix-report.json');
  }
  } finally {
    releaseLock();
  }
}

main().catch((error) => {
  try {
    writeReport({
      status: 'instrument-fail', exitCode: 2, browser: null, findings: [],
      instrumentFailures: [String(error?.stack || error)], controlsRun: false,
    });
  } catch (reportError) {
    console.error('- failed to write structured evidence: ' + reportError.message);
  }
  console.error('GLASS MATRIX INSTRUMENT FAILURE');
  console.error('- ' + (error?.stack || error));
  process.exitCode = 2;
});
