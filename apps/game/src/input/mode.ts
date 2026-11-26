import type { Bus } from '../bus';
import type { GameEvents, InputMode } from '../events';

/** 'mouse' is mouse; touch, pen and unknown are touch. */
export function inputModeFor(pointerType: string): InputMode {
  return pointerType === 'mouse' ? 'mouse' : 'touch';
}

/** The smallest height and width of a control, in CSS pixels, under each input mode. */
export const TARGET_MIN_PX = Object.freeze({ touch: 44, mouse: 32 });
/**
 * How much wider than its floor a map body's pick radius is under each input mode: the legacy game's padding
 * (celestial-frontier.html 2542; fingers are wider than cursors, 2539-2541). The floor itself differs by the kind of
 * body: `pickFloor` in space/sizes.ts. Its one reader is the map screen's press.
 * A named difference from the legacy game: it chooses the padding by the device (a coarse pointer or touch events,
 * 2538); here it is the pointer of each press, so a mouse on a touch laptop is a mouse.
 */
export const PICK_PADDING = Object.freeze({ touch: 1.4, mouse: 1.2 });

/**
 * Keeps the input mode on the root as data-input, with the smallest control size as --target-min, starting from
 * `initial` and then following the last pointer pressed on `source`. Sends input:mode at the start and on each
 * change. Returns the disposer.
 */
export function mountInputMode(root: HTMLElement, bus: Bus<GameEvents>, source: EventTarget, initial: InputMode): () => void {
  let current: InputMode | null = null;
  const set = (mode: InputMode): void => {
    if (mode === current) return;
    current = mode;
    root.dataset.input = mode;
    root.style.setProperty('--target-min', `${TARGET_MIN_PX[mode]}px`);
    bus.emit('input:mode', { mode });
  };
  const onPointerDown = (event: Event): void => set(inputModeFor((event as PointerEvent).pointerType));
  set(initial);
  source.addEventListener('pointerdown', onPointerDown, true);
  return () => source.removeEventListener('pointerdown', onPointerDown, true);
}
