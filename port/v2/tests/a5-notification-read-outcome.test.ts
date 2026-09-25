/* A5 gap #14 (INVENTORY.md row #104, with the ported #105/#106 bulk actions):
 * notification Mark read against a REAL backend — UI OUTCOME test.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. The only earlier
 * test pressed the real button against a stub `persist` and the export codec,
 * with no StorageBackend or F4 revision. Here the exact shipped main.ts
 * sections are sliced, type-stripped and executed with an injected env:
 *   - the checkpoint-owner symbols and the ecology epoch-edge block,
 *   - the Main `notificationHistory` construction (the real
 *     createNotificationHistory wired to persistView),
 *   - persistView (the receipt-free F4 checkpoint writer).
 * The test presses the rendered `[data-notification-read]` and
 * `[data-notification-bulk]` controls, then reads the COMMITTED v5 save back
 * from a real memory backend with readSaveV5 (twice) and reboots a fresh F4
 * runtime from exactly that save.
 *
 * Harness glue (not shipped code): boot's ecology-authority assignment (the
 * exact lines, asserted verbatim below). Stubbed externals: the panel
 * manager (registerPanel / fillPanel), toast, the heartbeat settle, the
 * ecology projection refresh/publication hooks (no epoch edge is crossed),
 * and the page/ticker visibility probe. */
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
import { createNotificationHistory } from '../apps/game/src/notification-history.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;

interface TestWindow extends Window { readonly Element: typeof Element; close(): void }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

/* ---------------- the exact shipped Main sections ---------------- */

function exactMainSection(start: string, end: string, inclusive = false): string {
  const startCount = MAIN_SOURCE.split(start).length - 1;
  const endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`Main notification section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main notification section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, inclusive ? right + end.length : right);
}

/* boot's ecology authority assignment (main.ts boot), re-run by the harness */
const BOOT_ECOLOGY_AUTHORITY = `  ecologyObservedActivePlayMs = f4Runtime?.diagnostics().activePlayMs ?? 0;
  ecologyEpochAuthority = createEcologyEpochEdgeAuthority({
    restoredEpoch: save.EPOCH_BASE,
    activePlayAtBootMs: ecologyObservedActivePlayMs,
  });
`;

const MAIN_NOTIFICATION_SOURCE = [
  exactMainSection(
    'const F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER = Symbol(',
    "const F4_LIFECYCLE_CHECKPOINT_OWNER = Symbol('f4-lifecycle-checkpoint-owner');\n",
    true,
  ),
  exactMainSection(
    'let ecologyEpochAuthority: EcologyEpochEdgeAuthority = createEcologyEpochEdgeAuthority({',
    '\nconst TOUCH_DPR',
  ),
  exactMainSection(
    "const notificationPanel = document.getElementById('notificationpanel')!;",
    '\nconst codexOpenController = createPanelOpenController({',
  ),
  exactMainSection('async function persistView(', '\nlet _persistT = 0;'),
].join('\n');

const HARNESS_BOOT = `
function __harnessBoot() {
${BOOT_ECOLOGY_AUTHORITY}}`;

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main notification source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

interface ExecutableMainNotifications {
  readonly boot: () => void;
  readonly history: () => ReturnType<typeof createNotificationHistory>;
  readonly lastPersistenceOutcome: () => string | null;
}

function executableMainNotifications(env: Record<string, unknown>, mutations: readonly MainMutation[]): ExecutableMainNotifications {
  const source = mutations.reduce(replaceExact, MAIN_NOTIFICATION_SOURCE) + HARNESS_BOOT;
  const transformed = transformSync('main-notifications.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    boot: () => __harnessBoot(),
    history: () => notificationHistory,
    lastPersistenceOutcome: () => lastPersistenceOutcome,
  }; }`)(env) as ExecutableMainNotifications;
}

/* ---------------- durable fixtures ---------------- */

const NOTICES: SaveStateV2['notifications'] = [
  { id: 9, tt: 'Newest notice', ms: 'unread', t: NOW - 1_000, read: false },
  { id: 8, tt: 'Middle notice', ms: 'unread', t: NOW - 2_000, read: false },
  { id: 7, tt: 'Oldest notice', ms: 'already read', t: NOW - 3_000, read: true },
];

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
}

