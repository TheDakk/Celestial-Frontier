/* Canonical descent wave-off progress.

   The v1 compatibility save names a world only by planet seed (`wvo`). That
   evidence is retained as an explicitly unresolved row until a real,
   source-proven CF1 world is encountered. Current progress is keyed by the
   complete canonical address, so two worlds with the same leaf seed never
   share their learned approach. */
import {
  isCanonicalCF1Address,
  resolveCF1WorldKey,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
} from '@cf/scene';

export const DESCENT_WAVE_OFF_STATE_SCHEMA_V1 = 'cf-v2-descent-wave-offs/v1' as const;
export const DESCENT_WAVE_OFF_STATE_VERSION_V1 = 1 as const;
export const MAX_DESCENT_WAVE_OFF_WORLDS_V1 = 400 as const;
export const MAX_DESCENT_WAVE_OFFS_PER_WORLD_V1 = 5 as const;
export const MAX_DESCENT_WAVE_OFF_STATE_JSON_BYTES_V1 = 131_072 as const;

export interface DescentWaveOffRecordV1 {
  readonly key: CF1WorldKey;
  readonly address: CanonicalCF1WorldAddress;
  readonly count: number;
}

export interface LegacyDescentWaveOffEvidenceV1 {
  readonly seed: number;
  readonly count: number;
}

export interface DescentWaveOffStateV1 {
  readonly schema: typeof DESCENT_WAVE_OFF_STATE_SCHEMA_V1;
  /** Strictly ascending complete CF1 keys. */
  readonly records: readonly DescentWaveOffRecordV1[];
  /** Strictly ascending seed-only compatibility evidence awaiting one exact encounter. */
  readonly unresolved: readonly LegacyDescentWaveOffEvidenceV1[];
}

export type DescentWaveOffOutcomeKindV1 = 'failure' | 'success';

interface DescentWaveOffStateMirrorV1 {
  readonly schema: typeof DESCENT_WAVE_OFF_STATE_SCHEMA_V1;
  readonly version: typeof DESCENT_WAVE_OFF_STATE_VERSION_V1;
  readonly records: readonly (readonly [key: string, count: number])[];
  readonly unresolved: readonly (readonly [seed: number, count: number])[];
}

