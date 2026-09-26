/** @module battle2-gate [app] — the ONE rule for whether a settled fight plays on the painted battle stage (battle2). Dependency-free on
 * purpose: main.ts imports it statically, while the stage itself (`battle2-wiring.ts` and everything under `battle2/`) stays behind a
 * dynamic import that runs only when a fight is presented, so the boot path never pays for it.
 *
 * A4 (Nick 2026-09-26: "finish everything on your side, don't wait on me, we'll play test after"): the painted stage is the DEFAULT for
 * development builds. `?battle2=0` opts out to the Chronicle-only path; flip BATTLE2_DEFAULT to false to make the stage opt-in
 * (`?battle2=1`) again. A production release stays gated by the I5 certificate; this constant is not that gate. The matchup picker
 * (`?battle2=1&vs=…`) is a separate, always-opt-in study. */
export const BATTLE2_DEFAULT = true;
export const BATTLE2_FLAG = 'battle2' as const;
/** Whether the painted stage plays: `?battle2=1` forces it on, `?battle2=0` forces it off, anything else follows BATTLE2_DEFAULT. */
export function battle2On(search: string): boolean {
  const v = new URLSearchParams(search).get(BATTLE2_FLAG);
  return v === '1' ? true : v === '0' ? false : BATTLE2_DEFAULT;
}
