/* What to do next: the goal the game names, and whether to say it
   (rules of LEGACY main.js:22461-22521).

   The game names the explorer's next goal once after login and once when the session goes quiet. It is silent in
   training, silent while a modal is open, and never says the same goal twice in a session. Nothing here keeps
   time or draws: the screen owns the timers, through the platform clock, and the toast. */
import type { CodexEntry, SaveStateV2, WeeklyCharterBoardV1 } from '@cf/persistence';
import { ASC_CHAPTERS_DATA } from '@cf/scene';
import type { IconName } from '../ui';
import type { StarterCharterBoardV1 } from './starter-board';

/** After login the plan is said once the dust settles. */
export const LOGIN_NUDGE_MS = 14_000;
/** Five quiet minutes earn one pointer. */
export const IDLE_NUDGE_MS = 300_000;
/** How often the quiet is measured. */
export const IDLE_POLL_MS = 60_000;
/** The Prime Codex holds nine Signatures. */
const SIGNATURES = 9;

/** A charter as guidance reads it. */
export interface GuidanceCharter {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly count: number;
  readonly progress: number;
  readonly pays: number;
  /** A charter of the weekly board: it is a new goal on each new board. */
  readonly weekly: boolean;
}
/** Everything the guidance rules read, as plain data. */
export interface GuidanceView {
  /** Training is done. Until then guidance says nothing. */
  readonly trained: boolean;
  /** The current chapter and its first goal still short of its count; null with no chapter left or every goal met. */
  readonly chapter: Readonly<{ name: string; goal: Readonly<{ id: string; text: string; count: number; progress: number }> }> | null;
  /** Accepted and not yet complete, in the order they were accepted. */
  readonly accepted: readonly GuidanceCharter[];
  /** Revealed, reachable and not yet accepted: the chains in order, then the weekly board. */
  readonly available: readonly GuidanceCharter[];
  /** The weekly board's number. */
  readonly week: number;
  /** Prime Signatures held. */
  readonly signatures: number;
  /** The name of the first thing the explorer can afford to build, or null. */
  readonly craftable: string | null;
  /** Entries in the Star Atlas. */
  readonly atlasEntries: number;
  /** Catalogued species of each kind. */
  readonly flora: number;
  readonly fauna: number;
}

export type NextStep =
  | Readonly<{ kind: 'chapter'; key: string; title: string; goal: string; done: number; of: number }>
  | Readonly<{ kind: 'charter'; key: string; title: string; description: string; pays: number; done: number; of: number }>
  | Readonly<{ kind: 'charter-waiting'; key: string; title: string; pays: number }>
  | Readonly<{ kind: 'long-road'; key: string; signaturesLeft: number }>;

const weekOf = (charter: GuidanceCharter, view: GuidanceView): string => (charter.weekly ? `:${view.week}` : '');

/** The next goal, by priority: the chapter, an accepted charter, a charter waiting for its accept, the long road. */
export function nextStepGoal(view: GuidanceView): NextStep | null {
  if (!view.trained) return null;
  if (view.chapter !== null) {
    const { name, goal } = view.chapter;
    return { kind: 'chapter', key: `asc:${goal.id}`, title: name.replace(/^Chapter \d+ — /, ''), goal: goal.text, done: Math.min(goal.progress, goal.count), of: goal.count };
  }
  const accepted = view.accepted[0];
  if (accepted !== undefined) {
    return {
      kind: 'charter', key: `ch:${accepted.id}${weekOf(accepted, view)}`, title: accepted.title, description: accepted.description,
      pays: accepted.pays, done: Math.min(accepted.progress, accepted.count), of: accepted.count,
    };
  }
  const waiting = view.available[0];
  if (waiting !== undefined) return { kind: 'charter-waiting', key: `chacc:${waiting.id}${weekOf(waiting, view)}`, title: waiting.title, pays: waiting.pays };
  if (view.signatures < SIGNATURES) return { kind: 'long-road', key: `prime:${view.signatures}`, signaturesLeft: SIGNATURES - view.signatures };
  return null;
}

/** Whether to say `step` now. The caller adds the step's key to the said set when it does. */
export function shouldNudge(
  step: NextStep | null,
  state: Readonly<{ training: boolean; modalOpen: boolean; saidThisSession: ReadonlySet<string> }>,
): boolean {
  return step !== null && !state.training && !state.modalOpen && !state.saidThisSession.has(step.key);
}

