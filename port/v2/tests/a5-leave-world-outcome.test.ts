/* A5 gap #11 (INVENTORY.md row #11): Depart / leave world — read back DURABLY after the press.
 *
 * The browser presses (slicesmoke S:24097 / S:25330) read the live mode only. Here the exact shipped main.ts sections run in JSDOM over a
 * REAL F4 runtime and memory backend: the survey card's delegated click listener (its `leaveworld` branch), goUp, rerender and the real
 * receipt-free view checkpoint (persistView with its ecology-epoch authority). The test presses the card's "Leave world" control on a
 * proven surface, then reads the committed v5 save back (twice) and reboots a fresh F4 runtime from it: the durable route is the system
 * the explorer ascended to. Mutation controls break the wiring (the press never ascends; the ascent never checkpoints) and the scenario
 * must fail. Stubbed externals: Pixi scene building, camera, whoosh, survey presentation teardown, the HUD. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V4_PRIMARY_KEY, createMemoryBackend, createRevisionedRepository, importSaveV2, migrateStoredV4ToV5, prepareF4AuthorityUpdate, prepareV5SaveWrite,
  readF4Authority, readSaveV5, type ContentRegistry, type SaveStateV2, type StorageBackend,
} from '@cf/persistence';
import { NAV_HOME, ascend, getProvenPlanetKey, navFromCanonicalCF1Address, navToView, resolveCF1WorldAddress } from '@cf/scene';
import { projectCheckpointState } from '../apps/game/src/checkpoint-state.js';
import { createEcologyEpochEdgeAuthority } from '../apps/game/src/ecology-epoch-edge.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_070_000;
beforeAll(() => installCaptureHooks());
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };

function exactMainSection(start: string, end: string, inclusive = false): string {
  const a = MAIN_SOURCE.split(start).length - 1, b = MAIN_SOURCE.split(end).length - 1;
  if (a !== 1 || b !== 1) throw new Error(`Main leave-world anchors must be unique (${a}/${b}): ${start} -> ${end}`);
  const left = MAIN_SOURCE.indexOf(start), right = MAIN_SOURCE.indexOf(end, left + start.length);
  return MAIN_SOURCE.slice(left, inclusive ? right + end.length : right);
}
const MAIN_SOURCE_UNDER_TEST = [
  exactMainSection('const F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER = Symbol(', "const F4_LIFECYCLE_CHECKPOINT_OWNER = Symbol('f4-lifecycle-checkpoint-owner');\n", true),
  exactMainSection('let ecologyEpochAuthority: EcologyEpochEdgeAuthority = createEcologyEpochEdgeAuthority({', '\nconst TOUCH_DPR'),
  exactMainSection('function rerender(options: { preserveSurvey?: boolean; skipPersist?: boolean } = {}): void {', '\n/* descents EASE in'),
  exactMainSection("card.addEventListener('click', async (e) => {", '\nlet worldHarvestPendingSeed'),
  exactMainSection('function goUp(): void {', '\nfunction publishWormholeTraversal('),
  exactMainSection('function arc9TravelInspectionOnly(): boolean {', '\nfunction arc9AtlasRowActionBlocked(): boolean {'),
  exactMainSection('function blockRouteChangeWhileProductAction(): boolean {', '\nfunction blockPlayerMutation('),
  exactMainSection('async function persistView(', '\nlet _persistT = 0;'),
].join('\n');
const BOOT = `
function __harnessBoot() {
  ecologyObservedActivePlayMs = f4Runtime?.diagnostics().activePlayMs ?? 0;
  ecologyEpochAuthority = createEcologyEpochEdgeAuthority({ restoredEpoch: save.EPOCH_BASE, activePlayAtBootMs: ecologyObservedActivePlayMs });
}`;
interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }
function replaceExact(source: string, m: MainMutation): string {
  const n = source.split(m.needle).length - 1;
  if (n !== 1) throw new Error(`mutation "${m.name}" needle must occur once; found ${n}`);
  return source.replace(m.needle, () => m.replacement);
}

function surfaceNav() {
  const ADDRESS = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }, planet: { seed: 2456455053 } } as never);
  if (!ADDRESS.ok) throw new Error(`fixture address ${JSON.stringify(ADDRESS)}`);
  const r = navFromCanonicalCF1Address(ADDRESS.address);
  if (!r.ok || r.state.mode !== 'surface') throw new Error('fixture surface');
  return r.state;
}

interface Fixture { backend: StorageBackend; repository: ReturnType<typeof createRevisionedRepository>; runtime: F4RuntimeAuthority; state: SaveStateV2 }
async function freshFixture(): Promise<Fixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(0).state());
  const backend = createMemoryBackend(), initial = prepareV5SaveWrite({ state: imported.state, extensions: f4.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  if ((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind !== 'migrated') throw new Error('v5');
  await backend.apply(initial.operations);
  return boot(backend, 'first');
}
async function boot(backend: StorageBackend, tag: string): Promise<Fixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(saved.kind);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(authority.kind);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({ backend, repository, registry: REGISTRY, initialRevision: await repository.revision(), initialExtensions: saved.extensions,
    initialState: saved.state, restoredAuthority: authority.authority, freshSessionSeed: 0, ownerId: `a5-leave-${tag}`, token: `a5-leave-${tag}`, leaseTtlMs: 1_000_000,
    now: () => 0, visible: true, answerable: true });
  if ((await runtime.heartbeat()).kind !== 'owned') throw new Error('lease');
  return { backend, repository, runtime, state: saved.state };
}
async function durable(f: Fixture) { const s = await readSaveV5(f.backend, REGISTRY, NOW); if (s.kind !== 'loaded') throw new Error(s.kind); return s; }

function harness(f: Fixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM('<!doctype html><html><body><section id="card" style="display:block"></section></body></html>'), document = dom.window.document;
  const card = document.getElementById('card')!;
  const g = globalThis as Record<string, unknown>, w = dom.window as unknown as Record<string, unknown>, DOM_GLOBALS = ['Element', 'HTMLElement', 'HTMLButtonElement', 'Event'] as const;
  const prior = DOM_GLOBALS.map((k) => [k, g[k]] as const); for (const k of DOM_GLOBALS) g[k] = w[k];
  const surface = surfaceNav(), scheduleReload = vi.fn(), buildScene = vi.fn();
  const env: Record<string, unknown> & { nav: { mode: string }; activePersist: unknown; productActionInFlight: boolean } = {
    document, card, Date: Object.freeze({ now: () => NOW }), performance: Object.freeze({ now: () => 17 }), __CF_EVIDENCE_BUILD__: false, smokeRejectNextPersist: false,
    save: f.state, nav: surface, navToView, ascend, getProvenPlanetKey, savedRouteWriteHeld: false,
    cardCtx: { p: null, gal: surface.gal, star: surface.star, planet: surface.planet }, activeCardPlanetWhere: () => 'fixture-world', cardTravelAction: null,
    f4Runtime: f.runtime, f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => runtime !== null && runtime.diagnostics().leaseOwned && !runtime.diagnostics().staleBlocked,
    f4LastCheckpointAt: 0, lastPersistenceOutcome: null, settleF4Heartbeat: async () => undefined,
    activePersist: null, persistHold: false, namedSearchPersistenceHeld: false, namedSearchPersistenceDeferred: false, importWriteInFlight: false, replacementTransaction: null,
    replacementReloadPending: false, trainingCheckpointWriteHeld: false, productActionInFlight: false, productActionCoordinator: createProductActionCoordinator(),
    smokeProductActionHold: createProductActionDiagnosticHold(), smokeForceReadOnly: false, playerMutationsBlocked: () => false, trainingActive: () => false,
    ecologyEpochBlocksActions: () => false, lastArc9TravelOutcome: null,
    createEcologyEpochEdgeAuthority, projectCheckpointState, notificationHistory: { flushPending: vi.fn() },
    publishCommittedEcologyEpoch: vi.fn(), suppressEcologyProjection: vi.fn(), refreshCommittedEcologyProjection: vi.fn(), f4PageVisible: () => true,
    scheduleF4AuthorityConvergenceReload: scheduleReload, toast: vi.fn(),
    // presentation (not under test)
    isAiActionTarget: () => false, hideSurvey: vi.fn(), invalidateSurveyTravel: vi.fn(), discardSurveyPresentation: vi.fn(), clearPlanetside: vi.fn(),
    buildCurrentSceneTransaction: buildScene, hudText: vi.fn(), world: { alpha: 1 }, openPanelId: () => null, closePanels: vi.fn(),
    tameGreetingAudioOwner: { syncRoute: vi.fn() }, currentTameGreetingRouteKey: () => 'route', playWhoosh: vi.fn(), minWH: () => 800, sz0: 1,
    cam: { x: 0, y: 0, z: 1 }, camT: { x: 0, y: 0, z: 1 }, app: Object.freeze({ canvas: Object.freeze({ focus: vi.fn() }), ticker: Object.freeze({ started: false }) }),
  };
  const source = mutations.reduce(replaceExact, MAIN_SOURCE_UNDER_TEST) + BOOT;
  const t = transformSync('main-leave-world.ts', source);
  if (t.errors.length) throw new Error(JSON.stringify(t.errors));
  new Function('env', `with (env) { ${t.code}; __harnessBoot(); }`)(env);
  card.innerHTML = '<button data-act="leaveworld">Leave world</button>';
  const restore = () => { for (const [k, v] of prior) { if (v === undefined) delete g[k]; else g[k] = v; } dom.window.close(); };
  return { env, card, surface, buildScene, scheduleReload, restore };
}
async function settled(env: { activePersist: unknown; productActionInFlight: boolean }): Promise<void> {
  for (let i = 0; i < 5_000; i++) { if (env.activePersist === null && !env.productActionInFlight) { for (let k = 0; k < 5; k++) await new Promise((r) => setTimeout(r, 0)); return; } await new Promise((r) => setTimeout(r, 0)); }
  throw new Error('leave-world press never settled');
}

async function scenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  const h = harness(f, mutations);
  try {
    const before = await durable(f), start = await f.repository.revision();
    const expected = ascend(h.surface);
    if (!expected.ok) throw new Error('ascend');
    const button = h.card.querySelector<HTMLButtonElement>('[data-act="leaveworld"]')!;
    button.click();
    await settled(h.env);
    expect(h.env.nav.mode, 'leave world: the live route ascended to the system').toBe('system');
    expect(await f.repository.revision(), 'leave world: one checkpoint revision').toBe(start + 1);
    for (let read = 0; read < 2; read++) {
      const saved = await durable(f);
      expect(JSON.stringify(saved.state.savedView), 'leave world: the DURABLE route is the system the explorer ascended to').toBe(JSON.stringify(navToView(expected.state)));
      expect(saved.state.savedView).not.toEqual(before.state.savedView);
    }
    expect(h.buildScene).toHaveBeenCalledTimes(1);
    expect(h.scheduleReload).not.toHaveBeenCalled();
    await f.runtime.release();
    f = await boot(f.backend, 'reloaded');
    expect(JSON.stringify(f.state.savedView), 'leave world: the reboot restores the system route').toBe(JSON.stringify(navToView(expected.state)));
  } finally {
    h.restore();
    await f.runtime.release();
  }
}

describe('A5 #11 — leaving a world is a durable UI outcome', () => {
  it('pressing Leave world on a proven surface ascends and checkpoints the system route durably (read twice), and a reboot restores it', async () => {
    await scenario();
  }, 30_000);
  const MUTANTS: readonly Readonly<{ mutation: MainMutation; failsWith: RegExp }>[] = [
    { mutation: { name: 'UNWIRED: the press never ascends', needle: '    hideSurvey();\n    goUp();\n', replacement: '    hideSurvey();\n' }, failsWith: /leave world: the live route ascended/u },
    { mutation: { name: 'LIVE-ONLY: the ascent never checkpoints', needle: '  if (!options.skipPersist) void persistView();\n', replacement: '' }, failsWith: /leave world: one checkpoint revision/u },
  ];
  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      await expect(scenario([mutation])).rejects.toThrow(failsWith);
    }, 30_000);
  }
});
