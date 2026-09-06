import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface TestWindow extends Window {
  close(): void;
  Element: typeof Element;
  HTMLElement: typeof HTMLElement;
  MouseEvent: typeof MouseEvent;
}
interface TestDom { window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const GLOBAL_KEYS = ['window', 'document', 'Element', 'HTMLElement', 'getComputedStyle'] as const;
const originals = new Map<string, PropertyDescriptor | undefined>();
let dom: TestDom;

beforeEach(() => {
  vi.resetModules();
  for (const key of GLOBAL_KEYS) originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  dom = new JSDOM(`<!doctype html><html><body>
    <nav data-panel-boundary>
      <button id="first"><span>First board</span></button>
      <button id="first-rail">First rail</button><button id="second">Second board</button>
    </nav>
    <aside id="firstpanel" aria-label="First"></aside><aside id="secondpanel" aria-label="Second"></aside>
    <button id="docksurvey">Survey</button><canvas tabindex="0"></canvas>
  </body></html>`, { url: 'https://example.test/' });
  const bindings: Record<typeof GLOBAL_KEYS[number], unknown> = {
    window: dom.window, document: dom.window.document,
    Element: dom.window.Element, HTMLElement: dom.window.HTMLElement,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  };
  for (const key of GLOBAL_KEYS) Object.defineProperty(globalThis, key, {
    configurable: true, writable: true, value: bindings[key],
  });
  Object.defineProperty(dom.window.HTMLElement.prototype, 'getClientRects', {
    configurable: true,
    value: () => [{ left: 0, top: 0, right: 58, bottom: 44, width: 58, height: 44 }],
  });
});

afterEach(() => {
  dom.window.close();
  for (const key of GLOBAL_KEYS) {
    const original = originals.get(key);
    if (original) Object.defineProperty(globalThis, key, original);
    else Reflect.deleteProperty(globalThis, key);
  }
  originals.clear();
});

describe('shared panel selection presentation', () => {
  it('mirrors selected and expanded state on each opener without changing lifecycle or Close focus', async () => {
    const panels = await import('../apps/game/src/panels.js');
    const first = document.getElementById('first')!;
    const firstRail = document.getElementById('first-rail')!;
    const second = document.getElementById('second')!;
    const onOpen = vi.fn(), onClose = vi.fn();
    panels.registerPanel({ id: 'first', el: document.getElementById('firstpanel')!, btns: [first, firstRail], onOpen, onClose });
    panels.registerPanel({ id: 'second', el: document.getElementById('secondpanel')!, btns: [second] });
    const selected = (button: HTMLElement, expected: boolean): boolean =>
      button.classList.contains('sel') === expected && button.classList.contains('on') === expected
      && button.getAttribute('aria-expanded') === String(expected);
    expect([first, firstRail, second].every((button) => selected(button, false))).toBe(true);
    first.querySelector('span')!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(panels.openPanelId()).toBe('first');
    expect([first, firstRail].every((button) => selected(button, true))).toBe(true);
    expect(selected(second, false)).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('[data-pnx="first"]'));
    expect(onOpen).toHaveBeenCalledOnce();
    first.classList.remove('sel');
    expect(selected(first, true)).toBe(false);
    first.classList.add('sel');
    expect(selected(first, true)).toBe(true);
    first.setAttribute('aria-expanded', 'false');
    expect(selected(first, true)).toBe(false);
    first.setAttribute('aria-expanded', 'true');
    expect(selected(first, true)).toBe(true);
    second.click();
    expect(panels.openPanelId()).toBe('second');
    expect(onClose).toHaveBeenCalledOnce();
    expect([first, firstRail].every((button) => selected(button, false))).toBe(true);
    expect(selected(second, true)).toBe(true);
    document.querySelector<HTMLButtonElement>('[data-pnx="second"]')!.click();
    expect(panels.openPanelId()).toBeNull();
    expect(selected(second, false)).toBe(true);
    expect(document.activeElement).toBe(second);
    panels.closePanels();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
