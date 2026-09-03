import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  assessGlassKeyboardActivationEvidence,
  buildGlassKeyboardActivationHeartbeatExpression,
  buildGlassKeyboardActivationReceiptExpression,
  buildGlassKeyboardActivationSetupExpression,
} from '../tools/glassmatrix.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => {
    readonly window: Window & typeof globalThis & Record<string, any> & {
      eval(source: string): unknown;
      close(): void;
    };
  };
};
const glassSource = fs.readFileSync(
  path.join(here, '..', 'tools', 'glassmatrix.mjs'),
  'utf8',
);
const selector = '#panel button[data-focus-key="fabricate"]';

function collectKeyboardSetup(targetCount: 0 | 2) {
  const buttons = Array.from({ length: targetCount }, () => (
    '<button data-focus-key="fabricate">Fabricate plate</button>'
  )).join('');
  const dom = new JSDOM(`<!doctype html><html><head><style>
    html, body, #panel, button { opacity: 1; filter: none; }
    button { display: block; visibility: visible; }
  </style></head><body><section id="panel" data-engineering-section="fabricator">
    ${buttons}
  </section></body></html>`, {
    url: 'https://example.test/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });
  const view = dom.window;
  Object.defineProperty(view.HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    writable: true,
    value: () => ({
      left: 20, top: 40, right: 220, bottom: 84, width: 200, height: 44,
      x: 20, y: 40, toJSON: () => ({}),
    }),
  });
  Object.defineProperty(view, '__CF_SLICE__', {
    configurable: true,
    writable: true,
    value: { documentToken: 'keyboard-document' },
  });
  try {
    const setup = view.eval(
      buildGlassKeyboardActivationSetupExpression(selector),
    ) as Record<string, any>;
    return {
      setup,
      outcome: assessGlassKeyboardActivationEvidence({
        setup,
        receipt: null,
        activationAttempted: false,
      }),
    };
  } finally {
    view.close();
  }
}

function keyboardWiringErrors(source: string): string[] {
  const errors: string[] = [];
  const helperStart = source.indexOf(
    'const activateRealKeyboardControl = async (selector, label, options = {}) => {',
  );
  const helperEnd = source.indexOf(
    'const activateRealControl = async (selector, label, options = {}) => {',
    helperStart,
  );
  const helper = helperStart >= 0 && helperEnd > helperStart
    ? source.slice(helperStart, helperEnd)
    : '';
  const setupPosition = helper.indexOf('buildGlassKeyboardActivationSetupExpression(selector)');
  const forcedPosition = helper.indexOf('if (preDispatchOutcome.ok && forceHeartbeatRerender)');
  const heartbeatPosition = helper.indexOf('buildGlassKeyboardActivationHeartbeatExpression()');
  const requiredPosition = helper.indexOf('heartbeatRequired: forceHeartbeatRerender');
  const stopPosition = helper.indexOf('if (!preDispatchOutcome.ok)');
  const dispatchPosition = helper.indexOf("type: 'keyDown'", stopPosition);
  const receiptPosition = helper.indexOf(
    'buildGlassKeyboardActivationReceiptExpression()',
    dispatchPosition,
  );
  const helperPositions = [
    setupPosition, forcedPosition, heartbeatPosition, requiredPosition,
    stopPosition, dispatchPosition, receiptPosition,
  ];
  if (!helper.length || helperPositions.some((position) => position < 0)
    || helperPositions.some((position, index) => index > 0
      && position <= helperPositions[index - 1]!)) {
    errors.push('helper-order');
  }
  if (helper.split('heartbeatRequired: forceHeartbeatRerender').length - 1 !== 2) {
    errors.push('helper-requiredness');
  }

  const shipyardStart = source.indexOf(
    "const forceHeartbeatRerender = vp.label === 'large-phone'",
  );
  const shipyardEnd = source.indexOf('const disclosuresSettled = await waitFor', shipyardStart);
  const shipyard = shipyardStart >= 0 && shipyardEnd > shipyardStart
    ? source.slice(shipyardStart, shipyardEnd)
    : '';
  const shipyardMarkers = [
    "const forceHeartbeatRerender = vp.label === 'large-phone'",
    '&& disclosureIndex === 0;',
    'const receipt = await activateRealKeyboardControl(',
    '{ forceHeartbeatRerender },',
    'if (forceHeartbeatRerender && receipt.heartbeat !== null) {',
    'runShipyardKeyboardHeartbeatOutcomes.push({',
    'schema: SHIPYARD_KEYBOARD_HEARTBEAT_OUTCOME_SCHEMA,',
    'const disclosureReceipt = {',
    'engineeringDisclosureReceipts.push(disclosureReceipt);',
    'addOutcome(vp.label, composition,',
    "'SHIPYARD_KEYBOARD_DISCLOSURE_ACTIVATION',",
  ];
  const shipyardPositions = shipyardMarkers.map((marker) => shipyard.indexOf(marker));
  if (!shipyard.length || shipyardPositions.some((position) => position < 0)
    || shipyardPositions.some((position, index) => index > 0
      && position <= shipyardPositions[index - 1]!)) {
    errors.push('shipyard-order');
  }
  if (!source.includes(
    'shipyardKeyboardHeartbeatInventory: shipyardHeartbeatReportInventory,',
  )) {
    errors.push('shipyard-report-retention');
  }
  return errors;
}

async function executeKeyboardActivation({
  replaceBeforeEnter = true,
  focusReplacementBeforeHeartbeat = false,
  trusted = true,
  wrongDocument = false,
  wrongOrigin = false,
  duplicateCurrent = false,
  mutateSemanticIdentity = false,
  zeroSizedCurrent = false,
  transparentCurrent = false,
  transparentAncestor = false,
  filteredAncestor = false,
  collapsedCurrent = false,
  dispatchSecondEnter = false,
  heartbeatMode = null,
}: {
  replaceBeforeEnter?: boolean;
  focusReplacementBeforeHeartbeat?: boolean;
  trusted?: boolean;
  wrongDocument?: boolean;
  wrongOrigin?: boolean;
  duplicateCurrent?: boolean;
  mutateSemanticIdentity?: boolean;
  zeroSizedCurrent?: boolean;
  transparentCurrent?: boolean;
  transparentAncestor?: boolean;
  filteredAncestor?: boolean;
  collapsedCurrent?: boolean;
  dispatchSecondEnter?: boolean;
  heartbeatMode?: 'completed' | 'skipped' | 'completed-without-replacement'
    | 'completed-lost-focus' | 'skipped-with-replacement' | null;
} = {}) {
  const dom = new JSDOM(`<!doctype html><html><head><style>
    html, body, #panel, button { opacity: 1; filter: none; }
    button { display: block; visibility: visible; }
  </style></head><body><section id="panel" data-engineering-section="fabricator">
    <button data-focus-key="fabricate">Fabricate plate</button>
  </section></body></html>`, {
    url: 'https://example.test/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });
  const view = dom.window;
  const document = view.document;
  Object.defineProperty(view.HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    writable: true,
    value: () => ({
      left: 20, top: 40, right: 220, bottom: 84, width: 200, height: 44,
      x: 20, y: 40, toJSON: () => ({}),
    }),
  });
  Object.defineProperty(view, '__CF_SLICE__', {
    configurable: true,
    writable: true,
    value: { documentToken: 'keyboard-document' },
  });
  Object.defineProperty(view, 'requestAnimationFrame', {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
  });
  const original = document.querySelector(selector) as HTMLButtonElement;
  try {
    const setup = view.eval(
      buildGlassKeyboardActivationSetupExpression(selector),
    ) as Record<string, any>;
    let current = original;
    if (replaceBeforeEnter) {
      current = original.cloneNode(true) as HTMLButtonElement;
      original.replaceWith(current);
      if (focusReplacementBeforeHeartbeat) current.focus();
    }
    let heartbeat: Record<string, any> | null = null;
    if (heartbeatMode !== null) {
      let heartbeatRunning = true;
      const installReplacement = (restoreFocus: boolean): void => {
        const prior = document.querySelector(selector) as HTMLButtonElement;
        const replacement = prior.cloneNode(true) as HTMLButtonElement;
        prior.replaceWith(replacement);
        if (restoreFocus) replacement.focus();
      };
      view.__CF_SLICE__ = {
        documentToken: 'keyboard-document',
        api: {
          state: () => ({
            persistence: {
              documentToken: 'keyboard-document',
              heartbeatRunning,
            },
          }),
          __smokeQuiesceF4Heartbeat: async () => {
            const wasRunning = heartbeatRunning;
            heartbeatRunning = false;
            return {
              schema: 'cf-v2-f4-heartbeat-quiescence/v1',
              documentToken: 'keyboard-document',
              wasRunning,
              stopped: true,
              cycleSettled: true,
            };
          },
          __smokeResumeF4Heartbeat: () => {
            heartbeatRunning = true;
            return {
              schema: 'cf-v2-f4-heartbeat-resume/v1',
              documentToken: 'keyboard-document',
              running: true,
            };
          },
          __smokeRunF4Heartbeat: async () => {
            const replace = heartbeatMode === 'completed'
              || heartbeatMode === 'completed-lost-focus'
              || heartbeatMode === 'skipped-with-replacement';
            if (replace) installReplacement(heartbeatMode !== 'completed-lost-focus');
            const skipped = heartbeatMode === 'skipped'
              || heartbeatMode === 'skipped-with-replacement';
            return {
              schema: 'cf-v2-f4-heartbeat-cycle-receipt/v1',
              documentToken: 'keyboard-document',
              cycle: skipped ? 'skipped' : 'completed',
              reason: skipped ? 'persist-in-flight' : null,
              refresh: skipped ? {
                shipyard: 'not-reached',
                compendium: 'not-reached',
                capture: 'not-reached',
              } : {
                shipyard: 'completed',
                compendium: 'panel-closed',
                capture: 'card-hidden',
              },
            };
          },
        },
      };
      heartbeat = await view.eval(
        buildGlassKeyboardActivationHeartbeatExpression(),
      ) as Record<string, any>;
      current = document.querySelector(selector) as HTMLButtonElement;
    }
    if (mutateSemanticIdentity) current.textContent = 'Fabricate changed';
    if (duplicateCurrent) current.after(current.cloneNode(true));
    if (zeroSizedCurrent) {
      current.getBoundingClientRect = () => ({
        left: 20, top: 40, right: 20, bottom: 40, width: 0, height: 0,
        x: 20, y: 40, toJSON: () => ({}),
      });
    }
    if (transparentCurrent) current.style.opacity = '0';
    if (transparentAncestor) {
      (document.querySelector('#panel') as HTMLElement).style.opacity = '0';
    }
    if (filteredAncestor) {
      (document.querySelector('#panel') as HTMLElement).style.filter = 'opacity(0)';
    }
    if (collapsedCurrent) current.style.visibility = 'collapse';
    current.focus();
    if (wrongDocument) view.__CF_SLICE__ = { documentToken: 'replacement-document' };
    const origin = wrongOrigin ? document.body : current;
    origin.dispatchEvent(new view.KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', bubbles: true,
    }));
    const liveState = view.__cfGlassKeyboardActivation as {
      receipt?: Record<string, any> | null;
      lastUntrustedReceipt?: Record<string, any> | null;
      untrustedEnterCount?: number;
      controller?: AbortController;
    };
    const untrustedDidNotOccupyReceipt = liveState?.receipt === null
      && liveState?.untrustedEnterCount === 1;
    if (trusted && liveState?.lastUntrustedReceipt) {
      liveState.receipt = {
        ...liveState.lastUntrustedReceipt,
        trusted: true,
        ignoredUntrustedEnterCount: Math.max(0, (liveState.untrustedEnterCount ?? 1) - 1),
      };
    }
    const receiptBeforeSecond = JSON.stringify(liveState?.receipt ?? null);
    if (dispatchSecondEnter) {
      current.dispatchEvent(new view.KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', bubbles: true,
      }));
    }
    const secondEnterDidNotReplaceReceipt = receiptBeforeSecond
      === JSON.stringify(liveState?.receipt ?? null);
    const controller = liveState?.controller ?? null;
    const receipt = view.eval(
      buildGlassKeyboardActivationReceiptExpression(),
    ) as Record<string, any> | null;
    const cleanup = {
      controllerAborted: controller?.signal.aborted === true,
      stateRemoved: !Object.hasOwn(view, '__cfGlassKeyboardActivation'),
      abortRemoved: !Object.hasOwn(view, '__cfGlassKeyboardActivationAbort'),
    };
    return {
      setup,
      receipt,
      outcome: assessGlassKeyboardActivationEvidence({
        setup,
        receipt,
        heartbeat,
        heartbeatRequired: heartbeatMode !== null,
      }),
      originalConnected: original.isConnected,
      current,
      untrustedDidNotOccupyReceipt,
      secondEnterDidNotReplaceReceipt,
      cleanup,
      heartbeat,
    };
  } finally {
    view.close();
  }
}

