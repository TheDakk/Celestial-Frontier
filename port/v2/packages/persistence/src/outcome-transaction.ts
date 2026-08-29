/* F4 exact-outcome transaction seam.

   A player outcome is planned from the persisted F4 SessionRNG authority,
   derived against a detached compatibility-state draft, and then committed
   exactly once through F3. Product rows, the next RNG counters/ordinal, the
   caller's active-play snapshot, immutable receipt, lease fence, and next
   revision share one atomic transaction. There is deliberately no retry:
   after stale storage, lease loss, or I/O failure, a reload sees the old RNG
   authority and therefore replans the same value instead of rerolling. */
import { MAX_ACTIVE_PLAY_MS, type ActivePlaySnapshot } from '@cf/domain-progression';
import {
  MAX_SESSION_RNG_DRAWS_PER_PLAN,
  SessionRNGPlanningExhaustion,
  isPlannedSessionRNGDraws,
  planSessionRNGDraw,
  planSessionRNGDraws,
  projectSessionRNGDrawAdvance,
  type PlannedSessionRNGDraws,
  type ProjectedSessionRNGDrawAdvance,
  type SessionRNGState,
} from '@cf/domain-sessionrng';
import {
  F4_AUTHORITY_NAMESPACE,
  prepareF4AuthorityUpdate,
  readF4Authority,
  type F4AuthorityV1,
} from './active-play.js';
import {
  importSaveV2,
  type ContentRegistry,
  type ImportSaveResult,
  type SaveStateV2,
} from './import-v2.js';
import { exportSaveV2 } from './export-v2.js';
import {
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  prepareV5SaveWrite,
  type PreparedV5SaveWrite,
  type V5ExtensionWrite,
  type V5Extensions,
  type V5WritableState,
} from './migration-v5.js';
import type { MutationReceipt, RevisionedRepository } from './revisioned.js';
import { tabLeaseFence, type TabLeaseGrant } from './tab-lease.js';

export interface F4OutcomeDrawPlan {
  readonly domain: string;
  readonly value: number;
  readonly receiptOrdinal: number;
  readonly currentAuthority: F4AuthorityV1;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
}

export type F4OutcomeAuthorityProtection =
  | { readonly kind: 'protected'; readonly reason: 'authority-absent' | 'authority-corrupt' }
  | { readonly kind: 'protected'; readonly reason: 'authority-future'; readonly version: number };

export type F4OutcomeDrawPlanOutcome =
  | F4OutcomeAuthorityProtection
  | { readonly kind: 'planned'; readonly plan: F4OutcomeDrawPlan };

export interface F4OutcomeDeriveInput {
  readonly domain: string;
  readonly value: number;
  readonly receiptOrdinal: number;
  /** A fresh canonical state owned by this attempt. Mutating and returning
   * this draft cannot alter the caller's currently-rendered/save state. */
  readonly draft: SaveStateV2;
  /** A detached, validated snapshot of every current v5 extension. Product
   * policy may inspect it, but changes are accepted only through the checked
   * `extensionWrites` returned by the derivation. */
  readonly extensions: V5Extensions;
}

export interface F4OutcomeDerivation {
  readonly state: SaveStateV2;
  /** Namespaced product replacements. Omission means no product extension
   * change. Each segment/namespace pair may occur at most once. */
  readonly extensionWrites?: readonly V5ExtensionWrite[];
  /** Stable product identity/fingerprint written verbatim into the receipt. */
  readonly witness: string;
}

export interface F4OutcomeTransactionInput {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  /** Exact state/extensions from the current v5 read. */
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly domain: string;
  readonly receiptKind: string;
  /** Injected compatibility-codec input; this owner reads no clock. */
  readonly now: number;
  /** Pure product policy. It receives exactly one detached draft and must
   * return the complete next state plus a bounded semantic witness. */
  readonly derive: (input: F4OutcomeDeriveInput) => F4OutcomeDerivation;
}

type ProductTransactionRejectionStage =
  | 'draft'
  | 'derive'
  | 'extension-writes'
  | 'authority-update'
  | 'product-prepare';

interface ReceiptAuthorityPlan {
  readonly receiptOrdinal: number;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
}

type PlannedProductTransactionOutcome<Plan extends ReceiptAuthorityPlan> =
  | {
    readonly kind: 'committed';
    readonly revision: number;
    readonly plan: Plan;
    readonly receipt: MutationReceipt;
    readonly authority: F4AuthorityV1;
    readonly saved: PreparedV5SaveWrite;
  }
  | {
    readonly kind: 'rejected';
    readonly stage: ProductTransactionRejectionStage;
    readonly message: string;
    readonly plan: Plan;
  }
  | {
    readonly kind: 'stale';
    readonly expectedRevision: number;
    readonly actualRevision: number;
    readonly plan: Plan;
  }
  | {
    readonly kind: 'revision-exhausted';
    readonly revision: number;
    readonly plan: Plan;
  }
  | {
    readonly kind: 'duplicate-receipt';
    readonly receiptKey: string;
    readonly existing: MutationReceipt;
    readonly plan: Plan;
  }
  | {
    readonly kind: 'lost';
    readonly reason: 'lease-lost' | 'conflict';
    readonly plan: Plan;
  }
  | {
    readonly kind: 'storage-error';
    readonly message: string;
    readonly plan: Plan;
  };

export type F4OutcomeTransactionOutcome =
  | F4OutcomeAuthorityProtection
  | PlannedProductTransactionOutcome<F4OutcomeDrawPlan>;

export interface F4OutcomeTransactionOwner {
  commit(input: F4OutcomeTransactionInput): Promise<F4OutcomeTransactionOutcome>;
}

export interface F4MultiOutcomeDraw {
  readonly domain: string;
  readonly value: number;
}

export interface F4MultiOutcomeDrawPlan {
  readonly draws: readonly F4MultiOutcomeDraw[];
  readonly receiptOrdinal: number;
  readonly currentAuthority: F4AuthorityV1;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
  /** Branded SessionRNG result retained non-enumerably so downstream
   * authority mints can verify the one evaluation without repeating it. */
  readonly sessionPlan: PlannedSessionRNGDraws;
}

export interface F4MultiOutcomeDrawAdvancePlan {
  readonly domains: readonly string[];
  readonly counters: readonly Readonly<{ readonly domain: string; readonly counter: number }>[];
  readonly receiptOrdinal: number;
  readonly currentAuthority: F4AuthorityV1;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
  readonly sessionProjection: ProjectedSessionRNGDrawAdvance;
}

export type F4MultiOutcomePlanProtection =
  | F4OutcomeAuthorityProtection
  | { readonly kind: 'protected'; readonly reason: 'receipt-ordinal-exhausted' }
  | {
    readonly kind: 'protected';
    readonly reason: 'draw-counter-exhausted';
    readonly domain: string;
  };

