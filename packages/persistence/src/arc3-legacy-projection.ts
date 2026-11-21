/* Arc 3 legacy-v4 compatibility projection.

   Full CF1 addresses remain canonical authority. The old v4 carriers can
   name only a planet/star leaf seed, so a leaf shared by multiple canonical
   addresses is never combined or selected: its prior carrier rows are held
   exactly when present and remain absent when absent. Wall timestamps are
   compatibility presentation only; this adapter derives no accrual. */
import {
  MAX_ENGINEERING_SOURCES,
  isEngineeringState,
  type EngineeringStateV2,
  type ResearchId,
} from '@cf/domain-opportunity';

export const ARC3_LEGACY_PROJECTION_SCHEMA = 'cf-v2-arc3-legacy-projection/v1' as const;
export const MAX_ARC3_LEGACY_COMPATIBILITY_COUNT = 1_000_000;

const UINT32_MAX = 0xffff_ffff;

export type Arc3LegacyCountRow = readonly [leafSeed: number, count: number];
export type Arc3LegacyMinedRow = readonly [planetSeed: number, compatibilityTimestamp: number];

export interface Arc3LegacyEngineeringFieldsV4 {
  readonly mineX: readonly Arc3LegacyCountRow[];
  readonly mined: readonly Arc3LegacyMinedRow[];
  readonly skimX: readonly Arc3LegacyCountRow[];
  readonly techOwned: readonly ResearchId[];
}

export interface Arc3LegacyEngineeringPriorV4 {
  readonly mineX: readonly (readonly [unknown, unknown])[];
  readonly mined: readonly (readonly [unknown, unknown])[];
  readonly skimX: readonly (readonly [unknown, unknown])[];
}

export type Arc3LegacyMinedTimestampIntent =
  | Readonly<{ kind: 'preserve' }>
  | Readonly<{ kind: 'touched-world'; worldKey: string }>
  | Readonly<{ kind: 'refresh-all' }>;

interface Arc3ExactWorldDiagnostic {
  readonly source: 'world';
  readonly leafSeed: number;
  readonly disposition: 'exact';
  readonly canonicalKeys: readonly [string];
  readonly carriers: Readonly<{ mineX: 'exact'; mined: 'present' | 'absent' }>;
}

interface Arc3CollisionHeldWorldDiagnostic {
  readonly source: 'world';
  readonly leafSeed: number;
  readonly disposition: 'collision-held';
  readonly canonicalKeys: readonly string[];
  readonly carriers: Readonly<{
    mineX: 'held' | 'absent';
    mined: 'held' | 'absent';
  }>;
}

interface Arc3ExactStarDiagnostic {
  readonly source: 'star';
  readonly leafSeed: number;
  readonly disposition: 'exact';
  readonly canonicalKeys: readonly [string];
  readonly carriers: Readonly<{ skimX: 'exact' }>;
}

interface Arc3CollisionHeldStarDiagnostic {
  readonly source: 'star';
  readonly leafSeed: number;
  readonly disposition: 'collision-held';
  readonly canonicalKeys: readonly string[];
  readonly carriers: Readonly<{ skimX: 'held' | 'absent' }>;
}

export type Arc3LegacyProjectionDiagnostic =
  | Arc3ExactWorldDiagnostic
  | Arc3CollisionHeldWorldDiagnostic
  | Arc3ExactStarDiagnostic
  | Arc3CollisionHeldStarDiagnostic;

export interface Arc3LegacyEngineeringProjection {
  readonly schema: typeof ARC3_LEGACY_PROJECTION_SCHEMA;
  readonly legacy: Arc3LegacyEngineeringFieldsV4;
  /** One row per canonical leaf group. `collision-held` always means the
      prior carrier policy won; presence flags say which prior rows existed. */
  readonly diagnostics: readonly Arc3LegacyProjectionDiagnostic[];
}

export interface Arc3LegacyEngineeringProjectionInput {
  readonly state: EngineeringStateV2;
  readonly prior: Arc3LegacyEngineeringPriorV4;
  readonly codecNow: number;
  readonly minedTimestampIntent: Arc3LegacyMinedTimestampIntent;
}

function codeUnitCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value);
  if (actual.length !== expected.length || actual.some((key) => !expected.includes(key))) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function checkedLeafSeed(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > UINT32_MAX
    || Object.is(value, -0)) {
    throw new RangeError(`${label} must be an exact uint32`);
  }
  return value as number;
}

