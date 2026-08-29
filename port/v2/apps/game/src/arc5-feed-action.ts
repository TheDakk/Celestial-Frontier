/* Arc 5 app-owned deterministic feed transaction.

   This wrapper binds one owner-minted feed successor to the generic F4
   deterministic receipt plan and the compact Arc 5 exact-five persistence
   bridge. It never mutates or publishes caller state, never retries, and
   returns a publishable ownership state only after postcommit fixed-point
   verification succeeds. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type OwnershipStateV2,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import {
  ARC5_FEED_ACTION_KIND_V1,
  ARC5_FEED_RECEIPT_KIND_V1,
  preflightArc5FeedV1,
  settleArc5FeedV1,
  type Arc5FeedRefusalReasonV1,
  type Arc5FeedSettlementV1,
} from '@cf/domain-acquisition/feed-internal';
import {
  committedArc5OwnershipState,
  prepareArc5OwnershipV2Successor,
  type Arc5OwnershipMigrationEvidenceV2,
  type Arc5OwnershipV2SuccessorProtectionReason,
  type PreparedArc5OwnershipMigrationSuccessorV2,
  type SaveStateV2,
} from '@cf/persistence';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export interface Arc5FeedActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  /** Exact registered Arc 5 parent retained after boot or the last verified
      ownership commit. */
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly creatureId: CreatureInstanceId;
  readonly foodLotId: SpecimenLotId;
  readonly codecNow: number;
}

export type Arc5FeedActionRefusalDetailV1 =
  | `preflight:${Arc5FeedRefusalReasonV1}`
  | `ownership-carrier:${Arc5OwnershipV2SuccessorProtectionReason}`
  | `transaction:${string}`
  | 'input:invalid-or-unregistered';

