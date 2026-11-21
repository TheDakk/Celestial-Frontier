import { describe, expect, it } from 'vitest';
import { DRAW_ORDER, parseCatalogueText, partId } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import { BACK_KIND_BY_SKIN, bodyFeatureKind, HEAD_FEATURE_BY_TORSO, limbKind, planBodyParts, planParts, WING_KINDS } from '../src/requests';
import { resolveAnatomy } from '../src/resolve';
import { resolveBody, type Body } from '../src/route';
import { RENDERER_VERSION } from '../src/recipe';
import { artStream, pick } from '../src/streams';

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';
const partText = (id: string): string => `part ${id}\nframe rest anchor=0,0\n1\n`;
const SCAFFOLD = 'scaffold quadruped/sturdy/medium origin=0,0\npose rest\nentry torso 0 rest 0 0\n';
const catalogueOf = (ids: readonly string[]): Catalogue =>
  parseCatalogueText(HEADER + ids.map(partText).join('\n') + '\n' + SCAFFOLD);

const q = (slot: SlotName, kind: string, variant: number): string => partId('quadruped', slot, kind, 'medium', variant);
// A genome that resolves to quadruped/sturdy, medium, head 3, tail 2, plain, skin slick and wet (no back part).
const base = { kingdom: 'fauna', body: 0, loco: 0, size: 2, head: 3, tail: 2, limbs: 1, eyes: 4, skin: 3, color: 3, accent: 5, pattern: 0 };
const IDENTITY = 'requests-test';
const stream = (name: string): (() => number) => artStream(IDENTITY, name, RENDERER_VERSION);
const V0 = { torso: 0, head: 0, tail: 0, limb: 0 };
const V1 = { torso: 0, head: 0, tail: 0, limb: 1 };
const LIMB_SLOTS: readonly SlotName[] = ['farLimbs', 'nearLimbs'];

/** Torso, head, tail and one eye at v0, plus the given ids. */
const withCore = (ids: readonly string[]): Catalogue =>
  catalogueOf([q('torso', 'sturdy', 0), q('head', 'h3', 0), q('tail', 't2', 0), q('eyes', 'eye', 0), ...ids]);
/** Every limb kind at both variants. */
const allLimbs = (): string[] => {
  const ids: string[] = [];
  for (const slot of LIMB_SLOTS) for (const kind of ['fore', 'hind', 'mid', 'leg']) for (let v = 0; v < 2; v++) ids.push(q(slot, kind, v));
  return ids;
};
const limbIds = (r: { parts: readonly { slot: SlotName; index: number; partId: string }[] }): string[] =>
  r.parts.filter((p) => LIMB_SLOTS.includes(p.slot)).map((p) => `${p.slot}${p.index} ${p.partId}`);

describe('limbKind', () => {
  it('is fore at 0, hind at 1 and mid at 2 and 3; hind for both legs of a pair', () => {
    expect([limbKind(0, 4), limbKind(1, 4), limbKind(2, 6), limbKind(3, 8), limbKind(0, 2), limbKind(0, 3), limbKind(1, 3)])
      .toEqual(['fore', 'hind', 'mid', 'mid', 'hind', 'fore', 'hind']);
  });
});

