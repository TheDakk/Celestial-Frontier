import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { afterEach, expect, it } from 'vitest';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const glass = readFileSync(new URL('../tools/glassmatrix.mjs', import.meta.url), 'utf8');
const extract = (start: string, end: string) => {
  if (glass.split(start).length !== 2 || glass.split(end).length !== 2) throw Error('source anchors must be unique');
  return glass.slice(glass.indexOf(start), glass.indexOf(end));
};
const source = extract('  const visible = (el) => {', '  const visualBounds = (safe = {}) => {')
  + extract('  const inside = (r, bounds, slack = 1) =>', '  const parseColor = (raw) => {')
  + extract('  const clippedBounds = (el, root, viewport) => {', '  const focusEvidence = (el) => {');
const disposals: Array<() => void> = [];
afterEach(() => { for (const dispose of disposals.splice(0)) dispose(); });
function fixture() {
  const dom = new JSDOM('<!doctype html><body><section id="panel"><button id="close" data-pnx="ch">Close</button><h3 class="sheet-header">Charters<button id="header-control">Header action</button></h3><div id="content"><button id="action">Begin</button></div></section></body>');
  disposals.push(() => dom.window.close());
  const { document } = dom.window, panel = document.getElementById('panel'), header = panel.querySelector('h3');
  const action = document.getElementById('action'), close = document.getElementById('close'), headerControl = document.getElementById('header-control');
  const faults: Record<string, any> = {}, viewport = { left: 0, top: 0, right: 320, bottom: 568, width: 320, height: 568 };
  let scrollTop = 80.125, scrollLeft = 3.25;
  Object.defineProperties(panel, {
    scrollTop: { get: () => scrollTop, set: value => { scrollTop = Math.min(700 - (faults.panelHeight ?? 128), Math.max(0, value)); } },
    scrollLeft: { get: () => scrollLeft, set: value => { scrollLeft = value; } },
    scrollHeight: { get: () => faults.noScroll ? faults.panelHeight ?? 128 : 700 }, clientHeight: { get: () => faults.panelHeight ?? 128 },
    scrollWidth: { get: () => 288 }, clientWidth: { get: () => 288 },
  });
  const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height });
  for (const node of document.querySelectorAll('*')) node.getBoundingClientRect = () => {
    if (node.id === 'content' && faults.innerClip) return rect(16, 220, 288, 30);
    if (node === panel || node.id === 'content') return rect(16, 132, 288, faults.panelHeight ?? 128);
    if (node === header) return rect(faults.headerLeft ?? 30, 147, 214, faults.headerHeight ?? 60);
    if (node === close) return rect(248, 147, 44, 44);
    if (node === headerControl) return rect(100, 150, 44, 44);
    // Reproduce the retained Charters centre at (138,185.56) before scrolling.
    if (node === action) return rect(116, 163.5625 + 80.125 - scrollTop, 44, 44);
    return viewport;
  };
  const computed = (node: any) => ({ overflowX: 'visible', overflowY: node === panel ? 'auto' : node.id === 'content' && faults.innerClip ? 'hidden' : 'visible',
    position: node === header ? faults.headerPosition ?? 'sticky' : node === close ? 'sticky' : node === action ? faults.actionPosition ?? 'static' : 'static',
    display: node === header && faults.hiddenHeader ? 'none' : 'block', visibility: 'visible', opacity: '1', clip: 'auto', clipPath: 'none',
    scrollBehavior: faults.computedScrollBehavior ?? (node.style.getPropertyValue('scroll-behavior') || 'auto'),
    transform: node.style.getPropertyValue('transform') || 'none' });
  document.elementFromPoint = (x: number, y: number) => {
    const r = header.getBoundingClientRect();
    if (!faults.hiddenHeader && computed(header).position === 'sticky' && x >= r.left && x < r.right && y >= r.top && y < r.bottom) return header;
    return action;
  };
  const context = { document, Element: dom.window.Element, HTMLElement: dom.window.HTMLElement, HTMLDetailsElement: dom.window.HTMLDetailsElement,
    getComputedStyle: computed, CSS: { escape: (s: string) => s }, round: (n: number) => Math.round(n * 100) / 100 };
  const owners = runInNewContext(source + '\n({scrollControlIntoView,setExactScrollPosition,hit,inside,box,clippedBounds})', context);
  const remembered = new Map<any, number[]>();
  const run = (target = action) => owners.scrollControlIntoView(target, panel, viewport,
    (owner: any) => { if (!remembered.has(owner)) remembered.set(owner, [owner.scrollLeft, owner.scrollTop]); });
  const restore = () => runInNewContext(extract('      for (const [owner, [left, top]] of scrollState) {', '    for (const [code, count] of controlCounts) {').split('\n    }\n')[0]!,
    { scrollState: remembered, setExactScrollPosition: owners.setExactScrollPosition });
  return { document, panel, header, action, close, headerControl, faults, viewport, owners, remembered, run, restore };
}
it('clears the actual sticky title before the early-inside result, then restores raw scroll and exact style bytes', () => {
  const h = fixture(), style = 'color: red;  scroll-behavior: smooth !important'; h.panel.setAttribute('style', style);
  expect(h.owners.inside(h.owners.box(h.action), h.owners.clippedBounds(h.action, h.panel, h.viewport).bounds)).toBe(true);
  expect(h.owners.hit(h.action)).toMatchObject({ ok: false, at: [138, 185.56] });
  const result = h.run();
  expect(result.fits).toBe(true); expect(result.bounds.top).toBe(207); expect(result.scrollAttempts).toHaveLength(1);
  expect(result.occludingHeaders[0]).toMatchObject({ owner: '#panel', position: 'sticky', rect: { bottom: 207 } });
  expect(h.owners.hit(h.action).ok).toBe(true); expect(h.panel.getAttribute('style')).toBe(style);
  h.restore(); expect(h.panel.scrollTop).toBe(80.125); expect(h.panel.scrollLeft).toBe(3.25);
  expect(h.panel.getAttribute('style')).toBe(style); expect(h.owners.hit(h.action).ok).toBe(false);
});
it.each(['short', 'hidden', 'static', 'other-column'])('does not invent sticky occlusion for an actually %s header', fault => {
  const h = fixture();
  if (fault === 'short') h.faults.headerHeight = 10;
  if (fault === 'hidden') h.faults.hiddenHeader = true;
  if (fault === 'static') h.faults.headerPosition = 'static';
  if (fault === 'other-column') h.faults.headerLeft = 220;
  const result = h.run(); expect(result.fits).toBe(true); expect(result.scrollAttempts).toHaveLength(0);
  if (fault !== 'short') expect(result.occludingHeaders).toHaveLength(0);
});
it('follows a larger painted header and refuses a 44px action when only 43px of body remains', () => {
  const h = fixture(); h.faults.headerHeight = 50; expect(h.run().bounds.top).toBe(197); h.restore();
  h.faults.headerHeight = 70;
  const result = h.run(); expect(result.bounds.height).toBe(43); expect(result.fits).toBe(false);
  expect(result.scrollAttempts).toHaveLength(1); expect(h.action.getBoundingClientRect().height).toBe(44);
});
it.each(['close', 'header', 'fixed', 'sticky'])('preserves the %s control owner without scrolling its sheet', kind => {
  const h = fixture(); if (kind === 'fixed' || kind === 'sticky') h.faults.actionPosition = kind;
  const target = kind === 'close' ? h.close : kind === 'header' ? h.headerControl : h.action, result = h.run(target);
  expect(result.occludingHeaders).toHaveLength(0); expect(result.scrollExemption).not.toBeNull();
  expect(result.scrollAttempts).toHaveLength(0); expect(h.panel.scrollTop).toBe(80.125);
});
it('retains an unscrollable occluded control and executes the richer native hit diagnosis', () => {
  const h = fixture(); h.faults.noScroll = true; const scrolled = h.run(), hit = h.owners.hit(h.action), calls: any[] = [];
  expect(scrolled.fits).toBe(false); expect(hit.ok).toBe(false);
  const block = extract('      const reachEvidence = { ...h, rect: r, bounds: controlBounds, ...identity,', '      const a11y = accessibleName(el);');
  runInNewContext(block, { h: hit, r: scrolled.rect, controlBounds: scrolled.bounds, identity: {}, scrolled,
    surface: 'charters-instead-of-survey', name: 'starter-charter-actions button', controlIssue: (row: any) => calls.push(row),
    issue: (code: string, surface: string, element: string, actual: any, expected: string) => ({ code, surface, element, actual, expected }) });
  const finding = calls.find(row => row.code === 'CONTROL_NOT_HITTABLE');
  expect(finding.actual).toMatchObject({ at: [138, 185.56], bounds: { top: 207 }, rect: { height: 44 }, scrollAttempts: [] });
  expect(finding.actual.clippingAncestors[0].element).toBe('#panel'); expect(finding.actual.occludingHeaders).toHaveLength(1);
  expect(finding.actual.hit).toContain('h3.sheet-header');
});
it('finds a nested shared title through its overflow-visible wrapper', () => {
  const h = fixture(), wrapper = h.document.createElement('div');
  h.panel.insertBefore(wrapper, h.header); wrapper.append(h.header);
  wrapper.getBoundingClientRect = () => h.panel.getBoundingClientRect();
  const result = h.run(); expect(result.fits).toBe(true); expect(result.bounds.top).toBe(207);
  expect(result.occludingHeaders).toHaveLength(1); expect(result.occludingHeaders[0].owner).toBe('#panel');
  expect(h.owners.hit(h.action).ok).toBe(true);
});
it('retains a tighter inner scrollport instead of replacing it with the outer header lane', () => {
  const h = fixture(); h.faults.innerClip = true; const result = h.run();
  expect(result.bounds).toMatchObject({ top: 220, bottom: 250, height: 30 });
  expect(result.occludingHeaders).toHaveLength(0); expect(result.fits).toBe(false);
  expect(result.ancestors.map((row: any) => row.element)).toEqual(['#content', '#panel']);
});
it('preserves absent style-attribute identity when scrolling and restoring', () => {
  const h = fixture(); expect(h.panel.hasAttribute('style')).toBe(false); h.run();
  expect(h.panel.hasAttribute('style')).toBe(false); h.restore(); expect(h.panel.hasAttribute('style')).toBe(false);
});
it('finishes Chromium retained-empty normalization after sampling actual restored styles', () => {
  const h = fixture(), remove = h.panel.removeAttribute.bind(h.panel); let removals = 0;
  h.panel.removeAttribute = (name: string) => {
    if (name === 'style' && ++removals === 1) h.panel.setAttribute('style', ''); else remove(name);
  };
  const result = h.owners.setExactScrollPosition(h.panel, 3.25, 42.125);
  expect(removals).toBe(2); expect(h.panel.getAttribute('style')).toBeNull();
  expect(result.styleRestoration).toMatchObject({ ok: true, before: { scrollBehavior: '', computedScrollBehavior: 'auto', computedTransform: 'none' },
    after: { scrollBehavior: '', computedScrollBehavior: 'auto', computedTransform: 'none' } });
  h.panel.setAttribute('style', ''); h.owners.setExactScrollPosition(h.panel, 3.25, 80.125);
  expect(h.panel.getAttribute('style')).toBe(''); expect(removals).toBe(2);
});
it('rejects computed restoration failure even when the second removal restores an absent carrier', () => {
  const h = fixture(), remove = h.panel.removeAttribute.bind(h.panel); let removals = 0;
  h.panel.removeAttribute = (name: string) => { remove(name); if (name === 'style') { removals++; h.faults.computedScrollBehavior = 'smooth'; } };
  expect(() => h.owners.setExactScrollPosition(h.panel, 3.25, 42.125)).toThrow('exact scroll style restoration failed');
  expect(removals).toBe(2); expect(h.panel.getAttribute('style')).toBeNull();
});
