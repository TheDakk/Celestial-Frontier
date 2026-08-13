import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator } from '../../../../tests/parity.js';
import { atmosphereText, climateBand, climateText, waterText } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';

describe('@cf/domain-surveyphrases — golden ×1,000 via climateBand', () => {
  it('climateBand: 1,000 golden seeds through real systems, per-seed + rollup', () => {
    const r = checkGenerator(loadFixture(), 'climateBand', (s) => {
      const sys = systemFor(s); const pl = (sys.planets || [])[0];
      if (!pl) return 'no-planet';
      return climateBand(pl.P, sys, pl['orb'] !== undefined ? (pl['orb'] as number) : 2);
    });
    expect(r.mismatches, r.mismatches.map((m) => `seed[${m.i}]=${m.seed}`).join(', ')).toEqual([]);
    expect(r.rollupOk).toBe(true);
  });
  /* atmosphereText/climateText/waterText/gravityText have no standalone fixture —
     they are pinned downstream through the planetDescriptor golden cases (module
     13). Recorded, not silent. */
  it('text helpers expose their real runtime argument contracts', () => {
    const terran = { type: 'terran' };
    expect(atmosphereText(terran, 'hot', () => 0.5)).toContain('greenhouse');
    expect(climateText(terran, 'hot')).toContain('Scorching');
    expect(waterText(terran, 'cold')).toContain('Frozen');
  });
});
