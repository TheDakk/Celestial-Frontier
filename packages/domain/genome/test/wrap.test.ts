import { it, expect } from 'vitest';
import * as T from '@cf/domain-speciestraits';
import { makeGenome, describeSpecies, guardianFor } from '@cf/domain-genome';
it('keeps the frozen table lengths', () => {
  expect([T.FA_BODY, T.FA_LOCO, T.FA_HEAD, T.FA_TAIL, T.FA_PATTERN, T.FA_SKIN, T.FA_LIMBS, T.FA_EYES, T.FA_SIZE, T.SP_COLOR, T.FLORA_FORM, T.FUNGI_FORM, T.MICROBE_FORM].map((t) => t.length))
    .toEqual([16, 18, 10, 7, 8, 9, 6, 6, 6, 17, 18, 9, 12]);
});
it('describes a genome whose genes have drifted out of range', () => {
  const g = { ...makeGenome(12345, 'fauna', 1), body: -3, head: 1007, tail: -1, size: 60 };
  expect(typeof describeSpecies(g).name).toBe('string');
});
it('gives no Guardian to the Sol planets', () => {
  for (let s = 131; s <= 138; s++) expect(guardianFor(s)).toBeNull();
});
