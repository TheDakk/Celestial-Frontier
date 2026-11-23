// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { SHELL_SCHEMA } from '../offline/worker-source';
import { UPDATE_WORDS, createReloadCoordinator, createUpdateControl, reloadRefusalWords, type UpdateControl } from '../src/offline';
import { REGISTRY, bootSave } from '../src/save/index';
import { UPDATE_CATALOG } from '../src/screens';
import { pseudoLocalize } from '../src/ui';
import { createMemoryBackend } from '@cf/persistence';
import { NOW, SOL_ROUTE, seedCurrentSave } from './save-support';
import { bootPage, pretendLayout, settled } from './shell-support';
import { recordCanvasPainting } from './support/fake-canvas';

recordCanvasPainting();
pretendLayout();

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);

class FakeWorker extends EventTarget {
  state = 'installed';
  posted: Array<Record<string, unknown>> = [];
  refuses = false;
  postMessage(message: Record<string, unknown>): void {
    if (this.refuses) throw new Error('the worker is gone');
    this.posted.push(message);
  }
}
class FakeRegistration extends EventTarget {
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
  active: FakeWorker | null = null;
  onUpdate: () => void = () => undefined;
  async update(): Promise<void> { this.onUpdate(); }
}
class FakeContainer extends EventTarget {
  controller: FakeWorker | null = null;
  registration = new FakeRegistration();
  registered: Array<[string, RegistrationOptions]> = [];
  async register(url: string, options: RegistrationOptions): Promise<FakeRegistration> {
    this.registered.push([url, options]);
    return this.registration;
  }
  /** A message from `source`, as the page receives it. */
  say(source: FakeWorker, data: Record<string, unknown>): void {
    this.dispatchEvent(Object.assign(new Event('message'), { data: { schema: SHELL_SCHEMA, ...data }, source }));
  }
}
const status = (workerBuildId: string, phase: 'active' | 'waiting', activeBuildId: string | null, priorBuildId: string | null) =>
  ({ type: 'CF_PWA_STATUS', workerBuildId, phase, activeBuildId, priorBuildId });

/** A page running build A, with the control started on it. */
async function running(prior: string | null = null) {
  const container = new FakeContainer();
  const a = new FakeWorker();
  container.registration.active = a;
  container.controller = a;
  const reloads: number[] = [];
  const control = createUpdateControl({ container: container as unknown as ServiceWorkerContainer, workerUrl: 'https://game.test/cf/service-worker.js', scope: 'https://game.test/cf/', reload: () => { reloads.push(1); } });
  await control.ready;
  container.say(a, status(A, 'active', A, prior));
  return { container, a, control, reloads };
}
/** Build B found, checked and waiting beside it. */
async function withWaiting() {
  const base = await running();
  const b = new FakeWorker();
  base.container.registration.installing = b;
  base.container.registration.dispatchEvent(new Event('updatefound'));
  const verifying = base.control.view();
  base.container.registration.installing = null;
  base.container.registration.waiting = b;
  b.dispatchEvent(new Event('statechange'));
  return { ...base, b, verifying };
}
const activated = (container: FakeContainer, b: FakeWorker): void => {
  container.say(b, { type: 'CF_PWA_ACTIVATE_RESULT', ok: true, buildId: B });
  container.registration.waiting = null;
  container.registration.active = b;
  container.say(b, status(B, 'active', B, A));
};

