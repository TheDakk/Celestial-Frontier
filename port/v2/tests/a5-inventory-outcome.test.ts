/* A5 gap #13 (INVENTORY.md rows #72-74): the Inventory transaction in the
 * browser-free battery — Equip, Unequip and confirmed Salvage as UI OUTCOMES.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. The inline main.ts
 * transaction (commitArc2InventoryAction) was proven only in the browser
 * (slicesmoke / Glass), so a develop-lane regression went unseen until the
 * full chain ran. Here the exact shipped main.ts sections are sliced,
 * type-stripped and executed with an injected env: the Main
 * `inventoryPanelController` construction (the real InventoryPanelController
 * wired to commitArc2InventoryAction and the Confirm-salvage setting),
 * publishArc2ProductFields and commitArc2InventoryAction. The panel and sheet
 * shells are index.html's exact markup (asserted verbatim below). The test
 * opens the panel, presses the exact item row and the sheet's
 * `[data-inventory-action]` controls, reads the COMMITTED v5 save and the
 * Arc 2 carrier back from a real memory backend after each press, and reboots
 * a fresh F4 runtime from it.
 *
 * Stubbed externals: the panel registry (registerPanel), the heartbeat
 * settle, the reload scheduler and the progression refresh queue (asserted). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V4_PRIMARY_KEY,
  arc2LootLegacyMirrorMatches,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc2LootInventoryWrite,
  prepareArc2LootLegacyMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc2Loot,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { planArc2InventoryAction, projectArc2LegacyAction } from '../apps/game/src/inventory-actions.js';
import { InventoryPanelController } from '../apps/game/src/inventory-panel.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const INDEX_HTML = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'index.html'), 'utf8');
const NOW = 1_753_900_080_000;

interface TestWindow extends Window { readonly Element: typeof Element; close(): void }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

function exactSection(source: string, start: string, end: string, inclusive = false): string {
  const startCount = source.split(start).length - 1;
  const endCount = source.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`inventory section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = source.indexOf(start);
  const right = source.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`inventory section is missing: ${start}`);
  return source.slice(left, inclusive ? right + end.length : right);
}

/* index.html's exact Inventory panel + sheet shells */
const INVENTORY_SHELL = exactSection(INDEX_HTML, '<aside id="inventorypanel"', '  <script type="module" src="/src/main.ts"></script>');

const MAIN_INVENTORY_SOURCE = [
  exactSection(MAIN_SOURCE,
    'const inventoryPanelController = new InventoryPanelController({',
    'registerPanel(inventoryPanelController.registration());\n', true),
  exactSection(MAIN_SOURCE, 'function publishArc2ProductFields(', '\ntype Arc3AppActionOperation'),
].join('\n');

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main inventory source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

function executableMainInventory(env: Record<string, unknown>, mutations: readonly MainMutation[]): { controller: () => InventoryPanelController } {
  const source = mutations.reduce(replaceExact, MAIN_INVENTORY_SOURCE);
  const transformed = transformSync('main-inventory.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return { controller: () => inventoryPanelController }; }`)(env) as { controller: () => InventoryPanelController };
}

/* ---------------- durable fixtures: one legacy Mining Rig, migrated to an exact instance ---------------- */

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
}

async function freshFixture(items: SaveStateV2['items'] = [['rig1', 1]]): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const state: SaveStateV2 = { ...imported.state, items, equip: {}, equipAff: {}, salvageConfirm: true };
  const arc2 = prepareArc2LootLegacyMigration({
    extensions: {}, legacy: { items: state.items, equip: state.equip, equipAff: state.equipAff }, capacity: 6,
  });
  if (arc2.kind !== 'prepared') throw new Error(`Arc 2 fixture was ${arc2.kind}`);
  const f4 = prepareF4AuthorityUpdate(arc2.extensions, { activePlayMs: 0 }, createSessionRNG(0).state());
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(`inventory fixture was ${migrated.kind}`);
  await backend.apply(initial.operations);
  return bootFromDurableSave(backend, 'first');
}

