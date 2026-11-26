import type { Palette } from '@cf/art-format';
import { tierOf } from './names';
import { STAND_IN_ICON, TINT_RAMP } from './sheet';
import type { Drawing, InterfaceSheet } from './sheet';
import type { Gaps } from './text';

/**
 * One thing on a map, placed in whole art pixels; x grows rightward and y downward from the picture's top left corner.
 * Every colour is 0xRRGGBB and is shown in the sheet's palette colour nearest it.
 * - element: the sheet's drawing of that name with its anchor on (x, y), mirrored left to right about the anchor column
 *   with `flip`. Its values 1 to 4 take the palette ramp whose first colour is nearest `ramp` (its tint), 5 to 8 the
 *   ramp `accent`; a drawing that names its own ramps takes those instead, four values to each in the order named.
 *   With `span`, the width in art pixels it is to cover, the drawing is the widest of the element and its size tiers
 *   (the sheet's drawings named `<name>/x<width>`) that is no wider than the span, or the element itself when none is;
 *   and it is drawn in whole steps: at 1, 2, 3 ... times its size, whichever brings its own width nearest (halfway goes
 *   up, and never under 1), each of its pixels a square block. With `clip` only what lies inside that disc is drawn.
 * - dot: one pixel.
 * - ring: a circle outline of radius r about (x, y), one pixel wide.
 * - dashes: a ring `width` pixels wide about (x, y), the band between the discs of radius r + (width >> 1) and of
 *   `width` less, cut into `count` equal arcs. The first begins due right of the middle and they run on toward the
 *   foot of the picture. Of each arc the first `on` of `of` equal parts are painted and the rest left: solid dashes,
 *   the same all the way round, with no part of one where the last meets the first.
 * - disc: a filled circle of radius r about (x, y), in level bands of equal height, listed from the top. With
 *   `element`, the sheet's drawing of that name is drawn in its place, tinted by the middle band and spanning the
 *   disc's width, when the sheet has one no wider than the disc; a sheet without one is no gap: the bands are drawn.
 * - veil: the same circle in an ordered dither, `level` of every 16 pixels painted (0 none, 16 all). The pattern is fixed
 *   to the picture, so veils join without a seam and a higher level keeps every pixel of a lower one. With `inner` only
 *   the band outside the disc of that radius is painted; with `clip` only what lies inside that disc. A veil that is a
 *   `light` never darkens: it leaves every pixel that is already as bright as its colour.
 * - shade: the same circle with no pattern: every pixel in it that is not background is redrawn in the palette colour
 *   nearest its own with each channel at `share` sixteenths (16 leaves it; more brightens, a channel stopping at its
 *   top), and never in the background. With `toward`, what a share under 16 does not keep of the pixel is taken from
 *   that colour. The nearest colour is judged by hue first, so a blue goes to a darker blue and not to a grey.
 *   `inner` and `clip` as for a veil; with `out`, only what lies outside that disc, which need not share its centre.
 * - field: a soft light or shadow as pixel art has it: solid steps with stepped edges and no pattern. `values` are
 *   whole numbers at the points of a grid `cols` by `rows`, row by row; between four points the field runs evenly. The
 *   picture's pixel (px, py) stands at (u + px * du, v + py * du) on the grid, counted in 65536ths of the way from one
 *   point to the next, so a grid fixed to the world keeps its shapes as the view moves. A pixel takes the last of
 *   `steps`, listed rising, whose `at` its value reaches. A step of a `colour` alone is a light: it is painted where
 *   the pixel is darker than it, as a veil that is a light. A step with a `share` is a shadow: a background pixel takes
 *   its colour, and any other is redrawn as a shade of that share toward it. What lies off the grid is left. A step's
 *   colour is matched by hue first, as a shade's is, and is never the background: the faintest step still shows.
 */
