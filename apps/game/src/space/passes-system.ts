/* The system map's passes besides its bodies: the habitable zone, the day and night of each planet, the cloud decks,
   the comets, the interstellar visitor, and the turning beams of a pulsar. */
import { ditherRank } from '@cf/art-interface';
import type { SpaceItem } from '@cf/art-interface';
import { hashInt, makeNoise } from '@cf/domain-rand';
import { properName } from '@cf/domain-naming';
import { SYS_R } from '@cf/domain-worldconfig';
import { systemFor } from '@cf/domain-worldgen';
import { systemScene } from '@cf/scene';
import type { PlanetNode } from '@cf/scene';
import { minSideOf } from './camera';
import { frameOf, framed, glow, lit, place, rgbOf, scaled, tone } from './draw';
import type { PassView } from './draw';
import { angleOf } from './exact';
import { cosSin } from './model';

const TAU = 6.283185307179586;
const PI = 3.141592653589793;
const ZONE = 0x50d282;
const ZONE_LIGHT = 0.08;
const ZONE_EDGE = 0.3;
const NIGHT = 0x00000c;
const CLOUD = 0xfafcff;
const CLOUD_UNDER = 0xbfcbe0;
/** How far from the middle of a planet, in radii, its cloud deck in whole pixels reaches. */
const CLOUD_EDGE = 0.94;
const COMA = 0xcfe6ff;
const TAIL = 0xc8e6ff;
const VISITOR = 0x8a6f58;
const TRAIL = 0xd6aa8c;
const VISITOR_LIT = 0xd9bc9a;
const VISITOR_MIN = 4;
const WAKE_MIN = 6;
/** A planet in whole pixels. The edge of the night is an arc from pole to pole of the globe that bows away from the
 *  star, as the edge of a shadow lies on a ball. It falls in steps: each begins on the arc that crosses the line from
 *  the star this share of the radius past the globe's middle, and keeps this many sixteenths of a pixel's own colour,
 *  the last the full night. The rest is a little of the night sky, little enough that a surface keeps its own hue:
 *  sand goes to a dark sand, not to slate. */
const NIGHT_STEPS = [[0.28, 10], [0.42, 5], [0.68, 3]] as const;
const NIGHT_SKY = 0x030610;
const LIGHT_SHADE = 19;

export interface Comet { off: number; period: number; aMaj: number; ecc: number; tilt: number }
export interface Visitor { speed: number; off: number; ang: number; b: number }
const rawOf = (seed: number): { comets?: readonly Comet[]; visitor?: Visitor } => systemFor(seed) as { comets?: readonly Comet[]; visitor?: Visitor };

/** How many pixels of a picture lie in the disc of radius r about (x, y), counted a row at a time. */
function discPixels(grid: { w: number; h: number }, x: number, y: number, r: number): number {
  let count = 0;
  for (let py = Math.max(0, y - r); py <= Math.min(grid.h - 1, y + r); py++) {
    const half = Math.floor(Math.sqrt(r * r - (py - y) * (py - y)));
    count += Math.max(0, Math.min(grid.w - 1, x + half) - Math.max(0, x - half) + 1);
  }
  return count;
}

/** The habitable zone: a faint green band between its two radii, shown with the star charts. With the view's `solid`
 *  the band is one whole colour, a green hardly lighter than space; once it is wider than the view is across, or
 *  would lie over more than half of the picture, it is its two edges alone, so that from close by it never fills the
 *  screen. */
