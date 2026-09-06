import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { describe, expect, it } from 'vitest';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const source = readFileSync(new URL('../tools/ui-sheet-review.mjs', import.meta.url), 'utf8');
const start = 'export function readSheetGeometry()', end = 'export async function runUiSheetReview(';
expect(source.split(start)).toHaveLength(2); expect(source.split(end)).toHaveLength(2);
const helpers = source.slice(source.indexOf(start), source.indexOf(end)).replace(/^export /gm, '');
const rect = (left: number, top: number, width: number, height: number, extra = {}) => ({ left, top, right: left + width,
  bottom: top + height, width, height, visible: true, position: 'fixed', ...extra });
function baseline() {
  return { viewport: { width: 320, height: 568 }, overflow: false,
    roots: { setpanel: rect(8, 110, 270, 200, { z: 48 }), tutcard: rect(0, 100, 300, 210, { z: 45 }),
      survey: null, planetside: rect(12, 240, 296, 110), toast: rect(12, 358, 296, 40),
      hintpill: rect(12, 410, 296, 32), ctxbar: null, dock: rect(10, 464, 300, 92) },
    header: rect(22, 124, 190, 44, { position: 'sticky' }), close: rect(220, 124, 44, 44, { position: 'sticky' }),
    closeCount: 1, closeNative: true, closeHit: true, closeName: 'Close Settings' };
}
function owners() {
  return runInNewContext(helpers + '\n({ assessSheetGeometry })');
}
function domOwners() {
  const dom = new JSDOM('<!doctype html><body class="native"><div id="planetside"><button data-native>Preserved listener</button></div><div id="toast" style=""></div><aside id="setpanel" class="panel"><h3 class="sheet-header">Settings</h3></aside><div id="tutcard"></div></body>', { runScripts: 'outside-only' });
  dom.window.eval(helpers);
  for (const id of ['planetside', 'tutcard']) dom.window.document.getElementById(id).getBoundingClientRect = () => rect(12, 240, 296, 110);
  return dom;
}

