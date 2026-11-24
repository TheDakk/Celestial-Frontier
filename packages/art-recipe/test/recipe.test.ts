import { describe, expect, it } from 'vitest';
import { DRAW_ORDER, IRIS_RAMP_COUNT, MARK_SLOTS, parseCatalogueText, partId } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import { makeGenome } from '@cf/domain-genome';
import { bodyOf, buildRecipe, buildSpeciesRecipe, RENDERER_VERSION, type Recipe } from '../src/recipe';
import { resolveBody } from '../src/route';
import { artStream, identityKey, pick } from '../src/streams';

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';
const partText = (id: string): string => `part ${id}\nframe rest anchor=0,0\n1\n`;
const SCAFFOLD = 'scaffold quadruped/sturdy/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n';

const catalogueOf = (ids: readonly string[]): Catalogue =>
  parseCatalogueText(HEADER + ids.map(partText).join('\n') + '\n' + SCAFFOLD);

const q = (slot: SlotName, kind: string, variant: number): string => partId('quadruped', slot, kind, 'medium', variant);
// A genome that resolves to quadruped/sturdy on land, medium, head 1 (no horn), tail 2, skin slick and wet (no back part).
const base = { kingdom: 'fauna', body: 0, loco: 0, habitat: 0, size: 2, head: 1, tail: 2, limbs: 0, eyes: 0, skin: 3, color: 3, accent: 5, pattern: 2, lumin: false };
const LIMB_SLOTS: readonly SlotName[] = ['farLimbs', 'nearLimbs'];

// Every id the base family can need, all variants, every leg role, up to 8 limbs and 8 eyes.
const fullIds = (): string[] => {
  const ids: string[] = [];
  for (let v = 0; v < 3; v++) { ids.push(q('torso', 'sturdy', v), q('head', 'h1', v)); }
  for (let v = 0; v < 2; v++) { ids.push(q('tail', 't2', v)); }
  for (let v = 0; v < 2; v++) for (const slot of LIMB_SLOTS) for (const kind of ['fore', 'hind', 'mid']) ids.push(q(slot, kind, v));
  ids.push(q('eyes', 'eye', 0));
  return ids;
};
/** Each limb part as `<slot><index> <kind>`, in recipe order. */
const limbKinds = (r: { parts: readonly { slot: SlotName; index: number; partId: string }[] }): string[] =>
  r.parts.filter((p) => LIMB_SLOTS.includes(p.slot)).map((p) => `${p.slot}${p.index} ${p.partId.split('/')[2]}`);
const full = catalogueOf(fullIds());
const slots = (r: { parts: readonly { slot: SlotName }[] }): SlotName[] => r.parts.map((p) => p.slot);

