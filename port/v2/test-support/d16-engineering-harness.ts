/* Shared harness for the D16 parity outcome tests that drive the real Shipyard (EngineeringPanelController) through the exact
 * shipped Main sections over a real F4 runtime + memory backend. See tests/d16-craft-batch-outcome.test.ts for the pattern. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { expect, vi } from 'vitest';
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
import { EngineeringPanelController } from '../apps/game/src/engineering-panel.js';
import { projectEngineeringPanelReadModel } from '../apps/game/src/engineering-panel-model.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { engineeringCommittedCopy, runFabricationBatchV1 } from '../apps/game/src/fabrication-batch.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';
import { RecipePinChipV1, projectRecipePinChipV1, sanitizeRecipePinV1 } from '../apps/game/src/recipe-pin.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
export const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
export const NOW = 1_753_900_060_000;
const MARS = { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 134 } };
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };

export function section(start: string, end: string): string {
  const s = MAIN_SOURCE.split(start).length - 1, e = MAIN_SOURCE.split(end).length - 1;
  if (s !== 1 || e < 1) throw new Error(`Main section anchors must be unique (${s}/${e}): ${start}`);
  const left = MAIN_SOURCE.indexOf(start), right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`Main section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}
/** The Shipyard sections every D16 engineering harness executes (the controller construction wires the pin port). */
export const ENGINEERING_SECTIONS = (): string => [
  section('function refreshRecipePinChip(): void {', '\n/** The Fabricator\'s ×5 (D16 parity)'),
  section('const engineeringPanelController = new EngineeringPanelController({', '\nlet engineeringPanelReleased'),
  section('function refreshEngineeringPanelState(): void {', '\nfunction updateChips(): void {'),
  section('async function fabricateEngineeringBatch(', '\n/* Friendly duel (v1.8.9 parity'), // ends at the next top-level block (the §20 friendly duel, merged 2026-09-25)
  section('async function commitArc3EngineeringAction(', '\nasync function mineCurrentSurface('),
  section('async function fabricateFixedEngineeringRecipe(', '\ntype Arc5FeedCommitOutcome'),
  section('function engineeringOutcomeConverges(', '\nasync function smokeCommitF4Outcome('),
].join('\n');

export const SHIP: ShipVisualState = Object.freeze({
  chassisStage: 0, hardpoints: Object.freeze({ array: false, autoext: false, cscoop: false }),
  installedSystemIds: Object.freeze([]), liverySeed: 0x5111, provenance: 'owned-items',
}) as unknown as ShipVisualState;

export function marsSurface(): SurfaceNav {
  const address = resolveCF1WorldAddress(MARS);
  if (!address.ok) throw new Error(address.reason);
  const result = navFromCanonicalCF1Address(address.address);
  if (!result.ok || result.state.mode !== 'surface') throw new Error('surface fixture failed');
  return result.state;
}

export function fixtureSave(iron: number): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  imported.state.cargo = [['Fe', iron]];
  imported.state.cgx = [['Fe', 0]];
  return imported.state;
}

export function fixtureExtensions(save: SaveStateV2, nav: SurfaceNav): V5Extensions {
  const loot = prepareArc2LootLegacyMigration({ extensions: {}, legacy: { items: [], equip: {}, equipAff: {} }, capacity: 32 });
  if (loot.kind !== 'prepared') throw new Error(loot.kind);
  const engineering = prepareArc3AppBootstrap({ extensions: loot.extensions, save, sources: Object.freeze({ current: nav, saved: null, atlas: Object.freeze([]) }) });
  if (engineering.kind !== 'prepared') throw new Error(engineering.kind);
  return engineering.extensions;
}

export async function boot(save: SaveStateV2, extensions: V5Extensions, backend = createMemoryBackend(), fresh = true) {
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

export type Booted = Awaited<ReturnType<typeof boot>>;
/** `persistView` is the real checkpoint write the Main settings/view controls call: the live save through the runtime's commit. */
export function mount(input: Readonly<{ save: SaveStateV2; booted: Booted; nav: SurfaceNav; sections?: string; persist?: boolean; extraEnv?: Record<string, unknown> }>) {
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
    RecipePinChipV1, projectRecipePinChipV1, sanitizeRecipePinV1, recipePinChip: null, openPanel: vi.fn(() => true),
    persistView: vi.fn(async () => (input.persist ?? true) && (await input.booted.runtime.commit(input.save, NOW)).kind === 'committed'),
    ...(input.extraEnv ?? {}),
  };
  const transformed = transformSync('main-d16-craft.ts', input.sections ?? ENGINEERING_SECTIONS());
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  const main = new Function('env', `with (env) { ${transformed.code}; return {
    controller: engineeringPanelController, refresh: refreshEngineeringPanelState, refreshPin: refreshRecipePinChip }; }`)(env) as {
    controller: EngineeringPanelController; refresh: () => void; refreshPin: () => void };
  main.refresh();
  main.controller.registration().onOpen();
  return { dom, env, main, toast, body: dom.window.document.querySelector('[data-engineering-panel-body]') as HTMLElement };
}

/** Waits until the runner has settled: the toast (or a refusal toast) is its last act. */

/** Waits until `condition` holds (a durable write settles over several awaits). */
export async function until(condition: () => boolean, turns = 2000): Promise<void> {
  for (let i = 0; i < turns && !condition(); i++) await new Promise((r) => setTimeout(r, 0));
  if (!condition()) throw new Error('harness condition never held');
}

export async function durableState(backend: ReturnType<typeof createMemoryBackend>): Promise<SaveStateV2> {
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(loaded.kind);
  return loaded.state;
}

/** Reboot a fresh document from the durable save (the old one releases its lease first). */
export async function reboot(booted: Booted): Promise<{ state: SaveStateV2; booted: Booted }> {
  await booted.runtime.release();
  await durableState(booted.backend); // the durable read must succeed before the reload
  const loaded = await readSaveV5(booted.backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(loaded.kind);
  return { state: loaded.state, booted: await boot(loaded.state, loaded.extensions, booted.backend, false) };
}
