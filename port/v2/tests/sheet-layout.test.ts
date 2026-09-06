import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSheetLayoutController } from '../apps/game/src/sheet-layout.js';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const cleanups: Array<() => void> = [];
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); });
function harness(includePlanetside = true, width = 1024, height = 568) {
  const dom = new JSDOM('<!doctype html><body><div id="topbar"></div><div id="hintpill"></div><div id="ctxbar"></div><div id="dock"></div>'
    + '<div id="toast" class="notice-kind" style="opacity:0" role="status" aria-live="polite"><b data-sel="toast-title">Beyond Your Charter</b><span data-sel="toast-message">Build the required drive.</span></div>'
    + '<div id="survey" style="display:none;padding:14px;border:1px solid"><div id="surveyheader" class="survey-head" style="margin:0 0 12px">Earth</div></div>'
    + '<div id="setpanel" class="panel" style="display:none;padding:14px;border:1px solid"><h3 id="panelheader" class="sheet-header" style="margin:0 0 12px">Settings</h3></div>'
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
  ]);
  for (const id of rects.keys()) {
    const node = document.getElementById(id);
    if (!node) continue;
    node.getBoundingClientRect = () => {
      const r = rects.get(id)!, left = r.left ?? 16, width = r.width ?? 288;
      const height = id === 'toast' && node.classList.contains('toast-compact') ? 44 : r.height;
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

});
