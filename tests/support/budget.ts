/* The time budget of the tests that sweep poses: every test that drives the pack checker (tools/check-pack.mjs) or
   composes thousands of creature poses itself. */
import { vi } from 'vitest';

/**
 * The hang guard of a pose-sweep test file, in place of the 30 seconds every other test has (vitest.config.ts).
 *
 * Why: these tests are all work and no waiting. One checker run on a single four-legged scaffold of the placeholder
 * pack composes some 6,000 creature poses and takes 10 seconds alone on an idle machine; the slowest of these tests
 * take 12 to 14 seconds alone. The test files run side by side, and the machine also runs other jobs, so the same
 * work took 20 seconds in a full run under load and passed 30 with no assertion failing, on four branches in one day.
 * A guard that fires on honest work hides real failures. 120 seconds is about ten times the slowest test alone: a test
 * that passes it is hung, or has become ten times dearer, and either is worth a red gate.
 *
 * It is still a hang guard only: no test asserts on its own speed. The guard of every other test stays at 30 seconds.
 */
export const POSE_SWEEP_BUDGET_MS = 120_000;

/** Gives every test of the calling file the pose-sweep budget. Call it once, at the top of the file, before any test is declared. */
export function poseSweepBudget(): void {
  vi.setConfig({ testTimeout: POSE_SWEEP_BUDGET_MS });
}