describe('buildRecipe', () => {
  it('is deeply equal and JSON-plain on repeat calls', () => {
    const a = buildRecipe(base, ['x', 'y'], full);
    const b = buildRecipe(base, ['x', 'y'], full);
    expect(a).toEqual(b);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(a.version).toBe(RENDERER_VERSION);
    expect(a.identity).toBe(identityKey(base, ['x', 'y']));
  });

  it('changing the eyes gene changes only the number of eye parts, never the slots filled elsewhere', () => {
    // The identity covers every gene, so a changed gene reseeds every stream: variant picks may differ.
    // What must hold is that the eye count follows the gene and nothing else about the layout moves.
    const one = buildRecipe({ ...base, eyes: 4 }, [], full);
    const two = buildRecipe({ ...base, eyes: 0 }, [], full);
    expect(one.parts.filter((p) => p.slot === 'eyes')).toHaveLength(1);
    expect(two.parts.filter((p) => p.slot === 'eyes')).toHaveLength(2);
    expect(slots(one).filter((s) => s !== 'eyes')).toEqual(slots(two).filter((s) => s !== 'eyes'));
  });

  it('draws every stream whether or not it is used: removing eye parts from the catalogue leaves all else equal', () => {
    const noEyes = catalogueOf(fullIds().filter((id) => !id.includes('/eyes/')));
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const g = { ...base, seed, eyes: 0 };
      const a = buildRecipe(g, [], full);
      const b = buildRecipe(g, [], noEyes);
      expect(b.parts).toEqual(a.parts.filter((p) => p.slot !== 'eyes'));
      expect(b.shift).toEqual(a.shift);
      expect(b.marking).toEqual(a.marking);
    }
  });

  it('carries the leg count', () => {
    expect(buildRecipe({ ...base, limbs: 0 }, [], full).legs).toBe(2);
    expect(buildRecipe({ ...base, limbs: 3 }, [], full).legs).toBe(8);
    expect(buildRecipe({ ...base, limbs: 5 }, [], full).legs).toBe(0);
    expect(buildRecipe({ kingdom: 'flora', size: 2 }, [], full).legs).toBe(0);
  });

  it('carries the eye count: the eyes gene\'s count, 0 for the two pits and for a body that asks for no eye', () => {
    expect([0, 1, 2, 3, 4, 5].map((eyes) => buildRecipe({ ...base, eyes }, [], full).eyes)).toEqual([2, 4, 6, 8, 1, 0]);
    // The eyeless head draws the two pits, whatever the eyes gene.
    expect(buildRecipe({ ...base, head: 2, eyes: 3 }, [], full).eyes).toBe(0);
    expect(buildRecipe({ kingdom: 'flora', size: 2 }, [], full).eyes).toBe(0);
    // The count is the body's, not the number of eye parts the pack happened to hold.
    expect(buildRecipe({ ...base, eyes: 3 }, [], catalogueOf([])).eyes).toBe(8);
  });

  it('three limbs give one far and two near (far0 fore, near0 fore, near1 hind); none give no limb parts', () => {
    const three = buildRecipe({ ...base, limbs: 4 }, [], full);
    expect(limbKinds(three)).toEqual(['farLimbs0 fore', 'nearLimbs0 fore', 'nearLimbs1 hind']);
    const none = buildRecipe({ ...base, limbs: 5 }, [], full);
    expect(slots(none).filter((s) => s === 'farLimbs' || s === 'nearLimbs')).toEqual([]);
  });

  it('asks for the leg roles by index at 2, 4 and 6 legs, end to end', () => {
    expect(limbKinds(buildRecipe({ ...base, limbs: 0 }, [], full))).toEqual(['farLimbs0 hind', 'nearLimbs0 hind']);
    expect(limbKinds(buildRecipe({ ...base, limbs: 1 }, [], full))).toEqual(['farLimbs0 fore', 'farLimbs1 hind', 'nearLimbs0 fore', 'nearLimbs1 hind']);
    expect(limbKinds(buildRecipe({ ...base, limbs: 2 }, [], full))).toEqual([
      'farLimbs0 fore', 'farLimbs1 hind', 'farLimbs2 mid', 'nearLimbs0 fore', 'nearLimbs1 hind', 'nearLimbs2 mid',
    ]);
    for (const limbs of [0, 1, 2, 4, 5]) expect(buildRecipe({ ...base, limbs }, [], full).gaps.filter((g) => !g.startsWith('variant:')), `limbs ${limbs}`).toEqual([]);
  });

  it('shares one limb style across all limbs, whatever their role', () => {
    const r = buildRecipe({ ...base, limbs: 3 }, [], full);
    const variants = new Set(r.parts.filter((p) => p.slot.endsWith('Limbs')).map((p) => p.partId.slice(-2)));
    expect(variants.size).toBe(1);
    expect(new Set(r.parts.filter((p) => p.slot.endsWith('Limbs')).map((p) => p.partId.split('/')[2]))).toEqual(new Set(['fore', 'hind', 'mid']));
  });

  it('asks for fore, hind and mid legs, the skin\'s back part and the torso\'s head feature', () => {
    // A tusked torso (body 10) with plated skin (4) and eight legs.
    const g = { ...base, body: 10, skin: 4, limbs: 3, eyes: 4 };
    const ids = [q('torso', 'tusked', 0), q('head', 'h1', 0), q('tail', 't2', 0), q('eyes', 'eye', 0), q('back', 'plates-tusked', 0), q('headFeature', 'tusks-h1', 0), q('headFeature', 'hornlet-h1', 0)];
    for (const slot of LIMB_SLOTS) for (const kind of ['fore', 'hind', 'mid']) ids.push(q(slot, kind, 0));
    const r = buildRecipe(g, [], catalogueOf(ids));
    expect(limbKinds(r)).toEqual([
      'farLimbs0 fore', 'farLimbs1 hind', 'farLimbs2 mid', 'farLimbs3 mid', 'nearLimbs0 fore', 'nearLimbs1 hind', 'nearLimbs2 mid', 'nearLimbs3 mid',
    ]);
    expect(r.parts.filter((p) => p.slot === 'back').map((p) => p.partId)).toEqual(['quadruped/back/plates-tusked/medium/v0']);
    expect(r.parts.filter((p) => p.slot === 'headFeature').map((p) => p.partId)).toEqual(['quadruped/headFeature/tusks-h1/medium/v0', 'quadruped/headFeature/hornlet-h1/medium/v0']);
    expect([...new Set(slots(r))]).toEqual(['farLimbs', 'tail', 'torso', 'back', 'nearLimbs', 'head', 'headFeature', 'eyes']);
    // The same creature on an empty catalogue: each missing back part and head feature is one missing: gap at v0.
    const bare = buildRecipe(g, [], catalogueOf([]));
    expect(bare.gaps).toContain('missing:quadruped/back/plates-tusked/medium/v0');
    expect(bare.gaps).toContain('missing:quadruped/headFeature/tusks-h1/medium/v0');
    expect(bare.gaps).toContain('missing:quadruped/headFeature/hornlet-h1/medium/v0');
  });

  it('a missing role falls back to the shared leg with a role: gap', () => {
    const ids = fullIds().filter((id) => !id.includes('Limbs/')).concat([q('farLimbs', 'leg', 0), q('nearLimbs', 'leg', 0), q('farLimbs', 'leg', 1), q('nearLimbs', 'leg', 1)]);
    const r = buildRecipe({ ...base, limbs: 0 }, [], catalogueOf(ids));
    expect(limbKinds(r)).toEqual(['farLimbs0 leg', 'nearLimbs0 leg']);
    expect(r.gaps).toEqual([`role:${q('farLimbs', 'hind', 0)}`, `role:${q('nearLimbs', 'hind', 0)}`]);
  });

  it('a family whose one shape is `body` asks for its back part as <back>-body', () => {
    const r = buildRecipe({ ...base, body: 9, skin: 1 }, [], full);
    expect(r.gaps).toContain(`missing:${partId('gelatinous', 'back', 'mane-body', 'medium', 0)}`);
  });

  it('falls back to variant 0 with a variant: gap when the torso variant (the bulk step, normal by default) or the picked tail variant is missing', () => {
    const ids = fullIds().filter((id) => !(id.includes('/torso/') || id.includes('/tail/')) || id.endsWith('/v0'));
    const cat = catalogueOf(ids);
    const seen = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const g = { ...base, seed };
      const r = buildRecipe(g, [], cat);
      const tail = pick(artStream(identityKey(g, []), 'tail-variant', RENDERER_VERSION), 2);
      expect(r.parts.find((p) => p.slot === 'torso')!.partId).toBe(q('torso', 'sturdy', 0));
      expect(r.parts.find((p) => p.slot === 'tail')!.partId).toBe(q('tail', 't2', 0));
      // The torso is asked for at the default bulk step, v1, which this pack lacks.
      const expected = [...(tail === 0 ? [] : [`variant:${q('tail', 't2', tail)}`]), `variant:${q('torso', 'sturdy', 1)}`];
      expect(r.gaps.filter((g2) => !g2.includes('Limbs/') && !g2.includes('/head/')), `seed ${seed}`).toEqual(expected);
      for (const gap of expected) seen.add(gap.split('/')[1]!);
    }
    expect([...seen].sort()).toEqual(['tail', 'torso']);
  });

  it('gives every marked part its own offset and rolls, and a plain creature none', () => {
    const g = { ...base, limbs: 3, eyes: 4, seed: 7 };
    const r = buildRecipe(g, [], full);
    const stream = (name: string): (() => number) => artStream(identityKey(g, []), name, RENDERER_VERSION);
    const marked = r.parts.filter((p) => MARK_SLOTS.includes(p.slot));
    expect(marked.length).toBe(11); // 4 far, tail, torso, 4 near, head
    for (const p of marked) {
      const spots = stream(`mark-spots-${p.slot}-${p.index}`);
      expect(p.mark, `${p.slot}${p.index}`).toEqual({ offset: pick(stream(`mark-offset-${p.slot}-${p.index}`), 15), rolls: Array.from({ length: 15 }, () => pick(spots, 100)) });
    }
    expect(r.parts.filter((p) => p.slot === 'eyes').every((p) => !('mark' in p))).toBe(true);
    // A fallback-found part still gets its mark: the head is found at v0 after its picked variant is missing.
    const v0Heads = catalogueOf(fullIds().filter((id) => !id.includes('/head/') || id.endsWith('/v0')));
    let fellBack = 0;
    for (let seed = 0; seed < 20; seed++) {
      const h = buildRecipe({ ...g, seed }, [], v0Heads);
      if (!h.gaps.some((gap) => gap.startsWith(`variant:${q('head', 'h1', 0).slice(0, -3)}`))) continue;
      fellBack++;
      expect(h.parts.find((p) => p.slot === 'head')!.mark).toBeDefined();
    }
    expect(fellBack).toBeGreaterThan(0);
    // Plain: no part carries a mark key at all.
    const plain = buildRecipe({ ...g, pattern: 0 }, [], full);
    expect(plain.parts.length).toBe(r.parts.length);
    expect(plain.parts.filter((p) => 'mark' in p)).toEqual([]);
  });

  it('asks for two sensory pits and no eye for the eyeless head, whatever the eyes gene', () => {
    for (const eyes of [0, 1, 2, 3, 4]) {
      const r = buildRecipe({ ...base, head: 2, eyes }, [], catalogueOf([]));
      expect(r.gaps.filter((gap) => gap.includes('/eyes/')), `eyes ${eyes}`).toEqual([`missing:${q('eyes', 'pit', 0)}`, `missing:${q('eyes', 'pit', 0)}`]);
      expect(buildRecipe({ ...base, head: 2, eyes }, [], full).parts.filter((p) => p.slot === 'eyes'), `eyes ${eyes}`).toEqual([]);
    }
    expect(slots(buildRecipe({ ...base, head: 3, eyes: 3 }, [], full)).filter((s) => s === 'eyes')).toHaveLength(8);
  });

  it('asks for the stub tail t0 for tail gene 0 (7 wraps to it)', () => {
    const withStub = catalogueOf([...fullIds(), q('tail', 't0', 0)]);
    for (const tail of [0, 7]) {
      expect(buildRecipe({ ...base, tail }, [], withStub).parts.find((p) => p.slot === 'tail')?.partId, `tail ${tail}`).toBe(q('tail', 't0', 0));
      expect(buildRecipe({ ...base, tail }, [], full).gaps, `tail ${tail}`).toContain(`missing:${q('tail', 't0', 0)}`);
    }
    expect(slots(buildRecipe(base, [], full))).toContain('tail');
  });

  it('orders parts by DRAW_ORDER then index', () => {
    const r = buildRecipe({ ...base, limbs: 3, eyes: 0 }, [], full);
    const keys = r.parts.map((p) => DRAW_ORDER.indexOf(p.slot) * 100 + p.index);
    expect(keys).toEqual([...keys].sort((x, y) => x - y));
    expect(r.parts.every((p) => p.source === 'own')).toBe(true);
  });

  it('falls back to variant 0 with a gap when the picked head variant is missing', () => {
    const ids = fullIds().filter((id) => !id.includes('/head/') || id.endsWith('/v0'));
    const cat = catalogueOf(ids);
    let hit = 0;
    for (let seed = 0; seed < 60 && hit < 2; seed++) {
      const g = { ...base, seed };
      const picked = pick(artStream(identityKey(g, []), 'head-variant', RENDERER_VERSION), 3);
      const r = buildRecipe(g, [], cat);
      const head = r.parts.find((p) => p.slot === 'head')!;
      expect(head.partId).toBe(q('head', 'h1', 0));
      if (picked === 0) expect(r.gaps).toEqual([]);
      else { expect(r.gaps).toEqual([`variant:${q('head', 'h1', picked)}`]); hit++; }
    }
    expect(hit).toBe(2);
  });

  it('omits every part of an empty catalogue with one missing gap per slot', () => {
    const r = buildRecipe({ ...base, limbs: 4, eyes: 4 }, [], catalogueOf([]));
    expect(r.parts).toEqual([]);
    // far0, tail, torso, near0, near1, head, eye0
    expect(r.gaps).toEqual([
      `missing:${q('farLimbs', 'leg', 0)}`, `missing:${q('tail', 't2', 0)}`, `missing:${q('torso', 'sturdy', 0)}`,
      `missing:${q('nearLimbs', 'leg', 0)}`, `missing:${q('nearLimbs', 'leg', 0)}`,
      `missing:${q('head', 'h1', 0)}`, `missing:${q('eyes', 'eye', 0)}`,
    ]);
  });

  it('names scaffold, ramps, marking and glow', () => {
    const g = { ...base, lumin: true };
    const r = buildRecipe(g, [], full);
    expect(r.scaffoldId).toBe('quadruped/sturdy/medium');
    // Habitat 0 is the venom theme, iris5.
    expect(r.ramps).toEqual({ primary: 'c3', accent: 'c5', underside: 'c3-under', iris: 'iris5' });
    expect(r.marking.pattern).toBe(2);
    expect(r.glow).toBe(true);
    for (const n of [...r.shift.head, ...r.shift.tail]) expect([-1, 0, 1]).toContain(n);
  });

  it('marking is pattern, full strength and a phase from its own stream', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const g = { ...base, seed };
      const r = buildRecipe(g, [], full);
      expect(Object.keys(r.marking)).toEqual(['pattern', 'strength', 'phase']);
      expect(r.marking).toEqual({ pattern: 2, strength: 2, phase: pick(artStream(identityKey(g, []), 'mark-phase', RENDERER_VERSION), 15) });
      seen.add(r.marking.phase);
    }
    expect(seen.size).toBe(15);
  });

  it('uses the kind body and a body scaffold for the jelly, whose one shape is body', () => {
    const r = buildRecipe({ ...base, body: 9 }, [], full);
    expect(r.scaffoldId).toBe('gelatinous/body/medium');
    expect(r.gaps).toContain(`missing:${partId('gelatinous', 'torso', 'body', 'medium', 0)}`);
  });

  it('builds a Guardian or Titan (marked by apex) at the guardian tier, with a guardian scaffold', () => {
    const r = buildRecipe({ ...base, apex: 12 }, [], full);
    expect([r.tier, r.scaffoldId]).toEqual(['guardian', 'quadruped/sturdy/guardian']);
    expect(buildRecipe(base, [], full).tier).toBe('medium');
  });

  it('returns a frozen recipe; mutation cannot reach the next build', () => {
    const r = buildRecipe(base, [], full);
    expect(() => { (r.parts as unknown as { slot: SlotName }[])[0]!.slot = 'glow'; }).toThrow();
    expect(() => { (r.shift.head as unknown as number[])[0] = 9; }).toThrow();
    expect(Object.isFrozen(r) && Object.isFrozen(r.parts) && Object.isFrozen(r.gaps)).toBe(true);
    expect(buildRecipe(base, [], full)).toEqual(r);
  });
});

