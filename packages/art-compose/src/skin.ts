import { SKIN_NAMES, type PartFrame, type SizeTier, type SkinName } from '@cf/art-format';
import { handValue } from './marks';
import { SKIN_TABLE, type Plates, type Scatter, type Segments, type Spacing } from './skins';

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
 * (skins.ts) moves texture pixels to another shade of their own ramp, so the rule never moves a mark out of its ramp.
 * Only a pixel drawn 1 to 12 is ever written, so bone and deep (21 to 28) never take a skin; the rule writes only a value 1 to 12.
 * A textured rule draws solid clusters sized for `tier` and placed by `seed` (any whole number: the same frame, pixels,
 * skin, tier and seed give the same picture on every device), and leaves no lone pixel, no two by two checker and no
 * run of every other pixel behind (settle). Scattered clusters step a pixel one shade. Armour (plates and chitin on a
 * large creature; a small or medium one keeps thin lines) is drawn as whole pieces, each one flat shade of the hide under it with a lit edge, a shadow and a dark rim, so it reads with
 * the same steps on a pale hide and on a dark one.
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

  // The hide the texture may use: the frame's pixels with a box round every eye point emptied, so nothing lies under an eye.
  const hide = clearOfEyes(frame, pixels, EYE_CLEAR[tier], armoured(skin, tier));
  const shape = shapeOf(w, h, hide);
  if (shape === null) return out;
  const salted = roll(seed, SKIN_NAMES.indexOf(skin), 0);
  const upright = shape.x1 - shape.x0 < shape.y1 - shape.y0;
  if (rule.mode === 'scatter' || !armoured(skin, tier) || (!upright && allArms(shape, hide, w))) {
    // Scattered clusters; the lines a small or medium creature's plates and chitin are still drawn as; and the same
    // lines on a large body that is mostly arms (an octopus, a jelly), where pieces of armour would cut the arms up.
    const draft: Draft = { w, h, pixels: hide, wish: new Int8Array(w * h), cluster: new Int32Array(w * h), clusters: 0, xs: [], ys: [] };
    if (rule.mode === 'scatter') scatter(draft, shape, rule.tiers[tier], salted);
    else lines(draft, shape, tier === 'small' ? rule.lines.small : tier === 'medium' ? rule.lines.medium : rule.lines.large, rule.mode === 'plates', salted);
    for (let k = 0; k < draft.xs.length; k++) {
      const i = (draft.ys[k] as number) * w + (draft.xs[k] as number);
      out[i] = (pixels[i] ?? 0) + (draft.wish[i] ?? 0);
    }
    settle(w, h, pixels, out, draft.cluster, draft.xs, draft.ys);
    return out;
  }
  // Armour: each plate or segment is one piece of one shade, the hide's own there, with its edges lit and shaded from it.
  const armour: Armour = { w, h, hide, tone: new Uint8Array(w * h), shade: new Int8Array(w * h).fill(-1), piece: [] };
  if (rule.mode === 'plates') {
    if (upright) greaves(armour, shape, rule.armour, salted);
    else shields(armour, bodyOf(shape, hide, w), rule.armour, salted);
  } else if (upright) joints(armour, shape, rule.armour, salted);
  else segments(armour, bodyOf(shape, hide, w), rule.armour, salted);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const host = hide[i] ?? 0;
      const shade = armour.shade[i] ?? -1;
      if (shade < 0 || ((host - 1) & 3) === shade) continue;
      out[i] = host - ((host - 1) & 3) + shade;
      xs.push(x); ys.push(y);
    }
  }
  settle(w, h, pixels, out, null, xs, ys, true);
  return out;
}

/** How far from an eye point, each way, the texture keeps clear, by tier: about an eye's own size. */
const EYE_CLEAR: Readonly<Record<SizeTier, number>> = { small: 2, medium: 3, large: 4, guardian: 4 };

