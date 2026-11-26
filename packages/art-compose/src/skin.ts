import { SKIN_NAMES, type PartFrame, type SizeTier, type SkinName } from '@cf/art-format';
import { handValue } from './marks';
import { SKIN_TABLE, type Scatter, type Spacing } from './skins';

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
  if (hand === undefined && rule.mode === 'none') return null;
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
  if (rule.mode === 'none') return null; // not reached: a rule of none with no layer returned above

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
/** Where a frame's hide lies: the box round its skinnable pixels, and the first and last skinnable row of each column (-1: none). */
interface Shape extends Box { top: Int16Array; bottom: Int16Array }

function shapeOf(w: number, h: number, pixels: Uint8Array): Shape | null {
  const top = new Int16Array(w).fill(-1);
  const bottom = new Int16Array(w).fill(-1);
  let x0 = w; let x1 = -1; let y0 = h; let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!skinnable(pixels[y * w + x] ?? 0)) continue;
      if (top[x] === -1) top[x] = y;
      bottom[x] = y;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, x1, y0, y1, top, bottom };
}

/** Sets a line's wish where the pixel has none: `step` where it can take it, else one shade less of it (two darker falls back to one darker). */
function want(d: Draft, x: number, y: number, step: number): void {
  if (x < 0 || y < 0 || x >= d.w || y >= d.h || d.wish[y * d.w + x] !== 0) return;
  if (steps(d, x, y, step)) wishFor(d, x, y, step);
  else if (step < -1 && steps(d, x, y, step + 1)) wishFor(d, x, y, step + 1);
}

// Where a cluster is tried round the place its roll gave it, in turn.
const NUDGE_X = [0, 1, 0, -1, 0, 1, -1, 1, -1];
const NUDGE_Y = [0, 0, 1, 0, -1, 1, -1, -1, 1];

/**
 * Clusters thrown over the hide's box: one throw for every `room` pixels of the box, each at a place rolled from the
 * seed anywhere in the box, so the clusters have no fixed pitch along a row or down a column. The roll also picks the
 * stamp; it is tried at the place and at the eight pixels round it, then the other stamps are, then the spare (smaller)
 * ones, which is what a thin part such as a leg mostly takes. The cluster is drawn at the first place it fits (fitting)
 * with no pixel of an earlier cluster within two columns and two rows of any of its own, so two clusters are never nearer
 * than two pixels and no row or column runs cluster, gap, cluster, gap. A throw with no such place draws nothing.
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
  /** Draws the stamp with its top-left at (x, y) if it fits there clear of the others. */
  const draw = (stamp: readonly string[], x: number, y: number): boolean => {
    const parts = fitting(d, stamp, x, y, rule.loose);
    if (parts === 0 || crowded(stamp, x, y)) return false;
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
        if ((parts & (c === 'L' ? LIGHT : DARK)) === 0) continue;
        if (steps(d, x + sx, y + sy, step)) wishFor(d, x + sx, y + sy, step);
        // A loose cluster's pixel on the last shade of its ramp steps the other way, so the facet keeps its whole shape.
        else if (rule.loose && steps(d, x + sx, y + sy, -step)) wishFor(d, x + sx, y + sy, -step);
      }
    }
    return true;
  };
  const wide = shape.x1 - shape.x0 + 1;
  const tall = shape.y1 - shape.y0 + 1;
  let k = 0;
  for (let left = wide * tall; left > 0; left -= rule.room) {
    const x = shape.x0 + roll(seed, k, 0) % wide;
    const y = shape.y0 + roll(seed, k, 1) % tall;
    const first = roll(seed, k, 2) % rule.stamps.length;
    k++;
    let placed = false;
    for (let t = 0; t < rule.stamps.length + rule.spare.length && !placed; t++) {
      const stamp = (t < rule.stamps.length ? rule.stamps[(first + t) % rule.stamps.length] : rule.spare[t - rule.stamps.length]) as readonly string[];
      for (let n = 0; n < NUDGE_X.length && !placed; n++) placed = draw(stamp, x + (NUDGE_X[n] as number), y + (NUDGE_Y[n] as number));
    }
  }
}

const DARK = 1;
const LIGHT = 2;

/**
 * Which of a cluster's two parts can be drawn with its top-left at (x, y): DARK, LIGHT, both or neither (0). Every pixel
 * of the cluster must be hide of one value, so a cluster never straddles the edge of a shadow or of a mark, in any
 * direction. A part that value cannot take (it is the last shade of its ramp) is left out: on the lightest hide only
 * the darker part is drawn, on the darkest only the lighter.
 * A `loose` cluster need only lie whole on the hide: it may cross shades, and a pixel of it that cannot take its change
 * takes the opposite one (scatter).
 */