describe('the offline and update control', () => {
  it('registers the worker for the app\'s own scope and says when the build is held offline', async () => {
    const { container, a, control, reloads } = await running();
    expect(container.registered).toEqual([['https://game.test/cf/service-worker.js', { scope: 'https://game.test/cf/', type: 'classic', updateViaCache: 'none' }]]);
    expect(a.posted).toEqual([{ type: 'CF_PWA_GET_STATUS', schema: SHELL_SCHEMA, target: 'active' }]);
    expect(control.view()).toEqual({ state: 'ready', message: UPDATE_WORDS.ready, busy: false, check: true, activate: false, reload: false, rollback: false });
    expect(reloads).toEqual([]);
  });

  it('a new build waits for the player: found, checked, offered, activated, and only then a reload is offered', async () => {
    const { container, b, control, reloads, verifying } = await withWaiting();
    expect(verifying).toMatchObject({ state: 'checking', message: UPDATE_WORDS.verifying, busy: true });
    expect(control.view()).toMatchObject({ state: 'update', message: UPDATE_WORDS.waiting, activate: false });
    // Nothing can be activated before the waiting worker itself has named its build.
    control.activate();
    expect(b.posted).toEqual([{ type: 'CF_PWA_GET_STATUS', schema: SHELL_SCHEMA, target: 'waiting' }]);
    container.say(b, status(B, 'waiting', A, null));
    expect(control.view()).toMatchObject({ state: 'update', message: UPDATE_WORDS.updateReady, busy: false, activate: true, reload: false });

    control.activate();
    expect(b.posted.at(-1)).toEqual({ type: 'CF_PWA_ACTIVATE', schema: SHELL_SCHEMA, buildId: B });
    expect(control.view()).toMatchObject({ state: 'checking', message: UPDATE_WORDS.asking, busy: true });
    // A change of controller proves nothing.
    container.dispatchEvent(new Event('controllerchange'));
    expect(control.view().reload).toBe(false);
    activated(container, b);
    expect(control.view()).toEqual({ state: 'reload', message: UPDATE_WORDS.activated, busy: false, check: true, activate: false, reload: true, rollback: true });
    // The page is never reloaded for the player.
    expect(reloads).toEqual([]);
    control.reload();
    expect(reloads).toEqual([1]);
  });

  it('listens only to the worker it asked', async () => {
    const { container, a, b, control } = await withWaiting();
    const stranger = new FakeWorker();
    container.say(stranger, status(B, 'waiting', A, null));
    container.say(a, status(B, 'waiting', A, null));
    expect(control.view().activate).toBe(false);
    container.say(b, status(B, 'waiting', A, null));
    control.activate();
    container.say(stranger, { type: 'CF_PWA_ACTIVATE_RESULT', ok: true, buildId: B });
    container.say(stranger, status(B, 'active', B, A));
    container.say(b, { ...status(B, 'active', B, A), schema: 'another/v1' });
    expect(control.view()).toMatchObject({ state: 'checking', message: UPDATE_WORDS.asking, reload: false });
  });

  it('an activation another window blocks is said, and can be tried again', async () => {
    const { container, b, control } = await withWaiting();
    container.say(b, status(B, 'waiting', A, null));
    control.activate();
    container.say(b, { type: 'CF_PWA_ACTIVATE_RESULT', ok: false, buildId: B, reason: 'prior-build-in-use' });
    expect(control.view()).toMatchObject({ state: 'error', message: UPDATE_WORDS.blocked, busy: false, activate: true, reload: false });
    b.refuses = true;
    control.activate();
    expect(control.view()).toMatchObject({ state: 'error', message: UPDATE_WORDS.askFailed, activate: true });
  });

  it('a build that fails its check is said to be rejected; the running one is unchanged', async () => {
    const { container, control } = await running();
    const b = new FakeWorker();
    container.registration.installing = b;
    container.registration.dispatchEvent(new Event('updatefound'));
    container.registration.installing = null;
    b.state = 'redundant';
    b.dispatchEvent(new Event('statechange'));
    expect(control.view()).toMatchObject({ state: 'error', message: UPDATE_WORDS.rejected, busy: false, activate: false, reload: false });
  });

  it('rolls back only on the word of the active worker, and then offers the reload', async () => {
    const { container, a, control, reloads } = await running(B);
    expect(control.view()).toMatchObject({ state: 'ready', rollback: true });
    control.rollback();
    expect(a.posted.at(-1)).toEqual({ type: 'CF_PWA_ROLLBACK', schema: SHELL_SCHEMA });
    expect(control.view()).toMatchObject({ state: 'checking', message: UPDATE_WORDS.verifyingPrior, busy: true });
    container.say(a, { type: 'CF_PWA_ROLLBACK_RESULT', ok: true, activeBuildId: B, priorBuildId: A });
    expect(control.view()).toMatchObject({ state: 'reload', message: UPDATE_WORDS.rolledBack, busy: false, reload: true, rollback: true });
    expect(reloads).toEqual([]);

    control.rollback();
    container.say(a, { type: 'CF_PWA_ROLLBACK_RESULT', ok: false, reason: 'no-complete-prior-build' });
    expect(control.view()).toMatchObject({ state: 'error', message: UPDATE_WORDS.rollbackNone });
    control.rollback();
    container.say(a, { type: 'CF_PWA_ROLLBACK_RESULT', ok: false, reason: 'client-build-ownership-invalid' });
    expect(control.view()).toMatchObject({ state: 'error', message: UPDATE_WORDS.rollbackOwnership });
    a.refuses = true;
    control.rollback();
    expect(control.view()).toMatchObject({ state: 'error', message: UPDATE_WORDS.rollbackFailed, busy: false });
  });

  it('a check says what it found: nothing new, no answer, or the reload already offered', async () => {
    const { container, control } = await running();
    await control.check();
    expect(control.view()).toMatchObject({ state: 'ready', message: UPDATE_WORDS.current, busy: false });
    container.registration.onUpdate = () => { throw new Error('offline'); };
    await control.check();
    expect(control.view()).toMatchObject({ state: 'error', message: UPDATE_WORDS.checkFailed, busy: false });
  });

  it('a build another window activated is offered as a reload, never taken', async () => {
    const { container, control, reloads } = await running();
    const b = new FakeWorker();
    container.registration.active = b;
    container.say(b, status(B, 'active', B, A));
    expect(control.view()).toMatchObject({ state: 'reload', message: UPDATE_WORDS.activeElsewhere, reload: true });
    container.registration.onUpdate = () => undefined;
    await control.check();
    expect(control.view()).toMatchObject({ state: 'reload', message: UPDATE_WORDS.activeElsewhere });
    expect(reloads).toEqual([]);
  });

  it('names the build the page runs once its worker has said it, and keeps that name while a later build is activated', async () => {
    const container = new FakeContainer();
    const a = new FakeWorker();
    container.registration.active = a;
    container.controller = a;
    const control = createUpdateControl({ container: container as unknown as ServiceWorkerContainer, workerUrl: 'w', scope: 's', reload() {} });
    await control.ready;
    expect(control.buildId()).toBeNull();
    // A worker the page did not ask names nothing.
    container.say(new FakeWorker(), status(B, 'active', B, null));
    expect(control.buildId()).toBeNull();
    let heard = 0;
    control.onChange(() => { heard += 1; });
    container.say(a, status(A, 'active', A, null));
    expect([control.buildId(), heard]).toEqual([A, 1]);
    // Build B is found, activated and offered as a reload: this page still runs A until it reloads.
    const b = new FakeWorker();
    container.registration.waiting = b;
    container.say(b, status(B, 'waiting', A, null));
    control.activate();
    activated(container, b);
    expect(control.view().state).toBe('reload');
    expect(control.buildId()).toBe(A);
    // Where there is no offline shell there is no name.
    const none = createUpdateControl({ container: undefined, workerUrl: 'w', scope: 's', reload() {} });
    await none.ready;
    expect(none.buildId()).toBeNull();
  });

  it('says so where the browser has no offline support, or the worker cannot be registered', async () => {
    const none = createUpdateControl({ container: undefined, workerUrl: 'w', scope: 's', reload() {} });
    await none.ready;
    expect(none.view()).toMatchObject({ state: 'error', message: UPDATE_WORDS.unsupported, check: false });
    const container = new FakeContainer();
    container.register = () => Promise.reject(new Error('insecure'));
    const failed = createUpdateControl({ container: container as unknown as ServiceWorkerContainer, workerUrl: 'w', scope: 's', reload() {} });
    await failed.ready;
    expect(failed.view()).toMatchObject({ state: 'error', message: UPDATE_WORDS.setupFailed });
  });

  it('tells each listener of each change until it stops listening, and nothing after it is disposed', async () => {
    const { container, a, control } = await running();
    let heard = 0;
    const stop = control.onChange(() => { heard += 1; });
    container.say(a, status(A, 'active', A, null));
    expect(heard).toBe(1);
    stop();
    container.say(a, status(A, 'active', A, null));
    expect(heard).toBe(1);
    control.onChange(() => { heard += 1; });
    control.dispose();
    container.say(a, status(A, 'active', A, B));
    expect(heard).toBe(1);
    expect(control.view().rollback).toBe(false);
  });
});

