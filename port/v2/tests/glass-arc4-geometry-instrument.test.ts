import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable browser evidence contract intentionally has no declaration shim.
import { ARC4_CONTROL_GEOMETRY_EVIDENCE_SCHEMA, ARC4_HEARTBEAT_RERENDER_EVIDENCE_SCHEMA, assessArc4CaptureGeometryEvidenceCoherence, assessArc4HeartbeatRerenderEvidence } from '../tools/arc4-browser-contract.mjs';
import {
  assessArc4NativeTabFocusEvidence,
  buildArc4AtomicGeometryEvidenceExpression,
  buildArc4NativeTabHeartbeatRerenderExpression,
  buildArc4NativeTabFocusEvidenceExpression,
  buildArc4NativeTabFocusSetupExpression,
} from '../tools/glassmatrix.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => {
    readonly window: Window & typeof globalThis & {
      eval(source: string): unknown;
      close(): void;
    };
  };
};
const glassSource = fs.readFileSync(
  path.join(here, '..', 'tools', 'glassmatrix.mjs'),
  'utf8',
);

function point(
  x: number,
  y: number,
  verb: string | null,
  close = false,
): Record<string, unknown> {
  return { x, y, tag: 'BUTTON', verb, close };
}

function exactHostedGeometry(): Record<string, unknown> {
  const sampleRect = {
    left: 36, top: 151.171875, right: 284, bottom: 195.171875,
    width: 248, height: 44,
  };
  const row = (verb: string, top: number) => {
    const rect = verb === 'sample' ? sampleRect : {
      left: 36, top, right: 284, bottom: top + 44, width: 248, height: 44,
    };
    const owned = point(160, (rect.top + rect.bottom) / 2, verb);
    return {
      captureSchema: ARC4_CONTROL_GEOMETRY_EVIDENCE_SCHEMA,
      verb,
      buttonRect: rect,
      beforePoint: owned,
      afterRenderPoint: { ...owned },
    };
  };
  const closeRect = {
    left: 248, top: 111, right: 292, bottom: 155, width: 44, height: 44,
  };
  const closePoint = point(270, 133, null, true);
  return {
    controls: [row('tame', 151), row('scavenge', 151), row('sample', 151.171875)],
    close: {
      captureSchema: ARC4_CONTROL_GEOMETRY_EVIDENCE_SCHEMA,
      rect: closeRect,
      beforePoint: closePoint,
      afterRenderPoint: { ...closePoint },
    },
  };
}

type HeartbeatMode = 'success' | 'quiesce-reject' | 'run-reject' | 'resolved-stop';