/** A pixel of an eye: the eye, its highlight or its iris (13, 14, 17 to 20). */
const eyePixel = (v: number): boolean => v === 13 || v === 14 || (v >= 17 && v <= 20);

/**
 * The frame's pixels, with every pixel within `reach` columns and rows of one of the frame's eye points (an attach point
 * named `eye...`) made empty. An eye is drawn over the hide there, and a closed eye is drawn in the hide's own shades:
 * a cluster or a seam under it could be told from it at too few pixels. With `drawn` (armour), the same box round every
 * eye pixel the frame itself draws is emptied too: a body that draws its own eyes (an octopus, a jelly) keeps the whole
 * socket drawn round each. Returns `pixels` itself when nothing is emptied.
 */
function clearOfEyes(frame: PartFrame, pixels: Uint8Array, reach: number, drawn: boolean): Uint8Array {
  let hide = pixels;
  const empty = (ex: number, ey: number): void => {
    if (hide === pixels) hide = Uint8Array.from(pixels);
    for (let y = ey - reach; y <= ey + reach; y++) {
      for (let x = ex - reach; x <= ex + reach; x++) if (x >= 0 && y >= 0 && x < frame.w && y < frame.h) hide[y * frame.w + x] = 0;
    }
  };
  for (const name of Object.keys(frame.attach)) {
    if (!name.startsWith('eye')) continue;
    const [ex, ey] = frame.attach[name] as readonly [number, number];
    empty(ex, ey);
  }
  for (let y = 0; drawn && y < frame.h; y++) for (let x = 0; x < frame.w; x++) if (eyePixel(pixels[y * frame.w + x] ?? 0)) empty(x, y);
  return hide;
}

/** Whether paintSkin textures this frame by the skin's rule: the frame has no layer drawn for the skin, and the rule is one that draws clusters or lines (not slick's edge light, not `none`). */
export function texturedByRule(frame: PartFrame, skin: SkinName): boolean {
  const mode = SKIN_TABLE[skin].mode;
  return frame.layers?.[skin] === undefined && mode !== 'none' && mode !== 'edge';
}

/**
 * The texture before it is painted. `wish`: the shade change of each pixel, -1 darker, 1 lighter, 0 none; only ever set
 * on a pixel that can take it (steps), and each such pixel is listed once in `xs`, `ys`. `cluster`: the number, from 1, of the scattered cluster a wished pixel belongs
 * to (below 0: a loose cluster's, which may be taken back pixel by pixel), 0 for none.
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
 * Whether a part is mostly arms: half or more of its columns of hide cross three or more separate runs of it. Such a
 * body (an octopus over its arms, a jelly over its tentacles) has no back for armour to follow.
 */
function allArms(shape: Shape, pixels: Uint8Array, w: number): boolean {
  let columns = 0; let crossed = 0;
  for (let x = shape.x0; x <= shape.x1; x++) {
    let runs = 0; let on = false;
    for (let y = shape.y0; y <= shape.y1; y++) {
      const now = skinnable(pixels[y * w + x] ?? 0);
      if (now && !on) runs++;
      on = now;
    }
    if (runs > 0) columns++;
    if (runs >= 3) crossed++;
  }
  return 2 * crossed >= columns;
}

/** The least rows of hide a column split into several runs must hold in one run to take armour there: an arm or a leg is thinner. */
const BODY_LEAST = 8;

/**
 * The body of a part wider than tall, for armour: in each column the rows armour may lie on. A column whose hide is one
 * run is the body whole. A column split into several runs (a mantle over its arms, a shell over its legs) is the body
 * only in its longest run, and only where that run is `BODY_LEAST` rows or more, twice as long as any other run of
 * the column, and touches the body of the column before it; otherwise the column takes no armour, and its hide stays as drawn. So armour hangs from the body's own
 * edge and never crosses onto the arms.
 */
