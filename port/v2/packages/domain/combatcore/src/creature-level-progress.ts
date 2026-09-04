/* CombatCore-owned presentation boundaries for the established XP curve.

   The lifted `levelOf` function remains the only curve authority. This helper
   discovers the current span by querying that function across the bounded
   creature-XP domain, so UI callers never duplicate 6·l² or the L9 cap. */
import {
  levelOf,
  projectCreatureInnateArts,
  type CreatureInnateArt,
} from './combatcore.verbatim.js';

export const CREATURE_XP_MAX_V1 = 486 as const;

export interface CreatureLevelProgressV1 {
  readonly xp: number;
  readonly level: number;
  readonly maximumLevel: number;
  readonly levelFloorXp: number;
  readonly nextLevelXp: number | null;
  readonly levelProgressXp: number;
  readonly levelProgressSpanXp: number;
  readonly levelProgressPercent: number;
  readonly awakenedInnateSlots: 1 | 2 | 3;
  readonly nextInnateLevel: 3 | 6 | null;
}

export interface CreatureClassProgressionV1 extends CreatureLevelProgressV1 {
  readonly className: string;
  readonly classGroup: string;
  readonly innateArts: readonly CreatureInnateArt[];
}

export function projectCreatureLevelProgressV1(xpValue: unknown): CreatureLevelProgressV1 {
  if (!Number.isSafeInteger(xpValue) || (xpValue as number) < 0
    || (xpValue as number) > CREATURE_XP_MAX_V1) {
    throw new RangeError(`creature XP must be an integer from 0 through ${CREATURE_XP_MAX_V1}`);
  }
  const xp = xpValue as number;
  const level = levelOf({ xp });
  const maximumLevel = levelOf({ xp: CREATURE_XP_MAX_V1 });
  let levelFloorXp = xp;
  while (levelFloorXp > 0 && levelOf({ xp: levelFloorXp - 1 }) === level) {
    levelFloorXp--;
  }
  let nextLevelXp: number | null = null;
  for (let candidate = xp + 1; candidate <= CREATURE_XP_MAX_V1; candidate++) {
    if (levelOf({ xp: candidate }) > level) {
      nextLevelXp = candidate;
      break;
    }
  }
  const levelProgressXp = nextLevelXp === null ? 0 : xp - levelFloorXp;
  const levelProgressSpanXp = nextLevelXp === null ? 0 : nextLevelXp - levelFloorXp;
  const awakenedInnateSlots = (1 + (level >= 3 ? 1 : 0) + (level >= 6 ? 1 : 0)) as 1 | 2 | 3;
  return Object.freeze({
    xp,
    level,
    maximumLevel,
    levelFloorXp,
    nextLevelXp,
    levelProgressXp,
    levelProgressSpanXp,
    levelProgressPercent: nextLevelXp === null
      ? 100
      : Math.max(0, Math.min(100, Math.floor(
        (levelProgressXp * 100) / levelProgressSpanXp,
      ))),
    awakenedInnateSlots,
    nextInnateLevel: level < 3 ? 3 : level < 6 ? 6 : null,
  });
}

/** Join one exact owned XP value to CombatCore's private canonical class kit.
 * The generated adapter is the only reader of the legacy class/archetype
 * tables; callers receive a frozen projection rather than either table. */
export function projectCreatureClassProgressionV1(
  genomeValue: Readonly<Record<string, unknown>>,
  xpValue: unknown,
): CreatureClassProgressionV1 {
  if (!genomeValue || typeof genomeValue !== 'object' || Array.isArray(genomeValue)) {
    throw new TypeError('creature progression requires a genome record');
  }
  const prototype = Object.getPrototypeOf(genomeValue);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('creature progression genome must use a plain prototype');
  }
  for (const key of Reflect.ownKeys(genomeValue)) {
    if (typeof key !== 'string') {
      throw new TypeError('creature progression genome cannot contain symbols');
    }
    const descriptor = Object.getOwnPropertyDescriptor(genomeValue, key);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw new TypeError('creature progression genome cannot contain accessors');
    }
  }
  const progress = projectCreatureLevelProgressV1(xpValue);
  const kit = projectCreatureInnateArts(Object.freeze({ ...genomeValue, xp: progress.xp }));
  if (kit.level !== progress.level
    || kit.awakenedInnateSlots !== progress.awakenedInnateSlots
    || kit.arts.length !== progress.awakenedInnateSlots
    || kit.arts.some((art, index) => art.slot !== index + 1)) {
    throw new Error('CombatCore creature progression projection diverged');
  }
  return Object.freeze({
    ...progress,
    className: kit.className,
    classGroup: kit.classGroup,
    innateArts: kit.arts,
  });
}