describe('a reload into another build', () => {
  it('stores the save first, reloads once, and reloads nothing when the save is not stored', async () => {
    const steps: string[] = [];
    let stores: Array<(stored: boolean) => void> = [];
    let conflict: 'replacement' | 'save-authority' | null = null;
    const reload = createReloadCoordinator({
      conflict: () => conflict,
      store: () => { steps.push('store'); return new Promise((resolve) => { stores.push(resolve); }); },
      schedule: () => { steps.push('reload'); },
    });
    const first = reload();
    // A second press while the first is storing reloads nothing.
    expect(await reload()).toEqual({ kind: 'refused', stage: 'claim', detail: 'reload-owned' });
    expect(steps).toEqual(['store']);
    stores[0]!(true);
    expect(await first).toEqual({ kind: 'scheduled' });
    expect(steps).toEqual(['store', 'reload']);

    const failing = createReloadCoordinator({ conflict: () => conflict, store: () => Promise.reject(new Error('quota')), schedule: () => { steps.push('reload'); } });
    expect(await failing()).toEqual({ kind: 'refused', stage: 'save', detail: 'save-not-durable' });
    stores = [];
    const unstored = createReloadCoordinator({ conflict: () => conflict, store: () => Promise.resolve(steps.push('store') < 0), schedule: () => { steps.push('reload'); } });
    expect(await unstored()).toEqual({ kind: 'refused', stage: 'save', detail: 'save-not-durable' });
    // A refusal is not the end: the next press tries again.
    expect(await unstored()).toMatchObject({ stage: 'save' });
    conflict = 'save-authority';
    expect(await unstored()).toEqual({ kind: 'refused', stage: 'preflight', detail: 'save-authority' });
    expect(steps).toEqual(['store', 'reload', 'store', 'store']);
  });

  it('says why a reload was refused', () => {
    expect(reloadRefusalWords({ kind: 'refused', stage: 'preflight', detail: 'replacement' }).text).toBe('Finish bringing the expedition before changing builds.');
    expect(reloadRefusalWords({ kind: 'refused', stage: 'preflight', detail: 'save-authority' }).title).toBe('Reload held safely');
    expect(reloadRefusalWords({ kind: 'refused', stage: 'claim', detail: 'reload-owned' }).title).toBe('Reload already underway');
    expect(reloadRefusalWords({ kind: 'refused', stage: 'save', detail: 'save-not-durable' })).toMatchObject({ title: 'Save not yet durable', force: true });
  });
});

