import * as traits from '@cf/domain-speciestraits';

// The original's two name tests, verbatim: a movement name and a habitat name each make a creature aquatic or airborne.
// Shared by the state tables' test and the coverage walk (packages/art-testparts/test/body-coverage.test.ts).
export const MOVE_AQUA = /swim|filter|jet|brine-crawl/;
export const HAB_AQUA = /ocean|shallows|reef|vent|trench|lakeshore|sea/;
export const MOVE_AIR = /glider|floater|drifter|soarer|storm-rider|winged/;
export const HAB_AIR = /cloud deck|updraft/;

/**
 * Whether a movement and habitat gene (indexes into the game's tables, the extremophile tables with the marker) are
 * aquatic and airborne by the original's name tests on the game's own names.
 */
export function nameState(loco: number, habitat: number, extremophile: boolean): { aquatic: boolean; airborne: boolean } {
  const move = (extremophile ? traits.EX_LOCO : traits.FA_LOCO)[loco];
  const hab = (extremophile ? traits.EX_HABITAT : traits.FA_HABITAT)[habitat];
  if (move === undefined || hab === undefined) throw new Error(`no game name for movement ${loco} habitat ${habitat}`);
  return { aquatic: MOVE_AQUA.test(move) || HAB_AQUA.test(hab), airborne: MOVE_AIR.test(move) || HAB_AIR.test(hab) };
}
