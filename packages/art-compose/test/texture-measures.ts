// What a skin texture must not be, measured on a picture `after` painted over `before` (both w by h, 0 empty).
// Shared by the painter's tests and the test catalogue's.
export interface Picture { w: number; h: number; before: Uint8Array; after: Uint8Array }
const at = (a: Uint8Array, p: Picture, x: number, y: number): number => (x < 0 || y < 0 || x >= p.w || y >= p.h ? 0 : a[y * p.w + x] ?? 0);
const changed = (p: Picture, x: number, y: number): boolean => at(p.after, p, x, y) !== at(p.before, p, x, y);
const alone = (a: Uint8Array, p: Picture, x: number, y: number): boolean => {
  const v = at(a, p, x, y);
  return v !== 0 && at(a, p, x - 1, y) !== v && at(a, p, x + 1, y) !== v && at(a, p, x, y - 1) !== v && at(a, p, x, y + 1) !== v;
};
/** Pixels standing alone because of the texture: a texture pixel no neighbour above, below, left or right shares its value with, or an untouched pixel left that way when it was not so before. */
export function lonePixels(p: Picture): number {
  let n = 0;
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (alone(p.after, p, x, y) && (changed(p, x, y) || !alone(p.before, p, x, y))) n++;
  return n;
}
/** Two by two windows holding a texture pixel whose four drawn pixels are two values, each on one diagonal. */
export function checkers(p: Picture): number {
  let n = 0;
  for (let y = 0; y < p.h - 1; y++) {
    for (let x = 0; x < p.w - 1; x++) {
      const a = at(p.after, p, x, y); const b = at(p.after, p, x + 1, y);
      if (a === 0 || b === 0 || a === b || at(p.after, p, x, y + 1) !== b || at(p.after, p, x + 1, y + 1) !== a) continue;
      if (changed(p, x, y) || changed(p, x + 1, y) || changed(p, x, y + 1) || changed(p, x + 1, y + 1)) n++;
    }
  }
  return n;
}
/** Runs of four drawn pixels along a row or a column that are texture and not texture in turn. */
export function alternations(p: Picture): number {
  let n = 0;
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        let drawn = true;
        for (let k = 0; k < 4; k++) if (at(p.after, p, x + k * dx, y + k * dy) === 0) drawn = false;
        const c = changed(p, x, y);
        if (drawn && changed(p, x + dx, y + dy) !== c && changed(p, x + 2 * dx, y + 2 * dy) === c && changed(p, x + 3 * dx, y + 3 * dy) !== c) n++;
      }
    }
  }
  return n;
}
/** Texture pixels, as a share of the hide (the pixels drawn 1 to 12). */
export function coverage(p: Picture): number {
  let hide = 0; let texture = 0;
  for (let i = 0; i < p.before.length; i++) {
    if ((p.before[i] ?? 0) >= 1 && (p.before[i] ?? 0) <= 12) hide++;
    if (p.after[i] !== p.before[i]) texture++;
  }
  return hide === 0 ? 0 : texture / hide;
}
/**
 * How far the texture repeats itself: move it by one offset of at least two columns and at least two rows (up to twelve
 * each way) and take, of the texture pixels that land on a drawn pixel, the share that land on a texture pixel again;
 * the largest such share over the offsets that keep at least half the texture on the picture. A grid of dots, dashes
 * or lines repeats whole (1); clusters placed unevenly do not.
 */
export function repeat(p: Picture): number {
  const texture: number[] = [];
  for (let i = 0; i < p.before.length; i++) if (p.after[i] !== p.before[i]) texture.push(i);
  let worst = 0;
  for (let dy = 2; dy <= 12; dy++) {
    for (let dx = -12; dx <= 12; dx++) {
      if (Math.abs(dx) < 2) continue;
      let hits = 0; let landed = 0;
      for (const i of texture) {
        const x = (i % p.w) + dx; const y = Math.floor(i / p.w) + dy;
        if (at(p.after, p, x, y) !== 0) landed++;
        if (changed(p, x, y)) hits++;
      }
      if (landed * 2 >= texture.length && landed > 0) worst = Math.max(worst, hits / landed);
    }
  }
  return worst;
}
export const COVER_MOST = 0.3;
export const REPEAT_MOST = 0.75;
