/* The one particle disc every theme tints (Art Kit §4K: material colour is the body). A white soft-edged
 * core with a thin darker rim, so a pale material (foam, ice, charged dust) still reads over a pale wet
 * plate and a dark material (void, earth) still reads over shadow. Pure and deterministic; the caller
 * rasterizes the RGBA bytes into a texture. Tint multiplies the whole disc, so the rim stays darker
 * than the core under every colour. */
export const PARTICLE_DISC_SIZE = 16 as const;
export const PARTICLE_RIM = Object.freeze({ inner: 0.62, outer: 0.92, darkness: 0.28, alpha: 0.75 });

/** RGBA bytes of the disc, `size` square. Core: white, alpha 1 to radius `rim.inner`; rim: darkened, fading to 0 at `rim.outer`. */
export function particleDiscRgba(size: number = PARTICLE_DISC_SIZE): Uint8ClampedArray {
  if (!Number.isInteger(size) || size < 4 || size > 256) throw new RangeError(`particle disc size ${String(size)}: expected an integer 4..256`);
  const out = new Uint8ClampedArray(size * size * 4), c = (size - 1) / 2, r = size / 2, { inner, outer, darkness, alpha } = PARTICLE_RIM;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x - c, y - c) / r, i = (y * size + x) * 4;
    let a: number, v: number;
    if (d <= inner) { a = 1; v = 255; }
    else if (d <= outer) { const t = (d - inner) / (outer - inner); v = Math.round(255 * (1 - darkness * t)); a = alpha + (1 - alpha) * (1 - t); }
    else { a = 0; v = 0; }
    out[i] = v; out[i + 1] = v; out[i + 2] = v; out[i + 3] = Math.round(a * 255);
  }
  return out;
}
