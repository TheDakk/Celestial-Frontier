/* Arc 6 deterministic conquest settlement planning.

   This module preserves the mature v1.8.9 post-combat outcomes without
   pretending to own UI, persistence, clocks, catalogue insertion, or loot
   materialization. It accepts one owner-minted Guardian/Prime encounter and
   one complete settled runDuel transcript, verifies that transcript by exact
   deterministic replay, and returns an immutable plan for a later F3 writer.
   Receipt ordinal + semantic witness make the plan exact-once-ready; the
   private registry prevents a structural clone from becoming write authority. */
import type { Genome } from '@cf/domain-genome';
import {
  PRIME_SIGNATURE_IDS_V1,
  PRIME_SIGNATURES_V1,
  isGuardianPrimeEncounterV1,
  type GuardianPrimeEncounterV1,
  type PrimeSignatureIdV1,
} from './guardian-prime.js';
import {
  runDuel,
  type BattleStats,
  type DuelResult,
} from './combatcore.verbatim.js';
import {
  encounterHasGuardianPhaseV1,
  runEncounterV1,
  type EncounterDecisionV1,
  type EncounterFighterV1,
  type EncounterModeV1,
  type EncounterStanceV1,
} from './encounter.js';

export const COMBAT_SETTLEMENT_PLAN_SCHEMA_V1 = 'cf-v2-combat-settlement-plan/v1' as const;
export const COMBAT_SETTLEMENT_WITNESS_SCHEMA_V1 = 'cf-v2-combat-settlement-witness/v1' as const;
export const COMBAT_SETTLEMENT_RECEIPT_KIND_V1 = 'combat-settlement' as const;
export const LAST_USABLE_COMBAT_RECEIPT_ORDINAL_V1 = 0xffff_fffe;

export const COMBAT_SETTLEMENT_SCOPE_V1 = Object.freeze({
  supportedMode: 'legacy-v1.8.9-conquest-only',
  friendlyDuelProgression: 'unsupported-open-active-play-policy',
  partyRolesAndRetreat: 'unsupported-open-design-gate',
  guardianAuthoredReward: 'unsupported-open-loot-table',
} as const);

export type CombatSettlementOutcomeV1 = 'champion-win' | 'defender-win' | 'draw';

export interface OwnedFaunaSettlementChampionV1 {
  readonly kind: 'owned-fauna';
  readonly creatureId: string;
  readonly name: string;
  readonly genome: Readonly<Genome>;
  /** Exact mature-v1 lineage fact (verified by the ownership writers). Since §20 (2026-09-25) every defeated companion, bred or
   * not, is wounded and enters active-play Recovery; the v1 permanent loss is retired. */
  readonly legacyBredLineage: boolean;
}

export interface PlayerSettlementChampionV1 {
  readonly kind: 'player';
  readonly explorerId: string;
  readonly name: string;
  readonly genomeSeed: number;
  readonly stats: Readonly<BattleStats>;
  readonly currentHp: number;
}

export type CombatSettlementChampionV1 =
  | OwnedFaunaSettlementChampionV1
  | PlayerSettlementChampionV1;

export type CombatLossXpAuthorityV1 =
  | Readonly<{ readonly kind: 'known-target'; readonly awardedTarget: 0 | 3 | 5 }>
  | Readonly<{ readonly kind: 'legacy-shared-key-ambiguous' }>;

export interface CombatSettlementAuthorityV1 {
  readonly worldConquered: boolean;
  readonly claimedPrimeSignatureIds: readonly PrimeSignatureIdV1[];
  /** Null for the player. Owned fauna require either the authoritative v2
   * target maximum or an explicit protected legacy-ambiguity marker. */
  readonly lossXp: CombatLossXpAuthorityV1 | null;
  /** The committed F4 active-play clock at settlement: a defeat's Recovery ends at this + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1.
   * The app MUST pass it (tests/arc6-combat-main-wiring pins the call site); absent reads 0 for pre-§20 fixtures. */
  readonly activePlayMs?: number;
}

/** Recovery after a defeat, in ACTIVE-PLAY milliseconds (placeholder: Codex's S4/economy owns the number; §20). */
export const COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 = 10 * 60 * 1000;
/** §20: a defeat adds NO wound. A fallen fighter and one swapped out get the same Recovery, so a wound on the fallen alone would make
 *  swapping necessary to avoid it (Nick: "I don't want them to feel the swap is necessary"), and v2 has no healing yet (D13). */
export const COMBAT_DEFEAT_WOUND_STEP_V1 = 0;

export interface PlanCombatSettlementInputV1 {
  readonly battleId: string;
  readonly receiptOrdinal: number;
  readonly encounter: GuardianPrimeEncounterV1;
  readonly champion: CombatSettlementChampionV1;
  readonly transcript: DuelResult;
  readonly outcome: CombatSettlementOutcomeV1;
  readonly worldTier: number;
  readonly authority: CombatSettlementAuthorityV1;
}

export interface SettledDuelTranscriptV1 {
  readonly A: Readonly<BattleStats>;
  readonly B: Readonly<BattleStats>;
  readonly log: readonly Readonly<Record<string, unknown>>[];
  readonly winner: 'A' | 'B' | null;
  readonly hpA: number;
  readonly hpB: number;
  readonly maxA: number;
  readonly maxB: number;
  readonly turnA0: boolean;
}

