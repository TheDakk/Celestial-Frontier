import { IRIS_RAMP_COUNT, VARIANTS } from '@cf/art-format';
import type { Catalogue, SizeTier, SlotName, ThemeName } from '@cf/art-format';
import { planBodyParts, planParts, planSpeciesParts, torsoKindOf } from './requests';
import { resolveAnatomy } from './resolve';
import { resolveBody } from './route';
import { IRIS_BY_THEME } from './states';
import type { Body } from './route';
import { artStream, identityKey, pick } from './streams';

export const RENDERER_VERSION = 1;

/** A part's mark data: the stripe offset (0-14) and 15 spot rolls (each 0-99), from streams keyed by slot and index. */
export interface PartMark { offset: number; rolls: readonly number[]; }
/**
 * `mark`: only on a part in a mark slot of a patterned creature. `at`: the attach point that overrides the slot's
 * (a serpent's eye on its torso); only the routed builder sets it.
 */
export interface RecipePart { slot: SlotName; index: number; partId: string; source: 'own'; mark?: PartMark; at?: { host: 'torso' | 'head'; point: string }; }
export interface Recipe {
  version: number; identity: string; family: string; tier: SizeTier; scaffoldId: string;
  legs: number; // the anatomy's limb count, 0 outside fauna
  parts: readonly RecipePart[]; // in DRAW_ORDER, then by index
  ramps: { primary: string; accent: string; underside: string; iris: string };
  marking: { pattern: number; strength: 0 | 1 | 2; phase: number }; // strength 0 hint, 1 clear, 2 full; phase 0-14
  shift: { head: readonly [number, number]; tail: readonly [number, number] }; // each component -1, 0 or 1
  glow: boolean; gaps: readonly string[];
  // Drawn only by the routed builder; buildRecipe and buildSpeciesRecipe set the neutral values 100, false, null, 0, null.
  opacity: 100 | 82 | 66; // percent: a jelly 82, a translucent skin 66
  airborne: boolean;
  theme: ThemeName | null; // the creature's theme (routed builder, fauna); null otherwise
  rim: 0 | 50 | 75;       // 0 until the rim is drawn
  skin: number | null;    // the skin layer; null until the skin is drawn
}

/**
 * What the caller knows of the creature now, beside its identity. `bulk`: lean 0, normal 1, heavy 2, the torso variant
 * the routed builder asks for (the game computes it from vitality). Legs do not thicken with bulk.
 */
export interface Condition { bulk: 0 | 1 | 2 }

/** The neutral values of the routed builder's fields: they draw nothing. */
const NEUTRAL = Object.freeze({ opacity: 100, airborne: false, theme: null, rim: 0, skin: null } as const);

