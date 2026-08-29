/* Arc 9 durable Star Atlas favorite owner.

   One exact imported Atlas id and one desired boolean cross one detached F4
   receipt/CAS. A false -> true edge is the sole owner of the permanent
   `curator` achievement; true -> false never removes it, and an imported
   favorite does not retroactively infer it. Publication mutates only the
   verified target row's `fav` field in place so Atlas entry identity and its
   WeakMap route sidecar remain intact. There is no route input, RNG, retry,
   optimistic mutation, or receipt for an unchanged value. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import type { SaveStateV2 } from '@cf/persistence';
import { CF1_WORLD_ATLAS_ID_MAX_CHARS } from '@cf/scene';
import {
  prepareArc9EventAchievementJoinV1,
  prepareArc9ProgressionRefreshV1,
  projectArc9ProgressionStateV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
  type Arc9ProgressionProjectionV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC9_ATLAS_FAVORITE_RECEIPT_KIND_V1 = 'arc9-atlas-favorite-v1' as const;
export const ARC9_ATLAS_FAVORITE_WITNESS_SCHEMA_V1 =
  'cf-v2-arc9-atlas-favorite-witness/v1' as const;
const ARC9_ATLAS_FAVORITE_OPERATION_PREFIX_V1 = 'arc9.atlas-favorite:';
const ARC9_ATLAS_SEAL_SCHEMA_V1 = 'cf-v2-arc9-atlas-rows/v1';
/* exportSaveV2 is the durable owner and retains exactly its newest 120 rows.
   Refuse a historical over-cap parent instead of letting this unrelated
   favorite write silently sort/drop Atlas history during codec closure. */
const MAX_ATLAS_ROWS = 120;
const MAX_CLONE_NODES = 1_500_000;
const MAX_CLONE_CHARACTERS = 16 * 1024 * 1024;
const MAX_DEPTH = 256;
const MAX_RANK_INDEX = 9;

export type Arc9AtlasFavoriteProtectionReasonV1 =
  | 'atlas-id-shape'
  | 'desired-shape'
  | 'state-shape'
  | 'atlas-shape'
  | 'atlas-capacity'
  | 'atlas-id-duplicate'
  | 'atlas-target-missing'
  | 'atlas-target-shape'
  | `achievement:${Arc9ProgressionProjectionProtectionReasonV1}`
  | `progression:${Arc9ProgressionProjectionProtectionReasonV1}`
  | 'progression-fixed-point';

export interface Arc9AtlasFavoriteReadyV1 {
  readonly kind: 'ready';
  readonly operation: string;
  readonly receiptKind: typeof ARC9_ATLAS_FAVORITE_RECEIPT_KIND_V1;
  readonly atlasId: string;
  readonly targetIndex: number;
  readonly favoriteBefore: boolean;
  readonly favoriteAfter: boolean;
  readonly sourceAtlasSeal: string;
  readonly successorAtlasSeal: string;
  readonly curatorAdded: boolean;
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
  readonly addedAggregateAchievementIds: readonly string[];
  readonly successorState: SaveStateV2;
  readonly projection: Arc9ProgressionProjectionV1;
}

export type Arc9AtlasFavoritePreparationV1 =
  | Arc9AtlasFavoriteReadyV1
  | Readonly<{
    kind: 'current';
    atlasId: string;
    targetIndex: number;
    favorite: boolean;
    atlasSeal: string;
    projection: Arc9ProgressionProjectionV1;
  }>
  | Readonly<{ kind: 'protected'; reason: Arc9AtlasFavoriteProtectionReasonV1 }>;

class AtlasFavoriteProtection extends Error {
  constructor(readonly reason: Arc9AtlasFavoriteProtectionReasonV1) {
    super(reason);
  }
}

function protect(reason: Arc9AtlasFavoriteProtectionReasonV1): never {
  throw new AtlasFavoriteProtection(reason);
}

interface CloneBudget { nodes: number; characters: number; }

