/* Deterministic descent policy.

   World identity, opportunity facts, equipped effects and learned approaches
   arrive as registered authorities. This module performs no persistence and
   consumes no RNG itself: it declares the exact SessionRNG domains required
   by an ordinary attempt, then resolves the immutable draw rows supplied by
   the single receipt owner. */
import {
  isEngineeringCapabilitySnapshot,
  type EngineeringCapabilitySnapshot,
  type LandingFamily,
} from '@cf/domain-loot';
import { DOMAINS } from '@cf/domain-sessionrng';
import { biomeFor } from '@cf/domain-strays';
import {
  isCanonicalCF1Address,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
} from '@cf/scene';
import {
  descentWaveOffCountV1,
  isDescentWaveOffStateV1,
  type DescentWaveOffStateV1,
  isCanonicalEarthWorldAddress,
  isWorldOpportunitySnapshot,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';

export const DESCENT_POLICY_SCHEMA_V1 = 'cf-v2-descent-policy/v1' as const;
export const DESCENT_SUCCESS_DOMAIN_V1 = DOMAINS.descentSuccess;
export const DESCENT_DAMAGE_DOMAIN_V1 = DOMAINS.descentDamage;
export const DESCENT_OUTCOME_DOMAINS_V1 = Object.freeze([
  DESCENT_SUCCESS_DOMAIN_V1,
  DESCENT_DAMAGE_DOMAIN_V1,
] as const);

export type DescentPlanetTypeV1 =
  | 'terran' | 'ocean' | 'rocky' | 'ice' | 'desert' | 'gas' | 'venus' | 'lava';

export interface DescentBaseTierV1 {
  readonly successPercent: number;
  readonly damageMin: number;
  readonly damageMax: number;
}

const tier = (
  successPercent: number,
  damageMin: number,
  damageMax: number,
): DescentBaseTierV1 => Object.freeze({ successPercent, damageMin, damageMax });

export const DESCENT_TYPE_TIERS_V1: Readonly<Record<DescentPlanetTypeV1, DescentBaseTierV1>> =
  Object.freeze({
    terran: tier(95, 2, 2),
    ocean: tier(90, 2, 2),
    rocky: tier(90, 2, 2),
    ice: tier(85, 3, 4),
    desert: tier(85, 3, 4),
    gas: tier(65, 4, 6),
    venus: tier(25, 5, 7),
    lava: tier(20, 6, 8),
  });

export type DescentSafeReasonV1 = 'earth' | 'training' | 'revisit' | null;

export interface DescentPolicyInputV1 {
  readonly address: CanonicalCF1WorldAddress;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly capabilities: EngineeringCapabilitySnapshot;
  readonly waveOffs: DescentWaveOffStateV1;
  readonly stormActive: boolean;
  readonly trainingActive: boolean;
  readonly alreadyLanded: boolean;
}

export interface DescentApproachPolicyV1 {
  readonly schema: typeof DESCENT_POLICY_SCHEMA_V1;
  readonly key: CF1WorldKey;
  readonly address: CanonicalCF1WorldAddress;
  readonly opportunityIdentity: string;
  readonly capabilityFingerprint: string;
  readonly planetType: string;
  readonly biomeKey: string | null;
  readonly typeBase: DescentBaseTierV1;
  readonly baseSuccessPercent: number;
  readonly stormActive: boolean;
  readonly stormAdjustedPercent: number;
  readonly waveOffCount: number;
  readonly learnedApproachBonus: number;
  readonly globalGearBonus: number;
  readonly familyGearBonus: number;
  readonly landingGuaranteed: boolean;
  readonly successPercent: number;
  readonly damageMin: number;
  readonly damageMax: number;
  readonly waveOffDamageReduction: number;
  readonly safeReason: DescentSafeReasonV1;
  readonly requiredDomains: readonly string[];
}

export interface DescentOutcomeDrawV1 {
  readonly domain: string;
  readonly value: number;
}

export type DescentAttemptOutcomeV1 =
  | Readonly<{
    kind: 'landed';
    navigation: 'surface';
    policy: DescentApproachPolicyV1;
    drawsConsumed: 0 | 2;
    hpBefore: number;
    hpAfter: number;
    damage: 0;
    waveOffCountBefore: number;
    waveOffCountAfter: number;
    persistenceOutcome: 'unchanged' | 'success';
  }>
  | Readonly<{
    kind: 'wave-off';
    navigation: 'orbit';
    policy: DescentApproachPolicyV1;
    drawsConsumed: 2;
    hpBefore: number;
    hpAfter: number;
    rawDamage: number;
    gearAdjustedDamage: number;
    damage: number;
    waveOffCountBefore: number;
    waveOffCountAfter: number;
    persistenceOutcome: 'failure';
  }>;

const POLICIES = new WeakSet<object>();

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function capturedInput(value: DescentPolicyInputV1): DescentPolicyInputV1 | null {
  try {
    if (!isPlainRecord(value)) return null;
    const fields = [
      'address', 'opportunity', 'capabilities', 'waveOffs', 'stormActive',
      'trainingActive', 'alreadyLanded',
    ] as const;
    const actual = Reflect.ownKeys(value);
    if (actual.some((key) => typeof key !== 'string') || actual.length !== fields.length) return null;
    const names = (actual as string[]).sort();
    const expected = [...fields].sort();
    if (names.some((key, index) => key !== expected[index])) return null;
    const captured: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of fields) {
      const descriptor = Object.getOwnPropertyDescriptor(value, field);
      if (!descriptor || !('value' in descriptor) || !descriptor.enumerable) return null;
      captured[field] = descriptor.value;
    }
    if (!isCanonicalCF1Address(captured.address) || !('planet' in captured.address)
      || !isWorldOpportunitySnapshot(captured.opportunity)
      || captured.opportunity.address.key !== captured.address.key
      || captured.opportunity.key !== captured.address.key
      || !isEngineeringCapabilitySnapshot(captured.capabilities)
      || !isDescentWaveOffStateV1(captured.waveOffs)
      || typeof captured.stormActive !== 'boolean'
      || typeof captured.trainingActive !== 'boolean'
      || typeof captured.alreadyLanded !== 'boolean') return null;
    return Object.freeze(captured) as unknown as DescentPolicyInputV1;
  } catch {
    return null;
  }
}

