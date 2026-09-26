// The painted individual on the CARD (Nick 2026-09-22, option 3): the species-art loader asks this source first; when
// the genome's Earth species has an accepted painted archetype (registry by `_earthName`), the card is the individual
// rendered from the sealed card master (`renderCardIndividualV1`) as a PNG data URL — on every device, phone included
// (a 512² master, one render per individual, cached). Otherwise `null` and the painter tier answers as before.
import { speciesVisualKey } from '@cf/art/species-identity';
import { paintedArtV2, type PaintedArtV2 } from './painted-variants.js';
import { compileBodyCard, type BodyCard, type MotionGenomeFields, type ResolvedAnatomyRecord } from '../motion/body-card.js';
import { renderCardIndividualV1, type CardMasterV1, type CardReceiptV1 } from './morph-card.js';
import { archetypeGenomeV1, morphParamsV1, type MorphGenome } from './morph-params.js';
import { decodePng } from './png-decode.js';
import { markingNameV1, maskAlphaOf, scaleMaskV1, type AlphaMask } from './morph-markings.js';
import { encodePng, pngDataUrl } from './png-encode.js';
export interface PaintedCardArchetype { readonly earthName: string; readonly dir: string; }
export interface PaintedCardAssets { json(path: string): Promise<unknown>; bytes(path: string): Promise<Uint8Array>; }
export interface PaintedCardAsset { readonly key: string; readonly url: string; readonly width: number; readonly height: number; readonly encodedBytes: number; readonly decodedPixels: number;
  /** G3: set when the creature's own LIBRARY painting could not be fetched (offline / refused) and its body family's CORE painting drew it; such a card is never cached. */
  readonly libraryFallback?: Readonly<{ wanted: string; drawnBy: string; reason: string }>;
  /** G5: the finished original this card drew (absent = the unfinished painting). */ readonly finishedSha256?: string; }
export interface PaintedCardSourceOptions { readonly assets: PaintedCardAssets; readonly registry: readonly PaintedCardArchetype[];
  /** Painted stand-ins for every creature whose anatomy a painting draws (default ON, Nick 2026-09-24); false = painted species only. */
  readonly standIns?: boolean;
  /** G3: the archetypes that ship in the pack (the rest are on-demand library art). When a library archetype cannot be loaded, the card
   * falls back to the body family's CORE painting (`paintedArtV2` over this set, as the stage's coreStandInRecord), labelled and uncached. Absent = no fallback. */
  readonly core?: ReadonlySet<string>;
  /** How many decoded archetypes stay resident (LRU); default ARCHETYPE_RESIDENT_DEFAULT. */
  readonly archetypeEntries?: number; readonly cacheEntries?: { thumb: number; portrait: number };
  /** Hand the thread back to the host between two renders (2026-09-24, review finding: a grid asking for 20 painted cards rendered them all
   * in ONE task — ~20–40 ms each on a desktop, several times that on a phone). Default: a macrotask. Output is unaffected. */
  readonly yieldToHost?: () => Promise<void>;
  /** G5: the individual's retained FINISHED card master (creature-finish-route.ts), or null. Never triggers inference. When it names
   * the drawn archetype's record and matches its card-master size and every alpha byte, the card renders the finished pixels (the morph still applies on
   * top) under its own cache key; otherwise the unfinished painting draws. Absent = today's path, byte for byte. */
  readonly finished?: (genome: Readonly<Record<string, unknown>>, archetype: PaintedCardArchetype, kind: CardKind) => Promise<FinishedCardMasterV1 | null>; }
