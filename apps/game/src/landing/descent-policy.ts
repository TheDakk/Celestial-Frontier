/* The descent: the odds of landing on a world never stood on, and what a failed attempt costs.

   The rules are the legacy game's (LEGACY celestial-frontier.html, v1.8.9):
   - the ladder by world type, the fallback when a world has no biome: `DESCENT_TIERS` 13375-13378;
   - the biome's own landing value sets the odds and the damage rung: `descentFor` 13421-13434,
     `descentTierFromPct` 13357-13359;
   - an active storm takes 5 off, never below 90 from 90 or more, never below 5 otherwise: 13428-13430;
   - each wave-off on the same world adds 20, worn landing gear adds its own: 13431, `descentBonus` 13386-13393,
     `_equipBonus` 23224-23236, `_equipLandFam` 23237-23244; the Gravitic Anchor makes it 100: 13432;
   - no roll in training, on Earth, or on a world already landed on: `descentSafe` 13435-13437;
   - the roll, the wave-off's damage (a reinforced hull takes 1 off a scrape above 1, then landing struts take
     theirs, and a wave-off never kills), the learned approach and the two notices: `_descRoll` 13438-13461;
   - a saved count of wave-offs is at most 5: 16904.

   The shape (registered authorities in, one frozen policy out, the draws supplied by the receipt's owner) is the
   painted port's `descent-policy.ts`. The legacy game rolls with `Math.random`; here the two draws come from the
   session's `descent.success` and `descent.damage` streams, so an outcome is one receipt.

   Whether a storm is active is the caller's to say: see `descent-weather.ts`. */
