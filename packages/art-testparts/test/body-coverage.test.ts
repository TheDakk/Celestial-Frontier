import { describe, expect, it } from 'vitest';
import type { Catalogue, SizeTier } from '@cf/art-format';
import {
  buildRecipe, fishShapes, planBodyParts, resolveBody, routeBody, SHAPES, torsoKindOf, type Recipe, type RecipePart,
} from '@cf/art-recipe';
import { assemble, compose } from '@cf/art-compose';
import { testCatalogue } from '@cf/art-testparts';
import { gapIsInfo, REQUIRED_POSES, shapedGenome } from '../../../tools/check-pack.mjs';
import { nameState } from '../../art-recipe/test/name-tests';

// The coverage walk (body routing): every route a genome can take, every shape of it, and every part gene the planner
// reads, drawn on the placeholder parts.

type Genome = Record<string, unknown>;
type Route = ReturnType<typeof routeBody>;

/** The design's table (plan header, "Body gene"), written out here: the four-legged torso type of a body on land. */
const LAND_TORSO: Readonly<Record<number, string>> = {
  0: 'sturdy', 2: 'stilt', 6: 'shelled', 7: 'membranous', 8: 'crystalline', 10: 'tusked', 11: 'horned', 12: 'spindly', 13: 'squat', 14: 'fourwinged',
};
/** The fish shapes of an aquatic body that is not winged. */
const FISH: Readonly<Record<number, readonly string[]>> = {
  0: ['fusiform', 'shark', 'flat', 'angler'], 2: ['fusiform', 'shark', 'flat', 'angler'], 12: ['fusiform', 'shark', 'flat', 'angler'],
  13: ['flat'], 6: ['fusiform', 'sturgeon'], 8: ['fusiform', 'sturgeon'], 10: ['fusiform', 'sturgeon'], 11: ['fusiform', 'sturgeon'],
};
/** The bodies whose animal is their own in every state. */
const OWN: Readonly<Record<number, readonly [string, readonly string[]]>> = {
  1: ['crustacean', ['crab', 'lobster']], 3: ['tentacled', ['octopus', 'squid', 'cuttlefish']], 4: ['serpent', ['snake', 'viper']],
  5: ['insect', ['beetle', 'generic', 'mantis']], 9: ['gelatinous', ['body']], 15: ['radial', ['anemone', 'urchin', 'coral', 'cucumber']],
};
const WINGED = [7, 14];

/** The family and shapes the design gives a body gene in a state. */
function designRoute(body: number, aquatic: boolean): readonly [string, readonly string[]] {
  const own = OWN[body];
  if (own !== undefined) return own;
  if (aquatic && !WINGED.includes(body)) return ['fish', FISH[body]!];
  return ['quadruped', [LAND_TORSO[body]!]];
}

const routeLine = (r: Route): string => `${r.family}: ${r.shapes.join(' ')}${r.aquatic ? ' aquatic' : ''}${r.airborne ? ' airborne' : ''}`;

/**
 * Every routing genome: body 0-15 x movement 0-17 x habitat 0-18 without the extremophile marker, and x movement 0-8 x
 * habitat 0-8 with it (the gene lengths of the game's tables). routeBody reads nothing else; the shape stream picks one
 * of the route's shapes, and the walk below takes every one.
 */
function routingGenomes(): Genome[] {
  const out: Genome[] = [];
  for (let body = 0; body < 16; body++) {
    for (let loco = 0; loco < 18; loco++) for (let habitat = 0; habitat < 19; habitat++) out.push({ kingdom: 'fauna', body, loco, habitat });
    for (let loco = 0; loco < 9; loco++) for (let habitat = 0; habitat < 9; habitat++) out.push({ kingdom: 'fauna', body, loco, habitat, x: 1 });
  }
  return out;
}

/** Aquatic and airborne by the original's name tests on the game's names (not by stateOf, the code under test). */
const named = (g: Genome): { aquatic: boolean; airborne: boolean } => nameState(g['loco'] as number, g['habitat'] as number, g['x'] === 1);

