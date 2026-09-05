/* Arc 3 Engineering/Shipyard presentation owner.

   Main owns the one durable coordinator. This controller consumes only a
   detached, deeply frozen read model, emits one immutable synchronous request,
   and waits for Main to publish pending/settled state. It never plans, spends,
   awaits, retries, or optimistically changes an expedition fact. */
import { RESEARCH_IDS } from '@cf/domain-opportunity';
import type { ShipInstalledSystemId, ShipVisualState } from '@cf/scene';
import { ShipyardPreviewOwner, shipVisualStateKey } from './shipyard-preview.js';

export const ENGINEERING_PANEL_READ_MODEL_SCHEMA = 'cf-v2-engineering-panel-read-model/v1' as const;
export const ENGINEERING_PANEL_DIAGNOSTICS_SCHEMA = 'cf-v2-engineering-panel-diagnostics/v1' as const;

export const ENGINEERING_RESEARCH_ORDER = RESEARCH_IDS;

export type EngineeringResearchRowId = (typeof ENGINEERING_RESEARCH_ORDER)[number];
export type EngineeringOpportunityStatus = 'ready' | 'worked-out' | 'waiting' | 'unavailable';
export type EngineeringRowStatus = 'owned' | 'available' | 'unavailable';
export type EngineeringRecipeOutputKind = 'stackable' | 'gear-instance' | 'permanent-system';
export type EngineeringPanelOperation = 'mine' | 'skim' | 'research' | 'fabricate';

export interface EngineeringPanelActionRequest {
  readonly operation: EngineeringPanelOperation;
  readonly id?: string;
}

export interface EngineeringCostQuantity {
  readonly id: string;
  readonly label: string;
  readonly required: number;
  readonly owned: number;
}

export interface EngineeringGateCost {
  readonly id: string;
  readonly label: string;
  readonly owned: boolean;
}

export interface EngineeringPanelCosts {
  readonly materials: readonly EngineeringCostQuantity[];
  readonly parts: readonly EngineeringCostQuantity[];
  readonly stardust: Readonly<{ required: number; owned: number }>;
  readonly signature: EngineeringGateCost | null;
  readonly prerequisite: EngineeringGateCost | null;
}

export interface EngineeringMiningDepositReadModel {
  readonly id: string;
  readonly label: string;
  /** Null means this reveal level does not own a grade fact. */
  readonly grade: string | null;
}

export interface EngineeringMiningReadModel {
  readonly locationLabel: string;
  readonly status: EngineeringOpportunityStatus;
  readonly detail: string;
  readonly deposits: readonly EngineeringMiningDepositReadModel[];
  /** Null means remaining pulls are not revealed, never an infinite reserve. */
  readonly pullsRemaining: number | null;
  /** Exact ready load count; null means no applicable Auto-Extractor fact. */
  readonly autoExtractorDue: number | null;
}

export interface EngineeringSkimmingReadModel {
  readonly starLabel: string;
  readonly status: EngineeringOpportunityStatus;
  readonly detail: string;
  readonly material: string | null;
  readonly passesRemaining: number | null;
  readonly nextDamage: number | null;
}

export interface EngineeringResearchRowReadModel {
  readonly id: EngineeringResearchRowId;
  readonly name: string;
  readonly description: string;
  readonly status: EngineeringRowStatus;
  /** Null only when status is available. Otherwise this is painted verbatim. */
  readonly reason: string | null;
  readonly costs: EngineeringPanelCosts;
}

export interface EngineeringFabricationRowReadModel {
  readonly baseId: string;
  readonly name: string;
  readonly category: string;
  readonly status: EngineeringRowStatus;
  /** Null only when status is available. Otherwise this is painted verbatim. */
  readonly reason: string | null;
  readonly costs: EngineeringPanelCosts;
  readonly effectSupport: 'live' | 'unavailable';
  readonly effectDetail: string;
  readonly outputKind: EngineeringRecipeOutputKind;
  readonly owned: number;
  readonly outputQuantity: number;
  /** Null means the model owns no finite capacity ceiling for this output. */
  readonly capacityRemaining: number | null;
}

export interface EngineeringFabricationGroupReadModel {
  readonly id: string;
  readonly name: string;
  readonly recipes: readonly EngineeringFabricationRowReadModel[];
}

export interface EngineeringPanelReadModelV1 {
  readonly schema: typeof ENGINEERING_PANEL_READ_MODEL_SCHEMA;
  readonly ship: ShipVisualState;
  readonly mining: EngineeringMiningReadModel;
  readonly skimming: EngineeringSkimmingReadModel;
  /** Exactly the six canonical ids in ENGINEERING_RESEARCH_ORDER. */
  readonly research: readonly EngineeringResearchRowReadModel[];
  /** Group and recipe order are presentation authority and are preserved. */
  readonly fabricationGroups: readonly EngineeringFabricationGroupReadModel[];
}

/** One atomic presentation publication. The ship is independently derived
 * from owned capability and remains inspectable when Engineering authority is
 * protected. A verified Engineering model must carry that exact same ship. */
export interface EngineeringPanelView {
  readonly ship: ShipVisualState;
  readonly engineering: EngineeringPanelReadModelV1 | null;
  /** Required only while Engineering details and actions are unavailable. */
  readonly reason: string | null;
}

export interface EngineeringPanelRegistration {
  readonly id: 'shipyard';
  readonly el: HTMLElement;
  readonly btns: Array<HTMLElement | null>;
  readonly onOpen: () => void;
  readonly onClose: () => void;
}