describe('U2 diagnostic executes its retained source owners', () => {
  it('accepts bounded populated lanes and detects the exact retained 22.5px phone overlap', () => {
    const { assessSheetGeometry } = owners(), good = baseline();
    expect(assessSheetGeometry(good, { panel: true, training: true, fixture: true }).pass).toBe(true);
    const red = baseline(); red.roots.planetside = rect(12, 210, 296, 180); red.roots.hintpill = rect(12, 367.5, 296, 76.5);
    expect(assessSheetGeometry(red, { fixture: true }).errors).toContain('planetside-hintpill');
    red.roots.toast = rect(12, 230, 296, 44);
    expect(assessSheetGeometry(red, { fixture: true }).errors).toContain('toast-planetside');
  });
  it('rejects empty fixtures, static/offscreen headers, unavailable Close, and reversed Training order', () => {
    const { assessSheetGeometry } = owners();
    for (const [mutate, error] of [
      [(v: any) => { v.roots.planetside.visible = false; }, 'fixture-empty'],
      [(v: any) => { v.header.position = 'static'; }, 'panel-header'],
      [(v: any) => { v.header.top = -100; }, 'panel-header'],
      [(v: any) => { v.close.width = 43; }, 'panel-close'],
      [(v: any) => { v.closeCount = 2; }, 'panel-close'],
      [(v: any) => { v.closeHit = false; }, 'panel-close'],
      [(v: any) => { v.roots.setpanel.z = 44; }, 'settings-training-order'],
    ] as const) { const value = baseline(); mutate(value); expect(assessSheetGeometry(value, { panel: true, training: true, fixture: true }).errors).toContain(error); }
  });
  it('restores fixture attributes and original child/listener identities without reinserting body children', () => {
    const dom = domOwners(), w = dom.window, body = w.document.body, child = w.document.querySelector('[data-native]');
    const prior = body.innerHTML; let calls = 0; child.addEventListener('click', () => calls++);
    body.replaceChildren = () => { throw new Error('must not reinsert the live game body'); };
    expect(w.sheetFixture().scope).toContain('presentation-only');
    const receipts = w.sheetFixture(true);
    expect(receipts.every((r: any) => r.attributesExact && r.childrenExact)).toBe(true);
    expect(body.innerHTML).toBe(prior); expect(w.document.querySelector('[data-native]')).toBe(child);
    child.click(); expect(calls).toBe(1); dom.window.close();
  });
  it('restores absent and empty inline styles distinctly after the actual toast-over-biosphere fault', () => {
    const dom = domOwners(), w = dom.window, toast = w.document.getElementById('toast');
    for (const before of [null, '', 'opacity: 0.5;']) {
      before === null ? toast.removeAttribute('style') : toast.setAttribute('style', before);
      w.sheetFault('toast-over-biosphere'); expect(toast.style.getPropertyPriority('top')).toBe('important');
      expect(toast.style.top).toBe('240px'); expect(w.sheetFault('', true).exactStyle).toBe(true);
      expect(toast.getAttribute('style')).toBe(before);
    }
    dom.window.close();
  });
  it('moves the exact ineffective earlier sticky fix after its equal-specificity static fault, then removes both', () => {
    const dom = domOwners(), w = dom.window, head = w.document.head;
    w.sheetFault('earlier-equal-specificity'); const [fix, fault] = [...head.querySelectorAll('style')];
    expect(fix.textContent).toBe('.panel .sheet-header{position:sticky}'); expect(fault.textContent).toBe('.panel .sheet-header{position:static}');
    expect(w.sheetFault('earlier-fix-last').movedExactFix).toBe(true); expect(head.lastElementChild).toBe(fix);
    expect(w.sheetFault('', true).stylesheetRemoved).toBe(true); expect(head.querySelectorAll('style')).toHaveLength(0);
    dom.window.close();
  });
  it('reveals both sides of the retained 568↔808 scroll oscillation with one measured wheel displacement', () => {
    const dom = domOwners(), w = dom.window, panel = w.document.getElementById('setpanel');
    const target = w.document.createElement('button'); target.id = 'setcharts'; panel.append(target);
    panel.getBoundingClientRect = () => rect(8, 120, 304, 256.25);
    panel.querySelector('.sheet-header').getBoundingClientRect = () => rect(23, 135, 182, 44);
    for (const top of [130, 370]) {
      let actualTop = top;
      target.getBoundingClientRect = () => rect(80, actualTop, 44, 44);
      const before = w.readSettingsReveal('#setcharts'); expect(before.inside).toBe(false);
      actualTop -= before.delta;
      const after = w.readSettingsReveal('#setcharts');
      expect(after.inside).toBe(true); expect(after.delta).toBe(0);
      expect(after.target.top).toBeGreaterThanOrEqual(187);
      expect(after.target.bottom).toBeLessThanOrEqual(368.25);
    }
    target.getBoundingClientRect = () => rect(80, 180, 44, 200);
    expect(() => w.readSettingsReveal('#setcharts')).toThrow('cannot fit');
    dom.window.close();
  });
  it('keeps the first fault failure when exact restoration also fails', async () => {
    const begin = '    const control = async (kind, options) => {', finish = '    for (const viewport of U2_VIEWPORTS)';
    expect(source.split(begin)).toHaveLength(2); expect(source.split(finish)).toHaveLength(2);
    const row: any = { controls: [] }, primary = new Error('first fault dispatch failed'), cleanup = new Error('restoration frames failed');
    const control = runInNewContext(source.slice(source.indexOf(begin), source.indexOf(finish)) + '\ncontrol', {
      row, assert, state: async () => baseline(), write: () => {}, faultActive: false,
      sheetFault: () => {}, assessSheetGeometry: owners().assessSheetGeometry,
      evaluate: async (_: string, label: string) => { if (label.startsWith('fault.header')) throw primary; return { exactStyle: true, stylesheetRemoved: true }; },
      frames: async () => { throw cleanup; },
    });
    await expect(control('header-not-sticky', { panel: true })).rejects.toBe(primary);
    expect(row.controls[0].firstFailure).toContain(primary.message); expect(row.controls[0].cleanupFailure).toContain(cleanup.message);
  });
});
