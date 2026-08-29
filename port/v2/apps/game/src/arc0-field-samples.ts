/* Arc 0 field-sample compatibility projection.

   The domain owner decides whether a landing earns a reward. This app adapter
   preflights every touched legacy field and returns one detached successor
   projection; it never mutates, persists, retries, or partially publishes. */
import {
  projectFieldSamples,
  type FieldSampleLandingAuthority,
  type FieldSampleProjection,
  type FieldSampleReward,
  type FieldSampleSuppressionReason,
  type FieldSampleWitness,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import type { CanonicalCF1WorldAddress } from '@cf/scene';

export const ARC0_FIELD_SAMPLE_CARGO_MAX = 1_000_000 as const;
export const ARC0_FIELD_SAMPLE_CARGO_ROWS_MAX = 200 as const;
export const ARC0_FIELD_SAMPLE_COUNTER_MAX = 1_000_000_000 as const;

export interface Arc0FieldSampleState {
  cargo: Array<readonly [string, number]>;
  essence: number;
  stats: Record<string, number>;
}

export interface Arc0FieldSampleProjection {
  readonly cargo: readonly (readonly [string, number])[];
  readonly essence: number;
  readonly stats: Readonly<Record<string, number>>;
}

export interface DeriveArc0FieldSamplesInput {
  readonly source: Arc0FieldSampleState;
  readonly address: CanonicalCF1WorldAddress;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly landing: FieldSampleLandingAuthority;
  readonly training: boolean;
}

export type Arc0FieldSampleRefusalDetail =
  | 'authority-invalid'
  | 'source-invalid'
  | 'cargo-capacity'
  | 'essence-capacity'
  | 'essence-earned-capacity'
  | 'landings-capacity';

export type Arc0FieldSampleDerivation =
  | Readonly<{
    kind: 'ready';
    projection: Arc0FieldSampleProjection;
    reward: FieldSampleReward;
    witness: FieldSampleWitness;
    domain: Extract<FieldSampleProjection, { readonly kind: 'grant' }>;
  }>
  | Readonly<{
    kind: 'unchanged';
    reason: FieldSampleSuppressionReason;
    witness: FieldSampleWitness;
    domain: Extract<FieldSampleProjection, { readonly kind: 'suppressed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    detail: Arc0FieldSampleRefusalDetail;
  }>;

interface CapturedSource {
  readonly cargo: readonly (readonly [string, number])[];
  readonly essence: number;
  readonly stats: Readonly<Record<string, number>>;
}

const INPUT_FIELDS = Object.freeze([
  'source', 'address', 'opportunity', 'landing', 'training',
] as const);
const SOURCE_FIELDS = Object.freeze(['cargo', 'essence', 'stats'] as const);
const MATERIAL_ID_MAX_CHARS = 128;
const STATS_ROWS_MAX = 256;
const STAT_ID_MAX_CHARS = 128;

function exactDataFields(
  value: unknown,
  expectedFields: readonly string[],
): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  const names = keys.filter((key): key is string => typeof key === 'string').sort();
  const expected = [...expectedFields].sort();
  if (names.length !== keys.length || names.length !== expected.length
    || names.some((name, index) => name !== expected[index])) return null;
  const fields: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const field of expectedFields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
    fields[field] = descriptor.value;
  }
  return Object.freeze(fields);
}

function densePair(value: unknown): readonly [string, number] | null {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length !== 2) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 3) return null;
  const first = Object.getOwnPropertyDescriptor(value, '0');
  const second = Object.getOwnPropertyDescriptor(value, '1');
  if (!first || !('value' in first) || first.enumerable !== true
    || !second || !('value' in second) || second.enumerable !== true) return null;
  if (typeof first.value !== 'string' || first.value.length === 0
    || first.value.length > MATERIAL_ID_MAX_CHARS
    || !Number.isSafeInteger(second.value) || second.value < 0
    || second.value > ARC0_FIELD_SAMPLE_CARGO_MAX) return null;
  return Object.freeze([first.value, second.value]);
}

function capturedCargo(value: unknown): readonly (readonly [string, number])[] | null {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > ARC0_FIELD_SAMPLE_CARGO_ROWS_MAX) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1) return null;
  const seen = new Set<string>();
  const rows: Array<readonly [string, number]> = [];
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
    const row = densePair(descriptor.value);
    if (row === null || seen.has(row[0])) return null;
    seen.add(row[0]);
    rows.push(row);
  }
  return Object.freeze(rows);
}

