/* D13 stage 1c: companion Rest — heals on the ACTIVE-PLAY clock (N3 §4; Nick decided D13 2026-09-25).

   Rest is a home "mission" with no risk and no reward: 2 active minutes per 0.1 `hurt`, rounded up, at most 20.
   The heal is SEALED in this one receipt: the successor sets `hurt` to 0 and assigns `{kind:'mission', missionId:
   'rest:<readyAt>'}`, where `readyAt` is the committed active-play snapshot plus the duration. The companion is
   locked for breed, combat, dispatch and feed until the projection (companion-availability.ts) reaches that exact
   boundary — so every reader of `hurt` agrees at every moment, and there is no background writer. Nothing heals
   while the game is closed (the active-play clock does not move then), and moving the device clock changes
   nothing. The first recovery from Injured or worse is a bond memory. Pure and deterministic. */
import { MAX_ACTIVE_PLAY_MS } from '@cf/domain-progression';
import { MAX_OWNERSHIP_REVISION, type CreatureInstanceId, type CreatureInstanceV1 } from './model.js';
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
import { projectCompanionAvailabilityV1 } from './companion-availability.js';
import {
  COMPANION_INJURED_HURT_V1, COMPANION_RECOVERED_MEMORY_V1, companionRestDurationMsV1, companionRestMissionIdV1, withCompanionBondMemoriesV1,
} from './companion-care.js';

export const ARC5_REST_ACTION_KIND_V1 = 'companion-rest' as const;
export const ARC5_REST_RECEIPT_KIND_V1 = 'arc5-companion-rest' as const;

export type Arc5RestRefusalReasonV1 =
  | 'input-invalid' | 'ownership-invalid' | 'ownership-protected' | 'ownership-revision-exhausted'
  | 'creature-not-found' | 'creature-assigned' | 'creature-healthy' | 'clock-exhausted';

export interface Arc5RestPreflightV1 {
  readonly schema: 'cf-v2-arc5-rest-preflight/v1';
  readonly parentRevision: number;
  readonly parentDigest: string;
  readonly creatureId: CreatureInstanceId;
  readonly hurtBefore: number;
  readonly durationActivePlayMs: number;
  /** Adds the first-recovery memory (hurt ≥ Injured and not already held). */
  readonly recoveredMemory: boolean;
}

export type Arc5RestPreflightOutcomeV1 =
  | Readonly<{ kind: 'ready'; preflight: Arc5RestPreflightV1 }>
  | Readonly<{ kind: 'refused'; reason: Arc5RestRefusalReasonV1 }>;

export interface Arc5RestSettlementV1 {
  readonly schema: 'cf-v2-arc5-rest-settlement/v1';
  readonly preflight: Arc5RestPreflightV1;
  readonly receiptEvidence: F4ReceiptEvidenceV2;
  readonly readyAtActivePlayMs: number;
  readonly creatureBefore: CreatureInstanceV1;
  readonly creatureAfter: CreatureInstanceV1;
  readonly successor: OwnershipStateV2;
  readonly witness: string;
}

const PREFLIGHTS = new WeakMap<object, Readonly<{ parent: OwnershipStateV2; creature: CreatureInstanceV1 }>>();
const refused = (reason: Arc5RestRefusalReasonV1): Arc5RestPreflightOutcomeV1 => Object.freeze({ kind: 'refused', reason });

