import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSheetLayoutController } from '../apps/game/src/sheet-layout.js';
import { UI_SHEET_CSS } from '../apps/game/src/ui-sheet-style.js';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const cleanups: Array<() => void> = [];
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); });
function harness(includePlanetside = true, width = 1024, height = 568, compactToastHeight = 44) {
  const dom = new JSDOM('<!doctype html><style>#hintpill.sheet-guidance-yield{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;pointer-events:none}</style><body><div id="topbar"></div><div id="hintpill"></div><div id="ctxbar"></div><div id="dock"></div>'
    + '<div id="toast" class="notice-kind" style="opacity:0" role="status" aria-live="polite"><b data-sel="toast-title">Beyond Your Charter</b><span data-sel="toast-message">Build the required drive.</span></div>'
    + '<div id="survey" style="display:none;padding:14px;border:1px solid"><div id="surveyheader" class="survey-head" style="margin:0 0 12px">Earth</div></div>'
    + '<div id="setpanel" class="panel" style="display:none;padding:14px;border:1px solid"><h3 id="panelheader" class="sheet-header" style="margin:0 0 12px">Settings</h3></div>'
    + '<div id="chpanel" class="panel" style="display:none;padding:14px;border:1px solid"><h3 id="charterheader" class="sheet-header" style="margin:0 0 12px">📜 Charters</h3></div>'
    + (includePlanetside ? '<div id="planetside"></div>' : ''), { pretendToBeVisual: true });
  const { document } = dom.window;
  document.documentElement.style.setProperty('--surface-chrome-bottom', '212px');
  Object.defineProperty(dom.window, 'innerHeight', { value: height, configurable: true });
  Object.defineProperty(dom.window, 'innerWidth', { value: width, configurable: true });
  const rects = new Map<string, { top: number; height: number; left?: number; width?: number }>([
    ['topbar', { top: 0, height: 104 }], ['hintpill', { top: 367.5, height: 76.5 }],
    ['ctxbar', { top: 0, height: 0 }], ['dock', { top: 464, height: 92 }],
    ['toast', { top: 300, height: 64 }], ['planetside', { top: 220, height: 90 }],
    ['survey', { top: 132, height: 44 }], ['surveyheader', { top: 147, height: 44 }],
    ['setpanel', { top: 132, height: 44 }], ['panelheader', { top: 147, height: 44 }],
    ['chpanel', { top: 132, height: 44 }], ['charterheader', { top: 147, height: 44 }],
  ]);
  for (const id of rects.keys()) {
    const node = document.getElementById(id);
    if (!node) continue;
    node.getBoundingClientRect = () => {
      const yieldedHint = id === 'hintpill' && node.classList.contains('sheet-guidance-yield');
      const r = rects.get(id)!, left = r.left ?? 16, width = yieldedHint ? 1 : r.width ?? 288;
      const height = yieldedHint ? 1 : id === 'toast' && node.classList.contains('toast-compact') ? compactToastHeight : r.height;
      return { ...r, height, bottom: r.top + height, width, left, right: left + width };
    };
  }
  const frames = new Map<number, FrameRequestCallback>(); let frameId = 0;
  dom.window.requestAnimationFrame = (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; };
  dom.window.cancelAnimationFrame = (id: number) => frames.delete(id);
  const flushFrames = () => { for (const [id, callback] of [...frames]) { frames.delete(id); callback(0); } };
  const observers: Array<{ callback: () => void; disconnect: ReturnType<typeof vi.fn>; observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn> }> = [];
  dom.window.ResizeObserver = class {
    callback: () => void; disconnect = vi.fn(); observe = vi.fn(); unobserve = vi.fn();
    constructor(callback: () => void) { this.callback = callback; observers.push(this); }
  };
  const controller = createSheetLayoutController(document);
  cleanups.push(() => { controller.dispose(); dom.window.close(); });
  const value = (name: string) => parseFloat(document.documentElement.style.getPropertyValue(name));
  return { document, rects, controller, observers, value, flushFrames, frames };
}
describe('measured U2 sheet lanes', () => {
  it('clears the retained 320×568 A++ hint by 8px, not the old 390px edge', () => {
    const h = harness(true, 320);
    expect(h.value('--cf-lower-top')).toBe(367.5);
    expect(h.value('--cf-sheet-floor')).toBe(359.5);
    expect(h.value('--cf-sheet-bottom')).toBe(208.5);
    const retainedOldBottom = 390;
    expect(retainedOldBottom > h.value('--cf-lower-top')).toBe(true);
    expect(h.value('--cf-sheet-floor') <= h.value('--cf-lower-top') - 8).toBe(true);
  });
  it('follows actual guidance and caption heights in both directions', () => {
    const h = harness();
    h.rects.set('hintpill', { top: 410, height: 34 }); h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(402);
    h.rects.set('ctxbar', { top: 350, height: 44 }); h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(342);
    h.document.getElementById('ctxbar').style.display = 'none'; h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(402);
    h.document.getElementById('hintpill').style.visibility = 'hidden'; h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(456);
  });
  it('reserves Homecoming before it paints and releases only after fading', () => {
    const h = harness(), toast = h.document.getElementById('toast');
    toast.style.opacity = '1'; h.controller.sync();
    expect(h.value('--cf-toast-bottom')).toBe(208.5);
    expect(h.value('--cf-sheet-floor')).toBe(287.5);
    expect(h.value('--cf-toast-height')).toBe(64);
    toast.style.opacity = '.4'; h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(287.5);
    toast.style.opacity = '0'; h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(359.5);
  });
  it('reserves a painted toast only across the visible Planetside column and restores the exact disjoint floor', () => {
    const h = harness(true, 844, 390), toast = h.document.getElementById('toast');
    h.rects.set('hintpill', { top: 194, height: 51 });
    h.rects.set('ctxbar', { top: 160.5, height: 25.5 });
    h.rects.set('dock', { top: 265, height: 92 });
    h.rects.set('planetside', { top: 130, height: 44, left: 56, width: 360 });
    h.rects.set('toast', { top: 52, height: 100.5, left: 428, width: 360 });
    toast.style.opacity = '1'; h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(44);
    expect(h.value('--cf-planetside-floor')).toBe(152.5);
    h.rects.set('toast', { top: 52, height: 100.5, left: 400, width: 360 }); h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(44);
    expect(h.value('--cf-planetside-floor')).toBe(44);
    toast.style.opacity = '.4'; h.controller.sync();
    expect(h.value('--cf-planetside-floor')).toBe(44);
    h.rects.set('toast', { top: 52, height: 100.5, left: 428, width: 360 }); h.controller.sync();
    expect(h.value('--cf-planetside-floor')).toBe(152.5);
    expect(h.value('--cf-sheet-floor')).toBe(44);
    toast.style.opacity = '0'; h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(152.5);
    expect(h.value('--cf-planetside-floor')).toBe(152.5);
  });
  it('observes Planetside width, coalesces its resize, and cancels pending publication on disposal', () => {
    const h = harness(), side = h.document.getElementById('planetside');
    expect(h.observers[0]!.observe.mock.calls.some(([node]) => node === side)).toBe(true);
    h.rects.set('planetside', { top: 220, height: 90, left: 16, width: 288 });
    h.rects.set('toast', { top: 300, height: 64, left: 304, width: 288 });
    h.document.getElementById('toast').style.opacity = '1'; h.controller.sync();
    expect(h.value('--cf-planetside-floor')).toBe(359.5);
    h.rects.set('planetside', { top: 220, height: 90, left: 16, width: 289 });
    h.observers[0]!.callback(); h.observers[0]!.callback();
    expect(h.frames.size).toBe(1); h.flushFrames();
    expect(h.value('--cf-planetside-floor')).toBe(287.5);
    side.style.display = 'none'; h.controller.sync();
    expect(h.value('--cf-planetside-floor')).toBe(359.5);
    side.style.display = 'block'; h.observers[0]!.callback();
    h.controller.dispose(); expect(h.frames.size).toBe(0); h.flushFrames();
    expect(h.value('--cf-planetside-floor')).toBe(359.5);
  });
  it('keeps the default owner usable before Planetside is present', () => {
    const h = harness(false);
    h.document.getElementById('toast').style.opacity = '1'; h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(287.5);
    expect(h.value('--cf-planetside-floor')).toBe(359.5);
    expect(h.observers[0]!.observe.mock.calls.every(([node]) => node !== null)).toBe(true);
  });
  it('does not publish unchanged geometry or accept callbacks after disposal', () => {
    const h = harness();
    const set = vi.spyOn(h.document.documentElement.style, 'setProperty');
    h.controller.sync(); expect(set).not.toHaveBeenCalled();
    h.controller.dispose(); h.rects.set('hintpill', { top: 100, height: 344 });
    h.controller.sync(); expect(set).not.toHaveBeenCalled();
    expect(h.observers.every(o => o.disconnect.mock.calls.length === 1)).toBe(true);
  });
  it('selects full → compact → full from actual space while preserving the live message and publishing actual compact height', () => {
    const h = harness(false, 320), toast = h.document.getElementById('toast'), survey = h.document.getElementById('survey');
    const message = toast.querySelector('[data-sel="toast-message"]'), original = toast.innerHTML;
    toast.style.opacity = '1'; h.rects.set('toast', { top: 144, height: 208 }); h.controller.sync();
    expect(toast.className).toBe('notice-kind'); expect(h.value('--cf-sheet-floor')).toBe(143.5);
    survey.style.display = 'block'; h.controller.sync();
    expect(toast.className).toBe('notice-kind toast-compact'); expect(h.value('--cf-toast-height')).toBe(44);
    expect(h.value('--cf-sheet-floor')).toBe(307.5); expect(h.value('--cf-sheet-bottom')).toBe(260.5);
    expect(toast.querySelector('[data-sel="toast-message"]')).toBe(message); expect(toast.innerHTML).toBe(original);
    expect(toast.style.opacity).toBe('1'); expect(toast.getAttribute('role')).toBe('status'); expect(toast.getAttribute('aria-live')).toBe('polite');
    h.rects.set('hintpill', { top: 550, height: 18 }); h.rects.set('dock', { top: 550, height: 18 }); h.controller.sync();
    expect(toast.className).toBe('notice-kind'); expect(h.value('--cf-toast-height')).toBe(208); expect(h.value('--cf-sheet-floor')).toBe(326);
    expect(toast.innerHTML).toBe(original);
  });
  it('does not compact disjoint or hidden sheets, ample space, unsupported markup, or non-portrait viewports', () => {
    const h = harness(false, 320), toast = h.document.getElementById('toast'), survey = h.document.getElementById('survey');
    toast.style.opacity = '1'; h.rects.set('toast', { top: 144, height: 208 }); h.controller.sync();
    expect(toast.classList.contains('toast-compact')).toBe(false);
    survey.style.display = 'block'; h.rects.set('toast', { top: 144, height: 208, left: 304, width: 288 }); h.controller.sync();
    expect(toast.classList.contains('toast-compact')).toBe(false);
    h.rects.set('toast', { top: 300, height: 64 }); h.controller.sync();
    expect(toast.classList.contains('toast-compact')).toBe(false);
    h.rects.set('toast', { top: 144, height: 208 }); h.controller.sync(); expect(toast.classList.contains('toast-compact')).toBe(true);
    const message = toast.querySelector('[data-sel="toast-message"]'); message.remove(); h.controller.sync();
    expect(toast.classList.contains('toast-compact')).toBe(false); toast.append(message);
    const title = toast.querySelector('[data-sel="toast-title"]'); title.remove(); h.controller.sync();
    expect(toast.classList.contains('toast-compact')).toBe(false); toast.prepend(title);
    Object.defineProperty(h.document.defaultView, 'innerWidth', { value: 901, configurable: true }); h.controller.sync();
    expect(toast.classList.contains('toast-compact')).toBe(false);
    Object.defineProperty(h.document.defaultView, 'innerWidth', { value: 667, configurable: true }); h.controller.sync();
    expect(toast.classList.contains('toast-compact')).toBe(false);
  });
  it('includes native header margins, sheet edges and 44px usable body, with a 72px total Planetside floor', () => {
    const h = harness(false, 320), toast = h.document.getElementById('toast'), panel = h.document.getElementById('setpanel');
    toast.style.opacity = '1'; panel.style.display = 'block';
    h.rects.set('toast', { top: 262, height: 89.5 }); h.controller.sync();
    expect(h.value('--cf-sheet-floor')).toBe(262); expect(toast.classList.contains('toast-compact')).toBe(false);
    h.rects.set('toast', { top: 261, height: 90.5 }); h.controller.sync();
    expect(toast.classList.contains('toast-compact')).toBe(true);
    const side = harness(true, 320); side.document.getElementById('toast').style.opacity = '1';
    side.rects.set('toast', { top: 292, height: 59.5 }); side.controller.sync();
    expect(side.value('--cf-planetside-floor')).toBe(292); expect(side.document.getElementById('toast').classList.contains('toast-compact')).toBe(false);
    side.rects.set('toast', { top: 291, height: 60.5 }); side.controller.sync();
    expect(side.document.getElementById('toast').classList.contains('toast-compact')).toBe(true);
    expect(side.value('--cf-planetside-floor')).toBe(307.5);
  });
  it('restores full notifications against native Planetside capacity even when its top follows the previous floor', () => {
    const h = harness(true, 320), toast = h.document.getElementById('toast'), side = h.document.getElementById('planetside');
    side.getBoundingClientRect = () => {
      const bottom = h.value('--cf-sheet-floor');
      return { top: bottom - 72, bottom, height: 72, left: 16, right: 304, width: 288 };
    };
    toast.style.opacity = '1'; h.rects.set('toast', { top: 292, height: 59.5 });
    const oldTop = side.getBoundingClientRect().top;
    h.controller.sync();
    expect(292 - oldTop < 72).toBe(true); // Moving-top predicate falsely compacts this exact-fit full state.
    expect(toast.classList.contains('toast-compact')).toBe(false); expect(h.value('--cf-sheet-floor')).toBe(292);
    h.rects.set('toast', { top: 144, height: 208 }); h.controller.sync();
    expect(toast.classList.contains('toast-compact')).toBe(true); expect(h.value('--cf-sheet-floor')).toBe(307.5);
    Object.defineProperty(h.document.defaultView, 'innerHeight', { value: 844, configurable: true });
    h.rects.set('hintpill', { top: 743, height: 60 }); h.rects.set('dock', { top: 760, height: 72 });
    h.document.defaultView.dispatchEvent(new h.document.defaultView.Event('resize')); h.flushFrames();
    expect(toast.classList.contains('toast-compact')).toBe(false); expect(h.value('--cf-sheet-floor')).toBe(519);
    h.controller.sync(); expect(toast.classList.contains('toast-compact')).toBe(false); expect(h.value('--cf-sheet-floor')).toBe(519);
  });
  it('responds to sheet refill, body and native resize changes without observing its own compact class or surviving disposal', async () => {
    const h = harness(false, 320), toast = h.document.getElementById('toast'), survey = h.document.getElementById('survey');
    toast.style.opacity = '1'; h.rects.set('toast', { top: 144, height: 208 }); survey.style.display = 'block';
    await Promise.resolve(); expect(h.frames.size).toBe(1); h.flushFrames();
    expect(toast.classList.contains('toast-compact')).toBe(true);
    await Promise.resolve(); expect(h.frames.size).toBe(0);
    const previous = h.document.getElementById('surveyheader'), replacement = previous.cloneNode(true);
    replacement.getBoundingClientRect = previous.getBoundingClientRect; previous.replaceWith(replacement);
    await Promise.resolve(); h.flushFrames();
    expect(h.observers[0]!.unobserve.mock.calls.some(([node]) => node === previous)).toBe(true);
    expect(h.observers[0]!.observe.mock.calls.some(([node]) => node === replacement)).toBe(true);
    h.document.body.classList.add('fs-xl'); await Promise.resolve(); expect(h.frames.size).toBe(1); h.flushFrames();
    Object.defineProperty(h.document.defaultView, 'innerWidth', { value: 1024, configurable: true });
    h.document.defaultView.dispatchEvent(new h.document.defaultView.Event('resize')); h.flushFrames();
    expect(toast.classList.contains('toast-compact')).toBe(false);
    Object.defineProperty(h.document.defaultView, 'innerWidth', { value: 320, configurable: true });
    h.observers[0]!.callback(); h.observers[0]!.callback(); expect(h.frames.size).toBe(1); h.flushFrames();
    expect(toast.classList.contains('toast-compact')).toBe(true);
    toast.style.opacity = '0'; await Promise.resolve(); expect(h.frames.size).toBe(1);
    h.controller.dispose(); h.flushFrames(); expect(h.frames.size).toBe(0);
    h.document.body.classList.remove('fs-xl'); survey.style.display = 'none'; await Promise.resolve();
    expect(h.frames.size).toBe(0); expect(toast.classList.contains('toast-compact')).toBe(true);
  });

  it('allocates the retained landed stack to a measured header plus usable body before capping Planetside', async () => {
    const h = harness(true, 320, 568, 52.5), survey = h.document.getElementById('survey'), hint = h.document.getElementById('hintpill');
    h.document.body.className = 'surface-mode card-open'; survey.style.display = 'block';
    h.document.getElementById('surveyheader').style.marginBottom = '10px';
    h.rects.set('surveyheader', { top: 147, height: 55 }); h.rects.set('survey', { top: 132, height: 64 });
    h.rects.set('planetside', { top: 204, height: 95 }); h.rects.set('toast', { top: 288, height: 64 });
    h.document.documentElement.style.setProperty('--surface-chrome-bottom', '128px');
    h.document.documentElement.style.setProperty('--planetside-top', '204px');
    h.document.getElementById('toast').style.opacity = '1'; hint.className = 'scene-guidance'; hint.textContent = 'Leave world to lift off';
    hint.setAttribute('aria-label', 'Scene instructions');
    h.controller.sync();
    expect(h.value('--cf-survey-start')).toBe(132); expect(h.value('--cf-survey-min-height')).toBe(139);
    expect(h.value('--cf-survey-scroll-top')).toBe(80); expect(64 < h.value('--cf-survey-min-height')).toBe(true);
    expect(287.5 - 132 >= 139 && 287.5 - 136 >= 72).toBe(true); // Each card alone fits; their stack must select compaction.
    expect(h.document.getElementById('toast').classList.contains('toast-compact')).toBe(true);
    expect(hint.className).toBe('scene-guidance sheet-guidance-yield'); expect(hint.textContent).toBe('Leave world to lift off');
    expect(hint.getAttribute('aria-label')).toBe('Scene instructions'); expect(hint.getAttribute('aria-hidden')).toBeNull();
    expect(h.document.defaultView.getComputedStyle(hint).display).not.toBe('none');
    expect(hint.getBoundingClientRect().width).toBe(1); expect(hint.getBoundingClientRect().height).toBe(1);
    expect(hint.getBoundingClientRect().top).toBe(367.5); // The clipped AT-visible rectangle must not own a lane.
    expect(h.value('--cf-lower-top')).toBe(464); expect(h.value('--cf-sheet-floor')).toBe(395.5);
    const cap = () => h.value('--cf-sheet-floor') - h.value('--cf-survey-start') - h.value('--cf-survey-min-height') - 8;
    expect(cap()).toBe(116.5);
    const side = h.document.getElementById('planetside');
    side.getBoundingClientRect = () => { const bottom = h.value('--cf-sheet-floor'), height = Math.min(95, Math.max(72, cap()));
      return { left: 16, right: 304, width: 288, top: bottom - height, bottom, height }; };
    h.controller.sync(); expect(cap()).toBe(116.5);
    expect(h.value('--cf-planetside-height')).toBe(95); expect(h.value('--planetside-top')).toBe(204);
    expect(h.value('--planetside-top') - 8 - 132).toBe(64); // No resize receipt accompanies this translation.
    expect(h.value('--cf-sheet-floor') - h.value('--cf-planetside-height') - 8 - 132).toBe(160.5);
    expect(side.getBoundingClientRect().top - 8 - 132).toBeGreaterThanOrEqual(h.value('--cf-survey-min-height'));
    await Promise.resolve(); h.flushFrames(); await Promise.resolve(); expect(h.frames.size).toBe(0);
    expect(cap()).toBe(116.5); // The published cap is independent of the previously constrained roster height.
  });
  it.each(['expiry', 'resize', 'close'])('restores native scene guidance after %s makes the landed allocation unnecessary', async reason => {
    const h = harness(true, 320, 568, 52.5), survey = h.document.getElementById('survey'), hint = h.document.getElementById('hintpill');
    hint.textContent = 'Leave world to lift off'; h.document.body.className = 'surface-mode card-open'; survey.style.display = 'block';
    h.document.getElementById('surveyheader').style.marginBottom = '10px'; h.rects.set('surveyheader', { top: 147, height: 55 });
    h.rects.set('planetside', { top: 204, height: 95 }); h.rects.set('toast', { top: 144, height: 208 });
    const toast = h.document.getElementById('toast'); toast.style.opacity = '1'; h.controller.sync();
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(true);
    if (reason === 'expiry') toast.style.opacity = '0';
    if (reason === 'close') { survey.style.display = 'none'; h.document.body.classList.remove('card-open'); }
    if (reason === 'resize') {
      Object.defineProperty(h.document.defaultView, 'innerHeight', { value: 844, configurable: true });
      h.rects.set('hintpill', { top: 700, height: 60 }); h.rects.set('dock', { top: 760, height: 72 });
      h.document.defaultView.dispatchEvent(new h.document.defaultView.Event('resize'));
    }
    await Promise.resolve(); h.flushFrames();
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(false); expect(hint.textContent).toBe('Leave world to lift off');
    expect(h.value('--cf-lower-top')).toBe(reason === 'resize' ? 700 : 367.5);
    h.controller.sync(); await Promise.resolve(); expect(h.frames.size).toBe(0);
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(false);
  });
  it('keeps native scene guidance when the cards are not a visible overlapping portrait Surface stack', () => {
    const h = harness(true, 320, 568, 52.5), survey = h.document.getElementById('survey'), hint = h.document.getElementById('hintpill');
    h.rects.set('toast', { top: 144, height: 208 }); h.document.getElementById('toast').style.opacity = '1';
    h.document.body.className = 'surface-mode card-open'; survey.style.display = 'none'; h.controller.sync();
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(false);
    survey.style.display = 'block'; h.document.body.className = 'card-open'; h.controller.sync();
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(false);
    h.document.body.className = 'surface-mode card-open'; h.rects.set('planetside', { top: 204, height: 95, left: 304, width: 288 }); h.controller.sync();
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(false);
    h.rects.set('planetside', { top: 204, height: 95 }); Object.defineProperty(h.document.defaultView, 'innerWidth', { value: 667, configurable: true }); h.controller.sync();
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(false);
  });

  it('publishes each shared sheet header clearance across wrapping and refill while retaining Survey and exact text', async () => {
    const h = harness(false, 320), panel = h.document.getElementById('setpanel'), charter = h.document.getElementById('chpanel');
    const value = (node: any) => parseFloat(node.style.getPropertyValue('--cf-sheet-scroll-top'));
    const text = charter.textContent; expect(value(panel)).toBe(71); expect(value(charter)).toBe(71);
    expect(h.document.getElementById('survey').style.getPropertyValue('--cf-sheet-scroll-top')).toBe('');
    expect(h.value('--cf-survey-scroll-top')).toBe(71);
    charter.style.display = 'block'; h.rects.set('charterheader', { top: 147, height: 96 });
    h.observers[0]!.callback(); h.flushFrames(); expect(value(charter)).toBe(123); expect(value(panel)).toBe(71);
    expect(charter.textContent).toBe(text);
    const previous = h.document.getElementById('charterheader'), replacement = previous.cloneNode(true);
    replacement.getBoundingClientRect = () => ({ left: 16, top: 147, right: 304, bottom: 211, width: 288, height: 64 });
    previous.replaceWith(replacement); await Promise.resolve(); h.flushFrames();
    expect(value(charter)).toBe(91); expect(charter.textContent).toBe(text);
    expect(h.observers[0]!.unobserve.mock.calls.some(([node]) => node === previous)).toBe(true);
    expect(h.observers[0]!.observe.mock.calls.some(([node]) => node === replacement)).toBe(true);
    replacement.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
    h.observers[0]!.callback(); h.flushFrames(); expect(value(charter)).toBe(71); // Hidden/unmeasured header retains the native 44px Close clearance.
    expect(charter.textContent).toBe(text); expect(h.value('--cf-survey-scroll-top')).toBe(71);
    expect(UI_SHEET_CSS).toContain('scroll-padding-top:var(--cf-sheet-scroll-top,80px);scroll-padding-bottom:14px');
    expect(UI_SHEET_CSS).toContain('#survey{z-index:var(--cf-layer-survey);scroll-padding-top:var(--cf-survey-scroll-top);scroll-padding-bottom:14px}');
  });
  it('ignores only its own scroll-padding style publication and still observes external style changes without a feedback loop', async () => {
    const h = harness(false, 320), panel = h.document.getElementById('setpanel'), text = panel.textContent;
    await Promise.resolve(); expect(h.frames.size).toBe(0);
    panel.style.paddingTop = '20px'; panel.style.setProperty('--cf-sheet-scroll-top', '1px', 'important');
    await Promise.resolve(); expect(h.frames.size).toBe(1); h.flushFrames();
    expect(panel.style.getPropertyValue('--cf-sheet-scroll-top')).toBe('77.00px');
    expect(panel.style.getPropertyPriority('--cf-sheet-scroll-top')).toBe(''); expect(panel.style.paddingTop).toBe('20px');
    await Promise.resolve(); expect(h.frames.size).toBe(0);
    h.controller.sync(); await Promise.resolve(); expect(h.frames.size).toBe(0); expect(panel.textContent).toBe(text);
    panel.style.paddingTop = '24px'; await Promise.resolve(); expect(h.frames.size).toBe(1);
    h.controller.dispose(); h.flushFrames(); await Promise.resolve(); expect(h.frames.size).toBe(0);
    expect(panel.style.getPropertyValue('--cf-sheet-scroll-top')).toBe('77.00px');
  });

});