export type F4MultiOutcomeDrawPlanOutcome =
  | F4MultiOutcomePlanProtection
  | { readonly kind: 'planned'; readonly plan: F4MultiOutcomeDrawPlan };

export type F4MultiOutcomeDrawAdvancePlanOutcome =
  | F4MultiOutcomePlanProtection
  | { readonly kind: 'projected'; readonly plan: F4MultiOutcomeDrawAdvancePlan };

export interface F4MultiOutcomeDeriveInput {
  /** Immutable, ordered rows. Duplicate domains remain distinct occurrences. */
  readonly draws: readonly F4MultiOutcomeDraw[];
  readonly receiptOrdinal: number;
  /** Exact leased active-play snapshot committed by this same transaction. */
  readonly activePlayMs: number;
  readonly draft: SaveStateV2;
  readonly extensions: V5Extensions;
}

export interface F4MultiOutcomeTransactionInput {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly domains: readonly string[];
  readonly receiptKind: string;
  readonly now: number;
  readonly derive: (input: F4MultiOutcomeDeriveInput) => F4OutcomeDerivation;
}

export type F4MultiOutcomeTransactionOutcome =
  | F4MultiOutcomePlanProtection
  | PlannedProductTransactionOutcome<F4MultiOutcomeDrawPlan>;

export interface F4MultiOutcomeTransactionOwner {
  commit(input: F4MultiOutcomeTransactionInput): Promise<F4MultiOutcomeTransactionOutcome>;
}

export interface F4MultiOutcomePreDrawInput {
  readonly domains: readonly string[];
  readonly counters: readonly Readonly<{ readonly domain: string; readonly counter: number }>[];
  readonly receiptOrdinal: number;
  readonly activePlayMs: number;
  readonly currentAuthority: F4AuthorityV1;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
  /** Per-commit compatibility codec minted by this transaction owner. Its
   * registry snapshot, save clock, and receipt kind are the exact context
   * used again for the final write. */
  readonly codec: F4MultiOutcomePreDrawSaveCodec;
  /** Detached snapshots. Product policy cannot mutate the caller's live save. */
  readonly draft: SaveStateV2;
  readonly extensions: V5Extensions;
}

export interface F4MultiOutcomePreDrawReady<Proof> {
  readonly kind: 'ready';
  readonly proof: Proof;
}

export interface F4MultiOutcomePreDrawRefusal<Reason extends string> {
  readonly kind: 'refused';
  readonly reason: Reason;
}

export interface F4MultiOutcomePreDrawSaveCodec {
  readonly now: number;
  readonly receiptKind: string;
  prepare(writable: V5WritableState): PreparedV5SaveWrite;
  importLegacy(raw: string): ImportSaveResult;
  exportLegacy(state: SaveStateV2): string;
}

export interface F4MultiOutcomePreDrawDeriveInput<Proof> extends F4MultiOutcomeDeriveInput {
  /** Exact value-bearing plan materialized once after ready authorization. */
  readonly plan: F4MultiOutcomeDrawPlan;
  readonly currentAuthority: F4AuthorityV1;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
  readonly codec: F4MultiOutcomePreDrawSaveCodec;
  readonly proof: Proof;
}

export interface F4MultiOutcomePreDrawAuthorizedSettlement {
  readonly kind: 'authorized-settlement';
  readonly derivation: F4OutcomeDerivation;
  readonly prepared: PreparedV5SaveWrite;
}

export interface F4MultiOutcomePreDrawSettlementAuthorizer {
  /** Mint exactly once. `prepared` must be an output of this commit's codec. */
  authorize(
    derivation: F4OutcomeDerivation,
    prepared: PreparedV5SaveWrite,
  ): F4MultiOutcomePreDrawAuthorizedSettlement;
}

const PRE_DRAW_SETTLEMENT_AUTHORIZER_CODECS = new WeakMap<
  object,
  F4MultiOutcomePreDrawSaveCodec
>();

/** Recognize only the exact settlement capability minted for one commit's
 * exact save codec. Structural lookalikes and capabilities from another
 * commit cannot receive that commit's privately prepared product rows. */
export function isF4MultiOutcomePreDrawSettlementAuthorizerForCodec(
  authorizer: unknown,
  codec: unknown,
): authorizer is F4MultiOutcomePreDrawSettlementAuthorizer {
  return typeof authorizer === 'object' && authorizer !== null
    && PRE_DRAW_SETTLEMENT_AUTHORIZER_CODECS.get(authorizer) === codec;
}

export type F4MultiOutcomePreDrawSettlement<Proof> = (
  input: F4MultiOutcomePreDrawDeriveInput<Proof>,
  authorizer: F4MultiOutcomePreDrawSettlementAuthorizer,
) => F4MultiOutcomePreDrawAuthorizedSettlement;

export interface F4MultiOutcomePreDrawAuthorizer<Proof> {
  /** The owner brands this exact object and captures the sole settlement
   * callback before any value-bearing SessionRNG plan is materialized. */
  ready(
    proof: Proof,
    settle: F4MultiOutcomePreDrawSettlement<Proof>,
  ): F4MultiOutcomePreDrawReady<Proof>;
}

export interface F4MultiOutcomePreDrawTransactionInput<Proof, Reason extends string> {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly domains: readonly string[];
  readonly receiptKind: string;
  readonly now: number;
  readonly preDraw: (
    input: F4MultiOutcomePreDrawInput,
    authorizer: F4MultiOutcomePreDrawAuthorizer<Proof>,
  ) => F4MultiOutcomePreDrawReady<Proof> | F4MultiOutcomePreDrawRefusal<Reason>;
}

export type F4MultiOutcomePreDrawTransactionOutcome<Reason extends string> =
  | F4MultiOutcomePlanProtection
  | { readonly kind: 'pre-draw-refused'; readonly reason: Reason }
  | { readonly kind: 'rejected'; readonly stage: 'pre-draw'; readonly message: string }
  | PlannedProductTransactionOutcome<F4MultiOutcomeDrawPlan>;

export interface F4MultiOutcomePreDrawTransactionOwner {
  commit<Proof, Reason extends string>(
    input: F4MultiOutcomePreDrawTransactionInput<Proof, Reason>,
  ): Promise<F4MultiOutcomePreDrawTransactionOutcome<Reason>>;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function checkedReceiptKind(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 96
    || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RangeError('outcome receipt kind must be 1–96 printable characters');
  }
  return value;
}

function checkedWitness(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 4_096
    || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RangeError('outcome witness must be 1–4096 printable characters');
  }
  return value;
}