async function freshFixture(): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const state: SaveStateV2 = { ...imported.state, notifications: NOTICES.map((entry) => ({ ...entry })) };
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(0).state());
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(`notification fixture was ${migrated.kind}`);
  await backend.apply(initial.operations);
  return bootFromDurableSave(backend, 'first');
}

async function bootFromDurableSave(backend: StorageBackend, tag: string): Promise<DurableFixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`notification boot read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`notification boot F4 authority was ${authority.kind}`);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: `a5-notification-${tag}-tab`, token: `a5-notification-${tag}-document`,
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`notification lease was ${heartbeat.kind}`);
  return { backend, repository, runtime, state: saved.state };
}

async function durableSave(f: DurableFixture) {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return saved;
}

/* ---------------- the Main harness ---------------- */

function mainNotificationHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <button id="shelfnotifications"></button><button id="docknotifications"></button>
    <section id="notificationpanel" style="display:block"></section>
  </body></html>`);
  const document = dom.window.document;
  const panel = document.getElementById('notificationpanel')!;
  const DOM_GLOBALS = ['Element', 'HTMLElement', 'HTMLButtonElement', 'Event'] as const;
  const g = globalThis as Record<string, unknown>, w = dom.window as unknown as Record<string, unknown>;
  const prior = DOM_GLOBALS.map((key) => [key, g[key]] as const);
  for (const key of DOM_GLOBALS) g[key] = w[key];
  const toast = vi.fn();
  const scheduleReload = vi.fn();
  const env: Record<string, unknown> & { save: SaveStateV2; activePersist: unknown } = {
    document,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
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
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    settleF4Heartbeat: async () => undefined,
    // write-hold flags (unrelated owners), all idle
    activePersist: null,
    persistHold: false,
    namedSearchPersistenceHeld: false,
    namedSearchPersistenceDeferred: false,
    importWriteInFlight: false,
    replacementTransaction: null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    productActionInFlight: false,
    smokeForceReadOnly: false,
    playerMutationsBlocked: () => false,
    trainingActive: () => false,
    // the real owners main.ts imports
    createNotificationHistory,
    createEcologyEpochEdgeAuthority,
    projectCheckpointState,
    // panel manager / presentation / ecology hooks (not under test; no epoch edge is crossed)
    registerPanel: vi.fn(),
    fillPanel: (_id: string, html: string) => { panel.innerHTML = html; },
    localAiGame: null,
    toast,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    publishCommittedEcologyEpoch: vi.fn(),
    suppressEcologyProjection: vi.fn(),
    refreshCommittedEcologyProjection: vi.fn(),
    f4PageVisible: () => true,
    app: Object.freeze({ ticker: Object.freeze({ started: false }) }),
  };
  const exec = executableMainNotifications(env, mutations);
  exec.boot();
  exec.history().render();
  const read = (id: number) => panel.querySelector<HTMLButtonElement>(`[data-notification-read="${id}"]`);
  const bulk = (action: 'read-all' | 'clear') => panel.querySelector<HTMLButtonElement>(`[data-notification-bulk="${action}"]`);
  const badge = () => Number(document.getElementById('docknotifications')!.dataset.unread);
  const restore = () => {
    for (const [key, value] of prior) { if (value === undefined) delete g[key]; else g[key] = value; }
    dom.window.close();
  };
  return { dom, env, exec, panel, read, bulk, badge, toast, scheduleReload, restore };
}
type Harness = ReturnType<typeof mainNotificationHarness>;

