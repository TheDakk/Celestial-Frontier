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
const drifted = { ...base, body: 83, head: 73, tail: 65, size: 70, limbs: 55, eyes: 53, pattern: 59, skin: 58, color: 91 };
const wrapped = { ...base, body: 3, head: 3, tail: 2, size: 4, limbs: 1, eyes: 5, pattern: 3, skin: 4, color: 6 };
const readers = { describeSpecies, faunaDesc, speciesGrade };

it('reads a genome whose genes have drifted upward exactly as its wrapped equivalent', () => {
  for (const [name, read] of Object.entries(readers)) {
    expect(read(drifted), name).toEqual(read(wrapped));
  }
});
it('tells genomes apart when a gene differs by one', () => {
  const mods = { body: 16, head: 10, tail: 7, size: 6, limbs: 6, eyes: 6, pattern: 8, skin: 9, color: 17 };
  const differing = (Object.keys(mods) as (keyof typeof mods)[]).filter((k) => {
    const other = { ...wrapped, [k]: (wrapped[k] + 1) % mods[k] };
    return JSON.stringify(describeSpecies(other)) !== JSON.stringify(describeSpecies(wrapped));
  });
  expect(differing.length).toBeGreaterThan(0);
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

// The new renderer's own gene reads wrap negatives; this pins the old readers' latent gap.
it('negative genes are outside the contract: body, tail, pattern and color readers do not wrap them', () => {
  const ok = { ...base, body: 13, head: 7, tail: 6, size: 0, limbs: 5, eyes: 1, pattern: 7, skin: 1, color: 16 };
  const at = (genes: Partial<Genome>, twin: Partial<Genome>) => [describeSpecies({ ...ok, ...genes }), describeSpecies({ ...ok, ...twin })] as const;
  const [body, bodyOk] = at({ body: -3 }, { body: 13 });
  expect(body.desc).toBe('tiny, glass-clear undefined grazers bearing crystal antlers, glowing');
  expect(bodyOk.desc).toBe('tiny, glass-clear squat heavy-boned grazers bearing crystal antlers, glowing');
  const [tail, tailOk] = at({ tail: -1 }, { tail: 6 });
  expect(tail.anatomy).toBe('domed and bulbous, furred-skinned, with 4 eyes and a undefined tail');
  expect(tailOk.anatomy).toBe('domed and bulbous, furred-skinned, with 4 eyes and a stinger-tipped tail');
  const [pattern, patternOk] = at({ pattern: -9 }, { pattern: 7 });
  expect(pattern.pattern).toBeUndefined();
  expect(patternOk.pattern).toBe('eye-spotted');
  const [color, colorOk] = at({ color: -18 }, { color: 16 });
  expect(color.desc).toBe('tiny, undefined squat heavy-boned grazers bearing crystal antlers, glowing');
  expect(colorOk.desc).toBe('tiny, glass-clear squat heavy-boned grazers bearing crystal antlers, glowing');
});

it('gives no Guardian to the Sol planets', () => {
  for (let s = 131; s <= 138; s++) expect(guardianFor(s)).toBeNull();
});