function bodyOf(shape: Shape, pixels: Uint8Array, w: number): Shape {
  const top = new Int16Array(shape.top.length).fill(-1);
  const bottom = new Int16Array(shape.bottom.length).fill(-1);
  let last = -1; // the last column that is body
  for (let x = shape.x0; x <= shape.x1; x++) {
    let runs = 0; let from = -1; let best = -1; let to = -1; let next = 0; // `next`: the rows of the second longest run
    for (let y = shape.y0; y <= shape.y1 + 1; y++) {
      const on = y <= shape.y1 && skinnable(pixels[y * w + x] ?? 0);
      if (on && from < 0) from = y;
      if (!on && from >= 0) {
        runs++;
        if (best < 0 || y - from > to - best + 1) { if (best >= 0) next = to - best + 1; best = from; to = y - 1; } else if (y - from > next) next = y - from;
        from = -1;
      }
    }
    if (runs === 0) continue;
    if (runs > 1) {
      if (to - best + 1 < BODY_LEAST || to - best + 1 < 2 * next) continue;
      if (last >= 0 && last === x - 1 && (best > (bottom[last] ?? -1) || to < (top[last] ?? -1))) continue;
    }
    top[x] = best; bottom[x] = to; last = x;
  }
  return { ...shape, top, bottom };
}

// The four tones of a piece of armour (a plate, a segment, a joint).
const LIT = 1;   // the upper and front edge: one shade lighter than the face
const FACE = 2;
const LOW = 3;   // the shadow inside the rim: one shade darker than the face
const RIM = 4;   // the underside, the back edge and the seam: two shades darker than the face
/**
 * The armour as it is drawn. `tone`: the tone of each hide pixel a piece covers (0: none). `piece`: the pixels of the
 * piece being drawn. `shade`: the shade 0 to 3 of its own ramp each covered pixel takes (-1: none), set when its piece is sealed.
 */
interface Armour { w: number; h: number; hide: Uint8Array; tone: Uint8Array; shade: Int8Array; piece: number[] }

/** How many times d goes into n, both whole and d above 0, counted up (the renderer uses no division). */
function quotient(n: number, d: number): number {
  let q = 0;
  while ((q + 1) * d <= n) q++;
  return q;
}

/** Gives the hide pixel at (x, y) a tone, as a pixel of the piece being drawn. No two pieces are drawn over one pixel. */
function tone(a: Armour, x: number, y: number, t: number): void {
  if (x < 0 || y < 0 || x >= a.w || y >= a.h) return;
  const i = y * a.w + x;
  if (!skinnable(a.hide[i] ?? 0)) return;
  a.tone[i] = t;
  a.piece.push(i);
}

/**
 * Ends the piece being drawn. Its face is one shade for the whole piece: the mean shade of the hide it covers (rounded
 * to nearest, the half up), held to the two middle shades of a ramp, so a piece always has a lighter shade for its lit
 * edge and a darker one for its rim: on a pale hide and on a dark one a plate is drawn with the same steps. Each pixel
 * takes the face moved by its tone, in its own ramp, never past the ramp's last shade either way.
 */
function seal(a: Armour): void {
  let sum = 0;
  for (const i of a.piece) sum += ((a.hide[i] ?? 0) - 1) & 3;
  // The mean, rounded, is 2 or more when twice the sum is three times the count or more (whole numbers, no division).
  const face = 2 * sum >= 3 * a.piece.length ? 2 : 1;
  for (const i of a.piece) {
    const t = a.tone[i];
    const to = t === LIT ? face + 1 : t === FACE ? face : t === LOW ? face - 1 : face - 2;
    a.shade[i] = to < 0 ? 0 : to;
  }
  a.piece.length = 0;
}

/**
 * One plate, `wide` by `tall`, its top-left at (x, y): a shield whose upper corners are cut and whose lower half narrows
 * to a blunt point. Its upper edge and the upper half of its front edge are lit, joined round the cut corner; its lower and back edges are a dark rim
 * one pixel thick, joined along rows and columns (never by corners alone); a plate four rows or taller has a shadow
 * inside the rim; the rest is its face. With `body`, y is counted in each column from the top edge of the body there
 * (bodyOf), so the shield bends with the edge it hangs from, and nothing is drawn under the body's lower edge.
 */
