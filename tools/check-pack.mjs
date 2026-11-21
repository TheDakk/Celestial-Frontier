// Checks an art pack (palette, parts, scaffolds, fallbacks in the art text format) the way the renderer will use it.
// Usage: node tools/check-pack.mjs <pack.txt> [more.txt ...]   (files are joined with a newline, then parsed)
// Reads only the files given and writes nothing. Exit code 0 only when there is no error.
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The art packages import sibling .ts files without an extension: retry a failed specifier with .ts and /index.ts.
// (The same hook as tools/record-art-hashes.mjs; it only acts when plain resolution fails.)
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.')) throw error;
      const base = specifier.endsWith('.js') ? specifier.slice(0, -3) : specifier;
      for (const candidate of [base + '.ts', base + '/index.ts']) {
        try {
          return nextResolve(candidate, context);
        } catch {
          // try the next candidate
        }
      }
      throw error;
    }
  },
});

const { parseCatalogueText, fallbackKey, EYE_COUNTS, LIMB_COUNTS, TIER_SIZE, LAYER_NAMES, MARK_SLOTS, IRIS_RAMP_COUNT, PATTERN_NAMES } = await import('@cf/art-format');
const { buildRecipe, resolveAnatomy, limbKind, EYELESS_HEAD, BACK_KIND_BY_SKIN } = await import('@cf/art-recipe');
const { assemble, compose, frameNameFor, paintMarks, poseEntryFor } = await import('@cf/art-compose');

export const REQUIRED_POSES = ['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint'];
const TORSO_POINTS = ['head', 'tail', 'back', 'far0', 'far1', 'far2', 'far3', 'near0', 'near1', 'near2', 'near3'];
const HEAD_POINTS = ['eye0', 'eye1', 'eye2', 'eye3', 'eye4', 'eye5', 'eye6', 'eye7'];
/**
 * Every leg-count attach name the composer can ask a torso for, with its leg count: `far<i>_<n>` and `near<i>_<n>`
 * for each non-zero leg count n, where the far side has n >> 1 legs and the near side the rest (as buildRecipe splits them).
 * Such a name is optional (the plain name is the fallback); a torso name ending in `_<digits>` that is not here is never used.
 */
const LEG_COUNT_POINTS = new Map(LIMB_COUNTS.filter((n) => n > 0).flatMap((n) => [
  ...Array.from({ length: n >> 1 }, (_, i) => [`far${i}_${n}`, n]),
  ...Array.from({ length: n - (n >> 1) }, (_, i) => [`near${i}_${n}`, n]),
]));
// The genes that give each tier: a size gene, and for the guardian tier the Guardian marker the game sets (apex).
const GENES_FOR_TIER = { small: { size: 0 }, medium: { size: 2 }, large: { size: 4 }, guardian: { size: 5, apex: 12 } };
const SHIFTS = [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((x) => [x, y]));
const HEAD_SHIFTS = SHIFTS.map((s) => ({ head: s, tail: [0, 0] }));
const TAIL_SHIFTS = SHIFTS.map((s) => ({ head: [0, 0], tail: s }));
const SHIFT_PAIRS = SHIFTS.flatMap((head) => SHIFTS.map((tail) => ({ head, tail })));
// Each slot drawn in the label picture with its own value, so a detached region says which slot it is.
const SLOT_LABEL = { torso: 1, tail: 2, farLimbs: 3, nearLimbs: 4, head: 5, eyes: 10, back: 7, headFeature: 8, glow: 9 };
/** The first per-part label of the hidden-part pictures: above every pixel value (0-20), so the composer's iris rewrite of 5-8 can never touch a label. */
const LABEL_BASE = 21;
const LABEL_SLOT = Object.fromEntries(Object.entries(SLOT_LABEL).map(([slot, v]) => [v, slot]));
const FULL_EYES = EYE_COUNTS.indexOf(8); // eight eyes: every eye attach point
const FULL_LIMBS = LIMB_COUNTS.indexOf(8); // eight legs: every leg attach point
const NO_LIMBS = LIMB_COUNTS.indexOf(0);
/** The base sample's skin: slick and wet, which asks for no back part, so the base pictures hold no back part. */
const BASE_SKIN = 3;
/** The pattern genes swept (every pattern but plain) and the skin genes that ask for a back part. */
const PATTERN_GENES = [1, 2, 3, 4, 5, 6, 7];
const BACK_SKINS = BACK_KIND_BY_SKIN.flatMap((kind, skin) => (kind === null ? [] : [skin]));
/** The pattern of a creature with a forced variant: patterned, so a forced part is painted and a variant with no layers is counted. */
const FORCED_PATTERN = 1;
/** Ramp values are 1-12 (three ramps of four); a value's shade step is its position in its ramp, 0 darkest to 3 lightest. */
const inRamp = (v) => v >= 1 && v <= 12;
const shadeOf = (v) => (v - 1) & 3;
/** The fewest pixels a requested part must show; a part that draws fewer (a one-pixel eye) must show all of them. */
export const HIDDEN_MIN = 4;

export const SAMPLED =
  'every head kind x every tail kind and no tail x limbs genes 0-5, at eyes gene ' + FULL_EYES +
  ' (eight eyes: every eye point), plus eyes genes 0-5 for each head kind, all plain with skin ' + BASE_SKIN + ' (no back part); every pose the scaffold defines. ' +
  'For each head kind with the last tail and eight eyes: one creature at eight legs for each pattern gene ' + PATTERN_GENES.join(', ') +
  ' at full strength, composed for its gaps only (marks never change which pixels are drawn, so it is not checked for the edge, ' +
  'detachment or hidden parts, and its own seeded variants and shifts are not sampled for them), and one for each skin gene with a back part (' + BACK_SKINS.join(', ') + ') at eight legs and again at every leg count ' +
  'a legs= entry or a torso leg-count attach point of the scaffold is written for, in every pose at its own shift. ' +
  'Shift sweep (edge and detachment), limbs gene ' + NO_LIMBS + ' (no legs) and again at every leg count a legs= entry or a torso leg-count attach point of the scaffold is written for: ' +
  'every head kind with no tail at its nine shifts, and head and tail kinds paired in turn (each kind at least once) at all 81 head x tail shift combinations. ' +
  'Every variant of a part type with more than one, forced into a patterned creature (pattern gene ' + FORCED_PATTERN + '), in every pose (a head or tail variant also at its nine shifts), ' +
  'also at every leg count a legs= entry or a torso leg-count attach point of the scaffold is written for. ' +
  'Every requested part must show ' + HIDDEN_MIN + ' pixels (all of its pixels if it draws fewer) in every one of these pictures. ' +
  'A marks: gap is also listed, as x0, for every frame a pose can show at any leg count that no sampled creature drew.';

