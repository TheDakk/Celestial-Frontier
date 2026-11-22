import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Catalogue, SizeTier } from '@cf/art-format';
import {
  buildRecipe, buildRoutedRecipe, fishShapes, planBodyParts, resolveBody, routeBody, SHAPES, stateOf, torsoKindOf,
  type Recipe, type RecipePart,
} from '@cf/art-recipe';
import { assemble, compose } from '@cf/art-compose';
import { routedTestCatalogue, testCatalogue } from '@cf/art-testparts';
import { gapIsInfo, REQUIRED_POSES, shapedGenome } from '../../../tools/check-pack.mjs';

// The coverage walk (body routing, Task 16): every route a genome can take, every shape of it, and every part gene the
// planner reads, drawn on the placeholder parts; and the proof that a recorded creature whose animal does not change
// keeps its picture on the routed path. The routed builder is not live: buildRecipe still draws every recorded creature.

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

/** The first routing genome (in walk order) for each body gene, aquatic and airborne state: what resolveBody reads of the routing genes. */
function stateGenomes(): Genome[] {
  const first = new Map<string, Genome>();
  for (const g of routingGenomes()) {
    const { aquatic, airborne } = stateOf(g);
    const key = `${String(g['body'])} ${aquatic} ${airborne}`;
    if (!first.has(key)) first.set(key, g);
  }
  return [...first.values()];
}

/** The tier genes walked: size 1 small (not size 0, whose tier Task 17 settles), 2 medium, 4 large, apex 12 guardian. */
const TIER_GENES: Readonly<Record<SizeTier, Genome>> = { small: { size: 1 }, medium: { size: 2 }, large: { size: 4 }, guardian: { size: 2, apex: 12 } };
const TIERS: readonly SizeTier[] = ['small', 'medium', 'large', 'guardian'];
/** Every variant 0: the walk asserts the pack holds no other, so no variant can change a part id (see walk). */
const V0 = { torso: 0, head: 0, tail: 0, limb: 0 };
/** A stream that picks shape i of n. */
const shapeAt = (i: number, n: number) => (): number => (2 * i + 1) / (2 * n);
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
  /** Recipes planned, distinct part sets drawn, poses drawn. */
  planned: number; drawn: number; poses: number;
}

/**
 * The coverage walk on a catalogue. For every body, state and shape (stateGenomes, every shape of the route) and every
 * tier: a missing scaffold is reported; else every limbs gene 0-5 x head gene 0-9 x eyes gene 0-5 x trait 0 and 11, with
 * the tail gene and the skin gene stepping through all their values inside each limbs gene (the planner asks for the
 * tail and back parts from those genes alone, and they hang from the torso, so they meet every head, eye and trait part
 * only through the leg count, which each limbs gene holds fixed). Each recipe is planned with every variant 0, and every
 * distinct set of parts is drawn in every required pose; an error gap (gapIsInfo false) is reported, a missing
 * information part is listed. Pattern and shift are not walked: they change only marks: gaps and where a part lands.
 * `keep` limits the walk to some body and state genomes (the planted faults).
 */
