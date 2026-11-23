import { createMemoryBackend, type StorageBackend } from '@cf/persistence';
import { createBus } from '../src/bus';
import type { GameEvents, PersistState } from '../src/events';
import type { Clocks } from '../src/platform/clock';
import { devicePreferences } from '../src/platform/preferences';
import { startShell } from '../src/screens';
import type { Shell, ShellEnv } from '../src/screens/shell';
import type { UpdateControl } from '../src/offline';
import { NOW, controlledClock } from './save-support';

/** jsdom lays nothing out: every element counts as rendered unless a style hides it. */
export function pretendLayout(): void {
  Object.defineProperty(HTMLElement.prototype, 'getClientRects', { configurable: true, value: () => [{ width: 58, height: 44 }] });
}

/** Gives every element a size, as a laid-out page would: jsdom has none. */
export function pretendSize(width: number, height: number): void {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => height });
}

export function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

export interface Page extends Shell {
  env: ShellEnv;
  backend: StorageBackend;
  time: ReturnType<typeof controlledClock>;
  /** What the page was asked to do every so often: the heartbeat. */
  timers: Array<{ ms: number; run: () => void }>;
  /** The frames the page has asked for and not yet been given. */
  frames: Array<() => void>;
  reloads: number;
  files: Array<{ name: string; text: string }>;
  /** What the next press of Restore is answered with: a file's text, null, or `never` for a chooser that does not answer. */
  chooser: { answer: string | null | 'never' };
  devicePreferenceRows: Map<string, string>;
  persistCalls: number;
  panel(): HTMLElement;
  /** The control of Settings with this key (and value, for a choice). */
  control(key: string, value?: string): HTMLButtonElement;
  openSettings(): void;
}

let tabs = 0;

/** The whole app on a store held in memory, wired as the browser page wires it. */
export async function bootPage(options: {
  backend?: StorageBackend;
  search?: string;
  persist?: { persisted: PersistState; asked: PersistState };
  width?: number;
  height?: number;
  update?: (reload: () => void) => UpdateControl;
} = {}): Promise<Page> {
  document.body.className = '';
  document.body.innerHTML = '<div id="app"></div>';
  setVisibility('visible');
  const backend = options.backend ?? createMemoryBackend();
  const time = controlledClock(1_000);
  const clocks: Clocks = { wallNow: () => NOW + time.now(), monotonicNow: time.now };
  const rows = new Map<string, string>();
  const tab = ++tabs;
  const page = {
    backend, time, timers: [] as Page['timers'], frames: [] as Array<() => void>, reloads: 0, files: [] as Page['files'],
    chooser: { answer: null } as Page['chooser'], devicePreferenceRows: rows, persistCalls: 0,
  };
  const answer = (state: PersistState | undefined): Promise<boolean> =>
    state === 'unknown' ? Promise.reject(new Error('refused')) : Promise.resolve(state === 'kept');
  const env: ShellEnv = {
    bus: createBus<GameEvents>(),
    doc: document,
    host: document.getElementById('app')!,
    backend,
    clocks,
    entropy: { uint32: () => 7, token: () => `tab-${tab}` },
    preferences: devicePreferences({ getItem: (key) => rows.get(key) ?? null, setItem: (key, value) => { rows.set(key, value); } }),
    storage: options.persist === undefined ? undefined : {
      persisted: () => answer(options.persist!.persisted),
      persist: () => { page.persistCalls += 1; return answer(options.persist!.asked); },
    },
    viewport: { read: () => ({ width: options.width ?? 390, height: options.height ?? 844 }), subscribe: () => () => undefined },
    panelObserver: () => ({ observe() {}, disconnect() {} }),
    initialInput: 'mouse',
    reducedMotion: { matches: () => false, onChange() {} },
    files: {
      saveTextFile: (name, text) => { page.files.push({ name, text }); },
      pickTextFile: () => (page.chooser.answer === 'never' ? new Promise(() => undefined) : Promise.resolve(page.chooser.answer)),
    },
    frames: { request: (run) => { page.frames.push(run); return page.frames.length; }, cancel() { page.frames.length = 0; } },
    dpr: () => 1,
    every: (ms, run) => { page.timers.push({ ms, run }); },
    reload: () => { page.reloads += 1; },
    search: options.search ?? '',
    build: 'test-build',
    update: options.update ?? null,
  };
  const shell = await startShell(env);
  await shell.ready;
  const panel = (): HTMLElement => document.getElementById('panel-settings')!;
  return Object.assign(page, shell, {
    env,
    panel,
    control(key: string, value?: string): HTMLButtonElement {
      const found = panel().querySelector<HTMLButtonElement>(value === undefined ? `[data-set="${key}"]` : `[data-set="${key}"][data-value="${value}"]`);
      if (found === null) throw new Error(`Settings has no control ${key} ${value ?? ''}`);
      return found;
    },
    openSettings(): void { document.querySelector<HTMLElement>('.dock [data-screen="settings"]')!.click(); },
  });
}

/** Gives the page `count` frames, a tenth of a second apart. */
export function runFrames(page: Pick<Page, 'frames' | 'time'>, count = 1): void {
  for (let i = 0; i < count; i++) {
    page.time.advance(100);
    for (const run of page.frames.splice(0)) run();
  }
}

/** Lets every promise already under way run to its end. */
export async function settled(): Promise<void> {
  for (let i = 0; i < 20; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}
