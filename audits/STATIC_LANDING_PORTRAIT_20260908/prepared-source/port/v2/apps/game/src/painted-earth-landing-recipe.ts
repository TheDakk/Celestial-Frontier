import { buildEarthLayeredRecipeV1 } from './earth-layered-recipe.js';

export const PAINTED_EARTH_LANDING_ID = 'painted-earth-civet-landing-v1' as const;

/** Temporary fail-closed binding. Replace only with the reviewed asset digest
 * before source freeze; the loader rejects this non-SHA value before fetch. */
const PENDING_PAINTED_EARTH_LANDING_SHA256 = 'PENDING_REVIEWED_ASSET_SHA256';

const RECIPE = Object.freeze({
  sceneId: PAINTED_EARTH_LANDING_ID,
  width: 960 as const,
  height: 430 as const,
  sha256: PENDING_PAINTED_EARTH_LANDING_SHA256,
});

/** One still painting of canonical Earth. The complete request and all 19
 * ordered genomes retain the existing descriptor-safe admission boundary.
 * Selecting this presentation neither reduces nor regenerates the roster. */
export function buildPaintedEarthLandingRecipeV1(
  request: unknown,
  roster: unknown,
): typeof RECIPE | null {
  return buildEarthLayeredRecipeV1(request, roster) ? RECIPE : null;
}
