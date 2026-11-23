/* The page of the layout check (`npm run layout`): the whole app on a save held in memory, brought to one state the
   address names, then measured. Address: ?fixture=<id>&save=ok|newer|unavailable&input=touch|mouse&text=|fs-lg|fs-xl
   &locale=en|qps-ploc&fault=<a planted fault>. Never part of the game's own page. */
import { V5_SCHEMA_KEY, createMemoryBackend, importSaveV2, initializeFreshV5, type StorageBackend } from '@cf/persistence';
import { createBus } from './bus';
import type { GameEvents, InputMode } from './events';
import { FAULTS, checkLayout, checkScrollCues, collectBoxes, collectScrollAreas, plantFault, type Fault, type LayoutProblem } from './layoutcheck';
import { browserClocks } from './platform/clock';
import { devicePreferences } from './platform/preferences';
import { UPDATE_WORDS, type UpdateControl } from './offline';
import { REGISTRY } from './save';
import { browserShellEnv, startShell } from './screens';
import './shell.css';

declare global {
  interface Window {
    /** Resolves to the ids of every state the page can show, once the state the address names is drawn. */
    __cfLayoutReady?: Promise<readonly string[]>;
    __cfLayoutProblems?: () => LayoutProblem[];
  }
}

const params = new URLSearchParams(location.search);
const host = document.getElementById('app')!;
const input: InputMode = params.get('input') === 'touch' ? 'touch' : 'mouse';
/** The states of the map, which is always shown: as it boots, and with the survey card of a world open. */
const MAP_FIXTURES = ['map', 'map-card'] as const;

/** A save a newer build wrote, or storage that cannot be read: the two boots that hold the save. */
async function backendFor(save: string | null): Promise<StorageBackend> {
  const backend = createMemoryBackend();
  if (save === 'newer') {
    const fresh = importSaveV2('{}', REGISTRY, browserClocks.wallNow());
    if (!fresh.ok) throw new Error('no fresh state');
    await initializeFreshV5(backend, { state: fresh.state, extensions: {} }, REGISTRY, browserClocks.wallNow());
    const row = JSON.parse((await backend.get('meta', V5_SCHEMA_KEY)) as string) as Record<string, unknown>;
    await backend.apply([{ store: 'meta', key: V5_SCHEMA_KEY, value: JSON.stringify({ ...row, schema: Number(row['schema']) + 1 }) }]);
  }
  if (save !== 'unavailable') return backend;
  const refuse = (): Promise<never> => Promise.reject(new Error('storage is unavailable'));
  return { ...backend, get: refuse, keys: refuse } as StorageBackend;
}

/** The offline and update control at its widest: its longest words and every control it can offer. */
const WIDEST_UPDATE: UpdateControl = {
  view: () => ({ state: 'error', message: UPDATE_WORDS.blocked, busy: false, check: true, activate: true, reload: true, rollback: true }),
  buildId: () => '0123456789abcdef'.repeat(4),
  onChange: () => () => undefined,
  ready: Promise.resolve(),
  check: () => Promise.resolve(),
  activate() {}, reload() {}, rollback() {}, dispose() {},
};

const frames = async (count: number): Promise<void> => {
  for (let i = 0; i < count; i++) await new Promise<void>((resolve) => { requestAnimationFrame(() => resolve()); });
};
const press = (target: EventTarget, key: string): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
};

async function show(): Promise<readonly string[]> {
  const bus = createBus<GameEvents>();
  const rows = new Map<string, string>();
  const shell = await startShell({
    ...browserShellEnv(window, { bus, host, backend: await backendFor(params.get('save')), build: 'layout check' }),
    // The same on every run: nothing of the device, no motion, and no reload.
    preferences: devicePreferences({ getItem: (key) => rows.get(key) ?? null, setItem: (key, value) => { rows.set(key, value); } }),
    storage: undefined,
    initialInput: input,
    reducedMotion: { matches: () => true, onChange() {} },
    reload() {},
    update: () => WIDEST_UPDATE,
  });
  await shell.ready;
  await frames(3);
  const docked = shell.registry.screens().filter((screen) => screen.dock !== undefined);
  const dockButton = (id: string): HTMLElement => host.querySelector<HTMLElement>(`.dock [data-screen="${id}"]`)!;

  const text = params.get('text') ?? '';
  if (text !== '') {
    dockButton('settings').click();
    host.querySelector<HTMLElement>(`[data-set="size"][data-value="${text}"]`)!.click();
    shell.panels.close();
    await frames(2);
  }

  const fixture = params.get('fixture') ?? 'map';
  const ctx = { bus, sizeClass: () => document.documentElement.dataset['sizeClass'] as 'compact' | 'medium' | 'wide', inputMode: () => input };
  const screen = docked.find((candidate) => candidate.fixtures.some((state) => state.id === fixture));
  if (screen !== undefined) {
    screen.fixtures.find((state) => state.id === fixture)!.setup(ctx);
    dockButton(screen.id).click();
  } else if (fixture === 'map-card') {
    // By the keyboard, as a player may: the arrows walk the worlds to Earth, Enter opens its card.
    const map = host.querySelector<HTMLElement>('canvas.map')!;
    map.focus();
    const held = (): string => host.querySelector('.map-focus span')?.textContent ?? '';
    for (let i = 0; i < 40 && held() !== 'Earth'; i++) { press(map, 'ArrowRight'); await frames(1); }
    press(map, 'Enter');
  } else if (fixture !== 'map') {
    throw new Error(`no such fixture: ${fixture}`);
  }

  // The state asked for is the state measured: an empty screen must never pass for a full one.
  await frames(2);
  const shown = (selector: string): boolean => host.querySelector<HTMLElement>(selector)?.checkVisibility() === true;
  if (screen !== undefined && !shown(`#panel-${screen.id} .panel-body > *`)) throw new Error(`the panel of ${fixture} did not open`);
  if (fixture === 'map-card' && !shown('.stage .card [data-sel="title"]')) throw new Error('no survey card opened');
  if (!shown('canvas.map') || !shown('.map-captions canvas')) throw new Error('the map and its words are not drawn');
  if ((params.get('save') ?? 'ok') !== 'ok' && !shown('.notices .notice')) throw new Error('the held save shows no notice');

  const fault = params.get('fault');
  if (fault !== null) {
    if (!(FAULTS as readonly string[]).includes(fault)) throw new Error(`no such fault: ${fault}`);
    plantFault(fault as Fault, host);
  }
  await frames(3);
  return [...MAP_FIXTURES, ...docked.flatMap((candidate) => candidate.fixtures.map((state) => state.id))];
}

window.__cfLayoutProblems = () => [...checkLayout(collectBoxes(host), { w: innerWidth, h: innerHeight }, input), ...checkScrollCues(collectScrollAreas(host))];
window.__cfLayoutReady = show();