function capturedActivePlaySnapshot(
  snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>,
): Readonly<Pick<ActivePlaySnapshot, 'activePlayMs'>> {
  const activePlayMs = snapshot.activePlayMs;
  if (!Number.isSafeInteger(activePlayMs) || activePlayMs < 0 || activePlayMs > MAX_ACTIVE_PLAY_MS) {
    throw new RangeError(`activePlayMs must be a safe integer from 0 through ${MAX_ACTIVE_PLAY_MS}`);
  }
  return Object.freeze({ activePlayMs });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Validate and detach extension authority without invoking the complete save
 * writer. The complete writer is deliberately reserved for the one final
 * state assembled after product policy and F4 authority have both landed. */
function detachedCanonicalExtensions(value: unknown): V5Extensions {
  return canonicalizeV5Extensions(clonePlainData(value, new Set<object>(), { nodes: 0 }, 0));
}

const MAX_PLAIN_CLONE_WORK = 1_500_000;

interface PlainCloneBudget { nodes: number; }

function consumePlainCloneWork(budget: PlainCloneBudget, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0
    || budget.nodes > MAX_PLAIN_CLONE_WORK - amount) {
    throw new RangeError('outcome state exceeds the detachment bound');
  }
  budget.nodes += amount;
}

function definePlainDataProperty(target: object, key: PropertyKey, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function clonePlainData(
  value: unknown,
  ancestors: Set<object>,
  budget: PlainCloneBudget,
  depth: number,
): unknown {
  if (value === null || value === undefined
    || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'object') throw new TypeError('outcome state must contain only plain data');
  if (depth > 256) throw new RangeError('outcome state exceeds the detachment bound');
  consumePlainCloneWork(budget, 1);
  if (ancestors.has(value)) throw new TypeError('outcome state cannot contain cycles');
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('outcome arrays must use the native prototype');
      const keys = Reflect.ownKeys(value);
      if (keys.some((key) => typeof key !== 'string'
        || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('outcome arrays cannot carry extra properties');
      }
      const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
      if (!lengthDescriptor || !('value' in lengthDescriptor)
        || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0) {
        throw new TypeError('outcome array length is invalid');
      }
      const arrayLength = lengthDescriptor.value as number;
      if (keys.some((key) => {
        if (key === 'length' || typeof key !== 'string') return false;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index < 0 || index >= arrayLength
          || String(index) !== key;
      })) {
        throw new TypeError('outcome arrays cannot carry out-of-range indices');
      }
      /* Charge every slot, including holes, before allocation or iteration.
         Sparse native arrays therefore cannot evade the detachment bound. */
      consumePlainCloneWork(budget, arrayLength);
      const result = new Array<unknown>(arrayLength);
      for (let index = 0; index < result.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor === undefined) continue;
        if (!('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('outcome arrays cannot contain accessors');
        }
        definePlainDataProperty(
          result,
          String(index),
          clonePlainData(descriptor.value, ancestors, budget, depth + 1),
        );
      }
      return result;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('outcome state objects must use a plain prototype');
    }
    const objectKeys = Reflect.ownKeys(value);
    consumePlainCloneWork(budget, objectKeys.length);
    const result: Record<string, unknown> = prototype === null ? Object.create(null) : {};
    for (const key of objectKeys) {
      if (typeof key !== 'string') throw new TypeError('outcome state cannot contain symbols');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('outcome state cannot contain accessors or hidden fields');
      }
      definePlainDataProperty(
        result,
        key,
        clonePlainData(descriptor.value, ancestors, budget, depth + 1),
      );
    }
    return result;
  } finally {
    ancestors.delete(value);
  }
}

function deepFreezePlain(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && 'value' in descriptor) deepFreezePlain(descriptor.value, seen);
  }
  Object.freeze(value);
}

function detachedState(value: unknown): SaveStateV2 {
  if (!isRecord(value)) throw new TypeError('outcome state must be an object');
  const detached = clonePlainData(value, new Set<object>(), { nodes: 0 }, 0);
  if (!isRecord(detached)) throw new TypeError('outcome state clone must be an object');
  return detached as unknown as SaveStateV2;
}

function detachedContentRegistry(value: ContentRegistry): ContentRegistry {
  const detached = clonePlainData(value, new Set<object>(), { nodes: 0 }, 0);
  if (!isRecord(detached)) throw new TypeError('content registry must be a plain data object');
  deepFreezePlain(detached);
  return detached as unknown as ContentRegistry;
}

function checkedCodecNow(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RangeError('outcome codec clock must be a non-negative safe integer');
  }
  return value as number;
}

function preparedSaveFingerprint(value: PreparedV5SaveWrite): string {
  const raw = JSON.stringify({
    canonicalState: value.canonicalState,
    extensions: value.extensions,
    legacyV4Raw: value.legacyV4Raw,
    operations: value.operations,
  });
  if (raw === undefined) throw new TypeError('prepared save must be JSON data');
  return raw;
}

function frozenSessionRng(state: SessionRNGState): F4AuthorityV1['sessionRng'] {
  const draws = Object.freeze(Object.fromEntries(
    Object.entries(state.draws).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
  ));
  return Object.freeze({ seed: state.seed, ordinal: state.ordinal, draws });
}

/** Plan one draw directly from the persisted extension carrier. Missing,
 * corrupt, and future authority never become a new seed or zero counters. */
export function planF4OutcomeDraw(
  extensions: V5Extensions,
  domain: string,
): F4OutcomeDrawPlanOutcome {
  const current = readF4Authority(extensions);
  if (current.kind === 'absent') return { kind: 'protected', reason: 'authority-absent' };
  if (current.kind === 'corrupt') return { kind: 'protected', reason: 'authority-corrupt' };
  if (current.kind === 'future-version') {
    return { kind: 'protected', reason: 'authority-future', version: current.version };
  }
  const planned = planSessionRNGDraw(current.authority.sessionRng, domain);
  return Object.freeze({
    kind: 'planned',
    plan: Object.freeze({
      domain: planned.domain,
      value: planned.value,
      receiptOrdinal: planned.receiptOrdinal,
      currentAuthority: current.authority,
      nextSessionRng: frozenSessionRng(planned.nextState),
    }),
  });
}

function protectedProjectionError(error: unknown): F4MultiOutcomePlanProtection {
  if (!(error instanceof SessionRNGPlanningExhaustion)) throw error;
  if (error.reason === 'receipt-ordinal-exhausted') {
    return Object.freeze({ kind: 'protected', reason: error.reason });
  }
  if (error.domain === null) throw error;
  return Object.freeze({ kind: 'protected', reason: error.reason, domain: error.domain });
}

