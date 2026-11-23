import manifest from '../../../packs/manifest.json' with { type: 'json' };
import { createBus } from './bus';
import type { GameEvents } from './events';
import { cacheStoragePackCache, loadPacks, localFolderSource, parseManifest } from './packs';

// The composition root: it creates the bus and wires each system to it. No system's own code lives here.
export const bus = createBus<GameEvents>();

// Art packs load beside the game, never ahead of it: stand-ins draw until a pack is verified.
void loadPacks(parseManifest(manifest), {
  cache: cacheStoragePackCache(),
  sources: [localFolderSource(`${import.meta.env.BASE_URL}art-packs`)],
  status: (status) => bus.emit('pack:status', status),
});
