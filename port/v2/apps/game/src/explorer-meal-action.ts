/* App-owned explorer flora-meal transaction.

   The UI may project an exact owned lot without drawing. Commit then rebinds
   Arc 2 worn-gear and Arc 3 research authority from the transaction's own
   detached extension snapshot, consumes the lot, advances care.heal, updates
   explorer HP/stats and writes the compact Arc 5 successor in one F4 CAS.
   Nothing is published before the committed fixed point is verified. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type OwnershipStateV2,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import {
  ARC5_EXPLORER_MEAL_RECEIPT_KIND_V1,
  preflightArc5ExplorerMealV1,
  projectArc5ExplorerMealPreviewV1,
  settleArc5ExplorerMealV1,
  type Arc5ExplorerMealPreflightV1,
  type Arc5ExplorerMealPreviewV1,
  type Arc5ExplorerMealSettlementV1,
  type Arc5ExplorerPhysiologyV1,
} from '@cf/domain-acquisition/explorer-meal-internal';
import {
  isEngineeringCapabilitySnapshot,
  type EngineeringCapabilitySnapshot,
} from '@cf/domain-loot';
import {
  DOMAINS,
} from '@cf/domain-sessionrng';
import {
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  encodeEngineeringState,
  isEngineeringState,
  type EngineeringStateV2,
} from '@cf/domain-opportunity';
import {
  committedArc5OwnershipState,
  prepareArc5OwnershipV2Successor,
  readArc2EngineeringLoadout,
  readArc3Engineering,
  type Arc5OwnershipMigrationEvidenceV2,
  type Arc5OwnershipV2SuccessorProtectionReason,
  type PreparedArc5OwnershipMigrationSuccessorV2,
  type SaveStateV2,
} from '@cf/persistence';
import type {
  F4RuntimeAuthority,
  F4RuntimeOutcomeCommitOutcome,
} from './f4-runtime-authority.js';
import {
  prepareArc9EventAchievementJoinV1,
  type Arc9EventAchievementJoinPreparationV1,
} from './arc9-progression-projection.js';

export const ARC5_EXPLORER_MEAL_DOMAIN_V1 = DOMAINS.healOutcome;
export const ARC5_EXPLORER_MEAL_ACHIEVEMENT_IDS_V1 = Object.freeze([
  'fieldmedic', 'gambler',
] as const);
export type Arc5ExplorerMealAchievementIdV1 =
  (typeof ARC5_EXPLORER_MEAL_ACHIEVEMENT_IDS_V1)[number];

export interface Arc5ExplorerMealProjectionInputV1 {
  readonly ownershipV2: OwnershipStateV2;
  readonly engineering: EngineeringStateV2;
  readonly capabilities: EngineeringCapabilitySnapshot;
  readonly state: SaveStateV2;
  readonly foodLotId: SpecimenLotId;
}

export type Arc5ExplorerMealProjectionOutcomeV1 =
  | Readonly<{
    kind: 'ready';
    preflight: Arc5ExplorerMealPreflightV1;
    preview: Arc5ExplorerMealPreviewV1;
  }>
  | Readonly<{ kind: 'unavailable'; detail: string }>;

export interface Arc5ExplorerMealActionInputV1 extends Arc5ExplorerMealProjectionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitOutcome'>;
  readonly codecNow: number;
}

export type Arc5ExplorerMealActionOutcomeV1 =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeOutcomeCommitOutcome, { readonly kind: 'committed' }>;
    settlement: Arc5ExplorerMealSettlementV1;
    state: SaveStateV2;
    ownershipV2: OwnershipStateV2;
    ownershipV2Evidence: Arc5OwnershipMigrationEvidenceV2;
    ownershipWrites: PreparedArc5OwnershipMigrationSuccessorV2['writes'];
    achievementIdsAdded: readonly Arc5ExplorerMealAchievementIdV1[];
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-meal-evidence-missing' | 'committed-meal-fixed-point-mismatch';
    transaction: Extract<F4RuntimeOutcomeCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: string;
    transaction: Exclude<F4RuntimeOutcomeCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedActionInputV1 {
  readonly commit: F4RuntimeAuthority['commitOutcome'];
  readonly ownershipV2: OwnershipStateV2;
  readonly engineering: EngineeringStateV2;
  readonly capabilities: EngineeringCapabilitySnapshot;
  readonly state: SaveStateV2;
  readonly foodLotId: SpecimenLotId;
  readonly codecNow: number;
}

const ACTION_INPUT_FIELDS = Object.freeze([
  'runtime', 'ownershipV2', 'engineering', 'capabilities', 'state', 'foodLotId', 'codecNow',
] as const);
const STATE_CLONE_LIMIT = 1_500_000;

function clonePlainData(
  value: unknown,
  ancestors: Set<object>,
  budget: { count: number },
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('meal state must contain only plain data');
  if (depth > 256 || budget.count >= STATE_CLONE_LIMIT) {
    throw new RangeError('meal state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('meal state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('meal arrays must use the native prototype');
      const keys = Reflect.ownKeys(value);
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('meal arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('meal arrays cannot contain accessors or holes');
        }
        clone.push(clonePlainData(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('meal state objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('meal state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('meal state cannot contain accessors or hidden fields');
      }
      Object.defineProperty(clone, key, {
        value: clonePlainData(descriptor.value, ancestors, budget, depth + 1),
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

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

type Arc5ExplorerMealAchievementPlanV1 = Readonly<{
  state: SaveStateV2;
  joins: readonly Arc9EventAchievementJoinPreparationV1[];
  addedIds: readonly Arc5ExplorerMealAchievementIdV1[];
}>;

function prepareSafeMealAchievements(
  state: SaveStateV2,
  highRisk: boolean,
): Arc5ExplorerMealAchievementPlanV1 | Readonly<{ kind: 'protected'; reason: string }> {
  const ids: readonly Arc5ExplorerMealAchievementIdV1[] = highRisk
    ? ARC5_EXPLORER_MEAL_ACHIEVEMENT_IDS_V1
    : ARC5_EXPLORER_MEAL_ACHIEVEMENT_IDS_V1.slice(0, 1);
  let candidate = state;
  const joins: Arc9EventAchievementJoinPreparationV1[] = [];
  const addedIds: Arc5ExplorerMealAchievementIdV1[] = [];
  for (const id of ids) {
    const join = prepareArc9EventAchievementJoinV1(candidate, id);
    if (join.kind !== 'prepared') {
      return Object.freeze({ kind: 'protected' as const, reason: `${id}:${join.reason}` });
    }
    joins.push(join);
    if (join.added) {
      addedIds.push(id);
      candidate = { ...candidate, unlocked: [...join.nextUnlockedIds] };
    }
  }
  return Object.freeze({
    state: candidate,
    joins: Object.freeze(joins),
    addedIds: Object.freeze(addedIds),
  });
}

function sameAchievementPlan(
  left: Arc5ExplorerMealAchievementPlanV1,
  right: Arc5ExplorerMealAchievementPlanV1,
): boolean {
  return sameJson(left.joins.map(({ achievementId, owner, added, priorUnlockedCount, nextUnlockedIds }) => ({
    achievementId, owner, added, priorUnlockedCount, nextUnlockedIds,
  })), right.joins.map(({ achievementId, owner, added, priorUnlockedCount, nextUnlockedIds }) => ({
    achievementId, owner, added, priorUnlockedCount, nextUnlockedIds,
  }))) && sameJson(left.state.unlocked, right.state.unlocked)
    && sameJson(left.addedIds, right.addedIds);
}

function exactTechParity(state: SaveStateV2, engineering: EngineeringStateV2): boolean {
  return Array.isArray(state.techOwned)
    && state.techOwned.length === engineering.research.length
    && state.techOwned.every((id, index) => id === engineering.research[index]);
}

function physiologyFromState(state: SaveStateV2): Arc5ExplorerPhysiologyV1 {
  return {
    hp: state.hp,
    hpMax: state.HP_MAX,
    stats: {
      vit: state.pstats.vit!,
      fer: state.pstats.fer!,
      res: state.pstats.res!,
      agi: state.pstats.agi!,
      ins: state.pstats.ins!,
    },
  };
}

function projectCaptured(
  ownershipV2: OwnershipStateV2,
  engineering: EngineeringStateV2,
  capabilities: EngineeringCapabilitySnapshot,
  state: SaveStateV2,
  foodLotId: SpecimenLotId,
): Arc5ExplorerMealProjectionOutcomeV1 {
  if (!isOwnershipStateV2(ownershipV2)
    || !isEngineeringState(engineering)
    || !isEngineeringCapabilitySnapshot(capabilities)
    || !state || typeof state !== 'object' || Array.isArray(state)
    || !exactTechParity(state, engineering)) {
    return Object.freeze({ kind: 'unavailable', detail: 'authority-invalid-or-divergent' });
  }
  const preflight = preflightArc5ExplorerMealV1(ownershipV2, { foodLotId });
  if (preflight.kind !== 'ready') {
    return Object.freeze({ kind: 'unavailable', detail: `preflight:${preflight.reason}` });
  }
  try {
    return Object.freeze({
      kind: 'ready',
      preflight: preflight.preflight,
      preview: projectArc5ExplorerMealPreviewV1(
        preflight.preflight,
        physiologyFromState(state),
        capabilities.explorerMealHealBonus,
        engineering.research.includes('lab1'),
      ),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'unavailable',
      detail: `physiology:${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/** Project the detail-card values from registered current app authorities. */