function consumeCloneBudget(budget: CloneBudget, nodes: number, characters = 0): void {
  if (budget.nodes > MAX_CLONE_NODES - nodes
    || budget.characters > MAX_CLONE_CHARACTERS - characters) {
    throw new RangeError('Arc 9 Atlas favorite state exceeds its detachment bound');
  }
  budget.nodes += nodes;
  budget.characters += characters;
}

function defineData(target: object, key: string, value: unknown): void {
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
  budget: CloneBudget,
  depth: number,
): unknown {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Atlas favorite numbers must be finite');
    return value;
  }
  if (typeof value === 'string') {
    consumeCloneBudget(budget, 0, value.length);
    return value;
  }
  if (typeof value !== 'object' || depth > MAX_DEPTH || ancestors.has(value)) {
    throw new TypeError('Atlas favorite state must be acyclic plain JSON data');
  }
  consumeCloneBudget(budget, 1);
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype || value.length > MAX_CLONE_NODES) {
        throw new TypeError('Atlas favorite arrays must be bounded and native');
      }
      const keys = Reflect.ownKeys(value);
      if (keys.length !== value.length + 1
        || keys.some((key) => typeof key !== 'string'
          || (key !== 'length' && !/^(?:0|[1-9][0-9]*)$/u.test(key)))) {
        throw new TypeError('Atlas favorite arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Atlas favorite arrays cannot contain holes or accessors');
        }
        clone.push(clonePlainData(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Atlas favorite objects must use a plain prototype');
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== 'string')) {
      throw new TypeError('Atlas favorite state cannot contain symbols');
    }
    const clone: Record<string, unknown> = prototype === null ? Object.create(null) : {};
    for (const key of keys as string[]) {
      consumeCloneBudget(budget, 0, key.length);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Atlas favorite state cannot contain accessors or hidden fields');
      }
      defineData(
        clone,
        key,
        clonePlainData(descriptor.value, ancestors, budget, depth + 1),
      );
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
}

function detached<T>(value: T): T {
  return clonePlainData(
    value,
    new Set<object>(),
    { nodes: 0, characters: 0 },
    0,
  ) as T;
}

function plainRecord(
  value: unknown,
  reason: Arc9AtlasFavoriteProtectionReasonV1,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) protect(reason);
  const prototype = Object.getPrototypeOf(value);
  if ((prototype !== Object.prototype && prototype !== null)
    || Reflect.ownKeys(value).some((key) => typeof key !== 'string')) protect(reason);
  return value as Record<string, unknown>;
}

function dataValue(
  record: Record<string, unknown>,
  key: string,
  reason: Arc9AtlasFavoriteProtectionReasonV1,
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) protect(reason);
  return descriptor.value;
}

function exactAtlasId(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= 1
    && value.length <= CF1_WORLD_ATLAS_ID_MAX_CHARS
    && !/[\u0000-\u001f\u007f]/u.test(value);
}

function exactJson(value: unknown): string {
  const encoded = JSON.stringify(value);
  if (typeof encoded !== 'string') throw new TypeError('Atlas favorite data is not JSON');
  return encoded;
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return exactJson(left) === exactJson(right); } catch { return false; }
}

function atlasSeal(rows: readonly unknown[]): string {
  return sha256Hex(`${ARC9_ATLAS_SEAL_SCHEMA_V1}\u0000${exactJson(rows)}`);
}

interface CheckedAtlasV1 {
  readonly rows: Array<[string, Record<string, unknown>]>;
  readonly targetIndex: number;
  readonly targetEntry: Record<string, unknown>;
  readonly favorite: boolean;
  readonly seal: string;
}

