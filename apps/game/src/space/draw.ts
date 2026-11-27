/* What the map's producers share: where a world point falls in the picture, colours, and how a soft light of the
   game is drawn in pixel art. */
import type { FieldStep, SpaceItem } from '@cf/art-interface';
import type { NavState } from '@cf/scene';
import type { Camera, Viewport } from './camera';
import type { Sizing } from './sizes';

export interface Grid { w: number; h: number }

/** Where a world point falls in the picture, in whole art pixels. */
export function place(cam: Camera, grid: Grid, wx: number, wy: number): { x: number; y: number } {
  return { x: Math.round(grid.w / 2 + (wx - cam.x) * cam.z), y: Math.round(grid.h / 2 + (wy - cam.y) * cam.z) };
}

export const rgbOf = (hex: string): number => parseInt(hex.slice(1), 16);

/** 0xRRGGBB for a hue in degrees and a saturation and lightness from 0 to 1. */
export function hsl(hue: number, saturation: number, lightness: number): number {
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number): number => {
    const k = (n + hue / 30) % 12;
    return Math.round((lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return (channel(0) << 16) | (channel(8) << 8) | channel(4);
}

/** A colour with each channel multiplied by k, from 0 to 1. */
export function scaled(colour: number, k: number): number {
  const channel = (shift: number): number => Math.round(((colour >>> shift) & 255) * k);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

const TONE_STEPS = [0.25, 0.5, 1] as const;
/**
 * A light of `colour` at a strength from 0 to 1 over the dark of space, as pixel art: the colour at a quarter, a half
 * or its full brightness (the lowest step that reaches the strength), and how many of every 16 pixels carry it.
 */
export function tone(colour: number, strength: number): { colour: number; level: number } {
  const step = TONE_STEPS.find((s) => strength <= s) ?? 1;
  return { colour: scaled(colour, step), level: Math.round(16 * Math.min(strength, 1) / step) };
}

/** The dark of space the game lays its lights over. */
const SPACE = 0x0b1223;
/** A light of `colour` at a strength from 0 to 1 over the dark of space, as one whole colour: no pattern carries it. */
export function lit(colour: number, strength: number): number {
  const k = Math.min(Math.max(strength, 0), 1);
  const channel = (shift: number): number => Math.round(((SPACE >>> shift) & 255) * (1 - k) + ((colour >>> shift) & 255) * k);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** A solid round light: a disc of one colour that never covers anything brighter than it. With `inner`, only the
 *  band outside the disc of that radius. */
export function glow(x: number, y: number, r: number, colour: number, inner?: number): SpaceItem {
  return { kind: 'veil', x, y, r, colour, level: 16, light: true, ...(inner === undefined ? {} : { inner }) };
}

/**
 * A soft light or shadow of the world as a field of solid steps: `value` is asked at the points of a grid fixed to the
 * world, a power of two of world units apart so that its points stand 8 to 16 art pixels apart, and counted in
 * thousandths. The grid covers the picture, so its shapes stay where they are as the view moves.
 */
export function worldField(v: { cam: Camera; grid: Grid }, steps: readonly FieldStep[], value: (wx: number, wy: number) => number): SpaceItem {
  const z = v.cam.z;
  let step = 1;
  while (step * z < 8) step *= 2;
  while (step * z >= 16) step /= 2;
  const left = v.cam.x - v.grid.w / 2 / z;
  const top = v.cam.y - v.grid.h / 2 / z;
  const [i0, j0] = [Math.floor(left / step), Math.floor(top / step)];
  const cols = Math.ceil((left + v.grid.w / z) / step) - i0 + 2;
  const rows = Math.ceil((top + v.grid.h / z) / step) - j0 + 2;
  const values = new Int32Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) values[j * cols + i] = Math.round(1000 * value((i0 + i) * step, (j0 + j) * step));
  return { kind: 'field', cols, rows, values, u: Math.round((left / step - i0) * 65536), v: Math.round((top / step - j0) * 65536), du: Math.round(65536 / (step * z)), steps };
}

/** A line one pixel wide through `points`, each a place of the picture, in one colour: only the part on the picture. */
export function stroke(points: readonly { x: number; y: number }[], colour: number, grid: Grid): SpaceItem[] {
  const items: SpaceItem[] = [];
  for (let n = 1; n < points.length; n++) {
    const [from, to] = [points[n - 1]!, points[n]!];
    const [dx, dy] = [to.x - from.x, to.y - from.y];
    const length = Math.max(Math.abs(dx), Math.abs(dy));
    if (length === 0) continue;
    // The steps of the line that can fall on the picture: the rest are never walked, however long the line.
    let [first, last] = [n === 1 ? 0 : 1, length];
    for (const [start, run, size] of [[from.x, dx, grid.w], [from.y, dy, grid.h]] as const) {
      if (run === 0) { if (start < 0 || start >= size) last = -1; continue; }
      const [a, b] = [-start * length / run, (size - 1 - start) * length / run];
      first = Math.max(first, Math.ceil(Math.min(a, b)));
      last = Math.min(last, Math.floor(Math.max(a, b)));
    }
    for (let i = first; i <= last; i++) items.push({ kind: 'dot', x: from.x + Math.round(dx * i / length), y: from.y + Math.round(dy * i / length), colour });
  }
  return items;
}

/** What the game's settings allow: `effects` is its effects switch, `motion` false when motion is reduced. */
export interface MapPasses { effects: boolean; motion: boolean }

/** What a pass reads. `cam` counts art pixels per world unit and `zoom` screen pixels per world unit; `time` is
 *  already 0 when motion is reduced. */
export interface PassView {
  nav: NavState; cam: Camera; grid: Grid; view: Viewport; zoom: number; time: number;
  /** The seconds the comets and the visitor have run, where they are held apart from `time` (see MapFrame). */
  small?: number;
  reach: number; charts: boolean; effects: boolean; motion: boolean;
  /** Present when the picture sizes its things by the camera. */
  sizing?: Sizing;
  /** Every light and shadow of the map is whole pixels of the palette, in solid steps: no dither lies on it. */
  solid?: boolean;
}

/** The frame of a turning thing drawn in `frames` steps over `period` radians, at `angle`. */
export function frameOf(angle: number, period: number, frames: number): number {
  return ((Math.floor(angle / (period / frames)) % frames) + frames) % frames;
}
/** An element's name at a frame: the first frame is the element itself. */
export const framed = (name: string, frame: number): string => (frame === 0 ? name : `${name}/t${frame}`);