/**
 * Whether a gap is information rather than an error: a missing variant (`variant:`), a frame with no layer for the
 * creature's pattern (`marks:`), a leg role drawn with the shared leg (`role:`), or a missing back part or head feature
 * (`missing:` of a part in slot back or headFeature). Every other gap is an error.
 */
function gapIsInfo(gap) {
  if (/^(variant|marks|role):/.test(gap)) return true;
  const slot = /^missing:[^/]*\/([^/]*)\//.exec(gap)?.[1];
  return slot === 'back' || slot === 'headFeature';
}

const countBy = (items, key) => {
  const out = {};
  for (const item of items) out[key(item)] = (out[key(item)] ?? 0) + 1;
  return out;
};

/** The genome a scaffold is drawn for: a fauna body and movement gene that resolve to its family and torso type. */
function genomeFor(scaffold) {
  const [family, torsoKind] = scaffold.id.split('/');
  const tierGenes = GENES_FOR_TIER[scaffold.tier];
  for (const loco of [0, 4]) {
    for (let body = 0; body < 16; body++) {
      const a = resolveAnatomy({ kingdom: 'fauna', body, loco, ...tierGenes });
      if (a.family === family && (a.torso === '' ? 'body' : a.torso) === torsoKind) return { body, loco, ...tierGenes };
    }
  }
  return undefined;
}

/** Gene values whose kind (`h3`, `t2`) has a part at this family and tier. */
function kindsFor(catalogue, scaffold, slot, letter, length) {
  const genes = new Set();
  for (const part of catalogue.parts.values()) {
    if (part.family !== scaffold.family || part.slot !== slot || part.tier !== scaffold.tier) continue;
    const m = new RegExp(`^${letter}(\\d+)$`).exec(part.kind);
    if (m && Number(m[1]) < length) genes.add(Number(m[1]));
  }
  return [...genes].sort((a, b) => a - b);
}

/** Part types (family, slot, kind, tier) with more than one variant in the pack, each with its part ids in variant order. */
function variantsByType(catalogue) {
  const groups = new Map();
  for (const part of catalogue.parts.values()) {
    const key = `${part.family}/${part.slot}/${part.kind}/${part.tier}`;
    const known = groups.get(key);
    if (known) known.parts.push(part);
    else groups.set(key, { family: part.family, slot: part.slot, kind: part.kind, tier: part.tier, parts: [part] });
  }
  return [...groups.values()].filter((g) => g.parts.length > 1).map((g) => ({ ...g, ids: g.parts.sort((a, b) => a.variant - b.variant).map((p) => p.id) }));
}

/** A frame without its layers: a copy whose pixels are coded must never be painted, or a mark would read as a code. */
const unlayered = ({ layers: _layers, ...frame }) => frame;

/**
 * The same catalogue with every drawn pixel replaced by its slot's label: same geometry, pixels say who drew them.
 * Layers are dropped, so a patterned creature's marks are never painted over a label.
 */
function labelCatalogue(catalogue) {
  const parts = new Map();
  for (const [id, part] of catalogue.parts) {
    const label = SLOT_LABEL[part.slot];
    const frames = Object.create(null);
    for (const name of Object.keys(part.frames)) {
      const f = part.frames[name];
      frames[name] = { ...unlayered(f), pixels: f.pixels.map((v) => (v === 0 ? 0 : label)) };
    }
    parts.set(id, { ...part, frames });
  }
  return { ...catalogue, parts };
}

/**
 * 4-connected regions of the pixels that are neither transparent (0) nor outline (16), in a picture drawn from
 * labelCatalogue (pixel value = slot label). Returns the slots found outside the main region (the one holding the
 * most torso pixels, else the largest), or null when the picture is one region.
 */
export function detachedSlots(buffer) {
  const { w, h, pixels } = buffer;
  const region = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  const sizes = [];
  const torso = [];
  for (let start = 0; start < pixels.length; start++) {
    const v = pixels[start];
    if (v === 0 || v === 16 || region[start] !== -1) continue;
    const id = sizes.length;
    let size = 0;
    let torsoCount = 0;
    let top = 0;
    stack[top++] = start;
    region[start] = id;
    while (top > 0) {
      const i = stack[--top];
      size++;
      if (pixels[i] === SLOT_LABEL.torso) torsoCount++;
      const x = i % w;
      const next = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
      for (const j of next) {
        if (j < 0 || j >= pixels.length || region[j] !== -1) continue;
        const u = pixels[j];
        if (u === 0 || u === 16) continue;
        region[j] = id;
        stack[top++] = j;
      }
    }
    sizes.push(size);
    torso.push(torsoCount);
  }
  if (sizes.length <= 1) return null;
  let main = 0;
  for (let r = 1; r < sizes.length; r++) {
    if (torso[r] > torso[main] || (torso[r] === torso[main] && sizes[r] > sizes[main])) main = r;
  }
  const off = new Set();
  for (let i = 0; i < pixels.length; i++) if (region[i] !== -1 && region[i] !== main) off.add(LABEL_SLOT[pixels[i]] ?? String(pixels[i]));
  return Object.keys(SLOT_LABEL).filter((slot) => off.has(slot));
}

/** The drawn (non-zero) pixel count of a part's rest frame (else its first frame); 0 when it has none. */
function drawnCount(part) {
  const frame = Object.hasOwn(part.frames, 'rest') ? part.frames['rest'] : part.frames[Object.keys(part.frames)[0]];
  return frame === undefined ? 0 : frame.pixels.reduce((n, v) => (v === 0 ? n : n + 1), 0);
}

/**
 * A copy of the catalogue and recipe in which the recipe's part number k (from 0) has its own part id and is drawn
 * as `mode(k)` says: 'label' draws every pixel as k + LABEL_BASE, 'blank' draws nothing (the part keeps its place, so the
 * parts that hang from it still land where they do), 'real' draws the part as it is, 'x' and 'y' draw each pixel as its
 * own column or row in the frame plus one (so a picture says which frame pixel landed where; frames up to 254 pixels).
 * Every mode but 'real' drops the frame's layers, so no mark is painted over a code. Frames are made once per id.
 */
