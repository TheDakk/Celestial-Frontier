/* What the app takes from a browser page, gathered in one place: the game's page and the layout check's page both
   start the app with it. */
import type { StorageBackend } from '@cf/persistence';
import type { Bus } from '../bus';
import type { GameEvents } from '../events';
import { browserPanelObserver, windowViewportSource } from '../layout';
import { browserClocks } from '../platform/clock';
import { token, uint32 } from '../platform/entropy';
import { pickTextFile, saveTextFile } from '../platform/file-io';
import { devicePreferences, deviceStorage } from '../platform/preferences';
import type { ShellEnv } from './shell';

export function browserShellEnv(win: Window, parts: { bus: Bus<GameEvents>; host: HTMLElement; backend: StorageBackend; build: string }): ShellEnv {
  const reducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)');
  return {
    ...parts,
    doc: win.document,
    clocks: browserClocks,
    entropy: { uint32, token },
    preferences: devicePreferences(deviceStorage()),
    storage: win.navigator.storage,
    viewport: windowViewportSource(win),
    panelObserver: browserPanelObserver,
    initialInput: win.navigator.maxTouchPoints > 0 || win.matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse',
    reducedMotion: { matches: () => reducedMotion.matches, onChange: (listener) => reducedMotion.addEventListener('change', listener) },
    files: { saveTextFile, pickTextFile },
    frames: { request: (run) => win.requestAnimationFrame(run), cancel: (handle) => win.cancelAnimationFrame(handle) },
    dpr: () => win.devicePixelRatio || 1,
    every: (ms, run) => { win.setInterval(run, ms); },
    reload: () => win.location.reload(),
    search: win.location.search,
    update: null,
  };
}
