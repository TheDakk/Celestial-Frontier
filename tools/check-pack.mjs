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

const { parseCatalogueText, fallbackKey, EYE_COUNTS, LIMB_COUNTS, TIER_SIZE } = await import('@cf/art-format');
const { buildRecipe, resolveAnatomy, EYELESS_HEAD } = await import('@cf/art-recipe');
const { assemble, compose } = await import('@cf/art-compose');

export const REQUIRED_POSES = ['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint'];
const TORSO_POINTS = ['head', 'tail', 'back', 'far0', 'far1', 'far2', 'far3', 'near0', 'near1', 'near2', 'near3'];
const HEAD_POINTS = ['eye0', 'eye1', 'eye2', 'eye3', 'eye4', 'eye5', 'eye6', 'eye7'];
const SIZE_FOR_TIER = { small: 0, medium: 2, large: 4, guardian: 0 };
const SHIFTS = [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((x) => [x, y]));
// Each slot drawn in the label picture with its own value, so a detached region says which slot it is.
const SLOT_LABEL = { torso: 1, tail: 2, farLimbs: 3, nearLimbs: 4, head: 5, eyes: 6, back: 7, headFeature: 8, glow: 9 };
const LABEL_SLOT = Object.fromEntries(Object.entries(SLOT_LABEL).map(([slot, v]) => [v, slot]));
const FULL_EYES = EYE_COUNTS.indexOf(8); // eight eyes: every eye attach point
const FULL_LIMBS = LIMB_COUNTS.indexOf(8); // eight legs: every leg attach point
const NO_LIMBS = LIMB_COUNTS.indexOf(0);

export const SAMPLED =
  'every head kind x every tail kind and no tail x limbs genes 0-5, at eyes gene ' + FULL_EYES +
  ' (eight eyes: every eye point), plus eyes genes 0-5 for each head kind; every pose the scaffold defines. ' +
  'Detachment also at the nine head and tail shift values (applied together) for limbs genes ' +
  FULL_LIMBS + ' (eight legs) and ' + NO_LIMBS + ' (none).';

const countBy = (items, key) => {
  const out = {};
  for (const item of items) out[key(item)] = (out[key(item)] ?? 0) + 1;
  return out;
};

