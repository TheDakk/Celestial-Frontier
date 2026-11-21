/* Arc 5 deterministic companion rename authority.

   Rename changes one exact living fauna instance and nothing else. It reuses
   the shipped cleanName policy, consumes one exact F4 receipt, and produces a
   registered +1 ownership successor without RNG, time, or mutable globals. */
import { cleanName } from '@cf/domain-naming';
import {
  MAX_OWNERSHIP_REVISION,
  type CreatureInstanceId,
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

export const ARC5_RENAME_ACTION_KIND_V1 = 'companion-rename' as const;
export const ARC5_RENAME_RECEIPT_KIND_V1 = 'arc5-companion-rename' as const;
export const ARC5_COMPANION_NAME_MAX_V1 = 24 as const;

export interface Arc5RenameTargetV1 {
  readonly creatureId: CreatureInstanceId;
  readonly rawName: string;
}

export type Arc5RenameRefusalReasonV1 =
  | 'input-invalid'
  | 'ownership-invalid'
  | 'ownership-protected'
  | 'ownership-revision-exhausted'
  | 'creature-not-found'
  | 'creature-exhibit'
  | 'name-invalid'
  | 'name-unchanged';

export interface Arc5RenamePreflightV1 {
  readonly schema: 'cf-v2-arc5-rename-preflight/v1';
  readonly parentRevision: number;
  readonly parentDigest: string;
  readonly creatureId: CreatureInstanceId;
  readonly nicknameBefore: string | null;
  readonly nicknameAfter: string;
}

export type Arc5RenamePreflightOutcomeV1 =
  | Readonly<{ kind: 'ready'; preflight: Arc5RenamePreflightV1 }>
  | Readonly<{ kind: 'refused'; reason: Arc5RenameRefusalReasonV1 }>;

export interface Arc5RenameSettlementV1 {
  readonly schema: 'cf-v2-arc5-rename-settlement/v1';
  readonly preflight: Arc5RenamePreflightV1;
  readonly receiptEvidence: F4ReceiptEvidenceV2;
  readonly creatureBefore: CreatureInstanceV1;
  readonly creatureAfter: CreatureInstanceV1;
  readonly successor: OwnershipStateV2;
  readonly witness: string;
}

interface Arc5RenamePreflightAuthorityV1 {
  readonly parent: OwnershipStateV2;
  readonly creature: CreatureInstanceV1;
}

const PREFLIGHTS = new WeakMap<object, Arc5RenamePreflightAuthorityV1>();

function refused(reason: Arc5RenameRefusalReasonV1): Arc5RenamePreflightOutcomeV1 {
  return Object.freeze({ kind: 'refused', reason });
}

function exactTarget(value: unknown): Arc5RenameTargetV1 | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 2 || keys.some((key) => typeof key !== 'string')) return null;
  const names = (keys as string[]).sort();
  if (names[0] !== 'creatureId' || names[1] !== 'rawName') return null;
  const creature = Object.getOwnPropertyDescriptor(value, 'creatureId');
  const name = Object.getOwnPropertyDescriptor(value, 'rawName');
  if (!creature || !name || !('value' in creature) || !('value' in name)
    || creature.enumerable !== true || name.enumerable !== true
    || typeof creature.value !== 'string' || typeof name.value !== 'string'
    || !/^creature-v1:[0-9a-f]{64}$/u.test(creature.value)) return null;
  return Object.freeze({
    creatureId: creature.value as CreatureInstanceId,
    rawName: name.value,
  });
}

/** Validate and normalize one exact companion rename without consuming an F4
 * receipt. Empty/unchanged names are deliberate no-ops. */
export function preflightArc5RenameV1(
  parent: OwnershipStateV2,
  target: Arc5RenameTargetV1,
): Arc5RenamePreflightOutcomeV1 {
  if (!isOwnershipStateV2(parent)) return refused('ownership-invalid');
  if (parent.mode !== 'current') return refused('ownership-protected');
  if (parent.revision === MAX_OWNERSHIP_REVISION) {
    return refused('ownership-revision-exhausted');
  }
  const checked = exactTarget(target);
  if (checked === null) return refused('input-invalid');
  const creature = parent.creatures.find((row) => row.creatureId === checked.creatureId);
  if (creature === undefined) return refused('creature-not-found');
  if (creature.genome.exhibit === true) return refused('creature-exhibit');
  const nicknameAfter = cleanName(checked.rawName, ARC5_COMPANION_NAME_MAX_V1);
  if (nicknameAfter.length === 0 || /[\u0000-\u001f\u007f]/u.test(nicknameAfter)) {
    return refused('name-invalid');
  }
  if (nicknameAfter === creature.nickname) return refused('name-unchanged');
  const preflight: Arc5RenamePreflightV1 = Object.freeze({
    schema: 'cf-v2-arc5-rename-preflight/v1',
    parentRevision: parent.revision,
    parentDigest: ownershipStateDigestV2(parent),
    creatureId: creature.creatureId,
    nicknameBefore: creature.nickname,
    nicknameAfter,
  });
  PREFLIGHTS.set(preflight, Object.freeze({ parent, creature }));
  return Object.freeze({ kind: 'ready', preflight });
}

function renameWitness(preflight: Arc5RenamePreflightV1, receiptOrdinal: number): string {
  return canonicalJson({
    schema: 'cf-v2-arc5-rename-witness/v1',
    receiptOrdinal,
    parentRevision: preflight.parentRevision,
    parentDigest: preflight.parentDigest,
    creatureId: preflight.creatureId,
    nicknameBefore: preflight.nicknameBefore,
    nicknameAfter: preflight.nicknameAfter,
  });
}

/** Settle an owner-minted preflight with the exact F4 receipt ordinal. */
export function settleArc5RenameV1(
  preflight: Arc5RenamePreflightV1,
  receiptOrdinal: number,
): Arc5RenameSettlementV1 {
  const authority = preflight && typeof preflight === 'object'
    ? PREFLIGHTS.get(preflight)
    : undefined;
  if (authority === undefined) throw new TypeError('Arc 5 rename preflight must be owner-minted');
  if (!Number.isSafeInteger(receiptOrdinal) || receiptOrdinal < 0
    || receiptOrdinal > LAST_USABLE_F4_RECEIPT_ORDINAL_V2) {
    throw new RangeError('Arc 5 rename receipt ordinal is exhausted or invalid');
  }
  const witness = renameWitness(preflight, receiptOrdinal);
  const receiptEvidence = createF4ReceiptEvidenceV2({
    ordinal: receiptOrdinal,
    actionKind: ARC5_RENAME_ACTION_KIND_V1,
    witnessDigest: sha256Hex(witness),
  });
  const creatureAfter = createCreatureInstanceV2({
    ...authority.creature,
    nickname: preflight.nicknameAfter,
  });
  const parent = authority.parent;
  const successor = createOwnershipSuccessorV2(parent, {
    source: ownershipSourceStateV1(parent),
    bredAcquisitions: parent.bredAcquisitions,
    creatures: parent.creatures.map((row) => (
      row.creatureId === preflight.creatureId ? creatureAfter : row
    )),
    creatureTombstones: parent.creatureTombstones,
    specimenLots: parent.specimenLots,
    specimenTombstones: parent.specimenTombstones,
    scoutCreatureId: parent.scoutCreatureId,
  });
  return Object.freeze({
    schema: 'cf-v2-arc5-rename-settlement/v1',
    preflight,
    receiptEvidence,
    creatureBefore: authority.creature,
    creatureAfter,
    successor,
    witness,
  });
}
