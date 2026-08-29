/* Arc 7/8 Compendium creature-call presentation owner.

   A real detail row may expose explicit, replayable auditions for exact live
   owned fauna identities. List mounting, filtering, focus and navigation are
   deliberately absent from this module. The projection and controller own no
   AudioContext, save writer, gameplay RNG or creature mutation. */
import {
  canonicalGenomeIdentityV1,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type OwnershipStateV2,
  type SpeciesId,
} from '@cf/domain-acquisition';
import type { AudioCounterpartReceipt } from '@cf/audio';
import { projectOwnedCreatureAudioIdentity } from './audio-identity-projector.js';

export const COMPENDIUM_AUDITION_READ_MODEL_SCHEMA =
  'cf-v2-compendium-audition-read-model/v1' as const;

export type CompendiumAuditionAvailability =
  | 'ready'
  | 'fixture'
  | 'non-fauna'
  | 'protected'
  | 'no-companion';

export interface CompendiumAuditionRecordV1 {
  readonly id: string;
  readonly name: string;
  readonly g: Readonly<Record<string, unknown>>;
}

export interface CompendiumAuditionSurfaceReceiptV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly speciesId: SpeciesId | null;
  readonly surfaceKey: string;
}

export interface CompendiumAuditionCreatureV1 {
  readonly creatureId: CreatureInstanceId;
  readonly label: string;
}

export interface CompendiumAuditionReadModelV1 {
  readonly schema: typeof COMPENDIUM_AUDITION_READ_MODEL_SCHEMA;
  readonly surface: CompendiumAuditionSurfaceReceiptV1;
  readonly contextKey: string;
  readonly availability: CompendiumAuditionAvailability;
  readonly detail: string;
  readonly ownershipRevision: number | null;
  readonly ownershipDigest: string | null;
  readonly creatures: readonly CompendiumAuditionCreatureV1[];
}

export interface CompendiumAuditionProjectionInputV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly record: CompendiumAuditionRecordV1;
  readonly ownership: OwnershipStateV2 | null;
  readonly fixture: boolean;
}

export interface CompendiumAuditionActionRequestV1 {
  readonly surface: CompendiumAuditionSurfaceReceiptV1;
  readonly contextKey: string;
  readonly ownershipRevision: number;
  readonly ownershipDigest: string;
  readonly creatureId: CreatureInstanceId;
  readonly label: string;
  readonly eventKey: string;
}

export type CompendiumAuditionPlayResultV1 =
  | Readonly<{ readonly kind: 'started'; readonly voiceId: string }>
  | Readonly<{ readonly kind: 'silent'; readonly reason: string }>;

export interface CompendiumAuditionControllerOptions {
  readonly root: HTMLElement;
  readonly isCurrent: (surface: CompendiumAuditionSurfaceReceiptV1) => boolean;
  /** Invoked only from the browser's trusted native click stack. */
  readonly onNativeAuditionGesture?: () => void;
  /** Invoked only after the exact polite/atomic counterpart is painted. */
  readonly onAudition?: (
    request: CompendiumAuditionActionRequestV1,
    counterpart: AudioCounterpartReceipt,
  ) => void;
}

const READ_MODELS = new WeakSet<object>();

