import { produceCanonicalEarthSnapshot } from './entry.js';
import { compileEarthArtKitV4, compileEarthKitEngineV4, type KitEngineAssetsV4, type KitEngineSettingsV4 } from '../../apps/game/src/landfall-conditioning.js';
export { compileCreatureFinishV1 } from '../../apps/game/src/landfall-conditioning.js';
export function compileCanonicalEarthKit(kit: string) {
  return compileEarthArtKitV4(produceCanonicalEarthSnapshot().snapshot, kit);
}

export function compileCanonicalEarthKitEngine(kit: string, assets: KitEngineAssetsV4, settings: KitEngineSettingsV4) {
  return compileEarthKitEngineV4(produceCanonicalEarthSnapshot().snapshot, kit, assets, settings);
}
