/* Play-time Stardust harvest from a conquered world (v1.8.9 parity, D16; main.js doHarvest ~18760).

   v1.8.8's clock law holds: readiness rides the saved harvest EPOCH (`conquered[].e`), and the epoch is the app's published
   COSMIC_EPOCH projection over F4's persisted active-play time. The device clock gates nothing, so winding it forward grants
   nothing. v1 numbers, verbatim:
   - a world is ready HARVEST_EPOCHS (2) epochs after its last harvest (≈ 40 minutes of play), and a row with no epoch is ready;
   - the yield is 6 + 4 × the world's conquest tier, paid into current AND lifetime Stardust;
   - `harvests` counts up for the Quartermaster achievement.
   `t` is a display stamp only. One F4 receipt/CAS per (world, epoch), and achievements/rank refresh in the same transaction. */
import { HARVEST_EPOCHS, harvestReady, sanitizeEpoch, type ConquestRow } from '@cf/domain-progression';
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import type { SaveStateV2 } from '@cf/persistence';
import { prepareArc9ProgressionRefreshV1 } from './arc9-progression-projection.js';
import type { F4RuntimeActionCommitOutcome, F4RuntimeAuthority } from './f4-runtime-authority.js';

export const WORLD_HARVEST_RECEIPT_KIND_V1 = 'arc6-world-harvest-v1' as const;
export const WORLD_HARVEST_WITNESS_SCHEMA_V1 = 'cf-v2-arc6-world-harvest-witness/v1' as const;
const OPERATION_PREFIX = 'arc6.world-harvest:';
/** v1.8.9 EPOCH_TICK in seconds (the projection's "minutes of exploring" hint). */
const EPOCH_MINUTES = 20;
const MAX_STARDUST = Number.MAX_SAFE_INTEGER;
const MAX_HARVEST_TIER = 14;

export function worldHarvestYieldV1(tier: number): number {
  return 6 + Math.max(0, Math.min(MAX_HARVEST_TIER, Math.floor(tier))) * 4;
}

export function operationForWorldHarvestV1(planetSeed: number, epoch: number): string {
  if (!Number.isSafeInteger(planetSeed)) throw new RangeError('harvest world seed must be a safe integer');
  return `${OPERATION_PREFIX}${planetSeed}@${sanitizeEpoch(epoch)}`;
}

export type WorldHarvestProjectionV1 =
  | Readonly<{ kind: 'not-conquered' }>
  | Readonly<{ kind: 'ready'; yield: number; tier: number }>
  | Readonly<{ kind: 'replenishing'; yield: number; tier: number; epochsLeft: number; minutesLeft: number }>;

function conqueredRow(state: Pick<SaveStateV2, 'conquered'>, planetSeed: number): ConquestRow | null {
  const rows = state.conquered.filter(([key]) => Number(key) === planetSeed);
  if (rows.length !== 1) return null;
  const row = rows[0]![1];
  return row && typeof row === 'object' ? row : null;
}

/** What the world card shows for this world at this epoch. */
export function projectWorldHarvestV1(state: Pick<SaveStateV2, 'conquered'>, planetSeed: number, epoch: number): WorldHarvestProjectionV1 {
  const row = conqueredRow(state, planetSeed);
  if (row === null) return Object.freeze({ kind: 'not-conquered' });
  const tier = Math.max(0, Math.floor(+(row.tier ?? 0) || 0)), amount = worldHarvestYieldV1(tier), now = sanitizeEpoch(epoch);
  if (harvestReady(row, now)) return Object.freeze({ kind: 'ready', yield: amount, tier });
  const epochsLeft = Math.max(1, HARVEST_EPOCHS - (now - (+row.e! || 0)));
  return Object.freeze({ kind: 'replenishing', yield: amount, tier, epochsLeft, minutesLeft: epochsLeft * EPOCH_MINUTES });
}

export interface WorldHarvestFactsV1 {
  readonly schema: typeof WORLD_HARVEST_WITNESS_SCHEMA_V1;
  readonly planetSeed: number;
  readonly epoch: number;
  readonly priorEpoch: number | null;
  readonly tier: number;
  readonly stardust: number;
  readonly essenceBefore: number;
  readonly essenceAfter: number;
  readonly earnedBefore: number;
  readonly earnedAfter: number;
  readonly harvestsBefore: number;
  readonly harvestsAfter: number;
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly addedAchievementIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
  readonly receiptOrdinal: number;
}