function checkedAtlasRows(value: unknown, atlasId: string): CheckedAtlasV1 {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || Reflect.ownKeys(value).length !== value.length + 1) protect('atlas-shape');
  if (value.length > MAX_ATLAS_ROWS) protect('atlas-capacity');
  const rows: Array<[string, Record<string, unknown>]> = [];
  const ids = new Set<string>();
  let targetIndex = -1;
  let targetEntry: Record<string, unknown> | null = null;
  let favorite = false;
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    const pair = descriptor && 'value' in descriptor ? descriptor.value : null;
    if (!descriptor || descriptor.enumerable !== true || !Array.isArray(pair)
      || Object.getPrototypeOf(pair) !== Array.prototype || pair.length !== 2
      || Reflect.ownKeys(pair).length !== 3) protect('atlas-shape');
    const idDescriptor = Object.getOwnPropertyDescriptor(pair, '0');
    const entryDescriptor = Object.getOwnPropertyDescriptor(pair, '1');
    const id = idDescriptor && 'value' in idDescriptor ? idDescriptor.value : null;
    const targetCandidate = id === atlasId;
    if (!idDescriptor || idDescriptor.enumerable !== true || !exactAtlasId(id)) {
      protect(targetCandidate ? 'atlas-target-shape' : 'atlas-shape');
    }
    if (ids.has(id)) protect('atlas-id-duplicate');
    ids.add(id);
    const entryValue = entryDescriptor && 'value' in entryDescriptor
      ? entryDescriptor.value : null;
    let entry: Record<string, unknown>;
    try {
      entry = plainRecord(
        entryValue,
        targetCandidate ? 'atlas-target-shape' : 'atlas-shape',
      );
    } catch (error) {
      if (error instanceof AtlasFavoriteProtection) throw error;
      protect(targetCandidate ? 'atlas-target-shape' : 'atlas-shape');
    }
    const rowId = dataValue(
      entry,
      'id',
      targetCandidate ? 'atlas-target-shape' : 'atlas-shape',
    );
    const rowFavorite = dataValue(
      entry,
      'fav',
      targetCandidate ? 'atlas-target-shape' : 'atlas-shape',
    );
    if (rowId !== id || typeof rowFavorite !== 'boolean') {
      protect(targetCandidate ? 'atlas-target-shape' : 'atlas-shape');
    }
    rows.push([id, entry]);
    if (targetCandidate) {
      targetIndex = index;
      targetEntry = entry;
      favorite = rowFavorite;
    }
  }
  if (targetIndex < 0 || targetEntry === null) protect('atlas-target-missing');
  return Object.freeze({
    rows,
    targetIndex,
    targetEntry,
    favorite,
    seal: atlasSeal(rows),
  });
}

interface ProgressionOwnedV1 {
  readonly projection: Arc9ProgressionProjectionV1;
  readonly unlockedIds: readonly string[];
  readonly bestRankIndex: number;
}

function progressionOwned(state: SaveStateV2): ProgressionOwnedV1 {
  const projected = projectArc9ProgressionStateV1(state);
  if (projected.kind !== 'projected') protect(`progression:${projected.reason}`);
  const root = plainRecord(state, 'state-shape');
  const stats = plainRecord(dataValue(root, 'stats', 'state-shape'), 'state-shape');
  const bestRank = dataValue(stats, 'bestRank', 'state-shape');
  if (typeof bestRank !== 'number' || !Number.isSafeInteger(bestRank)
    || bestRank < 0 || bestRank > MAX_RANK_INDEX) protect('state-shape');
  return Object.freeze({
    projection: projected.projection,
    unlockedIds: projected.projection.unlockedIds,
    bestRankIndex: bestRank,
  });
}

export function operationForArc9AtlasFavoriteV1(atlasId: string): string {
  if (!exactAtlasId(atlasId)) {
    throw new TypeError('Arc 9 Atlas favorite operation requires one exact Atlas id');
  }
  return `${ARC9_ATLAS_FAVORITE_OPERATION_PREFIX_V1}${sha256Hex(atlasId)}`;
}

/** Pure preparation. The unchanged branch returns before either the Curator
 * join or aggregate refresh, so an imported favorite never mints history. */