function walk(catalogue: Catalogue, keep: (state: Genome) => boolean = () => true): Walked {
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
  for (const state of stateGenomes()) {
    if (!keep(state)) continue;
    const { family, shapes } = routeBody(state);
    shapes.forEach((shape, i) => {
      for (const tier of TIERS) {
        const scaffoldId = `${family}/${shape}/${tier}`;
        if (!catalogue.scaffolds.has(scaffoldId)) {
          const byTier = noScaffold.get(family) ?? new Map<SizeTier, Set<string>>();
          noScaffold.set(family, byTier.set(tier, (byTier.get(tier) ?? new Set()).add(shape)));
          continue;
        }
        // The recipe the routed builder makes for one genome of this shape: the walk draws its recipes on it.
        const shaped = shapedGenome({ kingdom: 'fauna', ...state, ...TIER_GENES[tier], ...BASE }, family, shape);
        if (shaped === undefined) throw new Error(`no seed shapes ${scaffoldId}`);
        const template = buildRoutedRecipe(shaped, [], catalogue);
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

        for (let limbs = 0; limbs < 6; limbs++) {
          let step = 0;
          for (let head = 0; head < 10; head++) for (let eyes = 0; eyes < 6; eyes++) for (const trait of [0, 11]) {
            const genes = { ...state, ...TIER_GENES[tier], ...BASE, limbs, head, eyes, trait, tail: step % 7, skin: step % 9 };
            step++;
            const { b, parts, gaps } = plan(genes);
            planned++;
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
              for (const gap of found) {
                if (!gapIsInfo(gap)) errors.set(scaffoldId, (errors.get(scaffoldId) ?? new Set()).add(short(gap)));
                else if (gap.startsWith('missing:')) without.set(scaffoldId, (without.get(scaffoldId) ?? new Set()).add(short(gap).slice('missing '.length)));
              }
            }
          }
        }
      }
    });
  }
  const cannot = [...errors].map(([id, gaps]) => `${id}: ${[...gaps].sort().join(', ')}`);
  for (const [family, byTier] of noScaffold) {
    // One line per family when every tier misses the same shapes, else one per tier.
    const groups = new Map<string, SizeTier[]>();
    for (const [tier, shapes] of byTier) {
      const names = [...shapes].sort().join(' ');
      groups.set(names, [...(groups.get(names) ?? []), tier]);
    }
    for (const [names, tiers] of groups) cannot.push(`${family} ${tiers.join(' ')}: no scaffold for ${names}`);
  }
  return {
    cannot: cannot.sort(),
    without: [...without].map(([id, kinds]) => `${id}: ${[...kinds].sort().join(' ')}`).sort(),
    planned, drawn: seen.size, poses,
  };
}

let walked: Walked | undefined;
const theWalk = (): Walked => (walked ??= walk(routedTestCatalogue()));

