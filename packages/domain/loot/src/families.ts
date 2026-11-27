import type { LegacyAffixDefinition } from './gear.js';

/** The six rolled modifier kinds of the legacy game (AFFIX_DEFS). */
export type ModifierKey = LegacyAffixDefinition['key'];
export type ModifierFamily = 'extraction' | 'survival' | 'contact';

/** Named improvement (item tiers): every modifier kind belongs to one family.
 * Yield and strikes are the one product the legacy game multiplies, so they
 * sit together and can never share a piece. */
const FAMILY_BY_KEY: Readonly<Record<ModifierKey, ModifierFamily>> = Object.freeze({
  yield: 'extraction',
  strike: 'extraction',
  scut: 'survival',
  land: 'survival',
  heal: 'survival',
  contact: 'contact',
});

export function familyOf(key: ModifierKey): ModifierFamily {
  if (typeof key !== 'string' || !Object.hasOwn(FAMILY_BY_KEY, key)) {
    throw new RangeError('a family is asked for something that is not one of the six modifiers');
  }
  return FAMILY_BY_KEY[key];
}

/** Whether two modifiers may sit on one piece: only when their families
 * differ. A modifier never shares a piece with itself. */
export function mayShare(first: ModifierKey, second: ModifierKey): boolean {
  return familyOf(first) !== familyOf(second);
}
