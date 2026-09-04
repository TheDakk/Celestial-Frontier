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
  planCombatSettlementV1,
  runDuel,
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
}

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
  if (state.chacc.includes('wk-conq')) {
    return 'accepted weekly conquest Charter has no v2 weekly lifecycle owner';
  }
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

/** One deterministic duel, one registered plan, one F3 CAS, no retry. */
export async function commitArc6CombatActionV1(
  input: Arc6CombatActionInputV1,
): Promise<Arc6CombatActionOutcomeV1> {
  if (!input || typeof input !== 'object'
    || !isGuardianPrimeEncounterV1(input.encounter)
    || !isWorldOpportunitySnapshot(input.opportunity)
    || input.opportunity.address !== input.encounter.identity.world
    || !isOwnershipStateV2(input.ownershipV2)
    || typeof input.championId !== 'string'
    || typeof input.championRosterAuthorityKey !== 'string'
    || input.championRosterAuthorityKey.length < 1
    || typeof input.codecNow !== 'number' || !Number.isFinite(input.codecNow)) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
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

  let lossXp: ReturnType<typeof projectCombatLossXpAuthorityV1> | null = null;
  if (champion.kind === 'owned-fauna') {
    const row = championRosterRow(
      input.ownershipV2,
      championRoster,
      champion.creatureId,
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

  const mine = champion.kind === 'player'
    ? { name: champion.name, genome: { seed: champion.genomeSeed }, stats: champion.stats }
    : { name: champion.name, genome: champion.genome as Genome };
  const transcript = runDuel(mine, {
    name: input.encounter.defender.name,
    genome: input.encounter.defender.battleGenome as Genome,
  });
  const outcome = settledOutcome(transcript);
  const plan = planCombatSettlementV1({
    battleId: `arc6:${sha256Hex(input.encounter.witness)}:${receipt.plan.receiptOrdinal}`,
    receiptOrdinal: receipt.plan.receiptOrdinal,
    encounter: input.encounter,
    champion,
    transcript,
    outcome,
    worldTier: input.opportunity.effectiveTier,
    authority: Object.freeze({
      worldConquered: false,
      claimedPrimeSignatureIds: input.encounter.identity.claimedSignatureIds,
      lossXp: lossXp?.kind === 'ready' ? lossXp.authority : null,
    }),
  });
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
      ownershipV2: champion.kind === 'owned-fauna'
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
