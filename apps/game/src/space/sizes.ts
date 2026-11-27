/* How wide the game draws each thing on a map, in world units: with these the picture follows the camera's zoom as
   the game's does. A width is the width of the game's own sprite; the painter brings the element to the nearest
   whole number of times its drawn size. */
import type { SpaceItem } from '@cf/art-interface';
import { glow, lit } from './draw';
import { GCELL } from '@cf/domain-worldconfig';
import type { MapBody } from './model';

/** Present when a picture sizes its things by the camera: how many art pixels one screen pixel is. With `drawn`, the
 *  width the sheet draws an element at for a span, where it has a drawing of that name that fits. */
export interface Sizing {
  perCss: number; drawn?: (name: string, span: number) => number | undefined;
  /** Every light is whole pixels of the palette: no dither carries a glow. */
  solid?: boolean;
}

/** The share of a soft glow's sprite that is lit enough to draw; the game's glows fade to nothing toward their edge. */
export const GLOW = 0.6;
/** A galaxy is two sizes wide, a radio galaxy six tenths of that inside lobes 6.6 sizes wide; a quasar 5.6 sizes. */
export const GALAXY_WIDTH = { galaxy: 2, radioHost: 1.2, lobes: 6.6, quasar: 5.6 } as const;
/** The scenery of a galaxy that has a radius, in radii. */
export const DECO_RADII: Readonly<Record<string, number>> = { h2: 2.3, neb: 2.3, mol: 2.3, plan: 2.4, rem: 2.6 };
/** Things of one width wherever they are. */
export const WIDTH = {
  rogue: 2.1, fbd: 3.2, wormhole: 30, supernova: 48, protostar: 6.8, blackHole: 60,
  primaryBh: 110, primaryBeams: 180, primaryProto: 140, dwarf: 4.84,
} as const;
/** A star is this many units of the star base wide for each unit of its size: coarse, fine, and the points of a
 *  globular or an open cluster. */
export const STAR_WIDTH = { coarse: 8, fine: 6.5, glob: 5.5, open: 6 } as const;
/** The radius of the mark about the Sun, in screen pixels. */
export const SOL_MARK_CSS = 9;

/** The game's star sizing, in world units: constant on the screen until the zoom (screen pixels a unit) passes
 *  0.7 / 0.55, then growing with it. */
export function starBase(zoom: number): number {
  return Math.max(0.7 / zoom, 0.55);
}

/** A small solid thing `width` art pixels across: one dot until it is 3 across, then a disc. */
export function blob(x: number, y: number, width: number, colour: number): SpaceItem {
  return width < 3 ? { kind: 'dot', x, y, colour } : { kind: 'disc', x, y, r: Math.round(width / 2), bands: [colour] };
}

/** A star whose glow is `width` art pixels across: a dot from afar; up close a lit disc a fifth as wide with a white
 *  heart, in a halo six tenths as wide: a quarter of its pixels lit, as faint as the game's glow is there. With
 *  `solid` the halo is whole pixels: a dim disc of the star's colour, and a brighter one half as wide inside it. */
export function starLight(x: number, y: number, width: number, colour: number, solid = false): SpaceItem[] {
  const core = Math.round(width * 0.1);
  if (core < 1) return [{ kind: 'dot', x, y, colour }];
  const halo = Math.round(width * 0.3);
  const items: SpaceItem[] = solid
    ? [glow(x, y, halo, lit(colour, 0.2)), ...(halo >= 6 ? [glow(x, y, (halo + core) >> 1, lit(colour, 0.4))] : []), { kind: 'disc', x, y, r: core, bands: [colour] }]
    : [{ kind: 'veil', x, y, r: halo, colour, level: 4, light: true }, { kind: 'disc', x, y, r: core, bands: [colour] }];
  const heart = Math.round(width * 0.04);
  if (heart >= 1) items.push({ kind: 'disc', x, y, r: heart, bands: [0xffffff] });
  return items;
}

