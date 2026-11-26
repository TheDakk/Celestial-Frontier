// The scene a landing shows, in the order the legacy game decides it (LEGACY celestial-frontier.html, showVistaBox:
// the cloud deck of a gas world 12987-13009, a sea region of a terran world 13042, the deep 13046-13061, the reef
// 13064-13079, the shore of an ocean world 13017, else the land 13080-13087; the sea regions 12966).
import { describe, expect, it } from 'vitest';
import { BIOME_SETS } from '@cf/domain-strays';
import { SEA_REGIONS, earthLandingComposition, landingSceneRoute } from '@cf/domain-landing';
import type { SceneRoute } from '@cf/domain-landing';

const ROUTES: ReadonlyArray<readonly [string, string | null, SceneRoute]> = [
  ['gas', 'hotglow', 'deck'], ['gas', null, 'deck'],
  ['ocean', 'abyssal', 'abyss'], ['terran', 'coral', 'reef'], ['ocean', 'coral', 'reef'],
  ['ocean', 'opensea', 'island'], ['ocean', null, 'island'],
  ['terran', 'opensea', 'island'], ['terran', 'archipelago', 'island'],
  ['terran', 'stormsea', 'island'], ['terran', 'volcisle', 'island'], ['terran', 'milksea', 'island'],
  ['terran', 'temperate', 'land'], ['desert', 'dunesea', 'land'], ['ice', 'cryogeyser', 'land'], ['terran', null, 'land'],
  ['rocky', 'cratered', 'land'], ['venus', 'acidhaze', 'land'], ['lava', 'magmasea', 'land'],
];

describe('the scene route of a landing', () => {
  it.each(ROUTES)('a %s world landing in %s is the %s scene', (type, region, route) => {
    expect(landingSceneRoute(type, region)).toBe(route);
  });

  it('every region named above is a region of its world type', () => {
    for (const [type, region] of ROUTES) {
      if (region === null) continue;
      const sets = type === 'terran' ? [...BIOME_SETS.terran!, ...BIOME_SETS.ocean!] : BIOME_SETS[type]!;
      expect(sets.some((b) => b.k === region), `${type} ${region}`).toBe(true);
    }
  });

  it("every one of Earth's 14 regions has a route: 4 island, 1 reef, 9 land", () => {
    // Earth's table (LEGACY 13330-13333) holds four of the five sea regions (no milk sea) and coral.
    const count: Record<string, number> = {};
    for (const share of earthLandingComposition()) {
      const route = landingSceneRoute('terran', share.biome.k);
      count[route] = (count[route] ?? 0) + 1;
    }
    expect(count).toEqual({ island: 4, reef: 1, land: 9 });
  });

  it('the sea regions are the five the legacy game names', () => {
    expect([...SEA_REGIONS].sort()).toEqual(['archipelago', 'milksea', 'opensea', 'stormsea', 'volcisle']);
  });

  it('a gas world is the deck whatever region is named, and only a terran world is flipped by a sea region', () => {
    expect(landingSceneRoute('gas', 'abyssal')).toBe('deck');
    expect(landingSceneRoute('ice', 'opensea')).toBe('land');
  });
});
