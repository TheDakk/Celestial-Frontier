import type { PixelBuffer } from './buffer';

// Every tunable number of the rarity finish, fixed per renderer version. Tuning changes numbers here only.
// The original blends smooth gradients (hdart.verbatim.js:1963-1984); these whole-number rules give the same idea at
// this size. A first version: Dakk has not seen it on stills.
export const FINISH = {
  untuned: true,
  sheen: { from: 15, to: 45 },   // level 1+: ramp pixels in these percent rows of the drawn height, from its top, move up one shade
  swirl: { period: 7, on: 2 },   // level 2+: ramp pixels on shades 2-3 with (x + y) % period < on become accent 7 or 8 (same shade)
  pearl: { period: 9, on: 2 },   // level 3: ramp pixels with (x - y) mod period < on move up one shade
} as const;

/** The lowest grade tier of each finish level 1, 2 and 3: the original's rule (hdart.verbatim.js:244). */
export const FINISH_TIERS = [4, 6, 8] as const;

/** The finish level of a grade tier: how many of FINISH_TIERS it reaches. The game chooses the tier; the renderer only draws the level. */
export function finishLevelFor(gradeTier: number): 0 | 1 | 2 | 3 {
  let level = 0;
  for (const tier of FINISH_TIERS) if (gradeTier >= tier) level++;
  return level as 0 | 1 | 2 | 3;
}

const LAST_RAMP = 12;
const ACCENT = 5;

/** One shade up inside the value's own ramp, held at the ramp's top shade. */
const up = (v: number): number => (((v - 1) & 3) === 3 ? v : v + 1);

/**
 * The rarity finish, in place, on a finished picture. Level 0 changes nothing. Each pixel is decided by its own
 * coordinates and value and the picture's drawn rows only, and only a ramp pixel (1 to 12) is ever written, with a ramp value: 0, the eye,
 * highlight, glow, outline and iris (13 to 20) are never touched. In order, each on the value the step before left:
 * level 1 and up, the sheen; level 2 and up, the swirl; level 3, the pearl (FINISH).
 */
export function applyFinish(buffer: PixelBuffer, level: 0 | 1 | 2 | 3): void {
  if (level === 0) return;
  const { w, h, pixels } = buffer;
  // The drawn height: the rows from the first to the last that hold any pixel.
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if ((pixels[y * w + x] ?? 0) !== 0) {
        if (top < 0) top = y;
        bottom = y;
        break;
      }
    }
  }
  if (top < 0) return;
  const height = bottom - top + 1;
  const { sheen, swirl, pearl } = FINISH;

  for (let y = top; y <= bottom; y++) {
    const d = (y - top) * 100;
    const inSheen = d >= sheen.from * height && d < sheen.to * height;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = pixels[i] ?? 0;
      if (v < 1 || v > LAST_RAMP) continue;
      // Ramps are 1-4, 5-8 and 9-12: shade is the position 0-3 inside the ramp.
      if (inSheen) v = up(v);
      if (level >= 2 && (x + y) % swirl.period < swirl.on) {
        const shade = (v - 1) & 3;
        if (shade >= 2) v = ACCENT + shade;
      }
      if (level >= 3 && (((x - y) % pearl.period) + pearl.period) % pearl.period < pearl.on) v = up(v);
      pixels[i] = v;
    }
  }
}
