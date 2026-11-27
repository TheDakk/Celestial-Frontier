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
/** Runs of four drawn pixels along a row or a column that are two values in turn, with a texture pixel among them: what a run of every other pixel is on armour, whose pieces hold pixels left as they were. */
export function turns(p: Picture): number {
  let n = 0;
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        const v = [0, 1, 2, 3].map((k) => at(p.after, p, x + k * dx, y + k * dy));
        if (v.includes(0) || v[0] === v[1] || v[0] !== v[2] || v[1] !== v[3]) continue;
        if ([0, 1, 2, 3].some((k) => changed(p, x + k * dx, y + k * dy))) n++;
      }
    }
  }
  return n;
}
/** The longest run of drawn pixels along a row or a column that are texture and hide in turn, whatever their values, from a texture pixel: a comb. */
export function comb(p: Picture): number {
  let most = 0;
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      if (!changed(p, x, y)) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        let n = 0;
        while (at(p.after, p, x + n * dx, y + n * dy) !== 0 && changed(p, x + n * dx, y + n * dy) === (n % 2 === 0)) n++;
        if (n > most) most = n;
      }
    }
  }
  return most;
}
/**
 * Specks: pieces of one value, joined above, below, left or right, of four pixels or fewer, that hold a texture pixel.
 * Armour on a flat middle shade leaves its faces as the hide was and its edges joined, so it has next to none; a mesh
 * of dots or small blocks laid over the faces is all specks.
 */
export function specks(p: Picture): number {
  const seen = new Uint8Array(p.w * p.h);
  let n = 0;
  for (let start = 0; start < seen.length; start++) {
    const v = p.after[start] ?? 0;
    if (seen[start] === 1 || v === 0) continue;
    const queue = [start];
    seen[start] = 1;
    let size = 0; let texture = false;
    while (queue.length > 0) {
      const i = queue.pop() as number;
      size++;
      if (p.after[i] !== p.before[i]) texture = true;
      const x = i % p.w;
      for (const j of [x > 0 ? i - 1 : -1, x < p.w - 1 ? i + 1 : -1, i - p.w, i + p.w]) {
        if (j < 0 || j >= seen.length || seen[j] === 1 || p.after[j] !== v) continue;
        seen[j] = 1;
        queue.push(j);
      }
    }
    if (texture && size <= 4) n++;
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
/**
 * How regular the spacing of the texture's pieces is, on any hide but meant for a flat one. A piece is a run of texture
 * pixels joined above, below, left or right; its place is its first pixel (topmost, then leftmost). Move every place by
 * one offset (up to sixteen each way, at least three in one direction; straight along a row or a column counts) and
 * take, of the places that land on a drawn pixel, the share that land within one pixel of another piece's place; the
 * largest such share over the offsets that keep at least half the places on the picture. A grid scores 1, a grid
 * whose pieces are each nudged a pixel still well over a half; pieces placed with no fixed pitch do not.
 */
export function pitch(p: Picture): number {
  const place = new Uint8Array(p.w * p.h);
  const seen = new Uint8Array(p.w * p.h);
  const xs: number[] = []; const ys: number[] = [];
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      if (seen[y * p.w + x] === 1 || !changed(p, x, y)) continue;
      place[y * p.w + x] = 1; xs.push(x); ys.push(y);
      const queue = [[x, y]];
      seen[y * p.w + x] = 1;
      while (queue.length > 0) {
        const [qx, qy] = queue.pop() as [number, number];
        for (const [nx, ny] of [[qx - 1, qy], [qx + 1, qy], [qx, qy - 1], [qx, qy + 1]] as const) {
          if (nx < 0 || ny < 0 || nx >= p.w || ny >= p.h || seen[ny * p.w + nx] === 1 || !changed(p, nx, ny)) continue;
          seen[ny * p.w + nx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }
  const near = (x: number, y: number): boolean => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < p.w && y + dy < p.h && place[(y + dy) * p.w + x + dx] === 1) return true;
    return false;
  };
  let worst = 0;
  for (let dy = 0; dy <= 16; dy++) {
    for (let dx = -16; dx <= 16; dx++) {
      if (Math.max(Math.abs(dx), dy) < 3 || (dy === 0 && dx < 0)) continue;
      let hits = 0; let landed = 0;
      for (let k = 0; k < xs.length; k++) {
        const x = (xs[k] as number) + dx; const y = (ys[k] as number) + dy;
        if (at(p.after, p, x, y) === 0) continue;
        landed++;
        if (near(x, y)) hits++;
      }
      if (landed * 2 >= xs.length && landed > 0) worst = Math.max(worst, hits / landed);
    }
  }
  return worst;
}
/** The most of the hide a texture may cover. */
export const COVER_MOST = 0.3;
/** The most a texture may repeat (`repeat`): half, for scattered clusters anywhere and for lines on a flat hide. */
export const REPEAT_MOST = 0.5;
/** The most a line skin's few lines on one body may repeat: with three or four lines, one landing on the next is a third of them. */
export const LINES_ON_A_BODY_REPEAT_MOST = 0.75;
/** The most regular the spacing of scattered clusters may be (`pitch`): a grid nudged a pixel each way scores about 0.64. */
export const PITCH_MOST = 0.5;
