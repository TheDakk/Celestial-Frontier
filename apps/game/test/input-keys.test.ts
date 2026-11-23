// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KEY_ZOOM_IN, KEY_ZOOM_OUT, keyboardOrder, mapKeyAction, stepTarget, type MapKeysPort } from '../src/input/keys';
import { escapeTarget, mountMapKeys, type MapKeyTarget } from '../src/input';

const target = (key: string, x: number, y: number, priority = 1): MapKeyTarget => ({ key, x, y, priority, label: `Label ${key}` });
const VIEW = { width: 800, height: 600 };

describe('escapeTarget', () => {
  it('Escape goes to search, then panel, then card, then ascend', () => {
    expect(escapeTarget({ search: true, panel: true, card: true })).toBe('search');
    expect(escapeTarget({ search: false, panel: true, card: true })).toBe('panel');
    expect(escapeTarget({ search: false, panel: false, card: true })).toBe('card');
    expect(escapeTarget({ search: false, panel: false, card: false })).toBe('ascend');
    expect(escapeTarget({ search: true, panel: false, card: false })).toBe('search');
  });
});

describe('keyboard order of the map bodies', () => {
  it('is by priority, then top to bottom, then left to right, then key; bodies within 12 px of the edge or outside are left out', () => {
    const order = keyboardOrder([
      target('low-right', 500, 400), target('top', 300, 100), target('home', 700, 500, 0), target('low-left', 200, 400),
      target('b-same', 400, 300), target('a-same', 400, 300),
      target('off-left', 11, 300), target('off-bottom', 400, 589), target('outside', 900, 300), target('at-margin', 12, 588),
    ], VIEW);
    expect(order.map((t) => t.key)).toEqual(['home', 'top', 'a-same', 'b-same', 'low-left', 'low-right', 'at-margin']);
  });
  it('when no body is in view, every body is in the order', () => {
    expect(keyboardOrder([target('b', 900, 10), target('a', -50, 10)], VIEW).map((t) => t.key)).toEqual(['a', 'b']);
    expect(keyboardOrder([], VIEW)).toEqual([]);
  });
  it('stepping starts at the first (or, backwards, the last) and wraps round', () => {
    const order = [target('a', 0, 0), target('b', 0, 0), target('c', 0, 0)];
    expect(stepTarget(order, null, 1)).toBe('a');
    expect(stepTarget(order, null, -1)).toBe('c');
    expect(stepTarget(order, 'a', 1)).toBe('b');
    expect(stepTarget(order, 'c', 1)).toBe('a');
    expect(stepTarget(order, 'a', -1)).toBe('c');
    expect(stepTarget(order, 'gone', 1)).toBe('a');
    expect(stepTarget([], 'a', 1)).toBeNull();
  });
});

describe('map keys', () => {
  it('arrows step, Enter and Space select, plus and minus zoom by 1.22 and 0.82, Escape releases; only arrows act with no target', () => {
    expect([KEY_ZOOM_IN, KEY_ZOOM_OUT]).toEqual([1.22, 0.82]);
    for (const key of ['ArrowRight', 'ArrowDown']) expect(mapKeyAction(key, false)).toEqual({ kind: 'step', step: 1 });
    for (const key of ['ArrowLeft', 'ArrowUp']) expect(mapKeyAction(key, true)).toEqual({ kind: 'step', step: -1 });
    for (const key of ['Enter', ' ']) expect(mapKeyAction(key, true)).toEqual({ kind: 'select' });
    for (const key of ['+', '=']) expect(mapKeyAction(key, true)).toEqual({ kind: 'zoom', factor: 1.22 });
    for (const key of ['-', '_']) expect(mapKeyAction(key, true)).toEqual({ kind: 'zoom', factor: 0.82 });
    expect(mapKeyAction('Escape', true)).toEqual({ kind: 'release' });
    for (const key of ['Enter', ' ', '+', '-', 'Escape', 'a', 'Tab']) expect(mapKeyAction(key, false)).toBeNull();
    expect(mapKeyAction('a', true)).toBeNull();
  });
});

