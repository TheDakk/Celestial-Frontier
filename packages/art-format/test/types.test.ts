import { describe, expect, it } from 'vitest';
import { DRAW_ORDER, partId, tierForSize } from '@cf/art-format';

describe('art-format types', () => {
  it('maps size genes to tiers in pairs and wraps', () => {
    expect([0, 1, 2, 3, 4, 5, 6, -1].map(tierForSize)).toEqual(['small', 'small', 'medium', 'medium', 'large', 'large', 'small', 'large']);
  });
  it('builds part ids', () => {
    expect(partId('quadruped', 'head', 'h3', 'medium', 0)).toBe('quadruped/head/h3/medium/v0');
  });
  it('draws in the spec order', () => {
    expect(DRAW_ORDER).toEqual(['farLimbs', 'tail', 'torso', 'back', 'nearLimbs', 'head', 'headFeature', 'eyes', 'glow']);
  });
});
