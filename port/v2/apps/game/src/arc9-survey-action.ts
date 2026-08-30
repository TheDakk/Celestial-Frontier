/* Arc 9 canonical Survey settlement.

   Survey facts are regenerated from one registered CF1 hierarchy. The UI
   supplies no planet type, life, civilization, star class, binary, or Sol
   claim. One detached deterministic F4 product updates the bounded legacy
   carriers, their exact `stats.surveys` mirror, every proven event-owned
   achievement, aggregate progression, and best-rank mirror together. There
   is no RNG draw, retry, optimistic publication, or seed-only identity. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import { biosphere, civilization } from '@cf/domain-ecology';
import { mulberry32 } from '@cf/domain-rand';
import { starClass } from '@cf/domain-starcatalog';
import { climateBand } from '@cf/domain-surveyphrases';
import { HOME_GAL_SEED, HOME_POS, SOL_POS, SOL_SEED } from '@cf/domain-worldconfig';
import { systemFor } from '@cf/domain-worldgen';
import type { SaveStateV2 } from '@cf/persistence';
import {
  getCanonicalCF1AddressKey,
  isCanonicalCF1Address,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  prepareArc9EventAchievementJoinV1,
  prepareArc9ProgressionRefreshV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
  type Arc9ProgressionProjectionV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC9_SURVEY_FACT_SCHEMA_V1 = 'cf-v2-arc9-survey-fact/v1' as const;
export const ARC9_SURVEY_WITNESS_SCHEMA_V1 = 'cf-v2-arc9-survey-witness/v1' as const;
export const ARC9_SURVEY_RECEIPT_KIND_V1 = 'arc9-survey-v1' as const;
const ARC9_SURVEY_OPERATION_PREFIX_V1 = 'arc9.survey:';
const MAX_CLONE_NODES = 1_500_000;
const MAX_SURVEYED_WORLDS = 60_000;
const MAX_SMALL_CARRIER = 200;
const MAX_COUNTER = 1_000_000_000;
const MAX_RANK_INDEX = 9;

export type Arc9SurveyEventAchievementIdV1 =
  | 'civ' | 'spacefar' | 'sol' | 'binary'
  | 'seebh' | 'seens' | 'seemag' | 'seewd'
  | 'seerg' | 'seesg' | 'seeproto' | 'seebd';

const STAR_ACHIEVEMENT_BY_KIND = Object.freeze({
  BH: 'seebh',
  NS: 'seens',
  MAG: 'seemag',
  WD: 'seewd',
  RG: 'seerg',
  SG: 'seesg',
  PROTO: 'seeproto',
  BD: 'seebd',
} as const satisfies Readonly<Record<string, Arc9SurveyEventAchievementIdV1>>);

const ADVANCED_CIVILIZATION_ERAS = new Set([
  'spacefaring', 'interstellar', 'postsingular',
]);

export type Arc9SurveyAddressV1 = CanonicalCF1StarAddress | CanonicalCF1WorldAddress;

interface Arc9SurveyFactBaseV1 {
  readonly schema: typeof ARC9_SURVEY_FACT_SCHEMA_V1;
  readonly addressKey: string;
  readonly eventAchievementIds: readonly Arc9SurveyEventAchievementIdV1[];
}

export interface Arc9WorldSurveyFactV1 extends Arc9SurveyFactBaseV1 {
  readonly target: 'world';
  readonly planetSeed: number;
  readonly planetOrdinal: number;
  readonly planetType: string;
  readonly biosphereKey: string;
  readonly living: boolean;
  readonly civilization: 'none' | 'home' | 'civilized' | 'advanced';
  readonly civilizationEra: string | null;
}

export interface Arc9StarSurveyFactV1 extends Arc9SurveyFactBaseV1 {
  readonly target: 'star';
  readonly starSeed: number;
  readonly starKind: string;
  readonly binary: boolean;
  readonly exactSol: boolean;
}

export type Arc9SurveyFactV1 = Arc9WorldSurveyFactV1 | Arc9StarSurveyFactV1;

export interface Arc9SurveyOwnedStateV1 {
  readonly surveyedSet: readonly (string | number)[];
  readonly ptypesSeen: readonly string[];
  readonly starKindsSeen: readonly string[];
  readonly surveys: number;
  readonly bestRank: number;
  readonly unlocked: readonly string[];
}

export type Arc9SurveyProtectionReasonV1 =
  | 'source-unproven'
  | 'source-mismatch'
  | 'state-shape'
  | 'survey-ledger-shape'
  | 'survey-ledger-capacity'
  | 'world-type-carrier-shape'
  | 'world-type-carrier-capacity'
  | 'star-kind-carrier-shape'
  | 'star-kind-carrier-capacity'
  | 'stats-shape'
  | `achievement:${Arc9ProgressionProjectionProtectionReasonV1}`
  | `progression:${Arc9ProgressionProjectionProtectionReasonV1}`
  | 'progression-fixed-point';

export interface Arc9SurveySettlementReadyV1 {
  readonly kind: 'ready';
  readonly operation: string;
  readonly receiptKind: typeof ARC9_SURVEY_RECEIPT_KIND_V1;
  readonly facts: Arc9SurveyFactV1;
  readonly source: Arc9SurveyOwnedStateV1;
  readonly successor: Arc9SurveyOwnedStateV1;
  readonly addedEventAchievementIds: readonly Arc9SurveyEventAchievementIdV1[];
  readonly addedAggregateAchievementIds: readonly string[];
  readonly successorState: SaveStateV2;
  readonly projection: Arc9ProgressionProjectionV1;
}

export type Arc9SurveySettlementPreparationV1 =
  | Arc9SurveySettlementReadyV1
  | Readonly<{
    kind: 'current';
    facts: Arc9SurveyFactV1;
    projection: Arc9ProgressionProjectionV1;
  }>
  | Readonly<{ kind: 'protected'; reason: Arc9SurveyProtectionReasonV1 }>;

class SurveyProtection extends Error {
  constructor(readonly reason: Arc9SurveyProtectionReasonV1) {
    super(reason);
  }
}

function protect(reason: Arc9SurveyProtectionReasonV1): never {
  throw new SurveyProtection(reason);
}

function plainRecord(value: unknown, reason: Arc9SurveyProtectionReasonV1): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) protect(reason);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null
    || Reflect.ownKeys(value).some((key) => typeof key !== 'string')) protect(reason);
  return value as Record<string, unknown>;
}

function dataValue(
  record: Record<string, unknown>,
  key: string,
  reason: Arc9SurveyProtectionReasonV1,
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) protect(reason);
  return descriptor.value;
}

function denseArray(
  value: unknown,
  maximum: number,
  reason: Arc9SurveyProtectionReasonV1,
): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > maximum || Reflect.ownKeys(value).length !== value.length + 1) protect(reason);
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) protect(reason);
  }
  return value;
}

function checkedSurveyLedger(value: unknown): readonly (string | number)[] {
  const rows = denseArray(value, MAX_SURVEYED_WORLDS, 'survey-ledger-shape');
  const seen = new Set<string>();
  const result: Array<string | number> = [];
  for (const entry of rows) {
    const valid = typeof entry === 'string'
      ? entry.length > 0 && entry.length <= 512
      : typeof entry === 'number' && Number.isSafeInteger(entry)
        && entry >= 0 && entry <= 0xffff_ffff;
    const token = `${typeof entry}:${String(entry)}`;
    if (!valid || seen.has(token)) protect('survey-ledger-shape');
    seen.add(token);
    result.push(entry as string | number);
  }
  return Object.freeze(result);
}

function checkedStringCarrier(
  value: unknown,
  reason: 'world-type-carrier-shape' | 'star-kind-carrier-shape',
): readonly string[] {
  const rows = denseArray(value, MAX_SMALL_CARRIER, reason);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of rows) {
    if (typeof entry !== 'string' || entry.length < 1 || entry.length > 64
      || seen.has(entry)) protect(reason);
    seen.add(entry);
    result.push(entry);
  }
  return Object.freeze(result);
}

function checkedCounter(
  stats: Record<string, unknown>,
  key: 'surveys' | 'bestRank',
): number {
  const value = dataValue(stats, key, 'stats-shape');
  const maximum = key === 'bestRank' ? MAX_RANK_INDEX : MAX_COUNTER;
  if (typeof value !== 'number' || !Number.isSafeInteger(value)
    || value < 0 || value > maximum) protect('stats-shape');
  return value;
}

function isWorldAddress(value: Arc9SurveyAddressV1): value is CanonicalCF1WorldAddress {
  return 'planet' in value;
}

function exactSol(address: Arc9SurveyAddressV1): boolean {
  return address.galaxy.seed === HOME_GAL_SEED
    && address.galaxy.x === HOME_POS.x
    && address.galaxy.y === HOME_POS.y
    && address.star.seed === SOL_SEED
    && address.star.x === SOL_POS.x
    && address.star.y === SOL_POS.y;
}

function exactEarth(address: CanonicalCF1WorldAddress): boolean {
  return exactSol(address)
    && address.planet.seed === 133
    && address.planet.ordinal === 2;
}

function derivedBinary(starSeed: number, kind: string): boolean {
  if (starSeed === SOL_SEED || !'MKGAB'.includes(kind)) return false;
  return mulberry32(starSeed)() < 0.24;
}

/** Regenerate the complete achievement-bearing fact set from a registered
 * hierarchy. No descriptor/UI label or caller-supplied classification is an
 * input. */
