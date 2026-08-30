/* Arc 4 Capture presentation owner.

   Main owns navigation, authority projection, the durable writer, shared
   ProductActionCoordinator, outcome wording and reload policy. This
   controller owns only one dynamic Survey-card mount. It consumes a
   detached deeply-frozen read model, emits one immutable synchronous verb
   request, and keeps pending/focus truth across Survey hide/reopen and mount
   replacement. It never plans, draws, spends, retries or publishes an
   expedition fact. */

export const CAPTURE_CARD_READ_MODEL_SCHEMA =
  'cf-v2-capture-card-read-model/v1' as const;
export const CAPTURE_CARD_OUTCOME_SCHEMA =
  'cf-v2-capture-card-outcome/v1' as const;
export const CAPTURE_CARD_DIAGNOSTICS_SCHEMA =
  'cf-v2-capture-card-diagnostics/v1' as const;

export const CAPTURE_CARD_VERB_ORDER = Object.freeze([
  'tame',
  'scavenge',
  'sample',
] as const);

export type CaptureCardVerb = (typeof CAPTURE_CARD_VERB_ORDER)[number];
export type CaptureCardOpportunityStatus =
  | 'ready'
  | 'empty'
  | 'depleted'
  | 'unavailable';
export type CaptureCardConvergence = 'none' | 'read-only-reload';
export type CaptureCardOutcomeKind =
  | 'committed-hit'
  | 'committed-miss'
  | 'committed-unknown'
  | 'refused'
  | 'unavailable';

export interface CaptureCardAttemptBudgetReadModel {
  readonly yield: number;
  readonly used: number;
  readonly remaining: number;
  readonly cycle: number;
  readonly recoveryRemainingActivePlayMs: number;
  readonly recoveryDetail: string;
}

export interface CaptureCardOpportunityReadModel {
  readonly verb: CaptureCardVerb;
  readonly status: CaptureCardOpportunityStatus;
  readonly eligibleCount: number;
  /** Uniform-pool success probability after candidate-specific odds. */
  readonly overallChance: number | null;
  readonly chanceMin: number | null;
  readonly chanceMax: number | null;
  readonly detail: string;
}

export interface CaptureCardReadModelV1 {
  readonly schema: typeof CAPTURE_CARD_READ_MODEL_SCHEMA;
  /** Full source-bound world/epoch identity, never a preview-row identity. */
  readonly contextKey: string;
  readonly summary: string;
  /** Null only when the presentation has no authoritative attempt budget. */
  readonly budget: CaptureCardAttemptBudgetReadModel | null;
  /** Exactly Tame, Scavenge and Sample in CAPTURE_CARD_VERB_ORDER. */
  readonly rows: readonly CaptureCardOpportunityReadModel[];
}

export interface CaptureCardActionRequest {
  readonly verb: CaptureCardVerb;
}

export interface CaptureCardActionOutcome {
  readonly schema: typeof CAPTURE_CARD_OUTCOME_SCHEMA;
  readonly kind: CaptureCardOutcomeKind;
  readonly verb: CaptureCardVerb;
  readonly convergence: CaptureCardConvergence;
  readonly title: string;
  readonly detail: string;
}

export interface CaptureCardDiagnostics {
  readonly schema: typeof CAPTURE_CARD_DIAGNOSTICS_SCHEMA;
  readonly attachedMountCount: 0 | 1;
  readonly retainedDomCount: number;
  readonly pendingWork: 0 | 1;
  readonly convergenceLatched: boolean;
  /** Exact native-disable-to-BODY focus lineage, not arbitrary BODY focus. */
  readonly pendingDisabledBodyFocusOwned: boolean;
  readonly actionControlCount: number;
  readonly delegatedListenerCount: 0 | 1;
  readonly contextKey: string | null;
  readonly lastRequest: CaptureCardActionRequest | null;
  readonly lastOutcome: CaptureCardActionOutcome | null;
}

