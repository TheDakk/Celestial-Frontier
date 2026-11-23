import manifest from '../../../packs/manifest.json' with { type: 'json' };
import { version } from '../package.json' with { type: 'json' };
import { createBus } from './bus';
import type { GameEvents } from './events';
import { browserPanelObserver, windowViewportSource } from './layout';
import { cacheStoragePackCache, loadPacks, localFolderSource, parseManifest } from './packs';
import { browserClocks } from './platform/clock';
import { token, uint32 } from './platform/entropy';
import { pickTextFile, saveTextFile } from './platform/file-io';
import { devicePreferences, deviceStorage } from './platform/preferences';
import { openSaveBackend } from './save';
import { startShell } from './screens';
import './shell.css';

// The composition root: it gathers what the browser gives and hands it to the join of the systems. No
// system's own code lives here.
export const bus = createBus<GameEvents>();

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const host = document.getElementById('app')!;
startShell({
  bus,
  doc: document,
  host,
  backend: openSaveBackend(),
  clocks: browserClocks,
  entropy: { uint32, token },
  preferences: devicePreferences(deviceStorage()),
  storage: navigator.storage,
  viewport: windowViewportSource(window),
  panelObserver: browserPanelObserver,
  initialInput: navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse',
  reducedMotion: { matches: () => reducedMotion.matches, onChange: (listener) => reducedMotion.addEventListener('change', listener) },
  files: { saveTextFile, pickTextFile },
  every: (ms, run) => { setInterval(run, ms); },
  reload: () => location.reload(),
  search: location.search,
  build: `${version} (${import.meta.env.MODE})`,
}).catch((error: unknown) => {
  host.textContent = 'Celestial Frontier could not start.';
  throw error;
});

// Art packs load beside the game, never ahead of it: stand-ins draw until a pack is verified.
void loadPacks(parseManifest(manifest), {
  cache: cacheStoragePackCache(),
  sources: [localFolderSource(`${import.meta.env.BASE_URL}art-packs`)],
  status: (status) => bus.emit('pack:status', status),
});
