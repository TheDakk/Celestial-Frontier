/* N2 hycean world: a large ocean world under a heavy hydrogen sky. Half of the large ocean worlds, on its own stream. */
import type { WorldTypeDefinition } from '../rules.js';
import { declareStream, ownDraw } from '../streams.js';

/** The slice's own stream: the design's salt, taken as written. */
const SLICE_STREAM = declareStream('hycean', 0x4C3A, 13);

export const hycean: WorldTypeDefinition = {
  key: 'hycean',
  label: 'Hycean world',
  slice: [
    { name: 'ocean world', test: (P) => P.type === 'ocean' },
    { name: 'size over 1.15', test: (P) => typeof P.sizeMul === 'number' && P.sizeMul > 1.15 },
    { name: 'own stream under 0.50', test: (P) => ownDraw(P.seed, SLICE_STREAM) < 0.5 },
  ],
  source: null,
  bodies: null,
  rogue: null,
  rules: null,
};