export function zoneItems(v: PassView): SpaceItem[] {
  if (v.nav.mode !== 'system' || !v.charts) return [];
  const hz = systemScene(v.nav.star.seed).hz as [number, number] | null;
  if (hz === null) return [];
  if (v.solid === true) {
    const at = place(v.cam, v.grid, 0, 0);
    const [inner, outer] = [Math.round(hz[0] * v.cam.z), Math.round(hz[1] * v.cam.z)];
    const covered = discPixels(v.grid, at.x, at.y, outer) - discPixels(v.grid, at.x, at.y, inner);
    if (outer - inner > Math.min(v.grid.w, v.grid.h) || 2 * covered > v.grid.w * v.grid.h) return [inner, outer].map((r) => ({ kind: 'ring', x: at.x, y: at.y, r, colour: lit(ZONE, ZONE_EDGE) }));
    return [glow(at.x, at.y, outer, lit(ZONE, ZONE_LIGHT), inner)];
  }
  return [{ kind: 'veil', ...place(v.cam, v.grid, 0, 0), r: Math.round(hz[1] * v.cam.z), inner: Math.round(hz[0] * v.cam.z), ...tone(ZONE, 0.055), light: true }];
}

/** The star's light on a planet's day side: its colour, washed toward warm white. */
function dayLight(starColour: string): number {
  const n = rgbOf(starColour);
  return (Math.round(((n >> 16) & 255) * 0.55 + 255 * 0.45) << 16) | (Math.round(((n >> 8) & 255) * 0.55 + 250 * 0.45) << 8) | Math.round((n & 255) * 0.55 + 230 * 0.45);
}

/** The cloud deck of a living or ocean world, over its disc of radius r at (x, y): the game's seeded cloud picture,
 *  slid sideways by `shift` art pixels and wrapped. */
function cloudItems(planet: PlanetNode, x: number, y: number, r: number, shift: number, v: PassView): SpaceItem[] {
  const seed = planet.seed >>> 0;
  const fbm = makeNoise((seed ^ 0xc10d) >>> 0);
  const stretch = 0.55 + ((hashInt(seed, 0x33d, 2) & 255) / 255) * 0.5;
  const items: SpaceItem[] = [];
  for (let py = Math.max(0, y - r); py <= Math.min(v.grid.h - 1, y + r); py++) {
    const ny = (py - y) / r;
    for (let px = Math.max(0, x - r); px <= Math.min(v.grid.w - 1, x + r); px++) {
      if ((px - x) * (px - x) + (py - y) * (py - y) > r * r + r) continue;
      const nx = ((((px - x + r - shift) % (2 * r)) + 2 * r) % (2 * r) - r) / r;
      const out2 = nx * nx + ny * ny;
      if (out2 > 1) continue;
      const cloud = fbm(angleOf(nx, Math.sqrt(1 - out2)) * 1.4 * 2.2 * stretch + 7, ny * 2.2 / (0.75 + stretch * 0.35) + 11, 4);
      if (!(cloud > 0.6)) continue;
      const out = Math.sqrt(out2);
      // The game's cloud has a soft edge: here the body of a cloud is seen at the deck's 45 parts in 100 and its edge
      // at half that. The deck thins well before the limb.
      const cover = (cloud > 0.6 + 0.4 / 3 ? 0.45 : 0.225) * (out > 0.82 ? Math.max(0, (1 - out) / 0.18) : 1);
      if (ditherRank(px, py) < Math.round(16 * cover)) items.push({ kind: 'dot', x: px, y: py, colour: CLOUD });
    }
  }
  return items;
}

/** Whether the game's cloud picture of a planet holds cloud at a point of its disc, `nx` and `ny` in radii from its
 *  middle. The deck stops short of the limb. */
function cloudAt(fbm: ReturnType<typeof makeNoise>, stretch: number, nx: number, ny: number): boolean {
  const out2 = nx * nx + ny * ny;
  if (out2 > CLOUD_EDGE * CLOUD_EDGE) return false;
  return fbm(angleOf(nx, Math.sqrt(1 - out2)) * 1.4 * 2.2 * stretch + 7, ny * 2.2 / (0.75 + stretch * 0.35) + 11, 4) > 0.6;
}

/**
 * The cloud deck in whole pixels: the same seeded cloud picture, slid by `shift` and wrapped, keeping only the pixels
 * that are part of a block of cloud at least 2 by 2 (a lone pixel is no cloud), each a solid white; where a cloud is 3
 * or more pixels tall its lowest pixel is one step darker, its underside.
 */