async function executeHeartbeatExpression({
  initialRunning = true,
  mode = 'success',
  includeSample = true,
}: {
  initialRunning?: boolean;
  mode?: HeartbeatMode;
  includeSample?: boolean;
} = {}): Promise<{
  evidence: Record<string, any>;
  running: boolean;
  calls: string[];
}> {
  const dom = new JSDOM(`<!doctype html><html><head><style>
    button { outline: none 3px rgb(238, 246, 255); }
    button:focus { outline: solid 3px rgb(255, 217, 106); }
  </style></head><body><aside id="survey"><div id="scroll-owner"></div></aside></body></html>`, {
    url: 'https://example.test/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });
  const view = dom.window;
  const document = view.document;
  const survey = document.getElementById('survey') as HTMLElement;
  const scroller = document.getElementById('scroll-owner') as HTMLElement;
  const token = 'glass-live-document-token';
  const calls: string[] = [];
  let running = initialRunning;
  Object.defineProperties(view, {
    innerWidth: { configurable: true, value: 320 },
    innerHeight: { configurable: true, value: 568 },
    requestAnimationFrame: {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    },
  });
  survey.getBoundingClientRect = () => ({
    left: 12, top: 102, right: 308, bottom: 196, width: 296, height: 94,
    x: 12, y: 102, toJSON: () => ({}),
  });
  const layoutTop = { tame: 1922, scavenge: 2332, sample: 2687 } as const;
  const installButtons = (restoreScavenge = false): void => {
    const verbs = includeSample ? ['tame', 'scavenge', 'sample'] : ['tame', 'scavenge'];
    scroller.replaceChildren(...verbs.map((verb) => {
      const row = document.createElement('section');
      row.dataset.semanticKey = `capture:${verb}`;
      const button = document.createElement('button');
      button.dataset.captureAction = verb;
      button.textContent = verb[0]!.toUpperCase() + verb.slice(1);
      button.getBoundingClientRect = () => {
        const top = layoutTop[verb as keyof typeof layoutTop] - scroller.scrollTop;
        return {
          left: 36, top, right: 284, bottom: top + 44, width: 248, height: 44,
          x: 36, y: top, toJSON: () => ({}),
        };
      };
      const nativeFocus = button.focus.bind(button);
      button.focus = (options?: FocusOptions) => {
        calls.push(`focus:${verb}:${options?.preventScroll === true}`);
        nativeFocus(options);
      };
      button.scrollIntoView = () => {
        calls.push(`scroll:${verb}`);
        if (verb === 'sample') scroller.scrollTop = 2_536;
      };
      row.append(button);
      return row;
    }));
    if (restoreScavenge) {
      (scroller.querySelector('[data-capture-action="scavenge"]') as HTMLElement).focus({
        preventScroll: true,
      });
    }
  };
  installButtons();
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: (x: number, y: number) => [...document.querySelectorAll<HTMLElement>('button')]
      .find((button) => {
        const rect = button.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      }) ?? null,
  });
  const api = {
    state: () => ({ persistence: { documentToken: token, heartbeatRunning: running } }),
    __smokeQuiesceF4Heartbeat: async () => {
      calls.push('quiesce');
      const wasRunning = running;
      running = false;
      if (mode === 'quiesce-reject') throw new Error('quiescence rejected');
      return {
        schema: 'cf-v2-f4-heartbeat-quiescence/v1',
        documentToken: token,
        wasRunning,
        stopped: true,
        cycleSettled: true,
      };
    },
    __smokeResumeF4Heartbeat: () => {
      calls.push('resume');
      running = true;
      return {
        schema: 'cf-v2-f4-heartbeat-resume/v1',
        documentToken: token,
        running: true,
      };
    },
    __smokeRunF4Heartbeat: async () => {
      calls.push('run');
      if (mode === 'run-reject') throw new Error('manual run rejected');
      installButtons(true);
      if (mode === 'resolved-stop') running = false;
    },
  };
  Object.defineProperty(view, '__CF_SLICE__', {
    configurable: true,
    value: { documentToken: token, api },
  });
  try {
    const expression = buildArc4AtomicGeometryEvidenceExpression({
      verb: 'sample',
      forceHeartbeatRerender: true,
    });
    const evidence = await view.eval(expression) as Record<string, any>;
    return { evidence, running, calls };
  } finally {
    view.close();
  }
}

