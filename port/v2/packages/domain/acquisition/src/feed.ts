/* Arc 5 deterministic companion feeding authority.

   Feeding targets one exact living creature and one exact owned flora lot.
   This narrow care action is deliberately nonlethal and contains no outcome
   roll: it adds one bounded fed point and consumes one specimen. The caller
   must settle it with the F4 receipt ordinal that will cross the same durable
   transaction. General V2 successor constructors remain private. */
import {
  MAX_OWNERSHIP_REVISION,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type SpecimenLotId,
  type SpecimenLotV1,
} from './model.js';
import {
  LAST_USABLE_F4_RECEIPT_ORDINAL_V2,
  createCreatureInstanceV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  createSpecimenLotV2,
  createSpecimenTombstoneV2,
  isOwnershipStateV2,
  ownershipSourceStateV1,
  ownershipStateDigestV2,
  type F4ReceiptEvidenceV2,
  type OwnershipStateV2,
  type SpecimenTombstoneV2,
} from './model-v2.js';
import { canonicalJson, sha256Hex } from './canonical.js';

export const ARC5_FEED_ACTION_KIND_V1 = 'companion-feed' as const;
export const ARC5_FEED_RECEIPT_KIND_V1 = 'arc5-companion-feed' as const;
export const ARC5_FEED_INCREMENT_V1 = 1 as const;
export const ARC5_FED_MAX_V1 = 200 as const;

export interface Arc5FeedTargetV1 {
  readonly creatureId: CreatureInstanceId;
  readonly foodLotId: SpecimenLotId;
}

export type Arc5FeedRefusalReasonV1 =
  | 'input-invalid'
  | 'ownership-invalid'
  | 'ownership-protected'
  | 'ownership-revision-exhausted'
  | 'creature-not-found'
  | 'creature-assigned'
  | 'creature-fed-cap'
  | 'food-not-found'
  | 'food-not-flora';

export interface Arc5FeedPreflightV1 {
  readonly schema: 'cf-v2-arc5-feed-preflight/v1';
  readonly parentRevision: number;
  readonly parentDigest: string;
  readonly creatureId: CreatureInstanceId;
  readonly foodLotId: SpecimenLotId;
  readonly fedBefore: number;
  readonly fedAfter: number;
  readonly foodQuantityBefore: number;
  readonly foodQuantityAfter: number;
}

export type Arc5FeedPreflightOutcomeV1 =
  | Readonly<{ kind: 'ready'; preflight: Arc5FeedPreflightV1 }>
  | Readonly<{ kind: 'refused'; reason: Arc5FeedRefusalReasonV1 }>;

export interface Arc5FeedSettlementV1 {
  readonly schema: 'cf-v2-arc5-feed-settlement/v1';
  readonly preflight: Arc5FeedPreflightV1;
  readonly receiptEvidence: F4ReceiptEvidenceV2;
  readonly creatureBefore: CreatureInstanceV1;
  readonly creatureAfter: CreatureInstanceV1;
  readonly foodBefore: SpecimenLotV1;
  readonly foodAfter: SpecimenLotV1 | null;
  readonly foodTombstone: SpecimenTombstoneV2 | null;
  readonly successor: OwnershipStateV2;
  readonly witness: string;
}

interface Arc5FeedPreflightAuthorityV1 {
  readonly parent: OwnershipStateV2;
  readonly creature: CreatureInstanceV1;
  readonly food: SpecimenLotV1;
}

const PREFLIGHTS = new WeakMap<object, Arc5FeedPreflightAuthorityV1>();

function refused(reason: Arc5FeedRefusalReasonV1): Arc5FeedPreflightOutcomeV1 {
  return Object.freeze({ kind: 'refused', reason });
}

function exactTarget(value: unknown): Arc5FeedTargetV1 | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 2 || keys.some((key) => typeof key !== 'string')) return null;
  const names = (keys as string[]).sort();
  if (names[0] !== 'creatureId' || names[1] !== 'foodLotId') return null;
  const creature = Object.getOwnPropertyDescriptor(value, 'creatureId');
  const food = Object.getOwnPropertyDescriptor(value, 'foodLotId');
  if (!creature || !food || !('value' in creature) || !('value' in food)
    || creature.enumerable !== true || food.enumerable !== true
    || typeof creature.value !== 'string' || typeof food.value !== 'string'
    || !/^creature-v1:[0-9a-f]{64}$/u.test(creature.value)
    || !/^specimen-v1:[0-9a-f]{64}$/u.test(food.value)) return null;
  return Object.freeze({
    creatureId: creature.value as CreatureInstanceId,
    foodLotId: food.value as SpecimenLotId,
  });
}

/** Inspect one exact feed target without consuming a receipt ordinal or
 * producing a successor. The opaque returned preflight is the only value the
 * settlement function accepts. */
