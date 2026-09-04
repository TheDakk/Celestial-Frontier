/* Explorer-meal presentation on one real Flora Compendium detail.

   Projection binds the displayed genome to registered ownership, selects one
   deterministic canonical matching lot, and obtains heal/risk/nourishment facts from the same
   action preview used at commit. The controller owns one native Eat 1 button;
   Main remains the sole coordinator, transaction owner, rechecker and copy
   authority. */
import {
  MAX_OWNERSHIP_REVISION,
  canonicalGenomeIdentityV1,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type OwnershipStateV2,
  type SpeciesId,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import type { EngineeringCapabilitySnapshot } from '@cf/domain-loot';
import type { EngineeringStateV2 } from '@cf/domain-opportunity';
import type { SaveStateV2 } from '@cf/persistence';
import { projectArc5ExplorerMealActionPreviewV1 } from './explorer-meal-action.js';

export const COMPENDIUM_EXPLORER_MEAL_MODEL_SCHEMA_V1 =
  'cf-v2-compendium-explorer-meal-model/v1' as const;
export const COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1 =
  'cf-v2-compendium-explorer-meal-outcome/v1' as const;

export interface CompendiumExplorerMealRecordV1 {
  readonly id: string;
  readonly name: string;
  readonly g: Readonly<Record<string, unknown>>;
}

export interface CompendiumExplorerMealSurfaceV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly speciesId: SpeciesId | null;
  readonly surfaceKey: string;
}

export type CompendiumExplorerMealAvailabilityV1 =
  | 'ready'
  | 'fixture'
  | 'non-flora'
  | 'protected'
  | 'no-lot';

export interface CompendiumExplorerMealLotV1 {
  readonly foodLotId: SpecimenLotId;
  readonly quantityBefore: number;
  readonly quantityAfter: number;
  readonly healAmount: number;
  readonly poisonChance: number;
  readonly poisonDamage: number;
  readonly nourishedStat: 'vit' | 'fer' | 'res' | 'agi' | 'ins';
  readonly nourishment: number;
  readonly statIncrease: number;
}

export interface CompendiumExplorerMealModelV1 {
  readonly schema: typeof COMPENDIUM_EXPLORER_MEAL_MODEL_SCHEMA_V1;
  readonly surface: CompendiumExplorerMealSurfaceV1;
  readonly contextKey: string;
  readonly availability: CompendiumExplorerMealAvailabilityV1;
  readonly detail: string;
  readonly ownershipRevision: number | null;
  readonly ownershipDigest: string | null;
  readonly floraName: string | null;
  readonly lots: readonly CompendiumExplorerMealLotV1[];
}

export interface CompendiumExplorerMealProjectionInputV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly record: CompendiumExplorerMealRecordV1;
  readonly ownership: OwnershipStateV2 | null;
  readonly engineering: EngineeringStateV2 | null;
  readonly capabilities: EngineeringCapabilitySnapshot | null;
  readonly state: SaveStateV2;
  readonly protected: boolean;
  readonly fixture: boolean;
}

export interface CompendiumExplorerMealRequestV1 {
  readonly surface: CompendiumExplorerMealSurfaceV1;
  readonly contextKey: string;
  readonly ownershipRevision: number;
  readonly ownershipDigest: string;
  readonly foodLotId: SpecimenLotId;
  readonly foodQuantityBefore: number;
  readonly foodQuantityAfter: number;
  readonly healAmount: number;
  readonly poisonChance: number;
  readonly nourishedStat: CompendiumExplorerMealLotV1['nourishedStat'];
  readonly nourishment: number;
  readonly statIncrease: number;
}

export interface CompendiumExplorerMealOutcomeV1 {
  readonly schema: typeof COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1;
  readonly kind: 'committed' | 'committed-convergence' | 'refused';
  readonly convergence: 'none' | 'read-only-reload';
  readonly request: CompendiumExplorerMealRequestV1;
  readonly title: string;
  readonly detail: string;
}

