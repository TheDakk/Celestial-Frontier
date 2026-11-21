/* Arc 5 explorer flora-meal authority.

   One exact owned flora lot is inspected without drawing. Settlement ports
   the legacy healExplorer arithmetic verbatim: the lot is always consumed,
   poison uses the unboosted heal base and cannot reduce a living explorer
   below one HP, while a safe meal heals and grows one deterministic stat.
   The Xenobotany and worn-gear facts are supplied by the app only after it
   has rebound their registered persistence authorities. */
import { speciesGrade, type Genome } from '@cf/domain-genome';
import { floraStat } from '@cf/domain-strays';
import {
  MAX_OWNERSHIP_REVISION,
  type CatalogSpeciesV1,
  type SpecimenLotId,
  type SpecimenLotV1,
} from './model.js';
import {
  LAST_USABLE_F4_RECEIPT_ORDINAL_V2,
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

export const ARC5_EXPLORER_MEAL_ACTION_KIND_V1 = 'explorer-flora-meal' as const;
export const ARC5_EXPLORER_MEAL_RECEIPT_KIND_V1 = 'arc5-explorer-flora-meal' as const;
export const ARC5_EXPLORER_STAT_MAX_V1 = 330 as const;

export const ARC5_EXPLORER_STAT_KEYS_V1 = Object.freeze([
  'vit', 'fer', 'res', 'agi', 'ins',
] as const);
export type Arc5ExplorerStatKeyV1 = (typeof ARC5_EXPLORER_STAT_KEYS_V1)[number];

export interface Arc5ExplorerStatsV1 {
  readonly vit: number;
  readonly fer: number;
  readonly res: number;
  readonly agi: number;
  readonly ins: number;
}

export interface Arc5ExplorerPhysiologyV1 {
  readonly hp: number;
  readonly hpMax: number;
  readonly stats: Arc5ExplorerStatsV1;
}

export type Arc5ExplorerMealRefusalReasonV1 =
  | 'input-invalid'
  | 'ownership-invalid'
  | 'ownership-protected'
  | 'ownership-revision-exhausted'
  | 'food-not-found'
  | 'food-not-flora'
  | 'food-species-not-found'
  | 'food-species-not-flora'
  | 'food-genome-invalid';

export interface Arc5ExplorerMealPreflightV1 {
  readonly schema: 'cf-v2-arc5-explorer-meal-preflight/v1';
  readonly parentRevision: number;
  readonly parentDigest: string;
  readonly foodLotId: SpecimenLotId;
  readonly speciesId: string;
  readonly foodQuantityBefore: number;
  readonly foodQuantityAfter: number;
  readonly floraTier: number;
  readonly nourishedStat: Arc5ExplorerStatKeyV1;
  readonly poisonChance: number;
  readonly healBase: number;
}

export type Arc5ExplorerMealPreflightOutcomeV1 =
  | Readonly<{ kind: 'ready'; preflight: Arc5ExplorerMealPreflightV1 }>
  | Readonly<{ kind: 'refused'; reason: Arc5ExplorerMealRefusalReasonV1 }>;

export interface Arc5ExplorerMealPreviewV1 {
  readonly schema: 'cf-v2-arc5-explorer-meal-preview/v1';
  readonly preflight: Arc5ExplorerMealPreflightV1;
  readonly physiologyBefore: Arc5ExplorerPhysiologyV1;
  readonly explorerMealHealBonus: number;
  readonly xenobotanyLab: boolean;
  readonly healAmount: number;
  readonly nourishment: number;
  readonly statIncrease: number;
  readonly poisonDamage: number;
}

export interface Arc5ExplorerMealConsequenceV1 {
  readonly schema: 'cf-v2-arc5-explorer-meal-consequence/v1';
  readonly poisoned: boolean;
  readonly outcomeDraw: number;
  readonly hpBefore: number;
  readonly hpAfter: number;
  readonly hpMaxBefore: number;
  readonly hpMaxAfter: number;
  readonly statsBefore: Arc5ExplorerStatsV1;
  readonly statsAfter: Arc5ExplorerStatsV1;
  readonly healAmount: number;
  readonly healed: number;
  readonly poisonDamage: number;
  readonly damageTaken: number;
  readonly nourishedStat: Arc5ExplorerStatKeyV1;
  readonly nourishment: number;
  readonly statIncrease: number;
  readonly brink: boolean;
}

export interface Arc5ExplorerMealSettlementV1 {
  readonly schema: 'cf-v2-arc5-explorer-meal-settlement/v1';
  readonly preflight: Arc5ExplorerMealPreflightV1;
  readonly consequence: Arc5ExplorerMealConsequenceV1;
  readonly receiptEvidence: F4ReceiptEvidenceV2;
  readonly foodBefore: SpecimenLotV1;
  readonly foodAfter: SpecimenLotV1 | null;
  readonly foodTombstone: SpecimenTombstoneV2 | null;
  readonly successor: OwnershipStateV2;
  readonly witness: string;
}

interface MealPreflightAuthorityV1 {
  readonly parent: OwnershipStateV2;
  readonly food: SpecimenLotV1;
  readonly species: CatalogSpeciesV1;
}

const PREFLIGHTS = new WeakMap<object, MealPreflightAuthorityV1>();

function refused(reason: Arc5ExplorerMealRefusalReasonV1): Arc5ExplorerMealPreflightOutcomeV1 {
  return Object.freeze({ kind: 'refused', reason });
}

function exactFoodLotId(value: unknown): SpecimenLotId | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 1 || keys[0] !== 'foodLotId') return null;
  const descriptor = Object.getOwnPropertyDescriptor(value, 'foodLotId');
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
    || typeof descriptor.value !== 'string'
    || !/^specimen-v1:[0-9a-f]{64}$/u.test(descriptor.value)) return null;
  return descriptor.value as SpecimenLotId;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function checkedStats(value: Arc5ExplorerStatsV1): Arc5ExplorerStatsV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)) {
    throw new TypeError('explorer stats must be plain data');
  }
  const keys = Reflect.ownKeys(value);
  const expected = [...ARC5_EXPLORER_STAT_KEYS_V1].sort();
  const names = keys.filter((key): key is string => typeof key === 'string').sort();
  if (keys.length !== expected.length
    || names.some((name, index) => name !== expected[index])) {
    throw new TypeError('explorer stats must contain exactly the five battle stats');
  }
  const stats = Object.fromEntries(ARC5_EXPLORER_STAT_KEYS_V1.map((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
      || !Number.isSafeInteger(descriptor.value)
      || descriptor.value < 1 || descriptor.value > ARC5_EXPLORER_STAT_MAX_V1) {
      throw new RangeError(`explorer ${key} must be an integer from 1 through 330`);
    }
    return [key, descriptor.value];
  })) as unknown as Arc5ExplorerStatsV1;
  return Object.freeze(stats);
}

