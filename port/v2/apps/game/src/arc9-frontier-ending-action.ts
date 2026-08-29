/* Arc 9 Celestial Frontier ending action.

   Ending choice is a terminal campaign presentation choice, not a new
   economy or progression owner. The action accepts only the five imported
   compatibility ids, proves all nine current Prime claims (and the exact
   legacy Balance predicate where applicable), then performs one F4 receipt
   CAS that changes only `frontierEnding`. There is no retry or optimistic
   publication here. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import {
  isKnownFrontierEndingId,
  type FrontierEndingId,
  type SaveStateV2,
} from '@cf/persistence';
import {
  projectPrimeCodexV1,
  type PrimeCodexProjectionV1,
  type PrimeCodexProtectionReasonV1,
} from './prime-codex-panel.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC9_FRONTIER_ENDING_OPERATION_V1 = 'arc9-frontier-ending-v1';
export const ARC9_FRONTIER_ENDING_RECEIPT_KIND_V1 = 'arc9-frontier-ending-v1';

export type Arc9FrontierEndingProtectionReasonV1 =
  | PrimeCodexProtectionReasonV1
  | 'ending-id-malformed'
  | 'frontier-locked'
  | 'balance-locked'
  | 'ending-already-chosen'
  | 'projection-mismatch';

export interface Arc9FrontierEndingReadyV1 {
  readonly kind: 'ready';
  readonly endingId: FrontierEndingId;
  readonly source: PrimeCodexProjectionV1;
  readonly successor: PrimeCodexProjectionV1;
  readonly successorState: SaveStateV2;
}

export type Arc9FrontierEndingPreparationV1 =
  | Arc9FrontierEndingReadyV1
  | Readonly<{
    kind: 'current';
    endingId: FrontierEndingId;
    projection: PrimeCodexProjectionV1;
  }>
  | Readonly<{ kind: 'protected'; reason: Arc9FrontierEndingProtectionReasonV1 }>;

/** Pure exact-current preparation. A known chosen ending is idempotent only
 * for itself; neither another known choice nor an unknown imported token can
 * be overwritten. */
export function prepareArc9FrontierEndingChoiceV1(
  state: SaveStateV2,
  requestedEndingId: unknown,
): Arc9FrontierEndingPreparationV1 {
  if (!isKnownFrontierEndingId(requestedEndingId)) {
    return Object.freeze({ kind: 'protected', reason: 'ending-id-malformed' });
  }
  const source = projectPrimeCodexV1(state);
  if (source.kind !== 'projected') {
    return Object.freeze({ kind: 'protected', reason: source.reason! });
  }
  if (source.frontier.kind === 'locked') {
    return Object.freeze({ kind: 'protected', reason: 'frontier-locked' });
  }
  if (source.frontier.kind === 'protected') {
    return Object.freeze({ kind: 'protected', reason: source.reason ?? 'projection-mismatch' });
  }
  if (source.frontier.kind === 'chosen') {
    return source.frontier.ending.id === requestedEndingId
      ? Object.freeze({ kind: 'current', endingId: requestedEndingId, projection: source })
      : Object.freeze({ kind: 'protected', reason: 'ending-already-chosen' });
  }
  if (requestedEndingId === 'balance' && !source.frontier.balance.unlocked) {
    return Object.freeze({ kind: 'protected', reason: 'balance-locked' });
  }
  const successorState: SaveStateV2 = { ...state, frontierEnding: requestedEndingId };
  const successor = projectPrimeCodexV1(successorState);
  if (successor.kind !== 'projected' || successor.frontier.kind !== 'chosen'
    || successor.frontier.ending.id !== requestedEndingId
    || successor.claimedCount !== source.claimedCount) {
    return Object.freeze({ kind: 'protected', reason: 'projection-mismatch' });
  }
  return Object.freeze({
    kind: 'ready', endingId: requestedEndingId, source, successor, successorState,
  });
}

export interface Arc9FrontierEndingActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly requestedEndingId: unknown;
  readonly codecNow: number;
}

