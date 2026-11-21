import { describe, it, expect } from 'vitest';
import { atmosphereText, climateText, waterText } from '@cf/domain-surveyphrases';

describe('@cf/domain-surveyphrases — text helpers', () => {
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