async function settled(h: Harness): Promise<void> {
  for (let turn = 0; turn < 5_000; turn++) {
    if (h.env.activePersist === null && h.panel.querySelector('[data-notification-read][disabled], [data-notification-bulk][disabled]') === null) {
      for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('notification press never settled');
}

const readFlags = (state: SaveStateV2) => state.notifications.map((entry) => [entry.id, entry.read] as const);
const withoutNoticesOrView = (state: SaveStateV2) => JSON.stringify({ ...state, notifications: null, savedView: null });

/* ---------------- the scenario ---------------- */

async function markReadScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  const harnesses: Harness[] = [];
  try {
    const h = mainNotificationHarness(f, mutations);
    harnesses.push(h);
    expect(h.badge(), 'two saved notices start unread').toBe(2);
    expect(h.read(7), 'a read notice offers no Mark read').toBeNull();
    const revisionBefore = await f.repository.revision();
    const before = await durableSave(f);

    // (1) Mark read on the newest notice → one receipt-free checkpoint
    h.read(9)!.click();
    await settled(h);
    expect(await f.repository.revision(), 'notification: Mark read must commit exactly one checkpoint revision')
      .toBe(revisionBefore + 1);
    expect(await f.backend.keys('receipts'), 'reading a message creates no receipt').toEqual([]);
    const saved = await durableSave(f);
    expect(readFlags(saved.state), 'notification: exactly the pressed notice is durably read')
      .toEqual([[9, true], [8, false], [7, true]]);
    expect(withoutNoticesOrView(saved.state), 'the checkpoint changes nothing else in the save')
      .toBe(withoutNoticesOrView(before.state));
    expect(h.exec.lastPersistenceOutcome()).toBe(`committed:${revisionBefore + 1}`);
    expect(JSON.stringify(h.env.save.notifications), 'notification: the live history equals the durable history')
      .toBe(JSON.stringify(saved.state.notifications));
    expect(h.badge()).toBe(1);
    expect(h.panel.textContent).toContain('Read state saved.');
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(JSON.stringify(await durableSave(f))).toBe(JSON.stringify(saved));

    // (2) reboot from the committed save: the read state is what storage says
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'reloaded');
    const reloaded = mainNotificationHarness(f, mutations);
    harnesses.push(reloaded);
    expect(reloaded.badge(), 'notification: after reboot one notice is still unread').toBe(1);
    expect(reloaded.read(9), 'the durably read notice no longer offers Mark read').toBeNull();
    expect(reloaded.read(8)).not.toBeNull();

    // (3) Mark all read → one more checkpoint, every notice durably read
    reloaded.bulk('read-all')!.click();
    await settled(reloaded);
    expect(await f.repository.revision(), 'notification: Mark all read commits one more checkpoint').toBe(revisionBefore + 2);
    const all = await durableSave(f);
    expect(readFlags(all.state), 'notification: Mark all read durably reads every notice')
      .toEqual([[9, true], [8, true], [7, true]]);
    expect(reloaded.badge()).toBe(0);

    // (4) Clear all (armed: two taps) → the durable history is empty
    reloaded.bulk('clear')!.click();
    expect(await f.repository.revision(), 'one tap only arms Clear all').toBe(revisionBefore + 2);
    reloaded.bulk('clear')!.click();
    await settled(reloaded);
    expect(await f.repository.revision()).toBe(revisionBefore + 3);
    expect((await durableSave(f)).state.notifications, 'notification: Clear all durably empties the history').toEqual([]);
  } finally {
    for (const h of [...harnesses].reverse()) h.restore();
    await f.runtime.release();
  }
}

describe('A5 #104 — notification Mark read is a durable UI outcome on a real backend', () => {
  it('Mark read, Mark all read and Clear all each commit one receipt-free checkpoint, change only the history, and survive re-read and reboot', async () => {
    await markReadScenario();
  }, 30_000);

  it('the harness boot re-runs main.ts boot\'s exact ecology-authority lines', () => {
    expect(MAIN_SOURCE.split(BOOT_ECOLOGY_AUTHORITY).length - 1).toBe(1);
    expect(MAIN_NOTIFICATION_SOURCE).toContain('  persist: () => persistView(),');
  });

  const MUTANTS: ReadonlyArray<Readonly<{ mutation: MainMutation; failsWith: RegExp }>> = [
    {
      mutation: {
        name: 'UNWIRED: the history persists to nothing and claims success',
        needle: '  persist: () => persistView(),',
        replacement: '  persist: async () => true,',
      },
      failsWith: /notification: Mark read must commit exactly one checkpoint revision/u,
    },
    {
      mutation: {
        name: 'STALE CANDIDATE: the checkpoint projects the durable parent instead of the live save',
        needle: '        live: save,',
        replacement: '        live: checkpointParent,',
      },
      failsWith: /notification: exactly the pressed notice is durably read/u,
    },
    {
      mutation: {
        name: 'DETACHED HISTORY: the read flag is written somewhere the save never sees',
        needle: '  replace: (history) => { save.notifications = history; },',
        replacement: '  replace: (history) => { void history; },',
      },
      failsWith: /notification: exactly the pressed notice is durably read|notification: Mark read must commit/u,
    },
  ];

  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      expect(() => replaceExact(MAIN_NOTIFICATION_SOURCE, mutation)).not.toThrow();
      await expect(markReadScenario([mutation])).rejects.toThrow(failsWith);
    }, 30_000);
  }
});
