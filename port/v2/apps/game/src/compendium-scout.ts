/* Arc 5 Compendium Field Scout presentation owner.

   The projection binds one real fauna detail to exact living-creature IDs.
   This controller owns bounded controls and pending truth only; Main remains
   the sole coordinator for persistence, publication, and reload convergence. */
import {
  MAX_OWNERSHIP_REVISION,
  canonicalGenomeIdentityV1,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type OwnershipStateV2,
  type SpeciesId,
} from '@cf/domain-acquisition';

export const COMPENDIUM_SCOUT_READ_MODEL_SCHEMA =
  'cf-v2-compendium-scout-read-model/v1' as const;
export const COMPENDIUM_SCOUT_OUTCOME_SCHEMA =
  'cf-v2-compendium-scout-outcome/v1' as const;
export const COMPENDIUM_SCOUT_DIAGNOSTICS_SCHEMA =
  'cf-v2-compendium-scout-diagnostics/v1' as const;
export const COMPENDIUM_SCOUT_PAGE_SIZE_V1 = 24 as const;

export type CompendiumScoutAvailability =
  | 'ready' | 'fixture' | 'non-fauna' | 'protected' | 'no-companion';
export type CompendiumScoutCreatureStatus = 'ready' | 'exhibit';
export type CompendiumScoutOutcomeKind = 'committed' | 'committed-convergence' | 'refused';
export type CompendiumScoutConvergence = 'none' | 'read-only-reload';

export interface CompendiumScoutRecordV1 {
  readonly id: string;
  readonly name: string;
  readonly g: Readonly<Record<string, unknown>>;
}

export interface CompendiumScoutProjectionInputV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly record: CompendiumScoutRecordV1;
  readonly ownership: OwnershipStateV2 | null;
  readonly protected: boolean;
  readonly fixture: boolean;
}

export interface CompendiumScoutSurfaceReceiptV1 {
  readonly generation: number;
  readonly logicalId: string;
  readonly speciesId: SpeciesId | null;
  readonly surfaceKey: string;
}

export interface CompendiumScoutCreatureReadModelV1 {
  readonly creatureId: CreatureInstanceId;
  readonly label: string;
  readonly status: CompendiumScoutCreatureStatus;
  readonly current: boolean;
  readonly disabledReason: string | null;
}

export interface CompendiumScoutReadModelV1 {
  readonly schema: typeof COMPENDIUM_SCOUT_READ_MODEL_SCHEMA;
  readonly surface: CompendiumScoutSurfaceReceiptV1;
  readonly contextKey: string;
  readonly availability: CompendiumScoutAvailability;
  readonly detail: string;
  readonly ownershipRevision: number | null;
  readonly ownershipDigest: string | null;
  readonly scoutCreatureId: CreatureInstanceId | null;
  readonly creatures: readonly CompendiumScoutCreatureReadModelV1[];
}

export interface CompendiumScoutActionRequestV1 {
  readonly surface: CompendiumScoutSurfaceReceiptV1;
  readonly contextKey: string;
  readonly ownershipRevision: number;
  readonly ownershipDigest: string;
  readonly scoutBefore: CreatureInstanceId | null;
  readonly scoutAfter: CreatureInstanceId | null;
}

export interface CompendiumScoutActionOutcomeV1 {
  readonly schema: typeof COMPENDIUM_SCOUT_OUTCOME_SCHEMA;
  readonly kind: CompendiumScoutOutcomeKind;
  readonly convergence: CompendiumScoutConvergence;
  readonly request: CompendiumScoutActionRequestV1;
  readonly title: string;
  readonly detail: string;
}

export interface CompendiumScoutControllerOptions {
  readonly root: HTMLElement;
  readonly isCurrent: (surface: CompendiumScoutSurfaceReceiptV1) => boolean;
  readonly onAction?: (request: CompendiumScoutActionRequestV1) => void;
}

