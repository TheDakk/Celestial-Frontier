export const CF_PWA_CLIENT_SCHEMA = 'cf-v2-pwa-build/v1' as const;

const BUILD_ID = /^[a-f0-9]{64}$/u;
const STYLE_ID = 'cf-pwa-update-style';

type PwaStatusMessage = Readonly<{
  type: 'CF_PWA_STATUS';
  schema: typeof CF_PWA_CLIENT_SCHEMA;
  workerBuildId: string;
  activeBuildId: string | null;
  priorBuildId: string | null;
  phase: 'active' | 'waiting';
}>;

type PwaActivationMessage = Readonly<{
  type: 'CF_PWA_ACTIVATE_RESULT';
  schema: typeof CF_PWA_CLIENT_SCHEMA;
  ok: boolean;
  buildId: string;
  reason?: 'prior-build-in-use';
}>;

type PwaRollbackMessage = Readonly<{
  type: 'CF_PWA_ROLLBACK_RESULT';
  schema: typeof CF_PWA_CLIENT_SCHEMA;
  ok: boolean;
  activeBuildId?: string;
  priorBuildId?: string;
  reason?: string;
}>;

export interface PwaUpdateControlOptions {
  readonly document: Document;
  readonly navigator: Navigator;
  readonly reload: () => void;
  readonly mount?: HTMLElement;
  readonly enabled?: boolean;
  readonly workerUrl?: string;
  readonly scope?: string;
  readonly placement?: 'floating' | 'settings';
}

export interface PwaUpdateControl {
  readonly element: HTMLElement;
  readonly ready: Promise<void>;
  checkForUpdate(): Promise<void>;
  dispose(): void;
}

function isStatusMessage(value: unknown): value is PwaStatusMessage {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return row.type === 'CF_PWA_STATUS'
    && row.schema === CF_PWA_CLIENT_SCHEMA
    && typeof row.workerBuildId === 'string'
    && BUILD_ID.test(row.workerBuildId)
    && (row.activeBuildId === null || (typeof row.activeBuildId === 'string' && BUILD_ID.test(row.activeBuildId)))
    && (row.priorBuildId === null || (typeof row.priorBuildId === 'string' && BUILD_ID.test(row.priorBuildId)))
    && (row.phase === 'active' || row.phase === 'waiting');
}

function isActivationMessage(value: unknown): value is PwaActivationMessage {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  if (row.type !== 'CF_PWA_ACTIVATE_RESULT' || row.schema !== CF_PWA_CLIENT_SCHEMA
    || typeof row.ok !== 'boolean' || typeof row.buildId !== 'string'
    || !BUILD_ID.test(row.buildId)) return false;
  return row.ok ? row.reason === undefined : row.reason === 'prior-build-in-use';
}

function isRollbackMessage(value: unknown): value is PwaRollbackMessage {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  if (row.type !== 'CF_PWA_ROLLBACK_RESULT' || row.schema !== CF_PWA_CLIENT_SCHEMA || typeof row.ok !== 'boolean') return false;
  if (!row.ok) return typeof row.reason === 'string';
  return typeof row.activeBuildId === 'string' && BUILD_ID.test(row.activeBuildId)
    && typeof row.priorBuildId === 'string' && BUILD_ID.test(row.priorBuildId)
    && row.activeBuildId !== row.priorBuildId;
}

