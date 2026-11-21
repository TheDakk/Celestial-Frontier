/* Moved from packages/domain/worldgen/test/parity.test.ts: slimGal comes from
   @cf/domain-descriptors, which imports @cf/domain-worldgen, so a worldgen package
   test may not import it. The web-metadata half of the original test stays in worldgen. */
import { describe, it, expect } from 'vitest';
import { canon } from '../support/parity.js';
import { probeRaw } from '../support/baseline.js';
import { galaxiesInCell } from '@cf/domain-worldgen';
import { slimGal } from '@cf/domain-descriptors';

describe('@cf/domain-worldgen with @cf/domain-descriptors — baseline probe', () => {
  it('galaxiesInCell + slimGal probe', () => {
    const cells = [galaxiesInCell(0, 0), galaxiesInCell(1, -2), galaxiesInCell(-3, 5)];
    expect(canon(cells.map((arr) => arr.map((g) => slimGal(g))))).toBe(probeRaw('galaxiesInCell'));
  });
});
