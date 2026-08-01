/* The charter & Ascent gates, PURE (main.js 21959-21965 / 22791-22824) —
   the game reads app globals (ascCh, items, primeFill) inside these; here
   state comes in as parameters (the D-ST lesson applied at birth).

   The ladder: stage 0 = Sol only · 1 = Jump Drive, the Neighborhood ring ·
   2 = Long-Range Array, the whole home galaxy · 3 = Intergalactic Drive
   (or all chapters done), everywhere. Reach (universe scale) grows by
   REGIONS as prime signatures are collected. */
import { REGIONS, ASC_RING_R } from '@cf/domain-strays';
import { HOME_GAL_SEED, SOL_SEED, SOL_POS, HOME_POS } from '@cf/domain-worldconfig';

export const ASC_CHAPTER_COUNT = 3;   /* ASC_CHAPTERS.length in v1.8.9 */

/** ascStage (main.js 22791): the built system IS the key. */
export function ascStageOf(items: Array<[string, number]>, ascCh: number): 0 | 1 | 2 | 3 {
  const count = (id: string): number => { for (const [k, n] of items) if (k === id) return n || 0; return 0; };
  if (ascCh >= ASC_CHAPTER_COUNT) return 3;
  if (count('igdrive')) return 3;
  if (count('array')) return 2;
  if (count('jumpdrive')) return 1;
  return 0;
}

/** ascAllows (main.js 22814), star-dive gate — verbatim decision ladder. */
export function ascAllowsStar(stage: number, galSeed: number, star: { x: number; y: number; seed: number }): boolean {
  if (stage >= 3) return true;
  if (galSeed !== HOME_GAL_SEED) return false;      /* foreign STARS wait for the IG drive */
  if (stage >= 2) return true;                      /* array: the whole home galaxy */
  if (star.seed === SOL_SEED) return true;
  if (stage === 1) return Math.hypot(star.x - SOL_POS.x, star.y - SOL_POS.y) <= (ASC_RING_R as number);
  return false;                                     /* stage 0: Sol only */
}

/** currentRegion (main.js 21959): reach jumps outward per prime signature. */
export function currentRegionOf(primeCount: number): { name: string; sigs: number; r: number } {
  const rows = REGIONS as Array<{ name: string; sigs: number; r: number }>;
  let r = rows[0]!;
  for (const R of rows) if (primeCount >= R.sigs) r = R;
  return r;
}
export function reachRadiusOf(primeCount: number): number { return currentRegionOf(primeCount).r; }
export function withinReachOf(primeCount: number, x: number, y: number): boolean {
  return Math.hypot(x - HOME_POS.x, y - HOME_POS.y) <= reachRadiusOf(primeCount);
}

/** ascHint (main.js 22800) — the block names the BUILD that opens the ring. */
export function ascHintFor(stage: number): string {
  return stage === 0 ? 'Sol is your charter for now — build the ⚡ Jump Drive at the 🛠 Shipyard.'
    : stage === 1 ? 'Your drive reaches the Neighborhood — the 📡 Long-Range Array charts the whole galaxy.'
      : 'The dark between galaxies needs the 🌌 Intergalactic Drive.';
}
