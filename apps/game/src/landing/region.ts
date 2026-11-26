/* The region a landing touches down in, and the count of landing views it is rolled from.

   LEGACY celestial-frontier.html, v1.8.9:
   - every composed landing view raises a session counter before its roll: `_descSeq` 12974, raised at 13507;
   - the salt is epoch × 997 + the worlds first landed on + the counter × 131: `_vistaSalt` 12975-12978;
   - the region is rolled from the world's own mix by that salt: `biomeForLanding` 13344-13356, asked at 13558;
   - the counter is not saved, so after a reload the regions start again from the first view (Dakk's ruling of
     2026-11-26: as the legacy game);
   - a wave-off composes no view and raises nothing: `_descRoll` 13438-13462 returns before `_performLanding`.

   The rules of the roll and of the scene route are `@cf/domain-landing`'s; this file gives them the world. */
import { biomeForLanding, landingSalt, landingSceneRoute, type SceneRoute } from '@cf/domain-landing';
import { systemFor } from '@cf/domain-worldgen';
import type { CanonicalCF1WorldAddress } from '@cf/scene';

export interface LandingRegion {
  /** The region's key (`temperate`, `opensea`, ...); null on a world with no region at all. */
  readonly key: string | null;
  readonly name: string | null;
  /** The scene the landing shows. */
  readonly route: SceneRoute;
  readonly salt: number;
}

/** The landing views composed since the page loaded. */
export interface LandingViews {
  /** How many views have been composed. */
  readonly count: number;
  /** Counts one more view and returns the new count. */
  next(): number;
}

export function createLandingViews(): LandingViews {
  let count = 0;
  return { get count() { return count; }, next: () => ++count };
}

/** The world's own generated facts, as the roll reads them: its seed, type and ice cover. */
function planetOf(address: CanonicalCF1WorldAddress): { readonly seed: number; readonly type: string; readonly iceAmt?: number | null } {
  const entry = systemFor(address.star.seed).planets[address.planet.ordinal];
  if (!entry || entry.P.seed !== address.planet.seed) throw new Error('the world address no longer matches its system');
  const planet = entry.P as { seed: number; type?: string; iceAmt?: number };
  return { seed: planet.seed, type: typeof planet.type === 'string' && planet.type.length > 0 ? planet.type : 'rocky', iceAmt: planet.iceAmt ?? null };
}

/** The region of one landing view of this world. `landings` is the expedition's count of worlds first landed on
    as it stands when the view is composed; `view` is the session's count of views, this one included. */
export function landingRegion(input: Readonly<{
  address: CanonicalCF1WorldAddress;
  /** The world's climate band. */
  band: string;
  epoch: number;
  landings: number;
  view: number;
}>): LandingRegion {
  const planet = planetOf(input.address);
  const salt = landingSalt(input.epoch, input.landings, input.view);
  const region = biomeForLanding(planet, input.band, salt);
  const key = region && typeof region.k === 'string' ? region.k : null;
  return Object.freeze({
    key,
    name: region && typeof region.n === 'string' ? region.n : null,
    route: landingSceneRoute(planet.type, key),
    salt,
  });
}
