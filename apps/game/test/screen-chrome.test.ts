// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createBus } from '../src/bus';
import type { GameEvents } from '../src/events';
import { createScreenRegistry, type ScreenContext, type ScreenDef } from '../src/screens/registry';
import { mountChrome } from '../src/screens/chrome';
import { createPanelManager } from '../src/ui';
import { pretendLayout } from './shell-support';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();

const ctx: ScreenContext = { bus: createBus<GameEvents>(), sizeClass: () => 'compact', inputMode: () => 'mouse' };
function screen(id: string, dock?: NonNullable<ScreenDef['dock']>): ScreenDef & { unmount: ReturnType<typeof vi.fn<() => void>> } {
  const unmount = vi.fn<() => void>();
  return { id, ...(dock === undefined ? {} : { dock }), fixtures: [], unmount, mount(root) { root.append(`${id} is shown`); return unmount; } };
}

describe('the shell chrome', () => {
  it('the dock shows exactly the registered screens that ask for a dock entry', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const registry = createScreenRegistry();
    const [map, settings, guide] = [screen('map'), screen('settings', { icon: 'settings', label: 'Settings' }), screen('guide', { icon: 'missing', label: 'Guide' })];
    for (const def of [map, settings, guide]) registry.registerScreen(def);
    expect(() => registry.registerScreen(screen('guide'))).toThrow('already registered');
    const panels = createPanelManager(document);
    const widths: HTMLElement[] = [];
    const chrome = mountChrome(document.getElementById('app')!, {
      screens: registry.screens(), ctx, panels,
      panelObserver: () => ({ observe: (el) => { widths.push(el as HTMLElement); }, disconnect() {} }),
    });

    const buttons = [...document.querySelectorAll<HTMLElement>('.dock button')];
    expect(buttons.map((b) => [b.dataset.screen, b.textContent])).toEqual([['settings', 'Settings'], ['guide', 'Guide']]);
    // The bar behind the title and the search field is the first thing drawn: everything else stands on it or under it.
    const bar = document.querySelector('#app > .top-bar')!;
    expect([document.getElementById('app')!.firstElementChild, bar.getAttribute('aria-hidden'), bar.textContent]).toEqual([bar, 'true', '']);
    // A screen with no dock entry is drawn on the stage at once; a docked one only while its panel is open.
    expect(chrome.stage.textContent).toBe('map is shown');
    expect(document.getElementById('panel-settings')!.textContent).toBe('');
    buttons[0]!.click();
    expect([panels.openId(), document.querySelector('#panel-settings .panel-body')!.textContent]).toEqual(['settings', 'settings is shown']);
    buttons[1]!.click();
    expect([panels.openId(), document.querySelector('#panel-settings .panel-body')!.textContent, settings.unmount.mock.calls.length]).toEqual(['guide', '', 1]);
    // Each panel is laid out by its own width.
    expect(widths.map((el) => [el.id, el.dataset.panelW])).toEqual([['panel-settings', 'narrow'], ['panel-guide', 'narrow']]);
    panels.dispose();
  });

  it('a panel whose content runs below its foot shows that it scrolls, until its foot is reached', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const panels = createPanelManager(document);
    mountChrome(document.getElementById('app')!, {
      screens: [screen('settings', { icon: 'settings', label: 'Settings' })], ctx, panels,
      panelObserver: () => ({ observe() {}, disconnect() {} }),
    });
    const panel = document.getElementById('panel-settings')!;
    // jsdom lays nothing out: the panel's window is 300 pixels over 900 of content once it is drawn.
    Object.defineProperty(panel, 'clientHeight', { configurable: true, get: () => 300 });
    Object.defineProperty(panel, 'scrollHeight', { configurable: true, get: () => (panel.textContent === '' ? 300 : 900) });
    expect(panel.hasAttribute('data-more-below')).toBe(false);
    document.querySelector<HTMLElement>('.dock button')!.click();
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(panel.hasAttribute('data-more-below')).toBe(true);
    panel.scrollTop = 600;
    panel.dispatchEvent(new Event('scroll'));
    expect(panel.hasAttribute('data-more-below')).toBe(false);
    panels.dispose();
  });
});
