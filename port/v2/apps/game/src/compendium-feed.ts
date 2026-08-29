/* Arc 5 Compendium Feed presentation owner.

   This module projects one real Compendium record against registered Arc 5
   ownership and owns only the dynamic controls inside that detail. Species
   identity comes from the complete canonical genome; owned individuals and
   specimen lots retain their full exact IDs. Main remains the sole owner of
   product coordination, persistence, convergence, and terminal wording. */
import {
  MAX_OWNERSHIP_REVISION,
  canonicalGenomeIdentityV1,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type OwnershipStateV2,
  type SpeciesId,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import { ARC5_FED_MAX_V1 } from '@cf/domain-acquisition/feed-internal';

export const COMPENDIUM_FEED_READ_MODEL_SCHEMA =
  'cf-v2-compendium-feed-read-model/v1' as const;
export const COMPENDIUM_FEED_OUTCOME_SCHEMA =
  'cf-v2-compendium-feed-outcome/v1' as const;
export const COMPENDIUM_FEED_DIAGNOSTICS_SCHEMA =
  'cf-v2-compendium-feed-diagnostics/v1' as const;

export type CompendiumFeedAvailability =
  | 'ready'
  | 'fixture'
  | 'non-fauna'
  | 'protected'
  | 'no-companion'
  | 'no-eligible-companion'
  | 'no-flora';

export type CompendiumFeedCreatureStatus = 'ready' | 'assigned' | 'capped';
export type CompendiumFeedOutcomeKind = 'committed' | 'committed-convergence' | 'refused';
export type CompendiumFeedConvergence = 'none' | 'read-only-reload';

export interface CompendiumFeedRecordV1 {
  readonly id: string;
  readonly name: string;
  readonly g: Readonly<Record<string, unknown>>;
}

export interface CompendiumFeedProjectionInputV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly record: CompendiumFeedRecordV1;
  readonly ownership: OwnershipStateV2 | null;
  /** App-level protection includes bootstrap, corrupt-carrier and convergence
      holds that are intentionally outside the registered domain state. */
  readonly protected: boolean;
  /** Diagnostic Compendium rows are presentation fixtures, never ownership. */
  readonly fixture: boolean;
}

export interface CompendiumFeedSurfaceReceiptV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly speciesId: SpeciesId | null;
  readonly surfaceKey: string;
}

export interface CompendiumFeedCreatureReadModelV1 {
  readonly creatureId: CreatureInstanceId;
  readonly label: string;
  readonly status: CompendiumFeedCreatureStatus;
  readonly disabledReason: string | null;
  readonly fedBefore: number;
  readonly fedAfter: number;
}

export interface CompendiumFeedFloraReadModelV1 {
  readonly foodLotId: SpecimenLotId;
  readonly speciesId: SpeciesId;
  readonly label: string;
  readonly quantityBefore: number;
  readonly quantityAfter: number;
}

export interface CompendiumFeedReadModelV1 {
  readonly schema: typeof COMPENDIUM_FEED_READ_MODEL_SCHEMA;
  readonly surface: CompendiumFeedSurfaceReceiptV1;
  /** Surface plus exact registered ownership parent. */
  readonly contextKey: string;
  readonly availability: CompendiumFeedAvailability;
  readonly detail: string;
  readonly ownershipRevision: number | null;
  readonly ownershipDigest: string | null;
  readonly creatures: readonly CompendiumFeedCreatureReadModelV1[];
  readonly floraLots: readonly CompendiumFeedFloraReadModelV1[];
}

export interface CompendiumFeedActionRequestV1 {
  readonly surface: CompendiumFeedSurfaceReceiptV1;
  readonly contextKey: string;
  readonly ownershipRevision: number;
  readonly ownershipDigest: string;
  readonly creatureId: CreatureInstanceId;
  readonly foodLotId: SpecimenLotId;
  readonly fedBefore: number;
  readonly fedAfter: number;
  readonly foodQuantityBefore: number;
  readonly foodQuantityAfter: number;
}

export interface CompendiumFeedActionOutcomeV1 {
  readonly schema: typeof COMPENDIUM_FEED_OUTCOME_SCHEMA;
  readonly kind: CompendiumFeedOutcomeKind;
  readonly convergence: CompendiumFeedConvergence;
  readonly request: CompendiumFeedActionRequestV1;
  readonly title: string;
  readonly detail: string;
}