function checkedCount(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)
    || (value as number) < 0
    || (value as number) > MAX_ARC3_LEGACY_COMPATIBILITY_COUNT
    || Object.is(value, -0)) {
    throw new RangeError(`${label} must be an integer from 0 through ${MAX_ARC3_LEGACY_COMPATIBILITY_COUNT}`);
  }
  return value as number;
}

function checkedTimestamp(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || Object.is(value, -0)) {
    throw new RangeError(`${label} must be a non-negative safe integer`);
  }
  return value as number;
}

function checkedRows(
  value: unknown,
  rowKind: 'count' | 'timestamp',
  label: string,
): ReadonlyMap<number, number> {
  if (!Array.isArray(value) || value.length > MAX_ENGINEERING_SOURCES) {
    throw new RangeError(`${label} exceeds the compatibility bound`);
  }
  const result = new Map<number, number>();
  for (let index = 0; index < value.length; index++) {
    const row = value[index];
    if (!Array.isArray(row) || row.length !== 2) {
      throw new TypeError(`${label} row ${index} must be an exact pair`);
    }
    const seed = checkedLeafSeed(row[0], `${label} row ${index} seed`);
    if (result.has(seed)) throw new RangeError(`${label} repeats leaf seed ${seed}`);
    const datum = rowKind === 'count'
      ? checkedCount(row[1], `${label} row ${index} count`)
      : checkedTimestamp(row[1], `${label} row ${index} timestamp`);
    result.set(seed, datum);
  }
  return result;
}

function checkedPrior(value: Arc3LegacyEngineeringPriorV4): Readonly<{
  mineX: ReadonlyMap<number, number>;
  mined: ReadonlyMap<number, number>;
  skimX: ReadonlyMap<number, number>;
}> {
  if (!isPlainRecord(value)) throw new TypeError('Arc 3 prior legacy fields must be an object');
  exactKeys(value, ['mineX', 'mined', 'skimX'], 'Arc 3 prior legacy fields');
  return {
    mineX: checkedRows(value.mineX, 'count', 'Arc 3 prior mineX'),
    mined: checkedRows(value.mined, 'timestamp', 'Arc 3 prior mined'),
    skimX: checkedRows(value.skimX, 'count', 'Arc 3 prior skimX'),
  };
}

function checkedIntent(
  value: Arc3LegacyMinedTimestampIntent,
  state: EngineeringStateV2,
): Arc3LegacyMinedTimestampIntent {
  if (!isPlainRecord(value) || typeof value.kind !== 'string') {
    throw new TypeError('Arc 3 mined timestamp intent must be an object');
  }
  if (value.kind === 'preserve' || value.kind === 'refresh-all') {
    exactKeys(value, ['kind'], 'Arc 3 mined timestamp intent');
    return value;
  }
  if (value.kind !== 'touched-world') {
    throw new RangeError('Arc 3 mined timestamp intent is unsupported');
  }
  exactKeys(value, ['kind', 'worldKey'], 'Arc 3 mined timestamp intent');
  if (typeof value.worldKey !== 'string'
    || !state.worlds.some(({ key }) => key === value.worldKey)) {
    throw new RangeError('Arc 3 touched world must exist in canonical engineering state');
  }
  return value;
}

function groupedByLeaf<T>(
  rows: readonly T[],
  leafOf: (row: T) => number,
  keyOf: (row: T) => string,
  countOf: (row: T) => number,
  label: string,
): ReadonlyMap<number, readonly T[]> {
  const groups = new Map<number, T[]>();
  for (const row of rows) {
    const seed = checkedLeafSeed(leafOf(row), `${label} leaf seed`);
    checkedCount(countOf(row), `${label} ${keyOf(row)} extraction count`);
    const group = groups.get(seed);
    if (group) group.push(row);
    else groups.set(seed, [row]);
  }
  for (const group of groups.values()) {
    group.sort((left, right) => codeUnitCompare(keyOf(left), keyOf(right)));
  }
  return groups;
}

function sortedSeeds(groups: ReadonlyMap<number, readonly unknown[]>): readonly number[] {
  return [...groups.keys()].sort((left, right) => codeUnitCompare(String(left), String(right)));
}

