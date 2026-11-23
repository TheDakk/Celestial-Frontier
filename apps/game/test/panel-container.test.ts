// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountPanelContainer, type ResizeObserverLike } from '../src/layout';
import { panelWidthClass, PANEL_WIDTH_LIMITS } from '../src/layout/panel-container';

function panel(width: number): HTMLElement {
  const el = document.createElement('section');
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: width });
  return el;
}

/** An observer the test drives by hand; it records what it was asked to watch. */
function fakeObserver(): { make: (onWidth: (width: number) => void) => ResizeObserverLike; report(width: number): void; onWidth: (width: number) => void; watched: Element[]; connected: boolean } {
  const state = {
    watched: [] as Element[],
    connected: false,
    onWidth: (_: number): void => {},
    make(onWidth: (width: number) => void): ResizeObserverLike {
      state.onWidth = onWidth;
      return {
        observe(el) { state.watched.push(el); state.connected = true; },
        disconnect() { state.connected = false; },
      };
    },
    report(width: number): void { if (state.connected) state.onWidth(width); },
  };
  return state;
}

describe('panelWidthClass', () => {
  it('is narrow up to 419, regular up to 719 and broad above', () => {
    expect(PANEL_WIDTH_LIMITS).toEqual({ narrowMax: 419, regularMax: 719 });
    expect([0, 419, 419.5, 420, 719, 719.5, 720, 4000].map(panelWidthClass))
      .toEqual(['narrow', 'narrow', 'narrow', 'regular', 'regular', 'regular', 'broad', 'broad']);
  });
  it.each([NaN, -1, Infinity])('refuses %s', (w) => {
    expect(() => panelWidthClass(w)).toThrow(RangeError);
  });
});

describe('panel container', () => {
  it('the same panel reports narrow in a 400 px container and broad in an 800 px container, in the same window', () => {
    const windowWidth = window.innerWidth;
    const a = panel(400);
    const b = panel(800);
    mountPanelContainer(a, fakeObserver().make);
    mountPanelContainer(b, fakeObserver().make);
    expect(window.innerWidth).toBe(windowWidth);
    expect(a.dataset.panelW).toBe('narrow');
    expect(b.dataset.panelW).toBe('broad');
  });
  it('follows every later change of its own width', () => {
    const el = panel(400);
    const observer = fakeObserver();
    mountPanelContainer(el, observer.make);
    expect(observer.watched).toEqual([el]);
    observer.report(600);
    expect(el.dataset.panelW).toBe('regular');
    observer.report(900);
    expect(el.dataset.panelW).toBe('broad');
    observer.report(300);
    expect(el.dataset.panelW).toBe('narrow');
  });
  it('after its disposer runs the observer is disconnected and the attribute no longer changes', () => {
    const el = panel(400);
    const observer = fakeObserver();
    const dispose = mountPanelContainer(el, observer.make);
    dispose();
    expect(observer.connected).toBe(false);
    observer.onWidth(900);
    expect(el.dataset.panelW).toBe('narrow');
  });
});
