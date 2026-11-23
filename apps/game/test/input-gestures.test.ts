// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createBus } from '../src/bus';
import type { GameEvents } from '../src/events';
import { PICK_RADIUS_PX, mountGestures, mountInputMode, type Gesture } from '../src/input';
import { TAP_SLOP_PX, createGestureRecognizer } from '../src/input/gestures';
import { TARGET_MIN_PX, inputModeFor } from '../src/input/mode';

describe('gesture recognizer', () => {
  it('a press and release within the threshold is a tap; beyond it a pan, with no tap', () => {
    expect(TAP_SLOP_PX).toBe(8);
    const still = createGestureRecognizer();
    still.down(1, 100, 100);
    expect(still.move(1, 103, 104)).toBeNull();
    expect(still.move(1, 100, 108)).toBeNull();
    expect(still.up(1, 100, 108)).toEqual({ kind: 'tap', x: 100, y: 108 });

    const dragged = createGestureRecognizer();
    dragged.down(1, 100, 100);
    expect(dragged.move(1, 105, 100)).toBeNull();
    // Crossing the threshold pans by the whole way from the press, so nothing of the drag is lost.
    expect(dragged.move(1, 109, 100)).toEqual({ kind: 'pan', dx: 9, dy: 0 });
    expect(dragged.move(1, 112, 96)).toEqual({ kind: 'pan', dx: 3, dy: -4 });
    // Coming back to the start does not turn the drag into a tap.
    expect(dragged.move(1, 100, 100)).toEqual({ kind: 'pan', dx: -12, dy: 4 });
    expect(dragged.up(1, 100, 100)).toBeNull();
  });
  it('a press with no move at all is a tap where it was released', () => {
    const r = createGestureRecognizer();
    r.down(7, 40, 50);
    expect(r.up(7, 40, 50)).toEqual({ kind: 'tap', x: 40, y: 50 });
    // The next press starts clean.
    r.down(7, 10, 10);
    expect(r.up(7, 11, 10)).toEqual({ kind: 'tap', x: 11, y: 10 });
  });
  it('two fingers moving apart zoom by the ratio of their distances, about their midpoint', () => {
    const r = createGestureRecognizer();
    r.down(1, 100, 100);
    r.down(2, 200, 100);
    expect(r.move(2, 300, 100)).toEqual({ kind: 'zoom', factor: 2, x: 200, y: 100 });
    expect(r.move(1, 200, 100)).toEqual({ kind: 'zoom', factor: 0.5, x: 250, y: 100 });
    expect(r.move(1, 200, 200)).toEqual({ kind: 'zoom', factor: Math.hypot(100, 100) / 100, x: 250, y: 150 });
  });
  it('lifting one of two fingers ends the pinch with no tap; the finger left pans at once', () => {
    const r = createGestureRecognizer();
    r.down(1, 100, 100);
    r.down(2, 200, 100);
    expect(r.up(2, 200, 100)).toBeNull();
    expect(r.move(1, 102, 100)).toEqual({ kind: 'pan', dx: 2, dy: 0 });
    expect(r.up(1, 102, 100)).toBeNull();
    // A new pinch measures from where the fingers are now, not from the old one.
    r.down(1, 0, 0);
    r.down(2, 10, 0);
    expect(r.move(2, 20, 0)).toEqual({ kind: 'zoom', factor: 2, x: 10, y: 0 });
  });
  it('a cancelled press gives no tap, and moves of a pointer that is not down give nothing', () => {
    const r = createGestureRecognizer();
    r.down(1, 100, 100);
    r.cancel(1);
    expect(r.up(1, 100, 100)).toBeNull();
    expect(r.move(1, 150, 150)).toBeNull();
    expect(r.move(9, 150, 150)).toBeNull();
  });
  it('the wheel zooms about the cursor: out by 0.88 when it turns down, in by 1.14 otherwise; a secondary press goes back', () => {
    const r = createGestureRecognizer();
    expect(r.wheel(120, 30, 40)).toEqual({ kind: 'zoom', factor: 0.88, x: 30, y: 40 });
    expect(r.wheel(-120, 30, 40)).toEqual({ kind: 'zoom', factor: 1.14, x: 30, y: 40 });
    expect(r.secondary()).toEqual({ kind: 'back' });
  });
});

