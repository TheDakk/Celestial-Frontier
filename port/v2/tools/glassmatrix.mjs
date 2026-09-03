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
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { buildCompendiumFixture } from './compendiummem-fixture.mjs';
import {
  GLASS_VETERAN_CAPTURE_ORACLE,
  GLASS_VETERAN_PREF_RAW as VETERAN_PREF_RAW,
  GLASS_VETERAN_PREF_RAW_SHA256,
  glassEngineeringFixtureOutcome,
  glassVeteranPreferenceRaw,
} from './glass-engineering-fixture-contract.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';
import { verifySliceRunEvidence } from './smokereport.mjs';
import {
  GLASS_ARC4_CAPTURE_CHECK_KEYS,
  GLASS_ARC4_CAPTURE_OUTCOME_CODES,
  GLASS_MATRIX_VIEWPORTS,
  GLASS_NEGATIVE_CONTROLS,
  glassTerminalEvidenceErrors,
} from './glassmatrix-evidence-contract.mjs';
import {
  ENGINEERING_ACTION_CONTROL_COUNT,
  ENGINEERING_GLASS_RECIPE_ORACLE,
  ENGINEERING_GLASS_RESEARCH_ORACLE,
  ENGINEERING_RECIPE_GROUPS,
  ENGINEERING_RECIPE_IDS,
  ENGINEERING_RESEARCH_IDS,
  hasUnnegatedSentenceClaim,
} from './engineering-browser-contract.mjs';
import {
  ARC4_CAPTURE_GEOMETRY_EVIDENCE_SCHEMA,
  ARC4_CAPTURE_LAYOUT_COORDINATE_SPACE,
  ARC4_CONTROL_GEOMETRY_EVIDENCE_SCHEMA,
  ARC4_HEARTBEAT_RERENDER_EVIDENCE_SCHEMA,
  ARC4_CAPTURE_UI_EVIDENCE_SCHEMA,
  ARC4_CAPTURE_UI_EXPRESSION,
  ARC4_CAPTURE_VERBS,
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
  arc4DurableEvidenceComplete,
  arc4CaptureUiSnapshotComplete,
  assessArc4DurableEvidence,
  assessArc4CaptureCardGeometryFocus,
  assessArc4CaptureGeometryEvidenceCoherence,
  assessArc4HeartbeatRerenderEvidence,
  buildArc4DurableReadExpression,
  projectArc4V4OwnedCounters,
  projectArc5OwnershipMigrationEvidence,
} from './arc4-browser-contract.mjs';

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
const decodeCF1Payload = (code) => {
  if (typeof code !== 'string' || !code.startsWith('CF1-')) return null;
  try {
    const payload = JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8'));
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null;
  } catch {
    return null;
  }
};
const encodeCF1Payload = (payload) => 'CF1-'
  + Buffer.from(JSON.stringify(payload)).toString('base64url').replace(/=+$/g, '');
const withCF1PlanetSeed = (code, seed) => {
  const payload = decodeCF1Payload(code);
  if (!payload) return null;
  return encodeCF1Payload({ ...payload, p: seed });
};
const startedAt = Date.now();
let runSource = null;
let runEndingSource = null;
let runPredecessors = null;
let runArtifactReserved = false;
let runReloadEvidence = [];
let runViewportTimings = [];
let runArc4CaptureOutcomes = [];
class ProductAnswerabilityFinding extends Error {
  constructor(message, evidence, finding = null) {
    super(message);
    this.name = 'ProductAnswerabilityFinding';
    this.evidence = evidence;
    this.finding = finding;
  }
}
class GlassInstrumentControlStop extends Error {
  constructor(message) {
    super(message);
    this.name = 'GlassInstrumentControlStop';
  }
}

function stopAtFirstGlassInstrumentFailure(state, failures, message) {
  if (!state || typeof state !== 'object' || !Array.isArray(failures)) {
    throw new TypeError('Glass instrument causal-stop requires mutable state and a failure ledger');
  }
  if (!(state.error instanceof GlassInstrumentControlStop)) {
    if (failures.length > 1) failures.splice(1);
    const failure = failures.length
      ? String(failures[0])
      : String(message || 'unknown Glass instrument control failure');
    if (!failures.length) failures.push(failure);
    state.error = new GlassInstrumentControlStop(failure);
  }
  throw state.error;
}

function recordGlassInstrumentFailure(state, failures, message, armed = false) {
  if (!state || typeof state !== 'object' || !Array.isArray(failures)) {
    throw new TypeError('Glass instrument failure recording requires mutable state and a failure ledger');
  }
  Array.prototype.push.call(failures, String(message));
  if (armed === true) stopAtFirstGlassInstrumentFailure(state, failures, failures[0]);
  return failures.length;
}

function recordGlassProductFinding(findings, viewport, surface, row, armed = false) {
  if (!Array.isArray(findings) || typeof viewport !== 'string' || !viewport
    || typeof surface !== 'string' || !surface || !row || typeof row !== 'object'
    || typeof row.code !== 'string' || !row.code) {
    throw new TypeError('Glass product finding recording requires a ledger, viewport, surface, and coded row');
  }
  Array.prototype.push.call(findings, { context: { viewport, surface }, row });
  if (armed === true) {
    throw new ProductAnswerabilityFinding(
      `${viewport}: ${row.code} was the first product red, so dependent outcomes were not run`,
      row.actual ?? row,
      {
        code: row.code,
        surface: typeof row.surface === 'string' && row.surface ? row.surface : surface,
        element: row.element ?? surface,
        expected: row.expected,
        alreadyRecorded: true,
      },
    );
  }
  return findings.length;
}

export function prepareInventoryActionOffscreen(button, card, prior, viewport, hitTest) {
  const valid = button && card && prior?.ok === true && Number.isFinite(prior.saved)
    && !(prior.styleAttribute !== null && typeof prior.styleAttribute !== 'string')
    && typeof prior.transform === 'string' && typeof prior.transformPriority === 'string'
    && viewport && Number.isFinite(viewport.width) && viewport.width > 0
    && Number.isFinite(viewport.height) && viewport.height > 0
    && typeof button.getBoundingClientRect === 'function'
    && typeof button.getAttribute === 'function'
    && button.style && typeof button.style.setProperty === 'function'
    && typeof button.style.getPropertyValue === 'function'
    && typeof button.style.getPropertyPriority === 'function'
    && typeof card.contains === 'function' && card.contains(button)
    && button.isConnected === true && card.isConnected === true
    && card.scrollTop === prior.saved
    && button.getAttribute('style') === prior.styleAttribute
    && button.style.getPropertyValue('transform') === prior.transform
    && button.style.getPropertyPriority('transform') === prior.transformPriority
    && typeof hitTest === 'function';
  if (!valid) {
    return {
      ok: false, mutationApplied: false, mode: null,
      why: 'invalid offscreen setup owner', target: null,
    };
  }
  const measure = () => {
    const rect = button.getBoundingClientRect();
    const values = [rect?.left, rect?.top, rect?.right, rect?.bottom];
    if (!values.every(Number.isFinite)) {
      return { ok: false, rect: null, x: null, y: null, hit: null, fullyOutside: false };
    }
    const width = rect.right - rect.left, height = rect.bottom - rect.top;
    const x = (rect.left + rect.right) / 2, y = (rect.top + rect.bottom) / 2;
    const hit = hitTest(x, y) ?? null;
    return {
      ok: width >= 44 && height >= 44,
      rect: values,
      x,
      y,
      hit: hit === null ? null
        : (hit.getAttribute?.('data-inventory-action') || hit.tagName || 'owned-element'),
      fullyOutside: rect.right <= 0 || rect.left >= viewport.width
        || rect.bottom <= 0 || rect.top >= viewport.height,
    };
  };

  card.scrollTop = 0;
  const scrollTarget = measure();
  const scrollDisplaced = prior.saved > 0 && card.scrollTop === 0;
  let mode = 'scroll', translated = false;
  if (!(scrollDisplaced && scrollTarget.ok && scrollTarget.fullyOutside
    && scrollTarget.hit === null)) {
    mode = 'translated';
    button.style.setProperty('transform', 'translateY(calc(100vh + 128px))', 'important');
    const appliedTransform = button.style.getPropertyValue('transform');
    const appliedTransformPriority = button.style.getPropertyPriority('transform');
    translated = !!appliedTransform && appliedTransform !== prior.transform
      && appliedTransformPriority === 'important';
  }
  const target = measure();
  const appliedTransform = button.style.getPropertyValue('transform');
  const appliedTransformPriority = button.style.getPropertyPriority('transform');
  return {
    ok: card.scrollTop === 0 && target.ok && target.fullyOutside && target.hit === null
      && (mode === 'scroll' ? scrollDisplaced : translated),
    mutationApplied: true,
    saved: prior.saved,
    top: card.scrollTop,
    mode,
    translated,
    appliedTransform,
    appliedTransformPriority,
    scrollTarget,
    target,
  };
}

export function restoreInventoryActionOffscreen(button, card, prior, mutationApplied = true) {
  if (!button || !card || prior?.ok !== true || !Number.isFinite(prior.saved)
    || !(prior.styleAttribute === null || typeof prior.styleAttribute === 'string')
    || typeof prior.transform !== 'string' || typeof prior.transformPriority !== 'string'
    || typeof mutationApplied !== 'boolean'
    || typeof button.getAttribute !== 'function'
    || typeof button.setAttribute !== 'function'
    || typeof button.removeAttribute !== 'function'
    || !button.style || typeof button.style.getPropertyValue !== 'function'
    || typeof button.style.getPropertyPriority !== 'function') {
    return { ok: false, why: 'invalid offscreen restoration owner' };
  }
  const ownerStable = typeof card.contains === 'function' && card.contains(button)
    && button.isConnected === true && card.isConnected === true;
  if (mutationApplied) {
    if (prior.styleAttribute === null) button.removeAttribute('style');
    else button.setAttribute('style', prior.styleAttribute);
    card.scrollTop = prior.saved;
  }
  const observedStyleAttribute = button.getAttribute('style');
  const transform = observedStyleAttribute === null
    ? '' : button.style.getPropertyValue('transform');
  const transformPriority = observedStyleAttribute === null
    ? '' : button.style.getPropertyPriority('transform');
  /* Chromium may retain an empty style attribute through the first
     removeAttribute() while a live CSSStyleDeclaration is held. Finish the
     owned mutation with the exact captured attribute state, after retaining
     the pre-normalization transform evidence above. */
  if (mutationApplied && prior.styleAttribute === null) button.removeAttribute('style');
  const styleAttribute = button.getAttribute('style');
  const styleAttributeRestored = styleAttribute === prior.styleAttribute;
  return {
    ok: ownerStable && card.scrollTop === prior.saved && styleAttributeRestored
      && transform === prior.transform && transformPriority === prior.transformPriority,
    mutationApplied,
    ownerStable,
    scrollTop: card.scrollTop,
    styleAttribute,
    styleAttributeRestored,
    transform,
    transformPriority,
    styleRestored: styleAttributeRestored
      && transform === prior.transform && transformPriority === prior.transformPriority,
  };
}

export async function runInventoryOffscreenProbe({ setup, activate, restore }) {
  if (typeof setup !== 'function' || typeof activate !== 'function'
    || typeof restore !== 'function') {
    throw new TypeError('Inventory offscreen probe requires setup, activate, and restore owners');
  }
  let offscreenSetup = null, offscreenProbe = null, restored = null;
  let setupError = null, probeError = null, restorationError = null;
  let probeAttempted = false;
  try {
    try {
      offscreenSetup = await setup();
    } catch (error) {
      setupError = error instanceof Error ? error.message : String(error);
    }
    if (offscreenSetup?.ok === true && setupError === null) {
      probeAttempted = true;
      try {
        offscreenProbe = await activate();
      } catch (error) {
        probeError = error instanceof Error ? error.message : String(error);
      }
    }
  } finally {
    try {
      restored = await restore(offscreenSetup, setupError);
    } catch (error) {
      restorationError = error instanceof Error ? error.message : String(error);
    }
  }
  return {
    offscreenSetup,
    offscreenProbe,
    restored,
    setupError,
    probeError,
    restorationError,
    probeAttempted,
  };
}

const PREPARE_INVENTORY_ACTION_OFFSCREEN_SOURCE
  = `(${prepareInventoryActionOffscreen.toString()})`;
const RESTORE_INVENTORY_ACTION_OFFSCREEN_SOURCE
  = `(${restoreInventoryActionOffscreen.toString()})`;

export function buildInventoryActionOffscreenRestoreSource(prior, mutationApplied) {
  if (!prior || typeof prior !== 'object' || typeof mutationApplied !== 'boolean') {
    throw new TypeError('Inventory offscreen restoration source requires prior state and a mutation flag');
  }
  const priorSource = JSON.stringify(prior);
  if (typeof priorSource !== 'string') {
    throw new TypeError('Inventory offscreen restoration prior state is not serializable');
  }
  return `(()=>{const owner=window.__cfInventoryOffscreenOwner||null,
    prior=${priorSource},restore=${RESTORE_INVENTORY_ACTION_OFFSCREEN_SOURCE};
    delete window.__cfInventoryOffscreenOwner;return restore(owner?.button,owner?.card,prior,
      ${mutationApplied ? 'true' : 'false'});})()`;
}

/** Finalize the pending-action verdict after retaining every prerequisite's
 * diagnostics. The composite verdict is deliberately written last: a prior
 * control's `ok` field must never overwrite the action-level result. */
export function inventoryActionPendingOutcome({
  preActionInstrumentControl,
  realAction,
  receipt,
  actionState,
  expectedOperation,
  expectedInstanceId,
  expectedHoldOperation,
  expectedHoldSequence,
}) {
  const preAction = preActionInstrumentControl && typeof preActionInstrumentControl === 'object'
    ? preActionInstrumentControl : { ok: false, why: 'pending-action prerequisites missing' };
  const diagnostics = actionState?.diagnostics ?? null;
  const coordinator = actionState?.coordinator ?? null;
  const checks = {
    instrumentReady: preAction.ok === true,
    nativeActivation: realAction?.ok === true,
    trustedReceipt: receipt?.trusted === true,
    receiptOperation: receipt?.operation === expectedOperation,
    receiptInstance: receipt?.instanceId === expectedInstanceId,
    pendingBaseline: receipt?.baseline?.ok === true,
    pendingObserved: diagnostics?.pendingWork === 1,
    actionOwnerInFlight: coordinator?.inFlight === true,
    actionOwnerBusy: coordinator?.owner?.busy === true,
    actionOwnerOperation: coordinator?.owner?.operation === expectedHoldOperation,
    actionHoldPhase: coordinator?.hold?.phase === 'holding',
    actionHoldOperation: coordinator?.hold?.operation === expectedHoldOperation,
    actionHoldSequence: coordinator?.hold?.sequence === expectedHoldSequence,
  };
  const productPrerequisite = checks.nativeActivation && checks.trustedReceipt
    && checks.receiptOperation && checks.receiptInstance;
  const pendingOwnerExact = checks.pendingObserved && checks.actionOwnerInFlight
    && checks.actionOwnerBusy && checks.actionOwnerOperation
    && checks.actionHoldPhase && checks.actionHoldOperation && checks.actionHoldSequence;
  return {
    ...preAction,
    realAction,
    receipt,
    actionState,
    checks,
    productPrerequisite,
    pendingOwnerExact,
    ok: checks.instrumentReady && productPrerequisite
      && checks.pendingBaseline && pendingOwnerExact,
  };
}

/** Project one always-structured terminal observation. A refused or stale
 * exact action is terminal too, but remains red with its detail, authority,
 * revision, and binding evidence intact. */
export function inventoryActionSettlementSnapshot(diagnostics, state, expected) {
  const action = diagnostics?.lastAction ?? null;
  const inventory = state?.inventory ?? null;
  const coordinator = state?.engineering?.actionCoordinator ?? null;
  const persistence = state?.persistence ?? null;
  const terminalKinds = ['committed', 'unchanged', 'unavailable', 'refused'];
  const checks = {
    diagnosticsSchema: diagnostics?.schema === 'cf-v2-inventory-sheet-diagnostics/v1',
    actionIdentity: action?.operation === expected?.operation
      && action?.instanceId === expected?.instanceId,
    terminalKind: terminalKinds.includes(action?.kind),
    pendingCleared: diagnostics?.pendingWork === 0,
    modalOwned: diagnostics?.activeCount === 1,
    modalUnretained: diagnostics?.retainedCount === 0,
    selectionRetained: diagnostics?.selectedInstanceId === expected?.instanceId,
    committed: action?.kind === 'committed',
    revisionAdvanced: inventory?.revision === expected?.revision,
    bindingPublished: Array.isArray(inventory?.equippedBindings)
      && inventory.equippedBindings.some((binding) => binding?.instanceId === expected?.instanceId),
    actionOwnerIdle: coordinator?.inFlight === false && coordinator?.owner?.busy === false
      && coordinator?.owner?.operation === null,
    actionHoldReleased: coordinator?.hold?.phase === 'released'
      && coordinator?.hold?.operation === expected?.holdOperation
      && coordinator?.hold?.sequence === expected?.holdSequence,
    persistenceWritable: persistence?.mutationBlocked === false
      && persistence?.runtime?.leaseOwned === true,
  };
  const terminal = checks.actionIdentity && checks.terminalKind && checks.pendingCleared;
  const observationComplete = terminal && checks.actionOwnerIdle;
  return {
    schema: 'cf-v2-glass-inventory-action-settlement/v1',
    terminal,
    observationComplete,
    action,
    diagnostics,
    inventory: inventory === null ? null : {
      revision: inventory.revision ?? null,
      entryIds: Array.isArray(inventory.entryIds) ? inventory.entryIds : [],
      equippedBindings: Array.isArray(inventory.equippedBindings)
        ? inventory.equippedBindings : [],
      pendingIds: Array.isArray(inventory.pendingIds) ? inventory.pendingIds : [],
    },
    authority: { persistence, actionCoordinator: coordinator },
    checks,
    ok: terminal && checks.diagnosticsSchema && checks.modalOwned
      && checks.modalUnretained && checks.selectionRetained && checks.committed
      && checks.revisionAdvanced && checks.bindingPublished && checks.actionOwnerIdle
      && checks.actionHoldReleased && checks.persistenceWritable,
  };
}

const INVENTORY_ACTION_SETTLEMENT_SOURCE
  = `(${inventoryActionSettlementSnapshot.toString()})`;

export function buildInventoryActionSettlementSource(expected) {
  if (!expected || typeof expected !== 'object'
    || typeof expected.operation !== 'string' || !expected.operation
    || typeof expected.instanceId !== 'string' || !expected.instanceId
    || !Number.isSafeInteger(expected.revision) || expected.revision < 0
    || typeof expected.holdOperation !== 'string' || !expected.holdOperation
    || !Number.isSafeInteger(expected.holdSequence) || expected.holdSequence < 1) {
    throw new TypeError('Inventory action settlement source requires an expected terminal owner');
  }
  const expectedSource = JSON.stringify(expected);
  if (typeof expectedSource !== 'string') {
    throw new TypeError('Inventory action settlement owner is not serializable');
  }
  return `(()=>{try{const S=window.__CF_SLICE__,snapshot=${INVENTORY_ACTION_SETTLEMENT_SOURCE};
    return snapshot(S?.api?.inventoryDiagnostics?.(),S?.api?.state?.(),${expectedSource});
    }catch(error){return {schema:'cf-v2-glass-inventory-action-settlement/v1',terminal:false,
      observationComplete:false,ok:false,error:String(error?.message||error),action:null,diagnostics:null,inventory:null,
      authority:null,checks:null};}})()`;
}

function collectGlassProductRows(findings, viewport, surface, rows, armed = false) {
  for (const row of rows || []) {
    recordGlassProductFinding(findings, viewport, surface, row, armed);
  }
  return findings.length;
}

function collectGlassProductOutcome(findings, viewport, surface, code, element, outcome, expected, armed = false) {
  if (outcome?.ok !== true) {
    recordGlassProductFinding(findings, viewport, surface,
      { code, surface, element, actual: outcome, expected }, armed);
  }
  return findings.length;
}

function productBlockedRowsForCausalStop(selectedViewport, viewport, findingCode, executedControls = []) {
  const executed = new Set(executedControls);
  return selectedViewport
    ? productBlockedSuffixForViewport(viewport, findingCode, executedControls)
    : NEGATIVE_CONTROLS.filter((name) => !executed.has(name))
      .map((name) => ({ name, viewport, findingCode }));
}

function shouldStopGlassViewportLoop(causalProductStop) {
  return causalProductStop !== null && causalProductStop !== undefined;
}

function recordRenderedGuideIngressResult({
  findings, instrumentState, instrumentFailures, viewport, ingress, armed = false,
}) {
  if (ingress?.product === null || ingress?.product === undefined) {
    recordGlassInstrumentFailure(instrumentState, instrumentFailures,
      `${viewport}: rendered F2 Guide baseline setup failed (${JSON.stringify(ingress)})`, armed);
    return { productFindings: findings.length, instrumentFailures: instrumentFailures.length };
  }
  collectGlassProductOutcome(findings, viewport, 'guide-rendered-copy',
    'GUIDE_RENDERED_COPY_CONTRACT', '#guidepanel .guide-topic', ingress?.product,
    'all current Guide topics render their exact current-slice required copy without stale claims', armed);
  if (ingress.product.ok !== true) {
    return { productFindings: findings.length, instrumentFailures: instrumentFailures.length };
  }
  if (ingress?.instrument?.ok !== true) {
    recordGlassInstrumentFailure(instrumentState, instrumentFailures,
      `${viewport}: rendered F2 Guide negative controls failed (${JSON.stringify(ingress)})`, armed);
  }
  return { productFindings: findings.length, instrumentFailures: instrumentFailures.length };
}

export function stopAfterRecordedProductOutcome(viewport, surface, code, element, outcome, expected) {
  if (outcome?.ok === true) return;
  throw new ProductAnswerabilityFinding(
    `${viewport}: ${code} was red, so dependent outcomes in this viewport were not run`,
    outcome,
    { code, surface, element, expected, alreadyRecorded: true },
  );
}
/* Read the durable Arc 2 carrier rather than trusting Main's diagnostics as
   its own oracle. The Inventory outcome joins these exact bytes to the DOM;
   a stale UI and a stale diagnostic cannot agree their way to green. */
const READ_ARC2_GLASS_CARRIER_EXPRESSION = `(async()=>{const open=indexedDB.open('cf-v2-slice');
  const db=await new Promise((resolve,reject)=>{open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error)});
  try{const tx=db.transaction('inventory','readonly'),done=new Promise((resolve,reject)=>{
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Arc 2 glass read aborted'))});
    const request=tx.objectStore('inventory').get('v5:inventory');
    const raw=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
    await done;const row=(()=>{try{return JSON.parse(String(raw))}catch{return null}})(),carrier=row?.extensions?.['arc2.loot']??null,
      arc2=(()=>{try{return JSON.parse(String(carrier?.json))}catch{return null}})();
    return {rowSchema:row?.schema??null,rowSegment:row?.segment??null,carrierVersion:carrier?.version??null,
      carrierJson:carrier?.json??null,arc2};
  }finally{db.close()}})()`;

const VIEWPORTS = GLASS_MATRIX_VIEWPORTS;
const cliArgs = process.argv.slice(2);
const viewportArg = cliArgs.find((arg) => arg.startsWith('--viewport='));
const viewportLabel = viewportArg ? viewportArg.slice('--viewport='.length) : null;
const sliceRunArg = cliArgs.find((arg) => arg.startsWith('--slice-run='));
const selectedSliceRunId = sliceRunArg ? sliceRunArg.slice('--slice-run='.length) : null;
const verifyRunArg = cliArgs.find((arg) => arg.startsWith('--verify-run='));
const selectedVerifyRunId = verifyRunArg ? verifyRunArg.slice('--verify-run='.length) : null;
const profileArg = cliArgs.find((arg) => arg.startsWith('--profile='));
const selectedAssuranceProfile = profileArg
  ? /^(?:--profile=)(develop|production)$/.exec(profileArg)?.[1] ?? null
  : null;
const currentReportPath = path.join(evidenceDir, viewportLabel
  ? `glassmatrix-${viewportLabel}-diagnostic.json` : 'glassmatrix-report.json');
const selftestOnly = cliArgs.includes('--selftest');
const unknownArgs = cliArgs.filter((arg) => arg !== '--selftest'
  && !arg.startsWith('--viewport=') && !arg.startsWith('--slice-run=')
  && !arg.startsWith('--verify-run=') && !arg.startsWith('--profile='));
const singletonPrefixes = ['--viewport=', '--slice-run=', '--verify-run=', '--profile='];
const duplicateSingleton = [viewportArg, sliceRunArg, verifyRunArg, profileArg]
  .some((value, index) => value
    && cliArgs.filter((arg) => arg.startsWith(singletonPrefixes[index])).length !== 1);
if (unknownArgs.length || duplicateSingleton
  || (profileArg && !selectedAssuranceProfile)
  || (sliceRunArg && !selectedSliceRunId)
  || (verifyRunArg && !selectedVerifyRunId)
  || (selftestOnly && cliArgs.length !== 1)
  || (viewportArg && (sliceRunArg || verifyRunArg || profileArg))
  || (verifyRunArg && (!sliceRunArg || !profileArg || cliArgs.length !== 3))) {
  throw new Error('usage: node tools/glassmatrix.mjs [--slice-run=<Slice-run-id> --profile=develop|production | --viewport=<label> | --selftest | --verify-run=<Glass-run-id> --slice-run=<Slice-run-id> --profile=develop|production]');
}
const MATRIX_VIEWPORTS = viewportLabel ? VIEWPORTS.filter((vp) => vp.label === viewportLabel) : VIEWPORTS;
if (viewportLabel && MATRIX_VIEWPORTS.length !== 1) {
  throw new Error(`unknown --viewport=${JSON.stringify(viewportLabel)}; choose ${VIEWPORTS.map((vp) => vp.label).join(', ')}`);
}

function git(args, { raw = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot, encoding: raw ? null : 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const detail = Buffer.isBuffer(error?.stderr)
      ? error.stderr.toString('utf8').trim() : String(error?.stderr || '').trim();
    throw new Error(`required git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
}
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
const RUN_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,95}$/i;
function assertEvidenceRunId(runId, kind = 'evidence') {
  if (!RUN_ID_PATTERN.test(runId || '')) throw new Error(`invalid ${kind} run ID: ${JSON.stringify(runId)}`);
  return runId;
}
function generatedGlassRunId() {
  return [new Date(startedAt).toISOString().replace(/[^0-9]/g, '').slice(0, 17),
    String(process.pid), crypto.randomBytes(6).toString('hex')].join('-');
}
const activeGlassRunId = selftestOnly || selectedVerifyRunId ? null
  : assertEvidenceRunId(process.env.CF_V2_GLASSMATRIX_RUN_ID || generatedGlassRunId(), 'Glass');
function glassArtifactPaths(runId, directory = evidenceDir) {
  assertEvidenceRunId(runId, 'Glass');
  return {
    report: path.join(directory, `glassmatrix-${runId}.json`),
    reportRelative: `apps/game/smoke/glassmatrix-${runId}.json`,
  };
}
function atomicWriteFile(targetPath, bytes) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporary = path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx' });
    fs.renameSync(temporary, targetPath);
  } finally {
    try { fs.unlinkSync(temporary); } catch { /* rename or cleanup already removed it */ }
  }
}
function atomicCreateFile(targetPath, bytes) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporary = path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx' });
    fs.linkSync(temporary, targetPath);
  } finally {
    try { fs.unlinkSync(temporary); } catch { /* link/create failure cleanup */ }
  }
}
function atomicWriteJson(targetPath, value) {
  atomicWriteFile(targetPath, JSON.stringify(value, null, 2) + '\n');
}
function sameEvidenceSource(left, right) {
  return !!left && !!right && left.commit === right.commit && left.branch === right.branch
    && left.state === right.state && left.statusSha256 === right.statusSha256
    && left.workingTreeSha256 === right.workingTreeSha256;
}
function slicePredecessorDescriptor(verification) {
  return {
    schema: verification.report.schema,
    assuranceProfile: verification.assuranceProfile,
    runId: verification.report.run.id,
    reportPath: verification.artifacts.reportRelative,
    reportSha256: verification.reportSha256,
    rawLogPath: verification.report.rawLog.path,
    rawLogSha256: verification.report.rawLog.sha256,
    source: { ...verification.report.source },
  };
}
function sourceBytes(value, label) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') return Buffer.from(value);
  throw new Error(`required git ${label} returned non-byte output`);
}
function sourceSnapshot({ gitCommand = git, sourceRoot = repoRoot } = {}) {
  const status = sourceBytes(
    gitCommand(['status', '--porcelain=v1', '-z', '--untracked-files=all'], { raw: true }),
    'status',
  );
  const diff = sourceBytes(
    gitCommand(['diff', '--binary', '--no-ext-diff', 'HEAD', '--'], { raw: true }),
    'diff',
  );
  const untracked = sourceBytes(
    gitCommand(['ls-files', '--others', '--exclude-standard', '-z'], { raw: true }),
    'ls-files',
  ).toString('utf8').split('\0').filter(Boolean).sort();
  const digest = crypto.createHash('sha256');
  digest.update('tracked-diff\0').update(diff).update('\0untracked\0');
  const rootPrefix = sourceRoot.endsWith(path.sep) ? sourceRoot : sourceRoot + path.sep;
  for (const relative of untracked) {
    const absolute = path.resolve(sourceRoot, relative);
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
function sourceIdentity({
  gitCommand = git, environment = process.env, expectedRepoRoot = repoRoot,
} = {}) {
  const expectedRoot = fs.realpathSync(expectedRepoRoot);
  const observedRoot = fs.realpathSync(
    String(gitCommand(['rev-parse', '--show-toplevel'])).trim(),
  );
  if (observedRoot !== expectedRoot) {
    throw new Error(`git root mismatch: expected ${expectedRoot}, observed ${observedRoot}`);
  }
  const snapshot = sourceSnapshot({ gitCommand, sourceRoot: expectedRoot });
  const commit = String(gitCommand(['rev-parse', 'HEAD'])).trim();
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`git HEAD is not one full commit: ${JSON.stringify(commit)}`);
  }
  if (environment.GITHUB_SHA !== undefined && environment.GITHUB_SHA !== commit) {
    throw new Error(`GITHUB_SHA does not match git HEAD: expected ${commit}, observed ${environment.GITHUB_SHA}`);
  }
  const branchName = String(gitCommand(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  if (!branchName) throw new Error('git branch identity is empty');
  return {
    commit,
    branch: branchName === 'HEAD' ? 'detached' : branchName,
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
const NEGATIVE_CONTROLS = GLASS_NEGATIVE_CONTROLS;

const ARC4_CAPTURE_OUTCOME_CODES = GLASS_ARC4_CAPTURE_OUTCOME_CODES;
const ARC4_CAPTURE_LABELS = Object.freeze({
  tame: Object.freeze({ label: 'Tame', pool: 'fauna', reward: 'one owned creature' }),
  scavenge: Object.freeze({ label: 'Scavenge', pool: 'flora or fungi', reward: 'one specimen lot' }),
  sample: Object.freeze({ label: 'Sample', pool: 'microbes', reward: 'one specimen lot' }),
});
const ARC4_EARTH_GLASS_ORACLE = GLASS_VETERAN_CAPTURE_ORACLE;
const ARC3_ORBITAL_GLASS_TARGET = Object.freeze({
  galaxySeed: 999,
  star: Object.freeze({ seed: 424242, x: 560, y: 170 }),
  planetSeed: 134,
  planetOrdinal: 3,
  expectedValue: 'Chlorine · Silicon · Calcium',
});
const ARC3_ORBITAL_SURVEY_GLASS_EXPRESSION = `(()=>{const S=window.__CF_SLICE__,state=S?.api?.state?.(),card=document.getElementById('survey'),
  cardCode=S?.api?.cardShareCode?.()??null,
  planetTarget=S?.api?.planetScreenTarget?.({seed:${ARC3_ORBITAL_GLASS_TARGET.planetSeed},ordinal:${ARC3_ORBITAL_GLASS_TARGET.planetOrdinal}})??null,
  rows=card?[...card.querySelectorAll('[data-row="Mineral veins"]')]:[],row=rows[0]??null,
  label=(row?.querySelector(':scope > span')?.textContent||'').trim(),text=(row?.textContent||'').replace(/\\s+/g,' ').trim(),
  value=label&&text.startsWith(label)?text.slice(label.length).trim():text,style=row?getComputedStyle(row):null,
  cardRect=card?.getBoundingClientRect?.()??null,rowRect=row?.getBoundingClientRect?.()??null,
  mineActions=card?[...card.querySelectorAll('button,a')].filter(node=>/\\bmine\\b/i.test(node.textContent||'')):[],
  sensitive=/(?:Void Essence|Chronal Shard|Dark Matter|Protomatter|Primordial Ice|cosmic|exceptional|grade|tier|reserve|pulls? remaining|extractions?|progress|Worked out)/iu.test(value),
  passive=!!row&&!row.querySelector('button,a,input,select,textarea,[tabindex]')&&!row.hasAttribute('tabindex'),
  rendered=!!row&&style?.display!=='none'&&style?.visibility!=='hidden'&&!!rowRect&&rowRect.width>0&&rowRect.height>0,
  contained=!!cardRect&&!!rowRect&&rowRect.left>=cardRect.left-1&&rowRect.right<=cardRect.right+1
    &&rowRect.top>=cardRect.top-1&&rowRect.bottom<=cardRect.bottom+1,
  horizontal=!!row&&row.scrollWidth<=row.clientWidth+1&&!!rowRect&&rowRect.left>=-1&&rowRect.right<=innerWidth+1;
  return {rowCount:rows.length,label,value,mineActionCount:mineActions.length,sensitive,passive,rendered,contained,horizontal,
      cardOpen:state?.cardOpen===true&&card?.getAttribute('aria-hidden')==='false',cardCode,planetTarget,
      cardRect:cardRect?[cardRect.left,cardRect.top,cardRect.right,cardRect.bottom]:null,
      rowRect:rowRect?[rowRect.left,rowRect.top,rowRect.right,rowRect.bottom]:null,
      rowScrollWidth:row?.scrollWidth??null,rowClientWidth:row?.clientWidth??null,state:{mode:state?.mode??null,gal:state?.gal??null,
        star:state?.star??null,starX:state?.starX??null,starY:state?.starY??null,planet:state?.planet??null,
        planetOrdinal:state?.planetOrdinal??null,navGalaxyKey:state?.navGalaxyKey??null,
        navStarKey:state?.navStarKey??null,navWorldKey:state?.navWorldKey??null,
        renderedScene:state?.renderedScene??null,
        pendingPersistenceWrites:state?.sceneResources?.pendingPersistenceWrites??null,
        cardOpen:state?.cardOpen??null,engineeringStateKind:state?.engineering?.stateKind??null,
        engineeringProtection:state?.engineering?.protection??null,
        research:state?.engineering?.research??null}};})()`;
function assessArc3OrbitalSurveyGlass(observation) {
  const state = observation?.state;
  const cardPayload = decodeCF1Payload(observation?.cardCode);
  const target = observation?.planetTarget;
  const receipt = state?.renderedScene;
  const navGalaxyKey = 'CF1|g:999@90,-60';
  const navStarKey = 'CF1|g:999@90,-60|s:424242@560,170';
  const checks = Object.freeze({
    exactRoute: state?.mode === 'system' && state?.gal === ARC3_ORBITAL_GLASS_TARGET.galaxySeed
      && state?.star === ARC3_ORBITAL_GLASS_TARGET.star.seed
      && state?.starX === ARC3_ORBITAL_GLASS_TARGET.star.x
      && state?.starY === ARC3_ORBITAL_GLASS_TARGET.star.y
      && state?.navGalaxyKey === navGalaxyKey && state?.navStarKey === navStarKey,
    systemNavShape: state?.planet === null && state?.planetOrdinal === null
      && state?.navWorldKey === null,
    exactCardContext: cardPayload?.t === 'p'
      && Array.isArray(cardPayload?.g) && cardPayload.g[0] === 90 && cardPayload.g[1] === -60
      && cardPayload.g[6] === ARC3_ORBITAL_GLASS_TARGET.galaxySeed
      && Array.isArray(cardPayload?.s) && cardPayload.s[0] === ARC3_ORBITAL_GLASS_TARGET.star.x
      && cardPayload.s[1] === ARC3_ORBITAL_GLASS_TARGET.star.y
      && cardPayload.s[2] === ARC3_ORBITAL_GLASS_TARGET.star.seed
      && cardPayload.p === ARC3_ORBITAL_GLASS_TARGET.planetSeed,
    exactPlanetTarget: target?.seed === ARC3_ORBITAL_GLASS_TARGET.planetSeed
      && target?.ordinal === ARC3_ORBITAL_GLASS_TARGET.planetOrdinal
      && Number.isFinite(target?.screenX) && Number.isFinite(target?.screenY)
      && Number.isFinite(target?.width) && target.width > 0
      && Number.isFinite(target?.height) && target.height > 0,
    renderedReceipt: Number.isInteger(receipt?.serial) && receipt.serial > 0
      && receipt?.mode === 'system' && receipt?.galaxyKey === navGalaxyKey
      && receipt?.starKey === navStarKey && receipt?.worldKey === null,
    settledPersistence: state?.pendingPersistenceWrites === 0,
    currentAuthority: state?.engineeringStateKind === 'loaded'
      && state?.engineeringProtection === null && state?.research?.includes('scan1') === true,
    cardOpen: observation?.cardOpen === true,
    exactCardinality: observation?.rowCount === 1,
    exactLabel: observation?.label === 'Mineral veins',
    exactOrderedValue: observation?.value === ARC3_ORBITAL_GLASS_TARGET.expectedValue,
    noBiomeMarker: !observation?.value?.includes('✦'),
    groundedSensitiveFacts: observation?.sensitive === false,
    noMineAction: observation?.mineActionCount === 0,
    passive: observation?.passive === true,
    rendered: observation?.rendered === true,
    contained: observation?.contained === true,
    noHorizontalOverflow: observation?.horizontal === true,
  });
  const reasons = Object.entries(checks).filter(([, value]) => value !== true).map(([name]) => name);
  return Object.freeze({ ...observation, ok: reasons.length === 0, checks, reasons: Object.freeze(reasons) });
}
const isolatesArc3OrbitalGlassChecks = (assessment, expectedRedChecks) => {
  const expected = new Set(expectedRedChecks);
  return assessment?.ok === false && expected.size === expectedRedChecks.length
    && Object.entries(assessment?.checks ?? {}).every(([name, value]) => (
      expected.has(name) ? value === false : value === true
    )) && [...expected].every((name) => assessment?.checks?.[name] === false);
};
function arc3OrbitalGlassAuthorityControls(observation) {
  const controls = Object.freeze({
    wrongCardCode: assessArc3OrbitalSurveyGlass({ ...observation, cardCode: 'CF1-not-a-valid-card' }),
    wrongCardSeed: assessArc3OrbitalSurveyGlass({ ...observation,
      cardCode: withCF1PlanetSeed(observation?.cardCode, 133) }),
    wrongPlanetTargetSeed: assessArc3OrbitalSurveyGlass({ ...observation,
      planetTarget: { ...observation?.planetTarget, seed: 133 } }),
    wrongPlanetTargetOrdinal: assessArc3OrbitalSurveyGlass({ ...observation,
      planetTarget: { ...observation?.planetTarget, ordinal: 2 } }),
    unexpectedNavPlanet: assessArc3OrbitalSurveyGlass({ ...observation,
      state: { ...observation?.state, planet: ARC3_ORBITAL_GLASS_TARGET.planetSeed,
        planetOrdinal: ARC3_ORBITAL_GLASS_TARGET.planetOrdinal } }),
    unexpectedNavWorld: assessArc3OrbitalSurveyGlass({ ...observation,
      state: { ...observation?.state,
        navWorldKey: 'CF1|g:999@90,-60|s:424242@560,170|p:134#3' } }),
    wrongRenderedReceipt: assessArc3OrbitalSurveyGlass({ ...observation,
      state: { ...observation?.state, renderedScene: { ...observation?.state?.renderedScene,
        worldKey: 'CF1|g:999@90,-60|s:424242@560,170|p:134#3' } } }),
    pendingPersistence: assessArc3OrbitalSurveyGlass({ ...observation,
      state: { ...observation?.state, pendingPersistenceWrites: 1 } }),
    closedCard: assessArc3OrbitalSurveyGlass({ ...observation, cardOpen: false }),
  });
  const expected = Object.freeze({
    wrongCardCode: ['exactCardContext'], wrongCardSeed: ['exactCardContext'],
    wrongPlanetTargetSeed: ['exactPlanetTarget'], wrongPlanetTargetOrdinal: ['exactPlanetTarget'],
    unexpectedNavPlanet: ['systemNavShape'], unexpectedNavWorld: ['systemNavShape'],
    wrongRenderedReceipt: ['renderedReceipt'], pendingPersistence: ['settledPersistence'],
    closedCard: ['cardOpen'],
  });
  return Object.freeze({
    ok: assessArc3OrbitalSurveyGlass(observation).ok
      && Object.entries(controls).every(([name, assessment]) => (
        isolatesArc3OrbitalGlassChecks(assessment, expected[name])
      )),
    controls, expected,
  });
}
function arc3OrbitalGlassSelftest() {
  const observation = Object.freeze({
    rowCount: 1, label: 'Mineral veins', value: ARC3_ORBITAL_GLASS_TARGET.expectedValue,
    mineActionCount: 0, sensitive: false, passive: true, rendered: true,
    contained: true, horizontal: true, cardOpen: true,
    cardCode: encodeCF1Payload({
      t: 'p', g: [90, -60, 78, 0, 0.62, 0.5, 999, 1], s: [560, 170, 424242], p: 134,
    }),
    planetTarget: { seed: 134, ordinal: 3, screenX: 480, screenY: 360, width: 24, height: 24 },
    state: {
      mode: 'system', gal: 999, star: 424242, starX: 560, starY: 170,
      planet: null, planetOrdinal: null, navGalaxyKey: 'CF1|g:999@90,-60',
      navStarKey: 'CF1|g:999@90,-60|s:424242@560,170', navWorldKey: null,
      renderedScene: { serial: 7, mode: 'system', galaxyKey: 'CF1|g:999@90,-60',
        starKey: 'CF1|g:999@90,-60|s:424242@560,170', worldKey: null },
      pendingPersistenceWrites: 0, cardOpen: true, engineeringStateKind: 'loaded',
      engineeringProtection: null, research: ['scan1'],
    },
  });
  const baseline = assessArc3OrbitalSurveyGlass(observation);
  const authority = arc3OrbitalGlassAuthorityControls(observation);
  const disclosure = assessArc3OrbitalSurveyGlass({
    ...observation,
    value: 'Silicon · Chlorine · Calcium · Void Essence · 570 pulls remaining',
    sensitive: true,
  });
  const offCard = assessArc3OrbitalSurveyGlass({ ...observation, contained: false });
  return Object.freeze({
    ok: baseline.ok && authority.ok
      && isolatesArc3OrbitalGlassChecks(disclosure, ['exactOrderedValue', 'groundedSensitiveFacts'])
      && isolatesArc3OrbitalGlassChecks(offCard, ['contained']),
    baseline, authority, disclosure, offCard,
  });
}
const ARC4_DURABLE_READ_EXPRESSION = buildArc4DurableReadExpression();
const ARC4_PLANETSIDE_EXPRESSION = `(()=>{const S=window.__CF_SLICE__,state=S?.api?.state?.(),side=document.getElementById('planetside');return {
  mode:state?.mode??null,galaxySeed:state?.gal??null,starSeed:state?.star??null,
  planetSeed:state?.planet??null,planetOrdinal:state?.planetOrdinal??null,
  rosterState:side?.getAttribute('data-roster-state')??null,
  previewCount:Number(side?.getAttribute('data-preview-count')),
  fullRosterCount:Number(side?.getAttribute('data-full-roster-count')),
  fullRosterFingerprint:side?.getAttribute('data-full-roster-fingerprint')??null,
  ecologyEpoch:Number(side?.getAttribute('data-ecology-epoch')),
  previewRowCount:side?.querySelectorAll('[data-sel="planetside-sp"]').length??0,
  worldKey:state?.navWorldKey??null};})()`;
const ARC4_SURFACE_EXPRESSION = `(()=>{const S=window.__CF_SLICE__,state=S?.api?.state?.(),
  button=document.getElementById('docksurvey');return {
  mode:state?.mode??null,galaxySeed:state?.gal??null,starSeed:state?.star??null,
  planetSeed:state?.planet??null,planetOrdinal:state?.planetOrdinal??null,
  worldKey:state?.navWorldKey??null,cardOpen:state?.cardOpen===true,
  expanded:button?.getAttribute('aria-expanded')??null,
  cardTitle:state?.cardTitle??null};})()`;
const ARC4_LAYOUT_EXPRESSION = `(()=>{const rect=(node)=>{const r=node?.getBoundingClientRect?.();return r?{
  left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};return {
  planetsideRect:rect(document.getElementById('planetside')),
  scrollWidth:document.documentElement.scrollWidth,
  clientWidth:document.documentElement.clientWidth};})()`;

const exactJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const codeUnitCompare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const arc4SelftestChecks = (code) => Object.fromEntries(
  (GLASS_ARC4_CAPTURE_CHECK_KEYS[code] || []).map((key) => [key, true]),
);
const arc4Percent = (value) => `${String(Math.round(value * 10_000_000) / 100_000)}%`;
const arc4Assessment = (name, checks) => {
  const reasons = Object.entries(checks).filter(([, value]) => value !== true)
    .map(([check]) => check);
  return { name, ok: reasons.length === 0, checks, reasons };
};
const arc4FailedChecks = (result) => Object.entries(result?.checks || {})
  .filter(([, value]) => value !== true).map(([check]) => check);
const arc4IsolatedFailure = (result, expected) => result?.ok === false
  && exactJson(arc4FailedChecks(result), [expected]);

function assessArc4VeteranCaptureFixtureSource(fixture, oracle) {
  const names = Array.isArray(fixture?.names)
    ? fixture.names.filter((row) => Array.isArray(row) && row[0] === 'p133') : [];
  return arc4Assessment('Arc 4 veteran capture fixture source', {
    oracleIdentity: oracle?.schema === 'cf-v2-glass-veteran-capture-oracle/v1'
      && oracle?.preferenceRawSha256 === GLASS_VETERAN_PREF_RAW_SHA256
      && oracle?.worldKey === 'CF1|g:999@90,-60|s:424242@560,170|p:133#2'
      && oracle?.contextKey
        === `${oracle.worldKey}|epoch:${oracle.ecologyEpoch}|${oracle.fullRosterFingerprint}`,
    titleSource: names.length === 1 && exactJson(names[0], ['p133', oracle?.title]),
    epochSource: fixture?.epoch === oracle?.ecologyEpoch,
    contactSource: exactJson(fixture?.cont, [55]) && oracle?.contactCapturePoints === 0,
    loadoutSource: exactJson(fixture?.eq, { helmet: 'headlamp', suit: 'hazmat' })
      && exactJson(fixture?.ea, {
        helmet: { k: 'strike', v: 0.05, forId: 'headlamp' },
      })
      && exactJson(fixture?.items, [
        ['plate', 3], ['lens', 1], ['cell', 2], ['headlamp', 1],
        ['hazmat', 1], ['thermal', 1],
      ]),
  });
}

function arc4VeteranCaptureFixturePreflight(
  raw = VETERAN_PREF_RAW,
  oracle = ARC4_EARTH_GLASS_ORACLE,
) {
  let fixture = null;
  try { fixture = JSON.parse(raw); } catch { /* structured red below */ }
  const source = assessArc4VeteranCaptureFixtureSource(fixture, oracle);
  return arc4Assessment('Arc 4 veteran capture fixture preflight', {
    rawBound: typeof raw === 'string'
      && sha256(raw) === GLASS_VETERAN_PREF_RAW_SHA256
      && sha256(raw) === oracle?.preferenceRawSha256,
    parsed: !!fixture && typeof fixture === 'object' && !Array.isArray(fixture),
    ...source.checks,
  });
}

function arc4ExpectedOdds(row) {
  const copy = ARC4_CAPTURE_LABELS[row?.verb];
  const odds = row?.odds;
  if (!copy || !odds) return null;
  return `One of ${odds.eligibleCount} eligible ${copy.pool} is selected at random. Overall success chance ${arc4Percent(odds.overallChance)}${odds.chanceMin === odds.chanceMax
    ? '.' : `; individual odds range ${arc4Percent(odds.chanceMin)}–${arc4Percent(odds.chanceMax)}.`}`;
}

function arc4ExpectedDetail(row) {
  const copy = ARC4_CAPTURE_LABELS[row?.verb];
  return copy && row?.odds
    ? `Randomly attempts one of ${row.odds.eligibleCount} eligible ${copy.pool} from the full biosphere. Success adds ${copy.reward}.`
    : null;
}

function arc4VeteranPresentationExpectation(oracle = ARC4_EARTH_GLASS_ORACLE) {
  const odds = (verb) => {
    const row = oracle.odds[verb];
    return `${row.eligibleCount}/${row.overallChance}/${row.chanceMin}/${row.chanceMax}`;
  };
  const yieldState = oracle.biosphereYield;
  return `fresh ${oracle.title} (Earth seed 133) epoch ${oracle.ecologyEpoch} renders ${oracle.previewCount} of ${oracle.fullRosterCount} (\`${oracle.fullRosterFingerprint}\`), Yield ${yieldState.yield}/${yieldState.used}/${yieldState.remaining}/cycle ${yieldState.cycle}, and exact Tame ${odds('tame')}, Scavenge ${odds('scavenge')}, Sample ${odds('sample')} with full-pool copy and model/disabled parity`;
}

function arc4VeteranOddsExact(rows, verb) {
  const row = rows.find((candidate) => candidate?.verb === verb);
  const expected = ARC4_EARTH_GLASS_ORACLE.odds[verb];
  const odds = row?.odds;
  return !!expected && odds?.eligibleCount === expected.eligibleCount
    && odds.overallChance === expected.overallChance
    && odds.chanceMin === expected.chanceMin
    && odds.chanceMax === expected.chanceMax
    && odds.text === arc4ExpectedOdds({ verb, odds: expected })
    && !/(?:^|\D)0(?:\.0+)?%/u.test(odds.text);
}

function assessArc4GlassPresentation({ ui, planetside } = {}) {
  const oracle = ARC4_EARTH_GLASS_ORACLE;
  const rows = Array.isArray(ui?.rows) ? ui.rows : [];
  const verbsExact = exactJson(rows.map((row) => row?.verb), ARC4_CAPTURE_VERBS)
    && rows.every((row) => {
      const copy = ARC4_CAPTURE_LABELS[row?.verb];
      const odds = oracle.odds[row?.verb];
      return !!copy && row?.status === 'ready'
        && row?.semanticKey === `capture:${row.verb}`
        && row?.title === `${copy.label} · ${copy.pool}`
        && row?.detail === arc4ExpectedDetail({ verb: row.verb, odds })
        && row?.button?.label === copy.label
        && row?.button?.verb === row.verb
        && row?.button?.focusKey === `capture:${row.verb}`;
    });
  const budget = ui?.budget;
  const recoverySeconds = Number.isInteger(budget?.recoveryRemainingActivePlayMs)
    ? Math.max(0, Math.ceil(budget.recoveryRemainingActivePlayMs / 1_000)) : null;
  const recovery = recoverySeconds === null ? null
    : `${Math.floor(recoverySeconds / 60)}:${String(recoverySeconds % 60).padStart(2, '0')}`;
  const exactBudgetText = budget && recovery !== null
    ? `${oracle.biosphereYield.remaining} of ${oracle.biosphereYield.yield} capture attempts remain; ${oracle.biosphereYield.used} spent this active-play cycle. Tame, Scavenge, and Sample share Biosphere Yield. Every attempt spends 1, hit or miss. Full recovery at the next 20-minute active-play cycle — ${recovery} of active play remaining. Closing the game does not advance recovery.`
    : null;
  const yieldExact = !!budget
    && budget.yield === oracle.biosphereYield.yield
    && budget.used === oracle.biosphereYield.used
    && budget.remaining === oracle.biosphereYield.remaining
    && budget.cycle === oracle.biosphereYield.cycle
    && Number.isInteger(budget.recoveryRemainingActivePlayMs)
    && budget.recoveryRemainingActivePlayMs >= 0
    && budget.recoveryRemainingActivePlayMs <= 1_200_000
    && budget.text === exactBudgetText;
  const surfaceRoute = planetside?.rosterState === 'ready'
    && planetside.mode === 'surface' && planetside.galaxySeed === 999
    && planetside.starSeed === 424242 && planetside.planetSeed === 133
    && planetside.planetOrdinal === 2
    && planetside.worldKey === oracle.worldKey
    && ui?.planetsideHeading === 'PLANETSIDE — Biosphere';
  const homeworldTitle = ui?.cardTitle === oracle.title;
  const epochExact = planetside?.ecologyEpoch === oracle.ecologyEpoch;
  const rosterCounts = planetside?.previewCount === oracle.previewCount
    && planetside?.fullRosterCount === oracle.fullRosterCount
    && planetside?.previewRowCount === oracle.previewCount;
  const rosterFingerprint = planetside?.fullRosterFingerprint === oracle.fullRosterFingerprint;
  const contextIdentity = ui?.contextKey
    === `${oracle.worldKey}|epoch:${oracle.ecologyEpoch}|${oracle.fullRosterFingerprint}`;
  const fullPoolCopy = ui?.summary
    === `Showing ${oracle.previewCount} of ${oracle.fullRosterCount} life forms. Capture draws from all ${oracle.fullRosterCount}, not only this preview. Each action chooses uniformly from every eligible species for that action in the full biosphere.`;
  const modelDisabledParity = ui?.ariaBusy === 'false'
    && ui?.diagnostics?.pendingWork === 0
    && ui?.diagnostics?.convergenceLatched === false
    && rows.every((row) => row?.button?.modelEnabled === 'true'
      && row.button.disabled === false && row.button.ariaDisabled === 'false');
  return arc4Assessment('Arc 4 veteran Homeworld capture presentation', {
    captured: ui?.schema === ARC4_CAPTURE_UI_EVIDENCE_SCHEMA && !!planetside,
    uiComplete: arc4CaptureUiSnapshotComplete(ui),
    surfaceRoute,
    homeworldTitle,
    epochExact,
    rosterCounts,
    rosterFingerprint,
    contextIdentity,
    verbsExact,
    tameOdds: arc4VeteranOddsExact(rows, 'tame'),
    scavengeOdds: arc4VeteranOddsExact(rows, 'scavenge'),
    sampleOdds: arc4VeteranOddsExact(rows, 'sample'),
    yieldExact,
    fullPoolCopy,
    modelDisabledParity,
  });
}

function arc4KeyboardFocusProof(value, { verb = null, close = false } = {}) {
  return value?.modality === 'keyboard' && value?.focused === true
    && value?.focusVisible === true && value?.styleChanged === true
    && value?.decorationPainted === true
    && (close ? value?.close === true : value?.verb === verb
      && value?.semanticKey === `capture:${verb}`);
}

function arc4GeometryClauseProjection({ viewport, controls } = {}) {
  const rect = (value) => !!value && typeof value === 'object'
    && [value.left, value.top, value.right, value.bottom, value.width, value.height]
      .every((entry) => typeof entry === 'number' && Number.isFinite(entry))
    && value.width >= 0 && value.height >= 0
    && Math.abs(value.right - value.left - value.width) <= 0.75
    && Math.abs(value.bottom - value.top - value.height) <= 0.75;
  const contained = (inner, outer) => rect(inner) && rect(outer)
    && inner.left >= outer.left - 0.75 && inner.right <= outer.right + 0.75
    && inner.top >= outer.top - 0.75 && inner.bottom <= outer.bottom + 0.75;
  const sameRect = (left, right) => rect(left) && rect(right)
    && ['left', 'top', 'right', 'bottom', 'width', 'height']
      .every((key) => Math.abs(left[key] - right[key]) <= 0.75);
  const ownedPoint = (point, verb, buttonRect) => !!point && typeof point === 'object'
    && Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.tag === 'BUTTON' && point.close === false && point.verb === verb
    && rect(buttonRect)
    && point.x >= buttonRect.left - 0.75 && point.x <= buttonRect.right + 0.75
    && point.y >= buttonRect.top - 0.75 && point.y <= buttonRect.bottom + 0.75
    && Math.abs(point.x - ((buttonRect.left + buttonRect.right) / 2)) <= 0.75
    && Math.abs(point.y - ((buttonRect.top + buttonRect.bottom) / 2)) <= 0.75;
  const viewportRect = {
    left: 0, top: 0, right: viewport?.width, bottom: viewport?.height,
    width: viewport?.width, height: viewport?.height,
  };
  return (Array.isArray(controls) ? controls : []).map((control) => {
    const offset = control?.scrollOffset;
    const translated = rect(control?.buttonRect)
      && Number.isFinite(offset?.left) && Number.isFinite(offset?.top) ? {
        left: control.buttonRect.left + offset.left,
        top: control.buttonRect.top + offset.top,
        right: control.buttonRect.right + offset.left,
        bottom: control.buttonRect.bottom + offset.top,
        width: control.buttonRect.width,
        height: control.buttonRect.height,
      } : null;
    const clauses = {
      scrollSettled: control?.scrollSettled === true,
      target44: rect(control?.buttonRect)
        && control.buttonRect.width >= 44 && control.buttonRect.height >= 44,
      cardContained: contained(control?.buttonRect, control?.cardRect),
      viewportContained: contained(control?.buttonRect, viewportRect),
      layoutTranslation: sameRect(control?.layoutRect, translated),
      ownedPoint: ownedPoint(control?.beforePoint, control?.verb, control?.buttonRect)
        && ownedPoint(control?.afterRenderPoint, control?.verb, control?.buttonRect)
        && Math.abs(control.beforePoint.x - control.afterRenderPoint.x) <= 0.75
        && Math.abs(control.beforePoint.y - control.afterRenderPoint.y) <= 0.75,
      heartbeatRerender: control?.rerender?.required !== true
        || control?.rerender?.productOk === true,
      name: control?.accessibleName === ({
        tame: 'Tame', scavenge: 'Scavenge', sample: 'Sample',
      })[control?.verb],
      focus: control?.focus?.modality === 'keyboard'
        && control.focus.focused === true
        && control.focus.focusVisible === true
        && control.focus.decorationPainted === true
        && control.focus.styleChanged === true
        && control.focus.verb === control?.verb
        && control.focus.semanticKey === `capture:${control?.verb}`,
    };
    return {
      verb: control?.verb ?? null,
      ok: Object.values(clauses).every((value) => value === true),
      clauses,
    };
  });
}

function assessArc4NativeSurveyCloseReturn(evidence = {}) {
  return arc4Assessment('Arc 4 native Survey Close return', {
    captured: !!evidence.beforeSurface && !!evidence.afterSurface
      && !!evidence.beforePlanetside && !!evidence.afterPlanetside
      && !!evidence.beforeCapture && !!evidence.afterCapture
      && typeof evidence.beforeDurableFingerprint === 'string'
      && typeof evidence.afterDurableFingerprint === 'string',
    setupCloseTrusted: evidence.setupClose?.ok === true && evidence.setupClosed?.cardOpen === false,
    openerTrusted: evidence.open?.ok === true && evidence.opened?.cardOpen === true
      && evidence.opened?.expanded === 'true',
    idleKeyboardFocus: evidence.sampleScrollSettled === true
      && evidence.sampleFocus?.nativeTabTrusted === true
      && arc4KeyboardFocusProof(evidence.sampleFocus, { verb: 'sample' }),
    closeTrusted: evidence.close?.ok === true
      && evidence.close?.target?.surveyClose === true
      && evidence.close?.target?.accessibleName === 'Close Survey card'
      && evidence.close?.receipt?.trusted === true
      && evidence.close?.receipt?.key === 'Enter'
      && evidence.close?.receipt?.code === 'Enter'
      && evidence.close?.receipt?.surveyClose === true,
    openerReturn: evidence.returned?.cardOpen === false
      && evidence.returned?.expanded === 'false'
      && evidence.returned?.focusId === 'docksurvey',
    reopenTrusted: evidence.reopen?.ok === true && evidence.reopened?.cardOpen === true
      && evidence.reopened?.expanded === 'true',
    noCaptureActivation: Array.isArray(evidence.captureActivationTrace)
      && evidence.captureActivationTrace.length === 0,
    surfaceUnchanged: exactJson(evidence.beforeSurface, evidence.afterSurface),
    planetsideUnchanged: exactJson(evidence.beforePlanetside, evidence.afterPlanetside),
    captureUnchanged: exactJson(evidence.beforeCapture, evidence.afterCapture),
    persistenceUnchanged: evidence.beforeDurableSettled === true
      && evidence.afterDurableSettled === true
      && evidence.beforeDurableFingerprint === evidence.afterDurableFingerprint,
  });
}

function assessArc4DependentBaseline({ planetsideOwnership, nativeReturn, presentation, geometry } = {}) {
  return arc4Assessment('Arc 4 dependent Glass baseline', {
    planetsideOwnership: planetsideOwnership?.ok === true,
    nativeCloseReturn: nativeReturn?.ok === true,
    planetsidePresentation: presentation?.ok === true,
    captureGeometry: geometry?.ok === true,
  });
}

export function buildArc4AtomicGeometryEvidenceExpression({
  verb = null, close = false, forceHeartbeatRerender = false,
} = {}) {
  if (!close && !ARC4_CAPTURE_VERBS.includes(verb)) {
    throw new TypeError(`unknown Arc 4 focus verb ${JSON.stringify(verb)}`);
  }
  const selector = close ? '#survey [data-survey-close]'
    : `#survey button[data-capture-action=${JSON.stringify(verb)}]`;
  return `(async()=>{const selector=${JSON.stringify(selector)},captureSchema=${JSON.stringify(ARC4_CONTROL_GEOMETRY_EVIDENCE_SCHEMA)},
    rerenderSchema=${JSON.stringify(ARC4_HEARTBEAT_RERENDER_EVIDENCE_SCHEMA)},verb=${JSON.stringify(verb)},
    close=${JSON.stringify(close)},forceHeartbeatRerender=${JSON.stringify(forceHeartbeatRerender)},
    wait=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0))),
    box=(node)=>{const r=node?.getBoundingClientRect?.();return r?{left:r.left,top:r.top,right:r.right,
      bottom:r.bottom,width:r.width,height:r.height}:null},
    style=(node)=>{const value=node?getComputedStyle(node):null;return value?{outline:value.outline,
      shadow:value.boxShadow,border:value.borderColor,background:value.backgroundColor,
      outlineStyle:value.outlineStyle,outlineWidth:value.outlineWidth}:null},
    point=(node,rect)=>{if(!rect)return null;const x=(rect.left+rect.right)/2,y=(rect.top+rect.bottom)/2,
      hit=document.elementFromPoint(x,y);return {x,y,tag:hit?.tagName??null,
        verb:hit?.closest?.('[data-capture-action]')?.getAttribute('data-capture-action')??null,
        close:!!hit&&hit.closest?.('[data-survey-close]')!==null}},
    focusVerb=()=>document.activeElement?.closest?.('[data-capture-action]')?.getAttribute('data-capture-action')??null,
    snapshot=()=>{const node=document.querySelector(selector),buttonRect=box(node),cardRect=box(document.getElementById('survey')),
      scroll=[],scrollOffset={left:0,top:0};for(let owner=node?.parentElement;owner;owner=owner.parentElement){
        scroll.push([owner.scrollLeft,owner.scrollTop]);scrollOffset.left+=owner.scrollLeft;scrollOffset.top+=owner.scrollTop;}
      const layoutRect=buttonRect?{left:buttonRect.left+scrollOffset.left,top:buttonRect.top+scrollOffset.top,
        right:buttonRect.right+scrollOffset.left,bottom:buttonRect.bottom+scrollOffset.top,
        width:buttonRect.width,height:buttonRect.height}:null;
      return {node,buttonRect,cardRect,scrollOffset,layoutRect,scroll,point:point(node,buttonRect)}},
    witness=(snap,persistence)=>({documentToken:persistence?.documentToken??null,
      heartbeatRunning:persistence?.heartbeatRunning===true,focusVerb:focusVerb(),
      buttonRect:snap?.buttonRect??null,cardRect:snap?.cardRect??null,
      scrollOffset:snap?.scrollOffset??null,scroll:snap?.scroll??null}),
    validRect=(value)=>!!value&&[value.left,value.top,value.right,value.bottom,value.width,value.height]
      .every(entry=>Number.isFinite(entry))&&value.width>=0&&value.height>=0,
    contained=(inner,outer)=>validRect(inner)&&validRect(outer)&&inner.left>=outer.left-.25
      &&inner.right<=outer.right+.25&&inner.top>=outer.top-.25&&inner.bottom<=outer.bottom+.25,
    targetReady=(snap)=>validRect(snap?.buttonRect)&&contained(snap.buttonRect,snap.cardRect)
      &&contained(snap.buttonRect,{left:0,top:0,right:innerWidth,bottom:innerHeight,
        width:innerWidth,height:innerHeight})&&snap?.point?.tag==='BUTTON'
      &&snap.point.verb===verb&&snap.point.close===false,
    sameRect=(left,right)=>validRect(left)&&validRect(right)
      &&['left','top','right','bottom','width','height'].every(key=>Math.abs(left[key]-right[key])<=.25),
    stable=(left,right)=>!!left&&!!right&&sameRect(left.buttonRect,right.buttonRect)
      &&sameRect(left.cardRect,right.cardRect)
      &&Math.abs(left.scrollOffset.left-right.scrollOffset.left)<=.25
      &&Math.abs(left.scrollOffset.top-right.scrollOffset.top)<=.25
      &&left.scroll.length===right.scroll.length
      &&left.scroll.every((row,index)=>row.every((value,axis)=>Math.abs(value-right.scroll[index][axis])<=.25));
    let el=document.querySelector(selector);if(!(el instanceof HTMLElement))return {captureSchema,
      why:'missing-product-target',verb,close,scrollSettled:false,buttonRect:null,
      cardRect:box(document.getElementById('survey')),scrollOffset:null,layoutRect:null,beforePoint:null,
      afterRenderPoint:null,accessibleName:null,focus:{modality:'keyboard',focused:false,focusVisible:false,
        styleChanged:false,decorationPainted:false,verb,semanticKey:null,close,accessibleName:null},
      rerender:{schema:rerenderSchema,required:false,productBlocked:'missing-product-target',productOk:false}};
    el.blur();let before=style(el),rerender={schema:rerenderSchema,required:false,productOk:true};
    if(forceHeartbeatRerender){const prior=el,slice=window.__CF_SLICE__,api=slice?.api,
      documentToken=slice?.documentToken??null,seamsAvailable=typeof api?.state==='function'
        &&typeof api?.__smokeQuiesceF4Heartbeat==='function'
        &&typeof api?.__smokeResumeF4Heartbeat==='function'
        &&typeof api?.__smokeRunF4Heartbeat==='function';
      const initialPersistence=typeof api?.state==='function'?api.state()?.persistence:null,
        initial={documentToken:initialPersistence?.documentToken??null,
          heartbeatRunning:initialPersistence?.heartbeatRunning===true};
      let priorFocusArmed=false,quiescence=null,resume=null,error=null,runCompleted=false,
        quiesceAttempted=false,preSnapshot=null,pre=null,
        cleanup={attempted:false,receipt:null,error:null};
      if(!seamsAvailable)error='missing F4 heartbeat smoke seam';
      else if(initialPersistence?.documentToken!==documentToken)error='F4 heartbeat initial document identity changed';
      else if(initialPersistence?.heartbeatRunning!==true)error='F4 heartbeat was not running before forced rerender';
      else{quiesceAttempted=true;try{
        quiescence=await api.__smokeQuiesceF4Heartbeat();
        if(quiescence?.schema!=='cf-v2-f4-heartbeat-quiescence/v1'||quiescence?.documentToken!==documentToken
          ||quiescence?.wasRunning!==true||quiescence?.stopped!==true||quiescence?.cycleSettled!==true)
          throw new Error('invalid F4 heartbeat quiescence receipt');
        el=document.querySelector(selector);const priorFocus=document.querySelector(
          '#survey button[data-capture-action="scavenge"]');
        if(!(el instanceof HTMLElement)||!(priorFocus instanceof HTMLElement))
          throw new Error('Capture rerender control target disappeared while heartbeat was quiesced');
        try{priorFocus.focus({preventScroll:true,focusVisible:true})}catch{priorFocus.focus({preventScroll:true})}
        priorFocusArmed=document.activeElement===priorFocus;
        if(!priorFocusArmed)throw new Error('could not arm prior Scavenge semantic focus');
        el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});await wait();await wait();
        preSnapshot=snapshot();const prePersistence=api.state()?.persistence??null;
        pre=witness(preSnapshot,prePersistence);
        if(pre.documentToken!==documentToken||pre.heartbeatRunning!==false||pre.focusVerb!=='scavenge')
          throw new Error('invalid quiesced Capture rerender baseline');
        resume=api.__smokeResumeF4Heartbeat();
        if(resume?.schema!=='cf-v2-f4-heartbeat-resume/v1'||resume?.documentToken!==documentToken
          ||resume?.running!==true)throw new Error('invalid F4 heartbeat resume receipt');
        await api.__smokeRunF4Heartbeat();runCompleted=true;
      }catch(reason){error=String(reason?.stack||reason)}finally{
        const current=typeof api?.state==='function'?api.state()?.persistence:null;
        if(current?.heartbeatRunning!==true){cleanup.attempted=true;
          try{cleanup.receipt=api?.__smokeResumeF4Heartbeat?.()??null}
          catch(reason){cleanup.error=String(reason?.stack||reason)}}}}
      await wait();await wait();const postSnapshot=snapshot(),
        postPersistence=typeof api?.state==='function'?api.state()?.persistence:null,
        post=witness(postSnapshot,postPersistence),scrollPreserved=stable(preSnapshot,postSnapshot),
        priorFocusRestored=post.focusVerb==='scavenge',preTargetReady=targetReady(preSnapshot),
        postTargetReady=targetReady(postSnapshot);
      el=postSnapshot.node;rerender={schema:rerenderSchema,required:true,documentToken,
        seamsAvailable,initial,priorFocusArmed,quiesceAttempted,quiescence,resume,
        runCompleted,cleanup,error,pre,post,
        oldDisconnected:prior.isConnected===false,
        replacementAcquired:el instanceof HTMLElement&&el!==prior,
        preTargetReady,postTargetReady,scrollPreserved,priorFocusRestored,
        productOk:preTargetReady&&postTargetReady&&scrollPreserved&&priorFocusRestored};
      before=style(el);}
    if(el instanceof HTMLElement){
      try{el.focus({preventScroll:true,focusVisible:true})}catch{el.focus({preventScroll:true})}
      el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});await wait();await wait();}
    const first=snapshot();await wait();const second=snapshot();el=second.node;const after=style(el),
      styleChanged=!!before&&!!after&&(before.outline!==after.outline||before.shadow!==after.shadow
        ||before.border!==after.border||before.background!==after.background),
      outlinePainted=!!after&&after.outlineStyle!=='none'&&(parseFloat(after.outlineWidth)||0)>=1,
      decorationPainted=outlinePainted||!!before&&!!after&&((after.shadow!=='none'&&before.shadow!==after.shadow)
        ||before.border!==after.border||before.background!==after.background),
      accessibleName=el instanceof HTMLElement?(el.getAttribute('aria-label')||el.textContent||'').trim():null,
      focus={modality:'keyboard',focused:document.activeElement===el,
        focusVisible:el?.matches?.(':focus-visible')===true,styleChanged,decorationPainted,verb,
        semanticKey:el?.closest?.('[data-semantic-key]')?.getAttribute('data-semantic-key')??null,
        close,accessibleName,before,after};
    return {captureSchema,why:null,verb,close,scrollSettled:stable(first,second),
      buttonRect:second.buttonRect,cardRect:second.cardRect,scrollOffset:second.scrollOffset,
      layoutRect:second.layoutRect,beforePoint:first.point,afterRenderPoint:second.point,
      accessibleName,focus,rerender};})()`;
}

function arc4NativeTabFocusSetupExpression(verb, priorVerb) {
  if (!ARC4_CAPTURE_VERBS.includes(verb) || !ARC4_CAPTURE_VERBS.includes(priorVerb)) {
    throw new TypeError('Arc 4 native Tab focus requires two capture verbs');
  }
  return `(()=>{window.__cfGlassArc4TabFocusAbort?.abort();const target=document.querySelector(
    '#survey button[data-capture-action=${verb}]'),prior=document.querySelector(
    '#survey button[data-capture-action=${priorVerb}]'),style=target?getComputedStyle(target):null,
    before=style?{outline:style.outline,shadow:style.boxShadow,border:style.borderColor,
      background:style.backgroundColor}:null,controller=new AbortController(),state={target,prior,before,receipt:null,controller};
    window.__cfGlassArc4TabFocus=state;window.__cfGlassArc4TabFocusAbort=controller;
    document.addEventListener('keydown',(event)=>{if(event.target===prior&&event.key==='Tab')state.receipt={
      key:event.key,code:event.code,trusted:event.isTrusted===true};},{capture:true,once:true,signal:controller.signal});
    try{prior?.focus({preventScroll:true})}catch{prior?.focus()}return {ok:target instanceof HTMLElement
      &&prior instanceof HTMLElement&&document.activeElement===prior,targetVerb:target?.getAttribute('data-capture-action')??null,
      priorVerb:prior?.getAttribute('data-capture-action')??null};})()`;
}

function arc4NativeTabFocusEvidenceExpression(verb) {
  if (!ARC4_CAPTURE_VERBS.includes(verb)) throw new TypeError('unknown Arc 4 native Tab focus verb');
  return `(()=>{const state=window.__cfGlassArc4TabFocus,target=state?.target,
    afterStyle=target?getComputedStyle(target):null,after=afterStyle?{outline:afterStyle.outline,
      shadow:afterStyle.boxShadow,border:afterStyle.borderColor,background:afterStyle.backgroundColor}:null,
    before=state?.before,styleChanged=!!before&&!!after&&(before.outline!==after.outline
      ||before.shadow!==after.shadow||before.border!==after.border||before.background!==after.background),
    outlinePainted=!!afterStyle&&afterStyle.outlineStyle!=='none'&&(parseFloat(afterStyle.outlineWidth)||0)>=1,
    decorationPainted=outlinePainted||!!before&&!!after&&((after.shadow!=='none'&&before.shadow!==after.shadow)
      ||before.border!==after.border||before.background!==after.background),receipt=state?.receipt??null,
    result={modality:'keyboard',nativeTabTrusted:receipt?.trusted===true&&receipt?.key==='Tab'&&receipt?.code==='Tab',
      focused:document.activeElement===target,focusVisible:target?.matches?.(':focus-visible')===true,
      styleChanged,decorationPainted,verb:${JSON.stringify(verb)},
      semanticKey:target?.closest?.('[data-semantic-key]')?.getAttribute('data-semantic-key')??null,
      close:false,before,after,receipt};state?.controller?.abort();delete window.__cfGlassArc4TabFocus;
    delete window.__cfGlassArc4TabFocusAbort;return result;})()`;
}

function arc4ScrollSettleExpression(selector) {
  return `(async()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!(el instanceof HTMLElement))return {ok:false,why:'missing'};
    const wait=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0))),box=(node)=>{const r=node?.getBoundingClientRect?.();return r?{
      left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null},snapshot=()=>{const buttonRect=box(el),cardRect=box(document.getElementById('survey')),
      scroll=[],scrollOffset={left:0,top:0};for(let node=el.parentElement;node;node=node.parentElement){scroll.push([node.scrollLeft,node.scrollTop]);
        scrollOffset.left+=node.scrollLeft;scrollOffset.top+=node.scrollTop;}
      const layoutRect=buttonRect?{left:buttonRect.left+scrollOffset.left,top:buttonRect.top+scrollOffset.top,
        right:buttonRect.right+scrollOffset.left,bottom:buttonRect.bottom+scrollOffset.top,width:buttonRect.width,height:buttonRect.height}:null;
      return {buttonRect,cardRect,scrollOffset,layoutRect,scroll};},stable=(left,right)=>['left','top','right','bottom','width','height']
        .every(key=>Math.abs(left.buttonRect[key]-right.buttonRect[key])<=.25)
        &&Math.abs(left.scrollOffset.left-right.scrollOffset.left)<=.25&&Math.abs(left.scrollOffset.top-right.scrollOffset.top)<=.25
        &&left.scroll.length===right.scroll.length&&left.scroll.every((row,index)=>row.every((value,axis)=>Math.abs(value-right.scroll[index][axis])<=.25));
    el.scrollIntoView({block:'nearest',inline:'nearest'});await wait();await wait();const first=snapshot();await wait();const second=snapshot();
    return {ok:stable(first,second),first,second};})()`;
}

const ARC4_DURABLE_SEGMENT_ROWS = Object.freeze({
  player: 'playerRow', creatures: 'creaturesRow', catalog: 'catalogRow',
  inventory: 'inventoryRow', settings: 'settingsRow',
});

function arc4OwnedAliasRows(codex, names) {
  if (!Array.isArray(codex) || !Array.isArray(names)) return null;
  const keys = new Set();
  for (const entry of codex) {
    const seed = entry?.g?.seed;
    if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffff_ffff) return null;
    keys.add(`cs${seed}`);
  }
  if (names.some((row) => !Array.isArray(row) || row.length !== 2
    || typeof row[0] !== 'string' || typeof row[1] !== 'string')) return null;
  return names.filter(([key]) => keys.has(key));
}

/* This is intentionally narrower than a raw-database fingerprint. Active-play
   checkpoints may advance only the outer revision, v4 `at`, and F4
   activePlayMs while Glass is measuring twelve layouts. The v4 `epoch` stays
   bound: a different ecology epoch would select a different authoritative
   roster and must not be normalized as checkpoint noise. Everything Arc 4
   can own or spend remains exact: all eighteen canonical Arc 4 ownership
   carrier byte strings, the aligned source-bound Arc 5 manifest and four
   fixed delta-shard byte strings, both copies of the v4 mirrors/rewards/
   counters, SessionRNG, and every receipt key/raw row. */
function arc4DurableNoMutationProjection(value) {
  if (!arc4DurableEvidenceComplete(value)) return null;
  const v4OwnedCounters = projectArc4V4OwnedCounters(value);
  const arc5Migration = projectArc5OwnershipMigrationEvidence(value);
  if (v4OwnedCounters === null || arc5Migration === null) return null;
  const ownershipCarriers = [];
  for (const { segment, namespace } of ARC4_OWNERSHIP_EXTENSION_TARGETS) {
    const carrier = value?.[ARC4_DURABLE_SEGMENT_ROWS[segment]]?.extensions?.[namespace];
    if (!carrier || Object.keys(carrier).sort().join('\0') !== 'json\0version'
      || carrier.version !== 1 || typeof carrier.json !== 'string') return null;
    ownershipCarriers.push({
      segment, namespace, version: carrier.version, json: carrier.json,
      byteLength: Buffer.byteLength(carrier.json, 'utf8'),
      jsonSha256: sha256(carrier.json),
    });
  }
  if (ownershipCarriers.length !== 18) return null;
  if (arc5Migration.representationVersion !== 2
    || !exactJson(arc5Migration.targets, ARC5_OWNERSHIP_EXTENSION_TARGETS)
    || !Array.isArray(arc5Migration.carriers)
    || arc5Migration.carriers.length !== ARC5_OWNERSHIP_EXTENSION_TARGETS.length
    || arc5Migration.carriers.some((carrier) => (
      !carrier || Object.keys(carrier).sort().join('\0') !== 'json\0version'
      || carrier.version !== 2 || typeof carrier.json !== 'string'
    ))) return null;
  const arc5Carriers = ARC5_OWNERSHIP_EXTENSION_TARGETS.map((target, index) => {
    const carrier = arc5Migration.carriers[index];
    return {
      ...target,
      version: carrier.version,
      json: carrier.json,
      byteLength: Buffer.byteLength(carrier.json, 'utf8'),
      jsonSha256: sha256(carrier.json),
    };
  });
  const legacy = value.legacy;
  const split = {
    codex: value.catalogRow?.data?.codex,
    names: value.playerRow?.data?.names,
    bx: value.inventoryRow?.data?.bx,
    scout: value.catalogRow?.data?.scout,
    epoch: value.playerRow?.data?.epoch,
    essence: value.playerRow?.data?.essence,
    essenceEarned: value.playerRow?.data?.essenceEarned,
  };
  const legacyOwnedAliases = arc4OwnedAliasRows(legacy?.codex, legacy?.names);
  const splitOwnedAliases = arc4OwnedAliasRows(split.codex, split.names);
  const rng = value.authority?.sessionRng;
  if (legacyOwnedAliases === null || splitOwnedAliases === null
    || !rng || !Number.isSafeInteger(rng.seed) || !Number.isSafeInteger(rng.ordinal)
    || !rng.draws || typeof rng.draws !== 'object' || Array.isArray(rng.draws)
    || !Array.isArray(value.receiptKeys) || !Array.isArray(value.receiptRawRows)) return null;
  return {
    schema: 'cf-v2-glass-arc4-no-mutation-projection/v1',
    ownershipCarriers,
    arc5Migration: {
      representationVersion: arc5Migration.representationVersion,
      targets: arc5Migration.targets,
      carriers: arc5Carriers,
      manifest: arc5Migration.manifest,
      source: arc5Migration.source,
      delta: arc5Migration.delta,
      targetMirror: arc5Migration.targetMirror,
      shards: arc5Migration.shards,
      sourceDigest: arc5Migration.sourceDigest,
      deltaDigest: arc5Migration.deltaDigest,
      targetDigest: arc5Migration.targetDigest,
      deltaRowCount: arc5Migration.deltaRowCount,
      shardCount: arc5Migration.shards.length,
      shardDigests: arc5Migration.shardDigests,
    },
    v4Mirror: {
      legacy: {
        epoch: legacy.epoch,
        codex: legacy.codex, ownedAliases: legacyOwnedAliases,
        bioX: legacy.bx, scoutId: legacy.scout,
        essence: legacy.essence, essenceEarned: legacy.essenceEarned,
      },
      split: {
        epoch: split.epoch,
        codex: split.codex, ownedAliases: splitOwnedAliases,
        bioX: split.bx, scoutId: split.scout,
        essence: split.essence, essenceEarned: split.essenceEarned,
      },
    },
    v4OwnedCounters,
    sessionRng: { seed: rng.seed, ordinal: rng.ordinal, draws: rng.draws },
    receipts: { keys: value.receiptKeys, rawRows: value.receiptRawRows },
  };
}

function arc4DurableFingerprint(value) {
  const projection = arc4DurableNoMutationProjection(value);
  return projection === null ? null : sha256(JSON.stringify(projection));
}

function arc4CanonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(arc4CanonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${arc4CanonicalJson(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
}

function arc5TargetMirrorFromArc4Mirror(source) {
  return {
    schema: 'cf-v2-ownership-state/v2',
    version: 2,
    revision: source.revision,
    source,
    bredAcquisitions: [],
    creatures: source.creatures,
    creatureTombstones: [],
    specimenLots: source.specimenLots,
    specimenTombstones: [],
    scoutCreatureId: source.scoutCreatureId,
  };
}

function arc5CompactRepresentationFromArc4Mirror(source) {
  const targetMirror = arc5TargetMirrorFromArc4Mirror(source);
  const delta = {
    schema: 'cf-v2-ownership-delta/v1', version: 1, rows: [],
  };
  const deltaDigest = sha256(arc4CanonicalJson(delta));
  const emptyShardDigest = sha256(arc4CanonicalJson([]));
  const shards = Array.from({ length: 4 }, (_, index) => ({
    schema: 'cf-v2-ownership-delta-shard/v1',
    version: 2,
    index,
    count: 4,
    start: 0,
    end: 0,
    total: 0,
    digest: emptyShardDigest,
    rows: [],
  }));
  const shardDigests = shards.map(({ digest }) => digest);
  const manifest = {
    schema: 'cf-v2-ownership-v1-to-v2/v2',
    version: 2,
    sourceSchema: source.schema,
    sourceVersion: source.version,
    sourceRevision: source.revision,
    sourceMode: source.mode,
    sourceDigest: sha256(JSON.stringify(source)),
    targetSchema: targetMirror.schema,
    targetVersion: targetMirror.version,
    targetRevision: targetMirror.revision,
    targetMode: targetMirror.source.mode,
    targetDigest: sha256(JSON.stringify(targetMirror)),
    deltaSchema: delta.schema,
    deltaVersion: delta.version,
    deltaDigest,
    deltaRowCount: delta.rows.length,
    fixedShardCount: shards.length,
    shardDigests,
  };
  return { manifest, shards, source, delta, targetMirror };
}

function arc5OwnershipV2SelftestState(evidence) {
  const migration = projectArc5OwnershipMigrationEvidence(evidence);
  if (migration === null) return null;
  return {
    schema: 'cf-v2-arc5-app-state/v3',
    stateKind: 'loaded',
    mode: migration.source.mode,
    representationVersion: migration.representationVersion,
    protection: migration.source.mode === 'current' ? null : 'legacy-protected',
    bootstrapPending: false,
    bootstrapOutcome: 'aligned',
    revision: migration.targetMirror.revision,
    sourceRevision: migration.source.revision,
    sourceDigest: migration.sourceDigest,
    targetDigest: migration.targetDigest,
    deltaDigest: migration.deltaDigest,
    deltaRows: migration.deltaRowCount,
    deltaShardCount: migration.shards.length,
    deltaShardDigests: migration.shardDigests,
    acquisitions: migration.source.discoveries.length
      + migration.targetMirror.bredAcquisitions.length,
    bredAcquisitions: migration.targetMirror.bredAcquisitions.length,
    creatures: migration.targetMirror.creatures.length,
    creatureTombstones: migration.targetMirror.creatureTombstones.length,
    specimenLots: migration.targetMirror.specimenLots.length,
    specimenTombstones: migration.targetMirror.specimenTombstones.length,
    biospheres: migration.source.biosphereProgress.length,
    feed: {
      lastOutcome: null,
      lastResult: null,
      controller: {
        schema: 'cf-v2-compendium-feed-diagnostics/v1',
        attachedMountCount: 0,
        retainedDomCount: 0,
        pendingWork: 0,
        convergenceLatched: false,
        delegatedListenerCount: 2,
        actionControlCount: 0,
        radioControlCount: 0,
        surfaceKey: null,
        contextKey: null,
        selectedCreatureId: null,
        selectedFoodLotId: null,
        lastRequest: null,
        lastOutcome: null,
      },
      actionCoordinator: {
        inFlight: false,
        owner: {
          schema: 'cf-v2-product-action-coordinator-diagnostics/v1',
          busy: false,
          operation: null,
        },
        hold: {
          schema: 'cf-v2-product-action-hold-diagnostics/v1',
          phase: 'idle',
          operation: null,
          sequence: 0,
        },
        faultArmed: {
          storageFailure: false,
          staleAuthority: false,
          publicationFailure: false,
        },
        lastFault: null,
      },
    },
    breed: {
      lastOutcome: null,
      lastResult: null,
      controller: {
        schema: 'cf-v2-compendium-breed-diagnostics/v1',
        attachedMountCount: 0,
        retainedDomCount: 0,
        pendingWork: 0,
        convergenceLatched: false,
        delegatedListenerCount: 2,
        renderedParentControlCount: 0,
        selectedPrimaryId: null,
        selectedMateId: null,
        primaryPage: 0,
        matePage: 0,
        surfaceKey: null,
        contextKey: null,
        lastRequest: null,
        lastOutcome: null,
      },
    },
    rename: {
      lastOutcome: null,
      lastResult: null,
      controller: {
        schema: 'cf-v2-compendium-rename-diagnostics/v1',
        attachedMountCount: 0,
        retainedDomCount: 0,
        pendingWork: 0,
        convergenceLatched: false,
        delegatedListenerCount: 3,
        creatureControlCount: 0,
        surfaceKey: null,
        contextKey: null,
        selectedCreatureId: null,
        currentPage: 0,
        lastRequest: null,
        lastOutcome: null,
      },
    },
    scout: {
      lastOutcome: null,
      lastResult: null,
      controller: {
        schema: 'cf-v2-compendium-scout-diagnostics/v1',
        attachedMountCount: 0,
        retainedDomCount: 0,
        pendingWork: 0,
        convergenceLatched: false,
        delegatedListenerCount: 2,
        creatureControlCount: 0,
        surfaceKey: null,
        contextKey: null,
        selectedCreatureId: null,
        currentPage: 0,
        lastRequest: null,
        lastOutcome: null,
      },
    },
  };
}

function arc4DurableProjectionSelftestFixture({
  ownershipRevision = 4, outerRevision = 9, activePlayMs = 4_000,
  checkpointAt = 1_000, ecologyEpoch = 0, sessionSeed = 68, sessionOrdinal = 3,
  sessionDraws = { existing: 3 },
  receipts = [{ ordinal: 2, kind: 'capture-attempt', witness: 'prior' }],
  speciesAlias = 'Wayfinder',
  canonicalAuthority = false,
  ownedCounters = { hybrids: 2, best: 5, maxGen: 1, bestRank: 3 },
} = {}) {
  const worldKey = 'CF1|g:999@90,-60|s:424242@560,170|p:133#2';
  const worldAddress = {
    format: 'CF1', key: worldKey,
    galaxy: {
      seed: 999, x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
      home: true, quasar: false, dwarf: false,
      parentCell: { x: 0, y: -1 },
    },
    star: {
      seed: 424242, x: 560, y: 170, layer: 'coarse', parentCell: { x: 12, y: 4 },
    },
    planet: { seed: 133, ordinal: 2 },
  };
  const speciesId = `species-v1:${'1'.repeat(64)}`;
  const genomeIdentity = `genome-v1:${'2'.repeat(64)}`;
  const discoveryId = `discovery-v1:${'3'.repeat(64)}`;
  const creatureId = `creature-v1:${'4'.repeat(64)}`;
  const species = {
    speciesId, genomeIdentity,
    kingdom: 'fauna', genome: { gen: 0, seed: 111 },
    alias: speciesAlias, firstObservationId: discoveryId,
  };
  const discovery = {
    recordId: discoveryId, speciesId: species.speciesId,
    acquisition: 'tame',
    provenance: {
      kind: 'world', verb: 'tame', worldKey, worldAddress, cycle: 0,
      sourceOrdinal: 0,
    },
    firstForSpecies: true,
  };
  const creature = {
    creatureId, speciesId: species.speciesId,
    genomeIdentity: species.genomeIdentity, genome: species.genome,
    nickname: null, origin: 'wild', acquisitionRecordId: discovery.recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: null, hurt: null, fed: null, brood: null, assignment: null, bond: null,
  };
  const progressRow = {
    worldKey, worldAddress, cycle: 0, used: 0, successful: [],
  };
  const mirror = {
    schema: 'cf-v2-ownership-state/v1', version: 1, revision: ownershipRevision,
    mode: 'current', catalogSpecies: [species], discoveries: [discovery],
    creatures: [creature], specimenLots: [], biosphereProgress: [progressRow],
    legacyBioX: [], scoutCreatureId: creature.creatureId, legacyProtection: null,
  };
  const groupSpecs = [
    ['catalogSpecies', 'catalog', 'arc4.ownership.catalog'],
    ['discoveries', 'catalog', 'arc4.ownership.discoveries'],
    ['creatures', 'creatures', 'arc4.ownership.creatures'],
    ['specimenLots', 'inventory', 'arc4.ownership.specimens'],
  ];
  const extensionRows = {
    player: {}, creatures: {}, catalog: {}, inventory: {}, settings: {},
  };
  const shardDigests = {};
  for (const [kind, segment, prefix] of groupSpecs) {
    const values = mirror[kind];
    shardDigests[kind] = [];
    for (let index = 0; index < 4; index++) {
      const shardRows = index === 0 ? values : [];
      const start = index === 0 ? 0 : values.length;
      const digest = sha256(arc4CanonicalJson(shardRows));
      const shard = {
        schema: 'cf-v2-ownership-shard/v1', version: 1, kind,
        revision: ownershipRevision, index, count: 4, start,
        end: values.length, total: values.length, digest, rows: shardRows,
      };
      extensionRows[segment][`${prefix}.${index}`] = {
        version: 1, json: arc4CanonicalJson(shard),
      };
      shardDigests[kind].push(digest);
    }
  }
  const progressPayload = {
    biosphereProgress: mirror.biosphereProgress,
    legacyBioX: mirror.legacyBioX,
    scoutCreatureId: mirror.scoutCreatureId,
  };
  const progressDigest = sha256(arc4CanonicalJson(progressPayload));
  const progress = {
    schema: 'cf-v2-ownership-progress/v1', version: 1,
    revision: ownershipRevision, digest: progressDigest, payload: progressPayload,
  };
  const manifest = {
    schema: 'cf-v2-ownership-manifest/v1', version: 1,
    revision: ownershipRevision, mode: 'current', fixedShardCount: 4,
    rowCounts: {
      catalogSpecies: 1, discoveries: 1, creatures: 1, specimenLots: 0,
      biosphereProgress: 1, legacyBioX: 0,
    },
    shardDigests, progressDigest, stateDigest: sha256(JSON.stringify(mirror)),
    legacyProtection: null,
  };
  extensionRows.player['arc4.ownership.manifest'] = {
    version: 1, json: arc4CanonicalJson(manifest),
  };
  extensionRows.player['arc4.ownership.progress'] = {
    version: 1, json: arc4CanonicalJson(progress),
  };
  const arc5 = arc5CompactRepresentationFromArc4Mirror(mirror);
  for (const [index, target] of ARC5_OWNERSHIP_EXTENSION_TARGETS.entries()) {
    extensionRows[target.segment][target.namespace] = {
      version: 2,
      json: arc4CanonicalJson(index === 0 ? arc5.manifest : arc5.shards[index - 1]),
    };
  }
  const sessionRng = {
    seed: sessionSeed, ordinal: sessionOrdinal,
    draws: Object.fromEntries(Object.entries(sessionDraws).sort(([left], [right]) => (
      left < right ? -1 : left > right ? 1 : 0
    ))),
  };
  const authority = { activePlayMs, sessionRng };
  /* F4 owns this exact constructor order. Canonical sorting is correct for
     ownership shards, but would manufacture a byte string the product never
     writes and make every durable projection fail closed. */
  const authorityCarrier = {
    version: 1,
    json: canonicalAuthority ? arc4CanonicalJson(authority) : JSON.stringify(authority),
  };
  extensionRows.player['f4.authority'] = authorityCarrier;
  const where = {
    type: 'planet',
    gal: {
      x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5, seed: 999,
      home: true, quasar: false, dwarf: false,
    },
    star: { x: 560, y: 170, seed: 424242 }, pseed: 133,
  };
  const codex = [{ g: { gen: 0, seed: 111 }, f: 'Canonical world 133', w: where }];
  const names = [['cs111', speciesAlias], ['ship', 'Unrelated vessel alias']];
  const bx = [[133, [0, 0]]];
  const ever = {
    v: 1, hybrids: ownedCounters.hybrids, best: ownedCounters.best,
    maxGen: ownedCounters.maxGen, scanhits: 0,
  };
  const legacy = {
    v: 4, epoch: ecologyEpoch, at: checkpointAt, essence: 7, essenceEarned: 7,
    ever, br: ownedCounters.bestRank, names, codex, scout: 's111', bx,
  };
  const rows = {
    player: {
      schema: 5, segment: 'player',
      data: {
        v: 4, epoch: ecologyEpoch, at: checkpointAt, essence: 7, essenceEarned: 7, names,
        ever, br: ownedCounters.bestRank,
      },
      extensions: extensionRows.player,
    },
    creatures: {
      schema: 5, segment: 'creatures', data: {}, extensions: extensionRows.creatures,
    },
    catalog: {
      schema: 5, segment: 'catalog', data: { codex, scout: 's111' },
      extensions: extensionRows.catalog,
    },
    inventory: {
      schema: 5, segment: 'inventory', data: { bx }, extensions: extensionRows.inventory,
    },
    settings: {
      schema: 5, segment: 'settings', data: {}, extensions: extensionRows.settings,
    },
  };
  const receiptRows = structuredClone(receipts);
  return {
    revisionRaw: String(outerRevision), revision: outerRevision,
    legacyRaw: JSON.stringify(legacy), legacy,
    playerRaw: JSON.stringify(rows.player), playerRow: rows.player,
    creaturesRaw: JSON.stringify(rows.creatures), creaturesRow: rows.creatures,
    catalogRaw: JSON.stringify(rows.catalog), catalogRow: rows.catalog,
    inventoryRaw: JSON.stringify(rows.inventory), inventoryRow: rows.inventory,
    settingsRaw: JSON.stringify(rows.settings), settingsRow: rows.settings,
    authorityVersion: 1, authorityJson: authorityCarrier.json, authority,
    captureRevision: ownershipRevision, captureState: mirror,
    receiptKeys: receiptRows.map(({ ordinal }) => `receipt:${ordinal}`),
    receiptRawRows: receiptRows.map((row) => JSON.stringify(row)), receiptRows,
  };
}

function arc4CaptureOutcomeInventoryOutcome(rows = [], viewports = MATRIX_VIEWPORTS) {
  const expected = viewports.flatMap((viewport) => ARC4_CAPTURE_OUTCOME_CODES
    .map((code) => `${viewport.label}\0${code}`));
  const actual = rows.map((row) => `${row?.viewport}\0${row?.code}`);
  const invalid = rows.filter((row) => !viewports.some(({ label }) => label === row?.viewport)
    || !ARC4_CAPTURE_OUTCOME_CODES.includes(row?.code)
    || typeof row?.surface !== 'string' || row.surface.length === 0
    || typeof row?.ok !== 'boolean' || !row?.checks || typeof row.checks !== 'object');
  const duplicates = actual.filter((id, index) => actual.indexOf(id) !== index);
  const complete = exactJson(actual, expected);
  return {
    ok: invalid.length === 0 && duplicates.length === 0,
    complete,
    expectedCount: expected.length,
    observedCount: actual.length,
    omitted: expected.filter((id) => !actual.includes(id)),
    invalid: invalid.map((row) => ({ viewport: row?.viewport ?? null, code: row?.code ?? null })),
    duplicates: [...new Set(duplicates)],
  };
}

function arc4CaptureOutcomeReportRow({ viewport, surface, code, outcome } = {}) {
  if (!ARC4_CAPTURE_OUTCOME_CODES.includes(code)) {
    throw new Error(`unknown Arc 4 capture outcome ${JSON.stringify(code)}`);
  }
  return {
    viewport, surface, code, ok: outcome?.ok === true,
    checks: { ...(outcome?.checks || {}) }, reasons: [...(outcome?.reasons || [])],
    diagnostics: outcome?.diagnostics ? structuredClone(outcome.diagnostics) : null,
  };
}

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

function releasedTameAudioDiagnosticsOutcome(audio) {
  if (!audio || typeof audio !== 'object' || Array.isArray(audio)) {
    return { ok: false, why: 'release witness audio snapshot is missing' };
  }
  const counterpart = audio.counterpart;
  const runtime = audio.runtime;
  const counterpartReleased = counterpart && typeof counterpart === 'object'
    && !Array.isArray(counterpart)
    && (counterpart.status === 'lost'
      || (counterpart.status === 'none'
        && counterpart.key === null && counterpart.generation === null));
  const checks = [
    ['schema', audio.schema === 'cf-v2-tame-greeting-audio/v1'],
    ['disposed', audio.disposed === true],
    ['armed', audio.armed === 0],
    ['activeVoiceId', audio.activeVoiceId === null],
    ['counterpart', counterpartReleased],
    ['runtime', !!runtime && typeof runtime === 'object' && !Array.isArray(runtime)],
    ['runtime.state', runtime?.state === 'disposed'],
    ['runtime.contextState', runtime?.contextState === null],
    ['runtime.nodes.active', runtime?.nodes?.active === 0],
    ['runtime.voices.active', runtime?.voices?.active === 0],
    ['runtime.voices.ids', Array.isArray(runtime?.voices?.ids) && runtime.voices.ids.length === 0],
    ['runtime.creatureEmitters.active', runtime?.creatureEmitters?.active === 0],
    ['runtime.reservations.voices.active', runtime?.reservations?.voices?.active === 0],
    ['runtime.reservations.nodes.active', runtime?.reservations?.nodes?.active === 0],
  ];
  const failed = checks.find(([, ok]) => !ok);
  return failed
    ? { ok: false, why: `release witness audio ${failed[0]} postcondition failed` }
    : { ok: true, why: null };
}

const SETTINGS_BOX_KEYS = Object.freeze(['left', 'top', 'right', 'bottom', 'width', 'height']);

function settingsFiniteBox(box) {
  return !!box && SETTINGS_BOX_KEYS.every((key) => Number.isFinite(box[key]));
}

function settingsBoxesMatch(left, right, epsilon = 0.25) {
  return settingsFiniteBox(left) && settingsFiniteBox(right)
    && SETTINGS_BOX_KEYS.every((key) => Math.abs(left[key] - right[key]) <= epsilon);
}

function settingsNullableBoxesMatch(left, right, epsilon = 0.25) {
  return left == null && right == null ? true : settingsBoxesMatch(left, right, epsilon);
}

function settingsCoordinatesMatch(left, right, keys, epsilon = 0.25) {
  return !!left && !!right && keys.every((key) => Number.isFinite(left[key])
    && Number.isFinite(right[key]) && Math.abs(left[key] - right[key]) <= epsilon);
}

function settingsRectContained(rect, bounds) {
  return settingsFiniteBox(rect) && settingsFiniteBox(bounds)
    && rect.left >= bounds.left - 1 && rect.top >= bounds.top - 1
    && rect.right <= bounds.right + 1 && rect.bottom <= bounds.bottom + 1;
}

function settingsRectsOverlap(left, right) {
  return settingsFiniteBox(left) && settingsFiniteBox(right)
    && left.left < right.right && left.right > right.left
    && left.top < right.bottom && left.bottom > right.top;
}

function settingsRectCenter(rect) {
  return settingsFiniteBox(rect)
    ? { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 }
    : null;
}

function settingsControlSettlementOutcome(control) {
  const first = control?.first;
  const second = control?.second;
  if (first?.exists === false && second?.exists === false) {
    const checks = {
      samples: first?.observed === true && second?.observed === true,
      identity: first?.id === second?.id,
      panelPresence: first?.panelExists === second?.panelExists,
      nodes: first?.panelNodeToken === second?.panelNodeToken
        && first?.controlNodeToken === second?.controlNodeToken
        && first?.closeNodeToken === second?.closeNodeToken,
      panelRect: settingsNullableBoxesMatch(first?.panelRect, second?.panelRect),
      panelScroll: settingsCoordinatesMatch(first?.panelScroll, second?.panelScroll, ['left', 'top']),
      documentScroll: settingsCoordinatesMatch(first?.documentScroll, second?.documentScroll, ['left', 'top']),
    };
    return { ok: Object.values(checks).every(Boolean), checks, first, second };
  }
  const firstContained = settingsRectContained(first?.rect, first?.bounds);
  const secondContained = settingsRectContained(second?.rect, second?.bounds);
  const checks = {
    samples: first?.exists === true && second?.exists === true,
    identity: typeof first?.id === 'string' && first.id === second?.id,
    nodes: Number.isInteger(first?.panelNodeToken) && Number.isInteger(first?.controlNodeToken)
      && first?.panelNodeToken === second?.panelNodeToken
      && first?.controlNodeToken === second?.controlNodeToken
      && first?.closeNodeToken === second?.closeNodeToken,
    semantics: first?.visible === second?.visible && first?.tag === second?.tag
      && first?.role === second?.role && first?.label === second?.label
      && first?.pressed === second?.pressed && first?.text === second?.text
      && first?.on === second?.on,
    rect: settingsBoxesMatch(first?.rect, second?.rect),
    panelRect: settingsBoxesMatch(first?.panelRect, second?.panelRect),
    bounds: settingsBoxesMatch(first?.bounds, second?.bounds),
    closeRect: settingsNullableBoxesMatch(first?.closeRect, second?.closeRect),
    panelScroll: settingsCoordinatesMatch(first?.panelScroll, second?.panelScroll, ['left', 'top']),
    documentScroll: settingsCoordinatesMatch(first?.documentScroll, second?.documentScroll, ['left', 'top']),
    containment: firstContained === secondContained,
    hitOwner: first?.hitOwner === second?.hitOwner && first?.hitButtonId === second?.hitButtonId,
    closeOverlap: settingsRectsOverlap(first?.rect, first?.closeRect)
      === settingsRectsOverlap(second?.rect, second?.closeRect),
  };
  return { ok: Object.values(checks).every(Boolean), checks, first, second };
}

function settingsPreparedControlCanDispatch(control, expectedId) {
  const settlement = settingsControlSettlementOutcome(control);
  const sample = control?.second;
  return settlement.ok && sample?.id === expectedId && sample?.visible === true
    && settingsFiniteBox(sample?.rect) && sample.rect.width >= 44 && sample.rect.height >= 44
    && settingsRectContained(sample.rect, sample?.bounds)
    && sample?.hitButtonId === expectedId
    && Number.isInteger(sample?.closeNodeToken) && settingsFiniteBox(sample?.closeRect)
    && !settingsRectsOverlap(sample.rect, sample.closeRect);
}

function settingsScrollRestorationOutcome(expected, actual) {
  const checks = {
    panel: settingsCoordinatesMatch(expected, actual, ['left', 'top']),
    document: settingsCoordinatesMatch(expected, actual, ['docLeft', 'docTop']),
  };
  return { ok: Object.values(checks).every(Boolean), checks, expected, actual };
}

function settingsControlProductOutcome(control, id, label, on) {
  const sample = control?.second;
  const rect = sample?.rect;
  const checks = {
    exists: sample?.exists === true && sample?.id === id,
    visible: sample?.visible === true,
    semantics: sample?.tag === 'BUTTON' && (sample?.role === null || sample?.role === 'button')
      && sample?.label === label && sample?.pressed === String(on)
      && sample?.text === (on ? 'On' : 'Off') && sample?.on === on,
    targetSize: settingsFiniteBox(rect) && rect.width >= 44 && rect.height >= 44,
    contained: settingsRectContained(rect, sample?.bounds),
    centreOwned: sample?.hitButtonId === id,
    closePresent: Number.isInteger(sample?.closeNodeToken) && settingsFiniteBox(sample?.closeRect),
    closeClear: !settingsRectsOverlap(rect, sample?.closeRect),
  };
  return { ok: Object.values(checks).every(Boolean), checks, sample };
}

function settingsAudioToggleOutcome(evidence, expected) {
  const soundSettlement = settingsControlSettlementOutcome(evidence?.sound);
  const voiceSettlement = settingsControlSettlementOutcome(evidence?.voice);
  const soundRestoration = settingsScrollRestorationOutcome(
    evidence?.sound?.prior, evidence?.sound?.restoredScroll,
  );
  const voiceRestoration = settingsScrollRestorationOutcome(
    evidence?.voice?.prior, evidence?.voice?.restoredScroll,
  );
  const outerExpected = evidence?.outerRestoration?.expected;
  const outerActual = evidence?.outerRestoration?.actual;
  const outerRestoration = settingsScrollRestorationOutcome(outerExpected, outerActual);
  const betweenExpected = evidence?.betweenRestoration?.expected;
  const betweenActual = evidence?.betweenRestoration?.actual;
  const betweenRestoration = settingsScrollRestorationOutcome(betweenExpected, betweenActual);
  const evidenceChecks = {
    collection: evidence && evidence.collectionError === null,
    sound: evidence?.sound?.error === null && evidence?.sound?.restorationError === null
      && settingsScrollRestorationOutcome(evidence?.original, evidence?.sound?.prior).ok
      && soundSettlement.ok && soundRestoration.ok,
    betweenRestoration: evidence?.betweenRestoration?.error === null
      && settingsScrollRestorationOutcome(evidence?.original, betweenExpected).ok
      && betweenRestoration.ok,
    voice: evidence?.voice?.error === null && evidence?.voice?.restorationError === null
      && settingsScrollRestorationOutcome(evidence?.original, evidence?.voice?.prior).ok
      && voiceSettlement.ok && voiceRestoration.ok,
    outerRestoration: evidence?.outerRestoration?.error === null
      && settingsScrollRestorationOutcome(evidence?.original, outerExpected).ok
      && outerRestoration.ok,
  };
  const instrumentOk = Object.values(evidenceChecks).every(Boolean);
  const soundProduct = settingsControlProductOutcome(evidence?.sound, 'setsnd', 'Sound', expected.soundOn);
  const voiceProduct = settingsControlProductOutcome(
    evidence?.voice, 'setvoice', 'Creature voices', expected.voiceOn,
  );
  const audio = evidence?.audio;
  const runtime = audio?.runtime;
  const expectedCreatureGain = expected.voiceOn ? 1 : 0;
  const masterGain = runtime?.gains?.master;
  const audioPolicy = {
    masterMute: runtime?.muted === !expected.soundOn,
    effectiveMaster: Number.isFinite(masterGain)
      && runtime?.gains?.effectiveMaster === (expected.soundOn ? masterGain : 0),
    creatureCategory: runtime?.gains?.categories?.creature === expectedCreatureGain,
    effectiveCreatureCategory:
      runtime?.voiceMix?.effectiveCategoryGains?.creature === expectedCreatureGain,
  };
  const settingsState = evidence?.state?.sndOn === expected.soundOn
    && evidence?.state?.voiceOn === expected.voiceOn;
  const focus = evidence?.focus === expected.focus;
  const noReplay = audio?.schema === 'cf-v2-tame-greeting-audio/v1'
    && audio.disposed === false && audio.armed === 0 && audio.claimedEvents === 0
    && audio.activeVoiceId === null && audio.lastEventKey === null
    && audio.counterpart?.key === null && audio.counterpart?.generation === null
    && audio.counterpart?.status === 'none'
    && runtime?.contextState === null && runtime?.contextGeneration === 0
    && Object.values(audioPolicy).every(Boolean)
    && runtime?.nodes?.active === 0
    && runtime?.voices?.active === 0
    && Array.isArray(runtime?.voices?.ids) && runtime.voices.ids.length === 0
    && runtime?.voices?.started === 0
    && runtime?.creatureEmitters?.active === 0
    && runtime?.reservations?.voices?.active === 0
    && runtime?.reservations?.nodes?.active === 0;
  const checks = { settingsState, soundControl: soundProduct.ok, voiceControl: voiceProduct.ok, focus, noReplay };
  const uiOk = settingsState && soundProduct.ok && voiceProduct.ok && focus;
  const audioOk = settingsState && noReplay;
  return {
    ok: instrumentOk && uiOk && audioOk,
    instrumentOk,
    evidenceOk: instrumentOk,
    evidenceChecks,
    evidenceDetails: {
      soundSettlement,
      voiceSettlement,
      soundRestoration,
      betweenRestoration,
      voiceRestoration,
      outerRestoration,
    },
    uiOk,
    audioOk,
    checks,
    productDetails: { sound: soundProduct, voice: voiceProduct, audioPolicy },
    expected,
    evidence,
  };
}

function settingsNativeActivationOutcome(evidence, expected) {
  const prepared = evidence?.prepared;
  const activation = evidence?.activation;
  const receipt = activation?.receipt;
  const restoration = evidence?.restoration;
  const settlement = settingsControlSettlementOutcome(prepared);
  const sample = prepared?.second;
  const centre = settingsRectCenter(sample?.rect);
  const target = activation?.target;
  const targetRect = Array.isArray(target?.rect) && target.rect.length === 4
    ? { left: target.rect[0], top: target.rect[1], right: target.rect[2], bottom: target.rect[3],
      width: target.rect[2] - target.rect[0], height: target.rect[3] - target.rect[1] }
    : null;
  const targetCentre = settingsRectCenter(targetRect);
  const restorationBinding = settingsScrollRestorationOutcome(evidence?.prior, restoration?.expected);
  const restorationResult = settingsScrollRestorationOutcome(restoration?.expected, restoration?.actual);
  const dispatchRequested = evidence?.dispatchRequested === true;
  const inputDispatched = activation?.inputDispatched === true;
  const preparedGeometry = {
    identity: sample?.id === expected.id,
    visible: sample?.visible === true,
    targetSize: settingsFiniteBox(sample?.rect) && sample.rect.width >= 44 && sample.rect.height >= 44,
    contained: settingsRectContained(sample?.rect, sample?.bounds),
    centreOwned: sample?.hitButtonId === expected.id,
    closePresent: Number.isInteger(sample?.closeNodeToken) && settingsFiniteBox(sample?.closeRect),
    closeClear: !settingsRectsOverlap(sample?.rect, sample?.closeRect),
  };
  const preparedProductOk = Object.values(preparedGeometry).every(Boolean);
  const within = (left, right) => Number.isFinite(left) && Number.isFinite(right)
    && Math.abs(left - right) <= 1;
  const coordinateEvidence = !inputDispatched || (!!targetCentre
    && within(targetCentre.x, target?.x) && within(targetCentre.y, target?.y)
    && within(target?.x, receipt?.x) && within(target?.y, receipt?.y));
  const requestedTargetEvidence = !dispatchRequested || (!!target && typeof target === 'object'
    && Object.hasOwn(activation, 'inputDispatched')
    && typeof activation.inputDispatched === 'boolean'
    && Object.hasOwn(target, 'id') && Object.hasOwn(target, 'rect')
    && Object.hasOwn(target, 'x') && Object.hasOwn(target, 'y')
    && Object.hasOwn(target, 'visible') && Object.hasOwn(target, 'opacity')
    && Object.hasOwn(target, 'hit') && Object.hasOwn(target, 'hitButtonId'));
  const targetCoordinateEvidence = !dispatchRequested || (settingsFiniteBox(targetRect)
    ? !!targetCentre && within(targetCentre.x, target?.x) && within(targetCentre.y, target?.y)
    : target?.rect === null && target?.x === null && target?.y === null);
  const evidenceChecks = {
    preparationTransport: evidence?.priorError === null && evidence?.preparedError === null,
    settlement: settlement.ok,
    dispatchDecision: dispatchRequested === preparedProductOk,
    dispatchTransport: evidence?.activationError === null
      && (dispatchRequested ? !!activation && typeof activation === 'object' : activation === null),
    requestedTargetEvidence,
    targetCoordinateEvidence,
    dispatchReceiptCoherence: inputDispatched ? (receipt && receipt.trusted === true
      && receipt.pointerType === expected.pointerType) : receipt == null,
    dispatchCoordinateEvidence: coordinateEvidence,
    dispatchFlagCoherence: !inputDispatched || dispatchRequested,
    trustedReceipt: !inputDispatched || (receipt && receipt.trusted === true
      && receipt.pointerType === expected.pointerType),
    cleanup: evidence?.cleanupError === null,
    restorationTransport: evidence?.restorationError === null,
    restorationBinding: restorationBinding.ok,
    restoration: restorationResult.ok,
  };
  const instrumentOk = Object.values(evidenceChecks).every(Boolean);
  const productChecks = {
    prepared: preparedProductOk,
    dispatchRequested,
    activationTarget: target?.id === expected.id && target?.hitButtonId === expected.id
      && target?.visible === true && Number.isFinite(target?.opacity) && target.opacity > 0
      && settingsFiniteBox(targetRect) && targetRect.width >= 44 && targetRect.height >= 44,
    preparedTargetRect: settingsBoxesMatch(sample?.rect, targetRect),
    preparedTargetCoordinates: !!centre && !!targetCentre
      && within(centre.x, target?.x) && within(centre.y, target?.y)
      && within(targetCentre.x, target?.x) && within(targetCentre.y, target?.y),
    inputDispatched,
    receiptTarget: receipt?.buttonId === expected.id,
  };
  const productOk = Object.values(productChecks).every(Boolean);
  return {
    ok: instrumentOk && productOk,
    instrumentOk,
    evidenceOk: instrumentOk,
    productOk,
    evidenceChecks,
    productChecks,
    details: { settlement, restorationBinding, restorationResult, preparedGeometry, centre, targetCentre },
    expected,
    evidence,
  };
}

function hostileCompendiumRevealReady(evidence) {
  return evidence?.ready === true && evidence?.targetMounted === true && evidence?.contained === true;
}

function hostileCompendiumGeometryOutcome(geometry, reveal) {
  return {
    ...geometry,
    reveal,
    ok: geometry?.ok === true && hostileCompendiumRevealReady(reveal),
  };
}

function hostileCompendiumRevealSelftest() {
  const failures = [];
  if (!hostileCompendiumRevealReady({ ready: true, targetMounted: true, contained: true })) {
    failures.push('contained mounted Compendium row was not reveal-ready');
  }
  for (const [label, evidence] of [
    ['mount-only overscan', { ready: true, targetMounted: true, contained: false }],
    ['unmounted containment', { ready: true, targetMounted: false, contained: true }],
    ['incoherent ready state', { ready: false, targetMounted: false, contained: true }],
    ['missing evidence', null],
  ]) {
    if (hostileCompendiumRevealReady(evidence)) failures.push(`${label} Compendium row was reveal-ready`);
  }
  const accepted = hostileCompendiumGeometryOutcome(
    { ok: true, logicalId: 'expected-row' },
    { ready: true, targetMounted: true, contained: true },
  );
  if (!accepted.ok || accepted.logicalId !== 'expected-row' || accepted.reveal?.contained !== true) {
    failures.push('contained Compendium geometry was not accepted with its reveal evidence intact');
  }
  for (const [label, geometry, reveal] of [
    ['mount-only fallback', { ok: true }, { ready: true, targetMounted: true, contained: false }],
    ['unmounted containment fallback', { ok: true }, { ready: false, targetMounted: false, contained: true }],
    ['bad geometry', { ok: false }, { ready: true, targetMounted: true, contained: true }],
    ['missing reveal', { ok: true }, null],
  ]) {
    if (hostileCompendiumGeometryOutcome(geometry, reveal).ok) {
      failures.push(`${label} Compendium geometry was accepted`);
    }
  }
  return failures;
}

function settingsPostActivationStateOutcome(observed, expected) {
  const checks = {
    sound: observed?.sndOn === expected.soundOn,
    voice: observed?.voiceOn === expected.voiceOn,
    focus: observed?.focus === expected.focus,
  };
  return { ok: Object.values(checks).every(Boolean), checks, observed, expected };
}

function settingsAudioViewportCoverageOutcome(expectedLabels, baselineLabels, completedLabels, productBlockedLabels) {
  const expected = new Set(expectedLabels);
  const baseline = new Set(baselineLabels);
  const completed = new Set(completedLabels);
  const productBlocked = new Set(productBlockedLabels);
  const unexpected = [...baseline, ...completed, ...productBlocked]
    .filter((label) => !expected.has(label));
  const overlap = [...completed].filter((label) => productBlocked.has(label));
  const accounted = new Set([...completed, ...productBlocked]);
  const checks = {
    uniqueExpected: expected.size === expectedLabels.length,
    noUnexpected: unexpected.length === 0,
    disjointTerminalState: overlap.length === 0,
    completedRequiresBaseline: [...completed].every((label) => baseline.has(label)),
    baselineHasTerminalState: [...baseline].every((label) => accounted.has(label)),
    allExpectedAccounted: expected.size === accounted.size
      && [...expected].every((label) => accounted.has(label)),
  };
  const instrumentOk = Object.values(checks).every(Boolean);
  const productOk = instrumentOk && productBlocked.size === 0
    && completed.size === expected.size && [...expected].every((label) => completed.has(label));
  return {
    ok: instrumentOk && productOk,
    instrumentOk,
    productOk,
    checks,
    expected: [...expected],
    baseline: [...baseline],
    completed: [...completed],
    productBlocked: [...productBlocked],
    unexpected,
    overlap,
  };
}

function settingsAudioEvidenceSelftest() {
  const failures = [];
  const offsets = () => ({ left: 0, top: 195, docLeft: 0, docTop: 0 });
  const panelRect = () => ({ left: 20, top: 20, right: 300, bottom: 500, width: 280, height: 480 });
  const bounds = () => ({ left: 20, top: 20, right: 300, bottom: 500, width: 280, height: 480 });
  const closeRect = () => ({ left: 244, top: 30, right: 288, bottom: 74, width: 44, height: 44 });
  const sample = (id, label, on, top) => ({
    observed: true,
    exists: true,
    id,
    panelNodeToken: 1,
    controlNodeToken: id === 'setsnd' ? 2 : 3,
    closeNodeToken: 4,
    visible: true,
    tag: 'BUTTON',
    role: null,
    label,
    pressed: String(on),
    text: on ? 'On' : 'Off',
    on,
    rect: { left: 80, top, right: 124, bottom: top + 44, width: 44, height: 44 },
    bounds: bounds(),
    panelRect: panelRect(),
    closeRect: closeRect(),
    panelScroll: { left: 0, top: 195 },
    documentScroll: { left: 0, top: 0 },
    hitOwner: `#${id}`,
    hitButtonId: id,
  });
  const control = (id, label, on, top) => {
    const first = sample(id, label, on, top);
    const second = structuredClone(first);
    const prior = offsets();
    return {
      ...second,
      first,
      second,
      prior,
      restoredScroll: structuredClone(prior),
      error: null,
      restorationError: null,
    };
  };
  const restoration = () => {
    const expected = offsets();
    return { ok: true, expected, actual: structuredClone(expected), error: null };
  };
  const fixture = (soundOn, voiceOn, focus = 'setvoice') => ({
    state: { sndOn: soundOn, voiceOn },
    focus,
    sound: control('setsnd', 'Sound', soundOn, 120),
    voice: control('setvoice', 'Creature voices', voiceOn, 200),
    original: offsets(),
    betweenRestoration: restoration(),
    outerRestoration: restoration(),
    collectionError: null,
    audio: {
      schema: 'cf-v2-tame-greeting-audio/v1', disposed: false, armed: 0,
      claimedEvents: 0, activeVoiceId: null, lastEventKey: null,
      counterpart: { key: null, generation: null, status: 'none' },
      runtime: {
        state: 'blocked', contextState: null, contextGeneration: 0,
        muted: !soundOn,
        gains: {
          master: 0.5,
          effectiveMaster: soundOn ? 0.5 : 0,
          categories: { creature: voiceOn ? 1 : 0 },
        },
        voiceMix: {
          effectiveCategoryGains: { creature: voiceOn ? 1 : 0 },
        },
        nodes: { active: 0 }, voices: { active: 0, ids: [], started: 0 },
        creatureEmitters: { active: 0 },
        reservations: { voices: { active: 0 }, nodes: { active: 0 } },
      },
    },
  });
  for (const [soundOn, voiceOn] of [[false, false], [true, false], [false, true], [true, true]]) {
    const result = settingsAudioToggleOutcome(
      fixture(soundOn, voiceOn), { soundOn, voiceOn, focus: 'setvoice' },
    );
    if (!result.ok) failures.push(`valid ${soundOn}/${voiceOn} Settings audio fixture was rejected`);
  }
  const expected = { soundOn: true, voiceOn: true, focus: 'setvoice' };
  const mutateVoiceSamples = (row, mutate) => {
    mutate(row.voice.first);
    mutate(row.voice.second);
    Object.assign(row.voice, row.voice.second);
  };
  const productMutations = [
    ['voice tag', (row) => mutateVoiceSamples(row, (value) => { value.tag = 'DIV'; })],
    ['voice role', (row) => mutateVoiceSamples(row, (value) => { value.role = 'switch'; })],
    ['voice label', (row) => mutateVoiceSamples(row, (value) => { value.label = 'Voices'; })],
    ['voice pressed', (row) => mutateVoiceSamples(row, (value) => { value.pressed = 'false'; })],
    ['voice text', (row) => mutateVoiceSamples(row, (value) => { value.text = 'Off'; })],
    ['voice class', (row) => mutateVoiceSamples(row, (value) => { value.on = false; })],
    ['voice visibility', (row) => mutateVoiceSamples(row, (value) => { value.visible = false; })],
    ['voice width', (row) => mutateVoiceSamples(row, (value) => {
      value.rect.right -= 1; value.rect.width = 43;
    })],
    ['voice containment', (row) => mutateVoiceSamples(row, (value) => {
      value.rect.top = 501; value.rect.bottom = 545;
    })],
    ['voice centre owner', (row) => mutateVoiceSamples(row, (value) => {
      value.hitOwner = '#dock'; value.hitButtonId = null;
    })],
    ['voice close overlap', (row) => mutateVoiceSamples(row, (value) => {
      value.rect = structuredClone(value.closeRect);
    })],
    ['voice missing Close', (row) => mutateVoiceSamples(row, (value) => {
      value.closeNodeToken = null; value.closeRect = null;
    })],
    ['focus', (row) => { row.focus = 'setsnd'; }],
    ['sound state', (row) => { row.state.sndOn = false; }],
    ['voice state', (row) => { row.state.voiceOn = false; }],
    ['disposed', (row) => { row.audio.disposed = true; }],
    ['armed', (row) => { row.audio.armed = 1; }],
    ['claimed event', (row) => { row.audio.claimedEvents = 1; }],
    ['active voice', (row) => { row.audio.activeVoiceId = 'voice:1'; }],
    ['event key', (row) => { row.audio.lastEventKey = 'arc4:taming-succeeded:x'; }],
    ['counterpart key', (row) => { row.audio.counterpart.key = 'toast:1'; }],
    ['counterpart generation', (row) => { row.audio.counterpart.generation = 1; }],
    ['counterpart status', (row) => { row.audio.counterpart.status = 'live'; }],
    ['context', (row) => { row.audio.runtime.contextState = 'running'; }],
    ['context generation', (row) => { row.audio.runtime.contextGeneration = 1; }],
    ['mute policy', (row) => { row.audio.runtime.muted = true; }],
    ['effective master policy', (row) => { row.audio.runtime.gains.effectiveMaster = 0; }],
    ['creature category policy', (row) => { row.audio.runtime.gains.categories.creature = 0; }],
    ['effective creature category policy', (row) => {
      row.audio.runtime.voiceMix.effectiveCategoryGains.creature = 0;
    }],
    ['nodes', (row) => { row.audio.runtime.nodes.active = 1; }],
    ['voices', (row) => { row.audio.runtime.voices.active = 1; }],
    ['voice ids', (row) => { row.audio.runtime.voices.ids.push('voice:1'); }],
    ['voice starts', (row) => { row.audio.runtime.voices.started = 1; }],
    ['creature emitters', (row) => { row.audio.runtime.creatureEmitters.active = 1; }],
    ['voice reservation', (row) => { row.audio.runtime.reservations.voices.active = 1; }],
    ['node reservation', (row) => { row.audio.runtime.reservations.nodes.active = 1; }],
  ];
  for (const [label, mutate] of productMutations) {
    const row = structuredClone(fixture(true, true));
    mutate(row);
    const outcome = settingsAudioToggleOutcome(row, expected);
    if (outcome.ok || !outcome.instrumentOk) {
      failures.push(`${label} Settings audio mutation stayed green`);
    }
  }
  for (const [label, soundOn, voiceOn, mutate] of [
    ['enabled master incorrectly muted', true, false,
      (row) => { row.audio.runtime.muted = true; }],
    ['disabled master incorrectly unmuted', false, true,
      (row) => { row.audio.runtime.muted = false; }],
    ['disabled creature category incorrectly open', true, false,
      (row) => { row.audio.runtime.gains.categories.creature = 1; }],
    ['disabled effective creature category incorrectly open', true, false,
      (row) => { row.audio.runtime.voiceMix.effectiveCategoryGains.creature = 1; }],
  ]) {
    const row = structuredClone(fixture(soundOn, voiceOn));
    mutate(row);
    const outcome = settingsAudioToggleOutcome(
      row, { soundOn, voiceOn, focus: 'setvoice' },
    );
    if (outcome.ok || !outcome.instrumentOk) {
      failures.push(`${label} Settings audio policy mutation stayed green`);
    }
  }
  const evidenceMutations = [
    ['voice first/second rect drift', (row) => { row.voice.first.rect.top -= 1; }],
    ['voice panel drift', (row) => { row.voice.first.panelRect.left -= 1; }],
    ['voice Close drift', (row) => { row.voice.first.closeRect.top -= 1; }],
    ['voice hit-owner drift', (row) => { row.voice.first.hitOwner = '#dock'; }],
    ['voice control replacement', (row) => { row.voice.first.controlNodeToken = 99; }],
    ['voice panel replacement', (row) => { row.voice.first.panelNodeToken = 99; }],
    ['voice Close replacement', (row) => { row.voice.first.closeNodeToken = 99; }],
    ['voice missing-to-mounted transition', (row) => {
      row.voice.first = {
        observed: true,
        exists: false,
        id: 'setvoice',
        panelExists: true,
        panelNodeToken: 1,
        controlNodeToken: null,
        closeNodeToken: 4,
        panelRect: panelRect(),
        panelScroll: { left: 0, top: 195 },
        documentScroll: { left: 0, top: 0 },
      };
    }],
    ['voice document-scroll drift', (row) => { row.voice.first.documentScroll.top = 1; }],
    ['voice restoration', (row) => { row.voice.restoredScroll.top += 1; }],
    ['sound self-authorized restoration', (row) => {
      row.sound.prior.top = 0; row.sound.restoredScroll.top = 0;
    }],
    ['voice self-authorized restoration', (row) => {
      row.voice.prior.top = 0; row.voice.restoredScroll.top = 0;
    }],
    ['between restoration authority', (row) => { row.betweenRestoration.expected.top += 1; }],
    ['outer restoration actual', (row) => { row.outerRestoration.actual.docTop += 1; }],
    ['collection error', (row) => { row.collectionError = 'injected'; }],
  ];
  for (const [label, mutate] of evidenceMutations) {
    const row = structuredClone(fixture(true, true));
    mutate(row);
    const outcome = settingsAudioToggleOutcome(row, expected);
    if (outcome.instrumentOk || outcome.ok) failures.push(`${label} Settings evidence mutation stayed green`);
  }
  const activationFixture = (pointerType = 'touch') => {
    const prepared = control('setvoice', 'Creature voices', true, 200);
    const rect = prepared.second.rect;
    const x = (rect.left + rect.right) / 2;
    const y = (rect.top + rect.bottom) / 2;
    const prior = offsets();
    return {
      prior,
      prepared,
      activation: {
        ok: true,
        inputDispatched: true,
        target: {
          id: 'setvoice', x, y, rect: [rect.left, rect.top, rect.right, rect.bottom],
          visible: true, opacity: 1, hit: 'setvoice', hitButtonId: 'setvoice',
        },
        receipt: { buttonId: 'setvoice', trusted: true, pointerType, x, y },
      },
      restoration: { expected: structuredClone(prior), actual: structuredClone(prior) },
      dispatchRequested: true,
      priorError: null,
      preparedError: null,
      activationError: null,
      cleanupError: null,
      restorationError: null,
    };
  };
  for (const pointerType of ['touch', 'mouse']) {
    const result = settingsNativeActivationOutcome(
      activationFixture(pointerType), { id: 'setvoice', pointerType },
    );
    if (!result.ok) failures.push(`valid ${pointerType} Settings native activation fixture was rejected`);
  }
  const activationInstrumentMutations = [
    ['prepared first/second drift', (row) => { row.prepared.first.rect.top -= 1; }],
    ['prepared panel drift', (row) => { row.prepared.first.panelRect.left -= 1; }],
    ['prepared Close drift', (row) => { row.prepared.first.closeRect.top -= 1; }],
    ['prepared hit-owner drift', (row) => { row.prepared.first.hitOwner = '#dock'; }],
    ['prepared control replacement', (row) => { row.prepared.first.controlNodeToken = 99; }],
    ['prepared panel replacement', (row) => { row.prepared.first.panelNodeToken = 99; }],
    ['prepared Close replacement', (row) => { row.prepared.first.closeNodeToken = 99; }],
    ['prepared missing-to-mounted transition', (row) => {
      row.prepared.first = {
        observed: true,
        exists: false,
        id: 'setvoice',
        panelExists: true,
        panelNodeToken: 1,
        controlNodeToken: null,
        closeNodeToken: 4,
        panelRect: panelRect(),
        panelScroll: { left: 0, top: 195 },
        documentScroll: { left: 0, top: 0 },
      };
    }],
    ['prepared document-scroll drift', (row) => { row.prepared.first.documentScroll.top += 1; }],
    ['activation target coordinates', (row) => { row.activation.target.x += 2; }],
    ['activation target rect coordinates', (row) => { row.activation.target.rect[0] += 4; }],
    ['receipt coordinates', (row) => { row.activation.receipt.x += 2; }],
    ['receipt trust', (row) => { row.activation.receipt.trusted = false; }],
    ['pointer type', (row) => { row.activation.receipt.pointerType = 'mouse'; }],
    ['missing receipt', (row) => { row.activation.receipt = null; }],
    ['missing refusal target evidence', (row) => {
      row.activation.inputDispatched = false; row.activation.target = null; row.activation.receipt = null;
    }],
    ['refusal target coordinate drift', (row) => {
      row.activation.inputDispatched = false; row.activation.receipt = null; row.activation.target.x += 2;
    }],
    ['restoration expected binding', (row) => { row.restoration.expected.top += 1; }],
    ['restoration actual', (row) => { row.restoration.actual.docTop += 1; }],
    ['activation transport', (row) => { row.activationError = 'injected'; }],
    ['cleanup transport', (row) => { row.cleanupError = 'injected'; }],
  ];
  for (const [label, mutate] of activationInstrumentMutations) {
    const row = activationFixture('touch');
    mutate(row);
    const outcome = settingsNativeActivationOutcome(row, { id: 'setvoice', pointerType: 'touch' });
    if (outcome.instrumentOk || outcome.ok) failures.push(`${label} Settings activation evidence mutation stayed green`);
  }
  const applyPreparedDispatchDecision = (row) => {
    row.dispatchRequested = settingsPreparedControlCanDispatch(row.prepared, 'setvoice');
    if (!row.dispatchRequested) row.activation = null;
  };
  const activationProductMutations = [
    ['prepared identity', (row) => {
      row.prepared.first.id = 'setsnd'; row.prepared.second.id = 'setsnd';
      applyPreparedDispatchDecision(row);
    }],
    ['prepared centre owner', (row) => {
      for (const value of [row.prepared.first, row.prepared.second]) {
        value.hitOwner = '#setsnd'; value.hitButtonId = 'setsnd';
      }
      applyPreparedDispatchDecision(row);
    }],
    ['prepared invisible', (row) => {
      row.prepared.first.visible = false; row.prepared.second.visible = false;
      applyPreparedDispatchDecision(row);
    }],
    ['prepared missing Close', (row) => {
      for (const value of [row.prepared.first, row.prepared.second]) {
        value.closeNodeToken = null; value.closeRect = null;
      }
      applyPreparedDispatchDecision(row);
    }],
    ['activation target', (row) => { row.activation.target.id = 'setsnd'; }],
    ['activation same-centre resize', (row) => {
      row.activation.target.rect = [60, 180, 144, 264];
    }],
    ['dispatch-time target refusal', (row) => {
      row.activation.ok = false;
      row.activation.inputDispatched = false;
      row.activation.target.hit = 'dock';
      row.activation.target.hitButtonId = null;
      row.activation.receipt = null;
    }],
    ['receipt target', (row) => { row.activation.receipt.buttonId = 'setsnd'; }],
  ];
  for (const [label, mutate] of activationProductMutations) {
    const row = activationFixture('touch');
    mutate(row);
    const outcome = settingsNativeActivationOutcome(row, { id: 'setvoice', pointerType: 'touch' });
    if (!outcome.instrumentOk || outcome.productOk || outcome.ok) {
      failures.push(`${label} Settings activation product mutation was misclassified`);
    }
  }
  for (const [label, mutate] of [
    ['unsafe invisible dispatch', (row) => {
      row.prepared.first.visible = false; row.prepared.second.visible = false;
    }],
    ['unsafe wrong-owner dispatch', (row) => {
      for (const value of [row.prepared.first, row.prepared.second]) {
        value.hitOwner = '#setsnd'; value.hitButtonId = 'setsnd';
      }
    }],
  ]) {
    const row = activationFixture('touch');
    mutate(row);
    const outcome = settingsNativeActivationOutcome(row, { id: 'setvoice', pointerType: 'touch' });
    if (outcome.instrumentOk || outcome.ok) {
      failures.push(`${label} Settings dispatch-decision mutation stayed instrument-green`);
    }
  }
  const postExpected = { soundOn: true, voiceOn: false, focus: 'setsnd' };
  const postObserved = { sndOn: true, voiceOn: false, focus: 'setsnd' };
  if (!settingsPostActivationStateOutcome(postObserved, postExpected).ok) {
    failures.push('valid Settings post-activation state was rejected');
  }
  for (const [label, mutate] of [
    ['post sound state', (row) => { row.sndOn = false; }],
    ['post voice state', (row) => { row.voiceOn = true; }],
    ['post focus', (row) => { row.focus = 'setvoice'; }],
  ]) {
    const row = { ...postObserved };
    mutate(row);
    if (settingsPostActivationStateOutcome(row, postExpected).ok) {
      failures.push(`${label} Settings mutation stayed green`);
    }
  }
  const expectedViewports = ['phone', 'desktop'];
  const completeCoverage = settingsAudioViewportCoverageOutcome(
    expectedViewports, expectedViewports, expectedViewports, [],
  );
  const productBlockedCoverage = settingsAudioViewportCoverageOutcome(
    expectedViewports, expectedViewports, ['phone'], ['desktop'],
  );
  if (!completeCoverage.ok || !completeCoverage.instrumentOk || !completeCoverage.productOk) {
    failures.push('complete Settings viewport coverage was rejected');
  }
  if (!productBlockedCoverage.instrumentOk || productBlockedCoverage.productOk || productBlockedCoverage.ok) {
    failures.push('product-blocked Settings viewport coverage was misclassified');
  }
  const preBaselineProductBlockedCoverage = settingsAudioViewportCoverageOutcome(
    expectedViewports, ['phone'], ['phone'], ['desktop'],
  );
  if (!preBaselineProductBlockedCoverage.instrumentOk
    || preBaselineProductBlockedCoverage.productOk || preBaselineProductBlockedCoverage.ok) {
    failures.push('pre-baseline product-blocked Settings viewport coverage was misclassified');
  }
  for (const [label, coverage] of [
    ['premature baseline credit', settingsAudioViewportCoverageOutcome(
      expectedViewports, expectedViewports, ['phone'], [],
    )],
    ['overlapping terminal credit', settingsAudioViewportCoverageOutcome(
      expectedViewports, expectedViewports, expectedViewports, ['desktop'],
    )],
    ['unknown viewport credit', settingsAudioViewportCoverageOutcome(
      expectedViewports, [...expectedViewports, 'tablet'], expectedViewports, [],
    )],
    ['completed without baseline', settingsAudioViewportCoverageOutcome(
      expectedViewports, ['phone'], expectedViewports, [],
    )],
  ]) {
    if (coverage.instrumentOk) failures.push(`${label} stayed instrument-green`);
  }
  return failures;
}

const SETTINGS_AUDIO_EVIDENCE_EXPRESSION = `(async()=>{
  const wait=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0))),
    owner=(node)=>node?(node.id?'#'+node.id:(node.getAttribute?.('data-pnx')?'[data-pnx="'+node.getAttribute('data-pnx')+'"]':node.tagName||null)):null,
    box=(rect)=>rect?{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,
      width:rect.width,height:rect.height}:null,
    tokens=new WeakMap();let nextToken=1;
  const token=(node)=>{if(!(node instanceof Element))return null;
      if(!tokens.has(node))tokens.set(node,nextToken++);return tokens.get(node);},
    offsets=()=>{const panel=document.getElementById('setpanel');return {
      left:panel?.scrollLeft??0,top:panel?.scrollTop??0,docLeft:scrollX,docTop:scrollY};},
    sameOffsets=(left,right)=>!!left&&!!right&&['left','top','docLeft','docTop']
      .every(key=>Number.isFinite(left[key])&&Number.isFinite(right[key])&&Math.abs(left[key]-right[key])<=.25),
    restore=async(expected)=>{let error=null;
      try{const panel=document.getElementById('setpanel');
        if(panel instanceof HTMLElement){panel.scrollLeft=expected.left;panel.scrollTop=expected.top;}
        scrollTo(expected.docLeft,expected.docTop);await wait();await wait();}
      catch(cause){error=String(cause?.message||cause);}
      const actual=offsets();return {ok:error===null&&sameOffsets(expected,actual),expected,actual,error};};
  const original=offsets();
  const control=async(id)=>{
    const prior={...original};
    const capture=()=>{
      const panel=document.getElementById('setpanel'),element=document.getElementById(id),
        close=panel?.querySelector(':scope > [data-pnx="set"]')??null,
        nodeEvidence={panelNodeToken:token(panel),controlNodeToken:token(element),closeNodeToken:token(close)};
      if(!(panel instanceof HTMLElement)||!(element instanceof HTMLElement))return {
        observed:true,exists:false,id,panelExists:panel instanceof HTMLElement,...nodeEvidence,
        panelRect:panel instanceof HTMLElement?box(panel.getBoundingClientRect()):null,
        panelScroll:{left:panel?.scrollLeft??0,top:panel?.scrollTop??0},
        documentScroll:{left:scrollX,top:scrollY}};
      const rect=element.getBoundingClientRect(),panelRect=panel.getBoundingClientRect(),
        closeRect=close?.getBoundingClientRect?.()??null,style=getComputedStyle(element),
        boundsRect={left:Math.max(0,panelRect.left),top:Math.max(0,panelRect.top),
          right:Math.min(innerWidth,panelRect.right),bottom:Math.min(innerHeight,panelRect.bottom)},
        bounds={...boundsRect,width:boundsRect.right-boundsRect.left,height:boundsRect.bottom-boundsRect.top},
        x=(rect.left+rect.right)/2,y=(rect.top+rect.bottom)/2,point=document.elementFromPoint(x,y);
      return {observed:true,exists:true,id:element.id,...nodeEvidence,
        visible:style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&rect.width>0&&rect.height>0,
        tag:element.tagName,role:element.getAttribute('role')??null,
        label:element.getAttribute('aria-label')??null,pressed:element.getAttribute('aria-pressed')??null,
        text:(element.textContent||'').trim(),on:element.classList.contains('on'),
        rect:box(rect),bounds,panelRect:box(panelRect),closeRect:box(closeRect),
        panelScroll:{left:panel.scrollLeft,top:panel.scrollTop},documentScroll:{left:scrollX,top:scrollY},
        hitOwner:owner(point),hitButtonId:point?.closest?.('button')?.id??null};
    };
    let first=null,second=null,error=null,restoration=null;
    try{document.getElementById(id)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      await wait();await wait();first=capture();await wait();second=capture();}
    catch(cause){error=String(cause?.message||cause);}
    finally{restoration=await restore(prior);}
    return {...(second||first||{}),first,second,prior,restoredScroll:restoration.actual,
      error,restorationError:restoration.error};
  };
  let sound=null,voice=null,betweenRestoration=null,collectionError=null,outerRestoration=null;
  try{sound=await control('setsnd');betweenRestoration=await restore(original);
    if(!betweenRestoration.ok)throw new Error('Sound sampling did not restore the phase authority before Voice sampling');
    voice=await control('setvoice');}
  catch(cause){collectionError=String(cause?.message||cause);}
  finally{outerRestoration=await restore(original);}
  const state=window.__CF_SLICE__?.api?.state?.(),panel=document.getElementById('setpanel'),
    close=panel?.querySelector(':scope > [data-pnx="set"]')??null,closeRect=close?.getBoundingClientRect?.()??null;
  return {state:{sndOn:state?.sndOn,voiceOn:state?.voiceOn},focus:document.activeElement?.id||null,
    sound,voice,original,betweenRestoration,outerRestoration,collectionError,
    panel:{scrollLeft:panel?.scrollLeft??null,scrollTop:panel?.scrollTop??null,
      closeRect:closeRect?[closeRect.left,closeRect.top,closeRect.right,closeRect.bottom]:null},
    audio:state?.audio??null};
})()`;

const SETTINGS_CLOSE_CLEARANCE_EXPRESSION = `(()=>{const panel=document.getElementById('setpanel'),
  close=panel?.querySelector(':scope > [data-pnx="set"]')??null,sound=document.getElementById('setsnd');
  if(!panel||!close||!sound)return {ok:false,why:'Settings panel, Close, or Sound control missing'};
  const before={left:panel.scrollLeft,top:panel.scrollTop},cr0=close.getBoundingClientRect(),sr0=sound.getBoundingClientRect();
  panel.scrollTop=Math.max(0,Math.min(panel.scrollHeight-panel.clientHeight,
    panel.scrollTop+((sr0.top+sr0.bottom)-(cr0.top+cr0.bottom))/2));
  const cr=close.getBoundingClientRect(),sr=sound.getBoundingClientRect(),x=(sr.left+sr.right)/2,y=(sr.top+sr.bottom)/2,
    hit=document.elementFromPoint(x,y),overlap=sr.left<cr.right&&sr.right>cr.left&&sr.top<cr.bottom&&sr.bottom>cr.top,
    centreOwned=hit===sound||sound.contains(hit),verticalAligned=Math.abs((sr.top+sr.bottom)-(cr.top+cr.bottom))<=2,
    clearance=cr.left-sr.right;
  panel.scrollLeft=before.left;panel.scrollTop=before.top;
  const restoration={left:panel.scrollLeft,top:panel.scrollTop,ok:panel.scrollLeft===before.left&&panel.scrollTop===before.top};
  return {ok:verticalAligned&&!overlap&&centreOwned&&clearance>=0&&restoration.ok,verticalAligned,overlap,centreOwned,
    clearance,hit:hit?(hit.id?'#'+hit.id:(hit.getAttribute?.('data-pnx')?'[data-pnx="'+hit.getAttribute('data-pnx')+'"]':hit.tagName||null)):null,
    sound:[sr.left,sr.top,sr.right,sr.bottom],close:[cr.left,cr.top,cr.right,cr.bottom],before,restoration};})()`;

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
  if (!['training-restart', 'training-complete', 'training-recovery', 'save-import', 'storage-retry'].includes(witness.reason)) {
    return { ok: false, why: 'release witness reason is invalid', witness };
  }
  if (typeof witness.documentToken !== 'string' || !witness.documentToken) {
    return { ok: false, why: 'release witness document token is missing', witness };
  }
  const audio = releasedTameAudioDiagnosticsOutcome(witness.audio);
  if (!audio.ok) return { ok: false, why: audio.why, witness };
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
  const validReleasedAudio = {
    schema: 'cf-v2-tame-greeting-audio/v1', disposed: true, armed: 0,
    claimedEvents: 0, activeVoiceId: null, lastEventKey: null,
    lastDisposition: 'disposed',
    counterpart: { key: null, generation: null, status: 'none' },
    runtime: {
      state: 'disposed', contextState: null, contextGeneration: 0,
      nodes: { active: 0 }, voices: { active: 0, ids: [], started: 0 },
      creatureEmitters: { active: 0 },
      reservations: { voices: { active: 0 }, nodes: { active: 0 } },
    },
  };
  const validRelease = {
    schema: 'cf-v2-reload-release/v1', status: 'released', error: null,
    reason: 'save-import', documentToken: priorToken,
    audio: validReleasedAudio,
    rendererReleased: true, stageReleased: true, viewDetached: true,
    appCanvas: { beforeWidth: 4096, beforeHeight: 2048, afterWidth: 1, afterHeight: 1 },
    backdropCanvas: { beforeWidth: 4096, beforeHeight: 2048, afterWidth: 0, afterHeight: 0 },
  };
  const releaseAccepted = validateReloadReleaseWitness(JSON.stringify(validRelease), ordinaryViewport);
  if (!releaseAccepted.ok) {
    failures.push(`valid reload-resource witness was rejected: ${JSON.stringify(releaseAccepted)}`);
  }
  const audioMutations = [
    ['missing snapshot', (row) => { delete row.audio; }],
    ['schema', (row) => { row.audio.schema = 'wrong'; }],
    ['disposed', (row) => { row.audio.disposed = false; }],
    ['armed', (row) => { row.audio.armed = 1; }],
    ['active voice', (row) => { row.audio.activeVoiceId = 'voice:1'; }],
    ['counterpart key', (row) => { row.audio.counterpart.key = 'toast:1'; }],
    ['counterpart generation', (row) => { row.audio.counterpart.generation = 1; }],
    ['counterpart status', (row) => { row.audio.counterpart.status = 'live'; }],
    ['runtime state', (row) => { row.audio.runtime.state = 'running'; }],
    ['context', (row) => { row.audio.runtime.contextState = 'running'; }],
    ['nodes', (row) => { row.audio.runtime.nodes.active = 1; }],
    ['voices', (row) => { row.audio.runtime.voices.active = 1; }],
    ['voice ids', (row) => { row.audio.runtime.voices.ids.push('voice:1'); }],
    ['creature emitters', (row) => { row.audio.runtime.creatureEmitters.active = 1; }],
    ['voice reservations', (row) => { row.audio.runtime.reservations.voices.active = 1; }],
    ['node reservations', (row) => { row.audio.runtime.reservations.nodes.active = 1; }],
  ];
  for (const [label, mutate] of audioMutations) {
    const row = structuredClone(validRelease);
    mutate(row);
    const rejected = validateReloadReleaseWitness(row, ordinaryViewport);
    if (rejected.ok || !/release witness audio/.test(rejected.why || '')) {
      failures.push(`${label} reload-audio mutation was accepted: ${JSON.stringify(rejected)}`);
    }
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
function viewportTimingsOutcome(timings, { certifying, status }) {
  /* Per-row timing is evidence, not decoration: every recorded row must be
     well-formed, and a certifying PASS must have timed every matrix row
     exactly once in order — a green report that silently lost its timing
     rows would make the next optimization pass measure nothing. Red and
     targeted runs legitimately carry partial timings. */
  for (const row of timings) {
    if (!row || typeof row.label !== 'string'
      || !Number.isFinite(row.durationMs) || row.durationMs <= 0) {
      return { ok: false, why: `malformed viewport timing row: ${JSON.stringify(row)}` };
    }
  }
  if (certifying && status === 'pass') {
    const expected = MATRIX_VIEWPORTS.map((vp) => vp.label);
    const actual = timings.map((row) => row.label);
    if (expected.length !== actual.length
      || expected.some((label, index) => label !== actual[index])) {
      return {
        ok: false,
        why: `certifying PASS must time every matrix row exactly once in order; expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`,
      };
    }
  }
  return { ok: true, why: null };
}

const GLASS_SHIPYARD_SETTLEMENT_SCHEMA = 'cf-v2-glass-shipyard-panel-settlement/v1';
function shipyardPanelSettlementOutcome(value, expectedCardOpen) {
  const engineering = value?.engineering;
  const persistence = value?.persistence;
  const runtime = persistence?.runtime;
  const resources = value?.sceneResources;
  const diagnostics = value?.diagnostics;
  const panelDiagnostics = diagnostics?.engineering;
  const checks = Object.freeze({
    complete: value?.schema === GLASS_SHIPYARD_SETTLEMENT_SCHEMA
      && typeof expectedCardOpen === 'boolean'
      && Number.isSafeInteger(value?.previewCount) && value.previewCount >= 0,
    panelOpen: value?.panelOpen === 'shipyard',
    previewReady: value?.previewCount === 1,
    surveyComposition: value?.cardOpen === expectedCardOpen,
    engineeringAuthority: engineering?.schema === 'cf-v2-arc3-app-state/v1'
      && engineering?.stateKind === 'loaded' && engineering?.protection === null
      && engineering?.bootstrapPending === false
      && engineering?.bootstrapCandidateReady === false,
    persistenceAuthority: persistence?.schema === 'cf-v2-app-persistence/v1'
      && persistence?.hold === null && persistence?.mutationBlocked === false
      && persistence?.seedBootstrapPending === false
      && persistence?.bootRouteRepairPending === false
      && persistence?.productBootstrapPending === false
      && persistence?.engineeringBootstrapPending === false
      && runtime?.leaseOwned === true && runtime?.staleBlocked === false,
    persistenceQuiescent: resources?.schema === 'cf-v2-scene-resources/v2'
      && resources?.pendingPersistenceWrites === 0,
    previewIdentity: typeof value?.appStateKey === 'string' && value.appStateKey.length > 0
      && JSON.stringify(value?.previewStateKeys) === JSON.stringify([value.appStateKey])
      && diagnostics?.stateKey === value.appStateKey
      && panelDiagnostics?.previewStateKey === value.appStateKey,
    panelDiagnostics: diagnostics?.schema === 'cf-v2-shipyard-diagnostics/v1'
      && diagnostics?.status === 'open' && diagnostics?.activePreviewCount === 1
      && diagnostics?.retainedPreviewCount === 0 && diagnostics?.pendingPreviewWork === 0
      && panelDiagnostics?.schema === 'cf-v2-engineering-panel-diagnostics/v1'
      && panelDiagnostics?.activeCount === 1 && panelDiagnostics?.pendingWork === 0
      && panelDiagnostics?.activePreviewCount === 1,
  });
  const reasons = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  return Object.freeze({ ok: reasons.length === 0, checks, reasons: Object.freeze(reasons) });
}

function glassShipyardSettlementSelftest() {
  const fixture = JSON.parse(VETERAN_PREF_RAW);
  const fixtureBaseline = glassEngineeringFixtureOutcome(fixture);
  const originalOrphan = JSON.parse(glassVeteranPreferenceRaw('original-orphan'));
  const orphanMine = JSON.parse(glassVeteranPreferenceRaw('mx-only'));
  const orphanMined = JSON.parse(glassVeteranPreferenceRaw('minedw-only'));
  const wrongSkim = structuredClone(fixture);
  wrongSkim.skx = [[424243, 2]];
  const missingEarth = structuredClone(fixture);
  missingEarth.log = missingEarth.log.filter((entry) => entry?.id !== 'p133');
  const fixtureControls = Object.freeze({
    originalOrphan: glassEngineeringFixtureOutcome(originalOrphan),
    orphanMine: glassEngineeringFixtureOutcome(orphanMine),
    orphanMined: glassEngineeringFixtureOutcome(orphanMined),
    wrongSkim: glassEngineeringFixtureOutcome(wrongSkim),
    missingEarth: glassEngineeringFixtureOutcome(missingEarth),
  });
  const baseline = {
    schema: GLASS_SHIPYARD_SETTLEMENT_SCHEMA,
    panelOpen: 'shipyard', cardOpen: true, previewCount: 1,
    appStateKey: 'ship:v1:glass-settlement',
    previewStateKeys: ['ship:v1:glass-settlement'],
    engineering: {
      schema: 'cf-v2-arc3-app-state/v1', stateKind: 'loaded', protection: null,
      bootstrapPending: false, bootstrapCandidateReady: false,
    },
    persistence: {
      schema: 'cf-v2-app-persistence/v1', hold: null, mutationBlocked: false,
      seedBootstrapPending: false, bootRouteRepairPending: false,
      productBootstrapPending: false, engineeringBootstrapPending: false,
      runtime: { leaseOwned: true, staleBlocked: false },
    },
    sceneResources: { schema: 'cf-v2-scene-resources/v2', pendingPersistenceWrites: 0 },
    diagnostics: {
      schema: 'cf-v2-shipyard-diagnostics/v1', status: 'open', activePreviewCount: 1,
      stateKey: 'ship:v1:glass-settlement', retainedPreviewCount: 0, pendingPreviewWork: 0,
      engineering: {
        schema: 'cf-v2-engineering-panel-diagnostics/v1', activeCount: 1,
        pendingWork: 0, activePreviewCount: 1, previewStateKey: 'ship:v1:glass-settlement',
      },
    },
  };
  const settlementBaseline = shipyardPanelSettlementOutcome(baseline, true);
  const protectedUnavailable = structuredClone(baseline);
  protectedUnavailable.previewCount = 0;
  protectedUnavailable.engineering.stateKind = 'unavailable';
  protectedUnavailable.engineering.protection = 'legacy-refused:legacy-seed-missing';
  protectedUnavailable.diagnostics.activePreviewCount = 0;
  protectedUnavailable.diagnostics.engineering.activePreviewCount = 0;
  const controls = Object.freeze({
    protectedUnavailable: shipyardPanelSettlementOutcome(protectedUnavailable, true),
    missingPreview: shipyardPanelSettlementOutcome({ ...baseline, previewCount: 0 }, true),
    protectedEngineering: shipyardPanelSettlementOutcome({
      ...baseline,
      engineering: { ...baseline.engineering, stateKind: 'unavailable', protection: 'legacy-refused:legacy-seed-missing' },
    }, true),
    previewAppIdentityMismatch: shipyardPanelSettlementOutcome({
      ...baseline, appStateKey: 'ship:v1:app-substitute',
    }, true),
    previewDomIdentityMismatch: shipyardPanelSettlementOutcome({
      ...baseline, previewStateKeys: ['ship:v1:dom-substitute'],
    }, true),
    previewOuterIdentityMismatch: shipyardPanelSettlementOutcome({
      ...baseline,
      diagnostics: { ...baseline.diagnostics, stateKey: 'ship:v1:outer-substitute' },
    }, true),
    previewInnerIdentityMismatch: shipyardPanelSettlementOutcome({
      ...baseline,
      diagnostics: {
        ...baseline.diagnostics,
        engineering: { ...baseline.diagnostics.engineering, previewStateKey: 'ship:v1:inner-substitute' },
      },
    }, true),
    panelClosed: shipyardPanelSettlementOutcome({ ...baseline, panelOpen: null }, true),
    surveyMismatch: shipyardPanelSettlementOutcome({ ...baseline, cardOpen: false }, true),
    pendingPersistence: shipyardPanelSettlementOutcome({
      ...baseline,
      sceneResources: { ...baseline.sceneResources, pendingPersistenceWrites: 1 },
    }, true),
  });
  const isolated = (outcome, reason) => outcome.ok === false
    && JSON.stringify(outcome.reasons) === JSON.stringify([reason]);
  return Object.freeze({
    ok: fixtureBaseline.ok
      && fixtureControls.originalOrphan.ok === false
      && JSON.stringify(fixtureControls.originalOrphan.reasons)
        === JSON.stringify(['miningCursorCleared', 'miningClockCleared'])
      && isolated(fixtureControls.orphanMine, 'miningCursorCleared')
      && isolated(fixtureControls.orphanMined, 'miningClockCleared')
      && isolated(fixtureControls.wrongSkim, 'solSkimRetained')
      && isolated(fixtureControls.missingEarth, 'earthSourceRetained')
      && settlementBaseline.ok
      && controls.protectedUnavailable.ok === false
      && JSON.stringify(controls.protectedUnavailable.reasons)
        === JSON.stringify(['previewReady', 'engineeringAuthority', 'panelDiagnostics'])
      && isolated(controls.missingPreview, 'previewReady')
      && isolated(controls.protectedEngineering, 'engineeringAuthority')
      && isolated(controls.previewAppIdentityMismatch, 'previewIdentity')
      && isolated(controls.previewDomIdentityMismatch, 'previewIdentity')
      && isolated(controls.previewOuterIdentityMismatch, 'previewIdentity')
      && isolated(controls.previewInnerIdentityMismatch, 'previewIdentity')
      && isolated(controls.panelClosed, 'panelOpen')
      && isolated(controls.surveyMismatch, 'surveyComposition')
      && isolated(controls.pendingPersistence, 'persistenceQuiescent'),
    fixtureBaseline, fixtureControls, settlementBaseline, controls,
  });
}

/* A rendered Guide negative control may remove a short needle from a longer
   required sentence. The checker reports that enclosing sentence as missing,
   not the needle. Accept the control only when the mutation is real, exactly
   one required carrier owns the needle, and that exact carrier is the sole
   missing requirement after the rendered copy no longer contains the needle. */
function guideRequiredControlRejected({ before, after, needle, required, result }) {
  if (typeof before !== 'string' || typeof after !== 'string'
    || typeof needle !== 'string' || needle.length === 0
    || !Array.isArray(required) || !result || result.ok !== false
    || typeof result.text !== 'string' || !Array.isArray(result.missing)) return false;
  const carriers = required.filter((carrier) => typeof carrier === 'string' && carrier.includes(needle));
  return carriers.length === 1
    && before.includes(needle)
    && before !== after
    && !after.includes(needle)
    && !result.text.includes(needle)
    && result.missing.length === 1
    && result.missing[0] === carriers[0];
}

/* Rendered Guide requirements may span inline markup (`<b>Meals by 1</b>,
   capped at 200`). Mutate the paragraph's rendered text, not its HTML bytes,
   and only when one exact target exists. The caller restores the original
   innerHTML after the control so authored emphasis remains byte-exact. */
function exactGuideRenderedTextMutation(before, needle, replacement) {
  if (typeof before !== 'string' || typeof needle !== 'string' || needle.length === 0
    || typeof replacement !== 'string') {
    return { before, after: before, targetCount: 0, changeCount: 0 };
  }
  const targetCount = before.split(needle).length - 1;
  const after = targetCount === 1 ? before.replace(needle, replacement) : before;
  return {
    before,
    after,
    targetCount,
    changeCount: after === before ? 0 : 1,
  };
}

function guideRenderedControlHtmlRestored(beforeHtml, afterHtml) {
  return typeof beforeHtml === 'string' && typeof afterHtml === 'string'
    && afterHtml === beforeHtml;
}

function exactGuideRenderedRequiredControlRejected({
  mutation, observedAfter, needle, required, result,
  restoredHtml, restoredText, restoredPredicate,
}) {
  const actualChangeCount = typeof observedAfter === 'string'
    && observedAfter !== mutation?.before ? 1 : 0;
  return mutation?.targetCount === 1 && mutation.changeCount === 1
    && observedAfter === mutation.after && actualChangeCount === 1
    && Array.isArray(result?.stale) && result.stale.length === 0
    && restoredHtml === true && restoredText === true && restoredPredicate === true
    && guideRequiredControlRejected({
      before: mutation.before, after: observedAfter, needle, required, result,
    });
}

function classifyRenderedGuideIngress({
  baselineComplete, baselineRows, expectedCount,
  predicateControls, controlRows, error,
}) {
  const product = baselineComplete === true ? {
    ok: Array.isArray(baselineRows)
      && baselineRows.length === expectedCount
      && baselineRows.every((row) => row?.current?.ok === true),
    expectedCount,
    rows: Array.isArray(baselineRows) ? baselineRows : [],
  } : null;
  const instrument = product?.ok === true ? {
    ok: error === null
      && predicateControls && Object.values(predicateControls).every((value) => value === true)
      && Array.isArray(controlRows) && controlRows.length === expectedCount
      && controlRows.every((row) => row?.controlRejected === true
        && row?.requiredControlsRejected === true
        && row?.contradictionRejected === true
        && row?.restored === true),
    predicateControls,
    rows: Array.isArray(controlRows) ? controlRows : [],
  } : null;
  return { ok: product?.ok === true && instrument?.ok === true, product, instrument, error };
}

/* Reconstruct the exact generated Shipyard predicate from this source for a
   browser-free missing-owner control. A selector added to that predicate
   cannot silently reintroduce `null.querySelectorAll(...)`: selftest executes
   the same expression with no #shipyardpanel and requires structured red. */
function missingShipyardPanelExpressionOutcome() {
  try {
    const source = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
    const startMarker = 'const shipyardOpenCheck' + ' = item.shipyard ? `';
    const endMarker = '` : null;';
    const start = source.indexOf(startMarker);
    const duplicate = source.indexOf(startMarker, start + startMarker.length);
    const end = source.indexOf(endMarker, start + startMarker.length);
    if (start < 0 || duplicate >= 0 || end < 0) {
      return { ok: null, threw: true, error: 'exact Shipyard expression source markers were not unique' };
    }
    let expression = source.slice(start + startMarker.length, end);
    const substitutions = [
      ['${JSON.stringify(opener)}', JSON.stringify('#missing-shipyard-opener')],
      ['${JSON.stringify(ENGINEERING_RESEARCH_IDS)}', JSON.stringify(ENGINEERING_RESEARCH_IDS)],
      ['${JSON.stringify(ENGINEERING_GLASS_RESEARCH_ORACLE)}', JSON.stringify(ENGINEERING_GLASS_RESEARCH_ORACLE)],
      ['${JSON.stringify(ENGINEERING_RECIPE_GROUPS)}', JSON.stringify(ENGINEERING_RECIPE_GROUPS)],
      ['${JSON.stringify(ENGINEERING_RECIPE_IDS)}', JSON.stringify(ENGINEERING_RECIPE_IDS)],
      ['${JSON.stringify(ENGINEERING_GLASS_RECIPE_ORACLE)}', JSON.stringify(ENGINEERING_GLASS_RECIPE_ORACLE)],
      ['${ENGINEERING_ACTION_CONTROL_COUNT}', String(ENGINEERING_ACTION_CONTROL_COUNT)],
    ];
    for (const [needle, replacement] of substitutions) expression = expression.replaceAll(needle, replacement);
    if (expression.includes('${')) {
      return { ok: null, threw: true, error: 'unresolved Shipyard expression interpolation' };
    }
    const document = Object.freeze({
      getElementById: () => null,
      querySelector: () => null,
      elementFromPoint: () => null,
      activeElement: null,
    });
    const window = Object.freeze({
      __CF_SLICE__: Object.freeze({
        api: Object.freeze({ state: () => Object.freeze({ shipVisual: null }), shipyardDiagnostics: () => null }),
      }),
    });
    const outcome = Function(
      'window', 'document', 'getComputedStyle', 'innerWidth',
      `'use strict';return (${expression});`,
    )(window, document, () => null, 320);
    return { ...outcome, threw: false };
  } catch (error) {
    return { ok: null, threw: true, error: String(error?.message || error) };
  }
}

function glassRunEvidenceErrors(report, {
  runId, expectedSource = null, expectedSlice = null, requirePass = true,
} = {}) {
  const artifacts = glassArtifactPaths(runId);
  return glassTerminalEvidenceErrors(report, {
    runId,
    reportPath: artifacts.reportRelative,
    expectedSource,
    expectedSlice,
    requirePass,
  });
}

function verifyGlassRunEvidence(runId, {
  expectedSource = null, expectedSlice = null, requirePass = true,
} = {}) {
  let artifacts;
  try { artifacts = glassArtifactPaths(runId); }
  catch (error) { return { ok: false, errors: [error.message], report: null, reportSha256: null, artifacts: null }; }
  if (!fs.existsSync(artifacts.report)) {
    return { ok: false, errors: [`immutable Glass report is missing: ${artifacts.reportRelative}`], report: null, reportSha256: null, artifacts };
  }
  const bytes = fs.readFileSync(artifacts.report);
  let report;
  try { report = JSON.parse(bytes.toString('utf8')); }
  catch (error) {
    return { ok: false, errors: [`immutable Glass report is invalid JSON: ${error.message}`], report: null, reportSha256: sha256(bytes), artifacts };
  }
  const errors = glassRunEvidenceErrors(report, { runId, expectedSource, expectedSlice, requirePass });
  return { ok: errors.length === 0, errors, report, reportSha256: sha256(bytes), artifacts };
}

function runningGlassReport({ runId, source, predecessor = null }) {
  const artifacts = glassArtifactPaths(runId);
  return {
    schema: 'cf-v2-glassmatrix/v1', status: 'running', terminal: false, certifying: false,
    scope: viewportLabel ? 'targeted-diagnostic' : 'full-certifying',
    exit: null,
    startedAt: new Date(startedAt).toISOString(), endedAt: null, durationMs: null,
    run: { id: runId, artifactPath: artifacts.reportRelative,
      provenance: 'The unique run artifact is reserved before build/browser work; the current report is only a mutable pointer.' },
    source, sourceEnd: null, sourceChange: { detected: null, ending: null },
    predecessors: predecessor ? { slice: predecessor } : null,
    controlSummary: { automaticRetries: 0 },
    findings: [], instrumentFailures: [],
  };
}

function writeReport({ status, exitCode, browser, findings, instrumentFailures, controlsRun,
  executedControls = [], blockedControls = [], source = runSource || sourceIdentity() }) {
  const counts = new Map();
  for (const { row } of findings) counts.set(row.code, (counts.get(row.code) || 0) + 1);
  const endedAt = Date.now();
  const reportEndSource = runEndingSource || sourceIdentity();
  const coverage = controlCoverageOutcome(executedControls, blockedControls);
  if (!coverage.ok) throw new Error(`invalid negative-control coverage: ${coverage.why}`);
  const timingOutcome = viewportTimingsOutcome(runViewportTimings, {
    certifying: !viewportLabel, status,
  });
  if (!timingOutcome.ok) throw new Error(`invalid viewport timing evidence: ${timingOutcome.why}`);
  const arc4OutcomeInventory = arc4CaptureOutcomeInventoryOutcome(runArc4CaptureOutcomes);
  if (!arc4OutcomeInventory.ok || (status === 'pass' && !arc4OutcomeInventory.complete)) {
    throw new Error(`invalid Arc 4 capture outcome inventory: ${JSON.stringify(arc4OutcomeInventory)}`);
  }
  const report = {
    schema: 'cf-v2-glassmatrix/v1',
    status,
    terminal: true,
    scope: viewportLabel ? 'targeted-diagnostic' : 'full-certifying',
    certifying: status === 'pass' && !viewportLabel && source.state === 'committed'
      && !!runPredecessors?.slice,
    exit: { code: exitCode },
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    run: {
      id: activeGlassRunId,
      artifactPath: glassArtifactPaths(activeGlassRunId).reportRelative,
      provenance: 'The unique run artifact is authority; the fixed-name report is a mutable current pointer only.',
    },
    source,
    sourceEnd: reportEndSource,
    sourceChange: {
      detected: !sameEvidenceSource(source, reportEndSource),
      ending: sameEvidenceSource(source, reportEndSource) ? null : reportEndSource,
    },
    predecessors: runPredecessors ? { slice: { ...runPredecessors.slice, source: { ...runPredecessors.slice.source } } } : null,
    browser: browser || null,
    viewportInventory: viewportInventory(),
    viewportTimings: [...runViewportTimings],
    arc4CaptureOutcomeInventory: {
      plannedOutcomeCodes: [...ARC4_CAPTURE_OUTCOME_CODES],
      complete: arc4OutcomeInventory.complete,
      expectedCount: arc4OutcomeInventory.expectedCount,
      observedCount: arc4OutcomeInventory.observedCount,
      omitted: arc4OutcomeInventory.omitted,
      outcomes: runArc4CaptureOutcomes.map((row) => ({ ...row, checks: { ...row.checks } })),
    },
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
      counts: Object.fromEntries([...counts]
        .sort(([a], [b]) => codeUnitCompare(a, b))),
    },
    findings: findings.map(({ context, row }) => ({
      viewport: context.viewport, surface: context.surface, code: row.code,
      element: row.element, actual: row.actual, expected: row.expected,
    })),
    reloadEvidence: [...runReloadEvidence],
    instrumentFailures: [...instrumentFailures],
    durationMs: endedAt - startedAt,
  };
  const prepublicationErrors = glassRunEvidenceErrors(report, {
    runId: activeGlassRunId, expectedSource: reportEndSource,
    expectedSlice: runPredecessors?.slice || null,
    requirePass: status === 'pass' && !viewportLabel,
  });
  if (prepublicationErrors.length) {
    throw new Error(`terminal Glass evidence failed before publication: ${prepublicationErrors.join('; ')}`);
  }
  fs.mkdirSync(evidenceDir, { recursive: true });
  atomicWriteJson(glassArtifactPaths(activeGlassRunId).report, report);
  atomicWriteJson(currentReportPath, report);
  return report;
}

function arc4GlassSelftest() {
  const oracle = ARC4_EARTH_GLASS_ORACLE;
  const worldKey = oracle.worldKey;
  const fingerprint = oracle.fullRosterFingerprint;
  const contextKey = oracle.contextKey;
  const fixturePreflight = arc4VeteranCaptureFixturePreflight();
  const fixtureSource = JSON.parse(VETERAN_PREF_RAW);
  const wrongFixtureEpoch = structuredClone(fixtureSource);
  wrongFixtureEpoch.epoch += 1;
  const wrongFixtureEpochAssessment = assessArc4VeteranCaptureFixtureSource(
    wrongFixtureEpoch, oracle,
  );
  const wrongFixtureContact = structuredClone(fixtureSource);
  wrongFixtureContact.cont.push(133);
  const wrongFixtureContactAssessment = assessArc4VeteranCaptureFixtureSource(
    wrongFixtureContact, oracle,
  );
  const wrongFixtureLoadout = structuredClone(fixtureSource);
  wrongFixtureLoadout.eq.suit = 'thermal';
  const wrongFixtureLoadoutAssessment = assessArc4VeteranCaptureFixtureSource(
    wrongFixtureLoadout, oracle,
  );
  const wrongFixtureRawAssessment = arc4VeteranCaptureFixturePreflight(
    `${VETERAN_PREF_RAW} `, oracle,
  );
  const durableBefore = arc4DurableProjectionSelftestFixture();
  const selftestOwnershipV2 = arc5OwnershipV2SelftestState(durableBefore);
  const row = (verb, index) => {
    const copy = ARC4_CAPTURE_LABELS[verb];
    const odds = {
      text: '', ...ARC4_EARTH_GLASS_ORACLE.odds[verb],
    };
    const value = {
      verb, status: 'ready', semanticKey: `capture:${verb}`,
      title: `${copy.label} · ${copy.pool}`, detail: '', odds,
      button: {
        exists: true, connected: true, tag: 'BUTTON', label: copy.label,
        verb, focusKey: `capture:${verb}`, modelEnabled: 'true', disabled: false,
        ariaDisabled: 'false',
        rect: { left: 40, top: 170 + index * 80, right: 140, bottom: 214 + index * 80, width: 100, height: 44 },
        point: { x: 90, y: 192 + index * 80, tag: 'BUTTON', verb, close: false },
      },
    };
    odds.text = arc4ExpectedOdds(value);
    value.detail = arc4ExpectedDetail(value);
    return value;
  };
  const rows = ARC4_CAPTURE_VERBS.map(row);
  const ui = {
    schema: ARC4_CAPTURE_UI_EVIDENCE_SCHEMA,
    cardOpen: true, cardTitle: oracle.title, planetsideHeading: 'PLANETSIDE — Biosphere',
    cardRect: { left: 10, top: 10, right: 410, bottom: 510, width: 400, height: 500 },
    mountCount: 1, directCloseCount: 1,
    close: {
      exists: true, tag: 'BUTTON', label: 'Close Survey card',
      rect: { left: 350, top: 20, right: 394, bottom: 64, width: 44, height: 44 },
      point: { x: 372, y: 42, tag: 'BUTTON', verb: null, close: true },
    },
    controller: 'v1', contextKey, ariaBusy: 'false',
    summary: `Showing ${oracle.previewCount} of ${oracle.fullRosterCount} life forms. Capture draws from all ${oracle.fullRosterCount}, not only this preview. Each action chooses uniformly from every eligible species for that action in the full biosphere.`,
    budget: {
      text: `${oracle.biosphereYield.remaining} of ${oracle.biosphereYield.yield} capture attempts remain; ${oracle.biosphereYield.used} spent this active-play cycle. Tame, Scavenge, and Sample share Biosphere Yield. Every attempt spends 1, hit or miss. Full recovery at the next 20-minute active-play cycle — 20:00 of active play remaining. Closing the game does not advance recovery.`,
      ...oracle.biosphereYield, recoveryRemainingActivePlayMs: 1_200_000,
    },
    rows,
    status: { hidden: true, kind: null, convergence: null, text: '' },
    diagnostics: {
      schema: 'cf-v2-capture-card-diagnostics/v1', attachedMountCount: 1,
      retainedDomCount: 30, pendingWork: 0, convergenceLatched: false,
      actionControlCount: 3, delegatedListenerCount: 1, contextKey,
      lastRequest: null, lastOutcome: null,
    },
    captureState: {
      schema: 'cf-v2-arc4-app-state/v1', revision: durableBefore.captureRevision,
    },
    ownershipV2: selftestOwnershipV2,
    persistence: null,
    activeElement: {
      verb: null, semanticKey: null, status: false, close: false, focusVisible: false,
    },
  };
  const planetside = {
    mode: 'surface', galaxySeed: 999, starSeed: 424242, planetSeed: 133, planetOrdinal: 2,
    rosterState: 'ready', previewCount: oracle.previewCount,
    fullRosterCount: oracle.fullRosterCount,
    fullRosterFingerprint: fingerprint, ecologyEpoch: oracle.ecologyEpoch,
    previewRowCount: oracle.previewCount, worldKey,
  };
  const presentation = assessArc4GlassPresentation({ ui, planetside });
  const wrongArc5Diagnostics = structuredClone(ui);
  wrongArc5Diagnostics.ownershipV2.breed.controller.delegatedListenerCount = 1;
  const wrongArc5DiagnosticsAssessment = assessArc4GlassPresentation({
    ui: wrongArc5Diagnostics, planetside,
  });
  const missingArc5Diagnostics = structuredClone(ui);
  delete missingArc5Diagnostics.ownershipV2.rename.controller.currentPage;
  const missingArc5DiagnosticsAssessment = assessArc4GlassPresentation({
    ui: missingArc5Diagnostics, planetside,
  });
  const extraArc5Diagnostics = structuredClone(ui);
  extraArc5Diagnostics.ownershipV2.scout.controller.selftestExtra = true;
  const extraArc5DiagnosticsAssessment = assessArc4GlassPresentation({
    ui: extraArc5Diagnostics, planetside,
  });
  const wrongTitle = structuredClone(ui);
  wrongTitle.cardTitle = 'Not Homeworld';
  const wrongTitleAssessment = assessArc4GlassPresentation({ ui: wrongTitle, planetside });
  const wrongCounts = structuredClone(planetside);
  wrongCounts.fullRosterCount = oracle.fullRosterCount - 1;
  const wrongCountsAssessment = assessArc4GlassPresentation({ ui, planetside: wrongCounts });
  const wrongFingerprint = structuredClone(planetside);
  wrongFingerprint.fullRosterFingerprint = `${fingerprint}-mutated`;
  const wrongFingerprintAssessment = assessArc4GlassPresentation({ ui, planetside: wrongFingerprint });
  const wrongYield = structuredClone(ui);
  wrongYield.budget.yield = 15;
  wrongYield.budget.remaining = 15;
  wrongYield.budget.text = wrongYield.budget.text.replace('16 of 16', '15 of 15');
  const wrongYieldAssessment = assessArc4GlassPresentation({ ui: wrongYield, planetside });
  const wrongOddsAssessments = Object.fromEntries(ARC4_CAPTURE_VERBS.map((verb) => {
    const mutated = structuredClone(ui);
    const mutatedRow = mutated.rows.find((candidate) => candidate.verb === verb);
    const odds = mutatedRow.odds;
    odds.overallChance -= 0.001;
    odds.text = arc4ExpectedOdds(mutatedRow);
    return [verb, assessArc4GlassPresentation({ ui: mutated, planetside })];
  }));
  const wrongCopy = structuredClone(ui);
  wrongCopy.summary = 'Showing only the preview.';
  const wrongCopyAssessment = assessArc4GlassPresentation({ ui: wrongCopy, planetside });
  const wrongDisabled = structuredClone(ui);
  wrongDisabled.rows[0].button.disabled = true;
  wrongDisabled.rows[0].button.ariaDisabled = 'true';
  const wrongDisabledAssessment = assessArc4GlassPresentation({ ui: wrongDisabled, planetside });
  const controls = rows.map((item, index) => {
    const buttonRect = { left: 40, top: 170, right: 140, bottom: 214, width: 100, height: 44 };
    const scrollOffset = { left: 0, top: index * 80 };
    return {
      captureSchema: ARC4_CONTROL_GEOMETRY_EVIDENCE_SCHEMA,
      verb: item.verb, scrollSettled: true, buttonRect,
      cardRect: { left: 10, top: 10, right: 410, bottom: 510, width: 400, height: 500 },
      scrollOffset,
      layoutRect: {
        left: buttonRect.left + scrollOffset.left, top: buttonRect.top + scrollOffset.top,
        right: buttonRect.right + scrollOffset.left, bottom: buttonRect.bottom + scrollOffset.top,
        width: buttonRect.width, height: buttonRect.height,
      },
      beforePoint: { x: 90, y: 192, tag: 'BUTTON', verb: item.verb, close: false },
      afterRenderPoint: { x: 90, y: 192, tag: 'BUTTON', verb: item.verb, close: false },
      accessibleName: item.button.label,
      focus: {
        modality: 'keyboard', focused: true, verb: item.verb,
        semanticKey: `capture:${item.verb}`, focusVisible: true,
        decorationPainted: true, styleChanged: true,
      },
    };
  });
  const geometryBundle = {
    schema: ARC4_CAPTURE_GEOMETRY_EVIDENCE_SCHEMA,
    layoutCoordinateSpace: ARC4_CAPTURE_LAYOUT_COORDINATE_SPACE,
    viewport: { name: 'selftest', width: 420, height: 800 }, ui,
    planetsideRect: { left: 10, top: 530, right: 410, bottom: 700, width: 400, height: 170 },
    controls,
    close: {
      captureSchema: ARC4_CONTROL_GEOMETRY_EVIDENCE_SCHEMA,
      scrollSettled: true,
      rect: { ...ui.close.rect }, beforePoint: { ...ui.close.point },
      afterRenderPoint: { ...ui.close.point }, accessibleName: ui.close.label,
      focus: {
        modality: 'keyboard', focused: true, close: true, focusVisible: true,
        decorationPainted: true, styleChanged: true,
      },
    },
    scrollWidth: 420, clientWidth: 420,
  };
  const geometryCoherence = assessArc4CaptureGeometryEvidenceCoherence(geometryBundle);
  const staleGeometryEpoch = structuredClone(geometryBundle);
  Object.assign(staleGeometryEpoch.controls[2].beforePoint,
    { y: 504.171875, tag: 'NAV', verb: null });
  Object.assign(staleGeometryEpoch.controls[2].afterRenderPoint,
    { y: 504.171875, tag: 'NAV', verb: null });
  const staleGeometryEpochCoherence =
    assessArc4CaptureGeometryEvidenceCoherence(staleGeometryEpoch);
  const geometry = assessArc4CaptureCardGeometryFocus(geometryBundle);
  const geometryClauses = arc4GeometryClauseProjection(geometryBundle);
  const wrongOverlap = structuredClone(geometryBundle);
  wrongOverlap.controls[1].scrollOffset = { ...wrongOverlap.controls[0].scrollOffset };
  wrongOverlap.controls[1].layoutRect = { ...wrongOverlap.controls[0].layoutRect };
  const wrongOverlapAssessment = assessArc4CaptureCardGeometryFocus(wrongOverlap);
  const stretchedButton = structuredClone(geometryBundle);
  Object.assign(stretchedButton.controls[2].buttonRect, { bottom: 570, height: 400 });
  Object.assign(stretchedButton.controls[2].layoutRect, { bottom: 730, height: 400 });
  Object.assign(stretchedButton.controls[2].beforePoint, { y: 370 });
  Object.assign(stretchedButton.controls[2].afterRenderPoint, { y: 370 });
  const stretchedButtonAssessment = assessArc4CaptureCardGeometryFocus(stretchedButton);
  const stretchedButtonClauses = arc4GeometryClauseProjection(stretchedButton);
  const heartbeatScrollRollback = structuredClone(geometryBundle);
  heartbeatScrollRollback.controls[2].rerender = {
    required: true,
    scrollPreserved: false,
    priorFocusRestored: true,
    productOk: false,
  };
  const heartbeatScrollRollbackAssessment =
    assessArc4CaptureCardGeometryFocus(heartbeatScrollRollback);
  const heartbeatScrollRollbackClauses =
    arc4GeometryClauseProjection(heartbeatScrollRollback);
  const unfocusedGeometryControl = structuredClone(geometryBundle);
  unfocusedGeometryControl.controls[0].focus.focused = false;
  const unfocusedGeometryControlAssessment =
    assessArc4CaptureCardGeometryFocus(unfocusedGeometryControl);
  const unfocusedGeometryControlClauses =
    arc4GeometryClauseProjection(unfocusedGeometryControl);
  const unfocusedGeometryClose = structuredClone(geometryBundle);
  unfocusedGeometryClose.close.focus.focused = false;
  const unfocusedGeometryCloseAssessment =
    assessArc4CaptureCardGeometryFocus(unfocusedGeometryClose);
  const unsettledGeometryClose = structuredClone(geometryBundle);
  unsettledGeometryClose.close.scrollSettled = false;
  const unsettledGeometryCloseAssessment =
    assessArc4CaptureCardGeometryFocus(unsettledGeometryClose);
  const durableCheckpoint = arc4DurableProjectionSelftestFixture({
    outerRevision: 10, activePlayMs: 5_000, checkpointAt: 2_000,
  });
  const durableOwnership = arc4DurableProjectionSelftestFixture({
    speciesAlias: 'Wayfinder II',
  });
  const durableRng = arc4DurableProjectionSelftestFixture({
    sessionOrdinal: 4, sessionDraws: { existing: 3, 'capture.candidate': 1 },
  });
  const durableReceipt = arc4DurableProjectionSelftestFixture({
    receipts: [
      { ordinal: 2, kind: 'capture-attempt', witness: 'prior' },
      { ordinal: 3, kind: 'capture-attempt', witness: 'unexpected' },
    ],
  });
  const durableEpoch = arc4DurableProjectionSelftestFixture({ ecologyEpoch: 1 });
  const durableCounter = arc4DurableProjectionSelftestFixture({
    ownedCounters: { hybrids: 3, best: 5, maxGen: 1, bestRank: 3 },
  });
  const durableCanonicalAuthority = arc4DurableProjectionSelftestFixture({
    canonicalAuthority: true,
  });
  const durableAssessments = Object.fromEntries(Object.entries({
    before: durableBefore, checkpoint: durableCheckpoint, ownership: durableOwnership,
    rng: durableRng, receipt: durableReceipt, epoch: durableEpoch, counter: durableCounter,
  }).map(([name, evidence]) => [name, assessArc4DurableEvidence(evidence)]));
  const durableProjection = arc4DurableNoMutationProjection(durableBefore);
  const durableCheckpointProjection = arc4DurableNoMutationProjection(durableCheckpoint);
  const durableOwnershipProjection = arc4DurableNoMutationProjection(durableOwnership);
  const durableCounterProjection = arc4DurableNoMutationProjection(durableCounter);
  const durableBeforeFingerprint = arc4DurableFingerprint(durableBefore);
  const durableCheckpointFingerprint = arc4DurableFingerprint(durableCheckpoint);
  const durableOwnershipFingerprint = arc4DurableFingerprint(durableOwnership);
  const durableRngFingerprint = arc4DurableFingerprint(durableRng);
  const durableReceiptFingerprint = arc4DurableFingerprint(durableReceipt);
  const durableEpochFingerprint = arc4DurableFingerprint(durableEpoch);
  const durableCounterFingerprint = arc4DurableFingerprint(durableCounter);
  const durableArc5Mutation = structuredClone(durableBefore);
  const mutatedArc5ManifestCarrier = durableArc5Mutation.playerRow.extensions[
    ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
  ];
  const mutatedArc5ShardTarget = ARC5_OWNERSHIP_EXTENSION_TARGETS[1];
  const mutatedArc5ShardCarrier = durableArc5Mutation.creaturesRow.extensions[
    mutatedArc5ShardTarget.namespace
  ];
  const mutatedArc5Manifest = JSON.parse(mutatedArc5ManifestCarrier.json);
  const mutatedArc5Shard = JSON.parse(mutatedArc5ShardCarrier.json);
  const mutatedShardDigest = (
    mutatedArc5Shard.digest[0] === '0' ? '1' : '0'
  ) + mutatedArc5Shard.digest.slice(1);
  mutatedArc5Manifest.shardDigests[0] = mutatedShardDigest;
  mutatedArc5Shard.digest = mutatedShardDigest;
  mutatedArc5ManifestCarrier.json = arc4CanonicalJson(mutatedArc5Manifest);
  mutatedArc5ShardCarrier.json = arc4CanonicalJson(mutatedArc5Shard);
  durableArc5Mutation.playerRaw = JSON.stringify(durableArc5Mutation.playerRow);
  durableArc5Mutation.creaturesRaw = JSON.stringify(durableArc5Mutation.creaturesRow);
  const durableArc5MutationAssessment = assessArc4DurableEvidence(durableArc5Mutation);
  const durableArc5MutationFingerprint = arc4DurableFingerprint(durableArc5Mutation);
  const canonicalAuthorityAssessment = assessArc4DurableEvidence(durableCanonicalAuthority);
  const capture = {
    schema: 'cf-v2-arc4-app-state/v1',
    revision: durableBefore.captureRevision,
    lastOutcome: null,
  };
  const surface = {
    mode: 'surface', galaxySeed: 999, starSeed: 424242, planetSeed: 133,
    planetOrdinal: 2, worldKey, cardOpen: true, expanded: 'true', cardTitle: oracle.title,
  };
  const nativeEvidence = {
    beforeSurface: surface, afterSurface: structuredClone(surface),
    beforePlanetside: planetside, afterPlanetside: structuredClone(planetside),
    beforeCapture: capture, afterCapture: structuredClone(capture),
    beforeDurableSettled: true, afterDurableSettled: true,
    beforeDurableFingerprint: durableBeforeFingerprint,
    afterDurableFingerprint: durableCheckpointFingerprint,
    setupClose: { ok: true }, setupClosed: { cardOpen: false },
    open: { ok: true }, opened: { cardOpen: true, expanded: 'true' },
    sampleScrollSettled: true,
    sampleFocus: {
      modality: 'keyboard', focused: true, focusVisible: true, styleChanged: true,
      decorationPainted: true, verb: 'sample', semanticKey: 'capture:sample', close: false,
      nativeTabTrusted: true,
    },
    close: {
      ok: true,
      target: { surveyClose: true, accessibleName: 'Close Survey card' },
      receipt: { trusted: true, key: 'Enter', code: 'Enter', surveyClose: true },
    },
    returned: { cardOpen: false, expanded: 'false', focusId: 'docksurvey' },
    reopen: { ok: true }, reopened: { cardOpen: true, expanded: 'true' },
    captureActivationTrace: [],
  };
  const nativeReturn = assessArc4NativeSurveyCloseReturn(nativeEvidence);
  const wrongReturn = structuredClone(nativeEvidence);
  wrongReturn.returned.focusId = 'canvas';
  const wrongReturnAssessment = assessArc4NativeSurveyCloseReturn(wrongReturn);
  const wrongClose = structuredClone(nativeEvidence);
  wrongClose.close.receipt.trusted = false;
  const wrongCloseAssessment = assessArc4NativeSurveyCloseReturn(wrongClose);
  const wrongSurface = structuredClone(nativeEvidence);
  wrongSurface.afterSurface.cardTitle = 'Earth';
  const wrongSurfaceAssessment = assessArc4NativeSurveyCloseReturn(wrongSurface);
  const wrongPlanetside = structuredClone(nativeEvidence);
  wrongPlanetside.afterPlanetside.previewCount = 7;
  const wrongPlanetsideAssessment = assessArc4NativeSurveyCloseReturn(wrongPlanetside);
  const wrongCapture = structuredClone(nativeEvidence);
  wrongCapture.afterCapture.revision = 1;
  const wrongCaptureAssessment = assessArc4NativeSurveyCloseReturn(wrongCapture);
  const wrongOwnership = structuredClone(nativeEvidence);
  wrongOwnership.afterDurableFingerprint = durableOwnershipFingerprint;
  const wrongOwnershipAssessment = assessArc4NativeSurveyCloseReturn(wrongOwnership);
  const wrongRng = structuredClone(nativeEvidence);
  wrongRng.afterDurableFingerprint = durableRngFingerprint;
  const wrongRngAssessment = assessArc4NativeSurveyCloseReturn(wrongRng);
  const wrongReceipt = structuredClone(nativeEvidence);
  wrongReceipt.afterDurableFingerprint = durableReceiptFingerprint;
  const wrongReceiptAssessment = assessArc4NativeSurveyCloseReturn(wrongReceipt);
  const wrongEpoch = structuredClone(nativeEvidence);
  wrongEpoch.afterDurableFingerprint = durableEpochFingerprint;
  const wrongEpochAssessment = assessArc4NativeSurveyCloseReturn(wrongEpoch);
  const wrongCounter = structuredClone(nativeEvidence);
  wrongCounter.afterDurableFingerprint = durableCounterFingerprint;
  const wrongCounterAssessment = assessArc4NativeSurveyCloseReturn(wrongCounter);
  const wrongActivation = structuredClone(nativeEvidence);
  wrongActivation.captureActivationTrace.push({
    type: 'keydown', key: 'Enter', code: 'Enter', trusted: true, verb: 'sample',
  });
  const wrongActivationAssessment = assessArc4NativeSurveyCloseReturn(wrongActivation);
  const planetsideOwnership = { ok: true };
  const dependentBaseline = assessArc4DependentBaseline({
    planetsideOwnership, nativeReturn, presentation, geometry,
  });
  const wrongDependentBaseline = assessArc4DependentBaseline({
    planetsideOwnership, nativeReturn: wrongSurfaceAssessment, presentation, geometry,
  });
  const wrongPlanetsideOwnershipBaseline = assessArc4DependentBaseline({
    planetsideOwnership: { ok: false }, nativeReturn, presentation, geometry,
  });
  const wrongPresentationBaseline = assessArc4DependentBaseline({
    planetsideOwnership, nativeReturn, presentation: wrongTitleAssessment, geometry,
  });
  const wrongGeometryBaseline = assessArc4DependentBaseline({
    planetsideOwnership, nativeReturn, presentation, geometry: wrongOverlapAssessment,
  });
  const fixtureViewports = [{ label: 'one' }, { label: 'two' }];
  const outcomeRows = fixtureViewports.flatMap((viewport) => ARC4_CAPTURE_OUTCOME_CODES.map((code) => ({
    viewport: viewport.label, surface: 'survey-capture', code, ok: true,
    checks: arc4SelftestChecks(code),
  })));
  const inventory = arc4CaptureOutcomeInventoryOutcome(outcomeRows, fixtureViewports);
  const inventoryMissing = arc4CaptureOutcomeInventoryOutcome(outcomeRows.slice(0, -1), fixtureViewports);
  const inventoryDuplicate = arc4CaptureOutcomeInventoryOutcome([...outcomeRows, outcomeRows[0]], fixtureViewports);
  const inventoryUnknown = arc4CaptureOutcomeInventoryOutcome([
    ...outcomeRows.slice(0, -1), { ...outcomeRows.at(-1), code: 'ARC4_UNKNOWN' },
  ], fixtureViewports);
  const diagnosticSource = {
    ui: { cardTitle: oracle.title },
    planetside: { ecologyEpoch: oracle.ecologyEpoch },
    geometry: { clauseProjection: geometryClauses },
  };
  const diagnosticReportRow = arc4CaptureOutcomeReportRow({
    viewport: 'one', surface: 'survey-capture', code: ARC4_CAPTURE_OUTCOME_CODES[2],
    outcome: { ...geometry, diagnostics: diagnosticSource },
  });
  diagnosticSource.ui.cardTitle = 'mutated after projection';
  const ok = fixturePreflight.ok
    && arc4IsolatedFailure(wrongFixtureRawAssessment, 'rawBound')
    && arc4IsolatedFailure(wrongFixtureEpochAssessment, 'epochSource')
    && arc4IsolatedFailure(wrongFixtureContactAssessment, 'contactSource')
    && arc4IsolatedFailure(wrongFixtureLoadoutAssessment, 'loadoutSource')
    && presentation.ok && geometry.ok && nativeReturn.ok
    && [durableBefore, durableCheckpoint, durableOwnership, durableRng, durableReceipt,
      durableEpoch, durableCounter]
      .every(arc4DurableEvidenceComplete)
    && durableProjection?.ownershipCarriers?.length === 18
    && durableProjection?.arc5Migration?.representationVersion === 2
    && exactJson(durableProjection?.arc5Migration?.targets,
      ARC5_OWNERSHIP_EXTENSION_TARGETS)
    && durableProjection?.arc5Migration?.carriers?.length === 5
    && durableProjection.arc5Migration.carriers.every((carrier, index) => (
      carrier.segment === ARC5_OWNERSHIP_EXTENSION_TARGETS[index].segment
      && carrier.namespace === ARC5_OWNERSHIP_EXTENSION_TARGETS[index].namespace
      && carrier.version === 2 && typeof carrier.json === 'string'
      && carrier.byteLength === Buffer.byteLength(carrier.json, 'utf8')
      && carrier.jsonSha256 === sha256(carrier.json)
    ))
    && durableProjection?.arc5Migration?.manifest?.version === 2
    && durableProjection?.arc5Migration?.delta?.rows?.length === 0
    && durableProjection?.arc5Migration?.targetMirror?.revision === 4
    && durableProjection?.arc5Migration?.shards?.length === 4
    && durableProjection.arc5Migration.shards.every((shard, index) => (
      shard.version === 2 && shard.index === index && shard.count === 4
      && shard.start === 0 && shard.end === 0 && shard.total === 0
      && Array.isArray(shard.rows) && shard.rows.length === 0
    ))
    && durableProjection?.arc5Migration?.deltaRowCount === 0
    && durableProjection?.arc5Migration?.shardCount === 4
    && durableProjection?.arc5Migration?.shardDigests?.length === 4
    && durableProjection.arc5Migration.sourceDigest
      === selftestOwnershipV2?.sourceDigest
    && durableProjection.arc5Migration.deltaDigest
      === selftestOwnershipV2?.deltaDigest
    && durableProjection.arc5Migration.targetDigest
      === selftestOwnershipV2?.targetDigest
    && exactJson(durableProjection.arc5Migration.shardDigests,
      selftestOwnershipV2?.deltaShardDigests)
    && exactJson(durableProjection?.v4Mirror?.legacy?.ownedAliases,
      [['cs111', 'Wayfinder']])
    && durableProjection?.v4Mirror?.legacy?.essence === 7
    && durableProjection?.v4Mirror?.legacy?.essenceEarned === 7
    && exactJson(durableProjection?.v4OwnedCounters, {
      legacy: { hybrids: 2, best: 5, maxGen: 1, bestRank: 3 },
      split: { hybrids: 2, best: 5, maxGen: 1, bestRank: 3 },
    })
    && durableBeforeFingerprint === durableCheckpointFingerprint
    && typeof durableBeforeFingerprint === 'string'
    && exactJson(durableCheckpointProjection, durableProjection)
    && exactJson(durableCheckpointProjection?.arc5Migration,
      durableProjection?.arc5Migration)
    && durableOwnershipFingerprint !== durableBeforeFingerprint
    && !exactJson(durableOwnershipProjection?.ownershipCarriers,
      durableProjection?.ownershipCarriers)
    && durableOwnershipProjection?.arc5Migration?.carriers?.[0]?.json
      !== durableProjection?.arc5Migration?.carriers?.[0]?.json
    && exactJson(durableOwnershipProjection?.arc5Migration?.carriers?.slice(1),
      durableProjection?.arc5Migration?.carriers?.slice(1))
    && durableOwnershipProjection?.arc5Migration?.sourceDigest
      !== durableProjection?.arc5Migration?.sourceDigest
    && durableOwnershipProjection?.arc5Migration?.deltaDigest
      === durableProjection?.arc5Migration?.deltaDigest
    && durableOwnershipProjection?.arc5Migration?.targetDigest
      !== durableProjection?.arc5Migration?.targetDigest
    && exactJson(durableOwnershipProjection?.arc5Migration?.delta,
      durableProjection?.arc5Migration?.delta)
    && exactJson(durableOwnershipProjection?.arc5Migration?.shards,
      durableProjection?.arc5Migration?.shards)
    && exactJson(durableOwnershipProjection?.arc5Migration?.shardDigests,
      durableProjection?.arc5Migration?.shardDigests)
    && durableRngFingerprint !== durableBeforeFingerprint
    && durableReceiptFingerprint !== durableBeforeFingerprint
    && durableEpochFingerprint !== durableBeforeFingerprint
    && durableCounterFingerprint !== durableBeforeFingerprint
    && exactJson(durableCounterProjection?.ownershipCarriers,
      durableProjection?.ownershipCarriers)
    && exactJson(durableCounterProjection?.arc5Migration,
      durableProjection?.arc5Migration)
    && exactJson(durableCounterProjection?.v4Mirror, durableProjection?.v4Mirror)
    && exactJson(durableCounterProjection?.sessionRng, durableProjection?.sessionRng)
    && exactJson(durableCounterProjection?.receipts, durableProjection?.receipts)
    && arc4DurableFingerprint({}) === null
    && durableArc5MutationFingerprint === null
    && exactJson(arc4FailedChecks(durableArc5MutationAssessment),
      ['arc5DeltaFixedPoint', 'arc5TargetFixedPoint'])
    && arc4IsolatedFailure(canonicalAuthorityAssessment, 'f4Authority')
    && wrongArc5Diagnostics.ownershipV2.breed.controller.delegatedListenerCount === 1
    && !Object.hasOwn(missingArc5Diagnostics.ownershipV2.rename.controller, 'currentPage')
    && extraArc5Diagnostics.ownershipV2.scout.controller.selftestExtra === true
    && arc4IsolatedFailure(wrongArc5DiagnosticsAssessment, 'uiComplete')
    && arc4IsolatedFailure(missingArc5DiagnosticsAssessment, 'uiComplete')
    && arc4IsolatedFailure(extraArc5DiagnosticsAssessment, 'uiComplete')
    && arc4IsolatedFailure(wrongTitleAssessment, 'homeworldTitle')
    && arc4IsolatedFailure(wrongCountsAssessment, 'rosterCounts')
    && arc4IsolatedFailure(wrongFingerprintAssessment, 'rosterFingerprint')
    && arc4IsolatedFailure(wrongYieldAssessment, 'yieldExact')
    && arc4IsolatedFailure(wrongOddsAssessments.tame, 'tameOdds')
    && arc4IsolatedFailure(wrongOddsAssessments.scavenge, 'scavengeOdds')
    && arc4IsolatedFailure(wrongOddsAssessments.sample, 'sampleOdds')
    && arc4IsolatedFailure(wrongCopyAssessment, 'fullPoolCopy')
    && arc4IsolatedFailure(wrongDisabledAssessment, 'modelDisabledParity')
    && geometryCoherence.ok
    && arc4IsolatedFailure(staleGeometryEpochCoherence, 'controlsAtomic')
    && arc4IsolatedFailure(wrongOverlapAssessment, 'noControlOverlap')
    && geometryClauses.length === 3 && geometryClauses.every((row) => row.ok)
    && exactJson(arc4FailedChecks(stretchedButtonAssessment), ['controlsExact', 'controlsGeometry'])
    && stretchedButtonClauses.length === 3
    && stretchedButtonClauses[2]?.ok === false
    && exactJson(Object.entries(stretchedButtonClauses[2]?.clauses || {})
      .filter(([, value]) => value !== true).map(([name]) => name), ['cardContained'])
    && stretchedButtonClauses.slice(0, 2).every((row) => row.ok)
    && exactJson(arc4FailedChecks(heartbeatScrollRollbackAssessment),
      ['controlsExact', 'controlsGeometry'])
    && heartbeatScrollRollbackClauses.length === 3
    && heartbeatScrollRollbackClauses[2]?.ok === false
    && exactJson(Object.entries(heartbeatScrollRollbackClauses[2]?.clauses || {})
      .filter(([, value]) => value !== true).map(([name]) => name), ['heartbeatRerender'])
    && heartbeatScrollRollbackClauses.slice(0, 2).every((row) => row.ok)
    && exactJson(arc4FailedChecks(unfocusedGeometryControlAssessment),
      ['controlsExact', 'controlsGeometry'])
    && unfocusedGeometryControlClauses[0]?.ok === false
    && exactJson(Object.entries(unfocusedGeometryControlClauses[0]?.clauses || {})
      .filter(([, value]) => value !== true).map(([name]) => name), ['focus'])
    && unfocusedGeometryControlClauses.slice(1).every((row) => row.ok)
    && arc4IsolatedFailure(unfocusedGeometryCloseAssessment, 'closeFocus')
    && arc4IsolatedFailure(unsettledGeometryCloseAssessment, 'closeGeometry')
    && arc4IsolatedFailure(wrongReturnAssessment, 'openerReturn')
    && arc4IsolatedFailure(wrongCloseAssessment, 'closeTrusted')
    && arc4IsolatedFailure(wrongSurfaceAssessment, 'surfaceUnchanged')
    && arc4IsolatedFailure(wrongPlanetsideAssessment, 'planetsideUnchanged')
    && arc4IsolatedFailure(wrongCaptureAssessment, 'captureUnchanged')
    && arc4IsolatedFailure(wrongOwnershipAssessment, 'persistenceUnchanged')
    && arc4IsolatedFailure(wrongRngAssessment, 'persistenceUnchanged')
    && arc4IsolatedFailure(wrongReceiptAssessment, 'persistenceUnchanged')
    && arc4IsolatedFailure(wrongEpochAssessment, 'persistenceUnchanged')
    && arc4IsolatedFailure(wrongCounterAssessment, 'persistenceUnchanged')
    && arc4IsolatedFailure(wrongActivationAssessment, 'noCaptureActivation')
    && dependentBaseline.ok
    && arc4IsolatedFailure(wrongDependentBaseline, 'nativeCloseReturn')
    && arc4IsolatedFailure(wrongPlanetsideOwnershipBaseline, 'planetsideOwnership')
    && arc4IsolatedFailure(wrongPresentationBaseline, 'planetsidePresentation')
    && arc4IsolatedFailure(wrongGeometryBaseline, 'captureGeometry')
    && assessArc4GlassPresentation().ok === false
    && assessArc4NativeSurveyCloseReturn().ok === false
    && assessArc4CaptureCardGeometryFocus().ok === false
    && inventory.ok && inventory.complete
    && inventoryMissing.ok && !inventoryMissing.complete
    && !inventoryDuplicate.ok && !inventoryUnknown.ok
    && diagnosticReportRow.ok === true
    && diagnosticReportRow.diagnostics?.ui?.cardTitle === oracle.title
    && diagnosticReportRow.diagnostics?.planetside?.ecologyEpoch === oracle.ecologyEpoch
    && diagnosticReportRow.diagnostics?.geometry?.clauseProjection?.every((row) => row.ok);
  return {
    ok, fixturePreflight, wrongFixtureRawAssessment, wrongFixtureEpochAssessment,
    wrongFixtureContactAssessment, wrongFixtureLoadoutAssessment,
    wrongArc5Diagnostics: wrongArc5DiagnosticsAssessment,
    missingArc5Diagnostics: missingArc5DiagnosticsAssessment,
    extraArc5Diagnostics: extraArc5DiagnosticsAssessment,
    presentation, wrongTitle: wrongTitleAssessment, wrongCounts: wrongCountsAssessment,
    wrongFingerprint: wrongFingerprintAssessment, wrongYield: wrongYieldAssessment,
    wrongOdds: wrongOddsAssessments,
    wrongCopy: wrongCopyAssessment, wrongDisabled: wrongDisabledAssessment,
    geometry, geometryCoherence, staleGeometryEpochCoherence,
    geometryClauses, wrongOverlap: wrongOverlapAssessment,
    stretchedButton: stretchedButtonAssessment, stretchedButtonClauses,
    heartbeatScrollRollback: heartbeatScrollRollbackAssessment,
    heartbeatScrollRollbackClauses,
    unfocusedGeometryControl: unfocusedGeometryControlAssessment,
    unfocusedGeometryControlClauses,
    unfocusedGeometryClose: unfocusedGeometryCloseAssessment,
    unsettledGeometryClose: unsettledGeometryCloseAssessment,
    nativeReturn, wrongReturn: wrongReturnAssessment,
    wrongClose: wrongCloseAssessment, wrongSurface: wrongSurfaceAssessment,
    wrongPlanetside: wrongPlanetsideAssessment, wrongCapture: wrongCaptureAssessment,
    dependentBaseline, wrongDependentBaseline, wrongPlanetsideOwnershipBaseline,
    wrongPresentationBaseline, wrongGeometryBaseline,
    durableProjection, durableCheckpointProjection, durableOwnershipProjection,
    durableBeforeFingerprint, durableCheckpointFingerprint,
    durableAssessments, durableArc5MutationAssessment,
    durableArc5MutationFingerprint, canonicalAuthorityAssessment,
    wrongOwnership: wrongOwnershipAssessment, wrongRng: wrongRngAssessment,
    wrongReceipt: wrongReceiptAssessment, wrongEpoch: wrongEpochAssessment,
    wrongCounter: wrongCounterAssessment,
    wrongActivation: wrongActivationAssessment,
    inventory, inventoryMissing, inventoryDuplicate, inventoryUnknown,
    diagnosticReportRow,
  };
}

async function reportSelftest() {
  const sourceCommit = 'a'.repeat(40);
  const fixtureGit = (args, { raw = false } = {}) => {
    const key = args.join(' ');
    const outputs = new Map([
      ['rev-parse --show-toplevel', repoRoot],
      ['status --porcelain=v1 -z --untracked-files=all', ''],
      ['diff --binary --no-ext-diff HEAD --', ''],
      ['ls-files --others --exclude-standard -z', ''],
      ['rev-parse HEAD', sourceCommit],
      ['rev-parse --abbrev-ref HEAD', 'openai/source-selftest'],
    ]);
    if (!outputs.has(key)) throw new Error(`unexpected source selftest git command: ${key}`);
    const value = outputs.get(key);
    return raw ? Buffer.from(value) : `${value}\n`;
  };
  const exactIdentity = sourceIdentity({
    gitCommand: fixtureGit, environment: { GITHUB_SHA: sourceCommit },
  });
  let wrongHostedShaRejected = false;
  try {
    sourceIdentity({ gitCommand: fixtureGit, environment: { GITHUB_SHA: 'f'.repeat(40) } });
  } catch (error) {
    wrongHostedShaRejected = String(error?.message || error).includes('GITHUB_SHA does not match git HEAD');
  }
  const invalidHostedShasRejected = ['', 'not-a-full-commit'].every((hostedSha) => {
    try {
      sourceIdentity({ gitCommand: fixtureGit, environment: { GITHUB_SHA: hostedSha } });
      return false;
    } catch (error) {
      return String(error?.message || error).includes('GITHUB_SHA does not match git HEAD');
    }
  });
  let requiredGitFailureRejected = false;
  try {
    sourceIdentity({
      gitCommand: (args, options) => {
        if (args[0] === 'status') throw new Error('injected required Git failure');
        return fixtureGit(args, options);
      },
      environment: { GITHUB_SHA: sourceCommit },
    });
  } catch (error) {
    requiredGitFailureRejected = String(error?.message || error).includes('injected required Git failure');
  }
  let strictGitHelperRejected = false;
  try { git(['glassmatrix-selftest-unsupported-command']); }
  catch (error) {
    strictGitHelperRejected = String(error?.message || error)
      .includes('required git glassmatrix-selftest-unsupported-command failed');
  }
  if (exactIdentity.commit !== sourceCommit
    || exactIdentity.branch !== 'openai/source-selftest'
    || exactIdentity.state !== 'committed'
    || !wrongHostedShaRejected || !invalidHostedShasRejected
    || !requiredGitFailureRejected || !strictGitHelperRejected) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: fail-closed source identity controls drifted ${JSON.stringify({
      exactIdentity, wrongHostedShaRejected, invalidHostedShasRejected,
      requiredGitFailureRejected, strictGitHelperRejected,
    })}`);
  }
  const orbitalSurvey = arc3OrbitalGlassSelftest();
  if (!orbitalSurvey.ok) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: orbital Survey authority/disclosure controls failed (${JSON.stringify(orbitalSurvey)})`);
  }
  const arc4 = arc4GlassSelftest();
  if (!arc4.ok) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: Arc 4 presentation/geometry/return controls failed (${JSON.stringify(arc4)})`);
  }
  const shipyardSettlement = glassShipyardSettlementSelftest();
  if (!shipyardSettlement.ok) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: Shipyard fixture/settlement controls failed (${JSON.stringify(shipyardSettlement)})`);
  }
  const missingShipyardPanel = missingShipyardPanelExpressionOutcome();
  if (missingShipyardPanel.ok !== false || missingShipyardPanel.threw !== false
    || missingShipyardPanel.research?.length !== 0 || missingShipyardPanel.groups?.length !== 0
    || missingShipyardPanel.sectionIds?.length !== 0 || missingShipyardPanel.actionCount !== 0) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: missing Shipyard panel did not return structured red (${JSON.stringify(missingShipyardPanel)})`);
  }
  const reloadFailures = await reloadPhaseSelftest();
  if (reloadFailures.length) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: replacement-document controls failed (${reloadFailures.join('; ')})`);
  }
  const settingsAudioFailures = settingsAudioEvidenceSelftest();
  if (settingsAudioFailures.length) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: Settings audio controls failed (${settingsAudioFailures.join('; ')})`);
  }
  const hostileRevealFailures = hostileCompendiumRevealSelftest();
  if (hostileRevealFailures.length) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: Compendium reveal controls failed (${hostileRevealFailures.join('; ')})`);
  }
  const inlineStyleRestoration = {
    absent: sameInlineStyleAttribute(null, null),
    empty: sameInlineStyleAttribute('', ''),
    absentToEmpty: sameInlineStyleAttribute(null, ''),
    emptyToAbsent: sameInlineStyleAttribute('', null),
    exactNonempty: sameInlineStyleAttribute('height: 243px;', 'height: 243px;'),
    leakedFromAbsent: sameInlineStyleAttribute(null, 'height: 48px !important;'),
    leakedFromEmpty: sameInlineStyleAttribute('', 'height: 48px !important;'),
    changedNonempty: sameInlineStyleAttribute('height: 243px;', 'height: 48px !important;'),
    malformedBefore: sameInlineStyleAttribute({}, ''),
    malformedAfter: sameInlineStyleAttribute('', 0),
  };
  if (!inlineStyleRestoration.absent || !inlineStyleRestoration.empty
    || !inlineStyleRestoration.absentToEmpty || !inlineStyleRestoration.emptyToAbsent
    || !inlineStyleRestoration.exactNonempty || inlineStyleRestoration.leakedFromAbsent
    || inlineStyleRestoration.leakedFromEmpty || inlineStyleRestoration.changedNonempty
    || inlineStyleRestoration.malformedBefore || inlineStyleRestoration.malformedAfter) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: inline-style restoration controls failed (${JSON.stringify(inlineStyleRestoration)})`);
  }
  const visiblePortraitBaseline = {
    ok: true, trailVisible: true, fallback: false, gap: 8,
  };
  const hiddenPortraitBaseline = {
    ok: true, trailVisible: false, fallback: true, gap: null,
  };
  const trailControl = {
    baseline: { ok: true },
    prior: { value: '', priority: '', computed: 'none' },
    mutation: {
      requested: 'block', property: { value: 'block', priority: 'important' },
      computed: 'block', outcome: { ok: false },
    },
    restored: {
      property: { value: '', priority: '' }, computed: 'none', outcome: { ok: true },
    },
  };
  const visibleTrailControl = {
    ...structuredClone(trailControl),
    prior: { value: 'grid', priority: '', computed: 'grid' },
    mutation: {
      requested: 'none', property: { value: 'none', priority: 'important' },
      computed: 'none', outcome: { ok: false },
    },
    restored: {
      property: { value: 'grid', priority: '' }, computed: 'grid', outcome: { ok: true },
    },
  };
  const trailControls = {
    hiddenToVisible: trailRestorationControlOutcome(trailControl),
    visibleToHidden: trailRestorationControlOutcome(visibleTrailControl),
    noOp: trailRestorationControlOutcome({
      ...structuredClone(trailControl),
      mutation: { ...trailControl.mutation, requested: 'none', computed: 'none',
        property: { value: 'none', priority: 'important' } },
    }),
    stayedGreen: trailRestorationControlOutcome({
      ...structuredClone(trailControl),
      mutation: { ...trailControl.mutation, outcome: { ok: true } },
    }),
    wrongRestoration: trailRestorationControlOutcome({
      ...structuredClone(trailControl),
      restored: { ...trailControl.restored,
        property: { value: '', priority: 'important' } },
    }),
  };
  const bandControl = {
    baseline: visiblePortraitBaseline,
    prior: { value: '', priority: '', computed: 'none' },
    mutation: {
      requested: 'translateY(-7px)',
      property: { value: 'translateY(-7px)', priority: 'important' },
      computed: 'matrix(1, 0, 0, 1, 0, -7)',
      outcome: { ok: false, trailVisible: true, fallback: false, gap: 1 },
    },
    restored: {
      property: { value: '', priority: '' }, computed: 'none',
      outcome: visiblePortraitBaseline,
    },
  };
  const bandControls = {
    positive: portraitBandControlOutcome(bandControl),
    noOp: portraitBandControlOutcome({
      ...structuredClone(bandControl),
      mutation: { ...bandControl.mutation, computed: 'none' },
    }),
    ineligible: portraitBandControlOutcome({
      ...structuredClone(bandControl), baseline: hiddenPortraitBaseline,
    }),
    wrongRestoration: portraitBandControlOutcome({
      ...structuredClone(bandControl),
      restored: { ...bandControl.restored,
        property: { value: 'translateY(-7px)', priority: 'important' } },
    }),
  };
  const fallbackControl = {
    baseline: visiblePortraitBaseline,
    prior: { value: '', priority: '', computed: '0px' },
    mutation: {
      requested: '72px', property: { value: '72px', priority: 'important' },
      computed: '72px', baseSafe: 0, forcedSafe: 72,
      outcome: {
        ok: true, fallback: true, trailDisplay: 'none', meaningful: true,
        side: [0, 100, 320, 172], clientHeight: 72, scrollHeight: 120,
        overflowY: 'auto', scrollOk: true, fixedClear: true,
        fixedRows: [
          { id: 'playerchip', visible: true, gap: 8 },
          { id: 'hpbar', visible: true, gap: 8 },
          { id: 'searchbox', visible: true, gap: 8 },
          { id: 'objchip', visible: false, gap: -40 },
        ],
      },
    },
    restored: {
      property: { value: '', priority: '' }, computed: '0px',
      outcome: visiblePortraitBaseline,
    },
  };
  const fallbackControls = {
    positive: portraitFallbackControlOutcome(fallbackControl),
    noOp: portraitFallbackControlOutcome({
      ...structuredClone(fallbackControl),
      mutation: { ...fallbackControl.mutation, requested: '0px',
        property: { value: '0px', priority: 'important' }, computed: '0px', forcedSafe: 0 },
    }),
    ineligible: portraitFallbackControlOutcome({
      ...structuredClone(fallbackControl), baseline: hiddenPortraitBaseline,
    }),
    wrongRestoration: portraitFallbackControlOutcome({
      ...structuredClone(fallbackControl),
      restored: { ...fallbackControl.restored,
        property: { value: '72px', priority: 'important' } },
    }),
    collapsedStrip: portraitFallbackControlOutcome({
      ...structuredClone(fallbackControl),
      mutation: { ...structuredClone(fallbackControl.mutation),
        outcome: { ...structuredClone(fallbackControl.mutation.outcome),
          meaningful: false, side: [0, 100, 320, 164], clientHeight: 64 } },
    }),
    inaccessibleScroll: portraitFallbackControlOutcome({
      ...structuredClone(fallbackControl),
      mutation: { ...structuredClone(fallbackControl.mutation),
        outcome: { ...structuredClone(fallbackControl.mutation.outcome),
          scrollOk: false, overflowY: 'hidden' } },
    }),
    fixedRowOverlap: portraitFallbackControlOutcome({
      ...structuredClone(fallbackControl),
      mutation: { ...structuredClone(fallbackControl.mutation),
        outcome: { ...structuredClone(fallbackControl.mutation.outcome), fixedClear: false,
          fixedRows: structuredClone(fallbackControl.mutation.outcome.fixedRows)
            .map((row, index) => index === 0 ? { ...row, gap: 1 } : row) } },
    }),
  };
  const portraitCampaignControls = {
    positive: portraitControlCampaignOutcome({
      planned: 5, observed: 5, eligible: 2, bandRuns: 1, fallbackRuns: 1,
    }),
    noEligible: portraitControlCampaignOutcome({
      planned: 5, observed: 5, eligible: 0, bandRuns: 0, fallbackRuns: 0,
    }),
    missingBaseline: portraitControlCampaignOutcome({
      planned: 5, observed: 4, eligible: 1, bandRuns: 1, fallbackRuns: 1,
    }),
    duplicateRun: portraitControlCampaignOutcome({
      planned: 5, observed: 5, eligible: 2, bandRuns: 2, fallbackRuns: 1,
    }),
    targetedFallback: portraitControlCampaignOutcome({
      planned: 1, observed: 1, eligible: 0, bandRuns: 0, fallbackRuns: 0,
      requireEligibleCampaign: false,
    }),
    targetedMissingBaseline: portraitControlCampaignOutcome({
      planned: 1, observed: 0, eligible: 0, bandRuns: 0, fallbackRuns: 0,
      requireEligibleCampaign: false,
    }),
    targetedEligibleMissingControl: portraitControlCampaignOutcome({
      planned: 1, observed: 1, eligible: 1, bandRuns: 1, fallbackRuns: 0,
      requireEligibleCampaign: false,
    }),
    targetedFallbackSpuriousControl: portraitControlCampaignOutcome({
      planned: 1, observed: 1, eligible: 0, bandRuns: 1, fallbackRuns: 0,
      requireEligibleCampaign: false,
    }),
  };
  const causalState = { error: null };
  const causalFailures = [];
  const causalTrace = ['before-first-control'];
  let firstCausalError = null;
  try {
    stopAtFirstGlassInstrumentFailure(causalState, causalFailures, 'first control red');
    causalTrace.push('later-control-ran', 'later-viewport-ran', 'later-finding-recorded');
  } catch (error) {
    firstCausalError = error;
  }
  let repeatedCausalError = null;
  try {
    stopAtFirstGlassInstrumentFailure(causalState, causalFailures, 'later control red');
  } catch (error) {
    repeatedCausalError = error;
  }
  let malformedCausalStateRejected = false;
  try { stopAtFirstGlassInstrumentFailure(null, [], 'malformed'); }
  catch (error) { malformedCausalStateRejected = error instanceof TypeError; }
  const preexistingCausalState = { error: null };
  const preexistingCausalFailures = ['first preexisting red', 'derivative red'];
  try { stopAtFirstGlassInstrumentFailure(preexistingCausalState, preexistingCausalFailures, 'later red'); }
  catch { /* the exact first retained failure is asserted below */ }
  const integratedCausalState = { error: null };
  const integratedCausalFailures = [];
  const integratedCausalTrace = ['before-runtime-record'];
  let integratedCausalError = null;
  try {
    recordGlassInstrumentFailure(integratedCausalState, integratedCausalFailures,
      'runtime-recorded red', true);
    integratedCausalTrace.push('later-control-ran', 'later-viewport-ran', 'later-finding-recorded');
  } catch (error) {
    integratedCausalError = error;
  }
  let productCausalError = null;
  const productCausalTrace = ['before-product-outcome'];
  stopAfterRecordedProductOutcome('primary-phone', 'planetside', 'PRODUCT_CONTROL',
    '#planetside', { ok: true }, 'truthful baseline');
  try {
    stopAfterRecordedProductOutcome('primary-phone', 'planetside', 'PRODUCT_CONTROL',
      '#planetside', { ok: false, reason: 'injected' }, 'truthful baseline');
    productCausalTrace.push('dependent-control-ran', 'duplicate-finding-recorded');
  } catch (error) {
    productCausalError = error;
  }
  const malformedProductStops = [];
  for (const outcome of [null, {}, { ok: 1 }, { ok: 'true' }]) {
    try {
      stopAfterRecordedProductOutcome('primary-phone', 'planetside', 'PRODUCT_CONTROL',
        '#planetside', outcome, 'truthful baseline');
    } catch (error) {
      malformedProductStops.push(error instanceof ProductAnswerabilityFinding);
    }
  }
  const collectorFindings = [];
  const collectorTrace = ['before-product-collector'];
  const collectorExecuted = NEGATIVE_CONTROLS.slice(0, 2);
  let collectorError = null, collectorStop = null, collectorBlocked = [];
  for (const viewport of ['large-phone', 'desktop']) {
    collectorTrace.push(`viewport:${viewport}`);
    try {
      if (viewport === 'large-phone') {
        collectGlassProductRows(collectorFindings, viewport, 'settings', [{
          code: 'CONTROL_OUTSIDE_VIEWPORT', surface: 'settings', element: '#fixture-control',
          actual: { reason: 'injected product red' }, expected: 'reachable control',
        }, {
          code: 'DEPENDENT_DUPLICATE', surface: 'settings', element: '#dependent-control',
          actual: { reason: 'must never be recorded' }, expected: 'causally blocked',
        }], true);
        collectorTrace.push('dependent-callback-ran', 'duplicate-finding-recorded');
      } else {
        collectorTrace.push('later-viewport-ran');
      }
    } catch (error) {
      collectorError = error;
      collectorStop ??= { viewport, findingCode: error?.finding?.code || 'UNKNOWN_PRODUCT_RED' };
      collectorBlocked = productBlockedRowsForCausalStop(
        null, viewport, collectorStop.findingCode, collectorExecuted,
      );
    }
    if (shouldStopGlassViewportLoop(collectorStop)) break;
  }
  const collectorCoverage = controlCoverageOutcome(collectorExecuted, collectorBlocked);
  const outcomeCollectorFindings = [], outcomeCollectorTrace = ['before-outcome-collector'];
  let outcomeCollectorError = null;
  try {
    collectGlassProductOutcome(outcomeCollectorFindings, 'primary-phone', 'settings',
      'SETTINGS_SOUND_GREEN', '#setsnd', { ok: true }, 'green outcome', true);
    collectGlassProductOutcome(outcomeCollectorFindings, 'primary-phone', 'settings',
      'SETTINGS_SOUND_RED', '#setsnd', { ok: false, reason: 'injected' }, 'green outcome', true);
    outcomeCollectorTrace.push('dependent-outcome-ran');
  } catch (error) {
    outcomeCollectorError = error;
  }
  if (!trailControls.hiddenToVisible.ok || !trailControls.visibleToHidden.ok
    || trailControls.noOp.ok || trailControls.stayedGreen.ok || trailControls.wrongRestoration.ok
    || !portraitControlBaselineEligible(visiblePortraitBaseline)
    || portraitControlBaselineEligible(hiddenPortraitBaseline)
    || portraitControlBaselineEligible({ ...visiblePortraitBaseline, ok: false })
    || !bandControls.positive.ok || bandControls.noOp.ok || bandControls.ineligible.ok
    || bandControls.wrongRestoration.ok
    || !fallbackControls.positive.ok || fallbackControls.noOp.ok || fallbackControls.ineligible.ok
    || fallbackControls.wrongRestoration.ok || fallbackControls.collapsedStrip.ok
    || fallbackControls.inaccessibleScroll.ok || fallbackControls.fixedRowOverlap.ok
    || !portraitCampaignControls.positive.ok || portraitCampaignControls.noEligible.ok
    || portraitCampaignControls.missingBaseline.ok || portraitCampaignControls.duplicateRun.ok
    || !portraitCampaignControls.targetedFallback.ok
    || portraitCampaignControls.targetedFallback.controlsRequired
    || portraitCampaignControls.targetedMissingBaseline.ok
    || portraitCampaignControls.targetedEligibleMissingControl.ok
    || !portraitCampaignControls.targetedEligibleMissingControl.controlsRequired
    || portraitCampaignControls.targetedFallbackSpuriousControl.ok
    || causalTrace.length !== 1
    || !(firstCausalError instanceof GlassInstrumentControlStop)
    || repeatedCausalError !== firstCausalError
    || causalFailures.length !== 1 || causalFailures[0] !== 'first control red'
    || preexistingCausalFailures.length !== 1
    || preexistingCausalFailures[0] !== 'first preexisting red'
    || integratedCausalTrace.length !== 1
    || !(integratedCausalError instanceof GlassInstrumentControlStop)
    || integratedCausalFailures.length !== 1
    || integratedCausalFailures[0] !== 'runtime-recorded red'
    || productCausalTrace.length !== 1
    || !(productCausalError instanceof ProductAnswerabilityFinding)
    || productCausalError.finding?.code !== 'PRODUCT_CONTROL'
    || productCausalError.finding?.alreadyRecorded !== true
    || productCausalError.evidence?.reason !== 'injected'
    || malformedProductStops.length !== 4 || malformedProductStops.some((stopped) => !stopped)
    || collectorTrace.length !== 2 || collectorTrace[1] !== 'viewport:large-phone'
    || !(collectorError instanceof ProductAnswerabilityFinding)
    || collectorError.finding?.alreadyRecorded !== true
    || collectorError.finding?.code !== 'CONTROL_OUTSIDE_VIEWPORT'
    || collectorFindings.length !== 1
    || collectorFindings[0]?.context?.viewport !== 'large-phone'
    || collectorFindings[0]?.row?.code !== 'CONTROL_OUTSIDE_VIEWPORT'
    || !collectorCoverage.ok || collectorCoverage.omitted.length !== 0
    || collectorCoverage.executed.length !== 2
    || collectorCoverage.blocked.length !== NEGATIVE_CONTROLS.length - 2
    || outcomeCollectorTrace.length !== 1
    || !(outcomeCollectorError instanceof ProductAnswerabilityFinding)
    || outcomeCollectorError.finding?.code !== 'SETTINGS_SOUND_RED'
    || outcomeCollectorFindings.length !== 1
    || outcomeCollectorFindings[0]?.row?.code !== 'SETTINGS_SOUND_RED'
    || !malformedCausalStateRejected) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: trail/portrait eligibility, mutation, restoration, or causal-stop controls failed (${JSON.stringify({
      trailControls, bandControls, fallbackControls, portraitCampaignControls,
      causalTrace, causalFailures, firstCausalError: firstCausalError?.message,
      repeatedCausalError: repeatedCausalError?.message, preexistingCausalFailures,
      integratedCausalTrace, integratedCausalFailures,
      integratedCausalError: integratedCausalError?.message,
      productCausalTrace, productCausalError: productCausalError?.message,
      productCausalFinding: productCausalError?.finding, malformedProductStops,
      collectorTrace, collectorError: collectorError?.message,
      collectorFinding: collectorError?.finding, collectorFindings, collectorCoverage,
      outcomeCollectorTrace, outcomeCollectorError: outcomeCollectorError?.message,
      outcomeCollectorFinding: outcomeCollectorError?.finding, outcomeCollectorFindings,
      malformedCausalStateRejected,
    })})`);
  }
  const toastAnchorRestoration = {
    positive: toastAnchorControlOutcome({
      priorStyle: 'right: 24px; bottom: 40px;', restoredStyle: 'right: 24px; bottom: 40px;',
      before: { ok: true }, mutated: { ok: false, rect: [12, 40, 160, 48] }, restored: { ok: true },
    }),
    absentToEmpty: toastAnchorControlOutcome({
      priorStyle: null, restoredStyle: '', before: { ok: true },
      mutated: { ok: false, rect: [12, 40, 160, 48] }, restored: { ok: true },
    }),
    mutationStayedGreen: toastAnchorControlOutcome({
      priorStyle: '', restoredStyle: '', before: { ok: true },
      mutated: { ok: true, rect: [12, 40, 160, 48] }, restored: { ok: true },
    }),
    restoredAnchorRed: toastAnchorControlOutcome({
      priorStyle: '', restoredStyle: '', before: { ok: true },
      mutated: { ok: false, rect: [12, 40, 160, 48] }, restored: { ok: false },
    }),
  };
  if (!toastAnchorRestoration.positive.ok || toastAnchorRestoration.absentToEmpty.ok
    || toastAnchorRestoration.mutationStayedGreen.ok || toastAnchorRestoration.restoredAnchorRed.ok) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: toast anchor exact-byte restore controls failed (${JSON.stringify(toastAnchorRestoration)})`);
  }
  const guideNeedle = 'up to 1,500 logical entries';
  const guideCarrier = `Compendium presents ${guideNeedle}`;
  const guideBefore = `The ${guideCarrier} while Search filters those saved records.`;
  const guideAfter = guideBefore.replace(guideNeedle, 'a bounded set of logical entries');
  const guideRejected = {
    positive: guideRequiredControlRejected({
      before: guideBefore, after: guideAfter, needle: guideNeedle,
      required: [guideCarrier, 'Search filters those saved records'],
      result: { ok: false, missing: [guideCarrier], text: guideAfter },
    }),
    zeroCarrier: guideRequiredControlRejected({
      before: guideBefore, after: guideAfter, needle: guideNeedle,
      required: ['Search filters those saved records'],
      result: { ok: false, missing: [guideCarrier], text: guideAfter },
    }),
    multipleCarriers: guideRequiredControlRejected({
      before: guideBefore, after: guideAfter, needle: guideNeedle,
      required: [guideCarrier, `A second carrier also says ${guideNeedle}`],
      result: { ok: false, missing: [guideCarrier], text: guideAfter },
    }),
    noOp: guideRequiredControlRejected({
      before: guideBefore, after: guideBefore, needle: guideNeedle,
      required: [guideCarrier],
      result: { ok: false, missing: [guideCarrier], text: guideAfter },
    }),
    wrongCarrier: guideRequiredControlRejected({
      before: guideBefore, after: guideAfter, needle: guideNeedle,
      required: [guideCarrier, 'Search filters those saved records'],
      result: { ok: false, missing: ['Search filters those saved records'], text: guideAfter },
    }),
    needleStillPresent: guideRequiredControlRejected({
      before: guideBefore, after: guideAfter, needle: guideNeedle,
      required: [guideCarrier],
      result: { ok: false, missing: [guideCarrier], text: `${guideAfter} ${guideNeedle}` },
    }),
  };
  if (!guideRejected.positive || guideRejected.zeroCarrier || guideRejected.multipleCarriers
    || guideRejected.noOp || guideRejected.wrongCarrier || guideRejected.needleStillPresent) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: rendered Guide required-copy predicate failed closed incorrectly (${JSON.stringify(guideRejected)})`);
  }
  const renderedGuideMutation = {
    positive: exactGuideRenderedTextMutation(
      'One committed meal raises Meals by 1, capped at 200.',
      'Meals by 1, capped at 200',
      'required Training contract removed',
    ),
    secondSplitPhrase: exactGuideRenderedTextMutation(
      'One committed meal removes 1 flora from that exact lot.',
      'removes 1 flora from that exact lot',
      'required Training contract removed',
    ),
    absent: exactGuideRenderedTextMutation(
      'No meal counter is rendered here.',
      'Meals by 1, capped at 200',
      'required Training contract removed',
    ),
    multiple: exactGuideRenderedTextMutation(
      'Meals by 1, capped at 200; Meals by 1, capped at 200.',
      'Meals by 1, capped at 200',
      'required Training contract removed',
    ),
    noChange: exactGuideRenderedTextMutation(
      'Meals by 1, capped at 200',
      'Meals by 1, capped at 200',
      'Meals by 1, capped at 200',
    ),
    rawMarkupIsNotRenderedText: exactGuideRenderedTextMutation(
      '<b>Meals by 1</b>, capped at 200',
      'Meals by 1, capped at 200',
      'required Training contract removed',
    ),
  };
  const renderedGuideRestoration = {
    exact: guideRenderedControlHtmlRestored(
      '<p>raises <b>Meals by 1</b>, capped at 200.</p>',
      '<p>raises <b>Meals by 1</b>, capped at 200.</p>',
    ),
    flattened: guideRenderedControlHtmlRestored(
      '<p>raises <b>Meals by 1</b>, capped at 200.</p>',
      'raises Meals by 1, capped at 200.',
    ),
    missing: guideRenderedControlHtmlRestored(
      '<p>raises <b>Meals by 1</b>, capped at 200.</p>',
      '',
    ),
  };
  const renderedControlMutation = exactGuideRenderedTextMutation(
    'The Compendium presents up to 1,500 logical entries.',
    'up to 1,500 logical entries',
    'a bounded set of logical entries',
  );
  const renderedControlResult = {
    ok: false,
    missing: ['Compendium presents up to 1,500 logical entries'],
    stale: [],
    text: renderedControlMutation.after,
  };
  const renderedControlInput = {
    mutation: renderedControlMutation,
    observedAfter: renderedControlMutation.after,
    needle: 'up to 1,500 logical entries',
    required: ['Compendium presents up to 1,500 logical entries'],
    result: renderedControlResult,
    restoredHtml: true,
    restoredText: true,
    restoredPredicate: true,
  };
  const renderedControlAssessment = {
    positive: exactGuideRenderedRequiredControlRejected(renderedControlInput),
    observedNoOp: exactGuideRenderedRequiredControlRejected({
      ...renderedControlInput,
      observedAfter: renderedControlMutation.before,
    }),
    wrongObservedAfter: exactGuideRenderedRequiredControlRejected({
      ...renderedControlInput,
      observedAfter: `${renderedControlMutation.after} extra`,
    }),
    staleIntroduced: exactGuideRenderedRequiredControlRejected({
      ...renderedControlInput,
      result: { ...renderedControlResult, stale: ['stale copy'] },
    }),
    htmlNotRestored: exactGuideRenderedRequiredControlRejected({
      ...renderedControlInput,
      restoredHtml: false,
    }),
    textNotRestored: exactGuideRenderedRequiredControlRejected({
      ...renderedControlInput,
      restoredText: false,
    }),
    predicateNotRestored: exactGuideRenderedRequiredControlRejected({
      ...renderedControlInput,
      restoredPredicate: false,
    }),
  };
  const renderedGuideBaselineRows = [
    { id: 'landing', current: { ok: true } },
    { id: 'settings', current: { ok: true } },
  ];
  const renderedGuideControlRows = [
    { id: 'landing', controlRejected: true, requiredControlsRejected: true,
      contradictionRejected: true, restored: true },
    { id: 'settings', controlRejected: true, requiredControlsRejected: true,
      contradictionRejected: true, restored: true },
  ];
  const renderedGuideClassification = {
    green: classifyRenderedGuideIngress({
      baselineComplete: true, baselineRows: renderedGuideBaselineRows, expectedCount: 2,
      predicateControls: { positive: true, noOp: true },
      controlRows: renderedGuideControlRows, error: null,
    }),
    productRed: classifyRenderedGuideIngress({
      baselineComplete: true,
      baselineRows: [renderedGuideBaselineRows[0], { id: 'settings', current: { ok: false } }],
      expectedCount: 2, predicateControls: null, controlRows: [], error: null,
    }),
    instrumentRed: classifyRenderedGuideIngress({
      baselineComplete: true, baselineRows: renderedGuideBaselineRows, expectedCount: 2,
      predicateControls: { positive: true, noOp: true },
      controlRows: [renderedGuideControlRows[0], {
        ...renderedGuideControlRows[1], controlRejected: false,
      }], error: null,
    }),
    setupRed: classifyRenderedGuideIngress({
      baselineComplete: false, baselineRows: [], expectedCount: 2,
      predicateControls: null, controlRows: [], error: 'Guide panel/search missing',
    }),
  };
  const exerciseRenderedGuidePhase = (ingress) => {
    const findings = [], instrumentFailures = [], instrumentState = { error: null }, trace = [];
    let error = null;
    try {
      recordRenderedGuideIngressResult({
        findings, instrumentState, instrumentFailures,
        viewport: 'primary-phone', ingress, armed: true,
      });
      trace.push('dependent-work-ran');
    } catch (cause) {
      error = cause;
    }
    return { findings, instrumentFailures, trace, error };
  };
  const exerciseUnarmedRenderedGuidePhase = (ingress) => {
    const findings = [], instrumentFailures = [], instrumentState = { error: null };
    const result = recordRenderedGuideIngressResult({
      findings, instrumentState, instrumentFailures,
      viewport: 'primary-phone', ingress, armed: false,
    });
    return { findings, instrumentFailures, result, error: instrumentState.error };
  };
  const renderedGuideProductIngress = {
    ...renderedGuideClassification.productRed, baselineRows: renderedGuideBaselineRows,
    predicateControls: null, rows: [],
  };
  const renderedGuidePhase = {
    productRed: exerciseRenderedGuidePhase(renderedGuideProductIngress),
    noOpControl: exerciseRenderedGuidePhase(renderedGuideClassification.instrumentRed),
    nonUniqueControl: exerciseRenderedGuidePhase(classifyRenderedGuideIngress({
      baselineComplete: true, baselineRows: renderedGuideBaselineRows, expectedCount: 2,
      predicateControls: { positive: true, noOp: true },
      controlRows: [renderedGuideControlRows[0], {
        ...renderedGuideControlRows[1], requiredControlsRejected: false,
      }], error: null,
    })),
    restoration: exerciseRenderedGuidePhase(classifyRenderedGuideIngress({
      baselineComplete: true, baselineRows: renderedGuideBaselineRows, expectedCount: 2,
      predicateControls: { positive: true, noOp: true },
      controlRows: [renderedGuideControlRows[0], {
        ...renderedGuideControlRows[1], restored: false,
      }], error: null,
    })),
    unarmedProductRed: exerciseUnarmedRenderedGuidePhase(renderedGuideProductIngress),
    unarmedSetupRed: exerciseUnarmedRenderedGuidePhase(renderedGuideClassification.setupRed),
  };
  const selfSource = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const renderedTextWiring = 'exactGuideRenderedTextMutation(controlTarget.'
    + "textContent||'',part,'required Guide contract removed')";
  const staleHtmlMutation = 'const changed=prior.' + 'replace(part';
  const htmlRestorationWiring = 'guideRenderedControlHtmlRestored(controlPrior,controlTarget.'
    + 'innerHTML)';
  const observedMutationWiring = 'exactGuideRenderedRequiredControlRejected({mutation,'
    + 'observedAfter,needle:part';
  const uniqueCarrierWiring = 'rejected:carriers.length===1&&exactGuideRendered'
    + 'RequiredControlRejected';
  const renderedGuideControlGateWiring = 'if(baselineRows.length===specs.length'
    + '&&baselineRows.every((row)=>row.current.ok)){\n              predicateControls={';
  const renderedTextWiringCount = selfSource.split(renderedTextWiring).length - 1;
  const staleHtmlMutationCount = selfSource.split(staleHtmlMutation).length - 1;
  const htmlRestorationWiringCount = selfSource.split(htmlRestorationWiring).length - 1;
  const observedMutationWiringCount = selfSource.split(observedMutationWiring).length - 1;
  const uniqueCarrierWiringCount = selfSource.split(uniqueCarrierWiring).length - 1;
  const renderedGuideControlGateWiringCount = selfSource.split(renderedGuideControlGateWiring).length - 1;
  if (renderedGuideMutation.positive.targetCount !== 1
    || renderedGuideMutation.positive.changeCount !== 1
    || renderedGuideMutation.positive.after.includes('Meals by 1, capped at 200')
    || renderedGuideMutation.secondSplitPhrase.targetCount !== 1
    || renderedGuideMutation.secondSplitPhrase.changeCount !== 1
    || renderedGuideMutation.secondSplitPhrase.after.includes('removes 1 flora from that exact lot')
    || renderedGuideMutation.absent.targetCount !== 0
    || renderedGuideMutation.absent.changeCount !== 0
    || renderedGuideMutation.multiple.targetCount !== 2
    || renderedGuideMutation.multiple.changeCount !== 0
    || renderedGuideMutation.noChange.targetCount !== 1
    || renderedGuideMutation.noChange.changeCount !== 0
    || renderedGuideMutation.rawMarkupIsNotRenderedText.targetCount !== 0
    || renderedGuideMutation.rawMarkupIsNotRenderedText.changeCount !== 0
    || renderedGuideRestoration.exact !== true
    || renderedGuideRestoration.flattened !== false
    || renderedGuideRestoration.missing !== false
    || renderedControlAssessment.positive !== true
    || renderedControlAssessment.observedNoOp !== false
    || renderedControlAssessment.wrongObservedAfter !== false
    || renderedControlAssessment.staleIntroduced !== false
    || renderedControlAssessment.htmlNotRestored !== false
    || renderedControlAssessment.textNotRestored !== false
    || renderedControlAssessment.predicateNotRestored !== false
    || renderedGuideClassification.green.ok !== true
    || renderedGuideClassification.green.product?.ok !== true
    || renderedGuideClassification.green.instrument?.ok !== true
    || renderedGuideClassification.productRed.ok !== false
    || renderedGuideClassification.productRed.product?.ok !== false
    || renderedGuideClassification.productRed.instrument !== null
    || renderedGuideClassification.instrumentRed.ok !== false
    || renderedGuideClassification.instrumentRed.product?.ok !== true
    || renderedGuideClassification.instrumentRed.instrument?.ok !== false
    || renderedGuideClassification.setupRed.ok !== false
    || renderedGuideClassification.setupRed.product !== null
    || renderedGuideClassification.setupRed.instrument !== null
    || renderedGuideProductIngress.rows.length !== 0
    || renderedGuidePhase.productRed.trace.length !== 0
    || !(renderedGuidePhase.productRed.error instanceof ProductAnswerabilityFinding)
    || renderedGuidePhase.productRed.findings.length !== 1
    || renderedGuidePhase.productRed.findings[0]?.row?.code !== 'GUIDE_RENDERED_COPY_CONTRACT'
    || renderedGuidePhase.productRed.instrumentFailures.length !== 0
    || Object.entries(renderedGuidePhase).filter(([name]) => ![
      'productRed', 'unarmedProductRed', 'unarmedSetupRed',
    ].includes(name))
      .some(([, phase]) => phase.trace.length !== 0
        || !(phase.error instanceof GlassInstrumentControlStop)
        || phase.findings.length !== 0 || phase.instrumentFailures.length !== 1)
    || renderedGuidePhase.unarmedProductRed.findings.length !== 1
    || renderedGuidePhase.unarmedProductRed.findings[0]?.row?.code !== 'GUIDE_RENDERED_COPY_CONTRACT'
    || renderedGuidePhase.unarmedProductRed.instrumentFailures.length !== 0
    || renderedGuidePhase.unarmedProductRed.error !== null
    || renderedGuidePhase.unarmedSetupRed.findings.length !== 0
    || renderedGuidePhase.unarmedSetupRed.instrumentFailures.length !== 1
    || renderedGuidePhase.unarmedSetupRed.error !== null
    || renderedTextWiringCount !== 1
    || staleHtmlMutationCount !== 0
    || htmlRestorationWiringCount !== 1
    || observedMutationWiringCount !== 1
    || uniqueCarrierWiringCount !== 1
    || renderedGuideControlGateWiringCount !== 1) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: rendered Guide exact-text mutation failed closed incorrectly (${JSON.stringify({ renderedGuideMutation, renderedGuideRestoration, renderedControlAssessment, renderedGuideClassification, renderedGuidePhase: Object.fromEntries(Object.entries(renderedGuidePhase).map(([name, phase]) => [name, { findings: phase.findings, instrumentFailures: phase.instrumentFailures, trace: phase.trace, error: phase.error?.message }])), renderedTextWiringCount, staleHtmlMutationCount, htmlRestorationWiringCount, observedMutationWiringCount, uniqueCarrierWiringCount, renderedGuideControlGateWiringCount })})`);
  }
  const fixture = {
    status: 'fail', exitCode: 1,
    browser: {
      executable: '/selftest/chrome', product: 'Edg/999.0.0.1',
      revision: '@selftest-chromium-revision',
      user_agent: 'Mozilla/5.0 HeadlessChrome/999.0.0.0 Edg/999.0.0.0',
      js_version: '99.0.0.1', protocol_version: '1.3',
      consistentAcrossViewports: true,
    },
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
  const fullCausalExecuted = NEGATIVE_CONTROLS.slice(0, 3);
  const fullCausalBlocked = NEGATIVE_CONTROLS.slice(3).map((name) => ({
    name, viewport: 'large-phone', findingCode: 'ARC4_CAPTURE_GEOMETRY_FOCUS',
  }));
  const fullCausalCoverage = controlCoverageOutcome(fullCausalExecuted, fullCausalBlocked);
  const allViewportLabels = MATRIX_VIEWPORTS.map((viewport) => viewport.label);
  const fullCausalSettingsCoverage = settingsAudioViewportCoverageOutcome(
    allViewportLabels, [], [], allViewportLabels,
  );
  if (!fullCausalCoverage.ok
    || fullCausalCoverage.omitted.length !== 0
    || fullCausalCoverage.executed.length !== 3
    || fullCausalCoverage.blocked.length !== NEGATIVE_CONTROLS.length - 3
    || !fullCausalSettingsCoverage.instrumentOk
    || fullCausalSettingsCoverage.productOk
    || fullCausalSettingsCoverage.ok
    || fullCausalSettingsCoverage.baseline.length !== 0
    || fullCausalSettingsCoverage.completed.length !== 0
    || fullCausalSettingsCoverage.productBlocked.length !== allViewportLabels.length) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: full causal product-stop accounting failed (${JSON.stringify({ fullCausalCoverage, fullCausalSettingsCoverage })})`);
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
  const landscapeContrastExecuted = productBlockedSuffixForViewport(
    'phone-landscape', 'REPLACEMENT_UNANSWERABLE_AFTER_READY', ['nonmodal-dock-button-contrast'],
  );
  const landscapeSurfaceExecuted = productBlockedSuffixForViewport(
    'phone-landscape', 'REPLACEMENT_UNANSWERABLE_AFTER_READY', ['mobile-landscape-surface-chrome-yield'],
  );
  const landscapeBothExecuted = productBlockedSuffixForViewport(
    'phone-landscape', 'REPLACEMENT_UNANSWERABLE_AFTER_READY',
    ['nonmodal-dock-button-contrast', 'mobile-landscape-surface-chrome-yield'],
  );
  const primaryAlreadyExecuted = productBlockedSuffixForViewport(
    'primary-phone', 'REPLACEMENT_UNANSWERABLE_AFTER_READY', ['forced-colors-system-mapping'],
  );
  if (primaryBlocked.length !== 1 || primaryBlocked[0].name !== 'forced-colors-system-mapping'
    || landscapeBlocked.length !== 2 || landscapeBlocked[0].name !== 'nonmodal-dock-button-contrast'
    || landscapeBlocked[1].name !== 'mobile-landscape-surface-chrome-yield'
    || landscapeContrastExecuted.length !== 1 || landscapeContrastExecuted[0].name !== 'mobile-landscape-surface-chrome-yield'
    || landscapeSurfaceExecuted.length !== 1 || landscapeSurfaceExecuted[0].name !== 'nonmodal-dock-button-contrast'
    || landscapeBothExecuted.length !== 0
    || ultraBlocked.length !== 1 || ultraBlocked[0].name !== 'ultra-same-backing-resize'
    || primaryAlreadyExecuted.length !== 0
    || productBlockedSuffixForViewport('small-phone', 'REPLACEMENT_UNANSWERABLE_AFTER_READY', []).length) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: full/targeted product-blocked suffix accounting failed');
  }
  const shapedArc4Outcomes = MATRIX_VIEWPORTS.flatMap((viewport) => ARC4_CAPTURE_OUTCOME_CODES.map((code) => ({
    viewport: viewport.label, surface: 'survey-capture', code, ok: true,
    checks: arc4SelftestChecks(code), reasons: [],
  })));
  const shapedArc4Inventory = arc4CaptureOutcomeInventoryOutcome(shapedArc4Outcomes);
  const shaped = {
    schema: 'cf-v2-glassmatrix/v1', status: fixture.status, scope: 'full-certifying', certifying: true,
    viewportInventory: viewportInventory(),
    arc4CaptureOutcomeInventory: {
      plannedOutcomeCodes: [...ARC4_CAPTURE_OUTCOME_CODES], complete: shapedArc4Inventory.complete,
      expectedCount: shapedArc4Inventory.expectedCount, observedCount: shapedArc4Inventory.observedCount,
      omitted: shapedArc4Inventory.omitted, outcomes: shapedArc4Outcomes,
    },
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
    || shaped.arc4CaptureOutcomeInventory?.complete !== true
    || shaped.arc4CaptureOutcomeInventory?.expectedCount !== 36
    || shaped.arc4CaptureOutcomeInventory?.observedCount !== 36
    || !exactJson(shaped.arc4CaptureOutcomeInventory?.plannedOutcomeCodes, ARC4_CAPTURE_OUTCOME_CODES)
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
    || !['non-glass-background-chain', 'settings-pressed-focus',
      'settings-creature-voice-control', 'settings-audio-non-replay', 'guide-render-focus',
      'motion-css-policy', 'ordinary-panel-centre-close', 'opener-expanded-controls',
      'pseudo-placeholder-contrast', 'typography-no-shrink-hierarchy', 'backing-pixel-ceiling',
      'forced-colors-system-mapping', 'panel-open-focus', 'replacement-document-loader-token-phase',
      'replacement-boot-phase-sequence', 'reload-resource-release', 'reload-audio-release',
      'phone-dock-inventory', 'phone-dock-exact-membership',
      'inventory-control-floor', 'inventory-missing-row', 'inventory-duplicate-row', 'inventory-raw-authority-parity',
      'inventory-disabled-pager-contrast',
      'inventory-condition-wording', 'inventory-modal-duplication', 'inventory-modal-retention',
      'inventory-modal-focus', 'inventory-focus-wrap', 'inventory-protected-action', 'inventory-action-publication',
      'inventory-convergence-retry',
      'shipyard-preview-uniqueness', 'shipyard-dom-state-parity',
      'shipyard-close-release', 'shipyard-opener-path', 'shipyard-geometry-focus',
      'arc4-capture-full-pool-copy', 'arc4-capture-model-disabled-parity',
      'arc4-capture-earth-title', 'arc4-capture-roster-counts',
      'arc4-capture-roster-fingerprint', 'arc4-capture-yield',
      'arc4-capture-tame-odds', 'arc4-capture-scavenge-odds',
      'arc4-capture-sample-odds',
      'arc4-capture-native-survey-return', 'arc4-capture-ownership-mutation',
      'arc4-capture-session-rng-mutation', 'arc4-capture-receipt-mutation',
      'arc4-capture-epoch-mutation', 'arc4-capture-v4-counter-mutation',
      'arc4-capture-native-activation', 'arc4-capture-control-overlap']
      .every((name) => shaped.controlSummary.negativeControls.includes(name))) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: injected finding/report grouping drifted');
  }
  /* Viewport timing evidence, both directions: a full certifying PASS must
     carry one well-formed timing per matrix row in order; a missing row or a
     non-finite duration is rejected; partial timings on a red run stay legal
     so an instrument failure cannot be laundered into a timing failure. */
  const timingFixture = MATRIX_VIEWPORTS.map((vp, index) => ({ label: vp.label, durationMs: 1000 + index }));
  const timingPass = viewportTimingsOutcome(timingFixture, { certifying: true, status: 'pass' });
  const timingMissingRow = viewportTimingsOutcome(timingFixture.slice(0, -1), { certifying: true, status: 'pass' });
  const timingMalformed = viewportTimingsOutcome(
    [{ label: 'desktop-8k', durationMs: Number.NaN }], { certifying: false, status: 'fail' },
  );
  const timingPartialRed = viewportTimingsOutcome(
    timingFixture.slice(0, 3), { certifying: true, status: 'instrument-fail' },
  );
  if (!timingPass.ok || timingMissingRow.ok || timingMalformed.ok || !timingPartialRed.ok) {
    throw new Error('GLASS MATRIX REPORT SELFTEST: viewport timing evidence controls failed');
  }
  const chainRunId = 'glass-chain-selftest';
  const chainSource = {
    commit: 'a'.repeat(40), branch: 'openai/test', state: 'committed',
    statusSha256: 'b'.repeat(64), workingTreeSha256: 'c'.repeat(64),
  };
  const chainSlice = {
    schema: 'cf-v2-slice-smoke-ci/v2', assuranceProfile: 'develop',
    runId: 'slice-chain-selftest',
    reportPath: 'apps/game/smoke/slice-smoke-slice-chain-selftest.json',
    reportSha256: 'd'.repeat(64),
    rawLogPath: 'apps/game/smoke/slice-smoke-slice-chain-selftest.log',
    rawLogSha256: 'e'.repeat(64), source: { ...chainSource },
  };
  const chainReport = {
    schema: 'cf-v2-glassmatrix/v1', status: 'pass', terminal: true,
    scope: 'full-certifying', certifying: true, exit: { code: 0 },
    startedAt: '2026-08-27T00:00:00.000Z', endedAt: '2026-08-27T00:00:01.000Z', durationMs: 1000,
    run: { id: chainRunId, artifactPath: glassArtifactPaths(chainRunId).reportRelative },
    source: chainSource, sourceEnd: { ...chainSource }, sourceChange: { detected: false, ending: null },
    predecessors: { slice: chainSlice },
    browser: { ...fixture.browser },
    viewportInventory: viewportInventory(),
    viewportTimings: timingFixture,
    summary: { viewportCount: VIEWPORTS.length, findingCount: 0, instrumentFailureCount: 0, counts: {} },
    findings: [], instrumentFailures: [],
    arc4CaptureOutcomeInventory: {
      plannedOutcomeCodes: [...ARC4_CAPTURE_OUTCOME_CODES], complete: true,
      expectedCount: shapedArc4Outcomes.length, observedCount: shapedArc4Outcomes.length,
      omitted: [], outcomes: shapedArc4Outcomes,
    },
    controlSummary: {
      selftestRan: true,
      negativeControls: [...NEGATIVE_CONTROLS].sort(codeUnitCompare),
      plannedNegativeControls: [...NEGATIVE_CONTROLS],
      automaticRetries: 0, omittedNegativeControls: [], blockedNegativeControls: [],
    },
  };
  const canonicalChain = glassRunEvidenceErrors(chainReport, {
    runId: chainRunId, expectedSource: chainSource, expectedSlice: chainSlice,
  });
  const chainMutants = [
    ['stale-pass', { ...chainReport, run: { ...chainReport.run, id: 'stale-glass-run' } }, 'run ID mismatch'],
    ['interrupted', { ...chainReport, status: 'running', terminal: false, certifying: false, exit: null }, 'not terminal'],
    ['dirty-source', { ...chainReport, certifying: false,
      source: { ...chainSource, state: 'dirty-diagnostic' }, sourceEnd: { ...chainSource, state: 'dirty-diagnostic' } }, 'not clean committed'],
    ['targeted', { ...chainReport, scope: 'targeted-diagnostic', certifying: false }, 'targeted/non-full'],
    ['missing-predecessor', { ...chainReport, predecessors: null }, 'predecessor binding is missing'],
    ['legacy-predecessor', { ...chainReport, predecessors: { slice: {
      ...chainSlice, schema: 'cf-v2-slice-smoke-ci/v1', assuranceProfile: undefined,
    } } }, 'not current profile-bound v2 evidence'],
    ['missing-profile', { ...chainReport, predecessors: { slice: {
      ...chainSlice, assuranceProfile: undefined,
    } } }, 'not current profile-bound v2 evidence'],
    ['wrong-profile', { ...chainReport, predecessors: { slice: {
      ...chainSlice, assuranceProfile: 'production',
    } } }, 'does not exactly match'],
    ['mismatched-predecessor', { ...chainReport, predecessors: { slice: { ...chainSlice, reportSha256: 'f'.repeat(64) } } }, 'does not exactly match'],
    ['fake-viewport-id', { ...chainReport,
      viewportInventory: chainReport.viewportInventory.map((row, index) => index === 0 ? { ...row, label: 'fake-phone' } : row) },
    'exact ordered 12-row matrix'],
    ['malformed-timing', { ...chainReport,
      viewportTimings: chainReport.viewportTimings.map((row, index) => index === 0 ? { ...row, durationMs: 0 } : row) },
    'timing inventory is malformed'],
    ['empty-outcomes', { ...chainReport,
      arc4CaptureOutcomeInventory: { ...chainReport.arc4CaptureOutcomeInventory, outcomes: [] } },
    'outcome inventory is empty'],
    ['vacuous-outcome-checks', { ...chainReport,
      arc4CaptureOutcomeInventory: { ...chainReport.arc4CaptureOutcomeInventory,
        outcomes: chainReport.arc4CaptureOutcomeInventory.outcomes.map((row, index) => index === 0
          ? { ...row, checks: {} } : row) } },
    'outcome inventory is empty'],
    ['wrong-outcome-check-key', { ...chainReport,
      arc4CaptureOutcomeInventory: { ...chainReport.arc4CaptureOutcomeInventory,
        outcomes: chainReport.arc4CaptureOutcomeInventory.outcomes.map((row, index) => {
          if (index !== 0) return row;
          const checks = { ...row.checks, captureObserved: true };
          delete checks.captured;
          return { ...row, checks };
        }) } },
    'outcome inventory is empty'],
    ['missing-outcome-check-key', { ...chainReport,
      arc4CaptureOutcomeInventory: { ...chainReport.arc4CaptureOutcomeInventory,
        outcomes: chainReport.arc4CaptureOutcomeInventory.outcomes.map((row, index) => {
          if (index !== 0) return row;
          const checks = { ...row.checks };
          delete checks.captured;
          return { ...row, checks };
        }) } },
    'outcome inventory is empty'],
    ['extra-outcome-check-key', { ...chainReport,
      arc4CaptureOutcomeInventory: { ...chainReport.arc4CaptureOutcomeInventory,
        outcomes: chainReport.arc4CaptureOutcomeInventory.outcomes.map((row, index) => index === 0
          ? { ...row, checks: { ...row.checks, independentReplay: true } } : row) } },
    'outcome inventory is empty'],
    ['wrong-browser-family', { ...chainReport,
      browser: { ...chainReport.browser, product: 'Firefox/999.0.0.1' } },
    'version-tolerant Chrome/Edge'],
    ['wrong-browser-protocol', { ...chainReport,
      browser: { ...chainReport.browser, protocol_version: '1.2' } },
    'version-tolerant Chrome/Edge'],
    ['missing-browser-provenance', { ...chainReport,
      browser: Object.fromEntries(Object.entries(chainReport.browser)
        .filter(([key]) => key !== 'revision')) },
    'version-tolerant Chrome/Edge'],
    ['omitted-control', { ...chainReport,
      controlSummary: { ...chainReport.controlSummary,
        negativeControls: chainReport.controlSummary.negativeControls.slice(1) } },
    'planned-vs-executed negative-control ledger'],
    ['planned-control-drift', { ...chainReport,
      controlSummary: { ...chainReport.controlSummary,
        plannedNegativeControls: chainReport.controlSummary.plannedNegativeControls.slice(1) } },
    'planned-vs-executed negative-control ledger'],
    ['summary-findings-contradiction', { ...chainReport,
      findings: [{ viewport: 'small-phone', surface: 'selftest', code: 'INJECTED' }] },
    'summary/findings/instrument-failures'],
  ];
  const chainDrift = chainMutants.flatMap(([name, mutant, diagnosis]) => {
    const errors = glassRunEvidenceErrors(mutant, {
      runId: chainRunId, expectedSource: chainSource, expectedSlice: chainSlice,
    });
    return errors.some((error) => error.includes(diagnosis)) ? [] : [{ name, diagnosis, errors }];
  });
  if (canonicalChain.length || chainDrift.length) {
    throw new Error(`GLASS MATRIX REPORT SELFTEST: evidence-chain controls drifted ${JSON.stringify({ canonicalChain, chainDrift })}`);
  }
  const immutableRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-glass-immutable-selftest-'));
  try {
    const immutableArtifact = glassArtifactPaths('glass-immutable-selftest', immutableRoot).report;
    atomicCreateFile(immutableArtifact, 'first immutable bytes\n');
    const before = fs.readFileSync(immutableArtifact);
    let refused = false;
    try { atomicCreateFile(immutableArtifact, 'replacement bytes\n'); }
    catch { refused = true; }
    if (!refused || !fs.readFileSync(immutableArtifact).equals(before)) {
      throw new Error('GLASS MATRIX REPORT SELFTEST: reused run ID overwrote immutable Glass artifact');
    }
  } finally {
    const prefix = os.tmpdir().endsWith(path.sep) ? os.tmpdir() : os.tmpdir() + path.sep;
    if (!immutableRoot.startsWith(prefix)) throw new Error(`refusing unsafe Glass selftest cleanup: ${immutableRoot}`);
    fs.rmSync(immutableRoot, { recursive: true });
  }
  console.log('GLASS MATRIX REPORT SELFTEST: PASS');
  console.log('  injected finding retained; 12 viewport definitions and 36 exact Arc 4 capture outcomes retained; retry policy remains zero');
  console.log('  missing Shipyard generated expression returns {ok:false} without throw; import, release, exact boot subphases, twin-canvas budgets, navigation, and boot-ready deadlines fail closed');
  console.log('  source provenance: physical repository + actual full HEAD accepted; required Git failure and empty/malformed/wrong hosted SHA rejected');
  console.log('  evidence chain: exact clean Slice predecessor accepted; stale/interrupted/dirty/wrong/targeted/missing/mismatched bindings rejected');
  console.log('  trail/portrait controls: measured-opposite mutation, eligible baseline, exact property restoration, no-op rejection, and first-red causal stop accepted');
  console.log('  rendered Guide controls mutate one exact text target across inline markup, reject absent/multiple/no-op targets, and restore authored HTML');
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
    /* Chromium can retain geometry/computed display for descendants hidden by
       a closed disclosure even though they are not painted, reachable, or in
       the disclosure's scroll overflow. Only the direct summary subtree is
       rendered while an ancestor <details> is closed. */
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (node instanceof HTMLDetailsElement && !node.open) {
        const summary = [...node.children].find((child) => child instanceof HTMLElement
          && child.tagName === 'SUMMARY');
        if (!(summary instanceof HTMLElement) || !summary.contains(el)) return false;
      }
    }
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
    const stable = ['data-pref', 'data-value', 'data-sel', 'data-act', 'data-pnx', 'data-cid', 'data-ci', 'data-motion', 'data-gt', 'data-release-index', 'data-arc9-explorer-name-open', 'name'];
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
  const inventoryRowsOutcome = (carrier, openerSelector) => {
    const state = window.__CF_SLICE__?.api?.state?.();
    const panel = document.getElementById('inventorypanel');
    const opener = document.querySelector(openerSelector);
    const inventory = carrier?.arc2?.kind === 'inventory' ? carrier.arc2.inventory : null;
    const equipped = new Set((inventory?.equipped || []).map((binding) => binding.instanceId));
    const expectedRows = inventory ? [
      ...inventory.pendingRewards.map(({ instance }) => ({
        instanceId: instance.instanceId, baseId: instance.baseId, pending: true,
        equipped: false, favorite: false, locked: false,
      })),
      ...inventory.entries.map((entry) => ({
        instanceId: entry.instance.instanceId, baseId: entry.instance.baseId, pending: false,
        equipped: equipped.has(entry.instance.instanceId), favorite: entry.favorite, locked: entry.locked,
      })),
    ] : [];
    const domRows = panel ? [...panel.querySelectorAll('[data-inventory-row="exact"]')].map((row) => ({
      instanceId: row.getAttribute('data-instance-id'), baseId: row.getAttribute('data-base-id'),
      pending: row.getAttribute('data-pending') === 'true', equipped: row.getAttribute('data-equipped') === 'true',
      favorite: row.getAttribute('data-favorite') === 'true', locked: row.getAttribute('data-locked') === 'true',
    })) : [];
    const ids = domRows.map((row) => row.instanceId);
    const controls = panel ? [...panel.querySelectorAll('button,input,select')].filter(visible) : [];
    const floor = [opener, ...controls].map((control) => {
      const rect = control?.getBoundingClientRect();
      return { id: control?.id || selectorName(control), width: round(rect?.width ?? 0), height: round(rect?.height ?? 0) };
    });
    const stateIds = state?.inventory?.entryIds || [];
    const statePendingIds = state?.inventory?.pendingIds || [];
    const stateBindings = state?.inventory?.equippedBindings || [];
    const durable = carrier?.rowSchema === 5 && carrier?.rowSegment === 'inventory'
      && carrier?.carrierVersion === 1 && typeof carrier?.carrierJson === 'string'
      && carrier.carrierJson === JSON.stringify(carrier.arc2);
    const runtimeMatch = state?.inventory?.stateKind === 'inventory' && state.inventory.bootstrapPending === false
      && state.inventory.revision === inventory?.revision && state.inventory.entries === inventory?.entries?.length
      && state.inventory.pending === inventory?.pendingRewards?.length
      && JSON.stringify(stateIds) === JSON.stringify(inventory?.entries?.map(({ instance }) => instance.instanceId) || [])
      && JSON.stringify(statePendingIds) === JSON.stringify(inventory?.pendingRewards?.map(({ instance }) => instance.instanceId) || [])
      && JSON.stringify(stateBindings) === JSON.stringify(inventory?.equipped || []);
    const rowsMatch = expectedRows.length > 0 && expectedRows.length <= 48
      && ids.length === new Set(ids).size && JSON.stringify(domRows) === JSON.stringify(expectedRows);
    const openerReady = !!opener && visible(opener) && opener.getAttribute('aria-controls') === 'inventorypanel'
      && opener.getAttribute('aria-expanded') === 'true';
    return {
      ok: !!panel && visible(panel) && durable && runtimeMatch && rowsMatch && openerReady
        && floor.length > 1 && floor.every((row) => row.width >= 44 && row.height >= 44),
      durable, runtimeMatch, rowsMatch, openerReady, expectedRows, domRows, floor,
      stateInventory: state?.inventory || null,
    };
  };
  const inventoryConditionOutcome = () => {
    const sheet = document.getElementById('inventorysheet');
    const expected = (condition) => condition === 'unconditional' ? 'Always applies'
      : condition.startsWith('landing:') ? `Only when landing on ${condition.slice('landing:'.length)}`
        : `Only when ${condition}`;
    const inspect = (selector) => sheet ? [...sheet.querySelectorAll(selector)].map((row) => {
      const condition = row.getAttribute('data-condition') || '';
      const wording = expected(condition);
      return { condition, wording, text: (row.textContent || '').replace(/\s+/g, ' ').trim(),
        ok: condition.length > 0 && (row.textContent || '').includes(wording) };
    }) : [];
    const effects = inspect('[data-inventory-effect]');
    const comparisons = inspect('[data-compare-effect]');
    const conditionalEffects = effects.filter((row) => row.condition !== 'unconditional');
    const conditionalComparisons = comparisons.filter((row) => row.condition !== 'unconditional');
    return {
      ok: !!sheet && visible(sheet) && effects.length > 0 && comparisons.length > 0
        && conditionalEffects.length > 0 && conditionalComparisons.length > 0
        && effects.every((row) => row.ok) && comparisons.every((row) => row.ok),
      effects, comparisons, conditionalEffects: conditionalEffects.length,
      conditionalComparisons: conditionalComparisons.length,
    };
  };
  const inventoryModalOutcome = (expectedInstanceId, safe = {}, expectedFocusSelector = '[data-inventory-sheet-close]') => {
    const sheets = [...document.querySelectorAll('#inventorysheet')];
    const sheet = sheets[0] || null;
    const card = sheet?.querySelector('.inventory-sheet-card') || null;
    const detail = sheet?.querySelector('[data-inventory-detail]') || null;
    const focus = sheet?.querySelector(expectedFocusSelector) || null;
    const diagnostics = window.__CF_SLICE__?.api?.inventoryDiagnostics?.();
    const presentation = window.__CF_SLICE__?.api?.state?.();
    const labelledBy = sheet?.getAttribute('aria-labelledby');
    const title = labelledBy ? document.getElementById(labelledBy) : null;
    const siblings = [...document.body.children].filter((node) => node !== sheet);
    const background = siblings.map((node) => ({
      selector: selectorName(node), tag: node.tagName, id: node.id || null,
      inert: node.inert === true, inertAttribute: node.hasAttribute('inert'),
      ariaHidden: node.getAttribute('aria-hidden'),
    }));
    const unlockedBackground = background.filter((node) => !node.inert || node.ariaHidden !== 'true');
    const backgroundLocked = siblings.length > 0 && unlockedBackground.length === 0;
    const bounds = visualBounds(safe), cardBox = card ? box(card) : null;
    const cardStyle = card ? getComputedStyle(card) : null;
    const controls = sheet ? [...sheet.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')]
      .filter((control) => visible(control)) : [];
    const controlFloor = controls.map((control) => {
      const rect = control.getBoundingClientRect();
      return { selector: selectorName(control), width: round(rect.width), height: round(rect.height) };
    });
    const detailCount = sheet?.querySelectorAll('[data-inventory-detail]').length ?? 0;
    const geometry = !!cardBox && inside(cardBox, bounds)
      && (card.scrollHeight <= card.clientHeight + 1 || /(auto|scroll)/.test(cardStyle?.overflowY || ''));
    return {
      ok: sheets.length === 1 && !!sheet && visible(sheet) && sheet.hidden === false
        && sheet.getAttribute('role') === 'dialog' && sheet.getAttribute('aria-modal') === 'true'
        && sheet.getAttribute('aria-hidden') === 'false' && !!title && sheet.contains(title)
        && detailCount === 1 && detail?.getAttribute('data-inventory-detail') === expectedInstanceId
        && diagnostics?.schema === 'cf-v2-inventory-sheet-diagnostics/v1'
        && diagnostics?.activeCount === 1 && diagnostics?.retainedCount === 0
        && diagnostics?.pendingWork === 0 && diagnostics?.selectedInstanceId === expectedInstanceId
        && backgroundLocked && geometry && controls.length >= 2
        && controlFloor.every((row) => row.width >= 44 && row.height >= 44)
        && document.activeElement === focus,
      sheetCount: sheets.length, detailCount, detailId: detail?.getAttribute('data-inventory-detail') || null,
      diagnostics, backgroundLocked, unlockedBackground,
      presentation: {
        toastSerial: presentation?.toastSerial ?? null,
        toastOn: presentation?.toastOn ?? null,
        progressionLastDeliveredKey: presentation?.progressionCeremony?.lastDeliveredKey ?? null,
      },
      geometry, cardBox, bounds, controlFloor,
      expectedFocus: focus ? selectorName(focus) : null,
      active: document.activeElement instanceof Element ? selectorName(document.activeElement) : null,
    };
  };
  const inventoryFocusTrapOutcome = (expectedEdge) => {
    const sheet = document.getElementById('inventorysheet');
    const controls = sheet ? [...sheet.querySelectorAll(
      'button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hidden && !element.disabled && !element.closest('[hidden]')) : [];
    const first = controls[0] || null, last = controls.at(-1) || null;
    const expected = expectedEdge === 'first' ? first : expectedEdge === 'last' ? last : null;
    const active = document.activeElement instanceof Element ? document.activeElement : null;
    const activeInside = !!sheet && !!active && sheet.contains(active);
    return {
      ok: !!sheet && visible(sheet) && controls.length >= 2 && !!expected
        && activeInside && active === expected,
      expectedEdge, controlCount: controls.length, activeInside,
      first: first ? selectorName(first) : null, last: last ? selectorName(last) : null,
      expected: expected ? selectorName(expected) : null,
      active: active ? selectorName(active) : null,
    };
  };
  const inventoryClosedOutcome = (expectedFocusInstanceId = null) => {
    const sheets = [...document.querySelectorAll('#inventorysheet')];
    const sheet = sheets[0] || null;
    const diagnostics = window.__CF_SLICE__?.api?.inventoryDiagnostics?.();
    const active = document.activeElement instanceof Element ? document.activeElement : null;
    const focusInstanceId = active?.getAttribute('data-instance-id') || null;
    return {
      ok: sheets.length === 1 && !!sheet && !visible(sheet) && sheet.hidden === true
        && sheet.getAttribute('aria-hidden') === 'true' && sheet.getAttribute('aria-busy') === 'false'
        && sheet.querySelector('[data-inventory-sheet-body]')?.childElementCount === 0
        && diagnostics?.schema === 'cf-v2-inventory-sheet-diagnostics/v1'
        && diagnostics?.activeCount === 0 && diagnostics?.retainedCount === 0
        && diagnostics?.pendingWork === 0 && diagnostics?.selectedInstanceId === null
        && !document.body.classList.contains('inventory-sheet-open')
        && (expectedFocusInstanceId === null || focusInstanceId === expectedFocusInstanceId),
      sheetCount: sheets.length, hidden: sheet?.hidden ?? null,
      bodyChildren: sheet?.querySelector('[data-inventory-sheet-body]')?.childElementCount ?? -1,
      busy: sheet?.getAttribute('aria-busy') || null, diagnostics, focusInstanceId,
    };
  };
  const inventoryProtectedActionOutcome = (instanceId) => {
    const actions = [...document.querySelectorAll(`#inventorysheet [data-inventory-action][data-instance-id="${CSS.escape(instanceId)}"]`)];
    const protectedActions = actions.filter((button) => button.getAttribute('data-protected-reason'));
    return {
      ok: protectedActions.length > 0 && protectedActions.every((button) => button.disabled
        && button.getAttribute('data-action-enabled') === 'false'),
      actions: actions.map((button) => ({ operation: button.getAttribute('data-inventory-action'),
        disabled: button.disabled, enabled: button.getAttribute('data-action-enabled'),
        reason: button.getAttribute('data-protected-reason') })),
    };
  };
  const inventoryBusyOutcome = (before) => {
    const state = window.__CF_SLICE__?.api?.state?.();
    const diagnostics = window.__CF_SLICE__?.api?.inventoryDiagnostics?.();
    const sheet = document.getElementById('inventorysheet');
    const rowElements = [...document.querySelectorAll('#inventorypanel [data-inventory-row="exact"]')];
    const rowIds = rowElements.map((row) => row.getAttribute('data-instance-id'));
    const domEquipped = rowElements.map((row) => row.getAttribute('data-equipped'));
    const equippedBindings = state?.inventory?.equippedBindings || [];
    const actions = sheet ? [...sheet.querySelectorAll('[data-inventory-action]')] : [];
    const entryIdsMatch = JSON.stringify(state?.inventory?.entryIds || [])
      === JSON.stringify(before?.entryIds || []);
    const runtimeBindingsMatch = JSON.stringify(equippedBindings)
      === JSON.stringify(before?.equippedBindings || []);
    const rowIdsMatch = JSON.stringify(rowIds) === JSON.stringify(before?.rowIds || []);
    const domEquippedMatch = JSON.stringify(domEquipped) === JSON.stringify(before?.domEquipped || []);
    return {
      ok: sheet?.getAttribute('aria-busy') === 'true' && diagnostics?.pendingWork === 1
        && actions.length > 0 && actions.every((button) => button.disabled)
        && state?.inventory?.revision === before?.revision
        && entryIdsMatch && runtimeBindingsMatch && rowIdsMatch && domEquippedMatch,
      busy: sheet?.getAttribute('aria-busy') || null, diagnostics,
      revision: state?.inventory?.revision ?? null, entryIds: state?.inventory?.entryIds || [],
      equippedBindings, rowIds, domEquipped,
      entryIdsMatch, runtimeBindingsMatch, rowIdsMatch, domEquippedMatch,
      actions: actions.map((button) => ({ operation: button.getAttribute('data-inventory-action'), disabled: button.disabled })),
    };
  };
  const inventoryConvergenceOutcome = (diagnostics = window.__CF_SLICE__?.api?.inventoryDiagnostics?.()) => {
    const sheet = document.getElementById('inventorysheet');
    const actions = sheet ? [...sheet.querySelectorAll('[data-inventory-action]')] : [];
    const action = diagnostics?.lastAction;
    return {
      ok: diagnostics?.activeCount === 1 && diagnostics?.pendingWork === 0
        && action?.kind === 'committed' && /publication-reload/.test(action?.detail || '')
        && sheet?.getAttribute('aria-busy') === 'false' && actions.length > 0
        && actions.every((button) => button.disabled
          && button.getAttribute('data-action-enabled') === 'false'
          && button.getAttribute('data-protected-reason') === 'convergence-reload'),
      diagnostics, busy: sheet?.getAttribute('aria-busy') || null,
      actions: actions.map((button) => ({ disabled: button.disabled,
        enabled: button.getAttribute('data-action-enabled'), reason: button.getAttribute('data-protected-reason') })),
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
    const ancestors = [];
    for (let n = el.parentElement; n; n = n.parentElement) {
      const s = getComputedStyle(n), r = n.getBoundingClientRect();
      const clipsX = s.overflowX !== 'visible', clipsY = s.overflowY !== 'visible';
      if (clipsX) { bounds.left = Math.max(bounds.left, r.left); bounds.right = Math.min(bounds.right, r.right); }
      if (clipsY) { bounds.top = Math.max(bounds.top, r.top); bounds.bottom = Math.min(bounds.bottom, r.bottom); }
      if (clipsX || clipsY) ancestors.push({
        element: selectorName(n), rect: box(n), overflowX: s.overflowX, overflowY: s.overflowY,
        clientWidth: n.clientWidth, clientHeight: n.clientHeight,
        scrollWidth: n.scrollWidth, scrollHeight: n.scrollHeight,
        scrollLeft: round(n.scrollLeft), scrollTop: round(n.scrollTop),
      });
      if (n === root) break;
    }
    bounds.width = round(Math.max(0, bounds.right - bounds.left));
    bounds.height = round(Math.max(0, bounds.bottom - bounds.top));
    return { bounds, ancestors };
  };
  const setExactScrollPosition = (owner, left, top) => {
    const style = owner.style;
    const prior = {
      value: style.getPropertyValue('scroll-behavior'),
      priority: style.getPropertyPriority('scroll-behavior'),
    };
    try {
      style.setProperty('scroll-behavior', 'auto', 'important');
      owner.scrollLeft = left;
      owner.scrollTop = top;
      void owner.getBoundingClientRect();
    } finally {
      if (prior.value) style.setProperty('scroll-behavior', prior.value, prior.priority);
      else style.removeProperty('scroll-behavior');
    }
    return { left: owner.scrollLeft, top: owner.scrollTop };
  };
  const scrollControlIntoView = (el, root, viewport, rememberScroll = null) => {
    let r = box(el), clipped = clippedBounds(el, root, viewport);
    const scrollAttempts = [];
    if (inside(r, clipped.bounds)) return { rect: r, ...clipped, scrollAttempts };
    for (let n = el.parentElement; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if ((n.scrollHeight > n.clientHeight + 1 && /(auto|scroll)/.test(s.overflowY))
        || (n.scrollWidth > n.clientWidth + 1 && /(auto|scroll)/.test(s.overflowX))) {
        rememberScroll?.(n);
        const before = { left: round(n.scrollLeft), top: round(n.scrollTop) };
        const nr = n.getBoundingClientRect(), er = el.getBoundingClientRect();
        const top = n.scrollHeight > n.clientHeight + 1
          ? n.scrollTop + (er.top + er.bottom - nr.top - nr.bottom) / 2 : n.scrollTop;
        const left = n.scrollWidth > n.clientWidth + 1
          ? n.scrollLeft + (er.left + er.right - nr.left - nr.right) / 2 : n.scrollLeft;
        const observed = setExactScrollPosition(n, left, top);
        r = box(el);
        clipped = clippedBounds(el, root, viewport);
        scrollAttempts.push({ owner: selectorName(n), before,
          requested: { left: round(left), top: round(top) },
          observed: { left: round(observed.left), top: round(observed.top) },
          rect: r, bounds: clipped.bounds });
        if (inside(r, clipped.bounds)) return { rect: r, ...clipped, scrollAttempts };
      }
      if (n === root) break;
    }
    return { rect: r, ...clipped, scrollAttempts };
  };
  const focusEvidence = (el) => {
    try { el.blur(); } catch { /* non-focusable */ }
    const before = getComputedStyle(el);
    const b = { outline: before.outline, shadow: before.boxShadow, border: before.borderColor, background: before.backgroundColor };
    /* Plain script focus inherits the browser's latest input modality. A
       prior real pointer route can therefore suppress :focus-visible even
       when the product's keyboard focus paint is correct. Force the standard
       indicated-focus state so this audit measures the authored outcome. */
    try { el.focus({ preventScroll: true, focusVisible: true }); } catch { /* reported below */ }
    const after = getComputedStyle(el);
    const outlineWidth = parseFloat(after.outlineWidth) || 0;
    const outline = after.outlineStyle !== 'none' && outlineWidth >= 1 && parseColor(after.outlineColor)?.[3] !== 0;
    const focusVisible = el.matches(':focus-visible');
    const outlineChanged = b.outline !== after.outline;
    const shadowChanged = b.shadow !== after.boxShadow;
    const borderChanged = b.border !== after.borderColor;
    const backgroundChanged = b.background !== after.backgroundColor;
    const changed = outlineChanged || shadowChanged || borderChanged || backgroundChanged;
    const painted = outline || (after.boxShadow !== 'none' && shadowChanged) || borderChanged || backgroundChanged;
    return {
      focused: document.activeElement === el,
      focusVisible,
      visible: focusVisible && changed && painted,
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
      const scrollState = new Map();
      const scrolled = scrollControlIntoView(el, root, bounds, (owner) => {
        if (!scrollState.has(owner)) scrollState.set(owner, [owner.scrollLeft, owner.scrollTop]);
      }), r = scrolled.rect, controlBounds = scrolled.bounds;
      const name = selectorName(el), h = hit(el);
      const sourceIndexRaw = el.getAttribute('data-ci');
      const identity = {
        logicalId: el.getAttribute('data-cid'),
        sourceIndex: sourceIndexRaw === null || !Number.isFinite(Number(sourceIndexRaw))
          ? sourceIndexRaw : Number(sourceIndexRaw),
      };
      if (r.width + 0.5 < targetFloor || r.height + 0.5 < targetFloor) {
        controlIssue(issue('TARGET_TOO_SMALL', surface, name, { width: r.width, height: r.height }, 'both dimensions >= ' + targetFloor + 'px'));
      }
      if (!inside(r, controlBounds)) controlIssue(issue('CONTROL_OUTSIDE_VIEWPORT', surface, name, {
        rect: r, bounds: controlBounds, ...identity, clippingAncestors: scrolled.ancestors,
        scrollAttempts: scrolled.scrollAttempts,
      }, 'control scrolls fully inside every clipping ancestor, the visual viewport, and safe area'));
      if (!h.ok) controlIssue(issue('CONTROL_NOT_HITTABLE', surface, name, h, 'control owns its centre point after scrolling into reach'));
      const a11y = accessibleName(el);
      if (!a11y) controlIssue(issue('ACCESSIBLE_NAME_MISSING', surface, name, { tag: el.tagName.toLowerCase(), type: el.getAttribute('type') }, 'non-empty accessible name'));
      const nativeKeyboard = /^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || (el.tagName === 'A' && el.hasAttribute('href'));
      if (!nativeKeyboard && el.tabIndex < 0) {
        controlIssue(issue('KEYBOARD_UNREACHABLE', surface, name, { tag: el.tagName.toLowerCase(), tabIndex: el.tabIndex }, 'native keyboard control or tabIndex >= 0'));
      }
      for (const [owner, [left, top]] of scrollState) {
        setExactScrollPosition(owner, left, top);
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
    root.innerHTML = '<p id="cf-control-copy" style="margin:0">Readable control copy</p><ul style="margin:0"><li id="cf-control-list-copy">List copy</li></ul><small id="cf-control-small-copy">Small copy</small><button id="cf-control-button" aria-label="control button" style="display:block;width:44px;height:44px">x</button>';
    document.body.appendChild(root);
    const base = { surface: 'selftest', root: '#cf-control-surface', textMin: 4, required: [{ selector: '#cf-control-copy', min: 1, textMin: 4 }], interactiveRoots: ['#cf-control-surface'], focusSelectors: ['#cf-control-button'], contrastSelectors: ['#cf-control-surface'], targetFloor: 44 };
    const button = root.querySelector('#cf-control-button');
    button.blur();
    button.focus({ preventScroll: true, focusVisible: false });
    const suppressed = getComputedStyle(button);
    if (document.activeElement !== button || button.matches(':focus-visible')
      || (suppressed.outlineStyle !== 'none' && (parseFloat(suppressed.outlineWidth) || 0) >= 1)
      || suppressed.boxShadow !== 'none') {
      failures.push('focus modality control: focusVisible:false unexpectedly painted or failed to own focus');
    }
    let list = audit(base);
    reject('positive viewport geometry', list, 'OUTSIDE_VIEWPORT', '#cf-control-surface');
    reject('positive clipping geometry', list, 'CLIPPED_WITHOUT_SCROLL', '#cf-control-surface');
    reject('positive geometry', list, 'TARGET_TOO_SMALL', '#cf-control-button');
    reject('positive focus', list, 'FOCUS_INVISIBLE', '#cf-control-button');
    reject('positive contrast', list, 'TEXT_CONTRAST_LOW', '#cf-control-copy');
    const closedDetails = document.createElement('details');
    closedDetails.innerHTML = '<summary id="cf-control-details-summary">App status</summary>'
      + '<div><button id="cf-control-details-action" style="width:180px;height:44px">Check for updates</button></div>';
    root.appendChild(closedDetails);
    const closedSummary = closedDetails.querySelector('#cf-control-details-summary');
    const closedAction = closedDetails.querySelector('#cf-control-details-action');
    if (!visible(closedSummary) || visible(closedAction)
      || interactives([root]).includes(closedAction)) {
      failures.push('closed disclosure visibility control did not retain Summary while excluding its unreachable action');
    }
    closedDetails.open = true;
    if (!visible(closedAction) || !interactives([root]).includes(closedAction)) {
      failures.push('open disclosure visibility control did not admit its reachable action');
    }
    closedDetails.remove();
    button.style.width = '20px'; list = audit(base); expect('small target injection', list, 'TARGET_TOO_SMALL', '#cf-control-button'); button.style.width = '44px';
    button.style.setProperty('outline', 'none', 'important');
    button.style.setProperty('box-shadow', 'none', 'important');
    list = audit(base); expect('focus paint injection', list, 'FOCUS_INVISIBLE', '#cf-control-button');
    button.style.removeProperty('outline'); button.style.removeProperty('box-shadow');
    list = audit(base); reject('focus paint restoration', list, 'FOCUS_INVISIBLE', '#cf-control-button');
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
    const geometryBase = (fixture) => ({
      surface: 'selftest-control-geometry', root: '#' + fixture.id, textMin: 1,
      interactiveRoots: ['#' + fixture.id], contrastSelectors: [], targetFloor: 44,
      maxControlReports: 10,
    });
    const shortClip = document.createElement('section');
    shortClip.id = 'cf-control-short-clip';
    shortClip.style.cssText = 'position:fixed;left:8px;top:280px;width:240px;height:90px;z-index:1003';
    shortClip.innerHTML = '<div id="cf-control-short-scroller" style="width:210px;height:48px;overflow-y:auto"><button data-cid="short-first" data-ci="0" style="display:block;width:180px;height:61px">first oversized row</button><button data-cid="short-last" data-ci="9" style="display:block;width:180px;height:61px">last oversized row</button></div>';
    document.body.appendChild(shortClip);
    list = audit(geometryBase(shortClip));
    const shortOutside = list.filter((row) => row.code === 'CONTROL_OUTSIDE_VIEWPORT');
    const shortIdentities = new Set(shortOutside.map((row) => `${row.actual?.logicalId}:${row.actual?.sourceIndex}`));
    if (shortOutside.length !== 2 || !shortIdentities.has('short-first:0') || !shortIdentities.has('short-last:9')
      || shortOutside.some((row) => !row.actual?.clippingAncestors?.some((ancestor) => ancestor.element === '#cf-control-short-scroller'
        && ancestor.clientHeight === 48 && /(auto|scroll)/.test(ancestor.overflowY)))) {
      failures.push('48px row-clipping diagnostics did not preserve both logical identities and the limiting scroller: ' + JSON.stringify(shortOutside));
    }
    shortClip.remove();
    const reachableClip = document.createElement('section');
    reachableClip.id = 'cf-control-reachable-clip';
    reachableClip.style.cssText = 'position:fixed;left:8px;top:280px;width:240px;height:100px;z-index:1003';
    reachableClip.innerHTML = '<div id="cf-control-reachable-scroller" style="width:210px;height:70px;overflow-y:auto;scroll-behavior:smooth"><div style="height:96px"></div><button data-cid="reachable-middle" data-ci="4" style="display:block;width:180px;height:44px">reachable middle row</button><div style="height:96px"></div></div>';
    document.body.appendChild(reachableClip);
    const reachableScroller = reachableClip.querySelector('#cf-control-reachable-scroller');
    reachableScroller.scrollTop = 7;
    list = audit(geometryBase(reachableClip));
    reject('scrollable row positive geometry', list, 'CONTROL_OUTSIDE_VIEWPORT', 'reachable-middle');
    if (reachableScroller.scrollTop !== 7) failures.push('scrollable row audit did not restore its exact prior scroll offset');
    reachableClip.remove();
    const ancestorClip = document.createElement('section');
    ancestorClip.id = 'cf-control-ancestor-root';
    ancestorClip.style.cssText = 'position:fixed;left:8px;top:280px;width:240px;height:100px;z-index:1003';
    ancestorClip.innerHTML = '<div id="cf-control-ancestor-clip" style="width:220px;height:48px;overflow:hidden"><div style="width:210px;height:80px;overflow-y:auto"><button data-cid="ancestor-pinned" data-ci="5" style="display:block;width:180px;height:61px">ancestor clipped row</button></div></div>';
    document.body.appendChild(ancestorClip);
    list = audit(geometryBase(ancestorClip));
    const ancestorOutside = list.find((row) => row.code === 'CONTROL_OUTSIDE_VIEWPORT'
      && row.actual?.logicalId === 'ancestor-pinned' && row.actual?.sourceIndex === 5);
    if (!ancestorOutside || !ancestorOutside.actual.clippingAncestors?.some((ancestor) => ancestor.element === '#cf-control-ancestor-clip'
      && ancestor.clientHeight === 48 && ancestor.overflowY === 'hidden')) {
      failures.push('overflow-ancestor control did not diagnose its 48px hidden limiter: ' + JSON.stringify(list));
    }
    ancestorClip.remove();
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
    inventoryRowsOutcome, inventoryConditionOutcome, inventoryModalOutcome, inventoryFocusTrapOutcome,
    inventoryClosedOutcome,
    inventoryProtectedActionOutcome, inventoryBusyOutcome, inventoryConvergenceOutcome,
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
    'phone-landscape': ['nonmodal-dock-button-contrast', 'mobile-landscape-surface-chrome-yield'],
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
    executed: executed.filter((name) => NEGATIVE_CONTROLS.includes(name))
      .sort(codeUnitCompare),
    blocked: blockedRows.slice()
      .sort((a, b) => codeUnitCompare(a.name, b.name)),
    omitted: NEGATIVE_CONTROLS.filter((name) => !executed.includes(name) && !blockedNames.includes(name)),
  };
}

/* HTML serialization may expose an inline-style attribute with no
   declarations as either absent or the empty string. Those states are
   presentation-identical; every nonempty byte remains exact so a leaked
   control declaration cannot be normalized away. */
function sameInlineStyleAttribute(before, after) {
  if (!(before === null || typeof before === 'string')
    || !(after === null || typeof after === 'string')) return false;
  return before === after || (before === null && after === '') || (before === '' && after === null);
}

function exactOwnedStyleProperty(left, right) {
  return !!left && !!right
    && typeof left.value === 'string' && typeof left.priority === 'string'
    && typeof right.value === 'string' && typeof right.priority === 'string'
    && left.value === right.value && left.priority === right.priority;
}

function measuredOppositeDisplay(display) {
  const current = typeof display === 'string' ? display.trim() : '';
  if (!current || current === 'missing') {
    return { ok: false, current: current || null, replacement: null };
  }
  const replacement = current === 'none' ? 'block' : 'none';
  return { ok: replacement !== current, current, replacement };
}

function portraitControlBaselineEligible(outcome) {
  return outcome?.ok === true
    && outcome?.trailVisible === true
    && outcome?.fallback === false;
}

function trailRestorationControlOutcome(control) {
  const plan = measuredOppositeDisplay(control?.prior?.computed);
  const checks = Object.freeze({
    baselineGreen: control?.baseline?.ok === true,
    measuredOpposite: plan.ok === true
      && control?.mutation?.requested === plan.replacement,
    mutationApplied: control?.mutation?.property?.value === plan.replacement
      && control?.mutation?.property?.priority === 'important'
      && control?.mutation?.computed === plan.replacement
      && control?.mutation?.computed !== plan.current,
    mutationRed: control?.mutation?.outcome?.ok === false,
    propertyRestored: exactOwnedStyleProperty(control?.prior, control?.restored?.property),
    computedRestored: control?.restored?.computed === plan.current,
    outcomeRestored: control?.restored?.outcome?.ok === true,
  });
  return { ok: Object.values(checks).every(Boolean), checks, plan };
}

function portraitBandControlOutcome(control) {
  const checks = Object.freeze({
    eligibleBaseline: portraitControlBaselineEligible(control?.baseline),
    mutationApplied: typeof control?.mutation?.requested === 'string'
      && control.mutation.requested.length > 0
      && typeof control?.mutation?.property?.value === 'string'
      && control.mutation.property.value.length > 0
      && control?.mutation?.property?.priority === 'important'
      && typeof control?.prior?.computed === 'string'
      && typeof control?.mutation?.computed === 'string'
      && control.mutation.computed !== control.prior.computed,
    collisionRed: control?.mutation?.outcome?.ok === false
      && control?.mutation?.outcome?.trailVisible === true
      && control?.mutation?.outcome?.fallback === false
      && Number.isFinite(control?.mutation?.outcome?.gap)
      && control.mutation.outcome.gap < 5.5,
    propertyRestored: exactOwnedStyleProperty(control?.prior, control?.restored?.property),
    computedRestored: control?.restored?.computed === control?.prior?.computed,
    outcomeRestored: portraitControlBaselineEligible(control?.restored?.outcome),
  });
  return { ok: Object.values(checks).every(Boolean), checks };
}

function portraitFallbackControlOutcome(control) {
  const baseSafe = Number(control?.mutation?.baseSafe);
  const forcedSafe = Number(control?.mutation?.forcedSafe);
  const computedSafe = Number.parseFloat(control?.mutation?.computed);
  const outcome = control?.mutation?.outcome;
  const side = outcome?.side;
  const usefulGeometry = outcome?.meaningful === true
    && Array.isArray(side) && side.length === 4
    && side.every(Number.isFinite) && side[3] - side[1] >= 71
    && Number.isFinite(outcome?.clientHeight) && outcome.clientHeight >= 68;
  const scrollAccessible = outcome?.scrollOk === true
    && Number.isFinite(outcome?.scrollHeight) && Number.isFinite(outcome?.clientHeight)
    && (outcome.scrollHeight <= outcome.clientHeight + 1
      || (/^(?:auto|scroll)$/.test(outcome?.overflowY || '')
        && outcome.scrollHeight > outcome.clientHeight));
  const fixedRows = outcome?.fixedRows;
  const fixedClearance = outcome?.fixedClear === true
    && Array.isArray(fixedRows) && fixedRows.length === 4
    && ['playerchip', 'hpbar', 'searchbox', 'objchip']
      .every((id) => fixedRows.some((row) => row?.id === id))
    && fixedRows.every((row) => row?.visible === false
      || (Number.isFinite(row?.gap) && row.gap >= 5.5));
  const checks = Object.freeze({
    eligibleBaseline: portraitControlBaselineEligible(control?.baseline),
    mutationApplied: typeof control?.mutation?.requested === 'string'
      && typeof control?.mutation?.property?.value === 'string'
      && control.mutation.property.value.length > 0
      && control?.mutation?.property?.priority === 'important'
      && Number.isFinite(baseSafe) && Number.isFinite(forcedSafe)
      && Number.isFinite(computedSafe) && forcedSafe > baseSafe
      && Math.abs(computedSafe - forcedSafe) < 0.01,
    tightPolicyObserved: outcome?.ok === true
      && outcome?.fallback === true
      && outcome?.trailDisplay === 'none',
    usefulGeometry,
    scrollAccessible,
    fixedClearance,
    propertyRestored: exactOwnedStyleProperty(control?.prior, control?.restored?.property),
    computedRestored: control?.restored?.computed === control?.prior?.computed,
    outcomeRestored: portraitControlBaselineEligible(control?.restored?.outcome),
  });
  return { ok: Object.values(checks).every(Boolean), checks };
}

function portraitControlCampaignOutcome({
  planned, observed, eligible, bandRuns, fallbackRuns, requireEligibleCampaign = true,
} = {}) {
  const countsValid = [planned, observed, eligible, bandRuns, fallbackRuns]
    .every((value) => Number.isSafeInteger(value) && value >= 0);
  const requirementValid = typeof requireEligibleCampaign === 'boolean';
  const required = countsValid && requirementValid && planned > 0;
  const controlsRequired = required && (requireEligibleCampaign || eligible > 0);
  const checks = Object.freeze({
    countsValid: countsValid && requirementValid,
    allBaselinesObserved: countsValid && observed === planned,
    eligibleWithinObserved: countsValid && eligible <= observed,
    eligibleBaselineObserved: countsValid
      && (!required || !requireEligibleCampaign || eligible > 0),
    controlsExecutedExactly: countsValid && (controlsRequired
      ? bandRuns === 1 && fallbackRuns === 1
      : bandRuns === 0 && fallbackRuns === 0),
  });
  return {
    ok: Object.values(checks).every(Boolean),
    required,
    requireEligibleCampaign,
    controlsRequired,
    checks,
  };
}

function toastAnchorControlOutcome(control) {
  const prior = control?.priorStyle, restored = control?.restoredStyle;
  const exactStyleBytes = (prior === null || typeof prior === 'string') && restored === prior;
  const rect = control?.mutated?.rect;
  const leftMutationLanded = Array.isArray(rect) && Number.isFinite(rect[0])
    && Math.abs(rect[0] - 12) <= 2;
  return {
    ok: control?.before?.ok === true && control?.mutated?.ok === false
      && leftMutationLanded && exactStyleBytes && control?.restored?.ok === true,
    exactStyleBytes, leftMutationLanded,
  };
}

async function main() {
  if (selftestOnly) {
    await reportSelftest();
    return;
  }
  if (selectedVerifyRunId) {
    assertEvidenceRunId(selectedVerifyRunId, 'Glass');
    assertEvidenceRunId(selectedSliceRunId, 'Slice');
    const currentSource = sourceIdentity();
    if (currentSource.state !== 'committed') {
      throw new Error(`Glass verification requires clean committed source, observed ${JSON.stringify(currentSource.state)}`);
    }
    const sliceVerification = verifySliceRunEvidence(selectedSliceRunId, {
      expectedSource: currentSource, requirePass: true, requireCommitted: true,
      expectedAssuranceProfile: selectedAssuranceProfile, allowLegacyV1: false,
    });
    if (!sliceVerification.ok) throw new Error(`selected Slice predecessor failed verification: ${sliceVerification.errors.join('; ')}`);
    const sliceDescriptor = slicePredecessorDescriptor(sliceVerification);
    const glassVerification = verifyGlassRunEvidence(selectedVerifyRunId, {
      expectedSource: currentSource, expectedSlice: sliceDescriptor, requirePass: true,
    });
    if (!glassVerification.ok) throw new Error(`selected Glass run failed verification: ${glassVerification.errors.join('; ')}`);
    console.log(`GLASS MATRIX VERIFY: PASS — ${selectedVerifyRunId}`);
    console.log(`report sha256: ${glassVerification.reportSha256}`);
    console.log(`Slice predecessor: ${selectedSliceRunId} ${sliceDescriptor.reportSha256}`);
    console.log(`assurance profile: ${sliceDescriptor.assuranceProfile}`);
    return;
  }
  /* Reject an obsolete bare full-matrix invocation before taking the shared
     lock or publishing a running sentinel. A caller error must not replace a
     previously terminal current pointer or reserve an immutable run ID. */
  if (!viewportLabel) {
    if (!selectedSliceRunId) {
      throw new Error('full certifying Glass requires --slice-run=<immutable-Slice-run-id>');
    }
    if (!selectedAssuranceProfile) {
      throw new Error('full certifying Glass requires --profile=develop|production');
    }
    assertEvidenceRunId(selectedSliceRunId, 'Slice');
  }
  const hostileCompendiumRows = MATRIX_VIEWPORTS.some((vp) => vp.label === 'phone-landscape')
    ? buildCompendiumFixture().rows.slice(0, 21).map(([, entry], index) => {
      const fixtureId = `glass-hostile-${String(index).padStart(2, '0')}`;
      const stress = index === 10
        ? 'UnbrokenGenomeIdentityCarrier'.repeat(2)
        : `variable-height wrapped origin evidence ${'continuation '.repeat(index % 3 + 1)}`;
      return [fixtureId, {
        ...entry,
        id: fixtureId,
        name: index === 0 ? 'First A++ geometry row'
          : index === 10 ? `Middle A++ geometry row ${stress}`
            : index === 20 ? 'Last A++ geometry row with a wrapped provenance tail'
              : `A++ geometry row ${String(index).padStart(2, '0')} ${stress}`,
        from: index === 10 ? 'Hostile provenance '.repeat(2)
          : index === 20 ? 'Last reachable source with variable-height evidence'
            : `Wrapped source ${index} ${'lineage '.repeat(index % 4 + 1)}`,
      }];
    })
    : [];
  runReloadEvidence = [];
  runViewportTimings = [];
  runArc4CaptureOutcomes = [];
  runPredecessors = null;
  runEndingSource = null;
  runArtifactReserved = false;
  const releaseLock = acquireWorkspaceLock('v2 responsive glass matrix');
  try {
    runSource = sourceIdentity();
    if (!/^[0-9a-f]{40}$/.test(runSource.commit || '') || !runSource.branch) {
      throw new Error(`source identity unavailable: ${JSON.stringify(runSource)}`);
    }
    if (!viewportLabel) {
      if (runSource.state !== 'committed') {
        throw new Error(`full certifying Glass requires clean committed source, observed ${JSON.stringify(runSource.state)}`);
      }
      const sliceVerification = verifySliceRunEvidence(selectedSliceRunId, {
        expectedSource: runSource, requirePass: true, requireCommitted: true,
        expectedAssuranceProfile: selectedAssuranceProfile, allowLegacyV1: false,
      });
      if (!sliceVerification.ok) {
        throw new Error(`selected Slice predecessor failed verification: ${sliceVerification.errors.join('; ')}`);
      }
      runPredecessors = { slice: slicePredecessorDescriptor(sliceVerification) };
    }
    const artifacts = glassArtifactPaths(activeGlassRunId);
    const sentinel = runningGlassReport({
      runId: activeGlassRunId, source: runSource, predecessor: runPredecessors?.slice || null,
    });
    atomicCreateFile(artifacts.report, JSON.stringify(sentinel, null, 2) + '\n');
    runArtifactReserved = true;
    atomicWriteJson(currentReportPath, sentinel);
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
  const causalInstrumentState = { error: null };
  const portraitViewportCount = MATRIX_VIEWPORTS
    .filter((viewport) => viewport.width <= 900 && viewport.width <= viewport.height).length;
  let portraitBaselineCount = 0, portraitEligibleBaselineCount = 0;
  let portraitBandControlCount = 0, portraitFallbackControlCount = 0;
  let causalControlsArmed = false;
  let targetedProductFailure = false;
  let causalProductStop = null;
  const stopInstrumentControl = (message) => {
    stopAtFirstGlassInstrumentFailure(causalInstrumentState, instrumentFailures, message);
  };
  const recordInstrumentFailure = (message) => {
    return recordGlassInstrumentFailure(
      causalInstrumentState, instrumentFailures, message, causalControlsArmed,
    );
  };
  const recordControls = (...names) => {
    if (causalControlsArmed && instrumentFailures.length) {
      stopInstrumentControl(instrumentFailures[0]);
    }
    for (const name of names) {
      if (!NEGATIVE_CONTROLS.includes(name)) throw new Error(`unknown negative control ${JSON.stringify(name)}`);
      executedControls.add(name);
      productBlockedControls.delete(name);
    }
  };
  for (const failure of await reloadPhaseSelftest()) {
    recordInstrumentFailure(`RELOAD PHASE SELFTEST ${failure}`);
  }
  for (const failure of settingsAudioEvidenceSelftest()) {
    recordInstrumentFailure(`SETTINGS AUDIO SELFTEST ${failure}`);
  }
  for (const failure of hostileCompendiumRevealSelftest()) {
    recordInstrumentFailure(`COMPENDIUM REVEAL SELFTEST ${failure}`);
  }
  recordControls(
    'replacement-document-loader-token-phase', 'import-phase-sequence',
    'replacement-ticker-quiescence', 'replacement-boot-phase-sequence',
    'reload-resource-release', 'reload-audio-release', 'ready-confirmation-heartbeat',
    'ready-confirmation-ticker-progress', 'ultra-viewport-render-budget',
    'settings-creature-voice-control', 'settings-audio-non-replay',
  );
  let controlsRun = false, hpControlRun = false, settingsWidthControlRun = false,
    planetsideControlRun = false, panelPlanetsideControlRun = false,
    closeIntegrityControlRun = false, toastAnchorControlRun = false,
    settingsAnchorControlRun = false, recordsAnchorObserved = false,
    settingsCloseClearanceControlRun = false, rarityContrastControlRun = false,
    chromeYieldControlRun = false, chromeRestoreControlRun = false, chromeLandscapeControlRun = false,
    objectiveYieldControlRun = false, topChromeControlRun = false, portraitBandControlRun = false,
    portraitFallbackControlRun = false,
    modalControlRun = false, modalLiveControlRun = false, closeLabelControlRun = false,
    hiddenOpenerControlRun = false, reloadBindingControlRun = false,
    releaseDetailControlRun = false, releaseTailControlRun = false, phoneDockControlRun = false,
    shipyardControlRun = false, inventoryControlRun = false, arc4CaptureControlRun = false,
    orbitalSurveyControlRun = false, orbitalContainmentControlRun = false;
  const settingsAudioBaselineViewports = new Set();
  const settingsAudioCompletedViewports = new Set();
  const settingsAudioProductBlockedViewports = new Set();
  const add = (viewport, surface, rows) => collectGlassProductRows(
    findings, viewport, surface, rows, causalControlsArmed,
  );
  const addOutcome = (viewport, surface, code, element, outcome, expected) => collectGlassProductOutcome(
    findings, viewport, surface, code, element, outcome, expected, causalControlsArmed,
  );
  const addArc4Outcome = (viewport, surface, code, element, outcome, expected) => {
    runArc4CaptureOutcomes.push(arc4CaptureOutcomeReportRow({
      viewport, surface, code, outcome,
    }));
    addOutcome(viewport, surface, code, element, outcome, expected);
    stopAfterRecordedProductOutcome(viewport, surface, code, element, outcome, expected);
  };
  const arc4Controls = arc4GlassSelftest();
  if (!arc4Controls.ok) {
    recordInstrumentFailure(`ARC 4 GLASS SELFTEST ${JSON.stringify(arc4Controls)}`);
  } else {
    arc4CaptureControlRun = true;
    recordControls(
      'arc4-capture-full-pool-copy', 'arc4-capture-model-disabled-parity',
      'arc4-capture-earth-title', 'arc4-capture-roster-counts',
      'arc4-capture-roster-fingerprint', 'arc4-capture-yield',
      'arc4-capture-tame-odds', 'arc4-capture-scavenge-odds',
      'arc4-capture-sample-odds',
      'arc4-capture-native-survey-return', 'arc4-capture-ownership-mutation',
      'arc4-capture-session-rng-mutation', 'arc4-capture-receipt-mutation',
      'arc4-capture-epoch-mutation', 'arc4-capture-v4-counter-mutation',
      'arc4-capture-native-activation', 'arc4-capture-control-overlap',
    );
  }
  let causalInstrumentStop = null;
  try {
    causalControlsArmed = true;
    if (instrumentFailures.length) stopInstrumentControl(instrumentFailures[0]);
    try {
    for (const vp of MATRIX_VIEWPORTS) {
      if (instrumentFailures.length) stopInstrumentControl(instrumentFailures[0]);
      /* Per-row wall-clock ownership. CI runs this instrument ~20× slower
         than a workstation (software raster, two cores); without per-row
         timing that cost is unattributable and any future shard split would
         be guessed, not measured. Recorded in the finally so red rows are
         timed too; writeReport validates the evidence per scope/status. */
      const viewportStartedAt = Date.now();
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
            recordInstrumentFailure(`${vp.label}: Chromium could not apply the required real safe-area override (${error.message})`);
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
          recordInstrumentFailure(`${vp.label}: slice did not become ready (${ready?.why || 'no diagnostic'})`);
          continue;
        }
        await evalIn(`(${installAuditHarness.toString()})()`);
        const audit = (options) => evalIn(`window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(options)})`);
        const waitFor = async (label, expression, timeoutMs = 5000, accept = (value) => !!value) => {
          const until = Date.now() + timeoutMs;
          let last = null;
          while (Date.now() < until) {
            last = await evalIn(expression);
            if (accept(last)) return last;
            await sleep(50);
          }
          throw new Error(`${vp.label}/${label}: outcome did not arrive within ${timeoutMs}ms (last ${JSON.stringify(last)})`);
        };
        const readSettledArc4Durable = async (label) => {
          let prior = await evalIn(ARC4_DURABLE_READ_EXPRESSION);
          let priorFingerprint = arc4DurableFingerprint(prior);
          for (let attempt = 0; attempt < 8; attempt++) {
            await sleep(50);
            const current = await evalIn(ARC4_DURABLE_READ_EXPRESSION);
            const fingerprint = arc4DurableFingerprint(current);
            if (typeof fingerprint === 'string' && fingerprint === priorFingerprint) {
              return { settled: true, fingerprint, raw: current, attempts: attempt + 2 };
            }
            prior = current;
            priorFingerprint = fingerprint;
          }
          return { settled: false, fingerprint: priorFingerprint, raw: prior, label, attempts: 9 };
        };
        const pressEscape = async () => {
          const key = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 };
          await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...key }, session);
          await send('Input.dispatchKeyEvent', { type: 'keyUp', ...key }, session);
        };
        const pressTab = async (shift = false) => {
          const key = { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9,
            ...(shift ? { modifiers: 8 } : {}) };
          await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...key }, session);
          await send('Input.dispatchKeyEvent', { type: 'keyUp', ...key }, session);
        };
        const activateRealKeyboardControl = async (selector, label) => {
          const target = await evalIn(`(()=>{const target=document.querySelector(${JSON.stringify(selector)}),
            rect=target?.getBoundingClientRect(),style=target?getComputedStyle(target):null;
            window.__cfGlassEngineeringKeyReceipt=null;window.__cfGlassEngineeringKeyAbort?.abort();
            const controller=new AbortController();window.__cfGlassEngineeringKeyAbort=controller;
            document.addEventListener('keydown',(event)=>{if(event.target!==target)return;
              window.__cfGlassEngineeringKeyReceipt={key:event.key,code:event.code,trusted:event.isTrusted===true,
                tag:target?.tagName||null,focusKey:target?.getAttribute?.('data-focus-key')||null,
                surveyClose:target?.hasAttribute?.('data-survey-close')===true};},
              {capture:true,once:true,signal:controller.signal});target?.focus();return {
                ok:!!target&&style?.display!=='none'&&style?.visibility!=='hidden'&&!!rect
                  &&rect.width>0&&rect.height>=44&&document.activeElement===target,
                tag:target?.tagName||null,focusKey:target?.getAttribute?.('data-focus-key')||null,
                surveyClose:target?.hasAttribute?.('data-survey-close')===true,
                accessibleName:(target?.getAttribute?.('aria-label')||target?.textContent||'').trim(),
                rect:rect?[rect.left,rect.top,rect.right,rect.bottom]:null};})()`);
          if (!target.ok) return { ok: false, why: `${label} is not one focused visible 44px control`, target, receipt: null };
          const key = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 };
          await send('Input.dispatchKeyEvent', {
            type: 'keyDown', ...key, text: '\r', unmodifiedText: '\r',
          }, session);
          await send('Input.dispatchKeyEvent', { type: 'keyUp', ...key }, session);
          await sleep(40);
          const receipt = await evalIn(`(()=>{const value=window.__cfGlassEngineeringKeyReceipt||null;
            window.__cfGlassEngineeringKeyAbort?.abort();delete window.__cfGlassEngineeringKeyAbort;
            delete window.__cfGlassEngineeringKeyReceipt;return value;})()`);
          return { ok: receipt?.trusted === true && receipt?.key === 'Enter'
            && receipt?.code === 'Enter' && receipt?.tag === target.tag
            && receipt?.focusKey === target.focusKey
            && receipt?.surveyClose === target.surveyClose, target, receipt };
        };
        /* Engineering/Shipyard is a real Arc 3 route. Preserve an input
           receipt for its opener and Close rather than using the panel helper's
           programmatic click: visible DOM plus a direct API toggle can agree
           while the player-facing button is covered or unwired. */
        const activateRealControl = async (selector, label, options = {}) => {
          const dispatchAllowed = options?.dispatch !== false;
          const expectedDocumentToken = typeof options?.expectedDocumentToken === 'string'
            ? options.expectedDocumentToken : null;
          const target = await evalIn(`(()=>{ const button=document.querySelector(${JSON.stringify(selector)}),
            rect=button?.getBoundingClientRect(),style=button?getComputedStyle(button):null,
            x=rect?(rect.left+rect.right)/2:NaN,y=rect?(rect.top+rect.bottom)/2:NaN,
            hit=rect?document.elementFromPoint(x,y):null,
            documentToken=window.__CF_SLICE__?.documentToken??null,
            documentOwned=${JSON.stringify(expectedDocumentToken)}===null
              ||documentToken===${JSON.stringify(expectedDocumentToken)};
            window.__cfGlassShipyardReceipt=null;window.__cfGlassShipyardReceiptAbort?.abort();
            const opacity=Number(style?.opacity),visible=!!button&&style?.display!=='none'
              &&style?.visibility!=='hidden'&&Number.isFinite(opacity)&&opacity>0,
              ok=documentOwned&&visible&&rect.width>=44&&rect.height>=44&&!!hit
                &&(hit===button||button.contains(hit));
            delete window.__cfGlassShipyardReceiptAbort;
            if(ok&&${JSON.stringify(dispatchAllowed)}){const controller=new AbortController();window.__cfGlassShipyardReceiptAbort=controller;
              document.addEventListener('pointerdown',(event)=>{const node=event.target instanceof Element?event.target:null;
                window.__cfGlassShipyardReceipt={buttonId:node?.closest('button')?.id||null,
                  pointerType:event.pointerType||null,trusted:event.isTrusted===true,x:event.clientX,y:event.clientY};
                window.__cfGlassShipyardReceiptAbort=null;},{capture:true,once:true,signal:controller.signal});}
            return {ok,
              id:button?.id||null,x,y,rect:rect?[rect.left,rect.top,rect.right,rect.bottom]:null,
              visible,opacity,hit:hit?.id||hit?.tagName||null,
              hitButtonId:hit?.closest?.('button')?.id??null,
              documentToken,documentOwned,
              receiptListenerArmed:'__cfGlassShipyardReceiptAbort' in window};})()`);
          if (!target.ok || !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
            return { ok: false, inputDispatched: false,
              why: `${label} is not a visible 44px centre-owned control`, target, receipt: null };
          }
          if (!dispatchAllowed) {
            return { ok: false, inputDispatched: false, dispatchRefused: true,
              why: `${label} is reachable but input dispatch is disabled`, target, receipt: null };
          }
          if (vp.mobile) {
            await send('Input.dispatchTouchEvent', {
              type: 'touchStart', touchPoints: [{ x: target.x, y: target.y, id: 1 }],
            }, session);
            await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }, session);
          } else {
            await send('Input.dispatchMouseEvent', {
              type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1,
            }, session);
            await send('Input.dispatchMouseEvent', {
              type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1,
            }, session);
          }
          await sleep(40);
          const receipt = await evalIn(`(()=>{const value=window.__cfGlassShipyardReceipt||null;
            window.__cfGlassShipyardReceiptAbort?.abort();delete window.__cfGlassShipyardReceiptAbort;
            delete window.__cfGlassShipyardReceipt;return value;})()`);
          return {
            ok: receipt?.buttonId === target.id && receipt?.trusted === true
              && receipt.pointerType === (vp.mobile ? 'touch' : 'mouse'),
            inputDispatched: true, target, receipt,
          };
        };
        const activateRealSettingsControl = async (selector, label) => {
          const expectedId = selector.startsWith('#') ? selector.slice(1) : null;
          let prior = null, prepared = null, activation = null, restoration = null;
          let priorError = null, preparedError = null, activationError = null;
          let cleanupError = null, restorationError = null, dispatchRequested = false;
          try {
            try {
              prior = await evalIn(`(()=>{const panel=document.getElementById('setpanel');
                if(!(panel instanceof HTMLElement))return null;
                return {left:panel.scrollLeft,top:panel.scrollTop,docLeft:scrollX,docTop:scrollY};})()`);
              if (!prior) priorError = 'Settings panel/prior scroll authority missing';
            } catch (cause) { priorError = String(cause?.message || cause); }
            if (prior) {
              try {
                prepared = await evalIn(`(async()=>{const wait=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0))),
                  owner=(node)=>node?(node.id?'#'+node.id:(node.getAttribute?.('data-pnx')?'[data-pnx="'+node.getAttribute('data-pnx')+'"]':node.tagName||null)):null,
                  box=(rect)=>rect?{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height}:null,
                  tokens=new WeakMap();let nextToken=1;
                  const token=(node)=>{if(!(node instanceof Element))return null;
                    if(!tokens.has(node))tokens.set(node,nextToken++);return tokens.get(node);},
                  snap=()=>{const panel=document.getElementById('setpanel'),button=document.querySelector(${JSON.stringify(selector)}),
                    close=panel?.querySelector(':scope > [data-pnx="set"]')??null,
                    nodeEvidence={panelNodeToken:token(panel),controlNodeToken:token(button),closeNodeToken:token(close)};
                    if(!(button instanceof HTMLButtonElement)||!(panel instanceof HTMLElement))return {
                      observed:true,exists:false,id:${JSON.stringify(expectedId)},panelExists:panel instanceof HTMLElement,...nodeEvidence,
                      panelRect:panel instanceof HTMLElement?box(panel.getBoundingClientRect()):null,
                      panelScroll:{left:panel?.scrollLeft??0,top:panel?.scrollTop??0},documentScroll:{left:scrollX,top:scrollY}};
                    const rect=button.getBoundingClientRect(),panelRect=panel.getBoundingClientRect(),
                    closeRect=close?.getBoundingClientRect?.()??null,style=getComputedStyle(button),
                    boundsRect={left:Math.max(0,panelRect.left),top:Math.max(0,panelRect.top),
                      right:Math.min(innerWidth,panelRect.right),bottom:Math.min(innerHeight,panelRect.bottom)},
                    bounds={...boundsRect,width:boundsRect.right-boundsRect.left,height:boundsRect.bottom-boundsRect.top},
                    x=(rect.left+rect.right)/2,y=(rect.top+rect.bottom)/2,hit=document.elementFromPoint(x,y);
                    return {observed:true,exists:true,id:button.id,...nodeEvidence,
                      visible:style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&rect.width>0&&rect.height>0,
                      rect:box(rect),panelRect:box(panelRect),bounds,closeRect:box(closeRect),
                      panelScroll:{left:panel.scrollLeft,top:panel.scrollTop},documentScroll:{left:scrollX,top:scrollY},
                      hitOwner:owner(hit),hitButtonId:hit?.closest?.('button')?.id??null};};
                  document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
                  await wait();await wait();
                  const first=snap();await wait();const second=snap();return {...second,first,second};})()`);
              } catch (cause) { preparedError = String(cause?.message || cause); }
              const canDispatch = settingsPreparedControlCanDispatch(prepared, expectedId);
              if (canDispatch) {
                dispatchRequested = true;
                try { activation = await activateRealControl(selector, label); }
                catch (cause) { activationError = String(cause?.message || cause); }
              }
            }
          } finally {
            try {
              await evalIn(`(()=>{window.__cfGlassShipyardReceiptAbort?.abort();
                delete window.__cfGlassShipyardReceiptAbort;delete window.__cfGlassShipyardReceipt;return true;})()`);
            } catch (cause) { cleanupError = String(cause?.message || cause); }
            if (prior) {
              try {
                restoration = await evalIn(`(async()=>{const panel=document.getElementById('setpanel'),
                  expected=${JSON.stringify(prior)},wait=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
                  if(!(panel instanceof HTMLElement))return {expected,actual:null};
                  panel.scrollLeft=expected.left;panel.scrollTop=expected.top;scrollTo(expected.docLeft,expected.docTop);
                  await wait();await wait();return {expected,
                    actual:{left:panel.scrollLeft,top:panel.scrollTop,docLeft:scrollX,docTop:scrollY}};})()`);
              } catch (cause) { restorationError = String(cause?.message || cause); }
            } else {
              restorationError = 'Settings restoration authority missing';
            }
          }
          const evidence = {
            prior,
            prepared,
            activation,
            restoration,
            dispatchRequested,
            priorError,
            preparedError,
            activationError,
            cleanupError,
            restorationError,
          };
          return settingsNativeActivationOutcome(evidence, {
            id: expectedId,
            pointerType: vp.mobile ? 'touch' : 'mouse',
          });
        };
        /* Geometry/state predicates are product outcomes, while target
           starvation and browser transport loss are distinct failures. Poll
           through a short exact-context command paired with a root-browser
           heartbeat. Answerable false state is returned to addOutcome;
           heartbeat-proven target starvation becomes a product liveness
           finding; heartbeat loss remains instrument/transport failure. */
        const observeOutcome = async (expression, accept, executionContextId, timeoutMs, {
          cycle = 0, postRenderPriority = null, singleAttempt = false,
          productFinding = null,
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
                const finding = productFinding ?? {
                  code: 'ULTRA_VIEWPORT_RESIZE_UNANSWERABLE',
                  surface: 'ultra-same-backing-resize', element: 'canvas',
                  expected: 'the same-backing viewport transition remains externally answerable within the bounded target command while the browser process is responsive',
                };
                throw new ProductAnswerabilityFinding(
                  `${vp.label}: product outcome target was unanswerable while the browser process remained responsive (${probe.why})`,
                  evidence,
                  finding,
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
          if (trainingFocusControl.ok) recordInstrumentFailure(`${vp.label}: offscreen Training-focus injection stayed green (${JSON.stringify(trainingFocusControl)})`);
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
        /* D-TRAIN completion no longer fabricates Cosmos for a loaded,
           unfinished save with no checkpoint. It source-seats Sol, commits
           that exact route, and restores canvas focus with one selected
           keyboard target. Drive the real focus law before the matrix's
           universe surfaces: release that target without redrawing, then
           ascend twice with strictly newer draw-tail receipts. */
        const skipSol = await waitFor('skip training at proven Sol', `(()=>{ const s=window.__CF_SLICE__.api.state(),r=s.renderedScene,c=document.querySelector('canvas');
          return !s.tutActive&&s.tutDone&&!document.getElementById('tutcard')
            &&s.trainingRestoreWitness?.stage==='released'&&s.trainingRestoreWitness?.error===null
            &&s.mode==='system'&&s.gal===999&&s.galX===90&&s.galY===-60&&s.galSize===78
            &&s.star===424242&&s.starX===560&&s.starY===170&&s.planet===null
            &&typeof s.navGalaxyKey==='string'&&s.navGalaxyKey.length>0
            &&typeof s.navStarKey==='string'&&s.navStarKey.length>0&&s.navWorldKey===null
            &&r?.serial>0&&r.mode==='system'&&r.galaxyKey===s.navGalaxyKey
            &&r.starKey===s.navStarKey&&r.worldKey===null
            &&document.activeElement===c&&s.keyboardTarget!==null?s:null; })()`);
        await pressEscape();
        const releasedSolTarget = await waitFor('release post-Training Sol target', `(()=>{ const s=window.__CF_SLICE__.api.state(),r=s.renderedScene,c=document.querySelector('canvas');
          return s.mode==='system'&&s.gal===999&&s.galX===90&&s.galY===-60&&s.galSize===78
            &&s.star===424242&&s.starX===560&&s.starY===170&&s.planet===null
            &&typeof s.navGalaxyKey==='string'&&s.navGalaxyKey.length>0
            &&typeof s.navStarKey==='string'&&s.navStarKey.length>0&&s.navWorldKey===null
            &&r?.serial===${skipSol.renderedScene.serial}&&r.mode==='system'
            &&r.galaxyKey===s.navGalaxyKey&&r.starKey===s.navStarKey&&r.worldKey===null
            &&document.activeElement===c&&s.keyboardTarget===null?s:null; })()`);
        await pressEscape();
        const matrixGalaxy = await waitFor('post-Training Sol to home-galaxy ascent', `(()=>{ const s=window.__CF_SLICE__.api.state(),r=s.renderedScene;
          return s.mode==='galaxy'&&s.gal===999&&s.galX===90&&s.galY===-60&&s.galSize===78
            &&s.star===null&&s.planet===null&&typeof s.navGalaxyKey==='string'&&s.navGalaxyKey.length>0
            &&s.navStarKey===null&&s.navWorldKey===null&&r?.serial>${releasedSolTarget.renderedScene.serial}
            &&r.mode==='galaxy'&&r.galaxyKey===s.navGalaxyKey&&r.starKey===null&&r.worldKey===null?s:null; })()`);
        await pressEscape();
        await waitFor('post-Training home-galaxy to universe ascent', `(()=>{ const s=window.__CF_SLICE__.api.state(),r=s.renderedScene;
          return s.mode==='universe'&&s.gal===null&&s.star===null&&s.planet===null
            &&s.navGalaxyKey===null&&s.navStarKey===null&&s.navWorldKey===null
            &&s.trail==='Cosmos'&&r?.serial>${matrixGalaxy.renderedScene.serial}
            &&r.mode==='universe'&&r.galaxyKey===null&&r.starKey===null&&r.worldKey===null?s:null; })()`);
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
              recordInstrumentFailure(`${vp.label}: same-backing resize injection stayed green (${JSON.stringify({ staleGeometryControl, staleEventControl, staleBackdropControl, transitionPeakControl, transitionUnderreportControl, transitionInflatedBudgetControl, stoppedTickerControl, staleTickerControl, missingPointerControl, offsetPointerControl })})`);
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
            recordInstrumentFailure(`${vp.label}: same-backing resize controls did not discriminate from green positive baselines`);
          }
        }

        /* Synthetic controls must run outside Training's real focus scope.
           Running them on the welcome lesson makes the product correctly
           redirect their focus and turns the instrument red for the wrong
           reason. The real Training surface is audited above before Skip. */
        if (!controlsRun) {
          controlsRun = true;
          const controlFailures = await evalIn('window.__CF_GLASS_AUDIT__.selftest()');
          for (const failure of controlFailures) recordInstrumentFailure('SELFTEST ' + failure);
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
            recordInstrumentFailure(`SELFTEST canvas baseline was already red (${JSON.stringify(canvasBaseline)})`);
          }
          const canvasControl = await evalIn(`(()=>{ const canvas=document.querySelector('canvas'),prior=[canvas.style.width,canvas.style.height]; canvas.style.width=Math.max(100,innerWidth/2)+'px';const out=window.__CF_GLASS_AUDIT__.canvasIssues('selftest',${expectedDpr},${maxBackingPixels});canvas.style.width=prior[0];canvas.style.height=prior[1];return out;})()`);
          if (!canvasControl.some((row) => row.code === 'CANVAS_CSS_VIEWPORT')) recordInstrumentFailure('SELFTEST injected narrow CSS canvas was accepted');
          if (!canvasControl.some((row) => row.code === 'CANVAS_DPR_DRIFT')) recordInstrumentFailure('SELFTEST injected backing/CSS density drift was accepted');
          recordControls('canvas-css-fit', 'canvas-backing-density');
          const backingControl = await evalIn(`(()=>{ const c=document.querySelector('canvas'); return window.__CF_GLASS_AUDIT__.canvasIssues('selftest',window.__CF_SLICE__.api.state().rendererDpr,c.width*c.height-1); })()`);
          if (!backingControl.some((row) => row.code === 'CANVAS_BACKING_PIXEL_CEILING')) recordInstrumentFailure('SELFTEST injected backing-pixel ceiling was accepted');
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
        if (vp.width <= 900) {
          const phoneDockCheck = `(()=>{const dock=document.getElementById('dock'),style=dock?getComputedStyle(dock):null,
            rect=dock?.getBoundingClientRect(),expected=['docksurvey','dockcodex','dockrecords','dockcharters','dockatlas','dockcharts','dockshipyard','dockinventory','docksets','dockguide'],
            buttons=dock?[...dock.querySelectorAll(':scope > button')].filter(button=>{const s=getComputedStyle(button),r=button.getBoundingClientRect();
              return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}):[],rows=[];
            for(const button of buttons){const r=button.getBoundingClientRect();let row=rows.find(candidate=>Math.abs(candidate.top-r.top)<2);
              if(!row){row={top:r.top,ids:[]};rows.push(row);}row.ids.push(button.id);}
            rows.sort((a,b)=>a.top-b.top);const ids=buttons.map(button=>button.id),centres=buttons.map(button=>{const r=button.getBoundingClientRect(),
              hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);return {id:button.id,width:r.width,height:r.height,
                hit:!!hit&&(hit===button||button.contains(hit))};});
            return {ok:style?.display==='grid'&&buttons.length===10&&JSON.stringify(ids)===JSON.stringify(expected)
              &&rows.length===2&&rows[0].ids.length===5&&rows[1].ids.length===5
              &&!!rect&&Math.abs(rect.width-260)<=1&&Math.abs(rect.height-98)<=1
              &&centres.every(row=>Math.abs(row.width-44)<=1&&Math.abs(row.height-44)<=1&&row.hit),
              display:style?.display||null,ids,expected,rows:rows.map(row=>row.ids),
              rect:rect?[rect.left,rect.top,rect.right,rect.bottom]:null,centres};})()`;
          addOutcome(vp.label, 'phone-dock', 'PHONE_DOCK_INVENTORY', '#dock', await evalIn(phoneDockCheck),
            'the exact ten visible named controls occupy one 260x98 five-by-two grid of centre-owned 44px targets');
          if (!phoneDockControlRun) {
            phoneDockControlRun = true;
            const dockControl = await evalIn(`(()=>{const dock=document.getElementById('dock'),prior=dock?.getAttribute('style')??null;
              dock?.style.setProperty('grid-template-columns','repeat(4,44px)','important');const broken=${phoneDockCheck};
              if(prior===null)dock?.removeAttribute('style');else dock?.setAttribute('style',prior);
              return {ok:broken.ok===false&&broken.rows.length===3&&${phoneDockCheck}.ok,broken};})()`);
            if (!dockControl.ok) {
              recordInstrumentFailure(`${vp.label}: phone dock 4-column control stayed green or failed to restore (${JSON.stringify(dockControl)})`);
            }
            recordControls('phone-dock-inventory');
            const membershipControl = await evalIn(`(()=>{const button=document.getElementById('dockinventory'),prior=button?.id||null;
              if(button)button.id='dockinventory-substitution';const broken=${phoneDockCheck};if(button&&prior)button.id=prior;
              const restored=${phoneDockCheck};return {ok:broken.ok===false&&broken.ids.length===10
                &&broken.ids.includes('dockinventory-substitution')&&!broken.ids.includes('dockinventory')&&restored.ok,broken,restored};})()`);
            if (!membershipControl.ok) {
              recordInstrumentFailure(`${vp.label}: substituted Inventory dock member stayed green or failed to restore (${JSON.stringify(membershipControl)})`);
            }
            recordControls('phone-dock-exact-membership');
          }
        }
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
          if (hpControl.ok) recordInstrumentFailure(`${vp.label}: HP dual-background contrast injection stayed green (${JSON.stringify(hpControl)})`);
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
            recordGlassProductFinding(findings, vp.label, 'keyboard-canvas',
              { code: 'KEYBOARD_TARGET_NOT_RENDERED', surface: 'keyboard-canvas', element: 'canvas', actual: keyboardStart, expected: 'focus + Arrow selects and visibly/verbally announces a world target' }, causalControlsArmed);
          }
          const keyboardSurvey = await evalIn(`(()=>{ const before=window.__CF_SLICE__.api.state(); const canvas=document.querySelector('canvas'); canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})); const after=window.__CF_SLICE__.api.state(); return {beforeTarget:before.keyboardTarget,cardOpen:after.cardOpen,cardTitle:after.cardTitle,focus:document.activeElement?.getAttribute('data-act')||document.activeElement?.id||document.activeElement?.tagName}; })()`);
          if (!keyboardSurvey.beforeTarget || !keyboardSurvey.cardOpen || !keyboardSurvey.cardTitle || keyboardSurvey.focus !== 'travel') {
            recordGlassProductFinding(findings, vp.label, 'keyboard-canvas',
              { code: 'KEYBOARD_ENTER_OUTCOME', surface: 'keyboard-canvas', element: 'canvas', actual: keyboardSurvey, expected: 'Enter opens selected survey and focuses its real travel action' }, causalControlsArmed);
          }
          await evalIn(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})); document.getElementById('searchbox')?.blur()`);
        }

        /* A real source-proven Charter rejection populates the toast; it
           must not be a forged star that F2 rejects before reach policy or
           an empty fixture that collapses away from the geometry under test.
           This deterministic fine-layer star is outside stage 0/1 reach. */
        /* toast() intentionally ignores the first 1.8 seconds of a document;
           wait past that product rule instead of calling a helper directly. */
        await sleep(1900);
        const homeDescent = await evalIn(`(()=>{ const S=window.__CF_SLICE__,before=S.api.state(),r=before.renderedScene;
          /* The 8K same-backing resize can cross the universe auto-dive
             threshold while it proves live renderer answerability. Accept
             that setup only when it already reached the exact, provenance-
             keyed home galaxy with an agreeing draw-tail receipt. */
          const alreadyHome=before.mode==='galaxy'&&before.gal===999&&before.galX===90&&before.galY===-60
            &&before.galSize===78&&before.star===null&&before.planet===null
            &&before.navGalaxyKey==='CF1|g:999@90,-60'
            &&before.navStarKey===null&&before.navWorldKey===null&&r?.serial>0&&r.mode==='galaxy'
            &&r.galaxyKey===before.navGalaxyKey&&r.starKey===null&&r.worldKey===null;
          const accepted=alreadyHome||S.api.descendGalaxy({seed:999,x:90,y:-60});
          return {alreadyHome,accepted,beforeReceipt:r??null,state:S.api.state()}; })()`);
        let homeRouteWaitError = null;
        try {
          await waitFor('home galaxy Charter source receipt', `(()=>{const s=window.__CF_SLICE__.api.state(),r=s.renderedScene;
            return s.mode==='galaxy'&&s.gal===999&&s.galX===90&&s.galY===-60&&s.galSize===78
              &&s.star===null&&s.planet===null&&s.navGalaxyKey==='CF1|g:999@90,-60'
              &&s.navStarKey===null&&s.navWorldKey===null&&r?.serial>0&&r.mode==='galaxy'
              &&r.galaxyKey===s.navGalaxyKey&&r.starKey===null&&r.worldKey===null?s:null})()`);
        } catch (error) {
          homeRouteWaitError = error.message;
          recordInstrumentFailure(error.message);
        }
        const homeRoute = await evalIn('window.__CF_SLICE__.api.state()');
        const blocked = await evalIn(`(()=>{ const S=window.__CF_SLICE__,before=S.api.state(),receipt=before.renderedScene,
          accepted=S.api.descendSystem({seed:1664319693,x:-164.45360307302326,y:-117.94395204260945});
          return {accepted,beforeSerial:before.toastSerial,receipt,state:S.api.state()}; })()`);
        const receiptBound = blocked.receipt?.serial > 0
          && blocked.receipt.serial === homeRoute.renderedScene?.serial
          && blocked.receipt.mode === 'galaxy' && blocked.receipt.galaxyKey === 'CF1|g:999@90,-60'
          && blocked.receipt.starKey === null && blocked.receipt.worldKey === null
          && blocked.state.renderedScene?.serial === blocked.receipt.serial
          && blocked.state.renderedScene?.mode === blocked.receipt.mode
          && blocked.state.renderedScene?.galaxyKey === blocked.receipt.galaxyKey
          && blocked.state.renderedScene?.starKey === blocked.receipt.starKey
          && blocked.state.renderedScene?.worldKey === blocked.receipt.worldKey;
        if (!homeDescent.accepted || homeRouteWaitError !== null || blocked.accepted
          || blocked.state.mode !== 'galaxy' || blocked.state.gal !== 999 || !receiptBound
          || blocked.state.stage >= 2 || blocked.state.toastSerial <= blocked.beforeSerial
          || !blocked.state.toastText.includes('Beyond Your Charter')) {
          recordInstrumentFailure(`${vp.label}: exact home-galaxy receipt did not bind the blocked Charter attempt (${JSON.stringify({ homeDescent, homeRouteWaitError, homeRoute, blocked, receiptBound })})`);
        }
        try { await waitFor('charter toast', `window.__CF_SLICE__.api.state().toastOn && window.__CF_SLICE__.api.state().toastText.includes('Beyond Your Charter') && Number(getComputedStyle(document.getElementById('toast')).opacity)>0.1 && document.getElementById('toast')?.textContent?.trim().length>20`); }
        catch (error) { recordInstrumentFailure(error.message); }
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
            const leftToastControl = await evalIn(`(()=>{ const toast=document.getElementById('toast'),prior=toast.getAttribute('style'),
              before=window.__CF_GLASS_AUDIT__.rightBottomAnchorOutcome('#toast');
              toast.style.setProperty('left','12px','important');toast.style.setProperty('right','auto','important');
              const mutated=window.__CF_GLASS_AUDIT__.rightBottomAnchorOutcome('#toast');
              if(prior===null)toast.removeAttribute('style');else toast.setAttribute('style',prior);
              const restoredStyle=toast.getAttribute('style'),restored=window.__CF_GLASS_AUDIT__.rightBottomAnchorOutcome('#toast');
              return {priorStyle:prior,before,mutated,restoredStyle,restored};})()`);
            const toastControlAssessment = toastAnchorControlOutcome(leftToastControl);
            if (!toastControlAssessment.ok) {
              recordInstrumentFailure(`${vp.label}: injected left-anchored toast did not fail and restore exact style/positive anchor bytes (${JSON.stringify({ leftToastControl, toastControlAssessment })})`);
            }
            /* The standing viewport-fit control now also owns the reported
               side-anchor regression; keep the existing control inventory. */
            recordControls('viewport-fit');
          }
        }

        /* Populate the real Earth survey and Planetside strip through the
           same public browser-audit API used by the standing smoke journey. */
        const surveyReady = await evalIn(`(()=>{ const S=window.__CF_SLICE__; S.api.descendSystem({seed:424242,x:560,y:170}); return S.api.surveyOn({seed:133,ordinal:2}); })()`);
        if (!surveyReady) recordInstrumentFailure(`${vp.label}: could not populate the Earth survey`);
        /* The rich veteran fixture intentionally preserves custom names, so
           Earth may be labelled Homeworld. The composite selector already
           selects the deterministic Sol body; bind readiness to its real Land action
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
          if (yieldControl.ok) recordInstrumentFailure(`${vp.label}: visible trail-under-survey injection stayed green (${JSON.stringify(yieldControl)})`);
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
            recordInstrumentFailure(`${vp.label}: injected generic duplicate/upper-left survey close stayed green (${JSON.stringify(duplicateCloseControl)})`);
          }
          const misplacedCloseControl = await evalIn(`(()=>{ const close=document.querySelector('#survey [data-survey-close]'),prior=close.getAttribute('style');
            close.style.setProperty('position','fixed','important');close.style.setProperty('left','0','important');
            close.style.setProperty('top','0','important');close.style.setProperty('right','auto','important');close.style.setProperty('margin','0','important');
            const result=window.__CF_GLASS_AUDIT__.closeIntegrityOutcome('#survey','[data-survey-close]','[data-pnx]');
            if(prior===null)close.removeAttribute('style');else close.setAttribute('style',prior);return result;})()`);
          if (misplacedCloseControl.ok || misplacedCloseControl.topRight) {
            recordInstrumentFailure(`${vp.label}: injected upper-left survey close stayed green (${JSON.stringify(misplacedCloseControl)})`);
          }
          /* Extend the existing close control rather than growing the sealed
             existing inventory: it now rejects duplicates and bad corners. */
          recordControls('ordinary-panel-centre-close');
        }
        add(vp.label, 'survey', await audit({
          ...common, surface: 'survey', root: '#survey', textMin: 80,
          required: [{ selector: '[data-sel=title]', min: 1, textMin: 5 }, { selector: '[data-row]', min: 3 },
            { selector: '[data-survey-close]', min: 1 }, { selector: '[data-act=landcta]', min: 1 }],
          interactiveRoots: ['#survey'], contrastSelectors: ['#survey'], overlapPairs: [['#survey', '#dock']],
        }));

        /* The imported veteran already owns Deep Scanners. Mars is inside
           its sealed Sol reach, so the standing public audit seam can prove
           the passive orbital row without altering the fixture or the later
           Arc 4 planetfall oracle. Slice owns the purchase, biome-marker and
           reload journey; Glass owns rendered disclosure and containment. */
        const orbitalOpened = await evalIn(`window.__CF_SLICE__?.api?.surveyOn?.({seed:${ARC3_ORBITAL_GLASS_TARGET.planetSeed},ordinal:${ARC3_ORBITAL_GLASS_TARGET.planetOrdinal}})??false`);
        let orbitalRoute = null, orbitalRouteError = null;
        if (orbitalOpened) {
          try {
            orbitalRoute = await waitFor(
              'Deep Scanner Mars Survey',
              ARC3_ORBITAL_SURVEY_GLASS_EXPRESSION,
              10000,
              (observation) => observation?.state?.mode === 'system'
                && observation?.state?.gal === ARC3_ORBITAL_GLASS_TARGET.galaxySeed
                && observation?.state?.star === ARC3_ORBITAL_GLASS_TARGET.star.seed
                && observation?.state?.starX === ARC3_ORBITAL_GLASS_TARGET.star.x
                && observation?.state?.starY === ARC3_ORBITAL_GLASS_TARGET.star.y
                && observation?.cardOpen === true
                && observation?.rowCount === 1
                && observation?.label === 'Mineral veins'
                && observation?.value === ARC3_ORBITAL_GLASS_TARGET.expectedValue
                && observation?.rendered === true
                && observation?.state?.pendingPersistenceWrites === 0,
            );
          } catch (cause) { orbitalRouteError = String(cause?.message || cause); }
        }
        if (!orbitalOpened || orbitalRoute === null) {
          recordInstrumentFailure(`${vp.label}: sealed veteran could not open the reachable Mars Deep Scanner Survey (${JSON.stringify({ orbitalOpened, orbitalRoute, orbitalRouteError })})`);
        }
        const orbitalContainmentRequired = MATRIX_VIEWPORTS.some((viewport) => viewport.label === 'small-phone');
        let orbitalContainmentControl = null;
        if (!orbitalContainmentControlRun && vp.label === 'small-phone') {
          orbitalContainmentControlRun = true;
          const containmentEvidence = await evalIn(`(()=>{const row=document.querySelector('#survey [data-row="Mineral veins"]'),
            card=document.getElementById('survey'),prior={left:card?.scrollLeft??null,top:card?.scrollTop??null};
            if(!row||!card)return {ok:false,why:'orbital containment targets missing',prior};
            let offCard=null,centred=null,restored=null,error=null;
            try{offCard=${ARC3_ORBITAL_SURVEY_GLASS_EXPRESSION};
              row.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
              centred=${ARC3_ORBITAL_SURVEY_GLASS_EXPRESSION};}
            catch(cause){error=String(cause?.message||cause);}
            finally{card.scrollLeft=prior.left;card.scrollTop=prior.top;}
            try{restored=${ARC3_ORBITAL_SURVEY_GLASS_EXPRESSION};}
            catch(cause){error=error||String(cause?.message||cause);}
            const after={left:card.scrollLeft,top:card.scrollTop};
            return {ok:error===null&&after.left===prior.left&&after.top===prior.top,
              prior,after,offCard,centred,restored,error};})()`);
          const offCard = assessArc3OrbitalSurveyGlass(containmentEvidence?.offCard);
          const centred = assessArc3OrbitalSurveyGlass(containmentEvidence?.centred);
          const restored = assessArc3OrbitalSurveyGlass(containmentEvidence?.restored);
          orbitalContainmentControl = {
            ok: containmentEvidence?.ok === true
              && isolatesArc3OrbitalGlassChecks(offCard, ['contained'])
              && centred.ok
              && isolatesArc3OrbitalGlassChecks(restored, ['contained']),
            evidence: containmentEvidence, offCard, centred, restored,
          };
          if (!orbitalContainmentControl.ok) {
            recordInstrumentFailure(`${vp.label}: live off-card orbital row did not turn only containment red, centre green, and restore exact scroll (${JSON.stringify(orbitalContainmentControl)})`);
          }
          recordControls('orbital-row-containment-restore');
        }
        await evalIn(`document.querySelector('#survey [data-row="Mineral veins"]')?.scrollIntoView({block:'nearest',inline:'nearest'})`);
        await sleep(40);
        const orbitalSurveyObservation = await evalIn(ARC3_ORBITAL_SURVEY_GLASS_EXPRESSION);
        const orbitalSurvey = assessArc3OrbitalSurveyGlass(orbitalSurveyObservation);
        addOutcome(vp.label, 'orbital-mineral-survey', 'ORBITAL_MINERAL_SURVEY_DISCLOSURE', '#survey [data-row="Mineral veins"]',
          orbitalSurvey,
          'one contained passive Mars row preserves ordinary-deposit order without cosmic, exceptional, grade, reserve, progress, or Mine disclosure');
        const orbitalAuditOptions = {
          ...common, surface: 'orbital-mineral-survey', root: '#survey', textMin: 80,
          required: [{ selector: '[data-sel=title]', min: 1, textMin: 1 },
            { selector: '[data-row="Mineral veins"]', min: 1, max: 1, textMin: 25 },
            { selector: '[data-survey-close]', min: 1 }],
          interactiveRoots: ['#survey'], contrastSelectors: ['#survey', '#survey [data-row="Mineral veins"]'],
          overlapPairs: [['#survey', '#dock']],
        };
        add(vp.label, 'orbital-mineral-survey', await audit(orbitalAuditOptions));
        if (!orbitalSurveyControlRun) {
          orbitalSurveyControlRun = true;
          const orbitalCopyControl = await evalIn(`(()=>{const title=document.querySelector('#survey [data-sel="title"]'),
            prior=title?.textContent??null,relevant=(rows)=>rows.filter(row=>row.code==='REQUIRED_COPY_EMPTY'&&row.element==='[data-sel=title]');
            if(!title||prior===null)return {ok:false,why:'orbital title missing'};
            let baseline=[],broken=[],restored=[],error=null;
            try{baseline=relevant(window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(orbitalAuditOptions)}));
              title.textContent='';broken=relevant(window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(orbitalAuditOptions)}));}
            catch(cause){error=String(cause?.message||cause);}
            finally{title.textContent=prior;}
            try{restored=relevant(window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(orbitalAuditOptions)}));}
            catch(cause){error=error||String(cause?.message||cause);}
            return {ok:error===null&&prior.trim()==='Mars'&&prior.trim().length===4&&baseline.length===0&&broken.length===1
              &&broken[0]?.actual?.textLength===0&&restored.length===0&&title.textContent===prior,
              prior,baseline,broken,restored,after:title.textContent,error};})()`);
          if (!orbitalCopyControl?.ok) {
            recordInstrumentFailure(`${vp.label}: four-letter Mars/empty-title audit control did not reject and restore (${JSON.stringify(orbitalCopyControl)})`);
          }
          const orbitalControlEvidence = await evalIn(`(()=>{const row=document.querySelector('#survey [data-row="Mineral veins"]'),
            card=document.getElementById('survey'),prior={html:row?.innerHTML??null,left:card?.scrollLeft??null,top:card?.scrollTop??null};
            if(!row||!card||prior.html===null)return {ok:false,why:'nonempty orbital row target missing',prior};
            const probe=()=>{row.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});return ${ARC3_ORBITAL_SURVEY_GLASS_EXPRESSION}};
            let baseline=null,mutated=null,restored=null,error=null;
            try{baseline=probe();row.innerHTML='<span>Mineral veins</span><br>Silicon · Chlorine · Calcium · Void Essence · 570 pulls remaining';
              mutated=probe();row.innerHTML=prior.html;restored=probe();}
            catch(cause){error=String(cause?.message||cause);}
            finally{row.innerHTML=prior.html;card.scrollLeft=prior.left;card.scrollTop=prior.top;}
            const after={html:row.innerHTML,left:card.scrollLeft,top:card.scrollTop};
            return {ok:error===null&&after.html===prior.html&&after.left===prior.left&&after.top===prior.top,
              prior,after,baseline,mutated,restored,error};})()`);
          const orbitalControl = (() => {
            const baseline = assessArc3OrbitalSurveyGlass(orbitalControlEvidence?.baseline);
            const mutated = assessArc3OrbitalSurveyGlass(orbitalControlEvidence?.mutated);
            const restored = assessArc3OrbitalSurveyGlass(orbitalControlEvidence?.restored);
            const authority = arc3OrbitalGlassAuthorityControls(orbitalControlEvidence?.baseline);
            return {
              ok: orbitalControlEvidence?.ok === true && orbitalCopyControl?.ok === true
                && (!orbitalContainmentRequired || orbitalContainmentControl?.ok === true)
                && baseline.ok
                && isolatesArc3OrbitalGlassChecks(
                  mutated, ['exactOrderedValue', 'groundedSensitiveFacts'],
                )
                && restored.ok && authority.ok,
              evidence: orbitalControlEvidence, copy: orbitalCopyControl,
              containment: orbitalContainmentControl,
              baseline, mutated, restored, authority,
            };
          })();
          if (!orbitalControl.ok) {
            recordInstrumentFailure(`${vp.label}: orbital Survey card/target/nav/receipt/persistence and Mineral veins mutations did not turn red in isolation and restore (${JSON.stringify(orbitalControl)})`);
          }
          recordControls('orbital-mineral-survey-disclosure', 'orbital-title-semantic-copy');
        }
        const earthSurveyRestored = await evalIn('window.__CF_SLICE__?.api?.surveyOn?.({seed:133,ordinal:2})??false');
        let earthRestoreObservation = null, earthRestoreError = null;
        try {
          earthRestoreObservation = await waitFor(
            'Earth survey restored after Mars disclosure',
            `(()=>{const S=window.__CF_SLICE__,s=S?.api?.state?.(),target=S?.api?.planetScreenTarget?.({seed:133,ordinal:2})??null;
              return {mode:s?.mode??null,gal:s?.gal??null,star:s?.star??null,starX:s?.starX??null,starY:s?.starY??null,
                planet:s?.planet??null,planetOrdinal:s?.planetOrdinal??null,navGalaxyKey:s?.navGalaxyKey??null,
                navStarKey:s?.navStarKey??null,navWorldKey:s?.navWorldKey??null,cardOpen:s?.cardOpen??null,
                cardCode:S?.api?.cardShareCode?.()??null,planetTarget:target,renderedScene:s?.renderedScene??null,
                pendingPersistenceWrites:s?.sceneResources?.pendingPersistenceWrites??null,
                hasLandAction:!!document.querySelector('#survey [data-act="landcta"]'),
                mineralRowCount:document.querySelectorAll('#survey [data-row="Mineral veins"]').length};})()`,
            10000,
            (observation) => {
              const payload = decodeCF1Payload(observation?.cardCode);
              const receipt = observation?.renderedScene;
              return observation?.mode === 'system' && observation?.gal === 999
                && observation?.star === 424242 && observation?.starX === 560 && observation?.starY === 170
                && observation?.planet === null && observation?.planetOrdinal === null
                && observation?.navGalaxyKey === 'CF1|g:999@90,-60'
                && observation?.navStarKey === 'CF1|g:999@90,-60|s:424242@560,170'
                && observation?.navWorldKey === null && observation?.cardOpen === true
                && payload?.t === 'p' && payload?.p === 133
                && observation?.planetTarget?.seed === 133 && observation?.planetTarget?.ordinal === 2
                && observation?.planetTarget?.width > 0 && observation?.planetTarget?.height > 0
                && receipt?.serial > 0 && receipt?.mode === 'system'
                && receipt?.galaxyKey === observation.navGalaxyKey
                && receipt?.starKey === observation.navStarKey && receipt?.worldKey === null
                && observation?.pendingPersistenceWrites === 0
                && observation?.hasLandAction === true && observation?.mineralRowCount === 0;
            },
          );
        } catch (cause) { earthRestoreError = String(cause?.message || cause); }
        if (!earthSurveyRestored || earthRestoreError !== null) {
          recordInstrumentFailure(`${vp.label}: Earth Survey did not restore exactly after the Mars disclosure (${JSON.stringify({ earthSurveyRestored, earthRestoreObservation, earthRestoreError })})`);
        }
        await evalIn('window.__CF_SLICE__.api.landHere()');
        await waitFor('Planetside', `window.__CF_SLICE__.api.state().mode==='surface' && document.getElementById('planetside')?.textContent?.trim().length>20`, 10000);
        add(vp.label, 'planetside', await audit({
          ...common, surface: 'planetside', root: '#planetside', textMin: 20,
          required: [{ selector: '[data-sel=planetside-sp]', min: 1 }], interactiveRoots: [], contrastSelectors: ['#planetside'],
          overlapPairs: [['#planetside', '#ctxbar'], ['#planetside', '#hintpill'], ['#planetside', '#dock']],
        }));
        const planetsideOwnershipCheck = `(async()=>{ const side=document.getElementById('planetside'),survey=document.getElementById('survey'),
          specimen=side?.querySelector('[data-sel=planetside-sp]'); if(!side||!survey||!specimen)return {ok:false,why:'missing'};
          const wait=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))),style=side.style,
            prior={left:side.scrollLeft,top:side.scrollTop,behavior:{value:style.getPropertyValue('scroll-behavior'),priority:style.getPropertyPriority('scroll-behavior')}};
          let observation=null,error=null;
          try {
            style.setProperty('scroll-behavior','auto','important');
            const initialSide=side.getBoundingClientRect(),initialSpecimen=specimen.getBoundingClientRect();
            if(initialSpecimen.top<initialSide.top+2)side.scrollTop-=initialSide.top+2-initialSpecimen.top;
            else if(initialSpecimen.bottom>initialSide.bottom-2)side.scrollTop+=initialSpecimen.bottom-(initialSide.bottom-2);
            await wait();
            const a=side.getBoundingClientRect(),b=survey.getBoundingClientRect(),p=specimen.getBoundingClientRect();
            const overlap=a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
            const left=Math.max(a.left,p.left)+1,right=Math.min(a.right,p.right)-1,top=Math.max(a.top,p.top)+1,bottom=Math.min(a.bottom,p.bottom)-1,
              visibleIntersection=right-left>2&&bottom-top>2,x=visibleIntersection?(left+right)/2:null,y=visibleIntersection?(top+bottom)/2:null;
            const hit=visibleIntersection?document.elementFromPoint(x,y):null,owned=!!hit&&side.contains(hit);
            observation={ok:!overlap&&visibleIntersection&&owned,overlap,visibleIntersection,owned,
              hit:hit?.id||hit?.getAttribute?.('data-sel')||hit?.tagName||null,
              side:[a.left,a.top,a.right,a.bottom],survey:[b.left,b.top,b.right,b.bottom],specimen:[p.left,p.top,p.right,p.bottom],point:[x,y],
              reached:{left:side.scrollLeft,top:side.scrollTop}};
          } catch(cause) { error=String(cause?.message||cause); }
          finally {
            style.setProperty('scroll-behavior','auto','important');side.scrollLeft=prior.left;side.scrollTop=prior.top;await wait();
            if(prior.behavior.value)style.setProperty('scroll-behavior',prior.behavior.value,prior.behavior.priority);else style.removeProperty('scroll-behavior');
          }
          const restored={left:side.scrollLeft,top:side.scrollTop,behavior:{value:style.getPropertyValue('scroll-behavior'),priority:style.getPropertyPriority('scroll-behavior')}};
          const restoration=restored.left===prior.left&&restored.top===prior.top
            &&restored.behavior.value===prior.behavior.value&&restored.behavior.priority===prior.behavior.priority;
          return {...(observation||{ok:false}),ok:error===null&&observation?.ok===true&&restoration,prior,restored,restoration,error}; })()`;
        const planetsideOwnership = await evalIn(planetsideOwnershipCheck);
        const planetsideOwnershipExpected = 'the populated living-world strip does not overlap the open survey and owns a representative rendered point';
        if (planetsideOwnership?.error || planetsideOwnership?.restoration === false) {
          stopInstrumentControl(`${vp.label}: Planetside ownership observation did not restore its exact scroll/style state (${JSON.stringify(planetsideOwnership)})`);
        }
        addOutcome(vp.label, 'planetside', 'PLANETSIDE_SURFACE_OCCLUDED', '#planetside',
          planetsideOwnership, planetsideOwnershipExpected);
        stopAfterRecordedProductOutcome(vp.label, 'planetside', 'PLANETSIDE_SURFACE_OCCLUDED',
          '#planetside', planetsideOwnership, planetsideOwnershipExpected);
        if (!planetsideControlRun) {
          planetsideControlRun = true;
          const shieldControl = await evalIn(`(async()=>{ const baseline=await ${planetsideOwnershipCheck},point=baseline.point,
            shield=document.createElement('div'); if(!baseline.ok||!Array.isArray(point))return {ok:false,why:'baseline missing',baseline};
            shield.id='cf-planetside-shield';Object.assign(shield.style,{position:'fixed',left:(point[0]-4)+'px',top:(point[1]-4)+'px',width:'8px',height:'8px',zIndex:'9999',pointerEvents:'auto'});document.body.appendChild(shield);
            let mutated=null,error=null;try{mutated=await ${planetsideOwnershipCheck};}catch(cause){error=String(cause?.message||cause);}finally{shield.remove();}
            const shieldRemoved=!document.getElementById('cf-planetside-shield'),restored=await ${planetsideOwnershipCheck};
            return {ok:error===null&&baseline.ok===true&&mutated?.ok===false&&mutated?.owned===false
              &&mutated?.hit==='cf-planetside-shield'&&mutated?.restoration===true&&shieldRemoved&&restored?.ok===true,
              baseline,mutated,shieldRemoved,restored,error};})()`);
          if (!shieldControl.ok) recordInstrumentFailure(`${vp.label}: Planetside hit-ownership shield did not own the sampled point, turn only ownership red, remove itself, and restore green (${JSON.stringify(shieldControl)})`);
          const overlapControl = await evalIn(`(async()=>{ const side=document.getElementById('planetside'),survey=document.getElementById('survey'),
            a=side.getBoundingClientRect(),b=survey.getBoundingClientRect(),style=side.style,baseline=await ${planetsideOwnershipCheck},prior={
              value:style.getPropertyValue('transform'),priority:style.getPropertyPriority('transform'),computed:getComputedStyle(side).transform},
            requested='translate('+(b.left-a.left)+'px,'+(b.top-a.top)+'px)';let mutated=null,mutation=null,error=null;
            try{style.setProperty('transform',requested,'important');mutation={value:style.getPropertyValue('transform'),
              priority:style.getPropertyPriority('transform'),computed:getComputedStyle(side).transform};mutated=await ${planetsideOwnershipCheck};}
            catch(cause){error=String(cause?.message||cause);}
            finally{if(prior.value===''&&prior.priority==='')style.removeProperty('transform');else style.setProperty('transform',prior.value,prior.priority);}
            const restoredProperty={value:style.getPropertyValue('transform'),priority:style.getPropertyPriority('transform')},restoredComputed=getComputedStyle(side).transform,
              restored=await ${planetsideOwnershipCheck},propertyRestored=restoredProperty.value===prior.value&&restoredProperty.priority===prior.priority;
            return {ok:error===null&&baseline?.ok===true&&typeof mutation?.value==='string'&&mutation.value.length>0&&mutation?.priority==='important'
              &&mutation?.computed!==prior.computed&&mutated?.ok===false&&mutated?.overlap===true&&mutated?.restoration===true
              &&propertyRestored&&restoredComputed===prior.computed&&restored?.ok===true,
              baseline,prior,requested,mutation,mutated,restoredProperty,restoredComputed,propertyRestored,restored,error};})()`);
          if (!overlapControl.ok) recordInstrumentFailure(`${vp.label}: Planetside/survey overlap control did not land the collision and restore the exact transform property/computed outcome (${JSON.stringify(overlapControl)})`);
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

        /* Arc 4 capture remains a pure presentation/geometry audit here.
           The Slice suite owns writer settlement. Glass uses only Survey
           disclosure, focus, and its visible Close action, then proves the exact Arc 4-owned
           durability projection and capture authority were unchanged across
           the complete audit despite permissible checkpoint-only churn. */
        await waitFor('Homeworld Arc 4 capture route', `(()=>{const state=window.__CF_SLICE__?.api?.state?.();
          return state?.mode==='surface'&&state?.planet===133&&state?.cardOpen===true;})()`, 10000);
        const arc4BeforeUi = await evalIn(ARC4_CAPTURE_UI_EXPRESSION);
        const arc4BeforeSurface = await evalIn(ARC4_SURFACE_EXPRESSION);
        const arc4BeforePlanetside = await evalIn(ARC4_PLANETSIDE_EXPRESSION);
        const arc4BeforeDurable = await readSettledArc4Durable('before non-mutating Arc 4 Glass audit');
        await evalIn(`(()=>{window.__cfGlassArc4ActivationAbort?.abort();
          const controller=new AbortController(),trace=[];window.__cfGlassArc4ActivationAbort=controller;
          window.__cfGlassArc4ActivationTrace=trace;const record=(event)=>{const target=event.target instanceof Element
            ?event.target.closest('button[data-capture-action]'):null;if(!target)return;
            const activates=event.type==='click'||event.key==='Enter'||event.key===' '
              ||event.key==='Spacebar'||event.code==='Space';if(activates)trace.push({type:event.type,
                key:event.key??null,code:event.code??null,trusted:event.isTrusted===true,
                verb:target.getAttribute('data-capture-action')});};
          document.addEventListener('click',record,{capture:true,signal:controller.signal});
          document.addEventListener('keydown',record,{capture:true,signal:controller.signal});return true;})()`);
        const captureDisclosureState = `(()=>{const state=window.__CF_SLICE__?.api?.state?.(),button=document.getElementById('docksurvey');return {
          cardOpen:state?.cardOpen===true,expanded:button?.getAttribute('aria-expanded')??null,
          focusId:document.activeElement?.id??null,rowCount:document.querySelectorAll('#survey [data-capture-row]').length};})()`;
        const setupClose = await activateRealKeyboardControl('#docksurvey', `${vp.label} Arc 4 Survey setup close`);
        const setupClosed = await waitFor('Arc 4 Survey setup close', captureDisclosureState, 5000,
          (value) => value?.cardOpen === false && value?.expanded === 'false');
        const open = await activateRealKeyboardControl('#docksurvey', `${vp.label} Arc 4 Survey opener`);
        const opened = await waitFor('Arc 4 Survey native open', captureDisclosureState, 5000,
          (value) => value?.cardOpen === true && value?.expanded === 'true');
        const sampleFocusSetup = await evalIn(arc4NativeTabFocusSetupExpression('sample', 'scavenge'));
        await pressTab();
        const sampleFocus = await evalIn(arc4NativeTabFocusEvidenceExpression('sample'));
        const sampleScroll = await evalIn(arc4ScrollSettleExpression('#survey button[data-capture-action="sample"]'));
        const close = await activateRealKeyboardControl('#survey [data-survey-close]',
          `${vp.label} Arc 4 Survey Close return`);
        const returned = await waitFor('Arc 4 Survey Close return', captureDisclosureState, 5000,
          (value) => value?.cardOpen === false && value?.expanded === 'false' && value?.focusId === 'docksurvey');
        const reopen = await activateRealKeyboardControl('#docksurvey', `${vp.label} Arc 4 Survey reopen`);
        const reopened = await waitFor('Arc 4 Survey native reopen', captureDisclosureState, 5000,
          (value) => value?.cardOpen === true && value?.expanded === 'true');
        const arc4Ui = await evalIn(ARC4_CAPTURE_UI_EXPRESSION);
        const arc4AfterSurface = await evalIn(ARC4_SURFACE_EXPRESSION);
        const arc4AfterPlanetside = await evalIn(ARC4_PLANETSIDE_EXPRESSION);
        const arc4Presentation = assessArc4GlassPresentation({ ui: arc4Ui, planetside: arc4AfterPlanetside });

        const arc4ControlsGeometry = [];
        for (const verb of ARC4_CAPTURE_VERBS) {
          const evidence = await evalIn(buildArc4AtomicGeometryEvidenceExpression({
            verb,
            forceHeartbeatRerender: vp.label === 'small-phone' && verb === 'sample',
          }));
          const heartbeatRerender = assessArc4HeartbeatRerenderEvidence(evidence?.rerender);
          if (!heartbeatRerender.ok) {
            recordInstrumentFailure(`${vp.label}: Arc 4 ${verb} atomic geometry collector did not exercise a healthy heartbeat rerender (${JSON.stringify({
              heartbeatRerender, evidence,
            })})`);
          }
          arc4ControlsGeometry.push({ ...evidence, heartbeatRerender });
        }
        const arc4CloseGeometry = await evalIn(
          buildArc4AtomicGeometryEvidenceExpression({ close: true }),
        );
        const arc4CloseHeartbeatRerender = assessArc4HeartbeatRerenderEvidence(
          arc4CloseGeometry?.rerender,
        );
        if (!arc4CloseHeartbeatRerender.ok) {
          recordInstrumentFailure(`${vp.label}: Arc 4 Close atomic geometry collector failed (${JSON.stringify({
            heartbeatRerender: arc4CloseHeartbeatRerender,
            evidence: arc4CloseGeometry,
          })})`);
        }
        const arc4CloseAfter = await evalIn(ARC4_CAPTURE_UI_EXPRESSION);
        const arc4Layout = await evalIn(ARC4_LAYOUT_EXPRESSION);
        const arc4GeometryBundle = {
          schema: ARC4_CAPTURE_GEOMETRY_EVIDENCE_SCHEMA,
          layoutCoordinateSpace: ARC4_CAPTURE_LAYOUT_COORDINATE_SPACE,
          viewport: { name: vp.label, width: vp.width, height: vp.height },
          ui: arc4CloseAfter,
          planetsideRect: arc4Layout.planetsideRect,
          controls: arc4ControlsGeometry,
          close: {
            ...arc4CloseGeometry,
            heartbeatRerender: arc4CloseHeartbeatRerender,
            rect: arc4CloseGeometry?.buttonRect ?? null,
          },
          scrollWidth: arc4Layout.scrollWidth,
          clientWidth: arc4Layout.clientWidth,
        };
        const arc4GeometryCoherence =
          assessArc4CaptureGeometryEvidenceCoherence(arc4GeometryBundle);
        if (!arc4GeometryCoherence.ok) {
          recordInstrumentFailure(`${vp.label}: Arc 4 geometry evidence crossed layout epochs (${JSON.stringify({
            coherence: arc4GeometryCoherence,
            controls: arc4GeometryBundle.controls,
            close: arc4GeometryBundle.close,
          })})`);
        }
        const arc4GeometryClauses = arc4GeometryClauseProjection(arc4GeometryBundle);
        const arc4GeometryAssessment = assessArc4CaptureCardGeometryFocus(arc4GeometryBundle);
        const arc4Geometry = {
          ...arc4GeometryAssessment,
          diagnostics: {
            schema: 'cf-v2-glass-arc4-geometry-diagnostics/v1',
            viewport: { ...arc4GeometryBundle.viewport },
            planetsideRect: arc4GeometryBundle.planetsideRect,
            controls: arc4GeometryBundle.controls,
            close: arc4GeometryBundle.close,
            coherence: arc4GeometryCoherence,
            scrollWidth: arc4GeometryBundle.scrollWidth,
            clientWidth: arc4GeometryBundle.clientWidth,
            clauseProjection: arc4GeometryClauses,
          },
        };
        const arc4AfterDurable = await readSettledArc4Durable('after non-mutating Arc 4 Glass audit');
        const arc4AfterCapture = (await evalIn(ARC4_CAPTURE_UI_EXPRESSION)).captureState;
        const arc4CaptureActivationTrace = await evalIn(`(()=>{const trace=Array.isArray(window.__cfGlassArc4ActivationTrace)
          ?window.__cfGlassArc4ActivationTrace.map((row)=>({...row})):null;
          window.__cfGlassArc4ActivationAbort?.abort();delete window.__cfGlassArc4ActivationAbort;
          delete window.__cfGlassArc4ActivationTrace;return trace;})()`);
        const arc4NativeAssessment = assessArc4NativeSurveyCloseReturn({
          beforeSurface: arc4BeforeSurface,
          afterSurface: arc4AfterSurface,
          beforePlanetside: arc4BeforePlanetside,
          afterPlanetside: arc4AfterPlanetside,
          beforeCapture: arc4BeforeUi.captureState,
          afterCapture: arc4AfterCapture,
          beforeDurableSettled: arc4BeforeDurable.settled,
          afterDurableSettled: arc4AfterDurable.settled,
          beforeDurableFingerprint: arc4BeforeDurable.fingerprint,
          afterDurableFingerprint: arc4AfterDurable.fingerprint,
          setupClose, setupClosed, open, opened,
          sampleScrollSettled: sampleFocusSetup?.ok === true && sampleScroll?.ok === true,
          sampleFocus,
          close, returned, reopen, reopened,
          captureActivationTrace: arc4CaptureActivationTrace,
        });
        const arc4NativeReturn = {
          ...arc4NativeAssessment,
          diagnostics: {
            schema: 'cf-v2-glass-arc4-native-close-diagnostics/v1',
            beforeSurface: arc4BeforeSurface, afterSurface: arc4AfterSurface,
            beforePlanetside: arc4BeforePlanetside, afterPlanetside: arc4AfterPlanetside,
            beforeCapture: arc4BeforeUi.captureState, afterCapture: arc4AfterCapture,
            beforeDurableFingerprint: arc4BeforeDurable.fingerprint,
            afterDurableFingerprint: arc4AfterDurable.fingerprint,
          },
        };
        const arc4PresentationEvidence = {
          ...arc4Presentation,
          diagnostics: {
            schema: 'cf-v2-glass-arc4-presentation-diagnostics/v1',
            ui: arc4Ui,
            planetside: arc4AfterPlanetside,
          },
        };
        addArc4Outcome(vp.label, 'survey-capture', 'ARC4_CAPTURE_NATIVE_SURVEY_RETURN',
          '#docksurvey,#survey [data-capture-action="sample"]', arc4NativeReturn,
          'a trusted Survey open, idle Sample keyboard focus and visible Close return to the opener emit no capture activation and leave the exact surface, Planetside, capture state, Arc 4 ownership/rewards/counters, bound epoch, SessionRNG and receipts unchanged');
        addArc4Outcome(vp.label, 'survey-capture', 'ARC4_CAPTURE_PRESENTATION_TRUTH',
          '#survey [data-capture-card-body]', arc4PresentationEvidence,
          arc4VeteranPresentationExpectation());
        addArc4Outcome(vp.label, 'survey-capture', 'ARC4_CAPTURE_GEOMETRY_FOCUS',
          '#survey [data-capture-card-body]', arc4Geometry,
          'Survey capture owns one separated card/Planetside composition with settled 44px named, hittable, unclipped and visibly keyboard-focused actions and Close');
        const arc4DependentAssessment = assessArc4DependentBaseline({
          planetsideOwnership, nativeReturn: arc4NativeReturn,
          presentation: arc4PresentationEvidence, geometry: arc4Geometry,
        });
        const arc4DependentBaseline = {
          ...arc4DependentAssessment,
          diagnostics: {
            schema: 'cf-v2-glass-arc4-dependent-baseline-diagnostics/v1',
            ui: { before: arc4BeforeUi, after: arc4Ui },
            planetside: { before: arc4BeforePlanetside, after: arc4AfterPlanetside },
            planetsideOwnership,
            geometry: arc4Geometry.diagnostics,
          },
        };
        if (!arc4DependentBaseline.ok) {
          throw new Error(`Arc 4 dependent baseline red; Planetside/panel outcomes blocked (${JSON.stringify(arc4DependentBaseline)})`);
        }

        /* Every ordinary panel is deliberately exercised with populated real
           data. Left-rail desktop panels and all phone dock panels remain over
           Survey; the desktop right rail is intentionally reached after the
           card yields it. Both compositions prove geometry and focus. */
        const ordinaryPanels = [
          { id: 'codex', name: 'compendium', dock: '#dockcodex', rail: '#railcodex', panel: '#codexpanel', required: '[data-sel=codex-entry]', min: 1, textMin: 80 },
          { id: 'rec', name: 'records', dock: '#dockrecords', rail: '#railrecords', panel: '#recpanel', required: '#recpanel .row', min: 6, textMin: 80 },
          { id: 'atlas', name: 'atlas', dock: '#dockatlas', rail: '#railatlas', panel: '#atlaspanel', required: '[data-sel=atlas-entry]', min: 1, textMin: 25 },
          { id: 'shipyard', name: 'shipyard', dock: '#dockshipyard', rail: '#railshipyard', panel: '#shipyardpanel', required: '[data-cf-shipyard-preview="v1"]', min: 1, textMin: 80, shipyard: true },
          { id: 'inventory', name: 'inventory', dock: '#dockinventory', rail: '#railinventory', panel: '#inventorypanel', required: '[data-inventory-row="exact"]', min: 3, textMin: 120, inventory: true },
          { id: 'ch', name: 'charters', dock: '#dockcharters', rail: '#railcharters', panel: '#chpanel', required: '[data-sel=charter-ch]', min: 1, textMin: 120 },
        ];
        for (const item of ordinaryPanels) {
          const opener = vp.width > 900 ? item.rail : item.dock;
          /* A populated desktop survey deliberately yields the right rail,
             so Records/Atlas/Shipyard/Inventory are reached *instead of* the
             card, while the left rail and every phone dock panel remain
             operable over it. */
          const overSurvey = !(vp.width > 900 && (item.id === 'rec' || item.id === 'atlas'
            || item.id === 'shipyard' || item.id === 'inventory'));
          const cardBeforePanel = await evalIn('window.__CF_SLICE__.api.state().cardOpen');
          if (cardBeforePanel !== overSurvey) {
            await evalIn(`document.getElementById('docksurvey')?.click()`);
            await waitFor(`${item.name} survey composition`, `window.__CF_SLICE__.api.state().cardOpen===${JSON.stringify(overSurvey)}`);
          }
          const chromeBeforePanel = vp.label === 'phone-landscape' && item.id === 'codex'
            ? await evalIn(`['topbar','ctxbar','hintpill','searchbox','dock'].map(id=>{const el=document.getElementById(id),style=el?getComputedStyle(el):null;
                return {id,display:style?.display||'missing',visibility:style?.visibility||'missing',pointerEvents:style?.pointerEvents||'missing'};})`)
            : null;
          const openerReady = await evalIn(`(()=>{ const b=document.querySelector(${JSON.stringify(opener)});if(!b)return false;const s=getComputedStyle(b),r=b.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;})()`);
          if (!openerReady) recordInstrumentFailure(`${vp.label}: ${item.name} has no visible opener in its intended ${overSurvey ? 'over-survey' : 'instead-of-survey'} composition`);
          const realShipyardOpen = item.shipyard
            ? await activateRealControl(opener, `${vp.label} Shipyard opener`)
            : null;
          const realInventoryOpen = item.inventory
            ? await activateRealControl(opener, `${vp.label} Inventory opener`)
            : null;
          if (item.shipyard && !realShipyardOpen?.ok) {
            recordInstrumentFailure(`${vp.label}: Shipyard did not receive real visible-opener input (${JSON.stringify(realShipyardOpen)})`);
          }
          if (item.inventory && !realInventoryOpen?.ok) {
            recordInstrumentFailure(`${vp.label}: Inventory did not receive real visible-opener input (${JSON.stringify(realInventoryOpen)})`);
          }
          if (!item.shipyard && !item.inventory) {
            await evalIn(`(()=>{ const b=document.querySelector(${JSON.stringify(opener)}); b?.focus(); b?.click(); })()`);
          }
          if (item.shipyard) {
            const shipyardSettlementExpression = `(()=>{const S=window.__CF_SLICE__,s=S?.api?.state?.(),p=s?.persistence||null,
              r=p?.runtime||null,e=s?.engineering||null,x=s?.sceneResources||null,d=S?.api?.shipyardDiagnostics?.()||null;
              const previews=[...document.querySelectorAll('[data-cf-shipyard-preview="v1"]')];
              return {schema:${JSON.stringify(GLASS_SHIPYARD_SETTLEMENT_SCHEMA)},panelOpen:s?.panelOpen??null,
                cardOpen:s?.cardOpen??null,previewCount:previews.length,
                appStateKey:s?.shipVisual?.stateKey??null,
                previewStateKeys:previews.map((preview)=>preview.getAttribute('data-state-key')),
                engineering:e?{schema:e.schema??null,stateKind:e.stateKind??null,protection:e.protection??null,
                  bootstrapPending:e.bootstrapPending??null,bootstrapCandidateReady:e.bootstrapCandidateReady??null}:null,
                persistence:p?{schema:p.schema??null,hold:p.hold??null,mutationBlocked:p.mutationBlocked??null,
                  seedBootstrapPending:p.seedBootstrapPending??null,bootRouteRepairPending:p.bootRouteRepairPending??null,
                  productBootstrapPending:p.productBootstrapPending??null,engineeringBootstrapPending:p.engineeringBootstrapPending??null,
                  runtime:r?{leaseOwned:r.leaseOwned??null,staleBlocked:r.staleBlocked??null}:null}:null,
                sceneResources:x?{schema:x.schema??null,pendingPersistenceWrites:x.pendingPersistenceWrites??null}:null,
                diagnostics:d};})()`;
            await waitFor(`${item.name} panel`, shipyardSettlementExpression, 5000,
              (value) => shipyardPanelSettlementOutcome(value, overSurvey).ok);
          } else {
            await waitFor(`${item.name} panel`, `window.__CF_SLICE__.api.state().panelOpen===${JSON.stringify(item.id)} && document.querySelectorAll(${JSON.stringify(item.required)}).length>=${item.min} && window.__CF_SLICE__.api.state().cardOpen===${JSON.stringify(overSurvey)}`);
          }
          const composition = `${item.name}-${overSurvey ? 'over' : 'instead-of'}-survey`;
          const inventoryCarrier = item.inventory ? await evalIn(READ_ARC2_GLASS_CARRIER_EXPRESSION) : null;
          const inventoryRowsCheck = item.inventory
            ? `window.__CF_GLASS_AUDIT__.inventoryRowsOutcome(${JSON.stringify(inventoryCarrier)},${JSON.stringify(opener)})`
            : null;
          const shipyardOpenCheck = item.shipyard ? `(()=>{ const S=window.__CF_SLICE__,state=S?.api?.state?.(),
            ship=state?.shipVisual,diag=S?.api?.shipyardDiagnostics?.(),eng=diag?.engineering,
            panel=document.getElementById('shipyardpanel'),body=panel?.querySelector('[data-engineering-panel-body]'),
            opener=document.querySelector(${JSON.stringify(opener)}),close=panel?.querySelector(':scope > [data-pnx="shipyard"]'),
            previews=panel?[...panel.querySelectorAll('[data-cf-shipyard-preview="v1"]')]:[],preview=previews[0]||null,
            canonicalSystemIds=['jumpdrive','array','igdrive','autoext','cscoop'],canonicalHardpointIds=['array','autoext','cscoop'],
            expectedSystems=Array.isArray(ship?.installedSystemIds)?[...ship.installedSystemIds]:[],
            domSystems=panel?[...panel.querySelectorAll('[data-shipyard-system]')].map(node=>node.getAttribute('data-shipyard-system')):[],
            hardpointKeys=ship?.hardpoints?Object.keys(ship.hardpoints):[],
            expectedHardpoints=ship?.hardpoints?canonicalHardpointIds.filter((id)=>ship.hardpoints[id]===true):[],
            domHardpoints=preview?[...preview.querySelectorAll('[data-hardpoint]')].map(node=>node.getAttribute('data-hardpoint')):[],
            expectedResearch=${JSON.stringify(ENGINEERING_RESEARCH_IDS)},
            expectedResearchOracle=${JSON.stringify(ENGINEERING_GLASS_RESEARCH_ORACLE)},
            research=panel?[...panel.querySelectorAll('[data-research-id]')].map((row)=>{const button=row.querySelector('button[data-engineering-action="research"]');
              return {id:row.getAttribute('data-research-id'),order:Number(row.getAttribute('data-row-order')),
                status:row.getAttribute('data-status'),modelEnabled:button?.getAttribute('data-model-enabled')??null,
                disabled:button?.disabled??null,ariaDisabled:button?.getAttribute('aria-disabled')??null}}):[],
            expectedGroups=${JSON.stringify(ENGINEERING_RECIPE_GROUPS)},
            groups=panel?[...panel.querySelectorAll('[data-fabrication-group]')].map((group)=>({id:group.getAttribute('data-fabrication-group'),
              order:Number(group.getAttribute('data-group-order')),recipes:[...group.querySelectorAll(':scope > .engineering-row-list > [data-recipe-id]')]
                .map((row)=>{const button=row.querySelector('button[data-engineering-action="fabricate"]');return {
                  id:row.getAttribute('data-recipe-id'),category:row.getAttribute('data-recipe-category'),
                  order:Number(row.getAttribute('data-row-order')),status:row.getAttribute('data-status'),
                  effectSupport:row.getAttribute('data-effect-support'),modelEnabled:button?.getAttribute('data-model-enabled')??null,
                  disabled:button?.disabled??null,ariaDisabled:button?.getAttribute('aria-disabled')??null}})})):[],
            recipeIds=groups.flatMap((group)=>group.recipes.map((row)=>row.id)),
            expectedRecipeIds=${JSON.stringify(ENGINEERING_RECIPE_IDS)},
            expectedRecipeOracle=${JSON.stringify(ENGINEERING_GLASS_RECIPE_ORACLE)},
            sections=panel?[...panel.querySelectorAll('details[data-engineering-section]')]:[],
            sectionIds=sections.map((node)=>node.getAttribute('data-engineering-section')),
            summaries=sections.map((node)=>node.querySelector(':scope > summary')).filter(Boolean),
            actions=panel?[...panel.querySelectorAll('button[data-engineering-action]')]:[],
            actionKeys=actions.map((button)=>button.getAttribute('data-engineering-action')+':'+(button.getAttribute('data-action-id')||'')),
            expectedActionKeys=['mine:','skim:',...expectedResearch.map((id)=>'research:'+id),...expectedRecipeIds.map((id)=>'fabricate:'+id)],
            actionRects=actions.map((button)=>button.getBoundingClientRect()),summaryRects=summaries.map((summary)=>summary.getBoundingClientRect()),
            panelStyle=panel?getComputedStyle(panel):null,openerStyle=opener?getComputedStyle(opener):null,
            pr=panel?.getBoundingClientRect(),br=body?.getBoundingClientRect(),cr=close?.getBoundingClientRect(),
            hit=cr?document.elementFromPoint((cr.left+cr.right)/2,(cr.top+cr.bottom)/2):null,
            diagKeys=diag?Object.keys(diag).sort():[],expectedDiagKeys=['activePreviewCount','engineering','pendingPreviewWork','retainedPreviewCount','schema','stateKey','status'].sort(),
            engKeys=eng?Object.keys(eng).sort():[],expectedEngKeys=['actionControlCount','activeCount','activePreviewCount','delegatedListenerCount','faultCount','lastRequest','pendingWork','previewStateKey','retainedDomCount','retainedPreviewCount','schema'].sort(),
            stateKey=typeof ship?.stateKey==='string'&&ship.stateKey?ship.stateKey:null,
            canonicalIds=JSON.stringify(hardpointKeys)===JSON.stringify(canonicalHardpointIds)
              &&JSON.stringify(expectedSystems)===JSON.stringify(canonicalSystemIds.filter((id)=>expectedSystems.includes(id)))
              &&canonicalHardpointIds.every((id)=>ship?.hardpoints?.[id]===expectedSystems.includes(id)),
            stateMatch=!!preview&&stateKey!==null&&canonicalIds&&diag?.stateKey===stateKey&&preview.getAttribute('data-state-key')===stateKey
              &&Number(preview.getAttribute('data-chassis-stage'))===ship?.chassisStage
              &&preview.getAttribute('data-provenance')===ship?.provenance
              &&JSON.stringify(domHardpoints)===JSON.stringify(expectedHardpoints)
              &&JSON.stringify(domSystems)===JSON.stringify(expectedSystems),
            researchTruth=JSON.stringify(research.map(({id,status,modelEnabled,disabled})=>({id,status,modelEnabled,disabled})))
              ===JSON.stringify(expectedResearchOracle)&&research.every((row)=>row.ariaDisabled===String(row.disabled)),
            researchMatch=research.length===6&&JSON.stringify(research.map((row)=>row.id))===JSON.stringify(expectedResearch)
              &&research.every((row,index)=>row.order===index)&&researchTruth,
            groupsMatch=groups.length===5&&groups.every((group,index)=>group.id===expectedGroups[index]?.id&&group.order===index
              &&JSON.stringify(group.recipes.map((row)=>row.id))===JSON.stringify(expectedGroups[index]?.recipes)
              &&group.recipes.every((row,rowIndex)=>row.order===rowIndex&&row.category===group.id)),
            recipeTruth=JSON.stringify(groups.flatMap((group)=>group.recipes)
              .map(({id,status,effectSupport,modelEnabled,disabled})=>({id,status,effectSupport,modelEnabled,disabled})))
              ===JSON.stringify(expectedRecipeOracle)
              &&groups.every((group)=>group.recipes.every((row)=>row.ariaDisabled===String(row.disabled))),
            recipeMatch=recipeIds.length===62&&new Set(recipeIds).size===62&&JSON.stringify(recipeIds)===JSON.stringify(expectedRecipeIds)
              &&recipeTruth,
            actionInventory=actions.length===${ENGINEERING_ACTION_CONTROL_COUNT}&&eng?.actionControlCount===${ENGINEERING_ACTION_CONTROL_COUNT}
              &&JSON.stringify(actionKeys)===JSON.stringify(expectedActionKeys)&&actions.every((button)=>button.tagName==='BUTTON'
                &&button.getAttribute('aria-disabled')===String(button.disabled)
                &&button.disabled===(button.getAttribute('data-model-enabled')!=='true')),
            diagnostics=diag?.schema==='cf-v2-shipyard-diagnostics/v1'&&diag?.status==='open'
              &&diag?.activePreviewCount===1&&diag?.retainedPreviewCount===0&&diag?.pendingPreviewWork===0
              &&JSON.stringify(diagKeys)===JSON.stringify(expectedDiagKeys)
              &&eng?.schema==='cf-v2-engineering-panel-diagnostics/v1'&&eng?.activeCount===1
              &&eng?.pendingWork===0&&eng?.activePreviewCount===1&&eng?.previewStateKey===stateKey
              &&diag?.stateKey===eng?.previewStateKey&&eng?.retainedPreviewCount===0
              &&eng?.delegatedListenerCount===1&&eng?.faultCount===0&&eng?.lastRequest===null
              &&eng?.retainedDomCount>${ENGINEERING_ACTION_CONTROL_COUNT}
              &&JSON.stringify(engKeys)===JSON.stringify(expectedEngKeys),
            geometry=!!panel&&panelStyle?.display!=='none'&&panelStyle?.visibility!=='hidden'&&!!pr&&!!br
              &&pr.left>=-1&&pr.right<=innerWidth+1&&pr.width<=innerWidth+1&&body.scrollWidth<=panel.clientWidth+1
              &&!!close&&cr.width>=44&&cr.height>=44&&!!hit&&(hit===close||close.contains(hit))
              &&sectionIds.join('|')==='mining|skimming|research|fabricator'&&sections.every((section)=>section.open)
              &&summaries.length===4&&summaryRects.every((rect)=>rect.width>0&&rect.height>=44&&rect.left>=br.left-1&&rect.right<=br.right+1)
              &&actionRects.length===${ENGINEERING_ACTION_CONTROL_COUNT}&&actionRects.every((rect)=>rect.width>0&&rect.height>=44&&rect.left>=br.left-1&&rect.right<=br.right+1),
            openerReady=!!opener&&openerStyle?.display!=='none'&&openerStyle?.visibility!=='hidden'
              &&opener.getClientRects().length===1&&opener.getAttribute('aria-controls')==='shipyardpanel'
              &&opener.getAttribute('aria-expanded')==='true',
            previewA11y=previews.length===1&&preview?.getAttribute('role')==='img'
              &&(preview?.getAttribute('aria-label')||'').trim().length>=30
              &&panel?.querySelectorAll('[role="img"]').length===1;
            return {ok:stateMatch&&researchMatch&&groupsMatch&&recipeMatch&&actionInventory&&diagnostics&&geometry
                &&openerReady&&previewA11y&&document.activeElement===close,
              stateMatch,researchMatch,researchTruth,groupsMatch,recipeMatch,recipeTruth,actionInventory,diagnostics,geometry,openerReady,previewA11y,
              focus:document.activeElement?.id||document.activeElement?.getAttribute?.('data-focus-key')||null,
              stateKey,stage:ship?.chassisStage??null,provenance:ship?.provenance??null,canonicalIds,hardpointKeys,
              expectedHardpoints,domHardpoints,expectedSystems,domSystems,previewCount:previews.length,
              research,groups,recipeCount:recipeIds.length,actionCount:actions.length,sectionIds,
              diag,diagKeys,expectedDiagKeys,engKeys,expectedEngKeys,panelRect:pr?[pr.left,pr.top,pr.right,pr.bottom]:null,
              bodyWidth:br?.width??null,bodyScrollWidth:body?.scrollWidth??null,
              closeRect:cr?[cr.left,cr.top,cr.right,cr.bottom]:null};})()` : null;
          if (item.shipyard) {
            const engineeringDisclosureReceipts = [];
            for (const id of ['mining', 'mining', 'skimming', 'research', 'fabricator']) {
              const beforeOpen = await evalIn(`document.querySelector('#shipyardpanel details[data-engineering-section="${id}"]')?.open??null`);
              const receipt = await activateRealKeyboardControl(
                `#shipyardpanel details[data-engineering-section="${id}"] > summary`,
                `${vp.label} Engineering ${id} disclosure`,
              );
              const afterOpen = await evalIn(`document.querySelector('#shipyardpanel details[data-engineering-section="${id}"]')?.open??null`);
              engineeringDisclosureReceipts.push({ id, beforeOpen, afterOpen,
                ...receipt, ok: receipt.ok && typeof beforeOpen === 'boolean' && afterOpen === !beforeOpen });
            }
            const disclosuresSettled = await waitFor(`${item.name} Engineering disclosures`,
              `(()=>{const rows=[...document.querySelectorAll('#shipyardpanel details[data-engineering-section]')];
                return rows.length===4&&rows.every((row)=>row.open)?true:null})()`);
            await evalIn(`document.querySelector('#shipyardpanel > [data-pnx="shipyard"]')?.focus()`);
            addOutcome(vp.label, composition, 'SHIPYARD_REAL_OPENER', opener, realShipyardOpen,
              'the one visible Shipyard opener receives real browser pointer input');
            const shipyardOpenState = await evalIn(shipyardOpenCheck);
            const keyboardDisclosures = disclosuresSettled === true
              && engineeringDisclosureReceipts.length === 5
              && engineeringDisclosureReceipts.every((receipt) => receipt.ok);
            const shipyardOpen = {
              ...shipyardOpenState,
              ok: shipyardOpenState.ok && keyboardDisclosures,
              keyboardDisclosures,
              engineeringDisclosureReceipts,
            };
            addOutcome(vp.label, composition, 'SHIPYARD_STATE_TRUTH', item.panel, shipyardOpen,
              'native keyboard disclosures expose exactly six research rows and 62 grouped fixed recipes; one preview, 70 honest 44px actions, diagnostics, and canonical ShipVisualState all agree');
            if (!shipyardControlRun) {
              const effectSupportControl = await evalIn(`(()=>{const row=document.querySelector('#shipyardpanel [data-recipe-id="earpiece"]'),
                prior=row?.getAttribute('data-effect-support')??null;if(!row||prior===null)return {ok:false,why:'earpiece recipe/effect-support missing'};
                let baseline=null,broken=null,restored=null,error=null;
                try{baseline=${shipyardOpenCheck};row.setAttribute('data-effect-support','unavailable');broken=${shipyardOpenCheck};}
                catch(cause){error=String(cause?.message||cause);}
                finally{row.setAttribute('data-effect-support',prior);}
                try{restored=${shipyardOpenCheck};}catch(cause){error=error||String(cause?.message||cause);}
                return {ok:error===null&&prior==='live'&&baseline?.ok===true&&broken?.ok===false&&broken?.recipeTruth===false
                  &&broken.recipeMatch===false&&broken.stateMatch===true&&broken.researchMatch===true
                  &&broken.groupsMatch===true&&broken.actionInventory===true&&broken.diagnostics===true
                  &&broken.geometry===true&&broken.openerReady===true&&broken.previewA11y===true
                  &&restored?.ok===true&&row.getAttribute('data-effect-support')===prior,
                  prior,after:row.getAttribute('data-effect-support'),baseline,broken,restored,error};})()`);
              if (!effectSupportControl?.ok) {
                recordInstrumentFailure(`${vp.label}: contact-effect Shipyard oracle mutation did not turn recipe truth red in isolation and restore (${JSON.stringify(effectSupportControl)})`);
              }
              recordControls('shipyard-contact-effect-oracle');
              const duplicateControl = await evalIn(`(()=>{const panel=document.getElementById('shipyardpanel'),
                preview=panel?.querySelector('[data-cf-shipyard-preview="v1"]'),duplicate=preview?.cloneNode(true);
                if(duplicate)panel.appendChild(duplicate);const result=${shipyardOpenCheck};duplicate?.remove();
                return {rejected:result.ok===false,previewCount:result.previewCount,restored:${shipyardOpenCheck}};})()`);
              if (!duplicateControl.rejected || duplicateControl.previewCount !== 2 || !duplicateControl.restored?.ok) {
                recordInstrumentFailure(`${vp.label}: duplicate Shipyard preview control did not reject and restore (${JSON.stringify(duplicateControl)})`);
              }
              recordControls('shipyard-preview-uniqueness');

              const parityControl = await evalIn(`(()=>{const panel=document.getElementById('shipyardpanel'),
                preview=panel?.querySelector('[data-cf-shipyard-preview="v1"]'),substitute=preview?.cloneNode(true),
                priorKey=preview?.getAttribute('data-state-key'),
                fakeHardpoint=document.createElementNS('http://www.w3.org/2000/svg','g'),fakeSystem=document.createElement('div'),
                researchList=panel?.querySelector('[data-engineering-research-rows]'),firstResearch=researchList?.firstElementChild,
                secondResearch=firstResearch?.nextElementSibling,recipe=panel?.querySelector('[data-recipe-id]'),duplicateRecipe=recipe?.cloneNode(true),
                firstGroup=panel?.querySelector('[data-fabrication-group]'),priorGroup=firstGroup?.getAttribute('data-fabrication-group'),
                researchAction=firstResearch?.querySelector('button[data-engineering-action="research"]'),
                researchStatusNode=firstResearch?.querySelector('[data-row-status]'),
                priorResearchStatus=firstResearch?.getAttribute('data-status')??null,
                priorResearchModel=researchAction?.getAttribute('data-model-enabled')??null,
                priorResearchDisabled=researchAction?.disabled??null,
                priorResearchAria=researchAction?.getAttribute('aria-disabled')??null,
                priorResearchReason=researchAction?.getAttribute('data-disabled-reason')??null,
                priorResearchStatusRow=researchStatusNode?{text:researchStatusNode.textContent,row:researchStatusNode.getAttribute('data-row-status'),
                  unavailable:researchStatusNode.getAttribute('data-engineering-unavailable'),kind:researchStatusNode.getAttribute('data-unavailable-kind')}:null,
                coherentAction=recipe?.querySelector('button[data-engineering-action="fabricate"]'),
                coherentStatusNode=recipe?.querySelector('[data-row-status]'),
                priorCoherentStatus=recipe?.getAttribute('data-status')??null,
                priorCoherentModel=coherentAction?.getAttribute('data-model-enabled')??null,
                priorCoherentDisabled=coherentAction?.disabled??null,
                priorCoherentAria=coherentAction?.getAttribute('aria-disabled')??null,
                priorCoherentReason=coherentAction?.getAttribute('data-disabled-reason')??null,
                priorStatusRow=coherentStatusNode?{text:coherentStatusNode.textContent,row:coherentStatusNode.getAttribute('data-row-status'),
                  unavailable:coherentStatusNode.getAttribute('data-engineering-unavailable'),kind:coherentStatusNode.getAttribute('data-unavailable-kind')}:null,
                action=panel?.querySelector('button[data-engineering-action]'),priorDisabled=action?.disabled??null,
                priorAriaDisabled=action?.getAttribute('aria-disabled')??null;
                if(preview&&substitute)preview.replaceWith(substitute);const substituted=${shipyardOpenCheck};
                if(substitute?.isConnected)substitute.replaceWith(preview);const substitutionRestored=${shipyardOpenCheck};
                preview?.setAttribute('data-state-key','ship-v1:tampered');const key=${shipyardOpenCheck};
                if(priorKey===null)preview?.removeAttribute('data-state-key');else preview?.setAttribute('data-state-key',priorKey);
                fakeHardpoint.setAttribute('data-hardpoint','autoext');preview?.appendChild(fakeHardpoint);const hardpoint=${shipyardOpenCheck};fakeHardpoint.remove();
                fakeSystem.setAttribute('data-shipyard-system','cscoop');panel?.appendChild(fakeSystem);const system=${shipyardOpenCheck};fakeSystem.remove();
                if(firstResearch&&secondResearch)researchList.insertBefore(secondResearch,firstResearch);const researchOrder=${shipyardOpenCheck};
                if(firstResearch&&secondResearch)researchList.insertBefore(firstResearch,secondResearch);
                firstResearch?.setAttribute('data-status','available');if(researchStatusNode){researchStatusNode.textContent='Available';
                  researchStatusNode.setAttribute('data-row-status','available');researchStatusNode.removeAttribute('data-engineering-unavailable');
                  researchStatusNode.removeAttribute('data-unavailable-kind');}if(researchAction){researchAction.setAttribute('data-model-enabled','true');
                  researchAction.setAttribute('data-disabled-reason','Research is available.');researchAction.disabled=false;
                  researchAction.setAttribute('aria-disabled','false');}const coherentResearchApplied=!!firstResearch&&!!researchStatusNode&&!!researchAction
                  &&firstResearch.getAttribute('data-status')==='available'&&researchStatusNode.textContent==='Available'
                  &&researchStatusNode.getAttribute('data-row-status')==='available'&&!researchStatusNode.hasAttribute('data-engineering-unavailable')
                  &&!researchStatusNode.hasAttribute('data-unavailable-kind')&&researchAction.getAttribute('data-model-enabled')==='true'
                  &&researchAction.getAttribute('data-disabled-reason')==='Research is available.'&&researchAction.disabled===false
                  &&researchAction.getAttribute('aria-disabled')==='false',coherentResearchStatus=${shipyardOpenCheck};
                if(priorResearchStatus===null)firstResearch?.removeAttribute('data-status');else firstResearch?.setAttribute('data-status',priorResearchStatus);
                if(researchAction&&priorResearchDisabled!==null){if(priorResearchModel===null)researchAction.removeAttribute('data-model-enabled');
                  else researchAction.setAttribute('data-model-enabled',priorResearchModel);researchAction.disabled=priorResearchDisabled;
                  if(priorResearchAria===null)researchAction.removeAttribute('aria-disabled');else researchAction.setAttribute('aria-disabled',priorResearchAria);
                  if(priorResearchReason===null)researchAction.removeAttribute('data-disabled-reason');else researchAction.setAttribute('data-disabled-reason',priorResearchReason);}
                if(researchStatusNode&&priorResearchStatusRow){researchStatusNode.textContent=priorResearchStatusRow.text;
                  if(priorResearchStatusRow.row===null)researchStatusNode.removeAttribute('data-row-status');else researchStatusNode.setAttribute('data-row-status',priorResearchStatusRow.row);
                  if(priorResearchStatusRow.unavailable===null)researchStatusNode.removeAttribute('data-engineering-unavailable');else researchStatusNode.setAttribute('data-engineering-unavailable',priorResearchStatusRow.unavailable);
                  if(priorResearchStatusRow.kind===null)researchStatusNode.removeAttribute('data-unavailable-kind');else researchStatusNode.setAttribute('data-unavailable-kind',priorResearchStatusRow.kind);}
                const coherentResearchRestored=!!firstResearch&&!!researchStatusNode&&!!researchAction
                  &&(firstResearch.getAttribute('data-status')??null)===priorResearchStatus
                  &&(researchAction.getAttribute('data-model-enabled')??null)===priorResearchModel
                  &&researchAction.disabled===priorResearchDisabled&&(researchAction.getAttribute('aria-disabled')??null)===priorResearchAria
                  &&(researchAction.getAttribute('data-disabled-reason')??null)===priorResearchReason
                  &&researchStatusNode.textContent===priorResearchStatusRow?.text
                  &&(researchStatusNode.getAttribute('data-row-status')??null)===priorResearchStatusRow?.row
                  &&(researchStatusNode.getAttribute('data-engineering-unavailable')??null)===priorResearchStatusRow?.unavailable
                  &&(researchStatusNode.getAttribute('data-unavailable-kind')??null)===priorResearchStatusRow?.kind;
                recipe?.parentNode?.appendChild(duplicateRecipe);const recipeDuplication=${shipyardOpenCheck};duplicateRecipe?.remove();
                firstGroup?.setAttribute('data-fabrication-group','tampered-group');const groupIdentity=${shipyardOpenCheck};
                if(priorGroup===null)firstGroup?.removeAttribute('data-fabrication-group');else firstGroup?.setAttribute('data-fabrication-group',priorGroup);
                recipe?.setAttribute('data-status','unavailable');if(coherentStatusNode){coherentStatusNode.textContent='Unavailable · Fixture-coherent wrong status.';
                  coherentStatusNode.setAttribute('data-row-status','unavailable');coherentStatusNode.setAttribute('data-engineering-unavailable','Fixture-coherent wrong status.');
                  coherentStatusNode.setAttribute('data-unavailable-kind','fabrication');}if(coherentAction){coherentAction.setAttribute('data-model-enabled','false');
                  coherentAction.setAttribute('data-disabled-reason','Fixture-coherent wrong status.');coherentAction.disabled=true;coherentAction.setAttribute('aria-disabled','true');}
                const coherentStatus=${shipyardOpenCheck};
                if(priorCoherentStatus===null)recipe?.removeAttribute('data-status');else recipe?.setAttribute('data-status',priorCoherentStatus);
                if(coherentAction&&priorCoherentDisabled!==null){if(priorCoherentModel===null)coherentAction.removeAttribute('data-model-enabled');
                  else coherentAction.setAttribute('data-model-enabled',priorCoherentModel);coherentAction.disabled=priorCoherentDisabled;
                  if(priorCoherentAria===null)coherentAction.removeAttribute('aria-disabled');else coherentAction.setAttribute('aria-disabled',priorCoherentAria);
                  if(priorCoherentReason===null)coherentAction.removeAttribute('data-disabled-reason');else coherentAction.setAttribute('data-disabled-reason',priorCoherentReason);}
                if(coherentStatusNode&&priorStatusRow){coherentStatusNode.textContent=priorStatusRow.text;
                  if(priorStatusRow.row===null)coherentStatusNode.removeAttribute('data-row-status');else coherentStatusNode.setAttribute('data-row-status',priorStatusRow.row);
                  if(priorStatusRow.unavailable===null)coherentStatusNode.removeAttribute('data-engineering-unavailable');else coherentStatusNode.setAttribute('data-engineering-unavailable',priorStatusRow.unavailable);
                  if(priorStatusRow.kind===null)coherentStatusNode.removeAttribute('data-unavailable-kind');else coherentStatusNode.setAttribute('data-unavailable-kind',priorStatusRow.kind);}
                if(action){action.disabled=!action.disabled;action.setAttribute('aria-disabled',String(action.disabled));}
                const actionParity=${shipyardOpenCheck};if(action&&priorDisabled!==null){action.disabled=priorDisabled;
                  if(priorAriaDisabled===null)action.removeAttribute('aria-disabled');else action.setAttribute('aria-disabled',priorAriaDisabled);}
                return {ok:substituted.ok===false&&substituted.previewCount===1&&substituted.stateMatch===false
                    &&substituted.diagnostics===false&&substituted.diag?.stateKey===null
                    &&substituted.diag?.engineering?.previewStateKey===null
                    &&substituted.diag?.engineering?.activePreviewCount===0
                    &&substituted.diag?.engineering?.retainedPreviewCount>0
                    &&substituted.diag?.engineering?.faultCount>0&&substitutionRestored.ok===true
                    &&key.ok===false&&hardpoint.ok===false&&system.ok===false
                    &&researchOrder.ok===false&&researchOrder.researchMatch===false
                    &&coherentResearchApplied&&coherentResearchRestored
                    &&coherentResearchStatus.ok===false&&coherentResearchStatus.researchMatch===false
                    &&coherentResearchStatus.researchTruth===false&&coherentResearchStatus.actionInventory===true
                    &&recipeDuplication.ok===false&&recipeDuplication.recipeMatch===false
                    &&groupIdentity.ok===false&&groupIdentity.groupsMatch===false
                    &&coherentStatus.ok===false&&coherentStatus.recipeMatch===false
                    &&coherentStatus.recipeTruth===false&&coherentStatus.actionInventory===true
                    &&actionParity.ok===false&&actionParity.actionInventory===false&&${shipyardOpenCheck}.ok,
                  substituted,substitutionRestored,key,hardpoint,system,researchOrder,coherentResearchApplied,coherentResearchStatus,coherentResearchRestored,
                  recipeDuplication,groupIdentity,coherentStatus,actionParity};})()`);
              if (!parityControl.ok) {
                recordInstrumentFailure(`${vp.label}: Engineering state/research/group/recipe parity controls stayed green or failed to restore (${JSON.stringify(parityControl)})`);
              }
              recordControls('shipyard-dom-state-parity');

              const openerControl = await evalIn(`(()=>{const opener=document.querySelector(${JSON.stringify(opener)}),
                priorStyle=opener?.getAttribute('style')??null,priorExpanded=opener?.getAttribute('aria-expanded')??null;
                opener?.style.setProperty('display','none','important');opener?.setAttribute('aria-expanded','false');
                const hidden=${shipyardOpenCheck};if(priorStyle===null)opener?.removeAttribute('style');else opener?.setAttribute('style',priorStyle);
                if(priorExpanded===null)opener?.removeAttribute('aria-expanded');else opener?.setAttribute('aria-expanded',priorExpanded);
                return {ok:hidden.ok===false&&${shipyardOpenCheck}.ok,hidden};})()`);
              if (!openerControl.ok) {
                recordInstrumentFailure(`${vp.label}: hidden/bypassed Shipyard opener control stayed green or failed to restore (${JSON.stringify(openerControl)})`);
              }
              recordControls('shipyard-opener-path');

              const geometryFocusControl = await evalIn(`(()=>{const panel=document.getElementById('shipyardpanel'),
                close=panel?.querySelector(':scope > [data-pnx="shipyard"]'),opener=document.querySelector(${JSON.stringify(opener)}),
                summary=panel?.querySelector('details[data-engineering-section] > summary'),
                action=panel?.querySelector('button[data-engineering-action]'),
                priorStyle=close?.getAttribute('style')??null,priorSummary=summary?.getAttribute('style')??null,
                priorAction=action?.getAttribute('style')??null,priorPanel=panel?.getAttribute('style')??null;
                close?.style.setProperty('min-width','0','important');
                close?.style.setProperty('min-height','0','important');close?.style.setProperty('width','20px','important');
                close?.style.setProperty('height','20px','important');opener?.focus();const broken=${shipyardOpenCheck};
                if(priorStyle===null)close?.removeAttribute('style');else close?.setAttribute('style',priorStyle);close?.focus();
                summary?.style.setProperty('min-height','0','important');summary?.style.setProperty('height','20px','important');
                const summaryFloor=${shipyardOpenCheck};if(priorSummary===null)summary?.removeAttribute('style');else summary?.setAttribute('style',priorSummary);
                action?.style.setProperty('min-height','0','important');action?.style.setProperty('height','20px','important');
                const actionFloor=${shipyardOpenCheck};if(priorAction===null)action?.removeAttribute('style');else action?.setAttribute('style',priorAction);
                panel?.style.setProperty('left','0','important');panel?.style.setProperty('right','auto','important');
                panel?.style.setProperty('min-width','calc(100vw + 80px)','important');panel?.style.setProperty('max-width','none','important');
                const overflow=${shipyardOpenCheck};if(priorPanel===null)panel?.removeAttribute('style');else panel?.setAttribute('style',priorPanel);close?.focus();
                return {ok:broken.ok===false&&broken.geometry===false&&summaryFloor.ok===false&&summaryFloor.geometry===false
                    &&actionFloor.ok===false&&actionFloor.geometry===false&&overflow.ok===false&&overflow.geometry===false
                    &&${shipyardOpenCheck}.ok,broken,summaryFloor,actionFloor,overflow};})()`);
              if (!geometryFocusControl.ok) {
                recordInstrumentFailure(`${vp.label}: Engineering Close/summary/action/320px geometry-focus controls stayed green or failed to restore (${JSON.stringify(geometryFocusControl)})`);
              }
              recordControls('shipyard-geometry-focus');
              await evalIn(`(()=>{const panel=document.getElementById('shipyardpanel'),preview=panel?.querySelector('[data-cf-shipyard-preview="v1"]'),
                body=panel?.querySelector('[data-engineering-panel-body]');window.__cfShipyardClosedControl=preview?.cloneNode(true)||null;
                window.__cfEngineeringClosedControl=body?.firstElementChild?.cloneNode(true)||null;
                return !!window.__cfShipyardClosedControl&&!!window.__cfEngineeringClosedControl;})()`);
            }
          }
          if (item.inventory) {
            addOutcome(vp.label, composition, 'INVENTORY_REAL_OPENER', opener, realInventoryOpen,
              'the one visible Inventory dock or right-rail opener receives real browser pointer input');
            addOutcome(vp.label, composition, 'INVENTORY_CARRIER_DOM_PARITY', item.panel,
              await evalIn(inventoryRowsCheck),
              'the durable Arc 2 carrier, runtime projection, and one bounded exact-instance DOM row per held or pending id agree');
            if (!inventoryControlRun) {
              const floorControl = await evalIn(`(()=>{const row=document.querySelector('#inventorypanel [data-inventory-row="exact"]'),
                prior=row?.getAttribute('style')??null;row?.style.setProperty('min-height','0','important');
                row?.style.setProperty('height','20px','important');const broken=${inventoryRowsCheck};
                if(prior===null)row?.removeAttribute('style');else row?.setAttribute('style',prior);
                return {ok:broken.ok===false&&broken.floor?.some(entry=>entry.height<44)&&${inventoryRowsCheck}.ok,broken};})()`);
              if (!floorControl.ok) {
                recordInstrumentFailure(`${vp.label}: undersized Inventory control stayed green or failed to restore (${JSON.stringify(floorControl)})`);
              }
              recordControls('inventory-control-floor');

              const missingControl = await evalIn(`(()=>{const row=document.querySelector('#inventorypanel [data-inventory-row="exact"]'),
                parent=row?.parentNode||null,next=row?.nextSibling||null;if(row)row.remove();const broken=${inventoryRowsCheck};
                if(row&&parent)parent.insertBefore(row,next);return {ok:broken.ok===false&&broken.durable===true
                  &&broken.runtimeMatch===true&&broken.rowsMatch===false&&${inventoryRowsCheck}.ok,broken};})()`);
              if (!missingControl.ok) {
                recordInstrumentFailure(`${vp.label}: missing exact Inventory row stayed green or failed to restore (${JSON.stringify(missingControl)})`);
              }
              recordControls('inventory-missing-row');

              const duplicateControl = await evalIn(`(()=>{const row=document.querySelector('#inventorypanel [data-inventory-row="exact"]'),
                duplicate=row?.cloneNode(true)||null;row?.parentNode?.appendChild(duplicate);const broken=${inventoryRowsCheck};duplicate?.remove();
                return {ok:broken.ok===false&&broken.durable===true&&broken.runtimeMatch===true
                  &&broken.rowsMatch===false&&broken.domRows.length===broken.expectedRows.length+1&&${inventoryRowsCheck}.ok,broken};})()`);
              if (!duplicateControl.ok) {
                recordInstrumentFailure(`${vp.label}: duplicate exact Inventory row stayed green or failed to restore (${JSON.stringify(duplicateControl)})`);
              }
              recordControls('inventory-duplicate-row');

              const poisonedRawCarrier = structuredClone(inventoryCarrier);
              const rawCarrierControlApplied = typeof poisonedRawCarrier?.carrierJson === 'string';
              if (rawCarrierControlApplied) poisonedRawCarrier.carrierJson += '\n';
              const rawIntegrityControl = await evalIn(`(()=>{const broken=window.__CF_GLASS_AUDIT__.inventoryRowsOutcome(
                ${JSON.stringify(poisonedRawCarrier)},${JSON.stringify(opener)}),restored=${inventoryRowsCheck};
                return {ok:${JSON.stringify(rawCarrierControlApplied)}&&broken.ok===false&&broken.durable===false
                  &&broken.runtimeMatch===true&&broken.rowsMatch===true&&restored.ok,broken,restored};})()`);
              const runtimeParityControl = await evalIn(`(()=>{const S=window.__CF_SLICE__,prior=S?.api?.state;
                if(typeof prior!=='function')return {ok:false,why:'runtime state owner missing'};const snapshot=prior(),
                  bindings=(snapshot.inventory?.equippedBindings||[]).map(binding=>({...binding}));
                if(bindings.length)bindings[0]={...bindings[0],instanceId:String(bindings[0].instanceId)+':runtime-only-poison'};
                else bindings.push({slot:'control',instanceId:'runtime-only-poison'});
                let broken=null,controlApplied=false;try{S.api.state=()=>{const current=prior();return {...current,
                  inventory:{...current.inventory,equippedBindings:bindings.map(binding=>({...binding}))}}};
                  controlApplied=JSON.stringify(S.api.state().inventory.equippedBindings)===JSON.stringify(bindings);
                  broken=${inventoryRowsCheck};}finally{S.api.state=prior;}
                const restored=${inventoryRowsCheck};return {ok:controlApplied&&S.api.state===prior&&broken?.ok===false
                  &&broken?.durable===true&&broken?.runtimeMatch===false&&broken?.rowsMatch===true&&restored.ok,
                  controlApplied,restoredOwner:S.api.state===prior,broken,restored};})()`);
              if (!rawIntegrityControl.ok || !runtimeParityControl.ok) {
                recordInstrumentFailure(`${vp.label}: raw/runtime Inventory authority controls were not independent or failed to restore (${JSON.stringify({ rawIntegrityControl, runtimeParityControl })})`);
              }
              recordControls('inventory-raw-authority-parity');

              const pagerContrastOptions = { surface: 'inventory-pager-contrast-control', root: '#inventorypanel',
                textMin: 1, targetFloor, safe: vp.safe || {}, fitSelectors: [], interactiveRoots: [],
                contrastSelectors: ['#inventorypanel .inventory-pager'], maxContrastReports: 8, overlapPairs: [] };
              const pagerContrastControl = await evalIn(`(()=>{const button=document.querySelector('#inventorypanel .inventory-pager button:disabled'),
                prior=button?.getAttribute('style')??null;if(button)button.style.setProperty('opacity','.45','important');
                const broken=window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(pagerContrastOptions)});
                if(button){if(prior===null)button.removeAttribute('style');else button.setAttribute('style',prior);}
                const restored=window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(pagerContrastOptions)}),
                  brokenLow=broken.some(row=>row.code==='TEXT_CONTRAST_LOW'&&row.actual?.sample==='‹'),
                  restoredLow=restored.some(row=>row.code==='TEXT_CONTRAST_LOW'),after=button?.getAttribute('style')??null,
                  styleRestored=(${sameInlineStyleAttribute.toString()})(prior,after);
                return {ok:!!button&&brokenLow&&!restoredLow&&styleRestored,
                  brokenLow,restoredLow,styleRestored,prior,after,broken,restored};})()`);
              if (!pagerContrastControl.ok) {
                recordInstrumentFailure(`${vp.label}: disabled Inventory pager contrast injection stayed green or failed to restore (${JSON.stringify(pagerContrastControl)})`);
              }
              recordControls('inventory-disabled-pager-contrast');
            }
          }
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
          const ordinaryPanelAuditOptions = {
            ...common, surface: composition, root: item.panel, textMin: item.textMin,
            required: [{ selector: '[data-pnx]', min: 1 }, { selector: item.required, min: item.min }],
            fitSelectors: [item.panel], interactiveRoots: [item.panel], contrastSelectors: [item.panel, opener],
            maxContrastReports: 16, overlapPairs: item.inventory ? [[item.panel, '#dock']] : [],
          };
          add(vp.label, composition, await audit(ordinaryPanelAuditOptions));
          if (item.id === 'codex' && !rarityContrastControlRun) {
            rarityContrastControlRun = true;
            const rarityContrastControl = await evalIn(`(()=>{const target=[...document.querySelectorAll('#codexpanel [data-sel="codex-row-rarity"]')]
              .find(node=>(node.textContent||'').trim()==='Exotic'),prior=target?.getAttribute('style')??null,
              options={surface:'compendium-rarity-contrast-control',root:'#codexpanel',textMin:1,interactiveRoots:[],
                contrastSelectors:['#codexpanel [data-sel="codex-row-rarity"]'],maxContrastReports:16},
              exotic=(rows)=>rows.filter(row=>row.code==='TEXT_CONTRAST_LOW'&&row.actual?.sample==='Exotic');
              if(!target||prior===null)return {ok:false,why:'visible Exotic rarity target missing',count:document.querySelectorAll('#codexpanel [data-sel="codex-row-rarity"]').length};
              let baseline=[],broken=[],restored=[],error=null;
              try{baseline=exotic(window.__CF_GLASS_AUDIT__.audit(options));
                target.style.setProperty('background-color','transparent','important');
                broken=exotic(window.__CF_GLASS_AUDIT__.audit(options));}
              catch(cause){error=String(cause?.message||cause);}
              finally{target.setAttribute('style',prior);}
              try{restored=exotic(window.__CF_GLASS_AUDIT__.audit(options));}
              catch(cause){error=error||String(cause?.message||cause);}
              const after=target.getAttribute('style');
              return {ok:error===null&&baseline.length===0&&broken.length===1&&broken[0]?.actual?.ratio<4.5
                &&restored.length===0&&(${sameInlineStyleAttribute.toString()})(prior,after),
                prior,after,baseline,broken,restored,error};})()`);
            if (!rarityContrastControl?.ok) {
              recordInstrumentFailure(`${vp.label}: opaque Exotic rarity contrast control stayed green or failed exact restoration (${JSON.stringify(rarityContrastControl)})`);
            }
            recordControls('rarity-opaque-contrast');
          }
          if (vp.label === 'phone-landscape' && item.id === 'codex') {
            /* Exercise the repaired short-landscape workspace against real
               virtual rows, not a convenient fixed-height surrogate. The
               fixture uses complete production-valid genomes and bounded
               hostile wrapping at the imported A++/Mono preference. */
            const baselineCodexCount = await evalIn('window.__CF_SLICE__.api.compendiumDiagnostics().panel.sourceCount');
            const hostileTargets = [
              { state: 'first', index: 0, id: hostileCompendiumRows[0][0] },
              { state: 'middle', index: 10, id: hostileCompendiumRows[10][0] },
              { state: 'last', index: 20, id: hostileCompendiumRows[20][0] },
            ];
            let hostileInstallAttempted = false;
            const hostileHeights = [];
            const shortClipIdentities = new Set();
            try {
              hostileInstallAttempted = true;
              const installed = await evalIn(`window.__CF_SLICE__.api.__compendiumEvidence.installFixture(${JSON.stringify(hostileCompendiumRows)})`);
              if (installed?.installed !== hostileCompendiumRows.length) throw new Error(`${vp.label}: hostile Compendium fixture installed ${JSON.stringify(installed)}`);
              await waitFor('hostile Compendium fixture', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();
                return d.panel.mode==='list'&&d.panel.sourceCount===${hostileCompendiumRows.length}
                  &&document.querySelector('#codexpanel [data-ci="0"]');})()`);

              const workspace = await evalIn(`(()=>{const panel=document.getElementById('codexpanel'),scroll=document.querySelector('[data-sel="codex-scroll"]'),
                survey=document.getElementById('survey'),search=document.getElementById('searchbox'),dock=document.getElementById('dock'),
                root=getComputedStyle(document.documentElement),yielded=['topbar','ctxbar','hintpill'].map(id=>{
                  const el=document.getElementById(id),style=el?getComputedStyle(el):null;return {id,visibility:style?.visibility||'missing',pointerEvents:style?.pointerEvents||'missing'};});
                if(!panel||!scroll||!survey||!search||!dock)return {ok:false,why:'missing panel/scroller/survey/Search/dock',yielded};
                const p=panel.getBoundingClientRect(),s=scroll.getBoundingClientRect(),v=survey.getBoundingClientRect(),
                  q=search.getBoundingClientRect(),d=dock.getBoundingClientRect(),intersects=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1,
                  safe={top:parseFloat(root.getPropertyValue('--safe-top'))||0,right:parseFloat(root.getPropertyValue('--safe-right'))||0,
                    bottom:parseFloat(root.getPropertyValue('--safe-bottom'))||0,left:parseFloat(root.getPropertyValue('--safe-left'))||0},
                  surveyStyle=getComputedStyle(survey),surveyVisible=surveyStyle.display!=='none'&&surveyStyle.visibility!=='hidden'&&v.width>0&&v.height>0,
                  retained=[search,dock].map((el)=>{const style=getComputedStyle(el),r=el.getBoundingClientRect();return {id:el.id,display:style.display,
                    visibility:style.visibility,pointerEvents:style.pointerEvents,rect:[r.left,r.top,r.right,r.bottom]};}),
                  overlaps={panelSurvey:intersects(p,v),panelSearch:intersects(p,q),panelDock:intersects(p,d),surveySearch:intersects(v,q),
                    surveyDock:intersects(v,d),searchDock:intersects(q,d)};
                return {ok:document.body.classList.contains('panel-open')&&document.body.classList.contains('fs-xl')
                    &&document.body.classList.contains('font-mono')&&yielded.every(row=>row.visibility==='hidden'&&row.pointerEvents==='none')
                    &&retained.every(row=>row.display!=='none'&&row.visibility==='visible'&&row.pointerEvents!=='none')
                    &&p.left>=safe.left-1&&p.top>=safe.top-1&&p.right<=innerWidth-safe.right+1&&p.bottom<=innerHeight-safe.bottom+1
                    &&q.left>=safe.left-1&&q.top>=safe.top-1&&q.right<=innerWidth-safe.right+1&&q.bottom<=innerHeight-safe.bottom+1
                    &&d.left>=safe.left-1&&d.top>=safe.top-1&&d.right<=innerWidth-safe.right+1&&d.bottom<=innerHeight-safe.bottom+1
                    &&surveyVisible&&v.left>=safe.left-1&&v.top>=safe.top-1&&v.right<=innerWidth-safe.right+1&&v.bottom<=innerHeight-safe.bottom+1
                    &&Object.values(overlaps).every(value=>value===false)
                    &&scroll.clientHeight>=243&&s.top>=p.top-1&&s.bottom<=p.bottom+1&&panel.scrollHeight<=panel.clientHeight+1,
                  safe,panel:[p.left,p.top,p.right,p.bottom],scroller:[s.left,s.top,s.right,s.bottom],scrollerHeight:scroll.clientHeight,
                  panelClientHeight:panel.clientHeight,panelScrollHeight:panel.scrollHeight,survey:[v.left,v.top,v.right,v.bottom],surveyVisible,
                  search:[q.left,q.top,q.right,q.bottom],dock:[d.left,d.top,d.right,d.bottom],overlaps,yielded,retained};})()`);
              addOutcome(vp.label, 'compendium-short-landscape', 'COMPENDIUM_SHORT_LANDSCAPE_WORKSPACE', '#codexpanel', workspace,
                'the A++ Compendium owns the safe-height left workspace while Search, dock, and Survey remain separate usable right-column surfaces');

              const nonModalChrome = await evalIn(`(()=>{const search=document.getElementById('searchbox'),dock=document.getElementById('dock'),
                dockButton=document.getElementById('dockcodex'),buttons=dock?[...dock.querySelectorAll('button')]:[],panel=document.getElementById('codexpanel');
                if(!(search instanceof HTMLInputElement)||!dock||!dockButton||!panel)return {ok:false,why:'Search/dock/Compendium missing'};
                const rendered=(el)=>{const style=getComputedStyle(el),r=el.getBoundingClientRect();return style.display!=='none'&&style.visibility==='visible'
                    &&style.pointerEvents!=='none'&&r.width>0&&r.height>0;},ownsCentre=(el)=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
                    return !!hit&&(hit===el||el.contains(hit));},named=(el)=>!!(el.getAttribute('aria-label')||el.textContent||'').trim(),
                  exposed=(el)=>!el.inert&&!el.closest('[inert],[aria-hidden="true"]'),positiveVisibility=rendered(search)&&rendered(dock)&&exposed(search)&&exposed(dock),
                  searchStyle=search.getAttribute('style'),dockStyle=dock.getAttribute('style'),dockAriaHidden=dock.getAttribute('aria-hidden');
                let hiddenSearchRejected=false,blockedDockRejected=false,hiddenDockA11yRejected=false;
                try{search.style.setProperty('visibility','hidden','important');hiddenSearchRejected=!rendered(search);}
                finally{if(searchStyle===null)search.removeAttribute('style');else search.setAttribute('style',searchStyle);}
                try{dock.style.setProperty('pointer-events','none','important');blockedDockRejected=!rendered(dock);}
                finally{if(dockStyle===null)dock.removeAttribute('style');else dock.setAttribute('style',dockStyle);}
                try{dock.setAttribute('aria-hidden','true');hiddenDockA11yRejected=!exposed(dock);}
                finally{if(dockAriaHidden===null)dock.removeAttribute('aria-hidden');else dock.setAttribute('aria-hidden',dockAriaHidden);}
                const searchHit=ownsCentre(search),dockHits=buttons.map(button=>({id:button.id,hit:ownsCentre(button),named:named(button),
                  exposed:exposed(button),tabIndex:button.tabIndex,disabled:button.disabled}));
                search.focus({preventScroll:true});const searchFocused=document.activeElement===search;
                search.value='Middle A++ geometry row';search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}));
                const filtered=window.__CF_SLICE__.api.compendiumDiagnostics();
                search.value='';search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}));
                const cleared=window.__CF_SLICE__.api.compendiumDiagnostics();
                dockButton.focus({preventScroll:true});const dockFocused=document.activeElement===dockButton;dockButton.click();
                const closed=window.__CF_SLICE__.api.state();dockButton.click();const reopened=window.__CF_SLICE__.api.state(),
                  close=panel.querySelector('[data-pnx]'),focusEntered=!!close&&document.activeElement===close;
                return {ok:positiveVisibility&&hiddenSearchRejected&&blockedDockRejected&&hiddenDockA11yRejected&&searchHit&&searchFocused
                    &&search.getAttribute('aria-label')?.trim().length>0&&exposed(search)&&search.tabIndex>=0&&!search.disabled&&!search.readOnly
                    &&dock.getAttribute('aria-label')?.trim().length>0&&dockFocused&&dockHits.length===10
                    &&dockHits.every(row=>row.hit&&row.named&&row.exposed&&row.tabIndex>=0&&!row.disabled)
                    &&filtered.panel.mode==='list'&&filtered.panel.filteredCount===1
                    &&cleared.panel.mode==='list'&&cleared.panel.filteredCount===${hostileCompendiumRows.length}
                    &&closed.panelOpen===null&&reopened.panelOpen==='codex'&&focusEntered,
                  positiveVisibility,hiddenSearchRejected,blockedDockRejected,hiddenDockA11yRejected,searchHit,searchFocused,searchName:search.getAttribute('aria-label'),
                  dockName:dock.getAttribute('aria-label'),dockFocused,dockHits,filteredCount:filtered.panel.filteredCount,
                  clearedCount:cleared.panel.filteredCount,closedPanel:closed.panelOpen,reopenedPanel:reopened.panelOpen,focusEntered};})()`);
              addOutcome(vp.label, 'compendium-nonmodal-chrome', 'NONMODAL_CHROME_UNUSABLE', '#searchbox,#dock', nonModalChrome,
                'non-modal Search and every dock action remain rendered, named, focusable, hit-testable, and usable while the Compendium is open');
              await waitFor('non-modal Compendium reopen', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();return d.panel.mode==='list'
                &&d.panel.sourceCount===${hostileCompendiumRows.length}&&d.panel.filteredCount===${hostileCompendiumRows.length}
                &&document.querySelector('#codexpanel [data-ci="0"]');})()`);
              const nonModalAuditOptions = {
                surface: 'compendium-nonmodal-chrome', root: 'body', textMin: 20, targetFloor,
                safe: vp.safe || {}, safeExpected: vp.safe || undefined,
                viewportExpected: { width: vp.width, height: vp.height, dpr: vp.dpr },
                fitSelectors: ['#searchbox', '#dock', '#survey'], interactiveRoots: ['#searchbox', '#dock'],
                focusSelectors: ['#searchbox', '#dockcodex'], contrastSelectors: ['#searchbox', '#dock button'],
                maxControlReports: 10, maxContrastReports: 10,
                overlapPairs: [['#codexpanel', '#searchbox'], ['#codexpanel', '#dock'], ['#survey', '#searchbox'], ['#survey', '#dock'],
                  ['#searchbox', '#dock']],
              };
              const nonModalAuditRows = await audit(nonModalAuditOptions);
              add(vp.label, 'compendium-nonmodal-chrome', nonModalAuditRows);
              const dockContrastControl = await evalIn(`(()=>{const buttons=[...document.querySelectorAll('#dock button')];
                if(buttons.length!==10||buttons.some(button=>!(button instanceof HTMLButtonElement)||!button.id))
                  return {ok:false,why:'exact ten named dock buttons missing',count:buttons.length};
                const expected=buttons.map(button=>'#'+CSS.escape(button.id)).sort(),prior=buttons.map(button=>button.getAttribute('style')),
                  baseline=window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(nonModalAuditOptions)});let injected=[];
                try{for(const button of buttons){button.style.setProperty('color','#fff','important');button.style.setProperty('background','#fff','important');}
                  injected=window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(nonModalAuditOptions)});
                }finally{buttons.forEach((button,index)=>{if(prior[index]===null)button.removeAttribute('style');else button.setAttribute('style',prior[index]);});}
                const restored=buttons.map(button=>button.getAttribute('style')),clean=window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(nonModalAuditOptions)}),
                  contrastIds=(rows)=>rows.filter(row=>row.code==='TEXT_CONTRAST_LOW'&&expected.includes(row.element)).map(row=>row.element).sort(),
                  baselineIds=contrastIds(baseline),injectedIds=contrastIds(injected),cleanIds=contrastIds(clean),
                  bare=[...baseline,...injected,...clean].some(row=>row.code==='TEXT_CONTRAST_LOW'&&row.element==='#dock'),
                  restoredExact=restored.every((value,index)=>(${sameInlineStyleAttribute.toString()})(prior[index],value));
                return {ok:JSON.stringify(injectedIds)===JSON.stringify(expected)&&JSON.stringify(cleanIds)===JSON.stringify(baselineIds)
                    &&!bare&&restoredExact,expected,baselineIds,injectedIds,cleanIds,bare,restoredExact,prior,restored};})()`);
              if (!dockContrastControl?.ok || nonModalAuditRows.some(row=>row.code==='TEXT_CONTRAST_LOW'&&row.element==='#dock')) {
                recordInstrumentFailure(`${vp.label}: non-modal dock contrast control did not isolate the painted buttons from the transparent layout wrapper (${JSON.stringify(dockContrastControl)})`);
              }
              recordControls('nonmodal-dock-button-contrast');
              await evalIn(`document.querySelector('#codexpanel [data-pnx]')?.focus()`);

              const revealHostileRow = async (target) => {
                let state = null, mountOnlyRejected = false;
                for (let attempt = 0; attempt < 5; attempt++) {
                  state = await evalIn(`(()=>{const scroller=document.querySelector('[data-sel="codex-scroll"]'),targetIndex=${target.index},
                    targetId=${JSON.stringify(target.id)},count=${hostileCompendiumRows.length};if(!scroller)return {ready:false,why:'scroller missing'};
                    const rows=[...scroller.querySelectorAll('[data-ci][data-cid]')],mounted=rows.map(row=>({index:Number(row.dataset.ci),id:row.dataset.cid})),
                      exact=rows.find(row=>Number(row.dataset.ci)===targetIndex&&row.dataset.cid===targetId),
                      maxScroll=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
                    if(exact){const r=exact.getBoundingClientRect(),s=scroller.getBoundingClientRect(),
                      contained=r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1;
                      if((${hostileCompendiumRevealReady.toString()})({ready:true,targetMounted:true,contained}))return {ready:true,targetMounted:true,mounted,scrollTop:scroller.scrollTop,contained,row:[r.left,r.top,r.right,r.bottom],scroller:[s.left,s.top,s.right,s.bottom]};
                      const next=scroller.scrollTop+(r.top+r.bottom-s.top-s.bottom)/2;
                      scroller.scrollTop=Math.max(0,Math.min(maxScroll,next));scroller.dispatchEvent(new Event('scroll'));
                      return {ready:false,targetMounted:true,mounted,mountedButOffscreen:true,contained:false,scrollTop:scroller.scrollTop,max:maxScroll,
                        row:[r.left,r.top,r.right,r.bottom],scroller:[s.left,s.top,s.right,s.bottom]};}
                    const mean=Math.max(44,scroller.scrollHeight/Math.max(1,count)),max=Math.max(0,scroller.scrollHeight-scroller.clientHeight),
                      nearest=mounted.slice().sort((a,b)=>Math.abs(a.index-targetIndex)-Math.abs(b.index-targetIndex))[0],
                      next=${attempt}===0?max*targetIndex/Math.max(1,count-1):scroller.scrollTop+(targetIndex-(nearest?.index??targetIndex))*mean;
                    scroller.scrollTop=Math.max(0,Math.min(max,next));scroller.dispatchEvent(new Event('scroll'));
                    return {ready:false,targetMounted:false,mounted,scrollTop:scroller.scrollTop,mean,max};})()`);
                  if (state?.mountedButOffscreen) mountOnlyRejected = true;
                  if (state?.ready) return { ...state, mountOnlyRejected };
                  await evalIn('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
                }
                state = await evalIn(`(()=>{const row=[...document.querySelectorAll('#codexpanel [data-ci][data-cid]')]
                  .find(el=>Number(el.dataset.ci)===${target.index}&&el.dataset.cid===${JSON.stringify(target.id)}),
                  scroller=document.querySelector('[data-sel="codex-scroll"]'),r=row?.getBoundingClientRect(),s=scroller?.getBoundingClientRect(),
                  contained=!!r&&!!s&&r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1;
                  return {ok:!!row,ready:!!row,targetMounted:!!row,contained,row:r?[r.left,r.top,r.right,r.bottom]:null,
                    scroller:s?[s.left,s.top,s.right,s.bottom]:null,
                    mounted:[...document.querySelectorAll('#codexpanel [data-ci][data-cid]')].map(el=>({index:Number(el.dataset.ci),id:el.dataset.cid}))};})()`);
                state.mountOnlyRejected = mountOnlyRejected;
                addOutcome(vp.label, `compendium-hostile-${target.state}`, 'COMPENDIUM_HOSTILE_ROW_NOT_MOUNTED', '#codexpanel [data-ci]', state,
                  `the ${target.state} logical row mounts after bounded virtual scrolling`);
                return state;
              };
              const auditHostileRow = async (target) => {
                const reveal = await revealHostileRow(target);
                if (!reveal?.ready) return null;
                const rowSelector = `#codexpanel [data-cid=${JSON.stringify(target.id)}][data-ci="${target.index}"]`;
                add(vp.label, `compendium-hostile-${target.state}`, await audit({
                  surface: `compendium-hostile-${target.state}`, root: '#codexpanel', textMin: 20, targetFloor,
                  safe: vp.safe || {}, safeExpected: vp.safe || undefined,
                  viewportExpected: { width: vp.width, height: vp.height, dpr: vp.dpr },
                  fitSelectors: ['#codexpanel'], interactiveRoots: [rowSelector], contrastSelectors: [],
                  maxControlReports: 10, overlapPairs: [['#codexpanel', '#survey']],
                }));
                const geometry = await evalIn(`(()=>{const row=[...document.querySelectorAll('#codexpanel [data-ci][data-cid]')]
                  .find(el=>Number(el.dataset.ci)===${target.index}&&el.dataset.cid===${JSON.stringify(target.id)}),
                  scroller=document.querySelector('[data-sel="codex-scroll"]');if(!row||!scroller)return {ok:false,why:'target detached'};
                  const r=row.getBoundingClientRect(),s=scroller.getBoundingClientRect(),style=getComputedStyle(row),copy=row.querySelector('.compendium-row-copy');
                  return {ok:document.body.classList.contains('fs-xl')&&document.body.classList.contains('font-mono')
                      &&parseFloat(style.fontSize)>=16&&/mono/i.test(style.fontFamily)&&r.height>=44&&r.height<=s.height+1
                      &&r.top>=s.top-1&&r.bottom<=s.bottom+1&&row.scrollHeight<=row.clientHeight+1
                      &&copy&&getComputedStyle(copy).overflowWrap==='anywhere',logicalId:row.dataset.cid||null,sourceIndex:Number(row.dataset.ci),
                    fontSize:parseFloat(style.fontSize),fontFamily:style.fontFamily,rect:[r.left,r.top,r.right,r.bottom],
                    scroller:[s.left,s.top,s.right,s.bottom],clientHeight:row.clientHeight,scrollHeight:row.scrollHeight,
                    copyScrollHeight:copy?.scrollHeight??null};})()`);
                hostileHeights.push(geometry?.rect?.[3] - geometry?.rect?.[1]);
                addOutcome(vp.label, `compendium-hostile-${target.state}`, 'COMPENDIUM_HOSTILE_ROW_GEOMETRY', rowSelector,
                  hostileCompendiumGeometryOutcome(geometry, reveal),
                  `the ${target.state} A++/Mono variable-height row is fully reachable without text or row truncation`);
                return { rowSelector, geometry, reveal };
              };
              const runShortClipControl = async (target) => {
                const rowSelector = `#codexpanel [data-cid=${JSON.stringify(target.id)}][data-ci="${target.index}"]`;
                const controlOptions = {
                  surface: 'compendium-48px-control', root: '#codexpanel', textMin: 1, targetFloor,
                  safe: vp.safe || {}, fitSelectors: ['#codexpanel'], interactiveRoots: [rowSelector], contrastSelectors: [],
                  maxControlReports: 10, overlapPairs: [],
                };
                const control = await evalIn(`(()=>{const scroller=document.querySelector('[data-sel="codex-scroll"]');
                  if(!scroller)return {rows:[],restoration:{ok:false,why:'scroller missing'}};
                  const prior=scroller.getAttribute('style'),beforeClientHeight=scroller.clientHeight;let rows=[],appliedClientHeight=null;
                  try{scroller.style.setProperty('height','48px','important');appliedClientHeight=scroller.clientHeight;
                    rows=window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(controlOptions)});
                  }finally{if(prior===null)scroller.removeAttribute('style');else scroller.setAttribute('style',prior);}
                  const restored=scroller.getAttribute('style'),restoredClientHeight=scroller.clientHeight;
                  return {rows,restoration:{ok:(${sameInlineStyleAttribute.toString()})(prior,restored)&&beforeClientHeight>=243&&appliedClientHeight===48
                    &&restoredClientHeight===beforeClientHeight,prior,restored,beforeClientHeight,appliedClientHeight,restoredClientHeight}};})()`);
                const rows = control?.rows || [];
                if (!control?.restoration?.ok) recordInstrumentFailure(`${vp.label}: real ${target.state} 48px Compendium injection did not restore the exact scroller style and >=243px geometry (${JSON.stringify(control?.restoration)})`);
                const outside = rows.find((row) => row.code === 'CONTROL_OUTSIDE_VIEWPORT'
                  && row.actual?.logicalId === target.id && row.actual?.sourceIndex === target.index
                  && row.actual?.rect?.height > 48
                  && row.actual?.clippingAncestors?.some((ancestor) => ancestor.clientHeight === 48
                    && /(auto|scroll)/.test(ancestor.overflowY)));
                if (!outside) recordInstrumentFailure(`${vp.label}: real ${target.state} 48px Compendium injection did not report its exact logical/source identity (${JSON.stringify(rows)})`);
                else shortClipIdentities.add(`${outside.actual.logicalId}:${outside.actual.sourceIndex}`);
              };

              await auditHostileRow(hostileTargets[0]);
              await runShortClipControl(hostileTargets[0]);
              await auditHostileRow(hostileTargets[1]);
              const ancestorTarget = hostileTargets[1];
              const ancestorSelector = `#codexpanel [data-cid=${JSON.stringify(ancestorTarget.id)}][data-ci="${ancestorTarget.index}"]`;
              const ancestorOptions = {
                surface: 'compendium-overflow-ancestor-control', root: '#codexpanel', textMin: 1, targetFloor,
                safe: vp.safe || {}, fitSelectors: ['#codexpanel'], interactiveRoots: [ancestorSelector], contrastSelectors: [],
                maxControlReports: 10, overlapPairs: [],
              };
              const ancestorControl = await evalIn(`(()=>{const panel=document.getElementById('codexpanel'),scroller=document.querySelector('[data-sel="codex-scroll"]');
                if(!panel||!scroller)return {rows:[],restoration:{ok:false,why:'panel/scroller missing'}};
                const prior=panel.getAttribute('style'),beforeClientHeight=panel.clientHeight,beforeScrollerHeight=scroller.clientHeight,
                  beforeOverflowY=getComputedStyle(panel).overflowY,p=panel.getBoundingClientRect(),s=scroller.getBoundingClientRect();let rows=[],applied=null;
                try{const clippedHeight=Math.max(1,s.top-p.top+48);panel.style.setProperty('height',clippedHeight+'px','important');
                  panel.style.setProperty('max-height',clippedHeight+'px','important');panel.style.setProperty('overflow-y','hidden','important');
                  applied={clientHeight:panel.clientHeight,overflowY:getComputedStyle(panel).overflowY};
                  rows=window.__CF_GLASS_AUDIT__.audit(${JSON.stringify(ancestorOptions)});
                }finally{if(prior===null)panel.removeAttribute('style');else panel.setAttribute('style',prior);}
                const restored=panel.getAttribute('style'),restoredClientHeight=panel.clientHeight,restoredScrollerHeight=scroller.clientHeight,
                  restoredOverflowY=getComputedStyle(panel).overflowY;
                return {rows,restoration:{ok:(${sameInlineStyleAttribute.toString()})(prior,restored)&&beforeScrollerHeight>=243&&applied?.overflowY==='hidden'
                    &&applied.clientHeight<beforeClientHeight&&restoredClientHeight===beforeClientHeight
                    &&restoredScrollerHeight===beforeScrollerHeight&&restoredOverflowY===beforeOverflowY,
                  prior,restored,beforeClientHeight,beforeScrollerHeight,beforeOverflowY,applied,restoredClientHeight,restoredScrollerHeight,restoredOverflowY}};})()`);
              const ancestorRows = ancestorControl?.rows || [];
              if (!ancestorControl?.restoration?.ok) recordInstrumentFailure(`${vp.label}: real overflow-ancestor Compendium injection did not restore the exact panel style and >=243px scroller geometry (${JSON.stringify(ancestorControl?.restoration)})`);
              const ancestorOutside = ancestorRows.find((row) => row.code === 'CONTROL_OUTSIDE_VIEWPORT'
                && row.actual?.logicalId === ancestorTarget.id && row.actual?.sourceIndex === ancestorTarget.index
                && row.actual?.clippingAncestors?.some((ancestor) => ancestor.element === '#codexpanel'
                  && ancestor.overflowY === 'hidden'));
              if (!ancestorOutside) recordInstrumentFailure(`${vp.label}: real overflow-ancestor Compendium injection did not diagnose #codexpanel and its exact row (${JSON.stringify(ancestorRows)})`);

              await auditHostileRow(hostileTargets[2]);
              await runShortClipControl(hostileTargets[2]);
              if (shortClipIdentities.size !== 2
                || !shortClipIdentities.has(`${hostileTargets[0].id}:0`)
                || !shortClipIdentities.has(`${hostileTargets[2].id}:20`)) {
                recordInstrumentFailure(`${vp.label}: first/last 48px Compendium controls did not retain distinct logicalId/sourceIndex diagnostics (${JSON.stringify([...shortClipIdentities])})`);
              }
              if (hostileHeights.length !== 3 || new Set(hostileHeights.map((height) => Math.round(height))).size < 2) {
                recordInstrumentFailure(`${vp.label}: hostile Compendium fixture did not exercise variable row heights (${JSON.stringify(hostileHeights)})`);
              }

              await revealHostileRow(hostileTargets[1]);
              await evalIn(`(()=>{const row=[...document.querySelectorAll('#codexpanel [data-ci][data-cid]')]
                .find(el=>Number(el.dataset.ci)===10&&el.dataset.cid===${JSON.stringify(hostileTargets[1].id)});row?.focus({preventScroll:true});
                const scroller=document.querySelector('[data-sel="codex-scroll"]');if(scroller){scroller.scrollTop=scroller.scrollHeight;scroller.dispatchEvent(new Event('scroll'));}
                return !!row;})()`);
              await evalIn('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
              const pinned = await evalIn(`(()=>{const id=${JSON.stringify(hostileTargets[1].id)},d=window.__CF_SLICE__.api.compendiumDiagnostics(),
                row=[...document.querySelectorAll('#codexpanel [data-ci][data-cid]')].find(el=>el.dataset.cid===id),
                scroller=document.querySelector('[data-sel="codex-scroll"]');if(!row||!scroller)return {ok:false,why:'pinned row/scroller missing',diagnostics:d};
                const r=row.getBoundingClientRect(),s=scroller.getBoundingClientRect(),outside=r.bottom<=s.top+1||r.top>=s.bottom-1;
                return {ok:document.activeElement===row&&d.window.focusedLogicalId===id
                    &&d.window.pinnedLogicalIds.length===1&&d.window.pinnedLogicalIds[0]===id
                    &&d.window.mountedLogicalIds.includes(id)&&!(10>=d.window.start&&10<d.window.end)&&outside,
                  logicalId:row.dataset.cid||null,sourceIndex:Number(row.dataset.ci),active:document.activeElement===row,
                  window:d.window,row:[r.left,r.top,r.right,r.bottom],scroller:[s.left,s.top,s.right,s.bottom],outside};})()`);
              addOutcome(vp.label, 'compendium-hostile-focus-pinned', 'COMPENDIUM_FOCUS_PIN_GEOMETRY', ancestorSelector, pinned,
                'the focused middle logical row stays mounted and focused outside the normal last-row window without expanding or clipping that window');
              add(vp.label, 'compendium-hostile-focus-pinned', await audit({
                surface: 'compendium-hostile-focus-pinned', root: '#codexpanel', textMin: 20, targetFloor,
                safe: vp.safe || {}, safeExpected: vp.safe || undefined,
                viewportExpected: { width: vp.width, height: vp.height, dpr: vp.dpr },
                fitSelectors: ['#codexpanel'], interactiveRoots: [ancestorSelector], contrastSelectors: [],
                maxControlReports: 10, overlapPairs: [['#codexpanel', '#survey']],
              }));
              recordControls('viewport-fit');
            } finally {
              if (hostileInstallAttempted) {
                const restored = await evalIn('window.__CF_SLICE__.api.__compendiumEvidence.resetFixture()');
                await waitFor('restored Compendium fixture', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();
                  return d.panel.mode==='list'&&d.panel.sourceCount===${baselineCodexCount}
                    &&document.querySelectorAll('#codexpanel [data-sel="codex-entry"]').length>0;})()`);
                if (restored?.installed !== baselineCodexCount) throw new Error(`${vp.label}: Compendium fixture reset mismatch ${JSON.stringify(restored)}`);
                await evalIn(`document.querySelector('#codexpanel [data-pnx]')?.focus()`);
              }
            }
          }
          if (item.inventory) {
            const thermalId = inventoryCarrier?.arc2?.kind === 'inventory'
              ? inventoryCarrier.arc2.inventory.entries.find((entry) => entry.instance.baseId === 'thermal')?.instance.instanceId
              : null;
            const hazmatId = inventoryCarrier?.arc2?.kind === 'inventory'
              ? inventoryCarrier.arc2.inventory.entries.find((entry) => entry.instance.baseId === 'hazmat')?.instance.instanceId
              : null;
            if (typeof thermalId !== 'string' || typeof hazmatId !== 'string') {
              recordInstrumentFailure(`${vp.label}: Inventory conditional/protected fixture identities are unavailable (${JSON.stringify({ thermalId, hazmatId })})`);
            } else {
              const thermalSelector = `#inventorypanel [data-inventory-row="exact"][data-instance-id=${JSON.stringify(thermalId)}]`;
              const hazmatSelector = `#inventorypanel [data-inventory-row="exact"][data-instance-id=${JSON.stringify(hazmatId)}]`;
              await evalIn(`document.querySelector(${JSON.stringify(thermalSelector)})?.scrollIntoView({block:'center',inline:'nearest'})`);
              const realThermalOpen = await activateRealControl(thermalSelector, `${vp.label} Inventory thermal row`);
              await waitFor('Inventory thermal detail', `(()=>{const d=window.__CF_SLICE__.api.inventoryDiagnostics();
                return d.activeCount===1&&d.selectedInstanceId===${JSON.stringify(thermalId)}
                  &&document.querySelector('#inventorysheet [data-inventory-detail=${JSON.stringify(thermalId)}]');})()`);
              addOutcome(vp.label, 'inventory-modal', 'INVENTORY_REAL_ROW_OPEN', thermalSelector, realThermalOpen,
                'the exact conditional candidate row receives real browser pointer input');
              const modalCheck = `window.__CF_GLASS_AUDIT__.inventoryModalOutcome(${JSON.stringify(thermalId)},${JSON.stringify(vp.safe || {})})`;
              addOutcome(vp.label, 'inventory-modal', 'INVENTORY_MODAL_OWNERSHIP', '#inventorysheet',
                await evalIn(modalCheck),
                'one labelled modal owns one exact detail, all background siblings, safe geometry, 44px actions, and initial Close focus');
              const conditionCheck = 'window.__CF_GLASS_AUDIT__.inventoryConditionOutcome()';
              addOutcome(vp.label, 'inventory-modal', 'INVENTORY_CONDITIONAL_COMPARISON', '#inventorysheet [data-compare-effect]',
                await evalIn(conditionCheck),
                'every exact effect and comparison row renders its carrier condition, including landing-family wording');
              add(vp.label, 'inventory-modal', await audit({
                surface: 'inventory-modal', root: '#inventorysheet', textMin: 220, targetFloor,
                safe: {}, viewportExpected: { width: vp.width, height: vp.height, dpr: vp.dpr },
                required: [
                  { selector: '[data-inventory-sheet-close]', min: 1 },
                  { selector: '[data-inventory-detail]', min: 1, textMin: 180 },
                  { selector: '[data-compare-effect]', min: 1 },
                  { selector: '[data-inventory-action]', min: 2 },
                ],
                fitSelectors: ['#inventorysheet .inventory-sheet-card'],
                interactiveRoots: ['#inventorysheet'], contrastSelectors: ['#inventorysheet .inventory-sheet-card'],
                maxControlReports: 16, maxContrastReports: 16, overlapPairs: [],
              }));

              if (!inventoryControlRun) {
                const conditionControl = await evalIn(`(()=>{const row=[...document.querySelectorAll('#inventorysheet [data-compare-effect]')]
                  .find(node=>(node.getAttribute('data-condition')||'')!=='unconditional'),copy=row?.querySelector('span'),prior=copy?.textContent??null;
                  if(copy)copy.textContent='Conditional wording omitted';const broken=${conditionCheck};if(copy&&prior!==null)copy.textContent=prior;
                  return {ok:broken.ok===false&&broken.conditionalComparisons>0&&${conditionCheck}.ok,broken};})()`);
                if (!conditionControl.ok) {
                  recordInstrumentFailure(`${vp.label}: dropped Inventory condition wording stayed green or failed to restore (${JSON.stringify(conditionControl)})`);
                }
                recordControls('inventory-condition-wording');

                const duplicateModalControl = await evalIn(`(()=>{const sheet=document.getElementById('inventorysheet'),duplicate=sheet?.cloneNode(true)||null;
                  if(duplicate)document.body.appendChild(duplicate);const broken=${modalCheck};duplicate?.remove();
                  return {ok:broken.ok===false&&broken.sheetCount===2&&${modalCheck}.ok,broken};})()`);
                if (!duplicateModalControl.ok) {
                  recordInstrumentFailure(`${vp.label}: duplicate Inventory modal stayed green or failed to restore (${JSON.stringify(duplicateModalControl)})`);
                }
                recordControls('inventory-modal-duplication');

                const modalFocusControl = await evalIn(`(()=>{const sheet=document.getElementById('inventorysheet'),
                  close=sheet?.querySelector('[data-inventory-sheet-close]'),outside=[...document.body.children].find(node=>node!==sheet)||null;
                  close?.blur();const broken=${modalCheck};
                  outside?.dispatchEvent(new FocusEvent('focusin',{bubbles:true,composed:true}));
                  const redirected=document.activeElement===close,restored=${modalCheck};close?.focus();
                  return {ok:broken.ok===false&&!!outside&&redirected&&restored.ok&&${modalCheck}.ok,
                    broken,redirected,restored,outside:outside?(outside.id||outside.tagName):null};})()`);
                if (!modalFocusControl.ok) {
                  recordInstrumentFailure(`${vp.label}: Inventory modal focus omission stayed green or failed to restore (${JSON.stringify(modalFocusControl)})`);
                }

                const backgroundLifetimeBroken = await evalIn(`(()=>{const toast=document.getElementById('toast'),
                  late=document.createElement('div');late.id='cf-inventory-background-lifetime';late.inert=false;
                  late.setAttribute('aria-hidden','late-prior');document.body.appendChild(late);
                  if(toast){toast.inert=false;toast.removeAttribute('inert');toast.removeAttribute('aria-hidden');}
                  const broken=${modalCheck};window.__cfInventoryBackgroundLifetimeControl={late};
                  return {ok:!!toast&&broken.ok===false&&broken.backgroundLocked===false
                    &&broken.unlockedBackground.some(row=>row.id==='toast')
                    &&broken.unlockedBackground.some(row=>row.id===late.id),broken};})()`);
                await waitFor('Inventory background lifetime re-lock', `(()=>{const probe=window.__cfInventoryBackgroundLifetimeControl,
                  outcome=${modalCheck};return !!probe?.late?.isConnected&&probe.late.inert===true
                    &&probe.late.getAttribute('aria-hidden')==='true'&&outcome.ok;})()`);
                const backgroundLifetimeRelocked = await evalIn(`(()=>{const probe=window.__cfInventoryBackgroundLifetimeControl,
                  outcome=${modalCheck};return {ok:!!probe?.late?.isConnected&&probe.late.inert===true
                    &&probe.late.getAttribute('aria-hidden')==='true'&&outcome.ok,
                    late:probe?.late?{inert:probe.late.inert===true,ariaHidden:probe.late.getAttribute('aria-hidden')}:null,outcome};})()`);
                if (!backgroundLifetimeBroken.ok || !backgroundLifetimeRelocked.ok) {
                  recordInstrumentFailure(`${vp.label}: Inventory lifetime background mutation did not turn red and re-lock (${JSON.stringify({ backgroundLifetimeBroken, backgroundLifetimeRelocked })})`);
                }
                recordControls('inventory-modal-focus');
              }

              const trapSetup = await evalIn(`(()=>{const sheet=document.getElementById('inventorysheet'),controls=sheet?[...sheet.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')]
                .filter(node=>!node.hidden&&!node.disabled&&!node.closest('[hidden]')):[],first=controls[0]||null,last=controls.at(-1)||null;
                last?.focus();return {ok:controls.length>=2&&document.activeElement===last,first:first?.getAttribute('data-inventory-sheet-close')!==null,
                  last:last?.getAttribute('data-inventory-action')||last?.tagName||null};})()`);
              await pressTab();
              const forwardTrap = await evalIn(`window.__CF_GLASS_AUDIT__.inventoryFocusTrapOutcome('first')`);
              await pressTab(true);
              const reverseTrap = await evalIn(`window.__CF_GLASS_AUDIT__.inventoryFocusTrapOutcome('last')`);
              addOutcome(vp.label, 'inventory-modal-focus-trap', 'INVENTORY_MODAL_FOCUS_TRAP', '#inventorysheet',
                { ok: trapSetup.ok && trapSetup.first && forwardTrap.ok && reverseTrap.ok,
                  trapSetup, forwardTrap, reverseTrap },
                'real forward and reverse Tab wrap inside the one Inventory modal');
              if (!inventoryControlRun) {
                /* Window is earlier than document on the capture path. The
                   temporary interceptor bypasses only the owned document Tab
                   handler. Modal-descendant contenteditable sentinels remain
                   outside the product/auditor control enumeration, so native
                   Tab can miss each expected edge without unlocking the
                   continuously isolated body background. */
                const wrapControlSetup = await evalIn(`(()=>{const sheet=document.getElementById('inventorysheet'),
                  controls=sheet?[...sheet.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')]
                    .filter(node=>!node.hidden&&!node.disabled&&!node.closest('[hidden]')):[],first=controls[0]||null,last=controls.at(-1)||null,
                  sentinelBefore=document.createElement('div'),sentinelAfter=document.createElement('div'),receipt={keydown:0};
                  sentinelBefore.id='cf-inventory-focus-wrap-before';sentinelAfter.id='cf-inventory-focus-wrap-after';
                  for(const [sentinel,label] of [[sentinelBefore,'before'],[sentinelAfter,'after']]){sentinel.contentEditable='true';
                    sentinel.textContent='modal focus sentinel '+label;
                    sentinel.style.cssText='position:fixed;left:0;top:0;width:44px;height:44px;z-index:2147483647';}
                  const keydown=event=>{if(event.key!=='Tab')return;receipt.keydown+=1;event.stopImmediatePropagation();},card=sheet?.firstElementChild||null;
                  card?.before(sentinelBefore);card?.after(sentinelAfter);window.addEventListener('keydown',keydown,true);
                  window.__cfInventoryFocusWrapControl={sentinelBefore,sentinelAfter,first,last,keydown,receipt};last?.focus();
                  return {ok:!!sheet&&!!card&&controls.length>=2&&!!first&&!!last&&sentinelBefore.isConnected&&sentinelAfter.isConnected
                    &&sheet.contains(sentinelBefore)&&sheet.contains(sentinelAfter)&&sentinelBefore.isContentEditable&&sentinelAfter.isContentEditable
                    &&document.activeElement===last,
                    first:first?.getAttribute('data-inventory-sheet-close')!==null,
                    last:last?.getAttribute('data-inventory-action')||last?.tagName||null,
                    sentinels:[sentinelBefore.id,sentinelAfter.id]};})()`);
                await pressTab();
                const wrapBrokenForward = await evalIn(`(()=>{const probe=window.__cfInventoryFocusWrapControl,
                  outcome=window.__CF_GLASS_AUDIT__.inventoryFocusTrapOutcome('first');return {
                    ok:!!probe&&document.activeElement===probe.sentinelAfter&&outcome.ok===false,
                    bypassedEdge:document.activeElement===probe?.sentinelAfter,outcome,
                    receipt:probe?{...probe.receipt}:null};})()`);
                const reverseBreakSetup = await evalIn(`(()=>{const probe=window.__cfInventoryFocusWrapControl;
                  probe?.first?.focus();return !!probe?.first&&document.activeElement===probe.first;})()`);
                await pressTab(true);
                const wrapBrokenReverse = await evalIn(`(()=>{const probe=window.__cfInventoryFocusWrapControl,
                  outcome=window.__CF_GLASS_AUDIT__.inventoryFocusTrapOutcome('last');return {
                    ok:!!probe&&document.activeElement===probe.sentinelBefore&&outcome.ok===false,
                    bypassedEdge:document.activeElement===probe?.sentinelBefore,outcome,
                    receipt:probe?{...probe.receipt}:null};})()`);
                const wrapRestoreSetup = await evalIn(`(()=>{const probe=window.__cfInventoryFocusWrapControl;
                  if(!probe)return {ok:false,why:'focus-wrap bypass receipt absent'};
                  const receipt={...probe.receipt};window.removeEventListener('keydown',probe.keydown,true);
                  probe.sentinelBefore.remove();probe.sentinelAfter.remove();delete window.__cfInventoryFocusWrapControl;
                  const last=[...document.querySelectorAll('#inventorysheet button,#inventorysheet input,#inventorysheet select,#inventorysheet textarea,#inventorysheet a[href],#inventorysheet [tabindex]:not([tabindex="-1"])')]
                      .filter(node=>!node.hidden&&!node.disabled&&!node.closest('[hidden]')).at(-1)||null;
                  last?.focus();return {ok:receipt.keydown===2&&!document.getElementById('cf-inventory-focus-wrap-before')
                    &&!document.getElementById('cf-inventory-focus-wrap-after')
                    &&!('__cfInventoryFocusWrapControl' in window)&&!!last&&document.activeElement===last,
                    receipt,last:last?.getAttribute('data-inventory-action')||last?.tagName||null};})()`);
                await pressTab();
                const wrapRestored = await evalIn(`window.__CF_GLASS_AUDIT__.inventoryFocusTrapOutcome('first')`);
                await pressTab(true);
                const reverseRestored = await evalIn(`window.__CF_GLASS_AUDIT__.inventoryFocusTrapOutcome('last')`);
                const wrapCleanup = await evalIn(`(()=>{document.getElementById('cf-inventory-focus-wrap-restored')?.remove();
                  const close=document.querySelector('#inventorysheet [data-inventory-sheet-close]');close?.focus();
                  return {ok:!document.getElementById('cf-inventory-focus-wrap-before')
                    &&!document.getElementById('cf-inventory-focus-wrap-after')
                    &&!document.getElementById('cf-inventory-focus-wrap-restored')
                    &&!('__cfInventoryFocusWrapControl' in window)&&${modalCheck}.ok,
                    active:document.activeElement===close};})()`);
                const wrapControl = { ok: wrapControlSetup.ok && wrapControlSetup.first
                    && wrapBrokenForward.ok && reverseBreakSetup && wrapBrokenReverse.ok
                    && wrapRestoreSetup.ok && wrapRestored.ok && reverseRestored.ok && wrapCleanup.ok,
                  setup: wrapControlSetup, brokenForward: wrapBrokenForward,
                  reverseBreakSetup, brokenReverse: wrapBrokenReverse,
                  restoreSetup: wrapRestoreSetup, restored: wrapRestored,
                  reverseRestored, cleanup: wrapCleanup };
                if (!wrapControl.ok) {
                  recordInstrumentFailure(`${vp.label}: Inventory focus-wrap bypass did not miss each edge, fail red, and restore (${JSON.stringify(wrapControl)})`);
                }
                recordControls('inventory-focus-wrap');
              }

              await evalIn(`window.__cfInventoryRetainedControl=document.querySelector('#inventorysheet [data-inventory-detail]')?.cloneNode(true)||null`);
              await pressEscape();
              await waitFor('Inventory Escape close', `window.__CF_SLICE__.api.inventoryDiagnostics().activeCount===0&&document.getElementById('inventorysheet')?.hidden===true`);
              const escaped = await evalIn(`window.__CF_GLASS_AUDIT__.inventoryClosedOutcome(${JSON.stringify(thermalId)})`);
              addOutcome(vp.label, 'inventory-modal-escape', 'INVENTORY_ESCAPE_RELEASE', '#inventorysheet', escaped,
                'Escape clears active, retained, and pending ownership and restores the exact opener row');
              if (!inventoryControlRun) {
                const retentionControl = await evalIn(`(()=>{const body=document.querySelector('#inventorysheet [data-inventory-sheet-body]'),
                  retained=window.__cfInventoryRetainedControl||null;if(retained)body?.appendChild(retained);
                  const broken=window.__CF_GLASS_AUDIT__.inventoryClosedOutcome(${JSON.stringify(thermalId)});retained?.remove();
                  delete window.__cfInventoryRetainedControl;return {ok:broken.ok===false&&broken.bodyChildren===1
                    &&window.__CF_GLASS_AUDIT__.inventoryClosedOutcome(${JSON.stringify(thermalId)}).ok,broken};})()`);
                if (!retentionControl.ok) {
                  recordInstrumentFailure(`${vp.label}: retained Inventory detail after Escape stayed green or failed to restore (${JSON.stringify(retentionControl)})`);
                }
                const backgroundLifetimeRestored = await evalIn(`(()=>{const probe=window.__cfInventoryBackgroundLifetimeControl,
                  late=probe?.late||null,result={ok:!!late&&late.isConnected&&late.inert!==true
                    &&late.getAttribute('aria-hidden')==='late-prior',
                    late:late?{inert:late.inert===true,ariaHidden:late.getAttribute('aria-hidden')}:null};
                  late?.remove();delete window.__cfInventoryBackgroundLifetimeControl;return result;})()`);
                if (!backgroundLifetimeRestored.ok) {
                  recordInstrumentFailure(`${vp.label}: Inventory lifetime background state did not restore exactly (${JSON.stringify(backgroundLifetimeRestored)})`);
                }
                recordControls('inventory-modal-retention');
              } else await evalIn('delete window.__cfInventoryRetainedControl');

              await evalIn(`document.querySelector(${JSON.stringify(hazmatSelector)})?.scrollIntoView({block:'center',inline:'nearest'})`);
              const realHazmatOpen = await activateRealControl(hazmatSelector, `${vp.label} Inventory equipped row`);
              await waitFor('Inventory equipped detail', `window.__CF_SLICE__.api.inventoryDiagnostics().selectedInstanceId===${JSON.stringify(hazmatId)}`);
              addOutcome(vp.label, 'inventory-protected-action', 'INVENTORY_REAL_PROTECTED_ROW', hazmatSelector, realHazmatOpen,
                'the exact equipped row receives real pointer input before its destructive boundary is audited');
              const protectedCheck = `window.__CF_GLASS_AUDIT__.inventoryProtectedActionOutcome(${JSON.stringify(hazmatId)})`;
              addOutcome(vp.label, 'inventory-protected-action', 'INVENTORY_PROTECTED_ACTION_DISABLED', '#inventorysheet [data-inventory-action="salvage"]',
                await evalIn(protectedCheck), 'the equipped exact instance exposes no enabled salvage retry');
              if (!inventoryControlRun) {
                const protectedControl = await evalIn(`(()=>{const button=document.querySelector('#inventorysheet [data-inventory-action="salvage"]'),
                  disabled=button?.disabled??null,enabled=button?.getAttribute('data-action-enabled')??null,reason=button?.getAttribute('data-protected-reason')??null;
                  if(button){button.disabled=false;button.setAttribute('data-action-enabled','true');button.removeAttribute('data-protected-reason');}
                  const broken=${protectedCheck};if(button){button.disabled=disabled;if(enabled===null)button.removeAttribute('data-action-enabled');else button.setAttribute('data-action-enabled',enabled);
                    if(reason===null)button.removeAttribute('data-protected-reason');else button.setAttribute('data-protected-reason',reason);}
                  return {ok:broken.ok===false&&${protectedCheck}.ok,broken};})()`);
                if (!protectedControl.ok) {
                  recordInstrumentFailure(`${vp.label}: enabled protected Inventory action stayed green or failed to restore (${JSON.stringify(protectedControl)})`);
                }
                recordControls('inventory-protected-action');
              }
              const realDetailClose = await activateRealControl('#inventorysheet [data-inventory-sheet-close]', `${vp.label} Inventory detail Close`);
              await waitFor('Inventory real Close', `window.__CF_SLICE__.api.inventoryDiagnostics().activeCount===0&&document.getElementById('inventorysheet')?.hidden===true`);
              const detailClosed = await evalIn(`window.__CF_GLASS_AUDIT__.inventoryClosedOutcome(${JSON.stringify(hazmatId)})`);
              addOutcome(vp.label, 'inventory-modal-close', 'INVENTORY_CLOSE_RELEASE', '#inventorysheet',
                { ...detailClosed, ok: realDetailClose?.ok === true && detailClosed.ok, realClose: realDetailClose },
                'real Close clears active, retained, and pending ownership and restores the exact equipped row');

              await evalIn(`document.querySelector(${JSON.stringify(thermalSelector)})?.scrollIntoView({block:'center',inline:'nearest'})`);
              const realActionDetailOpen = await activateRealControl(thermalSelector, `${vp.label} Inventory action candidate`);
              await waitFor('Inventory action detail', `window.__CF_SLICE__.api.inventoryDiagnostics().selectedInstanceId===${JSON.stringify(thermalId)}`);
              await waitFor('Inventory action authority', `(()=>{const s=window.__CF_SLICE__.api.state();return s.sceneResources?.pendingPersistenceWrites===0
                &&s.persistence?.mutationBlocked===false&&s.persistence?.runtime?.leaseOwned===true;})()`);
              const actionSelector = `#inventorysheet [data-inventory-action="equip"][data-instance-id=${JSON.stringify(thermalId)}]`;
              const actionScroll = await evalIn(`(()=>{const button=document.querySelector(${JSON.stringify(actionSelector)}),
                card=button?.closest('.inventory-sheet-card')||null;if(!button||!card)return {ok:false,scrollTop:null};
                button.scrollIntoView({block:'center',inline:'nearest'});return {ok:true,scrollTop:card.scrollTop};})()`);
              let actionReachabilityControl = { ok: true, skipped: true };
              if (!inventoryControlRun) {
                const offscreenPrior = await evalIn(`(()=>{const button=document.querySelector(${JSON.stringify(actionSelector)}),
                  card=button?.closest('.inventory-sheet-card')||null;return {ok:!!button&&!!card,
                    saved:card?.scrollTop??null,styleAttribute:button?.getAttribute('style')??null,
                    transform:button?.style.getPropertyValue('transform')??null,
                    transformPriority:button?.style.getPropertyPriority('transform')??null};})()`);
                const offscreenRun = await runInventoryOffscreenProbe({
                  setup: () => evalIn(`(()=>{const button=document.querySelector(${JSON.stringify(actionSelector)}),
                    card=button?.closest('.inventory-sheet-card')||null,prior=${JSON.stringify(offscreenPrior)},
                    prepare=${PREPARE_INVENTORY_ACTION_OFFSCREEN_SOURCE};
                    window.__cfInventoryOffscreenOwner={button,card};
                    return prepare(button,card,prior,{width:window.innerWidth,height:window.innerHeight},
                      (x,y)=>document.elementFromPoint(x,y));})()`),
                  activate: () => activateRealControl(
                    actionSelector, `${vp.label} Inventory offscreen action control`, { dispatch: false },
                  ),
                  restore: (setup, setupError) => evalIn(buildInventoryActionOffscreenRestoreSource(
                    offscreenPrior, setupError !== null || setup?.mutationApplied === true,
                  )),
                });
                const offscreenSetupRect = offscreenRun.offscreenSetup?.target?.rect;
                const offscreenSetupGeometry = Array.isArray(offscreenSetupRect)
                  && offscreenSetupRect.length === 4
                  && offscreenSetupRect[2] - offscreenSetupRect[0] >= 44
                  && offscreenSetupRect[3] - offscreenSetupRect[1] >= 44
                  && (offscreenSetupRect[2] <= 0 || offscreenSetupRect[0] >= vp.width
                    || offscreenSetupRect[3] <= 0 || offscreenSetupRect[1] >= vp.height)
                  && offscreenRun.offscreenSetup?.target?.fullyOutside === true
                  && offscreenRun.offscreenSetup?.target?.hit === null;
                const offscreenProbeRect = offscreenRun.offscreenProbe?.target?.rect;
                const offscreenProbeGeometry = Array.isArray(offscreenProbeRect)
                  && offscreenProbeRect.length === 4
                  && offscreenProbeRect[2] - offscreenProbeRect[0] >= 44
                  && offscreenProbeRect[3] - offscreenProbeRect[1] >= 44
                  && (offscreenProbeRect[2] <= 0 || offscreenProbeRect[0] >= vp.width
                    || offscreenProbeRect[3] <= 0 || offscreenProbeRect[1] >= vp.height)
                  && offscreenRun.offscreenProbe?.target?.hit === null;
                actionReachabilityControl = { ok: offscreenPrior.ok === true
                    && offscreenRun.setupError === null && offscreenRun.offscreenSetup?.ok === true
                    && offscreenRun.offscreenSetup?.top === 0 && offscreenSetupGeometry
                    && offscreenRun.probeAttempted === true && offscreenRun.probeError === null
                    && offscreenRun.offscreenProbe?.ok === false
                    && offscreenRun.offscreenProbe?.inputDispatched === false
                    && offscreenRun.offscreenProbe?.target?.receiptListenerArmed === false
                    && offscreenRun.offscreenProbe?.receipt === null && offscreenProbeGeometry
                    && offscreenRun.restorationError === null && offscreenRun.restored?.ok === true
                    && offscreenRun.restored.scrollTop === offscreenPrior.saved
                    && offscreenRun.restored.styleRestored === true,
                  skipped: false, offscreenPrior, offscreenSetupGeometry, offscreenProbeGeometry,
                  ...offscreenRun };
              }
              const actionFrame = await topFrameState();
              const actionContexts = [...runtimeContexts.values()].filter((row) => row.active
                && row.isDefault && row.frameId === actionFrame.frameId);
              const actionContext = actionContexts.length === 1 ? actionContexts[0] : null;
              const actionContextEvidence = { frame: actionFrame, contexts: actionContexts };
              if (!actionContext?.uniqueId || actionContext.origin !== new URL(url).origin) {
                recordInstrumentFailure(`${vp.label}: Inventory exact action context unavailable (${JSON.stringify(actionContextEvidence)})`);
              }
              let actionHeartbeatQuiescence = null;
              let actionPrimaryError = null;
              try {
                actionHeartbeatQuiescence = await evalIn('window.__CF_SLICE__.api.__smokeQuiesceF4Heartbeat()');
                if (actionHeartbeatQuiescence?.schema !== 'cf-v2-f4-heartbeat-quiescence/v1'
                  || actionHeartbeatQuiescence?.documentToken !== ready.token
                  || actionHeartbeatQuiescence?.wasRunning !== true
                  || actionHeartbeatQuiescence?.stopped !== true
                  || actionHeartbeatQuiescence?.cycleSettled !== true) {
                  recordInstrumentFailure(`${vp.label}: Inventory action heartbeat did not quiesce (${JSON.stringify(actionHeartbeatQuiescence)})`);
                }
                const actionArm = await evalIn(`(()=>{const S=window.__CF_SLICE__,state=S.api.state(),
                  coordinator=state.engineering?.actionCoordinator??null,
                  documentOwner={token:S.documentToken??null,href:location.href},
                  authority={pendingPersistenceWrites:state.sceneResources?.pendingPersistenceWrites??null,
                    mutationBlocked:state.persistence?.mutationBlocked??null,
                    leaseOwned:state.persistence?.runtime?.leaseOwned??null,
                    inFlight:coordinator?.inFlight??null,owner:coordinator?.owner??null,hold:coordinator?.hold??null},
                  rowElements=[...document.querySelectorAll('#inventorypanel [data-inventory-row="exact"]')],
                  before={revision:state.inventory.revision,entryIds:[...state.inventory.entryIds],
                    equippedBindings:(state.inventory.equippedBindings||[]).map(binding=>({...binding})),
                    rowIds:rowElements.map(row=>row.getAttribute('data-instance-id')),
                    domEquipped:rowElements.map(row=>row.getAttribute('data-equipped'))},
                  button=document.querySelector(${JSON.stringify(actionSelector)}),
                  documentOwned=documentOwner.token===${JSON.stringify(ready.token)}
                    &&documentOwner.href===${JSON.stringify(url)},
                  authorityOk=documentOwned&&authority.pendingPersistenceWrites===0&&authority.mutationBlocked===false
                    &&authority.leaseOwned===true&&authority.inFlight===false
                    &&authority.owner?.busy===false&&authority.owner?.operation===null
                    &&['idle','released'].includes(authority.hold?.phase),
                  holdArmed=!!button&&authorityOk&&S.api.__smokeArmProductActionHold()===true,
                  hold=S.api.state().engineering?.actionCoordinator?.hold??null,
                  holdSequenceAdvanced=Number.isSafeInteger(authority.hold?.sequence)
                    &&hold?.sequence===authority.hold.sequence+1;
                  if(!button||!authorityOk||!holdArmed||hold?.phase!=='armed'
                    ||hold?.operation!==null||!holdSequenceAdvanced)return {ok:false,
                    why:!button?'enabled equip action missing':!documentOwned?'action document owner changed':
                      !authorityOk?'action authority unavailable':'diagnostic hold did not arm',
                    before,documentOwner,documentOwned,authority,holdArmed,hold,holdSequenceAdvanced};
                  delete window.__cfInventoryActionReceipt;window.__cfInventoryActionReceiptAbort?.abort();const controller=new AbortController();
                  window.__cfInventoryActionReceiptAbort=controller;document.addEventListener('click',(event)=>{
                    const target=event.target instanceof Element?event.target.closest('[data-inventory-action]'):null,
                      controlErrors=[],receipt={trusted:event.isTrusted,
                        operation:target?.getAttribute('data-inventory-action')||null,
                        instanceId:target?.getAttribute('data-instance-id')||null,before,baseline:null,
                        bindingControlApplied:false,bindingOwnerRestored:false,bindingBroken:null,bindingRestored:null,
                        domControlApplied:false,domControlRestored:false,domBroken:null,domRestored:null,
                        identityControlApplied:false,identityControlRestored:false,identityBroken:null,restored:null,
                        controlErrors,controlError:null};
                    try{
                      receipt.baseline=window.__CF_GLASS_AUDIT__.inventoryBusyOutcome(before);
                      const priorState=S.api.state,runtimeSnapshot=priorState(),
                        poisonedBindings=(runtimeSnapshot.inventory?.equippedBindings||[]).map(binding=>({...binding}));
                      if(poisonedBindings.length)poisonedBindings[0]={...poisonedBindings[0],instanceId:String(poisonedBindings[0].instanceId)+':optimistic-binding'};
                      else poisonedBindings.push({slot:'control',instanceId:'optimistic-binding'});
                      try{S.api.state=()=>{const current=priorState();return {...current,
                        inventory:{...current.inventory,equippedBindings:poisonedBindings.map(binding=>({...binding}))}}};
                        receipt.bindingControlApplied=JSON.stringify(S.api.state().inventory.equippedBindings)===JSON.stringify(poisonedBindings);
                        receipt.bindingBroken=window.__CF_GLASS_AUDIT__.inventoryBusyOutcome(before);
                      }catch(error){controlErrors.push('binding:'+String(error?.message||error));}
                      finally{S.api.state=priorState;}
                      receipt.bindingOwnerRestored=S.api.state===priorState;
                      receipt.bindingRestored=window.__CF_GLASS_AUDIT__.inventoryBusyOutcome(before);
                      const row=[...document.querySelectorAll('#inventorypanel [data-inventory-row="exact"]')]
                          .find(candidate=>candidate.getAttribute('data-instance-id')===${JSON.stringify(thermalId)})||null,
                        priorEquipped=row?.getAttribute('data-equipped')??null,
                        toggledEquipped=priorEquipped==='true'?'false':'true';
                      try{
                        if(!row)throw new Error('exact Inventory row missing during DOM control');
                        row.setAttribute('data-equipped',toggledEquipped);
                        receipt.domControlApplied=row.getAttribute('data-equipped')===toggledEquipped;
                        receipt.domBroken=window.__CF_GLASS_AUDIT__.inventoryBusyOutcome(before);
                      }catch(error){controlErrors.push('dom:'+String(error?.message||error));}
                      finally{
                        if(row){if(priorEquipped===null)row.removeAttribute('data-equipped');else row.setAttribute('data-equipped',priorEquipped);}
                        receipt.domControlRestored=!!row&&row.getAttribute('data-equipped')===priorEquipped;
                        try{receipt.domRestored=window.__CF_GLASS_AUDIT__.inventoryBusyOutcome(before);}
                        catch(error){controlErrors.push('dom-restore:'+String(error?.message||error));}
                      }
                      const identityRow=document.querySelector('#inventorypanel [data-inventory-row="exact"]'),
                        priorId=identityRow?.getAttribute('data-instance-id')??null;
                      try{
                        if(!identityRow)throw new Error('Inventory identity row missing during DOM control');
                        identityRow.setAttribute('data-instance-id','stale-optimistic-row');
                        receipt.identityControlApplied=identityRow.getAttribute('data-instance-id')==='stale-optimistic-row';
                        receipt.identityBroken=window.__CF_GLASS_AUDIT__.inventoryBusyOutcome(before);
                      }catch(error){controlErrors.push('identity:'+String(error?.message||error));}
                      finally{
                        if(identityRow){if(priorId===null)identityRow.removeAttribute('data-instance-id');else identityRow.setAttribute('data-instance-id',priorId);}
                        receipt.identityControlRestored=!!identityRow&&identityRow.getAttribute('data-instance-id')===priorId;
                        try{receipt.restored=window.__CF_GLASS_AUDIT__.inventoryBusyOutcome(before);}
                        catch(error){controlErrors.push('identity-restore:'+String(error?.message||error));}
                      }
                    }catch(error){controlErrors.push('receipt:'+String(error?.message||error));}
                    finally{receipt.controlError=controlErrors.length?controlErrors.join('; '):null;
                      window.__cfInventoryActionReceipt=receipt;window.__cfInventoryActionReceiptAbort=null;}
                  },{once:true,signal:controller.signal});
                  return {ok:'__cfInventoryActionReceiptAbort' in window,before,documentOwner,
                    documentOwned,authority,holdArmed,hold,holdSequenceAdvanced};})()`);
                const preActionInstrumentControl = {
                  arm: actionArm,
                  actionScroll,
                  actionReachabilityControl,
                  actionContext: actionContextEvidence,
                  heartbeatQuiescence: actionHeartbeatQuiescence,
                  ok: actionArm.ok === true && actionScroll.ok === true
                    && actionReachabilityControl.ok === true,
                };
                if (!preActionInstrumentControl.ok) {
                  recordInstrumentFailure(`${vp.label}: Inventory action setup/offscreen control failed or did not restore before product input (${JSON.stringify(preActionInstrumentControl)})`);
                }
                const realAction = await activateRealControl(
                  actionSelector,
                  `${vp.label} Inventory exact equip`,
                  { expectedDocumentToken: ready.token },
                );
                if (realAction?.target?.documentOwned !== true
                  || realAction?.target?.documentToken !== ready.token) {
                  recordInstrumentFailure(`${vp.label}: Inventory document owner changed before native input (${JSON.stringify(realAction)})`);
                }
                const pendingObservation = await observeOutcome(`(()=>{const S=window.__CF_SLICE__,
                  diagnostics=S.api.inventoryDiagnostics(),state=S.api.state(),
                  coordinator=state.engineering?.actionCoordinator??null,action=diagnostics?.lastAction??null,
                  receipt=window.__cfInventoryActionReceipt||null,
                  exactAction=action?.operation==='equip'&&action?.instanceId===${JSON.stringify(thermalId)},
                  terminal=diagnostics?.pendingWork===0&&exactAction
                    &&['committed','unchanged','unavailable','refused'].includes(action?.kind),
                  hold=coordinator?.hold??null,
                  holdSequenceExact=hold?.sequence===${Number(actionArm?.hold?.sequence)},
                  holdContaminated=!holdSequenceExact
                    ||(hold?.phase==='armed'?hold?.operation!==null:
                      hold?.phase==='holding'?hold?.operation!=='arc2.equip':true),
                  holding=holdSequenceExact&&diagnostics?.pendingWork===1&&coordinator?.inFlight===true
                    &&coordinator?.owner?.busy===true&&coordinator?.owner?.operation==='arc2.equip'
                    &&hold?.phase==='holding'&&hold?.operation==='arc2.equip';
                  return {schema:'cf-v2-glass-inventory-action-progress/v1',receipt,diagnostics,
                    coordinator,holdSequenceExact,holdContaminated,holding,terminal};})()`,
                (value) => value?.holding === true || value?.terminal === true
                  || value?.holdContaminated === true,
                actionContext.id, 10000, { productFinding: {
                  code: 'INVENTORY_ACTION_NO_OPTIMISM', surface: 'inventory-action-pending',
                  element: '#inventorysheet [data-inventory-action="equip"]',
                  expected: 'the native exact equip remains externally answerable while its deterministic pending hold owns the product action',
                } });
                const consumedActionReceipt = await evalIn(`(()=>{const receipt=window.__cfInventoryActionReceipt||null;
                  window.__cfInventoryActionReceiptAbort?.abort();delete window.__cfInventoryActionReceiptAbort;
                  delete window.__cfInventoryActionReceipt;return receipt;})()`);
                const actionReceipt = consumedActionReceipt ?? pendingObservation.value?.receipt ?? null;
                if (pendingObservation.value?.holdContaminated === true) {
                  const contaminatedHoldRelease = await evalIn(`(()=>{const S=window.__CF_SLICE__,
                    before=S.api.state().engineering?.actionCoordinator?.hold??null,
                    requested=before?.phase==='holding'&&S.api.__smokeReleaseProductActionHold()===true,
                    after=S.api.state().engineering?.actionCoordinator?.hold??null;
                    return {before,requested,after};})()`);
                  recordInstrumentFailure(`${vp.label}: Inventory diagnostic hold was consumed by another action before native input (${JSON.stringify({
                    actionState: pendingObservation.value, contaminatedHoldRelease,
                  })})`);
                }
                const actionControlCore = inventoryActionPendingOutcome({
                  preActionInstrumentControl,
                  realAction,
                  receipt: actionReceipt,
                  actionState: pendingObservation.value,
                  expectedOperation: 'equip',
                  expectedInstanceId: thermalId,
                  expectedHoldOperation: 'arc2.equip',
                  expectedHoldSequence: actionArm.hold.sequence,
                });
                const publicationControl = { ok: actionReceipt?.controlError === null
                    && Array.isArray(actionReceipt?.controlErrors)
                    && actionReceipt.controlErrors.length === 0
                    && actionReceipt?.bindingControlApplied === true
                    && actionReceipt?.bindingOwnerRestored === true
                    && actionReceipt?.bindingBroken?.ok === false
                    && actionReceipt?.bindingBroken?.entryIdsMatch === true
                    && actionReceipt?.bindingBroken?.runtimeBindingsMatch === false
                    && actionReceipt?.bindingBroken?.rowIdsMatch === true
                    && actionReceipt?.bindingBroken?.domEquippedMatch === true
                    && actionReceipt?.bindingRestored?.ok === true
                    && actionReceipt?.domControlApplied === true && actionReceipt?.domControlRestored === true
                    && actionReceipt?.domBroken?.ok === false
                    && actionReceipt?.domBroken?.entryIdsMatch === true
                    && actionReceipt?.domBroken?.runtimeBindingsMatch === true
                    && actionReceipt?.domBroken?.rowIdsMatch === true
                    && actionReceipt?.domBroken?.domEquippedMatch === false
                    && actionReceipt?.domRestored?.ok === true
                    && actionReceipt?.identityControlApplied === true
                    && actionReceipt?.identityControlRestored === true
                    && actionReceipt?.identityBroken?.ok === false
                    && actionReceipt?.identityBroken?.entryIdsMatch === true
                    && actionReceipt?.identityBroken?.runtimeBindingsMatch === true
                    && actionReceipt?.identityBroken?.rowIdsMatch === false
                    && actionReceipt?.identityBroken?.domEquippedMatch === true
                    && actionReceipt?.restored?.ok === true,
                  receipt: actionReceipt };
                const publicationInstrumentError = actionControlCore.productPrerequisite
                  && (actionReceipt?.controlError !== null
                    || !Array.isArray(actionReceipt?.controlErrors)
                    || actionReceipt.controlErrors.length > 0);
                if (publicationInstrumentError) {
                  recordInstrumentFailure(`${vp.label}: Inventory publication control plumbing failed (${JSON.stringify(publicationControl)})`);
                }
                if (actionControlCore.productPrerequisite
                  && actionControlCore.checks.pendingBaseline
                  && actionControlCore.pendingOwnerExact) {
                  if (!publicationControl.ok) {
                    recordInstrumentFailure(`${vp.label}: optimistic Inventory binding/DOM publication stayed green or failed to restore (${JSON.stringify(publicationControl)})`);
                  }
                  if (!inventoryControlRun) recordControls('inventory-action-publication');
                }
                const actionRelease = await evalIn(`(()=>{const S=window.__CF_SLICE__,
                  before=S.api.state().engineering?.actionCoordinator?.hold??null,
                  requested=before?.phase==='holding'&&S.api.__smokeReleaseProductActionHold()===true,
                  after=S.api.state().engineering?.actionCoordinator?.hold??null;
                  return {before,requested,after};})()`);
                const actionReleaseControl = {
                  beforeExact: actionRelease?.before?.phase === 'holding'
                    && actionRelease?.before?.operation === 'arc2.equip'
                    && actionRelease?.before?.sequence === actionArm.hold.sequence,
                  requested: actionRelease?.requested === true,
                  afterExact: ['release-requested', 'released'].includes(actionRelease?.after?.phase)
                    && actionRelease?.after?.operation === 'arc2.equip'
                    && actionRelease?.after?.sequence === actionArm.hold.sequence,
                  actionRelease,
                };
                actionReleaseControl.ok = actionReleaseControl.beforeExact
                  && actionReleaseControl.requested && actionReleaseControl.afterExact;
                if (actionControlCore.pendingOwnerExact && !actionReleaseControl.ok) {
                  recordInstrumentFailure(`${vp.label}: Inventory deterministic action hold did not release (${JSON.stringify(actionReleaseControl)})`);
                }
                const actionControl = {
                  ...actionControlCore,
                  publicationControl,
                  actionReleaseControl,
                  pendingSettledWithinBound: pendingObservation.settled,
                  pendingProbeCommandCount: pendingObservation.commands.length,
                  ok: actionControlCore.ok === true,
                };
                const pendingOutcome = {
                  ...actionControl,
                  realOpen: realActionDetailOpen,
                  ok: realActionDetailOpen?.ok === true && actionControl.ok === true,
                };
                const pendingExpected = 'a real pending exact equip disables every action and leaves the full runtime equipped bindings and every DOM row data-equipped state unchanged';
                addOutcome(vp.label, 'inventory-action-pending', 'INVENTORY_ACTION_NO_OPTIMISM', '#inventorysheet [data-inventory-action="equip"]',
                  pendingOutcome, pendingExpected);
                stopAfterRecordedProductOutcome(vp.label, 'inventory-action-pending',
                  'INVENTORY_ACTION_NO_OPTIMISM', '#inventorysheet [data-inventory-action="equip"]',
                  pendingOutcome, pendingExpected);
                const settlementExpected = {
                  operation: 'equip',
                  instanceId: thermalId,
                  revision: Number(inventoryCarrier?.arc2?.inventory?.revision) + 1,
                  holdOperation: 'arc2.equip',
                  holdSequence: actionArm?.hold?.sequence ?? null,
                };
                const settlementObservation = await observeOutcome(
                  buildInventoryActionSettlementSource(settlementExpected),
                  (value) => value?.observationComplete === true,
                  actionContext.id,
                  10000,
                  { productFinding: {
                    code: 'INVENTORY_ACTION_COMMITTED', surface: 'inventory-action-settled',
                    element: '#inventorysheet',
                    expected: 'the exact Inventory action reaches a structured terminal state while the browser process remains responsive',
                  } },
                );
                const settledAction = settlementObservation.value ?? {
                  schema: 'cf-v2-glass-inventory-action-settlement/v1',
                  terminal: false,
                  observationComplete: false,
                  ok: false,
                  error: 'Inventory action settlement returned no structured product state',
                  action: null,
                  diagnostics: null,
                  inventory: null,
                  authority: null,
                  checks: null,
                };
                const settledOutcome = {
                  ...settledAction,
                  settledWithinBound: settlementObservation.settled,
                  probeCommandCount: settlementObservation.commands.length,
                  ok: settlementObservation.settled && settledAction?.ok === true,
                };
                const settledExpected = 'the one durable action publishes one newer exact carrier and refreshes the still-owned modal';
                addOutcome(vp.label, 'inventory-action-settled', 'INVENTORY_ACTION_COMMITTED', '#inventorysheet',
                  settledOutcome, settledExpected);
                stopAfterRecordedProductOutcome(vp.label, 'inventory-action-settled',
                  'INVENTORY_ACTION_COMMITTED', '#inventorysheet', settledOutcome, settledExpected);
                const committedCarrier = await evalIn(READ_ARC2_GLASS_CARRIER_EXPRESSION);
                addOutcome(vp.label, 'inventory-action-settled', 'INVENTORY_COMMITTED_CARRIER_DOM_PARITY', item.panel,
                  await evalIn(`window.__CF_GLASS_AUDIT__.inventoryRowsOutcome(${JSON.stringify(committedCarrier)},${JSON.stringify(opener)})`),
                  'the committed durable carrier, runtime projection, and exact rows converge before another action is offered');
              } catch (error) {
                actionPrimaryError = error;
                throw error;
              } finally {
                try {
                  const actionCleanup = await evalIn(`(()=>{const S=window.__CF_SLICE__,
                    holdBefore=S?.api?.state?.().engineering?.actionCoordinator?.hold??null,
                    releaseRequested=holdBefore?.phase==='holding'
                      ?S.api.__smokeReleaseProductActionHold()===true:false;
                    window.__cfInventoryActionReceiptAbort?.abort();delete window.__cfInventoryActionReceiptAbort;
                    delete window.__cfInventoryActionReceipt;
                    const resume=S?.api?.__smokeResumeF4Heartbeat?.()??null,
                      holdAfter=S?.api?.state?.().engineering?.actionCoordinator?.hold??null;
                    return {holdBefore,releaseRequested,holdAfter,resume};})()`);
                  const resumeOk = actionCleanup?.resume?.schema === 'cf-v2-f4-heartbeat-resume/v1'
                    && actionCleanup?.resume?.documentToken === ready.token
                    && actionCleanup?.resume?.running === true;
                  if (!actionPrimaryError && !resumeOk) {
                    recordInstrumentFailure(`${vp.label}: Inventory action heartbeat did not resume (${JSON.stringify(actionCleanup)})`);
                  }
                } catch (cleanupError) {
                  if (!actionPrimaryError) throw cleanupError;
                }
              }

              if (!inventoryControlRun) {
                const convergenceControl = await evalIn(`(()=>{const S=window.__CF_SLICE__,prior=S.api.inventoryDiagnostics,actions=[...document.querySelectorAll('#inventorysheet [data-inventory-action]')],
                  attrs=actions.map(button=>({disabled:button.disabled,enabled:button.getAttribute('data-action-enabled'),reason:button.getAttribute('data-protected-reason')})),
                  current=prior(),synthetic={...current,pendingWork:0,lastAction:{operation:'equip',instanceId:${JSON.stringify(thermalId)},kind:'committed',detail:'revision:control;publication-reload'}};
                  S.api.inventoryDiagnostics=()=>synthetic;actions.forEach(button=>{button.disabled=true;button.setAttribute('data-action-enabled','false');button.setAttribute('data-protected-reason','convergence-reload');});
                  const baseline=window.__CF_GLASS_AUDIT__.inventoryConvergenceOutcome();if(actions[0]){actions[0].disabled=false;actions[0].setAttribute('data-action-enabled','true');}
                  const broken=window.__CF_GLASS_AUDIT__.inventoryConvergenceOutcome();actions.forEach((button,index)=>{const saved=attrs[index];button.disabled=saved.disabled;
                    if(saved.enabled===null)button.removeAttribute('data-action-enabled');else button.setAttribute('data-action-enabled',saved.enabled);
                    if(saved.reason===null)button.removeAttribute('data-protected-reason');else button.setAttribute('data-protected-reason',saved.reason);});S.api.inventoryDiagnostics=prior;
                  return {ok:baseline.ok&&broken.ok===false&&window.__CF_SLICE__.api.inventoryDiagnostics===prior,baseline,broken};})()`);
                if (!convergenceControl.ok) {
                  recordInstrumentFailure(`${vp.label}: enabled post-convergence Inventory retry stayed green or failed to restore (${JSON.stringify(convergenceControl)})`);
                }
                recordControls('inventory-convergence-retry');
                inventoryControlRun = true;
              }
              await pressEscape();
              await waitFor('Inventory post-action close', `window.__CF_SLICE__.api.inventoryDiagnostics().activeCount===0&&document.getElementById('inventorysheet')?.hidden===true`);
              addOutcome(vp.label, 'inventory-post-action-release', 'INVENTORY_POST_ACTION_RELEASE', '#inventorysheet',
                await evalIn(`window.__CF_GLASS_AUDIT__.inventoryClosedOutcome(${JSON.stringify(thermalId)})`),
                'post-action Escape leaves zero active, retained, or pending Inventory ownership');
            }
          }
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
            if (labelControl.ok) recordInstrumentFailure(`${vp.label}: internal-id close-label injection stayed green (${JSON.stringify(labelControl)})`);
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
            if (layerControl.ok) recordInstrumentFailure(`${vp.label}: synthesized panel-under-Planetside injection stayed green (${JSON.stringify(layerControl)})`);
            recordControls('panel-planetside-layering');
          }
          const preservedSurface = overSurvey ? '#survey' : '#planetside';
          const shipyardClosedCheck = item.shipyard ? `(()=>{const S=window.__CF_SLICE__,panel=document.getElementById('shipyardpanel'),
            opener=document.querySelector(${JSON.stringify(opener)}),preserved=document.querySelector(${JSON.stringify(preservedSurface)}),
            diag=S?.api?.shipyardDiagnostics?.(),eng=diag?.engineering,body=panel?.querySelector('[data-engineering-panel-body]'),
            panelStyle=panel?getComputedStyle(panel):null,
            preservedStyle=preserved?getComputedStyle(preserved):null,diagKeys=diag?Object.keys(diag).sort():[],
            expectedDiagKeys=['activePreviewCount','engineering','pendingPreviewWork','retainedPreviewCount','schema','stateKey','status'].sort(),
            engKeys=eng?Object.keys(eng).sort():[],expectedEngKeys=['actionControlCount','activeCount','activePreviewCount','delegatedListenerCount','faultCount','lastRequest','pendingWork','previewStateKey','retainedDomCount','retainedPreviewCount','schema'].sort(),
            previews=panel?.querySelectorAll('[data-cf-shipyard-preview="v1"]').length??-1;
            return {ok:S?.api?.state?.().panelOpen===null&&panelStyle?.display==='none'&&previews===0
              &&diag?.schema==='cf-v2-shipyard-diagnostics/v1'&&diag?.status==='closed'&&diag?.stateKey===null
              &&diag?.activePreviewCount===0&&diag?.retainedPreviewCount===0&&diag?.pendingPreviewWork===0
              &&JSON.stringify(diagKeys)===JSON.stringify(expectedDiagKeys)
              &&eng?.schema==='cf-v2-engineering-panel-diagnostics/v1'&&eng?.activeCount===0
              &&eng?.retainedDomCount===0&&eng?.pendingWork===0&&eng?.actionControlCount===0
              &&eng?.activePreviewCount===0&&eng?.previewStateKey===null&&eng?.retainedPreviewCount===0
              &&eng?.delegatedListenerCount===1
              &&eng?.faultCount===0&&JSON.stringify(engKeys)===JSON.stringify(expectedEngKeys)
              &&body?.childElementCount===0
              &&opener?.getAttribute('aria-expanded')==='false'&&document.activeElement===opener
              &&preservedStyle?.display!=='none'&&preservedStyle?.visibility!=='hidden',
              panelOpen:S?.api?.state?.().panelOpen??null,panelDisplay:panelStyle?.display||null,previews,
              diag,diagKeys,expectedDiagKeys,engKeys,expectedEngKeys,bodyChildren:body?.childElementCount??-1,
              expanded:opener?.getAttribute('aria-expanded')||null,
              focus:document.activeElement?.id||null,preservedDisplay:preservedStyle?.display||null};})()` : null;
          let realShipyardClose = null;
          let closed;
          if (item.shipyard) {
            realShipyardClose = await activateRealControl('#shipyardpanel [data-pnx="shipyard"]', `${vp.label} Shipyard Close`);
            await waitFor(`${item.name} real close`, `window.__CF_SLICE__.api.state().panelOpen===null`);
            const closeState = await evalIn(shipyardClosedCheck);
            closed = { ...closeState, ok: realShipyardClose?.ok === true && closeState.ok,
              realClose: realShipyardClose };
            addOutcome(vp.label, composition, 'SHIPYARD_CLOSED_RELEASE', item.panel, closed,
              'real Close removes the only preview, publishes exact closed diagnostics, preserves the underlying surface, and restores opener focus');
            if (!shipyardControlRun) {
              const retainedControl = await evalIn(`(()=>{const panel=document.getElementById('shipyardpanel'),
                body=panel?.querySelector('[data-engineering-panel-body]'),retained=window.__cfShipyardClosedControl||null,
                retainedDom=window.__cfEngineeringClosedControl||null;if(retained)panel?.appendChild(retained);
                const previewBroken=${shipyardClosedCheck};retained?.remove();if(retainedDom)body?.appendChild(retainedDom);
                const domBroken=${shipyardClosedCheck};retainedDom?.remove();delete window.__cfShipyardClosedControl;
                delete window.__cfEngineeringClosedControl;
                return {ok:previewBroken.ok===false&&previewBroken.previews===1&&domBroken.ok===false
                    &&domBroken.bodyChildren===1&&${shipyardClosedCheck}.ok,previewBroken,domBroken};})()`);
              if (!retainedControl.ok) {
                recordInstrumentFailure(`${vp.label}: retained Engineering preview/DOM after Close controls stayed green or failed to restore (${JSON.stringify(retainedControl)})`);
              }
              recordControls('shipyard-close-release');
              shipyardControlRun = true;
            }
          } else {
            closed = await evalIn(`window.__CF_GLASS_AUDIT__.panelCloseOutcome(${JSON.stringify(item.panel)},'[data-pnx]',${JSON.stringify(opener)},${JSON.stringify(preservedSurface)})`);
          }
          addOutcome(vp.label, composition, 'ORDINARY_PANEL_CLOSE_OUTCOME', `${item.panel} [data-pnx]`, closed,
            `close owns its centre, closes the panel, preserves ${overSurvey ? 'the survey' : 'Planetside'}, and restores logical opener focus`);
          if (item.inventory) {
            addOutcome(vp.label, composition, 'INVENTORY_PANEL_CLOSE_RELEASE', '#inventorysheet',
              await evalIn('window.__CF_GLASS_AUDIT__.inventoryClosedOutcome(null)'),
              'ordinary panel Close leaves its modal owner disposed to zero active, retained, and pending work');
          }
          if (!closed.ok) await evalIn(`document.querySelector(${JSON.stringify(item.panel)}+' [data-pnx]')?.click()`);
          await waitFor(`${item.name} closed`, `window.__CF_SLICE__.api.state().panelOpen===null && window.__CF_SLICE__.api.state().cardOpen===${JSON.stringify(overSurvey)}`);
          if (vp.label === 'phone-landscape' && item.id === 'codex') {
            const chromeRestored = await evalIn(`(()=>{const opener=document.querySelector(${JSON.stringify(opener)}),
              survey=document.getElementById('survey'),expected=${JSON.stringify(chromeBeforePanel)},rows=['topbar','ctxbar','hintpill','searchbox','dock'].map(id=>{const el=document.getElementById(id),style=el?getComputedStyle(el):null;
                const r=el?.getBoundingClientRect();return {id,display:style?.display||'missing',visibility:style?.visibility||'missing',
                  pointerEvents:style?.pointerEvents||'missing',rect:r?[r.left,r.top,r.right,r.bottom]:null};}),surveyStyle=survey?getComputedStyle(survey):null,
              surveyRect=survey?.getBoundingClientRect(),searchRect=document.getElementById('searchbox')?.getBoundingClientRect(),
              dockRect=document.getElementById('dock')?.getBoundingClientRect(),intersects=(a,b)=>!!a&&!!b&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1,
              policyMatches=Array.isArray(expected)&&expected.length===rows.length&&rows.every(row=>{const prior=expected.find(entry=>entry.id===row.id);
                return !!prior&&row.display===prior.display&&row.visibility===prior.visibility&&row.pointerEvents===prior.pointerEvents;});
              return {ok:!document.body.classList.contains('panel-open')&&document.body.classList.contains('card-open')&&document.activeElement===opener
                  &&policyMatches&&rows.every(row=>row.visibility==='visible')
                  &&rows.filter(row=>row.id!=='ctxbar').every(row=>row.display!=='none')&&rows.find(row=>row.id==='ctxbar')?.display==='none'
                  &&surveyStyle?.display!=='none'&&surveyStyle?.visibility==='visible'
                  &&dockRect&&Math.abs((dockRect.left+dockRect.right)/2-innerWidth/2)<=1
                  &&!intersects(surveyRect,searchRect)&&!intersects(surveyRect,dockRect),active:document.activeElement?.id||null,
                opener:opener?.id||null,surveyDisplay:surveyStyle?.display||'missing',dockCentered:dockRect?((dockRect.left+dockRect.right)/2):null,
                surveySearchOverlap:intersects(surveyRect,searchRect),surveyDockOverlap:intersects(surveyRect,dockRect),policyMatches,expected,rows};})()`);
            addOutcome(vp.label, 'compendium-short-landscape-close', 'MOBILE_PANEL_CHROME_NOT_RESTORED', opener, chromeRestored,
              'Close synchronously restores the centered dock, status chrome, opener focus, and the separate Survey/Search composition');
          }
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
            recordInstrumentFailure(`${vp.label}: could not construct hidden panel-opener focus state (${JSON.stringify(hiddenOpenerSetup)})`);
          }
          await evalIn(`document.querySelector('#recpanel [data-pnx]')?.click()`);
          await waitFor('hidden-opener panel close', `window.__CF_SLICE__.api.state().panelOpen===null`);
          const fallbackCheck = `(()=>{ const rail=document.getElementById('railrecords'),survey=document.getElementById('docksurvey');return {
            ok:rail.getClientRects().length===0&&document.activeElement===survey&&window.__CF_SLICE__.api.state().cardOpen,
            railRendered:rail.getClientRects().length>0,focus:document.activeElement?.id||null,cardOpen:window.__CF_SLICE__.api.state().cardOpen};})()`;
          addOutcome(vp.label, 'hidden-panel-opener-focus', 'PANEL_HIDDEN_OPENER_FOCUS_LOST', '#docksurvey', await evalIn(fallbackCheck),
            'closing a panel whose rail opener became hidden restores focus to the visible Survey control');
          const fallbackControl = await evalIn(`(()=>{ document.querySelector('canvas')?.focus();return ${fallbackCheck};})()`);
          if (fallbackControl.ok) recordInstrumentFailure(`${vp.label}: wrong hidden-opener fallback focus stayed green (${JSON.stringify(fallbackControl)})`);
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
        const chromeRestoreBaseline = await evalIn(chromeRestoreCheck);
        const chromeRestoreExpected = landscapeSurfaceYieldsTrail
          ? 'short-landscape surface mode keeps populated trail/objective rows yielded to Planetside'
          : mobileSurfaceYieldsObjective
            ? 'landed portrait restores the trail when a useful band fits, otherwise marks the bounded trail-yield fallback; the objective yields throughout'
            : 'closing the last card restores every populated desktop trail/objective surface';
        addOutcome(vp.label, 'survey-chrome-restore', 'MOBILE_CHROME_NOT_RESTORED', '#trail,#objchip', chromeRestoreBaseline,
          chromeRestoreExpected);
        stopAfterRecordedProductOutcome(vp.label, 'survey-chrome-restore',
          'MOBILE_CHROME_NOT_RESTORED', '#trail,#objchip', chromeRestoreBaseline,
          chromeRestoreExpected);
        if (!chromeRestoreControlRun) {
          const restoreControl = await evalIn(`(()=>{ const el=document.getElementById('trail'),baseline=${chromeRestoreCheck},prior={
              value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display'),computed:getComputedStyle(el).display},
              requested=prior.computed==='none'?'block':'none';let mutation;
            try{el.style.setProperty('display',requested,'important');mutation={requested,
              property:{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')},
              computed:getComputedStyle(el).display,outcome:${chromeRestoreCheck}};}
            finally{if(prior.value===''&&prior.priority==='')el.style.removeProperty('display');else el.style.setProperty('display',prior.value,prior.priority);}
            const restored={property:{value:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')},
              computed:getComputedStyle(el).display,outcome:${chromeRestoreCheck}};
            return {baseline,prior,mutation,restored};})()`);
          const restoreControlAssessment = trailRestorationControlOutcome(restoreControl);
          if (!restoreControlAssessment.ok) {
            stopInstrumentControl(`${vp.label}: measured-opposite trail restoration control did not change, turn red, and restore exactly (${JSON.stringify({ restoreControl, restoreControlAssessment })})`);
          }
          chromeRestoreControlRun = true;
          recordControls('mobile-chrome-yield-restore');
        }
        if (landscapeSurfaceYieldsTrail && !chromeLandscapeControlRun) {
          chromeLandscapeControlRun = true;
          const landscapeControl = await evalIn(`(()=>{ const el=document.getElementById('trail'),prior=el.getAttribute('style');
            el.style.setProperty('display','block','important');const result=${chromeRestoreCheck};
            if(prior===null)el.removeAttribute('style');else el.setAttribute('style',prior);return result;})()`);
          if (landscapeControl.ok) recordInstrumentFailure(`${vp.label}: forced-visible surface trail injection stayed green (${JSON.stringify(landscapeControl)})`);
          recordControls('mobile-landscape-surface-chrome-yield');
        }
        if (mobileSurfaceYieldsObjective && !objectiveYieldControlRun) {
          objectiveYieldControlRun = true;
          const objectiveControl = await evalIn(`(()=>{ const el=document.getElementById('objchip'),prior=el.getAttribute('style');
            el.style.setProperty('display','block','important');const result=${chromeRestoreCheck};
            if(prior===null)el.removeAttribute('style');else el.setAttribute('style',prior);return result;})()`);
          if (objectiveControl.ok) recordInstrumentFailure(`${vp.label}: forced-visible landed objective injection stayed green (${JSON.stringify(objectiveControl)})`);
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
          const portraitBaseline = await evalIn(portraitBandCheck);
          portraitBaselineCount += 1;
          const portraitEligible = portraitControlBaselineEligible(portraitBaseline);
          if (portraitEligible) portraitEligibleBaselineCount += 1;
          const portraitBaselineExpected = 'post-close Planetside keeps at least a useful 72px band, 6px trail clearance, a visible heading, and a visible or vertically reachable specimen';
          addOutcome(vp.label, 'planetside-portrait-band', 'PLANETSIDE_PORTRAIT_BAND_UNUSABLE', '#planetside', portraitBaseline,
            portraitBaselineExpected);
          stopAfterRecordedProductOutcome(vp.label, 'planetside-portrait-band',
            'PLANETSIDE_PORTRAIT_BAND_UNUSABLE', '#planetside', portraitBaseline,
            portraitBaselineExpected);
          if (portraitEligible && !portraitBandControlRun) {
            /* Reproduce the reported geometry directly. Removing a cap and
               appending arbitrary content only collided on the shortest
               portrait and went green in a targeted primary-phone run. */
            const bandControl = await evalIn(`(()=>{ const side=document.getElementById('planetside'),trail=document.getElementById('trail'),baseline=${portraitBandCheck},prior={
                value:side.style.getPropertyValue('transform'),priority:side.style.getPropertyPriority('transform'),computed:getComputedStyle(side).transform},
                a=side.getBoundingClientRect(),t=trail.getBoundingClientRect(),dy=t.bottom-1-a.top,requested='translateY('+dy+'px)';let mutation;
              try{side.style.setProperty('transform',requested,'important');mutation={requested,
                property:{value:side.style.getPropertyValue('transform'),priority:side.style.getPropertyPriority('transform')},
                computed:getComputedStyle(side).transform,outcome:${portraitBandCheck}};}
              finally{if(prior.value===''&&prior.priority==='')side.style.removeProperty('transform');else side.style.setProperty('transform',prior.value,prior.priority);}
              const restored={property:{value:side.style.getPropertyValue('transform'),priority:side.style.getPropertyPriority('transform')},
                computed:getComputedStyle(side).transform,outcome:${portraitBandCheck}};
              return {baseline,prior,mutation,restored};})()`);
            const bandControlAssessment = portraitBandControlOutcome(bandControl);
            if (!bandControlAssessment.ok) {
              stopInstrumentControl(`${vp.label}: eligible portrait-band collision control did not change, turn red, and restore exactly (${JSON.stringify({ bandControl, bandControlAssessment })})`);
            }
            portraitBandControlRun = true;
            portraitBandControlCount += 1;
            recordControls('planetside-portrait-band-viability');
          }
          if (portraitEligible && !portraitFallbackControlRun) {
            /* Tighten the lower safe rectangle through the same CSS variable
               the product reads. The fallback must be an observable policy,
               not a one-way class toggle that leaves the strip collapsed. */
            const fallbackControl = await evalIn(`(()=>{ const root=document.documentElement,side=document.getElementById('planetside'),trail=document.getElementById('trail'),baseline=${portraitBandCheck},prior={
                value:root.style.getPropertyValue('--safe-bottom'),priority:root.style.getPropertyPriority('--safe-bottom'),computed:getComputedStyle(root).getPropertyValue('--safe-bottom').trim()},
                beforeSide=side.getBoundingClientRect(),beforeTrail=trail.getBoundingClientRect(),baseSafe=parseFloat(prior.computed)||0,
                forcedSafe=baseSafe+Math.max(8,beforeSide.bottom-beforeTrail.bottom-6-64),requested=forcedSafe+'px';let mutation;
              try{root.style.setProperty('--safe-bottom',requested,'important');window.dispatchEvent(new Event('resize'));
                const a=side.getBoundingClientRect(),t=trail.getBoundingClientRect(),ss=getComputedStyle(side),ts=getComputedStyle(trail),fallback=document.body.classList.contains('surface-trail-yield'),
                  meaningful=a.height>=71&&side.clientHeight>=68,scrollOk=side.scrollHeight<=side.clientHeight+1||((ss.overflowY==='auto'||ss.overflowY==='scroll')&&side.scrollHeight>side.clientHeight),
                  fixedRows=['playerchip','hpbar','searchbox','objchip'].map(id=>{const el=document.getElementById(id),s=getComputedStyle(el),r=el.getBoundingClientRect(),visible=s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;return {id,visible,gap:a.top-r.bottom};}),
                  fixedClear=fixedRows.every(row=>!row.visible||row.gap>=5.5),outcome={ok:fallback&&ts.display==='none'&&meaningful&&scrollOk&&fixedClear,fallback,trailDisplay:ts.display,meaningful,scrollOk,side:[a.left,a.top,a.right,a.bottom],trail:[t.left,t.top,t.right,t.bottom],clientHeight:side.clientHeight,scrollHeight:side.scrollHeight,overflowY:ss.overflowY,fixedClear,fixedRows,baseSafe,forcedSafe};
                mutation={requested,property:{value:root.style.getPropertyValue('--safe-bottom'),priority:root.style.getPropertyPriority('--safe-bottom')},
                  computed:getComputedStyle(root).getPropertyValue('--safe-bottom').trim(),baseSafe,forcedSafe,outcome};}
              finally{if(prior.value===''&&prior.priority==='')root.style.removeProperty('--safe-bottom');else root.style.setProperty('--safe-bottom',prior.value,prior.priority);window.dispatchEvent(new Event('resize'));}
              const restored={property:{value:root.style.getPropertyValue('--safe-bottom'),priority:root.style.getPropertyPriority('--safe-bottom')},
                computed:getComputedStyle(root).getPropertyValue('--safe-bottom').trim(),outcome:${portraitBandCheck}};
              return {baseline,prior,mutation,restored};})()`);
            const fallbackControlAssessment = portraitFallbackControlOutcome(fallbackControl);
            if (!fallbackControlAssessment.ok) {
              stopInstrumentControl(`${vp.label}: eligible forced-tight portrait did not change policy and restore exactly (${JSON.stringify({ fallbackControl, fallbackControlAssessment })})`);
            }
            portraitFallbackControlRun = true;
            portraitFallbackControlCount += 1;
            recordControls('planetside-portrait-trail-fallback');
          }
          if (portraitBaselineCount === portraitViewportCount) {
            const portraitCampaign = portraitControlCampaignOutcome({
              planned: portraitViewportCount,
              observed: portraitBaselineCount,
              eligible: portraitEligibleBaselineCount,
              bandRuns: portraitBandControlCount,
              fallbackRuns: portraitFallbackControlCount,
              requireEligibleCampaign: !viewportLabel,
            });
            if (!portraitCampaign.ok) {
              stopInstrumentControl(`${vp.label}: portrait control campaign had no eligible visible-trail/non-fallback baseline or did not execute exactly once (${JSON.stringify(portraitCampaign)})`);
            }
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
          if (topControl.ok) recordInstrumentFailure(`${vp.label}: Planetside/top-chrome overlap injection stayed green (${JSON.stringify(topControl)})`);
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
            recordInstrumentFailure(`${vp.label}: forced-colors author-override injection stayed green (${JSON.stringify(forcedControl)})`);
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
        if (!releaseDetailControlRun) {
          /* Copy is not viewport-dependent, so drive every revised F2 Guide
             topic once through the rendered search/topic UI. Each row also
             installs the prior stale paragraph and proves this predicate
             rejects it. This extends guide-render-focus without changing the
             sealed outcome or negative-control inventories. */
          const renderedGuideIngress = await evalIn(`(async()=>{ const panel=document.getElementById('guidepanel'),input=document.getElementById('guidesearch'),rows=[],baselineRows=[],
            settle=async()=>{await Promise.resolve();await Promise.resolve();};
            const guideRequiredControlRejected=${guideRequiredControlRejected.toString()};
            const exactGuideRenderedTextMutation=${exactGuideRenderedTextMutation.toString()};
            const guideRenderedControlHtmlRestored=${guideRenderedControlHtmlRestored.toString()};
            const exactGuideRenderedRequiredControlRejected=${exactGuideRenderedRequiredControlRejected.toString()};
            const classifyRenderedGuideIngress=${classifyRenderedGuideIngress.toString()};
            const probeNeedle='up to 1,500 logical entries',probeCarrier='Compendium presents '+probeNeedle,
              probeBefore='The '+probeCarrier+'.',probeAfter=probeBefore.replace(probeNeedle,'a bounded set of logical entries'),
              probeResult={ok:false,missing:[probeCarrier],text:probeAfter};
            const bioscanRequired=[
              'first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol',
              'banks that world’s one Chapter 2 life-discovery tick in the same capture transaction',
              'A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing',
              'v2’s current replacement for v1.8.9’s separate Discover Life action',
              'Survey Records and accepted or weekly bioscan Charters remain unavailable',
            ],bioscanForbidden=[
              'Capture never banks the Charter’s separate bioscan milestone',
              'Planetside capture is separate and never banks the Charter’s bioscan milestone',
              'Planetside capture never banks the Charter’s separate bioscan milestone',
              'Capture banks the Charter bioscan milestone',
              'A miss banks one Chapter 2 life-discovery tick',
              'A successful capture on Sol banks one Charter bioscan tick',
              'A later success on the same world banks another life-discovery tick',
              'A stale tab still banks one life-discovery tick',
              'A failed write advances the Charter bioscan',
              'The separate Discover Life action is now available',
            ],bioscanContradictions=[
              'A miss banks one Chapter 2 life-discovery tick.',
              'A successful capture on Sol banks one Charter bioscan tick.',
              'A later success on the same world banks another life-discovery tick.',
              'A stale tab still banks one life-discovery tick.',
              'A failed write advances the Charter bioscan.',
             'The separate Discover Life action is now available.',
            ],breedCharterRequired=[
              'One successful Breed banks Breed a hybrid bloodline in the same offspring save',
              'failed pairing, refusal, stale tab, or failed write banks no breeding credit',
              'A first verified conquest banks Chapter 2’s conquest goal in the combat save',
              'An accepted weekly conquest (wk-conq) refuses before combat',
            ],breedCharterForbidden=[
              'A failed pairing also banks the Charter hybrid bloodline goal',
              'A stale Breed result grants breeding credit',
              'A failed conquest banks Chapter 2’s conquest goal',
              'An accepted weekly conquest can proceed to combat',
            ],breedCharterContradictions=[
              'A failed pairing also banks the Charter hybrid bloodline goal.',
              'A stale Breed result grants breeding credit.',
              'A failed conquest banks Chapter 2’s conquest goal.',
              'An accepted weekly conquest can proceed to combat.',
            ],audioGuideRequired=[
              'Sound and Creature voices on',
              'verified Tame',
              'exact committed Feed',
              'explicit Listen action on a real owned-fauna Compendium detail',
              'exact current identity and accessible status counterpart agree',
              'Compendium list mounting, focus, filtering, and navigation never play a call',
              'Listen to biosphere',
              'same generic distant living-biosphere signal',
              'exact current generic biosphere lead is visible',
              'neither reveals a species, spends Yield, awards anything, or writes the save',
              'Sound Off stops every path',
              'Creature voices Off stops creature expressions but not the generic biosphere ambience or registered post-settlement Combat Chronicle cues',
              'Chronicle sound includes the already-modelled initiative, dodge, stun, impact/critical/ability, burn, regeneration, defeat, resolution, and Guardian or Titan motifs',
              'Authored ambience, music, recorded assets, and other creature actions remain unavailable',
            ],audioSettingsRequired=[
              'Creature voices governs the verified Tame, committed Feed, and explicit owned-fauna Listen expressions',
              'Sound governs all audio, including the generic Planetside biosphere signal and every registered post-settlement Combat Chronicle cue',
              'combat deliberately ignores Creature voices',
              'Each expression or combat cue waits for its own current accessible status or Chronicle counterpart',
              'Turning master Sound off stops every owned audio path immediately',
              'Creature voices Off stops creature expressions only',
              'Turning either setting back on never replays an earlier result',
            ],audioGuideForbidden=[
              'Compendium filtering auto-plays the selected creature call',
              'Listen to biosphere reveals a hidden species and spends 1 Yield',
              'The biosphere signal grants a discovery reward and changes the save',
              'Creature voices Off silences the generic biosphere ambience',
              'Sound Off still permits the owned creature call',
              'Creature voices Off silences Combat Chronicle cues',
              'Combat sound remains unavailable',
              'Master Sound does not govern combat',
            ],audioGuideContradictions=[
              'Compendium filtering auto-plays the selected creature call.',
              'Listen to biosphere reveals a hidden species and spends 1 Yield.',
              'The biosphere signal grants a discovery reward and changes the save.',
              'Creature voices Off silences the generic biosphere ambience.',
              'Sound Off still permits the owned creature call.',
              'Creature voices Off silences Combat Chronicle cues.',
              'Combat sound remains unavailable.',
              'Master Sound does not govern combat.',
            ];
            let predicateControls=null;
            const specs=[
              {id:'landing',required:['Any galaxy, star, or planet route arriving from Search, the Star Atlas, or a saved location is regenerated from the seeded universe before it is accepted','navigation uses only the source-verified destination','A stale or forged route cannot act'],forbidden:['A planet address from Search or the Star Atlas returns to its live system survey when it is inside the expedition’s saved reach'],stale:'A planet address from Search or the Star Atlas returns to its live system survey when it is inside the expedition’s saved reach; it never lands for you.'},
              {id:'search',required:['Every galaxy, star, or planet code is treated as an address to verify, not as authority','accepts only the source-verified destination','A stale or forged code leaves the current view unchanged and keeps the exact query in Search for correction'],forbidden:['A valid world address inside the expedition’s saved reach reopens the destination’s system survey'],stale:'The top-bar search accepts discovered species names and deterministic CF1 world addresses. A valid world address inside the expedition’s saved reach reopens the destination’s system survey.'},
              {id:'codes',required:['Before any shared galaxy, star, or planet route is accepted','uses only the source-verified destination','A stale or forged code leaves the current view unchanged and keeps the exact query in Search'],forbidden:['Opening it returns another explorer to the live system survey'],stale:'Share on a planet card prepares a deterministic CF1 address. Opening it returns another explorer to the live system survey when the destination is inside that expedition’s saved reach.'},
              {id:'atlas',required:['Each saved galaxy, star, or planet route is regenerated from the seeded universe','must produce a source-verified destination before its row can travel','A stale, forged, or incomplete imported route remains visible but disabled'],forbidden:['choosing a complete entry inside the expedition’s saved reach returns to that destination’s own navigation level'],stale:'Use Star Atlas on a planet card to chart it. The Atlas lists saved galaxies, stars, and worlds; choosing a complete entry inside the expedition’s saved reach returns to that destination’s own navigation level.'},
              {id:'determinism',required:['A CF1 address is a pointer into that shared math, not authority of its own','accepts only a source-verified match','a stale or forged address cannot replace the current view'],forbidden:['which is why deterministic CF1 addresses work without an account or game server'],stale:'The same supported coordinates resolve to the same galaxy, star, world, and current-slice survey, which is why deterministic CF1 addresses work without an account or game server.'},
              {id:'survey',paragraph:2,required:['After landing on a living world, Planetside reveals the biosphere roster','landing still catalogues nothing','at-most-eight-row strip is only a preview','Tame, Scavenge, and Sample are separate finite actions','choose uniformly from their eligible species across the full biosphere','Owned Deep Scanners adds one Mineral veins row to the orbital Survey card for a proven lifeless non-Earth world','preserves the generated ordinary-deposit order and marks the separate biome vein with ✦','cosmic and exceptional veins, grades, reserve and progress facts, and the Mine action remain grounded Engineering information'],requiredControls:['landing still catalogues nothing','at-most-eight-row strip is only a preview','choose uniformly from their eligible species across the full biosphere'],forbidden:['Landing catalogues the preview','Planetside preview row is the capture target','Capture draws only from the preview','current Survey card does not yet paint those orbital mineral rows','orbital Survey shows cosmic and exceptional veins'],stale:'Landing catalogues the preview, and each Planetside preview row is the capture target. Capture draws only from the preview.',contradictions:['Landing catalogues the preview.','The Planetside preview row is the capture target.','Capture draws only from the preview.','The current Survey card does not yet paint those orbital mineral rows.','The orbital Survey shows cosmic and exceptional veins.']},
              {id:'discover',paragraph:2,required:['choose uniformly from every eligible species for that action in the full biosphere','no species row is a target','Tame chooses fauna and a hit adds one owned creature','Scavenge chooses flora or fungi','Sample chooses microbes','either hit adds one specimen lot, never a living companion','Every attempt spends 1 Yield on a hit or miss','successful species leaves that action’s eligible pool','a miss stays eligible','20-minute active-play cycle','closing the game or moving the wall clock does not advance recovery','first successful observation of a species adds its one Compendium page','later-world or later-cycle repeat adds another creature or lot without another page or first-find reward','first successful Legendary-or-better observation earns its one Rare Find Stardust bonus','A miss adds no page, creature, specimen, or Stardust'],requiredControls:['Every attempt spends 1 Yield on a hit or miss','successful species leaves that action’s eligible pool','a miss stays eligible','20-minute active-play cycle','closing the game or moving the wall clock does not advance recovery'],forbidden:['A miss spends no Yield','Biosphere Yield recovers while the game is closed','moving the wall clock advances recovery','successful species stays eligible for the cycle'],stale:'A miss spends no Yield. Biosphere Yield recovers while the game is closed or when the wall clock advances, and a successful species stays eligible for the cycle.',contradictions:['A miss spends no Yield.','Biosphere Yield recovers while the game is closed.','Moving the wall clock advances recovery.','A successful species stays eligible for the cycle.']},
             {id:'discover',name:'discover-bioscan',paragraph:3,required:bioscanRequired,requiredControls:bioscanRequired,forbidden:bioscanForbidden,stale:'Capture never banks the Charter’s separate bioscan milestone.',contradictions:bioscanContradictions},
              {id:'discover',name:'discover-audio',paragraph:4,required:audioGuideRequired,requiredControls:audioGuideRequired,forbidden:audioGuideForbidden,stale:'Creature calls and inhabited-world signals are not available in this development slice.',contradictions:audioGuideContradictions},
              {id:'rarity',paragraph:1,required:['Rarity lowers a species’ base Tame, Scavenge, or Sample chance','each action first chooses uniformly from its eligible full-biosphere pool','selected species and its exact chance appear with the result','Only the first successful Legendary-or-better observation earns a Rare Find Stardust bonus','later-world or later-cycle repeat can add another creature or specimen lot, but never another Compendium page or first-find reward'],requiredControls:['each action first chooses uniformly from its eligible full-biosphere pool','selected species and its exact chance appear with the result'],forbidden:['preview row is the chosen capture target','Every species has the same capture chance'],stale:'The preview row is the chosen capture target. Every species has the same capture chance.',contradictions:['The preview row is the chosen capture target.','Every species has the same capture chance.']},
              {id:'stardust',paragraph:1,required:['first successful Legendary-or-better Tame, Scavenge, or Sample observation earns its one Rare Find Stardust bonus','same durable transaction as its page and ownership','result shows the exact amount','A miss and every later-world or later-cycle repeat earn none','Each supported Starter Charter pays its established 10–25 Stardust once','A completed unclaimed Binder Set pays its established 25–150 Stardust once from Records','A verified conquest win awards 8 + five times world tier Stardust, plus 40 against an Apex Guardian or Elemental Titan','Weekly Charters, passive gain, and the rest of the mature economy remain unavailable'],requiredControls:['first successful Legendary-or-better Tame, Scavenge, or Sample observation earns its one Rare Find Stardust bonus','same durable transaction as its page and ownership','A miss and every later-world or later-cycle repeat earn none','Each supported Starter Charter pays its established 10–25 Stardust once','A completed unclaimed Binder Set pays its established 25–150 Stardust once from Records','A verified conquest win awards 8 + five times world tier Stardust, plus 40 against an Apex Guardian or Elemental Titan'],forbidden:['Every Legendary capture earns Stardust','A repeat find earns another Rare Find Stardust bonus','A miss can earn Stardust'],stale:'Every Legendary capture earns Stardust, a repeat find earns another Rare Find Stardust bonus, and a miss can earn Stardust.',contradictions:['Every Legendary capture earns Stardust.','A repeat find earns another Rare Find Stardust bonus.','A miss can earn Stardust.']},
              {id:'charters',paragraph:1,required:[...bioscanRequired,...breedCharterRequired],requiredControls:[...bioscanRequired,...breedCharterRequired],forbidden:[...bioscanForbidden,...breedCharterForbidden],stale:'Planetside capture is separate and never banks the Charter’s bioscan milestone.',contradictions:[...bioscanContradictions,...breedCharterContradictions]},
              {id:'ascent',paragraph:2,required:[...bioscanRequired,...breedCharterRequired],requiredControls:[...bioscanRequired,...breedCharterRequired],forbidden:[...bioscanForbidden,...breedCharterForbidden],stale:'Planetside capture never banks the Charter’s separate bioscan milestone.',contradictions:[...bioscanContradictions,...breedCharterContradictions]},
              {id:'kingdoms',required:['Compendium presents up to 1,500 logical entries','Search filters those saved records','count reports the logical matches','choosing a row opens its detail','mounts the visible viewport plus half a viewport of overscan on each side (about two viewports total)','plus at most the focused pinned row','neutral placeholder','exact 132px thumbnail','complete genome—not only the displayed name or seed—owns visual identity','Planetside shares the same bounded thumbnail lease path','thumbnails are released when their visible owner leaves','Browsing and non-fauna details remain read-only','successful first Planetside capture can add one page','Tame also adds an owned fauna creature','Scavenge and Sample add specimen lots','Later-world or later-cycle successes add another creature or lot without duplicating the page','real fauna detail alone exposes narrow exact-instance Feed, Breed, Rename, Listen, and Field Scout actions','Scout interception, dispatch, missions, care, bond, and broader husbandry remain unavailable'],requiredControls:['up to 1,500 logical entries','mounts the visible viewport plus half a viewport of overscan on each side (about two viewports total)','real fauna detail alone exposes narrow exact-instance Feed, Breed, Rename, Listen, and Field Scout actions'],forbidden:['Choose a row to inspect the deterministic portrait','mounts all 1,500 portraits at once','thumbnail identity uses the displayed name or seed only','Choose a Compendium row to capture that species','Planetside preview row is the capture target','Every Compendium detail offers Feed','Breeding remains unavailable','Renaming remains unavailable'],stale:'The Compendium reads the expedition’s discovered life across Microbe, Flora, Fungi, and Fauna. Choose a row to inspect the deterministic portrait, description, realm, grade, and battle-stat profile already present in the save.',contradictions:['The Compendium mounts all 1,500 portraits at once.','Thumbnail identity uses the displayed name or seed only.','Choose a Compendium row to capture that species.','The Planetside preview row is the capture target.','Every Compendium detail offers Feed.','Breeding remains unavailable.','Renaming remains unavailable.']},
              {id:'specimen',required:['exact 440px portrait','same complete-genome identity as its exact 132px list thumbnail','440px image is reserved for this detail rather than the list or Planetside','Back returns to the saved list position and restores focus to the same logical row','Close returns focus to the exact Compendium opener','Back and Close both remain available around feeding, breeding, renaming, and Field Scout selection','Capture happens only through Planetside’s random full-biosphere Tame, Scavenge, and Sample pools, never from a Compendium row','Tame hit adds one owned fauna creature','Scavenge or Sample adds one specimen lot and never a living companion','Only a real fauna detail offers Feed','one exact unassigned owned companion below the 200-Meal cap and one exact owned flora lot','Identical same-species twins remain separate exact instances','Rename chooses one exact owned companion of this species from bounded 24-row pages','assigned, recovering, and injured companions may be renamed because the action changes identity only','exhibition entries and protected or non-owned rows refuse','caps the result at 24 characters','Cleaned-empty or unchanged names consume no receipt or write','commit changes only that exact companion’s nickname','keeps the old name visible while pending','one immutable receipt and one compare-and-swap with no retry or optimistic publication','requires reload, and cannot rename twice','Field Scout chooses one exact owned companion of this fauna species from bounded 24-row pages','Assigned, recovering, and injured companions remain eligible because this changes only a role','One exact-five compare-and-swap changes only the Scout identity','Refused, stale, failed, or unconfirmable writes change nothing visible and cannot apply twice','Tastes and flavours, stat or Power growth, injury care or healing, poison, bond, explorer eating, hostile-injury interception, fresh-species Scout XP, dispatch, missions, and friendly duels remain unavailable'],requiredControls:['same complete-genome identity as its exact 132px list thumbnail','Rename chooses one exact owned companion of this species from bounded 24-row pages','commit changes only that exact companion’s nickname','Field Scout chooses one exact owned companion of this fauna species from bounded 24-row pages','One exact-five compare-and-swap changes only the Scout identity'],forbidden:['Select a Compendium row to open its current specimen detail','Planetside renders a 440px portrait for every row','Thumbnail leases remain pinned after Close','Choose a Compendium row to capture that species','Planetside preview row is the capture target','Assigned companions can still be fed','Exhibition companions may still be renamed','Rename changes the selected companion genome','unchanged name consumes one receipt','Rename automatically retries','stale rename changes the nickname'],stale:'Select a Compendium row to open its current specimen detail: deterministic portrait, name, kingdom, realm, description, grade, and the five battle-stat bars.',contradictions:['Planetside renders a 440px portrait for every row.','Thumbnail leases remain pinned after Close.','Choose a Compendium row to capture that species.','The Planetside preview row is the capture target.','Assigned companions can still be fed.','Exhibition companions may still be renamed.','Rename changes the selected companion genome.','An unchanged name consumes one receipt.','Rename automatically retries.','A stale rename changes the nickname.']},
              {id:'feeding',paragraph:1,required:['real fauna Compendium detail','Choose one exact unassigned owned companion whose Meals are below 200 and one exact owned flora lot','Use 1','Same-species twins remain separate exact instances','Assigned or recovering companions and companions already at the 200-Meal cap stay disabled and explain why','Meals by 1, capped at 200','removes 1 flora from that exact lot','final unit empties that exact lot','one immutable receipt and one compare-and-swap save transaction','no retry and no optimistic inventory or Meals change','refusal, stale result, or failed write uses and publishes nothing','requires reload and cannot feed twice','trusted native Feed gesture, exact current ownership successor, and still-current accessible settled status','one deterministic synthesized acknowledgement after that status appears','Refused, stale, converging, replayed, hidden, route-lost, and counterpart-lost paths remain silent','Back and Close remain available','tastes and flavours, stat or Power growth, injury care or healing, poison, bond, explorer eating, friendly duels, and missions remain unavailable','Rename changes only one selected exact companion’s nickname','Companion Breed is a separate action with its own eligibility, odds, lineage, and active-play Recovery','Field Scout separately changes only the exact role and does not redirect injury or earn Scout XP yet'],requiredControls:['Meals by 1, capped at 200','one immutable receipt and one compare-and-swap save transaction','Rename changes only one selected exact companion’s nickname','Companion Breed is a separate action with its own eligibility, odds, lineage, and active-play Recovery','Field Scout separately changes only the exact role and does not redirect injury or earn Scout XP yet'],forbidden:['Assigned companions can still be fed','The meal automatically retries after a stale result','Stats are now increased by feeding','Meals can rise above 200','Every Compendium detail offers Feed','Breeding remains unavailable','Renaming remains unavailable'],stale:'One ordinary save updates the selected meal.',contradictions:['Assigned companions can still be fed.','The meal automatically retries after a stale result.','Stats are now increased by feeding.','Meals can rise above 200.','Every Compendium detail offers Feed.','Breeding remains unavailable.','Renaming remains unavailable.']},
              {id:'breeding',required:['real fauna Compendium detail','one exact owned companion of that detail’s species as the primary parent','one different exact owned fauna companion as the mate','Identical same-species twins remain separate exact instances','at most 24 candidates per page','paging keeps every eligible owned companion reachable','Exhibition creatures, mission-assigned companions, companions already in Recovery, and companions at 30% hurt or more stay disabled and explain why','same exact companion cannot occupy both parent roles','shown success chance comes from both parents’ established rarity tiers plus a bounded bonus from lifetime-earned Stardust','raw genetic values stay hidden','Both parents remain yours','success creates one deterministic child with its exact lineage','grants that child +2 XP','first successful union of each canonical unordered species pair grants the child another +5 XP','8 active-play minutes of Recovery','failure creates no child','2 active-play minutes of Recovery','Recovery blocks Breed, combat, and dispatch','Closing the game or moving the wall clock does not advance it','proves both possible complete save successors before its one outcome draw','one receipt-bearing compare-and-swap with no retry and no optimistic child, XP, pair claim, or Recovery','refusal, stale result, overflow, or failed write draws nothing and adds nothing','requires reload and cannot breed twice','Back and Close remain available around the action','successful outcome also banks the Chapter 3 Breed a hybrid bloodline goal inside that same offspring save','failed pairing, refusal, stale result, or failed write banks no Charter credit','Parent consumption, taste or bond effects, manual genetic editing, broader care, missions, and combat remain unavailable'],requiredControls:['Both parents remain yours','success creates one deterministic child with its exact lineage','grants that child +2 XP','first successful union of each canonical unordered species pair grants the child another +5 XP','proves both possible complete save successors before its one outcome draw','successful outcome also banks the Chapter 3 Breed a hybrid bloodline goal inside that same offspring save','failed pairing, refusal, stale result, or failed write banks no Charter credit'],forbidden:['Both parents are consumed','Recovery advances while the game is closed','same exact companion can occupy both parent roles','failed attempt creates one child','Breeding automatically retries','A failed pairing also banks the Charter hybrid bloodline goal'],stale:'Breeding remains unavailable in this development slice.',contradictions:['Both parents are consumed.','Recovery advances while the game is closed.','The same exact companion can occupy both parent roles.','A failed attempt creates one child.','Breeding automatically retries.','A failed pairing also banks the Charter hybrid bloodline goal.']},
              {id:'research',paragraph:2,required:['Engineering & Shipyard combines the capability-derived ship preview','Research Bench lists exactly six canonical rows','Deep Scanners is the only current purchase','adds a bounded Mineral veins row to eligible orbital Survey cards','Orbit shows only the ordered ordinary deposits plus a separately marked biome vein','cosmic and exceptional veins, grades, reserves and progress, and mining remain grounded','other five','visible but disabled','Fabricator groups all 62 fixed recipes','exposes an action only when its output has a connected gameplay effect','When every direct material unit for a slotted craft comes from exceptional stock','exact item receives one deterministic Pureforged modifier','mining yield, rich-strike chance, or capture-contact points','bound to its recipe and receipt','mixed stock remains an ordinary craft','Pureforged effects without a connected consumer, authored natural affixes/drawbacks, item upgrades, sockets, and vendors remain unavailable','Only one Engineering action can be pending','receipt-bearing transaction commits'],requiredControls:['exposes an action only when its output has a connected gameplay effect','When every direct material unit for a slotted craft comes from exceptional stock','exact item receives one deterministic Pureforged modifier','mining yield, rich-strike chance, or capture-contact points','bound to its recipe and receipt','mixed stock remains an ordinary craft','Pureforged effects without a connected consumer, authored natural affixes/drawbacks, item upgrades, sockets, and vendors remain unavailable'],forbidden:['current Survey card does not yet render those orbital rows','All six research rows can be purchased','Mixed stock also receives a Pureforged modifier','The Pureforged modifier rerolls after reload','Authored affixes/drawbacks are now available','Upgrades are now available','Item upgrades are now available','Sockets are now available','Vendors are now available','Orbit now shows cosmic and exceptional veins'],stale:'The Shipyard is read-only in this development slice, and fabrication, Research Bench purchases, and upgrades remain unavailable.',contradictions:['The current Survey card does not yet render those orbital rows.','All six research rows can be purchased.','Mixed stock also receives a Pureforged modifier.','The Pureforged modifier rerolls after reload.','Authored affixes/drawbacks are now available.','Upgrades are now available.','Item upgrades are now available.','Sockets are now available.','Vendors are now available.','Orbit now shows cosmic and exceptional veins.']},
              {id:'crafting',paragraph:2,required:['Inventory is a separate board','stable item instance','Equip, Unequip, Salvage, and pending-reward claim','Engineering & Shipyard → Fabricator','lists all 62 fixed recipes','can settle only rows whose output has a connected effect','A slotted item made entirely from exceptional direct materials carries one deterministic, recipe-and-receipt-bound Pureforged modifier','mining yield, rich-strike chance, or capture-contact points','as part of that exact item through comparison and reload','a mixed-material craft does not','Pureforged effects without a connected consumer, authored natural affixes/drawbacks, random authored drops, targeting tags, item upgrades, sockets, and vendors remain unavailable'],requiredControls:['can settle only rows whose output has a connected effect','A slotted item made entirely from exceptional direct materials carries one deterministic, recipe-and-receipt-bound Pureforged modifier','mining yield, rich-strike chance, or capture-contact points','as part of that exact item through comparison and reload','a mixed-material craft does not','Pureforged effects without a connected consumer, authored natural affixes/drawbacks, random authored drops, targeting tags, item upgrades, sockets, and vendors remain unavailable'],forbidden:['Mixed stock also receives a Pureforged modifier','The Pureforged modifier rerolls after reload','Authored affixes/drawbacks are now available','Upgrades are now available','Item upgrades are now available','Sockets are now available','Vendors are now available'],stale:'Inventory exposes only the imported Equip, Unequip, Salvage, and reward-claim actions; Fabricator recipes are not available in this slice.',contradictions:['Mixed stock also receives a Pureforged modifier.','The Pureforged modifier rerolls after reload.','Authored affixes/drawbacks are now available.','Upgrades are now available.','Item upgrades are now available.','Sockets are now available.','Vendors are now available.']},
             {id:'settings',paragraph:1,required:['normal Finish or Skip source-verifies and immediately restores the exact pre-Training view','If verification pauses, that exact view stays saved','when Sol can still be verified, Training returns there','reload can restart safely and retry','Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured','every other expedition field is retained from the surrounding save','That older checkpoint contains no saved view','Skip from Welcome stays in Sol','completing the drill after Land stays at Earth','An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen','leaves the stored expedition unchanged','reload after updating, or import a trusted complete expedition'],requiredControls:['Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured','every other expedition field is retained from the surrounding save','That older checkpoint contains no saved view','Skip from Welcome stays in Sol','completing the drill after Land stays at Earth','An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen','leaves the stored expedition unchanged','reload after updating, or import a trusted complete expedition'],forbidden:['reload safely restarts Field Training from proven Sol','Older v1.8.9 Training checkpoints restore the entire expedition','That older checkpoint restores the pre-Training view','Skip from Welcome stays at Earth','completing the drill after Land stays in Sol','An unrecognized checkpoint can close recovery and continue exploring','An unrecognized checkpoint may clear the stored expedition'],stale:'Restart begins the current six-lesson drill in Sol and restores the pre-training view when the drill finishes or is skipped. If persistence fails, restart is cancelled.',contradiction:'If verification pauses, a reload safely restarts Field Training from proven Sol.',contradictions:['Older v1.8.9 Training checkpoints restore the entire expedition.','That older checkpoint restores the pre-Training view.','Skip from Welcome stays at Earth.','Completing the drill after Land stays in Sol.','An unrecognized checkpoint can close recovery and continue exploring.','An unrecognized checkpoint may clear the stored expedition.']},
              {id:'settings',name:'settings-audio',paragraph:0,required:audioSettingsRequired,requiredControls:audioSettingsRequired,forbidden:audioGuideForbidden,stale:'Creature voices and master Sound own the same generic world signal.',contradictions:audioGuideContradictions},
              {id:'saving',paragraph:1,required:['On reload, a saved galaxy, star, or planet location is regenerated from the seeded universe','accepted only when it is source-verified','If that saved location is stale, forged, or incomplete, or if its destination is no longer authorized by your saved reach, the view returns safely to Cosmos','normal Finish or Skip source-verifies and immediately restores the exact pre-Training view','If verification pauses, that exact view stays saved','when Sol can still be verified, Training returns there','reload can restart safely and retry','Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured','every other expedition field is retained from the surrounding save','That older checkpoint contains no saved view','Skip from Welcome stays in Sol','completing the drill after Land stays at Earth','An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen','leaves the stored expedition unchanged','reload after updating, or import a trusted complete expedition'],requiredControls:['Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured','every other expedition field is retained from the surrounding save','That older checkpoint contains no saved view','Skip from Welcome stays in Sol','completing the drill after Land stays at Earth','An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen','leaves the stored expedition unchanged','reload after updating, or import a trusted complete expedition'],forbidden:['reload safely restarts Field Training from proven Sol','Older v1.8.9 Training checkpoints restore the entire expedition','That older checkpoint restores the pre-Training view','Skip from Welcome stays at Earth','completing the drill after Land stays in Sol','An unrecognized checkpoint can close recovery and continue exploring','An unrecognized checkpoint may clear the stored expedition'],stale:'A newer-build, incomplete, or corrupt stored expedition remains protected, and there is no cloud account yet.',contradiction:'If verification pauses, a reload safely restarts Field Training from proven Sol.',contradictions:['Older v1.8.9 Training checkpoints restore the entire expedition.','That older checkpoint restores the pre-Training view.','Skip from Welcome stays at Earth.','Completing the drill after Land stays in Sol.','An unrecognized checkpoint can close recovery and continue exploring.','An unrecognized checkpoint may clear the stored expedition.']},
            ];
            const check=(article,spec)=>{const text=(article?.textContent||'').replace(/\\s+/g,' ').trim(),lower=text.toLowerCase(),missing=spec.required.filter((part)=>!text.includes(part)),stale=spec.forbidden.filter((part)=>lower.includes(part.toLowerCase()));return {ok:!!article&&missing.length===0&&stale.length===0,missing,stale,text};};
            let error=null,baselineComplete=false;
            try {
              if(!panel||!(input instanceof HTMLInputElement))throw new Error('Guide panel/search missing');
              for(const spec of specs){
                input.value=spec.id;input.dispatchEvent(new Event('input',{bubbles:true}));
                await settle();
                if(input.value!==spec.id)throw new Error('Guide search query drifted for '+spec.id);
                const row=panel.querySelector('[data-guide-topic="'+spec.id+'"]');
                if(!(row instanceof HTMLElement))throw new Error('Guide search omitted '+spec.id);
                row.click();await settle();
                const article=panel.querySelector('.guide-topic');
                if(!(article instanceof HTMLElement))throw new Error('Guide topic did not render '+spec.id);
                const current=check(article,spec);
                baselineRows.push({id:spec.name||spec.id,current});
                if(!current.ok)break;
              }
              baselineComplete=true;
              if(baselineRows.length===specs.length&&baselineRows.every((row)=>row.current.ok)){
              predicateControls={
                positive:guideRequiredControlRejected({before:probeBefore,after:probeAfter,needle:probeNeedle,required:[probeCarrier],result:probeResult}),
                zeroCarrier:!guideRequiredControlRejected({before:probeBefore,after:probeAfter,needle:probeNeedle,required:['unrelated required copy'],result:probeResult}),
                multipleCarriers:!guideRequiredControlRejected({before:probeBefore,after:probeAfter,needle:probeNeedle,required:[probeCarrier,'second '+probeNeedle],result:probeResult}),
                noOp:!guideRequiredControlRejected({before:probeBefore,after:probeBefore,needle:probeNeedle,required:[probeCarrier],result:probeResult}),
                wrongCarrier:!guideRequiredControlRejected({before:probeBefore,after:probeAfter,needle:probeNeedle,required:[probeCarrier],result:{...probeResult,missing:['wrong carrier']}}),
                needleStillPresent:!guideRequiredControlRejected({before:probeBefore,after:probeAfter,needle:probeNeedle,required:[probeCarrier],result:{...probeResult,text:probeAfter+' '+probeNeedle}}),
              };
              for(const spec of specs){
                input.value=spec.id;input.dispatchEvent(new Event('input',{bubbles:true}));
                await settle();
                if(input.value!==spec.id)throw new Error('Guide control search query drifted for '+spec.id);
                const row=panel.querySelector('[data-guide-topic="'+spec.id+'"]');
                if(!(row instanceof HTMLElement))throw new Error('Guide control search omitted '+spec.id);
                row.click();await settle();
                const article=panel.querySelector('.guide-topic'),paragraphs=article?[...article.querySelectorAll('p')]:[],
                  staleParagraph=spec.name==='settings-audio'?1:spec.id==='settings'?4:(spec.paragraph??0),target=paragraphs[staleParagraph];
                if(!(article instanceof HTMLElement)||!(target instanceof HTMLElement))throw new Error('Guide control topic did not render '+spec.id);
                const prior=target.innerHTML,priorText=(article.textContent||'');
                let injected;
                try { target.textContent=spec.stale;injected=check(article,spec); }
                finally { target.innerHTML=prior; }
                const requiredControls=[];
                for(const part of spec.requiredControls||[]){
                  const carriers=paragraphs.filter((paragraph)=>(paragraph.textContent||'').includes(part)),controlTarget=carriers[0]||target,
                    controlPrior=controlTarget.innerHTML,mutation=exactGuideRenderedTextMutation(controlTarget.textContent||'',part,'required Guide contract removed');let result,
                    observedAfter='',actualChangeCount=0,restoredHtml=false,restoredText=false,restoredPredicate=false;
                  try { controlTarget.textContent=mutation.after;observedAfter=controlTarget.textContent||'';
                    actualChangeCount=observedAfter===mutation.before?0:1;result=check(article,spec); }
                  finally { controlTarget.innerHTML=controlPrior;restoredHtml=guideRenderedControlHtmlRestored(controlPrior,controlTarget.innerHTML);
                    restoredText=(controlTarget.textContent||'')===mutation.before;restoredPredicate=check(article,spec).ok; }
                  requiredControls.push({part,carrierCount:carriers.length,targetCount:mutation.targetCount,expectedChangeCount:mutation.changeCount,
                    observedAfter,actualChangeCount,restoredHtml,restoredText,restoredPredicate,result,
                    rejected:carriers.length===1&&exactGuideRenderedRequiredControlRejected({mutation,observedAfter,needle:part,required:spec.required,
                      result,restoredHtml,restoredText,restoredPredicate})});
                }
                let contradictory=null;
                if(spec.contradiction){const marker=document.createElement('p');marker.textContent=spec.contradiction;
                  try { article.appendChild(marker);contradictory=check(article,spec); }
                  finally { marker.remove(); }}
                const contradictionControls=[];
                for(const copy of spec.contradictions||[]){const marker=document.createElement('p');marker.textContent=copy;let result;
                  try { article.appendChild(marker);result=check(article,spec); }
                  finally { marker.remove(); }
                  contradictionControls.push({copy,result,rejected:result.ok===false&&result.stale.length>0});}
                const restored=(article.textContent||'')===priorText&&target.innerHTML===prior&&check(article,spec).ok;
                rows.push({id:spec.name||spec.id,injected,requiredControls,contradictory,contradictionControls,
                  controlRejected:injected.ok===false,requiredControlsRejected:requiredControls.every((row)=>row.rejected),
                  contradictionRejected:(!spec.contradiction||contradictory?.ok===false)&&contradictionControls.every((row)=>row.rejected),restored});
              }
              }
            } catch(cause) { error=String(cause?.message||cause); }
            finally { if(input instanceof HTMLInputElement){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));await settle();} }
            const classification=classifyRenderedGuideIngress({baselineComplete,baselineRows,expectedCount:specs.length,
              predicateControls,controlRows:rows,error});
            return {...classification,baselineRows,predicateControls,rows};})()`);
          recordRenderedGuideIngressResult({
            findings, instrumentState: causalInstrumentState, instrumentFailures,
            viewport: vp.label, ingress: renderedGuideIngress, armed: causalControlsArmed,
          });
        }
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
          bulletNodes=article?[...article.querySelectorAll('li')]:[],bullets=bulletNodes.map((node)=>(node.textContent||'').trim()),text=article?.textContent||'',lower=text.toLowerCase(),state=S.api.state(),
          title=article?.querySelector('[data-guide-heading]')?.textContent||'';
          const expected=['New Features & Systems','UI Enhancements','Gameplay','Bug Fixes','Under the Hood'],expectedBulletCount=77;
          const unnegated=${hasUnnegatedSentenceClaim};
          const first=bulletNodes.find((item)=>/FIRST PLANETFALL COUNTS/.test(item.textContent||'')),
            recovery=bulletNodes.find((item)=>/COMPLETE IMPORTED CHAPTERS MOVE AGAIN/.test(item.textContent||'')),
            worldCode=bulletNodes.find((item)=>/WORLD CODES KEEP THE WHOLE DESTINATION/.test(item.textContent||'')),
            atlasRoute=bulletNodes.find((item)=>/THE ATLAS LEADS BACK/.test(item.textContent||'')),
           capture=bulletNodes.find((item)=>/BIOSPHERE CAPTURE HAS HONEST LIMITS/.test(item.textContent||'')),
            frontierAudio=bulletNodes.find((item)=>/THE FRONTIER SPEAKS/.test(item.textContent||'')),
            creatureListen=bulletNodes.find((item)=>/CREATURE CALLS ARE YOURS TO REQUEST/.test(item.textContent||'')),
            biosphereListen=bulletNodes.find((item)=>/HEAR A LIVING WORLD WITHOUT SPOILERS/.test(item.textContent||'')),
           meal=bulletNodes.find((item)=>/ONE EXACT MEAL SETTLES ONCE/.test(item.textContent||'')),
            breed=bulletNodes.find((item)=>/TWO PARENTS, ONE DURABLE OUTCOME/.test(item.textContent||'')),
            rename=bulletNodes.find((item)=>/ONE COMPANION, ONE DURABLE NAME/.test(item.textContent||'')),
            training=bulletNodes.find((item)=>/FIELD TRAINING LIVES IN THE NEW SHELL/.test(item.textContent||'')),
            lesson=bulletNodes.find((item)=>/A LESSON OWNS ITS ESCAPE KEY/.test(item.textContent||'')),
            art=bulletNodes.find((item)=>/ART ARRIVES WHEN IT IS NEEDED/.test(item.textContent||'')),
            workspace=bulletNodes.find((item)=>/SHORT LANDSCAPE KEEPS EVERY COMMAND/.test(item.textContent||'')),
            coldArt=bulletNodes.find((item)=>/COLD PLANETSIDE ART NO LONGER FREEZES THE DECK/.test(item.textContent||'')),
            worker=bulletNodes.find((item)=>/ONE BACKGROUND PAINTER AT A TIME/.test(item.textContent||'')),
            shipyard=bulletNodes.find((item)=>/ENGINEERING TURNS OPPORTUNITY INTO REACH/.test(item.textContent||'')),
            hdSurface=bulletNodes.find((item)=>/HD SURFACES HAVE ONE NAMED OWNER/.test(item.textContent||'')),
            headingFor=(item)=>(item?.parentElement?.previousElementSibling?.textContent||'').trim(),
            firstHeading=headingFor(first),recoveryHeading=headingFor(recovery),worldCodeHeading=headingFor(worldCode),atlasRouteHeading=headingFor(atlasRoute),captureHeading=headingFor(capture),frontierAudioHeading=headingFor(frontierAudio),creatureListenHeading=headingFor(creatureListen),biosphereListenHeading=headingFor(biosphereListen),mealHeading=headingFor(meal),breedHeading=headingFor(breed),renameHeading=headingFor(rename),trainingHeading=headingFor(training),lessonHeading=headingFor(lesson),artHeading=headingFor(art),
            shipyardHeading=headingFor(shipyard),hdSurfaceHeading=headingFor(hdSurface),
            worldCodeText=worldCode?.textContent||'',atlasRouteText=atlasRoute?.textContent||'',captureText=capture?.textContent||'',frontierAudioText=frontierAudio?.textContent||'',creatureListenText=creatureListen?.textContent||'',biosphereListenText=biosphereListen?.textContent||'',mealText=meal?.textContent||'',breedText=breed?.textContent||'',renameText=rename?.textContent||'',trainingText=training?.textContent||'',lessonText=lesson?.textContent||'',artText=art?.textContent||'',
            shipyardText=shipyard?.textContent||'',hdSurfaceText=hdSurface?.textContent||'',
            charterPlacement=!!first&&!!recovery&&first!==recovery&&firstHeading==='Gameplay'&&recoveryHeading==='Bug Fixes',
            ingressPlacement=!!worldCode&&!!atlasRoute&&worldCode!==atlasRoute&&worldCodeHeading==='Gameplay'&&atlasRouteHeading==='Gameplay',
            worldCodeContract=worldCodeText.includes('Every accepted galaxy, star, or planet route is regenerated from the seeded universe and source-verified instead of trusting the code.')
              &&worldCodeText.includes('A stale or forged code leaves the current view unchanged and keeps the exact query unchanged.')
              &&worldCodeText.includes('An in-reach planet address returns to Survey without bypassing Land')
              &&!worldCodeText.includes('An in-reach address returns to Survey without bypassing Land'),
            atlasRouteContract=atlasRouteText.includes('only after the saved route is regenerated from the seeded universe and source-verified')
              &&atlasRouteText.includes('Stale, forged, or incomplete rows remain visible but disabled')
              &&atlasRouteText.includes('a proven planet entry returns to Survey and Land remains explicit')
              &&!atlasRouteText.includes('through list-based deterministic travel'),
            captureBioscanContradiction=/(?:Capture|Tame|Scavenge|Sample)(?![^.!?]{0,160}\\bsource-proven world beyond Sol\\b)[^.!?]{0,160}(?:banks?|advances?|counts?)[^.!?]{0,64}(?:Charter|bioscan|life-discovery)/i.test(captureText)
              ||/(?:miss|later success|repeat|stale tab|failed write)(?![^.!?]{0,128}\\bbanks nothing\\b)[^.!?]{0,128}(?:banks?|advances?|counts?)[^.!?]{0,64}(?:Charter|bioscan|life-discovery|tick)/i.test(captureText)
              ||/\\b(?:on|in) Sol\\b[^.!?]{0,96}(?:banks?|advances?|counts?)[^.!?]{0,64}(?:Charter|bioscan|life-discovery|tick)/i.test(captureText),
            discoverLifeAvailabilityContradiction=/(?:separate )?Discover Life action[^.!?]{0,64}(?:is|becomes) (?:now )?(?:live|available|restored)/i.test(captureText),
            captureContradiction=/(?:preview row|Planetside preview)[^.!?]{0,80}(?:is|as) (?:the )?(?:chosen )?(?:capture )?target/i.test(captureText)
              ||/miss[^.!?]{0,80}(?:spends? no|does not spend) (?:Biosphere )?Yield/i.test(captureText)
              ||unnegated(captureText,/(?:Biosphere Yield|pool)[^.!?]{0,100}(?:recovers?|advances?)[^.!?]{0,64}(?:closed|closing|wall clock|offline)/i)
              ||/(?:repeat|later-world|later-cycle)[^.!?]{0,120}(?:adds?|awards?|earns?) (?:another|a second) (?:Compendium page|first-find reward|Rare Find Stardust)/i.test(captureText)
              ||/(?:shown odds|capture chance)[^.!?]{0,96}(?:ignore|exclude|do not include)[^.!?]{0,64}(?:equipped )?(?:capture-chance )?gear/i.test(captureText)
              ||captureBioscanContradiction,
            captureContract=captureHeading==='Gameplay'
              &&captureText.includes('Tame chooses uniformly from every eligible fauna in the full biosphere')
              &&captureText.includes('Scavenge from eligible flora and fungi')
              &&captureText.includes('Sample from eligible microbes—not only the at-most-eight-row Planetside preview')
              &&captureText.includes('Equipped capture-chance gear is included in the shown odds at +1.5 percentage points per point before the 95% overall chance ceiling, with its contribution capped at +25 percentage points; first contact remains unavailable')
              &&captureText.includes('All three share one finite Biosphere Yield')
              &&captureText.includes('every attempt spends 1 on a hit or miss')
              &&captureText.includes('pool fully recovers at the next 20-minute active-play cycle')
              &&captureText.includes('never from closing the game or moving the wall clock')
              &&captureText.includes('successful species leaves that action’s pool for the rest of the cycle')
              &&captureText.includes('a miss stays eligible')
              &&captureText.includes('first successful observation adds one Compendium page plus one owned creature for Tame or one specimen lot for Scavenge and Sample')
              &&captureText.includes('Legendary-or-better first find also awards its one Rare Find Stardust bonus')
              &&captureText.includes('exact amount shown in the result')
              &&captureText.includes('later-world or later-cycle repeat adds another creature or lot without another page or first-find reward')
              &&captureText.includes('a miss adds none of them')
              &&captureText.includes('Scavenge and Sample never create living companions')
              &&captureText.includes('first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction')
              &&captureText.includes('A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing')
              &&captureText.includes('v2’s current replacement for v1.8.9’s separate Discover Life action')
              &&captureText.includes('Survey Records and accepted or weekly bioscan Charters remain unavailable')
              &&captureText.includes('Narrow Feed, nonlethal Breed, exact-instance Rename, requested Listen, and role-only Field Scout are available from a real fauna Compendium detail')
              &&captureText.includes('Field Scout interception and XP, friendly duels, passive evolution, dispatch, missions, care, and bond remain unavailable')
              &&!captureContradiction&&!discoverLifeAvailabilityContradiction,
            audioContradiction=unnegated(text,/(?:Compendium list|browsing|filtering|focus|navigation|returning)[^.!?]{0,96}auto[- ]?plays?[^.!?]{0,48}(?:call|voice|expression)/i)
              ||unnegated(text,/(?:Listen to biosphere|biosphere signal|ecology pulse)[^.!?]{0,96}(?:reveals?|names?)[^.!?]{0,48}(?:hidden )?species/i)
              ||unnegated(text,/(?:Listen to biosphere|biosphere signal|ecology pulse)[^.!?]{0,96}(?:spends?|costs?)[^.!?]{0,32}Yield/i)
              ||unnegated(text,/(?:Listen to biosphere|biosphere signal|ecology pulse)[^.!?]{0,96}(?:grants?|awards?)[^.!?]{0,48}(?:discovery|reward)/i)
              ||unnegated(text,/(?:Listen to biosphere|biosphere signal|ecology pulse)[^.!?]{0,96}(?:writes?|changes?)[^.!?]{0,32}(?:the )?save/i)
              ||unnegated(text,/(?:Listen to biosphere|biosphere signal|ecology pulse)[^.!?]{0,96}(?:plays?|starts?)[^.!?]{0,64}(?:before|without)[^.!?]{0,80}(?:visible|counterpart|biosphere lead|inhabited world)/i)
              ||unnegated(text,/\\bcombat sound remains (?:future work|unavailable)/i),
            audioContract=frontierAudioHeading==='New Features & Systems'
              &&creatureListenHeading==='Gameplay'&&biosphereListenHeading==='Gameplay'
              &&frontierAudioText.includes('one deterministic runtime across a verified durable wild-fauna Tame, one exact durable nonconverging Feed commit, and an explorer-requested call from one exact owned-fauna detail')
              &&frontierAudioText.includes('Each waits for its own current visible accessible counterpart')
              &&frontierAudioText.includes('browsing, filtering, focus, navigation, misses, refusals, stale or converging results, repeats, reloads, hidden play, route or counterpart loss, and disabled Sound or Creature voices remain silent without retry or replay')
              &&frontierAudioText.includes('A separate explicit pre-landing Survey and Planetside biosphere Listen may play one generic distant-ecology signal only while that exact inhabited world surface’s visible biosphere lead agrees')
              &&frontierAudioText.includes('the two controls retain distinct approach/roster evidence, reveal no species, spend no Yield, grant nothing, and write no save')
              &&frontierAudioText.includes('After a verified settlement, the Combat Chronicle now gives every already-modelled registered cue its own exact visible-caption sound')
              &&frontierAudioText.includes('initiative, dodge, stun, damage with critical or ability layers, burn, regeneration, defeat, resolution')
              &&frontierAudioText.includes('Guardian or Titan entrance, phase, victory, and defeat motifs')
              &&frontierAudioText.includes('at most two combat voices overlap')
              &&frontierAudioText.includes('master Sound governs them, Creature voices does not')
              &&frontierAudioText.includes('Authored ambience, music, recorded assets, and other creature actions remain future work')
              &&creatureListenText.includes('Open a real owned-fauna Compendium detail and choose Listen on an exact companion to hear its stable deterministic call')
              &&creatureListenText.includes('Browsing, filtering, focusing, and returning through the Compendium never auto-play it')
              &&biosphereListenText.includes('pre-landing Survey card and landed Planetside both offer Listen to biosphere')
              &&biosphereListenText.includes('only while that exact surface’s biosphere lead is visible')
              &&biosphereListenText.includes('never names a hidden species, spends Yield, grants a discovery or reward, or changes the save')
              &&!audioContradiction,
            mealContradiction=/(?<!Narrow )\\bFeeding is (?:now )?(?:live|playable|available)/i.test(mealText)
              ||/(?:assigned|recovering|capped) companions?[^.!?]{0,80}(?:can|may) (?:still )?be fed/i.test(mealText)
              ||/(?:Feed|meal)[^.!?]{0,48}(?:automatically )?retries/i.test(mealText)
              ||/optimistic(?:ally)?[^.!?]{0,48}(?:changes|updates|spends|raises)/i.test(mealText)
              ||/(?:taste|flavou?r|stats?|Power|injury|healing|poison|bond|explorer eating)[^.!?]{0,80}(?:is|are) (?:now )?(?:live|available|changed|increased|discovered|healed)/i.test(mealText)
              ||/Meals can rise above 200/i.test(mealText)
              ||/Every Compendium detail offers Feed/i.test(mealText),
            mealContract=mealHeading==='Gameplay'
              &&mealText.includes('real fauna Compendium detail')
              &&mealText.includes('one exact unassigned owned companion below the 200-Meal cap')
              &&mealText.includes('one exact owned flora lot through Use 1')
              &&mealText.includes('Same-species twins remain separate exact instances')
              &&mealText.includes('assigned, recovering, and capped companions stay disabled and explain why')
              &&mealText.includes('One receipt-bearing compare-and-swap raises Meals by 1 and removes exactly 1 flora')
              &&mealText.includes('emptying that exact lot on its final unit')
              &&mealText.includes('no retry or optimistic change')
              &&mealText.includes('Back and Close remain available')
              &&mealText.includes('Refused, stale, and failed writes use and publish nothing')
              &&mealText.includes('requires reload and cannot feed twice')
              &&mealText.includes('trusted native Feed gesture, exact current ownership successor, and still-current accessible settled status')
              &&mealText.includes('one deterministic synthesized acknowledgement after that status appears')
              &&/refused, stale, converging, replayed, hidden, route-lost, and counterpart-lost paths remain silent/i.test(mealText)
              &&mealText.includes('Tastes and flavours, stat or Power growth, injury care or healing, poison, bond, explorer eating, friendly duels, and missions remain unavailable')
              &&mealText.includes('Companion Breed is a separate action with its own exact-parent eligibility, odds, lineage, and active-play Recovery')
              &&mealText.includes('Rename is identity-only')
              &&mealText.includes('Field Scout changes only the exact role without intercepting injury or earning Scout XP yet')
              &&!mealContradiction,
            breedContradiction=/Both parents are consumed|Recovery advances while the game is closed|same exact companion can occupy both parent roles|failed attempt creates one child|Breeding automatically retries/i.test(breedText)
              ||/(?:failed pairing|refusal|stale result|failed write)[^.!?]{0,96}(?:banks?|adds?|awards?|grants?)\\s+(?!no(?:thing)?\\b)[^.!?]{0,64}(?:Charter|hybrid bloodline|breeding credit)/i.test(breedText),
            breedContract=breedHeading==='Gameplay'
              &&breedText.includes('Breed is now available from a real fauna Compendium detail')
              &&breedText.includes('one exact owned companion of that detail’s species and one distinct exact owned fauna mate')
              &&breedText.includes('same-species twins remain separate')
              &&breedText.includes('bounded 24-row pages')
              &&breedText.includes('Parents are never consumed')
              &&breedText.includes('Success creates one deterministic child with +2 XP and gives both parents 8 active-play minutes of Recovery')
              &&breedText.includes('the first successful union of each canonical unordered species pair gives that child another +5 XP')
              &&breedText.includes('failure creates no child and gives both 2')
              &&breedText.includes('Recovery blocks Breed, combat, and dispatch')
              &&breedText.includes('never advances from closed-game time or a changed wall clock')
              &&breedText.includes('Both complete save outcomes—including exact Charter progress—are proved before the one draw')
              &&breedText.includes('one immutable receipt and one compare-and-swap with no retry or optimistic child, XP, pair claim, or Recovery')
              &&breedText.includes('A successful offspring banks Chapter 3’s Breed a hybrid bloodline goal in that same save')
              &&breedText.includes('a failed pairing, refusal, stale result, or failed write banks nothing and grants no Charter credit')
              &&breedText.includes('unconfirmable durable result locks read-only and reloads so it cannot breed twice')
              &&!breedContradiction,
            renameContradiction=/Exhibition companions may still be renamed|Rename changes the selected companion genome|unchanged name consumes one receipt|Rename automatically retries|stale rename changes the nickname/i.test(renameText),
            renameContract=renameHeading==='Gameplay'
              &&renameText.includes('Rename is now available from a real fauna Compendium detail')
              &&renameText.includes('one exact owned companion from bounded 24-row pages')
              &&renameText.includes('same-species twins remain separate by stable instance identity')
              &&renameText.includes('Assigned, recovering, and injured companions may be renamed because this action changes identity only')
              &&renameText.includes('exhibition, non-owned, protected, and revision-exhausted rows refuse')
              &&renameText.includes('cleaned-empty or unchanged name consumes no receipt or write')
              &&renameText.includes('changes only that exact companion’s nickname')
              &&renameText.includes('never its species, genome, traits, lineage, assignment, condition, bond, catalogue alias, or another twin')
              &&renameText.includes('One immutable receipt and one exact-five compare-and-swap settle without RNG, retry, or optimistic publication')
              &&renameText.includes('converge read-only through reload so the name cannot apply twice')
              &&!renameContradiction,
            lessonContradiction=/(?:wrong-world detour|Escape)[^.!?]{0,120}(?:abandons? Sol|abandons? (?:the )?lesson|keeps? the detour open)/i.test(lessonText),
            lessonContract=lessonHeading==='Bug Fixes'
              &&lessonText.includes('If Survey is rebuilt while a lesson owns it, the new Land and Atlas actions inherit the same keyboard, focus, and pointer scope before they can answer')
              &&lessonText.includes('A wrong-world detour keeps only its real Close available, and Escape dismisses it without abandoning Sol or the lesson')
              &&!lessonContradiction,
            trainingContradiction=/\\balways\\b[^.!?]{0,80}\\brestor(?:e|es|ed)\\b[^.!?]{0,40}\\bimmediately\\b/i.test(trainingText)
              ||/verification[^.!?]{0,48}pauses?[^.!?]{0,72}(?:clear|discard|lose)s?[^.!?]{0,48}(?:view|location)/i.test(trainingText)
              ||/verification[^.!?]{0,48}pauses?[^.!?]{0,96}(?:view|location)[^.!?]{0,48}(?:cleared|discarded|lost)/i.test(trainingText)
              ||/verification pauses[^.!?]{0,160}reload safely restarts Field Training from proven Sol/i.test(trainingText)
              ||/(?:older|legacy)[^.!?]{0,96}(?:checkpoint|Training)[^.!?]{0,96}(?:whole|entire) (?:save|expedition)/i.test(trainingText)
              ||/(?:older|legacy)[^.!?]{0,96}checkpoint[^.!?]{0,96}restor(?:e|es|ed)[^.!?]{0,48}(?:the )?pre-Training view/i.test(trainingText)
              ||/Skip from Welcome[^,;.!?]{0,80}(?:Earth|pre-Training view)/i.test(trainingText)
              ||/complet(?:e|es|ed|ing)[^.!?]{0,64}(?:drill|Training)[^.!?]{0,48}(?:after Land)?[^.!?]{0,48}(?:Sol|pre-Training view)/i.test(trainingText)
              ||/(?:unrecognized|unknown) checkpoint[^.!?]{0,120}(?:close|dismiss|continue|keep playing|keep exploring)/i.test(trainingText)
              ||/(?:unrecognized|unknown) checkpoint[^.!?]{0,120}(?:discard|clear|overwrite|silently ignore)/i.test(trainingText),
            trainingContract=trainingHeading==='Gameplay'
              &&trainingText.includes('The current 15-card drill keeps six real navigation lessons for finding Earth, reading Survey, charting, opening the Atlas, and landing')
              &&trainingText.includes('adds read-only Planetside, Engineering, Compendium, Records, Guardian/combat, and CF1 Share/Follow orientation')
              &&trainingText.includes('Training locks every mutating board action and performs no capture, meal, breeding, rename, Field Scout change, engineering transaction, or combat')
              &&trainingText.includes('Restart captures the exact pre-Training view')
              &&trainingText.includes('A normal Finish or Skip source-verifies and immediately restores the exact pre-Training view')
              &&trainingText.includes('if verification pauses, that exact view stays saved')
              &&trainingText.includes('when Sol can still be verified, Training returns there')
              &&trainingText.includes('reload can restart safely and retry')
              &&trainingText.includes('Older v1.8.9 Training checkpoints restore only the eleven pre-drill record groups they captured')
              &&trainingText.includes('every other expedition field is retained from the surrounding save')
              &&trainingText.includes('That older checkpoint contains no saved view')
              &&trainingText.includes('Skip from Welcome stays in Sol')
              &&trainingText.includes('completing the drill after Land stays at Earth')
              &&trainingText.includes('An unrecognized checkpoint or unavailable recovery route locks exploration behind a recovery screen')
              &&trainingText.includes('leaves the stored expedition unchanged')
              &&trainingText.includes('reload after updating, or import a trusted complete expedition')&&!trainingContradiction,
            artContradiction=/(?:mounts?|renders?|loads?|keeps?)[^.!?]{0,80}\\b(?:all|every)\\b[^.!?]{0,40}\\b1,?500\\b/i.test(artText)
              ||/(?:132px|thumbnail)[^.!?]{0,80}(?:displayed )?(?:name|seed)[^.!?]{0,40}(?:alone|only)/i.test(artText)
              ||/(?:list|Planetside)[^.!?]{0,48}(?:uses?|renders?|loads?|keeps?)[^.!?]{0,32}(?:440px|440-pixel)/i.test(artText)
              ||/(?:lease|thumbnail)[^.!?]{0,80}(?:remain|stay|kept|pinned)[^.!?]{0,40}(?:after|when)[^.!?]{0,40}(?:Close|leave|unmount|filter)/i.test(artText),
            artContract=artHeading==='Under the Hood'&&artText.includes('Species art loads on demand')
              &&artText.includes('up to 1,500 logical entries while mounting the visible viewport plus half a viewport of overscan on each side (about two viewports total), plus at most the focused pinned row')
              &&artText.includes('neutral placeholder to an exact 132px thumbnail keyed by the complete genome')
              &&artText.includes('Search filters the logical count')
              &&artText.includes('Back restores the saved row and focus')&&artText.includes('Close returns focus to the exact opener')
              &&artText.includes('Planetside shares the same bounded thumbnail lease path')
              &&artText.includes('leases release with their visible owners')
              &&artText.includes('only specimen detail publishes and retains an exact 440px portrait')
              &&artText.includes('thumbnail scratch art is downsampled to 132px before it crosses the worker boundary')
              &&!artContradiction,
            workspaceContract=headingFor(workspace)==='UI Enhancements'
              &&(workspace?.textContent||'').includes('Opening the Compendium now gives its variable-height rows a full safe-height left workspace while Search, Survey, and the dock remain visible and usable in a separate right column'),
            coldArtContract=headingFor(coldArt)==='Bug Fixes'
              &&(coldArt?.textContent||'').includes('Loading and painting the first specimen thumbnails now happens away from the renderer thread')
              &&(coldArt?.textContent||'').includes('each now owns one complete verified module response')
              &&(coldArt?.textContent||'').includes('Production rejects any split worker graph'),
            workerContract=headingFor(worker)==='Under the Hood'
              &&(worker?.textContent||'').includes('A dedicated worker is constructed only after a real owner and a serviced boot turn, with its complete portrait graph sealed into that exact worker entry')
              &&(worker?.textContent||'').includes('terminates an idle or replaced producer without a synchronous renderer fallback'),
            shipyardContradiction=/all six Research rows can (?:currently )?be purchased/i.test(shipyardText)
              ||/current Survey card[^.!?]{0,80}(?:does not yet|renders no|shows no|paints no)[^.!?]{0,64}(?:orbital|mineral) rows/i.test(shipyardText)
              ||/(?:renders?|paints?|shows?) every orbital mineral/i.test(shipyardText)
              ||/(?:orbit|orbital Survey)[^.!?]{0,96}(?:also|now) (?:shows|reveals|includes|names)[^.!?]{0,80}(?:cosmic|exceptional|grades?|reserves?|progress|Mine)/i.test(shipyardText)
              ||/(?:Research|Skim)[^.!?]{0,64}banks? (?:a |the )?(?:mining|fabrication|Charter) (?:goal|credit|tick)/i.test(shipyardText)
              ||/(?:biosphere discovery)[^.!?]{0,48}(?:is|are) (?:now )?(?:available|live|playable)/i.test(shipyardText)
              ||unnegated(shipyardText,/(?:reward|cost|Charter tick|optimistic panel change)[^.!?]{0,80}publishes? before[^.!?]{0,48}(?:transaction )?commit/i)
              ||/(?:mixed stock|mixed-material craft)[^.!?]{0,80}(?:receives?|carries?|gets?|adds?)[^.!?]{0,80}(?:Pureforged|crafted modifier)/i.test(shipyardText)
              ||/Pureforged[^.!?]{0,80}(?:rerolls?|changes?)[^.!?]{0,64}(?:reload|reopen)/i.test(shipyardText)
              ||/authored (?:natural )?affixes?(?:\\/| and )drawbacks?[^.!?]{0,80}(?:is|are) (?:now )?(?:available|live|playable)/i.test(shipyardText)
              ||/(?:item )?upgrades?[^.!?]{0,80}(?:is|are) (?:now )?(?:available|live|playable)/i.test(shipyardText)
              ||/sockets?[^.!?]{0,80}(?:is|are) (?:now )?(?:available|live|playable)/i.test(shipyardText)
              ||/vendors?[^.!?]{0,80}(?:is|are) (?:now )?(?:available|live|playable)/i.test(shipyardText),
            shipyardContract=shipyardHeading==='New Features & Systems'
              &&shipyardText.includes('finite grounded Mine and Jump-gated Skim actions')
              &&shipyardText.includes('exactly six Research rows')&&shipyardText.includes('all 62 fixed Fabricator recipes')
              &&shipyardText.includes('Only Deep Scanners can currently be purchased')
              &&shipyardText.includes('durable ownership now adds one Mineral veins row to eligible lifeless non-Earth orbital Survey cards')
              &&shipyardText.includes('preserves ordinary-deposit order and marks the separate biome vein with ✦')
              &&shipyardText.includes('cosmic and exceptional veins, grades, reserves, progress, and mining remain grounded')
              &&shipyardText.includes('Fabrication enables only outputs with connected effects')
              &&shipyardText.includes('exact cost, prerequisite, revision, and capacity headroom')
              &&shipyardText.includes('A slotted craft paid entirely from exceptional direct materials now receives one deterministic Pureforged modifier')
              &&shipyardText.includes('mining yield, rich-strike chance, or capture-contact points')
              &&shipyardText.includes('bound to the exact recipe, receipt, and item')
              &&shipyardText.includes('mixed stock remains ordinary')
              &&shipyardText.includes('Pureforged effects without a connected consumer, authored natural affixes/drawbacks, item upgrades, sockets, and vendors remain unavailable')
              &&shipyardText.includes('Built permanent systems change the real ship and star reach')
              &&shipyardText.includes('Remnant skim damage is previewed before it can spend HP')
              &&shipyardText.includes('Engineering can spend preserved Stardust but does not earn it')
              &&shipyardText.includes('no reward, cost, Charter tick, or optimistic panel change publishes before the one receipt-bearing transaction commits')
              &&!shipyardContradiction,
            hdSurfaceContract=hdSurfaceHeading==='Under the Hood'
              &&hdSurfaceText.includes('named HD surface-planet texture attachment')
              &&hdSurfaceText.includes('exact surface generation and planet identity')
              &&hdSurfaceText.includes('retains the displayed predecessor until an acquired successor publishes')
              &&hdSurfaceText.includes('rejects stale work')&&hdSurfaceText.includes('suppresses same-texture swaps')
              &&hdSurfaceText.includes('cancels and releases its timer and leases at the owning scene boundary'),
            publishing=bulletNodes.find((item)=>/DEVELOPMENT PUBLISHING STAYS PARKED/.test(item.textContent||'')),
            publishingHeading=headingFor(publishing),publishingText=publishing?.textContent||'',
            publishingClaim=/(?:(?:(?:v2(?:[.]0)?[ \t]+)?preview(?:[ \t]+package)?|PR battery|branch-site workflow|development site|production)[^.!?;]{0,120}(?<![A-Za-z])(?:publish(?:es)?|deploys?|ships|(?:is|are|was|were|be|been|being|has|have|had)(?:[ \t]+(?:now|just|already|currently|being|been|has|have|had)){0,3}[ \t]+(?:published|deployed|shipped)|(?:is|are|was|were|be|been|being|has|have|had|goes|went|going|gone)(?:[ \t]+(?:now|just|already|currently|being|been|has|have|had|gone)){0,3}[ \t]+live)(?![A-Za-z])|(?<![A-Za-z])(?:publish(?:es)?|deploys?|ships|(?:is|are|was|were|be|been|being|has|have|had)(?:[ \t]+(?:now|just|already|currently|being|been|has|have|had)){0,3}[ \t]+(?:published|deployed|shipped)|(?:is|are|was|were|be|been|being|has|have|had|goes|went|going|gone)(?:[ \t]+(?:now|just|already|currently|being|been|has|have|had|gone)){0,3}[ \t]+live)(?![A-Za-z])[^.!?;]{0,120}(?:(?:v2(?:[.]0)?[ \t]+)?preview(?:[ \t]+package)?|PR battery|branch-site workflow|development site|production))/i,
            publishingContradiction=bullets.some((copy)=>unnegated(copy,publishingClaim)),
            publishingContract=publishingHeading==='Under the Hood'
              &&publishingText.includes('DEVELOPMENT PUBLISHING STAYS PARKED')
              &&publishingText.includes('it does not publish')
              &&publishingText.includes('The separate branch-site workflow remains manually parked')
              &&publishingText.includes('production remains the v1.8.9 main-branch site')
              &&!publishingContradiction;
          const overclaim=/all six Research rows[^.!?]{0,80}(?:(?:can (?:now )?be)|are(?: now)?)\\s+(?:bought|purchased|playable|available|live)/i.test(text)
            ||/all 62 fixed Fabricator recipes[^.!?]{0,80}(?:(?:can (?:now )?be)|are(?: now)?)\\s+(?:actionable|playable|available|live)/i.test(text)
            ||/(?:dormant|disconnected|unsupported) (?:Fabricator )?(?:effects?|outputs?|recipes?)[^.!?]{0,80}(?:is|are) (?:now )?(?:actionable|playable|available|live)/i.test(text)
            ||/(?:mixed stock|mixed-material craft)[^.!?]{0,80}(?:receives?|carries?|gets?|adds?)[^.!?]{0,80}(?:Pureforged|crafted modifier)/i.test(text)
            ||/Pureforged[^.!?]{0,80}(?:rerolls?|changes?)[^.!?]{0,64}(?:reload|reopen)/i.test(text)
            ||/authored (?:natural )?affixes?(?:\\/| and )drawbacks?[^.!?]{0,80}(?:is|are) (?:now )?(?:playable|available|live)/i.test(text)
            ||/\\b(?:item )?upgrades?\\b[^.!?]{0,80}(?:is|are) (?:now )?(?:playable|available|live)/i.test(text)
            ||/\\bsockets?\\b[^.!?]{0,80}(?:is|are) (?:now )?(?:playable|available|live)/i.test(text)
            ||/\\bvendors?\\b[^.!?]{0,80}(?:is|are) (?:now )?(?:playable|available|live)/i.test(text)
            ||/(?:biosphere discovery|Discover Life|duels?|creature combat|passive evolution|companion assignment|companion missions?|missions?)[^.!?]{0,80}(?:is|are) (?:now )?(?:playable|available|live)/i.test(text)
            ||/\\b(?:Field Scouts are|Field Scout is) (?:now )?(?:playable|available|live)\\b/i.test(text)
            ||/\\bField Scout (?:interception|XP|dispatch|missions?|care|bond)\\b[^.!?]{0,80}(?:is|are) (?:now )?(?:playable|available|live)/i.test(text)
            ||/(?<!Narrow )\\bFeeding is (?:now )?(?:live|playable|available)/i.test(text)
            ||/(?:assigned|recovering|capped) companions?[^.!?]{0,80}(?:can|may) (?:still )?be fed/i.test(text)
            ||/(?:Feed|meal)[^.!?]{0,48}(?:automatically )?retries/i.test(text)
            ||/optimistic(?:ally)?[^.!?]{0,48}(?:changes|updates|spends|raises)/i.test(text)
            ||/(?:taste|flavou?r|stats?|Power|injury|healing|poison|bond|explorer eating)[^.!?]{0,80}(?:is|are) (?:now )?(?:live|available|changed|increased|discovered|healed)/i.test(text)
            ||/Meals can rise above 200/i.test(text)
            ||/Every Compendium detail offers Feed/i.test(text)
            ||/\\bv2(?:\\.0)?\\s+(?:port|game|build)\\s+(?:is\\s+)?(?:complete|finished|production[- ]ready|fully ported)\\b/i.test(text)
            ||/\\b(?:all|every)\\s+legacy\\s+(?:system|mechanic|feature)s?\\b[^.!?]{0,80}\\b(?:ported|playable|available|live)\\b/i.test(text)
            ||breedContradiction||renameContradiction||audioContradiction;
          const identity=title.includes('v2.0 · A New Foundation'),honest=!overclaim&&!captureContradiction&&!discoverLifeAvailabilityContradiction&&!audioContradiction&&!mealContradiction&&!breedContradiction&&!renameContradiction&&!lessonContradiction&&!trainingContradiction&&!artContradiction&&!shipyardContradiction&&!publishingContradiction&&lower.includes('mechanics that are not yet playable are labelled instead of promised');
          return {ok:identity
            &&article?.querySelector('[data-guide-status]')?.getAttribute('data-guide-status')==='draft'
            &&JSON.stringify(headings)===JSON.stringify(expected)&&bullets.length===expectedBulletCount&&bullets.every((bullet)=>bullet.length>0)&&charterPlacement
            &&ingressPlacement&&worldCodeContract&&atlasRouteContract&&captureContract&&audioContract&&mealContract&&breedContract&&renameContract&&lessonContract&&trainingContract&&artContract
            &&workspaceContract&&coldArtContract&&workerContract&&shipyardContract&&hdSurfaceContract&&publishingContract
            &&/NEW FOUNDATION/.test(text)&&/ONE SURFACE, ONE CLOSE/.test(text)
            &&/exactly one 44-pixel top-right Close action/.test(text)
            &&/Spacing inside either desktop rail belongs to that command deck and leaves the active panel open/.test(text)
            &&/a genuine empty-sky press still dismisses it/.test(text)
            &&/FIRST PLANETFALL COUNTS/.test(text)&&/Only a world’s first landing banks the live landfall objective/.test(text)
            &&/COMPLETE IMPORTED CHAPTERS MOVE AGAIN/.test(text)&&/incomplete or unpowered records stay put/.test(text)
            &&/RARITY IS NOT A SPECTRAL CLASS/.test(text)&&state.rnSeen===${JSON.stringify(guideReleaseBaseline.rnSeen)}
            &&honest&&state.releasePending===${JSON.stringify(guideReleaseBaseline.releasePending)},
            identity,honest,overclaim,headings,bulletCount:bullets.length,populated:bullets.every((bullet)=>bullet.length>0),
            charterPlacement,firstHeading,recoveryHeading,ingressPlacement,worldCodeHeading,atlasRouteHeading,
            worldCodeContract,atlasRouteContract,captureHeading,captureContract,captureContradiction,captureBioscanContradiction,discoverLifeAvailabilityContradiction,frontierAudioHeading,creatureListenHeading,biosphereListenHeading,audioContract,audioContradiction,mealHeading,mealContract,mealContradiction,breedHeading,breedContract,breedContradiction,renameHeading,renameContract,renameContradiction,lessonHeading,lessonContract,lessonContradiction,trainingHeading,trainingContract,trainingContradiction,artHeading,artContract,artContradiction,
            workspaceContract,coldArtContract,workerContract,shipyardHeading,shipyardContract,shipyardContradiction,hdSurfaceHeading,hdSurfaceContract,
            publishingHeading,publishingContract,publishingContradiction,rnSeen:state.rnSeen,
            releasePending:state.releasePending};})()`;
        const developmentDetail = await evalIn(developmentDetailCheck);
        addOutcome(vp.label, 'release-detail', 'GUIDE_DEVELOPMENT_RELEASE_INVENTORY', '#guidepanel .guide-topic', developmentDetail,
          'A New Foundation renders the exact five-section, 77-outcome development inventory, including truthful Arc 2 authority, Arc 3 Engineering/Shipyard, Arc 4 capture limits and post-progression readiness, narrow real-fauna Compendium Feed, nonlethal Breed/Recovery with same-save Charter credit, identity-only Rename, explicit exact-companion and visible-world Listen ownership, and named HD-surface ownership, without changing shipped-release state');
        if (!releaseDetailControlRun) {
          releaseDetailControlRun = true;
          const detailControls = await evalIn(`(()=>{ const S=window.__CF_SLICE__,article=document.querySelector('#guidepanel .guide-topic'),
            headings=[...article.querySelectorAll('h5')],items=[...article.querySelectorAll('li')],title=article.querySelector('[data-guide-heading]'),priorState=S.api.state;
            const a=headings[0]?.textContent||'',b=headings[1]?.textContent||'',middle=items[12],parent=middle?.parentNode,next=middle?.nextSibling;
            const titleText=title?.textContent||'',claim=items[1],claimText=claim?.textContent||'',
              panelBoundary=items.find((item)=>/ONE SURFACE, ONE CLOSE/.test(item.textContent||'')),panelBoundaryText=panelBoundary?.textContent||'',
              first=items.find((item)=>/FIRST PLANETFALL COUNTS/.test(item.textContent||'')),
              recovery=items.find((item)=>/COMPLETE IMPORTED CHAPTERS MOVE AGAIN/.test(item.textContent||'')),
              worldCode=items.find((item)=>/WORLD CODES KEEP THE WHOLE DESTINATION/.test(item.textContent||'')),
              atlasRoute=items.find((item)=>/THE ATLAS LEADS BACK/.test(item.textContent||'')),
             capture=items.find((item)=>/BIOSPHERE CAPTURE HAS HONEST LIMITS/.test(item.textContent||'')),
              frontierAudio=items.find((item)=>/THE FRONTIER SPEAKS/.test(item.textContent||'')),
              creatureListen=items.find((item)=>/CREATURE CALLS ARE YOURS TO REQUEST/.test(item.textContent||'')),
              biosphereListen=items.find((item)=>/HEAR A LIVING WORLD WITHOUT SPOILERS/.test(item.textContent||'')),
             meal=items.find((item)=>/ONE EXACT MEAL SETTLES ONCE/.test(item.textContent||'')),
              breed=items.find((item)=>/TWO PARENTS, ONE DURABLE OUTCOME/.test(item.textContent||'')),
              rename=items.find((item)=>/ONE COMPANION, ONE DURABLE NAME/.test(item.textContent||'')),
              training=items.find((item)=>/FIELD TRAINING LIVES IN THE NEW SHELL/.test(item.textContent||'')),
              lesson=items.find((item)=>/A LESSON OWNS ITS ESCAPE KEY/.test(item.textContent||'')),
              art=items.find((item)=>/ART ARRIVES WHEN IT IS NEEDED/.test(item.textContent||'')),
              workspace=items.find((item)=>/SHORT LANDSCAPE KEEPS EVERY COMMAND/.test(item.textContent||'')),
              coldArt=items.find((item)=>/COLD PLANETSIDE ART NO LONGER FREEZES THE DECK/.test(item.textContent||'')),
              worker=items.find((item)=>/ONE BACKGROUND PAINTER AT A TIME/.test(item.textContent||'')),
              shipyard=items.find((item)=>/ENGINEERING TURNS OPPORTUNITY INTO REACH/.test(item.textContent||'')),
              hdSurface=items.find((item)=>/HD SURFACES HAVE ONE NAMED OWNER/.test(item.textContent||'')),
              publishing=items.find((item)=>/DEVELOPMENT PUBLISHING STAYS PARKED/.test(item.textContent||'')),
              firstText=first?.textContent||'',recoveryText=recovery?.textContent||'',worldCodeText=worldCode?.textContent||'',atlasRouteText=atlasRoute?.textContent||'',captureText=capture?.textContent||'',frontierAudioText=frontierAudio?.textContent||'',creatureListenText=creatureListen?.textContent||'',biosphereListenText=biosphereListen?.textContent||'',mealText=meal?.textContent||'',breedText=breed?.textContent||'',renameText=rename?.textContent||'',trainingText=training?.textContent||'',lessonText=lesson?.textContent||'',artText=art?.textContent||'',workspaceText=workspace?.textContent||'',coldArtText=coldArt?.textContent||'',workerText=worker?.textContent||'',
              shipyardText=shipyard?.textContent||'',hdSurfaceText=hdSurface?.textContent||'',publishingText=publishing?.textContent||'',
              recoveryParent=recovery?.parentNode,recoveryNext=recovery?.nextSibling,
              artParent=art?.parentNode,artNext=art?.nextSibling,workspaceParent=workspace?.parentNode,workspaceNext=workspace?.nextSibling,
              coldArtParent=coldArt?.parentNode,coldArtNext=coldArt?.nextSibling,workerParent=worker?.parentNode,workerNext=worker?.nextSibling;
            let baseline=null,order=null,inventory=null,identity=null,truthfulFeatureClaims=[],unavailableFeatureClaims=[],closeContract=null,panelBoundaryContract=null,emptySkyContract=null,firstContract=null,recoveryContract=null,placementContract=null,worldCodeStale=null,atlasRouteStale=null,captureLimitControls=[],captureContradictions=[],bioscanContradictions=[],discoverLifeAvailabilityContradictory=null,audioMissingControls=[],audioContradictions=[],mealMissing=null,mealContradictions=[],breedMissing=null,breedCharterMissing=null,breedContradictions=[],renameMissing=null,renameContradictions=[],lessonStale=null,lessonContradictory=null,trainingStale=null,trainingLegacyStale=null,trainingRecoveryStale=null,trainingContradictory=null,trainingLegacyContradictory=null,trainingRecoveryContradictory=null,artStale=null,artPublishStale=null,artDownsampleStale=null,artPlacementStale=null,workspaceStale=null,workspacePlacementStale=null,coldArtStale=null,coldArtPlacementStale=null,workerStale=null,workerReleaseStale=null,workerPlacementStale=null,shipyardStale=null,shipyardSurveyMissing=null,shipyardExceptionalMissing=null,shipyardEffectSetMissing=null,shipyardBindingMissing=null,shipyardMixedMissing=null,shipyardAdvancedMissing=null,shipyardPublicationContradiction=null,shipyardContradictions=[],hdSurfaceStale=null,publishingStale=null,publishingContradictory=null,publishingLiveProductionContradictory=null,publishingPassiveContradictory=null,publishingVariantContradictions=[],publishingCrossRowContradictory=null,publishingRestored=null,artContradictory=null,authority=null,error=null,discoverLifeAvailabilityChanged=false,mealMissingChanged=false,breedMissingChanged=false,breedCharterMissingChanged=false,renameMissingChanged=false,artPublishChanged=false,artDownsampleChanged=false,artPlacementMoved=false,workspaceChanged=false,workspacePlacementMoved=false,coldArtChanged=false,coldArtPlacementMoved=false,workerChanged=false,workerReleaseChanged=false,workerPlacementMoved=false,shipyardChanged=false,shipyardPublicationChanged=false,shipyardContradictionsChanged=true,lessonStaleChanged=false,lessonContradictionChanged=false,hdSurfaceChanged=false,publishingChanged=false,publishingContradictionChanged=false,publishingLiveProductionChanged=false,publishingPassiveChanged=false,publishingVariantsChanged=true,publishingCrossRowChanged=false;
            try {
              if(!headings[0]||!headings[1]||!middle||!parent||!title||!claim||!panelBoundary||!first||!recovery||first===recovery||!worldCode||!atlasRoute||worldCode===atlasRoute||!capture||!frontierAudio||!creatureListen||!biosphereListen||!meal||!breed||!rename||!lesson||!training||!art||!workspace||!coldArt||!worker||!shipyard||!hdSurface||!publishing||!recoveryParent)throw new Error('development-detail control fixture missing');
              baseline=${developmentDetailCheck};
              if(!baseline.ok)throw new Error('development-detail baseline red before mutation controls: '+JSON.stringify(baseline));
              headings[0].textContent=b;headings[1].textContent=a;order=${developmentDetailCheck};
              headings[0].textContent=a;headings[1].textContent=b;
              middle.remove();inventory=${developmentDetailCheck};parent.insertBefore(middle,next);
              title.textContent=titleText.replace('v2.0','v2x0');identity=${developmentDetailCheck};title.textContent=titleText;
              for(const copy of ['Mining is now playable.','Eligible fixed Fabricator crafting is now playable.','Fully exceptional direct-material gear crafting is now playable with a deterministic Pureforged modifier.','Exploration audio is now live.','Capture is now playable.','Narrow real-fauna Compendium Feed is now playable.','Breeding is now playable.','Companion Rename is now playable.','Role-only Field Scout assignment is now playable.','Surface conquest is now playable.']){
                claim.textContent=claimText+' '+copy;truthfulFeatureClaims.push({copy,result:${developmentDetailCheck}});
              }
              for(const copy of ['All six Research rows can now be purchased.','All 62 fixed Fabricator recipes are now actionable.',
                'Disconnected Fabricator outputs are now playable.','Mixed stock also receives a Pureforged modifier.','Pureforged modifiers reroll after reload.',
                'Authored affixes/drawbacks are now available.','Upgrades are now playable.','Item upgrades are now live.',
                'Sockets are now available.','Vendors are now live.','Discover Life is now playable.',
                'Creature combat is now playable.','Field Scout interception is now playable.','Feeding is now playable.']){
                claim.textContent=claimText+' '+copy;unavailableFeatureClaims.push({copy,result:${developmentDetailCheck}});
              }claim.textContent=claimText;
              panelBoundary.textContent=panelBoundaryText.replace('exactly one 44-pixel top-right Close action','Close-action outcome removed');
              closeContract=${developmentDetailCheck};panelBoundary.textContent=panelBoundaryText;
              panelBoundary.textContent=panelBoundaryText.replace('leaves the active panel open','rail preservation outcome removed');
              panelBoundaryContract=${developmentDetailCheck};panelBoundary.textContent=panelBoundaryText;
              panelBoundary.textContent=panelBoundaryText.replace('a genuine empty-sky press still dismisses it','empty-sky dismissal outcome removed');
              emptySkyContract=${developmentDetailCheck};panelBoundary.textContent=panelBoundaryText;
              first.textContent='First-landfall contract removed';firstContract=${developmentDetailCheck};first.textContent=firstText;
              recovery.textContent='Imported recovery contract removed';recoveryContract=${developmentDetailCheck};recovery.textContent=recoveryText;
              first.parentNode.appendChild(recovery);placementContract=${developmentDetailCheck};recoveryParent.insertBefore(recovery,recoveryNext);
              worldCode.textContent='🔗 WORLD CODES KEEP THE WHOLE DESTINATION: CF1 addresses preserve galaxy, star, planet, coordinates, and accepted custom names. An in-reach address returns to Survey without bypassing Land; an out-of-reach address leaves the explorer in place.';
              worldCodeStale=${developmentDetailCheck};worldCode.textContent=worldCodeText;
              atlasRoute.textContent='🧭 THE ATLAS LEADS BACK: Charted galaxies, stars, and worlds can reopen their own navigation level through list-based deterministic travel, while incomplete imported routes remain visible with an honest unavailable label.';
              atlasRouteStale=${developmentDetailCheck};atlasRoute.textContent=atlasRouteText;
              for(const part of [
                'Sample from eligible microbes—not only the at-most-eight-row Planetside preview',
                'Equipped capture-chance gear is included in the shown odds at +1.5 percentage points per point before the 95% overall chance ceiling, with its contribution capped at +25 percentage points; first contact remains unavailable',
                'every attempt spends 1 on a hit or miss',
                'pool fully recovers at the next 20-minute active-play cycle, never from closing the game or moving the wall clock',
                'later-world or later-cycle repeat adds another creature or lot without another page or first-find reward',
                'first durable successful Tame, Scavenge, or Sample on each source-proven world beyond Sol also banks that world’s one Chapter 2 life-discovery tick in the same capture transaction',
                'A miss, Sol, a later success on that world, a stale tab, or a failed write banks nothing',
                'v2’s current replacement for v1.8.9’s separate Discover Life action',
                'Survey Records and accepted or weekly bioscan Charters remain unavailable',
                'Narrow Feed, nonlethal Breed, exact-instance Rename, requested Listen, and role-only Field Scout are available from a real fauna Compendium detail',
                'Field Scout interception and XP, friendly duels, passive evolution, dispatch, missions, care, and bond remain unavailable',
              ]){
                const changed=captureText.replace(part,'isolated capture limit omitted');
                capture.textContent=changed;captureLimitControls.push({part,changed:changed!==captureText,result:${developmentDetailCheck}});
                capture.textContent=captureText;
              }
              for(const copy of [
                'The Planetside preview row is the chosen capture target.',
                'A miss spends no Biosphere Yield.',
                'Biosphere Yield recovers while the game is closed.',
                'A later-world repeat adds a second Compendium page and first-find reward.',
                'The shown odds ignore equipped capture-chance gear.',
              ]){
                capture.textContent=captureText+' '+copy;captureContradictions.push({copy,result:${developmentDetailCheck}});
                capture.textContent=captureText;
              }
              for(const copy of [
                'Capture banks the Charter’s bioscan milestone.',
                'A miss banks one Chapter 2 life-discovery tick.',
                'A successful capture on Sol banks one Charter bioscan tick.',
                'A later success on the same world banks another life-discovery tick.',
                'A stale tab still banks one life-discovery tick.',
                'A failed write advances the Charter bioscan.',
              ]){
                capture.textContent=captureText+' '+copy;bioscanContradictions.push({copy,result:${developmentDetailCheck}});
                capture.textContent=captureText;
              }
              capture.textContent=captureText+' The separate Discover Life action is now available.';
             discoverLifeAvailabilityChanged=capture.textContent!==captureText;
             discoverLifeAvailabilityContradictory=${developmentDetailCheck};capture.textContent=captureText;
              for(const [node,prior,part] of [[frontierAudio,frontierAudioText,'an explorer-requested call from one exact owned-fauna detail'],
                [frontierAudio,frontierAudioText,'A separate explicit pre-landing Survey and Planetside biosphere Listen may play one generic distant-ecology signal'],
                [frontierAudio,frontierAudioText,'After a verified settlement, the Combat Chronicle now gives every already-modelled registered cue its own exact visible-caption sound'],
                [frontierAudio,frontierAudioText,'master Sound governs them, Creature voices does not'],
                [creatureListen,creatureListenText,'Browsing, filtering, focusing, and returning through the Compendium never auto-play it'],
                [biosphereListen,biosphereListenText,'only while that exact surface’s biosphere lead is visible'],
                [biosphereListen,biosphereListenText,'never names a hidden species, spends Yield, grants a discovery or reward, or changes the save']]){
                const mutated=prior.replace(part,'audio ownership boundary omitted');node.textContent=mutated;
                audioMissingControls.push({part,changed:mutated!==prior,result:${developmentDetailCheck}});node.textContent=prior;
              }
              for(const copy of ['Compendium filtering auto-plays the selected creature call.',
                'Listen to biosphere reveals a hidden species and spends 1 Yield.',
                'The biosphere signal grants a discovery reward and changes the save.',
                'The ecology pulse starts before any visible inhabited-world counterpart.',
                'Combat sound remains future work.']){
                frontierAudio.textContent=frontierAudioText+' '+copy;audioContradictions.push({copy,result:${developmentDetailCheck}});frontierAudio.textContent=frontierAudioText;
              }
             meal.textContent=mealText.replace('Field Scout changes only the exact role without intercepting injury or earning Scout XP yet','Field Scout boundary omitted');
              mealMissingChanged=meal.textContent!==mealText;mealMissing=${developmentDetailCheck};meal.textContent=mealText;
              for(const copy of [
                'Assigned companions can still be fed.',
                'The meal automatically retries after a stale result.',
                'Stats are now increased by feeding.',
                'Meals can rise above 200.',
                'Every Compendium detail offers Feed.',
                'Feeding is now playable.',
              ]){
                meal.textContent=mealText+' '+copy;mealContradictions.push({copy,result:${developmentDetailCheck}});
                meal.textContent=mealText;
              }
              breed.textContent=breedText.replace('Success creates one deterministic child with +2 XP and gives both parents 8 active-play minutes of Recovery','Breed child XP and Recovery outcome omitted');
             breedMissingChanged=breed.textContent!==breedText;breedMissing=${developmentDetailCheck};breed.textContent=breedText;
              breed.textContent=breedText.replace('A successful offspring banks Chapter 3’s Breed a hybrid bloodline goal in that same save','Breed Charter co-delivery omitted');
              breedCharterMissingChanged=breed.textContent!==breedText;breedCharterMissing=${developmentDetailCheck};breed.textContent=breedText;
              for(const copy of [
                'Both parents are consumed.',
                'Recovery advances while the game is closed.',
                'The same exact companion can occupy both parent roles.',
               'A failed attempt creates one child.',
               'Breeding automatically retries.',
                'A failed pairing also banks the Charter hybrid bloodline goal.',
              ]){
                breed.textContent=breedText+' '+copy;breedContradictions.push({copy,result:${developmentDetailCheck}});
                breed.textContent=breedText;
              }
              rename.textContent=renameText.replace('changes only that exact companion’s nickname','rename identity boundary omitted');
              renameMissingChanged=rename.textContent!==renameText;renameMissing=${developmentDetailCheck};rename.textContent=renameText;
              for(const copy of [
                'Exhibition companions may still be renamed.',
                'Rename changes the selected companion genome.',
                'An unchanged name consumes one receipt.',
                'Rename automatically retries.',
                'A stale rename changes the nickname.',
              ]){
                rename.textContent=renameText+' '+copy;renameContradictions.push({copy,result:${developmentDetailCheck}});
                rename.textContent=renameText;
              }
              lesson.textContent=lessonText.replace('A wrong-world detour keeps only its real Close available, and Escape dismisses it without abandoning Sol or the lesson','wrong-world Escape outcome omitted');lessonStaleChanged=lesson.textContent!==lessonText;
              lessonStale=${developmentDetailCheck};lesson.textContent=lessonText;
              lesson.textContent=lessonText+' Escape from a wrong-world detour abandons Sol and the lesson.';lessonContradictionChanged=lesson.textContent!==lessonText;
              lessonContradictory=${developmentDetailCheck};lesson.textContent=lessonText;
              training.textContent=trainingText.replace('The current 15-card drill keeps six real navigation lessons for finding Earth, reading Survey, charting, opening the Atlas, and landing',
                'current Training inventory omitted');
              trainingStale=${developmentDetailCheck};training.textContent=trainingText;
              training.textContent=trainingText.replace('every other expedition field is retained from the surrounding save','surrounding-save ownership omitted');
              trainingLegacyStale=${developmentDetailCheck};training.textContent=trainingText;
              training.textContent=trainingText.replace('locks exploration behind a recovery screen','persistent recovery boundary omitted');
              trainingRecoveryStale=${developmentDetailCheck};training.textContent=trainingText;
              training.textContent=trainingText+' Finish or Skip always restores immediately, even when verification pauses.';
              trainingContradictory=${developmentDetailCheck};training.textContent=trainingText;
              training.textContent=trainingText+' Older v1.8.9 Training checkpoints restore the entire expedition and the pre-Training view. Skip from Welcome stays at Earth, while completing the drill after Land stays in Sol.';
              trainingLegacyContradictory=${developmentDetailCheck};training.textContent=trainingText;
              training.textContent=trainingText+' An unrecognized checkpoint can close recovery, clear the stored expedition, and continue exploring.';
              trainingRecoveryContradictory=${developmentDetailCheck};training.textContent=trainingText;
              art.textContent='📦 ART ARRIVES WHEN IT IS NEEDED: The large species-art payload loads lazily for Compendium or Planetside, shares one in-flight request, and retains only the latest subscriber per surface.';
              artStale=${developmentDetailCheck};art.textContent=artText;
              art.textContent=artText.replace('only specimen detail publishes and retains an exact 440px portrait','specimen detail can show a 440px portrait');
              artPublishChanged=art.textContent!==artText;artPublishStale=${developmentDetailCheck};art.textContent=artText;
              art.textContent=artText.replace('thumbnail scratch art is downsampled to 132px before it crosses the worker boundary','thumbnail scratch art crosses the worker boundary');
              artDownsampleChanged=art.textContent!==artText;artDownsampleStale=${developmentDetailCheck};art.textContent=artText;
              workspaceParent.appendChild(art);artPlacementMoved=art.parentNode===workspaceParent;artPlacementStale=${developmentDetailCheck};artParent.insertBefore(art,artNext);
              workspace.textContent=workspaceText.replace('Opening the Compendium now gives its variable-height rows a full safe-height left workspace while Search, Survey, and the dock remain visible and usable in a separate right column','short-landscape workspace outcome removed');
              workspaceChanged=workspace.textContent!==workspaceText;workspaceStale=${developmentDetailCheck};workspace.textContent=workspaceText;
              workerParent.appendChild(workspace);workspacePlacementMoved=workspace.parentNode===workerParent;workspacePlacementStale=${developmentDetailCheck};workspaceParent.insertBefore(workspace,workspaceNext);
              coldArt.textContent=coldArtText.replace('Loading and painting the first specimen thumbnails now happens away from the renderer thread','cold renderer-answerability outcome removed');
              coldArtChanged=coldArt.textContent!==coldArtText;coldArtStale=${developmentDetailCheck};coldArt.textContent=coldArtText;
              workspaceParent.appendChild(coldArt);coldArtPlacementMoved=coldArt.parentNode===workspaceParent;coldArtPlacementStale=${developmentDetailCheck};coldArtParent.insertBefore(coldArt,coldArtNext);
              worker.textContent=workerText.replace('A dedicated worker is constructed only after a real owner and a serviced boot turn, with its complete portrait graph sealed into that exact worker entry','worker ownership outcome removed');
              workerChanged=worker.textContent!==workerText;workerStale=${developmentDetailCheck};worker.textContent=workerText;
              worker.textContent=workerText.replace('terminates an idle or replaced producer without a synchronous renderer fallback','worker release/fallback outcome removed');
              workerReleaseChanged=worker.textContent!==workerText;workerReleaseStale=${developmentDetailCheck};worker.textContent=workerText;
              coldArtParent.appendChild(worker);workerPlacementMoved=worker.parentNode===coldArtParent;workerPlacementStale=${developmentDetailCheck};workerParent.insertBefore(worker,workerNext);
              shipyard.textContent=shipyardText.replace('Only Deep Scanners can currently be purchased','Research purchase boundary removed');
              shipyardChanged=shipyard.textContent!==shipyardText;shipyardStale=${developmentDetailCheck};shipyard.textContent=shipyardText;
              shipyard.textContent=shipyardText.replace('durable ownership now adds one Mineral veins row to eligible lifeless non-Earth orbital Survey cards',
                'orbital Survey consumer omitted');
              shipyardSurveyMissing=${developmentDetailCheck};shipyard.textContent=shipyardText;
              shipyard.textContent=shipyardText.replace('A slotted craft paid entirely from exceptional direct materials now receives one deterministic Pureforged modifier',
                'Pureforged outcome omitted');
              shipyardExceptionalMissing=${developmentDetailCheck};shipyard.textContent=shipyardText;
              shipyard.textContent=shipyardText.replace('mining yield, rich-strike chance, or capture-contact points',
                'connected modifier effect set omitted');
              shipyardEffectSetMissing=${developmentDetailCheck};shipyard.textContent=shipyardText;
              shipyard.textContent=shipyardText.replace('bound to the exact recipe, receipt, and item',
                'exact modifier binding omitted');
              shipyardBindingMissing=${developmentDetailCheck};shipyard.textContent=shipyardText;
              shipyard.textContent=shipyardText.replace('mixed stock remains ordinary','mixed-stock boundary omitted');
              shipyardMixedMissing=${developmentDetailCheck};shipyard.textContent=shipyardText;
              shipyard.textContent=shipyardText.replace('Pureforged effects without a connected consumer, authored natural affixes/drawbacks, item upgrades, sockets, and vendors remain unavailable',
                'advanced crafting boundary omitted');
              shipyardAdvancedMissing=${developmentDetailCheck};shipyard.textContent=shipyardText;
              shipyard.textContent=shipyardText.replace('and no reward, cost, Charter tick, or optimistic panel change publishes before',
                'and reward, cost, Charter tick, or optimistic panel change publishes before');
              shipyardPublicationChanged=shipyard.textContent!==shipyardText;shipyardPublicationContradiction=${developmentDetailCheck};shipyard.textContent=shipyardText;
              for(const copy of ['The current Survey card does not yet render those mineral rows.',
                'The current Survey card renders every orbital mineral.',
                'Orbit now also reveals cosmic and exceptional veins, grades, reserves, progress, and Mine.',
                'All six Research rows can currently be purchased.','Mixed stock also receives a Pureforged modifier.',
                'The Pureforged modifier rerolls after reload.',
                'Authored affixes/drawbacks are now available.','Upgrades are now available.','Item upgrades are now available.',
                'Sockets are now available.','Vendors are now available.']){
                shipyard.textContent=shipyardText+' '+copy;shipyardContradictionsChanged=shipyardContradictionsChanged&&shipyard.textContent!==shipyardText;
                shipyardContradictions.push({copy,result:${developmentDetailCheck}});
              }shipyard.textContent=shipyardText;
              hdSurface.textContent=hdSurfaceText.replace('binds each completion to the exact surface generation and planet identity','HD texture identity ownership removed');
              hdSurfaceChanged=hdSurface.textContent!==hdSurfaceText;hdSurfaceStale=${developmentDetailCheck};hdSurface.textContent=hdSurfaceText;
              publishing.textContent=publishingText.replace('DEVELOPMENT PUBLISHING STAYS PARKED','DEVELOPMENT PUBLISHING CONTRACT REMOVED');
              publishingChanged=publishing.textContent!==publishingText;publishingStale=${developmentDetailCheck};publishing.textContent=publishingText;
              publishing.textContent=publishingText+' The preview package now publishes and deploys the v2.0 development site.';
              publishingContradictionChanged=publishing.textContent!==publishingText;publishingContradictory=${developmentDetailCheck};publishing.textContent=publishingText;
              publishing.textContent=publishingText+' The v2.0 preview is live in production.';
              publishingLiveProductionChanged=publishing.textContent!==publishingText;publishingLiveProductionContradictory=${developmentDetailCheck};publishing.textContent=publishingText;
              publishing.textContent=publishingText+' The preview package is published to the development site.';
              publishingPassiveChanged=publishing.textContent!==publishingText;publishingPassiveContradictory=${developmentDetailCheck};publishing.textContent=publishingText;
              for(const copy of ['The preview package is being published to the development site.',
                'The development site was just published.','The development site is now deployed.',
                'The preview package has gone live.']){
                publishing.textContent=publishingText+' '+copy;publishingVariantsChanged=publishingVariantsChanged&&publishing.textContent!==publishingText;
                publishingVariantContradictions.push({copy,result:${developmentDetailCheck}});
              }publishing.textContent=publishingText;
              first.textContent=firstText+' The development site now deploys the v2.0 preview package.';
              publishingCrossRowChanged=first.textContent!==firstText;publishingCrossRowContradictory=${developmentDetailCheck};first.textContent=firstText;
              publishingRestored=${developmentDetailCheck};
              art.textContent=artText+' Thumbnail leases remain pinned after Close, and Planetside renders a 440px portrait for every row.';
              artContradictory=${developmentDetailCheck};art.textContent=artText;
              S.api.state=()=>({...priorState(),rnSeen:'v2-control'});authority=${developmentDetailCheck};
            } catch(cause) { error=String(cause?.message||cause); }
            finally {
              if(headings[0])headings[0].textContent=a;if(headings[1])headings[1].textContent=b;
              if(middle&&parent&&!middle.isConnected)parent.insertBefore(middle,next);if(title)title.textContent=titleText;if(claim)claim.textContent=claimText;
              if(panelBoundary)panelBoundary.textContent=panelBoundaryText;
              if(first)first.textContent=firstText;if(recovery){recovery.textContent=recoveryText;if(recoveryParent&&recovery.parentNode!==recoveryParent)recoveryParent.insertBefore(recovery,recoveryNext);}
              if(worldCode)worldCode.textContent=worldCodeText;if(atlasRoute)atlasRoute.textContent=atlasRouteText;if(capture)capture.textContent=captureText;if(frontierAudio)frontierAudio.textContent=frontierAudioText;if(creatureListen)creatureListen.textContent=creatureListenText;if(biosphereListen)biosphereListen.textContent=biosphereListenText;if(meal)meal.textContent=mealText;if(breed)breed.textContent=breedText;if(rename)rename.textContent=renameText;if(lesson)lesson.textContent=lessonText;if(training)training.textContent=trainingText;
              if(art){art.textContent=artText;if(artParent&&art.parentNode!==artParent)artParent.insertBefore(art,artNext);}
              if(workspace){workspace.textContent=workspaceText;if(workspaceParent&&workspace.parentNode!==workspaceParent)workspaceParent.insertBefore(workspace,workspaceNext);}
              if(coldArt){coldArt.textContent=coldArtText;if(coldArtParent&&coldArt.parentNode!==coldArtParent)coldArtParent.insertBefore(coldArt,coldArtNext);}
              if(worker){worker.textContent=workerText;if(workerParent&&worker.parentNode!==workerParent)workerParent.insertBefore(worker,workerNext);}
              if(shipyard)shipyard.textContent=shipyardText;if(hdSurface)hdSurface.textContent=hdSurfaceText;if(publishing)publishing.textContent=publishingText;S.api.state=priorState;
            }
            const restored=headings[0]?.textContent===a&&headings[1]?.textContent===b&&middle?.isConnected===true
              &&title?.textContent===titleText&&claim?.textContent===claimText&&first?.textContent===firstText
              &&panelBoundary?.textContent===panelBoundaryText&&recovery?.textContent===recoveryText
              &&worldCode?.textContent===worldCodeText&&atlasRoute?.textContent===atlasRouteText&&capture?.textContent===captureText&&frontierAudio?.textContent===frontierAudioText&&creatureListen?.textContent===creatureListenText&&biosphereListen?.textContent===biosphereListenText&&meal?.textContent===mealText&&breed?.textContent===breedText&&rename?.textContent===renameText&&lesson?.textContent===lessonText&&training?.textContent===trainingText&&art?.textContent===artText
              &&art?.parentNode===artParent&&art?.nextSibling===artNext
              &&workspace?.textContent===workspaceText&&workspace?.parentNode===workspaceParent&&workspace?.nextSibling===workspaceNext
              &&coldArt?.textContent===coldArtText&&coldArt?.parentNode===coldArtParent&&coldArt?.nextSibling===coldArtNext
              &&worker?.textContent===workerText&&worker?.parentNode===workerParent&&worker?.nextSibling===workerNext
              &&shipyard?.textContent===shipyardText&&hdSurface?.textContent===hdSurfaceText&&publishing?.textContent===publishingText&&S.api.state===priorState;
            return {ok:!error&&baseline?.ok===true&&order?.ok===false&&inventory?.ok===false&&inventory?.bulletCount===76
              &&identity?.ok===false&&identity?.identity===false
              &&truthfulFeatureClaims.length===10
              &&truthfulFeatureClaims.every((row)=>row.result?.ok===true&&row.result?.honest===true&&row.result?.overclaim===false)
              &&unavailableFeatureClaims.length===14
              &&unavailableFeatureClaims.every((row)=>row.result?.ok===false&&row.result?.honest===false&&row.result?.overclaim===true)
              &&closeContract?.ok===false&&panelBoundaryContract?.ok===false&&emptySkyContract?.ok===false
              &&firstContract?.ok===false&&recoveryContract?.ok===false&&placementContract?.ok===false&&placementContract?.charterPlacement===false
              &&worldCodeStale?.ok===false&&worldCodeStale?.worldCodeContract===false
              &&atlasRouteStale?.ok===false&&atlasRouteStale?.atlasRouteContract===false
              &&captureLimitControls.length===11
              &&captureLimitControls.every((row)=>row.changed&&row.result?.ok===false
                &&row.result?.captureContract===false&&row.result?.captureContradiction===false
                &&row.result?.captureBioscanContradiction===false&&row.result?.discoverLifeAvailabilityContradiction===false
                &&row.result?.honest===true&&row.result?.shipyardContract===true&&row.result?.trainingContract===true)
              &&captureContradictions.length===5
              &&captureContradictions.every((row)=>row.result?.ok===false&&row.result?.captureContract===false
                &&row.result?.captureContradiction===true&&row.result?.captureBioscanContradiction===false
                &&row.result?.discoverLifeAvailabilityContradiction===false&&row.result?.honest===false)
              &&bioscanContradictions.length===6
              &&bioscanContradictions.every((row)=>row.result?.ok===false&&row.result?.captureContract===false
                &&row.result?.captureContradiction===true&&row.result?.captureBioscanContradiction===true
                &&row.result?.discoverLifeAvailabilityContradiction===false&&row.result?.honest===false)
              &&discoverLifeAvailabilityChanged&&discoverLifeAvailabilityContradictory?.ok===false
                &&discoverLifeAvailabilityContradictory?.captureContract===false
                &&discoverLifeAvailabilityContradictory?.captureContradiction===false
                &&discoverLifeAvailabilityContradictory?.captureBioscanContradiction===false
               &&discoverLifeAvailabilityContradictory?.discoverLifeAvailabilityContradiction===true
               &&discoverLifeAvailabilityContradictory?.honest===false&&discoverLifeAvailabilityContradictory?.overclaim===true
              &&audioMissingControls.length===7
              &&audioMissingControls.every((row)=>row.changed&&row.result?.ok===false
                &&row.result?.audioContract===false&&row.result?.audioContradiction===false&&row.result?.honest===true)
              &&audioContradictions.length===5
              &&audioContradictions.every((row)=>row.result?.ok===false&&row.result?.audioContract===false
                &&row.result?.audioContradiction===true&&row.result?.honest===false&&row.result?.overclaim===true)
             &&mealMissingChanged&&mealMissing?.ok===false&&mealMissing?.mealContract===false
                &&mealMissing?.mealContradiction===false&&mealMissing?.honest===true
              &&mealContradictions.length===6
              &&mealContradictions.every((row)=>row.result?.ok===false&&row.result?.mealContract===false
                &&row.result?.mealContradiction===true&&row.result?.honest===false&&row.result?.overclaim===true)
             &&breedMissingChanged&&breedMissing?.ok===false&&breedMissing?.breedContract===false
               &&breedMissing?.breedContradiction===false&&breedMissing?.honest===true
              &&breedCharterMissingChanged&&breedCharterMissing?.ok===false&&breedCharterMissing?.breedContract===false
                &&breedCharterMissing?.breedContradiction===false&&breedCharterMissing?.honest===true
              &&breedContradictions.length===6
              &&breedContradictions.every((row)=>row.result?.ok===false&&row.result?.breedContract===false
                &&row.result?.breedContradiction===true&&row.result?.honest===false&&row.result?.overclaim===true)
              &&renameMissingChanged&&renameMissing?.ok===false&&renameMissing?.renameContract===false
                &&renameMissing?.renameContradiction===false&&renameMissing?.honest===true
              &&renameContradictions.length===5
              &&renameContradictions.every((row)=>row.result?.ok===false&&row.result?.renameContract===false
                &&row.result?.renameContradiction===true&&row.result?.honest===false&&row.result?.overclaim===true)
              &&lessonStaleChanged&&lessonStale?.ok===false&&lessonStale?.lessonContract===false&&lessonStale?.lessonContradiction===false
              &&lessonContradictionChanged&&lessonContradictory?.ok===false&&lessonContradictory?.lessonContract===false
                &&lessonContradictory?.lessonContradiction===true&&lessonContradictory?.honest===false
              &&trainingStale?.ok===false&&trainingStale?.trainingContract===false
              &&trainingContradictory?.ok===false&&trainingContradictory?.honest===false&&trainingContradictory?.trainingContradiction===true
              &&trainingLegacyStale?.ok===false&&trainingLegacyStale?.trainingContract===false
              &&trainingRecoveryStale?.ok===false&&trainingRecoveryStale?.trainingContract===false
              &&trainingLegacyContradictory?.ok===false&&trainingLegacyContradictory?.honest===false&&trainingLegacyContradictory?.trainingContradiction===true
              &&trainingRecoveryContradictory?.ok===false&&trainingRecoveryContradictory?.honest===false&&trainingRecoveryContradictory?.trainingContradiction===true
              &&artStale?.ok===false&&artStale?.artContract===false
              &&artPublishChanged&&artPublishStale?.ok===false&&artPublishStale?.artContract===false
              &&artDownsampleChanged&&artDownsampleStale?.ok===false&&artDownsampleStale?.artContract===false
              &&artPlacementMoved&&artPlacementStale?.ok===false&&artPlacementStale?.artContract===false
              &&workspaceChanged&&workspaceStale?.ok===false&&workspaceStale?.workspaceContract===false
              &&workspacePlacementMoved&&workspacePlacementStale?.ok===false&&workspacePlacementStale?.workspaceContract===false
              &&coldArtChanged&&coldArtStale?.ok===false&&coldArtStale?.coldArtContract===false
              &&coldArtPlacementMoved&&coldArtPlacementStale?.ok===false&&coldArtPlacementStale?.coldArtContract===false
              &&workerChanged&&workerStale?.ok===false&&workerStale?.workerContract===false
              &&workerReleaseChanged&&workerReleaseStale?.ok===false&&workerReleaseStale?.workerContract===false
              &&workerPlacementMoved&&workerPlacementStale?.ok===false&&workerPlacementStale?.workerContract===false
              &&shipyardChanged&&shipyardStale?.ok===false&&shipyardStale?.shipyardContract===false
              &&shipyardSurveyMissing?.ok===false&&shipyardSurveyMissing?.shipyardContract===false
              &&shipyardSurveyMissing?.honest===true&&shipyardSurveyMissing?.shipyardContradiction===false
              &&shipyardExceptionalMissing?.ok===false&&shipyardExceptionalMissing?.shipyardContract===false
              &&shipyardExceptionalMissing?.honest===true&&shipyardExceptionalMissing?.shipyardContradiction===false
              &&shipyardEffectSetMissing?.ok===false&&shipyardEffectSetMissing?.shipyardContract===false
              &&shipyardEffectSetMissing?.honest===true&&shipyardEffectSetMissing?.shipyardContradiction===false
              &&shipyardBindingMissing?.ok===false&&shipyardBindingMissing?.shipyardContract===false
              &&shipyardBindingMissing?.honest===true&&shipyardBindingMissing?.shipyardContradiction===false
              &&shipyardMixedMissing?.ok===false&&shipyardMixedMissing?.shipyardContract===false
              &&shipyardMixedMissing?.honest===true&&shipyardMixedMissing?.shipyardContradiction===false
              &&shipyardAdvancedMissing?.ok===false&&shipyardAdvancedMissing?.shipyardContract===false
              &&shipyardAdvancedMissing?.honest===true&&shipyardAdvancedMissing?.shipyardContradiction===false
              &&shipyardPublicationChanged&&shipyardPublicationContradiction?.ok===false
              &&shipyardPublicationContradiction?.shipyardContract===false
              &&shipyardPublicationContradiction?.honest===false
              &&shipyardPublicationContradiction?.shipyardContradiction===true
              &&shipyardContradictionsChanged&&shipyardContradictions.length===11
              &&shipyardContradictions.every((row)=>row.result?.ok===false&&row.result?.shipyardContract===false
                &&row.result?.honest===false&&row.result?.shipyardContradiction===true)
              &&hdSurfaceChanged&&hdSurfaceStale?.ok===false&&hdSurfaceStale?.hdSurfaceContract===false
              &&publishingChanged&&publishingStale?.ok===false&&publishingStale?.publishingContract===false
                &&publishingStale?.publishingContradiction===false
              &&publishingContradictionChanged&&publishingContradictory?.ok===false
                &&publishingContradictory?.publishingContract===false
                &&publishingContradictory?.publishingContradiction===true&&publishingContradictory?.honest===false
              &&publishingLiveProductionChanged&&publishingLiveProductionContradictory?.ok===false
                &&publishingLiveProductionContradictory?.publishingContract===false
                &&publishingLiveProductionContradictory?.publishingContradiction===true
                &&publishingLiveProductionContradictory?.honest===false
              &&publishingPassiveChanged&&publishingPassiveContradictory?.ok===false
                &&publishingPassiveContradictory?.publishingContract===false
                &&publishingPassiveContradictory?.publishingContradiction===true
                &&publishingPassiveContradictory?.honest===false
              &&publishingVariantsChanged&&publishingVariantContradictions.length===4
              &&publishingVariantContradictions.every((row)=>row.result?.ok===false
                &&row.result?.publishingContract===false
                &&row.result?.publishingContradiction===true&&row.result?.honest===false)
              &&publishingCrossRowChanged&&publishingCrossRowContradictory?.ok===false
                &&publishingCrossRowContradictory?.publishingContract===false
                &&publishingCrossRowContradictory?.publishingContradiction===true
                &&publishingCrossRowContradictory?.honest===false
              &&publishingRestored?.ok===true&&publishingRestored?.publishingContract===true
                &&publishingRestored?.publishingContradiction===false&&publishingRestored?.honest===true
              &&artContradictory?.ok===false&&artContradictory?.honest===false&&artContradictory?.artContract===false&&artContradictory?.artContradiction===true
              &&authority?.ok===false&&authority?.rnSeen==='v2-control'&&restored,
              baseline,order,inventory,identity,truthfulFeatureClaims,unavailableFeatureClaims,closeContract,panelBoundaryContract,emptySkyContract,firstContract,recoveryContract,placementContract,worldCodeStale,atlasRouteStale,captureLimitControls,captureContradictions,bioscanContradictions,discoverLifeAvailabilityChanged,discoverLifeAvailabilityContradictory,audioMissingControls,audioContradictions,mealMissingChanged,mealMissing,mealContradictions,breedMissingChanged,breedMissing,breedCharterMissingChanged,breedCharterMissing,breedContradictions,renameMissingChanged,renameMissing,renameContradictions,lessonStaleChanged,lessonStale,lessonContradictionChanged,lessonContradictory,trainingStale,trainingLegacyStale,trainingRecoveryStale,trainingContradictory,trainingLegacyContradictory,trainingRecoveryContradictory,
              artStale,artPublishChanged,artPublishStale,artDownsampleChanged,artDownsampleStale,artPlacementMoved,artPlacementStale,
              workspaceChanged,workspaceStale,workspacePlacementMoved,workspacePlacementStale,coldArtChanged,coldArtStale,coldArtPlacementMoved,coldArtPlacementStale,
              workerChanged,workerStale,workerReleaseChanged,workerReleaseStale,workerPlacementMoved,workerPlacementStale,
              shipyardChanged,shipyardStale,shipyardSurveyMissing,shipyardExceptionalMissing,shipyardEffectSetMissing,shipyardBindingMissing,shipyardMixedMissing,shipyardAdvancedMissing,shipyardPublicationChanged,shipyardPublicationContradiction,shipyardContradictionsChanged,shipyardContradictions,hdSurfaceChanged,hdSurfaceStale,publishingChanged,publishingStale,publishingContradictionChanged,publishingContradictory,publishingLiveProductionChanged,publishingLiveProductionContradictory,publishingPassiveChanged,publishingPassiveContradictory,publishingVariantsChanged,publishingVariantContradictions,publishingCrossRowChanged,publishingCrossRowContradictory,publishingRestored,artContradictory,authority,restored,error};})()`);
          if (!detailControls.ok) {
            recordInstrumentFailure(`${vp.label}: development-release reorder/inventory/authority controls did not fail closed (${JSON.stringify(detailControls)})`);
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
          const releasePrior = await evalIn(`(()=>{ const panel=document.getElementById('guidepanel');
            if(!panel)return {ok:false,why:'missing panel'};const style=panel.style,r=panel.getBoundingClientRect(),prior={left:panel.scrollLeft,top:panel.scrollTop,
              behavior:{value:style.getPropertyValue('scroll-behavior'),priority:style.getPropertyPriority('scroll-behavior')}};
            style.setProperty('scroll-behavior','auto','important');panel.scrollLeft=0;panel.scrollTop=0;void panel.offsetHeight;
            return {ok:true,prior,point:{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2}};})()`);
          if (!releasePrior?.ok) {
            stopInstrumentControl(`${vp.label}: Guide release-tail scroll setup failed (${JSON.stringify(releasePrior)})`);
          }
          const wheelGuideToLiveMax = async () => {
            let state = null;
            for (let i = 0; i < 12; i++) {
              state = await evalIn(`(()=>{const panel=document.getElementById('guidepanel');if(!panel)return {ok:false,why:'missing'};
                const max=Math.max(0,panel.scrollHeight-panel.clientHeight),current=panel.scrollTop;
                return {ok:true,current,max,atEnd:max>0&&current>=max-2};})()`);
              if (!state?.ok || state.atEnd) break;
              await send('Input.dispatchMouseEvent', { type: 'mouseWheel',
                x: releasePrior.point.x, y: releasePrior.point.y, deltaX: 0,
                deltaY: Math.max(200, Math.min(10000, state.max - state.current + 64)) }, session);
              await sleep(40);
            }
            return evalIn(`(()=>{const panel=document.getElementById('guidepanel');if(!panel)return {ok:false,why:'missing'};
              const max=Math.max(0,panel.scrollHeight-panel.clientHeight),current=panel.scrollTop;
              return {ok:true,current,max,atEnd:max>0&&current>=max-2};})()`);
          };
          let releaseTailScroll = null, releaseTailOutcome = null, releaseRestoration = null;
          try {
            releaseTailScroll = await wheelGuideToLiveMax();
            releaseTailOutcome = await evalIn(releaseTailCheck);
          } finally {
            releaseRestoration = await evalIn(`(()=>{const panel=document.getElementById('guidepanel'),prior=${JSON.stringify(releasePrior.prior)};
              if(!panel)return {ok:false,why:'missing'};const style=panel.style;style.setProperty('scroll-behavior','auto','important');
              panel.scrollLeft=prior.left;panel.scrollTop=prior.top;void panel.offsetHeight;
              if(prior.behavior.value)style.setProperty('scroll-behavior',prior.behavior.value,prior.behavior.priority);else style.removeProperty('scroll-behavior');
              const actual={left:panel.scrollLeft,top:panel.scrollTop,behavior:{value:style.getPropertyValue('scroll-behavior'),priority:style.getPropertyPriority('scroll-behavior')}};
              return {ok:actual.left===prior.left&&actual.top===prior.top&&actual.behavior.value===prior.behavior.value&&actual.behavior.priority===prior.behavior.priority,prior,actual};})()`);
          }
          if (!releaseRestoration?.ok) {
            stopInstrumentControl(`${vp.label}: Guide release-tail observation did not restore exact scroll/style state (${JSON.stringify(releaseRestoration)})`);
          }
          const releaseTailRecordedOutcome = {
            ...releaseTailOutcome, wheel: releaseTailScroll, restoration: releaseRestoration,
          };
          const releaseTailExpected = 'real user scrolling reaches the final v2.0 development note inside the visible Guide viewport';
          addOutcome(vp.label, 'release-detail', 'GUIDE_DEVELOPMENT_RELEASE_TAIL_REACH',
            '#guidepanel .guide-topic li:last-child', releaseTailRecordedOutcome,
            releaseTailExpected);
          stopAfterRecordedProductOutcome(vp.label, 'release-detail',
            'GUIDE_DEVELOPMENT_RELEASE_TAIL_REACH', '#guidepanel .guide-topic li:last-child',
            releaseTailRecordedOutcome, releaseTailExpected);
          if (vp.label === 'primary-phone') {
            const hiddenPrior = await evalIn(`(()=>{const panel=document.getElementById('guidepanel'),style=panel?.style;
              if(!panel)return {ok:false,why:'missing'};const prior={left:panel.scrollLeft,top:panel.scrollTop,
                overflow:{value:style.getPropertyValue('overflow-y'),priority:style.getPropertyPriority('overflow-y')},
                behavior:{value:style.getPropertyValue('scroll-behavior'),priority:style.getPropertyPriority('scroll-behavior')}};
              style.setProperty('overflow-y','hidden','important');style.setProperty('scroll-behavior','auto','important');
              panel.scrollLeft=0;panel.scrollTop=0;void panel.offsetHeight;return {ok:true,prior};})()`);
            if (!hiddenPrior?.ok) {
              stopInstrumentControl(`${vp.label}: hidden-overflow release-tail setup failed (${JSON.stringify(hiddenPrior)})`);
            }
            let hiddenTailScroll = null, hiddenTailControl = null;
            let hiddenRestoration = null, hiddenControlError = null;
            try {
              hiddenTailScroll = await wheelGuideToLiveMax();
              hiddenTailControl = await evalIn(releaseTailCheck);
            } catch (cause) {
              hiddenControlError = String(cause?.message || cause);
            } finally {
              hiddenRestoration = await evalIn(`(()=>{const panel=document.getElementById('guidepanel'),prior=${JSON.stringify(hiddenPrior.prior)};
                if(!panel)return {ok:false,why:'missing'};const style=panel.style;style.setProperty('scroll-behavior','auto','important');
                panel.scrollLeft=prior.left;panel.scrollTop=prior.top;void panel.offsetHeight;
                if(prior.overflow.value)style.setProperty('overflow-y',prior.overflow.value,prior.overflow.priority);else style.removeProperty('overflow-y');
                if(prior.behavior.value)style.setProperty('scroll-behavior',prior.behavior.value,prior.behavior.priority);else style.removeProperty('scroll-behavior');
                const actual={left:panel.scrollLeft,top:panel.scrollTop,
                  overflow:{value:style.getPropertyValue('overflow-y'),priority:style.getPropertyPriority('overflow-y')},
                  behavior:{value:style.getPropertyValue('scroll-behavior'),priority:style.getPropertyPriority('scroll-behavior')}};
                return {ok:actual.left===prior.left&&actual.top===prior.top
                  &&actual.overflow.value===prior.overflow.value&&actual.overflow.priority===prior.overflow.priority
                  &&actual.behavior.value===prior.behavior.value&&actual.behavior.priority===prior.behavior.priority,prior,actual};})()`);
            }
            if (hiddenControlError !== null || hiddenTailControl?.ok !== false
              || hiddenTailControl?.overflowY !== 'hidden' || hiddenTailControl?.scrollTop !== 0
              || hiddenTailScroll?.current !== 0 || !hiddenRestoration?.ok) {
              recordInstrumentFailure(`${vp.label}: hidden-overflow release-tail injection stayed user-reachable, errored, or did not restore exactly (${JSON.stringify({ hiddenTailControl, hiddenTailScroll, hiddenRestoration, hiddenControlError })})`);
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
              recordInstrumentFailure(`${vp.label}: injected left-anchored Settings did not turn the bottom-right anchor outcome red (${JSON.stringify(leftSettingsControl)})`);
            }
            recordControls('viewport-fit');
          }
        }
        add(vp.label, 'settings', await audit({
          ...common, surface: 'settings', root: '#setpanel', textMin: 80,
          required: [{ selector: '[data-pnx]', min: 1 }, { selector: '.row', min: 6 }, { selector: 'input[type=range]', min: 2 }],
          interactiveRoots: ['#setpanel'], contrastSelectors: ['#setpanel'],
          focusSelectors: ['#setsnd', '#setvoice', ...(vp.label === 'primary-phone' || vp.label === 'desktop'
            ? ['#setpanel [data-pnx]', '#setvol', '#setglass', '#setimport'] : [])],
          overlapPairs: [['#setpanel', '#dock']],
        }));
        if (vp.label === 'laptop-720p') {
          const settingsCloseClearance = await evalIn(SETTINGS_CLOSE_CLEARANCE_EXPRESSION);
          addOutcome(vp.label, 'settings-close-clearance', 'SETTINGS_CLOSE_GUTTER_CLEARANCE', '#setsnd, #setpanel [data-pnx]',
            settingsCloseClearance,
            'the short-laptop Sound control remains horizontally outside the sticky Close target even when their vertical centres align');
          if (!settingsCloseClearanceControlRun) {
            settingsCloseClearanceControlRun = true;
            const settingsCloseClearanceControl = await evalIn(`(()=>{const panel=document.getElementById('setpanel'),
              close=panel?.querySelector(':scope > [data-pnx="set"]')??null,heading=panel?.querySelector(':scope > h3')??null;
              if(!panel||!close||!heading)return {ok:false,why:'Settings clearance control targets missing'};
              const prior={panel:panel.getAttribute('style'),close:close.getAttribute('style'),heading:heading.getAttribute('style'),
                left:panel.scrollLeft,top:panel.scrollTop};let injected=null,error=null;
              try{panel.style.setProperty('padding-right','14px','important');close.style.setProperty('transform','none','important');
                heading.style.setProperty('clear','none','important');injected=${SETTINGS_CLOSE_CLEARANCE_EXPRESSION};}
              catch(cause){error=String(cause?.message||cause);}
              finally{if(prior.panel===null)panel.removeAttribute('style');else panel.setAttribute('style',prior.panel);
                if(prior.close===null)close.removeAttribute('style');else close.setAttribute('style',prior.close);
                if(prior.heading===null)heading.removeAttribute('style');else heading.setAttribute('style',prior.heading);
                panel.scrollLeft=prior.left;panel.scrollTop=prior.top;}
              const after={panel:panel.getAttribute('style'),close:close.getAttribute('style'),heading:heading.getAttribute('style'),
                left:panel.scrollLeft,top:panel.scrollTop},restored=${SETTINGS_CLOSE_CLEARANCE_EXPRESSION};
              return {ok:error===null&&injected?.ok===false&&injected?.overlap===true
                &&injected?.hit==='[data-pnx="set"]'&&restored?.ok===true
                &&(${sameInlineStyleAttribute.toString()})(prior.panel,after.panel)
                &&(${sameInlineStyleAttribute.toString()})(prior.close,after.close)
                &&(${sameInlineStyleAttribute.toString()})(prior.heading,after.heading)
                &&prior.left===after.left&&prior.top===after.top,
                prior,after,injected,restored,error};})()`);
            if (!settingsCloseClearanceControl?.ok) {
              recordInstrumentFailure(`${vp.label}: removed Settings Close gutter did not recreate overlap and restore exactly (${JSON.stringify(settingsCloseClearanceControl)})`);
            }
            recordControls('settings-close-gutter-clearance');
          }
        }
        const settingsWidthCheck = `(()=>{ const panel=document.getElementById('setpanel');
          return panel?{ok:panel.scrollWidth<=panel.clientWidth+1,scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth}: {ok:false,why:'missing'}; })()`;
        addOutcome(vp.label, 'settings', 'SETTINGS_HORIZONTAL_OVERFLOW', '#setpanel', await evalIn(settingsWidthCheck),
          'all Settings rows fit the panel width without horizontal scrolling');
        if (!settingsWidthControlRun) {
          settingsWidthControlRun = true;
          const settingsWidthControl = await evalIn(`(()=>{ const panel=document.getElementById('setpanel'),wide=document.createElement('div');
            wide.style.width='2000px';wide.textContent='overflow control';panel.appendChild(wide);const result=${settingsWidthCheck};wide.remove();return result;})()`);
          if (settingsWidthControl.ok) recordInstrumentFailure(`${vp.label}: Settings horizontal-overflow injection stayed green (${JSON.stringify(settingsWidthControl)})`);
          recordControls('settings-horizontal-overflow');
        }
        const recordSettingsAudioPhase = async (surface, expected, activation = null) => {
          const evidence = await evalIn(SETTINGS_AUDIO_EVIDENCE_EXPRESSION);
          evidence.activation = activation;
          const outcome = settingsAudioToggleOutcome(evidence, expected);
          if (!outcome.instrumentOk) {
            throw new Error(`${vp.label}/${surface}: Settings audio evidence was malformed, unsettled, or not restored (${JSON.stringify({
              evidenceChecks: outcome.evidenceChecks,
              evidenceDetails: outcome.evidenceDetails,
            })})`);
          }
          addOutcome(vp.label, surface, 'SETTINGS_CREATURE_VOICE_CONTROL', '#setsnd, #setvoice',
            { ...outcome, ok: outcome.uiOk },
            'native Sound and Creature voices buttons expose exact names, roles, pressed/text/class state, retained focus, centre hit, and 44px geometry');
          addOutcome(vp.label, surface, 'SETTINGS_AUDIO_NON_REPLAY', 'audio diagnostics',
            { ...outcome, ok: outcome.audioOk },
            'Settings changes alone create no context, claim, counterpart, voice, node, creature emitter, or reservation and replay nothing');
        };
        const requireSettingsActivation = async (surface, selector, label) => {
          const activation = await activateRealSettingsControl(selector, label);
          if (!activation.instrumentOk) {
            throw new Error(`${vp.label}/${surface}: ${label} activation evidence was malformed, unsettled, untrusted, or not restored (${JSON.stringify(activation)})`);
          }
          if (!activation.productOk) {
            settingsAudioProductBlockedViewports.add(vp.label);
            throw new ProductAnswerabilityFinding(
              `${vp.label}: ${label} did not receive one settled coordinate-bound trusted activation`,
              activation,
              { code: 'SETTINGS_AUDIO_NATIVE_ACTIVATION', surface, element: selector,
                expected: 'independently revealed 44px native button owns the trusted touch/mouse receipt and restores every moved scroll owner' },
            );
          }
          return activation;
        };
        const waitForSettingsPostActivation = async (surface, label, expected, activation) => {
          const until = Date.now() + 2000;
          let observed = null, outcome = null;
          while (Date.now() < until) {
            observed = await evalIn(`(()=>{const state=window.__CF_SLICE__?.api?.state?.();return {
              sndOn:state?.sndOn,voiceOn:state?.voiceOn,focus:document.activeElement?.id||null};})()`);
            outcome = settingsPostActivationStateOutcome(observed, expected);
            if (outcome.ok) return outcome;
            await sleep(50);
          }
          settingsAudioProductBlockedViewports.add(vp.label);
          throw new ProductAnswerabilityFinding(
            `${vp.label}: trusted ${label} receipt did not produce the exact Settings state and focus within 2000ms`,
            { activation, outcome, observed },
            { code: 'SETTINGS_AUDIO_POST_ACTIVATION_STATE', surface, element: '#setsnd, #setvoice',
              expected: 'a coordinate-bound trusted receipt produces the exact Sound/Creature voices state and logical focus' },
          );
        };
        await evalIn(`document.getElementById('setvoice')?.focus()`);
        await waitFor('Settings audio baseline', `(()=>{const s=window.__CF_SLICE__.api.state();return s.sndOn===false&&s.voiceOn===false&&document.activeElement?.id==='setvoice'})()`);
        await recordSettingsAudioPhase('settings-audio-off', {
          soundOn: false, voiceOn: false, focus: 'setvoice',
        });
        settingsAudioBaselineViewports.add(vp.label);
        const soundOnActivation = await requireSettingsActivation(
          'settings-sound-on-voices-off', '#setsnd', 'Sound on control');
        await waitForSettingsPostActivation('settings-sound-on-voices-off', 'Sound on', {
          soundOn: true, voiceOn: false, focus: 'setsnd',
        }, soundOnActivation);
        await recordSettingsAudioPhase('settings-sound-on-voices-off', {
          soundOn: true, voiceOn: false, focus: 'setsnd',
        }, soundOnActivation);
        const voiceOnActivation = await requireSettingsActivation(
          'settings-sound-and-voices-on', '#setvoice', 'Creature voices on control');
        await waitForSettingsPostActivation('settings-sound-and-voices-on', 'Creature voices on', {
          soundOn: true, voiceOn: true, focus: 'setvoice',
        }, voiceOnActivation);
        await recordSettingsAudioPhase('settings-sound-and-voices-on', {
          soundOn: true, voiceOn: true, focus: 'setvoice',
        }, voiceOnActivation);
        const voiceOffActivation = await requireSettingsActivation(
          'settings-voices-off-restored', '#setvoice', 'Creature voices off control');
        await waitForSettingsPostActivation('settings-voices-off-restored', 'Creature voices off', {
          soundOn: true, voiceOn: false, focus: 'setvoice',
        }, voiceOffActivation);
        await recordSettingsAudioPhase('settings-voices-off-restored', {
          soundOn: true, voiceOn: false, focus: 'setvoice',
        }, voiceOffActivation);
        const soundOffActivation = await requireSettingsActivation(
          'settings-audio-off-restored', '#setsnd', 'Sound off control');
        await waitForSettingsPostActivation('settings-audio-off-restored', 'Sound off', {
          soundOn: false, voiceOn: false, focus: 'setsnd',
        }, soundOffActivation);
        await recordSettingsAudioPhase('settings-audio-off-restored', {
          soundOn: false, voiceOn: false, focus: 'setsnd',
        }, soundOffActivation);
        settingsAudioCompletedViewports.add(vp.label);
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
            recordGlassProductFinding(findings, vp.label, 'settings-text-xl',
              { code: 'TEXT_SIZE_PREF_INERT', surface: 'settings-text-xl', element: '#setpanel', actual: { before: displayBefore.fontSize, after: displayAfter.fontSize }, expected: 'A++ increases panel copy to at least 16px' }, causalControlsArmed);
          }
          if (displayAfter.color === displayBefore.color) {
            recordGlassProductFinding(findings, vp.label, 'settings-text-xl',
              { code: 'TEXT_TONE_PREF_INERT', surface: 'settings-text-xl', element: '#setpanel .row label', actual: { before: displayBefore.color, after: displayAfter.color }, expected: 'Max tone changes rendered secondary copy' }, causalControlsArmed);
          }
          if (!/mono/i.test(displayAfter.font)) {
            recordGlassProductFinding(findings, vp.label, 'settings-text-xl',
              { code: 'FONT_PREF_INERT', surface: 'settings-text-xl', element: '#setpanel', actual: displayAfter.font, expected: 'computed monospace family' }, causalControlsArmed);
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
          if (modalControl.ok) recordInstrumentFailure(`${vp.label}: unlocked background-focus modal injection stayed green (${JSON.stringify(modalControl)})`);
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
          if (liveControl.ok) recordInstrumentFailure(`${vp.label}: plain-div import-error injection stayed green (${JSON.stringify(liveControl)})`);
          recordControls('modal-live-error');
        }
        const importClose = await evalIn(`(()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); return {display:getComputedStyle(document.getElementById('importsheet')).display,focus:document.activeElement?.id||null}; })()`);
        if (importClose.display !== 'none' || importClose.focus !== 'docksets') {
          recordGlassProductFinding(findings, vp.label, 'import',
            { code: 'MODAL_ESCAPE_RESTORE', surface: 'import', element: '#importsheet', actual: importClose, expected: { display: 'none', focus: 'docksets' } }, causalControlsArmed);
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
        if (modalRestoreControl.ok) recordInstrumentFailure(`${vp.label}: exact modal-state restoration corruption stayed green (${JSON.stringify(modalRestoreControl)})`);
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
          if (zoomState.width !== zoomWidth || zoomState.height !== zoomHeight) recordInstrumentFailure(`${vp.label}: browser-zoom viewport did not reflow (${JSON.stringify(zoomState)})`);
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
            recordGlassProductFinding(findings, vp.label, 'reduced-motion',
              { code: 'REDUCED_MOTION_SCENE_DRIFT', surface: 'reduced-motion', element: 'Pixi world', actual: { changed: changes.length, examples: changes.slice(0, 8) }, expected: 'stable visible scene transforms across 350ms' }, causalControlsArmed);
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
          if (!fullChanges.length) recordInstrumentFailure(`${vp.label}: full-motion scene did not move, so the reduced-motion pass is vacuous`);

          /* A live DPR transition catches the once-only DPR constant. A
             responsive canvas must update backing density as well as CSS,
             without discarding the player's selected body/action. */
          await evalIn(`window.__CF_SLICE__.api.surveyOn({seed:133,ordinal:2})`);
          const densityCardBefore = await evalIn(`(()=>{ const s=window.__CF_SLICE__.api.state(),card=document.getElementById('survey'),action=card?.querySelector('[data-act="landcta"]'),r=action?.getBoundingClientRect();
            const hit=r?document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2):null;
            return {ok:s.mode==='system'&&s.cardOpen&&!!s.cardTitle&&!!action&&r.width>=44&&r.height>=44&&(hit===action||action?.contains(hit)),
              mode:s.mode,title:s.cardTitle,action:action?.textContent||null,width:r?.width||0,height:r?.height||0,hit:hit?.tagName||null}; })()`);
          if (!densityCardBefore.ok) recordGlassProductFinding(findings, vp.label, 'dpr-card-preservation', {
            code: 'DPR_CARD_SETUP_UNREACHABLE', surface: 'dpr-card-preservation', element: '#survey [data-act="landcta"]',
            actual: densityCardBefore, expected: 'an open, centre-hittable 44px planet action before the live DPR transition',
          }, causalControlsArmed);
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
          if (Math.abs(liveDpr - 1) > 0.01) recordInstrumentFailure(`${vp.label}: live DPR override did not reach the document (${liveDpr})`);
          add(vp.label, 'dpr-change', await audit({
            ...common, surface: 'dpr-change', root: '#dock', textMin: 1,
            viewportExpected: { width: dprWidth, height: vp.height, dpr: 1 },
            interactiveRoots: ['#dock'], contrastSelectors: [], canvas: true,
            expectedDpr: dprPlan.dpr,
            maxBackingPixels: dprPlan.backingPixelCapPerCanvas,
          }));
          const densityCardAfter = await evalIn(densityCardCheck);
          if (!densityCardAfter.ok) recordGlassProductFinding(findings, vp.label, 'dpr-card-preservation', {
            code: 'DPR_SURVEY_STATE_LOST', surface: 'dpr-card-preservation', element: '#survey [data-act="landcta"]',
            actual: densityCardAfter, expected: 'same selected body, title, open survey and reachable Land action after density-only rebuild',
          }, causalControlsArmed);
          const densityCardControl = await evalIn(`(()=>{ const card=document.getElementById('survey'),html=card.innerHTML;
            card.querySelector('[data-act="landcta"]')?.remove(); const result=${densityCardCheck}; card.innerHTML=html; return result; })()`);
          if (densityCardControl.ok) recordInstrumentFailure(`${vp.label}: removing the preserved DPR card action stayed green`);
          recordControls('dpr-card-preservation');
        }
      } catch (error) {
        if (error instanceof GlassInstrumentControlStop) {
          throw error;
        } else if (error instanceof ProductAnswerabilityFinding) {
          const findingCode = error.finding?.code || 'REPLACEMENT_UNANSWERABLE_AFTER_READY';
          if (viewportLabel) targetedProductFailure = true;
          causalProductStop ||= { viewport: vp.label, findingCode };
          for (const plannedViewport of MATRIX_VIEWPORTS) {
            if (!settingsAudioCompletedViewports.has(plannedViewport.label)) {
              settingsAudioProductBlockedViewports.add(plannedViewport.label);
            }
          }
          const findingSurface = error.finding?.surface || 'replacement-ready-answerability';
          if (!error.finding?.alreadyRecorded) {
            recordGlassProductFinding(findings, vp.label, findingSurface, {
              code: findingCode,
              surface: findingSurface, element: error.finding?.element || 'replacement target main thread',
              actual: { message: error.message, evidence: error.evidence },
              expected: error.finding?.expected || 'two exact-context confirmations each answer within 2000ms with a concurrent responsive browser-process heartbeat and a newer ticker turn on cycle 2',
            }, false);
          }
          /* A full run stops on its first product red, so every not-yet-run
             control is explicitly product-blocked by that causal boundary.
             A targeted diagnostic retains its narrower per-viewport suffix
             accounting because global inventory is not required there. */
          const blockedRows = productBlockedRowsForCausalStop(
            viewportLabel, vp.label, findingCode, executedControls,
          );
          for (const row of blockedRows) {
            productBlockedControls.set(row.name, row);
          }
        } else {
          stopInstrumentControl(`${vp.label}: ${error.message}`);
        }
      } finally {
        const cleanupFailures = [];
        if (targetId && browser) {
          try { await browser.send('Target.closeTarget', { targetId }); } catch { /* disposal below is authoritative */ }
        }
        if (browserContextId && browser) {
          try { await browser.send('Target.disposeBrowserContext', { browserContextId }); }
          catch (error) {
            if (!causalInstrumentState.error) {
              cleanupFailures.push(`${vp.label}: browser context cleanup failed (${error.message})`);
            }
          }
        }
        if (browser) {
          try { await browser.close(); }
          catch (error) {
            if (!causalInstrumentState.error) {
              cleanupFailures.push(`${vp.label}: owned browser cleanup failed (${error.message})`);
            }
          }
        }
        runViewportTimings.push({ label: vp.label, durationMs: Date.now() - viewportStartedAt });
        if (cleanupFailures.length) recordInstrumentFailure(cleanupFailures[0]);
      }
      if (shouldStopGlassViewportLoop(causalProductStop)) break;
    }
    if (portraitViewportCount > 0 && !causalProductStop && !targetedProductFailure) {
      const portraitCampaign = portraitControlCampaignOutcome({
        planned: portraitViewportCount,
        observed: portraitBaselineCount,
        eligible: portraitEligibleBaselineCount,
        bandRuns: portraitBandControlCount,
        fallbackRuns: portraitFallbackControlCount,
        requireEligibleCampaign: !viewportLabel,
      });
      if (!portraitCampaign.ok) {
        stopInstrumentControl(`portrait control campaign did not observe every baseline, find an eligible visible-trail/non-fallback viewport, and execute each control exactly once (${JSON.stringify(portraitCampaign)})`);
      }
    }
    if (instrumentFailures.length) stopInstrumentControl(instrumentFailures[0]);
    } catch (error) {
      if (!(error instanceof GlassInstrumentControlStop)) throw error;
      causalInstrumentStop = error;
    }
    causalControlsArmed = false;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  if (causalInstrumentStop) {
    const endingSource = sourceIdentity();
    runEndingSource = endingSource;
    const terminalChainFailures = [];
    if (endingSource.commit !== runSource.commit || endingSource.branch !== runSource.branch
      || endingSource.statusSha256 !== runSource.statusSha256
      || endingSource.workingTreeSha256 !== runSource.workingTreeSha256) {
      terminalChainFailures.push(`source changed during matrix: start=${JSON.stringify(runSource)} end=${JSON.stringify(endingSource)}`);
    }
    if (!viewportLabel && selectedSliceRunId) {
      const terminalSlice = verifySliceRunEvidence(selectedSliceRunId, {
        expectedSource: endingSource, requirePass: true, requireCommitted: true,
        expectedAssuranceProfile: selectedAssuranceProfile, allowLegacyV1: false,
      });
      if (!terminalSlice.ok) {
        terminalChainFailures.push(`Slice predecessor changed or failed terminal verification: ${terminalSlice.errors.join('; ')}`);
      } else if (JSON.stringify(slicePredecessorDescriptor(terminalSlice))
        !== JSON.stringify(runPredecessors?.slice)) {
        terminalChainFailures.push('Slice predecessor report/log/hash binding changed during Glass');
      }
    }
    for (const failure of terminalChainFailures) {
      if (!instrumentFailures.includes(failure)) Array.prototype.push.call(instrumentFailures, failure);
    }
    const browser = browserVersions.length ? {
      ...browserVersions[0],
      consistentAcrossViewports: browserVersions
        .every((row) => JSON.stringify(row) === JSON.stringify(browserVersions[0])),
    } : null;
    const blockedControls = [...productBlockedControls.values()]
      .filter((row) => !executedControls.has(row.name));
    writeReport({
      status: 'instrument-fail', exitCode: 2, browser, findings, instrumentFailures,
      controlsRun, executedControls: [...executedControls], blockedControls,
    });
    console.error('GLASS MATRIX INSTRUMENT FAILURE');
    console.error('- ' + causalInstrumentStop.message);
    if (findings.length) {
      console.error(`PRODUCT FINDINGS WITHHELD (${findings.length}) — instrument must be repaired first`);
      for (const finding of findings.slice(0, 20)) {
        console.error('- ' + formatIssue(finding.context, finding.row));
      }
    }
    process.exitCode = 2;
    return;
  }

  const endingSource = sourceIdentity();
  runEndingSource = endingSource;
  if (endingSource.commit !== runSource.commit || endingSource.branch !== runSource.branch
    || endingSource.statusSha256 !== runSource.statusSha256
    || endingSource.workingTreeSha256 !== runSource.workingTreeSha256) {
    recordInstrumentFailure(`source changed during matrix: start=${JSON.stringify(runSource)} end=${JSON.stringify(endingSource)}`);
  }
  if (!viewportLabel && selectedSliceRunId) {
    const terminalSlice = verifySliceRunEvidence(selectedSliceRunId, {
      expectedSource: endingSource, requirePass: true, requireCommitted: true,
      expectedAssuranceProfile: selectedAssuranceProfile, allowLegacyV1: false,
    });
    if (!terminalSlice.ok) {
      recordInstrumentFailure(`Slice predecessor changed or failed terminal verification: ${terminalSlice.errors.join('; ')}`);
    } else if (JSON.stringify(slicePredecessorDescriptor(terminalSlice))
      !== JSON.stringify(runPredecessors?.slice)) {
      recordInstrumentFailure('Slice predecessor report/log/hash binding changed during Glass');
    }
  }
  /* A targeted diagnostic that is itself product-blocked cannot execute the
     remainder of that one viewport. Full certification still requires all
     global sentinels; only the explicit reachable suffix in the control
     ledger may be product-blocked there. */
  const targetedProductBlocked = !!causalProductStop
    || targetedProductRemainderBlocked(viewportLabel, targetedProductFailure);
  const settingsAudioCoverage = settingsAudioViewportCoverageOutcome(
    MATRIX_VIEWPORTS.map((viewport) => viewport.label),
    [...settingsAudioBaselineViewports],
    [...settingsAudioCompletedViewports],
    [...settingsAudioProductBlockedViewports],
  );
  if (!targetedProductBlocked && !settingsAudioCoverage.instrumentOk) {
    recordInstrumentFailure(`Settings audio causal coverage was incomplete or incoherent (${JSON.stringify(settingsAudioCoverage)})`);
  }
  if (!controlsRun && !targetedProductBlocked) recordInstrumentFailure('injected matrix controls never ran');
  if (!hpControlRun && !targetedProductBlocked) recordInstrumentFailure('HP dual-background contrast control never ran');
  if (!settingsWidthControlRun && !targetedProductBlocked) recordInstrumentFailure('Settings horizontal-overflow control never ran');
  if (!rarityContrastControlRun && !targetedProductBlocked) recordInstrumentFailure('opaque rarity contrast control never ran');
  if (!orbitalContainmentControlRun && !targetedProductBlocked
    && MATRIX_VIEWPORTS.some((vp) => vp.label === 'small-phone')) {
    recordInstrumentFailure('small-phone live orbital containment/scroll control never ran');
  }
  if (!settingsCloseClearanceControlRun && !targetedProductBlocked
    && MATRIX_VIEWPORTS.some((vp) => vp.label === 'laptop-720p')) {
    recordInstrumentFailure('short-laptop Settings Close-gutter control never ran');
  }
  if (!planetsideControlRun && !targetedProductBlocked) recordInstrumentFailure('Planetside surface-ownership controls never ran');
  if (!panelPlanetsideControlRun && !targetedProductBlocked) recordInstrumentFailure('panel/Planetside synthesized layering control never ran');
  if (!chromeYieldControlRun && !targetedProductBlocked) recordInstrumentFailure('mobile chrome yield control never ran');
  if (!chromeRestoreControlRun && !targetedProductBlocked) recordInstrumentFailure('mobile chrome restore-direction control never ran');
  if (!objectiveYieldControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width <= 900)) {
    recordInstrumentFailure('mobile landed-objective yield control never ran');
  }
  if (!topChromeControlRun && !targetedProductBlocked) recordInstrumentFailure('Planetside/top-chrome clearance control never ran');
  const portraitControlsRequired = portraitViewportCount > 0
    && (!viewportLabel || portraitEligibleBaselineCount > 0);
  if (!portraitBandControlRun && !targetedProductBlocked && portraitControlsRequired) {
    recordInstrumentFailure('Planetside portrait-band viability control never ran');
  }
  if (!portraitFallbackControlRun && !targetedProductBlocked && portraitControlsRequired) {
    recordInstrumentFailure('Planetside portrait trail-fallback control never ran');
  }
  if (!modalControlRun && !targetedProductBlocked) recordInstrumentFailure('import modal containment control never ran');
  if (!modalLiveControlRun && !targetedProductBlocked) recordInstrumentFailure('import live-error control never ran');
  if (!closeLabelControlRun && !targetedProductBlocked) recordInstrumentFailure('panel close accessible-name control never ran');
  if (!closeIntegrityControlRun && !targetedProductBlocked) recordInstrumentFailure('duplicate/misplaced close integrity controls never ran');
  if (!toastAnchorControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width > 900)) {
    recordInstrumentFailure('desktop left-anchored toast control never ran');
  }
  if (!settingsAnchorControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width > 900)) {
    recordInstrumentFailure('desktop left-anchored Settings control never ran');
  }
  if (!recordsAnchorObserved && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width > 900)) {
    recordInstrumentFailure('desktop Records bottom-right anchor outcome never ran');
  }
  if (!hiddenOpenerControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width > 900)) {
    recordInstrumentFailure('hidden panel-opener focus fallback control never ran');
  }
  if (!releaseDetailControlRun && !targetedProductBlocked) {
    recordInstrumentFailure('development release detail controls never ran');
  }
  if (!releaseTailControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.label === 'primary-phone')) {
    recordInstrumentFailure('development release hidden-overflow tail control never ran');
  }
  if (!shipyardControlRun && !targetedProductBlocked) {
    recordInstrumentFailure('Engineering/Shipyard opener/state/catalogue/geometry/close controls never ran');
  }
  if (!inventoryControlRun && !targetedProductBlocked) {
    recordInstrumentFailure('Inventory carrier/row/modal/focus/action/release controls never ran');
  }
  if (!arc4CaptureControlRun && !targetedProductBlocked) {
    recordInstrumentFailure('Arc 4 capture presentation/geometry/native-return controls never ran');
  }
  if (!phoneDockControlRun && !targetedProductBlocked && MATRIX_VIEWPORTS.some((vp) => vp.width <= 900)) {
    recordInstrumentFailure('exact ten-control 5x2 phone dock control never ran');
  }
  if (!reloadBindingControlRun && !targetedProductBlocked) recordInstrumentFailure('live slice-ready binding controls never ran');
  const arc4OutcomeInventory = arc4CaptureOutcomeInventoryOutcome(runArc4CaptureOutcomes);
  if (!arc4OutcomeInventory.ok
    || (!instrumentFailures.length && !findings.length && !arc4OutcomeInventory.complete)) {
    recordInstrumentFailure(`Arc 4 capture outcome inventory failed closed: ${JSON.stringify(arc4OutcomeInventory)}`);
  }
  const browser = browserVersions.length ? {
    ...browserVersions[0],
    consistentAcrossViewports: browserVersions.every((row) => JSON.stringify(row) === JSON.stringify(browserVersions[0])),
  } : null;
  if (browser && !browser.consistentAcrossViewports) recordInstrumentFailure('browser version changed within the matrix');
  const blockedControls = [...productBlockedControls.values()]
    .filter((row) => !executedControls.has(row.name));
  const coverage = controlCoverageOutcome([...executedControls], blockedControls);
  if (!coverage.ok) {
    recordInstrumentFailure(`negative-control coverage failed closed: ${coverage.why}`);
  } else if (!viewportLabel && coverage.omitted.length) {
    recordInstrumentFailure(`full matrix omitted planned negative controls: ${coverage.omitted.join(', ')}`);
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
    console.error('COUNTS ' + JSON.stringify(Object.fromEntries([...counts]
      .sort(([a], [b]) => codeUnitCompare(a, b)))));
    for (const finding of findings) console.error('- ' + formatIssue(finding.context, finding.row));
    process.exitCode = 1;
    return;
  }
  writeReport({ status: 'pass', exitCode: 0, browser, findings, instrumentFailures, controlsRun,
    executedControls: [...executedControls], blockedControls });
  const terminalVerification = verifyGlassRunEvidence(activeGlassRunId, {
    expectedSource: runEndingSource, expectedSlice: runPredecessors?.slice || null,
    requirePass: !viewportLabel,
  });
  if (!terminalVerification.ok) {
    throw new Error(`terminal Glass evidence failed verification: ${terminalVerification.errors.join('; ')}`);
  }
  if (viewportLabel) {
    console.log(`GLASS MATRIX TARGETED DIAGNOSTIC PASS — ${viewportLabel}; this does not certify the 12-viewport matrix.`);
    console.log(`diagnostic evidence pointer: apps/game/smoke/${path.basename(currentReportPath)}`);
    console.log(`immutable diagnostic evidence: ${glassArtifactPaths(activeGlassRunId).reportRelative}`);
  } else {
    console.log(`GLASS MATRIX PASS — ${MATRIX_VIEWPORTS.length} isolated viewport classes; populated Training, toast, Survey capture, Planetside, Inventory, Guide, Settings and import surfaces; safe-area, zoom, focus, target, contrast, reduced-motion and DPR controls all passed.`);
    console.log(`Glass run ID: ${activeGlassRunId}`);
    console.log(`immutable evidence: ${glassArtifactPaths(activeGlassRunId).reportRelative}`);
    console.log('current evidence pointer: apps/game/smoke/glassmatrix-report.json');
  }
  } finally {
    releaseLock();
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    if (activeGlassRunId && runSource && runArtifactReserved) {
      try {
        runEndingSource = sourceIdentity();
        writeReport({
          status: 'instrument-fail', exitCode: 2, browser: null, findings: [],
          instrumentFailures: [String(error?.stack || error)], controlsRun: false,
        });
      } catch (reportError) {
        console.error('- failed to write structured evidence: ' + reportError.message);
      }
    }
    console.error('GLASS MATRIX INSTRUMENT FAILURE');
    console.error('- ' + (error?.stack || error));
    process.exitCode = 2;
  });
}
