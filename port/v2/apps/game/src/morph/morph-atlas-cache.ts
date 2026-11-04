// The morph texture cache (MORPH_SYSTEM_DESIGN.md §1 M2 "cached by (archetype, genome)"): one morphed atlas texture per
// individual, shared by every rig that borrows it (Codex's `borrowedAtlas` option, 5b6f89c7), released by ref count,
// evicted LRU among unreferenced entries beyond the cap — GPU memory is destroyed only when nobody borrows it.
import type { Texture } from 'pixi.js';
export interface MorphAtlasEntry { readonly key: string; readonly texture: Texture; readonly bytes: number; }
export interface MorphAtlasLease { readonly texture: Texture; readonly key: string; release(): void; }
interface Entry { readonly key: string; readonly texture: Texture; readonly bytes: number; refs: number; lastUse: number; }
export interface MorphAtlasCacheOptions { readonly maxEntries?: number; readonly maxBytes?: number; readonly destroy?: (texture: Texture) => void; }
export class MorphAtlasCache {
  readonly #entries = new Map<string, Entry>(); readonly #pending = new Map<string, Promise<Entry>>(); #tick = 0; #produces = 0; #evictions = 0;
  readonly #maxEntries: number; readonly #maxBytes: number; readonly #destroy: (t: Texture) => void;
  constructor(o: MorphAtlasCacheOptions = {}) { this.#maxEntries = o.maxEntries ?? 8; this.#maxBytes = o.maxBytes ?? 96 * 1024 * 1024; this.#destroy = o.destroy ?? ((t) => { t.destroy(true); }); }
  /** Borrow the individual's texture, producing it once per key; concurrent acquires share the production. */
  async acquire(key: string, produce: () => Promise<Texture>): Promise<MorphAtlasLease> {
    let entry = this.#entries.get(key);
    if (!entry) { let p = this.#pending.get(key); if (!p) { p = (async () => { const texture = await produce(); this.#produces++; const e: Entry = { key, texture, bytes: texture.width * texture.height * 4, refs: 0, lastUse: 0 }; this.#entries.set(key, e); return e; })().finally(() => { this.#pending.delete(key); }); this.#pending.set(key, p); } entry = await p; }
    entry.refs++; entry.lastUse = ++this.#tick; this.#evict();
    let released = false; const e = entry;
    return Object.freeze({ texture: e.texture, key, release: () => { if (released) return; released = true; e.refs--; e.lastUse = ++this.#tick; this.#evict(); } });
  }
  #evict(): void {
    const total = () => { let b = 0; for (const e of this.#entries.values()) b += e.bytes; return b; };
    for (;;) { if (this.#entries.size <= this.#maxEntries && total() <= this.#maxBytes) return;
      let victim: Entry | null = null; for (const e of this.#entries.values()) if (e.refs === 0 && (!victim || e.lastUse < victim.lastUse)) victim = e;
      if (!victim) return; this.#entries.delete(victim.key); this.#destroy(victim.texture); this.#evictions++; }
  }
  stats(): Readonly<{ entries: number; borrowed: number; bytes: number; produces: number; evictions: number }> { let borrowed = 0, bytes = 0; for (const e of this.#entries.values()) { if (e.refs > 0) borrowed++; bytes += e.bytes; } return Object.freeze({ entries: this.#entries.size, borrowed, bytes, produces: this.#produces, evictions: this.#evictions }); }
  has(key: string): boolean { return this.#entries.has(key); }
  /** Destroy every unreferenced entry (page hide / study teardown). */
  clearUnreferenced(): void { for (const e of [...this.#entries.values()]) if (e.refs === 0) { this.#entries.delete(e.key); this.#destroy(e.texture); this.#evictions++; } }
}
/** The key of an individual's texture: archetype recipe + the genome's visual key + the marking (a marking mask is part of the picture). */
export const morphAtlasKey = (recipeHash: string, visualKey: string, marking: string | null): string => recipeHash + '|' + visualKey + '|' + (marking ?? '');
/** The app's one cache. */
export const morphAtlasCache = new MorphAtlasCache();
