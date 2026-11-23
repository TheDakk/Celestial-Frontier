/* The universe map's passes besides its galaxies: the cosmic web, the bridges between colliding galaxies, the veil and
   the fog beyond the charter, the edge of the observable universe, and how galaxies turn and blazars pulse. */
import type { SpaceItem } from '@cf/art-interface';
import { HOME_POS, OBS_R, UCELL } from '@cf/domain-worldconfig';
import { UNOISE, galaxiesInCell } from '@cf/domain-worldgen';
import { universeGalaxies } from '@cf/scene';
import type { GalaxyNode } from '@cf/scene';
import type { Viewport } from './camera';
import { place, scaled, tone } from './draw';
import type { PassView } from './draw';
import { angleOf } from './exact';
import { cosSin } from './model';

const noise = UNOISE as (x: number, y: number, octaves: number) => number;
const TAU = 6.283185307179586;
/** The cells about the camera's cell that the universe map draws. */
const CELLS = 3;

const WEB = 0xc4baf5;
const BRIDGE = 0xd2dcfa;
const DARK = 0x05070f;
const FOG = 0x060814;
const EDGE = 0xffaa46;
/** A soft round light or shadow, as rings from the outside in: the share of its radius and of its strength. */
const WEB_RINGS = [[0.9, 0.13], [0.6, 0.4], [0.3, 0.72]] as const;
const FOG_RINGS = [[0.9, 0.08], [0.6, 0.27], [0.3, 0.5]] as const;
/** The game's largest count of fog banks: when they drift, and when they stand still. */
const FOG_DRIFTING = 24;
const FOG_STILL = 10;

/** The zoom above which the cosmic web shows; the charter shows from 0.7 of it. */
export function webZoom(view: Viewport): number {
  return Math.sqrt((view.w * view.h) / (UCELL * UCELL * 3600));
}
const cellOf = (v: PassView): { ux: number; uy: number } => ({ ux: Math.floor(v.cam.x / UCELL), uy: Math.floor(v.cam.y / UCELL) });

/** The glow of the cosmic web: a soft light over every cell dense with galaxies. */
export function webItems(v: PassView): SpaceItem[] {
  if (!(v.zoom > webZoom(v.view))) return [];
  const { ux, uy } = cellOf(v);
  const items: SpaceItem[] = [];
  for (let cx = ux - CELLS; cx <= ux + CELLS; cx++) for (let cy = uy - CELLS; cy <= uy + CELLS; cy++) {
    const web = galaxiesInCell(cx, cy).web;
    if (!(web > 0.5)) continue;
    const at = place(v.cam, v.grid, (cx + 0.5) * UCELL, (cy + 0.5) * UCELL);
    for (const [part, share] of WEB_RINGS) {
      const light = tone(WEB, (web - 0.5) * 0.17 * share);
      if (light.level > 0) items.push({ kind: 'veil', ...at, r: Math.round(UCELL * 0.95 * part * v.cam.z), ...light, light: true });
    }
  }
  return items;
}

/** The captions of the far zoom: a few of the densest cells and of the emptiest, by the game's own picks. */
export function webCaptions(v: PassView): { text: string; wx: number; wy: number }[] {
  if (!(v.zoom > webZoom(v.view) && v.zoom < 0.5)) return [];
  const { ux, uy } = cellOf(v);
  const captions: { text: string; wx: number; wy: number }[] = [];
  for (let cx = ux - CELLS; cx <= ux + CELLS; cx++) for (let cy = uy - CELLS; cy <= uy + CELLS; cy++) {
    const web = galaxiesInCell(cx, cy).web;
    const text = web > 0.86 && (cx * 7 + cy * 13) % 29 === 0 ? 'galaxy cluster' : web < 0.05 && (cx * 5 + cy * 3) % 23 === 0 ? 'cosmic void' : null;
    if (text !== null) captions.push({ text, wx: (cx + 0.5) * UCELL, wy: (cy + 0.5) * UCELL });
  }
  return captions;
}

