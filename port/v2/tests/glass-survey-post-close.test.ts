import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

const glass = readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
const frames = readFileSync(new URL('../tools/ui-review-evaluation.mjs', import.meta.url), 'utf8');
const extract = (source: string, start: string, end: string) => {
  expect(source.split(start)).toHaveLength(2); expect(source.split(end)).toHaveLength(2);
  return source.slice(source.indexOf(start), source.indexOf(end)).replace(/^export /gm, '');
};
const ownerSource = extract(glass, 'export async function surveyPostCloseSettlement(', 'const here = path.dirname(');
const frameSource = frames.slice(frames.indexOf('export function assessReviewFrameSettlement(')).replace(/^export /gm, '');
const viewport = { width: 320, height: 568 };
const label = 'post-close.top-chrome.fonts-two-frames';
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};
type Options = {
  initial?: unknown; activation?: unknown; delayed?: boolean; waitError?: string; leaveOpen?: boolean;
  waitOutcome?: unknown; malformedRead?: { index: number; value: unknown }; reopenAtSettlement?: boolean;
};
function fixture(options: Options = {}) {
  let at = 10, cardOpen = Object.hasOwn(options, 'initial') ? options.initial : false, reads = 0;
  const calls: string[] = [], callbacks: Array<() => void> = [];
  const fontsReady = deferred<void>(), waitStarted = deferred<void>(), releaseClose = deferred<void>();
  const settleStarted = deferred<void>(), frameQueued = deferred<void>();
  const fonts = { status: 'loading', ready: fontsReady.promise };
  const window = { __cfU1ReviewFrameSettlements: { schema: 'cf-u1-review-frame-settlement/v1', invocations: [], overflow: false } };
  const owners = runInNewContext(frameSource + ownerSource + '\n({surveyPostCloseSettlement,assessSurveyPostClose,reviewFrameSettlement,readReviewFrameSettlements})', {
    window, document: { fonts, visibilityState: 'visible' }, innerWidth: viewport.width, innerHeight: viewport.height,
    performance: { now: () => ++at, timeOrigin: 1000 },
    requestAnimationFrame: (callback: () => void) => { callbacks.push(callback); frameQueued.resolve(); },
  });
  const readState = () => ({ cardOpen: ++reads === options.malformedRead?.index ? options.malformedRead?.value : cardOpen,
    at: ++at, timeOrigin: 1000, viewport: { ...viewport } });
  const pending = owners.surveyPostCloseSettlement(readState, async () => {
    calls.push('activate');
    return Object.hasOwn(options, 'activation') ? options.activation : { ok: true, trusted: true };
  }, async () => {
    calls.push('wait'); waitStarted.resolve();
    if (options.waitError) throw new Error(options.waitError);
    if (options.delayed) await releaseClose.promise;
    if (!options.leaveOpen) cardOpen = false;
    return Object.hasOwn(options, 'waitOutcome') ? options.waitOutcome : false;
  }, (name: string) => {
    calls.push('settle:' + name);
    const pendingFrames = owners.reviewFrameSettlement(name); settleStarted.resolve(); return pendingFrames;
  }, owners.readReviewFrameSettlements);
  const finishFrames = async () => {
    await settleStarted.promise;
    expect(callbacks).toHaveLength(0); expect(fonts.status).toBe('loading');
    fonts.status = 'loaded'; fontsReady.resolve(); await frameQueued.promise;
    expect(callbacks).toHaveLength(1); callbacks.shift()!();
    expect(callbacks).toHaveLength(1);
    if (options.reopenAtSettlement) cardOpen = true;
    callbacks.shift()!(); expect(callbacks).toHaveLength(0);
    return JSON.parse(JSON.stringify(await pending));
  };
  return { calls, pending, finishFrames, waitStarted: waitStarted.promise, releaseClose: () => releaseClose.resolve(),
    readCount: () => reads, cardOpen: () => cardOpen,
    assess: (receipt: any) => owners.assessSurveyPostClose(receipt, viewport) };
}

it('leaves an already-closed Survey untouched and owns one real fonts/two-frame boundary', async () => {
  const f = fixture(), receipt = await f.finishFrames();
  expect(f.assess(receipt)).toEqual({ ok: true, errors: [] });
  expect(f.calls).toEqual(['settle:' + label]); expect(f.readCount()).toBe(3);
  expect(receipt).toMatchObject({ activation: null, waitOutcome: null, expectedFrameId: 1,
    before: { cardOpen: false }, afterClose: { cardOpen: false }, settled: { cardOpen: false }, frame: { id: 1, label } });
  expect(receipt.frame.phases.map((phase: any) => phase.phase)).toEqual(['fonts-wait', 'fonts-ready', 'frame1', 'frame2', 'settled']);
});

