/* N12 artefact world: a built world, 1 system in 3,000, at seeded orange, yellow and white stars, on the star's
   own new stream. */
import { ownDraw, type WorldTypeDefinition } from '../rules.js';
import type { CensusSystem } from '../census.js';

/** The star's roll: the design's salt, taken as written. */
const STAR_STREAM = [0xA27, 1] as const;
const STAR_CHANCE = 1 / 3000;

const eligible = (system: CensusSystem): boolean => system.sol !== true && (system.kind === 'K' || system.kind === 'G' || system.kind === 'A');

export const artefact: WorldTypeDefinition = {
  key: 'artefact',
  label: 'Artefact world',
  slice: null,
  source: [
    { name: 'seeded orange, yellow and white stars', count: (_starSeed, system) => (eligible(system) ? 1 : 0) },
    {
      name: 'holding an artefact world (own stream under 1 in 3,000)',
      count: (starSeed, system) => (eligible(system) && ownDraw(starSeed, STAR_STREAM[0], STAR_STREAM[1]) < STAR_CHANCE ? 1 : 0),
    },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
