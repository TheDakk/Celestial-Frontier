/* The panel manager. One panel is open at a time: opening one closes the rest. Every panel carries a close
   control seated first: in its header (`.sheet-head`) when it has one. A press on empty space closes whatever is open, unless the press is inside a panel, on
   one of its openers, or inside chrome that declares `data-panel-boundary`. Closing returns the focus to what
   opened the panel. DOM only: no game state. */
import { icon } from './icon';

export interface PanelDef {
  id: string;
  el: HTMLElement;
  /** A panel can have several openers (one per arrangement). */
  btns?: Array<HTMLElement | null>;
  /** Called once each time the panel goes from hidden to shown. */
  onOpen?: () => void;
  /** Called once each time the panel goes from shown to hidden. */
  onClose?: () => void;
}

export interface PanelManager {
  register(def: PanelDef): void;
  /** Shows the panel and closes the others. True when it was hidden before. */
  open(id: string, opener?: HTMLElement | null): boolean;
  /** Closes every panel but `except`; with none excepted, the focus goes back to the opener. */
  close(except?: string): void;
  toggle(id: string): void;
  openId(): string | null;
  /** Stops listening to the document. */
  dispose(): void;
}

const PANEL_BOUNDARY_SEL = '[data-panel-boundary]';
/** Sent on the document after a panel opens or closes, before the focus moves, so measured chrome can settle. */
export const PANEL_LAYOUT_EVENT = 'cf-panel-layout';

export function createPanelManager(doc: Document, options: {
  /** Where the focus goes when the opener can no longer take it. */
  fallbackFocus?: () => HTMLElement | null;
} = {}): PanelManager {
  const panels: PanelDef[] = [];
  const view = doc.defaultView!;
  let opener: HTMLElement | null = null;
  let pendingOpener: HTMLElement | null = null;

  const shown = (def: PanelDef): boolean => def.el.style.display !== 'none';
  const openerOf = (target: Element): { panel: PanelDef; button: HTMLElement } | null => {
    for (const panel of panels) {
      for (const button of panel.btns ?? []) if (button?.contains(target)) return { panel, button };
    }
    return null;
  };
  const layoutChanged = (): void => { doc.dispatchEvent(new view.Event(PANEL_LAYOUT_EVENT)); };

  function seatClose(def: PanelDef): void {
    const existing = [...def.el.querySelectorAll<HTMLElement>('[data-pnx]')];
    const x = existing[0] ?? doc.createElement('button');
    for (const duplicate of existing) if (duplicate !== x) duplicate.remove();
    x.setAttribute('type', 'button');
    x.setAttribute('data-pnx', def.id);
    x.setAttribute('aria-label', `Close ${def.el.getAttribute('aria-label') || def.id}`);
    x.replaceChildren(icon('close', { decorative: true }));
    x.classList.add('panel-close');
    (def.el.querySelector(':scope > .sheet-head') ?? def.el).prepend(x);
  }

  function focusIfRendered(target: HTMLElement | null): boolean {
    if (!target?.isConnected || target.inert || target.getClientRects().length === 0) return false;
    const style = view.getComputedStyle(target);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    try { target.focus(); } catch { return false; }
    return doc.activeElement === target;
  }

  function close(except?: string): void {
    for (const p of panels) {
      if (p.id === except) continue;
      const wasVisible = shown(p);
      p.el.style.display = 'none';
      p.el.setAttribute('aria-hidden', 'true');
      for (const b of p.btns ?? []) {
        b?.classList.remove('on', 'sel');
        b?.setAttribute('aria-expanded', 'false');
      }
      if (wasVisible) p.onClose?.();
    }
    doc.body.classList.toggle('panel-open', panels.some(shown));
    layoutChanged();
    if (except === undefined && opener !== null) {
      // An opener can be hidden by the time its panel closes: never leave the focus on the hidden close control.
      if (!focusIfRendered(opener)) focusIfRendered(options.fallbackFocus?.() ?? null);
      opener = null;
    }
  }

  function open(id: string, from?: HTMLElement | null): boolean {
    const active = doc.activeElement instanceof view.HTMLElement && doc.activeElement !== doc.body ? doc.activeElement : null;
    opener = from === undefined ? (pendingOpener ?? active) : from;
    pendingOpener = null;
    close(id);
    const def = panels.find((p) => p.id === id);
    if (def === undefined) return false;
    const wasVisible = shown(def);
    if (!wasVisible) def.onOpen?.();
    def.el.style.display = 'block';
    doc.body.classList.add('panel-open');
    def.el.setAttribute('aria-hidden', 'false');
    for (const b of def.btns ?? []) {
      b?.classList.add('on', 'sel');
      b?.setAttribute('aria-expanded', 'true');
    }
    layoutChanged();
    // A panel is not a modal, but a keyboard player needs a sure way in: the close control takes the focus.
    def.el.querySelector<HTMLElement>('[data-pnx]')?.focus();
    return !wasVisible;
  }

  function toggle(id: string): void {
    const def = panels.find((p) => p.id === id);
    if (def === undefined) return;
    if (!shown(def)) open(id);
    else { pendingOpener = null; close(); }
  }

  // A pointer press does not focus a button on every browser, so the opener is noted before the toggle runs.
  const onClickCapture = (event: Event): void => {
    if (event.target instanceof view.Element) pendingOpener = openerOf(event.target)?.button ?? pendingOpener;
  };
  const onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof view.Element)) return;
    const hit = openerOf(target);
    if (hit !== null) { toggle(hit.panel.id); return; }
    if (target.closest('[data-pnx]') !== null) close();
  };
  const onPointerDown = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof view.Element)) return;
    if (panels.some((p) => p.el.contains(target)) || openerOf(target) !== null) return;
    if (target.closest(PANEL_BOUNDARY_SEL) !== null) return;
    close();
  };
  doc.addEventListener('click', onClickCapture, true);
  doc.addEventListener('click', onClick);
  doc.addEventListener('pointerdown', onPointerDown);

  return {
    register(def) {
      panels.push(def);
      def.el.style.display = 'none';
      def.el.setAttribute('role', 'region');
      def.el.setAttribute('aria-hidden', 'true');
      for (const button of def.btns ?? []) {
        if (!button) continue;
        button.setAttribute('aria-controls', def.el.id);
        button.setAttribute('aria-expanded', 'false');
      }
      seatClose(def);
    },
    open,
    close,
    toggle,
    openId: () => panels.find(shown)?.id ?? null,
    dispose() {
      doc.removeEventListener('click', onClickCapture, true);
      doc.removeEventListener('click', onClick);
      doc.removeEventListener('pointerdown', onPointerDown);
    },
  };
}
