// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createBus } from '../src/bus';
import type { GameEvents } from '../src/events';
import { mountViewport, windowViewportSource, type ViewportSource } from '../src/layout';
import { sizeClass, SIZE_CLASS_LIMITS } from '../src/layout/size-class';

describe('sizeClass', () => {
  it.each([
    [390, 844, 'compact'], [430, 932, 'compact'], [360, 640, 'compact'],
    [844, 390, 'medium'], [932, 430, 'medium'], [768, 1024, 'medium'], [1024, 768, 'medium'],
    [1400, 500, 'medium'],
    [1180, 820, 'wide'], [1280, 800, 'wide'], [1920, 1080, 'wide'],
  ])('%i x %i is %s', (w, h, expected) => { expect(sizeClass(w, h)).toBe(expected); });
  it.each([[0, 800], [800, 0], [NaN, 800], [-1, 800], [Infinity, 800], [800, NaN], [800, Infinity]])('refuses %s x %s', (w, h) => {
    expect(() => sizeClass(w, h)).toThrow(RangeError);
  });
  it('changes class exactly at its limits, fractional sizes included', () => {
    expect(SIZE_CLASS_LIMITS).toEqual({ compactMaxWidth: 599, wideMinWidth: 1100, wideMinHeight: 600 });
    expect(sizeClass(599, 900)).toBe('compact');
    expect(sizeClass(599.5, 900)).toBe('compact');
    expect(sizeClass(600, 900)).toBe('medium');
    expect(sizeClass(1099.5, 900)).toBe('medium');
    expect(sizeClass(1100, 599.5)).toBe('medium');
    expect(sizeClass(1100, 600)).toBe('wide');
  });
});

function fakeViewport(width: number, height: number): ViewportSource & { set(w: number, h: number): void; listeners: number } {
  let size = { width, height };
  const listeners = new Set<() => void>();
  return {
    read: () => size,
    subscribe(onChange) { listeners.add(onChange); return () => { listeners.delete(onChange); }; },
    set(w, h) { size = { width: w, height: h }; for (const l of [...listeners]) l(); },
    get listeners() { return listeners.size; },
  };
}

describe('viewport', () => {
  it('layout:size-class is emitted once when the class changes and not when only the size changes', () => {
    const bus = createBus<GameEvents>();
    const seen: Array<GameEvents['layout:size-class']> = [];
    bus.on('layout:size-class', (p) => seen.push(p));
    const root = document.createElement('html');
    const source = fakeViewport(390, 844);
    mountViewport(root, bus, source);
    expect(root.dataset.sizeClass).toBe('compact');
    expect(seen).toEqual([{ sizeClass: 'compact', width: 390, height: 844 }]);
    source.set(430, 932);
    source.set(430, 700);
    expect(seen).toHaveLength(1);
    source.set(1280, 800);
    expect(root.dataset.sizeClass).toBe('wide');
    source.set(1920, 1080);
    source.set(1024, 768);
    expect(root.dataset.sizeClass).toBe('medium');
    expect(seen.slice(1)).toEqual([
      { sizeClass: 'wide', width: 1280, height: 800 },
      { sizeClass: 'medium', width: 1024, height: 768 },
    ]);
  });
  it('exposes the four safe-area insets as CSS variables on the root', () => {
    const root = document.createElement('html');
    mountViewport(root, createBus<GameEvents>(), fakeViewport(390, 844));
    for (const side of ['top', 'right', 'bottom', 'left']) {
      expect(root.style.getPropertyValue(`--safe-${side}`)).toBe(`env(safe-area-inset-${side}, 0px)`);
    }
  });
  it('after its disposer runs it stops listening and emits nothing more', () => {
    const bus = createBus<GameEvents>();
    let heard = 0;
    bus.on('layout:size-class', () => { heard++; });
    const root = document.createElement('html');
    const source = fakeViewport(390, 844);
    const dispose = mountViewport(root, bus, source);
    dispose();
    expect(source.listeners).toBe(0);
    source.set(1280, 800);
    expect(heard).toBe(1);
    expect(root.dataset.sizeClass).toBe('compact');
  });
  it('the window source reads the window size and reports its resize until unsubscribed', () => {
    const source = windowViewportSource(window);
    expect(source.read()).toEqual({ width: window.innerWidth, height: window.innerHeight });
    let heard = 0;
    const stop = source.subscribe(() => { heard++; });
    window.dispatchEvent(new Event('resize'));
    stop();
    window.dispatchEvent(new Event('resize'));
    expect(heard).toBe(1);
  });
});
