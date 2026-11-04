/* D16 parity — Salvage all junk (v1 `data-salvall`, `_junkItems`, the armed two-tap) and the salvage dialog's "don't ask
 * again" (v1 `data-salvoff`) — INVENTORY rows #75/#76 — UI OUTCOME test.
 *
 * The exact shipped Main sections run type-stripped over a real F4 runtime + memory backend: the InventoryPanelController
 * construction (with the save-bound `requiresSalvageConfirmation` and `disableSalvageConfirmation`), publishArc2ProductFields
 * and commitArc2InventoryAction. The test presses the rendered controls, then reads the committed Arc 2 carrier and the save
 * back (twice) and reboots from them. `persistView` is the real checkpoint write (the live save through the runtime's commit). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import {
  arc2LootLegacyMirrorMatches,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  initializeFreshV5,
  prepareArc2LootInventoryWrite,
  prepareArc2LootLegacyMigration,
  readArc2Loot,
  readF4Authority,
  readSaveV5,
  type Arc2LootStateV1,
  type ContentRegistry,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { planArc2InventoryAction, projectArc2LegacyAction } from '../apps/game/src/inventory-actions.js';
import { InventoryPanelController, salvageAllCandidatesV1 } from '../apps/game/src/inventory-panel.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void; MutationObserver: typeof MutationObserver } } };

function section(start: string, end: string): string {
  const s = MAIN.split(start).length - 1;
  if (s !== 1) throw new Error(`anchor must be unique (${s}): ${start}`);
  const left = MAIN.indexOf(start), right = MAIN.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`section missing: ${start}`);
  return MAIN.slice(left, right);
}
const SECTIONS = (): string => [
  section('const inventoryPanelController = new InventoryPanelController({', '\nregisterPanel(inventoryPanelController.registration());'),
  section('function publishArc2ProductFields(', '\nasync function commitArc2InventoryAction('),
  section('async function commitArc2InventoryAction(', '\ntype Arc3AppActionOperation ='),
].join('\n');

/* one EQUIPPED rig1, one spare rig1 (Uncommon), one headlamp (Uncommon), one rig2 (tier 3): junk = the spare rig1 + headlamp */
async function fixture(salvageConfirm: boolean) {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const save = imported.state;
  save.items = [['headlamp', 1], ['rig1', 2], ['rig2', 1]];
  save.equip = { tool: 'rig1' };
  save.salvageConfirm = salvageConfirm;
  const loot = prepareArc2LootLegacyMigration({ extensions: {}, legacy: { items: save.items, equip: save.equip, equipAff: {} }, capacity: 32 });
  if (loot.kind !== 'prepared') throw new Error(loot.kind);
  const backend = createMemoryBackend();
  const initialized = await initializeFreshV5(backend, { state: save, extensions: loot.extensions }, REGISTRY, NOW);
  if (initialized.kind !== 'initialized') throw new Error(initialized.kind);
  return { save, backend, runtime: await runtimeFor(backend, initialized.revision, loot.extensions, null, save, 'a') };
}