/** The genome a scaffold is drawn for: a fauna body and movement gene that resolve to its family and torso type. */
function genomeFor(scaffold) {
  const [family, torsoKind] = scaffold.id.split('/');
  const size = SIZE_FOR_TIER[scaffold.tier];
  for (const loco of [0, 4]) {
    for (let body = 0; body < 16; body++) {
      const a = resolveAnatomy({ kingdom: 'fauna', body, loco, size });
      if (a.family === family && (a.torso === '' ? 'body' : a.torso) === torsoKind) return { body, loco, size };
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

/** The same catalogue with every drawn pixel replaced by its slot's label: same geometry, pixels say who drew them. */
function labelCatalogue(catalogue) {
  const parts = new Map();
  for (const [id, part] of catalogue.parts) {
    const label = SLOT_LABEL[part.slot];
    const frames = Object.create(null);
    for (const name of Object.keys(part.frames)) {
      const f = part.frames[name];
      frames[name] = { ...f, pixels: f.pixels.map((v) => (v === 0 ? 0 : label)) };
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

/** Problems a reader can see without composing: attach points, poses, contact points, fallbacks. */
function structureProblems(catalogue) {
  const problems = [];
  const fallbackParts = new Set(catalogue.fallbacks.values());
  for (const part of catalogue.parts.values()) {
    // The eyeless head never carries eyes, so it needs no eye points.
    const required = part.slot === 'torso' && !fallbackParts.has(part.id) ? TORSO_POINTS : part.slot === 'head' && part.kind !== `h${EYELESS_HEAD}` ? HEAD_POINTS : [];
    if (required.length === 0) continue;
    for (const name of Object.keys(part.frames)) {
      const missing = required.filter((p) => !Object.hasOwn(part.frames[name].attach, p));
      if (missing.length > 0) problems.push(`part ${part.id} frame ${name}: missing attach point ${missing.join(', ')}`);
    }
  }
  for (const scaffold of catalogue.scaffolds.values()) {
    const missing = REQUIRED_POSES.filter((p) => !Object.hasOwn(scaffold.poses, p));
    if (missing.length > 0) problems.push(`scaffold ${scaffold.id}: missing pose ${missing.join(', ')}`);
    if (Object.hasOwn(scaffold.poses, 'strike') && scaffold.poses['strike'].contact === undefined) {
      problems.push(`scaffold ${scaffold.id}: pose strike has no contact point`);
    }
  }
  problems.push(...fallbackProblems(catalogue));
  return problems;
}

/**
 * Checks one pack text. Pure: reads nothing, writes nothing.
 * A parser error ends the check. Otherwise: a summary, the distinct gaps met while composing the sampled
 * creatures of every scaffold (variant: gaps are information), creatures touching the canvas edge, creatures
 * whose picture is not one 4-connected region (outline ignored), and structural problems.
 */
export function checkPack(text) {
  let catalogue;
  try {
    catalogue = parseCatalogueText(text);
  } catch (error) {
    return { ok: false, parseError: error instanceof Error ? error.message : String(error), summary: null, sampled: SAMPLED, composed: 0, gaps: [], edge: [], detached: [], structure: [], unreachable: [], failures: [] };
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
  const unreachable = [];
  const failed = new Set();
  let composed = 0;

  for (const scaffold of catalogue.scaffolds.values()) {
    const genes = genomeFor(scaffold);
    if (genes === undefined) {
      unreachable.push(`scaffold ${scaffold.id}: no fauna genome resolves to it, so the renderer never uses it`);
      continue;
    }
    const guardian = scaffold.tier === 'guardian';
    const heads = kindsFor(catalogue, scaffold, 'head', 'h', 10);
    const tails = [0, ...kindsFor(catalogue, scaffold, 'tail', 't', 7).filter((t) => t !== 0)];
    const poses = Object.keys(scaffold.poses);
    const creatures = new Map();
    const add = (head, tail, limbs, eyes, shifts) => {
      const key = `${head} ${tail} ${limbs} ${eyes}`;
      const known = creatures.get(key);
      if (known) known.shifts ||= shifts;
      else creatures.set(key, { head, tail, limbs, eyes, shifts });
    };
    for (const head of heads.length > 0 ? heads : [0]) {
      for (const tail of tails) for (let limbs = 0; limbs < 6; limbs++) add(head, tail, limbs, FULL_EYES, limbs === FULL_LIMBS || limbs === NO_LIMBS);
      for (let eyes = 0; eyes < 6; eyes++) add(head, tails[tails.length - 1], FULL_LIMBS, eyes, false);
    }

    for (const c of creatures.values()) {
      const genome = { kingdom: 'fauna', seed: 1, ...genes, head: c.head, tail: c.tail, limbs: c.limbs, eyes: c.eyes, pattern: 0, skin: 0, color: 0, accent: 0, lumin: false };
      const recipe = buildRecipe(genome, [], catalogue, { guardian });
      for (const pose of poses) {
        let out;
        try {
          out = compose(recipe, pose, catalogue);
        } catch (error) {
          failed.add(`${error instanceof Error ? error.message : String(error)} (needed by ${scaffold.id})`);
          continue;
        }
        composed++;
        for (const gap of out.gaps) gapCounts.set(gap, (gapCounts.get(gap) ?? 0) + 1);
        const where = { scaffold: scaffold.id, genome, guardian, pose };
        if (touchesEdge(out.buffer)) edge.push(where);
        const own = detachedSlots(assemble(recipe, pose, labels).buffer);
        if (own) detached.push({ ...where, shift: recipe.shift, off: own });
        if (!c.shifts) continue;
        for (const s of SHIFTS) {
          const shift = { head: s, tail: s };
          const off = detachedSlots(assemble({ ...recipe, shift }, pose, labels).buffer);
          if (off) detached.push({ ...where, shift, off });
        }
      }
    }
  }

  const gaps = [...gapCounts].map(([gap, count]) => ({ gap, count, error: !gap.startsWith('variant:') }));
  const structure = structureProblems(catalogue);
  const failures = [...failed];
  const ok = gaps.every((g) => !g.error) && edge.length === 0 && detached.length === 0 && structure.length === 0 && unreachable.length === 0 && failures.length === 0;
  return { ok, parseError: null, summary, sampled: SAMPLED, composed, gaps, edge, detached, structure, unreachable, failures };
}

const compact = (record) => Object.entries(record).map(([k, v]) => `${k} ${v}`).join(', ');
const genes = (g, guardian) => `body ${g.body} loco ${g.loco} size ${g.size} head ${g.head} tail ${g.tail} limbs ${g.limbs} eyes ${g.eyes}${guardian ? ' guardian' : ''}`;
const pair = ([x, y]) => `${x},${y}`;
const shiftText = (s) => `head ${pair(s.head)} tail ${pair(s.tail)}`;
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
    `composed: ${report.composed} creature poses. Sampled: ${report.sampled}`,
  ];
  for (const g of report.gaps) lines.push(`${g.error ? 'error' : 'info'}: gap ${g.gap} (x${g.count})`);
  for (const [scaffold, items] of group(report.edge, (e) => [e.scaffold])) {
    const first = items[0];
    lines.push(`error: touches the canvas edge on ${scaffold} in ${items.length} creature poses (poses: ${unique(items.map((e) => e.pose)).join(', ')}), e.g. ${genes(first.genome, first.guardian)} pose ${first.pose}`);
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
    lines.push(`error: detached ${key} in ${items.length} creature poses (${label}: ${perPose.join('; ')}), e.g. ${genes(first.genome, first.guardian)} pose ${first.pose} shift ${shiftText(first.shift)}`);
  }
  for (const p of report.structure) lines.push(`error: ${p}`);
  for (const p of report.unreachable) lines.push(`error: ${p}`);
  for (const p of report.failures) lines.push(`error: compose failed: ${p}`);
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
