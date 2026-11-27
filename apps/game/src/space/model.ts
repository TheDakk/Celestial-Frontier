import { GR, galaxyCellWindow, galaxyFineCell, provenGalaxyCell, systemScene, universeGalaxies } from '@cf/scene';
import type { DecoNode, GalaxyNode, NavState, PlanetNode, ProvenGalaxy, StarNode } from '@cf/scene';
import { galaxyName, starName } from '@cf/domain-naming';
import { SOL_SEED } from '@cf/domain-worldconfig';
import { FCELL, galaxyProfile, galaxyWormhole, supernovaSites } from '@cf/domain-worldgen';
import type { SupernovaBirth, SupernovaSite } from '@cf/domain-worldgen';
import { entryZoom, minSideOf, toScreen } from './camera';
import type { Camera, Viewport } from './camera';

interface BodyBase { key: string; label: string; priority: number; wx: number; wy: number }
/** One thing on a map that can be selected. `ref` is the scene package's own node for it. */
export type MapBody = BodyBase & (
  | { kind: 'galaxy'; ref: GalaxyNode }
  | { kind: 'star'; ref: StarNode }
  | { kind: 'planet'; ref: PlanetNode }
  | { kind: 'deco'; ref: DecoNode }
  | { kind: 'worm'; ref: { x: number; y: number } }
  | { kind: 'snova'; ref: SupernovaSite }
  | { kind: 'protostar'; ref: SupernovaBirth }
  // The star and the small bodies of a system (small-bodies.ts). `ref` is what the legacy game hands the card of each.
  | { kind: 'starsys'; ref: { seed: number; sys: Record<string, unknown> & { starR?: number } } }
  | { kind: 'moon'; ref: { pl: PlanetNode; m: number } }
  | { kind: 'dwarf'; ref: { dw: Record<string, unknown>; sys: Record<string, unknown> } }
  | { kind: 'comet'; ref: { cm: Record<string, unknown>; ci: number } }
  | { kind: 'visitor'; ref: { v: Record<string, unknown> } });

/** What a zoom asks for: enter the body under the view, leave the map, or hold the zoom at `z`. */
export type DiveIntent = { kind: 'none' } | { kind: 'dive'; body: MapBody } | { kind: 'ascend' } | { kind: 'park'; z: number };

const UNIVERSE_CELLS = 3;
const SCREEN_EDGE = 12;
const EARTH_SEED = 133;
const GALAXY_FILL = 0.55;
const GALAXY_NEAR = 0.4;
const STAR_NEAR = 130;
const ASCEND_BELOW = 0.62;
const PARK = 0.97;
const starTrigger = (minSide: number): number => minSide / 34;

/** What each kind of galaxy scenery is called. Star knots (`open`, `glob`) are scenery only and are not listed. */
const DECO_LABELS: Readonly<Record<string, string>> = {
  h2: 'emission nebula', neb: 'nebula', mol: 'molecular cloud', plan: 'planetary nebula', rem: 'supernova remnant',
  rogue: 'rogue planet', fbd: 'failed brown dwarf',
};
/** Bodies that are neither galaxy, star nor planet come after those in the keyboard order. */
export const SCENERY_PRIORITY = 3;

const HALF_PI = 1.5707963267948966;
/** Cosine and sine by add, multiply, divide and round alone, which give the same bits on every device. */
export function cosSin(angle: number): readonly [number, number] {
  const quarter = Math.round(angle / HALF_PI);
  const r = angle - quarter * HALF_PI;
  const r2 = r * r;
  const sin = r * (1 - r2 / 6 * (1 - r2 / 20 * (1 - r2 / 42 * (1 - r2 / 72 * (1 - r2 / 110 * (1 - r2 / 156 * (1 - r2 / 210)))))));
  const cos = 1 - r2 / 2 * (1 - r2 / 12 * (1 - r2 / 30 * (1 - r2 / 56 * (1 - r2 / 90 * (1 - r2 / 132 * (1 - r2 / 182))))));
  const turn = ((quarter % 4) + 4) % 4;
  return turn === 0 ? [cos, sin] : turn === 1 ? [-sin, cos] : turn === 2 ? [-cos, -sin] : [sin, -cos];
}

/** How moon `m` of a planet stands about it at a time: its orbit in the planet's radii, and the turn it has made
 *  (celestial-frontier.html 7758 to 7761). Its place is the orbit times the cosine across, and 0.4 of the sine down. */
export function moonTurn(m: number, time: number): { orbit: number; cos: number; sin: number } {
  const orbit = 1.7 + m * 0.48;
  const [cos, sin] = cosSin(time * (0.55 / (orbit * Math.sqrt(orbit))) + m * 2.4);
  return { orbit, cos, sin };
}

