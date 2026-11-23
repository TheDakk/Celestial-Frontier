/* The words the game letters on its maps, each with the game's own gate: the names of galaxies as the view closes
   in, what a quasar and a radio galaxy are, the home galaxy and the charter, the Sun, the planets and the belt. */
import { galaxyName } from '@cf/domain-naming';
import { HOME_POS } from '@cf/domain-worldconfig';
import { systemScene } from '@cf/scene';
import { minSideOf, toScreen } from './camera';
import { galaxyContent, visibleBodies } from './model';
import { webZoom } from './passes-universe';
import { mapCaptions } from './project';
import type { MapFrame } from './project';

/** Words lettered on a map at a world point: centred on it, standing on it (`above`, lifted `lift` screen pixels
 *  more) or hanging from it (`below`). */
export interface Label { text: string; wx: number; wy: number; hold: 'centre' | 'above' | 'below'; lift?: number }

/** A galaxy is named once it is this many screen pixels in size; a quasar and a radio galaxy are told sooner. */
export const NAME_GATE = { galaxy: 34, radio: 30, quasar: 26 } as const;
/** How far outside the view, in screen pixels, a label's place may be while some of it may still show: to the sides
 *  half the widest caption, above and below a line and the Sun's lift. */
const OFF_SIDE = 320;
const OFF_END = 48;
const QUASAR = 'quasar — a feeding black hole outshining its galaxy';
const BLAZAR = 'blazar — a quasar jet aimed straight at you';
const RADIO = 'radio galaxy — jets inflate giant lobes';

/**
 * Everything lettered on a frame's map. `charter` is the name of the charter's region. The universe: the captions of
 * the far zoom, the home galaxy always, every other galaxy by its gate (dwarfs are never named), and the charter over
 * its ring. A galaxy: the Sun, from the zoom its mark shows at. A system: each planet under its disc, and with the
 * star charts the habitable zone and the belt; near enough, the comets and the visitor. Only what is on the screen
 * is listed.
 */
export function mapLabels(frame: MapFrame, charter: string): Label[] {
  const { nav, cam, view } = frame;
  const labels: Label[] = mapCaptions(frame).map((caption) => ({ ...caption, hold: 'centre' }));
  // Reduced motion holds every clock of the map at its start.
  const time = frame.passes?.motion === false ? 0 : frame.time;
  if (nav.mode === 'universe') {
    for (const body of visibleBodies(nav, cam, view, time)) {
      if (body.kind !== 'galaxy') continue;
      const g = body.ref;
      const shown = (gate: number): boolean => g.size * cam.z > gate;
      if (g.home) labels.push({ text: 'Milky Way — you are here', wx: g.x, wy: g.y + g.size * 1.15 + 4, hold: 'below' });
      else if (g.quasar) { if (shown(NAME_GATE.quasar)) labels.push({ text: g.blazar ? BLAZAR : QUASAR, wx: g.x, wy: g.y + g.size * 2, hold: 'below' }); }
      else if (g.radio) { if (shown(NAME_GATE.radio)) labels.push({ text: RADIO, wx: g.x, wy: g.y + g.size * 2.4, hold: 'below' }); }
      else if (!g.dwarf && shown(NAME_GATE.galaxy)) labels.push({ text: galaxyName(g.seed), wx: g.x, wy: g.y + g.size * 1.15, hold: 'below' });
    }
    if (cam.z > webZoom(view) * 0.7) labels.push({ text: `your charter — ${charter}`, wx: HOME_POS.x, wy: HOME_POS.y - frame.reach - 4, hold: 'above' });
  } else if (nav.mode === 'galaxy') {
    const sun = galaxyContent(nav.gal).stars.find((star) => star.sol === true);
    if (sun !== undefined && cam.z > minSideOf(view) / 900) labels.push({ text: 'Sun — our star', wx: sun.x, wy: sun.y, hold: 'above', lift: 14 });
  } else if (nav.mode === 'system') {
    for (const body of visibleBodies(nav, cam, view, time)) {
      if (body.kind !== 'planet') continue;
      const size = 6 * (typeof body.ref.P.sizeMul === 'number' && body.ref.P.sizeMul !== 0 ? body.ref.P.sizeMul : 1);
      labels.push({ text: body.ref.name, wx: body.wx, wy: body.wy + size, hold: 'below' });
    }
    const belt = (systemScene(nav.star.seed).belt as { r?: number } | null)?.r;
    if (frame.charts && belt) labels.push({ text: 'asteroid belt', wx: 0, wy: -belt - 2, hold: 'above' });
  }
  // Words whose place is beyond the reach of the widest of them are not on the screen.
  return labels.filter((label) => {
    const at = toScreen(cam, view, label.wx, label.wy);
    return at.x > -OFF_SIDE && at.x < view.w + OFF_SIDE && at.y > -OFF_END && at.y < view.h + OFF_END;
  });
}
