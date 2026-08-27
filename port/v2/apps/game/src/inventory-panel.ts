/* Arc 2 Inventory presentation owner.

   This module projects the strict Arc2 loot carrier through @cf/domain-loot's
   inspect/filter/compare read models. It stays read-only unless Main supplies
   the optional durable action adapter, and it never emits optimistic state. */
import {
  GEAR_RARITIES,
  GEAR_SLOTS,
  compareGear,
  filterGearEntries,
  getLootCatalogueDefinition,
  inspectGear,
  type GearComparison,
  type GearInventoryEntry,
  type GearInventoryFilter,
  type GearRarity,
  type GearSlot,
} from '@cf/domain-loot';
import type { Arc2LootStateV1 } from '@cf/persistence';

export const INVENTORY_PAGE_SIZE = 48 as const;

export type InventoryExactRow = Readonly<{
  kind: 'entry' | 'pending';
  instanceId: string;
  entry: GearInventoryEntry;
  equipped: boolean;
  pending: boolean;
}>;

export type InventoryLegacyRow = Readonly<{
  kind: 'legacy';
  baseId: string;
  baseName: string;
  count: number;
}>;

export type InventoryPanelRow = InventoryExactRow | InventoryLegacyRow;

export interface InventoryPanelPageRequest {
  readonly filter?: GearInventoryFilter;
  readonly page?: number;
}

export interface InventoryPanelPage {
  readonly kind: 'absent' | Arc2LootStateV1['kind'];
  readonly rows: readonly InventoryPanelRow[];
  readonly page: number;
  readonly pageCount: number;
  readonly totalRows: number;
  readonly pendingCount: number;
}

function checkedPage(page: number | undefined): number {
  const value = page ?? 0;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('Inventory page must be a non-negative safe integer');
  }
  return value;
}

function paginate(
  kind: InventoryPanelPage['kind'],
  rows: readonly InventoryPanelRow[],
  requestedPage: number,
  pendingCount: number,
): InventoryPanelPage {
  const pageCount = Math.max(1, Math.ceil(rows.length / INVENTORY_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount - 1);
  const start = page * INVENTORY_PAGE_SIZE;
  return Object.freeze({
    kind,
    rows: Object.freeze(rows.slice(start, start + INVENTORY_PAGE_SIZE)),
    page,
    pageCount,
    totalRows: rows.length,
    pendingCount,
  });
}

/**
 * Pure bounded projection. Pending receipts are pinned before filtered held
 * entries so a filter cannot make an unsettled reward disappear. Duplicate
 * bases remain separate because every row is keyed only by instanceId.
 */
export function inventoryPanelPage(
  state: Arc2LootStateV1 | null,
  request: InventoryPanelPageRequest = {},
): InventoryPanelPage {
  const page = checkedPage(request.page);
  if (state === null) return paginate('absent', [], page, 0);

  if (state.kind === 'legacy-protected') {
    const query = request.filter?.query?.trim().toLocaleLowerCase('en-US') ?? '';
    const rows = state.itemCounts.flatMap(([baseId, count]): readonly InventoryLegacyRow[] => {
      if (count < 1) return [];
      const baseName = getLootCatalogueDefinition(baseId)?.name ?? baseId;
      if (query && !`${baseId}\n${baseName}`.toLocaleLowerCase('en-US').includes(query)) return [];
      return [Object.freeze({ kind: 'legacy', baseId, baseName, count })];
    });
    return paginate('legacy-protected', rows, page, 0);
  }

  const inventory = state.inventory;
  const equippedIds = new Set(inventory.equipped.map(({ instanceId }) => instanceId));
  const held = filterGearEntries(inventory, request.filter ?? {});
  const heldRows: InventoryExactRow[] = held.map((entry) => Object.freeze({
    kind: 'entry',
    instanceId: entry.instance.instanceId,
    entry,
    equipped: equippedIds.has(entry.instance.instanceId),
    pending: false,
  }));
  const pendingRows: InventoryExactRow[] = inventory.pendingRewards.map(({ instance }) => Object.freeze({
    kind: 'pending',
    instanceId: instance.instanceId,
    entry: Object.freeze({ instance, favorite: false, locked: false }),
    equipped: false,
    pending: true,
  }));
  return paginate('inventory', [...pendingRows, ...heldRows], page, pendingRows.length);
}

export interface InventoryPanelRegistration {
  readonly id: 'inventory';
  readonly el: HTMLElement;
  readonly btns: Array<HTMLElement | null>;
  readonly onOpen: () => void;
  readonly onClose: () => void;
}

export interface InventorySheetDiagnostics {
  readonly schema: 'cf-v2-inventory-sheet-diagnostics/v1';
  readonly activeCount: 0 | 1;
  readonly retainedCount: number;
  readonly pendingWork: 0 | 1;
  readonly selectedInstanceId: string | null;
  readonly lastAction: InventoryPanelLastAction | null;
}

export type InventoryPanelActionOperation = 'equip' | 'unequip' | 'salvage' | 'pending-claim';

export interface InventoryPanelActionRequest {
  readonly operation: InventoryPanelActionOperation;
  readonly instanceId: string;
}

export interface InventoryPanelActionOutcome {
  readonly kind: 'committed' | 'unchanged' | 'unavailable' | 'refused';
  readonly detail: string;
  readonly state: Arc2LootStateV1 | null;
}

export type InventoryPanelLastAction = Readonly<{
  operation: InventoryPanelActionOperation;
  instanceId: string;
  kind: InventoryPanelActionOutcome['kind'];
  detail: string;
}>;

export interface InventoryPanelControllerOptions {
  readonly panel: HTMLElement;
  readonly sheet: HTMLElement;
  readonly openers?: readonly (HTMLElement | null)[];
  readonly onAction?: (request: InventoryPanelActionRequest) => Promise<InventoryPanelActionOutcome>;
  readonly requiresSalvageConfirmation?: (request: InventoryPanelActionRequest) => boolean;
  /** Production panels retain state while closed, but not a hidden row tree
   * or six dormant event subscriptions. Tests and standalone consumers keep
   * the historical eager behavior unless they opt into this lifecycle. */
  readonly deferWhileClosed?: boolean;
}

type InventoryStatusFilter = 'all' | 'equipped' | 'protected';

function textNumber(value: number, percent = false): string {
  const amount = percent ? value * 100 : value;
  const rounded = Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(4)));
  return `${amount > 0 ? '+' : ''}${rounded}${percent ? '%' : ''}`;
}

