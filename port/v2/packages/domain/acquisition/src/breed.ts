/* Arc 5 deterministic companion-breeding authority.

   This is a versioned adapter over the existing V2 ownership successor and
   lifted Genetics APIs. Product eligibility and both possible durable
   successors are resolved before SessionRNG exposes the outcome value. Normal
   breeding never consumes a parent: every settled attempt assigns both exact
   parents to bounded F4 active-play Recovery, while success additionally owns
   one child through the existing bred-acquisition authority. */
import { crossGenome } from '@cf/domain-genetics';
import { speciesGrade, type Genome } from '@cf/domain-genome';
import { MAX_ACTIVE_PLAY_MS } from '@cf/domain-progression';
import { speciesName } from '@cf/domain-speciestraits';
import {
  MAX_OWNERSHIP_REVISION,
  canonicalGenomeIdentityV1,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type SpeciesId,
} from './model.js';
import {
  BREED_ACTION_KIND_V2,
  LAST_USABLE_F4_RECEIPT_ORDINAL_V2,
  createBredAcquisitionRecordV2,
  createBredCreatureInstanceV2,
  createCreatureInstanceV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  isOwnershipStateV2,
  ownershipSourceStateV1,
  ownershipStateDigestV2,
  type BredAcquisitionRecordV2,
  type F4ReceiptEvidenceV2,
  type OwnershipStateV2,
} from './model-v2.js';
import { canonicalJson, sha256Hex } from './canonical.js';
import { projectCompanionAvailabilityV1 } from './companion-availability.js';

export const ARC5_BREED_POLICY_VERSION_V1 = 1 as const;
export const ARC5_BREED_ACTION_KIND_V1 = BREED_ACTION_KIND_V2;
export const ARC5_BREED_RECEIPT_KIND_V1 = 'arc5-companion-breed' as const;
export const ARC5_BREED_SUCCESS_RECOVERY_MS_V1 = 8 * 60 * 1_000;
export const ARC5_BREED_FAILURE_RECOVERY_MS_V1 = 2 * 60 * 1_000;
export const ARC5_BREED_INJURY_THRESHOLD_V1 = 0.3;
export const ARC5_BREED_STARDUST_BONUS_MAX_V1 = 0.15;
export const ARC5_BREED_BASE_CHILD_XP_V1 = 2 as const;
export const ARC5_BREED_FIRST_SPECIES_PAIR_XP_V1 = 5 as const;

export interface Arc5BreedRequestV1 {
  readonly parentCreatureIds: readonly [CreatureInstanceId, CreatureInstanceId];
  readonly activePlayMs: number;
  /** Explicit audited projection of lifetime earned Stardust. */
  readonly earnedStardustBonus: number;
}

export type Arc5BreedRefusalReasonV1 =
  | 'input-invalid'
  | 'ownership-invalid'
  | 'ownership-protected'
  | 'ownership-revision-exhausted'
  | 'active-play-overflow'
  | 'same-parent'
  | 'parent-not-owned'
  | 'parent-exhibit'
  | 'parent-not-fauna'
  | 'parent-assigned'
  | 'parent-recovering'
  | 'parent-injured'
  | 'parent-lineage-invalid'
  | 'parent-genome-invalid';

export interface Arc5BreedPreflightV1 {
  readonly schema: 'cf-v2-arc5-breed-preflight/v1';
  readonly policyVersion: typeof ARC5_BREED_POLICY_VERSION_V1;
  readonly parentRevision: number;
  readonly parentDigest: string;
  readonly parentCreatureIds: readonly [CreatureInstanceId, CreatureInstanceId];
  readonly parentSpeciesIds: readonly [SpeciesId, SpeciesId];
  /** Read-only v1.8.9 alias used only to honor an imported paid pair. */
  readonly legacySpeciesPairXpKey: string;
  readonly parentSeeds: readonly [number, number];
  readonly parentTiers: readonly [number, number];
  readonly parentFed: readonly [number, number];
  readonly activePlayMs: number;
  readonly earnedStardustBonus: number;
  readonly odds: number;
  readonly childSpeciesId: string;
  readonly childGeneration: number;
  readonly childBrood: number;
}

export type Arc5BreedPreflightOutcomeV1 =
  | Readonly<{ kind: 'ready'; preflight: Arc5BreedPreflightV1 }>
  | Readonly<{ kind: 'refused'; reason: Arc5BreedRefusalReasonV1 }>;

