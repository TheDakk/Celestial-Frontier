import { describe, expect, it } from 'vitest';
import { DRAW_ORDER, MARK_SLOTS, parseCatalogueText, partId } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import { makeGenome } from '@cf/domain-genome';
import { bodyOf, buildRecipe, buildRoutedRecipe, buildSpeciesRecipe, RENDERER_VERSION } from '../src/recipe';
import { resolveBody } from '../src/route';
import { artStream, identityKey, pick } from '../src/streams';

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';
const partText = (id: string): string => `part ${id}\nframe rest anchor=0,0\n1\n`;
const SCAFFOLD = 'scaffold quadruped/sturdy/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n';

const catalogueOf = (ids: readonly string[]): Catalogue =>
  parseCatalogueText(HEADER + ids.map(partText).join('\n') + '\n' + SCAFFOLD);

const q = (slot: SlotName, kind: string, variant: number): string => partId('quadruped', slot, kind, 'medium', variant);
// A genome that resolves to quadruped/sturdy, medium, head 3, tail 2, skin slick and wet (no back part).
const base = { kingdom: 'fauna', body: 0, loco: 0, size: 2, head: 3, tail: 2, limbs: 0, eyes: 0, skin: 3, color: 3, accent: 5, pattern: 2, lumin: false };
const LIMB_SLOTS: readonly SlotName[] = ['farLimbs', 'nearLimbs'];