function shield(a: Armour, x: number, y: number, wide: number, tall: number, body: Shape | null = null): void {
  const cut = wide >= 9 ? 2 : wide >= 4 ? 1 : 0;
  const half = (tall + 1) >> 1;
  /** Whether the shield holds its own column c of row r. */
  const holds = (c: number, r: number): boolean => {
    if (r < 0 || r >= tall) return false;
    let left = r === 0 ? cut : 0;
    let right = left;
    if (tall >= 3 && r >= half) {
      left = quotient((r - half + 1) * wide, 2 * (tall - half) + 1);
      right = left > 0 ? left - 1 : 0;
    }
    return c >= left && c < wide - right;
  };
  for (let r = 0; r < tall; r++) {
    for (let c = 0; c < wide; c++) {
      if (!holds(c, r)) continue;
      const top = body === null ? 0 : x + c < 0 || x + c >= a.w ? -1 : body.top[x + c] ?? -1;
      if (body !== null && (top < 0 || y + r + top > (body.bottom[x + c] ?? -1))) continue;
      tone(a, x + c, y + r + top, r === 0 || (r === 1 && r < half && c <= cut) || (r < half && c === 0) ? LIT
        : !holds(c, r + 1) || !holds(c + 1, r) ? RIM
        : tall >= 4 && (!holds(c, r + 2) || !holds(c + 2, r) || !holds(c + 1, r + 1)) ? LOW : FACE);
    }
  }
  seal(a);
}

/**
 * Plates over a part wider than tall: rows of shields down from the part's top edge, each row started at a column
 * rolled from the seed and each shield one column narrower or wider by the seed, so the rows overlap like tiles and
 * never make a grid. Every column of a shield hangs from the top edge of the hide in that column, so a row follows the
 * back and the next row lies right under it, its lit edges under the first row's rims. Rows are drawn down to five
 * eighths of the hide's height at a shield's middle column; a hide thinner than a shield takes one row of thinner ones.
 */
function shields(a: Armour, shape: Shape, rule: Plates, seed: number): void {
  for (let j = 0, any = true; any; j++) {
    any = false;
    let x = shape.x0 - (roll(seed, j, 0) % rule.wide);
    for (let k = 1; x <= shape.x1; k++) {
      const wide = rule.wide - 1 + (roll(seed, j, k) % 3);
      const mid = Math.min(shape.x1, Math.max(shape.x0, x + (wide >> 1)));
      const top = shape.top[mid] ?? -1;
      const hide = (shape.bottom[mid] ?? -1) - top + 1;
      const tall = hide < rule.tall ? hide : rule.tall;
      if (top >= 0 && tall >= 2 && (j === 0 || (j * tall < (hide * 5) >> 3 && (j + 1) * tall <= hide))) {
        shield(a, x, j * tall, wide, tall, shape);
        any = true;
      }
      x += wide;
    }
  }
}

/**
 * Chitin over a part wider than tall: one row of segments along it, `gap` to `gap + jitter` columns wide by the seed.
 * Each hangs from the top edge down three quarters of the hide's height at its middle column, shorter toward both its
 * ends so its underside is a scallop. Its upper edge and its front edge are lit; its underside is a dark rim joined
 * along rows and columns; its back column is the seam, dark against the lit front of the next segment; its back third
 * is in shadow, so the segments read as bands, each lapping over the next; the rest is its face.
 */
