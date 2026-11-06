/** @module painted-variants [domain] — G4 SELECTION (Generated Creature Pipeline, audits/G4_SELECTION_20260926/README.md):
 * which painting draws a creature, as ONE pure resolver shared by the Compendium card and the battle stage (CARD = STAGE).
 *
 * Order (PROGRAM.md G4):
 * 1. `painted` — the creature's exact Earth species painting.
 * 2. `earth-variant` — an Earth species with no painting of its own takes a painted member of its SAME Earth profile group
 *    (felid → Cougar, canid → Wolf, hoofed-horned → Impala/Ibex …): the nearest painted relative. Earth genomes are seeded, not
 *    species-true (`_earthNamePass` assigns the name by seed modulo), so Earth selection reads the species' profile, never its
 *    genes.
 * 2′. `procedural-variant` — a procedural creature takes the nearest painting, by the VISUAL GENES the morph cannot redraw (skin,
 *    size, tail type), among the paintings that draw the SAME anatomy the procedural painter draws for it (`VARIANT_SETS`, keyed by
 *    `proceduralFamilyV1`): a six-limbed alien never becomes a four-legged painting. Palette, accent, pattern and head/tail
 *    proportion still morph on top (morph-params), exactly as before.
 * 3. the v1 stand-in (`paintedStandInV1`): the body plan's one painting, else null (procedural art).
 *
 * `painted` is the set of paintings the caller can draw right now (the card's archetypes, or the stage's LOADED records); a
 * variant outside it is skipped, so the offline/core-only path degrades to the v1 stand-in by construction. Pure and
 * deterministic: no clock, no Math.random, no device state (rule 1). */
import { earthFaunaProfile } from '../earth-fauna-profiles.js';
import { paintedStandInV1, proceduralFamilyV1, type PaintedStandIn } from './painted-stand-in.js';

export type PaintedArtKind = PaintedStandIn['kind'] | 'earth-variant' | 'procedural-variant';
export interface PaintedArtV2 { readonly earthName: string; readonly kind: PaintedArtKind; readonly family: string; /** on a variant only: the v1 stand-in it replaced (null when v1 drew nothing) */ readonly standIn?: string | null; }

/** The v1 fauna vocabularies these traits index (speciestraits FA_SKIN / FA_SIZE / FA_TAIL; pinned by the test). */
export const TRAIT_SKIN = Object.freeze(['scaled', 'furred', 'chitinous', 'slick and wet', 'plated', 'warty', 'feathered', 'translucent', 'crystalline'] as const);
export const TRAIT_SIZE = Object.freeze(['tiny', 'small', 'dog-sized', 'large', 'massive', 'titanic'] as const);
export const TRAIT_TAIL = Object.freeze(['none', 'whip-like', 'finned', 'spiked', 'prehensile', 'plumed', 'stinger-tipped'] as const);
type Skin = (typeof TRAIT_SKIN)[number]; type Size = (typeof TRAIT_SIZE)[number]; type Tail = (typeof TRAIT_TAIL)[number];
interface Traits { readonly skin: Skin; readonly size: Size; readonly tail: Tail; }

/** What each painting visibly shows, in the genome's own vocabulary (authored from the paintings; reviewable, one row per
 * painting that shares an anatomy set with another). */
export const PAINTED_TRAITS: Readonly<Record<string, Traits>> = Object.freeze({
  Civet: { skin: 'furred', size: 'small', tail: 'whip-like' }, Wolf: { skin: 'furred', size: 'dog-sized', tail: 'plumed' },
  Cougar: { skin: 'furred', size: 'large', tail: 'whip-like' }, Impala: { skin: 'furred', size: 'dog-sized', tail: 'none' },
  Ibex: { skin: 'furred', size: 'large', tail: 'none' }, Marmot: { skin: 'furred', size: 'small', tail: 'none' },
  Rat: { skin: 'furred', size: 'tiny', tail: 'whip-like' }, 'River Otter': { skin: 'slick and wet', size: 'dog-sized', tail: 'whip-like' },
  'Wall Lizard': { skin: 'scaled', size: 'tiny', tail: 'whip-like' }, Salamander: { skin: 'warty', size: 'small', tail: 'finned' },
  Salmon: { skin: 'scaled', size: 'dog-sized', tail: 'finned' }, Bass: { skin: 'scaled', size: 'small', tail: 'finned' },
  Pike: { skin: 'scaled', size: 'dog-sized', tail: 'whip-like' }, Tang: { skin: 'slick and wet', size: 'small', tail: 'spiked' },
  Python: { skin: 'scaled', size: 'large', tail: 'none' }, Racer: { skin: 'scaled', size: 'small', tail: 'whip-like' },
  Crab: { skin: 'plated', size: 'small', tail: 'none' }, 'Coconut Crab': { skin: 'plated', size: 'dog-sized', tail: 'none' },
  'Freshwater Crab': { skin: 'chitinous', size: 'small', tail: 'none' }, 'Mud Crab': { skin: 'plated', size: 'tiny', tail: 'none' },
  'Vent Crab': { skin: 'translucent', size: 'tiny', tail: 'none' },
});