export interface CaptureCardControllerOptions {
  /** Persistent Survey-card root. Dynamic refills replace only its mount. */
  readonly root: HTMLElement;
  /** Browser-trusted Tame input only. Called synchronously before onAction so
   * Web Audio may consume the same user-activation stack. */
  readonly onNativeTameGesture?: () => void;
  /** Called synchronously. Any returned promise is deliberately ignored. */
  readonly onAction?: (request: CaptureCardActionRequest) => void;
}

interface FocusReceipt {
  readonly focusKey: string | null;
  readonly semanticKey: string | null;
}

interface SettlementFocusReceipt {
  readonly focusKey: string;
  readonly semanticKey: string;
}

const VERB_PRESENTATION: Readonly<Record<CaptureCardVerb, Readonly<{
  label: string;
  poolLabel: string;
  emptyLabel: string;
}>>> = Object.freeze({
  tame: Object.freeze({ label: 'Tame', poolLabel: 'fauna', emptyLabel: 'No eligible fauna' }),
  scavenge: Object.freeze({
    label: 'Scavenge', poolLabel: 'flora or fungi', emptyLabel: 'No eligible flora or fungi',
  }),
  sample: Object.freeze({ label: 'Sample', poolLabel: 'microbes', emptyLabel: 'No eligible microbes' }),
});

const PENDING_REASON = 'Another capture attempt is pending.';
const COORDINATOR_UNAVAILABLE_REASON = 'Capture action coordinator is unavailable.';

function isVerb(value: unknown): value is CaptureCardVerb {
  return value === 'tame' || value === 'scavenge' || value === 'sample';
}

function checkedNonEmptyText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 8_192) {
    throw new TypeError(`${label} must be non-empty bounded text`);
  }
  return value;
}

function checkedCounter(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
  return value as number;
}