async function bootFromDurableSave(backend: StorageBackend, tag: string): Promise<DurableFixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`inventory boot read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`inventory boot F4 authority was ${authority.kind}`);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: `a5-inventory-${tag}-tab`, token: `a5-inventory-${tag}-document`,
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`inventory lease was ${heartbeat.kind}`);
  return { backend, repository, runtime, state: saved.state };
}

function carrier(extensions: V5Extensions) {
  const loot = readArc2Loot(extensions);
  if (loot.kind !== 'loaded' || loot.state.kind !== 'inventory') throw new Error(`Arc 2 carrier was ${loot.kind}`);
  return loot.state;
}

async function durable(f: DurableFixture) {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return { state: saved.state, loot: carrier(saved.extensions), revision: await f.repository.revision() };
}

/* ---------------- the Main harness ---------------- */

function mainInventoryHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <button id="dockinventory"></button><button id="railinventory"></button>
    ${INVENTORY_SHELL}</body></html>`);
  const document = dom.window.document;
  const g = globalThis as Record<string, unknown>, w = dom.window as unknown as Record<string, unknown>;
  const DOM_GLOBALS = ['Element', 'HTMLElement', 'HTMLButtonElement', 'HTMLInputElement', 'Event', 'KeyboardEvent', 'Node'] as const;
  const prior = DOM_GLOBALS.map((key) => [key, g[key]] as const);
  for (const key of DOM_GLOBALS) g[key] = w[key];
  const scheduleReload = vi.fn();
  const queueProgressionRefresh = vi.fn();
  const registrations: Array<{ onOpen: () => void }> = [];
  const env: Record<string, unknown> & { save: SaveStateV2; activePersist: unknown; productActionInFlight: boolean; arc2LootState: unknown } = {
    document,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    save: f.state,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => {
      if (runtime === null) return false;
      const diagnostics = runtime.diagnostics();
      return diagnostics.leaseOwned && !diagnostics.staleBlocked;
    },
    arc2LootState: carrier(f.runtime.extensions),
    arc2LootProtection: null,
    lastArc2LootOutcome: null,
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    activePersist: null,
    smokeForceReadOnly: false,
    importWriteInFlight: false,
    replacementTransaction: null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    productActionCoordinator: createProductActionCoordinator(),
    productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined,
    InventoryPanelController,
    planArc2InventoryAction, projectArc2LegacyAction,
    readArc2Loot, prepareArc2LootInventoryWrite, arc2LootLegacyMirrorMatches,
    registerPanel: (registration: { onOpen: () => void }) => { registrations.push(registration); },
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    queueArc9ProgressionRefresh: queueProgressionRefresh,
  };
  const exec = executableMainInventory(env, mutations);
  // boot publishes the carrier, then the player opens the panel
  exec.controller().setState(env.arc2LootState as never);
  registrations[0]!.onOpen();
  const row = () => document.querySelector<HTMLButtonElement>('[data-inventory-row="exact"]');
  const action = (operation: string) => document.querySelector<HTMLButtonElement>(`#inventorysheet [data-inventory-action="${operation}"]`);
  const restore = () => {
    exec.controller().dispose();
    for (const [key, value] of prior) { if (value === undefined) delete g[key]; else g[key] = value; }
    dom.window.close();
  };
  return { dom, env, exec, row, action, scheduleReload, queueProgressionRefresh, restore };
}
type Harness = ReturnType<typeof mainInventoryHarness>;

