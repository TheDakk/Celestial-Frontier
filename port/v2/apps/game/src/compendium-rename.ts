/* Arc 5 Compendium companion-rename presentation owner.

   The projection binds one real fauna detail to exact owned creature IDs.
   This controller owns only the detail controls; Main owns coordination,
   persistence, convergence, and terminal wording. */
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
  ARC5_COMPANION_NAME_MAX_V1,
} from '@cf/domain-acquisition/rename-internal';
import { cleanName } from '@cf/domain-naming';

export const COMPENDIUM_RENAME_READ_MODEL_SCHEMA =
  'cf-v2-compendium-rename-read-model/v1' as const;
export const COMPENDIUM_RENAME_OUTCOME_SCHEMA =
  'cf-v2-compendium-rename-outcome/v1' as const;
export const COMPENDIUM_RENAME_DIAGNOSTICS_SCHEMA =
  'cf-v2-compendium-rename-diagnostics/v1' as const;
export const COMPENDIUM_RENAME_PAGE_SIZE_V1 = 24 as const;

export type CompendiumRenameAvailability =
  | 'ready' | 'fixture' | 'non-fauna' | 'protected' | 'no-companion';
export type CompendiumRenameCreatureStatus = 'ready' | 'exhibit';
export type CompendiumRenameOutcomeKind = 'committed' | 'committed-convergence' | 'refused';
export type CompendiumRenameConvergence = 'none' | 'read-only-reload';

export interface CompendiumRenameRecordV1 {
  readonly id: string;
  readonly name: string;
  readonly g: Readonly<Record<string, unknown>>;
}

export interface CompendiumRenameProjectionInputV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly record: CompendiumRenameRecordV1;
  readonly ownership: OwnershipStateV2 | null;
  readonly protected: boolean;
  readonly fixture: boolean;
}

export interface CompendiumRenameSurfaceReceiptV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly speciesId: SpeciesId | null;
  readonly surfaceKey: string;
}

export interface CompendiumRenameCreatureReadModelV1 {
  readonly creatureId: CreatureInstanceId;
  readonly label: string;
  readonly nickname: string | null;
  readonly status: CompendiumRenameCreatureStatus;
  readonly disabledReason: string | null;
}

export interface CompendiumRenameReadModelV1 {
  readonly schema: typeof COMPENDIUM_RENAME_READ_MODEL_SCHEMA;
  readonly surface: CompendiumRenameSurfaceReceiptV1;
  readonly contextKey: string;
  readonly availability: CompendiumRenameAvailability;
  readonly detail: string;
  readonly ownershipRevision: number | null;
  readonly ownershipDigest: string | null;
  readonly creatures: readonly CompendiumRenameCreatureReadModelV1[];
}

export interface CompendiumRenameActionRequestV1 {
  readonly surface: CompendiumRenameSurfaceReceiptV1;
  readonly contextKey: string;
  readonly ownershipRevision: number;
  readonly ownershipDigest: string;
  readonly creatureId: CreatureInstanceId;
  readonly nicknameBefore: string | null;
  readonly rawName: string;
  readonly nicknameAfter: string;
}

export interface CompendiumRenameActionOutcomeV1 {
  readonly schema: typeof COMPENDIUM_RENAME_OUTCOME_SCHEMA;
  readonly kind: CompendiumRenameOutcomeKind;
  readonly convergence: CompendiumRenameConvergence;
  readonly request: CompendiumRenameActionRequestV1;
  readonly title: string;
  readonly detail: string;
}

export interface CompendiumRenameControllerOptions {
  readonly root: HTMLElement;
  readonly isCurrent: (surface: CompendiumRenameSurfaceReceiptV1) => boolean;
  readonly onAction?: (request: CompendiumRenameActionRequestV1) => void;
}

