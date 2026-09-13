import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';

const glass = readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
const frames = readFileSync(new URL('../tools/ui-review-evaluation.mjs', import.meta.url), 'utf8');
const start = 'export async function surveyLiveToastSettlement(', end = 'const here = path.dirname(';
expect(glass.split(start)).toHaveLength(2); expect(glass.split(end)).toHaveLength(2);
const ownerSource = glass.slice(glass.indexOf(start), glass.indexOf(end)).replace(/^export /gm, '');
const frameSource = frames.slice(frames.indexOf('export function assessReviewFrameSettlement(')).replace(/^export /gm, '');

const closeStart = '  const closeIntegrityOutcome =', closeEnd = '  const rightBottomAnchorOutcome =';
expect(glass.split(closeStart)).toHaveLength(2); expect(glass.split(closeEnd)).toHaveLength(2);
const closeSource = glass.slice(glass.indexOf(closeStart), glass.indexOf(closeEnd));

async function receiptFixture(settledSurveyHeight = 88) {
  let at = 10, floor = 120, surveyHeight = 44, toastOn = true, releaseFonts!: () => void;
  const callbacks: Array<() => void> = [];
  const fonts = { status: 'loading', ready: new Promise<void>(resolve => { releaseFonts = resolve; }) };
  const nodes = new Map(['toast', 'hintpill', 'ctxbar', 'survey', 'header', 'close'].map(id => [id, {
    style: { opacity: '1' }, textContent: id === 'toast' ? 'Beyond Your Charter — Build the required drive.' : id,
    offsetWidth: 296, clientWidth: 294,
    querySelectorAll: (selector: string): unknown[] => id === 'survey' && selector === '[data-survey-close]' ? [nodes.get('close')] : [],
    getBoundingClientRect: () => id === 'close' ? { left: 249, top: 147, right: 293, bottom: 191, width: 44, height: 44 }
      : { left: 12, top: 132, right: 308, bottom: 132 + (id === 'survey' ? surveyHeight : 44),
        width: 296, height: id === 'survey' ? surveyHeight : 44 },
  }]));
  const root = {};
  const window = { __CF_SLICE__: { api: { state: () => ({ toastSerial: 7, toastOn, mode: 'system', star: 424242, cardOpen: true }) } },
    __CF_GLASS_AUDIT__: {} as { closeIntegrityOutcome: (...args: string[]) => any } };
  const document = { documentElement: root, fonts, visibilityState: 'visible', getElementById: (id: string) => nodes.get(id),
    querySelector: (selector: string) => nodes.get(selector === '#survey' ? 'survey' : selector.includes('survey-head') ? 'header' : 'close'),
    elementFromPoint: () => nodes.get('close') };
  const owners = runInNewContext(frameSource + closeSource + ownerSource
    + '\nwindow.__CF_GLASS_AUDIT__ = {closeIntegrityOutcome};'
    + '\n({surveyLiveToastSettlement,assessSurveyLiveToastSettlement,reviewFrameSettlement,readReviewFrameSettlements})', {
    window, document, HTMLElement: Object, visible: () => true, selectorName: () => 'div.survey-head > button.surface-close',
    round: (n: number) => Math.round(n * 100) / 100,
    innerWidth: 320, innerHeight: 568, performance: { now: () => ++at, timeOrigin: 1000 },
    requestAnimationFrame: (callback: () => void) => callbacks.push(callback),
    getComputedStyle: (node: unknown) => node === root ? { getPropertyValue: (name: string) => String(name === '--cf-sheet-floor' ? floor : 367.5) }
      : { display: 'block', visibility: 'visible', opacity: node === nodes.get('toast') && !toastOn ? '0' : '1', minHeight: '0px', maxHeight: '44px',
        paddingTop: '14px', paddingBottom: '14px', borderTopWidth: '1px', borderBottomWidth: '1px' },
  });
  const pending = owners.surveyLiveToastSettlement(owners.reviewFrameSettlement, owners.readReviewFrameSettlements);
  expect(callbacks).toHaveLength(0);
  fonts.status = 'loaded'; releaseFonts(); await Promise.resolve(); await Promise.resolve();
  expect(callbacks).toHaveLength(1); callbacks.shift()!();
  expect(callbacks).toHaveLength(1); floor = 220; surveyHeight = settledSurveyHeight; callbacks.shift()!();
  const receipt = JSON.parse(JSON.stringify(await pending));
  return { receipt, assess: (value: unknown) => owners.assessSurveyLiveToastSettlement(value, { width: 320, height: 568 }),
    expireToastAndExpand: () => { toastOn = false; nodes.get('toast')!.style.opacity = '0'; surveyHeight = 88;
      return window.__CF_GLASS_AUDIT__.closeIntegrityOutcome('#survey', '[data-survey-close]', '[data-pnx]'); } };
}