function deltaSign(value: number): 'positive' | 'negative' | 'zero' {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero';
}

function conditionData(condition: string | null): string {
  return condition ?? 'unconditional';
}

function conditionWording(condition: string | null): string {
  if (condition === null) return 'Always applies';
  if (condition.startsWith('landing:')) return `Only when landing on ${condition.slice('landing:'.length)}`;
  return `Only when ${condition}`;
}

function option<K extends string>(
  document: Document,
  value: K,
  label: string,
  selected: boolean,
): HTMLOptionElement {
  const node = document.createElement('option');
  node.value = value;
  node.textContent = label;
  node.selected = selected;
  return node;
}

function setDataNumber(element: HTMLElement, key: string, value: number): void {
  element.dataset[key] = String(value);
}

/** Replays the exact domain comparison against the painted DOM. */
export function inventoryComparisonDomComplete(
  root: ParentNode,
  comparison: GearComparison,
): boolean {
  const axes = [...root.querySelectorAll<HTMLElement>('[data-compare-axis]')];
  const expectedAxes = [
    ['itemLevel', comparison.itemLevelDelta],
    ['quality', comparison.qualityDelta],
  ] as const;
  if (axes.length !== expectedAxes.length || axes.some((row, index) => {
    const expected = expectedAxes[index]!;
    return row.dataset.compareAxis !== expected[0] || row.dataset.delta !== String(expected[1]);
  })) return false;

  const rows = [...root.querySelectorAll<HTMLElement>('[data-compare-effect]')];
  return rows.length === comparison.effects.length && rows.every((row, index) => {
    const expected = comparison.effects[index]!;
    return row.dataset.effectKey === expected.key
      && row.dataset.equipped === String(expected.equipped)
      && row.dataset.candidate === String(expected.candidate)
      && row.dataset.delta === String(expected.delta)
      && row.dataset.condition === conditionData(expected.condition);
  });
}

export class InventoryPanelController {
  readonly #panel: HTMLElement;
  readonly #panelBody: HTMLElement;
  readonly #sheet: HTMLElement;
  readonly #sheetBody: HTMLElement;
  readonly #sheetTitle: HTMLElement;
  readonly #sheetClose: HTMLButtonElement;
  readonly #document: Document;
  readonly #openers: readonly (HTMLElement | null)[];
  readonly #actionAdapter: InventoryPanelControllerOptions['onAction'] | null;
  readonly #requiresSalvageConfirmation: NonNullable<InventoryPanelControllerOptions['requiresSalvageConfirmation']>;
  readonly #deferWhileClosed: boolean;
  readonly #background = new Map<HTMLElement, Readonly<{ inert: boolean; ariaHidden: string | null }>>();
  #state: Arc2LootStateV1 | null = null;
  #query = '';
  #slot: 'all' | GearSlot = 'all';
  #rarity: 'all' | GearRarity = 'all';
  #status: InventoryStatusFilter = 'all';
  #page = 0;
  #selectedInstanceId: string | null = null;
  #focusReturn: HTMLElement | null = null;
  #active = false;
  #pendingAction: InventoryPanelActionRequest | null = null;
  #convergencePending = false;
  #lastAction: InventoryPanelLastAction | null = null;
  #salvageConfirmationFor: string | null = null;
  #panelOpen = false;
  #listenersInstalled = false;
  #disposed = false;

  constructor(options: InventoryPanelControllerOptions) {
    this.#panel = options.panel;
    this.#sheet = options.sheet;
    this.#document = options.panel.ownerDocument;
    this.#openers = Object.freeze([...(options.openers ?? [])]);
    this.#actionAdapter = options.onAction ?? null;
    this.#requiresSalvageConfirmation = options.requiresSalvageConfirmation ?? (() => false);
    this.#deferWhileClosed = options.deferWhileClosed ?? false;
    if (options.sheet.ownerDocument !== this.#document) {
      throw new Error('Inventory panel and sheet must belong to one document');
    }
    if (this.#document.querySelectorAll('#inventorysheet').length !== 1
      || options.sheet.id !== 'inventorysheet') {
      throw new Error('Inventory requires exactly one #inventorysheet owner');
    }
    if (options.sheet.getAttribute('role') !== 'dialog'
      || options.sheet.getAttribute('aria-modal') !== 'true'
      || !options.sheet.getAttribute('aria-labelledby')) {
      throw new Error('Inventory sheet must be an accessible labelled modal dialog');
    }
    const panelBody = options.panel.querySelector<HTMLElement>('[data-inventory-panel-body]');
    const sheetBody = options.sheet.querySelector<HTMLElement>('[data-inventory-sheet-body]');
    const titleId = options.sheet.getAttribute('aria-labelledby')!;
    const titleCandidate = this.#document.getElementById(titleId);
    const title = titleCandidate && options.sheet.contains(titleCandidate) ? titleCandidate : null;
    const close = options.sheet.querySelector<HTMLButtonElement>('[data-inventory-sheet-close]');
    if (!panelBody || !sheetBody || !title || !close) {
      throw new Error('Inventory panel or sheet shell is incomplete');
    }
    this.#panelBody = panelBody;
    this.#sheetBody = sheetBody;
    this.#sheetTitle = title;
    this.#sheetClose = close;
    this.#sheet.hidden = true;
    this.#sheet.setAttribute('aria-hidden', 'true');
    this.#sheet.setAttribute('aria-busy', 'false');
    if (!this.#deferWhileClosed) {
      this.#installListeners();
      this.render();
    }
  }

