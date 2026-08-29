/* Arc 9 saved-nameplate product action.

   Read compatibility may retain a formerly locked `nameHue` and project the
   current rank instead. This write boundary is stricter: one detached input,
   one immutable receipt, and one F4 CAS may persist only Auto (`-1`) or a
   rank color proved earned by the durable best-rank mirror. No retry or
   optimistic publication is owned here. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import {
  prepareExplorerNameplateChoice,
  type ExplorerNameplateProjection,
} from '@cf/domain-progression';
import type { SaveStateV2 } from '@cf/persistence';
import {
  projectArc9ProgressionStateV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
  type Arc9ProgressionProjectionV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC9_NAMEPLATE_CHOICE_OPERATION_V1 = 'arc9-nameplate-choice-v1';
export const ARC9_NAMEPLATE_CHOICE_RECEIPT_KIND_V1 = 'arc9-nameplate-choice-v1';

export type Arc9NameplateChoiceProtectionReasonV1 =
  | Arc9ProgressionProjectionProtectionReasonV1
  | 'saved-choice-shape'
  | 'choice-malformed'
  | 'choice-locked'
  | 'projection-mismatch';

export interface Arc9NameplateChoiceReadyV1 {
  readonly kind: 'ready';
  readonly choiceIndex: number;
  readonly priorChoiceIndex: number;
  readonly source: Arc9ProgressionProjectionV1;
  readonly successor: Arc9ProgressionProjectionV1;
  readonly successorState: SaveStateV2;
  readonly nameplate: ExplorerNameplateProjection;
}

export type Arc9NameplateChoicePreparationV1 =
  | Arc9NameplateChoiceReadyV1
  | Readonly<{
    kind: 'current';
    choiceIndex: number;
    projection: Arc9ProgressionProjectionV1;
    nameplate: ExplorerNameplateProjection;
  }>
  | Readonly<{ kind: 'protected'; reason: Arc9NameplateChoiceProtectionReasonV1 }>;

function savedChoiceIndex(state: SaveStateV2): number | null {
  const descriptor = Object.getOwnPropertyDescriptor(state, 'nameHue');
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
    || !Number.isSafeInteger(descriptor.value)
    || descriptor.value < -1 || descriptor.value > 9) return null;
  return descriptor.value as number;
}

/** Pure write preparation. The unlocked boundary is the durable saved
 * best-rank index, never a future rank or an aggregate inferred by this
 * preference action. */
export function prepareArc9NameplateChoiceV1(
  state: SaveStateV2,
  requestedChoiceIndex: unknown,
): Arc9NameplateChoicePreparationV1 {
  const source = projectArc9ProgressionStateV1(state);
  if (source.kind !== 'projected') return source;
  const priorChoiceIndex = savedChoiceIndex(state);
  if (priorChoiceIndex === null) {
    return Object.freeze({ kind: 'protected', reason: 'saved-choice-shape' });
  }
  const choice = prepareExplorerNameplateChoice(
    source.projection.rank,
    source.projection.savedBestRankIndex,
    requestedChoiceIndex,
  );
  if (choice.kind === 'rejected') {
    return Object.freeze({ kind: 'protected', reason: choice.reason });
  }
  if (choice.choiceIndex === priorChoiceIndex) {
    return Object.freeze({
      kind: 'current',
      choiceIndex: choice.choiceIndex,
      projection: source.projection,
      nameplate: choice.nameplate,
    });
  }
  const successorState: SaveStateV2 = { ...state, nameHue: choice.choiceIndex };
  const successor = projectArc9ProgressionStateV1(successorState);
  if (successor.kind !== 'projected'
    || successor.projection.savedBestRankIndex !== source.projection.savedBestRankIndex
    || successor.projection.rank.score !== source.projection.rank.score
    || successor.projection.nameplate.rankIndex !== choice.nameplate.rankIndex
    || successor.projection.nameplate.hue !== choice.nameplate.hue
    || successor.projection.nameplate.iridescent !== choice.nameplate.iridescent
    || successor.projection.nameplate.usedSavedChoice !== choice.nameplate.usedSavedChoice) {
    return Object.freeze({ kind: 'protected', reason: 'projection-mismatch' });
  }
  return Object.freeze({
    kind: 'ready',
    choiceIndex: choice.choiceIndex,
    priorChoiceIndex,
    source: source.projection,
    successor: successor.projection,
    successorState,
    nameplate: choice.nameplate,
  });
}

export interface Arc9NameplateChoiceActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly requestedChoiceIndex: number;
  readonly codecNow: number;
}

