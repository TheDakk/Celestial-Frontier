/* Bounded read-only owner for the Compendium progression overlay.

   It owns page state, replacement, focus continuity and heartbeat refresh;
   product state remains wholly inside the supplied read projector. */
import {
  renderCompendiumCreatureProgressionV1,
  type CompendiumCreatureProgressionV1,
} from './compendium-creature-progression.js';

export interface CompendiumCreatureProgressionSurfaceOptionsV1 {
  readonly isCurrent: () => boolean;
  readonly project: (pageIndex: number) => CompendiumCreatureProgressionV1 | null;
}

export interface CompendiumCreatureProgressionSurfaceSnapshotV1 {
  readonly attached: boolean;
  readonly pageIndex: number;
  readonly rowCount: number;
  readonly statusRows: readonly string[];
}

const ACTION_SELECTOR = [
  '[data-arc7-audition-body]',
  '[data-arc5-rename-body]',
  '[data-arc5-scout-body]',
  '[data-arc5-feed-body]',
  '[data-arc5-explorer-meal-body]',
  '[data-arc5-breed-body]',
].join(', ');

export class CompendiumCreatureProgressionSurfaceV1 {
  readonly #isCurrent: () => boolean;
  readonly #project: (pageIndex: number) => CompendiumCreatureProgressionV1 | null;
  #detail: HTMLElement | null = null;
  #pageIndex = 0;

  constructor(options: CompendiumCreatureProgressionSurfaceOptionsV1) {
    this.#isCurrent = options.isCurrent;
    this.#project = options.project;
  }

  attach(detail: HTMLElement): void {
    this.detach();
    this.#detail = detail;
    this.#pageIndex = 0;
    this.refresh();
  }

  detach(): void {
    this.#detail?.querySelector('[data-arc5-progression-body]')?.remove();
    this.#detail = null;
    this.#pageIndex = 0;
  }

  refresh(): void {
    const detail = this.#detail;
    if (detail === null || !detail.isConnected || !this.#isCurrent()) return;
    const model = this.#project(this.#pageIndex);
    if (model !== null) this.#pageIndex = model.pageIndex;
    const html = renderCompendiumCreatureProgressionV1(model);
    const current = detail.querySelector<HTMLElement>('[data-arc5-progression-body]');
    const view = detail.ownerDocument.defaultView;
    const active = detail.ownerDocument.activeElement;
    const preferredDirection = view !== null && active instanceof view.Element && current?.contains(active)
      ? active.closest<HTMLElement>('[data-creature-progression-page]')
        ?.dataset.creatureProgressionPage ?? null
      : null;
    if (html.length === 0) {
      current?.remove();
      return;
    }
    const template = detail.ownerDocument.createElement('template');
    template.innerHTML = html;
    const replacement = template.content.firstElementChild;
    if (!(replacement instanceof detail.ownerDocument.defaultView!.HTMLElement)) return;
    replacement.addEventListener('click', this.#onClick);
    if (current !== null) current.replaceWith(replacement);
    else detail.insertBefore(replacement, detail.querySelector(ACTION_SELECTOR));
    if (preferredDirection !== null) {
      const alternate = preferredDirection === 'next' ? 'previous' : 'next';
      const preferred = replacement.querySelector<HTMLButtonElement>(
        `[data-creature-progression-page="${preferredDirection}"]`,
      );
      const fallback = replacement.querySelector<HTMLButtonElement>(
        `[data-creature-progression-page="${alternate}"]`,
      );
      (preferred && !preferred.disabled ? preferred : fallback && !fallback.disabled ? fallback : null)
        ?.focus();
    }
  }

  readonly #onClick = (event: Event): void => {
    if (!this.#isCurrent()) return;
    const view = this.#detail?.ownerDocument.defaultView;
    const target = view && event.target instanceof view.Element
      ? event.target.closest<HTMLButtonElement>('[data-creature-progression-page]') : null;
    if (target === null || target.disabled) return;
    const model = this.#project(this.#pageIndex);
    if (model === null || model.pageCount < 2) return;
    const direction = target.dataset.creatureProgressionPage;
    const next = direction === 'previous'
      ? Math.max(0, model.pageIndex - 1)
      : direction === 'next' ? Math.min(model.pageCount - 1, model.pageIndex + 1) : model.pageIndex;
    if (next === model.pageIndex) return;
    this.#pageIndex = next;
    this.refresh();
  };

  snapshot(): CompendiumCreatureProgressionSurfaceSnapshotV1 {
    const surface = this.#detail?.querySelector<HTMLElement>('[data-arc5-progression-body]');
    return Object.freeze({
      attached: surface !== null && surface !== undefined,
      pageIndex: this.#pageIndex,
      rowCount: surface?.querySelectorAll('[data-creature-progression-id]').length ?? 0,
      statusRows: Object.freeze(Array.from(
        surface?.querySelectorAll<HTMLElement>('[data-creature-progression-status]') ?? [],
        (row) => row.textContent ?? '',
      )),
    });
  }
}
