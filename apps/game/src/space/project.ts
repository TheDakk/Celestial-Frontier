/* World positions in, whole art pixels out. What each body is drawn as is decided here; the picture itself is
   painted in whole numbers by the art-interface package. Only exact operations are used before rounding, so
   every device gives the same pixels. */
import { fittedWidth, paintSpace } from '@cf/art-interface';
import type { Gaps, InterfaceSheet, SpaceItem, SpacePicture } from '@cf/art-interface';
import { mulberry32 } from '@cf/domain-rand';
import { HOME_POS, SYS_R } from '@cf/domain-worldconfig';
import { systemFor } from '@cf/domain-worldgen';
import { systemScene } from '@cf/scene';
import type { GalaxyNode, NavState, PlanetNode } from '@cf/scene';
import type { Camera, Viewport } from './camera';
import { hsl, place, rgbOf } from './draw';
import type { Grid, MapPasses } from './draw';
import { cosSin, galaxyContent, moonTurn, supernovaBodies, visibleBodies } from './model';
import type { MapBody } from './model';
import { passCaptions, withPasses } from './passes';
import type { Caption } from './passes';
import { DECO_RADII, GALAXY_WIDTH, GLOW, SOL_MARK_CSS, STAR_WIDTH, WIDTH, blob, starBase, starLight } from './sizes';
import type { Sizing } from './sizes';

export type { Caption, Grid, MapPasses, Sizing };

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

/** The span of an element `world` units wide, when the picture is sized by the camera. */
const spanOf = (sizing: Sizing | undefined, world: number, z: number): { span?: number } => (sizing === undefined ? {} : { span: Math.round(world * z) });

function galaxyItems(g: GalaxyNode, x: number, y: number, z: number, sizing?: Sizing): SpaceItem[] {
  if (g.size * z < GALAXY_NEAR) return [{ kind: 'dot', x, y, colour: g.quasar ? 0xffffff : STARLIGHT }];
  const wide = (k: number): { span?: number } => spanOf(sizing, g.size * k, z);
  if (g.quasar) return [{ kind: 'element', name: 'quasar', x, y, ramp: 0xffffff, ...wide(GALAXY_WIDTH.quasar) }];
  const variant = `v${g.seed % ORIENTATIONS}`;
  const flip = ((g.seed >>> 2) & 1) === 1;
  const galaxy: SpaceItem = { kind: 'element', name: `galaxy/${GALAXY_KINDS[g.sp] ?? 'spiral'}/${variant}`, x, y, ramp: STARLIGHT, flip, ...wide(g.radio ? GALAXY_WIDTH.radioHost : GALAXY_WIDTH.galaxy) };
  return g.radio ? [{ kind: 'element', name: `radio-lobes/${variant}`, x, y, ramp: STARLIGHT, flip, ...wide(GALAXY_WIDTH.lobes) }, galaxy] : [galaxy];
}

function planetItems(p: PlanetNode, x: number, y: number, z: number, time: number, sizing?: Sizing): SpaceItem[] {
  const size = 6 * (typeof p.P.sizeMul === 'number' && p.P.sizeMul !== 0 ? p.P.sizeMul : 1);
  const r = Math.round(size * z);
  const bands = planetBands(p);
  if (r < 1) return [{ kind: 'dot', x, y, colour: bands[bands.length >> 1] ?? ICE }];
  const items: SpaceItem[] = [];
  if (p.ring) items.push({ kind: 'ring', x, y, r: Math.round(size * 2.1 * z), colour: ringColour(p) });
  // A planet whose type the sheet draws is that drawing, at the width the sheet draws it; its night follows that width.
  const name = `planet/${p.type}`;
  const drawn = sizing?.drawn?.(name, 2 * r + 1);
  items.push(drawn === undefined ? { kind: 'disc', x, y, r, bands } : { kind: 'disc', x, y, r: drawn >> 1, bands, element: name });
  if (r < 2) return items;
  for (let m = 0; m < p.moons; m++) {
    const { orbit, cos, sin } = moonTurn(m, time);
    const reach = size * orbit * z;
    // A moon is 0.108 of its planet's radius (never under half a unit), and 2.18 of that across.
    items.push(blob(x + Math.round(cos * reach), y + Math.round(sin * reach * 0.4), sizing === undefined ? 1 : Math.max(0.5, size * 0.108) * 2.18 * z, 0xc8c8d0));
  }
  return items;
}

