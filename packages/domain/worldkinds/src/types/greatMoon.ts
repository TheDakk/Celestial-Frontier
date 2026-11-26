/* N7 great moon: a moon big enough to be a world. The legacy game gives every moon a seed and one of four types
   (LEGACY 5321-5324, 5298); a rocky, icy or volcanic one may be great, a captured asteroid never. The design rolls
   1 in 20 on a new stream of the moon's and names no salt for it, so only the moons that could be great are counted. */
import type { CensusMoon } from '../census.js';
import type { WorldTypeDefinition } from '../rules.js';

const CAPTURED = 'Captured asteroid';

/** How many of a planet's moons are rocky, icy or volcanic. */
const eligible = (moons: readonly CensusMoon[]): number => moons.filter((moon) => moon.type !== CAPTURED).length;

export const greatMoon: WorldTypeDefinition = {
  key: 'greatMoon',
  label: 'Great moon',
  slice: null,
  source: [
    { name: 'moons', count: (_starSeed, _system, facts) => facts.moons.reduce((n, moons) => n + moons.length, 0) },
    { name: 'rocky, icy or volcanic moons', count: (_starSeed, _system, facts) => facts.moons.reduce((n, moons) => n + eligible(moons), 0) },
    { name: 'planets with a moon that could be great', count: (_starSeed, _system, facts) => facts.moons.filter((moons) => eligible(moons) > 0).length },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