export interface CompendiumExplorerMealControllerOptionsV1 {
  readonly root: HTMLElement;
  readonly isCurrent: (surface: CompendiumExplorerMealSurfaceV1) => boolean;
  readonly onNativeEatGesture?: () => void;
  readonly onAction?: (request: CompendiumExplorerMealRequestV1) => void;
}

export interface CompendiumExplorerMealDiagnosticsV1 {
  readonly attachedMountCount: 0 | 1;
  readonly delegatedListenerCount: 0 | 1;
  readonly pendingWork: 0 | 1;
  readonly convergenceLatched: boolean;
  readonly actionControlCount: number;
  readonly contextKey: string | null;
  readonly lastRequest: CompendiumExplorerMealRequestV1 | null;
  readonly lastOutcome: CompendiumExplorerMealOutcomeV1 | null;
}

const MODELS = new WeakSet<object>();

function checkedText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function surface(
  generation: number,
  logicalId: string,
  speciesId: SpeciesId | null,
): CompendiumExplorerMealSurfaceV1 {
  if (!Number.isSafeInteger(generation) || generation < 0) {
    throw new RangeError('Compendium generation is invalid');
  }
  return Object.freeze({
    generation,
    logicalId,
    speciesId,
    surfaceKey: JSON.stringify([generation, logicalId, speciesId]),
  });
}

function unavailable(
  currentSurface: CompendiumExplorerMealSurfaceV1,
  availability: Exclude<CompendiumExplorerMealAvailabilityV1, 'ready'>,
  detail: string,
  input: Readonly<{
    ownershipRevision?: number | null;
    ownershipDigest?: string | null;
    floraName?: string | null;
  }> = {},
): CompendiumExplorerMealModelV1 {
  const model = Object.freeze({
    schema: COMPENDIUM_EXPLORER_MEAL_MODEL_SCHEMA_V1,
    surface: currentSurface,
    contextKey: JSON.stringify([
      currentSurface.surfaceKey,
      input.ownershipRevision ?? null,
      input.ownershipDigest ?? null,
      availability,
    ]),
    availability,
    detail,
    ownershipRevision: input.ownershipRevision ?? null,
    ownershipDigest: input.ownershipDigest ?? null,
    floraName: input.floraName ?? null,
    lots: Object.freeze([]),
  });
  MODELS.add(model);
  return model;
}