export interface EngineeringPanelDiagnostics {
  readonly schema: typeof ENGINEERING_PANEL_DIAGNOSTICS_SCHEMA;
  readonly activeCount: 0 | 1;
  readonly retainedDomCount: number;
  readonly pendingWork: 0 | 1;
  readonly actionControlCount: number;
  readonly activePreviewCount: 0 | 1;
  /** Exact key read from the one live owner/DOM pair; null on any mismatch. */
  readonly previewStateKey: string | null;
  readonly retainedPreviewCount: number;
  readonly delegatedListenerCount: 0 | 1;
  readonly faultCount: number;
  readonly lastRequest: EngineeringPanelActionRequest | null;
}

export interface EngineeringPanelControllerOptions {
  readonly panel: HTMLElement;
  readonly body?: HTMLElement;
  readonly openers?: readonly (HTMLElement | null)[];
  /** Called synchronously. Any returned promise is deliberately ignored. */
  readonly onAction?: (request: EngineeringPanelActionRequest) => void;
}

const SHIP_CHASSIS = Object.freeze([
  Object.freeze({ name: 'Scout', reach: 'Chemical-system reach' }),
  Object.freeze({ name: 'Jump', reach: 'Interstellar reach' }),
  Object.freeze({ name: 'Survey Cruiser', reach: 'Survey-array reach' }),
  Object.freeze({ name: 'Frontier', reach: 'Intergalactic reach' }),
] as const);

const SHIP_SYSTEM_NAMES: Readonly<Record<ShipInstalledSystemId, string>> = Object.freeze({
  jumpdrive: 'Jump Drive',
  array: 'Long-Range Array',
  igdrive: 'Intergalactic Drive',
  autoext: 'Auto-Extractor',
  cscoop: 'Corona Scoop',
});

const SHIP_SYSTEM_ORDER = Object.freeze([
  'jumpdrive', 'array', 'igdrive', 'autoext', 'cscoop',
] as const satisfies readonly ShipInstalledSystemId[]);

const DORMANT_EFFECT_REASON = 'Gameplay effect is not connected; fabrication is unavailable.';
const COORDINATOR_UNAVAILABLE_REASON = 'Engineering action coordinator is unavailable.';
const PENDING_REASON = 'Another engineering action is pending.';

interface ViewReceipt {
  readonly focusKey: string | null;
  readonly semanticKey: string | null;
  /** Native details are visibility owners. Reopen them before restoring focus. */
  readonly openSectionIds: readonly string[];
}

interface SettlementFocusReceipt {
  readonly focusKey: string;
  readonly semanticKey: string | null;
}

function assertCounter(value: number | null, label: string): void {
  if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
    throw new RangeError(`${label} must be a non-negative safe integer or null`);
  }
}

function assertFrozenData(value: unknown, label: string, seen = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new RangeError(`${label} contains a non-finite number`);
    return;
  }
  if (typeof value !== 'object') throw new TypeError(`${label} must contain only plain data`);
  if (seen.has(value)) throw new TypeError(`${label} must be detached and acyclic`);
  seen.add(value);
  if (!Object.isFrozen(value)) throw new TypeError(`${label} must be deeply frozen`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null && prototype !== Array.prototype) {
    throw new TypeError(`${label} must contain only plain objects and arrays`);
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string') throw new TypeError(`${label} must not contain symbol keys`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`${label}.${key} must be a data property`);
    }
    assertFrozenData(descriptor.value, `${label}.${key}`, seen);
  }
  seen.delete(value);
}

function assertStatusReason(
  status: EngineeringRowStatus,
  reason: string | null,
  label: string,
): void {
  if (status === 'available' && reason !== null) {
    throw new TypeError(`${label} available status must have a null reason`);
  }
  if (status !== 'available' && (typeof reason !== 'string' || reason.trim().length === 0)) {
    throw new TypeError(`${label} ${status} status requires a precise reason`);
  }
}

function assertCosts(costs: EngineeringPanelCosts, label: string): void {
  const ids = new Set<string>();
  for (const [kind, rows] of [['materials', costs.materials], ['parts', costs.parts]] as const) {
    for (const row of rows) {
      if (!row.id || ids.has(`${kind}:${row.id}`)) throw new TypeError(`${label} repeats or omits a ${kind} id`);
      ids.add(`${kind}:${row.id}`);
      assertCounter(row.required, `${label} ${kind} ${row.id} required`);
      assertCounter(row.owned, `${label} ${kind} ${row.id} owned`);
    }
  }
  assertCounter(costs.stardust.required, `${label} Stardust required`);
  assertCounter(costs.stardust.owned, `${label} Stardust owned`);
}

function assertShip(ship: ShipVisualState): void {
  if (!Number.isInteger(ship.chassisStage) || ship.chassisStage < 0 || ship.chassisStage > 3) {
    throw new RangeError('engineering ship chassis stage must be 0 through 3');
  }
  if (!Number.isInteger(ship.liverySeed) || ship.liverySeed < 0 || ship.liverySeed > 0xffff_ffff) {
    throw new RangeError('engineering ship livery seed must be uint32');
  }
  const order = ship.installedSystemIds.map((id) => SHIP_SYSTEM_ORDER.indexOf(id));
  if (order.some((index) => index < 0)
    || new Set(ship.installedSystemIds).size !== ship.installedSystemIds.length
    || order.some((index, position) => position > 0 && index <= order[position - 1]!)) {
    throw new TypeError('engineering ship systems must be unique and in canonical order');
  }
  const installed = new Set(ship.installedSystemIds);
  if (ship.hardpoints.array !== installed.has('array')
    || ship.hardpoints.autoext !== installed.has('autoext')
    || ship.hardpoints.cscoop !== installed.has('cscoop')) {
    throw new TypeError('engineering ship hardpoints must match installed systems');
  }
  if ((installed.has('jumpdrive') && ship.chassisStage < 1)
    || (installed.has('array') && ship.chassisStage < 2)
    || (installed.has('igdrive') && ship.chassisStage < 3)) {
    throw new TypeError('engineering ship chassis must retain owned reach capability');
  }
}