/** A star of a galaxy map. Sized by the camera, its glow is its size times the star base times 8 (6.5 for a fine star). */
function starItems(body: Extract<MapBody, { kind: 'star' }>, x: number, y: number, cam: Camera, grid: Grid, sizing?: Sizing): SpaceItem[] {
  const colour = rgbOf(body.ref.c);
  const giant = body.ref.s >= GIANT;
  const marked = body.ref.sol === true && cam.z > Math.min(grid.w, grid.h) / 900;
  if (sizing === undefined) {
    const star: SpaceItem = giant ? { kind: 'element', name: 'star/giant', x, y, ramp: colour } : { kind: 'dot', x, y, colour };
    return marked ? [star, { kind: 'ring', x, y, r: SOL_MARK, colour: 0xffd9a0 }] : [star];
  }
  const glow = body.ref.s * starBase(cam.z / sizing.perCss) * (body.priority === 2 ? STAR_WIDTH.fine : STAR_WIDTH.coarse) * cam.z;
  const star: SpaceItem[] = giant ? [{ kind: 'element', name: 'star/giant', x, y, ramp: colour, span: Math.round(glow * GLOW) }] : starLight(x, y, glow, colour, sizing.solid);
  return marked ? [...star, { kind: 'ring', x, y, r: Math.round(SOL_MARK_CSS * sizing.perCss), colour: 0xffd9a0 }] : star;
}

function bodyItems(body: MapBody, x: number, y: number, cam: Camera, grid: Grid, time: number, sizing?: Sizing): SpaceItem[] {
  switch (body.kind) {
    case 'galaxy': return galaxyItems(body.ref, x, y, cam.z, sizing);
    case 'star': return starItems(body, x, y, cam, grid, sizing);
    case 'planet': return planetItems(body.ref, x, y, cam.z, time, sizing);
    case 'deco': {
      const k = body.ref.k;
      const tint = typeof body.ref.hue === 'number' ? hsl(body.ref.hue, 0.82, 0.6) : DECO_TINTS[k] ?? STARLIGHT;
      const radius = typeof body.ref.rr === 'number' ? body.ref.rr : 8;
      const flip = (Math.floor(body.ref.x) & 1) === 1;
      if (sizing !== undefined) {
        // The game's width: by its radius, or for a rogue planet and a failed star its own. A dot under 4 art pixels.
        const world = k === 'rogue' ? WIDTH.rogue : k === 'fbd' ? WIDTH.fbd : radius * (DECO_RADII[k] ?? 2.3);
        if (world * cam.z < 2 * DECO_NEAR) return [{ kind: 'dot', x, y, colour: tint }];
        return [{ kind: 'element', name: `deco/${k}`, x, y, ramp: tint, flip, span: Math.round(world * cam.z) }];
      }
      if (radius * cam.z < DECO_NEAR) return [{ kind: 'dot', x, y, colour: tint }];
      return [{ kind: 'element', name: `deco/${k}`, x, y, ramp: tint, flip }];
    }
    case 'worm': return [{ kind: 'element', name: 'wormhole', x, y, ramp: 0xb48cff, ...spanOf(sizing, WIDTH.wormhole, cam.z) }];
    case 'snova': return [{ kind: 'element', name: `supernova/${body.ref.remnant.toLowerCase()}`, x, y, ramp: 0xffb080, ...spanOf(sizing, WIDTH.supernova, cam.z) }];
    case 'protostar': return [{ kind: 'element', name: 'protostar', x, y, ramp: 0xffd2a0, ...spanOf(sizing, WIDTH.protostar, cam.z) }];
    // A moon is painted with its planet, a dwarf planet with the scenery, a comet and the visitor by the passes.
    case 'moon': case 'dwarf': case 'comet': case 'visitor': return [];
  }
}

/** The bodies of a map as things to paint, in their order. `cam` is in art pixels per world unit, and `time`
 *  the seconds the orbits have run: it turns the moons. With `sizing` each takes the game's size at the camera's zoom. */
