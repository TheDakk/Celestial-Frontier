import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable browser evidence contract intentionally has no declaration shim.
import { ARC4_CONTROL_GEOMETRY_EVIDENCE_SCHEMA, ARC4_HEARTBEAT_RERENDER_EVIDENCE_SCHEMA, assessArc4CaptureGeometryEvidenceCoherence, assessArc4HeartbeatRerenderEvidence } from '../tools/arc4-browser-contract.mjs';
import { buildArc4AtomicGeometryEvidenceExpression } from '../tools/glassmatrix.mjs';

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