async function settled(h: Harness): Promise<void> {
  for (let turn = 0; turn < 5_000; turn++) {
    if (!h.env.productActionInFlight && h.env.activePersist === null) {
      for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('inventory press never settled');
}

async function pressAction(h: Harness, operation: string): Promise<void> {
  if (h.action(operation) === null) {
    const row = h.row();
    if (row === null) throw new Error('inventory: no exact item row is rendered');
    row.click(); // open the exact item's sheet
  }
  const control = h.action(operation);
  if (control === null) throw new Error(`inventory: the sheet offers no ${operation} action`);
  control.click();
  await settled(h);
}

async function inventoryScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  const harnesses: Harness[] = [];
  try {
    const h = mainInventoryHarness(f, mutations);
    harnesses.push(h);
    const start = await durable(f);
    expect(start.loot.inventory.entries, 'one exact migrated Mining Rig').toHaveLength(1);
    const instanceId = start.loot.inventory.entries[0]!.instance.instanceId;
    expect(h.row()?.dataset.instanceId).toBe(instanceId);

    // (1) Equip
    await pressAction(h, 'equip');
    let after = await durable(f);
    expect(after.revision, 'inventory: Equip must commit exactly one revision').toBe(start.revision + 1);
    expect(after.loot.inventory.equipped.map((row) => row.instanceId), 'inventory: the exact instance is durably equipped')
      .toEqual([instanceId]);
    expect(Object.values(after.state.equip), 'the legacy equip mirror agrees').toEqual(['rig1']);
    expect(JSON.stringify(h.env.save.equip), 'inventory: the live equip mirror equals the durable one')
      .toBe(JSON.stringify(after.state.equip));
    expect(h.row()?.dataset.equipped).toBe('true');

    // (2) Unequip
    await pressAction(h, 'unequip');
    after = await durable(f);
    expect(after.revision).toBe(start.revision + 2);
    expect(after.loot.inventory.equipped, 'inventory: Unequip durably frees the slot').toEqual([]);
    expect(after.state.equip).toEqual({});

    // (3) Salvage asks to confirm first (Confirm salvage is on), then destroys the exact instance once
    await pressAction(h, 'salvage');
    expect((await durable(f)).revision, 'inventory: the first Salvage tap only asks to confirm').toBe(start.revision + 2);
    expect(h.action('salvage')?.dataset.confirmation).toBe('required');
    h.action('salvage')!.click();
    await settled(h);
    after = await durable(f);
    expect(after.revision, 'inventory: the confirmed Salvage commits exactly one revision').toBe(start.revision + 3);
    expect(after.loot.inventory.entries, 'inventory: Salvage durably removes the exact instance').toEqual([]);
    expect(after.state.items).toEqual([]);
    expect(JSON.stringify(h.env.save.items), 'inventory: the live items equal the durable items').toBe(JSON.stringify(after.state.items));
    expect(JSON.stringify(h.env.save.cargo), 'inventory: the salvage return is published').toBe(JSON.stringify(after.state.cargo));
    expect(h.row(), 'the salvaged row is gone').toBeNull();
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.queueProgressionRefresh.mock.calls.map((call) => call[0]))
      .toEqual(['arc2.equip', 'arc2.unequip', 'arc2.salvage']);

    // (4) reboot: the carrier and mirrors are what storage says
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'reloaded');
    const reloaded = mainInventoryHarness(f, mutations);
    harnesses.push(reloaded);
    expect(carrier(f.runtime.extensions).inventory.entries).toEqual([]);
    expect(reloaded.row()).toBeNull();
    expect(JSON.stringify(f.state.cargo)).toBe(JSON.stringify(after.state.cargo));
  } finally {
    for (const h of [...harnesses].reverse()) h.restore();
    await f.runtime.release();
  }
}

/* A5 #73 (2026-09-25): v1's explorer-doll slot picker is the Inventory panel's slot <select> in v2 (no doll was ported): pick a slot,
 * the list narrows to that slot's exact items, and Equip from it lands in THAT slot durably. Mutation control: a picker that ignores the
 * choice leaves both rows listed, so the first row (the Mining Rig, tool slot) would be equipped instead. */