function knownType(value: string): DescentPlanetTypeV1 {
  return Object.prototype.hasOwnProperty.call(DESCENT_TYPE_TIERS_V1, value)
    ? value as DescentPlanetTypeV1
    : 'terran';
}

/** The biome's authored landing value selects the damage rung too. */
export function descentDamageRangeForBaseSuccessV1(
  successPercent: number,
): Readonly<{ readonly damageMin: number; readonly damageMax: number }> {
  if (!Number.isFinite(successPercent) || successPercent < 0 || successPercent > 100) {
    throw new RangeError('descent base success percent must be in [0, 100]');
  }
  if (successPercent >= 90) return Object.freeze({ damageMin: 2, damageMax: 2 });
  if (successPercent >= 75) return Object.freeze({ damageMin: 3, damageMax: 4 });
  if (successPercent >= 55) return Object.freeze({ damageMin: 4, damageMax: 6 });
  if (successPercent >= 30) return Object.freeze({ damageMin: 5, damageMax: 7 });
  return Object.freeze({ damageMin: 6, damageMax: 8 });
}

function matchingFamilyBonus(
  planetType: string,
  values: Readonly<Record<LandingFamily, number>>,
): number {
  return planetType === 'lava' || planetType === 'venus'
    || planetType === 'gas' || planetType === 'ice'
    ? values[planetType]
    : 0;
}

/** Project the complete approach before any SessionRNG value is requested. */
export function projectDescentApproachV1(
  value: DescentPolicyInputV1,
): DescentApproachPolicyV1 {
  const input = capturedInput(value);
  if (input === null) throw new TypeError('descent policy requires exact registered authorities');
  const planetType = input.opportunity.source.planetType;
  const typeBase = DESCENT_TYPE_TIERS_V1[knownType(planetType)];
  const biome = biomeFor(
    { seed: input.address.planet.seed, type: planetType },
    input.opportunity.source.climateBand,
  );
  const biomeKey = biome && typeof biome.k === 'string' ? biome.k : null;
  const biomeLanding = biome && typeof biome.land === 'number'
    && Number.isFinite(biome.land) && biome.land >= 0 && biome.land <= 100
    ? biome.land : null;
  const baseSuccessPercent = biomeLanding ?? typeBase.successPercent;
  const damage = descentDamageRangeForBaseSuccessV1(baseSuccessPercent);
  const stormAdjustedPercent = input.stormActive
    ? baseSuccessPercent >= 90
      ? Math.max(90, baseSuccessPercent - 5)
      : Math.max(5, baseSuccessPercent - 5)
    : baseSuccessPercent;
  const waveOffCount = descentWaveOffCountV1(input.waveOffs, input.address);
  const learnedApproachBonus = waveOffCount * 20;
  const familyGearBonus = matchingFamilyBonus(
    planetType,
    input.capabilities.landingFamilyBonus,
  );
  const safeReason: DescentSafeReasonV1 = input.trainingActive
    ? 'training'
    : isCanonicalEarthWorldAddress(input.address)
      ? 'earth'
      : input.alreadyLanded ? 'revisit' : null;
  let successPercent = Math.min(100,
    stormAdjustedPercent
      + learnedApproachBonus
      + input.capabilities.landingSuccessBonus
      + familyGearBonus,
  );
  if (input.capabilities.landingGuaranteed || safeReason !== null) successPercent = 100;
  const policy: DescentApproachPolicyV1 = Object.freeze({
    schema: DESCENT_POLICY_SCHEMA_V1,
    key: input.address.key,
    address: input.address,
    opportunityIdentity: input.opportunity.schema + ':' + input.opportunity.key,
    capabilityFingerprint: input.capabilities.fingerprint,
    planetType,
    biomeKey,
    typeBase,
    baseSuccessPercent,
    stormActive: input.stormActive,
    stormAdjustedPercent,
    waveOffCount,
    learnedApproachBonus,
    globalGearBonus: input.capabilities.landingSuccessBonus,
    familyGearBonus,
    landingGuaranteed: input.capabilities.landingGuaranteed,
    successPercent,
    damageMin: damage.damageMin,
    damageMax: damage.damageMax,
    waveOffDamageReduction: input.capabilities.waveOffDamageReduction,
    safeReason,
    requiredDomains: safeReason === null ? DESCENT_OUTCOME_DOMAINS_V1 : Object.freeze([]),
  });
  POLICIES.add(policy);
  return policy;
}

