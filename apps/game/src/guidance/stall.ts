/* The stall: presses with nothing to show for them, and the best action available now
   (rules of LEGACY main.js:22513-22516 and main.js:22866-22900).

   Ten presses with no progress event is the shape of a quit: the objective chip then offers a way forward
   instead of restating a goal the explorer already knows. An explorer with no objective is offered one at once.
   Nothing here keeps time or listens: the screen counts the presses and reports the progress. */
import type { GuidanceView } from './next-step';

export const STALL_PRESSES = 10;
/** The charters an explorer may hold at once. */
const ACCEPTED_CAP = 3;

/** The legacy game's events a player would call "something happened": each clears the stall. */
export const PROGRESS_EVENTS: ReadonlySet<string> = new Set(['survey', 'landfall', 'fed', 'bred', 'crafted', 'atlas-add', 'conquest',
  'specimen', 'searched', 'healed', 'mined', 'skimmed', 'tray', 'duel-done', 'chaccept', 'ascent-chapter']);

export type Suggestion = Readonly<{ text: string; opens: 'charters' | 'engineering' | 'atlas' | 'map' }>;

/** The best action available now, never one the explorer cannot take; null in training. */
export function nextBest(view: GuidanceView): Suggestion | null {
  if (!view.trained) return null;
  // a charter waiting to be accepted is always the cheapest step forward
  const waiting = view.available[0];
  if (waiting !== undefined && view.accepted.length < ACCEPTED_CAP) return { text: `Accept a charter — ${waiting.title}`, opens: 'charters' };
  // something that can be afforded
  if (view.craftable !== null) return { text: `Craft ${view.craftable} at the Shipyard`, opens: 'engineering' };
  // the catalogue gaps that gate the creature loop, only with somewhere in the Atlas to go
  if (view.atlasEntries > 0) {
    if (view.flora === 0) return { text: 'Land on a living world and Scavenge for flora', opens: 'atlas' };
    if (view.fauna < 2) return { text: 'Land on a living world and Discover Life', opens: 'atlas' };
    return { text: 'Travel from your Star Atlas', opens: 'atlas' };
  }
  return { text: 'Survey a world and press Land', opens: 'map' };
}

/**
 * Counts presses since the last progress. The screen calls `press` for each pointer press after training (keys do
 * not count), and `progress` for each progress event and for a press on the objective chip.
 */
export function stallCounter(): { press(): void; progress(): void; stalled(hasObjective: boolean): boolean } {
  let presses = 0;
  return {
    press() { presses += 1; },
    progress() { presses = 0; },
    stalled: (hasObjective) => !hasObjective || presses >= STALL_PRESSES,
  };
}