export function projectArc5ExplorerMealActionPreviewV1(
  input: Arc5ExplorerMealProjectionInputV1,
): Arc5ExplorerMealProjectionOutcomeV1 {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return Object.freeze({ kind: 'unavailable', detail: 'input-invalid' });
    }
    return projectCaptured(
      input.ownershipV2,
      input.engineering,
      input.capabilities,
      input.state,
      input.foodLotId,
    );
  } catch {
    return Object.freeze({ kind: 'unavailable', detail: 'input-invalid' });
  }
}

function captureAction(input: Arc5ExplorerMealActionInputV1): CapturedActionInputV1 | null {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(input);
    const names = keys.filter((key): key is string => typeof key === 'string').sort();
    const expected = [...ACTION_INPUT_FIELDS].sort();
    if (keys.length !== expected.length
      || names.some((name, index) => name !== expected[index])) return null;
    const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of ACTION_INPUT_FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      fields[field] = descriptor.value;
    }
    const runtime = fields.runtime;
    const commit = runtime && typeof runtime === 'object' && !Array.isArray(runtime)
      ? Object.getOwnPropertyDescriptor(runtime, 'commitOutcome')
      : undefined;
    if (!commit || !('value' in commit) || typeof commit.value !== 'function'
      || !isOwnershipStateV2(fields.ownershipV2)
      || !isEngineeringState(fields.engineering)
      || !isEngineeringCapabilitySnapshot(fields.capabilities)
      || !fields.state || typeof fields.state !== 'object' || Array.isArray(fields.state)
      || typeof fields.foodLotId !== 'string'
      || !/^specimen-v1:[0-9a-f]{64}$/u.test(fields.foodLotId)
      || !Number.isSafeInteger(fields.codecNow) || (fields.codecNow as number) < 0) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitOutcome'],
      ownershipV2: fields.ownershipV2,
      engineering: fields.engineering,
      capabilities: fields.capabilities,
      state: clonePlainData(fields.state, new Set<object>(), { count: 0 }, 0) as SaveStateV2,
      foodLotId: fields.foodLotId as SpecimenLotId,
      codecNow: fields.codecNow as number,
    });
  } catch {
    return null;
  }
}

