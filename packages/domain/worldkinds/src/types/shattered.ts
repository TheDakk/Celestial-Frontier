/* N10 shattered world: a broken planet in a seeded system's asteroid belt (LEGACY 4048-4051), 3% of belts, on the
   star's own new stream. The belt's rocks and every planet are untouched. None in Sol. */
import type { WorldTypeDefinition } from '../rules.js';
import { declareStream, ownDraw } from '../streams.js';
import type { CensusSystem } from '../census.js';

/** The belt's roll: the design's salt, taken as written. */
const BELT_STREAM = declareStream('shattered', 0x5A7, 1);
const BELT_CHANCE = 0.03;

const belted = (system: CensusSystem): boolean => system.sol !== true && Boolean(system.belt);

export const shattered: WorldTypeDefinition = {
  key: 'shattered',
  label: 'Shattered world',
  slice: null,
  source: [
    { name: 'seeded systems with a belt', count: (_starSeed, system) => (belted(system) ? 1 : 0) },
    {
      name: 'holding a shattered world (own stream under 3%)',
      count: (starSeed, system) => (belted(system) && ownDraw(starSeed, BELT_STREAM) < BELT_CHANCE ? 1 : 0),
    },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
