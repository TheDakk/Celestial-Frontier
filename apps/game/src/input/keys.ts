import { hideVisually } from '../ui';
import { compareKeys, type Pickable } from './pick';

export type EscapeLayer = 'search' | 'panel' | 'card' | 'ascend';
/** What Escape acts on: a focused search field first, then an open panel, then the card, then it ascends. */
export function escapeTarget(open: { search: boolean; panel: boolean; card: boolean }): EscapeLayer {
  return open.search ? 'search' : open.panel ? 'panel' : open.card ? 'card' : 'ascend';
}

/** A map body the keyboard can hold: its position on screen in CSS pixels, and the name announced for it. */
export interface MapKeyTarget extends Pickable { label: string }

/** A body nearer than this to the edge of the view, in CSS pixels, counts as out of view. */
const VIEW_MARGIN_PX = 12;
export const KEY_ZOOM_IN = 1.22;
export const KEY_ZOOM_OUT = 0.82;

/**
 * The order the arrow keys go through the bodies: those in view (all of them when none is), by priority, then
 * top to bottom, then left to right, then key.
 */
export function keyboardOrder<T extends Pickable>(targets: readonly T[], view: { width: number; height: number }): T[] {
  const visible = targets.filter((t) => t.x >= VIEW_MARGIN_PX && t.y >= VIEW_MARGIN_PX
    && t.x <= view.width - VIEW_MARGIN_PX && t.y <= view.height - VIEW_MARGIN_PX);
  return (visible.length > 0 ? visible : [...targets])
    .sort((a, b) => a.priority - b.priority || a.y - b.y || a.x - b.x || compareKeys(a.key, b.key));
}

/** The key of the body one step on from the held one, wrapping round; from none, the first (or, backwards, the last). */
export function stepTarget(order: ReadonlyArray<{ key: string }>, held: string | null, step: 1 | -1): string | null {
  if (order.length === 0) return null;
  const current = order.findIndex((t) => t.key === held);
  const next = current < 0 ? (step < 0 ? order.length - 1 : 0) : (current + step + order.length) % order.length;
  return (order[next] as { key: string }).key;
}

export type MapKeyAction =
  | { kind: 'step'; step: 1 | -1 }
  | { kind: 'select' }
  | { kind: 'zoom'; factor: number }
  | { kind: 'release' };

/** What a key does on the map. Arrows always step; the rest act only while a body is held. */
export function mapKeyAction(key: string, holding: boolean): MapKeyAction | null {
  if (key === 'ArrowRight' || key === 'ArrowDown') return { kind: 'step', step: 1 };
  if (key === 'ArrowLeft' || key === 'ArrowUp') return { kind: 'step', step: -1 };
  if (!holding) return null;
  if (key === 'Enter' || key === ' ') return { kind: 'select' };
  if (key === '+' || key === '=') return { kind: 'zoom', factor: KEY_ZOOM_IN };
  if (key === '-' || key === '_') return { kind: 'zoom', factor: KEY_ZOOM_OUT };
  if (key === 'Escape') return { kind: 'release' };
  return null;
}

/** What the map gives the keyboard, and what the keyboard asks of it. */
export interface MapKeysPort {
  /** The bodies drawn now, at their screen positions. */
  targets(): readonly MapKeyTarget[];
  viewport(): { width: number; height: number };
  select(target: MapKeyTarget): void;
  /** Zoom by the factor, centred on the body. */
  zoom(target: MapKeyTarget, factor: number): void;
  /** The body to mark as held by the keyboard; null for none. */
  show(target: MapKeyTarget | null): void;
}

/**
 * Makes the map element a focusable, named region the keyboard explores: focus by keyboard takes the first
 * body, arrows cycle the bodies in keyboardOrder, Enter or Space selects the held one, plus and minus zoom on
 * it, Escape lets it go (and only then is Escape left to the layers behind). A pointer press never takes a
 * body. Each change is announced to a reader.
 */
export function mountMapKeys(el: HTMLElement, port: MapKeysPort): { current(): string | null; dispose(): void } {
  let held: string | null = null;
  let pointerFocusing = false;
  let shown: string | null = null;

  const doc = el.ownerDocument;
  const help = doc.createElement('p');
  help.id = 'map-keys-help';
  help.textContent = 'Arrow keys cycle visible galaxies, stars, or worlds. Enter surveys. Plus and minus zoom. Escape releases the target.';
  const live = doc.createElement('div');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  for (const hidden of [help, live]) hideVisually(hidden);
  el.after(help, live);
  el.tabIndex = 0;
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Explore the generated universe');
  el.setAttribute('aria-describedby', help.id);

  const order = (): MapKeyTarget[] => keyboardOrder(port.targets(), port.viewport());
  const announce = (target: MapKeyTarget | null): void => {
    live.textContent = target === null ? 'World target released.' : `${target.label}. Press Enter to survey; plus or minus to zoom.`;
  };
  /** Marks the held body while the map has the focus, and nothing otherwise; tells the map only on a change. */
  const render = (targets: readonly MapKeyTarget[]): MapKeyTarget | null => {
    const target = held === null ? null : targets.find((t) => t.key === held) ?? null;
    if (target === null) held = null;
    const mark = doc.activeElement === el ? target : null;
    if ((mark?.key ?? null) !== shown) {
      shown = mark?.key ?? null;
      port.show(mark);
    }
    return target;
  };
  const step = (by: 1 | -1): void => {
    const targets = order();
    held = stepTarget(targets, held, by);
    announce(render(targets));
  };

  const onPointerDown = (): void => {
    // A pointer press focuses the map too, but must not take a body that would use up the next Escape.
    pointerFocusing = true;
    held = null;
    render([]);
    // The browser gives the focus later in the same press; the flag is dropped after that.
    setTimeout(() => { pointerFocusing = false; }, 0);
  };
  const onFocus = (): void => {
    if (pointerFocusing) { pointerFocusing = false; render(order()); return; }
    if (held === null) step(1); else render(order());
  };
  const onBlur = (): void => { render(order()); };
  const onKeyDown = (event: KeyboardEvent): void => {
    const target = render(order());
    const action = mapKeyAction(event.key, target !== null);
    if (action === null) return;
    event.preventDefault();
    event.stopPropagation();
    if (action.kind === 'step') { step(action.step); return; }
    if (target === null) return;
    if (action.kind === 'zoom') { port.zoom(target, action.factor); return; }
    if (action.kind === 'select') port.select(target);
    else announce(null);
    held = null;
    render([]);
  };

  el.addEventListener('pointerdown', onPointerDown, true);
  el.addEventListener('focus', onFocus);
  el.addEventListener('blur', onBlur);
  el.addEventListener('keydown', onKeyDown);
  return {
    current: () => held,
    dispose() {
      el.removeEventListener('pointerdown', onPointerDown, true);
      el.removeEventListener('focus', onFocus);
      el.removeEventListener('blur', onBlur);
      el.removeEventListener('keydown', onKeyDown);
      for (const name of ['role', 'aria-label', 'aria-describedby', 'tabindex']) el.removeAttribute(name);
      help.remove();
      live.remove();
      held = null;
    },
  };
}
