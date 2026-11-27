import { describe, expect, it } from 'vitest';
import { ITEM_PROPERTIES, LEGACY_AFFIX_DEFINITIONS, familyOf } from '@cf/domain-loot';

// The pool is the item tiers design's, section 2 ("Legendary properties (authored pool of
// six)"). It is new: the legacy game has no named property, so no number here has a legacy
// line. Forager stands where an earlier draft had Scrape-Proof (design section 4).
const DESIGN_POOL = [
  { id: 'motherlode', name: 'Motherlode', family: 'extraction', effect: { key: 'yield', value: 0.20 } },
  { id: 'seam-sight', name: 'Seam-Sight', family: 'extraction', effect: { key: 'strike', value: 0.03 } },
  { id: 'mender', name: 'Mender', family: 'survival', effect: { key: 'heal', value: 0.20 } },
  { id: 'sure-descent', name: 'Sure Descent', family: 'survival', effect: { key: 'land', value: 5 } },
  { id: 'forager', name: 'Forager', family: 'survival', effect: { key: 'forage', value: 1 } },
  { id: 'envoy', name: 'Envoy', family: 'contact', effect: { key: 'contact', value: 5 } },
];

describe('@cf/domain-loot: the Legendary property pool', () => {
  it('the property pool is the six named, with these numbers', () => {
    expect(ITEM_PROPERTIES).toEqual(DESIGN_POOL);
    expect(new Set(ITEM_PROPERTIES.map((property) => property.id)).size).toBe(6);
  });

  it('no property is Scrape-Proof, and Forager is in the pool', () => {
    const words = ITEM_PROPERTIES.flatMap((property) => [property.id, property.name])
      .map((word) => word.toLowerCase().replace(/[^a-z]/g, ''));
    expect(words).not.toContain('scrapeproof');
    expect(words).toContain('forager');
  });

  it('a property adds to one of the six modifiers, in that modifier\'s own family, or is Forager', () => {
    const modifierKeys: readonly string[] = LEGACY_AFFIX_DEFINITIONS.map((definition) => definition.key);
    for (const property of ITEM_PROPERTIES) {
      if (property.effect.key === 'forage') {
        expect(property.id).toBe('forager');
        continue;
      }
      expect(modifierKeys, property.id).toContain(property.effect.key);
      expect(familyOf(property.effect.key), property.id).toBe(property.family);
    }
  });

  it('no property touches speed, the never-waved-off descent or scrape armour', () => {
    const touched = ITEM_PROPERTIES.map((property) => property.effect.key as string);
    for (const authoredOnly of ['speed', 'land100', 'struts']) expect(touched).not.toContain(authoredOnly);
  });

  it('the pool cannot be changed by a reader', () => {
    expect(Object.isFrozen(ITEM_PROPERTIES)).toBe(true);
    expect(ITEM_PROPERTIES.every((property) => Object.isFrozen(property) && Object.isFrozen(property.effect))).toBe(true);
  });
});