/** A planet's radius in world units: six for each unit of its size (celestial-frontier.html 7670). */
export function planetRadius(P: Record<string, unknown>): number {
  return 6 * (typeof P.sizeMul === 'number' && P.sizeMul !== 0 ? P.sizeMul : 1);
}
/** A moon's radius in world units: 0.108 of its planet's, and never under a half (celestial-frontier.html 7762). */
export function moonRadius(P: Record<string, unknown>): number {
  return Math.max(0.5, planetRadius(P) * 0.108);
}
/** The legacy game's own radius of each small body of a system, in world units: a dwarf planet (7806), the
 *  interstellar visitor (7825) and a comet (7842). */
const SMALL_RADIUS = { dwarf: 2.2, visitor: 4, comet: 2.2 } as const;

/**
 * A body's own radius as a press sees it, in world units, at a zoom in screen pixels a unit: the legacy game's number
 * for each kind (celestial-frontier.html). A planet its disc (7670, 7673); a moon its disc (7762, 7780); a system's
 * star its radius, 20 where it has none (7527); a galaxy its size (6151), and none while it is a grain of light (6146);
 * a star of a galaxy 1.6 of its size times the star base (6628), a fine star 1.5 (6651); scenery 0.8 of its radius,
 * 16.8 where it has none (6620); a wormhole 12 (6570); a supernova site 16 (6693); a protostar 3.4 (6700).
 */
function trueRadius(body: MapBody, zoom: number): number {
  switch (body.kind) {
    case 'galaxy': return body.ref.size * zoom < GRAIN_BELOW ? 0 : body.ref.size;
    case 'star': return body.ref.s * starBase(zoom) * (body.priority === 2 ? 1.5 : 1.6);
    case 'starsys': return body.ref.sys.starR || 20;
    case 'planet': return planetRadius(body.ref.P);
    case 'moon': return moonRadius(body.ref.pl.P);
    case 'dwarf': case 'visitor': case 'comet': return SMALL_RADIUS[body.kind];
    case 'deco': return (typeof body.ref.rr === 'number' && body.ref.rr !== 0 ? body.ref.rr : GCELL * 0.4) * 0.8;
    case 'worm': return 12;
    case 'snova': return 16;
    case 'protostar': return 3.4;
  }
}

/**
 * How near its middle a press selects a body, in screen pixels: the body's own disc at this zoom, or its floor under
 * this pointer where that is wider (`padding`: input/mode.ts). A disc, as in the legacy game (5607), whatever the
 * body's picture covers. `minSide` is the view's shorter side.
 */
export function pickRadius(body: MapBody, zoom: number, minSide: number, padding: number): number {
  return Math.max(trueRadius(body, zoom) * zoom, pickFloor(body, zoom, minSide) * padding);
}

/** A galaxy smaller than this on the screen, in pixels, is one grain of light (celestial-frontier.html 6139). */
const GRAIN_BELOW = 2.6;
/**
 * The floor of a body's pick radius, in screen pixels before the pointer's padding (input/mode.ts): however small the
 * body is drawn, a press this near its middle selects it. The legacy game's own number for each kind of body
 * (celestial-frontier.html): a planet 16 (7673); a galaxy 16 (6151), or 9 while it is a grain of light (6139, 6146);
 * a wormhole 14 (6570); a supernova site 13 (6693); a star of a galaxy 12 (6628), a fine star 9 (6651); scenery of a
 * galaxy 12 (6620); a protostar 11 (6700); a comet 13 (7842); the interstellar visitor 12 (7825); a dwarf planet 11
 * (7806); the star of a system 18 (7527). A moon has 10 only once the view is near enough that names are drawn, a zoom over 1/420 of the view's
 * shorter side, `minSide`; farther out it has none, so its target is its true size and a press meant for its planet
 * is the planet's (7773 to 7780). `zoom` is in screen pixels a world unit.
 */
export function pickFloor(body: MapBody, zoom: number, minSide: number): number {
  switch (body.kind) {
    case 'starsys': return 18;
    case 'moon': return zoom > minSide / 420 ? 10 : 0;
    case 'dwarf': return 11;
    case 'visitor': return 12;
    case 'comet': return 13;
    case 'planet': return 16;
    case 'galaxy': return body.ref.size * zoom < GRAIN_BELOW ? 9 : 16;
    case 'worm': return 14;
    case 'snova': return 13;
    case 'star': return body.priority === 2 ? 9 : 12;
    case 'deco': return 12;
    case 'protostar': return 11;
  }
}
