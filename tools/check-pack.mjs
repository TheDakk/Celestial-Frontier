// Checks an art pack (palette, parts, scaffolds, fallbacks in the art text format) the way the renderer will use it.
// Usage: node tools/check-pack.mjs [--require-coverage] [--coverage-seeds=<first>-<last>] <pack.txt> [more.txt ...]
// (files are joined with a newline, then parsed). Reads only the files given and writes nothing. Exit code 0 only when
// there is no error; a coverage gap (a generated creature or Guardian the pack cannot draw in full at rest) is no
// error unless --require-coverage is given.
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

const { parseCatalogueText, fallbackKey, EYE_COUNTS, LIMB_COUNTS, TIER_SIZE, LAYER_NAMES, MARK_SLOTS, IRIS_RAMP_COUNT, PATTERN_NAMES, SKIN_NAMES, PIXEL_BONE, PIXEL_CHARS, BONE_RAMP } = await import('@cf/art-format');
const { buildRecipe, buildSpeciesRecipe, speciesIrisRamp, speciesBoneRamp, planSpeciesParts, limbKind, EYELESS_HEAD, BACK_KIND_BY_SKIN, bodyOf, routeBody, resolveBody, planBodyParts, OWN_FAMILY_BY_BODY, WING_KINDS } = await import('@cf/art-recipe');
const { assemble, compose, frameNameFor, paintMarks, poseEntryFor } = await import('@cf/art-compose');
const { guardianFor, makeGenome } = await import('@cf/domain-genome');

export const REQUIRED_POSES = ['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint'];
/**
 * The attach points a generated torso needs, by family: the points the parts of planBodyParts hang from on the torso
 * (attachFor in the composer); a torso of a family not listed here takes the four-legged set. A torso also needs `wing`
 * once the pack holds a `wing-<its torso type>` of its family and tier, and `wing1` once it holds a `hindwing-<torso type>`.
 */
export const TORSO_POINTS_BY_FAMILY = Object.freeze(Object.fromEntries(Object.entries({
  quadruped: ['head', 'tail', 'back', 'far0', 'far1', 'far2', 'far3', 'near0', 'near1', 'near2', 'near3'],
  fish: ['head', 'tail', 'back'],
  crustacean: ['head', 'tail', 'back'],
  insect: ['head', 'back', 'far0', 'far1', 'far2', 'near0', 'near1', 'near2'],
  tentacled: ['tail', 'back'],
  serpent: ['eye0', 'back'],
  gelatinous: ['back'],
  radial: [],
}).map(([family, points]) => [family, Object.freeze(points)])));
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
/** The eye indexes a creature drawing `eyes` eyes fills: one per eye, or 0 and 1 for the two pits of a creature with none. */
const eyesDrawn = (eyes) => (eyes === 0 ? 2 : eyes);
/** Every name with an eye count: `eye<i>_<n>`, on a head or a torso, checked against EYE_COUNT_POINTS. */
const EYE_COUNT_NAME = /^eye\d+_\d+$/;
/**
 * Every eye-count attach name the composer can ask a head (or a torso that carries the eyes) for, with its eye count:
 * `eye<i>_<n>` for each eye count n and each eye index i that count fills (eyesDrawn). Such a name is optional (the
 * plain name is the fallback); any other name of that form is never used.
 */
const EYE_COUNT_POINTS = new Map(EYE_COUNTS.flatMap((n) => Array.from({ length: eyesDrawn(n) }, (_, i) => [`eye${i}_${n}`, n])));
// The genes that give each tier: a size gene, and for the guardian tier the Guardian marker the game sets (apex).
const GENES_FOR_TIER = { small: { size: 0 }, medium: { size: 2 }, large: { size: 4 }, guardian: { size: 5, apex: 12 } };
const SHIFTS = [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((x) => [x, y]));
const HEAD_SHIFTS = SHIFTS.map((s) => ({ head: s, tail: [0, 0] }));
/** A named species has no seeded shift. */
const NO_SHIFT = [{ head: [0, 0], tail: [0, 0] }];
const TAIL_SHIFTS = SHIFTS.map((s) => ({ head: [0, 0], tail: s }));
const SHIFT_PAIRS = SHIFTS.flatMap((head) => SHIFTS.map((tail) => ({ head, tail })));
/** The nine head shifts, then the eight other tail shifts, each with the other part unshifted. */
const HEAD_OR_TAIL_SHIFTS = [...HEAD_SHIFTS, ...TAIL_SHIFTS.filter((s) => s.tail[0] !== 0 || s.tail[1] !== 0)];
// Each slot drawn in the label picture with its own value, so a detached region says which slot it is.
const SLOT_LABEL = { torso: 1, tail: 2, farLimbs: 3, nearLimbs: 4, head: 5, eyes: 10, back: 7, headFeature: 8, glow: 9, bodyFeature: 6, farWings: 11, nearWings: 12 };
/** The first per-part label of the hidden-part pictures: above every pixel value (0-28), so the composer's iris rewrite of 5-8 can never touch a label. */
const LABEL_BASE = 29;
const LABEL_SLOT = Object.fromEntries(Object.entries(SLOT_LABEL).map(([slot, v]) => [v, slot]));
/** The palette's iris ramp names, iris0 to iris10: one per theme, in THEME_NAMES order. */
const IRIS_RAMPS = Array.from({ length: IRIS_RAMP_COUNT }, (_, i) => `iris${i}`);
const FULL_EYES = EYE_COUNTS.indexOf(8); // eight eyes: every eye attach point
/** The base sample's skin: slick and wet, which asks for no back part, so the base pictures hold no back part. */
const BASE_SKIN = 3;
/** The pattern genes swept (every pattern but plain), the skin genes that ask for a back part, and translucent skin. */
const PATTERN_GENES = [1, 2, 3, 4, 5, 6, 7];
const BACK_SKINS = BACK_KIND_BY_SKIN.flatMap((kind, skin) => (kind === null ? [] : [skin]));
const TRANSLUCENT_SKIN = SKIN_NAMES.indexOf('translucent');
/** The pattern of a creature with a forced variant: patterned, so a forced part is painted and a variant with no layers is counted. */
const FORCED_PATTERN = 1;
/**
 * Hide ramp values are 1-12 (three ramps of four); a value's shade step is its position in its ramp, 0 darkest to 3 lightest.
 * Bone (21-24) and deep (25-28) are not hide: no mark or skin is painted on them, so a layer pixel over either is outside the drawn area, and the neck rule reads neither.
 */
const inRamp = (v) => v >= 1 && v <= 12;
const isBone = (v) => v >= PIXEL_BONE && v < PIXEL_BONE + 4;
/** The bone values as an artist writes them: `l to o`. */
const BONE_CHARS = `${PIXEL_CHARS[PIXEL_BONE]} to ${PIXEL_CHARS[PIXEL_BONE + 3]}`;
/** Whether any frame of the part draws a bone value, in its pixels or in a layer. */
const drawsBone = (part) => Object.values(part.frames).some((f) => f.pixels.some(isBone) || Object.values(f.layers ?? {}).some((layer) => layer.some(isBone)));
const shadeOf = (v) => (v - 1) & 3;
/** The fewest pixels a requested part must show; a part that draws fewer (a one-pixel eye) must show all of them. */
export const HIDDEN_MIN = 4;

/** The seeds shapedGenome tries, from 1. */
const SHAPE_SEEDS = 64;

