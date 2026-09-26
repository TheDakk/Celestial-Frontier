/* D13 stage 2b: companion missions — the `player/arc5.missions` v1 carrier and its three transactions.

   The carrier holds the active field missions (each with its SEALED result, drawn once at dispatch) and a short return log
   (the mission Chronicle). Absent means nothing is away. Dispatch is one receipt with three `companion-mission` SessionRNG
   draws; claim and recall are deterministic receipts. Every transaction re-reads the carrier and the Arc 5 ownership from the
   committed extensions inside its derive, so a second press of the same claim (double click, a second tab, a reload) finds
   the mission gone and commits nothing. The device clock never enters: boundaries are the committed active-play snapshot.
   Rewards are never lost: a claim whose materials do not fit the hold is refused and the mission stays ready. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalJson,
  canonicalizeData,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  sha256Hex,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  COMPANION_MISSION_LENGTHS_V1,
  COMPANION_MISSION_LORE_V1,
  COMPANION_MISSION_TYPES_V1,
  MISSION_RATES_V1,
  companionMissionClaimSuccessorV1,
  companionMissionDispatchRefusalV1,
  companionMissionDispatchSuccessorV1,
  companionMissionIdV1,
  companionMissionOffersV1,
  companionMissionRecallSuccessorV1,
  sealCompanionMissionV1,
  type CompanionMissionDispatchRefusalV1,
  type CompanionMissionLengthV1,
  type CompanionMissionOfferV1,
  type CompanionMissionSealedV1,
  type CompanionMissionTypeV1,
} from '@cf/domain-acquisition/missions-internal';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { combatOpenEncounterMemberIdsV1 } from './combat-open-encounter.js';
import { companionLegacyCodexIdV1 } from './friendly-duel.js';
import { prepareArc5OwnershipV2Successor, readArc5OwnershipMigration } from './arc5-ownership-migration.js';
import type { SaveStateV2 } from './import-v2.js';
import { V5_SEGMENTS, applyV5ExtensionWrites, canonicalizeV5Extensions, type V5ExtensionWrite, type V5Extensions } from './migration-v5.js';
import type { F4OutcomeDerivation } from './outcome-transaction.js';
import { readWorldIdentity } from './world-identity.js';

export const ARC5_MISSIONS_NAMESPACE_V1 = 'arc5.missions' as const;
export const ARC5_MISSIONS_SCHEMA_V1 = 'cf-v2-arc5-missions/v1' as const;
export const ARC5_MISSION_DISPATCH_RECEIPT_KIND_V1 = 'arc5-companion-mission-dispatch' as const;
export const ARC5_MISSION_CLAIM_OPERATION_V1 = 'companion-mission-claim' as const;
export const ARC5_MISSION_CLAIM_RECEIPT_KIND_V1 = 'arc5-companion-mission-claim' as const;
export const ARC5_MISSION_RECALL_OPERATION_V1 = 'companion-mission-recall' as const;
export const ARC5_MISSION_RECALL_RECEIPT_KIND_V1 = 'arc5-companion-mission-recall' as const;
/** Three ordered draws in the one domain: wound, deposit pick, lore pick. */
export const ARC5_MISSION_DISPATCH_DOMAINS_V1 = Object.freeze(['companion-mission', 'companion-mission', 'companion-mission'] as const);
export const ARC5_MISSION_LOG_MAX_V1 = 24;
/** The hold's compatibility capacity (import-v2 clamps a stack at 1,000,000 and keeps at most 200 material rows). */
export const ARC5_MISSION_CARGO_STACK_MAX_V1 = 1_000_000;
export const ARC5_MISSION_CARGO_ROWS_MAX_V1 = 200;
const COUNTER_MAX = 1_000_000_000;
const VERSION = 1 as const;