/** The stars torn between two colliding galaxies: a curved line from one to the other, as wide as the game draws it.
 *  Drawn once the galaxy is near enough to be more than a dot. */
export function bridgeItems(v: PassView): SpaceItem[] {
  const items: SpaceItem[] = [];
  const light = tone(BRIDGE, 0.2);
  for (const g of universeGalaxies(v.cam.x, v.cam.y, CELLS)) {
    if (g.bridge === null || g.quasar || g.size * v.cam.z < 3) continue;
    const { x2, y2 } = g.bridge;
    const bend = { x: (g.x + x2) / 2 + g.size * 0.4, y: (g.y + y2) / 2 - g.size * 0.4 };
    const span = Math.sqrt((bend.x - g.x) * (bend.x - g.x) + (bend.y - g.y) * (bend.y - g.y)) + Math.sqrt((x2 - bend.x) * (x2 - bend.x) + (y2 - bend.y) * (y2 - bend.y));
    const steps = Math.min(8192, Math.max(1, Math.ceil(2 * span * v.cam.z)));
    const r = Math.round(g.size * 0.14 * v.cam.z) >> 1;
    let last: { x: number; y: number } | null = null;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const at = place(v.cam, v.grid, (1 - t) * (1 - t) * g.x + 2 * (1 - t) * t * bend.x + t * t * x2, (1 - t) * (1 - t) * g.y + 2 * (1 - t) * t * bend.y + t * t * y2);
      if (last !== null && last.x === at.x && last.y === at.y) continue;
      last = at;
      if (at.x < -r || at.y < -r || at.x >= v.grid.w + r || at.y >= v.grid.h + r) continue;
      items.push(r < 1 ? { kind: 'dot', ...at, colour: light.colour } : { kind: 'veil', ...at, r, ...light, light: true });
    }
  }
  return items;
}

interface FogBank { wx: number; wy: number; ramp: number; alpha: number }
const fogStrength = (wx: number, wy: number): number => Math.min(Math.max((noise(wx / UCELL * 0.16, wy / UCELL * 0.16, 3) - 0.32) * 1.1, 0), 0.7);

/** The game's pick of at most `limit` fog banks: the nearest to the camera in each direction first, then the nearest
 *  of the rest. */
function pickFog(banks: readonly FogBank[], limit: number, fx: number, fy: number): FogBank[] {
  const far = (b: FogBank): number => (b.wx - fx) * (b.wx - fx) + (b.wy - fy) * (b.wy - fy);
  const order = (a: FogBank, b: FogBank): number => far(a) - far(b) || b.alpha - a.alpha || a.wx - b.wx || a.wy - b.wy;
  const sorted = [...banks].sort(order);
  if (sorted.length <= limit) return sorted;
  const sectors: (FogBank | undefined)[] = Array.from({ length: limit }, () => undefined);
  for (const bank of sorted) {
    const angle = (angleOf(bank.wy - fy, bank.wx - fx) + TAU) % TAU;
    const sector = Math.min(limit - 1, Math.floor(angle / TAU * limit));
    sectors[sector] ??= bank;
  }
  const picked = sectors.filter((bank): bank is FogBank => bank !== undefined);
  for (const bank of sorted) {
    if (picked.length >= limit) break;
    if (!picked.includes(bank)) picked.push(bank);
  }
  return picked;
}

/** The fog beyond the charter: dark banks where the game's noise is thick, thicker the farther out. They drift with
 *  time; with motion reduced they stand still and are fewer; with effects off there are none. */
