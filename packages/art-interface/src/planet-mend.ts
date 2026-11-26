/* A globe turns by reading its map one column on each step, so a pixel shows one map row in order: a value that
   stands alone in its row is on that pixel for one step and gone the next, and the globe flickers. A finished map,
   surface or cloud, therefore has no run of one pixel along any row, the run across the seam counted as one. */

function sized(values: Uint8Array, w: number, h: number): void {
  if (values.length !== w * h) throw new Error(`a map ${w} by ${h} holds ${w * h} values, not ${values.length}`);
}

/** How many pixels of a wrapped map w by h stand alone in their row: differ from the pixel to the west and the pixel
 *  to the east, the row wrapping at the seam. 0 is a value like any other. A map one column wide has none. */
export function loneRuns(values: Uint8Array, w: number, h: number): number {
  sized(values, w, h);
  if (w < 2) return 0;
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const here = values[y * w + x];
      if (values[y * w + (x === 0 ? w - 1 : x - 1)] !== here && values[y * w + (x === w - 1 ? 0 : x + 1)] !== here) count++;
    }
  }
  return count;
}

/**
 * Mends a wrapped map in place so that no pixel stands alone in its row, and gives the number of pixels rewritten.
 * Each pixel that stands alone, taken from the north-west along each row in turn, joins a neighbour in its row: the
 * value to its west and east when they are the same; else whichever of the two the pixel above or below also holds,
 * the west first; else the west. Only pixels that stood alone are rewritten, and a pixel that joins a run makes no
 * other run shorter, so once through is enough. 0, a cloud map's clear, is a value like any other: a gap one pixel
 * wide closes and a cloud one pixel wide goes.
 */
export function mendMap(values: Uint8Array, w: number, h: number): number {
  sized(values, w, h);
  if (w < 2) return 0;
  let rewritten = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const here = values[y * w + x];
      const west = values[y * w + (x === 0 ? w - 1 : x - 1)] ?? 0;
      const east = values[y * w + (x === w - 1 ? 0 : x + 1)] ?? 0;
      if (west === here || east === here) continue;
      const above = y > 0 ? values[(y - 1) * w + x] : undefined;
      const below = y < h - 1 ? values[(y + 1) * w + x] : undefined;
      values[y * w + x] = west !== east && west !== above && west !== below && (east === above || east === below) ? east : west;
      rewritten++;
    }
  }
  return rewritten;
}