export interface CombatCounterDeltasV1 {
  readonly duels: 1;
  readonly duelWins: 0 | 1;
  readonly guardians: 0 | 1;
}

export type CombatXpPlanV1 =
  | Readonly<{ readonly status: 'not-applicable'; readonly reason: 'player-champion' }>
  | Readonly<{
    readonly status: 'award';
    readonly source: 'conquest-win' | 'guardian-win';
    readonly creatureId: string;
    readonly amount: number;
  }>
  | Readonly<{
    readonly status: 'loss-target';
    readonly creatureId: string;
    readonly ledgerModel: 'per-creature-per-canonical-world-maximum/v1';
    readonly ledgerIdentity: string;
    readonly nearBrink: boolean;
    readonly previousTarget: 0 | 3 | 5;
    readonly outcomeTarget: 3 | 5;
    readonly nextTarget: 3 | 5;
    readonly baseDelta: 0 | 3;
    readonly nearBrinkDelta: 0 | 2;
    readonly totalDelta: 0 | 2 | 3 | 5;
  }>
  | Readonly<{
    readonly status: 'protected-unsupported';
    readonly creatureId: string;
    readonly reason: 'legacy-shared-key-amount-ambiguous';
    readonly nearBrink: boolean;
    readonly totalDelta: 0;
  }>;

export type CombatInjuryPlanV1 =
  | Readonly<{ readonly status: 'none'; readonly reason: 'healthy-win' | 'player-win' }>
  | Readonly<{
    readonly status: 'set-hurt';
    readonly reason: 'hard-won-conquest';
    readonly creatureId: string;
    readonly hurtBefore: number;
    readonly hurtAfter: number;
    readonly winningHpFraction: number | null;
  }>
  | Readonly<{
    /** Nick 2026-09-25 (port/DECISIONS.md §20): a defeated companion is NEVER removed. It is wounded and enters active-play
     * Recovery (the §16 carrier), which blocks breed, combat and dispatch until `readyAtActivePlayMs`. */
    readonly status: 'set-recovery';
    readonly reason: 'defeat-recovery';
    readonly creatureId: string;
    readonly hurtBefore: number;
    readonly hurtAfter: number;
    readonly readyAtActivePlayMs: number;
  }>
  | Readonly<{
    readonly status: 'damage-player';
    readonly hpBefore: number;
    readonly hpAfter: number;
    readonly damage: number;
    readonly mercyFloor: 1;
  }>;

export type CombatConquestPlanV1 =
  | Readonly<{ readonly status: 'unchanged'; readonly worldKey: string }>
  | Readonly<{
    readonly status: 'settle';
    readonly worldKey: string;
    readonly world: GuardianPrimeEncounterV1['identity']['world'];
    readonly tier: number;
    readonly legacyEpoch: 0;
  }>;

export type GuardianCapturePlanV1 =
  | Readonly<{ readonly status: 'none' }>
  | Readonly<{
    readonly status: 'ownership-writer-required';
    readonly source: 'Apex Guardian' | 'Elemental Titan';
    readonly sourceId: string;
    readonly portableGenome: Readonly<Genome>;
    readonly battlefieldModifiersStripped: true;
    readonly cataloguePolicy: 'legacy-store-species-deduplication';
  }>;

export type PrimeClaimPlanV1 =
  | Readonly<{ readonly status: 'none' }>
  | Readonly<{
    readonly status: 'claim';
    readonly signatureId: PrimeSignatureIdV1;
    readonly title: string;
    readonly sub: 'titan felled';
    readonly tier: 14;
    readonly hex: '#ffd96a';
    readonly world: GuardianPrimeEncounterV1['identity']['world'];
  }>;

export interface CombatRewardPlanV1 {
  readonly stardust: Readonly<{
    readonly status: 'award' | 'none';
    readonly amount: number;
    readonly lifetimeEarnedDelta: number;
  }>;
  readonly legacyConquestAffix: Readonly<{
    readonly status: 'none' | 'delegated-exact';
    readonly owner: 'loot-and-equipped-state-writer';
    readonly planetSeed: number;
    readonly gateSalt: 0x5901;
    readonly selectionSalt: 0x5902;
    readonly gateChance: 0.4;
  }>;
  readonly guardianAuthoredReward: Readonly<{
    readonly status: 'none' | 'unsupported-open';
    readonly owner: 'Arc-6-loot-design';
    readonly reason: 'authored-Guardian-reward-table-not-authoritative';
  }>;
}

export interface CombatSettlementReceiptV1 {
  readonly ordinal: number;
  readonly kind: typeof COMBAT_SETTLEMENT_RECEIPT_KIND_V1;
  readonly witness: string;
}

