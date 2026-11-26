/* N4 dwarf planet: the legacy game already makes them, with their own seeds (LEGACY 4062-4069; Ceres and Pluto in
   Sol, 4014). No slice and no new roll: every one of them becomes a place to land. */
import type { WorldTypeDefinition } from '../rules.js';

export const dwarf: WorldTypeDefinition = {
  key: 'dwarf',
  label: 'Dwarf planet',
  slice: null,
  source: [
    { name: 'dwarf planets the legacy game makes', count: (_starSeed, system) => (Array.isArray(system.dwarfs) ? system.dwarfs.length : 0) },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
