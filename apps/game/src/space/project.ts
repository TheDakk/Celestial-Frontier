/* World positions in, whole art pixels out. What each body is drawn as is decided here; the picture itself is
   painted in whole numbers by the art-interface package. Only exact operations are used before rounding, so
   every device gives the same pixels. */
import { paintSpace } from '@cf/art-interface';
import type { Gaps, InterfaceSheet, SpaceItem } from '@cf/art-interface';
import { mulberry32 } from '@cf/domain-rand';
import { HOME_POS } from '@cf/domain-worldconfig';
import { systemFor } from '@cf/domain-worldgen';
import { systemScene } from '@cf/scene';
import type { GalaxyNode, NavState, PlanetNode } from '@cf/scene';
import type { Camera, Viewport } from './camera';
import { cosSin, galaxyContent, supernovaBodies, visibleBodies } from './model';
import type { MapBody } from './model';

export interface Grid { w: number; h: number }

/** The shorter side of the picture is about this many art pixels: the design's 480 by 270 stage. */
const SHORT_SIDE = 270;
/** How many screen pixels one art pixel covers: a whole number, at least 1. */
export function artScale(cssW: number, cssH: number, dpr: number): number {
  return Math.max(1, Math.floor(Math.min(cssW, cssH) * dpr / SHORT_SIDE));
}
/** The picture that covers a view at a scale: extended to fill it, never stretched. */
export function artGrid(cssW: number, cssH: number, dpr: number, scale: number): Grid {
  return { w: Math.max(1, Math.ceil(cssW * dpr / scale)), h: Math.max(1, Math.ceil(cssH * dpr / scale)) };
}
/** The camera of a view, measured in art pixels per world unit. */
export function artCamera(cam: Camera, dpr: number, scale: number): Camera {
  return { x: cam.x, y: cam.y, z: cam.z * dpr / scale };
}

/** The kind of each of the game's sixteen galaxy sprites, by `sp`. */
export const GALAXY_KINDS: readonly string[] = ['spiral', 'spiral', 'spiral', 'spiral', 'spiral', 'spiral', 'barred', 'barred', 'barred',
  'lenticular', 'lenticular', 'elliptical', 'elliptical', 'elliptical', 'irregular', 'irregular'];
/** Each galaxy kind and the radio lobes are drawn in this many orientations; the seed chooses one. */
export const ORIENTATIONS = 4;
export const PRIMARY_KINDS: Readonly<Record<string, string>> = { BH: 'bh', NS: 'ns', MAG: 'mag', PROTO: 'proto' };

const STARLIGHT = 0xcfe4ff;
const KNOT_COLOURS = { glob: 0xf0dcb0, open: 0xcfe4ff } as const;
const DECO_TINTS: Readonly<Record<string, number>> = { mol: 0x4a3a30, plan: 0x7fe0d0, rem: 0xff9a6a, rogue: 0x8a8a9a, fbd: 0xa0522d };
const ICE = 0xeef4ff;
/** A galaxy under this radius, or scenery under this one, is a single dot. */
const GALAXY_NEAR = 3;
const DECO_NEAR = 2;
const GIANT = 1.5;
const SOL_MARK = 6;

const rgbOf = (hex: string): number => parseInt(hex.slice(1), 16);