function segments(a: Armour, shape: Shape, rule: Segments, seed: number): void {
  const first = roll(seed, 0, 1);
  let from = shape.x0 - (roll(seed, 0, 2) % rule.gap);
  for (let k = 0; from <= shape.x1; k++) {
    const wide = rule.gap + ((first + k * SPACING_STRIDE) % (rule.jitter + 1));
    const mid = Math.min(shape.x1, Math.max(shape.x0, from + (wide >> 1)));
    const depth = (((shape.bottom[mid] ?? -1) - (shape.top[mid] ?? -1) + 1) * 3) >> 2;
    const round = depth >= 12 ? 2 : 1; // the rows each step of the scallop drops
    /** Whether the segment holds row r of its own column c: the rows above its scalloped underside. */
    const holds = (c: number, r: number): boolean => {
      if (c < 0 || c >= wide) return true; // the next segment is drawn beside it
      const end = c < wide - 1 - c ? c : wide - 1 - c;
      const drop = depth >= 6 ? (end < 3 ? (3 - end) * round : 0) : end === 0 ? 1 : 0;
      return r < depth - drop;
    };
    const shadow = wide - 1 - (wide >= 6 ? quotient(wide, 3) : 1); // from this column back, the segment is in shadow
    const front = wide >= 9 ? 2 : 1; // the columns of the lit front edge
    const lit = depth >= 12 ? 2 : 1; // the rows of the lit upper edge
    for (let c = 0; c < wide && depth >= 3; c++) {
      const x = from + c;
      const top = x < shape.x0 || x > shape.x1 ? -1 : shape.top[x] ?? -1;
      for (let r = 0; top >= 0 && holds(c, r) && top + r <= (shape.bottom[x] ?? -1); r++) {
        tone(a, x, top + r, c === wide - 1 ? RIM : r < lit ? LIT
          : !holds(c, r + 1) || !holds(c - 1, r) || !holds(c + 1, r) ? RIM
          : c < front ? LIT
          : c >= shadow || (depth >= 5 && !holds(c, r + 1 + lit)) ? LOW : FACE);
      }
    }
    seal(a);
    from += wide;
  }
}

/**
 * Plates down a part taller than wide (a leg): rows of shields one under the other from its top, each row `tall` rows.
 * Where the hide of a row's rows is no wider than a shield and two columns, one shield spans it; where it is wider (a
 * thigh), shields are laid along it from a column rolled from the seed, so a leg's plates never make one ruled row.
 */
function greaves(a: Armour, shape: Shape, rule: Plates, seed: number): void {
  for (let j = 0, y = shape.y0; y + rule.tall - 1 <= shape.y1; j++, y += rule.tall) {
    let x0 = a.w; let x1 = -1;
    for (let r = 0; r < rule.tall; r++) {
      for (let x = shape.x0; x <= shape.x1; x++) {
        if (!skinnable(a.hide[(y + r) * a.w + x] ?? 0)) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
      }
    }
    const span = x1 - x0 + 1;
    if (span < 2) continue;
    if (span <= rule.wide + 2) { shield(a, x0, y, span, rule.tall); continue; }
    let x = x0 - (roll(seed, j, 0) % rule.wide);
    for (let k = 1; x <= x1; k++) {
      const wide = rule.wide - 1 + (roll(seed, j, k) % 3);
      shield(a, x, y, wide, rule.tall);
      x += wide;
    }
  }
}

/**
 * Chitin down a part taller than wide (a leg): joints `band` to `band + 2` rows apart by the seed. A joint is a dark
 * line with a lit line under it, across the hide; on a hide five columns or wider both ends of it are raised two rows
 * in steps, an arc, so it reads as the edge of one length of the leg lapping over the next and never as a ruled row.
 * Where the hide is wider than two segments (`gap` twice: a part that is no leg) the joint is left out.
 */
