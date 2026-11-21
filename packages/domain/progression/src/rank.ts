/* Arc 9A explorer-rank authority.

   Thresholds, names, score weights, nameplate hues, summit foil and endless
   prestige are exact v1.8.9 behavior. This module is pure: persistence owns
   the historical best-rank index, and the app owns presentation/fanfare. */

import { ACHIEVEMENT_SCORE_CREDIT, MAX_UNLOCKED_ACHIEVEMENT_IDS } from './achievements.js';

export const EXPLORER_PRESTIGE_STEP = 3_000;

export interface ExplorerRankDefinition {
  readonly index: number;
  readonly threshold: number;
  readonly name: string;
  readonly nameplateHue: string;
  readonly iridescent: boolean;
}

const rank = (
  index: number,
  threshold: number,
  name: string,
  nameplateHue: string,
): ExplorerRankDefinition => Object.freeze({
  index, threshold, name, nameplateHue, iridescent: nameplateHue === 'irid',
});

export const EXPLORER_RANKS: readonly ExplorerRankDefinition[] = Object.freeze([
  rank(0, 0, 'Cadet', '#9fb6d6'),
  rank(1, 30, 'Scout', '#7fe6a0'),
  rank(2, 90, 'Pathfinder', '#7fd0ff'),
  rank(3, 220, 'Voyager', '#5b8cf0'),
  rank(4, 460, 'Pioneer', '#46c2b2'),
  rank(5, 900, 'Star Cartographer', '#ffd96a'),
  rank(6, 1_700, 'Mythic Wayfarer', '#b06cff'),
  rank(7, 3_000, 'Void Sovereign', '#7a6af0'),
  rank(8, 5_200, 'Cosmic Luminary', '#ffe9b8'),
  rank(9, 8_200, 'Eternal Frontier', 'irid'),
]);

export const EXPLORER_RANK_SCORE_WEIGHTS = Object.freeze({
  surveyedLivingWorld: 4,
  cataloguedSpecies: 2,
  bestRawRarityTier: 12,
  unlockedAchievement: ACHIEVEMENT_SCORE_CREDIT,
  hybrid: 1,
  galaxyVisited: 3,
});

export interface ExplorerRankRecordProjection {
  readonly surveyedLivingWorldCount: number;
  readonly cataloguedSpeciesCount: number;
  readonly bestRawRarityTier: number;
  /** Includes preserved unknown compatibility ids, matching v1.8.9 rankInfo. */
  readonly unlockedAchievementCount: number;
  readonly hybridCount: number;
  readonly galaxyCount: number;
}

const RANK_RECORD_BOUNDS = Object.freeze({
  surveyedLivingWorldCount: 60_000,
  cataloguedSpeciesCount: 1_500,
  bestRawRarityTier: 14,
  unlockedAchievementCount: MAX_UNLOCKED_ACHIEVEMENT_IDS,
  hybridCount: 1_000_000_000,
  galaxyCount: 20_000,
} satisfies Readonly<Record<keyof ExplorerRankRecordProjection, number>>);

export interface ExplorerRankNext {
  readonly threshold: number;
  readonly name: string;
}

export interface ExplorerRankProjection {
  readonly score: number;
  readonly index: number;
  readonly floor: number;
  readonly name: string;
  readonly prestigeLevel: number;
  readonly next: ExplorerRankNext;
  readonly nameplateHue: string;
  readonly iridescent: boolean;
}

function assertRankRecord(record: ExplorerRankRecordProjection): void {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('explorer rank record must be an object');
  }
  for (const [field, maximum] of Object.entries(RANK_RECORD_BOUNDS) as Array<[keyof ExplorerRankRecordProjection, number]>) {
    const value = record[field];
    if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
      throw new RangeError(`${field} must be a bounded non-negative integer`);
    }
  }
}

export function expeditionScore(record: ExplorerRankRecordProjection): number {
  assertRankRecord(record);
  return record.surveyedLivingWorldCount * EXPLORER_RANK_SCORE_WEIGHTS.surveyedLivingWorld
    + record.cataloguedSpeciesCount * EXPLORER_RANK_SCORE_WEIGHTS.cataloguedSpecies
    + record.bestRawRarityTier * EXPLORER_RANK_SCORE_WEIGHTS.bestRawRarityTier
    + record.unlockedAchievementCount * EXPLORER_RANK_SCORE_WEIGHTS.unlockedAchievement
    + record.hybridCount * EXPLORER_RANK_SCORE_WEIGHTS.hybrid
    + record.galaxyCount * EXPLORER_RANK_SCORE_WEIGHTS.galaxyVisited;
}

export function projectExplorerRank(record: ExplorerRankRecordProjection): ExplorerRankProjection {
  const score = expeditionScore(record);
  const summit = EXPLORER_RANKS[EXPLORER_RANKS.length - 1]!;
  if (score >= summit.threshold) {
    const prestigeLevel = Math.floor((score - summit.threshold) / EXPLORER_PRESTIGE_STEP);
    const floor = summit.threshold + prestigeLevel * EXPLORER_PRESTIGE_STEP;
    return Object.freeze({
      score,
      index: summit.index,
      floor,
      name: summit.name + (prestigeLevel >= 1 ? ` ✦${prestigeLevel}` : ''),
      prestigeLevel,
      next: Object.freeze({
        threshold: floor + EXPLORER_PRESTIGE_STEP,
        name: `${summit.name} ✦${prestigeLevel + 1}`,
      }),
      nameplateHue: summit.nameplateHue,
      iridescent: summit.iridescent,
    });
  }

  let current = EXPLORER_RANKS[0]!;
  let next = EXPLORER_RANKS[1]!;
  for (let index = 1; index < EXPLORER_RANKS.length; index++) {
    const candidate = EXPLORER_RANKS[index]!;
    if (score >= candidate.threshold) current = candidate;
    else { next = candidate; break; }
  }
  return Object.freeze({
    score,
    index: current.index,
    floor: current.threshold,
    name: current.name,
    prestigeLevel: 0,
    next: Object.freeze({ threshold: next.threshold, name: next.name }),
    nameplateHue: current.nameplateHue,
    iridescent: current.iridescent,
  });
}

