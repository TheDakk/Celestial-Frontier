import { BONE_RAMP, IRIS_RAMP_COUNT, VARIANTS } from '@cf/art-format';
import type { Catalogue, SizeTier, SlotName, ThemeName } from '@cf/art-format';
import { planBodyParts, planSpeciesParts, torsoKindOf } from './requests';
import { resolveBody, seedShape } from './route';
import { irisOf } from './states';
import type { Body } from './route';
import { artStream, identityKey, pick } from './streams';

export const RENDERER_VERSION = 1;

/** A part's mark data: the stripe offset (0-14) and 15 spot rolls (each 0-99), from streams keyed by slot and index. */
export interface PartMark { offset: number; rolls: readonly number[]; }
/**
 * `mark`: only on a part in a mark slot of a patterned creature. `at`: the attach point that overrides the slot's
 * (a serpent's eye on its torso, sails on the back).
 */
export interface RecipePart { slot: SlotName; index: number; partId: string; source: 'own'; mark?: PartMark; at?: { host: 'torso' | 'head'; point: string }; }
export interface Recipe {
  version: number; identity: string; family: string; tier: SizeTier; scaffoldId: string;
  legs: number; // the anatomy's limb count, 0 outside fauna
  eyes: number; // the eye count drawn; 0 when the body draws its two pits or asks for no eye
  parts: readonly RecipePart[]; // in DRAW_ORDER, then by index
  ramps: { primary: string; accent: string; underside: string; iris: string };
  marking: { pattern: number; strength: 0 | 1 | 2; phase: number }; // strength 0 hint, 1 clear, 2 full; phase 0-14
  shift: { head: readonly [number, number]; tail: readonly [number, number] }; // each component -1, 0 or 1
  glow: boolean; gaps: readonly string[];
  // A named species (buildSpeciesRecipe) has the neutral values 100, false, null, 0, null.
  opacity: 100 | 82 | 66; // percent: a jelly 82, a translucent skin 66
  airborne: boolean;
  theme: ThemeName | null; // the creature's theme (routed builder, fauna); null otherwise
  rim: 0 | 50 | 75;       // percent of the theme colour the rim adds when shown (rimOf); 0 draws none
  skin: number | null;    // the skin gene 0-8 (SKIN_NAMES) the composer paints on every part in a mark slot; null paints none
  template?: string;      // only on a named species' recipe: the template its species line names (the pose set it is held to)
}

/**
 * What the caller knows of the creature now, beside its identity. `bulk`: lean 0, normal 1, heavy 2, the torso variant
 * buildRecipe asks for (the game computes it from vitality). Legs do not thicken with bulk.
 */
export interface Condition { bulk: 0 | 1 | 2 }

/** The neutral values of the routed fields for a named species: they draw nothing. */
const NEUTRAL = Object.freeze({ opacity: 100, airborne: false, theme: null, rim: 0, skin: null } as const);

