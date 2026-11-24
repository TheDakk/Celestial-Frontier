import { EYE_COUNTS, LIMB_COUNTS } from '@cf/art-format';
import type { SizeTier, ThemeName } from '@cf/art-format';
import { EYELESS_HEAD, GENE_LENGTHS, isGuardianScale, marked, wrap } from './resolve';
import { SIZE_TIER_BY_GENE, stateOf, themeOf } from './states';

/** The animal the original draws for a genome, and only the genes that animal reads (buildRecipe draws it). */
export interface Body {
  kingdom: 'fauna' | 'flora' | 'fungi' | 'microbe';
  family: string;        // quadruped, fish, insect, serpent, tentacled, gelatinous, radial, crustacean; the kingdom outside fauna
  torso: string;         // quadruped: torso type; other fauna: the shape; '' outside fauna
  tier: SizeTier;
  head: number | null;   // head kind asked for, null when the shape has its own head or none
  tail: number | null;   // tail kind asked for (quadruped 0-6, else 2, 3, 5 or 6), null for none
  limbs: number;         // legs asked for, 0 for none
  eyes: number | null;   // eye count; 0 asks for two sensory pits; null when the body has its own eyes or none
  horn: boolean;         // a quadruped whose head kind (3, 6) or trait (11) carries a horn
  keeps: 'shell' | 'crystals' | 'tusks' | 'horn' | null; // what a fish keeps of its body plan
  aquatic: boolean; airborne: boolean;
  opacity: 100 | 82 | 66;
  theme: ThemeName | null; // the game's ability theme (themeOf); null outside fauna
  pattern: number; skin: number; colour: number; accent: number; glow: boolean;
  form: number; floraTable: 'land' | 'aquatic' | 'aerial';
}

/** Body genes whose animal is their own, on land or in water (the original's `_procFamily`, its first six tests). */
export const OWN_FAMILY_BY_BODY: Readonly<Record<number, string>> = Object.freeze({ 1: 'crustacean', 3: 'tentacled', 4: 'serpent', 5: 'insect', 9: 'gelatinous', 15: 'radial' });

/** The shapes of each own-animal family, in the design's order; the seed picks one (seedShape). */
export const SHAPES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  crustacean: Object.freeze(['crab', 'lobster']),
  tentacled: Object.freeze(['octopus', 'squid', 'cuttlefish']),
  serpent: Object.freeze(['snake', 'viper']),
  insect: Object.freeze(['beetle', 'generic', 'mantis']),
  gelatinous: Object.freeze(['body']),
  radial: Object.freeze(['anemone', 'urchin', 'coral', 'cucumber']),
});

/** The four-legged torso type by body gene; null for a body with its own animal. */
export const TORSO_BY_BODY: readonly (string | null)[] = Object.freeze(['sturdy', null, 'stilt', null, null, null, 'shelled', 'membranous', 'crystalline', null, 'tusked', 'horned', 'spindly', 'squat', 'fourwinged', null]);

/** What a fish keeps of its body plan, by body gene. */
export const FISH_KEEPS_BY_BODY: Readonly<Record<number, 'shell' | 'crystals' | 'tusks' | 'horn'>> = Object.freeze({ 6: 'shell', 8: 'crystals', 10: 'tusks', 11: 'horn' });

const PLAIN_FISH: readonly string[] = Object.freeze(['fusiform', 'shark', 'flat', 'angler']);
const KEEPING_FISH: readonly string[] = Object.freeze(['fusiform', 'sturgeon']);
const SQUAT_FISH: readonly string[] = Object.freeze(['flat']);

/** The fish shapes an aquatic body gene may take: squat is flat, a body that keeps something is fusiform or sturgeon, the rest any of four. */
export function fishShapes(body: number): readonly string[] {
  if (body === 13) return SQUAT_FISH;
  if (FISH_KEEPS_BY_BODY[body] !== undefined) return KEEPING_FISH;
  return PLAIN_FISH;
}

/** The tail kinds a fish, a tentacled body or a crustacean draws; the others draw no tail. */
export const TAIL_PART_KINDS: readonly number[] = Object.freeze([2, 3, 5, 6]);
/** The head kinds that carry a horn on a quadruped. */
export const HORN_HEADS: readonly number[] = Object.freeze([3, 6]);
/** The trait gene value that carries a horn on a quadruped. */
export const HORN_TRAIT = 11;

const WINGED_BODIES: readonly number[] = [7, 14];
const TRANSLUCENT_SKIN = 7;

/**
 * The original's choice of animal for a fauna genome, its steps 1 to 4: aquatic and airborne from the names; a body
 * with its own animal; else, aquatic and not winged, a fish; else the four-legged body, whose one shape is its torso type.
 */
export function routeBody(genome: Readonly<Record<string, unknown>>): { family: string; shapes: readonly string[]; aquatic: boolean; airborne: boolean } {
  const { aquatic, airborne } = stateOf(genome);
  const body = wrap(genome['body'], GENE_LENGTHS.body);
  const own = OWN_FAMILY_BY_BODY[body];
  if (own !== undefined) return { family: own, shapes: SHAPES[own]!, aquatic, airborne };
  if (aquatic && !WINGED_BODIES.includes(body)) return { family: 'fish', shapes: fishShapes(body), aquatic, airborne };
  return { family: 'quadruped', shapes: [TORSO_BY_BODY[body]!], aquatic, airborne };
}