export function prepareArc9AtlasFavoriteV1(
  stateValue: SaveStateV2,
  atlasIdValue: string,
  desiredValue: boolean,
): Arc9AtlasFavoritePreparationV1 {
  try {
    if (!exactAtlasId(atlasIdValue)) protect('atlas-id-shape');
    if (typeof desiredValue !== 'boolean') protect('desired-shape');
    const state = detached(stateValue);
    const root = plainRecord(state, 'state-shape');
    const atlas = checkedAtlasRows(dataValue(root, 'logMap', 'atlas-shape'), atlasIdValue);
    const sourceProgression = progressionOwned(state);
    if (atlas.favorite === desiredValue) {
      return Object.freeze({
        kind: 'current',
        atlasId: atlasIdValue,
        targetIndex: atlas.targetIndex,
        favorite: atlas.favorite,
        atlasSeal: atlas.seal,
        projection: sourceProgression.projection,
      });
    }

    atlas.targetEntry.fav = desiredValue;
    let successorState = state;
    let curatorAdded = false;
    if (atlas.favorite === false && desiredValue === true) {
      const join = prepareArc9EventAchievementJoinV1(successorState, 'curator');
      if (join.kind !== 'prepared') protect(`achievement:${join.reason}`);
      curatorAdded = join.added;
      successorState = { ...successorState, unlocked: [...join.nextUnlockedIds] };
    }
    const refresh = prepareArc9ProgressionRefreshV1(successorState);
    if (refresh.kind === 'protected') protect(`progression:${refresh.reason}`);
    const addedAggregateAchievementIds = refresh.kind === 'ready'
      ? refresh.addedAchievementIds : Object.freeze([]);
    if (refresh.kind === 'ready') successorState = refresh.successorState;
    const fixedPoint = prepareArc9ProgressionRefreshV1(successorState);
    if (fixedPoint.kind !== 'current') protect('progression-fixed-point');
    const successorRoot = plainRecord(successorState, 'state-shape');
    const successorAtlas = checkedAtlasRows(
      dataValue(successorRoot, 'logMap', 'atlas-shape'),
      atlasIdValue,
    );
    const successorProgression = progressionOwned(successorState);
    if (successorAtlas.targetIndex !== atlas.targetIndex
      || successorAtlas.favorite !== desiredValue
      || (atlas.favorite === false && desiredValue === true
        && (!successorProgression.unlockedIds.includes('curator')
          || fixedPoint.projection.achievements.rows.find(({ id }) => id === 'curator')?.status
            !== 'unlocked'))
      || (atlas.favorite === true && desiredValue === false
        && sourceProgression.unlockedIds.includes('curator')
        && !successorProgression.unlockedIds.includes('curator'))) {
      protect('progression-fixed-point');
    }
    return Object.freeze({
      kind: 'ready',
      operation: operationForArc9AtlasFavoriteV1(atlasIdValue),
      receiptKind: ARC9_ATLAS_FAVORITE_RECEIPT_KIND_V1,
      atlasId: atlasIdValue,
      targetIndex: atlas.targetIndex,
      favoriteBefore: atlas.favorite,
      favoriteAfter: desiredValue,
      sourceAtlasSeal: atlas.seal,
      successorAtlasSeal: successorAtlas.seal,
      curatorAdded,
      priorUnlockedIds: Object.freeze([...sourceProgression.unlockedIds]),
      nextUnlockedIds: Object.freeze([...successorProgression.unlockedIds]),
      priorBestRankIndex: sourceProgression.bestRankIndex,
      nextBestRankIndex: successorProgression.bestRankIndex,
      addedAggregateAchievementIds: Object.freeze([...addedAggregateAchievementIds]),
      successorState,
      projection: fixedPoint.projection,
    });
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof AtlasFavoriteProtection ? error.reason : 'state-shape',
    });
  }
}

export interface Arc9AtlasFavoriteActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly atlasId: string;
  readonly desired: boolean;
  readonly codecNow: number;
}