export interface ExplorerRankRewards {
  readonly bestRankIndex: number;
  readonly unlockedNameplates: readonly Readonly<{
    rankIndex: number;
    rankName: string;
    hue: string;
    iridescent: boolean;
  }>[];
}

/** Applies the legacy "unlocks never demote" rule without writing the save. */
export function projectExplorerRankRewards(
  current: ExplorerRankProjection,
  savedBestRankIndex: number,
): ExplorerRankRewards {
  if (!Number.isSafeInteger(savedBestRankIndex)
    || savedBestRankIndex < 0
    || savedBestRankIndex >= EXPLORER_RANKS.length) {
    throw new RangeError('saved best rank index is unsupported');
  }
  if (!current || !Number.isSafeInteger(current.index)
    || current.index < 0
    || current.index >= EXPLORER_RANKS.length) {
    throw new TypeError('current explorer rank projection is unsupported');
  }
  const bestRankIndex = Math.max(savedBestRankIndex, current.index);
  return Object.freeze({
    bestRankIndex,
    unlockedNameplates: Object.freeze(EXPLORER_RANKS.slice(0, bestRankIndex + 1).map((definition) =>
      Object.freeze({
        rankIndex: definition.index,
        rankName: definition.name,
        hue: definition.nameplateHue,
        iridescent: definition.iridescent,
      }))),
  });
}

export interface ExplorerNameplateProjection {
  readonly rankIndex: number;
  readonly hue: string;
  readonly iridescent: boolean;
  readonly usedSavedChoice: boolean;
}

export type ExplorerNameplateChoiceOutcome =
  | Readonly<{
    kind: 'allowed';
    choiceIndex: number;
    nameplate: ExplorerNameplateProjection;
  }>
  | Readonly<{
    kind: 'rejected';
    reason: 'choice-malformed' | 'choice-locked';
  }>;

/** Resolves `nh`: -1 follows the current rank; a locked/out-of-range choice
 * also falls back to current, exactly as v1.8.9 `_plateHue`. */
export function projectExplorerNameplate(
  current: ExplorerRankProjection,
  bestRankIndex: number,
  savedChoiceIndex: number,
): ExplorerNameplateProjection {
  if (!current || !Number.isSafeInteger(current.index)
    || current.index < 0
    || current.index >= EXPLORER_RANKS.length) {
    throw new TypeError('current explorer rank projection is unsupported');
  }
  if (!Number.isSafeInteger(bestRankIndex) || bestRankIndex < 0 || bestRankIndex >= EXPLORER_RANKS.length) {
    throw new RangeError('best rank index is unsupported');
  }
  if (!Number.isSafeInteger(savedChoiceIndex) || savedChoiceIndex < -1 || savedChoiceIndex >= EXPLORER_RANKS.length) {
    throw new RangeError('saved nameplate choice is unsupported');
  }
  const usedSavedChoice = savedChoiceIndex >= 0 && savedChoiceIndex <= bestRankIndex;
  const index = usedSavedChoice ? savedChoiceIndex : current.index;
  const definition = EXPLORER_RANKS[index];
  if (!definition) throw new TypeError('current explorer rank projection is unsupported');
  return Object.freeze({
    rankIndex: definition.index,
    hue: definition.nameplateHue,
    iridescent: definition.iridescent,
    usedSavedChoice,
  });
}

/** Strict write-side boundary for `nh`. Read compatibility deliberately lets
 * an old locked choice fall back to the current rank above; a new mutation is
 * narrower and may persist only Auto (`-1`) or a permanently earned rank
 * index through the durable best-rank mirror. */
export function prepareExplorerNameplateChoice(
  current: ExplorerRankProjection,
  bestRankIndex: number,
  requestedChoiceIndex: unknown,
): ExplorerNameplateChoiceOutcome {
  if (!Number.isSafeInteger(requestedChoiceIndex)
    || (requestedChoiceIndex as number) < -1
    || (requestedChoiceIndex as number) >= EXPLORER_RANKS.length) {
    return Object.freeze({ kind: 'rejected', reason: 'choice-malformed' });
  }
  if (!Number.isSafeInteger(bestRankIndex)
    || bestRankIndex < 0
    || bestRankIndex >= EXPLORER_RANKS.length) {
    throw new RangeError('best rank index is unsupported');
  }
  const choiceIndex = requestedChoiceIndex as number;
  if (choiceIndex > bestRankIndex) {
    return Object.freeze({ kind: 'rejected', reason: 'choice-locked' });
  }
  return Object.freeze({
    kind: 'allowed',
    choiceIndex,
    nameplate: projectExplorerNameplate(current, bestRankIndex, choiceIndex),
  });
}
