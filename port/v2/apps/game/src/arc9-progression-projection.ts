/* Arc 9 app-side projection over the sanitized v4-compatible save state.

   The domain owns achievement/rank policy. This adapter owns only the exact
   mapping from current SaveStateV2 carriers to those bounded facts. It never
   guesses event-owned achievements, reads a clock, mutates its input, or
   creates a second save schema. */
import {
  ACHIEVEMENTS,
  MAX_UNLOCKED_ACHIEVEMENT_IDS,
  evaluateAchievementUnlocks,
  projectAchievementCatalogue,
  projectExplorerNameplate,
  projectExplorerRank,
  projectExplorerRankRewards,
  type AchievementCatalogueProjection,
  type AchievementSnapshot,
  type EventAchievementOwner,
  type ExplorerNameplateProjection,
  type ExplorerRankProjection,
  type ExplorerRankRecordProjection,
  type ExplorerRankRewards,
} from '@cf/domain-progression';
import type { SaveStateV2 } from '@cf/persistence';

export const ARC9_PROGRESSION_PROJECTION_SCHEMA_V1 = 'cf-v2-arc9-progression-projection/v1';

const MAX_COUNTER = 1_000_000_000;
const MAX_CODEX = 1_500;
const MAX_NAMES = 5_000;
const MAX_SURVEYS = 60_000;
const MAX_GALAXIES = 20_000;
const MAX_SMALL_SET = 200;
const MAX_EQUIPPED = 9;
const RANK_COUNT = 10;
const COSMIC_GEAR_IDS = new Set([
  'cg-proto', 'cg-genesis', 'cg-void', 'cg-chron', 'cg-dark', 'cg-plasma', 'cg-corona',
]);

export type Arc9ProgressionProjectionProtectionReasonV1 =
  | 'state-shape'
  | 'stats-shape'
  | 'codex-shape'
  | 'collection-shape'
  | 'inventory-shape'
  | 'equipment-shape'
  | 'achievement-id-shape'
  | 'achievement-capacity'
  | 'event-achievement-unsupported'
  | 'projection-failed';

/** The only event-achievement joins this disconnected Arc 9 adapter currently
 * supports. Each literal is still awarded solely by the exact action named by
 * its owner; this map is a typed cross-package contract, not an evaluator. */
export const ARC9_SUPPORTED_EVENT_ACHIEVEMENT_OWNERS_V1 = Object.freeze({
  home: 'landing:earth',
  curator: 'atlas:first-favorite',
  civ: 'survey:world-civilized',
  spacefar: 'survey:world-spacefaring',
  sol: 'survey:star-sol',
  binary: 'survey:star-binary',
  seebh: 'survey:star-black-hole',
  seens: 'survey:star-neutron-star',
  seemag: 'survey:star-magnetar',
  seewd: 'survey:star-white-dwarf',
  seerg: 'survey:star-red-giant',
  seesg: 'survey:star-red-supergiant',
  seeproto: 'survey:star-protostar',
  seebd: 'survey:star-brown-dwarf',
  namer: 'naming:first-discovery-name',
  bredlegend: 'breed:legendary-pair',
  brink: 'survival:below-twenty-hp',
  share: 'sharing:first-code-sent',
  wayfarer: 'sharing:first-code-followed',
  worm: 'travel:wormhole',
  quasar: 'travel:quasar-galaxy',
  dwarfg: 'travel:dwarf-galaxy',
} as const satisfies Readonly<Record<string, EventAchievementOwner>>);
export type Arc9SupportedEventAchievementIdV1 =
  keyof typeof ARC9_SUPPORTED_EVENT_ACHIEVEMENT_OWNERS_V1;

export interface Arc9EventAchievementJoinPreparationV1 {
  readonly kind: 'prepared';
  readonly achievementId: Arc9SupportedEventAchievementIdV1;
  readonly owner: (typeof ARC9_SUPPORTED_EVENT_ACHIEVEMENT_OWNERS_V1)[Arc9SupportedEventAchievementIdV1];
  readonly added: boolean;
  readonly priorUnlockedCount: number;
  readonly nextUnlockedIds: readonly string[];
}

export type Arc9EventAchievementJoinOutcomeV1 =
  | Arc9EventAchievementJoinPreparationV1
  | Readonly<{ kind: 'protected'; reason: Arc9ProgressionProjectionProtectionReasonV1 }>;

