/* D13 / N3 stage 1: companion care — tastes, the deterministic Feed policy v2, Rest duration and bond levels.

   Pure and deterministic (rule 1): every value derives from the companion's genome, the flora's genome, the
   companion's own bond memories and an active-play clock value the caller passes in. No Date.now, no
   Math.random, no device state. Tastes are lifted VERBATIM from v1.8.9 `faunaTastes` (parity-tested against the
   tracked legacy script), so a companion likes and dislikes exactly what it did in v1. What v1 rolled — the meal's
   event, poison and death — is gone for companions (Nick, D13): a meal's effect follows the taste table below.
   Bond grows only from distinct firsts and never decays or multiplies combat stats. */
import { mulberry32 } from '@cf/domain-rand';
import { STAT_KEYS } from '@cf/domain-speciestraits';
import { floraStat } from '@cf/domain-strays';
import { speciesGrade, type Genome } from '@cf/domain-genome';
import type { CompanionBondMemoryV1, CompanionBondV1, CreatureInstanceV1 } from './model.js';

export type CompanionFlavourV1 = 'vit' | 'fer' | 'res' | 'agi' | 'ins';
export type CompanionTastePreferenceV1 = 'loved' | 'neutral' | 'disliked';
/** v1's STAT_NAMES for the five stat keys (the flavour a flora nourishes). */
export const COMPANION_FLAVOUR_NAMES_V1: Readonly<Record<CompanionFlavourV1, string>> = Object.freeze({
  vit: 'Vitality', fer: 'Ferocity', res: 'Resilience', agi: 'Agility', ins: 'Instinct',
});

/** v1.8.9 `faunaTastes`, verbatim: two liked flavours and one disliked, seeded by the genome. */
export function faunaTastesV1(g: Readonly<{ seed?: unknown }>): Readonly<{ likes: readonly [CompanionFlavourV1, CompanionFlavourV1]; dislikes: readonly [CompanionFlavourV1] }> {
  const r = mulberry32(((((g as { seed: number }).seed) >>> 0) ^ 0xFEED) >>> 0);
  const ks = STAT_KEYS.slice() as CompanionFlavourV1[];
  for (let i = ks.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = ks[i]!; ks[i] = ks[j]!; ks[j] = t; }
  return Object.freeze({ likes: Object.freeze([ks[0]!, ks[1]!] as const), dislikes: Object.freeze([ks[4]!] as const) });
}

export interface CompanionMealTasteV1 {
  readonly flavour: CompanionFlavourV1;
  readonly preference: CompanionTastePreferenceV1;
  /** The flora's grade tier (v1 `floraEntry.grade.tier`). */
  readonly floraTier: number;
}

/** The taste of one flora for one companion: v1's `feedPair` preference rule, without its roll. */
export function companionMealTasteV1(creatureGenome: Readonly<{ seed?: unknown }>, floraGenome: Readonly<Record<string, unknown>>): CompanionMealTasteV1 {
  const flavour = floraStat(floraGenome as { seed?: number }) as CompanionFlavourV1;
  if (!(STAT_KEYS as readonly string[]).includes(flavour)) throw new TypeError('companion meal: flora flavour is invalid');
  const floraTier = speciesGrade(floraGenome as unknown as Genome).tier;
  if (!Number.isSafeInteger(floraTier) || floraTier < 0 || floraTier > 14) throw new TypeError('companion meal: flora tier is invalid');
  const tastes = faunaTastesV1(creatureGenome);
  const preference: CompanionTastePreferenceV1 = tastes.likes.includes(flavour) ? 'loved' : tastes.dislikes.includes(flavour) ? 'disliked' : 'neutral';
  return Object.freeze({ flavour, preference, floraTier });
}

/* ---------- Feed policy v2 (N3 §4 table; deterministic, no companion poison) ---------- */
export const COMPANION_FEED_POLICY_V2 = Object.freeze({
  loved: Object.freeze({ fed: 2, fedRare: 3, rareTier: 4, mend: 0.25 }),
  neutral: Object.freeze({ fed: 1, fedRare: 1, rareTier: Infinity, mend: 0.10 }),
  disliked: Object.freeze({ fed: 0, fedRare: 0, rareTier: Infinity, mend: 0 }),
});
/** First-time care XP, each keyed on a bond memory so it is paid once per companion for life (≤ 1 + 5 × 2 = 11). */
export const COMPANION_CARE_XP_V1 = Object.freeze({ firstMeal: 1, newFlavour: 2 });
export const COMPANION_XP_MAX_V1 = 486;
export const COMPANION_FIRST_MEAL_MEMORY_V1 = 'meal:first' as const;
export const companionTasteMemoryIdV1 = (flavour: CompanionFlavourV1): string => `taste:${flavour}`;