function checkedPhysiology(value: Arc5ExplorerPhysiologyV1): Arc5ExplorerPhysiologyV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)
    || Reflect.ownKeys(value).length !== 3) {
    throw new TypeError('explorer physiology must be exact plain data');
  }
  const descriptors = ['hp', 'hpMax', 'stats'].map((key) =>
    Object.getOwnPropertyDescriptor(value, key));
  if (descriptors.some((descriptor) => !descriptor || !('value' in descriptor)
    || descriptor.enumerable !== true)) {
    throw new TypeError('explorer physiology cannot contain accessors or hidden fields');
  }
  const stats = checkedStats(value.stats);
  const expectedMax = Math.max(20, Math.round(stats.vit * 2));
  if (!Number.isSafeInteger(value.hpMax) || value.hpMax !== expectedMax) {
    throw new RangeError('explorer max HP must equal the vitality-derived maximum');
  }
  if (!Number.isSafeInteger(value.hp) || value.hp < 1 || value.hp > value.hpMax) {
    throw new RangeError('explorer HP must be a living bounded integer');
  }
  return Object.freeze({ hp: value.hp, hpMax: value.hpMax, stats });
}

function checkedHealBonus(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('explorer meal healing bonus must be finite and non-negative');
  }
  return value;
}

function preflightAuthority(preflight: Arc5ExplorerMealPreflightV1): MealPreflightAuthorityV1 {
  const authority = preflight && typeof preflight === 'object'
    ? PREFLIGHTS.get(preflight)
    : undefined;
  if (authority === undefined) {
    throw new TypeError('Arc 5 explorer meal preflight must be owner-minted');
  }
  return authority;
}

