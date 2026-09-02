import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LOOT_CATALOGUE_V1,
  claimPendingGear,
  compareGear,
  createGearInstance,
  createGearInventory,
  equipGear,
  FIXED_RECIPE_AUTHORITY,
  getFixedCraftGenerationPlan,
  grantGear,
  makeGearSourceActionId,
  salvageGear,
  setGearProtection,
  type GearInstance,
  type GearInventory,
} from '@cf/domain-loot';
import {
  ARC2_LOOT_LEGACY_SOURCE_ACTION_ID,
  type Arc2LootStateV1,
} from '@cf/persistence';
import {
  INVENTORY_PAGE_SIZE,
  InventoryPanelController,
  inventoryComparisonDomComplete,
  inventoryPanelPage,
  type InventoryPanelActionOutcome,
} from '../apps/game/src/inventory-panel.js';

interface TestWindow extends Window {
  readonly Event: typeof Event;
  readonly KeyboardEvent: typeof KeyboardEvent;
  close(): void;
}
interface TestDom { window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const here = path.dirname(fileURLToPath(import.meta.url));
const sourceActionId = makeGearSourceActionId({
  kind: 'expedition',
  ownerId: 'inventory-panel-fixture',
  actionKey: 'return',
  worldId: 'world:999:424242:133:2',
  missionId: 'mission:panel',
  receiptId: 'receipt:panel',
});

let dom: TestDom | null = null;
let controller: InventoryPanelController | null = null;

function shell(extra = ''): Readonly<{
  document: Document;
  panel: HTMLElement;
  sheet: HTMLElement;
  opener: HTMLButtonElement;
  outside: HTMLButtonElement;
}> {
  dom = new JSDOM(`<!doctype html><html><body>
    <button id="opener">Inventory</button>
    <button id="outside">Outside</button>
    <aside id="inventorypanel" aria-label="Inventory"><div data-inventory-panel-body></div></aside>
    <div id="inventorysheet" role="dialog" aria-modal="true" aria-labelledby="inventorysheettitle"
      aria-hidden="true" data-panel-boundary hidden>
      <section><button data-inventory-sheet-close aria-label="Close item inspection">close</button>
      <h2 id="inventorysheettitle">Item inspection</h2><div data-inventory-sheet-body></div></section>
    </div>${extra}</body></html>`);
  const document = dom.window.document;
  return {
    document,
    panel: document.getElementById('inventorypanel') as HTMLElement,
    sheet: document.getElementById('inventorysheet') as HTMLElement,
    opener: document.getElementById('opener') as HTMLButtonElement,
    outside: document.getElementById('outside') as HTMLButtonElement,
  };
}

function gear(
  ordinal: number,
  baseId = 'rig1',
  options: Readonly<{
    itemLevel?: number;
    quality?: number;
    rarityTier?: number;
    affixes?: GearInstance['naturalAffixes'];
  }> = {},
): GearInstance {
  return createGearInstance(sourceActionId, ordinal, {
    baseId,
    generationSeed: 0xabc000 + ordinal,
    itemLevel: options.itemLevel ?? ordinal + 1,
    quality: options.quality ?? ordinal,
    rarityTier: options.rarityTier ?? 1,
    naturalAffixes: options.affixes ?? [],
    craftedModifier: null,
    drawback: null,
    upgrade: 0,
    sockets: [],
  });
}

function committed(result: Readonly<{ status: string; state?: GearInventory }>): GearInventory {
  if (result.status !== 'committed' || !result.state) throw new Error(`expected committed, got ${result.status}`);
  return result.state;
}

function inventoryOf(items: readonly GearInstance[], capacity = Math.max(1, items.length)): GearInventory {
  let inventory = createGearInventory(capacity);
  for (const item of items) inventory = committed(grantGear(inventory, inventory.revision, item));
  return inventory;
}

function loaded(inventory: GearInventory): Arc2LootStateV1 {
  return Object.freeze({ kind: 'inventory', inventory, stackableCounts: Object.freeze([]) });
}

function deferred<T>(): Readonly<{
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((accept, refuse) => {
    resolve = accept;
    reject = refuse;
  });
  return Object.freeze({ promise, resolve, reject });
}

async function settleAction(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  controller?.dispose();
  controller = null;
  dom?.window.close();
  dom = null;
});

