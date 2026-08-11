import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import { planetParams, surfaceColor } from '@cf/domain-planetgen';

describe('@cf/domain-planetgen — golden ×10,000 + baseline probe', () => {
  it('planetParams: 10,000 golden seeds, per-seed + rollup', () => {
    const r = checkGenerator(loadFixture(), 'planetParams', (s) => planetParams(s));
    expect(r.mismatches, r.mismatches.map((m) => `seed[${m.i}]=${m.seed}: ${m.want} -> ${m.got}`).join('\n')).toEqual([]);
    expect(r.rollupOk).toBe(true);
  });
  it('planetParams: the baseline fingerprint 10-seed probe', () => {
    const SEEDS = [133, 1, 2, 3, 42, 1000, 31337, 99999, 123456, 7777777];
    expect(canon(SEEDS.map((s) => planetParams(s)))).toBe(probeRaw('planetParams'));
  });
  it('surfaceColor requires a callable noise source and returns an RGB triplet', () => {
    const rgb = surfaceColor(planetParams(133), 0, 0, () => 0.5);
    expect(rgb).toHaveLength(3);
    expect(rgb.every((channel) => Number.isFinite(channel))).toBe(true);
  });
});
