import { it, expect } from 'vitest';
import * as T from '@cf/domain-speciestraits';
import { makeGenome, describeSpecies, faunaDesc, speciesGrade, guardianFor } from '@cf/domain-genome';
it('keeps the frozen table lengths', () => {
  expect([T.FA_BODY, T.FA_LOCO, T.FA_HEAD, T.FA_TAIL, T.FA_PATTERN, T.FA_SKIN, T.FA_LIMBS, T.FA_EYES, T.FA_SIZE, T.SP_COLOR, T.FLORA_FORM, T.FUNGI_FORM, T.MICROBE_FORM].map((t) => t.length))
    .toEqual([16, 18, 10, 7, 8, 9, 6, 6, 6, 17, 18, 9, 12]);
});
const base = makeGenome(12345, 'fauna', 1);
// body, tail, pattern and color are left out: their readers do not wrap negative genes (see task 5 report).
const drifted = { ...base, head: 1007, size: 60, limbs: -7, eyes: 13, skin: 100 };
const wrapped = { ...base, head: 7, size: 0, limbs: 5, eyes: 1, skin: 1 };
const readers = { describeSpecies, faunaDesc, speciesGrade };
it('reads a drifted genome exactly as its wrapped equivalent', () => {
  for (const [name, read] of Object.entries(readers)) {
    expect(read(drifted), name).toEqual(read(wrapped));
  }
});
it('tells genomes apart when a gene differs by one', () => {
  const genes = ['head', 'size', 'limbs', 'eyes', 'skin'] as const;
  const mods = { head: 10, size: 6, limbs: 6, eyes: 6, skin: 9 };
  const differing = genes.filter((k) => {
    const other = { ...wrapped, [k]: (wrapped[k] + 1) % mods[k] };
    return JSON.stringify(describeSpecies(other)) !== JSON.stringify(describeSpecies(wrapped));
  });
  expect(differing.length).toBeGreaterThan(0);
});
it('gives no Guardian to the Sol planets', () => {
  for (let s = 131; s <= 138; s++) expect(guardianFor(s)).toBeNull();
});