function fitting(d: Draft, stamp: readonly string[], x: number, y: number, loose: boolean): number {
  let under = 0; // the hide value under the cluster, once known
  let dark = false; let light = false;
  for (let sy = 0; sy < stamp.length; sy++) {
    const row = stamp[sy] as string;
    for (let sx = 0; sx < row.length; sx++) {
      const c = row[sx];
      if (c === '.') continue;
      const px = x + sx; const py = y + sy;
      const host = px < 0 || py < 0 || px >= d.w || py >= d.h ? 0 : d.pixels[py * d.w + px] ?? 0;
      if (!skinnable(host) || (!loose && under !== 0 && host !== under)) return 0;
      under = host;
      if (c === 'L') light = true; else dark = true;
    }
  }
  if (loose) return DARK | LIGHT;
  const canStep = (step: number): boolean => skinnable(under + step) && rampOf(under + step) === rampOf(under);
  return (dark && canStep(-1) ? DARK : 0) | (light && canStep(1) ? LIGHT : 0);
}

/** How many of the spacings the next line's is moved on by: it shares no factor with any tier's count of spacings (jitter + 1). */
const SPACING_STRIDE = 5;
/**
 * The distance from line `k` to the next: `gap` to `gap + jitter`. The seed rolls where the round of spacings starts;
 * each line then takes the spacing a stride further round, so no spacing comes twice before every other has come once
 * and neighbouring lines are never evenly ruled.
 */
function spacing(rule: Spacing, seed: number, k: number): number {
  return rule.gap + (roll(seed, 0, 1) + k * SPACING_STRIDE) % (rule.jitter + 1);
}

/**
 * Lines across the short side of the hide, unevenly spaced (`gap` to `gap + jitter` apart, by the seed: spacing).
 * A part wider than tall (a body, a head, a tail):
 * - seams (chitin): narrow segments along the body. Each seam is a line two shades darker down the hide from its top edge
 *   (to the underside, or short of it by a rolled part of the lower half), bowed one
 *   column toward the front through its middle half, with, on a hide twelve or more tall, a line one shade darker behind it over its top third (the
 *   segment in front overlaps the one behind), and a gloss: a block two columns wide and a quarter of the hide tall, one
 *   shade lighter, just in front of the seam under the top edge.
 * - plates: broad sections. Each has a lit upper edge under its top edge (two rows thick on a hide twelve or more tall), a seam two shades darker down
 *   its front side to five eighths of the hide's height, and a lower rim one shade darker along that height.
 * A part taller than wide (a leg) takes the lighter version: lines one shade darker along rows, as joints; a plate's
 * band has a lit second row besides.
 */
function lines(d: Draft, shape: Shape, rule: Spacing, plates: boolean, seed: number): void {
  const wide = shape.x1 - shape.x0 >= shape.y1 - shape.y0;
  if (!wide) {
    let from = shape.y0;
    for (let k = 0; from <= shape.y1; k++) {
      const to = from + spacing(rule, seed, k);
      if (to <= shape.y1) {
        for (let x = shape.x0; x <= shape.x1; x++) {
          want(d, x, to, -1);
          if (plates) want(d, x, from + 1, 1);
        }
      }
      from = to + 1;
    }
    return;
  }
  let from = shape.x0;
  for (let k = 0; from <= shape.x1; k++) {
    const to = from + spacing(rule, seed, k); // the line's column; the next section starts after it
    if (plates) {
      const mid = (from + (to < shape.x1 ? to : shape.x1)) >> 1;
      const tall = (shape.bottom[mid] ?? -1) - (shape.top[mid] ?? -1) + 1;
      const depth = (tall * 5) >> 3;
      if (depth >= 4) {
        for (let x = from; x <= to && x <= shape.x1; x++) {
          const t = shape.top[x] ?? -1;
          if (t < 0) continue;
          if (x === to) { for (let y = t; y <= t + depth; y++) want(d, x, y, -2); continue; }
          if (x > from && x < to - 1) { want(d, x, t + 1, 1); if (tall >= 12) want(d, x, t + 2, 1); }
          want(d, x, t + depth, -1);
        }
      }
    } else if (to <= shape.x1) {
      const t = shape.top[to] ?? -1;
      const tall = (shape.bottom[to] ?? -1) - t + 1;
      const quarter = tall >> 2;
      // The seam stops short of the underside by a rolled part of the lower half, so no two seams are one line moved along.
      const reach = tall - (tall >= 8 ? roll(seed, k, 2) % (tall >> 1) : 0);
      for (let y = t; t >= 0 && y < t + reach; y++) {
        const bow = y - t >= quarter && y - t < tall - quarter ? 1 : 0;
        want(d, to + bow, y, -2);
        if (tall >= 12 && (y - t) * 3 < tall) want(d, to + bow - 1, y, -1);
      }
      for (let y = t + 1; t >= 0 && quarter >= 2 && y <= t + quarter; y++) { want(d, to + 2, y, 1); want(d, to + 3, y, 1); }
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
