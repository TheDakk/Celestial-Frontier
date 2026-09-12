import { produceCanonicalEarthSnapshot } from './entry.js';
import { compileEarthArtKitV4 } from '../../apps/game/src/landfall-conditioning.js';
export function compileCanonicalEarthKit(kit: string) {
  return compileEarthArtKitV4(produceCanonicalEarthSnapshot().snapshot, kit);
}
