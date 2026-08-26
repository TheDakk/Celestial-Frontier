/* @cf/art — the painterly canvas engine, lifted VERBATIM (HD engine law:
   everything visual uses the painterly canvas painters — no flat primitives
   in shipped art). First occupant: GalaxyArt's 16-archetype sprite pool +
   per-seed baker.

   ⚠ BROWSER-ONLY: GAL_SPRITES bakes 16×512px canvases AT MODULE LOAD.
   Import this from apps/*, never from vitest/node. The generated lift derives
   GalaxyArt's [app] ownership from the authoritative source banner.

   galSpriteFor mirrors main.js getGalaxySprite's ART CONTRACT — per-seed
   face, morphology KIND-LOCKED to the archetype so the sprite can never
   contradict the card's Lenticular/Elliptical/Irregular row — without the
   old build's deferred-bake machinery (that was a boot-perf device for a
   1.9MB single file; the slice bakes on first sight and caches). */
import { GAL_SPRITES, GAL_KIND, makeGalaxySprite, GAL_SPRITE_SEEDS, galaxyHaze } from './galaxyart.verbatim.js';
import { decoSprite, _quasarSpr, starSprite } from './artextras.verbatim.js';

export { GAL_SPRITES, GAL_KIND, makeGalaxySprite, GAL_SPRITE_SEEDS, galaxyHaze };
export { decoSprite, _quasarSpr, starSprite };
export {
  _rockSet, _ringSprite, _starSurf, _moonSpr, _dwarfSpr,
  _rogueSpr, _beamSpr, _nsCoreSpr, _bhSpr, _cloudSpr,
  _wormSpr, snSiteSprite, _bhDiscSpr, _protoSpr,
  _visitorSpr, _comaSpr, _vtrailSpr,
} from './artextras.verbatim.js';
/* Phase 5 portraits live at the './species' SUBPATH — a LAZY chunk, so the
   380KB hdart engine stays off the boot path (the payload budget). */
export { planetThumb, starThumb, galaxyThumb, moonThumb, cometThumb, beltThumb, getPlanetSprite } from './thumbart.verbatim.js';

const _GKIND_SHORT: Record<string, string> = { spiral: 'spiral', barred: 'barred', lenticular: 'lent', elliptical: 'ellip', irregular: 'irr' };
const _cache = new Map<number, HTMLCanvasElement>();

/* ThumbArt's verbatim bodies reach four app-layer names as FREE identifiers.
   Installed here at MODULE LOAD (this package is browser-only anyway):
   - _hdLater: the old build's deferred-HD-bake scheduler → plain setTimeout
   - getGalaxySprite: → galSpriteFor (per-seed always — the deferral was a
     1.9MB-boot device the slice does not need)
   - CARD_FACTS: the survey-card tint cache. ⚠ descriptors' _cardFactsSet
     writes to ITS OWN module map, not this global — until they are unified
     (recorded in DEVIATIONS as part of D-STRAYS), thumbs painted BEFORE a
     descriptor runs use the deterministic default tint. Honest state.
   - _quasarSpr: lifted verbatim (artextras). */
const g0 = globalThis as unknown as Record<string, unknown>;
g0._hdLater ??= (fn: () => void, ms: number) => setTimeout(fn, ms);
g0.getGalaxySprite ??= (g: { seed: number; sp: number; quasar?: boolean }) => galSpriteFor(g);
g0.CARD_FACTS ??= new Map();
g0._quasarSpr ??= _quasarSpr;

export function galSpriteFor(g: { seed: number; sp: number; quasar?: boolean }): HTMLCanvasElement {
  if (g.quasar) return (GAL_SPRITES[g.sp] || GAL_SPRITES[0]) as HTMLCanvasElement;
  const hit = _cache.get(g.seed);
  if (hit) return hit;
  const lock = _GKIND_SHORT[GAL_KIND[g.sp] as string] || 'spiral';
  const spr = makeGalaxySprite((g.seed ^ 0x6A7A) >>> 0, lock) as HTMLCanvasElement;
  if (_cache.size > 64) _cache.delete(_cache.keys().next().value as number);   /* the house cache cap convention */
  _cache.set(g.seed, spr);
  return spr;
}
