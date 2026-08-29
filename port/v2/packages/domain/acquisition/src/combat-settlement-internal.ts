/* Arc 6 ownership-side combat settlement bridge.

   The combat planner owns the immutable encounter/transcript outcome. This
   narrow internal bridge proves that its owned champion is the exact current
   Arc 5 creature, then mints the one registered ownership successor needed by
   persistence. Guardian capture is owned by the separate registered Arc 6
   acquisition carrier; this bridge remains responsible only for the current
   champion's XP, injury, or tombstone. */
import {
  COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
  isCombatSettlementPlanV1,
  type CombatSettlementPlanV1,
} from '@cf/domain-combatcore';
import {
  MAX_OWNERSHIP_REVISION,
  canonicalGenomeIdentityV1,
  type CreatureInstanceV1,
} from './model.js';
import { canonicalJson, sha256Hex } from './canonical.js';
import {
  createCreatureInstanceV2,
  createCreatureTombstoneV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  isOwnershipStateV2,
  ownershipSourceStateV1,
  ownershipStateDigestV2,
  type CreatureTombstoneV2,
  type F4ReceiptEvidenceV2,
  type OwnershipStateV2,
} from './model-v2.js';

export const ARC6_COMBAT_OWNERSHIP_SCHEMA_V1 = 'cf-v2-arc6-combat-ownership/v1' as const;
export const ARC6_COMBAT_ACTION_KIND_V1 = COMBAT_SETTLEMENT_RECEIPT_KIND_V1;

export type Arc6CombatOwnershipRefusalReasonV1 =
  | 'plan-unregistered'
  | 'ownership-invalid'
  | 'ownership-protected'
  | 'ownership-revision-exhausted'
  | 'champion-not-found'
  | 'champion-source-mismatch'
  | 'champion-lineage-mismatch'
  | 'champion-xp-unrepresentable'
  | 'settlement-shape-mismatch';

export interface Arc6CombatOwnershipSettlementV1 {
  readonly schema: typeof ARC6_COMBAT_OWNERSHIP_SCHEMA_V1;
  readonly parentRevision: number;
  readonly parentDigest: string;
  readonly receiptEvidence: F4ReceiptEvidenceV2;
  readonly creatureBefore: CreatureInstanceV1;
  readonly creatureAfter: CreatureInstanceV1 | null;
  readonly creatureTombstone: CreatureTombstoneV2 | null;
  readonly successor: OwnershipStateV2;
  readonly successorDigest: string;
}

export type Arc6CombatOwnershipPreparationV1 =
  | Readonly<{ readonly kind: 'not-applicable'; readonly reason: 'player-champion' }>
  | Readonly<{ readonly kind: 'prepared'; readonly settlement: Arc6CombatOwnershipSettlementV1 }>
  | Readonly<{ readonly kind: 'refused'; readonly reason: Arc6CombatOwnershipRefusalReasonV1 }>;

function refused(reason: Arc6CombatOwnershipRefusalReasonV1): Arc6CombatOwnershipPreparationV1 {
  return Object.freeze({ kind: 'refused', reason });
}

function mutableNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isLegacyBred(row: CreatureInstanceV1): boolean {
  return row.origin === 'bred'
    || row.lineage.kind === 'legacy-parent-seeds'
    || row.lineage.kind === 'parent-creatures';
}

function sameChampionSource(
  row: CreatureInstanceV1,
  plan: CombatSettlementPlanV1,
): boolean {
  if (plan.champion.kind !== 'owned-fauna') return false;
  try {
    const identity = canonicalGenomeIdentityV1(plan.champion.genome);
    return row.creatureId === plan.champion.creatureId
      && row.speciesId === identity.speciesId
      && row.genomeIdentity === identity.genomeIdentity
      && canonicalJson(row.genome) === canonicalJson(identity.genome)
      && (row.xp ?? 0) === mutableNumber(plan.champion.genome.xp)
      && (row.hurt ?? 0) === mutableNumber(plan.champion.genome.hurt);
  } catch {
    return false;
  }
}

function combatXpDelta(plan: CombatSettlementPlanV1): number | null {
  if (plan.champion.kind !== 'owned-fauna') return 0;
  if (plan.xp.status === 'award') return plan.xp.amount;
  if (plan.xp.status === 'loss-target') return plan.xp.totalDelta;
  if (plan.xp.status === 'protected-unsupported') return 0;
  return null;
}

/** Bind one registered combat plan to one registered current ownership state.
 * No successor is minted for the player. Guardian/Titan capture is prepared
 * independently and joined by the persistence owner in the same F3 CAS. */
