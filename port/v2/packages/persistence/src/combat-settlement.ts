/* Arc 6 registered combat settlement persistence.

   This is the storage-side join for one already-planned deterministic combat
   outcome. It binds the registered combat plan to the registered canonical
   opportunity and current Arc 5 ownership source, derives every compatible
   v4/v5 replacement on detached data, and delegates the sole write to the
   existing F4 deterministic-product/F3 CAS owner. No retry, reroll, or
   optimistic publication exists here. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  canonicalizeData,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  sha256Hex,
  type CanonicalJsonObject,
  type CreatureInstanceV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  prepareArc6CombatOwnershipV1,
  type Arc6CombatOwnershipSettlementV1,
} from '@cf/domain-acquisition/combat-settlement-internal';
import { projectCompanionAvailabilityV1 } from '@cf/domain-acquisition/companion-availability';
import {
  guardianAcquisitionStateDigestV1,
  isGuardianAcquisitionStateV1,
  prepareGuardianAcquisitionV1,
  type GuardianAcquisitionPreparationV1,
  type GuardianAcquisitionStateV1,
} from '@cf/domain-acquisition/guardian-acquisition-internal';
import {
  guardianCompanionStateDigestV1,
  isGuardianCompanionStateV1,
  prepareGuardianCompanionCombatV1,
  projectGuardianCompanionsV1,
  type GuardianCompanionCombatSettlementV1,
  type GuardianCompanionStateV1,
} from '@cf/domain-acquisition/guardian-companion-internal';
import {
  COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
  PLAYER_SEED,
  isCombatSettlementPlanV1,
  type BattleStats,
  type CombatLossXpAuthorityV1,
  type CombatSettlementOutcomeV1,
  type CombatSettlementPlanV1,
  type PlayerSettlementChampionV1,
} from '@cf/domain-combatcore';
import {
  isWorldOpportunitySnapshot,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import {
  ACHIEVEMENTS,
  MAX_UNLOCKED_ACHIEVEMENT_IDS,
} from '@cf/domain-progression';
import {
  resolveLegacyConquestImbuePlan,
  type LegacyWornBase,
} from '@cf/domain-loot';
import {
  ascStageOf,
  bankConquest,
  reconcileV2Chapters,
} from '@cf/scene';
import {
  committedArc5OwnershipState,
  prepareArc5OwnershipV2Successor,
  readArc5OwnershipMigration,
} from './arc5-ownership-migration.js';
import {
  guardianAcquisitionCarrierWriteV1,
  projectLegacyGuardianCodexEntryV1,
  projectLegacyGuardianWorldWhereV1,
  readGuardianAcquisitionCarrierV1,
} from './guardian-acquisition.js';
import {
  guardianCompanionCarrierWriteV1,
  readGuardianCompanionCarrierV1,
} from './guardian-companion.js';
import type { ContentRegistry, SaveStateV2 } from './import-v2.js';
import {
  V5_SEGMENTS,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  type V5ExtensionCarrier,
  type V5ExtensionWrite,
  type V5Extensions,
  type V5WritableState,
} from './migration-v5.js';
import {
  createF4DeterministicProductTransactionOwner,
  planF4DeterministicProductReceipt,
  type F4DeterministicProductTransactionOutcome,
} from './outcome-transaction.js';
import type { MutationReceipt, RevisionedRepository } from './revisioned.js';
import type { TabLeaseGrant } from './tab-lease.js';
import {
  prepareLegacyXpFirstClaim,
  readLegacyXpFirstsAuthority,
} from './xp-firsts-authority.js';

export const COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1 = 'cf-v2-combat-settlement-authority/v1' as const;
export const COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1 = 1 as const;
export const COMBAT_SETTLEMENT_AUTHORITY_SEGMENT_V1 = 'player' as const;
export const COMBAT_SETTLEMENT_AUTHORITY_NAMESPACE_V1 = 'combat.settlement' as const;
export const COMBAT_SETTLEMENT_OPERATION_V1 = 'combat-settlement' as const;
export const COMBAT_BRINK_ACHIEVEMENT_ID_V1 = 'brink' as const;
export const COMBAT_BRINK_ACHIEVEMENT_OWNER_V1 = 'survival:below-twenty-hp' as const;
export const COMBAT_STARTER_CONQUEST_CHARTER_ID_V1 = 'st-conq' as const;
export const COMBAT_STARTER_CONQUEST_CHARTER_STARDUST_V1 = 25 as const;

/** App-prepared event-owner join. The persistence owner independently binds
 * every field to the exact settled player injury and current unlocked list
 * before it may copy the successor into the combat transaction. */
export interface CombatSettlementBrinkAchievementJoinV1 {
  readonly kind: 'prepared';
  readonly achievementId: typeof COMBAT_BRINK_ACHIEVEMENT_ID_V1;
  readonly owner: typeof COMBAT_BRINK_ACHIEVEMENT_OWNER_V1;
  readonly added: boolean;
  readonly priorUnlockedCount: number;
  readonly nextUnlockedIds: readonly string[];
}

export interface CombatSettlementBrinkAchievementFactV1 {
  readonly id: typeof COMBAT_BRINK_ACHIEVEMENT_ID_V1;
  readonly owner: typeof COMBAT_BRINK_ACHIEVEMENT_OWNER_V1;
  readonly alreadyUnlocked: boolean;
  readonly added: boolean;
  readonly priorUnlockedCount: number;
  readonly unlockedCountAfter: number;
}

export interface CombatSettlementStarterConquestCharterFactV1 {
  readonly id: typeof COMBAT_STARTER_CONQUEST_CHARTER_ID_V1;
  readonly stardustReward: typeof COMBAT_STARTER_CONQUEST_CHARTER_STARDUST_V1;
  readonly stardustBefore: number;
  readonly stardustAfter: number;
  readonly lifetimeStardustBefore: number;
  readonly lifetimeStardustAfter: number;
  readonly honoredChartersBefore: number;
  readonly honoredChartersAfter: number;
}

interface CombatBattleEvidenceV1 {
  readonly battleIdDigest: string;
  readonly encounterDigest: string;
  readonly outcome: CombatSettlementOutcomeV1;
  readonly planWitnessDigest: string;
  readonly receiptKind: typeof COMBAT_SETTLEMENT_RECEIPT_KIND_V1;
  readonly receiptOrdinal: number;
  readonly sourceRevision: number;
  readonly transcriptDigest: string;
  readonly transcriptFingerprint: string;
  readonly worldKey: string;
}

interface CombatConquestAuthorityRowV1 {
  readonly legacyEpoch: 0;
  readonly planetSeed: number;
  readonly tier: number;
  readonly worldKey: string;
}

interface CombatLossXpAuthorityRowV1 {
  readonly creatureId: string;
  readonly ledgerIdentity: string;
  readonly target: 3 | 5;
  readonly worldKey: string;
}

export interface CombatSettlementAuthorityV1 {
  readonly schema: typeof COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1;
  readonly version: typeof COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1;
  readonly battles: readonly CombatBattleEvidenceV1[];
  readonly conquests: readonly CombatConquestAuthorityRowV1[];
  readonly lossXp: readonly CombatLossXpAuthorityRowV1[];
}

export type CombatSettlementAuthorityReadOutcomeV1 =
  | Readonly<{ readonly kind: 'loaded'; readonly authority: CombatSettlementAuthorityV1 }>
  | Readonly<{
    readonly kind: 'protected';
    readonly reason: 'wrong-segment' | 'corrupt' | 'future-version';
    readonly version?: number;
  }>;

const EMPTY_COMBAT_AUTHORITY: CombatSettlementAuthorityV1 = Object.freeze({
  schema: COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1,
  version: COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1,
  battles: Object.freeze([]),
  conquests: Object.freeze([]),
  lossXp: Object.freeze([]),
});
const DIGEST = /^[0-9a-f]{64}$/u;
const WORLD_KEY_MAX = 2_048;
const TEXT_MAX = 4_096;
const COUNTER_MAX = 1_000_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length
    && actual.every((key, index) => key === wanted[index]);
}

function boundedString(value: unknown, maximum = TEXT_MAX): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
    && !/[\u0000-\u001f\u007f]/u.test(value);
}