import {
  isEngineeringCapabilitySnapshot,
  type EngineeringCapabilitySnapshot,
  type LandingFamily,
} from '@cf/domain-loot';
import {
  descentWaveOffCountV1,
  isCanonicalEarthWorldAddress,
  isDescentWaveOffStateV1,
  isWorldOpportunitySnapshot,
  type DescentWaveOffStateV1,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import { DOMAINS } from '@cf/domain-sessionrng';
import { biomeFor } from '@cf/domain-strays';
import { isCanonicalCF1Address, type CanonicalCF1WorldAddress, type CF1WorldKey } from '@cf/scene';

export const DESCENT_POLICY_SCHEMA_V1 = 'cf-v2-descent-policy/v1' as const;
export const DESCENT_SUCCESS_DOMAIN_V1 = DOMAINS.descentSuccess;
export const DESCENT_DAMAGE_DOMAIN_V1 = DOMAINS.descentDamage;
export const DESCENT_OUTCOME_DOMAINS_V1 = Object.freeze([DESCENT_SUCCESS_DOMAIN_V1, DESCENT_DAMAGE_DOMAIN_V1] as const);

/** What an active storm takes off, what a wave-off teaches, and how many wave-offs a world remembers. */
export const DESCENT_STORM_PENALTY = 5;
export const DESCENT_LEARNED_PER_WAVE_OFF = 20;
export const DESCENT_MAX_WAVE_OFFS = 5;
/** A first landing whose biome lands at this or less is announced as Through the Fire. */
export const DESCENT_HOSTILE_LANDING = 30;

export type DescentPlanetTypeV1 = 'terran' | 'ocean' | 'rocky' | 'ice' | 'desert' | 'gas' | 'venus' | 'lava';

export interface DescentBaseTierV1 {
  readonly successPercent: number;
  readonly damageMin: number;
  readonly damageMax: number;
}

const tier = (successPercent: number, damageMin: number, damageMax: number): DescentBaseTierV1 =>
  Object.freeze({ successPercent, damageMin, damageMax });

export const DESCENT_TYPE_TIERS_V1: Readonly<Record<DescentPlanetTypeV1, DescentBaseTierV1>> = Object.freeze({
  terran: tier(95, 2, 2),
  ocean: tier(90, 2, 2),
  rocky: tier(90, 2, 2),
  ice: tier(85, 3, 4),
  desert: tier(85, 3, 4),
  gas: tier(65, 4, 6),
  venus: tier(25, 5, 7),
  lava: tier(20, 6, 8),
});

/** The damage rung of a base success. */
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

export interface DescentOddsInput {
  readonly planet: { readonly seed: number; readonly type: string };
  readonly band: string;
  readonly stormActive: boolean;
  readonly waveOffCount: number;
  /** The landing bonus of everything worn and built. */
  readonly gearBonus: number;
  /** The worn bonus tuned to this world's type. */
  readonly familyGearBonus: number;
  readonly landingGuaranteed: boolean;
}

export interface DescentOdds {
  readonly typeBase: DescentBaseTierV1;
  readonly biomeKey: string | null;
  readonly biomeName: string | null;
  /** The biome's own landing value; null when the world has no biome and the type ladder is used. */
  readonly biomeLanding: number | null;
  readonly baseSuccessPercent: number;
  /** The weather these odds were worked out for. */
  readonly stormActive: boolean;
  readonly stormAdjustedPercent: number;
  readonly successPercent: number;
  readonly damageMin: number;
  readonly damageMax: number;
}

/** The legacy `descentFor`: the odds of one attempt, before any exemption. */
export function descentOdds(input: DescentOddsInput): DescentOdds {
  const type = Object.prototype.hasOwnProperty.call(DESCENT_TYPE_TIERS_V1, input.planet.type)
    ? input.planet.type as DescentPlanetTypeV1 : 'terran';
  const typeBase = DESCENT_TYPE_TIERS_V1[type];
  const biome = biomeFor(input.planet, input.band);
  const biomeLanding = biome && typeof biome.land === 'number' && Number.isFinite(biome.land)
    && biome.land >= 0 && biome.land <= 100 ? biome.land : null;
  const baseSuccessPercent = biomeLanding ?? typeBase.successPercent;
  const damage = descentDamageRangeForBaseSuccessV1(baseSuccessPercent);
  const stormAdjustedPercent = !input.stormActive
    ? baseSuccessPercent
    : Math.max(baseSuccessPercent >= 90 ? 90 : 5, baseSuccessPercent - DESCENT_STORM_PENALTY);
  const successPercent = input.landingGuaranteed ? 100 : Math.min(100,
    stormAdjustedPercent + DESCENT_LEARNED_PER_WAVE_OFF * input.waveOffCount + input.gearBonus + input.familyGearBonus);
  return Object.freeze({
    typeBase,
    biomeKey: biome && typeof biome.k === 'string' ? biome.k : null,
    biomeName: biome && typeof biome.n === 'string' ? biome.n : null,
    biomeLanding,
    baseSuccessPercent,
    stormActive: input.stormActive,
    stormAdjustedPercent,
    successPercent,
    damageMin: damage.damageMin,
    damageMax: damage.damageMax,
  });
}

/** What a wave-off costs: the raw scrape, less 1 for a reinforced hull when it is above 1, less the landing
    struts, and never the last point of health. */
export function waveOffDamage(input: Readonly<{
  damageMin: number; damageMax: number; draw: number; reinforcedHull: boolean; strutReduction: number; hp: number;
}>): Readonly<{ rawDamage: number; gearAdjustedDamage: number; damage: number }> {
  const rawDamage = input.damageMin + Math.floor(input.draw * (input.damageMax - input.damageMin + 1));
  const hulled = input.reinforcedHull && rawDamage > 1 ? rawDamage - 1 : rawDamage;
  const gearAdjustedDamage = Math.max(0, hulled - input.strutReduction);
  return Object.freeze({ rawDamage, gearAdjustedDamage, damage: Math.min(gearAdjustedDamage, Math.max(0, input.hp - 1)) });
}

export type DescentSafeReasonV1 = 'earth' | 'training' | 'revisit' | null;

export interface DescentPolicyInputV1 {
  readonly address: CanonicalCF1WorldAddress;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly capabilities: EngineeringCapabilitySnapshot;
  readonly waveOffs: DescentWaveOffStateV1;
  readonly stormActive: boolean;
  /** The Reinforced Hull research is owned. */
  readonly reinforcedHull: boolean;
  readonly trainingActive: boolean;
  readonly alreadyLanded: boolean;
}

export interface DescentApproachPolicyV1 extends DescentOdds {
  readonly schema: typeof DESCENT_POLICY_SCHEMA_V1;
  readonly key: CF1WorldKey;
  readonly address: CanonicalCF1WorldAddress;
  readonly opportunityIdentity: string;
  readonly capabilityFingerprint: string;
  readonly planetType: string;
  readonly reinforcedHull: boolean;
  readonly waveOffCount: number;
  readonly learnedApproachBonus: number;
  readonly globalGearBonus: number;
  readonly familyGearBonus: number;
  readonly landingGuaranteed: boolean;
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
    /** A rolled landing on a world whose biome lands at 30 or less. */
    throughTheFire: boolean;
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
    /** The odds of the next attempt in the same weather, with this approach learned. */
    nextSuccessPercent: number;
  }>;

const POLICIES = new WeakSet<object>();
const INPUT_FIELDS = Object.freeze([
  'address', 'alreadyLanded', 'capabilities', 'opportunity', 'reinforcedHull', 'stormActive', 'trainingActive', 'waveOffs',
] as const);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** The input's own data fields, read once; null unless it holds exactly the registered authorities. */
function capturedInput(value: DescentPolicyInputV1): DescentPolicyInputV1 | null {
  try {
    if (!isPlainRecord(value)) return null;
    const actual = Reflect.ownKeys(value);
    if (actual.length !== INPUT_FIELDS.length || actual.some((key) => typeof key !== 'string')) return null;
    const names = (actual as string[]).sort();
    if (names.some((key, index) => key !== INPUT_FIELDS[index])) return null;
    const captured: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of INPUT_FIELDS) {
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
      || typeof captured.reinforcedHull !== 'boolean'
      || typeof captured.trainingActive !== 'boolean'
      || typeof captured.alreadyLanded !== 'boolean') return null;
    return Object.freeze(captured) as unknown as DescentPolicyInputV1;
  } catch {
    return null;
  }
}