let coarse: { galaxy: ProvenGalaxy; stars: readonly StarNode[]; deco: readonly DecoNode[] } | null = null;
/** Every coarse star and every piece of scenery of a galaxy, out to 1.2 of its radius. Kept for the galaxy last
 *  asked about. */
export function galaxyContent(galaxy: ProvenGalaxy): { stars: readonly StarNode[]; deco: readonly DecoNode[] } {
  if (coarse?.galaxy === galaxy) return coarse;
  const prof = galaxyProfile(galaxy.seed) as Record<string, unknown>;
  const w = galaxyCellWindow(-GR * 1.2, -GR * 1.2, GR * 1.2, GR * 1.2);
  const stars: StarNode[] = [];
  const deco: DecoNode[] = [];
  for (let cx = w.cx0; cx <= w.cx1; cx++) for (let cy = w.cy0; cy <= w.cy1; cy++) {
    const cell = provenGalaxyCell(galaxy, prof, cx, cy);
    stars.push(...cell.stars);
    deco.push(...cell.deco);
  }
  coarse = { galaxy, stars, deco };
  return coarse;
}

/** The fine stars under the view, which resolve once the zoom passes 1/260 of the shorter side. */
function fineStars(galaxy: ProvenGalaxy, cam: Camera, view: Viewport): StarNode[] {
  if (!(cam.z > minSideOf(view) / 260)) return [];
  const prof = galaxyProfile(galaxy.seed) as Record<string, unknown>;
  const fx0 = Math.max(Math.floor((cam.x - view.w / 2 / cam.z) / FCELL), Math.floor(-GR / FCELL) - 1);
  const fy0 = Math.max(Math.floor((cam.y - view.h / 2 / cam.z) / FCELL), Math.floor(-GR / FCELL) - 1);
  const fx1 = Math.min(Math.floor((cam.x + view.w / 2 / cam.z) / FCELL), Math.floor(GR / FCELL) + 1);
  const fy1 = Math.min(Math.floor((cam.y + view.h / 2 / cam.z) / FCELL), Math.floor(GR / FCELL) + 1);
  const stars: StarNode[] = [];
  for (let fx = fx0; fx <= fx1; fx++) for (let fy = fy0; fy <= fy1; fy++) stars.push(...galaxyFineCell(galaxy, prof, fx, fy));
  return stars;
}

/** Whether a world point is on the screen, clear of its 12 px edge. */
export function onScreen(cam: Camera, viewport: Viewport, wx: number, wy: number): boolean {
  const at = toScreen(cam, viewport, wx, wy);
  return at.x >= SCREEN_EDGE && at.y >= SCREEN_EDGE && at.x <= viewport.w - SCREEN_EDGE && at.y <= viewport.h - SCREEN_EDGE;
}

/** Every selectable body of the map `nav` is on, on the screen or off it: what a press is tested against, as the
 *  legacy game tests a press against every pick it made (celestial-frontier.html 5604). `time` is the seconds the
 *  orbits have run. */
