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
const MAX_BACKING_PIXELS = 4096 * 4096;
/* Import settlement, navigation commit, and replacement boot are separate
   observable phases. Bound each to the same budget as a fresh slice boot;
   never let time spent waiting for the old loader to leave consume the new
   document's boot budget. */
const SLICE_READY_TIMEOUT_MS = 20000;
const IMPORT_SETTLE_TIMEOUT_MS = SLICE_READY_TIMEOUT_MS;
const NAVIGATION_COMMIT_TIMEOUT_MS = 5000;
const REPLACEMENT_READY_TIMEOUT_MS = SLICE_READY_TIMEOUT_MS;
const MAX_RELOAD_EVENTS = 48;
const RELOAD_RELEASE_BINDING = '__cfReloadReleaseWitness';
const SLICE_READY_BINDING = '__cfSliceReadyWitness';
const PHASE_PROBE_TIMEOUT_MS = 2000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const startedAt = Date.now();
let runSource = null;
let runReloadEvidence = [];
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
  'reload-resource-release',
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

function validateReloadReleaseWitness(payload) {
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
  for (const name of ['appCanvas', 'backdropCanvas']) {
    const canvas = witness[name];
    if (!canvas || typeof canvas !== 'object' || Array.isArray(canvas)) {
      return { ok: false, why: `release witness ${name} is missing`, witness };
    }
    const values = ['beforeWidth', 'beforeHeight', 'afterWidth', 'afterHeight'];
    if (!values.every((field) => Number.isInteger(canvas[field]) && canvas[field] >= 0)) {
      return { ok: false, why: `release witness ${name} dimensions are invalid`, witness };
    }
    const beforePixels = canvas.beforeWidth * canvas.beforeHeight;
    if (canvas.beforeWidth <= 1 || canvas.beforeHeight <= 1 || beforePixels <= 1
      || beforePixels > MAX_BACKING_PIXELS) {
      return { ok: false, why: `release witness ${name} did not capture a meaningful bounded pre-release canvas`, witness };
    }
    if (canvas.afterWidth > 1 || canvas.afterHeight > 1) {
      return { ok: false, why: `release witness ${name} retained a canvas larger than 1x1`, witness };
    }
  }
  return { ok: true, why: null, witness };
}

