/** A second toast inside this long after the last one is dropped, unless it is forced. */
export const TOAST_DEDUP_MS = 1800;
export const TOAST_SHOW_MS = 3600;

export interface Toast {
  /** Shows a short message with a title. `force` shows it even right after another, and announces it at once. */
  show(title: string, message: string, force?: boolean): void;
}

/** The one short-message carrier. Its text is always announced to a reader; it is painted only while pop-ups
 *  are on. `now` is a monotonic clock in ms. */
export function createToast(deps: { el: HTMLElement; now(): number; popUps(): boolean }): Toast {
  const { el } = deps;
  const view = el.ownerDocument.defaultView!;
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.style.opacity = '0';
  let last = -Infinity;
  let hide = 0;
  return {
    show(title, message, force = false) {
      const now = deps.now();
      if (!force && now - last < TOAST_DEDUP_MS) return;
      last = now;
      el.setAttribute('aria-live', force ? 'assertive' : 'polite');
      const heading = el.ownerDocument.createElement('b');
      heading.textContent = title;
      const body = el.ownerDocument.createElement('span');
      body.textContent = message;
      el.replaceChildren(heading, body);
      const painted = deps.popUps();
      el.style.opacity = painted ? '1' : '0';
      el.dataset.quiet = String(!painted);
      view.clearTimeout(hide);
      hide = view.setTimeout(() => { el.style.opacity = '0'; }, TOAST_SHOW_MS);
    },
  };
}
