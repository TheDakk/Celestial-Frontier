/* Arc 9 explorer self-rename product action.

   This is the v2 durability boundary for the mature Settings → Nameplate
   `✎ Change name` interaction. It reuses the byte-verbatim `cleanName`
   policy, changes only `explorerName`, mints one immutable receipt, and
   crosses one F4 revision CAS. It never unlocks the discovery `namer`
   achievement: that event remains owned by exact companion/discovery rename. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import { cleanName } from '@cf/domain-naming';
import type { SaveStateV2 } from '@cf/persistence';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC9_EXPLORER_NAME_OPERATION_V1 = 'arc9-explorer-name-v1';
export const ARC9_EXPLORER_NAME_RECEIPT_KIND_V1 = 'arc9-explorer-name-v1';
export const ARC9_EXPLORER_NAME_MAX_CHARS_V1 = 24;

export type Arc9ExplorerNameProtectionReasonV1 =
  | 'state-name-shape'
  | 'raw-name-shape'
  | 'successor-mismatch';

export interface Arc9ExplorerNameReadyV1 {
  readonly kind: 'ready';
  readonly previousName: string;
  readonly explorerName: string;
  readonly sourceState: SaveStateV2;
  readonly successorState: SaveStateV2;
  readonly sourceDigest: string;
  readonly successorDigest: string;
}

export type Arc9ExplorerNamePreparationV1 =
  | Arc9ExplorerNameReadyV1
  | Readonly<{
    kind: 'noop';
    reason: 'cleaned-empty' | 'unchanged';
    previousName: string;
    cleanedName: string;
  }>
  | Readonly<{ kind: 'protected'; reason: Arc9ExplorerNameProtectionReasonV1 }>;

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function canonicalStateDigest(state: SaveStateV2): string {
  return sha256Hex(canonicalJson(state));
}

function exactExplorerName(state: SaveStateV2): string | null {
  const descriptor = Object.getOwnPropertyDescriptor(state, 'explorerName');
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
    || typeof descriptor.value !== 'string'
    || cleanName(descriptor.value, ARC9_EXPLORER_NAME_MAX_CHARS_V1) !== descriptor.value) {
    return null;
  }
  return descriptor.value;
}

/** Pure preparation. Cleaned-empty and unchanged input are explicit no-ops,
 * so neither can consume an F4 receipt or repository write. */
export function prepareArc9ExplorerNameChangeV1(
  state: SaveStateV2,
  rawName: unknown,
): Arc9ExplorerNamePreparationV1 {
  const previousName = exactExplorerName(state);
  if (previousName === null) {
    return Object.freeze({ kind: 'protected', reason: 'state-name-shape' });
  }
  if (typeof rawName !== 'string') {
    return Object.freeze({ kind: 'protected', reason: 'raw-name-shape' });
  }
  const explorerName = cleanName(rawName, ARC9_EXPLORER_NAME_MAX_CHARS_V1);
  if (!explorerName) {
    return Object.freeze({
      kind: 'noop', reason: 'cleaned-empty', previousName, cleanedName: explorerName,
    });
  }
  if (explorerName === previousName) {
    return Object.freeze({
      kind: 'noop', reason: 'unchanged', previousName, cleanedName: explorerName,
    });
  }
  const successorState: SaveStateV2 = { ...state, explorerName };
  const restoredSource: SaveStateV2 = { ...successorState, explorerName: previousName };
  if (exactExplorerName(successorState) !== explorerName
    || !sameJson(restoredSource, state)) {
    return Object.freeze({ kind: 'protected', reason: 'successor-mismatch' });
  }
  return Object.freeze({
    kind: 'ready', previousName, explorerName,
    sourceState: state,
    successorState,
    sourceDigest: canonicalStateDigest(state),
    successorDigest: canonicalStateDigest(successorState),
  });
}

export interface Arc9ExplorerNameActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly rawName: string;
  readonly codecNow: number;
}

export type Arc9ExplorerNameActionOutcomeV1 =
  | Readonly<{
    kind: 'noop';
    durability: 'none';
    convergence: 'none';
    reason: 'cleaned-empty' | 'unchanged';
    previousName: string;
    cleanedName: string;
    transaction: null;
  }>
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    previousName: string;
    explorerName: string;
    witness: string;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-explorer-name-evidence-missing'
      | 'committed-explorer-name-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: 'input:invalid-or-unregistered'
      | `preflight:${Arc9ExplorerNameProtectionReasonV1}`
      | `transaction:${string}`;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly rawName: string;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze(['runtime', 'state', 'rawName', 'codecNow'] as const);