describe('Glass live keyboard activation identity', () => {
  it('binds trusted Enter to the unique live semantic replacement, not the stale setup node', async () => {
    const result = await executeKeyboardActivation();
    expect(result.setup).toMatchObject({
      schema: 'cf-v2-glass-keyboard-activation-setup/v1',
      ok: true,
      targetCount: 1,
      tag: 'BUTTON',
      focusKey: 'fabricate',
      engineeringSection: 'fabricator',
      accessibleName: 'Fabricate plate',
      effectiveOpacity: 1,
    });
    expect(result.originalConnected).toBe(false);
    expect(result.receipt).toMatchObject({
      schema: 'cf-v2-glass-keyboard-activation-receipt/v1',
      trusted: true,
      key: 'Enter',
      code: 'Enter',
      currentCount: 1,
      currentConnected: true,
      originalTargetDisconnected: true,
      replacementAcquired: true,
      eventTargetIsCurrent: true,
      activeIsCurrent: true,
      tag: 'BUTTON',
      focusKey: 'fabricate',
      surveyClose: false,
      currentVisible: true,
      currentDisplay: 'block',
      currentVisibility: 'visible',
      currentOpacity: 1,
      currentEffectiveOpacity: 1,
      currentRect: [20, 40, 220, 84],
      current: {
        tag: 'BUTTON',
        focusKey: 'fabricate',
        engineeringSection: 'fabricator',
        accessibleName: 'Fabricate plate',
      },
    });
    expect(result.outcome).toMatchObject({
      ok: true,
      instrumentOk: true,
      productOk: true,
    });
    expect(result.untrustedDidNotOccupyReceipt).toBe(true);
    expect(result.cleanup).toEqual({
      controllerAborted: true,
      stateRemoved: true,
      abortRemoved: true,
    });
  });

  it('also accepts a stable connected node without claiming replacement', async () => {
    const result = await executeKeyboardActivation({ replaceBeforeEnter: false });
    expect(result.receipt).toMatchObject({
      originalTargetDisconnected: false,
      replacementAcquired: false,
      eventTargetIsCurrent: true,
      activeIsCurrent: true,
    });
    expect(result.outcome.ok).toBe(true);
  });

  it('forces one real Shipyard heartbeat contract and follows its focused semantic successor', async () => {
    const result = await executeKeyboardActivation({
      replaceBeforeEnter: false,
      heartbeatMode: 'completed',
    });
    expect(result.heartbeat).toMatchObject({
      schema: 'cf-v2-glass-keyboard-activation-heartbeat/v1',
      required: true,
      stateFound: true,
      seamsAvailable: true,
      error: null,
      cycleReceipt: {
        schema: 'cf-v2-f4-heartbeat-cycle-receipt/v1',
        cycle: 'completed',
        reason: null,
        refresh: { shipyard: 'completed' },
      },
      after: {
        currentCount: 1,
        currentConnected: true,
        currentFocused: true,
        originalTargetDisconnected: true,
        replacementAcquired: true,
      },
    });
    expect(result.receipt).toMatchObject({
      originalTargetDisconnected: true,
      replacementAcquired: true,
      eventTargetIsCurrent: true,
      activeIsCurrent: true,
    });
    expect(result.outcome).toMatchObject({
      ok: true,
      instrumentOk: true,
      productOk: true,
    });
  });

  it('rebaselines only after quiescence when an ambient heartbeat replaced the setup node', async () => {
    const expression = buildGlassKeyboardActivationHeartbeatExpression();
    const ownershipOrder = [
      'quiescence=await api.__smokeQuiesceF4Heartbeat()',
      'baselineTargets=[...document.querySelectorAll(state.selector)]',
      'state.originalTarget=baselineCurrent',
      'resume=api.__smokeResumeF4Heartbeat()',
      'initial=snapshot()',
      'cycleReceipt=await api.__smokeRunF4Heartbeat()',
    ].map((marker) => expression.indexOf(marker));
    expect(ownershipOrder.every((position) => position >= 0)).toBe(true);
    expect(ownershipOrder.every((position, index) => (
      index === 0 || position > ownershipOrder[index - 1]!
    ))).toBe(true);

    const result = await executeKeyboardActivation({
      replaceBeforeEnter: true,
      focusReplacementBeforeHeartbeat: true,
      heartbeatMode: 'completed',
    });
    expect(result.originalConnected).toBe(false);
    expect(result.heartbeat).toMatchObject({
      quiescence: { wasRunning: true, stopped: true, cycleSettled: true },
      initial: {
        currentCount: 1,
        currentConnected: true,
        currentFocused: true,
        originalTargetDisconnected: false,
        replacementAcquired: false,
        current: {
          focusKey: 'fabricate',
          engineeringSection: 'fabricator',
          accessibleName: 'Fabricate plate',
        },
      },
      after: {
        originalTargetDisconnected: true,
        replacementAcquired: true,
      },
    });
    expect(result.receipt).toMatchObject({
      originalTargetDisconnected: true,
      replacementAcquired: true,
      eventTargetIsCurrent: true,
      activeIsCurrent: true,
    });
    expect(result.outcome).toMatchObject({
      ok: true,
      instrumentOk: true,
      productOk: true,
    });
  });

  it.each([
    ['missing', 0],
    ['duplicate', 2],
  ] as const)('keeps a %s setup target product-red with exact instrument evidence', (_label, count) => {
    const result = collectKeyboardSetup(count);
    expect(result.setup).toMatchObject({
      schema: 'cf-v2-glass-keyboard-activation-setup/v1',
      ok: false,
      targetCount: count,
      instrumentReady: true,
      productReady: false,
      targetConnected: false,
      focused: false,
      visible: false,
      tag: null,
      id: null,
      focusKey: null,
      surveyClose: false,
      captureAction: null,
      engineeringSection: null,
      accessibleName: '',
      display: null,
      visibility: null,
      opacity: null,
      effectiveOpacity: null,
      rect: null,
    });
    expect(result.outcome).toMatchObject({
      ok: false,
      instrumentOk: true,
      productOk: false,
      instrumentChecks: {
        setupQueryWitness: true,
        setupDescriptor: true,
      },
      productChecks: { setupReady: false },
    });
  });

  it('still fails closed when an empty setup carrier contradicts its target count', () => {
    const missing = collectKeyboardSetup(0);
    const styleContradiction = assessGlassKeyboardActivationEvidence({
      setup: { ...missing.setup, display: 'block' },
      receipt: null,
      activationAttempted: false,
    });
    expect(styleContradiction.instrumentOk).toBe(false);
    expect(styleContradiction.instrumentChecks.setupQueryWitness).toBe(false);

    const descriptorContradiction = assessGlassKeyboardActivationEvidence({
      setup: { ...missing.setup, tag: 'BUTTON' },
      receipt: null,
      activationAttempted: false,
    });
    expect(descriptorContradiction.instrumentOk).toBe(false);
    expect(descriptorContradiction.instrumentChecks.setupDescriptor).toBe(false);
  });

  it('keeps heartbeat skips and replacement contradictions instrument-red with exact reasons', async () => {
    const skipped = await executeKeyboardActivation({
      replaceBeforeEnter: false,
      heartbeatMode: 'skipped',
    });
    expect(skipped.heartbeat?.cycleReceipt).toMatchObject({
      cycle: 'skipped',
      reason: 'persist-in-flight',
      refresh: {
        shipyard: 'not-reached',
        compendium: 'not-reached',
        capture: 'not-reached',
      },
    });
    expect(skipped.outcome.instrumentOk).toBe(false);
    expect(skipped.outcome.instrumentChecks.heartbeatCycleCarrier).toBe(true);
    expect(skipped.outcome.instrumentChecks.shipyardRefreshCompleted).toBe(false);
    expect(skipped.outcome.instrumentChecks.heartbeatReceiptReplacementCoherence).toBe(true);

    const falseCompletion = await executeKeyboardActivation({
      replaceBeforeEnter: false,
      heartbeatMode: 'completed-without-replacement',
    });
    expect(falseCompletion.outcome.instrumentOk).toBe(false);
    expect(falseCompletion.outcome.instrumentChecks.shipyardRefreshCompleted).toBe(true);
    expect(falseCompletion.outcome.instrumentChecks.heartbeatReplacementScenario).toBe(false);
    expect(falseCompletion.outcome.instrumentChecks.heartbeatReceiptReplacementCoherence).toBe(false);

    const contradictory = await executeKeyboardActivation({
      replaceBeforeEnter: false,
      heartbeatMode: 'skipped-with-replacement',
    });
    expect(contradictory.outcome.instrumentOk).toBe(false);
    expect(contradictory.outcome.instrumentChecks.shipyardRefreshCompleted).toBe(false);
    expect(contradictory.outcome.instrumentChecks.heartbeatReceiptReplacementCoherence).toBe(false);
  });

  it('keeps lost focus after a genuine Shipyard refresh product-red', async () => {
    const lost = await executeKeyboardActivation({
      replaceBeforeEnter: false,
      heartbeatMode: 'completed-lost-focus',
    });
    expect(lost.outcome.instrumentOk).toBe(true);
    expect(lost.outcome.productOk).toBe(false);
    expect(lost.outcome.productChecks.heartbeatFocusRestored).toBe(false);
    expect(lost.outcome.productChecks.heartbeatSemanticIdentity).toBe(true);
  });

  it('validates every initial heartbeat target fact with product/instrument parity', async () => {
    const stable = await executeKeyboardActivation({
      replaceBeforeEnter: false,
      heartbeatMode: 'completed',
    });
    const assessMutation = (mutate: (heartbeat: Record<string, any>) => void) => {
      const heartbeat = structuredClone(stable.heartbeat) as Record<string, any>;
      mutate(heartbeat);
      return assessGlassKeyboardActivationEvidence({
        setup: stable.setup,
        receipt: stable.receipt,
        heartbeat,
        heartbeatRequired: true,
      });
    };

    const wrongCount = assessMutation((heartbeat) => {
      heartbeat.initial.currentCount = 0;
    });
    expect(wrongCount.instrumentOk).toBe(false);
    expect(wrongCount.instrumentChecks.heartbeatCurrentDescriptor).toBe(false);
    expect(wrongCount.productOk).toBe(false);
    expect(wrongCount.productChecks.heartbeatSemanticIdentity).toBe(false);

    const disconnected = assessMutation((heartbeat) => {
      heartbeat.initial.currentConnected = false;
    });
    expect(disconnected.instrumentOk).toBe(false);
    expect(disconnected.instrumentChecks.heartbeatCurrentDescriptor).toBe(false);
    expect(disconnected.productChecks.heartbeatSemanticIdentity).toBe(false);

    const coherentMissingTarget = assessMutation((heartbeat) => {
      heartbeat.initial.currentCount = 0;
      heartbeat.initial.currentConnected = false;
      heartbeat.initial.currentFocused = false;
      heartbeat.initial.current = {
        tag: null,
        id: null,
        focusKey: null,
        surveyClose: false,
        captureAction: null,
        engineeringSection: null,
        accessibleName: '',
      };
    });
    expect(coherentMissingTarget.instrumentOk).toBe(true);
    expect(coherentMissingTarget.productOk).toBe(false);
    expect(coherentMissingTarget.productChecks.heartbeatFocusRestored).toBe(false);
    expect(coherentMissingTarget.productChecks.heartbeatSemanticIdentity).toBe(false);

    const unfocused = assessMutation((heartbeat) => {
      heartbeat.initial.currentFocused = false;
    });
    expect(unfocused.instrumentOk).toBe(true);
    expect(unfocused.productOk).toBe(false);
    expect(unfocused.productChecks.heartbeatFocusRestored).toBe(false);

    const semanticDrift = assessMutation((heartbeat) => {
      heartbeat.initial.current.focusKey = 'section:research';
    });
    expect(semanticDrift.instrumentOk).toBe(true);
    expect(semanticDrift.productOk).toBe(false);
    expect(semanticDrift.productChecks.heartbeatSemanticIdentity).toBe(false);

    for (const mutate of [
      (heartbeat: Record<string, any>) => {
        heartbeat.initial.originalTargetDisconnected = true;
      },
      (heartbeat: Record<string, any>) => {
        heartbeat.initial.replacementAcquired = true;
      },
    ]) {
      const invalidLineage = assessMutation(mutate);
      expect(invalidLineage.instrumentOk).toBe(false);
      expect(invalidLineage.instrumentChecks.heartbeatReplacementScenario).toBe(false);
    }
  });

  it('refuses a missing heartbeat whenever the caller declares it required', async () => {
    const stable = await executeKeyboardActivation({ replaceBeforeEnter: false });
    const missing = assessGlassKeyboardActivationEvidence({
      setup: stable.setup,
      receipt: stable.receipt,
      heartbeat: null,
      heartbeatRequired: true,
    });
    expect(missing.instrumentOk).toBe(false);
    expect(missing.instrumentChecks.heartbeatRequirement).toBe(false);
    expect(missing.productOk).toBe(true);
  });

  it('separates malformed carriers from wrong-origin and semantic product failures', async () => {
    const untrusted = await executeKeyboardActivation({ trusted: false });
    expect(untrusted.outcome.instrumentOk).toBe(false);
    expect(untrusted.outcome.instrumentChecks.trustedEnter).toBe(false);

    const wrongDocument = await executeKeyboardActivation({ wrongDocument: true });
    expect(wrongDocument.outcome.instrumentOk).toBe(false);
    expect(wrongDocument.outcome.instrumentChecks.documentIdentity).toBe(false);

    const wrongOrigin = await executeKeyboardActivation({ wrongOrigin: true });
    expect(wrongOrigin.outcome.instrumentOk).toBe(true);
    expect(wrongOrigin.outcome.productOk).toBe(false);
    expect(wrongOrigin.outcome.productChecks.eventOrigin).toBe(false);

    const duplicate = await executeKeyboardActivation({ duplicateCurrent: true });
    expect(duplicate.outcome.instrumentOk).toBe(true);
    expect(duplicate.outcome.productOk).toBe(false);
    expect(duplicate.outcome.productChecks.currentTarget).toBe(false);

    const zeroSized = await executeKeyboardActivation({ zeroSizedCurrent: true });
    expect(zeroSized.outcome.instrumentOk).toBe(true);
    expect(zeroSized.outcome.productOk).toBe(false);
    expect(zeroSized.outcome.productChecks.currentTarget).toBe(false);

    const transparent = await executeKeyboardActivation({ transparentCurrent: true });
    expect(transparent.outcome.instrumentOk).toBe(true);
    expect(transparent.outcome.productOk).toBe(false);
    expect(transparent.outcome.productChecks.currentTarget).toBe(false);

    const transparentAncestorReplacement = await executeKeyboardActivation({
      replaceBeforeEnter: false,
      heartbeatMode: 'completed',
      transparentAncestor: true,
    });
    expect(transparentAncestorReplacement.receipt?.replacementAcquired).toBe(true);
    expect(transparentAncestorReplacement.receipt?.currentOpacity).toBe(1);
    expect(transparentAncestorReplacement.receipt?.currentEffectiveOpacity).toBe(0);
    expect(transparentAncestorReplacement.outcome.instrumentOk).toBe(true);
    expect(transparentAncestorReplacement.outcome.productOk).toBe(false);
    expect(transparentAncestorReplacement.outcome.productChecks.currentTarget).toBe(false);

    const filteredAncestorReplacement = await executeKeyboardActivation({
      replaceBeforeEnter: false,
      heartbeatMode: 'completed',
      filteredAncestor: true,
    });
    expect(filteredAncestorReplacement.receipt?.replacementAcquired).toBe(true);
    expect(filteredAncestorReplacement.receipt?.currentOpacity).toBe(1);
    expect(filteredAncestorReplacement.receipt?.currentEffectiveOpacity).toBe(0);
    expect(filteredAncestorReplacement.outcome.instrumentOk).toBe(true);
    expect(filteredAncestorReplacement.outcome.productOk).toBe(false);
    expect(filteredAncestorReplacement.outcome.productChecks.currentTarget).toBe(false);

    const collapsedReplacement = await executeKeyboardActivation({
      replaceBeforeEnter: true,
      collapsedCurrent: true,
    });
    expect(collapsedReplacement.receipt?.replacementAcquired).toBe(true);
    expect(collapsedReplacement.outcome.instrumentOk).toBe(true);
    expect(collapsedReplacement.outcome.productOk).toBe(false);
    expect(collapsedReplacement.outcome.productChecks.currentTarget).toBe(false);

    const drift = await executeKeyboardActivation({ mutateSemanticIdentity: true });
    expect(drift.outcome.instrumentOk).toBe(true);
    expect(drift.outcome.productOk).toBe(false);
    expect(drift.outcome.productChecks.semanticIdentity).toBe(false);

    const missingDescriptors = {
      setup: structuredClone(drift.setup),
      receipt: structuredClone(drift.receipt),
    };
    for (const key of [
      'tag', 'id', 'focusKey', 'surveyClose', 'captureAction',
      'engineeringSection', 'accessibleName',
    ]) {
      delete missingDescriptors.setup[key];
      delete missingDescriptors.receipt?.current?.[key];
      delete missingDescriptors.receipt?.eventTarget?.[key];
      delete missingDescriptors.receipt?.active?.[key];
    }
    const missingDescriptorOutcome = assessGlassKeyboardActivationEvidence({
      setup: missingDescriptors.setup,
      receipt: missingDescriptors.receipt,
    });
    expect(missingDescriptorOutcome.instrumentOk).toBe(false);
    expect(missingDescriptorOutcome.instrumentChecks.setupDescriptor).toBe(false);
    expect(missingDescriptorOutcome.instrumentChecks.receiptDescriptors).toBe(false);
  });

  it('does not let an untrusted Enter poison or replace the trusted receipt slot', async () => {
    const result = await executeKeyboardActivation({ dispatchSecondEnter: true });
    expect(result.untrustedDidNotOccupyReceipt).toBe(true);
    expect(result.secondEnterDidNotReplaceReceipt).toBe(true);
    expect(result.receipt?.ignoredUntrustedEnterCount).toBe(0);
    expect(result.outcome.ok).toBe(true);
  });

  it('rejects empty computed-display witnesses in the setup and live receipt', async () => {
    const stable = await executeKeyboardActivation({ replaceBeforeEnter: false });
    const emptySetupDisplay = assessGlassKeyboardActivationEvidence({
      setup: { ...stable.setup, display: '' },
      receipt: stable.receipt,
    });
    expect(emptySetupDisplay.instrumentOk).toBe(false);
    expect(emptySetupDisplay.instrumentChecks.setupQueryWitness).toBe(false);
    expect(emptySetupDisplay.productOk).toBe(false);
    expect(emptySetupDisplay.productChecks.setupReady).toBe(false);

    const emptyReceiptDisplay = assessGlassKeyboardActivationEvidence({
      setup: stable.setup,
      receipt: { ...(stable.receipt ?? {}), currentDisplay: '' },
    });
    expect(emptyReceiptDisplay.instrumentOk).toBe(false);
    expect(emptyReceiptDisplay.instrumentChecks.currentQueryWitness).toBe(false);
    expect(emptyReceiptDisplay.productOk).toBe(false);
    expect(emptyReceiptDisplay.productChecks.currentTarget).toBe(false);
  });

  it('classifies missing setup document authority as instrument evidence before dispatch', () => {
    const setup = {
      schema: 'cf-v2-glass-keyboard-activation-setup/v1',
      ok: false,
      instrumentReady: false,
      productReady: true,
      selector,
      documentToken: null,
      documentHref: 'https://example.test/',
      targetCount: 1,
      targetConnected: true,
      focused: true,
      visible: true,
      display: 'block',
      visibility: 'visible',
      opacity: 1,
      effectiveOpacity: 1,
      tag: 'BUTTON',
      id: null,
      focusKey: 'fabricate',
      surveyClose: false,
      captureAction: null,
      engineeringSection: 'fabricator',
      accessibleName: 'Fabricate plate',
      rect: [20, 40, 220, 84],
    };
    const outcome = assessGlassKeyboardActivationEvidence({
      setup,
      receipt: null,
      activationAttempted: false,
    });
    expect(outcome.instrumentOk).toBe(false);
    expect(outcome.instrumentChecks.setupDocument).toBe(false);
    expect(outcome.productOk).toBe(true);
    expect(outcome.productChecks.setupReady).toBe(true);
  });

  it('wires every generic collector call through the live-query contract and causal instrument stop', () => {
    expect(keyboardWiringErrors(glassSource)).toEqual([]);
    expect(glassSource).not.toContain('event.target!==target');
    expect(glassSource).not.toContain('__cfGlassEngineeringKeyReceipt');
    for (const marker of [
      'if (preDispatchOutcome.ok && forceHeartbeatRerender)',
      'buildGlassKeyboardActivationHeartbeatExpression()',
      'heartbeatRequired: forceHeartbeatRerender',
      'if (!preDispatchOutcome.ok)',
      "const forceHeartbeatRerender = vp.label === 'large-phone'",
      '&& disclosureIndex === 0;',
      '{ forceHeartbeatRerender },',
      'if (forceHeartbeatRerender && receipt.heartbeat !== null) {',
      'runShipyardKeyboardHeartbeatOutcomes.push({',
      'engineeringDisclosureReceipts.push(disclosureReceipt);',
      'addOutcome(vp.label, composition,',
      "'SHIPYARD_KEYBOARD_DISCLOSURE_ACTIVATION',",
      'shipyardKeyboardHeartbeatInventory: shipyardHeartbeatReportInventory,',
    ]) {
      const occurrenceCount = glassSource.split(marker).length - 1;
      expect(occurrenceCount, marker).toBeGreaterThan(0);
      expect(keyboardWiringErrors(glassSource.replaceAll(marker, '__BROKEN_WIRING__')), marker)
        .not.toEqual([]);
    }
  });
});
