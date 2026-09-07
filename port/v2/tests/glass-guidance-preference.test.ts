import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { afterEach, expect, it } from 'vitest';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const glass = readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
const extract = (start: string, end: string) => { expect(glass.split(start)).toHaveLength(2); expect(glass.split(end)).toHaveLength(2);
  return glass.slice(glass.indexOf(start), glass.indexOf(end)); };
const source = extract('  const visible = (el) => {', '  const box = (el) => {')
  + extract('  const expectedCssColor = (value) => {', '  const choiceOutcome = (rootSelector, itemSelector, expectedSelector, requireFocus = true) => {');
const cleanups: Array<() => void> = [];
afterEach(() => { for (const dispose of cleanups.splice(0)) dispose(); });
function fixture() {
  const dom = new JSDOM('<!doctype html><body class="surface-mode card-open fs-xl tone-max font-mono"><div id="survey"><div class="survey-head">Survey</div></div><div id="chpanel" class="panel" aria-hidden="true" style="display:none"><h3 class="sheet-header">Charters</h3></div><div id="planetside">Biosphere</div><div id="topbar"><div id="status">Status</div><div id="objchip">Objective</div></div><div id="toast" style="opacity:1">Notice</div><div id="ctxbar" class="scene-caption sheet-guidance-yield" aria-label="Scene context">Earth · Biosphere</div><div id="dock">Dock</div><div id="hintpill" class="scene-hint  sheet-guidance-yield" aria-label="Scene guidance">Leave <b>world</b> to lift off</div></body>');
  cleanups.push(() => dom.window.close()); const { document } = dom.window, hint = document.getElementById('hintpill'), ctx = document.getElementById('ctxbar');
  const state = { mode: 'surface', cardOpen: true }, faults: Record<string, any> = {};
  const rootValues: Record<string, string> = { '--safe-bottom': '0px', '--cf-lower-top': '464px', '--cf-toast-height': '52.5px', '--cf-survey-min-height': '139px', '--cf-survey-start': '132px' };
  document.documentElement.style.setProperty('--hint-h', '1px', 'important');
  const contextHidden = (node: any) => node === ctx && document.body.classList.contains('card-open');
  for (const node of document.querySelectorAll('*')) {
    Object.defineProperty(node, 'offsetHeight', { configurable: true, get: () => Math.round(node.getBoundingClientRect().height) });
    node.getBoundingClientRect = () => {
      const yielded = (node === hint || node === ctx) && node.classList.contains('sheet-guidance-yield');
      if (node.style.display === 'none' || contextHidden(node)) return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
      const hintHeight = parseFloat(document.documentElement.style.getPropertyValue('--hint-h')) || 0;
      const top = node === hint ? yielded ? 444 : faults.nativeTop ?? 367.5
        : node === ctx ? yielded ? 444 : faults.ctxTop ?? 568 - Math.max(164, 124 + hintHeight + 8) - 25.5
        : node.id === 'dock' ? faults.dockTop ?? 464 : node.id === 'toast' ? 403.5 : node.id === 'topbar' || node.id === 'status' ? 0 : node.id === 'objchip' ? 60
        : node.classList.contains('survey-head') || node.classList.contains('sheet-header') ? 147 : 132;
      const width = yielded ? faults.clipWidth ?? 1 : 288;
      const height = yielded ? 1 : node === ctx ? 25.5 : node.id === 'toast' ? faults.toastHeight ?? 52.5
        : node.id === 'topbar' ? faults.topbarHeight ?? 124 : node.id === 'status' ? 124 : node.id === 'objchip' ? faults.objectiveHeight ?? 44
        : node.classList.contains('sheet-header') ? 84.56 : node.classList.contains('survey-head') ? 55 : 76.5;
      return { left: 16, top, width, height, right: 16 + width, bottom: top + height };
    };
  }
  const computed = (node: any) => {
    const large = document.body.classList.contains('fs-xl'), caption = node === hint || node === ctx;
    const yielded = caption && node.classList.contains('sheet-guidance-yield');
    if (faults.throwBaseline && node === hint && !large) throw Error('primary preference failure');
    if (faults.shiftScroll && node === hint && !large) document.getElementById('chpanel').scrollTop = 99;
    const faultSample = node === (faults.sample === 'ctx' ? ctx : hint), sheet = node.id === 'survey' || node.id === 'chpanel';
    return { display: node.style.display || (contextHidden(node) ? 'none' : 'block'), visibility: node.style.visibility || 'visible', opacity: node.style.opacity || '1',
      pointerEvents: node.style.pointerEvents || 'auto', clip: 'auto', clipPath: caption && (yielded || faults.forceClip) ? faults.clipPath ?? 'inset(50%)' : 'none',
      overflow: yielded ? 'hidden' : 'visible', marginTop: '0px', marginBottom: node.classList.contains('survey-head') ? '10px' : node.classList.contains('sheet-header') ? '12px' : '0px',
      paddingTop: sheet ? '14px' : '0px', paddingBottom: sheet ? '14px' : '0px', borderTopWidth: sheet ? '1px' : '0px', borderBottomWidth: sheet ? '1px' : '0px',
      fontSize: faultSample && large && faults.fontSize ? faults.fontSize : node.tagName === 'B' || node.tagName === 'H3' ? large ? '18px' : '15px' : large ? '16px' : '13px',
      fontFamily: faultSample && large && faults.fontFamily ? faults.fontFamily : large ? 'ui-monospace' : 'Inter',
      color: faultSample && faults.color ? faults.color : 'rgb(240, 244, 255)',
      getPropertyValue: (name: string) => document.documentElement.style.getPropertyValue(name) || rootValues[name] || '' };
  };
  const context = { document, window: { __CF_SLICE__: { api: { state: () => state } } }, innerWidth: 320, innerHeight: 568,
    Element: dom.window.Element, HTMLElement: dom.window.HTMLElement, HTMLDetailsElement: dom.window.HTMLDetailsElement,
    getComputedStyle: computed, round: (n: number) => Math.round(n * 100) / 100, selectorName: (n: any) => n.id || n.tagName };
  const owners = runInNewContext(source + '\n({guidancePreferenceOutcome,preferenceOutcome})', context);
  const closeSurvey = () => { state.cardOpen = false; document.body.classList.remove('card-open'); document.getElementById('survey').style.display = 'none'; };
  const openCharters = () => { closeSurvey(); document.body.classList.add('panel-open'); const panel = document.getElementById('chpanel'); panel.style.display = 'block'; panel.setAttribute('aria-hidden', 'false'); };
  return { document, hint, ctx, state, faults, rootValues, context, owners, closeSurvey, openCharters, run: (afterClose = false) => owners.guidancePreferenceOutcome(afterClose) };
}
it('executes the unchanged generic check on native guidance and restores both captions, body, root and layout exactly', () => {
  const h = fixture(), prior = h.document.documentElement.outerHTML;
  expect(h.owners.preferenceOutcome('body', '#hintpill', 'var(--ink)')).toMatchObject({ ok: false, sampleVisible: false });
  const result = h.run();
  expect(result).toMatchObject({ ok: true, scoped: true, justified: true, restored: true, preference: { ok: true, fontSize: 16 }, contextPreference: { nativeHiddenBySurvey: true } });
  expect(result.before.guidance[0].rect.slice(4)).toEqual([1, 1]); expect(result.native.guidance[0].rect.slice(4)).toEqual([288, 76.5]);
  expect(result.native.capacity).toMatchObject({ lower: 367.5, toastHeight: 52.5, floor: 299, cases: [{ id: 'survey', headerHeight: 65, edges: 30, minimum: 139, start: 132, available: 167, required: 219 }, { id: 'planetside', start: 132, required: 72 }] });
  expect(result.after).toEqual(result.before); expect(h.document.documentElement.outerHTML).toBe(prior);
});
it('uses measured capacity rather than stale cramped/roomy product variables', () => {
  const narrow = fixture(); Object.assign(narrow.rootValues, { '--cf-lower-top': '900px', '--cf-toast-height': '0px', '--cf-survey-min-height': '44px', '--cf-survey-start': '0px' });
  expect(narrow.run()).toMatchObject({ ok: true, justified: true });
  const roomy = fixture(); roomy.faults.nativeTop = 500;
  Object.assign(roomy.rootValues, { '--cf-lower-top': '150px', '--cf-toast-height': '400px', '--cf-survey-min-height': '500px', '--cf-survey-start': '132px' });
  expect(roomy.run()).toMatchObject({ ok: false, justified: false, restored: true, native: { capacity: { lower: 464, floor: 395.5 } } });
});
it('admits real generic-header pressure independently of Surface, and measures both caption preferences', () => {
  const h = fixture(); h.openCharters(); h.state.mode = 'system'; h.document.body.classList.remove('surface-mode'); h.document.getElementById('planetside').style.display = 'none';
  const result = h.run(); expect(result).toMatchObject({ ok: true, contextPreference: { ok: true, fontSize: 16 }, restored: true });
  expect(result.native.capacity.cases).toEqual([{ id: 'chpanel', headerHeight: 96.56, edges: 30, minimum: 170.56, start: 132, available: 133, required: 170.56 }]);
});
it('projects actual native hint height for context capacity and restores stale --hint-h value and priority', () => {
  for (const stale of ['1px', '600px']) {
    const h = fixture(); h.openCharters(); h.document.documentElement.style.setProperty('--hint-h', stale, 'important');
    const result = h.run(); expect(result).toMatchObject({ ok: true, restored: true, native: { capacity: { lower: 333.5, floor: 265 } } });
    expect(h.document.documentElement.style.getPropertyValue('--hint-h')).toBe(stale);
    expect(h.document.documentElement.style.getPropertyPriority('--hint-h')).toBe('important');
  }
});
it('uses actual upper chrome for standalone Planetside and permits still-needed guidance yield after Close', () => {
  const h = fixture(); h.closeSurvey(); h.faults.objectiveHeight = 262.88;
  const result = h.run(true); expect(result).toMatchObject({ ok: true, guidanceRestored: false, guidanceRetainedForCapacity: true, contextPreference: { ok: true }, restored: true });
  expect(result.native.capacity.cases).toEqual([{ id: 'planetside', start: 330.88, available: expect.closeTo(-65.88, 6), required: 72 }]);
  h.faults.objectiveHeight = 44; expect(h.run(true)).toMatchObject({ ok: false, justified: false, guidanceRetainedForCapacity: false });
  h.hint.classList.remove('sheet-guidance-yield'); h.ctx.classList.remove('sheet-guidance-yield');
  expect(h.run(true)).toMatchObject({ ok: true, guidanceRestored: true, guidanceRetainedForCapacity: false });
});
it.each(['unowned', 'empty', 'aria-hidden', 'ancestor-hidden', 'display-none', 'wide', 'landscape', 'route', 'closed', 'missing-side', 'clip', 'size', 'roomy', 'context-empty', 'context-hidden'])('rejects %s as authority for a clipped preference sample', fault => {
  const h = fixture();
  if (fault === 'unowned') { h.hint.classList.remove('sheet-guidance-yield'); h.faults.forceClip = true; }
  if (fault === 'empty') h.hint.textContent = ' ';
  if (fault === 'aria-hidden') h.hint.setAttribute('aria-hidden', 'true');
  if (fault === 'ancestor-hidden') h.document.body.setAttribute('aria-hidden', 'true');
  if (fault === 'display-none') h.hint.style.display = 'none';
  if (fault === 'wide') h.context.innerWidth = 1024;
  if (fault === 'landscape') h.context.innerWidth = 667;
  if (fault === 'route') h.state.mode = 'system';
  if (fault === 'closed') h.state.cardOpen = false;
  if (fault === 'missing-side') h.document.getElementById('planetside').style.display = 'none';
  if (fault === 'clip') h.faults.clipPath = 'none';
  if (fault === 'size') h.faults.clipWidth = 2;
  if (fault === 'roomy') h.faults.nativeTop = 500;
  if (fault === 'context-empty') h.ctx.textContent = ' ';
  if (fault === 'context-hidden') h.ctx.setAttribute('aria-hidden', 'true');
  expect(h.run().ok).toBe(false);
});
it.each([{ fontSize: '12px' }, { fontFamily: 'system-ui' }, { color: 'rgb(0, 0, 0)' }])('retains actual generic font/size/tone failures on each caption for %j', fault => {
  for (const sample of ['hint', 'ctx']) {
    const h = fixture(); h.openCharters(); Object.assign(h.faults, fault, { sample }); const result = h.run();
    expect(result.ok).toBe(false); expect((sample === 'ctx' ? result.contextPreference : result.preference).ok).toBe(false); expect(result.restored).toBe(true);
  }
});
it('does not charge empty pointer-transparent topbar padding or authorize yield without released room', () => {
  const h = fixture(); h.closeSurvey(); h.faults.topbarHeight = 400; h.document.getElementById('topbar').style.pointerEvents = 'none';
  expect(h.run(true)).toMatchObject({ ok: false, justified: false, native: { capacity: { cases: [{ id: 'planetside', start: 132 }] } } });
  const blocked = fixture(); blocked.faults.dockTop = 300;
  expect(blocked.run()).toMatchObject({ ok: false, justified: false, native: { capacity: { lower: 300, releasedLower: 300 } } });
});
it('checks visible context preferences after guidance is fully restored and rejects unowned clipping', () => {
  const h = fixture(); h.closeSurvey(); h.hint.classList.remove('sheet-guidance-yield'); h.ctx.classList.remove('sheet-guidance-yield');
  Object.assign(h.faults, { sample: 'ctx', fontSize: '12px' });
  expect(h.run(true)).toMatchObject({ ok: false, contextPreference: { ok: false } });
  delete h.faults.fontSize; h.faults.forceClip = true;
  expect(h.run(true).ok).toBe(false);
});
it('retains primary preference error while independently restoring body/root/context after hint restoration fails', () => {
  const h = fixture(), original = h.hint.setAttribute.bind(h.hint), body = h.document.body.className, rootStyle = h.document.documentElement.getAttribute('style');
  h.faults.throwBaseline = true; h.hint.setAttribute = (name: string, value: string) => { if (name !== 'class') original(name, value); };
  const result = h.run(); expect(result.ok).toBe(false); expect(result.error).toBe('primary preference failure'); expect(result.restored).toBe(false);
  expect(h.document.body.className).toBe(body); expect(h.document.documentElement.getAttribute('style')).toBe(rootStyle); expect(h.ctx.classList.contains('sheet-guidance-yield')).toBe(true);
});
it('restores native scroll changes and rejects a blocked restoration', () => {
  for (const blocked of [false, true]) {
    const h = fixture(); h.openCharters(); const panel = h.document.getElementById('chpanel'); let top = 8;
    Object.defineProperty(panel, 'scrollTop', { configurable: true, get: () => top, set: (value: number) => { if (!blocked || value !== 8) top = value; } });
    h.faults.shiftScroll = true; const result = h.run();
    expect(result.preference.ok).toBe(true); expect(result.contextPreference.ok).toBe(true);
    expect(result.ok).toBe(!blocked); expect(result.restored).toBe(!blocked); expect(top).toBe(blocked ? 99 : 8);
  }
});
it('rejects a changed caption attribute rather than accepting preference booleans', () => {
  const h = fixture(); h.openCharters(); const original = h.ctx.setAttribute.bind(h.ctx);
  h.ctx.setAttribute = (name: string, value: string) => { original(name, value); if (name === 'class') original('aria-label', 'corrupted context'); };
  expect(h.run()).toMatchObject({ ok: false, preference: { ok: true }, contextPreference: { ok: true }, restored: false });
});

it('classifies after-Close reveal/restoration faults as instrument failures before adding the product outcome', async () => {
  const block = extract("        const closedGuidance = await evalIn(", "        const reopen = await activateRealKeyboardControl('#docksurvey', `${vp.label} Arc 4 Survey reopen`);");
  for (const fault of [null, 'error', 'cleanupError', 'restored']) {
    const receipt: Record<string, any> = { ok: true, scoped: true, error: null, cleanupError: null, restored: true, guidanceRetainedForCapacity: true };
    if (fault) receipt[fault] = fault === 'restored' ? false : 'injected';
    const calls: string[] = [];
    await runInNewContext('(async()=>{' + block + '})()', { vp: { label: 'small-phone' },
      evalIn: (expression: string) => { expect(expression).toBe('window.__CF_GLASS_AUDIT__.guidancePreferenceOutcome(true)'); return receipt; },
      recordInstrumentFailure: (message: string) => { expect(message).toContain('after-Close guidance'); calls.push('instrument'); },
      addOutcome: (...args: any[]) => { expect(args[4]).toBe(receipt); calls.push('product'); } });
    expect(calls).toEqual(fault ? ['instrument', 'product'] : ['product']);
  }
});