/** An individual's finished card master (the box-downscaled finished original), in the archetype's card-master space. */
export interface FinishedCardMasterV1 { readonly sha256: string; readonly recordRecipeHash: string; readonly width: number; readonly height: number; readonly rgba: Uint8Array; }
/** Final consumer check: source conservation may preserve an opaque/keyed master; the admitted card has its own keyed alpha. */
function matchesCardAlpha(finished:ArrayLike<number>,master:ArrayLike<number>):boolean {
  if(finished.length!==master.length)return false;
  for(let i=3;i<master.length;i+=4)if(finished[i]!==master[i])return false;
  return true;
}
const macrotask = (): Promise<void> => new Promise((resolve) => { if (typeof MessageChannel === 'function') { const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); resolve(); }; c.port2.postMessage(0); } else setTimeout(resolve, 0); });
export const CARD_SIZES = Object.freeze({ thumb: 132, portrait: 440 } as const);
export interface PaintedCardOwnershipV1 {
  readonly schema: 'cf-v2-painted-card-ownership/v1'; readonly leases: number;
  readonly keys: Readonly<{ leasedThumbs: readonly string[]; leasedPortraits: readonly string[]; cachedThumbs: readonly string[]; cachedPortraits: readonly string[]; pendingThumbs: readonly string[]; pendingPortraits: readonly string[] }>;
  readonly cacheEntries: number; readonly encodedBytes: number; readonly decodedPixels: number;
  /** The same totals per card kind (C8 resume, 2026-09-25): the portrait counter reads `portrait` exactly. */
  readonly byKind: Readonly<Record<CardKind, Readonly<{ entries: number; encodedBytes: number; decodedPixels: number }>>>;
  /** `bytes` = masterLabelBytes + maskBytes: every decoded buffer the resident archetypes retain, masks included (C8 resume). */
  readonly residentArchetypes: Readonly<{ count: number; bytes: number; masterLabelBytes: number; maskBytes: number; masks: number; names: readonly string[] }>;
  readonly totals: Readonly<{ renders: number; capEvictions: number; releasedUnowned: number }>;
}
/** Painted archetypes kept decoded at once (each: its ≤512² master + label map, ~2 MiB). */
export const ARCHETYPE_RESIDENT_DEFAULT = 2;
export type CardKind = keyof typeof CARD_SIZES;
interface Archetype { readonly master: CardMasterV1; readonly receipt: CardReceiptV1 & { recordRecipeHash: string }; readonly record: ResolvedAnatomyRecord & { recipeHash: string }; readonly markings: Readonly<Record<string, string>> | null; readonly masks: Map<string, Promise<AlphaMask | null>>; }
export class PaintedCardSource {
  readonly #o: PaintedCardSourceOptions; readonly #byName: Map<string, PaintedCardArchetype>; readonly #archetypes = new Map<string, Promise<Archetype>>(); readonly #archetypeBytes = new Map<string, number>();
  /** Retained decoded marking masks per resident archetype (pattern → alpha bytes); dropped with the archetype. */
  readonly #maskBytes = new Map<string, Map<string, number>>();
  readonly #cache: Record<CardKind, Map<string, PaintedCardAsset>> = { thumb: new Map(), portrait: new Map() }; readonly #pending = new Map<string, Promise<PaintedCardAsset>>();
  #renders = 0; #evicted = 0; #released = 0; readonly #leases = new Map<string, number>(); #tail: Promise<unknown> = Promise.resolve();
  /** One render per host task: each waits for the previous one and a yield, so the page can paint between cards. */
  #slot<T>(render: () => T | Promise<T>): Promise<T> { const run = this.#tail.then(() => (this.#o.yieldToHost ?? macrotask)()).then(render); this.#tail = run.then(() => undefined, () => undefined); return run; }
  readonly #names: ReadonlySet<string>;
  constructor(o: PaintedCardSourceOptions) { this.#o = o; this.#byName = new Map(o.registry.map((a) => [a.earthName, a])); this.#names = new Set(this.#byName.keys()); }
  /** The archetype for a genome, or null (procedural species and Earth species without a painted archetype). */
  /** Which painted archetype draws this genome, and why (painted-stand-in.ts): the species' own painting, its body plan's
   * archetype (Earth stand-in), or the painting of the body family the procedural painter already draws (procedural stand-in).
   * `standIns: false` restores the painted-species-only card (null for everything else). */
  standInFor(genome: Readonly<Record<string, unknown>> | null | undefined): PaintedArtV2 | null {
    // G4: the ONE resolver the stage also uses (CARD = STAGE)
    const s = paintedArtV2(genome, this.#names); return s && (s.kind === 'painted' || this.#o.standIns !== false) ? s : null;
  }
  /** The archetype for a genome, or null (keep the procedural art). */
  archetypeFor(genome: Readonly<Record<string, unknown>> | null | undefined): PaintedCardArchetype | null { const s = this.standInFor(genome); return s ? this.#byName.get(s.earthName) ?? null : null; }
  get renders(): number { return this.#renders; }
  /** Resident archetypes (review of I5 2026-09-24: with painted stand-ins most Compendium rows use a painting, and an unbounded cache
   * would keep all 13 archetypes' 512² master + labels, ~2 MiB each, resident at once — over the phone Compendium budget). LRU of
   * `archetypeEntries` (default ARCHETYPE_RESIDENT_DEFAULT); an evicted archetype is re-read from the network/HTTP cache when needed. */
  residentArchetypes(): Readonly<{ count: number; bytes: number; masterLabelBytes: number; maskBytes: number; masks: number }> {
    let masterLabelBytes = 0, maskBytes = 0, masks = 0; for (const b of this.#archetypeBytes.values()) masterLabelBytes += b;
    for (const m of this.#maskBytes.values()) for (const b of m.values()) { maskBytes += b; masks++; }
    return Object.freeze({ count: this.#archetypes.size, bytes: masterLabelBytes + maskBytes, masterLabelBytes, maskBytes, masks });
  }
  async #archetype(a: PaintedCardArchetype): Promise<Archetype> {
    let p = this.#archetypes.get(a.earthName); if (p) { this.#archetypes.delete(a.earthName); this.#archetypes.set(a.earthName, p); return p; }
    p = (async () => { const dir = a.dir.endsWith('/') ? a.dir : a.dir + '/';
      const [receipt, record, masterBytes, labelsBytes] = await Promise.all([this.#o.assets.json(dir + 'card/card.json') as Promise<Archetype['receipt']>, this.#o.assets.json(dir + 'record.json') as Promise<Archetype['record']>, this.#o.assets.bytes(dir + 'card/master-512.png'), this.#o.assets.bytes(dir + 'card/labels-512.png')]);
      const [m, l] = await Promise.all([decodePng(masterBytes), decodePng(labelsBytes)]);
      if (m.width !== receipt.card.width || m.height !== receipt.card.height || l.width !== m.width || l.height !== m.height) throw new Error('painted card: master/labels disagree with the receipt');
      if (receipt.recordRecipeHash !== record.recipeHash) throw new Error('painted card: card master sealed for another record');
      // the archetype's painted marking masks (optional: `markings.json` beside the fit, pattern → file); fetched per pattern on demand
      let markings: Readonly<Record<string, string>> | null = null; try { const mj = await this.#o.assets.json(dir + 'markings.json') as { patterns?: Record<string, { file?: string }> }; if (mj?.patterns) { const map: Record<string, string> = {}; for (const [k, v] of Object.entries(mj.patterns)) if (typeof v?.file === 'string') map[k] = v.file; markings = Object.freeze(map); } } catch { markings = null; }
      return { master: { width: m.width, height: m.height, master: m.rgba, labels: l.rgba }, receipt, record, markings, masks: new Map() }; })();
    this.#archetypes.set(a.earthName, p);
    const limit = Math.max(1, this.#o.archetypeEntries ?? ARCHETYPE_RESIDENT_DEFAULT);
    while (this.#archetypes.size > limit) { const oldest = this.#archetypes.keys().next().value as string; this.#archetypes.delete(oldest); this.#archetypeBytes.delete(oldest); this.#maskBytes.delete(oldest); }
    const name = a.earthName; void p.then((arch) => { if (this.#archetypes.get(name) === p) this.#archetypeBytes.set(name, arch.master.master.byteLength + arch.master.labels.byteLength); }, () => { if (this.#archetypes.get(name) === p) this.#archetypes.delete(name); });
    return p;
  }
  async #mask(a: PaintedCardArchetype, arch: Archetype, name: string): Promise<AlphaMask | null> {
    const file = arch.markings?.[name]; if (!file) return null; let p = arch.masks.get(name); if (p) return p;
    const dir = a.dir.endsWith('/') ? a.dir : a.dir + '/';
    // a failed fetch is NOT cached as 'no marking' (review 2026-09-24): the entry is dropped so the next render retries
    const owner = a.earthName, archetypePromise = this.#archetypes.get(owner);
    p = (async () => { try { const png = await decodePng(await this.#o.assets.bytes(dir + file)); const mask = scaleMaskV1(maskAlphaOf(png.rgba, png.width, png.height), arch.master.width, arch.master.height);
      // count it only while its archetype is still the resident one (an evicted archetype takes its masks with it)
      if (this.#archetypes.get(owner) === archetypePromise) { let m = this.#maskBytes.get(owner); if (!m) this.#maskBytes.set(owner, m = new Map()); m.set(name, mask.alpha.byteLength); }
      return mask; } catch { arch.masks.delete(name); return null; } })();
    arch.masks.set(name, p); return p;
  }
  /** A live lease on a painted card (the loader opens one per thumb lease / portrait request, and closes it on release, settle or
   * cancel): the ownership report counts these so a ready painted card is never an unowned image (I5 v2 diagnosis 2026-09-25). */
  openLease(kind: CardKind, key: string): () => void {
    const k = kind + ':' + key; this.#leases.set(k, (this.#leases.get(k) ?? 0) + 1); let open = true;
    return () => { if (!open) return; open = false; const n = (this.#leases.get(k) ?? 1) - 1; if (n > 0) this.#leases.set(k, n); else this.#leases.delete(k); };
  }
  /** Drop every cached card no live lease holds (the loader's releaseUnownedCachedArt calls this); returns how many were dropped. */
  releaseUnowned(): number {
    let dropped = 0;
    for (const kind of ['thumb', 'portrait'] as const) for (const key of [...this.#cache[kind].keys()]) if (!this.#leases.has(kind + ':' + key)) { this.#cache[kind].delete(key); dropped++; }
    this.#released += dropped; return dropped;
  }
  /** The painted path's truthful ownership and resources — a sibling of the broker's diagnostics, never merged into it. */
  ownership(): PaintedCardOwnershipV1 {
    const keys = (kind: CardKind) => Object.freeze([...this.#cache[kind].keys()].sort()), leased = (kind: CardKind) => Object.freeze([...this.#leases.keys()].filter((k) => k.startsWith(kind + ':')).map((k) => k.slice(kind.length + 1)).sort());
    const pending = (kind: CardKind) => Object.freeze([...this.#pending.keys()].filter((k) => k.startsWith(kind + ':')).map((k) => k.slice(kind.length + 1)).sort());
    let encodedBytes = 0, decodedPixels = 0; const byKind = {} as Record<CardKind, Readonly<{ entries: number; encodedBytes: number; decodedPixels: number }>>;
    for (const kind of ['thumb', 'portrait'] as const) { let e = 0, d = 0; for (const a of this.#cache[kind].values()) { e += a.encodedBytes; d += a.decodedPixels; } encodedBytes += e; decodedPixels += d; byKind[kind] = Object.freeze({ entries: this.#cache[kind].size, encodedBytes: e, decodedPixels: d }); }
    let leases = 0; for (const n of this.#leases.values()) leases += n;
    const r = this.residentArchetypes();
    return Object.freeze({ schema: 'cf-v2-painted-card-ownership/v1' as const, leases, keys: Object.freeze({ leasedThumbs: leased('thumb'), leasedPortraits: leased('portrait'), cachedThumbs: keys('thumb'), cachedPortraits: keys('portrait'), pendingThumbs: pending('thumb'), pendingPortraits: pending('portrait') }),
      cacheEntries: this.#cache.thumb.size + this.#cache.portrait.size, encodedBytes, decodedPixels, byKind: Object.freeze(byKind),
      residentArchetypes: Object.freeze({ count: r.count, bytes: r.bytes, masterLabelBytes: r.masterLabelBytes, maskBytes: r.maskBytes, masks: r.masks, names: Object.freeze([...this.#archetypes.keys()]) }),
      totals: Object.freeze({ renders: this.#renders, capEvictions: this.#evicted, releasedUnowned: this.#released }) });
  }
  /** Render (or serve from cache) the individual's card of `kind` for this genome; null when no archetype matches. */
  card(genome: Readonly<Record<string, unknown>>, kind: CardKind): Promise<PaintedCardAsset> | null {
    const a = this.archetypeFor(genome); if (!a) return null;
    const hook = this.#o.finished; if (!hook) return this.#card(genome, kind, a, null);
    return hook(genome, a, kind).catch(() => null).then((f) => this.#card(genome, kind, a, f));
  }
  #card(genome: Readonly<Record<string, unknown>>, kind: CardKind, a: PaintedCardArchetype, finished: FinishedCardMasterV1 | null): Promise<PaintedCardAsset> {
    const key = speciesVisualKey(genome as Record<string, unknown>), cacheKey = kind + ':' + key + (finished ? '~' + finished.sha256 : ''); const hit = this.#cache[kind].get(key); if (hit && hit.finishedSha256 === (finished?.sha256 ?? undefined)) return Promise.resolve(hit);
    const pending = this.#pending.get(cacheKey); if (pending) return pending;
    const p = (async () => {
      let drawnBy = a, fallback: PaintedCardAsset['libraryFallback'];
      const arch = await this.#archetype(a).catch(async (error: unknown) => {
        const core = this.#o.core, s = core && !core.has(a.earthName) ? paintedArtV2(genome, core) : null, f = s ? this.#byName.get(s.earthName) : undefined;
        if (!f) throw error;
        drawnBy = f; fallback = Object.freeze({ wanted: a.earthName, drawnBy: f.earthName, reason: error instanceof Error ? error.message : String(error) });
        return this.#archetype(f);
      });
      return this.#slot(async () => { const card: BodyCard = compileBodyCard(arch.record, genome as MotionGenomeFields);
      const params = morphParamsV1(genome as MorphGenome, arch.record.recipeHash, archetypeGenomeV1(arch.record as { genome?: MorphGenome; identity?: { speciesVisualKey?: string } })), marking = markingNameV1(params), markingMask = marking ? await this.#mask(drawnBy, arch, marking) : null;
      const own = finished && !fallback && finished.recordRecipeHash === arch.record.recipeHash && finished.width === arch.master.width && finished.height === arch.master.height && finished.rgba.length === arch.master.master.length && matchesCardAlpha(finished.rgba, arch.master.master);
      const master = own ? { ...arch.master, master: finished.rgba } : arch.master;
      const size = CARD_SIZES[kind], rgba = renderCardIndividualV1({ master, receipt: arch.receipt, card, params, size, markingMask }); this.#renders++;
      const png = await encodePng(rgba, size, size); const asset: PaintedCardAsset = Object.freeze({ key, url: pngDataUrl(png), width: size, height: size, encodedBytes: png.length, decodedPixels: size * size, ...(fallback ? { libraryFallback: fallback } : {}), ...(own ? { finishedSha256: finished.sha256 } : {}) });
      if (fallback) return asset; // never cached: the creature's own painting replaces it once the library is reachable
      const cache = this.#cache[kind], cap = this.#o.cacheEntries?.[kind] ?? (kind === 'thumb' ? 64 : 8); cache.set(key, asset); while (cache.size > cap) { const oldest = cache.keys().next().value!; cache.delete(oldest); this.#evicted++; }
      return asset; }); })().finally(() => { this.#pending.delete(cacheKey); });
    this.#pending.set(cacheKey, p); return p;
  }
}

/* ---------- adapters to the species-art loader's lease contracts ---------- */
export interface PaintedLeaseLike<A, K = string> { readonly key: K; readonly current: A | null; subscribe(listener: (asset: A | null, error?: unknown) => void): () => void; release(): void; }
export interface PaintedRequestLike<A, K = string> { readonly key: K; readonly current: A | null; cancel(): void; }
/** A thumb lease over a pending painted card: `current` fills when the render settles; subscribers hear it once. */
export function paintedThumbLease<A, K = string>(key: K, pending: Promise<PaintedCardAsset>, shape: (a: PaintedCardAsset) => A): PaintedLeaseLike<A, K> {
  let current: A | null = null, error: unknown = null, settled = false, released = false; const listeners = new Set<(asset: A | null, error?: unknown) => void>();
  pending.then((a) => { current = shape(a); settled = true; if (released) return; for (const l of listeners) l(current); }, (e: unknown) => { error = e; settled = true; if (released) return; for (const l of listeners) l(null, e); });
  return { key, get current() { return current; }, subscribe(listener) { if (released) return () => {}; if (settled) { listener(current, error ?? undefined); return () => {}; } listeners.add(listener); return () => { listeners.delete(listener); }; }, release() { released = true; listeners.clear(); } };
}
/** A portrait request over a pending painted card: the listener hears the asset (or the error) once unless cancelled. */
export function paintedPortraitRequest<A, K = string>(key: K, pending: Promise<PaintedCardAsset>, shape: (a: PaintedCardAsset) => A, listener: (asset: A | null, error?: unknown) => void): PaintedRequestLike<A, K> {
  let current: A | null = null, cancelled = false;
  pending.then((a) => { current = shape(a); if (!cancelled) listener(current); }, (e: unknown) => { if (!cancelled) listener(null, e); });
  return { key, get current() { return current; }, cancel() { cancelled = true; } };
}