export interface Arc5MissionRecordV1 {
  readonly missionId: string;
  readonly creatureId: string;
  readonly type: CompanionMissionTypeV1;
  readonly length: CompanionMissionLengthV1;
  readonly worldKey: string;
  readonly worldName: string;
  readonly dispatchedAtActivePlayMs: number;
  readonly readyAtActivePlayMs: number;
  readonly sealed: CompanionMissionSealedV1;
}
export interface Arc5MissionLogRowV1 {
  readonly missionId: string;
  readonly creatureId: string;
  readonly type: CompanionMissionTypeV1;
  readonly length: CompanionMissionLengthV1;
  readonly worldKey: string;
  readonly worldName: string;
  readonly outcome: 'returned' | 'recalled';
  /** Returned: the sealed result it brought home. Recalled: nothing (the sealed result was discarded unseen). */
  readonly materials: readonly (readonly [string, number])[];
  readonly stardust: number;
  readonly xp: number;
  readonly hurt: number;
  readonly loreIndex: number | null;
  readonly memento: string | null;
  readonly atActivePlayMs: number;
}
export interface Arc5MissionsStateV1 {
  readonly active: readonly Arc5MissionRecordV1[];
  readonly log: readonly Arc5MissionLogRowV1[];
}
export type Arc5MissionsReadV1 =
  | Readonly<{ kind: 'loaded'; state: Arc5MissionsStateV1 }>
  | Readonly<{ kind: 'protected'; reason: 'wrong-segment' | 'corrupt' | 'future-version' }>;

const EMPTY: Arc5MissionsStateV1 = Object.freeze({ active: Object.freeze([]), log: Object.freeze([]) });
const isInt = (v: unknown, min = 0): v is number => Number.isSafeInteger(v) && (v as number) >= min;
const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max && !/[\u0000-\u001f\u007f]/u.test(v);
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const hurtOk = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 0.6;
function materialsOk(v: unknown): v is (readonly [string, number])[] {
  return Array.isArray(v) && v.length <= 8 && v.every((row) => Array.isArray(row) && row.length === 2 && isText(row[0], 64) && isInt(row[1], 1) && (row[1] as number) <= 1_000);
}
function sealedOk(v: unknown): v is CompanionMissionSealedV1 {
  return exact(v, ['hurt', 'loreIndex', 'materials', 'stardust', 'xp']) && materialsOk(v.materials) && isInt(v.stardust) && (v.stardust as number) <= 1_000
    && isInt(v.xp) && (v.xp as number) <= 1_000 && hurtOk(v.hurt)
    && (v.loreIndex === null || (isInt(v.loreIndex) && (v.loreIndex as number) < COMPANION_MISSION_LORE_V1.length));
}
const typeOk = (v: unknown): v is CompanionMissionTypeV1 => (COMPANION_MISSION_TYPES_V1 as readonly unknown[]).includes(v);
const lengthOk = (v: unknown): v is CompanionMissionLengthV1 => (COMPANION_MISSION_LENGTHS_V1 as readonly unknown[]).includes(v);
function recordOk(v: unknown): v is Arc5MissionRecordV1 {
  return exact(v, ['creatureId', 'dispatchedAtActivePlayMs', 'length', 'missionId', 'readyAtActivePlayMs', 'sealed', 'type', 'worldKey', 'worldName'])
    && isText(v.missionId, 32) && /^mission:\d{1,16}$/u.test(v.missionId as string) && isText(v.creatureId, 128) && typeOk(v.type) && lengthOk(v.length)
    && isText(v.worldKey, 2_048) && isText(v.worldName, 128) && isInt(v.dispatchedAtActivePlayMs) && isInt(v.readyAtActivePlayMs)
    && (v.readyAtActivePlayMs as number) === (v.dispatchedAtActivePlayMs as number) + MISSION_RATES_V1.lengths[v.length as CompanionMissionLengthV1].activeMinutes * 60_000
    && sealedOk(v.sealed);
}
function logOk(v: unknown): v is Arc5MissionLogRowV1 {
  return exact(v, ['atActivePlayMs', 'creatureId', 'hurt', 'length', 'loreIndex', 'materials', 'memento', 'missionId', 'outcome', 'stardust', 'type', 'worldKey', 'worldName', 'xp'])
    && isText(v.missionId, 32) && isText(v.creatureId, 128) && typeOk(v.type) && lengthOk(v.length) && isText(v.worldKey, 2_048) && isText(v.worldName, 128)
    && (v.outcome === 'returned' || v.outcome === 'recalled') && materialsOk(v.materials) && isInt(v.stardust) && isInt(v.xp) && hurtOk(v.hurt)
    && (v.loreIndex === null || (isInt(v.loreIndex) && (v.loreIndex as number) < COMPANION_MISSION_LORE_V1.length))
    && (v.memento === null || isText(v.memento, 2_100)) && isInt(v.atActivePlayMs);
}