function joints(a: Armour, shape: Shape, rule: Segments, seed: number): void {
  let y = shape.y0 + 1;
  for (let k = 0; ; k++) {
    y += rule.band + (roll(seed, k, 3) % 3);
    if (y + 1 > shape.y1) return;
    let x0 = a.w; let x1 = -1;
    for (let r = 0; r < 2; r++) {
      for (let x = shape.x0; x <= shape.x1; x++) {
        if (!skinnable(a.hide[(y + r) * a.w + x] ?? 0)) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
      }
    }
    const wide = x1 - x0 + 1;
    if (wide > 2 * rule.gap) continue;
    for (let x = x0; x <= x1; x++) {
      const end = x - x0 < x1 - x ? x - x0 : x1 - x;
      const rise = wide >= 5 && end < 2 ? 2 - end : 0;      // how far this column of the line is raised
      const next = wide >= 5 && end < 1 ? 1 : 0;            // and the column beside it, toward the middle
      for (let r = y - rise; r <= y - next; r++) tone(a, x, r, RIM);
      tone(a, x, y - next + 1, LIT);
    }
    seal(a);
  }
}

/**
 * Takes back, until nothing more is taken back, every texture pixel that would stand alone or make a mesh: `out` is a
 * picture w by h, `before` the same picture without its texture, and a texture pixel is one that differs. Taken back are
 * a texture pixel no neighbour above, below, left or right shares its value with; the texture pixels beside an untouched
 * pixel left that way when it was not so before; the texture pixels of a two by two checker (two values, each on one
 * diagonal); and the texture pixels of a run of four or more along a row or column that are texture and not in turn
 * (`armour`, for plates and chitin, whose pieces hold pixels left as they were: a run of four that are two values in turn,
 * and a run of more than six that are texture and hide in turn).
 * paintSkin does this to each part it textures, taking a scattered cluster back whole so none is left in pieces; the
 * composer calls this once more on the whole creature, where one part may hide half of another's cluster. No texture
 * lies outside `box`.
 */
export function settleTexture(w: number, h: number, before: Uint8Array, out: Uint8Array, box: Box, armour = false): void {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let y = box.y0 < 0 ? 0 : box.y0; y <= box.y1 && y < h; y++) {
    for (let x = box.x0 < 0 ? 0 : box.x0; x <= box.x1 && x < w; x++) {
      if (out[y * w + x] === before[y * w + x]) continue;
      xs.push(x); ys.push(y);
    }
  }
  settle(w, h, before, out, null, xs, ys, armour);
}

