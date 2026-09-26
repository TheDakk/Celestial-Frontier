/** @module compendium-reveal [app] — the Compendium specimen REVEAL and its queue (D16 parity; v1.8.9 `showReveal`, `pendingReveals`,
 * `_revealBlocked`, `_revealFlush`, `rev-x` — INVENTORY row #39).
 *
 * A newly catalogued page (a first catch, a bred hybrid) is revealed as a modal specimen card: the painted portrait, the name, the kind,
 * and "Continue". While another modal owns the screen the reveal QUEUES (v1 "ONE VOICE": a reveal never pops over an open modal and
 * steals its Escape); the next input pulse after that modal closes flushes it. With more waiting, Continue shows the next one and a
 * separate "Skip all (N)" button clears the rest (v1 put "hold to skip all" on the same element; a second real 44px button is the
 * iPhone/accessibility-first form of the same verb — parity call 2026-09-26, reversible). Escape = skip all.
 *
 * View state only: nothing here writes the save. The portrait is a real art-loader request cancelled when the specimen leaves
 * (the painted lease stays truthful). */

export interface RevealEntryV1 {
  readonly logicalId: string;
  readonly name: string;
  readonly kind: string;
  readonly hybrid: boolean;
  readonly genome: Readonly<Record<string, unknown>> | null;
}
export interface RevealPortraitRequestV1 { readonly current: Readonly<{ url: string }> | null; cancel(): void }
export interface RevealArtPortV1 {
  requestPortrait(owner: string, genome: Record<string, unknown>, listener: (asset: Readonly<{ url: string }> | null) => void): RevealPortraitRequestV1;
}
export interface CompendiumRevealOptionsV1 {
  readonly document: Document;
  /** Another modal owns the screen (the reveal must queue, never pop over it). */
  readonly blocked: () => boolean;
  readonly art?: RevealArtPortV1 | null;
  /** Called after the last reveal closes (e.g. refresh an open Compendium list). */
  readonly onDrained?: () => void;
}
export interface CompendiumRevealStateV1 { readonly showing: string | null; readonly queued: readonly string[] }