export function readArc5MissionsV1(extensionsValue: unknown): Arc5MissionsReadV1 {
  let extensions: V5Extensions;
  try { extensions = canonicalizeV5Extensions(extensionsValue); } catch { return Object.freeze({ kind: 'protected', reason: 'corrupt' }); }
  if (V5_SEGMENTS.some((segment) => segment !== 'player' && extensions[segment]?.[ARC5_MISSIONS_NAMESPACE_V1] !== undefined)) return Object.freeze({ kind: 'protected', reason: 'wrong-segment' });
  const carrier = extensions.player?.[ARC5_MISSIONS_NAMESPACE_V1];
  if (carrier === undefined) return Object.freeze({ kind: 'loaded', state: EMPTY });
  if (carrier.version > VERSION) return Object.freeze({ kind: 'protected', reason: 'future-version' });
  try {
    const value = canonicalizeData(JSON.parse(carrier.json)) as Record<string, unknown>;
    if (carrier.version !== VERSION || !exact(value, ['active', 'log', 'schema']) || value.schema !== ARC5_MISSIONS_SCHEMA_V1
      || !Array.isArray(value.active) || value.active.length > MISSION_RATES_V1.fieldSlots || !value.active.every(recordOk)
      || !Array.isArray(value.log) || value.log.length > ARC5_MISSION_LOG_MAX_V1 || !value.log.every(logOk)
      || new Set((value.active as Arc5MissionRecordV1[]).map((m) => m.missionId)).size !== value.active.length
      || new Set((value.active as Arc5MissionRecordV1[]).map((m) => m.creatureId)).size !== value.active.length
      || canonicalJson(value as never) !== carrier.json) {
      return Object.freeze({ kind: 'protected', reason: 'corrupt' });
    }
    return Object.freeze({ kind: 'loaded', state: Object.freeze({ active: Object.freeze(value.active as Arc5MissionRecordV1[]), log: Object.freeze(value.log as Arc5MissionLogRowV1[]) }) });
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'corrupt' });
  }
}

function carrierWrite(state: Arc5MissionsStateV1): V5ExtensionWrite {
  return Object.freeze({ segment: 'player', namespace: ARC5_MISSIONS_NAMESPACE_V1, carrier: Object.freeze({
    version: VERSION, json: canonicalJson({ schema: ARC5_MISSIONS_SCHEMA_V1, active: state.active, log: state.log } as never) }) });
}