export interface CompendiumScoutDiagnosticsV1 {
  readonly schema: typeof COMPENDIUM_SCOUT_DIAGNOSTICS_SCHEMA;
  readonly attachedMountCount: 0 | 1;
  readonly retainedDomCount: number;
  readonly pendingWork: 0 | 1;
  readonly convergenceLatched: boolean;
  readonly delegatedListenerCount: 0 | 2;
  readonly creatureControlCount: number;
  readonly surfaceKey: string | null;
  readonly contextKey: string | null;
  readonly selectedCreatureId: CreatureInstanceId | null;
  readonly currentPage: number;
  readonly lastRequest: CompendiumScoutActionRequestV1 | null;
  readonly lastOutcome: CompendiumScoutActionOutcomeV1 | null;
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
): CompendiumScoutSurfaceReceiptV1 {
  return Object.freeze({
    generation,
    logicalId,
    speciesId,
    surfaceKey: JSON.stringify([generation, logicalId, speciesId]),
  });
}

function unavailable(
  surface: CompendiumScoutSurfaceReceiptV1,
  availability: Exclude<CompendiumScoutAvailability, 'ready'>,
  detail: string,
  ownershipRevision: number | null = null,
  ownershipDigest: string | null = null,
  scoutCreatureId: CreatureInstanceId | null = null,
  creatures: readonly CompendiumScoutCreatureReadModelV1[] = Object.freeze([]),
): CompendiumScoutReadModelV1 {
  const model: CompendiumScoutReadModelV1 = Object.freeze({
    schema: COMPENDIUM_SCOUT_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([
      surface.surfaceKey, ownershipRevision, ownershipDigest, availability,
    ]),
    availability,
    detail,
    ownershipRevision,
    ownershipDigest,
    scoutCreatureId,
    creatures,
  });
  READ_MODELS.add(model);
  return model;
}

/** Project exact same-species companions; role, injury and Recovery do not
 * change eligibility because the legacy Scout action is an identity-only
 * designation rather than a mission dispatch or combat action. */
export function projectCompendiumScoutV1(
  input: CompendiumScoutProjectionInputV1,
): CompendiumScoutReadModelV1 {
  if (!Number.isSafeInteger(input.generation) || input.generation < 0) {
    throw new RangeError('Compendium Field Scout generation must be a non-negative safe integer');
  }
  const logicalId = checkedText(input.logicalId, 'Compendium logical ID', 128);
  const emptySurface = surfaceReceipt(input.generation, logicalId, null);
  if (input.fixture) {
    return unavailable(emptySurface, 'fixture',
      'Field Scout is unavailable for diagnostic Compendium fixtures.');
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
      'Field Scout is unavailable because this Compendium record did not verify.');
  }
  const surface = surfaceReceipt(input.generation, logicalId, identity.speciesId);
  if (identity.kingdom !== 'fauna') {
    return unavailable(surface, 'non-fauna',
      'Only an owned fauna companion can serve as Field Scout.');
  }
  const ownership = input.ownership;
  if (input.protected || ownership === null || !isOwnershipStateV2(ownership)
    || ownership.mode !== 'current') {
    return unavailable(surface, 'protected',
      'Field Scout is unavailable while companion ownership is protected.');
  }
  const digest = ownershipStateDigestV2(ownership);
  if (ownership.revision === MAX_OWNERSHIP_REVISION) {
    return unavailable(surface, 'protected',
      'Field Scout is unavailable because companion ownership reached its revision ceiling.',
      ownership.revision, digest, ownership.scoutCreatureId);
  }
  const catalogue = ownership.catalogSpecies.find((row) => row.speciesId === identity.speciesId);
  if (catalogue === undefined || catalogue.genomeIdentity !== identity.genomeIdentity
    || catalogue.kingdom !== 'fauna') {
    return unavailable(surface, 'protected',
      'Field Scout is unavailable because this Compendium species does not match ownership authority.',
      ownership.revision, digest, ownership.scoutCreatureId);
  }
  const creatures = Object.freeze(ownership.creatures
    .filter((row) => row.speciesId === identity.speciesId
      && row.genomeIdentity === identity.genomeIdentity)
    .map((row): CompendiumScoutCreatureReadModelV1 => {
      const exhibit = row.genome.exhibit === true;
      return Object.freeze({
        creatureId: row.creatureId,
        label: `${row.nickname ?? recordName} · ${shortId(row.creatureId)}`,
        status: exhibit ? 'exhibit' : 'ready',
        current: row.creatureId === ownership.scoutCreatureId,
        disabledReason: exhibit
          ? 'Exhibition challengers are not owned companions.' : null,
      });
    }));
  if (!creatures.some((row) => row.status === 'ready')) {
    return unavailable(surface, 'no-companion',
      'No owned living companion matches this fauna species.',
      ownership.revision, digest, ownership.scoutCreatureId, creatures);
  }
  const model: CompendiumScoutReadModelV1 = Object.freeze({
    schema: COMPENDIUM_SCOUT_READ_MODEL_SCHEMA,
    surface,
    contextKey: JSON.stringify([surface.surfaceKey, ownership.revision, digest, 'ready']),
    availability: 'ready',
    detail: 'Choose one exact companion. Selecting the current Scout stands it down.',
    ownershipRevision: ownership.revision,
    ownershipDigest: digest,
    scoutCreatureId: ownership.scoutCreatureId,
    creatures,
  });
  READ_MODELS.add(model);
  return model;
}