function uint(value: unknown, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= maximum;
}

function validBattle(value: unknown): value is CombatBattleEvidenceV1 {
  if (!isRecord(value) || !exactKeys(value, [
    'battleIdDigest', 'encounterDigest', 'outcome', 'planWitnessDigest', 'receiptKind',
    'receiptOrdinal', 'sourceRevision', 'transcriptDigest', 'transcriptFingerprint', 'worldKey',
  ])) return false;
  return typeof value.battleIdDigest === 'string' && DIGEST.test(value.battleIdDigest)
    && typeof value.encounterDigest === 'string' && DIGEST.test(value.encounterDigest)
    && (value.outcome === 'champion-win' || value.outcome === 'defender-win' || value.outcome === 'draw')
    && typeof value.planWitnessDigest === 'string' && DIGEST.test(value.planWitnessDigest)
    && value.receiptKind === COMBAT_SETTLEMENT_RECEIPT_KIND_V1
    && uint(value.receiptOrdinal, 0xffff_fffe)
    && uint(value.sourceRevision)
    && typeof value.transcriptDigest === 'string' && DIGEST.test(value.transcriptDigest)
    && boundedString(value.transcriptFingerprint, 128)
    && boundedString(value.worldKey, WORLD_KEY_MAX);
}

function validConquest(value: unknown): value is CombatConquestAuthorityRowV1 {
  return isRecord(value) && exactKeys(value, ['legacyEpoch', 'planetSeed', 'tier', 'worldKey'])
    && value.legacyEpoch === 0 && uint(value.planetSeed, 0xffff_ffff)
    && uint(value.tier, 14) && boundedString(value.worldKey, WORLD_KEY_MAX);
}

function validLossXp(value: unknown): value is CombatLossXpAuthorityRowV1 {
  return isRecord(value) && exactKeys(value, ['creatureId', 'ledgerIdentity', 'target', 'worldKey'])
    && boundedString(value.creatureId, 192)
    && boundedString(value.ledgerIdentity, TEXT_MAX)
    && (value.target === 3 || value.target === 5)
    && boundedString(value.worldKey, WORLD_KEY_MAX);
}

function strictAscending<T>(rows: readonly T[], key: (row: T) => string | number): boolean {
  for (let index = 1; index < rows.length; index++) {
    if (key(rows[index - 1]!) >= key(rows[index]!)) return false;
  }
  return true;
}

function decodeAuthority(carrier: V5ExtensionCarrier): CombatSettlementAuthorityV1 | null {
  try {
    const canonical = canonicalizeData(JSON.parse(carrier.json)) as CanonicalJsonObject;
    if (!isRecord(canonical) || !exactKeys(canonical, ['schema', 'version', 'battles', 'conquests', 'lossXp'])
      || canonical.schema !== COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1
      || canonical.version !== COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1
      || !Array.isArray(canonical.battles) || !canonical.battles.every(validBattle)
      || !Array.isArray(canonical.conquests) || !canonical.conquests.every(validConquest)
      || !Array.isArray(canonical.lossXp) || !canonical.lossXp.every(validLossXp)
      || !strictAscending(canonical.battles, (row) => (row as unknown as CombatBattleEvidenceV1).receiptOrdinal)
      || !strictAscending(canonical.conquests, (row) => (row as unknown as CombatConquestAuthorityRowV1).worldKey)
      || !strictAscending(canonical.lossXp, (row) => (row as unknown as CombatLossXpAuthorityRowV1).ledgerIdentity)
      || JSON.stringify(canonical) !== carrier.json) return null;
    return canonical as unknown as CombatSettlementAuthorityV1;
  } catch {
    return null;
  }
}

/** Read the canonical combat ledger. Absence is the exact empty pre-Arc-6
 * state; a carrier in any other segment or a future/corrupt carrier is
 * protected and never downgraded to empty authority. */
export function readCombatSettlementAuthorityV1(
  extensionsValue: unknown,
): CombatSettlementAuthorityReadOutcomeV1 {
  let extensions: V5Extensions;
  try { extensions = canonicalizeV5Extensions(extensionsValue); }
  catch { return Object.freeze({ kind: 'protected', reason: 'corrupt' }); }
  if (V5_SEGMENTS.some((segment) => segment !== COMBAT_SETTLEMENT_AUTHORITY_SEGMENT_V1
    && extensions[segment]?.[COMBAT_SETTLEMENT_AUTHORITY_NAMESPACE_V1] !== undefined)) {
    return Object.freeze({ kind: 'protected', reason: 'wrong-segment' });
  }
  const carrier = extensions.player?.[COMBAT_SETTLEMENT_AUTHORITY_NAMESPACE_V1];
  if (carrier === undefined) return Object.freeze({ kind: 'loaded', authority: EMPTY_COMBAT_AUTHORITY });
  if (carrier.version > COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1) {
    return Object.freeze({ kind: 'protected', reason: 'future-version', version: carrier.version });
  }
  if (carrier.version !== COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1) {
    return Object.freeze({ kind: 'protected', reason: 'corrupt' });
  }
  const authority = decodeAuthority(carrier);
  return authority === null
    ? Object.freeze({ kind: 'protected', reason: 'corrupt' })
    : Object.freeze({ kind: 'loaded', authority });
}

function authorityWrite(authority: CombatSettlementAuthorityV1): V5ExtensionWrite {
  return Object.freeze({
    segment: COMBAT_SETTLEMENT_AUTHORITY_SEGMENT_V1,
    namespace: COMBAT_SETTLEMENT_AUTHORITY_NAMESPACE_V1,
    carrier: Object.freeze({
      version: COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1,
      json: canonicalJson(authority),
    }),
  });
}

function battleEvidence(plan: CombatSettlementPlanV1, sourceRevision: number): CombatBattleEvidenceV1 {
  return Object.freeze({
    battleIdDigest: sha256Hex(plan.battleId),
    encounterDigest: sha256Hex(plan.encounter.witness),
    outcome: plan.outcome,
    planWitnessDigest: sha256Hex(plan.witness),
    receiptKind: COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
    receiptOrdinal: plan.receiptOrdinal,
    sourceRevision,
    transcriptDigest: sha256Hex(canonicalJson(plan.transcript)),
    transcriptFingerprint: plan.transcriptFingerprint,
    worldKey: plan.encounter.identity.world.key,
  });
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}

function exactUnlockedIds(value: unknown): readonly string[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > MAX_UNLOCKED_ACHIEVEMENT_IDS) {
    throw new RangeError('combat achievement ids exceed their compatibility capacity');
  }
  const unique = new Set<string>();
  for (let index = 0; index < value.length; index++) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) {
      throw new TypeError('combat achievement ids must be dense');
    }
    const id = value[index];
    if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/u.test(id)
      || unique.has(id)) {
      throw new TypeError('combat achievement ids are invalid or duplicated');
    }
    unique.add(id);
  }
  return value;
}

function qualifiesForBrink(plan: CombatSettlementPlanV1): boolean {
  return plan.champion.kind === 'player'
    && plan.injury.status === 'damage-player'
    && plan.injury.hpAfter >= 1
    && plan.injury.hpAfter < 20;
}

