/* Moved from packages/domain/genome/test/wrap.test.ts: these two tests drive genomes through
   @cf/domain-genetics, a later package than @cf/domain-genome, so a genome package test may not
   import it. The gene checker's planted-fault control moves with the check it controls. */
import { it, expect } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import type { Genome } from '@cf/domain-genome';
import { evolveGenome, crossGenome } from '@cf/domain-genetics';

const base = makeGenome(12345, 'fauna', 1);
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