export function deriveArc9SurveyFactV1(addressValue: Arc9SurveyAddressV1): Arc9SurveyFactV1 {
  if (!isCanonicalCF1Address(addressValue) || !('star' in addressValue)
    || getCanonicalCF1AddressKey(addressValue) !== addressValue.key) {
    protect('source-unproven');
  }
  const address = addressValue;
  try {
    if (isWorldAddress(address)) {
      const system = systemFor(address.star.seed);
      const entry = system.planets[address.planet.ordinal];
      if (!entry || entry.P.seed !== address.planet.seed) protect('source-mismatch');
      const planet = entry.P as { seed: number; type?: string };
      const planetType = typeof planet.type === 'string' && planet.type.length > 0
        ? planet.type : 'rocky';
      const band = climateBand(planet, system, entry.orb);
      const random = mulberry32((address.planet.seed ^ 0x1234567) >>> 0);
      const bio = biosphere(planet, system as { sol?: boolean }, band, random);
      const civ = civilization(planet, system, band, bio, random);
      const era = civ.era?.key ?? null;
      const isHome = exactEarth(address);
      const advanced = civ.civ === true && era !== null
        && ADVANCED_CIVILIZATION_ERAS.has(era);
      const civilizationFact: Arc9WorldSurveyFactV1['civilization'] = isHome
        ? 'home' : advanced ? 'advanced' : civ.civ === true ? 'civilized' : 'none';
      const eventAchievementIds: Arc9SurveyEventAchievementIdV1[] = [];
      if (civilizationFact === 'civilized' || civilizationFact === 'advanced') {
        eventAchievementIds.push('civ');
      }
      if (civilizationFact === 'advanced') eventAchievementIds.push('spacefar');
      return Object.freeze({
        schema: ARC9_SURVEY_FACT_SCHEMA_V1,
        target: 'world',
        addressKey: address.key,
        planetSeed: address.planet.seed,
        planetOrdinal: address.planet.ordinal,
        planetType,
        biosphereKey: bio.key,
        living: bio.key !== 'none',
        civilization: civilizationFact,
        civilizationEra: era,
        eventAchievementIds: Object.freeze(eventAchievementIds),
      });
    }
    const sourceClass = starClass(address.star.seed);
    const kind = sourceClass.kind;
    const binary = derivedBinary(address.star.seed, kind);
    const isSol = exactSol(address);
    const eventAchievementIds: Arc9SurveyEventAchievementIdV1[] = [];
    if (isSol) eventAchievementIds.push('sol');
    if (binary) eventAchievementIds.push('binary');
    if (Object.prototype.hasOwnProperty.call(STAR_ACHIEVEMENT_BY_KIND, kind)) {
      eventAchievementIds.push(STAR_ACHIEVEMENT_BY_KIND[kind as keyof typeof STAR_ACHIEVEMENT_BY_KIND]);
    }
    return Object.freeze({
      schema: ARC9_SURVEY_FACT_SCHEMA_V1,
      target: 'star',
      addressKey: address.key,
      starSeed: address.star.seed,
      starKind: kind,
      binary,
      exactSol: isSol,
      eventAchievementIds: Object.freeze(eventAchievementIds),
    });
  } catch (error) {
    if (error instanceof SurveyProtection) throw error;
    protect('source-mismatch');
  }
}

