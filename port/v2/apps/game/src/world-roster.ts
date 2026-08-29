/* MAIN-2/3 — one canonical world roster, one bounded presentation window.

   The eight-row Planetside strip is a UI budget, never a data authority.
   Capture, biosphere yield, distant ecology, and future ownership actions must
   target `all`; only the current thumbnail strip consumes `preview`. */
import {
  biosphere,
  checkedEcologyEpoch,
  planetSpeciesAtEcologyEpoch,
} from '@cf/domain-ecology';
import {
  BIOME_PROFILE_AUTHORITY_V1,
  BIOME_PROFILE_KEYS_V1,
  type BiomeProfileDigestV1,
  type BiomeProfileKeyV1,
  type BiomeProfileV1,
} from '@cf/domain-biome-profile';
import { _earthNamePass } from '@cf/domain-descriptors';
import { makeGenome } from '@cf/domain-genome';
import { evolveGenome } from '@cf/domain-genetics';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { climateBand } from '@cf/domain-surveyphrases';
import { biomeFor } from '@cf/domain-strays';
import { systemFor } from '@cf/domain-worldgen';
import {
  getProvenPlanetKey,
  isCanonicalCF1Address,
  systemScene,
  type CanonicalCF1WorldAddress,
  type CF1WorldKey,
} from '@cf/scene';

export const PLANETSIDE_PREVIEW_LIMIT = 8;
export const CANONICAL_CLIMATE_BANDS = Object.freeze([
  'hot',
  'temperate',
  'cold',
  'frozen',
] as const);
export type CanonicalClimateBand = (typeof CANONICAL_CLIMATE_BANDS)[number];
export const CANONICAL_BIOSPHERE_KEYS = Object.freeze([
  'earth',
  'none',
  'complex',
  'flora',
  'aquatic',
  'sparse',
  'microbial',
  'subsurface',
  'aerial',
  'xfauna',
] as const);
export type CanonicalBiosphereKey = (typeof CANONICAL_BIOSPHERE_KEYS)[number];

const CANONICAL_BIOSPHERE_KEY_SET: ReadonlySet<string> = new Set(CANONICAL_BIOSPHERE_KEYS);

export interface WorldRosterView<T> {
  readonly all: readonly T[];
  readonly preview: readonly T[];
  readonly total: number;
  readonly hiddenFromPreview: number;
}

interface WorldRosterSnapshot {
  readonly address: CanonicalCF1WorldAddress;
  readonly worldKey: CF1WorldKey;
  readonly starSeed: number;
  readonly planetSeed: number;
  readonly planetOrdinal: number;
  readonly biosphereKey: CanonicalBiosphereKey;
  readonly ecologyEpoch: number;
  /** One current-world presentation identity shared by biome art and audio.
   * It is not a roster filter and never changes acquisition candidates. */
  readonly climateBand: CanonicalClimateBand;
  readonly biomeProfileSchema: typeof BIOME_PROFILE_AUTHORITY_V1.schema;
  readonly biomeProfileDigest: BiomeProfileDigestV1;
  readonly biomeProfileKey: BiomeProfileKeyV1;
  readonly biomeProfile: BiomeProfileV1;
  readonly environmentFingerprint: string;
  /** Binds world, epoch, order, and every detached full-row field. */
  readonly fullRosterFingerprint: string;
  readonly view: WorldRosterView<Readonly<Record<string, unknown>>>;
}

declare const CANONICAL_WORLD_ROSTER_BRAND: unique symbol;

/** Production-only authority. Runtime provenance is private WeakSet
 * membership; the type-only brand prevents a diagnostic snapshot from being
 * passed to a future acquisition planner by structural accident. */
export interface CanonicalWorldRoster extends WorldRosterSnapshot {
  readonly [CANONICAL_WORLD_ROSTER_BRAND]: true;
}

/** Source-injection evidence only. It deliberately is not acquisition
 * authority and can never satisfy `isCanonicalWorldRoster`. */
export interface DiagnosticWorldRoster extends WorldRosterSnapshot {
  readonly authority: 'diagnostic';
}