describe('planParts: leg roles', () => {
  it('asks for fore at 0, hind at 1 and mid at 2 and 3 on both sides of an eight-legged creature', () => {
    const r = planParts(resolveAnatomy({ ...base, limbs: 3 }), V1, stream, withCore(allLimbs()));
    expect(limbIds(r)).toEqual([
      `farLimbs0 ${q('farLimbs', 'fore', 1)}`, `farLimbs1 ${q('farLimbs', 'hind', 1)}`,
      `farLimbs2 ${q('farLimbs', 'mid', 1)}`, `farLimbs3 ${q('farLimbs', 'mid', 1)}`,
      `nearLimbs0 ${q('nearLimbs', 'fore', 1)}`, `nearLimbs1 ${q('nearLimbs', 'hind', 1)}`,
      `nearLimbs2 ${q('nearLimbs', 'mid', 1)}`, `nearLimbs3 ${q('nearLimbs', 'mid', 1)}`,
    ]);
    expect(r.gaps).toEqual([]);
  });

  it('a two-legged creature\'s pair asks for hind', () => {
    const r = planParts(resolveAnatomy({ ...base, limbs: 0 }), V1, stream, withCore(allLimbs()));
    expect(limbIds(r)).toEqual([`farLimbs0 ${q('farLimbs', 'hind', 1)}`, `nearLimbs0 ${q('nearLimbs', 'hind', 1)}`]);
  });

  it('falls back in the spec\'s order', () => {
    // A two-legged creature (one far, one near leg, both hind) with limb variant 1 chosen; far and near alike.
    const a = resolveAnatomy({ ...base, limbs: 0 });
    const both = (kind: string, v: number): string[] => LIMB_SLOTS.map((slot) => q(slot, kind, v));
    const steps: { ids: string[]; used: (slot: SlotName) => string; gaps: (slot: SlotName) => string[] }[] = [
      { ids: [...both('hind', 1), ...both('hind', 0), ...both('leg', 1), ...both('leg', 0)], used: (s) => q(s, 'hind', 1), gaps: () => [] },
      { ids: [...both('hind', 0), ...both('leg', 1), ...both('leg', 0)], used: (s) => q(s, 'hind', 0), gaps: (s) => [`variant:${q(s, 'hind', 1)}`] },
      { ids: [...both('leg', 1), ...both('leg', 0)], used: (s) => q(s, 'leg', 1), gaps: (s) => [`role:${q(s, 'hind', 0)}`] },
      { ids: [...both('leg', 0)], used: (s) => q(s, 'leg', 0), gaps: (s) => [`role:${q(s, 'hind', 0)}`, `variant:${q(s, 'leg', 1)}`] },
    ];
    steps.forEach((step, n) => {
      const r = planParts(a, V1, stream, withCore(step.ids));
      expect(limbIds(r), `step ${n + 1}`).toEqual([`farLimbs0 ${step.used('farLimbs')}`, `nearLimbs0 ${step.used('nearLimbs')}`]);
      expect(r.gaps, `step ${n + 1}`).toEqual([...step.gaps('farLimbs'), ...step.gaps('nearLimbs')]);
    });
    const none = planParts(a, V1, stream, withCore([]));
    expect(limbIds(none)).toEqual([]);
    expect(none.gaps).toEqual([`missing:${q('farLimbs', 'leg', 0)}`, `missing:${q('nearLimbs', 'leg', 0)}`]);
  });

  it('with variant 0 chosen, a missing role falls back to the shared leg with only the role gap', () => {
    const r = planParts(resolveAnatomy({ ...base, limbs: 0 }), V0, stream, withCore([q('farLimbs', 'leg', 0), q('nearLimbs', 'leg', 0)]));
    expect(limbIds(r)).toEqual([`farLimbs0 ${q('farLimbs', 'leg', 0)}`, `nearLimbs0 ${q('nearLimbs', 'leg', 0)}`]);
    expect(r.gaps).toEqual([`role:${q('farLimbs', 'hind', 0)}`, `role:${q('nearLimbs', 'hind', 0)}`]);
  });
});

describe('planParts: the legs of a build', () => {
  // body 2 is quadruped/stilt; six legs ask for fore, hind and mid on each side.
  const stilt = resolveAnatomy({ ...base, body: 2, limbs: 2 });
  const stiltCore = (ids: readonly string[]): Catalogue =>
    catalogueOf([q('torso', 'stilt', 0), q('head', 'h3', 0), q('tail', 't2', 0), q('eyes', 'eye', 0), ...allLimbs(), ...ids]);

  it('a build with its own legs draws them in place of the shared role, with no gap', () => {
    const own = LIMB_SLOTS.flatMap((slot) => ['fore', 'hind', 'mid'].map((kind) => q(slot, `${kind}-stilt`, 0)));
    const r = planParts(stilt, V0, stream, stiltCore(own));
    expect(limbIds(r)).toEqual([
      `farLimbs0 ${q('farLimbs', 'fore-stilt', 0)}`, `farLimbs1 ${q('farLimbs', 'hind-stilt', 0)}`, `farLimbs2 ${q('farLimbs', 'mid-stilt', 0)}`,
      `nearLimbs0 ${q('nearLimbs', 'fore-stilt', 0)}`, `nearLimbs1 ${q('nearLimbs', 'hind-stilt', 0)}`, `nearLimbs2 ${q('nearLimbs', 'mid-stilt', 0)}`,
    ]);
    expect(r.gaps).toEqual([]);
  });

  it('a build without its own legs draws the shared role, with no gap', () => {
    const r = planParts(stilt, V1, stream, stiltCore([]));
    expect(limbIds(r)[0]).toBe(`farLimbs0 ${q('farLimbs', 'fore', 1)}`);
    expect(r.gaps).toEqual([]);
  });

  it('one role of its own leaves the other roles shared', () => {
    const r = planParts(stilt, V0, stream, stiltCore([q('farLimbs', 'hind-stilt', 0)]));
    expect(limbIds(r).slice(0, 4)).toEqual([
      `farLimbs0 ${q('farLimbs', 'fore', 0)}`, `farLimbs1 ${q('farLimbs', 'hind-stilt', 0)}`, `farLimbs2 ${q('farLimbs', 'mid', 0)}`,
      `nearLimbs0 ${q('nearLimbs', 'fore', 0)}`,
    ]);
  });

  it('its own leg at v0 stands in for a chosen variant it lacks, with the variant gap', () => {
    const r = planParts(stilt, V1, stream, stiltCore([q('farLimbs', 'fore-stilt', 0)]));
    expect(limbIds(r)[0]).toBe(`farLimbs0 ${q('farLimbs', 'fore-stilt', 0)}`);
    expect(r.gaps).toEqual([`variant:${q('farLimbs', 'fore-stilt', 1)}`]);
  });

  it('another build never draws them', () => {
    const r = planParts(resolveAnatomy({ ...base, limbs: 2 }), V0, stream, withCore([...allLimbs(), q('farLimbs', 'fore-stilt', 0)]));
    expect(limbIds(r)[0]).toBe(`farLimbs0 ${q('farLimbs', 'fore', 0)}`);
  });
});

