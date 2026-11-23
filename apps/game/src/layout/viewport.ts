import type { Bus } from '../bus';
import type { GameEvents, SizeClass } from '../events';
import { sizeClass } from './size-class';

/** Where the size of the visual viewport comes from, in CSS pixels. */
export interface ViewportSource {
  read(): { width: number; height: number };
  /** Returns the function that stops the notifications. */
  subscribe(onChange: () => void): () => void;
}

const SAFE_AREA_SIDES = ['top', 'right', 'bottom', 'left'] as const;

/** Sets data-size-class on the root, now and whenever the class changes, emitting layout:size-class each time
 *  it does (the first time included), and exposes the safe-area insets as --safe-top, --safe-right,
 *  --safe-bottom and --safe-left. Returns the disposer. */
export function mountViewport(root: HTMLElement, bus: Bus<GameEvents>, source: ViewportSource): () => void {
  for (const side of SAFE_AREA_SIDES) root.style.setProperty(`--safe-${side}`, `env(safe-area-inset-${side}, 0px)`);
  let current: SizeClass | null = null;
  const update = (): void => {
    const { width, height } = source.read();
    const next = sizeClass(width, height);
    if (next === current) return;
    current = next;
    root.dataset.sizeClass = next;
    bus.emit('layout:size-class', { sizeClass: next, width, height });
  };
  update();
  return source.subscribe(update);
}

/** The browser's visual viewport, or the window's inner size where there is none. */
export function windowViewportSource(win: Window): ViewportSource {
  const visual = win.visualViewport;
  return {
    read: () => (visual ? { width: visual.width, height: visual.height } : { width: win.innerWidth, height: win.innerHeight }),
    subscribe(onChange) {
      const target: EventTarget = visual ?? win;
      target.addEventListener('resize', onChange);
      return () => target.removeEventListener('resize', onChange);
    },
  };
}