function appendUnique(
  rows: readonly string[],
  value: string,
  capacityReason: 'world-type-carrier-capacity' | 'star-kind-carrier-capacity',
): readonly string[] {
  if (rows.includes(value)) return rows;
  if (rows.length >= MAX_SMALL_CARRIER) protect(capacityReason);
  return Object.freeze([...rows, value]);
}

function ownedState(state: SaveStateV2): Arc9SurveyOwnedStateV1 {
  const root = plainRecord(state, 'state-shape');
  const stats = plainRecord(dataValue(root, 'stats', 'stats-shape'), 'stats-shape');
  const surveyedSet = checkedSurveyLedger(dataValue(root, 'surveyedSet', 'survey-ledger-shape'));
  const ptypesSeen = checkedStringCarrier(
    dataValue(root, 'ptypesSeen', 'world-type-carrier-shape'),
    'world-type-carrier-shape',
  );
  const starKindsSeen = checkedStringCarrier(
    dataValue(root, 'starKindsSeen', 'star-kind-carrier-shape'),
    'star-kind-carrier-shape',
  );
  const unlockedValue = dataValue(root, 'unlocked', 'state-shape');
  if (!Array.isArray(unlockedValue)) protect('state-shape');
  return Object.freeze({
    surveyedSet,
    ptypesSeen,
    starKindsSeen,
    surveys: checkedCounter(stats, 'surveys'),
    bestRank: checkedCounter(stats, 'bestRank'),
    unlocked: Object.freeze([...unlockedValue] as string[]),
  });
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

export function operationForArc9SurveyV1(address: Arc9SurveyAddressV1): string {
  if (!isCanonicalCF1Address(address) || !('star' in address)) {
    throw new TypeError('Arc 9 Survey operation requires a registered star or world address');
  }
  return `${ARC9_SURVEY_OPERATION_PREFIX_V1}${sha256Hex(address.key)}`;
}

/** Pure preparation: carriers first, all exact event joins second, then the
 * aggregate projection until it is a fixed point. Any capacity/projection
 * refusal leaves the caller untouched and no partial id can escape. */
export function prepareArc9SurveySettlementV1(
  state: SaveStateV2,
  address: Arc9SurveyAddressV1,
): Arc9SurveySettlementPreparationV1 {
  try {
    const facts = deriveArc9SurveyFactV1(address);
    const source = ownedState(state);
    let surveyedSet = source.surveyedSet;
    let ptypesSeen = source.ptypesSeen;
    let starKindsSeen = source.starKindsSeen;
    if (facts.target === 'world') {
      ptypesSeen = appendUnique(ptypesSeen, facts.planetType, 'world-type-carrier-capacity');
      if (facts.living && !surveyedSet.includes(facts.addressKey)) {
        if (surveyedSet.length >= MAX_SURVEYED_WORLDS) protect('survey-ledger-capacity');
        surveyedSet = Object.freeze([...surveyedSet, facts.addressKey]);
      }
    } else {
      starKindsSeen = appendUnique(
        starKindsSeen,
        facts.starKind,
        'star-kind-carrier-capacity',
      );
    }
    let successorState: SaveStateV2 = {
      ...state,
      stats: { ...state.stats, surveys: surveyedSet.length },
      surveyedSet: [...surveyedSet] as string[],
      ptypesSeen: [...ptypesSeen],
      starKindsSeen: [...starKindsSeen],
    };
    const addedEventAchievementIds: Arc9SurveyEventAchievementIdV1[] = [];
    for (const id of facts.eventAchievementIds) {
      const join = prepareArc9EventAchievementJoinV1(successorState, id);
      if (join.kind !== 'prepared') protect(`achievement:${join.reason}`);
      if (join.added) addedEventAchievementIds.push(id);
      successorState = { ...successorState, unlocked: [...join.nextUnlockedIds] };
    }
    const refresh = prepareArc9ProgressionRefreshV1(successorState);
    if (refresh.kind === 'protected') protect(`progression:${refresh.reason}`);
    const addedAggregateAchievementIds = refresh.kind === 'ready'
      ? refresh.addedAchievementIds : Object.freeze([]);
    if (refresh.kind === 'ready') successorState = refresh.successorState;
    const fixedPoint = prepareArc9ProgressionRefreshV1(successorState);
    if (fixedPoint.kind !== 'current') protect('progression-fixed-point');
    const successor = ownedState(successorState);
    for (const id of facts.eventAchievementIds) {
      if (!fixedPoint.projection.unlockedIds.includes(id)
        || fixedPoint.projection.achievements.rows.find((row) => row.id === id)?.status
          !== 'unlocked') protect('progression-fixed-point');
    }
    if (successor.surveys !== successor.surveyedSet.length
      || fixedPoint.projection.snapshot.surveyedLivingWorldCount !== successor.surveyedSet.length
      || fixedPoint.projection.snapshot.surveyedWorldTypeCount
        !== Math.min(8, successor.ptypesSeen.length)
      || fixedPoint.projection.snapshot.surveyedStarClassCount
        !== Math.min(8, successor.starKindsSeen.length)) protect('progression-fixed-point');
    const changed = !sameJson(source, successor);
    if (!changed) return Object.freeze({ kind: 'current', facts, projection: fixedPoint.projection });
    return Object.freeze({
      kind: 'ready',
      operation: operationForArc9SurveyV1(address),
      receiptKind: ARC9_SURVEY_RECEIPT_KIND_V1,
      facts,
      source,
      successor,
      addedEventAchievementIds: Object.freeze(addedEventAchievementIds),
      addedAggregateAchievementIds: Object.freeze([...addedAggregateAchievementIds]),
      successorState,
      projection: fixedPoint.projection,
    });
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof SurveyProtection ? error.reason : 'source-mismatch',
    });
  }
}

