import { SKIN_NAMES, type PartFrame, type SizeTier, type SkinName } from '@cf/art-format';
import { handValue } from './marks';
import { SKIN_TABLE, STAMP_MOST, type Scatter, type Spacing } from './skins';

const LAST_DRAWN = 12;

/** A frame pixel the skin may change: drawn with a value 1 to 12 (never empty, eye, highlight, glow, outline, iris, bone or deep). */
const skinnable = (v: number): boolean => v >= 1 && v <= LAST_DRAWN;
/** The colour ramp a value 1 to 12 belongs to: 0 for 1-4, 1 for 5-8, 2 for 9-12. */
const rampOf = (v: number): number => (v - 1) >> 2;
/** A whole number 0 to 2^32 - 1 from three whole numbers, the same on every device (32-bit integer multiplies and shifts only). */
function roll(seed: number, a: number, b: number): number {
  let h = Math.imul((seed | 0) ^ 0x2545f491, 0x9e3779b1);
  h = Math.imul(h ^ (a | 0), 0x165667b1);
  h = Math.imul(h ^ (b | 0), 0x27d4eb2f);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  return (h ^ (h >>> 13)) >>> 0;
}

/**
 * Paints the creature's skin texture into a copy of `pixels`, one part frame's pixels with its marks already painted
 * (the original draws the skin over the patterned hide). A hand-drawn layer named for the skin wins, exactly as a
 * hand-drawn marks layer does: each value 1 to 12 or 21 to 28 (bone, deep) it holds replaces the pixel, in any ramp. Otherwise the skin's rule
 * (skins.ts) steps texture pixels one shade inside their own ramp, so the rule never moves a mark out of its ramp.
 * Only a pixel drawn 1 to 12 is ever written, so bone and deep (21 to 28) never take a skin; the rule writes only a value 1 to 12.
 * A textured rule (scatter, seams, plates) draws solid clusters sized for `tier` and placed by `seed` (any whole number: the
 * same frame, pixels, skin, tier and seed give the same picture on every device), and leaves no lone pixel, no two by two
 * checker and no run of every other pixel behind (settle).
 * Returns a new array, or `null` when the rule is `none` and the frame has no layer named for the skin.
 * Never changes its inputs. Pixels of any length but the frame's w x h throw a RangeError: a wrong array is refused,
 * never painted truncated or misaligned.
 */
export function paintSkin(frame: PartFrame, pixels: Uint8Array, skin: SkinName, tier: SizeTier, seed: number): Uint8Array | null {
  if (pixels.length !== frame.w * frame.h) throw new RangeError(`paintSkin: ${pixels.length} pixels for a ${frame.w}x${frame.h} frame`);
  const hand = frame.layers?.[skin];
  const rule = SKIN_TABLE[skin];
  const out = Uint8Array.from(pixels);
  const { w, h } = frame;

  if (hand !== undefined) {
    for (let i = 0; i < out.length; i++) {
      const host = pixels[i] ?? 0;
      const v = hand[i] ?? 0;
      // As a hand-drawn marks layer: any hide, bone or deep value replaces a drawn pixel. A frame built in code could hold
      // any value in its hand layer, so a reserved value is never written.
      if (skinnable(host) && handValue(v)) out[i] = v;
    }
    return out;
  }
  if (rule.mode === 'none') return null;

  if (rule.mode === 'edge') {
    for (let i = 0; i < out.length; i++) {
      const host = pixels[i] ?? 0;
      const above = i < w ? 0 : pixels[i - w] ?? 0;
      if (skinnable(host) && above === 0 && skinnable(host + 1) && rampOf(host + 1) === rampOf(host)) out[i] = host + 1;
    }
    return out;
  }

  const shape = shapeOf(w, h, pixels);
  if (shape === null) return out;
  const draft: Draft = { w, h, pixels, wish: new Int8Array(w * h), cluster: new Int32Array(w * h), clusters: 0, xs: [], ys: [] };
  const salted = roll(seed, SKIN_NAMES.indexOf(skin), 0);
  if (rule.mode === 'scatter') scatter(draft, shape, rule.tiers[tier], salted);
  else lines(draft, shape, rule.tiers[tier], rule.mode === 'plates', salted);
  for (let k = 0; k < draft.xs.length; k++) {
    const i = (draft.ys[k] as number) * w + (draft.xs[k] as number);
    out[i] = (pixels[i] ?? 0) + (draft.wish[i] ?? 0);
  }
  settle(w, h, pixels, out, draft.cluster, draft.xs, draft.ys);
  return out;
}