function validateSliceReadyWitness(payload) {
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
  if (!Number.isInteger(witness.backingWidth) || !Number.isInteger(witness.backingHeight)
    || witness.backingWidth <= 1 || witness.backingHeight <= 1
    || witness.backingWidth * witness.backingHeight > MAX_BACKING_PIXELS) {
    return { ok: false, why: 'slice-ready witness backing dimensions are invalid', witness };
  }
  if (!Number.isFinite(witness.performanceNow) || witness.performanceNow < 0
    || witness.performanceNow >= REPLACEMENT_READY_TIMEOUT_MS) {
    return { ok: false, why: 'slice-ready witness performance timestamp is invalid', witness };
  }
  return { ok: true, why: null, witness };
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

async function runBoundedReadyConfirmation({
  send, sessionId, executionContextId, expression, bootDeadline,
  maxTimeoutMs = PHASE_PROBE_TIMEOUT_MS, now = Date.now,
}) {
  const remaining = bootDeadline - now();
  if (remaining <= 0) {
    return { ok: false, why: 'timely slice-ready witness was not processed before its boot deadline', command: null, result: null };
  }
  const timeoutMs = Math.max(1, Math.min(maxTimeoutMs, remaining));
  const startedAt = now();
  try {
    const result = await send('Runtime.evaluate', {
      expression, contextId: executionContextId, returnByValue: true, awaitPromise: false,
    }, sessionId, { timeoutMs });
    const endedAt = now();
    const command = { method: 'Runtime.evaluate', startedAt, endedAt,
      durationMs: endedAt - startedAt, timeoutMs, status: 'completed' };
    const deadline = confirmationDeadlineOutcome(endedAt, bootDeadline);
    return deadline.ok
      ? { ok: true, why: null, command, result }
      : { ok: false, why: deadline.why, command, result };
  } catch (error) {
    const endedAt = now();
    return {
      ok: false, why: `bounded slice-ready confirmation instrument failed (${error.message})`,
      command: { method: 'Runtime.evaluate', startedAt, endedAt,
        durationMs: endedAt - startedAt, timeoutMs, status: 'failed', error: error.message },
      result: null,
    };
  }
}

async function reloadPhaseSelftest() {
  const failures = [];
  const priorToken = 'old-document-token', priorLoaderId = 'old-loader';
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
    appCanvas: { beforeWidth: 4096, beforeHeight: 4096, afterWidth: 1, afterHeight: 1 },
    backdropCanvas: { beforeWidth: 4096, beforeHeight: 4096, afterWidth: 0, afterHeight: 0 },
  };
  const releaseAccepted = validateReloadReleaseWitness(JSON.stringify(validRelease));
  if (!releaseAccepted.ok) {
    failures.push(`valid reload-resource witness was rejected: ${JSON.stringify(releaseAccepted)}`);
  }
  if (NAVIGATION_COMMIT_TIMEOUT_MS !== 5000 || REPLACEMENT_READY_TIMEOUT_MS !== 20000) {
    failures.push(`reload phase budgets drifted: navigation=${NAVIGATION_COMMIT_TIMEOUT_MS} boot=${REPLACEMENT_READY_TIMEOUT_MS}`);
  }
  const retainedCanvas = structuredClone(validRelease);
  retainedCanvas.appCanvas.afterWidth = 2;
  const retainedRejected = validateReloadReleaseWitness(JSON.stringify(retainedCanvas));
  if (retainedRejected.ok || !/larger than 1x1/.test(retainedRejected.why || '')) {
    failures.push(`retained reload canvas was accepted: ${JSON.stringify(retainedRejected)}`);
  }
  const unreleasedRenderer = structuredClone(validRelease);
  unreleasedRenderer.rendererReleased = false;
  const rendererRejected = validateReloadReleaseWitness(unreleasedRenderer);
  if (rendererRejected.ok || !/rendererReleased/.test(rendererRejected.why || '')) {
    failures.push(`unreleased renderer witness was accepted: ${JSON.stringify(rendererRejected)}`);
  }
  const oversizedCanvas = structuredClone(validRelease);
  oversizedCanvas.backdropCanvas.beforeWidth = 4097;
  oversizedCanvas.backdropCanvas.beforeHeight = 4097;
  const oversizedRejected = validateReloadReleaseWitness(oversizedCanvas);
  if (oversizedRejected.ok || !/meaningful bounded/.test(oversizedRejected.why || '')) {
    failures.push(`over-budget reload canvas was accepted: ${JSON.stringify(oversizedRejected)}`);
  }
  const readyPayload = {
    schema: 'cf-v2-slice-ready/v1', status: 'ready', token: 'replacement-token',
    href: 'http://127.0.0.1:1234/', readyState: 'complete', saveReady: true,
    viewConnected: true, rendererReady: true, stageReady: true, tickerTicks: 1,
    backingWidth: 4096, backingHeight: 4096,
    performanceNow: 123,
  };
  const readyValidation = validateSliceReadyWitness(JSON.stringify(readyPayload));
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
  let confirmationCalls = 0;
  const confirmationTimeout = await runBoundedReadyConfirmation({
    send: async () => { confirmationCalls++; throw new Error('timed out waiting for Runtime.evaluate'); },
    sessionId: 'target-session', executionContextId: 7, expression: 'true',
    bootDeadline: 130, now: (() => { const times = [120, 121, 129]; return () => times.shift() ?? 129; })(),
  });
  if (confirmationTimeout.ok || confirmationCalls !== 1
    || confirmationTimeout.command?.status !== 'failed'
    || !/timed out waiting/.test(confirmationTimeout.why || '')) {
    failures.push(`bounded confirmation timeout did not fail once without retry: ${JSON.stringify({ confirmationCalls, confirmationTimeout })}`);
  }
  let lateConfirmationCalls = 0;
  const lateConfirmation = await runBoundedReadyConfirmation({
    send: async () => { lateConfirmationCalls++; return { result: { value: true } }; },
    sessionId: 'target-session', executionContextId: 7, expression: 'true',
    bootDeadline: 130, now: (() => { const times = [120, 121, 130]; return () => times.shift() ?? 130; })(),
  });
  if (lateConfirmation.ok || lateConfirmationCalls !== 1
    || lateConfirmation.command?.status !== 'completed'
    || !/after the replacement boot deadline/.test(lateConfirmation.why || '')) {
    failures.push(`late successful confirmation did not fail once with coherent evidence: ${JSON.stringify({ lateConfirmationCalls, lateConfirmation })}`);
  }
  const readyControls = [
    ['missing', [], 'pending'],
    ['duplicate', [readyRow, readyRow], 'failed'],
    ['same-token', [{ ...readyRow, validation: validateSliceReadyWitness({ ...readyPayload, token: priorToken }) }], 'failed'],
    ['wrong-url', [{ ...readyRow, validation: validateSliceReadyWitness({ ...readyPayload, href: 'http://wrong.invalid/' }) }], 'failed'],
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
  const incompleteReady = validateSliceReadyWitness({ ...readyPayload, viewConnected: false });
  if (incompleteReady.ok || !/complete wired/.test(incompleteReady.why || '')) {
    failures.push(`incomplete slice-ready payload was accepted: ${JSON.stringify(incompleteReady)}`);
  }
  const malformedReady = validateSliceReadyWitness('{bad json');
  if (malformedReady.ok || !/not JSON/.test(malformedReady.why || '')) {
    failures.push(`malformed slice-ready payload was accepted: ${JSON.stringify(malformedReady)}`);
  }
  const productClockLate = validateSliceReadyWitness({
    ...readyPayload, performanceNow: REPLACEMENT_READY_TIMEOUT_MS,
  });
  if (productClockLate.ok || !/performance timestamp/.test(productClockLate.why || '')) {
    failures.push(`just-late browser-native slice-ready timestamp was accepted: ${JSON.stringify(productClockLate)}`);
  }
  const releaseRow = {
    at: 100, sessionId: 'target-session', loaderId: priorLoaderId,
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
    ['wrong-reason', [{ ...releaseRow, validation: validateReloadReleaseWitness({ ...validRelease, reason: 'training-restart' }) }], 'failed'],
    ['wrong-token', [{ ...releaseRow, validation: validateReloadReleaseWitness({ ...validRelease, documentToken: 'other-token' }) }], 'failed'],
    ['wrong-context', [{ ...releaseRow, context: { ...releaseRow.context, uniqueId: 'other-context' } }], 'failed'],
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
  executedControls = [], source = runSource || sourceIdentity() }) {
  const counts = new Map();
  for (const { row } of findings) counts.set(row.code, (counts.get(row.code) || 0) + 1);
  const endedAt = Date.now();
  const executed = [...new Set(executedControls)].filter((name) => NEGATIVE_CONTROLS.includes(name)).sort();
  const omitted = NEGATIVE_CONTROLS.filter((name) => !executed.includes(name));
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
         omittedNegativeControls. A full run is rejected below if any
         planned control did not execute. */
      negativeControls: executed,
      plannedNegativeControls: [...NEGATIVE_CONTROLS],
      omittedNegativeControls: omitted,
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
  const shaped = {
    schema: 'cf-v2-glassmatrix/v1', status: fixture.status, scope: 'full-certifying', certifying: true,
    viewportInventory: viewportInventory(),
    controlSummary: {
      selftestRan: fixture.controlsRun,
      negativeControls: [...NEGATIVE_CONTROLS],
      plannedNegativeControls: [...NEGATIVE_CONTROLS],
      omittedNegativeControls: [],
      automaticRetries: 0,
    },
    summary: { findingCount: fixture.findings.length, instrumentFailureCount: fixture.instrumentFailures.length, counts: Object.fromEntries(counts) },
    findings: fixture.findings.map(({ context, row }) => ({ viewport: context.viewport, surface: context.surface, ...row })),
    reloadEvidence: [{
      viewport: 'desktop-8k', priorLoaderId: 'old-loader', replacementLoaderId: 'replacement-loader',
      releaseWitness: { validation: { ok: true } },
      readyWitness: { validation: { ok: true }, at: 10 },
      commands: [{ method: 'Runtime.evaluate', durationMs: 1, timeoutMs: 2000, status: 'completed' }],
      events: [{ method: 'Page.lifecycleEvent', name: 'DOMContentLoaded', loaderId: 'replacement-loader' }],
    }],
    instrumentFailures: fixture.instrumentFailures,
  };
  if (shaped.schema !== 'cf-v2-glassmatrix/v1' || shaped.status !== 'fail'
    || shaped.scope !== 'full-certifying' || shaped.certifying !== true
    || shaped.viewportInventory.length !== 12 || shaped.summary.counts.TARGET_TOO_SMALL !== 1
    || shaped.findings[0].actual.height !== 20 || shaped.controlSummary.automaticRetries !== 0
    || shaped.controlSummary.omittedNegativeControls.length !== 0
    || shaped.reloadEvidence[0]?.viewport !== 'desktop-8k'
    || shaped.reloadEvidence[0]?.releaseWitness?.validation?.ok !== true
    || shaped.reloadEvidence[0]?.readyWitness?.validation?.ok !== true
    || shaped.reloadEvidence[0]?.commands?.[0]?.timeoutMs !== PHASE_PROBE_TIMEOUT_MS
    || shaped.reloadEvidence[0]?.events?.[0]?.name !== 'DOMContentLoaded'
    || !['non-glass-background-chain', 'settings-pressed-focus', 'guide-render-focus',
      'motion-css-policy', 'ordinary-panel-centre-close', 'opener-expanded-controls',
      'pseudo-placeholder-contrast', 'typography-no-shrink-hierarchy', 'backing-pixel-ceiling',
      'forced-colors-system-mapping', 'panel-open-focus', 'replacement-document-loader-token-phase',
      'reload-resource-release']
      .every((name) => shaped.controlSummary.negativeControls.includes(name))) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: injected finding/report grouping drifted');
  }
  console.log('GLASS MATRIX REPORT SELFTEST: PASS');
  console.log('  injected finding retained; 12 viewport definitions retained; retry policy remains zero');
  console.log('  phased import/navigation/replacement clocks fail closed; release and boot-ready bindings own their deadlines');
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
      || Number(state.backingWidth) !== canvas.width || Number(state.backingHeight) !== canvas.height) {
      out.push(issue('RENDERER_DPR_CONTRACT', surface, 'canvas', state ? {
        rendererDpr: state.rendererDpr, reportedBacking: [state.backingWidth, state.backingHeight],
        canvasBacking: [canvas.width, canvas.height],
      } : null, { rendererDpr: expectedDpr, reportedBacking: 'matches live canvas backing' }));
    }
    const backingPixels = canvas.width * canvas.height;
    if (backingPixels > maxBackingPixels) {
      out.push(issue('CANVAS_BACKING_PIXEL_CEILING', surface, 'canvas', {
        width: canvas.width, height: canvas.height, pixels: backingPixels,
        css: [round(r.width), round(r.height)], rendererDpr: state?.rendererDpr ?? null,
      }, { maxPixels: maxBackingPixels, rationale: '4096² bounded backing-store budget at 8K and extreme aspect ratios' }));
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
    panel.innerHTML = '<button data-control-close style="width:44px;height:44px">close</button>';
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
    let panelResult = panelCloseOutcome('#cf-control-panel', '[data-control-close]', '#cf-control-panel-opener', '#cf-control-preserved');
    if (!panelResult.ok) failures.push('panel centre-close positive control failed: ' + JSON.stringify(panelResult));
    panel.style.display = 'block';
    const panelShield = document.createElement('div'); panelShield.id = 'cf-control-panel-shield'; panelShield.style.cssText = 'position:fixed;left:200px;top:8px;width:44px;height:44px;z-index:1002'; document.body.appendChild(panelShield);
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
    navigationOutcome, openFocusOutcome, forcedColorsOutcome, motionPolicyOutcome, panelCloseOutcome, openerOutcome, pressedOutcome,
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
  const recordControls = (...names) => {
    for (const name of names) {
      if (!NEGATIVE_CONTROLS.includes(name)) throw new Error(`unknown negative control ${JSON.stringify(name)}`);
      executedControls.add(name);
    }
  };
  for (const failure of await reloadPhaseSelftest()) {
    instrumentFailures.push(`RELOAD PHASE SELFTEST ${failure}`);
  }
  recordControls('replacement-document-loader-token-phase', 'reload-resource-release');
  let controlsRun = false, hpControlRun = false, settingsWidthControlRun = false,
    planetsideControlRun = false, panelPlanetsideControlRun = false,
    chromeYieldControlRun = false, chromeRestoreControlRun = false, chromeLandscapeControlRun = false,
    objectiveYieldControlRun = false, topChromeControlRun = false, portraitBandControlRun = false,
    portraitFallbackControlRun = false,
    modalControlRun = false, modalLiveControlRun = false, closeLabelControlRun = false,
    hiddenOpenerControlRun = false, reloadBindingControlRun = false;
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
      let contextSequence = 0, currentTopLoaderId = null;
      const runtimeContexts = new Map();
      const reloadEvents = [], reloadReleaseWitnesses = [], reloadReadyWitnesses = [],
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
          && [RELOAD_RELEASE_BINDING, SLICE_READY_BINDING].includes(event.params?.name)) {
          const executionContextId = event.params.executionContextId ?? null;
          const context = runtimeContexts.get(executionContextId);
          const validation = event.params.name === RELOAD_RELEASE_BINDING
            ? validateReloadReleaseWitness(event.params.payload)
            : validateSliceReadyWitness(event.params.payload);
          const target = event.params.name === RELOAD_RELEASE_BINDING
            ? reloadReleaseWitnesses : reloadReadyWitnesses;
          target.push({
            at, sessionId: event.sessionId || null, executionContextId,
            loaderId: currentTopLoaderId, context: context ? { ...context } : null,
            validation,
          });
          pushBoundedReloadEvent(reloadEvents, {
            at, method: 'Runtime.bindingCalled', name: event.params.name,
            executionContextId,
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
        await send('Runtime.addBinding', { name: RELOAD_RELEASE_BINDING }, session);
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
        const waitForReload = async (label, priorToken, priorFrame, priorContext, {
          importTimeoutMs = IMPORT_SETTLE_TIMEOUT_MS,
          navigationTimeoutMs = NAVIGATION_COMMIT_TIMEOUT_MS,
          replacementTimeoutMs = REPLACEMENT_READY_TIMEOUT_MS,
          } = {}) => {
          const beganAt = Date.now();
          const importDeadline = beganAt + importTimeoutMs;
          let navigationDeadline = null, bootDeadline = null, commit = null;
          const expectedOrigin = new URL(url).origin;
          const diagnostic = () => JSON.stringify({
            priorFrame, priorContext, expectedUrl: url, elapsedMs: Date.now() - beganAt,
            clocks: { importDeadline, navigationDeadline, bootDeadline,
              replacementLoaderId: commit?.loaderId || null },
            releaseWitnesses: reloadReleaseWitnesses,
            readyWitnesses: reloadReadyWitnesses,
            topNavigations: reloadTopNavigations,
            fatalEvents: reloadFatalEvents,
            commands: reloadCommands,
            events: reloadEvents,
          });
          const fail = (why) => {
            throw new Error(`${vp.label}/${label}: ${why} (evidence ${diagnostic()})`);
          };
          const confirmReady = async (readyRow) => {
            const confirmation = await runBoundedReadyConfirmation({
              send, sessionId: session, executionContextId: readyRow.executionContextId,
              bootDeadline,
              expression: `(()=>{ const S=window.__CF_SLICE__; try { const s=S?.api?.state(); return {
                  ready:!!s?.save,token:S?.documentToken||null,href:location.href,
                  readyState:document.readyState,viewConnected:!!S?.app?.canvas?.isConnected,
                  backingWidth:S?.app?.canvas?.width||0,backingHeight:S?.app?.canvas?.height||0};
                } catch(error) { return {ready:false,token:S?.documentToken||null,href:location.href,
                  readyState:document.readyState,error:String(error?.message||error)}; } })()`,
            });
            if (confirmation.command) reloadCommands.push(confirmation.command);
            if (!confirmation.ok) fail(confirmation.why);
            const result = confirmation.result;
            if (result.exceptionDetails) {
              fail(`bounded slice-ready confirmation threw (${String(result.exceptionDetails.exception?.description
                || result.exceptionDetails.text || 'page evaluation failed')})`);
            }
            const state = result.result?.value;
            const witnessed = readyRow.validation.witness;
            if (!state?.ready || state.token !== witnessed.token || state.href !== url
              || state.readyState !== 'complete' || state.viewConnected !== true
              || state.backingWidth !== witnessed.backingWidth
              || state.backingHeight !== witnessed.backingHeight) {
              fail(`bounded slice-ready confirmation disagreed with the witness (${JSON.stringify(state)})`);
            }
            const active = runtimeContexts.get(readyRow.executionContextId);
            if (!active || active.uniqueId !== readyRow.context?.uniqueId
              || currentTopLoaderId !== commit.loaderId) {
              fail('replacement context/loader changed during slice-ready confirmation');
            }
            if (reloadFatalEvents.length) {
              fail(`replacement target failed (${JSON.stringify(reloadFatalEvents[0])})`);
            }
            const navigationNow = replacementNavigationOutcome(reloadTopNavigations, {
              priorLoaderId: priorFrame.loaderId, priorFrameId: priorFrame.frameId,
              expectedUrl: url, releaseAt: reloadReleaseWitnesses[0].at, navigationDeadline,
            });
            if (navigationNow.status !== 'ready' || navigationNow.row.loaderId !== commit.loaderId) {
              fail(`replacement loader changed during confirmation (${navigationNow.why || navigationNow.status})`);
            }
            return state;
          };
          while (true) {
            if (reloadFatalEvents.length) fail(`replacement target failed (${JSON.stringify(reloadFatalEvents[0])})`);
            const release = importReleaseOutcome(reloadReleaseWitnesses, {
              priorToken, priorLoaderId: priorFrame.loaderId, priorFrameId: priorFrame.frameId,
              priorContextUniqueId: priorContext.uniqueId,
              priorContextGeneration: priorContext.generation, expectedOrigin,
              expectedSessionId: session, importDeadline,
            });
            if (release.status === 'failed') fail(`reload resource release failed closed (${release.why})`);
            if (release.status === 'pending') {
              if (reloadReadyWitnesses.length) fail('slice-ready witness arrived before import release/navigation');
              if (Date.now() >= importDeadline) fail(`import transaction did not settle within ${importTimeoutMs}ms`);
              await sleep(20);
              continue;
            }
            navigationDeadline ??= release.row.at + navigationTimeoutMs;
            const navigation = replacementNavigationOutcome(reloadTopNavigations, {
              priorLoaderId: priorFrame.loaderId, priorFrameId: priorFrame.frameId,
              expectedUrl: url, releaseAt: release.row.at, navigationDeadline,
            });
            if (navigation.status === 'failed') fail(`import/reload failed closed (${navigation.why})`);
            if (navigation.status === 'pending') {
              if (reloadReadyWitnesses.length) fail('slice-ready witness arrived before replacement navigation committed');
              if (Date.now() >= navigationDeadline) {
                fail(`top-frame loader did not change within ${navigationTimeoutMs}ms after resource release`);
              }
              await sleep(20);
              continue;
            }
            commit ??= navigation.row;
            bootDeadline ??= commit.at + replacementTimeoutMs;
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
                fail(`replacement document did not emit boot-ready within ${replacementTimeoutMs}ms after the loader changed`);
              }
              await sleep(20);
              continue;
            }
            const state = await confirmReady(readyOutcome.row);
            const now = Date.now();
            return {
              ...state, elapsedMs: now - beganAt,
              reloadEvidence: {
                priorLoaderId: priorFrame.loaderId,
                replacementLoaderId: commit.loaderId,
                elapsedMs: now - beganAt,
                releaseWitness: release.row,
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
        const expectedDpr = Math.min(
          vp.dpr,
          vp.mobile ? 2 : 3,
          Math.sqrt(MAX_BACKING_PIXELS / (vp.width * vp.height)),
        );
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
          canvas: true, expectedDpr, maxBackingPixels: MAX_BACKING_PIXELS,
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
            reloadReleaseWitnesses.length = 0;
            reloadReadyWitnesses.length = 0;
            reloadTopNavigations.length = 0;
            reloadFatalEvents.length = 0;
            reloadCommands.length = 0;
            reloadCaptureArmed = true;
            try {
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
                backingWidth:S.app.canvas.width,backingHeight:S.app.canvas.height,performanceNow:performance.now()});
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
              reloadReleaseWitnesses.length = 0;
              reloadReadyWitnesses.length = 0;
              reloadTopNavigations.length = 0;
              reloadFatalEvents.length = 0;
              reloadCommands.length = 0;
              requestUrls.clear();
            }
          }
          const phaseId = crypto.randomUUID();
          reloadEvents.length = 0;
          reloadReleaseWitnesses.length = 0;
          reloadReadyWitnesses.length = 0;
          reloadTopNavigations.length = 0;
          reloadFatalEvents.length = 0;
          reloadCommands.length = 0;
          requestUrls.clear();
          reloadCaptureArmed = true;
          try {
            const armed = await evalIn(`(()=>{ const S=window.__CF_SLICE__;
              if(!S?.api?.importBlob||S.documentToken!==${JSON.stringify(priorToken)})return {armed:false,why:'slice/token changed before import arm'};
              const phase={id:${JSON.stringify(phaseId)},status:'import-pending',error:null};
              Object.defineProperty(window,'__CF_GLASS_RELOAD_PHASE__',{value:phase,writable:false,configurable:true});
              try {
                const pending=S.api.importBlob(${JSON.stringify(VETERAN_PREF_RAW)});
                void Promise.resolve(pending).then((error)=>{
                  if(error===null)phase.status='reload-requested';
                  else { phase.status='import-rejected'; phase.error=String(error||'import returned no success'); }
                },(error)=>{ phase.status='import-threw'; phase.error=String(error?.message||error); });
              } catch(error) { phase.status='import-threw'; phase.error=String(error?.message||error); }
              return {armed:true,token:S.documentToken,phase:{...phase}};
            })()`);
            if (!armed?.armed || armed.token !== priorToken || armed.phase?.id !== phaseId) {
              throw new Error(`${vp.label}/preference fixture import: could not arm observed replacement transaction (${JSON.stringify(armed)})`);
            }
            ready = await waitForReload('preference fixture import', priorToken, priorFrame, priorContext);
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
          const canvasControl = await evalIn(`(()=>{ const canvas=document.querySelector('canvas'),prior=[canvas.style.width,canvas.style.height]; canvas.style.width=Math.max(100,innerWidth/2)+'px';const out=window.__CF_GLASS_AUDIT__.canvasIssues('selftest',Math.min(devicePixelRatio,2));canvas.style.width=prior[0];canvas.style.height=prior[1];return out;})()`);
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
          canvas: true, expectedDpr, maxBackingPixels: MAX_BACKING_PIXELS,
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
        add(vp.label, 'survey', await audit({
          ...common, surface: 'survey', root: '#survey', textMin: 80,
          required: [{ selector: '[data-sel=title]', min: 1, textMin: 5 }, { selector: '[data-row]', min: 3 }, { selector: '[data-act=landcta]', min: 1 }],
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
            const bandControl = await evalIn(`(()=>{ const side=document.getElementById('planetside'),prior=side.getAttribute('style'),tall=document.createElement('div');
              tall.setAttribute('data-cf-control','portrait-tall-content');tall.style.height='96px';side.appendChild(tall);side.style.setProperty('max-height','none','important');
              const result=${portraitBandCheck};tall.remove();if(prior===null)side.removeAttribute('style');else side.setAttribute('style',prior);return result;})()`);
            if (bandControl.ok || !bandControl.trailVisible || !(bandControl.gap < 5.5)) {
              instrumentFailures.push(`${vp.label}: removed-cap/tall-content control did not reproduce the visible trail collision (${JSON.stringify(bandControl)})`);
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
        add(vp.label, 'guide', await audit({
          ...common, surface: 'guide', root: '#guidepanel', textMin: 200,
          required: [{ selector: '[data-pnx]', min: 1 }, { selector: '#guidesearch', min: 1 }, { selector: '[data-guide-releases]', min: 1 }, { selector: '.guide-category', min: 9, textMin: 180 }],
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
        await evalIn(`document.querySelector('#guidepanel .guide-tools [data-guide-releases]')?.click()`);
        await waitFor('release archive', `document.querySelectorAll('#guidepanel [data-release-index]').length>=50`);
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
          await send('Emulation.setDeviceMetricsOverride', { width: dprWidth, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile }, session);
          await sleep(500);
          const liveDpr = await evalIn('devicePixelRatio');
          if (Math.abs(liveDpr - 1) > 0.01) instrumentFailures.push(`${vp.label}: live DPR override did not reach the document (${liveDpr})`);
          add(vp.label, 'dpr-change', await audit({
            ...common, surface: 'dpr-change', root: '#dock', textMin: 1,
            viewportExpected: { width: dprWidth, height: vp.height, dpr: 1 },
            interactiveRoots: ['#dock'], contrastSelectors: [], canvas: true, expectedDpr: 1,
            maxBackingPixels: MAX_BACKING_PIXELS,
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
        instrumentFailures.push(`${vp.label}: ${error.message}`);
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
  if (!controlsRun) instrumentFailures.push('injected matrix controls never ran');
  if (!hpControlRun) instrumentFailures.push('HP dual-background contrast control never ran');
  if (!settingsWidthControlRun) instrumentFailures.push('Settings horizontal-overflow control never ran');
  if (!planetsideControlRun) instrumentFailures.push('Planetside surface-ownership controls never ran');
  if (!panelPlanetsideControlRun) instrumentFailures.push('panel/Planetside synthesized layering control never ran');
  if (!chromeYieldControlRun) instrumentFailures.push('mobile chrome yield control never ran');
  if (!chromeRestoreControlRun) instrumentFailures.push('mobile chrome restore-direction control never ran');
  if (!objectiveYieldControlRun && MATRIX_VIEWPORTS.some((vp) => vp.width <= 900)) {
    instrumentFailures.push('mobile landed-objective yield control never ran');
  }
  if (!topChromeControlRun) instrumentFailures.push('Planetside/top-chrome clearance control never ran');
  if (!portraitBandControlRun && MATRIX_VIEWPORTS.some((vp) => vp.width <= 900 && vp.width <= vp.height)) {
    instrumentFailures.push('Planetside portrait-band viability control never ran');
  }
  if (!portraitFallbackControlRun && MATRIX_VIEWPORTS.some((vp) => vp.width <= 900 && vp.width <= vp.height)) {
    instrumentFailures.push('Planetside portrait trail-fallback control never ran');
  }
  if (!modalControlRun) instrumentFailures.push('import modal containment control never ran');
  if (!modalLiveControlRun) instrumentFailures.push('import live-error control never ran');
  if (!closeLabelControlRun) instrumentFailures.push('panel close accessible-name control never ran');
  if (!hiddenOpenerControlRun && MATRIX_VIEWPORTS.some((vp) => vp.width > 900)) {
    instrumentFailures.push('hidden panel-opener focus fallback control never ran');
  }
  if (!reloadBindingControlRun) instrumentFailures.push('live slice-ready binding controls never ran');
  const browser = browserVersions.length ? {
    ...browserVersions[0],
    consistentAcrossViewports: browserVersions.every((row) => JSON.stringify(row) === JSON.stringify(browserVersions[0])),
  } : null;
  if (browser && !browser.consistentAcrossViewports) instrumentFailures.push('browser version changed within the matrix');
  const omittedControls = NEGATIVE_CONTROLS.filter((name) => !executedControls.has(name));
  if (!viewportLabel && omittedControls.length) {
    instrumentFailures.push(`full matrix omitted planned negative controls: ${omittedControls.join(', ')}`);
  }
  if (instrumentFailures.length) {
    writeReport({ status: 'instrument-fail', exitCode: 2, browser, findings, instrumentFailures, controlsRun, executedControls: [...executedControls] });
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
    writeReport({ status: 'fail', exitCode: 1, browser, findings, instrumentFailures, controlsRun, executedControls: [...executedControls] });
    const counts = new Map();
    for (const { row } of findings) counts.set(row.code, (counts.get(row.code) || 0) + 1);
    console.error(`GLASS MATRIX PRODUCT FINDINGS — ${findings.length} across ${MATRIX_VIEWPORTS.length} viewport classes`);
    console.error('COUNTS ' + JSON.stringify(Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)))));
    for (const finding of findings) console.error('- ' + formatIssue(finding.context, finding.row));
    process.exitCode = 1;
    return;
  }
  writeReport({ status: 'pass', exitCode: 0, browser, findings, instrumentFailures, controlsRun, executedControls: [...executedControls] });
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
