/* SpeciesArt — the @module [app] LRU wrapper over the four HD portrait
   painters, HAND-PORTED (≲100 lines rule), bodies verbatim from main.js
   2249-2308 incl. the CF-RR-006 device-following cache budget and the
   CF16-005 portrait/thumb SPLIT (the ~150MB pinning fix). Browser-only. */
import { hdPortraitFauna, hdPortraitFlora, hdPortraitFungi, hdPortraitMicrobe } from './hdart.verbatim.js';
import { lineageRenderKingdom, resolveOverride } from './speciesoverrides.js';
export { CLIPPED } from './speciesoverrides.js';   /* the audit's clip sentinel */

const speciesArtCache = new Map<string, string>();
const speciesThumbCache = new Map<string, string>();
function _artCacheCap(): number {
  try { return (typeof matchMedia === 'function' && matchMedia('(max-width: 700px)').matches) ? 96 : 256; } catch { return 256; }
}
try { window.addEventListener('pagehide', () => { try { speciesArtCache.clear(); speciesThumbCache.clear(); } catch { /* verbatim guard */ } }); } catch { /* non-window */ }

/* Seed is not a complete bred-genome identity. `crossGenome(a,b)` and
   `crossGenome(b,a)` intentionally share a derived seed while inheriting
   different trait values, and lineage adds `_earthBlend`/`_anchorVal` outside
   the seed stream. Canonicalize the complete plain genome so every independent
   pixel input owns a cache slot; portrait and thumb use this one helper. */
function stableGenomeNode(value: unknown): unknown {
  if (value === null) return ['null'];
  if (value === undefined) return ['undefined'];
  if (Array.isArray(value)) return ['array', value.map(stableGenomeNode)];
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return ['object', Object.keys(object).sort()
      .map((key) => [key, stableGenomeNode(object[key])])];
  }
  if (typeof value === 'number') {
    const exact = Number.isNaN(value) ? 'NaN'
      : value === Infinity ? 'Infinity'
        : value === -Infinity ? '-Infinity'
          : Object.is(value, -0) ? '-0' : String(value);
    return ['number', exact];
  }
  if (typeof value === 'string') return ['string', value];
  if (typeof value === 'boolean') return ['boolean', value];
  if (typeof value === 'bigint') return ['bigint', String(value)];
  throw new TypeError(`unsupported genome cache value: ${typeof value}`);
}
function stableGenomeValue(value: unknown): string {
  return JSON.stringify(stableGenomeNode(value));
}
function speciesArtKey(g: Record<string, unknown>): string {
  return stableGenomeValue(g);
}

function verbatimPortrait(g: Record<string, unknown>): string {
  /* A mixed-kingdom child keeps its inherited gameplay kingdom, but its Earth
     anatomy belongs to the set-qualified lineage owner. Only the verbatim
     fallback needs this switch: non-fauna lineages are handled by their owned
     named painters before reaching here. */
  const renderKingdom = lineageRenderKingdom(g);
  return renderKingdom === 'fauna' ? hdPortraitFauna(g)
    : (renderKingdom === 'flora' ? hdPortraitFlora(g)
      : (renderKingdom === 'fungi' ? hdPortraitFungi(g) : hdPortraitMicrobe(g)));
}

/* Browser audit hook for the outcome-level lineage regression check. It calls
   the same fallback painter production uses, without reimplementing its rules. */
export function verbatimSpeciesPortraitForAudit(g: Record<string, unknown>): string {
  return verbatimPortrait(g);
}

export function speciesPortrait(g: Record<string, unknown>): string {
  /* THE MORPHOLOGY PASS: a named/lineage override wins first; the complete
     canonical genome key keeps every independent deterministic input apart. */
  const key = speciesArtKey(g);
  if (speciesArtCache.has(key)) { const u = speciesArtCache.get(key)!; speciesArtCache.delete(key); speciesArtCache.set(key, u); return u; }
  const url = resolveOverride(g)   /* corrected morphology, or null → verbatim engine (parity for the untouched) */
    ?? verbatimPortrait(g);
  if (speciesArtCache.size >= _artCacheCap()) { const k = speciesArtCache.keys().next().value as string; speciesArtCache.delete(k); }
  speciesArtCache.set(key, url);
  return url;
}

export function speciesThumb(g: Record<string, unknown>): string {
  /* Portrait and thumb deliberately share the one complete-genome identity.
     A separate hand-built key once drifted by one field and let two different
     genomes collide depending on which surface painted first. */
  const key = speciesArtKey(g);
  if (speciesThumbCache.has(key)) { const u = speciesThumbCache.get(key)!; speciesThumbCache.delete(key); speciesThumbCache.set(key, u); return u; }
  const full = speciesPortrait(g);
  try {
    const im = new Image();
    im.onload = () => {
      try {
        const T = 132, c = document.createElement('canvas'); c.width = c.height = T;
        c.getContext('2d')!.drawImage(im, 0, 0, T, T);
        const u = c.toDataURL();
        if (u && u.length > 30) {
          if (speciesThumbCache.size >= 600) { const k = speciesThumbCache.keys().next().value as string; speciesThumbCache.delete(k); }
          speciesThumbCache.set(key, u);
        }
      } catch { /* verbatim guard */ }
    };
    im.src = full;
  } catch { /* verbatim guard */ }
  return full;
}