function assertReadModel(model: EngineeringPanelReadModelV1): void {
  assertFrozenData(model, 'engineering panel read model');
  if (model.schema !== ENGINEERING_PANEL_READ_MODEL_SCHEMA) {
    throw new TypeError('engineering panel read model schema is unsupported');
  }
  assertShip(model.ship);
  assertCounter(model.mining.pullsRemaining, 'mining pullsRemaining');
  assertCounter(model.mining.autoExtractorDue, 'mining autoExtractorDue');
  assertCounter(model.skimming.passesRemaining, 'skimming passesRemaining');
  assertCounter(model.skimming.nextDamage, 'skimming nextDamage');
  if (model.research.length !== ENGINEERING_RESEARCH_ORDER.length
    || model.research.some((row, index) => row.id !== ENGINEERING_RESEARCH_ORDER[index])) {
    throw new TypeError('engineering research rows must contain all six ids in canonical order');
  }
  for (const row of model.research) {
    assertStatusReason(row.status, row.reason, `research ${row.id}`);
    assertCosts(row.costs, `research ${row.id}`);
  }
  const groupIds = new Set<string>();
  const recipeIds = new Set<string>();
  for (const group of model.fabricationGroups) {
    if (!group.id || groupIds.has(group.id)) throw new TypeError('engineering fabrication group ids must be unique');
    groupIds.add(group.id);
    for (const row of group.recipes) {
      if (!row.baseId || recipeIds.has(row.baseId)) {
        throw new TypeError('engineering fabrication recipe ids must be globally unique');
      }
      recipeIds.add(row.baseId);
      assertStatusReason(row.status, row.reason, `recipe ${row.baseId}`);
      assertCosts(row.costs, `recipe ${row.baseId}`);
      assertCounter(row.owned, `recipe ${row.baseId} owned`);
      assertCounter(row.outputQuantity, `recipe ${row.baseId} outputQuantity`);
      assertCounter(row.capacityRemaining, `recipe ${row.baseId} capacityRemaining`);
      if (row.outputQuantity < 1) throw new RangeError(`recipe ${row.baseId} outputQuantity must be positive`);
    }
  }
}

function assertView(view: EngineeringPanelView): void {
  assertFrozenData(view, 'engineering panel view');
  assertShip(view.ship);
  if (view.engineering === null) {
    if (typeof view.reason !== 'string' || view.reason.trim().length === 0) {
      throw new TypeError('protected engineering panel view requires a precise unavailable reason');
    }
    return;
  }
  if (view.reason !== null) {
    throw new TypeError('verified engineering panel view must have a null unavailable reason');
  }
  assertReadModel(view.engineering);
  if (shipVisualStateKey(view.ship) !== shipVisualStateKey(view.engineering.ship)) {
    throw new TypeError('engineering model ship must match the standalone capability-derived ship');
  }
}

function sameRequest(left: EngineeringPanelActionRequest, right: EngineeringPanelActionRequest): boolean {
  return left.operation === right.operation && left.id === right.id;
}

function copyRequest(request: EngineeringPanelActionRequest): EngineeringPanelActionRequest {
  if (!['mine', 'skim', 'research', 'fabricate'].includes(request.operation)) {
    throw new RangeError('engineering panel request operation is unsupported');
  }
  if ((request.operation === 'research' || request.operation === 'fabricate')
    && (typeof request.id !== 'string' || request.id.length === 0)) {
    throw new TypeError(`${request.operation} request requires an id`);
  }
  if ((request.operation === 'mine' || request.operation === 'skim') && request.id !== undefined) {
    throw new TypeError(`${request.operation} request must not carry an id`);
  }
  return request.id === undefined
    ? Object.freeze({ operation: request.operation })
    : Object.freeze({ operation: request.operation, id: request.id });
}

export class EngineeringPanelController {
  readonly #panel: HTMLElement;
  readonly #body: HTMLElement;
  readonly #document: Document;
  readonly #openers: readonly (HTMLElement | null)[];
  readonly #onAction: EngineeringPanelControllerOptions['onAction'] | null;
  #view: EngineeringPanelView | null = null;
  #pending: EngineeringPanelActionRequest | null = null;
  #lastRequest: EngineeringPanelActionRequest | null = null;
  #emissionLocked = false;
  #active = false;
  #disposed = false;
  #listenerInstalled = false;
  #focusReturn: HTMLElement | null = null;
  #settlementFocus: SettlementFocusReceipt | null = null;
  #pendingDisabledBodyFocus = false;
  #previewOwner: ShipyardPreviewOwner | null = null;
  #previewElement: SVGSVGElement | null = null;

