/** @module painted-stand-in [domain] — which PAINTED archetype draws a creature's card (Nick 2026-09-24: "I want the same art
 * direction on the compendium cards as we do for the generation — that art style should carry throughout the game").
 *
 * Three routes, in order, all pure and deterministic:
 * 1. `painted`: the genome's Earth species IS a painted archetype (the 17 of CARD_ARCHETYPES).
 * 2. `earth-stand-in`: an Earth species whose presentation profile routes to a body-plan template that has a painting — its
 *    body plan's archetype, morphed by the species' own genes (colour, accent, pattern, proportion).
 * 3. `procedural-stand-in`: a procedural (non-Earth) creature — the SAME body family the procedural painter already draws for
 *    it (hdart `_procFamily` + the limb gene for land bodies), so its visible anatomy never changes: a six-limbed alien never
 *    becomes a four-legged civet. `paintedStandInV1` mirrors that choice; the drift test runs hdart's own source against it.
 *
 * A family with no painting yet (jellies, anemones, lobsters, squid, flat or angler fish, two- or three-legged land bodies,
 * four-winged fliers) returns null and keeps the procedural art until it is painted. Plants, fungi and microbes are not fauna
 * and have no painted library yet. */
import { FA_LIMBS, habOf, locoOf } from '@cf/domain-speciestraits';
import { earthFaunaProfile } from '../earth-fauna-profiles.js';

/** Body-plan template id → its painted archetype (each archetype's record carries that template; pinned by a test). */
export const TEMPLATE_PAINTING: Readonly<Record<string, string>> = Object.freeze({
  quadruped: 'Civet', brachyuran: 'Crab', fish: 'Salmon', 'biped-bird': 'Eagle', insect: 'Beetle', serpent: 'Python',
  hopper: 'Tree Frog', primate: 'Chimpanzee', radial: 'Starfish', arachnid: 'Tarantula', cephalopod: 'Octopus',
  'flyer-membrane': 'Fruit Bat', myriapod: 'Centipede',
});

export type StandInKind = 'painted' | 'earth-stand-in' | 'procedural-stand-in';
export interface PaintedStandIn { readonly earthName: string; readonly kind: StandInKind; readonly family: string; }

/** The procedural painter's family for a non-Earth fauna genome — the same inputs hdart reads (plan = body % 16, water from the
 * locomotion/habitat text, seed = the portrait's seed, limbs from FA_LIMBS). Exported for the drift test. */
export function proceduralFamilyV1(genome: Readonly<Record<string, unknown>>): string {
  const num = (k: string) => (typeof genome[k] === 'number' && Number.isFinite(genome[k]) ? (genome[k] as number) : 0);
  const plan = num('body') % 16, seed = ((num('seed') ^ 0x9A11) >>> 0), s2 = seed % 2, s3 = seed % 3, s4 = seed % 4;
  const loco = locoOf(genome as Record<string, unknown>), hab = habOf(genome as Record<string, unknown>);
  const aqua = /swim|filter|jet|brine-crawl/.test(loco) || /ocean|shallows|reef|vent|trench|lakeshore|sea/.test(hab);
  if (plan === 4) return s2 ? 'serpent:snake' : 'serpent:viper';
  if (plan === 9) return 'jelly';
  if (plan === 15) return `sessile:${['anemone', 'urchin', 'coral', 'cucumber'][s4]}`;
  if (plan === 3) return `ceph:${['octopus', 'squid', 'cuttlefish'][s3]}`;
  if (plan === 5) return `insect:${['beetle', 'generic', 'mantis'][s3]}`;
  if (plan === 1) return s2 ? 'crust:crab' : 'crust:lobster';
  if (aqua && plan !== 7 && plan !== 14) {
    if (plan === 13) return 'fish:flat';
    if (plan === 6 || plan === 8 || plan === 10 || plan === 11) return s2 ? 'fish:fusiform' : 'fish:sturgeon';
    return `fish:${['fusiform', 'shark', 'flat', 'angler'][s4]}`;
  }
  if (plan === 7) return 'winged:membrane';
  if (plan === 14) return 'winged:four';
  const limbs = FA_LIMBS[num('limbs') % FA_LIMBS.length] ?? 4;
  return `land:${limbs}${/leaper/.test(loco) ? ':leaper' : ''}`;
}

/** Procedural family → painted archetype; absent = no painting draws that anatomy yet. */
const FAMILY_PAINTING: Readonly<Record<string, string>> = Object.freeze({
  'serpent:snake': 'Python', 'serpent:viper': 'Python', 'ceph:octopus': 'Octopus', 'insect:beetle': 'Beetle', 'insect:generic': 'Beetle',
  'crust:crab': 'Crab', 'fish:fusiform': 'Salmon', 'winged:membrane': 'Fruit Bat',
  'land:4': 'Civet', 'land:4:leaper': 'Tree Frog', 'land:6': 'Beetle', 'land:6:leaper': 'Beetle', 'land:8': 'Tarantula', 'land:8:leaper': 'Tarantula',
});

/** Which painted archetype draws this creature, or null (keep the procedural art). `painted` = the set of painted Earth names. */
export function paintedStandInV1(genome: Readonly<Record<string, unknown>> | null | undefined, painted: ReadonlySet<string>): PaintedStandIn | null {
  if (!genome || typeof genome !== 'object') return null;
  if (genome.kingdom !== undefined && genome.kingdom !== 'fauna') return null;
  const earth = typeof genome._earthName === 'string' ? genome._earthName : null;
  if (earth !== null) {
    if (painted.has(earth)) return Object.freeze({ earthName: earth, kind: 'painted', family: 'self' });
    const template = earthFaunaProfile(earth)?.candidateTemplates[0];
    const name = template === undefined ? undefined : TEMPLATE_PAINTING[template];
    return name !== undefined && painted.has(name) ? Object.freeze({ earthName: name, kind: 'earth-stand-in', family: template! }) : null;
  }
  const family = proceduralFamilyV1(genome), name = FAMILY_PAINTING[family];
  return name !== undefined && painted.has(name) ? Object.freeze({ earthName: name, kind: 'procedural-stand-in', family }) : null;
}
