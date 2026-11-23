/* The words the game letters on its maps, each with the game's own gate: the names of galaxies as the view closes
   in, what a quasar and a radio galaxy are, the home galaxy and the charter, the Sun, the planets and the belt. */
import { measureText, type DisplayFont } from '@cf/art-interface';
import { galaxyName } from '@cf/domain-naming';
import { HOME_POS } from '@cf/domain-worldconfig';
import { systemScene } from '@cf/scene';
import { minSideOf, toScreen } from './camera';
import { place } from './draw';
import { placeLabels, wrapWords, type Disc, type LabelSpec, type PlacedLabel } from './label-place';
import { galaxyContent, visibleBodies } from './model';
import { cometsDrawn } from './passes-system';
import { webZoom } from './passes-universe';
import { artCamera, artGrid, artScale, mapCaptions, primaryWidth } from './project';
import type { MapFrame } from './project';
import { SOL_MARK_CSS, STAR_WIDTH, starBase } from './sizes';

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

/** A label and the body it belongs to, in world units: the body's centre, how far from it the game letters the words
 *  (`off`), the radius it is drawn at (`r`) and of its ring, if it has one. Words of the place itself are rank 0, of a
 *  body 1, of a ring 2, and words that lie on a point of the map 3. */
interface Lettering extends Label { bx: number; by: number; off: number; r: number; ring: number; rank: number }
/** A body the map draws as a disc, in world units. */
interface Drawn { wx: number; wy: number; r: number }

/** Words keep this many art pixels clear of a ring, and of each side of the view when they wrap. */
const RING_GAP = 2;
const VIEW_EDGE = 4;
/** A galaxy under this many art pixels in radius is a dot: words may cross it. */
const DISC_MIN = 3;

function lettering(frame: MapFrame, charter: string): { labels: Lettering[]; drawn: Drawn[] } {
  const { nav, cam, view } = frame;
  // The game stands the name of a comet and of the visitor on its foot above the thing; a frame that does not ask for
  // that has every caption centred on its point.
  const stood = frame.placement?.stand === true;
  const labels: Lettering[] = mapCaptions(frame).map(({ text, wx, wy, stand }) => (stood && stand !== undefined
    ? { text, wx, wy, hold: 'above', bx: wx, by: wy + stand, off: stand, r: 0, ring: 0, rank: 3 }
    : { text, wx, wy, hold: 'centre', bx: wx, by: wy, off: 0, r: 0, ring: 0, rank: 3 }));
  const drawn: Drawn[] = [];
  // Reduced motion holds every clock of the map at its start.
  const time = frame.passes?.motion === false ? 0 : frame.time;
  if (nav.mode === 'universe') {
    for (const body of visibleBodies(nav, cam, view, time)) {
      if (body.kind !== 'galaxy') continue;
      const g = body.ref;
      drawn.push({ wx: g.x, wy: g.y, r: g.size });
      const shown = (gate: number): boolean => g.size * cam.z > gate;
      const under = (text: string, off: number, rank: number): void => {
        labels.push({ text, wx: g.x, wy: g.y + off, hold: 'below', bx: g.x, by: g.y, off, r: g.size, ring: 0, rank });
      };
      if (g.home) under('Milky Way — you are here', g.size * 1.15 + 4, 0);
      else if (g.quasar) { if (shown(NAME_GATE.quasar)) under(g.blazar ? BLAZAR : QUASAR, g.size * 2, 1); }
      else if (g.radio) { if (shown(NAME_GATE.radio)) under(RADIO, g.size * 2.4, 1); }
      else if (!g.dwarf && shown(NAME_GATE.galaxy)) under(galaxyName(g.seed), g.size * 1.15, 1);
    }
    if (cam.z > webZoom(view) * 0.7) {
      labels.push({ text: `your charter — ${charter}`, wx: HOME_POS.x, wy: HOME_POS.y - frame.reach - 4, hold: 'above',
        bx: HOME_POS.x, by: HOME_POS.y, off: frame.reach + 4, r: frame.reach, ring: 0, rank: 2 });
    }
  } else if (nav.mode === 'galaxy') {
    const sun = galaxyContent(nav.gal).stars.find((star) => star.sol === true);
    if (sun !== undefined && cam.z > minSideOf(view) / 900) {
      // Up close the Sun's light is wider than its mark: its halo is three tenths of its glow.
      const halo = sun.s * starBase(cam.z) * STAR_WIDTH.coarse * 0.3;
      labels.push({ text: 'Sun — our star', wx: sun.x, wy: sun.y, hold: 'above', lift: 14, bx: sun.x, by: sun.y, off: 14 / cam.z, r: halo, ring: Math.max(SOL_MARK_CSS / cam.z, halo), rank: 0 });
    }
  } else if (nav.mode === 'system') {
    const scene = systemScene(nav.star.seed);
    drawn.push({ wx: 0, wy: 0, r: primaryWidth(scene) / 2 });
    for (const body of visibleBodies(nav, cam, view, time)) {
      if (body.kind !== 'planet') continue;
      const size = 6 * (typeof body.ref.P.sizeMul === 'number' && body.ref.P.sizeMul !== 0 ? body.ref.P.sizeMul : 1);
      const ring = body.ref.ring ? size * 2.1 : 0;
      drawn.push({ wx: body.wx, wy: body.wy, r: Math.max(size, ring) });
      labels.push({ text: body.ref.name, wx: body.wx, wy: body.wy + size, hold: 'below', bx: body.wx, by: body.wy, off: size, r: size, ring, rank: 1 });
    }
    const belt = (scene.belt as { r?: number } | null)?.r;
    if (frame.charts && belt) labels.push({ text: 'asteroid belt', wx: 0, wy: -belt - 2, hold: 'above', bx: 0, by: 0, off: belt + 2, r: belt, ring: 0, rank: 2 });
  }
  // Words whose place is beyond the reach of the widest of them are not on the screen.
  return { drawn, labels: labels.filter((label) => {
    const at = toScreen(cam, view, label.wx, label.wy);
    return at.x > -OFF_SIDE && at.x < view.w + OFF_SIDE && at.y > -OFF_END && at.y < view.h + OFF_END;
  }) };
}