/** The first routing genome (in walk order) for each body gene, aquatic and airborne state: what resolveBody reads of the routing genes. */
function stateGenomes(): Genome[] {
  const first = new Map<string, Genome>();
  for (const g of routingGenomes()) {
    const { aquatic, airborne } = named(g);
    const key = `${String(g['body'])} ${aquatic} ${airborne}`;
    if (!first.has(key)) first.set(key, g);
  }
  return [...first.values()];
}

/** The tier genes walked: size 1 small (size 0 is small too), 2 medium, 4 large, apex 12 guardian. */
const TIER_GENES: Readonly<Record<SizeTier, Genome>> = { small: { size: 1 }, medium: { size: 2 }, large: { size: 4 }, guardian: { size: 2, apex: 12 } };
const TIERS: readonly SizeTier[] = ['small', 'medium', 'large', 'guardian'];
/** Every variant 0: the walk asserts the pack holds no other, so no variant can change a part id (see walk). */
const V0 = { torso: 0, head: 0, tail: 0, limb: 0 };
/** A fixed choice of shape i of n. */
const shapeAt = (i: number, _n: number) => (): number => i;
/** The genes the walk starts from: plain, slick skin (no back part), as the placeholder tests do. */
const BASE = { head: 0, tail: 1, limbs: 1, eyes: 0, skin: 3, trait: 0, pattern: 0, color: 3, accent: 5 };

/** A gap as the report prints it: a part id without its family, tier and variant. */
const short = (gap: string): string => gap.replace(/^(missing|frame):[^/]+\/([^/]+)\/([^/:]+)\/[^/:]+\/v\d+/, '$1 $2/$3');
const partKey = (p: RecipePart): string => `${p.slot} ${p.index} ${p.partId} ${p.at === undefined ? '' : `${p.at.host}.${p.at.point}`}`;

interface Walked {
  /** What the placeholder cannot draw: `<scaffold>: <error gaps>`, and one `no scaffold` line per family. */
  cannot: string[];
  /** Scaffolds drawn without an information part: `<scaffold>: <slot>/<kind> ...`. */
  without: string[];
  /** Recipes planned, distinct part sets drawn, poses drawn, part sets drawn once more with their genome's skin. */
  planned: number; drawn: number; poses: number; skins: number;
}

/**
 * The coverage walk on a catalogue. For every body, state and shape (stateGenomes, every shape of the route) and every
 * tier: a missing scaffold is reported; else every limbs gene 0-5 x head gene 0-9 x eyes gene 0-5 x trait 0 and 11, with
 * the tail gene and the skin gene stepping through all their values inside each limbs gene (the planner asks for the
 * tail and back parts from those genes alone, and they hang from the torso, so they meet every head, eye and trait part
 * only through the leg count, which each limbs gene holds fixed). Each recipe is planned with every variant 0, and every
 * distinct set of parts is drawn in every required pose; an error gap (gapIsInfo false) is reported. A missing
 * information part is listed from the planner's gaps of every planned recipe, before the distinct sets are chosen, so
 * the list does not depend on the walk's order. Pattern and shift are not walked: they change only marks: gaps and
 * where a part lands. `keep` limits the walk to some body and state genomes (the planted faults); `reverse` walks
 * every level in the opposite order.
 */
