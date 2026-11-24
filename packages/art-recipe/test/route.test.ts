import { describe, expect, it } from 'vitest';
import { EYE_COUNTS, LIMB_COUNTS } from '@cf/art-format';
import {
  FISH_KEEPS_BY_BODY, HORN_HEADS, HORN_TRAIT, OWN_FAMILY_BY_BODY, SHAPES, TAIL_PART_KINDS, TORSO_BY_BODY,
  fishShapes, resolveBody, routeBody,
} from '../src/route';

const land = { kingdom: 'fauna', loco: 0, habitat: 0, size: 2 };
/** A fixed choice of shape `i` of `n`. */
const at = (i: number, _n: number) => (): number => i;
const first = (): number => 0;

/** The plan's table, on land: body gene -> [family, shapes]. */
const LAND: readonly (readonly [string, readonly string[]])[] = [
  ['quadruped', ['sturdy']], ['crustacean', ['crab', 'lobster']], ['quadruped', ['stilt']],
  ['tentacled', ['octopus', 'squid', 'cuttlefish']], ['serpent', ['snake', 'viper']], ['insect', ['beetle', 'generic', 'mantis']],
  ['quadruped', ['shelled']], ['quadruped', ['membranous']], ['quadruped', ['crystalline']], ['gelatinous', ['body']],
  ['quadruped', ['tusked']], ['quadruped', ['horned']], ['quadruped', ['spindly']], ['quadruped', ['squat']],
  ['quadruped', ['fourwinged']], ['radial', ['anemone', 'urchin', 'coral', 'cucumber']],
];
const OWN = [1, 3, 4, 5, 9, 15];

describe('the fixed tables', () => {
  it('hold the plan\'s values', () => {
    expect(OWN_FAMILY_BY_BODY).toEqual({ 1: 'crustacean', 3: 'tentacled', 4: 'serpent', 5: 'insect', 9: 'gelatinous', 15: 'radial' });
    expect(SHAPES).toEqual({
      crustacean: ['crab', 'lobster'], tentacled: ['octopus', 'squid', 'cuttlefish'], serpent: ['snake', 'viper'],
      insect: ['beetle', 'generic', 'mantis'], gelatinous: ['body'], radial: ['anemone', 'urchin', 'coral', 'cucumber'],
    });
    expect(TORSO_BY_BODY).toEqual(['sturdy', null, 'stilt', null, null, null, 'shelled', 'membranous', 'crystalline', null, 'tusked', 'horned', 'spindly', 'squat', 'fourwinged', null]);
    expect(FISH_KEEPS_BY_BODY).toEqual({ 6: 'shell', 8: 'crystals', 10: 'tusks', 11: 'horn' });
    expect([TAIL_PART_KINDS, HORN_HEADS, HORN_TRAIT]).toEqual([[2, 3, 5, 6], [3, 6], 11]);
    expect([0, 2, 12, 13, 6, 8, 10, 11].map(fishShapes)).toEqual([
      ['fusiform', 'shark', 'flat', 'angler'], ['fusiform', 'shark', 'flat', 'angler'], ['fusiform', 'shark', 'flat', 'angler'],
      ['flat'], ['fusiform', 'sturgeon'], ['fusiform', 'sturgeon'], ['fusiform', 'sturgeon'], ['fusiform', 'sturgeon'],
    ]);
  });
});