describe('planParts: back parts and head features', () => {
  it('asks for the skin\'s back part on the creature\'s torso type', () => {
    const r = planParts(resolveAnatomy({ ...base, skin: 4 }), V0, stream, withCore([...allLimbs(), q('back', 'plates-sturdy', 0)]));
    expect(r.parts.filter((p) => p.slot === 'back').map((p) => [p.index, p.partId])).toEqual([[0, 'quadruped/back/plates-sturdy/medium/v0']]);
    expect(r.gaps).toEqual([]);
  });

  it('skins 3 and 7 ask for none', () => {
    const backs = BACK_KIND_BY_SKIN.filter((k): k is string => k !== null).map((k) => q('back', `${k}-sturdy`, 0));
    for (const skin of [3, 7]) {
      const r = planParts(resolveAnatomy({ ...base, skin }), V0, stream, catalogueOf([]));
      expect(r.gaps.filter((g) => g.includes('/back/')), `skin ${skin}`).toEqual([]);
      expect(planParts(resolveAnatomy({ ...base, skin }), V0, stream, withCore([...allLimbs(), ...backs])).parts.map((p) => p.slot), `skin ${skin}`).not.toContain('back');
    }
  });

  it('a missing back part is one missing: gap and changes no other part', () => {
    const cat = withCore(allLimbs());
    const without = planParts(resolveAnatomy({ ...base, skin: 0 }), V1, stream, cat);
    const none = planParts(resolveAnatomy({ ...base, skin: 3 }), V1, stream, cat);
    expect(without.gaps).toEqual([`missing:${q('back', 'ridge-sturdy', 0)}`]);
    expect(without.parts).toEqual(none.parts);
  });

  it('tusked and horned torsos ask for tusks and horns on the creature\'s head kind', () => {
    const tusked = resolveAnatomy({ ...base, body: 10, head: 8 });
    const tCat = catalogueOf([q('torso', 'tusked', 0), q('head', 'h8', 0), q('headFeature', 'tusks-h8', 0)]);
    expect(planParts(tusked, V0, stream, tCat).parts.filter((p) => p.slot === 'headFeature').map((p) => p.partId))
      .toEqual(['quadruped/headFeature/tusks-h8/medium/v0']);
    const horned = resolveAnatomy({ ...base, body: 11, head: 8 });
    const hCat = catalogueOf([q('torso', 'horned', 0), q('head', 'h8', 0), q('headFeature', 'horns-h8', 0)]);
    expect(planParts(horned, V0, stream, hCat).parts.filter((p) => p.slot === 'headFeature').map((p) => p.partId))
      .toEqual(['quadruped/headFeature/horns-h8/medium/v0']);
    expect(planParts(horned, V0, stream, catalogueOf([])).gaps).toContain(`missing:${q('headFeature', 'horns-h8', 0)}`);
  });

  it('asks for back parts and head features at variant 0 whatever variants are chosen', () => {
    const a = resolveAnatomy({ ...base, body: 10, head: 3, skin: 4 });
    const cat = catalogueOf([q('torso', 'tusked', 2), q('head', 'h3', 2), q('tail', 't2', 1), q('eyes', 'eye', 0), q('back', 'plates-tusked', 0), q('headFeature', 'tusks-h3', 0)]);
    const r = planParts(a, { torso: 2, head: 2, tail: 1, limb: 1 }, stream, cat);
    expect(r.parts.filter((p) => p.slot === 'back' || p.slot === 'headFeature').map((p) => p.partId))
      .toEqual([q('back', 'plates-tusked', 0), q('headFeature', 'tusks-h3', 0)]);
    expect(r.gaps.filter((g) => !g.includes('Limbs/'))).toEqual([]);
  });

  it('a sturdy torso asks for none', () => {
    const r = planParts(resolveAnatomy(base), V0, stream, catalogueOf([]));
    expect(r.gaps.filter((g) => g.includes('/headFeature/'))).toEqual([]);
    expect(Object.keys(HEAD_FEATURE_BY_TORSO)).toEqual(['tusked', 'horned']);
  });

  it('asks for nothing outside fauna', () => {
    for (const kingdom of ['flora', 'fungi', 'microbe']) {
      expect(planParts(resolveAnatomy({ ...base, kingdom, skin: 4, pattern: 2 }), V0, stream, catalogueOf([]))).toEqual({ parts: [], gaps: [] });
    }
  });
});