export const SAMPLED =
  'each generated scaffold in every state its parts differ in (routeStates: land; airborne for a four-legged body, which ' +
  'adds sails or folds a winged body to two legs; aquatic for a winged body, with flippers and fins, and for a fish), ' +
  'every genome shaped to the scaffold\'s shape (shapedGenome, seeds 1 to ' + SHAPE_SEEDS + '). Per state: every head kind the pack holds x every ' +
  'tail kind the family asks for (t0 to t6 on a four-legged body; t2, t3, t5, t6 and no tail elsewhere; none where it has no tail) x every leg count ' +
  'the body draws, at eyes gene ' + FULL_EYES + ' (eight eyes: every eye point), plus every eye count for each head kind, in the first state; in a later ' +
  'state (which adds only parts hung from the torso) head and tail kinds paired in turn (each kind at least once) x every leg count; all plain with skin ' + BASE_SKIN +
  ' (no back part); every pose the scaffold defines. For each head kind (the first only in a later state) with the last tail, eight eyes and the most legs: one creature ' +
  'for each pattern gene ' + PATTERN_GENES.join(', ') + ' at full strength and one with translucent skin (' + TRANSLUCENT_SKIN + '), composed for ' +
  'their gaps only (marks and skin never change which pixels are drawn, so they are not checked for the edge, detachment or hidden parts, and their own ' +
  'seeded variants and shifts are not sampled for them), and one for each skin gene with a back part (' + BACK_SKINS.join(', ') + ') at the most ' +
  'legs and again at every leg count a legs= entry or a torso leg-count attach point of the scaffold is written for, and all of those again at every ' +
  'eye count but eight an eyes= entry of the scaffold or an eye-count attach point (eye<i>_<n>) of its heads or torsos is written for, in every pose at its own shift. ' +
  'Shift sweep (edge and detachment), at the fewest legs the body draws and again at every such leg count: every head kind alone (the tail part taken out) at ' +
  'its nine shifts, and head and tail kinds paired in turn (each kind at least once) at all 81 head x tail shift combinations in the first state, ' +
  'at the nine head shifts and then the nine tail shifts in a later one (it adds only parts hung from the torso). ' +
  'Every variant of a part type with more than one, forced into a patterned creature (pattern gene ' + FORCED_PATTERN + '), in every pose (a head or tail variant also at its nine shifts), ' +
  'also at every such leg count; a head or torso variant at each of those also at every such eye count. ' +
  'Every requested part must show ' + HIDDEN_MIN + ' pixels (all of its pixels if it draws fewer) in every one of these pictures. ' +
  'A marks: gap is also listed, as x0, for every frame a pose can show at any leg count that no sampled creature drew. ' +
  'A named species is composed on its own scaffold in every pose it defines, once (no seeded choices), and its head is checked at the neck against its own torso only; ' +
  'its parts take no part in the sampling above.';

/** The slots whose missing part is information: a back part, a head feature, a wing (or sails), a body feature. */
const INFO_SLOTS = ['back', 'headFeature', 'farWings', 'nearWings', 'bodyFeature'];
/** Whether a limb kind is a flipper: the shared `flipper` or a build's own `flipper-<torso type>`. */
const isFlipper = (kind) => kind === 'flipper' || kind.startsWith('flipper-');

/**
 * Whether a gap is information rather than an error: a missing variant (`variant:`), a frame with no layer for the
 * creature's pattern (`marks:`), a translucent creature's torso frame with no `translucent` layer (`skin:`), a leg
 * role drawn with the shared leg (`role:`), a missing back part, head feature, wing,
 * sails or body feature (`missing:` of a part in slot back, headFeature, farWings, nearWings or bodyFeature), or a
 * missing flipper (in slot farLimbs or nearLimbs). Every other gap is an error, a missing `t0` tail or `pit` eye included.
 */
export function gapIsInfo(gap) {
  if (/^(variant|marks|skin|role):/.test(gap)) return true;
  const m = /^missing:[^/]*\/([^/]*)\/([^/]*)\//.exec(gap);
  return m !== null && (INFO_SLOTS.includes(m[1]) || ((m[1] === 'farLimbs' || m[1] === 'nearLimbs') && isFlipper(m[2])));
}

/** A sampled genome's genes, as the report prints them. */
const genesText = (g) => `body ${g.body} loco ${g.loco} habitat ${g.habitat} size ${g.size}${g.apex === undefined ? '' : ` apex ${g.apex}`} head ${g.head} tail ${g.tail} limbs ${g.limbs} eyes ${g.eyes} skin ${g.skin} seed ${g.seed}`;

const countBy = (items, key) => {
  const out = {};
  for (const item of items) out[key(item)] = (out[key(item)] ?? 0) + 1;
  return out;
};

/** The movement and habitat genes of each state: grazers, gliders (airborne), swimmers (aquatic), all in the deep forest canopy. */
const STATE_GENES = { land: { loco: 0, habitat: 0 }, airborne: { loco: 3, habitat: 0 }, aquatic: { loco: 4, habitat: 0 } };
const OWN_FAMILIES = new Set(Object.values(OWN_FAMILY_BY_BODY));

/** Every `<family>/<torso>` a fauna genome reaches (generatedTorsos): a species key may not be the torso of its family. */
const GENERATED_TORSOS = generatedTorsos();

/**
 * What the head and eye parts of each family can be asked for, read from resolveBody over every route, shape and eye
 * gene: `eyes`, the most eyes a body of the family hangs from its head (a head part is shared by every shape of its
 * family, so a crustacean head serves the lobster's eyes though a crab's carries none); `pit`, whether a body of the
 * family asks for the two sensory pits (no eyes, or the eyeless head).
 */
const EYES_BY_FAMILY = (() => {
  const out = new Map();
  for (const stateGenes of Object.values(STATE_GENES)) {
    for (let body = 0; body < 16; body++) {
      const { family, shapes } = routeBody({ body, ...stateGenes });
      for (let i = 0; i < shapes.length; i++) {
        for (let eyes = 0; eyes < EYE_COUNTS.length; eyes++) {
          const b = resolveBody({ kingdom: 'fauna', body, ...stateGenes, head: 0, eyes }, () => i);
          const known = out.get(family) ?? { eyes: 0, pit: false };
          const onHead = b.head !== null && b.eyes !== null ? b.eyes : 0;
          out.set(family, { eyes: Math.max(known.eyes, onHead), pit: known.pit || b.eyes === 0 });
        }
      }
    }
  }
  return out;
})();

/** Whether a part is in the wing slots or the body feature slot, or is a flipper: the parts NEW_KINDS names. */
const isNewPart = (part) => part.slot === 'farWings' || part.slot === 'nearWings' || part.slot === 'bodyFeature' || ((part.slot === 'farLimbs' || part.slot === 'nearLimbs') && isFlipper(part.kind));

/**
 * The kinds a creature asks for in the wing slots and the body feature slot, and as flippers, each as
 * `<family>/<slot>/<kind>`: read from planBodyParts over every route (state, body gene, shape), once with a pack that
 * holds every part (the own kinds, `sails-<torso type>`) and once with a pack that holds none (the shared kinds a miss
 * names, `sails`, `flipper`). The other genes change none of these parts.
 */
const NEW_KINDS = (() => {
  const kinds = new Set();
  const holdsAll = { parts: { has: () => true } };
  const holdsNone = { parts: new Map() };
  const variants = { torso: 0, head: 0, tail: 0, limb: 0 };
  for (const stateGenes of Object.values(STATE_GENES)) {
    for (let body = 0; body < 16; body++) {
      const { shapes } = routeBody({ body, ...stateGenes });
      for (let i = 0; i < shapes.length; i++) {
        const b = resolveBody({ kingdom: 'fauna', body, ...stateGenes }, () => i);
        const asked = [
          ...planBodyParts(b, variants, () => () => 0, holdsAll).parts.map((p) => p.partId),
          ...planBodyParts(b, variants, () => () => 0, holdsNone).gaps.filter((g) => g.startsWith('missing:')).map((g) => g.slice('missing:'.length)),
        ];
        for (const id of asked) {
          const [family, slot, kind] = id.split('/');
          if (isNewPart({ slot, kind })) kinds.add(`${family}/${slot}/${kind}`);
        }
      }
    }
  }
  return kinds;
})();

/**
 * The states a routed scaffold `<family>/<torso>/<tier>` is sampled in, each with the first body gene (in gene order) that
 * routes to that family and shape there. A four-legged torso type on land and airborne, and aquatic where the body stays
 * four-legged (membranous, fourwinged); a fish shape aquatic only; an own-animal family on land only (its parts are the
 * same in every state). An id no genome reaches gives [].
 */
export function routeStates(scaffoldId) {
  const [family, torso, tier] = scaffoldId.split('/');
  const tierGenes = GENES_FOR_TIER[tier];
  if (tierGenes === undefined) return [];
  const states = [];
  for (const [state, stateGenes] of Object.entries(STATE_GENES)) {
    for (let body = 0; body < 16; body++) {
      const r = routeBody({ ...tierGenes, body, ...stateGenes });
      if (r.family !== family || !r.shapes.includes(torso)) continue;
      states.push({ state, genes: { ...tierGenes, body, ...stateGenes } });
      break;
    }
  }
  return OWN_FAMILIES.has(family) ? states.slice(0, 1) : states;
}

/**
 * The genome with the smallest seed from 1 to SHAPE_SEEDS for which bodyOf gives this family and torso, every other gene
 * kept; undefined when none does. The shape follows the seed alone, so every sampled genome is shaped by this.
 */
export function shapedGenome(genome, family, torso) {
  for (let seed = 1; seed <= SHAPE_SEEDS; seed++) {
    const shaped = { ...genome, seed };
    const b = bodyOf(shaped);
    if (b.family === family && b.torso === torso) return shaped;
  }
  return undefined;
}

/**
 * The genome checkPack samples for a scaffold: `genome` shaped to `family` and `torso` (shapedGenome), drawn at `tier`.
 * shapedGenome finds no seed for a shape the genome's animal does not have, and never looks at the tier, so either is a
 * failure line here, not a crash or a creature drawn on another scaffold.
 */
