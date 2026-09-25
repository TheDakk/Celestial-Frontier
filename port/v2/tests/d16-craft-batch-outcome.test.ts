/* D16 parity — the Fabricator's ×5 (v1.8.9 `data-craft5`, INVENTORY row #68) — UI OUTCOME test.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. The exact shipped Main sections run here, type-stripped, with an
 * injected env: the real EngineeringPanelController construction, refreshEngineeringPanelState (the real read-model
 * projection from the durable carrier), engineeringOutcomeConverges, runEngineeringPanelAction, commitArc3EngineeringAction,
 * fabricateFixedEngineeringRecipe and fabricateEngineeringBatch. The test presses the ×5 button the real controller rendered
 * in JSDOM from the REAL model, then reads the committed v5 save back from a real memory backend (twice) and reboots a fresh
 * F4 runtime from it.
 *
 * Stubbed externals: the heartbeat (settled), toast/chips/other panels, the convergence reload scheduler, the Arc 9
 * progression refresh queue and the Inventory panel controller (its own owner). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { SCENE_ENGINEERING_ADDRESS_RESOLVER } from '@cf/domain-opportunity';
import {
  arc2LootLegacyMirrorMatches,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  initializeFreshV5,
  prepareArc2LootLegacyMigration,
  readArc2EngineeringLoadout,
  readArc2Loot,
  readArc3Engineering,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import { navFromCanonicalCF1Address, resolveCF1WorldAddress, type ShipVisualState, type SurfaceNav } from '@cf/scene';
import {
  deriveArc3FixedFabricationAction,
  prepareArc3AppBootstrap,
  publishArc3FixedFabricationFields,
  verifyArc3CommittedAction,
  verifyArc3CommittedFixedFabricationAction,
} from '../apps/game/src/arc3-engineering-actions.js';
import { EngineeringPanelController, fabricationBatchOffered } from '../apps/game/src/engineering-panel.js';
import { projectEngineeringPanelReadModel } from '../apps/game/src/engineering-panel-model.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { engineeringCommittedCopy, runFabricationBatchV1 } from '../apps/game/src/fabrication-batch.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const MARS = { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 134 } };
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };

beforeAll(() => installCaptureHooks());

function section(start: string, end: string): string {
  const s = MAIN_SOURCE.split(start).length - 1, e = MAIN_SOURCE.split(end).length - 1;
  if (s !== 1 || e < 1) throw new Error(`Main section anchors must be unique (${s}/${e}): ${start}`);
  const left = MAIN_SOURCE.indexOf(start), right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`Main section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}
const SECTIONS = (): string => [
  section('const engineeringPanelController = new EngineeringPanelController({', '\nlet engineeringPanelReleased'),
  section('function refreshEngineeringPanelState(): void {', '\nfunction updateChips(): void {'),
  section('async function fabricateEngineeringBatch(', '\nconst sideEl = '),
  section('async function commitArc3EngineeringAction(', '\nasync function mineCurrentSurface('),
  section('async function fabricateFixedEngineeringRecipe(', '\ntype Arc5FeedCommitOutcome'),
  section('function engineeringOutcomeConverges(', '\nasync function smokeCommitF4Outcome('),
].join('\n');

const SHIP: ShipVisualState = Object.freeze({
  chassisStage: 0, hardpoints: Object.freeze({ array: false, autoext: false, cscoop: false }),
  installedSystemIds: Object.freeze([]), liverySeed: 0x5111, provenance: 'owned-items',
}) as unknown as ShipVisualState;

function marsSurface(): SurfaceNav {
  const address = resolveCF1WorldAddress(MARS);
  if (!address.ok) throw new Error(address.reason);
  const result = navFromCanonicalCF1Address(address.address);
  if (!result.ok || result.state.mode !== 'surface') throw new Error('surface fixture failed');
  return result.state;
}

function fixtureSave(iron: number): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  imported.state.cargo = [['Fe', iron]];
  imported.state.cgx = [['Fe', 0]];
  return imported.state;
}

function fixtureExtensions(save: SaveStateV2, nav: SurfaceNav): V5Extensions {
  const loot = prepareArc2LootLegacyMigration({ extensions: {}, legacy: { items: [], equip: {}, equipAff: {} }, capacity: 32 });
  if (loot.kind !== 'prepared') throw new Error(loot.kind);
  const engineering = prepareArc3AppBootstrap({ extensions: loot.extensions, save, sources: Object.freeze({ current: nav, saved: null, atlas: Object.freeze([]) }) });
  if (engineering.kind !== 'prepared') throw new Error(engineering.kind);
  return engineering.extensions;
}

async function boot(save: SaveStateV2, extensions: V5Extensions, backend = createMemoryBackend(), fresh = true) {
  const repository = createRevisionedRepository(backend);
  let revision: number;
  let initialExtensions = extensions;
  let restoredAuthority: Parameters<typeof createF4RuntimeAuthority>[0]['restoredAuthority'] = null;
  if (fresh) {
    const initialized = await initializeFreshV5(backend, { state: save, extensions }, REGISTRY, NOW);
    if (initialized.kind !== 'initialized') throw new Error(initialized.kind);
    revision = initialized.revision;
  } else {
    // boot exactly as a document does: the committed v5 bytes, their F4 authority and the repository revision
    const loaded = await readSaveV5(backend, REGISTRY, NOW);
    if (loaded.kind !== 'loaded') throw new Error(loaded.kind);
    const authority = readF4Authority(loaded.extensions);
    if (authority.kind !== 'loaded') throw new Error(authority.kind);
    revision = await repository.revision(); initialExtensions = loaded.extensions; restoredAuthority = authority.authority;
  }
  let clock = fresh ? 100 : 1_000_000; // a reboot: the closed document's lease has long expired
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: revision, initialExtensions, ...(fresh ? {} : { initialState: save }), restoredAuthority,
    freshSessionSeed: 0xD16C5, ownerId: 'd16-craft-tab', token: `d16-craft-${fresh ? 'a' : 'b'}`, leaseTtlMs: 10_000,
    now: () => clock, visible: true, answerable: true,
  });
  await expect(runtime.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
  if (fresh) await expect(runtime.commit(save, NOW)).resolves.toMatchObject({ kind: 'committed' });
  clock += 50;
  return { backend, repository, runtime };
}

function mount(input: Readonly<{ save: SaveStateV2; booted: Awaited<ReturnType<typeof boot>>; nav: SurfaceNav; sections?: string }>) {
  const dom = new JSDOM(`<!doctype html><html><body><button id="dockshipyard">Shipyard</button><button id="railshipyard">Shipyard</button>
    <aside id="shipyardpanel" aria-label="Shipyard"><button type="button" data-pnx="shipyard">Close</button><div data-engineering-panel-body></div></aside></body></html>`);
  const engineering = readArc3Engineering(input.booted.runtime.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
  if (engineering.kind !== 'loaded') throw new Error(engineering.kind);
  const toast = vi.fn();
  const env: Record<string, unknown> = {
    document: dom.window.document, EngineeringPanelController, performance, Date,
    f4Runtime: input.booted.runtime, revisionRepo: input.booted.repository, save: input.save, nav: input.nav,
    arc3EngineeringState: engineering.state, arc3EngineeringProtection: null, lastArc3ProjectionDiagnostics: null,
    f4RuntimeMayMutate: (runtime: unknown) => runtime === env.f4Runtime,
    activePersist: null, importWriteInFlight: false, replacementTransaction: null, replacementReloadPending: false, trainingCheckpointWriteHeld: false,
    productActionCoordinator: createProductActionCoordinator(), productActionInFlight: false, smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined, __CF_EVIDENCE_BUILD__: false,
    lastArc3EngineeringOutcome: null, f4LastCheckpointAt: 0, lastPersistenceOutcome: null,
    scheduleF4AuthorityConvergenceReload: vi.fn(), presentProgressionCeremony: vi.fn(), queueArc9ProgressionRefresh: vi.fn(),
    deriveArc3FixedFabricationAction, verifyArc3CommittedFixedFabricationAction, publishArc3FixedFabricationFields,
    inventoryPanelController: { setState: vi.fn() }, arc2LootState: null,
    engineeringPanelReleased: false, mineCurrentSurface: vi.fn(), skimCurrentSystem: vi.fn(), purchaseEngineeringResearch: vi.fn(),
    updateChips: vi.fn(), refreshPlanetSurveyCard: vi.fn(), openPanelId: () => 'shipyard', fillCharters: vi.fn(), toast,
    currentShipVisualState: () => SHIP, readArc3Engineering, SCENE_ENGINEERING_ADDRESS_RESOLVER, readArc2Loot, readArc2EngineeringLoadout,
    arc2LootLegacyMirrorMatches, verifyArc3CommittedAction, projectEngineeringPanelReadModel,
    runFabricationBatchV1, engineeringCommittedCopy,
  };
  const transformed = transformSync('main-d16-craft.ts', input.sections ?? SECTIONS());
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  const main = new Function('env', `with (env) { ${transformed.code}; return {
    controller: engineeringPanelController, refresh: refreshEngineeringPanelState }; }`)(env) as {
    controller: EngineeringPanelController; refresh: () => void };
  main.refresh();
  main.controller.registration().onOpen();
  return { dom, env, main, toast, body: dom.window.document.querySelector('[data-engineering-panel-body]') as HTMLElement };
}

/** Waits until the runner has settled: the toast (or a refusal toast) is its last act. */
async function settle(env: Record<string, unknown>): Promise<void> {
  const toast = env.toast as ReturnType<typeof vi.fn>, calls = toast.mock.calls.length;
  for (let i = 0; i < 2000 && toast.mock.calls.length === calls; i++) await new Promise((r) => setTimeout(r, 0));
  if (toast.mock.calls.length === calls) throw new Error('the engineering runner never settled');
}

