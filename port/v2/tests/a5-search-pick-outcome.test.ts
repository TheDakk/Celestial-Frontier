/* A5 gap #92 (INVENTORY.md row #92): pick a search result → travel — read back DURABLY after the press.
 *
 * The browser presses (slicesmoke S:9961-10030) read live `persistence.lastOutcome` only; the durable proof called the transaction
 * directly. Here the exact shipped Main search-bar section runs in JSDOM: the REAL search controller (createSearchTravelController from
 * search-travel.ts, bound to the real #searchbox) and Main's commit port (commitSearchTravelSequence → commitArc9FollowedSearchRoute →
 * the Arc 9 Follow transaction) over a real F4 runtime and memory backend. The test types a CF1 route into the search box and presses
 * Enter, then reads the committed v5 save back (twice) and reboots: exactly one Follow receipt, the durable route is the picked system,
 * the Follow counter moved. Mutation controls break the wiring (the commit port never follows; the committed fields never publish).
 * Stubbed externals: scene rendering, camera, the presentation owner, chips/records, the Compendium ports. */
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
import { GR, NAV_HOME, ascend, navFromCanonicalCF1Address, navToView, parseStrictCF1Code, resolveCF1StarAddress } from '@cf/scene';
import { encodeWhere } from '@cf/domain-strays';
import { SYS_R } from '@cf/domain-worldconfig';
import { ARC9_SHARE_FOLLOW_OPERATION_V1, commitArc9SharingActionV1, publishArc9SharingFieldsV1 } from '../apps/game/src/arc9-sharing-action.js';
import { commitSearchTravelSequence, createSearchTravelController, navigationAuthorityFailureFor } from '../apps/game/src/search-travel.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_075_000;
/** The public share code for Sol (what a card's Share copies): encodeWhere over the proven system view. */
function solCode(): string {
  const address = resolveCF1StarAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 } });
  if (!address.ok) throw new Error('sol address');
  const sol = navFromCanonicalCF1Address(address.address);
  if (!sol.ok) throw new Error('sol nav');
  return encodeWhere(navToView(sol.state) as never) as string;
}
beforeAll(() => installCaptureHooks());
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void; KeyboardEvent: typeof KeyboardEvent } } };

function exactMainSection(start: string, end: string): string {
  const a = MAIN_SOURCE.split(start).length - 1, b = MAIN_SOURCE.split(end).length - 1;
  if (a !== 1 || b !== 1) throw new Error(`Main search anchors must be unique (${a}/${b}): ${start} -> ${end}`);
  const left = MAIN_SOURCE.indexOf(start);
  return MAIN_SOURCE.slice(left, MAIN_SOURCE.indexOf(end, left + start.length));
}
const MAIN_SEARCH = [
  exactMainSection('/* ---- THE SEARCH BAR', "\nsheet.querySelector('#importretry')"),
  exactMainSection('function blockRouteChangeWhileProductAction(): boolean {', '\nfunction blockPlayerMutation('),
].join('\n');
interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }
function replaceExact(source: string, m: MainMutation): string {
  const n = source.split(m.needle).length - 1;
  if (n !== 1) throw new Error(`mutation "${m.name}" needle must occur once; found ${n}`);
  return source.replace(m.needle, () => m.replacement);
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
    initialState: saved.state, restoredAuthority: authority.authority, freshSessionSeed: 0, ownerId: `a5-search-${tag}`, token: `a5-search-${tag}`, leaseTtlMs: 1_000_000,
    now: () => 0, visible: true, answerable: true });
  if ((await runtime.heartbeat()).kind !== 'owned') throw new Error('lease');
  return { backend, repository, runtime, state: saved.state };
}
async function durable(f: Fixture) { const s = await readSaveV5(f.backend, REGISTRY, NOW); if (s.kind !== 'loaded') throw new Error(s.kind); return s; }

