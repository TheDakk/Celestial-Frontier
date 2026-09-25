/* A5 gap #12 (INVENTORY.md row #21): card travel — the survey card's
 * "Enter galaxy" control — read back DURABLY after the press.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. The browser
 * presses (slicesmoke) read only live state; the durable proof called the
 * transaction directly. Here the exact shipped main.ts sections are sliced,
 * type-stripped and executed with an injected env: the survey card's
 * delegated click listener, blockRouteChangeWhileProductAction, the galaxy
 * descent (resolveGalaxyDescent / publishGalaxyDescent / descendGalaxy) and
 * settleArc9DirectTravel. The card's travel control and its action are
 * exactly what showSurvey and the universe tap install (both asserted
 * verbatim below). The test presses the control, then reads the COMMITTED v5
 * save back from a real memory backend with readSaveV5 and reboots a fresh F4
 * runtime from it.
 *
 * Stubbed externals: rendering (rerender / camera / whoosh), the Prime-reach
 * boundary probe (searchTravel.navigationAuthorityFailure → none; the home
 * galaxy is always in reach), toast, the progression ceremony and the
 * heartbeat settle. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
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
import { GR, NAV_HOME, enterGalaxy, getProvenGalaxyKey, navToView, resolveCF1Galaxy } from '@cf/scene';
import {
  ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1,
  commitArc9GalaxyArrivalRouteV1,
  commitArc9TravelSettlementV1,
  operationForArc9TravelV1,
  publishArc9TravelFieldsV1,
} from '../apps/game/src/arc9-travel-action.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_080_000;
const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });

beforeAll(() => installCaptureHooks());

interface TestWindow extends Window { readonly Element: typeof Element; close(): void }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

function exactMainSection(start: string, end: string): string {
  const startCount = MAIN_SOURCE.split(start).length - 1;
  const endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`Main travel section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main travel section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

const MAIN_TRAVEL_SOURCE = [
  exactMainSection('function resolveGalaxyDescent(', '\nfunction descendSystem('),
  exactMainSection("card.addEventListener('click', async (e) => {", '\nlet worldHarvestPendingSeed'),
  exactMainSection('function arc9TravelInspectionOnly(): boolean {', '\nfunction arc9AtlasRowActionBlocked(): boolean {'),
  exactMainSection('function blockRouteChangeWhileProductAction(): boolean {', '\nfunction blockPlayerMutation('),
].join('\n');

/* The universe tap's card action, and showSurvey's travel control (label only). */
const UNIVERSE_TAP_ACTION = "{ label: 'Enter galaxy', run: () => descendGalaxy(galaxy) }";
const SURVEY_TRAVEL_BUTTON = '<button data-act="travel" style="background:rgba(202,162,79,0.14);color:#ffd9a0;border:1px solid #caa24f;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:44px;font:12px system-ui">${esc(travelAction.label)}</button>';
const HARNESS_SHOW_CARD = `
function __harnessShowTravelCard(galaxy) {
  cardTravelAction = ${UNIVERSE_TAP_ACTION};
  card.innerHTML = '<button data-act="travel">Enter galaxy</button>';
}`;

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main travel source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

interface ExecutableMainTravel { readonly show: (galaxy: typeof HOME_GALAXY) => void; readonly outcome: () => string | null }

function executableMainTravel(env: Record<string, unknown>, mutations: readonly MainMutation[]): ExecutableMainTravel {
  const source = mutations.reduce(replaceExact, MAIN_TRAVEL_SOURCE) + HARNESS_SHOW_CARD;
  const transformed = transformSync('main-travel.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    show: (galaxy) => __harnessShowTravelCard(galaxy),
    outcome: () => lastArc9TravelOutcome,
  }; }`)(env) as ExecutableMainTravel;
}

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
  if (migrated.kind !== 'migrated') throw new Error(`travel fixture was ${migrated.kind}`);
  await backend.apply(initial.operations);
  return bootFromDurableSave(backend, 'first');
}

async function bootFromDurableSave(backend: StorageBackend, tag: string): Promise<DurableFixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`travel boot read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`travel boot F4 authority was ${authority.kind}`);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: `a5-travel-${tag}-tab`, token: `a5-travel-${tag}-document`,
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`travel lease was ${heartbeat.kind}`);
  return { backend, repository, runtime, state: saved.state };
}

async function durableSave(f: DurableFixture) {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return saved;
}

function mainTravelHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body><section id="card" style="display:block"></section></body></html>`);
  const document = dom.window.document;
  const card = document.getElementById('card')!;
  const g = globalThis as Record<string, unknown>, w = dom.window as unknown as Record<string, unknown>;
  const DOM_GLOBALS = ['Element', 'HTMLElement', 'HTMLButtonElement', 'Event'] as const;
  const prior = DOM_GLOBALS.map((key) => [key, g[key]] as const);
  for (const key of DOM_GLOBALS) g[key] = w[key];
  const rerender = vi.fn();
  const ceremony = vi.fn();
  const scheduleReload = vi.fn();
  const env: Record<string, unknown> & { save: SaveStateV2; nav: unknown; activePersist: unknown; productActionInFlight: boolean } = {
    document,
    card,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    save: f.state,
    nav: NAV_HOME,
    savedRouteWriteHeld: false,
    cardTravelAction: null,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => {
      if (runtime === null) return false;
      const diagnostics = runtime.diagnostics();
      return diagnostics.leaseOwned && !diagnostics.staleBlocked;
    },
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    lastArc9TravelOutcome: null,
    activePersist: null,
    smokeForceReadOnly: false,
    importWriteInFlight: false,
    replacementTransaction: null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    trainingActive: () => false,
    ecologyEpochBlocksActions: () => false,
    productActionCoordinator: createProductActionCoordinator(),
    productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined,
    // the real owners main.ts imports
    resolveCF1Galaxy, enterGalaxy, getProvenGalaxyKey, GR,
    commitArc9GalaxyArrivalRouteV1, commitArc9TravelSettlementV1, operationForArc9TravelV1, publishArc9TravelFieldsV1,
    // rendering / presentation (not under test)
    searchTravel: Object.freeze({ navigationAuthorityFailure: () => null }),
    minWH: () => 800,
    cam: { x: 0, y: 0, z: 1 },
    camT: { x: 0, y: 0, z: 1 },
    gz0: 0,
    playWhoosh: vi.fn(),
    rerender,
    isAiActionTarget: () => false,
    hideSurvey: vi.fn(),
    app: Object.freeze({ canvas: Object.freeze({ focus: vi.fn() }) }),
    toast: vi.fn(),
    toastPrimeReachBoundary: vi.fn(),
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    presentProgressionCeremony: ceremony,
    updateChips: vi.fn(),
    openPanelId: () => null,
    fillRecords: vi.fn(),
  };
  const exec = executableMainTravel(env, mutations);
  const travel = () => card.querySelector<HTMLButtonElement>('[data-act="travel"]');
  const restore = () => {
    for (const [key, value] of prior) { if (value === undefined) delete g[key]; else g[key] = value; }
    dom.window.close();
  };
  return { dom, env, exec, card, travel, rerender, ceremony, scheduleReload, restore };
}
type Harness = ReturnType<typeof mainTravelHarness>;

async function settled(h: Harness): Promise<void> {
  for (let turn = 0; turn < 5_000; turn++) {
    if (!h.env.productActionInFlight && h.env.activePersist === null) {
      for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('travel press never settled');
}

async function cardTravelScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  const harnesses: Harness[] = [];
  try {
    const h = mainTravelHarness(f, mutations);
    harnesses.push(h);
    h.exec.show(HOME_GALAXY);
    const start = await f.repository.revision();
    const before = await durableSave(f);
    const button = h.travel();
    expect(button, 'the card renders its travel control').not.toBeNull();
    button!.click();
    expect(button!.disabled, 'the pressed travel control locks at once').toBe(true);
    button!.click(); // a double tap after the one-shot action was consumed
    await settled(h);

    expect(await f.repository.revision(), `travel: the card press must commit exactly one revision (${String(h.exec.outcome())})`).toBe(start + 1);
    const receipts = await f.backend.keys('receipts');
    expect(receipts, 'travel: exactly one receipt').toHaveLength(1);
    expect((await f.repository.readReceipt(0))?.kind, 'travel: the receipt is the Arc 9 galaxy arrival').toBe(ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1);
    const saved = await durableSave(f);
    expect(h.exec.outcome()).toMatch(/^committed:galaxy-arrival:/u);
    const env = h.env as { nav: { mode: string } };
    expect(env.nav.mode, 'travel: the live route arrived in the galaxy').toBe('galaxy');
    expect(JSON.stringify(saved.state.savedView), 'travel: the durable route is the arrived galaxy')
      .toBe(JSON.stringify(navToView(h.env.nav as never)));
    expect(saved.state.savedView).not.toEqual(before.state.savedView);
    expect(JSON.stringify(h.env.save), 'travel: the live save equals the durable save').toBe(JSON.stringify(saved.state));
    expect(h.rerender, 'travel publishes one scene render').toHaveBeenCalledTimes(1);
    expect(h.scheduleReload).not.toHaveBeenCalled();

    // reboot: the arrival is what storage says
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'reloaded');
    expect(JSON.stringify(f.state.savedView)).toBe(JSON.stringify(saved.state.savedView));
    expect(JSON.stringify(f.state.galSeen)).toBe(JSON.stringify(saved.state.galSeen));
  } finally {
    for (const h of [...harnesses].reverse()) h.restore();
    await f.runtime.release();
  }
}

describe('A5 #21 — card travel is a durable UI outcome', () => {
  it('pressing the card\'s Enter galaxy commits one Arc 9 travel receipt whose durable route is the arrived galaxy, and survives reboot', async () => {
    await cardTravelScenario();
  }, 30_000);

  it('the harness card re-runs the exact universe-tap action and showSurvey travel control', () => {
    expect(MAIN_SOURCE.split(UNIVERSE_TAP_ACTION).length - 1).toBeGreaterThanOrEqual(1);
    expect(MAIN_SOURCE.split(SURVEY_TRAVEL_BUTTON).length - 1).toBe(1);
  });

  const MUTANTS: ReadonlyArray<Readonly<{ mutation: MainMutation; failsWith: RegExp }>> = [
    {
      mutation: { name: 'UNWIRED: the travel control never runs its action', needle: '    action.run();', replacement: '    void action;' },
      failsWith: /travel: the card press must commit exactly one revision/u,
    },
    {
      mutation: {
        name: 'UNPUBLISHED: the committed route never reaches the live save',
        needle: '      publishArc9TravelFieldsV1(save, outcome);',
        replacement: '      void outcome;',
      },
      failsWith: /travel: the live save equals the durable save/u,
    },
    {
      mutation: {
        name: 'LIVE-ONLY TRAVEL: the galaxy descent moves the camera but never settles durably',
        needle: "  void settleArc9DirectTravel(\n    'galaxy-arrival',",
        replacement: "  publishGalaxyDescent(accepted, true); void (async (..._ignored: unknown[]) => false)(\n    'galaxy-arrival',",
      },
      failsWith: /travel: the card press must commit exactly one revision/u,
    },
  ];

  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      expect(() => replaceExact(MAIN_TRAVEL_SOURCE, mutation)).not.toThrow();
      await expect(cardTravelScenario([mutation])).rejects.toThrow(failsWith);
    }, 30_000);
  }
});
