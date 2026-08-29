/* Arc 9 disconnected Records/rank read model.

   This component is presentation data only. It projects the six exact rank
   factors and all 96 achievement rows, but owns no DOM, panel state, action,
   reward claim, fanfare, or persistence. */
import {
  ACHIEVEMENT_CATEGORIES,
  EXPLORER_RANK_SCORE_WEIGHTS,
  type AchievementCategory,
  type AchievementProjectionStatus,
} from '@cf/domain-progression';
import type { SaveStateV2 } from '@cf/persistence';
import {
  projectArc9ProgressionStateV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
} from './arc9-progression-projection.js';

export const ARC9_RECORDS_RANK_READ_MODEL_SCHEMA_V1 = 'cf-v2-arc9-records-rank-read-model/v1';

export interface Arc9RankFactorRowV1 {
  readonly id:
    | 'living-worlds-surveyed'
    | 'species-catalogued'
    | 'best-raw-rarity-tier'
    | 'achievements-unlocked'
    | 'hybrids-bred'
    | 'galaxies-visited';
  readonly label: string;
  readonly value: number;
  readonly scorePerUnit: number;
  readonly scoreContribution: number;
}

export interface Arc9AchievementReadRowV1 {
  readonly id: string;
  readonly icon: string;
  readonly name: string;
  readonly description: string;
  readonly status: AchievementProjectionStatus;
}

export interface Arc9AchievementCategoryReadModelV1 {
  readonly category: AchievementCategory;
  readonly total: number;
  readonly unlocked: number;
  readonly eligible: number;
  readonly locked: number;
  readonly eventOwnerRequired: number;
  readonly rows: readonly Arc9AchievementReadRowV1[];
}

export interface Arc9RecordsRankReadModelV1 {
  readonly schema: typeof ARC9_RECORDS_RANK_READ_MODEL_SCHEMA_V1;
  readonly rank: Readonly<{
    readonly score: number;
    readonly index: number;
    readonly name: string;
    readonly floor: number;
    readonly nextThreshold: number;
    readonly nextName: string;
    readonly progress: number;
    readonly span: number;
    readonly prestigeLevel: number;
    readonly bestRankIndex: number;
    readonly nameplateHue: string;
    readonly nameplateIridescent: boolean;
  }>;
  readonly factors: readonly Arc9RankFactorRowV1[];
  readonly achievements: readonly Arc9AchievementCategoryReadModelV1[];
  readonly unsupportedUnlockedIds: readonly string[];
  readonly durableUnlockedCount: number;
  readonly eligibleAggregateCount: number;
  readonly eventOwnerRequiredCount: number;
  /** True means the disconnected aggregate refresh action has real work. */
  readonly aggregateRefreshAvailable: boolean;
}

export type Arc9RecordsRankReadModelOutcomeV1 =
  | Readonly<{ kind: 'projected'; model: Arc9RecordsRankReadModelV1 }>
  | Readonly<{ kind: 'protected'; reason: Arc9ProgressionProjectionProtectionReasonV1 }>;

function factor(
  id: Arc9RankFactorRowV1['id'],
  label: string,
  value: number,
  scorePerUnit: number,
): Arc9RankFactorRowV1 {
  return Object.freeze({ id, label, value, scorePerUnit, scoreContribution: value * scorePerUnit });
}

export function projectArc9RecordsRankReadModelV1(
  state: SaveStateV2,
): Arc9RecordsRankReadModelOutcomeV1 {
  const outcome = projectArc9ProgressionStateV1(state);
  if (outcome.kind !== 'projected') return outcome;
  const { projection } = outcome;
  const rank = projection.rank;
  const weights = EXPLORER_RANK_SCORE_WEIGHTS;
  const factors = Object.freeze([
    factor(
      'living-worlds-surveyed', 'Living worlds surveyed',
      projection.rankRecord.surveyedLivingWorldCount, weights.surveyedLivingWorld,
    ),
    factor(
      'species-catalogued', 'Species catalogued',
      projection.rankRecord.cataloguedSpeciesCount, weights.cataloguedSpecies,
    ),
    factor(
      'best-raw-rarity-tier', 'Highest raw rarity tier',
      projection.rankRecord.bestRawRarityTier, weights.bestRawRarityTier,
    ),
    factor(
      'achievements-unlocked', 'Achievements unlocked',
      projection.rankRecord.unlockedAchievementCount, weights.unlockedAchievement,
    ),
    factor(
      'hybrids-bred', 'Hybrids bred',
      projection.rankRecord.hybridCount, weights.hybrid,
    ),
    factor(
      'galaxies-visited', 'Galaxies visited',
      projection.rankRecord.galaxyCount, weights.galaxyVisited,
    ),
  ]);
  const achievements = Object.freeze(ACHIEVEMENT_CATEGORIES.map((category) => {
    const rows = Object.freeze(projection.achievements.rows
      .filter((row) => row.category === category)
      .map((row): Arc9AchievementReadRowV1 => Object.freeze({
        id: row.id,
        icon: row.icon,
        name: row.name,
        description: row.description,
        status: row.status,
      })));
    const count = (status: AchievementProjectionStatus): number => (
      rows.filter((row) => row.status === status).length
    );
    return Object.freeze({
      category,
      total: rows.length,
      unlocked: count('unlocked'),
      eligible: count('eligible'),
      locked: count('locked'),
      eventOwnerRequired: count('event-owner-required'),
      rows,
    });
  }));
  const progress = Math.max(0, Math.min(rank.next.threshold - rank.floor, rank.score - rank.floor));
  return Object.freeze({
    kind: 'projected',
    model: Object.freeze({
      schema: ARC9_RECORDS_RANK_READ_MODEL_SCHEMA_V1,
      rank: Object.freeze({
        score: rank.score,
        index: rank.index,
        name: rank.name,
        floor: rank.floor,
        nextThreshold: rank.next.threshold,
        nextName: rank.next.name,
        progress,
        span: rank.next.threshold - rank.floor,
        prestigeLevel: rank.prestigeLevel,
        bestRankIndex: projection.rewards.bestRankIndex,
        nameplateHue: projection.nameplate.hue,
        nameplateIridescent: projection.nameplate.iridescent,
      }),
      factors,
      achievements,
      unsupportedUnlockedIds: projection.achievements.unsupportedUnlockedIds,
      durableUnlockedCount: projection.achievements.rankCreditCount,
      eligibleAggregateCount: projection.achievements.eligibleProjectionCount,
      eventOwnerRequiredCount: projection.achievements.eventOwnerRequiredCount,
      aggregateRefreshAvailable: projection.achievements.eligibleProjectionCount > 0
        || projection.rewards.bestRankIndex !== projection.savedBestRankIndex,
    }),
  });
}