interface CloneBudget { count: number; }

function clonePlain(
  value: unknown,
  ancestors: Set<object>,
  budget: CloneBudget,
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object' || depth > 256 || budget.count >= MAX_CLONE_NODES
    || ancestors.has(value)) throw new TypeError('Survey state is not bounded plain data');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype || Reflect.ownKeys(value).length !== value.length + 1) {
        throw new TypeError('Survey arrays must be exact native data');
      }
      const result: unknown[] = [];
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Survey arrays cannot contain holes or accessors');
        }
        result.push(clonePlain(descriptor.value, ancestors, budget, depth + 1));
      }
      return result;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Survey objects must use a plain prototype');
    }
    const result: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('Survey state cannot contain symbols');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Survey state cannot contain accessors or hidden fields');
      }
      Object.defineProperty(result, key, {
        value: clonePlain(descriptor.value, ancestors, budget, depth + 1),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return result;
  } finally {
    ancestors.delete(value);
  }
}

export interface Arc9SurveyActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly address: Arc9SurveyAddressV1;
  readonly codecNow: number;
}

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly address: Arc9SurveyAddressV1;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze(['runtime', 'state', 'address', 'codecNow'] as const);

function capture(input: Arc9SurveyActionInputV1): CapturedInput | null {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(input);
    const names = keys.filter((key): key is string => typeof key === 'string').sort();
    const expected = [...INPUT_FIELDS].sort();
    if (keys.length !== expected.length
      || names.some((name, index) => name !== expected[index])) return null;
    const values: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of INPUT_FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      values[field] = descriptor.value;
    }
    const runtime = values.runtime;
    const address = values.address;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)
      || !isCanonicalCF1Address(address) || !('star' in address)
      || typeof values.codecNow !== 'number' || !Number.isSafeInteger(values.codecNow)
      || values.codecNow < 0) return null;
    const commit = Object.getOwnPropertyDescriptor(runtime, 'commitAction');
    if (!commit || !('value' in commit) || typeof commit.value !== 'function') return null;
    const state = clonePlain(values.state, new Set<object>(), { count: 0 }, 0);
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state: state as SaveStateV2,
      address: address as Arc9SurveyAddressV1,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function witnessFor(plan: Arc9SurveySettlementReadyV1, receiptOrdinal: number): string {
  return `arc9sv1:${sha256Hex(canonicalJson({
    schema: ARC9_SURVEY_WITNESS_SCHEMA_V1,
    operation: plan.operation,
    receiptOrdinal,
    facts: plan.facts,
    source: plan.source,
    successor: plan.successor,
    addedEventAchievementIds: plan.addedEventAchievementIds,
    addedAggregateAchievementIds: plan.addedAggregateAchievementIds,
  }))}`;
}