export function fogItems(v: PassView): SpaceItem[] {
  if (!v.effects) return [];
  const { ux, uy } = cellOf(v);
  const size = UCELL * 1.5;
  const banks: FogBank[] = [];
  for (let fx = ux * 2 - CELLS * 2; fx <= ux * 2 + CELLS * 2; fx++) for (let fy = uy * 2 - CELLS * 2; fy <= uy * 2 + CELLS * 2; fy++) {
    const wx = (fx + 0.5) * size;
    const wy = (fy + 0.5) * size;
    const out = Math.sqrt((wx - HOME_POS.x) * (wx - HOME_POS.x) + (wy - HOME_POS.y) * (wy - HOME_POS.y));
    if (out < v.reach * 1.04) continue;
    const ramp = Math.min(Math.max((out - v.reach) / (v.reach * 0.55), 0), 1);
    const alpha = fogStrength(wx, wy) * ramp;
    if (alpha > 0.03) banks.push({ wx, wy, ramp, alpha });
  }
  const drift = v.time * 5;
  const items: SpaceItem[] = [];
  for (const bank of pickFog(banks, v.motion ? FOG_DRIFTING : FOG_STILL, v.cam.x, v.cam.y)) {
    // The banks stay put; the pattern of the noise drifts through them.
    const alpha = v.motion ? fogStrength(bank.wx + drift, bank.wy - drift * 0.4) * bank.ramp : bank.alpha;
    const at = place(v.cam, v.grid, bank.wx, bank.wy);
    for (const [part, share] of FOG_RINGS) {
      const level = Math.round(16 * alpha * share);
      if (level > 0) items.push({ kind: 'veil', ...at, r: Math.round(size * 0.95 * part * v.cam.z), colour: FOG, level });
    }
  }
  return items;
}

/** True when the charter (its ring, its veil and the fog) shows at this zoom. */
export function charterShown(v: PassView): boolean {
  return v.zoom > webZoom(v.view) * 0.7;
}

/** The veil over what lies beyond the charter: a dark dither out to twice its radius, deeper in the outer half. */
export function veilItems(v: PassView): SpaceItem[] {
  const at = place(v.cam, v.grid, HOME_POS.x, HOME_POS.y);
  const [edge, middle, outer] = [1, 1.5, 2].map((k) => Math.round(v.reach * k * v.cam.z)) as [number, number, number];
  return [
    { kind: 'veil', ...at, r: middle, inner: edge, colour: DARK, level: 2 },
    { kind: 'veil', ...at, r: outer, inner: middle, colour: DARK, level: 4 },
  ];
}

/** The edge of the observable universe: an orange ring about the origin, in a faint band 3 parts in 100 wide to
 *  either side. */
export function edgeItems(v: PassView): SpaceItem[] {
  const at = place(v.cam, v.grid, 0, 0);
  const r = Math.round(OBS_R * v.cam.z);
  const half = Math.round(OBS_R * 0.03 * v.cam.z);
  const ring: SpaceItem = { kind: 'ring', ...at, r, colour: scaled(EDGE, 0.5) };
  return half < 1 ? [ring] : [{ kind: 'veil', ...at, r: r + half, inner: r - half - 1, ...tone(EDGE, 0.22), light: true }, ring];
}

const QUARTER = TAU / 4;
/** A galaxy as time moves it: it turns a quarter at a time, as slowly as the game turns it (radio galaxies and quasars
 *  do not turn), and a blazar dims in the low part of its pulse. */
export function turnGalaxy(g: GalaxyNode, items: readonly SpaceItem[], v: PassView): SpaceItem[] {
  return items.map((item) => {
    if (item.kind !== 'element') return item;
    if (item.name === 'quasar') {
      const low = g.blazar && v.effects && v.motion && Math.abs(cosSin(v.time * 6 + g.seed % 10)[1]) < 0.5;
      return low ? { ...item, name: 'quasar/dim' } : item;
    }
    if (!item.name.startsWith('galaxy/') || g.radio) return item;
    const turns = Math.floor((g.rot + v.time * 0.0012) / QUARTER) - Math.floor(g.rot / QUARTER);
    return { ...item, name: item.name.replace(/\d$/, (variant) => `${(Number(variant) + turns) % 4}`) };
  });
}