function solidCloudItems(planet: PlanetNode, x: number, y: number, r: number, shift: number, v: PassView): SpaceItem[] {
  const seed = planet.seed >>> 0;
  const fbm = makeNoise((seed ^ 0xc10d) >>> 0);
  const stretch = 0.55 + ((hashInt(seed, 0x33d, 2) & 255) / 255) * 0.5;
  // The part of the disc in the picture, and two pixels about it for what a pixel's neighbours say of it.
  const [left, right] = [Math.max(-2, x - r - 2), Math.min(v.grid.w + 1, x + r + 2)];
  const [top, bottom] = [Math.max(-2, y - r - 2), Math.min(v.grid.h + 1, y + r + 2)];
  const [w, h] = [right - left + 1, bottom - top + 1];
  if (w <= 0 || h <= 0) return [];
  const raw = new Uint8Array(w * h);
  for (let py = top; py <= bottom; py++) {
    const ny = (py - y) / r;
    for (let px = left; px <= right; px++) {
      if ((px - x) * (px - x) + (py - y) * (py - y) > r * r + r) continue;
      const nx = ((((px - x + r - shift) % (2 * r)) + 2 * r) % (2 * r) - r) / r;
      if (cloudAt(fbm, stretch, nx, ny)) raw[(py - top) * w + (px - left)] = 1;
    }
  }
  const rawAt = (cx: number, cy: number): boolean => cx >= 0 && cy >= 0 && cx < w && cy < h && raw[cy * w + cx] === 1;
  const block = (cx: number, cy: number): boolean => rawAt(cx, cy) && rawAt(cx + 1, cy) && rawAt(cx, cy + 1) && rawAt(cx + 1, cy + 1);
  const cloud = (cx: number, cy: number): boolean => block(cx, cy) || block(cx - 1, cy) || block(cx, cy - 1) || block(cx - 1, cy - 1);
  const items: SpaceItem[] = [];
  for (let cy = 0; cy < h; cy++) for (let cx = 0; cx < w; cx++) {
    const [px, py] = [cx + left, cy + top];
    if (px < 0 || py < 0 || px >= v.grid.w || py >= v.grid.h || !cloud(cx, cy)) continue;
    const underside = !cloud(cx, cy + 1) && cloud(cx, cy - 1) && cloud(cx, cy - 2);
    items.push({ kind: 'dot', x: px, y: py, colour: underside ? CLOUD_UNDER : CLOUD });
  }
  return items;
}

/**
 * A planet's own passes, painted over its disc and under its moons: the cloud deck of a living or ocean world once it
 * is near (it drifts with time), then night on the side away from the star and, on a planet banded by code, the star's
 * light on the side facing it. With the view's `solid` all three are whole pixels, and the cloud deck is the sheet's
 * drawing `planet/<type>/clouds` where it has one as wide as the planet is drawn.
 */