/** Whether paintSkin textures this frame by the skin's rule: the frame has no layer drawn for the skin, and the rule is one that draws clusters or lines (not slick's edge light, not `none`). */
export function texturedByRule(frame: PartFrame, skin: SkinName): boolean {
  const mode = SKIN_TABLE[skin].mode;
  return frame.layers?.[skin] === undefined && mode !== 'none' && mode !== 'edge';
}

/**
 * The texture before it is painted. `wish`: the shade change of each pixel, -1 darker, 1 lighter, 0 none; only ever set
 * on a pixel that can take it (steps), and each such pixel is listed once in `xs`, `ys`. `cluster`: the number, from 1, of the scattered cluster a wished pixel belongs
 * to (below 0: a loose cluster's, which may be taken back pixel by pixel), 0 for a pixel of a line or none.
 */
interface Draft { w: number; h: number; pixels: Uint8Array; wish: Int8Array; cluster: Int32Array; clusters: number; xs: number[]; ys: number[] }

/** Sets the wish of a pixel that has none, and lists the pixel. */
function wishFor(d: Draft, x: number, y: number, step: number): void {
  d.wish[y * d.w + x] = step;
  d.xs.push(x);
  d.ys.push(y);
}

/** Whether the pixel at (x, y) is hide that can move by `step` inside its own ramp. */
function steps(d: Draft, x: number, y: number, step: number): boolean {
  if (x < 0 || y < 0 || x >= d.w || y >= d.h) return false;
  const host = d.pixels[y * d.w + x] ?? 0;
  return skinnable(host) && skinnable(host + step) && rampOf(host + step) === rampOf(host);
}

/** A box of pixels, both corners inside it. */
export interface Box { x0: number; y0: number; x1: number; y1: number }
/** Where a frame's hide lies: the box round its skinnable pixels, the first and last skinnable row of each column and the first and last skinnable column of each row (-1: none). */
interface Shape extends Box { top: Int16Array; bottom: Int16Array; left: Int16Array; right: Int16Array }

function shapeOf(w: number, h: number, pixels: Uint8Array): Shape | null {
  const top = new Int16Array(w).fill(-1);
  const bottom = new Int16Array(w).fill(-1);
  const left = new Int16Array(h).fill(-1);
  const right = new Int16Array(h).fill(-1);
  let x0 = w; let x1 = -1; let y0 = h; let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!skinnable(pixels[y * w + x] ?? 0)) continue;
      if (top[x] === -1) top[x] = y;
      bottom[x] = y;
      if (left[y] === -1) left[y] = x;
      right[y] = x;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, x1, y0, y1, top, bottom, left, right };
}

/** Sets a line's wish where the pixel can take it and has none. */
function want(d: Draft, x: number, y: number, step: number): void {
  if (steps(d, x, y, step) && d.wish[y * d.w + x] === 0) wishFor(d, x, y, step);
}

/**
 * At most one cluster for each kept cell of a staggered grid over the hide's box. The cell's roll picks a stamp and where
 * in the cell its top-left is tried first; the other places of the cell follow in turn, then the other stamps. The
 * cluster is drawn at the first place it fits (fitting) with no pixel of an earlier cluster within two columns and two
 * rows of any of its own, so two clusters are never nearer than two pixels and no row or column runs cluster, gap,
 * cluster, gap. A cell with no such place stays bare.
 */
