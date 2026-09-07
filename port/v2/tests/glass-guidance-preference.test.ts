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
  const dom = new JSDOM('<!doctype html><body class="surface-mode card-open fs-xl tone-max font-mono"><div id="survey"><div class="survey-head">Survey</div></div><div id="planetside">Biosphere</div><div id="toast" style="opacity:1">Notice</div><div id="ctxbar" style="display:none"></div><div id="dock">Dock</div><div id="hintpill" class="scene-hint  sheet-guidance-yield" aria-label="Scene guidance">Leave <b>world</b> to lift off</div></body>');
  cleanups.push(() => dom.window.close()); const { document } = dom.window, hint = document.getElementById('hintpill');
  const state = { mode: 'surface', cardOpen: true }, faults: Record<string, any> = {};
  const rootValues: Record<string, string> = { '--safe-bottom': '0px', '--cf-lower-top': '464px', '--cf-toast-height': '52.5px', '--cf-survey-min-height': '139px', '--cf-survey-start': '132px' };
  for (const node of document.querySelectorAll('*')) node.getBoundingClientRect = () => {
    const yielded = node === hint && hint.classList.contains('sheet-guidance-yield');
    const top = node === hint ? yielded ? 444 : faults.nativeTop ?? 367.5 : node.id === 'dock' ? 464 : node.id === 'toast' ? 403.5 : node.classList.contains('survey-head') ? 147 : 132;
    const width = yielded ? faults.clipWidth ?? 1 : 288;
    const height = yielded ? 1 : node.id === 'toast' ? 52.5 : node.classList.contains('survey-head') ? 55 : 76.5;
    return { left: 16, top, width, height, right: 16 + width, bottom: top + height };
  };
  const computed = (node: any) => {
    const large = document.body.classList.contains('fs-xl'), yielded = node === hint && hint.classList.contains('sheet-guidance-yield');
    if (faults.throwBaseline && node === hint && !large) throw Error('primary preference failure');
    return { display: node.style.display || 'block', visibility: node.style.visibility || 'visible', opacity: node.style.opacity || '1',
      clip: 'auto', clipPath: node === hint && (yielded || faults.forceClip) ? faults.clipPath ?? 'inset(50%)' : 'none',
      overflow: yielded ? 'hidden' : 'visible', marginTop: '0px', marginBottom: node.classList.contains('survey-head') ? '10px' : '0px',
      paddingTop: node.id === 'survey' ? '14px' : '0px', paddingBottom: node.id === 'survey' ? '14px' : '0px',
      borderTopWidth: node.id === 'survey' ? '1px' : '0px', borderBottomWidth: node.id === 'survey' ? '1px' : '0px',
      fontSize: node === hint && large && faults.fontSize ? faults.fontSize : node.tagName === 'B' ? large ? '18px' : '15px' : large ? '16px' : '13px',
      fontFamily: node === hint && large && faults.fontFamily ? faults.fontFamily : large ? 'ui-monospace' : 'Inter',
      color: node === hint && faults.color ? faults.color : 'rgb(240, 244, 255)', getPropertyValue: (name: string) => rootValues[name] ?? '' };
  };
  const context = { document, window: { __CF_SLICE__: { api: { state: () => state } } }, innerWidth: 320, innerHeight: 568,
    Element: dom.window.Element, HTMLElement: dom.window.HTMLElement, HTMLDetailsElement: dom.window.HTMLDetailsElement,
    getComputedStyle: computed, round: (n: number) => Math.round(n * 100) / 100, selectorName: (n: any) => n.id || n.tagName };
  const owners = runInNewContext(source + '\n({guidancePreferenceOutcome,preferenceOutcome})', context);
  return { document, hint, state, faults, rootValues, context, owners, run: (afterClose = false) => owners.guidancePreferenceOutcome(afterClose) };
}
it('executes the unchanged generic preference check on the synchronous reveal and restores every hint receipt exactly', () => {
  const h = fixture(), prior = h.hint.outerHTML;
  expect(h.owners.preferenceOutcome('body', '#hintpill', 'var(--ink)')).toMatchObject({ ok: false, sampleVisible: false });
  const result = h.run();
  expect(result).toMatchObject({ ok: true, scoped: true, justified: true, restored: true, preference: { ok: true, fontSize: 16 } });
  expect(result.before.rect.slice(4)).toEqual([1, 1]); expect(result.native.rect.slice(4)).toEqual([288, 76.5]);
  expect(result.native.capacity).toEqual({ lower: 367.5, toastHeight: 52.5, headerHeight: 65, edges: 30, minimum: 139, start: 132, available: 167, required: 219 });
  expect(result.after).toEqual(result.before); expect(h.hint.outerHTML).toBe(prior);
  expect(h.owners.preferenceOutcome('body', '#hintpill', 'var(--ink)')).toMatchObject({ ok: false, sampleVisible: false });
});
it('uses native capacity independently of stale variables that falsely report cramped or roomy space', () => {
  const narrow = fixture(); Object.assign(narrow.rootValues, { '--cf-lower-top': '900px', '--cf-toast-height': '0px', '--cf-survey-min-height': '44px', '--cf-survey-start': '0px' });
  expect(narrow.run()).toMatchObject({ ok: true, justified: true, native: { capacity: { available: 167, required: 219 } } });
  const roomy = fixture(); roomy.faults.nativeTop = 500;
  Object.assign(roomy.rootValues, { '--cf-lower-top': '150px', '--cf-toast-height': '400px', '--cf-survey-min-height': '500px', '--cf-survey-start': '132px' });
  const result = roomy.run();
  expect(result).toMatchObject({ ok: false, justified: false, restored: true, preference: { ok: true }, native: { capacity: { lower: 464, available: 263.5, required: 219 } } });
});
it.each(['unowned', 'empty', 'aria-hidden', 'ancestor-hidden', 'display-none', 'wide', 'landscape', 'route', 'closed', 'missing-side', 'clip', 'size', 'roomy'])('rejects %s as authority for a clipped guidance preference sample', fault => {
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
  expect(h.run().ok).toBe(false);
});
it.each([{ fontSize: '12px' }, { fontFamily: 'system-ui' }, { color: 'rgb(0, 0, 0)' }])('retains the actual generic font, size and tone failure for %j', fault => {
  const h = fixture(); Object.assign(h.faults, fault); const result = h.run();
  expect(result.ok).toBe(false); expect(result.preference.ok).toBe(false); expect(result.restored).toBe(true);
});
it('retains primary preference failure and detects a failed exact restoration', () => {
  const h = fixture(), original = h.hint.setAttribute.bind(h.hint), body = h.document.body.className;
  h.faults.throwBaseline = true;
  h.hint.setAttribute = (name: string, value: string) => { if (name !== 'class') original(name, value); };
  const result = h.run();
  expect(result.ok).toBe(false); expect(result.error).toBe('primary preference failure'); expect(result.restored).toBe(false);
  expect(h.document.body.className).toBe(body);
});
it('requires natural visible guidance after native Close and wires the outcome before reopening Survey', async () => {
  const h = fixture(); h.state.cardOpen = false; h.document.body.classList.remove('card-open');
  expect(h.run(true).ok).toBe(false); h.hint.classList.remove('sheet-guidance-yield');
  expect(h.run(true)).toMatchObject({ ok: true, guidanceRestored: true });
  h.hint.style.display = 'none'; expect(h.run(true).ok).toBe(false); h.hint.style.display = '';
  const block = extract("        addOutcome(vp.label, 'survey-close-guidance'", "        const reopen = await activateRealKeyboardControl('#docksurvey', `${vp.label} Arc 4 Survey reopen`);");
  const calls: any[][] = [];
  await runInNewContext('(async()=>{' + block + '})()', { vp: { label: 'small-phone' }, addOutcome: (...args: any[]) => calls.push(args),
    evalIn: (expression: string) => { expect(expression).toBe('window.__CF_GLASS_AUDIT__.guidancePreferenceOutcome(true)'); return h.run(true); } });
  expect(calls).toHaveLength(1); expect(calls[0]![2]).toBe('PREFERENCE_SURFACE_INERT'); expect(calls[0]![4].guidanceRestored).toBe(true);
});