export function everyBody(nav: NavState, cam: Camera, view: Viewport, time: number): MapBody[] {
  if (nav.mode === 'universe') {
    return universeGalaxies(cam.x, cam.y, UNIVERSE_CELLS).map((g) => ({
      kind: 'galaxy', key: `galaxy:${g.seed}:${g.x}:${g.y}`, label: g.home ? 'Milky Way — you are here' : galaxyName(g.seed),
      priority: g.home ? 0 : 1, wx: g.x, wy: g.y, ref: g,
    }));
  }
  if (nav.mode === 'galaxy') {
    const bodies: MapBody[] = [];
    const seen = new Set<string>();
    const content = galaxyContent(nav.gal);
    for (const [tier, stars] of [[1, content.stars], [2, fineStars(nav.gal, cam, view)]] as const) {
      for (const star of stars) {
        const key = `star:${star.seed}:${star.x}:${star.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const sun = star.seed === SOL_SEED;
        bodies.push({ kind: 'star', key, label: sun ? 'Sun — our star' : starName(star.seed), priority: sun ? 0 : tier, wx: star.x, wy: star.y, ref: star });
      }
    }
    for (const deco of content.deco) {
      const label = DECO_LABELS[deco.k];
      if (label === undefined) continue;
      bodies.push({ kind: 'deco', key: `deco:${deco.k}:${deco.x}:${deco.y}`, label, priority: SCENERY_PRIORITY, wx: deco.x, wy: deco.y, ref: deco });
    }
    const worm = galaxyWormhole(nav.gal.seed) as { x: number; y: number } | null;
    if (worm) bodies.push({ kind: 'worm', key: `worm:${nav.gal.seed}`, label: 'wormhole', priority: SCENERY_PRIORITY, wx: worm.x, wy: worm.y, ref: worm });
    return bodies;
  }
  if (nav.mode === 'system') {
    const star = nav.star.seed;
    return systemScene(star).planets.map((p) => {
      const [cos, sin] = cosSin(p.orb * 0.13 + time * 0.05 / (p.orb * 0.012));
      return { kind: 'planet', key: `planet:${star}:${p.seed}:${p.ordinal}`, label: p.name, priority: p.seed === EARTH_SEED ? 0 : 1,
        wx: cos * p.orb, wy: sin * p.orb, ref: p };
    });
  }
  return [];
}

/** The selectable bodies of the map `nav` is on, in the scene's own order: galaxies of the cells around the
 *  camera, the stars of the galaxy, or the planets of the system by orbit. Only bodies on the screen, clear of
 *  its 12 px edge, are listed; when none is, all of them are. `time` is the seconds the orbits have run
 *  (0 holds every planet at its starting angle). */
export function visibleBodies(nav: NavState, cam: Camera, viewport: Viewport, time: number): MapBody[] {
  const all = everyBody(nav, cam, viewport, time);
  const visible = all.filter((b) => onScreen(cam, viewport, b.wx, b.wy));
  return visible.length > 0 ? visible : all;
}

/** The supernova sites of the galaxy `nav` is in, and the protostars born of each, as they stand at an ecology
 *  epoch. They are the only bodies that move with the epoch, so they are asked for apart from the rest. */
export function supernovaBodies(nav: NavState, epoch: number): MapBody[] {
  if (nav.mode !== 'galaxy') return [];
  const bodies: MapBody[] = [];
  for (const site of supernovaSites(nav.gal.seed, epoch)) {
    bodies.push({ kind: 'snova', key: `snova:${site.seed}`, label: 'supernova aftermath', priority: SCENERY_PRIORITY, wx: site.x, wy: site.y, ref: site });
    for (const birth of site.births) {
      bodies.push({ kind: 'protostar', key: `protostar:${birth.seed}`, label: 'protostar', priority: SCENERY_PRIORITY, wx: birth.x, wy: birth.y, ref: birth });
    }
  }
  return bodies;
}

/** The order the keyboard steps through bodies: priority, then top to bottom, then left to right, then key. */
export function keyboardOrder(bodies: readonly MapBody[]): MapBody[] {
  return [...bodies].sort((a, b) => a.priority - b.priority || a.wy - b.wy || a.wx - b.wx || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

function nearest(bodies: readonly MapBody[], kind: MapBody['kind'], cam: Camera): { body: MapBody; distance: number } | null {
  let best: MapBody | null = null;
  let least = Infinity;
  for (const b of bodies) {
    if (b.kind !== kind) continue;
    const d = (b.wx - cam.x) * (b.wx - cam.x) + (b.wy - cam.y) * (b.wy - cam.y);
    if (d < least) { least = d; best = b; }
  }
  return best === null ? null : { body: best, distance: Math.sqrt(least) };
}

/** What the zoom of `cam` (the camera's destination, not its eased position) asks for. Zooming into the body
 *  nearest the centre of the view dives into it; zooming out of a galaxy or a system leaves it; zooming into
 *  a galaxy with no star near the centre holds the zoom. `bodies` are the map's bodies for the same camera. */
export function diveIntent(nav: NavState, cam: Camera, bodies: readonly MapBody[], minSide: number): DiveIntent {
  if (nav.mode === 'universe') {
    const hit = nearest(bodies, 'galaxy', cam);
    if (hit !== null && hit.body.kind === 'galaxy' && hit.body.ref.size * cam.z > GALAXY_FILL * minSide
      && hit.distance * cam.z < GALAXY_NEAR * minSide) return { kind: 'dive', body: hit.body };
    return { kind: 'none' };
  }
  if (nav.mode === 'galaxy') {
    if (cam.z < entryZoom('galaxy', minSide) * ASCEND_BELOW) return { kind: 'ascend' };
    const trigger = starTrigger(minSide);
    if (!(cam.z > trigger)) return { kind: 'none' };
    const hit = nearest(bodies, 'star', cam);
    if (hit !== null && hit.distance * cam.z < STAR_NEAR) return { kind: 'dive', body: hit.body };
    return cam.z > trigger * 1.6 ? { kind: 'park', z: trigger * 1.6 } : { kind: 'none' };
  }
  if (nav.mode === 'system' && cam.z < entryZoom('system', minSide) * ASCEND_BELOW) return { kind: 'ascend' };
  return { kind: 'none' };
}

/** The zoom to fall back to when a dive into `body` is refused: just below the zoom that would dive again. */
export function parkBelowTrigger(body: Extract<MapBody, { kind: 'galaxy' | 'star' }>, minSide: number): number {
  if (body.kind === 'galaxy') return (GALAXY_FILL * minSide / Math.max(body.ref.size, 8)) * PARK;
  return starTrigger(minSide) * PARK;
}
