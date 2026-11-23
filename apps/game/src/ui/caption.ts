/** The pixel value of the dark edge about a caption's letters: one past the eight a sheet's letters are drawn in. */
export const CAPTION_EDGE = 9;

/**
 * Lettering with a dark edge one pixel wide, for words that lie over art: the picture grown by one pixel on every
 * side, and every clear pixel that touches a lettered one, corners included, given CAPTION_EDGE. No lettered pixel
 * is left touching what lies behind the words, so they read over a field as light as they are.
 */
export function edged(picture: { w: number; h: number; pixels: ArrayLike<number> }): { w: number; h: number; pixels: Uint8Array } {
  const [w, h] = [picture.w + 2, picture.h + 2];
  const pixels = new Uint8Array(w * h);
  for (let y = 0; y < picture.h; y++) for (let x = 0; x < picture.w; x++) {
    const value = picture.pixels[y * picture.w + x] ?? 0;
    if (value === 0) continue;
    for (let dy = 0; dy <= 2; dy++) for (let dx = 0; dx <= 2; dx++) {
      const at = (y + dy) * w + x + dx;
      if (pixels[at] === 0) pixels[at] = CAPTION_EDGE;
    }
    pixels[(y + 1) * w + x + 1] = value;
  }
  return { w, h, pixels };
}
