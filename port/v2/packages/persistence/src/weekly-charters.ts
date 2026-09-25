/* Weekly Charters on the game's OWN clock (Nick 2026-09-25: "make sure that moving the clock does not reset the charter… record the
   time of the weekly charter somewhere as part of the game so that you can have a counter… don't use V1").

   The counter is F4's persisted ACTIVE-PLAY clock: milliseconds the game has been open, visible and answerable, committed with every
   action in the same transaction. The device clock never enters it, so moving the clock (forward or back), reloading or reinstalling
   the app neither resets nor advances a Charter cycle. A cycle is WEEKLY_CHARTER_CYCLE_ACTIVE_MS of active play; its index is
   floor(activePlayMs / cycle). The save records the cycle the weekly state belongs to (`chWeek`); a transaction whose active-play
   snapshot is in a later cycle rolls the board forward once (the active clock only grows, so a roll can never go backward).

   The slate for cycle k is deterministic (the same three Charters for every explorer in cycle k; no reroll exists). A weekly Charter
   counts only deeds done AFTER it is accepted; completion pays Stardust and one honoured Charter exactly once per cycle. Weekly and
   starter Charters share the three-slot cap. The board opens when the five trades are learned. Pure: no Date.now, no Math.random. */
import { hashInt } from '@cf/domain-rand';
import type { SaveStateV2 } from './import-v2.js';

/** One Charter week = four hours of active play (decisions queue D8; one constant). */
export const WEEKLY_CHARTER_CYCLE_ACTIVE_MS = 4 * 60 * 60 * 1000;
export const WEEKLY_CHARTER_SLATE_SIZE = 3;
export const WEEKLY_CHARTER_CAP_V1 = 3; // shared with the starter Charters
const TRADES = Object.freeze(['st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq']);

export type WeeklyCharterEventKindV1 = 'landfall' | 'mined' | 'bioscan' | 'crafted' | 'conquest';
export type WeeklyCharterIdV1 = 'wk-land' | 'wk-mine' | 'wk-scan' | 'wk-craft' | 'wk-conq';
export interface WeeklyCharterDefinitionV1 {
  readonly id: WeeklyCharterIdV1; readonly event: WeeklyCharterEventKindV1; readonly count: number;
  readonly title: string; readonly description: string; readonly stardust: number;
}
/** The live weekly pool: every definition has a v2 event owner. Arc 6 owns conquest;
 * species, feeding and breeding join when their owners report weekly progress. */
export const WEEKLY_CHARTER_DEFINITIONS_V1: readonly WeeklyCharterDefinitionV1[] = Object.freeze([
  Object.freeze({ id: 'wk-land', event: 'landfall', count: 3, title: 'Boots on new ground', description: 'Make planetfall on 3 worlds you have never landed on.', stardust: 20 }),
  Object.freeze({ id: 'wk-mine', event: 'mined', count: 3, title: 'Deep veins', description: 'Mine deposits 3 times.', stardust: 20 }),
  Object.freeze({ id: 'wk-scan', event: 'bioscan', count: 2, title: 'Field naturalist', description: 'Discover life on 2 worlds.', stardust: 25 }),
  Object.freeze({ id: 'wk-craft', event: 'crafted', count: 2, title: 'Workshop hours', description: 'Fabricate 2 items at the Shipyard.', stardust: 20 }),
  Object.freeze({ id: 'wk-conq', event: 'conquest', count: 1, title: 'Claim new ground', description: 'Conquer a world after accepting this Charter.', stardust: 30 }),
] as const);
const BY_ID = new Map(WEEKLY_CHARTER_DEFINITIONS_V1.map((d) => [d.id, d]));
const isWeeklyId = (id: string): boolean => id.startsWith('wk-');