function walk(catalogue: Catalogue, keep: (state: Genome) => boolean = () => true, reverse = false): Walked {
  const inOrder = <T>(items: readonly T[]): T[] => (reverse ? [...items].reverse() : [...items]);
  for (const part of catalogue.parts.values()) {
    // A held variant other than v0 would make the variant streams choose parts: the walk would have to walk them.
    if (part.variant !== 0) throw new Error(`the walk plans every variant 0, but the pack holds ${part.id}`);
  }
  const errors = new Map<string, Set<string>>();
  const without = new Map<string, Set<string>>();
  const noScaffold = new Map<string, Map<SizeTier, Set<string>>>();
  const seen = new Set<string>();
  let planned = 0;
  let poses = 0;
  let skins = 0;
  for (const state of inOrder(stateGenomes())) {
    if (!keep(state)) continue;
    const { family, shapes } = routeBody(state);
    for (const [shape, i] of inOrder(shapes.map((sh, k) => [sh, k] as const))) {
      for (const tier of inOrder(TIERS)) {
        const scaffoldId = `${family}/${shape}/${tier}`;
        if (!catalogue.scaffolds.has(scaffoldId)) {
          const byTier = noScaffold.get(family) ?? new Map<SizeTier, Set<string>>();
          noScaffold.set(family, byTier.set(tier, (byTier.get(tier) ?? new Set()).add(shape)));
          continue;
        }
        // The recipe the routed builder makes for one genome of this shape: the walk draws its recipes on it.
        const shaped = shapedGenome({ kingdom: 'fauna', ...state, ...TIER_GENES[tier], ...BASE }, family, shape);
        if (shaped === undefined) throw new Error(`no seed shapes ${scaffoldId}`);
        const template = buildRecipe(shaped, [], catalogue);
        const plan = (g: Genome) => {
          const b = resolveBody(g, shapeAt(i, shapes.length));
          return { b, ...planBodyParts(b, V0, () => () => 0, catalogue) };
        };
        // The walk's recipe is the routed builder's: the same scaffold, legs, parts and error gaps for the same genes.
        const mine = plan(shaped);
        expect(`${mine.b.family}/${torsoKindOf(mine.b)}/${mine.b.tier}`).toBe(template.scaffoldId);
        expect(template.scaffoldId).toBe(scaffoldId);
        expect(mine.b.limbs).toBe(template.legs);
        expect(mine.parts.map(partKey)).toEqual(template.parts.map(partKey));
        expect(mine.gaps.filter((gap) => !gapIsInfo(gap))).toEqual(template.gaps.filter((gap) => !gapIsInfo(gap)));

        const geneSets: Genome[] = [];
        for (let limbs = 0; limbs < 6; limbs++) {
          let step = 0;
          for (let head = 0; head < 10; head++) for (let eyes = 0; eyes < 6; eyes++) for (const trait of [0, 11]) {
            geneSets.push({ ...state, ...TIER_GENES[tier], ...BASE, limbs, head, eyes, trait, tail: step % 7, skin: step % 9 });
            step++;
          }
        }
        for (const genes of inOrder(geneSets)) {
          const { b, parts, gaps } = plan(genes);
          planned++;
          for (const gap of gaps) {
            if (gap.startsWith('missing:') && gapIsInfo(gap)) without.set(scaffoldId, (without.get(scaffoldId) ?? new Set()).add(short(gap).slice('missing '.length)));
          }
          const key = JSON.stringify([b.limbs, parts.map(partKey), gaps.filter((gap) => !gapIsInfo(gap))]) + scaffoldId;
          if (seen.has(key)) continue;
          seen.add(key);
          const recipe: Recipe = { ...template, legs: b.limbs, parts, gaps, skin: null, shift: { head: [0, 0], tail: [0, 0] } };
          for (const pose of REQUIRED_POSES) {
            poses++;
            // compose's gaps are assemble's, plus `fallback:` when there are no parts or the picture draws nothing
            // (compose.ts): those recipes are composed, the rest assembled.
            const assembled = assemble(recipe, pose, catalogue);
            const found = recipe.parts.length === 0 || assembled.buffer.pixels.every((p) => p === 0) ? compose(recipe, pose, catalogue).gaps : assembled.gaps;
            for (const gap of found) if (!gapIsInfo(gap)) errors.set(scaffoldId, (errors.get(scaffoldId) ?? new Set()).add(short(gap)));
          }
          // Once more at rest with the skin its genome gets (buildRecipe: none on a radial), so the skin painter runs on
          // every drawn part set: a painter throw fails the walk, and an error gap is reported as above.
          const skinned = compose({ ...recipe, skin: b.family === 'radial' ? null : b.skin }, 'rest', catalogue);
          skins++;
          for (const gap of skinned.gaps) if (!gapIsInfo(gap)) errors.set(scaffoldId, (errors.get(scaffoldId) ?? new Set()).add(short(gap)));
        }
      }
    }
  }
  const cannot = [...errors].map(([id, gaps]) => `${id}: ${[...gaps].sort().join(', ')}`);
  for (const [family, byTier] of noScaffold) {
    // One line per family when every tier misses the same shapes, else one per tier.
    const groups = new Map<string, SizeTier[]>();
    for (const tier of TIERS.filter((t) => byTier.has(t))) {
      const shapes = byTier.get(tier)!;
      const names = [...shapes].sort().join(' ');
      groups.set(names, [...(groups.get(names) ?? []), tier]);
    }
    for (const [names, tiers] of groups) cannot.push(`${family} ${tiers.join(' ')}: no scaffold for ${names}`);
  }
  return {
    cannot: cannot.sort(),
    without: [...without].map(([id, kinds]) => `${id}: ${[...kinds].sort().join(' ')}`).sort(),
    planned, drawn: seen.size, poses, skins,
  };
}

