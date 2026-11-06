/** @module tooltips [app] — short hints bubble (v1.8.9 parity, D16; v1 `@section tooltips`, `#tipbubble`, save `tips`,
 * absent ⇒ on). Desktop: hover (650 ms) or keyboard focus on a `[data-tip]` element. Touch: long-press (600 ms, cancelled by a
 * 12 px drag) on `[data-tip]` OR a native `[title]` — native titles never show on a phone, so the long-press is how an iPhone
 * player reads them; the click that ends a long-press is swallowed so inspecting never acts. Pure display: no game state.
 * Quiet while `blocked()` (Field Training keeps a single voice) or the switch is off. */

export const TOOLTIP_HOVER_MS = 650;
export const TOOLTIP_PRESS_MS = 600;
const PRESS_SLOP_PX = 12;

export interface TooltipOwnerOptions {
  readonly document: Document;
  readonly enabled: () => boolean;
  readonly blocked: () => boolean;
  readonly touch: boolean;
  readonly setTimeout?: (fn: () => void, ms: number) => number;
  readonly clearTimeout?: (id: number) => void;
}

export class TooltipOwnerV1 {
  readonly #doc: Document;
  readonly #opts: TooltipOwnerOptions;
  readonly #bubble: HTMLElement;
  readonly #set: (fn: () => void, ms: number) => number;
  readonly #clear: (id: number) => void;
  #for: Element | null = null;
  #timer = 0;
  #press: { target: Element; x: number; y: number } | null = null;
  #swallowClick = false;

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
    this.#doc.body.appendChild(this.#bubble);
    const d = this.#doc;
    if (options.touch) {
      d.addEventListener('pointerdown', this.#onPointerDown, true);
      d.addEventListener('pointermove', this.#onPointerMove, true);
      d.addEventListener('pointerup', this.#onPointerEnd, true);
      d.addEventListener('pointercancel', this.#onPointerEnd, true);
      d.addEventListener('click', this.#onClick, true);
    } else {
      d.addEventListener('mouseover', this.#onOver);
      d.addEventListener('mouseout', this.#onOut);
      d.addEventListener('focusin', this.#onFocus);
      d.addEventListener('focusout', () => this.hide());
    }
    d.addEventListener('keydown', (event) => { if ((event as KeyboardEvent).key === 'Escape') this.hide(); });
  }

  get bubble(): HTMLElement { return this.#bubble; }
  get showingFor(): Element | null { return this.#for; }

  #textOf(target: Element): string {
    const tip = (target as HTMLElement).dataset?.tip;
    if (tip) return tip;
    return this.#opts.touch ? target.getAttribute('title') ?? '' : '';
  }

  #targetOf(node: EventTarget | null): Element | null {
    const view = this.#doc.defaultView;
    if (!view || !(node instanceof view.Element)) return null;
    return node.closest(this.#opts.touch ? '[data-tip],[title]' : '[data-tip]');
  }

  show(target: Element): boolean {
    if (!this.#opts.enabled() || this.#opts.blocked()) return false;
    const text = this.#textOf(target).trim();
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
    const target = this.#targetOf(event.target);
    if (target === null) { if (this.#for !== null && !(event.target instanceof this.#doc.defaultView!.Element && event.target.closest('#tipbubble'))) this.hide(); return; }
    if (target === this.#for) return;
    this.#clear(this.#timer);
    this.#timer = this.#set(() => { this.show(target); }, TOOLTIP_HOVER_MS);
  };

  readonly #onOut = (event: Event): void => {
    const target = this.#targetOf(event.target);
    if (target === null) return;
    const to = (event as MouseEvent).relatedTarget;
    if (to instanceof this.#doc.defaultView!.Element && (to.closest('#tipbubble') || to.closest('[data-tip]') === target)) return;
    this.#clear(this.#timer);
    if (this.#for === target) this.hide();
  };

  readonly #onFocus = (event: Event): void => {
    const target = this.#targetOf(event.target);
    if (target === null) { this.hide(); return; }
    this.show(target);
  };

  readonly #onPointerDown = (event: Event): void => {
    const pointer = event as PointerEvent;
    if (this.#for !== null && !(pointer.target instanceof this.#doc.defaultView!.Element && pointer.target.closest('#tipbubble'))) this.hide();
    const target = this.#targetOf(pointer.target);
    if (target === null || !this.#opts.enabled()) return;
    this.#press = { target, x: pointer.clientX, y: pointer.clientY };
    this.#clear(this.#timer);
    this.#timer = this.#set(() => { if (this.show(target)) this.#swallowClick = true; this.#press = null; }, TOOLTIP_PRESS_MS);
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