/** settleTexture on the texture pixels listed in `xs`, `ys` (every pixel of `out` that differs from `before`, each once). With `cluster`, a pixel numbered above 0 takes its whole cluster back with it. */
function settle(w: number, h: number, before: Uint8Array, out: Uint8Array, cluster: Int32Array | null, xs: readonly number[], ys: readonly number[], armour = false): void {
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
  // Armour only: a texture pixel's faults are read from the pixels within three of it, so a pixel looked at since the
  // last pixel within three of it was taken back is not looked at again (the same pixels go back, in the same order).
  let taken = 0;                                   // how many pixels have been taken back
  const stale = armour ? new Int32Array(w * h) : null;  // `taken` when a pixel within three of this one last went back
  const looked = armour ? new Int32Array(w * h).fill(-1) : null; // `taken` when this pixel was last looked at
  const back = (x: number, y: number): void => {
    const i = y * w + x;
    if (!inside(x, y) || texture[i] === 0) return;
    out[i] = before[i] ?? 0;
    texture[i] = 0;
    if (stale !== null) {
      taken++;
      for (let ny = y < 3 ? 0 : y - 3; ny <= y + 3 && ny < h; ny++) for (let nx = x < 3 ? 0 : x - 3; nx <= x + 3 && nx < w; nx++) stale[ny * w + nx] = taken;
    }
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
    if (armour) {
      // Two values in turn, with a texture pixel among the four.
      if (out[i] === out[i + step] || out[i] !== out[i + 2 * step] || out[i + step] !== out[i + 3 * step]) return;
      if (texture[i] === 0 && texture[i + step] === 0 && texture[i + 2 * step] === 0 && texture[i + 3 * step] === 0) return;
    } else {
      const first = texture[i];
      if (texture[i + step] === first || texture[i + 2 * step] !== first || texture[i + 3 * step] === first) return;
    }
    for (let n = 0; n < 4; n++) back(x + n * dx, y + n * dy);
  };
  // Every fault holds a texture pixel or sits beside one, so only the texture pixels and what is round them are looked at.
  while (again) {
    again = false;
    for (let k = 0; k < xs.length; k++) {
      const x = xs[k] as number; const y = ys[k] as number;
      const i = y * w + x;
      if (texture[i] === 0) continue;
      if (stale !== null && looked !== null) {
        if ((looked[i] ?? -1) >= (stale[i] ?? 0)) continue;
        looked[i] = taken;
      }
      if (alone(out, x, y)) { back(x, y); continue; }
      freed(x - 1, y); freed(x + 1, y); freed(x, y - 1); freed(x, y + 1);
      checker(x - 1, y - 1); checker(x, y - 1); checker(x - 1, y); checker(x, y);
      // Such a run holds texture, a gap of one, texture: it starts at the first of those or one pixel before it.
      if (armour) {
        // A run of two values in turn through this pixel holds the pixel's value again two pixels along: a run is
        // looked for only then (asked anew each time, as a run taken back changes the values).
        for (let n = 0; n < 4; n++) {
          if ((x >= 2 && out[i - 2] === out[i]) || (x + 2 < w && out[i + 2] === out[i])) run(x - n, y, 1, 0);
          if ((y >= 2 && out[i - 2 * w] === out[i]) || (y + 2 < h && out[i + 2 * w] === out[i])) run(x, y - n, 0, 1);
        }
        continue;
      }
      if (x + 2 < w && texture[i + 1] === 0 && texture[i + 2] === 1) { run(x, y, 1, 0); run(x - 1, y, 1, 0); }
      if (y + 2 < h && texture[i + w] === 0 && texture[i + 2 * w] === 1) { run(x, y, 0, 1); run(x, y - 1, 0, 1); }
    }
    if (gone.size > 0) {
      for (let i = 0; cluster !== null && i < out.length; i++) {
        if (texture[i] === 1 && gone.has(cluster[i] ?? 0)) { out[i] = before[i] ?? 0; texture[i] = 0; }
      }
      gone.clear();
    }
    if (armour && !again) {
      // Armour: once nothing else is taken back, any comb, a run of more than COMB_MOST drawn pixels along a row or a
      // column that are texture and hide in turn (whatever their values), loses its texture, and the rest is looked at again.
      for (let k = 0; k < xs.length; k++) {
        const x = xs[k] as number; const y = ys[k] as number;
        if (texture[y * w + x] === 0) continue;
        for (let d = 0; d < 2; d++) {
          const dx = 1 - d; const dy = d;
          // Counted from the run's first texture pixel only: the one with no hide and then texture before it.
          if (x - 2 * dx >= 0 && y - 2 * dy >= 0 && out[(y - dy) * w + x - dx] !== 0 && texture[(y - dy) * w + x - dx] === 0 && texture[(y - 2 * dy) * w + x - 2 * dx] === 1) continue;
          let n = 0;
          for (let cx = x, cy = y; cx < w && cy < h && out[cy * w + cx] !== 0 && (texture[cy * w + cx] === 1) === ((n & 1) === 0); cx += dx, cy += dy) n++;
          if (n > COMB_MOST) for (let j = 0; j < n; j += 2) back(x + j * dx, y + j * dy);
        }
      }
    }
  }
}
/** The longest run of texture and hide in turn armour may leave: a plate's own edge (lit, face, shadow, rim, and the next plate's lit edge) makes up to six. */
const COMB_MOST = 6;

/**
 * Whether the skin is drawn as armour at the tier: plates and chitin on a large creature or a Guardian. A small or a
 * medium creature keeps the lines it had (its armour is the art agent's to draw, as layers).
 */
export function armoured(skin: SkinName, tier: SizeTier): boolean {
  const mode = SKIN_TABLE[skin].mode;
  return (mode === 'plates' || mode === 'seams') && (tier === 'large' || tier === 'guardian');
}