/** Project one ordered multi-domain F4 transition without evaluating any
 * values. Capacity policy consumes this exact seam before random selection. */
export function projectF4MultiOutcomeDrawAdvance(
  extensions: V5Extensions,
  domains: readonly string[],
): F4MultiOutcomeDrawAdvancePlanOutcome {
  const current = readF4Authority(extensions);
  if (current.kind === 'absent') return { kind: 'protected', reason: 'authority-absent' };
  if (current.kind === 'corrupt') return { kind: 'protected', reason: 'authority-corrupt' };
  if (current.kind === 'future-version') {
    return { kind: 'protected', reason: 'authority-future', version: current.version };
  }
  try {
    const projected = projectSessionRNGDrawAdvance(current.authority.sessionRng, domains);
    const checkedDomains = Object.freeze(projected.advances.map(({ domain }) => domain));
    return Object.freeze({
      kind: 'projected',
      plan: Object.freeze({
        domains: checkedDomains,
        counters: projected.advances,
        receiptOrdinal: projected.receiptOrdinal,
        currentAuthority: current.authority,
        nextSessionRng: frozenSessionRng(projected.nextState),
        sessionProjection: projected,
      }),
    });
  } catch (error) {
    return protectedProjectionError(error);
  }
}

function sameSessionRng(
  left: F4AuthorityV1['sessionRng'],
  right: SessionRNGState,
): boolean {
  return left.seed === right.seed
    && left.ordinal === right.ordinal
    && JSON.stringify(left.draws) === JSON.stringify(frozenSessionRng(right).draws);
}

function materializeF4MultiOutcomeDrawPlan(
  projection: F4MultiOutcomeDrawAdvancePlan,
): F4MultiOutcomeDrawPlan {
  const sessionPlan = planSessionRNGDraws(
    projection.currentAuthority.sessionRng,
    projection.domains,
  );
  if (!isPlannedSessionRNGDraws(sessionPlan)
    || sessionPlan.receiptOrdinal !== projection.receiptOrdinal
    || !sameSessionRng(projection.nextSessionRng, sessionPlan.nextState)
    || sessionPlan.draws.length !== projection.domains.length
    || sessionPlan.draws.some(({ domain }, index) => domain !== projection.domains[index])) {
    throw new Error('F4 value plan diverged from its pre-draw counter projection');
  }
  const plan = {
    draws: sessionPlan.draws,
    receiptOrdinal: sessionPlan.receiptOrdinal,
    currentAuthority: projection.currentAuthority,
    nextSessionRng: projection.nextSessionRng,
  } as F4MultiOutcomeDrawPlan;
  Object.defineProperty(plan, 'sessionPlan', {
    value: sessionPlan,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return Object.freeze(plan);
}

/** Plan one ordered multi-domain outcome against persisted F4 authority. The
 * value-bearing plan is the exact materialization of the public no-value
 * projection; it never mutates the loaded carrier. */
export function planF4MultiOutcomeDraws(
  extensions: V5Extensions,
  domains: readonly string[],
): F4MultiOutcomeDrawPlanOutcome {
  const projected = projectF4MultiOutcomeDrawAdvance(extensions, domains);
  if (projected.kind !== 'projected') return projected;
  return Object.freeze({
    kind: 'planned',
    plan: materializeF4MultiOutcomeDrawPlan(projected.plan),
  });
}

interface CheckedDerivationEnvelope {
  readonly state: SaveStateV2;
  readonly extensionWrites?: unknown;
  readonly witness: string;
}

function checkedDerivation(value: unknown): CheckedDerivationEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('outcome derivation must return an object');
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const withoutWrites = keys.length === 2 && keys[0] === 'state' && keys[1] === 'witness';
  const withWrites = keys.length === 3
    && keys[0] === 'extensionWrites' && keys[1] === 'state' && keys[2] === 'witness';
  if (!withoutWrites && !withWrites) {
    throw new TypeError('outcome derivation must contain state, witness, and optional extensionWrites');
  }
  if (!record.state || typeof record.state !== 'object' || Array.isArray(record.state)) {
    throw new TypeError('outcome derivation state must be an object');
  }
  return Object.freeze({
    state: record.state as SaveStateV2,
    ...(withWrites ? { extensionWrites: record.extensionWrites } : {}),
    witness: checkedWitness(record.witness),
  });
}

interface PlannedProductCommitInput<Plan extends ReceiptAuthorityPlan> {
  readonly expectedRevision: number;
  readonly fence: ReturnType<typeof tabLeaseFence>;
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly now: number;
  readonly receiptKind: string;
  readonly plan: Plan;
  readonly derive: (draft: SaveStateV2, extensions: V5Extensions) => unknown;
  readonly prepareSave?: (writable: V5WritableState) => PreparedV5SaveWrite;
  readonly verifyPrepared?: (saved: PreparedV5SaveWrite) => void;
}

/** One shared assembly path for random and deterministic products. Keeping
 * the persistence choreography here prevents the two owners from drifting:
 * detached input, checked product namespaces, final protected F4 authority,
 * one complete save preparation, then one receipt-bearing repository CAS. */
async function commitPlannedProduct<Plan extends ReceiptAuthorityPlan>(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
  input: PlannedProductCommitInput<Plan>,
): Promise<PlannedProductTransactionOutcome<Plan>> {
  let draft: SaveStateV2;
  let extensions: V5Extensions;
  try {
    draft = detachedState(input.writable.state);
    extensions = detachedCanonicalExtensions(input.writable.extensions);
  } catch (error) {
    return { kind: 'rejected', stage: 'draft', message: messageOf(error), plan: input.plan };
  }

  let derivation: CheckedDerivationEnvelope;
  try {
    derivation = checkedDerivation(input.derive(draft, extensions));
  } catch (error) {
    return { kind: 'rejected', stage: 'derive', message: messageOf(error), plan: input.plan };
  }

  let productExtensions: V5Extensions;
  try {
    const applied = applyV5ExtensionWrites(extensions, derivation.extensionWrites === undefined
      ? Object.freeze([]) as readonly V5ExtensionWrite[]
      : derivation.extensionWrites);
    if (applied.writes.some(({ segment, namespace }) => (
      segment === 'player' && namespace === F4_AUTHORITY_NAMESPACE
    ))) throw new Error('product extension writes cannot overwrite player/f4.authority');
    productExtensions = applied.extensions;
  } catch (error) {
    return {
      kind: 'rejected', stage: 'extension-writes', message: messageOf(error), plan: input.plan,
    };
  }

  let update: ReturnType<typeof prepareF4AuthorityUpdate>;
  try {
    /* Product namespaces land first. The sole F4 owner replaces its protected
       namespace last, so product policy cannot shadow it. */
    update = prepareF4AuthorityUpdate(
      productExtensions,
      input.snapshot,
      input.plan.nextSessionRng,
    );
  } catch (error) {
    return {
      kind: 'rejected', stage: 'authority-update', message: messageOf(error), plan: input.plan,
    };
  }

  let saved: PreparedV5SaveWrite;
  try {
    /* The only complete save preparation in this transaction, after both
       product and F4 authority are final. */
    const writable = { state: derivation.state, extensions: update.extensions };
    saved = input.prepareSave === undefined
      ? prepareV5SaveWrite(writable, registry, input.now)
      : input.prepareSave(writable);
    input.verifyPrepared?.(saved);
  } catch (error) {
    return {
      kind: 'rejected', stage: 'product-prepare', message: messageOf(error), plan: input.plan,
    };
  }

  const receipt: MutationReceipt = Object.freeze({
    ordinal: input.plan.receiptOrdinal,
    kind: checkedReceiptKind(input.receiptKind),
    witness: derivation.witness,
  });
  try {
    const outcome = await repository.mutate({
      expectedRevision: input.expectedRevision,
      fences: [input.fence],
      writes: saved.operations,
      receipt,
    });
    switch (outcome.kind) {
      case 'committed':
        return {
          kind: 'committed',
          revision: outcome.revision,
          plan: input.plan,
          receipt,
          authority: update.authority,
          saved,
        };
      case 'stale':
        return { ...outcome, plan: input.plan };
      case 'revision-exhausted':
        return { ...outcome, plan: input.plan };
      case 'duplicate-receipt':
        return { ...outcome, plan: input.plan };
      case 'fence-lost':
        return { kind: 'lost', reason: 'lease-lost', plan: input.plan };
      case 'conflict':
        return { kind: 'lost', reason: 'conflict', plan: input.plan };
    }
  } catch (error) {
    return { kind: 'storage-error', message: messageOf(error), plan: input.plan };
  }
}

/** Create the sole F4 outcome writer. The callback is never invoked until the
 * lease grant and receipt kind are validated and current F4 authority has
 * produced one immutable plan. The repository call is attempted once. */
export function createF4OutcomeTransactionOwner(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): F4OutcomeTransactionOwner {
  return Object.freeze({
    async commit(input: F4OutcomeTransactionInput): Promise<F4OutcomeTransactionOutcome> {
      const receiptKind = checkedReceiptKind(input.receiptKind);
      const fence = tabLeaseFence(input.grant);
      const planned = planF4OutcomeDraw(input.writable.extensions, input.domain);
      if (planned.kind !== 'planned') return planned;
      const { plan } = planned;
      return commitPlannedProduct(repository, registry, {
        expectedRevision: input.expectedRevision,
        fence,
        writable: input.writable,
        snapshot: input.snapshot,
        now: input.now,
        receiptKind,
        plan,
        derive: (draft, extensions) => input.derive(Object.freeze({
          domain: plan.domain,
          value: plan.value,
          receiptOrdinal: plan.receiptOrdinal,
          draft,
          extensions,
        })),
      });
    },
  });
}

/** One receipt-bearing F3/F4 owner for a bounded ordered group of SessionRNG
 * domains. Product state, all counters, active play and the receipt cross one
 * CAS or remain wholly unpublished. */
export function createF4MultiOutcomeTransactionOwner(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): F4MultiOutcomeTransactionOwner {
  return Object.freeze({
    async commit(input: F4MultiOutcomeTransactionInput): Promise<F4MultiOutcomeTransactionOutcome> {
      const callerWritable = input.writable;
      const state = callerWritable.state;
      const extensions = callerWritable.extensions;
      const planned = planF4MultiOutcomeDraws(extensions, input.domains);
      if (planned.kind !== 'planned') return planned;
      const receiptKind = checkedReceiptKind(input.receiptKind);
      const fence = tabLeaseFence(input.grant);
      const snapshot = capturedActivePlaySnapshot(input.snapshot);
      const { plan } = planned;
      return commitPlannedProduct(repository, registry, {
        expectedRevision: input.expectedRevision,
        fence,
        writable: { state, extensions },
        snapshot,
        now: input.now,
        receiptKind,
        plan,
        derive: (draft, extensions) => input.derive(Object.freeze({
          draws: plan.draws,
          receiptOrdinal: plan.receiptOrdinal,
          activePlayMs: snapshot.activePlayMs,
          draft,
          extensions,
        })),
      });
    },
  });
}

function capturedPreDrawRefusal<Reason extends string>(
  value: unknown,
): F4MultiOutcomePreDrawRefusal<Reason> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 2 || !keys.includes('kind') || !keys.includes('reason')) return null;
  const kind = Object.getOwnPropertyDescriptor(value, 'kind');
  const reason = Object.getOwnPropertyDescriptor(value, 'reason');
  if (!kind || !reason || !('value' in kind) || !('value' in reason)
    || kind.value !== 'refused' || typeof reason.value !== 'string'
    || reason.value.length < 1 || reason.value.length > 160
    || /[\u0000-\u001f\u007f]/u.test(reason.value)) return null;
  return Object.freeze({ kind: 'refused', reason: reason.value as Reason });
}