function numberedCopy(recipe, catalogue, cache, mode) {
  const parts = new Map();
  const numbered = recipe.parts.map((rp, k) => {
    const how = mode(k);
    const id = `${rp.partId}#${k}#${how}`;
    const part = catalogue.parts.get(rp.partId);
    if (part !== undefined) {
      let made = cache.get(id);
      if (made === undefined) {
        const frames = Object.create(null);
        for (const name of Object.keys(part.frames)) {
          const f = part.frames[name];
          const value = how === 'x' ? (i) => (i % f.w) + 1 : how === 'y' ? (i) => (i - (i % f.w)) / f.w + 1 : () => k + LABEL_BASE;
          frames[name] = how === 'real' ? f : { ...unlayered(f), pixels: f.pixels.map((v, i) => (v === 0 || how === 'blank' ? 0 : value(i))) };
        }
        made = { ...part, id, frames };
        cache.set(id, made);
      }
      parts.set(id, made);
    }
    return { ...rp, partId: id };
  });
  return { recipe: { ...recipe, parts: numbered }, catalogue: { ...catalogue, parts } };
}

/**
 * Parts the recipe requests that show fewer than HIDDEN_MIN visible pixels (or fewer than they draw, when that is
 * less) in the unfinished picture: the picture compared with the same recipe minus that part, pixel by pixel. The
 * unfinished picture is used so that the outline a part adds is not counted. Returns [{ partId, visible, needed }].
 *
 * The same answer, with fewer pictures: removing part k changes only pixels where k is drawn last, so a part on top
 * at fewer than `needed` pixels is hidden. A pixel where k is on top and is the only part drawn there always changes.
 * For the other parts still in doubt (set D), one picture with every part of D blanked gives what lies under k
 * wherever no other part of D lies under it; only a part still short of `needed` after that is assembled without it.
 */
function hiddenParts(recipe, pose, catalogue, cache) {
  const n = recipe.parts.length;
  const needed = recipe.parts.map((rp) => { const part = catalogue.parts.get(rp.partId); return part === undefined ? 0 : Math.min(HIDDEN_MIN, drawnCount(part)); });
  const all = numberedCopy(recipe, catalogue, cache, () => 'label');
  const top = assemble(all.recipe, pose, all.catalogue).buffer.pixels;
  const bottom = assemble({ ...all.recipe, parts: [...all.recipe.parts].reverse() }, pose, all.catalogue).buffer.pixels;
  const onTop = new Int32Array(n + LABEL_BASE);
  const alone = new Int32Array(n + LABEL_BASE);
  for (let i = 0; i < top.length; i++) {
    const t = top[i];
    if (t === 0) continue;
    onTop[t]++;
    if (t === bottom[i]) alone[t]++;
  }
  const doubt = new Uint8Array(n + LABEL_BASE);
  let doubts = 0;
  for (let k = 0; k < n; k++) if (needed[k] > 0 && alone[k + LABEL_BASE] < needed[k] && onTop[k + LABEL_BASE] >= needed[k]) { doubt[k + LABEL_BASE] = 1; doubts++; }

  const sure = new Int32Array(n + LABEL_BASE);
  let full;
  if (doubts > 0) {
    full = assemble(recipe, pose, catalogue).buffer.pixels;
    const under = numberedCopy(recipe, catalogue, cache, (k) => (doubt[k + LABEL_BASE] === 1 ? 'blank' : 'real'));
    const beneath = assemble(under.recipe, pose, under.catalogue).buffer.pixels;
    const onlyDoubt = numberedCopy(recipe, catalogue, cache, (k) => (doubt[k + LABEL_BASE] === 1 ? 'label' : 'blank'));
    const lowestDoubt = assemble({ ...onlyDoubt.recipe, parts: [...onlyDoubt.recipe.parts].reverse() }, pose, onlyDoubt.catalogue).buffer.pixels;
    for (let i = 0; i < top.length; i++) {
      const t = top[i];
      if (t !== 0 && doubt[t] === 1 && lowestDoubt[i] === t && full[i] !== beneath[i]) sure[t]++;
    }
  }

  const hidden = [];
  for (let k = 0; k < n; k++) {
    if (needed[k] === 0 || alone[k + LABEL_BASE] >= needed[k] || sure[k + LABEL_BASE] >= needed[k]) continue;
    let visible = 0;
    if (onTop[k + LABEL_BASE] > 0) {
      full ??= assemble(recipe, pose, catalogue).buffer.pixels;
      const without = assemble({ ...recipe, parts: recipe.parts.filter((_, i) => i !== k) }, pose, catalogue).buffer.pixels;
      for (let i = 0; i < full.length && visible < needed[k]; i++) if (full[i] !== without[i]) visible++;
    }
    if (visible < needed[k]) hidden.push({ partId: recipe.parts[k].partId, visible, needed: needed[k] });
  }
  return hidden;
}

/** For an unfinished picture: a drawn pixel on the border or next to it, where the finished picture's outline would touch the edge. */
function nearEdge({ w, h, pixels }) {
  for (let x = 0; x < w; x++) for (const y of [0, 1, h - 2, h - 1]) if (pixels[y * w + x] !== 0) return true;
  for (let y = 0; y < h; y++) for (const x of [0, 1, w - 2, w - 1]) if (pixels[y * w + x] !== 0) return true;
  return false;
}

function touchesEdge({ w, h, pixels }) {
  for (let x = 0; x < w; x++) if (pixels[x] !== 0 || pixels[(h - 1) * w + x] !== 0) return true;
  for (let y = 0; y < h; y++) if (pixels[y * w] !== 0 || pixels[y * w + w - 1] !== 0) return true;
  return false;
}

/** The drawn (non-zero) extent of a frame, relative to its anchor: [left, top, right, bottom], or null when it draws nothing. */
function drawnExtent(frame) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i < frame.pixels.length; i++) {
    if (frame.pixels[i] === 0) continue;
    const x = i % frame.w;
    const y = (i - x) / frame.w;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  if (x1 < 0) return null;
  return [x0 - frame.anchor[0], y0 - frame.anchor[1], x1 - frame.anchor[0], y1 - frame.anchor[1]];
}

