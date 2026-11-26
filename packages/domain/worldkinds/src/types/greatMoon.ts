/* N7 great moon: a moon big enough to be a world. The legacy game gives every moon a seed and one of four types
   (LEGACY 5321-5324, 5298); a rocky, icy or volcanic one may be great, a captured asteroid never. The design rolls
   1 in 20 on a new stream of the moon's and names no salt for it, so only the moons that could be great are counted. */
import { moonDescriptor } from '@cf/domain-descriptors';
import type { CensusPlanet, CensusSystem } from '../census.js';
import type { WorldTypeDefinition } from '../rules.js';

const CAPTURED = 'Captured asteroid';

/** How many of a planet's moons are rocky, icy or volcanic. */
function eligibleMoons(planet: CensusPlanet): number {
  const moons = typeof planet.P.moons === 'number' ? planet.P.moons : 0;
  let eligible = 0;
  for (let m = 0; m < moons; m++) {
    const card = moonDescriptor(planet as unknown as Record<string, unknown>, m as unknown as Record<string, unknown>);
    if (card.sub !== CAPTURED) eligible++;
  }
  return eligible;
}

const sum = (system: CensusSystem, of: (planet: CensusPlanet) => number): number => system.planets.reduce((n, planet) => n + of(planet), 0);

export const greatMoon: WorldTypeDefinition = {
  key: 'greatMoon',
  label: 'Great moon',
  slice: null,
  source: [
    { name: 'moons', count: (_starSeed, system) => sum(system, (planet) => (typeof planet.P.moons === 'number' ? planet.P.moons : 0)) },
    { name: 'rocky, icy or volcanic moons', count: (_starSeed, system) => sum(system, eligibleMoons) },
    { name: 'planets with a moon that could be great', count: (_starSeed, system) => sum(system, (planet) => (eligibleMoons(planet) > 0 ? 1 : 0)) },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
