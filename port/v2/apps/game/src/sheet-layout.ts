/** U2 measured sheet lanes. Presentation only; no game or persistence ownership.
 * Rectangles are viewport CSS pixels. Hidden chrome owns no lane. */
export function createSheetLayoutController(document: Document = window.document): {
  sync(): void; dispose(): void;
} {
  const view = document.defaultView!;
  const root = document.documentElement;
  const lower = ['hintpill', 'ctxbar', 'dock'].map(id => document.getElementById(id)!);
  const toast = document.getElementById('toast')!;
  const planetside = document.getElementById('planetside');
  let disposed = false;
  let frame = 0;
  const set = (name: string, value: number): void => {
    const next = `${Math.max(0, value).toFixed(2)}px`;
    if (root.style.getPropertyValue(name) !== next) root.style.setProperty(name, next);
  };
  const visibleRect = (el: HTMLElement): DOMRect | null => {
    const style = view.getComputedStyle(el), rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden'
      && rect.width > 0 && rect.height > 0 ? rect : null;
  };
  const sync = (): void => {
    if (disposed) return;
    const height = view.innerHeight;
    const safeBottom = parseFloat(view.getComputedStyle(root).getPropertyValue('--safe-bottom')) || 0;
    const lowerTop = Math.min(height - safeBottom - 12,
      ...lower.map(el => visibleRect(el)?.top ?? height));
    set('--cf-lower-top', lowerTop);
    set('--cf-toast-bottom', height - lowerTop + 8);
    // Reserve the full painted toast until its fade finishes. The inline target
    // catches the first frame of entry; computed opacity catches exit frames.
    const toastVisible = toast.style.opacity === '1' || Number(view.getComputedStyle(toast).opacity) > 0;
    const toastRect = toastVisible ? visibleRect(toast) : null;
    const toastHeight = toastRect?.height ?? 0;
    const floor = lowerTop - 8 - (toastHeight > 0 ? toastHeight + 8 : 0);
    set('--cf-sheet-floor', floor);
    // Landscape Planetside can occupy the other column from a painted toast.
    // Keep global reservation intact; this floor only exempts disjoint columns.
    const sideRect = planetside ? visibleRect(planetside) : null;
    const toastCrossesSide = sideRect !== null && toastRect !== null
      && Math.min(sideRect.right, toastRect.right) > Math.max(sideRect.left, toastRect.left);
    set('--cf-planetside-floor', lowerTop - 8 - (toastCrossesSide ? toastHeight + 8 : 0));
    set('--cf-sheet-bottom', height - floor);
    set('--cf-toast-height', toastHeight);
  };
  const schedule = (): void => {
    if (!disposed && !frame) frame = view.requestAnimationFrame(() => { frame = 0; sync(); });
  };
  const resize = new view.ResizeObserver(schedule);
  for (const el of [...lower, toast, document.getElementById('topbar')!]) resize.observe(el);
  if (planetside) resize.observe(planetside);
  const mutation = new view.MutationObserver(schedule);
  mutation.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  mutation.observe(toast, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true, characterData: true });
  toast.addEventListener('transitionend', schedule);
  view.addEventListener('resize', schedule, { passive: true });
  sync();
  return { sync, dispose() {
    disposed = true;
    if (frame) view.cancelAnimationFrame(frame);
    resize.disconnect(); mutation.disconnect();
    toast.removeEventListener('transitionend', schedule);
    view.removeEventListener('resize', schedule);
  } };
}
