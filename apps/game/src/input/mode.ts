import type { Bus } from '../bus';
import type { GameEvents, InputMode } from '../events';

/** 'mouse' is mouse; touch, pen and unknown are touch. */
export function inputModeFor(pointerType: string): InputMode {
  return pointerType === 'mouse' ? 'mouse' : 'touch';
}

/** The smallest height and width of a control, in CSS pixels, under each input mode. */
export const TARGET_MIN_PX = Object.freeze({ touch: 44, mouse: 32 });
/**
 * How far from a map body, in CSS pixels, a tap still selects it, under each input mode. By mouse it is the legacy
 * game's floor for a planet: 16 pixels times its mouse padding of 1.2 (celestial-frontier.html 7673 and 2542), raised
 * there because a planet drifts out from under a careful click. Its one reader is the map screen's press.
 * Two differences from the legacy game stand: its touch floor for a planet is 22.4 (16 times 1.4) against 22 here,
 * and its floor differs by kind of body (9 to 18 pixels before the padding) where this is one floor for every body.
 */
export const PICK_RADIUS_PX = Object.freeze({ touch: 22, mouse: 19.2 });

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