let walked: Walked | undefined;
const theWalk = (): Walked => (walked ??= walk(testCatalogue()));

describe('the routing walk', () => {
  it('reaches every route the design names', () => {
    const genomes = routingGenomes();
    expect(genomes).toHaveLength(16 * 18 * 19 + 16 * 9 * 9);
    const routes = new Set<string>();
    const states = new Set<string>();
    for (const g of genomes) {
      const r = routeBody(g);
      const body = g['body'] as number;
      const { aquatic, airborne } = named(g);
      // The route is the design's for the body gene in the state the game's names give.
      expect([r.family, r.shapes, r.aquatic, r.airborne], JSON.stringify(g)).toEqual([...designRoute(body, aquatic), aquatic, airborne]);
      routes.add(routeLine(r));
      states.add(`${body} ${aquatic} ${airborne}`);
    }
    // Every body on land, aquatic, airborne, and both at once; the winged bodies stay four-legged in water.
    expect(states.size).toBe(16 * 4);
    expect(routes.has('quadruped: membranous aquatic') && routes.has('quadruped: fourwinged aquatic airborne')).toBe(true);
    // Each own-animal family's shapes, and the fish shapes, are the route table's.
    for (const [family, shapes] of Object.entries(SHAPES)) expect(Object.values(OWN).find(([f]) => f === family)?.[1]).toEqual(shapes);
    for (const [body, shapes] of Object.entries(FISH)) expect(fishShapes(Number(body))).toEqual(shapes);
    expect([...routes].sort()).toEqual([
      'crustacean: crab lobster', 'crustacean: crab lobster airborne', 'crustacean: crab lobster aquatic', 'crustacean: crab lobster aquatic airborne',
      'fish: flat aquatic', 'fish: flat aquatic airborne', 'fish: fusiform shark flat angler aquatic', 'fish: fusiform shark flat angler aquatic airborne',
      'fish: fusiform sturgeon aquatic', 'fish: fusiform sturgeon aquatic airborne',
      'gelatinous: body', 'gelatinous: body airborne', 'gelatinous: body aquatic', 'gelatinous: body aquatic airborne',
      'insect: beetle generic mantis', 'insect: beetle generic mantis airborne', 'insect: beetle generic mantis aquatic', 'insect: beetle generic mantis aquatic airborne',
      'quadruped: crystalline', 'quadruped: crystalline airborne',
      'quadruped: fourwinged', 'quadruped: fourwinged airborne', 'quadruped: fourwinged aquatic', 'quadruped: fourwinged aquatic airborne',
      'quadruped: horned', 'quadruped: horned airborne',
      'quadruped: membranous', 'quadruped: membranous airborne', 'quadruped: membranous aquatic', 'quadruped: membranous aquatic airborne',
      'quadruped: shelled', 'quadruped: shelled airborne', 'quadruped: spindly', 'quadruped: spindly airborne',
      'quadruped: squat', 'quadruped: squat airborne', 'quadruped: stilt', 'quadruped: stilt airborne',
      'quadruped: sturdy', 'quadruped: sturdy airborne', 'quadruped: tusked', 'quadruped: tusked airborne',
      'radial: anemone urchin coral cucumber', 'radial: anemone urchin coral cucumber airborne', 'radial: anemone urchin coral cucumber aquatic', 'radial: anemone urchin coral cucumber aquatic airborne',
      'serpent: snake viper', 'serpent: snake viper airborne', 'serpent: snake viper aquatic', 'serpent: snake viper aquatic airborne',
      'tentacled: octopus squid cuttlefish', 'tentacled: octopus squid cuttlefish airborne', 'tentacled: octopus squid cuttlefish aquatic', 'tentacled: octopus squid cuttlefish aquatic airborne',
    ]);
  });
});