function checkedChance(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be a finite probability in [0, 1]`);
  }
  return value;
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

function assertReadModel(model: CaptureCardReadModelV1): void {
  assertFrozenData(model, 'capture card read model');
  if (model.schema !== CAPTURE_CARD_READ_MODEL_SCHEMA) {
    throw new TypeError('capture card read model schema is unsupported');
  }
  checkedNonEmptyText(model.contextKey, 'capture contextKey');
  checkedNonEmptyText(model.summary, 'capture summary');
  if (model.rows.length !== CAPTURE_CARD_VERB_ORDER.length
    || model.rows.some((row, index) => row.verb !== CAPTURE_CARD_VERB_ORDER[index])) {
    throw new TypeError('capture rows must contain Tame, Scavenge and Sample in canonical order');
  }

  const budget = model.budget;
  if (budget === null) {
    if (model.rows.some((row) => row.status !== 'unavailable')) {
      throw new TypeError('capture rows require unavailable status without an authoritative budget');
    }
  } else {
    const yieldCount = checkedCounter(budget.yield, 'capture budget yield');
    const used = checkedCounter(budget.used, 'capture budget used');
    const remaining = checkedCounter(budget.remaining, 'capture budget remaining');
    checkedCounter(budget.cycle, 'capture budget cycle');
    checkedCounter(
      budget.recoveryRemainingActivePlayMs,
      'capture budget recoveryRemainingActivePlayMs',
    );
    checkedNonEmptyText(budget.recoveryDetail, 'capture budget recoveryDetail');
    if (used + remaining !== yieldCount) {
      throw new RangeError('capture budget used plus remaining must equal yield');
    }
  }

  for (const row of model.rows) {
    if (!['ready', 'empty', 'depleted', 'unavailable'].includes(row.status)) {
      throw new TypeError(`capture ${row.verb} status is unsupported`);
    }
    const eligibleCount = checkedCounter(row.eligibleCount, `capture ${row.verb} eligibleCount`);
    checkedNonEmptyText(row.detail, `capture ${row.verb} detail`);
    if (row.status === 'ready') {
      if (budget === null || budget.remaining === 0 || eligibleCount === 0) {
        throw new TypeError(`capture ${row.verb} cannot be ready without pool and budget`);
      }
      const overall = checkedChance(row.overallChance, `capture ${row.verb} overallChance`);
      const minimum = checkedChance(row.chanceMin, `capture ${row.verb} chanceMin`);
      const maximum = checkedChance(row.chanceMax, `capture ${row.verb} chanceMax`);
      if (minimum > overall || overall > maximum) {
        throw new RangeError(`capture ${row.verb} overall chance must lie inside its range`);
      }
    } else if (row.overallChance !== null || row.chanceMin !== null || row.chanceMax !== null) {
      throw new TypeError(`capture ${row.verb} non-ready row cannot publish odds`);
    }
    if (row.status === 'empty' && eligibleCount !== 0) {
      throw new TypeError(`capture ${row.verb} empty row cannot retain eligible candidates`);
    }
    if (row.status === 'depleted' && (budget === null || budget.remaining !== 0)) {
      throw new TypeError(`capture ${row.verb} depleted row requires an exhausted budget`);
    }
  }
}

function assertOutcome(outcome: CaptureCardActionOutcome): void {
  assertFrozenData(outcome, 'capture card outcome');
  if (outcome.schema !== CAPTURE_CARD_OUTCOME_SCHEMA) {
    throw new TypeError('capture card outcome schema is unsupported');
  }
  if (!isVerb(outcome.verb)) throw new TypeError('capture card outcome verb is unsupported');
  if (!['committed-hit', 'committed-miss', 'committed-unknown', 'refused', 'unavailable']
    .includes(outcome.kind)) {
    throw new TypeError('capture card outcome kind is unsupported');
  }
  if (outcome.convergence !== 'none' && outcome.convergence !== 'read-only-reload') {
    throw new TypeError('capture card convergence is unsupported');
  }
  if ((outcome.kind === 'committed-hit' || outcome.kind === 'committed-miss')
    && outcome.convergence !== 'none') {
    throw new TypeError('a known committed capture outcome cannot request convergence');
  }
  if (outcome.kind === 'committed-unknown' && outcome.convergence !== 'read-only-reload') {
    throw new TypeError('an unknown committed capture outcome must retain reload convergence');
  }
  checkedNonEmptyText(outcome.title, 'capture outcome title');
  checkedNonEmptyText(outcome.detail, 'capture outcome detail');
}

function copyRequest(request: CaptureCardActionRequest): CaptureCardActionRequest {
  if (!isVerb(request.verb)) throw new TypeError('capture card request verb is unsupported');
  return Object.freeze({ verb: request.verb });
}

function sameRequest(
  left: CaptureCardActionRequest,
  right: CaptureCardActionRequest,
): boolean {
  return left.verb === right.verb;
}

function sameOutcome(
  left: CaptureCardActionOutcome | null,
  right: CaptureCardActionOutcome,
): boolean {
  return left !== null
    && left.schema === right.schema
    && left.kind === right.kind
    && left.verb === right.verb
    && left.convergence === right.convergence
    && left.title === right.title
    && left.detail === right.detail;
}

function percent(value: number): string {
  const rounded = Math.round(value * 10_000_000) / 100_000;
  return `${String(rounded)}%`;
}

export class CaptureCardController {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #onNativeTameGesture: (() => void) | null;
  readonly #onAction: ((request: CaptureCardActionRequest) => void) | null;
  #mount: HTMLElement | null = null;
  #state: CaptureCardReadModelV1 | null = null;
  #lastContextKey: string | null = null;
  #pending: CaptureCardActionRequest | null = null;
  #lastRequest: CaptureCardActionRequest | null = null;
  #lastOutcome: CaptureCardActionOutcome | null = null;
  #emissionLocked = false;
  #convergenceLatched = false;
  #listenerInstalled = false;
  #disposed = false;
  #settlementFocus: SettlementFocusReceipt | null = null;
  #pendingDisabledBodyFocus = false;
  #settlementFallbackFocused = false;

  constructor(options: CaptureCardControllerOptions) {
    this.#root = options.root;
    this.#document = options.root.ownerDocument;
    this.#onNativeTameGesture = options.onNativeTameGesture ?? null;
    this.#onAction = options.onAction ?? null;
  }

  /** Attach the persistent controller to the one mount created by a Survey
   * refill. State, pending work and terminal outcome survive replacement. */
  attach(mount: HTMLElement): void {
    this.#assertLive();
    if (mount.ownerDocument !== this.#document
      || !this.#root.contains(mount)
      || !mount.hasAttribute('data-capture-card-body')) {
      throw new Error('Capture card mount must be the declared descendant of its Survey root');
    }
    const mounts = [...this.#root.querySelectorAll<HTMLElement>('[data-capture-card-body]')];
    if (mounts.length !== 1 || mounts[0] !== mount) {
      throw new Error('Capture card requires exactly one dynamic mount');
    }
    if (this.#mount !== null && this.#mount !== mount) this.#disposeMount(this.#mount);
    this.#mount = mount;
    this.#installListener();
    this.#render();
  }

  detach(): void {
    if (this.#disposed) return;
    this.#removeListener();
    if (this.#mount !== null) this.#disposeMount(this.#mount);
    this.#mount = null;
  }

  setState(state: CaptureCardReadModelV1 | null): void {
    this.#assertLive();
    if (state !== null) assertReadModel(state);
    if (state !== null && this.#lastContextKey !== null
      && state.contextKey !== this.#lastContextKey) {
      if (this.#isBusy()) {
        throw new Error('Capture card cannot replace its context while work is pending');
      }
      this.#lastRequest = null;
      this.#lastOutcome = null;
      this.#settlementFocus = null;
      this.#pendingDisabledBodyFocus = false;
      this.#settlementFallbackFocused = false;
    }
    if (state !== null) this.#lastContextKey = state.contextKey;
    this.#state = state;
    if (this.#mount !== null) this.#installListener();
    this.#render();
  }

  /** Idempotently confirms or externally starts the same pending request.
   * A converging document cannot be unlocked or assigned a replacement. */
  setPending(request: CaptureCardActionRequest | null): void {
    this.#assertLive();
    if (request === null) {
      if (this.#convergenceLatched) return;
      this.#clearPending(true);
      return;
    }
    if (this.#convergenceLatched) {
      throw new Error('Capture card cannot replace a converging action');
    }
    const copy = copyRequest(request);
    const current = this.#pending ?? (this.#emissionLocked ? this.#lastRequest : null);
    if (current !== null && !sameRequest(current, copy)) {
      throw new Error('Capture card cannot replace a pending action');
    }
    if (this.#settlementFocus === null) this.#retainSettlementFocus(copy);
    this.#pending = copy;
    this.#lastRequest = copy;
    this.#lastOutcome = null;
    this.#emissionLocked = true;
    this.#applyActionAvailabilityWithFocusProof();
    this.#paintStatus();
  }

  /** Publish presentation copy only after Main has classified durability.
   * Read-only convergence is terminal for this document and keeps every
   * action disabled through replacement. */
  settle(outcome: CaptureCardActionOutcome): void {
    this.#assertLive();
    assertOutcome(outcome);
    if (this.#convergenceLatched) {
      if (sameOutcome(this.#lastOutcome, outcome)) return;
      throw new Error('Capture card convergence is terminal for this document');
    }
    const pending = this.#pending ?? (this.#emissionLocked ? this.#lastRequest : null);
    if (pending === null) throw new Error('Capture card cannot settle without a pending action');
    if (pending.verb !== outcome.verb) {
      throw new Error('Capture card outcome does not match its pending verb');
    }
    const restoreSettlement = this.#isRootVisible()
      && this.#settlementFocus !== null
      && (this.#focusBelongsToSettlement(this.#settlementFocus)
        || this.#ownsPendingDisabledBodyFocus());
    this.#lastOutcome = outcome;
    if (outcome.convergence === 'read-only-reload') {
      this.#convergenceLatched = true;
      this.#render();
      return;
    }
    this.#pending = null;
    this.#emissionLocked = false;
    this.#render();
    if (restoreSettlement && this.#isRootVisible() && this.#settlementFocus !== null) {
      this.#restoreSettlementTarget(this.#settlementFocus);
    }
    this.#settlementFocus = null;
    this.#pendingDisabledBodyFocus = false;
    this.#settlementFallbackFocused = false;
  }

  diagnostics(): CaptureCardDiagnostics {
    return Object.freeze({
      schema: CAPTURE_CARD_DIAGNOSTICS_SCHEMA,
      attachedMountCount: this.#mount === null ? 0 : 1,
      retainedDomCount: this.#mount?.querySelectorAll('*').length ?? 0,
      pendingWork: this.#isBusy() ? 1 : 0,
      convergenceLatched: this.#convergenceLatched,
      pendingDisabledBodyFocusOwned: this.#ownsPendingDisabledBodyFocus(),
      actionControlCount: this.#mount?.querySelectorAll('[data-capture-action]').length ?? 0,
      delegatedListenerCount: this.#listenerInstalled ? 1 : 0,
      contextKey: this.#state?.contextKey ?? null,
      lastRequest: this.#lastRequest,
      lastOutcome: this.#lastOutcome,
    });
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#removeListener();
    if (this.#mount !== null) this.#disposeMount(this.#mount);
    this.#mount = null;
    this.#state = null;
    this.#lastContextKey = null;
    this.#pending = null;
    this.#lastRequest = null;
    this.#lastOutcome = null;
    this.#emissionLocked = false;
    this.#convergenceLatched = false;
    this.#settlementFocus = null;
    this.#pendingDisabledBodyFocus = false;
    this.#settlementFallbackFocused = false;
    this.#disposed = true;
  }

  #installListener(): void {
    if (this.#listenerInstalled) return;
    this.#root.addEventListener('click', this.#onClick);
    this.#listenerInstalled = true;
  }

  #removeListener(): void {
    if (!this.#listenerInstalled) return;
    this.#root.removeEventListener('click', this.#onClick);
    this.#listenerInstalled = false;
  }

  readonly #onClick = (event: Event): void => {
    if (this.#disposed || this.#isBusy() || !this.#isRootVisible() || this.#mount === null) return;
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-capture-action]');
    if (!button || !this.#mount.contains(button) || button.disabled
      || button.dataset.modelEnabled !== 'true') return;
    const verb = button.dataset.captureAction;
    if (!isVerb(verb)) return;
    const request = copyRequest({ verb });
    const priorOutcome = this.#lastOutcome;
    this.#retainSettlementFocus(request);
    this.#pending = request;
    this.#lastRequest = request;
    this.#lastOutcome = null;
    this.#emissionLocked = true;
    this.#applyActionAvailabilityWithFocusProof();
    this.#paintStatus();
    try {
      if (verb === 'tame' && event.isTrusted) this.#onNativeTameGesture?.();
      this.#onAction?.(request);
    } catch (error) {
      if (!this.#convergenceLatched && this.#emissionLocked && this.#pending !== null
        && sameRequest(this.#pending, request)) {
        this.#pending = null;
        this.#emissionLocked = false;
        this.#lastRequest = null;
        this.#lastOutcome = priorOutcome;
        this.#render();
        if (this.#settlementFocus !== null && this.#isRootVisible()) {
          this.#restoreSettlementTarget(this.#settlementFocus);
        }
        this.#settlementFocus = null;
        this.#pendingDisabledBodyFocus = false;
        this.#settlementFallbackFocused = false;
      }
      throw error;
    }
  };

  #render(): void {
    const mount = this.#mount;
    if (mount === null) return;
    const receipt = this.#viewForRender(this.#captureView());
    const fragment = this.#document.createDocumentFragment();
    fragment.append(this.#node('h3', 'capture-card-title', 'Biosphere capture'));
    if (this.#state === null) {
      const unavailable = this.#node(
        'p',
        'capture-card-unavailable',
        'Capture facts are unavailable for this surveyed world.',
      );
      unavailable.dataset.captureState = 'absent';
      fragment.append(unavailable, this.#statusNode());
    } else {
      fragment.append(this.#node('p', 'capture-card-summary', this.#state.summary));
      if (this.#state.budget !== null) fragment.append(this.#budgetNode(this.#state.budget));
      const group = this.#node('div', 'capture-card-actions');
      group.dataset.captureActionGroup = 'true';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', 'Biosphere capture actions');
      for (const row of this.#state.rows) group.append(this.#opportunityNode(row));
      fragment.append(group, this.#statusNode());
    }
    mount.replaceChildren(fragment);
    mount.dataset.captureCardController = 'v1';
    if (this.#state === null) delete mount.dataset.captureContextKey;
    else mount.dataset.captureContextKey = this.#state.contextKey;
    this.#applyActionAvailability();
    this.#paintStatus();
    if (this.#isRootVisible()) this.#restoreView(receipt);
  }

  #budgetNode(budget: CaptureCardAttemptBudgetReadModel): HTMLElement {
    const node = this.#node(
      'p',
      'capture-card-budget',
      `${budget.remaining} of ${budget.yield} capture attempts remain; ${budget.used} spent this active-play cycle. ${budget.recoveryDetail}`,
    );
    node.dataset.captureBudget = 'true';
    node.dataset.yield = String(budget.yield);
    node.dataset.used = String(budget.used);
    node.dataset.remaining = String(budget.remaining);
    node.dataset.cycle = String(budget.cycle);
    node.dataset.recoveryRemainingActivePlayMs = String(budget.recoveryRemainingActivePlayMs);
    return node;
  }

  #opportunityNode(model: CaptureCardOpportunityReadModel): HTMLElement {
    const presentation = VERB_PRESENTATION[model.verb];
    const semanticKey = `capture:${model.verb}`;
    const row = this.#node('section', 'capture-card-row');
    row.dataset.captureRow = model.verb;
    row.dataset.semanticKey = semanticKey;
    row.dataset.status = model.status;
    row.tabIndex = -1;
    row.append(this.#node('h4', 'capture-card-row-title', `${presentation.label} · ${presentation.poolLabel}`));
    const detail = this.#node('p', 'capture-card-row-detail', model.detail);
    detail.dataset.captureDetail = model.verb;
    row.append(detail);
    if (model.status === 'ready') {
      const odds = this.#node(
        'p',
        'capture-card-odds',
        `One of ${model.eligibleCount} eligible ${presentation.poolLabel} is selected at random. Overall success chance ${percent(model.overallChance!)}${model.chanceMin === model.chanceMax
          ? '.'
          : `; individual odds range ${percent(model.chanceMin!)}–${percent(model.chanceMax!)}.`}`,
      );
      odds.dataset.captureOdds = model.verb;
      odds.dataset.eligibleCount = String(model.eligibleCount);
      odds.dataset.overallChance = String(model.overallChance);
      odds.dataset.chanceMin = String(model.chanceMin);
      odds.dataset.chanceMax = String(model.chanceMax);
      row.append(odds);
    } else {
      const status = model.status === 'empty'
        ? presentation.emptyLabel
        : model.status === 'depleted' ? 'No attempts remain this cycle' : 'Unavailable';
      const label = this.#node('p', 'capture-card-row-status', status);
      label.dataset.captureRowStatus = model.verb;
      row.append(label);
    }
    const button = this.#node('button', 'capture-card-action', presentation.label);
    button.type = 'button';
    button.dataset.captureAction = model.verb;
    button.dataset.focusKey = semanticKey;
    button.dataset.modelEnabled = String(model.status === 'ready' && this.#onAction !== null);
    button.dataset.disabledReason = model.status === 'ready' && this.#onAction === null
      ? COORDINATOR_UNAVAILABLE_REASON
      : model.detail;
    row.append(button);
    return row;
  }

  #statusNode(): HTMLElement {
    const status = this.#node('p', 'capture-card-status');
    status.dataset.captureStatus = 'true';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    status.hidden = true;
    return status;
  }

  #paintStatus(): void {
    const mount = this.#mount;
    if (mount === null) return;
    const status = mount.querySelector<HTMLElement>('[data-capture-status]');
    if (status === null) return;
    if (this.#lastOutcome !== null) {
      status.hidden = false;
      status.dataset.kind = this.#lastOutcome.kind;
      status.dataset.convergence = this.#lastOutcome.convergence;
      status.textContent = `${this.#lastOutcome.title} ${this.#lastOutcome.detail}`;
      return;
    }
    if (this.#isBusy()) {
      const verb = this.#pending?.verb ?? this.#lastRequest?.verb;
      const label = verb === undefined ? 'Capture' : VERB_PRESENTATION[verb].label;
      status.hidden = false;
      status.dataset.kind = 'pending';
      status.dataset.convergence = 'none';
      status.textContent = `${label} attempt pending. No capture, attempt spend, Compendium page or reward is published until the durable outcome settles. Close remains available; reopening stays busy.`;
      return;
    }
    status.hidden = true;
    delete status.dataset.kind;
    delete status.dataset.convergence;
    status.textContent = '';
  }

  #applyActionAvailability(): void {
    const mount = this.#mount;
    if (mount === null) return;
    const busy = this.#isBusy();
    mount.setAttribute('aria-busy', String(busy));
    for (const button of mount.querySelectorAll<HTMLButtonElement>('button[data-capture-action]')) {
      const modelEnabled = button.dataset.modelEnabled === 'true';
      button.disabled = busy || !modelEnabled;
      button.setAttribute('aria-disabled', String(button.disabled));
      button.title = busy ? PENDING_REASON
        : modelEnabled ? '' : button.dataset.disabledReason ?? 'Unavailable';
    }
  }

  #applyActionAvailabilityWithFocusProof(): void {
    const settlement = this.#settlementFocus;
    const activeBefore = this.#document.activeElement;
    const ownedBefore = settlement !== null && this.#focusBelongsToSettlement(settlement);
    this.#applyActionAvailability();
    if (ownedBefore && activeBefore !== this.#document.body
      && this.#document.activeElement === this.#document.body) {
      this.#pendingDisabledBodyFocus = true;
    }
  }

  #captureView(): FocusReceipt | null {
    const mount = this.#mount;
    if (mount === null || mount.childElementCount === 0) return null;
    const view = this.#document.defaultView;
    const active = this.#document.activeElement;
    const ownsFocus = !!view && active instanceof view.HTMLElement && mount.contains(active);
    const keyed = ownsFocus ? active.closest<HTMLElement>('[data-focus-key]') : null;
    const semantic = ownsFocus ? active.closest<HTMLElement>('[data-semantic-key]') : null;
    return Object.freeze({
      focusKey: keyed?.dataset.focusKey ?? null,
      semanticKey: semantic?.dataset.semanticKey ?? null,
    });
  }

  #retainSettlementFocus(request: CaptureCardActionRequest): void {
    const receipt = this.#captureView();
    const key = `capture:${request.verb}`;
    if (receipt?.focusKey !== key || receipt.semanticKey !== key) return;
    this.#settlementFocus = Object.freeze({ focusKey: key, semanticKey: key });
  }

  #viewForRender(receipt: FocusReceipt | null): FocusReceipt | null {
    const settlement = this.#settlementFocus;
    if (!this.#isBusy() || settlement === null) return receipt;
    const ownsFocus = this.#focusBelongsToSettlement(settlement)
      || this.#ownsPendingDisabledBodyFocus();
    if (!ownsFocus) return receipt;
    return Object.freeze({
      focusKey: settlement.focusKey,
      semanticKey: settlement.semanticKey,
    });
  }

  #restoreView(receipt: FocusReceipt | null): void {
    if (receipt === null) return;
    const keyed = this.#focusKeyTarget(receipt.focusKey, receipt.semanticKey);
    if (keyed !== null && !this.#disabled(keyed) && this.#restoreElement(keyed)) {
      this.#settlementFallbackFocused = false;
      this.#pendingDisabledBodyFocus = false;
      return;
    }
    const semantic = this.#semanticTarget(receipt.semanticKey);
    if (semantic !== null && this.#restoreElement(semantic)) {
      this.#settlementFallbackFocused = false;
      this.#pendingDisabledBodyFocus = false;
      return;
    }
    if (this.#isBusy() && this.#settlementFocus !== null) {
      const status = this.#mount?.querySelector<HTMLElement>('[data-capture-status]') ?? null;
      if (this.#restoreElement(status)) {
        this.#settlementFallbackFocused = true;
        this.#pendingDisabledBodyFocus = false;
      }
    }
  }

  #restoreSettlementTarget(settlement: SettlementFocusReceipt): boolean {
    const keyed = this.#focusKeyTarget(settlement.focusKey, settlement.semanticKey);
    if (keyed !== null && !this.#disabled(keyed) && this.#restoreElement(keyed)) return true;
    const semantic = this.#semanticTarget(settlement.semanticKey);
    if (semantic !== null && this.#restoreElement(semantic)) return true;
    const status = this.#mount?.querySelector<HTMLElement>('[data-capture-status]') ?? null;
    return this.#restoreElement(status);
  }

  #focusBelongsToSettlement(settlement: SettlementFocusReceipt): boolean {
    const mount = this.#mount;
    const view = this.#document.defaultView;
    const active = this.#document.activeElement;
    if (!mount || !view || !(active instanceof view.HTMLElement) || !mount.contains(active)) return false;
    if (this.#settlementFallbackFocused
      && active.matches('[data-capture-status]')) return true;
    return active.closest<HTMLElement>('[data-semantic-key]')?.dataset.semanticKey
      === settlement.semanticKey;
  }

  #ownsPendingDisabledBodyFocus(): boolean {
    return this.#pendingDisabledBodyFocus && this.#document.activeElement === this.#document.body;
  }

  #focusKeyTarget(focusKey: string | null, semanticKey: string | null): HTMLElement | null {
    if (focusKey === null || this.#mount === null) return null;
    return [...this.#mount.querySelectorAll<HTMLElement>('[data-focus-key]')]
      .find((element) => element.dataset.focusKey === focusKey
        && element.closest<HTMLElement>('[data-semantic-key]')?.dataset.semanticKey
          === semanticKey) ?? null;
  }

  #semanticTarget(semanticKey: string | null): HTMLElement | null {
    if (semanticKey === null || this.#mount === null) return null;
    return [...this.#mount.querySelectorAll<HTMLElement>('[data-semantic-key]')]
      .find((element) => element.dataset.semanticKey === semanticKey) ?? null;
  }

  #restoreElement(element: HTMLElement | null): boolean {
    if (!element?.isConnected || this.#disabled(element)) return false;
    try { element.focus(); } catch { return false; }
    return this.#document.activeElement === element;
  }

  #disabled(element: HTMLElement): boolean {
    const view = this.#document.defaultView;
    return !!view && element instanceof view.HTMLButtonElement && element.disabled;
  }

  #clearPending(restoreFocus: boolean): void {
    const settlement = this.#settlementFocus;
    const shouldRestore = restoreFocus && this.#isRootVisible() && settlement !== null
      && (this.#focusBelongsToSettlement(settlement) || this.#ownsPendingDisabledBodyFocus());
    this.#pending = null;
    this.#emissionLocked = false;
    this.#render();
    if (shouldRestore && settlement !== null && this.#isRootVisible()) {
      this.#restoreSettlementTarget(settlement);
    }
    this.#settlementFocus = null;
    this.#pendingDisabledBodyFocus = false;
    this.#settlementFallbackFocused = false;
  }

  #disposeMount(mount: HTMLElement): void {
    mount.replaceChildren();
    mount.removeAttribute('aria-busy');
    delete mount.dataset.captureCardController;
    delete mount.dataset.captureContextKey;
  }

  #isBusy(): boolean {
    return this.#pending !== null || this.#emissionLocked || this.#convergenceLatched;
  }

  #isRootVisible(): boolean {
    return this.#root.isConnected
      && !this.#root.hidden
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
    if (this.#disposed) throw new Error('Capture card controller is disposed');
  }
}
