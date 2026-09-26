/* D13 stage 2b: companion missions (N3 §4 "Missions (Stage 2)"; Nick decided D13 2026-09-25). Pure and deterministic.

   A companion goes alone (party of 1) to a world the explorer has already landed on, for 10 / 25 / 60 minutes of ACTIVE
   PLAY. Two field types: Prospect (materials from that world's canonical deposit list — the world's finite Mine reserve is
   untouched) and Survey (an authored lore line and a little Stardust; it never reveals a species). Two field slots; Rest
   does not use one. The whole result is drawn ONCE at dispatch from the SessionRNG domain `companion-mission` and sealed
   with the mission, shown only on return. A wound is never Critical and never fatal. Recall is always allowed: the
   companion comes home unhurt with nothing and the sealed result is thrown away unseen. A finished mission never
   expires; the claim waits until the rewards fit. The device clock never enters: every boundary is an active-play ms.

   Every number lives in ONE table, `MISSION_RATES_V1` — a PLACEHOLDER until Codex's stage 2a rate table and economy-share
   instrument replace it. It sits inside the proposal's ceiling (two Long missions: ≤ 36 materials and ≤ 6 Stardust per
   active hour). The mission assignment shares the `mission` kind with Rest; `rest:` stays reserved for Rest, field
   missions use `mission:<receiptOrdinal>`. */
import { MAX_ACTIVE_PLAY_MS } from '@cf/domain-progression';
import type { CompanionBondV1, CreatureInstanceV1 } from './model.js';
import {
  createCreatureInstanceV2,
  createOwnershipSuccessorV2,
  ownershipSourceStateV1,
  type OwnershipStateV2,
} from './model-v2.js';
import { projectCompanionAvailabilityV1 } from './companion-availability.js';
import {
  COMPANION_INJURED_HURT_V1, COMPANION_REST_MISSION_PREFIX_V1, COMPANION_XP_MAX_V1, companionBondLevelV1, withCompanionBondMemoriesV1,
} from './companion-care.js';

export const COMPANION_MISSION_DOMAIN_V1 = 'companion-mission' as const;
export const COMPANION_MISSION_PREFIX_V1 = 'mission:' as const;
export const COMPANION_MISSION_TYPES_V1 = Object.freeze(['prospect', 'survey'] as const);
export const COMPANION_MISSION_LENGTHS_V1 = Object.freeze(['short', 'standard', 'long'] as const);
export type CompanionMissionTypeV1 = typeof COMPANION_MISSION_TYPES_V1[number];
export type CompanionMissionLengthV1 = typeof COMPANION_MISSION_LENGTHS_V1[number];

interface MissionLengthRateV1 {
  readonly activeMinutes: number;
  /** Prospect materials (halved, rounded down, when the companion is wounded). */
  readonly materials: number;
  /** Survey Stardust. */
  readonly stardust: number;
  readonly xp: number;
  /** Chance of a wound, shown before dispatch. */
  readonly woundChance: number;
  /** The wound bands, lightest first (a wound is never Critical). */
  readonly woundHurt: readonly number[];
  /** The bond level that unlocks this length (Long = Trusted). */
  readonly minBondLevel: number;
}
/** PLACEHOLDER until Codex's 2a — every mission number lives here and nowhere else. */
export const MISSION_RATES_V1 = Object.freeze({
  status: "placeholder until Codex's 2a" as const,
  fieldSlots: 2,
  lengths: Object.freeze({
    short: Object.freeze({ activeMinutes: 10, materials: 3, stardust: 0, xp: 2, woundChance: 0, woundHurt: Object.freeze([]), minBondLevel: 0 }),
    standard: Object.freeze({ activeMinutes: 25, materials: 8, stardust: 1, xp: 4, woundChance: 0.10, woundHurt: Object.freeze([0.15]), minBondLevel: 0 }),
    long: Object.freeze({ activeMinutes: 60, materials: 18, stardust: 3, xp: 8, woundChance: 0.20, woundHurt: Object.freeze([0.15, 0.35]), minBondLevel: 2 }),
  }) as Readonly<Record<CompanionMissionLengthV1, MissionLengthRateV1>>,
  /** Devoted (bond 3) halves the wound chance. */
  devotedBondLevel: 3,
  devotedWoundFactor: 0.5,
  /** A companion at Injured or worse must Rest before a field mission. */
  maxDispatchHurt: COMPANION_INJURED_HURT_V1,
});