async function executeNativeTabEvidence({
  replaceBeforeEvidence = false,
  losePriorBeforeTab = false,
  loseFocus = false,
  omitReceipt = false,
  wrongDocument = false,
  removeTarget = false,
  transparentOutline = false,
}: {
  replaceBeforeEvidence?: boolean;
  losePriorBeforeTab?: boolean;
  loseFocus?: boolean;
  omitReceipt?: boolean;
  wrongDocument?: boolean;
  removeTarget?: boolean;
  transparentOutline?: boolean;
} = {}): Promise<{
  setup: Record<string, any>;
  heartbeat: Record<string, any> | null;
  focus: Record<string, any>;
  outcome: ReturnType<typeof assessArc4NativeTabFocusEvidence>;
  oldExactObjectWouldPass: boolean;
}> {
  const dom = new JSDOM(`<!doctype html><html><head><style>
    button { outline: none 3px rgb(238, 246, 255); }
    button:focus { outline: solid 3px rgb(255, 217, 106); }
  </style></head><body><aside id="survey"><div id="scroll-owner"></div></aside></body></html>`, {
    url: 'https://example.test/',
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });
  const view = dom.window as Window & typeof globalThis & Record<string, any>;
  const document = view.document;
  const survey = document.getElementById('survey') as HTMLElement;
  const scroller = document.getElementById('scroll-owner') as HTMLElement;
  const documentToken = 'native-tab-document';
  Object.defineProperty(view, 'requestAnimationFrame', {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
  });
  Object.defineProperty(view, 'getComputedStyle', {
    configurable: true,
    value: (node: Element) => {
      const focused = document.activeElement === node;
      const outlineColor = focused && transparentOutline
        ? 'rgba(0, 0, 0, 0)'
        : (focused ? 'rgb(255, 217, 106)' : 'rgb(238, 246, 255)');
      return {
        outline: focused ? `${outlineColor} solid 3px` : `${outlineColor} none 3px`,
        outlineStyle: focused ? 'solid' : 'none',
        outlineWidth: '3px',
        outlineColor,
        boxShadow: 'none',
        borderColor: 'rgb(238, 246, 255)',
        backgroundColor: 'rgb(12, 18, 28)',
      };
    },
  });
  survey.getBoundingClientRect = () => ({
    left: 12, top: 100, right: 308, bottom: 300, width: 296, height: 200,
    x: 12, y: 100, toJSON: () => ({}),
  });
  const installButtons = (): void => {
    scroller.replaceChildren(...['tame', 'scavenge', 'sample'].map((verb, index) => {
      const row = document.createElement('section');
      row.dataset.semanticKey = `capture:${verb}`;
      const button = document.createElement('button');
      button.dataset.captureAction = verb;
      button.textContent = verb[0]!.toUpperCase() + verb.slice(1);
      button.getBoundingClientRect = () => ({
        left: 36, top: 130 + index * 48, right: 284, bottom: 174 + index * 48,
        width: 248, height: 44, x: 36, y: 130 + index * 48, toJSON: () => ({}),
      });
      const nativeMatches = button.matches.bind(button);
      button.matches = ((selector: string) => selector === ':focus-visible'
        ? document.activeElement === button
        : nativeMatches(selector)) as typeof button.matches;
      button.scrollIntoView = () => undefined;
      row.append(button);
      return row;
    }));
  };
  installButtons();
  let heartbeatRunning = true;
  const api = {
    state: () => ({ persistence: { documentToken, heartbeatRunning } }),
    __smokeQuiesceF4Heartbeat: async () => {
      const wasRunning = heartbeatRunning;
      heartbeatRunning = false;
      return {
        schema: 'cf-v2-f4-heartbeat-quiescence/v1',
        documentToken,
        wasRunning,
        stopped: true,
        cycleSettled: true,
      };
    },
    __smokeResumeF4Heartbeat: () => {
      heartbeatRunning = true;
      return {
        schema: 'cf-v2-f4-heartbeat-resume/v1',
        documentToken,
        running: true,
      };
    },
    __smokeRunF4Heartbeat: async () => {
      installButtons();
      if (!losePriorBeforeTab) {
        const replacementPrior = document.querySelector(
          '#survey button[data-capture-action="scavenge"]',
        ) as HTMLElement;
        replacementPrior.focus({ preventScroll: true });
      }
    },
  };
  Object.defineProperty(view, '__CF_SLICE__', {
    configurable: true,
    writable: true,
    value: { documentToken, api },
  });
  try {
    const setup = view.eval(
      buildArc4NativeTabFocusSetupExpression('sample', 'scavenge'),
    ) as Record<string, any>;
    const retainedTarget = view.__cfGlassArc4TabFocus.originalTarget as HTMLElement;
    const heartbeat = replaceBeforeEvidence
      ? await view.eval(buildArc4NativeTabHeartbeatRerenderExpression()) as Record<string, any>
      : null;
    const liveSample = document.querySelector(
      '#survey button[data-capture-action="sample"]',
    ) as HTMLElement;
    const livePrior = document.querySelector(
      '#survey button[data-capture-action="scavenge"]',
    ) as HTMLElement;
    if (!omitReceipt) {
      const tabOrigin = document.activeElement instanceof view.HTMLElement
        ? document.activeElement
        : document.body;
      tabOrigin.dispatchEvent(new view.KeyboardEvent('keydown', {
        key: 'Tab', code: 'Tab', bubbles: true,
      }));
      /* jsdom correctly makes synthetic events untrusted. The listener must
         first bind every other receipt field to the current replacement;
         this one assignment models only CDP's native-trust bit. */
      if (view.__cfGlassArc4TabFocus.receipt) {
        view.__cfGlassArc4TabFocus.receipt.trusted = true;
      }
      if (losePriorBeforeTab) {
        const liveTame = document.querySelector(
          '#survey button[data-capture-action="tame"]',
        ) as HTMLElement;
        liveTame.focus();
      } else {
        liveSample.focus();
      }
    } else {
      liveSample.focus();
    }
    if (loseFocus) livePrior.focus();
    if (removeTarget) liveSample.closest('[data-semantic-key]')?.remove();
    if (wrongDocument) view.__CF_SLICE__ = { documentToken: 'replacement-document' };
    const oldExactObjectWouldPass = document.activeElement === retainedTarget;
    const focus = await view.eval(
      buildArc4NativeTabFocusEvidenceExpression('sample'),
    ) as Record<string, any>;
    return {
      setup,
      heartbeat,
      focus,
      outcome: assessArc4NativeTabFocusEvidence({ setup, focus, heartbeat }),
      oldExactObjectWouldPass,
    };
  } finally {
    view.close();
  }
}

