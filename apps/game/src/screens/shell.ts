/* The join of the app: it boots the save, starts the systems and hands each the ports it needs from the
   others. Everything of the browser arrives through `ShellEnv`, so the whole app runs the same under a test. */
import type { SaveStateV2, StorageBackend } from '@cf/persistence';
import type { Bus } from '../bus';
import type { GameEvents, InputMode, PersistState, SizeClass } from '../events';
import { mountInputMode } from '../input';
import { mountViewport, type ResizeObserverLike, type ViewportSource } from '../layout';
import { createNavController, type NavController } from '../nav';
import { createReloadCoordinator, reloadRefusalWords, type UpdateControl } from '../offline';
import type { Clocks } from '../platform/clock';
import { presentationRandom } from '../platform/entropy';
import type { DevicePreferences } from '../platform/preferences';
import { createPersistAsker, readPersistState, type StorageManagerLike } from '../protect';
import {
  HEARTBEAT_MS, LEASE_TTL_MS, REGISTRY, bootSave, createSaveLoop, createSaveRuntime, createWriteGate,
  replaceExpedition, resetExpedition, retryHeldRead, type BootResult, type SaveLoop, type SaveRuntime, type WriteGate,
} from '../save';
import { GESTURE_EVENTS, countsAsGesture, createShellSound, readAudioAccessibilityPrefs, writeAudioAccessibilityPrefs, type ShellSound } from '../sound';
import {
  DISPLAY_HEADINGS, TooltipOwner, applyDisplayScale, applyMotion, applyTextPrefs, applyTokens, createPanelManager,
  createToast, displayText, interfaceGaps, localeFromSearch, motionReduced, sheetState, textSizeOf,
  type PanelManager, type Toast,
} from '../ui';
import { mountChrome, type Chrome } from './chrome';
import { mapScreen } from './map';
import { NOTICE_WORDS, mountNotices } from './notices';
import { createScreenRegistry, type ScreenContext, type ScreenRegistry } from './registry';
import { settingsScreen, type StatusFacts } from './settings';

/** The stable livery of the ship, as the game has always painted it: the reach gates read the ship through it. */
export const SHIP_LIVERY_SEED = 0x5111;
const LEASE_OWNER = 'celestial-frontier-game-tab';

/** Everything the app takes from the browser. */
export interface ShellEnv {
  bus: Bus<GameEvents>;
  doc: Document;
  /** The element the app is drawn in. */
  host: HTMLElement;
  backend: StorageBackend;
  clocks: Clocks;
  entropy: { uint32(): number; token(): string };
  preferences: DevicePreferences;
  /** `navigator.storage`, where the browser has it. */
  storage: StorageManagerLike | undefined;
  viewport: ViewportSource;
  panelObserver: (onWidth: (width: number) => void) => ResizeObserverLike;
  initialInput: InputMode;
  /** The device's own wish for reduced motion, and a call each time it changes. */
  reducedMotion: { matches(): boolean; onChange(listener: () => void): void };
  files: { saveTextFile(name: string, text: string): void; pickTextFile(maxBytes: number): Promise<string | null> };
  /** The next frame the browser draws, and how to give it up. */
  frames: { request(run: () => void): number; cancel(handle: number): void };
  /** Screen pixels per CSS pixel. */
  dpr(): number;
  /** Calls `run` every `ms`, for the life of the page. */
  every(ms: number, run: () => void): void;
  reload(): void;
  /** The page's address query: it may name a locale. */
  search: string;
  build: string;
  /** The offline and update control, given the reload it asks for; null where the page has no offline shell. */
  update: ((reload: () => void) => UpdateControl) | null;
}

export interface Shell {
  readonly booted: BootResult;
  readonly live: SaveStateV2;
  readonly gate: WriteGate;
  readonly runtime: SaveRuntime;
  readonly loop: SaveLoop;
  readonly nav: NavController;
  readonly panels: PanelManager;
  readonly registry: ScreenRegistry;
  readonly chrome: Chrome;
  readonly sound: ShellSound;
  readonly toast: Toast;
  /** Resolves when the first heartbeat is over: the page then holds the save, or knows it does not. */
  readonly ready: Promise<void>;
}