/** What the game's portrait folds into a creature's seed before it draws the body (`hdBeastBare(G, (g.seed ^ 0x9A11) >>> 0)`). */
const PORTRAIT_SALT = 0x9A11;

/**
 * The game's choice among `count` shapes for a genome (its `_procFamily`), from the seed alone, so no other gene and
 * no lineage can change the body: the portrait's seed, `(seed ^ 0x9A11) >>> 0`, and of that the remainder by `count`.
 * Of a pair the game takes the first on an odd seed (`s2 ? 'crab' : 'lobster'`), so a pair is read the other way round.
 * A seed that is not a number counts as the game's `^` counts it, as 0; permanent, part of renderer version 1.
 */
export function seedShape(genome: Readonly<Record<string, unknown>>): (count: number) => number {
  const own = genome['seed'];
  const seed = ((typeof own === 'number' ? own : 0) ^ PORTRAIT_SALT) >>> 0;
  return (count) => (count === 2 ? 1 - (seed % 2) : seed % count);
}

/**
 * The body a genome draws as, with the genes its animal ignores dropped. The shape is the one `shapeAt` picks of the
 * family's shapes (seedShape in the game), asked once for every fauna genome (a four-legged body has one shape) and
 * never outside fauna.
 */
export function resolveBody(genome: Readonly<Record<string, unknown>>, shapeAt: (count: number) => number): Body {
  const g = (name: string, length: number): number => wrap(genome[name], length);
  const L = GENE_LENGTHS;
  const guardian = isGuardianScale(genome);
  const shared = { colour: g('color', L.color), accent: g('accent', L.accent), glow: genome['lumin'] === true };
  const tier = guardian ? 'guardian' as const : SIZE_TIER_BY_GENE[g('size', L.size)]!;
  const kingdom = genome['kingdom'];
  if (kingdom === 'flora' || kingdom === 'fungi' || kingdom === 'microbe') {
    const neutral = {
      ...shared, family: kingdom, torso: '', tier,
      head: null, tail: null, eyes: null, keeps: null, limbs: 0, horn: false, aquatic: false, airborne: false, opacity: 100 as const, theme: null,
      pattern: 0, skin: 0,
    };
    if (kingdom === 'fungi') return { ...neutral, kingdom, form: g('form', L.fungiForm), floraTable: 'land' };
    if (kingdom === 'microbe') return { ...neutral, kingdom, form: g('form', L.microbeForm), floraTable: 'land' };
    // The game checks the sea marker first, then the air marker (floraFormOf).
    if (marked(genome['aq'])) return { ...neutral, kingdom, form: g('form', L.aquaticFloraForm), floraTable: 'aquatic' };
    if (marked(genome['af'])) return { ...neutral, kingdom, form: g('form', L.aerialFloraForm), floraTable: 'aerial' };
    return { ...neutral, kingdom, form: g('form', L.floraForm), floraTable: 'land' };
  }

  const { family, shapes, aquatic, airborne } = routeBody(genome);
  const shape = shapes[shapeAt(shapes.length)]!;
  const body = g('body', L.body);
  const headGene = g('head', L.head);
  const tailGene = g('tail', L.tail);
  const skin = g('skin', L.skin);
  const geneEyes = headGene === EYELESS_HEAD ? 0 : EYE_COUNTS[g('eyes', L.eyes)]!;
  const quadruped = family === 'quadruped';

  let limbs = 0;
  if (quadruped) {
    limbs = LIMB_COUNTS[g('limbs', L.limbs)]!;
    if (WINGED_BODIES.includes(body)) {
      if (aquatic) limbs = 0;
      else if (airborne && limbs > 2) limbs = 2;
    }
  } else if (family === 'insect') limbs = 6;

  const readsHead = quadruped || family === 'fish' || family === 'insect' || family === 'crustacean';
  let tail: number | null = null;
  if (quadruped) tail = tailGene;
  else if ((family === 'fish' || family === 'tentacled' || family === 'crustacean') && TAIL_PART_KINDS.includes(tailGene)) tail = tailGene;

  let eyes: number | null = null;
  if (quadruped || family === 'fish' || family === 'insect' || (family === 'crustacean' && shape === 'lobster')) eyes = geneEyes;
  else if (family === 'serpent') eyes = 1;

  let opacity: 100 | 82 | 66 = 100;
  if (family === 'gelatinous') opacity = 82;
  else if (skin === TRANSLUCENT_SKIN && family !== 'radial') opacity = 66;

  return {
    ...shared, kingdom: 'fauna', family, torso: shape,
    tier,
    head: readsHead ? headGene : null, tail, limbs, eyes,
    horn: quadruped && (HORN_HEADS.includes(headGene) || g('trait', L.trait) === HORN_TRAIT),
    keeps: family === 'fish' ? FISH_KEEPS_BY_BODY[body] ?? null : null,
    aquatic, airborne, opacity, theme: themeOf(genome),
    pattern: g('pattern', L.pattern), skin, form: 0, floraTable: 'land',
  };
}
