export type PanelWidth = 'narrow' | 'regular' | 'broad';
export const PANEL_WIDTH_LIMITS = Object.freeze({ narrowMax: 419, regularMax: 719 });

/** The class of a panel from its own width in CSS pixels. Throws RangeError unless it is finite and at least 0. */
export function panelWidthClass(width: number): PanelWidth {
  if (!Number.isFinite(width) || width < 0) throw new RangeError(`panelWidthClass: width must be finite and at least 0, got ${width}`);
  if (width < PANEL_WIDTH_LIMITS.narrowMax + 1) return 'narrow';
  if (width < PANEL_WIDTH_LIMITS.regularMax + 1) return 'regular';
  return 'broad';
}

export interface ResizeObserverLike { observe(el: Element): void; disconnect(): void }

/** Sets data-panel-w on the element from its own width, now and on every change. Returns the disposer. */
export function mountPanelContainer(
  el: HTMLElement,
  makeObserver: (onWidth: (width: number) => void) => ResizeObserverLike,
): () => void {
  let live = true;
  const apply = (width: number): void => {
    if (live) el.dataset.panelW = panelWidthClass(width);
  };
  apply(el.clientWidth);
  const observer = makeObserver(apply);
  observer.observe(el);
  return () => {
    live = false;
    observer.disconnect();
  };
}

/** The browser's observer, reporting the same width mountPanelContainer reads at mount. */
export function browserPanelObserver(onWidth: (width: number) => void): ResizeObserverLike {
  return new ResizeObserver((entries) => {
    const last = entries[entries.length - 1];
    if (last !== undefined) onWidth(last.target.clientWidth);
  });
}