interface CapturedInputV1 {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly atlasId: string;
  readonly desired: boolean;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze([
  'runtime', 'state', 'atlasId', 'desired', 'codecNow',
] as const);

function capture(input: Arc9AtlasFavoriteActionInputV1): CapturedInputV1 | null {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(input);
    const names = keys.filter((key): key is string => typeof key === 'string').sort();
    const expected = [...INPUT_FIELDS].sort();
    if (keys.length !== expected.length
      || names.some((name, index) => name !== expected[index])) return null;
    const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of INPUT_FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      fields[field] = descriptor.value;
    }
    const runtime = fields.runtime;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)
      || !exactAtlasId(fields.atlasId) || typeof fields.desired !== 'boolean'
      || typeof fields.codecNow !== 'number' || !Number.isSafeInteger(fields.codecNow)
      || fields.codecNow < 0) return null;
    const commit = Object.getOwnPropertyDescriptor(runtime, 'commitAction');
    if (!commit || !('value' in commit) || typeof commit.value !== 'function') return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state: detached(fields.state) as SaveStateV2,
      atlasId: fields.atlasId,
      desired: fields.desired,
      codecNow: fields.codecNow,
    });
  } catch {
    return null;
  }
}

function witnessFor(plan: Arc9AtlasFavoriteReadyV1, receiptOrdinal: number): string {
  return `arc9afv1:${sha256Hex(canonicalJson({
    schema: ARC9_ATLAS_FAVORITE_WITNESS_SCHEMA_V1,
    operation: plan.operation,
    receiptOrdinal,
    atlasId: plan.atlasId,
    targetIndex: plan.targetIndex,
    favoriteBefore: plan.favoriteBefore,
    favoriteAfter: plan.favoriteAfter,
    sourceAtlasSeal: plan.sourceAtlasSeal,
    successorAtlasSeal: plan.successorAtlasSeal,
    curatorAdded: plan.curatorAdded,
    priorUnlockedIds: plan.priorUnlockedIds,
    nextUnlockedIds: plan.nextUnlockedIds,
    priorBestRankIndex: plan.priorBestRankIndex,
    nextBestRankIndex: plan.nextBestRankIndex,
    addedAggregateAchievementIds: plan.addedAggregateAchievementIds,
  }))}`;
}