export type SpaceItem =
  | { kind: 'element'; name: string; x: number; y: number; ramp: number; flip?: boolean; span?: number; clip?: { x: number; y: number; r: number } }
  | { kind: 'dot'; x: number; y: number; colour: number }
  | { kind: 'ring'; x: number; y: number; r: number; colour: number }
  | { kind: 'dashes'; x: number; y: number; r: number; width: number; count: number; on: number; of: number; colour: number }
  | { kind: 'disc'; x: number; y: number; r: number; bands: readonly number[]; element?: string }
  | { kind: 'veil'; x: number; y: number; r: number; colour: number; level: number; inner?: number; clip?: { x: number; y: number; r: number }; light?: boolean }
  | { kind: 'shade'; x: number; y: number; r: number; share: number; toward?: number; inner?: number; clip?: { x: number; y: number; r: number }; out?: { x: number; y: number; r: number } }
  | { kind: 'field'; cols: number; rows: number; values: ArrayLike<number>; u: number; v: number; du: number; steps: readonly FieldStep[] };
/** One step of a field: where it begins, and its colour; with `share`, the shade a shadow gives what it covers. */
export interface FieldStep { at: number; colour: number; share?: number }

/** A map picture: w by h colour numbers of the sheet's palette, row-major. A pixel holds any number a palette may. */
export interface SpacePicture { w: number; h: number; pixels: Uint32Array }

/** The ramp an element's values 5 to 8 are drawn in. */
const SECOND_RAMP = 'accent';
/** The largest radius drawn: beyond it a circle is flat across any screen, and its squares stay exact whole numbers. */
export const MAX_RADIUS = 1 << 20;

const tiersOfSheet = new WeakMap<InterfaceSheet, ReadonlyMap<string, readonly Drawing[]>>();
/** The size tiers of each element of a sheet that has any, narrowest first. Read from the sheet once. */
function tiersOf(sheet: InterfaceSheet): ReadonlyMap<string, readonly Drawing[]> {
  let tiers = tiersOfSheet.get(sheet);
  if (tiers === undefined) {
    const found = new Map<string, Drawing[]>();
    for (const [name, drawing] of sheet.elements) {
      const tier = tierOf(name);
      if (tier !== undefined) found.set(tier.element, [...(found.get(tier.element) ?? []), drawing]);
    }
    for (const list of found.values()) list.sort((a, b) => a.w - b.w);
    tiers = found;
    tiersOfSheet.set(sheet, tiers);
  }
  return tiers;
}

/** The drawing of an element for a span, and the whole number of times its size it is drawn at: the widest of the
 *  element and its tiers that is no wider than the span (the element itself when none is), stepped up while a step and
 *  a half of its width still fits in the span. Undefined when the sheet has no element of the name. */
function fitted(sheet: InterfaceSheet, name: string, span: number): { drawing: Drawing; k: number } | undefined {
  let drawing = sheet.elements.get(name);
  if (drawing === undefined) return undefined;
  for (const tier of tiersOf(sheet).get(name) ?? []) if (tier.w <= span && tier.w > drawing.w) drawing = tier;
  let k = 1;
  while ((2 * k + 1) * drawing.w <= 2 * span) k++;
  return { drawing, k };
}

/** The width the painter draws an element at to span `span` art pixels. Undefined when the sheet has no element of
 *  the name, or its smallest drawing is wider than the span. */
export function fittedWidth(sheet: InterfaceSheet, name: string, span: number): number | undefined {
  const plain = sheet.elements.get(name);
  const fit = plain === undefined || plain.w > span ? undefined : fitted(sheet, name, Math.min(span, 2 * MAX_RADIUS));
  return fit === undefined ? undefined : fit.k * fit.drawing.w;
}

/** The order the pixels of every 4 by 4 block of the picture join a veil in, by row then column. */
const DITHER: readonly number[] = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Where a pixel of the picture stands in the order its 4 by 4 block joins a veil: 0 first, 15 last. */
export function ditherRank(x: number, y: number): number {
  return DITHER[(y & 3) * 4 + (x & 3)] ?? 0;
}

const channels = (rgb: number): readonly [number, number, number] => [(rgb >>> 16) & 255, (rgb >>> 8) & 255, rgb & 255];

/** How bright a 0xRRGGBB colour is to the eye, in whole numbers. */
function brightness(rgb: number): number {
  const [r, g, b] = channels(rgb);
  return r * 299 + g * 587 + b * 114;
}

/** The sum of the squared channel differences of two 0xRRGGBB colours. */
function distance(a: number, b: number): number {
  const [ar, ag, ab] = channels(a);
  const [br, bg, bb] = channels(b);
  return (ar - br) * (ar - br) + (ag - bg) * (ag - bg) + (ab - bb) * (ab - bb);
}

