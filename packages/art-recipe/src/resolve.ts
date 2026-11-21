import { EYE_COUNTS, LIMB_COUNTS, tierForSize } from '@cf/art-format';
import type { SizeTier } from '@cf/art-format';

export interface Anatomy {
  kingdom: 'fauna' | 'flora' | 'fungi' | 'microbe';
  family: string; torso: string; // torso type, '' when the family has none
  tier: SizeTier; head: number; tail: number; pattern: number; skin: number;
  limbs: number; eyes: number; // counts, from LIMB_COUNTS and EYE_COUNTS; eyes is 0 for the eyeless head
  colour: number; accent: number; glow: boolean; swimmer: boolean; form: number;
  // The flora form table `form` indexes: 'aquatic' (sea flora), 'aerial' (air flora) or 'land'; always 'land' outside flora.
  floraTable: 'land' | 'aquatic' | 'aerial';
}

/** Floor first, then true modulo so negatives wrap upward. Anything that is not a finite number gives 0. */
export function wrap(value: unknown, length: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return ((Math.floor(value) % length) + length) % length;
}

/**
 * The length of each game table a gene indexes, which is what the resolver wraps that gene by. They must equal
 * the lengths of the tables in @cf/domain-speciestraits (a test holds them together); part of renderer version 1.
 */
export const GENE_LENGTHS = Object.freeze({
  body: 16, loco: 18, head: 10, tail: 7, pattern: 8, skin: 9, limbs: 6, eyes: 6, size: 6, color: 17, accent: 17,
  floraForm: 18, fungiForm: 9, microbeForm: 12, extremophileLoco: 9, aquaticFloraForm: 6, aerialFloraForm: 3,
});

/**
 * The game's extremophile movement table (EX_LOCO), in its order, each entry with whether it resolves to the
 * swimming body: anything that swims, or drifts or floats through a fluid, swims; everything else (including
 * 'acid-cloud floaters', which float in air, not a sea) uses the normal body table. A test holds the names to the
 * game's table. Part of renderer version 1.
 */
export const EXTREMOPHILE_MOVEMENT: readonly (readonly [name: string, swims: boolean])[] = Object.freeze([
  ['vent-clingers', false], ['magma-swimmers', true], ['under-ice drifters', true], ['pressure-walkers', false],
  ['acid-cloud floaters', false], ['storm-riders', false], ['winged hunters', false], ['thermal-soarers', false],
  ['brine-crawlers', false],
].map((row) => Object.freeze(row as [string, boolean])));

/** The movement genes that swim in the game's normal movement table (FA_LOCO): swimmers and jet-propelled swimmers. */
const SWIMMING_LOCO: readonly number[] = [4, 13];

/**
 * Whether a marker the game reads as truthy (`g.x`, `g.aq`, `g.af`) is set. The same, except that a non-finite
 * number counts as unset, because a save writes it as null: the answer survives a save round trip.
 */
function marked(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  return Boolean(value);
}

/** The head gene value the game's head table (FA_HEAD) names 'eyeless and smooth': that head has no eyes, whatever the eyes gene. */
export const EYELESS_HEAD = 2;

// Body gene (0..15) to [family, torso type]. Only quadruped has torso types.
const BODY_FAMILY: readonly (readonly [string, string])[] = [
  ['quadruped', 'sturdy'], ['quadruped', 'armored'], ['quadruped', 'stilt'], ['tentacled', ''],
  ['serpent', ''], ['myriapod', ''], ['gastropod', ''], ['membranous', ''],
  ['crystalline', ''], ['gelatinous', ''], ['quadruped', 'tusked'], ['quadruped', 'horned'],
  ['arachnid', ''], ['quadruped', 'squat'], ['insect', ''], ['radial', ''],
];

/**
 * The Guardian band of `apex` the game keeps: 12 (Empyrean) to the top grade tier (TIER_MAX =
 * GRADE_TIERS.length - 1 = 14 in @cf/domain-speciestraits; a test holds `top` to it). Part of renderer version 1.
 */
export const GUARDIAN_APEX = Object.freeze({ lowest: 12, top: 14 });

/**
 * Whether the genome is a Guardian or a Titan, drawn at the 'guardian' tier. The game marks both with `apex`
 * (guardianFor sets it to the Guardian's tier, 12-14; a Titan's battle genome gets 14). On loading a save
 * (`_sanitizeSavedGenome`) and on importing a share code (`normGenome`) the game keeps `apex` only when
 * `apex != null` and `(+apex)|0` lies in 12..TIER_MAX, and deletes it otherwise. This is exactly that rule, so a
 * creature is drawn at the same size before and after a save or a share. Part of renderer version 1.
 */
export function isGuardianScale(genome: Readonly<Record<string, unknown>>): boolean {
  const apex = genome['apex'];
  // A symbol cannot become a number (the game would throw); it is never kept.
  if (apex === null || apex === undefined || typeof apex === 'symbol') return false;
  const a = Number(apex) | 0;
  return a >= GUARDIAN_APEX.lowest && a <= GUARDIAN_APEX.top;
}

export function resolveAnatomy(genome: Readonly<Record<string, unknown>>): Anatomy {
  const g = (name: string, length: number): number => wrap(genome[name], length);
  const L = GENE_LENGTHS;
  const tier: SizeTier = isGuardianScale(genome) ? 'guardian' : tierForSize(g('size', L.size));
  const shared = { tier, colour: g('color', L.color), accent: g('accent', L.accent), glow: genome['lumin'] === true, swimmer: false, floraTable: 'land' as const };
  const none = { head: 0, tail: 0, pattern: 0, skin: 0, limbs: 0, eyes: 0 };
  switch (genome['kingdom']) {
    case 'flora': {
      // The game checks the sea marker first, then the air marker (floraFormOf).
      if (marked(genome['aq'])) return { ...shared, ...none, kingdom: 'flora', family: 'flora', torso: '', form: g('form', L.aquaticFloraForm), floraTable: 'aquatic' };
      if (marked(genome['af'])) return { ...shared, ...none, kingdom: 'flora', family: 'flora', torso: '', form: g('form', L.aerialFloraForm), floraTable: 'aerial' };
      return { ...shared, ...none, kingdom: 'flora', family: 'flora', torso: '', form: g('form', L.floraForm) };
    }
    case 'fungi': return { ...shared, ...none, kingdom: 'fungi', family: 'fungi', torso: '', form: g('form', L.fungiForm) };
    case 'microbe': return { ...shared, ...none, kingdom: 'microbe', family: 'microbe', torso: '', form: g('form', L.microbeForm) };
    default: {
      // An extremophile (marker x) reads its movement gene from the extremophile table, as the game's locoOf does.
      const swimmer = marked(genome['x'])
        ? EXTREMOPHILE_MOVEMENT[g('loco', L.extremophileLoco)]![1]
        : SWIMMING_LOCO.includes(g('loco', L.loco));
      const [family, torso] = swimmer ? ['fish', ''] : BODY_FAMILY[g('body', L.body)]!;
      const head = g('head', L.head);
      return {
        ...shared, kingdom: 'fauna', family, torso, swimmer, form: 0,
        head, tail: g('tail', L.tail), pattern: g('pattern', L.pattern), skin: g('skin', L.skin),
        limbs: LIMB_COUNTS[g('limbs', L.limbs)]!, eyes: head === EYELESS_HEAD ? 0 : EYE_COUNTS[g('eyes', L.eyes)]!,
      };
    }
  }
}