describe('Arc 4 Glass geometry evidence chronology', () => {
  it('accepts a coherent hosted witness and rejects the exact stale-scroll epoch only as instrument evidence', () => {
    const coherent = exactHostedGeometry();
    expect(assessArc4CaptureGeometryEvidenceCoherence(coherent)).toMatchObject({
      ok: true,
      checks: { carriers: true, controlsAtomic: true, closeAtomic: true },
    });

    const stale = structuredClone(coherent) as {
      controls: Array<{ beforePoint: Record<string, unknown>; afterRenderPoint: Record<string, unknown> }>;
    };
    stale.controls[2]!.beforePoint = point(160, 504.171875, null);
    stale.controls[2]!.beforePoint.tag = 'NAV';
    stale.controls[2]!.afterRenderPoint = { ...stale.controls[2]!.beforePoint };
    const outcome = assessArc4CaptureGeometryEvidenceCoherence(stale);
    expect(outcome.ok).toBe(false);
    expect(Object.entries(outcome.checks)
      .filter(([, passed]) => passed !== true)
      .map(([name]) => name)).toEqual(['controlsAtomic']);
  });

  it('reproduces prior-focused Scavenge rollback before collecting atomic Sample geometry', () => {
    const expression = buildArc4AtomicGeometryEvidenceExpression({
      verb: 'sample',
      forceHeartbeatRerender: true,
    });
    const quiesce = expression.indexOf('quiescence=await api.__smokeQuiesceF4Heartbeat()');
    const priorFocus = expression.indexOf('priorFocus.focus({preventScroll:true,focusVisible:true})', quiesce);
    const targetScroll = expression.indexOf("el.scrollIntoView({block:'nearest'", priorFocus);
    const preHeartbeat = expression.indexOf('preSnapshot=snapshot()', targetScroll);
    const run = expression.indexOf('await api.__smokeRunF4Heartbeat()', preHeartbeat);
    const postHeartbeat = expression.indexOf('const postSnapshot=snapshot()', run);
    const finalTargetFocus = expression.indexOf('try{el.focus({preventScroll:true,focusVisible:true})', postHeartbeat);
    expect(quiesce).toBeGreaterThan(-1);
    expect(priorFocus).toBeGreaterThan(quiesce);
    expect(targetScroll).toBeGreaterThan(priorFocus);
    expect(preHeartbeat).toBeGreaterThan(targetScroll);
    expect(run).toBeGreaterThan(preHeartbeat);
    expect(postHeartbeat).toBeGreaterThan(run);
    expect(finalTargetFocus).toBeGreaterThan(postHeartbeat);
    expect(expression).toContain("priorFocusRestored=post.focusVerb==='scavenge'");
    expect(expression).toContain('preTargetReady=targetReady(preSnapshot)');
    expect(expression).toContain('postTargetReady=targetReady(postSnapshot)');
    expect(expression).toContain('productOk:preTargetReady&&postTargetReady&&scrollPreserved&&priorFocusRestored');
    expect(expression).toContain('oldDisconnected:prior.isConnected===false');
    expect(expression).toContain('replacementAcquired:el instanceof HTMLElement&&el!==prior');
    expect(expression).toContain('const node=document.querySelector(selector)');
  });

  it('reacquires the semantic Sample after a heartbeat-style DOM replacement', async () => {
    const replaced = await executeNativeTabEvidence({ replaceBeforeEvidence: true });
    expect(replaced.setup).toMatchObject({
      ok: true,
      documentToken: 'native-tab-document',
      targetVerb: 'sample',
      priorVerb: 'scavenge',
    });
    expect(replaced.oldExactObjectWouldPass).toBe(false);
    expect(replaced.heartbeat).toMatchObject({
      schema: 'cf-v2-glass-arc4-native-tab-heartbeat/v1',
      required: true,
      stateFound: true,
      seamsAvailable: true,
      runCompleted: true,
      error: null,
      after: {
        heartbeatRunning: true,
        originalTargetDisconnected: true,
        originalPriorDisconnected: true,
        replacementAcquired: true,
        priorReplacementAcquired: true,
        priorFocused: true,
      },
    });
    expect(replaced.focus).toMatchObject({
      sameDocument: true,
      originalTargetDisconnected: true,
      originalPriorDisconnected: true,
      replacementAcquired: true,
      priorReplacementAcquired: true,
      nativeTabTrusted: true,
      focused: true,
      activeSemanticKey: 'capture:sample',
      semanticKey: 'capture:sample',
      scrollSettled: true,
    });
    expect(replaced.outcome).toMatchObject({
      ok: true,
      instrumentOk: true,
      productOk: true,
    });
  });

  it('keeps a trusted Tab after heartbeat focus restoration is lost and reports product red', async () => {
    const lostBeforeTab = await executeNativeTabEvidence({
      replaceBeforeEvidence: true,
      losePriorBeforeTab: true,
    });
    expect(lostBeforeTab.heartbeat).toMatchObject({
      runCompleted: true,
      error: null,
      after: {
        originalTargetDisconnected: true,
        originalPriorDisconnected: true,
        priorFocused: false,
      },
    });
    expect(lostBeforeTab.focus.receipt).toMatchObject({
      trusted: true,
      key: 'Tab',
      code: 'Tab',
      targetWasCurrent: false,
      priorFocused: false,
      priorVerb: null,
      priorSemanticKey: null,
    });
    expect(lostBeforeTab.outcome.instrumentOk).toBe(true);
    expect(lostBeforeTab.outcome.productOk).toBe(false);
    expect(lostBeforeTab.outcome.productChecks.heartbeatFocusRestored).toBe(false);
    expect(lostBeforeTab.outcome.productChecks.tabOrigin).toBe(false);
    expect(lostBeforeTab.outcome.productChecks.keyboardFocus).toBe(false);
  });

  it('rejects a transparent focus outline as an unpainted product outcome', async () => {
    const transparent = await executeNativeTabEvidence({ transparentOutline: true });
    expect(transparent.focus).toMatchObject({
      focused: true,
      focusVisible: true,
      styleChanged: true,
      decorationPainted: false,
    });
    expect(transparent.outcome.instrumentOk).toBe(true);
    expect(transparent.outcome.productOk).toBe(false);
    expect(transparent.outcome.productChecks.keyboardFocus).toBe(false);
  });

  it('separates a real focus loss from malformed or cross-document evidence', async () => {
    const lost = await executeNativeTabEvidence({ loseFocus: true });
    expect(lost.outcome.instrumentOk).toBe(true);
    expect(lost.outcome.productOk).toBe(false);
    expect(Object.entries(lost.outcome.productChecks)
      .filter(([, passed]) => passed !== true)
      .map(([name]) => name)).toEqual(['keyboardFocus', 'activeSemanticFocus']);

    const missingReceipt = await executeNativeTabEvidence({ omitReceipt: true });
    expect(missingReceipt.outcome.instrumentOk).toBe(false);
    expect(Object.entries(missingReceipt.outcome.instrumentChecks)
      .filter(([, passed]) => passed !== true)
      .map(([name]) => name)).toEqual(['trustedTabReceipt']);

    const wrongDocument = await executeNativeTabEvidence({ wrongDocument: true });
    expect(wrongDocument.outcome.instrumentOk).toBe(false);
    expect(Object.entries(wrongDocument.outcome.instrumentChecks)
      .filter(([, passed]) => passed !== true)
      .map(([name]) => name)).toEqual(['documentIdentity', 'scrollCarrier']);

    const missingTarget = await executeNativeTabEvidence({ removeTarget: true });
    expect(missingTarget.outcome.instrumentOk).toBe(true);
    expect(missingTarget.outcome.productOk).toBe(false);
    expect(missingTarget.outcome.productChecks.currentControls).toBe(false);
    expect(missingTarget.outcome.productChecks.semanticLineage).toBe(false);
  });

  it('causal-stops malformed native-Tab evidence and retains every raw carrier', () => {
    const start = glassSource.indexOf('const sampleFocusSetup = await evalIn(');
    const end = glassSource.indexOf('const close = await activateRealKeyboardControl', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const collector = glassSource.slice(start, end);
    const setup = collector.indexOf('buildArc4NativeTabFocusSetupExpression');
    const heartbeat = collector.indexOf('buildArc4NativeTabHeartbeatRerenderExpression', setup);
    const nativeTab = collector.indexOf('await pressTab()', heartbeat);
    const evidence = collector.indexOf('buildArc4NativeTabFocusEvidenceExpression', nativeTab);
    const assessment = collector.indexOf('assessArc4NativeTabFocusEvidence', evidence);
    const instrumentStop = collector.indexOf('recordInstrumentFailure', assessment);
    expect(setup).toBeGreaterThan(-1);
    expect(heartbeat).toBeGreaterThan(setup);
    expect(nativeTab).toBeGreaterThan(heartbeat);
    expect(evidence).toBeGreaterThan(nativeTab);
    expect(assessment).toBeGreaterThan(evidence);
    expect(instrumentStop).toBeGreaterThan(assessment);
    expect(collector).not.toContain('arc4NativeTabFocusEvidenceExpression');
    expect(collector).not.toContain('arc4ScrollSettleExpression');

    const diagnosticsStart = glassSource.indexOf(
      "schema: 'cf-v2-glass-arc4-native-close-diagnostics/v1'",
    );
    const diagnosticsEnd = glassSource.indexOf('};', diagnosticsStart);
    const diagnostics = glassSource.slice(diagnosticsStart, diagnosticsEnd);
    expect(diagnostics).toContain(
      'sampleFocusSetup, sampleFocusHeartbeat, sampleFocus, sampleFocusOutcome',
    );
  });

  it('refuses unhealthy heartbeat lifecycles and proves cleanup cannot hide them', () => {
    const token = 'glass-heartbeat-document';
    const baseline = {
      schema: ARC4_HEARTBEAT_RERENDER_EVIDENCE_SCHEMA,
      required: true,
      documentToken: token,
      seamsAvailable: true,
      priorFocusArmed: true,
      quiesceAttempted: true,
      initial: { documentToken: token, heartbeatRunning: true },
      pre: { documentToken: token, heartbeatRunning: false, focusVerb: 'scavenge' },
      quiescence: {
        schema: 'cf-v2-f4-heartbeat-quiescence/v1',
        documentToken: token,
        wasRunning: true,
        stopped: true,
        cycleSettled: true,
      },
      resume: {
        schema: 'cf-v2-f4-heartbeat-resume/v1',
        documentToken: token,
        running: true,
      },
      runCompleted: true,
      post: { documentToken: token, heartbeatRunning: true },
      oldDisconnected: true,
      replacementAcquired: true,
      cleanup: { attempted: false, receipt: null, error: null },
      error: null,
    };
    expect(assessArc4HeartbeatRerenderEvidence(baseline).ok).toBe(true);
    expect(assessArc4HeartbeatRerenderEvidence({
      ...baseline,
      initial: { ...baseline.initial, heartbeatRunning: false },
      quiesceAttempted: false,
      quiescence: null,
      resume: null,
      runCompleted: false,
      post: { ...baseline.post, heartbeatRunning: false },
      error: 'F4 heartbeat was not running before forced rerender',
    }).ok).toBe(false);
    const tokenMutations = [
      (value: typeof baseline) => { value.documentToken = 'replacement-document'; },
      (value: typeof baseline) => { value.initial.documentToken = 'replacement-document'; },
      (value: typeof baseline) => { value.quiescence.documentToken = 'replacement-document'; },
      (value: typeof baseline) => { value.pre.documentToken = 'replacement-document'; },
      (value: typeof baseline) => { value.resume.documentToken = 'replacement-document'; },
      (value: typeof baseline) => { value.post.documentToken = 'replacement-document'; },
    ];
    for (const mutate of tokenMutations) {
      const mutant = structuredClone(baseline);
      mutate(mutant);
      const outcome = assessArc4HeartbeatRerenderEvidence(mutant);
      expect(outcome.ok).toBe(false);
      expect(Object.entries(outcome.checks)
        .filter(([, passed]) => passed !== true)
        .map(([name]) => name)).toEqual(['documentIdentity']);
    }
    expect(assessArc4HeartbeatRerenderEvidence({
      ...baseline,
      runCompleted: false,
      error: 'manual heartbeat rejected',
      cleanup: { attempted: false, receipt: null, error: null },
    }).ok).toBe(false);
    const maskedStop = assessArc4HeartbeatRerenderEvidence({
      ...baseline,
      cleanup: {
        attempted: true,
        receipt: {
          schema: 'cf-v2-f4-heartbeat-resume/v1',
          documentToken: token,
          running: true,
        },
        error: null,
      },
    });
    expect(maskedStop.ok).toBe(false);
    expect(Object.entries(maskedStop.checks)
      .filter(([, passed]) => passed !== true)
      .map(([name]) => name)).toEqual(['cleanupSafe']);

    const expression = buildArc4AtomicGeometryEvidenceExpression({
      verb: 'sample',
      forceHeartbeatRerender: true,
    });
    expect(expression).toContain("else if(initialPersistence?.heartbeatRunning!==true)error='F4 heartbeat was not running before forced rerender';");
    expect(expression.indexOf('else{quiesceAttempted=true;try{'))
      .toBeGreaterThan(expression.indexOf('initialPersistence?.heartbeatRunning!==true'));
    expect(expression).toContain("}catch(reason){error=String(reason?.stack||reason)}finally{");
    expect(expression).toContain("if(current?.heartbeatRunning!==true){cleanup.attempted=true;");
    expect(expression).toContain("required:false,productBlocked:'missing-product-target',productOk:false");
  });

  it('wires the forced rerender only to the real small-phone Sample collector', () => {
    expect(glassSource).toContain(
      "forceHeartbeatRerender: vp.label === 'small-phone' && verb === 'sample',",
    );
  });

  it('executes heartbeat ownership safely across success and every exceptional lifecycle', async () => {
    const success = await executeHeartbeatExpression();
    expect(success.running).toBe(true);
    expect(success.calls.indexOf('quiesce'))
      .toBeLessThan(success.calls.indexOf('focus:scavenge:true'));
    expect(success.calls.indexOf('focus:scavenge:true'))
      .toBeLessThan(success.calls.indexOf('scroll:sample'));
    expect(success.calls.indexOf('scroll:sample'))
      .toBeLessThan(success.calls.indexOf('resume'));
    expect(success.calls.indexOf('resume')).toBeLessThan(success.calls.indexOf('run'));
    expect(success.evidence.rerender).toMatchObject({
      required: true,
      preTargetReady: true,
      postTargetReady: true,
      scrollPreserved: true,
      priorFocusRestored: true,
      productOk: true,
      cleanup: { attempted: false, receipt: null, error: null },
    });
    expect(assessArc4HeartbeatRerenderEvidence(success.evidence.rerender).ok).toBe(true);

    const initiallyStopped = await executeHeartbeatExpression({ initialRunning: false });
    expect(initiallyStopped.running).toBe(false);
    expect(initiallyStopped.calls).not.toContain('quiesce');
    expect(initiallyStopped.calls).not.toContain('resume');
    expect(initiallyStopped.calls).not.toContain('run');
    expect(assessArc4HeartbeatRerenderEvidence(initiallyStopped.evidence.rerender).ok)
      .toBe(false);

    const quiesceRejected = await executeHeartbeatExpression({ mode: 'quiesce-reject' });
    expect(quiesceRejected.running).toBe(true);
    expect(quiesceRejected.calls.filter((call) => call === 'quiesce')).toHaveLength(1);
    expect(quiesceRejected.calls.filter((call) => call === 'resume')).toHaveLength(1);
    expect(quiesceRejected.calls).not.toContain('run');
    expect(quiesceRejected.evidence.rerender.cleanup).toMatchObject({
      attempted: true,
      receipt: { running: true },
      error: null,
    });
    expect(assessArc4HeartbeatRerenderEvidence(quiesceRejected.evidence.rerender).ok)
      .toBe(false);

    const runRejected = await executeHeartbeatExpression({ mode: 'run-reject' });
    expect(runRejected.running).toBe(true);
    expect(runRejected.calls.filter((call) => call === 'resume')).toHaveLength(1);
    expect(runRejected.evidence.rerender.cleanup).toEqual({
      attempted: false,
      receipt: null,
      error: null,
    });
    expect(assessArc4HeartbeatRerenderEvidence(runRejected.evidence.rerender).ok)
      .toBe(false);

    const silentlyStopped = await executeHeartbeatExpression({ mode: 'resolved-stop' });
    expect(silentlyStopped.running).toBe(true);
    expect(silentlyStopped.calls.filter((call) => call === 'resume')).toHaveLength(2);
    const silentAssessment = assessArc4HeartbeatRerenderEvidence(
      silentlyStopped.evidence.rerender,
    );
    expect(silentAssessment.ok).toBe(false);
    expect(Object.entries(silentAssessment.checks)
      .filter(([, passed]) => passed !== true)
      .map(([name]) => name)).toEqual(['cleanupSafe']);
  });

  it('leaves a missing forced-leg Sample to the product geometry verdict', async () => {
    const missing = await executeHeartbeatExpression({ includeSample: false });
    expect(missing.calls).toEqual([]);
    expect(missing.evidence).toMatchObject({
      why: 'missing-product-target',
      buttonRect: null,
      rerender: {
        required: false,
        productBlocked: 'missing-product-target',
        productOk: false,
      },
    });
    expect(assessArc4HeartbeatRerenderEvidence(missing.evidence.rerender).ok).toBe(true);
    expect(assessArc4HeartbeatRerenderEvidence({
      ...missing.evidence.rerender,
      schema: 'wrong-schema',
    }).ok).toBe(false);
    expect(assessArc4HeartbeatRerenderEvidence({ required: false }).ok).toBe(false);
  });

  it('causal-stops incoherent evidence before it can become a product geometry verdict', () => {
    const start = glassSource.indexOf('const arc4ControlsGeometry = [];');
    const end = glassSource.indexOf('const arc4AfterDurable =', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const collector = glassSource.slice(start, end);
    expect(collector).not.toContain('arc4ScrollSettleExpression(selector)');
    const coherence = collector.indexOf('assessArc4CaptureGeometryEvidenceCoherence');
    const instrumentStop = collector.indexOf('recordInstrumentFailure', coherence);
    const productAssessment = collector.indexOf('assessArc4CaptureCardGeometryFocus');
    expect(coherence).toBeGreaterThan(-1);
    expect(instrumentStop).toBeGreaterThan(coherence);
    expect(productAssessment).toBeGreaterThan(instrumentStop);
  });
});
