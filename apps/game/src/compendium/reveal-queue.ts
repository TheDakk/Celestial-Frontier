/* The reveal of a newly catalogued species, and its queue, as the legacy game has them.
 *
 * A newly catalogued page (a first catch, a bred hybrid) is revealed as a modal card: the portrait, the name, where it
 * comes from and one line, "tap to continue". While another modal owns the screen the reveal queues: it never pops over an
 * open modal and steals its Escape; the next input after that modal closes shows it. With more waiting the line reads
 * "tap to continue · N more — hold to skip all": a tap anywhere else shows the next one, the line itself clears the rest.
 * Escape skips all. A species shown from the queue is titled "Hybrid specimen", as the legacy game titles it.
 *
 * View state only: nothing here writes the save. The portrait is asked of an injected art port and its request is cancelled
 * when the species leaves. */

export interface RevealEntryV1 {
  readonly logicalId: string;
  readonly name: string;
  readonly kind: string;
  /** The precise realm; empty when unknown (the kind is read instead). */
  readonly realm: string;
  /** The world it was first catalogued on. */
  readonly from: string;
  /** A hybrid's generation. */
  readonly gen: number;
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
  /** Called after the last reveal closes. */
  readonly onDrained?: () => void;
}
export interface CompendiumRevealStateV1 { readonly showing: string | null; readonly queued: readonly string[] }

/** The words of the reveal card. */
const WORDS = Object.freeze({
  title: 'Compendium specimen',
  hybridTitle: 'Hybrid specimen',
  origin: (entry: RevealEntryV1): string => entry.hybrid ? `Hybrid · generation ${entry.gen}` : `${entry.realm || entry.kind} · ${entry.from}`,
  continue: 'tap to continue',
  continueMore: (more: number): string => `tap to continue · ${more} more — hold to skip all`,
});

/** Another modal owns the screen: an open dialog, or a shown element in the modal dialog role, other than the reveal. */
export function anotherModalOpen(doc: Document): boolean {
  return doc.querySelector('dialog[open], [role="dialog"][aria-modal="true"]:not([hidden]):not(#reveal)') !== null;
}

const esc = (v: string): string => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export class CompendiumRevealQueueV1 {
  readonly #o: CompendiumRevealOptionsV1;
  readonly #queue: RevealEntryV1[] = [];
  #showing: RevealEntryV1 | null = null;
  /** The species on show came from the queue. */
  #fromQueue = false;
  #host: HTMLElement | null = null;
  #portrait: RevealPortraitRequestV1 | null = null;
  /** The current specimen's portrait once it arrives — reapplied by every render (a queued arrival re-renders the card). */
  #portraitUrl: string | null = null;
  #returnFocus: HTMLElement | null = null;
  #watching = false;
  #disposed = false;
  #pulseTimer: ReturnType<typeof setTimeout> | null = null;
  readonly #pulse = (): void => {
    if (this.#pulseTimer !== null) return;
    this.#pulseTimer = setTimeout(() => { this.#pulseTimer = null; this.flush(); }, 0);
  };
  #watchInput(watching: boolean): void {
    if (watching === this.#watching) return;
    this.#watching = watching;
    const doc = this.#o.document;
    if (watching) { doc.addEventListener('click', this.#pulse, true); doc.addEventListener('keydown', this.#pulse, true); }
    else { doc.removeEventListener('click', this.#pulse, true); doc.removeEventListener('keydown', this.#pulse, true);
      if (this.#pulseTimer !== null) clearTimeout(this.#pulseTimer); this.#pulseTimer = null; }
  }

  constructor(options: CompendiumRevealOptionsV1) {
    this.#o = options;
    // Input pulses are owned only while a reveal is queued behind another modal.
  }

  /** A new page to reveal: shown now, or queued while a reveal is up or another modal owns the screen. */
  enqueue(entry: RevealEntryV1): void {
    if (this.#disposed) return;
    if (this.#showing !== null || this.#o.blocked()) { this.#queue.push(entry); this.#watchInput(this.#showing === null); this.#render(); return; }
    this.#show(entry);
  }
  /** Show the next queued reveal when nothing blocks it (the input pulse calls this; so may the owner). */
  flush(): void {
    if (this.#disposed || this.#showing !== null || this.#queue.length === 0 || this.#o.blocked()) return;
    this.#show(this.#queue.shift()!, true);
  }
  state(): CompendiumRevealStateV1 {
    return Object.freeze({ showing: this.#showing?.logicalId ?? null, queued: Object.freeze(this.#queue.map((e) => e.logicalId)) });
  }
  dispose(): void {
    this.#disposed = true; this.#queue.length = 0; this.#watchInput(false);
    this.#close(true); this.#host?.remove(); this.#host = null;
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
    host.tabIndex = -1;
    host.addEventListener('click', (event) => {
      event.stopPropagation();
      // The line itself, with more waiting, skips them all; any other tap continues.
      if ((event.target as HTMLElement).closest('[data-rev]') && this.#queue.length) this.#skipAll(); else this.#continue();
    });
    host.addEventListener('keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'Escape') { event.stopPropagation(); this.#skipAll(); }
      else if ((key === 'Enter' || key === ' ') && event.target === host) { event.preventDefault(); event.stopPropagation(); this.#continue(); }
    });
    doc.body.append(host);
    this.#host = host;
    return host;
  }
  #show(entry: RevealEntryV1, fromQueue = false): void {
    this.#watchInput(false);
    const doc = this.#o.document;
    if (this.#showing === null) this.#returnFocus = doc.activeElement instanceof doc.defaultView!.HTMLElement ? doc.activeElement as HTMLElement : null;
    this.#portrait?.cancel(); this.#portrait = null; this.#portraitUrl = null;
    this.#showing = entry;
    this.#fromQueue = fromQueue;
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
    host.focus();
  }
  #render(): void {
    const host = this.#host, entry = this.#showing;
    if (!host || !entry) return;
    const more = this.#queue.length;
    host.innerHTML = '<div class="reveal-card">'
      + `<div class="reveal-title" data-sel="reveal-title">${entry.hybrid || this.#fromQueue ? WORDS.hybridTitle : WORDS.title}</div>`
      + '<img data-sel="reveal-portrait" data-art-state="placeholder" alt="" width="440" height="440">'
      + `<div class="reveal-name" id="rev-name" data-sel="reveal-name">${esc(entry.name)}</div>`
      + `<div class="reveal-kind">${esc(WORDS.origin(entry))}</div>`
      + `<button type="button" data-rev="continue" data-sel="reveal-continue">${more ? WORDS.continueMore(more) : WORDS.continue}</button>`
      + '</div>';
    this.#applyPortrait();
  }
  #applyPortrait(): void {
    const img = this.#host?.querySelector<HTMLImageElement>('[data-sel="reveal-portrait"]');
    if (img && this.#portraitUrl) { img.src = this.#portraitUrl; img.dataset.artState = 'ready'; }
  }
  #continue(): void {
    if (this.#queue.length) { this.#show(this.#queue.shift()!, true); return; }
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