async function durablePlates(backend: ReturnType<typeof createMemoryBackend>): Promise<{ plates: number; iron: number; crafts: number; receipts: number }> {
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(loaded.kind);
  const loot = readArc2Loot(loaded.extensions);
  if (loot.kind !== 'loaded' || loot.state.kind !== 'inventory') throw new Error('arc2 carrier');
  const plates = loot.state.stackableCounts.find((row) => row.baseId === 'plate')?.count ?? 0;
  const iron = (loaded.state.cargo.find(([id]) => id === 'Fe')?.[1] ?? 0) as number;
  return { plates, iron, crafts: loaded.state.stats.crafts ?? 0, receipts: (await backend.keys('receipts')).length };
}

const batchButton = (body: HTMLElement) => body.querySelector<HTMLButtonElement>('[data-recipe-id="plate"] [data-engineering-action="fabricate"][data-action-repeat="5"]');

describe('D16 craft ×5 — the real button, durable receipts, reboot', () => {
  it('offers ×5 only for stackable parts/components (v1: part/comp), never gear or a permanent system', () => {
    expect(fabricationBatchOffered({ category: 'part', outputKind: 'stackable' })).toBe(true);
    expect(fabricationBatchOffered({ category: 'comp', outputKind: 'stackable' })).toBe(true);
    expect(fabricationBatchOffered({ category: 'gear', outputKind: 'gear-instance' })).toBe(false);
    expect(fabricationBatchOffered({ category: 'sys', outputKind: 'permanent-system' })).toBe(false);
  });

  it('one press crafts five plates as five receipts, survives two reads and a reboot, and a second press stops at the shortage', async () => {
    const nav = marsSurface();
    const save = fixtureSave(4 * 7); // seven plates' worth of iron
    const booted = await boot(save, fixtureExtensions(save, nav));
    const before = await durablePlates(booted.backend);
    const view = mount({ save, booted, nav });
    const x5 = batchButton(view.body);
    expect(x5, 'the real model must render ×5 for the Iron Plate').not.toBeNull();
    expect(x5!.disabled).toBe(false);
    x5!.click();
    await settle(view.env);
    const after = await durablePlates(booted.backend);
    expect(after.plates - before.plates).toBe(5);
    expect(before.iron - after.iron).toBe(20);
    expect(after.receipts - before.receipts).toBe(5);
    expect(await durablePlates(booted.backend)).toEqual(after); // a second read is identical
    expect(view.toast).toHaveBeenLastCalledWith('Engineering committed', 'Fabricated ×5. Each one is its own durable record.', true);

    // reboot a fresh runtime from the durable save: the panel reads the committed carrier and still offers ×5 (8 iron left)
    await booted.runtime.release(); // the first document closes
    const reloaded = await readSaveV5(booted.backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(reloaded.kind);
    const rebooted = await boot(reloaded.state, reloaded.extensions, booted.backend, false);
    const view2 = mount({ save: reloaded.state, booted: rebooted, nav });
    const again = batchButton(view2.body);
    expect(again?.disabled).toBe(false);
    again!.click();
    await settle(view2.env);
    const final = await durablePlates(booted.backend);
    expect(final.plates - after.plates).toBe(2); // v1: `while(n5<5 && _canCraft(it5))` — stops when the iron runs out
    expect(final.iron).toBe(0);
    expect(view2.toast).toHaveBeenLastCalledWith('Engineering committed', 'Fabricated ×2. Each one is its own durable record.', true);
    // the model now refuses: no iron, so the ×5 press is disabled
    expect(batchButton(view2.body)?.disabled).toBe(true);
    view.dom.window.close(); view2.dom.window.close();
  });

  it('the single Fabricate press still crafts exactly one (the ×5 did not change the ordinary path)', async () => {
    const nav = marsSurface();
    const save = fixtureSave(40);
    const booted = await boot(save, fixtureExtensions(save, nav));
    const view = mount({ save, booted, nav });
    view.body.querySelector<HTMLButtonElement>('[data-recipe-id="plate"] [data-engineering-action="fabricate"]:not([data-action-repeat])')!.click();
    await settle(view.env);
    expect((await durablePlates(booted.backend)).plates).toBe(1);
    view.dom.window.close();
  });

  it('negative control: a batch helper that ignores repeat crafts one, and the durable read-back catches it', async () => {
    const nav = marsSurface();
    const save = fixtureSave(40);
    const booted = await boot(save, fixtureExtensions(save, nav));
    const mutated = SECTIONS().replace('    repeat,\n    fabricate: () => fabricateFixedEngineeringRecipe(baseId),', '    repeat: 1,\n    fabricate: () => fabricateFixedEngineeringRecipe(baseId),');
    expect(mutated).not.toBe(SECTIONS());
    const view = mount({ save, booted, nav, sections: mutated });
    batchButton(view.body)!.click();
    await settle(view.env);
    expect((await durablePlates(booted.backend)).plates).toBe(1); // ≠ 5: the outcome assertion above would fail
    view.dom.window.close();
  });

  it('negative control: without the ×5 branch in the runner the press is an ordinary single craft', async () => {
    const nav = marsSurface();
    const save = fixtureSave(40);
    const booted = await boot(save, fixtureExtensions(save, nav));
    const needle = 'await (request.repeat === undefined ? fabricateFixedEngineeringRecipe(request.id) : fabricateEngineeringBatch(request.id, request.repeat))';
    expect(SECTIONS().split(needle)).toHaveLength(2);
    const view = mount({ save, booted, nav, sections: SECTIONS().replace(needle, 'await fabricateFixedEngineeringRecipe(request.id)') });
    batchButton(view.body)!.click();
    await settle(view.env);
    expect((await durablePlates(booted.backend)).plates).toBe(1);
    view.dom.window.close();
  });
});

describe('runFabricationBatchV1 — stop rules', () => {
  const ok = (n: number) => ({ kind: 'committed' as const, detail: `revision:${n}` });
  it('stops at the first refusal and reports the last commit; a converging outcome is returned as-is; a lone refusal stays a refusal', async () => {
    let n = 0;
    const two = await runFabricationBatchV1({ repeat: 5, fabricate: async () => (++n <= 2 ? ok(n) : { kind: 'refused' as const, detail: 'short' }), converges: () => false, released: () => false });
    expect(two).toMatchObject({ committed: 2, outcome: { kind: 'committed', detail: 'fabricated-batch:2' } });
    expect(n).toBe(3);
    n = 0;
    const stale = await runFabricationBatchV1({ repeat: 5, fabricate: async () => (++n <= 1 ? ok(n) : { kind: 'refused' as const, detail: 'stale' }), converges: (o) => o.detail === 'stale', released: () => false });
    expect(stale.outcome).toMatchObject({ kind: 'refused', detail: 'stale' });
    const none = await runFabricationBatchV1({ repeat: 5, fabricate: async () => ({ kind: 'refused' as const, detail: 'short' }), converges: () => false, released: () => false });
    expect(none).toMatchObject({ committed: 0, outcome: { kind: 'refused', detail: 'short' } });
    n = 0;
    const released = await runFabricationBatchV1({ repeat: 5, fabricate: async () => ok(++n), converges: () => false, released: () => n >= 2 });
    expect(released.committed).toBe(2);
    expect(engineeringCommittedCopy('revision:3')).toBe('The durable expedition record now reflects this action.');
  });
});