  constructor(options: EngineeringPanelControllerOptions) {
    this.#panel = options.panel;
    this.#document = options.panel.ownerDocument;
    this.#openers = Object.freeze([...(options.openers ?? [])]);
    this.#onAction = options.onAction ?? null;
    const bodies = [...this.#panel.querySelectorAll<HTMLElement>('[data-engineering-panel-body]')];
    if (options.body !== undefined) {
      if (bodies.length !== 1 || bodies[0] !== options.body || options.body.parentElement !== this.#panel) {
        throw new Error('Engineering panel requires exactly one direct owned body');
      }
      this.#body = options.body;
    } else {
      if (bodies.length !== 1 || bodies[0]!.parentElement !== this.#panel) {
        throw new Error('Engineering panel requires exactly one direct owned body');
      }
      this.#body = bodies[0]!;
    }
    this.#body.replaceChildren();
    this.#body.addEventListener('click', this.#onClick);
    this.#listenerInstalled = true;
  }

  setView(view: EngineeringPanelView): void {
    this.#assertLive();
    assertView(view);
    this.#view = view;
    if (this.#active) this.#render();
  }

  setPending(request: EngineeringPanelActionRequest | null): void {
    this.#assertLive();
    if (request === null) {
      const settlement = this.#settlementFocus;
      const restoreAction = settlement !== null
        && (this.#focusBelongsToSettlement(settlement) || this.#ownsPendingDisabledBodyFocus());
      this.#pending = null;
      this.#emissionLocked = false;
      this.#settlementFocus = null;
      this.#pendingDisabledBodyFocus = false;
      this.#applyActionAvailability();
      if (this.#active && restoreAction && settlement !== null) {
        this.#restoreFocusKey(settlement.focusKey, settlement.semanticKey);
      }
      return;
    }
    const copy = copyRequest(request);
    const current = this.#pending ?? (this.#emissionLocked ? this.#lastRequest : null);
    if (current !== null && !sameRequest(current, copy)) {
      throw new Error('Engineering panel cannot replace a pending action');
    }
    if (this.#settlementFocus === null) this.#retainSettlementFocus(copy);
    this.#pending = copy;
    this.#emissionLocked = true;
    this.#lastRequest = copy;
    this.#applyActionAvailabilityWithFocusProof();
  }

  registration(): EngineeringPanelRegistration {
    this.#assertLive();
    return Object.freeze({
      id: 'shipyard',
      el: this.#panel,
      btns: [...this.#openers],
      onOpen: this.#onOpen,
      onClose: this.#onClose,
    });
  }

  diagnostics(): EngineeringPanelDiagnostics {
    const previews = [...this.#panel.querySelectorAll<SVGSVGElement>('[data-cf-shipyard-preview="v1"]')];
    const owner = this.#previewOwner?.diagnostics() ?? null;
    const ownerClaimsActive = owner?.activePreviewCount === 1;
    const ownedPreviewInPanel = this.#previewElement !== null
      && previews.includes(this.#previewElement)
      && this.#previewElement.isConnected;
    const activePreviewCount: 0 | 1 = this.#active && ownerClaimsActive && ownedPreviewInPanel ? 1 : 0;
    const domStateKey = previews.length === 1
      ? previews[0]!.getAttribute('data-state-key')
      : null;
    const previewStateKey = activePreviewCount === 1
      && typeof domStateKey === 'string'
      && domStateKey.length > 0
      && owner?.stateKey === domStateKey
      ? domStateKey
      : null;
    const previewKeyFault = activePreviewCount === 1 && previewStateKey === null ? 1 : 0;
    const ownerDomPairFault = ownerClaimsActive && !ownedPreviewInPanel ? 1 : 0;
    const retainedPreviewCount = Math.max(
      Math.max(0, previews.length - activePreviewCount),
      owner?.retainedPreviewCount ?? 0,
    );
    return Object.freeze({
      schema: ENGINEERING_PANEL_DIAGNOSTICS_SCHEMA,
      activeCount: this.#active ? 1 : 0,
      retainedDomCount: this.#body.querySelectorAll('*').length,
      pendingWork: this.#isBusy() ? 1 : 0,
      actionControlCount: this.#body.querySelectorAll('[data-engineering-action]').length,
      activePreviewCount,
      previewStateKey,
      retainedPreviewCount,
      delegatedListenerCount: this.#listenerInstalled ? 1 : 0,
      faultCount: (owner?.faultCount ?? retainedPreviewCount) + previewKeyFault + ownerDomPairFault,
      lastRequest: this.#lastRequest,
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    const restore = this.#focusReturn;
    this.#active = false;
    this.#disposeView();
    if (this.#listenerInstalled) {
      this.#body.removeEventListener('click', this.#onClick);
      this.#listenerInstalled = false;
    }
    this.#view = null;
    this.#pending = null;
    this.#lastRequest = null;
    this.#emissionLocked = false;
    this.#focusReturn = null;
    this.#settlementFocus = null;
    this.#pendingDisabledBodyFocus = false;
    this.#disposed = true;
    this.#restoreElement(restore);
  }

  readonly #onOpen = (): void => {
    this.#assertLive();
    const view = this.#document.defaultView;
    const active = this.#document.activeElement;
    if (view && active instanceof view.HTMLElement && !this.#panel.contains(active)) {
      this.#focusReturn = active;
    } else {
      this.#focusReturn = this.#openers.find((opener) => opener?.isConnected) ?? null;
    }
    this.#active = true;
    this.#render();
  };

  readonly #onClose = (): void => {
    if (this.#disposed || !this.#active) return;
    const restore = this.#focusReturn;
    this.#active = false;
    this.#focusReturn = null;
    this.#settlementFocus = null;
    this.#pendingDisabledBodyFocus = false;
    this.#disposeView();
    this.#restoreElement(restore);
  };

  readonly #onClick = (event: Event): void => {
    if (this.#disposed || this.#isBusy()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-engineering-action]');
    if (!button || !this.#body.contains(button) || button.disabled || button.dataset.modelEnabled !== 'true') return;
    const operation = button.dataset.engineeringAction as EngineeringPanelOperation | undefined;
    if (!operation) return;
    const id = button.dataset.actionId;
    const request = copyRequest(id === undefined ? { operation } : { operation, id });
    this.#retainSettlementFocus(request);
    this.#emissionLocked = true;
    this.#lastRequest = request;
    this.#applyActionAvailabilityWithFocusProof();
    try {
      this.#onAction?.(request);
    } catch (error) {
      if (this.#pending === null) {
        const settlement = this.#settlementFocus;
        const restoreAction = settlement !== null
          && (this.#focusBelongsToSettlement(settlement) || this.#ownsPendingDisabledBodyFocus());
        this.#emissionLocked = false;
        this.#lastRequest = null;
        this.#settlementFocus = null;
        this.#pendingDisabledBodyFocus = false;
        this.#applyActionAvailability();
        if (restoreAction && settlement !== null) {
          this.#restoreFocusKey(settlement.focusKey, settlement.semanticKey);
        }
      }
      throw error;
    }
  };

  #render(): void {
    const view = this.#viewForRender(this.#captureView());
    this.#disposePreview();
    const fragment = this.#document.createDocumentFragment();
    fragment.append(this.#node('h3', 'engineering-panel-title', 'Engineering & Shipyard'));
    if (this.#view === null) {
      const empty = this.#node('p', 'engineering-empty', 'Engineering presentation is not initialized.');
      empty.dataset.engineeringState = 'uninitialized';
      fragment.append(empty, this.#pendingStatus());
      this.#body.replaceChildren(fragment);
      this.#applyActionAvailability();
      this.#restoreView(view);
      this.#pendingDisabledBodyFocus = false;
      return;
    }

    const previewMount = this.#shipOverview(this.#view.ship);
    fragment.append(previewMount.section);
    if (this.#view.engineering === null) {
      const unavailable = this.#node('p', 'engineering-empty', this.#view.reason!);
      unavailable.dataset.engineeringState = 'unavailable';
      unavailable.dataset.engineeringUnavailable = this.#view.reason!;
      fragment.append(unavailable);
    } else {
      fragment.append(
        this.#miningDetails(this.#view.engineering.mining),
        this.#skimmingDetails(this.#view.engineering.skimming),
        this.#researchDetails(this.#view.engineering.research),
        this.#fabricatorDetails(this.#view.engineering.fabricationGroups),
      );
    }
    fragment.append(this.#pendingStatus());
    this.#body.replaceChildren(fragment);
    this.#previewOwner = new ShipyardPreviewOwner(previewMount.mount);
    this.#previewElement = this.#previewOwner.open(this.#view.ship);
    this.#applyActionAvailability();
    this.#restoreView(view);
    this.#pendingDisabledBodyFocus = false;
  }

  #shipOverview(ship: ShipVisualState): Readonly<{ section: HTMLElement; mount: HTMLElement }> {
    const chassis = SHIP_CHASSIS[ship.chassisStage];
    const section = this.#node('section', 'engineering-ship-overview');
    section.dataset.engineeringShip = 'overview';
    section.dataset.chassisStage = String(ship.chassisStage);
    section.append(
      this.#node('h4', '', 'Ship overview'),
      this.#node('p', 'engineering-ship-role', `${chassis.name} · ${chassis.reach}`),
      this.#node('p', 'engineering-ship-provenance', ship.provenance === 'legacy-charter-refit'
        ? 'Legacy expedition reach is shown as a generic charter refit. No missing drive is claimed.'
        : 'Chassis and fittings reflect this expedition’s owned permanent systems.'),
    );
    const mount = this.#node('div', 'engineering-preview-mount');
    mount.dataset.engineeringPreviewMount = 'true';
    section.append(mount);

    const systems = this.#node('ul', 'engineering-fact-list');
    systems.setAttribute('aria-label', 'Installed permanent ship systems');
    if (ship.installedSystemIds.length === 0) {
      systems.append(this.#node('li', '', 'No permanent ship systems installed.'));
    } else {
      for (const id of ship.installedSystemIds) {
        const row = this.#node('li', '', `${SHIP_SYSTEM_NAMES[id]} · installed`);
        row.dataset.shipSystem = id;
        systems.append(row);
      }
    }
    const hardpoints = this.#node('ul', 'engineering-fact-list');
    hardpoints.setAttribute('aria-label', 'Ship hardpoints');
    for (const [id, label, fitted] of [
      ['array', 'Long-Range Array mount', ship.hardpoints.array],
      ['autoext', 'Auto-Extractor mount', ship.hardpoints.autoext],
      ['cscoop', 'Corona Scoop mount', ship.hardpoints.cscoop],
    ] as const) {
      const row = this.#node('li', '', `${label} · ${fitted ? 'fitted' : 'open'}`);
      row.dataset.shipHardpoint = id;
      row.dataset.fitted = String(fitted);
      hardpoints.append(row);
    }
    section.append(systems, hardpoints);
    return Object.freeze({ section, mount });
  }

  #miningDetails(model: EngineeringMiningReadModel): HTMLDetailsElement {
    const details = this.#details('mining', 'Mining', true);
    details.dataset.status = model.status;
    details.append(
      this.#fact('Location', model.locationLabel, 'mining-location'),
      this.#status(model.status, model.detail, 'mining'),
    );
    const deposits = this.#node('ul', 'engineering-fact-list');
    deposits.dataset.engineeringDeposits = 'true';
    deposits.setAttribute('aria-label', 'Revealed mineral deposits');
    if (model.deposits.length === 0) {
      deposits.append(this.#node('li', '', 'No deposit identities are revealed at this location.'));
    } else {
      for (const deposit of model.deposits) {
        const row = this.#node('li');
        row.dataset.depositId = deposit.id;
        row.append(this.#node('span', '', `${deposit.label} (${deposit.id})`));
        if (deposit.grade !== null) {
          const grade = this.#node('span', 'engineering-grade', `Grade: ${deposit.grade}`);
          grade.dataset.depositGrade = deposit.grade;
          row.append(grade);
        }
        deposits.append(row);
      }
    }
    details.append(
      deposits,
      this.#fact('Remaining pulls', model.pullsRemaining === null ? 'Not revealed' : String(model.pullsRemaining), 'mining-remaining'),
      this.#fact('Auto-Extractor due', model.autoExtractorDue === null ? 'Not applicable' : String(model.autoExtractorDue), 'auto-extractor-due'),
      this.#actionButton('mine', undefined, 'Mine this world', model.status === 'ready', model.detail),
    );
    return details;
  }

  #skimmingDetails(model: EngineeringSkimmingReadModel): HTMLDetailsElement {
    const details = this.#details('skimming', 'Stellar Skimming', false);
    details.dataset.status = model.status;
    details.append(
      this.#fact('Star', model.starLabel, 'skimming-star'),
      this.#status(model.status, model.detail, 'skimming'),
      this.#fact('Material', model.material ?? 'Not revealed', 'skimming-material'),
      this.#fact('Remaining passes', model.passesRemaining === null ? 'Not revealed' : String(model.passesRemaining), 'skimming-remaining'),
      this.#fact('Next skim damage', model.nextDamage === null ? 'Not available' : String(model.nextDamage), 'skimming-damage'),
      this.#actionButton('skim', undefined, 'Skim this star', model.status === 'ready', model.detail),
    );
    return details;
  }

  #researchDetails(rows: readonly EngineeringResearchRowReadModel[]): HTMLDetailsElement {
    const details = this.#details('research', 'Research Bench', false);
    const list = this.#node('div', 'engineering-row-list');
    list.dataset.engineeringResearchRows = 'true';
    for (const [index, row] of rows.entries()) {
      const article = this.#node('article', 'engineering-row');
      article.dataset.researchId = row.id;
      article.dataset.rowOrder = String(index);
      article.dataset.status = row.status;
      article.dataset.semanticKey = `research:${row.id}`;
      article.tabIndex = -1;
      article.append(
        this.#node('h4', '', row.name),
        this.#node('p', 'engineering-row-description', row.description),
        this.#rowStatus(row.status, row.reason, 'research'),
        this.#costs(row.costs),
        this.#actionButton(
          'research',
          row.id,
          `Research ${row.name}`,
          row.status === 'available',
          row.reason ?? 'Research is available.',
        ),
      );
      list.append(article);
    }
    details.append(list);
    return details;
  }

  #fabricatorDetails(groups: readonly EngineeringFabricationGroupReadModel[]): HTMLDetailsElement {
    const details = this.#details('fabricator', 'Fabricator', false);
    const groupList = this.#node('div', 'engineering-fabrication-groups');
    for (const [groupIndex, group] of groups.entries()) {
      const section = this.#node('section', 'engineering-fabrication-group');
      section.dataset.fabricationGroup = group.id;
      section.dataset.groupOrder = String(groupIndex);
      section.append(this.#node('h4', '', group.name));
      const rows = this.#node('div', 'engineering-row-list');
      for (const [rowIndex, row] of group.recipes.entries()) {
        const article = this.#node('article', 'engineering-row engineering-recipe-row');
        article.dataset.recipeId = row.baseId;
        article.dataset.recipeCategory = row.category;
        article.dataset.rowOrder = String(rowIndex);
        article.dataset.status = row.status;
        article.dataset.effectSupport = row.effectSupport;
        article.dataset.semanticKey = `recipe:${row.baseId}`;
        article.tabIndex = -1;
        const capacity = row.capacityRemaining === null ? 'Not capped' : String(row.capacityRemaining);
        const output = this.#node(
          'p',
          'engineering-recipe-output',
          `Output: ${row.outputQuantity} × ${row.name} (${row.outputKind}) · Owned: ${row.owned} · Capacity remaining: ${capacity}`,
        );
        output.dataset.outputKind = row.outputKind;
        output.dataset.owned = String(row.owned);
        output.dataset.outputQuantity = String(row.outputQuantity);
        output.dataset.capacityRemaining = row.capacityRemaining === null ? 'uncapped' : String(row.capacityRemaining);
        const effect = this.#node('p', 'engineering-effect-support', row.effectSupport === 'live'
          ? `Gameplay effect: ${row.effectDetail}`
          : `${DORMANT_EFFECT_REASON} ${row.effectDetail}`);
        effect.dataset.effectSupport = row.effectSupport;
        const forcedReason = row.effectSupport === 'unavailable' ? DORMANT_EFFECT_REASON : row.reason;
        article.append(
          this.#node('h5', '', row.name),
          output,
          effect,
          this.#rowStatus(row.status, row.reason, 'fabrication'),
          this.#costs(row.costs),
          this.#actionButton(
            'fabricate',
            row.baseId,
            `Fabricate ${row.name}`,
            row.status === 'available' && row.effectSupport === 'live',
            forcedReason ?? 'Fabrication is available.',
          ),
        );
        rows.append(article);
      }
      if (group.recipes.length === 0) rows.append(this.#node('p', 'engineering-empty', 'No recipes in this group.'));
      section.append(rows);
      groupList.append(section);
    }
    if (groups.length === 0) groupList.append(this.#node('p', 'engineering-empty', 'No fixed recipes are available to inspect.'));
    details.append(groupList);
    return details;
  }

  #costs(costs: EngineeringPanelCosts): HTMLElement {
    const list = this.#node('ul', 'engineering-cost-list');
    list.dataset.engineeringCosts = 'true';
    list.append(
      this.#costQuantityGroup('Materials', 'materials', costs.materials),
      this.#costQuantityGroup('Parts', 'parts', costs.parts),
      this.#costLine(
        'stardust',
        `Stardust: ${costs.stardust.required} required / ${costs.stardust.owned} owned`,
        costs.stardust.owned >= costs.stardust.required,
      ),
      this.#gateCost('Signature', 'signature', costs.signature),
      this.#gateCost('Prerequisite', 'prerequisite', costs.prerequisite),
    );
    return list;
  }

  #costQuantityGroup(
    label: string,
    kind: 'materials' | 'parts',
    rows: readonly EngineeringCostQuantity[],
  ): HTMLLIElement {
    if (rows.length === 0) return this.#costLine(kind, `${label}: None`, true);
    const line = this.#node('li');
    line.dataset.costKind = kind;
    line.append(this.#node('b', '', `${label}: `));
    for (const [index, row] of rows.entries()) {
      if (index > 0) line.append(this.#document.createTextNode('; '));
      const value = this.#node(
        'span',
        '',
        `${row.label} (${row.id}) — ${row.required} required / ${row.owned} owned`,
      );
      value.dataset.costId = row.id;
      value.dataset.required = String(row.required);
      value.dataset.owned = String(row.owned);
      value.dataset.sufficient = String(row.owned >= row.required);
      line.append(value);
    }
    return line;
  }

  #costLine(kind: string, text: string, sufficient: boolean): HTMLLIElement {
    const line = this.#node('li', '', text);
    line.dataset.costKind = kind;
    line.dataset.sufficient = String(sufficient);
    return line;
  }

  #gateCost(label: string, kind: 'signature' | 'prerequisite', cost: EngineeringGateCost | null): HTMLLIElement {
    if (cost === null) return this.#costLine(kind, `${label}: None`, true);
    const line = this.#costLine(
      kind,
      `${label}: ${cost.label} (${cost.id}) — ${cost.owned ? 'owned' : 'missing'}`,
      cost.owned,
    );
    line.dataset.costId = cost.id;
    line.dataset.owned = String(cost.owned);
    return line;
  }

  #details(id: string, label: string, open: boolean): HTMLDetailsElement {
    const details = this.#document.createElement('details');
    details.className = 'engineering-section';
    details.dataset.engineeringSection = id;
    details.open = open;
    const summary = this.#node('summary', '', label);
    summary.dataset.focusKey = `section:${id}`;
    details.append(summary);
    return details;
  }

  #status(status: EngineeringOpportunityStatus, detail: string, id: string): HTMLElement {
    const row = this.#node('p', 'engineering-status', `${this.#opportunityStatusLabel(status)} · ${detail}`);
    row.dataset.engineeringStatus = id;
    row.dataset.status = status;
    if (status !== 'ready') row.dataset.engineeringUnavailable = detail;
    return row;
  }

  #rowStatus(status: EngineeringRowStatus, reason: string | null, kind: string): HTMLElement {
    const label = status === 'owned' ? 'Owned' : status === 'available' ? 'Available' : 'Unavailable';
    const row = this.#node('p', 'engineering-status', reason === null ? label : `${label} · ${reason}`);
    row.dataset.rowStatus = status;
    if (status !== 'available') {
      row.dataset.engineeringUnavailable = reason!;
      row.dataset.unavailableKind = kind;
    }
    return row;
  }