export type CanonicalWorldRosterFailureReason =
  | 'unproven-address'
  | 'address-mismatch'
  | 'invalid-epoch'
  | 'source-error';

export type CanonicalWorldRosterResult =
  | { readonly ok: true; readonly roster: CanonicalWorldRoster }
  | {
      readonly ok: false;
      readonly reason: CanonicalWorldRosterFailureReason;
      readonly message: string;
    };

export type DiagnosticWorldRosterResult =
  | { readonly ok: true; readonly roster: DiagnosticWorldRoster }
  | {
      readonly ok: false;
      readonly reason: CanonicalWorldRosterFailureReason;
      readonly message: string;
    };

type WorldRosterBuildResult =
  | { readonly ok: true; readonly roster: WorldRosterSnapshot }
  | {
      readonly ok: false;
      readonly reason: CanonicalWorldRosterFailureReason;
      readonly message: string;
    };

export interface WorldRosterSources {
  readonly systemFor: (starSeed: number) => Record<string, unknown>;
  readonly climateBand: (
    planet: Record<string, unknown>,
    system: Record<string, unknown>,
    orbit: number,
  ) => string;
  readonly biosphere: (
    planet: { seed: number; type?: string },
    system: { sol?: boolean } | null | undefined,
    band: string,
    random: () => number,
  ) => { key: string };
  readonly planetSpecies: (
    planet: { seed: number },
    system: unknown,
    band: string,
    level: string | number,
    ecologyEpoch: number,
  ) => Array<Record<string, unknown>>;
  readonly nameEarth: (rows: Array<Record<string, unknown>>) => void;
  /** Diagnostic-only classifier seam. Production installs the canonical
   * lifted biome selector; the returned profile remains presentation-only. */
  readonly biomeFor?: (
    planet: { seed: number; type?: string },
    band: string,
  ) => { readonly k?: unknown } | null | undefined;
}

const SOURCES: WorldRosterSources = Object.freeze({
  systemFor: systemFor as unknown as WorldRosterSources['systemFor'],
  climateBand: climateBand as unknown as WorldRosterSources['climateBand'],
  biosphere: biosphere as unknown as WorldRosterSources['biosphere'],
  planetSpecies: planetSpeciesAtEcologyEpoch as unknown as WorldRosterSources['planetSpecies'],
  nameEarth: _earthNamePass,
  biomeFor: biomeFor as unknown as NonNullable<WorldRosterSources['biomeFor']>,
});

const CANONICAL_PLANET_TYPES = Object.freeze([
  'terran', 'ocean', 'ice', 'desert', 'rocky', 'venus', 'lava', 'gas',
] as const);
type CanonicalPlanetType = typeof CANONICAL_PLANET_TYPES[number];
const DEFAULT_BIOME_PROFILE_KEY: Readonly<Record<CanonicalPlanetType, BiomeProfileKeyV1>> =
  Object.freeze({
    terran: 'temperate', ocean: 'opensea', ice: 'glacier', desert: 'dunesea',
    rocky: 'cratered', venus: 'acidhaze', lava: 'emberfield', gas: 'banded',
  });

const CANONICAL_WORLD_ROSTERS = new WeakSet<object>();
const MAX_WORLD_ROSTER_ROWS = 64;
const MAX_WORLD_ROSTER_OBJECT_KEYS = 64;
const MAX_WORLD_ROSTER_ARRAY_LENGTH = 64;
const MAX_WORLD_ROSTER_DATA_DEPTH = 8;
const MAX_WORLD_ROSTER_DATA_ENTRIES = 4_096;
const MAX_WORLD_ROSTER_DATA_CODE_UNITS = 262_144;

interface RosterCloneBudget {
  entries: number;
  codeUnits: number;
}

function spendRosterBudget(
  budget: RosterCloneBudget,
  entries: number,
  codeUnits: number,
): void {
  budget.entries += entries;
  budget.codeUnits += codeUnits;
  if (budget.entries > MAX_WORLD_ROSTER_DATA_ENTRIES
    || budget.codeUnits > MAX_WORLD_ROSTER_DATA_CODE_UNITS) {
    throw new RangeError('world roster data exceeds its canonical size budget');
  }
}

