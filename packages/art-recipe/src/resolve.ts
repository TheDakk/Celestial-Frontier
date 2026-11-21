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

// Body gene (0..15) to [family, torso type]. Only quadruped has torso types.
const BODY_FAMILY: readonly (readonly [string, string])[] = [
  ['quadruped', 'sturdy'], ['quadruped', 'armored'], ['quadruped', 'stilt'], ['tentacled', ''],
  ['serpent', ''], ['myriapod', ''], ['gastropod', ''], ['membranous', ''],
  ['crystalline', ''], ['gelatinous', ''], ['quadruped', 'tusked'], ['quadruped', 'horned'],
  ['arachnid', ''], ['quadruped', 'squat'], ['insect', ''], ['radial', ''],
];

export function resolveAnatomy(genome: Readonly<Record<string, unknown>>, options?: { guardian?: boolean }): Anatomy {
  const g = (name: string, length: number): number => wrap(genome[name], length);
  const tier: SizeTier = options?.guardian === true ? 'guardian' : tierForSize(genome['size'] as number);
  const shared = { tier, colour: g('color', 17), accent: g('accent', 17), glow: genome['lumin'] === true, swimmer: false };
  const none = { head: 0, tail: 0, pattern: 0, skin: 0, limbs: 0, eyes: 0 };
  switch (genome['kingdom']) {
    case 'flora': return { ...shared, ...none, kingdom: 'flora', family: 'flora', torso: '', form: g('form', 18) };
    case 'fungi': return { ...shared, ...none, kingdom: 'fungi', family: 'fungi', torso: '', form: g('form', 9) };
    case 'microbe': return { ...shared, ...none, kingdom: 'microbe', family: 'microbe', torso: '', form: g('form', 12) };
    default: {
      const loco = g('loco', 18);
      const swimmer = loco === 4 || loco === 13;
      const [family, torso] = swimmer ? ['fish', ''] : BODY_FAMILY[g('body', 16)]!;
      return {
        ...shared, kingdom: 'fauna', family, torso, swimmer, form: 0,
        head: g('head', 10), tail: g('tail', 7), pattern: g('pattern', 8), skin: g('skin', 9),
        limbs: LIMB_COUNTS[g('limbs', 6)]!, eyes: EYE_COUNTS[g('eyes', 6)]!,
      };
    }
  }
}
