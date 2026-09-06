import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSheetLayoutController } from '../apps/game/src/sheet-layout.js';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const cleanups: Array<() => void> = [];
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); });
function harness(includePlanetside = true) {
  const dom = new JSDOM('<!doctype html><body><div id="topbar"></div><div id="hintpill"></div><div id="ctxbar"></div><div id="dock"></div><div id="toast" style="opacity:0"></div>'
    + (includePlanetside ? '<div id="planetside"></div>' : ''), { pretendToBeVisual: true });
  const { document } = dom.window;
  Object.defineProperty(dom.window, 'innerHeight', { value: 568, configurable: true });
  const rects = new Map<string, { top: number; height: number; left?: number; width?: number }>([
    ['topbar', { top: 0, height: 104 }], ['hintpill', { top: 367.5, height: 76.5 }],
    ['ctxbar', { top: 0, height: 0 }], ['dock', { top: 464, height: 92 }],
    ['toast', { top: 300, height: 64 }], ['planetside', { top: 220, height: 90 }],
  ]);
  for (const id of rects.keys()) {
    const node = document.getElementById(id);
    if (!node) continue;
    node.getBoundingClientRect = () => {
      const r = rects.get(id)!, left = r.left ?? 16, width = r.width ?? 288;
      return { ...r, bottom: r.top + r.height, width, left, right: left + width };
    };
  }
  const frames = new Map<number, FrameRequestCallback>(); let frameId = 0;
  dom.window.requestAnimationFrame = (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; };
  dom.window.cancelAnimationFrame = (id: number) => frames.delete(id);
  const flushFrames = () => { for (const [id, callback] of [...frames]) { frames.delete(id); callback(0); } };
  const observers: Array<{ callback: () => void; disconnect: ReturnType<typeof vi.fn>; observe: ReturnType<typeof vi.fn> }> = [];
  dom.window.ResizeObserver = class {
    callback: () => void; disconnect = vi.fn(); observe = vi.fn();
    constructor(callback: () => void) { this.callback = callback; observers.push(this); }
  };
  const controller = createSheetLayoutController(document);
  cleanups.push(() => { controller.dispose(); dom.window.close(); });
  const value = (name: string) => parseFloat(document.documentElement.style.getPropertyValue(name));
  return { document, rects, controller, observers, value, flushFrames, frames };
}
describe('measured U2 sheet lanes', () => {
  it('clears the retained 320×568 A++ hint by 8px, not the old 390px edge', () => {
    const h = harness();
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
    const h = harness(), toast = h.document.getElementById('toast');
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
});
