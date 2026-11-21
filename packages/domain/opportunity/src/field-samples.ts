/* Arc 0 first-landing field-sample projection.

   This owner accepts only provenance-registered scene/opportunity authority.
   It owns no save state and performs no persistence: its sole output is a
   detached, frozen statement of whether one genuine landing earns samples. */
import {
  getCanonicalCF1AddressKey,
  isCanonicalCF1Address,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
} from '@cf/scene';
import {
  isCanonicalEarthWorldAddress,
  isWorldOpportunitySnapshot,
  type EngineeringRawTier,
  type WorldOpportunitySnapshot,
} from './snapshot.js';

export const FIELD_SAMPLE_PROJECTION_SCHEMA = 'cf-v2-field-sample-projection/v1' as const;
export const FIELD_SAMPLE_WITNESS_SCHEMA = 'cf-v2-field-sample-witness/v1' as const;

export type FieldSampleLandingAuthority =
  | 'first'
  | 'repeat'
  | 'unresolved-already-landed';

export type FieldSampleSuppressionReason =
  | 'canonical-earth'
  | 'training'
  | 'repeat'
  | 'unresolved-already-landed';

export interface FieldSampleMaterialGrant {
  readonly id: string;
  readonly quantity: 1;
}

export interface FieldSampleReward {
  readonly materials: readonly FieldSampleMaterialGrant[];
  readonly stardust: number;
}

export interface FieldSampleWitness {
  readonly schema: typeof FIELD_SAMPLE_WITNESS_SCHEMA;
  readonly worldKey: CF1WorldKey;
  readonly planetSeed: number;
  readonly planetOrdinal: number;
  readonly rawTier: EngineeringRawTier;
  readonly effectiveTier: EngineeringRawTier;
  readonly canonicalEarth: boolean;
  readonly landing: FieldSampleLandingAuthority;
  readonly training: boolean;
  readonly depositIds: readonly string[];
  readonly stardust: number;
}

export type FieldSampleProjection =
  | Readonly<{
    schema: typeof FIELD_SAMPLE_PROJECTION_SCHEMA;
    kind: 'grant';
    reward: FieldSampleReward;
    witness: FieldSampleWitness;
  }>
  | Readonly<{
    schema: typeof FIELD_SAMPLE_PROJECTION_SCHEMA;
    kind: 'suppressed';
    reason: FieldSampleSuppressionReason;
    witness: FieldSampleWitness;
  }>;

export interface ProjectFieldSamplesInput {
  readonly address: CanonicalCF1WorldAddress;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly landing: FieldSampleLandingAuthority;
  readonly training: boolean;
}

const FIELD_SAMPLE_PROJECTIONS = new WeakSet<object>();
const INPUT_FIELDS = Object.freeze(['address', 'opportunity', 'landing', 'training'] as const);

function checkedInput(value: ProjectFieldSamplesInput): ProjectFieldSamplesInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('field-sample input must be an exact data object');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('field-sample input must use a plain prototype');
  }
  const keys = Reflect.ownKeys(value);
  const names = keys.filter((key): key is string => typeof key === 'string').sort();
  const expected = [...INPUT_FIELDS].sort();
  if (names.length !== keys.length || names.length !== expected.length
    || names.some((name, index) => name !== expected[index])) {
    throw new TypeError('field-sample input has unknown or missing fields');
  }
  const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const field of INPUT_FIELDS) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw new TypeError('field-sample input cannot contain accessors or hidden fields');
    }
    fields[field] = descriptor.value;
  }
  if (!isCanonicalCF1Address(fields.address) || !('planet' in fields.address)) {
    throw new TypeError('field samples require a registered canonical world address');
  }
  if (!isWorldOpportunitySnapshot(fields.opportunity)) {
    throw new TypeError('field samples require a registered world opportunity');
  }
  const address = fields.address;
  const opportunity = fields.opportunity;
  if (getCanonicalCF1AddressKey(address) !== opportunity.key
    || getCanonicalCF1AddressKey(opportunity.address) !== address.key) {
    throw new TypeError('field-sample authorities must name the same canonical world');
  }
  if (fields.landing !== 'first' && fields.landing !== 'repeat'
    && fields.landing !== 'unresolved-already-landed') {
    throw new TypeError('field-sample landing authority is invalid');
  }
  if (typeof fields.training !== 'boolean') {
    throw new TypeError('field-sample Training flag must be boolean');
  }
  return Object.freeze({
    address,
    opportunity,
    landing: fields.landing,
    training: fields.training,
  });
}

function suppressionReason(
  canonicalEarth: boolean,
  training: boolean,
  landing: FieldSampleLandingAuthority,
): FieldSampleSuppressionReason | null {
  if (canonicalEarth) return 'canonical-earth';
  if (training) return 'training';
  return landing === 'first' ? null : landing;
}

/** Project the exact legacy first-landing sample reward without mutating or
 * publishing any caller-owned state. */
export function projectFieldSamples(inputValue: ProjectFieldSamplesInput): FieldSampleProjection {
  const input = checkedInput(inputValue);
  const { address, opportunity, landing, training } = input;
  const canonicalEarth = isCanonicalEarthWorldAddress(address);
  const depositIds = Object.freeze(opportunity.deposits.slice(0, 2));
  if (depositIds.length !== 2 || depositIds.some((id) => typeof id !== 'string' || id.length === 0)) {
    throw new Error('registered world opportunity cannot supply two deterministic deposits');
  }
  const projectedStardust = 3 + opportunity.effectiveTier * 2;
  const reason = suppressionReason(canonicalEarth, training, landing);
  const stardust = reason === null ? projectedStardust : 0;
  const witness: FieldSampleWitness = Object.freeze({
    schema: FIELD_SAMPLE_WITNESS_SCHEMA,
    worldKey: opportunity.key,
    planetSeed: address.planet.seed,
    planetOrdinal: address.planet.ordinal,
    rawTier: opportunity.rawTier,
    effectiveTier: opportunity.effectiveTier,
    canonicalEarth,
    landing,
    training,
    depositIds,
    stardust,
  });
  let result: FieldSampleProjection;
  if (reason !== null) {
    result = Object.freeze({
      schema: FIELD_SAMPLE_PROJECTION_SCHEMA,
      kind: 'suppressed',
      reason,
      witness,
    });
  } else {
    const materials = Object.freeze(depositIds.map((id): FieldSampleMaterialGrant => Object.freeze({
      id,
      quantity: 1,
    })));
    const reward: FieldSampleReward = Object.freeze({ materials, stardust: projectedStardust });
    result = Object.freeze({
      schema: FIELD_SAMPLE_PROJECTION_SCHEMA,
      kind: 'grant',
      reward,
      witness,
    });
  }
  FIELD_SAMPLE_PROJECTIONS.add(result);
  return result;
}

export function isFieldSampleProjection(value: unknown): value is FieldSampleProjection {
  return typeof value === 'object'
    && value !== null
    && FIELD_SAMPLE_PROJECTIONS.has(value)
    && (value as FieldSampleProjection).schema === FIELD_SAMPLE_PROJECTION_SCHEMA;
}
