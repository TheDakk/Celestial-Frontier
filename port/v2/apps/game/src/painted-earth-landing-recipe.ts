import { buildEarthLayeredRecipeV1 } from './earth-layered-recipe.js';

export const PAINTED_EARTH_LANDING_ID = 'painted-earth-civet-landing-v1' as const;

/** Lossless export of the preserved display reference. Exact bytes/hash bind
 * this new asset; older painted loads keep their existing default byte cap. */
const PAINTED_EARTH_LANDING_SHA256 = 'cd2c616abb35610f6ec63382f6476436f27a8c1a2c698757c8a66d34a5b2e0ec';

const RECIPE = Object.freeze({
  sceneId: PAINTED_EARTH_LANDING_ID,
  width: 960 as const,
  height: 430 as const,
  sha256: PAINTED_EARTH_LANDING_SHA256,
  expectedBytes: 600756,
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