export interface Arc5BreedScenarioV1 {
  readonly schema: 'cf-v2-arc5-breed-scenario/v1';
  readonly result: 'success' | 'failure';
  readonly preflight: Arc5BreedPreflightV1;
  readonly recoveryDurationMs: number;
  readonly recoveryReadyAtActivePlayMs: number;
  readonly receiptEvidence: F4ReceiptEvidenceV2;
  readonly parentsBefore: readonly [CreatureInstanceV1, CreatureInstanceV1];
  readonly parentsAfter: readonly [CreatureInstanceV1, CreatureInstanceV1];
  readonly speciesPairXpKey: string;
  readonly speciesPairFirst: boolean;
  readonly childXpAwarded: 0 | 2 | 7;
  readonly acquisition: BredAcquisitionRecordV2 | null;
  readonly child: CreatureInstanceV1 | null;
  readonly successor: OwnershipStateV2;
  readonly witness: string;
}

export interface Arc5BreedScenarioPlanV1 {
  readonly schema: 'cf-v2-arc5-breed-scenarios/v1';
  readonly preflight: Arc5BreedPreflightV1;
  readonly receiptOrdinal: number;
  readonly failure: Arc5BreedScenarioV1;
  readonly success: Arc5BreedScenarioV1;
}

export type Arc5BreedScenarioPlanOutcomeV1 =
  | Readonly<{ kind: 'planned'; plan: Arc5BreedScenarioPlanV1 }>
  | Readonly<{
    kind: 'refused';
    reason: 'ownership-capacity-exceeded' | 'successor-invalid';
  }>;

export interface Arc5BreedSettlementV1 {
  readonly schema: 'cf-v2-arc5-breed-settlement/v1';
  readonly outcomeDraw: number;
  readonly scenario: Arc5BreedScenarioV1;
}

interface Arc5BreedPreflightAuthorityV1 {
  readonly parent: OwnershipStateV2;
  readonly parents: readonly [CreatureInstanceV1, CreatureInstanceV1];
  readonly childGenome: CreatureInstanceV1['genome'];
}

interface Arc5BreedScenarioAuthorityV1 {
  readonly preflight: Arc5BreedPreflightV1;
}

const PREFLIGHTS = new WeakMap<object, Arc5BreedPreflightAuthorityV1>();
const SCENARIO_PLANS = new WeakMap<object, Arc5BreedScenarioAuthorityV1>();

function refused(reason: Arc5BreedRefusalReasonV1): Arc5BreedPreflightOutcomeV1 {
  return Object.freeze({ kind: 'refused', reason });
}

function checkedActivePlayMs(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) >= 0
    && (value as number) <= MAX_ACTIVE_PLAY_MS ? value as number : null;
}

function checkedBonus(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    && value >= 0 && value <= ARC5_BREED_STARDUST_BONUS_MAX_V1
    ? value : null;
}

function checkedCreatureId(value: unknown): CreatureInstanceId | null {
  return typeof value === 'string' && /^creature-v1:[0-9a-f]{64}$/u.test(value)
    ? value as CreatureInstanceId : null;
}

function exactRequest(value: Arc5BreedRequestV1): Readonly<{
  parentCreatureIds: readonly [CreatureInstanceId, CreatureInstanceId];
  activePlayMs: number;
  earnedStardustBonus: number;
}> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  const expected = ['activePlayMs', 'earnedStardustBonus', 'parentCreatureIds'];
  if (keys.length !== expected.length
    || keys.some((key) => typeof key !== 'string')
    || (keys as string[]).sort().some((key, index) => key !== expected[index])) return null;
  const idsDescriptor = Object.getOwnPropertyDescriptor(value, 'parentCreatureIds');
  const activeDescriptor = Object.getOwnPropertyDescriptor(value, 'activePlayMs');
  const bonusDescriptor = Object.getOwnPropertyDescriptor(value, 'earnedStardustBonus');
  if (!idsDescriptor || !activeDescriptor || !bonusDescriptor
    || !('value' in idsDescriptor) || !('value' in activeDescriptor)
    || !('value' in bonusDescriptor) || idsDescriptor.enumerable !== true
    || activeDescriptor.enumerable !== true || bonusDescriptor.enumerable !== true) return null;
  const ids = idsDescriptor.value;
  if (!Array.isArray(ids) || Object.getPrototypeOf(ids) !== Array.prototype
    || ids.length !== 2 || Reflect.ownKeys(ids).length !== 3) return null;
  const leftDescriptor = Object.getOwnPropertyDescriptor(ids, '0');
  const rightDescriptor = Object.getOwnPropertyDescriptor(ids, '1');
  if (!leftDescriptor || !rightDescriptor || !('value' in leftDescriptor)
    || !('value' in rightDescriptor) || leftDescriptor.enumerable !== true
    || rightDescriptor.enumerable !== true) return null;
  const leftId = checkedCreatureId(leftDescriptor.value);
  const rightId = checkedCreatureId(rightDescriptor.value);
  const activePlayMs = checkedActivePlayMs(activeDescriptor.value);
  const bonus = checkedBonus(bonusDescriptor.value);
  if (leftId === null || rightId === null || activePlayMs === null || bonus === null) return null;
  return Object.freeze({
    parentCreatureIds: Object.freeze([leftId, rightId] as const),
    activePlayMs,
    earnedStardustBonus: bonus,
  });
}

