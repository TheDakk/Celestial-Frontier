import { PIXEL_OUTLINE, PIXEL_PRIMARY, PIXEL_TRANSPARENT } from '@cf/art-format';
import type { PixelBuffer } from './buffer';

// Copied once into plain locals: the per-pixel loops below then read no module binding.
const TRANSPARENT = PIXEL_TRANSPARENT;
const OUTLINE = PIXEL_OUTLINE;
const FIRST_RAMP = PIXEL_PRIMARY;
const LAST_RAMP = PIXEL_PRIMARY + 11; // 1-12: the primary, accent and underside ramps

/**
 * The luminous rim of a finished picture, found when it is shown and never stored: 1 where a ramp pixel (1 to 12) has
 * its upper or its left neighbour transparent, outline or off the canvas; else 0. Reads the buffer only.
 */
export function rimPixels(buffer: PixelBuffer): Uint8Array {
  const { w, h, pixels } = buffer;
  const out = new Uint8Array(w * h);
  const clear = (v: number): boolean => v === TRANSPARENT || v === OUTLINE;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const v = pixels[i] ?? 0;
      if (v < FIRST_RAMP || v > LAST_RAMP) continue;
      if (y === 0 || x === 0 || clear(pixels[i - w] ?? 0) || clear(pixels[i - 1] ?? 0)) out[i] = 1;
    }
  }
  return out;
}

/** round(n / 100), halves up, for 0 <= n <= 25550, in whole numbers: 5243 / 2^19 is 1/100 to within 1 part in 400000. */
const hundredths = (n: number): number => ((n + 50) * 5243) >>> 19;

/**
 * The colours (0xRRGGBB) a finished picture is shown in: each pixel's table colour; on a rim pixel (rimPixels) each
 * channel is min(255, c + round(r x percent / 100)), r the rim colour's channel. Percent 0 is the plain table lookup.
 * Any percent but 0, 50 and 75 throws a RangeError naming it.
 */
export function showColours(buffer: PixelBuffer, table: readonly number[], rim: { colour: number; percent: 0 | 50 | 75 }): Uint32Array {
  const percent: unknown = rim.percent;
  if (percent !== 0 && percent !== 50 && percent !== 75) throw new RangeError(`bad rim percent ${String(percent)}`);
  const { pixels } = buffer;
  const out = new Uint32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) out[i] = table[pixels[i] ?? 0] ?? 0;
  if (rim.percent === 0) return out;
  const p = rim.percent;
  const add = [16, 8, 0].map((s) => hundredths(((rim.colour >>> s) & 255) * p));
  const edge = rimPixels(buffer);
  for (let i = 0; i < out.length; i++) {
    if (edge[i] !== 1) continue;
    const c = out[i] ?? 0;
    let lit = 0;
    for (let k = 0; k < 3; k++) {
      const s = 16 - 8 * k;
      const v = ((c >>> s) & 255) + (add[k] ?? 0);
      lit |= (v > 255 ? 255 : v) << s;
    }
    out[i] = lit >>> 0;
  }
  return out;
}