function samePlan(left: Arc9AtlasFavoriteReadyV1, right: Arc9AtlasFavoriteReadyV1): boolean {
  return left.operation === right.operation
    && left.receiptKind === right.receiptKind
    && left.atlasId === right.atlasId
    && left.targetIndex === right.targetIndex
    && left.favoriteBefore === right.favoriteBefore
    && left.favoriteAfter === right.favoriteAfter
    && left.sourceAtlasSeal === right.sourceAtlasSeal
    && left.successorAtlasSeal === right.successorAtlasSeal
    && left.curatorAdded === right.curatorAdded
    && left.priorBestRankIndex === right.priorBestRankIndex
    && left.nextBestRankIndex === right.nextBestRankIndex
    && sameJson(left.priorUnlockedIds, right.priorUnlockedIds)
    && sameJson(left.nextUnlockedIds, right.nextUnlockedIds)
    && sameJson(left.addedAggregateAchievementIds, right.addedAggregateAchievementIds)
    && sameJson(left.successorState, right.successorState);
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): string {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') return outcome.message;
  if (outcome.kind === 'protected') return `protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `lost:${outcome.reason}`;
  return outcome.kind;
}

function needsReload(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): boolean {
  return outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt' || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable' || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

export type Arc9AtlasFavoriteActionOutcomeV1 =
  | Readonly<{
    kind: 'current';
    durability: 'none';
    convergence: 'none';
    atlasId: string;
    targetIndex: number;
    favorite: boolean;
    atlasSeal: string;
    projection: Arc9ProgressionProjectionV1;
    transaction: null;
  }>
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    atlasId: string;
    targetIndex: number;
    favoriteBefore: boolean;
    favoriteAfter: boolean;
    sourceAtlasSeal: string;
    successorAtlasSeal: string;
    curatorAdded: boolean;
    priorUnlockedIds: readonly string[];
    nextUnlockedIds: readonly string[];
    priorBestRankIndex: number;
    nextBestRankIndex: number;
    addedAggregateAchievementIds: readonly string[];
    projection: Arc9ProgressionProjectionV1;
    witness: string;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-atlas-favorite-evidence-missing'
      | 'committed-atlas-favorite-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: 'input:invalid-or-unregistered'
      | `preflight:${Arc9AtlasFavoriteProtectionReasonV1}`
      | `transaction:${string}`;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

/** One detached attempt, one immutable receipt, one revision CAS, no retry. */
export async function commitArc9AtlasFavoriteV1(
  input: Arc9AtlasFavoriteActionInputV1,
): Promise<Arc9AtlasFavoriteActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const preflight = prepareArc9AtlasFavoriteV1(
    captured.state,
    captured.atlasId,
    captured.desired,
  );
  if (preflight.kind === 'protected') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `preflight:${preflight.reason}`, transaction: null,
    });
  }
  if (preflight.kind === 'current') {
    return Object.freeze({
      kind: 'current', durability: 'none', convergence: 'none',
      atlasId: preflight.atlasId,
      targetIndex: preflight.targetIndex,
      favorite: preflight.favorite,
      atlasSeal: preflight.atlasSeal,
      projection: preflight.projection,
      transaction: null,
    });
  }

  let selected: Readonly<{ plan: Arc9AtlasFavoriteReadyV1; witness: string }> | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: preflight.operation,
      receiptKind: preflight.receiptKind,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft }) => {
        const plan = prepareArc9AtlasFavoriteV1(
          draft,
          captured.atlasId,
          captured.desired,
        );
        if (plan.kind !== 'ready' || !samePlan(plan, preflight)) {
          throw new Error('Arc 9 Atlas favorite parent changed before derivation');
        }
        const witness = witnessFor(plan, receiptOrdinal);
        selected = Object.freeze({ plan, witness });
        return Object.freeze({
          state: plan.successorState,
          extensionWrites: Object.freeze([]),
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
      convergence: needsReload(transaction) ? 'read-only-reload' : 'none',
      detail: `transaction:${transactionDetail(transaction)}`,
      transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    plan: Arc9AtlasFavoriteReadyV1;
    witness: string;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-atlas-favorite-evidence-missing',
      transaction,
    });
  }
  const plan = committedSelection.plan;
  const fixedPoint = prepareArc9AtlasFavoriteV1(
    transaction.state,
    captured.atlasId,
    captured.desired,
  );
  if (fixedPoint.kind !== 'current'
    || fixedPoint.targetIndex !== plan.targetIndex
    || fixedPoint.favorite !== plan.favoriteAfter
    || fixedPoint.atlasSeal !== plan.successorAtlasSeal
    || transaction.plan.operation !== plan.operation
    || transaction.plan.receiptOrdinal !== transaction.receipt.ordinal
    || transaction.receipt.kind !== plan.receiptKind
    || transaction.receipt.witness !== committedSelection.witness
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(transaction.state, plan.successorState)
    || !sameJson(fixedPoint.projection.unlockedIds, plan.nextUnlockedIds)
    || fixedPoint.projection.savedBestRankIndex !== plan.nextBestRankIndex) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload',
      detail: 'committed-atlas-favorite-fixed-point-mismatch',
      transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    atlasId: plan.atlasId,
    targetIndex: plan.targetIndex,
    favoriteBefore: plan.favoriteBefore,
    favoriteAfter: plan.favoriteAfter,
    sourceAtlasSeal: plan.sourceAtlasSeal,
    successorAtlasSeal: plan.successorAtlasSeal,
    curatorAdded: plan.curatorAdded,
    priorUnlockedIds: plan.priorUnlockedIds,
    nextUnlockedIds: plan.nextUnlockedIds,
    priorBestRankIndex: plan.priorBestRankIndex,
    nextBestRankIndex: plan.nextBestRankIndex,
    addedAggregateAchievementIds: plan.addedAggregateAchievementIds,
    projection: fixedPoint.projection,
    witness: committedSelection.witness,
  });
}

function writableOwnData(record: object, key: string): PropertyDescriptor | null {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && 'value' in descriptor && descriptor.enumerable === true
    && descriptor.writable === true ? descriptor : null;
}

/** Publish over the exact live CAS parent. The Atlas array, every pair, and
 * every entry object remain identical; only the verified target entry's
 * writable `fav` data property changes in place. */
export function publishArc9AtlasFavoriteFieldsV1(
  target: SaveStateV2,
  outcome: Extract<Arc9AtlasFavoriteActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  const detachedTarget = detached(target);
  const targetRoot = plainRecord(detachedTarget, 'state-shape');
  const liveRoot = plainRecord(target, 'state-shape');
  const detachedAtlas = checkedAtlasRows(
    dataValue(targetRoot, 'logMap', 'atlas-shape'),
    outcome.atlasId,
  );
  const liveLogDescriptor = writableOwnData(liveRoot, 'logMap');
  const liveStatsDescriptor = writableOwnData(liveRoot, 'stats');
  const liveUnlockedDescriptor = writableOwnData(liveRoot, 'unlocked');
  const liveLogMap = liveLogDescriptor?.value;
  if (!Array.isArray(liveLogMap) || detachedAtlas.targetIndex !== outcome.targetIndex
    || detachedAtlas.favorite !== outcome.favoriteBefore
    || detachedAtlas.seal !== outcome.sourceAtlasSeal
    || !liveStatsDescriptor || !liveUnlockedDescriptor
    || !sameJson(progressionOwned(detachedTarget).unlockedIds, outcome.priorUnlockedIds)
    || progressionOwned(detachedTarget).bestRankIndex !== outcome.priorBestRankIndex) {
    throw new TypeError('Arc 9 Atlas favorite publication requires its exact live parent');
  }
  const livePairDescriptor = Object.getOwnPropertyDescriptor(
    liveLogMap,
    String(outcome.targetIndex),
  );
  const livePair = livePairDescriptor && 'value' in livePairDescriptor
    ? livePairDescriptor.value : null;
  const liveEntryDescriptor = Array.isArray(livePair)
    ? Object.getOwnPropertyDescriptor(livePair, '1') : null;
  const liveEntry = liveEntryDescriptor && 'value' in liveEntryDescriptor
    ? liveEntryDescriptor.value : null;
  const liveIdDescriptor = Array.isArray(livePair)
    ? Object.getOwnPropertyDescriptor(livePair, '0') : null;
  const liveFavoriteDescriptor = liveEntry && typeof liveEntry === 'object'
    ? writableOwnData(liveEntry, 'fav') : null;
  if (!livePairDescriptor || livePairDescriptor.enumerable !== true
    || !liveIdDescriptor || !('value' in liveIdDescriptor)
    || liveIdDescriptor.value !== outcome.atlasId
    || !liveEntryDescriptor || liveEntryDescriptor.enumerable !== true
    || !liveEntry || typeof liveEntry !== 'object'
    || !liveFavoriteDescriptor || liveFavoriteDescriptor.value !== outcome.favoriteBefore) {
    throw new TypeError('Arc 9 Atlas favorite publication target is not writable and exact');
  }

  const durable = detached(outcome.transaction.state);
  const durableRoot = plainRecord(durable, 'state-shape');
  const durableAtlas = checkedAtlasRows(
    dataValue(durableRoot, 'logMap', 'atlas-shape'),
    outcome.atlasId,
  );
  const durableProgression = progressionOwned(durable);
  const durableFixedPoint = prepareArc9AtlasFavoriteV1(
    durable,
    outcome.atlasId,
    outcome.favoriteAfter,
  );
  if (durableFixedPoint.kind !== 'current'
    || durableAtlas.targetIndex !== outcome.targetIndex
    || durableAtlas.favorite !== outcome.favoriteAfter
    || durableAtlas.seal !== outcome.successorAtlasSeal
    || !sameJson(durableProgression.unlockedIds, outcome.nextUnlockedIds)
    || durableProgression.bestRankIndex !== outcome.nextBestRankIndex) {
    throw new TypeError('Arc 9 Atlas favorite publication requires its committed fixed point');
  }

  (liveEntry as Record<string, unknown>).fav = outcome.favoriteAfter;
  target.unlocked = [...outcome.nextUnlockedIds];
  target.stats = { ...target.stats, bestRank: outcome.nextBestRankIndex };
}