/**
 * Fallback problems: a fallback whose frame, anchored at the canvas centre or at the origin of a scaffold of its family
 * and tier (where compose draws it), does not fit its tier's canvas with a pixel to spare for the outline; and each
 * family present in the pack that has no fallback at a tier the pack has parts or scaffolds for.
 */
function fallbackProblems(catalogue) {
  const problems = [];
  for (const [key, id] of catalogue.fallbacks) {
    const [family, tier] = key.split('/');
    const [w, h] = TIER_SIZE[tier];
    const extent = drawnExtent(catalogue.parts.get(id).frames['rest']);
    const fits = ([x, y]) => extent === null || (x + extent[0] >= 1 && y + extent[1] >= 1 && x + extent[2] <= w - 2 && y + extent[3] <= h - 2);
    if (!fits([w >> 1, h >> 1])) problems.push(`fallback ${family} ${tier}: part ${id} does not fit the ${w}x${h} canvas when centred`);
    for (const scaffold of catalogue.scaffolds.values()) {
      if (scaffold.family === family && scaffold.tier === tier && !fits(scaffold.origin)) {
        problems.push(`fallback ${family} ${tier}: part ${id} does not fit the ${w}x${h} canvas at the origin of scaffold ${scaffold.id}`);
      }
    }
  }
  const things = [...catalogue.parts.values(), ...catalogue.scaffolds.values()];
  const tiers = Object.keys(TIER_SIZE).filter((t) => things.some((x) => x.tier === t));
  const families = [...new Set([...things.map((x) => x.family), ...[...catalogue.fallbacks.keys()].map((k) => k.split('/')[0])])];
  for (const family of families) {
    for (const tier of tiers) if (!catalogue.fallbacks.has(fallbackKey(family, tier))) problems.push(`family ${family} has no fallback at ${tier}`);
  }
  return problems;
}

/** Per spot value (1-15) in a `spots` layer, the number of 4-connected blobs of that value; [value, blobs] for each value in more than one. */
function splitSpots(layer, w) {
  const seen = new Uint8Array(layer.length);
  const blobs = new Array(16).fill(0);
  const stack = [];
  for (let start = 0; start < layer.length; start++) {
    const v = layer[start];
    if (v === 0 || seen[start] === 1) continue;
    blobs[v]++;
    seen[start] = 1;
    stack.push(start);
    while (stack.length > 0) {
      const i = stack.pop();
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= layer.length || seen[j] === 1 || layer[j] !== v) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
  }
  return blobs.flatMap((n, v) => (n > 1 ? [[v, n]] : []));
}

/** Layer problems of one frame: layer pixels where the frame draws no ramp value (1-12), and spot values split into several blobs. */
function layerProblems(where, frame) {
  const problems = [];
  const layers = frame.layers ?? {};
  for (const name of LAYER_NAMES) {
    if (!Object.hasOwn(layers, name)) continue;
    const layer = layers[name];
    let outside = 0;
    for (let i = 0; i < layer.length; i++) if (layer[i] !== 0 && !inRamp(frame.pixels[i])) outside++;
    if (outside > 0) problems.push(`${where}: layer ${name} has ${outside} pixels outside the drawn area`);
    if (name === 'spots') for (const [v, n] of splitSpots(layer, frame.w)) problems.push(`${where}: spot value ${v} is in ${n} blobs`);
  }
  return problems;
}

/** The limbs a creature with `legs` legs draws on each side: far n >> 1, near the rest (as buildRecipe splits them). */
const sideCount = (slot, legs) => (slot === 'farLimbs' ? legs >> 1 : legs - (legs >> 1));

/**
 * Every `marks:<part id>:<frame>` gap a scaffold's creatures can meet, read from the catalogue without composing: for
 * each mark slot, leg count, index the slot has at that count and pose, the frame each part the composer could ask
 * for there would show (poseEntryFor, frameNameFor), when that frame has no layer serving some pattern. The parts are
 * those of the scaffold's family, tier and slot: the torso of its own kind, heads h0 to h9, tails t1 to t6, and limbs
 * of the leg role at that index, or the shared leg when the pack has no v0 of that role on that side.
 */
function marksGapsOf(catalogue, scaffold, torsoKind) {
  const found = new Set();
  const own = [...catalogue.parts.values()].filter((p) => p.family === scaffold.family && p.tier === scaffold.tier);
  const roleHeld = (slot, kind) => own.some((p) => p.slot === slot && p.kind === kind && p.variant === 0);
  const unserved = new Map();
  const lacksLayer = (frame) => {
    let lacks = unserved.get(frame);
    if (lacks === undefined) {
      lacks = PATTERN_NAMES.slice(1).some((pattern) => paintMarks(frame, pattern, 2, 0, []) === null);
      unserved.set(frame, lacks);
    }
    return lacks;
  };
  for (const slot of MARK_SLOTS) {
    const limb = slot === 'farLimbs' || slot === 'nearLimbs';
    for (const legs of LIMB_COUNTS) {
      const indexes = limb ? sideCount(slot, legs) : 1;
      for (let index = 0; index < indexes; index++) {
        const role = limb ? limbKind(index, legs) : '';
        const kinds = !limb ? null : roleHeld(slot, role) ? [role] : [role, 'leg'];
        const parts = own.filter((p) => p.slot === slot && (
          slot === 'torso' ? p.kind === torsoKind
            : slot === 'head' ? /^h\d$/.test(p.kind)
              : slot === 'tail' ? /^t[1-6]$/.test(p.kind)
                : kinds.includes(p.kind)));
        if (parts.length === 0) continue;
        for (const pose of Object.values(scaffold.poses)) {
          const entry = poseEntryFor(pose.entries, slot, index, legs);
          for (const part of parts) {
            const name = frameNameFor(part, entry);
            if (Object.hasOwn(part.frames, name) && lacksLayer(part.frames[name])) found.add(`marks:${part.id}:${name}`);
          }
        }
      }
    }
  }
  return found;
}

/**
 * Problems a reader can see without composing: attach points (head kind hN needs `feature` once the pack has a head
 * feature drawn for it, kind `<feature>-hN`, of its family and tier; a torso's leg-count names must be ones the composer
 * can ask for), layers, the palette's iris ramps (some but not all), poses and their leg-count entries, contact points,
 * fallbacks.
 */