describe('planParts: marks', () => {
  const everything = (): Catalogue => withCore([...allLimbs(), q('back', 'plates-sturdy', 0)]);

  it('plain gives no part a mark', () => {
    const r = planParts(resolveAnatomy({ ...base, skin: 4, limbs: 3 }), V0, stream, everything());
    expect(r.parts.length).toBeGreaterThan(0);
    expect(r.parts.filter((p) => 'mark' in p)).toEqual([]);
  });

  it('a patterned creature marks torso, head, tail and every limb, and never eyes, back or head feature', () => {
    const tusked = resolveAnatomy({ ...base, body: 10, head: 3, skin: 4, limbs: 3, pattern: 2 });
    const cat = catalogueOf([...allLimbs(), q('torso', 'tusked', 0), q('head', 'h3', 0), q('tail', 't2', 0), q('eyes', 'eye', 0), q('back', 'plates-tusked', 0), q('headFeature', 'tusks-h3', 0)]);
    const r = planParts(tusked, V0, stream, cat);
    expect(r.gaps).toEqual([]);
    const marked = r.parts.filter((p) => p.mark !== undefined).map((p) => p.slot);
    const unmarked = r.parts.filter((p) => p.mark === undefined).map((p) => p.slot);
    expect(new Set(marked)).toEqual(new Set(['farLimbs', 'tail', 'torso', 'nearLimbs', 'head']));
    expect(marked.filter((s) => s.endsWith('Limbs'))).toHaveLength(8);
    expect(new Set(unmarked)).toEqual(new Set(['back', 'headFeature', 'eyes']));
    expect(r.parts.filter((p) => p.slot === 'eyes').every((p) => !('mark' in p))).toBe(true);
  });

  it('offset is 0-14 and rolls are 15 values 0-99, each from its own named stream', () => {
    const r = planParts(resolveAnatomy({ ...base, limbs: 3, pattern: 5 }), V0, stream, everything());
    const marked = r.parts.filter((p) => p.mark !== undefined);
    expect(marked.length).toBe(11); // 4 far, tail, torso, 4 near, head
    for (const p of marked) {
      const spots = stream(`mark-spots-${p.slot}-${p.index}`);
      const rolls = Array.from({ length: 15 }, () => pick(spots, 100));
      expect(p.mark, `${p.slot}${p.index}`).toEqual({ offset: pick(stream(`mark-offset-${p.slot}-${p.index}`), 15), rolls });
      expect(p.mark!.offset >= 0 && p.mark!.offset < 15).toBe(true);
      expect(p.mark!.rolls).toHaveLength(15);
      expect(p.mark!.rolls.every((n) => Number.isInteger(n) && n >= 0 && n < 100)).toBe(true);
    }
  });

  it('two near legs that share one part id get different rolls, and near 0 differs from far 0', () => {
    const r = planParts(resolveAnatomy({ ...base, limbs: 3, pattern: 1 }), V0, stream, withCore([q('farLimbs', 'leg', 0), q('nearLimbs', 'leg', 0)]));
    const near = r.parts.filter((p) => p.slot === 'nearLimbs');
    const far0 = r.parts.find((p) => p.slot === 'farLimbs' && p.index === 0)!;
    expect(near[2]!.partId).toBe(near[3]!.partId);
    expect(near[2]!.mark!.rolls).not.toEqual(near[3]!.mark!.rolls);
    expect(near[0]!.mark!.rolls).not.toEqual(far0.mark!.rolls);
  });
});

describe('planParts: order', () => {
  it('orders parts by DRAW_ORDER then index', () => {
    const a = resolveAnatomy({ ...base, body: 10, head: 3, skin: 4, limbs: 3, eyes: 3, pattern: 2 });
    const cat = catalogueOf([...allLimbs(), q('torso', 'tusked', 0), q('head', 'h3', 0), q('tail', 't2', 0), q('eyes', 'eye', 0), q('back', 'plates-tusked', 0), q('headFeature', 'tusks-h3', 0)]);
    const r = planParts(a, V0, stream, cat);
    const keys = r.parts.map((p) => DRAW_ORDER.indexOf(p.slot) * 100 + p.index);
    expect(keys).toEqual([...keys].sort((x, y) => x - y));
    expect([...new Set(r.parts.map((p) => p.slot))]).toEqual(['farLimbs', 'tail', 'torso', 'back', 'nearLimbs', 'head', 'headFeature', 'eyes']);
    expect(r.parts.every((p) => p.source === 'own')).toBe(true);
  });
});

