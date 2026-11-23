import { mulberry32 } from '@cf/domain-rand';

/** A whole number from 0 to 2^32 - 1 from the browser's entropy. */
export function uint32(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] as number;
}

/** A fresh identifier that no other call, tab or device will produce. */
export function token(): string {
  return crypto.randomUUID();
}

/** Presentation only (sound noise). A seeded generator, seeded once from uint32(). */
export function presentationRandom(seed: number): () => number {
  return mulberry32(seed);
}