  #opportunityStatusLabel(status: EngineeringOpportunityStatus): string {
    if (status === 'ready') return 'Ready';
    if (status === 'worked-out') return 'Worked out';
    if (status === 'waiting') return 'Waiting';
    return 'Unavailable';
  }

  #fact(label: string, value: string, id: string): HTMLElement {
    const row = this.#node('p', 'engineering-fact');
    row.dataset.engineeringFact = id;
    row.append(this.#node('b', '', `${label}: `), this.#document.createTextNode(value));
    return row;
  }

  #actionButton(
    operation: EngineeringPanelOperation,
    id: string | undefined,
    label: string,
    available: boolean,
    disabledReason: string,
  ): HTMLButtonElement {
    const button = this.#node('button', 'engineering-action', label);
    button.type = 'button';
    button.dataset.engineeringAction = operation;
    if (id !== undefined) button.dataset.actionId = id;
    button.dataset.focusKey = id === undefined ? `action:${operation}` : `action:${operation}:${id}`;
    button.dataset.modelEnabled = String(available && this.#onAction !== null);
    button.dataset.disabledReason = available && this.#onAction === null
      ? COORDINATOR_UNAVAILABLE_REASON
      : disabledReason;
    return button;
  }

  #pendingStatus(): HTMLElement {
    const status = this.#node(
      'p',
      'engineering-pending-status',
      'Engineering action pending. Close remains available; reopening stays busy until settlement.',
    );
    status.dataset.engineeringPending = 'true';
    status.setAttribute('role', 'status');
    status.hidden = true;
    return status;
  }

  #applyActionAvailability(): void {
    if (!this.#active) return;
    const busy = this.#isBusy();
    this.#body.setAttribute('aria-busy', String(busy));
    for (const button of this.#body.querySelectorAll<HTMLButtonElement>('button[data-engineering-action]')) {
      const modelEnabled = button.dataset.modelEnabled === 'true';
      button.disabled = busy || !modelEnabled;
      button.setAttribute('aria-disabled', String(button.disabled));
      button.title = busy ? PENDING_REASON : modelEnabled ? '' : button.dataset.disabledReason ?? 'Unavailable';
    }
    const pendingStatus = this.#body.querySelector<HTMLElement>('[data-engineering-pending]');
    if (pendingStatus) pendingStatus.hidden = !busy;
  }

  #applyActionAvailabilityWithFocusProof(): void {
    const settlement = this.#settlementFocus;
    const activeBefore = this.#document.activeElement;
    const ownedBefore = settlement !== null && this.#focusBelongsToSettlement(settlement);
    const exactActionOwnedBefore = settlement !== null
      && activeBefore === this.#focusKeyTarget(settlement.focusKey, settlement.semanticKey);
    /* Edge completes a native Enter activation's focused-button -> BODY
       transition after the click listener returns. Park focus on the exact
       semantic row before disabling a research/recipe action so that delayed
       native blur cannot erase the settlement lineage. Mine/Skim have no
       semantic row and retain the explicit disable-to-BODY proof below. */
    if (settlement !== null && ownedBefore && exactActionOwnedBefore && settlement.semanticKey !== null) {
      this.#restoreElement(this.#semanticTarget(settlement.semanticKey));
    }
    this.#applyActionAvailability();
    if (ownedBefore && activeBefore !== this.#document.body
      && this.#document.activeElement === this.#document.body) {
      this.#pendingDisabledBodyFocus = true;
    }
  }

  #captureView(): ViewReceipt | null {
    const sections = [...this.#body.querySelectorAll<HTMLDetailsElement>(
      'details[data-engineering-section]',
    )];
    if (sections.length === 0) return null;
    const view = this.#document.defaultView;
    const active = this.#document.activeElement;
    const ownsFocus = !!view && active instanceof view.HTMLElement && this.#body.contains(active);
    const keyed = ownsFocus ? active.closest<HTMLElement>('[data-focus-key]') : null;
    const semantic = ownsFocus ? active.closest<HTMLElement>('[data-semantic-key]') : null;
    return Object.freeze({
      focusKey: keyed?.dataset.focusKey ?? null,
      semanticKey: semantic?.dataset.semanticKey ?? null,
      openSectionIds: Object.freeze(sections
        .filter((section) => section.open)
        .map((section) => section.dataset.engineeringSection!)),
    });
  }

  #retainSettlementFocus(request: EngineeringPanelActionRequest): void {
    const receipt = this.#captureView();
    const focusKey = request.id === undefined
      ? `action:${request.operation}`
      : `action:${request.operation}:${request.id}`;
    const semanticKey = request.operation === 'research'
      ? `research:${request.id}`
      : request.operation === 'fabricate'
        ? `recipe:${request.id}`
        : null;
    if (receipt?.focusKey !== focusKey || receipt.semanticKey !== semanticKey) return;
    this.#settlementFocus = Object.freeze({ focusKey, semanticKey });
  }

  #viewForRender(receipt: ViewReceipt | null): ViewReceipt | null {
    const settlement = this.#settlementFocus;
    if (!this.#isBusy() || settlement === null || receipt === null) return receipt;
    const ownsFocus = this.#focusBelongsToSettlement(settlement)
      || this.#ownsPendingDisabledBodyFocus();
    if (!ownsFocus) return receipt;
    /* A native browser moves focus to BODY when the pressed action is
       disabled by the pending latch. A first busy render may then move focus
       to the replacement semantic row. Both remain the original action's
       lineage across arbitrarily many busy renders; disclosure state still
       comes from the latest live view. */
    return Object.freeze({
      focusKey: settlement.focusKey,
      semanticKey: settlement.semanticKey,
      openSectionIds: receipt.openSectionIds,
    });
  }

  #restoreView(receipt: ViewReceipt | null): void {
    if (receipt === null) return;
    const openSectionIds = new Set(receipt.openSectionIds);
    for (const section of this.#body.querySelectorAll<HTMLDetailsElement>(
      'details[data-engineering-section]',
    )) {
      section.open = openSectionIds.has(section.dataset.engineeringSection!);
    }
    const keyedTarget = this.#focusKeyTarget(receipt.focusKey, receipt.semanticKey);
    if (keyedTarget !== null && !this.#disabled(keyedTarget)
      && this.#restoreElement(keyedTarget)) return;
    /* Pending and permanently unavailable actions both fall through to their
       semantic row. The original action identity remains in settlementFocus;
       unlock decides from the final model and current focus lineage whether
       the exact replacement action may receive focus. */
    this.#restoreElement(this.#semanticTarget(receipt.semanticKey));
  }

  #disabled(element: HTMLElement): boolean {
    const view = this.#document.defaultView;
    return !!view && element instanceof view.HTMLButtonElement && element.disabled;
  }

  #focusBelongsToSettlement(settlement: SettlementFocusReceipt): boolean {
    const view = this.#document.defaultView;
    const active = this.#document.activeElement;
    if (!view || !(active instanceof view.HTMLElement) || !this.#body.contains(active)) return false;
    const semanticKey = active.closest<HTMLElement>('[data-semantic-key]')?.dataset.semanticKey ?? null;
    if (settlement.semanticKey !== null) return semanticKey === settlement.semanticKey;
    return semanticKey === null
      && active.closest<HTMLElement>('[data-focus-key]')?.dataset.focusKey === settlement.focusKey;
  }

  #ownsPendingDisabledBodyFocus(): boolean {
    return this.#pendingDisabledBodyFocus && this.#document.activeElement === this.#document.body;
  }

  #focusKeyTarget(focusKey: string | null, semanticKey: string | null): HTMLElement | null {
    if (focusKey === null) return null;
    return [...this.#body.querySelectorAll<HTMLElement>('[data-focus-key]')]
      .find((element) => element.dataset.focusKey === focusKey
        && (element.closest<HTMLElement>('[data-semantic-key]')?.dataset.semanticKey ?? null) === semanticKey) ?? null;
  }

  #semanticTarget(semanticKey: string | null): HTMLElement | null {
    if (semanticKey === null) return null;
    return [...this.#body.querySelectorAll<HTMLElement>('[data-semantic-key]')]
      .find((element) => element.dataset.semanticKey === semanticKey) ?? null;
  }

  #restoreFocusKey(focusKey: string | null, semanticKey: string | null): boolean {
    const target = this.#focusKeyTarget(focusKey, semanticKey);
    return this.#restoreElement(target);
  }

  #restoreElement(element: HTMLElement | null): boolean {
    if (!element?.isConnected || this.#disabled(element)) return false;
    const view = this.#document.defaultView;
    if (view) {
      for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (ancestor instanceof view.HTMLDetailsElement && !ancestor.open) {
          const summary = ancestor.querySelector<HTMLElement>(':scope > summary');
          if (summary !== element && !summary?.contains(element)) return false;
        }
      }
    }
    try {
      element.focus();
    } catch {
      return false;
    }
    return this.#document.activeElement === element;
  }

  #disposePreview(): void {
    this.#previewOwner?.dispose();
    this.#previewOwner = null;
    this.#previewElement = null;
  }

  #disposeView(): void {
    this.#disposePreview();
    this.#body.replaceChildren();
    this.#body.removeAttribute('aria-busy');
  }

  #isBusy(): boolean {
    return this.#pending !== null || this.#emissionLocked;
  }

  #node<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = '',
    text = '',
  ): HTMLElementTagNameMap[K] {
    const element = this.#document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  #assertLive(): void {
    if (this.#disposed) throw new Error('Engineering panel controller is disposed');
  }
}