const PRE_DRAW_TRANSACTION_FIELDS = Object.freeze([
  'expectedRevision', 'grant', 'writable', 'snapshot', 'domains',
  'receiptKind', 'now', 'preDraw',
] as const);

function capturedOwnDataField(value: object, key: string, label: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
    throw new TypeError(`${label} must contain enumerable own data fields`);
  }
  return descriptor.value;
}

function capturedPreDrawTransactionInput<Proof, Reason extends string>(
  value: F4MultiOutcomePreDrawTransactionInput<Proof, Reason>,
): F4MultiOutcomePreDrawTransactionInput<Proof, Reason> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('pre-draw transaction input must be an object');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('pre-draw transaction input must use a plain prototype');
  }
  const keys = Reflect.ownKeys(value);
  const names = keys.filter((key): key is string => typeof key === 'string').sort();
  const expected = [...PRE_DRAW_TRANSACTION_FIELDS].sort();
  if (names.length !== keys.length || names.length !== expected.length
    || names.some((key, index) => key !== expected[index])) {
    throw new TypeError('pre-draw transaction input has unknown or missing fields');
  }
  const captured = Object.fromEntries(PRE_DRAW_TRANSACTION_FIELDS.map((key) => [
    key,
    capturedOwnDataField(value, key, 'pre-draw transaction input'),
  ])) as unknown as F4MultiOutcomePreDrawTransactionInput<Proof, Reason>;
  const writable = captured.writable;
  if (!writable || typeof writable !== 'object' || Array.isArray(writable)) {
    throw new TypeError('pre-draw writable must be an object');
  }
  const writablePrototype = Object.getPrototypeOf(writable);
  if (writablePrototype !== Object.prototype && writablePrototype !== null
    || Reflect.ownKeys(writable).length !== 2) {
    throw new TypeError('pre-draw writable must contain only state and extensions');
  }
  const state = capturedOwnDataField(writable, 'state', 'pre-draw writable') as SaveStateV2;
  const extensions = capturedOwnDataField(writable, 'extensions', 'pre-draw writable') as V5Extensions;
  return Object.freeze({ ...captured, writable: Object.freeze({ state, extensions }) });
}