/** The creature-wide streams, each drawn exactly once, in this fixed order, whether or not the result is used. */
interface Drawn {
  variants: { head: number; tail: number; limb: number };
  headShift: [number, number]; tailShift: [number, number]; phase: number;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/**
 * The plain description of one generated creature, drawn as the animal the original draws (bodyOf, planBodyParts).
 * Pure: the same inputs always give a deeply equal, frozen recipe. The torso variant is the caller's bulk step
 * (`condition.bulk`, default normal); a bulk step outside 0 to 2, or a condition that is not an object, throws.
 * Named species keep buildSpeciesRecipe.
 */
export function buildRecipe(
  genome: Readonly<Record<string, unknown>>,
  lineage: readonly string[],
  catalogue: Catalogue,
  condition: Condition = { bulk: 1 },
): Recipe {
  return buildRecipeAt(RENDERER_VERSION, genome, lineage, catalogue, condition);
}

/** `buildRecipe` with the renderer version given; internal, for the version negative control in tests only. */
function buildRecipeAt(
  version: number,
  genome: Readonly<Record<string, unknown>>,
  lineage: readonly string[],
  catalogue: Catalogue,
  condition: Condition = { bulk: 1 },
): Recipe {
  // A condition that is not an object (null included) is refused as a bad bulk step, not met with a TypeError.
  if (typeof condition !== 'object' || condition === null) throw new Error(`bad bulk step ${String(condition)}`);
  const bulk: unknown = condition.bulk;
  if (bulk !== 0 && bulk !== 1 && bulk !== 2) throw new Error(`bad bulk step ${String(bulk)}`);
  const identity = identityKey(genome, lineage);
  const stream = (name: string): (() => number) => artStream(identity, name, version);
  const d = drawStreams(stream);
  const b = resolveBody(genome, seedShape(genome));
  const { parts, gaps } = planBodyParts(b, { ...d.variants, torso: bulk }, stream, catalogue);
  return deepFreeze({
    version, identity, family: b.family, tier: b.tier,
    scaffoldId: `${b.family}/${torsoKindOf(b)}/${b.tier}`,
    legs: b.limbs,
    eyes: b.eyes ?? 0,
    parts,
    // The iris is the theme's (irisOf); the `iris` stream is still drawn (drawStreams), its result dropped.
    ramps: { primary: `c${b.colour}`, accent: `c${b.accent}`, underside: `c${b.colour}-under`, iris: irisOf(b.theme) },
    marking: { pattern: b.pattern, strength: 2, phase: d.phase },
    shift: { head: d.headShift, tail: d.tailShift },
    glow: b.glow, gaps,
    opacity: b.opacity, airborne: b.airborne, theme: b.theme, rim: rimOf(b),
    // The skin gene, painted on every part in a mark slot; a radial has none, and outside fauna there is no skin gene.
    skin: b.kingdom === 'fauna' && b.family !== 'radial' ? b.skin : null,
  });
}

/**
 * Each creature-wide stream below is drawn exactly once, in this fixed order, whether or not the result is used.
 * That keeps each choice independent of every other gene. The per-part mark streams (requests.ts) are drawn only
 * for a marked part; each is its own named stream, so drawing it or not changes no other draw. `torso-build` and
 * `iris` stay reserved: drawn, their results dropped (the torso variant is the bulk step, the iris the theme's).
 */
function drawStreams(stream: (name: string) => () => number): Drawn {
  pick(stream('torso-build'), VARIANTS.torso);
  const headVariant = pick(stream('head-variant'), VARIANTS.head);
  const tailVariant = pick(stream('tail-variant'), VARIANTS.tail);
  const limbVariant = pick(stream('limb-style'), VARIANTS.limb);
  // mark-flip, mark-dx and mark-dy stay reserved: drawn, their results dropped.
  pick(stream('mark-flip'), 2);
  pick(stream('mark-dx'), 3);
  pick(stream('mark-dy'), 3);
  const headShift: [number, number] = [pick(stream('shift-head-x'), 3) - 1, pick(stream('shift-head-y'), 3) - 1];
  const tailShift: [number, number] = [pick(stream('shift-tail-x'), 3) - 1, pick(stream('shift-tail-y'), 3) - 1];
  // ramp-warmth is drawn only to reserve the stream; it is not stored in the recipe in this milestone.
  pick(stream('ramp-warmth'), 3);
  pick(stream('iris'), IRIS_RAMP_COUNT);
  const phase = pick(stream('mark-phase'), 15);
  // mark-strength is drawn only to reserve the stream: every fully generated creature is drawn at full strength.
  pick(stream('mark-strength'), 3);
  return { variants: { head: headVariant, tail: tailVariant, limb: limbVariant }, headShift, tailShift, phase };
}

/** The body a genome draws as: resolveBody with the shape the game gives the creature's seed (seedShape). */
export function bodyOf(genome: Readonly<Record<string, unknown>>): Body {
  return resolveBody(genome, seedShape(genome));
}

/**
 * The luminous rim's strength, in percent of the theme colour (hdart.verbatim.js:245, 1998-2001): none unless the body
 * glows; 75 on a crystalline body (a crystalline torso, or a fish that keeps crystals), else 50. Outside fauna there is
 * no theme to light it with, so none.
 */
function rimOf(b: Body): 0 | 50 | 75 {
  if (!b.glow || b.theme === null) return 0;
  return b.torso === 'crystalline' || b.keeps === 'crystals' ? 75 : 50;
}

/**
 * A named species' iris ramp: its own `<key>-iris` when the palette holds one, else `iris<n>` from its `iris=` field.
 * The `iris<n>` ramps are the theme colours, so a species that must keep its eye colour whatever the themes become
 * gets its own ramp.
 */
export function speciesIrisRamp(key: string, iris: number, catalogue: Catalogue): string {
  const own = `${key}-iris`;
  return Object.hasOwn(catalogue.palette.ramps, own) ? own : `iris${iris}`;
}

/** The start of a named species' identity; a generated creature's identity starts with `{` (identityKey). */
const SPECIES_IDENTITY = 'species:';

/** A named species' bone ramp: its own `<key>-bone` when the palette holds one, else `bone`, as every generated creature's. */
export function speciesBoneRamp(key: string, catalogue: Catalogue): string {
  const own = `${key}-bone`;
  return Object.hasOwn(catalogue.palette.ramps, own) ? own : BONE_RAMP;
}

/**
 * The palette ramp a recipe's bone values (21-24) are shown in, for colourTable's `bone`: `bone` for a generated
 * creature, speciesBoneRamp for a named species. Not a field of `Recipe.ramps`: every recipe would carry the same
 * word, and the recorded colour fields of the generated creatures stay as they are.
 */
export function boneRampOf(recipe: Pick<Recipe, 'identity'>, catalogue: Catalogue): string {
  return recipe.identity.startsWith(SPECIES_IDENTITY) ? speciesBoneRamp(recipe.identity.slice(SPECIES_IDENTITY.length), catalogue) : BONE_RAMP;
}

/**
 * The recipe of a named species (catalogue line `species`): one fixed look, the same picture everywhere. Its own parts
 * (planSpeciesParts) on scaffold `<family>/<key>/<tier>`, its own ramps (speciesIrisRamp), plain, no shift, no glow, with the
 * template of its species line. No stream is drawn.
 * An unknown key throws. Frozen like buildRecipe's result.
 */
export function buildSpeciesRecipe(key: string, catalogue: Catalogue): Recipe {
  const species = catalogue.species.get(key);
  if (species === undefined) throw new Error(`unknown species '${key}'`);
  const { parts, gaps } = planSpeciesParts(species, catalogue);
  return deepFreeze({
    version: RENDERER_VERSION, identity: `${SPECIES_IDENTITY}${key}`, family: species.family, tier: species.tier,
    scaffoldId: `${species.family}/${key}/${species.tier}`,
    legs: species.legs,
    eyes: species.eyes,
    parts,
    ramps: { primary: key, accent: `${key}-accent`, underside: `${key}-under`, iris: speciesIrisRamp(key, species.iris, catalogue) },
    marking: { pattern: 0, strength: 2, phase: 0 },
    shift: { head: [0, 0], tail: [0, 0] },
    glow: false, gaps,
    ...NEUTRAL,
    template: species.template,
  });
}

/** Internal: not part of the renderer's interface. Tests use it to prove a different version changes pictures. */
export { buildRecipeAt as __buildRecipeAtVersionForTests };