describe('the update control in Settings', () => {
  /** The app with a build waiting, wired as the game's page wires it. */
  async function pageWithUpdate(options: Parameters<typeof bootPage>[0] = {}) {
    const container = new FakeContainer();
    const a = new FakeWorker();
    const b = new FakeWorker();
    container.registration.active = a;
    container.controller = a;
    container.registration.waiting = b;
    let control!: UpdateControl;
    const page = await bootPage({
      ...options,
      update: (reload) => (control = createUpdateControl({ container: container as unknown as ServiceWorkerContainer, workerUrl: 'w', scope: 's', reload })),
    });
    await control.ready;
    container.say(b, status(B, 'waiting', A, null));
    page.openSettings();
    const words = (): string => page.panel().querySelector('[data-set="update-message"]')!.textContent!;
    const offered = (): string[] => [...page.panel().querySelectorAll<HTMLElement>('.update-actions button')].map((button) => button.dataset['set']!);
    return { page, container, b, words, offered };
  }

  it('Status names the build with the first eight characters of its identity, from the moment the worker says it', async () => {
    const container = new FakeContainer();
    const a = new FakeWorker();
    container.registration.active = a;
    container.controller = a;
    let control!: UpdateControl;
    const page = await bootPage({ update: (reload) => (control = createUpdateControl({ container: container as unknown as ServiceWorkerContainer, workerUrl: 'w', scope: 's', reload })) });
    await control.ready;
    page.openSettings();
    const build = (): string => [...page.panel().querySelectorAll('[data-set="status"] .row')].find((row) => row.querySelector('.row-label')!.textContent === 'Build')!.querySelector('.row-value')!.textContent!;
    expect(build()).toBe('test-build');
    container.say(a, status('0123456789abcdef'.repeat(4), 'active', '0123456789abcdef'.repeat(4), null));
    expect(build()).toBe('test-build · 01234567');
    // Closed and opened again, it is still there; a page with no offline shell shows the version alone.
    page.control('sound').click();
    expect(build()).toBe('test-build · 01234567');
    const plain = await bootPage();
    plain.openSettings();
    expect(plain.panel().querySelector('[data-set="status"]')!.textContent).toContain('Buildtest-buildSave');
  });

  it('the update control shows a new build is ready, and reloads once after a durable save', async () => {
    const { page, container, b, words, offered } = await pageWithUpdate();
    expect(words()).toBe(UPDATE_WORDS.updateReady);
    expect(offered()).toEqual(['update-check', 'update-activate']);

    page.control('update-activate').click();
    expect(b.posted.at(-1)).toEqual({ type: 'CF_PWA_ACTIVATE', schema: SHELL_SCHEMA, buildId: B });
    expect(page.control('update-check').disabled).toBe(true);
    activated(container, b);
    expect(words()).toBe(UPDATE_WORDS.activated);
    expect(offered()).toEqual(['update-check', 'update-reload', 'update-rollback']);
    await settled();
    expect(page.reloads).toBe(0);

    // What the player changed last is stored before the page leaves, and the save is given up for the next page.
    const before = page.runtime.revision;
    page.live.tipsOn = !page.live.tipsOn;
    page.control('update-reload').click();
    page.control('update-reload').click();
    expect(page.reloads).toBe(0);
    await settled();
    expect(page.reloads).toBe(1);
    expect(page.runtime.revision).toBeGreaterThan(before);
    const stored = await bootSave({ backend: page.backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE });
    expect(stored.state.tipsOn).toBe(page.live.tipsOn);
    expect(page.runtime.diagnostics().leaseOwned).toBe(false);
  });

  it('under a held save the reload is refused in words, and nothing reloads', async () => {
    const held = createMemoryBackend();
    await seedCurrentSave(held);
    await held.apply([{ store: 'player', key: 'v5:player', value: '{broken' }]);
    const { page, container, b } = await pageWithUpdate({ backend: held });
    page.control('update-activate').click();
    activated(container, b);
    page.control('update-reload').click();
    await settled();
    expect(page.reloads).toBe(0);
    expect(document.querySelector('.toast')!.textContent).toContain('Reload held safely');
  });

  it('the control speaks the page\'s locale, and every word it can say is in its catalogue', async () => {
    const { page, words } = await pageWithUpdate({ search: '?locale=qps-ploc' });
    expect(words()).toBe(pseudoLocalize(UPDATE_WORDS.updateReady));
    expect([...page.panel().querySelectorAll('.update h3, .update button')].map((node) => node.textContent))
      .toEqual([UPDATE_WORDS.heading, UPDATE_WORDS.check, UPDATE_WORDS.activate].map(pseudoLocalize));
    expect(page.panel().querySelector('.update-actions')!.getAttribute('aria-label')).toBe(pseudoLocalize(UPDATE_WORDS.label));
    expect([...UPDATE_CATALOG.strings].sort()).toEqual(Object.values(UPDATE_WORDS).sort());
  });

  it('a page with no offline shell has no such control', async () => {
    const page = await bootPage();
    page.openSettings();
    expect(page.panel().querySelector('[data-set="update"]')).toBeNull();
  });
});