export interface CompendiumFeedControllerOptions {
  /** Persistent Compendium panel; dynamic detail refills replace only mount. */
  readonly root: HTMLElement;
  /** Main binds this receipt to codex generation, logical detail and panel. */
  readonly isCurrent: (surface: CompendiumFeedSurfaceReceiptV1) => boolean;
  /** Called only from the trusted native Use 1 click stack. */
  readonly onNativeFeedGesture?: () => void;
  /** Called synchronously after the local pending lock is painted. */
  readonly onAction?: (request: CompendiumFeedActionRequestV1) => void;
}

export interface CompendiumFeedDiagnosticsV1 {
  readonly schema: typeof COMPENDIUM_FEED_DIAGNOSTICS_SCHEMA;
  readonly attachedMountCount: 0 | 1;
  readonly retainedDomCount: number;
  readonly pendingWork: 0 | 1;
  readonly convergenceLatched: boolean;
  readonly delegatedListenerCount: 0 | 2;
  readonly actionControlCount: number;
  readonly radioControlCount: number;
  readonly surfaceKey: string | null;
  readonly contextKey: string | null;
  readonly selectedCreatureId: CreatureInstanceId | null;
  readonly selectedFoodLotId: SpecimenLotId | null;
  readonly lastRequest: CompendiumFeedActionRequestV1 | null;
  readonly lastOutcome: CompendiumFeedActionOutcomeV1 | null;
}

interface FocusReceipt {
  readonly focusKey: string | null;
  readonly semanticKey: string | null;
  readonly owned: boolean;
}

const READ_MODELS = new WeakSet<object>();

