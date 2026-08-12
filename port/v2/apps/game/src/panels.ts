/* panels.ts — THE PANEL MANAGER (UI_PRESENTATION's one-panel law, main.js
   ~16019): opening one panel closes the rest · every rail panel wears a
   corner ✕ seated FIRST and STICKY · a tap on empty space closes whatever
   is open (unless the tap is inside a panel, on its button, or on a modal).
   DOM-only — no game state in here; main.ts registers and fills. */

export interface PanelDef {
  id: string;
  el: HTMLElement;
  /* a surface can have several homes (dock on phone, rail on desktop) */
  btns?: Array<HTMLElement | null>;
  onOpen?: () => void;
}

const PANELS: PanelDef[] = [];
const MODAL_SEL = '#importsheet';   /* true modals stand apart from the law */

export function registerPanel(def: PanelDef): void {
  PANELS.push(def);
  def.el.style.display = 'none';
  def.el.setAttribute('role', 'region');
  def.el.setAttribute('aria-hidden', 'true');
  for (const button of def.btns || []) {
    if (!button) continue;
    button.setAttribute('aria-controls', def.el.id);
    button.setAttribute('aria-expanded', 'false');
    /* Pointer activation does not focus buttons consistently on every
       desktop browser. Capture the exact logical opener before main.ts's
       toggle handler so switching Settings → Guide restores to Guide, not
       to the first panel's stale opener. */
    button.addEventListener('click', () => { _pendingOpener = button; }, true);
  }
  /* the corner ✕ — one per rail panel, first child, survives refills via
     the refill helper below (the game seats it with a MutationObserver;
     the slice's panels refill through fillPanel, which re-seats) */
  seatPnx(def);
}
function seatPnx(def: PanelDef): void {
  if (def.el.querySelector('[data-pnx]')) return;
  const x = document.createElement('button');
  x.setAttribute('data-pnx', def.id);
  x.setAttribute('aria-label', 'Close ' + (def.el.getAttribute('aria-label') || def.id));
  x.textContent = '✕';
  x.style.cssText = 'position:sticky;top:0;float:right;min-width:44px;min-height:44px;background:transparent;' +
    'border:0;color:var(--dim);font-size:15px;cursor:pointer;z-index:2;transform:translateX(44px)';
  def.el.prepend(x);
}
/** refill a panel's content WITHOUT losing the sticky ✕ */
export function fillPanel(id: string, html: string): void {
  const def = PANELS.find((p) => p.id === id);
  if (!def) return;
  def.el.innerHTML = html;
  seatPnx(def);
}

let _opener: HTMLElement | null = null;   /* FOCUS RESTORATION: closing returns focus to what opened */
let _pendingOpener: HTMLElement | null = null;
function focusIfRendered(target: HTMLElement | null): boolean {
  if (!target?.isConnected || target.inert || target.getClientRects().length === 0) return false;
  const style = getComputedStyle(target);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  try { target.focus(); } catch { return false; }
  return document.activeElement === target;
}
function restorePanelFocus(): void {
  /* A visible right-rail opener can become hidden when Survey reopens while
     its panel is still up. Never strand focus on the detached/hidden close:
     return to that newly active Survey control, then the exploration canvas. */
  if (focusIfRendered(_opener)) return;
  if (focusIfRendered(document.getElementById('docksurvey'))) return;
  focusIfRendered(document.querySelector('canvas'));
}
export function openPanel(id: string, opener?: HTMLElement | null): void {
  const active = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
    ? document.activeElement : null;
  _opener = opener === undefined ? (_pendingOpener || active) : opener;
  _pendingOpener = null;
  closePanels(id);   /* the one-panel law */
  const def = PANELS.find((p) => p.id === id);
  if (!def) return;
  def.onOpen?.();
  def.el.style.display = 'block';
  document.body.classList.add('panel-open');
  def.el.setAttribute('aria-hidden', 'false');
  for (const b of def.btns || []) {
    b?.classList.add('on');
    b?.setAttribute('aria-expanded', 'true');
  }
  /* Panels are non-modal regions, but keyboard users still need a reliable
     entry point. Focus the sticky close control; closing restores the exact
     opener captured above. */
  def.el.querySelector<HTMLElement>('[data-pnx]')?.focus();
}
export function closePanels(except?: string): void {
  for (const p of PANELS) {
    if (p.id === except) continue;
    p.el.style.display = 'none';
    p.el.setAttribute('aria-hidden', 'true');
    for (const b of p.btns || []) {
      b?.classList.remove('on');
      b?.setAttribute('aria-expanded', 'false');
    }
  }
  document.body.classList.toggle('panel-open', PANELS.some((p) => p.el.style.display !== 'none'));
  if (!except && _opener) { restorePanelFocus(); _opener = null; }
}
export function togglePanel(id: string): void {
  const def = PANELS.find((p) => p.id === id);
  if (!def) return;
  if (def.el.style.display === 'none') openPanel(id);
  else { _pendingOpener = null; closePanels(); }
}
export function openPanelId(): string | null {
  const p = PANELS.find((q) => q.el.style.display !== 'none');
  return p ? p.id : null;
}

/* tap-empty-to-close + the delegated corner ✕ (main.js 16056/16070) */
document.addEventListener('pointerdown', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest(MODAL_SEL)) return;
  for (const p of PANELS) {
    if (p.el.contains(t)) return;
    for (const b of p.btns || []) if (b && b.contains(t)) return;
  }
  if (t.closest('#dock') || t.closest('#survey') || t.closest('#topbar') || t.closest('#raillft')) return;
  closePanels();
});
document.addEventListener('click', (e) => {
  const x = (e.target as HTMLElement).closest('[data-pnx]');
  if (x) closePanels();
});
