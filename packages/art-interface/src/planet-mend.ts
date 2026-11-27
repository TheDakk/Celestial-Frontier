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

/**
 * How many pixels of a map w by h sit in no 2 by 2 square of their own value: the kits' two-pixel rule, under which
 * nothing is one pixel wide or one pixel tall. With `wrapped` a square may lie across the seam between the last
 * column and the first; it never lies across a pole. 0, clear, is a value like any other.
 */
export function thinPixels(values: Uint8Array, w: number, h: number, wrapped: boolean): number {
  sized(values, w, h);
  return w * h - squared(values, w, h, wrapped).reduce((sum, on) => sum + on, 0);
}

/** 1 for each pixel that sits in a like 2 by 2 square. */
function squared(values: Uint8Array, w: number, h: number, wrapped: boolean): Uint8Array {
  const held = new Uint8Array(w * h);
  if (w < 2) return held;
  const last = wrapped && w > 2 ? w : w - 1;
  for (let y = 0; y + 1 < h; y++) {
    for (let x = 0; x < last; x++) {
      const east = x + 1 === w ? 0 : x + 1;
      const v = values[y * w + x];
      if (values[y * w + east] !== v || values[(y + 1) * w + x] !== v || values[(y + 1) * w + east] !== v) continue;
      held[y * w + x] = held[y * w + east] = held[(y + 1) * w + x] = held[(y + 1) * w + east] = 1;
    }
  }
  return held;
}

/** How many pixels of a map w by h stand alone in their column: differ from the pixel above and the pixel below. A
 *  column does not wrap over a pole: a pixel in the first or the last row stands alone when it differs from the one
 *  pixel beside it in its column. A map one row high has none. */
export function loneRises(values: Uint8Array, w: number, h: number): number {
  sized(values, w, h);
  if (h < 2) return 0;
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const here = values[y * w + x];
      if ((y === 0 || values[(y - 1) * w + x] !== here) && (y === h - 1 || values[(y + 1) * w + x] !== here)) count++;
    }
  }
  return count;
}

/**
 * Mends a wrapped map in place by the kits' rule, so that every pixel sits in a like 2 by 2 square, and gives the
 * number of pixels rewritten. The map is cut into 2 by 2 tiles from its north-west corner (w and h are even). Every
 * tile that holds a pixel in no like square, a square across the seam counted, is painted whole in its most common
 * value, the first of them in reading order when two are as common; all such tiles at once; and again until no pixel
 * is left out. A painted tile is a square of its own for good, so this ends. Nothing is then one pixel wide or one
 * pixel tall, in a row or in a column.
 */
export function squareMend(values: Uint8Array, w: number, h: number): number {
  sized(values, w, h);
  if ((w & 1) === 1 || (h & 1) === 1 || w < 2 || h < 2) throw new Error(`a map mended in 2 by 2 tiles is an even number of pixels each way, not ${w} by ${h}`);
  let rewritten = 0;
  for (;;) {
    const held = squared(values, w, h, true);
    let left = false;
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const at = [y * w + x, y * w + x + 1, (y + 1) * w + x, (y + 1) * w + x + 1] as const;
        if (at.every((i) => held[i] === 1)) continue;
        left = true;
        const inks = at.map((i) => values[i] ?? 0);
        let [winner, most] = [inks[0] ?? 0, 0];
        for (const ink of inks) {
          const count = inks.filter((other) => other === ink).length;
          if (count > most) [winner, most] = [ink, count];
        }
        for (const i of at) if (values[i] !== winner) { values[i] = winner; rewritten++; }
      }
    }
    if (!left) return rewritten;
  }
}