function exactArrayDataValues(
  value: unknown,
  label: string,
  maximumLength: number,
): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be an exact plain data array`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== 'string')) {
    throw new TypeError(`${label} has a symbol key`);
  }
  const stringKeys = keys as string[];
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
  if (!lengthDescriptor || !Object.hasOwn(lengthDescriptor, 'value')
    || !Number.isSafeInteger(lengthDescriptor.value)
    || lengthDescriptor.value < 0 || lengthDescriptor.value > maximumLength) {
    throw new RangeError(`${label} exceeds its canonical length budget`);
  }
  const length = lengthDescriptor.value as number;
  if (stringKeys.length !== length + 1
    || stringKeys.some((key) => key !== 'length'
      && (!/^(?:0|[1-9]\d*)$/u.test(key) || Number(key) >= length))) {
    throw new TypeError(`${label} must be dense and contain no extra properties`);
  }
  const values: unknown[] = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
      throw new TypeError(`${label}[${index}] must be an enumerable data property`);
    }
    values.push(descriptor.value);
  }
  return values;
}

function cloneCanonicalRosterData(
  value: unknown,
  label: string,
  depth: number,
  ancestors: Set<object>,
  budget: RosterCloneBudget,
): unknown {
  if (depth > MAX_WORLD_ROSTER_DATA_DEPTH) {
    throw new RangeError('world roster data exceeds its canonical depth budget');
  }
  if (value === null || typeof value === 'boolean') {
    spendRosterBudget(budget, 1, 0);
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('world roster contains a non-finite number');
    spendRosterBudget(budget, 1, 0);
    return value;
  }
  if (typeof value === 'string') {
    spendRosterBudget(budget, 1, value.length);
    return value;
  }
  if (typeof value !== 'object') {
    throw new TypeError(`world roster contains unsupported ${typeof value} data`);
  }
  if (ancestors.has(value)) throw new TypeError('world roster contains a cyclic row');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const values = exactArrayDataValues(value, label, MAX_WORLD_ROSTER_ARRAY_LENGTH);
      spendRosterBudget(budget, 1, 0);
      return values.map((entry, index) => cloneCanonicalRosterData(
        entry,
        `${label}[${index}]`,
        depth + 1,
        ancestors,
        budget,
      ));
    }
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw new TypeError(`${label} must be an exact plain data object`);
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_WORLD_ROSTER_OBJECT_KEYS) {
      throw new RangeError(`${label} exceeds its canonical key budget`);
    }
    if (keys.some((key) => typeof key !== 'string')) {
      throw new TypeError(`${label} has a symbol key`);
    }
    spendRosterBudget(
      budget,
      1,
      (keys as string[]).reduce((total, key) => total + key.length, 0),
    );
    const clone: Record<string, unknown> = {};
    for (const key of keys as string[]) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
        throw new TypeError(`${label}.${key} must be an enumerable data property`);
      }
      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: cloneCanonicalRosterData(
          descriptor.value,
          `${label}.${key}`,
          depth + 1,
          ancestors,
          budget,
        ),
      });
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
}

function detachedRosterRows(value: unknown, label: string): Array<Record<string, unknown>> {
  const sourceRows = exactArrayDataValues(value, label, MAX_WORLD_ROSTER_ROWS);
  const budget: RosterCloneBudget = { entries: 0, codeUnits: 0 };
  return sourceRows.map((sourceRow, index) => {
    if (sourceRow === null || typeof sourceRow !== 'object' || Array.isArray(sourceRow)
      || Object.getPrototypeOf(sourceRow) !== Object.prototype) {
      throw new TypeError(`${label}[${index}] must be an exact plain data object`);
    }
    const clone = cloneCanonicalRosterData(
      sourceRow,
      `${label}[${index}]`,
      0,
      new Set<object>(),
      budget,
    ) as Record<string, unknown>;
    if (!Number.isInteger(clone.seed as number) || (clone.seed as number) < 0
      || (clone.seed as number) > 0xffff_ffff) {
      throw new TypeError(`${label}[${index}].seed must be an exact uint32`);
    }
    if (typeof clone.kingdom !== 'string'
      || !['fauna', 'flora', 'fungi', 'microbe'].includes(clone.kingdom)) {
      throw new TypeError(`${label}[${index}].kingdom is not canonical`);
    }
    return clone;
  });
}

function freezeCanonicalRosterData(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && Object.hasOwn(descriptor, 'value')) freezeCanonicalRosterData(descriptor.value);
  }
  Object.freeze(value);
}

export function isCanonicalWorldRoster(value: unknown): value is CanonicalWorldRoster {
  return value !== null && typeof value === 'object' && CANONICAL_WORLD_ROSTERS.has(value);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function rosterFailure(
  reason: CanonicalWorldRosterFailureReason,
  message: string,
): Readonly<{
  ok: false;
  reason: CanonicalWorldRosterFailureReason;
  message: string;
}> {
  return Object.freeze({ ok: false, reason, message });
}

function canonicalBiosphereKey(key: string, planetSeed: number): CanonicalBiosphereKey {
  if (!CANONICAL_BIOSPHERE_KEY_SET.has(key)) {
    throw new TypeError(`biosphere source returned unsupported key ${JSON.stringify(key)}`);
  }
  if (planetSeed === 133 && key !== 'earth') {
    throw new TypeError('planet seed 133 requires biosphere key "earth"');
  }
  if (planetSeed !== 133 && key === 'earth') {
    throw new TypeError('biosphere key "earth" is only valid for planet seed 133');
  }
  return key as CanonicalBiosphereKey;
}

function freezeDetachedRow(row: Record<string, unknown>): Readonly<Record<string, unknown>> {
  freezeCanonicalRosterData(row);
  return row;
}

function canonicalFingerprintValue(value: unknown, ancestors = new Set<object>()): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('world roster contains a non-finite number');
    return Object.is(value, -0) ? '-0' : String(value);
  }
  if (typeof value !== 'object') {
    throw new TypeError(`world roster contains unsupported ${typeof value} data`);
  }
  if (ancestors.has(value)) throw new TypeError('world roster contains a cyclic row');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((entry) => canonicalFingerprintValue(entry, ancestors)).join(',')}]`;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('world roster contains a non-canonical object');
    }
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalFingerprintValue(record[key], ancestors)}`).join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

function fnv1a32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function canonicalPlanetType(value: unknown): CanonicalPlanetType {
  if (typeof value !== 'string'
    || !CANONICAL_PLANET_TYPES.includes(value as CanonicalPlanetType)) {
    throw new TypeError('world roster source returned an unsupported planet type');
  }
  return value as CanonicalPlanetType;
}

function canonicalClimateBand(value: unknown): CanonicalClimateBand {
  if (typeof value !== 'string'
    || !CANONICAL_CLIMATE_BANDS.includes(value as CanonicalClimateBand)) {
    throw new TypeError('world roster source returned an unsupported climate band');
  }
  return value as CanonicalClimateBand;
}

function canonicalBiomePresentation(
  planet: { seed: number; type?: string },
  band: CanonicalClimateBand,
  classifier: NonNullable<WorldRosterSources['biomeFor']>,
): Readonly<{
  schema: typeof BIOME_PROFILE_AUTHORITY_V1.schema;
  digest: BiomeProfileDigestV1;
  key: BiomeProfileKeyV1;
  profile: BiomeProfileV1;
}> {
  const type = canonicalPlanetType(planet.type);
  const selected = classifier(planet, band);
  let candidate: unknown;
  if (selected !== null && selected !== undefined) {
    if (typeof selected !== 'object' || Array.isArray(selected)
      || Object.getPrototypeOf(selected) !== Object.prototype) {
      throw new TypeError('world roster source returned a malformed biome profile selection');
    }
    const descriptor = Object.getOwnPropertyDescriptor(selected, 'k');
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('world roster source returned a biome selection without a data key');
    }
    candidate = descriptor.value;
  }
  if (candidate !== undefined && candidate !== null
    && (typeof candidate !== 'string'
      || !BIOME_PROFILE_KEYS_V1.includes(candidate as BiomeProfileKeyV1))) {
    throw new TypeError('world roster source returned an unsupported biome profile key');
  }
  const key = typeof candidate === 'string'
    ? candidate as BiomeProfileKeyV1
    : DEFAULT_BIOME_PROFILE_KEY[type];
  return Object.freeze({
    schema: BIOME_PROFILE_AUTHORITY_V1.schema,
    digest: BIOME_PROFILE_AUTHORITY_V1.digest,
    key,
    profile: BIOME_PROFILE_AUTHORITY_V1.profiles[key],
  });
}

function environmentFingerprint(
  worldKey: CF1WorldKey,
  ecologyEpoch: number,
  biosphereKey: CanonicalBiosphereKey,
  band: CanonicalClimateBand,
  biome: Readonly<{
    schema: typeof BIOME_PROFILE_AUTHORITY_V1.schema;
    digest: BiomeProfileDigestV1;
    key: BiomeProfileKeyV1;
  }>,
): string {
  const canonical = JSON.stringify([
    worldKey, ecologyEpoch, biosphereKey, band,
    biome.schema, biome.digest, biome.key,
  ]);
  return `cwe1:${canonical.length}:${fnv1a32(canonical).toString(16).padStart(8, '0')}`;
}

function fullRosterFingerprint(
  worldKey: CF1WorldKey,
  ecologyEpoch: number,
  rows: readonly Readonly<Record<string, unknown>>[],
): string {
  const canonical = canonicalFingerprintValue([worldKey, ecologyEpoch, rows]);
  return `cwr1:${rows.length}:${canonical.length}:${fnv1a32(canonical).toString(16).padStart(8, '0')}`;
}

function earthVagrants(ecologyEpoch: number): Array<Record<string, unknown>> {
  if (ecologyEpoch === 0) return [];
  const random = mulberry32(hashInt(133, ecologyEpoch, 0x7A9E) >>> 0);
  const count = 1 + (random() < 0.5 ? 1 : 0);
  const rows: Array<Record<string, unknown>> = [];
  for (let index = 0; index < count; index++) {
    const kingdom = random() < 0.7 ? 'fauna' : 'flora';
    const seed = hashInt(133, ecologyEpoch * 163 + index + 1, 0xEA271) >>> 0;
    const genome = evolveGenome(makeGenome(seed, kingdom, 1), 0);
    genome._cradle = 1;
    genome._rare = 1;
    rows.push(genome);
  }
  return rows;
}

function buildRoster(
  candidate: unknown,
  ecologyEpochValue: unknown,
  sources: WorldRosterSources,
): WorldRosterBuildResult {
  if (!isCanonicalCF1Address(candidate) || !('planet' in candidate)
    || candidate.key !== getProvenPlanetKey(candidate.planet)) {
    return rosterFailure('unproven-address', 'world roster requires a proven canonical CF1 world address');
  }
  const address: CanonicalCF1WorldAddress = candidate;
  let ecologyEpoch: number;
  try {
    ecologyEpoch = checkedEcologyEpoch(ecologyEpochValue);
  } catch (error) {
    return rosterFailure('invalid-epoch', messageOf(error));
  }
  try {
    const system = sources.systemFor(address.star.seed);
    if (!system || typeof system !== 'object' || Array.isArray(system)
      || !Array.isArray(system.planets)) {
      throw new TypeError('system source returned a malformed system');
    }
    const scene = systemScene(address.star.seed, () => system);
    const planet = scene.planets.find((node) => node.ordinal === address.planet.ordinal);
    if (!planet || planet.seed !== address.planet.seed) {
      return rosterFailure(
        'address-mismatch',
        `canonical world ${address.key} does not match its source planet ordinal`,
      );
    }
    const random = mulberry32((planet.seed ^ 0x1234567) >>> 0);
    const band = canonicalClimateBand(sources.climateBand(planet.P, system, planet.orb));
    const bio = sources.biosphere(
      planet.P as { seed: number; type?: string },
      system as { sol?: boolean },
      band,
      random,
    );
    if (!bio || typeof bio.key !== 'string' || !bio.key) {
      throw new TypeError('biosphere source returned a malformed key');
    }
    const biosphereKey = canonicalBiosphereKey(bio.key, planet.seed);
    const biome = canonicalBiomePresentation(
      planet.P as { seed: number; type?: string },
      band,
      sources.biomeFor ?? (biomeFor as unknown as NonNullable<WorldRosterSources['biomeFor']>),
    );
    let rows: Array<Record<string, unknown>> = [];
    if (biosphereKey !== 'none') {
      const speciesLevel = biosphereKey === 'earth' ? 'complex' : biosphereKey;
      const produced = sources.planetSpecies(
        planet.P as { seed: number },
        system,
        band,
        speciesLevel,
        ecologyEpoch,
      );
      rows = detachedRosterRows(produced, `species source roster for biosphere key "${biosphereKey}"`);
      if (rows.length === 0) {
        throw new TypeError(`biosphere key "${biosphereKey}" returned an empty inhabited roster`);
      }
      if (biosphereKey === 'earth') {
        sources.nameEarth(rows);
        rows = detachedRosterRows(rows, 'named Earth starter roster');
        let vagrants = earthVagrants(ecologyEpoch);
        sources.nameEarth(vagrants);
        vagrants = detachedRosterRows(vagrants, 'named Earth vagrant roster');
        rows.push(...vagrants);
        if (rows.length > MAX_WORLD_ROSTER_ROWS) {
          throw new RangeError('Earth roster exceeds its canonical row budget');
        }
        for (const row of rows) row._cradle = 1;
      }
    }
    const frozenRows = rows.map(freezeDetachedRow);
    return Object.freeze({
      ok: true,
      roster: Object.freeze({
        address,
        worldKey: address.key,
        starSeed: address.star.seed,
        planetSeed: planet.seed,
        planetOrdinal: planet.ordinal,
        biosphereKey,
        ecologyEpoch,
        climateBand: band,
        biomeProfileSchema: biome.schema,
        biomeProfileDigest: biome.digest,
        biomeProfileKey: biome.key,
        biomeProfile: biome.profile,
        environmentFingerprint: environmentFingerprint(
          address.key,
          ecologyEpoch,
          biosphereKey,
          band,
          biome,
        ),
        fullRosterFingerprint: fullRosterFingerprint(address.key, ecologyEpoch, frozenRows),
        view: worldRosterView(frozenRows),
      }),
    });
  } catch (error) {
    return rosterFailure('source-error', messageOf(error));
  }
}

export function canonicalWorldRoster(
  address: CanonicalCF1WorldAddress,
  ecologyEpoch: number,
): CanonicalWorldRosterResult {
  const built = buildRoster(address, ecologyEpoch, SOURCES);
  if (!built.ok) return built;
  const roster = built.roster as CanonicalWorldRoster;
  CANONICAL_WORLD_ROSTERS.add(roster);
  return Object.freeze({ ok: true, roster });
}

/** Diagnostic seam used only to prove source failure and roster ownership. */
export function canonicalWorldRosterForDiagnostics(
  address: unknown,
  ecologyEpoch: unknown,
  sources: WorldRosterSources,
): DiagnosticWorldRosterResult {
  const built = buildRoster(address, ecologyEpoch, sources);
  if (!built.ok) return built;
  const roster: DiagnosticWorldRoster = Object.freeze({
    ...built.roster,
    authority: 'diagnostic',
  });
  return Object.freeze({ ok: true, roster });
}

export function worldRosterView<T>(rows: readonly T[]): WorldRosterView<T> {
  if (!Array.isArray(rows)) throw new TypeError('world roster must be an array');
  const all = Object.freeze([...rows]);
  const preview = Object.freeze(all.slice(0, PLANETSIDE_PREVIEW_LIMIT));
  return Object.freeze({
    all,
    preview,
    total: all.length,
    hiddenFromPreview: Math.max(0, all.length - preview.length),
  });
}