export function dressPlanet(planet: PlanetNode, items: readonly SpaceItem[], v: PassView): SpaceItem[] {
  const discAt = items.findIndex((item) => item.kind === 'disc');
  const disc = items[discAt];
  if (disc === undefined || disc.kind !== 'disc' || disc.r < 3 || v.nav.mode !== 'system') return [...items];
  const { x, y, r } = disc;
  const size = 6 * (typeof planet.P.sizeMul === 'number' && planet.P.sizeMul !== 0 ? planet.P.sizeMul : 1);
  const dress: SpaceItem[] = [];
  if ((planet.type === 'terran' || planet.type === 'ocean') && size * v.zoom > 22) {
    const shift = Math.round(((v.time * 1.6) % (size * 2)) * v.cam.z);
    const width = 2 * r + 1;
    const drawing = `planet/${planet.type}/clouds`;
    // A deck near at hand is tens of thousands of pixels, more than one call takes as arguments: each is added alone.
    if (v.solid !== true) for (const item of cloudItems(planet, x, y, r, shift, v)) dress.push(item);
    // The sheet's own clouds, where it draws them at the width the planet is drawn: twice, a width apart, so the deck
    // wraps as it drifts.
    else if (disc.element !== undefined && v.sizing?.drawn?.(drawing, width) === width) {
      const at = ((shift % width) + width) % width;
      for (const dx of [at, at - width]) dress.push({ kind: 'element', name: drawing, x: x + dx, y, ramp: CLOUD, span: width, clip: { x, y, r } });
    } else for (const item of solidCloudItems(planet, x, y, r, shift, v)) dress.push(item);
  }
  const star = place(v.cam, v.grid, 0, 0);
  const far = Math.sqrt((star.x - x) * (star.x - x) + (star.y - y) * (star.y - y));
  if (far > 0) {
    const [ux, uy] = [(star.x - x) / far, (star.y - y) / far];
    const clip = { x, y, r };
    const away = (k: number): { x: number; y: number } => ({ x: Math.round(x - ux * r * k), y: Math.round(y - uy * r * k) });
    if (v.solid === true) {
      // Whole pixels, as pixel art has it. The arc through both poles that crosses the line from the star at `part` of
      // the radius is on the circle about the point (1 - part * part) / (2 * part) radii toward the star; a step of
      // the night is the globe outside that circle and inside the next one.
      const day = NIGHT_STEPS.map(([part]) => {
        const toward = (1 - part * part) / (2 * part);
        return { ...away(-toward), r: Math.round(r * Math.sqrt(1 + toward * toward)) };
      });
      NIGHT_STEPS.forEach(([, share], i) => {
        dress.push({ kind: 'shade', ...(day[i + 1] ?? clip), share, toward: NIGHT_SKY, clip, out: day[i]! });
      });
      // The star's light on a planet banded by code: one lighter step about the point that faces the star.
      if (disc.element === undefined) dress.push({ kind: 'shade', ...away(-0.5), r: Math.round(r * 0.45), share: LIGHT_SHADE, clip });
      return [...items.slice(0, discAt + 1), ...dress, ...items.slice(discAt + 1)];
    }
    dress.push(
      { kind: 'veil', ...away(0.9), r: Math.round(r * 1.2), colour: NIGHT, level: 2, clip },
      { kind: 'veil', ...away(1.5), r: Math.round(r * 1.2), colour: NIGHT, level: 4, clip },
    );
    // A planet the sheet draws is painted lit: only a planet banded by code takes the star's light from here.
    if (disc.element === undefined) {
      dress.push({ kind: 'veil', ...away(-0.5), r: Math.round(r * 0.6), colour: dayLight(systemScene(v.nav.star.seed).starCol || '#ffe9c4'), level: 2, clip });
    }
  }
  return [...items.slice(0, discAt + 1), ...dress, ...items.slice(discAt + 1)];
}

/** Where a comet is at a time, in world units about the star. */
export function cometAt(comet: Comet, time: number): { x: number; y: number } {
  const [cos, sin] = cosSin(((time + comet.off) / comet.period) * TAU);
  const ox = comet.aMaj * (cos - comet.ecc);
  const oy = comet.aMaj * Math.sqrt(1 - comet.ecc * comet.ecc) * sin;
  const [tc, ts] = cosSin(comet.tilt);
  return { x: tc * ox - ts * oy, y: ts * ox + tc * oy };
}
/** Where the visitor is at a time: along its straight path through the system, which it enters again when it leaves. */
export function visitorAt(visitor: Visitor, time: number): { x: number; y: number; cos: number; sin: number } {
  const path = SYS_R * 2.6;
  const along = ((time * visitor.speed + visitor.off) % path) - path / 2;
  const [cos, sin] = cosSin(visitor.ang);
  return { x: -sin * visitor.b + cos * along, y: cos * visitor.b + sin * along, cos, sin };
}