export function prepareArc6CombatOwnershipV1(
  parent: OwnershipStateV2,
  plan: CombatSettlementPlanV1,
): Arc6CombatOwnershipPreparationV1 {
  if (!isCombatSettlementPlanV1(plan)) return refused('plan-unregistered');
  if (!isOwnershipStateV2(parent)) return refused('ownership-invalid');
  if (parent.mode !== 'current') return refused('ownership-protected');
  if (plan.champion.kind === 'player') {
    return Object.freeze({ kind: 'not-applicable', reason: 'player-champion' });
  }
  const champion = plan.champion;
  if (parent.revision === MAX_OWNERSHIP_REVISION) {
    return refused('ownership-revision-exhausted');
  }
  const creature = parent.creatures.find((row) => row.creatureId === champion.creatureId);
  if (creature === undefined) return refused('champion-not-found');
  if (!sameChampionSource(creature, plan)) return refused('champion-source-mismatch');
  if (isLegacyBred(creature) !== champion.legacyBredLineage) {
    return refused('champion-lineage-mismatch');
  }
  const xpDelta = combatXpDelta(plan);
  if (xpDelta === null) return refused('settlement-shape-mismatch');
  const xpBefore = creature.xp ?? 0;
  const xpAfter = xpBefore + xpDelta;
  if (!Number.isSafeInteger(xpAfter) || xpAfter < 0 || xpAfter > 486) {
    return refused('champion-xp-unrepresentable');
  }

  let hurtAfter = creature.hurt;
  let remove = false;
  if (plan.injury.status === 'set-hurt') {
    if (plan.injury.creatureId !== creature.creatureId
      || plan.injury.hurtBefore !== (creature.hurt ?? 0)) {
      return refused('settlement-shape-mismatch');
    }
    hurtAfter = plan.injury.hurtAfter;
  } else if (plan.injury.status === 'remove-creature') {
    if (plan.injury.creatureId !== creature.creatureId) {
      return refused('settlement-shape-mismatch');
    }
    remove = true;
  } else if (plan.injury.status !== 'none') {
    return refused('settlement-shape-mismatch');
  }
  if ((plan.xp.status === 'award' || plan.xp.status === 'loss-target'
      || plan.xp.status === 'protected-unsupported')
    && plan.xp.creatureId !== creature.creatureId) {
    return refused('settlement-shape-mismatch');
  }

  try {
    const receiptEvidence = createF4ReceiptEvidenceV2({
      ordinal: plan.receiptOrdinal,
      actionKind: ARC6_COMBAT_ACTION_KIND_V1,
      witnessDigest: sha256Hex(plan.witness),
    });
    /* A fatal loss awards its legacy lesson immediately before removing the
       creature. That XP has no surviving live v4 row; retain the exact
       pre-action last-live snapshot in the tombstone and the durable lesson
       target in the persistence ledger. */
    const creatureAfter = remove ? null : createCreatureInstanceV2({
      ...creature,
      xp: xpAfter,
      hurt: hurtAfter,
    });
    const creatureTombstone = remove
      ? createCreatureTombstoneV2(creature, receiptEvidence)
      : null;
    const successor = createOwnershipSuccessorV2(parent, {
      source: ownershipSourceStateV1(parent),
      bredAcquisitions: parent.bredAcquisitions,
      creatures: remove
        ? parent.creatures.filter((row) => row.creatureId !== creature.creatureId)
        : parent.creatures.map((row) => (
          row.creatureId === creature.creatureId ? creatureAfter! : row
        )),
      creatureTombstones: creatureTombstone === null
        ? parent.creatureTombstones
        : [...parent.creatureTombstones, creatureTombstone],
      specimenLots: parent.specimenLots,
      specimenTombstones: parent.specimenTombstones,
      scoutCreatureId: remove && parent.scoutCreatureId === creature.creatureId
        ? null : parent.scoutCreatureId,
    });
    const settlement: Arc6CombatOwnershipSettlementV1 = Object.freeze({
      schema: ARC6_COMBAT_OWNERSHIP_SCHEMA_V1,
      parentRevision: parent.revision,
      parentDigest: ownershipStateDigestV2(parent),
      receiptEvidence,
      creatureBefore: creature,
      creatureAfter,
      creatureTombstone,
      successor,
      successorDigest: ownershipStateDigestV2(successor),
    });
    return Object.freeze({ kind: 'prepared', settlement });
  } catch {
    return refused('settlement-shape-mismatch');
  }
}
