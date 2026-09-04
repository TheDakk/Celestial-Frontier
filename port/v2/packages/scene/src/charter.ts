/* The charter & Ascent gates, PURE (main.js 21959-21965 / 22791-22824) —
   the game reads app globals (ascCh, items, primeFill) inside these; here
   state comes in as parameters (the D-ST lesson applied at birth).

   The ladder: stage 0 = Sol only · 1 = Jump Drive, the Neighborhood ring ·
   2 = Long-Range Array, the whole home galaxy · 3 = Intergalactic Drive
   (or all chapters done), everywhere. Reach (universe scale) grows by
   REGIONS as prime signatures are collected. */
import { REGIONS, ASC_RING_R } from '@cf/domain-strays';
import { HOME_GAL_SEED, SOL_SEED, SOL_POS, HOME_POS } from '@cf/domain-worldconfig';
import { isCanonicalCF1Address, type CanonicalCF1WorldAddress } from './address.js';

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

/** Address-aware reach gate for source-proven navigation and durable deeds.
 * The legacy projection above accepts only a galaxy seed because its original
 * call sites had no parent coordinates. Current v2 address owners must also
 * bind the exact home-galaxy and Sol-star hierarchy so a colliding seed under
 * different coordinates cannot inherit reach. */
export function ascAllowsCanonicalStar(
  stage: number,
  galaxy: Readonly<{ x: number; y: number; seed: number }>,
  star: Readonly<{ x: number; y: number; seed: number }>,
): boolean {
  if (stage >= 3) return true;
  const isHomeGalaxy = galaxy.seed === HOME_GAL_SEED
    && galaxy.x === HOME_POS.x
    && galaxy.y === HOME_POS.y;
  if (!isHomeGalaxy) return false;
  if (stage >= 2) return true;
  const isSolStar = star.seed === SOL_SEED
    && star.x === SOL_POS.x
    && star.y === SOL_POS.y;
  if (isSolStar) return true;
  if (stage === 1) {
    return Math.hypot(star.x - SOL_POS.x, star.y - SOL_POS.y) <= (ASC_RING_R as number);
  }
  return false;
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

/**
 * Player-visible reach block for the current v2 slice. Owned permanent
 * systems still enforce the canonical ladder, and Arc 3's fixed Fabricator
 * can now create each next system when its exact requirements are met.
 * Incomplete chapter progress alone never grants the missing capability; a
 * completed imported veteran Charter preserves stage 3 as a generic refit.
 */
export function ascHintFor(stage: number): string {
  return stage <= 0
    ? 'Sol is your current reach. Engineering can fabricate the Jump Drive when its exact recipe requirements are met.'
    : stage === 1
      ? 'Your owned Jump Drive covers the Neighborhood. Engineering can fabricate the Long-Range Array when its exact recipe requirements are met.'
      : stage === 2
        ? 'Your owned Long-Range Array covers the home galaxy. Engineering can fabricate the Intergalactic Drive when its exact recipe requirements are met.'
        : 'Intergalactic star reach is already preserved; this destination is blocked by a different boundary.';
}

/** A galaxy can also be blocked by the saved Prime Signature radius. That is
    a different fact from a star/drive Charter gate: point to the live verified
    Titan-victory owner without implying that chapter or Engineering state can
    mint a Signature. */
export function primeReachHint(): string {
  return 'Your saved Prime Signature radius ends here. Verified Titan victories claim Prime Signatures that expand it; open the Prime Codex to review your frontier.';
}

/* ---- the Ascent chapters as DATA (main.js 22758-22789, text verbatim).
   The source's goal filters are closures; here the two landfall filters are
   expressed as a `scope` field so banking stays pure and testable. Every
   legacy goal remains canonical data for imported progression. The current
   v2 presentation projects only actions that this slice can actually pay
   for; it must never turn preserved legacy copy into a false player promise.
   ---- */
export const SOL_SEEDS: ReadonlySet<number> = new Set([131, 132, 133, 134, 135, 136, 137, 138]);
const SOL_WORLD_ORDINALS: ReadonlyMap<number, number> = new Map([
  [131, 0], [132, 1], [133, 2], [134, 3],
  [135, 4], [136, 5], [137, 6], [138, 7],
]);
/** Earth (133) is the lone living Sol world and cannot produce a successful
    mining action. Chapter 1 therefore accepts only these canonical dead-world
    sources, while Chapter 3 accepts every successfully mined canonical world. */
export const SOL_DEAD_WORLD_SEEDS: ReadonlySet<number> = new Set([131, 132, 134, 135, 136, 137, 138]);
export interface AscGoal {
  readonly id: string;
  readonly ev: string;
  readonly n: number;
  readonly t: string;
  readonly scope?: 'sol' | 'nonsol';
}
export interface AscChapter {
  readonly id: string;
  readonly name: string;
  readonly intro: string;
  readonly goals: readonly AscGoal[];
  readonly unlockNote: string;
}
function freezeAscChapter(chapter: AscChapter): AscChapter {
  const goals = Object.freeze(chapter.goals.map((goal) => Object.freeze({ ...goal })));
  return Object.freeze({ ...chapter, goals });
}
function freezeAscChapters(chapters: readonly AscChapter[]): readonly AscChapter[] {
  return Object.freeze(chapters.map(freezeAscChapter));
}
export const ASC_CHAPTERS_DATA: readonly AscChapter[] = freezeAscChapters([
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
]);

/** Classify the exact Sol hierarchy, not a globally non-unique planet seed.
    `bankLandfall` separately requires a registered canonical address before
    this pure scope projection can grant progress. */
export function isSolLandfallAddress(source: CanonicalCF1WorldAddress): boolean {
  return source.galaxy.seed === HOME_GAL_SEED
    && source.galaxy.x === HOME_POS.x
    && source.galaxy.y === HOME_POS.y
    && source.star.seed === SOL_SEED
    && source.star.x === SOL_POS.x
    && source.star.y === SOL_POS.y
    && SOL_WORLD_ORDINALS.get(source.planet.seed) === source.planet.ordinal;
}

/** The Chapter-1 mining scope is the exact Sol hierarchy plus one of its
    registered dead-world sources. Keeping this projection beside the
    landfall classifier prevents a seed-only mining shortcut from drifting
    away from the complete galaxy/star/planet identity law. */
export function isSolDeadWorldAddress(source: CanonicalCF1WorldAddress): boolean {
  return isSolLandfallAddress(source)
    && SOL_DEAD_WORLD_SEEDS.has(source.planet.seed);
}

/** ascEvent's banking rule for landfalls (main.js 22826 review catch):
    progress BANKS for every chapter from the current one on — a player who
    out-lands the current chapter must not lose the later credit. Mutates
    `prog` in place (the save's ascProg object); returns true if changed. */
export function bankLandfall(
  ascCh: number,
  prog: Record<string, number>,
  source: CanonicalCF1WorldAddress,
): boolean {
  if (!Number.isInteger(ascCh) || ascCh < 0 || ascCh >= ASC_CHAPTERS_DATA.length
    || !isCanonicalCF1Address(source) || !('planet' in source)) return false;
  const isSol = isSolLandfallAddress(source);
  let changed = false;
  for (let ci = ascCh; ci < ASC_CHAPTERS_DATA.length; ci++) {
    for (const g of ASC_CHAPTERS_DATA[ci]!.goals) {
      if (g.ev !== 'landfall') continue;
      if (g.scope === 'sol' && !isSol) continue;
      if (g.scope === 'nonsol' && isSol) continue;
      const have = prog[g.id] || 0;
      if (have < g.n) { prog[g.id] = have + 1; changed = true; }
    }
  }
  return changed;
}

function bankGoal(prog: Record<string, number>, goal: AscGoal): boolean {
  const prior = prog[goal.id] || 0;
  if (!Number.isSafeInteger(prior) || prior < 0 || prior >= goal.n) return false;
  prog[goal.id] = prior + 1;
  return true;
}

/** Bank one source-proven alien-world life discovery. The app transaction is
    responsible for calling this only for the first durable successful
    observation on that complete canonical world; misses, repeats and stale
    presentation paths never reach this pure counter. Sol is excluded by its
    exact hierarchy rather than by the globally non-unique planet seed. */
export function bankBioscan(
  ascCh: number,
  prog: Record<string, number>,
  source: CanonicalCF1WorldAddress,
): boolean {
  if (!Number.isInteger(ascCh) || ascCh < 0 || ascCh >= ASC_CHAPTERS_DATA.length
    || !isCanonicalCF1Address(source) || !('planet' in source)
    || isSolLandfallAddress(source)) return false;
  let changed = false;
  for (let ci = ascCh; ci < ASC_CHAPTERS_DATA.length; ci++) {
    for (const goal of ASC_CHAPTERS_DATA[ci]!.goals) {
      if (goal.ev === 'bioscan' && bankGoal(prog, goal)) changed = true;
    }
  }
  return changed;
}

/** Bank one successful `mined` action tick, never the number of extracted
    loads. The Chapter 1 source check is the full canonical Sol address plus a
    dead-world leaf; Chapter 3 intentionally has no source filter. */
export function bankMinedAction(
  ascCh: number,
  prog: Record<string, number>,
  source: CanonicalCF1WorldAddress,
): boolean {
  if (!Number.isInteger(ascCh) || ascCh < 0 || ascCh >= ASC_CHAPTERS_DATA.length
    || !isCanonicalCF1Address(source) || !('planet' in source)) return false;
  const isSolDeadWorld = isSolDeadWorldAddress(source);
  let changed = false;
  for (let ci = ascCh; ci < ASC_CHAPTERS_DATA.length; ci++) {
    for (const goal of ASC_CHAPTERS_DATA[ci]!.goals) {
      if (goal.ev !== 'mined') continue;
      if (goal.id === 'c1-mine' && !isSolDeadWorld) continue;
      if (bankGoal(prog, goal)) changed = true;
    }
  }
  return changed;
}

export type CharterFabricationCategory = 'part' | 'comp' | 'sys' | 'gear' | 'relic';
export interface CharterFixedFabricationEvent {
  readonly id: string;
  readonly category: CharterFabricationCategory;
}

/** Bank the mature build's exact `crafted` goal filters. This accepts only a
    successful fixed-fabrication event supplied by the trusted app join:
    category-based basic parts/components, exact system ids, and non-relic
    explorer gear. Progress still banks into later chapters and caps at n. */
export function bankFixedFabrication(
  ascCh: number,
  prog: Record<string, number>,
  event: CharterFixedFabricationEvent,
): boolean {
  if (!Number.isInteger(ascCh) || ascCh < 0 || ascCh >= ASC_CHAPTERS_DATA.length) return false;
  if (typeof event.id !== 'string' || event.id.length < 1) return false;
  let changed = false;
  for (let ci = ascCh; ci < ASC_CHAPTERS_DATA.length; ci++) {
    for (const goal of ASC_CHAPTERS_DATA[ci]!.goals) {
      if (goal.ev !== 'crafted') continue;
      const matches = goal.id === 'c1-part' ? event.category === 'part'
        : goal.id === 'c1-comp' ? event.category === 'comp'
          : goal.id === 'c1-jump' ? event.id === 'jumpdrive'
            : goal.id === 'c2-array' ? event.id === 'array'
              : goal.id === 'c3-gear' ? event.category === 'gear'
                : goal.id === 'c3-ig' && event.id === 'igdrive';
      if (matches && bankGoal(prog, goal)) changed = true;
    }
  }
  return changed;
}

/** Bank the mature build's exact `bred` goal filter. Legacy `breedPair`
    emitted `{ ok: true }` only after a successful offspring result, and
    `ascEvent` then banked that deed into every chapter from the current one
    forward. Failure, refusal, and any non-true result must remain inert. */
export function bankBredSuccess(
  ascCh: number,
  prog: Record<string, number>,
  succeeded: boolean,
): boolean {
  if (succeeded !== true
    || !Number.isInteger(ascCh) || ascCh < 0 || ascCh >= ASC_CHAPTERS_DATA.length) return false;
  let changed = false;
  for (let ci = ascCh; ci < ASC_CHAPTERS_DATA.length; ci++) {
    for (const goal of ASC_CHAPTERS_DATA[ci]!.goals) {
      if (goal.ev === 'bred' && bankGoal(prog, goal)) changed = true;
    }
  }
  return changed;
}

/** Bank the mature build's exact `conquest` chapter event. The trusted
    combat transaction calls this only after a first durable world settlement;
    losses, draws, already-conquered worlds, Training, and precommit gestures
    never reach this pure counter. */
export function bankConquest(
  ascCh: number,
  prog: Record<string, number>,
  settled: boolean,
): boolean {
  if (settled !== true
    || !Number.isInteger(ascCh) || ascCh < 0 || ascCh >= ASC_CHAPTERS_DATA.length) return false;
  let changed = false;
  for (let ci = ascCh; ci < ASC_CHAPTERS_DATA.length; ci++) {
    for (const goal of ASC_CHAPTERS_DATA[ci]!.goals) {
      if (goal.ev === 'conquest' && bankGoal(prog, goal)) changed = true;
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

/* The playable Phase-4 slice has exact landfall, mining, fixed-fabrication,
   successful-breeding and first-successful-alien-world bioscan goal writers. Imported chapter
   reconciliation may acknowledge already-proven progress, but creates no
   goal credit, drive, reward, or reach. Keep that capability boundary in the
   pure scene layer so the board, objective chip and chapter-advance seam
   cannot each make a different promise. The full legacy data above is
   intentionally NOT rewritten or filtered in place: imported saves retain
   their canonical progress and can still gate reach. */
export type V2CharterState = 'actionable' | 'boundary' | 'complete';
export interface V2CharterProjection {
  readonly id: string;
  readonly name: string;
  readonly intro: string;
  readonly goals: readonly AscGoal[];
  readonly state: V2CharterState;
  readonly note: string;
}

const V2_CHARTER_COPY: Readonly<Record<string, { intro: string }>> = Object.freeze({
  ch1: Object.freeze({
    intro: 'Learn Sol: make planetfall, mine its dead worlds, and fabricate the Jump Drive.',
  }),
  ch2: Object.freeze({
    intro: 'Explore beyond Sol, discover life, conquer a world, and build the Long-Range Array.',
  }),
  ch3: Object.freeze({
    intro: 'Breed a hybrid bloodline, mine, gear up, and build the Intergalactic Drive.',
  }),
});
const V2_CHARTER_BOUNDARY_NOTE =
  'Further Charter work opens only when its real actions are available in this development slice.';
const V2_CHARTER_COMPLETE_NOTE =
  'This imported chapter record is complete. Its established reach remains preserved.';

/* A chapter number alone is not a travel entitlement. Imported saves can
   preserve a completed chapter record while lacking its associated drive;
   only the derived saved stage may expose a non-Sol landfall or advance that
   record. Keep the default at Sol-only so an omitted caller fails closed. */
function v2Stage(stage: number | undefined): number {
  return Math.max(0, Math.min(3, Math.trunc(stage ?? 0)));
}
function goalIsInV2Reach(goal: AscGoal, stage: number): boolean {
  return goal.scope !== 'nonsol' || stage >= 1;
}
function goalHasV2Writer(goal: AscGoal): boolean {
  return goal.ev === 'landfall' || goal.ev === 'mined'
    || goal.ev === 'crafted' || goal.ev === 'bioscan' || goal.ev === 'bred'
    || goal.ev === 'conquest';
}
function completionStageForChapter(ascCh: number): number {
  return Math.min(ASC_CHAPTER_COUNT, ascCh + 1);
}

/**
 * Player-facing view of the current Charter chapter. Only goals with an exact
 * v2 outcome writer are shown. A visible live milestone may finish without
 * making the canonical chapter complete; that is the boundary, not permission
 * to manufacture a new reach tier.
 */
export function projectV2Charter(ascCh: number, prog: Record<string, number>, stage?: number): V2CharterProjection | null {
  const ch = ASC_CHAPTERS_DATA[ascCh];
  if (!ch) return null;
  const savedStage = v2Stage(stage);
  /* A chapter index does not prove its preceding drive. Hide every action when
     the saved build cannot back the current chapter's reach. */
  const chapterReachBacked = savedStage >= ascCh;
  const goals = Object.freeze(ch.goals.filter((goal) => chapterReachBacked
    && goalHasV2Writer(goal)
    && goalIsInV2Reach(goal, savedStage)));
  const actionable = goals.some((goal) => (prog[goal.id] || 0) < goal.n);
  const complete = chapterGoalsDone(ascCh, prog);
  const completionReachBacked = complete && savedStage >= completionStageForChapter(ascCh);
  const copy = V2_CHARTER_COPY[ch.id];
  /* The canonical chapter list is closed and versioned with the legacy game.
     Still fail safe if a future source adds a chapter before its v2 copy:
     preserve its name/id but never fall back to its potentially unavailable
     legacy intro. */
  const intro = copy?.intro || 'This imported Charter record is preserved in this development slice.';
  return Object.freeze({
    id: ch.id,
    name: ch.name,
    intro,
    goals,
    state: completionReachBacked ? 'complete' : (actionable ? 'actionable' : 'boundary'),
    note: completionReachBacked ? V2_CHARTER_COMPLETE_NOTE : V2_CHARTER_BOUNDARY_NOTE,
  });
}

/** The objective chip gets only the first unfinished live action, never the
    next canonical goal after the slice boundary. */
export function currentV2Objective(ascCh: number, prog: Record<string, number>, stage?: number):
  { text: string; have: number; need: number; chapter: string } | null {
  const projection = projectV2Charter(ascCh, prog, stage);
  const goal = projection?.goals.find((candidate) => (prog[candidate.id] || 0) < candidate.n);
  if (!projection || !goal) return null;
  return {
    text: goal.t,
    have: Math.min(prog[goal.id] || 0, goal.n),
    need: goal.n,
    chapter: projection.name,
  };
}

/**
 * Canonical-completion eligibility retained for projections, reconciliation,
 * and direct consumers. Completing every currently visible live goal is a
 * boundary state, not a synthetic chapter completion or reach unlock.
 */
export function canAdvanceV2Chapter(ascCh: number, prog: Record<string, number>, stage?: number): boolean {
  return projectV2Charter(ascCh, prog, stage)?.state === 'complete';
}

export interface V2CharterReconciliation {
  readonly nextChapter: number;
  readonly completed: readonly V2CharterProjection[];
}

/**
 * Recover an imported expedition whose current chapter was already complete
 * before this app observed a new landfall. One stable saved reach stage backs
 * every transition; progress alone never manufactures reach. Invalid starting
 * positions fail closed, and every consecutive canonical completion advances
 * just as the mature app's chapter loop did.
 */
export function reconcileV2Chapters(
  ascCh: number,
  prog: Record<string, number>,
  stage?: number,
): V2CharterReconciliation | null {
  if (!Number.isInteger(ascCh) || ascCh < 0 || ascCh > ASC_CHAPTER_COUNT) return null;
  const savedStage = v2Stage(stage);
  const completed: V2CharterProjection[] = [];
  let nextChapter = ascCh;
  while (nextChapter < ASC_CHAPTER_COUNT) {
    const projection = projectV2Charter(nextChapter, prog, savedStage);
    if (projection?.state !== 'complete') break;
    completed.push(projection);
    nextChapter++;
  }
  return Object.freeze({ nextChapter, completed: Object.freeze(completed) });
}

/** Canonical/legacy objective order, retained for parity and import audits.
    Current v2 UI must use currentV2Objective above. */
export function currentObjective(ascCh: number, prog: Record<string, number>): { text: string; have: number; need: number; chapter: string } | null {
  const ch = ASC_CHAPTERS_DATA[ascCh];
  if (!ch) return null;   /* the Ascent is complete */
  const g = ch.goals.find((gg) => (prog[gg.id] || 0) < gg.n) || ch.goals[ch.goals.length - 1]!;
  return { text: g.t, have: Math.min(prog[g.id] || 0, g.n), need: g.n, chapter: ch.name };
}
