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
import {
  GAL_SPRITES as LIFTED_GAL_SPRITES,
  GAL_KIND,
  makeGalaxySprite as liftedMakeGalaxySprite,
  GAL_SPRITE_SEEDS,
  galaxyHaze as liftedGalaxyHaze,
} from './galaxyart.verbatim.js';
import {
  decoSprite as liftedDecoSprite,
  _quasarSpr as liftedQuasarSpr,
  starSprite as liftedStarSprite,
  _rockSet as liftedRockSet,
  _ringSprite as liftedRingSprite,
  _starSurf as liftedStarSurf,
  _moonSpr as liftedMoonSpr,
  _dwarfSpr as liftedDwarfSpr,
  _rogueSpr as liftedRogueSpr,
  _beamSpr as liftedBeamSpr,
  _nsCoreSpr as liftedNsCoreSpr,
  _bhSpr as liftedBhSpr,
  _cloudSpr as liftedCloudSpr,
  _wormSpr as liftedWormSpr,
  snSiteSprite as liftedSnSiteSprite,
  _bhDiscSpr as liftedBhDiscSpr,
  _protoSpr as liftedProtoSpr,
  _visitorSpr as liftedVisitorSpr,
  _comaSpr as liftedComaSpr,
  _vtrailSpr as liftedVtrailSpr,
} from './artextras.verbatim.js';
import {
  planetThumb,
  starThumb,
  galaxyThumb,
  moonThumb,
  cometThumb,
  beltThumb,
  getPlanetSprite as liftedGetPlanetSprite,
  installPlanetSpriteFinisher,
  installThumbSurfaceFinisher,
} from './thumbart.verbatim.js';
import {
  polishGalaxyCanvasV1,
  polishPlanetCanvasV1,
  polishSystemCanvasV1,
} from './surface-polish.js';

installPlanetSpriteFinisher(polishPlanetCanvasV1);
installThumbSurfaceFinisher((surface, kind, identity) => {
  if (kind === 'galaxy') return polishGalaxyCanvasV1(surface);
  if (kind === 'planet' || kind === 'moon') return polishPlanetCanvasV1(surface);
  /* A black-hole card owns the same pure-black horizon invariant as the live
     sky painter; its surrounding accretion disk stays authored and ungraded. */
  if (kind === 'star' && identity === 'BH') return surface;
  return polishSystemCanvasV1(surface);
});
/* Keep the eager raw archetype pool private. Public consumers use
   `galSpriteFor`, whose first observable access finishes the selected canvas;
   exporting the mutable raw array made its pixels depend on call order. */
const GAL_SPRITES = LIFTED_GAL_SPRITES;
export { GAL_KIND, GAL_SPRITE_SEEDS };

export function makeGalaxySprite(seed: number, kindLock?: string): HTMLCanvasElement {
  return polishGalaxyCanvasV1(liftedMakeGalaxySprite(seed, kindLock));
}

export function galaxyHaze(seed: number, prof: Record<string, unknown>): HTMLCanvasElement {
  return polishGalaxyCanvasV1(liftedGalaxyHaze(seed, prof));
}

export function decoSprite(dc: Record<string, unknown>): HTMLCanvasElement {
  return polishGalaxyCanvasV1(liftedDecoSprite(dc));
}

export function _quasarSpr(): HTMLCanvasElement {
  return polishGalaxyCanvasV1(liftedQuasarSpr());
}

export function starSprite(col: string, spike?: boolean): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedStarSprite(col, spike));
}

export function _rockSet(kind: 'rock' | 'ice'): HTMLCanvasElement[] {
  const set = liftedRockSet(kind);
  for (const surface of set) polishSystemCanvasV1(surface);
  return set;
}

export function _ringSprite(seed: number, hue: string): HTMLCanvasElement {
  return polishPlanetCanvasV1(liftedRingSprite(seed, hue));
}

export function _starSurf(seed: number, col: string, kind: string): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedStarSurf(seed, col, kind));
}

export function _moonSpr(ti: number, hd: boolean): HTMLCanvasElement {
  return polishPlanetCanvasV1(liftedMoonSpr(ti, hd));
}

export function _dwarfSpr(v: number): HTMLCanvasElement {
  return polishPlanetCanvasV1(liftedDwarfSpr(v));
}

export function _rogueSpr(): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedRogueSpr());
}

export function _beamSpr(): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedBeamSpr());
}

export function _nsCoreSpr(): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedNsCoreSpr());
}

export function _bhSpr(): HTMLCanvasElement {
  /* The preserved painter owns a pure-black event horizon. A whole-surface
     color grade would turn that identity-critical absence of light into a
     tinted disk, so this compact object keeps its authored finish. */
  return liftedBhSpr();
}

export function _cloudSpr(P: Record<string, unknown>): HTMLCanvasElement {
  return polishPlanetCanvasV1(liftedCloudSpr(P));
}

export function _wormSpr(): HTMLCanvasElement {
  /* Preserve the wormhole's authored black throat for the same reason. */
  return liftedWormSpr();
}

export function snSiteSprite(seed: number): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedSnSiteSprite(seed));
}

export function _bhDiscSpr(): HTMLCanvasElement {
  /* Supernova-remnant black holes share the central horizon invariant. */
  return liftedBhDiscSpr();
}

export function _protoSpr(): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedProtoSpr());
}

export function _visitorSpr(): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedVisitorSpr());
}

export function _comaSpr(): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedComaSpr());
}

export function _vtrailSpr(): HTMLCanvasElement {
  return polishSystemCanvasV1(liftedVtrailSpr());
}
/* Phase 5 portraits live at the './species' SUBPATH — a LAZY chunk, so the
   380KB hdart engine stays off the boot path (the payload budget). */
export { planetThumb, starThumb, galaxyThumb, moonThumb, cometThumb, beltThumb };

export function getPlanetSprite(P: Record<string, unknown>, wantPx?: number): HTMLCanvasElement {
  return polishPlanetCanvasV1(liftedGetPlanetSprite(P, wantPx));
}

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
  if (g.quasar) return polishGalaxyCanvasV1(
    (GAL_SPRITES[g.sp] || GAL_SPRITES[0]) as HTMLCanvasElement,
  );
  const hit = _cache.get(g.seed);
  if (hit) return hit;
  const lock = _GKIND_SHORT[GAL_KIND[g.sp] as string] || 'spiral';
  const spr = makeGalaxySprite((g.seed ^ 0x6A7A) >>> 0, lock) as HTMLCanvasElement;
  if (_cache.size >= 64) _cache.delete(_cache.keys().next().value as number);   /* cap before insertion */
  _cache.set(g.seed, spr);
  return spr;
}