async function runtimeFor(backend: ReturnType<typeof createMemoryBackend>, revision: number, extensions: V5Extensions,
  restored: Parameters<typeof createF4RuntimeAuthority>[0]['restoredAuthority'], save: SaveStateV2, tag: string) {
  const runtime = createF4RuntimeAuthority({
    backend, repository: createRevisionedRepository(backend), registry: REGISTRY, initialRevision: revision, initialExtensions: extensions,
    ...(restored === null ? {} : { initialState: save }), restoredAuthority: restored, freshSessionSeed: 0xD1605,
    ownerId: `d16-salvage-${tag}`, token: `d16-salvage-${tag}`, leaseTtlMs: 10_000, now: () => (tag === 'a' ? 100 : 1_000_000), visible: true, answerable: true,
  });
  await expect(runtime.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
  if (restored === null) await expect(runtime.commit(save, NOW)).resolves.toMatchObject({ kind: 'committed' });
  return runtime;
}

function inventoryState(extensions: V5Extensions): Arc2LootStateV1 {
  const loot = readArc2Loot(extensions);
  if (loot.kind !== 'loaded') throw new Error(loot.kind);
  return loot.state;
}

function mount(f: Awaited<ReturnType<typeof fixture>>, sections = SECTIONS()) {
  const dom = new JSDOM(`<!doctype html><html><body><button id="dockinventory">Inventory</button><button id="railinventory">Inventory</button>
    <aside id="inventorypanel"><div data-inventory-panel-body></div></aside>
    <div id="inventorysheet" role="dialog" aria-modal="true" aria-labelledby="inventorysheettitle" hidden><section>
    <button type="button" data-inventory-sheet-close>✕</button><h2 id="inventorysheettitle">Item inspection</h2><div data-inventory-sheet-body></div></section></div></body></html>`);
  const env: Record<string, unknown> = {
    document: dom.window.document, InventoryPanelController, performance, Date,
    f4Runtime: f.runtime, save: f.save, arc2LootState: inventoryState(f.runtime.extensions), arc2LootProtection: null,
    smokeForceReadOnly: false, f4RuntimeMayMutate: (r: unknown) => r === f.runtime,
    activePersist: null, importWriteInFlight: false, replacementTransaction: null, replacementReloadPending: false, trainingCheckpointWriteHeld: false,
    productActionCoordinator: createProductActionCoordinator(), productActionInFlight: false, smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined, lastArc2LootOutcome: null, f4LastCheckpointAt: 0, lastPersistenceOutcome: null,
    scheduleF4AuthorityConvergenceReload: vi.fn(), queueArc9ProgressionRefresh: vi.fn(),
    planArc2InventoryAction, projectArc2LegacyAction, prepareArc2LootInventoryWrite, readArc2Loot, arc2LootLegacyMirrorMatches,
    persistView: vi.fn(async () => (await f.runtime.commit(f.save, NOW)).kind === 'committed'),
    persistSoon: vi.fn(), // the debounce is not needed here: the salvage's own commit carries the live save
  };
  const transformed = transformSync('main-d16-salvage.ts', sections);
  if (transformed.errors.length) throw new Error(JSON.stringify(transformed.errors));
  const controller = new Function('env', `with (env) { ${transformed.code}; return inventoryPanelController; }`)(env) as InventoryPanelController;
  controller.setState(env.arc2LootState as Arc2LootStateV1);
  controller.registration().onOpen();
  const body = dom.window.document.querySelector('[data-inventory-panel-body]') as HTMLElement;
  return { dom, env, controller, body, doc: dom.window.document };
}

const tick = async (n = 60) => { for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0)); };
async function durable(backend: ReturnType<typeof createMemoryBackend>) {
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(loaded.kind);
  const state = inventoryState(loaded.extensions);
  if (state.kind !== 'inventory') throw new Error(state.kind);
  return { save: loaded.state, extensions: loaded.extensions, bases: state.inventory.entries.map((e) => e.instance.baseId).sort(), equipped: state.inventory.equipped.length };
}
const salvageAll = (body: HTMLElement) => body.querySelector<HTMLButtonElement>('[data-inventory-salvage-all]');