export function shapedFor(genome, family, torso, tier) {
  const shaped = shapedGenome(genome, family, torso);
  if (shaped === undefined) return { failure: `no seed from 1 to ${SHAPE_SEEDS} gives ${genesText(genome)} the shape ${family}/${torso}` };
  const drawn = bodyOf(shaped).tier;
  if (drawn !== tier) return { failure: `${genesText(shaped)} draws at tier ${drawn}, not ${tier}` };
  return { genome: shaped };
}

/** Every `<family>/<torso>` a fauna genome reaches on the routed path: every shape of every family a body gene routes to, in any state. */
export function generatedTorsos() {
  const out = new Set();
  for (const stateGenes of Object.values(STATE_GENES)) {
    for (let body = 0; body < 16; body++) {
      const r = routeBody({ body, ...stateGenes });
      for (const shape of r.shapes) out.add(`${r.family}/${shape}`);
    }
  }
  return out;
}

/** The seeds whose generated creatures the coverage walk asks the pack for, unless the caller names others. */
export const COVERAGE_SEEDS = Object.freeze({ first: 1, last: 2000 });
const TIER_ORDER = ['small', 'medium', 'large', 'guardian'];

/**
 * What the generator asks of the pack. For each seed from `first` to `last`: the fauna creature the game makes of it
 * (makeGenome at heat 1), and the Guardian of the world of that seed when the game gives that world one (guardianFor:
 * about one world in forty; the marker it stores with the genome, not a size gene, puts it at the guardian tier). Each
 * is built with no lineage and put in one of four counts of its family and tier. `noScaffold`: the pack holds no
 * scaffold `<family>/<torso>/<tier>` for it, so nothing but a fallback can be drawn (its parts are not looked at).
 * `missingPart`: the scaffold is there and at least one part it asks for is not (a `missing:` gap, named by the last id
 * tried). `composeGap`: scaffold and parts are there, and composing its rest pose meets a pose the scaffold lacks
 * (`pose:`) or a translucent skin its torso frame has no layer for (`skin:`). `full`: none of these. Each missing
 * scaffold, part and such gap is named once, with the creatures that met it.
 *
 * Outside the walk: Titans (a battle genome made for a placed world), bred creatures (a lineage), every pose but rest,
 * and the other gaps of composing (a `marks:` gap is listed for every frame by the report's own gap lines; a frame,
 * attach point or index the composer cannot find is an error of the sampled creatures).
 */
function coverageOf(catalogue, { first, last }) {
  const rows = new Map();
  const scaffolds = new Map();
  const parts = new Map();
  const gaps = new Map();
  let guardians = 0;
  const bump = (map, id) => map.set(id, (map.get(id) ?? 0) + 1);
  const ask = (genome) => {
    const recipe = buildRecipe(genome, [], catalogue);
    const key = `${recipe.family} ${recipe.tier}`;
    const row = rows.get(key) ?? { family: recipe.family, tier: recipe.tier, asked: 0, full: 0, noScaffold: 0, missingPart: 0, composeGap: 0 };
    rows.set(key, row);
    row.asked++;
    if (!catalogue.scaffolds.has(recipe.scaffoldId)) {
      row.noScaffold++;
      bump(scaffolds, recipe.scaffoldId);
      return;
    }
    const missing = unique(recipe.gaps.filter((g) => g.startsWith('missing:')).map((g) => g.slice('missing:'.length)));
    for (const id of missing) bump(parts, id);
    if (missing.length > 0) {
      row.missingPart++;
      return;
    }
    const met = unique(assemble(recipe, 'rest', catalogue).gaps.filter((g) => g.startsWith('pose:') || g.startsWith('skin:')));
    for (const gap of met) bump(gaps, gap);
    if (met.length === 0) row.full++;
    else row.composeGap++;
  };
  for (let seed = first; seed <= last; seed++) {
    ask(makeGenome(seed, 'fauna', 1));
    const guardian = guardianFor(seed);
    if (guardian !== null) {
      guardians++;
      ask(guardian.genome);
    }
  }
  const named = (map) => [...map].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || (a.id < b.id ? -1 : 1));
  const byFamilyThenTier = (a, b) => (a.family === b.family ? TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) : a.family < b.family ? -1 : 1);
  const list = [...rows.values()].sort(byFamilyThenTier);
  const sum = (field) => list.reduce((n, row) => n + row[field], 0);
  return { first, last, asked: sum('asked'), guardians, full: sum('full'), noScaffold: sum('noScaffold'), missingPart: sum('missingPart'), composeGap: sum('composeGap'), rows: list, scaffolds: named(scaffolds), parts: named(parts), gaps: named(gaps) };
}

/**
 * Why a walk does not meet a requirement that every generated creature be drawn in full, or null when it does. A walk
 * that asked for no creature never meets it: nothing was shown to be drawn.
 */
export function coverageShortfall(coverage) {
  if (coverage.asked === 0) return 'the walk asked for no creature';
  if (coverage.full < coverage.asked) return `${coverage.asked - coverage.full} of ${coverage.asked} generated creatures cannot be drawn in full`;
  return null;
}

/** Whether a part is a named species' own torso, head or tail: kind `<key>` in the species' family and tier. */
function isSpeciesPart(catalogue, part) {
  if (part.slot !== 'torso' && part.slot !== 'head' && part.slot !== 'tail') return false;
  const s = catalogue.species.get(part.kind);
  return s !== undefined && s.family === part.family && s.tier === part.tier;
}

/** Gene values whose kind (`h3`, `t2`) has a part at this family and tier. (A species key is never such a kind: the parser refuses it.) */
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
 * Every mode but 'real' drops the frame's layers, so no mark is painted over a code. The skin rule needs no layer, so
 * a copy with no 'real' part also has skin null: no code is stepped by a shade. A copy with a 'real' part keeps the
 * recipe's skin, so its real parts are drawn as in the real picture (hiddenParts compares the two); such a copy mixes
 * 'real' only with 'blank', which draws nothing. Frames are made once per id.
 */