describe('the map as a keyboard region', () => {
  afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); });

  function mounted(targets: MapKeyTarget[] = [target('sun', 400, 300, 0), target('earth', 500, 300), target('mars', 600, 300)]) {
    const el = document.createElement('canvas');
    document.body.append(el);
    const calls: string[] = [];
    const port: MapKeysPort = {
      targets: () => targets,
      viewport: () => VIEW,
      select: (t) => calls.push(`select:${t.key}`),
      zoom: (t, factor) => calls.push(`zoom:${t.key}:${factor}`),
      show: (t) => calls.push(`show:${t === null ? 'none' : t.key}`),
    };
    const keys = mountMapKeys(el, port);
    const press = (key: string): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      el.dispatchEvent(event);
      return event;
    };
    const live = (): string => document.querySelector('[aria-live="polite"]')!.textContent ?? '';
    return { el, calls, keys, press, live };
  }

  it('the map is a focusable named region that describes its keys', () => {
    const { el } = mounted();
    expect(el.tabIndex).toBe(0);
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-label')).toBe('Explore the generated universe');
    const help = document.getElementById(el.getAttribute('aria-describedby')!)!;
    expect(help.textContent).toBe('Arrow keys cycle visible galaxies, stars, or worlds. Enter surveys. Plus and minus zoom. Escape releases the target.');
  });
  it('keyboard focus takes the first body; arrows cycle in order and wrap; each is announced', () => {
    const { el, calls, keys, press, live } = mounted();
    el.focus();
    expect(keys.current()).toBe('sun');
    expect(live()).toBe('Label sun. Press Enter to survey; plus or minus to zoom.');
    const right = press('ArrowRight');
    expect([keys.current(), right.defaultPrevented]).toEqual(['earth', true]);
    press('ArrowDown');
    press('ArrowRight');
    expect(keys.current()).toBe('sun');
    press('ArrowLeft');
    expect(keys.current()).toBe('mars');
    press('ArrowUp');
    expect(keys.current()).toBe('earth');
    expect(live()).toBe('Label earth. Press Enter to survey; plus or minus to zoom.');
    expect(calls).toEqual(['show:sun', 'show:earth', 'show:mars', 'show:sun', 'show:mars', 'show:earth']);
  });
  it('Enter or Space selects the held body and lets it go; plus and minus zoom on it and keep it', () => {
    const { el, calls, keys, press } = mounted();
    el.focus();
    press('ArrowRight');
    calls.length = 0;
    press('+');
    press('=');
    press('-');
    press('_');
    expect(keys.current()).toBe('earth');
    const enter = press('Enter');
    expect([keys.current(), enter.defaultPrevented]).toEqual([null, true]);
    expect(calls).toEqual(['zoom:earth:1.22', 'zoom:earth:1.22', 'zoom:earth:0.82', 'zoom:earth:0.82', 'select:earth', 'show:none']);
    press('ArrowRight');
    calls.length = 0;
    press(' ');
    expect(calls).toEqual(['select:sun', 'show:none']);
  });
  it('Escape releases a held body and stops there; with none held it is left for the layers behind', () => {
    const { el, keys, press, live } = mounted();
    let reachedPage = 0;
    document.body.addEventListener('keydown', () => { reachedPage++; });
    el.focus();
    const first = press('Escape');
    expect([keys.current(), first.defaultPrevented, reachedPage, live()]).toEqual([null, true, 0, 'World target released.']);
    const second = press('Escape');
    expect([second.defaultPrevented, reachedPage]).toEqual([false, 1]);
    // Enter with nothing held does nothing and is not swallowed.
    expect(press('Enter').defaultPrevented).toBe(false);
  });
  it('a pointer press that focuses the map does not take a body, and drops a held one', () => {
    vi.useFakeTimers();
    const { el, calls, keys } = mounted();
    el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    el.focus();
    expect(keys.current()).toBeNull();
    el.blur();
    vi.runAllTimers();
    el.focus();
    expect(keys.current()).toBe('sun');
    el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(keys.current()).toBeNull();
    expect(calls.at(-1)).toBe('show:none');
  });
  it('a held body that is no longer on the map is let go at the next key', () => {
    const targets = [target('sun', 400, 300, 0), target('earth', 500, 300)];
    const { el, keys, press, calls } = mounted(targets);
    el.focus();
    targets.splice(0, 2, target('vega', 300, 300));
    calls.length = 0;
    expect(press('Enter').defaultPrevented).toBe(false);
    expect(keys.current()).toBeNull();
    expect(calls).toEqual(['show:none']);
    press('ArrowRight');
    expect(keys.current()).toBe('vega');
  });
  it('with no body on the map, focus and arrows hold nothing', () => {
    const { el, keys, press, live } = mounted([]);
    el.focus();
    press('ArrowRight');
    expect(keys.current()).toBeNull();
    expect(live()).toBe('World target released.');
  });
  it('after its disposer runs the keys do nothing', () => {
    const { el, keys, press, calls } = mounted();
    keys.dispose();
    el.focus();
    press('ArrowRight');
    expect(keys.current()).toBeNull();
    expect(calls).toEqual([]);
    expect(document.querySelector('[aria-live]')).toBeNull();
  });
});
