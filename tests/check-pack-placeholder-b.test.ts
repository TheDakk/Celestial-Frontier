import { describe, it } from 'vitest';
import { checkGroup, GROUPS } from './support/placeholder-check';
import { poseSweepBudget } from './support/budget';

// A pose-sweep file: it drives the pack checker over a scaffold group of the placeholder pack. Its tests take the pose-sweep budget, for the reason written at POSE_SWEEP_BUDGET_MS.
poseSweepBudget();

// The placeholder pack's scaffold group b (tests/support/placeholder-check.ts), sampled in a file of its own so the
// groups run side by side.
describe('checkPack on the placeholder catalogue, scaffold group b', () => {
  it('checks OK: no error, edge, detached or hidden part, failure or warning; its share of the composed count; its skin: lines', () => {
    checkGroup(GROUPS.b);
  });
});
