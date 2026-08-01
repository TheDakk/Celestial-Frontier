/* panels.ts — THE PANEL MANAGER (UI_PRESENTATION's one-panel law, main.js
   ~16019): opening one panel closes the rest · every rail panel wears a
   corner ✕ seated FIRST and STICKY · a tap on empty space closes whatever
   is open (unless the tap is inside a panel, on its button, or on a modal).
   DOM-only — no game state in here; main.ts registers and fills. */

export interface PanelDef {
  id: string;
  el: HTMLElement;
  btn?: HTMLElement | null;
  onOpen?: () => void;
}

const PANELS: PanelDef[] = [];
const MODAL_SEL = '#importsheet';   /* true modals stand apart from the law */

export function registerPanel(def: PanelDef): void {
  PANELS.push(def);
  def.el.style.display = 'none';
  /* the corner ✕ — one per rail panel, first child, survives refills via
     the refill helper below (the game seats it with a MutationObserver;
     the slice's panels refill through fillPanel, which re-seats) */
  seatPnx(def);
}
function seatPnx(def: PanelDef): void {
  if (def.el.querySelector('[data-pnx]')) return;
  const x = document.createElement('button');
  x.setAttribute('data-pnx', def.id);
  x.setAttribute('aria-label', 'close ' + def.id);
  x.textContent = '✕';
  x.style.cssText = 'position:sticky;top:0;float:right;min-width:44px;min-height:44px;background:transparent;' +
    'border:0;color:#8fa3c4;font-size:15px;cursor:pointer;z-index:2';
  def.el.prepend(x);
}
/** refill a panel's content WITHOUT losing the sticky ✕ */
export function fillPanel(id: string, html: string): void {
  const def = PANELS.find((p) => p.id === id);
  if (!def) return;
  def.el.innerHTML = html;
  seatPnx(def);
}

export function openPanel(id: string): void {
  closePanels(id);   /* the one-panel law */
  const def = PANELS.find((p) => p.id === id);
  if (!def) return;
  def.onOpen?.();
  def.el.style.display = 'block';
  def.btn?.classList.add('on');
}
export function closePanels(except?: string): void {
  for (const p of PANELS) {
    if (p.id === except) continue;
    p.el.style.display = 'none';
    p.btn?.classList.remove('on');
  }
}
export function togglePanel(id: string): void {
  const def = PANELS.find((p) => p.id === id);
  if (!def) return;
  if (def.el.style.display === 'none') openPanel(id); else closePanels();
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
    if (p.btn && p.btn.contains(t)) return;
  }
  if (t.closest('#dock') || t.closest('#survey') || t.closest('#topbar')) return;
  closePanels();
});
document.addEventListener('click', (e) => {
  const x = (e.target as HTMLElement).closest('[data-pnx]');
  if (x) closePanels();
});