function checkedTier(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > 14) {
    throw new RangeError('companion breeding tier must be an integer from 0 through 14');
  }
  return value as number;
}

export function earnedStardustBonusV1(earnedStardust: unknown): number {
  if (!Number.isSafeInteger(earnedStardust) || (earnedStardust as number) < 0) {
    throw new RangeError('earned Stardust must be a non-negative integer');
  }
  return Math.min(
    ARC5_BREED_STARDUST_BONUS_MAX_V1,
    Math.floor((earnedStardust as number) / 50) * 0.01,
  );
}

export function companionBreedOddsV1(
  leftTier: number,
  rightTier: number,
  earnedStardustBonus: number,
): number {
  const left = checkedTier(leftTier);
  const right = checkedTier(rightTier);
  const bonus = checkedBonus(earnedStardustBonus);
  if (bonus === null) throw new RangeError('earned Stardust bonus must be from 0 through 0.15');
  return Math.min(0.97, Math.max(0.08, 0.95 - (left + right) * 0.06 + bonus));
}

/** Canonical compatibility-ledger identity for one unordered pair of exact
 * species. The schema is inside the digest, so this 64-byte key cannot alias
 * another XP-first vocabulary and is unaffected by parent order or nickname. */
export function arc5BreedSpeciesPairXpKeyV1(
  leftSpeciesId: SpeciesId,
  rightSpeciesId: SpeciesId,
): string {
  const valid = (value: unknown): value is SpeciesId => (
    typeof value === 'string' && /^species-v1:[0-9a-f]{64}$/u.test(value)
  );
  if (!valid(leftSpeciesId) || !valid(rightSpeciesId)) {
    throw new TypeError('companion breeding species pair requires two canonical species ids');
  }
  const parentSpeciesIds = [leftSpeciesId, rightSpeciesId].sort();
  return sha256Hex(canonicalJson({
    schema: 'cf-v2-arc5-breed-species-pair-xp/v1',
    parentSpeciesIds,
  }));
}

function seedOfGenome(genome: CreatureInstanceV1['genome']): number {
  const seed = genome.seed;
  if (!Number.isSafeInteger(seed) || (seed as number) < 0 || (seed as number) > 0xFFFF_FFFF) {
    throw new TypeError('companion parent seed is invalid');
  }
  return (seed as number) >>> 0;
}

/** Exact v1.8.9 compatibility alias. New v2 claims never use this collision-
 * prone key; it exists solely so an imported paid pair cannot re-arm +5 XP. */