function applyCombatBrinkAchievement(
  draft: SaveStateV2,
  plan: CombatSettlementPlanV1,
  join: CombatSettlementBrinkAchievementJoinV1 | null,
): CombatSettlementBrinkAchievementFactV1 | null {
  const qualifies = qualifiesForBrink(plan);
  if (!qualifies) {
    if (join !== null) throw new Error('combat brink achievement does not match the settled injury');
    return null;
  }
  const definition = ACHIEVEMENTS.find(({ id }) => id === COMBAT_BRINK_ACHIEVEMENT_ID_V1);
  if (!definition || definition.evaluation.kind !== 'event-owner'
    || definition.evaluation.owner !== COMBAT_BRINK_ACHIEVEMENT_OWNER_V1) {
    throw new Error('combat brink achievement owner is not registered');
  }
  if (join === null || !isRecord(join)
    || !exactKeys(join, [
      'achievementId', 'added', 'kind', 'nextUnlockedIds', 'owner', 'priorUnlockedCount',
    ])
    || join.kind !== 'prepared'
    || join.achievementId !== COMBAT_BRINK_ACHIEVEMENT_ID_V1
    || join.owner !== COMBAT_BRINK_ACHIEVEMENT_OWNER_V1
    || typeof join.added !== 'boolean'
    || !Number.isSafeInteger(join.priorUnlockedCount)
    || join.priorUnlockedCount < 0) {
    throw new Error('combat brink achievement join is missing or invalid');
  }
  const current = exactUnlockedIds(draft.unlocked);
  const next = exactUnlockedIds(join.nextUnlockedIds);
  const alreadyUnlocked = current.includes(COMBAT_BRINK_ACHIEVEMENT_ID_V1);
  const expected = alreadyUnlocked
    ? [...current]
    : [...current, COMBAT_BRINK_ACHIEVEMENT_ID_V1];
  if (expected.length > MAX_UNLOCKED_ACHIEVEMENT_IDS) {
    throw new RangeError('combat brink achievement exceeds its compatibility capacity');
  }
  if (join.priorUnlockedCount !== current.length
    || join.added !== !alreadyUnlocked
    || !sameJson(next, expected)) {
    throw new Error('combat brink achievement join is stale or mismatched');
  }
  draft.unlocked = [...next];
  return Object.freeze({
    id: COMBAT_BRINK_ACHIEVEMENT_ID_V1,
    owner: COMBAT_BRINK_ACHIEVEMENT_OWNER_V1,
    alreadyUnlocked,
    added: join.added,
    priorUnlockedCount: current.length,
    unlockedCountAfter: next.length,
  });
}

function checkedCounter(stats: Record<string, number>, key: string, delta: number): void {
  const before = stats[key] ?? 0;
  if (!Number.isSafeInteger(before) || before < 0 || before > COUNTER_MAX
    || !Number.isSafeInteger(delta) || delta < 0 || before + delta > COUNTER_MAX) {
    throw new RangeError(`combat counter ${key} exceeds its compatibility capacity`);
  }
  stats[key] = before + delta;
}

/** Settle only the source-authored one-time starter conquest Charter. Weekly
 * validity depends on the separate wall-week/slate lifecycle and is therefore
 * deliberately excluded from this transaction owner. */
function settleAcceptedStarterConquestCharter(
  draft: SaveStateV2,
): CombatSettlementStarterConquestCharterFactV1 | null {
  if (!draft.tutDone) return null;
  const acceptedCount = draft.chacc.filter(
    (id) => id === COMBAT_STARTER_CONQUEST_CHARTER_ID_V1,
  ).length;
  if (acceptedCount === 0) return null;
  if (acceptedCount !== 1
    || draft.chDone.includes(COMBAT_STARTER_CONQUEST_CHARTER_ID_V1)
    || new Set(draft.chDone).size !== draft.chDone.length
    || draft.chDone.length >= 10) {
    throw new Error('starter conquest Charter authority is stale or malformed');
  }
  const stardustBefore = draft.essence;
  const lifetimeStardustBefore = draft.stats.essenceEarned ?? 0;
  const honoredChartersBefore = draft.stats.charters ?? 0;
  const reward = COMBAT_STARTER_CONQUEST_CHARTER_STARDUST_V1;
  if (!Number.isSafeInteger(stardustBefore) || stardustBefore < 0
    || !Number.isSafeInteger(lifetimeStardustBefore) || lifetimeStardustBefore < 0
    || stardustBefore + reward > COUNTER_MAX
    || lifetimeStardustBefore + reward > COUNTER_MAX) {
    throw new RangeError('starter conquest Charter Stardust exceeds its compatibility capacity');
  }
  checkedCounter(draft.stats, 'charters', 1);
  draft.essence = stardustBefore + reward;
  draft.stats.essenceEarned = lifetimeStardustBefore + reward;
  draft.chDone = [...draft.chDone, COMBAT_STARTER_CONQUEST_CHARTER_ID_V1];
  draft.chacc = draft.chacc.filter((id) => id !== COMBAT_STARTER_CONQUEST_CHARTER_ID_V1);
  return Object.freeze({
    id: COMBAT_STARTER_CONQUEST_CHARTER_ID_V1,
    stardustReward: reward,
    stardustBefore,
    stardustAfter: draft.essence,
    lifetimeStardustBefore,
    lifetimeStardustAfter: draft.stats.essenceEarned,
    honoredChartersBefore,
    honoredChartersAfter: draft.stats.charters!,
  });
}

function settleCombatChapterProgress(draft: SaveStateV2): void {
  if (!draft.tutDone) return;
  const progress = { ...draft.ascProg };
  bankConquest(draft.ascCh, progress, true);
  const stage = ascStageOf(
    draft.items.map(([id, count]) => [id, count]),
    draft.ascCh,
  );
  const reconciliation = reconcileV2Chapters(draft.ascCh, progress, stage);
  if (reconciliation === null) {
    throw new Error('combat Charter chapter authority is invalid');
  }
  draft.ascProg = progress;
  draft.ascCh = reconciliation.nextChapter;
}

function currentPrimeIds(state: SaveStateV2): readonly string[] {
  return Object.freeze(Object.keys(state.primeFill).sort());
}

function bindOpportunity(
  plan: CombatSettlementPlanV1,
  opportunity: WorldOpportunitySnapshot,
): void {
  if (!isWorldOpportunitySnapshot(opportunity)
    || opportunity.address !== plan.encounter.identity.world
    || opportunity.key !== plan.encounter.identity.world.key
    || opportunity.source.planetSeed !== plan.encounter.identity.world.planet.seed
    || opportunity.source.planetType !== plan.encounter.identity.worldType
    || opportunity.effectiveTier !== plan.worldTier) {
    throw new Error('combat plan does not match its registered canonical opportunity');
  }
}

function playerStatsFrom(state: SaveStateV2): BattleStats {
  const vit = state.pstats.vit;
  const fer = state.pstats.fer;
  const res = state.pstats.res;
  const agi = state.pstats.agi;
  const ins = state.pstats.ins;
  if (![vit, fer, res, agi, ins].every((value) => (
    typeof value === 'number' && Number.isFinite(value) && value >= 0
  ))) throw new TypeError('persisted player combat stats are invalid');
  const total = vit! + fer! + res! + agi! + ins!;
  return Object.freeze({
    vit, fer, res, agi, ins,
    tier: Math.max(0, Math.min(14, Math.floor((total - 250) / 130))),
    total,
    hex: '#ffcf8a',
    name: state.explorerName || 'You',
    ab: Object.freeze({
      id: 'resolve', n: 'Frontier Resolve',
      d: 'Hardened by the void — recovers each round and shrugs off blows',
      regen: 0.04, taken: 0.9,
    }),
  }) as unknown as BattleStats;
}

/** Exact mature player-combat projection shared by presentation and the
 * persistence binder. Keeping this in the writer's owner prevents the live
 * card from maintaining a second player-stat formula. */
export function projectLegacyPlayerSettlementChampionV1(
  state: SaveStateV2,
): PlayerSettlementChampionV1 {
  const name = state.explorerName || 'You';
  const currentHp = state.hp;
  if (!Number.isSafeInteger(currentHp) || currentHp < 1) {
    throw new RangeError('persisted player HP must respect the combat mercy floor');
  }
  return Object.freeze({
    kind: 'player',
    explorerId: 'explorer',
    name,
    genomeSeed: PLAYER_SEED,
    stats: playerStatsFrom(state),
    currentHp,
  });
}

function bindPlayer(plan: CombatSettlementPlanV1, state: SaveStateV2): void {
  if (plan.champion.kind !== 'player') return;
  const authority = projectLegacyPlayerSettlementChampionV1(state);
  if (plan.champion.genomeSeed !== authority.genomeSeed
    || plan.champion.name !== authority.name
    || plan.champion.explorerId !== authority.explorerId
    || plan.champion.currentHp !== authority.currentHp
    || !sameJson(plan.champion.stats, authority.stats)) {
    throw new Error('combat player champion does not match persisted player authority');
  }
}

