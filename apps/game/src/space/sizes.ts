/* How wide the game draws each thing on a map, in world units: with these the picture follows the camera's zoom as
   the game's does. A width is the width of the game's own sprite; the painter brings the element to the nearest
   whole number of times its drawn size. */
import type { SpaceItem } from '@cf/art-interface';
import type { MapBody } from './model';

/** Present when a picture sizes its things by the camera: how many art pixels one screen pixel is. With `drawn`, the
 *  width the sheet draws an element at for a span, where it has a drawing of that name that fits. */
export interface Sizing { perCss: number; drawn?: (name: string, span: number) => number | undefined }

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
 *  heart, in a halo six tenths as wide: a quarter of its pixels lit, as faint as the game's glow is there. */
export function starLight(x: number, y: number, width: number, colour: number): SpaceItem[] {
  const core = Math.round(width * 0.1);
  if (core < 1) return [{ kind: 'dot', x, y, colour }];
  const items: SpaceItem[] = [{ kind: 'veil', x, y, r: Math.round(width * 0.3), colour, level: 4, light: true }, { kind: 'disc', x, y, r: core, bands: [colour] }];
  const heart = Math.round(width * 0.04);
  if (heart >= 1) items.push({ kind: 'disc', x, y, r: heart, bands: [0xffffff] });
  return items;
}

/** How wide the game's own picture of a body is, in world units, at a zoom in screen pixels a unit: the whole sprite,
 *  its faint edge included. A press anywhere on it selects the body. A planet's is the square its night is drawn on,
 *  three of its radii. */
export function pictureWidth(body: MapBody, zoom: number): number {
  switch (body.kind) {
    case 'galaxy': return body.ref.size * (body.ref.quasar ? GALAXY_WIDTH.quasar : body.ref.radio ? GALAXY_WIDTH.radioHost : GALAXY_WIDTH.galaxy);
    case 'star': return body.ref.s * starBase(zoom) * (body.priority === 2 ? STAR_WIDTH.fine : STAR_WIDTH.coarse);
    case 'planet': return 3 * 6 * (typeof body.ref.P.sizeMul === 'number' && body.ref.P.sizeMul !== 0 ? body.ref.P.sizeMul : 1);
    case 'deco': {
      const k = body.ref.k;
      return k === 'rogue' ? WIDTH.rogue : k === 'fbd' ? WIDTH.fbd : (typeof body.ref.rr === 'number' ? body.ref.rr : 8) * (DECO_RADII[k] ?? 2.3);
    }
    case 'worm': return WIDTH.wormhole;
    case 'snova': return WIDTH.supernova;
    case 'protostar': return WIDTH.protostar;
  }
}
