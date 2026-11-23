// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PANEL_LAYOUT_EVENT, createPanelManager, type PanelManager } from '../src/ui/panels';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
// jsdom lays nothing out: every element counts as rendered unless a style hides it.
Object.defineProperty(HTMLElement.prototype, 'getClientRects', { configurable: true, value: () => [{ width: 58, height: 44 }] });

let panels: PanelManager;
const byId = (id: string): HTMLElement => document.getElementById(id)!;
const press = (el: Element): void => { el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })); };

beforeEach(() => {
  document.body.className = '';
  document.body.innerHTML = `
    <nav data-panel-boundary>
      <button id="first"><span>First</span></button><button id="first-rail">First rail</button><button id="second">Second</button>
    </nav>
    <aside id="firstpanel" aria-label="First"></aside><aside id="secondpanel" aria-label="Second"></aside>
    <canvas id="map" tabindex="0"></canvas><p id="empty">space</p>`;
  panels = createPanelManager(document, { fallbackFocus: () => byId('map') });
});
afterEach(() => { panels.dispose(); });

describe('panels', () => {
  it('opening a second panel closes the first and returns focus to the opener on close', () => {
    const onOpen = vi.fn(), onClose = vi.fn();
    panels.register({ id: 'first', el: byId('firstpanel'), btns: [byId('first'), byId('first-rail')], onOpen, onClose });
    panels.register({ id: 'second', el: byId('secondpanel'), btns: [byId('second')] });
    const selected = (id: string): boolean[] => [byId(id).classList.contains('on'), byId(id).getAttribute('aria-expanded') === 'true'];

    byId('first').querySelector('span')!.click();
    expect(panels.openId()).toBe('first');
    expect(document.body.classList.contains('panel-open')).toBe(true);
    expect([selected('first'), selected('first-rail'), selected('second')]).toEqual([[true, true], [true, true], [false, false]]);
    expect(document.activeElement).toBe(document.querySelector('[data-pnx="first"]'));
    expect(byId('firstpanel').getAttribute('aria-hidden')).toBe('false');

    byId('second').click();
    expect(panels.openId()).toBe('second');
    expect(byId('firstpanel').style.display).toBe('none');
    expect(byId('firstpanel').getAttribute('aria-hidden')).toBe('true');
    expect([onOpen.mock.calls.length, onClose.mock.calls.length]).toEqual([1, 1]);
    expect([selected('first'), selected('second')]).toEqual([[false, false], [true, true]]);

    document.querySelector<HTMLElement>('[data-pnx="second"]')!.click();
    expect(panels.openId()).toBeNull();
    expect(document.activeElement).toBe(byId('second'));
    expect(document.body.classList.contains('panel-open')).toBe(false);
    panels.close();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('seats the close control first in the header of a panel that has one', () => {
    byId('firstpanel').innerHTML = '<header class="sheet-head"><h2>First</h2></header><div><header class="sheet-head"></header></div>';
    panels.register({ id: 'first', el: byId('firstpanel'), btns: [byId('first')] });
    const head = byId('firstpanel').firstElementChild!;
    expect([...head.children].map((child) => child.getAttribute('data-pnx') ?? child.tagName)).toEqual(['first', 'H2']);
    expect(byId('firstpanel').querySelectorAll('[data-pnx]')).toHaveLength(1);
  });

  it('seats one close control first, named for its panel, and an opener toggles its panel', () => {
    byId('firstpanel').innerHTML = '<h2>First</h2><button data-pnx="stray">x</button>';
    panels.register({ id: 'first', el: byId('firstpanel'), btns: [byId('first')] });
    const close = byId('firstpanel').firstElementChild!;
    expect(byId('firstpanel').querySelectorAll('[data-pnx]')).toHaveLength(1);
    expect([close.getAttribute('data-pnx'), close.getAttribute('aria-label')]).toEqual(['first', 'Close First']);
    expect(byId('first').getAttribute('aria-controls')).toBe('firstpanel');
    byId('first').click();
    byId('first').click();
    expect(panels.openId()).toBeNull();
    expect(document.activeElement).toBe(byId('first'));
  });

  it('a press on empty space closes the open panel; a press in the panel, on an opener or in boundary chrome does not', () => {
    panels.register({ id: 'first', el: byId('firstpanel'), btns: [byId('first')] });
    panels.open('first', byId('first'));
    press(byId('firstpanel'));
    press(byId('first'));
    press(byId('second'));
    expect(panels.openId()).toBe('first');
    press(byId('empty'));
    expect(panels.openId()).toBeNull();
    expect(document.activeElement).toBe(byId('first'));
  });

  it('gives the focus to the fallback when the opener is hidden by the time the panel closes', () => {
    panels.register({ id: 'first', el: byId('firstpanel'), btns: [byId('first')] });
    // Chrome that hides the opener while its panel is up settles on the layout event, before the focus moves.
    const settle = (): void => { byId('first').style.display = document.body.classList.contains('panel-open') ? 'none' : 'block'; };
    document.addEventListener(PANEL_LAYOUT_EVENT, settle);
    byId('first').click();
    expect(byId('first').style.display).toBe('none');
    panels.close();
    expect(document.activeElement).toBe(byId('first'));
    byId('first').click();
    document.removeEventListener(PANEL_LAYOUT_EVENT, settle);
    panels.close();
    expect(document.activeElement).toBe(byId('map'));
  });

  it('after dispose a press or a click changes nothing', () => {
    panels.register({ id: 'first', el: byId('firstpanel'), btns: [byId('first')] });
    panels.open('first');
    panels.dispose();
    press(byId('empty'));
    byId('first').click();
    expect(panels.openId()).toBe('first');
  });
});
