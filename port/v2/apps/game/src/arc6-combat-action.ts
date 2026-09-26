/* Arc 6 app-owned Guardian / Prime combat transaction.

   Presentation may simulate an encounter, but this owner settles exactly one
   source-bound duel. It projects the selected champion from the registered
   Arc 5 parent plus captured-Guardian authorities, plans from the current
   immutable receipt ordinal, crosses the
   F4 private lease once, then independently verifies the committed fixed
   point before returning anything publishable. It owns no DOM, audio, art,
   retry, or newly-authored reward policy. */
import {
  isGuardianPrimeEncounterV1,
  planCombatPartySettlementV1,
  planCombatSettlementV1,
  runDuel,
  runEncounterV1,
  encounterHasGuardianPhaseV1,
  type CombatPartyMemberInputV1,
  type EncounterDecisionV1,
  type EncounterResultV1,
  type EncounterStanceV1,
  type CombatSettlementChampionV1,
  type CombatSettlementOutcomeV1,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import {
  canonicalJson,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  sha256Hex,
  type CreatureInstanceV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { projectCompanionAvailabilityV1 } from '@cf/domain-acquisition/companion-availability';
import type { GuardianAcquisitionStateV1 } from '@cf/domain-acquisition/guardian-acquisition-internal';
import {
  projectGuardianCompanionsV1,
  type GuardianCompanionStateV1,
} from '@cf/domain-acquisition/guardian-companion-internal';
import type { Genome } from '@cf/domain-genome';
import {
  COMBAT_OPEN_ENCOUNTER_DECIDE_OPERATION_V1,
  COMBAT_OPEN_ENCOUNTER_OPEN_OPERATION_V1,
  CombatOpenEncounterRefusal,
  deriveCombatOpenEncounterDecisionV1,
  deriveCombatOpenEncounterOpenV1,
  readCombatOpenEncounterV1,
  simulateCombatOpenEncounterV1,
  type CombatOpenEncounterRecordV1,
  COMBAT_SETTLEMENT_OPERATION_V1,
  planF4DeterministicProductReceipt,
  projectCombatLossXpAuthorityV1,
  projectGuardianCombatLossXpAuthorityV1,
  projectLegacyPlayerSettlementChampionV1,
  readGuardianAcquisitionCarrierV1,
  readGuardianCompanionCarrierV1,
  verifyCommittedCombatSettlementV1,
  type CombatSettlementBrinkAchievementJoinV1,
  type CombatSettlementVerificationOutcomeV1,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import {
  isWorldOpportunitySnapshot,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import { resolveLegacyConquestImbuePlan, type LegacyWornBase } from '@cf/domain-loot';
import { describeSpecies } from '@cf/domain-genome';
import {
  prepareArc9EventAchievementJoinV1,
  projectArc9ProgressionStateV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
  F4RuntimeCombatSettlementOutcome,
} from './f4-runtime-authority.js';

export const ARC6_PLAYER_CHAMPION_ID = '__self__' as const;

export interface Arc6CombatChampionRosterRowV1 {
  readonly source: 'arc5' | 'guardian';
  readonly creature: CreatureInstanceV1;
}

export interface Arc6CombatChampionRosterV1 {
  readonly kind: 'projected';
  readonly authorityKey: string;
  readonly ownershipDigest: string;
  readonly guardianSourceDigest: string;
  readonly guardianOverlayDigest: string;
  readonly guardianProjectionDigest: string;
  readonly ownershipV2: OwnershipStateV2;
  readonly guardianAcquisitions: GuardianAcquisitionStateV1;
  readonly guardianCompanions: GuardianCompanionStateV1;
  readonly champions: readonly Arc6CombatChampionRosterRowV1[];
}

export type Arc6CombatChampionRosterProjectionV1 =
  | Arc6CombatChampionRosterV1
  | Readonly<{
    readonly kind: 'protected';
    readonly reason: string;
  }>;

const ARC6_COMBAT_CHAMPION_ROSTERS = new WeakSet<object>();

function protectedRoster(reason: string): Arc6CombatChampionRosterProjectionV1 {
  return Object.freeze({ kind: 'protected', reason });
}

/** Join Arc 5 living creatures with the separately-carried live Guardian
 * overlay. Acquisition rows remain immutable; tombstones stay absent from
 * this roster, and any cross-authority creature ID protects the whole join. */
export function projectArc6CombatChampionRosterV1(input: Readonly<{
  readonly ownershipV2: OwnershipStateV2;
  readonly extensions: V5Extensions;
}>): Arc6CombatChampionRosterProjectionV1 {
  if (!input || !isOwnershipStateV2(input.ownershipV2)) {
    return protectedRoster('ownership-unregistered');
  }
  const acquisition = readGuardianAcquisitionCarrierV1(input.extensions);
  if (acquisition.kind !== 'loaded') {
    return protectedRoster(`guardian-acquisition-${acquisition.reason}`);
  }
  const overlay = readGuardianCompanionCarrierV1(input.extensions);
  if (overlay.kind !== 'loaded') {
    return protectedRoster(`guardian-companion-${overlay.reason}`);
  }
  const guardians = projectGuardianCompanionsV1({
    source: acquisition.state,
    overlay: overlay.state,
  });
  if (guardians.kind !== 'projected') {
    return protectedRoster(`guardian-projection-${guardians.reason}`);
  }
  const arc5Ids = new Set(input.ownershipV2.creatures.map((row) => row.creatureId));
  if (acquisition.state.entries.some((entry) => (
    arc5Ids.has(entry.creature.creatureId)
  ))) {
    return protectedRoster('arc5-guardian-id-collision');
  }
  const ownershipDigest = ownershipStateDigestV2(input.ownershipV2);
  const champions = Object.freeze([
    ...input.ownershipV2.creatures.map((creature) => Object.freeze({
      source: 'arc5' as const,
      creature,
    })),
    ...guardians.creatures.map((creature) => Object.freeze({
      source: 'guardian' as const,
      creature,
    })),
  ]);
  const roster = Object.freeze({
    kind: 'projected' as const,
    authorityKey: `arc6-champion-roster:${sha256Hex(canonicalJson({
      schema: 'cf-v2-arc6-combat-champion-roster/v1',
      ownershipDigest,
      guardianProjectionDigest: guardians.digest,
    }))}`,
    ownershipDigest,
    guardianSourceDigest: guardians.sourceDigest,
    guardianOverlayDigest: guardians.overlayDigest,
    guardianProjectionDigest: guardians.digest,
    ownershipV2: input.ownershipV2,
    guardianAcquisitions: acquisition.state,
    guardianCompanions: overlay.state,
    champions,
  });
  ARC6_COMBAT_CHAMPION_ROSTERS.add(roster);
  return roster;
}

function registeredRosterFor(
  roster: Arc6CombatChampionRosterV1 | undefined,
  ownershipV2: OwnershipStateV2,
): roster is Arc6CombatChampionRosterV1 {
  return roster !== undefined
    && ARC6_COMBAT_CHAMPION_ROSTERS.has(roster)
    && roster.ownershipV2 === ownershipV2
    && roster.ownershipDigest === ownershipStateDigestV2(ownershipV2);
}

function championRosterRow(
  ownershipV2: OwnershipStateV2,
  roster: Arc6CombatChampionRosterV1 | undefined,
  championId: string,
): Arc6CombatChampionRosterRowV1 | null {
  if (roster !== undefined) {
    if (!registeredRosterFor(roster, ownershipV2)) return null;
    return roster.champions.find((row) => row.creature.creatureId === championId) ?? null;
  }
  const creature = ownershipV2.creatures.find((row) => row.creatureId === championId);
  return creature === undefined ? null : Object.freeze({ source: 'arc5', creature });
}

export interface Arc6CombatActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitCombatSettlement'>;
  readonly state: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly encounter: GuardianPrimeEncounterV1;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly ownershipV2: OwnershipStateV2;
  readonly championId: string;
  readonly championRosterAuthorityKey: string;
  readonly observedActivePlayMs: number;
  readonly codecNow: number;
  /** §20 (Nick 2026-09-25): the fighters in relay order with their stances, first = `championId`. Absent = today's single Balanced
   *  champion. More than one fighter is for Guardians and Titans only. Auto only until the Command open-encounter record lands. */
  readonly party?: readonly Readonly<{ championId: string; stance: EncounterStanceV1 }>[];
  /** §20 Command: settle the Command fight with these Break answers. When an open-encounter record exists the SEALED party and battle id
   *  are used (the live projection must still equal them) and the answers must be the appended ones plus at most the final one; with no
   *  record, only a fight that never reached a Break may settle (no answers). Absent = Auto. */
  readonly command?: Readonly<{ decisions: readonly EncounterDecisionV1[] }>;
}

export const ARC6_PARTY_MAX_V1 = 3;

export type Arc6CombatActionOutcomeV1 =
  | Readonly<{
    readonly kind: 'committed';
    readonly durability: 'committed';
    readonly convergence: 'none';
    readonly transaction: Extract<F4RuntimeCombatSettlementOutcome, { readonly kind: 'committed' }>;
    readonly verification: Extract<CombatSettlementVerificationOutcomeV1, { readonly kind: 'verified' }>;
  }>
  | Readonly<{
    readonly kind: 'committed-convergence';
    readonly durability: 'committed';
    readonly convergence: 'read-only-reload';
    readonly detail: string;
    readonly transaction: Extract<
      F4RuntimeCombatSettlementOutcome,
      { readonly kind: 'committed' | 'committed-convergence' }
    >;
  }>
  | Readonly<{
    readonly kind: 'refused';
    readonly durability: 'none';
    readonly convergence: 'none' | 'read-only-reload';
    readonly detail: string;
    readonly transaction: Exclude<
      F4RuntimeCombatSettlementOutcome,
      { readonly kind: 'committed' | 'committed-convergence' }
    > | null;
  }>;

function effectiveGenome(creature: CreatureInstanceV1): Readonly<Genome> {
  const genome: Record<string, unknown> = { ...creature.genome };
  if (creature.xp !== null) genome.xp = creature.xp;
  if (creature.hurt !== null) genome.hurt = creature.hurt;
  if (creature.fed !== null) genome.fed = creature.fed;
  if (creature.brood !== null) genome.brood = creature.brood;
  return Object.freeze(genome) as unknown as Genome;
}

function isLegacyBred(creature: CreatureInstanceV1): boolean {
  return creature.origin === 'bred'
    || creature.lineage.kind === 'legacy-parent-seeds'
    || creature.lineage.kind === 'parent-creatures';
}

export type Arc6CombatChampionAvailabilityV1 =
  | Readonly<{
    readonly kind: 'available';
    readonly activePlayMs: number;
  }>
  | Readonly<{
    readonly kind: 'blocked';
    readonly activePlayMs: number;
    readonly reason: 'mission-assigned' | 'recovery-active';
    readonly detail: string;
  }>
  | Readonly<{
    readonly kind: 'unavailable';
    readonly activePlayMs: number | null;
    readonly reason:
      | 'active-play-invalid'
      | 'ownership-unregistered'
      | 'guardian-authority-protected'
      | 'champion-missing';
    readonly detail: string;
  }>;

function recoveryTime(value: number): string {
  const seconds = Math.max(0, Math.ceil(value / 1_000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/** One shared player-live eligibility projection. Assignment is durable while
 * Recovery readiness is evaluated only against this exact F4 active-play
 * observation. Equality is ready by the domain projector's established law. */
export function projectArc6CombatChampionAvailabilityV1(input: Readonly<{
  readonly ownershipV2: OwnershipStateV2;
  readonly guardianRoster?: Arc6CombatChampionRosterV1;
  readonly championId: string;
  readonly observedActivePlayMs: number;
}>): Arc6CombatChampionAvailabilityV1 {
  let activePlayMs: number;
  try {
    activePlayMs = projectCompanionAvailabilityV1(
      Object.freeze({ assignment: null }),
      input.observedActivePlayMs,
    ).activePlayMs;
  } catch {
    return Object.freeze({
      kind: 'unavailable', activePlayMs: null, reason: 'active-play-invalid',
      detail: 'Combat active-play authority could not be verified.',
    });
  }
  if (!isOwnershipStateV2(input.ownershipV2)) {
    return Object.freeze({
      kind: 'unavailable', activePlayMs, reason: 'ownership-unregistered',
      detail: 'Creature ownership could not be verified for combat.',
    });
  }
  if (input.guardianRoster !== undefined
    && !registeredRosterFor(input.guardianRoster, input.ownershipV2)) {
    return Object.freeze({
      kind: 'unavailable', activePlayMs, reason: 'guardian-authority-protected',
      detail: 'Captured Guardian authority could not be verified for combat.',
    });
  }
  if (input.championId === ARC6_PLAYER_CHAMPION_ID) {
    return Object.freeze({ kind: 'available', activePlayMs });
  }
  const row = championRosterRow(
    input.ownershipV2,
    input.guardianRoster,
    input.championId,
  );
  if (row === null) {
    return Object.freeze({
      kind: 'unavailable', activePlayMs, reason: 'champion-missing',
      detail: 'That exact owned champion is no longer available.',
    });
  }
  if (row.source === 'guardian') {
    return Object.freeze({ kind: 'available', activePlayMs });
  }
  try {
    const availability = projectCompanionAvailabilityV1(row.creature, activePlayMs);
    if (!availability.blocks.combat) {
      return Object.freeze({ kind: 'available', activePlayMs });
    }
    if (availability.assignment?.kind === 'mission') {
      return Object.freeze({
        kind: 'blocked', activePlayMs, reason: 'mission-assigned',
        detail: 'Away on a companion mission; Breed, combat, and dispatch are locked.',
      });
    }
    return Object.freeze({
      kind: 'blocked', activePlayMs, reason: 'recovery-active',
      detail: `Recovery ${recoveryTime(availability.recoveryRemainingActivePlayMs)} active play remaining; Breed, combat, and dispatch are locked.`,
    });
  } catch {
    return Object.freeze({
      kind: 'unavailable', activePlayMs, reason: 'champion-missing',
      detail: 'That exact owned champion is no longer available.',
    });
  }
}

/** Project one exact current champion. The persistence owner rebinds this
 * projection to the same state before it can write. */
export function projectArc6CombatChampionV1(input: Readonly<{
  readonly state: SaveStateV2;
  readonly ownershipV2: OwnershipStateV2;
  readonly guardianRoster?: Arc6CombatChampionRosterV1;
  readonly championId: string;
}>): CombatSettlementChampionV1 | null {
  if (!isOwnershipStateV2(input.ownershipV2)) return null;
  if (input.championId === ARC6_PLAYER_CHAMPION_ID) {
    try { return projectLegacyPlayerSettlementChampionV1(input.state); }
    catch { return null; }
  }
  const row = championRosterRow(
    input.ownershipV2,
    input.guardianRoster,
    input.championId,
  );
  if (row === null) return null;
  const creature = row.creature;
  const genome = effectiveGenome(creature);
  let name: string;
  try { name = creature.nickname ?? describeSpecies(genome).name; }
  catch { return null; }
  return Object.freeze({
    kind: 'owned-fauna',
    creatureId: creature.creatureId,
    name,
    genome,
    legacyBredLineage: row.source === 'guardian' ? false : isLegacyBred(creature),
  });
}

function settledOutcome(transcript: ReturnType<typeof runDuel>): CombatSettlementOutcomeV1 {
  return transcript.winner === 'A' ? 'champion-win'
    : transcript.winner === 'B' ? 'defender-win' : 'draw';
}

function transactionDetail(
  outcome: Exclude<
    F4RuntimeCombatSettlementOutcome,
    { readonly kind: 'committed' | 'committed-convergence' }
  >,
): string {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') return `${outcome.kind}:${outcome.message}`;
  if (outcome.kind === 'protected') return `protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `lost:${outcome.reason}`;
  if (outcome.kind === 'refused') return `writer:${outcome.reason}`;
  return outcome.kind;
}

function needsReload(
  outcome: Exclude<
    F4RuntimeCombatSettlementOutcome,
    { readonly kind: 'committed' | 'committed-convergence' }
  >,
): boolean {
  return outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt' || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable' || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

export function arc6CombatOpenPolicyReasonV1(
  state: SaveStateV2,
  opportunity: WorldOpportunitySnapshot,
): string | null {
  try {
    const equipped = Object.entries(state.equip)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0)
      .map(([slot, baseId]) => ({ slot: slot as LegacyWornBase['slot'], baseId }));
    const imbue = resolveLegacyConquestImbuePlan({
      planetSeed: opportunity.source.planetSeed,
      worldTier: opportunity.effectiveTier,
      equipped,
    });
    return imbue.status === 'planned'
      ? 'this conquest would imbue equipped gear, whose v2 instance carrier is still an explicit design gate'
      : null;
  } catch {
    return 'equipped gear could not be verified for the exact conquest-affix policy';
  }
}

type Arc6Refusal = Extract<Arc6CombatActionOutcomeV1, { readonly kind: 'refused' }>;
const refusedV1 = (detail: string, convergence: 'none' | 'read-only-reload' = 'none'): Arc6Refusal => Object.freeze({
  kind: 'refused', durability: 'none', convergence, detail, transaction: null,
});

interface Arc6PreparedPartyV1 {
  readonly kind: 'prepared';
  readonly championRoster: Extract<Arc6CombatChampionRosterProjectionV1, { readonly kind: 'projected' }>;
  readonly activePlayMs: number;
  readonly partyChampions: readonly CombatSettlementChampionV1[];
  readonly partyMembers: readonly CombatPartyMemberInputV1[];
}

/** Every check a fight's party needs before it is planned or sealed: the roster authority, the open policy, each member available and
 *  projected exactly (the lead is `championId`), and the Guardians/Titans-only party rule. Shared by Auto, Command's seal and its settlement. */
function prepareArc6CombatPartyV1(
  input: Omit<Arc6CombatActionInputV1, 'runtime' | 'command'>,
): Arc6PreparedPartyV1 | Arc6Refusal {
  if (!input || typeof input !== 'object'
    || !isGuardianPrimeEncounterV1(input.encounter)
    || !isWorldOpportunitySnapshot(input.opportunity)
    || input.opportunity.address !== input.encounter.identity.world
    || !isOwnershipStateV2(input.ownershipV2)
    || typeof input.championId !== 'string'
    || typeof input.championRosterAuthorityKey !== 'string'
    || input.championRosterAuthorityKey.length < 1
    || typeof input.codecNow !== 'number' || !Number.isFinite(input.codecNow)) {
    return refusedV1('input:invalid-or-unregistered');
  }
  const championRoster = projectArc6CombatChampionRosterV1({
    ownershipV2: input.ownershipV2,
    extensions: input.extensions,
  });
  if (championRoster.kind !== 'projected') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: `champion-roster:${championRoster.reason}`, transaction: null,
    });
  }
  if (championRoster.authorityKey !== input.championRosterAuthorityKey) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'champion-roster:stale-or-forged', transaction: null,
    });
  }
  const openPolicy = arc6CombatOpenPolicyReasonV1(input.state, input.opportunity);
  if (openPolicy !== null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `policy:${openPolicy}`, transaction: null,
    });
  }
  const availability = projectArc6CombatChampionAvailabilityV1({
    ownershipV2: input.ownershipV2,
    guardianRoster: championRoster,
    championId: input.championId,
    observedActivePlayMs: input.observedActivePlayMs,
  });
  if (availability.kind !== 'available') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `champion:${availability.reason}`, transaction: null,
    });
  }
  const champion = projectArc6CombatChampionV1({
    state: input.state,
    ownershipV2: input.ownershipV2,
    guardianRoster: championRoster,
    championId: input.championId,
  });
  if (champion === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'champion:missing-or-stale', transaction: null,
    });
  }
  if (champion.kind === 'player' && champion.currentHp < Math.ceil(input.state.HP_MAX * 0.25)) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'champion:player-below-quarter-health', transaction: null,
    });
  }

  /* §20 party: every member is validated like the champion; the engine then names the DECISIVE fighter, whose loss-XP authority plans */
  const partyInput = input.party ?? [{ championId: input.championId, stance: 'balanced' as const }];
  if (!Array.isArray(partyInput) || partyInput.length < 1 || partyInput.length > ARC6_PARTY_MAX_V1
    || partyInput[0]!.championId !== input.championId
    || new Set(partyInput.map((m) => m.championId)).size !== partyInput.length) {
    return Object.freeze({ kind: 'refused', durability: 'none', convergence: 'none', detail: 'party:invalid', transaction: null });
  }
  if (partyInput.length > 1 && input.encounter.defender.kind !== 'guardian' && input.encounter.defender.kind !== 'titan') {
    return Object.freeze({ kind: 'refused', durability: 'none', convergence: 'none', detail: 'party:guardians-and-titans-only', transaction: null });
  }
  const partyChampions: CombatSettlementChampionV1[] = [champion];
  for (const member of partyInput.slice(1)) {
    const memberAvailability = projectArc6CombatChampionAvailabilityV1({
      ownershipV2: input.ownershipV2, guardianRoster: championRoster, championId: member.championId, observedActivePlayMs: input.observedActivePlayMs,
    });
    if (memberAvailability.kind !== 'available') {
      return Object.freeze({ kind: 'refused', durability: 'none', convergence: 'none', detail: `party-member:${memberAvailability.reason}`, transaction: null });
    }
    const memberChampion = projectArc6CombatChampionV1({ state: input.state, ownershipV2: input.ownershipV2, guardianRoster: championRoster, championId: member.championId });
    if (memberChampion === null) {
      return Object.freeze({ kind: 'refused', durability: 'none', convergence: 'none', detail: 'party-member:missing-or-stale', transaction: null });
    }
    if (memberChampion.kind === 'player' && memberChampion.currentHp < Math.ceil(input.state.HP_MAX * 0.25)) {
      return Object.freeze({ kind: 'refused', durability: 'none', convergence: 'none', detail: 'party-member:player-below-quarter-health', transaction: null });
    }
    partyChampions.push(memberChampion);
  }
  const partyMembers = partyChampions.map((c, index) => Object.freeze({ champion: c, stance: partyInput[index]!.stance }));
  const validatedClock = availability.activePlayMs;
  return Object.freeze({ kind: 'prepared', championRoster, activePlayMs: validatedClock, partyChampions, partyMembers });
}

/** One deterministic duel, one registered plan, one F3 CAS; a refusal is final (never re-attempted). */
export async function commitArc6CombatActionV1(
  input: Arc6CombatActionInputV1,
): Promise<Arc6CombatActionOutcomeV1> {
  if (!input || typeof input !== 'object') return refusedV1('input:invalid-or-unregistered');
  /* §20 Command: the open record (if any) supplies the SEALED party and battle id */
  let command: Readonly<{ decisions: readonly EncounterDecisionV1[]; record: CombatOpenEncounterRecordV1 | null }> | null = null;
  let partyRequest = input.party;
  if (input.command !== undefined) {
    const read = readCombatOpenEncounterV1(input.extensions);
    if (read.kind !== 'loaded') return refusedV1(`command:${read.reason}`, 'read-only-reload');
    const decisions = input.command?.decisions;
    if (!Array.isArray(decisions)) return refusedV1('command:decisions-invalid');
    if (read.record === null && decisions.length > 0) return refusedV1('command:no-open-encounter');
    if (read.record !== null) {
      if (!isGuardianPrimeEncounterV1(input.encounter) || read.record.encounterDigest !== sha256Hex(input.encounter.witness)) {
        return refusedV1('command:open-encounter-elsewhere');
      }
      partyRequest = read.record.party.map((m) => Object.freeze({
        championId: m.champion.kind === 'player' ? ARC6_PLAYER_CHAMPION_ID : m.champion.creatureId, stance: m.stance }));
      if (partyRequest[0]!.championId !== input.championId) return refusedV1('command:lead-mismatch');
    }
    command = Object.freeze({ decisions: Object.freeze([...decisions]), record: read.record });
  } else if (isOwnershipStateV2(input.ownershipV2)) {
    const read = readCombatOpenEncounterV1(input.extensions);
    if (read.kind !== 'loaded') return refusedV1(`command:${read.reason}`, 'read-only-reload');
    if (read.record !== null) return refusedV1('command:open-encounter-must-be-answered');
  }
  const prepared = prepareArc6CombatPartyV1({ ...input, ...(partyRequest === undefined ? {} : { party: partyRequest }) });
  if (prepared.kind !== 'prepared') return prepared;
  const { championRoster, partyChampions, partyMembers } = prepared;
  const champion = partyChampions[0]!;
  const availability = Object.freeze({ activePlayMs: prepared.activePlayMs });
  if (command?.record != null) {
    // the live projection must still be exactly the sealed fighters (the record holds them; anything else is another fight)
    const live = canonicalJson(partyMembers.map((m) => ({ champion: m.champion, stance: m.stance })));
    const sealed = canonicalJson(command.record.party.map((m) => ({ champion: m.champion, stance: m.stance })));
    if (live !== sealed) return refusedV1('command:party-changed-since-sealed', 'read-only-reload');
  }
  const mode = command === null ? 'auto' as const : 'command' as const;
  const decisions = command?.decisions ?? [];
  // D17: a Guardian/Titan (phase) fight never takes the phase-less legacy path, even solo Balanced Auto
  const legacySingle = mode === 'auto' && partyMembers.length === 1 && partyMembers[0]!.stance === 'balanced' && !encounterHasGuardianPhaseV1(input.encounter.defender.kind);
  let decisiveIndex = 0;
  if (!legacySingle) {
    try {
      const probe = runEncounterV1({ mode, defender: { name: input.encounter.defender.name, genome: input.encounter.defender.battleGenome as never,
        phase: encounterHasGuardianPhaseV1(input.encounter.defender.kind) },
        party: partyMembers.map((m) => (m.champion.kind === 'player'
          ? { name: m.champion.name, genome: { seed: m.champion.genomeSeed }, stats: m.champion.stats as never, stance: m.stance }
          : { name: m.champion.name, genome: m.champion.genome as never, stance: m.stance })) }, decisions);
      if (probe.status !== 'finished' || probe.decisionsUsed !== decisions.length) throw new Error('encounter paused');
      decisiveIndex = probe.legs[probe.legs.length - 1]!.fighterIndex;
    } catch {
      return refusedV1(command === null ? 'party:encounter-invalid' : 'command:answers-do-not-finish-the-fight');
    }
  }
  const decisiveChampion = partyChampions[decisiveIndex]!;

  let lossXp: ReturnType<typeof projectCombatLossXpAuthorityV1> | null = null;
  if (decisiveChampion.kind === 'owned-fauna') {
    const row = championRosterRow(
      input.ownershipV2,
      championRoster,
      decisiveChampion.creatureId,
    );
    if (row === null) {
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: 'read-only-reload',
        detail: 'champion-roster:champion-detached', transaction: null,
      });
    }
    lossXp = row.source === 'arc5'
      ? projectCombatLossXpAuthorityV1({
        state: input.state,
        extensions: input.extensions,
        ownership: input.ownershipV2,
        creature: row.creature,
        worldKey: input.encounter.identity.world.key,
        planetSeed: input.encounter.identity.world.planet.seed,
      })
      : projectGuardianCombatLossXpAuthorityV1({
        state: input.state,
        extensions: input.extensions,
        guardianAcquisitions: championRoster.guardianAcquisitions,
        guardianCompanions: championRoster.guardianCompanions,
        creature: row.creature,
        worldKey: input.encounter.identity.world.key,
        planetSeed: input.encounter.identity.world.planet.seed,
      });
    if (lossXp.kind !== 'ready') {
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: 'read-only-reload',
        detail: `loss-xp:${lossXp.reason}`, transaction: null,
      });
    }
  }

  const receipt = planF4DeterministicProductReceipt(
    input.extensions,
    COMBAT_SETTLEMENT_OPERATION_V1,
  );
  if (receipt.kind !== 'planned') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: `receipt:${receipt.reason}`, transaction: null,
    });
  }

  const settlementAuthority = Object.freeze({
    worldConquered: false,
    claimedPrimeSignatureIds: input.encounter.identity.claimedSignatureIds,
    lossXp: lossXp?.kind === 'ready' ? lossXp.authority : null,
    activePlayMs: availability.activePlayMs,   // §20: a defeat's Recovery ends on the active-play clock
  });
  const battleId = command?.record?.battleId ?? `arc6:${sha256Hex(input.encounter.witness)}:${receipt.plan.receiptOrdinal}`;
  let plan: ReturnType<typeof planCombatSettlementV1>;
  if (legacySingle) {
    const mine = champion.kind === 'player'
      ? { name: champion.name, genome: { seed: champion.genomeSeed }, stats: champion.stats }
      : { name: champion.name, genome: champion.genome as Genome };
    const transcript = runDuel(mine, {
      name: input.encounter.defender.name,
      genome: input.encounter.defender.battleGenome as Genome,
    });
    const outcome = settledOutcome(transcript);
    plan = planCombatSettlementV1({
      battleId,
      receiptOrdinal: receipt.plan.receiptOrdinal,
      encounter: input.encounter,
      champion,
      transcript,
      outcome,
      worldTier: input.opportunity.effectiveTier,
      authority: settlementAuthority,
    });
  } else {
    plan = planCombatPartySettlementV1({
      battleId,
      receiptOrdinal: receipt.plan.receiptOrdinal,
      encounter: input.encounter,
      worldTier: input.opportunity.effectiveTier,
      authority: settlementAuthority,
      mode,
      party: partyMembers,
      decisions,
    });
  }
  if (plan.status !== 'planned') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `plan:${plan.reason}`, transaction: null,
    });
  }

  let brinkAchievementJoin: CombatSettlementBrinkAchievementJoinV1 | null = null;
  const settlesBrink = plan.champion.kind === 'player'
    && plan.injury.status === 'damage-player'
    && plan.injury.hpAfter >= 1
    && plan.injury.hpAfter < 20;
  if (settlesBrink) {
    const join = prepareArc9EventAchievementJoinV1(input.state, 'brink');
    if (join.kind !== 'prepared') {
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: 'none',
        detail: `achievement:${join.reason}`, transaction: null,
      });
    }
    if (join.achievementId !== 'brink' || join.owner !== 'survival:below-twenty-hp') {
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: 'none',
        detail: 'achievement:event-achievement-unsupported', transaction: null,
      });
    }
    brinkAchievementJoin = Object.freeze({
      kind: 'prepared',
      achievementId: 'brink',
      owner: 'survival:below-twenty-hp',
      added: join.added,
      priorUnlockedCount: join.priorUnlockedCount,
      nextUnlockedIds: join.nextUnlockedIds,
    });
  }

  let transaction: F4RuntimeCombatSettlementOutcome;
  try {
    transaction = await input.runtime.commitCombatSettlement({
      state: input.state,
      codecNow: input.codecNow,
      plan,
      opportunity: input.opportunity,
      ownershipV2: partyChampions.some((c) => c.kind === 'owned-fauna')
        || plan.guardianCapture.status === 'ownership-writer-required'
        ? input.ownershipV2 : null,
      brinkAchievementJoin,
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: `transaction:threw:${error instanceof Error ? error.message : String(error)}`,
      transaction: null,
    });
  }
  if (transaction.kind === 'committed-convergence') {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
      detail: transaction.reason, transaction,
    });
  }
  if (transaction.kind !== 'committed') {
    return Object.freeze({
      kind: 'refused', durability: 'none',
      convergence: needsReload(transaction) ? 'read-only-reload' : 'none',
      detail: transactionDetail(transaction), transaction,
    });
  }
  const verification = verifyCommittedCombatSettlementV1({
    committed: transaction,
    revision: transaction.transaction.revision,
    writable: {
      state: transaction.transaction.saved.canonicalState,
      extensions: transaction.transaction.saved.extensions,
    },
    receipt: transaction.transaction.receipt,
  });
  if (verification.kind !== 'verified') {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
      detail: `verification:${verification.reason}`, transaction,
    });
  }
  if (settlesBrink) {
    const progression = projectArc9ProgressionStateV1(verification.state);
    if (progression.kind !== 'projected'
      || verification.brinkAchievement === null
      || verification.brinkAchievement.added !== brinkAchievementJoin?.added
      || progression.projection.achievements.rows.find(({ id }) => id === 'brink')?.status
        !== 'unlocked') {
      return Object.freeze({
        kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
        detail: 'verification:brink-achievement-projection', transaction,
      });
    }
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none',
    transaction, verification,
  });
}

/* ---------- §20 Command: seal, answer, resume ---------- */

export type Arc6CommandActionOutcomeV1 =
  | Readonly<{ kind: 'committed'; record: CombatOpenEncounterRecordV1; result: EncounterResultV1; revision: number }>
  /** The fight never reaches a Break: there is nothing to command, so it settles directly (Command, no answers). */
  | Readonly<{ kind: 'no-break' }>
  | Readonly<{ kind: 'refused'; detail: string; convergence: 'none' | 'read-only-reload' }>;

const commandRefused = (detail: string, convergence: 'none' | 'read-only-reload' = 'none'): Arc6CommandActionOutcomeV1 =>
  Object.freeze({ kind: 'refused', detail, convergence });

function commandActionOutcome(transaction: F4RuntimeActionCommitOutcome, expectedSeal: string): Arc6CommandActionOutcomeV1 {
  if (transaction.kind !== 'committed') {
    const detail = transaction.kind === 'rejected' ? `transaction:rejected:${transaction.message}` : `transaction:${transaction.kind}`;
    const reload = transaction.kind === 'stale' || transaction.kind === 'lost' || transaction.kind === 'duplicate-receipt'
      || transaction.kind === 'revision-exhausted' || transaction.kind === 'storage-error' || transaction.kind === 'protected';
    return commandRefused(detail, reload ? 'read-only-reload' : 'none');
  }
  const read = readCombatOpenEncounterV1(transaction.saved.extensions);
  if (read.kind !== 'loaded' || read.record === null || read.record.sealDigest !== expectedSeal) {
    return commandRefused('verification:open-encounter-fixed-point', 'read-only-reload');
  }
  return Object.freeze({ kind: 'committed', record: read.record, result: simulateCombatOpenEncounterV1(read.record), revision: transaction.revision });
}

/** Seal a Command fight in its own Recovery-free receipt (Guardians/Titans only). Refusals are decided on the exact current extensions
 *  BEFORE any write; the commit re-derives inside the same F4/F3 CAS. */
export async function openArc6CommandEncounterV1(
  input: Omit<Arc6CombatActionInputV1, 'runtime' | 'command'> & Readonly<{ runtime: Pick<F4RuntimeAuthority, 'commitAction'> }>,
): Promise<Arc6CommandActionOutcomeV1> {
  if (!input || typeof input !== 'object' || !isGuardianPrimeEncounterV1(input.encounter)) return commandRefused('input:invalid-or-unregistered');
  if (input.encounter.defender.kind !== 'guardian' && input.encounter.defender.kind !== 'titan') {
    return commandRefused('command:guardians-and-titans-only');
  }
  const read = readCombatOpenEncounterV1(input.extensions);
  if (read.kind !== 'loaded') return commandRefused(`command:${read.reason}`, 'read-only-reload');
  if (read.record !== null) return commandRefused('command:already-open');
  const prepared = prepareArc6CombatPartyV1(input);
  if (prepared.kind !== 'prepared') return commandRefused(prepared.detail, prepared.convergence);
  /* the explorer's health moves between Breaks, and the settlement binds it exactly: a sealed explorer could strand the record (even
     Withdraw settles through the same binding), so the explorer fights Guardians in Auto only */
  if (prepared.partyChampions.some((c) => c.kind === 'player')) return commandRefused('command:explorer-fights-in-auto-only');
  const receipt = planF4DeterministicProductReceipt(input.extensions, COMBAT_OPEN_ENCOUNTER_OPEN_OPERATION_V1);
  if (receipt.kind !== 'planned') return commandRefused(`receipt:${receipt.reason}`, 'read-only-reload');
  const battleIdAt = (ordinal: number): string => `arc6:${sha256Hex(input.encounter.witness)}:${ordinal}`;
  const derive = (draft: SaveStateV2, extensions: V5Extensions, receiptOrdinal: number) => deriveCombatOpenEncounterOpenV1({
    draft, extensions, receiptOrdinal, battleId: battleIdAt(receiptOrdinal), encounter: input.encounter, party: prepared.partyMembers,
  });
  let expectedSeal: string;
  try {
    const dry = derive(input.state, input.extensions, receipt.plan.receiptOrdinal);
    const write = dry.extensionWrites![0]!;
    const sealed = readCombatOpenEncounterV1({ ...input.extensions, player: { ...input.extensions.player, [write.namespace]: write.carrier } });
    if (sealed.kind !== 'loaded' || sealed.record === null) return commandRefused('command:seal-unreadable');
    expectedSeal = sealed.record.sealDigest;
  } catch (error) {
    if (error instanceof CombatOpenEncounterRefusal) {
      return error.reason === 'no-break' ? Object.freeze({ kind: 'no-break' }) : commandRefused(`command:${error.reason}`);
    }
    return commandRefused('command:seal-invalid');
  }
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await input.runtime.commitAction({
      state: input.state, operation: COMBAT_OPEN_ENCOUNTER_OPEN_OPERATION_V1, receiptKind: COMBAT_OPEN_ENCOUNTER_OPEN_OPERATION_V1,
      codecNow: input.codecNow, derive: ({ draft, extensions, receiptOrdinal }) => derive(draft, extensions, receiptOrdinal),
    });
  } catch (error) {
    return commandRefused(`transaction:threw:${error instanceof Error ? error.message : String(error)}`, 'read-only-reload');
  }
  return commandActionOutcome(transaction, expectedSeal);
}

/** Append one Break answer (Hold / Swap / Withdraw) by CAS on the decision count the player saw. The FINAL answer is not appended here:
 *  it rides the settlement (`commitArc6CombatActionV1` with `command`), so a finished fight always settles in one receipt. */
export async function decideArc6CommandEncounterV1(input: Readonly<{
  runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  state: SaveStateV2;
  extensions: V5Extensions;
  battleId: string;
  expectedDecisions: number;
  decision: EncounterDecisionV1;
  codecNow: number;
}>): Promise<Arc6CommandActionOutcomeV1> {
  const read = readCombatOpenEncounterV1(input.extensions);
  if (read.kind !== 'loaded') return commandRefused(`command:${read.reason}`, 'read-only-reload');
  if (read.record === null) return commandRefused('command:not-open');
  const derive = (draft: SaveStateV2, extensions: V5Extensions) => deriveCombatOpenEncounterDecisionV1({
    draft, extensions, battleId: input.battleId, expectedDecisions: input.expectedDecisions, decision: input.decision,
  });
  try {
    derive(input.state, input.extensions);
  } catch (error) {
    return commandRefused(error instanceof CombatOpenEncounterRefusal ? `command:${error.reason}` : 'command:decision-invalid');
  }
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await input.runtime.commitAction({
      state: input.state, operation: COMBAT_OPEN_ENCOUNTER_DECIDE_OPERATION_V1, receiptKind: COMBAT_OPEN_ENCOUNTER_DECIDE_OPERATION_V1,
      codecNow: input.codecNow, derive: ({ draft, extensions }) => derive(draft, extensions),
    });
  } catch (error) {
    return commandRefused(`transaction:threw:${error instanceof Error ? error.message : String(error)}`, 'read-only-reload');
  }
  return commandActionOutcome(transaction, read.record.sealDigest);
}

/** What the card shows about an open Command fight, re-simulated from the durable record (a reload lands on the same Break). */
export type Arc6CommandBreakViewV1 =
  | Readonly<{ kind: 'none' }>
  | Readonly<{ kind: 'protected'; reason: string }>
  | Readonly<{ kind: 'elsewhere'; defenderName: string }>
  | Readonly<{ kind: 'pending'; record: CombatOpenEncounterRecordV1; leadId: string; battleId: string; decisionsSoFar: number;
      /** null = every answer is appended but the settlement never landed (e.g. the tab closed): it settles with no further answer */
      breakKind: 'low-hp' | 'next-fighter' | 'phase' | null; fighterName: string; fighterHp: number; fighterMax: number;
      defenderName: string; defenderHp: number; defenderMax: number; nextName: string | null;
      options: readonly EncounterDecisionV1[] }>;

export function projectArc6CommandBreakV1(extensions: V5Extensions, encounter: GuardianPrimeEncounterV1 | null): Arc6CommandBreakViewV1 {
  const read = readCombatOpenEncounterV1(extensions);
  if (read.kind !== 'loaded') return Object.freeze({ kind: 'protected', reason: read.reason });
  const record = read.record;
  if (record === null) return Object.freeze({ kind: 'none' });
  if (encounter === null || !isGuardianPrimeEncounterV1(encounter) || record.encounterDigest !== sha256Hex(encounter.witness)) {
    return Object.freeze({ kind: 'elsewhere', defenderName: record.defenderName });
  }
  const result = simulateCombatOpenEncounterV1(record);
  const lead = record.party[0]!.champion;
  const leadId = lead.kind === 'player' ? ARC6_PLAYER_CHAMPION_ID : lead.creatureId;
  if (result.status !== 'paused') {
    return Object.freeze({ kind: 'pending', record, leadId, battleId: record.battleId, decisionsSoFar: record.decisions.length,
      breakKind: null, fighterName: '', fighterHp: 0, fighterMax: 0, defenderName: record.defenderName,
      defenderHp: result.defenderHp, defenderMax: result.defenderMax, nextName: null, options: Object.freeze([]) });
  }
  const b = result.pendingBreak;
  return Object.freeze({
    kind: 'pending', record, leadId, battleId: record.battleId, decisionsSoFar: record.decisions.length, breakKind: b.kind,
    fighterName: record.party[b.fighterIndex]!.champion.name, fighterHp: Math.max(0, b.fighterHp), fighterMax: b.fighterMax,
    defenderName: record.defenderName, defenderHp: b.defenderHp, defenderMax: b.defenderMax,
    nextName: b.nextIndex === null ? null : record.party[b.nextIndex]!.champion.name, options: b.options,
  });
}

/** Whether answering `decision` now FINISHES the fight (then it rides the settlement instead of its own append). */
export function arc6CommandAnswerFinishesV1(record: CombatOpenEncounterRecordV1, decision: EncounterDecisionV1): boolean {
  try { return simulateCombatOpenEncounterV1(record, [...record.decisions, decision]).status === 'finished'; } catch { return false; }
}
