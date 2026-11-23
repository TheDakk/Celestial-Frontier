import type { InputMode } from '../events';

/** Short hints bubble. With a mouse: hover (650 ms) or focus on a `[data-tip]` element. By keyboard, whatever the
 * pointer: focus on a `[data-tip]` element. By touch or pen: long-press (600 ms, cancelled by a 12 px drag) on
 * `[data-tip]` OR a native `[title]` (native titles never show on a phone, so the long-press is how a phone
 * player reads them); the click that ends a long-press is swallowed so inspecting never acts. Pure display: no
 * game state. Quiet while `blocked()` or the switch is off. */

export const TOOLTIP_HOVER_MS = 650;
export const TOOLTIP_PRESS_MS = 600;
const PRESS_SLOP_PX = 12;

export interface TooltipOwnerOptions {
  readonly document: Document;
  readonly enabled: () => boolean;
  readonly blocked: () => boolean;
  /** The input mode now: under touch, the hover and the focus a tap produces open nothing. */
  readonly mode: () => InputMode;
  readonly setTimeout?: (fn: () => void, ms: number) => number;
  readonly clearTimeout?: (id: number) => void;
}

export class TooltipOwner {
  readonly #doc: Document;
  readonly #opts: TooltipOwnerOptions;
  readonly #bubble: HTMLElement;
  readonly #set: (fn: () => void, ms: number) => number;
  readonly #clear: (id: number) => void;
  #for: Element | null = null;
  #timer = 0;
  #press: { target: Element; x: number; y: number } | null = null;
  #swallowClick = false;
  /** Whether the last key or pointer press was a key: a focus that follows it is the keyboard's. */
  #keyboard = false;

