import { describe, expect, it } from 'vitest';
import { DRAW_ORDER, LAYER_NAMES, MARK_SLOTS, PATTERN_NAMES, SKIN_NAMES, partId } from '@cf/art-format';

describe('art-format types', () => {
  it('builds part ids', () => {
    expect(partId('quadruped', 'head', 'h3', 'medium', 0)).toBe('quadruped/head/h3/medium/v0');
  });
  it('DRAW_ORDER puts far wings first, the body feature between torso and back, near wings behind the near legs', () => {
    expect(DRAW_ORDER).toEqual(['farWings', 'farLimbs', 'tail', 'torso', 'bodyFeature', 'back', 'nearWings', 'nearLimbs', 'head', 'headFeature', 'eyes', 'glow']);
    // The slots that were there before keep their order among themselves, so no recipe of today changes order.
    expect(DRAW_ORDER.filter((s) => !['farWings', 'bodyFeature', 'nearWings'].includes(s))).toEqual(['farLimbs', 'tail', 'torso', 'back', 'nearLimbs', 'head', 'headFeature', 'eyes', 'glow']);
  });
  it('MARK_SLOTS gains both wing slots and not bodyFeature', () => {
    expect(MARK_SLOTS).toEqual(['farWings', 'farLimbs', 'tail', 'torso', 'nearWings', 'nearLimbs', 'head']);
    expect(MARK_SLOTS).not.toContain('bodyFeature');
  });
  it('LAYER_NAMES is flow, spots, every pattern but plain, then every skin', () => {
    expect(LAYER_NAMES).toEqual(['flow', 'spots', ...PATTERN_NAMES.filter((p) => p !== 'plain'), ...SKIN_NAMES]);
    expect(PATTERN_NAMES[0]).toBe('plain');
  });
});