function scatter(d: Draft, shape: Shape, rule: Scatter, seed: number): void {
  const near = new Uint8Array(d.w * d.h); // 1: within two columns and two rows of a cluster's pixel
  const crowded = (stamp: readonly string[], x: number, y: number): boolean => {
    for (let sy = 0; sy < stamp.length; sy++) {
      const row = stamp[sy] as string;
      for (let sx = 0; sx < row.length; sx++) if (row[sx] !== '.' && near[(y + sy) * d.w + x + sx] === 1) return true;
    }
    return false;
  };
  const claim = (x: number, y: number): void => {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx; const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < d.w && ny < d.h) near[ny * d.w + nx] = 1;
      }
    }
  };
  let odd = false;
  let j = 0;
  for (let cellY = shape.y0; cellY <= shape.y1; cellY += rule.down) {
    let i = 0;
    for (let cellX = shape.x0 - (odd ? rule.stagger : 0); cellX <= shape.x1; cellX += rule.across) {
      const r = roll(seed, i, j);
      i++;
      if (r % 100 >= rule.keep || !reaches(shape, cellX, cellY, cellX + rule.across + STAMP_MOST, cellY + rule.down + STAMP_MOST)) continue;
      let placed = false;
      for (let ts = 0; ts < rule.stamps.length && !placed; ts++) {
        const stamp = rule.stamps[((r >>> 8) + ts) % rule.stamps.length] as readonly string[];
        for (let ty = 0; ty < rule.down && !placed; ty++) {
          for (let tx = 0; tx < rule.across && !placed; tx++) {
            const x = cellX + ((r >>> 12) + tx) % rule.across;
            const y = cellY + ((r >>> 16) + ty) % rule.down;
            const parts = fitting(d, stamp, x, y, rule.loose);
            if (parts === 0 || crowded(stamp, x, y)) continue;
            placed = true;
            d.clusters++;
            for (let sy = 0; sy < stamp.length; sy++) {
              const row = stamp[sy] as string;
              for (let sx = 0; sx < row.length; sx++) {
                const c = row[sx];
                if (c === '.') continue;
                // A part left out still keeps its place, so the next cluster stays clear of the whole stamp.
                claim(x + sx, y + sy);
                d.cluster[(y + sy) * d.w + x + sx] = rule.loose ? -d.clusters : d.clusters;
                const step = c === 'L' ? 1 : -1;
                if ((parts & (c === 'L' ? LIGHT : DARK)) !== 0 && steps(d, x + sx, y + sy, step)) wishFor(d, x + sx, y + sy, step);
              }
            }
          }
        }
      }
    }
    j++;
    odd = !odd;
  }
}

/** Whether any hide lies in the box x0..x1, y0..y1: a cell's own box grown by the largest stamp holds every cluster tried from it. */
function reaches(shape: Shape, x0: number, y0: number, x1: number, y1: number): boolean {
  for (let y = y0 < 0 ? 0 : y0; y <= y1 && y < shape.left.length; y++) {
    const l = shape.left[y] ?? -1;
    if (l >= 0 && l <= x1 && (shape.right[y] ?? -1) >= x0) return true;
  }
  return false;
}

const DARK = 1;
const LIGHT = 2;

/**
 * Which of a cluster's two parts can be drawn with its top-left at (x, y): DARK, LIGHT, both or neither (0). Every pixel
 * of the cluster must be hide, the darker pixels all on one value and the lighter pixels all on one value, so a cluster
 * never straddles the edge of a shadow or of a mark. A part whose pixels lie on the last shade of their ramp cannot take
 * its change and is left out (on the lightest hide only the darker part is drawn; on the darkest only the lighter).
 * A `loose` cluster need only lie whole on the hide: it may cross shades, and each of its pixels changes where it can.
 */
function fitting(d: Draft, stamp: readonly string[], x: number, y: number, loose: boolean): number {
  let under = 0; // the hide value under the darker pixels, once known
  let over = 0;
  for (let sy = 0; sy < stamp.length; sy++) {
    const row = stamp[sy] as string;
    for (let sx = 0; sx < row.length; sx++) {
      const c = row[sx];
      if (c === '.') continue;
      const px = x + sx; const py = y + sy;
      const host = px < 0 || py < 0 || px >= d.w || py >= d.h ? 0 : d.pixels[py * d.w + px] ?? 0;
      if (!skinnable(host)) return 0;
      if (loose) continue;
      if (c === 'L') {
        if (over !== 0 && host !== over) return 0;
        over = host;
      } else {
        if (under !== 0 && host !== under) return 0;
        under = host;
      }
    }
  }
  if (loose) return DARK | LIGHT;
  const canStep = (host: number, step: number): boolean => host !== 0 && skinnable(host + step) && rampOf(host + step) === rampOf(host);
  return (canStep(under, -1) ? DARK : 0) | (canStep(over, 1) ? LIGHT : 0);
}