function capturedPreDrawDomains(value: unknown): readonly string[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError('pre-draw domains must be a native array');
  }
  const keys = Reflect.ownKeys(value);
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
    || length.value < 1 || length.value > MAX_SESSION_RNG_DRAWS_PER_PLAN
    || keys.length !== length.value + 1) {
    throw new RangeError(
      `SessionRNG draw plan must contain 1–${MAX_SESSION_RNG_DRAWS_PER_PLAN} domains`,
    );
  }
  const domains: string[] = [];
  for (let index = 0; index < length.value; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw new TypeError('pre-draw domains must be a dense own-data array');
    }
    domains.push(descriptor.value as string);
  }
  return Object.freeze(domains);
}

/** Create the callback-ordered multi-outcome owner. It detaches and projects
 * current authority first, lets product policy certify every possible result
 * without values, and materializes SessionRNG only after the callback returns
 * the exact ready object minted by its one-call authorizer. */
export function createF4MultiOutcomePreDrawTransactionOwner(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): F4MultiOutcomePreDrawTransactionOwner {
  /* This owner never observes later registry mutation. Every capacity pass
     and its final write share this one detached compatibility-codec input. */
  const codecRegistry = detachedContentRegistry(registry);
  return Object.freeze({
    async commit<Proof, Reason extends string>(
      input: F4MultiOutcomePreDrawTransactionInput<Proof, Reason>,
    ): Promise<F4MultiOutcomePreDrawTransactionOutcome<Reason>> {
      let captured: F4MultiOutcomePreDrawTransactionInput<Proof, Reason>;
      try { captured = capturedPreDrawTransactionInput(input); } catch (error) {
        return { kind: 'rejected', stage: 'pre-draw', message: messageOf(error) };
      }
      const callerWritable = captured.writable;
      const callerState = callerWritable.state;
      const callerExtensions = callerWritable.extensions;
      const expectedRevision = captured.expectedRevision;
      let receiptKind: string;
      let fence: ReturnType<typeof tabLeaseFence>;
      let snapshot: Readonly<Pick<ActivePlaySnapshot, 'activePlayMs'>>;
      try {
        receiptKind = checkedReceiptKind(captured.receiptKind);
        fence = tabLeaseFence(captured.grant);
        snapshot = capturedActivePlaySnapshot(captured.snapshot);
      } catch (error) {
        return { kind: 'rejected', stage: 'pre-draw', message: messageOf(error) };
      }
      let now: number;
      try { now = checkedCodecNow(captured.now); } catch (error) {
        return { kind: 'rejected', stage: 'pre-draw', message: messageOf(error) };
      }
      const preDraw = captured.preDraw;
      let domains: readonly string[];
      try { domains = capturedPreDrawDomains(captured.domains); } catch (error) {
        return { kind: 'rejected', stage: 'pre-draw', message: messageOf(error) };
      }

      let detachedDraft: SaveStateV2;
      let detachedExtensions: V5Extensions;
      try {
        detachedDraft = detachedState(callerState);
        deepFreezePlain(detachedDraft);
        detachedExtensions = detachedCanonicalExtensions(callerExtensions);
      } catch (error) {
        return { kind: 'rejected', stage: 'pre-draw', message: messageOf(error) };
      }
      let projected: F4MultiOutcomeDrawAdvancePlanOutcome;
      try { projected = projectF4MultiOutcomeDrawAdvance(detachedExtensions, domains); } catch (error) {
        return { kind: 'rejected', stage: 'pre-draw', message: messageOf(error) };
      }
      if (projected.kind !== 'projected') return projected;
      const projection = projected.plan;

      const preDrawPreparedByCodec = new WeakSet<object>();
      let preDrawPreparationOpen = true;
      const codec: F4MultiOutcomePreDrawSaveCodec = Object.freeze({
        now,
        receiptKind,
        prepare(writable: V5WritableState): PreparedV5SaveWrite {
          const prepared = prepareV5SaveWrite(writable, codecRegistry, now);
          if (preDrawPreparationOpen) preDrawPreparedByCodec.add(prepared);
          return prepared;
        },
        importLegacy(raw: string): ImportSaveResult {
          return importSaveV2(raw, codecRegistry, now);
        },
        exportLegacy(state: SaveStateV2): string {
          return exportSaveV2(state, now);
        },
      });

      let mintedReady: F4MultiOutcomePreDrawReady<Proof> | null = null;
      let capturedSettlement: F4MultiOutcomePreDrawSettlement<Proof> | null = null;
      const authorizer: F4MultiOutcomePreDrawAuthorizer<Proof> = Object.freeze({
        ready(
          proof: Proof,
          settle: F4MultiOutcomePreDrawSettlement<Proof>,
        ): F4MultiOutcomePreDrawReady<Proof> {
          if (mintedReady !== null) throw new TypeError('pre-draw ready proof may be minted only once');
          if (typeof settle !== 'function') {
            throw new TypeError('pre-draw ready proof requires one settlement callback');
          }
          const row = Object.freeze({ kind: 'ready' as const, proof });
          capturedSettlement = settle;
          mintedReady = row;
          return row;
        },
      });
      let decision: F4MultiOutcomePreDrawReady<Proof> | F4MultiOutcomePreDrawRefusal<Reason>;
      try {
        decision = preDraw(Object.freeze({
          domains: projection.domains,
          counters: projection.counters,
          receiptOrdinal: projection.receiptOrdinal,
          activePlayMs: snapshot.activePlayMs,
          currentAuthority: projection.currentAuthority,
          nextSessionRng: projection.nextSessionRng,
          codec,
          draft: detachedDraft,
          extensions: detachedExtensions,
        }), authorizer);
      } catch (error) {
        preDrawPreparationOpen = false;
        return { kind: 'rejected', stage: 'pre-draw', message: messageOf(error) };
      }
      preDrawPreparationOpen = false;
      if (!decision || typeof decision !== 'object' || decision !== mintedReady) {
        let refused: F4MultiOutcomePreDrawRefusal<Reason> | null;
        try {
          refused = capturedPreDrawRefusal<Reason>(decision);
        } catch (error) {
          return { kind: 'rejected', stage: 'pre-draw', message: messageOf(error) };
        }
        if (refused !== null) {
          return Object.freeze({ kind: 'pre-draw-refused', reason: refused.reason });
        }
        return {
          kind: 'rejected', stage: 'pre-draw',
          message: 'pre-draw callback must return its branded ready proof or an exact refusal',
        };
      }
      const ready = decision as F4MultiOutcomePreDrawReady<Proof>;
      const settle = capturedSettlement as unknown as F4MultiOutcomePreDrawSettlement<Proof> | null;
      if (settle === null) {
        return {
          kind: 'rejected', stage: 'pre-draw',
          message: 'pre-draw ready proof did not bind a settlement callback',
        };
      }
      const plan = materializeF4MultiOutcomeDrawPlan(projection);
      let expectedPreparedFingerprint: string | null = null;
      return commitPlannedProduct(repository, codecRegistry, {
        expectedRevision,
        fence,
        /* Reuse the exact detached pre-draw snapshots. A mutable caller cannot
           swap data after certification but before value materialization. */
        writable: { state: detachedDraft, extensions: detachedExtensions },
        snapshot,
        now,
        receiptKind,
        plan,
        prepareSave: codec.prepare,
        verifyPrepared(saved): void {
          if (expectedPreparedFingerprint === null
            || preparedSaveFingerprint(saved) !== expectedPreparedFingerprint) {
            throw new Error('pre-draw settlement does not authorize the exact prepared save');
          }
        },
        derive: (draft, extensions) => {
          let mintedSettlement: F4MultiOutcomePreDrawAuthorizedSettlement | null = null;
          const settlementAuthorizer: F4MultiOutcomePreDrawSettlementAuthorizer = Object.freeze({
            authorize(
              derivation: F4OutcomeDerivation,
              prepared: PreparedV5SaveWrite,
            ): F4MultiOutcomePreDrawAuthorizedSettlement {
              if (mintedSettlement !== null) {
                throw new TypeError('pre-draw settlement may be authorized only once');
              }
              if (!prepared || typeof prepared !== 'object'
                || !preDrawPreparedByCodec.has(prepared)) {
                throw new TypeError(
                  'pre-draw settlement save was not prepared before values by this commit codec',
                );
              }
              const detachedDerivation = clonePlainData(
                derivation,
                new Set<object>(),
                { nodes: 0 },
                0,
              );
              const checked = checkedDerivation(detachedDerivation);
              deepFreezePlain(checked.state);
              if (checked.extensionWrites !== undefined) deepFreezePlain(checked.extensionWrites);
              expectedPreparedFingerprint = preparedSaveFingerprint(prepared);
              const row = Object.freeze({
                kind: 'authorized-settlement' as const,
                derivation: checked as F4OutcomeDerivation,
                prepared,
              });
              mintedSettlement = row;
              return row;
            },
          });
          PRE_DRAW_SETTLEMENT_AUTHORIZER_CODECS.set(settlementAuthorizer, codec);
          const settled = settle(Object.freeze({
            draws: plan.draws,
            receiptOrdinal: plan.receiptOrdinal,
            activePlayMs: snapshot.activePlayMs,
            currentAuthority: plan.currentAuthority,
            nextSessionRng: plan.nextSessionRng,
            codec,
            plan,
            proof: ready.proof,
            draft,
            extensions,
          }), settlementAuthorizer);
          const authorized = mintedSettlement as unknown as
            F4MultiOutcomePreDrawAuthorizedSettlement | null;
          if (settled !== authorized || authorized === null) {
            throw new TypeError('pre-draw settlement must return its per-commit authorization');
          }
          return authorized.derivation;
        },
      });
    },
  });
}

