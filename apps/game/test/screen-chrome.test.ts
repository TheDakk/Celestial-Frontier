// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createBus } from '../src/bus';
import type { GameEvents } from '../src/events';
import { createScreenRegistry, mountChrome, type ScreenContext, type ScreenDef } from '../src/screens';
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
});