export type WorldHarvestOutcomeV1 =
  | Readonly<{ kind: 'not-ready'; projection: WorldHarvestProjectionV1 }>
  | Readonly<{ kind: 'refused'; detail: string; transaction?: F4RuntimeActionCommitOutcome }>
  | Readonly<{ kind: 'committed'; state: SaveStateV2; facts: WorldHarvestFactsV1;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> }>
  | Readonly<{ kind: 'committed-convergence'; detail: string;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> }>;

function checkedInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new RangeError(`${label} is outside its exact integer range`);
  }
  return value as number;
}

export async function commitWorldHarvestV1(input: Readonly<{
  state: SaveStateV2;
  planetSeed: number;
  /** The app's PUBLISHED epoch (never recomputed from a device clock). */
  epoch: number;
  codecNow: number;
  authority: Pick<F4RuntimeAuthority, 'commitAction'>;
}>): Promise<WorldHarvestOutcomeV1> {
  const epoch = sanitizeEpoch(input.epoch);
  /* the epoch must already be durable (the save's EPOCH_BASE): the save clamps a row's `e` to it, so an unpublished epoch would
     commit one value and reload another */
  if (epoch > sanitizeEpoch(input.state.EPOCH_BASE)) return Object.freeze({ kind: 'refused', detail: 'epoch-not-published' });
  const source = projectWorldHarvestV1(input.state, input.planetSeed, epoch);
  if (source.kind !== 'ready') {
    return source.kind === 'not-conquered'
      ? Object.freeze({ kind: 'refused', detail: 'not-conquered' })
      : Object.freeze({ kind: 'not-ready', projection: source });
  }
  const operation = operationForWorldHarvestV1(input.planetSeed, epoch);
  let selected: Readonly<{ facts: WorldHarvestFactsV1; witness: string; expectedStateJson: string }> | null = null;
  const transaction = await input.authority.commitAction({
    state: input.state,
    operation,
    receiptKind: WORLD_HARVEST_RECEIPT_KIND_V1,
    codecNow: input.codecNow,
    derive: ({ draft, receiptOrdinal, canonicalizeState }) => {
      if (epoch > sanitizeEpoch(draft.EPOCH_BASE)) throw new Error('harvest epoch is not published');
      const index = draft.conquered.findIndex(([key]) => Number(key) === input.planetSeed);
      if (index < 0 || draft.conquered.filter(([key]) => Number(key) === input.planetSeed).length !== 1) throw new Error('harvest world is not uniquely conquered');
      const [key, row] = draft.conquered[index]!;
      if (!harvestReady(row, epoch)) throw new Error('harvest world is still replenishing');
      const tier = Math.max(0, Math.floor(+(row.tier ?? 0) || 0)), stardust = worldHarvestYieldV1(tier);
      const essenceBefore = checkedInteger(draft.essence, 0, MAX_STARDUST, 'harvest Stardust');
      const earnedBefore = checkedInteger(draft.stats.essenceEarned ?? 0, 0, MAX_STARDUST, 'harvest lifetime Stardust');
      const harvestsBefore = checkedInteger(draft.stats.harvests ?? 0, 0, MAX_STARDUST, 'harvest count');
      if (essenceBefore > MAX_STARDUST - stardust || earnedBefore > MAX_STARDUST - stardust) throw new RangeError('harvest Stardust would overflow');
      const conquered = [...draft.conquered];
      conquered[index] = [key, { ...row, e: epoch, t: Math.max(0, Math.floor(input.codecNow)) }];
      draft.conquered = conquered;
      draft.essence = essenceBefore + stardust;
      draft.stats = { ...draft.stats, essenceEarned: earnedBefore + stardust, harvests: harvestsBefore + 1 };
      const refresh = prepareArc9ProgressionRefreshV1(draft);
      if (refresh.kind === 'protected') throw new Error(`progression:${refresh.reason}`);
      let progression: Pick<WorldHarvestFactsV1, 'priorUnlockedIds' | 'nextUnlockedIds' | 'addedAchievementIds' | 'priorBestRankIndex' | 'nextBestRankIndex'>;
      if (refresh.kind === 'ready') {
        draft.unlocked = [...refresh.successorState.unlocked];
        draft.stats = { ...refresh.successorState.stats };
        progression = { priorUnlockedIds: refresh.source.unlockedIds, nextUnlockedIds: refresh.successor.unlockedIds,
          addedAchievementIds: refresh.addedAchievementIds, priorBestRankIndex: refresh.priorBestRankIndex, nextBestRankIndex: refresh.nextBestRankIndex };
      } else {
        progression = { priorUnlockedIds: refresh.projection.unlockedIds, nextUnlockedIds: refresh.projection.unlockedIds,
          addedAchievementIds: Object.freeze([]), priorBestRankIndex: refresh.projection.savedBestRankIndex, nextBestRankIndex: refresh.projection.rewards.bestRankIndex };
      }
      const facts: WorldHarvestFactsV1 = Object.freeze({
        schema: WORLD_HARVEST_WITNESS_SCHEMA_V1, planetSeed: input.planetSeed, epoch,
        priorEpoch: row.e == null ? null : +row.e, tier, stardust,
        essenceBefore, essenceAfter: draft.essence, earnedBefore, earnedAfter: draft.stats.essenceEarned!,
        harvestsBefore, harvestsAfter: draft.stats.harvests!, ...progression, receiptOrdinal,
      });
      const witness = `${WORLD_HARVEST_WITNESS_SCHEMA_V1}:${sha256Hex(canonicalJson(facts))}`;
      selected = Object.freeze({ facts, witness, expectedStateJson: canonicalJson(canonicalizeState(draft)) });
      return Object.freeze({ state: draft, witness });
    },
  });
  if (transaction.kind !== 'committed') return Object.freeze({ kind: 'refused', detail: transaction.kind, transaction });
  const plan = selected as Readonly<{ facts: WorldHarvestFactsV1; witness: string; expectedStateJson: string }> | null;
  if (!plan) return Object.freeze({ kind: 'committed-convergence', detail: 'missing-plan', transaction });
  const after = projectWorldHarvestV1(transaction.state, input.planetSeed, epoch);
  if (transaction.plan.operation !== operation
    || transaction.receipt.ordinal !== plan.facts.receiptOrdinal
    || transaction.receipt.kind !== WORLD_HARVEST_RECEIPT_KIND_V1
    || transaction.receipt.witness !== plan.witness
    || canonicalJson(transaction.state) !== canonicalJson(transaction.saved.canonicalState)
    || canonicalJson(transaction.state) !== plan.expectedStateJson
    || after.kind !== 'replenishing'
    || transaction.state.essence !== plan.facts.essenceAfter
    || transaction.state.stats.essenceEarned !== plan.facts.earnedAfter
    || transaction.state.stats.harvests !== plan.facts.harvestsAfter
    || canonicalJson(transaction.state.unlocked) !== canonicalJson(plan.facts.nextUnlockedIds)) {
    return Object.freeze({ kind: 'committed-convergence', detail: 'committed-verification-mismatch', transaction });
  }
  return Object.freeze({ kind: 'committed', state: transaction.state, facts: plan.facts, transaction });
}

/** Publish exactly the fields the harvest owns onto the live save (its parent must be unchanged). */
export function publishWorldHarvestFieldsV1(target: SaveStateV2, outcome: Extract<WorldHarvestOutcomeV1, { readonly kind: 'committed' }>): void {
  if (target.essence !== outcome.facts.essenceBefore
    || (target.stats.essenceEarned ?? 0) !== outcome.facts.earnedBefore
    || (target.stats.harvests ?? 0) !== outcome.facts.harvestsBefore
    || canonicalJson(target.unlocked) !== canonicalJson(outcome.facts.priorUnlockedIds)) {
    throw new TypeError('harvest publication requires its exact live parent');
  }
  target.conquered = outcome.state.conquered.map(([key, row]) => [key, { ...row }]);
  target.essence = outcome.state.essence;
  target.stats = { ...outcome.state.stats };
  target.unlocked = [...outcome.state.unlocked];
}
