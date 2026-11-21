import type { PixelBuffer } from './buffer';

const OUTLINE = 16;

/**
 * The finishing pass, in place: outline, then light and shade as one net change. Every decision is
 * read from a copy taken before the outline, so the outline is one pixel thick and light and shade
 * see the shape, not its outline. A ramp pixel moves by (lit ? 1 : 0) - (shaded ? 1 : 0), clamped
 * within its ramp, so a pixel that is both lit and shaded never changes. Neighbours outside the canvas count as transparent.
 */
export function finish(buffer: PixelBuffer): void {
  const { w, h, pixels } = buffer;
  const before = pixels.slice();
  const clear = (x: number, y: number): boolean => x < 0 || y < 0 || x >= w || y >= h || before[y * w + x] === 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const v = before[i] ?? 0;
      if (v === 0) {
        if (!clear(x - 1, y) || !clear(x + 1, y) || !clear(x, y - 1) || !clear(x, y + 1)) pixels[i] = OUTLINE;
        continue;
      }
      if (v > 12) continue; // 13 eye, 14 highlight, 15 glow, 16 outline: never changed
      // Ramps are 1-4, 5-8 and 9-12: shade is the position 0-3 inside the ramp.
      const base = v - ((v - 1) & 3);
      const lit = clear(x, y - 1) && clear(x - 1, y);
      const shaded = clear(x, y + 1);
      const d = (lit ? 1 : 0) - (shaded ? 1 : 0);
      const shade = v - base + d;
      pixels[i] = base + (shade < 0 ? 0 : shade > 3 ? 3 : shade);
    }
  }
}