export interface Arc9ProgressionProjectionV1 {
  readonly schema: typeof ARC9_PROGRESSION_PROJECTION_SCHEMA_V1;
  readonly snapshot: AchievementSnapshot;
  /** Exact durable order. Known, event-owned, and safe compatibility ids are retained. */
  readonly unlockedIds: readonly string[];
  readonly achievements: AchievementCatalogueProjection;
  readonly rankRecord: ExplorerRankRecordProjection;
  readonly rank: ExplorerRankProjection;
  readonly savedBestRankIndex: number;
  readonly rewards: ExplorerRankRewards;
  readonly nameplate: ExplorerNameplateProjection;
}

export type Arc9ProgressionProjectionOutcomeV1 =
  | Readonly<{ kind: 'projected'; projection: Arc9ProgressionProjectionV1 }>
  | Readonly<{ kind: 'protected'; reason: Arc9ProgressionProjectionProtectionReasonV1 }>;

export interface Arc9ProgressionRefreshReadyV1 {
  readonly kind: 'ready';
  readonly source: Arc9ProgressionProjectionV1;
  readonly successor: Arc9ProgressionProjectionV1;
  readonly successorState: SaveStateV2;
  readonly addedAchievementIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
}

export type Arc9ProgressionRefreshPreparationV1 =
  | Arc9ProgressionRefreshReadyV1
  | Readonly<{ kind: 'current'; projection: Arc9ProgressionProjectionV1 }>
  | Readonly<{ kind: 'protected'; reason: Arc9ProgressionProjectionProtectionReasonV1 }>;

class ProjectionProtection extends Error {
  constructor(readonly reason: Arc9ProgressionProjectionProtectionReasonV1) {
    super(reason);
  }
}

function protect(reason: Arc9ProgressionProjectionProtectionReasonV1): never {
  throw new ProjectionProtection(reason);
}

function plainRecord(value: unknown, reason: Arc9ProgressionProjectionProtectionReasonV1): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) protect(reason);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) protect(reason);
  if (Reflect.ownKeys(value).some((key) => typeof key !== 'string')) protect(reason);
  return value as Record<string, unknown>;
}

function dataValue(record: Record<string, unknown>, key: string, reason: Arc9ProgressionProjectionProtectionReasonV1): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) protect(reason);
  return descriptor.value;
}

function optionalDataValue(record: Record<string, unknown>, key: string, reason: Arc9ProgressionProjectionProtectionReasonV1): unknown {
  if (!Object.prototype.hasOwnProperty.call(record, key)) return undefined;
  return dataValue(record, key, reason);
}

function denseArray(value: unknown, maximum: number, reason: Arc9ProgressionProjectionProtectionReasonV1): readonly unknown[] {
  if (!Array.isArray(value) || value.length > maximum || Object.getPrototypeOf(value) !== Array.prototype) protect(reason);
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1 || keys.some((key) => typeof key === 'symbol')) protect(reason);
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || !('value' in length) || length.value !== value.length) protect(reason);
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) protect(reason);
  }
  return value;
}

function tuple2(value: unknown, reason: Arc9ProgressionProjectionProtectionReasonV1): readonly [unknown, unknown] {
  const row = denseArray(value, 2, reason);
  if (row.length !== 2) protect(reason);
  return row as readonly [unknown, unknown];
}

/** Legacy numeric carriers were permissive. The v2 projection closes them to
 * the domain's strict integer bounds without rewriting unrelated save bytes.
 * Flooring preserves every integer-threshold predicate for honest records. */
function boundedCounter(
  stats: Record<string, unknown>,
  key: string,
  maximum = MAX_COUNTER,
): number {
  const value = optionalDataValue(stats, key, 'stats-shape');
  if (value === undefined) return 0;
  if (typeof value !== 'number' || !Number.isFinite(value)) protect('stats-shape');
  return Math.min(maximum, Math.max(0, Math.trunc(value)));
}

function boundedIndex(value: unknown, low: number, high: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(high, Math.max(low, Math.trunc(value)));
}

function countRows(state: Record<string, unknown>, key: string, maximum: number): number {
  return denseArray(dataValue(state, key, 'collection-shape'), maximum, 'collection-shape').length;
}

