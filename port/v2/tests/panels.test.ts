import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
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
  it('styles the existing direct title without wrapping or replacing its children', async () => {
    const panels = await import('../apps/game/src/panels.js');
    const board = document.getElementById('firstpanel')!;
    board.innerHTML = '<h3><button id="heading-back">‹ Compendium</button><span data-count>2</span></h3><h3>Details</h3><div class="compendium-scroll">Rows</div>';
    const title = board.querySelector('h3')!, back = board.querySelector<HTMLButtonElement>('#heading-back')!;
    const tapped = vi.fn(); back.addEventListener('click', tapped);
    panels.registerPanel({ id: 'codex', el: board });
    expect(board.querySelector(':scope > h3.sheet-header')).toBe(title);
    expect(title.getAttribute('data-sheet-kind')).toBe('codex');
    expect(board.querySelectorAll('.sheet-header')).toHaveLength(1);
    expect(board.firstElementChild).toBe(board.querySelector(':scope > .sheet-close[data-pnx="codex"]'));
    expect(board.querySelector(':scope > .compendium-scroll')).not.toBeNull();
    expect(title.querySelector('[data-count]')?.textContent).toBe('2');
    back.click(); expect(tapped).toHaveBeenCalledOnce();
  });

  it('retains the same direct Close through refills, removes duplicate Close controls, and preserves only Close-owned focus', async () => {
    const panels = await import('../apps/game/src/panels.js');
    const board = document.getElementById('firstpanel')!, opener = document.getElementById('first')!;
    const onOpen = vi.fn(), onClose = vi.fn();
    panels.registerPanel({ id: 'notifications', el: board, btns: [opener], onOpen, onClose });
    opener.click();
    const close = board.querySelector<HTMLButtonElement>('[data-pnx]')!;
    const closeClick = vi.fn(); close.addEventListener('click', closeClick);
    panels.fillPanel('notifications', '<h2>Notifications</h2><button data-pnx="duplicate">Duplicate</button><p>History</p>');
    expect(board.firstElementChild).toBe(close); expect(document.activeElement).toBe(close);
    expect(board.querySelectorAll('[data-pnx]')).toHaveLength(1);
    expect(board.querySelector(':scope > h2.sheet-header')?.textContent).toBe('Notifications');
    expect(onOpen).toHaveBeenCalledOnce(); expect(onClose).not.toHaveBeenCalled();
    opener.focus(); panels.fillPanel('notifications', '<h2>Updated history</h2>');
    expect(board.firstElementChild).toBe(close); expect(document.activeElement).toBe(opener);
    close.click(); expect(closeClick).toHaveBeenCalledOnce(); expect(onClose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(opener);
  });

  it('opens Charters from the actual main objective registration and restores that same native opener on Close', async () => {
    const panels = await import('../apps/game/src/panels.js');
    const objective = document.createElement('button');
    objective.id = 'objchip';
    objective.type = 'button';
    objective.setAttribute('aria-label', 'Charters — Survey worlds 2 / 5');
    objective.setAttribute('data-panel-boundary', '');
    objective.innerHTML = 'Survey worlds <span data-sel="objprog">2 / 5</span>';
    const board = document.createElement('aside');
    board.id = 'chpanel';
    board.setAttribute('aria-label', 'Charters');
    document.body.append(objective, board);
    const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
    const registrations = main.match(/^registerPanel\(\{ id: 'ch',.+$/gm);
    expect(registrations).toHaveLength(1);
    const registration = registrations![0]!.replace("document.getElementById('chpanel')!", "document.getElementById('chpanel')");
    const onOpen = vi.fn();
    Function('document', 'registerPanel', 'fillCharters', registration)(document, panels.registerPanel, onOpen);
    expect(objective.getAttribute('aria-controls')).toBe('chpanel');
    expect(objective.getAttribute('aria-expanded')).toBe('false');
    objective.querySelector('[data-sel="objprog"]')!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(panels.openPanelId()).toBe('ch');
    expect(board.getAttribute('aria-hidden')).toBe('false');
    expect(objective.getAttribute('aria-expanded')).toBe('true');
    expect(objective.classList.contains('on') && objective.classList.contains('sel')).toBe(true);
    expect(onOpen).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(board.querySelector('[data-pnx="ch"]'));
    board.querySelector<HTMLButtonElement>('[data-pnx="ch"]')!.click();
    expect(panels.openPanelId()).toBeNull();
    expect(board.getAttribute('aria-hidden')).toBe('true');
    expect(objective.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(objective);
    objective.innerHTML = '📜 View Charters';
    objective.click();
    expect(panels.openPanelId()).toBe('ch');
    expect(onOpen).toHaveBeenCalledTimes(2);
    objective.click();
    expect(panels.openPanelId()).toBeNull();
    expect(document.activeElement).toBe(objective);
    // Removing the registered owner must make its replacement inoperative;
    // reattaching the original restores the same delegated path.
    objective.remove();
    const replacement = objective.cloneNode(true) as HTMLButtonElement;
    document.body.append(replacement);
    replacement.click();
    expect(panels.openPanelId()).toBeNull();
    replacement.replaceWith(objective);
    objective.click();
    expect(panels.openPanelId()).toBe('ch');
    board.querySelector<HTMLButtonElement>('[data-pnx="ch"]')!.click();
    expect(document.activeElement).toBe(objective);
  });

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