/** Project one real Flora detail and at most one canonical matching owned lot. */
export function projectCompendiumExplorerMealV1(
  input: CompendiumExplorerMealProjectionInputV1,
): CompendiumExplorerMealModelV1 {
  const logicalId = checkedText(input.logicalId, 'Compendium logical ID', 128);
  const emptySurface = surface(input.generation, logicalId, null);
  if (input.fixture) {
    return unavailable(emptySurface, 'fixture', 'Eating is unavailable for diagnostic fixtures.');
  }
  let recordName: string;
  let identity: ReturnType<typeof canonicalGenomeIdentityV1>;
  try {
    if (checkedText(input.record.id, 'Compendium record ID', 128) !== logicalId) {
      throw new TypeError('record identity diverged');
    }
    recordName = checkedText(input.record.name, 'Compendium record name', 256);
    identity = canonicalGenomeIdentityV1(input.record.g);
  } catch {
    return unavailable(emptySurface, 'protected', 'Eating is unavailable because this detail did not verify.');
  }
  const currentSurface = surface(input.generation, logicalId, identity.speciesId);
  if (identity.kingdom !== 'flora') {
    return unavailable(currentSurface, 'non-flora', 'Eating is available only on owned Flora details.');
  }
  const ownership = input.ownership;
  if (input.protected || ownership === null || !isOwnershipStateV2(ownership)
    || ownership.mode !== 'current' || input.engineering === null || input.capabilities === null) {
    return unavailable(currentSurface, 'protected', 'Eating is unavailable while meal authority is protected.');
  }
  const ownershipDigest = ownershipStateDigestV2(ownership);
  const authorityInfo = {
    ownershipRevision: ownership.revision,
    ownershipDigest,
    floraName: recordName,
  } as const;
  if (ownership.revision === MAX_OWNERSHIP_REVISION) {
    return unavailable(
      currentSurface,
      'protected',
      'Eating is unavailable because ownership reached its revision ceiling.',
      authorityInfo,
    );
  }
  const catalogue = ownership.catalogSpecies.find((row) => row.speciesId === identity.speciesId);
  if (catalogue === undefined || catalogue.kingdom !== 'flora'
    || catalogue.genomeIdentity !== identity.genomeIdentity) {
    return unavailable(
      currentSurface,
      'protected',
      'Eating is unavailable because this Flora detail does not match ownership.',
      authorityInfo,
    );
  }
  let selectedLot: OwnershipStateV2['specimenLots'][number] | null = null;
  for (const lot of ownership.specimenLots) {
    if (lot.kind !== 'flora' || lot.speciesId !== identity.speciesId) continue;
    if (selectedLot === null || lot.lotId < selectedLot.lotId) selectedLot = lot;
  }
  if (selectedLot === null) {
    return unavailable(
      currentSurface,
      'no-lot',
      `No owned ${recordName} specimen remains to eat.`,
      authorityInfo,
    );
  }
  const projected = projectArc5ExplorerMealActionPreviewV1({
    ownershipV2: ownership,
    engineering: input.engineering,
    capabilities: input.capabilities,
    state: input.state,
    foodLotId: selectedLot.lotId,
  });
  if (projected.kind !== 'ready') {
    return unavailable(
      currentSurface,
      'protected',
      `Eating is unavailable because meal facts did not verify (${projected.detail}).`,
      authorityInfo,
    );
  }
  const frozenLots = Object.freeze([Object.freeze({
    foodLotId: selectedLot.lotId,
    quantityBefore: projected.preflight.foodQuantityBefore,
    quantityAfter: projected.preflight.foodQuantityAfter,
    healAmount: projected.preview.healAmount,
    poisonChance: projected.preflight.poisonChance,
    poisonDamage: projected.preview.poisonDamage,
    nourishedStat: projected.preflight.nourishedStat,
    nourishment: projected.preview.nourishment,
    statIncrease: projected.preview.statIncrease,
  })]);
  const model: CompendiumExplorerMealModelV1 = Object.freeze({
    schema: COMPENDIUM_EXPLORER_MEAL_MODEL_SCHEMA_V1,
    surface: currentSurface,
    contextKey: JSON.stringify([
      currentSurface.surfaceKey,
      ownership.revision,
      ownershipDigest,
      input.engineering.revision,
      input.capabilities.fingerprint,
      input.state.hp,
      input.state.HP_MAX,
      input.state.pstats,
      frozenLots,
    ]),
    availability: 'ready',
    detail: `Eat one owned ${recordName} specimen. The plant is consumed on every outcome.`,
    ownershipRevision: ownership.revision,
    ownershipDigest,
    floraName: recordName,
    lots: frozenLots,
  });
  MODELS.add(model);
  return model;
}

function copyRequest(value: CompendiumExplorerMealRequestV1): CompendiumExplorerMealRequestV1 {
  return Object.freeze({ ...value });
}

function assertOutcome(value: CompendiumExplorerMealOutcomeV1): void {
  if (!value || typeof value !== 'object'
    || value.schema !== COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1
    || (value.kind !== 'committed' && value.kind !== 'committed-convergence'
      && value.kind !== 'refused')
    || (value.convergence !== 'none' && value.convergence !== 'read-only-reload')) {
    throw new TypeError('explorer meal outcome is malformed');
  }
}

export class CompendiumExplorerMealController {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #isCurrent: (surface: CompendiumExplorerMealSurfaceV1) => boolean;
  readonly #onNativeEatGesture: (() => void) | null;
  readonly #onAction: ((request: CompendiumExplorerMealRequestV1) => void) | null;
  #mount: HTMLElement | null = null;
  #state: CompendiumExplorerMealModelV1 | null = null;
  #pending: CompendiumExplorerMealRequestV1 | null = null;
  #lastRequest: CompendiumExplorerMealRequestV1 | null = null;
  #lastOutcome: CompendiumExplorerMealOutcomeV1 | null = null;
  #convergenceLatched = false;
  #listenerInstalled = false;
  #disposed = false;

