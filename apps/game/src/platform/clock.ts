export interface Clocks {
  /** Wall time in ms: the save codec stamp and the last-backup time. Never gameplay. */
  wallNow(): number;
  /** Monotonic ms: the tab lease and active-play accrual. */
  monotonicNow(): number;
}

export const browserClocks: Clocks = {
  wallNow: () => Date.now(),
  monotonicNow: () => performance.now(),
};

/** The local calendar date and time of day of a wall time, to the minute. `mo` counts from 1. */
export function wallDateParts(ms: number): { y: number; mo: number; d: number; h: number; mi: number } {
  const date = new Date(ms);
  return { y: date.getFullYear(), mo: date.getMonth() + 1, d: date.getDate(), h: date.getHours(), mi: date.getMinutes() };
}