function sortedRows<T extends Arc3LegacyCountRow | Arc3LegacyMinedRow>(rows: T[]): readonly T[] {
  rows.sort((left, right) => codeUnitCompare(String(left[0]), String(right[0])));
  return Object.freeze(rows.map((row) => Object.freeze(row)));
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function refreshesWorld(
  intent: Arc3LegacyMinedTimestampIntent,
  worldKey: string,
): boolean {
  return intent.kind === 'refresh-all'
    || (intent.kind === 'touched-world' && intent.worldKey === worldKey);
}

/** Derive the bounded v4 compatibility fields from canonical Arc 3 state.
 * Numeric counts are never saturated. An unrepresentable same-leaf group is
 * handled as a unit by the collision-held policy, even when only one of its
 * two old world carriers existed. */
export function projectArc3EngineeringLegacyCompatibility(
  input: Arc3LegacyEngineeringProjectionInput,
): Arc3LegacyEngineeringProjection {
  if (!isEngineeringState(input.state)) {
    throw new TypeError('Arc 3 legacy projection requires registered EngineeringState authority');
  }
  const codecNow = checkedTimestamp(input.codecNow, 'Arc 3 codecNow');
  const prior = checkedPrior(input.prior);
  const intent = checkedIntent(input.minedTimestampIntent, input.state);
  const worldGroups = groupedByLeaf(
    input.state.worlds,
    (row) => row.address.planet.seed,
    (row) => row.key,
    (row) => row.extractionsTaken,
    'Arc 3 world',
  );
  const starGroups = groupedByLeaf(
    input.state.stars,
    (row) => row.address.star.seed,
    (row) => row.key,
    (row) => row.extractionsTaken,
    'Arc 3 star',
  );

  const mineX: Arc3LegacyCountRow[] = [];
  const mined: Arc3LegacyMinedRow[] = [];
  const skimX: Arc3LegacyCountRow[] = [];
  const diagnostics: Arc3LegacyProjectionDiagnostic[] = [];

  for (const seed of sortedSeeds(worldGroups)) {
    const rows = worldGroups.get(seed)!;
    const canonicalKeys = rows.map(({ key }) => key);
    if (rows.length > 1) {
      const priorMineX = prior.mineX.get(seed);
      const priorMined = prior.mined.get(seed);
      if (priorMineX !== undefined) mineX.push([seed, priorMineX]);
      if (priorMined !== undefined) mined.push([seed, priorMined]);
      diagnostics.push({
        source: 'world',
        leafSeed: seed,
        disposition: 'collision-held',
        canonicalKeys: Object.freeze(canonicalKeys),
        carriers: Object.freeze({
          mineX: priorMineX === undefined ? 'absent' : 'held',
          mined: priorMined === undefined ? 'absent' : 'held',
        }),
      });
      continue;
    }
    const row = rows[0]!;
    mineX.push([seed, row.extractionsTaken]);
    const priorMined = prior.mined.get(seed);
    const refreshed = refreshesWorld(intent, row.key);
    if (refreshed) mined.push([seed, codecNow]);
    else if (priorMined !== undefined) mined.push([seed, priorMined]);
    diagnostics.push({
      source: 'world',
      leafSeed: seed,
      disposition: 'exact',
      canonicalKeys: Object.freeze([row.key]),
      carriers: Object.freeze({
        mineX: 'exact',
        mined: refreshed || priorMined !== undefined ? 'present' : 'absent',
      }),
    });
  }

  for (const seed of sortedSeeds(starGroups)) {
    const rows = starGroups.get(seed)!;
    const canonicalKeys = rows.map(({ key }) => key);
    if (rows.length > 1) {
      const priorSkimX = prior.skimX.get(seed);
      if (priorSkimX !== undefined) skimX.push([seed, priorSkimX]);
      diagnostics.push({
        source: 'star',
        leafSeed: seed,
        disposition: 'collision-held',
        canonicalKeys: Object.freeze(canonicalKeys),
        carriers: Object.freeze({ skimX: priorSkimX === undefined ? 'absent' : 'held' }),
      });
      continue;
    }
    const row = rows[0]!;
    skimX.push([seed, row.extractionsTaken]);
    diagnostics.push({
      source: 'star',
      leafSeed: seed,
      disposition: 'exact',
      canonicalKeys: Object.freeze([row.key]),
      carriers: Object.freeze({ skimX: 'exact' }),
    });
  }

  diagnostics.sort((left, right) => codeUnitCompare(
    `${left.source}:${String(left.leafSeed)}`,
    `${right.source}:${String(right.leafSeed)}`,
  ));
  return deepFreeze({
    schema: ARC3_LEGACY_PROJECTION_SCHEMA,
    legacy: {
      mineX: sortedRows(mineX),
      mined: sortedRows(mined),
      skimX: sortedRows(skimX),
      techOwned: [...input.state.research],
    },
    diagnostics,
  });
}