/** The Arc 5 ownership exactly as durable in these extensions (a stale or protected ownership refuses the transaction). */
function durableOwnership(extensions: V5Extensions, expected: OwnershipStateV2): OwnershipStateV2 {
  if (!isOwnershipStateV2(expected) || expected.mode !== 'current') throw new Error('mission ownership is not current');
  const durable = readArc5OwnershipMigration(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (durable.kind !== 'loaded' || ownershipStateDigestV2(durable.state) !== ownershipStateDigestV2(expected)) throw new Error('mission ownership is stale or protected');
  return expected;
}

/** The landed worlds a mission may target: key, display name and canonical deposits (from the world's own snapshot). */
export function arc5MissionWorldsV1(extensions: V5Extensions): readonly Readonly<{ worldKey: string; worldName: string; deposits: readonly string[] }>[] {
  const identity = readWorldIdentity(extensions);
  if (identity.kind !== 'loaded') return Object.freeze([]);
  const out: Readonly<{ worldKey: string; worldName: string; deposits: readonly string[] }>[] = [];
  for (const record of identity.state.records) {
    if (!record.landed) continue;
    let deposits: readonly string[] = [];
    try { deposits = Object.freeze([...projectWorldOpportunity(record.address).deposits]); } catch { deposits = Object.freeze([]); }
    out.push(Object.freeze({ worldKey: record.key, worldName: (record.name ?? `World ${record.address.planet.seed}`).slice(0, 128), deposits }));
  }
  return Object.freeze(out);
}

function changedWrites(before: V5Extensions, after: V5Extensions): readonly V5ExtensionWrite[] {
  const writes: V5ExtensionWrite[] = [];
  for (const segment of V5_SEGMENTS) {
    const b = before[segment] ?? {}, a = after[segment] ?? {};
    for (const namespace of new Set([...Object.keys(b), ...Object.keys(a)])) {
      const carrier = a[namespace], prior = b[namespace];
      if (carrier !== undefined && (prior === undefined || canonicalJson(carrier as never) !== canonicalJson(prior as never))) writes.push(Object.freeze({ segment, namespace, carrier }));
    }
  }
  return Object.freeze(writes);
}

function withOwnership(extensions: V5Extensions, parent: OwnershipStateV2, successor: OwnershipStateV2): V5Extensions {
  const prepared = prepareArc5OwnershipV2Successor({ baseExtensions: extensions, parent, successor, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (prepared.kind !== 'prepared') throw new Error(`mission Arc 5 carrier refused ${prepared.reason}`);
  return prepared.extensions;
}

export type Arc5MissionDispatchRefusalV1 = CompanionMissionDispatchRefusalV1
  | 'missions-protected' | 'slots-full' | 'world-not-landed' | 'world-has-no-deposits' | 'held-by-command-fight' | 'input-invalid';

/** Why this dispatch would be refused at `activePlayMs`, or null (the board's disclosure and the derive's own gate). */
export function arc5MissionDispatchRefusalV1(input: Readonly<{ extensions: V5Extensions; ownershipV2: OwnershipStateV2; creatureId: string;
  type: CompanionMissionTypeV1; length: CompanionMissionLengthV1; worldKey: string; activePlayMs: number }>): Arc5MissionDispatchRefusalV1 | null {
  if (!typeOk(input.type) || !lengthOk(input.length) || typeof input.worldKey !== 'string' || !isInt(input.activePlayMs)) return 'input-invalid';
  const missions = readArc5MissionsV1(input.extensions);
  if (missions.kind !== 'loaded') return 'missions-protected';
  if (missions.state.active.length >= MISSION_RATES_V1.fieldSlots) return 'slots-full';
  const held = combatOpenEncounterMemberIdsV1(input.extensions);
  if (held === null || held.includes(input.creatureId)) return 'held-by-command-fight';
  const creatureRefusal = companionMissionDispatchRefusalV1(input.ownershipV2, input.creatureId, input.length, input.activePlayMs);
  if (creatureRefusal !== null) return creatureRefusal;
  const world = arc5MissionWorldsV1(input.extensions).find((w) => w.worldKey === input.worldKey);
  if (world === undefined) return 'world-not-landed';
  if (input.type === 'prospect' && world.deposits.length === 0) return 'world-has-no-deposits';
  return null;
}

export function deriveArc5MissionDispatchV1(input: Readonly<{
  draft: SaveStateV2; extensions: V5Extensions; receiptOrdinal: number; activePlayMs: number; draws: readonly number[];
  ownershipV2: OwnershipStateV2; creatureId: string; type: CompanionMissionTypeV1; length: CompanionMissionLengthV1; worldKey: string;
}>): F4OutcomeDerivation & Readonly<{ mission: Arc5MissionRecordV1; ownershipSuccessor: OwnershipStateV2 }> {
  const parent = durableOwnership(input.extensions, input.ownershipV2);
  const refusal = arc5MissionDispatchRefusalV1({ ...input, ownershipV2: parent });
  if (refusal !== null) throw new Error(`mission dispatch refused ${refusal}`);
  if (input.draws.length !== 3) throw new Error('mission dispatch needs exactly three draws');
  const world = arc5MissionWorldsV1(input.extensions).find((w) => w.worldKey === input.worldKey)!;
  const creature = parent.creatures.find((row) => row.creatureId === input.creatureId)!;
  const sealed = sealCompanionMissionV1({ type: input.type, length: input.length, bond: creature.bond, deposits: world.deposits,
    draws: [input.draws[0]!, input.draws[1]!, input.draws[2]!] });
  const missionId = companionMissionIdV1(input.receiptOrdinal);
  const mission: Arc5MissionRecordV1 = Object.freeze({ missionId, creatureId: creature.creatureId, type: input.type, length: input.length,
    worldKey: world.worldKey, worldName: world.worldName, dispatchedAtActivePlayMs: input.activePlayMs,
    readyAtActivePlayMs: input.activePlayMs + MISSION_RATES_V1.lengths[input.length].activeMinutes * 60_000, sealed });
  const dispatched = companionMissionDispatchSuccessorV1(parent, creature.creatureId, missionId);
  const missions = readArc5MissionsV1(input.extensions) as Extract<Arc5MissionsReadV1, { kind: 'loaded' }>;
  let working = withOwnership(input.extensions, parent, dispatched.successor);
  working = applyV5ExtensionWrites(working, [carrierWrite({ active: [...missions.state.active, mission], log: missions.state.log })]).extensions;
  return Object.freeze({
    state: input.draft,
    extensionWrites: changedWrites(input.extensions, working),
    witness: canonicalJson({ schema: 'cf-v2-arc5-mission-dispatch-witness/v1', receiptOrdinal: input.receiptOrdinal, activePlayMs: input.activePlayMs,
      missionId, creatureDigest: sha256Hex(creature.creatureId), type: input.type, length: input.length, worldDigest: sha256Hex(world.worldKey),
      sealDigest: sha256Hex(canonicalJson(sealed as never)) } as never),
    mission,
    ownershipSuccessor: dispatched.successor,
  });
}

export type Arc5MissionClaimRefusalV1 = 'missions-protected' | 'mission-not-active' | 'mission-not-ready' | 'cargo-full' | 'stardust-capacity';

/** Would this claim be refused now? (`cargo-full` keeps the mission ready: rewards are never lost.) */
export function arc5MissionClaimRefusalV1(input: Readonly<{ extensions: V5Extensions; state: Pick<SaveStateV2, 'cargo' | 'essence' | 'stats'>; missionId: string; activePlayMs: number }>): Arc5MissionClaimRefusalV1 | null {
  const missions = readArc5MissionsV1(input.extensions);
  if (missions.kind !== 'loaded') return 'missions-protected';
  const mission = missions.state.active.find((m) => m.missionId === input.missionId);
  if (mission === undefined) return 'mission-not-active';
  if (input.activePlayMs < mission.readyAtActivePlayMs) return 'mission-not-ready';
  const cargo = new Map(input.state.cargo);
  for (const [id, n] of mission.sealed.materials) {
    const next = (cargo.get(id) ?? 0) + n;
    if (next > ARC5_MISSION_CARGO_STACK_MAX_V1 || (!cargo.has(id) && cargo.size >= ARC5_MISSION_CARGO_ROWS_MAX_V1)) return 'cargo-full';
    cargo.set(id, next);
  }
  if (input.state.essence + mission.sealed.stardust > COUNTER_MAX || ((input.state.stats as Record<string, number | undefined>).essenceEarned ?? 0) + mission.sealed.stardust > COUNTER_MAX) return 'stardust-capacity';
  return null;
}

export function deriveArc5MissionClaimV1(input: Readonly<{
  draft: SaveStateV2; extensions: V5Extensions; receiptOrdinal: number; activePlayMs: number; ownershipV2: OwnershipStateV2; missionId: string;
}>): F4OutcomeDerivation & Readonly<{ row: Arc5MissionLogRowV1; ownershipSuccessor: OwnershipStateV2 }> {
  const parent = durableOwnership(input.extensions, input.ownershipV2);
  const refusal = arc5MissionClaimRefusalV1({ extensions: input.extensions, state: input.draft, missionId: input.missionId, activePlayMs: input.activePlayMs });
  if (refusal !== null) throw new Error(`mission claim refused ${refusal}`);
  const missions = readArc5MissionsV1(input.extensions) as Extract<Arc5MissionsReadV1, { kind: 'loaded' }>;
  const mission = missions.state.active.find((m) => m.missionId === input.missionId)!;
  const claimed = companionMissionClaimSuccessorV1(parent, { creatureId: mission.creatureId, missionId: mission.missionId, type: mission.type,
    length: mission.length, worldKey: mission.worldKey, sealed: mission.sealed, activePlayMs: input.activePlayMs });
  const draft = input.draft;
  const cargo = new Map(draft.cargo);
  for (const [id, n] of mission.sealed.materials) cargo.set(id, (cargo.get(id) ?? 0) + n);
  draft.cargo = [...cargo.entries()];
  if (mission.sealed.stardust > 0) {
    draft.essence += mission.sealed.stardust;
    draft.stats.essenceEarned = (draft.stats.essenceEarned ?? 0) + mission.sealed.stardust;
  }
  // mission XP also lands on the companion's v4 Compendium mirror row, by the one rule the duel and Feed share
  if ((claimed.creatureAfter.xp ?? 0) !== (claimed.creatureBefore.xp ?? 0)) {
    const id = companionLegacyCodexIdV1(parent, claimed.creatureBefore), xp = claimed.creatureAfter.xp ?? 0;
    draft.codex = draft.codex.map(([rowId, entry]) => (rowId === id ? [rowId, { ...entry, g: { ...entry.g, xp } }] : [rowId, entry]));
  }
  const row: Arc5MissionLogRowV1 = Object.freeze({ missionId: mission.missionId, creatureId: mission.creatureId, type: mission.type, length: mission.length,
    worldKey: mission.worldKey, worldName: mission.worldName, outcome: 'returned', materials: mission.sealed.materials, stardust: mission.sealed.stardust,
    xp: (claimed.creatureAfter.xp ?? 0) - (claimed.creatureBefore.xp ?? 0), hurt: mission.sealed.hurt, loreIndex: mission.sealed.loreIndex,
    memento: claimed.memento, atActivePlayMs: input.activePlayMs });
  let working = withOwnership(input.extensions, parent, claimed.successor);
  working = applyV5ExtensionWrites(working, [carrierWrite({ active: missions.state.active.filter((m) => m.missionId !== mission.missionId),
    log: [row, ...missions.state.log].slice(0, ARC5_MISSION_LOG_MAX_V1) })]).extensions;
  return Object.freeze({
    state: draft,
    extensionWrites: changedWrites(input.extensions, working),
    witness: canonicalJson({ schema: 'cf-v2-arc5-mission-claim-witness/v1', receiptOrdinal: input.receiptOrdinal, activePlayMs: input.activePlayMs,
      missionId: mission.missionId, sealDigest: sha256Hex(canonicalJson(mission.sealed as never)), memento: claimed.memento } as never),
    row,
    ownershipSuccessor: claimed.successor,
  });
}

export function deriveArc5MissionRecallV1(input: Readonly<{
  draft: SaveStateV2; extensions: V5Extensions; receiptOrdinal: number; activePlayMs: number; ownershipV2: OwnershipStateV2; missionId: string;
}>): F4OutcomeDerivation & Readonly<{ row: Arc5MissionLogRowV1; ownershipSuccessor: OwnershipStateV2 }> {
  const parent = durableOwnership(input.extensions, input.ownershipV2);
  const missions = readArc5MissionsV1(input.extensions);
  if (missions.kind !== 'loaded') throw new Error('mission recall refused missions-protected');
  const mission = missions.state.active.find((m) => m.missionId === input.missionId);
  if (mission === undefined) throw new Error('mission recall refused mission-not-active');
  const recalled = companionMissionRecallSuccessorV1(parent, mission.creatureId, mission.missionId);
  const row: Arc5MissionLogRowV1 = Object.freeze({ missionId: mission.missionId, creatureId: mission.creatureId, type: mission.type, length: mission.length,
    worldKey: mission.worldKey, worldName: mission.worldName, outcome: 'recalled', materials: Object.freeze([]), stardust: 0, xp: 0, hurt: 0, loreIndex: null,
    memento: null, atActivePlayMs: input.activePlayMs });
  let working = withOwnership(input.extensions, parent, recalled.successor);
  working = applyV5ExtensionWrites(working, [carrierWrite({ active: missions.state.active.filter((m) => m.missionId !== mission.missionId),
    log: [row, ...missions.state.log].slice(0, ARC5_MISSION_LOG_MAX_V1) })]).extensions;
  return Object.freeze({
    state: input.draft,
    extensionWrites: changedWrites(input.extensions, working),
    witness: canonicalJson({ schema: 'cf-v2-arc5-mission-recall-witness/v1', receiptOrdinal: input.receiptOrdinal, activePlayMs: input.activePlayMs, missionId: mission.missionId } as never),
    row,
    ownershipSuccessor: recalled.successor,
  });
}

/* ---------- the mission board read model (nothing sealed is shown before the companion returns) ---------- */
export interface Arc5MissionBoardActiveV1 {
  readonly missionId: string; readonly creatureId: string; readonly companion: string; readonly type: CompanionMissionTypeV1; readonly length: CompanionMissionLengthV1;
  readonly worldName: string; readonly status: 'away' | 'ready'; readonly remainingMinutes: number; readonly claimRefusal: Arc5MissionClaimRefusalV1 | null;
}
export interface Arc5MissionBoardCompanionV1 {
  readonly creatureId: string; readonly companion: string; readonly offers: readonly (CompanionMissionOfferV1 & Readonly<{ refusal: Arc5MissionDispatchRefusalV1 | null }>)[];
}
export interface Arc5MissionBoardV1 {
  readonly schema: 'cf-v2-arc5-mission-board/v1';
  readonly slotsUsed: number; readonly slots: number;
  readonly active: readonly Arc5MissionBoardActiveV1[];
  readonly companions: readonly Arc5MissionBoardCompanionV1[];
  readonly worlds: readonly Readonly<{ worldKey: string; worldName: string; hasDeposits: boolean }>[];
  readonly log: readonly Arc5MissionLogRowV1[];
}
export function projectArc5MissionBoardV1(input: Readonly<{ extensions: V5Extensions; ownershipV2: OwnershipStateV2 | null; state: Pick<SaveStateV2, 'cargo' | 'essence' | 'stats'>;
  activePlayMs: number; nameOf: (creatureId: string) => string; worldKey: string | null }>): Arc5MissionBoardV1 | null {
  const missions = readArc5MissionsV1(input.extensions);
  if (missions.kind !== 'loaded' || input.ownershipV2 === null || !isOwnershipStateV2(input.ownershipV2) || input.ownershipV2.mode !== 'current') return null;
  const worlds = arc5MissionWorldsV1(input.extensions);
  const ownership = input.ownershipV2;
  const active = missions.state.active.map((m): Arc5MissionBoardActiveV1 => Object.freeze({ missionId: m.missionId, creatureId: m.creatureId, companion: input.nameOf(m.creatureId),
    type: m.type, length: m.length, worldName: m.worldName, status: input.activePlayMs >= m.readyAtActivePlayMs ? 'ready' : 'away',
    remainingMinutes: Math.max(0, Math.ceil((m.readyAtActivePlayMs - input.activePlayMs) / 60_000)),
    claimRefusal: arc5MissionClaimRefusalV1({ extensions: input.extensions, state: input.state, missionId: m.missionId, activePlayMs: input.activePlayMs }) }));
  const target = input.worldKey ?? worlds[0]?.worldKey ?? null;
  const companions = ownership.creatures.filter((row) => row.genome.exhibit !== true).map((row): Arc5MissionBoardCompanionV1 => Object.freeze({
    creatureId: row.creatureId, companion: input.nameOf(row.creatureId),
    offers: Object.freeze(companionMissionOffersV1(row).map((offer) => Object.freeze({ ...offer,
      refusal: target === null ? 'world-not-landed' as const : arc5MissionDispatchRefusalV1({ extensions: input.extensions, ownershipV2: ownership, creatureId: row.creatureId,
        type: offer.type, length: offer.length, worldKey: target, activePlayMs: input.activePlayMs }) }))),
  }));
  return Object.freeze({ schema: 'cf-v2-arc5-mission-board/v1', slotsUsed: missions.state.active.length, slots: MISSION_RATES_V1.fieldSlots,
    active: Object.freeze(active), companions: Object.freeze(companions),
    worlds: Object.freeze(worlds.map((w) => Object.freeze({ worldKey: w.worldKey, worldName: w.worldName, hasDeposits: w.deposits.length > 0 }))),
    log: missions.state.log });
}
