import type { WriteHold } from '../events';

/** Whether this page may write the save. A hold can tighten, never loosen: only a reload clears one. */
export interface WriteGate {
  readonly hold: WriteHold;
  /** Why the hold was set after the boot; null until then. */
  readonly detail: string | null;
  mayWrite(): boolean;
  /** A page that could write is held as `transient-read`: storage failed it and may be tried again. A page
   *  already under a hold is left as it is. */
  holdTransient(detail: string): void;
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
    holdTransient(reason) {
      if (hold !== false) return;
      hold = 'transient-read';
      detail = reason;
    },
    protect(reason) {
      hold = 'protected-payload';
      detail = reason;
    },
  };
}