export function preflightArc5FeedV1(
  parent: OwnershipStateV2,
  target: Arc5FeedTargetV1,
): Arc5FeedPreflightOutcomeV1 {
  if (!isOwnershipStateV2(parent)) return refused('ownership-invalid');
  if (parent.mode !== 'current') return refused('ownership-protected');
  if (parent.revision === MAX_OWNERSHIP_REVISION) {
    return refused('ownership-revision-exhausted');
  }
  const checkedTarget = exactTarget(target);
  if (checkedTarget === null) return refused('input-invalid');
  const creature = parent.creatures.find((row) => row.creatureId === checkedTarget.creatureId);
  if (creature === undefined) return refused('creature-not-found');
  if (creature.assignment !== null) return refused('creature-assigned');
  const fedBefore = creature.fed ?? 0;
  if (fedBefore >= ARC5_FED_MAX_V1) return refused('creature-fed-cap');
  const food = parent.specimenLots.find((row) => row.lotId === checkedTarget.foodLotId);
  if (food === undefined) return refused('food-not-found');
  if (food.kind !== 'flora') return refused('food-not-flora');
  const preflight: Arc5FeedPreflightV1 = Object.freeze({
    schema: 'cf-v2-arc5-feed-preflight/v1',
    parentRevision: parent.revision,
    parentDigest: ownershipStateDigestV2(parent),
    creatureId: checkedTarget.creatureId,
    foodLotId: checkedTarget.foodLotId,
    fedBefore,
    fedAfter: Math.min(ARC5_FED_MAX_V1, fedBefore + ARC5_FEED_INCREMENT_V1),
    foodQuantityBefore: food.quantity,
    foodQuantityAfter: food.quantity - 1,
  });
  PREFLIGHTS.set(preflight, Object.freeze({ parent, creature, food }));
  return Object.freeze({ kind: 'ready', preflight });
}

function feedWitness(
  preflight: Arc5FeedPreflightV1,
  receiptOrdinal: number,
): string {
  return canonicalJson({
    schema: 'cf-v2-arc5-feed-witness/v1',
    receiptOrdinal,
    parentRevision: preflight.parentRevision,
    parentDigest: preflight.parentDigest,
    creatureId: preflight.creatureId,
    foodLotId: preflight.foodLotId,
    fedBefore: preflight.fedBefore,
    fedAfter: preflight.fedAfter,
    foodQuantityBefore: preflight.foodQuantityBefore,
    foodQuantityAfter: preflight.foodQuantityAfter,
  });
}

/** Settle an owner-minted feed preflight with the exact F4 receipt ordinal.
 * This is pure deterministic product derivation: no RNG, time, globals, or
 * mutation of the registered parent is involved. */
export function settleArc5FeedV1(
  preflight: Arc5FeedPreflightV1,
  receiptOrdinal: number,
): Arc5FeedSettlementV1 {
  const authority = preflight && typeof preflight === 'object'
    ? PREFLIGHTS.get(preflight)
    : undefined;
  if (authority === undefined) throw new TypeError('Arc 5 feed preflight must be owner-minted');
  if (!Number.isSafeInteger(receiptOrdinal) || receiptOrdinal < 0
    || receiptOrdinal > LAST_USABLE_F4_RECEIPT_ORDINAL_V2) {
    throw new RangeError('Arc 5 feed receipt ordinal is exhausted or invalid');
  }
  const witness = feedWitness(preflight, receiptOrdinal);
  const receiptEvidence = createF4ReceiptEvidenceV2({
    ordinal: receiptOrdinal,
    actionKind: ARC5_FEED_ACTION_KIND_V1,
    witnessDigest: sha256Hex(witness),
  });
  const creatureAfter = createCreatureInstanceV2({
    ...authority.creature,
    fed: preflight.fedAfter,
  });
  const foodAfter = preflight.foodQuantityAfter === 0
    ? null
    : createSpecimenLotV2({
      ...authority.food,
      quantity: preflight.foodQuantityAfter,
    });
  const foodTombstone = foodAfter === null
    ? createSpecimenTombstoneV2(authority.food, receiptEvidence)
    : null;
  const parent = authority.parent;
  const successor = createOwnershipSuccessorV2(parent, {
    source: ownershipSourceStateV1(parent),
    bredAcquisitions: parent.bredAcquisitions,
    creatures: parent.creatures.map((row) => (
      row.creatureId === preflight.creatureId ? creatureAfter : row
    )),
    creatureTombstones: parent.creatureTombstones,
    specimenLots: foodAfter === null
      ? parent.specimenLots.filter((row) => row.lotId !== preflight.foodLotId)
      : parent.specimenLots.map((row) => row.lotId === preflight.foodLotId ? foodAfter : row),
    specimenTombstones: foodTombstone === null
      ? parent.specimenTombstones
      : [...parent.specimenTombstones, foodTombstone],
    scoutCreatureId: parent.scoutCreatureId,
  });
  return Object.freeze({
    schema: 'cf-v2-arc5-feed-settlement/v1',
    preflight,
    receiptEvidence,
    creatureBefore: authority.creature,
    creatureAfter,
    foodBefore: authority.food,
    foodAfter,
    foodTombstone,
    successor,
    witness,
  });
}