/** The creature-wide streams, each drawn exactly once, in this fixed order, whether or not the result is used. */
interface Drawn {
  variants: { torso: number; head: number; tail: number; limb: number };
  headShift: [number, number]; tailShift: [number, number]; iris: number; phase: number;
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/** The plain description of one creature. Pure: the same inputs always give a deeply equal, frozen recipe. */
export function buildRecipe(
  genome: Readonly<Record<string, unknown>>,
  lineage: readonly string[],
  catalogue: Catalogue,
): Recipe {
  return buildRecipeAt(RENDERER_VERSION, genome, lineage, catalogue);
}

/** `buildRecipe` with the renderer version given; internal, for the version negative control in tests only. */
function buildRecipeAt(
  version: number,
  genome: Readonly<Record<string, unknown>>,
  lineage: readonly string[],
  catalogue: Catalogue,
): Recipe {
  const a = resolveAnatomy(genome);
  const identity = identityKey(genome, lineage);
  const stream = (name: string): (() => number) => artStream(identity, name, version);
  const d = drawStreams(stream);

  const torsoKind = torsoKindOf(a);
  // Leg roles, the skin's back part, the torso type's head feature and each marked part's mark (requests.ts).
  const { parts, gaps } = planParts(a, d.variants, stream, catalogue);

  return deepFreeze({
    version, identity, family: a.family, tier: a.tier,
    scaffoldId: `${a.family}/${torsoKind}/${a.tier}`,
    legs: a.limbs,
    parts,
    ramps: { primary: `c${a.colour}`, accent: `c${a.accent}`, underside: `c${a.colour}-under`, iris: `iris${d.iris}` },
    marking: { pattern: a.pattern, strength: 2, phase: d.phase },
    shift: { head: d.headShift, tail: d.tailShift },
    glow: a.glow, gaps,
    ...NEUTRAL,
  });
}

/**
 * Each creature-wide stream below is drawn exactly once, in this fixed order, whether or not the result is used.
 * That keeps each choice independent of every other gene. The per-part mark streams (requests.ts) are drawn only
 * for a marked part; each is its own named stream, so drawing it or not changes no other draw.
 */
function drawStreams(stream: (name: string) => () => number): Drawn {
  const torsoVariant = pick(stream('torso-build'), VARIANTS.torso);
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
  const iris = pick(stream('iris'), IRIS_RAMP_COUNT);
  const phase = pick(stream('mark-phase'), 15);
  // mark-strength is drawn only to reserve the stream: every fully generated creature is drawn at full strength.
  pick(stream('mark-strength'), 3);
  return { variants: { torso: torsoVariant, head: headVariant, tail: tailVariant, limb: limbVariant }, headShift, tailShift, iris, phase };
}

/** The body a genome draws as: resolveBody with the shape from the `sub-shape` stream of the creature's identity. */
export function bodyOf(genome: Readonly<Record<string, unknown>>, lineage: readonly string[] = []): Body {
  return resolveBody(genome, artStream(identityKey(genome, lineage), 'sub-shape', RENDERER_VERSION));
}

/**
 * The recipe of a generated creature drawn as the animal the original draws (bodyOf, planBodyParts). The creature-wide
 * streams exactly as buildRecipe draws them, in the same order, then the body from `sub-shape`. Not live: buildRecipe
 * does not call it. Named species keep buildSpeciesRecipe. Frozen like buildRecipe's result. The torso variant is the
 * caller's bulk step (default normal); the `torso-build` stream is still drawn (drawStreams), its result dropped.
 * A bulk step outside 0 to 2 throws.
 */
export function buildRoutedRecipe(
  genome: Readonly<Record<string, unknown>>,
  lineage: readonly string[],
  catalogue: Catalogue,
  condition: Condition = { bulk: 1 },
): Recipe {
  const bulk: number = condition.bulk;
  if (bulk !== 0 && bulk !== 1 && bulk !== 2) throw new Error(`bad bulk step ${String(bulk)}`);
  const identity = identityKey(genome, lineage);
  const stream = (name: string): (() => number) => artStream(identity, name, RENDERER_VERSION);
  const d = drawStreams(stream);
  const b = bodyOf(genome, lineage);
  const { parts, gaps } = planBodyParts(b, { ...d.variants, torso: bulk }, stream, catalogue);
  return deepFreeze({
    version: RENDERER_VERSION, identity, family: b.family, tier: b.tier,
    scaffoldId: `${b.family}/${torsoKindOf(b)}/${b.tier}`,
    legs: b.limbs,
    parts,
    // The iris is the theme's; the `iris` stream is still drawn (drawStreams), its result dropped.
    ramps: { primary: `c${b.colour}`, accent: `c${b.accent}`, underside: `c${b.colour}-under`, iris: `iris${b.theme === null ? 0 : IRIS_BY_THEME[b.theme]}` },
    marking: { pattern: b.pattern, strength: 2, phase: d.phase },
    shift: { head: d.headShift, tail: d.tailShift },
    glow: b.glow, gaps,
    ...NEUTRAL, opacity: b.opacity, airborne: b.airborne, theme: b.theme,
  });
}

/**
 * The recipe of a named species (catalogue line `species`): one fixed look, the same picture everywhere. Its own parts
 * (planSpeciesParts) on scaffold `<family>/<key>/<tier>`, its own ramps, plain, no shift, no glow. No stream is drawn.
 * An unknown key throws. Frozen like buildRecipe's result.
 */
export function buildSpeciesRecipe(key: string, catalogue: Catalogue): Recipe {
  const species = catalogue.species.get(key);
  if (species === undefined) throw new Error(`unknown species '${key}'`);
  const { parts, gaps } = planSpeciesParts(species, catalogue);
  return deepFreeze({
    version: RENDERER_VERSION, identity: `species:${key}`, family: species.family, tier: species.tier,
    scaffoldId: `${species.family}/${key}/${species.tier}`,
    legs: species.legs,
    parts,
    ramps: { primary: key, accent: `${key}-accent`, underside: `${key}-under`, iris: `iris${species.iris}` },
    marking: { pattern: 0, strength: 2, phase: 0 },
    shift: { head: [0, 0], tail: [0, 0] },
    glow: false, gaps,
    ...NEUTRAL,
  });
}

/** Internal: not part of the renderer's interface. Tests use it to prove a different version changes pictures. */
export { buildRecipeAt as __buildRecipeAtVersionForTests };
