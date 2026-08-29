/* Arc 5 deterministic Field Scout authority.

   The legacy action names one owned fauna row or stands the current scout
   down. V2 preserves that rule at exact living-creature granularity: this
   owner changes only `scoutCreatureId`, consumes no RNG or active-play time,
   and mints one registered +1 ownership successor for one F4 receipt. */
import {
  MAX_OWNERSHIP_REVISION,
  type CreatureInstanceId,
} from './model.js';
import {
  LAST_USABLE_F4_RECEIPT_ORDINAL_V2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  isOwnershipStateV2,
  ownershipSourceStateV1,
  ownershipStateDigestV2,
  type F4ReceiptEvidenceV2,
  type OwnershipStateV2,
} from './model-v2.js';
import { canonicalJson, sha256Hex } from './canonical.js';

export const ARC5_SCOUT_ACTION_KIND_V1 = 'field-scout' as const;
export const ARC5_SCOUT_RECEIPT_KIND_V1 = 'arc5-field-scout' as const;

export interface Arc5ScoutTargetV1 {
  /** Null stands the current scout down. */
  readonly scoutCreatureId: CreatureInstanceId | null;
}

export type Arc5ScoutRefusalReasonV1 =
  | 'input-invalid'
  | 'ownership-invalid'
  | 'ownership-protected'
  | 'ownership-revision-exhausted'
  | 'creature-not-found'
  | 'creature-exhibit'
  | 'scout-unchanged';

export interface Arc5ScoutPreflightV1 {
  readonly schema: 'cf-v2-arc5-scout-preflight/v1';
  readonly parentRevision: number;
  readonly parentDigest: string;
  readonly scoutBefore: CreatureInstanceId | null;
  readonly scoutAfter: CreatureInstanceId | null;
}

export type Arc5ScoutPreflightOutcomeV1 =
  | Readonly<{ kind: 'ready'; preflight: Arc5ScoutPreflightV1 }>
  | Readonly<{ kind: 'refused'; reason: Arc5ScoutRefusalReasonV1 }>;

export interface Arc5ScoutSettlementV1 {
  readonly schema: 'cf-v2-arc5-scout-settlement/v1';
  readonly preflight: Arc5ScoutPreflightV1;
  readonly receiptEvidence: F4ReceiptEvidenceV2;
  readonly successor: OwnershipStateV2;
  readonly witness: string;
}

const PREFLIGHTS = new WeakMap<object, OwnershipStateV2>();

function refused(reason: Arc5ScoutRefusalReasonV1): Arc5ScoutPreflightOutcomeV1 {
  return Object.freeze({ kind: 'refused', reason });
}

function exactTarget(value: unknown): Arc5ScoutTargetV1 | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 1 || keys[0] !== 'scoutCreatureId') return null;
  const descriptor = Object.getOwnPropertyDescriptor(value, 'scoutCreatureId');
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
  const creatureId = descriptor.value;
  if (creatureId !== null && (typeof creatureId !== 'string'
    || !/^creature-v1:[0-9a-f]{64}$/u.test(creatureId))) return null;
  return Object.freeze({ scoutCreatureId: creatureId as CreatureInstanceId | null });
}

/** Validate one exact Field Scout change without consuming receipt authority. */
export function preflightArc5ScoutV1(
  parent: OwnershipStateV2,
  target: Arc5ScoutTargetV1,
): Arc5ScoutPreflightOutcomeV1 {
  if (!isOwnershipStateV2(parent)) return refused('ownership-invalid');
  if (parent.mode !== 'current') return refused('ownership-protected');
  if (parent.revision === MAX_OWNERSHIP_REVISION) {
    return refused('ownership-revision-exhausted');
  }
  const checked = exactTarget(target);
  if (checked === null) return refused('input-invalid');
  if (checked.scoutCreatureId === parent.scoutCreatureId) return refused('scout-unchanged');
  if (checked.scoutCreatureId !== null) {
    const creature = parent.creatures.find((row) => (
      row.creatureId === checked.scoutCreatureId
    ));
    if (creature === undefined) return refused('creature-not-found');
    if (creature.genome.exhibit === true) return refused('creature-exhibit');
  }
  const preflight: Arc5ScoutPreflightV1 = Object.freeze({
    schema: 'cf-v2-arc5-scout-preflight/v1',
    parentRevision: parent.revision,
    parentDigest: ownershipStateDigestV2(parent),
    scoutBefore: parent.scoutCreatureId,
    scoutAfter: checked.scoutCreatureId,
  });
  PREFLIGHTS.set(preflight, parent);
  return Object.freeze({ kind: 'ready', preflight });
}

function scoutWitness(preflight: Arc5ScoutPreflightV1, receiptOrdinal: number): string {
  return canonicalJson({
    schema: 'cf-v2-arc5-scout-witness/v1',
    receiptOrdinal,
    parentRevision: preflight.parentRevision,
    parentDigest: preflight.parentDigest,
    scoutBefore: preflight.scoutBefore,
    scoutAfter: preflight.scoutAfter,
  });
}

/** Settle an owner-minted preflight with the exact F4 receipt ordinal. */
export function settleArc5ScoutV1(
  preflight: Arc5ScoutPreflightV1,
  receiptOrdinal: number,
): Arc5ScoutSettlementV1 {
  const parent = preflight && typeof preflight === 'object'
    ? PREFLIGHTS.get(preflight)
    : undefined;
  if (parent === undefined) throw new TypeError('Arc 5 Field Scout preflight must be owner-minted');
  if (!Number.isSafeInteger(receiptOrdinal) || receiptOrdinal < 0
    || receiptOrdinal > LAST_USABLE_F4_RECEIPT_ORDINAL_V2) {
    throw new RangeError('Arc 5 Field Scout receipt ordinal is exhausted or invalid');
  }
  const witness = scoutWitness(preflight, receiptOrdinal);
  const receiptEvidence = createF4ReceiptEvidenceV2({
    ordinal: receiptOrdinal,
    actionKind: ARC5_SCOUT_ACTION_KIND_V1,
    witnessDigest: sha256Hex(witness),
  });
  const successor = createOwnershipSuccessorV2(parent, {
    source: ownershipSourceStateV1(parent),
    bredAcquisitions: parent.bredAcquisitions,
    creatures: parent.creatures,
    creatureTombstones: parent.creatureTombstones,
    specimenLots: parent.specimenLots,
    specimenTombstones: parent.specimenTombstones,
    scoutCreatureId: preflight.scoutAfter,
  });
  return Object.freeze({
    schema: 'cf-v2-arc5-scout-settlement/v1',
    preflight,
    receiptEvidence,
    successor,
    witness,
  });
}
