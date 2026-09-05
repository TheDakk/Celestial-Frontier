/* Registered Arc 0/3 economy-source adapters.

   This module does not reproduce Mine, Skim, or first-landfall reward math.
   It accepts only the private brands created by those product planners and
   converts their already-decided grants into the source-neutral Arc 2
   analytical ledger. */
import {
  type EconomySourceAuthority,
  type EconomySourceReceiptEvent,
} from '@cf/domain-loot';
import { MAX_ACTIVE_PLAY_MS } from '@cf/domain-progression';
import {
  ENGINEERING_WITNESS_SCHEMA,
  isEngineeringActionPlan,
  type EngineeringActionPlan,
  type MiningResult,
  type StellarSkimResult,
} from './planner.js';
import {
  isFieldSampleProjection,
  type FieldSampleProjection,
} from './field-samples.js';

export const ARC3_ECONOMY_SOURCE_MODEL_VERSION = 1 as const;
export const ARC0_FIELD_SAMPLE_SOURCE_OWNER_V1 = 'arc0-field-samples' as const;
export const ARC3_WORLD_MINING_SOURCE_OWNER_V1 = 'arc3-world-mining' as const;
export const ARC3_STELLAR_SKIM_SOURCE_OWNER_V1 = 'arc3-stellar-skimming' as const;

export const ARC3_ECONOMY_SOURCE_AUTHORITIES_V1: readonly EconomySourceAuthority[] =
  Object.freeze([
    Object.freeze({
      ownerId: ARC0_FIELD_SAMPLE_SOURCE_OWNER_V1,
      version: ARC3_ECONOMY_SOURCE_MODEL_VERSION,
    }),
    Object.freeze({
      ownerId: ARC3_WORLD_MINING_SOURCE_OWNER_V1,
      version: ARC3_ECONOMY_SOURCE_MODEL_VERSION,
    }),
    Object.freeze({
      ownerId: ARC3_STELLAR_SKIM_SOURCE_OWNER_V1,
      version: ARC3_ECONOMY_SOURCE_MODEL_VERSION,
    }),
  ]);

export interface EconomySourceReceiptOptionsV1 {
  readonly receiptId: string;
  readonly activePlayMs: number;
}

const OPTION_FIELDS = Object.freeze(['receiptId', 'activePlayMs'] as const);

function options(value: EconomySourceReceiptOptionsV1): EconomySourceReceiptOptionsV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('economy source receipt options must be exact plain data');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('economy source receipt options must use a plain prototype');
  }
  const keys = Reflect.ownKeys(value);
  const names = keys.filter((key): key is string => typeof key === 'string').sort();
  const expected = [...OPTION_FIELDS].sort();
  if (names.length !== keys.length || names.length !== expected.length
    || names.some((name, index) => name !== expected[index])) {
    throw new TypeError('economy source receipt options have unknown or missing fields');
  }
  const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const field of OPTION_FIELDS) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
      throw new TypeError(`economy source receipt option ${field} must be enumerable data`);
    }
    fields[field] = descriptor.value;
  }
  if (typeof fields.receiptId !== 'string' || fields.receiptId.length < 1
    || fields.receiptId.length > 512 || /[\u0000-\u001f\u007f]/.test(fields.receiptId)) {
    throw new RangeError('economy source receiptId must be 1–512 printable characters');
  }
  if (!Number.isSafeInteger(fields.activePlayMs) || (fields.activePlayMs as number) < 0
    || (fields.activePlayMs as number) > MAX_ACTIVE_PLAY_MS) {
    throw new RangeError('economy source active play must be bounded');
  }
  return Object.freeze({
    receiptId: fields.receiptId,
    activePlayMs: fields.activePlayMs,
  }) as EconomySourceReceiptOptionsV1;
}

function quantities(
  values: readonly Readonly<{ readonly id: string; readonly quantity: number }>[],
): Readonly<Record<string, number>> {
  const result: Record<string, number> = Object.create(null) as Record<string, number>;
  for (const value of values) {
    if (typeof value.id !== 'string' || value.id.length < 1
      || !Number.isSafeInteger(value.quantity) || value.quantity < 1
      || Object.hasOwn(result, value.id)) {
      throw new TypeError('registered source result has non-canonical quantities');
    }
    result[value.id] = value.quantity;
  }
  return Object.freeze(Object.fromEntries(Object.entries(result).sort(([left], [right]) => (
    left < right ? -1 : left > right ? 1 : 0
  ))));
}