export interface CombatSettlementPlanV1 {
  readonly schema: typeof COMBAT_SETTLEMENT_PLAN_SCHEMA_V1;
  readonly status: 'planned';
  readonly policy: 'legacy-v1.8.9-conquest';
  readonly battleId: string;
  readonly receiptOrdinal: number;
  readonly encounter: GuardianPrimeEncounterV1;
  readonly champion: CombatSettlementChampionV1;
  readonly transcript: SettledDuelTranscriptV1;
  readonly transcriptFingerprint: string;
  readonly outcome: CombatSettlementOutcomeV1;
  readonly worldTier: number;
  readonly authority: CombatSettlementAuthorityV1;
  readonly counters: CombatCounterDeltasV1;
  readonly xp: CombatXpPlanV1;
  readonly injury: CombatInjuryPlanV1;
  readonly conquest: CombatConquestPlanV1;
  readonly guardianCapture: GuardianCapturePlanV1;
  readonly primeClaim: PrimeClaimPlanV1;
  readonly rewards: CombatRewardPlanV1;
  /** §20 Guardian party (absent for a one-fighter fight, whose plan is byte-identical to the single-champion plan). The top-level
   *  champion/transcript/outcome/xp/injury describe the DECISIVE leg; this block carries the rest of the party. */
  readonly party?: CombatPartyPlanV1;
  readonly witness: string;
  readonly receipt: CombatSettlementReceiptV1;
}

export const COMBAT_PARTY_PLAN_SCHEMA_V1 = 'cf-v2-combat-party/v1' as const;
export interface CombatPartyMemberPlanV1 {
  readonly index: number;
  readonly champion: CombatSettlementChampionV1;
  readonly stance: EncounterStanceV1;
  /** How this member's part ended: the decisive leg (settled by the top-level plan), fell, swapped out, yielded at the cap, or never fought. */
  readonly legEnd: 'decisive' | 'fighter-fell' | 'swapped' | 'cap' | 'not-fought';
  /** §20: a non-decisive companion that fought enters Recovery; the explorer and anyone who never fought take nothing. */
  readonly injury: Extract<CombatInjuryPlanV1, { status: 'set-recovery' }> | Readonly<{ status: 'none'; reason: 'not-fought' | 'explorer-left-stage' }> | null;
}
export interface CombatPartyPlanV1 {
  readonly schema: typeof COMBAT_PARTY_PLAN_SCHEMA_V1;
  readonly mode: EncounterModeV1;
  readonly decisions: readonly EncounterDecisionV1[];
  readonly decisiveIndex: number;
  readonly members: readonly CombatPartyMemberPlanV1[];
  readonly encounterFingerprint: string;
}
export interface CombatPartyMemberInputV1 {
  readonly champion: CombatSettlementChampionV1;
  readonly stance: EncounterStanceV1;
}

export type CombatSettlementRefusalReasonV1 =
  | 'encounter-unregistered'
  | 'encounter-authority-mismatch'
  | 'input-invalid'
  | 'transcript-mismatch'
  | 'outcome-mismatch'
  | 'already-conquered'
  | 'prime-already-claimed';

export type CombatSettlementPlanningOutcomeV1 =
  | Readonly<{ readonly status: 'refused'; readonly reason: CombatSettlementRefusalReasonV1 }>
  | CombatSettlementPlanV1;

const COMBAT_SETTLEMENT_PLANS_V1 = new WeakSet<object>();
const PRIME_IDS = new Set<string>(PRIME_SIGNATURE_IDS_V1);

export function isCombatSettlementPlanV1(value: unknown): value is CombatSettlementPlanV1 {
  return typeof value === 'object'
    && value !== null
    && COMBAT_SETTLEMENT_PLANS_V1.has(value)
    && (value as CombatSettlementPlanV1).schema === COMBAT_SETTLEMENT_PLAN_SCHEMA_V1;
}

function refused(reason: CombatSettlementRefusalReasonV1): CombatSettlementPlanningOutcomeV1 {
  return Object.freeze({ status: 'refused', reason });
}

function boundedText(value: unknown, label: string, maximum = 192): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function uint32(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > 0xffff_ffff) {
    throw new RangeError(`${label} must be a uint32`);
  }
  return value as number;
}

function integer(value: unknown, label: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > maximum) {
    throw new RangeError(`${label} is invalid`);
  }
  return value as number;
}

type Canonical = null | boolean | number | string | readonly Canonical[] | { readonly [key: string]: Canonical };