describe('Arc 2 Inventory presentation', () => {
  it('seats ten exact phone-dock controls in two 5×44px rows and one accessible dialog shell', () => {
    const index = fs.readFileSync(path.join(here, '../apps/game/index.html'), 'utf8');
    const main = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');
    const parsed = new JSDOM(index);
    const document = parsed.window.document;
    expect(document.querySelectorAll('#dock > button')).toHaveLength(10);
    expect(document.querySelector('#dockinventory')).toMatchObject({
      id: 'dockinventory',
    });
    expect(document.querySelector('#railinventory')).not.toBeNull();
    expect(document.querySelector('#dockinventory')?.getAttribute('aria-controls')).toBe('inventorypanel');
    expect(document.querySelector('#railinventory')?.getAttribute('aria-controls')).toBe('inventorypanel');
    expect(index).toMatch(/#dock\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(5,\s*44px\);[^}]*grid-auto-rows:\s*44px;/s);
    expect(index).toMatch(/#dock button\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s);
    expect(index).toMatch(/#inventorypanel \.inventory-pager button:disabled\s*\{[^}]*opacity:\s*\.56;/s);
    expect(document.querySelectorAll('#inventorypanel')).toHaveLength(1);
    const sheet = document.querySelector('#inventorysheet');
    expect(document.querySelectorAll('#inventorysheet')).toHaveLength(1);
    expect(sheet?.getAttribute('role')).toBe('dialog');
    expect(sheet?.getAttribute('aria-modal')).toBe('true');
    expect(sheet?.getAttribute('aria-labelledby')).toBe('inventorysheettitle');
    expect(sheet?.querySelectorAll('[data-inventory-sheet-close]')).toHaveLength(1);
    expect(main).toMatch(/new InventoryPanelController\(\{[\s\S]*?deferWhileClosed:\s*true,[\s\S]*?\}\);/);
    parsed.window.close();
  });

  it('keeps each deterministic page at 48 exact rows without collapsing duplicate bases', () => {
    const instances = Array.from({ length: 60 }, (_, index) => gear(index));
    const state = loaded(inventoryOf(instances, 60));
    const first = inventoryPanelPage(state);
    const second = inventoryPanelPage(state, { page: 1 });
    expect(INVENTORY_PAGE_SIZE).toBe(48);
    expect(first.rows).toHaveLength(48);
    expect(second.rows).toHaveLength(12);
    expect([...first.rows, ...second.rows].map((row) => row.kind === 'legacy' ? row.baseId : row.instanceId))
      .toEqual(instances.map((item) => item.instanceId));
    expect(new Set([...first.rows, ...second.rows].map((row) => row.kind === 'legacy' ? row.baseId : row.instanceId)).size)
      .toBe(60);
    expect(inventoryPanelPage(state, { filter: { query: 'Mining Rig I' } }).totalRows).toBe(60);

    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, openers: [view.opener] });
    controller.setState(state);
    expect(view.panel.querySelectorAll('[data-inventory-row="exact"]')).toHaveLength(48);
    const previous = view.panel.querySelector('[data-inventory-page="previous"]') as HTMLButtonElement;
    const next = view.panel.querySelector('[data-inventory-page="next"]') as HTMLButtonElement;
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    next.click();
    expect(view.panel.querySelectorAll('[data-inventory-row="exact"]')).toHaveLength(12);
    expect((view.panel.querySelector('[data-inventory-page="previous"]') as HTMLButtonElement).disabled).toBe(false);
    expect((view.panel.querySelector('[data-inventory-page="next"]') as HTMLButtonElement).disabled).toBe(true);
    controller.setState(loaded(inventoryOf(instances.slice(0, 3), 3)));
    expect((view.panel.querySelector('[data-inventory-page="previous"]') as HTMLButtonElement).disabled).toBe(true);
    expect((view.panel.querySelector('[data-inventory-page="next"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('opens the selected exact duplicate-base instance and paints every equipped effect delta', () => {
    const equippedItem = gear(70, 'hazmat', {
      itemLevel: 20,
      quality: 8,
      rarityTier: 4,
      affixes: [{ affixId: 'strike', role: 'prefix', tier: 4, value: 0.04 }],
    });
    const candidate = gear(71, 'fieldsuit', {
      itemLevel: 27,
      quality: 14,
      rarityTier: 5,
      affixes: [{ affixId: 'heal', role: 'suffix', tier: 5, value: 0.18 }],
    });
    const sameBaseSibling = gear(72, 'fieldsuit', { itemLevel: 29, quality: 15, rarityTier: 5 });
    let inventory = inventoryOf([equippedItem, candidate, sameBaseSibling], 3);
    inventory = committed(equipGear(inventory, inventory.revision, equippedItem.instanceId));
    const state = loaded(inventory);
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, openers: [view.opener] });
    controller.setState(state);

    const rows = [...view.panel.querySelectorAll<HTMLElement>('[data-base-id="fieldsuit"]')];
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.dataset.instanceId)).toEqual([candidate.instanceId, sameBaseSibling.instanceId]);
    rows[0]!.click();
    expect(view.sheet.querySelector('[data-inventory-detail]')?.getAttribute('data-inventory-detail'))
      .toBe(candidate.instanceId);
    expect(view.sheet.textContent).toContain(sourceActionId);
    expect(view.sheet.textContent).toContain(`seed ${candidate.generation.seed}`);
    expect(view.sheet.textContent).not.toMatch(/\bscore\b/i);
    expect(view.sheet.querySelector('[data-inventory-mutation-boundary="read-only"]')).not.toBeNull();
    expect(view.sheet.querySelectorAll('[data-inventory-action]')).toHaveLength(0);

    const comparison = compareGear(candidate, equippedItem);
    expect(inventoryComparisonDomComplete(view.sheet, comparison)).toBe(true);
    expect([...view.sheet.querySelectorAll<HTMLElement>('[data-compare-effect]')]
      .map((row) => row.dataset.effectKey)).toEqual(comparison.effects.map((row) => row.key));

    /* Negative control: a list with one plausible-looking delta omitted is red. */
    view.sheet.querySelector('[data-compare-effect]')?.remove();
    expect(inventoryComparisonDomComplete(view.sheet, comparison)).toBe(false);
  });

  it('states conditional landing context explicitly and keeps speed flat rather than percent', () => {
    const thermal = gear(73, 'thermal');
    const compass = gear(74, 'compass');
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet });
    controller.setState(loaded(inventoryOf([thermal, compass], 2)));

    expect(controller.showDetail(thermal.instanceId)).toBe(true);
    const conditionalEffect = view.sheet.querySelector<HTMLElement>(
      '[data-inventory-effect="landfam.lava"]',
    )!;
    const conditionalComparison = view.sheet.querySelector<HTMLElement>(
      '[data-effect-key="landfam.lava"]',
    )!;
    expect(conditionalEffect.dataset.condition).toBe('landing:lava');
    expect(conditionalEffect.textContent).toContain('Only when landing on lava');
    expect(conditionalComparison.dataset.condition).toBe('landing:lava');
    expect(conditionalComparison.textContent).toContain('Only when landing on lava');
    expect(view.sheet.textContent).toContain('Authored targeting tags');
    expect(view.sheet.textContent).toContain('Not present in the current Arc 2 authority');
    const thermalComparison = compareGear(thermal, null);
    expect(inventoryComparisonDomComplete(view.sheet, thermalComparison)).toBe(true);
    conditionalComparison.dataset.condition = 'unconditional';
    expect(inventoryComparisonDomComplete(view.sheet, thermalComparison)).toBe(false);

    expect(controller.showDetail(compass.instanceId)).toBe(true);
    const speedEffect = view.sheet.querySelector<HTMLElement>('[data-inventory-effect="speed"]')!;
    const speedComparison = view.sheet.querySelector<HTMLElement>('[data-effect-key="speed"]')!;
    expect(speedEffect.dataset.condition).toBe('unconditional');
    expect(speedEffect.textContent).toContain('+1');
    expect(speedEffect.textContent).not.toContain('%');
    expect(speedComparison.textContent).toContain('+1');
    expect(speedComparison.textContent).not.toContain('%');
  });

  it('names an all-exceptional fixed-craft outcome Pureforged in the live item inspector', () => {
    const pureforgedSource = makeGearSourceActionId({
      kind: 'craft',
      ownerId: FIXED_RECIPE_AUTHORITY,
      actionKey: 'recipe:rig1',
      receiptId: 'receipt:91',
    });
    const pureforged = createGearInstance(
      pureforgedSource,
      0,
      getFixedCraftGenerationPlan('rig1', 0xabc123, pureforgedSource),
    );
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet });
    controller.setState(loaded(inventoryOf([pureforged])));

    expect(controller.showDetail(pureforged.instanceId)).toBe(true);
    const terms = [...view.sheet.querySelectorAll('dt')];
    const term = terms.find((candidate) => candidate.textContent === 'Pureforged modifier');
    expect(term).toBeDefined();
    expect(term?.nextElementSibling?.textContent)
      .toMatch(/^(?:mining yield|rich-strike chance|capture chance) \+[0-9.]+%? · tier 1$/);
    expect(term?.nextElementSibling?.textContent).not.toContain('exceptional-v1');
    expect(terms.some((candidate) => candidate.textContent === 'Crafted modifier')).toBe(false);
    expect([...view.sheet.querySelectorAll('[data-inventory-effect]')]
      .some((row) => row.textContent?.includes('Pureforged'))).toBe(true);
  });

  it('waits for one durable action, ignores double-clicks, then publishes and reopens exact state', async () => {
    const item = gear(75, 'rig1');
    const initialInventory = inventoryOf([item]);
    const equippedInventory = committed(equipGear(
      initialInventory, initialInventory.revision, item.instanceId,
    ));
    const gate = deferred<InventoryPanelActionOutcome>();
    const onAction = vi.fn(() => gate.promise);
    const view = shell();
    controller = new InventoryPanelController({
      panel: view.panel,
      sheet: view.sheet,
      openers: [view.opener],
      onAction,
    });
    controller.setState(loaded(initialInventory));
    const row = view.panel.querySelector<HTMLButtonElement>(`[data-instance-id="${item.instanceId}"]`)!;
    row.click();
    const equip = view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!;
    equip.click();
    equip.click();

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ operation: 'equip', instanceId: item.instanceId });
    expect(view.sheet.getAttribute('aria-busy')).toBe('true');
    expect(view.panel.querySelector<HTMLElement>(`[data-instance-id="${item.instanceId}"]`)?.dataset.equipped)
      .toBe('false');
    expect(controller.diagnostics()).toMatchObject({ pendingWork: 1, lastAction: null });

    gate.resolve({ kind: 'committed', detail: 'equipped exact instance', state: loaded(equippedInventory) });
    await settleAction();
    expect(view.sheet.getAttribute('aria-busy')).toBe('false');
    expect(view.sheet.hidden).toBe(false);
    expect(view.sheet.querySelector('[data-inventory-detail]')?.getAttribute('data-inventory-detail'))
      .toBe(item.instanceId);
    expect(view.sheet.querySelector('[data-inventory-action="unequip"]')).not.toBeNull();
    expect(view.sheet.querySelector('[data-inventory-action-status]')?.textContent)
      .toBe('committed: equipped exact instance');
    expect(view.panel.querySelector<HTMLElement>(`[data-instance-id="${item.instanceId}"]`)?.dataset.equipped)
      .toBe('true');
    expect(controller.diagnostics()).toMatchObject({
      activeCount: 1,
      retainedCount: 0,
      pendingWork: 0,
      selectedInstanceId: item.instanceId,
      lastAction: {
        operation: 'equip',
        instanceId: item.instanceId,
        kind: 'committed',
        detail: 'equipped exact instance',
      },
    });
  });

  it('refreshes another detail opened while an earlier action settles and keeps a single in-flight call', async () => {
    const first = gear(76, 'rig1');
    const second = gear(77, 'fieldsuit');
    const initialInventory = inventoryOf([first, second], 2);
    const equippedInventory = committed(equipGear(
      initialInventory, initialInventory.revision, first.instanceId,
    ));
    const gate = deferred<InventoryPanelActionOutcome>();
    const onAction = vi.fn(() => gate.promise);
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, onAction });
    controller.setState(loaded(initialInventory));
    view.panel.querySelector<HTMLButtonElement>(`[data-instance-id="${first.instanceId}"]`)!.click();
    view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!.click();
    view.sheet.querySelector<HTMLButtonElement>('[data-inventory-sheet-close]')!.click();
    view.panel.querySelector<HTMLButtonElement>(`[data-instance-id="${second.instanceId}"]`)!.click();
    const secondAction = view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!;
    expect(secondAction.disabled).toBe(true);
    secondAction.dispatchEvent(new dom!.window.Event('click', { bubbles: true }));
    expect(onAction).toHaveBeenCalledTimes(1);

    gate.resolve({ kind: 'committed', detail: 'first equipped', state: loaded(equippedInventory) });
    await settleAction();
    expect(view.sheet.querySelector('[data-inventory-detail]')?.getAttribute('data-inventory-detail'))
      .toBe(second.instanceId);
    expect(view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')?.disabled)
      .toBe(false);
    expect(view.panel.querySelector<HTMLElement>(`[data-instance-id="${first.instanceId}"]`)?.dataset.equipped)
      .toBe('true');
    expect(view.sheet.getAttribute('aria-busy')).toBe('false');
  });

  it('pins pending rewards ahead of filters and exposes exact equipped/favorite/locked states', () => {
    const held = gear(80, 'rig1');
    const pending = gear(81, 'fieldsuit');
    let inventory = inventoryOf([held], 1);
    inventory = committed(equipGear(inventory, inventory.revision, held.instanceId));
    inventory = committed(setGearProtection(inventory, inventory.revision, held.instanceId, {
      favorite: true,
      locked: true,
    }));
    inventory = committed(grantGear(inventory, inventory.revision, pending));
    const state = loaded(inventory);
    const filtered = inventoryPanelPage(state, {
      filter: { query: 'definitely absent', equippedOnly: true },
    });
    expect(filtered.rows).toHaveLength(1);
    expect(filtered.rows[0]).toMatchObject({ kind: 'pending', instanceId: pending.instanceId, pending: true });

    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet });
    controller.setState(state);
    const heldRow = view.panel.querySelector<HTMLElement>(`[data-instance-id="${held.instanceId}"]`)!;
    expect(heldRow.dataset).toMatchObject({
      pending: 'false', equipped: 'true', favorite: 'true', locked: 'true',
    });
    const pendingRow = view.panel.querySelector<HTMLElement>(`[data-instance-id="${pending.instanceId}"]`)!;
    expect(pendingRow.dataset).toMatchObject({
      pending: 'true', equipped: 'false', favorite: 'false', locked: 'false',
    });
    expect(view.panel.textContent).toContain('Open one to inspect it or claim it when Inventory has room.');
    expect(view.panel.textContent).not.toContain('cannot be mutated here');
  });

  it('never publishes refused or rejected outcomes and leaves the exact action retryable', async () => {
    const item = gear(82, 'rig1');
    const initialInventory = inventoryOf([item]);
    const differentInventory = committed(equipGear(
      initialInventory, initialInventory.revision, item.instanceId,
    ));
    const onAction = vi.fn()
      .mockResolvedValueOnce({
        kind: 'refused' as const,
        detail: 'durable policy refused',
        state: loaded(differentInventory),
      })
      .mockRejectedValueOnce(new Error('durable store rejected'));
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, onAction });
    controller.setState(loaded(initialInventory));
    view.panel.querySelector<HTMLButtonElement>(`[data-instance-id="${item.instanceId}"]`)!.click();

    view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!.click();
    await settleAction();
    expect(view.panel.querySelector<HTMLElement>(`[data-instance-id="${item.instanceId}"]`)?.dataset.equipped)
      .toBe('false');
    expect(view.sheet.querySelector('[data-inventory-action-status]')?.textContent)
      .toBe('refused: durable policy refused');
    expect(view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')?.disabled)
      .toBe(false);

    view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!.click();
    await settleAction();
    expect(onAction).toHaveBeenCalledTimes(2);
    expect(view.panel.querySelector<HTMLElement>(`[data-instance-id="${item.instanceId}"]`)?.dataset.equipped)
      .toBe('false');
    expect(view.sheet.querySelector('[data-inventory-action-status]')?.textContent)
      .toBe('refused: durable store rejected');
    expect(controller.diagnostics()).toMatchObject({
      activeCount: 1,
      retainedCount: 0,
      pendingWork: 0,
      lastAction: {
        operation: 'equip',
        instanceId: item.instanceId,
        kind: 'refused',
        detail: 'durable store rejected',
      },
    });
  });

  it('publishes an unavailable authority outcome without changing the exact item and leaves retry available', async () => {
    const item = gear(820, 'rig1');
    const initialInventory = inventoryOf([item]);
    const onAction = vi.fn(async (): Promise<InventoryPanelActionOutcome> => ({
      kind: 'unavailable',
      detail: 'write-authority-unavailable',
      state: null,
    }));
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, onAction });
    controller.setState(loaded(initialInventory));
    view.panel.querySelector<HTMLButtonElement>(`[data-instance-id="${item.instanceId}"]`)!.click();

    view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!.click();
    await settleAction();

    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith({ operation: 'equip', instanceId: item.instanceId });
    expect(view.panel.querySelector<HTMLElement>(`[data-instance-id="${item.instanceId}"]`)?.dataset.equipped)
      .toBe('false');
    expect(view.sheet.querySelector('[data-inventory-action-status]')?.textContent)
      .toBe('unavailable: write-authority-unavailable');
    expect(view.sheet.querySelector('[data-inventory-action-status]')?.getAttribute('data-kind'))
      .toBe('unavailable');
    expect(view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')?.disabled)
      .toBe(false);
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 0,
      selectedInstanceId: item.instanceId,
      lastAction: {
        operation: 'equip',
        instanceId: item.instanceId,
        kind: 'unavailable',
        detail: 'write-authority-unavailable',
      },
    });
  });

  it('keeps a post-durable publication failure committed and never presents a retry', async () => {
    const item = gear(821, 'rig1');
    const initialInventory = inventoryOf([item]);
    const onAction = vi.fn(async (): Promise<InventoryPanelActionOutcome> => ({
      kind: 'committed',
      detail: 'revision:9;publication-reload',
      state: null,
    }));
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, onAction });
    controller.setState(loaded(initialInventory));
    view.panel.querySelector<HTMLButtonElement>(`[data-instance-id="${item.instanceId}"]`)!.click();
    view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!.click();
    await settleAction();

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(view.sheet.querySelector('[data-inventory-action-status]')?.textContent)
      .toBe('committed: revision:9;publication-reload');
    expect(view.sheet.querySelector('[data-inventory-action-status]')?.getAttribute('data-kind'))
      .toBe('committed-convergence');
    expect(view.document.activeElement).toBe(view.sheet.querySelector('[data-inventory-sheet-close]'));
    expect(view.panel.querySelector<HTMLElement>(`[data-instance-id="${item.instanceId}"]`)?.dataset.equipped)
      .toBe('false');
    const retry = view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!;
    expect(retry.disabled).toBe(true);
    expect(retry.dataset.protectedReason).toBe('convergence-reload');
    retry.click();
    await settleAction();
    expect(onAction).toHaveBeenCalledTimes(1);
    view.sheet.querySelector<HTMLButtonElement>('[data-inventory-sheet-close]')!.click();
    view.panel.querySelector<HTMLButtonElement>(`[data-instance-id="${item.instanceId}"]`)!.click();
    const reopenedRetry = view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!;
    expect(reopenedRetry.disabled).toBe(true);
    expect(reopenedRetry.dataset.protectedReason).toBe('convergence-reload');
    reopenedRetry.click();
    await settleAction();
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(controller.diagnostics().lastAction).toEqual({
      operation: 'equip',
      instanceId: item.instanceId,
      kind: 'committed',
      detail: 'revision:9;publication-reload',
    });
  });

  it('requires an explicit second salvage press, then closes and restores valid focus after commit', async () => {
    const target = gear(83, 'rig1');
    const survivor = gear(84, 'compass');
    const initialInventory = inventoryOf([target, survivor], 2);
    const salvagedInventory = committed(salvageGear(
      initialInventory, initialInventory.revision, target.instanceId,
    ));
    const onAction = vi.fn(async () => ({
      kind: 'committed' as const,
      detail: 'salvaged exact instance',
      state: loaded(salvagedInventory),
    }));
    const requiresSalvageConfirmation = vi.fn(() => true);
    const view = shell();
    controller = new InventoryPanelController({
      panel: view.panel,
      sheet: view.sheet,
      openers: [view.opener],
      onAction,
      requiresSalvageConfirmation,
    });
    controller.setState(loaded(initialInventory));
    view.panel.querySelector<HTMLButtonElement>(`[data-instance-id="${target.instanceId}"]`)!.click();
    const salvage = view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="salvage"]')!;
    salvage.click();
    expect(requiresSalvageConfirmation).toHaveBeenCalledWith({
      operation: 'salvage', instanceId: target.instanceId,
    });
    expect(onAction).not.toHaveBeenCalled();
    expect(salvage.dataset.confirmation).toBe('required');
    expect(salvage.textContent).toBe('Confirm salvage exact item');
    expect(controller.diagnostics().pendingWork).toBe(0);

    salvage.click();
    expect(onAction).toHaveBeenCalledTimes(1);
    await settleAction();
    const survivorRow = view.panel.querySelector<HTMLButtonElement>(
      `[data-instance-id="${survivor.instanceId}"]`,
    )!;
    expect(view.panel.querySelector(`[data-instance-id="${target.instanceId}"]`)).toBeNull();
    expect(view.sheet.hidden).toBe(true);
    expect(view.sheet.querySelector('[data-inventory-sheet-body]')?.childElementCount).toBe(0);
    expect(view.document.activeElement).toBe(survivorRow);
    expect(controller.diagnostics()).toEqual({
      schema: 'cf-v2-inventory-sheet-diagnostics/v1',
      activeCount: 0,
      retainedCount: 0,
      pendingWork: 0,
      selectedInstanceId: null,
      lastAction: {
        operation: 'salvage',
        instanceId: target.instanceId,
        kind: 'committed',
        detail: 'salvaged exact instance',
      },
    });
  });

  it('disables salvage for every exact protection and exposes the contextual inverse equip action', () => {
    const equippedItem = gear(85, 'rig1');
    const favoriteItem = gear(86, 'fieldsuit');
    const lockedItem = gear(87, 'compass');
    let inventory = inventoryOf([equippedItem, favoriteItem, lockedItem], 3);
    inventory = committed(equipGear(inventory, inventory.revision, equippedItem.instanceId));
    inventory = committed(setGearProtection(inventory, inventory.revision, favoriteItem.instanceId, {
      favorite: true, locked: false,
    }));
    inventory = committed(setGearProtection(inventory, inventory.revision, lockedItem.instanceId, {
      favorite: false, locked: true,
    }));
    const onAction = vi.fn(async (): Promise<InventoryPanelActionOutcome> => ({
      kind: 'refused', detail: 'must not run', state: null,
    }));
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, onAction });
    controller.setState(loaded(inventory));

    for (const [item, reason, inverse] of [
      [equippedItem, 'equipped', 'unequip'],
      [favoriteItem, 'favorite', 'equip'],
      [lockedItem, 'locked', 'equip'],
    ] as const) {
      expect(controller.showDetail(item.instanceId)).toBe(true);
      const salvage = view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="salvage"]')!;
      expect(salvage.disabled).toBe(true);
      expect(salvage.dataset.protectedReason).toBe(reason);
      expect(view.sheet.querySelector(`[data-inventory-action="${inverse}"]`)).not.toBeNull();
      salvage.click();
    }
    expect(onAction).not.toHaveBeenCalled();
  });

  it('keeps a full pending claim disabled, then publishes and reopens the same instance after a durable claim', async () => {
    const held = gear(88, 'rig1');
    const pending = gear(89, 'fieldsuit');
    let fullInventory = inventoryOf([held], 1);
    fullInventory = committed(grantGear(fullInventory, fullInventory.revision, pending));
    const freeInventory = committed(salvageGear(
      fullInventory, fullInventory.revision, held.instanceId,
    ));
    const claimedInventory = committed(claimPendingGear(
      freeInventory, freeInventory.revision, pending.instanceId,
    ));
    const onAction = vi.fn(async () => ({
      kind: 'committed' as const,
      detail: 'pending reward claimed',
      state: loaded(claimedInventory),
    }));
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, onAction });
    controller.setState(loaded(fullInventory));
    expect(controller.showDetail(pending.instanceId)).toBe(true);
    const blocked = view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="pending-claim"]')!;
    expect(blocked.disabled).toBe(true);
    expect(blocked.dataset.protectedReason).toBe('inventory-full');
    blocked.click();
    expect(onAction).not.toHaveBeenCalled();

    controller.setState(loaded(freeInventory));
    expect(controller.showDetail(pending.instanceId)).toBe(true);
    const claim = view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="pending-claim"]')!;
    expect(claim.disabled).toBe(false);
    claim.click();
    await settleAction();
    expect(onAction).toHaveBeenCalledWith({ operation: 'pending-claim', instanceId: pending.instanceId });
    expect(view.sheet.hidden).toBe(false);
    expect(view.sheet.querySelector('[data-inventory-detail]')?.getAttribute('data-inventory-detail'))
      .toBe(pending.instanceId);
    expect(view.sheet.querySelector('[data-inventory-action="equip"]')).not.toBeNull();
    expect(view.panel.querySelector<HTMLElement>(`[data-instance-id="${pending.instanceId}"]`)?.dataset.pending)
      .toBe('false');
    expect(view.sheet.querySelector('[data-inventory-action-status]')?.textContent)
      .toBe('committed: pending reward claimed');
  });

  it('owns the full modal lifetime, re-locks changed and late background, and restores exact state', async () => {
    const item = gear(90, 'voidhelm');
    const view = shell();
    const toast = view.document.createElement('div');
    toast.id = 'toast';
    toast.inert = false;
    toast.setAttribute('aria-hidden', 'toast-prior');
    view.document.body.insertBefore(toast, view.sheet);
    view.opener.inert = true;
    view.opener.setAttribute('aria-hidden', 'opener-prior');
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, openers: [view.opener] });
    controller.setState(loaded(inventoryOf([item])));
    const row = view.panel.querySelector<HTMLButtonElement>('[data-inventory-row="exact"]')!;
    row.focus();
    row.click();
    expect(view.sheet.hidden).toBe(false);
    expect(view.document.activeElement).toBe(view.sheet.querySelector('[data-inventory-sheet-close]'));
    expect(view.panel.inert).toBe(true);
    expect(controller.diagnostics()).toEqual({
      schema: 'cf-v2-inventory-sheet-diagnostics/v1',
      activeCount: 1,
      retainedCount: 0,
      pendingWork: 0,
      selectedInstanceId: item.instanceId,
      lastAction: null,
    });

    const backgroundLocked = (): boolean => [...view.document.body.children]
      .filter((candidate) => candidate !== view.sheet)
      .every((candidate) => (candidate as HTMLElement).inert === true
        && candidate.getAttribute('aria-hidden') === 'true');
    expect(backgroundLocked()).toBe(true);

    /* Each half can be rewritten independently. In browsers the inert
       property reflects its attribute; set/remove the attribute explicitly
       so jsdom exercises the same observer edge. */
    toast.setAttribute('inert', '');
    await settleAction();
    toast.inert = false;
    toast.removeAttribute('inert');
    expect(backgroundLocked()).toBe(false);
    await settleAction();
    expect(backgroundLocked()).toBe(true);

    /* `showToast()` removes aria-hidden while queued ceremonies drain. */
    toast.removeAttribute('aria-hidden');
    expect(backgroundLocked()).toBe(false);
    await settleAction();
    expect(backgroundLocked()).toBe(true);

    /* Rank FX can also append a direct body child after the sheet opens. */
    const lateFx = view.document.createElement('div');
    lateFx.id = 'late-rank-fx';
    lateFx.inert = false;
    lateFx.setAttribute('aria-hidden', 'late-prior');
    view.document.body.append(lateFx);
    expect(backgroundLocked()).toBe(false);
    await settleAction();
    expect(backgroundLocked()).toBe(true);

    view.outside.focus();
    expect(view.document.activeElement).toBe(view.sheet.querySelector('[data-inventory-sheet-close]'));
    view.document.dispatchEvent(new dom!.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(view.sheet.hidden).toBe(true);
    expect(view.sheet.querySelector('[data-inventory-sheet-body]')?.childElementCount).toBe(0);
    expect(view.document.activeElement).toBe(row);
    expect(view.panel.inert).not.toBe(true);
    expect(view.opener.inert).toBe(true);
    expect(view.opener.getAttribute('aria-hidden')).toBe('opener-prior');
    expect(toast.inert).toBe(false);
    expect(toast.getAttribute('aria-hidden')).toBe('toast-prior');
    expect(lateFx.inert).toBe(false);
    expect(lateFx.getAttribute('aria-hidden')).toBe('late-prior');
    expect(controller.diagnostics()).toEqual({
      schema: 'cf-v2-inventory-sheet-diagnostics/v1',
      activeCount: 0,
      retainedCount: 0,
      pendingWork: 0,
      selectedInstanceId: null,
      lastAction: null,
    });

    row.click();
    expect(view.sheet.querySelectorAll('[data-inventory-detail]')).toHaveLength(1);
    (view.sheet.querySelector('[data-inventory-sheet-close]') as HTMLButtonElement).click();
    expect(view.sheet.hidden).toBe(true);
    expect(view.document.activeElement).toBe(row);
    expect(controller.registration()).toMatchObject({ id: 'inventory', el: view.panel });
    expect(controller.registration().btns).toEqual([view.opener]);

    row.click();
    controller.dispose();
    const afterDispose = view.document.createElement('div');
    view.document.body.append(afterDispose);
    await settleAction();
    expect(afterDispose.inert).not.toBe(true);
    expect(afterDispose.hasAttribute('aria-hidden')).toBe(false);
  });

  it('fails closed when a second dialog owner exists', () => {
    const view = shell('<div id="inventorysheet" role="dialog" aria-modal="true" aria-labelledby="duplicate"></div>');
    expect(() => new InventoryPanelController({ panel: view.panel, sheet: view.sheet }))
      .toThrow('exactly one #inventorysheet');
  });

  it('keeps oversized legacy facts paged, exact, and mutation-free', () => {
    const itemCounts = LOOT_CATALOGUE_V1.slice(0, 55)
      .map(({ id }) => Object.freeze([id, 1] as const));
    const estimatedInstanceCount = LOOT_CATALOGUE_V1.slice(0, 55)
      .filter(({ inventoryShape }) => inventoryShape === 'slotted').length;
    const state: Arc2LootStateV1 = Object.freeze({
      kind: 'legacy-protected',
      reason: 'capacity',
      sourceActionId: ARC2_LOOT_LEGACY_SOURCE_ACTION_ID,
      estimatedInstanceCount,
      itemCounts: Object.freeze(itemCounts),
      equipped: Object.freeze({ tool: 'rig1' }),
      equippedAffixes: Object.freeze({
        tool: Object.freeze({ k: 'yield' as const, v: 0.25, forId: 'rig1' }),
      }),
    });
    expect(inventoryPanelPage(state).rows).toHaveLength(48);
    expect(inventoryPanelPage(state, { page: 1 }).rows).toHaveLength(7);

    const view = shell();
    const onAction = vi.fn(async (): Promise<InventoryPanelActionOutcome> => ({
      kind: 'refused', detail: 'legacy actions must remain unreachable', state: null,
    }));
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet, onAction });
    controller.setState(state);
    expect(view.panel.querySelectorAll('[data-inventory-row]')).toHaveLength(48);
    expect(view.panel.textContent).toContain('Legacy inventory is protected read-only');
    expect(view.panel.textContent).toContain(ARC2_LOOT_LEGACY_SOURCE_ACTION_ID);
    expect(view.panel.textContent).toContain('tool: rig1');
    expect(view.panel.querySelectorAll('[data-inventory-mutation]')).toHaveLength(0);
    expect([...view.panel.querySelectorAll('button')].every((button) => button.hasAttribute('data-inventory-page')))
      .toBe(true);
    expect(view.panel.querySelectorAll('[data-inventory-action]')).toHaveLength(0);
    expect(controller.showDetail('gear1|not-real')).toBe(false);
    expect(onAction).not.toHaveBeenCalled();
    expect(view.sheet.hidden).toBe(true);
  });

  it('retains state but releases hidden production rows and listeners between panel opens', () => {
    const item = gear(91, 'rig1');
    const view = shell();
    const panelBody = view.panel.querySelector<HTMLElement>('[data-inventory-panel-body]')!;
    const panelAdd = vi.spyOn(panelBody, 'addEventListener');
    const panelRemove = vi.spyOn(panelBody, 'removeEventListener');
    const sheetAdd = vi.spyOn(view.sheet, 'addEventListener');
    const sheetRemove = vi.spyOn(view.sheet, 'removeEventListener');
    const documentAdd = vi.spyOn(view.document, 'addEventListener');
    const documentRemove = vi.spyOn(view.document, 'removeEventListener');
    controller = new InventoryPanelController({
      panel: view.panel,
      sheet: view.sheet,
      openers: [view.opener],
      deferWhileClosed: true,
    });
    controller.setState(loaded(inventoryOf([item])));

    expect(panelBody.childElementCount).toBe(0);
    expect(panelAdd).not.toHaveBeenCalled();
    expect(sheetAdd).not.toHaveBeenCalled();
    expect(documentAdd).not.toHaveBeenCalled();

    const registration = controller.registration();
    registration.onOpen();
    registration.onOpen();
    expect(panelBody.querySelector(`[data-instance-id="${item.instanceId}"]`)).not.toBeNull();
    expect(panelAdd).toHaveBeenCalledTimes(3);
    expect(sheetAdd).toHaveBeenCalledTimes(1);
    expect(documentAdd).toHaveBeenCalledTimes(2);

    registration.onClose();
    registration.onClose();
    expect(panelBody.childElementCount).toBe(0);
    expect(panelRemove).toHaveBeenCalledTimes(3);
    expect(sheetRemove).toHaveBeenCalledTimes(1);
    expect(documentRemove).toHaveBeenCalledTimes(2);

    controller.setState(loaded(createGearInventory(4)));
    expect(panelBody.childElementCount).toBe(0);
    registration.onOpen();
    expect(panelBody.textContent).toContain('No exact item instance matches');
    expect(panelAdd).toHaveBeenCalledTimes(6);
    controller.dispose();
    expect(panelBody.childElementCount).toBe(0);
    expect(panelRemove).toHaveBeenCalledTimes(6);
    expect(sheetRemove).toHaveBeenCalledTimes(2);
    expect(documentRemove).toHaveBeenCalledTimes(4);
  });

  it('keeps a deferred action result authoritative without rebuilding rows after Close', async () => {
    const item = gear(92, 'rig1');
    const initialInventory = inventoryOf([item]);
    const equippedInventory = committed(equipGear(
      initialInventory, initialInventory.revision, item.instanceId,
    ));
    const gate = deferred<InventoryPanelActionOutcome>();
    const view = shell();
    controller = new InventoryPanelController({
      panel: view.panel,
      sheet: view.sheet,
      openers: [view.opener],
      onAction: () => gate.promise,
      deferWhileClosed: true,
    });
    controller.setState(loaded(initialInventory));
    const registration = controller.registration();
    registration.onOpen();
    view.panel.querySelector<HTMLButtonElement>(`[data-instance-id="${item.instanceId}"]`)!.click();
    view.sheet.querySelector<HTMLButtonElement>('[data-inventory-action="equip"]')!.click();
    expect(controller.diagnostics().pendingWork).toBe(1);

    registration.onClose();
    expect(view.panel.querySelector<HTMLElement>('[data-inventory-panel-body]')!.childElementCount).toBe(0);
    gate.resolve({ kind: 'committed', detail: 'equipped after Close', state: loaded(equippedInventory) });
    await settleAction();
    expect(view.panel.querySelector<HTMLElement>('[data-inventory-panel-body]')!.childElementCount).toBe(0);
    expect(controller.diagnostics()).toMatchObject({
      pendingWork: 0,
      selectedInstanceId: null,
      lastAction: { kind: 'committed', detail: 'equipped after Close' },
    });

    registration.onOpen();
    expect(view.panel.querySelector<HTMLElement>(`[data-instance-id="${item.instanceId}"]`)?.dataset.equipped)
      .toBe('true');
  });

  it('cannot reacquire deferred listeners through a registration captured before disposal', () => {
    const view = shell();
    const panelBody = view.panel.querySelector<HTMLElement>('[data-inventory-panel-body]')!;
    const panelAdd = vi.spyOn(panelBody, 'addEventListener');
    const sheetAdd = vi.spyOn(view.sheet, 'addEventListener');
    const documentAdd = vi.spyOn(view.document, 'addEventListener');
    controller = new InventoryPanelController({
      panel: view.panel,
      sheet: view.sheet,
      deferWhileClosed: true,
    });
    const registration = controller.registration();
    registration.onOpen();
    expect(panelBody.childElementCount).toBeGreaterThan(0);
    controller.dispose();

    expect(() => registration.onOpen()).toThrow(/disposed/);
    expect(() => registration.onClose()).not.toThrow();
    expect(panelBody.childElementCount).toBe(0);
    expect(panelAdd).toHaveBeenCalledTimes(3);
    expect(sheetAdd).toHaveBeenCalledTimes(1);
    expect(documentAdd).toHaveBeenCalledTimes(2);
  });

  it('renders absent and empty states without inventing an item or action', () => {
    const view = shell();
    controller = new InventoryPanelController({ panel: view.panel, sheet: view.sheet });
    expect(view.panel.querySelector('[data-inventory-state="absent"]')?.textContent).toContain('No Arc 2 inventory');
    controller.setState(loaded(createGearInventory(4)));
    expect(view.panel.textContent).toContain('No exact item instance matches');
    expect(view.panel.querySelectorAll('[data-inventory-row="exact"]')).toHaveLength(0);
    expect(view.panel.querySelectorAll('[data-inventory-mutation]')).toHaveLength(0);
  });
});