export type Arc9NameplateChoiceActionOutcomeV1 =
  | Readonly<{
    kind: 'current';
    durability: 'none';
    convergence: 'none';
    choiceIndex: number;
    projection: Arc9ProgressionProjectionV1;
    nameplate: ExplorerNameplateProjection;
    transaction: null;
  }>
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    choiceIndex: number;
    priorChoiceIndex: number;
    projection: Arc9ProgressionProjectionV1;
    nameplate: ExplorerNameplateProjection;
    witness: string;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-nameplate-evidence-missing' | 'committed-nameplate-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: 'input:invalid-or-unregistered'
      | `preflight:${Arc9NameplateChoiceProtectionReasonV1}`
      | `transaction:${string}`;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly requestedChoiceIndex: unknown;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze([
  'runtime', 'state', 'requestedChoiceIndex', 'codecNow',
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
  if (typeof value !== 'object') throw new TypeError('nameplate state must contain only plain data');
  if (depth > 256 || budget.count >= CLONE_LIMIT) {
    throw new RangeError('nameplate state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('nameplate state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('nameplate arrays must use the native prototype');
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      const keys = Reflect.ownKeys(value);
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('nameplate arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('nameplate arrays cannot contain accessors or holes');
        }
        clone.push(clonePlain(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('nameplate state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('nameplate state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('nameplate state cannot contain accessors or hidden fields');
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

function capture(input: Arc9NameplateChoiceActionInputV1): CapturedInput | null {
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
      requestedChoiceIndex: values.requestedChoiceIndex,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function nameplateDigest(projection: Arc9ProgressionProjectionV1): string {
  return sha256Hex(canonicalJson({
    schema: projection.schema,
    score: projection.rank.score,
    rankIndex: projection.rank.index,
    savedBestRankIndex: projection.savedBestRankIndex,
    nameplate: projection.nameplate,
  }));
}

function witnessFor(plan: Arc9NameplateChoiceReadyV1, receiptOrdinal: number): string {
  return `arc9n1:${sha256Hex(canonicalJson({
    operation: ARC9_NAMEPLATE_CHOICE_OPERATION_V1,
    receiptOrdinal,
    priorChoiceIndex: plan.priorChoiceIndex,
    choiceIndex: plan.choiceIndex,
    source: nameplateDigest(plan.source),
    successor: nameplateDigest(plan.successor),
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

/** One strict nameplate attempt, one receipt, one revision CAS, no retry. */
export async function commitArc9NameplateChoiceV1(
  input: Arc9NameplateChoiceActionInputV1,
): Promise<Arc9NameplateChoiceActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const preflight = prepareArc9NameplateChoiceV1(
    captured.state,
    captured.requestedChoiceIndex,
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
      choiceIndex: preflight.choiceIndex,
      projection: preflight.projection,
      nameplate: preflight.nameplate,
    });
  }

  let selected: Readonly<{ plan: Arc9NameplateChoiceReadyV1; witness: string }> | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: ARC9_NAMEPLATE_CHOICE_OPERATION_V1,
      receiptKind: ARC9_NAMEPLATE_CHOICE_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft }) => {
        const plan = prepareArc9NameplateChoiceV1(draft, captured.requestedChoiceIndex);
        if (plan.kind !== 'ready'
          || plan.choiceIndex !== preflight.choiceIndex
          || plan.priorChoiceIndex !== preflight.priorChoiceIndex
          || nameplateDigest(plan.source) !== nameplateDigest(preflight.source)
          || nameplateDigest(plan.successor) !== nameplateDigest(preflight.successor)) {
          throw new Error('Arc 9 nameplate parent changed before derivation');
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
    plan: Arc9NameplateChoiceReadyV1;
    witness: string;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-nameplate-evidence-missing', transaction,
    });
  }
  const { plan, witness } = committedSelection;
  const fixedPoint = prepareArc9NameplateChoiceV1(transaction.state, plan.choiceIndex);
  const committedProjection = fixedPoint.kind === 'current' ? fixedPoint.projection : null;
  if (committedProjection === null
    || transaction.plan.operation !== ARC9_NAMEPLATE_CHOICE_OPERATION_V1
    || transaction.plan.receiptOrdinal !== transaction.receipt.ordinal
    || transaction.receipt.kind !== ARC9_NAMEPLATE_CHOICE_RECEIPT_KIND_V1
    || transaction.receipt.witness !== witness
    || transaction.state.nameHue !== plan.choiceIndex
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(transaction.state, plan.successorState)
    || nameplateDigest(committedProjection) !== nameplateDigest(plan.successor)) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-nameplate-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    choiceIndex: plan.choiceIndex,
    priorChoiceIndex: plan.priorChoiceIndex,
    projection: committedProjection,
    nameplate: committedProjection.nameplate,
    witness,
  });
}
