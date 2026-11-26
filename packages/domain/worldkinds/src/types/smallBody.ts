/* N11 small body: a comet, a visitor or one large asteroid as a place to land. Comets and visitors the legacy game
   already makes (LEGACY 4054-4058, 4071); the asteroid is new, in 30% of seeded belts, on the star's own new stream. */
import { ownDraw, type WorldTypeDefinition } from '../rules.js';
import type { CensusSystem } from '../census.js';

/** The asteroid's roll: the design's salt, taken as written. */
const ASTEROID_STREAM = [0xA57, 1] as const;
const ASTEROID_CHANCE = 0.3;

const belted = (system: CensusSystem): boolean => system.sol !== true && Boolean(system.belt);

export const smallBody: WorldTypeDefinition = {
  key: 'smallBody',
  label: 'Small body',
  slice: null,
  source: [
    { name: 'comets the legacy game makes', count: (_starSeed, system) => (Array.isArray(system.comets) ? system.comets.length : 0) },
    { name: 'visitors the legacy game makes', count: (_starSeed, system) => (system.visitor ? 1 : 0) },
    {
      name: 'large asteroids (seeded belts, own stream under 30%)',
      count: (starSeed, system) => (belted(system) && ownDraw(starSeed, ASTEROID_STREAM[0], ASTEROID_STREAM[1]) < ASTEROID_CHANCE ? 1 : 0),
    },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