export function arc5BreedLegacySpeciesPairXpKeyV1(
  leftGenome: CreatureInstanceV1['genome'],
  rightGenome: CreatureInstanceV1['genome'],
): string {
  const lineageName = (genome: CreatureInstanceV1['genome']): string => String(
    (genome as { readonly _earthName?: unknown })._earthName
      || speciesName(seedOfGenome(genome)),
  );
  const pair = [lineageName(leftGenome), lineageName(rightGenome)].sort().join(' × ');
  let hash = 2166136261;
  for (let index = 0; index < pair.length; index++) {
    hash ^= pair.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `pair|${(hash >>> 0).toString(36)}`;
}

/** Resolve exact parent eligibility and deterministic child biology without
 * observing a SessionRNG value or producing any successor. */
export function preflightArc5BreedV1(
  parent: OwnershipStateV2,
  request: Arc5BreedRequestV1,
): Arc5BreedPreflightOutcomeV1 {
  if (!isOwnershipStateV2(parent)) return refused('ownership-invalid');
  if (parent.mode !== 'current') return refused('ownership-protected');
  if (parent.revision === MAX_OWNERSHIP_REVISION) {
    return refused('ownership-revision-exhausted');
  }
  const checked = exactRequest(request);
  if (checked === null) return refused('input-invalid');
  if (checked.parentCreatureIds[0] === checked.parentCreatureIds[1]) {
    return refused('same-parent');
  }
  if (checked.activePlayMs > MAX_ACTIVE_PLAY_MS - ARC5_BREED_SUCCESS_RECOVERY_MS_V1) {
    return refused('active-play-overflow');
  }
  const left = parent.creatures.find((row) => row.creatureId === checked.parentCreatureIds[0]);
  const right = parent.creatures.find((row) => row.creatureId === checked.parentCreatureIds[1]);
  if (left === undefined || right === undefined) return refused('parent-not-owned');
  const parents = Object.freeze([left, right] as const);
  for (const candidate of parents) {
    if (candidate.genome.exhibit === true) return refused('parent-exhibit');
    if (candidate.genome.kingdom !== 'fauna') return refused('parent-not-fauna');
    const availability = projectCompanionAvailabilityV1(candidate, checked.activePlayMs);
    if (availability.assignment?.kind === 'mission') return refused('parent-assigned');
    if (availability.assignment?.kind === 'recovery') return refused('parent-recovering');
    if ((candidate.hurt ?? 0) >= ARC5_BREED_INJURY_THRESHOLD_V1) {
      return refused('parent-injured');
    }
    if (!Number.isSafeInteger(candidate.genome.gen)
      || candidate.genome.gen !== candidate.lineage.generation) {
      return refused('parent-lineage-invalid');
    }
  }
  let parentSeeds: readonly [number, number];
  let parentTiers: readonly [number, number];
  let childGenome: CreatureInstanceV1['genome'];
  let childSpeciesId: string;
  let childGeneration: number;
  try {
    parentSeeds = Object.freeze([
      seedOfGenome(left.genome),
      seedOfGenome(right.genome),
    ] as const);
    parentTiers = Object.freeze([
      checkedTier(speciesGrade(left.genome as unknown as Genome).tier),
      checkedTier(speciesGrade(right.genome as unknown as Genome).tier),
    ] as const);
    const crossed = crossGenome(
      left.genome as unknown as Genome,
      right.genome as unknown as Genome,
    );
    const identity = canonicalGenomeIdentityV1(crossed);
    if (identity.kingdom !== 'fauna'
      || !Number.isSafeInteger(identity.genome.gen)
      || identity.genome.gen !== Math.max(
        left.lineage.generation,
        right.lineage.generation,
      ) + 1) {
      return refused('parent-genome-invalid');
    }
    childGenome = identity.genome;
    childSpeciesId = identity.speciesId;
    childGeneration = identity.genome.gen as number;
  } catch {
    return refused('parent-genome-invalid');
  }
  const parentFed = Object.freeze([
    Math.min(200, Math.max(0, left.fed ?? 0)),
    Math.min(200, Math.max(0, right.fed ?? 0)),
  ] as const);
  const childBrood = Math.min(200, (left.brood ?? 0) + (right.brood ?? 0) + 1);
  const preflight: Arc5BreedPreflightV1 = Object.freeze({
    schema: 'cf-v2-arc5-breed-preflight/v1',
    policyVersion: ARC5_BREED_POLICY_VERSION_V1,
    parentRevision: parent.revision,
    parentDigest: ownershipStateDigestV2(parent),
    parentCreatureIds: checked.parentCreatureIds,
    parentSpeciesIds: Object.freeze([left.speciesId, right.speciesId] as const),
    legacySpeciesPairXpKey: arc5BreedLegacySpeciesPairXpKeyV1(
      left.genome,
      right.genome,
    ),
    parentSeeds,
    parentTiers,
    parentFed,
    activePlayMs: checked.activePlayMs,
    earnedStardustBonus: checked.earnedStardustBonus,
    odds: companionBreedOddsV1(
      parentTiers[0],
      parentTiers[1],
      checked.earnedStardustBonus,
    ),
    childSpeciesId,
    childGeneration,
    childBrood,
  });
  PREFLIGHTS.set(preflight, Object.freeze({ parent, parents, childGenome }));
  return Object.freeze({ kind: 'ready', preflight });
}

function scenarioWitness(
  preflight: Arc5BreedPreflightV1,
  receiptOrdinal: number,
  result: 'success' | 'failure',
  recoveryDurationMs: number,
  speciesPairFirst: boolean,
): string {
  const pairClaimed = result === 'success' && speciesPairFirst;
  return canonicalJson({
    schema: 'cf-v2-arc5-breed-witness/v1',
    policyVersion: preflight.policyVersion,
    result,
    receiptOrdinal,
    parentRevision: preflight.parentRevision,
    parentDigest: preflight.parentDigest,
    parentCreatureIds: preflight.parentCreatureIds,
    parentSpeciesIds: preflight.parentSpeciesIds,
    legacySpeciesPairXpKey: preflight.legacySpeciesPairXpKey,
    parentSeeds: preflight.parentSeeds,
    parentTiers: preflight.parentTiers,
    parentFed: preflight.parentFed,
    activePlayMs: preflight.activePlayMs,
    earnedStardustBonus: preflight.earnedStardustBonus,
    odds: preflight.odds,
    recoveryDurationMs,
    recoveryReadyAtActivePlayMs: preflight.activePlayMs + recoveryDurationMs,
    speciesPairXpKey: arc5BreedSpeciesPairXpKeyV1(
      preflight.parentSpeciesIds[0],
      preflight.parentSpeciesIds[1],
    ),
    speciesPairFirst: pairClaimed,
    childXpAwarded: result === 'success'
      ? ARC5_BREED_BASE_CHILD_XP_V1
        + (pairClaimed ? ARC5_BREED_FIRST_SPECIES_PAIR_XP_V1 : 0)
      : 0,
    childSpeciesId: result === 'success' ? preflight.childSpeciesId : null,
    childGeneration: result === 'success' ? preflight.childGeneration : null,
    childBrood: result === 'success' ? preflight.childBrood : null,
  });
}

function scenario(
  preflight: Arc5BreedPreflightV1,
  authority: Arc5BreedPreflightAuthorityV1,
  receiptOrdinal: number,
  result: 'success' | 'failure',
  speciesPairFirst: boolean,
): Arc5BreedScenarioV1 {
  const recoveryDurationMs = result === 'success'
    ? ARC5_BREED_SUCCESS_RECOVERY_MS_V1
    : ARC5_BREED_FAILURE_RECOVERY_MS_V1;
  const recoveryReadyAtActivePlayMs = preflight.activePlayMs + recoveryDurationMs;
  const pairClaimed = result === 'success' && speciesPairFirst;
  const speciesPairXpKey = arc5BreedSpeciesPairXpKeyV1(
    preflight.parentSpeciesIds[0],
    preflight.parentSpeciesIds[1],
  );
  const childXpAwarded: 0 | 2 | 7 = result === 'success'
    ? pairClaimed
      ? (ARC5_BREED_BASE_CHILD_XP_V1 + ARC5_BREED_FIRST_SPECIES_PAIR_XP_V1) as 7
      : ARC5_BREED_BASE_CHILD_XP_V1
    : 0;
  const witness = scenarioWitness(
    preflight,
    receiptOrdinal,
    result,
    recoveryDurationMs,
    speciesPairFirst,
  );
  const receiptEvidence = createF4ReceiptEvidenceV2({
    ordinal: receiptOrdinal,
    actionKind: ARC5_BREED_ACTION_KIND_V1,
    witnessDigest: sha256Hex(witness),
  });
  const [left, right] = authority.parents;
  const assignment = Object.freeze({
    kind: 'recovery' as const,
    readyAtActivePlayMs: recoveryReadyAtActivePlayMs,
  });
  const leftAfter = createCreatureInstanceV2({ ...left, assignment });
  const rightAfter = createCreatureInstanceV2({ ...right, assignment });
  let acquisition: BredAcquisitionRecordV2 | null = null;
  let childDraft: CreatureInstanceV1 | null = null;
  if (result === 'success') {
    acquisition = createBredAcquisitionRecordV2({
      speciesId: preflight.childSpeciesId as BredAcquisitionRecordV2['speciesId'],
      parentCreatureIds: preflight.parentCreatureIds,
      parentSeeds: preflight.parentSeeds,
      receipt: receiptEvidence,
    });
    childDraft = createBredCreatureInstanceV2({
      acquisition,
      genome: authority.childGenome,
      generation: preflight.childGeneration,
      nickname: null,
      xp: childXpAwarded,
      hurt: 0,
      fed: null,
      brood: preflight.childBrood,
      assignment: null,
      bond: null,
    });
  }
  const successor = createOwnershipSuccessorV2(authority.parent, {
    source: ownershipSourceStateV1(authority.parent),
    bredAcquisitions: acquisition === null
      ? authority.parent.bredAcquisitions
      : [...authority.parent.bredAcquisitions, acquisition],
    creatures: [
      ...authority.parent.creatures.map((row) => {
        if (row.creatureId === left.creatureId) return leftAfter;
        if (row.creatureId === right.creatureId) return rightAfter;
        return row;
      }),
      ...(childDraft === null ? [] : [childDraft]),
    ],
    creatureTombstones: authority.parent.creatureTombstones,
    specimenLots: authority.parent.specimenLots,
    specimenTombstones: authority.parent.specimenTombstones,
    scoutCreatureId: authority.parent.scoutCreatureId,
  });
  const parentsAfter = Object.freeze([
    successor.creatures.find((row) => row.creatureId === left.creatureId)!,
    successor.creatures.find((row) => row.creatureId === right.creatureId)!,
  ] as const);
  const child = acquisition === null ? null : successor.creatures.find((row) => (
    row.acquisitionRecordId === acquisition!.recordId
  )) ?? null;
  if (result === 'success' && child === null) {
    throw new TypeError('companion breeding child did not survive successor construction');
  }
  return Object.freeze({
    schema: 'cf-v2-arc5-breed-scenario/v1',
    result,
    preflight,
    recoveryDurationMs,
    recoveryReadyAtActivePlayMs,
    receiptEvidence,
    parentsBefore: authority.parents,
    parentsAfter,
    speciesPairXpKey,
    speciesPairFirst: pairClaimed,
    childXpAwarded,
    acquisition,
    child,
    successor,
    witness,
  });
}

/** Build both complete ownership outcomes before the F4 owner materializes
 * its one `care.breed` value. A full-success carrier must fit even when the
 * eventual roll would fail, so capacity can never become an outcome oracle. */
export function planArc5BreedScenariosV1(
  preflight: Arc5BreedPreflightV1,
  receiptOrdinal: number,
  speciesPairFirst: boolean,
): Arc5BreedScenarioPlanOutcomeV1 {
  const authority = preflight && typeof preflight === 'object'
    ? PREFLIGHTS.get(preflight) : undefined;
  if (authority === undefined) {
    return Object.freeze({ kind: 'refused', reason: 'successor-invalid' });
  }
  if (!Number.isSafeInteger(receiptOrdinal) || receiptOrdinal < 0
    || receiptOrdinal > LAST_USABLE_F4_RECEIPT_ORDINAL_V2
    || typeof speciesPairFirst !== 'boolean') {
    return Object.freeze({ kind: 'refused', reason: 'successor-invalid' });
  }
  try {
    const failure = scenario(preflight, authority, receiptOrdinal, 'failure', false);
    const success = scenario(
      preflight,
      authority,
      receiptOrdinal,
      'success',
      speciesPairFirst,
    );
    const plan: Arc5BreedScenarioPlanV1 = Object.freeze({
      schema: 'cf-v2-arc5-breed-scenarios/v1',
      preflight,
      receiptOrdinal,
      failure,
      success,
    });
    SCENARIO_PLANS.set(plan, Object.freeze({ preflight }));
    return Object.freeze({ kind: 'planned', plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Object.freeze({
      kind: 'refused',
      reason: /global row bound|capacity|exceeds/u.test(message)
        ? 'ownership-capacity-exceeded' : 'successor-invalid',
    });
  }
}

/** Select the already-built scenario from one exact SessionRNG value. No
 * successor, genome, receipt evidence, clock, or capacity result is rederived. */
export function settleArc5BreedScenariosV1(
  plan: Arc5BreedScenarioPlanV1,
  outcomeDraw: number,
): Arc5BreedSettlementV1 {
  const authority = plan && typeof plan === 'object' ? SCENARIO_PLANS.get(plan) : undefined;
  if (authority === undefined || authority.preflight !== plan.preflight) {
    throw new TypeError('Arc 5 breed scenario plan must be owner-minted');
  }
  if (typeof outcomeDraw !== 'number' || !Number.isFinite(outcomeDraw)
    || outcomeDraw < 0 || outcomeDraw >= 1) {
    throw new RangeError('Arc 5 breed outcome draw must be from 0 inclusive to 1 exclusive');
  }
  return Object.freeze({
    schema: 'cf-v2-arc5-breed-settlement/v1',
    outcomeDraw,
    scenario: outcomeDraw < plan.preflight.odds ? plan.success : plan.failure,
  });
}