/** Inspect one exact owned flora lot without consuming an outcome draw. */
export function preflightArc5ExplorerMealV1(
  parent: OwnershipStateV2,
  target: Readonly<{ readonly foodLotId: SpecimenLotId }>,
): Arc5ExplorerMealPreflightOutcomeV1 {
  if (!isOwnershipStateV2(parent)) return refused('ownership-invalid');
  if (parent.mode !== 'current') return refused('ownership-protected');
  if (parent.revision === MAX_OWNERSHIP_REVISION) {
    return refused('ownership-revision-exhausted');
  }
  const foodLotId = exactFoodLotId(target);
  if (foodLotId === null) return refused('input-invalid');
  const food = parent.specimenLots.find((row) => row.lotId === foodLotId);
  if (food === undefined) return refused('food-not-found');
  if (food.kind !== 'flora') return refused('food-not-flora');
  const species = parent.catalogSpecies.find((row) => row.speciesId === food.speciesId);
  if (species === undefined) return refused('food-species-not-found');
  if (species.kingdom !== 'flora') return refused('food-species-not-flora');
  try {
    const floraTier = speciesGrade(species.genome as unknown as Genome).tier;
    const nourishedStat = floraStat(species.genome) as Arc5ExplorerStatKeyV1;
    if (!Number.isSafeInteger(floraTier) || floraTier < 0 || floraTier > 14
      || !ARC5_EXPLORER_STAT_KEYS_V1.includes(nourishedStat)) {
      return refused('food-genome-invalid');
    }
    const poisonChance = clamp(0.08 + floraTier * 0.07, 0.05, 0.6);
    const healBase = Math.round(12 + floraTier * 9 + poisonChance * 30);
    const preflight: Arc5ExplorerMealPreflightV1 = Object.freeze({
      schema: 'cf-v2-arc5-explorer-meal-preflight/v1',
      parentRevision: parent.revision,
      parentDigest: ownershipStateDigestV2(parent),
      foodLotId,
      speciesId: food.speciesId,
      foodQuantityBefore: food.quantity,
      foodQuantityAfter: food.quantity - 1,
      floraTier,
      nourishedStat,
      poisonChance,
      healBase,
    });
    PREFLIGHTS.set(preflight, Object.freeze({ parent, food, species }));
    return Object.freeze({ kind: 'ready', preflight });
  } catch {
    return refused('food-genome-invalid');
  }
}

/** Project the exact card-facing heal/risk/stat values without choosing an outcome. */
export function projectArc5ExplorerMealPreviewV1(
  preflight: Arc5ExplorerMealPreflightV1,
  physiology: Arc5ExplorerPhysiologyV1,
  explorerMealHealBonus: number,
  xenobotanyLab: boolean,
): Arc5ExplorerMealPreviewV1 {
  preflightAuthority(preflight);
  const checked = checkedPhysiology(physiology);
  const healBonus = checkedHealBonus(explorerMealHealBonus);
  if (typeof xenobotanyLab !== 'boolean') {
    throw new TypeError('Xenobotany ownership must be boolean');
  }
  const healAmount = Math.round(preflight.healBase * (1 + healBonus));
  if (!Number.isSafeInteger(healAmount) || healAmount < 0) {
    throw new RangeError('explorer meal healing exceeds the safe integer range');
  }
  const nourishment = 1 + preflight.floraTier + (xenobotanyLab ? 1 : 0);
  const statIncrease = Math.min(
    nourishment,
    ARC5_EXPLORER_STAT_MAX_V1 - checked.stats[preflight.nourishedStat],
  );
  return Object.freeze({
    schema: 'cf-v2-arc5-explorer-meal-preview/v1',
    preflight,
    physiologyBefore: checked,
    explorerMealHealBonus: healBonus,
    xenobotanyLab,
    healAmount,
    nourishment,
    statIncrease,
    poisonDamage: Math.ceil(preflight.healBase * 0.6),
  });
}

function consequenceFrom(
  preview: Arc5ExplorerMealPreviewV1,
  outcomeDraw: number,
): Arc5ExplorerMealConsequenceV1 {
  if (!Number.isFinite(outcomeDraw) || outcomeDraw < 0 || outcomeDraw >= 1) {
    throw new RangeError('explorer meal outcome draw must be in [0, 1)');
  }
  const { preflight, physiologyBefore } = preview;
  const poisoned = outcomeDraw < preflight.poisonChance;
  const statsAfter = { ...physiologyBefore.stats };
  let hpAfter = physiologyBefore.hp;
  let hpMaxAfter = physiologyBefore.hpMax;
  let damageTaken = 0;
  let healed = 0;
  let statIncrease = 0;
  if (poisoned) {
    damageTaken = Math.min(preview.poisonDamage, Math.max(0, physiologyBefore.hp - 1));
    hpAfter -= damageTaken;
  } else {
    const healedHp = Math.min(physiologyBefore.hpMax, physiologyBefore.hp + preview.healAmount);
    healed = healedHp - physiologyBefore.hp;
    hpAfter = healedHp;
    const stat = preflight.nourishedStat;
    statsAfter[stat] = Math.min(
      ARC5_EXPLORER_STAT_MAX_V1,
      statsAfter[stat] + preview.nourishment,
    );
    statIncrease = statsAfter[stat] - physiologyBefore.stats[stat];
    if (stat === 'vit') {
      hpMaxAfter = Math.max(20, Math.round(statsAfter.vit * 2));
      if (hpMaxAfter > physiologyBefore.hpMax) {
        hpAfter = Math.min(hpMaxAfter, hpAfter + (hpMaxAfter - physiologyBefore.hpMax));
      }
    }
  }
  return Object.freeze({
    schema: 'cf-v2-arc5-explorer-meal-consequence/v1',
    poisoned,
    outcomeDraw,
    hpBefore: physiologyBefore.hp,
    hpAfter,
    hpMaxBefore: physiologyBefore.hpMax,
    hpMaxAfter,
    statsBefore: physiologyBefore.stats,
    statsAfter: Object.freeze(statsAfter),
    healAmount: preview.healAmount,
    healed,
    poisonDamage: preview.poisonDamage,
    damageTaken,
    nourishedStat: preflight.nourishedStat,
    nourishment: preview.nourishment,
    statIncrease,
    brink: hpAfter <= 1,
  });
}

