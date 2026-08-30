/* Arc 5 app-owned deterministic Field Scout transaction.

   One exact set/switch/stand-down crosses F4 and the compact Arc 5 five-
   carrier authority in one CAS. The old Scout remains authoritative until
   postcommit fixed-point verification succeeds; no path retries. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  ARC5_SCOUT_ACTION_KIND_V1,
  ARC5_SCOUT_RECEIPT_KIND_V1,
  preflightArc5ScoutV1,
  settleArc5ScoutV1,
  type Arc5ScoutRefusalReasonV1,
  type Arc5ScoutSettlementV1,
} from '@cf/domain-acquisition/scout-internal';
import {
  committedArc5OwnershipState,
  prepareArc5OwnershipV2Successor,
  type Arc5OwnershipMigrationEvidenceV2,
  type Arc5OwnershipV2SuccessorProtectionReason,
  type PreparedArc5OwnershipMigrationSuccessorV2,
  type SaveStateV2,
  type V5ExtensionWrite,
} from '@cf/persistence';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';
import {
  publishStarterCharterActionFieldsV1,
  stageStarterCharterActionV1,
  type StarterCharterActionFactV1,
} from './starter-charter-action.js';

export interface Arc5ScoutActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly scoutCreatureId: CreatureInstanceId | null;
  readonly codecNow: number;
}

export type Arc5ScoutActionRefusalDetailV1 =
  | `preflight:${Arc5ScoutRefusalReasonV1}`
  | `ownership-carrier:${Arc5OwnershipV2SuccessorProtectionReason}`
  | `transaction:${string}`
  | 'input:invalid-or-unregistered';

export type Arc5ScoutActionOutcomeV1 =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    settlement: Arc5ScoutSettlementV1;
    ownershipV2: OwnershipStateV2;
    ownershipV2Evidence: Arc5OwnershipMigrationEvidenceV2;
    ownershipWrites: PreparedArc5OwnershipMigrationSuccessorV2['writes'];
    extensionWrites: readonly V5ExtensionWrite[];
    starterCharter: StarterCharterActionFactV1 | null;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-scout-evidence-missing' | 'committed-scout-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: Arc5ScoutActionRefusalDetailV1;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly ownershipV2: OwnershipStateV2;
  readonly state: SaveStateV2;
  readonly scoutCreatureId: CreatureInstanceId | null;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze([
  'runtime', 'ownershipV2', 'state', 'scoutCreatureId', 'codecNow',
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
  if (typeof value !== 'object') throw new TypeError('Field Scout state must contain only plain data');
  if (depth > 256 || budget.count >= CLONE_LIMIT) {
    throw new RangeError('Field Scout state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('Field Scout state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) {
        throw new TypeError('Field Scout arrays must use the native prototype');
      }
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      const keys = Reflect.ownKeys(value);
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('Field Scout arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Field Scout arrays cannot contain accessors or holes');
        }
        clone.push(clonePlain(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Field Scout state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('Field Scout state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Field Scout state cannot contain accessors or hidden fields');
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

function capture(input: Arc5ScoutActionInputV1): CapturedInput | null {
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
    if (values.scoutCreatureId !== null && typeof values.scoutCreatureId !== 'string') return null;
    if (typeof values.codecNow !== 'number' || !Number.isFinite(values.codecNow)) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      ownershipV2: values.ownershipV2,
      state: clonePlain(values.state, new Set<object>(), { count: 0 }, 0) as SaveStateV2,
      scoutCreatureId: values.scoutCreatureId as CreatureInstanceId | null,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): Arc5ScoutActionRefusalDetailV1 {
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

/** One set/switch/stand-down, one receipt, one CAS, no retry or optimism. */
export async function commitArc5ScoutActionV1(
  input: Arc5ScoutActionInputV1,
): Promise<Arc5ScoutActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const preflight = preflightArc5ScoutV1(captured.ownershipV2, {
    scoutCreatureId: captured.scoutCreatureId,
  });
  if (preflight.kind !== 'ready') {
    return Object.freeze({
      kind: 'refused', durability: 'none',
      convergence: preflight.reason === 'ownership-revision-exhausted'
        ? 'read-only-reload' : 'none',
      detail: `preflight:${preflight.reason}`, transaction: null,
    });
  }

  let selected: Readonly<{
    settlement: Arc5ScoutSettlementV1;
    prepared: PreparedArc5OwnershipMigrationSuccessorV2;
    expectedState: SaveStateV2;
    extensionWrites: readonly V5ExtensionWrite[];
    starterCharter: StarterCharterActionFactV1 | null;
    witness: string;
  }> | null = null;
  let carrierProtection: Arc5OwnershipV2SuccessorProtectionReason | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: ARC5_SCOUT_ACTION_KIND_V1,
      receiptKind: ARC5_SCOUT_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft, extensions, canonicalizeState }) => {
        const settlement = settleArc5ScoutV1(preflight.preflight, receiptOrdinal);
        const prepared = prepareArc5OwnershipV2Successor({
          baseExtensions: extensions,
          parent: captured.ownershipV2,
          successor: settlement.successor,
          resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
        });
        if (prepared.kind !== 'prepared') {
          carrierProtection = prepared.reason;
          throw new Error(`Arc 5 Field Scout ownership carrier refused ${prepared.reason}`);
        }
        const charter = settlement.preflight.scoutAfter === null
          ? null
          : stageStarterCharterActionV1({
            draft,
            extensions,
            predecessorWrites: prepared.writes,
            predecessorWitness: settlement.witness,
            event: { kind: 'scout-set', scoutId: settlement.preflight.scoutAfter },
            receiptOrdinal,
          });
        if (charter !== null && charter.kind === 'refused') {
          throw new Error(`Arc 5 Field Scout starter Charter refused ${charter.reason}`);
        }
        const extensionWrites = charter === null ? prepared.writes : charter.extensionWrites;
        const witness = charter === null ? settlement.witness : charter.witness;
        selected = Object.freeze({
          settlement,
          prepared,
          expectedState: canonicalizeState(draft),
          extensionWrites,
          starterCharter: charter === null ? null : charter.fact,
          witness,
        });
        return Object.freeze({
          state: draft,
          extensionWrites,
          witness,
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
    settlement: Arc5ScoutSettlementV1;
    prepared: PreparedArc5OwnershipMigrationSuccessorV2;
    expectedState: SaveStateV2;
    extensionWrites: readonly V5ExtensionWrite[];
    starterCharter: StarterCharterActionFactV1 | null;
    witness: string;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-scout-evidence-missing', transaction,
    });
  }
  const committed = committedArc5OwnershipState(
    committedSelection.prepared,
    transaction.saved.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  const settlement = committedSelection.settlement;
  if (committed === null
    || transaction.plan.operation !== ARC5_SCOUT_ACTION_KIND_V1
    || transaction.plan.receiptOrdinal !== settlement.receiptEvidence.ordinal
    || transaction.receipt.ordinal !== settlement.receiptEvidence.ordinal
    || transaction.receipt.kind !== ARC5_SCOUT_RECEIPT_KIND_V1
    || transaction.receipt.witness !== committedSelection.witness
    || !sameJson(transaction.state, committedSelection.expectedState)
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || ownershipStateDigestV2(committed.state) !== ownershipStateDigestV2(settlement.successor)) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-scout-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    settlement, ownershipV2: committed.state, ownershipV2Evidence: committed.evidence,
    ownershipWrites: committedSelection.prepared.writes,
    extensionWrites: committedSelection.extensionWrites,
    starterCharter: committedSelection.starterCharter,
  });
}

/** Publish only the same-CAS Starter Charter/reward/progression successor.
 * Scout ownership itself remains published by the existing Arc 5 owner. */
export function publishArc5ScoutCharterFieldsV1(
  target: SaveStateV2,
  committed: SaveStateV2,
): void {
  publishStarterCharterActionFieldsV1(target, committed);
}