export interface CompendiumRenameDiagnosticsV1 {
  readonly schema: typeof COMPENDIUM_RENAME_DIAGNOSTICS_SCHEMA;
  readonly attachedMountCount: 0 | 1;
  readonly retainedDomCount: number;
  readonly pendingWork: 0 | 1;
  readonly convergenceLatched: boolean;
  readonly delegatedListenerCount: 0 | 3;
  readonly creatureControlCount: number;
  readonly surfaceKey: string | null;
  readonly contextKey: string | null;
  readonly selectedCreatureId: CreatureInstanceId | null;
  readonly currentPage: number;
  readonly lastRequest: CompendiumRenameActionRequestV1 | null;
  readonly lastOutcome: CompendiumRenameActionOutcomeV1 | null;
}

interface FocusReceipt { readonly key: string | null; readonly owned: boolean; }

const READ_MODELS = new WeakSet<object>();

function checkedText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} must be non-empty bounded text`);
  }
  return value;
}

function shortId(value: string): string { return value.slice(-8); }

function surfaceReceipt(
  generation: number,
  logicalId: string,
  speciesId: SpeciesId | null,
): CompendiumRenameSurfaceReceiptV1 {
  return Object.freeze({
    generation,
    logicalId,
    speciesId,
    surfaceKey: JSON.stringify([generation, logicalId, speciesId]),
  });
}

function unavailable(
  surface: CompendiumRenameSurfaceReceiptV1,
  availability: Exclude<CompendiumRenameAvailability, 'ready'>,
  detail: string,
  ownershipRevision: number | null = null,
  ownershipDigest: string | null = null,
  creatures: readonly CompendiumRenameCreatureReadModelV1[] = Object.freeze([]),
): CompendiumRenameReadModelV1 {
  const model: CompendiumRenameReadModelV1 = Object.freeze({
    schema: COMPENDIUM_RENAME_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([
      surface.surfaceKey, ownershipRevision, ownershipDigest, availability,
    ]),
    availability,
    detail,
    ownershipRevision,
    ownershipDigest,
    creatures,
  });
  READ_MODELS.add(model);
  return model;
}

/** Project same-species twins as separate exact owned instances. */
export function projectCompendiumRenameV1(
  input: CompendiumRenameProjectionInputV1,
): CompendiumRenameReadModelV1 {
  if (!Number.isSafeInteger(input.generation) || input.generation < 0) {
    throw new RangeError('Compendium Rename generation must be a non-negative safe integer');
  }
  const logicalId = checkedText(input.logicalId, 'Compendium logical ID', 128);
  const emptySurface = surfaceReceipt(input.generation, logicalId, null);
  if (input.fixture) {
    return unavailable(emptySurface, 'fixture',
      'Rename is unavailable for diagnostic Compendium fixtures.');
  }
  let recordName: string;
  let identity: ReturnType<typeof canonicalGenomeIdentityV1>;
  try {
    const recordId = checkedText(input.record?.id, 'Compendium record ID', 128);
    recordName = checkedText(input.record?.name, 'Compendium record name', 256);
    if (recordId !== logicalId || !input.record.g || typeof input.record.g !== 'object'
      || Array.isArray(input.record.g)) throw new TypeError('record is not authoritative');
    identity = canonicalGenomeIdentityV1(input.record.g);
  } catch {
    return unavailable(emptySurface, 'protected',
      'Rename is unavailable because this Compendium record did not verify.');
  }
  const surface = surfaceReceipt(input.generation, logicalId, identity.speciesId);
  if (identity.kingdom !== 'fauna') {
    return unavailable(surface, 'non-fauna',
      'Rename is available only from an owned fauna companion detail.');
  }
  const ownership = input.ownership;
  if (input.protected || ownership === null || !isOwnershipStateV2(ownership)
    || ownership.mode !== 'current') {
    return unavailable(surface, 'protected',
      'Rename is unavailable while companion ownership is protected.');
  }
  const digest = ownershipStateDigestV2(ownership);
  if (ownership.revision === MAX_OWNERSHIP_REVISION) {
    return unavailable(surface, 'protected',
      'Rename is unavailable because companion ownership reached its revision ceiling.',
      ownership.revision, digest);
  }
  const catalogue = ownership.catalogSpecies.find((row) => row.speciesId === identity.speciesId);
  if (catalogue === undefined || catalogue.genomeIdentity !== identity.genomeIdentity
    || catalogue.kingdom !== 'fauna') {
    return unavailable(surface, 'protected',
      'Rename is unavailable because this Compendium species does not match ownership authority.',
      ownership.revision, digest);
  }
  const creatures = Object.freeze(ownership.creatures
    .filter((row) => row.speciesId === identity.speciesId
      && row.genomeIdentity === identity.genomeIdentity)
    .map((row): CompendiumRenameCreatureReadModelV1 => {
      const exhibit = row.genome.exhibit === true;
      return Object.freeze({
        creatureId: row.creatureId,
        label: `${row.nickname ?? recordName} · ${shortId(row.creatureId)}`,
        nickname: row.nickname,
        status: exhibit ? 'exhibit' : 'ready',
        disabledReason: exhibit
          ? 'Exhibition challengers are not owned companions.' : null,
      });
    }));
  if (!creatures.some((row) => row.status === 'ready')) {
    return unavailable(surface, 'no-companion',
      'No owned living companion matches this fauna species.', ownership.revision, digest, creatures);
  }
  const model: CompendiumRenameReadModelV1 = Object.freeze({
    schema: COMPENDIUM_RENAME_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([surface.surfaceKey, ownership.revision, digest, 'ready']),
    availability: 'ready',
    detail: 'Choose one exact companion, then save its new name.',
    ownershipRevision: ownership.revision,
    ownershipDigest: digest,
    creatures,
  });
  READ_MODELS.add(model);
  return model;
}

function sameRequest(
  left: CompendiumRenameActionRequestV1,
  right: CompendiumRenameActionRequestV1,
): boolean {
  return left.surface.surfaceKey === right.surface.surfaceKey
    && left.contextKey === right.contextKey
    && left.ownershipRevision === right.ownershipRevision
    && left.ownershipDigest === right.ownershipDigest
    && left.creatureId === right.creatureId
    && left.nicknameBefore === right.nicknameBefore
    && left.rawName === right.rawName
    && left.nicknameAfter === right.nicknameAfter;
}

function assertOutcome(outcome: CompendiumRenameActionOutcomeV1): void {
  if (!Object.isFrozen(outcome) || outcome.schema !== COMPENDIUM_RENAME_OUTCOME_SCHEMA
    || !Object.isFrozen(outcome.request)
    || (outcome.kind !== 'committed' && outcome.kind !== 'committed-convergence'
      && outcome.kind !== 'refused')
    || (outcome.convergence !== 'none' && outcome.convergence !== 'read-only-reload')
    || (outcome.kind === 'committed' && outcome.convergence !== 'none')
    || (outcome.kind === 'committed-convergence'
      && outcome.convergence !== 'read-only-reload')) {
    throw new TypeError('Compendium Rename outcome must be frozen supported data');
  }
  checkedText(outcome.title, 'Compendium Rename outcome title', 8_192);
  checkedText(outcome.detail, 'Compendium Rename outcome detail', 8_192);
}

export class CompendiumRenameController {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #isCurrent: (surface: CompendiumRenameSurfaceReceiptV1) => boolean;
  readonly #onAction: ((request: CompendiumRenameActionRequestV1) => void) | null;
  #mount: HTMLElement | null = null;
  #state: CompendiumRenameReadModelV1 | null = null;
  #selectedCreatureId: CreatureInstanceId | null = null;
  #rawName = '';
  #page = 0;
  #pending: CompendiumRenameActionRequestV1 | null = null;
  #lastRequest: CompendiumRenameActionRequestV1 | null = null;
  #lastOutcome: CompendiumRenameActionOutcomeV1 | null = null;
  #convergenceLatched = false;
  #listenersInstalled = false;
  #disposed = false;

  constructor(options: CompendiumRenameControllerOptions) {
    this.#root = options.root;
    this.#document = options.root.ownerDocument;
    this.#isCurrent = options.isCurrent;
    this.#onAction = options.onAction ?? null;
    this.#root.addEventListener('change', this.#onChange);
    this.#root.addEventListener('input', this.#onInput);
    this.#root.addEventListener('click', this.#onClick);
    this.#listenersInstalled = true;
  }

  attach(mount: HTMLElement): void {
    this.#assertLive();
    if (!this.#isRootVisible() || mount.ownerDocument !== this.#document
      || !this.#root.contains(mount) || !mount.hasAttribute('data-arc5-rename-body')) {
      throw new Error('Compendium Rename mount must be the visible declared Compendium descendant');
    }
    const mounts = [...this.#root.querySelectorAll<HTMLElement>('[data-arc5-rename-body]')];
    if (mounts.length !== 1 || mounts[0] !== mount) {
      throw new Error('Compendium Rename requires exactly one dynamic mount');
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

  setState(state: CompendiumRenameReadModelV1 | null): void {
    this.#assertLive();
    if (state !== null && !READ_MODELS.has(state)) {
      throw new TypeError('Compendium Rename accepts only an owner-projected read model');
    }
    const priorContext = this.#state?.contextKey ?? null;
    const priorSurface = this.#state?.surface.surfaceKey ?? null;
    this.#state = state;
    if (state === null || state.contextKey !== priorContext) {
      this.#selectedCreatureId = null;
      this.#rawName = '';
      this.#page = 0;
    }
    if (state === null || state.surface.surfaceKey !== priorSurface) this.#lastOutcome = null;
    this.#render();
  }

  refresh(): void { this.#assertLive(); this.#render(); }

  settle(outcome: CompendiumRenameActionOutcomeV1): void {
    this.#assertLive();
    assertOutcome(outcome);
    if (this.#pending === null || outcome.request !== this.#pending) {
      throw new Error('Compendium Rename outcome does not match its pending exact request');
    }
    this.#lastOutcome = outcome;
    this.#lastRequest = outcome.request;
    this.#pending = null;
    if (outcome.kind !== 'refused') {
      this.#selectedCreatureId = null;
      this.#rawName = '';
    }
    if (outcome.convergence === 'read-only-reload') this.#convergenceLatched = true;
    this.#render();
    if (this.#shouldPublishFor(outcome.request.surface)) this.#focusStatus();
  }

  diagnostics(): CompendiumRenameDiagnosticsV1 {
    return Object.freeze({
      schema: COMPENDIUM_RENAME_DIAGNOSTICS_SCHEMA,
      attachedMountCount: this.#mount === null ? 0 : 1,
      retainedDomCount: this.#mount?.querySelectorAll('*').length ?? 0,
      pendingWork: this.#pending === null ? 0 : 1,
      convergenceLatched: this.#convergenceLatched,
      delegatedListenerCount: this.#listenersInstalled ? 3 : 0,
      creatureControlCount: this.#mount?.querySelectorAll(
        'input[type="radio"][data-arc5-rename-creature-id]',
      ).length ?? 0,
      surfaceKey: this.#state?.surface.surfaceKey ?? null,
      contextKey: this.#state?.contextKey ?? null,
      selectedCreatureId: this.#selectedCreatureId,
      currentPage: this.#page,
      lastRequest: this.#lastRequest,
      lastOutcome: this.#lastOutcome,
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    if (this.#listenersInstalled) {
      this.#root.removeEventListener('change', this.#onChange);
      this.#root.removeEventListener('input', this.#onInput);
      this.#root.removeEventListener('click', this.#onClick);
      this.#listenersInstalled = false;
    }
    if (this.#mount !== null) this.#disposeMount(this.#mount);
    this.#mount = null;
    this.#state = null;
    this.#selectedCreatureId = null;
    this.#rawName = '';
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
      || !this.#mount?.contains(target) || target.disabled
      || target.dataset.arc5RenameCreatureId === undefined) return;
    const row = this.#state!.creatures.find(
      (candidate) => candidate.creatureId === target.dataset.arc5RenameCreatureId,
    );
    if (row?.status !== 'ready') return;
    const focus = this.#captureFocus();
    this.#selectedCreatureId = row.creatureId;
    this.#rawName = row.nickname ?? '';
    this.#render();
    this.#restoreFocus(focus);
  };

  readonly #onInput = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.HTMLInputElement)
      || !this.#mount?.contains(target) || target.dataset.arc5RenameInput === undefined) return;
    this.#rawName = target.value;
    this.#paintDraft();
    this.#applyAvailability();
  };

  readonly #onClick = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element)) return;
    const page = target.closest<HTMLButtonElement>('button[data-arc5-rename-page]');
    if (page && this.#mount?.contains(page) && !page.disabled) {
      const next = Number(page.dataset.arc5RenamePage);
      if (Number.isSafeInteger(next) && next >= 0) {
        this.#page = next;
        this.#render();
        this.#focusByKey(`rename:page:${next}`);
      }
      return;
    }
    const button = target.closest<HTMLButtonElement>('button[data-arc5-rename-confirm]');
    if (!button || !this.#mount?.contains(button) || button.disabled) return;
    const request = this.#selectedRequest();
    if (request === null) return;
    const priorOutcome = this.#lastOutcome;
    this.#pending = request;
    this.#lastRequest = request;
    this.#lastOutcome = null;
    this.#render();
    this.#focusStatus();
    try { this.#onAction?.(request); }
    catch (error) {
      if (this.#pending !== null && sameRequest(this.#pending, request)
        && !this.#convergenceLatched) {
        this.#pending = null;
        this.#lastRequest = null;
        this.#lastOutcome = priorOutcome;
        this.#render();
        this.#focusByKey('rename:confirm');
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
    this.#normalizeSelection();
    const focus = this.#captureFocus();
    const fragment = this.#document.createDocumentFragment();
    const heading = this.#node('h4', '', 'Rename companion');
    heading.dataset.arc5RenameHeading = 'true';
    heading.tabIndex = -1;
    fragment.append(heading);
    const state = this.#state;
    if (state === null) {
      fragment.append(this.#message('Rename facts are unavailable.', 'absent'));
    } else {
      const detail = this.#message(state.detail, state.availability);
      fragment.append(detail);
      if (state.creatures.length > 0) fragment.append(this.#creatureFieldset(state));
      if (state.availability === 'ready') fragment.append(this.#editor());
    }
    fragment.append(this.#statusNode());
    mount.replaceChildren(fragment);
    mount.dataset.arc5RenameController = 'v1';
    if (state === null) {
      delete mount.dataset.arc5RenameContextKey;
      delete mount.dataset.arc5RenameSurfaceKey;
    } else {
      mount.dataset.arc5RenameContextKey = state.contextKey;
      mount.dataset.arc5RenameSurfaceKey = state.surface.surfaceKey;
    }
    this.#paintDraft();
    this.#applyAvailability();
    this.#paintStatus();
    if (focus.owned && this.#surfaceIsCurrent()) this.#restoreFocus(focus);
  }

  #creatureFieldset(state: CompendiumRenameReadModelV1): HTMLFieldSetElement {
    const fieldset = this.#document.createElement('fieldset');
    fieldset.dataset.arc5RenameCreatureGroup = 'true';
    fieldset.append(this.#node('legend', '', 'Choose an owned companion'));
    const pageCount = Math.max(1, Math.ceil(state.creatures.length / COMPENDIUM_RENAME_PAGE_SIZE_V1));
    const start = this.#page * COMPENDIUM_RENAME_PAGE_SIZE_V1;
    for (const [offset, row] of state.creatures
      .slice(start, start + COMPENDIUM_RENAME_PAGE_SIZE_V1).entries()) {
      const input = this.#document.createElement('input');
      input.type = 'radio';
      input.name = 'arc5-rename-creature';
      input.id = `arc5-rename-${start + offset}`;
      input.checked = row.creatureId === this.#selectedCreatureId;
      input.dataset.arc5RenameCreatureId = row.creatureId;
      input.dataset.rowEnabled = String(row.status === 'ready');
      input.dataset.focusKey = `rename:creature:${row.creatureId}`;
      input.title = row.disabledReason ?? row.creatureId;
      const label = this.#document.createElement('label');
      label.htmlFor = input.id;
      label.className = 'compendium-feed-choice';
      label.style.minHeight = '44px';
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';
      label.append(input, this.#document.createTextNode(
        `${row.label}${row.disabledReason ? ` · ${row.disabledReason}` : ''}`,
      ));
      fieldset.append(label);
    }
    if (pageCount > 1) {
      const nav = this.#node('div', 'compendium-feed-pager');
      nav.setAttribute('aria-label', 'Rename companion pages');
      const previous = this.#pageButton('Previous', this.#page - 1, this.#page === 0);
      const status = this.#node('span', '', `Page ${this.#page + 1} of ${pageCount}`);
      const next = this.#pageButton('Next', this.#page + 1, this.#page + 1 >= pageCount);
      nav.append(previous, status, next);
      fieldset.append(nav);
    }
    return fieldset;
  }

  #pageButton(label: string, page: number, disabled: boolean): HTMLButtonElement {
    const button = this.#node('button', '', label);
    button.type = 'button';
    button.dataset.arc5RenamePage = String(page);
    button.dataset.focusKey = `rename:page:${Math.max(0, page)}`;
    button.disabled = disabled;
    button.style.minHeight = '44px';
    return button;
  }

  #editor(): HTMLElement {
    const wrap = this.#node('div', 'compendium-feed-summary');
    const label = this.#document.createElement('label');
    label.htmlFor = 'arc5-rename-name';
    label.textContent = 'New companion name';
    const input = this.#document.createElement('input');
    input.id = 'arc5-rename-name';
    input.type = 'text';
    input.maxLength = ARC5_COMPANION_NAME_MAX_V1;
    input.value = this.#rawName;
    input.autocomplete = 'off';
    input.placeholder = 'New name for this creature';
    input.dataset.arc5RenameInput = 'true';
    input.dataset.focusKey = 'rename:name';
    const preview = this.#node('p', '', '');
    preview.dataset.arc5RenamePreview = 'true';
    const button = this.#node('button', 'compendium-feed-confirm', 'Save name');
    button.type = 'button';
    button.dataset.arc5RenameConfirm = 'true';
    button.dataset.focusKey = 'rename:confirm';
    button.style.minHeight = '44px';
    wrap.append(label, input, preview, button);
    return wrap;
  }

  #statusNode(): HTMLElement {
    const status = this.#node('p', 'compendium-feed-status');
    status.dataset.arc5RenameStatus = 'true';
    status.dataset.focusKey = 'rename:status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    status.hidden = true;
    return status;
  }

  #message(text: string, state: string): HTMLElement {
    const node = this.#node('p', 'compendium-feed-detail', text);
    node.dataset.arc5RenameState = state;
    return node;
  }

  #selectedRequest(): CompendiumRenameActionRequestV1 | null {
    const state = this.#state;
    if (state?.availability !== 'ready' || state.ownershipRevision === null
      || state.ownershipDigest === null || this.#selectedCreatureId === null) return null;
    const creature = state.creatures.find((row) => row.creatureId === this.#selectedCreatureId);
    if (creature?.status !== 'ready') return null;
    const nicknameAfter = cleanName(this.#rawName, ARC5_COMPANION_NAME_MAX_V1);
    if (nicknameAfter.length === 0 || /[\u0000-\u001f\u007f]/u.test(nicknameAfter)
      || nicknameAfter === creature.nickname) return null;
    return Object.freeze({
      surface: state.surface,
      contextKey: state.contextKey,
      ownershipRevision: state.ownershipRevision,
      ownershipDigest: state.ownershipDigest,
      creatureId: creature.creatureId,
      nicknameBefore: creature.nickname,
      rawName: this.#rawName,
      nicknameAfter,
    });
  }

  #paintDraft(): void {
    const preview = this.#mount?.querySelector<HTMLElement>('[data-arc5-rename-preview]');
    if (!preview) return;
    const selected = this.#state?.creatures.find(
      (row) => row.creatureId === this.#selectedCreatureId,
    );
    if (!selected) {
      preview.textContent = 'Choose one exact companion first.';
      return;
    }
    const cleaned = cleanName(this.#rawName, ARC5_COMPANION_NAME_MAX_V1);
    preview.textContent = cleaned.length === 0
      ? 'Enter a name containing supported characters.'
      : cleaned === selected.nickname ? 'Enter a different name.'
        : `Saved name: ${cleaned}`;
    preview.dataset.normalizedName = cleaned;
  }

  #applyAvailability(): void {
    const mount = this.#mount;
    if (mount === null) return;
    const busy = this.#pending !== null || this.#convergenceLatched;
    const current = this.#surfaceIsCurrent();
    mount.setAttribute('aria-busy', String(this.#pending !== null));
    for (const input of mount.querySelectorAll<HTMLInputElement>(
      'input[type="radio"][data-arc5-rename-creature-id]',
    )) {
      input.disabled = busy || !current || this.#state?.availability !== 'ready'
        || input.dataset.rowEnabled !== 'true';
      input.setAttribute('aria-disabled', String(input.disabled));
    }
    const editor = mount.querySelector<HTMLInputElement>('[data-arc5-rename-input]');
    if (editor) {
      editor.disabled = busy || !current || this.#selectedCreatureId === null;
      editor.setAttribute('aria-disabled', String(editor.disabled));
    }
    for (const pager of mount.querySelectorAll<HTMLButtonElement>('[data-arc5-rename-page]')) {
      pager.disabled = pager.disabled || busy || !current;
      pager.setAttribute('aria-disabled', String(pager.disabled));
    }
    const confirm = mount.querySelector<HTMLButtonElement>('[data-arc5-rename-confirm]');
    if (confirm) {
      confirm.disabled = busy || !current || this.#onAction === null
        || this.#selectedRequest() === null;
      confirm.setAttribute('aria-disabled', String(confirm.disabled));
      confirm.title = busy ? 'A rename is settling.'
        : !current ? 'This Compendium detail is no longer current.'
          : confirm.disabled ? 'Choose a companion and enter a different valid name.'
            : 'Save this exact companion name.';
    }
  }

  #paintStatus(): void {
    const status = this.#mount?.querySelector<HTMLElement>('[data-arc5-rename-status]');
    if (!status) return;
    if (this.#pending !== null) {
      status.hidden = false;
      status.dataset.kind = 'pending';
      status.dataset.convergence = 'none';
      status.textContent = 'Rename settling. The current name remains shown until the save commits.';
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

  #normalizeSelection(): void {
    const state = this.#state;
    if (state === null) return;
    if (state.creatures.find((row) => row.creatureId === this.#selectedCreatureId)
      ?.status !== 'ready') {
      this.#selectedCreatureId = null;
      this.#rawName = '';
    }
    const pages = Math.max(1, Math.ceil(state.creatures.length / COMPENDIUM_RENAME_PAGE_SIZE_V1));
    this.#page = Math.min(pages - 1, Math.max(0, this.#page));
  }

  #surfaceIsCurrent(): boolean {
    return this.#state !== null && this.#isCurrent(this.#state.surface);
  }

  #shouldPublishFor(surface: CompendiumRenameSurfaceReceiptV1): boolean {
    return this.#state?.surface.surfaceKey === surface.surfaceKey
      && this.#isCurrent(surface) && this.#mount?.isConnected === true;
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
    if (receipt.owned) this.#focusByKey(receipt.key);
  }

  #focusByKey(key: string | null): void {
    if (key === null) return;
    const node = [...(this.#mount?.querySelectorAll<HTMLElement>('[data-focus-key]') ?? [])]
      .find((candidate) => candidate.dataset.focusKey === key && !candidate.hidden);
    node?.focus();
  }

  #focusStatus(): void {
    this.#mount?.querySelector<HTMLElement>('[data-arc5-rename-status]')?.focus();
  }

  #disposeMount(mount: HTMLElement): void {
    mount.replaceChildren();
    delete mount.dataset.arc5RenameController;
    delete mount.dataset.arc5RenameContextKey;
    delete mount.dataset.arc5RenameSurfaceKey;
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
    if (this.#disposed) throw new Error('Compendium Rename controller is disposed');
  }
}