function mealWitness(
  preflight: Arc5ExplorerMealPreflightV1,
  consequence: Arc5ExplorerMealConsequenceV1,
  receiptOrdinal: number,
): string {
  return canonicalJson({
    schema: 'cf-v2-arc5-explorer-meal-witness/v1',
    receiptOrdinal,
    parentRevision: preflight.parentRevision,
    parentDigest: preflight.parentDigest,
    foodLotId: preflight.foodLotId,
    speciesId: preflight.speciesId,
    foodQuantityBefore: preflight.foodQuantityBefore,
    foodQuantityAfter: preflight.foodQuantityAfter,
    floraTier: preflight.floraTier,
    nourishedStat: preflight.nourishedStat,
    poisonChance: preflight.poisonChance,
    healBase: preflight.healBase,
    poisoned: consequence.poisoned,
    outcomeDraw: consequence.outcomeDraw,
    hpBefore: consequence.hpBefore,
    hpAfter: consequence.hpAfter,
    hpMaxBefore: consequence.hpMaxBefore,
    hpMaxAfter: consequence.hpMaxAfter,
    statsBefore: consequence.statsBefore,
    statsAfter: consequence.statsAfter,
    healAmount: consequence.healAmount,
    healed: consequence.healed,
    poisonDamage: consequence.poisonDamage,
    damageTaken: consequence.damageTaken,
    nourishment: consequence.nourishment,
    statIncrease: consequence.statIncrease,
    brink: consequence.brink,
  });
}

/** Settle one F4-chosen explorer meal and consume its exact flora lot. */
export function settleArc5ExplorerMealV1(
  preflight: Arc5ExplorerMealPreflightV1,
  physiology: Arc5ExplorerPhysiologyV1,
  explorerMealHealBonus: number,
  xenobotanyLab: boolean,
  outcomeDraw: number,
  receiptOrdinal: number,
): Arc5ExplorerMealSettlementV1 {
  const authority = preflightAuthority(preflight);
  if (!Number.isSafeInteger(receiptOrdinal) || receiptOrdinal < 0
    || receiptOrdinal > LAST_USABLE_F4_RECEIPT_ORDINAL_V2) {
    throw new RangeError('Arc 5 explorer meal receipt ordinal is exhausted or invalid');
  }
  const preview = projectArc5ExplorerMealPreviewV1(
    preflight,
    physiology,
    explorerMealHealBonus,
    xenobotanyLab,
  );
  const consequence = consequenceFrom(preview, outcomeDraw);
  const witness = mealWitness(preflight, consequence, receiptOrdinal);
  const receiptEvidence = createF4ReceiptEvidenceV2({
    ordinal: receiptOrdinal,
    actionKind: ARC5_EXPLORER_MEAL_ACTION_KIND_V1,
    witnessDigest: sha256Hex(witness),
  });
  const foodAfter = preflight.foodQuantityAfter === 0
    ? null
    : createSpecimenLotV2({ ...authority.food, quantity: preflight.foodQuantityAfter });
  const foodTombstone = foodAfter === null
    ? createSpecimenTombstoneV2(authority.food, receiptEvidence)
    : null;
  const parent = authority.parent;
  const successor = createOwnershipSuccessorV2(parent, {
    source: ownershipSourceStateV1(parent),
    bredAcquisitions: parent.bredAcquisitions,
    creatures: parent.creatures,
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
    schema: 'cf-v2-arc5-explorer-meal-settlement/v1',
    preflight,
    consequence,
    receiptEvidence,
    foodBefore: authority.food,
    foodAfter,
    foodTombstone,
    successor,
    witness,
  });
}
