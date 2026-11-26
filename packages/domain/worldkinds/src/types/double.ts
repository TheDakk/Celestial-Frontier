/* N6 double planet: a partner body beside a planet that is not a gas giant and has no moons. The planet itself is
   not changed. The design rolls 1 in 8 on a new stream of the planet's and names no salt for it, so only the
   planets that could be a primary are counted. No Sol planet is one. */
import type { WorldTypeDefinition } from '../rules.js';

export const double: WorldTypeDefinition = {
  key: 'double',
  label: 'Double planet',
  slice: null,
  source: [
    {
      name: 'seeded planets that are not gas giants and have no moons',
      count: (_starSeed, system) => (system.sol === true ? 0 : system.planets.filter(({ P }) => P.type !== 'gas' && P.moons === 0).length),
    },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