const round6 = (v: number): number => Math.round(v * 1e6) / 1e6;

export interface CompanionMealOutcomeV1 {
  readonly taste: CompanionMealTasteV1;
  readonly fedGain: number;
  readonly hurtBefore: number;
  readonly hurtAfter: number;
  readonly xpGain: number;
  /** Bond memories this meal creates (only firsts the companion does not already hold). */
  readonly newMemories: readonly Readonly<{ id: string; kind: string }>[];
}

/** The deterministic meal outcome for this companion and this flora (the caller applies the 200 fed cap). */
export function companionMealOutcomeV2(creature: Pick<CreatureInstanceV1, 'genome' | 'hurt' | 'bond'>, floraGenome: Readonly<Record<string, unknown>>): CompanionMealOutcomeV1 {
  const taste = companionMealTasteV1(creature.genome as unknown as { seed?: unknown }, floraGenome);
  const row = COMPANION_FEED_POLICY_V2[taste.preference];
  const fedGain = taste.floraTier >= row.rareTier ? row.fedRare : row.fed;
  const hurtBefore = creature.hurt ?? 0;
  const hurtAfter = round6(Math.max(0, hurtBefore - row.mend));
  const held = new Set((creature.bond?.memories ?? []).map((m) => m.id));
  const newMemories: { id: string; kind: string }[] = [];
  let xpGain = 0;
  if (!held.has(COMPANION_FIRST_MEAL_MEMORY_V1)) { newMemories.push({ id: COMPANION_FIRST_MEAL_MEMORY_V1, kind: 'meal' }); xpGain += COMPANION_CARE_XP_V1.firstMeal; }
  const tasteId = companionTasteMemoryIdV1(taste.flavour);
  if (!held.has(tasteId)) { newMemories.push({ id: tasteId, kind: 'taste' }); xpGain += COMPANION_CARE_XP_V1.newFlavour; }
  return Object.freeze({ taste, fedGain, hurtBefore, hurtAfter, xpGain, newMemories: Object.freeze(newMemories.map((m) => Object.freeze(m))) });
}

/* ---------- Taste projection (known vs hidden) ---------- */
export interface CompanionTasteSlotV1 { readonly known: boolean; readonly flavour: CompanionFlavourV1 | null; readonly name: string | null; }
export interface CompanionTasteProjectionV1 {
  readonly likes: readonly CompanionTasteSlotV1[];
  readonly dislikes: readonly CompanionTasteSlotV1[];
  /** Every flavour this companion has tasted (loved, neutral or disliked), in STAT_KEYS order. */
  readonly tasted: readonly CompanionFlavourV1[];
}
/** A flavour stays hidden until this companion has eaten a flora of it (its `taste:<flavour>` bond memory). */
export function projectCompanionTastesV1(creature: Pick<CreatureInstanceV1, 'genome' | 'bond'>): CompanionTasteProjectionV1 {
  const tastes = faunaTastesV1(creature.genome as unknown as { seed?: unknown });
  const held = new Set((creature.bond?.memories ?? []).map((m) => m.id));
  const slot = (flavour: CompanionFlavourV1): CompanionTasteSlotV1 => held.has(companionTasteMemoryIdV1(flavour))
    ? Object.freeze({ known: true, flavour, name: COMPANION_FLAVOUR_NAMES_V1[flavour] })
    : Object.freeze({ known: false, flavour: null, name: null });
  return Object.freeze({
    likes: Object.freeze(tastes.likes.map(slot)),
    dislikes: Object.freeze(tastes.dislikes.map(slot)),
    tasted: Object.freeze((STAT_KEYS as readonly CompanionFlavourV1[]).filter((k) => held.has(companionTasteMemoryIdV1(k)))),
  });
}

/* ---------- Bond (levels 0–5 from distinct firsts; sidegrades only) ---------- */
export interface CompanionBondLevelV1 { readonly level: number; readonly name: string; readonly memories: number; readonly unlock: string | null; }
export const COMPANION_BOND_LEVELS_V1: readonly CompanionBondLevelV1[] = Object.freeze([
  Object.freeze({ level: 0, name: 'Wary', memories: 0, unlock: null }),
  Object.freeze({ level: 1, name: 'Familiar', memories: 3, unlock: 'Greets you when you open its card; ♥ on the tastes you know' }),
  Object.freeze({ level: 2, name: 'Trusted', memories: 8, unlock: 'Can take Long missions' }),
  Object.freeze({ level: 3, name: 'Devoted', memories: 15, unlock: 'Half the wound chance on missions' }),
  Object.freeze({ level: 4, name: 'Kindred', memories: 25, unlock: 'A preferred mission type and a memento shelf' }),
  Object.freeze({ level: 5, name: 'Soulbound', memories: 40, unlock: 'Its own bonded call and a portrait frame' }),
]);
export const COMPANION_BOND_MEMORY_MAX_V1 = 128;

