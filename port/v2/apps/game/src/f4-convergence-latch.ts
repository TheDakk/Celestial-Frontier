/* Fail-closed ordering for app-level F4 authority convergence. The one reload
   task is latched and scheduled before optional presentation repair, so a
   broken repaint can be diagnosed without stranding the dying document. */

export interface F4ConvergenceLatchInput {
  readonly alreadyScheduled: boolean;
  readonly latch: () => void;
  readonly schedule: () => void;
  readonly repaint: () => void;
  readonly onRepaintError: (error: unknown) => void;
}

export function f4AuthorityConvergenceWitnessErrors(repaintError: string | null): string[] {
  return repaintError === null ? [] : [`Shipyard protection repaint: ${repaintError}`];
}

export function latchF4AuthorityConvergenceReload(input: F4ConvergenceLatchInput): void {
  if (!input.alreadyScheduled) {
    input.latch();
    input.schedule();
  }
  try {
    input.repaint();
  } catch (error) {
    try { input.onRepaintError(error); }
    catch { /* diagnostics must not strand the already-scheduled reload */ }
  }
}