function capturedStats(value: unknown): Readonly<Record<string, number>> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length > STATS_ROWS_MAX) return null;
  const stats: Record<string, number> = Object.create(null) as Record<string, number>;
  for (const key of keys) {
    if (typeof key !== 'string' || key.length === 0 || key.length > STAT_ID_MAX_CHARS) return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
      || !Number.isSafeInteger(descriptor.value) || descriptor.value < 0
      || descriptor.value > ARC0_FIELD_SAMPLE_COUNTER_MAX) return null;
    stats[key] = descriptor.value;
  }
  return Object.freeze(stats);
}

function capturedSource(value: unknown): CapturedSource | null {
  const fields = exactDataFields(value, SOURCE_FIELDS);
  if (fields === null) return null;
  const cargo = capturedCargo(fields.cargo);
  const stats = capturedStats(fields.stats);
  if (cargo === null || stats === null
    || !Number.isSafeInteger(fields.essence) || (fields.essence as number) < 0
    || (fields.essence as number) > ARC0_FIELD_SAMPLE_COUNTER_MAX) return null;
  return Object.freeze({
    cargo,
    essence: fields.essence as number,
    stats,
  });
}

function refused(detail: Arc0FieldSampleRefusalDetail): Arc0FieldSampleDerivation {
  return Object.freeze({ kind: 'refused', detail });
}

function addWithin(value: number, increment: number, max: number): number | null {
  if (!Number.isSafeInteger(value) || value < 0 || value > max
    || !Number.isSafeInteger(increment) || increment < 0 || increment > max - value) return null;
  return value + increment;
}

/** Derive all legacy sample fields as one capacity-checked immutable value. */
export function deriveArc0FieldSamples(
  inputValue: DeriveArc0FieldSamplesInput,
): Arc0FieldSampleDerivation {
  let input: Readonly<Record<string, unknown>> | null;
  try {
    input = exactDataFields(inputValue, INPUT_FIELDS);
  } catch {
    return refused('authority-invalid');
  }
  if (input === null) return refused('authority-invalid');

  let domain: FieldSampleProjection;
  try {
    domain = projectFieldSamples({
      address: input.address as CanonicalCF1WorldAddress,
      opportunity: input.opportunity as WorldOpportunitySnapshot,
      landing: input.landing as FieldSampleLandingAuthority,
      training: input.training as boolean,
    });
  } catch {
    return refused('authority-invalid');
  }
  if (domain.kind === 'suppressed') {
    return Object.freeze({
      kind: 'unchanged',
      reason: domain.reason,
      witness: domain.witness,
      domain,
    });
  }

  let source: CapturedSource | null;
  try {
    source = capturedSource(input.source);
  } catch {
    return refused('source-invalid');
  }
  if (source === null) return refused('source-invalid');
  const cargo = new Map<string, number>(source.cargo);
  for (const material of domain.reward.materials) {
    const current = cargo.get(material.id) ?? 0;
    const next = addWithin(current, material.quantity, ARC0_FIELD_SAMPLE_CARGO_MAX);
    if (next === null) return refused('cargo-capacity');
    if (!cargo.has(material.id) && cargo.size >= ARC0_FIELD_SAMPLE_CARGO_ROWS_MAX) {
      return refused('cargo-capacity');
    }
    cargo.set(material.id, next);
  }

  const essence = addWithin(
    source.essence,
    domain.reward.stardust,
    ARC0_FIELD_SAMPLE_COUNTER_MAX,
  );
  if (essence === null) return refused('essence-capacity');
  const essenceEarned = addWithin(
    source.stats.essenceEarned ?? 0,
    domain.reward.stardust,
    ARC0_FIELD_SAMPLE_COUNTER_MAX,
  );
  if (essenceEarned === null) return refused('essence-earned-capacity');
  const landings = addWithin(
    source.stats.landings ?? 0,
    1,
    ARC0_FIELD_SAMPLE_COUNTER_MAX,
  );
  if (landings === null) return refused('landings-capacity');

  const cargoRows = Object.freeze(
    [...cargo.entries()].map(([id, quantity]) => Object.freeze([id, quantity] as const)),
  );
  const stats = Object.freeze({
    ...source.stats,
    essenceEarned,
    landings,
  });
  const projection: Arc0FieldSampleProjection = Object.freeze({
    cargo: cargoRows,
    essence,
    stats,
  });
  return Object.freeze({
    kind: 'ready',
    projection,
    reward: domain.reward,
    witness: domain.witness,
    domain,
  });
}
