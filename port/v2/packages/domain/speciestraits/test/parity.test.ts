import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw, probeParsed } from '../../../../tests/baseline.js';
import { rarityRoll, colorGrade, spectral, speciesName, GRADE_TIERS, RARITY_V17, TIER_MAX, displayRarity } from '@cf/domain-speciestraits';

const fx = loadFixture();

describe('@cf/domain-speciestraits — golden ×30,000', () => {
  it('rarityRoll: 10,000 seeds × 3 salts', () => {
    const r = checkGenerator(fx, 'rarityRoll', (s) => [rarityRoll(s, 1), rarityRoll(s, 3), rarityRoll(s, 0x10F)]);
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('colorGrade: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'colorGrade', (s) => colorGrade(s % 360, s, null));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('spectral: 10,000 seeds', () => {
    const r = checkGenerator(fx, 'spectral', (s) => spectral('nebula', s, null));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
});

describe('baseline probes', () => {
  it('rarityRoll 10-seed probe (salt 3)', () => {
    const SEEDS = [133, 1, 2, 3, 42, 1000, 31337, 99999, 123456, 7777777];
    expect(canon(SEEDS.map((s) => rarityRoll(s, 3)))).toBe(probeRaw('rarityRoll'));
  });
  it('colorGrade + spectral probes', () => {
    expect(canon([colorGrade(120, 999, null), colorGrade(300, 31337, null)])).toBe(probeRaw('colorGrade'));
    expect(canon([spectral('aurora', 12, null), spectral('nebula', 99, null)])).toBe(probeRaw('spectral'));
  });
  it('names probe: the deferred speciesName slot now closes (all 7 seed groups)', () => {
    const stored = probeParsed('names') as string[];
    [1, 7, 133, 999, 424242, 31337, 270549077].forEach((s, g) => {
      expect(speciesName(s), `speciesName(${s})`).toBe(stored[g * 4 + 3]);
    });
  });
});

describe('★ ROADMAP 9g — the display collapse gets its guard (plan §16.3)', () => {
  /* The collapse lives in GRADE_TIERS DATA with no function enforcing it.
     Restore the old names to rows 10–14 and every creature surface silently
     reverts while displayRarity keeps clamping and its tests keep passing.
     THIS suite is the invariant that was missing. */
  it('raw rows 9–14 all display as Transcendent / #F7F1FF', () => {
    for (let t = 9; t <= 14; t++) {
      expect(GRADE_TIERS[t]!.name, `GRADE_TIERS[${t}].name`).toBe('Transcendent');
      expect(GRADE_TIERS[t]!.hex, `GRADE_TIERS[${t}].hex`).toBe('#F7F1FF');
    }
  });
  it('rows 0–9 names/hexes are byte-identical to RARITY_V17 (the two ladders cannot drift)', () => {
    for (let t = 0; t <= 9; t++) {
      expect(GRADE_TIERS[t]!.name).toBe(RARITY_V17[t]!.name);
      expect(GRADE_TIERS[t]!.hex).toBe(RARITY_V17[t]!.hex);
    }
  });
  it('star glyphs are retired on every row', () => {
    for (const g of GRADE_TIERS) expect(g.star).toBe('');
  });
  it('displayRarity clamps raw 10–14 to Transcendent; TIER_MAX is 14', () => {
    expect(TIER_MAX).toBe(14);
    for (const raw of [10, 11, 12, 13, 14, 99]) expect(displayRarity(raw).name).toBe('Transcendent');
    expect(displayRarity(-5).name).toBe('Common');
  });
});