export function isDescentApproachPolicyV1(value: unknown): value is DescentApproachPolicyV1 {
  return typeof value === 'object' && value !== null && POLICIES.has(value)
    && (value as DescentApproachPolicyV1).schema === DESCENT_POLICY_SCHEMA_V1;
}

function checkedHp(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new RangeError('descent explorer HP must be a positive safe integer');
  }
  return value as number;
}

function checkedDraws(
  policy: DescentApproachPolicyV1,
  value: readonly DescentOutcomeDrawV1[],
): readonly DescentOutcomeDrawV1[] {
  if (!Array.isArray(value) || value.length !== policy.requiredDomains.length) {
    throw new TypeError('descent draw count does not match the projected policy');
  }
  return Object.freeze(value.map((row, index) => {
    if (!isPlainRecord(row)) throw new TypeError(`descent draw ${index} is malformed`);
    const keys = Reflect.ownKeys(row);
    if (keys.length !== 2 || !keys.includes('domain') || !keys.includes('value')) {
      throw new TypeError(`descent draw ${index} has unknown or missing fields`);
    }
    const domain = Object.getOwnPropertyDescriptor(row, 'domain');
    const draw = Object.getOwnPropertyDescriptor(row, 'value');
    if (!domain || !draw || !('value' in domain) || !('value' in draw)
      || !domain.enumerable || !draw.enumerable
      || domain.value !== policy.requiredDomains[index]
      || typeof draw.value !== 'number' || !Number.isFinite(draw.value)
      || draw.value < 0 || draw.value >= 1) {
      throw new TypeError(`descent draw ${index} is not the required unit draw`);
    }
    return Object.freeze({ domain: domain.value as string, value: draw.value });
  }));
}

/** Resolve one pre-projected approach. Safe Training/Earth/revisit paths
 * explicitly require zero draw rows and preserve any existing compatibility
 * evidence. Ordinary attempts use the fixed two-domain F4 reservation. */
export function resolveDescentAttemptV1(
  policy: DescentApproachPolicyV1,
  drawsValue: readonly DescentOutcomeDrawV1[],
  explorerHpValue: number,
): DescentAttemptOutcomeV1 {
  if (!isDescentApproachPolicyV1(policy)) {
    throw new TypeError('descent attempt requires an owner-projected policy');
  }
  const hpBefore = checkedHp(explorerHpValue);
  const draws = checkedDraws(policy, drawsValue);
  if (policy.safeReason !== null) {
    const clearsProgress = policy.safeReason !== 'training';
    return Object.freeze({
      kind: 'landed', navigation: 'surface', policy, drawsConsumed: 0,
      hpBefore, hpAfter: hpBefore, damage: 0,
      waveOffCountBefore: policy.waveOffCount,
      waveOffCountAfter: clearsProgress ? 0 : policy.waveOffCount,
      persistenceOutcome: clearsProgress ? 'success' : 'unchanged',
    });
  }
  const landed = draws[0]!.value * 100 < policy.successPercent;
  if (landed) {
    return Object.freeze({
      kind: 'landed', navigation: 'surface', policy, drawsConsumed: 2,
      hpBefore, hpAfter: hpBefore, damage: 0,
      waveOffCountBefore: policy.waveOffCount, waveOffCountAfter: 0,
      persistenceOutcome: 'success',
    });
  }
  const rawDamage = policy.damageMin
    + Math.floor(draws[1]!.value * (policy.damageMax - policy.damageMin + 1));
  const gearAdjustedDamage = Math.max(0,
    rawDamage - policy.waveOffDamageReduction,
  );
  const damage = Math.min(gearAdjustedDamage, Math.max(0, hpBefore - 1));
  return Object.freeze({
    kind: 'wave-off', navigation: 'orbit', policy, drawsConsumed: 2,
    hpBefore, hpAfter: hpBefore - damage,
    rawDamage, gearAdjustedDamage, damage,
    waveOffCountBefore: policy.waveOffCount,
    waveOffCountAfter: Math.min(5, policy.waveOffCount + 1),
    persistenceOutcome: 'failure',
  });
}
