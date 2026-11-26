/* N9 protoplanet: a world still forming in a protostar's disk. A protostar has no planets (LEGACY 4029), so the
   system stream is not read: the count comes from the star's own new stream. 70% of disks hold one; a second at
   40%; a third at 10%. (guess) The second and third are drawn in turn from that same stream, each only when the
   one before it exists. */
import type { WorldTypeDefinition } from '../rules.js';
import { declareStream, ownStream } from '../streams.js';
import type { CensusSystem } from '../census.js';

/** The disk's roll: the design's salt, taken as written. */
const DISK_STREAM = declareStream('protoplanet', 0x9B0, 1);
const CHANCES = [0.7, 0.4, 0.1] as const;

function protoplanets(starSeed: number, system: CensusSystem): number {
  if (system.kind !== 'PROTO') return 0;
  const draw = ownStream(starSeed, DISK_STREAM);
  let count = 0;
  while (count < CHANCES.length && draw() < CHANCES[count]!) count++;
  return count;
}

export const protoplanet: WorldTypeDefinition = {
  key: 'protoplanet',
  label: 'Protoplanet',
  slice: null,
  source: [
    { name: 'protostars', count: (_starSeed, system) => (system.kind === 'PROTO' ? 1 : 0) },
    { name: 'protostars holding a protoplanet (own stream under 70%)', count: (starSeed, system) => (protoplanets(starSeed, system) > 0 ? 1 : 0) },
    { name: 'protoplanets', count: protoplanets },
  ],
  bodies: null,
  rogue: null,
  rules: null,
};