export function numberedCopy(recipe, catalogue, cache, mode) {
  const parts = new Map();
  let real = false;
  const numbered = recipe.parts.map((rp, k) => {
    const how = mode(k);
    if (how === 'real') real = true;
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
  return { recipe: { ...recipe, parts: numbered, skin: real ? recipe.skin : null }, catalogue: { ...catalogue, parts } };
}

/** The unfinished picture of a recipe drawn from labelCatalogue: skin null, so no slot label 1 to 12 is stepped by the skin rule. */
export function labelPicture(recipe, pose, labels) {
  return assemble({ ...recipe, skin: null }, pose, labels).buffer;
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

// ---- A named species on a scaffold of its own (kind `<key>`): what its pack is held to. ----

/**
 * The poses a template needs where it is not the seven of REQUIRED_POSES: a gastropod never winds up or strikes, a
 * plant is disturbed, harvested and grows. The one table of pose lists by template in the checker.
 */
const POSES_BY_TEMPLATE = Object.freeze({
  gastropod: Object.freeze(['rest', 'approach', 'recover', 'hit', 'faint']),
  plant: Object.freeze(['rest', 'disturb', 'harvest', 'grow']),
});
/** The poses a scaffold of this template needs. */
const posesOfTemplate = (template) => (Object.hasOwn(POSES_BY_TEMPLATE, template) ? POSES_BY_TEMPLATE[template] : REQUIRED_POSES);

/** The named species drawn on a scaffold (`<family>/<key>/<tier>`), or undefined for a generated scaffold. */
function speciesOfScaffold(catalogue, scaffold) {
  const s = catalogue.species.get(scaffold.id.split('/')[1]);
  return s !== undefined && s.family === scaffold.family && s.tier === scaffold.tier ? s : undefined;
}

/** The poses a scaffold lacks, as one problem line, or none: a species scaffold is held to its template's poses, any other to the seven. */
function missingPoses(catalogue, scaffold) {
  const species = speciesOfScaffold(catalogue, scaffold);
  const needed = species === undefined ? REQUIRED_POSES : posesOfTemplate(species.template);
  const missing = needed.filter((p) => !Object.hasOwn(scaffold.poses, p));
  if (missing.length === 0) return [];
  const why = species === undefined ? '' : ` (species ${species.key}, template ${species.template}, needs ${needed.join(', ')})`;
  return [`scaffold ${scaffold.id}: missing pose ${missing.join(', ')}${why}`];
}

/**
 * The attach points a species' own torso or head needs: those the parts planSpeciesParts asks for hang from. Torso: `head`
 * when it has one, `tail` when it has one, its legs, `wing` once the pack holds a wing of its own, `back` once it holds a
 * back part or a body feature of its own, and with no head the eyes (`eye0` and up). Head: its eyes, and `feature` once
 * the pack holds a head feature of its own; the head of a species with no head is asked for by nothing and needs none.
 */
function speciesPoints(catalogue, species, part) {
  const holds = (slot) => catalogue.parts.has(`${species.family}/${slot}/${species.key}/${species.tier}/v0`);
  const eyes = HEAD_POINTS.slice(0, species.eyes);
  if (part.slot === 'head') return species.head ? [...eyes, ...(holds('headFeature') ? ['feature'] : [])] : [];
  if (part.slot !== 'torso') return [];
  return [
    ...(species.head ? ['head'] : []),
    ...(species.tail ? ['tail'] : []),
    ...(holds('farWings') || holds('nearWings') ? ['wing'] : []),
    ...(holds('back') || holds('bodyFeature') ? ['back'] : []),
    ...speciesLegPoints(species.legs),
    ...(species.head ? [] : eyes),
  ];
}

/** Whether a wing or body feature is a species' own: kind `<key>` of a species of its family and tier, which asks for it (planSpeciesParts). */
const isSpeciesOwnPart = (catalogue, part) => {
  const s = catalogue.species.get(part.kind);
  return (part.slot === 'farWings' || part.slot === 'nearWings' || part.slot === 'bodyFeature') && s !== undefined && s.family === part.family && s.tier === part.tier;
};

/** A head or head feature named for a species with no head (`head=0`): nothing asks for it. One line per such part. */
function headlessParts(catalogue) {
  const lines = [];
  for (const part of catalogue.parts.values()) {
    if (part.slot !== 'head' && part.slot !== 'headFeature') continue;
    const s = catalogue.species.get(part.kind);
    if (s === undefined || s.family !== part.family || s.tier !== part.tier || s.head) continue;
    lines.push(`part ${part.id}: no creature asks for it: species ${s.key} has no head (head=0)`);
  }
  return lines;
}

/**
 * The sizes a family needs a stand-in (fallback) at. A family that holds only species (it has a species, and no scaffold
 * but a species') needs one at each size it uses: the sizes of its species, its scaffolds and its parts
 * (a part its species share, a leg or an eye, makes it no generated family). `species` names the species of that size.
 * Any other family needs one at every size the pack has parts or scaffolds for (`packTiers`), with `species` null.
 */
function standInTiers(catalogue, family, packTiers) {
  const species = [...catalogue.species.values()].filter((s) => s.family === family);
  const scaffolds = [...catalogue.scaffolds.values()].filter((s) => s.family === family);
  if (species.length === 0 || scaffolds.some((s) => speciesOfScaffold(catalogue, s) === undefined)) return packTiers.map((tier) => ({ tier, species: null }));
  const used = new Set([...species, ...scaffolds, ...[...catalogue.parts.values()].filter((p) => p.family === family)].map((x) => x.tier));
  return packTiers.filter((tier) => used.has(tier)).map((tier) => ({ tier, species: species.filter((s) => s.tier === tier).map((s) => s.key) }));
}

// ---- End of the named species block. ----

/**
 * Fallback problems: a fallback whose frame, anchored at the canvas centre or at the origin of a scaffold of its family
 * and tier (where compose draws it), does not fit its tier's canvas with a pixel to spare for the outline; and each
 * family present in the pack that has no fallback at a tier it needs one at (standInTiers).
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
    for (const { tier, species } of standInTiers(catalogue, family, tiers)) {
      if (catalogue.fallbacks.has(fallbackKey(family, tier))) continue;
      problems.push(`family ${family} has no fallback at ${tier}${species === null ? '' : ` (it holds only species, and needs one stand-in at each size it uses; at this one: ${species.join(', ') || 'no species, only parts'})`}`);
    }
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

/** The eye count given where the entry of a slot other than `eyes` is looked up: only an eyes entry carries one, so it is never read. */
const NO_EYE_COUNT = 0;
/** The limbs a creature with `legs` legs draws on each side: far n >> 1, near the rest (as buildRecipe splits them). */
const sideCount = (slot, legs) => (slot === 'farLimbs' ? legs >> 1 : legs - (legs >> 1));
/** The plain leg attach points a creature with `legs` legs hangs its legs from. */
const speciesLegPoints = (legs) => [...Array.from({ length: sideCount('farLimbs', legs) }, (_, i) => `far${i}`), ...Array.from({ length: sideCount('nearLimbs', legs) }, (_, i) => `near${i}`)];

/**
 * Every `marks:<part id>:<frame>` gap a scaffold's creatures can meet, read from the catalogue without composing: for
 * each mark slot, leg count, index the slot has at that count and pose, the frame each part the composer could ask
 * for there would show (poseEntryFor, frameNameFor), when that frame has no layer serving some pattern. The parts are
 * those of the scaffold's family, tier and slot: the torso of its own kind, heads h0 to h9, tails t0 to t6, limbs
 * of the leg role at that index, or the shared leg when the pack has no v0 of that role on that side, a winged build's
 * flippers (at no legs), and its wings or a four-legged build's sails. No species part is
 * among them: a species key is never a head or tail kind (the parser refuses it) nor a torso type (a structure error).
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
  // A wing slot's kinds by index: a winged torso type's WING_KINDS (`<wing>-<torso type>`); any other four-legged torso
  // type's sails in nearWings at index 0 (its own `sails-<torso type>` when the pack holds it at v0, else the shared `sails`).
  const winged = scaffold.family === 'quadruped' && Object.hasOwn(WING_KINDS, torsoKind) ? WING_KINDS[torsoKind] : undefined;
  const wingKinds = (slot) => scaffold.family !== 'quadruped' ? []
    : winged !== undefined ? winged.map((wing) => `${wing}-${torsoKind}`)
      : slot === 'nearWings' ? [roleHeld(slot, `sails-${torsoKind}`) ? `sails-${torsoKind}` : 'sails'] : [];
  // A winged build in water has no legs but two flippers at near-limb indexes 0 and 1: its own `flipper-<torso type>`
  // when the pack holds it at v0, else the shared `flipper`.
  const flipper = winged === undefined ? null : roleHeld('nearLimbs', `flipper-${torsoKind}`) ? `flipper-${torsoKind}` : 'flipper';
  for (const slot of MARK_SLOTS) {
    const limb = slot === 'farLimbs' || slot === 'nearLimbs';
    const wing = slot === 'farWings' || slot === 'nearWings';
    const wings = wing ? wingKinds(slot) : [];
    for (const legs of LIMB_COUNTS) {
      const flippers = limb && legs === 0 && slot === 'nearLimbs' && flipper !== null;
      const indexes = flippers ? 2 : limb ? sideCount(slot, legs) : wing ? wings.length : 1;
      for (let index = 0; index < indexes; index++) {
        const role = limb ? limbKind(index, legs) : '';
        // a build's own legs (`<role>-<torso type>`) are drawn in place of the shared role
        const kinds = flippers ? [flipper] : !limb ? null : roleHeld(slot, `${role}-${torsoKind}`) ? [`${role}-${torsoKind}`] : roleHeld(slot, role) ? [role] : [role, 'leg'];
        const parts = own.filter((p) => p.slot === slot && (
          slot === 'torso' ? p.kind === torsoKind
            : slot === 'head' ? /^h\d$/.test(p.kind)
              : slot === 'tail' ? /^t[0-6]$/.test(p.kind)
                : wing ? p.kind === wings[index]
                  : kinds !== null && kinds.includes(p.kind)));
        if (parts.length === 0) continue;
        for (const pose of Object.values(scaffold.poses)) {
          const entry = poseEntryFor(pose.entries, slot, index, legs, NO_EYE_COUNT);
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
 * Problems a reader can see without composing: attach points (a generated torso needs its family's points and its wing
 * points, see TORSO_POINTS_BY_FAMILY; head kind hN needs `feature` once the pack has a head
 * feature drawn for it, kind `<feature>-hN`, of its family and tier; a torso's leg-count names and a head's or torso's
 * eye-count names must be ones the composer can ask for; a species torso and head need only the points the species uses), layers, the palette's iris ramps (some
 * but not all eleven), species (a key that is a torso type, a ramp the palette lacks; its iris is `<key>-iris` when present, else `iris<n>`), the bone ramp (`bone`, or a species' `<key>-bone`) when a part draws bone values, poses and their leg-count
 * and eye-count entries, contact points, fallbacks.
 */
function structureProblems(catalogue) {
  const problems = [];
  /** The eye points a head part needs: its family's eye count of them (two for the eyeless head's pits, when it has any). */
  const headEyePoints = (part) => {
    const eyes = EYES_BY_FAMILY.get(part.family)?.eyes ?? HEAD_POINTS.length;
    return HEAD_POINTS.slice(0, part.kind === `h${EYELESS_HEAD}` ? Math.min(2, eyes) : eyes);
  };
  const fallbackParts = new Set(catalogue.fallbacks.values());
  const featured = new Set([...catalogue.parts.values()].filter((p) => p.slot === 'headFeature' && p.kind.includes('-')).map((p) => `${p.family}/${p.tier}/${p.kind.slice(p.kind.lastIndexOf('-') + 1)}`));
  const wingParts = new Set([...catalogue.parts.values()].filter((p) => p.slot === 'farWings' || p.slot === 'nearWings').map((p) => `${p.family}/${p.tier}/${p.kind}`));
  /**
   * The points a generated torso needs: its family's (TORSO_POINTS_BY_FAMILY; the four-legged set for a family not
   * listed there), then `wing` and `wing1` once the pack holds its wings.
   */
  const torsoPoints = (part) => [
    ...(TORSO_POINTS_BY_FAMILY[part.family] ?? TORSO_POINTS_BY_FAMILY.quadruped),
    ...(wingParts.has(`${part.family}/${part.tier}/wing-${part.kind}`) ? ['wing'] : []),
    ...(wingParts.has(`${part.family}/${part.tier}/hindwing-${part.kind}`) ? ['wing1'] : []),
  ];
  for (const part of catalogue.parts.values()) {
    const frames = Object.keys(part.frames);
    if (!MARK_SLOTS.includes(part.slot) && frames.some((name) => part.frames[name].layers !== undefined)) problems.push(`part ${part.id}: layers on a slot that takes no marks`);
    for (const name of frames) problems.push(...layerProblems(`part ${part.id} frame ${name}`, part.frames[name]));
    if (part.slot === 'torso' || part.slot === 'head') {
      for (const name of frames) {
        for (const point of Object.keys(part.frames[name].attach)) {
          if (EYE_COUNT_NAME.test(point)) {
            if (!EYE_COUNT_POINTS.has(point)) problems.push(`part ${part.id} frame ${name}: attach point ${point} is for an eye count that never uses it`);
            continue;
          }
          if (part.slot !== 'torso' || !/_\d+$/.test(point) || LEG_COUNT_POINTS.has(point)) continue;
          if (/^(far|near)\d+_\d+$/.test(point)) problems.push(`part ${part.id} frame ${name}: attach point ${point} is for a leg count that never uses it`);
          else problems.push(`part ${part.id} frame ${name}: attach point ${point} is never used: only far<i>_<n> and near<i>_<n> take a leg count`);
        }
      }
    }
    // A head needs the eye points its family hangs from a head (EYES_BY_FAMILY; all eight for a family not listed there),
    // and the eyeless head none: it carries two pits on eye0 and eye1 where its family has eye points.
    // Only the plain leg and eye points are required: they are the fallback.
    // A species torso and head need only the points the species uses (speciesPoints).
    const species = isSpeciesPart(catalogue, part) ? catalogue.species.get(part.kind) : undefined;
    const feature = part.slot === 'head' && featured.has(`${part.family}/${part.tier}/${part.kind}`) ? ['feature'] : [];
    const required = species !== undefined
      ? speciesPoints(catalogue, species, part)
      : part.slot === 'torso' && !fallbackParts.has(part.id) ? torsoPoints(part) : part.slot === 'head' ? [...headEyePoints(part), ...feature] : [];
    if (required.length === 0) continue;
    for (const name of frames) {
      const missing = required.filter((p) => !Object.hasOwn(part.frames[name].attach, p));
      if (missing.length > 0) problems.push(`part ${part.id} frame ${name}: missing attach point ${missing.join(', ')}`);
    }
  }
  // A palette with none of the iris ramps is the old format (information, see checkPack). With some, every one of the
  // eleven must be there: a missing one would draw every creature of its theme with a black iris.
  if (IRIS_RAMPS.some((name) => Object.hasOwn(catalogue.palette.ramps, name))) {
    for (const name of IRIS_RAMPS) if (!Object.hasOwn(catalogue.palette.ramps, name)) problems.push(`palette: missing iris ramp ${name}`);
  }
  // Bone: a ramp the palette needs only when a part draws bone values. A species' own parts (kind `<key>` or
  // `<role>-<key>`) are shown in `<key>-bone` when the palette holds it (speciesBoneRamp); every other part in `bone`.
  const hasRamp = (name) => Object.hasOwn(catalogue.palette.ramps, name);
  const speciesOwn = new Set();
  for (const species of catalogue.species.values()) {
    if (GENERATED_TORSOS.has(`${species.family}/${species.key}`)) problems.push(`species ${species.key}: key is a torso type of ${species.family}`);
    // The iris: the species' own `<key>-iris` when the palette holds it, else `iris<n>` (speciesIrisRamp).
    for (const ramp of [species.key, `${species.key}-accent`, `${species.key}-under`, speciesIrisRamp(species.key, species.iris, catalogue)]) {
      if (!hasRamp(ramp)) problems.push(`species ${species.key}: palette has no ramp ${ramp}`);
    }
    const drawn = planSpeciesParts(species, catalogue).parts.map((rp) => catalogue.parts.get(rp.partId));
    for (const part of drawn) if (part.kind === species.key || part.kind.endsWith(`-${species.key}`)) speciesOwn.add(part.id);
    const boned = drawn.find(drawsBone);
    const ramp = speciesBoneRamp(species.key, catalogue);
    if (boned !== undefined && !hasRamp(ramp)) {
      problems.push(`species ${species.key}: palette has no ramp ${ramp}: part ${boned.id} draws bone values (${BONE_CHARS}), which would show black; add 'ramp ${BONE_RAMP} <four colour numbers, dark to light>' or 'ramp ${species.key}-bone ...'`);
    }
  }
  const boned = [...catalogue.parts.values()].filter((part) => !speciesOwn.has(part.id) && drawsBone(part));
  if (boned.length > 0 && !hasRamp(BONE_RAMP)) {
    problems.push(`palette: no ramp ${BONE_RAMP}: ${boned.length === 1 ? '1 part draws' : `${boned.length} parts draw`} bone values (${BONE_CHARS}), which would show black, e.g. part ${boned[0].id}; add 'ramp ${BONE_RAMP} <four colour numbers, dark to light>'`);
  }
  for (const scaffold of catalogue.scaffolds.values()) {
    problems.push(...missingPoses(catalogue, scaffold));
    for (const [poseId, pose] of Object.entries(scaffold.poses)) {
      for (const e of pose.entries) {
        // Only an eyes entry carries an eye count (the parser's rule).
        if (e.eyes !== undefined && e.index >= eyesDrawn(e.eyes)) problems.push(`scaffold ${scaffold.id} pose ${poseId}: entry eyes ${e.index} eyes=${e.eyes} is for an eye that count never draws`);
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

/** The frame a part of a slot other than `eyes` shows in a pose, chosen by the composer's own rule (poseEntryFor, frameNameFor). */
function frameShown(scaffold, poseId, slot, index, legs, part) {
  return frameNameFor(part, poseEntryFor(scaffold.poses[poseId].entries, slot, index, legs, NO_EYE_COUNT));
}

/** Where part k of a recipe lands: the canvas position of its frame's pixel 0,0, read from its 'x' and 'y' coded pictures. */
export function frameOrigin(recipe, k, pose, catalogue, cache) {
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
 * step of each other. Checked on the parts as drawn: before marks and skin, before the outline and shading. For each leg count,
 * each pose, each head and each of the nine head shifts, the torso alone (once per leg count and pose) and the head alone
 * are assembled at their real places (the head is placed on the torso, then the torso is left undrawn). A join pair is a
 * head pixel and a 4-adjacent torso pixel the head does not cover, both ramp values (1-12); it breaks the rule when their
 * shade steps (position in the ramp, so pixels of different ramps compare by position) differ by more than one.
 * `shifts` are the head shifts tried (a named species has none). Returns, per head id with a breach: { pixels: distinct
 * offending head pixels, counted in the head frame's own coordinates (frame, x, y); cases: the (pose, shift, leg count)
 * cases with a breach; example: the first breaching pair, each pixel in its own part's frame coordinates }.
 */
export function neckJoins(catalogue, scaffold, torsoId, headIds, legCounts, recipeFor, cache, shifts = HEAD_SHIFTS) {
  const found = new Map();
  const torsoPart = catalogue.parts.get(torsoId);
  for (const legs of legCounts) {
    const base = recipeFor(LIMB_COUNTS.indexOf(legs));
    const pairOf = (headId) => ({
      ...base,
      parts: [{ slot: 'torso', index: 0, partId: torsoId, source: 'own' }, { slot: 'head', index: 0, partId: headId, source: 'own' }],
      marking: { ...base.marking, pattern: 0 },
      skin: null,
    });
    for (const pose of Object.keys(scaffold.poses)) {
      const torsoOnly = numberedCopy(pairOf(headIds[0]), catalogue, cache, (k) => (k === 0 ? 'real' : 'blank'));
      const tp = assemble(torsoOnly.recipe, pose, torsoOnly.catalogue).buffer.pixels;
      let torsoAt;
      for (const headId of headIds) {
        const headPart = catalogue.parts.get(headId);
        const two = pairOf(headId);
        for (const shift of shifts) {
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
 * creatures of every scaffold (variant:, marks:, role: and a missing back part, head feature, wing, sails, body feature
 * or flipper are information, see gapIsInfo), creatures touching the canvas edge, creatures
 * whose picture is not one 4-connected region (outline ignored), and structural problems.
 *
 * `options.sample`, when given, chooses the generated scaffolds whose creatures are sampled (by scaffold id); the others
 * are not composed (no gaps, edge, detachment, hidden parts, marks: x0 lines or neck joins of theirs). Everything about
 * the pack as a whole is checked as without it: the summary, structure, names, palette, fallbacks, unreachable parts and
 * scaffolds, and every named species. Without it every scaffold is sampled, as the command line does. It lets a test
 * check a large pack in parts that together sample every scaffold once. A report that left a scaffold out lists the
 * ids left out in `partial` (null when none was), and formatReport says so on its first line.
 */
export function checkPack(text, options = {}) {
  const sampled = options.sample ?? (() => true);
  let catalogue;
  try {
    catalogue = parseCatalogueText(text);
  } catch (error) {
    return { ok: false, parseError: error instanceof Error ? error.message : String(error), summary: null, sampled: SAMPLED, partial: null, composed: 0, variants: 0, gaps: [], edge: [], detached: [], hidden: [], structure: [], unreachable: [], failures: [], neck: [], info: [], coverage: null };
  }
  const parts = [...catalogue.parts.values()];
  const summary = {
    parts: parts.length,
    byFamily: countBy(parts, (p) => p.family),
    bySlot: countBy(parts, (p) => p.slot),
    byTier: countBy(parts, (p) => p.tier),
    scaffolds: catalogue.scaffolds.size,
    fallbacks: catalogue.fallbacks.size,
    species: catalogue.species.size,
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
  /** Generated scaffolds the `sample` option left out, in catalogue order. */
  const skipped = [];
  let composed = 0;

  // A leg part is asked for as `leg`, as a role, or as a role on a torso type that has a scaffold at its tier. Any other
  // name is never drawn: most likely a misspelt build.
  // An eye part is asked for as `eye`, as `pit` in a family whose bodies ask for sensory pits (EYES_BY_FAMILY), or by
  // the named species whose key it carries (same family and tier).
  for (const part of catalogue.parts.values()) {
    if (part.slot !== 'eyes' || part.kind === 'eye' || (part.kind === 'pit' && EYES_BY_FAMILY.get(part.family)?.pit === true)) continue;
    const s = catalogue.species.get(part.kind);
    if (s === undefined || s.family !== part.family || s.tier !== part.tier) unreachable.push(`part ${part.id}: no creature asks for an eye named '${part.kind}' (eye, pit where the family has sensory pits, or the key of a species of this family and tier)`);
  }
  for (const part of catalogue.parts.values()) {
    if ((part.slot !== 'farLimbs' && part.slot !== 'nearLimbs') || isFlipper(part.kind)) continue;
    const [role, ...rest] = part.kind.split('-');
    const type = rest.join('-');
    const named = part.kind === 'leg' || ((role === 'fore' || role === 'hind' || role === 'mid') && (rest.length === 0 || catalogue.scaffolds.has(`${part.family}/${type}/${part.tier}`)));
    if (!named) unreachable.push(`part ${part.id}: no creature asks for a leg named '${part.kind}' (leg, fore, hind, mid, or one of those with -<torso type> for a torso type that has a scaffold at this tier)`);
  }
  // A wing, sails, body feature or flipper is asked for by the kind planBodyParts names (NEW_KINDS); one named for a torso
  // type or fish shape (`<kind>-<type>`) only where that type has a scaffold at its tier. A species' own is asked for by the species.
  for (const part of catalogue.parts.values()) {
    if (!isNewPart(part) || isSpeciesOwnPart(catalogue, part)) continue;
    const type = part.kind.includes('-') ? part.kind.slice(part.kind.indexOf('-') + 1) : null;
    const named = NEW_KINDS.has(`${part.family}/${part.slot}/${part.kind}`) && (type === null || catalogue.scaffolds.has(`${part.family}/${type}/${part.tier}`));
    if (!named) unreachable.push(`part ${part.id}: no creature asks for a ${part.slot} part named '${part.kind}'`);
  }
  unreachable.push(...headlessParts(catalogue));

  // A species is drawn on scaffold <family>/<key>/<tier>; without it the species is never drawn.
  const speciesByScaffold = new Map();
  for (const species of catalogue.species.values()) {
    const id = `${species.family}/${species.key}/${species.tier}`;
    if (catalogue.scaffolds.has(id)) speciesByScaffold.set(id, species);
    else unreachable.push(`species ${species.key}: no scaffold ${id}`);
  }

  // A species part type with more than one variant is never forced: no generated creature draws it (the forced pass skips
  // a type its creature does not reach), and a species draws v0 only.
  const variantGroups = variantsByType(catalogue);
  let variants = 0;
  for (const scaffold of catalogue.scaffolds.values()) {
    const poses = Object.keys(scaffold.poses);

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
        const own = detachedSlots(labelPicture(recipe, pose, labels));
        if (own) detached.push({ ...where, shift: recipe.shift, off: own });
        const showing = (shifted) => {
          for (const h of hiddenParts(shifted, pose, catalogue, numberedFrames)) hidden.push({ ...where, shift: shifted.shift, ...h });
        };
        showing(recipe);
        for (const shift of shiftPairs) {
          const picture = labelPicture({ ...recipe, shift }, pose, labels);
          if (nearEdge(picture)) edge.push({ ...where, shift });
          const off = detachedSlots(picture);
          if (off) detached.push({ ...where, shift, off });
          showing({ ...recipe, shift });
        }
      }
    };

    const states = routeStates(scaffold.id);
    if (states.length === 0) {
      // A named species: its one recipe in every pose (gaps, edge, detached and hidden parts, compose failures; it has no
      // shift), and its head at the neck against its own torso, at its own leg count.
      const species = speciesByScaffold.get(scaffold.id);
      if (species === undefined) {
        unreachable.push(`scaffold ${scaffold.id}: no fauna genome resolves to it, so the renderer never uses it`);
        continue;
      }
      const recipe = buildSpeciesRecipe(species.key, catalogue);
      check({ species: species.key }, recipe, []);
      const torso = recipe.parts.find((p) => p.slot === 'torso');
      const head = recipe.parts.find((p) => p.slot === 'head');
      if (torso !== undefined && head !== undefined) {
        for (const n of neckJoins(catalogue, scaffold, torso.partId, [head.partId], [species.legs], () => recipe, numberedFrames, NO_SHIFT)) {
          neck.push({ head: n.head, torso: torso.partId, pixels: n.pixels, cases: n.cases, example: n.example });
        }
      }
      continue;
    }
    if (!sampled(scaffold.id)) {
      skipped.push(scaffold.id);
      continue;
    }
    const torsoKind = scaffold.id.split('/')[1];
    const heads = kindsFor(catalogue, scaffold, 'head', 'h', 10);
    const someHeads = heads.length > 0 ? heads : [0];

    // The leg counts this scaffold draws differently: each a legs= entry of one of its poses or a leg-count attach name
    // on one of its torsos is written for.
    // The eye counts it draws differently, likewise: each an eyes= entry of one of its poses, or an eye-count attach name
    // on one of its torsos or on a head of its family and tier (a species' own head aside), is written for.
    const legCounts = new Set();
    const eyeCounts = new Set();
    for (const pose of Object.values(scaffold.poses)) {
      for (const e of pose.entries) {
        if (e.legs !== undefined) legCounts.add(e.legs);
        if (e.eyes !== undefined) eyeCounts.add(e.eyes);
      }
    }
    for (const part of catalogue.parts.values()) {
      if (part.family !== scaffold.family || part.tier !== scaffold.tier) continue;
      const torso = part.slot === 'torso' && part.kind === torsoKind;
      if (!torso && (part.slot !== 'head' || isSpeciesPart(catalogue, part))) continue;
      for (const frame of Object.values(part.frames)) {
        for (const point of Object.keys(frame.attach)) {
          if (torso && LEG_COUNT_POINTS.has(point)) legCounts.add(LEG_COUNT_POINTS.get(point));
          if (EYE_COUNT_POINTS.has(point)) eyeCounts.add(EYE_COUNT_POINTS.get(point));
        }
      }
    }

    /** The recipe the neck join reads its marking and shift from, at a limbs gene: the first state's (set below). */
    let neckRecipe;
    // Each state the scaffold is drawn in (routeStates): land, airborne where it adds sails or folds the legs of a winged
    // body, aquatic where a winged body takes flippers and fins. Every sampled genome is shaped (shapedGenome).
    for (const [stateIndex, { genes }] of states.entries()) {
      const route = routeBody(genes);
      const shapeAt = route.shapes.indexOf(torsoKind);
      /** The body of this scaffold's shape in this state, with these genes. */
      const bodyWith = (g) => resolveBody({ kingdom: 'fauna', ...genes, head: 0, tail: 0, limbs: 0, eyes: 0, ...g }, () => shapeAt);
      /** For each distinct value the body gives `field` as `gene` runs over its values, the first gene value that gives it. */
      const firstGenes = (gene, length, field) => {
        const found = new Map();
        for (let v = 0; v < length; v++) { const value = bodyWith({ [gene]: v })[field]; if (!found.has(value)) found.set(value, v); }
        return found;
      };
      // Tails: tail gene 0 (the stub tail t0 on a four-legged body, no tail elsewhere), then every tail kind the pack holds
      // that the family asks for (t1 to t6 on a four-legged body; t2, t3, t5 and t6 on a fish, a tentacled body or a
      // crustacean; none on the others). `realTails` are the genes of those that ask for a tail part.
      const tails = [0, ...kindsFor(catalogue, scaffold, 'tail', 't', 7).filter((k) => k !== 0 && bodyWith({ tail: k }).tail === k)];
      const realTails = tails.filter((g) => bodyWith({ tail: g }).tail !== null);
      const lastTail = realTails.length > 0 ? realTails[realTails.length - 1] : tails[0];
      // Leg counts the body draws: limbs genes 0-5 that give different counts (a winged body airborne has two; in water none).
      const limbBy = firstGenes('limbs', LIMB_COUNTS.length, 'limbs');
      const limbGenes = [...limbBy.values()];
      const fullLimbs = limbBy.get(Math.max(...limbBy.keys()));
      const noLimbs = limbBy.get(Math.min(...limbBy.keys()));
      const eyeBy = firstGenes('eyes', EYE_COUNTS.length, 'eyes');
      const eyeGenes = [...eyeBy.values()];
      /**
       * The eyes genes a creature is drawn at wherever its eyes can meet a part the eye-count sweep below does not vary:
       * the full count (every plain eye point), then each other eye count in eyeCounts this body draws.
       */
      const eyeSet = [FULL_EYES, ...[...eyeBy].filter(([count, gene]) => eyeCounts.has(count) && count !== bodyWith({ eyes: FULL_EYES }).eyes).map(([, gene]) => gene)];
      /** The limbs gene of each leg count in legCounts this body draws, beside `first`. */
      const countGenes = (first) => [first, ...[...legCounts].sort((x, y) => x - y).map((n) => LIMB_COUNTS.indexOf(n)).filter((g) => g !== first && bodyWith({ limbs: g }).limbs === LIMB_COUNTS[g])];

      /**
       * The genome and recipe of a creature of this scaffold: the state's genes, the given ones, shaped to this scaffold's
       * shape. A genome no seed shapes, or one at another tier, is a failure line, not a crash; it gives undefined.
       */
      const sample = (head, tail, limbs, eyes, pattern = 0, skin = BASE_SKIN) => {
        const wanted = { kingdom: 'fauna', seed: 1, ...genes, head, tail, limbs, eyes, pattern, skin, color: 0, accent: 0, lumin: false };
        const shaped = shapedFor(wanted, scaffold.family, torsoKind, scaffold.tier);
        if (shaped.failure !== undefined) {
          failed.add(`${shaped.failure} (needed by ${scaffold.id})`);
          return undefined;
        }
        return { genome: shaped.genome, recipe: buildRecipe(shaped.genome, [], catalogue) };
      };
      const checkSample = (head, tail, limbs, eyes, pattern, skin, shiftPairs = []) => {
        const one = sample(head, tail, limbs, eyes, pattern, skin);
        if (one !== undefined) check(one.genome, one.recipe, shiftPairs);
      };
      neckRecipe ??= (limbs) => sample(someHeads[0], lastTail, limbs, FULL_EYES)?.recipe ?? buildRecipe({ kingdom: 'fauna', ...genes }, [], catalogue);

      // Gaps, edge and own-shift connectivity: in the first state, every head x every tail x every leg count at eight eyes,
      // plus every eye count for each head. A later state adds only parts that hang from the torso (sails, wings,
      // flippers, fins) and may fold the legs, so there head and tail kinds are paired in turn (each kind at least once)
      // at every leg count the body draws there.
      const creatures = new Map();
      const add = (head, tail, limbs, eyes) => creatures.set(`${head} ${tail} ${limbs} ${eyes}`, [head, tail, limbs, eyes]);
      if (stateIndex === 0) {
        for (const head of someHeads) {
          for (const tail of tails) for (const limbs of limbGenes) add(head, tail, limbs, FULL_EYES);
          for (const eyes of eyeGenes) add(head, lastTail, fullLimbs, eyes);
        }
      } else {
        for (let i = 0; i < Math.max(someHeads.length, tails.length); i++) {
          for (const limbs of limbGenes) add(someHeads[i % someHeads.length], tails[i % tails.length], limbs, FULL_EYES);
        }
      }
      for (const [head, tail, limbs, eyes] of creatures.values()) checkSample(head, tail, limbs, eyes);

      // Marks, skins, back parts and head features: for each head kind with the last tail and eight eyes, one creature at
      // the most legs for each pattern gene but plain and one with translucent skin (on the base skin otherwise), and one
      // for each skin gene that has a back part (plain) at the most legs and again at each of those leg counts (a legs=
      // entry can move or swap the back part), and each of those again at each eye count in eyeSet (eyes laid out for
      // their count are drawn over the head and its features, and over the back part; and this is where such an eye
      // count meets a leg count drawn differently). A patterned or translucent creature is composed for its gaps only: marks
      // and skin never change which pixels are drawn, so its edge, connectivity and hidden parts are those of the same
      // parts unpainted. A later state's added parts hang from the torso, away from the head, so it takes the first head
      // kind only.
      for (const head of stateIndex === 0 ? someHeads : someHeads.slice(0, 1)) {
        for (const pattern of PATTERN_GENES) {
          const one = sample(head, lastTail, fullLimbs, FULL_EYES, pattern);
          if (one !== undefined) gapsOnly(one.recipe);
        }
        const translucent = sample(head, lastTail, fullLimbs, FULL_EYES, 0, TRANSLUCENT_SKIN);
        if (translucent !== undefined) gapsOnly(translucent.recipe);
        for (const skin of BACK_SKINS) for (const limbs of countGenes(fullLimbs)) for (const eyes of eyeSet) checkSample(head, lastTail, limbs, eyes, 0, skin);
      }

      // Shift sweep, with the fewest legs (more parts only add pixels, so none is the strictest case), then again at each
      // of those leg counts (a legs= entry can move a head or tail): every head alone at its nine shifts (the tail part
      // taken out of the recipe: tail gene 0 is the stub tail t0 on a four-legged body), then head and tail kinds paired
      // in turn (every head and every tail kind at least once) at all 81 combinations of the nine head shifts and nine
      // tail shifts, so a head and tail moving in opposite directions are composed. A later state adds only parts that hang
      // from the torso, which can hide a shifted head or tail but never part one from the other, so there each pair is
      // composed at the nine head shifts and then the nine tail shifts. A body with no head part has no head to shift.
      for (const limbs of countGenes(noLimbs)) {
        for (const head of someHeads) {
          const one = sample(head, tails[0], limbs, FULL_EYES);
          if (one === undefined) continue;
          const alone = { ...one.recipe, parts: one.recipe.parts.filter((p) => p.slot !== 'tail') };
          check(one.genome, alone, alone.parts.some((p) => p.slot === 'head') ? HEAD_SHIFTS : []);
        }
        for (let i = 0; i < Math.max(someHeads.length, realTails.length) && realTails.length > 0; i++) {
          checkSample(someHeads[i % someHeads.length], realTails[i % realTails.length], limbs, FULL_EYES, 0, BASE_SKIN, stateIndex === 0 ? SHIFT_PAIRS : HEAD_OR_TAIL_SHIFTS);
        }
      }

      // Every variant of every part type with more than one: build a patterned creature that uses the type, then compose
      // a copy of its recipe with that slot's part id replaced by the variant's. The swapped part keeps its mark: a mark is
      // keyed by slot and index, never by part id, so it is the mark buildRecipe gives a creature that picked that variant.
      // A head or tail variant also at its nine shifts. Limb variants at the most legs, the others with the fewest; each
      // also at every leg count in legCounts, since those draw the creature differently; a head or torso variant (the
      // parts that carry eye points) at each of those also at every eye count in eyeSet.
      for (const group of variantGroups) {
        if (group.family !== scaffold.family || group.tier !== scaffold.tier) continue;
        if (group.slot === 'torso' && scaffold.id !== `${group.family}/${group.kind}/${group.tier}`) continue;
        const head = group.slot === 'head' ? Number(group.kind.slice(1)) : someHeads[0];
        const tail = group.slot === 'tail' ? Number(group.kind.slice(1)) : lastTail;
        for (const limbs of countGenes(group.slot === 'farLimbs' || group.slot === 'nearLimbs' ? fullLimbs : noLimbs)) {
          for (const eyes of group.slot === 'head' || group.slot === 'torso' ? eyeSet : [FULL_EYES]) {
            const one = sample(head, tail, limbs, eyes, FORCED_PATTERN);
            if (one === undefined) continue;
            const shiftPairs = group.slot === 'head' ? HEAD_SHIFTS : group.slot === 'tail' ? TAIL_SHIFTS : [];
            for (const id of group.ids) {
              const parts = one.recipe.parts.map((p) => (p.slot === group.slot && group.ids.includes(p.partId) ? { ...p, partId: id } : p));
              if (!parts.some((p) => p.partId === id)) continue; // the creature does not reach this type (e.g. a head kind beyond the gene range)
              variants++;
              check(one.genome, { ...one.recipe, parts }, shiftPairs, id);
            }
          }
        }
      }
    }

    // marks: gaps no sampled creature met, listed with count 0 (printed x0): every frame a pose can show at any leg count.
    for (const gap of marksGapsOf(catalogue, scaffold, torsoKind)) if (!gapCounts.has(gap)) gapCounts.set(gap, 0);

    // The neck join: every head of this family and tier with every variant of this scaffold's torso, at four legs and at
    // every leg count a legs= entry for the torso or the head names.
    const neckLegs = [4, ...new Set(Object.values(scaffold.poses).flatMap((pose) => pose.entries.filter((e) => e.legs !== undefined && e.legs !== 4 && (e.slot === 'torso' || e.slot === 'head')).map((e) => e.legs)))];
    const ofScaffold = (slot) => parts.filter((p) => p.family === scaffold.family && p.slot === slot && p.tier === scaffold.tier && (slot !== 'torso' || p.kind === torsoKind) && !isSpeciesPart(catalogue, p));
    const neckHeads = ofScaffold('head').map((p) => p.id);
    for (const torso of ofScaffold('torso')) {
      if (neckHeads.length === 0) break;
      for (const n of neckJoins(catalogue, scaffold, torso.id, neckHeads, neckLegs, neckRecipe, numberedFrames)) {
        neck.push({ head: n.head, torso: torso.id, pixels: n.pixels, cases: n.cases, example: n.example });
      }
    }
  }

  const gaps = [...gapCounts].map(([gap, count]) => ({ gap, count, error: !gapIsInfo(gap) }));
  const structure = structureProblems(catalogue);
  const failures = [...failed];
  const info = [];
  // A palette with no iris ramp is the old format: information. With some, every one must be there (structureProblems).
  if (!IRIS_RAMPS.some((name) => Object.hasOwn(catalogue.palette.ramps, name))) {
    info.push(`palette has no iris ramps (iris0 to iris${IRIS_RAMP_COUNT - 1}): eyes show no iris colour`);
  }
  const ok = gaps.every((g) => !g.error) && edge.length === 0 && detached.length === 0 && hidden.length === 0 && structure.length === 0 && unreachable.length === 0 && failures.length === 0;
  const partial = skipped.length === 0 ? null : skipped;
  return { ok, parseError: null, summary, sampled: SAMPLED, partial, composed, variants, gaps, edge, detached, hidden, structure, unreachable, failures, neck, info, coverage: coverageOf(catalogue, options.coverage ?? COVERAGE_SEEDS) };
}

const compact = (record) => Object.entries(record).map(([k, v]) => `${k} ${v}`).join(', ');

const pair = ([x, y]) => `${x},${y}`;
const shiftText = (s) => `head ${pair(s.head)} tail ${pair(s.tail)}`;
const example = (e) => `${e.genome.species !== undefined ? `species ${e.genome.species}` : genesText(e.genome)} pose ${e.pose}${e.shift === undefined ? '' : ` shift ${shiftText(e.shift)}`}${e.variant === undefined ? '' : ` with variant ${e.variant}`}`;
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
    `scaffolds: ${s.scaffolds}, fallbacks: ${s.fallbacks}, species: ${s.species}, palette colours: ${s.colours}, ramps: ${s.ramps}`,
    `composed: ${report.composed} creature poses (${report.variants} forced variants). Sampled: ${report.sampled}`,
  ];
  for (const g of report.gaps) lines.push(`${g.error ? 'error' : 'info'}: gap ${g.gap} (x${g.count})`);
  for (const p of report.info) lines.push(`info: ${p}`);
  for (const [scaffold, items] of group(report.edge, (e) => [e.scaffold])) {
    const first = items[0];
    lines.push(`error: touches the canvas edge on ${scaffold} in ${items.length} creature poses (poses: ${unique(items.map((e) => e.pose)).join(', ')}), e.g. ${example(first)}`);
  }
  // Eyes and head features sit on the head: when the head is off the body they go with it and are not reported again.
  const offSlots = (d) => d.off.filter((slot) => !((slot === 'eyes' || slot === 'headFeature') && d.off.includes('head')));
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
  const c = report.coverage;
  lines.push(`coverage: seeds ${c.first} to ${c.last} as the generator makes them, and the Guardians of the worlds of those seeds, each composed at rest (no Titan, no bred creature): ${c.asked} creatures (${c.guardians} Guardians), ${c.full} drawn in full, ${c.noScaffold} with no scaffold, ${c.missingPart} with a part missing, ${c.composeGap} with a pose or skin gap`);
  for (const r of c.rows) lines.push(`coverage: ${r.family} ${r.tier}: ${r.asked} asked, ${r.full} in full, ${r.noScaffold} no scaffold, ${r.missingPart} part missing, ${r.composeGap} pose or skin gap`);
  for (const m of c.scaffolds) lines.push(`coverage: no scaffold ${m.id} (x${m.count})`);
  for (const m of c.parts) lines.push(`coverage: missing part ${m.id} (x${m.count})`);
  for (const m of c.gaps) lines.push(`coverage: gap ${m.id} (x${m.count})`);
  const errors = lines.filter((l) => l.startsWith('error:')).length;
  const n = report.partial?.length ?? 0;
  const partial = n === 0 ? '' : ` (partial: ${n} scaffold${n === 1 ? '' : 's'} not sampled)`;
  return `check-pack: ${report.ok ? 'OK' : `FAIL (${errors} distinct errors)`}${partial}\n${lines.join('\n')}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const files = args.filter((a) => !a.startsWith('--'));
  const flags = args.filter((a) => a.startsWith('--'));
  const range = flags.map((f) => /^--coverage-seeds=(\d+)-(\d+)$/.exec(f)).find((m) => m !== null);
  const known = (f) => f === '--require-coverage' || /^--coverage-seeds=\d+-\d+$/.test(f);
  const usage = 'usage: node tools/check-pack.mjs [--require-coverage] [--coverage-seeds=<first>-<last>] <pack.txt> [more.txt ...]';
  if (files.length === 0 || !flags.every(known)) {
    console.error(usage);
    process.exit(2);
  }
  // One range of 32-bit seeds, first to last: anything else is refused, never walked as something it does not say.
  const refused = flags.filter((f) => f.startsWith('--coverage-seeds=')).length > 1 ? '--coverage-seeds is given twice'
    : !range ? null
      : Number(range[1]) > Number(range[2]) ? `${range[0]} names no seed: the first is after the last`
        : Number(range[2]) > 0xffffffff ? `${range[0]} names a seed above ${0xffffffff}` : null;
  if (refused !== null) {
    console.error(`check-pack: ${refused}\n${usage}`);
    process.exit(2);
  }
  let text;
  try {
    text = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  } catch (error) {
    console.error(`check-pack: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
  const report = checkPack(text, range ? { coverage: { first: Number(range[1]), last: Number(range[2]) } } : {});
  process.stdout.write(formatReport(report));
  const shortfall = flags.includes('--require-coverage') && report.coverage !== null ? coverageShortfall(report.coverage) : null;
  if (shortfall !== null) console.error(`check-pack: coverage required: ${shortfall}`);
  process.exit(report.ok && shortfall === null ? 0 : 1);
}
