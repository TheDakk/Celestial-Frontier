/* The page's side of the offline shell: it registers the worker and follows what the worker says, as a view a
   screen draws. A new build is found, checked whole and held waiting. It becomes the active build when the
   player activates it, or by the browser's own rule once every page of the app has closed, so the next launch
   may run it unasked. No open page is ever switched: this page enters another build only when the player
   reloads. Nothing here reloads the page by itself, and a change of controller proves nothing: only a message
   from the exact worker asked does. */
import { SHELL_SCHEMA } from '../../offline/worker-source';

const BUILD_ID = /^[a-f0-9]{64}$/;

export const UPDATE_WORDS = {
  heading: 'App status',
  label: 'App offline and update status',
  check: 'Check for updates',
  activate: 'Activate update',
  reload: 'Reload when ready',
  rollback: 'Roll back',
  installed: 'Checking the installed offline build…',
  ready: 'Offline mode is ready. This exact build is available without a connection.',
  current: 'This exact build is current and available offline.',
  checking: 'Checking for a complete update…',
  verifying: 'Verifying a complete exact update…',
  waiting: 'A complete update is waiting. It will not replace this open page. It becomes active when you activate it, or after every Celestial Frontier window is closed.',
  updateReady: 'A complete update is ready. Activate it when you choose; this page will not reload automatically.',
  asking: 'Activating the verified update…',
  activating: 'The verified update is activating…',
  activated: 'The update is activated. Reload when you are ready to enter the new build.',
  activeElsewhere: 'A verified update is active. Reload when you are ready to enter it.',
  verifyingPrior: 'Verifying the retained prior build…',
  rolledBack: 'The prior complete build is selected. Reload when you are ready to use it.',
  blocked: 'This update cannot activate while another open Celestial Frontier window still uses the retained rollback build. Reload or close that window, then try again.',
  rejected: 'The update was rejected because its complete exact asset set could not be verified.',
  checkFailed: 'Update check could not reach a complete build. Your current offline build is unchanged.',
  askFailed: 'The verified update could not be asked to activate. Your current offline build is unchanged.',
  rollbackOwnership: 'Rollback cannot change builds while an open Celestial Frontier window has invalid build ownership. Reload or close that window, then try again.',
  rollbackNone: 'Rollback is unavailable because no complete prior build is retained.',
  rollbackFailed: 'Rollback could not be requested. The current offline build is unchanged.',
  unsupported: 'This browser does not support installed offline updates.',
  setupFailed: 'Offline setup could not verify a complete local build. Online play is unchanged.',
} as const;

export interface UpdateView {
  state: 'starting' | 'ready' | 'checking' | 'update' | 'reload' | 'error';
  message: string;
  /** A request is under way: the controls wait. */
  busy: boolean;
  /** Which controls are offered. */
  check: boolean;
  activate: boolean;
  reload: boolean;
  rollback: boolean;
}

export interface UpdateControl {
  view(): UpdateView;
  /** The identity of the build this page runs: the build that was active when the page's worker first answered it.
   *  Null until then, and where there is no worker. A build activated later does not change it: the page keeps its
   *  own build until it reloads. */
  buildId(): string | null;
  /** Calls `listener` after each change of the view; the returned function stops it. */
  onChange(listener: () => void): () => void;
  /** Resolves when the worker is registered, or could not be. */
  readonly ready: Promise<void>;
  check(): Promise<void>;
  activate(): void;
  reload(): void;
  rollback(): void;
  dispose(): void;
}

export interface UpdateControlOptions {
  /** `navigator.serviceWorker`, where the browser has it. */
  container: ServiceWorkerContainer | undefined;
  workerUrl: string;
  scope: string;
  /** The player asked to reload into the selected build. */
  reload(): void;
}

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && (value as Row)['schema'] === SHELL_SCHEMA;
const isBuildId = (value: unknown): value is string => typeof value === 'string' && BUILD_ID.test(value);