function canonicalClone(value: unknown, active = new WeakSet<object>()): Canonical {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('combat evidence contains a non-finite number');
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== 'object') throw new TypeError('combat evidence is not JSON-compatible');
  if (active.has(value)) throw new TypeError('combat evidence is cyclic');
  active.add(value);
  try {
    if (Array.isArray(value)) return Object.freeze(value.map((row) => canonicalClone(row, active)));
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('combat evidence objects must be plain');
    }
    const result: Record<string, Canonical> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const child = (value as Record<string, unknown>)[key];
      if (child !== undefined) result[key] = canonicalClone(child, active);
    }
    return Object.freeze(result);
  } finally {
    active.delete(value);
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalClone(value));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function fnv1a32(text: string, offset: number, reverse: boolean): number {
  let hash = offset >>> 0;
  for (let step = 0; step < text.length; step++) {
    const index = reverse ? text.length - 1 - step : step;
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Bounded deterministic fingerprint. The full frozen evidence remains on the
 * registered plan; F3's save-lifetime ordinal supplies duplicate authority. */
function fingerprint(value: string): string {
  const left = fnv1a32(value, 2166136261, false).toString(16).padStart(8, '0');
  const right = fnv1a32(value, 0x9e3779b9, true).toString(16).padStart(8, '0');
  return `cfp1:${value.length}:${left}${right}`;
}

function exactClaimedIds(ids: readonly PrimeSignatureIdV1[]): readonly PrimeSignatureIdV1[] {
  if (!Array.isArray(ids)) throw new TypeError('claimed Prime ids must be an array');
  const seen = new Set<string>();
  const result: PrimeSignatureIdV1[] = [];
  for (const id of ids) {
    if (!PRIME_IDS.has(id) || seen.has(id)) throw new TypeError('claimed Prime ids are invalid');
    seen.add(id);
    result.push(id);
  }
  return Object.freeze(result);
}

function hurtOf(genome: Readonly<Genome>): number {
  const raw = genome.hurt;
  if (raw === undefined || raw === null || raw === 0) return 0;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0 || raw > 0.85) {
    throw new RangeError('champion hurt is outside the legacy persisted range');
  }
  return raw;
}

function checkedLossXp(
  value: CombatLossXpAuthorityV1 | null,
  championKind: CombatSettlementChampionV1['kind'],
): CombatLossXpAuthorityV1 | null {
  if (championKind === 'player') {
    if (value !== null) throw new TypeError('player champion cannot carry creature loss XP authority');
    return null;
  }
  if (value === null || typeof value !== 'object') throw new TypeError('owned champion loss XP authority is required');
  if (value.kind === 'legacy-shared-key-ambiguous') return Object.freeze({ kind: value.kind });
  if (value.kind === 'known-target'
    && (value.awardedTarget === 0 || value.awardedTarget === 3 || value.awardedTarget === 5)) {
    return Object.freeze({ kind: value.kind, awardedTarget: value.awardedTarget });
  }
  throw new TypeError('owned champion loss XP authority is invalid');
}

function checkedChampion(champion: CombatSettlementChampionV1): CombatSettlementChampionV1 {
  if (!champion || typeof champion !== 'object') throw new TypeError('combat champion is required');
  if (champion.kind === 'owned-fauna') {
    const genome = canonicalClone(champion.genome) as unknown as Genome;
    uint32(genome.seed, 'champion genome seed');
    if (genome.kingdom !== 'fauna') throw new TypeError('owned combat champion must be fauna');
    if (typeof champion.legacyBredLineage !== 'boolean') throw new TypeError('legacy bred lineage must be explicit');
    hurtOf(genome);
    return deepFreeze({
      kind: 'owned-fauna' as const,
      creatureId: boundedText(champion.creatureId, 'champion creature id'),
      name: boundedText(champion.name, 'champion name', 96),
      genome,
      legacyBredLineage: champion.legacyBredLineage,
    });
  }
  if (champion.kind === 'player') {
    const stats = canonicalClone(champion.stats) as unknown as BattleStats;
    for (const key of ['vit', 'fer', 'res', 'agi', 'ins', 'total'] as const) {
      if (typeof stats[key] !== 'number' || !Number.isFinite(stats[key]) || stats[key] < 0) {
        throw new TypeError(`player battle stat ${key} is invalid`);
      }
    }
    if (!stats.ab || typeof stats.ab !== 'object') throw new TypeError('player battle ability is invalid');
    const currentHp = integer(champion.currentHp, 'current explorer HP', Number.MAX_SAFE_INTEGER);
    if (currentHp < 1) throw new RangeError('current explorer HP must respect the mercy floor');
    return deepFreeze({
      kind: 'player' as const,
      explorerId: boundedText(champion.explorerId, 'explorer id'),
      name: boundedText(champion.name, 'explorer name', 96),
      genomeSeed: uint32(champion.genomeSeed, 'player genome seed'),
      stats,
      currentHp,
    });
  }
  throw new TypeError('combat champion kind is invalid');
}

function outcomeOf(transcript: SettledDuelTranscriptV1): CombatSettlementOutcomeV1 {
  return transcript.winner === 'A' ? 'champion-win'
    : transcript.winner === 'B' ? 'defender-win' : 'draw';
}

function buildTranscript(
  champion: CombatSettlementChampionV1,
  encounter: GuardianPrimeEncounterV1,
  supplied: DuelResult,
  /** §20 party/stance fights: the decisive leg the encounter engine resolved (the legacy path re-runs runDuel). */
  engineLeg: DuelResult | null = null,
): { readonly transcript: SettledDuelTranscriptV1; readonly fingerprint: string } | null {
  const mine = champion.kind === 'player'
    ? { name: champion.name, genome: { seed: champion.genomeSeed }, stats: champion.stats as BattleStats }
    : { name: champion.name, genome: champion.genome as Genome };
  const expected = engineLeg ?? runDuel(mine, {
    name: encounter.defender.name,
    genome: encounter.defender.battleGenome as Genome,
  });
  const expectedJson = canonicalJson(expected);
  if (expectedJson !== canonicalJson(supplied)) return null;
  if (expectedJson.length > 250_000) throw new RangeError('combat transcript exceeds its receipt-planning bound');
  const transcript = canonicalClone(expected) as unknown as SettledDuelTranscriptV1;
  return Object.freeze({ transcript, fingerprint: fingerprint(expectedJson) });
}

function lossXpPlan(
  champion: OwnedFaunaSettlementChampionV1,
  transcript: SettledDuelTranscriptV1,
  authority: CombatLossXpAuthorityV1,
  worldKey: string,
): CombatXpPlanV1 {
  const nearBrink = transcript.hpB / Math.max(1, transcript.maxB) < 0.3;
  if (authority.kind === 'legacy-shared-key-ambiguous') return Object.freeze({
    status: 'protected-unsupported',
    creatureId: champion.creatureId,
    reason: 'legacy-shared-key-amount-ambiguous',
    nearBrink,
    totalDelta: 0,
  });
  const previous = authority.awardedTarget;
  const outcomeTarget = nearBrink ? 5 : 3;
  const baseDelta: 0 | 3 = previous < 3 ? 3 : 0;
  const nearBrinkDelta: 0 | 2 = nearBrink && previous < 5 ? 2 : 0;
  const totalDelta = (baseDelta + nearBrinkDelta) as 0 | 2 | 3 | 5;
  const nextTarget = Math.max(previous, outcomeTarget) as 3 | 5;
  return Object.freeze({
    status: 'loss-target',
    creatureId: champion.creatureId,
    ledgerModel: 'per-creature-per-canonical-world-maximum/v1',
    ledgerIdentity: `combat-loss-xp/v1|${champion.creatureId}|${worldKey}`,
    nearBrink,
    previousTarget: previous,
    outcomeTarget,
    nextTarget,
    baseDelta,
    nearBrinkDelta,
    totalDelta,
  });
}

function xpPlan(
  champion: CombatSettlementChampionV1,
  encounter: GuardianPrimeEncounterV1,
  transcript: SettledDuelTranscriptV1,
  outcome: CombatSettlementOutcomeV1,
  worldTier: number,
  lossAuthority: CombatLossXpAuthorityV1 | null,
): CombatXpPlanV1 {
  if (champion.kind === 'player') return Object.freeze({ status: 'not-applicable', reason: 'player-champion' });
  if (outcome !== 'champion-win') {
    return lossXpPlan(champion, transcript, lossAuthority!, encounter.identity.world.key);
  }
  const guarded = encounter.defender.kind === 'guardian' || encounter.defender.kind === 'titan';
  return Object.freeze({
    status: 'award',
    source: guarded ? 'guardian-win' : 'conquest-win',
    creatureId: champion.creatureId,
    amount: (guarded ? 60 : 20) + worldTier,
  });
}

function injuryPlan(
  champion: CombatSettlementChampionV1,
  encounter: GuardianPrimeEncounterV1,
  transcript: SettledDuelTranscriptV1,
  outcome: CombatSettlementOutcomeV1,
  activePlayMs: number,
): CombatInjuryPlanV1 {
  if (outcome === 'champion-win') {
    if (champion.kind === 'player') return Object.freeze({ status: 'none', reason: 'player-win' });
    const log = transcript.log;
    const last = log.length > 0 ? log[log.length - 1] : undefined;
    const lastHp = last?.hpA;
    if (typeof lastHp !== 'number' || !Number.isFinite(lastHp) || transcript.maxA <= 0) {
      return Object.freeze({ status: 'none', reason: 'healthy-win' });
    }
    const fraction = Math.max(0, lastHp / transcript.maxA);
    if (fraction >= 0.55) return Object.freeze({ status: 'none', reason: 'healthy-win' });
    const before = hurtOf(champion.genome);
    return Object.freeze({
      status: 'set-hurt',
      reason: 'hard-won-conquest',
      creatureId: champion.creatureId,
      hurtBefore: before,
      hurtAfter: Math.min(0.85, before + (0.55 - fraction) * 0.7),
      winningHpFraction: fraction,
    });
  }
  if (champion.kind === 'player') {
    const damage = Math.min(
      Math.round(16 + encounter.defender.power / 24),
      Math.max(0, champion.currentHp - 1),
    );
    return Object.freeze({
      status: 'damage-player',
      hpBefore: champion.currentHp,
      hpAfter: champion.currentHp - damage,
      damage,
      mercyFloor: 1,
    });
  }
  /* §20: defeat is Recovery, never loss — for every companion, bred or wild (v1's permanent loss and one-time bred crawl-home retire). */
  const before = hurtOf(champion.genome);
  return Object.freeze({
    status: 'set-recovery',
    reason: 'defeat-recovery',
    creatureId: champion.creatureId,
    hurtBefore: before,
    hurtAfter: Math.min(0.85, Math.max(before, before + COMBAT_DEFEAT_WOUND_STEP_V1)),
    readyAtActivePlayMs: activePlayMs + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
  });
}

function guardianCapturePlan(
  encounter: GuardianPrimeEncounterV1,
  outcome: CombatSettlementOutcomeV1,
): GuardianCapturePlanV1 {
  const genome = encounter.defender.capturableGenome;
  if (outcome !== 'champion-win' || genome === null) return Object.freeze({ status: 'none' });
  if (genome._mult !== undefined || genome._wf !== undefined) {
    throw new TypeError('capturable Guardian genome retained battlefield modifiers');
  }
  return Object.freeze({
    status: 'ownership-writer-required',
    source: encounter.defender.kind === 'titan' ? 'Elemental Titan' : 'Apex Guardian',
    sourceId: encounter.defender.sourceId,
    portableGenome: genome,
    battlefieldModifiersStripped: true,
    cataloguePolicy: 'legacy-store-species-deduplication',
  });
}

function primeClaimPlan(
  encounter: GuardianPrimeEncounterV1,
  outcome: CombatSettlementOutcomeV1,
): PrimeClaimPlanV1 {
  const signatureId = encounter.defender.signatureId;
  if (outcome !== 'champion-win' || encounter.defender.kind !== 'titan' || signatureId === null) {
    return Object.freeze({ status: 'none' });
  }
  const definition = PRIME_SIGNATURES_V1.find((row) => row.id === signatureId)!;
  return Object.freeze({
    status: 'claim',
    signatureId,
    title: `${definition.element} — ${encounter.defender.name}`,
    sub: 'titan felled',
    tier: 14,
    hex: '#ffd96a',
    world: encounter.identity.world,
  });
}

function rewardPlan(
  encounter: GuardianPrimeEncounterV1,
  outcome: CombatSettlementOutcomeV1,
  worldTier: number,
): CombatRewardPlanV1 {
  const won = outcome === 'champion-win';
  const guarded = encounter.defender.kind === 'guardian' || encounter.defender.kind === 'titan';
  const legacyRewardTier = Math.max(1, worldTier);
  const stardust = won ? 8 + legacyRewardTier * 5 + (guarded ? 40 : 0) : 0;
  return deepFreeze({
    stardust: {
      status: won ? 'award' as const : 'none' as const,
      amount: stardust,
      lifetimeEarnedDelta: stardust,
    },
    legacyConquestAffix: {
      status: won ? 'delegated-exact' as const : 'none' as const,
      owner: 'loot-and-equipped-state-writer' as const,
      planetSeed: encounter.identity.world.planet.seed,
      gateSalt: 0x5901 as const,
      selectionSalt: 0x5902 as const,
      gateChance: 0.4 as const,
    },
    guardianAuthoredReward: {
      status: won && guarded ? 'unsupported-open' as const : 'none' as const,
      owner: 'Arc-6-loot-design' as const,
      reason: 'authored-Guardian-reward-table-not-authoritative' as const,
    },
  });
}

export function planCombatSettlementV1(
  input: PlanCombatSettlementInputV1,
): CombatSettlementPlanningOutcomeV1 {
  return planCombatSettlementCore(input, null);
}

interface CombatPartyContextV1 {
  readonly engineLeg: DuelResult;
  readonly mode: EncounterModeV1;
  readonly decisions: readonly EncounterDecisionV1[];
  readonly decisiveIndex: number;
  readonly members: readonly (CombatPartyMemberInputV1 & { readonly legEnd: CombatPartyMemberPlanV1['legEnd'] })[];
  readonly encounterFingerprint: string;
}

export interface PlanCombatPartySettlementInputV1 extends Omit<PlanCombatSettlementInputV1, 'champion' | 'transcript' | 'outcome'> {
  /** 1–3 fighters in relay order (§20: a party of more than one is for Guardians/Titans only; the app enforces who may bring one). */
  readonly party: readonly CombatPartyMemberInputV1[];
  readonly mode: EncounterModeV1;
  /** Command decisions in Break order (Auto takes none). The fight must be FINISHED; withdrawing settles through another path. */
  readonly decisions?: readonly EncounterDecisionV1[];
}

function encounterFighter(member: CombatPartyMemberInputV1): EncounterFighterV1 {
  const c = member.champion;
  return c.kind === 'player'
    ? { name: c.name, genome: { seed: c.genomeSeed }, stats: c.stats as BattleStats, stance: member.stance }
    : { name: c.name, genome: c.genome as unknown as EncounterFighterV1['genome'], stance: member.stance };
}

/** §20: plan a Guardian party fight (or a stanced single fight) as ONE settlement. A lone Balanced Auto fighter takes the legacy path,
 *  so its plan is byte-identical to `planCombatSettlementV1`. Otherwise the encounter engine resolves the fight, the DECISIVE leg becomes
 *  the top-level champion/transcript/outcome, and the `party` block carries every other member's Recovery. */
export function planCombatPartySettlementV1(input: PlanCombatPartySettlementInputV1): CombatSettlementPlanningOutcomeV1 {
  if (!input || typeof input !== 'object' || !Array.isArray(input.party) || input.party.length < 1 || input.party.length > 3) {
    return refused('input-invalid');
  }
  if (!isGuardianPrimeEncounterV1(input.encounter)) return refused('encounter-unregistered');
  const decisions = input.decisions ?? [];
  const ids = input.party.map(({ champion }) => (champion.kind === 'player' ? `player:${champion.explorerId}` : champion.creatureId));
  if (new Set(ids).size !== ids.length) return refused('input-invalid');
  const defender = { name: input.encounter.defender.name, genome: input.encounter.defender.battleGenome as unknown as EncounterFighterV1['genome'],
    phase: encounterHasGuardianPhaseV1(input.encounter.defender.kind) };
  // D17 (Nick 2026-09-25): the phase change applies in EVERY Guardian/Titan fight, solo Auto included — the legacy runDuel path (v1 parity)
  // is only for a defender without the phase; the engine keeps v1 parity as its own phase-off test.
  const legacy = !defender.phase && input.party.length === 1 && input.party[0]!.stance === 'balanced' && input.mode === 'auto' && decisions.length === 0;
  if (legacy) {
    const champion = input.party[0]!.champion;
    const mine = encounterFighter(input.party[0]!);
    const transcript = runDuel({ name: mine.name, genome: mine.genome as never, ...(mine.stats ? { stats: mine.stats } : {}) }, defender as never);
    const outcome: CombatSettlementOutcomeV1 = transcript.winner === 'A' ? 'champion-win' : transcript.winner === 'B' ? 'defender-win' : 'draw';
    return planCombatSettlementCore({ ...input, champion, transcript, outcome }, null);
  }
  let result: ReturnType<typeof runEncounterV1>;
  try {
    result = runEncounterV1({ mode: input.mode, defender, party: input.party.map(encounterFighter) }, decisions);
  } catch {
    return refused('input-invalid');
  }
  if (result.status !== 'finished' || result.decisionsUsed !== decisions.length) return refused('input-invalid');
  /* §20 Command Withdraw: the party leaves at a Break. It settles like any fight that was not won: the decisive leg is the one the
     party left from (a Break has no winner, so it settles as a draw; after a fallen fighter, as the defender's leg win). Auto never
     withdraws, and withdrawing forfeits the win, so it can never beat Auto's own play. */
  if (result.outcome === 'withdrawn' && input.mode !== 'command') return refused('input-invalid');
  const decisive = result.legs[result.legs.length - 1]!;
  const engineLeg = { A: decisive.A, B: decisive.B, log: decisive.log, winner: decisive.winner, hpA: decisive.hpA, hpB: decisive.hpB,
    maxA: decisive.maxA, maxB: decisive.maxB, turnA0: decisive.turnA0 } as unknown as DuelResult;
  const members = input.party.map((member, index) => {
    const leg = result.legs.find((row) => row.fighterIndex === index);
    const legEnd: CombatPartyMemberPlanV1['legEnd'] = index === decisive.fighterIndex ? 'decisive'
      : leg === undefined ? 'not-fought'
      : leg.end === 'swapped' ? 'swapped' : leg.end === 'fighter-fell' ? 'fighter-fell' : 'cap';
    return Object.freeze({ ...member, legEnd });
  });
  const outcome: CombatSettlementOutcomeV1 = result.outcome === 'withdrawn'
    ? (decisive.winner === 'A' ? 'champion-win' : decisive.winner === 'B' ? 'defender-win' : 'draw')
    : result.outcome === 'party' ? 'champion-win' : result.outcome === 'draw' ? 'draw' : 'defender-win';
  return planCombatSettlementCore({ ...input, champion: input.party[decisive.fighterIndex]!.champion, transcript: engineLeg, outcome }, {
    engineLeg, mode: input.mode, decisions: Object.freeze([...decisions]), decisiveIndex: decisive.fighterIndex, members,
    encounterFingerprint: fingerprint(canonicalJson({ mode: input.mode, decisions, stances: input.party.map((m) => m.stance), legs: result.legs.map((l) => [l.fighterIndex, l.end, l.hpA, l.hpB]) })),
  });
}

function planCombatSettlementCore(
  input: PlanCombatSettlementInputV1,
  party: CombatPartyContextV1 | null,
): CombatSettlementPlanningOutcomeV1 {
  if (!input || typeof input !== 'object') return refused('input-invalid');
  if (!isGuardianPrimeEncounterV1(input.encounter)) return refused('encounter-unregistered');
  try {
    const battleId = boundedText(input.battleId, 'battle id');
    const receiptOrdinal = integer(
      input.receiptOrdinal,
      'combat receipt ordinal',
      LAST_USABLE_COMBAT_RECEIPT_ORDINAL_V1,
    );
    const worldTier = integer(input.worldTier, 'combat world tier', 14);
    if (!input.authority || typeof input.authority !== 'object'
      || typeof input.authority.worldConquered !== 'boolean') throw new TypeError('combat authority is invalid');
    if (input.authority.worldConquered) return refused('already-conquered');
    const claimedPrimeSignatureIds = exactClaimedIds(input.authority.claimedPrimeSignatureIds);
    const encounterClaims = [...input.encounter.identity.claimedSignatureIds].sort();
    const settlementClaims = [...claimedPrimeSignatureIds].sort();
    if (canonicalJson(encounterClaims) !== canonicalJson(settlementClaims)
      || input.encounter.identity.conquered !== false) {
      return refused('encounter-authority-mismatch');
    }
    if (input.encounter.defender.signatureId !== null
      && claimedPrimeSignatureIds.includes(input.encounter.defender.signatureId)) {
      return refused('prime-already-claimed');
    }
    const champion = checkedChampion(input.champion);
    const lossXp = checkedLossXp(input.authority.lossXp, champion.kind);
    const activePlayMs = integer(input.authority.activePlayMs ?? 0, 'combat active-play clock', Number.MAX_SAFE_INTEGER - COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1);
    const authority: CombatSettlementAuthorityV1 = Object.freeze({
      worldConquered: false,
      claimedPrimeSignatureIds,
      lossXp,
      activePlayMs,
    });
    const settled = buildTranscript(champion, input.encounter, input.transcript, party?.engineLeg ?? null);
    if (settled === null) return refused('transcript-mismatch');
    const derivedOutcome = outcomeOf(settled.transcript);
    if (input.outcome !== derivedOutcome) return refused('outcome-mismatch');

    const guarded = input.encounter.defender.kind === 'guardian'
      || input.encounter.defender.kind === 'titan';
    const counters: CombatCounterDeltasV1 = Object.freeze({
      duels: 1,
      duelWins: derivedOutcome === 'champion-win' ? 1 : 0,
      guardians: derivedOutcome === 'champion-win' && guarded ? 1 : 0,
    });
    const xp = xpPlan(
      champion,
      input.encounter,
      settled.transcript,
      derivedOutcome,
      worldTier,
      lossXp,
    );
    const injury = injuryPlan(champion, input.encounter, settled.transcript, derivedOutcome, activePlayMs);
    const partyPlan: CombatPartyPlanV1 | null = party === null ? null : Object.freeze({
      schema: COMBAT_PARTY_PLAN_SCHEMA_V1,
      mode: party.mode,
      decisions: party.decisions,
      decisiveIndex: party.decisiveIndex,
      encounterFingerprint: party.encounterFingerprint,
      members: Object.freeze(party.members.map((member, index): CombatPartyMemberPlanV1 => {
        const memberChampion = checkedChampion(member.champion);
        const memberInjury: CombatPartyMemberPlanV1['injury'] = member.legEnd === 'decisive' ? null
          : member.legEnd === 'not-fought' ? Object.freeze({ status: 'none' as const, reason: 'not-fought' as const })
          : memberChampion.kind === 'player' ? Object.freeze({ status: 'none' as const, reason: 'explorer-left-stage' as const })
          : Object.freeze({
            status: 'set-recovery' as const, reason: 'defeat-recovery' as const, creatureId: memberChampion.creatureId,
            hurtBefore: hurtOf(memberChampion.genome), hurtAfter: hurtOf(memberChampion.genome),
            readyAtActivePlayMs: activePlayMs + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
          });
        return Object.freeze({ index, champion: memberChampion, stance: member.stance, legEnd: member.legEnd, injury: memberInjury });
      })),
    });
    const conquest: CombatConquestPlanV1 = derivedOutcome === 'champion-win'
      ? Object.freeze({
        status: 'settle',
        worldKey: input.encounter.identity.world.key,
        world: input.encounter.identity.world,
        tier: worldTier,
        legacyEpoch: 0,
      })
      : Object.freeze({ status: 'unchanged', worldKey: input.encounter.identity.world.key });
    const guardianCapture = guardianCapturePlan(input.encounter, derivedOutcome);
    const primeClaim = primeClaimPlan(input.encounter, derivedOutcome);
    const rewards = rewardPlan(input.encounter, derivedOutcome, worldTier);
    const witness = canonicalJson({
      schema: COMBAT_SETTLEMENT_WITNESS_SCHEMA_V1,
      battleId,
      receiptOrdinal,
      encounterFingerprint: fingerprint(input.encounter.witness),
      transcriptFingerprint: settled.fingerprint,
      championFingerprint: fingerprint(canonicalJson(champion)),
      outcome: derivedOutcome,
      worldTier,
      authority,
      counters,
      xp,
      injury,
      conquest: conquest.status === 'settle'
        ? { status: conquest.status, worldKey: conquest.worldKey, tier: conquest.tier, legacyEpoch: 0 }
        : conquest,
      guardianCapture: guardianCapture.status === 'ownership-writer-required'
        ? { ...guardianCapture, portableGenome: fingerprint(canonicalJson(guardianCapture.portableGenome)) }
        : guardianCapture,
      primeClaim: primeClaim.status === 'claim'
        ? { ...primeClaim, world: primeClaim.world.key }
        : primeClaim,
      rewards,
      ...(partyPlan === null ? {} : { party: {
        mode: partyPlan.mode, decisions: partyPlan.decisions, decisiveIndex: partyPlan.decisiveIndex,
        encounterFingerprint: partyPlan.encounterFingerprint,
        members: partyPlan.members.map((m) => [m.index, m.champion.kind === 'player' ? 'player' : fingerprint(m.champion.creatureId), m.stance, m.legEnd,
          m.injury === null ? 'decisive' : m.injury.status === 'set-recovery' ? m.injury.readyAtActivePlayMs : m.injury.reason]),
      } }),
    });
    if (witness.length > 4_096) throw new RangeError('combat settlement witness exceeds F3 receipt capacity');
    const receipt: CombatSettlementReceiptV1 = Object.freeze({
      ordinal: receiptOrdinal,
      kind: COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
      witness,
    });
    const plan: CombatSettlementPlanV1 = deepFreeze({
      schema: COMBAT_SETTLEMENT_PLAN_SCHEMA_V1,
      status: 'planned' as const,
      policy: 'legacy-v1.8.9-conquest' as const,
      battleId,
      receiptOrdinal,
      encounter: input.encounter,
      champion,
      transcript: settled.transcript,
      transcriptFingerprint: settled.fingerprint,
      outcome: derivedOutcome,
      worldTier,
      authority,
      counters,
      xp,
      injury,
      conquest,
      guardianCapture,
      primeClaim,
      rewards,
      ...(partyPlan === null ? {} : { party: partyPlan }),
      witness,
      receipt,
    });
    COMBAT_SETTLEMENT_PLANS_V1.add(plan);
    return plan;
  } catch {
    return refused('input-invalid');
  }
}