// Every id the base family can need, all variants, every leg role, up to 8 limbs and 8 eyes.
const fullIds = (): string[] => {
  const ids: string[] = [];
  for (let v = 0; v < 3; v++) { ids.push(q('torso', 'sturdy', v), q('head', 'h3', v)); }
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
    const ids = [q('torso', 'tusked', 0), q('head', 'h3', 0), q('tail', 't2', 0), q('eyes', 'eye', 0), q('back', 'plates-tusked', 0), q('headFeature', 'tusks-h3', 0)];
    for (const slot of LIMB_SLOTS) for (const kind of ['fore', 'hind', 'mid']) ids.push(q(slot, kind, 0));
    const r = buildRecipe(g, [], catalogueOf(ids));
    expect(limbKinds(r)).toEqual([
      'farLimbs0 fore', 'farLimbs1 hind', 'farLimbs2 mid', 'farLimbs3 mid', 'nearLimbs0 fore', 'nearLimbs1 hind', 'nearLimbs2 mid', 'nearLimbs3 mid',
    ]);
    expect(r.parts.filter((p) => p.slot === 'back').map((p) => p.partId)).toEqual(['quadruped/back/plates-tusked/medium/v0']);
    expect(r.parts.filter((p) => p.slot === 'headFeature').map((p) => p.partId)).toEqual(['quadruped/headFeature/tusks-h3/medium/v0']);
    expect([...new Set(slots(r))]).toEqual(['farLimbs', 'tail', 'torso', 'back', 'nearLimbs', 'head', 'headFeature', 'eyes']);
    // The same creature on an empty catalogue: each missing back part and head feature is one missing: gap at v0.
    const bare = buildRecipe(g, [], catalogueOf([]));
    expect(bare.gaps).toContain('missing:quadruped/back/plates-tusked/medium/v0');
    expect(bare.gaps).toContain('missing:quadruped/headFeature/tusks-h3/medium/v0');
  });

  it('a missing role falls back to the shared leg with a role: gap', () => {
    const ids = fullIds().filter((id) => !id.includes('Limbs/')).concat([q('farLimbs', 'leg', 0), q('nearLimbs', 'leg', 0), q('farLimbs', 'leg', 1), q('nearLimbs', 'leg', 1)]);
    const r = buildRecipe({ ...base, limbs: 0 }, [], catalogueOf(ids));
    expect(limbKinds(r)).toEqual(['farLimbs0 leg', 'nearLimbs0 leg']);
    expect(r.gaps).toEqual([`role:${q('farLimbs', 'hind', 0)}`, `role:${q('nearLimbs', 'hind', 0)}`]);
  });

  it('a family with no torso type asks for its back part as <back>-body', () => {
    const r = buildRecipe({ ...base, body: 3, skin: 1 }, [], full);
    expect(r.gaps).toContain(`missing:${partId('tentacled', 'back', 'mane-body', 'medium', 0)}`);
  });

  it('falls back to variant 0 with a variant: gap when the picked torso or tail variant is missing', () => {
    const ids = fullIds().filter((id) => !(id.includes('/torso/') || id.includes('/tail/')) || id.endsWith('/v0'));
    const cat = catalogueOf(ids);
    const seen = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const g = { ...base, seed };
      const r = buildRecipe(g, [], cat);
      const torso = pick(artStream(identityKey(g, []), 'torso-build', RENDERER_VERSION), 3);
      const tail = pick(artStream(identityKey(g, []), 'tail-variant', RENDERER_VERSION), 2);
      expect(r.parts.find((p) => p.slot === 'torso')!.partId).toBe(q('torso', 'sturdy', 0));
      expect(r.parts.find((p) => p.slot === 'tail')!.partId).toBe(q('tail', 't2', 0));
      const expected = [...(tail === 0 ? [] : [`variant:${q('tail', 't2', tail)}`]), ...(torso === 0 ? [] : [`variant:${q('torso', 'sturdy', torso)}`])];
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
      if (!h.gaps.some((gap) => gap.startsWith(`variant:${q('head', 'h3', 0).slice(0, -3)}`))) continue;
      fellBack++;
      expect(h.parts.find((p) => p.slot === 'head')!.mark).toBeDefined();
    }
    expect(fellBack).toBeGreaterThan(0);
    // Plain: no part carries a mark key at all.
    const plain = buildRecipe({ ...g, pattern: 0 }, [], full);
    expect(plain.parts.length).toBe(r.parts.length);
    expect(plain.parts.filter((p) => 'mark' in p)).toEqual([]);
  });

  it('asks for no eye part and records no eye gap for the eyeless head, whatever the eyes gene', () => {
    for (const eyes of [0, 1, 2, 3, 4]) {
      const r = buildRecipe({ ...base, head: 2, eyes }, [], catalogueOf([]));
      expect(r.gaps.filter((gap) => gap.includes('/eyes/')), `eyes ${eyes}`).toEqual([]);
      expect(slots(buildRecipe({ ...base, head: 2, eyes }, [], full)), `eyes ${eyes}`).not.toContain('eyes');
    }
    expect(slots(buildRecipe({ ...base, head: 3, eyes: 3 }, [], full)).filter((s) => s === 'eyes')).toHaveLength(8);
  });

  it('adds no tail for tail gene 0', () => {
    expect(slots(buildRecipe({ ...base, tail: 0 }, [], full))).not.toContain('tail');
    expect(slots(buildRecipe({ ...base, tail: 7 }, [], full))).not.toContain('tail');
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
      expect(head.partId).toBe(q('head', 'h3', 0));
      if (picked === 0) expect(r.gaps).toEqual([]);
      else { expect(r.gaps).toEqual([`variant:${q('head', 'h3', picked)}`]); hit++; }
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
      `missing:${q('head', 'h3', 0)}`, `missing:${q('eyes', 'eye', 0)}`,
    ]);
  });

  it('picks an iris ramp from its own stream', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const g = { ...base, seed };
      const r = buildRecipe(g, [], catalogueOf(fullIds()));
      expect(r.ramps.iris).toBe('iris' + pick(artStream(identityKey(g, []), 'iris', RENDERER_VERSION), 8));
      seen.add(r.ramps.iris);
    }
    expect([...seen].sort()).toEqual(['iris0', 'iris1', 'iris2', 'iris3', 'iris4', 'iris5', 'iris6', 'iris7']);
  });

  it('names scaffold, ramps, marking and glow', () => {
    const g = { ...base, lumin: true };
    const r = buildRecipe(g, [], full);
    expect(r.scaffoldId).toBe('quadruped/sturdy/medium');
    expect(r.ramps).toEqual({ primary: 'c3', accent: 'c5', underside: 'c3-under', iris: `iris${pick(artStream(identityKey(g, []), 'iris', RENDERER_VERSION), 8)}` });
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

  it('uses the kind body and a body scaffold for a family with no torso type', () => {
    const r = buildRecipe({ ...base, body: 3 }, [], full);
    expect(r.scaffoldId).toBe('tentacled/body/medium');
    expect(r.gaps).toContain(`missing:${partId('tentacled', 'torso', 'body', 'medium', 0)}`);
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

describe('buildRoutedRecipe', () => {
  /** Holds every part id, so each part comes back at the variant asked for. */
  const every: Catalogue = { ...catalogueOf([]), parts: { has: () => true } as unknown as Catalogue['parts'] };

  it('buildRoutedRecipe draws a creature by its animal', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const g = { ...base, body: 1, seed };
      const r = buildRoutedRecipe(g, [], every);
      const b = bodyOf(g);
      expect(['crustacean/crab/medium', 'crustacean/lobster/medium']).toContain(r.scaffoldId);
      expect(r.scaffoldId, `seed ${seed}`).toBe(`crustacean/${b.torso}/medium`);
      expect([r.family, r.tier, r.legs], `seed ${seed}`).toEqual(['crustacean', 'medium', 0]);
      expect(r.parts.find((p) => p.slot === 'torso')!.partId.split('/')[2]).toBe(b.torso);
      seen.add(r.scaffoldId);
    }
    expect(seen.size).toBe(2);
    expect(buildRoutedRecipe({ ...base, body: 4 }, [], every).scaffoldId).toMatch(/^serpent\/(snake|viper)\/medium$/);
    expect(buildRoutedRecipe({ ...base, body: 9 }, [], every).scaffoldId).toBe('gelatinous/body/medium');
    expect(buildRoutedRecipe({ kingdom: 'flora', size: 2 }, [], every).scaffoldId).toBe('flora/body/medium');
  });

  it('bodyOf picks the shape from the sub-shape stream of the creature\'s identity', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = { ...base, body: 15, seed };
      expect(bodyOf(g, ['a'])).toEqual(resolveBody(g, artStream(identityKey(g, ['a']), 'sub-shape', RENDERER_VERSION)));
    }
  });

  it('carries the body\'s opacity, airborne state and theme, and the neutral rim and skin', () => {
    const jelly = buildRoutedRecipe({ ...base, body: 9 }, [], every);
    expect([jelly.opacity, jelly.airborne, jelly.theme, jelly.rim, jelly.skin]).toEqual([82, false, 'venom', 0, null]);
    const glider = buildRoutedRecipe({ ...base, loco: 3, skin: 7 }, [], every);
    expect([glider.opacity, glider.airborne]).toEqual([66, true]);
  });

  it('is deeply equal on repeat calls, JSON-plain and frozen', () => {
    const g = { ...base, body: 5, seed: 3 };
    const r = buildRoutedRecipe(g, ['x'], every);
    expect(buildRoutedRecipe(g, ['x'], every)).toEqual(r);
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
    expect(Object.isFrozen(r) && Object.isFrozen(r.parts) && Object.isFrozen(r.parts[0])).toBe(true);
    expect(r.identity).toBe(identityKey(g, ['x']));
  });

  it('every existing stream draws what buildRecipe draws', () => {
    const variantOf = (id: string): string => id.slice(id.lastIndexOf('/') + 1);
    let compared = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const g = makeGenome(seed, 'fauna', 1) as unknown as Record<string, unknown>;
      const old = buildRecipe(g, [], every);
      const routed = buildRoutedRecipe(g, [], every);
      // The iris is the theme's (Task 8); the other ramps are the same.
      expect([routed.shift, routed.marking, { ...routed.ramps, iris: '' }], `seed ${seed}`).toEqual([old.shift, old.marking, { ...old.ramps, iris: '' }]);
      for (const p of routed.parts) {
        if (p.slot !== 'head' && p.slot !== 'tail' && !p.slot.endsWith('Limbs')) continue;
        const o = old.parts.find((x) => x.slot === p.slot && x.index === p.index);
        if (o === undefined) continue;
        // A flipper is asked for at v0 whatever the limb-variant draw, so only its mark is compared.
        const flipper = p.partId.includes('/flipper');
        expect([flipper ? '' : variantOf(p.partId), p.mark], `seed ${seed} ${p.slot}${p.index}`).toEqual([flipper ? '' : variantOf(o.partId), o.mark]);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(500);
  });

  it('the routed iris follows the theme, not the stream', () => {
    const streamIris = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const fire = buildRoutedRecipe({ ...base, habitat: 9, seed }, [], every);
      expect([fire.theme, fire.ramps.iris], `seed ${seed}`).toEqual(['fire', 'iris0']);
      const swimmer = buildRoutedRecipe({ ...base, habitat: 9, loco: 4, seed }, [], every);
      expect([swimmer.theme, swimmer.ramps.iris], `seed ${seed}`).toEqual(['tide', 'iris3']);
      streamIris.add(`iris${pick(artStream(identityKey({ ...base, habitat: 9, seed }, []), 'iris', RENDERER_VERSION), 8)}`);
    }
    // The stream would have given other ramps for these seeds, so the theme and not the stream decides.
    expect(streamIris.size).toBeGreaterThan(4);
    for (const kingdom of ['flora', 'fungi', 'microbe']) {
      const r = buildRoutedRecipe({ kingdom, size: 2, habitat: 9, seed: 7 }, [], every);
      expect([r.theme, r.ramps.iris], kingdom).toEqual([null, 'iris0']);
    }
  });

  it('buildRecipe keeps its stream iris', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const g = { ...base, habitat: 9, seed };
      const r = buildRecipe(g, [], full);
      expect([r.theme, r.ramps.iris], `seed ${seed}`).toEqual([null, `iris${pick(artStream(identityKey(g, []), 'iris', RENDERER_VERSION), 8)}`]);
      seen.add(r.ramps.iris);
    }
    expect(seen.size).toBeGreaterThan(4);
  });

  it('the bulk step chooses the torso variant', () => {
    // `full` holds torso v0 to v2 and every leg part at v0 and v1.
    for (let seed = 1; seed <= 30; seed++) {
      const g = { ...base, limbs: 4, seed };
      const steps = ([0, 1, 2] as const).map((bulk) => buildRoutedRecipe(g, [], full, { bulk }));
      expect(steps.map((r) => r.parts.find((p) => p.slot === 'torso')!.partId), `seed ${seed}`)
        .toEqual([q('torso', 'sturdy', 0), q('torso', 'sturdy', 1), q('torso', 'sturdy', 2)]);
      const limbs = steps.map((r) => r.parts.filter((p) => LIMB_SLOTS.includes(p.slot)));
      expect(limbs[0]!.length, `seed ${seed}`).toBeGreaterThan(0);
      expect(limbs[1], `seed ${seed}`).toEqual(limbs[0]);
      expect(limbs[2], `seed ${seed}`).toEqual(limbs[0]);
    }
  });

  it('the default is normal', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = { ...base, limbs: 4, seed };
      const r = buildRoutedRecipe(g, [], full);
      expect(r, `seed ${seed}`).toEqual(buildRoutedRecipe(g, [], full, { bulk: 1 }));
      expect(r.parts.find((p) => p.slot === 'torso')!.partId).toBe(q('torso', 'sturdy', 1));
    }
  });

  it('bulk 3 and -1 throw', () => {
    for (const bulk of [3, -1, 1.5]) {
      expect(() => buildRoutedRecipe(base, [], full, { bulk } as unknown as { bulk: 0 }), `${bulk}`).toThrow(`bad bulk step ${bulk}`);
    }
  });

  it('the torso-build stream is still drawn; every other stream-derived value is the same with and without a bulk step', () => {
    // Whatever the seeded torso variant would have been, only the torso part follows the bulk step.
    const withoutTorso = (r: ReturnType<typeof buildRoutedRecipe>): unknown => ({ ...r, parts: r.parts.filter((p) => p.slot !== 'torso') });
    const torsoMark = (r: ReturnType<typeof buildRoutedRecipe>): unknown => r.parts.find((p) => p.slot === 'torso')?.mark;
    let seededDiffers = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const g = makeGenome(seed, 'fauna', 1) as unknown as Record<string, unknown>;
      const plain = buildRoutedRecipe(g, [], every);
      for (const bulk of [0, 1, 2] as const) {
        const r = buildRoutedRecipe(g, [], every, { bulk });
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
    expect(buildRoutedRecipe(base, [], onlyV0, { bulk: 0 }).gaps.filter((x) => x.startsWith('variant:'))).toEqual([]);
    for (const bulk of [1, 2] as const) {
      const r = buildRoutedRecipe(base, [], onlyV0, { bulk });
      expect(r.parts.find((p) => p.slot === 'torso')!.partId, `bulk ${bulk}`).toBe(q('torso', 'sturdy', 0));
      expect(r.gaps, `bulk ${bulk}`).toContain(`variant:${q('torso', 'sturdy', bulk)}`);
    }
  });

  it('the old builders carry the neutral new fields', () => {
    const neutral = { opacity: 100, airborne: false, theme: null, rim: 0, skin: null };
    expect(buildRecipe({ ...base, body: 9, skin: 7, loco: 3 }, [], full)).toMatchObject(neutral);
    expect(buildRecipe({ kingdom: 'flora', size: 2 }, [], full)).toMatchObject(neutral);
    const species = parseCatalogueText(`${HEADER}${partText(q('torso', 'civet', 0))}\n${SCAFFOLD}\nscaffold quadruped/civet/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n\nspecies civet quadruped medium legs=0 eyes=0 iris=0 tail=0\n`);
    expect(buildSpeciesRecipe('civet', species)).toMatchObject(neutral);
  });
});
