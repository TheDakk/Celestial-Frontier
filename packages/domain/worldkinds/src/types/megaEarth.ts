/* N3 mega-Earth: a living world far larger than any terran. Half of the large terran worlds, on its own stream. */
import { ownDraw, type WorldTypeDefinition } from '../rules.js';

/** The slice's own stream: the design's salt, taken as written. */
const SLICE_STREAM = [0x3E6A, 17] as const;

export const megaEarth: WorldTypeDefinition = {
  key: 'megaEarth',
  label: 'Mega-Earth',
  slice: [
    { name: 'terran world', test: (P) => P.type === 'terran' },
    { name: 'size over 1.2', test: (P) => typeof P.sizeMul === 'number' && P.sizeMul > 1.2 },
    { name: 'own stream under 0.50', test: (P) => ownDraw(P.seed, SLICE_STREAM[0], SLICE_STREAM[1]) < 0.5 },
  ],
  source: null,
  bodies: null,
  rogue: null,
  rules: null,
};
