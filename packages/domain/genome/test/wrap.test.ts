import { it, expect } from 'vitest';
import * as T from '@cf/domain-speciestraits';
import { makeGenome, describeSpecies, faunaDesc, speciesGrade, guardianFor } from '@cf/domain-genome';
import type { Genome } from '@cf/domain-genome';
import { evolveGenome, crossGenome } from '@cf/domain-genetics';

it('keeps the frozen table lengths', () => {
  expect([T.FA_BODY, T.FA_LOCO, T.FA_HEAD, T.FA_TAIL, T.FA_PATTERN, T.FA_SKIN, T.FA_LIMBS, T.FA_EYES, T.FA_SIZE, T.SP_COLOR, T.FLORA_FORM, T.FUNGI_FORM, T.MICROBE_FORM].map((t) => t.length))
    .toEqual([16, 18, 10, 7, 8, 9, 6, 6, 6, 17, 18, 9, 12]);
});

const base = makeGenome(12345, 'fauna', 1);
// Upward drift is the real case: each value is well above its table length and not a multiple of it.
// limbs is left out: none of these readers reads it, so it cannot show equivalence or a difference.
const drifted = { ...base, body: 83, head: 73, tail: 65, size: 70, eyes: 53, pattern: 59, skin: 58, color: 91 };
const wrapped = { ...base, body: 3, head: 3, tail: 2, size: 4, eyes: 5, pattern: 3, skin: 4, color: 6 };
const readers = { describeSpecies, faunaDesc, speciesGrade };
const tableLength = {
  body: T.FA_BODY.length, head: T.FA_HEAD.length, tail: T.FA_TAIL.length, size: T.FA_SIZE.length,
  eyes: T.FA_EYES.length, pattern: T.FA_PATTERN.length, skin: T.FA_SKIN.length, color: T.SP_COLOR.length,
};
const readAll = (g: Genome): string => JSON.stringify(Object.values(readers).map((read) => read(g)));

it('reads a genome whose genes have drifted upward exactly as its wrapped equivalent', () => {
  for (const [name, read] of Object.entries(readers)) {
    expect(read(drifted), name).toEqual(read(wrapped));
  }
});
it('makes every gene in the equivalence visible: changing only that gene by one changes what the readers say', () => {
  const visible = (Object.keys(tableLength) as (keyof typeof tableLength)[]).filter((k) => {
    const other = { ...wrapped, [k]: (wrapped[k] + 1) % tableLength[k] };
    return readAll(other) !== readAll(wrapped);
  });
  expect(visible).toEqual(['body', 'head', 'tail', 'size', 'eyes', 'pattern', 'skin', 'color']);
});

const GENES = ['body', 'head', 'tail', 'pattern', 'skin', 'limbs', 'eyes', 'size', 'color', 'accent', 'loco'] as const;
const badGenes = (g: Genome): string[] =>
  GENES.filter((k) => !(Number.isInteger(g[k]) && g[k] >= 0));

it('play never produces a negative or fractional gene', () => {
  const evolved: Genome[] = [];
  const bad: string[] = [];
  for (let seed = 1; seed <= 300; seed++) {
    const g = makeGenome(seed * 7919, 'fauna', seed % 3);
    for (const epochs of [1, 5, 40]) evolved.push(evolveGenome(g, epochs));
  }
  const crossed = evolved.slice(1).map((g, i) => crossGenome(evolved[i] as Genome, g));
  for (const g of [...evolved, ...crossed]) bad.push(...badGenes(g));
  expect(bad).toEqual([]);
  expect(crossed.length).toBe(899);
});
it('the gene checker flags a planted negative or fractional gene', () => {
  expect(badGenes(base)).toEqual([]);
  expect(badGenes({ ...base, tail: -1 })).toEqual(['tail']);
  expect(badGenes({ ...base, eyes: 2.5 })).toEqual(['eyes']);
});

it('negative genes are outside the contract: describeSpecies and faunaDesc do not wrap them', () => {
  const ok = { ...base, body: 13, head: 7, tail: 6, size: 0, limbs: 5, eyes: 1, pattern: 7, skin: 1, color: 16 };
  // Each field read from both readers, which must agree, for the negative gene and for its wrapped twin.
  const field = (genes: Partial<Genome>, f: 'desc' | 'anatomy' | 'pattern') => {
    const g = { ...ok, ...genes };
    const fromDescribe = describeSpecies(g)[f];
    expect(faunaDesc(g)[f]).toEqual(fromDescribe);
    return fromDescribe;
  };
  expect(field({ body: -3 }, 'desc')).toBe('tiny, glass-clear undefined grazers bearing crystal antlers, glowing');
  expect(field({ body: 13 }, 'desc')).toBe('tiny, glass-clear squat heavy-boned grazers bearing crystal antlers, glowing');
  expect(field({ head: -3 }, 'anatomy')).toBe('undefined, furred-skinned, with 4 eyes and a stinger-tipped tail');
  expect(field({ head: 7 }, 'anatomy')).toBe('domed and bulbous, furred-skinned, with 4 eyes and a stinger-tipped tail');
  expect(field({ tail: -1 }, 'anatomy')).toBe('domed and bulbous, furred-skinned, with 4 eyes and a undefined tail');
  expect(field({ tail: 6 }, 'anatomy')).toBe('domed and bulbous, furred-skinned, with 4 eyes and a stinger-tipped tail');
  expect(field({ size: -1 }, 'desc')).toBe('undefined, glass-clear squat heavy-boned grazers bearing crystal antlers, glowing');
  expect(field({ size: 5 }, 'desc')).toBe('titanic, glass-clear squat heavy-boned grazers bearing crystal antlers, glowing');
  expect(field({ eyes: -5 }, 'anatomy')).toBe('domed and bulbous, furred-skinned, with undefined eyes and a stinger-tipped tail');
  expect(field({ eyes: 1 }, 'anatomy')).toBe('domed and bulbous, furred-skinned, with 4 eyes and a stinger-tipped tail');
  expect(field({ pattern: -9 }, 'pattern')).toBeUndefined();
  expect(field({ pattern: 7 }, 'pattern')).toBe('eye-spotted');
  expect(field({ skin: -8 }, 'anatomy')).toBe('domed and bulbous, undefined-skinned, with 4 eyes and a stinger-tipped tail');
  expect(field({ skin: 1 }, 'anatomy')).toBe('domed and bulbous, furred-skinned, with 4 eyes and a stinger-tipped tail');
  expect(field({ color: -18 }, 'desc')).toBe('tiny, undefined squat heavy-boned grazers bearing crystal antlers, glowing');
  expect(field({ color: 16 }, 'desc')).toBe('tiny, glass-clear squat heavy-boned grazers bearing crystal antlers, glowing');
});
it('speciesGrade, which reads only size of these genes, does wrap a negative size', () => {
  const ok = { ...base, size: 0 };
  expect(speciesGrade({ ...ok, size: -1 })).toEqual(speciesGrade({ ...ok, size: 5 }));
  expect(speciesGrade({ ...ok, size: -1 })).not.toEqual(speciesGrade(ok));
});

it('gives no Guardian to the Sol planets', () => {
  for (let s = 131; s <= 138; s++) expect(guardianFor(s)).toBeNull();
});