export type Arc5FeedActionOutcomeV1 =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    settlement: Arc5FeedSettlementV1;
    ownershipV2: OwnershipStateV2;
    ownershipV2Evidence: Arc5OwnershipMigrationEvidenceV2;
    ownershipWrites: PreparedArc5OwnershipMigrationSuccessorV2['writes'];
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-feed-evidence-missing' | 'committed-feed-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: Arc5FeedActionRefusalDetailV1;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedArc5FeedActionInputV1 {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly creatureId: CreatureInstanceId;
  readonly foodLotId: SpecimenLotId;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze([
  'runtime', 'ownershipV2', 'state', 'creatureId', 'foodLotId', 'codecNow',
] as const);
const FEED_STATE_CLONE_LIMIT = 1_500_000;

interface FeedCloneBudget { count: number; }

function cloneFeedPlainData(
  value: unknown,
  ancestors: Set<object>,
  budget: FeedCloneBudget,
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('feed state must contain only plain data');
  if (depth > 256 || budget.count >= FEED_STATE_CLONE_LIMIT) {
    throw new RangeError('feed state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('feed state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('feed arrays must use the native prototype');
      const keys = Reflect.ownKeys(value);
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('feed arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('feed arrays cannot contain accessors or holes');
        }
        clone.push(cloneFeedPlainData(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('feed state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('feed state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('feed state cannot contain accessors or hidden fields');
      }
      Object.defineProperty(clone, key, {
        value: cloneFeedPlainData(descriptor.value, ancestors, budget, depth + 1),
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

function capturedInput(input: Arc5FeedActionInputV1): CapturedArc5FeedActionInputV1 | null {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(input);
    const names = keys.filter((key): key is string => typeof key === 'string').sort();
    const expected = [...INPUT_FIELDS].sort();
    if (keys.length !== expected.length
      || names.some((name, index) => name !== expected[index])) return null;
    const values: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of INPUT_FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      values[field] = descriptor.value;
    }
    const runtime = values.runtime;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)) return null;
    const commit = Object.getOwnPropertyDescriptor(runtime, 'commitAction');
    if (!commit || !('value' in commit) || typeof commit.value !== 'function') return null;
    if (!isOwnershipStateV2(values.ownershipV2)) return null;
    if (!values.state || typeof values.state !== 'object' || Array.isArray(values.state)) return null;
    if (typeof values.codecNow !== 'number' || !Number.isFinite(values.codecNow)) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      ownershipV2: values.ownershipV2,
      state: cloneFeedPlainData(
        values.state,
        new Set<object>(),
        { count: 0 },
        0,
      ) as SaveStateV2,
      creatureId: values.creatureId as CreatureInstanceId,
      foodLotId: values.foodLotId as SpecimenLotId,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): Arc5FeedActionRefusalDetailV1 {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') {
    return `transaction:${outcome.message}`;
  }
  if (outcome.kind === 'protected') return `transaction:protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `transaction:lost:${outcome.reason}`;
  return `transaction:${outcome.kind}`;
}

function requiresReadOnlyConvergence(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
  carrierProtection: Arc5OwnershipV2SuccessorProtectionReason | null,
): boolean {
  return carrierProtection !== null
    || outcome.kind === 'stale'
    || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt'
    || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable'
    || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

/** Commit one nonlethal deterministic feed. A domain refusal consumes no F4
 * receipt. Once F4 planning begins there is exactly one repository attempt;
 * every noncommit or postcommit mismatch remains unpublished and is never
 * retried as another meal. */
export async function commitArc5FeedActionV1(
  input: Arc5FeedActionInputV1,
): Promise<Arc5FeedActionOutcomeV1> {
  const captured = capturedInput(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused',
      durability: 'none',
      convergence: 'none',
      detail: 'input:invalid-or-unregistered',
      transaction: null,
    });
  }
  const preflight = preflightArc5FeedV1(captured.ownershipV2, {
    creatureId: captured.creatureId,
    foodLotId: captured.foodLotId,
  });
  if (preflight.kind !== 'ready') {
    return Object.freeze({
      kind: 'refused',
      durability: 'none',
      convergence: preflight.reason === 'ownership-revision-exhausted'
        ? 'read-only-reload' : 'none',
      detail: `preflight:${preflight.reason}`,
      transaction: null,
    });
  }

  let selected: Readonly<{
    settlement: Arc5FeedSettlementV1;
    prepared: PreparedArc5OwnershipMigrationSuccessorV2;
  }> | null = null;
  let carrierProtection: Arc5OwnershipV2SuccessorProtectionReason | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: ARC5_FEED_ACTION_KIND_V1,
      receiptKind: ARC5_FEED_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft, extensions }) => {
        const settlement = settleArc5FeedV1(preflight.preflight, receiptOrdinal);
        const prepared = prepareArc5OwnershipV2Successor({
          baseExtensions: extensions,
          parent: captured.ownershipV2,
          successor: settlement.successor,
          resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
        });
        if (prepared.kind !== 'prepared') {
          carrierProtection = prepared.reason;
          throw new Error(`Arc 5 feed ownership carrier refused ${prepared.reason}`);
        }
        selected = Object.freeze({ settlement, prepared });
        return Object.freeze({
          state: draft,
          extensionWrites: prepared.writes,
          witness: settlement.witness,
        });
      },
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: `transaction:${error instanceof Error ? error.message : String(error)}`,
      transaction: null,
    });
  }
  if (transaction.kind !== 'committed') {
    return Object.freeze({
      kind: 'refused',
      durability: 'none',
      convergence: requiresReadOnlyConvergence(transaction, carrierProtection)
        ? 'read-only-reload' : 'none',
      detail: carrierProtection === null
        ? transactionDetail(transaction)
        : `ownership-carrier:${carrierProtection}`,
      transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    settlement: Arc5FeedSettlementV1;
    prepared: PreparedArc5OwnershipMigrationSuccessorV2;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-feed-evidence-missing',
      transaction,
    });
  }
  const committed = committedArc5OwnershipState(
    committedSelection.prepared,
    transaction.saved.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  const settlement = committedSelection.settlement;
  if (committed === null
    || transaction.plan.operation !== ARC5_FEED_ACTION_KIND_V1
    || transaction.plan.receiptOrdinal !== settlement.receiptEvidence.ordinal
    || transaction.receipt.ordinal !== settlement.receiptEvidence.ordinal
    || transaction.receipt.kind !== ARC5_FEED_RECEIPT_KIND_V1
    || transaction.receipt.witness !== settlement.witness
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || ownershipStateDigestV2(committed.state)
      !== ownershipStateDigestV2(settlement.successor)) {
    return Object.freeze({
      kind: 'committed-convergence',
      durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-feed-fixed-point-mismatch',
      transaction,
    });
  }
  return Object.freeze({
    kind: 'committed',
    durability: 'committed',
    convergence: 'none',
    transaction,
    settlement,
    ownershipV2: committed.state,
    ownershipV2Evidence: committed.evidence,
    ownershipWrites: committedSelection.prepared.writes,
  });
}