function assertOutcome(outcome: CompendiumScoutActionOutcomeV1): void {
  if (!Object.isFrozen(outcome) || outcome.schema !== COMPENDIUM_SCOUT_OUTCOME_SCHEMA
    || !Object.isFrozen(outcome.request)
    || (outcome.kind !== 'committed' && outcome.kind !== 'committed-convergence'
      && outcome.kind !== 'refused')
    || (outcome.convergence !== 'none' && outcome.convergence !== 'read-only-reload')
    || (outcome.kind === 'committed' && outcome.convergence !== 'none')
    || (outcome.kind === 'committed-convergence'
      && outcome.convergence !== 'read-only-reload')) {
    throw new TypeError('Compendium Field Scout outcome must be frozen supported data');
  }
  checkedText(outcome.title, 'Compendium Field Scout outcome title', 8_192);
  checkedText(outcome.detail, 'Compendium Field Scout outcome detail', 8_192);
}

export class CompendiumScoutController {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #isCurrent: (surface: CompendiumScoutSurfaceReceiptV1) => boolean;
  readonly #onAction: ((request: CompendiumScoutActionRequestV1) => void) | null;
  #mount: HTMLElement | null = null;
  #state: CompendiumScoutReadModelV1 | null = null;
  #selectedCreatureId: CreatureInstanceId | null = null;
  #page = 0;
  #pending: CompendiumScoutActionRequestV1 | null = null;
  #lastRequest: CompendiumScoutActionRequestV1 | null = null;
  #lastOutcome: CompendiumScoutActionOutcomeV1 | null = null;
  #convergenceLatched = false;
  #listenersInstalled = false;
  #disposed = false;

  constructor(options: CompendiumScoutControllerOptions) {
    this.#root = options.root;
    this.#document = options.root.ownerDocument;
    this.#isCurrent = options.isCurrent;
    this.#onAction = options.onAction ?? null;
  }