function legacyCodexId(
  ownership: OwnershipStateV2,
  creature: CreatureInstanceV1,
): string {
  const acquisition = ownership.acquisitions.find((row) => (
    row.recordId === creature.acquisitionRecordId
  ));
  if (acquisition?.acquisition === 'legacy' && acquisition.provenance.kind === 'legacy') {
    return acquisition.provenance.legacyCodexId;
  }
  return `s${creature.genome.seed}`;
}

function xpStageKey(ledgerIdentity: string, stage: 'base' | 'near-brink-upgrade'): string {
  return sha256Hex(canonicalJson({
    schema: 'cf-v2-combat-loss-xp-stage/v1', ledgerIdentity, stage,
  }));
}

interface ActualLossXpAuthority {
  readonly kind: 'known-target' | 'legacy-shared-key-ambiguous';
  readonly target?: 0 | 3 | 5;
  readonly legacyKey: string;
  readonly baseKey: string;
  readonly upgradeKey: string;
}

export type CombatLossXpAuthorityProjectionV1 =
  | Readonly<{ readonly kind: 'ready'; readonly authority: CombatLossXpAuthorityV1 }>
  | Readonly<{ readonly kind: 'protected'; readonly reason: string }>;

interface ActualLossXpInputV1 {
  readonly ledgerIdentity: string;
  readonly worldKey: string;
  readonly planetSeed: number;
  readonly state: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly authority: CombatSettlementAuthorityV1;
  readonly legacyCodexId: string;
  readonly creature: CreatureInstanceV1;
}

function actualLossXpAuthority(input: ActualLossXpInputV1): ActualLossXpAuthority {
  const { ledgerIdentity, worldKey, planetSeed, state, extensions, authority, creature } = input;
  const legacyKey = `${input.legacyCodexId}|conqloss:${planetSeed}`
    .slice(0, 64);
  const baseKey = xpStageKey(ledgerIdentity, 'base');
  const upgradeKey = xpStageKey(ledgerIdentity, 'near-brink-upgrade');
  const firsts = readLegacyXpFirstsAuthority(state, extensions);
  if (firsts.kind !== 'loaded') throw new Error(`combat loss XP compatibility authority is ${firsts.reason}`);
  const has = (key: string): boolean => firsts.window.includes(key) || firsts.archived.includes(key);
  const row = authority.lossXp.find((candidate) => candidate.ledgerIdentity === ledgerIdentity);
  if (row === undefined) {
    if (has(baseKey) || has(upgradeKey)) throw new Error('combat loss XP stage exists without canonical target');
    if (has(legacyKey)) return Object.freeze({
      kind: 'legacy-shared-key-ambiguous', legacyKey, baseKey, upgradeKey,
    });
    return Object.freeze({ kind: 'known-target', target: 0, legacyKey, baseKey, upgradeKey });
  }
  if (row.creatureId !== creature.creatureId
    || row.worldKey !== worldKey
    || !has(legacyKey) || !has(baseKey)
    || (row.target === 5) !== has(upgradeKey)) {
    throw new Error('combat loss XP canonical and compatibility authorities disagree');
  }
  return Object.freeze({
    kind: 'known-target', target: row.target, legacyKey, baseKey, upgradeKey,
  });
}

/** Read the exact loss-XP target needed before planning an owned-fauna
 * defeat. This projection never claims a key or mutates its state. */