function positiveItemIds(state: Record<string, unknown>): ReadonlySet<string> {
  const rows = denseArray(dataValue(state, 'items', 'inventory-shape'), 300, 'inventory-shape');
  const ids = new Set<string>();
  for (const value of rows) {
    const [id, count] = tuple2(value, 'inventory-shape');
    if (typeof id !== 'string' || id.length < 1 || id.length > 96
      || typeof count !== 'number' || !Number.isFinite(count)) protect('inventory-shape');
    if (Math.trunc(count) > 0) ids.add(id);
  }
  return ids;
}

function equippedCount(state: Record<string, unknown>): number {
  const equip = plainRecord(dataValue(state, 'equip', 'equipment-shape'), 'equipment-shape');
  const keys = Object.keys(equip);
  if (keys.length > MAX_EQUIPPED) protect('equipment-shape');
  for (const key of keys) {
    const value = dataValue(equip, key, 'equipment-shape');
    if (key.length < 1 || key.length > 32 || typeof value !== 'string' || value.length < 1 || value.length > 96) {
      protect('equipment-shape');
    }
  }
  return keys.length;
}

function codexFacts(state: Record<string, unknown>): Readonly<{
  count: number;
  kingdomCount: number;
  realmCount: number;
  displayTierCount: number;
}> {
  const rows = denseArray(dataValue(state, 'codex', 'codex-shape'), MAX_CODEX, 'codex-shape');
  const ids = new Set<string>();
  const kinds = new Set<string>();
  const realms = new Set<string>();
  const tiers = new Set<number>();
  for (const value of rows) {
    const [id, rawEntry] = tuple2(value, 'codex-shape');
    if (typeof id !== 'string' || id.length < 1 || id.length > 96 || ids.has(id)) protect('codex-shape');
    ids.add(id);
    const entry = plainRecord(rawEntry, 'codex-shape');
    const kind = dataValue(entry, 'kind', 'codex-shape');
    const realm = dataValue(entry, 'realm', 'codex-shape');
    const tier = dataValue(entry, 'tier', 'codex-shape');
    if (typeof kind !== 'string' || typeof realm !== 'string'
      || (tier !== null && (typeof tier !== 'number' || !Number.isFinite(tier)))) protect('codex-shape');
    if (kind.length > 0) kinds.add(kind);
    if (realm.length > 0) realms.add(realm);
    if (typeof tier === 'number') tiers.add(Math.min(9, Math.max(0, Math.trunc(tier))));
  }
  return Object.freeze({
    count: rows.length,
    kingdomCount: Math.min(4, kinds.size),
    realmCount: Math.min(16, realms.size),
    displayTierCount: Math.min(10, tiers.size),
  });
}

function unlockedIds(state: Record<string, unknown>): readonly string[] {
  const rows = denseArray(
    dataValue(state, 'unlocked', 'achievement-id-shape'),
    MAX_UNLOCKED_ACHIEVEMENT_IDS,
    'achievement-id-shape',
  );
  const result: string[] = [];
  const unique = new Set<string>();
  for (const value of rows) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/u.test(value)
      || unique.has(value)) protect('achievement-id-shape');
    unique.add(value);
    result.push(value);
  }
  return Object.freeze(result);
}