it('waits for delayed closure after the activation receipt already resolves, without a second toggle', async () => {
  const f = fixture({ initial: true, delayed: true });
  await f.waitStarted;
  expect(f.calls).toEqual(['activate', 'wait']); expect(f.cardOpen()).toBe(true); expect(f.readCount()).toBe(1);
  f.releaseClose(); const receipt = await f.finishFrames();
  expect(f.calls).toEqual(['activate', 'wait', 'settle:' + label]); expect(f.readCount()).toBe(3);
  expect(receipt).toMatchObject({ before: { cardOpen: true }, activation: { ok: true }, waitOutcome: false,
    afterClose: { cardOpen: false }, settled: { cardOpen: false } });
  expect(f.assess(receipt)).toEqual({ ok: true, errors: [] });
});

it('stops on refused or malformed activation receipts before waiting or settling', async () => {
  for (const activation of [{ ok: false }, null, undefined, { ok: 'true' }]) {
    const f = fixture({ initial: true, activation }), receipt = await f.pending;
    expect(f.calls).toEqual(['activate']); expect(f.readCount()).toBe(1);
    expect(receipt.error).toContain('native activation refused'); expect(f.assess(receipt).ok).toBe(false);
  }
});

it('rejects nonboolean state before activation, after closure and after native frames', async () => {
  for (const value of [null, undefined, 'false', 0]) {
    const before = fixture({ initial: value }), beforeReceipt = await before.pending;
    expect(before.calls).toEqual([]); expect(beforeReceipt.error).toContain('not a strict boolean');
    expect(before.assess(beforeReceipt).ok).toBe(false);
    const after = fixture({ initial: true, malformedRead: { index: 2, value } }), afterReceipt = await after.pending;
    expect(after.calls).toEqual(['activate', 'wait']); expect(afterReceipt.error).toContain('not a strict boolean');
    expect(after.assess(afterReceipt).ok).toBe(false);
    const settled = fixture({ malformedRead: { index: 3, value } }), settledReceipt = await settled.finishFrames();
    expect(settled.calls).toEqual(['settle:' + label]); expect(settledReceipt.error).toContain('not a strict boolean');
    expect(settled.assess(settledReceipt).ok).toBe(false);
  }
});

it('retains a bounded close-wait failure and rejects a lying closed result without retoggling', async () => {
  const timeout = fixture({ initial: true, waitError: 'closed state did not arrive within 5000ms (last true)' });
  const timeoutReceipt = await timeout.pending;
  expect(timeout.calls).toEqual(['activate', 'wait']); expect(timeout.cardOpen()).toBe(true);
  expect(timeoutReceipt.error).toContain('closed state did not arrive within 5000ms (last true)');
  expect(timeout.assess(timeoutReceipt).ok).toBe(false);
  const lying = fixture({ initial: true, leaveOpen: true }), lyingReceipt = await lying.pending;
  expect(lying.calls).toEqual(['activate', 'wait']); expect(lyingReceipt.error).toContain('card remained open');
  expect(lying.assess(lyingReceipt).ok).toBe(false);
});

it('accepts only literal false from the close wait and rejects reopening during settlement', async () => {
  for (const waitOutcome of [undefined, null, true, 'false', 0]) {
    const f = fixture({ initial: true, waitOutcome }), receipt = await f.pending;
    expect(f.calls).toEqual(['activate', 'wait']); expect(receipt.error).toContain('wait did not observe strict false');
    expect(f.assess(receipt).ok).toBe(false);
  }
  const reopened = fixture({ reopenAtSettlement: true }), receipt = await reopened.finishFrames();
  expect(receipt.error).toBe(null); expect(receipt.settled.cardOpen).toBe(true);
  expect(reopened.calls).toEqual(['settle:' + label]); expect(reopened.assess(receipt).ok).toBe(false);
});