export function weeklyCharterCycleV1(activePlayMs: number): number {
  if (!Number.isSafeInteger(activePlayMs) || activePlayMs < 0) throw new RangeError('weekly Charter active-play clock must be a non-negative safe integer');
  return Math.floor(activePlayMs / WEEKLY_CHARTER_CYCLE_ACTIVE_MS);
}
/** Active play left in this cycle, in ms (for "next board in 2h 13m of play"). */
export function weeklyCharterRemainingActiveMsV1(activePlayMs: number): number {
  return WEEKLY_CHARTER_CYCLE_ACTIVE_MS - (activePlayMs - weeklyCharterCycleV1(activePlayMs) * WEEKLY_CHARTER_CYCLE_ACTIVE_MS);
}
/** The deterministic slate of cycle k: the pool ordered by a per-cycle hash, first WEEKLY_CHARTER_SLATE_SIZE. */
export function weeklyCharterSlateV1(cycle: number): readonly WeeklyCharterIdV1[] {
  if (!Number.isSafeInteger(cycle) || cycle < 0) throw new RangeError('weekly Charter cycle must be a non-negative safe integer');
  const ranked = WEEKLY_CHARTER_DEFINITIONS_V1.map((d, i) => ({ id: d.id, rank: hashInt(cycle >>> 0, 0x57EE0 + i, 0xC4A7) >>> 0, i }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i);
  return Object.freeze(ranked.slice(0, WEEKLY_CHARTER_SLATE_SIZE).map((r) => r.id));
}
export function weeklyCharterBoardOpenV1(state: Pick<SaveStateV2, 'chDone'>): boolean {
  return TRADES.every((id) => state.chDone.includes(id));
}

/** Roll the weekly state to the cycle of `activePlayMs` (mutates the draft). Forward-only by construction; a saved cycle AHEAD of the
 *  active clock can only come from an imported or legacy calendar value, and is normalized once with no payout. Returns what expired. */
export function rollWeeklyCharterCycleV1(draft: SaveStateV2, activePlayMs: number): Readonly<{ rolled: boolean; cycle: number; expired: readonly string[] }> {
  const cycle = weeklyCharterCycleV1(activePlayMs), saved = Number.isSafeInteger(draft.chWeek) ? draft.chWeek : -1;
  if (saved === cycle) return Object.freeze({ rolled: false, cycle, expired: Object.freeze([]) });
  // before the board exists (the trades unlearned) and with no weekly state to expire, nothing is written: an ordinary action by an
  // explorer who has never seen the weekly board changes no Charter field
  if (!weeklyCharterBoardOpenV1(draft) && !draft.chacc.some(isWeeklyId) && !Object.keys(draft.chProg).some(isWeeklyId)) {
    return Object.freeze({ rolled: false, cycle, expired: Object.freeze([]) });
  }
  const expired = draft.chacc.filter(isWeeklyId);
  draft.chacc = draft.chacc.filter((id) => !isWeeklyId(id));
  draft.chProg = Object.fromEntries(Object.entries(draft.chProg).filter(([id]) => !isWeeklyId(id)));
  draft.chWeek = cycle;
  return Object.freeze({ rolled: true, cycle, expired: Object.freeze(expired) });
}

export type WeeklyCharterRowStatusV1 = 'available' | 'accepted' | 'completed' | 'locked';
export interface WeeklyCharterBoardV1 {
  readonly schema: 'cf-v2-weekly-charters/v1'; readonly cycle: number; readonly open: boolean; readonly remainingActiveMs: number;
  readonly acceptedCount: number; readonly cap: number;
  readonly rows: readonly Readonly<{ definition: WeeklyCharterDefinitionV1; status: WeeklyCharterRowStatusV1; progress: number; lockedReason: string | null }>[];
}
/** The board as the player sees it at `activePlayMs` (a projection: a due roll is shown, and written by the next Charter action). */
export function projectWeeklyCharterBoardV1(state: SaveStateV2, activePlayMs: number): WeeklyCharterBoardV1 {
  const view = structuredClone({ chacc: state.chacc, chProg: state.chProg, chWeek: state.chWeek, chDone: state.chDone }) as SaveStateV2;
  const { cycle } = rollWeeklyCharterCycleV1(view, activePlayMs), open = weeklyCharterBoardOpenV1(view), accepted = new Set(view.chacc);
  const rows = weeklyCharterSlateV1(cycle).map((id) => { const definition = BY_ID.get(id)!, progress = Math.min(view.chProg[id] ?? 0, definition.count);
    const status: WeeklyCharterRowStatusV1 = !open ? 'locked' : accepted.has(id) ? 'accepted' : progress >= definition.count ? 'completed' : 'available';
    return Object.freeze({ definition, status, progress, lockedReason: open ? null : 'Learn the five trades to open the weekly board.' }); });
  return Object.freeze({ schema: 'cf-v2-weekly-charters/v1', cycle, open, remainingActiveMs: weeklyCharterRemainingActiveMsV1(activePlayMs),
    acceptedCount: view.chacc.length, cap: WEEKLY_CHARTER_CAP_V1, rows: Object.freeze(rows) });
}

export interface WeeklyCharterStageFactsV1 {
  readonly changed: boolean; readonly rolled: boolean; readonly cycle: number; readonly expired: readonly string[];
  readonly acceptedId: WeeklyCharterIdV1 | null; readonly progressIds: readonly WeeklyCharterIdV1[];
  readonly completions: readonly Readonly<{ id: WeeklyCharterIdV1; stardust: number }>[];
}
export type WeeklyCharterStageOutcomeV1 = Readonly<{ kind: 'ready'; facts: WeeklyCharterStageFactsV1 }> | Readonly<{ kind: 'refused'; reason: string }>;

/** Accept a weekly Charter of the current cycle (mutates the draft). */
export function stageWeeklyCharterAcceptV1(input: Readonly<{ draft: SaveStateV2; id: string; activePlayMs: number }>): WeeklyCharterStageOutcomeV1 {
  try {
    const roll = rollWeeklyCharterCycleV1(input.draft, input.activePlayMs);
    const board = projectWeeklyCharterBoardV1(input.draft, input.activePlayMs), row = board.rows.find((r) => r.definition.id === input.id);
    if (!board.open) return Object.freeze({ kind: 'refused', reason: 'Learn the five trades to open the weekly board.' });
    if (!row) return Object.freeze({ kind: 'refused', reason: 'that Charter is not on this week’s board' });
    if (row.status !== 'available') return Object.freeze({ kind: 'refused', reason: row.status === 'accepted' ? 'already accepted' : 'already completed this week' });
    if (input.draft.chacc.length >= WEEKLY_CHARTER_CAP_V1) return Object.freeze({ kind: 'refused', reason: 'three accepted Charters is the exact cap' });
    input.draft.chacc = [...input.draft.chacc, row.definition.id];
    input.draft.chProg = { ...input.draft.chProg, [row.definition.id]: 0 }; // counts only deeds AFTER acceptance
    return Object.freeze({ kind: 'ready', facts: Object.freeze({ changed: true, rolled: roll.rolled, cycle: roll.cycle, expired: roll.expired, acceptedId: row.definition.id, progressIds: Object.freeze([]), completions: Object.freeze([]) }) });
  } catch (error) { return Object.freeze({ kind: 'refused', reason: error instanceof Error ? error.message : 'weekly Charter acceptance failed' }); }
}

/** Count one game event for every accepted weekly Charter it matches (mutates the draft); completion pays once. */
export function stageWeeklyCharterEventV1(input: Readonly<{ draft: SaveStateV2; event: Readonly<{ kind: string }>; activePlayMs: number }>): WeeklyCharterStageOutcomeV1 {
  try {
    const roll = rollWeeklyCharterCycleV1(input.draft, input.activePlayMs);
    const progressIds: WeeklyCharterIdV1[] = [], completions: { id: WeeklyCharterIdV1; stardust: number }[] = [];
    const matching = input.draft.chacc.filter(id => BY_ID.get(id as WeeklyCharterIdV1)?.event === input.event.kind);
    if (new Set(matching).size !== matching.length) throw new Error('weekly Charter acceptance is duplicated');
    for (const id of matching) {
      const progress = input.draft.chProg[id] ?? 0, definition = BY_ID.get(id as WeeklyCharterIdV1)!;
      if (!Number.isSafeInteger(progress) || progress < 0 || progress >= definition.count) throw new Error('weekly Charter progress is stale or malformed');
    }
    for (const id of [...input.draft.chacc]) {
      const definition = BY_ID.get(id as WeeklyCharterIdV1); if (!definition || definition.event !== input.event.kind) continue;
      const next = Math.min(definition.count, (input.draft.chProg[id] ?? 0) + 1);
      input.draft.chProg = { ...input.draft.chProg, [id]: next }; progressIds.push(definition.id);
      if (next >= definition.count) {
        input.draft.chacc = input.draft.chacc.filter((a) => a !== id);
        if (!Number.isSafeInteger(input.draft.essence) || input.draft.essence > Number.MAX_SAFE_INTEGER - definition.stardust) throw new RangeError('Stardust would overflow');
        input.draft.essence += definition.stardust;
        input.draft.stats = { ...input.draft.stats, charters: (input.draft.stats.charters ?? 0) + 1 };
        completions.push({ id: definition.id, stardust: definition.stardust });
      }
    }
    return Object.freeze({ kind: 'ready', facts: Object.freeze({ changed: roll.rolled || progressIds.length > 0, rolled: roll.rolled, cycle: roll.cycle, expired: roll.expired,
      acceptedId: null, progressIds: Object.freeze(progressIds), completions: Object.freeze(completions.map((c) => Object.freeze(c))) }) });
  } catch (error) { return Object.freeze({ kind: 'refused', reason: error instanceof Error ? error.message : 'weekly Charter event failed' }); }
}