describe('D16 salvage all + "don\'t ask again" — real controls, durable carrier, reboot', () => {
  it('junk = unequipped, unprotected Common/Uncommon gear only (never equipped, favorite, locked, higher tier)', async () => {
    const f = await fixture(true);
    const state = inventoryState(f.runtime.extensions);
    if (state.kind !== 'inventory') throw new Error('fixture');
    const junk = salvageAllCandidatesV1(state).map((id) => state.inventory.entries.find((e) => e.instance.instanceId === id)!.instance.baseId).sort();
    expect(junk).toEqual(['headlamp', 'rig1']);
    const favorite = { ...state, inventory: { ...state.inventory, entries: state.inventory.entries.map((e) => ({ ...e, favorite: e.instance.baseId === 'headlamp' })) } } as Arc2LootStateV1;
    expect(salvageAllCandidatesV1(favorite)).toHaveLength(1);
    const locked = { ...state, inventory: { ...state.inventory, entries: state.inventory.entries.map((e) => ({ ...e, locked: true })) } } as Arc2LootStateV1;
    expect(salvageAllCandidatesV1(locked)).toHaveLength(0);
  });

  it('with Confirm salvage on, the first tap arms and the second salvages both junk pieces as receipts; durable after two reads and a reboot', async () => {
    const f = await fixture(true);
    const before = await durable(f.backend);
    const view = mount(f);
    expect(salvageAll(view.body)?.textContent).toBe('♺ Salvage all Common/Uncommon (2)');
    salvageAll(view.body)!.click();
    await tick();
    expect(salvageAll(view.body)?.dataset.inventorySalvageAll).toBe('armed');
    expect((await durable(f.backend)).bases).toEqual(before.bases); // arming wrote nothing
    salvageAll(view.body)!.click();
    await tick(200);
    const after = await durable(f.backend);
    expect(before.bases).toEqual(['headlamp', 'rig1', 'rig1', 'rig2']);
    expect(after.bases).toEqual(['rig1', 'rig2']);
    expect(after.equipped).toBe(1); // the equipped rig1 is untouched
    expect(after.save.items).toEqual([['rig1', 1], ['rig2', 1]]);
    expect(await durable(f.backend)).toEqual(after);
    expect(view.body.querySelector('[data-inventory-salvage-all-status]')?.textContent).toBe('♺ Salvaged 2 items.');
    expect(salvageAll(view.body)).toBeNull(); // no junk left

    await f.runtime.release();
    const loaded = await readSaveV5(f.backend, REGISTRY, NOW);
    if (loaded.kind !== 'loaded') throw new Error(loaded.kind);
    const authority = readF4Authority(loaded.extensions);
    if (authority.kind !== 'loaded') throw new Error(authority.kind);
    const runtime = await runtimeFor(f.backend, await createRevisionedRepository(f.backend).revision(), loaded.extensions, authority.authority, loaded.state, 'b');
    const view2 = mount({ save: loaded.state, backend: f.backend, runtime });
    expect(salvageAll(view2.body)).toBeNull();
    view.dom.window.close(); view2.dom.window.close();
  });

  it('with Confirm salvage off, one tap salvages at once', async () => {
    const f = await fixture(false);
    const view = mount(f);
    salvageAll(view.body)!.click();
    await tick(200);
    expect((await durable(f.backend)).bases).toEqual(['rig1', 'rig2']);
    view.dom.window.close();
  });

  it('"don\'t ask again" salvages this item AND turns the saved switch off (durable), so the next salvage asks nothing', async () => {
    const f = await fixture(true);
    const view = mount(f);
    const state = inventoryState(f.runtime.extensions);
    if (state.kind !== 'inventory') throw new Error('fixture');
    const headlamp = state.inventory.entries.find((e) => e.instance.baseId === 'headlamp')!.instance.instanceId;
    expect(view.controller.showDetail(headlamp)).toBe(true);
    const salvage = () => view.doc.querySelector<HTMLButtonElement>(`[data-inventory-action="salvage"][data-instance-id="${headlamp}"]`)!;
    salvage().click();
    await tick();
    expect(salvage().dataset.confirmation).toBe('required');
    const off = view.doc.querySelector<HTMLButtonElement>('[data-inventory-salvage-off]');
    expect(off?.textContent).toBe("Salvage — don't ask again");
    off!.click();
    await tick(200);
    const after = await durable(f.backend);
    expect(after.bases).toEqual(['rig1', 'rig1', 'rig2']);
    expect(after.save.salvageConfirm).toBe(false);
    // the spare rig1 now salvages from the list in ONE tap: the switch is off
    salvageAll(view.body)!.click();
    await tick(200);
    expect((await durable(f.backend)).bases).toEqual(['rig1', 'rig2']);
    view.dom.window.close();
  });

  it('negative control: without the Main wiring there is no "don\'t ask again" choice, and the switch stays on', async () => {
    const needle = '  disableSalvageConfirmation: () => { save.salvageConfirm = false; persistSoon(); },\n';
    expect(SECTIONS().split(needle)).toHaveLength(2);
    const f = await fixture(true);
    const view = mount(f, SECTIONS().replace(needle, ''));
    const state = inventoryState(f.runtime.extensions);
    if (state.kind !== 'inventory') throw new Error('fixture');
    const id = state.inventory.entries.find((e) => e.instance.baseId === 'headlamp')!.instance.instanceId;
    view.controller.showDetail(id);
    view.doc.querySelector<HTMLButtonElement>(`[data-inventory-action="salvage"][data-instance-id="${id}"]`)!.click();
    await tick();
    expect(view.doc.querySelector('[data-inventory-salvage-off]')).toBeNull();
    expect((await durable(f.backend)).save.salvageConfirm).toBe(true);
    view.dom.window.close();
  });

  it('negative control: a controller that ignores Confirm salvage salvages on the first tap (the armed assertion catches it)', async () => {
    const needle = '  requiresSalvageConfirmation: () => save.salvageConfirm,';
    const f = await fixture(true);
    const view = mount(f, SECTIONS().replace(needle, '  requiresSalvageConfirmation: () => false,'));
    salvageAll(view.body)!.click();
    await tick(200);
    expect(salvageAll(view.body)?.dataset.inventorySalvageAll).not.toBe('armed');
    expect((await durable(f.backend)).bases).toEqual(['rig1', 'rig2']);
    view.dom.window.close();
  });
});
