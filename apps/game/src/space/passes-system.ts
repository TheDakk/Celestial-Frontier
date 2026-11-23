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
import { frameOf, framed, place, rgbOf, scaled, tone } from './draw';
import type { PassView } from './draw';
import { angleOf } from './exact';
import { cosSin } from './model';

const TAU = 6.283185307179586;
const PI = 3.141592653589793;
const ZONE = 0x50d282;
const NIGHT = 0x00000c;
const CLOUD = 0xfafcff;
const COMA = 0xcfe6ff;
const TAIL = 0xc8e6ff;
const VISITOR = 0x8a6f58;
const TRAIL = 0xd6aa8c;

interface Comet { off: number; period: number; aMaj: number; ecc: number; tilt: number }
interface Visitor { speed: number; off: number; ang: number; b: number }
const rawOf = (seed: number): { comets?: readonly Comet[]; visitor?: Visitor } => systemFor(seed) as { comets?: readonly Comet[]; visitor?: Visitor };

/** The habitable zone: a faint green band between its two radii, shown with the star charts. */
export function zoneItems(v: PassView): SpaceItem[] {
  if (v.nav.mode !== 'system' || !v.charts) return [];
  const hz = systemScene(v.nav.star.seed).hz as [number, number] | null;
  if (hz === null) return [];
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

/**
 * A planet's own passes, painted over its disc and under its moons: the cloud deck of a living or ocean world once it
 * is near (it drifts with time), then night on the side away from the star and, on a planet banded by code, the star's
 * light on the side facing it.
 */
export function dressPlanet(planet: PlanetNode, items: readonly SpaceItem[], v: PassView): SpaceItem[] {
  const discAt = items.findIndex((item) => item.kind === 'disc');
  const disc = items[discAt];
  if (disc === undefined || disc.kind !== 'disc' || disc.r < 3 || v.nav.mode !== 'system') return [...items];
  const { x, y, r } = disc;
  const size = 6 * (typeof planet.P.sizeMul === 'number' && planet.P.sizeMul !== 0 ? planet.P.sizeMul : 1);
  const dress: SpaceItem[] = [];
  if ((planet.type === 'terran' || planet.type === 'ocean') && size * v.zoom > 22) {
    dress.push(...cloudItems(planet, x, y, r, Math.round(((v.time * 1.6) % (size * 2)) * v.cam.z), v));
  }
  const star = place(v.cam, v.grid, 0, 0);
  const far = Math.sqrt((star.x - x) * (star.x - x) + (star.y - y) * (star.y - y));
  if (far > 0) {
    const [ux, uy] = [(star.x - x) / far, (star.y - y) / far];
    const clip = { x, y, r };
    const away = (k: number): { x: number; y: number } => ({ x: Math.round(x - ux * r * k), y: Math.round(y - uy * r * k) });
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
function cometAt(comet: Comet, time: number): { x: number; y: number } {
  const [cos, sin] = cosSin(((time + comet.off) / comet.period) * TAU);
  const ox = comet.aMaj * (cos - comet.ecc);
  const oy = comet.aMaj * Math.sqrt(1 - comet.ecc * comet.ecc) * sin;
  const [tc, ts] = cosSin(comet.tilt);
  return { x: tc * ox - ts * oy, y: ts * ox + tc * oy };
}
/** Where the visitor is at a time: along its straight path through the system, which it enters again when it leaves. */
function visitorAt(visitor: Visitor, time: number): { x: number; y: number; cos: number; sin: number } {
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

/** A comet as the picture has it, in whole art pixels: its head, and each pixel of its tail from the head outward. */
export interface CometDrawn { head: { x: number; y: number }; tail: { x: number; y: number }[] }
/** The comets of a system where they are drawn: the tail is blown straight away from the star, longer the nearer the
 *  star. Words on the map keep off a tail as they keep off a body. */
export function cometsDrawn(v: PassView): CometDrawn[] {
  if (v.nav.mode !== 'system') return [];
  return (rawOf(v.nav.star.seed).comets ?? []).map((comet) => {
    const world = cometAt(comet, v.time);
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
    items.push({ kind: 'veil', ...head, r: coma, colour: COMA, level: 8 }, { kind: 'dot', ...head, colour: 0xffffff });
  }
  return items;
}

/** The interstellar visitor, when the system has one: a tumbling sliver of rock ten world units long, trailing a
 *  short fading wake along its path. */
export function visitorItems(v: PassView): SpaceItem[] {
  if (v.nav.mode !== 'system') return [];
  const visitor = rawOf(v.nav.star.seed).visitor;
  if (visitor === undefined) return [];
  const world = visitorAt(visitor, v.time);
  const at = place(v.cam, v.grid, world.x, world.y);
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
 *  visitor, the last two once the view is near enough. In world units, where the game anchors them. */
export function systemCaptions(v: PassView): { text: string; wx: number; wy: number }[] {
  if (v.nav.mode !== 'system') return [];
  const seed = v.nav.star.seed;
  const raw = rawOf(seed);
  const captions: { text: string; wx: number; wy: number }[] = [];
  const hz = systemScene(seed).hz as [number, number] | null;
  if (v.charts && hz !== null) captions.push({ text: 'habitable zone', wx: 0, wy: -(hz[0] + hz[1]) / 2 });
  const minSide = minSideOf(v.view);
  if (v.zoom > minSide / 520) {
    (raw.comets ?? []).forEach((comet, i) => {
      const at = cometAt(comet, v.time);
      captions.push({ text: `Comet ${properName(hashInt(seed, 31 + i, 17), 2)}`, wx: at.x, wy: at.y - 2 });
    });
  }
  if (raw.visitor !== undefined && v.zoom > minSide / 650) {
    const at = visitorAt(raw.visitor, v.time);
    captions.push({ text: 'interstellar object', wx: at.x, wy: at.y - 4 });
  }
  return captions;
}