export async function startShell(env: ShellEnv): Promise<Shell> {
  const { bus, doc, clocks, backend } = env;
  const root = doc.documentElement;
  const view = doc.defaultView!;
  const visible = (): boolean => doc.visibilityState === 'visible';
  // Packs load beside the boot: what each came to is noted from the start.
  const packs = new Map<string, StatusFacts['packs'][number]>();
  bus.on('pack:status', (event) => { packs.set(event.name, { name: event.name, state: event.state }); });
  let started = false;
  let routeSaveWanted = false;

  const nav = createNavController({
    authority: () => live,
    liverySeed: () => SHIP_LIVERY_SEED,
    bus,
    requestSave: () => { if (started) void loop.request('route'); else routeSaveWanted = true; },
  });
  const booted = await bootSave({ backend, registry: REGISTRY, wallNow: clocks.wallNow(), freshRoute: nav.solRoute() });
  const live = booted.state;
  const gate = createWriteGate(booted.hold);
  const runtime = createSaveRuntime({
    backend, registry: REGISTRY,
    initialRevision: booted.revision, initialExtensions: booted.extensions, initialState: booted.state,
    restoredAuthority: booted.restoredAuthority, freshSessionSeed: env.entropy.uint32(),
    ownerId: LEASE_OWNER, token: env.entropy.token(), leaseTtlMs: LEASE_TTL_MS, now: clocks.monotonicNow,
    visible: visible(), answerable: false,
  });
  const loop = createSaveLoop({ runtime, gate, bus, clocks, backend, live: () => live, route: () => nav.route() });
  nav.restore(live.savedView);

  // Look: tokens, the stored text settings, the display scale of the size class, motion.
  let sizeClass: SizeClass = 'compact';
  let inputMode: InputMode = env.initialInput;
  const applyPresentation = (): void => {
    applyTextPrefs(root, live);
    applyDisplayScale(root, textSizeOf(live.fsMode), sizeClass);
    applyMotion(root, motionReduced(live.motionMode, env.reducedMotion.matches()));
  };
  applyTokens(root);
  bus.on('layout:size-class', (event) => { sizeClass = event.sizeClass; applyPresentation(); });
  bus.on('input:mode', (event) => { inputMode = event.mode; });
  mountViewport(root, bus, env.viewport);
  mountInputMode(root, bus, doc, env.initialInput);
  env.reducedMotion.onChange(applyPresentation);
  applyPresentation();

  const sound = createShellSound({ settings: () => live, random: presentationRandom(env.entropy.uint32()) });
  let listening = readAudioAccessibilityPrefs(env.preferences);
  const tooltips = new TooltipOwner({ document: doc, enabled: () => live.tipsOn, blocked: () => false, mode: () => inputMode });

  // Save protection: the browser is asked once, on the first gesture. Sound is readied by a gesture the browser counts.
  let persist: PersistState = 'unknown';
  bus.on('protect:persist', (event) => { persist = event.state; });
  const asker = createPersistAsker({ storage: env.storage, bus });
  void readPersistState(env.storage).then((state) => bus.emit('protect:persist', { state }));
  const onGesture = (): void => { asker.onFirstGesture(); };
  doc.addEventListener('pointerdown', onGesture, true);
  doc.addEventListener('keydown', onGesture, true);
  const onCounted = (event: Event): void => { if (countsAsGesture(event)) sound.unlock(); };
  for (const type of GESTURE_EVENTS) doc.addEventListener(type, onCounted, true);

  const status = (): StatusFacts => ({
    build: env.build,
    save: loop.status === 'reload-required' ? 'reload-required' : loop.mayWrite() ? 'ok' : 'held',
    revision: runtime.revision,
    packs: [...packs.values()],
    sheet: sheetState(),
    gaps: { glyphs: new Set(interfaceGaps.glyphs).size, icons: new Set(interfaceGaps.icons).size, elements: new Set(interfaceGaps.elements).size },
  });

  const ctx: ScreenContext = { bus, sizeClass: () => sizeClass, inputMode: () => inputMode };
  const registry = createScreenRegistry();
  const panels = createPanelManager(doc, { fallbackFocus: () => env.host.querySelector<HTMLElement>('.stage canvas') });
  // The toast and the notices are drawn in the chrome, which needs the screens, which need both.
  const toast: Toast = { show: (title, message, force) => shown.show(title, message, force) };
  const refreshNotices = (): void => notices.refresh();
  const replacement = { runtime, gate, settle: () => loop.flush(), reload: env.reload };
  let replacing = 0;
  const whileReplacing = <T>(run: Promise<T>): Promise<T> => {
    replacing += 1;
    return run.finally(() => { replacing -= 1; refreshNotices(); });
  };
  // A reload into another build of the app waits for the save, like every reload the page chooses.
  const reloadForUpdate = createReloadCoordinator({
    conflict() {
      if (replacing > 0) return 'replacement';
      const { leaseOwned, staleBlocked } = runtime.diagnostics();
      return loop.status === 'reload-required' || !gate.mayWrite() || !leaseOwned || staleBlocked ? 'save-authority' : null;
    },
    store: () => loop.request('lifecycle'),
    schedule() { void runtime.release().catch(() => undefined).then(env.reload); },
  });
  const update = env.update?.(() => {
    void reloadForUpdate().then((outcome) => {
      if (outcome.kind !== 'refused') return;
      const words = reloadRefusalWords(outcome);
      toast.show(words.title, words.text, words.force);
    });
  }) ?? null;

  registry.registerScreen(mapScreen({
    nav, sound, toast, panels,
    live: () => live,
    epoch: () => loop.publishedEpoch(),
    now: clocks.monotonicNow,
    dpr: env.dpr,
    frames: env.frames,
    reducedMotion: () => motionReduced(live.motionMode, env.reducedMotion.matches()),
    covers: () => [...env.host.querySelectorAll('.top-bar, .dock-button')].map((cover) => cover.getBoundingClientRect()),
  }));
  registry.registerScreen(settingsScreen({
    live: () => live,
    readOnly: () => !loop.mayWrite(),
    changed(field) {
      if (field === 'sndOn' || field === 'sfxVol') sound.applyVolume();
      if (field === 'tipsOn' && !live.tipsOn) tooltips.hide();
      applyPresentation();
      bus.emit('settings:changed', { field });
      void loop.request('settings');
    },
    listening: {
      get: () => listening,
      set(modes) { listening = Object.freeze({ ...modes }); writeAudioAccessibilityPrefs(env.preferences, listening); },
    },
    locale: localeFromSearch(env.search),
    protect: {
      registry: REGISTRY, clocks, bus, runtime, gate, toast,
      settle: () => loop.flush(),
      persistState: () => persist,
      askAgain: () => asker.askAgain(),
      canBackUp: () => booted.revision > 0 || booted.kind === 'recovered-protected',
      replaceExpedition: (operations) => whileReplacing(replaceExpedition(replacement, operations)),
      saveTextFile: env.files.saveTextFile,
      pickTextFile: env.files.pickTextFile,
    },
    mayReplace: () => gate.mayWrite(),
    reset: () => whileReplacing(resetExpedition({ ...replacement, registry: REGISTRY, clocks, solView: nav.solRoute() })),
    status,
    update,
    toast,
  }));

  const chrome = mountChrome(env.host, { screens: registry.screens(), ctx, panels, panelObserver: env.panelObserver });
  chrome.stage.before(displayText(DISPLAY_HEADINGS.title, { level: 1 }));
  const shown = createToast({ el: chrome.toast, now: clocks.monotonicNow, popUps: () => live.notifOn });
  const notices = mountNotices(chrome.notices, {
    boot: booted, gate, toast,
    retry: () => retryHeldRead({ backend, registry: REGISTRY, wallNow: clocks.wallNow(), gate }),
    reload: env.reload,
  });

  // The save: one heartbeat now and one every HEARTBEAT_MS while the page is seen; hidden pages give the save up.
  let reloading = false;
  bus.on('save:reload-required', () => {
    if (reloading) return;
    reloading = true;
    shown.show(NOTICE_WORDS.reload.title, NOTICE_WORDS.reload.text, true);
    env.reload();
  });
  bus.on('save:held', refreshNotices);
  doc.addEventListener('visibilitychange', () => { void (visible() ? loop.show() : loop.hide()); });
  view.addEventListener('pagehide', () => { void loop.hide(); });
  view.addEventListener('pageshow', (event) => { if (event.persisted) void loop.show(); });
  env.every(HEARTBEAT_MS, () => { void loop.beat(); });
  const ready = (visible() ? loop.beat() : Promise.resolve()).then(() => {
    started = true;
    if (routeSaveWanted) void loop.request('route');
  });

  return { booted, live, gate, runtime, loop, nav, panels, registry, chrome, sound, toast, ready };
}
