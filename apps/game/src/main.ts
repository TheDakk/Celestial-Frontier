import manifest from '../../../packs/manifest.json' with { type: 'json' };
import { version } from '../package.json' with { type: 'json' };
import { createBus } from './bus';
import type { GameEvents } from './events';
import { cacheStoragePackCache, loadPacks, localFolderSource, parseManifest } from './packs';
import { openSaveBackend } from './save';
import { browserShellEnv, startShell } from './screens';
import './shell.css';

// The composition root: it gathers what the browser gives and hands it to the join of the systems. No
// system's own code lives here.
export const bus = createBus<GameEvents>();

const host = document.getElementById('app')!;
startShell(browserShellEnv(window, { bus, host, backend: openSaveBackend(), build: `${version} (${import.meta.env.MODE})` })).catch((error: unknown) => {
  host.textContent = 'Celestial Frontier could not start.';
  throw error;
});

// Art packs load beside the game, never ahead of it: stand-ins draw until a pack is verified.
void loadPacks(parseManifest(manifest), {
  cache: cacheStoragePackCache(),
  sources: [localFolderSource(`${import.meta.env.BASE_URL}art-packs`)],
  status: (status) => bus.emit('pack:status', status),
});