function checkedText(value: unknown, label: string, maximum = 8_192): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} must be non-empty bounded text`);
  }
  return value;
}

function checkedGeneration(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RangeError('Compendium Feed generation must be a non-negative safe integer');
  }
  return value as number;
}

function shortId(value: string): string {
  return value.slice(-8);
}

function surfaceReceipt(
  generation: number,
  logicalId: string,
  speciesId: SpeciesId | null,
): CompendiumFeedSurfaceReceiptV1 {
  const surfaceKey = JSON.stringify([generation, logicalId, speciesId]);
  return Object.freeze({ generation, logicalId, speciesId, surfaceKey });
}

function unavailableModel(
  surface: CompendiumFeedSurfaceReceiptV1,
  availability: Exclude<CompendiumFeedAvailability, 'ready'>,
  detail: string,
  ownershipRevision: number | null = null,
  ownershipDigest: string | null = null,
  creatures: readonly CompendiumFeedCreatureReadModelV1[] = Object.freeze([]),
  floraLots: readonly CompendiumFeedFloraReadModelV1[] = Object.freeze([]),
): CompendiumFeedReadModelV1 {
  const model: CompendiumFeedReadModelV1 = Object.freeze({
    schema: COMPENDIUM_FEED_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([
      surface.surfaceKey, ownershipRevision, ownershipDigest, availability,
    ]),
    availability,
    detail,
    ownershipRevision,
    ownershipDigest,
    creatures,
    floraLots,
  });
  READ_MODELS.add(model);
  return model;
}

/** Build a detached read model from one real Compendium row and one exact
 * registered Arc 5 parent. This function never mutates either input. */
export function projectCompendiumFeedV1(
  input: CompendiumFeedProjectionInputV1,
): CompendiumFeedReadModelV1 {
  const generation = checkedGeneration(input.generation);
  const logicalId = checkedText(input.logicalId, 'Compendium logical ID', 128);
  const emptySurface = surfaceReceipt(generation, logicalId, null);

  if (input.fixture) {
    return unavailableModel(
      emptySurface,
      'fixture',
      'Feed is unavailable for diagnostic Compendium fixtures.',
    );
  }
  let recordId: string;
  let recordName: string;
  try {
    recordId = checkedText(input.record?.id, 'Compendium record ID', 128);
    recordName = checkedText(input.record?.name, 'Compendium record name', 256);
  } catch {
    return unavailableModel(
      emptySurface,
      'protected',
      'Feed is unavailable because this Compendium record did not verify.',
    );
  }
  if (recordId !== logicalId || !input.record.g || typeof input.record.g !== 'object'
    || Array.isArray(input.record.g)) {
    return unavailableModel(
      emptySurface,
      'protected',
      'Feed is unavailable because this Compendium record is not authoritative.',
    );
  }

  let identity: ReturnType<typeof canonicalGenomeIdentityV1>;
  try {
    identity = canonicalGenomeIdentityV1(input.record.g);
  } catch {
    return unavailableModel(
      emptySurface,
      'protected',
      'Feed is unavailable because this Compendium genome did not verify.',
    );
  }
  const surface = surfaceReceipt(generation, logicalId, identity.speciesId);
  if (identity.kingdom !== 'fauna') {
    return unavailableModel(
      surface,
      'non-fauna',
      'Feed is available only for owned fauna companions.',
    );
  }

  const ownership = input.ownership;
  if (input.protected || ownership === null || !isOwnershipStateV2(ownership)
    || ownership.mode !== 'current') {
    return unavailableModel(
      surface,
      'protected',
      'Feed is unavailable while companion ownership is protected.',
    );
  }
  const ownershipDigest = ownershipStateDigestV2(ownership);
  if (ownership.revision === MAX_OWNERSHIP_REVISION) {
    return unavailableModel(
      surface,
      'protected',
      'Feed is unavailable because companion ownership reached its revision ceiling.',
      ownership.revision,
      ownershipDigest,
    );
  }
  const catalogue = ownership.catalogSpecies.find((row) => row.speciesId === identity.speciesId);
  if (catalogue === undefined || catalogue.genomeIdentity !== identity.genomeIdentity
    || catalogue.kingdom !== 'fauna') {
    return unavailableModel(
      surface,
      'protected',
      'Feed is unavailable because this Compendium species does not match ownership authority.',
      ownership.revision,
      ownershipDigest,
    );
  }

  const creatures = Object.freeze(ownership.creatures
    .filter((row) => row.speciesId === identity.speciesId
      && row.genomeIdentity === identity.genomeIdentity)
    .map((row): CompendiumFeedCreatureReadModelV1 => {
      const fedBefore = row.fed ?? 0;
      const status: CompendiumFeedCreatureStatus = row.assignment !== null
        ? 'assigned'
        : fedBefore >= ARC5_FED_MAX_V1 ? 'capped' : 'ready';
      const disabledReason = status === 'assigned'
        ? row.assignment!.kind === 'mission'
          ? 'This companion is away on a mission.'
          : 'This companion is recovering.'
        : status === 'capped' ? `Meals are already at ${ARC5_FED_MAX_V1}.` : null;
      return Object.freeze({
        creatureId: row.creatureId,
        label: `${row.nickname ?? recordName} · ${shortId(row.creatureId)}`,
        status,
        disabledReason,
        fedBefore,
        fedAfter: Math.min(ARC5_FED_MAX_V1, fedBefore + 1),
      });
    }));

  const catalogueBySpecies = new Map(ownership.catalogSpecies.map((row) => [row.speciesId, row]));
  const floraLots = Object.freeze(ownership.specimenLots
    .filter((row) => row.kind === 'flora')
    .map((row): CompendiumFeedFloraReadModelV1 => {
      const flora = catalogueBySpecies.get(row.speciesId);
      const label = flora?.kingdom === 'flora' && flora.alias !== null
        ? flora.alias
        : 'Flora specimen';
      return Object.freeze({
        foodLotId: row.lotId,
        speciesId: row.speciesId,
        label: `${label} · ${shortId(row.lotId)}`,
        quantityBefore: row.quantity,
        quantityAfter: row.quantity - 1,
      });
    }));

  if (creatures.length === 0) {
    return unavailableModel(
      surface,
      'no-companion',
      'No owned companion matches this fauna species.',
      ownership.revision,
      ownershipDigest,
      creatures,
      floraLots,
    );
  }
  if (!creatures.some((row) => row.status === 'ready')) {
    return unavailableModel(
      surface,
      'no-eligible-companion',
      'Every matching companion is assigned or already at the Meals cap.',
      ownership.revision,
      ownershipDigest,
      creatures,
      floraLots,
    );
  }
  if (floraLots.length === 0) {
    return unavailableModel(
      surface,
      'no-flora',
      'No owned flora lot is available to use.',
      ownership.revision,
      ownershipDigest,
      creatures,
      floraLots,
    );
  }

  const model: CompendiumFeedReadModelV1 = Object.freeze({
    schema: COMPENDIUM_FEED_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([
      surface.surfaceKey, ownership.revision, ownershipDigest, 'ready',
    ]),
    availability: 'ready',
    detail: 'Choose one exact companion and one exact flora lot, then confirm Use 1.',
    ownershipRevision: ownership.revision,
    ownershipDigest,
    creatures,
    floraLots,
  });
  READ_MODELS.add(model);
  return model;
}

function copyRequest(request: CompendiumFeedActionRequestV1): CompendiumFeedActionRequestV1 {
  return Object.freeze({
    surface: request.surface,
    contextKey: request.contextKey,
    ownershipRevision: request.ownershipRevision,
    ownershipDigest: request.ownershipDigest,
    creatureId: request.creatureId,
    foodLotId: request.foodLotId,
    fedBefore: request.fedBefore,
    fedAfter: request.fedAfter,
    foodQuantityBefore: request.foodQuantityBefore,
    foodQuantityAfter: request.foodQuantityAfter,
  });
}

function sameRequest(
  left: CompendiumFeedActionRequestV1,
  right: CompendiumFeedActionRequestV1,
): boolean {
  return left.surface.surfaceKey === right.surface.surfaceKey
    && left.contextKey === right.contextKey
    && left.ownershipRevision === right.ownershipRevision
    && left.ownershipDigest === right.ownershipDigest
    && left.creatureId === right.creatureId
    && left.foodLotId === right.foodLotId
    && left.fedBefore === right.fedBefore
    && left.fedAfter === right.fedAfter
    && left.foodQuantityBefore === right.foodQuantityBefore
    && left.foodQuantityAfter === right.foodQuantityAfter;
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

function assertOutcome(outcome: CompendiumFeedActionOutcomeV1): void {
  assertFrozenData(outcome, 'Compendium Feed outcome');
  if (outcome.schema !== COMPENDIUM_FEED_OUTCOME_SCHEMA) {
    throw new TypeError('Compendium Feed outcome must be frozen supported data');
  }
  if (outcome.kind !== 'committed' && outcome.kind !== 'committed-convergence'
    && outcome.kind !== 'refused') {
    throw new TypeError('Compendium Feed outcome kind is unsupported');
  }
  if (outcome.convergence !== 'none' && outcome.convergence !== 'read-only-reload') {
    throw new TypeError('Compendium Feed convergence is unsupported');
  }
  if (outcome.kind === 'committed' && outcome.convergence !== 'none') {
    throw new TypeError('Known committed Feed cannot request convergence');
  }
  if (outcome.kind === 'committed-convergence'
    && outcome.convergence !== 'read-only-reload') {
    throw new TypeError('Unknown committed Feed must retain reload convergence');
  }
  checkedText(outcome.title, 'Compendium Feed outcome title');
  checkedText(outcome.detail, 'Compendium Feed outcome detail');
}

export class CompendiumFeedController {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #isCurrent: (surface: CompendiumFeedSurfaceReceiptV1) => boolean;
  readonly #onNativeFeedGesture: (() => void) | null;
  readonly #onAction: ((request: CompendiumFeedActionRequestV1) => void) | null;
  #mount: HTMLElement | null = null;
  #state: CompendiumFeedReadModelV1 | null = null;
  #selectedCreatureId: CreatureInstanceId | null = null;
  #selectedFoodLotId: SpecimenLotId | null = null;
  #pending: CompendiumFeedActionRequestV1 | null = null;
  #lastRequest: CompendiumFeedActionRequestV1 | null = null;
  #lastOutcome: CompendiumFeedActionOutcomeV1 | null = null;
  #convergenceLatched = false;
  #listenersInstalled = false;
  #disposed = false;

  constructor(options: CompendiumFeedControllerOptions) {
    this.#root = options.root;
    this.#document = options.root.ownerDocument;
    this.#isCurrent = options.isCurrent;
    this.#onNativeFeedGesture = options.onNativeFeedGesture ?? null;
    this.#onAction = options.onAction ?? null;
    this.#root.addEventListener('change', this.#onChange);
    this.#root.addEventListener('click', this.#onClick);
    this.#listenersInstalled = true;
  }

  attach(mount: HTMLElement): void {
    this.#assertLive();
    if (!this.#isRootVisible()) throw new Error('Compendium Feed cannot attach to a closed panel');
    if (mount.ownerDocument !== this.#document || !this.#root.contains(mount)
      || !mount.hasAttribute('data-arc5-feed-body')) {
      throw new Error('Compendium Feed mount must be the declared Compendium descendant');
    }
    const mounts = [...this.#root.querySelectorAll<HTMLElement>('[data-arc5-feed-body]')];
    if (mounts.length !== 1 || mounts[0] !== mount) {
      throw new Error('Compendium Feed requires exactly one dynamic mount');
    }
    if (this.#mount !== null && this.#mount !== mount) this.#disposeMount(this.#mount);
    this.#mount = mount;
    this.#render();
  }

  detach(): void {
    this.#assertLive();
    if (this.#mount !== null) this.#disposeMount(this.#mount);
    this.#mount = null;
  }

  setState(state: CompendiumFeedReadModelV1 | null): void {
    this.#assertLive();
    if (state !== null && !READ_MODELS.has(state)) {
      throw new TypeError('Compendium Feed accepts only an owner-projected read model');
    }
    const priorContext = this.#state?.contextKey ?? null;
    const priorSurface = this.#state?.surface.surfaceKey ?? null;
    this.#state = state;
    if (state === null || state.contextKey !== priorContext) {
      this.#selectedCreatureId = null;
      this.#selectedFoodLotId = null;
    }
    if (state === null || state.surface.surfaceKey !== priorSurface) this.#lastOutcome = null;
    this.#render();
  }

  /** Re-evaluate Main's generation/panel receipt without replacing authority. */
  refresh(): void {
    this.#assertLive();
    this.#render();
  }

  /** Main calls this only after classifying durability. Committed outcomes
   * clear exact selections; refusals keep them available for a deliberate
   * retry. A reload convergence remains terminal for this document. */
  settle(outcome: CompendiumFeedActionOutcomeV1): void {
    this.#assertLive();
    assertOutcome(outcome);
    if (this.#pending === null || outcome.request !== this.#pending) {
      throw new Error('Compendium Feed outcome does not match its pending exact request');
    }
    this.#lastOutcome = outcome;
    this.#lastRequest = outcome.request;
    this.#pending = null;
    if (outcome.kind !== 'refused') {
      this.#selectedCreatureId = null;
      this.#selectedFoodLotId = null;
    }
    if (outcome.convergence === 'read-only-reload') this.#convergenceLatched = true;
    this.#render();
    if (this.#shouldPublishFor(outcome.request.surface)) this.#focusStatus();
  }

  diagnostics(): CompendiumFeedDiagnosticsV1 {
    return Object.freeze({
      schema: COMPENDIUM_FEED_DIAGNOSTICS_SCHEMA,
      attachedMountCount: this.#mount === null ? 0 : 1,
      retainedDomCount: this.#mount?.querySelectorAll('*').length ?? 0,
      pendingWork: this.#pending === null ? 0 : 1,
      convergenceLatched: this.#convergenceLatched,
      delegatedListenerCount: this.#listenersInstalled ? 2 : 0,
      actionControlCount: this.#mount?.querySelectorAll('[data-arc5-feed-confirm]').length ?? 0,
      radioControlCount: this.#mount?.querySelectorAll('input[type="radio"][data-arc5-feed-choice]').length ?? 0,
      surfaceKey: this.#state?.surface.surfaceKey ?? null,
      contextKey: this.#state?.contextKey ?? null,
      selectedCreatureId: this.#selectedCreatureId,
      selectedFoodLotId: this.#selectedFoodLotId,
      lastRequest: this.#lastRequest,
      lastOutcome: this.#lastOutcome,
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    if (this.#listenersInstalled) {
      this.#root.removeEventListener('change', this.#onChange);
      this.#root.removeEventListener('click', this.#onClick);
      this.#listenersInstalled = false;
    }
    if (this.#mount !== null) this.#disposeMount(this.#mount);
    this.#mount = null;
    this.#state = null;
    this.#selectedCreatureId = null;
    this.#selectedFoodLotId = null;
    this.#pending = null;
    this.#lastRequest = null;
    this.#lastOutcome = null;
    this.#convergenceLatched = false;
    this.#disposed = true;
  }

  readonly #onChange = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.HTMLInputElement) || target.type !== 'radio'
      || !this.#mount?.contains(target) || target.dataset.arc5FeedChoice === undefined
      || target.disabled || !target.checked) return;
    const focus = this.#captureFocus();
    if (target.dataset.arc5FeedChoice === 'creature') {
      const row = this.#state!.creatures.find(
        (candidate) => candidate.creatureId === target.dataset.arc5FeedCreatureId,
      );
      if (row === undefined || row.status !== 'ready') return;
      this.#selectedCreatureId = row.creatureId;
    } else if (target.dataset.arc5FeedChoice === 'flora') {
      const row = this.#state!.floraLots.find(
        (candidate) => candidate.foodLotId === target.dataset.arc5FeedFoodLotId,
      );
      if (row === undefined) return;
      this.#selectedFoodLotId = row.foodLotId;
    } else return;
    this.#render();
    this.#restoreFocus(focus);
  };

  readonly #onClick = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-arc5-feed-confirm]');
    if (!button || !this.#mount?.contains(button) || button.disabled) return;
    const request = this.#selectedRequest();
    if (request === null) return;
    const priorOutcome = this.#lastOutcome;
    this.#pending = request;
    this.#lastRequest = request;
    this.#lastOutcome = null;
    this.#render();
    this.#focusStatus();
    try {
      if (event.isTrusted) this.#onNativeFeedGesture?.();
      this.#onAction?.(request);
    } catch (error) {
      if (this.#pending !== null && sameRequest(this.#pending, request)
        && !this.#convergenceLatched) {
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
    if (!this.#isRootVisible()) {
      this.#disposeMount(mount);
      this.#mount = null;
      return;
    }
    const focus = this.#captureFocus();
    const fragment = this.#document.createDocumentFragment();
    const heading = this.#node('h4', '', 'Feed companion');
    heading.dataset.arc5FeedHeading = 'true';
    heading.dataset.semanticKey = 'feed:heading';
    heading.tabIndex = -1;
    fragment.append(heading);
    const state = this.#state;
    if (state === null) {
      fragment.append(this.#message('Feed facts are unavailable.', 'absent'));
    } else {
      const detail = this.#node('p', 'compendium-feed-detail', state.detail);
      detail.dataset.arc5FeedState = state.availability;
      fragment.append(detail);
      if (state.creatures.length > 0) fragment.append(this.#creatureFieldset(state));
      if (state.floraLots.length > 0) fragment.append(this.#floraFieldset(state));
      if (state.availability === 'ready') {
        fragment.append(this.#summaryNode(state), this.#confirmButton());
      }
    }
    fragment.append(this.#statusNode());
    mount.replaceChildren(fragment);
    mount.dataset.arc5FeedController = 'v1';
    if (state === null) {
      delete mount.dataset.arc5FeedContextKey;
      delete mount.dataset.arc5FeedSurfaceKey;
    } else {
      mount.dataset.arc5FeedContextKey = state.contextKey;
      mount.dataset.arc5FeedSurfaceKey = state.surface.surfaceKey;
    }
    this.#applyAvailability();
    this.#paintStatus();
    if (focus.owned && this.#surfaceIsCurrent()) this.#restoreFocus(focus);
  }

  #creatureFieldset(state: CompendiumFeedReadModelV1): HTMLFieldSetElement {
    const fieldset = this.#document.createElement('fieldset');
    fieldset.dataset.arc5FeedCreatureGroup = 'true';
    const legend = this.#node('legend', '', 'Choose an owned companion');
    fieldset.append(legend);
    state.creatures.forEach((row, index) => {
      const input = this.#document.createElement('input');
      input.type = 'radio';
      input.name = 'arc5-feed-creature';
      input.id = `arc5-feed-creature-${index}`;
      input.value = row.creatureId;
      input.checked = this.#selectedCreatureId === row.creatureId;
      input.dataset.arc5FeedChoice = 'creature';
      input.dataset.arc5FeedCreatureId = row.creatureId;
      input.dataset.focusKey = `feed:creature:${row.creatureId}`;
      input.dataset.semanticKey = `feed:creature:${row.creatureId}`;
      input.dataset.rowEnabled = String(row.status === 'ready');
      input.title = row.disabledReason ?? row.creatureId;
      const label = this.#choiceLabel(input.id);
      label.dataset.arc5FeedCreatureLabel = row.creatureId;
      label.title = row.creatureId;
      label.append(input, this.#node(
        'span',
        '',
        `${row.label} · Meals ${row.fedBefore}${row.status === 'ready'
          ? ` → ${row.fedAfter}`
          : ` · ${row.disabledReason ?? 'Unavailable'}`}`,
      ));
      fieldset.append(label);
    });
    return fieldset;
  }

  #floraFieldset(state: CompendiumFeedReadModelV1): HTMLFieldSetElement {
    const fieldset = this.#document.createElement('fieldset');
    fieldset.dataset.arc5FeedFloraGroup = 'true';
    const legend = this.#node('legend', '', 'Choose one flora lot');
    fieldset.append(legend);
    state.floraLots.forEach((row, index) => {
      const input = this.#document.createElement('input');
      input.type = 'radio';
      input.name = 'arc5-feed-flora';
      input.id = `arc5-feed-flora-${index}`;
      input.value = row.foodLotId;
      input.checked = this.#selectedFoodLotId === row.foodLotId;
      input.dataset.arc5FeedChoice = 'flora';
      input.dataset.arc5FeedFoodLotId = row.foodLotId;
      input.dataset.focusKey = `feed:flora:${row.foodLotId}`;
      input.dataset.semanticKey = `feed:flora:${row.foodLotId}`;
      input.dataset.rowEnabled = 'true';
      input.title = row.foodLotId;
      const label = this.#choiceLabel(input.id);
      label.dataset.arc5FeedFloraLabel = row.foodLotId;
      label.title = row.foodLotId;
      label.append(input, this.#node(
        'span',
        '',
        `${row.label} · Quantity ${row.quantityBefore} → ${row.quantityAfter}`,
      ));
      fieldset.append(label);
    });
    return fieldset;
  }

  #choiceLabel(forId: string): HTMLLabelElement {
    const label = this.#document.createElement('label');
    label.htmlFor = forId;
    label.className = 'compendium-feed-choice';
    /* This isolated controller lands before shared CSS integration. Retain
       the mobile target floor in the owner so the half-batch is not shipped
       with an undersized native label. */
    label.style.minHeight = '44px';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    return label;
  }

  #summaryNode(state: CompendiumFeedReadModelV1): HTMLElement {
    const creature = state.creatures.find((row) => row.creatureId === this.#selectedCreatureId);
    const flora = state.floraLots.find((row) => row.foodLotId === this.#selectedFoodLotId);
    const summary = this.#node('p', 'compendium-feed-summary');
    summary.dataset.arc5FeedSummary = 'true';
    if (creature === undefined || flora === undefined) {
      summary.textContent = 'Choose one companion and one flora lot to preview Use 1.';
    } else {
      summary.textContent = `${creature.label}: Meals ${creature.fedBefore} → ${creature.fedAfter}. Use 1 ${flora.label}: Quantity ${flora.quantityBefore} → ${flora.quantityAfter}.`;
      summary.dataset.creatureId = creature.creatureId;
      summary.dataset.foodLotId = flora.foodLotId;
      summary.dataset.fedBefore = String(creature.fedBefore);
      summary.dataset.fedAfter = String(creature.fedAfter);
      summary.dataset.foodQuantityBefore = String(flora.quantityBefore);
      summary.dataset.foodQuantityAfter = String(flora.quantityAfter);
    }
    return summary;
  }

  #confirmButton(): HTMLButtonElement {
    const button = this.#node('button', 'compendium-feed-confirm', 'Use 1');
    button.type = 'button';
    button.dataset.arc5FeedConfirm = 'true';
    button.dataset.focusKey = 'feed:confirm';
    button.dataset.semanticKey = 'feed:confirm';
    button.style.minHeight = '44px';
    return button;
  }

  #statusNode(): HTMLElement {
    const status = this.#node('p', 'compendium-feed-status');
    status.dataset.arc5FeedStatus = 'true';
    status.dataset.semanticKey = 'feed:status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    status.hidden = true;
    return status;
  }

  #message(text: string, state: string): HTMLElement {
    const message = this.#node('p', 'compendium-feed-detail', text);
    message.dataset.arc5FeedState = state;
    return message;
  }

  #applyAvailability(): void {
    const mount = this.#mount;
    const state = this.#state;
    if (mount === null) return;
    const busy = this.#pending !== null || this.#convergenceLatched;
    const current = this.#surfaceIsCurrent();
    mount.setAttribute('aria-busy', String(this.#pending !== null));
    for (const input of mount.querySelectorAll<HTMLInputElement>(
      'input[type="radio"][data-arc5-feed-choice]',
    )) {
      input.disabled = busy || !current || state?.availability !== 'ready'
        || input.dataset.rowEnabled !== 'true';
      input.setAttribute('aria-disabled', String(input.disabled));
    }
    const confirm = mount.querySelector<HTMLButtonElement>('[data-arc5-feed-confirm]');
    if (confirm !== null) {
      confirm.disabled = busy || !current || this.#selectedRequest() === null
        || this.#onAction === null;
      confirm.setAttribute('aria-disabled', String(confirm.disabled));
      confirm.title = busy ? 'Another Feed action is pending.'
        : !current ? 'This Compendium detail is no longer current.'
          : this.#onAction === null ? 'Feed action coordinator is unavailable.'
            : confirm.disabled ? 'Choose one companion and one flora lot.' : '';
    }
  }

  #paintStatus(): void {
    const status = this.#mount?.querySelector<HTMLElement>('[data-arc5-feed-status]') ?? null;
    const state = this.#state;
    if (status === null) return;
    if (this.#lastOutcome !== null && state !== null
      && this.#lastOutcome.request.surface.surfaceKey === state.surface.surfaceKey) {
      status.hidden = false;
      status.dataset.kind = this.#lastOutcome.kind;
      status.dataset.convergence = this.#lastOutcome.convergence;
      status.textContent = `${this.#lastOutcome.title} ${this.#lastOutcome.detail}`;
      return;
    }
    if (this.#pending !== null && state !== null
      && this.#pending.surface.surfaceKey === state.surface.surfaceKey) {
      status.hidden = false;
      status.dataset.kind = 'pending';
      status.dataset.convergence = 'none';
      status.textContent = 'Feed pending. Meals and flora quantity stay unchanged until the durable outcome settles. Back and Close remain available.';
      return;
    }
    status.hidden = true;
    delete status.dataset.kind;
    delete status.dataset.convergence;
    status.textContent = '';
  }

  #selectedRequest(): CompendiumFeedActionRequestV1 | null {
    const state = this.#state;
    if (state === null || state.availability !== 'ready'
      || state.ownershipRevision === null || state.ownershipDigest === null
      || this.#selectedCreatureId === null || this.#selectedFoodLotId === null) return null;
    const creature = state.creatures.find((row) => row.creatureId === this.#selectedCreatureId);
    const flora = state.floraLots.find((row) => row.foodLotId === this.#selectedFoodLotId);
    if (creature === undefined || creature.status !== 'ready' || flora === undefined) return null;
    return copyRequest({
      surface: state.surface,
      contextKey: state.contextKey,
      ownershipRevision: state.ownershipRevision,
      ownershipDigest: state.ownershipDigest,
      creatureId: creature.creatureId,
      foodLotId: flora.foodLotId,
      fedBefore: creature.fedBefore,
      fedAfter: creature.fedAfter,
      foodQuantityBefore: flora.quantityBefore,
      foodQuantityAfter: flora.quantityAfter,
    });
  }

  #canInteract(): boolean {
    return !this.#disposed && this.#pending === null && !this.#convergenceLatched
      && this.#mount !== null && this.#state?.availability === 'ready'
      && this.#isRootVisible() && this.#surfaceIsCurrent();
  }

  #surfaceIsCurrent(): boolean {
    const surface = this.#state?.surface;
    if (surface === undefined) return false;
    try { return this.#isCurrent(surface) === true; } catch { return false; }
  }

  #shouldPublishFor(surface: CompendiumFeedSurfaceReceiptV1): boolean {
    return this.#mount !== null && this.#state?.surface.surfaceKey === surface.surfaceKey
      && this.#isRootVisible() && this.#surfaceIsCurrent();
  }

  #captureFocus(): FocusReceipt {
    const mount = this.#mount;
    const view = this.#document.defaultView;
    const active = this.#document.activeElement;
    const owned = !!mount && !!view && active instanceof view.HTMLElement && mount.contains(active);
    const keyed = owned ? active.closest<HTMLElement>('[data-focus-key]') : null;
    const semantic = owned ? active.closest<HTMLElement>('[data-semantic-key]') : null;
    return Object.freeze({
      focusKey: keyed?.dataset.focusKey ?? null,
      semanticKey: semantic?.dataset.semanticKey ?? null,
      owned,
    });
  }

  #restoreFocus(receipt: FocusReceipt): void {
    if (!receipt.owned || this.#mount === null || !this.#isRootVisible()) return;
    const target = [...this.#mount.querySelectorAll<HTMLElement>('[data-focus-key]')]
      .find((element) => element.dataset.focusKey === receipt.focusKey
        && element.closest<HTMLElement>('[data-semantic-key]')?.dataset.semanticKey
          === receipt.semanticKey) ?? null;
    if (this.#restoreElement(target)) return;
    const semantic = [...this.#mount.querySelectorAll<HTMLElement>('[data-semantic-key]')]
      .find((element) => element.dataset.semanticKey === receipt.semanticKey) ?? null;
    if (this.#restoreElement(semantic)) return;
    this.#restoreElement(this.#mount.querySelector<HTMLElement>('[data-arc5-feed-heading]'));
  }

  #focusStatus(): void {
    this.#restoreElement(this.#mount?.querySelector<HTMLElement>('[data-arc5-feed-status]') ?? null);
  }

  #focusConfirm(): void {
    this.#restoreElement(this.#mount?.querySelector<HTMLElement>('[data-arc5-feed-confirm]') ?? null);
  }

  #restoreElement(element: HTMLElement | null): boolean {
    if (!element?.isConnected || element.hidden || element.closest('[hidden],[inert]')
      || this.#disabled(element)) return false;
    try { element.focus(); } catch { return false; }
    return this.#document.activeElement === element;
  }

  #disabled(element: HTMLElement): boolean {
    const view = this.#document.defaultView;
    return !!view && ((element instanceof view.HTMLButtonElement
      || element instanceof view.HTMLInputElement) && element.disabled);
  }

  #disposeMount(mount: HTMLElement): void {
    mount.replaceChildren();
    mount.removeAttribute('aria-busy');
    delete mount.dataset.arc5FeedController;
    delete mount.dataset.arc5FeedContextKey;
    delete mount.dataset.arc5FeedSurfaceKey;
  }

  #isRootVisible(): boolean {
    return this.#root.isConnected && !this.#root.hidden
      && this.#root.getAttribute('aria-hidden') !== 'true'
      && this.#root.style.display !== 'none';
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
    if (this.#disposed) throw new Error('Compendium Feed controller is disposed');
  }
}
