import { describe, expect, it } from 'vitest';
import { DRAW_ORDER, parseCatalogueText, partId } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import { BACK_KIND_BY_SKIN, HEAD_FEATURE_BY_TORSO, limbKind, planParts } from '../src/requests';
import { resolveAnatomy } from '../src/resolve';
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