  setState(state: Arc2LootStateV1 | null): void {
    this.#assertLive();
    if (this.#active) this.closeDetail(false);
    this.#state = state;
    this.#convergencePending = false;
    this.#page = 0;
    this.#salvageConfirmationFor = null;
    if (!this.#deferWhileClosed || this.#panelOpen) this.render();
  }

  registration(): InventoryPanelRegistration {
    this.#assertLive();
    return Object.freeze({
      id: 'inventory',
      el: this.#panel,
      btns: [...this.#openers],
      onOpen: () => {
        this.#assertLive();
        this.#panelOpen = true;
        this.#installListeners();
        this.render();
      },
      onClose: () => {
        if (this.#disposed) return;
        this.#panelOpen = false;
        this.closeDetail(false);
        if (this.#deferWhileClosed) {
          this.#panelBody.replaceChildren();
          this.#removeListeners();
        }
      },
    });
  }

  render(): void {
    this.#assertLive();
    const request = this.#filterRequest();
    const page = inventoryPanelPage(this.#state, { filter: request, page: this.#page });
    this.#page = page.page;
    const fragment = this.#document.createDocumentFragment();
    fragment.append(this.#node('h3', '', 'Inventory'));

    if (this.#state === null) {
      const empty = this.#node('div', 'empty', 'No Arc 2 inventory is stored for this expedition.');
      empty.dataset.inventoryState = 'absent';
      fragment.append(empty);
      this.#panelBody.replaceChildren(fragment);
      return;
    }

    if (this.#state.kind === 'legacy-protected') {
      const notice = this.#node('p', 'inventory-protected-notice',
        `Legacy inventory is protected read-only (${this.#state.reason}). `
        + `Its exact source counts represent ${this.#state.estimatedInstanceCount} slotted copies without expanding or discarding any copy.`);
      notice.dataset.inventoryState = 'legacy-protected';
      fragment.append(notice);
      fragment.append(this.#factList([
        ['Source action', this.#state.sourceActionId],
        ['Equipped bases', GEAR_SLOTS.flatMap((slot) => this.#state?.kind === 'legacy-protected'
          && this.#state.equipped[slot] ? [`${slot}: ${this.#state.equipped[slot]}`] : []).join(' · ') || 'None recorded'],
        ['Bound affixes', GEAR_SLOTS.flatMap((slot) => {
          if (this.#state?.kind !== 'legacy-protected') return [];
          const affix = this.#state.equippedAffixes[slot];
          return affix ? [`${slot}: ${affix.k} ${textNumber(affix.v)} for ${affix.forId}`] : [];
        }).join(' · ') || 'None recorded'],
      ]));
      fragment.append(this.#queryControl());
      const list = this.#node('ul', 'inventory-legacy-list');
      list.setAttribute('aria-label', 'Protected legacy inventory counts');
      for (const row of page.rows) {
        if (row.kind !== 'legacy') continue;
        const item = this.#node('li');
        item.dataset.inventoryRow = 'legacy';
        item.dataset.baseId = row.baseId;
        item.append(this.#node('span', '', `${row.baseName} (${row.baseId})`));
        item.append(this.#node('b', '', `× ${row.count}`));
        list.append(item);
      }
      fragment.append(list);
      if (page.totalRows === 0) fragment.append(this.#node('div', 'empty', 'No protected legacy count matches this query.'));
      fragment.append(this.#pager(page));
      this.#panelBody.replaceChildren(fragment);
      return;
    }

    const inventory = this.#state.inventory;
    const summary = this.#node('p', 'inventory-summary',
      `${inventory.entries.length} / ${inventory.capacity} exact held instances · `
      + `${inventory.equipped.length} equipped · ${inventory.pendingRewards.length} pending`);
    summary.dataset.inventoryState = 'inventory';
    fragment.append(summary, this.#tools());
    if (this.#state.stackableCounts.length) {
      const stacks = this.#node('ul', 'inventory-stack-list');
      stacks.setAttribute('aria-label', 'Stackable item counts');
      for (const { baseId, count } of this.#state.stackableCounts) {
        const definition = getLootCatalogueDefinition(baseId);
        const item = this.#node('li');
        item.dataset.stackableBaseId = baseId;
        item.append(this.#node('span', '', `${definition?.name ?? baseId} (${baseId})`));
        item.append(this.#node('b', '', `× ${count}`));
        stacks.append(item);
      }
      fragment.append(stacks);
    }
    if (page.pendingCount) {
      const pending = this.#node('p', 'inventory-protected-notice',
        `${page.pendingCount} capacity-held reward${page.pendingCount === 1 ? '' : 's'} stay visible before filtered items. Open one to inspect it or claim it when Inventory has room.`);
      pending.dataset.pendingNotice = 'true';
      fragment.append(pending);
    }
    const list = this.#node('div', 'inventory-list');
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', 'Exact item instances');
    for (const row of page.rows) {
      if (row.kind === 'legacy') continue;
      list.append(this.#exactRow(row));
    }
    fragment.append(list);
    if (page.totalRows === 0) fragment.append(this.#node('div', 'empty', 'No exact item instance matches these filters.'));
    fragment.append(this.#pager(page));
    this.#panelBody.replaceChildren(fragment);
  }

  showDetail(instanceId: string, opener?: HTMLElement | null): boolean {
    this.#assertLive();
    if (this.#document.querySelectorAll('#inventorysheet').length !== 1) {
      throw new Error('Inventory detail refused a duplicate dialog owner');
    }
    const exact = this.#findExact(instanceId);
    if (!exact) return false;
    if (this.#selectedInstanceId !== instanceId) this.#salvageConfirmationFor = null;
    const inspection = inspectGear(exact.entry.instance);
    const equippedEntry = this.#equippedInSlot(inspection.slot);
    const equippedInspection = equippedEntry ? inspectGear(equippedEntry.instance) : null;
    const comparison = compareGear(exact.entry.instance, equippedEntry?.instance ?? null);
    const detail = this.#detail(inspection, equippedInspection, comparison, exact);
    if (!inventoryComparisonDomComplete(detail, comparison)) {
      throw new Error('Inventory detail dropped an exact comparison delta');
    }

    this.#sheetBody.replaceChildren(detail);
    this.#sheetTitle.textContent = `Inspect ${inspection.baseName}`;
    this.#selectedInstanceId = inspection.instanceId;
    this.#focusReturn = opener ?? (this.#document.activeElement as HTMLElement | null);
    if (!this.#active) this.#lockBackground();
    this.#active = true;
    this.#sheet.hidden = false;
    this.#sheet.setAttribute('aria-hidden', 'false');
    this.#document.body.classList.add('inventory-sheet-open');
    this.#sheetClose.focus();
    return true;
  }

  closeDetail(restoreFocus = true): void {
    if (!this.#active && this.#sheetBody.childElementCount === 0) {
      this.#salvageConfirmationFor = null;
      return;
    }
    const focusReturn = this.#focusReturn;
    this.#active = false;
    this.#selectedInstanceId = null;
    this.#focusReturn = null;
    this.#salvageConfirmationFor = null;
    this.#sheet.hidden = true;
    this.#sheet.setAttribute('aria-hidden', 'true');
    this.#sheetBody.replaceChildren();
    this.#sheetTitle.textContent = 'Item inspection';
    this.#document.body.classList.remove('inventory-sheet-open');
    this.#unlockBackground();
    if (restoreFocus && focusReturn?.isConnected) {
      try { focusReturn.focus(); } catch { /* detached/disabled return targets are inert */ }
    }
  }

  diagnostics(): InventorySheetDiagnostics {
    const ownedDetails = this.#sheetBody.querySelectorAll('[data-inventory-detail]').length;
    const duplicateSheets = Math.max(0, this.#document.querySelectorAll('#inventorysheet').length - 1);
    return Object.freeze({
      schema: 'cf-v2-inventory-sheet-diagnostics/v1',
      activeCount: this.#active ? 1 : 0,
      retainedCount: duplicateSheets + Math.max(0, ownedDetails - (this.#active ? 1 : 0)),
      pendingWork: this.#pendingAction ? 1 : 0,
      selectedInstanceId: this.#selectedInstanceId,
      lastAction: this.#lastAction,
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#panelOpen = false;
    this.closeDetail(false);
    if (this.#deferWhileClosed) this.#panelBody.replaceChildren();
    this.#removeListeners();
    this.#disposed = true;
  }

  #installListeners(): void {
    if (this.#listenersInstalled) return;
    this.#panelBody.addEventListener('click', this.#onPanelClick);
    this.#panelBody.addEventListener('input', this.#onPanelInput);
    this.#panelBody.addEventListener('change', this.#onPanelChange);
    this.#sheet.addEventListener('click', this.#onSheetClick);
    this.#document.addEventListener('keydown', this.#onKeyDown, true);
    this.#document.addEventListener('focusin', this.#onFocusIn, true);
    this.#listenersInstalled = true;
  }

  #removeListeners(): void {
    if (!this.#listenersInstalled) return;
    this.#panelBody.removeEventListener('click', this.#onPanelClick);
    this.#panelBody.removeEventListener('input', this.#onPanelInput);
    this.#panelBody.removeEventListener('change', this.#onPanelChange);
    this.#sheet.removeEventListener('click', this.#onSheetClick);
    this.#document.removeEventListener('keydown', this.#onKeyDown, true);
    this.#document.removeEventListener('focusin', this.#onFocusIn, true);
    this.#listenersInstalled = false;
  }

  #assertLive(): void {
    if (this.#disposed) throw new Error('Inventory panel controller is disposed');
  }

  #filterRequest(): GearInventoryFilter {
    return {
      ...(this.#query ? { query: this.#query } : {}),
      ...(this.#slot === 'all' ? {} : { slots: [this.#slot] }),
      ...(this.#rarity === 'all' ? {} : { rarities: [this.#rarity] }),
      ...(this.#status === 'equipped' ? { equippedOnly: true }
        : this.#status === 'protected' ? { protectedOnly: true } : {}),
    };
  }

  #node<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = '',
    text = '',
  ): HTMLElementTagNameMap[K] {
    const node = this.#document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  #queryControl(): HTMLElement {
    const label = this.#node('label');
    label.append(this.#node('span', 'sr-only', 'Filter protected legacy counts'));
    const input = this.#node('input');
    input.type = 'search';
    input.autocomplete = 'off';
    input.value = this.#query;
    input.placeholder = 'Filter exact source counts';
    input.setAttribute('aria-label', 'Filter protected legacy counts');
    input.dataset.inventoryQuery = 'true';
    label.append(input);
    const tools = this.#node('div', 'inventory-tools');
    tools.append(label);
    return tools;
  }

  #tools(): HTMLElement {
    const tools = this.#node('div', 'inventory-tools');
    const queryLabel = this.#node('label');
    queryLabel.append(this.#node('span', 'sr-only', 'Filter exact items'));
    const query = this.#node('input');
    query.type = 'search';
    query.autocomplete = 'off';
    query.value = this.#query;
    query.placeholder = 'Name, base, affix or tag';
    query.setAttribute('aria-label', 'Filter exact items');
    query.dataset.inventoryQuery = 'true';
    queryLabel.append(query);
    tools.append(queryLabel);

    const slot = this.#node('select');
    slot.setAttribute('aria-label', 'Filter items by slot');
    slot.dataset.inventorySlot = 'true';
    slot.append(option(this.#document, 'all', 'All slots', this.#slot === 'all'));
    for (const value of GEAR_SLOTS) slot.append(option(this.#document, value, value, this.#slot === value));
    tools.append(slot);

    const rarity = this.#node('select');
    rarity.setAttribute('aria-label', 'Filter items by rarity');
    rarity.dataset.inventoryRarity = 'true';
    rarity.append(option(this.#document, 'all', 'All rarities', this.#rarity === 'all'));
    for (const value of GEAR_RARITIES) rarity.append(option(this.#document, value, value, this.#rarity === value));
    tools.append(rarity);

    const status = this.#node('select');
    status.setAttribute('aria-label', 'Filter items by status');
    status.dataset.inventoryStatus = 'true';
    status.append(
      option(this.#document, 'all', 'All states', this.#status === 'all'),
      option(this.#document, 'equipped', 'Equipped', this.#status === 'equipped'),
      option(this.#document, 'protected', 'Protected', this.#status === 'protected'),
    );
    tools.append(status);
    return tools;
  }

  #pager(page: InventoryPanelPage): HTMLElement {
    const pager = this.#node('div', 'inventory-pager');
    const previous = this.#node('button');
    previous.type = 'button';
    previous.dataset.inventoryPage = 'previous';
    previous.setAttribute('aria-label', 'Previous inventory page');
    previous.textContent = '‹';
    previous.disabled = page.page === 0;
    const label = this.#node('span', '', `Page ${page.page + 1} of ${page.pageCount} · ${page.totalRows} rows`);
    label.dataset.inventoryPageLabel = 'true';
    const next = this.#node('button');
    next.type = 'button';
    next.dataset.inventoryPage = 'next';
    next.setAttribute('aria-label', 'Next inventory page');
    next.textContent = '›';
    next.disabled = page.page + 1 >= page.pageCount;
    pager.append(previous, label, next);
    return pager;
  }

  #exactRow(row: InventoryExactRow): HTMLButtonElement {
    const inspection = inspectGear(row.entry.instance);
    const button = this.#node('button', 'inventory-row');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'inventorysheet');
    button.setAttribute('aria-label', `Inspect exact ${inspection.baseName} instance ${inspection.instanceId}`);
    button.dataset.inventoryRow = 'exact';
    button.dataset.instanceId = inspection.instanceId;
    button.dataset.baseId = inspection.baseId;
    button.dataset.pending = String(row.pending);
    button.dataset.equipped = String(row.equipped);
    button.dataset.favorite = String(row.entry.favorite);
    button.dataset.locked = String(row.entry.locked);
    const copy = this.#node('span', 'inventory-row-copy');
    copy.append(this.#node('b', '', `${inspection.baseName} · ${inspection.rarity}`));
    copy.append(this.#node('small', '',
      `${inspection.slot} · item level ${inspection.itemLevel} · quality ${inspection.quality}`));
    copy.append(this.#node('small', '', inspection.instanceId));
    const badges = this.#node('span', 'inventory-badges');
    if (row.pending) badges.append(this.#badge('Pending capacity claim', 'pending'));
    if (row.equipped) badges.append(this.#badge('Equipped', 'protected'));
    if (row.entry.favorite) badges.append(this.#badge('Favorite', 'protected'));
    if (row.entry.locked) badges.append(this.#badge('Locked', 'protected'));
    button.append(copy, badges);
    return button;
  }

  #badge(label: string, state: 'pending' | 'protected'): HTMLElement {
    const badge = this.#node('span', 'inventory-badge', label);
    badge.dataset.state = state;
    return badge;
  }

  #factList(rows: readonly (readonly [string, string])[]): HTMLDListElement {
    const list = this.#node('dl', 'inventory-facts');
    for (const [term, description] of rows) {
      list.append(this.#node('dt', '', term), this.#node('dd', '', description));
    }
    return list;
  }

  #findExact(instanceId: string): InventoryExactRow | null {
    if (this.#state?.kind !== 'inventory') return null;
    const equippedIds = new Set(this.#state.inventory.equipped.map((binding) => binding.instanceId));
    const held = this.#state.inventory.entries.find((entry) => entry.instance.instanceId === instanceId);
    if (held) return Object.freeze({
      kind: 'entry', instanceId, entry: held,
      equipped: equippedIds.has(instanceId), pending: false,
    });
    const pending = this.#state.inventory.pendingRewards.find((reward) => reward.instance.instanceId === instanceId);
    return pending ? Object.freeze({
      kind: 'pending', instanceId,
      entry: Object.freeze({ instance: pending.instance, favorite: false, locked: false }),
      equipped: false, pending: true,
    }) : null;
  }

  #equippedInSlot(slot: GearSlot): GearInventoryEntry | null {
    if (this.#state?.kind !== 'inventory') return null;
    const binding = this.#state.inventory.equipped.find((candidate) => candidate.slot === slot);
    return binding
      ? this.#state.inventory.entries.find((entry) => entry.instance.instanceId === binding.instanceId) ?? null
      : null;
  }

  #detail(
    inspection: ReturnType<typeof inspectGear>,
    equipped: ReturnType<typeof inspectGear> | null,
    comparison: GearComparison,
    row: InventoryExactRow,
  ): HTMLElement {
    const article = this.#node('article', 'inventory-detail');
    article.dataset.inventoryDetail = inspection.instanceId;
    const protections = [
      ...(row.pending ? ['pending capacity claim'] : []),
      ...(row.equipped ? ['equipped'] : []),
      ...(row.entry.favorite ? ['favorite'] : []),
      ...(row.entry.locked ? ['locked'] : []),
    ];
    const modifierText = (modifier: typeof inspection.craftedModifier): string => modifier
      ? `${modifier.affixId} · tier ${modifier.tier} · ${textNumber(modifier.value)}` : 'None recorded';
    article.append(this.#factList([
      ['Exact instance', inspection.instanceId],
      ['Base', `${inspection.baseName} (${inspection.baseId})`],
      ['Slot', inspection.slot],
      ['Rarity', `${inspection.rarity} · tier ${inspection.rarityTier}`],
      ['Item level', String(inspection.itemLevel)],
      ['Quality', String(inspection.quality)],
      ['Base tier', String(inspection.baseTier)],
      ['State', protections.join(' · ') || 'Held, unprotected'],
      ['Derived compatibility facets', inspection.tags.join(' · ') || 'None recorded'],
      ['Authored targeting tags', 'Not present in the current Arc 2 authority'],
      ['Implicit keys', inspection.implicits.join(' · ') || 'None recorded'],
      ['Natural affixes', inspection.naturalAffixes.length
        ? inspection.naturalAffixes.map((affix) => `${affix.role} ${affix.affixId} · tier ${affix.tier} · ${textNumber(affix.value)}`).join(' · ')
        : 'None recorded'],
      ['Crafted modifier', modifierText(inspection.craftedModifier)],
      ['Drawback', modifierText(inspection.drawback)],
      ['Upgrade state', String(inspection.upgrade)],
      ['Sockets', inspection.sockets.join(' · ') || 'None recorded'],
      ['Construction', row.entry.instance.construction],
      ['Source kind', inspection.provenance.kind],
      ['Source action', inspection.provenance.sourceActionId],
      ['World provenance', inspection.provenance.worldId ?? 'None recorded'],
      ['Mission provenance', inspection.provenance.missionId ?? 'None recorded'],
      ['Receipt provenance', inspection.provenance.receiptId ?? 'None recorded'],
      ['Generation', `seed ${inspection.generation.seed} · ordinal ${inspection.generation.ordinal}`],
    ]));

    article.append(this.#node('h3', '', 'Exact effects'));
    const effects = this.#node('ul', 'inventory-effect-list');
    for (const effect of inspection.effects) {
      const item = this.#node('li');
      item.dataset.inventoryEffect = effect.key;
      item.dataset.condition = conditionData(effect.condition);
      item.append(
        this.#node('span', '', effect.label),
        this.#node('span', '', effect.source),
        this.#node('span', '', conditionWording(effect.condition)),
        this.#node('b', '', textNumber(effect.value, effect.percent)),
      );
      effects.append(item);
    }
    if (!inspection.effects.length) effects.append(this.#node('li', '', 'No effects recorded.'));
    article.append(effects, this.#node('h3', '', equipped
      ? `Compared with equipped ${equipped.baseName} (${equipped.instanceId})`
      : `No item equipped in ${inspection.slot}; candidate compared with zero`));

    const compareList = this.#node('ul', 'inventory-compare-list');
    compareList.setAttribute('aria-label', 'Exact equipped comparison');
    const compareHead = this.#node('li');
    compareHead.setAttribute('aria-hidden', 'true');
    compareHead.append(
      this.#node('b', '', 'Field'),
      this.#node('b', '', 'Equipped'),
      this.#node('b', '', 'Candidate'),
      this.#node('b', '', 'Delta'),
    );
    compareList.append(
      compareHead,
      this.#comparisonAxis('itemLevel', 'Item level',
        equipped?.itemLevel ?? 0, inspection.itemLevel, comparison.itemLevelDelta),
      this.#comparisonAxis('quality', 'Quality',
        equipped?.quality ?? 0, inspection.quality, comparison.qualityDelta),
    );
    const labels = new Map<string, Readonly<{ label: string; percent: boolean }>>();
    for (const effect of [...(equipped?.effects ?? []), ...inspection.effects]) {
      if (!labels.has(effect.key)) labels.set(effect.key, { label: effect.label, percent: effect.percent });
    }
    for (const effect of comparison.effects) {
      const meta = labels.get(effect.key) ?? { label: effect.key, percent: false };
      const item = this.#node('li');
      item.dataset.compareEffect = 'true';
      item.dataset.effectKey = effect.key;
      item.dataset.condition = conditionData(effect.condition);
      setDataNumber(item, 'equipped', effect.equipped);
      setDataNumber(item, 'candidate', effect.candidate);
      setDataNumber(item, 'delta', effect.delta);
      item.append(
        this.#node('span', '', `${meta.label} · ${conditionWording(effect.condition)}`),
        this.#node('span', '', textNumber(effect.equipped, meta.percent)),
        this.#node('span', '', textNumber(effect.candidate, meta.percent)),
        this.#delta(effect.delta, meta.percent),
      );
      compareList.append(item);
    }
    article.append(compareList);
    if (this.#actionAdapter) article.append(this.#actions(inspection, row));
    else {
      const boundary = this.#node('p', 'inventory-protected-notice',
        'Inspection only: this surface does not equip, protect, claim, salvage, upgrade, socket, or craft items.');
      boundary.dataset.inventoryMutationBoundary = 'read-only';
      article.append(boundary);
    }
    return article;
  }

  #comparisonAxis(
    key: 'itemLevel' | 'quality',
    label: string,
    equipped: number,
    candidate: number,
    delta: number,
  ): HTMLLIElement {
    const item = this.#node('li');
    item.dataset.compareAxis = key;
    setDataNumber(item, 'equipped', equipped);
    setDataNumber(item, 'candidate', candidate);
    setDataNumber(item, 'delta', delta);
    item.append(
      this.#node('span', '', label),
      this.#node('span', '', String(equipped)),
      this.#node('span', '', String(candidate)),
      this.#delta(delta),
    );
    return item;
  }

  #delta(value: number, percent = false): HTMLElement {
    const node = this.#node('b', 'inventory-delta', textNumber(value, percent));
    node.dataset.sign = deltaSign(value);
    return node;
  }

  #actions(
    inspection: ReturnType<typeof inspectGear>,
    row: InventoryExactRow,
  ): HTMLElement {
    const section = this.#node('section', 'inventory-actions');
    section.setAttribute('aria-label', 'Exact item actions');
    const controls = this.#node('div', 'inventory-action-controls');
    if (row.pending) {
      const full = this.#state?.kind === 'inventory'
        && this.#state.inventory.entries.length >= this.#state.inventory.capacity;
      controls.append(this.#actionButton(
        'pending-claim', inspection.instanceId,
        full ? 'Claim unavailable — Inventory full' : 'Claim pending reward',
        full ? 'inventory-full' : null,
      ));
    } else {
      controls.append(this.#actionButton(
        row.equipped ? 'unequip' : 'equip',
        inspection.instanceId,
        row.equipped ? 'Unequip exact item' : 'Equip exact item',
        null,
      ));
      const protection = row.equipped ? 'equipped'
        : row.entry.favorite ? 'favorite'
          : row.entry.locked ? 'locked' : null;
      controls.append(this.#actionButton(
        'salvage', inspection.instanceId,
        protection ? `Salvage protected — ${protection}` : 'Salvage exact item',
        protection,
      ));
    }
    const status = this.#node('p', 'inventory-action-status');
    status.dataset.inventoryActionStatus = 'true';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const last = this.#lastAction;
    if (last?.instanceId === inspection.instanceId) {
      status.dataset.kind = last.kind;
      status.textContent = `${last.kind}: ${last.detail}`;
    } else status.textContent = 'Choose one exact-instance action.';
    section.append(controls, status);
    return section;
  }

  #actionButton(
    operation: InventoryPanelActionOperation,
    instanceId: string,
    label: string,
    refusedReason: string | null,
  ): HTMLButtonElement {
    const blockedReason = refusedReason ?? (this.#convergencePending ? 'convergence-reload' : null);
    const button = this.#node('button');
    button.type = 'button';
    button.dataset.inventoryAction = operation;
    button.dataset.instanceId = instanceId;
    button.dataset.actionEnabled = String(blockedReason === null);
    if (blockedReason !== null) button.dataset.protectedReason = blockedReason;
    button.disabled = blockedReason !== null || this.#pendingAction !== null;
    button.textContent = label;
    return button;
  }

  #setActionBusy(busy: boolean): void {
    this.#sheet.setAttribute('aria-busy', String(busy));
    for (const button of this.#sheetBody.querySelectorAll<HTMLButtonElement>('[data-inventory-action]')) {
      button.disabled = busy || button.dataset.actionEnabled !== 'true';
    }
  }

  #setActionStatus(message: string, kind: string): void {
    const status = this.#sheetBody.querySelector<HTMLElement>('[data-inventory-action-status]');
    if (!status) return;
    status.dataset.kind = kind;
    status.textContent = message;
  }

  #rowButton(instanceId: string): HTMLButtonElement | null {
    return [...this.#panelBody.querySelectorAll<HTMLButtonElement>('[data-inventory-row="exact"]')]
      .find((button) => button.dataset.instanceId === instanceId) ?? null;
  }

  #panelFocusTarget(preferredInstanceId?: string): HTMLElement | null {
    if (preferredInstanceId) {
      const row = this.#rowButton(preferredInstanceId);
      if (row) return row;
    }
    return this.#panelBody.querySelector<HTMLElement>('[data-inventory-row="exact"]')
      ?? this.#panel.querySelector<HTMLElement>('[data-pnx]')
      ?? this.#openers.find((opener): opener is HTMLElement => !!opener?.isConnected)
      ?? (() => {
        this.#panel.tabIndex = -1;
        return this.#panel;
      })();
  }

  #recordAction(
    request: InventoryPanelActionRequest,
    outcome: Pick<InventoryPanelActionOutcome, 'kind' | 'detail'>,
  ): void {
    this.#lastAction = Object.freeze({ ...request, kind: outcome.kind, detail: outcome.detail });
  }

  async #runAction(
    operation: InventoryPanelActionOperation,
    instanceId: string,
    sourceButton: HTMLButtonElement,
  ): Promise<void> {
    const adapter = this.#actionAdapter;
    if (!adapter || this.#pendingAction || this.#convergencePending
      || this.#selectedInstanceId !== instanceId) return;
    const request: InventoryPanelActionRequest = Object.freeze({ operation, instanceId });
    if (operation === 'salvage' && this.#salvageConfirmationFor !== instanceId) {
      let confirmationRequired = false;
      try { confirmationRequired = this.#requiresSalvageConfirmation(request); }
      catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        this.#recordAction(request, { kind: 'refused', detail });
        this.#setActionStatus(`refused: ${detail}`, 'refused');
        return;
      }
      if (confirmationRequired) {
        this.#salvageConfirmationFor = instanceId;
        sourceButton.dataset.confirmation = 'required';
        sourceButton.textContent = 'Confirm salvage exact item';
        this.#setActionStatus('Confirm salvage to destroy this exact unprotected instance.', 'confirmation-required');
        sourceButton.focus();
        return;
      }
    }
    this.#salvageConfirmationFor = null;
    this.#pendingAction = request;
    this.#setActionBusy(true);
    this.#setActionStatus(`${operation} pending…`, 'pending');
    let outcome: InventoryPanelActionOutcome;
    try {
      const candidate = await adapter(request);
      if (!candidate || !['committed', 'unchanged', 'unavailable', 'refused'].includes(candidate.kind)
        || typeof candidate.detail !== 'string' || !('state' in candidate)) {
        outcome = { kind: 'refused', detail: 'invalid action adapter outcome', state: null };
      } else outcome = candidate;
    } catch (error) {
      outcome = {
        kind: 'refused',
        detail: error instanceof Error ? error.message : String(error),
        state: null,
      };
    }
    if (this.#pendingAction !== request) return;
    const selectedAtSettlement = this.#active ? this.#selectedInstanceId : null;
    this.#pendingAction = null;
    if (this.#disposed) return;
    this.#setActionBusy(false);
    this.#recordAction(request, outcome);
    if (outcome.kind === 'committed' && outcome.state?.kind !== 'inventory') {
      /* Durability is terminal even when the app deliberately withholds a
         failed post-commit publication and schedules convergence reload. Do
         not relabel that receipt-backed action refused or invite a retry. */
      this.#convergencePending = true;
      for (const button of this.#sheetBody.querySelectorAll<HTMLButtonElement>('[data-inventory-action]')) {
        button.disabled = true;
        button.dataset.actionEnabled = 'false';
        button.dataset.protectedReason = 'convergence-reload';
      }
      if (selectedAtSettlement === instanceId) {
        this.#setActionStatus(`committed: ${outcome.detail}`, 'committed-convergence');
        this.#sheetClose.focus();
      }
      return;
    }
    if (outcome.kind !== 'committed' || !outcome.state) {
      if (selectedAtSettlement === instanceId) {
        this.#setActionStatus(`${outcome.kind}: ${outcome.detail}`, outcome.kind);
        const currentButton = [...this.#sheetBody.querySelectorAll<HTMLButtonElement>(
          '[data-inventory-action][data-instance-id]',
        )].find((button) => button.dataset.inventoryAction === operation
          && button.dataset.instanceId === instanceId);
        (currentButton ?? (sourceButton.isConnected ? sourceButton : this.#sheetClose)).focus();
      }
      return;
    }

    /* The adapter is the durable authority. Only its committed carrier is
       published; no local projection is applied while the promise is open. */
    this.#state = outcome.state;
    if (!this.#deferWhileClosed || this.#panelOpen) this.render();
    if (selectedAtSettlement === null) return;
    if (operation === 'salvage' && selectedAtSettlement === instanceId) {
      this.#focusReturn = this.#panelFocusTarget();
      this.closeDetail(true);
      return;
    }
    const focusReturn = this.#panelFocusTarget(selectedAtSettlement);
    if (!this.showDetail(selectedAtSettlement, focusReturn)) {
      this.#focusReturn = focusReturn;
      this.closeDetail(true);
      return;
    }
    if (selectedAtSettlement === instanceId) {
      this.#setActionStatus(`committed: ${outcome.detail}`, 'committed');
    }
  }

  #lockBackground(): void {
    this.#background.clear();
    for (const candidate of [...this.#document.body.children]) {
      if (!(candidate instanceof this.#document.defaultView!.HTMLElement) || candidate === this.#sheet) continue;
      this.#background.set(candidate, Object.freeze({
        inert: candidate.inert,
        ariaHidden: candidate.getAttribute('aria-hidden'),
      }));
      candidate.inert = true;
      candidate.setAttribute('aria-hidden', 'true');
    }
  }

  #unlockBackground(): void {
    for (const [candidate, prior] of this.#background) {
      candidate.inert = prior.inert;
      if (prior.ariaHidden === null) candidate.removeAttribute('aria-hidden');
      else candidate.setAttribute('aria-hidden', prior.ariaHidden);
    }
    this.#background.clear();
  }

  #focusableInSheet(): HTMLElement[] {
    return [...this.#sheet.querySelectorAll<HTMLElement>(
      'button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hidden
      && !('disabled' in element && (element as HTMLButtonElement).disabled)
      && !element.closest('[hidden]'));
  }

  readonly #onPanelClick = (event: Event): void => {
    const target = event.target as Element | null;
    const pager = target?.closest<HTMLButtonElement>('[data-inventory-page]');
    if (pager) {
      const direction = pager.dataset.inventoryPage;
      this.#page = Math.max(0, this.#page + (direction === 'next' ? 1 : -1));
      this.render();
      this.#panelBody.querySelector<HTMLButtonElement>(`[data-inventory-page="${direction}"]`)?.focus();
      return;
    }
    const row = target?.closest<HTMLButtonElement>('[data-inventory-row="exact"][data-instance-id]');
    if (row?.dataset.instanceId) this.showDetail(row.dataset.instanceId, row);
  };

  readonly #onPanelInput = (event: Event): void => {
    const target = event.target as HTMLInputElement | null;
    if (!target?.matches('[data-inventory-query]')) return;
    this.#query = target.value;
    this.#page = 0;
    const selection = target.selectionStart ?? target.value.length;
    this.render();
    const replacement = this.#panelBody.querySelector<HTMLInputElement>('[data-inventory-query]');
    replacement?.focus();
    replacement?.setSelectionRange(selection, selection);
  };

  readonly #onPanelChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement | null;
    if (!target) return;
    if (target.matches('[data-inventory-slot]')) {
      this.#slot = target.value === 'all' ? 'all' : target.value as GearSlot;
    } else if (target.matches('[data-inventory-rarity]')) {
      this.#rarity = target.value === 'all' ? 'all' : target.value as GearRarity;
    } else if (target.matches('[data-inventory-status]')) {
      this.#status = target.value as InventoryStatusFilter;
    } else return;
    this.#page = 0;
    this.render();
  };

  readonly #onSheetClick = (event: Event): void => {
    const target = event.target as Element | null;
    const action = target?.closest<HTMLButtonElement>(
      '[data-inventory-action][data-instance-id]',
    );
    if (action?.dataset.instanceId) {
      const operation = action.dataset.inventoryAction;
      if (operation === 'equip' || operation === 'unequip'
        || operation === 'salvage' || operation === 'pending-claim') {
        void this.#runAction(operation, action.dataset.instanceId, action);
      }
      return;
    }
    if (target?.closest('[data-inventory-sheet-close]')) this.closeDetail();
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (!this.#active) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeDetail();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = this.#focusableInSheet();
    if (!focusable.length) {
      event.preventDefault();
      this.#sheetClose.focus();
      return;
    }
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && this.#document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && this.#document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  };

  readonly #onFocusIn = (event: FocusEvent): void => {
    if (!this.#active || this.#sheet.contains(event.target as Node)) return;
    this.#sheetClose.focus();
  };
}
