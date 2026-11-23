import type { Palette } from '@cf/art-format';
import type { PixelBuffer } from '@cf/art-compose';
import { STAND_IN_ICON } from './sheet';
import type { Drawing, InterfaceSheet } from './sheet';
import type { Gaps } from './text';

/**
 * One thing on a map, placed in whole art pixels; x grows rightward and y downward from the picture's top left corner.
 * Every colour is 0xRRGGBB and is shown in the sheet's palette colour nearest it.
 * - element: the sheet's drawing of that name with its anchor on (x, y), mirrored left to right about the anchor column
 *   with `flip`. Its values 1 to 4 take the palette ramp whose first colour is nearest `ramp`, 5 to 8 the ramp `accent`.
 * - dot: one pixel.
 * - ring: a circle outline of radius r about (x, y), one pixel wide.
 * - disc: a filled circle of radius r about (x, y), in level bands of equal height, listed from the top.
 */
export type SpaceItem =
  | { kind: 'element'; name: string; x: number; y: number; ramp: number; flip?: boolean }
  | { kind: 'dot'; x: number; y: number; colour: number }
  | { kind: 'ring'; x: number; y: number; r: number; colour: number }
  | { kind: 'disc'; x: number; y: number; r: number; bands: readonly number[] };

/** The ramp an element's values 5 to 8 are drawn in. */
const SECOND_RAMP = 'accent';
/** The largest radius drawn: beyond it a circle is flat across any screen, and its squares stay exact whole numbers. */
export const MAX_RADIUS = 1 << 20;

const channels = (rgb: number): readonly [number, number, number] => [(rgb >>> 16) & 255, (rgb >>> 8) & 255, rgb & 255];

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

/** The palette index nearest a 0xRRGGBB colour; ties go to the lower index. */
export function nearestColour(palette: Palette, rgb: number): number {
  return Math.max(0, nearestOf(palette.colours, rgb));
}

/** The name of the palette ramp whose first colour is nearest a 0xRRGGBB colour; ties go to the ramp the sheet lists
 *  first. Undefined when the palette has no ramp. */
export function nearestRamp(palette: Palette, rgb: number): string | undefined {
  const names = Object.keys(palette.ramps);
  return names[nearestOf(names.map((name) => palette.colours[palette.ramps[name]?.[0] ?? 0] ?? 0), rgb)];
}

/** The largest whole number whose square is at most n, for 0 <= n and a root of at most MAX_RADIUS + 1. */
function rootOf(n: number): number {
  let low = 0;
  let high = MAX_RADIUS + 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (middle * middle <= n) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * A picture w by h of palette indices, the items painted in order, later ones over earlier ones. Index 0 is the
 * background: a pixel given it shows what lies behind. Whatever falls outside the picture is dropped. An element the
 * sheet lacks draws the stand-in icon centred on its place and is counted in `gaps.elements`. A ring or disc with a
 * radius below 0 or above MAX_RADIUS is not drawn.
 */
export function paintSpace(w: number, h: number, items: readonly SpaceItem[], sheet: InterfaceSheet, gaps: Gaps): PixelBuffer {
  const { palette } = sheet;
  const pixels = new Uint8Array(w * h);
  const indexOf = new Map<number, number>();
  const index = (rgb: number): number => {
    let found = indexOf.get(rgb);
    if (found === undefined) { found = nearestColour(palette, rgb); indexOf.set(rgb, found); }
    return found;
  };
  const row = (y: number, x0: number, x1: number, value: number): void => {
    if (y < 0 || y >= h) return;
    for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) pixels[y * w + x] = value;
  };

  const element = (item: Extract<SpaceItem, { kind: 'element' }>): void => {
    let drawing: Drawing | undefined = sheet.elements.get(item.name);
    let [ax, ay] = drawing?.anchor ?? [0, 0];
    if (drawing === undefined) {
      gaps.elements.push(item.name);
      drawing = sheet.icons.get(STAND_IN_ICON);
      if (drawing === undefined) throw new Error('the sheet has no stand-in icon');
      ax = drawing.w >> 1;
      ay = drawing.h >> 1;
    }
    const first = palette.ramps[nearestRamp(palette, item.ramp) ?? ''];
    const ramps = [first, palette.ramps[SECOND_RAMP] ?? first];
    for (let dy = 0; dy < drawing.h; dy++) {
      const y = item.y + dy - ay;
      if (y < 0 || y >= h) continue;
      for (let dx = 0; dx < drawing.w; dx++) {
        const value = drawing.pixels[dy * drawing.w + dx] ?? 0;
        if (value === 0) continue;
        const x = item.flip === true ? item.x - (dx - ax) : item.x + dx - ax;
        if (x < 0 || x >= w) continue;
        pixels[y * w + x] = ramps[(value - 1) >> 2]?.[(value - 1) & 3] ?? 0;
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

  const disc = (item: Extract<SpaceItem, { kind: 'disc' }>): void => {
    const { x, y, r, bands } = item;
    if (bands.length === 0) return;
    const rows = 2 * r + 1;
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

  for (const item of items) {
    if (item.kind === 'element') element(item);
    else if (item.kind === 'dot') row(item.y, item.x, item.x, index(item.colour));
    else if (item.r < 0 || item.r > MAX_RADIUS) continue;
    else if (item.kind === 'ring') ring(item);
    else disc(item);
  }
  return { w, h, pixels };
}