it('brackets the same live toast and actual Survey snapshots with exactly one canonical fonts/two-frame settlement', async () => {
  const { receipt, assess } = await receiptFixture();
  expect(assess(receipt)).toEqual({ ok: true, errors: [] });
  expect(receipt.before.sheetFloor).toBe(120); expect(receipt.after.sheetFloor).toBe(220);
  expect(receipt.before.geometry.survey.height).toBe(44); expect(receipt.after.geometry.survey.height).toBe(88);
  expect(receipt.before.geometry.close.paddingTop).toBe('14px');
  expect(receipt.closeOutcome.ok).toBe(true);
  expect(receipt.frame.phases.map((phase: any) => phase.phase)).toEqual(['fonts-wait', 'fonts-ready', 'frame1', 'frame2', 'settled']);
  const transition = glass.slice(glass.indexOf('        const surveySettlement ='), glass.indexOf('        const chromeYieldCheck ='));
  expect(transition).toContain('GLASS SURVEY LIVE-TOAST SETTLEMENT');
  expect(transition).toContain('if (!surveySettlementVerdict.ok) recordInstrumentFailure(');
  expect(glass.indexOf(transition)).toBeLessThan(glass.indexOf("addOutcome(vp.label, 'survey', 'SURVEY_CLOSE_INTEGRITY'"));
});

it('rejects stale frame receipts, changed or expired toasts, and incomplete geometry as causal evidence', async () => {
  const { receipt, assess } = await receiptFixture();
  const faults = [
    (r: any) => { r.frame.id += 1; },
    (r: any) => { r.frame.label = 'prior-layout'; },
    (r: any) => { r.frame.phases.splice(3, 1); },
    (r: any) => { r.before.at = r.frame.phases[0].at + 1; },
    (r: any) => { r.after.toast.serial += 1; },
    (r: any) => { r.after.toast.text = 'Another message'; },
    (r: any) => { r.after.toast.inlineOpacity = '0'; },
    (r: any) => { r.after.toast.computedOpacity = 0; },
    (r: any) => { r.after.toast.on = false; },
    (r: any) => { r.after.geometry.header = null; },
    (r: any) => { delete r.closeOutcome; },
    (r: any) => { r.closeOutcome.ok = undefined; },
    (r: any) => { r.closeOutcome.root[3] += 44; },
  ];
  for (const fault of faults) { const broken = structuredClone(receipt); fault(broken); expect(assess(broken).ok).toBe(false); }
  expect(assess(receipt).ok).toBe(true);
});

it('retains the canonical settled Close red even when a later toast expiry would make the same check green', async () => {
  const { receipt, assess, expireToastAndExpand } = await receiptFixture(44);
  expect(assess(receipt)).toEqual({ ok: true, errors: [] });
  expect(receipt.closeOutcome).toMatchObject({ ok: false, inside: false, root: [12, 132, 308, 176], close: [249, 147, 293, 191] });
  const later = expireToastAndExpand();
  expect(later.ok).toBe(true);
  const outcomeStart = "        addOutcome(vp.label, 'survey', 'SURVEY_CLOSE_INTEGRITY'";
  const outcomeEnd = '        const surveyDisclosure =';
  expect(glass.split(outcomeStart)).toHaveLength(2); expect(glass.split(outcomeEnd)).toHaveLength(2);
  const calls: unknown[][] = []; let remeasurements = 0;
  await runInNewContext('(async () => {' + glass.slice(glass.indexOf(outcomeStart), glass.indexOf(outcomeEnd)) + '})()', {
    vp: { label: 'small-phone' }, surveySettlement: receipt,
    addOutcome: (...args: unknown[]) => calls.push(args), evalIn: () => { remeasurements++; return later; },
  });
  expect(remeasurements).toBe(0); expect(calls).toHaveLength(1);
  expect(calls[0]![4]).toBe(receipt.closeOutcome);
  expect(receipt.closeOutcome.ok).toBe(false);
});