function installStyles(document: Document): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    [data-cf-pwa-update] { position: fixed; z-index: 27;
      left: calc(var(--safe-left, 0px) + 12px);
      bottom: calc(var(--safe-bottom, 0px) + var(--dock-h, 44px) + 18px);
      width: min(320px, calc(100vw - var(--safe-left, 0px) - var(--safe-right, 0px) - 24px));
      box-sizing: border-box; color: var(--ink, #e9edff); pointer-events: auto; }
    [data-cf-pwa-update] details { width: 100%; box-sizing: border-box; }
    [data-cf-pwa-update] summary { width: max-content; min-width: 112px; min-height: 44px;
      box-sizing: border-box; display: grid; place-items: center; cursor: pointer;
      padding: 8px 12px; border: 1px solid #405477; border-radius: 999px;
      background: rgba(10,16,30,.96); color: #dce9fa; font-weight: 700; list-style: none; }
    [data-cf-pwa-update] summary::-webkit-details-marker { display: none; }
    [data-cf-pwa-update] summary:focus-visible,
    [data-cf-pwa-update] button:focus-visible { outline: 3px solid #f3d58b; outline-offset: 2px; }
    [data-cf-pwa-update] [data-pwa-card] { margin-top: 7px; padding: 11px;
      border: 1px solid #405477; border-radius: 12px; background: rgba(10,16,30,.98);
      box-shadow: 0 8px 28px rgba(0,0,0,.48); }
    [data-cf-pwa-update] [data-pwa-message] { margin: 0 0 9px; line-height: 1.45; overflow-wrap: anywhere; }
    [data-cf-pwa-update] [data-pwa-actions] { display: flex; flex-wrap: wrap; gap: 7px; }
    [data-cf-pwa-update] button { min-height: 44px; box-sizing: border-box; padding: 7px 10px;
      border: 1px solid #5575a4; border-radius: 9px; background: #101c30;
      color: #eef6ff; font: 700 12px var(--ui, system-ui); cursor: pointer; }
    [data-cf-pwa-update] button:disabled { opacity: .62; cursor: wait; }
    [data-cf-pwa-update][data-state="error"] [data-pwa-card] { border-color: #b7656d; }
    [data-cf-pwa-update][data-placement="settings"] { position: static; width: 100%; margin-top: 10px; }
    [data-cf-pwa-update][data-placement="settings"] summary { width: 100%; border-radius: 10px; }
    @media (min-width: 901px) { [data-cf-pwa-update] { bottom: 12px; } }
    @media (forced-colors: active) {
      [data-cf-pwa-update] :is(summary,[data-pwa-card],button) {
        background: Canvas; color: CanvasText; border-color: ButtonText; }
    }
  `;
  document.head.append(style);
}

function button(document: Document, label: string, action: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.dataset.pwaAction = action;
  return element;
}

function resolveWorkerLocation(document: Document, workerUrl?: string, scope?: string): Readonly<{ workerUrl: string; scope: string }> {
  if (workerUrl && scope) return Object.freeze({ workerUrl, scope });
  const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!manifest) throw new Error('PWA manifest link is unavailable');
  const manifestUrl = new URL(manifest.href, document.baseURI);
  const inferredScope = new URL('./', manifestUrl).href;
  return Object.freeze({
    workerUrl: workerUrl ?? new URL('service-worker.js', inferredScope).href,
    scope: scope ?? inferredScope,
  });
}

export function mountPwaUpdateControl(options: PwaUpdateControlOptions): PwaUpdateControl {
  const { document, navigator, reload } = options;
  installStyles(document);

  const element = document.createElement('aside');
  element.dataset.cfPwaUpdate = 'v1';
  element.dataset.state = 'starting';
  element.dataset.placement = options.placement ?? 'floating';
  element.setAttribute('aria-label', 'App offline and update status');
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'App status';
  const card = document.createElement('div');
  card.dataset.pwaCard = 'v1';
  const message = document.createElement('p');
  message.dataset.pwaMessage = 'v1';
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  message.setAttribute('aria-atomic', 'true');
  const actions = document.createElement('div');
  actions.dataset.pwaActions = 'v1';
  const check = button(document, 'Check for updates', 'check');
  const activate = button(document, 'Activate update', 'activate');
  const reloadButton = button(document, 'Reload when ready', 'reload');
  const rollback = button(document, 'Roll back', 'rollback');
  activate.hidden = true;
  reloadButton.hidden = true;
  rollback.hidden = true;
  actions.append(check, activate, reloadButton, rollback);
  card.append(message, actions);
  details.append(summary, card);
  element.append(details);
  (options.mount ?? document.body).append(element);

  let disposed = false;
  let registration: ServiceWorkerRegistration | null = null;
  let waitingBuildId: string | null = null;
  let waitingWorker: ServiceWorker | null = null;
  let activationRequested = false;
  let activationWorker: ServiceWorker | null = null;
  let activationBuildId: string | null = null;
  let rollbackWorker: ServiceWorker | null = null;
  let reloadPending = false;
  let reloadCopy: string | null = null;
  let observedInstalling: ServiceWorker | null = null;
  let installingListener: (() => void) | null = null;

  const show = (copy: string, state: 'ready' | 'checking' | 'update' | 'reload' | 'error', open = false): void => {
    if (disposed) return;
    message.textContent = copy;
    element.dataset.state = state;
    message.setAttribute('role', state === 'error' ? 'alert' : 'status');
    if (open) details.open = true;
  };

  const setBusy = (busy: boolean): void => {
    check.disabled = busy;
    activate.disabled = busy;
    reloadButton.disabled = busy;
    rollback.disabled = busy;
  };

  const requestStatus = (worker: ServiceWorker | null, target: 'active' | 'waiting'): void => {
    worker?.postMessage({ type: 'CF_PWA_GET_STATUS', schema: CF_PWA_CLIENT_SCHEMA, target });
  };

  const inspectRegistration = (): void => {
    if (!registration || disposed) return;
    if (registration.waiting) {
      if (waitingWorker !== registration.waiting) {
        waitingWorker = registration.waiting;
        waitingBuildId = null;
        activate.hidden = true;
        if (activationWorker !== waitingWorker) {
          activationRequested = false;
          activationWorker = null;
          activationBuildId = null;
        }
      }
      show('A complete update is waiting. It will not replace this session until you activate it.', 'update', true);
      requestStatus(waitingWorker, 'waiting');
      return;
    }
    if (registration.installing) {
      waitingWorker = null;
      waitingBuildId = null;
      activate.hidden = true;
      show('Verifying a complete exact update…', 'checking', true);
      return;
    }
    waitingWorker = null;
    requestStatus(registration.active ?? navigator.serviceWorker.controller, 'active');
  };

  const onMessage = (event: MessageEvent<unknown>): void => {
    if (isStatusMessage(event.data)) {
      const status = event.data;
      if (status.phase === 'waiting') {
        const exactWaiting = registration?.waiting ?? null;
        if (exactWaiting === null || event.source !== exactWaiting) return;
        waitingWorker = exactWaiting;
        waitingBuildId = status.workerBuildId;
        if (activationRequested && activationWorker === exactWaiting) return;
        activate.hidden = false;
        show('A complete update is ready. Activate it when you choose; this page will not reload automatically.', 'update', true);
      } else {
        const exactActive = registration?.active ?? null;
        const expectedActivation = activationWorker !== null
          && activationBuildId !== null
          && event.source === activationWorker
          && status.workerBuildId === activationBuildId
          && status.activeBuildId === activationBuildId;
        if ((exactActive === null || event.source !== exactActive) && !expectedActivation) return;
        if (activationRequested && !expectedActivation) return;
        waitingBuildId = null;
        waitingWorker = null;
        activate.hidden = true;
        rollback.hidden = status.priorBuildId === null;
        rollbackWorker = null;
        if (expectedActivation) {
          reloadPending = true;
          reloadCopy = 'The update is activated. Reload when you are ready to enter the new build.';
          reloadButton.hidden = false;
          show(reloadCopy, 'reload', true);
        } else if (!reloadPending
          && status.priorBuildId !== null
          && event.source !== navigator.serviceWorker.controller) {
          /* Another window may activate the verified successor. This document
             remains pinned to its original complete build until its explorer
             explicitly reloads, so the active worker's status is the reload
             invitation; controllerchange is neither required nor authority. */
          reloadPending = true;
          reloadCopy = 'A verified update is active. Reload when you are ready to enter it.';
          reloadButton.hidden = false;
          show(reloadCopy, 'reload', true);
        } else if (reloadPending && reloadCopy !== null) {
          show(reloadCopy, 'reload', true);
        } else if (!reloadPending && !activationRequested) {
          reloadButton.hidden = true;
          show('Offline mode is ready. This exact build is available without a connection.', 'ready');
        }
        if (expectedActivation) {
          activationRequested = false;
          activationWorker = null;
          activationBuildId = null;
        }
      }
      setBusy(false);
      return;
    }
    if (isActivationMessage(event.data)) {
      if (!activationRequested || activationWorker === null || activationBuildId === null
        || event.source !== activationWorker || event.data.buildId !== activationBuildId) return;
      if (!event.data.ok) {
        activationRequested = false;
        activationWorker = null;
        activationBuildId = null;
        setBusy(false);
        activate.hidden = registration?.waiting !== waitingWorker;
        show(
          'This update cannot activate while another open Celestial Frontier window still uses the retained rollback build. Reload or close that window, then try again.',
          'error',
          true,
        );
        return;
      }
      activate.hidden = true;
      show('The verified update is activating…', 'checking', true);
      return;
    }
    if (isRollbackMessage(event.data)) {
      const exactActive = registration?.active ?? navigator.serviceWorker.controller ?? null;
      if ((exactActive === null || event.source !== exactActive)
        && (rollbackWorker === null || event.source !== rollbackWorker)) return;
      if (!event.data.ok && (rollbackWorker === null || event.source !== rollbackWorker)) return;
      setBusy(false);
      rollbackWorker = null;
      if (!event.data.ok) {
        show(
          event.data.reason === 'client-build-ownership-invalid'
            ? 'Rollback cannot change builds while an open Celestial Frontier window has invalid build ownership. Reload or close that window, then try again.'
            : 'Rollback is unavailable because no complete prior build is retained.',
          'error',
          true,
        );
        return;
      }
      reloadPending = true;
      reloadCopy = 'The prior complete build is selected. Reload when you are ready to use it.';
      rollback.hidden = false;
      reloadButton.hidden = false;
      show(reloadCopy, 'reload', true);
    }
  };

  const onControllerChange = (): void => {
    if (disposed) return;
    /* A controller transition can ask the exact active worker for status, but
       it never proves activation and never reveals Reload by itself. Successor
       workers intentionally do not claim an already-running older document. */
    requestStatus(registration?.active ?? navigator.serviceWorker.controller, 'active');
  };

  const onUpdateFound = (): void => {
    if (!registration || disposed) return;
    const installing = registration.installing;
    if (!installing) return;
    if (installingListener && observedInstalling) {
      observedInstalling.removeEventListener('statechange', installingListener);
    }
    observedInstalling = installing;
    setBusy(true);
    show('Verifying a complete exact update…', 'checking', true);
    installingListener = (): void => {
      if (installing.state === 'installed') inspectRegistration();
      if (installing.state === 'redundant') {
        if (activationWorker === installing) {
          activationRequested = false;
          activationWorker = null;
          activationBuildId = null;
        }
        setBusy(false);
        show('The update was rejected because its complete exact asset set could not be verified.', 'error', true);
      }
    };
    installing.addEventListener('statechange', installingListener);
  };

  const checkForUpdate = async (): Promise<void> => {
    if (!registration || disposed) return;
    setBusy(true);
    show('Checking for a complete update…', 'checking', true);
    try {
      await registration.update();
      inspectRegistration();
      if (!registration.waiting && !registration.installing) {
        setBusy(false);
        if (reloadPending && reloadCopy !== null) show(reloadCopy, 'reload', true);
        else show('This exact build is current and available offline.', 'ready');
      }
    } catch {
      setBusy(false);
      show('Update check could not reach a complete build. Your current offline build is unchanged.', 'error', true);
    }
  };

  check.addEventListener('click', () => { void checkForUpdate(); });
  activate.addEventListener('click', () => {
    const worker = registration?.waiting ?? null;
    if (!worker || worker !== waitingWorker || !waitingBuildId) return;
    activationRequested = true;
    activationWorker = worker;
    activationBuildId = waitingBuildId;
    setBusy(true);
    show('Activating the verified update…', 'checking', true);
    try {
      worker.postMessage({
        type: 'CF_PWA_ACTIVATE',
        schema: CF_PWA_CLIENT_SCHEMA,
        buildId: activationBuildId,
      });
    } catch {
      activationRequested = false;
      activationWorker = null;
      activationBuildId = null;
      setBusy(false);
      activate.hidden = false;
      show('The verified update could not be asked to activate. Your current offline build is unchanged.', 'error', true);
    }
  });
  reloadButton.addEventListener('click', reload);
  rollback.addEventListener('click', () => {
    const worker = registration?.active ?? navigator.serviceWorker.controller ?? null;
    if (!worker) return;
    rollbackWorker = worker;
    setBusy(true);
    show('Verifying the retained prior build…', 'checking', true);
    try {
      worker.postMessage({ type: 'CF_PWA_ROLLBACK', schema: CF_PWA_CLIENT_SCHEMA });
    } catch {
      rollbackWorker = null;
      setBusy(false);
      show('Rollback could not be requested. The current offline build is unchanged.', 'error', true);
    }
  });

  navigator.serviceWorker?.addEventListener('message', onMessage as EventListener);
  navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);

  const enabled = options.enabled ?? document.querySelector('meta[name="cf-pwa-enabled"][content="true"]') !== null;
  const ready = (async(): Promise<void> => {
    if (!enabled) {
      element.remove();
      return;
    }
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
      check.hidden = true;
      show('This browser does not support installed offline updates.', 'error', true);
      return;
    }
    try {
      const location = resolveWorkerLocation(document, options.workerUrl, options.scope);
      registration = await navigator.serviceWorker.register(location.workerUrl, {
        scope: location.scope,
        type: 'classic',
        updateViaCache: 'none',
      });
      registration.addEventListener('updatefound', onUpdateFound);
      inspectRegistration();
      if (!registration.waiting && !registration.installing) {
        show('Checking the installed offline build…', 'checking');
      }
    } catch {
      show('Offline setup could not verify a complete local build. Online play is unchanged.', 'error', true);
    }
  })();

  return Object.freeze({
    element,
    ready,
    checkForUpdate,
    dispose(): void {
      if (disposed) return;
      disposed = true;
      navigator.serviceWorker?.removeEventListener('message', onMessage as EventListener);
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
      registration?.removeEventListener('updatefound', onUpdateFound);
      if (installingListener && observedInstalling) {
        observedInstalling.removeEventListener('statechange', installingListener);
      }
      element.remove();
    },
  });
}

export const __pwaUpdateTestOnly = Object.freeze({
  isActivationMessage,
  isRollbackMessage,
  isStatusMessage,
  resolveWorkerLocation,
});
