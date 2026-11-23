/* The shell around every screen: the stage the map is drawn on, the solid bar behind the title and the search
   field, the dock that lists the screens that ask for
   an entry, one panel per docked screen, the standing notices and the toast. Its arrangement for each size
   class is in the stylesheet, keyed on the root's data-size-class. */
import { mountPanelContainer, type ResizeObserverLike } from '../layout';
import { icon, mountScrollCue, type PanelManager } from '../ui';
import { el } from './dom';
import type { ScreenContext, ScreenDef } from './registry';

export interface Chrome {
  readonly stage: HTMLElement;
  readonly notices: HTMLElement;
  readonly toast: HTMLElement;
  dispose(): void;
}

export function mountChrome(root: HTMLElement, deps: {
  screens: readonly ScreenDef[];
  ctx: ScreenContext;
  panels: PanelManager;
  /** Watches a panel's own width (the layout system's observer in the browser). */
  panelObserver: (onWidth: (width: number) => void) => ResizeObserverLike;
}): Chrome {
  // The title and the search field stand on the bar, so both read over whatever the map shows.
  const bar = el('div', { class: 'top-bar', 'aria-hidden': 'true' });
  const stage = el('main', { class: 'stage' });
  const notices = el('div', { class: 'notices', 'data-panel-boundary': true });
  const dock = el('nav', { class: 'dock', 'aria-label': 'Panels', 'data-panel-boundary': true });
  const toast = el('div', { class: 'toast' });
  root.replaceChildren(bar, stage, notices, dock, toast);
  const disposers: Array<() => void> = [];

  for (const screen of deps.screens) {
    if (screen.dock === undefined) {
      disposers.push(screen.mount(stage, deps.ctx));
      continue;
    }
    const button = el('button', { type: 'button', class: 'dock-button', 'data-screen': screen.id },
      icon(screen.dock.icon, { decorative: true }), el('span', {}, screen.dock.label));
    dock.append(button);
    // The header holds the panel's title and its close control on a solid bar: the rows scroll under it.
    const title = el('div', { class: 'sheet-title' });
    const body = el('div', { class: 'panel-body' });
    const panel = el('aside', { class: 'panel', id: `panel-${screen.id}`, 'aria-label': screen.dock.label }, el('header', { class: 'sheet-head' }, title), body);
    root.append(panel);
    let unmount: (() => void) | null = null;
    deps.panels.register({
      id: screen.id, el: panel, btns: [button],
      onOpen: () => {
        title.replaceChildren(...(screen.title === undefined ? [] : [screen.title()]));
        unmount = screen.mount(body, deps.ctx);
      },
      onClose: () => { unmount?.(); unmount = null; body.replaceChildren(); title.replaceChildren(); },
    });
    disposers.push(mountPanelContainer(panel, deps.panelObserver), mountScrollCue(panel), () => unmount?.());
  }
  return { stage, notices, toast, dispose: () => { for (const dispose of disposers) dispose(); } };
}