function structureProblems(catalogue) {
  const problems = [];
  const fallbackParts = new Set(catalogue.fallbacks.values());
  const featured = new Set([...catalogue.parts.values()].filter((p) => p.slot === 'headFeature' && p.kind.includes('-')).map((p) => `${p.family}/${p.tier}/${p.kind.slice(p.kind.lastIndexOf('-') + 1)}`));
  for (const part of catalogue.parts.values()) {
    const frames = Object.keys(part.frames);
    if (!MARK_SLOTS.includes(part.slot) && frames.some((name) => part.frames[name].layers !== undefined)) problems.push(`part ${part.id}: layers on a slot that takes no marks`);
    for (const name of frames) problems.push(...layerProblems(`part ${part.id} frame ${name}`, part.frames[name]));
    if (part.slot === 'torso') {
      for (const name of frames) {
        for (const point of Object.keys(part.frames[name].attach)) {
          if (!/_\d+$/.test(point) || LEG_COUNT_POINTS.has(point)) continue;
          if (/^(far|near)\d+_\d+$/.test(point)) problems.push(`part ${part.id} frame ${name}: attach point ${point} is for a leg count that never uses it`);
          else problems.push(`part ${part.id} frame ${name}: attach point ${point} is never used: only far<i>_<n> and near<i>_<n> take a leg count`);
        }
      }
    }
    // The eyeless head never carries eyes, so it needs no eye points. Only the plain leg points are required: they are the fallback.
    const feature = part.slot === 'head' && featured.has(`${part.family}/${part.tier}/${part.kind}`) ? ['feature'] : [];
    const required = part.slot === 'torso' && !fallbackParts.has(part.id) ? TORSO_POINTS : part.slot === 'head' ? [...(part.kind !== `h${EYELESS_HEAD}` ? HEAD_POINTS : []), ...feature] : [];
    if (required.length === 0) continue;
    for (const name of frames) {
      const missing = required.filter((p) => !Object.hasOwn(part.frames[name].attach, p));
      if (missing.length > 0) problems.push(`part ${part.id} frame ${name}: missing attach point ${missing.join(', ')}`);
    }
  }
  // A palette with none of the iris ramps is today's format (information, see checkPack); with some, every one must be there.
  const iris = Array.from({ length: IRIS_RAMP_COUNT }, (_, i) => `iris${i}`);
  if (iris.some((name) => Object.hasOwn(catalogue.palette.ramps, name))) {
    for (const name of iris) if (!Object.hasOwn(catalogue.palette.ramps, name)) problems.push(`palette: missing iris ramp ${name}`);
  }
  for (const scaffold of catalogue.scaffolds.values()) {
    const missing = REQUIRED_POSES.filter((p) => !Object.hasOwn(scaffold.poses, p));
    if (missing.length > 0) problems.push(`scaffold ${scaffold.id}: missing pose ${missing.join(', ')}`);
    for (const [poseId, pose] of Object.entries(scaffold.poses)) {
      for (const e of pose.entries) {
        if (e.legs === undefined || (e.slot !== 'farLimbs' && e.slot !== 'nearLimbs') || e.index < sideCount(e.slot, e.legs)) continue;
        problems.push(`scaffold ${scaffold.id} pose ${poseId}: entry ${e.slot} ${e.index} legs=${e.legs} is for a leg that count never draws`);
      }
    }
    if (Object.hasOwn(scaffold.poses, 'strike') && scaffold.poses['strike'].contact === undefined) {
      problems.push(`scaffold ${scaffold.id}: pose strike has no contact point`);
    }
  }
  problems.push(...fallbackProblems(catalogue));
  return problems;
}

/** The frame a part shows in a pose, chosen by the composer's own rule (poseEntryFor, frameNameFor). */
function frameShown(scaffold, poseId, slot, index, legs, part) {
  return frameNameFor(part, poseEntryFor(scaffold.poses[poseId].entries, slot, index, legs));
}

/** Where part k of a recipe lands: the canvas position of its frame's pixel 0,0, read from its 'x' and 'y' coded pictures. */
function frameOrigin(recipe, k, pose, catalogue, cache) {
  const at = (axis) => {
    const coded = numberedCopy(recipe, catalogue, cache, (i) => (i === k ? axis : 'blank'));
    const { w, pixels } = assemble(coded.recipe, pose, coded.catalogue).buffer;
    for (let i = 0; i < pixels.length; i++) if (pixels[i] !== 0) return (axis === 'x' ? i % w : (i - (i % w)) / w) - (pixels[i] - 1);
    return 0;
  };
  return [at('x'), at('y')];
}

/**
 * The neck rule (spec, section 5): where a head meets a torso, the pixels on each side of the join are within one shade
 * step of each other. Checked on the parts as drawn: before marks, before the outline and shading. For each leg count,
 * each pose, each head and each of the nine head shifts, the torso alone (once per leg count and pose) and the head alone
 * are assembled at their real places (the head is placed on the torso, then the torso is left undrawn). A join pair is a
 * head pixel and a 4-adjacent torso pixel the head does not cover, both ramp values (1-12); it breaks the rule when their
 * shade steps (position in the ramp, so pixels of different ramps compare by position) differ by more than one.
 * Returns, per head id with a breach: { pixels: distinct offending head pixels, counted in the head frame's own
 * coordinates (frame, x, y); cases: the (pose, shift, leg count) cases with a breach; example: the first breaching pair,
 * each pixel in its own part's frame coordinates }.
 */