const fire = (target: EventTarget, type: string, init: Record<string, unknown> = {}): Event => {
  const event = Object.assign(new Event(type, { bubbles: true, cancelable: true }), init);
  target.dispatchEvent(event);
  return event;
};

describe('gestures on an element', () => {
  it('turns pointer, wheel and secondary-press events into gestures, with positions measured from the element', () => {
    const el = document.createElement('div');
    document.body.append(el);
    el.getBoundingClientRect = () => ({ left: 10, top: 20, right: 310, bottom: 220, width: 300, height: 200, x: 10, y: 20, toJSON: () => ({}) });
    const seen: Gesture[] = [];
    const dispose = mountGestures(el, window, (g) => seen.push(g));
    expect(el.style.touchAction).toBe('none');
    fire(el, 'pointerdown', { pointerId: 1, clientX: 110, clientY: 120 });
    fire(window, 'pointerup', { pointerId: 1, clientX: 111, clientY: 120 });
    fire(el, 'pointerdown', { pointerId: 1, clientX: 110, clientY: 120 });
    fire(window, 'pointermove', { pointerId: 1, clientX: 130, clientY: 120 });
    fire(window, 'pointerup', { pointerId: 1, clientX: 130, clientY: 120 });
    const wheel = fire(el, 'wheel', { deltaY: 100, clientX: 60, clientY: 70 });
    const menu = fire(el, 'contextmenu');
    expect(seen).toEqual([
      { kind: 'tap', x: 101, y: 100 },
      { kind: 'pan', dx: 20, dy: 0 },
      { kind: 'zoom', factor: 0.88, x: 50, y: 50 },
      { kind: 'back' },
    ]);
    // The page neither scrolls nor opens its menu.
    expect([wheel.defaultPrevented, menu.defaultPrevented]).toEqual([true, true]);
    // A press that began elsewhere is not this element's.
    fire(window, 'pointermove', { pointerId: 5, clientX: 0, clientY: 0 });
    fire(window, 'pointerup', { pointerId: 5, clientX: 0, clientY: 0 });
    expect(seen).toHaveLength(4);
    dispose();
    fire(el, 'pointerdown', { pointerId: 1, clientX: 110, clientY: 120 });
    fire(window, 'pointerup', { pointerId: 1, clientX: 110, clientY: 120 });
    fire(el, 'wheel', { deltaY: 100, clientX: 60, clientY: 70 });
    expect(seen).toHaveLength(4);
  });
});

describe('input mode', () => {
  it('a mouse is mouse; touch, pen and anything unknown are touch', () => {
    expect(['mouse', 'touch', 'pen', '', 'stylus'].map(inputModeFor)).toEqual(['mouse', 'touch', 'touch', 'touch', 'touch']);
    expect(TARGET_MIN_PX).toEqual({ touch: 44, mouse: 32 });
    expect(PICK_RADIUS_PX).toEqual({ touch: 22, mouse: 10 });
  });
  it('follows the last pointer used: the root carries it with the smallest control size, and input:mode is sent on each change only', () => {
    const root = document.createElement('html');
    const source = new EventTarget();
    const bus = createBus<GameEvents>();
    const seen: string[] = [];
    bus.on('input:mode', (p) => seen.push(p.mode));
    const dispose = mountInputMode(root, bus, source, 'touch');
    expect([root.dataset.input, root.style.getPropertyValue('--target-min')]).toEqual(['touch', '44px']);
    fire(source, 'pointerdown', { pointerType: 'touch' });
    fire(source, 'pointerdown', { pointerType: 'mouse' });
    expect([root.dataset.input, root.style.getPropertyValue('--target-min')]).toEqual(['mouse', '32px']);
    fire(source, 'pointerdown', { pointerType: 'mouse' });
    fire(source, 'pointerdown', { pointerType: 'pen' });
    expect([root.dataset.input, root.style.getPropertyValue('--target-min')]).toEqual(['touch', '44px']);
    expect(seen).toEqual(['touch', 'mouse', 'touch']);
    dispose();
    fire(source, 'pointerdown', { pointerType: 'mouse' });
    expect(root.dataset.input).toBe('touch');
    expect(seen).toHaveLength(3);
  });
});