/**
 * Lines across the short side of the hide, unevenly spaced. A part wider than tall: each line runs down a column, bowed
 * one column toward the front through its middle half. A part taller than wide: each line runs along a row.
 * Seams: the dark line with a lit line beside it (behind it; under it on a tall part), the lit line along half of it only
 * (the upper half; the back half on a tall part).
 * Plates: the stretch between two lines is one plate: its dark side line and dark lower rim reach five eighths of the way
 * down the hide, and a lit line runs one pixel under its top edge. On a tall part a plate is a band: lit second row, dark last row.
 */
function lines(d: Draft, shape: Shape, rule: Spacing, plates: boolean, seed: number): void {
  const wide = shape.x1 - shape.x0 >= shape.y1 - shape.y0;
  if (wide) {
    let from = shape.x0;
    for (let k = 0; from <= shape.x1; k++) {
      const to = from + rule.gap + roll(seed, k, 1) % (rule.jitter + 1); // the line's column; the next plate starts after it
      if (plates) {
        const mid = (from + (to < shape.x1 ? to : shape.x1)) >> 1;
        const tall = (shape.bottom[mid] ?? -1) - (shape.top[mid] ?? -1) + 1;
        const depth = (tall * 5) >> 3;
        if (depth >= 3) {
          for (let x = from; x <= to && x <= shape.x1; x++) {
            const t = shape.top[x] ?? -1;
            if (t < 0) continue;
            if (x > from && x < to - 1) want(d, x, t + 1, 1);
            want(d, x, t + depth, -1);
            if (x === to) for (let y = t; y < t + depth; y++) want(d, x, y, -1);
          }
        }
      } else if (to <= shape.x1) {
        const t = shape.top[to] ?? -1;
        const tall = (shape.bottom[to] ?? -1) - t + 1;
        const quarter = tall >> 2;
        for (let y = t; t >= 0 && y < t + tall; y++) {
          const bow = y - t >= quarter && y - t < tall - quarter ? 1 : 0;
          want(d, to + bow, y, -1);
          if (y - t < tall >> 1) want(d, to + bow - 1, y, 1);
        }
      }
      from = to + 1;
    }
    return;
  }
  let from = shape.y0;
  for (let k = 0; from <= shape.y1; k++) {
    const to = from + rule.gap + roll(seed, k, 1) % (rule.jitter + 1);
    if (to <= shape.y1) {
      for (let x = shape.x0; x <= shape.x1; x++) {
        want(d, x, to, -1);
        if (plates) want(d, x, from + 1, 1);
        else if (x <= (shape.x0 + shape.x1) >> 1) want(d, x, to + 1, 1);
      }
    }
    from = to + 1;
  }
}

/**
 * Takes back, until nothing more is taken back, every texture pixel that would stand alone or make a mesh: `out` is a
 * picture w by h, `before` the same picture without its texture, and a texture pixel is one that differs. Taken back are
 * a texture pixel no neighbour above, below, left or right shares its value with; the texture pixels beside an untouched
 * pixel left that way when it was not so before; the texture pixels of a two by two checker (two values, each on one
 * diagonal); and the texture pixels of a run of four or more along a row or column that are texture and not in turn.
 * paintSkin does this to each part it textures, taking a scattered cluster back whole so none is left in pieces; the
 * composer calls this once more on the whole creature, where one part may hide half of another's cluster. No texture
 * lies outside `box`.
 */
export function settleTexture(w: number, h: number, before: Uint8Array, out: Uint8Array, box: Box): void {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = box.y0 < 0 ? 0 : box.y0; y <= box.y1 && y < h; y++) {
    for (let x = box.x0 < 0 ? 0 : box.x0; x <= box.x1 && x < w; x++) {
      if (out[y * w + x] === before[y * w + x]) continue;
      xs.push(x); ys.push(y);
    }
  }
  settle(w, h, before, out, null, xs, ys);
}

