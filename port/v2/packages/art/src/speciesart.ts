/* SpeciesArt — the @module [app] LRU wrapper over the four HD portrait
   painters, HAND-PORTED (≲100 lines rule), bodies verbatim from main.js
   2249-2308 incl. the CF-RR-006 device-following cache budget and the
   CF16-005 portrait/thumb SPLIT (the ~150MB pinning fix). Browser-only. */
import { hdPortraitFauna, hdPortraitFlora, hdPortraitFungi, hdPortraitMicrobe } from './hdart.verbatim.js';

const speciesArtCache = new Map<string, string>();
function _artCacheCap(): number {
  try { return (typeof matchMedia === 'function' && matchMedia('(max-width: 700px)').matches) ? 96 : 256; } catch { return 256; }
}
try { window.addEventListener('pagehide', () => { try { speciesArtCache.clear(); } catch { /* verbatim guard */ } }); } catch { /* non-window */ }

export function speciesPortrait(g: Record<string, unknown>): string {
  const key = g.seed + '_' + (g.gen || 0) + '_' + g.kingdom + (g.apex ? '_A' : '') + (g.par ? '_P' : '');
  if (speciesArtCache.has(key)) { const u = speciesArtCache.get(key)!; speciesArtCache.delete(key); speciesArtCache.set(key, u); return u; }
  const url = g.kingdom === 'fauna' ? hdPortraitFauna(g)
    : (g.kingdom === 'flora' ? hdPortraitFlora(g)
      : (g.kingdom === 'fungi' ? hdPortraitFungi(g) : hdPortraitMicrobe(g)));
  if (speciesArtCache.size >= _artCacheCap()) { const k = speciesArtCache.keys().next().value as string; speciesArtCache.delete(k); }
  speciesArtCache.set(key, url);
  return url;
}

const speciesThumbCache = new Map<string, string>();
export function speciesThumb(g: Record<string, unknown>): string {
  const key = g.seed + '_' + (g.gen || 0) + '_' + g.kingdom + (g.apex ? '_A' : '') + (g.par ? '_P' : '');
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