interface StatusMessage { workerBuildId: string; activeBuildId: string | null; priorBuildId: string | null; phase: 'active' | 'waiting' }
function asStatus(value: unknown): StatusMessage | null {
  if (!isRow(value) || value['type'] !== 'CF_PWA_STATUS' || !isBuildId(value['workerBuildId'])
    || !(value['activeBuildId'] === null || isBuildId(value['activeBuildId']))
    || !(value['priorBuildId'] === null || isBuildId(value['priorBuildId']))
    || (value['phase'] !== 'active' && value['phase'] !== 'waiting')) return null;
  return value as unknown as StatusMessage;
}
function asActivation(value: unknown): { ok: boolean; buildId: string } | null {
  if (!isRow(value) || value['type'] !== 'CF_PWA_ACTIVATE_RESULT' || typeof value['ok'] !== 'boolean' || !isBuildId(value['buildId'])) return null;
  if (value['ok'] ? value['reason'] !== undefined : value['reason'] !== 'prior-build-in-use') return null;
  return value as unknown as { ok: boolean; buildId: string };
}
function asRollback(value: unknown): { ok: boolean; reason?: string } | null {
  if (!isRow(value) || value['type'] !== 'CF_PWA_ROLLBACK_RESULT' || typeof value['ok'] !== 'boolean') return null;
  const whole = value['ok']
    ? isBuildId(value['activeBuildId']) && isBuildId(value['priorBuildId']) && value['activeBuildId'] !== value['priorBuildId']
    : typeof value['reason'] === 'string';
  return whole ? value as unknown as { ok: boolean; reason?: string } : null;
}

