import { NAV_HOME, enterGalaxy, enterSystem, resolveCF1Galaxy, resolveCF1Star } from '@cf/scene';
import type { NavState } from '@cf/scene';
import type { SpaceItem } from '@cf/art-interface';
import type { Camera } from '../src/space/camera';
import type { PassView } from '../src/space/draw';
import { artCamera, artGrid, artScale } from '../src/space/project';

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

/** A star of the home galaxy with an interstellar visitor and no comet, a pulsar and a magnetar. */
export const VISITED: Place = { seed: 1106282818, x: -897.8339749993756, y: -258.4198963288218 };
export const PULSAR: Place = { seed: 729068929, x: -736.7237938377075, y: 61.177555879577994 };
export const MAGNETAR: Place = { seed: 2563295997, x: -718.0755883874372, y: -258.9377444498241 };
/** A galaxy near home that is colliding with a companion. */
export const COLLIDING = { seed: 2024882063, x: -2224.4266006164253, y: 1732.8262149356306, size: 49.83151470217854, x2: -2143.120729404718, y2: 1745.425561444593 };

/** What a pass reads for a desktop window 1280 by 720 (each art pixel 2 screen pixels), with a new game's charter,
 *  the charts on, effects on and full motion. `cam` is in screen pixels per world unit. */
export function passView(nav: NavState, cam: Camera, over: Partial<PassView> = {}): PassView {
  const view = { w: 1280, h: 720 };
  const scale = artScale(view.w, view.h, 1);
  return { nav, cam: artCamera(cam, 1, scale), grid: artGrid(view.w, view.h, 1, scale), view, zoom: cam.z, time: 0, reach: 880, charts: true, effects: true, motion: true, ...over };
}
export const kindOf = <K extends SpaceItem['kind']>(items: readonly SpaceItem[], kind: K): Extract<SpaceItem, { kind: K }>[] =>
  items.filter((item): item is Extract<SpaceItem, { kind: K }> => item.kind === kind);
export const namesOf = (items: readonly SpaceItem[]): string[] => kindOf(items, 'element').map((item) => item.name);
/** The items that stand at a place of the picture: all but a field, which lies over the whole of it. */
export const placed = (items: readonly SpaceItem[]): Exclude<SpaceItem, { kind: 'field' }>[] =>
  items.filter((item): item is Exclude<SpaceItem, { kind: 'field' }> => item.kind !== 'field');