  constructor(options: CompendiumExplorerMealControllerOptionsV1) {
    this.#root = options.root;
    this.#document = options.root.ownerDocument;
    this.#isCurrent = options.isCurrent;
    this.#onNativeEatGesture = options.onNativeEatGesture ?? null;
    this.#onAction = options.onAction ?? null;
  }

  attach(mount: HTMLElement): void {
    this.#assertLive();
    if (!this.#rootVisible() || mount.ownerDocument !== this.#document
      || !this.#root.contains(mount)
      || !mount.hasAttribute('data-arc5-explorer-meal-body')) {
      throw new Error('explorer meal mount must be the open declared Compendium descendant');
    }
    const mounts = [...this.#root.querySelectorAll<HTMLElement>('[data-arc5-explorer-meal-body]')];
    if (mounts.length !== 1 || mounts[0] !== mount) {
      throw new Error('explorer meal requires exactly one dynamic mount');
    }
    if (this.#mount !== null && this.#mount !== mount) this.#disposeMount(this.#mount);
    this.#mount = mount;
    if (!this.#listenerInstalled) {
      this.#root.addEventListener('click', this.#onClick);
      this.#listenerInstalled = true;
    }
    this.#render();
  }

  detach(): void {
    if (this.#disposed) return;
    if (this.#listenerInstalled) {
      this.#root.removeEventListener('click', this.#onClick);
      this.#listenerInstalled = false;
    }
    if (this.#mount !== null) this.#disposeMount(this.#mount);
    this.#mount = null;
  }

  setState(state: CompendiumExplorerMealModelV1 | null): void {
    this.#assertLive();
    if (state !== null && !MODELS.has(state)) {
      throw new TypeError('explorer meal accepts only an owner-projected model');
    }
    const priorSurface = this.#state?.surface.surfaceKey ?? null;
    this.#state = state;
    if (state === null || state.surface.surfaceKey !== priorSurface) this.#lastOutcome = null;
    this.#render();
  }

  refresh(): void {
    this.#assertLive();
    this.#render();
  }

  settle(outcome: CompendiumExplorerMealOutcomeV1): void {
    this.#assertLive();
    assertOutcome(outcome);
    if (this.#pending === null || outcome.request !== this.#pending) {
      throw new Error('explorer meal outcome does not match its pending request');
    }
    this.#lastOutcome = outcome;
    this.#lastRequest = outcome.request;
    this.#pending = null;
    if (outcome.convergence === 'read-only-reload') this.#convergenceLatched = true;
    this.#render();
    if (this.#current()) this.#focusStatus();
  }

  diagnostics(): CompendiumExplorerMealDiagnosticsV1 {
    return Object.freeze({
      attachedMountCount: this.#mount === null ? 0 : 1,
      delegatedListenerCount: this.#listenerInstalled ? 1 : 0,
      pendingWork: this.#pending === null ? 0 : 1,
      convergenceLatched: this.#convergenceLatched,
      actionControlCount: this.#mount?.querySelectorAll('[data-arc5-explorer-meal-confirm]').length ?? 0,
      contextKey: this.#state?.contextKey ?? null,
      lastRequest: this.#lastRequest,
      lastOutcome: this.#lastOutcome,
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.detach();
    this.#state = null;
    this.#pending = null;
    this.#lastRequest = null;
    this.#lastOutcome = null;
    this.#convergenceLatched = false;
    this.#disposed = true;
  }

  readonly #onClick = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-arc5-explorer-meal-confirm]');
    if (!button || !this.#mount?.contains(button) || button.disabled) return;
    const request = this.#request();
    if (request === null) return;
    const priorOutcome = this.#lastOutcome;
    this.#pending = request;
    this.#lastRequest = request;
    this.#lastOutcome = null;
    this.#render();
    this.#focusStatus();
    try {
      if (event.isTrusted) this.#onNativeEatGesture?.();
      this.#onAction?.(request);
    } catch (error) {
      if (this.#pending === request && !this.#convergenceLatched) {
        this.#pending = null;
        this.#lastRequest = null;
        this.#lastOutcome = priorOutcome;
        this.#render();
        this.#focusConfirm();
      }
      throw error;
    }
  };

  #render(): void {
    const mount = this.#mount;
    if (mount === null) return;
    if (!this.#rootVisible()) { this.detach(); return; }
    const focus = this.#focusReceipt();
    const fragment = this.#document.createDocumentFragment();
    const heading = this.#node('h4', '', 'Eat flora');
    heading.dataset.arc5ExplorerMealHeading = 'true';
    heading.dataset.semanticKey = 'explorer-meal:heading';
    heading.tabIndex = -1;
    fragment.append(heading);
    const state = this.#state;
    if (state === null) {
      fragment.append(this.#message('Meal facts are unavailable.', 'absent'));
    } else {
      fragment.append(this.#message(state.detail, state.availability));
      if (state.availability === 'ready') {
        const chosen = state.lots[0]!;
        const list = this.#node('ul', 'compendium-feed-summary');
        list.dataset.arc5ExplorerMealLots = 'true';
        for (const lot of state.lots) {
          const item = this.#node('li', '', `Owned lot ${lot.foodLotId.slice(-8)} · ${lot.quantityBefore}`);
          item.dataset.foodLotId = lot.foodLotId;
          list.append(item);
        }
        const preview = this.#node(
          'p',
          'compendium-feed-summary',
          `Heal up to ${chosen.healAmount} HP · ${Math.round(chosen.poisonChance * 100)}% poison risk · ${chosen.nourishedStat.toUpperCase()} +${chosen.statIncrease}`,
        );
        preview.dataset.arc5ExplorerMealPreview = 'true';
        preview.dataset.foodLotId = chosen.foodLotId;
        const button = this.#node('button', 'compendium-feed-confirm', 'Eat 1');
        button.type = 'button';
        button.dataset.arc5ExplorerMealConfirm = 'true';
        button.dataset.focusKey = 'explorer-meal:confirm';
        button.dataset.semanticKey = 'explorer-meal:confirm';
        button.style.minHeight = '44px';
        fragment.append(list, preview, button);
      }
    }
    const status = this.#node('p', 'compendium-feed-status');
    status.dataset.arc5ExplorerMealStatus = 'true';
    status.dataset.semanticKey = 'explorer-meal:status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    fragment.append(status);
    mount.replaceChildren(fragment);
    mount.dataset.arc5ExplorerMealController = 'v1';
    this.#applyAvailability();
    this.#paintStatus();
    if (focus.owned && this.#current()) this.#restoreFocus(focus);
  }

  #request(): CompendiumExplorerMealRequestV1 | null {
    const state = this.#state;
    const lot = state?.lots[0];
    if (state?.availability !== 'ready' || lot === undefined
      || state.ownershipRevision === null || state.ownershipDigest === null) return null;
    return copyRequest({
      surface: state.surface,
      contextKey: state.contextKey,
      ownershipRevision: state.ownershipRevision,
      ownershipDigest: state.ownershipDigest,
      foodLotId: lot.foodLotId,
      foodQuantityBefore: lot.quantityBefore,
      foodQuantityAfter: lot.quantityAfter,
      healAmount: lot.healAmount,
      poisonChance: lot.poisonChance,
      nourishedStat: lot.nourishedStat,
      nourishment: lot.nourishment,
      statIncrease: lot.statIncrease,
    });
  }

  #applyAvailability(): void {
    const button = this.#mount?.querySelector<HTMLButtonElement>(
      '[data-arc5-explorer-meal-confirm]',
    ) ?? null;
    if (button === null) return;
    const pending = this.#pending !== null;
    button.disabled = pending || this.#convergenceLatched
      || !this.#current() || this.#onAction === null || this.#request() === null;
    button.setAttribute('aria-disabled', String(button.disabled));
    button.title = this.#convergenceLatched ? 'Reload required before another meal.'
      : pending ? 'Another meal is pending.'
        : !this.#current() ? 'This Flora detail is no longer current.'
          : this.#onAction === null ? 'Meal action coordinator is unavailable.' : '';
    this.#mount?.setAttribute('aria-busy', String(pending));
  }

  #paintStatus(): void {
    const status = this.#mount?.querySelector<HTMLElement>('[data-arc5-explorer-meal-status]');
    if (!status) return;
    if (this.#lastOutcome !== null && this.#state !== null
      && this.#lastOutcome.request.surface.surfaceKey === this.#state.surface.surfaceKey) {
      status.hidden = false;
      status.dataset.kind = this.#lastOutcome.kind;
      status.dataset.convergence = this.#lastOutcome.convergence;
      status.textContent = `${this.#lastOutcome.title} ${this.#lastOutcome.detail}`;
    } else if (this.#pending !== null) {
      status.hidden = false;
      status.dataset.kind = 'pending';
      status.dataset.convergence = 'none';
      status.textContent = 'Meal pending. HP, stats and flora stay unchanged until durability settles.';
    } else {
      status.hidden = true;
      status.textContent = '';
      delete status.dataset.kind;
      delete status.dataset.convergence;
    }
  }

  #canInteract(): boolean {
    return !this.#disposed && this.#pending === null && !this.#convergenceLatched
      && this.#state?.availability === 'ready' && this.#mount !== null
      && this.#rootVisible() && this.#current();
  }

  #current(): boolean {
    if (!this.#state) return false;
    try { return this.#isCurrent(this.#state.surface) === true; } catch { return false; }
  }

  #focusReceipt(): { readonly owned: boolean; readonly semanticKey: string | null } {
    const active = this.#document.activeElement;
    const view = this.#document.defaultView;
    const owned = !!this.#mount && !!view && active instanceof view.HTMLElement
      && this.#mount.contains(active);
    return Object.freeze({
      owned,
      semanticKey: owned
        ? active.closest<HTMLElement>('[data-semantic-key]')?.dataset.semanticKey ?? null
        : null,
    });
  }

  #restoreFocus(receipt: { readonly semanticKey: string | null }): void {
    const target = [...(this.#mount?.querySelectorAll<HTMLElement>('[data-semantic-key]') ?? [])]
      .find((node) => node.dataset.semanticKey === receipt.semanticKey) ?? null;
    if (!this.#focus(target)) this.#focus(
      this.#mount?.querySelector<HTMLElement>('[data-arc5-explorer-meal-heading]') ?? null,
    );
  }

  #focusStatus(): void {
    this.#focus(this.#mount?.querySelector<HTMLElement>('[data-arc5-explorer-meal-status]') ?? null);
  }

  #focusConfirm(): void {
    this.#focus(this.#mount?.querySelector<HTMLElement>('[data-arc5-explorer-meal-confirm]') ?? null);
  }

  #focus(element: HTMLElement | null): boolean {
    if (!element?.isConnected || element.hidden || element.closest('[hidden],[inert]')) return false;
    const view = this.#document.defaultView;
    if (view && element instanceof view.HTMLButtonElement && element.disabled) return false;
    try { element.focus({ preventScroll: true }); } catch { return false; }
    return this.#document.activeElement === element;
  }

  #message(text: string, availability: string): HTMLElement {
    const node = this.#node('p', 'compendium-feed-detail', text);
    node.dataset.arc5ExplorerMealState = availability;
    return node;
  }

  #disposeMount(mount: HTMLElement): void {
    mount.replaceChildren();
    mount.removeAttribute('aria-busy');
    delete mount.dataset.arc5ExplorerMealController;
  }

  #rootVisible(): boolean {
    return this.#root.isConnected && !this.#root.hidden
      && this.#root.getAttribute('aria-hidden') !== 'true'
      && this.#root.style.display !== 'none';
  }

  #assertLive(): void {
    if (this.#disposed) throw new Error('explorer meal controller is disposed');
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
}