/** A straight run of pixels from (x, y) along a direction, `length` art pixels long, coloured by how far along. */
function run(x: number, y: number, dx: number, dy: number, from: number, length: number, colour: (part: number) => number): SpaceItem[] {
  const items: SpaceItem[] = [];
  for (let i = from; i < from + length; i++) {
    items.push({ kind: 'dot', x: Math.round(x + dx * i), y: Math.round(y + dy * i), colour: colour(length <= 1 ? 0 : (i - from) / (length - 1)) });
  }
  return items;
}

/** A solid shape about a place of the picture, turned to a direction: each pixel within `reach` of the place is asked
 *  for its colour by how far it lies along the direction and across it, and is left when there is none. */
function shape(at: { x: number; y: number }, cos: number, sin: number, reach: number, v: PassView, colour: (along: number, across: number) => number | null): SpaceItem[] {
  const items: SpaceItem[] = [];
  const r = Math.ceil(reach);
  for (let y = Math.max(0, at.y - r); y <= Math.min(v.grid.h - 1, at.y + r); y++) for (let x = Math.max(0, at.x - r); x <= Math.min(v.grid.w - 1, at.x + r); x++) {
    const [dx, dy] = [x - at.x, y - at.y];
    const found = colour(dx * cos + dy * sin, dy * cos - dx * sin);
    if (found !== null) items.push({ kind: 'dot', x, y, colour: found });
  }
  return items;
}

/** A comet as the picture has it, in whole art pixels: its head, and each pixel of its tail from the head outward. */
export interface CometDrawn { head: { x: number; y: number }; tail: { x: number; y: number }[] }
/** The comets of a system where they are drawn: the tail is blown straight away from the star, longer the nearer the
 *  star. Words on the map keep off a tail as they keep off a body. */
export function cometsDrawn(v: PassView): CometDrawn[] {
  if (v.nav.mode !== 'system') return [];
  return (rawOf(v.nav.star.seed).comets ?? []).map((comet) => {
    const world = cometAt(comet, v.small ?? v.time);
    const far = Math.sqrt(world.x * world.x + world.y * world.y) || 1;
    const head = place(v.cam, v.grid, world.x, world.y);
    const length = Math.round((Math.max(0, SYS_R * 0.55 - far) * 0.5 + 8) * v.cam.z);
    return { head, tail: Array.from({ length }, (_, i) => ({ x: Math.round(head.x + (world.x / far) * (i + 1)), y: Math.round(head.y + (world.y / far) * (i + 1)) })) };
  });
}

/** The comets of a system: each a bright head in a soft coma, its tail fading in three steps. */
export function cometItems(v: PassView): SpaceItem[] {
  const items: SpaceItem[] = [];
  for (const { head, tail } of cometsDrawn(v)) {
    const fade = (part: number): number => scaled(TAIL, part < 1 / 3 ? 0.8 : part < 2 / 3 ? 0.5 : 0.25);
    tail.forEach((at, i) => items.push({ kind: 'dot', ...at, colour: fade(tail.length <= 1 ? 0 : i / (tail.length - 1)) }));
    const coma = Math.round(6.8 / Math.max(0.2, Math.sqrt(v.zoom)) / 2 * v.cam.z);
    // In whole pixels the coma is a dim disc with a brighter one half as wide inside it.
    if (v.solid === true) items.push(glow(head.x, head.y, coma, lit(COMA, 0.35)), ...(coma >= 2 ? [glow(head.x, head.y, coma >> 1, lit(COMA, 0.7))] : []), { kind: 'dot', ...head, colour: 0xffffff });
    else items.push({ kind: 'veil', ...head, r: coma, colour: COMA, level: 8 }, { kind: 'dot', ...head, colour: 0xffffff });
  }
  return items;
}

/** The interstellar visitor, when the system has one: a tumbling sliver of rock ten world units long, trailing a
 *  short fading wake along its path. */