function project(state: SaveStateV2): Arc9ProgressionProjectionV1 {
  const root = plainRecord(state, 'state-shape');
  const stats = plainRecord(dataValue(root, 'stats', 'stats-shape'), 'stats-shape');
  const codex = codexFacts(root);
  const unlocked = unlockedIds(root);
  const items = positiveItemIds(root);
  const snapshot: AchievementSnapshot = Object.freeze({
    cataloguedSpeciesCount: codex.count,
    ownedKingdomCount: codex.kingdomCount,
    ownedRealmCount: codex.realmCount,
    hybridCount: boundedCounter(stats, 'hybrids'),
    maxGeneration: boundedCounter(stats, 'maxGen'),
    bestRawRarityTier: boundedCounter(stats, 'best', 14),
    ownedDisplayRarityTierCount: codex.displayTierCount,
    surveyedLivingWorldCount: countRows(root, 'surveyedSet', MAX_SURVEYS),
    surveyedWorldTypeCount: Math.min(8, countRows(root, 'ptypesSeen', MAX_SMALL_SET)),
    surfaceWorldCount: countRows(root, 'surfSeen', MAX_SURVEYS),
    surveyedStarClassCount: Math.min(8, countRows(root, 'starKindsSeen', MAX_SMALL_SET)),
    galaxyCount: countRows(root, 'galSeen', MAX_GALAXIES),
    craftCount: boundedCounter(stats, 'crafts'),
    equippedGearCount: equippedCount(root),
    ascentChapterIndex: boundedIndex(dataValue(root, 'ascCh', 'collection-shape'), 0, 3, 0),
    minedOutWorldCount: boundedCounter(stats, 'minedout'),
    miningLoadCount: boundedCounter(stats, 'mines'),
    cosmicMaterialCount: boundedCounter(stats, 'cosmics'),
    coronaSkimCount: boundedCounter(stats, 'skims'),
    beaconCount: boundedCounter(stats, 'anomalies'),
    cosmicEventCount: boundedCounter(stats, 'events'),
    settledWorldCount: countRows(root, 'conquered', MAX_GALAXIES),
    guardianCount: boundedCounter(stats, 'guardians'),
    stardustHarvestCount: boundedCounter(stats, 'harvests'),
    lifetimeStardust: boundedCounter(stats, 'essenceEarned'),
    breedAttemptCount: boundedCounter(stats, 'breeds'),
    breedWinCount: boundedCounter(stats, 'breedwins'),
    feedCount: boundedCounter(stats, 'feeds'),
    poisonousMealLossCount: boundedCounter(stats, 'feedfails'),
    duelCount: boundedCounter(stats, 'duels'),
    duelWinCount: boundedCounter(stats, 'duelwins'),
    namedDiscoveryCount: countRows(root, 'customNames', MAX_NAMES),
    sharedCodeCount: boundedCounter(stats, 'shares'),
    followedShareCodeCount: boundedCounter(stats, 'jumps'),
    hasJumpDrive: items.has('jumpdrive'),
    hasLongRangeArray: items.has('array'),
    hasIntergalacticDrive: items.has('igdrive'),
    hasCosmicGear: [...COSMIC_GEAR_IDS].some((id) => items.has(id)),
  });
  const achievements = projectAchievementCatalogue(snapshot, unlocked);
  const rankRecord: ExplorerRankRecordProjection = Object.freeze({
    surveyedLivingWorldCount: snapshot.surveyedLivingWorldCount,
    cataloguedSpeciesCount: snapshot.cataloguedSpeciesCount,
    bestRawRarityTier: snapshot.bestRawRarityTier,
    unlockedAchievementCount: achievements.rankCreditCount,
    hybridCount: snapshot.hybridCount,
    galaxyCount: snapshot.galaxyCount,
  });
  const rank = projectExplorerRank(rankRecord);
  const savedBestRankIndex = boundedIndex(
    optionalDataValue(stats, 'bestRank', 'stats-shape'), 0, RANK_COUNT - 1, 0,
  );
  const rewards = projectExplorerRankRewards(rank, savedBestRankIndex);
  const nameplate = projectExplorerNameplate(
    rank,
    rewards.bestRankIndex,
    boundedIndex(dataValue(root, 'nameHue', 'state-shape'), -1, RANK_COUNT - 1, -1),
  );
  return Object.freeze({
    schema: ARC9_PROGRESSION_PROJECTION_SCHEMA_V1,
    snapshot,
    unlockedIds: unlocked,
    achievements,
    rankRecord,
    rank,
    savedBestRankIndex,
    rewards,
    nameplate,
  });
}

export function projectArc9ProgressionStateV1(state: SaveStateV2): Arc9ProgressionProjectionOutcomeV1 {
  try {
    return Object.freeze({ kind: 'projected', projection: project(state) });
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof ProjectionProtection ? error.reason : 'projection-failed',
    });
  }
}

/** Prepare one exact event-owned achievement append without evaluating any
 * aggregate rule or updating the rank mirror. The gameplay transaction that
 * proved the event remains the sole caller and persistence owner. */
