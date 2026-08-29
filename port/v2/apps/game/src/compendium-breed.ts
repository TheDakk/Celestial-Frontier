/* Arc 5 Compendium Breed + Recovery presentation owner.

   The projector reads one real fauna detail against the registered Arc 5
   ownership state. The controller keeps both exact parent selections bounded
   to one small page of DOM, displays the domain-owned odds, and publishes no
   child or Recovery until Main settles a durable outcome. */
import {
  MAX_OWNERSHIP_REVISION,
  canonicalGenomeIdentityV1,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type OwnershipStateV2,
  type SpeciesId,
} from '@cf/domain-acquisition';
import {
  ARC5_BREED_FAILURE_RECOVERY_MS_V1,
  ARC5_BREED_INJURY_THRESHOLD_V1,
  ARC5_BREED_SUCCESS_RECOVERY_MS_V1,
  companionBreedOddsV1,
  earnedStardustBonusV1,
} from '@cf/domain-acquisition/breed-internal';
import { projectCompanionAvailabilityV1 } from '@cf/domain-acquisition/companion-availability';
import { speciesGrade, type Genome } from '@cf/domain-genome';

export const COMPENDIUM_BREED_READ_MODEL_SCHEMA =
  'cf-v2-compendium-breed-read-model/v1' as const;
export const COMPENDIUM_BREED_OUTCOME_SCHEMA =
  'cf-v2-compendium-breed-outcome/v1' as const;
export const COMPENDIUM_BREED_DIAGNOSTICS_SCHEMA =
  'cf-v2-compendium-breed-diagnostics/v1' as const;
export const COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1 = 24;

export type CompendiumBreedAvailability =
  | 'ready'
  | 'fixture'
  | 'non-fauna'
  | 'protected'
  | 'no-primary'
  | 'no-eligible-primary'
  | 'no-eligible-mate';

export type CompendiumBreedParentStatus =
  | 'ready'
  | 'exhibit'
  | 'mission'
  | 'recovery'
  | 'injured';

export interface CompendiumBreedRecordV1 {
  readonly id: string;
  readonly name: string;
  readonly g: Readonly<Record<string, unknown>>;
}

export interface CompendiumBreedProjectionInputV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly record: CompendiumBreedRecordV1;
  readonly ownership: OwnershipStateV2 | null;
  readonly protected: boolean;
  readonly fixture: boolean;
  readonly activePlayMs: number;
  /** Lifetime earned Stardust; the domain projects and caps the public bonus. */
  readonly earnedStardust: number;
}

export interface CompendiumBreedSurfaceReceiptV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly speciesId: SpeciesId | null;
  readonly surfaceKey: string;
}

export interface CompendiumBreedParentReadModelV1 {
  readonly creatureId: CreatureInstanceId;
  readonly speciesId: SpeciesId;
  readonly label: string;
  readonly tier: number;
  readonly status: CompendiumBreedParentStatus;
  readonly disabledReason: string | null;
  readonly hurt: number;
  readonly recoveryRemainingActivePlayMs: number;
}

export interface CompendiumBreedReadModelV1 {
  readonly schema: typeof COMPENDIUM_BREED_READ_MODEL_SCHEMA;
  readonly surface: CompendiumBreedSurfaceReceiptV1;
  readonly contextKey: string;
  readonly availability: CompendiumBreedAvailability;
  readonly detail: string;
  readonly ownershipRevision: number | null;
  readonly ownershipDigest: string | null;
  readonly activePlayMs: number;
  readonly earnedStardustBonus: number;
  readonly primaryParents: readonly CompendiumBreedParentReadModelV1[];
  readonly mateParents: readonly CompendiumBreedParentReadModelV1[];
}

export interface CompendiumBreedActionRequestV1 {
  readonly surface: CompendiumBreedSurfaceReceiptV1;
  readonly contextKey: string;
  readonly ownershipRevision: number;
  readonly ownershipDigest: string;
  readonly parentCreatureIds: readonly [CreatureInstanceId, CreatureInstanceId];
  readonly earnedStardustBonus: number;
  readonly odds: number;
}

export type CompendiumBreedOutcomeKind =
  | 'committed-success'
  | 'committed-failure'
  | 'committed-convergence'
  | 'refused';

export interface CompendiumBreedActionOutcomeV1 {
  readonly schema: typeof COMPENDIUM_BREED_OUTCOME_SCHEMA;
  readonly kind: CompendiumBreedOutcomeKind;
  readonly convergence: 'none' | 'read-only-reload';
  readonly request: CompendiumBreedActionRequestV1;
  readonly title: string;
  readonly detail: string;
}