describe('planBodyParts', () => {
  /** A fixed stream that picks shape `i` of `n`. */
  const at = (i: number, n: number) => (): number => (2 * i + 1) / (2 * n);
  /** Land, medium, head 5, tail 3, limbs gene 3 (8 legs), eyes gene 1 (4 eyes), skin 3 (no back part), plain. */
  const land = { kingdom: 'fauna', loco: 0, habitat: 0, size: 2, head: 5, tail: 3, limbs: 3, eyes: 1, skin: 3, color: 3, accent: 5, pattern: 0 };
  const body = (genes: Record<string, unknown>, shape = 0, of = 1): Body => resolveBody({ ...land, ...genes }, at(shape, of));
  /** A catalogue that holds every part id except a build's own legs, so each part comes back exactly as asked for. */
  const shared = (): Catalogue => ({ ...catalogueOf([]), parts: { has: (id: string) => !/Limbs\/[a-z]+-/.test(id) } as unknown as Catalogue['parts'] });
  const asked = (b: Body, v = V0): string[] => {
    const r = planBodyParts(b, v, stream, shared());
    expect(r.gaps).toEqual([]);
    return r.parts.map((p) => p.partId);
  };
  const id = (family: string, slot: SlotName, kind: string): string => partId(family, slot, kind, 'medium', 0);
  const legs = (family: string, kinds: readonly string[]): string[][] =>
    [kinds.map((k) => id(family, 'farLimbs', k)), kinds.map((k) => id(family, 'nearLimbs', k))];
  const eyes = (family: string, n: number, kind = 'eye'): string[] => Array.from({ length: n }, () => id(family, 'eyes', kind));

  it('asks for exactly the genes table\'s parts, family by family', () => {
    const [far8, near8] = legs('quadruped', ['fore', 'hind', 'mid', 'mid']);
    const [far6, near6] = legs('insect', ['fore', 'hind', 'mid']);
    const rows: readonly (readonly [string, Body, readonly string[]])[] = [
      ['quadruped sturdy', body({ body: 0 }), [...far8!, id('quadruped', 'tail', 't3'), id('quadruped', 'torso', 'sturdy'), ...near8!, id('quadruped', 'head', 'h5'), ...eyes('quadruped', 4)]],
      ['quadruped tusked', body({ body: 10, limbs: 5 }), [id('quadruped', 'tail', 't3'), id('quadruped', 'torso', 'tusked'), id('quadruped', 'head', 'h5'), id('quadruped', 'headFeature', 'tusks-h5'), ...eyes('quadruped', 4)]],
      ...['fusiform', 'shark', 'flat', 'angler'].map((shape, i) => [`fish ${shape}`, body({ body: 0, loco: 4 }, i, 4),
        [id('fish', 'tail', 't3'), id('fish', 'torso', shape), id('fish', 'head', 'h5'), ...eyes('fish', 4)]] as const),
      ['crustacean crab', body({ body: 1 }, 0, 2), [id('crustacean', 'tail', 't3'), id('crustacean', 'torso', 'crab'), id('crustacean', 'head', 'h5')]],
      ['crustacean lobster', body({ body: 1 }, 1, 2), [id('crustacean', 'tail', 't3'), id('crustacean', 'torso', 'lobster'), id('crustacean', 'head', 'h5'), ...eyes('crustacean', 4)]],
      ...['octopus', 'squid', 'cuttlefish'].map((shape, i) => [`tentacled ${shape} tail 1`, body({ body: 3, tail: 1 }, i, 3), [id('tentacled', 'torso', shape)]] as const),
      ['tentacled octopus tail 3', body({ body: 3 }, 0, 3), [id('tentacled', 'tail', 't3'), id('tentacled', 'torso', 'octopus')]],
      ...['snake', 'viper'].map((shape, i) => [`serpent ${shape}`, body({ body: 4 }, i, 2), [id('serpent', 'torso', shape), id('serpent', 'eyes', 'eye')]] as const),
      ...['beetle', 'generic', 'mantis'].map((shape, i) => [`insect ${shape}`, body({ body: 5 }, i, 3),
        [...far6!, id('insect', 'torso', shape), ...near6!, id('insect', 'head', 'h5'), ...eyes('insect', 4)]] as const),
      ['gelatinous body', body({ body: 9 }), [id('gelatinous', 'torso', 'body')]],
      ...['anemone', 'urchin', 'coral', 'cucumber'].map((shape, i) => [`radial ${shape} skin 4`, body({ body: 15, skin: 4 }, i, 4), [id('radial', 'torso', shape)]] as const),
      ['fish skin 4', body({ body: 0, loco: 4, skin: 4 }, 0, 4), [id('fish', 'tail', 't3'), id('fish', 'torso', 'fusiform'), id('fish', 'back', 'plates-fusiform'), id('fish', 'head', 'h5'), ...eyes('fish', 4)]],
      ['quadruped skin 4', body({ body: 0, limbs: 5, skin: 4 }), [id('quadruped', 'tail', 't3'), id('quadruped', 'torso', 'sturdy'), id('quadruped', 'back', 'plates-sturdy'), id('quadruped', 'head', 'h5'), ...eyes('quadruped', 4)]],
    ];
    for (const [label, b, ids] of rows) expect(asked(b), label).toEqual(ids);
    expect(body({ body: 4 }, 0, 2).torso).toBe('snake');
  });

  it('a serpent\'s eye is placed on its torso; every other eye on the head', () => {
    const serpent = planBodyParts(body({ body: 4 }, 0, 2), V0, stream, shared()).parts.filter((p) => p.slot === 'eyes');
    expect(serpent.map((p) => [p.index, p.at])).toEqual([[0, { host: 'torso', point: 'eye0' }]]);
    for (const genes of [{ body: 0 }, { body: 0, eyes: 5 }, { body: 5 }, { body: 0, loco: 4 }]) {
      const r = planBodyParts(body(genes), V0, stream, shared());
      expect(r.parts.filter((p) => p.slot === 'eyes').length, JSON.stringify(genes)).toBeGreaterThan(0);
      expect(r.parts.filter((p) => 'at' in p), JSON.stringify(genes)).toEqual([]);
    }
  });

  it('a quadruped with tail gene 0 asks for t0', () => {
    expect(asked(body({ body: 0, tail: 0 }))).toContain(id('quadruped', 'tail', 't0'));
  });

  it('a fish with tail gene 0 or 1 asks for no tail', () => {
    for (const tail of [0, 1]) expect(asked(body({ body: 0, loco: 4, tail })).filter((p) => p.includes('/tail/')), `tail ${tail}`).toEqual([]);
  });

  it('no eyes or the eyeless head asks for two pits', () => {
    const pits = (b: Body): string[] => planBodyParts(b, V0, stream, shared()).parts.filter((p) => p.slot === 'eyes').map((p) => `${p.index} ${p.partId}`);
    const two = ['0 quadruped/eyes/pit/medium/v0', '1 quadruped/eyes/pit/medium/v0'];
    expect(pits(body({ body: 0, eyes: 5 }))).toEqual(two);
    expect(pits(body({ body: 0, head: 2, eyes: 1 }))).toEqual(two);
    expect(pits(body({ body: 1, eyes: 5 }, 0, 2))).toEqual([]);
    expect(planBodyParts(body({ body: 0, eyes: 5 }), V0, stream, catalogueOf([])).gaps)
      .toEqual(expect.arrayContaining(['missing:quadruped/eyes/pit/medium/v0']));
  });

  it('asks for the torso, head, tail and legs at the chosen variants and marks the mark slots', () => {
    const b = body({ body: 5, pattern: 3 }, 1, 3);
    const r = planBodyParts(b, { torso: 2, head: 1, tail: 1, limb: 1 }, stream, shared());
    expect(r.parts.filter((p) => p.slot === 'torso' || p.slot === 'head' || p.slot.endsWith('Limbs')).map((p) => p.partId.slice(-2)))
      .toEqual(['v1', 'v1', 'v1', 'v2', 'v1', 'v1', 'v1', 'v1']);
    expect(new Set(r.parts.filter((p) => p.mark !== undefined).map((p) => p.slot))).toEqual(new Set(['farLimbs', 'torso', 'nearLimbs', 'head']));
    expect(r.parts.filter((p) => p.slot === 'eyes').every((p) => !('mark' in p))).toBe(true);
    const keys = r.parts.map((p) => DRAW_ORDER.indexOf(p.slot) * 100 + p.index);
    expect(keys).toEqual([...keys].sort((x, y) => x - y));
  });

  it('a build\'s own legs come first', () => {
    const cat = catalogueOf([partId('insect', 'farLimbs', 'fore-mantis', 'medium', 0)]);
    const r = planBodyParts(body({ body: 5 }, 2, 3), V0, stream, cat);
    expect(r.parts.map((p) => p.partId)).toEqual([partId('insect', 'farLimbs', 'fore-mantis', 'medium', 0)]);
  });

  it('asks for nothing outside fauna', () => {
    for (const kingdom of ['flora', 'fungi', 'microbe']) {
      expect(planBodyParts(body({ kingdom, skin: 4, pattern: 2 }), V0, stream, shared()), kingdom).toEqual({ parts: [], gaps: [] });
    }
  });

  describe('wings and body features', () => {
    /** A catalogue that holds every part id except those `skip` matches. */
    const holding = (skip: RegExp = /^$/): Catalogue => ({ ...catalogueOf([]), parts: { has: (x: string) => !skip.test(x) } as unknown as Catalogue['parts'] });
    const plan = (b: Body, cat: Catalogue = holding()): ReturnType<typeof planBodyParts> => planBodyParts(b, V0, stream, cat);
    /** `<slot><index> <part id>` for every part in the given slots. */
    const inSlots = (r: ReturnType<typeof planBodyParts>, slots: readonly SlotName[]): string[] =>
      r.parts.filter((p) => slots.includes(p.slot)).map((p) => `${p.slot}${p.index} ${p.partId}`);
    const WINGS: readonly SlotName[] = ['farWings', 'nearWings'];
    const LIMBS: readonly SlotName[] = ['farLimbs', 'nearLimbs'];
    const legRole = /\/(fore|hind|mid|leg)(-[a-z]+)?\//;

    it('a membranous body on land has one pair of wings and its legs', () => {
      const b = body({ body: 7, limbs: 1 });
      const r = plan(b);
      expect(r.gaps).toEqual([]);
      expect(inSlots(r, WINGS)).toEqual(['farWings0 quadruped/farWings/wing-membranous/medium/v0', 'nearWings0 quadruped/nearWings/wing-membranous/medium/v0']);
      expect(inSlots(r, LIMBS).map((s) => s.split('/')[2])).toEqual(['fore-membranous', 'hind-membranous', 'fore-membranous', 'hind-membranous']);
      expect(plan(b, catalogueOf([])).gaps).toEqual(expect.arrayContaining(
        ['missing:quadruped/farWings/wing-membranous/medium/v0', 'missing:quadruped/nearWings/wing-membranous/medium/v0']));
    });

    it('a four-winged body has a wing and a hindwing on each side', () => {
      expect(inSlots(plan(body({ body: 14 })), WINGS)).toEqual([
        'farWings0 quadruped/farWings/wing-fourwinged/medium/v0', 'farWings1 quadruped/farWings/hindwing-fourwinged/medium/v0',
        'nearWings0 quadruped/nearWings/wing-fourwinged/medium/v0', 'nearWings1 quadruped/nearWings/hindwing-fourwinged/medium/v0',
      ]);
    });

    it('airborne, a winged body stands on two legs and keeps its wings', () => {
      const r = plan(body({ body: 7, loco: 3, limbs: 3 }));
      expect(inSlots(r, LIMBS)).toEqual(['farLimbs0 quadruped/farLimbs/hind-membranous/medium/v0', 'nearLimbs0 quadruped/nearLimbs/hind-membranous/medium/v0']);
      expect(inSlots(r, WINGS)).toHaveLength(2);
    });

    it('aquatic, a winged body has flippers, fins and its wings, and no legs', () => {
      const b = body({ body: 14, loco: 4 });
      expect([b.family, b.aquatic, b.limbs]).toEqual(['quadruped', true, 0]);
      const own = plan(b);
      expect(own.gaps).toEqual([]);
      expect(inSlots(own, LIMBS)).toEqual(['nearLimbs0 quadruped/nearLimbs/flipper-fourwinged/medium/v0', 'nearLimbs1 quadruped/nearLimbs/flipper-fourwinged/medium/v0']);
      expect(inSlots(own, ['bodyFeature'])).toEqual(['bodyFeature0 quadruped/bodyFeature/fins-fourwinged/medium/v0']);
      expect(inSlots(own, WINGS)).toHaveLength(4);
      expect(own.parts.filter((p) => legRole.test(p.partId))).toEqual([]);
      const sharedFlipper = plan(b, holding(/flipper-/));
      expect(sharedFlipper.gaps).toEqual([]);
      expect(inSlots(sharedFlipper, LIMBS)).toEqual(['nearLimbs0 quadruped/nearLimbs/flipper/medium/v0', 'nearLimbs1 quadruped/nearLimbs/flipper/medium/v0']);
      const none = plan(b, holding(/flipper/));
      expect(none.gaps).toEqual(['missing:quadruped/nearLimbs/flipper/medium/v0', 'missing:quadruped/nearLimbs/flipper/medium/v0']);
      expect(inSlots(none, LIMBS)).toEqual([]);
    });

    it('an airborne sturdy body has sails on its back and its legs', () => {
      const b = body({ body: 0, loco: 3, limbs: 1 });
      expect([b.family, b.torso, b.airborne]).toEqual(['quadruped', 'sturdy', true]);
      const own = plan(b);
      expect(own.gaps).toEqual([]);
      expect(inSlots(own, WINGS)).toEqual(['nearWings0 quadruped/nearWings/sails-sturdy/medium/v0']);
      expect(own.parts.find((p) => p.slot === 'nearWings')!.at).toEqual({ host: 'torso', point: 'back' });
      expect(inSlots(own, LIMBS)).toHaveLength(4);
      const sharedSails = plan(b, holding(/sails-/));
      expect(sharedSails.gaps).toEqual([]);
      expect(inSlots(sharedSails, WINGS)).toEqual(['nearWings0 quadruped/nearWings/sails/medium/v0']);
      expect(sharedSails.parts.find((p) => p.slot === 'nearWings')!.at).toEqual({ host: 'torso', point: 'back' });
      const none = plan(b, holding(/sails/));
      expect(none.gaps).toEqual(['missing:quadruped/nearWings/sails/medium/v0']);
      expect(inSlots(none, WINGS)).toEqual([]);
      // On land no sails.
      expect(inSlots(plan(body({ body: 0 })), WINGS)).toEqual([]);
    });

    it('an aquatic sturdy body is a fish and has no sails', () => {
      const b = body({ body: 0, loco: 3, habitat: 10 });
      expect([b.family, b.aquatic, b.airborne]).toEqual(['fish', true, true]);
      expect(inSlots(plan(b), [...WINGS, 'bodyFeature'])).toEqual([]);
    });

    it('shelled and crystalline bodies carry their feature on land', () => {
      expect(inSlots(plan(body({ body: 6 })), ['bodyFeature'])).toEqual(['bodyFeature0 quadruped/bodyFeature/shell-shelled/medium/v0']);
      expect(inSlots(plan(body({ body: 8 })), ['bodyFeature'])).toEqual(['bodyFeature0 quadruped/bodyFeature/crystals-crystalline/medium/v0']);
      expect(plan(body({ body: 6 }), catalogueOf([])).gaps).toContain('missing:quadruped/bodyFeature/shell-shelled/medium/v0');
      for (const plain of [0, 2, 10, 11, 12, 13]) expect(inSlots(plan(body({ body: plain })), ['bodyFeature']), `body ${plain}`).toEqual([]);
    });

    it('a fish keeps its shell or crystals', () => {
      expect(inSlots(plan(body({ body: 6, loco: 4 }, 0, 2)), ['bodyFeature'])).toEqual(['bodyFeature0 fish/bodyFeature/shell-fusiform/medium/v0']);
      expect(inSlots(plan(body({ body: 8, loco: 4 }, 1, 2)), ['bodyFeature'])).toEqual(['bodyFeature0 fish/bodyFeature/crystals-sturgeon/medium/v0']);
      for (const other of [0, 10, 11, 13]) expect(inSlots(plan(body({ body: other, loco: 4 })), ['bodyFeature']), `body ${other}`).toEqual([]);
    });

    it('bodyFeatureKind names the feature, or null', () => {
      expect(bodyFeatureKind(body({ body: 6 }))).toBe('shell-shelled');
      expect(bodyFeatureKind(body({ body: 8 }))).toBe('crystals-crystalline');
      expect(bodyFeatureKind(body({ body: 6, loco: 4 }, 1, 2))).toBe('shell-sturgeon');
      expect(bodyFeatureKind(body({ body: 8, loco: 4 }, 0, 2))).toBe('crystals-fusiform');
      expect(bodyFeatureKind(body({ body: 7, loco: 4 }))).toBe('fins-membranous');
      expect(bodyFeatureKind(body({ body: 7 }))).toBeNull();
      expect(bodyFeatureKind(body({ body: 10, loco: 4 }, 0, 2))).toBeNull();
      expect(bodyFeatureKind(body({ body: 1 }, 0, 2))).toBeNull();
      expect(WING_KINDS).toEqual({ membranous: ['wing'], fourwinged: ['wing', 'hindwing'] });
    });

    it('an insect never has wings, airborne or not', () => {
      for (const loco of [0, 3]) {
        const b = body({ body: 5, loco }, 0, 3);
        expect(b.family).toBe('insect');
        expect(inSlots(plan(b), [...WINGS, 'bodyFeature']), `loco ${loco}`).toEqual([]);
      }
      expect(body({ body: 5, loco: 3 }, 0, 3).airborne).toBe(true);
    });

    it('wings and flippers are marked on a patterned creature; the body feature is not', () => {
      const marked = (genes: Record<string, unknown>): string[] => plan(body({ ...genes, pattern: 3 })).parts.filter((p) => p.mark !== undefined).map((p) => `${p.slot}${p.index}`);
      expect(marked({ body: 14, loco: 4 })).toEqual(['farWings0', 'farWings1', 'tail0', 'torso0', 'nearWings0', 'nearWings1', 'nearLimbs0', 'nearLimbs1', 'head0']);
      expect(marked({ body: 0, loco: 3, limbs: 0 })).toContain('nearWings0');
      expect(marked({ body: 6, limbs: 0 })).toEqual(['farLimbs0', 'tail0', 'torso0', 'nearLimbs0', 'head0']);
      expect(plan(body({ body: 14, loco: 4, pattern: 3 })).parts.find((p) => p.slot === 'bodyFeature')!.mark).toBeUndefined();
      // Unpatterned, nothing is marked.
      expect(plan(body({ body: 14, loco: 4 })).parts.filter((p) => p.mark !== undefined)).toEqual([]);
    });
  });
});