export function companionBondLevelV1(memoryCount: number): number {
  let level = 0;
  for (const row of COMPANION_BOND_LEVELS_V1) if (memoryCount >= row.memories) level = row.level;
  return level;
}

export interface CompanionBondProjectionV1 {
  readonly level: number;
  readonly name: string;
  readonly memories: number;
  readonly next: Readonly<{ level: number; name: string; memories: number; remaining: number; unlock: string }> | null;
}
/** `bond: null` is level 0 (Wary) with no memories. The level is always recomputed from the memories. */
export function projectCompanionBondV1(bond: CompanionBondV1 | null): CompanionBondProjectionV1 {
  const count = bond?.memories.length ?? 0, level = companionBondLevelV1(count), row = COMPANION_BOND_LEVELS_V1[level]!, next = COMPANION_BOND_LEVELS_V1[level + 1];
  return Object.freeze({ level, name: row.name, memories: count,
    next: next ? Object.freeze({ level: next.level, name: next.name, memories: next.memories, remaining: next.memories - count, unlock: next.unlock! }) : null });
}

/** A new bond value with these firsts added (a memory the companion already holds adds nothing; never decays). */
export function withCompanionBondMemoriesV1(bond: CompanionBondV1 | null, adds: readonly Readonly<{ id: string; kind: string; worldKey?: string | null }>[], atActivePlayMs: number): CompanionBondV1 | null {
  if (!Number.isSafeInteger(atActivePlayMs) || atActivePlayMs < 0) throw new RangeError('bond memory active-play time is invalid');
  const held = new Set((bond?.memories ?? []).map((m) => m.id)), memories: CompanionBondMemoryV1[] = [...(bond?.memories ?? [])];
  for (const add of adds) {
    if (held.has(add.id) || memories.length >= COMPANION_BOND_MEMORY_MAX_V1) continue;
    held.add(add.id); memories.push(Object.freeze({ id: add.id, kind: add.kind, worldKey: add.worldKey ?? null, atActivePlayMs }));
  }
  if (bond === null && memories.length === 0) return null;
  return Object.freeze({
    level: companionBondLevelV1(memories.length), memories: Object.freeze(memories),
    preferredRole: bond?.preferredRole ?? null, worldsSurvived: bond?.worldsSurvived ?? 0, guardianVictories: bond?.guardianVictories ?? 0,
    mementoIds: bond?.mementoIds ?? Object.freeze([]),
  });
}

/* ---------- Rest (heals on the active-play clock) ---------- */
/** Rest takes 2 active minutes per 0.1 of `hurt`, rounded up, at most 20 minutes. */
export const COMPANION_REST_MS_PER_TENTH_V1 = 120_000;
export const COMPANION_REST_MAX_MS_V1 = 20 * 60_000;
export const COMPANION_REST_MISSION_PREFIX_V1 = 'rest:' as const;
/** The first recovery from Injured or worse (v1 `creatureCondition` Injured starts at 0.3) is a bond memory. */
export const COMPANION_INJURED_HURT_V1 = 0.3;
export const COMPANION_RECOVERED_MEMORY_V1 = 'recovered:injured' as const;

export function companionRestDurationMsV1(hurt: number | null): number {
  const h = hurt ?? 0;
  if (!Number.isFinite(h) || h <= 0) return 0;
  return Math.min(COMPANION_REST_MAX_MS_V1, Math.ceil(round6(h / 0.1)) * COMPANION_REST_MS_PER_TENTH_V1);
}
export function companionRestMissionIdV1(readyAtActivePlayMs: number): string { return `${COMPANION_REST_MISSION_PREFIX_V1}${readyAtActivePlayMs}`; }
/** The Rest boundary a mission assignment encodes, or null when it is not a Rest. */
export function companionRestReadyAtV1(missionId: string): number | null {
  const m = /^rest:(\d{1,16})$/u.exec(missionId); if (m === null) return null;
  const v = Number(m[1]); return Number.isSafeInteger(v) ? v : null;
}