const UINT32_MAX = 0xFFFF_FFFF;

/** Generic deterministic product action. It reserves one exact-once receipt
 * ordinal but leaves the seed and every per-domain random draw counter
 * byte-identical. Arc-specific wrappers may narrow `operation` and select a
 * fixed receipt kind without teaching the F4 owner their product vocabulary. */
export interface F4DeterministicProductPlan {
  readonly operation: string;
  readonly receiptOrdinal: number;
  readonly currentAuthority: F4AuthorityV1;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
}

export type F4DeterministicProductPlanOutcome =
  | F4OutcomeAuthorityProtection
  | { readonly kind: 'protected'; readonly reason: 'receipt-ordinal-exhausted' }
  | { readonly kind: 'planned'; readonly plan: F4DeterministicProductPlan };

export interface F4DeterministicProductDeriveInput {
  readonly operation: string;
  readonly receiptOrdinal: number;
  /** Exact leased active-play snapshot committed by this same transaction. */
  readonly activePlayMs: number;
  readonly draft: SaveStateV2;
  readonly extensions: V5Extensions;
}

export interface F4DeterministicProductTransactionInput {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly operation: string;
  readonly receiptKind: string;
  readonly now: number;
  readonly derive: (input: F4DeterministicProductDeriveInput) => F4OutcomeDerivation;
}

export type F4DeterministicProductTransactionOutcome =
  | Exclude<F4DeterministicProductPlanOutcome, { readonly kind: 'planned' }>
  | PlannedProductTransactionOutcome<F4DeterministicProductPlan>;

export interface F4DeterministicProductTransactionOwner {
  commit(input: F4DeterministicProductTransactionInput): Promise<F4DeterministicProductTransactionOutcome>;
}

function checkedDeterministicOperation(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 96
    || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RangeError('deterministic product operation must be 1–96 printable characters');
  }
  return value;
}

/** Plan a deterministic product receipt from persisted F4 authority. This is
 * intentionally separate from `planF4OutcomeDraw`: no random domain is
 * evaluated and only the save-lifetime ordinal advances. */
export function planF4DeterministicProductReceipt(
  extensions: V5Extensions,
  operation: string,
): F4DeterministicProductPlanOutcome {
  const checkedOperation = checkedDeterministicOperation(operation);
  const current = readF4Authority(extensions);
  if (current.kind === 'absent') return { kind: 'protected', reason: 'authority-absent' };
  if (current.kind === 'corrupt') return { kind: 'protected', reason: 'authority-corrupt' };
  if (current.kind === 'future-version') {
    return { kind: 'protected', reason: 'authority-future', version: current.version };
  }
  const receiptOrdinal = current.authority.sessionRng.ordinal;
  if (receiptOrdinal >= UINT32_MAX) {
    return { kind: 'protected', reason: 'receipt-ordinal-exhausted' };
  }
  return Object.freeze({
    kind: 'planned',
    plan: Object.freeze({
      operation: checkedOperation,
      receiptOrdinal,
      currentAuthority: current.authority,
      nextSessionRng: frozenSessionRng({
        seed: current.authority.sessionRng.seed,
        draws: { ...current.authority.sessionRng.draws },
        ordinal: receiptOrdinal + 1,
      }),
    }),
  });
}