/** The index of the candidate nearest `rgb`; ties go to the lower index. -1 when there is none. */
function nearestOf(candidates: readonly number[], rgb: number): number {
  let best = -1;
  let least = 0;
  for (let i = 0; i < candidates.length; i++) {
    const d = distance(candidates[i] ?? 0, rgb);
    if (best < 0 || d < least) { best = i; least = d; }
  }
  return best;
}

/** The index of the candidate nearest `rgb` in hue first: a difference between its channels counts four times a
 *  difference they share, so a colour is matched by one of its own hue before a grey of its own brightness. Ties go
 *  to the lower index. -1 when there is none. */
function nearestHue(candidates: readonly number[], rgb: number): number {
  const [r, g, b] = channels(rgb);
  let best = -1;
  let least = 0;
  for (let i = 0; i < candidates.length; i++) {
    const [cr, cg, cb] = channels(candidates[i] ?? 0);
    const [dr, dg, db] = [cr - r, cg - g, cb - b];
    const d = (dr + dg + db) * (dr + dg + db) + HUE_WEIGHT * ((dr - dg) * (dr - dg) + (dg - db) * (dg - db) + (db - dr) * (db - dr));
    if (best < 0 || d < least) { best = i; least = d; }
  }
  return best;
}
const HUE_WEIGHT = 2;

/** The number of the colour a sheet defines that is nearest a 0xRRGGBB colour; ties go to the lower number. */
export function nearestColour(sheet: InterfaceSheet, rgb: number): number {
  return sheet.defined[nearestOf(sheet.defined.map((number) => sheet.palette.colours[number] ?? 0), rgb)] ?? 0;
}

/** The name of the palette ramp whose first colour is nearest a 0xRRGGBB colour; ties go to the ramp the sheet lists
 *  first. Undefined when the palette has no ramp. */
export function nearestRamp(palette: Palette, rgb: number): string | undefined {
  const names = Object.keys(palette.ramps);
  return names[nearestOf(names.map((name) => palette.colours[palette.ramps[name]?.[0] ?? 0] ?? 0), rgb)];
}

/** The largest whole number whose square is at most n, for 0 <= n and a root of at most MAX_RADIUS + 1. */
export function rootOf(n: number): number {
  let low = 0;
  let high = MAX_RADIUS + 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (middle * middle <= n) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** A whole turn, in the parts a direction is counted in. */
const TURN = 65536;
/** The direction (dx, dy) as a share of a turn, in 65536ths: 0 due right, a quarter of a turn toward the foot of the
 *  picture; 0 for no direction. By whole numbers alone, and within 42 parts (a 1,500th of a turn) of the true angle;
 *  a quarter turn of the direction adds a quarter turn exactly. */
export function turnOf(dx: number, dy: number): number {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax === 0 && ay === 0) return 0;
  // The slope from the nearer axis, from 0 to 1 in 32768ths: the largest whole number of them that the long side,
  // times it, does not pass the short side. Its angle is the slope's own share of an eighth of a turn and a bow of
  // 2847 parts at most, in the middle of the eighth.
  const [short, long] = [Math.min(ax, ay), Math.max(ax, ay)];
  let slope = 0;
  let high = 32768;
  while (slope < high) {
    const middle = (slope + high + 1) >> 1;
    if (middle * long <= short * 32768) slope = middle;
    else high = middle - 1;
  }
  const eighth = (slope >> 2) + ((((slope * (32768 - slope)) >> 15) * 2847) >> 15);
  const quarter = ay <= ax ? eighth : (TURN >> 2) - eighth;
  if (dy >= 0) return dx >= 0 ? quarter : (TURN >> 1) - quarter;
  return dx < 0 ? (TURN >> 1) + quarter : (TURN - quarter) % TURN;
}

/**
 * A picture w by h of palette indices, the items painted in order, later ones over earlier ones. Index 0 is the
 * background: a pixel given it shows what lies behind. Whatever falls outside the picture is dropped. An element the
 * sheet lacks draws the stand-in icon centred on its place and is counted in `gaps.elements`. A ring or disc with a
 * radius below 0 or above MAX_RADIUS is not drawn, nor is a veil or a shade with one, nor dashes whose outer edge is
 * beyond it or that are of no count; dashes of no width have no pixel. A field of fewer than two points
 * either way, or finer than its grid can count (`du` under 1), is not drawn.
 */