function harness(f: Fixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM('<!doctype html><html><body><input id="searchbox"><section id="card"></section><canvas></canvas></body></html>'), document = dom.window.document;
  const g = globalThis as Record<string, unknown>, w = dom.window as unknown as Record<string, unknown>, DOM_GLOBALS = ['Element', 'HTMLElement', 'HTMLButtonElement', 'Event', 'KeyboardEvent'] as const;
  const prior = DOM_GLOBALS.map((k) => [k, g[k]] as const); for (const k of DOM_GLOBALS) g[k] = w[k];
  const rerender = vi.fn(), ceremony = vi.fn(), scheduleReload = vi.fn(), presentation = vi.fn();
  const env: Record<string, unknown> & { nav: { mode: string }; save: SaveStateV2; activePersist: unknown; productActionInFlight: boolean } = {
    document, card: document.getElementById('card'), app: { canvas: document.querySelector('canvas') }, sheet: document.body,
    Date: Object.freeze({ now: () => NOW }), performance: Object.freeze({ now: () => 17 }), queueMicrotask,
    save: f.state, nav: NAV_HOME, navToView, ascend, GR, SYS_R, SHIP_LIVERY_SEED: 0x5111, savedRouteWriteHeld: false,
    f4Runtime: f.runtime, f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => runtime !== null && runtime.diagnostics().leaseOwned && !runtime.diagnostics().staleBlocked,
    f4LastCheckpointAt: 0, lastPersistenceOutcome: null, settleF4Heartbeat: async () => undefined,
    activePersist: null, importWriteInFlight: false, replacementTransaction: null, replacementReloadPending: false, trainingCheckpointWriteHeld: false,
    productActionInFlight: false, productActionCoordinator: createProductActionCoordinator(), smokeProductActionHold: createProductActionDiagnosticHold(),
    trainingActive: () => false, ecologyEpochBlocksActions: () => false, playerMutationsBlocked: () => false, smokeForceReadOnly: false,
    lastArc9ShareFollowOutcome: null, lastArc9TravelOutcome: null, arc9TravelInspectionOnly: () => false, arc9TravelWriteTemporarilyBlocked: () => false,
    // the real owners main.ts imports
    createSearchTravelController, commitSearchTravelSequence, navigationAuthorityFailureFor, commitArc9SharingActionV1, publishArc9SharingFieldsV1, ARC9_SHARE_FOLLOW_OPERATION_V1,
    worldIdentityName: () => null, worldIdentityState: null, planetNodeForProof: () => null,
    // presentation (not under test)
    captureSearchTravelPresentationIntent: vi.fn(), startSearchTravelPresentation: presentation, rerender, playWhoosh: vi.fn(), minWH: () => 800,
    cam: { x: 0, y: 0, z: 1 }, camT: { x: 0, y: 0, z: 1 }, gz0: 0, sz0: 0, surveyPlanet: vi.fn(), updateChips: vi.fn(), openPanelId: () => null, fillRecords: vi.fn(),
    presentProgressionCeremony: ceremony, scheduleF4AuthorityConvergenceReload: scheduleReload, toast: vi.fn(), toastPrimeReachBoundary: vi.fn(), toastCharterBoundary: vi.fn(),
    ascHintFor: () => '', ascStage: () => 0, codexMode: 'list', codexFilter: '', fillCodex: vi.fn(), codexOpenController: { present: vi.fn() }, persistSoon: vi.fn(),
    queueArc9ProgressionRefresh: vi.fn(), operationForArc0WorldName: () => 'unused', settleArc9DirectTravel: vi.fn(async () => false),
  };
  const source = mutations.reduce(replaceExact, MAIN_SEARCH);
  const t = transformSync('main-search.ts', source);
  if (t.errors.length) throw new Error(JSON.stringify(t.errors));
  new Function('env', `with (env) { ${t.code}; }`)(env);
  const restore = () => { for (const [k, v] of prior) { if (v === undefined) delete g[k]; else g[k] = v; } dom.window.close(); };
  return { dom, env, rerender, ceremony, scheduleReload, presentation, restore, search: document.getElementById('searchbox') as HTMLInputElement };
}
async function settled(env: { activePersist: unknown; productActionInFlight: boolean }): Promise<void> {
  for (let i = 0; i < 5_000; i++) { if (env.activePersist === null && !env.productActionInFlight) { for (let k = 0; k < 8; k++) await new Promise((r) => setTimeout(r, 0)); return; } await new Promise((r) => setTimeout(r, 0)); }
  throw new Error('search press never settled');
}

async function scenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  const h = harness(f, mutations);
  try {
    const before = await durable(f), start = await f.repository.revision();
    const code = solCode();
    expect(parseStrictCF1Code(code).kind, 'the fixture is a valid public CF1 code').toBe('valid');
    h.search.value = code;
    h.search.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await settled(h.env);
    expect(await f.repository.revision(), `search pick: one durable revision (${String(h.env.lastArc9ShareFollowOutcome)})`).toBe(start + 1);
    expect(await f.backend.keys('receipts'), 'search pick: exactly one receipt').toHaveLength(1);
    expect(h.env.nav.mode, 'search pick: the live route is the picked system').toBe('system');
    for (let read = 0; read < 2; read++) {
      const saved = await durable(f);
      expect(JSON.stringify(saved.state.savedView), 'search pick: the DURABLE route is the picked system').toBe(JSON.stringify(navToView(h.env.nav as never)));
      expect(saved.state.savedView).not.toEqual(before.state.savedView);
      expect(saved.state.stats.jumps ?? 0, 'search pick: the Follow counter moved durably').toBe((before.state.stats.jumps ?? 0) + 1);
    }
    expect(JSON.stringify(h.env.save), 'search pick: the live save equals the durable save').toBe(JSON.stringify((await durable(f)).state));
    expect(h.search.value, 'search pick: the committed route clears the box').toBe('');
    expect(h.scheduleReload).not.toHaveBeenCalled();
    await f.runtime.release();
    f = await boot(f.backend, 'reloaded');
    expect(JSON.stringify(f.state.savedView), 'search pick: the reboot restores the picked route').toBe(JSON.stringify(navToView(h.env.nav as never)));
  } finally {
    h.restore();
    await f.runtime.release();
  }
}

describe('A5 #92 — picking a search result is a durable UI outcome', () => {
  it('typing a CF1 route and pressing Enter commits one Follow receipt: durable route (read twice), Follow counter, reboot', async () => {
    await scenario();
  }, 30_000);
  const MUTANTS: readonly Readonly<{ mutation: MainMutation; failsWith: RegExp }>[] = [
    { mutation: { name: 'UNWIRED: the commit port never follows', needle: '          const committed = await commitArc9FollowedSearchRoute(plan);', replacement: '          const committed = false; void plan;' },
      failsWith: /search pick: one durable revision/u },
    { mutation: { name: 'UNPUBLISHED: the committed Follow never reaches the live save', needle: '      publishArc9SharingFieldsV1(save, outcome);', replacement: '      void outcome;' },
      failsWith: /search pick: the live save equals the durable save|search pick: the DURABLE route/u },
  ];
  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      await expect(scenario([mutation])).rejects.toThrow(failsWith);
    }, 30_000);
  }
});