function samePlan(left: Arc9SurveySettlementReadyV1, right: Arc9SurveySettlementReadyV1): boolean {
  return left.operation === right.operation
    && left.receiptKind === right.receiptKind
    && sameJson(left.facts, right.facts)
    && sameJson(left.source, right.source)
    && sameJson(left.successor, right.successor)
    && sameJson(left.addedEventAchievementIds, right.addedEventAchievementIds)
    && sameJson(left.addedAggregateAchievementIds, right.addedAggregateAchievementIds)
    && sameJson(left.successorState, right.successorState);
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): string {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') return outcome.message;
  if (outcome.kind === 'protected') return `protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `lost:${outcome.reason}`;
  return outcome.kind;
}

function needsReload(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): boolean {
  return outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt' || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable' || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

export type Arc9SurveyActionOutcomeV1 =
  | Readonly<{
    kind: 'current';
    durability: 'none';
    convergence: 'none';
    facts: Arc9SurveyFactV1;
    projection: Arc9ProgressionProjectionV1;
    transaction: null;
  }>
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    facts: Arc9SurveyFactV1;
    source: Arc9SurveyOwnedStateV1;
    successor: Arc9SurveyOwnedStateV1;
    addedEventAchievementIds: readonly Arc9SurveyEventAchievementIdV1[];
    addedAggregateAchievementIds: readonly string[];
    projection: Arc9ProgressionProjectionV1;
    witness: string;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-survey-evidence-missing' | 'committed-survey-fixed-point-mismatch';
    mismatch: readonly string[];
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: 'input:invalid-or-unregistered'
      | `preflight:${Arc9SurveyProtectionReasonV1}`
      | `transaction:${string}`;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

/** One detached Survey attempt, one immutable receipt, one revision CAS. */
export async function commitArc9SurveySettlementV1(
  input: Arc9SurveyActionInputV1,
): Promise<Arc9SurveyActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const preflight = prepareArc9SurveySettlementV1(captured.state, captured.address);
  if (preflight.kind === 'protected') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `preflight:${preflight.reason}`, transaction: null,
    });
  }
  if (preflight.kind === 'current') {
    return Object.freeze({
      kind: 'current', durability: 'none', convergence: 'none',
      facts: preflight.facts, projection: preflight.projection, transaction: null,
    });
  }

  let selected: Readonly<{
    plan: Arc9SurveySettlementReadyV1;
    witness: string;
    expectedState: SaveStateV2;
  }> | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: preflight.operation,
      receiptKind: preflight.receiptKind,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft, canonicalizeState }) => {
        const plan = prepareArc9SurveySettlementV1(draft, captured.address);
        if (plan.kind !== 'ready' || !samePlan(plan, preflight)) {
          throw new Error('Arc 9 Survey parent changed before derivation');
        }
        const witness = witnessFor(plan, receiptOrdinal);
        selected = Object.freeze({
          plan,
          witness,
          expectedState: canonicalizeState(plan.successorState),
        });
        return Object.freeze({
          state: plan.successorState,
          extensionWrites: Object.freeze([]),
          witness,
        });
      },
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: `transaction:${error instanceof Error ? error.message : String(error)}`,
      transaction: null,
    });
  }
  if (transaction.kind !== 'committed') {
    return Object.freeze({
      kind: 'refused', durability: 'none',
      convergence: needsReload(transaction) ? 'read-only-reload' : 'none',
      detail: `transaction:${transactionDetail(transaction)}`,
      transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    plan: Arc9SurveySettlementReadyV1;
    witness: string;
    expectedState: SaveStateV2;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-survey-evidence-missing',
      mismatch: Object.freeze(['selection']), transaction,
    });
  }
  const fixedPoint = prepareArc9SurveySettlementV1(transaction.state, captured.address);
  const plan = committedSelection.plan;
  if (fixedPoint.kind !== 'current') {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-survey-fixed-point-mismatch',
      mismatch: Object.freeze([`fixed-point:${fixedPoint.kind}`]), transaction,
    });
  }
  const mismatch = Object.freeze([
    transaction.plan.operation !== plan.operation ? 'operation' : null,
    transaction.plan.receiptOrdinal !== transaction.receipt.ordinal ? 'receipt-ordinal' : null,
    transaction.receipt.kind !== plan.receiptKind ? 'receipt-kind' : null,
    transaction.receipt.witness !== committedSelection.witness ? 'receipt-witness' : null,
    !sameJson(transaction.state, transaction.saved.canonicalState) ? 'canonical-state' : null,
    !sameJson(transaction.state, committedSelection.expectedState) ? 'successor-state' : null,
    !sameJson(fixedPoint.facts, plan.facts) ? 'facts' : null,
    !sameJson(fixedPoint.projection.unlockedIds, plan.successor.unlocked) ? 'unlocked' : null,
    !sameJson(ownedState(transaction.state), plan.successor) ? 'owned-state' : null,
  ].filter((value): value is string => value !== null));
  if (mismatch.length > 0) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-survey-fixed-point-mismatch', mismatch, transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    facts: plan.facts,
    source: plan.source,
    successor: plan.successor,
    addedEventAchievementIds: plan.addedEventAchievementIds,
    addedAggregateAchievementIds: plan.addedAggregateAchievementIds,
    projection: fixedPoint.projection,
    witness: committedSelection.witness,
  });
}

/** Publish only fields independently verified by the committed Survey fixed
 * point, and only over the exact live parent used by the CAS. */
export function publishArc9SurveyFieldsV1(
  target: SaveStateV2,
  outcome: Extract<Arc9SurveyActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  const current = ownedState(target);
  if (!sameJson(current, outcome.source)) {
    throw new TypeError('Arc 9 Survey publication requires its exact live parent');
  }
  const durable = ownedState(outcome.transaction.state);
  if (!sameJson(durable, outcome.successor)) {
    throw new TypeError('Arc 9 Survey publication requires its committed fixed point');
  }
  target.surveyedSet = [...outcome.successor.surveyedSet] as string[];
  target.ptypesSeen = [...outcome.successor.ptypesSeen];
  target.starKindsSeen = [...outcome.successor.starKindsSeen];
  target.stats = {
    ...target.stats,
    surveys: outcome.successor.surveys,
    bestRank: outcome.successor.bestRank,
  };
  target.unlocked = [...outcome.successor.unlocked];
}