export interface CompendiumBreedControllerOptions {
  readonly root: HTMLElement;
  readonly isCurrent: (surface: CompendiumBreedSurfaceReceiptV1) => boolean;
  readonly onAction?: (request: CompendiumBreedActionRequestV1) => void;
}

export interface CompendiumBreedDiagnosticsV1 {
  readonly schema: typeof COMPENDIUM_BREED_DIAGNOSTICS_SCHEMA;
  readonly attachedMountCount: 0 | 1;
  readonly retainedDomCount: number;
  readonly pendingWork: 0 | 1;
  readonly convergenceLatched: boolean;
  readonly delegatedListenerCount: 0 | 2;
  readonly renderedParentControlCount: number;
  readonly selectedPrimaryId: CreatureInstanceId | null;
  readonly selectedMateId: CreatureInstanceId | null;
  readonly primaryPage: number;
  readonly matePage: number;
  readonly surfaceKey: string | null;
  readonly contextKey: string | null;
  readonly lastRequest: CompendiumBreedActionRequestV1 | null;
  readonly lastOutcome: CompendiumBreedActionOutcomeV1 | null;
}

interface FocusReceipt {
  readonly key: string | null;
  readonly owned: boolean;
}

const READ_MODELS = new WeakSet<object>();

function checkedText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} must be non-empty bounded text`);
  }
  return value;
}

function checkedSafeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
  return value as number;
}

function shortId(value: string): string {
  return value.slice(-8);
}

function recoveryTime(value: number): string {
  const seconds = Math.max(0, Math.ceil(value / 1_000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function surfaceReceipt(
  generation: number,
  logicalId: string,
  speciesId: SpeciesId | null,
): CompendiumBreedSurfaceReceiptV1 {
  return Object.freeze({
    generation,
    logicalId,
    speciesId,
    surfaceKey: JSON.stringify([generation, logicalId, speciesId]),
  });
}

function unavailableModel(
  surface: CompendiumBreedSurfaceReceiptV1,
  availability: Exclude<CompendiumBreedAvailability, 'ready'>,
  detail: string,
  input: Readonly<{
    activePlayMs: number;
    earnedStardustBonus?: number;
    ownershipRevision?: number | null;
    ownershipDigest?: string | null;
    primaryParents?: readonly CompendiumBreedParentReadModelV1[];
    mateParents?: readonly CompendiumBreedParentReadModelV1[];
  }>,
): CompendiumBreedReadModelV1 {
  const ownershipRevision = input.ownershipRevision ?? null;
  const ownershipDigest = input.ownershipDigest ?? null;
  const model: CompendiumBreedReadModelV1 = Object.freeze({
    schema: COMPENDIUM_BREED_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([
      surface.surfaceKey,
      ownershipRevision,
      ownershipDigest,
      input.earnedStardustBonus ?? 0,
      availability,
    ]),
    availability,
    detail,
    ownershipRevision,
    ownershipDigest,
    activePlayMs: input.activePlayMs,
    earnedStardustBonus: input.earnedStardustBonus ?? 0,
    primaryParents: input.primaryParents ?? Object.freeze([]),
    mateParents: input.mateParents ?? Object.freeze([]),
  });
  READ_MODELS.add(model);
  return model;
}

function parentStatus(
  creature: OwnershipStateV2['creatures'][number],
  activePlayMs: number,
): Readonly<{
  status: CompendiumBreedParentStatus;
  disabledReason: string | null;
  recoveryRemainingActivePlayMs: number;
}> {
  if (creature.genome.exhibit === true) {
    return Object.freeze({
      status: 'exhibit',
      disabledReason: 'Exhibition challengers are not owned breeding companions.',
      recoveryRemainingActivePlayMs: 0,
    });
  }
  const availability = projectCompanionAvailabilityV1(creature, activePlayMs);
  if (availability.assignment?.kind === 'mission') {
    return Object.freeze({
      status: 'mission',
      disabledReason: 'Away on a companion mission; Breed, combat, and dispatch are locked.',
      recoveryRemainingActivePlayMs: 0,
    });
  }
  if (availability.assignment?.kind === 'recovery') {
    return Object.freeze({
      status: 'recovery',
      disabledReason: `Recovery ${recoveryTime(availability.recoveryRemainingActivePlayMs)} active play remaining; Breed, combat, and dispatch are locked.`,
      recoveryRemainingActivePlayMs: availability.recoveryRemainingActivePlayMs,
    });
  }
  const hurt = creature.hurt ?? 0;
  if (hurt >= ARC5_BREED_INJURY_THRESHOLD_V1) {
    return Object.freeze({
      status: 'injured',
      disabledReason: `Injured (${Math.round(hurt * 100)}% hurt); recover below 30% before breeding.`,
      recoveryRemainingActivePlayMs: 0,
    });
  }
  return Object.freeze({
    status: 'ready',
    disabledReason: null,
    recoveryRemainingActivePlayMs: 0,
  });
}

/** Project exact parents and locks without mutating the ownership authority. */
export function projectCompendiumBreedV1(
  input: CompendiumBreedProjectionInputV1,
): CompendiumBreedReadModelV1 {
  const generation = checkedSafeInteger(input.generation, 'Compendium Breed generation');
  const activePlayMs = checkedSafeInteger(input.activePlayMs, 'Compendium Breed active-play time');
  const logicalId = checkedText(input.logicalId, 'Compendium logical ID', 128);
  const emptySurface = surfaceReceipt(generation, logicalId, null);
  if (input.fixture) {
    return unavailableModel(emptySurface, 'fixture',
      'Breed is unavailable for diagnostic Compendium fixtures.', { activePlayMs });
  }

  let recordId: string;
  let recordName: string;
  let identity: ReturnType<typeof canonicalGenomeIdentityV1>;
  try {
    recordId = checkedText(input.record?.id, 'Compendium record ID', 128);
    recordName = checkedText(input.record?.name, 'Compendium record name', 256);
    if (recordId !== logicalId || !input.record.g || typeof input.record.g !== 'object'
      || Array.isArray(input.record.g)) throw new TypeError('record is not authoritative');
    identity = canonicalGenomeIdentityV1(input.record.g);
  } catch {
    return unavailableModel(emptySurface, 'protected',
      'Breed is unavailable because this Compendium record did not verify.', { activePlayMs });
  }
  const surface = surfaceReceipt(generation, logicalId, identity.speciesId);
  if (identity.kingdom !== 'fauna') {
    return unavailableModel(surface, 'non-fauna',
      'Breed is available only from an owned fauna companion detail.', { activePlayMs });
  }

  const ownership = input.ownership;
  if (input.protected || ownership === null || !isOwnershipStateV2(ownership)
    || ownership.mode !== 'current') {
    return unavailableModel(surface, 'protected',
      'Breed is unavailable while companion ownership is protected.', { activePlayMs });
  }
  let earnedStardustBonus: number;
  try { earnedStardustBonus = earnedStardustBonusV1(input.earnedStardust); }
  catch {
    return unavailableModel(surface, 'protected',
      'Breed is unavailable because lifetime Stardust authority did not verify.', { activePlayMs });
  }
  const ownershipDigest = ownershipStateDigestV2(ownership);
  const common = Object.freeze({
    activePlayMs,
    earnedStardustBonus,
    ownershipRevision: ownership.revision,
    ownershipDigest,
  });
  if (ownership.revision === MAX_OWNERSHIP_REVISION) {
    return unavailableModel(surface, 'protected',
      'Breed is unavailable because companion ownership reached its revision ceiling.', common);
  }
  const catalogue = ownership.catalogSpecies.find((row) => row.speciesId === identity.speciesId);
  if (catalogue === undefined || catalogue.genomeIdentity !== identity.genomeIdentity
    || catalogue.kingdom !== 'fauna') {
    return unavailableModel(surface, 'protected',
      'Breed is unavailable because this Compendium species does not match ownership authority.', common);
  }

  const catalogueBySpecies = new Map(ownership.catalogSpecies.map((row) => [row.speciesId, row]));
  const creatureById = new Map(ownership.creatures.map((row) => [row.creatureId, row]));
  const mateParents = Object.freeze(ownership.creatures
    .filter((row) => row.genome.kingdom === 'fauna')
    .map((row): CompendiumBreedParentReadModelV1 => {
      const state = parentStatus(row, activePlayMs);
      const species = catalogueBySpecies.get(row.speciesId);
      const label = row.nickname ?? species?.alias
        ?? (row.speciesId === identity.speciesId ? recordName : 'Fauna companion');
      return Object.freeze({
        creatureId: row.creatureId,
        speciesId: row.speciesId,
        label: `${label} · ${shortId(row.creatureId)}`,
        tier: speciesGrade(row.genome as unknown as Genome).tier,
        status: state.status,
        disabledReason: state.disabledReason,
        hurt: row.hurt ?? 0,
        recoveryRemainingActivePlayMs: state.recoveryRemainingActivePlayMs,
      });
    }));
  const primaryParents = Object.freeze(mateParents.filter((row) => {
    const creature = creatureById.get(row.creatureId);
    return creature?.speciesId === identity.speciesId
      && creature.genomeIdentity === identity.genomeIdentity;
  }));
  const populated = Object.freeze({ ...common, primaryParents, mateParents });
  if (primaryParents.length === 0) {
    return unavailableModel(surface, 'no-primary',
      'No owned companion matches this fauna detail.', populated);
  }
  const readyPrimary = primaryParents.filter((row) => row.status === 'ready');
  if (readyPrimary.length === 0) {
    return unavailableModel(surface, 'no-eligible-primary',
      'Every matching companion is injured, assigned, recovering, or exhibition-only.', populated);
  }
  const canPair = mateParents.filter((mate) => mate.status === 'ready').length >= 2;
  if (!canPair) {
    return unavailableModel(surface, 'no-eligible-mate',
      'No second eligible owned fauna companion is available.', populated);
  }

  const model: CompendiumBreedReadModelV1 = Object.freeze({
    schema: COMPENDIUM_BREED_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([
      surface.surfaceKey, ownership.revision, ownershipDigest, earnedStardustBonus, 'ready',
    ]),
    availability: 'ready',
    detail: 'Choose this detail\'s exact companion and one distinct fauna mate. Review the exact odds and active-play Recovery before confirming.',
    ownershipRevision: ownership.revision,
    ownershipDigest,
    activePlayMs,
    earnedStardustBonus,
    primaryParents,
    mateParents,
  });
  READ_MODELS.add(model);
  return model;
}

function assertFrozenData(value: unknown, label: string, seen = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new RangeError(`${label} contains a non-finite number`);
    return;
  }
  if (typeof value !== 'object' || seen.has(value) || !Object.isFrozen(value)) {
    throw new TypeError(`${label} must be deeply frozen acyclic data`);
  }
  seen.add(value);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null && prototype !== Array.prototype) {
    throw new TypeError(`${label} must contain only plain data`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = typeof key === 'string'
      ? Object.getOwnPropertyDescriptor(value, key) : undefined;
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`${label} must contain only string data fields`);
    }
    assertFrozenData(descriptor.value, `${label}.${String(key)}`, seen);
  }
  seen.delete(value);
}

function assertOutcome(outcome: CompendiumBreedActionOutcomeV1): void {
  assertFrozenData(outcome, 'Compendium Breed outcome');
  if (outcome.schema !== COMPENDIUM_BREED_OUTCOME_SCHEMA) {
    throw new TypeError('Compendium Breed outcome must be frozen supported data');
  }
  if (outcome.kind !== 'committed-success' && outcome.kind !== 'committed-failure'
    && outcome.kind !== 'committed-convergence' && outcome.kind !== 'refused') {
    throw new TypeError('Compendium Breed outcome kind is unsupported');
  }
  if (outcome.convergence !== 'none' && outcome.convergence !== 'read-only-reload') {
    throw new TypeError('Compendium Breed convergence is unsupported');
  }
  const committed = outcome.kind === 'committed-success'
    || outcome.kind === 'committed-failure';
  if (committed && outcome.convergence !== 'none') {
    throw new TypeError('Known committed Breed cannot request convergence');
  }
  if (outcome.kind === 'committed-convergence'
    && outcome.convergence !== 'read-only-reload') {
    throw new TypeError('Unknown committed Breed must retain reload convergence');
  }
  checkedText(outcome.title, 'Compendium Breed outcome title', 8_192);
  checkedText(outcome.detail, 'Compendium Breed outcome detail', 8_192);
}

export class CompendiumBreedController {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #isCurrent: (surface: CompendiumBreedSurfaceReceiptV1) => boolean;
  readonly #onAction: ((request: CompendiumBreedActionRequestV1) => void) | null;
  #mount: HTMLElement | null = null;
  #state: CompendiumBreedReadModelV1 | null = null;
  #selectedPrimaryId: CreatureInstanceId | null = null;
  #selectedMateId: CreatureInstanceId | null = null;
  #primaryPage = 0;
  #matePage = 0;
  #pending: CompendiumBreedActionRequestV1 | null = null;
  #lastRequest: CompendiumBreedActionRequestV1 | null = null;
  #lastOutcome: CompendiumBreedActionOutcomeV1 | null = null;
  #convergenceLatched = false;
  #listenersInstalled = false;
  #disposed = false;

  constructor(options: CompendiumBreedControllerOptions) {
    this.#root = options.root;
    this.#document = options.root.ownerDocument;
    this.#isCurrent = options.isCurrent;
    this.#onAction = options.onAction ?? null;
    this.#root.addEventListener('change', this.#onChange);
    this.#root.addEventListener('click', this.#onClick);
    this.#listenersInstalled = true;
  }

  attach(mount: HTMLElement): void {
    this.#assertLive();
    if (!this.#isRootVisible() || mount.ownerDocument !== this.#document
      || !this.#root.contains(mount) || !mount.hasAttribute('data-arc5-breed-body')) {
      throw new Error('Compendium Breed mount must be the current declared descendant');
    }
    const mounts = [...this.#root.querySelectorAll<HTMLElement>('[data-arc5-breed-body]')];
    if (mounts.length !== 1 || mounts[0] !== mount) {
      throw new Error('Compendium Breed requires exactly one dynamic mount');
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

  setState(state: CompendiumBreedReadModelV1 | null): void {
    this.#assertLive();
    if (state !== null && !READ_MODELS.has(state)) {
      throw new TypeError('Compendium Breed accepts only an owner-projected read model');
    }
    const priorContext = this.#state?.contextKey ?? null;
    const priorSurface = this.#state?.surface.surfaceKey ?? null;
    this.#state = state;
    if (state === null || state.contextKey !== priorContext) {
      this.#selectedPrimaryId = null;
      this.#selectedMateId = null;
      this.#primaryPage = 0;
      this.#matePage = 0;
    }
    if (state === null || state.surface.surfaceKey !== priorSurface) this.#lastOutcome = null;
    this.#normalizeSelections();
    this.#render();
  }

  refresh(): void {
    this.#assertLive();
    this.#render();
  }

  settle(outcome: CompendiumBreedActionOutcomeV1): void {
    this.#assertLive();
    assertOutcome(outcome);
    if (this.#pending === null || outcome.request !== this.#pending) {
      throw new Error('Compendium Breed outcome does not match its pending exact request');
    }
    this.#lastOutcome = outcome;
    this.#lastRequest = outcome.request;
    this.#pending = null;
    if (outcome.kind !== 'refused') {
      this.#selectedPrimaryId = null;
      this.#selectedMateId = null;
    }
    if (outcome.convergence === 'read-only-reload') this.#convergenceLatched = true;
    this.#render();
    if (this.#shouldPublishFor(outcome.request.surface)) this.#focusStatus();
  }

  diagnostics(): CompendiumBreedDiagnosticsV1 {
    return Object.freeze({
      schema: COMPENDIUM_BREED_DIAGNOSTICS_SCHEMA,
      attachedMountCount: this.#mount === null ? 0 : 1,
      retainedDomCount: this.#mount?.querySelectorAll('*').length ?? 0,
      pendingWork: this.#pending === null ? 0 : 1,
      convergenceLatched: this.#convergenceLatched,
      delegatedListenerCount: this.#listenersInstalled ? 2 : 0,
      renderedParentControlCount: this.#mount?.querySelectorAll(
        'input[type="radio"][data-arc5-breed-choice]',
      ).length ?? 0,
      selectedPrimaryId: this.#selectedPrimaryId,
      selectedMateId: this.#selectedMateId,
      primaryPage: this.#primaryPage,
      matePage: this.#matePage,
      surfaceKey: this.#state?.surface.surfaceKey ?? null,
      contextKey: this.#state?.contextKey ?? null,
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
    this.#selectedPrimaryId = null;
    this.#selectedMateId = null;
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
      || !this.#mount?.contains(target) || target.disabled || !target.checked) return;
    const focus = this.#captureFocus();
    if (target.dataset.arc5BreedChoice === 'primary') {
      const row = this.#state!.primaryParents.find(
        (candidate) => candidate.creatureId === target.dataset.arc5BreedCreatureId,
      );
      if (row?.status !== 'ready') return;
      this.#selectedPrimaryId = row.creatureId;
      if (this.#selectedMateId === row.creatureId) this.#selectedMateId = null;
    } else if (target.dataset.arc5BreedChoice === 'mate') {
      const row = this.#state!.mateParents.find(
        (candidate) => candidate.creatureId === target.dataset.arc5BreedCreatureId,
      );
      if (row?.status !== 'ready' || row.creatureId === this.#selectedPrimaryId) return;
      this.#selectedMateId = row.creatureId;
    } else return;
    this.#render();
    this.#restoreFocus(focus);
  };

  readonly #onClick = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element)) return;
    const pager = target.closest<HTMLButtonElement>('button[data-arc5-breed-page]');
    if (pager && this.#mount?.contains(pager) && !pager.disabled) {
      const delta = pager.dataset.arc5BreedDirection === 'next' ? 1 : -1;
      if (pager.dataset.arc5BreedPage === 'primary') this.#primaryPage += delta;
      else this.#matePage += delta;
      const focusKey = pager.dataset.focusKey ?? null;
      this.#normalizeSelections();
      this.#render();
      this.#focusByKey(focusKey);
      return;
    }
    const button = target.closest<HTMLButtonElement>('button[data-arc5-breed-confirm]');
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
    if (!this.#isRootVisible()) {
      this.#disposeMount(mount);
      this.#mount = null;
      return;
    }
    const focus = this.#captureFocus();
    const fragment = this.#document.createDocumentFragment();
    const heading = this.#node('h4', '', 'Breed companions');
    heading.dataset.arc5BreedHeading = 'true';
    heading.dataset.focusKey = 'breed:heading';
    heading.tabIndex = -1;
    fragment.append(heading);
    const state = this.#state;
    if (state === null) {
      fragment.append(this.#message('Breed facts are unavailable.', 'absent'));
    } else {
      const detail = this.#node('p', 'compendium-feed-detail', state.detail);
      detail.dataset.arc5BreedState = state.availability;
      fragment.append(detail);
      if (state.primaryParents.length > 0) {
        fragment.append(this.#parentFieldset('primary', state.primaryParents, this.#primaryPage));
      }
      if (state.mateParents.length > 0) {
        fragment.append(this.#parentFieldset('mate', state.mateParents, this.#matePage));
      }
      if (state.availability === 'ready') {
        fragment.append(this.#summaryNode(state), this.#confirmButton());
      }
    }
    fragment.append(this.#statusNode());
    mount.replaceChildren(fragment);
    mount.dataset.arc5BreedController = 'v1';
    if (state === null) {
      delete mount.dataset.arc5BreedContextKey;
      delete mount.dataset.arc5BreedSurfaceKey;
    } else {
      mount.dataset.arc5BreedContextKey = state.contextKey;
      mount.dataset.arc5BreedSurfaceKey = state.surface.surfaceKey;
    }
    this.#applyAvailability();
    this.#paintStatus();
    if (focus.owned && this.#surfaceIsCurrent()) this.#restoreFocus(focus);
  }

  #parentFieldset(
    kind: 'primary' | 'mate',
    rows: readonly CompendiumBreedParentReadModelV1[],
    page: number,
  ): HTMLFieldSetElement {
    const fieldset = this.#document.createElement('fieldset');
    fieldset.dataset.arc5BreedParentGroup = kind;
    fieldset.append(this.#node(
      'legend', '', kind === 'primary' ? 'Choose this detail\'s companion' : 'Choose a second fauna parent',
    ));
    const start = page * COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1;
    const visible = rows.slice(start, start + COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1);
    visible.forEach((row, index) => {
      const input = this.#document.createElement('input');
      input.type = 'radio';
      input.name = `arc5-breed-${kind}`;
      input.id = `arc5-breed-${kind}-${start + index}`;
      input.value = row.creatureId;
      input.checked = kind === 'primary'
        ? this.#selectedPrimaryId === row.creatureId
        : this.#selectedMateId === row.creatureId;
      input.dataset.arc5BreedChoice = kind;
      input.dataset.arc5BreedCreatureId = row.creatureId;
      input.dataset.focusKey = `breed:${kind}:${row.creatureId}`;
      input.dataset.rowEnabled = String(row.status === 'ready');
      const sameParent = kind === 'mate' && row.creatureId === this.#selectedPrimaryId;
      input.dataset.sameParent = String(sameParent);
      input.title = sameParent ? 'Choose a distinct second parent.'
        : row.disabledReason ?? row.creatureId;
      const label = this.#choiceLabel(input.id);
      label.title = input.title;
      label.append(input, this.#node('span', '', `${row.label}${
        row.status === 'ready' ? ' · Ready' : ` · ${row.disabledReason ?? 'Unavailable'}`
      }`));
      fieldset.append(label);
    });
    const pageCount = Math.max(1, Math.ceil(rows.length / COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1));
    if (pageCount > 1) fieldset.append(this.#pager(kind, page, pageCount));
    return fieldset;
  }

  #pager(kind: 'primary' | 'mate', page: number, pageCount: number): HTMLElement {
    const row = this.#node('div', 'row');
    row.dataset.arc5BreedPager = kind;
    const previous = this.#node('button', '', 'Previous');
    previous.type = 'button';
    previous.dataset.arc5BreedPage = kind;
    previous.dataset.arc5BreedDirection = 'previous';
    previous.dataset.focusKey = `breed:${kind}:previous`;
    previous.disabled = page <= 0;
    const current = this.#node('span', 'sub', `Page ${page + 1} of ${pageCount}`);
    const next = this.#node('button', '', 'Next');
    next.type = 'button';
    next.dataset.arc5BreedPage = kind;
    next.dataset.arc5BreedDirection = 'next';
    next.dataset.focusKey = `breed:${kind}:next`;
    next.disabled = page >= pageCount - 1;
    for (const button of [previous, next]) button.style.minHeight = '44px';
    row.append(previous, current, next);
    return row;
  }

  #choiceLabel(forId: string): HTMLLabelElement {
    const label = this.#document.createElement('label');
    label.htmlFor = forId;
    label.className = 'compendium-feed-choice';
    label.style.minHeight = '44px';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    return label;
  }

  #summaryNode(state: CompendiumBreedReadModelV1): HTMLElement {
    const summary = this.#node('p', 'compendium-feed-summary');
    summary.dataset.arc5BreedSummary = 'true';
    const request = this.#selectedRequest();
    if (request === null) {
      summary.textContent = 'Choose two distinct ready parents to reveal the exact chance and confirmation.';
      return summary;
    }
    const left = state.primaryParents.find(
      (row) => row.creatureId === request.parentCreatureIds[0],
    )!;
    const right = state.mateParents.find(
      (row) => row.creatureId === request.parentCreatureIds[1],
    )!;
    const percent = Math.round(request.odds * 100);
    summary.textContent = `${left.label} × ${right.label}: ${percent}% success. Both parents remain yours. Success gives ${ARC5_BREED_SUCCESS_RECOVERY_MS_V1 / 60_000} active-play minutes of Recovery; failure gives ${ARC5_BREED_FAILURE_RECOVERY_MS_V1 / 60_000}. Recovery blocks Breed, combat, and dispatch.`;
    summary.dataset.parentA = left.creatureId;
    summary.dataset.parentB = right.creatureId;
    summary.dataset.odds = String(request.odds);
    summary.dataset.oddsPercent = String(percent);
    return summary;
  }

  #confirmButton(): HTMLButtonElement {
    const button = this.#node('button', 'compendium-feed-confirm', 'Confirm Breed');
    button.type = 'button';
    button.dataset.arc5BreedConfirm = 'true';
    button.dataset.focusKey = 'breed:confirm';
    button.style.minHeight = '44px';
    return button;
  }

  #statusNode(): HTMLElement {
    const status = this.#node('p', 'compendium-feed-status');
    status.dataset.arc5BreedStatus = 'true';
    status.dataset.focusKey = 'breed:status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    status.hidden = true;
    return status;
  }

  #message(text: string, state: string): HTMLElement {
    const message = this.#node('p', 'compendium-feed-detail', text);
    message.dataset.arc5BreedState = state;
    return message;
  }

  #selectedRequest(): CompendiumBreedActionRequestV1 | null {
    const state = this.#state;
    if (state?.availability !== 'ready' || state.ownershipRevision === null
      || state.ownershipDigest === null || this.#selectedPrimaryId === null
      || this.#selectedMateId === null || this.#selectedPrimaryId === this.#selectedMateId) {
      return null;
    }
    const left = state.primaryParents.find((row) => row.creatureId === this.#selectedPrimaryId);
    const right = state.mateParents.find((row) => row.creatureId === this.#selectedMateId);
    if (left?.status !== 'ready' || right?.status !== 'ready') return null;
    return Object.freeze({
      surface: state.surface,
      contextKey: state.contextKey,
      ownershipRevision: state.ownershipRevision,
      ownershipDigest: state.ownershipDigest,
      parentCreatureIds: Object.freeze([left.creatureId, right.creatureId] as const),
      earnedStardustBonus: state.earnedStardustBonus,
      odds: companionBreedOddsV1(left.tier, right.tier, state.earnedStardustBonus),
    });
  }

  #applyAvailability(): void {
    const mount = this.#mount;
    if (mount === null) return;
    const busy = this.#pending !== null || this.#convergenceLatched;
    const current = this.#surfaceIsCurrent();
    mount.setAttribute('aria-busy', String(this.#pending !== null));
    for (const input of mount.querySelectorAll<HTMLInputElement>(
      'input[type="radio"][data-arc5-breed-choice]',
    )) {
      input.disabled = busy || !current || this.#state?.availability !== 'ready'
        || input.dataset.rowEnabled !== 'true' || input.dataset.sameParent === 'true';
      input.setAttribute('aria-disabled', String(input.disabled));
    }
    for (const pager of mount.querySelectorAll<HTMLButtonElement>('[data-arc5-breed-page]')) {
      pager.disabled = pager.disabled || busy || !current;
      pager.setAttribute('aria-disabled', String(pager.disabled));
    }
    const confirm = mount.querySelector<HTMLButtonElement>('[data-arc5-breed-confirm]');
    if (confirm) {
      confirm.disabled = busy || !current || this.#selectedRequest() === null
        || this.#onAction === null;
      confirm.setAttribute('aria-disabled', String(confirm.disabled));
      confirm.title = busy ? 'A Breed attempt is settling.'
        : !current ? 'This Compendium detail is no longer current.'
          : this.#onAction === null ? 'Breed action coordinator is unavailable.'
            : confirm.disabled ? 'Choose two distinct ready parents.'
              : 'Confirm the displayed odds and active-play Recovery.';
    }
  }

  #paintStatus(): void {
    const status = this.#mount?.querySelector<HTMLElement>('[data-arc5-breed-status]');
    if (!status) return;
    if (this.#pending !== null) {
      status.hidden = false;
      status.dataset.kind = 'pending';
      status.dataset.convergence = 'none';
      status.textContent = 'Breeding attempt settling. No child or Recovery is shown until the save commits.';
      return;
    }
    const outcome = this.#lastOutcome;
    if (outcome === null || !this.#shouldPublishFor(outcome.request.surface)) {
      status.hidden = true;
      status.textContent = '';
      delete status.dataset.kind;
      delete status.dataset.convergence;
      return;
    }
    status.hidden = false;
    status.dataset.kind = outcome.kind;
    status.dataset.convergence = outcome.convergence;
    status.textContent = `${outcome.title} ${outcome.detail}`;
  }

  #normalizeSelections(): void {
    const state = this.#state;
    if (state === null) return;
    if (state.primaryParents.find((row) => row.creatureId === this.#selectedPrimaryId)
      ?.status !== 'ready') this.#selectedPrimaryId = null;
    if (state.mateParents.find((row) => row.creatureId === this.#selectedMateId)
      ?.status !== 'ready' || this.#selectedMateId === this.#selectedPrimaryId) {
      this.#selectedMateId = null;
    }
    const primaryPages = Math.max(
      1, Math.ceil(state.primaryParents.length / COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1),
    );
    const matePages = Math.max(
      1, Math.ceil(state.mateParents.length / COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1),
    );
    this.#primaryPage = Math.min(primaryPages - 1, Math.max(0, this.#primaryPage));
    this.#matePage = Math.min(matePages - 1, Math.max(0, this.#matePage));
  }

  #surfaceIsCurrent(): boolean {
    return this.#state !== null && this.#isCurrent(this.#state.surface);
  }

  #shouldPublishFor(surface: CompendiumBreedSurfaceReceiptV1): boolean {
    return this.#state?.surface.surfaceKey === surface.surfaceKey && this.#isCurrent(surface)
      && this.#mount?.isConnected === true;
  }

  #canInteract(): boolean {
    return !this.#disposed && this.#mount !== null && this.#state !== null
      && this.#pending === null && !this.#convergenceLatched && this.#surfaceIsCurrent();
  }

  #isRootVisible(): boolean {
    return this.#root.isConnected && !this.#root.hidden
      && this.#root.style.display !== 'none' && !this.#root.hasAttribute('inert');
  }

  #captureFocus(): FocusReceipt {
    const active = this.#document.activeElement as HTMLElement | null;
    return Object.freeze({
      key: active?.dataset.focusKey ?? null,
      owned: active !== null && this.#mount?.contains(active) === true,
    });
  }

  #restoreFocus(receipt: FocusReceipt): void {
    if (!receipt.owned) return;
    this.#focusByKey(receipt.key);
  }

  #focusByKey(key: string | null): void {
    if (key === null) return;
    const target = [...(this.#mount?.querySelectorAll<HTMLElement>('[data-focus-key]') ?? [])]
      .find((candidate) => candidate.dataset.focusKey === key);
    if (target && !('disabled' in target && (target as HTMLButtonElement).disabled)) target.focus();
  }

  #focusStatus(): void {
    this.#mount?.querySelector<HTMLElement>('[data-arc5-breed-status]')?.focus();
  }

  #focusConfirm(): void {
    this.#mount?.querySelector<HTMLButtonElement>('[data-arc5-breed-confirm]')?.focus();
  }

  #disposeMount(mount: HTMLElement): void {
    mount.replaceChildren();
    delete mount.dataset.arc5BreedController;
    delete mount.dataset.arc5BreedContextKey;
    delete mount.dataset.arc5BreedSurfaceKey;
    mount.removeAttribute('aria-busy');
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

  #assertLive(): void {
    if (this.#disposed) throw new Error('Compendium Breed controller is disposed');
  }
}