function transactionDetail(
  outcome: Exclude<F4RuntimeOutcomeCommitOutcome, { readonly kind: 'committed' }>,
): string {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') {
    return `transaction:${outcome.message}`;
  }
  if (outcome.kind === 'protected') return `transaction:protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `transaction:lost:${outcome.reason}`;
  return `transaction:${outcome.kind}`;
}

function requiresReload(
  outcome: Exclude<F4RuntimeOutcomeCommitOutcome, { readonly kind: 'committed' }>,
  ownershipProtection: Arc5OwnershipV2SuccessorProtectionReason | null,
  sourceAuthorityProtection: boolean,
): boolean {
  return ownershipProtection !== null || sourceAuthorityProtection
    || outcome.kind === 'stale'
    || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt'
    || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable'
    || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

/** Commit one explorer meal once; a red outcome is never retried as a second bite. */
export async function commitArc5ExplorerMealActionV1(
  input: Arc5ExplorerMealActionInputV1,
): Promise<Arc5ExplorerMealActionOutcomeV1> {
  const captured = captureAction(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const projected = projectCaptured(
    captured.ownershipV2,
    captured.engineering,
    captured.capabilities,
    captured.state,
    captured.foodLotId,
  );
  if (projected.kind !== 'ready') {
    const revisionExhausted = projected.detail === 'preflight:ownership-revision-exhausted';
    return Object.freeze({
      kind: 'refused', durability: 'none',
      convergence: revisionExhausted ? 'read-only-reload' : 'none',
      detail: projected.detail, transaction: null,
    });
  }
  const highRisk = projected.preflight.poisonChance > 0.4;
  const safeAchievementProjection = prepareSafeMealAchievements(captured.state, highRisk);
  if ('kind' in safeAchievementProjection) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `achievement:${safeAchievementProjection.reason}`, transaction: null,
    });
  }

  let selected: Readonly<{
    settlement: Arc5ExplorerMealSettlementV1;
    prepared: PreparedArc5OwnershipMigrationSuccessorV2;
    achievements: Arc5ExplorerMealAchievementPlanV1;
  }> | null = null;
  let ownershipProtection: Arc5OwnershipV2SuccessorProtectionReason | null = null;
  let sourceAuthorityProtection = false;
  let transaction: F4RuntimeOutcomeCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      domain: ARC5_EXPLORER_MEAL_DOMAIN_V1,
      receiptKind: ARC5_EXPLORER_MEAL_RECEIPT_KIND_V1,
      codecNow: captured.codecNow,
      derive: ({ value, receiptOrdinal, draft, extensions }) => {
        const loadout = readArc2EngineeringLoadout(extensions);
        if (loadout.kind !== 'loaded'
          || loadout.capabilities.fingerprint !== captured.capabilities.fingerprint) {
          sourceAuthorityProtection = true;
          throw new Error(`meal loadout authority ${loadout.kind === 'loaded' ? 'diverged' : loadout.kind}`);
        }
        const engineering = readArc3Engineering(
          extensions,
          SCENE_ENGINEERING_ADDRESS_RESOLVER,
        );
        if (engineering.kind !== 'loaded'
          || encodeEngineeringState(engineering.state) !== encodeEngineeringState(captured.engineering)
          || !exactTechParity(draft, engineering.state)) {
          sourceAuthorityProtection = true;
          throw new Error(`meal research authority ${engineering.kind === 'loaded' ? 'diverged' : engineering.kind}`);
        }
        const settlement = settleArc5ExplorerMealV1(
          projected.preflight,
          physiologyFromState(draft),
          loadout.capabilities.explorerMealHealBonus,
          engineering.state.research.includes('lab1'),
          value,
          receiptOrdinal,
        );
        const prepared = prepareArc5OwnershipV2Successor({
          baseExtensions: extensions,
          parent: captured.ownershipV2,
          successor: settlement.successor,
          resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
        });
        if (prepared.kind !== 'prepared') {
          ownershipProtection = prepared.reason;
          throw new Error(`meal ownership carrier refused ${prepared.reason}`);
        }
        const physiologyState: SaveStateV2 = {
          ...draft,
          hp: settlement.consequence.hpAfter,
          HP_MAX: settlement.consequence.hpMaxAfter,
          pstats: { ...settlement.consequence.statsAfter },
        };
        let achievements: Arc5ExplorerMealAchievementPlanV1;
        if (settlement.consequence.poisoned) {
          achievements = Object.freeze({
            state: physiologyState,
            joins: Object.freeze([]),
            addedIds: Object.freeze([]),
          });
        } else {
          const projectedAchievements = prepareSafeMealAchievements(physiologyState, highRisk);
          if ('kind' in projectedAchievements
            || !sameAchievementPlan(projectedAchievements, safeAchievementProjection)) {
            throw new Error('meal achievement parent changed before derivation');
          }
          achievements = projectedAchievements;
        }
        selected = Object.freeze({ settlement, prepared, achievements });
        return Object.freeze({
          state: achievements.state,
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
      convergence: requiresReload(
        transaction,
        ownershipProtection,
        sourceAuthorityProtection,
      ) ? 'read-only-reload' : 'none',
      detail: ownershipProtection === null
        ? transactionDetail(transaction)
        : `ownership-carrier:${ownershipProtection}`,
      transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    settlement: Arc5ExplorerMealSettlementV1;
    prepared: PreparedArc5OwnershipMigrationSuccessorV2;
    achievements: Arc5ExplorerMealAchievementPlanV1;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-meal-evidence-missing', transaction,
    });
  }
  const { settlement, prepared, achievements } = committedSelection;
  const committed = committedArc5OwnershipState(
    prepared,
    transaction.saved.extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  if (committed === null
    || transaction.plan.domain !== ARC5_EXPLORER_MEAL_DOMAIN_V1
    || transaction.plan.value !== settlement.consequence.outcomeDraw
    || transaction.plan.receiptOrdinal !== settlement.receiptEvidence.ordinal
    || transaction.receipt.ordinal !== settlement.receiptEvidence.ordinal
    || transaction.receipt.kind !== ARC5_EXPLORER_MEAL_RECEIPT_KIND_V1
    || transaction.receipt.witness !== settlement.witness
    || !sameJson(transaction.authority.sessionRng, transaction.plan.nextSessionRng)
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || transaction.state.hp !== settlement.consequence.hpAfter
    || transaction.state.HP_MAX !== settlement.consequence.hpMaxAfter
    || !sameJson(transaction.state.pstats, settlement.consequence.statsAfter)
    || !sameJson(transaction.state.unlocked, achievements.state.unlocked)
    || achievements.joins.some(({ achievementId }) => {
      const fixedPoint = prepareArc9EventAchievementJoinV1(transaction.state, achievementId);
      return fixedPoint.kind !== 'prepared' || fixedPoint.added;
    })
    || ownershipStateDigestV2(committed.state)
      !== ownershipStateDigestV2(settlement.successor)) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-meal-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none',
    transaction,
    settlement,
    state: transaction.state,
    ownershipV2: committed.state,
    ownershipV2Evidence: committed.evidence,
    ownershipWrites: prepared.writes,
    achievementIdsAdded: achievements.addedIds,
  });
}

/** Publish only the independently verified meal-owned event-achievement suffix
 * after Main accepts the complete durable action fixed point. */
export function publishArc5ExplorerMealAchievementFields(
  target: SaveStateV2,
  committed: SaveStateV2,
  addedIds: readonly Arc5ExplorerMealAchievementIdV1[],
): void {
  if (!Array.isArray(target.unlocked) || !Array.isArray(committed.unlocked)
    || !Array.isArray(addedIds)
    || addedIds.some((id, index) => !ARC5_EXPLORER_MEAL_ACHIEVEMENT_IDS_V1.includes(id)
      || addedIds.indexOf(id) !== index)
    || committed.unlocked.length !== target.unlocked.length + addedIds.length
    || target.unlocked.some((id, index) => committed.unlocked[index] !== id)
    || addedIds.some((id, index) => committed.unlocked[target.unlocked.length + index] !== id)
    || addedIds.some((id) => {
      const fixedPoint = prepareArc9EventAchievementJoinV1(committed, id);
      return fixedPoint.kind !== 'prepared' || fixedPoint.added;
    })) {
    throw new TypeError('Explorer meal achievement publication requires the exact committed suffix');
  }
  target.unlocked = committed.unlocked.slice();
}
