// The painted individual on the CARD (Nick 2026-09-22, option 3): the species-art loader asks this source first; when
// the genome's Earth species has an accepted painted archetype (registry by `_earthName`), the card is the individual
// rendered from the sealed card master (`renderCardIndividualV1`) as a PNG data URL — on every device, phone included
// (a 512² master, one render per individual, cached). Otherwise `null` and the painter tier answers as before.
import { speciesVisualKey } from '@cf/art/species-identity';
import { paintedStandInV1, type PaintedStandIn } from './painted-stand-in.js';
import { compileBodyCard, type BodyCard, type MotionGenomeFields, type ResolvedAnatomyRecord } from '../motion/body-card.js';
import { renderCardIndividualV1, type CardMasterV1, type CardReceiptV1 } from './morph-card.js';
import { archetypeGenomeV1, morphParamsV1, type MorphGenome } from './morph-params.js';
import { decodePng } from './png-decode.js';
import { markingNameV1, maskAlphaOf, scaleMaskV1, type AlphaMask } from './morph-markings.js';
import { encodePng, pngDataUrl } from './png-encode.js';
export interface PaintedCardArchetype { readonly earthName: string; readonly dir: string; }
export interface PaintedCardAssets { json(path: string): Promise<unknown>; bytes(path: string): Promise<Uint8Array>; }
export interface PaintedCardAsset { readonly key: string; readonly url: string; readonly width: number; readonly height: number; readonly encodedBytes: number; readonly decodedPixels: number; }
export interface PaintedCardSourceOptions { readonly assets: PaintedCardAssets; readonly registry: readonly PaintedCardArchetype[];
  /** Painted stand-ins for every creature whose anatomy a painting draws (default ON, Nick 2026-09-24); false = painted species only. */
  readonly standIns?: boolean; readonly cacheEntries?: { thumb: number; portrait: number };
  /** Hand the thread back to the host between two renders (2026-09-24, review finding: a grid asking for 20 painted cards rendered them all
   * in ONE task — ~20–40 ms each on a desktop, several times that on a phone). Default: a macrotask. Output is unaffected. */
  readonly yieldToHost?: () => Promise<void>; }
