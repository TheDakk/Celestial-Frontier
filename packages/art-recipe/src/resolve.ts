import { EYE_COUNTS, LIMB_COUNTS, tierForSize } from '@cf/art-format';
import type { SizeTier } from '@cf/art-format';

export interface Anatomy {
  kingdom: 'fauna' | 'flora' | 'fungi' | 'microbe';
  family: string; torso: string; // torso type, '' when the family has none
  tier: SizeTier; head: number; tail: number; pattern: number; skin: number;
  limbs: number; eyes: number; // counts, from LIMB_COUNTS and EYE_COUNTS
  colour: number; accent: number; glow: boolean; swimmer: boolean; form: number;
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
  floraForm: 18, fungiForm: 9, microbeForm: 12,
});

// Body gene (0..15) to [family, torso type]. Only quadruped has torso types.
const BODY_FAMILY: readonly (readonly [string, string])[] = [
  ['quadruped', 'sturdy'], ['quadruped', 'armored'], ['quadruped', 'stilt'], ['tentacled', ''],
  ['serpent', ''], ['myriapod', ''], ['gastropod', ''], ['membranous', ''],
  ['crystalline', ''], ['gelatinous', ''], ['quadruped', 'tusked'], ['quadruped', 'horned'],
  ['arachnid', ''], ['quadruped', 'squat'], ['insect', ''], ['radial', ''],
];

export function resolveAnatomy(genome: Readonly<Record<string, unknown>>, options?: { guardian?: boolean }): Anatomy {
  const g = (name: string, length: number): number => wrap(genome[name], length);
  const L = GENE_LENGTHS;
  const tier: SizeTier = options?.guardian === true ? 'guardian' : tierForSize(g('size', L.size));
  const shared = { tier, colour: g('color', L.color), accent: g('accent', L.accent), glow: genome['lumin'] === true, swimmer: false };
  const none = { head: 0, tail: 0, pattern: 0, skin: 0, limbs: 0, eyes: 0 };
  switch (genome['kingdom']) {
    case 'flora': return { ...shared, ...none, kingdom: 'flora', family: 'flora', torso: '', form: g('form', L.floraForm) };
    case 'fungi': return { ...shared, ...none, kingdom: 'fungi', family: 'fungi', torso: '', form: g('form', L.fungiForm) };
    case 'microbe': return { ...shared, ...none, kingdom: 'microbe', family: 'microbe', torso: '', form: g('form', L.microbeForm) };
    default: {
      const loco = g('loco', L.loco);
      const swimmer = loco === 4 || loco === 13;
      const [family, torso] = swimmer ? ['fish', ''] : BODY_FAMILY[g('body', L.body)]!;
      return {
        ...shared, kingdom: 'fauna', family, torso, swimmer, form: 0,
        head: g('head', L.head), tail: g('tail', L.tail), pattern: g('pattern', L.pattern), skin: g('skin', L.skin),
        limbs: LIMB_COUNTS[g('limbs', L.limbs)]!, eyes: EYE_COUNTS[g('eyes', L.eyes)]!,
      };
    }
  }
}