describe('the routing walk', () => {
  it('reaches every route the design names', () => {
    const genomes = routingGenomes();
    expect(genomes).toHaveLength(16 * 18 * 19 + 16 * 9 * 9);
    const routes = new Set<string>();
    const states = new Set<string>();
    for (const g of genomes) {
      const r = routeBody(g);
      const body = g['body'] as number;
      const { aquatic, airborne } = stateOf(g);
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
    // Drawn, but without the skin's back part (information, not an error): the placeholder pack draws a back part
    // for every skin on the four-legged bodies only.
    expect(w.without).toEqual([
      'crustacean/crab/medium: back/carapace-crab back/crystals-crab back/knobs-crab back/mane-crab back/plates-crab back/plume-crab back/ridge-crab',
      'crustacean/lobster/medium: back/carapace-lobster back/crystals-lobster back/knobs-lobster back/mane-lobster back/plates-lobster back/plume-lobster back/ridge-lobster',
      'fish/angler/medium: back/carapace-angler back/crystals-angler back/knobs-angler back/mane-angler back/plates-angler back/plume-angler back/ridge-angler',
      'fish/flat/medium: back/carapace-flat back/crystals-flat back/knobs-flat back/mane-flat back/plates-flat back/plume-flat back/ridge-flat',
      'fish/fusiform/medium: back/carapace-fusiform back/crystals-fusiform back/knobs-fusiform back/mane-fusiform back/plates-fusiform back/plume-fusiform back/ridge-fusiform',
      'fish/shark/medium: back/carapace-shark back/crystals-shark back/knobs-shark back/mane-shark back/plates-shark back/plume-shark back/ridge-shark',
      'fish/sturgeon/medium: back/carapace-sturgeon back/crystals-sturgeon back/knobs-sturgeon back/mane-sturgeon back/plates-sturgeon back/plume-sturgeon back/ridge-sturgeon',
      'gelatinous/body/medium: back/ridge-body',
      'insect/beetle/medium: back/carapace-beetle back/crystals-beetle back/knobs-beetle back/mane-beetle back/plates-beetle back/plume-beetle back/ridge-beetle',
      'insect/generic/medium: back/carapace-generic back/crystals-generic back/knobs-generic back/mane-generic back/plates-generic back/plume-generic back/ridge-generic',
      'insect/mantis/medium: back/carapace-mantis back/crystals-mantis back/knobs-mantis back/mane-mantis back/plates-mantis back/plume-mantis back/ridge-mantis',
      'serpent/snake/medium: back/ridge-snake',
      'serpent/viper/medium: back/ridge-viper',
      'tentacled/cuttlefish/medium: back/carapace-cuttlefish back/knobs-cuttlefish back/plume-cuttlefish back/ridge-cuttlefish',
      'tentacled/octopus/medium: back/carapace-octopus back/knobs-octopus back/plume-octopus back/ridge-octopus',
      'tentacled/squid/medium: back/carapace-squid back/knobs-squid back/plume-squid back/ridge-squid',
    ]);
    // 126 body, state and shape cases have a medium scaffold, each walked over 720 gene sets; the distinct part sets
    // among them are drawn in all seven poses.
    expect([w.planned, w.drawn, w.poses]).toEqual([126 * 720, 14802, 14802 * 7]);
  });

  it('a missing t0 tail is reported on the creature that asks for it', () => {
    const cat = routedTestCatalogue();
    const parts = new Map(cat.parts);
    expect(parts.delete('quadruped/tail/t0/medium/v0')).toBe(true);
    // The sturdy body on land only.
    const sturdy = (g: Genome): boolean => g['body'] === 0 && !stateOf(g).aquatic && !stateOf(g).airborne;
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
});

interface Entry { label: string; genome: Genome; pose: string; hash: string; gaps: string[]; contact: [number, number] | null }
const FIXTURE: { entries: Entry[] } = JSON.parse(readFileSync(new URL('../../../fixtures/art/quadruped-v1.json', import.meta.url), 'utf8'));

/**
 * The parts the design adds to a four-legged animal whose routing does not change: the stub tail where the tail gene
 * is 0, two sensory pits where there are no eyes, a horn by head kind or trait (the hornlet on a tusked body), and
 * sails on an airborne body.
 */
const ADDED: readonly RegExp[] = [
  /^quadruped\/tail\/t0\//, /^quadruped\/eyes\/pit\//, /^quadruped\/headFeature\/(horns|hornlet)-h\d\//, /^quadruped\/nearWings\/sails(-[a-z]+)?\//,
];
const sameAs = (p: RecipePart): string => `${p.slot} ${p.index} ${p.partId}`;

describe('unchanged animals keep their pictures', () => {
  it('every recorded creature whose animal is unchanged composes its recorded hash on the routed path, with the design\'s additions held back', () => {
    const live = testCatalogue();
    const cat = routedTestCatalogue();
    let compared = 0;
    let skinned = 0;
    const added = new Set<string>();
    for (const e of FIXTURE.entries) {
      if (e.gaps.some((gap) => gap.startsWith('fallback:'))) continue;
      const liveRecipe = buildRecipe(e.genome, [], live);
      // The same family, torso type and tier on both paths.
      if (buildRoutedRecipe(e.genome, [], cat).scaffoldId !== liveRecipe.scaffoldId) continue;
      compared++;
      const where = `${e.label} ${e.pose}`;
      // Held back: the bulk step (the live builder's seeded torso variant is passed as the step), the skin, and each
      // part the design adds. The iris ramp comes from the theme on the routed path, but no hash reads a ramp.
      const variant = /\/v(\d)$/.exec(liveRecipe.parts.find((p) => p.slot === 'torso')!.partId)![1];
      const routed = buildRoutedRecipe(e.genome, [], cat, { bulk: Number(variant) as 0 | 1 | 2 });
      const asked = new Set(liveRecipe.parts.map(sameAs));
      const kept = routed.parts.filter((p) => asked.has(sameAs(p)));
      // Every part the live builder draws, the routed builder draws, with the same marks, in the same order...
      expect(kept, where).toEqual(liveRecipe.parts);
      // ...and every other part it draws is one the design adds.
      for (const p of routed.parts.filter((q) => !asked.has(sameAs(q)))) {
        expect(ADDED.some((re) => re.test(p.partId)), `${where}: ${p.partId}`).toBe(true);
        added.add(p.partId.split('/').slice(1, 3).join('/').replace(/-h\d$/, '-h<n>'));
      }
      const held = { ...routed, skin: null, parts: kept };
      const out = compose(held, e.pose, cat);
      expect([out.hash, out.contact], where).toEqual([e.hash, e.contact]);
      // Planted fault: with the skin kept, the same comparison fails.
      if (compose({ ...held, skin: routed.skin }, e.pose, cat).hash !== e.hash) skinned++;
    }
    // 173 recorded entries compose a real creature; 94 of them change animal (the armored body is now a crustacean,
    // and an aquatic habitat makes a fish), so 79 are compared.
    expect(compared).toBe(79);
    expect(skinned).toBeGreaterThan(0);
    expect([...added].sort()).toEqual(['eyes/pit', 'headFeature/hornlet-h<n>', 'headFeature/horns-h<n>', 'nearWings/sails', 'nearWings/sails-stilt', 'tail/t0']);
  });
});
