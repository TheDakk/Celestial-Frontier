/* N8 trojan world: one small world on the orbit of a large seeded gas giant, 4% of them, on the giant's own new
   stream. It is not in the planet list, so no planet seed and no system roll moves. None in Sol. */
import { ownDraw, type PlanetNumbers, type WorldTypeDefinition } from '../rules.js';
import type { CensusSystem } from '../census.js';

/** The host's roll: the design's salt, taken as written. */
const HOST_STREAM = [0x7A0, 1] as const;
const HOST_CHANCE = 0.04;

const giants = (system: CensusSystem): PlanetNumbers[] => (system.sol === true ? [] : system.planets.map(({ P }) => P).filter((P) => P.type === 'gas'));
const large = (P: PlanetNumbers): boolean => typeof P.sizeMul === 'number' && P.sizeMul >= 2.0;

export const trojan: WorldTypeDefinition = {
  key: 'trojan',
  label: 'Trojan world',
  slice: null,
  source: [
    { name: 'seeded gas giants', count: (_starSeed, system) => giants(system).length },
    { name: 'of size 2.0 or more', count: (_starSeed, system) => giants(system).filter(large).length },
    {
      name: 'holding a trojan world (own stream under 4%)',
      count: (_starSeed, system) => giants(system).filter((P) => large(P) && ownDraw(P.seed, HOST_STREAM[0], HOST_STREAM[1]) < HOST_CHANCE).length,
    },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