describe('routeBody and resolveBody', () => {
  it.each(LAND.map(([family, shapes], body) => [body, family, shapes] as const))('body %i on land is %s %j', (body, family, shapes) => {
    expect(routeBody({ ...land, body })).toEqual({ family, shapes, aquatic: false, airborne: false });
    const b = resolveBody({ ...land, body }, first);
    expect([b.family, b.torso]).toEqual([family, shapes[0]]);
  });

  it.each([['movement', { loco: 4 }], ['habitat alone', { habitat: 10 }]] as const)('aquatic by %s gives the same animal', (_, wet) => {
    const route = (body: number) => routeBody({ ...land, ...wet, body });
    for (const body of [0, 2, 12]) expect(route(body), String(body)).toEqual({ family: 'fish', shapes: ['fusiform', 'shark', 'flat', 'angler'], aquatic: true, airborne: false });
    expect(route(13)).toEqual({ family: 'fish', shapes: ['flat'], aquatic: true, airborne: false });
    for (const body of [6, 8, 10, 11]) {
      expect(route(body), String(body)).toEqual({ family: 'fish', shapes: ['fusiform', 'sturgeon'], aquatic: true, airborne: false });
      expect(resolveBody({ ...land, ...wet, body }, first).keeps, String(body)).toBe(({ 6: 'shell', 8: 'crystals', 10: 'tusks', 11: 'horn' } as Record<number, string>)[body]);
    }
    expect(route(7)).toEqual({ family: 'quadruped', shapes: ['membranous'], aquatic: true, airborne: false });
    expect(route(14)).toEqual({ family: 'quadruped', shapes: ['fourwinged'], aquatic: true, airborne: false });
    for (const body of OWN) expect(route(body), String(body)).toEqual({ family: LAND[body]![0], shapes: LAND[body]![1], aquatic: true, airborne: false });
    expect(resolveBody({ ...land, ...wet, body: 0 }, first).keeps).toBeNull();
    expect(resolveBody({ ...land, body: 6 }, first).keeps).toBeNull(); // a shelled body on land keeps nothing: it is its torso
  });

  it('reads aquatic and airborne from the extremophile tables for a marked genome', () => {
    expect(routeBody({ ...land, x: 1, habitat: 1, loco: 2, body: 0 })).toEqual({ family: 'quadruped', shapes: ['sturdy'], aquatic: false, airborne: true });
    expect(routeBody({ ...land, x: 1, habitat: 1, loco: 1, body: 0 }).family).toBe('fish');
    expect(routeBody({ ...land, x: 1, habitat: 8, body: 0 }).family).toBe('quadruped');
  });

  it('the shape is the one chosen of the family\'s list, the choice asked for once, with the length of the list', () => {
    const genomes: Record<string, number | Record<string, unknown>> = { crustacean: 1, tentacled: 3, serpent: 4, insect: 5, gelatinous: 9, radial: 15 };
    for (const [family, shapes] of Object.entries(SHAPES)) {
      const body = genomes[family] as number;
      for (const i of [0, shapes.length - 1]) expect(resolveBody({ ...land, body }, at(i, shapes.length)).torso, `${family} ${i}`).toBe(shapes[i]);
    }
    for (const [body, shapes] of [[0, fishShapes(0)], [11, fishShapes(11)], [13, fishShapes(13)]] as const) {
      for (const i of [0, shapes.length - 1]) expect(resolveBody({ ...land, loco: 4, body }, at(i, shapes.length)).torso, `fish ${body} ${i}`).toBe(shapes[i]);
    }
    for (const body of [0, 1, 2, 7, 13, 15]) {
      const asked: number[] = [];
      resolveBody({ ...land, body }, (count) => { asked.push(count); return 0; });
      expect(asked, String(body)).toEqual([routeBody({ ...land, body }).shapes.length]);
    }
  });

  it('the genes table, family by family', () => {
    const genes = { head: 5, tail: 1, limbs: 3, eyes: 1 };
    const row = (extra: Record<string, unknown>, i = 0, n = 1) => {
      const b = resolveBody({ ...land, ...genes, ...extra }, at(i, n));
      return [b.family, b.torso, b.head, b.tail, b.limbs, b.eyes];
    };
    expect(row({ body: 0 })).toEqual(['quadruped', 'sturdy', 5, 1, 8, 4]);
    expect(row({ body: 0, loco: 4 }, 0, 4)).toEqual(['fish', 'fusiform', 5, null, 0, 4]);
    expect(row({ body: 5 }, 0, 3)).toEqual(['insect', 'beetle', 5, null, 6, 4]);
    expect(row({ body: 4 }, 0, 2)).toEqual(['serpent', 'snake', null, null, 0, 1]);
    expect(row({ body: 3 }, 0, 3)).toEqual(['tentacled', 'octopus', null, null, 0, null]);
    expect(row({ body: 9 })).toEqual(['gelatinous', 'body', null, null, 0, null]);
    expect(row({ body: 15 }, 0, 4)).toEqual(['radial', 'anemone', null, null, 0, null]);
    expect(row({ body: 1 }, 0, 2)).toEqual(['crustacean', 'crab', 5, null, 0, null]);
    expect(row({ body: 1 }, 1, 2)).toEqual(['crustacean', 'lobster', 5, null, 0, 4]);
    // Tail kinds 2, 3, 5 and 6 are kept by fish, tentacled and crustacean; every kind by a quadruped; none by the rest.
    const tails = (extra: Record<string, unknown>) => [0, 1, 2, 3, 4, 5, 6].map((tail) => resolveBody({ ...land, ...extra, tail }, first).tail);
    for (const extra of [{ body: 0, loco: 4 }, { body: 3 }, { body: 1 }]) expect(tails(extra), JSON.stringify(extra)).toEqual([null, null, 2, 3, null, 5, 6]);
    expect(tails({ body: 0 })).toEqual([0, 1, 2, 3, 4, 5, 6]);
    for (const body of [4, 5, 9, 15]) expect(tails({ body }), String(body)).toEqual([null, null, null, null, null, null, null]);
    // The eyeless head: no eyes wherever the eye gene applies; a serpent keeps its one eye.
    const eyeless = (extra: Record<string, unknown>, i = 0, n = 1) => resolveBody({ ...land, ...extra, head: 2, eyes: 1 }, at(i, n)).eyes;
    expect([eyeless({ body: 0 }), eyeless({ body: 0, loco: 4 }), eyeless({ body: 5 }), eyeless({ body: 1 }, 1, 2)]).toEqual([0, 0, 0, 0]);
    expect([eyeless({ body: 4 }), eyeless({ body: 1 }, 0, 2), eyeless({ body: 3 })]).toEqual([1, null, null]);
    // Gene eyes are read through EYE_COUNTS, limbs through LIMB_COUNTS.
    expect([0, 1, 2, 3, 4, 5].map((v) => { const b = resolveBody({ ...land, body: 0, limbs: v, eyes: v }, first); return [b.limbs, b.eyes]; }))
      .toEqual([0, 1, 2, 3, 4, 5].map((v) => [LIMB_COUNTS[v], EYE_COUNTS[v]]));
  });

  it('a winged body has two legs when airborne and none when aquatic', () => {
    const legs = (body: number, extra: Record<string, unknown>) => [0, 1, 2, 3, 4, 5].map((limbs) => resolveBody({ ...land, ...extra, body, limbs }, first).limbs);
    for (const body of [7, 14]) {
      expect(legs(body, { loco: 3 }), String(body)).toEqual([2, 2, 2, 2, 2, 0]);
      expect(legs(body, { loco: 4 }), String(body)).toEqual([0, 0, 0, 0, 0, 0]);
      expect(legs(body, { loco: 3, habitat: 10 }), String(body)).toEqual([0, 0, 0, 0, 0, 0]);
      expect(legs(body, {}), String(body)).toEqual([2, 4, 6, 8, 3, 0]);
    }
    expect(legs(0, { loco: 3 })).toEqual([2, 4, 6, 8, 3, 0]);
  });

  it('horn on head 3, head 6 or trait 11, on a quadruped only', () => {
    const horn = (extra: Record<string, unknown>) => resolveBody({ ...land, head: 0, trait: 0, ...extra }, first).horn;
    for (const body of [0, 10, 11]) {
      expect([horn({ body, head: 3 }), horn({ body, head: 6 }), horn({ body, trait: 11 }), horn({ body, trait: 36 })], String(body)).toEqual([true, true, true, true]);
      expect([horn({ body }), horn({ body, head: 4 }), horn({ body, trait: 10 })], String(body)).toEqual([false, false, false]);
    }
    expect([horn({ body: 11, loco: 4, head: 3 }), horn({ body: 11, loco: 4, trait: 11 })]).toEqual([false, false]);
    expect([horn({ body: 5, head: 3 }), horn({ body: 5, trait: 11 }), horn({ body: 4, head: 6 })]).toEqual([false, false, false]);
  });

  it('opacity', () => {
    const op = (body: number, skin: number) => resolveBody({ ...land, body, skin }, first).opacity;
    expect([op(9, 0), op(9, 7)]).toEqual([82, 82]);
    expect([op(0, 7), op(1, 7), op(4, 7)]).toEqual([66, 66, 66]);
    expect(op(15, 7)).toBe(100);
    expect([op(0, 6), op(1, 6), op(15, 6)]).toEqual([100, 100, 100]);
  });

  it('size gene 0, a missing size and NaN draw at small (tiny creatures stay small), as 1; 2 and 3 at medium; 4 and 5 at large; apex 12 at guardian', () => {
    const tier = (extra: Record<string, unknown>) => resolveBody({ ...land, body: 0, ...extra }, first).tier;
    expect([tier({ size: 0 }), tier({ size: undefined }), tier({ size: NaN })]).toEqual(['small', 'small', 'small']);
    expect([tier({ size: 1 }), tier({ size: 2 }), tier({ size: 3 }), tier({ size: 4 }), tier({ size: 5 })]).toEqual(['small', 'medium', 'medium', 'large', 'large']);
    expect([tier({ size: 0, apex: 12 }), tier({ size: 1, apex: 12 })]).toEqual(['guardian', 'guardian']);
    // The size gene wraps and floors as every gene does.
    expect([6, -1, 1.5, -0.5, Infinity, -Infinity].map((size) => tier({ size }))).toEqual(['small', 'large', 'small', 'large', 'small', 'small']);
  });

  it('carries the shared genes of a fauna body', () => {
    const b = resolveBody({ ...land, body: 0, pattern: 7, skin: 3, color: 13, accent: 2, lumin: true }, first);
    expect([b.kingdom, b.pattern, b.skin, b.colour, b.accent, b.glow, b.form, b.floraTable]).toEqual(['fauna', 7, 3, 13, 2, true, 0, 'land']);
  });
  it('carries the game\'s theme of a fauna body', () => {
    expect(resolveBody({ ...land, body: 0, habitat: 9, loco: 0 }, first).theme).toBe('fire');
    expect(resolveBody({ ...land, body: 9, habitat: 9, loco: 4 }, first).theme).toBe('tide');
  });
});

