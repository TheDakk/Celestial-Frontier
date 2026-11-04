/* A5 gap #15 (INVENTORY.md row #129): the PWA update pill's "Reload when
 * ready" with a write in flight — a reload must never lose a pending save.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. There was no
 * outcome test at all; a reload that drops an in-flight commit is silent data
 * loss. Here the exact shipped main.ts sections are sliced, type-stripped and
 * executed with an injected env:
 *   - boot's update-pill mount (the real mountPwaUpdateControl, whose Reload
 *     button calls reloadForPwaUpdate),
 *   - the replacement-transaction claim/release,
 *   - persistSoon, pwaReloadConflict and reloadForPwaUpdate (over the real
 *     coordinatePwaReload),
 *   - persistView with the checkpoint-owner symbols and the ecology block.
 * A fake service-worker container (the pwa-offline test's shape) reveals the
 * real Reload button through the "another window activated a verified build"
 * status. The test changes a setting (a debounced save pending), presses
 * Reload, and reads the COMMITTED v5 save from a real memory backend AT THE
 * MOMENT the reload is scheduled; a failed in-flight write must refuse the
 * reload and re-arm the pending save, which then becomes durable.
 *
 * Stubbed externals: the reload itself (scheduleReplacementReload records the
 * durable save at that instant), the heartbeat start/stop, the renderer
 * ticker, audio (null), toast, and the timer queue (window.setTimeout /
 * clearTimeout are a manual queue so the 400 ms debounce is observable). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import { NAV_HOME, navToView } from '@cf/scene';
import { projectCheckpointState } from '../apps/game/src/checkpoint-state.js';
import { createEcologyEpochEdgeAuthority } from '../apps/game/src/ecology-epoch-edge.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { coordinatePwaReload } from '../apps/game/src/pwa-reload.js';
import { CF_PWA_CLIENT_SCHEMA, mountPwaUpdateControl } from '../apps/game/src/pwa-update.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;

interface TestWindow extends Window { close(): void }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom };

function exactMainSection(start: string, end: string, inclusive = false): string {
  const startCount = MAIN_SOURCE.split(start).length - 1;
  const endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`Main PWA section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main PWA section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, inclusive ? right + end.length : right);
}

const BOOT_ECOLOGY_AUTHORITY = `  ecologyObservedActivePlayMs = f4Runtime?.diagnostics().activePlayMs ?? 0;
  ecologyEpochAuthority = createEcologyEpochEdgeAuthority({
    restoredEpoch: save.EPOCH_BASE,
    activePlayAtBootMs: ecologyObservedActivePlayMs,
  });
`;

const MAIN_PWA_SOURCE = [
  exactMainSection(
    'const F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER = Symbol(',
    "const F4_LIFECYCLE_CHECKPOINT_OWNER = Symbol('f4-lifecycle-checkpoint-owner');\n",
    true,
  ),
  exactMainSection('let ecologyEpochAuthority: EcologyEpochEdgeAuthority = createEcologyEpochEdgeAuthority({', '\nconst TOUCH_DPR'),
  exactMainSection('let replacementTransaction: ReplacementTransaction | null = null;', '\nfunction scheduleReplacementReload('),
  exactMainSection('async function persistView(', '\nlet _persistT = 0;'),
  exactMainSection('function persistSoon(): void {', '\nlet persistHold'),
].join('\n');
const PILL_MOUNT = exactMainSection('    pwaUpdateControl = mountPwaUpdateControl({', '    void pwaUpdateControl.ready;\n', true);

const HARNESS = `
function __harnessBoot() {
${BOOT_ECOLOGY_AUTHORITY}${PILL_MOUNT}}`;

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main PWA source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

function executableMainPwa(env: Record<string, unknown>, mutations: readonly MainMutation[]): { boot: () => void; persistSoon: () => void } {
  const source = mutations.reduce(replaceExact, MAIN_PWA_SOURCE + HARNESS);
  const transformed = transformSync('main-pwa.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    boot: () => __harnessBoot(),
    persistSoon: () => persistSoon(),
  }; }`)(env) as { boot: () => void; persistSoon: () => void };
}

/* ---------------- the fake service-worker container (pwa-offline.test.ts shape) ---------------- */