function checkedText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} must be non-empty bounded text`);
  }
  return value;
}

function checkedGeneration(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RangeError('Compendium audition generation must be a non-negative safe integer');
  }
  return value as number;
}

function surfaceReceipt(
  generation: number,
  logicalId: string,
  speciesId: SpeciesId | null,
): CompendiumAuditionSurfaceReceiptV1 {
  return Object.freeze({
    generation,
    logicalId,
    speciesId,
    surfaceKey: JSON.stringify([generation, logicalId, speciesId]),
  });
}

function unavailable(
  surface: CompendiumAuditionSurfaceReceiptV1,
  availability: Exclude<CompendiumAuditionAvailability, 'ready'>,
  detail: string,
  ownershipRevision: number | null = null,
  ownershipDigest: string | null = null,
): CompendiumAuditionReadModelV1 {
  const model = Object.freeze({
    schema: COMPENDIUM_AUDITION_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([
      surface.surfaceKey, ownershipRevision, ownershipDigest, availability,
    ]),
    availability,
    detail,
    ownershipRevision,
    ownershipDigest,
    creatures: Object.freeze([]),
  });
  READ_MODELS.add(model);
  return model;
}

/** Project only a real, current Compendium detail and exact live fauna rows.
 * Assignment, care, injury and other mutable fields neither select nor alter
 * a call; the existing immutable audio projector remains the identity owner. */
export function projectCompendiumAuditionV1(
  input: CompendiumAuditionProjectionInputV1,
): CompendiumAuditionReadModelV1 {
  const generation = checkedGeneration(input.generation);
  const logicalId = checkedText(input.logicalId, 'Compendium logical ID', 128);
  const emptySurface = surfaceReceipt(generation, logicalId, null);
  if (input.fixture) {
    return unavailable(
      emptySurface,
      'fixture',
      'Creature calls are unavailable for diagnostic Compendium fixtures.',
    );
  }

  let recordId: string;
  let recordName: string;
  try {
    recordId = checkedText(input.record?.id, 'Compendium record ID', 128);
    recordName = checkedText(input.record?.name, 'Compendium record name', 256);
  } catch {
    return unavailable(emptySurface, 'protected', 'This Compendium record did not verify.');
  }
  if (recordId !== logicalId || !input.record.g || typeof input.record.g !== 'object'
    || Array.isArray(input.record.g)) {
    return unavailable(emptySurface, 'protected', 'This Compendium record is not authoritative.');
  }

  let identity: ReturnType<typeof canonicalGenomeIdentityV1>;
  try { identity = canonicalGenomeIdentityV1(input.record.g); }
  catch { return unavailable(emptySurface, 'protected', 'This Compendium genome did not verify.'); }
  const surface = surfaceReceipt(generation, logicalId, identity.speciesId);
  if (identity.kingdom !== 'fauna') {
    return unavailable(
      surface,
      'non-fauna',
      'This detail uses environmental sonification rather than a creature call.',
    );
  }

  const ownership = input.ownership;
  if (ownership === null || !isOwnershipStateV2(ownership) || ownership.mode !== 'current') {
    return unavailable(surface, 'protected', 'Creature-call identity is currently protected.');
  }
  const ownershipDigest = ownershipStateDigestV2(ownership);
  const catalogue = ownership.catalogSpecies.find((row) => row.speciesId === identity.speciesId);
  if (!catalogue || catalogue.kingdom !== 'fauna'
    || catalogue.genomeIdentity !== identity.genomeIdentity) {
    return unavailable(
      surface,
      'protected',
      'This Compendium species does not match current ownership authority.',
      ownership.revision,
      ownershipDigest,
    );
  }

  const creatures = Object.freeze(ownership.creatures
    .filter((row) => row.speciesId === identity.speciesId
      && row.genomeIdentity === identity.genomeIdentity)
    .flatMap((row): readonly CompendiumAuditionCreatureV1[] => {
      const projection = projectOwnedCreatureAudioIdentity(ownership, row.creatureId);
      if (projection.kind !== 'projected' || projection.profile.kingdom !== 'fauna') return [];
      return [Object.freeze({
        creatureId: row.creatureId,
        label: `${row.nickname ?? recordName} · ${row.creatureId.slice(-8)}`,
      })];
    }));
  if (creatures.length === 0) {
    return unavailable(
      surface,
      'no-companion',
      'Own this fauna companion to audition its stable call signature.',
      ownership.revision,
      ownershipDigest,
    );
  }

  const model: CompendiumAuditionReadModelV1 = Object.freeze({
    schema: COMPENDIUM_AUDITION_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([
      surface.surfaceKey, ownership.revision, ownershipDigest, 'ready',
    ]),
    availability: 'ready',
    detail: 'Choose an exact owned companion to hear its stable call signature.',
    ownershipRevision: ownership.revision,
    ownershipDigest,
    creatures,
  });
  READ_MODELS.add(model);
  return model;
}

function eventKeyFor(creatureId: CreatureInstanceId): string {
  return `arc7:compendium-audition:${creatureId}`;
}

function counterpartFor(request: CompendiumAuditionActionRequestV1): AudioCounterpartReceipt {
  return Object.freeze({
    counterpartKey: `compendium-audition:${request.surface.generation}:${request.creatureId}`,
    eventKey: request.eventKey,
    generation: request.surface.generation,
  });
}

export class CompendiumAuditionController {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #isCurrent: CompendiumAuditionControllerOptions['isCurrent'];
  readonly #onNativeAuditionGesture: CompendiumAuditionControllerOptions['onNativeAuditionGesture'];
  readonly #onAudition: CompendiumAuditionControllerOptions['onAudition'];
  #mount: HTMLElement | null = null;
  #state: CompendiumAuditionReadModelV1 | null = null;
  #activeRequest: CompendiumAuditionActionRequestV1 | null = null;
  #lastResult: CompendiumAuditionPlayResultV1 | null = null;
  #disposed = false;

  constructor(options: CompendiumAuditionControllerOptions) {
    if (!options?.root || typeof options.isCurrent !== 'function') {
      throw new TypeError('Compendium audition controller requires root/current owners');
    }
    this.#root = options.root;
    this.#document = options.root.ownerDocument;
    this.#isCurrent = options.isCurrent;
    this.#onNativeAuditionGesture = options.onNativeAuditionGesture;
    this.#onAudition = options.onAudition;
    this.#root.addEventListener('click', this.#onClick);
  }

  attach(mount: HTMLElement): void {
    this.#assertLive();
    if (!this.#root.contains(mount)) throw new Error('Compendium audition mount must belong to root');
    if (this.#mount && this.#mount !== mount) this.#mount.replaceChildren();
    this.#mount = mount;
    this.#activeRequest = null;
    this.#lastResult = null;
    this.#render();
  }

  detach(): void {
    if (this.#disposed) return;
    this.#mount?.replaceChildren();
    this.#mount = null;
    this.#activeRequest = null;
    this.#lastResult = null;
  }

  setState(state: CompendiumAuditionReadModelV1 | null): void {
    this.#assertLive();
    if (state !== null && !READ_MODELS.has(state)) {
      throw new TypeError('Compendium audition state must come from its projector');
    }
    if (state?.contextKey !== this.#state?.contextKey) {
      this.#activeRequest = null;
      this.#lastResult = null;
    }
    this.#state = state;
    this.#render();
  }

  refresh(): void {
    this.#assertLive();
    this.#render();
  }

  settle(
    request: CompendiumAuditionActionRequestV1,
    result: CompendiumAuditionPlayResultV1,
  ): void {
    this.#assertLive();
    if (request !== this.#activeRequest) return;
    this.#lastResult = Object.freeze({ ...result });
    this.#render();
  }

  counterpartIsCurrent(receipt: AudioCounterpartReceipt): boolean {
    const request = this.#activeRequest;
    const status = this.#mount?.querySelector<HTMLElement>('[data-arc7-audition-status]') ?? null;
    if (request === null || status === null) return false;
    const expected = counterpartFor(request);
    return receipt.counterpartKey === expected.counterpartKey
      && receipt.eventKey === expected.eventKey
      && receipt.generation === expected.generation
      && this.#surfaceIsCurrent()
      && status.isConnected
      && !status.hidden
      && status.closest('[hidden],[inert]') === null
      && status.getAttribute('role') === 'status'
      && status.getAttribute('aria-live') === 'polite'
      && status.getAttribute('aria-atomic') === 'true'
      && status.dataset.arc7AuditionCreatureId === request.creatureId;
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#root.removeEventListener('click', this.#onClick);
    this.detach();
    this.#state = null;
    this.#disposed = true;
  }

  readonly #onClick = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-arc7-audition-creature-id]');
    if (!button || !this.#mount?.contains(button) || button.disabled) return;
    const state = this.#state!;
    const creature = state.creatures.find(
      (row) => row.creatureId === button.dataset.arc7AuditionCreatureId,
    );
    if (!creature || state.ownershipRevision === null || state.ownershipDigest === null) return;
    const request: CompendiumAuditionActionRequestV1 = Object.freeze({
      surface: state.surface,
      contextKey: state.contextKey,
      ownershipRevision: state.ownershipRevision,
      ownershipDigest: state.ownershipDigest,
      creatureId: creature.creatureId,
      label: creature.label,
      eventKey: eventKeyFor(creature.creatureId),
    });
    this.#activeRequest = request;
    this.#lastResult = null;
    this.#render();
    const counterpart = counterpartFor(request);
    if (!this.counterpartIsCurrent(counterpart)) return;
    if (event.isTrusted) this.#onNativeAuditionGesture?.();
    this.#onAudition?.(request, counterpart);
  };

  #render(): void {
    const mount = this.#mount;
    if (mount === null) return;
    if (!this.#rootVisible()) { this.detach(); return; }
    const fragment = this.#document.createDocumentFragment();
    const heading = this.#document.createElement('h4');
    heading.textContent = 'Creature call';
    fragment.append(heading);
    const state = this.#state;
    const detail = this.#document.createElement('p');
    detail.className = 'compendium-feed-detail';
    detail.textContent = state?.detail ?? 'Creature-call facts are unavailable.';
    detail.dataset.arc7AuditionState = state?.availability ?? 'absent';
    fragment.append(detail);
    if (state?.availability === 'ready') for (const creature of state.creatures) {
      const button = this.#document.createElement('button');
      button.type = 'button';
      button.className = 'compendium-feed-confirm';
      button.style.minHeight = '44px';
      button.dataset.arc7AuditionCreatureId = creature.creatureId;
      button.textContent = `Listen · ${creature.label}`;
      button.disabled = !this.#surfaceIsCurrent() || this.#onAudition === undefined;
      button.setAttribute('aria-disabled', String(button.disabled));
      fragment.append(button);
    }
    const status = this.#document.createElement('p');
    status.className = 'compendium-feed-status';
    status.dataset.arc7AuditionStatus = 'true';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const active = this.#activeRequest;
    status.hidden = active === null;
    if (active !== null) {
      status.dataset.arc7AuditionCreatureId = active.creatureId;
      status.textContent = this.#lastResult === null
        ? `Auditioning the stable call for ${active.label}.`
        : this.#lastResult.kind === 'started'
          ? `Playing the stable call for ${active.label}.`
          : `Creature call unavailable: ${this.#lastResult.reason}.`;
    }
    fragment.append(status);
    mount.replaceChildren(fragment);
    mount.dataset.arc7AuditionController = 'v1';
  }

  #canInteract(): boolean {
    return !this.#disposed && this.#mount !== null && this.#state?.availability === 'ready'
      && this.#rootVisible() && this.#surfaceIsCurrent();
  }

  #rootVisible(): boolean {
    return this.#root.isConnected && !this.#root.hidden
      && this.#root.closest('[hidden],[inert]') === null;
  }

  #surfaceIsCurrent(): boolean {
    const surface = this.#state?.surface;
    if (!surface) return false;
    try { return this.#isCurrent(surface) === true; } catch { return false; }
  }

  #assertLive(): void {
    if (this.#disposed) throw new Error('Compendium audition controller is disposed');
  }
}