function neckJoins(catalogue, scaffold, torsoId, headIds, legCounts, recipeFor, cache) {
  const found = new Map();
  const torsoPart = catalogue.parts.get(torsoId);
  for (const legs of legCounts) {
    const base = recipeFor(LIMB_COUNTS.indexOf(legs));
    const pairOf = (headId) => ({
      ...base,
      parts: [{ slot: 'torso', index: 0, partId: torsoId, source: 'own' }, { slot: 'head', index: 0, partId: headId, source: 'own' }],
      marking: { ...base.marking, pattern: 0 },
    });
    for (const pose of Object.keys(scaffold.poses)) {
      const torsoOnly = numberedCopy(pairOf(headIds[0]), catalogue, cache, (k) => (k === 0 ? 'real' : 'blank'));
      const tp = assemble(torsoOnly.recipe, pose, torsoOnly.catalogue).buffer.pixels;
      let torsoAt;
      for (const headId of headIds) {
        const headPart = catalogue.parts.get(headId);
        const two = pairOf(headId);
        for (const shift of HEAD_SHIFTS) {
          const headOnly = numberedCopy({ ...two, shift }, catalogue, cache, (k) => (k === 0 ? 'blank' : 'real'));
          const { w, pixels: hp } = assemble(headOnly.recipe, pose, headOnly.catalogue).buffer;
          let headAt;
          let breach = false;
          for (let i = 0; i < hp.length; i++) {
            const hv = hp[i];
            if (!inRamp(hv)) continue;
            const x = i % w;
            for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
              if (j < 0 || j >= hp.length || hp[j] !== 0 || !inRamp(tp[j])) continue;
              if (Math.abs(shadeOf(hv) - shadeOf(tp[j])) <= 1) continue;
              breach = true;
              headAt ??= frameOrigin({ ...two, shift }, 1, pose, catalogue, cache);
              torsoAt ??= frameOrigin(two, 0, pose, catalogue, cache);
              const local = (k, [ox, oy]) => `${(k % w) - ox},${(k - (k % w)) / w - oy}`;
              const headFrame = frameShown(scaffold, pose, 'head', 0, legs, headPart);
              let entry = found.get(headId);
              if (entry === undefined) {
                entry = { pixels: new Set(), cases: 0, example: `head ${headFrame} ${local(i, headAt)} value ${hv} beside torso ${frameShown(scaffold, pose, 'torso', 0, legs, torsoPart)} ${local(j, torsoAt)} value ${tp[j]}` };
                found.set(headId, entry);
              }
              entry.pixels.add(`${headFrame} ${local(i, headAt)}`);
            }
          }
          if (breach) found.get(headId).cases++;
        }
      }
    }
  }
  return headIds.filter((id) => found.has(id)).map((id) => { const f = found.get(id); return { head: id, pixels: f.pixels.size, cases: f.cases, example: f.example }; });
}

/**
 * Checks one pack text. Pure: reads nothing, writes nothing.
 * A parser error ends the check. Otherwise: a summary, the distinct gaps met while composing the sampled
 * creatures of every scaffold (variant:, marks:, role: and a missing back part or head feature are information, see
 * gapIsInfo), creatures touching the canvas edge, creatures
 * whose picture is not one 4-connected region (outline ignored), and structural problems.
 */