export function visitorItems(v: PassView): SpaceItem[] {
  if (v.nav.mode !== 'system') return [];
  const visitor = rawOf(v.nav.star.seed).visitor;
  if (visitor === undefined) return [];
  const world = visitorAt(visitor, v.small ?? v.time);
  const at = place(v.cam, v.grid, world.x, world.y);
  if (v.solid === true) {
    // In whole pixels it is the game's own shape, and never too small to see: a tumbling rock 10 units long and 3.8
    // thick (never under some 4 pixels by 1), lit on one flank, and behind it on its path a wake 15 units long (never
    // under some 6 pixels) that narrows to a point and fades in three steps.
    const [length, thick] = [Math.max(VISITOR_MIN, 10 * v.cam.z), Math.max(1, 3.8 * v.cam.z)];
    const [cos, sin] = cosSin(visitor.ang + v.time * 0.35);
    const [trail, wide] = [Math.max(WAKE_MIN, 15 * v.cam.z), Math.max(1, 1.6 * v.cam.z)];
    return [
      ...shape(at, -world.cos, -world.sin, trail, v, (a, b) => (a < 1 || a > trail || Math.abs(b) * 2 > Math.max(1, wide * (1 - a / trail)) ? null
        : scaled(TRAIL, a * 3 < trail ? 0.8 : a * 3 < trail * 2 ? 0.5 : 0.3))),
      ...shape(at, cos, sin, length / 2, v, (a, b) => {
        // Too thin to round, it is a sliver one pixel wide.
        if (thick < 2) return Math.abs(2 * a) > length || Math.abs(2 * b) > 1 ? null : VISITOR_LIT;
        const [along, across] = [2 * a / length, 2 * b / thick];
        return along * along + across * across > 1 ? null : thick >= 3 && across > 0.15 ? VISITOR : VISITOR_LIT;
      }),
    ];
  }
  const wake = Math.round(11 * v.cam.z);
  const length = Math.max(2, Math.round(10 * v.cam.z));
  const [cos, sin] = cosSin(visitor.ang + v.time * 0.35);
  return [
    ...run(at.x, at.y, -world.cos, -world.sin, 1, wake, (part) => scaled(TRAIL, part < 0.5 ? 0.5 : 0.25)),
    ...run(at.x, at.y, cos, sin, -(length >> 1), length, () => VISITOR),
  ];
}

/** The beams of a pulsar or a magnetar at the heart of a system turn: four frames to the half turn. */
export function turnBeams(items: readonly SpaceItem[], v: PassView): SpaceItem[] {
  return items.map((item) => item.kind === 'element' && (item.name === 'primary/ns' || item.name === 'primary/mag')
    ? { ...item, name: framed(item.name, frameOf(v.time * 3, PI, 4)) } : item);
}

/** The captions of a system map's passes: the habitable zone with the charts, each comet by its name, and the
 *  visitor, the last two once the view is near enough. In world units, where the game anchors them: the names of a
 *  comet and of the visitor stand on their point, two and four units above the thing. */
export function systemCaptions(v: PassView): { text: string; wx: number; wy: number; stand?: number }[] {
  if (v.nav.mode !== 'system') return [];
  const seed = v.nav.star.seed;
  const raw = rawOf(seed);
  const captions: { text: string; wx: number; wy: number; stand?: number }[] = [];
  const hz = systemScene(seed).hz as [number, number] | null;
  if (v.charts && hz !== null) captions.push({ text: 'habitable zone', wx: 0, wy: -(hz[0] + hz[1]) / 2 });
  const minSide = minSideOf(v.view);
  if (v.zoom > minSide / 520) {
    (raw.comets ?? []).forEach((comet, i) => {
      const at = cometAt(comet, v.small ?? v.time);
      captions.push({ text: `Comet ${properName(hashInt(seed, 31 + i, 17), 2)}`, wx: at.x, wy: at.y - 2, stand: 2 });
    });
  }
  if (raw.visitor !== undefined && v.zoom > minSide / 650) {
    const at = visitorAt(raw.visitor, v.small ?? v.time);
    captions.push({ text: 'interstellar object', wx: at.x, wy: at.y - 4, stand: 4 });
  }
  return captions;
}
