/* The small bodies of a system that a press can select, as in the legacy game (celestial-frontier.html): each moon
   (7779), each dwarf planet (7806), the interstellar visitor (7825) and each comet (7842), where the picture has them;
   and the three rings a press on empty space can meet: the asteroid belt (7620), the outer belt (7640) and the comet
   shell (7650). Moons, comets and the visitor move by the running clock; dwarf planets, like planets, by the orbits'. */
import { systemScene } from '@cf/scene';
import type { NavState } from '@cf/scene';
import { SYS_R } from '@cf/domain-worldconfig';
import { systemFor } from '@cf/domain-worldgen';
import { toScreen } from './camera';
import type { Camera, Viewport } from './camera';
import { SCENERY_PRIORITY, cosSin, moonTurn, onScreen } from './model';
import type { MapBody } from './model';
import { cometAt, visitorAt } from './passes-system';
import type { Comet, Visitor } from './passes-system';
import { planetRadius } from './sizes';

type Raw = Record<string, unknown>;
interface RawSystem { dwarfs?: readonly (Raw & { orb: number; name?: string })[]; comets?: readonly Comet[]; visitor?: Visitor; belt?: { r: number } | null; kuiper?: { r: number } | null }

/** The small bodies of the system `nav` is on that are on the screen, clear of its edge: none on any other map.
 *  `time` is the seconds the map's clock has run and `orbit` the seconds the orbits have. */
export function smallBodies(nav: NavState, cam: Camera, viewport: Viewport, time: number, orbit: number): MapBody[] {
  if (nav.mode !== 'system') return [];
  const star = nav.star.seed;
  const raw = systemFor(star) as RawSystem;
  const turned = (t: number, orb: number): { wx: number; wy: number } => {
    const [cos, sin] = cosSin(orb * 0.13 + t * 0.05 / (orb * 0.012));
    return { wx: cos * orb, wy: sin * orb };
  };
  const bodies: MapBody[] = [];
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
  return bodies.filter((b) => onScreen(cam, viewport, b.wx, b.wy));
}

/** A ring about a system's star that a press can meet. `data` is what the legacy game hands its card. */
export interface MapRing { kind: 'belt' | 'kuiper' | 'oort'; data: Raw }

/** The ring of the system a press at (x, y) meets, in screen pixels: the one whose line is nearest, when the press is
 *  within its band of it: 6 world units each side for a belt and 5 for the comet shell, and never under 10 pixels. The
 *  map asks only when no body is under the press, as a ring never outbids one in the legacy game (5606). */
export function ringUnder(nav: NavState, cam: Camera, viewport: Viewport, x: number, y: number): MapRing | null {
  if (nav.mode !== 'system') return null;
  const raw = systemFor(nav.star.seed) as RawSystem;
  const sys = raw as Raw;
  const rings: (readonly [MapRing, radius: number, band: number])[] = [];
  if (raw.belt) rings.push([{ kind: 'belt', data: { sys } }, raw.belt.r, 6]);
  if (raw.kuiper) rings.push([{ kind: 'kuiper', data: { sys } }, raw.kuiper.r, 6]);
  rings.push([{ kind: 'oort', data: {} }, SYS_R - 3, 5]);
  const centre = toScreen(cam, viewport, 0, 0);
  const from = Math.sqrt((centre.x - x) * (centre.x - x) + (centre.y - y) * (centre.y - y));
  let best: MapRing | null = null;
  let least = Infinity;
  for (const [ring, radius, band] of rings) {
    const off = Math.abs(from - radius * cam.z);
    if (off < Math.max(band * cam.z, 10) && off < least) { least = off; best = ring; }
  }
  return best;
}