function planActivePlayMs(plan: EngineeringActionPlan<unknown>): number {
  let witness: unknown;
  try { witness = JSON.parse(plan.witness); }
  catch { throw new TypeError('registered engineering plan witness is not readable'); }
  if (!witness || typeof witness !== 'object' || Array.isArray(witness)
    || (witness as { schema?: unknown }).schema !== ENGINEERING_WITNESS_SCHEMA) {
    throw new TypeError('registered engineering plan witness is not canonical');
  }
  const activePlayMs = (witness as { activePlayMs?: unknown }).activePlayMs;
  if (!Number.isSafeInteger(activePlayMs) || (activePlayMs as number) < 0
    || (activePlayMs as number) > MAX_ACTIVE_PLAY_MS) {
    throw new TypeError('registered engineering plan has no bounded active-play witness');
  }
  return activePlayMs as number;
}

function receipt(
  ownerId: string,
  sourceId: string,
  grant: Readonly<{ materials: Readonly<Record<string, number>>; stardust: number }>,
  supplied: EconomySourceReceiptOptionsV1,
): EconomySourceReceiptEvent {
  const checked = options(supplied);
  if (typeof sourceId !== 'string' || sourceId.length < 1 || sourceId.length > 512) {
    throw new TypeError('registered economy source has no canonical source ID');
  }
  if (!Number.isSafeInteger(grant.stardust) || grant.stardust < 0) {
    throw new TypeError('registered economy source has invalid Stardust');
  }
  return Object.freeze({
    kind: 'source-receipt',
    receiptId: checked.receiptId,
    sourceOwnerId: ownerId,
    sourceVersion: ARC3_ECONOMY_SOURCE_MODEL_VERSION,
    sourceId,
    activePlayMs: checked.activePlayMs,
    materials: grant.materials,
    stardust: grant.stardust,
  });
}

export function economyReceiptFromWorldMiningV1(
  plan: EngineeringActionPlan<MiningResult>,
  supplied: EconomySourceReceiptOptionsV1,
): EconomySourceReceiptEvent {
  if (!isEngineeringActionPlan(plan) || plan.operation !== 'mine-world') {
    throw new TypeError('world economy receipt requires a registered Mine plan');
  }
  const checked = options(supplied);
  if (planActivePlayMs(plan) !== checked.activePlayMs
    || plan.result.sourceKey.length < 1 || plan.result.loads < 1) {
    throw new TypeError('Mine receipt does not match its registered action witness');
  }
  return receipt(
    ARC3_WORLD_MINING_SOURCE_OWNER_V1,
    plan.result.sourceKey,
    Object.freeze({ materials: quantities(plan.result.materials), stardust: 0 }),
    checked,
  );
}

export function economyReceiptFromStellarSkimV1(
  plan: EngineeringActionPlan<StellarSkimResult>,
  supplied: EconomySourceReceiptOptionsV1,
): EconomySourceReceiptEvent {
  if (!isEngineeringActionPlan(plan) || plan.operation !== 'skim-star') {
    throw new TypeError('stellar economy receipt requires a registered Skim plan');
  }
  const checked = options(supplied);
  if (planActivePlayMs(plan) !== checked.activePlayMs
    || plan.result.sourceKey.length < 1 || plan.result.quantity < 1) {
    throw new TypeError('Skim receipt does not match its registered action witness');
  }
  return receipt(
    ARC3_STELLAR_SKIM_SOURCE_OWNER_V1,
    plan.result.sourceKey,
    Object.freeze({
      materials: quantities(Object.freeze([Object.freeze({
        id: plan.result.material,
        quantity: plan.result.quantity,
      })])),
      stardust: 0,
    }),
    checked,
  );
}

export function economyReceiptFromFieldSamplesV1(
  projection: FieldSampleProjection,
  supplied: EconomySourceReceiptOptionsV1,
): EconomySourceReceiptEvent {
  if (!isFieldSampleProjection(projection) || projection.kind !== 'grant') {
    throw new TypeError('field-sample economy receipt requires a registered grant');
  }
  return receipt(
    ARC0_FIELD_SAMPLE_SOURCE_OWNER_V1,
    projection.witness.worldKey,
    Object.freeze({
      materials: quantities(projection.reward.materials),
      stardust: projection.reward.stardust,
    }),
    supplied,
  );
}
