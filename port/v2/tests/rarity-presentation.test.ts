import { describe, expect, it } from 'vitest';
import {
  projectDisplayRarity,
  type DisplayRarityView,
} from '../apps/game/src/rarity-presentation.js';

const EXPECTED = Object.freeze([
  ['common', 'Common', '#B8BDC7'],
  ['uncommon', 'Uncommon', '#4FD16B'],
  ['notable', 'Notable', '#35C9B5'],
  ['rare', 'Rare', '#3D8BFF'],
  ['exotic', 'Exotic', '#9A5CFF'],
  ['legendary', 'Legendary', '#F4A62A'],
  ['mythic', 'Mythic', '#E54B8D'],
  ['celestial', 'Celestial', '#54D8FF'],
  ['primordial', 'Primordial', '#D85B3F'],
  ['transcendent', 'Transcendent', '#F7F1FF'],
] as const);

describe('v2 rarity presentation boundary', () => {
  it('projects every deterministic raw tier through the canonical ten-name ladder', () => {
    for (let raw = 0; raw <= 14; raw++) {
      const expectedTier = Math.min(raw, 9);
      const [id, name, hex] = EXPECTED[expectedTier]!;
      expect(projectDisplayRarity(raw), `raw tier ${raw}`).toEqual({
        tier: expectedTier,
        id,
        name,
        hex,
      });
    }
  });

  it('collapses the deep raw grades without changing their input identities', () => {
    for (const raw of [9, 10, 12, 13, 14]) {
      expect(projectDisplayRarity(raw), `raw tier ${raw}`).toEqual({
        tier: 9,
        id: 'transcendent',
        name: 'Transcendent',
        hex: '#F7F1FF',
      });
    }
  });

  it('returns null for every missing, coercible, fractional, or out-of-range input', () => {
    const invalid: readonly unknown[] = [
      undefined, null, '', '0', '14', false, true,
      Number.NaN, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY,
      -1, 15, 0.5, 13.5, {}, [], new Number(1), 1n,
    ];
    for (const value of invalid) expect(projectDisplayRarity(value), String(value)).toBeNull();
  });

  it('returns immutable presentation views', () => {
    const view = projectDisplayRarity(14);
    expect(view).not.toBeNull();
    expect(Object.isFrozen(view)).toBe(true);
    expect(() => {
      (view as DisplayRarityView & { name: string }).name = 'Omnipotent';
    }).toThrow(TypeError);
    expect(projectDisplayRarity(14)?.name).toBe('Transcendent');
  });
});