type Listener = (event: Event) => void;
class FakeEventOwner {
  readonly listeners = new Map<string, Set<Listener>>();
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const callback = typeof listener === 'function' ? listener : listener.handleEvent.bind(listener);
    const rows = this.listeners.get(type) ?? new Set<Listener>();
    rows.add(callback as Listener);
    this.listeners.set(type, rows);
  }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (typeof listener === 'function') this.listeners.get(type)?.delete(listener as Listener);
  }
  dispatch(type: string, event: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event as Event);
  }
}
class FakeWorker extends FakeEventOwner {
  state: ServiceWorkerState = 'activated';
  readonly messages: unknown[] = [];
  postMessage(message: unknown): void { this.messages.push(message); }
}
class FakeRegistration extends FakeEventOwner {
  active = new FakeWorker();
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
  async update(): Promise<ServiceWorkerRegistration> { return this as unknown as ServiceWorkerRegistration; }
}
class FakeContainer extends FakeEventOwner {
  readonly registration = new FakeRegistration();
  controller: FakeWorker | null = this.registration.active;
  async register(): Promise<ServiceWorkerRegistration> { return this.registration as unknown as ServiceWorkerRegistration; }
}

/* ---------------- durable fixtures ---------------- */

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
}

async function freshFixture(): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(0).state());
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state: imported.state, extensions: f4.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(`PWA fixture was ${migrated.kind}`);
  await backend.apply(initial.operations);
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`PWA boot read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`PWA boot F4 authority was ${authority.kind}`);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: 'a5-pwa-tab', token: 'a5-pwa-document',
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`PWA lease was ${heartbeat.kind}`);
  return { backend, repository, runtime, state: saved.state };
}

async function durableSfx(f: DurableFixture): Promise<number> {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return saved.state.sfxVol;
}

/* ---------------- the Main harness ---------------- */

async function mainPwaHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><head><meta name="cf-pwa-enabled" content="true"><link rel="manifest" href="/manifest.webmanifest"></head><body>
    <section id="setpanel"></section></body></html>`, { url: 'https://game.test/' });
  const document = dom.window.document;
  const container = new FakeContainer();
  const timers = new Map<number, () => void>();
  let nextTimer = 1;
  const reloadsAt: Array<Promise<number>> = [];
  const toast = vi.fn();
  const renderer = { ticker: { started: true }, stop: () => { renderer.ticker.started = false; }, start: () => { renderer.ticker.started = true; } };
  const env: Record<string, unknown> & { save: SaveStateV2; activePersist: Promise<boolean> | null; _persistT: number } = {
    document,
    navigator: { serviceWorker: container },
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    window: Object.freeze({
      setTimeout: (fn: () => void) => { const id = nextTimer++; timers.set(id, fn); return id; },
    }),
    clearTimeout: (id: number) => { timers.delete(id); },
    __CF_EVIDENCE_BUILD__: false,
    smokeRejectNextPersist: false,
    save: f.state,
    nav: NAV_HOME,
    navToView,
    savedRouteWriteHeld: false,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => {
      if (runtime === null) return false;
      const diagnostics = runtime.diagnostics();
      return diagnostics.leaseOwned && !diagnostics.staleBlocked;
    },
    f4RuntimeMayAnswer: (runtime: F4RuntimeAuthority | null = f.runtime) => runtime !== null,
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    settleF4Heartbeat: async () => undefined,
    stopF4Heartbeat: vi.fn(),
    startF4Heartbeat: vi.fn(),
    // write-hold flags (unrelated owners), all idle
    _persistT: 0,
    activePersist: null,
    persistHold: false,
    namedSearchPersistenceHeld: false,
    namedSearchPersistenceDeferred: false,
    importWriteInFlight: false,
    replacementReloadScheduled: false,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    trainingActive: () => false,
    trainingRecoveryLock: null,
    f4AuthorityReloadScheduled: false,
    productActionInFlight: false,
    ecologyEpochBlocksActions: () => false,
    // the real owners main.ts imports
    mountPwaUpdateControl, coordinatePwaReload, createEcologyEpochEdgeAuthority, projectCheckpointState,
    pwaUpdateControl: null,
    // the reload itself: record the durable save at the instant it is scheduled
    scheduleReplacementReload: (claim: unknown) => { void claim; reloadsAt.push(durableSfx(f)); },
    // presentation / ecology hooks (not under test)
    notificationHistory: Object.freeze({ flushPending: () => undefined }),
    tameGreetingAudioOwner: null,
    app: renderer,
    toast,
    scheduleF4AuthorityConvergenceReload: vi.fn(),
    publishCommittedEcologyEpoch: vi.fn(),
    suppressEcologyProjection: vi.fn(),
    refreshCommittedEcologyProjection: vi.fn(),
    f4PageVisible: () => true,
  };
  const exec = executableMainPwa(env, mutations);
  exec.boot();
  await (env.pwaUpdateControl as { ready: Promise<void> }).ready;
  // another window activated a verified build: the pill invites Reload
  const activated = new FakeWorker();
  container.registration.active = activated;
  container.dispatch('message', { source: activated, data: {
    type: 'CF_PWA_STATUS', schema: CF_PWA_CLIENT_SCHEMA, workerBuildId: 'a'.repeat(64),
    activeBuildId: 'a'.repeat(64), priorBuildId: 'b'.repeat(64), phase: 'active',
  } });
  const reload = document.querySelector<HTMLButtonElement>('[data-cf-pwa-update] [data-pwa-action="reload"]');
  if (reload === null || reload.hidden) throw new Error('the update pill never offered Reload');
  const fireTimers = () => { const due = [...timers.values()]; timers.clear(); for (const fn of due) fn(); };
  const settle = async () => {
    for (let turn = 0; turn < 5_000; turn++) {
      if (env.activePersist === null) {
        for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    throw new Error('PWA harness never settled');
  };
  return { dom, env, exec, reload, reloadsAt, toast, timers, fireTimers, settle };
}

/* ---------------- the scenarios ---------------- */

async function pendingSettingScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  const f = await freshFixture();
  const h = await mainPwaHarness(f, mutations);
  try {
    const before = await durableSfx(f);
    h.env.save.sfxVol = before === 0.3 ? 0.4 : 0.3; // a settings slider moved…
    h.exec.persistSoon(); // …its 400 ms debounced save is pending
    expect(h.timers.size).toBe(1);
    h.reload.click();
    await h.settle();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(h.reloadsAt, 'pwa: Reload proceeds once its pending write is durable').toHaveLength(1);
    expect(await h.reloadsAt[0], 'pwa: the pending settings write is durable before the reload')
      .toBe(h.env.save.sfxVol);
    expect(h.timers.size, 'the debounce was consumed by the reload checkpoint, not left behind').toBe(0);
    expect(h.toast).not.toHaveBeenCalled();
  } finally {
    (h.env.pwaUpdateControl as { dispose(): void }).dispose();
    h.dom.window.close();
    await f.runtime.release();
  }
}