/**
 * Everything lettered on a frame's map. `charter` is the name of the charter's region. The universe: the captions of
 * the far zoom, the home galaxy always, every other galaxy by its gate (dwarfs are never named), and the charter over
 * its ring. A galaxy: the Sun, from the zoom its mark shows at. A system: each planet under its disc, and with the
 * star charts the habitable zone and the belt; near enough, the comets and the visitor. Only what is on the screen
 * is listed. Each is where the game letters it, whatever else is there.
 */
export function mapLabels(frame: MapFrame, charter: string): Label[] {
  return lettering(frame, charter).labels.map(({ text, wx, wy, hold, lift }) => (lift === undefined ? { text, wx, wy, hold } : { text, wx, wy, hold, lift }));
}

/** Words as the map shows them: their lines, and the box they fill in whole art pixels of the frame's picture. */
export interface Lettered extends PlacedLabel { lines: string[] }

/**
 * The words of `mapLabels` stood where they can be read (the frame carries `placement`): each on the game's own side
 * of its body at the game's own offset, or on the next free side when that would put it on other words, and never on
 * its body's disc or ring, the top bar or the dock; a label with no free side is left out. Words wider than the view
 * are wrapped. With the placement's `tails`, a side a comet's tail crosses is taken only when no other is free. The
 * With its `apart`, two names on one line keep a space between them, or one moves. The current game has no such
 * avoidance: its letters are smaller.
 */
export function placedLabels(frame: MapFrame, charter: string, font: DisplayFont): Lettered[] {
  const { view, dpr } = frame;
  const scale = artScale(view.w, view.h, dpr);
  const grid = artGrid(view.w, view.h, dpr, scale);
  const cam = artCamera(frame.cam, dpr, scale);
  const perCss = dpr / scale;
  const { labels, drawn } = lettering(frame, charter);
  const lines = new Map<string, string[]>();
  const specs = labels.map((label): LabelSpec => {
    const wrapped = wrapWords(label.text, (line) => measureText(font, line).w, grid.w - 2 * VIEW_EDGE);
    lines.set(label.text, wrapped);
    const ring = Math.round(label.ring * cam.z);
    return {
      text: label.text, ...place(cam, grid, label.bx, label.by), side: label.hold, rank: label.rank, size: Math.round(label.r * cam.z),
      w: Math.max(...wrapped.map((line) => measureText(font, line).w)), h: wrapped.length * font.line,
      clear: Math.max(Math.round(label.off * cam.z), ring > 0 ? ring + RING_GAP : 0),
    };
  });
  const discs: Disc[] = drawn.map((body) => ({ ...place(cam, grid, body.wx, body.wy), r: Math.round(body.r * cam.z) })).filter((disc) => disc.r >= DISC_MIN);
  // A comet's tail is a line across the map: each of its pixels is kept off as a body is.
  if (frame.placement?.tails === true && frame.passes !== undefined) {
    const passes = { ...frame.passes, nav: frame.nav, cam, grid, view, zoom: frame.cam.z, time: frame.passes.motion ? frame.time : 0, reach: frame.reach, charts: frame.charts };
    for (const comet of cometsDrawn(passes)) discs.push(...comet.tail.map((at) => ({ ...at, r: 1 })));
  }
  const keepOut = (frame.placement?.keepOut ?? []).map((bar) => {
    const x = Math.floor(bar.x * perCss);
    const y = Math.floor(bar.y * perCss);
    return { x, y, w: Math.ceil((bar.x + bar.w) * perCss) - x, h: Math.ceil((bar.y + bar.h) * perCss) - y };
  });
  // Between two names on one line: a space of the font, with the gap the font sets either side of it.
  const apart = frame.placement?.apart === true ? { apart: measureText(font, ' ').w + 2 * font.gap } : {};
  return placeLabels(specs, { view: grid, keepOut, discs, ...apart }).map((label) => ({ ...label, lines: lines.get(label.text)! }));
}
