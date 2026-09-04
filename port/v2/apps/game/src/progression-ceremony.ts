/* Arc 9 postcommit achievement/rank ceremony planning.

   Gameplay transactions own every durable achievement and best-rank fact.
   This pure adapter accepts only the exact append delta proved by one such
   transaction and translates it into presentation intents. It never writes a
   save, evaluates an achievement rule, grants a reward, reads a clock, or
   performs DOM/audio/visual work. Main owns the one delivery seam after live
   publication has matched the committed fixed point. */
import {
  ACHIEVEMENTS,
  EXPLORER_RANKS,
  MAX_UNLOCKED_ACHIEVEMENT_IDS,
} from '@cf/domain-progression';

export const PROGRESSION_CEREMONY_SCHEMA_V1 = 'cf-v2-progression-ceremony/v1';

export const PROGRESSION_CEREMONY_GOLD_COLORS_V1 = Object.freeze([
  '#f2d27f', '#ffd96a', '#fff3c4', '#e0a84a',
] as const);

export type ProgressionCeremonyDispositionV1 =
  | 'committed-publication'
  | 'boot-catch-up'
  | 'replay'
  | 'already-durable'
  | 'committed-convergence'
  | 'training-sandbox'
  | 'refused';

export interface ProgressionCeremonyInputV1 {
  readonly disposition: ProgressionCeremonyDispositionV1;
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly addedAchievementIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
}

export interface AchievementCeremonyNotificationV1 {
  readonly kind: 'achievement';
  readonly achievementId: string;
  readonly title: string;
  readonly detail: string;
  readonly stingTier: 3;
}

export interface RankPromotionCeremonyV1 {
  readonly kind: 'rank-promotion';
  readonly rankIndex: number;
  readonly rankName: string;
  readonly title: string;
  readonly detail: string;
  readonly stingTier: 5;
  readonly goldBurst: Readonly<{
    readonly colors: typeof PROGRESSION_CEREMONY_GOLD_COLORS_V1;
    /** Mature v1 semantic. Main may lower the rendered count through the
     * current effects/motion/device budget, but may never exceed it. */
    readonly maximumParticleCount: 40;
  }>;
}

export interface ProgressionCeremonyPlanV1 {
  readonly kind: 'present';
  readonly schema: typeof PROGRESSION_CEREMONY_SCHEMA_V1;
  readonly achievements: readonly AchievementCeremonyNotificationV1[];
  readonly rankPromotion: RankPromotionCeremonyV1 | null;
}

export type ProgressionCeremonyOutcomeV1 =
  | ProgressionCeremonyPlanV1
  | Readonly<{
    readonly kind: 'silent';
    readonly reason: Exclude<ProgressionCeremonyDispositionV1, 'committed-publication'>
      | 'no-new-ceremony';
  }>
  | Readonly<{
    readonly kind: 'protected';
    readonly reason:
      | 'input-shape'
      | 'achievement-id-shape'
      | 'achievement-delta-mismatch'
      | 'achievement-unsupported'
      | 'rank-index-shape'
      | 'rank-demotion';
  }>;

const DISPOSITIONS = new Set<ProgressionCeremonyDispositionV1>([
  'committed-publication',
  'boot-catch-up',
  'replay',
  'already-durable',
  'committed-convergence',
  'training-sandbox',
  'refused',
]);
const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((definition) => [definition.id, definition]));
const INPUT_FIELDS = Object.freeze([
  'disposition',
  'priorUnlockedIds',
  'nextUnlockedIds',
  'addedAchievementIds',
  'priorBestRankIndex',
  'nextBestRankIndex',
] as const);
const ACHIEVEMENT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/u;

function exactPlainInput(value: unknown): value is ProgressionCeremonyInputV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== INPUT_FIELDS.length || keys.some((key) => typeof key !== 'string')) return false;
  const names = (keys as string[]).slice().sort();
  const expected = [...INPUT_FIELDS].sort();
  if (names.some((name, index) => name !== expected[index])) return false;
  return INPUT_FIELDS.every((field) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    return descriptor !== undefined && 'value' in descriptor && descriptor.enumerable === true;
  });
}

function exactIdList(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > MAX_UNLOCKED_ACHIEVEMENT_IDS) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1 || keys.some((key) => typeof key === 'symbol')) return null;
  const ids: string[] = [];
  const unique = new Set<string>();
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
      || typeof descriptor.value !== 'string' || !ACHIEVEMENT_ID.test(descriptor.value)
      || unique.has(descriptor.value)) return null;
    unique.add(descriptor.value);
    ids.push(descriptor.value);
  }
  return Object.freeze(ids);
}