describe('the other kingdoms', () => {
  const base = { kingdom: 'fauna', body: 0, loco: 4, head: 3, tail: 6, pattern: 7, skin: 7, limbs: 3, eyes: 1, size: 5, color: 13, accent: 2, lumin: true };
  const neutral = { head: null, tail: null, eyes: null, keeps: null, limbs: 0, horn: false, aquatic: false, airborne: false, opacity: 100, theme: null };
  it.each([['flora', 18], ['fungi', 9], ['microbe', 12]] as const)('%s resolves as today, with the neutral fields', (kingdom, length) => {
    const genome = { ...base, kingdom, form: length + 2 };
    expect(resolveBody(genome, first)).toEqual({ ...neutral, kingdom, family: kingdom, torso: '', tier: 'large', pattern: 0, skin: 0, colour: 13, accent: 2, glow: true, form: 2, floraTable: 'land' });
  });
  it('flora reads the sea table for aq, else the air table for af, and takes the size table\'s tier', () => {
    const flora = { ...base, kingdom: 'flora' };
    const cases: [Record<string, unknown>, [string, number, string]][] = [
      [{ aq: 1, form: 8 }, ['aquatic', 2, 'large']], [{ af: 1, form: 4 }, ['aerial', 1, 'large']], [{ aq: 1, af: 1, form: 10 }, ['aquatic', 4, 'large']],
      [{ form: 20 }, ['land', 2, 'large']], [{ size: 0 }, ['land', 0, 'small']], [{ size: 1 }, ['land', 0, 'small']], [{ size: 2 }, ['land', 0, 'medium']],
    ];
    for (const [extra, expected] of cases) {
      const b = resolveBody({ ...flora, ...extra }, first);
      expect([b.floraTable, b.form, b.tier], JSON.stringify(extra)).toEqual(expected);
    }
  });
  it('does not read the stream outside fauna', () => {
    let reads = 0;
    for (const kingdom of ['flora', 'fungi', 'microbe']) resolveBody({ ...base, kingdom }, () => { reads++; return 0; });
    expect(reads).toBe(0);
  });
});

