/** Rest sizing covers every retained positive-alpha source pixel. This only
 * observes bytes; it does not crop, threshold, remap or rewrite the painting. */
export function positiveAlphaBox(rgba, width, height) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0
    || !rgba || rgba.length !== width * height * 4) throw Error('alpha box: invalid RGBA dimensions');
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (rgba[(y * width + x) * 4 + 3] > 0) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x1 < 0) throw Error('empty alpha');
  return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}