export function paintSpace(w: number, h: number, items: readonly SpaceItem[], sheet: InterfaceSheet, gaps: Gaps): SpacePicture {
  const { palette, defined } = sheet;
  const pixels = new Uint32Array(w * h);
  // Only the colours the sheet defines are looked among, and each table below holds only those: a picture costs by
  // how many colours its sheet has, never by how high it numbers them.
  const colours = defined.map((number) => palette.colours[number] ?? 0);
  const bright: number[] = [];
  for (let i = 0; i < defined.length; i++) bright[defined[i] ?? 0] = brightness(colours[i] ?? 0);
  const indexOf = new Map<number, number>();
  const index = (rgb: number): number => {
    let found = indexOf.get(rgb);
    if (found === undefined) { found = defined[nearestOf(colours, rgb)] ?? 0; indexOf.set(rgb, found); }
    return found;
  };
  const row = (y: number, x0: number, x1: number, value: number): void => {
    if (y < 0 || y >= h) return;
    for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) pixels[y * w + x] = value;
  };

  /** How far a disc of radius r reaches to either side on the row `up` rows from its centre; -1 when it misses the row. */
  const halfOf = (r: number, up: number): number => (up > r ? -1 : rootOf(r * r + r - up * up));

  const element = (item: Extract<SpaceItem, { kind: 'element' }>): void => {
    const { clip } = item;
    if (clip !== undefined && (clip.r < 0 || clip.r > MAX_RADIUS)) return;
    const span = Math.min(item.span ?? 0, 2 * MAX_RADIUS);
    const fit = fitted(sheet, item.name, span);
    let drawing = fit?.drawing;
    let [ax, ay] = drawing?.anchor ?? [0, 0];
    let k = fit?.k ?? 1;
    if (drawing === undefined) {
      gaps.elements.push(item.name);
      drawing = sheet.icons.get(STAND_IN_ICON);
      if (drawing === undefined) throw new Error('the sheet has no stand-in icon');
      ax = drawing.w >> 1;
      ay = drawing.h >> 1;
      while ((2 * k + 1) * drawing.w <= 2 * span) k++;
    }
    const first = palette.ramps[nearestRamp(palette, item.ramp) ?? ''];
    const ramps = drawing.ramps === undefined ? [first, palette.ramps[SECOND_RAMP] ?? first]
      : drawing.ramps.map((name) => (name === TINT_RAMP ? first : palette.ramps[name] ?? first));
    const lead = k >> 1;
    for (let dy = 0; dy < drawing.h; dy++) {
      const top = item.y + (dy - ay) * k - lead;
      if (top + k <= 0 || top >= h) continue;
      for (let dx = 0; dx < drawing.w; dx++) {
        const value = drawing.pixels[dy * drawing.w + dx] ?? 0;
        if (value === 0) continue;
        const left = (item.flip === true ? item.x - (dx - ax) * k : item.x + (dx - ax) * k) - lead;
        if (left + k <= 0 || left >= w) continue;
        const colour = ramps[(value - 1) >> 2]?.[(value - 1) & 3] ?? 0;
        for (let y = Math.max(0, top); y < Math.min(h, top + k); y++) {
          if (clip === undefined) { row(y, left, left + k - 1, colour); continue; }
          const within = halfOf(clip.r, Math.abs(y - clip.y));
          row(y, Math.max(left, clip.x - within), Math.min(left + k - 1, clip.x + within), colour);
        }
      }
    }
  };

  const ring = (item: Extract<SpaceItem, { kind: 'ring' }>): void => {
    const { x, y, r } = item;
    const value = index(item.colour);
    for (let dy = Math.max(-r, -y); dy <= Math.min(r, h - 1 - y); dy++) {
      const up = Math.abs(dy);
      // The edge of the disc of the same radius. It crosses this row from where the next row out ends, so the outline
      // has no break where it runs flat.
      const outer = rootOf(r * r + r - up * up);
      const inner = up === r ? 0 : Math.min(outer, rootOf(r * r + r - (up + 1) * (up + 1)) + 1);
      row(y + dy, x + inner, x + outer, value);
      row(y + dy, x - outer, x - inner, value);
    }
  };

  const dashes = (item: Extract<SpaceItem, { kind: 'dashes' }>): void => {
    const { x, y, width, count, on, of } = item;
    const outer = item.r + (width >> 1);
    if (count < 1 || outer > MAX_RADIUS) return;
    const value = index(item.colour);
    for (let dy = Math.max(-outer, -y); dy <= Math.min(outer, h - 1 - y); dy++) {
      const far = halfOf(outer, Math.abs(dy));
      const near = halfOf(outer - width, Math.abs(dy));
      for (let px = Math.max(0, x - far); px <= Math.min(w - 1, x + far); px++) {
        if (Math.abs(px - x) <= near) { px = Math.max(px, Math.min(w - 1, x + near)); continue; }
        if (((turnOf(px - x, dy) * count) % TURN) * of < on * TURN) pixels[(y + dy) * w + px] = value;
      }
    }
  };

  const disc = (item: Extract<SpaceItem, { kind: 'disc' }>): void => {
    const { x, y, r, bands } = item;
    const rows = 2 * r + 1;
    if (item.element !== undefined && fittedWidth(sheet, item.element, rows) !== undefined) {
      element({ kind: 'element', name: item.element, x, y, ramp: bands[bands.length >> 1] ?? 0, span: rows });
      return;
    }
    if (bands.length === 0) return;
    let band = 0;
    let carried = 0;
    for (let dy = -r; dy <= r; dy++) {
      const half = rootOf(r * r + r - dy * dy);
      row(y + dy, x - half, x + half, index(bands[band] ?? 0));
      // Band k covers the rows whose number times the band count, in whole steps of the row count, is k.
      carried += bands.length;
      while (carried >= rows) { carried -= rows; band++; }
    }
  };

  const veil = (item: Extract<SpaceItem, { kind: 'veil' }>): void => {
    const { x, y, r, clip } = item;
    if (clip !== undefined && (clip.r < 0 || clip.r > MAX_RADIUS)) return;
    const value = index(item.colour);
    const floor = item.light === true ? bright[value] ?? 0 : Infinity;
    for (let py = Math.max(0, y - r); py <= Math.min(h - 1, y + r); py++) {
      const half = halfOf(r, Math.abs(py - y));
      const hole = item.inner === undefined ? -1 : halfOf(item.inner, Math.abs(py - y));
      const within = clip === undefined ? MAX_RADIUS * 4 : halfOf(clip.r, Math.abs(py - clip.y));
      const from = Math.max(0, x - half, clip === undefined ? 0 : clip.x - within);
      const to = Math.min(w - 1, x + half, clip === undefined ? w - 1 : clip.x + within);
      for (let px = from; px <= to; px++) {
        if (Math.abs(px - x) > hole && ditherRank(px, py) < item.level && (bright[pixels[py * w + px] ?? 0] ?? 0) < floor) pixels[py * w + px] = value;
      }
    }
  };

  /** The colour number each number is shaded to at a share toward a colour, worked out once for each a picture uses. */
  const shadedAt = new Map<number, number[]>();
  const first = defined[0] === 0 ? 1 : 0;
  const solid = colours.slice(first);
  const shadedFor = (share: number, toward: number): number[] => {
    const key = share * (1 << 24) + toward;
    let shaded = shadedAt.get(key);
    if (shaded === undefined) {
      const rest = channels(toward).map((channel) => channel * Math.max(0, 16 - share));
      const at = (channel: number, i: number): number => Math.min(255, (channel * share + (rest[i] ?? 0)) >> 4);
      shaded = [];
      for (let i = 0; i < defined.length; i++) {
        const [red, green, blue] = channels(colours[i] ?? 0);
        shaded[defined[i] ?? 0] = defined[nearestHue(solid, (at(red, 0) << 16) | (at(green, 1) << 8) | at(blue, 2)) + first] ?? 0;
      }
      shadedAt.set(key, shaded);
    }
    return shaded;
  };
  const shade = (item: Extract<SpaceItem, { kind: 'shade' }>): void => {
    const { x, y, r, clip, out } = item;
    if (clip !== undefined && (clip.r < 0 || clip.r > MAX_RADIUS)) return;
    const shaded = shadedFor(item.share, item.toward ?? 0);
    for (let py = Math.max(0, y - r); py <= Math.min(h - 1, y + r); py++) {
      const half = halfOf(r, Math.abs(py - y));
      const hole = item.inner === undefined ? -1 : halfOf(item.inner, Math.abs(py - y));
      const within = clip === undefined ? MAX_RADIUS * 4 : halfOf(clip.r, Math.abs(py - clip.y));
      const kept = out === undefined ? -1 : halfOf(out.r, Math.abs(py - out.y));
      const from = Math.max(0, x - half, clip === undefined ? 0 : clip.x - within);
      const to = Math.min(w - 1, x + half, clip === undefined ? w - 1 : clip.x + within);
      for (let px = from; px <= to; px++) {
        const value = pixels[py * w + px] ?? 0;
        if (value !== 0 && Math.abs(px - x) > hole && (out === undefined || Math.abs(px - out.x) > kept)) pixels[py * w + px] = shaded[value] ?? value;
      }
    }
  };

  const field = (item: Extract<SpaceItem, { kind: 'field' }>): void => {
    const { cols, rows, values, steps, du } = item;
    if (cols < 2 || rows < 2 || du < 1 || steps.length === 0) return;
    // What each step paints: its colour number, how bright that is, and for a shadow the shade of every colour.
    const paints = steps.map((step) => {
      const value = defined[nearestHue(solid, step.colour) + first] ?? 0;
      return { value, floor: bright[value] ?? 0, shaded: step.share === undefined ? undefined : shadedFor(step.share, step.colour) };
    });
    /** The step a value has reached: -1 before the first. */
    const stepOf = (value: number): number => {
      let s = -1;
      while (s + 1 < steps.length && value >= (steps[s + 1]?.at ?? 0)) s++;
      return s;
    };
    const stepAt = new Int32Array(cols * rows);
    for (let i = 0; i < stepAt.length; i++) stepAt[i] = stepOf(values[i] ?? 0);
    for (let py = 0; py < h; py++) {
      const gv = item.v + py * du;
      const j = gv >> 16;
      if (j < 0 || j >= rows - 1) continue;
      const fy = (gv & 0xffff) >> 8;
      let cell = -1;
      let even = -2;
      let [a, b, c, d] = [0, 0, 0, 0];
      for (let px = 0; px < w; px++) {
        const gu = item.u + px * du;
        const i = gu >> 16;
        if (i < 0 || i >= cols - 1) continue;
        if (i !== cell) {
          cell = i;
          const at = j * cols + i;
          [a, b, c, d] = [values[at] ?? 0, values[at + 1] ?? 0, values[at + cols] ?? 0, values[at + cols + 1] ?? 0];
          // A cell whose four points have reached the same step is that step all over: nothing to work out in it.
          const s = stepAt[at] ?? -1;
          even = s === stepAt[at + 1] && s === stepAt[at + cols] && s === stepAt[at + cols + 1] ? s : -2;
        }
        let s = even;
        if (s === -2) {
          const fx = (gu & 0xffff) >> 8;
          s = stepOf(((a * (256 - fx) + b * fx) * (256 - fy) + (c * (256 - fx) + d * fx) * fy) >> 16);
        }
        if (s < 0) continue;
        const paint = paints[s];
        if (paint === undefined) continue;
        const now = pixels[py * w + px] ?? 0;
        if (paint.shaded === undefined) { if ((bright[now] ?? 0) < paint.floor) pixels[py * w + px] = paint.value; }
        else pixels[py * w + px] = now === 0 ? paint.value : paint.shaded[now] ?? now;
      }
    }
  };

  for (const item of items) {
    if (item.kind === 'element') element(item);
    else if (item.kind === 'dot') row(item.y, item.x, item.x, index(item.colour));
    else if (item.kind === 'field') field(item);
    else if (item.r < 0 || item.r > MAX_RADIUS) continue;
    else if (item.kind === 'ring') ring(item);
    else if (item.kind === 'dashes') dashes(item);
    else if (item.kind === 'disc') disc(item);
    else if (item.kind === 'veil') veil(item);
    else shade(item);
  }
  return { w, h, pixels };
}