/** Words with icons among them: each part is text, or the name of an icon drawn in its place in the line. */
export type CopyPart = string | Readonly<{ icon: IconName }>;
export interface NudgeCopy {
  /** Drawn before the title. */
  readonly icon: IconName;
  readonly title: string;
  readonly message: readonly CopyPart[];
  /** What a press on the notice opens. */
  readonly opens: 'charters' | null;
}
const CHARTER: CopyPart = Object.freeze({ icon: 'charter' });
const STARDUST: CopyPart = Object.freeze({ icon: 'stardust' });
const counted = (done: number, of: number): string => (of > 1 ? ` (${done} / ${of})` : '');

/** The notice that says `step`. */
export function nudgeCopy(step: NextStep): NudgeCopy {
  const icon = 'compass';
  switch (step.kind) {
    case 'chapter':
      return {
        icon, title: `Next Step — ${step.title}`, opens: 'charters',
        message: [`${step.goal}${counted(step.done, step.of)}. The chapter rides atop your `, CHARTER, ' Charters board.'],
      };
    case 'charter':
      return {
        icon, title: `Next Charter — ${step.title}`, opens: 'charters',
        message: [`${step.description}${counted(step.done, step.of)} Pays +${step.pays} `, STARDUST, ' on completion.'],
      };
    case 'charter-waiting':
      return {
        icon, title: `A Charter Awaits — ${step.title}`, opens: 'charters',
        message: ['Accept it on the ', CHARTER, ` Charters board — pays +${step.pays} `, STARDUST, '.'],
      };
    case 'long-road':
      return {
        icon, title: 'The Long Road', opens: null,
        message: [`The board is clear — the Prime Codex waits. ${step.signaturesLeft} Signature${step.signaturesLeft === 1 ? '' : 's'} left; the ✦ Prime Codex (the dock — or the right rail on desktop) names the next.`],
      };
  }
}

type BoardRow = Readonly<{
  definition: Readonly<{ id: string; title: string; description: string; count: number; stardust: number }>;
  status: string;
  progress: number;
}>;
const charterOf = (row: BoardRow, weekly: boolean): GuidanceCharter => Object.freeze({
  id: row.definition.id, title: row.definition.title, description: row.definition.description,
  count: row.definition.count, progress: row.progress, pays: row.definition.stardust, weekly,
});

/** The view of a save and its two boards. What the explorer can afford to build is the fabricator's to say. */
export function guidanceView(input: Readonly<{
  state: Pick<SaveStateV2, 'tutDone' | 'ascCh' | 'ascProg' | 'chacc' | 'primeFill' | 'logMap'> & { readonly codex: ReadonlyArray<readonly [string, Pick<CodexEntry, 'kind'>]> };
  starter: StarterCharterBoardV1;
  weekly: WeeklyCharterBoardV1;
  craftable: string | null;
}>): GuidanceView {
  const { state, starter, weekly } = input;
  const rows = [...starter.rows.map((row) => [row, false] as const), ...weekly.rows.map((row) => [row, true] as const)];
  const withStatus = (status: string): GuidanceCharter[] => rows.filter(([row]) => row.status === status).map(([row, isWeekly]) => charterOf(row, isWeekly));
  const order = (charter: GuidanceCharter): number => state.chacc.indexOf(charter.id);
  const chapter = ASC_CHAPTERS_DATA[state.ascCh];
  const goal = chapter?.goals.find((g) => (state.ascProg[g.id] || 0) < g.n);
  const kinds = state.codex.map(([, entry]) => entry.kind);
  return Object.freeze({
    trained: state.tutDone,
    chapter: chapter !== undefined && goal !== undefined
      ? Object.freeze({ name: chapter.name, goal: Object.freeze({ id: goal.id, text: goal.t, count: goal.n, progress: state.ascProg[goal.id] || 0 }) })
      : null,
    accepted: Object.freeze(withStatus('accepted').sort((a, b) => order(a) - order(b))),
    available: Object.freeze(withStatus('available')),
    week: weekly.cycle,
    signatures: Object.values(state.primeFill).filter(Boolean).length,
    craftable: input.craftable,
    atlasEntries: state.logMap.length,
    flora: kinds.filter((kind) => kind === 'Flora').length,
    fauna: kinds.filter((kind) => kind === 'Fauna').length,
  });
}
