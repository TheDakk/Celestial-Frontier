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

/* ---- the Ascent chapters as DATA (main.js 22758-22789, text verbatim).
   The source's goal filters are closures; here the two landfall filters are
   expressed as a `scope` field so banking stays pure and testable. Non-
   landfall goals (mine/craft/scan/…) are carried for the objective chip;
   their events arrive when those systems port. ---- */
export const SOL_SEEDS: ReadonlySet<number> = new Set([131, 132, 133, 134, 135, 136, 137, 138]);
export interface AscGoal { id: string; ev: string; n: number; t: string; scope?: 'sol' | 'nonsol'; }
export interface AscChapter { id: string; name: string; intro: string; goals: AscGoal[]; unlockNote: string; }
export const ASC_CHAPTERS_DATA: readonly AscChapter[] = [
  {
    id: 'ch1', name: 'Chapter 1 — Off the Rock',
    intro: 'Sol is yours to learn — the rest of the sky is charts and longing. Mine the dead worlds, feed the Fabricator, and build the Jump Drive.',
    goals: [
      { id: 'c1-land', ev: 'landfall', scope: 'sol', n: 2, t: 'Make planetfall on 2 worlds of Sol' },
      { id: 'c1-mine', ev: 'mined', n: 8, t: 'Mine Sol’s dead worlds 8 times' },
      { id: 'c1-part', ev: 'crafted', n: 4, t: 'Fabricate 4 basic parts' },
      { id: 'c1-comp', ev: 'crafted', n: 2, t: 'Assemble 2 components' },
      { id: 'c1-jump', ev: 'crafted', n: 1, t: 'Build the ⚡ Jump Drive' },
    ],
    unlockNote: 'Interstellar travel is yours — the Neighborhood’s stars are open.',
  },
  {
    id: 'ch2', name: 'Chapter 2 — The Neighborhood',
    intro: 'The nearby stars answer. Hunt life, plant a flag, and build the Long-Range Array to chart the whole galaxy.',
    goals: [
      { id: 'c2-land', ev: 'landfall', scope: 'nonsol', n: 3, t: 'Land on 3 worlds beyond Sol' },
      { id: 'c2-scan', ev: 'bioscan', n: 2, t: 'Discover life on 2 alien worlds' },
      { id: 'c2-conq', ev: 'conquest', n: 1, t: 'Conquer a world' },
      { id: 'c2-array', ev: 'crafted', n: 1, t: 'Build the 📡 Long-Range Array' },
    ],
    unlockNote: 'The whole home galaxy answers your charts.',
  },
  {
    id: 'ch3', name: 'Chapter 3 — Beyond the Rim',
    intro: 'One galaxy is a grain of sand. Master the trades, gear up, and build the drive that crosses the dark.',
    goals: [
      { id: 'c3-breed', ev: 'bred', n: 1, t: 'Breed a hybrid bloodline' },
      { id: 'c3-gear', ev: 'crafted', n: 2, t: 'Craft 2 pieces of explorer gear' },
      { id: 'c3-mine', ev: 'mined', n: 20, t: 'Mine 20 more times' },
      { id: 'c3-ig', ev: 'crafted', n: 1, t: 'Build the 🌌 Intergalactic Drive' },
    ],
    unlockNote: 'The dark between galaxies is yours to cross — from here the Prime Codex Signatures extend the frontier, ring by ring.',
  },
];

/** ascEvent's banking rule for landfalls (main.js 22826 review catch):
    progress BANKS for every chapter from the current one on — a player who
    out-lands the current chapter must not lose the later credit. Mutates
    `prog` in place (the save's ascProg object); returns true if changed. */
export function bankLandfall(ascCh: number, prog: Record<string, number>, planetSeed: number): boolean {
  let changed = false;
  for (let ci = ascCh; ci < ASC_CHAPTERS_DATA.length; ci++) {
    for (const g of ASC_CHAPTERS_DATA[ci]!.goals) {
      if (g.ev !== 'landfall') continue;
      if (g.scope === 'sol' && !SOL_SEEDS.has(planetSeed)) continue;
      if (g.scope === 'nonsol' && SOL_SEEDS.has(planetSeed)) continue;
      const have = prog[g.id] || 0;
      if (have < g.n) { prog[g.id] = have + 1; changed = true; }
    }
  }
  return changed;
}

/** all goals of the CURRENT chapter met? (the chapter-advance condition) */
export function chapterGoalsDone(ascCh: number, prog: Record<string, number>): boolean {
  const ch = ASC_CHAPTERS_DATA[ascCh];
  if (!ch) return false;
  return ch.goals.every((g) => (prog[g.id] || 0) >= g.n);
}

/** the objective chip: the current chapter's first unfinished goal */
export function currentObjective(ascCh: number, prog: Record<string, number>): { text: string; have: number; need: number; chapter: string } | null {
  const ch = ASC_CHAPTERS_DATA[ascCh];
  if (!ch) return null;   /* the Ascent is complete */
  const g = ch.goals.find((gg) => (prog[gg.id] || 0) < gg.n) || ch.goals[ch.goals.length - 1]!;
  return { text: g.t, have: Math.min(prog[g.id] || 0, g.n), need: g.n, chapter: ch.name };
}
