import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSheetLayoutController } from '../apps/game/src/sheet-layout.js';
import { UI_SHEET_CSS } from '../apps/game/src/ui-sheet-style.js';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const cleanups: Array<() => void> = [];
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); });
function harness(includePlanetside = true, width = 1024, height = 568, compactToastHeight = 44) {
  const dom = new JSDOM('<!doctype html><style>:is(#hintpill,#ctxbar).sheet-guidance-yield{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;pointer-events:none}</style><body><div id="topbar" style="pointer-events:none"><button id="objchip">Current objective</button></div><div id="hintpill"></div><div id="ctxbar"></div><div id="dock"></div>'
    + '<div id="toast" class="notice-kind" style="opacity:0" role="status" aria-live="polite"><b data-sel="toast-title">Beyond Your Charter</b><span data-sel="toast-message">Build the required drive.</span></div>'
    + '<div id="survey" style="display:none;padding:14px;border:1px solid"><div id="surveyheader" class="survey-head" style="margin:0 0 12px">Earth</div></div>'
    + '<div id="setpanel" class="panel" style="display:none;padding:14px;border:1px solid"><h3 id="panelheader" class="sheet-header" style="margin:0 0 12px">Settings</h3></div>'
    + '<div id="chpanel" class="panel" style="display:none;padding:14px;border:1px solid"><h3 id="charterheader" class="sheet-header" style="margin:0 0 12px">📜 Charters</h3></div>'
    + (includePlanetside ? '<div id="planetside"></div>' : ''), { pretendToBeVisual: true });
  const { document } = dom.window;
  document.documentElement.style.setProperty('--surface-chrome-bottom', '212px');
  document.documentElement.style.setProperty('--hint-h', '77px');
  Object.defineProperty(dom.window, 'innerHeight', { value: height, configurable: true });
  Object.defineProperty(dom.window, 'innerWidth', { value: width, configurable: true });
  const rects = new Map<string, { top: number; height: number; left?: number; width?: number }>([
    ['topbar', { top: 0, height: 104 }], ['objchip', { top: 168, height: 44 }], ['hintpill', { top: 367.5, height: 76.5 }],
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
      const yieldedHint = ['hintpill', 'ctxbar'].includes(id) && node.classList.contains('sheet-guidance-yield');
      const r = rects.get(id)!, left = r.left ?? 16, width = yieldedHint ? 1 : r.width ?? 288;
      const height = yieldedHint ? 1 : id === 'toast' && node.classList.contains('toast-compact') ? compactToastHeight : r.height;
      return { ...r, height, bottom: r.top + height, width, left, right: left + width };
    };
  }
  Object.defineProperty(document.getElementById('hintpill'), 'offsetHeight', { get: () => document.getElementById('hintpill').style.display === 'none' ? 0 : Math.round(document.getElementById('hintpill').getBoundingClientRect().height) });
  const frames = new Map<number, FrameRequestCallback>(); let frameId = 0;
  dom.window.requestAnimationFrame = (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; };
  dom.window.cancelAnimationFrame = (id: number) => frames.delete(id);
  const flushFrames = () => { for (const [id, callback] of [...frames]) { frames.delete(id); callback(0); } };
  const observers: Array<{ callback: () => void; disconnect: ReturnType<typeof vi.fn>; observe: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn> }> = [];
  dom.window.ResizeObserver = class {
    callback: () => void; disconnect = vi.fn(); observe = vi.fn(); unobserve = vi.fn();
    constructor(callback: () => void) { this.callback = callback; observers.push(this); }
  };
  const upperChange = vi.fn();
  const controller = createSheetLayoutController(document, upperChange);
  cleanups.push(() => { controller.dispose(); dom.window.close(); });
  const value = (name: string) => parseFloat(document.documentElement.style.getPropertyValue(name));
  return { document, rects, controller, observers, value, flushFrames, frames, upperChange };
}
describe('measured U2 sheet lanes', () => {
  it('compacts a tall objective before panel input, remeasures, and expands when room returns', async () => {
    const h = harness(false, 320), objective = h.document.getElementById('objchip');
    const panel = h.document.getElementById('chpanel'), view = h.document.defaultView;
    objective.setAttribute('aria-label', 'Full expedition objective');
    const text = objective.textContent, label = objective.getAttribute('aria-label');
    h.rects.set('chpanel', { top: 339, height: 70.5 });
    h.rects.set('charterheader', { top: 354, height: 84.56 });
    h.upperChange.mockImplementation(() => {
      h.rects.set('chpanel', { top: objective.classList.contains('sheet-objective-compact') ? 132 : 339, height: 70.5 });
      panel.scrollTop = 0; // Browser clamp during the temporary header projection.
    });
    panel.scrollTop = 240;
    panel.style.display = 'block'; h.document.body.classList.add('panel-open');
    h.document.dispatchEvent(new view.Event('cf-panel-layout'));
    expect(objective.classList.contains('sheet-objective-compact')).toBe(true);
    expect(objective.classList.contains('sheet-objective-yield')).toBe(false);
    expect(h.value('--cf-sheet-floor') - panel.getBoundingClientRect().top).toBeGreaterThan(170);
    expect(panel.scrollTop).toBe(240);
    await Promise.resolve(); h.flushFrames(); await Promise.resolve(); h.flushFrames();
    h.controller.sync(); await Promise.resolve(); expect(h.frames.size).toBe(0);
    Object.defineProperty(view, 'innerHeight', { value: 900, configurable: true });
    h.rects.set('hintpill', { top: 700, height: 76 }); h.rects.set('dock', { top: 800, height: 92 });
    view.dispatchEvent(new view.Event('resize')); h.flushFrames();
    expect(objective.classList.contains('sheet-objective-compact')).toBe(false);
    expect(objective.textContent).toBe(text); expect(objective.getAttribute('aria-label')).toBe(label);
    h.controller.dispose(); h.document.body.classList.add('card-open');
    h.document.dispatchEvent(new view.Event('cf-panel-layout'));
    expect(objective.classList.contains('sheet-objective-yield')).toBe(false);
  });
  it('observes portrait Survey yield and restores the objective for a panel, close and rotation', async () => {
    const h = harness(true, 320), objective = h.document.getElementById('objchip');
    const { body, defaultView: view } = h.document;
    h.upperChange.mockImplementation(() => {
      // Callback sees the final visibility class before sheet measurements.
      expect(objective.classList.contains('sheet-objective-yield')).toBe(
        body.classList.contains('card-open') && view.innerHeight >= view.innerWidth);
    });
    const settle = async () => { await Promise.resolve(); h.flushFrames(); await Promise.resolve(); h.flushFrames(); };
    body.classList.add('panel-open'); await settle();
    expect(objective.classList.contains('sheet-objective-yield')).toBe(false);
    body.classList.add('card-open'); await settle();
    expect(objective.classList.contains('sheet-objective-yield')).toBe(true);
    expect(h.upperChange).toHaveBeenCalledTimes(1);
    // Wrong retained class is repaired by the observed layout path.
    objective.classList.remove('sheet-objective-yield'); await settle();
    expect(objective.classList.contains('sheet-objective-yield')).toBe(true);
    // Same-task close/reopen must not publish an intermediate header.
    body.classList.remove('card-open'); body.classList.add('card-open'); await settle();
    expect(h.upperChange).toHaveBeenCalledTimes(2);
    body.classList.remove('card-open'); await settle();
    expect(objective.classList.contains('sheet-objective-yield')).toBe(false);
    expect(body.classList.contains('panel-open')).toBe(true);
    body.classList.add('card-open'); await settle();
    Object.defineProperty(view, 'innerWidth', { value: 844, configurable: true });
    view.dispatchEvent(new view.Event('resize')); h.flushFrames();
    expect(objective.classList.contains('sheet-objective-yield')).toBe(false);
    expect(objective.textContent).toBe('Current objective');
  });
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

  it('reclaims both passive lanes for the retained wrapped Charters header without altering native text or targets', () => {
    const h = harness(false, 320, 568, 38.5), panel = h.document.getElementById('chpanel');
    const hint = h.document.getElementById('hintpill'), caption = h.document.getElementById('ctxbar');
    h.document.body.className = 'panel-open fs-xl font-mono'; panel.style.display = 'block'; panel.setAttribute('aria-hidden', 'false');
    hint.textContent = 'Explore the current scene'; caption.textContent = 'Earth · Sol'; caption.setAttribute('aria-label', 'Scene caption');
    h.rects.set('chpanel', { left: 8, width: 304, top: 132, height: 107.5 });
    h.rects.set('charterheader', { left: 23, width: 182, top: 147, height: 84.56 });
    h.rects.set('ctxbar', { top: 316, height: 48 }); h.document.getElementById('toast').style.opacity = '1';
    h.controller.sync();
    expect(239.5 - (147 + 84.56)).toBeCloseTo(7.94); // Retained native body deficit.
    expect(h.value('--cf-sheet-floor')).toBe(409.5); expect(h.value('--cf-lower-top')).toBe(464);
    expect(h.value('--cf-sheet-floor') - 132).toBeGreaterThanOrEqual(84.56 + 12 + 30 + 44);
    for (const node of [hint, caption]) {
      expect(node.classList.contains('sheet-guidance-yield')).toBe(true);
      expect(node.getBoundingClientRect().height).toBe(1); expect(node.getAttribute('aria-hidden')).toBeNull();
      expect(h.document.defaultView.getComputedStyle(node).display).not.toBe('none');
    }
    expect(hint.textContent).toBe('Explore the current scene'); expect(caption.textContent).toBe('Earth · Sol');
    expect(caption.getAttribute('aria-label')).toBe('Scene caption');
    expect(UI_SHEET_CSS).toContain(':is(#hintpill,#ctxbar).sheet-guidance-yield{');
    expect(UI_SHEET_CSS).toContain('#toast.toast-compact{padding:var(--cf-space-1) var(--cf-space-2)}');
    expect(UI_SHEET_CSS).toContain('calc(var(--cf-sheet-floor) - var(--cf-planetside-start))');
  });
  it('allocates a standalone 72px biosphere below the live Objective and releases on native Objective refill', async () => {
    const h = harness(true, 320, 568, 38.5), side = h.document.getElementById('planetside');
    const hint = h.document.getElementById('hintpill'), caption = h.document.getElementById('ctxbar'), objective = h.document.getElementById('objchip');
    h.document.body.className = 'surface-mode'; h.rects.set('objchip', { top: 60, height: 262.88 });
    h.rects.set('topbar', { top: 0, height: 330.88 }); h.rects.set('ctxbar', { top: 344, height: 48 });
    h.document.documentElement.style.setProperty('--surface-chrome-bottom', '1px');
    h.document.documentElement.style.setProperty('--planetside-top', '999px');
    side.getBoundingClientRect = () => { const bottom = h.value('--cf-sheet-floor');
      return { top: bottom - 72, bottom, height: 72, left: 16, right: 304, width: 288 }; };
    h.document.getElementById('toast').style.opacity = '1'; h.controller.sync();
    expect(h.value('--cf-planetside-start')).toBeCloseTo(330.88);
    expect(h.value('--cf-sheet-floor')).toBe(409.5);
    expect(h.value('--cf-sheet-floor') - h.value('--cf-planetside-start')).toBeCloseTo(78.62);
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(true);
    h.controller.sync(); expect(h.value('--cf-planetside-start')).toBeCloseTo(330.88); // Previous moving top is not an input.
    h.rects.set('objchip', { top: 160, height: 44 }); h.rects.set('ctxbar', { top: 0, height: 0 });
    objective.textContent = 'Next charter'; await Promise.resolve(); expect(h.frames.size).toBe(1); h.flushFrames();
    expect(h.value('--cf-planetside-start')).toBe(212); expect(h.value('--cf-sheet-floor')).toBe(287.5);
    expect(h.document.getElementById('toast').classList.contains('toast-compact')).toBe(false);
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(false); expect(caption.classList.contains('sheet-guidance-yield')).toBe(false);
    expect(h.value('--surface-chrome-bottom')).toBe(1); expect(h.value('--planetside-top')).toBe(999);
    await Promise.resolve(); expect(h.frames.size).toBe(0);
  });
  it('reevaluates wrapped panel preferences, header refill, clipped caption refill and Close without an owned-class loop', async () => {
    const h = harness(false, 320, 568, 38.5), panel = h.document.getElementById('chpanel');
    const caption = h.document.getElementById('ctxbar'), hint = h.document.getElementById('hintpill'), toast = h.document.getElementById('toast');
    h.document.body.className = 'panel-open'; panel.style.display = 'block'; h.rects.set('ctxbar', { top: 345, height: 48 });
    toast.style.opacity = '1'; h.controller.sync(); expect(toast.classList.contains('toast-compact')).toBe(false);
    h.rects.set('charterheader', { top: 147, height: 84.56 }); h.document.body.classList.add('fs-xl');
    await Promise.resolve(); h.flushFrames(); expect(caption.classList.contains('sheet-guidance-yield')).toBe(true);
    await Promise.resolve(); expect(h.frames.size).toBe(0);
    // Native caption content can shrink while its yielded painted size remains 1px.
    h.rects.set('ctxbar', { top: 365, height: 18 }); caption.textContent = 'Sol';
    const oldHeader = h.document.getElementById('charterheader'), newHeader = oldHeader.cloneNode(true);
    newHeader.getBoundingClientRect = () => ({ top: 147, bottom: 211, height: 64, left: 16, right: 304, width: 288 });
    oldHeader.replaceWith(newHeader); await Promise.resolve(); expect(h.frames.size).toBe(1); h.flushFrames();
    expect(caption.classList.contains('sheet-guidance-yield')).toBe(false); expect(hint.classList.contains('sheet-guidance-yield')).toBe(false);
    expect(toast.classList.contains('toast-compact')).toBe(false); // Full floor293 now clears the 282px panel minimum.
    expect(caption.textContent).toBe('Sol');
    h.rects.set('ctxbar', { top: 300, height: 65 }); caption.textContent = 'Earth · a much longer native scene caption';
    await Promise.resolve(); h.flushFrames(); expect(caption.classList.contains('sheet-guidance-yield')).toBe(true);
    panel.style.display = 'none'; h.document.body.classList.remove('panel-open');
    await Promise.resolve(); h.flushFrames(); expect(caption.classList.contains('sheet-guidance-yield')).toBe(false);
    expect(toast.classList.contains('toast-compact')).toBe(false);
    await Promise.resolve(); expect(h.frames.size).toBe(0);
  });
  it.each([{ stale: '1px', priority: '', header: 80, notice: '1', yielded: true },
    { stale: '500px', priority: 'important', header: 44, notice: '0', yielded: false }])(
    'uses natural caption placement with stale $stale hint height and restores its exact priority', async ({ stale, priority, header, notice, yielded }) => {
      const h = harness(false, 320, 568, 38.5), root = h.document.documentElement, caption = h.document.getElementById('ctxbar');
      h.document.body.className = 'panel-open'; h.document.getElementById('chpanel').style.display = 'block';
      h.rects.set('charterheader', { top: 147, height: header }); h.document.getElementById('toast').style.opacity = notice;
      root.style.setProperty('--hint-h', stale, priority);
      caption.getBoundingClientRect = () => {
        const top = 568 - Math.max(164, 124 + parseFloat(root.style.getPropertyValue('--hint-h')) + 8) - 48;
        const height = caption.classList.contains('sheet-guidance-yield') ? 1 : 48;
        return { top, bottom: top + height, height, left: 16, right: 304, width: 288 };
      };
      h.controller.sync();
      expect(root.style.getPropertyValue('--hint-h')).toBe(stale); expect(root.style.getPropertyPriority('--hint-h')).toBe(priority);
      expect(caption.classList.contains('sheet-guidance-yield')).toBe(yielded);
      expect(h.value('--cf-lower-top')).toBe(yielded ? 464 : 311);
      const naturalAvailable = 311 - 8 - (notice === '1' ? 38.5 + 8 : 0);
      const staleTop = 568 - Math.max(164, 124 + parseFloat(stale) + 8) - 48;
      expect(naturalAvailable < 132 + header + 12 + 30 + 44).toBe(yielded);
      expect(staleTop - 8 - (notice === '1' ? 38.5 + 8 : 0) < 132 + header + 12 + 30 + 44).toBe(!yielded);
      // AppChrome's later natural receipt must not change the decision.
      root.style.setProperty('--hint-h', '77px'); h.observers[0]!.callback(); h.flushFrames();
      expect(caption.classList.contains('sheet-guidance-yield')).toBe(yielded);
      await Promise.resolve(); h.flushFrames(); await Promise.resolve(); expect(h.frames.size).toBe(0);
    });
  it('restores an originally absent hint property, excludes invisible upper chrome and includes a blocking wrapper', () => {
    const h = harness(true, 320, 568, 38.5), root = h.document.documentElement, topbar = h.document.getElementById('topbar'), objective = h.document.getElementById('objchip');
    root.style.removeProperty('--hint-h'); h.rects.set('topbar', { top: 0, height: 400 });
    h.controller.sync(); expect(root.style.getPropertyValue('--hint-h')).toBe(''); expect(h.value('--cf-planetside-start')).toBe(220);
    topbar.style.pointerEvents = 'auto'; h.controller.sync(); expect(h.value('--cf-planetside-start')).toBe(408);
    topbar.style.pointerEvents = 'none'; objective.style.opacity = '0'; h.controller.sync(); expect(h.value('--cf-planetside-start')).toBe(8);
    objective.style.opacity = '1'; objective.style.display = 'none'; h.controller.sync(); expect(h.value('--cf-planetside-start')).toBe(8);
    objective.style.display = 'block'; h.controller.sync(); expect(h.value('--cf-planetside-start')).toBe(220);
    expect(root.style.getPropertyValue('--hint-h')).toBe('');
  });
  it('keeps the global toast floor for disjoint portrait panels and does not clip guidance that cannot release room', () => {
    const h = harness(false, 320, 568, 38.5), panel = h.document.getElementById('chpanel'), hint = h.document.getElementById('hintpill');
    panel.style.display = 'block'; h.rects.set('charterheader', { top: 147, height: 84.56 });
    h.rects.set('toast', { top: 300, height: 64, left: 304, width: 288 }); h.document.getElementById('toast').style.opacity = '1';
    h.controller.sync(); expect(h.document.getElementById('toast').classList.contains('toast-compact')).toBe(false);
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(true); expect(h.value('--cf-sheet-floor')).toBe(384);
    h.rects.set('dock', { top: 250, height: 92 }); h.controller.sync();
    expect(hint.classList.contains('sheet-guidance-yield')).toBe(false); expect(h.value('--cf-sheet-floor')).toBe(170);
    expect(h.value('--cf-sheet-floor') - 132).toBeLessThan(84.56 + 12 + 30 + 44); // Unreachable space stays deficient, not a manufactured pass.
  });

});