export function checkPack(text) {
  let catalogue;
  try {
    catalogue = parseCatalogueText(text);
  } catch (error) {
    return { ok: false, parseError: error instanceof Error ? error.message : String(error), summary: null, sampled: SAMPLED, composed: 0, variants: 0, gaps: [], edge: [], detached: [], hidden: [], structure: [], unreachable: [], failures: [], neck: [], info: [] };
  }
  const parts = [...catalogue.parts.values()];
  const summary = {
    parts: parts.length,
    byFamily: countBy(parts, (p) => p.family),
    bySlot: countBy(parts, (p) => p.slot),
    byTier: countBy(parts, (p) => p.tier),
    scaffolds: catalogue.scaffolds.size,
    fallbacks: catalogue.fallbacks.size,
    colours: catalogue.palette.colours.length,
    ramps: Object.keys(catalogue.palette.ramps).length,
  };
  const labels = labelCatalogue(catalogue);
  const gapCounts = new Map();
  const edge = [];
  const detached = [];
  const hidden = [];
  const numberedFrames = new Map();
  const unreachable = [];
  const neck = [];
  const failed = new Set();
  let composed = 0;

  const variantGroups = variantsByType(catalogue);
  let variants = 0;
  for (const scaffold of catalogue.scaffolds.values()) {
    const genes = genomeFor(scaffold);
    if (genes === undefined) {
      unreachable.push(`scaffold ${scaffold.id}: no fauna genome resolves to it, so the renderer never uses it`);
      continue;
    }
    const heads = kindsFor(catalogue, scaffold, 'head', 'h', 10);
    const someHeads = heads.length > 0 ? heads : [0];
    const realTails = kindsFor(catalogue, scaffold, 'tail', 't', 7).filter((t) => t !== 0);
    const tails = [0, ...realTails];
    const poses = Object.keys(scaffold.poses);
    const genomeOf = (head, tail, limbs, eyes, pattern = 0, skin = BASE_SKIN) => ({ kingdom: 'fauna', seed: 1, ...genes, head, tail, limbs, eyes, pattern, skin, color: 0, accent: 0, lumin: false });

    /** Composes one recipe in one pose, counting its gaps; a compose error is recorded and gives undefined. */
    const composeOnce = (recipe, pose) => {
      let out;
      try {
        out = compose(recipe, pose, catalogue);
      } catch (error) {
        failed.add(`${error instanceof Error ? error.message : String(error)} (needed by ${scaffold.id})`);
        return undefined;
      }
      composed++;
      for (const gap of out.gaps) gapCounts.set(gap, (gapCounts.get(gap) ?? 0) + 1);
      return out;
    };
    /** Composes one recipe in every pose for its gaps and compose failures only. */
    const gapsOnly = (recipe) => { for (const pose of poses) composeOnce(recipe, pose); };
    /** Composes one recipe in every pose: gaps, edge and connectivity at its own shift, then at each extra shift pair. */
    const check = (genome, recipe, shiftPairs, variant) => {
      for (const pose of poses) {
        const out = composeOnce(recipe, pose);
        if (out === undefined) continue;
        const where = variant === undefined ? { scaffold: scaffold.id, genome, pose } : { scaffold: scaffold.id, genome, pose, variant };
        if (touchesEdge(out.buffer)) edge.push(where);
        const own = detachedSlots(assemble(recipe, pose, labels).buffer);
        if (own) detached.push({ ...where, shift: recipe.shift, off: own });
        const showing = (shifted) => {
          for (const h of hiddenParts(shifted, pose, catalogue, numberedFrames)) hidden.push({ ...where, shift: shifted.shift, ...h });
        };
        showing(recipe);
        for (const shift of shiftPairs) {
          const picture = assemble({ ...recipe, shift }, pose, labels).buffer;
          if (nearEdge(picture)) edge.push({ ...where, shift });
          const off = detachedSlots(picture);
          if (off) detached.push({ ...where, shift, off });
          showing({ ...recipe, shift });
        }
      }
    };

    // Gaps, edge and own-shift connectivity: every head x every tail and no tail x limbs genes 0-5 at eight eyes,
    // plus every eyes gene for each head.
    const creatures = new Map();
    const add = (head, tail, limbs, eyes) => creatures.set(`${head} ${tail} ${limbs} ${eyes}`, [head, tail, limbs, eyes]);
    for (const head of someHeads) {
      for (const tail of tails) for (let limbs = 0; limbs < 6; limbs++) add(head, tail, limbs, FULL_EYES);
      for (let eyes = 0; eyes < 6; eyes++) add(head, tails[tails.length - 1], FULL_LIMBS, eyes);
    }
    for (const [head, tail, limbs, eyes] of creatures.values()) {
      const genome = genomeOf(head, tail, limbs, eyes);
      check(genome, buildRecipe(genome, [], catalogue), []);
    }

    // The leg counts this scaffold draws differently: each a legs= entry of one of its poses or a leg-count attach name
    // on one of its torsos is written for.
    const torsoKind = scaffold.id.split('/')[1];
    const legCounts = new Set();
    for (const pose of Object.values(scaffold.poses)) for (const e of pose.entries) if (e.legs !== undefined) legCounts.add(e.legs);
    for (const part of catalogue.parts.values()) {
      if (part.family !== scaffold.family || part.slot !== 'torso' || part.kind !== torsoKind || part.tier !== scaffold.tier) continue;
      for (const frame of Object.values(part.frames)) for (const point of Object.keys(frame.attach)) if (LEG_COUNT_POINTS.has(point)) legCounts.add(LEG_COUNT_POINTS.get(point));
    }

    // Marks, back parts and head features: for each head kind with the last tail and eight eyes, one creature at eight
    // legs for each pattern gene but plain (on the base skin), and one for each skin gene that has a back part (plain) at
    // eight legs and again at each of those leg counts (a legs= entry can move or swap the back part). A patterned
    // creature is composed for its gaps only: marks never change which pixels are drawn, so its edge, connectivity and
    // hidden parts are those of the same parts unpainted.
    const backLimbs = [FULL_LIMBS, ...[...legCounts].sort((a, b) => a - b).map((n) => LIMB_COUNTS.indexOf(n)).filter((g) => g !== FULL_LIMBS)];
    for (const head of someHeads) {
      const tail = tails[tails.length - 1];
      for (const pattern of PATTERN_GENES) {
        gapsOnly(buildRecipe(genomeOf(head, tail, FULL_LIMBS, FULL_EYES, pattern), [], catalogue));
      }
      for (const skin of BACK_SKINS) {
        for (const limbs of backLimbs) {
          const genome = genomeOf(head, tail, limbs, FULL_EYES, 0, skin);
          check(genome, buildRecipe(genome, [], catalogue), []);
        }
      }
    }

    // Shift sweep, with no legs (more parts only add pixels, so none is the strictest case), then again at each of those
    // leg counts (a legs= entry can move a head or tail): every head alone at its nine shifts, then head and tail kinds
    // paired in turn (every head and every tail kind at least once) at all 81 combinations of the nine head shifts and
    // nine tail shifts, so a head and tail moving in opposite directions are composed.
    const sweepLimbs = [NO_LIMBS, ...[...legCounts].sort((a, b) => a - b).map((n) => LIMB_COUNTS.indexOf(n)).filter((g) => g !== NO_LIMBS)];
    for (const limbs of sweepLimbs) {
      for (const head of someHeads) {
        const genome = genomeOf(head, 0, limbs, FULL_EYES);
        check(genome, buildRecipe(genome, [], catalogue), HEAD_SHIFTS);
      }
      for (let i = 0; i < Math.max(someHeads.length, realTails.length) && realTails.length > 0; i++) {
        const genome = genomeOf(someHeads[i % someHeads.length], realTails[i % realTails.length], limbs, FULL_EYES);
        check(genome, buildRecipe(genome, [], catalogue), SHIFT_PAIRS);
      }
    }

    // Every variant of every part type with more than one: build a patterned creature that uses the type, then compose
    // a copy of its recipe with that slot's part id replaced by the variant's. The swapped part keeps its mark: a mark is
    // keyed by slot and index, never by part id, so it is the mark buildRecipe gives a creature that picked that variant.
    // A head or tail variant also at its nine shifts. Limb variants at eight legs, the others with none; each also at
    // every leg count in legCounts, since those draw the creature differently.
    for (const group of variantGroups) {
      if (group.family !== scaffold.family || group.tier !== scaffold.tier) continue;
      if (group.slot === 'torso' && scaffold.id !== `${group.family}/${group.kind}/${group.tier}`) continue;
      const head = group.slot === 'head' ? Number(group.kind.slice(1)) : someHeads[0];
      const tail = group.slot === 'tail' ? Number(group.kind.slice(1)) : tails[tails.length - 1];
      const first = group.slot === 'farLimbs' || group.slot === 'nearLimbs' ? FULL_LIMBS : NO_LIMBS;
      const limbGenes = [first, ...[...legCounts].map((n) => LIMB_COUNTS.indexOf(n)).filter((g) => g !== first)];
      for (const limbs of limbGenes) {
        const genome = genomeOf(head, tail, limbs, FULL_EYES, FORCED_PATTERN);
        const recipe = buildRecipe(genome, [], catalogue);
        const shiftPairs = group.slot === 'head' ? HEAD_SHIFTS : group.slot === 'tail' ? TAIL_SHIFTS : [];
        for (const id of group.ids) {
          const parts = recipe.parts.map((p) => (p.slot === group.slot && group.ids.includes(p.partId) ? { ...p, partId: id } : p));
          if (!parts.some((p) => p.partId === id)) continue; // the creature does not reach this type (e.g. a head kind beyond the gene range)
          variants++;
          check(genome, { ...recipe, parts }, shiftPairs, id);
        }
      }
    }

    // marks: gaps no sampled creature met, listed with count 0 (printed x0): every frame a pose can show at any leg count.
    for (const gap of marksGapsOf(catalogue, scaffold, torsoKind)) if (!gapCounts.has(gap)) gapCounts.set(gap, 0);

    // The neck join: every head of this family and tier with every variant of this scaffold's torso, at four legs and at
    // every leg count a legs= entry for the torso or the head names.
    const neckLegs = [4, ...new Set(Object.values(scaffold.poses).flatMap((pose) => pose.entries.filter((e) => e.legs !== undefined && e.legs !== 4 && (e.slot === 'torso' || e.slot === 'head')).map((e) => e.legs)))];
    const ofScaffold = (slot) => parts.filter((p) => p.family === scaffold.family && p.slot === slot && p.tier === scaffold.tier && (slot !== 'torso' || p.kind === torsoKind));
    const neckHeads = ofScaffold('head').map((p) => p.id);
    for (const torso of ofScaffold('torso')) {
      if (neckHeads.length === 0) break;
      for (const n of neckJoins(catalogue, scaffold, torso.id, neckHeads, neckLegs, (limbs) => buildRecipe(genomeOf(someHeads[0], 0, limbs, FULL_EYES), [], catalogue), numberedFrames)) {
        neck.push({ head: n.head, torso: torso.id, pixels: n.pixels, cases: n.cases, example: n.example });
      }
    }
  }

  const gaps = [...gapCounts].map(([gap, count]) => ({ gap, count, error: !gapIsInfo(gap) }));
  const structure = structureProblems(catalogue);
  const failures = [...failed];
  const info = [];
  if (!Array.from({ length: IRIS_RAMP_COUNT }, (_, i) => `iris${i}`).some((name) => Object.hasOwn(catalogue.palette.ramps, name))) {
    info.push(`palette has no iris ramps (iris0 to iris${IRIS_RAMP_COUNT - 1}): eyes show no iris colour`);
  }
  const ok = gaps.every((g) => !g.error) && edge.length === 0 && detached.length === 0 && hidden.length === 0 && structure.length === 0 && unreachable.length === 0 && failures.length === 0;
  return { ok, parseError: null, summary, sampled: SAMPLED, composed, variants, gaps, edge, detached, hidden, structure, unreachable, failures, neck, info };
}