/** The authored Survey lore lines (a survey never names or reveals a species). */
export const COMPANION_MISSION_LORE_V1 = Object.freeze([
  'Found a ridge where the wind had carved the rock into long, patient grooves.',
  'Followed a dry channel to where water must once have run for a very long time.',
  'Watched the light change over a wide plain until the shadows came back.',
  'Crossed old ground where something had grazed in slow, careful circles.',
  'Waited out a storm in a hollow and came back smelling of wet stone.',
  'Traced a line of bright minerals along a cliff face to its end.',
  'Found a quiet place where the ground was warm and nothing moved for hours.',
  'Came back with the dust of a high pass still caught in its coat.',
] as const);

export interface CompanionMissionSealedV1 {
  readonly materials: readonly (readonly [string, number])[];
  readonly stardust: number;
  readonly xp: number;
  /** 0 = unhurt; otherwise the wound band this mission leaves. */
  readonly hurt: number;
  readonly loreIndex: number | null;
}

export interface CompanionMissionOfferV1 {
  readonly type: CompanionMissionTypeV1;
  readonly length: CompanionMissionLengthV1;
  readonly activeMinutes: number;
  /** The wound chance shown BEFORE dispatch (after Devoted). */
  readonly woundChance: number;
  readonly unlocked: boolean;
}

const round6 = (v: number): number => Math.round(v * 1e6) / 1e6;
const draw = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('companion mission draw must be in [0, 1)');
  return value;
};

export function companionMissionIdV1(receiptOrdinal: number): string {
  if (!Number.isSafeInteger(receiptOrdinal) || receiptOrdinal < 0) throw new RangeError('companion mission receipt ordinal is invalid');
  return `${COMPANION_MISSION_PREFIX_V1}${receiptOrdinal}`;
}
export function isCompanionFieldMissionIdV1(missionId: string): boolean { return /^mission:\d{1,16}$/u.test(missionId) && !missionId.startsWith(COMPANION_REST_MISSION_PREFIX_V1); }

export function companionMissionWoundChanceV1(length: CompanionMissionLengthV1, bond: CompanionBondV1 | null): number {
  const rate = MISSION_RATES_V1.lengths[length];
  const level = companionBondLevelV1(bond?.memories.length ?? 0);
  return round6(rate.woundChance * (level >= MISSION_RATES_V1.devotedBondLevel ? MISSION_RATES_V1.devotedWoundFactor : 1));
}

/** Every mission offer for this companion, with its disclosed wound chance and whether its bond unlocks it. */
export function companionMissionOffersV1(creature: Pick<CreatureInstanceV1, 'bond'>): readonly CompanionMissionOfferV1[] {
  const level = companionBondLevelV1(creature.bond?.memories.length ?? 0);
  const out: CompanionMissionOfferV1[] = [];
  for (const type of COMPANION_MISSION_TYPES_V1) for (const length of COMPANION_MISSION_LENGTHS_V1) {
    const rate = MISSION_RATES_V1.lengths[length];
    out.push(Object.freeze({ type, length, activeMinutes: rate.activeMinutes, woundChance: companionMissionWoundChanceV1(length, creature.bond), unlocked: level >= rate.minBondLevel }));
  }
  return Object.freeze(out);
}

