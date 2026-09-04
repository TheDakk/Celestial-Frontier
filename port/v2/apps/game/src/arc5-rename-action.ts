/* Arc 5 app-owned deterministic companion rename transaction.

   One owner-minted exact-instance rename crosses the generic F4 deterministic
   action transaction and the Arc 5 exact-five carrier in one CAS. Nothing is
   publishable until the committed carrier reopens at the expected fixed point. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  ARC5_RENAME_ACTION_KIND_V1,
  ARC5_RENAME_RECEIPT_KIND_V1,
  preflightArc5RenameV1,
  settleArc5RenameV1,
  type Arc5RenameRefusalReasonV1,
  type Arc5RenameSettlementV1,
} from '@cf/domain-acquisition/rename-internal';
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
import {
  prepareArc9EventAchievementJoinV1,
  type Arc9EventAchievementJoinPreparationV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
} from './arc9-progression-projection.js';

export interface Arc5RenameActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly creatureId: CreatureInstanceId;
  readonly rawName: string;
  readonly codecNow: number;
}

export type Arc5RenameActionRefusalDetailV1 =
  | `preflight:${Arc5RenameRefusalReasonV1}`
  | `ownership-carrier:${Arc5OwnershipV2SuccessorProtectionReason}`
  | `transaction:${string}`
  | `achievement:${Arc9ProgressionProjectionProtectionReasonV1}`
  | 'input:invalid-or-unregistered';

export type Arc5RenameActionOutcomeV1 =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    settlement: Arc5RenameSettlementV1;
    ownershipV2: OwnershipStateV2;
    ownershipV2Evidence: Arc5OwnershipMigrationEvidenceV2;
    ownershipWrites: PreparedArc5OwnershipMigrationSuccessorV2['writes'];
    namerAchievementAdded: boolean;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-rename-evidence-missing' | 'committed-rename-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: Arc5RenameActionRefusalDetailV1;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly creatureId: CreatureInstanceId;
  readonly rawName: string;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze([
  'runtime', 'ownershipV2', 'state', 'creatureId', 'rawName', 'codecNow',
] as const);
const CLONE_LIMIT = 1_500_000;

function clonePlain(
  value: unknown,
  ancestors: Set<object>,
  budget: { count: number },
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('rename state must contain only plain data');
  if (depth > 256 || budget.count >= CLONE_LIMIT) {
    throw new RangeError('rename state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('rename state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('rename arrays must use the native prototype');
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      const keys = Reflect.ownKeys(value);
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('rename arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('rename arrays cannot contain accessors or holes');
        }
        clone.push(clonePlain(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('rename state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('rename state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('rename state cannot contain accessors or hidden fields');
      }
      Object.defineProperty(clone, key, {
        value: clonePlain(descriptor.value, ancestors, budget, depth + 1),
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

function capture(input: Arc5RenameActionInputV1): CapturedInput | null {
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
    if (typeof values.creatureId !== 'string' || typeof values.rawName !== 'string'
      || typeof values.codecNow !== 'number' || !Number.isFinite(values.codecNow)) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      ownershipV2: values.ownershipV2,
      state: clonePlain(values.state, new Set<object>(), { count: 0 }, 0) as SaveStateV2,
      creatureId: values.creatureId as CreatureInstanceId,
      rawName: values.rawName,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): Arc5RenameActionRefusalDetailV1 {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') {
    return `transaction:${outcome.message}`;
  }
  if (outcome.kind === 'protected') return `transaction:protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `transaction:lost:${outcome.reason}`;
  return `transaction:${outcome.kind}`;
}

function needsReload(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
  carrier: Arc5OwnershipV2SuccessorProtectionReason | null,
): boolean {
  return carrier !== null || outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt' || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable' || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

/** One attempt, one receipt, one CAS, no retry, and no precommit publication. */
export async function commitArc5RenameActionV1(
  input: Arc5RenameActionInputV1,
): Promise<Arc5RenameActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const preflight = preflightArc5RenameV1(captured.ownershipV2, {
    creatureId: captured.creatureId,
    rawName: captured.rawName,
  });
  if (preflight.kind !== 'ready') {
    return Object.freeze({
      kind: 'refused', durability: 'none',
      convergence: preflight.reason === 'ownership-revision-exhausted'
        ? 'read-only-reload' : 'none',
      detail: `preflight:${preflight.reason}`, transaction: null,
    });
  }
  const achievementPreflight = prepareArc9EventAchievementJoinV1(
    captured.state,
    'namer',
  );
  if (achievementPreflight.kind !== 'prepared') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `achievement:${achievementPreflight.reason}`, transaction: null,
    });
  }

  let selected: Readonly<{
    settlement: Arc5RenameSettlementV1;
    prepared: PreparedArc5OwnershipMigrationSuccessorV2;
    achievement: Arc9EventAchievementJoinPreparationV1;
  }> | null = null;
  let carrierProtection: Arc5OwnershipV2SuccessorProtectionReason | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: ARC5_RENAME_ACTION_KIND_V1,
      receiptKind: ARC5_RENAME_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft, extensions }) => {
        const settlement = settleArc5RenameV1(preflight.preflight, receiptOrdinal);
        const achievement = prepareArc9EventAchievementJoinV1(draft, 'namer');
        if (achievement.kind !== 'prepared'
          || achievement.achievementId !== achievementPreflight.achievementId
          || achievement.owner !== achievementPreflight.owner
          || achievement.added !== achievementPreflight.added
          || achievement.priorUnlockedCount !== achievementPreflight.priorUnlockedCount
          || !sameJson(achievement.nextUnlockedIds, achievementPreflight.nextUnlockedIds)) {
          throw new Error('Arc 5 rename achievement parent changed before derivation');
        }
        const prepared = prepareArc5OwnershipV2Successor({
          baseExtensions: extensions,
          parent: captured.ownershipV2,
          successor: settlement.successor,
          resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
        });
        if (prepared.kind !== 'prepared') {
          carrierProtection = prepared.reason;
          throw new Error(`Arc 5 rename ownership carrier refused ${prepared.reason}`);
        }
        selected = Object.freeze({ settlement, prepared, achievement });
        return Object.freeze({
          state: achievement.added
            ? { ...draft, unlocked: [...achievement.nextUnlockedIds] }
            : draft,
          extensionWrites: prepared.writes,
          witness: settlement.witness,
        });
      },
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: `transaction:${error instanceof Error ? error.message : String(error)}`,
      transaction: null,
    });
  }
  if (transaction.kind !== 'committed') {
    return Object.freeze({
      kind: 'refused', durability: 'none',
      convergence: needsReload(transaction, carrierProtection) ? 'read-only-reload' : 'none',
      detail: carrierProtection === null
        ? transactionDetail(transaction)
        : `ownership-carrier:${carrierProtection}`,
      transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    settlement: Arc5RenameSettlementV1;
    prepared: PreparedArc5OwnershipMigrationSuccessorV2;
    achievement: Arc9EventAchievementJoinPreparationV1;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-rename-evidence-missing', transaction,
    });
  }
  const committed = committedArc5OwnershipState(
    committedSelection.prepared,
    transaction.saved.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  const settlement = committedSelection.settlement;
  const committedAchievement = prepareArc9EventAchievementJoinV1(
    transaction.state,
    'namer',
  );
  if (committed === null
    || transaction.plan.operation !== ARC5_RENAME_ACTION_KIND_V1
    || transaction.plan.receiptOrdinal !== settlement.receiptEvidence.ordinal
    || transaction.receipt.ordinal !== settlement.receiptEvidence.ordinal
    || transaction.receipt.kind !== ARC5_RENAME_RECEIPT_KIND_V1
    || transaction.receipt.witness !== settlement.witness
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(
      transaction.state.unlocked,
      committedSelection.achievement.nextUnlockedIds,
    )
    || committedAchievement.kind !== 'prepared'
    || committedAchievement.added !== false
    || !sameJson(
      committedAchievement.nextUnlockedIds,
      committedSelection.achievement.nextUnlockedIds,
    )
    || ownershipStateDigestV2(committed.state) !== ownershipStateDigestV2(settlement.successor)) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-rename-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    settlement, ownershipV2: committed.state, ownershipV2Evidence: committed.evidence,
    ownershipWrites: committedSelection.prepared.writes,
    namerAchievementAdded: committedSelection.achievement.added,
  });
}

/** Publish only the independently verified event-achievement carrier after
 * Main has accepted this action's durable ownership fixed point. */
export function publishArc5RenameAchievementFields(
  target: SaveStateV2,
  committed: SaveStateV2,
): void {
  const fixedPoint = prepareArc9EventAchievementJoinV1(committed, 'namer');
  if (fixedPoint.kind !== 'prepared' || fixedPoint.added) {
    throw new TypeError('Arc 5 rename achievement publication requires a committed fixed point');
  }
  target.unlocked = committed.unlocked.slice();
}