export function prepareArc9EventAchievementJoinV1(
  state: SaveStateV2,
  achievementId: Arc9SupportedEventAchievementIdV1,
): Arc9EventAchievementJoinOutcomeV1 {
  if (typeof achievementId !== 'string'
    || !Object.prototype.hasOwnProperty.call(
      ARC9_SUPPORTED_EVENT_ACHIEVEMENT_OWNERS_V1,
      achievementId,
    )) {
    return Object.freeze({ kind: 'protected', reason: 'event-achievement-unsupported' });
  }
  const owner = ARC9_SUPPORTED_EVENT_ACHIEVEMENT_OWNERS_V1[achievementId];
  const definition = ACHIEVEMENTS.find(({ id }) => id === achievementId);
  if (!definition || definition.evaluation.kind !== 'event-owner'
    || definition.evaluation.owner !== owner) {
    return Object.freeze({ kind: 'protected', reason: 'event-achievement-unsupported' });
  }
  const current = projectArc9ProgressionStateV1(state);
  if (current.kind !== 'projected') return current;
  const priorUnlockedCount = current.projection.unlockedIds.length;
  if (current.projection.unlockedIds.includes(achievementId)) {
    return Object.freeze({
      kind: 'prepared',
      achievementId,
      owner,
      added: false,
      priorUnlockedCount,
      nextUnlockedIds: current.projection.unlockedIds,
    });
  }
  if (priorUnlockedCount >= MAX_UNLOCKED_ACHIEVEMENT_IDS) {
    return Object.freeze({ kind: 'protected', reason: 'achievement-capacity' });
  }
  const nextUnlockedIds = Object.freeze([
    ...current.projection.unlockedIds,
    achievementId,
  ]);
  const successorState: SaveStateV2 = { ...state, unlocked: [...nextUnlockedIds] };
  const successor = projectArc9ProgressionStateV1(successorState);
  if (successor.kind !== 'projected'
    || successor.projection.unlockedIds.length !== nextUnlockedIds.length
    || successor.projection.unlockedIds.some((id, index) => id !== nextUnlockedIds[index])
    || successor.projection.achievements.rows.find(({ id }) => id === achievementId)?.status
      !== 'unlocked') {
    return Object.freeze({ kind: 'protected', reason: 'projection-failed' });
  }
  return Object.freeze({
    kind: 'prepared',
    achievementId,
    owner,
    added: true,
    priorUnlockedCount,
    nextUnlockedIds,
  });
}

/** Prepares the only save mutation Arc 9 aggregate projection owns: append
 * every newly proven aggregate id in manifest order and monotonically raise
 * `stats.bestRank`. Event-owned ids are not candidates. */
export function prepareArc9ProgressionRefreshV1(
  state: SaveStateV2,
): Arc9ProgressionRefreshPreparationV1 {
  const current = projectArc9ProgressionStateV1(state);
  if (current.kind !== 'projected') return current;
  const addedAchievementIds = evaluateAchievementUnlocks(
    current.projection.snapshot,
    current.projection.unlockedIds,
  );
  if (current.projection.unlockedIds.length + addedAchievementIds.length
    > MAX_UNLOCKED_ACHIEVEMENT_IDS) {
    return Object.freeze({ kind: 'protected', reason: 'achievement-capacity' });
  }
  const nextUnlocked = Object.freeze([
    ...current.projection.unlockedIds,
    ...addedAchievementIds,
  ]);
  const successorRank = projectExplorerRank(Object.freeze({
    ...current.projection.rankRecord,
    unlockedAchievementCount: nextUnlocked.length,
  }));
  const nextBestRankIndex = Math.max(
    current.projection.savedBestRankIndex,
    successorRank.index,
  );
  const root = state as unknown as Record<string, unknown>;
  const stats = dataValue(root, 'stats', 'stats-shape') as Record<string, number>;
  const rawBestRank = Object.prototype.hasOwnProperty.call(stats, 'bestRank')
    ? stats.bestRank : undefined;
  if (addedAchievementIds.length === 0 && rawBestRank === nextBestRankIndex) {
    return Object.freeze({ kind: 'current', projection: current.projection });
  }
  const successorState: SaveStateV2 = {
    ...state,
    stats: { ...state.stats, bestRank: nextBestRankIndex },
    unlocked: [...nextUnlocked],
  };
  const successor = projectArc9ProgressionStateV1(successorState);
  if (successor.kind !== 'projected') return successor;
  if (evaluateAchievementUnlocks(
    successor.projection.snapshot,
    successor.projection.unlockedIds,
  ).length !== 0
    || successor.projection.rewards.bestRankIndex !== nextBestRankIndex
    || successor.projection.unlockedIds.length > MAX_UNLOCKED_ACHIEVEMENT_IDS) {
    return Object.freeze({ kind: 'protected', reason: 'projection-failed' });
  }
  return Object.freeze({
    kind: 'ready',
    source: current.projection,
    successor: successor.projection,
    successorState,
    addedAchievementIds,
    priorBestRankIndex: current.projection.savedBestRankIndex,
    nextBestRankIndex,
  });
}