export function projectCombatLossXpAuthorityV1(input: Readonly<{
  readonly state: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly ownership: OwnershipStateV2;
  readonly creature: CreatureInstanceV1;
  readonly worldKey: string;
  readonly planetSeed: number;
}>): CombatLossXpAuthorityProjectionV1 {
  try {
    if (!isOwnershipStateV2(input.ownership)
      || !input.ownership.creatures.some((row) => row === input.creature)) {
      return Object.freeze({ kind: 'protected', reason: 'ownership-unregistered-or-creature-detached' });
    }
    if (!boundedString(input.worldKey, WORLD_KEY_MAX)
      || !uint(input.planetSeed, 0xffff_ffff)) {
      return Object.freeze({ kind: 'protected', reason: 'world-identity-invalid' });
    }
    const read = readCombatSettlementAuthorityV1(input.extensions);
    if (read.kind !== 'loaded') {
      return Object.freeze({ kind: 'protected', reason: `combat-authority-${read.reason}` });
    }
    const actual = actualLossXpAuthority({
      ledgerIdentity: `combat-loss-xp/v1|${input.creature.creatureId}|${input.worldKey}`,
      worldKey: input.worldKey,
      planetSeed: input.planetSeed,
      state: input.state,
      extensions: input.extensions,
      authority: read.authority,
      legacyCodexId: legacyCodexId(input.ownership, input.creature),
      creature: input.creature,
    });
    return actual.kind === 'legacy-shared-key-ambiguous'
      ? Object.freeze({
        kind: 'ready',
        authority: Object.freeze({ kind: 'legacy-shared-key-ambiguous' }),
      })
      : Object.freeze({
        kind: 'ready',
        authority: Object.freeze({ kind: 'known-target', awardedTarget: actual.target! }),
      });
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Guardian-companion counterpart of the Arc 5 loss-XP reader. The exact
 * live overlay projection owns membership; the compatibility key retains the
 * mature `s<seed>` Codex identity. */
export function projectGuardianCombatLossXpAuthorityV1(input: Readonly<{
  readonly state: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly guardianAcquisitions: GuardianAcquisitionStateV1;
  readonly guardianCompanions: GuardianCompanionStateV1;
  readonly creature: CreatureInstanceV1;
  readonly worldKey: string;
  readonly planetSeed: number;
}>): CombatLossXpAuthorityProjectionV1 {
  try {
    if (!isGuardianAcquisitionStateV1(input.guardianAcquisitions)
      || !isGuardianCompanionStateV1(input.guardianCompanions)) {
      return Object.freeze({ kind: 'protected', reason: 'guardian-companion-authority-unregistered' });
    }
    const projection = projectGuardianCompanionsV1({
      source: input.guardianAcquisitions,
      overlay: input.guardianCompanions,
    });
    if (projection.kind !== 'projected'
      || !projection.creatures.some((row) => row === input.creature)) {
      return Object.freeze({ kind: 'protected', reason: 'guardian-companion-detached-or-protected' });
    }
    if (!boundedString(input.worldKey, WORLD_KEY_MAX)
      || !uint(input.planetSeed, 0xffff_ffff)) {
      return Object.freeze({ kind: 'protected', reason: 'world-identity-invalid' });
    }
    const read = readCombatSettlementAuthorityV1(input.extensions);
    if (read.kind !== 'loaded') {
      return Object.freeze({ kind: 'protected', reason: `combat-authority-${read.reason}` });
    }
    const actual = actualLossXpAuthority({
      ledgerIdentity: `combat-loss-xp/v1|${input.creature.creatureId}|${input.worldKey}`,
      worldKey: input.worldKey,
      planetSeed: input.planetSeed,
      state: input.state,
      extensions: input.extensions,
      authority: read.authority,
      legacyCodexId: `s${input.creature.genome.seed}`,
      creature: input.creature,
    });
    return actual.kind === 'legacy-shared-key-ambiguous'
      ? Object.freeze({
        kind: 'ready',
        authority: Object.freeze({ kind: 'legacy-shared-key-ambiguous' }),
      })
      : Object.freeze({
        kind: 'ready',
        authority: Object.freeze({ kind: 'known-target', awardedTarget: actual.target! }),
      });
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

function claimXpKey(
  state: SaveStateV2,
  extensions: V5Extensions,
  key: string,
): Readonly<{ state: SaveStateV2; extensions: V5Extensions }> {
  const claimed = prepareLegacyXpFirstClaim({ state, extensions, key });
  if (claimed.kind !== 'prepared') {
    throw new Error(`combat loss XP compatibility claim refused ${claimed.kind === 'protected' ? claimed.reason : 'duplicate'}`);
  }
  return Object.freeze({ state: claimed.state, extensions: claimed.extensions });
}

function changeCodexChampion(
  state: SaveStateV2,
  ownership: OwnershipStateV2,
  settlement: Arc6CombatOwnershipSettlementV1,
  plan: CombatSettlementPlanV1,
): void {
  const id = legacyCodexId(ownership, settlement.creatureBefore);
  if (settlement.creatureAfter === null) {
    state.codex = state.codex.filter(([rowId]) => rowId !== id);
    if (state.scoutId === id) state.scoutId = null;
    return;
  }
  state.codex = state.codex.map(([rowId, entry]) => {
    if (rowId !== id) return [rowId, entry];
    const genome = { ...entry.g };
    if (plan.xp.status === 'award' || (plan.xp.status === 'loss-target' && plan.xp.totalDelta > 0)) {
      genome.xp = settlement.creatureAfter!.xp ?? 0;
    }
    if (plan.injury.status === 'set-hurt') genome.hurt = plan.injury.hurtAfter;
    return [rowId, { ...entry, g: genome }];
  });
}

function changeCodexGuardianChampion(
  state: SaveStateV2,
  settlement: GuardianCompanionCombatSettlementV1,
  plan: CombatSettlementPlanV1,
): void {
  const id = `s${settlement.creatureBefore.genome.seed}`;
  if (state.codex.filter(([rowId]) => rowId === id).length !== 1) {
    throw new Error('Guardian champion lacks one exact Compendium compatibility row');
  }
  if (settlement.creatureAfter === null) {
    state.codex = state.codex.filter(([rowId]) => rowId !== id);
    if (state.scoutId === id) state.scoutId = null;
    return;
  }
  state.codex = state.codex.map(([rowId, entry]) => {
    if (rowId !== id) return [rowId, entry];
    const genome = { ...entry.g };
    if (plan.xp.status === 'award'
      || (plan.xp.status === 'loss-target' && plan.xp.totalDelta > 0)) {
      genome.xp = settlement.creatureAfter!.xp ?? 0;
    }
    if (plan.injury.status === 'set-hurt') genome.hurt = plan.injury.hurtAfter;
    return [rowId, { ...entry, g: genome }];
  });
}

function changedExtensionWrites(base: V5Extensions, target: V5Extensions): readonly V5ExtensionWrite[] {
  const writes: V5ExtensionWrite[] = [];
  for (const segment of V5_SEGMENTS) {
    const before = base[segment] ?? {};
    const after = target[segment] ?? {};
    for (const [namespace, carrier] of Object.entries(after)) {
      const prior = before[namespace];
      if (prior?.version !== carrier.version || prior.json !== carrier.json) {
        writes.push(Object.freeze({ segment, namespace, carrier }));
      }
    }
  }
  return Object.freeze(writes);
}

interface DerivedCombatSettlementV1 {
  readonly state: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly writes: readonly V5ExtensionWrite[];
  readonly battle: CombatBattleEvidenceV1;
  readonly brinkAchievement: CombatSettlementBrinkAchievementFactV1 | null;
  readonly starterConquestCharter: CombatSettlementStarterConquestCharterFactV1 | null;
  readonly ownershipSettlement: Arc6CombatOwnershipSettlementV1 | null;
  readonly ownershipPrepared: ReturnType<typeof prepareArc5OwnershipV2Successor> | null;
  readonly guardianPreparation: GuardianAcquisitionPreparationV1 | null;
  readonly guardianSuccessorDigest: string | null;
  readonly guardianCompanionSettlement: GuardianCompanionCombatSettlementV1 | null;
  readonly guardianCompanionSuccessorDigest: string | null;
}

function deriveCombatSettlement(input: Readonly<{
  readonly plan: CombatSettlementPlanV1;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly ownershipV2: OwnershipStateV2 | null;
  readonly brinkAchievementJoin: CombatSettlementBrinkAchievementJoinV1 | null;
  readonly sourceRevision: number;
  readonly draft: SaveStateV2;
  readonly extensions: V5Extensions;
}>): DerivedCombatSettlementV1 {
  const { plan, opportunity, ownershipV2, sourceRevision } = input;
  bindOpportunity(plan, opportunity);
  bindPlayer(plan, input.draft);
  if (!sameJson(currentPrimeIds(input.draft), [...plan.authority.claimedPrimeSignatureIds].sort())
    || !sameJson(
      [...plan.encounter.identity.claimedSignatureIds].sort(),
      [...plan.authority.claimedPrimeSignatureIds].sort(),
    )) {
    throw new Error('combat Prime claim authority is stale');
  }
  const read = readCombatSettlementAuthorityV1(input.extensions);
  if (read.kind !== 'loaded') throw new Error(`combat settlement authority is ${read.reason}`);
  const priorAuthority = read.authority;
  const battle = battleEvidence(plan, sourceRevision);
  if (priorAuthority.battles.some((row) => row.battleIdDigest === battle.battleIdDigest)) {
    throw new Error('combat battle identity is already settled');
  }
  if (priorAuthority.battles.some((row) => row.receiptOrdinal === battle.receiptOrdinal)) {
    throw new Error('combat authority receipt ordinal is already settled');
  }

  const planetSeed = plan.encounter.identity.world.planet.seed;
  const canonicalConquest = priorAuthority.conquests.find((row) => row.worldKey === opportunity.key);
  const legacyLeafConquest = input.draft.conquered.find(([key]) => Number(key) === planetSeed);
  if (plan.authority.worldConquered !== false || canonicalConquest !== undefined
    || legacyLeafConquest !== undefined) {
    throw new Error('combat world is already conquered or has ambiguous legacy leaf authority');
  }

  const draft = input.draft;
  if (plan.conquest.status === 'settle' && draft.chacc.includes('wk-conq')) {
    throw new Error('combat conquest has an accepted weekly Charter without a v2 weekly lifecycle owner');
  }
  const baseExtensions = input.extensions;
  let workingExtensions = baseExtensions;
  let ownershipSettlement: Arc6CombatOwnershipSettlementV1 | null = null;
  let ownershipPrepared: ReturnType<typeof prepareArc5OwnershipV2Successor> | null = null;
  let guardianPreparation: GuardianAcquisitionPreparationV1 | null = null;
  let guardianSuccessorDigest: string | null = null;
  let guardianCompanionSettlement: GuardianCompanionCombatSettlementV1 | null = null;
  let guardianCompanionSuccessorDigest: string | null = null;
  let championCreature: CreatureInstanceV1 | null = null;
  let championLegacyCodexId: string | null = null;
  const guardianCaptureRequired = plan.guardianCapture.status === 'ownership-writer-required';
  const guardianRead = readGuardianAcquisitionCarrierV1(
    baseExtensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  if (guardianRead.kind !== 'loaded') {
    throw new Error(`Guardian acquisition carrier is ${guardianRead.reason}`);
  }
  const guardianCompanionRead = readGuardianCompanionCarrierV1(baseExtensions);
  if (guardianCompanionRead.kind !== 'loaded') {
    throw new Error(`Guardian companion carrier is ${guardianCompanionRead.reason}`);
  }
  const guardianCompanions = projectGuardianCompanionsV1({
    source: guardianRead.state,
    overlay: guardianCompanionRead.state,
  });
  if (guardianCompanions.kind !== 'projected') {
    throw new Error(`Guardian companion projection is ${guardianCompanions.reason}`);
  }
  if (guardianCaptureRequired || plan.champion.kind === 'owned-fauna') {
    if (ownershipV2 === null || !isOwnershipStateV2(ownershipV2)) {
      throw new Error('owned combat requires registered Arc 5 collision authority');
    }
    const durableOwnership = readArc5OwnershipMigration(
      baseExtensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (durableOwnership.kind !== 'loaded'
      || ownershipStateDigestV2(durableOwnership.state) !== ownershipStateDigestV2(ownershipV2)) {
      throw new Error('owned combat Arc 5 collision authority is stale or protected');
    }
  }
  if (plan.champion.kind === 'owned-fauna') {
    const championId = plan.champion.creatureId;
    const arc5Creature = ownershipV2!.creatures.find((row) => (
      row.creatureId === championId
    ));
    const guardianCreature = guardianCompanions.creatures.find((row) => (
      row.creatureId === championId
    ));
    if ((arc5Creature === undefined) === (guardianCreature === undefined)) {
      throw new Error('owned combat champion source is missing or collides across carriers');
    }
    if (arc5Creature !== undefined) {
      const ownership = prepareArc6CombatOwnershipV1(ownershipV2!, plan);
      if (ownership.kind !== 'prepared') {
        throw new Error(`combat ownership refused ${ownership.reason}`);
      }
      ownershipSettlement = ownership.settlement;
      championCreature = ownership.settlement.creatureBefore;
      championLegacyCodexId = legacyCodexId(ownershipV2!, championCreature);
      const prepared = prepareArc5OwnershipV2Successor({
        baseExtensions: workingExtensions,
        parent: ownershipV2!,
        successor: ownership.settlement.successor,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      });
      if (prepared.kind !== 'prepared') {
        throw new Error(`combat Arc 5 carrier refused ${prepared.reason}`);
      }
      ownershipPrepared = prepared;
      workingExtensions = prepared.extensions;
      changeCodexChampion(draft, ownershipV2!, ownership.settlement, plan);
    } else {
      const prepared = prepareGuardianCompanionCombatV1({
        source: guardianRead.state,
        parent: guardianCompanionRead.state,
        plan,
      });
      if (prepared.kind !== 'prepared') {
        throw new Error(`Guardian companion combat refused ${prepared.reason}`);
      }
      guardianCompanionSettlement = prepared.settlement;
      guardianCompanionSuccessorDigest = prepared.settlement.successorDigest;
      championCreature = prepared.settlement.creatureBefore;
      championLegacyCodexId = `s${championCreature.genome.seed}`;
      workingExtensions = applyV5ExtensionWrites(workingExtensions, [
        guardianCompanionCarrierWriteV1(prepared.settlement.successor),
      ]).extensions;
      changeCodexGuardianChampion(draft, prepared.settlement, plan);
    }
  } else if (ownershipV2 !== null && !guardianCaptureRequired) {
    throw new Error('player combat must not carry unrelated ownership authority');
  }

  if (guardianCaptureRequired) {
    guardianPreparation = prepareGuardianAcquisitionV1({
      parent: guardianRead.state,
      ownership: ownershipV2!,
      plan,
    });
    if (guardianPreparation.kind === 'refused'
      || guardianPreparation.kind === 'not-applicable') {
      throw new Error(`Guardian acquisition refused ${guardianPreparation.reason}`);
    }
    if (guardianPreparation.kind === 'prepared') {
      if (draft.codex.length >= 1_500) {
        throw new RangeError('Guardian Compendium compatibility capacity is full');
      }
      const row = projectLegacyGuardianCodexEntryV1(guardianPreparation.entry);
      if (draft.codex.some(([id]) => id === row.id)) {
        throw new Error('Guardian acquisition disagrees with the v4 Compendium mirror');
      }
      draft.codex.push([row.id, row]);
      if (row.hybrid) checkedCounter(draft.stats, 'hybrids', 1);
      const best = draft.stats.best ?? 0;
      if (!Number.isSafeInteger(best) || best < 0 || best > 14) {
        throw new RangeError('Guardian Compendium best-grade compatibility value is invalid');
      }
      if (row.tier !== null && row.tier > best) draft.stats.best = row.tier;
      const maxGen = draft.stats.maxGen ?? 0;
      const generation = guardianPreparation.entry.creature.lineage.generation;
      if (!Number.isSafeInteger(maxGen) || maxGen < 0 || maxGen > COUNTER_MAX) {
        throw new RangeError('Guardian Compendium generation compatibility value is invalid');
      }
      if (generation > maxGen) draft.stats.maxGen = generation;
      workingExtensions = applyV5ExtensionWrites(workingExtensions, [
        guardianAcquisitionCarrierWriteV1(guardianPreparation.successor),
      ]).extensions;
      guardianSuccessorDigest = guardianPreparation.successorDigest;
    }
  }

  let nextLossRows = [...priorAuthority.lossXp];
  if (plan.xp.status === 'loss-target' || plan.xp.status === 'protected-unsupported') {
    if (championCreature === null || championLegacyCodexId === null) {
      throw new Error('combat loss XP requires its exact owned champion');
    }
    const actual = actualLossXpAuthority({
      ledgerIdentity: plan.xp.status === 'loss-target'
        ? plan.xp.ledgerIdentity
        : `combat-loss-xp/v1|${championCreature.creatureId}|${plan.encounter.identity.world.key}`,
      worldKey: plan.encounter.identity.world.key,
      planetSeed,
      state: draft,
      extensions: workingExtensions,
      authority: priorAuthority,
      legacyCodexId: championLegacyCodexId,
      creature: championCreature,
    });
    if (plan.xp.status === 'protected-unsupported') {
      if (actual.kind !== 'legacy-shared-key-ambiguous') {
        throw new Error('combat loss XP ambiguity plan does not match durable authority');
      }
    } else {
      const xp = plan.xp;
      if (actual.kind !== 'known-target' || actual.target !== xp.previousTarget) {
        throw new Error('combat loss XP target is stale');
      }
      let stateAndExtensions = { state: draft, extensions: workingExtensions };
      if (xp.previousTarget === 0 && xp.nextTarget >= 3) {
        stateAndExtensions = claimXpKey(stateAndExtensions.state, stateAndExtensions.extensions, actual.legacyKey);
        stateAndExtensions = claimXpKey(stateAndExtensions.state, stateAndExtensions.extensions, actual.baseKey);
      }
      if (xp.previousTarget < 5 && xp.nextTarget === 5) {
        stateAndExtensions = claimXpKey(stateAndExtensions.state, stateAndExtensions.extensions, actual.upgradeKey);
      }
      Object.assign(draft, stateAndExtensions.state);
      workingExtensions = stateAndExtensions.extensions;
      if (xp.nextTarget !== xp.previousTarget) {
        nextLossRows = nextLossRows.filter((row) => row.ledgerIdentity !== xp.ledgerIdentity);
        nextLossRows.push(Object.freeze({
          creatureId: xp.creatureId,
          ledgerIdentity: xp.ledgerIdentity,
          target: xp.nextTarget,
          worldKey: opportunity.key,
        }));
      }
    }
  }

  const brinkAchievement = applyCombatBrinkAchievement(
    draft,
    plan,
    input.brinkAchievementJoin,
  );

  checkedCounter(draft.stats, 'duels', plan.counters.duels);
  checkedCounter(draft.stats, 'duelwins', plan.counters.duelWins);
  checkedCounter(draft.stats, 'guardians', plan.counters.guardians);
  if ((draft.stats.guardians ?? 0) >= 1 && !draft.unlocked.includes('guard1')) {
    draft.unlocked.push('guard1');
  }
  if ((draft.stats.guardians ?? 0) >= 5 && !draft.unlocked.includes('guard5')) {
    draft.unlocked.push('guard5');
  }
  if (plan.injury.status === 'damage-player') {
    if (draft.hp !== plan.injury.hpBefore || plan.injury.hpAfter < 1) {
      throw new Error('combat player injury authority is stale');
    }
    draft.hp = plan.injury.hpAfter;
  }

  let nextConquests = [...priorAuthority.conquests];
  if (plan.conquest.status === 'settle') {
    if (draft.conquered.length >= 20_000) throw new RangeError('combat conquest compatibility capacity is full');
    const equipped = Object.entries(draft.equip)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0)
      .map(([slot, baseId]) => ({ slot: slot as LegacyWornBase['slot'], baseId }));
    const imbue = resolveLegacyConquestImbuePlan({
      planetSeed, worldTier: opportunity.effectiveTier, equipped,
    });
    if (imbue.status === 'planned') {
      throw new Error('combat conquest affix requires a future truthful GearInstance mutation carrier');
    }
    draft.conquered.push([planetSeed, { t: 0, tier: plan.conquest.tier }]);
    nextConquests.push(Object.freeze({
      legacyEpoch: 0,
      planetSeed,
      tier: plan.conquest.tier,
      worldKey: opportunity.key,
    }));
    const stardust = plan.rewards.stardust.amount;
    const earned = draft.stats.essenceEarned ?? 0;
    if (!Number.isSafeInteger(draft.essence) || draft.essence < 0
      || !Number.isSafeInteger(earned) || earned < 0
      || draft.essence + stardust > COUNTER_MAX || earned + stardust > COUNTER_MAX) {
      throw new RangeError('combat Stardust exceeds its compatibility capacity');
    }
    draft.essence += stardust;
    draft.stats.essenceEarned = earned + stardust;
    if (plan.primeClaim.status === 'claim') {
      const claim = plan.primeClaim;
      if (draft.primeFill[claim.signatureId] !== undefined
        || claim.world !== plan.encounter.identity.world) {
        throw new Error('combat Prime claim is stale or mismatched');
      }
      draft.primeFill[claim.signatureId] = {
        title: claim.title,
        sub: claim.sub,
        tier: claim.tier,
        hex: claim.hex,
        where: projectLegacyGuardianWorldWhereV1(opportunity.address),
      };
      if (Object.keys(draft.primeFill).length >= 9) draft.frontierUnlocked = true;
    }
    if (!draft.unlocked.includes('settle1')) draft.unlocked.push('settle1');
    settleCombatChapterProgress(draft);
  }

  const starterConquestCharter = plan.conquest.status === 'settle'
    ? settleAcceptedStarterConquestCharter(draft)
    : null;

  const nextAuthority: CombatSettlementAuthorityV1 = Object.freeze({
    schema: COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1,
    version: COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1,
    battles: Object.freeze([...priorAuthority.battles, battle]
      .sort((left, right) => left.receiptOrdinal - right.receiptOrdinal)),
    conquests: Object.freeze(nextConquests.sort((left, right) => left.worldKey.localeCompare(right.worldKey))),
    lossXp: Object.freeze(nextLossRows.sort((left, right) => left.ledgerIdentity.localeCompare(right.ledgerIdentity))),
  });
  workingExtensions = applyV5ExtensionWrites(workingExtensions, [authorityWrite(nextAuthority)]).extensions;
  const writes = changedExtensionWrites(baseExtensions, workingExtensions);
  /* Reapply once here so capacity, duplicate namespace ownership, and exact
     aggregate bytes are all proven before the generic owner can reach F3. */
  const capacity = applyV5ExtensionWrites(baseExtensions, writes);
  if (!sameJson(capacity.extensions, workingExtensions)) {
    throw new Error('combat extension replacement did not reach its prepared fixed point');
  }
  return Object.freeze({
    state: draft,
    extensions: workingExtensions,
    writes,
    battle,
    brinkAchievement,
    starterConquestCharter,
    ownershipSettlement,
    ownershipPrepared,
    guardianPreparation,
    guardianSuccessorDigest,
    guardianCompanionSettlement,
    guardianCompanionSuccessorDigest,
  });
}

export interface CombatSettlementCommitInputV1 {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  readonly writable: V5WritableState;
  readonly snapshot: Readonly<{ readonly activePlayMs: number }>;
  readonly now: number;
  readonly plan: CombatSettlementPlanV1;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly ownershipV2: OwnershipStateV2 | null;
  readonly brinkAchievementJoin: CombatSettlementBrinkAchievementJoinV1 | null;
}

type DeterministicCommitted = Extract<
  F4DeterministicProductTransactionOutcome,
  { readonly kind: 'committed' }
>;
type DeterministicNotCommitted = Exclude<
  F4DeterministicProductTransactionOutcome,
  { readonly kind: 'committed' }
>;

export interface CommittedCombatSettlementV1 {
  readonly kind: 'committed';
  readonly durability: 'committed';
  readonly convergence: 'verification-required';
  readonly revision: number;
  readonly plan: CombatSettlementPlanV1;
  readonly transaction: DeterministicCommitted;
}

export type CombatSettlementCommitOutcomeV1 =
  | CommittedCombatSettlementV1
  | DeterministicNotCommitted
  | Readonly<{
    readonly kind: 'refused';
    readonly reason:
      | 'plan-unregistered'
      | 'opportunity-unregistered-or-mismatched'
      | 'ownership-unregistered'
      | 'champion-assignment-unavailable'
      | 'champion-active-play-invalid'
      | 'receipt-authority-mismatch';
  }>
  | Readonly<{
    readonly kind: 'committed-convergence';
    readonly durability: 'committed';
    readonly convergence: 'read-only-reload';
    readonly reason: 'prepared-evidence-missing';
    readonly transaction: DeterministicCommitted;
  }>;

interface CombatCommitRegistrationV1 {
  readonly plan: CombatSettlementPlanV1;
  readonly transaction: DeterministicCommitted;
  readonly derived: DerivedCombatSettlementV1;
}

const COMMITTED_COMBAT = new WeakMap<object, CombatCommitRegistrationV1>();

export interface CombatSettlementPersistenceOwnerV1 {
  commit(input: CombatSettlementCommitInputV1): Promise<CombatSettlementCommitOutcomeV1>;
}

/** Build one bounded combat writer over the shared F4/F3 transaction owner. */
export function createCombatSettlementPersistenceOwnerV1(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): CombatSettlementPersistenceOwnerV1 {
  const transactionOwner = createF4DeterministicProductTransactionOwner(repository, registry);
  return Object.freeze({
    async commit(input: CombatSettlementCommitInputV1): Promise<CombatSettlementCommitOutcomeV1> {
      if (!input || typeof input !== 'object' || !isCombatSettlementPlanV1(input.plan)) {
        return Object.freeze({ kind: 'refused', reason: 'plan-unregistered' });
      }
      if (!isWorldOpportunitySnapshot(input.opportunity)
        || input.opportunity.address !== input.plan.encounter.identity.world
        || input.opportunity.effectiveTier !== input.plan.worldTier) {
        return Object.freeze({ kind: 'refused', reason: 'opportunity-unregistered-or-mismatched' });
      }
      if ((input.plan.champion.kind === 'owned-fauna'
          || input.plan.guardianCapture.status === 'ownership-writer-required')
        && (input.ownershipV2 === null || !isOwnershipStateV2(input.ownershipV2))) {
        return Object.freeze({ kind: 'refused', reason: 'ownership-unregistered' });
      }
      if (input.plan.champion.kind === 'owned-fauna') {
        const championId = input.plan.champion.creatureId;
        const champion = input.ownershipV2!.creatures.find((row) => (
          row.creatureId === championId
        ));
        /* Captured Guardians live in their separate immutable carrier and
           intentionally have no Arc 5 assignment/Recovery fields. */
        if (champion !== undefined) {
          try {
            if (projectCompanionAvailabilityV1(
              champion,
              input.snapshot.activePlayMs,
            ).blocks.combat) {
              return Object.freeze({ kind: 'refused', reason: 'champion-assignment-unavailable' });
            }
          } catch {
            return Object.freeze({ kind: 'refused', reason: 'champion-active-play-invalid' });
          }
        }
      }
      const planned = planF4DeterministicProductReceipt(
        input.writable.extensions,
        COMBAT_SETTLEMENT_OPERATION_V1,
      );
      if (planned.kind !== 'planned') return planned;
      if (planned.plan.receiptOrdinal !== input.plan.receiptOrdinal
        || input.plan.receipt.ordinal !== input.plan.receiptOrdinal
        || input.plan.receipt.kind !== COMBAT_SETTLEMENT_RECEIPT_KIND_V1
        || input.plan.receipt.witness !== input.plan.witness) {
        return Object.freeze({ kind: 'refused', reason: 'receipt-authority-mismatch' });
      }
      let selected: DerivedCombatSettlementV1 | null = null;
      const transaction = await transactionOwner.commit({
        expectedRevision: input.expectedRevision,
        grant: input.grant,
        writable: input.writable,
        snapshot: input.snapshot,
        operation: COMBAT_SETTLEMENT_OPERATION_V1,
        receiptKind: COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
        now: input.now,
        derive: ({ receiptOrdinal, draft, extensions }) => {
          if (receiptOrdinal !== input.plan.receiptOrdinal) {
            throw new Error('combat receipt ordinal changed before derivation');
          }
          selected = deriveCombatSettlement({
            plan: input.plan,
            opportunity: input.opportunity,
            ownershipV2: input.ownershipV2,
            brinkAchievementJoin: input.brinkAchievementJoin,
            sourceRevision: input.expectedRevision,
            draft,
            extensions,
          });
          return Object.freeze({
            state: selected.state,
            extensionWrites: selected.writes,
            witness: input.plan.witness,
          });
        },
      });
      if (transaction.kind !== 'committed') return transaction;
      const derived = selected as DerivedCombatSettlementV1 | null;
      if (derived === null) return Object.freeze({
        kind: 'committed-convergence', durability: 'committed',
        convergence: 'read-only-reload', reason: 'prepared-evidence-missing', transaction,
      });
      const committed: CommittedCombatSettlementV1 = Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'verification-required',
        revision: transaction.revision, plan: input.plan, transaction,
      });
      COMMITTED_COMBAT.set(committed, Object.freeze({ plan: input.plan, transaction, derived }));
      return committed;
    },
  });
}

export type CombatSettlementVerificationOutcomeV1 =
  | Readonly<{
    readonly kind: 'verified';
    readonly convergence: 'none';
    readonly revision: number;
    readonly plan: CombatSettlementPlanV1;
    readonly state: SaveStateV2;
    readonly ownershipV2: OwnershipStateV2 | null;
    readonly guardianAcquisitions: GuardianAcquisitionStateV1 | null;
    readonly guardianCompanions: GuardianCompanionStateV1 | null;
    readonly brinkAchievement: CombatSettlementBrinkAchievementFactV1 | null;
    readonly starterConquestCharter: CombatSettlementStarterConquestCharterFactV1 | null;
  }>
  | Readonly<{
    readonly kind: 'mismatch';
    readonly convergence: 'read-only-reload';
    readonly reason:
      | 'commit-unregistered'
      | 'revision-mismatch'
      | 'receipt-mismatch'
      | 'save-mismatch'
      | 'combat-authority-mismatch'
      | 'ownership-mismatch'
      | 'guardian-acquisition-mismatch'
      | 'guardian-companion-mismatch'
      | 'brink-achievement-mismatch'
      | 'starter-conquest-charter-mismatch';
  }>;

function mismatch(
  reason: Extract<CombatSettlementVerificationOutcomeV1, { readonly kind: 'mismatch' }>['reason'],
): CombatSettlementVerificationOutcomeV1 {
  return Object.freeze({ kind: 'mismatch', convergence: 'read-only-reload', reason });
}

/** Verify an exact postcommit reload before any UI publishes counters, loot,
 * injury, conquest, or receipt copy. This seam is read-only and never turns a
 * mismatch into a retry. */
export function verifyCommittedCombatSettlementV1(input: Readonly<{
  readonly committed: CommittedCombatSettlementV1;
  readonly revision: number;
  readonly writable: V5WritableState;
  readonly receipt: MutationReceipt | undefined;
}>): CombatSettlementVerificationOutcomeV1 {
  const registered = input?.committed && typeof input.committed === 'object'
    ? COMMITTED_COMBAT.get(input.committed)
    : undefined;
  if (registered === undefined) return mismatch('commit-unregistered');
  if (input.revision !== registered.transaction.revision) return mismatch('revision-mismatch');
  const expectedReceipt = registered.transaction.receipt;
  if (!input.receipt || input.receipt.ordinal !== expectedReceipt.ordinal
    || input.receipt.kind !== expectedReceipt.kind
    || input.receipt.witness !== expectedReceipt.witness) return mismatch('receipt-mismatch');
  if (!sameJson(input.writable.state, registered.transaction.saved.canonicalState)
    || !sameJson(input.writable.extensions, registered.transaction.saved.extensions)) {
    return mismatch('save-mismatch');
  }
  const authority = readCombatSettlementAuthorityV1(input.writable.extensions);
  if (authority.kind !== 'loaded') return mismatch('combat-authority-mismatch');
  const battle = authority.authority.battles.find((row) => (
    row.receiptOrdinal === registered.derived.battle.receiptOrdinal
  ));
  if (!battle || !sameJson(battle, registered.derived.battle)) {
    return mismatch('combat-authority-mismatch');
  }
  let ownershipV2: OwnershipStateV2 | null = null;
  if (registered.derived.ownershipSettlement !== null) {
    const prepared = registered.derived.ownershipPrepared;
    if (!prepared || prepared.kind !== 'prepared') return mismatch('ownership-mismatch');
    const committedOwnership = committedArc5OwnershipState(
      prepared,
      input.writable.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (committedOwnership === null
      || ownershipStateDigestV2(committedOwnership.state)
        !== registered.derived.ownershipSettlement.successorDigest) {
      return mismatch('ownership-mismatch');
    }
    ownershipV2 = committedOwnership.state;
  }
  let guardianAcquisitions: GuardianAcquisitionStateV1 | null = null;
  if (registered.derived.guardianSuccessorDigest !== null
    || registered.derived.guardianCompanionSuccessorDigest !== null) {
    const read = readGuardianAcquisitionCarrierV1(
      input.writable.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (read.kind !== 'loaded') {
      return mismatch('guardian-acquisition-mismatch');
    }
    if (registered.derived.guardianSuccessorDigest !== null
      && guardianAcquisitionStateDigestV1(read.state)
        !== registered.derived.guardianSuccessorDigest) {
      return mismatch('guardian-acquisition-mismatch');
    }
    guardianAcquisitions = read.state;
  }
  let guardianCompanions: GuardianCompanionStateV1 | null = null;
  if (registered.derived.guardianCompanionSuccessorDigest !== null) {
    const read = readGuardianCompanionCarrierV1(input.writable.extensions);
    if (read.kind !== 'loaded'
      || guardianCompanionStateDigestV1(read.state)
        !== registered.derived.guardianCompanionSuccessorDigest
      || guardianAcquisitions === null) {
      return mismatch('guardian-companion-mismatch');
    }
    const projection = projectGuardianCompanionsV1({
      source: guardianAcquisitions,
      overlay: read.state,
    });
    const settlement = registered.derived.guardianCompanionSettlement;
    if (projection.kind !== 'projected' || settlement === null
      || (settlement.creatureAfter === null
        ? !projection.tombstones.some((row) => (
          row.creatureId === settlement.creatureBefore.creatureId
            && row.disposition.ordinal === settlement.receiptEvidence.ordinal
        ))
        : !projection.creatures.some((row) => (
          row.creatureId === settlement.creatureAfter!.creatureId
            && canonicalJson(row) === canonicalJson(settlement.creatureAfter)
        )))) {
      return mismatch('guardian-companion-mismatch');
    }
    guardianCompanions = read.state;
  }
  const brinkAchievement = registered.derived.brinkAchievement;
  if (brinkAchievement !== null) {
    let unlocked: readonly string[];
    try {
      unlocked = exactUnlockedIds(input.writable.state.unlocked);
    } catch {
      return mismatch('brink-achievement-mismatch');
    }
    if (unlocked.filter((id) => id === COMBAT_BRINK_ACHIEVEMENT_ID_V1).length !== 1
      || unlocked.length !== brinkAchievement.unlockedCountAfter
      || brinkAchievement.priorUnlockedCount
        + (brinkAchievement.added ? 1 : 0) !== brinkAchievement.unlockedCountAfter
      || brinkAchievement.alreadyUnlocked === brinkAchievement.added) {
      return mismatch('brink-achievement-mismatch');
    }
  }
  const starterConquestCharter = registered.derived.starterConquestCharter;
  if (starterConquestCharter !== null) {
    const state = input.writable.state;
    if (state.chDone.filter((id) => id === COMBAT_STARTER_CONQUEST_CHARTER_ID_V1).length !== 1
      || state.chacc.includes(COMBAT_STARTER_CONQUEST_CHARTER_ID_V1)
      || state.essence !== starterConquestCharter.stardustAfter
      || state.stats.essenceEarned !== starterConquestCharter.lifetimeStardustAfter
      || state.stats.charters !== starterConquestCharter.honoredChartersAfter
      || starterConquestCharter.stardustBefore
        + starterConquestCharter.stardustReward !== starterConquestCharter.stardustAfter
      || starterConquestCharter.lifetimeStardustBefore
        + starterConquestCharter.stardustReward !== starterConquestCharter.lifetimeStardustAfter
      || starterConquestCharter.honoredChartersBefore + 1
        !== starterConquestCharter.honoredChartersAfter) {
      return mismatch('starter-conquest-charter-mismatch');
    }
  }
  return Object.freeze({
    kind: 'verified', convergence: 'none', revision: input.revision,
    plan: registered.plan, state: input.writable.state, ownershipV2,
    guardianAcquisitions, guardianCompanions, brinkAchievement, starterConquestCharter,
  });
}
