import type { WriteHold } from '../events';

/** Whether this page may write the save. A hold can tighten, never loosen: only a reload clears one. */
export interface WriteGate {
  readonly hold: WriteHold;
  /** Why the save is protected; null until `protect` is called. */
  readonly detail: string | null;
  mayWrite(): boolean;
  /** Tightens the hold to `protected-payload`. */
  protect(detail: string): void;
}

export function createWriteGate(initial: WriteHold): WriteGate {
  let hold = initial;
  let detail: string | null = null;
  return {
    get hold() { return hold; },
    get detail() { return detail; },
    mayWrite: () => hold === false,
    protect(reason) {
      hold = 'protected-payload';
      detail = reason;
    },
  };
}
