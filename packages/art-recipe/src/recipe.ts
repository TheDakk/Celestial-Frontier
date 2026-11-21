import { IRIS_RAMP_COUNT, VARIANTS } from '@cf/art-format';
import type { Catalogue, SizeTier, SlotName } from '@cf/art-format';
import { planParts } from './requests';
import { resolveAnatomy } from './resolve';
import { artStream, identityKey, pick } from './streams';

export const RENDERER_VERSION = 1;

/** A part's mark data: the stripe offset (0-14) and 15 spot rolls (each 0-99), from streams keyed by slot and index. */
export interface PartMark { offset: number; rolls: readonly number[]; }
/** `mark`: only on a part in a mark slot of a patterned creature. */
export interface RecipePart { slot: SlotName; index: number; partId: string; source: 'own'; mark?: PartMark; }
export interface Recipe {
  version: number; identity: string; family: string; tier: SizeTier; scaffoldId: string;
  legs: number; // the anatomy's limb count, 0 outside fauna
  parts: readonly RecipePart[]; // in DRAW_ORDER, then by index
  ramps: { primary: string; accent: string; underside: string; iris: string };
  marking: { pattern: number; strength: 0 | 1 | 2; phase: number }; // strength 0 hint, 1 clear, 2 full; phase 0-14
  shift: { head: readonly [number, number]; tail: readonly [number, number] }; // each component -1, 0 or 1
  glow: boolean; gaps: readonly string[];
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

  // Every stream is drawn exactly once, in this fixed order, whether or not the result is used.
  // That keeps each choice independent of every other gene.
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

  const torsoKind = a.torso === '' ? 'body' : a.torso;
  // Leg roles, the skin's back part, the torso type's head feature and each marked part's mark (requests.ts).
  const { parts, gaps } = planParts(a, { torso: torsoVariant, head: headVariant, tail: tailVariant, limb: limbVariant }, stream, catalogue);

  return deepFreeze({
    version, identity, family: a.family, tier: a.tier,
    scaffoldId: `${a.family}/${torsoKind}/${a.tier}`,
    legs: a.limbs,
    parts,
    ramps: { primary: `c${a.colour}`, accent: `c${a.accent}`, underside: `c${a.colour}-under`, iris: `iris${iris}` },
    marking: { pattern: a.pattern, strength: 2, phase },
    shift: { head: headShift, tail: tailShift },
    glow: a.glow, gaps,
  });
}

/** Internal: not part of the renderer's interface. Tests use it to prove a different version changes pictures. */
export { buildRecipeAt as __buildRecipeAtVersionForTests };