/** Inspect one Rest at the current active-play clock without consuming a receipt. */
export function preflightArc5RestV1(parent: OwnershipStateV2, target: Readonly<{ creatureId: CreatureInstanceId }>, activePlayMs: number): Arc5RestPreflightOutcomeV1 {
  if (!isOwnershipStateV2(parent)) return refused('ownership-invalid');
  if (parent.mode !== 'current') return refused('ownership-protected');
  if (parent.revision === MAX_OWNERSHIP_REVISION) return refused('ownership-revision-exhausted');
  if (!target || typeof target !== 'object' || typeof target.creatureId !== 'string' || !/^creature-v1:[0-9a-f]{64}$/u.test(target.creatureId)
    || Object.keys(target).length !== 1 || !Number.isSafeInteger(activePlayMs) || activePlayMs < 0 || activePlayMs > MAX_ACTIVE_PLAY_MS) return refused('input-invalid');
  const creature = parent.creatures.find((row) => row.creatureId === target.creatureId);
  if (creature === undefined) return refused('creature-not-found');
  if (projectCompanionAvailabilityV1(creature, activePlayMs).assignment !== null) return refused('creature-assigned');
  const duration = companionRestDurationMsV1(creature.hurt);
  if (duration === 0) return refused('creature-healthy');
  if (activePlayMs + duration > MAX_ACTIVE_PLAY_MS) return refused('clock-exhausted');
  const hurtBefore = creature.hurt ?? 0;
  const preflight: Arc5RestPreflightV1 = Object.freeze({
    schema: 'cf-v2-arc5-rest-preflight/v1', parentRevision: parent.revision, parentDigest: ownershipStateDigestV2(parent),
    creatureId: creature.creatureId, hurtBefore, durationActivePlayMs: duration,
    recoveredMemory: hurtBefore >= COMPANION_INJURED_HURT_V1 && !(creature.bond?.memories ?? []).some((m) => m.id === COMPANION_RECOVERED_MEMORY_V1),
  });
  PREFLIGHTS.set(preflight, Object.freeze({ parent, creature }));
  return Object.freeze({ kind: 'ready', preflight });
}

/** Settle an owner-minted Rest with the exact receipt ordinal and the active-play snapshot this transaction commits. */
export function settleArc5RestV1(preflight: Arc5RestPreflightV1, receiptOrdinal: number, activePlayMs: number): Arc5RestSettlementV1 {
  const authority = preflight && typeof preflight === 'object' ? PREFLIGHTS.get(preflight) : undefined;
  if (authority === undefined) throw new TypeError('Arc 5 rest preflight must be owner-minted');
  if (!Number.isSafeInteger(receiptOrdinal) || receiptOrdinal < 0 || receiptOrdinal > LAST_USABLE_F4_RECEIPT_ORDINAL_V2) throw new RangeError('Arc 5 rest receipt ordinal is exhausted or invalid');
  if (!Number.isSafeInteger(activePlayMs) || activePlayMs < 0 || activePlayMs + preflight.durationActivePlayMs > MAX_ACTIVE_PLAY_MS) throw new RangeError('Arc 5 rest active-play time is invalid');
  const readyAtActivePlayMs = activePlayMs + preflight.durationActivePlayMs;
  const witness = canonicalJson({ schema: 'cf-v2-arc5-rest-witness/v1', receiptOrdinal, activePlayMs, readyAtActivePlayMs, parentRevision: preflight.parentRevision,
    parentDigest: preflight.parentDigest, creatureId: preflight.creatureId, hurtBefore: preflight.hurtBefore, recoveredMemory: preflight.recoveredMemory });
  const receiptEvidence = createF4ReceiptEvidenceV2({ ordinal: receiptOrdinal, actionKind: ARC5_REST_ACTION_KIND_V1, witnessDigest: sha256Hex(witness) });
  const creatureAfter = createCreatureInstanceV2({
    ...authority.creature,
    hurt: 0,
    assignment: { kind: 'mission', missionId: companionRestMissionIdV1(readyAtActivePlayMs) },
    bond: preflight.recoveredMemory ? withCompanionBondMemoriesV1(authority.creature.bond, [{ id: COMPANION_RECOVERED_MEMORY_V1, kind: 'recovery' }], activePlayMs) : authority.creature.bond,
  });
  const parent = authority.parent;
  const successor = createOwnershipSuccessorV2(parent, {
    source: ownershipSourceStateV1(parent),
    bredAcquisitions: parent.bredAcquisitions,
    creatures: parent.creatures.map((row) => (row.creatureId === preflight.creatureId ? creatureAfter : row)),
    creatureTombstones: parent.creatureTombstones,
    specimenLots: parent.specimenLots,
    specimenTombstones: parent.specimenTombstones,
    scoutCreatureId: parent.scoutCreatureId,
  });
  return Object.freeze({ schema: 'cf-v2-arc5-rest-settlement/v1', preflight, receiptEvidence, readyAtActivePlayMs, creatureBefore: authority.creature, creatureAfter, successor, witness });
}
