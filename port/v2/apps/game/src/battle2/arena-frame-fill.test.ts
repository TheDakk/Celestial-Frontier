// D2 G6 — the guardian frame-fill option of combatantScale (kit GUARDIAN RULE: fills the battle screen).
// Outcome tests: (1) a titanic combatant with frameFill lands within 2 % of the fill target on both viewports;
// (2) without the option every mass class is byte-identical to the mass-class rule; (3) the option is bounded.
import { describe, expect, it } from 'vitest';
import { COMBATANT_HEIGHT_FRACTION, combatantScale } from './arena.js';
import { MASS_CLASS } from '../motion/timing.js';

const bounds = { height: 0.8 } as const; // the rig's standing height as a fraction of its cutout
const cutout = 1536;

describe('combatantScale frameFill (D2 G6)', () => {
  it('fills the frame for a titanic combatant on both viewports', () => {
    for (const frame of [720, 1080]) {
      const s = combatantScale(bounds, cutout, MASS_CLASS.titanic, frame, { frameFill: 0.9 });
      const drawnHeight = s.scale * bounds.height * cutout;
      expect(Math.abs(drawnHeight - 0.9 * frame) / (0.9 * frame)).toBeLessThanOrEqual(0.02);
      expect(s.heightFraction).toBe(0.9);
    }
  });
  it('is byte-identical to the mass-class rule when the option is absent', () => {
    for (const mass of [MASS_CLASS.tiny, (MASS_CLASS.tiny + MASS_CLASS.titanic) / 2, MASS_CLASS.titanic]) {
      const u = Math.min(1, Math.max(0, (mass - MASS_CLASS.tiny) / (MASS_CLASS.titanic - MASS_CLASS.tiny)));
      const expectedFraction = COMBATANT_HEIGHT_FRACTION.min + (COMBATANT_HEIGHT_FRACTION.max - COMBATANT_HEIGHT_FRACTION.min) * u;
      const a = combatantScale(bounds, cutout, mass, 1080);
      const b = combatantScale(bounds, cutout, mass, 1080, {});
      expect(a).toEqual(b);
      expect(a.heightFraction).toBe(expectedFraction);
      expect(a.heightPx).toBe(expectedFraction * 1080);
    }
  });
  it('refuses a fill below the titanic fraction or above the frame', () => {
    expect(() => combatantScale(bounds, cutout, MASS_CLASS.titanic, 1080, { frameFill: 0.4 })).toThrow(/frameFill/);
    expect(() => combatantScale(bounds, cutout, MASS_CLASS.titanic, 1080, { frameFill: 1.01 })).toThrow(/frameFill/);
    expect(() => combatantScale(bounds, cutout, MASS_CLASS.titanic, 1080, { frameFill: Number.NaN })).toThrow(/frameFill/);
  });
});
