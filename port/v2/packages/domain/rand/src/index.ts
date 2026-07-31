/* @cf/domain-rand — MODULE 1 of 14.
   Ported from main.js `@module Rand [domain]` (lines 157–201, v1.8.9, tag v1.8.9).

   ⚠ PARITY RULES (Gate B: "preserve exact JavaScript numeric semantics"):
   Every function body below is the v1.8.9 source VERBATIM apart from type
   annotations. `|0`, `Math.imul`, `>>>`, and the /4294967296 divide are the
   determinism contract — 178,000 golden cases plus the 50-probe fingerprint
   depend on these exact operations in this exact order. Do not "clean up",
   do not reorder, do not substitute library RNGs. A change here that passes
   typecheck can still shift every world in the universe.

   Verified against port/baseline-v1.8.9/golden-seeds.json by test/parity.test.ts:
   hashInt · mulberry32 · cellRng — 10,000 seeds each, per-seed FNV hashes + rollups.
   ⚠ makeNoise / clamp / mix / TAU are NOT yet fixture-covered (the golden corpus
   does not sample them; in-game `noise` is pinned only by the 50-probe
   fingerprint). Extending the corpus is a recorded follow-up, not a silent gap. */

export const TAU: number = Math.PI * 2;

/** Deterministic 32-bit PRNG. Returns a closure yielding floats in [0,1). */
export function mulberry32(a: number): () => number {
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/** 32-bit integer hash of (seed, x, y) — the universe's cell addressing. */
export function hashInt(seed: number, x: number, y: number): number {
  let h = seed | 0;
  h = Math.imul(h ^ (x | 0), 374761393);
  h = Math.imul(h ^ (y | 0), 668265263);
  h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13;
  return h >>> 0;
}

/** Seeded PRNG for a universe cell. */
export function cellRng(seed: number, x: number, y: number): () => number {
  return mulberry32(hashInt(seed, x, y));
}

export function clamp(v: number, a: number, b: number): number { return v < a ? a : (v > b ? b : v); }

export type RGB = readonly [number, number, number];
export function mix(c1: RGB, c2: RGB, t: number): [number, number, number] {
  t = clamp(t, 0, 1); return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
}

/** Seeded 2-D value-noise fBm. Body verbatim from v1.8.9. */
export function makeNoise(seed: number): (x: number, y: number, oct?: number) => number {
  const r = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i] as number; p[i] = p[j] as number; p[j] = t; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255] as number;
  function fade(t: number): number { return t * t * (3 - 2 * t); }
  function n2(x: number, y: number): number {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const tl = (perm[(perm[X]! + Y) & 511]!) / 255, tr = (perm[(perm[(X + 1) & 255]! + Y) & 511]!) / 255;
    const bl = (perm[(perm[X]! + Y + 1) & 511]!) / 255, br = (perm[(perm[(X + 1) & 255]! + Y + 1) & 511]!) / 255;
    const u = fade(x), v = fade(y);
    return (tl * (1 - u) + tr * u) * (1 - v) + (bl * (1 - u) + br * u) * v;
  }
  return function fbm(x: number, y: number, oct?: number): number {
    let a = 0, amp = 0.5, f = 1;
    for (let o = 0; o < (oct || 4); o++) { a += amp * n2(x * f, y * f); amp *= 0.5; f *= 2; }
    return a / (1 - Math.pow(0.5, oct || 4));
  };
}