describe('wild genes', () => {
  it('never throws on wild genes and stays in range', () => {
    const wild: unknown[] = [0, 1, 17, 1000003, -1, -999, 2, -7, 3, 2 ** 40, -(2 ** 40), 1e300, -1e300, 2.5, -2.5, 7.9, 'x', '3', undefined, null, NaN, Infinity, -Infinity, true, {}, []];
    const genes = ['kingdom', 'body', 'loco', 'habitat', 'head', 'tail', 'pattern', 'skin', 'limbs', 'eyes', 'size', 'color', 'accent', 'lumin', 'form', 'trait', 'x'];
    const kingdoms = ['fauna', 'flora', 'fungi', 'microbe', 'other', undefined, 3];
    const families = ['quadruped', 'fish', 'insect', 'serpent', 'tentacled', 'gelatinous', 'radial', 'crustacean', 'flora', 'fungi', 'microbe'];
    for (let n = 0; n < 400; n++) {
      const genome: Record<string, unknown> = {};
      genes.forEach((gene, i) => { genome[gene] = wild[(n * 7 + i * 11 + (n >> 3)) % wild.length]; });
      genome['kingdom'] = kingdoms[n % kingdoms.length];
      if (n % 5 === 0) genome['apex'] = 12;
      const b = resolveBody(genome, (count) => n % count);
      expect(['fauna', 'flora', 'fungi', 'microbe']).toContain(b.kingdom);
      expect(['small', 'medium', 'large', 'guardian']).toContain(b.tier);
      expect(families).toContain(b.family);
      expect(typeof b.torso).toBe('string');
      expect([100, 82, 66]).toContain(b.opacity);
      expect(b.head === null || (Number.isInteger(b.head) && b.head >= 0 && b.head < 10)).toBe(true);
      expect(b.tail === null || (Number.isInteger(b.tail) && b.tail >= 0 && b.tail < 7)).toBe(true);
      expect(b.eyes === null || (EYE_COUNTS as readonly number[]).includes(b.eyes)).toBe(true);
      expect(LIMB_COUNTS as readonly number[]).toContain(b.limbs);
      if (b.kingdom === 'fauna') expect(routeBody(genome).shapes, String(n)).toContain(b.torso);
    }
  });
});
