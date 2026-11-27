import type { ModifierFamily, ModifierKey } from './families.js';
import { deepFreeze } from './internal.js';

export type PropertyId = 'motherlode' | 'seam-sight' | 'mender' | 'sure-descent' | 'forager' | 'envoy';

export interface ItemProperty {
  readonly id: PropertyId;
  readonly name: string;
  readonly family: ModifierFamily;
  /** What the property adds: to one of the six modifiers' totals, or, for
   * `forage`, that many more landfall samples of each vein. */
  readonly effect: { readonly key: ModifierKey | 'forage'; readonly value: number };
}

/** Named improvement (item tiers): the authored pool of six properties a
 * Legendary piece may hold one of. None adds speed, the never-waved-off
 * descent or scrape armour; those stay authored on the piece itself. */
export const ITEM_PROPERTIES: readonly ItemProperty[] = deepFreeze([
  { id: 'motherlode', name: 'Motherlode', family: 'extraction', effect: { key: 'yield', value: 0.20 } },
  { id: 'seam-sight', name: 'Seam-Sight', family: 'extraction', effect: { key: 'strike', value: 0.03 } },
  { id: 'mender', name: 'Mender', family: 'survival', effect: { key: 'heal', value: 0.20 } },
  { id: 'sure-descent', name: 'Sure Descent', family: 'survival', effect: { key: 'land', value: 5 } },
  { id: 'forager', name: 'Forager', family: 'survival', effect: { key: 'forage', value: 1 } },
  { id: 'envoy', name: 'Envoy', family: 'contact', effect: { key: 'contact', value: 5 } },
]);
