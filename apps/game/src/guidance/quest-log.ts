/* The objective chip and the quest log under it (rules of LEGACY main.js:22523-22660).

   The chip is the quest log's one line: the thing being done now, with live progress. An accepted charter
   outranks the chapter (it was chosen); with none accepted the chapter's next goal keeps the line filled. With no
   objective, or when the explorer has stalled, the chip offers the best action available instead. The log lists
   the chapter goal and every accepted charter. Both come back as data: the screen draws them. */
import type { IconName } from '../ui';
import type { GuidanceView } from './next-step';
import { nextBest, type Suggestion } from './stall';

const CHIP_OBJECTIVE_CHARACTERS = 34;
const CHIP_SUGGESTION_CHARACTERS = 44;
const countWords = (done: number, of: number): string => `${done} / ${of}`;

export type ObjectiveChip =
  | Readonly<{ kind: 'objective'; key: string; icon: IconName; text: string; done: number; of: number; count: string; more: number }>
  | Readonly<{ kind: 'suggestion'; key: 'stall'; icon: IconName; text: string; opens: Suggestion['opens'] }>;

function objectiveOf(view: GuidanceView): Extract<ObjectiveChip, { kind: 'objective' }> | null {
  const first = view.accepted[0];
  if (first !== undefined) {
    const of = first.count || 1, done = Math.min(first.progress, first.count);
    return {
      kind: 'objective', key: `ch:${first.id}`, icon: 'charter', text: (first.title || first.description || 'Contract').slice(0, CHIP_OBJECTIVE_CHARACTERS),
      done, of, count: countWords(done, of), more: view.accepted.length - 1,
    };
  }
  if (view.chapter === null) return null;
  const { goal } = view.chapter, done = Math.min(goal.progress, goal.count);
  return {
    kind: 'objective', key: `asc:${goal.id}`, icon: 'up', text: goal.text.slice(0, CHIP_OBJECTIVE_CHARACTERS),
    done, of: goal.count, count: countWords(done, goal.count), more: 0,
  };
}

/** The chip: the objective, or the suggestion when there is none or `stalled`; null in training. `stalled` is the stall counter's ten presses. */
export function objectiveChip(view: GuidanceView, stalled: boolean): ObjectiveChip | null {
  if (!view.trained) return null;
  const objective = objectiveOf(view);
  if (objective !== null && !stalled) return objective;
  const best = nextBest(view);
  if (best === null) return objective;
  return { kind: 'suggestion', key: 'stall', icon: 'idea', text: best.text.slice(0, CHIP_SUGGESTION_CHARACTERS), opens: best.opens };
}

/** The chip pulses when its own goal's progress moves up: `before` is the chip last shown. */
export function chipProgressMoved(before: ObjectiveChip | null, now: ObjectiveChip | null): boolean {
  return before?.kind === 'objective' && now?.kind === 'objective' && before.key === now.key && now.done > before.done;
}

export interface QuestRow {
  readonly icon: IconName;
  readonly text: string;
  readonly done: number;
  readonly of: number;
  /** "done / of", as the row shows it. */
  readonly count: string;
  /** The width of the row's bar. */
  readonly percent: number;
}
/** The fixed words of the log. `empty` stands in when there is no row. */
export const QUEST_LOG_WORDS = Object.freeze({
  heading: 'Quest log',
  empty: 'No contract accepted — open the board and take one.',
  foot: Object.freeze({ icon: 'charter', text: 'Open the Charters board' }),
});

const row = (icon: IconName, text: string, progress: number, count: number): QuestRow => {
  const of = count || 1, done = Math.min(progress, of);
  return { icon, text, done, of, count: countWords(done, of), percent: Math.round((done / of) * 100) };
};

/** The log: the chapter goal, then every accepted charter; null in training. */
export function questLog(view: GuidanceView): { chapter: QuestRow | null; charters: QuestRow[]; empty: boolean } | null {
  if (!view.trained) return null;
  const chapter = view.chapter === null ? null : row('up', view.chapter.goal.text, view.chapter.goal.progress, view.chapter.goal.count);
  const charters = view.accepted.map((c) => row('charter', c.title || 'Contract', c.progress, c.count));
  return { chapter, charters, empty: chapter === null && charters.length === 0 };
}