  constructor(options: TooltipOwnerOptions) {
    this.#doc = options.document;
    this.#opts = options;
    const view = this.#doc.defaultView!;
    this.#set = options.setTimeout ?? ((fn, ms) => view.setTimeout(fn, ms));
    this.#clear = options.clearTimeout ?? ((id) => view.clearTimeout(id));
    this.#bubble = this.#doc.createElement('div');
    this.#bubble.id = 'tipbubble';
    this.#bubble.setAttribute('role', 'tooltip');
    this.#bubble.hidden = true;
    // Display only: the bubble never takes a press.
    Object.assign(this.#bubble.style, {
      position: 'fixed', zIndex: '60', maxWidth: 'min(280px, calc(100vw - 16px))', padding: '6px 9px', borderRadius: '8px',
      border: '1px solid #405477', background: 'rgba(8,14,27,.94)', color: '#dcecff', font: '500 0.923rem/1.35 var(--ui)',
      pointerEvents: 'none',
    });
    this.#doc.body.appendChild(this.#bubble);
    const d = this.#doc;
    d.addEventListener('pointerdown', this.#onPointerDown, true);
    d.addEventListener('pointermove', this.#onPointerMove, true);
    d.addEventListener('pointerup', this.#onPointerEnd, true);
    d.addEventListener('pointercancel', this.#onPointerEnd, true);
    d.addEventListener('click', this.#onClick, true);
    d.addEventListener('mouseover', this.#onOver);
    d.addEventListener('mouseout', this.#onOut);
    d.addEventListener('focusin', this.#onFocus);
    d.addEventListener('focusout', this.#onBlur);
    d.addEventListener('keydown', this.#onKey);
  }

  get bubble(): HTMLElement { return this.#bubble; }
  get showingFor(): Element | null { return this.#for; }

  /** Stops listening and takes the bubble away. */
  dispose(): void {
    this.hide();
    const d = this.#doc;
    d.removeEventListener('pointerdown', this.#onPointerDown, true);
    d.removeEventListener('pointermove', this.#onPointerMove, true);
    d.removeEventListener('pointerup', this.#onPointerEnd, true);
    d.removeEventListener('pointercancel', this.#onPointerEnd, true);
    d.removeEventListener('click', this.#onClick, true);
    d.removeEventListener('mouseover', this.#onOver);
    d.removeEventListener('mouseout', this.#onOut);
    d.removeEventListener('focusin', this.#onFocus);
    d.removeEventListener('focusout', this.#onBlur);
    d.removeEventListener('keydown', this.#onKey);
    this.#bubble.remove();
  }

  #textOf(target: Element, nativeTitle: boolean): string {
    const tip = (target as HTMLElement).dataset?.tip;
    if (tip) return tip;
    return nativeTitle ? target.getAttribute('title') ?? '' : '';
  }

  #targetOf(node: EventTarget | null, nativeTitle: boolean): Element | null {
    const view = this.#doc.defaultView;
    if (!view || !(node instanceof view.Element)) return null;
    return node.closest(nativeTitle ? '[data-tip],[title]' : '[data-tip]');
  }

  /** Shows the target's hint; with `nativeTitle` (a long-press), its `title` when it has no `data-tip`. */
  show(target: Element, nativeTitle = false): boolean {
    if (!this.#opts.enabled() || this.#opts.blocked()) return false;
    const text = this.#textOf(target, nativeTitle).trim();
    if (!text) return false;
    this.#bubble.textContent = text;
    this.#bubble.hidden = false;
    const view = this.#doc.defaultView!;
    const r = target.getBoundingClientRect(), bw = this.#bubble.offsetWidth, bh = this.#bubble.offsetHeight;
    const W = view.innerWidth, H = view.innerHeight;
    const x = Math.max(8, Math.min(W - bw - 8, r.left + r.width / 2 - bw / 2));
    let y = r.top - bh - 8;
    if (y < 8) y = Math.min(H - bh - 8, r.bottom + 8);
    this.#bubble.style.left = `${Math.round(x)}px`;
    this.#bubble.style.top = `${Math.round(y)}px`;
    this.#for = target;
    return true;
  }

  hide(): void {
    this.#bubble.hidden = true;
    this.#for = null;
    this.#clear(this.#timer);
  }

  readonly #onOver = (event: Event): void => {
    if (this.#opts.mode() === 'touch') return;
    const target = this.#targetOf(event.target, false);
    if (target === null) { if (this.#for !== null && !(event.target instanceof this.#doc.defaultView!.Element && event.target.closest('#tipbubble'))) this.hide(); return; }
    if (target === this.#for) return;
    this.#clear(this.#timer);
    this.#timer = this.#set(() => { this.show(target); }, TOOLTIP_HOVER_MS);
  };

  readonly #onOut = (event: Event): void => {
    const target = this.#targetOf(event.target, false);
    if (target === null) return;
    const to = (event as MouseEvent).relatedTarget;
    if (to instanceof this.#doc.defaultView!.Element && (to.closest('#tipbubble') || to.closest('[data-tip]') === target)) return;
    this.#clear(this.#timer);
    if (this.#for === target) this.hide();
  };

  readonly #onFocus = (event: Event): void => {
    if (this.#opts.mode() === 'touch' && !this.#keyboard) return;
    const target = this.#targetOf(event.target, false);
    if (target === null) { this.hide(); return; }
    this.show(target);
  };

  readonly #onBlur = (): void => { this.hide(); };

  readonly #onKey = (event: Event): void => {
    this.#keyboard = true;
    if ((event as KeyboardEvent).key === 'Escape') this.hide();
  };

  readonly #onPointerDown = (event: Event): void => {
    this.#keyboard = false;
    const pointer = event as PointerEvent;
    if (pointer.pointerType === 'mouse') return;
    if (this.#for !== null && !(pointer.target instanceof this.#doc.defaultView!.Element && pointer.target.closest('#tipbubble'))) this.hide();
    const target = this.#targetOf(pointer.target, true);
    if (target === null || !this.#opts.enabled()) return;
    this.#press = { target, x: pointer.clientX, y: pointer.clientY };
    this.#clear(this.#timer);
    this.#timer = this.#set(() => { if (this.show(target, true)) this.#swallowClick = true; this.#press = null; }, TOOLTIP_PRESS_MS);
  };

  readonly #onPointerMove = (event: Event): void => {
    const pointer = event as PointerEvent;
    if (this.#press !== null && Math.hypot(pointer.clientX - this.#press.x, pointer.clientY - this.#press.y) > PRESS_SLOP_PX) {
      this.#clear(this.#timer);
      this.#press = null;
    }
  };

  readonly #onPointerEnd = (): void => {
    if (this.#press !== null) { this.#clear(this.#timer); this.#press = null; }
  };

  readonly #onClick = (event: Event): void => {
    if (!this.#swallowClick) return;
    this.#swallowClick = false;
    event.preventDefault();
    event.stopPropagation();
  };
}
