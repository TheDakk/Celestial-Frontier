import { describe, expect, it } from 'vitest';
import {
  LEGACY_AFFIX_DEFINITIONS,
  familyOf,
  mayShare,
  type ModifierFamily,
  type ModifierKey,
} from '@cf/domain-loot';

// The six modifier kinds are the legacy game's (AFFIX_DEFS, 23194 to 23201: yield 23195,
// strike 23196, scut 23197, contact 23198, land 23199, heal 23200). The families are the
// item tiers design's, section 2: Extraction: yield, strikes. Survival: wounds, landing,
// heal. Contact: contact.
const LEGACY_KEYS: readonly ModifierKey[] = ['yield', 'strike', 'scut', 'contact', 'land', 'heal'];
const DESIGN_FAMILIES: Readonly<Record<ModifierFamily, readonly ModifierKey[]>> = {
  extraction: ['yield', 'strike'],
  survival: ['scut', 'land', 'heal'],
  contact: ['contact'],
};

describe('@cf/domain-loot: modifier families', () => {
  it('each of the six modifiers has exactly one family', () => {
    expect(LEGACY_AFFIX_DEFINITIONS.map((definition) => definition.key)).toEqual(LEGACY_KEYS);
    const members: Record<string, ModifierKey[]> = {};
    for (const key of LEGACY_KEYS) (members[familyOf(key)] ??= []).push(key);
    expect(members).toEqual(DESIGN_FAMILIES);
  });

  it('nothing but the six modifiers has a family', () => {
    for (const stranger of ['speed', 'land100', 'struts', 'forage', 'toString', '', undefined, 3]) {
      expect(() => familyOf(stranger as ModifierKey), String(stranger)).toThrow(RangeError);
    }
  });

  it('yield and strikes never share a piece', () => {
    expect(mayShare('yield', 'strike')).toBe(false);
    expect(mayShare('strike', 'yield')).toBe(false);
  });

  it('two modifiers share a piece only when their families differ, and never a modifier with itself', () => {
    for (const first of LEGACY_KEYS) {
      for (const second of LEGACY_KEYS) {
        const sameFamily = Object.values(DESIGN_FAMILIES)
          .some((keys) => keys.includes(first) && keys.includes(second));
        expect(mayShare(first, second), `${first} with ${second}`).toBe(!sameFamily);
      }
      expect(mayShare(first, first), `${first} with itself`).toBe(false);
    }
    expect(mayShare('yield', 'scut')).toBe(true);
    expect(mayShare('contact', 'heal')).toBe(true);
    expect(mayShare('land', 'heal')).toBe(false);
  });
});
