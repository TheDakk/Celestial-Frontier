import { describe, it } from 'vitest';
import { checkGroup, GROUPS } from './support/placeholder-check';

// The placeholder pack's scaffold group b (tests/support/placeholder-check.ts), sampled in a file of its own so the
// groups run side by side. A hang guard only, as testTimeout is.
describe('checkPack on the placeholder catalogue, scaffold group b', () => {
  it('checks OK: no error, edge, detached or hidden part, failure or warning; its share of the composed count; its skin: lines', () => {
    checkGroup(GROUPS.b);
  }, 60_000);
});
