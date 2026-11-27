import { OWN_RAMP_FIRST, OWN_RAMP_LAST, PIXEL_EYE, PIXEL_OUTLINE, PIXEL_TRANSPARENT } from '@cf/art-format';
import type { PixelBuffer } from './buffer';

// Copied once into plain locals: the per-pixel loops below then read no module binding (a large cost under the test runner).
const TRANSPARENT = PIXEL_TRANSPARENT;
const OUTLINE = PIXEL_OUTLINE;
const EYE = PIXEL_EYE;
const FIRST_OWN = OWN_RAMP_FIRST;
const LAST_OWN = OWN_RAMP_LAST; // 21-28: the bone and deep ramps

/**
 * The finishing pass, in place: outline, then light and shade as one net change. Every decision is
 * read from a copy taken before the outline, so the outline is one pixel thick and light and shade
 * see the shape, not its outline. A ramp pixel moves by (lit ? 1 : 0) - (shaded ? 1 : 0), clamped
 * within its ramp, so a pixel that is both lit and shaded never changes. Bone (21-24) and deep (25-28) are ramps like the hide's three.
 * Neighbours outside the canvas count as transparent.
 */
export function finish(buffer: PixelBuffer): void {
  const { w, h, pixels } = buffer;
  const before = pixels.slice();
  const clear = (x: number, y: number): boolean => x < 0 || y < 0 || x >= w || y >= h || before[y * w + x] === TRANSPARENT;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const v = before[i] ?? 0;
      if (v === TRANSPARENT) {
        if (!clear(x - 1, y) || !clear(x + 1, y) || !clear(x, y - 1) || !clear(x, y + 1)) pixels[i] = OUTLINE;
        continue;
      }
      if (v >= EYE && (v < FIRST_OWN || v > LAST_OWN)) continue; // 13 eye, 14 highlight, 15 glow, 16 outline, 17-20 iris: never changed
      // Ramps are 1-4, 5-8, 9-12, 21-24 and 25-28: shade is the position 0-3 inside the ramp.
      const base = v - ((v - 1) & 3);
      const lit = clear(x, y - 1) && clear(x - 1, y);
      const shaded = clear(x, y + 1);
      const d = (lit ? 1 : 0) - (shaded ? 1 : 0);
      const shade = v - base + d;
      pixels[i] = base + (shade < 0 ? 0 : shade > 3 ? 3 : shade);
    }
  }
}

/**
 * The value the finishing pass gives the pixel at (x, y) of an unfinished picture: exactly what `finish` writes there,
 * read from the picture as it is, for a caller that needs a few finished pixels and not a finished copy.
 */
export function finishedPixel(w: number, h: number, pixels: Uint8Array, x: number, y: number): number {
  const clear = (cx: number, cy: number): boolean => cx < 0 || cy < 0 || cx >= w || cy >= h || pixels[cy * w + cx] === TRANSPARENT;
  const v = pixels[y * w + x] ?? 0;
  if (v === TRANSPARENT) return !clear(x - 1, y) || !clear(x + 1, y) || !clear(x, y - 1) || !clear(x, y + 1) ? OUTLINE : TRANSPARENT;
  if (v >= EYE && (v < FIRST_OWN || v > LAST_OWN)) return v;
  const base = v - ((v - 1) & 3);
  const d = (clear(x, y - 1) && clear(x - 1, y) ? 1 : 0) - (clear(x, y + 1) ? 1 : 0);
  const shade = v - base + d;
  return base + (shade < 0 ? 0 : shade > 3 ? 3 : shade);
}