const CLONE_LIMIT = 1_500_000;

function clonePlain(
  value: unknown,
  ancestors: Set<object>,
  budget: { count: number },
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('explorer name state must contain only plain data');
  if (depth > 256 || budget.count >= CLONE_LIMIT) {
    throw new RangeError('explorer name state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('explorer name state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) {
        throw new TypeError('explorer name arrays must use the native prototype');
      }
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      const keys = Reflect.ownKeys(value);
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('explorer name arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('explorer name arrays cannot contain accessors or holes');
        }
        clone.push(clonePlain(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('explorer name state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('explorer name state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('explorer name state cannot contain accessors or hidden fields');
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

function capture(input: Arc9ExplorerNameActionInputV1): CapturedInput | null {
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
      || typeof values.rawName !== 'string'
      || typeof values.codecNow !== 'number' || !Number.isFinite(values.codecNow)) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state: clonePlain(values.state, new Set<object>(), { count: 0 }, 0) as SaveStateV2,
      rawName: values.rawName,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function witnessFor(plan: Arc9ExplorerNameReadyV1, receiptOrdinal: number): string {
  return `arc9e1:${sha256Hex(canonicalJson({
    operation: ARC9_EXPLORER_NAME_OPERATION_V1,
    receiptOrdinal,
    previousName: plan.previousName,
    explorerName: plan.explorerName,
    sourceDigest: plan.sourceDigest,
    successorDigest: plan.successorDigest,
  }))}`;
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

/** One strict explorer-name attempt, one receipt, one revision CAS, no retry. */
export async function commitArc9ExplorerNameChangeV1(
  input: Arc9ExplorerNameActionInputV1,
): Promise<Arc9ExplorerNameActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const preflight = prepareArc9ExplorerNameChangeV1(captured.state, captured.rawName);
  if (preflight.kind === 'protected') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `preflight:${preflight.reason}`, transaction: null,
    });
  }
  if (preflight.kind === 'noop') {
    return Object.freeze({
      ...preflight, durability: 'none', convergence: 'none', transaction: null,
    });
  }

  let selected: Readonly<{
    plan: Arc9ExplorerNameReadyV1;
    witness: string;
    expectedState: SaveStateV2;
    expectedSourceState: SaveStateV2;
  }> | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: ARC9_EXPLORER_NAME_OPERATION_V1,
      receiptKind: ARC9_EXPLORER_NAME_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft, canonicalizeState }) => {
        const plan = prepareArc9ExplorerNameChangeV1(draft, captured.rawName);
        if (plan.kind !== 'ready'
          || plan.previousName !== preflight.previousName
          || plan.explorerName !== preflight.explorerName
          || plan.sourceDigest !== preflight.sourceDigest
          || plan.successorDigest !== preflight.successorDigest) {
          throw new Error('Arc 9 explorer name parent changed before derivation');
        }
        const witness = witnessFor(plan, receiptOrdinal);
        selected = Object.freeze({
          plan,
          witness,
          expectedState: canonicalizeState(plan.successorState),
          expectedSourceState: canonicalizeState(plan.sourceState),
        });
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
    plan: Arc9ExplorerNameReadyV1;
    witness: string;
    expectedState: SaveStateV2;
    expectedSourceState: SaveStateV2;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-explorer-name-evidence-missing', transaction,
    });
  }
  const { plan, witness } = committedSelection;
  const fixedPoint = prepareArc9ExplorerNameChangeV1(transaction.state, plan.explorerName);
  const unrelatedRestored: SaveStateV2 = {
    ...transaction.state,
    explorerName: plan.previousName,
  };
  if (fixedPoint.kind !== 'noop' || fixedPoint.reason !== 'unchanged'
    || transaction.plan.operation !== ARC9_EXPLORER_NAME_OPERATION_V1
    || transaction.plan.receiptOrdinal !== transaction.receipt.ordinal
    || transaction.receipt.kind !== ARC9_EXPLORER_NAME_RECEIPT_KIND_V1
    || transaction.receipt.witness !== witness
    || transaction.state.explorerName !== plan.explorerName
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(transaction.state, committedSelection.expectedState)
    || !sameJson(unrelatedRestored, committedSelection.expectedSourceState)
    || canonicalStateDigest(transaction.state)
      !== canonicalStateDigest(committedSelection.expectedState)) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-explorer-name-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    previousName: plan.previousName, explorerName: plan.explorerName, witness,
  });
}
