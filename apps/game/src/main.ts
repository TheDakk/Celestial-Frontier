import manifest from '../../../packs/manifest.json' with { type: 'json' };
import { version } from '../package.json' with { type: 'json' };
import { createBus } from './bus';
import type { GameEvents } from './events';
import { createUpdateControl } from './offline';
import { cacheStoragePackCache, loadPacks, localFolderSource, parseManifest } from './packs';
import { openSaveBackend } from './save';
import { browserShellEnv, startShell } from './screens';
import './shell.css';

// The composition root: it gathers what the browser gives and hands it to the join of the systems. No
// system's own code lives here.
export const bus = createBus<GameEvents>();

const host = document.getElementById('app')!;
// The offline shell exists only in a build: the development server has no worker. Its scope is the app's base.
const scope = new URL(import.meta.env.BASE_URL, location.href).href;
const update = !import.meta.env.PROD ? null : (reload: () => void) => createUpdateControl({
  container: navigator.serviceWorker as ServiceWorkerContainer | undefined,
  workerUrl: new URL('service-worker.js', scope).href,
  scope,
  reload,
});
startShell({ ...browserShellEnv(window, { bus, host, backend: openSaveBackend(), build: `${version} (${import.meta.env.MODE})` }), update }).catch((error: unknown) => {
  host.textContent = 'Celestial Frontier could not start.';
  throw error;
});

// Art packs load beside the game, never ahead of it: stand-ins draw until a pack is verified.
void loadPacks(parseManifest(manifest), {
  cache: cacheStoragePackCache(),
  sources: [localFolderSource(`${import.meta.env.BASE_URL}art-packs`)],
  status: (status) => bus.emit('pack:status', status),
});