/** 0xRRGGBB for a hue in degrees and a saturation and lightness from 0 to 1. */
function hsl(hue: number, saturation: number, lightness: number): number {
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number): number => {
    const k = (n + hue / 30) % 12;
    return Math.round((lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return (channel(0) << 16) | (channel(8) << 8) | channel(4);
}

/** How the bands of each planet type are coloured: a hue (its own field of the planet, or a fixed one), a
 *  saturation, and the range its seeded lightness runs over. */
export const PLANET_BANDS: Readonly<Record<string, { hue: number | 'hue' | 'seaHue'; fallback: number; sat: number; from: number; to: number; count: number }>> = {
  gas: { hue: 'hue', fallback: 32, sat: 0.5, from: 0.42, to: 0.72, count: 7 },
  rocky: { hue: 30, fallback: 30, sat: 0.08, from: 0.35, to: 0.6, count: 4 },
  desert: { hue: 'hue', fallback: 25, sat: 0.45, from: 0.4, to: 0.62, count: 4 },
  venus: { hue: 'hue', fallback: 40, sat: 0.5, from: 0.55, to: 0.75, count: 3 },
  ice: { hue: 195, fallback: 195, sat: 0.35, from: 0.7, to: 0.88, count: 4 },
  ocean: { hue: 'seaHue', fallback: 210, sat: 0.55, from: 0.36, to: 0.52, count: 5 },
  lava: { hue: 12, fallback: 12, sat: 0.8, from: 0.18, to: 0.5, count: 5 },
  terran: { hue: 'seaHue', fallback: 210, sat: 0.55, from: 0.4, to: 0.46, count: 5 },
};

/** The colours of a planet's bands from the top: the same planet always gets the same ones. A living world
 *  alternates sea and land under ice caps; a type this table lacks is banded as rock. */
export function planetBands(planet: PlanetNode): number[] {
  const recipe = PLANET_BANDS[planet.type] ?? PLANET_BANDS.rocky!;
  const random = mulberry32((planet.seed ^ 0x51ab) >>> 0);
  const own = typeof recipe.hue === 'number' ? recipe.hue : planet.P[recipe.hue];
  const hue = typeof own === 'number' ? own : recipe.fallback;
  const bands: number[] = [];
  for (let i = 0; i < recipe.count; i++) bands.push(hsl(hue, recipe.sat, recipe.from + random() * (recipe.to - recipe.from)));
  if (planet.type !== 'terran') return bands;
  const landHue = typeof planet.P.landHue === 'number' ? planet.P.landHue : 115;
  for (let i = 1; i < bands.length; i += 2) bands[i] = hsl(landHue, 0.4, 0.34 + random() * 0.12);
  return [ICE, ...bands, ICE];
}

/** The colour of a planet's ring: ice, or dust. The same draws as the game's ring geometry, in its order. */
function ringColour(planet: PlanetNode): number {
  const random = mulberry32((planet.seed ^ 0x1276) >>> 0);
  random();
  return planet.type === 'ice' || (planet.type === 'gas' && random() < 0.4) ? 0xbcd4e8 : 0xe0cea6;
}

function galaxyItems(g: GalaxyNode, x: number, y: number, z: number): SpaceItem[] {
  if (g.size * z < GALAXY_NEAR) return [{ kind: 'dot', x, y, colour: g.quasar ? 0xffffff : STARLIGHT }];
  if (g.quasar) return [{ kind: 'element', name: 'quasar', x, y, ramp: 0xffffff }];
  const variant = `v${g.seed % ORIENTATIONS}`;
  const flip = ((g.seed >>> 2) & 1) === 1;
  const galaxy: SpaceItem = { kind: 'element', name: `galaxy/${GALAXY_KINDS[g.sp] ?? 'spiral'}/${variant}`, x, y, ramp: STARLIGHT, flip };
  return g.radio ? [{ kind: 'element', name: `radio-lobes/${variant}`, x, y, ramp: STARLIGHT, flip }, galaxy] : [galaxy];
}

function planetItems(p: PlanetNode, x: number, y: number, z: number, time: number): SpaceItem[] {
  const size = 6 * (typeof p.P.sizeMul === 'number' && p.P.sizeMul !== 0 ? p.P.sizeMul : 1);
  const r = Math.round(size * z);
  const bands = planetBands(p);
  if (r < 1) return [{ kind: 'dot', x, y, colour: bands[bands.length >> 1] ?? ICE }];
  const items: SpaceItem[] = [];
  if (p.ring) items.push({ kind: 'ring', x, y, r: Math.round(size * 2.1 * z), colour: ringColour(p) });
  items.push({ kind: 'disc', x, y, r, bands });
  if (r < 2) return items;
  for (let m = 0; m < p.moons; m++) {
    const orbit = 1.7 + m * 0.48;
    const [cos, sin] = cosSin(time * (0.55 / (orbit * Math.sqrt(orbit))) + m * 2.4);
    const reach = size * orbit * z;
    items.push({ kind: 'dot', x: x + Math.round(cos * reach), y: y + Math.round(sin * reach * 0.4), colour: 0xc8c8d0 });
  }
  return items;
}

function bodyItems(body: MapBody, x: number, y: number, cam: Camera, grid: Grid, time: number): SpaceItem[] {
  switch (body.kind) {
    case 'galaxy': return galaxyItems(body.ref, x, y, cam.z);
    case 'star': {
      const colour = rgbOf(body.ref.c);
      const star: SpaceItem = body.ref.s >= GIANT ? { kind: 'element', name: 'star/giant', x, y, ramp: colour } : { kind: 'dot', x, y, colour };
      return body.ref.sol === true && cam.z > Math.min(grid.w, grid.h) / 900 ? [star, { kind: 'ring', x, y, r: SOL_MARK, colour: 0xffd9a0 }] : [star];
    }
    case 'planet': return planetItems(body.ref, x, y, cam.z, time);
    case 'deco': {
      const k = body.ref.k;
      const tint = typeof body.ref.hue === 'number' ? hsl(body.ref.hue, 0.82, 0.6) : DECO_TINTS[k] ?? STARLIGHT;
      const radius = typeof body.ref.rr === 'number' ? body.ref.rr : 8;
      if (radius * cam.z < DECO_NEAR) return [{ kind: 'dot', x, y, colour: tint }];
      return [{ kind: 'element', name: `deco/${k}`, x, y, ramp: tint, flip: (Math.floor(body.ref.x) & 1) === 1 }];
    }
    case 'worm': return [{ kind: 'element', name: 'wormhole', x, y, ramp: 0xb48cff }];
    case 'snova': return [{ kind: 'element', name: `supernova/${body.ref.remnant.toLowerCase()}`, x, y, ramp: 0xffb080 }];
    case 'protostar': return [{ kind: 'element', name: 'protostar', x, y, ramp: 0xffd2a0 }];
  }
}

/** Where a world point falls in the picture, in whole art pixels. */
function place(cam: Camera, grid: Grid, wx: number, wy: number): { x: number; y: number } {
  return { x: Math.round(grid.w / 2 + (wx - cam.x) * cam.z), y: Math.round(grid.h / 2 + (wy - cam.y) * cam.z) };
}

/** The bodies of a map as things to paint, in their order. `cam` is in art pixels per world unit, and `time`
 *  the seconds the orbits have run: it turns the moons. */
export function projectMap(bodies: readonly MapBody[], cam: Camera, grid: Grid, time: number): SpaceItem[] {
  return bodies.flatMap((body) => {
    const at = place(cam, grid, body.wx, body.wy);
    return bodyItems(body, at.x, at.y, cam, grid, time);
  });
}

/** The seeded star field behind every map: the same 900 stars, spread over whatever picture there is. */
export function projectBackdrop(grid: Grid): SpaceItem[] {
  const random = mulberry32(5);
  const items: SpaceItem[] = [];
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(random() * grid.w);
    const y = Math.floor(random() * grid.h);
    random();
    const light = Math.round((random() * 0.5 + 0.15) * 255);
    items.push({ kind: 'dot', x, y, colour: (light << 16) | (light << 8) | light });
  }
  return items;
}

interface Belt { rocks: readonly { a: number; rr: number; sp: number }[] }
interface Companion { sep: number; col2?: string }

/**
 * What a map shows besides its bodies, painted under them. The universe: the ring of the charter, `reach` world
 * units about home. A galaxy: its star knots, and the black hole at its centre. A system: the orbits when `charts`
 * is on, the belts, the dwarf planets, and the star itself with its companions.
 */
export function projectScenery(nav: NavState, cam: Camera, grid: Grid, time: number, options: { reach: number; charts: boolean }): SpaceItem[] {
  const at = (wx: number, wy: number): { x: number; y: number } => place(cam, grid, wx, wy);
  const turned = (angle: number, distance: number): { x: number; y: number } => {
    const [cos, sin] = cosSin(angle);
    return at(cos * distance, sin * distance);
  };
  if (nav.mode === 'universe') {
    return [{ kind: 'ring', ...at(HOME_POS.x, HOME_POS.y), r: Math.round(options.reach * cam.z), colour: 0x96beff }];
  }
  const items: SpaceItem[] = [];
  if (nav.mode === 'galaxy') {
    for (const knot of galaxyContent(nav.gal).deco) {
      if ((knot.k !== 'open' && knot.k !== 'glob') || !Array.isArray(knot.pts)) continue;
      for (const [dx, dy] of knot.pts as [number, number, number][]) items.push({ kind: 'dot', ...at(knot.x + dx, knot.y + dy), colour: KNOT_COLOURS[knot.k] });
    }
    if (cam.z > Math.min(grid.w, grid.h) / 700) items.push({ kind: 'element', name: 'black-hole', ...at(0, 0), ramp: 0xffffff });
    return items;
  }
  if (nav.mode !== 'system') return items;
  const scene = systemScene(nav.star.seed);
  const raw = systemFor(nav.star.seed) as { binary?: Companion | null; trinary?: Companion | null; dwarfs?: readonly { orb: number }[] };
  if (options.charts) for (const p of scene.planets) items.push({ kind: 'ring', ...at(0, 0), r: Math.round(p.orb * cam.z), colour: 0x2a3a55 });
  for (const [belt, colour, speed] of [[scene.belt, 0x9a8f80, 1], [scene.kuiper, 0xbcd4e8, 0.4]] as const) {
    if (belt === null) continue;
    for (const rock of (belt as Belt).rocks) items.push({ kind: 'dot', ...turned(rock.a + time * rock.sp * speed, rock.rr), colour });
  }
  for (const dwarf of raw.dwarfs ?? []) {
    items.push({ kind: 'dot', ...turned(dwarf.orb * 0.13 + time * 0.05 / (dwarf.orb * 0.012), dwarf.orb), colour: 0xb0a898 });
  }
  const special = PRIMARY_KINDS[scene.kind];
  const tint = rgbOf(scene.starCol || '#ffe9c4');
  items.push({ kind: 'element', name: `primary/${special ?? 'star'}`, ...at(0, 0), ramp: special === undefined ? tint : 0xffffff });
  if (special === undefined && raw.binary) {
    items.push({ kind: 'element', name: 'companion', ...turned(time * 0.25, raw.binary.sep), ramp: raw.binary.col2 ? rgbOf(raw.binary.col2) : tint });
    if (raw.trinary) items.push({ kind: 'element', name: 'companion', ...turned(2.1 + time * 0.16, raw.trinary.sep), ramp: raw.trinary.col2 ? rgbOf(raw.trinary.col2) : tint });
  }
  return items;
}

/** Everything a map picture is made from. `cam` and `view` are in CSS pixels; `time` is the seconds the orbits
 *  have run and `epoch` the committed ecology epoch (it places the supernova sites); `reach` is the radius of the
 *  charter in world units, and `charts` whether the orbit lines are shown. */
export interface MapFrame { nav: NavState; cam: Camera; view: Viewport; dpr: number; time: number; epoch: number; reach: number; charts: boolean }
export interface MapPicture { w: number; h: number; pixels: Uint8Array; scale: number }

/** What a frame paints, from the back: the star field, the map's scenery, then its bodies. */
export function mapItems(frame: MapFrame, grid: Grid, scale: number): SpaceItem[] {
  const cam = artCamera(frame.cam, frame.dpr, scale);
  const bodies = [...visibleBodies(frame.nav, frame.cam, frame.view, frame.time), ...supernovaBodies(frame.nav, frame.epoch)];
  return [
    ...projectBackdrop(grid),
    ...projectScenery(frame.nav, cam, grid, frame.time, { reach: frame.reach, charts: frame.charts }),
    ...projectMap(bodies, cam, grid, frame.time),
  ];
}

/** The picture of a frame, in palette indices, and the whole number of screen pixels each of its pixels covers. */
export function mapPicture(frame: MapFrame, sheet: InterfaceSheet, gaps: Gaps): MapPicture {
  const scale = artScale(frame.view.w, frame.view.h, frame.dpr);
  const grid = artGrid(frame.view.w, frame.view.h, frame.dpr, scale);
  return { ...paintSpace(grid.w, grid.h, mapItems(frame, grid, scale), sheet, gaps), scale };
}
