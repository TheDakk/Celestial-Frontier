/* Arc 4 app-owned capture transaction and publication boundary.

   The writer composes the live acquisition snapshot from the pre-draw
   owner's exact detached extensions, certifies every possible outcome before
   SessionRNG values exist, and returns the one certified authorization to the
   owner verbatim. It publishes nothing. Postcommit verification separately
   proves the aligned Arc 4 + Arc 5 ownership result from durable/runtime
   authority; any mismatch requires read-only convergence, never another
   capture attempt. */
import {
  ACTIVE_PLAY_CAPTURE_CYCLE_MS,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  capturePresentationFenceV1,
  isCaptureAttemptPlanV1,
  isCapturePreflightReadyV1,
  isOwnershipStateV2,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  preflightCaptureV1,
  sha256Hex,
  type AcquisitionVerbV1,
  type CanonicalJson,
  type CapturePreflightReadyV1,
  type CapturePreflightRefusalReasonV1,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { MAX_ACTIVE_PLAY_MS } from '@cf/domain-progression';
import {
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  arc4OwnershipLegacyMirrorMatches,
  exportSaveV2,
  importSaveV2,
  prepareArc4OwnershipLegacyMigration,
  projectLegacyOwnershipMirror,
  readArc4Ownership,
  readArc5OwnershipMigration,
  readF4Authority,
  type ContentRegistry,
  type Arc5OwnershipMigrationEvidenceV2,
  type ProjectedLegacyOwnershipMirrorV1,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import {
  composeAcquisitionSnapshotV1,
  type AcquisitionSnapshotProtectionReason,
} from './acquisition-snapshot.js';
import {
  ARC4_CAPTURE_DOMAINS,
  ARC4_CAPTURE_RECEIPT_KIND,
  ARC4_FIRST_SPECIES_STARDUST_TIER_MIN,
  certifyArc4CaptureCapacityV1,
  isArc4CaptureDerivedSettlementV1,
  settleCertifiedArc4CaptureV1,
  stageArc4LegacyMirrorFixedPointV1,
  type Arc4CaptureCapacityCertificateV1,
  type Arc4CaptureCapacityRefusalReason,
  type Arc4CaptureSettlementOutcome,
} from './arc4-capture-capacity.js';
import type {
  F4RuntimeAuthority,
  F4RuntimePreDrawMultiOutcomeCommitOutcome,
} from './f4-runtime-authority.js';
import {
  isCanonicalWorldRoster,
  type CanonicalWorldRoster,
} from './world-roster.js';

export type Arc4CapturePreDrawRefusalReasonV1 =
  | `snapshot:${AcquisitionSnapshotProtectionReason}`
  | 'presentation:changed'
  | `preflight:${CapturePreflightRefusalReasonV1}`
  | `capacity:${Arc4CaptureCapacityRefusalReason}`;

export type Arc4CaptureTransactionOutcomeV1 =
  F4RuntimePreDrawMultiOutcomeCommitOutcome<Arc4CapturePreDrawRefusalReasonV1>;
export type Arc4CaptureCommittedTransactionV1 = Extract<
  Arc4CaptureTransactionOutcomeV1,
  { readonly kind: 'committed' }
>;
export type Arc4CaptureDerivedSettlementV1 = Extract<
  Arc4CaptureSettlementOutcome,
  { readonly kind: 'derived' }
>;

export interface Arc4CaptureCommitEvidenceV1 {
  readonly schema: 'cf-v2-arc4-capture-commit-evidence/v1';
}

interface Arc4CapturePendingEvidencePayloadV1 {
  readonly transactionPlan: Arc4CaptureCommittedTransactionV1['plan'];
  readonly transactionPlanFingerprint: string;
  readonly preflight: CapturePreflightReadyV1;
  readonly capturePlan: Arc4CaptureDerivedSettlementV1['plan'];
  readonly settlement: Arc4CaptureDerivedSettlementV1;
  readonly sourceDraft: SaveStateV2;
  readonly sourceDraftFingerprint: string;
  readonly preparedFingerprint: string;
}

interface Arc4CaptureCommitEvidencePayloadV1
  extends Arc4CapturePendingEvidencePayloadV1 {
  readonly transaction: Arc4CaptureCommittedTransactionV1;
  readonly transactionKind: 'committed';
  readonly transactionRevision: number;
}

const ARC4_CAPTURE_COMMIT_EVIDENCE = new WeakMap<
  object,
  Arc4CaptureCommitEvidencePayloadV1
>();

function jsonFingerprint(value: unknown, message: string): string {
  const raw = JSON.stringify(value);
  if (raw === undefined) throw new TypeError(message);
  return raw;
}

function preparedSaveFingerprint(
  value: Arc4CaptureDerivedSettlementV1['prepared'],
): string {
  return jsonFingerprint({
    canonicalState: value.canonicalState,
    extensions: value.extensions,
    legacyV4Raw: value.legacyV4Raw,
    operations: value.operations,
  }, 'Arc 4 capture prepared save must be JSON data');
}

export interface Arc4CaptureAttemptInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitOutcomesPreDraw'>;
  /** Exact registered Arc 5 parent retained by the app after boot/commit. */
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly nav: unknown;
  readonly address: unknown;
  readonly roster: CanonicalWorldRoster;
  readonly presentationFence: string;
  readonly verb: AcquisitionVerbV1;
  readonly codecNow: number;
}

interface CapturedArc4CaptureAttemptInputV1 {
  readonly commit: F4RuntimeAuthority['commitOutcomesPreDraw'];
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly nav: unknown;
  readonly address: unknown;
  readonly roster: CanonicalWorldRoster;
  readonly presentationFence: string;
  readonly verb: AcquisitionVerbV1;
  readonly codecNow: number;
}

const CAPTURE_ATTEMPT_INPUT_FIELDS = Object.freeze([
  'runtime', 'ownershipV2', 'state', 'nav', 'address', 'roster',
  'presentationFence', 'verb', 'codecNow',
] as const);
const CAPTURE_STATE_CLONE_LIMIT = 1_500_000;

interface CaptureCloneBudget { count: number; }

function cloneCapturePlainData(
  value: unknown,
  ancestors: Set<object>,
  budget: CaptureCloneBudget,
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('capture state must contain only plain data');
  if (depth > 256 || budget.count >= CAPTURE_STATE_CLONE_LIMIT) {
    throw new RangeError('capture state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('capture state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('capture arrays must use the native prototype');
      const keys = Reflect.ownKeys(value);
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('capture arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('capture arrays cannot contain accessors or holes');
        }
        clone.push(cloneCapturePlainData(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('capture state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('capture state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('capture state cannot contain accessors or hidden fields');
      }
      Object.defineProperty(clone, key, {
        value: cloneCapturePlainData(descriptor.value, ancestors, budget, depth + 1),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
}

function captureAttemptInput(
  input: Arc4CaptureAttemptInputV1,
): CapturedArc4CaptureAttemptInputV1 | null {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(input);
    const names = keys.filter((key): key is string => typeof key === 'string').sort();
    const expected = [...CAPTURE_ATTEMPT_INPUT_FIELDS].sort();
    if (keys.length !== expected.length
      || names.some((key, index) => key !== expected[index])) return null;
    const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const key of CAPTURE_ATTEMPT_INPUT_FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(input, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      fields[key] = descriptor.value;
    }
    const runtime = fields.runtime;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)) return null;
    const commitDescriptor = Object.getOwnPropertyDescriptor(runtime, 'commitOutcomesPreDraw');
    if (!commitDescriptor || !('value' in commitDescriptor)
      || typeof commitDescriptor.value !== 'function') return null;
    if (!isCanonicalWorldRoster(fields.roster)) return null;
    if (!isOwnershipStateV2(fields.ownershipV2)
      || fields.ownershipV2.mode !== 'current') return null;
    if (typeof fields.presentationFence !== 'string'
      || !/^cpf1:[0-9a-f]{64}$/u.test(fields.presentationFence)) return null;
    return Object.freeze({
      commit: commitDescriptor.value.bind(runtime) as F4RuntimeAuthority['commitOutcomesPreDraw'],
      ownershipV2: fields.ownershipV2,
      state: cloneCapturePlainData(
        fields.state,
        new Set<object>(),
        { count: 0 },
        0,
      ) as SaveStateV2,
      nav: fields.nav,
      address: fields.address,
      roster: fields.roster,
      presentationFence: fields.presentationFence,
      verb: fields.verb as AcquisitionVerbV1,
      codecNow: fields.codecNow as number,
    });
  } catch {
    return null;
  }
}

export type Arc4CaptureAttemptOutcomeV1 =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Arc4CaptureCommittedTransactionV1;
    settlement: Arc4CaptureDerivedSettlementV1;
    preflight: CapturePreflightReadyV1;
    sourceDraft: SaveStateV2;
    evidence: Arc4CaptureCommitEvidenceV1;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-settlement-evidence-missing';
    transaction: Arc4CaptureCommittedTransactionV1;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: string;
    transaction: Exclude<Arc4CaptureTransactionOutcomeV1, { readonly kind: 'committed' }> | null;
  }>;

/** Stage the production roster's exact ecology epoch on a new outer object.
 * No field on the caller's live save is mutated. */
export function prepareArc4CaptureDraftV1(
  state: SaveStateV2,
  roster: CanonicalWorldRoster,
): SaveStateV2 {
  if (!isCanonicalWorldRoster(roster)) {
    throw new TypeError('Arc 4 capture requires the registered production full roster');
  }
  return { ...state, EPOCH_BASE: roster.ecologyEpoch };
}

function requiresReadOnlyConvergence(
  outcome: Exclude<Arc4CaptureTransactionOutcomeV1, { readonly kind: 'committed' }>,
): boolean {
  return outcome.kind === 'stale'
    || outcome.kind === 'duplicate-receipt'
    || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable'
    || outcome.kind === 'protected';
}

function transactionDetail(
  outcome: Exclude<Arc4CaptureTransactionOutcomeV1, { readonly kind: 'committed' }>,
): string {
  if (outcome.kind === 'pre-draw-refused') return outcome.reason;
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') return outcome.message;
  if (outcome.kind === 'protected') return `protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `lost:${outcome.reason}`;
  return outcome.kind;
}

/** Execute exactly one capture attempt through the capacity-sensitive F4
 * owner. Snapshot composition and semantic preflight occur inside the
 * owner's value-free callback against that callback's detached extensions. */
export async function commitArc4CaptureAttemptV1(
  input: Arc4CaptureAttemptInputV1,
): Promise<Arc4CaptureAttemptOutcomeV1> {
  const captured = captureAttemptInput(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused',
      durability: 'none',
      convergence: 'none',
      detail: 'input:invalid-or-unregistered',
      transaction: null,
    });
  }
  const sourceDraft = prepareArc4CaptureDraftV1(captured.state, captured.roster);
  let selected: Readonly<{
    preflight: CapturePreflightReadyV1;
    settlement: Arc4CaptureDerivedSettlementV1;
    sourceDraft: SaveStateV2;
    evidencePayload: Arc4CapturePendingEvidencePayloadV1;
  }> | null = null;
  let settlementRefusal: string | null = null;
  const transaction = await captured.commit<
    Arc4CaptureCapacityCertificateV1,
    Arc4CapturePreDrawRefusalReasonV1
  >({
    state: sourceDraft,
    domains: ARC4_CAPTURE_DOMAINS,
    receiptKind: ARC4_CAPTURE_RECEIPT_KIND,
    codecNow: captured.codecNow,
    preDraw: (preDraw, owner) => {
      const composed = composeAcquisitionSnapshotV1({
        nav: captured.nav,
        address: captured.address,
        roster: captured.roster,
        ecologyEpoch: captured.roster.ecologyEpoch,
        fullRosterFingerprint: captured.roster.fullRosterFingerprint,
        extensions: preDraw.extensions,
      });
      if (composed.kind !== 'ready') {
        return Object.freeze({
          kind: 'refused' as const,
          reason: `snapshot:${composed.reason}` as const,
        });
      }
      if (capturePresentationFenceV1(composed.snapshot, {
        observedActivePlayMs: preDraw.activePlayMs,
      }) !== captured.presentationFence) {
        return Object.freeze({
          kind: 'refused' as const,
          reason: 'presentation:changed' as const,
        });
      }
      const preflight = preflightCaptureV1(composed.snapshot, captured.verb);
      if (preflight.kind !== 'ready') {
        return Object.freeze({
          kind: 'refused' as const,
          reason: `preflight:${preflight.reason}` as const,
        });
      }
      const certified = certifyArc4CaptureCapacityV1({
        preflight,
        preDraw,
        parent: captured.ownershipV2,
      });
      if (certified.kind !== 'certified') {
        return Object.freeze({
          kind: 'refused' as const,
          reason: `capacity:${certified.reason}` as const,
        });
      }
      return owner.ready(certified.certificate, (draw, settlementOwner) => {
        const settlement = settleCertifiedArc4CaptureV1({
          preflight,
          draw,
          authorizer: settlementOwner,
        });
        if (settlement.kind !== 'derived') {
          settlementRefusal = `settlement:${settlement.reason}`;
          throw new Error(settlementRefusal);
        }
        const evidencePayload: Arc4CapturePendingEvidencePayloadV1 = Object.freeze({
          transactionPlan: draw.plan,
          transactionPlanFingerprint: jsonFingerprint(
            draw.plan,
            'Arc 4 capture F4 plan must be JSON data',
          ),
          preflight,
          capturePlan: settlement.plan,
          settlement,
          sourceDraft: preDraw.draft,
          sourceDraftFingerprint: jsonFingerprint(
            preDraw.draft,
            'Arc 4 capture source draft must be JSON data',
          ),
          preparedFingerprint: preparedSaveFingerprint(settlement.prepared),
        });
        selected = Object.freeze({
          preflight,
          settlement,
          sourceDraft: preDraw.draft,
          evidencePayload,
        });
        return settlement.authorization;
      });
    },
  });
  if (transaction.kind !== 'committed') {
    return Object.freeze({
      kind: 'refused',
      durability: 'none',
      convergence: requiresReadOnlyConvergence(transaction)
        ? 'read-only-reload' : 'none',
      detail: settlementRefusal ?? transactionDetail(transaction),
      transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    preflight: CapturePreflightReadyV1;
    settlement: Arc4CaptureDerivedSettlementV1;
    sourceDraft: SaveStateV2;
    evidencePayload: Arc4CapturePendingEvidencePayloadV1;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-settlement-evidence-missing',
      transaction,
    });
  }
  const evidence: Arc4CaptureCommitEvidenceV1 = Object.freeze({
    schema: 'cf-v2-arc4-capture-commit-evidence/v1',
  });
  ARC4_CAPTURE_COMMIT_EVIDENCE.set(evidence, Object.freeze({
    ...committedSelection.evidencePayload,
    transaction,
    transactionKind: transaction.kind,
    transactionRevision: transaction.revision,
  }));
  return Object.freeze({
    kind: 'committed',
    durability: 'committed',
    convergence: 'none',
    transaction,
    settlement: committedSelection.settlement,
    preflight: committedSelection.preflight,
    sourceDraft: committedSelection.sourceDraft,
    evidence,
  });
}

export type Arc4CaptureCommittedMismatchDetailV1 =
  | 'transaction-domain-order-mismatch'
  | 'transaction-draw-values-mismatch'
  | 'transaction-receipt-ordinal-mismatch'
  | 'transaction-receipt-kind-mismatch'
  | 'transaction-receipt-witness-mismatch'
  | 'transaction-commit-authority-mismatch'
  | 'transaction-f4-plan-authority-mismatch'
  | 'transaction-prepared-save-mismatch'
  | 'transaction-complete-save-inventory-mismatch'
  | 'transaction-committed-state-mismatch'
  | 'capture-evidence-unregistered'
  | 'capture-plan-authority-mismatch'
  | 'capture-settlement-authority-mismatch'
  | 'ecology-epoch-mismatch'
  | 'runtime-extensions-mismatch'
  | 'ownership-carrier-not-current'
  | 'ownership-successor-mismatch'
  | 'arc5-migration-not-current'
  | 'arc5-migration-successor-mismatch'
  | 'ownership-legacy-mirror-mismatch'
  | 'f4-authority-mismatch'
  | 'stardust-reward-mismatch'
  | 'stardust-balance-mismatch'
  | 'stardust-earned-mismatch'
  | 'verification-error';

export type Arc4CaptureCommittedVerificationV1 =
  | Readonly<{
    kind: 'verified';
    durability: 'committed';
    convergence: 'none';
    ownership: OwnershipStateV1;
    ownershipV2: OwnershipStateV2;
    ownershipV2Evidence: Arc5OwnershipMigrationEvidenceV2;
    plan: Arc4CaptureDerivedSettlementV1['plan'];
    stardustReward: number;
  }>
  | Readonly<{
    kind: 'mismatch';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: Arc4CaptureCommittedMismatchDetailV1;
  }>;

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function mismatch(
  detail: Arc4CaptureCommittedMismatchDetailV1,
): Arc4CaptureCommittedVerificationV1 {
  return Object.freeze({
    kind: 'mismatch', durability: 'committed', convergence: 'read-only-reload', detail,
  });
}

/** Independently prove the complete committed result before any live field is
 * published. This consumes no RNG, performs no write, and never repairs. */
function verifyArc4CommittedCaptureCheckedV1(input: Readonly<{
  readonly runtimeExtensions: V5Extensions;
  readonly committed: Extract<Arc4CaptureAttemptOutcomeV1, { readonly kind: 'committed' }>;
}>): Arc4CaptureCommittedVerificationV1 {
  const { transaction, settlement, sourceDraft, preflight, evidence } = input.committed;
  const evidencePayload = typeof evidence === 'object' && evidence !== null
    ? ARC4_CAPTURE_COMMIT_EVIDENCE.get(evidence)
    : undefined;
  if (evidencePayload === undefined) return mismatch('capture-evidence-unregistered');
  const draws = transaction.plan.draws;
  if (draws.length !== ARC4_CAPTURE_DOMAINS.length
    || draws.some((draw, index) => draw.domain !== ARC4_CAPTURE_DOMAINS[index])) {
    return mismatch('transaction-domain-order-mismatch');
  }
  if (draws[0]?.value !== settlement.plan.candidateDraw
    || draws[1]?.value !== settlement.plan.successDraw
    || draws.some(({ value }) => !Number.isFinite(value) || value < 0 || value >= 1)) {
    return mismatch('transaction-draw-values-mismatch');
  }
  if (transaction.plan.receiptOrdinal !== settlement.plan.receiptOrdinal
    || transaction.receipt.ordinal !== settlement.plan.receiptOrdinal) {
    return mismatch('transaction-receipt-ordinal-mismatch');
  }
  if (transaction.receipt.kind !== ARC4_CAPTURE_RECEIPT_KIND) {
    return mismatch('transaction-receipt-kind-mismatch');
  }
  if (transaction.receipt.witness !== settlement.plan.witness
    || settlement.derivation.witness !== settlement.plan.witness) {
    return mismatch('transaction-receipt-witness-mismatch');
  }
  if (!sameJson(transaction.saved, settlement.prepared)
    || !sameJson(settlement.derivation.state, settlement.prepared.canonicalState)) {
    return mismatch('transaction-prepared-save-mismatch');
  }
  const expectedOperations = Object.freeze([
    ['player', 'v5:player'],
    ['creatures', 'v5:creatures'],
    ['catalog', 'v5:catalog'],
    ['inventory', 'v5:inventory'],
    ['settings', 'v5:settings'],
    ['meta', 'save'],
  ] as const);
  if (transaction.saved.operations.length !== expectedOperations.length
    || transaction.saved.operations.some((operation, index) => (
      operation.store !== expectedOperations[index]?.[0]
        || operation.key !== expectedOperations[index]?.[1]
        || typeof operation.value !== 'string'
    ))
    || transaction.saved.operations[5]?.value !== transaction.saved.legacyV4Raw) {
    return mismatch('transaction-complete-save-inventory-mismatch');
  }
  if (!sameJson(transaction.state, transaction.saved.canonicalState)) {
    return mismatch('transaction-committed-state-mismatch');
  }
  if (settlement.plan.snapshotFingerprint !== preflight.snapshot.fingerprint
    || settlement.plan.verb !== preflight.verb) {
    return mismatch('capture-plan-authority-mismatch');
  }
  if (sourceDraft.EPOCH_BASE !== preflight.snapshot.ecologyEpoch
    || transaction.state.EPOCH_BASE !== preflight.snapshot.ecologyEpoch) {
    return mismatch('ecology-epoch-mismatch');
  }
  if (!sameJson(input.runtimeExtensions, transaction.saved.extensions)) {
    return mismatch('runtime-extensions-mismatch');
  }
  const ownership = readArc4Ownership(
    input.runtimeExtensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  if (ownership.kind !== 'loaded' || ownership.state.mode !== 'current') {
    return mismatch('ownership-carrier-not-current');
  }
  if (ownershipStateDigestV1(ownership.state)
    !== ownershipStateDigestV1(settlement.plan.successor)) {
    return mismatch('ownership-successor-mismatch');
  }
  const arc5 = readArc5OwnershipMigration(
    input.runtimeExtensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  const expectedArc5 = readArc5OwnershipMigration(
    settlement.prepared.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  if (arc5.kind !== 'loaded'
    || expectedArc5.kind !== 'loaded'
    || arc5.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || expectedArc5.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION) {
    return mismatch('arc5-migration-not-current');
  }
  if (!arc4OwnershipLegacyMirrorMatches(ownership.state, transaction.state)) {
    return mismatch('ownership-legacy-mirror-mismatch');
  }
  const f4 = readF4Authority(input.runtimeExtensions);
  const committedActivePlayMs = transaction.authority.activePlayMs;
  const plannedAuthorityFingerprint = `f4a1:${sha256Hex(canonicalJson({
    activePlayMs: transaction.plan.currentAuthority.activePlayMs,
    sessionRng: transaction.plan.currentAuthority.sessionRng as unknown as CanonicalJson,
  }))}`;
  if (f4.kind !== 'loaded'
    || !sameJson(f4.authority, transaction.authority)
    || !Number.isSafeInteger(committedActivePlayMs)
    || committedActivePlayMs < transaction.plan.currentAuthority.activePlayMs
    || committedActivePlayMs > MAX_ACTIVE_PLAY_MS
    || transaction.plan.currentAuthority.activePlayMs !== preflight.snapshot.activePlayMs
    || plannedAuthorityFingerprint !== preflight.snapshot.f4AuthorityFingerprint
    || Math.floor(committedActivePlayMs / ACTIVE_PLAY_CAPTURE_CYCLE_MS)
      !== preflight.snapshot.cycle
    || !sameJson(f4.authority.sessionRng, transaction.plan.nextSessionRng)) {
    return mismatch('f4-authority-mismatch');
  }
  const expectedReward = settlement.plan.hit
    && settlement.plan.firstForSpecies
    && settlement.plan.tier >= ARC4_FIRST_SPECIES_STARDUST_TIER_MIN
    ? settlement.plan.tier - 3 : 0;
  if (settlement.stardustReward !== expectedReward) {
    return mismatch('stardust-reward-mismatch');
  }
  if (transaction.state.essence !== sourceDraft.essence + expectedReward) {
    return mismatch('stardust-balance-mismatch');
  }
  if (transaction.state.stats.essenceEarned
    !== (sourceDraft.stats.essenceEarned ?? 0) + expectedReward) {
    return mismatch('stardust-earned-mismatch');
  }
  if (transaction.plan !== evidencePayload.transactionPlan
    || jsonFingerprint(transaction.plan, 'Arc 4 transaction plan must be JSON data')
      !== evidencePayload.transactionPlanFingerprint) {
    return mismatch('transaction-f4-plan-authority-mismatch');
  }
  if (preparedSaveFingerprint(transaction.saved) !== evidencePayload.preparedFingerprint
    || preparedSaveFingerprint(settlement.prepared) !== evidencePayload.preparedFingerprint) {
    return mismatch('transaction-prepared-save-mismatch');
  }
  const transactionEnvelope = transaction as unknown as Readonly<{
    kind?: unknown;
    revision?: unknown;
  }>;
  if (transaction !== evidencePayload.transaction
    || transactionEnvelope.kind !== evidencePayload.transactionKind
    || transactionEnvelope.revision !== evidencePayload.transactionRevision) {
    return mismatch('transaction-commit-authority-mismatch');
  }
  if (!isCapturePreflightReadyV1(preflight)
    || !isCaptureAttemptPlanV1(settlement.plan)
    || preflight !== evidencePayload.preflight
    || settlement.plan !== evidencePayload.capturePlan) {
    return mismatch('capture-plan-authority-mismatch');
  }
  if (!isArc4CaptureDerivedSettlementV1(settlement)
    || settlement !== evidencePayload.settlement
    || sourceDraft !== evidencePayload.sourceDraft
    || jsonFingerprint(sourceDraft, 'Arc 4 capture source draft must be JSON data')
      !== evidencePayload.sourceDraftFingerprint) {
    return mismatch('capture-settlement-authority-mismatch');
  }
  if (ownershipStateDigestV2(arc5.state) !== settlement.ownershipV2Digest
    || ownershipStateDigestV2(expectedArc5.state) !== settlement.ownershipV2Digest
    || !sameJson(arc5.evidence, expectedArc5.evidence)) {
    return mismatch('arc5-migration-successor-mismatch');
  }
  return Object.freeze({
    kind: 'verified',
    durability: 'committed',
    convergence: 'none',
    ownership: ownership.state,
    ownershipV2: arc5.state,
    ownershipV2Evidence: arc5.evidence,
    plan: settlement.plan,
    stardustReward: expectedReward,
  });
}

export function verifyArc4CommittedCaptureV1(input: Readonly<{
  readonly runtimeExtensions: V5Extensions;
  readonly committed: Extract<Arc4CaptureAttemptOutcomeV1, { readonly kind: 'committed' }>;
}>): Arc4CaptureCommittedVerificationV1 {
  try { return verifyArc4CommittedCaptureCheckedV1(input); } catch {
    return mismatch('verification-error');
  }
}

export type Arc4AppBootstrapOutcomeV1 = ReturnType<
  typeof prepareArc4OwnershipLegacyMigration
>;

/** Classify/bootstrap the Arc 4 carrier without rewards or capture receipts. */
export function prepareArc4AppBootstrap(input: Readonly<{
  readonly extensions: V5Extensions;
  readonly save: SaveStateV2;
}>): Arc4AppBootstrapOutcomeV1 {
  return prepareArc4OwnershipLegacyMigration({
    extensions: input.extensions,
    legacy: input.save,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
}

export type Arc4BootstrapLegacyStageV1 =
  | Readonly<{
    kind: 'staged';
    candidate: SaveStateV2;
    projection: ProjectedLegacyOwnershipMirrorV1 | null;
    changed: boolean;
  }>
  | Readonly<{
    kind: 'protected';
    reason: 'legacy-mirror-unrepresentable' | 'legacy-projection-failed';
    detail: string;
  }>;

/** Stage a detached, ordinary-v4 fixed point for bootstrap/reconciliation.
 * A lossless legacy-protected carrier deliberately leaves its source mirror
 * untouched; it remains inspection-only and cannot authorize capture. */
export function stageArc4BootstrapLegacyProjection(input: Readonly<{
  readonly source: SaveStateV2;
  readonly state: OwnershipStateV1;
  readonly registry: ContentRegistry;
  readonly codecNow: number;
}>): Arc4BootstrapLegacyStageV1 {
  if (input.state.mode === 'legacy-protected') {
    try {
      return Object.freeze({
        kind: 'staged',
        candidate: structuredClone(input.source),
        projection: null,
        changed: false,
      });
    } catch (error) {
      return Object.freeze({
        kind: 'protected',
        reason: 'legacy-projection-failed',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }
  let projection: ReturnType<typeof projectLegacyOwnershipMirror>;
  try { projection = projectLegacyOwnershipMirror(input.state); } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: 'legacy-projection-failed',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
  if (projection.kind !== 'projected') {
    return Object.freeze({
      kind: 'protected',
      reason: 'legacy-mirror-unrepresentable',
      detail: projection.kind === 'unrepresentable'
        ? `${projection.reason}:${projection.leafSeed}` : projection.kind,
    });
  }
  try {
    const staged = stageArc4LegacyMirrorFixedPointV1({
      baseRaw: exportSaveV2(input.source, input.codecNow),
      mirror: projection,
      stardustReward: 0,
      codec: Object.freeze({
        importLegacy: (raw: string) => importSaveV2(raw, input.registry, input.codecNow),
        exportLegacy: (state: SaveStateV2) => exportSaveV2(state, input.codecNow),
      }),
    });
    return Object.freeze({
      kind: 'staged',
      candidate: staged.state,
      projection,
      changed: !sameJson(staged.state, input.source),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: 'legacy-projection-failed',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

const ARC4_CODEX_STAT_KEYS = Object.freeze([
  'hybrids', 'best', 'maxGen', 'bestRank',
] as const);

function arc4OwnedCustomNameKeys(state: SaveStateV2): ReadonlySet<string> {
  return new Set(state.codex.map(([legacyCodexId]) => `c${legacyCodexId}`));
}

/** Publish only Arc 4's compatibility surface after durability. */
export function publishArc4LegacyCompatibilityFields(
  target: SaveStateV2,
  committed: SaveStateV2,
): void {
  const targetOwned = arc4OwnedCustomNameKeys(target);
  const committedOwned = arc4OwnedCustomNameKeys(committed);
  const owned = new Set([...targetOwned, ...committedOwned]);
  target.codex = structuredClone(committed.codex);
  target.customNames = [
    ...target.customNames.filter(([key]) => !owned.has(key)).map(([key, value]) => [key, value] as [string, string]),
    ...committed.customNames.filter(([key]) => committedOwned.has(key))
      .map(([key, value]) => [key, value] as [string, string]),
  ];
  target.bioX = committed.bioX.map(([seed, progress]) => [seed, [...progress]]);
  target.scoutId = committed.scoutId;
  target.stats = { ...target.stats };
  for (const key of ARC4_CODEX_STAT_KEYS) target.stats[key] = committed.stats[key] ?? 0;
}

/** Publish the capture-owned epoch/reward fields plus the verified legacy
 * ownership projection. Unrelated outer-save fields remain live-owned. */
export function publishArc4CaptureFields(
  target: SaveStateV2,
  committed: SaveStateV2,
): void {
  publishArc4LegacyCompatibilityFields(target, committed);
  target.EPOCH_BASE = committed.EPOCH_BASE;
  target.essence = committed.essence;
  target.stats.essenceEarned = committed.stats.essenceEarned ?? 0;
}
