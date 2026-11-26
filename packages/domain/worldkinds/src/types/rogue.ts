/* N5 rogue planet: a world with no star. The legacy game already places them on the galaxy map, 2% of the cells
   inside a galaxy's disk (LEGACY 3975); a census of systems cannot count them. */
import type { WorldTypeDefinition } from '../rules.js';

export const rogue: WorldTypeDefinition = {
  key: 'rogue',
  label: 'Rogue planet',
  slice: null,
  source: null,
  bodies: null,
  rogue: null,
  rules: null,
};