/** The sealed result, from exactly three `companion-mission` draws (wound, deposit pick, lore pick). */
export function sealCompanionMissionV1(input: Readonly<{
  type: CompanionMissionTypeV1; length: CompanionMissionLengthV1; bond: CompanionBondV1 | null;
  deposits: readonly string[]; draws: readonly [number, number, number];
}>): CompanionMissionSealedV1 {
  const rate = MISSION_RATES_V1.lengths[input.length];
  if (rate === undefined || !(COMPANION_MISSION_TYPES_V1 as readonly string[]).includes(input.type)) throw new TypeError('companion mission type or length is invalid');
  const [w, pick, lore] = [draw(input.draws[0]), draw(input.draws[1]), draw(input.draws[2])];
  const chance = companionMissionWoundChanceV1(input.length, input.bond);
  let hurt = 0;
  if (w < chance && rate.woundHurt.length > 0) {
    // the heavier band is the lower half of the wound roll (Long: Injured half the time a wound lands)
    hurt = rate.woundHurt.length === 1 ? rate.woundHurt[0]! : (w < chance / 2 ? rate.woundHurt[rate.woundHurt.length - 1]! : rate.woundHurt[0]!);
  }
  let materials: (readonly [string, number])[] = [];
  if (input.type === 'prospect') {
    const deposits = [...new Set(input.deposits)];
    if (deposits.length === 0) throw new RangeError('companion mission Prospect needs a world with deposits');
    const count = hurt > 0 ? Math.floor(rate.materials / 2) : rate.materials;
    const first = Math.floor(pick * deposits.length) % deposits.length, second = (first + 1) % deposits.length;
    const main = deposits.length === 1 ? count : Math.ceil((count * 2) / 3), rest = count - main;
    const rows = new Map<string, number>();
    if (main > 0) rows.set(deposits[first]!, main);
    if (rest > 0) rows.set(deposits[second]!, (rows.get(deposits[second]!) ?? 0) + rest);
    materials = [...rows.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([id, n]) => Object.freeze([id, n] as const));
  }
  return Object.freeze({
    materials: Object.freeze(materials),
    stardust: input.type === 'survey' ? rate.stardust : 0,
    xp: rate.xp,
    hurt,
    loreIndex: input.type === 'survey' ? Math.floor(lore * COMPANION_MISSION_LORE_V1.length) % COMPANION_MISSION_LORE_V1.length : null,
  });
}

export type CompanionMissionDispatchRefusalV1 =
  | 'creature-not-found' | 'creature-exhibit' | 'creature-assigned' | 'creature-injured' | 'bond-too-low' | 'clock-exhausted';

/** Why this companion cannot take this length now, or null. `activePlayMs` is the committed snapshot. */
export function companionMissionDispatchRefusalV1(ownership: OwnershipStateV2, creatureId: string, length: CompanionMissionLengthV1, activePlayMs: number): CompanionMissionDispatchRefusalV1 | null {
  const creature = ownership.creatures.find((row) => row.creatureId === creatureId);
  if (creature === undefined) return 'creature-not-found';
  if (creature.genome.exhibit === true) return 'creature-exhibit';
  if (projectCompanionAvailabilityV1(creature, activePlayMs).blocks.dispatch) return 'creature-assigned';
  if ((creature.hurt ?? 0) >= MISSION_RATES_V1.maxDispatchHurt) return 'creature-injured';
  if (companionBondLevelV1(creature.bond?.memories.length ?? 0) < MISSION_RATES_V1.lengths[length].minBondLevel) return 'bond-too-low';
  if (activePlayMs + MISSION_RATES_V1.lengths[length].activeMinutes * 60_000 > MAX_ACTIVE_PLAY_MS) return 'clock-exhausted';
  return null;
}

function successor(parent: OwnershipStateV2, creatureAfter: CreatureInstanceV1): OwnershipStateV2 {
  return createOwnershipSuccessorV2(parent, {
    source: ownershipSourceStateV1(parent),
    bredAcquisitions: parent.bredAcquisitions,
    creatures: parent.creatures.map((row) => (row.creatureId === creatureAfter.creatureId ? creatureAfter : row)),
    creatureTombstones: parent.creatureTombstones,
    specimenLots: parent.specimenLots,
    specimenTombstones: parent.specimenTombstones,
    scoutCreatureId: parent.scoutCreatureId,
  });
}

/** Dispatch: the companion takes the `mission:<ordinal>` assignment. Nothing else about it changes. */
export function companionMissionDispatchSuccessorV1(parent: OwnershipStateV2, creatureId: string, missionId: string): Readonly<{ creatureBefore: CreatureInstanceV1; creatureAfter: CreatureInstanceV1; successor: OwnershipStateV2 }> {
  if (!isCompanionFieldMissionIdV1(missionId)) throw new TypeError('companion mission ID is invalid');
  const before = parent.creatures.find((row) => row.creatureId === creatureId);
  if (before === undefined) throw new Error('companion mission creature is not owned');
  const after = createCreatureInstanceV2({ ...before, assignment: { kind: 'mission', missionId } });
  return Object.freeze({ creatureBefore: before, creatureAfter: after, successor: successor(parent, after) });
}