  attach(mount: HTMLElement): void {
    this.#assertLive();
    if (!this.#isRootVisible() || mount.ownerDocument !== this.#document
      || !this.#root.contains(mount) || !mount.hasAttribute('data-arc5-scout-body')) {
      throw new Error('Compendium Field Scout mount must be the visible declared descendant');
    }
    const mounts = [...this.#root.querySelectorAll<HTMLElement>('[data-arc5-scout-body]')];
    if (mounts.length !== 1 || mounts[0] !== mount) {
      throw new Error('Compendium Field Scout requires exactly one dynamic mount');
    }
    if (this.#mount !== null && this.#mount !== mount) this.#disposeMount(this.#mount);
    this.#mount = mount;
    this.#installListeners();
    this.#render();
  }

  detach(): void {
    if (this.#disposed) return;
    this.#removeListeners();
    if (this.#mount !== null) this.#disposeMount(this.#mount);
    this.#mount = null;
  }

  setState(state: CompendiumScoutReadModelV1 | null): void {
    this.#assertLive();
    if (state !== null && !READ_MODELS.has(state)) {
      throw new TypeError('Compendium Field Scout accepts only an owner-projected read model');
    }
    const priorContext = this.#state?.contextKey ?? null;
    const priorSurface = this.#state?.surface.surfaceKey ?? null;
    this.#state = state;
    if (state === null || state.contextKey !== priorContext) {
      this.#selectedCreatureId = null;
      this.#page = 0;
    }
    if (state === null || state.surface.surfaceKey !== priorSurface) this.#lastOutcome = null;
    this.#render();
  }

  refresh(): void { this.#assertLive(); this.#render(); }

  settle(outcome: CompendiumScoutActionOutcomeV1): void {
    this.#assertLive();
    assertOutcome(outcome);
    if (this.#pending === null || outcome.request !== this.#pending) {
      throw new Error('Compendium Field Scout outcome does not match its pending exact request');
    }
    this.#lastOutcome = outcome;
    this.#lastRequest = outcome.request;
    this.#pending = null;
    if (outcome.kind !== 'refused') this.#selectedCreatureId = null;
    if (outcome.convergence === 'read-only-reload') this.#convergenceLatched = true;
    this.#render();
    if (this.#shouldPublishFor(outcome.request.surface)) this.#focusStatus();
  }

  diagnostics(): CompendiumScoutDiagnosticsV1 {
    return Object.freeze({
      schema: COMPENDIUM_SCOUT_DIAGNOSTICS_SCHEMA,
      attachedMountCount: this.#mount === null ? 0 : 1,
      retainedDomCount: this.#mount?.querySelectorAll('*').length ?? 0,
      pendingWork: this.#pending === null ? 0 : 1,
      convergenceLatched: this.#convergenceLatched,
      delegatedListenerCount: this.#listenersInstalled ? 2 : 0,
      creatureControlCount: this.#mount?.querySelectorAll(
        'input[type="radio"][data-arc5-scout-creature-id]',
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
    this.#removeListeners();
    if (this.#mount !== null) this.#disposeMount(this.#mount);
    this.#mount = null;
    this.#state = null;
    this.#selectedCreatureId = null;
    this.#pending = null;
    this.#lastRequest = null;
    this.#lastOutcome = null;
    this.#convergenceLatched = false;
    this.#disposed = true;
  }

  #installListeners(): void {
    if (this.#listenersInstalled) return;
    this.#root.addEventListener('change', this.#onChange);
    this.#root.addEventListener('click', this.#onClick);
    this.#listenersInstalled = true;
  }

  #removeListeners(): void {
    if (!this.#listenersInstalled) return;
    this.#root.removeEventListener('change', this.#onChange);
    this.#root.removeEventListener('click', this.#onClick);
    this.#listenersInstalled = false;
  }

  readonly #onChange = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.HTMLInputElement) || target.type !== 'radio'
      || !this.#mount?.contains(target) || target.disabled
      || target.dataset.arc5ScoutCreatureId === undefined) return;
    const row = this.#state!.creatures.find(
      (candidate) => candidate.creatureId === target.dataset.arc5ScoutCreatureId,
    );
    if (row?.status !== 'ready') return;
    const focus = this.#captureFocus();
    this.#selectedCreatureId = row.creatureId;
    this.#render();
    this.#restoreFocus(focus);
  };

  readonly #onClick = (event: Event): void => {
    if (!this.#canInteract()) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element)) return;
    const page = target.closest<HTMLButtonElement>('button[data-arc5-scout-page]');
    if (page && this.#mount?.contains(page) && !page.disabled) {
      const next = Number(page.dataset.arc5ScoutPage);
      if (Number.isSafeInteger(next) && next >= 0) {
        this.#page = next;
        this.#render();
        this.#focusByKey('scout:heading');
      }
      return;
    }
    const confirm = target.closest<HTMLButtonElement>('button[data-arc5-scout-confirm]');
    if (!confirm || !this.#mount?.contains(confirm) || confirm.disabled) return;
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
      if (this.#pending === request && !this.#convergenceLatched) {
        this.#pending = null;
        this.#lastRequest = null;
        this.#lastOutcome = priorOutcome;
        this.#render();
        this.#focusByKey('scout:confirm');
      }
      throw error;
    }
  };

  #render(): void {
    const mount = this.#mount;
    if (mount === null) return;
    if (!this.#isRootVisible()) {
      this.detach();
      return;
    }
    this.#normalizeSelection();
    const focus = this.#captureFocus();
    const fragment = this.#document.createDocumentFragment();
    const heading = this.#node('h4', '', 'Field Scout');
    heading.dataset.arc5ScoutHeading = 'true';
    heading.dataset.focusKey = 'scout:heading';
    heading.tabIndex = -1;
    fragment.append(heading);
    const state = this.#state;
    if (state === null) {
      fragment.append(this.#message('Field Scout facts are unavailable.', 'absent'));
    } else {
      fragment.append(this.#message(state.detail, state.availability));
      if (state.creatures.length > 0) fragment.append(this.#creatureFieldset(state));
      if (state.availability === 'ready') fragment.append(this.#confirmButton());
    }
    fragment.append(this.#statusNode());
    mount.replaceChildren(fragment);
    mount.dataset.arc5ScoutController = 'v1';
    if (state === null) {
      delete mount.dataset.arc5ScoutContextKey;
      delete mount.dataset.arc5ScoutSurfaceKey;
    } else {
      mount.dataset.arc5ScoutContextKey = state.contextKey;
      mount.dataset.arc5ScoutSurfaceKey = state.surface.surfaceKey;
    }
    this.#applyAvailability();
    this.#paintStatus();
    if (focus.owned && this.#surfaceIsCurrent()) this.#restoreFocus(focus);
  }

  #creatureFieldset(state: CompendiumScoutReadModelV1): HTMLFieldSetElement {
    const fieldset = this.#document.createElement('fieldset');
    fieldset.dataset.arc5ScoutCreatureGroup = 'true';
    fieldset.append(this.#node('legend', '', 'Choose an owned companion'));
    const pageCount = Math.max(1, Math.ceil(state.creatures.length / COMPENDIUM_SCOUT_PAGE_SIZE_V1));
    const start = this.#page * COMPENDIUM_SCOUT_PAGE_SIZE_V1;
    for (const [offset, row] of state.creatures
      .slice(start, start + COMPENDIUM_SCOUT_PAGE_SIZE_V1).entries()) {
      const input = this.#document.createElement('input');
      input.type = 'radio';
      input.name = 'arc5-field-scout';
      input.id = `arc5-scout-${start + offset}`;
      input.checked = row.creatureId === this.#selectedCreatureId;
      input.dataset.arc5ScoutCreatureId = row.creatureId;
      input.dataset.rowEnabled = String(row.status === 'ready');
      input.dataset.focusKey = `scout:creature:${row.creatureId}`;
      input.title = row.disabledReason ?? row.creatureId;
      const label = this.#document.createElement('label');
      label.htmlFor = input.id;
      label.className = 'compendium-feed-choice';
      label.style.minHeight = '44px';
      label.style.display = 'flex';
      label.style.alignItems = 'center';
      label.style.gap = '8px';
      label.append(input, this.#document.createTextNode(
        `${row.label}${row.current ? ' · Field Scout ✓' : ''}`
          + `${row.disabledReason ? ` · ${row.disabledReason}` : ''}`,
      ));
      fieldset.append(label);
    }
    if (pageCount > 1) {
      const nav = this.#node('div', 'compendium-feed-pager');
      nav.setAttribute('aria-label', 'Field Scout companion pages');
      nav.append(
        this.#pageButton('Previous', this.#page - 1, this.#page === 0),
        this.#node('span', '', `Page ${this.#page + 1} of ${pageCount}`),
        this.#pageButton('Next', this.#page + 1, this.#page + 1 >= pageCount),
      );
      fieldset.append(nav);
    }
    return fieldset;
  }

  #pageButton(label: string, page: number, disabled: boolean): HTMLButtonElement {
    const button = this.#node('button', '', label);
    button.type = 'button';
    button.dataset.arc5ScoutPage = String(page);
    button.dataset.focusKey = `scout:page:${Math.max(0, page)}`;
    button.disabled = disabled;
    button.style.minHeight = '44px';
    return button;
  }

  #confirmButton(): HTMLButtonElement {
    const selected = this.#selectedRow();
    const button = this.#node('button', 'compendium-feed-confirm',
      selected?.current ? 'Stand down' : 'Name Field Scout');
    button.type = 'button';
    button.dataset.arc5ScoutConfirm = 'true';
    button.dataset.focusKey = 'scout:confirm';
    button.style.minHeight = '44px';
    return button;
  }

  #statusNode(): HTMLElement {
    const status = this.#node('p', 'compendium-feed-status');
    status.dataset.arc5ScoutStatus = 'true';
    status.dataset.focusKey = 'scout:status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    status.hidden = true;
    return status;
  }

  #message(text: string, state: string): HTMLElement {
    const node = this.#node('p', 'compendium-feed-detail', text);
    node.dataset.arc5ScoutState = state;
    return node;
  }

  #selectedRow(): CompendiumScoutCreatureReadModelV1 | null {
    if (this.#selectedCreatureId === null) return null;
    return this.#state?.creatures.find(
      (row) => row.creatureId === this.#selectedCreatureId,
    ) ?? null;
  }

  #selectedRequest(): CompendiumScoutActionRequestV1 | null {
    const state = this.#state;
    const row = this.#selectedRow();
    if (state?.availability !== 'ready' || state.ownershipRevision === null
      || state.ownershipDigest === null || row?.status !== 'ready') return null;
    return Object.freeze({
      surface: state.surface,
      contextKey: state.contextKey,
      ownershipRevision: state.ownershipRevision,
      ownershipDigest: state.ownershipDigest,
      scoutBefore: state.scoutCreatureId,
      scoutAfter: row.current ? null : row.creatureId,
    });
  }

  #applyAvailability(): void {
    const mount = this.#mount;
    if (mount === null) return;
    const locked = this.#pending !== null || this.#convergenceLatched;
    const current = this.#surfaceIsCurrent();
    mount.setAttribute('aria-busy', String(this.#pending !== null));
    for (const input of mount.querySelectorAll<HTMLInputElement>(
      'input[data-arc5-scout-creature-id]',
    )) {
      input.disabled = locked || !current || this.#state?.availability !== 'ready'
        || input.dataset.rowEnabled !== 'true';
      input.setAttribute('aria-disabled', String(input.disabled));
    }
    for (const page of mount.querySelectorAll<HTMLButtonElement>('button[data-arc5-scout-page]')) {
      page.disabled = locked || !current || page.disabled;
      page.setAttribute('aria-disabled', String(page.disabled));
    }
    const confirm = mount.querySelector<HTMLButtonElement>('[data-arc5-scout-confirm]');
    if (confirm) {
      confirm.disabled = locked || !current || this.#onAction === null
        || this.#selectedRequest() === null;
      confirm.setAttribute('aria-disabled', String(confirm.disabled));
      confirm.title = locked ? 'A Field Scout change is settling.'
        : !current ? 'This Compendium detail is no longer current.'
          : confirm.disabled ? 'Choose one eligible exact companion.'
            : 'Save this exact Field Scout role.';
    }
  }

  #paintStatus(): void {
    const status = this.#status();
    if (!status) return;
    if (this.#pending !== null) {
      status.hidden = false;
      status.dataset.kind = 'pending';
      status.dataset.convergence = 'none';
      status.textContent = this.#pending.scoutAfter === null
        ? 'Standing the current Field Scout down… The saved Scout remains unchanged until commit.'
        : 'Naming Field Scout… The saved Scout remains unchanged until commit.';
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

  #status(): HTMLElement | null {
    return this.#mount?.querySelector<HTMLElement>('[data-arc5-scout-status]') ?? null;
  }

  #normalizeSelection(): void {
    const state = this.#state;
    if (state?.availability !== 'ready' || this.#selectedCreatureId === null
      || !state.creatures.some((row) => row.creatureId === this.#selectedCreatureId
        && row.status === 'ready')) this.#selectedCreatureId = null;
    const pageCount = Math.max(1, Math.ceil(
      (state?.creatures.length ?? 0) / COMPENDIUM_SCOUT_PAGE_SIZE_V1,
    ));
    if (this.#page >= pageCount) this.#page = pageCount - 1;
  }

  #surfaceIsCurrent(): boolean {
    return this.#state !== null && this.#isCurrent(this.#state.surface);
  }

  #shouldPublishFor(surface: CompendiumScoutSurfaceReceiptV1): boolean {
    return this.#state?.surface.surfaceKey === surface.surfaceKey
      && this.#isCurrent(surface) && this.#mount?.isConnected === true;
  }

  #canInteract(): boolean {
    return !this.#disposed && this.#mount !== null && this.#state !== null
      && this.#pending === null && !this.#convergenceLatched
      && this.#isRootVisible() && this.#surfaceIsCurrent();
  }

  #isRootVisible(): boolean {
    return this.#root.isConnected && this.#root.style.display !== 'none'
      && !this.#root.hidden && !this.#root.hasAttribute('inert');
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

  #focusStatus(): void { this.#status()?.focus(); }

  #disposeMount(mount: HTMLElement): void {
    mount.replaceChildren();
    delete mount.dataset.arc5ScoutController;
    delete mount.dataset.arc5ScoutContextKey;
    delete mount.dataset.arc5ScoutSurfaceKey;
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
    if (this.#disposed) throw new Error('Compendium Field Scout controller is disposed');
  }
}