const STATES = new WeakSet<object>();

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length
    || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function checkedLegacySeed(value: unknown, label: string): number {
  /* The v4 importer deliberately retained every finite numeric key after its
     number coercion; values outside uint32 can never bind to a CF1 address,
     but dropping one here would rewrite accepted legacy evidence. */
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite legacy seed`);
  }
  return Object.is(value, -0) ? 0 : value;
}

function checkedCount(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1
    || (value as number) > MAX_DESCENT_WAVE_OFFS_PER_WORLD_V1) {
    throw new RangeError(`${label} must be an integer from 1 through 5`);
  }
  return value as number;
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function compareKeys(
  left: Pick<DescentWaveOffRecordV1, 'key'>,
  right: Pick<DescentWaveOffRecordV1, 'key'>,
): number {
  return left.key < right.key ? -1 : left.key > right.key ? 1 : 0;
}

function mirror(state: DescentWaveOffStateV1): DescentWaveOffStateMirrorV1 {
  return {
    schema: DESCENT_WAVE_OFF_STATE_SCHEMA_V1,
    version: DESCENT_WAVE_OFF_STATE_VERSION_V1,
    records: state.records.map(({ key, count }) => [key, count] as const),
    unresolved: state.unresolved.map(({ seed, count }) => [seed, count] as const),
  };
}

function registerState(
  recordValues: readonly DescentWaveOffRecordV1[],
  unresolvedValues: readonly LegacyDescentWaveOffEvidenceV1[],
): DescentWaveOffStateV1 {
  if (recordValues.length + unresolvedValues.length > MAX_DESCENT_WAVE_OFF_WORLDS_V1) {
    throw new RangeError('descent wave-off progress exceeds the 400-world compatibility bound');
  }
  const records = recordValues.map((row, index): DescentWaveOffRecordV1 => {
    if (!isPlainRecord(row)) throw new TypeError(`descent wave-off record ${index} must be an object`);
    exactKeys(row, ['key', 'address', 'count'], `descent wave-off record ${index}`);
    if (!isCanonicalCF1Address(row.address) || !('planet' in row.address)) {
      throw new TypeError(`descent wave-off record ${index} needs a registered CF1 world`);
    }
    if (row.key !== row.address.key) {
      throw new RangeError(`descent wave-off record ${index} key does not match its address`);
    }
    return Object.freeze({
      key: row.address.key,
      address: row.address,
      count: checkedCount(row.count, `descent wave-off record ${index} count`),
    });
  });
  let previousKey: string | null = null;
  for (const record of records) {
    if (previousKey !== null && record.key <= previousKey) {
      throw new RangeError('descent wave-off records must have unique ascending canonical keys');
    }
    previousKey = record.key;
  }

  const unresolved = unresolvedValues.map((row, index): LegacyDescentWaveOffEvidenceV1 => {
    if (!isPlainRecord(row)) {
      throw new TypeError(`legacy descent wave-off evidence ${index} must be an object`);
    }
    exactKeys(row, ['seed', 'count'], `legacy descent wave-off evidence ${index}`);
    return Object.freeze({
      seed: checkedLegacySeed(row.seed, `legacy descent wave-off evidence ${index} seed`),
      count: checkedCount(row.count, `legacy descent wave-off evidence ${index} count`),
    });
  });
  let previousSeed = Number.NEGATIVE_INFINITY;
  for (const row of unresolved) {
    if (row.seed <= previousSeed) {
      throw new RangeError('legacy descent wave-off evidence must have unique ascending seeds');
    }
    previousSeed = row.seed;
    if (records.some(({ address }) => address.planet.seed === row.seed)) {
      throw new RangeError('resolved and unresolved descent wave-off evidence cannot overlap');
    }
  }

  const state: DescentWaveOffStateV1 = Object.freeze({
    schema: DESCENT_WAVE_OFF_STATE_SCHEMA_V1,
    records: Object.freeze(records),
    unresolved: Object.freeze(unresolved),
  });
  if (utf8ByteLength(JSON.stringify(mirror(state))) > MAX_DESCENT_WAVE_OFF_STATE_JSON_BYTES_V1) {
    throw new RangeError('descent wave-off state exceeds its canonical JSON byte bound');
  }
  STATES.add(state);
  return state;
}

export function createEmptyDescentWaveOffStateV1(): DescentWaveOffStateV1 {
  return registerState([], []);
}

/** Convert the already-sanitized v4 `waveOffs` mirror into retained, explicitly
 * seed-only evidence. Input order is not authority; duplicate seeds keep the
 * same last-value semantics as the v1 Map loader. */
export function createLegacyDescentWaveOffStateV1(value: unknown): DescentWaveOffStateV1 {
  if (!Array.isArray(value) || value.length > MAX_DESCENT_WAVE_OFF_WORLDS_V1) {
    throw new RangeError('legacy descent wave-off mirror exceeds the 400-world bound');
  }
  const bySeed = new Map<number, number>();
  for (let index = 0; index < value.length; index++) {
    const row = value[index];
    if (!Array.isArray(row) || row.length !== 2
      || !Object.hasOwn(row, 0) || !Object.hasOwn(row, 1)) {
      throw new TypeError(`legacy descent wave-off row ${index} is malformed`);
    }
    bySeed.set(
      checkedLegacySeed(row[0], `legacy descent wave-off row ${index} seed`),
      checkedCount(row[1], `legacy descent wave-off row ${index} count`),
    );
  }
  const unresolved = [...bySeed]
    .sort(([left], [right]) => left - right)
    .map(([seed, count]) => ({ seed, count }));
  return registerState([], unresolved);
}

export function isDescentWaveOffStateV1(value: unknown): value is DescentWaveOffStateV1 {
  return typeof value === 'object' && value !== null && STATES.has(value)
    && (value as DescentWaveOffStateV1).schema === DESCENT_WAVE_OFF_STATE_SCHEMA_V1;
}

export function descentWaveOffCountV1(
  state: DescentWaveOffStateV1,
  address: CanonicalCF1WorldAddress,
): number {
  if (!isDescentWaveOffStateV1(state)) {
    throw new TypeError('descent wave-off state must be registered by this package');
  }
  if (!isCanonicalCF1Address(address) || !('planet' in address)) {
    throw new TypeError('descent wave-off lookup requires a registered CF1 world');
  }
  const exact = state.records.find(({ key }) => key === address.key);
  if (exact !== undefined) return exact.count;
  return state.unresolved.find(({ seed }) => seed === address.planet.seed)?.count ?? 0;
}

/** Apply the selected product result without touching the input state. A
 * first exact encounter consumes matching seed-only evidence; subsequent
 * worlds with the same leaf seed remain independent by full CF1 key. */
export function stageDescentWaveOffOutcomeV1(
  state: DescentWaveOffStateV1,
  address: CanonicalCF1WorldAddress,
  outcome: DescentWaveOffOutcomeKindV1,
): DescentWaveOffStateV1 {
  const countBefore = descentWaveOffCountV1(state, address);
  if (outcome !== 'failure' && outcome !== 'success') {
    throw new TypeError('descent wave-off outcome must be failure or success');
  }
  const records = state.records.filter(({ key }) => key !== address.key);
  const unresolved = state.unresolved.filter(({ seed }) => seed !== address.planet.seed);
  if (outcome === 'failure') {
    if (countBefore >= MAX_DESCENT_WAVE_OFFS_PER_WORLD_V1) {
      throw new RangeError('a fully learned approach cannot wave off again');
    }
    records.push({ key: address.key, address, count: countBefore + 1 });
    records.sort(compareKeys);
  }
  return registerState(records, unresolved);
}

/** Compatibility projection only. Exact rows that share a leaf seed collapse
 * to their maximum count because v4 cannot represent the distinction; the
 * canonical extension remains the sole current authority. */
export function projectLegacyDescentWaveOffMirrorV1(
  state: DescentWaveOffStateV1,
): readonly (readonly [seed: number, count: number])[] {
  if (!isDescentWaveOffStateV1(state)) {
    throw new TypeError('descent wave-off state must be registered by this package');
  }
  const bySeed = new Map<number, number>();
  for (const { seed, count } of state.unresolved) bySeed.set(seed, count);
  for (const { address, count } of state.records) {
    bySeed.set(address.planet.seed, Math.max(count, bySeed.get(address.planet.seed) ?? 0));
  }
  return Object.freeze([...bySeed]
    .sort(([left], [right]) => left - right)
    .map(([seed, count]) => Object.freeze([seed, count] as const)));
}

export function encodeDescentWaveOffStateV1(state: DescentWaveOffStateV1): string {
  if (!isDescentWaveOffStateV1(state)) {
    throw new TypeError('descent wave-off state must be registered by this package');
  }
  return JSON.stringify(mirror(state));
}

export function decodeDescentWaveOffStateV1(encoded: string): DescentWaveOffStateV1 {
  if (typeof encoded !== 'string' || encoded.length < 1
    || utf8ByteLength(encoded) > MAX_DESCENT_WAVE_OFF_STATE_JSON_BYTES_V1) {
    throw new RangeError('descent wave-off JSON is empty or exceeds its byte bound');
  }
  let value: unknown;
  try { value = JSON.parse(encoded); }
  catch { throw new TypeError('descent wave-off JSON is malformed'); }
  if (!isPlainRecord(value)) throw new TypeError('descent wave-off payload must be an object');
  exactKeys(value, ['schema', 'version', 'records', 'unresolved'], 'descent wave-off payload');
  if (value.schema !== DESCENT_WAVE_OFF_STATE_SCHEMA_V1
    || value.version !== DESCENT_WAVE_OFF_STATE_VERSION_V1
    || !Array.isArray(value.records) || !Array.isArray(value.unresolved)) {
    throw new TypeError('descent wave-off payload schema or rows are invalid');
  }
  const records = value.records.map((row, index): DescentWaveOffRecordV1 => {
    if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string') {
      throw new TypeError(`descent wave-off persisted record ${index} is malformed`);
    }
    const resolved = resolveCF1WorldKey(row[0]);
    if (!resolved.ok) {
      throw new RangeError(`descent wave-off persisted record ${index} cannot be source-reproved`);
    }
    return { key: resolved.address.key, address: resolved.address, count: checkedCount(
      row[1], `descent wave-off persisted record ${index} count`,
    ) };
  });
  const unresolved = value.unresolved.map((row, index): LegacyDescentWaveOffEvidenceV1 => {
    if (!Array.isArray(row) || row.length !== 2) {
      throw new TypeError(`legacy descent wave-off persisted row ${index} is malformed`);
    }
    return {
      seed: checkedLegacySeed(row[0], `legacy descent wave-off persisted row ${index} seed`),
      count: checkedCount(row[1], `legacy descent wave-off persisted row ${index} count`),
    };
  });
  const state = registerState(records, unresolved);
  if (encodeDescentWaveOffStateV1(state) !== encoded) {
    throw new RangeError('descent wave-off JSON is not canonical');
  }
  return state;
}