it('rejects missing, stale and incoherent frame, state, timing and activation evidence', async () => {
  const f = fixture(), valid = await f.finishFrames();
  const faults: Array<(receipt: any) => void> = [
    r => { r.label = 'prior-close'; }, r => { r.frame.label = 'prior-close'; }, r => { r.frame.id++; },
    r => { r.expectedFrameId++; }, r => { r.expectedFrameId = null; }, r => { r.overflow = true; }, r => { delete r.overflow; },
    r => { delete r.frame; }, r => { r.frame.status = 'pending'; }, r => { r.frame.phases.splice(2, 1); }, r => { r.frame.phases = {}; },
    r => { r.frame.phases[2].timeOrigin++; }, r => { r.frame.phases.at(-1).viewport.width++; },
    r => { r.before.cardOpen = 'false'; }, r => { r.afterClose.cardOpen = true; }, r => { r.settled.cardOpen = true; },
    r => { r.afterClose.timeOrigin++; }, r => { r.settled.viewport.height++; }, r => { r.before.at = Infinity; },
    r => { r.afterClose.at = r.before.at - 1; }, r => { r.afterClose.at = r.frame.phases[0].at + 1; },
    r => { r.settled.at = r.frame.phases.at(-1).at - 1; }, r => { delete r.settled; },
    r => { r.activation = { ok: true }; }, r => { r.waitOutcome = false; }, r => { r.error = 'settlement failed'; },
  ];
  expect(f.assess(valid)).toEqual({ ok: true, errors: [] });
  for (const fault of faults) { const broken = structuredClone(valid); fault(broken); expect(f.assess(broken).ok).toBe(false); }
  expect(f.assess(null).ok).toBe(false);
  const opened = fixture({ initial: true }), openReceipt = await opened.finishFrames();
  expect(opened.assess(openReceipt).ok).toBe(true);
  for (const mutate of [(r: any) => { r.activation = null; }, (r: any) => { r.activation.ok = false; },
    (r: any) => { r.waitOutcome = null; }]) {
    const broken = structuredClone(openReceipt); mutate(broken); expect(opened.assess(broken).ok).toBe(false);
  }
});

it('executes the real call site with native input, strict raw-state acceptance and the existing 5000ms bound', async () => {
  const callSite = extract(glass, '        const topChromeState =', "        await waitFor('deferred lower/top chrome measurement after survey close'");
  for (const initiallyOpen of [false, true]) {
    let cardOpen = initiallyOpen, at = 0;
    const activations: unknown[][] = [], waits: unknown[][] = [];
    const window = { __CF_SLICE__: { api: { state: () => ({ cardOpen }) } },
      __cfU1ReviewFrameSettlements: { schema: 'cf-u1-review-frame-settlement/v1', invocations: [] as any[], overflow: false } };
    const browser = { window, innerWidth: viewport.width, innerHeight: viewport.height,
      document: { fonts: { status: 'loaded', ready: Promise.resolve() }, visibilityState: 'visible' },
      performance: { now: () => ++at, timeOrigin: 1000 }, requestAnimationFrame: (callback: () => void) => callback() };
    const evalIn = (expression: string) => runInNewContext(expression, browser);
    const owners = runInNewContext(frameSource + ownerSource + '\n({surveyPostCloseSettlement,assessSurveyPostClose,reviewFrameSettlement,readReviewFrameSettlements,paintedPostCloseFixedRows,postCloseFrameSettlement,assessPostCloseFrameSettlement})', browser);
    const receipt = await runInNewContext('(async()=>{' + callSite + '\nreturn topChromeClose;})()', {
      ...owners, vp: { ...viewport, label: 'small-phone' }, evalIn,
      activateRealControl: (...args: unknown[]) => { activations.push(args); cardOpen = false; return { ok: true }; },
      waitFor: async (name: string, expression: string, timeout: number, accept: (value: unknown) => boolean) => {
        waits.push([name, expression, timeout]);
        expect(accept(false)).toBe(true);
        for (const value of [true, null, undefined, 0, '', 'false']) expect(accept(value)).toBe(false);
        const observed = await evalIn(expression); expect(accept(observed)).toBe(true); return observed;
      },
      stopInstrumentControl: (message: string) => { throw new Error(message); },
    });
    expect(owners.assessSurveyPostClose(receipt, viewport)).toEqual({ ok: true, errors: [] });
    expect(activations).toEqual(initiallyOpen ? [['#docksurvey', 'close Survey for top-chrome clearance', { maxScrolls: 0, scrolling: false }]] : []);
    expect(waits).toEqual(initiallyOpen ? [['survey closed for top-chrome clearance', 'window.__CF_SLICE__.api.state().cardOpen', 5000]] : []);
    expect(window.__cfU1ReviewFrameSettlements.invocations).toHaveLength(1);
    expect(window.__cfU1ReviewFrameSettlements.invocations[0]).toMatchObject({ label, status: 'settled' });
  }
});