async function failedInFlightScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  const f = await freshFixture();
  const h = await mainPwaHarness(f, mutations);
  try {
    const before = await durableSfx(f);
    const target = before === 0.3 ? 0.4 : 0.3;
    h.env.save.sfxVol = target;
    h.exec.persistSoon();
    // an unrelated write is in flight and will fail
    let failWrite!: (ok: boolean) => void;
    h.env.activePersist = new Promise<boolean>((resolve) => { failWrite = resolve; });
    h.reload.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    failWrite(false);
    h.env.activePersist = null;
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
    expect(h.reloadsAt, 'pwa: a failed in-flight write must refuse the reload').toHaveLength(0);
    expect(h.toast).toHaveBeenCalledWith('Save not yet durable', expect.stringContaining('restored'), true);
    expect(h.env.replacementTransaction ?? null, 'the refused reload releases its claim').toBeNull();
    // the canceled settings debounce was re-armed and still lands durably
    expect(h.timers.size, 'pwa: the canceled settings save must be re-armed').toBe(1);
    h.fireTimers();
    await h.settle();
    expect(await durableSfx(f), 'pwa: the re-armed settings save must become durable').toBe(target);
  } finally {
    (h.env.pwaUpdateControl as { dispose(): void }).dispose();
    h.dom.window.close();
    await f.runtime.release();
  }
}

describe('A5 #129 — the PWA update Reload never loses a pending write', () => {
  it('a pending settings save is checkpointed durably before the reload is scheduled', async () => {
    await pendingSettingScenario();
  }, 30_000);

  it('a failed in-flight write refuses the reload, restores the settings save, and that save still lands durably', async () => {
    await failedInFlightScenario();
  }, 30_000);

  it('the pill Reload reaches reloadForPwaUpdate exactly as boot wires it', () => {
    expect(PILL_MOUNT).toContain('void reloadForPwaUpdate();');
  });

  it('negative control — CHECKPOINT SKIPPED: reloading without the pending save fails the outcome test', async () => {
    await expect(pendingSettingScenario([{
      name: 'skip checkpoint', needle: '    checkpointRequired: (claim) => claim.persistWasScheduled,',
      replacement: '    checkpointRequired: () => false,',
    }])).rejects.toThrow(/pwa: the pending settings write is durable before the reload/u);
  }, 30_000);

  it('negative control — NOT RE-ARMED: a refused reload that drops the canceled save fails the outcome test', async () => {
    await expect(failedInFlightScenario([{
      name: 'drop re-arm', needle: '    if (rearmPersist && claim.persistWasScheduled) persistSoon();',
      replacement: '    void rearmPersist;',
    }])).rejects.toThrow(/pwa: the canceled settings save must be re-armed/u);
  }, 30_000);

  it('negative control — UNWIRED PILL: the Reload button reaches nothing', async () => {
    await expect(pendingSettingScenario([{
      name: 'unwired pill', needle: '        void reloadForPwaUpdate();', replacement: '        void 0;',
    }])).rejects.toThrow(/pwa: Reload proceeds once its pending write is durable/u);
  }, 30_000);
});