export function createUpdateControl(options: UpdateControlOptions): UpdateControl {
  const { container } = options;
  const listeners = new Set<() => void>();
  const view: UpdateView = { state: 'starting', message: '', busy: false, check: true, activate: false, reload: false, rollback: false };
  let disposed = false;
  let registration: ServiceWorkerRegistration | null = null;
  let waitingBuildId: string | null = null;
  let waitingWorker: ServiceWorker | null = null;
  /** The worker asked to activate, and the build it named. */
  let asked: { worker: ServiceWorker; buildId: string } | null = null;
  let rollbackWorker: ServiceWorker | null = null;
  /** The words of a reload already offered: they come back after any other news. */
  let reloadWords: string | null = null;
  let observed: { worker: ServiceWorker; listener: () => void } | null = null;
  let pageBuildId: string | null = null;

  const changed = (): void => { for (const listener of [...listeners]) listener(); };
  const show = (message: string, state: UpdateView['state'], more: Partial<UpdateView> = {}): void => {
    if (disposed) return;
    Object.assign(view, more, { message, state });
    changed();
  };
  const offerReload = (words: string, more: Partial<UpdateView> = {}): void => {
    reloadWords = words;
    show(words, 'reload', { ...more, reload: true });
  };
  const askStatus = (worker: ServiceWorker | null | undefined, target: 'active' | 'waiting'): void => {
    worker?.postMessage({ type: 'CF_PWA_GET_STATUS', schema: SHELL_SCHEMA, target });
  };

  const inspect = (): void => {
    if (!registration || disposed) return;
    if (registration.waiting) {
      if (waitingWorker !== registration.waiting) {
        waitingWorker = registration.waiting;
        waitingBuildId = null;
        view.activate = false;
        if (asked?.worker !== waitingWorker) asked = null;
      }
      show(UPDATE_WORDS.waiting, 'update');
      askStatus(waitingWorker, 'waiting');
      return;
    }
    waitingWorker = null;
    if (registration.installing) {
      waitingBuildId = null;
      show(UPDATE_WORDS.verifying, 'checking', { activate: false });
      return;
    }
    askStatus(registration.active ?? container?.controller, 'active');
  };

  const onStatus = (status: StatusMessage, source: unknown): void => {
    if (status.phase === 'waiting') {
      const waiting = registration?.waiting ?? null;
      if (waiting === null || source !== waiting) return;
      waitingWorker = waiting;
      waitingBuildId = status.workerBuildId;
      if (asked?.worker !== waiting) show(UPDATE_WORDS.updateReady, 'update', { activate: true, busy: false });
      return;
    }
    const active = registration?.active ?? null;
    const expected = asked !== null && source === asked.worker && status.workerBuildId === asked.buildId && status.activeBuildId === asked.buildId;
    if ((active === null || source !== active) && !expected) return;
    if (asked !== null && !expected) return;
    pageBuildId ??= status.activeBuildId;
    waitingBuildId = null;
    waitingWorker = null;
    rollbackWorker = null;
    Object.assign(view, { activate: false, rollback: status.priorBuildId !== null, busy: false });
    if (expected) {
      asked = null;
      offerReload(UPDATE_WORDS.activated);
    } else if (reloadWords === null && status.priorBuildId !== null && source !== container?.controller) {
      // Another window activated the build that followed this page's. This page keeps its own until it reloads.
      offerReload(UPDATE_WORDS.activeElsewhere);
    } else if (reloadWords !== null) {
      show(reloadWords, 'reload');
    } else {
      show(UPDATE_WORDS.ready, 'ready', { reload: false });
    }
  };

  const onMessage = (event: Event): void => {
    const { data, source } = event as MessageEvent<unknown>;
    const status = asStatus(data);
    if (status !== null) { onStatus(status, source); return; }
    const activation = asActivation(data);
    if (activation !== null) {
      if (asked === null || source !== asked.worker || activation.buildId !== asked.buildId) return;
      if (activation.ok) { show(UPDATE_WORDS.activating, 'checking', { activate: false }); return; }
      asked = null;
      show(UPDATE_WORDS.blocked, 'error', { busy: false, activate: registration?.waiting === waitingWorker });
      return;
    }
    const rollback = asRollback(data);
    if (rollback === null) return;
    const active = registration?.active ?? container?.controller ?? null;
    const mine = rollbackWorker !== null && source === rollbackWorker;
    if ((active === null || source !== active) && !mine) return;
    if (!rollback.ok && !mine) return;
    rollbackWorker = null;
    if (rollback.ok) offerReload(UPDATE_WORDS.rolledBack, { busy: false, rollback: true });
    else show(rollback.reason === 'client-build-ownership-invalid' ? UPDATE_WORDS.rollbackOwnership : UPDATE_WORDS.rollbackNone, 'error', { busy: false });
  };

  // A change of controller only asks the active worker again: a later build never claims a running page.
  const onControllerChange = (): void => { if (!disposed) askStatus(registration?.active ?? container?.controller, 'active'); };

  const onUpdateFound = (): void => {
    const installing = registration?.installing;
    if (!installing || disposed) return;
    observed?.worker.removeEventListener('statechange', observed.listener);
    const listener = (): void => {
      if (installing.state === 'installed') inspect();
      if (installing.state === 'redundant') {
        if (asked?.worker === installing) asked = null;
        show(UPDATE_WORDS.rejected, 'error', { busy: false });
      }
    };
    observed = { worker: installing, listener };
    installing.addEventListener('statechange', listener);
    show(UPDATE_WORDS.verifying, 'checking', { busy: true });
  };

  container?.addEventListener('message', onMessage);
  container?.addEventListener('controllerchange', onControllerChange);

  const ready = (async (): Promise<void> => {
    if (!container) {
      show(UPDATE_WORDS.unsupported, 'error', { check: false });
      return;
    }
    try {
      registration = await container.register(options.workerUrl, { scope: options.scope, type: 'classic', updateViaCache: 'none' });
      registration.addEventListener('updatefound', onUpdateFound);
      if (!registration.waiting && !registration.installing) show(UPDATE_WORDS.installed, 'checking');
      inspect();
    } catch {
      show(UPDATE_WORDS.setupFailed, 'error');
    }
  })();

  return {
    view: () => ({ ...view }),
    buildId: () => pageBuildId,
    onChange(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    ready,
    async check() {
      if (!registration || disposed) return;
      show(UPDATE_WORDS.checking, 'checking', { busy: true });
      try {
        await registration.update();
        inspect();
        if (!registration.waiting && !registration.installing) {
          if (reloadWords !== null) show(reloadWords, 'reload', { busy: false });
          else show(UPDATE_WORDS.current, 'ready', { busy: false });
        }
      } catch {
        show(UPDATE_WORDS.checkFailed, 'error', { busy: false });
      }
    },
    activate() {
      const worker = registration?.waiting ?? null;
      if (!worker || worker !== waitingWorker || !waitingBuildId) return;
      asked = { worker, buildId: waitingBuildId };
      show(UPDATE_WORDS.asking, 'checking', { busy: true });
      try {
        worker.postMessage({ type: 'CF_PWA_ACTIVATE', schema: SHELL_SCHEMA, buildId: waitingBuildId });
      } catch {
        asked = null;
        show(UPDATE_WORDS.askFailed, 'error', { busy: false, activate: true });
      }
    },
    reload() { if (view.reload) options.reload(); },
    rollback() {
      const worker = registration?.active ?? container?.controller ?? null;
      if (!worker) return;
      rollbackWorker = worker;
      show(UPDATE_WORDS.verifyingPrior, 'checking', { busy: true });
      try {
        worker.postMessage({ type: 'CF_PWA_ROLLBACK', schema: SHELL_SCHEMA });
      } catch {
        rollbackWorker = null;
        show(UPDATE_WORDS.rollbackFailed, 'error', { busy: false });
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      container?.removeEventListener('message', onMessage);
      container?.removeEventListener('controllerchange', onControllerChange);
      registration?.removeEventListener('updatefound', onUpdateFound);
      observed?.worker.removeEventListener('statechange', observed.listener);
      listeners.clear();
    },
  };
}