const compact = (record) => Object.entries(record).map(([k, v]) => `${k} ${v}`).join(', ');
const genes = (g) => `body ${g.body} loco ${g.loco} size ${g.size}${g.apex === undefined ? '' : ` apex ${g.apex}`} head ${g.head} tail ${g.tail} limbs ${g.limbs} eyes ${g.eyes}`;
const pair = ([x, y]) => `${x},${y}`;
const shiftText = (s) => `head ${pair(s.head)} tail ${pair(s.tail)}`;
const example = (e) => `${genes(e.genome)} pose ${e.pose}${e.shift === undefined ? '' : ` shift ${shiftText(e.shift)}`}${e.variant === undefined ? '' : ` with variant ${e.variant}`}`;
const unique = (values) => [...new Set(values)];

/** Items grouped by key, in first-seen order. */
function group(items, keys) {
  const groups = new Map();
  for (const item of items) {
    for (const k of keys(item)) {
      const known = groups.get(k);
      if (known) known.push(item);
      else groups.set(k, [item]);
    }
  }
  return groups;
}

/** The report as plain text: one line per distinct finding, grouped so a large pack stays readable. */
export function formatReport(report) {
  if (report.parseError !== null) return `check-pack: FAIL\nerror: parse: ${report.parseError}\n`;
  const s = report.summary;
  const lines = [
    `parts: ${s.parts} (by family: ${compact(s.byFamily)}; by slot: ${compact(s.bySlot)}; by tier: ${compact(s.byTier)})`,
    `scaffolds: ${s.scaffolds}, fallbacks: ${s.fallbacks}, palette colours: ${s.colours}, ramps: ${s.ramps}`,
    `composed: ${report.composed} creature poses (${report.variants} forced variants). Sampled: ${report.sampled}`,
  ];
  for (const g of report.gaps) lines.push(`${g.error ? 'error' : 'info'}: gap ${g.gap} (x${g.count})`);
  for (const p of report.info) lines.push(`info: ${p}`);
  for (const [scaffold, items] of group(report.edge, (e) => [e.scaffold])) {
    const first = items[0];
    lines.push(`error: touches the canvas edge on ${scaffold} in ${items.length} creature poses (poses: ${unique(items.map((e) => e.pose)).join(', ')}), e.g. ${example(first)}`);
  }
  // Eyes sit on the head: when the head is off the body its eyes go with it and are not reported again.
  const offSlots = (d) => d.off.filter((slot) => !(slot === 'eyes' && d.off.includes('head')));
  for (const [key, items] of group(report.detached, (d) => offSlots(d).map((slot) => `${slot} on ${d.scaffold}`))) {
    const slot = key.slice(0, key.indexOf(' '));
    const perPose = [...group(items, (d) => [d.pose])].map(([pose, cases]) => {
      if (slot !== 'head' && slot !== 'tail') return pose;
      const shifts = unique(cases.map((d) => pair(d.shift[slot]))).sort();
      return `${pose} [${shifts.length === SHIFTS.length ? 'all nine' : shifts.join(' ')}]`;
    });
    const label = slot === 'head' || slot === 'tail' ? `poses with ${slot} shifts` : 'poses';
    const first = items[0];
    lines.push(`error: detached ${key} in ${items.length} creature poses (${label}: ${perPose.join('; ')}), e.g. ${example(first)}`);
  }
  for (const [key, items] of group(report.hidden, (d) => [`${d.partId} on ${d.scaffold}`])) {
    const perPose = [...group(items, (d) => [d.pose])].map(([pose, cases]) => `${pose} [${unique(cases.map((d) => shiftText(d.shift))).length} shifts]`);
    const first = items[0];
    lines.push(`error: hidden part ${key} in ${items.length} creature poses (${perPose.join('; ')}), e.g. ${example(first)}: shows ${first.visible} of ${first.needed} pixels`);
  }
  for (const p of report.structure) lines.push(`error: ${p}`);
  for (const p of report.unreachable) lines.push(`error: ${p}`);
  for (const p of report.failures) lines.push(`error: compose failed: ${p}`);
  for (const n of report.neck) lines.push(`warning: neck join ${n.head} on ${n.torso}: ${n.pixels} head pixels more than one shade step from the torso beside them, in ${n.cases} pose shifts, e.g. ${n.example}`);
  const errors = lines.filter((l) => l.startsWith('error:')).length;
  return `check-pack: ${report.ok ? 'OK' : `FAIL (${errors} distinct errors)`}\n${lines.join('\n')}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('usage: node tools/check-pack.mjs <pack.txt> [more.txt ...]');
    process.exit(2);
  }
  let text;
  try {
    text = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  } catch (error) {
    console.error(`check-pack: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
  const report = checkPack(text);
  process.stdout.write(formatReport(report));
  process.exit(report.ok ? 0 : 1);
}
