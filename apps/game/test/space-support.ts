import { NAV_HOME, enterGalaxy, enterSystem, resolveCF1Galaxy, resolveCF1Star } from '@cf/scene';
import type { NavState } from '@cf/scene';

export type Place = { seed: number; x: number; y: number };
export const HOME: Place = { seed: 999, x: 90, y: -60 };
export const SOL: Place = { seed: 424242, x: 560, y: 170 };
export const KAUM: Place = { seed: 2737406570, x: 160.5956227169372, y: -89.13221201486886 };
export const OSUM: Place = { seed: 1074947061, x: 114.26536275492981, y: 446.9253231128678 };
/** A galaxy of the galaxies fixture's cells that holds a wormhole. */
export const WORMHOLE_GALAXY: Place = { seed: 1490277435, x: -786.4846107451718, y: -2720.221214309881 };

export function galaxyNav(place: Place = HOME): Extract<NavState, { mode: 'galaxy' }> {
  const galaxy = resolveCF1Galaxy(place);
  if (!galaxy.ok) throw new Error('the galaxy did not resolve');
  const nav = enterGalaxy(NAV_HOME, galaxy.galaxy);
  if (!nav.ok) throw new Error('the galaxy was not entered');
  return nav.state;
}
export function systemNav(star: Place = SOL): Extract<NavState, { mode: 'system' }> {
  const galaxy = galaxyNav();
  const proven = resolveCF1Star(galaxy.gal, star);
  if (!proven.ok) throw new Error('the star did not resolve');
  const nav = enterSystem(galaxy, proven.star);
  if (!nav.ok) throw new Error('the system was not entered');
  return nav.state;
}
