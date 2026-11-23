export type Gesture =
  | { kind: 'tap'; x: number; y: number }
  | { kind: 'pan'; dx: number; dy: number }
  | { kind: 'zoom'; factor: number; x: number; y: number }
  | { kind: 'back' };

export interface GestureRecognizer {
  down(id: number, x: number, y: number): void;
  move(id: number, x: number, y: number): Gesture | null;
  up(id: number, x: number, y: number): Gesture | null;
  cancel(id: number): void;
  wheel(deltaY: number, x: number, y: number): Gesture;
  secondary(): Gesture;
}

/** A press released within this many CSS pixels of where it began is a tap; one that goes further is a pan. */
export const TAP_SLOP_PX = 8;
/** The zoom of one wheel step: out when the wheel turns down, in otherwise. */
export const WHEEL_ZOOM_OUT = 0.88;
export const WHEEL_ZOOM_IN = 1.14;

interface Pointer { x: number; y: number; startX: number; startY: number; moved: boolean }

/**
 * One finger pans, two pinch, the wheel zooms about the cursor, a secondary press goes back. A pointer that
 * stays within TAP_SLOP_PX of its press gives a tap on release; once it goes further it pans (the first pan
 * covers the whole way from the press) and gives no tap. A pointer that took part in a pinch gives no tap.
 * A pinch zooms by the ratio of the fingers' distances, about their midpoint.
 */
export function createGestureRecognizer(): GestureRecognizer {
  const pointers = new Map<number, Pointer>();
  let pinchDistance = 0;
  const pair = (): [Pointer, Pointer] | null => {
    if (pointers.size !== 2) return null;
    const [a, b] = [...pointers.values()] as [Pointer, Pointer];
    return [a, b];
  };
  const lift = (id: number): void => {
    pointers.delete(id);
    pinchDistance = 0;
  };

  return {
    down(id, x, y) {
      pointers.set(id, { x, y, startX: x, startY: y, moved: false });
      const two = pair();
      if (two === null) return;
      for (const p of two) p.moved = true;
      pinchDistance = Math.hypot(two[0].x - two[1].x, two[0].y - two[1].y);
    },
    move(id, x, y) {
      const pointer = pointers.get(id);
      if (pointer === undefined) return null;
      if (pointers.size === 1) {
        if (!pointer.moved && Math.hypot(x - pointer.startX, y - pointer.startY) <= TAP_SLOP_PX) return null;
        const pan: Gesture = { kind: 'pan', dx: x - pointer.x, dy: y - pointer.y };
        pointer.moved = true;
        pointer.x = x;
        pointer.y = y;
        return pan;
      }
      pointer.x = x;
      pointer.y = y;
      const two = pair();
      if (two === null) return null;
      const distance = Math.hypot(two[0].x - two[1].x, two[0].y - two[1].y);
      const before = pinchDistance;
      pinchDistance = distance;
      if (before <= 0 || distance <= 0) return null;
      return { kind: 'zoom', factor: distance / before, x: (two[0].x + two[1].x) / 2, y: (two[0].y + two[1].y) / 2 };
    },
    up(id, x, y) {
      const pointer = pointers.get(id);
      if (pointer === undefined) return null;
      const tap = pointers.size === 1 && !pointer.moved && Math.hypot(x - pointer.startX, y - pointer.startY) <= TAP_SLOP_PX;
      lift(id);
      return tap ? { kind: 'tap', x, y } : null;
    },
    cancel(id) {
      lift(id);
    },
    wheel(deltaY, x, y) {
      return { kind: 'zoom', factor: deltaY > 0 ? WHEEL_ZOOM_OUT : WHEEL_ZOOM_IN, x, y };
    },
    secondary() {
      return { kind: 'back' };
    },
  };
}

/**
 * Feeds an element's pointer, wheel and secondary-press events to a recognizer and hands each gesture to
 * `onGesture`, with positions in CSS pixels from the element's top left corner. A press begins on the element;
 * its moves and release are heard on `page`, so a drag that leaves the element still ends. The element no
 * longer scrolls or zooms the page by touch or wheel, and opens no menu. Returns the disposer.
 */
export function mountGestures(el: HTMLElement, page: EventTarget, onGesture: (gesture: Gesture) => void): () => void {
  const recognizer = createGestureRecognizer();
  const at = (event: Event): { id: number; x: number; y: number } => {
    const { pointerId, clientX, clientY } = event as PointerEvent;
    const box = el.getBoundingClientRect();
    return { id: pointerId, x: clientX - box.left, y: clientY - box.top };
  };
  const give = (gesture: Gesture | null): void => {
    if (gesture !== null) onGesture(gesture);
  };
  const onDown = (event: Event): void => { const p = at(event); recognizer.down(p.id, p.x, p.y); };
  const onMove = (event: Event): void => { const p = at(event); give(recognizer.move(p.id, p.x, p.y)); };
  const onUp = (event: Event): void => { const p = at(event); give(recognizer.up(p.id, p.x, p.y)); };
  const onCancel = (event: Event): void => recognizer.cancel((event as PointerEvent).pointerId);
  const onWheel = (event: Event): void => {
    event.preventDefault();
    const p = at(event);
    give(recognizer.wheel((event as WheelEvent).deltaY, p.x, p.y));
  };
  const onMenu = (event: Event): void => {
    event.preventDefault();
    give(recognizer.secondary());
  };
  const before = el.style.touchAction;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', onDown);
  page.addEventListener('pointermove', onMove);
  page.addEventListener('pointerup', onUp);
  page.addEventListener('pointercancel', onCancel);
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('contextmenu', onMenu);
  return () => {
    el.style.touchAction = before;
    el.removeEventListener('pointerdown', onDown);
    page.removeEventListener('pointermove', onMove);
    page.removeEventListener('pointerup', onUp);
    page.removeEventListener('pointercancel', onCancel);
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('contextmenu', onMenu);
  };
}