/** Create the arc-neutral deterministic action owner. Product state,
 * namespaced extensions, active-play authority, receipt, lease fence and next
 * revision still share the same single repository CAS as random outcomes. */
export function createF4DeterministicProductTransactionOwner(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): F4DeterministicProductTransactionOwner {
  return Object.freeze({
    async commit(
      input: F4DeterministicProductTransactionInput,
    ): Promise<F4DeterministicProductTransactionOutcome> {
      const operation = checkedDeterministicOperation(input.operation);
      const receiptKind = checkedReceiptKind(input.receiptKind);
      const fence = tabLeaseFence(input.grant);
      const planned = planF4DeterministicProductReceipt(input.writable.extensions, operation);
      if (planned.kind !== 'planned') return planned;
      const { plan } = planned;
      return commitPlannedProduct(repository, registry, {
        expectedRevision: input.expectedRevision,
        fence,
        writable: input.writable,
        snapshot: input.snapshot,
        now: input.now,
        receiptKind,
        plan,
        derive: (draft, extensions) => input.derive(Object.freeze({
          operation,
          receiptOrdinal: plan.receiptOrdinal,
          activePlayMs: input.snapshot.activePlayMs,
          draft,
          extensions,
        })),
      });
    },
  });
}

/** Arc 2 operations whose result is fully determined by the observed product
 * state. They still need an immutable exact-once receipt, but must not draw a
 * random value or advance any per-domain SessionRNG counter. */
export const F4_NO_RNG_PRODUCT_OPERATIONS = Object.freeze([
  'equip', 'unequip', 'salvage', 'pending-claim',
] as const);
export type F4NoRngProductOperation = typeof F4_NO_RNG_PRODUCT_OPERATIONS[number];

const NO_RNG_RECEIPT_KIND: Readonly<Record<F4NoRngProductOperation, string>> = Object.freeze({
  equip: 'arc2-equip',
  unequip: 'arc2-unequip',
  salvage: 'arc2-salvage',
  'pending-claim': 'arc2-pending-claim',
});

export interface F4NoRngProductPlan {
  readonly operation: F4NoRngProductOperation;
  readonly receiptOrdinal: number;
  readonly currentAuthority: F4AuthorityV1;
  /** Same seed and per-domain counters; only the shared exact-once receipt
   * ordinal advances. No SessionRNG value is generated. */
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
}

export type F4NoRngProductPlanOutcome =
  | F4OutcomeAuthorityProtection
  | { readonly kind: 'protected'; readonly reason: 'receipt-ordinal-exhausted' }
  | { readonly kind: 'planned'; readonly plan: F4NoRngProductPlan };

export interface F4NoRngProductDeriveInput {
  readonly operation: F4NoRngProductOperation;
  readonly receiptOrdinal: number;
  readonly draft: SaveStateV2;
  readonly extensions: V5Extensions;
}

export interface F4NoRngProductTransactionInput {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly operation: F4NoRngProductOperation;
  readonly now: number;
  readonly derive: (input: F4NoRngProductDeriveInput) => F4OutcomeDerivation;
}

export type F4NoRngProductTransactionOutcome =
  | Exclude<F4NoRngProductPlanOutcome, { readonly kind: 'planned' }>
  | PlannedProductTransactionOutcome<F4NoRngProductPlan>;

export interface F4NoRngProductTransactionOwner {
  commit(input: F4NoRngProductTransactionInput): Promise<F4NoRngProductTransactionOutcome>;
}

function checkedNoRngOperation(value: unknown): F4NoRngProductOperation {
  if (typeof value !== 'string'
    || !(F4_NO_RNG_PRODUCT_OPERATIONS as readonly string[]).includes(value)) {
    throw new RangeError(`unknown no-RNG product operation ${JSON.stringify(value)}`);
  }
  return value as F4NoRngProductOperation;
}

/** Reserve the next globally unique receipt identity without evaluating a
 * random domain. Receipt uniqueness and random-draw consumption are separate:
 * this increments only the save-lifetime ordinal and leaves every draw
 * counter untouched. */
export function planF4NoRngProductReceipt(
  extensions: V5Extensions,
  operation: F4NoRngProductOperation,
): F4NoRngProductPlanOutcome {
  const checkedOperation = checkedNoRngOperation(operation);
  const current = readF4Authority(extensions);
  if (current.kind === 'absent') return { kind: 'protected', reason: 'authority-absent' };
  if (current.kind === 'corrupt') return { kind: 'protected', reason: 'authority-corrupt' };
  if (current.kind === 'future-version') {
    return { kind: 'protected', reason: 'authority-future', version: current.version };
  }
  const receiptOrdinal = current.authority.sessionRng.ordinal;
  if (receiptOrdinal >= UINT32_MAX) {
    return { kind: 'protected', reason: 'receipt-ordinal-exhausted' };
  }
  return Object.freeze({
    kind: 'planned',
    plan: Object.freeze({
      operation: checkedOperation,
      receiptOrdinal,
      currentAuthority: current.authority,
      nextSessionRng: frozenSessionRng({
        seed: current.authority.sessionRng.seed,
        draws: { ...current.authority.sessionRng.draws },
        ordinal: receiptOrdinal + 1,
      }),
    }),
  });
}

/** Create the deterministic Arc 2 action owner. Equip, unequip, salvage and
 * pending-claim use the same revision/lease/receipt atomic boundary as random
 * outcomes, but reserve only a receipt ordinal and never ask SessionRNG for a
 * value. The repository is attempted once and never internally retried. */
export function createF4NoRngProductTransactionOwner(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): F4NoRngProductTransactionOwner {
  return Object.freeze({
    async commit(input: F4NoRngProductTransactionInput): Promise<F4NoRngProductTransactionOutcome> {
      const operation = checkedNoRngOperation(input.operation);
      const fence = tabLeaseFence(input.grant);
      const planned = planF4NoRngProductReceipt(input.writable.extensions, operation);
      if (planned.kind !== 'planned') return planned;
      const { plan } = planned;
      return commitPlannedProduct(repository, registry, {
        expectedRevision: input.expectedRevision,
        fence,
        writable: input.writable,
        snapshot: input.snapshot,
        now: input.now,
        receiptKind: NO_RNG_RECEIPT_KIND[operation],
        plan,
        derive: (draft, extensions) => input.derive(Object.freeze({
          operation,
          receiptOrdinal: plan.receiptOrdinal,
          draft,
          extensions,
        })),
      });
    },
  });
}