const macrotask = (): Promise<void> => new Promise((resolve) => { if (typeof MessageChannel === 'function') { const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); resolve(); }; c.port2.postMessage(0); } else setTimeout(resolve, 0); });
export const CARD_SIZES = Object.freeze({ thumb: 132, portrait: 440 } as const);
export type CardKind = keyof typeof CARD_SIZES;
interface Archetype { readonly master: CardMasterV1; readonly receipt: CardReceiptV1 & { recordRecipeHash: string }; readonly record: ResolvedAnatomyRecord & { recipeHash: string }; readonly markings: Readonly<Record<string, string>> | null; readonly masks: Map<string, Promise<AlphaMask | null>>; }
export class PaintedCardSource {
  readonly #o: PaintedCardSourceOptions; readonly #byName: Map<string, PaintedCardArchetype>; readonly #archetypes = new Map<string, Promise<Archetype>>();
  readonly #cache: Record<CardKind, Map<string, PaintedCardAsset>> = { thumb: new Map(), portrait: new Map() }; readonly #pending = new Map<string, Promise<PaintedCardAsset>>();
  #renders = 0; #tail: Promise<unknown> = Promise.resolve();
  /** One render per host task: each waits for the previous one and a yield, so the page can paint between cards. */
  #slot<T>(render: () => T | Promise<T>): Promise<T> { const run = this.#tail.then(() => (this.#o.yieldToHost ?? macrotask)()).then(render); this.#tail = run.then(() => undefined, () => undefined); return run; }
  readonly #names: ReadonlySet<string>;
  constructor(o: PaintedCardSourceOptions) { this.#o = o; this.#byName = new Map(o.registry.map((a) => [a.earthName, a])); this.#names = new Set(this.#byName.keys()); }
  /** The archetype for a genome, or null (procedural species and Earth species without a painted archetype). */
  /** Which painted archetype draws this genome, and why (painted-stand-in.ts): the species' own painting, its body plan's
   * archetype (Earth stand-in), or the painting of the body family the procedural painter already draws (procedural stand-in).
   * `standIns: false` restores the painted-species-only card (null for everything else). */
  standInFor(genome: Readonly<Record<string, unknown>> | null | undefined): PaintedStandIn | null {
    const s = paintedStandInV1(genome, this.#names); return s && (s.kind === 'painted' || this.#o.standIns !== false) ? s : null;
  }
  /** The archetype for a genome, or null (keep the procedural art). */
  archetypeFor(genome: Readonly<Record<string, unknown>> | null | undefined): PaintedCardArchetype | null { const s = this.standInFor(genome); return s ? this.#byName.get(s.earthName) ?? null : null; }
  get renders(): number { return this.#renders; }
  async #archetype(a: PaintedCardArchetype): Promise<Archetype> {
    let p = this.#archetypes.get(a.earthName); if (p) return p;
    p = (async () => { const dir = a.dir.endsWith('/') ? a.dir : a.dir + '/';
      const [receipt, record, masterBytes, labelsBytes] = await Promise.all([this.#o.assets.json(dir + 'card/card.json') as Promise<Archetype['receipt']>, this.#o.assets.json(dir + 'record.json') as Promise<Archetype['record']>, this.#o.assets.bytes(dir + 'card/master-512.png'), this.#o.assets.bytes(dir + 'card/labels-512.png')]);
      const [m, l] = await Promise.all([decodePng(masterBytes), decodePng(labelsBytes)]);
      if (m.width !== receipt.card.width || m.height !== receipt.card.height || l.width !== m.width || l.height !== m.height) throw new Error('painted card: master/labels disagree with the receipt');
      if (receipt.recordRecipeHash !== record.recipeHash) throw new Error('painted card: card master sealed for another record');
      // the archetype's painted marking masks (optional: `markings.json` beside the fit, pattern → file); fetched per pattern on demand
      let markings: Readonly<Record<string, string>> | null = null; try { const mj = await this.#o.assets.json(dir + 'markings.json') as { patterns?: Record<string, { file?: string }> }; if (mj?.patterns) { const map: Record<string, string> = {}; for (const [k, v] of Object.entries(mj.patterns)) if (typeof v?.file === 'string') map[k] = v.file; markings = Object.freeze(map); } } catch { markings = null; }
      return { master: { width: m.width, height: m.height, master: m.rgba, labels: l.rgba }, receipt, record, markings, masks: new Map() }; })();
    this.#archetypes.set(a.earthName, p); return p;
  }
  async #mask(a: PaintedCardArchetype, arch: Archetype, name: string): Promise<AlphaMask | null> {
    const file = arch.markings?.[name]; if (!file) return null; let p = arch.masks.get(name); if (p) return p;
    const dir = a.dir.endsWith('/') ? a.dir : a.dir + '/';
    // a failed fetch is NOT cached as 'no marking' (review 2026-09-24): the entry is dropped so the next render retries
    p = (async () => { try { const png = await decodePng(await this.#o.assets.bytes(dir + file)); return scaleMaskV1(maskAlphaOf(png.rgba, png.width, png.height), arch.master.width, arch.master.height); } catch { arch.masks.delete(name); return null; } })();
    arch.masks.set(name, p); return p;
  }
  /** Render (or serve from cache) the individual's card of `kind` for this genome; null when no archetype matches. */
  card(genome: Readonly<Record<string, unknown>>, kind: CardKind): Promise<PaintedCardAsset> | null {
    const a = this.archetypeFor(genome); if (!a) return null;
    const key = speciesVisualKey(genome as Record<string, unknown>), cacheKey = kind + ':' + key; const hit = this.#cache[kind].get(key); if (hit) return Promise.resolve(hit);
    const pending = this.#pending.get(cacheKey); if (pending) return pending;
    const p = (async () => { const arch = await this.#archetype(a); return this.#slot(async () => { const card: BodyCard = compileBodyCard(arch.record, genome as MotionGenomeFields);
      const params = morphParamsV1(genome as MorphGenome, arch.record.recipeHash, archetypeGenomeV1(arch.record as { genome?: MorphGenome; identity?: { speciesVisualKey?: string } })), marking = markingNameV1(params), markingMask = marking ? await this.#mask(a, arch, marking) : null;
      const size = CARD_SIZES[kind], rgba = renderCardIndividualV1({ master: arch.master, receipt: arch.receipt, card, params, size, markingMask }); this.#renders++;
      const png = await encodePng(rgba, size, size); const asset: PaintedCardAsset = Object.freeze({ key, url: pngDataUrl(png), width: size, height: size, encodedBytes: png.length, decodedPixels: size * size });
      const cache = this.#cache[kind], cap = this.#o.cacheEntries?.[kind] ?? (kind === 'thumb' ? 64 : 8); cache.set(key, asset); while (cache.size > cap) { const oldest = cache.keys().next().value!; cache.delete(oldest); }
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