export type Arc9FrontierEndingActionOutcomeV1 =
  | Readonly<{
    kind: 'current';
    durability: 'none';
    convergence: 'none';
    endingId: FrontierEndingId;
    projection: PrimeCodexProjectionV1;
    transaction: null;
  }>
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    endingId: FrontierEndingId;
    projection: PrimeCodexProjectionV1;
    witness: string;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-ending-evidence-missing' | 'committed-ending-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: 'input:invalid-or-unregistered'
      | `preflight:${Arc9FrontierEndingProtectionReasonV1}`
      | `transaction:${string}`;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly requestedEndingId: unknown;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze([
  'runtime', 'state', 'requestedEndingId', 'codecNow',
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
  if (typeof value !== 'object') throw new TypeError('ending state must contain only plain data');
  if (depth > 256 || budget.count >= CLONE_LIMIT) {
    throw new RangeError('ending state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('ending state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('ending arrays must use the native prototype');
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      const keys = Reflect.ownKeys(value);
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('ending arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('ending arrays cannot contain accessors or holes');
        }
        clone.push(clonePlain(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('ending state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('ending state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('ending state cannot contain accessors or hidden fields');
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

function capture(input: Arc9FrontierEndingActionInputV1): CapturedInput | null {
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
      requestedEndingId: values.requestedEndingId,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function projectionDigest(projection: PrimeCodexProjectionV1): string {
  return sha256Hex(canonicalJson({
    schema: projection.schema,
    kind: projection.kind,
    reason: projection.reason,
    claims: projection.rows.map(({ definition, claim }) => ({ id: definition.id, claim })),
    claimedCount: projection.claimedCount,
    frontierUnlocked: projection.frontierUnlocked,
    frontier: projection.frontier,
  }));
}

function witnessFor(plan: Arc9FrontierEndingReadyV1, receiptOrdinal: number): string {
  return `arc9e1:${sha256Hex(canonicalJson({
    operation: ARC9_FRONTIER_ENDING_OPERATION_V1,
    receiptOrdinal,
    endingId: plan.endingId,
    source: projectionDigest(plan.source),
    successor: projectionDigest(plan.successor),
  }))}`;
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): `transaction:${string}` {
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

/** One strict ending attempt, one receipt, one revision CAS, no retry. */
export async function commitArc9FrontierEndingChoiceV1(
  input: Arc9FrontierEndingActionInputV1,
): Promise<Arc9FrontierEndingActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const preflight = prepareArc9FrontierEndingChoiceV1(
    captured.state,
    captured.requestedEndingId,
  );
  if (preflight.kind === 'protected') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `preflight:${preflight.reason}`, transaction: null,
    });
  }
  if (preflight.kind === 'current') {
    return Object.freeze({
      kind: 'current', durability: 'none', convergence: 'none', transaction: null,
      endingId: preflight.endingId, projection: preflight.projection,
    });
  }

  let selected: Readonly<{ plan: Arc9FrontierEndingReadyV1; witness: string }> | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: ARC9_FRONTIER_ENDING_OPERATION_V1,
      receiptKind: ARC9_FRONTIER_ENDING_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft }) => {
        const plan = prepareArc9FrontierEndingChoiceV1(draft, captured.requestedEndingId);
        if (plan.kind !== 'ready'
          || plan.endingId !== preflight.endingId
          || projectionDigest(plan.source) !== projectionDigest(preflight.source)
          || projectionDigest(plan.successor) !== projectionDigest(preflight.successor)) {
          throw new Error('Arc 9 Frontier ending parent changed before derivation');
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
    plan: Arc9FrontierEndingReadyV1;
    witness: string;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-ending-evidence-missing', transaction,
    });
  }
  const { plan, witness } = committedSelection;
  const fixedPoint = prepareArc9FrontierEndingChoiceV1(transaction.state, plan.endingId);
  const committedProjection = fixedPoint.kind === 'current' ? fixedPoint.projection : null;
  if (committedProjection === null
    || transaction.plan.operation !== ARC9_FRONTIER_ENDING_OPERATION_V1
    || transaction.plan.receiptOrdinal !== transaction.receipt.ordinal
    || transaction.receipt.kind !== ARC9_FRONTIER_ENDING_RECEIPT_KIND_V1
    || transaction.receipt.witness !== witness
    || transaction.state.frontierEnding !== plan.endingId
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(transaction.state, plan.successorState)
    || projectionDigest(committedProjection) !== projectionDigest(plan.successor)) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-ending-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    endingId: plan.endingId, projection: committedProjection, witness,
  });
}
