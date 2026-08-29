/* Arc 9 receipt-bearing aggregate progression refresh.

   One detached attempt appends only aggregate-derived achievement ids and
   raises the historical best-rank mirror. The save, F4 authority, immutable
   receipt, lease fence, and next repository revision share one CAS. There is
   no retry, optimistic publication, event-achievement inference, or second
   progression carrier. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import type { SaveStateV2 } from '@cf/persistence';
import {
  prepareArc9ProgressionRefreshV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
  type Arc9ProgressionProjectionV1,
  type Arc9ProgressionRefreshReadyV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC9_PROGRESSION_REFRESH_OPERATION_V1 = 'arc9-progression-refresh-v1';
export const ARC9_PROGRESSION_REFRESH_RECEIPT_KIND_V1 = 'arc9-progression-refresh-v1';

export interface Arc9ProgressionRefreshActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly codecNow: number;
}

export type Arc9ProgressionRefreshActionRefusalDetailV1 =
  | 'input:invalid-or-unregistered'
  | `preflight:${Arc9ProgressionProjectionProtectionReasonV1}`
  | `transaction:${string}`;

export type Arc9ProgressionRefreshActionOutcomeV1 =
  | Readonly<{
    kind: 'current';
    durability: 'none';
    convergence: 'none';
    projection: Arc9ProgressionProjectionV1;
    transaction: null;
  }>
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    projection: Arc9ProgressionProjectionV1;
    addedAchievementIds: readonly string[];
    priorBestRankIndex: number;
    nextBestRankIndex: number;
    witness: string;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-progression-evidence-missing' | 'committed-progression-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: Arc9ProgressionRefreshActionRefusalDetailV1;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze(['runtime', 'state', 'codecNow'] as const);
const CLONE_LIMIT = 1_500_000;

function clonePlain(
  value: unknown,
  ancestors: Set<object>,
  budget: { count: number },
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('progression state must contain only plain data');
  if (depth > 256 || budget.count >= CLONE_LIMIT) {
    throw new RangeError('progression state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('progression state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('progression arrays must use the native prototype');
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      const keys = Reflect.ownKeys(value);
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('progression arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('progression arrays cannot contain accessors or holes');
        }
        clone.push(clonePlain(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('progression state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('progression state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('progression state cannot contain accessors or hidden fields');
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

function capture(input: Arc9ProgressionRefreshActionInputV1): CapturedInput | null {
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
    if (!values.state || typeof values.state !== 'object' || Array.isArray(values.state)
      || typeof values.codecNow !== 'number' || !Number.isFinite(values.codecNow)) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state: clonePlain(values.state, new Set<object>(), { count: 0 }, 0) as SaveStateV2,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function projectionDigest(projection: Arc9ProgressionProjectionV1): string {
  return sha256Hex(canonicalJson({
    schema: projection.schema,
    snapshot: projection.snapshot,
    unlockedIds: projection.unlockedIds,
    rankRecord: projection.rankRecord,
    rank: {
      score: projection.rank.score,
      index: projection.rank.index,
      floor: projection.rank.floor,
      prestigeLevel: projection.rank.prestigeLevel,
    },
    savedBestRankIndex: projection.savedBestRankIndex,
    projectedBestRankIndex: projection.rewards.bestRankIndex,
  }));
}

function witnessFor(plan: Arc9ProgressionRefreshReadyV1, receiptOrdinal: number): string {
  return `arc9p1:${sha256Hex(canonicalJson({
    operation: ARC9_PROGRESSION_REFRESH_OPERATION_V1,
    receiptOrdinal,
    source: projectionDigest(plan.source),
    successor: projectionDigest(plan.successor),
    addedAchievementIds: plan.addedAchievementIds,
    priorBestRankIndex: plan.priorBestRankIndex,
    nextBestRankIndex: plan.nextBestRankIndex,
  }))}`;
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): Arc9ProgressionRefreshActionRefusalDetailV1 {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') {
    return `transaction:${outcome.message}`;
  }
  if (outcome.kind === 'protected') return `transaction:protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `transaction:lost:${outcome.reason}`;
  return `transaction:${outcome.kind}`;
}

function needsReload(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): boolean {
  return outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt' || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable' || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

/** One aggregate refresh attempt, one receipt, one revision CAS, no retry. */
export async function commitArc9ProgressionRefreshV1(
  input: Arc9ProgressionRefreshActionInputV1,
): Promise<Arc9ProgressionRefreshActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const preflight = prepareArc9ProgressionRefreshV1(captured.state);
  if (preflight.kind === 'protected') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `preflight:${preflight.reason}`, transaction: null,
    });
  }
  if (preflight.kind === 'current') {
    return Object.freeze({
      kind: 'current', durability: 'none', convergence: 'none',
      projection: preflight.projection, transaction: null,
    });
  }

  let selected: Readonly<{ plan: Arc9ProgressionRefreshReadyV1; witness: string }> | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: ARC9_PROGRESSION_REFRESH_OPERATION_V1,
      receiptKind: ARC9_PROGRESSION_REFRESH_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft }) => {
        const plan = prepareArc9ProgressionRefreshV1(draft);
        if (plan.kind !== 'ready'
          || !sameJson(plan.addedAchievementIds, preflight.addedAchievementIds)
          || plan.priorBestRankIndex !== preflight.priorBestRankIndex
          || plan.nextBestRankIndex !== preflight.nextBestRankIndex
          || projectionDigest(plan.source) !== projectionDigest(preflight.source)
          || projectionDigest(plan.successor) !== projectionDigest(preflight.successor)) {
          throw new Error('Arc 9 progression parent changed before derivation');
        }
        const witness = witnessFor(plan, receiptOrdinal);
        selected = Object.freeze({ plan, witness });
        return Object.freeze({ state: plan.successorState, witness });
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
      convergence: needsReload(transaction) ? 'read-only-reload' : 'none',
      detail: transactionDetail(transaction), transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    plan: Arc9ProgressionRefreshReadyV1;
    witness: string;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-progression-evidence-missing', transaction,
    });
  }
  const fixedPoint = prepareArc9ProgressionRefreshV1(transaction.state);
  const committedProjection = fixedPoint.kind === 'current' ? fixedPoint.projection : null;
  const { plan, witness } = committedSelection;
  if (committedProjection === null
    || transaction.plan.operation !== ARC9_PROGRESSION_REFRESH_OPERATION_V1
    || transaction.plan.receiptOrdinal !== transaction.receipt.ordinal
    || transaction.receipt.kind !== ARC9_PROGRESSION_REFRESH_RECEIPT_KIND_V1
    || transaction.receipt.witness !== witness
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(transaction.state.unlocked, plan.successor.unlockedIds)
    || transaction.state.stats.bestRank !== plan.nextBestRankIndex
    || projectionDigest(committedProjection) !== projectionDigest(plan.successor)) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-progression-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    projection: committedProjection,
    addedAchievementIds: plan.addedAchievementIds,
    priorBestRankIndex: plan.priorBestRankIndex,
    nextBestRankIndex: plan.nextBestRankIndex,
    witness,
  });
}