export const companionMissionTypeMemoryIdV1 = (type: CompanionMissionTypeV1): string => `mission:first:${type}`;
export const companionMissionWorldMemoryIdV1 = (worldKey: string): string => `mission:world:${worldKey}`;
export const COMPANION_MISSION_LONG_MEMORY_V1 = 'mission:first:long' as const;
export const companionMissionMementoIdV1 = (worldKey: string): string => `memento:mission:${worldKey}`;
const MEMENTO_MAX = 128;

/** Claim: the companion comes home with the sealed XP and wound, and its bond gains the mission's firsts; the first Long
 * return from a world also adds a memento. Returns the memento ID it added (null when none). */
export function companionMissionClaimSuccessorV1(parent: OwnershipStateV2, input: Readonly<{
  creatureId: string; missionId: string; type: CompanionMissionTypeV1; length: CompanionMissionLengthV1; worldKey: string;
  sealed: CompanionMissionSealedV1; activePlayMs: number;
}>): Readonly<{ creatureBefore: CreatureInstanceV1; creatureAfter: CreatureInstanceV1; successor: OwnershipStateV2; memento: string | null }> {
  const before = parent.creatures.find((row) => row.creatureId === input.creatureId);
  if (before === undefined) throw new Error('companion mission creature is not owned');
  if (before.assignment?.kind !== 'mission' || before.assignment.missionId !== input.missionId) throw new Error('companion mission assignment does not match');
  let bond = withCompanionBondMemoriesV1(before.bond, [
    { id: companionMissionTypeMemoryIdV1(input.type), kind: 'mission' },
    { id: companionMissionWorldMemoryIdV1(input.worldKey), kind: 'mission', worldKey: input.worldKey },
    ...(input.length === 'long' ? [{ id: COMPANION_MISSION_LONG_MEMORY_V1, kind: 'mission' }] : []),
  ], input.activePlayMs);
  let memento: string | null = null;
  if (input.length === 'long' && bond !== null) {
    const id = companionMissionMementoIdV1(input.worldKey);
    if (!bond.mementoIds.includes(id) && bond.mementoIds.length < MEMENTO_MAX) {
      memento = id;
      bond = Object.freeze({ ...bond, mementoIds: Object.freeze([...bond.mementoIds, id]) });
    }
  }
  const after = createCreatureInstanceV2({
    ...before,
    assignment: null,
    xp: input.sealed.xp > 0 ? Math.min(COMPANION_XP_MAX_V1, (before.xp ?? 0) + input.sealed.xp) : before.xp,
    hurt: input.sealed.hurt > 0 ? Math.max(before.hurt ?? 0, input.sealed.hurt) : before.hurt,
    bond,
  });
  return Object.freeze({ creatureBefore: before, creatureAfter: after, successor: successor(parent, after), memento });
}

/** Recall: home unhurt with nothing (the sealed result is discarded unseen). */
export function companionMissionRecallSuccessorV1(parent: OwnershipStateV2, creatureId: string, missionId: string): Readonly<{ creatureBefore: CreatureInstanceV1; creatureAfter: CreatureInstanceV1; successor: OwnershipStateV2 }> {
  const before = parent.creatures.find((row) => row.creatureId === creatureId);
  if (before === undefined) throw new Error('companion mission creature is not owned');
  if (before.assignment?.kind !== 'mission' || before.assignment.missionId !== missionId) throw new Error('companion mission assignment does not match');
  const after = createCreatureInstanceV2({ ...before, assignment: null });
  return Object.freeze({ creatureBefore: before, creatureAfter: after, successor: successor(parent, after) });
}

/** The proposal's ceiling, as numbers: materials and Stardust per active hour with every field slot on the best Long mission. */
export function companionMissionHourlyCeilingV1(): Readonly<{ materials: number; stardust: number }> {
  const long = MISSION_RATES_V1.lengths.long, perHour = 60 / long.activeMinutes;
  return Object.freeze({ materials: long.materials * perHour * MISSION_RATES_V1.fieldSlots, stardust: long.stardust * perHour * MISSION_RATES_V1.fieldSlots });
}