export function projectMap(bodies: readonly MapBody[], cam: Camera, grid: Grid, time: number, sizing?: Sizing): SpaceItem[] {
  return bodies.flatMap((body) => {
    const at = place(cam, grid, body.wx, body.wy);
    return bodyItems(body, at.x, at.y, cam, grid, time, sizing);
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

/** How wide a system's star is drawn, in world units: its glow is 4.8 of its radius (at least 8) across; a black
 *  hole, a pair of beams and a protostar have their own widths. */
export function primaryWidth(scene: { kind: string; starR: number }): number {
  const special = PRIMARY_KINDS[scene.kind];
  return special === undefined ? Math.max(scene.starR, 8) * 4.8 * GLOW : special === 'bh' ? WIDTH.primaryBh : special === 'proto' ? WIDTH.primaryProto : WIDTH.primaryBeams;
}

/** The comet shell of the star charts, as the legacy game draws it (celestial-frontier.html 7643 to 7649): a dashed
 *  ring three units inside the system's edge, 2.5 units wide, 6 units of every 11 lit, which is 181 dashes round, in
 *  a blue a little dimmer than the orbit lines. */
const SHELL = { r: SYS_R - 3, width: 2.5, on: 6, off: 5, colour: 0x1f3155 } as const;
/** A dash of the shell is never shorter than this many art pixels of the ring: it is a solid piece, not a dot. */
const DASH_MIN = 3;
const TAU = 6.283185307179586;

/** The comet shell about a star at `at`, at `z` art pixels a world unit. Named difference from the legacy game: its
 *  dashes shrink with the view until they are a faint line; here, from farther out than its 181 dashes can each be
 *  DASH_MIN pixels long, the shell has fewer and longer dashes, in the same six parts lit of eleven. Unsized, it is
 *  one pixel wide. Nothing where none of it can be in the picture: the view inside it, or beside it. */
function shell(at: { x: number; y: number }, z: number, grid: Grid, sized: boolean): SpaceItem[] {
  const r = Math.round(SHELL.r * z);
  const width = sized ? Math.max(1, Math.round(SHELL.width * z)) : 1;
  const outer = r + (width >> 1);
  // How far the star is from the nearest pixel of the picture and from its farthest, squared.
  const squares = (dx: number, dy: number): number => dx * dx + dy * dy;
  const nearest = squares(Math.max(-at.x, 0, at.x - (grid.w - 1)), Math.max(-at.y, 0, at.y - (grid.h - 1)));
  const farthest = squares(Math.max(at.x, grid.w - 1 - at.x), Math.max(at.y, grid.h - 1 - at.y));
  if (nearest > squares(outer + 1, 0) || farthest < squares(Math.max(0, outer - width), 0)) return [];
  const of = SHELL.on + SHELL.off;
  const count = Math.max(1, Math.min(Math.round(TAU * SHELL.r / of), Math.floor(TAU * r * SHELL.on / (of * DASH_MIN))));
  return [{ kind: 'dashes', ...at, r, width, count, on: SHELL.on, of, colour: SHELL.colour }];
}

interface Belt { rocks: readonly { a: number; rr: number; s: number; sp: number }[] }
interface Companion { sep: number; r2: number; col2?: string }

/**
 * What a map shows besides its bodies, painted under them. The universe: the ring of the charter, `reach` world
 * units about home. A galaxy: its star knots, and the black hole at its centre. A system: the orbits and the comet
 * shell when `charts` is on, the belts, the dwarf planets, and the star itself with its companions. With `sizing` each takes the game's
 * size at the camera's zoom. With `orbit` the dwarf planets stand where their orbits have run that many seconds.
 */
export function projectScenery(nav: NavState, cam: Camera, grid: Grid, time: number, options: { reach: number; charts: boolean; sizing?: Sizing; orbit?: number }): SpaceItem[] {
  const { sizing } = options;
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
      for (const [dx, dy, s] of knot.pts as [number, number, number][]) {
        const spot = at(knot.x + dx, knot.y + dy);
        if (sizing === undefined) items.push({ kind: 'dot', ...spot, colour: KNOT_COLOURS[knot.k] });
        else items.push(...starLight(spot.x, spot.y, s * starBase(cam.z / sizing.perCss) * STAR_WIDTH[knot.k] * cam.z, KNOT_COLOURS[knot.k], sizing.solid));
      }
    }
    if (cam.z > Math.min(grid.w, grid.h) / 700) items.push({ kind: 'element', name: 'black-hole', ...at(0, 0), ramp: 0xffffff, ...spanOf(sizing, WIDTH.blackHole, cam.z) });
    return items;
  }
  if (nav.mode !== 'system') return items;
  const scene = systemScene(nav.star.seed);
  const raw = systemFor(nav.star.seed) as { binary?: Companion | null; trinary?: Companion | null; dwarfs?: readonly { orb: number }[] };
  if (options.charts) {
    for (const p of scene.planets) items.push({ kind: 'ring', ...at(0, 0), r: Math.round(p.orb * cam.z), colour: 0x2a3a55 });
    items.push(...shell(at(0, 0), cam.z, grid, sizing !== undefined));
  }
  // A rock of the belt is 2.6 of its size across, one of the outer belt 2.4; a dwarf planet 4.84 units.
  const small = (spot: { x: number; y: number }, world: number, colour: number): SpaceItem => blob(spot.x, spot.y, sizing === undefined ? 1 : world * cam.z, colour);
  for (const [belt, colour, speed, width] of [[scene.belt, 0x9a8f80, 1, 2.6], [scene.kuiper, 0xbcd4e8, 0.4, 2.4]] as const) {
    if (belt === null) continue;
    for (const rock of (belt as Belt).rocks) items.push(small(turned(rock.a + time * rock.sp * speed, rock.rr), rock.s * width, colour));
  }
  for (const dwarf of raw.dwarfs ?? []) {
    items.push(small(turned(dwarf.orb * 0.13 + (options.orbit ?? time) * 0.05 / (dwarf.orb * 0.012), dwarf.orb), WIDTH.dwarf, 0xb0a898));
  }
  const special = PRIMARY_KINDS[scene.kind];
  const tint = rgbOf(scene.starCol || '#ffe9c4');
  items.push({ kind: 'element', name: `primary/${special ?? 'star'}`, ...at(0, 0), ramp: special === undefined ? tint : 0xffffff, ...spanOf(sizing, primaryWidth(scene), cam.z) });
  const companion = (c: Companion, angle: number): SpaceItem =>
    ({ kind: 'element', name: 'companion', ...turned(angle, c.sep), ramp: c.col2 ? rgbOf(c.col2) : tint, ...spanOf(sizing, c.r2 * 4.8 * GLOW, cam.z) });
  if (special === undefined && raw.binary) {
    items.push(companion(raw.binary, time * 0.25));
    if (raw.trinary) items.push(companion(raw.trinary, 2.1 + time * 0.16));
  }
  return items;
}

/** A thing too small for its smallest drawing, `span` art pixels across: one pixel, or from a span of 3 a cross
 *  3 pixels across, in its own colour. */
function mark(x: number, y: number, span: number, colour: number): SpaceItem[] {
  const dot = (dx: number, dy: number): SpaceItem => ({ kind: 'dot', x: x + dx, y: y + dy, colour });
  return span >= 3 ? [dot(0, -1), dot(-1, 0), dot(0, 0), dot(1, 0), dot(0, 1)] : [dot(0, 0)];
}

/** The items with every element that the sheet draws, but only wider than its span, as a mark of that span: nothing
 *  is drawn larger than the game sizes it. An element the sheet lacks is left, to be drawn as a gap and counted. */
function marked(items: readonly SpaceItem[], drawn: (name: string, span: number) => number | undefined): SpaceItem[] {
  return items.flatMap((item) => (item.kind === 'element' && item.span !== undefined && item.clip === undefined
    && drawn(item.name, item.span) === undefined && drawn(item.name, WIDEST) !== undefined ? mark(item.x, item.y, item.span, item.ramp) : [item]));
}
/** A span every drawing fits in. */
const WIDEST = 1 << 20;

/** Everything a map picture is made from. `cam` and `view` are in CSS pixels; `time` is the seconds the map's clock
 *  has run, and `orbit` the seconds the orbits of the planets and the dwarf planets have run where they are held apart
 *  from it (the orbit hold; without it they run with `time`), as the game places those two by its held clock and all
 *  else by the running one; `epoch` is the committed ecology epoch (it places the supernova sites); `reach` is the radius of the
 *  charter in world units, and `charts` whether the orbit lines are shown. With `passes` the picture is the whole
 *  map of the game: its lights, veils, comets and motion are drawn too, as the settings in it allow. With `sized`
 *  everything takes the game's size at the camera's zoom, in whole steps; without it each is drawn at one size. With
 *  `solid` every light and shadow of the map is drawn in whole pixels of the palette, as pixel art is: solid steps with
 *  stepped edges, and no dither anywhere. With `marks` a thing the game sizes smaller than the sheet's smallest drawing
 *  of it is a mark of its own size and colour, not that drawing: a far galaxy map is not crowded by its scenery. */
export interface MapFrame {
  nav: NavState; cam: Camera; view: Viewport; dpr: number; time: number; orbit?: number; epoch: number; reach: number; charts: boolean; passes?: MapPasses; sized?: boolean; solid?: boolean; marks?: boolean;
  /** Present when the map's words are stood clear of each other and of their bodies: the parts of the view, in CSS
   *  pixels, that words keep off (the top bar and the dock); with `tails`, words also keep off a comet's tail; with
   *  `stand`, the name of a comet and of the visitor stands on its foot above it, as the game anchors it; with `apart`,
   *  two names on one line keep the width of a space between them. */
  placement?: { keepOut: readonly { x: number; y: number; w: number; h: number }[]; tails?: boolean; stand?: boolean; apart?: boolean };
}
export interface MapPicture extends SpacePicture { scale: number }

/** The seconds a frame's orbits have run: none under reduced motion, which holds every clock of the map at its start. */
export const orbitTime = (frame: MapFrame): number => (frame.passes?.motion === false ? 0 : frame.orbit ?? frame.time);

/** What a frame paints, from the back: the star field, the map's scenery, then its bodies. With the `sheet` of a
 *  picture sized by the camera, a planet whose type the sheet draws is that drawing in place of its bands. */
export function mapItems(frame: MapFrame, grid: Grid, scale: number, sheet?: InterfaceSheet): SpaceItem[] {
  const cam = artCamera(frame.cam, frame.dpr, scale);
  // Reduced motion holds every clock of the map at its start.
  const time = frame.passes?.motion === false ? 0 : frame.time;
  const orbit = orbitTime(frame);
  const bodies = [...visibleBodies(frame.nav, frame.cam, frame.view, orbit), ...supernovaBodies(frame.nav, frame.epoch)];
  const drawn = sheet === undefined ? {} : { drawn: (name: string, span: number) => fittedWidth(sheet, name, span) };
  const sizing = frame.sized === true ? { sizing: { perCss: frame.dpr / scale, ...drawn, ...(frame.solid === true ? { solid: true } : {}) } } : {};
  const scenery = projectScenery(frame.nav, cam, grid, time, { reach: frame.reach, charts: frame.charts, orbit, ...sizing });
  if (frame.passes === undefined) return [...projectBackdrop(grid), ...scenery, ...projectMap(bodies, cam, grid, time, sizing.sizing)];
  const view = { ...frame.passes, nav: frame.nav, cam, grid, view: frame.view, zoom: frame.cam.z, time, reach: frame.reach, charts: frame.charts, ...sizing, ...(frame.solid === true ? { solid: true } : {}) };
  const items = withPasses(view, projectBackdrop(grid), scenery, bodies.map((body) => ({ body, items: projectMap([body], cam, grid, time, sizing.sizing) })));
  return frame.marks === true && sizing.sizing?.drawn !== undefined ? marked(items, sizing.sizing.drawn) : items;
}

/** The captions of a frame's passes, each anchored at a world point: the far universe's clusters and voids, and in a
 *  system the habitable zone, each comet by name and the visitor. None without `passes`. */
export function mapCaptions(frame: MapFrame): Caption[] {
  if (frame.passes === undefined) return [];
  const scale = artScale(frame.view.w, frame.view.h, frame.dpr);
  return passCaptions({ ...frame.passes, nav: frame.nav, cam: artCamera(frame.cam, frame.dpr, scale), grid: artGrid(frame.view.w, frame.view.h, frame.dpr, scale),
    view: frame.view, zoom: frame.cam.z, time: frame.passes.motion ? frame.time : 0, reach: frame.reach, charts: frame.charts });
}

/** The picture of a frame, in palette indices, and the whole number of screen pixels each of its pixels covers. */
export function mapPicture(frame: MapFrame, sheet: InterfaceSheet, gaps: Gaps): MapPicture {
  const scale = artScale(frame.view.w, frame.view.h, frame.dpr);
  const grid = artGrid(frame.view.w, frame.view.h, frame.dpr, scale);
  return { ...paintSpace(grid.w, grid.h, mapItems(frame, grid, scale, sheet), sheet, gaps), scale };
}