describe('the coverage walk on the placeholder parts', () => {
  it('reports what the placeholder cannot draw', () => {
    const w = theWalk();
    // At medium every family and shape draws every genome; no other tier has a scaffold yet (Task 17 completes the pack).
    expect(w.cannot).toEqual([
      'crustacean small large guardian: no scaffold for crab lobster',
      'fish small large guardian: no scaffold for angler flat fusiform shark sturgeon',
      'gelatinous small large guardian: no scaffold for body',
      'insect small large guardian: no scaffold for beetle generic mantis',
      'quadruped small large guardian: no scaffold for crystalline fourwinged horned membranous shelled spindly squat stilt sturdy tusked',
      'radial small large guardian: no scaffold for anemone coral cucumber urchin',
      'serpent small large guardian: no scaffold for snake viper',
      'tentacled small large guardian: no scaffold for cuttlefish octopus squid',
    ]);
    // Drawn, but without the skin's back part (information, not an error): the placeholder pack holds back parts on
    // the four-legged bodies only, so every other scaffold lacks all seven back kinds.
    const backKinds = ['carapace', 'crystals', 'knobs', 'mane', 'plates', 'plume', 'ridge'];
    const others = ['crustacean/crab', 'crustacean/lobster', 'fish/angler', 'fish/flat', 'fish/fusiform', 'fish/shark', 'fish/sturgeon', 'gelatinous/body',
      'insect/beetle', 'insect/generic', 'insect/mantis', 'serpent/snake', 'serpent/viper', 'tentacled/cuttlefish', 'tentacled/octopus', 'tentacled/squid'];
    expect(w.without).toEqual(others.map((id) => `${id}/medium: ${backKinds.map((kind) => `back/${kind}-${id.split('/')[1]}`).join(' ')}`));
    // 126 body, state and shape cases have a medium scaffold, each walked over 720 gene sets; the distinct part sets
    // among them are drawn in all seven poses.
    expect([w.planned, w.drawn, w.poses, w.skins]).toEqual([126 * 720, 14802, 14802 * 7, 14802]);
  });

  it('a missing t0 tail is reported on the creature that asks for it', () => {
    const cat = testCatalogue();
    const parts = new Map(cat.parts);
    expect(parts.delete('quadruped/tail/t0/medium/v0')).toBe(true);
    // The sturdy body on land only.
    const sturdy = (g: Genome): boolean => g['body'] === 0 && !named(g).aquatic && !named(g).airborne;
    const lines = (c: Catalogue): string[] => walk(c, sturdy).cannot.filter((line) => !line.includes('no scaffold'));
    expect(lines({ ...cat, parts })).toEqual(['quadruped/sturdy/medium: missing tail/t0']);
    // A creature whose every part draws nothing is drawn as the fallback: reported too.
    const blank = new Map([...cat.parts].map(([id, part]) => [id, id.startsWith('quadruped/') ? {
      ...part, frames: Object.fromEntries(Object.entries(part.frames).map(([name, f]) => [name, { ...f, pixels: new Uint8Array(f.pixels.length) }])),
    } : part]));
    expect(lines({ ...cat, parts: blank })).toEqual(['quadruped/sturdy/medium: fallback:quadruped']);
    // Without a fault the same walk reports nothing at medium.
    expect(lines(cat)).toEqual([]);
  });

  it('a missing information part is listed, and the list does not depend on the walk\'s order', () => {
    const cat = testCatalogue();
    // Planted: the shelled body's shell (a body feature, information when missing) taken out of a copy of the pack.
    const parts = new Map(cat.parts);
    expect(parts.delete('quadruped/bodyFeature/shell-shelled/medium/v0')).toBe(true);
    const shelled = (g: Genome): boolean => g['body'] === 6;
    const clean = walk(cat, shelled).without;
    expect(walk({ ...cat, parts }, shelled).without).toEqual([...clean, 'quadruped/shelled/medium: bodyFeature/shell-shelled'].sort());
    expect(clean.some((line) => line.startsWith('quadruped/'))).toBe(false);
    // The whole walk in the opposite order (states, shapes, tiers and gene sets) reports the same.
    const reversed = walk(cat, () => true, true);
    const w = theWalk();
    expect([reversed.cannot, reversed.without, reversed.planned]).toEqual([w.cannot, w.without, w.planned]);
  });
});
