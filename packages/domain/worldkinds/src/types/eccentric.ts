/* N13 eccentric world: a full world on a stretched orbit, 1 seeded system in 60, on the star's own new stream. */
import { ownDraw, type WorldTypeDefinition } from '../rules.js';

/** The star's roll: the design's salt, taken as written. */
const STAR_STREAM = [0xECC, 1] as const;
const STAR_CHANCE = 1 / 60;

export const eccentric: WorldTypeDefinition = {
  key: 'eccentric',
  label: 'Eccentric world',
  slice: null,
  source: [
    { name: 'seeded systems', count: (_starSeed, system) => (system.sol === true ? 0 : 1) },
    {
      name: 'holding an eccentric world (own stream under 1 in 60)',
      count: (starSeed, system) => (system.sol !== true && ownDraw(starSeed, STAR_STREAM[0], STAR_STREAM[1]) < STAR_CHANCE ? 1 : 0),
    },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
