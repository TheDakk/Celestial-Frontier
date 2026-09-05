/* Pure deterministic Paragon identities shared by the app finder and ownership
   validation. The authored seed/genome recipe lives here once; catalogue
   mutation remains in paragon.ts. */
import { GUARDIAN_EPITHETS, makeGenome, type Genome } from '@cf/domain-genome';
import { hashInt, mulberry32 } from '@cf/domain-rand';

export const ARC9_PARAGON_COUNT_V1 = 50 as const;
export const ARC9_PARAGON_MILESTONE_COUNT_V1 = 10 as const;
export const ARC9_PARAGON_MILESTONE_STARDUST_V1 = 120 as const;
export const ARC9_PARAGON_MILESTONE_NAME_V1 = 'Seeker of Legends' as const;

const PARAGON_SEED_ANCHOR = 0x9A7A60;

function exactIndex(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 0
    || (value as number) >= ARC9_PARAGON_COUNT_V1) {
    throw new RangeError('Paragon index must identify one of the Fifty');
  }
  return value as number;
}

/** Verbatim legacy seed recipe: hashInt(0x9A7A60, i, 61) >>> 0. */
export function paragonSeedV1(indexValue: number): number {
  const index = exactIndex(indexValue);
  return hashInt(PARAGON_SEED_ANCHOR, index | 0, 61) >>> 0;
}

function createParagonGenomeV1(index: number): Readonly<Genome> {
  const genome = makeGenome(paragonSeedV1(index), 'fauna', 1);
  const random = mulberry32(hashInt(PARAGON_SEED_ANCHOR, index | 0, 62) >>> 0);
  genome.size = 4 + ((random() * 2) | 0);
  genome.lumin = true;
  genome.wild = 1;
  genome.par = 8 + ((random() * 4) | 0);
  genome.ep = hashInt(PARAGON_SEED_ANCHOR, index | 0, 63) % GUARDIAN_EPITHETS.length;
  return Object.freeze(genome);
}

const PARAGON_GENOMES = Object.freeze(
  Array.from({ length: ARC9_PARAGON_COUNT_V1 }, (_, index) => createParagonGenomeV1(index)),
);

export function paragonGenomeV1(indexValue: number): Readonly<Genome> {
  return PARAGON_GENOMES[exactIndex(indexValue)]!;
}