describe('buildRecipe: the animal and the routed fields', () => {
  /** Holds every part id, so each part comes back at the variant asked for. */
  const every: Catalogue = { ...catalogueOf([]), parts: { has: () => true } as unknown as Catalogue['parts'] };

  it('draws a creature by its animal', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const g = { ...base, body: 1, seed };
      const r = buildRecipe(g, [], every);
      const b = bodyOf(g);
      expect(['crustacean/crab/medium', 'crustacean/lobster/medium']).toContain(r.scaffoldId);
      expect(r.scaffoldId, `seed ${seed}`).toBe(`crustacean/${b.torso}/medium`);
      expect([r.family, r.tier, r.legs], `seed ${seed}`).toEqual(['crustacean', 'medium', 0]);
      expect(r.parts.find((p) => p.slot === 'torso')!.partId.split('/')[2]).toBe(b.torso);
      seen.add(r.scaffoldId);
    }
    expect(seen.size).toBe(2);
    expect(buildRecipe({ ...base, body: 4 }, [], every).scaffoldId).toMatch(/^serpent\/(snake|viper)\/medium$/);
    expect(buildRecipe({ ...base, body: 9 }, [], every).scaffoldId).toBe('gelatinous/body/medium');
    expect(buildRecipe({ kingdom: 'flora', size: 2 }, [], every).scaffoldId).toBe('flora/body/medium');
  });

  /**
   * The current game's choice of shape (its `_procFamily(G, seed)`), by the name of each of its lines: with s2, s3 and s4
   * the seed's remainder by 2, 3 and 4, `s2 ? first : second` for a pair and the list's item at s3 or s4 otherwise. The
   * seed is the one its portrait passes, `(g.seed ^ 0x9A11) >>> 0`.
   */
  const gameShape = (g: { seed: number; body: number; loco: number }): string => {
    const seed = (g.seed ^ 0x9A11) >>> 0;
    const s3 = seed % 3, s2 = seed % 2, s4 = seed % 4;
    if (g.body === 4) return s2 ? 'snake' : 'viper';
    if (g.body === 9) return 'body';
    if (g.body === 15) return ['anemone', 'urchin', 'coral', 'cucumber'][s4]!;
    if (g.body === 3) return ['octopus', 'squid', 'cuttlefish'][s3]!;
    if (g.body === 5) return ['beetle', 'generic', 'mantis'][s3]!;
    if (g.body === 1) return s2 ? 'crab' : 'lobster';
    if (g.loco !== 4) throw new Error('not a body with more than one shape');
    if (g.body === 13) return 'flat';
    if ([6, 8, 10, 11].includes(g.body)) return s2 ? 'fusiform' : 'sturgeon';
    return ['fusiform', 'shark', 'flat', 'angler'][s4]!;
  };
  // Seeds as makeGenome takes them, and unsigned 32-bit seeds as a cross gives its child (past 2^31, where `^` goes negative).
  const SHAPE_SEEDS = [...Array.from({ length: 240 }, (_, i) => i + 1), 0x7fffffff, 0x80000000, 0x80000001, 0x80000002, 0x80000003, 0xfffffffe, 0xffffffff, 3735928559];

  it('the shape is the one the current game gives the seed', () => {
    const seen = new Set<string>();
    // On land the six bodies with their own animal; swimming (movement 4), a plain fish, a squat one and the four that keep something.
    const states = [...[1, 3, 4, 5, 9, 15].map((body) => ({ body, loco: 0 })), ...[0, 2, 12, 13, 6, 8, 10, 11].map((body) => ({ body, loco: 4 }))];
    for (const state of states) {
      for (const seed of SHAPE_SEEDS) {
        const g = { ...base, ...state, seed };
        const want = gameShape(g);
        expect(bodyOf(g).torso, `body ${state.body} movement ${state.loco} seed ${seed}`).toBe(want);
        expect(buildRecipe(g, [], every).scaffoldId.split('/')[1], `recipe: body ${state.body} movement ${state.loco} seed ${seed}`).toBe(want);
        seen.add(`${state.body}/${want}`);
      }
    }
    // Every shape of every list was met: 2 + 3 + 2 + 3 + 1 + 4 on land, and 4 + 4 + 4 + 1 + 2 + 2 + 2 + 2 swimming.
    expect(seen.size).toBe(36);
    // A genome without a seed is drawn as the game draws it: `undefined ^ 0x9A11` is 0x9A11, an odd number.
    expect(bodyOf({ ...base, body: 1 }).torso).toBe('crab');
    expect(bodyOf({ ...base, body: 15 }).torso).toBe(['anemone', 'urchin', 'coral', 'cucumber'][0x9A11 % 4]);
  });

  it('a change of any gene that does not choose the animal leaves the shape as it was, and so does the lineage', () => {
    // The genes the game's choice reads: the body, where it lives and how it moves (aquatic or not), and the seed.
    const CHOOSING = ['seed', 'kingdom', 'body', 'habitat', 'loco', 'x', 'aq', 'af'];
    let changed = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const g = makeGenome(seed, 'fauna', 1) as unknown as Record<string, unknown>;
      const shape = bodyOf(g).torso;
      expect(buildRecipe(g, ['a', 'b'], every).scaffoldId, `seed ${seed} lineage`).toBe(buildRecipe(g, [], every).scaffoldId);
      for (const gene of Object.keys(g)) {
        if (CHOOSING.includes(gene)) continue;
        const was = g[gene];
        const other = typeof was === 'number' ? was + 1 : typeof was === 'boolean' ? !was : typeof was === 'string' ? `${was}x` : 1;
        expect(bodyOf({ ...g, [gene]: other }).torso, `seed ${seed} gene ${gene}`).toBe(shape);
        changed++;
      }
      // A gene the genome did not have (a mark the game adds later) changes nothing either.
      expect(bodyOf({ ...g, par: 9 }).torso, `seed ${seed} gene par`).toBe(shape);
    }
    expect(changed).toBeGreaterThan(2000);
  });

  it('carries the body\'s opacity, airborne state, theme and skin, and the neutral rim', () => {
    const jelly = buildRecipe({ ...base, body: 9 }, [], every);
    expect([jelly.opacity, jelly.airborne, jelly.theme, jelly.rim, jelly.skin]).toEqual([82, false, 'venom', 0, 3]);
    const glider = buildRecipe({ ...base, loco: 3, skin: 7 }, [], every);
    expect([glider.opacity, glider.airborne]).toEqual([66, true]);
  });

  it('rim is 0 without glow, 75 on a glowing crystalline body or a fish keeping crystals, else 50', () => {
    const rim = (g: Record<string, unknown>): number => buildRecipe({ ...base, ...g }, [], every).rim;
    // Body 8 on land is the crystalline torso; with movement 4 (swimmers) it is a fish that keeps crystals.
    expect(bodyOf({ ...base, body: 8 }).torso).toBe('crystalline');
    expect(bodyOf({ ...base, body: 8, loco: 4 }).keeps).toBe('crystals');
    for (const g of [{ body: 8 }, { body: 8, loco: 4 }]) {
      expect(rim({ ...g, lumin: true }), JSON.stringify(g)).toBe(75);
      expect(rim({ ...g, lumin: false }), JSON.stringify(g)).toBe(0);
    }
    // Every other body (eight): a four-legged body, a fish keeping a shell, a crustacean, a serpent, a jelly, a radial, a winged
    // body, a shelled four-legged body.
    for (const g of [{ body: 0 }, { body: 6, loco: 4 }, { body: 1 }, { body: 4 }, { body: 9 }, { body: 15 }, { body: 7 }, { body: 6 }]) {
      expect(rim({ ...g, lumin: true }), JSON.stringify(g)).toBe(50);
      expect(rim({ ...g, lumin: false }), JSON.stringify(g)).toBe(0);
    }
    // Outside fauna there is no theme to light the rim with, so a glowing plant has none.
    for (const kingdom of ['flora', 'fungi', 'microbe']) expect(buildRecipe({ kingdom, size: 2, lumin: true }, [], every).rim, kingdom).toBe(0);
  });

  it('the routed skin is the gene, and null on a radial and on a species', () => {
    // Body 0 a four-legged creature, 1 a crustacean, 4 a serpent, 9 a jelly, 15 a radial; skin genes 0 to 8, and 9 wraps to 0.
    for (let skin = 0; skin <= 9; skin++) {
      for (const body of [0, 1, 4, 9]) expect(buildRecipe({ ...base, body, skin }, [], every).skin, `body ${body} skin ${skin}`).toBe(skin % 9);
      expect(buildRecipe({ ...base, body: 15, skin }, [], every).skin, `radial skin ${skin}`).toBeNull();
      expect(buildRecipe({ ...base, body: 15, skin }, [], every).family).toBe('radial');
    }
    // Outside fauna there is no skin gene to draw.
    for (const kingdom of ['flora', 'fungi', 'microbe']) expect(buildRecipe({ kingdom, size: 2, skin: 2 }, [], every).skin, kingdom).toBeNull();
    const species = parseCatalogueText(`${HEADER}${partText(q('torso', 'civet', 0))}\n${SCAFFOLD}\nscaffold quadruped/civet/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n\nspecies civet quadruped medium legs=0 eyes=0 iris=0 tail=0\n`);
    expect(buildSpeciesRecipe('civet', species).skin).toBeNull();
  });

  it('is deeply equal on repeat calls, JSON-plain and frozen', () => {
    const g = { ...base, body: 5, seed: 3 };
    const r = buildRecipe(g, ['x'], every);
    expect(buildRecipe(g, ['x'], every)).toEqual(r);
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
    expect(Object.isFrozen(r) && Object.isFrozen(r.parts) && Object.isFrozen(r.parts[0])).toBe(true);
    expect(r.identity).toBe(identityKey(g, ['x']));
  });

  it('every creature-wide stream is drawn from its own name: the shifts, the phase and the head, tail and limb variants', () => {
    // Taking the shape from the seed (and the torso variant from the bulk step) moves no stream's draw.
    let compared = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const g = makeGenome(seed, 'fauna', 1) as unknown as Record<string, unknown>;
      const r = buildRecipe(g, [], every);
      const drawn = (name: string, n: number): number => pick(artStream(identityKey(g, []), name, RENDERER_VERSION), n);
      expect([r.shift, r.marking.phase], `seed ${seed}`).toEqual([
        { head: [drawn('shift-head-x', 3) - 1, drawn('shift-head-y', 3) - 1], tail: [drawn('shift-tail-x', 3) - 1, drawn('shift-tail-y', 3) - 1] },
        drawn('mark-phase', 15),
      ]);
      for (const p of r.parts) {
        const v = Number(p.partId.slice(p.partId.lastIndexOf('/v') + 2));
        // A flipper, and every part outside the head, tail and leg slots, is asked for at v0 (the torso at the bulk step).
        if (p.slot === 'head') expect(v, `seed ${seed} head`).toBe(drawn('head-variant', 3));
        else if (p.slot === 'tail') expect(v, `seed ${seed} tail`).toBe(drawn('tail-variant', 2));
        else if (p.slot.endsWith('Limbs') && !p.partId.includes('/flipper')) expect(v, `seed ${seed} ${p.slot}${p.index}`).toBe(drawn('limb-style', 2));
        else continue;
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(500);
  });

  it('the routed iris follows the theme, not the stream', () => {
    const streamIris = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const fire = buildRecipe({ ...base, habitat: 9, seed }, [], every);
      expect([fire.theme, fire.ramps.iris], `seed ${seed}`).toEqual(['fire', 'iris0']);
      const swimmer = buildRecipe({ ...base, habitat: 9, loco: 4, seed }, [], every);
      expect([swimmer.theme, swimmer.ramps.iris], `seed ${seed}`).toEqual(['tide', 'iris3']);
      streamIris.add(`iris${pick(artStream(identityKey({ ...base, habitat: 9, seed }, []), 'iris', RENDERER_VERSION), IRIS_RAMP_COUNT)}`);
    }
    // The stream would have given other ramps for these seeds, so the theme and not the stream decides.
    expect(streamIris.size).toBeGreaterThan(4);
    for (const kingdom of ['flora', 'fungi', 'microbe']) {
      const r = buildRecipe({ kingdom, size: 2, habitat: 9, seed: 7 }, [], every);
      expect([r.theme, r.ramps.iris], kingdom).toEqual([null, 'iris0']);
    }
  });

  it('the bulk step chooses the torso variant', () => {
    // `full` holds torso v0 to v2 and every leg part at v0 and v1.
    for (let seed = 1; seed <= 30; seed++) {
      const g = { ...base, limbs: 4, seed };
      const steps = ([0, 1, 2] as const).map((bulk) => buildRecipe(g, [], full, { bulk }));
      expect(steps.map((r) => r.parts.find((p) => p.slot === 'torso')!.partId), `seed ${seed}`)
        .toEqual([q('torso', 'sturdy', 0), q('torso', 'sturdy', 1), q('torso', 'sturdy', 2)]);
      const limbs = steps.map((r) => r.parts.filter((p) => LIMB_SLOTS.includes(p.slot)));
      expect(limbs[0]!.length, `seed ${seed}`).toBeGreaterThan(0);
      expect(limbs[1], `seed ${seed}`).toEqual(limbs[0]);
      expect(limbs[2], `seed ${seed}`).toEqual(limbs[0]);
    }
  });

  it('a heavy torso the pack lacks falls back to normal, then to lean, with one variant: gap for the heavy id', () => {
    const torsoGaps = (r: Recipe): string[] => r.gaps.filter((gap) => gap.includes('/torso/'));
    const without = (...variants: number[]): Catalogue => catalogueOf(fullIds().filter((id) => !variants.some((v) => id === q('torso', 'sturdy', v))));
    for (let seed = 1; seed <= 10; seed++) {
      const g = { ...base, limbs: 4, seed };
      // v0 and v1 held: heavy draws normal
      const normal = buildRecipe(g, [], without(2), { bulk: 2 });
      expect(normal.parts.find((p) => p.slot === 'torso')!.partId, `seed ${seed}`).toBe(q('torso', 'sturdy', 1));
      expect(torsoGaps(normal), `seed ${seed}`).toEqual([`variant:${q('torso', 'sturdy', 2)}`]);
      // v0 only: heavy draws lean, still one gap naming v2
      const lean = buildRecipe(g, [], without(1, 2), { bulk: 2 });
      expect(lean.parts.find((p) => p.slot === 'torso')!.partId, `seed ${seed}`).toBe(q('torso', 'sturdy', 0));
      expect(torsoGaps(lean), `seed ${seed}`).toEqual([`variant:${q('torso', 'sturdy', 2)}`]);
      // normal and lean are as before: normal falls back to lean; lean has no fallback
      expect(buildRecipe(g, [], without(1), { bulk: 1 }).parts.find((p) => p.slot === 'torso')!.partId).toBe(q('torso', 'sturdy', 0));
      expect(torsoGaps(buildRecipe(g, [], without(1), { bulk: 1 }))).toEqual([`variant:${q('torso', 'sturdy', 1)}`]);
      expect(torsoGaps(buildRecipe(g, [], without(0, 1, 2), { bulk: 0 }))).toEqual([`missing:${q('torso', 'sturdy', 0)}`]);
      expect(torsoGaps(buildRecipe(g, [], without(0, 1, 2), { bulk: 2 }))).toEqual([`missing:${q('torso', 'sturdy', 0)}`]);
    }
  });

  it('the default is normal', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = { ...base, limbs: 4, seed };
      const r = buildRecipe(g, [], full);
      expect(r, `seed ${seed}`).toEqual(buildRecipe(g, [], full, { bulk: 1 }));
      expect(r.parts.find((p) => p.slot === 'torso')!.partId).toBe(q('torso', 'sturdy', 1));
    }
  });

  it('bulk 3 and -1 throw, and a condition that is not an object throws the same error, not a TypeError', () => {
    for (const bulk of [3, -1, 1.5]) {
      expect(() => buildRecipe(base, [], full, { bulk } as unknown as { bulk: 0 }), `${bulk}`).toThrow(`bad bulk step ${bulk}`);
    }
    for (const condition of [null, 1, 'heavy']) {
      expect(() => buildRecipe(base, [], full, condition as unknown as { bulk: 0 }), String(condition)).toThrow(`bad bulk step ${String(condition)}`);
    }
    // An undefined condition is the default, normal.
    expect(buildRecipe(base, [], full, undefined)).toEqual(buildRecipe(base, [], full, { bulk: 1 }));
  });

  it('the torso-build stream is still drawn; every other stream-derived value is the same with and without a bulk step', () => {
    // Whatever the seeded torso variant would have been, only the torso part follows the bulk step.
    const withoutTorso = (r: Recipe): unknown => ({ ...r, parts: r.parts.filter((p) => p.slot !== 'torso') });
    const torsoMark = (r: Recipe): unknown => r.parts.find((p) => p.slot === 'torso')?.mark;
    let seededDiffers = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const g = makeGenome(seed, 'fauna', 1) as unknown as Record<string, unknown>;
      const plain = buildRecipe(g, [], every);
      for (const bulk of [0, 1, 2] as const) {
        const r = buildRecipe(g, [], every, { bulk });
        expect(withoutTorso(r), `seed ${seed} bulk ${bulk}`).toEqual(withoutTorso(plain));
        expect(torsoMark(r), `seed ${seed} bulk ${bulk}`).toEqual(torsoMark(plain));
        const torso = r.parts.find((p) => p.slot === 'torso');
        if (torso !== undefined) expect(torso.partId.endsWith(`/v${bulk}`), `seed ${seed} bulk ${bulk}`).toBe(true);
      }
      const seeded = pick(artStream(identityKey(g, []), 'torso-build', RENDERER_VERSION), 3);
      if (seeded !== 1) seededDiffers++;
    }
    // The seeded draw would have chosen another variant for many of these creatures, so the bulk step decides.
    expect(seededDiffers).toBeGreaterThan(50);
  });

  it('a pack with only torso v0 draws v0 at every bulk step, with a variant gap', () => {
    const ids = fullIds().filter((id) => !id.startsWith(q('torso', 'sturdy', 1).slice(0, -2)) || id.endsWith('/v0'));
    const onlyV0 = catalogueOf(ids);
    expect(buildRecipe(base, [], onlyV0, { bulk: 0 }).gaps.filter((x) => x.startsWith('variant:'))).toEqual([]);
    for (const bulk of [1, 2] as const) {
      const r = buildRecipe(base, [], onlyV0, { bulk });
      expect(r.parts.find((p) => p.slot === 'torso')!.partId, `bulk ${bulk}`).toBe(q('torso', 'sturdy', 0));
      expect(r.gaps, `bulk ${bulk}`).toContain(`variant:${q('torso', 'sturdy', bulk)}`);
    }
  });

  it('a named species carries the neutral routed fields', () => {
    const neutral = { opacity: 100, airborne: false, theme: null, rim: 0, skin: null };
    const species = parseCatalogueText(`${HEADER}${partText(q('torso', 'civet', 0))}\n${SCAFFOLD}\nscaffold quadruped/civet/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n\nspecies civet quadruped medium legs=0 eyes=0 iris=0 tail=0\n`);
    expect(buildSpeciesRecipe('civet', species)).toMatchObject(neutral);
  });
});
