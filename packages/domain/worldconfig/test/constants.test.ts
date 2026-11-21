import { it, expect } from 'vitest';
import { HOME_GAL_SEED, SOL_SEED } from '@cf/domain-worldconfig';
it('holds the contract seeds', () => {
  expect(HOME_GAL_SEED).toBe(999);
  expect(SOL_SEED).toBe(424242);
});