function matchingFamilyBonus(planetType: string, values: Readonly<Record<LandingFamily, number>>): number {
  return planetType === 'lava' || planetType === 'venus' || planetType === 'gas' || planetType === 'ice'
    ? values[planetType] : 0;
}

/** The whole approach, before any random value is asked for. */
export function projectDescentApproachV1(value: DescentPolicyInputV1): DescentApproachPolicyV1 {
  const input = capturedInput(value);
  if (input === null) throw new TypeError('descent policy requires exact registered authorities');
  const planetType = input.opportunity.source.planetType;
  const waveOffCount = descentWaveOffCountV1(input.waveOffs, input.address);
  const familyGearBonus = matchingFamilyBonus(planetType, input.capabilities.landingFamilyBonus);
  const odds = descentOdds({
    planet: { seed: input.address.planet.seed, type: planetType },
    band: input.opportunity.source.climateBand,
    stormActive: input.stormActive,
    waveOffCount,
    gearBonus: input.capabilities.landingSuccessBonus,
    familyGearBonus,
    landingGuaranteed: input.capabilities.landingGuaranteed,
  });
  const safeReason: DescentSafeReasonV1 = input.trainingActive
    ? 'training'
    : isCanonicalEarthWorldAddress(input.address) ? 'earth' : input.alreadyLanded ? 'revisit' : null;
  const policy: DescentApproachPolicyV1 = Object.freeze({
    ...odds,
    successPercent: safeReason !== null ? 100 : odds.successPercent,
    schema: DESCENT_POLICY_SCHEMA_V1,
    key: input.address.key,
    address: input.address,
    opportunityIdentity: input.opportunity.schema + ':' + input.opportunity.key,
    capabilityFingerprint: input.capabilities.fingerprint,
    planetType,
    reinforcedHull: input.reinforcedHull,
    waveOffCount,
    learnedApproachBonus: waveOffCount * DESCENT_LEARNED_PER_WAVE_OFF,
    globalGearBonus: input.capabilities.landingSuccessBonus,
    familyGearBonus,
    landingGuaranteed: input.capabilities.landingGuaranteed,
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

function checkedDraws(policy: DescentApproachPolicyV1, value: readonly DescentOutcomeDrawV1[]): readonly DescentOutcomeDrawV1[] {
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

/** Settles one projected approach. Training, Earth and a revisit take no draw; any other attempt takes the two
    draws of the policy's domains, in order. */
export function resolveDescentAttemptV1(
  policy: DescentApproachPolicyV1,
  drawsValue: readonly DescentOutcomeDrawV1[],
  explorerHpValue: number,
): DescentAttemptOutcomeV1 {
  if (!isDescentApproachPolicyV1(policy)) throw new TypeError('descent attempt requires an owner-projected policy');
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
      throughTheFire: false,
    });
  }
  if (draws[0]!.value * 100 < policy.successPercent) {
    return Object.freeze({
      kind: 'landed', navigation: 'surface', policy, drawsConsumed: 2,
      hpBefore, hpAfter: hpBefore, damage: 0,
      waveOffCountBefore: policy.waveOffCount, waveOffCountAfter: 0,
      persistenceOutcome: 'success',
      throughTheFire: policy.biomeLanding !== null && policy.biomeLanding <= DESCENT_HOSTILE_LANDING,
    });
  }
  const cost = waveOffDamage({
    damageMin: policy.damageMin, damageMax: policy.damageMax, draw: draws[1]!.value,
    reinforcedHull: policy.reinforcedHull, strutReduction: policy.waveOffDamageReduction, hp: hpBefore,
  });
  const waveOffCountAfter = Math.min(DESCENT_MAX_WAVE_OFFS, policy.waveOffCount + 1);
  return Object.freeze({
    kind: 'wave-off', navigation: 'orbit', policy, drawsConsumed: 2,
    hpBefore, hpAfter: hpBefore - cost.damage, ...cost,
    waveOffCountBefore: policy.waveOffCount, waveOffCountAfter,
    persistenceOutcome: 'failure',
    nextSuccessPercent: Math.min(100, policy.stormAdjustedPercent + DESCENT_LEARNED_PER_WAVE_OFF * waveOffCountAfter
      + policy.globalGearBonus + policy.familyGearBonus),
  });
}
