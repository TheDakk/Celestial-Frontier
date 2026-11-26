/* The scene a landing shows (LEGACY celestial-frontier.html, v1.8.9, `showVistaBox` 12979-13100), in the order the
   legacy game decides it:
   - a gas world has no ground: the cloud deck, 12986-13010;
   - the abyssal region goes beneath the waves, 13046-13062;
   - the coral region drops to its reef, 13065-13079;
   - an ocean world is the shore and sea, 13018; so is a terran world whose landing rolled a sea region, 13042
     (the sea regions: `_SEA_WB` 12966);
   - anything else is the land, 13080-13087.

   The region given is the one the landing rolled (`biomeForLanding`). On a gas world the legacy game dresses the deck
   with the world's anchor biome instead (`biomeFor`, 12991); the route is the deck either way. */

export type SceneRoute = 'deck' | 'abyss' | 'reef' | 'island' | 'land';

/** The sea regions that turn a terran landing into the shore and sea scene. */
export const SEA_REGIONS: ReadonlySet<string> = new Set(['opensea', 'archipelago', 'stormsea', 'volcisle', 'milksea']);

/** The scene of a landing on a world of this type in this region (null: no region). */
export function landingSceneRoute(planetType: string, regionKey: string | null): SceneRoute {
  if (planetType === 'gas') return 'deck';
  if (regionKey === 'abyssal') return 'abyss';
  if (regionKey === 'coral') return 'reef';
  if (planetType === 'ocean') return 'island';
  if (planetType === 'terran' && regionKey !== null && SEA_REGIONS.has(regionKey)) return 'island';
  return 'land';
}
