/* Exact-instance Scout consequence for one hostile bioscan.

   V2 bioscans are nonlethal: the designated Scout intercepts the field wound
   and reaches Critical (0.85) at worst. This owner never deletes a companion,
   mutates the explorer, draws RNG, or records the surveyed world. */
import {
  MAX_OWNERSHIP_REVISION,
  type CreatureInstanceV1,
} from './model.js';
import {
  LAST_USABLE_F4_RECEIPT_ORDINAL_V2,
  createCreatureInstanceV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  isOwnershipStateV2,
  ownershipSourceStateV1,
  ownershipStateDigestV2,
  type F4ReceiptEvidenceV2,
  type OwnershipStateV2,
} from './model-v2.js';
import { canonicalJson, sha256Hex } from './canonical.js';

export const ARC5_BIOSCAN_ACTION_KIND_V1 = 'hostile-bioscan' as const;
export const ARC5_BIOSCAN_CRITICAL_HURT_V1 = 0.85;

export type Arc5BioscanPreflightRefusalV1 =
  | 'ownership-invalid' | 'ownership-protected' | 'ownership-revision-exhausted'
  | 'scout-not-found' | 'scout-hurt-unsupported';

export interface Arc5BioscanPreflightV1 {
  readonly schema: 'cf-v2-arc5-bioscan-preflight/v1';
  readonly parentRevision: number;
  readonly parentDigest: string;
  readonly scoutBefore: CreatureInstanceV1 | null;
}

export type Arc5BioscanPreflightOutcomeV1 =
  | Readonly<{ kind: 'ready'; preflight: Arc5BioscanPreflightV1 }>
  | Readonly<{ kind: 'refused'; reason: Arc5BioscanPreflightRefusalV1 }>;

export interface Arc5BioscanSettlementV1 {
  readonly schema: 'cf-v2-arc5-bioscan-settlement/v1';
  readonly preflight: Arc5BioscanPreflightV1;
  readonly hostile: boolean;
  readonly damage: number;
  readonly target: 'clear' | 'explorer' | 'scout';
  readonly scoutAfter: CreatureInstanceV1 | null;
  readonly successor: OwnershipStateV2 | null;
  readonly receiptEvidence: F4ReceiptEvidenceV2;
  readonly witness: string;
}

const PREFLIGHTS = new WeakMap<object, OwnershipStateV2>();

function refused(reason: Arc5BioscanPreflightRefusalV1): Arc5BioscanPreflightOutcomeV1 {
  return Object.freeze({ kind: 'refused', reason });
}

export function preflightArc5BioscanV1(parent: OwnershipStateV2): Arc5BioscanPreflightOutcomeV1 {
  if (!isOwnershipStateV2(parent)) return refused('ownership-invalid');
  if (parent.mode !== 'current') return refused('ownership-protected');
  const scoutBefore = parent.scoutCreatureId === null ? null
    : parent.creatures.find(({ creatureId }) => creatureId === parent.scoutCreatureId) ?? null;
  if (parent.scoutCreatureId !== null && scoutBefore === null) return refused('scout-not-found');
  if ((scoutBefore?.hurt ?? 0) > ARC5_BIOSCAN_CRITICAL_HURT_V1) {
    return refused('scout-hurt-unsupported');
  }
  if (scoutBefore !== null && parent.revision === MAX_OWNERSHIP_REVISION) {
    return refused('ownership-revision-exhausted');
  }
  const preflight = Object.freeze({
    schema: 'cf-v2-arc5-bioscan-preflight/v1' as const,
    parentRevision: parent.revision,
    parentDigest: ownershipStateDigestV2(parent),
    scoutBefore,
  });
  PREFLIGHTS.set(preflight, parent);
  return Object.freeze({ kind: 'ready', preflight });
}

export function settleArc5BioscanV1(
  preflight: Arc5BioscanPreflightV1,
  hostile: boolean,
  damage: number,
  receiptOrdinal: number,
  worldKey: string,
): Arc5BioscanSettlementV1 {
  const parent = preflight && typeof preflight === 'object' ? PREFLIGHTS.get(preflight) : undefined;
  if (parent === undefined) throw new TypeError('bioscan preflight must be owner-minted');
  if (typeof hostile !== 'boolean' || !Number.isSafeInteger(damage)
    || damage < 0 || damage > 1_000_000 || (hostile ? damage < 1 : damage !== 0)
    || !Number.isSafeInteger(receiptOrdinal) || receiptOrdinal < 0
    || receiptOrdinal > LAST_USABLE_F4_RECEIPT_ORDINAL_V2
    || typeof worldKey !== 'string' || worldKey.length === 0 || worldKey.length > 2_048) {
    throw new TypeError('bioscan settlement consequence is invalid');
  }
  const scoutAfter = hostile && preflight.scoutBefore !== null
    ? createCreatureInstanceV2({
      ...preflight.scoutBefore,
      hurt: Math.min(
        ARC5_BIOSCAN_CRITICAL_HURT_V1,
        (preflight.scoutBefore.hurt ?? 0)
          + Math.min(0.6, Math.max(0.12, damage / 80)),
      ),
    })
    : null;
  const successor = scoutAfter === null ? null : createOwnershipSuccessorV2(parent, {
    source: ownershipSourceStateV1(parent),
    bredAcquisitions: parent.bredAcquisitions,
    creatures: parent.creatures.map((creature) => creature.creatureId === scoutAfter.creatureId
      ? scoutAfter : creature),
    creatureTombstones: parent.creatureTombstones,
    specimenLots: parent.specimenLots,
    specimenTombstones: parent.specimenTombstones,
    scoutCreatureId: parent.scoutCreatureId,
  });
  const target = !hostile ? 'clear' : scoutAfter === null ? 'explorer' : 'scout';
  const witness = canonicalJson({
    schema: 'cf-v2-arc5-bioscan-witness/v1', worldKey, hostile, damage, target,
    receiptOrdinal, parentDigest: preflight.parentDigest,
    successorDigest: successor === null ? null : ownershipStateDigestV2(successor),
    scoutId: preflight.scoutBefore?.creatureId ?? null,
    hurtAfter: scoutAfter?.hurt ?? null,
  });
  const receiptEvidence = createF4ReceiptEvidenceV2({
    ordinal: receiptOrdinal,
    actionKind: ARC5_BIOSCAN_ACTION_KIND_V1,
    witnessDigest: sha256Hex(witness),
  });
  return Object.freeze({
    schema: 'cf-v2-arc5-bioscan-settlement/v1', preflight, hostile, damage,
    target, scoutAfter, successor, receiptEvidence, witness,
  });
}