function plainAchievementDetail(value: string): string {
  /* The catalogue preserves three literal legacy apostrophe entities for its
     innerHTML Records sink. Ceremony copy is text, so decode only that exact
     authored entity instead of exposing markup or implementing an HTML parser. */
  return value.replaceAll('&#8217;', '’');
}

/** Produce presentation-only intents for one exact committed append/rank
 * transition. Every non-first-publication disposition is silent before any
 * delta can become a ceremony, which makes boot, replay, already-durable,
 * convergence and failed-storage callers structurally non-celebratory. */
export function planProgressionCeremonyV1(
  inputValue: ProgressionCeremonyInputV1,
): ProgressionCeremonyOutcomeV1 {
  if (!exactPlainInput(inputValue)
    || typeof inputValue.disposition !== 'string'
    || !DISPOSITIONS.has(inputValue.disposition)) {
    return Object.freeze({ kind: 'protected', reason: 'input-shape' });
  }
  if (inputValue.disposition !== 'committed-publication') {
    return Object.freeze({ kind: 'silent', reason: inputValue.disposition });
  }

  const priorUnlockedIds = exactIdList(inputValue.priorUnlockedIds);
  const nextUnlockedIds = exactIdList(inputValue.nextUnlockedIds);
  const addedAchievementIds = exactIdList(inputValue.addedAchievementIds);
  if (priorUnlockedIds === null || nextUnlockedIds === null || addedAchievementIds === null) {
    return Object.freeze({ kind: 'protected', reason: 'achievement-id-shape' });
  }
  if (nextUnlockedIds.length < priorUnlockedIds.length
    || priorUnlockedIds.some((id, index) => nextUnlockedIds[index] !== id)) {
    return Object.freeze({ kind: 'protected', reason: 'achievement-delta-mismatch' });
  }
  const appended = nextUnlockedIds.slice(priorUnlockedIds.length);
  if (appended.length !== addedAchievementIds.length
    || appended.some((id, index) => id !== addedAchievementIds[index])) {
    return Object.freeze({ kind: 'protected', reason: 'achievement-delta-mismatch' });
  }
  if (!Number.isSafeInteger(inputValue.priorBestRankIndex)
    || !Number.isSafeInteger(inputValue.nextBestRankIndex)
    || inputValue.priorBestRankIndex < 0
    || inputValue.nextBestRankIndex < 0
    || inputValue.priorBestRankIndex >= EXPLORER_RANKS.length
    || inputValue.nextBestRankIndex >= EXPLORER_RANKS.length) {
    return Object.freeze({ kind: 'protected', reason: 'rank-index-shape' });
  }
  if (inputValue.nextBestRankIndex < inputValue.priorBestRankIndex) {
    return Object.freeze({ kind: 'protected', reason: 'rank-demotion' });
  }

  const achievements: AchievementCeremonyNotificationV1[] = [];
  for (const achievementId of addedAchievementIds) {
    const definition = ACHIEVEMENT_BY_ID.get(achievementId);
    if (definition === undefined) {
      return Object.freeze({ kind: 'protected', reason: 'achievement-unsupported' });
    }
    achievements.push(Object.freeze({
      kind: 'achievement',
      achievementId,
      title: `Achievement · ${definition.name}`,
      detail: plainAchievementDetail(definition.description),
      stingTier: 3,
    }));
  }

  let rankPromotion: RankPromotionCeremonyV1 | null = null;
  if (inputValue.nextBestRankIndex > inputValue.priorBestRankIndex) {
    const promoted = EXPLORER_RANKS[inputValue.nextBestRankIndex];
    if (promoted === undefined) {
      return Object.freeze({ kind: 'protected', reason: 'rank-index-shape' });
    }
    rankPromotion = Object.freeze({
      kind: 'rank-promotion',
      rankIndex: promoted.index,
      rankName: promoted.name,
      title: `Rank Up — ${promoted.name}`,
      detail: 'Your expedition record speaks for itself, explorer.',
      stingTier: 5,
      goldBurst: Object.freeze({
        colors: PROGRESSION_CEREMONY_GOLD_COLORS_V1,
        maximumParticleCount: 40,
      }),
    });
  }

  if (achievements.length === 0 && rankPromotion === null) {
    return Object.freeze({ kind: 'silent', reason: 'no-new-ceremony' });
  }
  return Object.freeze({
    kind: 'present',
    schema: PROGRESSION_CEREMONY_SCHEMA_V1,
    achievements: Object.freeze(achievements),
    rankPromotion,
  });
}