/** settleTexture on the texture pixels listed in `xs`, `ys` (every pixel of `out` that differs from `before`, each once). With `cluster`, a pixel numbered above 0 takes its whole cluster back with it. */
function settle(w: number, h: number, before: Uint8Array, out: Uint8Array, cluster: Int32Array | null, xs: readonly number[], ys: readonly number[]): void {
  // The texture pixels as a mask; a pixel taken back leaves it.
  const texture = new Uint8Array(w * h);
  for (let k = 0; k < xs.length; k++) texture[(ys[k] as number) * w + (xs[k] as number)] = 1;
  if (xs.length === 0) return;
  const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h;
  /** Whether the drawn pixel at (x, y) shares its value with no neighbour above, below, left or right (outside the picture is no neighbour). */
  const alone = (a: Uint8Array, x: number, y: number): boolean => {
    const i = y * w + x;
    const v = a[i];
    return v !== 0 && !(x > 0 && a[i - 1] === v) && !(x < w - 1 && a[i + 1] === v) && !(y > 0 && a[i - w] === v) && !(y < h - 1 && a[i + w] === v);
  };
  const gone = new Set<number>();
  let again = true;
  const back = (x: number, y: number): void => {
    const i = y * w + x;
    if (!inside(x, y) || texture[i] === 0) return;
    out[i] = before[i] ?? 0;
    texture[i] = 0;
    const c = cluster === null ? 0 : cluster[i] ?? 0;
    if (c > 0) gone.add(c);
    again = true;
  };
  /** An untouched pixel left alone when it was not so before: its texture neighbours go back. */
  const freed = (x: number, y: number): void => {
    if (!inside(x, y) || texture[y * w + x] === 1 || !alone(out, x, y) || alone(before, x, y)) return;
    back(x - 1, y); back(x + 1, y); back(x, y - 1); back(x, y + 1);
  };
  /** The two by two window with its top-left at (x, y): a checker (two values, each on one diagonal) holding a texture pixel goes back. */
  const checker = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) return;
    const i = y * w + x;
    const a = out[i]; const b = out[i + 1];
    if (a === 0 || b === 0 || a === b || out[i + w] !== b || out[i + w + 1] !== a) return;
    if (texture[i] === 0 && texture[i + 1] === 0 && texture[i + w] === 0 && texture[i + w + 1] === 0) return;
    back(x, y); back(x + 1, y); back(x, y + 1); back(x + 1, y + 1);
  };
  /** The four pixels from (x, y) along (dx, dy): all drawn, texture and not in turn, they go back. */
  const run = (x: number, y: number, dx: number, dy: number): void => {
    if (x < 0 || y < 0 || x + 3 * dx >= w || y + 3 * dy >= h) return;
    const i = y * w + x;
    const step = dy * w + dx;
    if (out[i] === 0 || out[i + step] === 0 || out[i + 2 * step] === 0 || out[i + 3 * step] === 0) return;
    const first = texture[i];
    if (texture[i + step] === first || texture[i + 2 * step] !== first || texture[i + 3 * step] === first) return;
    for (let n = 0; n < 4; n++) back(x + n * dx, y + n * dy);
  };
  // Every fault holds a texture pixel or sits beside one, so only the texture pixels and what is round them are looked at.
  while (again) {
    again = false;
    for (let k = 0; k < xs.length; k++) {
      const x = xs[k] as number; const y = ys[k] as number;
      const i = y * w + x;
      if (texture[i] === 0) continue;
      if (alone(out, x, y)) { back(x, y); continue; }
      freed(x - 1, y); freed(x + 1, y); freed(x, y - 1); freed(x, y + 1);
      checker(x - 1, y - 1); checker(x, y - 1); checker(x - 1, y); checker(x, y);
      // Such a run holds texture, a gap of one, texture: it starts at the first of those or one pixel before it.
      if (x + 2 < w && texture[i + 1] === 0 && texture[i + 2] === 1) { run(x, y, 1, 0); run(x - 1, y, 1, 0); }
      if (y + 2 < h && texture[i + w] === 0 && texture[i + 2 * w] === 1) { run(x, y, 0, 1); run(x, y - 1, 0, 1); }
    }
    if (gone.size > 0) {
      for (let i = 0; cluster !== null && i < out.length; i++) {
        if (texture[i] === 1 && gone.has(cluster[i] ?? 0)) { out[i] = before[i] ?? 0; texture[i] = 0; }
      }
      gone.clear();
    }
  }
}
