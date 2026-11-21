/* Hand-owned explicit-epoch boundary for the planet survey card.

   The verbatim planetDescriptor reads the ecology epoch as the free global
   COSMIC_EPOCH twice: itself, for Earth's epoch vagrants
   (descriptors.verbatim.js:92), and through ecology's verbatim planetSpecies,
   for every world's roster. This wrapper takes the epoch as an argument, sets
   the global only for the duration of the verbatim call, and then puts back
   exactly what was there before, even when the call throws. The verbatim body
   is unchanged and stays the parity oracle. */
import { checkedEcologyEpoch } from '@cf/domain-ecology';
import { planetDescriptor, type Descriptor } from './descriptors.verbatim.js';

type Raw = Record<string, unknown>;

const EPOCH_GLOBAL = 'COSMIC_EPOCH';

/** planetDescriptor at an explicit ecology epoch (an integer from 0 through 10000). */
export function planetDescriptorAtEcologyEpoch(
  planet: Raw,
  system: Raw | null | undefined,
  placement: Raw | null | undefined,
  ecologyEpoch: number,
): Descriptor {
  const epoch = checkedEcologyEpoch(ecologyEpoch);
  const previous = Reflect.getOwnPropertyDescriptor(globalThis, EPOCH_GLOBAL);
  if (!Reflect.defineProperty(globalThis, EPOCH_GLOBAL, {
    configurable: true, enumerable: false, writable: true, value: epoch,
  })) throw new Error('could not set the ecology epoch for the verbatim planetDescriptor');
  try {
    return planetDescriptor(planet, system, placement);
  } finally {
    if (previous) Reflect.defineProperty(globalThis, EPOCH_GLOBAL, previous);
    else Reflect.deleteProperty(globalThis, EPOCH_GLOBAL);
  }
}