const esc = (v: string): string => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export class CompendiumRevealQueueV1 {
  readonly #o: CompendiumRevealOptionsV1;
  readonly #queue: RevealEntryV1[] = [];
  #showing: RevealEntryV1 | null = null;
  #host: HTMLElement | null = null;
  #portrait: RevealPortraitRequestV1 | null = null;
  /** The current specimen's portrait once it arrives — reapplied by every render (a queued arrival re-renders the card). */
  #portraitUrl: string | null = null;
  #returnFocus: HTMLElement | null = null;
  readonly #pulse = (): void => { setTimeout(() => this.flush(), 0); };

  constructor(options: CompendiumRevealOptionsV1) {
    this.#o = options;
    // v1 `_revealFlush` rides the input pulse: every click/keydown after a blocking modal closes lets a queued reveal through
    options.document.addEventListener('click', this.#pulse, true);
    options.document.addEventListener('keydown', this.#pulse, true);
  }

  /** A new page to reveal: shown now, or queued while a reveal is up or another modal owns the screen. */
  enqueue(entry: RevealEntryV1): void {
    if (this.#showing !== null || this.#o.blocked()) { this.#queue.push(entry); this.#render(); return; }
    this.#show(entry);
  }
  /** Show the next queued reveal when nothing blocks it (the input pulse calls this; so may the owner). */
  flush(): void {
    if (this.#showing !== null || this.#queue.length === 0 || this.#o.blocked()) return;
    this.#show(this.#queue.shift()!);
  }
  state(): CompendiumRevealStateV1 {
    return Object.freeze({ showing: this.#showing?.logicalId ?? null, queued: Object.freeze(this.#queue.map((e) => e.logicalId)) });
  }
  dispose(): void {
    this.#o.document.removeEventListener('click', this.#pulse, true);
    this.#o.document.removeEventListener('keydown', this.#pulse, true);
    this.#close(true);
  }

  #ensureHost(): HTMLElement {
    if (this.#host) return this.#host;
    const doc = this.#o.document, host = doc.createElement('div');
    host.id = 'reveal';
    host.className = 'reveal';
    host.dataset.sel = 'reveal';
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    host.setAttribute('aria-labelledby', 'rev-name');
    host.hidden = true;
    host.addEventListener('click', (event) => {
      const t = (event.target as HTMLElement).closest<HTMLElement>('[data-rev]');
      if (!t) return;
      event.stopPropagation();
      if (t.dataset.rev === 'skip') this.#skipAll(); else this.#continue();
    });
    host.addEventListener('keydown', (event) => { if ((event as KeyboardEvent).key === 'Escape') { event.stopPropagation(); this.#skipAll(); } });
    doc.body.append(host);
    this.#host = host;
    return host;
  }
  #show(entry: RevealEntryV1): void {
    const doc = this.#o.document;
    if (this.#showing === null) this.#returnFocus = doc.activeElement instanceof doc.defaultView!.HTMLElement ? doc.activeElement as HTMLElement : null;
    this.#portrait?.cancel(); this.#portrait = null; this.#portraitUrl = null;
    this.#showing = entry;
    const host = this.#ensureHost();
    host.hidden = false;
    this.#render();
    if (entry.genome && this.#o.art) {
      try {
        const publish = (asset: Readonly<{ url: string }> | null) => { if (this.#showing === entry && asset) { this.#portraitUrl = asset.url; this.#applyPortrait(); } };
        const request = this.#o.art.requestPortrait('compendium-reveal', { ...entry.genome }, publish);
        this.#portrait = request;
        if (request.current) publish(request.current);
      } catch { const img = host.querySelector<HTMLImageElement>('[data-sel="reveal-portrait"]'); if (img) img.dataset.artState = 'error'; }
    }
    host.querySelector<HTMLButtonElement>('[data-rev="continue"]')!.focus();
  }
  #render(): void {
    const host = this.#host, entry = this.#showing;
    if (!host || !entry) return;
    const more = this.#queue.length;
    host.innerHTML = '<div class="reveal-card">'
      + `<div class="reveal-title" data-sel="reveal-title">${entry.hybrid ? 'Hybrid specimen' : 'Compendium specimen'}</div>`
      + '<img data-sel="reveal-portrait" data-art-state="placeholder" alt="" width="440" height="440">'
      + `<div class="reveal-name" id="rev-name" data-sel="reveal-name">${esc(entry.name)}</div>`
      + `<div class="reveal-kind">${esc(entry.kind)}${entry.hybrid ? ' · hybrid' : ''}</div>`
      + `<button type="button" data-rev="continue" data-sel="reveal-continue">${more ? `Continue · ${more} more` : 'Continue'}</button>`
      + (more ? `<button type="button" data-rev="skip" data-sel="reveal-skip">Skip all (${more})</button>` : '')
      + '</div>';
    this.#applyPortrait();
  }
  #applyPortrait(): void {
    const img = this.#host?.querySelector<HTMLImageElement>('[data-sel="reveal-portrait"]');
    if (img && this.#portraitUrl) { img.src = this.#portraitUrl; img.dataset.artState = 'ready'; }
  }
  #continue(): void {
    if (this.#queue.length) { this.#show(this.#queue.shift()!); return; }
    this.#close(false);
  }
  #skipAll(): void { this.#queue.length = 0; this.#close(false); }
  #close(silent: boolean): void {
    this.#portrait?.cancel(); this.#portrait = null; this.#portraitUrl = null;
    const had = this.#showing !== null;
    this.#showing = null;
    if (this.#host) { this.#host.hidden = true; this.#host.innerHTML = ''; }
    const back = this.#returnFocus; this.#returnFocus = null;
    if (back && back.isConnected) back.focus();
    if (had && !silent) this.#o.onDrained?.();
  }
}
