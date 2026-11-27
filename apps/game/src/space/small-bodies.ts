/* What a press can select on a system's map besides its planets, as in the legacy game (celestial-frontier.html):
   the star itself (7527), each moon (7779), each dwarf planet (7806), the interstellar visitor (7825) and each comet (7842), where the picture has them;
   and the three rings a press on empty space can meet: the asteroid belt (7620), the outer belt (7640) and the comet
   shell (7650). Moons, comets and the visitor move by the running clock; dwarf planets, like planets, by the orbits'. */
import { systemScene } from '@cf/scene';
import type { NavState } from '@cf/scene';
import { OBS_R, SYS_R } from '@cf/domain-worldconfig';
import { systemFor } from '@cf/domain-worldgen';
import { toScreen } from './camera';
import type { Camera, Viewport } from './camera';
import { SCENERY_PRIORITY, cosSin, moonTurn } from './model';
import type { MapBody } from './model';
import { cometAt, visitorAt } from './passes-system';
import type { Comet, Visitor } from './passes-system';
import { planetRadius } from './sizes';

type Raw = Record<string, unknown>;
interface RawSystem { dwarfs?: readonly (Raw & { orb: number; name?: string })[]; comets?: readonly Comet[]; visitor?: Visitor; belt?: { r: number } | null; kuiper?: { r: number } | null }

/** The star and the small bodies of the system `nav` is on, wherever they stand (the legacy game makes a pick of each
 *  on the screen or off it): none on any other map. `time` is the seconds the map's clock has run and `orbit` the
 *  seconds the orbits have. */
export function smallBodies(nav: NavState, time: number, orbit: number): MapBody[] {
  if (nav.mode !== 'system') return [];
  const star = nav.star.seed;
  const raw = systemFor(star) as RawSystem;
  const turned = (t: number, orb: number): { wx: number; wy: number } => {
    const [cos, sin] = cosSin(orb * 0.13 + t * 0.05 / (orb * 0.012));
    return { wx: cos * orb, wy: sin * orb };
  };
  const bodies: MapBody[] = [{ kind: 'starsys', key: `starsys:${star}`, label: 'star', priority: SCENERY_PRIORITY, wx: 0, wy: 0, ref: { seed: star, sys: raw as Raw } }];
  for (const pl of systemScene(star).planets) {
    const at = turned(orbit, pl.orb);
    const reach = planetRadius(pl.P);
    for (let m = 0; m < pl.moons; m++) {
      const turn = moonTurn(m, time);
      bodies.push({ kind: 'moon', key: `moon:${star}:${pl.seed}:${pl.ordinal}:${m}`, label: 'moon', priority: SCENERY_PRIORITY,
        wx: at.wx + turn.cos * reach * turn.orbit, wy: at.wy + turn.sin * reach * turn.orbit * 0.4, ref: { pl, m } });
    }
  }
  (raw.dwarfs ?? []).forEach((dw, i) => {
    bodies.push({ kind: 'dwarf', key: `dwarf:${star}:${i}`, label: dw.name ?? 'dwarf planet', priority: SCENERY_PRIORITY, ...turned(orbit, dw.orb), ref: { dw, sys: raw as Raw } });
  });
  if (raw.visitor !== undefined) {
    const at = visitorAt(raw.visitor, time);
    bodies.push({ kind: 'visitor', key: `visitor:${star}`, label: 'interstellar object', priority: SCENERY_PRIORITY, wx: at.x, wy: at.y, ref: { v: raw.visitor as unknown as Raw } });
  }
  (raw.comets ?? []).forEach((cm, ci) => {
    const at = cometAt(cm, time);
    bodies.push({ kind: 'comet', key: `comet:${star}:${ci}`, label: 'comet', priority: SCENERY_PRIORITY, wx: at.x, wy: at.y, ref: { cm: cm as unknown as Raw, ci } });
  });
  return bodies;
}

/** The bodies of a system's map in the order the legacy game makes its picks of them (celestial-frontier.html): the
 *  star (7527); each planet in the system's own order, followed by its moons (7665, 7673, 7780); the dwarf planets
 *  (7806); the visitor (7825); the comets (7842). Of two bodies exactly as near a press, the legacy game selects the
 *  one whose pick it made first (5607), so the press is tested in this order. Bodies of other maps keep their order. */
export function inPressOrder(bodies: readonly MapBody[]): MapBody[] {
  const rank = (body: MapBody): readonly [number, number, number] => {
    switch (body.kind) {
      case 'starsys': return [0, 0, 0];
      case 'planet': return [1, body.ref.ordinal, 0];
      case 'moon': return [1, body.ref.pl.ordinal, 1 + body.ref.m];
      case 'dwarf': return [2, 0, 0];
      case 'visitor': return [3, 0, 0];
      case 'comet': return [4, body.ref.ci, 0];
      default: return [5, 0, 0];
    }
  };
  // The sort keeps the given order of equals, so dwarf planets stay in the system's own order.
  return bodies.map((body) => ({ body, rank: rank(body) }))
    .sort((a, b) => a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1] || a.rank[2] - b.rank[2]).map(({ body }) => body);
}

/** A ring a press can meet: three about a system's star, and on the universe's map the edge of the observable
 *  universe. `data` is what the legacy game hands its card. */
export interface MapRing { kind: 'belt' | 'kuiper' | 'oort' | 'cmb'; data: Raw }

/** The ring a press at (x, y) meets, in screen pixels: the one whose line is nearest, when the press is within its
 *  band of it. A system: 6 world units each side for a belt and 5 for the comet shell, and never under 10 pixels. The
 *  universe: 30 world units each side of the edge of the observable universe, and never under 16 pixels (6073). The
 *  map asks only when no body is under the press, as a ring never outbids one in the legacy game (5606). */
export function ringUnder(nav: NavState, cam: Camera, viewport: Viewport, x: number, y: number): MapRing | null {
  const rings: (readonly [MapRing, radius: number, band: number, least: number])[] = [];
  if (nav.mode === 'universe') rings.push([{ kind: 'cmb', data: {} }, OBS_R, 30, 16]);
  else if (nav.mode === 'system') {
    const raw = systemFor(nav.star.seed) as RawSystem;
    const sys = raw as Raw;
    if (raw.belt) rings.push([{ kind: 'belt', data: { sys } }, raw.belt.r, 6, 10]);
    if (raw.kuiper) rings.push([{ kind: 'kuiper', data: { sys } }, raw.kuiper.r, 6, 10]);
    rings.push([{ kind: 'oort', data: {} }, SYS_R - 3, 5, 10]);
  } else return null;
  const centre = toScreen(cam, viewport, 0, 0);
  const from = Math.sqrt((centre.x - x) * (centre.x - x) + (centre.y - y) * (centre.y - y));
  let best: MapRing | null = null;
  let least = Infinity;
  for (const [ring, radius, band, floor] of rings) {
    const off = Math.abs(from - radius * cam.z);
    if (off < Math.max(band * cam.z, floor) && off < least) { least = off; best = ring; }
  }
  return best;
}