async function slotPickerScenario(mutations: readonly MainMutation[] = [], deliverPick = true): Promise<void> {
  const f = await freshFixture([['rig1', 1], ['fieldsuit', 1]]);
  const h = mainInventoryHarness(f, mutations);
  try {
    const start = await durable(f);
    expect(start.loot.inventory.entries, 'two exact items in two slots').toHaveLength(2);
    const rows = () => [...h.dom.window.document.querySelectorAll<HTMLButtonElement>('[data-inventory-row="exact"]')];
    expect(rows()).toHaveLength(2);
    const picker = h.dom.window.document.querySelector<HTMLSelectElement>('[data-inventory-slot]');
    expect(picker, 'the Inventory panel renders its slot picker').not.toBeNull();
    picker!.value = 'suit';
    if (deliverPick) {
      picker!.dispatchEvent(new (h.dom.window as unknown as { Event: typeof Event }).Event('change', { bubbles: true }));
      picker!.dispatchEvent(new (h.dom.window as unknown as { Event: typeof Event }).Event('input', { bubbles: true }));
    }
    expect(rows(), 'inventory #73: the picked slot lists only its exact items').toHaveLength(1);
    await pressAction(h, 'equip');
    const after = await durable(f);
    expect(after.revision, 'inventory #73: Equip from the picked slot commits one revision').toBe(start.revision + 1);
    const suit = start.loot.inventory.entries.find((e) => e.instance.baseId === 'fieldsuit')!.instance.instanceId;
    expect(after.loot.inventory.equipped.map((row) => row.instanceId), 'inventory #73: the PICKED slot\'s item is durably equipped').toEqual([suit]);
    expect(Object.values(after.state.equip), 'the legacy mirror names the suit').toEqual(['fieldsuit']);
    expect(JSON.stringify(h.env.save.equip)).toBe(JSON.stringify(after.state.equip));
  } finally {
    h.restore();
    await f.runtime.release();
  }
}

describe('A5 #73 — the slot picker (v1 explorer doll) as a durable UI outcome', () => {
  it('picking the suit slot narrows the list and Equip lands the suit durably', async () => {
    await slotPickerScenario();
  }, 30_000);
  it('negative control — a picker whose choice never reaches the panel: the list is not narrowed and the outcome test fails', async () => {
    await expect(slotPickerScenario([], false)).rejects.toThrow(/inventory #73: the picked slot lists only its exact items/u);
  }, 30_000);
});

describe('A5 #72-74 — the Inventory transaction as browser-free UI outcomes', () => {
  it('Equip, Unequip and a confirmed Salvage each commit exactly once through the real panel, publish the durable mirrors, and survive reboot', async () => {
    await inventoryScenario();
  }, 30_000);

  it('the harness shells are index.html\'s exact Inventory markup', () => {
    expect(INVENTORY_SHELL).toContain('<div class="inventory-panel-body" data-inventory-panel-body></div>');
    expect(INVENTORY_SHELL).toContain('<div data-inventory-sheet-body></div>');
    expect(MAIN_INVENTORY_SOURCE).toContain('  onAction: ({ operation, instanceId }) => commitArc2InventoryAction(operation, instanceId),');
  });

  const MUTANTS: ReadonlyArray<Readonly<{ mutation: MainMutation; failsWith: RegExp }>> = [
    {
      mutation: {
        name: 'UNWIRED: the panel adapter never reaches the transaction',
        needle: '  onAction: ({ operation, instanceId }) => commitArc2InventoryAction(operation, instanceId),',
        replacement: "  onAction: async ({ operation, instanceId }) => ({ kind: 'unavailable', operation, instanceId, detail: 'mutant', state: null }),",
      },
      failsWith: /inventory: Equip must commit exactly one revision/u,
    },
    {
      mutation: {
        name: 'UNPUBLISHED: the committed mirrors never reach the live save',
        needle: '      publishArc2ProductFields(save, outcome.state);',
        replacement: '      void outcome.state;',
      },
      failsWith: /inventory: the live equip mirror equals the durable one/u,
    },
    {
      mutation: {
        name: 'NO CONFIRMATION: Salvage ignores the Confirm salvage setting',
        needle: '  requiresSalvageConfirmation: () => save.salvageConfirm,',
        replacement: '  requiresSalvageConfirmation: () => false,',
      },
      failsWith: /inventory: the first Salvage tap only asks to confirm/u,
    },
  ];

  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      expect(() => replaceExact(MAIN_INVENTORY_SOURCE, mutation)).not.toThrow();
      await expect(inventoryScenario([mutation])).rejects.toThrow(failsWith);
    }, 30_000);
  }
});