/** Procedural family (proceduralFamilyV1) → the paintings that draw that SAME anatomy, the v1 stand-in first. A family absent
 * here keeps its v1 route. Sturgeon and Reef Shark give the sturgeon- and shark-shaped fish their own painting (v1: none). */
export const VARIANT_SETS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'land:4': Object.freeze(['Civet', 'Wolf', 'Cougar', 'Impala', 'Ibex', 'Marmot', 'Rat', 'River Otter', 'Wall Lizard', 'Salamander']),
  'fish:fusiform': Object.freeze(['Salmon', 'Bass', 'Pike', 'Tang']),
  'fish:sturgeon': Object.freeze(['Sturgeon']), 'fish:shark': Object.freeze(['Reef Shark']),
  'serpent:snake': Object.freeze(['Python', 'Racer']), 'serpent:viper': Object.freeze(['Python', 'Racer']),
  'crust:crab': Object.freeze(['Crab', 'Coconut Crab', 'Freshwater Crab', 'Mud Crab', 'Vent Crab']),
});

const SKIN_GROUP: Readonly<Record<Skin, number>> = { scaled: 0, plated: 0, chitinous: 1, crystalline: 1, furred: 2, feathered: 3, 'slick and wet': 4, warty: 4, translucent: 4 };
const idx = (g: Readonly<Record<string, unknown>>, k: string, n: number) => { const v = g[k]; return typeof v === 'number' && Number.isFinite(v) ? ((Math.trunc(v) % n) + n) % n : 0; };
/** Visual-gene distance of a procedural genome to a painting's traits: skin (same 0, same group 1, else 2), size (half a step
 * per size class) and tail type (0.5 when different). */
export function traitDistanceV1(genome: Readonly<Record<string, unknown>>, t: Traits): number {
  const skin = TRAIT_SKIN[idx(genome, 'skin', TRAIT_SKIN.length)]!, size = idx(genome, 'size', TRAIT_SIZE.length), tail = TRAIT_TAIL[idx(genome, 'tail', TRAIT_TAIL.length)]!;
  return (skin === t.skin ? 0 : SKIN_GROUP[skin] === SKIN_GROUP[t.skin] ? 1 : 2) + 0.5 * Math.abs(size - TRAIT_SIZE.indexOf(t.size)) + (tail === t.tail ? 0 : 0.5);
}

/** G4: which painting draws this creature (see the module note), or null (procedural art). */
export function paintedArtV2(genome: Readonly<Record<string, unknown>> | null | undefined, painted: ReadonlySet<string>): PaintedArtV2 | null {
  const v1 = paintedStandInV1(genome, painted), standIn = v1?.earthName ?? null;
  if (!genome || typeof genome !== 'object' || (genome.kingdom !== undefined && genome.kingdom !== 'fauna')) return null;
  if (v1?.kind === 'painted') return v1;
  const earth = typeof genome._earthName === 'string' ? genome._earthName : null;
  if (earth !== null) {
    const profile = earthFaunaProfile(earth), relative = profile?.names.find((n) => n !== earth && painted.has(n));
    if (profile && relative !== undefined && relative !== standIn) return Object.freeze({ earthName: relative, kind: 'earth-variant', family: profile.id, standIn });
    return v1;
  }
  const family = proceduralFamilyV1(genome), set = (VARIANT_SETS[family] ?? []).filter((n) => painted.has(n));
  let best: string | null = null, bestD = Infinity;
  for (const n of set) { const t = PAINTED_TRAITS[n]; const d = t ? traitDistanceV1(genome, t) : 1e9; /* a member without traits is still eligible (single-painting sets) */ if (d < bestD) { best = n; bestD = d; } } // ties keep set order
  if (best !== null && best !== standIn) return Object.freeze({ earthName: best, kind: 'procedural-variant', family, standIn });
  return v1;
}
