/* Canonical engineering state and strict persistence codec.

   Current state is keyed by registered CF1 addresses. Bare seeds occur only
   in the explicitly named v1 migration mirror below, and migration cannot
   choose between zero or multiple canonical matches.
 */
import {
  initializeRecurringAccrual,
  RECURRING_ACCRUAL_CURSOR_SCHEMA,
  type RecurringAccrualCursor,
} from '@cf/domain-progression';
import {
  isCanonicalCF1Address,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
  type CF1StarKey,
  type CF1WorldKey,
} from '@cf/scene';

export const ENGINEERING_STATE_SCHEMA = 'cf-v2-engineering-state/v2' as const;
export const LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA = 'cf-v2-engineering-state/v1' as const;
export const MAX_ENGINEERING_SOURCES = 60_000;
export const MAX_LEGACY_EXTRACTIONS_PER_SOURCE = 10_000_000;
export const MAX_ENGINEERING_STATE_JSON_BYTES = 8 * 1024 * 1024;
/** The terminal accepted value is intentionally read-only: a future planner
    must refuse before incrementing it. This makes exhaustion explicit. */
export const MAX_ENGINEERING_REVISION = Number.MAX_SAFE_INTEGER;

const UINT32_MAX = 0xffff_ffff;

export const RESEARCH_IDS = Object.freeze([
  'scan1',
  'hull1',
  'lab1',
  'drive1',
  'drive2',
  'drive3',
] as const);
export type ResearchId = typeof RESEARCH_IDS[number];

export interface EngineeringWorldProgress {
  readonly key: CF1WorldKey;
  readonly address: CanonicalCF1WorldAddress;
  readonly extractionsTaken: number;
  /** Null means this source has never established an Auto-Extractor cursor. */
  readonly autoExtractorCursor: RecurringAccrualCursor | null;
}

export interface EngineeringStarProgress {
  readonly key: CF1StarKey;
  readonly address: CanonicalCF1StarAddress;
  readonly extractionsTaken: number;
}

export interface EngineeringStateV2 {
  readonly schema: typeof ENGINEERING_STATE_SCHEMA;
  readonly revision: number;
  /** Strictly ascending canonical CF1 world-key order. */
  readonly worlds: readonly EngineeringWorldProgress[];
  /** Strictly ascending canonical CF1 star-key order. */
  readonly stars: readonly EngineeringStarProgress[];
  /** Sparse veteran subsets are valid; order is canonical catalogue order. */
  readonly research: readonly ResearchId[];
}

export type EngineeringState = EngineeringStateV2;

interface CanonicalCellMirror {
  readonly x: number;
  readonly y: number;
}

interface CanonicalGalaxyMirror {
  readonly seed: number;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly sp: number;
  readonly tilt: number;
  readonly rot: number;
  readonly home: boolean;
  readonly quasar: boolean;
  readonly dwarf: boolean;
  readonly parentCell: CanonicalCellMirror;
}

interface CanonicalStarMirror {
  readonly seed: number;
  readonly x: number;
  readonly y: number;
  readonly layer: 'coarse' | 'fine';
  readonly parentCell: CanonicalCellMirror;
}

interface CanonicalPlanetMirror {
  readonly seed: number;
  readonly ordinal: number;
}

export interface CanonicalCF1WorldAddressMirror {
  readonly format: 'CF1';
  readonly key: string;
  readonly galaxy: CanonicalGalaxyMirror;
  readonly star: CanonicalStarMirror;
  readonly planet: CanonicalPlanetMirror;
}

export interface CanonicalCF1StarAddressMirror {
  readonly format: 'CF1';
  readonly key: string;
  readonly galaxy: CanonicalGalaxyMirror;
  readonly star: CanonicalStarMirror;
}

/** Persistence supplies the rebind boundary. A resolver must return a freshly
    proven scene address for the complete serialized candidate, or null. */
export interface EngineeringAddressResolver {
  resolveWorldAddress(candidate: CanonicalCF1WorldAddressMirror): CanonicalCF1WorldAddress | null;
  resolveStarAddress(candidate: CanonicalCF1StarAddressMirror): CanonicalCF1StarAddress | null;
}

interface EngineeringWorldProgressMirror {
  readonly key: string;
  readonly address: CanonicalCF1WorldAddressMirror;
  readonly extractionsTaken: number;
  readonly autoExtractorCursor: RecurringAccrualCursor | null;
}

interface EngineeringStarProgressMirror {
  readonly key: string;
  readonly address: CanonicalCF1StarAddressMirror;
  readonly extractionsTaken: number;
}

interface EngineeringStateMirrorV2 {
  readonly schema: typeof ENGINEERING_STATE_SCHEMA;
  readonly revision: number;
  readonly worlds: readonly EngineeringWorldProgressMirror[];
  readonly stars: readonly EngineeringStarProgressMirror[];
  readonly research: readonly ResearchId[];
}

/** The only current package API whose persisted identity is a bare seed. */
export interface LegacyEngineeringSourceSeedMirrorV1 {
  readonly seed: number;
  readonly extractionsTaken: number;
}

/** Exact old package state shape, isolated behind an explicitly legacy name. */
export interface LegacyEngineeringStateSeedMirrorV1 {
  readonly schema: typeof LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA;
  readonly revision: number;
  readonly worlds: readonly LegacyEngineeringSourceSeedMirrorV1[];
  readonly stars: readonly LegacyEngineeringSourceSeedMirrorV1[];
  readonly research: readonly unknown[];
}

/** A resolver must return every match, not pick one. Migration adjudicates the
    missing/ambiguous cases and verifies scene provenance and leaf identity. */
export interface LegacyEngineeringSeedResolver {
  resolveWorldSeed(seed: number): readonly CanonicalCF1WorldAddress[];
  resolveStarSeed(seed: number): readonly CanonicalCF1StarAddress[];
}

export interface LegacyEngineeringAddressInventory {
  readonly worlds: readonly CanonicalCF1WorldAddress[];
  readonly stars: readonly CanonicalCF1StarAddress[];
}

const ENGINEERING_STATES = new WeakSet<object>();

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value);
  if (actual.length !== expected.length || actual.some((key) => !expected.includes(key))) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function checkedUint32(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > UINT32_MAX) {
    throw new RangeError(`${label} must be an exact uint32`);
  }
  return value as number;
}

function checkedRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_ENGINEERING_REVISION) {
    throw new RangeError('engineering revision must be a non-negative safe integer');
  }
  return value as number;
}

export function isEngineeringRevisionExhausted(state: EngineeringStateV2): boolean {
  if (!isEngineeringState(state)) throw new TypeError('engineering state must be registered by this package');
  return state.revision === MAX_ENGINEERING_REVISION;
}

/** Deterministic UTF-8 length without Buffer/TextEncoder/global runtime state. */
function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xD800 && code <= 0xDBFF
      && index + 1 < value.length
      && value.charCodeAt(index + 1) >= 0xDC00
      && value.charCodeAt(index + 1) <= 0xDFFF) {
      bytes += 4;
      index += 1;
    } else bytes += 3;
  }
  return bytes;
}

function checkedExtractions(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value)
    || (value as number) < 0
    || (value as number) > MAX_LEGACY_EXTRACTIONS_PER_SOURCE) {
    throw new RangeError(`${label} must be a bounded non-negative extraction count`);
  }
  return value as number;
}

function isRegisteredWorldAddress(value: unknown): value is CanonicalCF1WorldAddress {
  return isCanonicalCF1Address(value) && 'planet' in value;
}

function isRegisteredStarAddress(value: unknown): value is CanonicalCF1StarAddress {
  return isCanonicalCF1Address(value) && 'star' in value && !('planet' in value);
}

function checkedCursor(value: unknown): RecurringAccrualCursor | null {
  if (value === null) return null;
  if (!isPlainRecord(value)) throw new TypeError('Auto-Extractor cursor must be an object or null');
  exactKeys(value, ['schema', 'collectedThroughActivePlayMs'], 'Auto-Extractor cursor');
  if (value.schema !== RECURRING_ACCRUAL_CURSOR_SCHEMA) {
    throw new TypeError('Auto-Extractor cursor schema is unsupported');
  }
  return initializeRecurringAccrual(value.collectedThroughActivePlayMs as number);
}

function checkedResearchSubset(value: unknown): readonly ResearchId[] {
  if (!Array.isArray(value) || value.length > RESEARCH_IDS.length) {
    throw new RangeError('engineering research exceeds the recognized catalogue');
  }
  const result: ResearchId[] = [];
  let previous = -1;
  for (const item of value) {
    if (typeof item !== 'string' || !RESEARCH_IDS.includes(item as ResearchId)) {
      throw new TypeError('engineering research contains an unrecognized id');
    }
    const index = RESEARCH_IDS.indexOf(item as ResearchId);
    if (index <= previous) {
      throw new RangeError('engineering research must be unique and in canonical catalogue order');
    }
    previous = index;
    result.push(item as ResearchId);
  }
  /* Deliberately no prerequisite closure: a veteran `drive2` subset is data,
     while future purchase planning will enforce prerequisites on new actions. */
  return Object.freeze(result);
}

function checkedWorldProgress(
  value: EngineeringWorldProgress,
  label: string,
): EngineeringWorldProgress {
  if (!isPlainRecord(value)) throw new TypeError(`${label} must be an object`);
  exactKeys(value, ['key', 'address', 'extractionsTaken', 'autoExtractorCursor'], label);
  if (!isRegisteredWorldAddress(value.address)) {
    throw new TypeError(`${label} address must be a registered canonical CF1 world address`);
  }
  if (value.key !== value.address.key) throw new RangeError(`${label} key does not match its address`);
  return Object.freeze({
    key: value.address.key,
    address: value.address,
    extractionsTaken: checkedExtractions(value.extractionsTaken, `${label} extractionsTaken`),
    autoExtractorCursor: checkedCursor(value.autoExtractorCursor),
  });
}

function checkedStarProgress(
  value: EngineeringStarProgress,
  label: string,
): EngineeringStarProgress {
  if (!isPlainRecord(value)) throw new TypeError(`${label} must be an object`);
  exactKeys(value, ['key', 'address', 'extractionsTaken'], label);
  if (!isRegisteredStarAddress(value.address)) {
    throw new TypeError(`${label} address must be a registered canonical CF1 star address`);
  }
  if (value.key !== value.address.key) throw new RangeError(`${label} key does not match its address`);
  return Object.freeze({
    key: value.address.key,
    address: value.address,
    extractionsTaken: checkedExtractions(value.extractionsTaken, `${label} extractionsTaken`),
  });
}

function checkedAscending<T extends { readonly key: string }>(
  rows: readonly T[],
  label: string,
): void {
  let previous: string | null = null;
  for (const row of rows) {
    if (previous !== null && row.key <= previous) {
      throw new RangeError(`${label} must have unique ascending canonical keys`);
    }
    previous = row.key;
  }
}

/** Locale collation is ambient host state and is not persistence authority. */
function compareCanonicalKeys(left: { readonly key: string }, right: { readonly key: string }): number {
  return left.key < right.key ? -1 : left.key > right.key ? 1 : 0;
}

function registerEngineeringState(
  revisionValue: unknown,
  worldValues: readonly EngineeringWorldProgress[],
  starValues: readonly EngineeringStarProgress[],
  researchValue: unknown,
): EngineeringStateV2 {
  if (worldValues.length + starValues.length > MAX_ENGINEERING_SOURCES) {
    throw new RangeError('engineering source count exceeds the compatibility bound');
  }
  const worlds = worldValues.map((row, index) => checkedWorldProgress(row, `engineering world ${index}`));
  const stars = starValues.map((row, index) => checkedStarProgress(row, `engineering star ${index}`));
  checkedAscending(worlds, 'engineering worlds');
  checkedAscending(stars, 'engineering stars');
  const state: EngineeringStateV2 = Object.freeze({
    schema: ENGINEERING_STATE_SCHEMA,
    revision: checkedRevision(revisionValue),
    worlds: Object.freeze(worlds),
    stars: Object.freeze(stars),
    research: checkedResearchSubset(researchValue),
  });
  const encoded = JSON.stringify(stateMirror(state));
  if (utf8ByteLength(encoded) > MAX_ENGINEERING_STATE_JSON_BYTES) {
    throw new RangeError('engineering state exceeds the canonical JSON byte bound');
  }
  ENGINEERING_STATES.add(state);
  return state;
}

export function createEngineeringState(): EngineeringStateV2 {
  return registerEngineeringState(0, [], [], []);
}

export function isEngineeringState(value: unknown): value is EngineeringStateV2 {
  return typeof value === 'object'
    && value !== null
    && ENGINEERING_STATES.has(value)
    && (value as EngineeringStateV2).schema === ENGINEERING_STATE_SCHEMA;
}

function galaxyMirror(address: CanonicalCF1WorldAddress | CanonicalCF1StarAddress): CanonicalGalaxyMirror {
  return {
    seed: address.galaxy.seed,
    x: address.galaxy.x,
    y: address.galaxy.y,
    size: address.galaxy.size,
    sp: address.galaxy.sp,
    tilt: address.galaxy.tilt,
    rot: address.galaxy.rot,
    home: address.galaxy.home,
    quasar: address.galaxy.quasar,
    dwarf: address.galaxy.dwarf,
    parentCell: { x: address.galaxy.parentCell.x, y: address.galaxy.parentCell.y },
  };
}

function starMirror(address: CanonicalCF1WorldAddress | CanonicalCF1StarAddress): CanonicalStarMirror {
  return {
    seed: address.star.seed,
    x: address.star.x,
    y: address.star.y,
    layer: address.star.layer,
    parentCell: { x: address.star.parentCell.x, y: address.star.parentCell.y },
  };
}

function worldAddressMirror(address: CanonicalCF1WorldAddress): CanonicalCF1WorldAddressMirror {
  return {
    format: 'CF1',
    key: address.key,
    galaxy: galaxyMirror(address),
    star: starMirror(address),
    planet: { seed: address.planet.seed, ordinal: address.planet.ordinal },
  };
}

function starAddressMirror(address: CanonicalCF1StarAddress): CanonicalCF1StarAddressMirror {
  return {
    format: 'CF1',
    key: address.key,
    galaxy: galaxyMirror(address),
    star: starMirror(address),
  };
}

function stateMirror(state: EngineeringStateV2): EngineeringStateMirrorV2 {
  return {
    schema: ENGINEERING_STATE_SCHEMA,
    revision: state.revision,
    worlds: state.worlds.map((row) => ({
      key: row.key,
      address: worldAddressMirror(row.address),
      extractionsTaken: row.extractionsTaken,
      autoExtractorCursor: row.autoExtractorCursor === null
        ? null
        : {
            schema: RECURRING_ACCRUAL_CURSOR_SCHEMA,
            collectedThroughActivePlayMs: row.autoExtractorCursor.collectedThroughActivePlayMs,
          },
    })),
    stars: state.stars.map((row) => ({
      key: row.key,
      address: starAddressMirror(row.address),
      extractionsTaken: row.extractionsTaken,
    })),
    research: [...state.research],
  };
}

/** Only registered state can be encoded; spreading/cloning it drops authority. */
export function encodeEngineeringState(state: EngineeringStateV2): string {
  if (!isEngineeringState(state)) {
    throw new TypeError('engineering state must be registered by this package');
  }
  const encoded = JSON.stringify(stateMirror(state));
  if (utf8ByteLength(encoded) > MAX_ENGINEERING_STATE_JSON_BYTES) {
    throw new RangeError('engineering state exceeds the canonical JSON byte bound');
  }
  return encoded;
}

function checkedCellMirror(value: unknown, label: string): CanonicalCellMirror {
  if (!isPlainRecord(value)) throw new TypeError(`${label} must be an object`);
  exactKeys(value, ['x', 'y'], label);
  if (!Number.isSafeInteger(value.x) || !Number.isSafeInteger(value.y)) {
    throw new RangeError(`${label} coordinates must be safe integers`);
  }
  return { x: value.x as number, y: value.y as number };
}

function checkedGalaxyMirror(value: unknown, label: string): CanonicalGalaxyMirror {
  if (!isPlainRecord(value)) throw new TypeError(`${label} must be an object`);
  exactKeys(value, [
    'seed', 'x', 'y', 'size', 'sp', 'tilt', 'rot', 'home', 'quasar', 'dwarf', 'parentCell',
  ], label);
  checkedUint32(value.seed, `${label} seed`);
  if (typeof value.x !== 'number' || !Number.isFinite(value.x)
    || typeof value.y !== 'number' || !Number.isFinite(value.y)) {
    throw new RangeError(`${label} coordinates must be finite numbers`);
  }
  if (typeof value.size !== 'number' || !Number.isFinite(value.size)
    || !Number.isSafeInteger(value.sp)
    || typeof value.tilt !== 'number' || !Number.isFinite(value.tilt)
    || typeof value.rot !== 'number' || !Number.isFinite(value.rot)
    || typeof value.home !== 'boolean'
    || typeof value.quasar !== 'boolean'
    || typeof value.dwarf !== 'boolean') {
    throw new TypeError(`${label} canonical provenance fields are invalid`);
  }
  return {
    seed: value.seed as number,
    x: value.x,
    y: value.y,
    size: value.size,
    sp: value.sp as number,
    tilt: value.tilt,
    rot: value.rot,
    home: value.home,
    quasar: value.quasar,
    dwarf: value.dwarf,
    parentCell: checkedCellMirror(value.parentCell, `${label} parentCell`),
  };
}

function checkedStarMirror(value: unknown, label: string): CanonicalStarMirror {
  if (!isPlainRecord(value)) throw new TypeError(`${label} must be an object`);
  exactKeys(value, ['seed', 'x', 'y', 'layer', 'parentCell'], label);
  checkedUint32(value.seed, `${label} seed`);
  if (typeof value.x !== 'number' || !Number.isFinite(value.x)
    || typeof value.y !== 'number' || !Number.isFinite(value.y)
    || (value.layer !== 'coarse' && value.layer !== 'fine')) {
    throw new RangeError(`${label} canonical provenance fields are invalid`);
  }
  return {
    seed: value.seed as number,
    x: value.x,
    y: value.y,
    layer: value.layer,
    parentCell: checkedCellMirror(value.parentCell, `${label} parentCell`),
  };
}

function decodeWorldAddressMirror(
  value: unknown,
  resolver: EngineeringAddressResolver,
): CanonicalCF1WorldAddress {
  if (!isPlainRecord(value)) throw new TypeError('world address mirror must be an object');
  exactKeys(value, ['format', 'key', 'galaxy', 'star', 'planet'], 'world address mirror');
  if (value.format !== 'CF1' || typeof value.key !== 'string') {
    throw new TypeError('world address mirror format or key is invalid');
  }
  const galaxy = checkedGalaxyMirror(value.galaxy, 'world galaxy mirror');
  const star = checkedStarMirror(value.star, 'world star mirror');
  if (!isPlainRecord(value.planet)) throw new TypeError('world planet mirror must be an object');
  exactKeys(value.planet, ['seed', 'ordinal'], 'world planet mirror');
  const planetSeed = checkedUint32(value.planet.seed, 'world planet seed');
  if (!Number.isSafeInteger(value.planet.ordinal) || (value.planet.ordinal as number) < 0) {
    throw new RangeError('world planet ordinal must be a non-negative safe integer');
  }
  const candidate: CanonicalCF1WorldAddressMirror = {
    format: 'CF1',
    key: value.key,
    galaxy,
    star,
    planet: { seed: planetSeed, ordinal: value.planet.ordinal as number },
  };
  const address = resolver.resolveWorldAddress(candidate);
  if (!isRegisteredWorldAddress(address)) {
    throw new RangeError('world address mirror cannot be rebound to registered provenance');
  }
  if (address.key !== value.key) {
    throw new RangeError('world address mirror key does not match resolved provenance');
  }
  if (address.galaxy.seed !== galaxy.seed || address.galaxy.x !== galaxy.x || address.galaxy.y !== galaxy.y
    || address.galaxy.size !== galaxy.size || address.galaxy.sp !== galaxy.sp
    || address.galaxy.tilt !== galaxy.tilt || address.galaxy.rot !== galaxy.rot
    || address.galaxy.home !== galaxy.home || address.galaxy.quasar !== galaxy.quasar
    || address.galaxy.dwarf !== galaxy.dwarf
    || address.galaxy.parentCell.x !== galaxy.parentCell.x
    || address.galaxy.parentCell.y !== galaxy.parentCell.y
    || address.star.seed !== star.seed || address.star.x !== star.x || address.star.y !== star.y
    || address.star.layer !== star.layer
    || address.star.parentCell.x !== star.parentCell.x
    || address.star.parentCell.y !== star.parentCell.y
    || address.planet.seed !== planetSeed
    || address.planet.ordinal !== value.planet.ordinal) {
    throw new RangeError('world address mirror does not match rebound provenance');
  }
  return address;
}

function decodeStarAddressMirror(
  value: unknown,
  resolver: EngineeringAddressResolver,
): CanonicalCF1StarAddress {
  if (!isPlainRecord(value)) throw new TypeError('star address mirror must be an object');
  exactKeys(value, ['format', 'key', 'galaxy', 'star'], 'star address mirror');
  if (value.format !== 'CF1' || typeof value.key !== 'string') {
    throw new TypeError('star address mirror format or key is invalid');
  }
  const galaxy = checkedGalaxyMirror(value.galaxy, 'star galaxy mirror');
  const star = checkedStarMirror(value.star, 'star mirror');
  const candidate: CanonicalCF1StarAddressMirror = {
    format: 'CF1',
    key: value.key,
    galaxy,
    star,
  };
  const address = resolver.resolveStarAddress(candidate);
  if (!isRegisteredStarAddress(address)) {
    throw new RangeError('star address mirror cannot be rebound to registered provenance');
  }
  if (address.key !== value.key) {
    throw new RangeError('star address mirror key does not match resolved provenance');
  }
  if (address.galaxy.seed !== galaxy.seed || address.galaxy.x !== galaxy.x || address.galaxy.y !== galaxy.y
    || address.galaxy.size !== galaxy.size || address.galaxy.sp !== galaxy.sp
    || address.galaxy.tilt !== galaxy.tilt || address.galaxy.rot !== galaxy.rot
    || address.galaxy.home !== galaxy.home || address.galaxy.quasar !== galaxy.quasar
    || address.galaxy.dwarf !== galaxy.dwarf
    || address.galaxy.parentCell.x !== galaxy.parentCell.x
    || address.galaxy.parentCell.y !== galaxy.parentCell.y
    || address.star.seed !== star.seed || address.star.x !== star.x || address.star.y !== star.y
    || address.star.layer !== star.layer
    || address.star.parentCell.x !== star.parentCell.x
    || address.star.parentCell.y !== star.parentCell.y) {
    throw new RangeError('star address mirror does not match rebound provenance');
  }
  return address;
}

function decodeWorldProgressMirror(
  value: unknown,
  index: number,
  resolver: EngineeringAddressResolver,
): EngineeringWorldProgress {
  const label = `engineering world mirror ${index}`;
  if (!isPlainRecord(value)) throw new TypeError(`${label} must be an object`);
  exactKeys(value, ['key', 'address', 'extractionsTaken', 'autoExtractorCursor'], label);
  if (typeof value.key !== 'string') throw new TypeError(`${label} key must be a string`);
  const address = decodeWorldAddressMirror(value.address, resolver);
  if (address.key !== value.key) throw new RangeError(`${label} key does not match its address`);
  return {
    key: address.key,
    address,
    extractionsTaken: checkedExtractions(value.extractionsTaken, `${label} extractionsTaken`),
    autoExtractorCursor: checkedCursor(value.autoExtractorCursor),
  };
}

function decodeStarProgressMirror(
  value: unknown,
  index: number,
  resolver: EngineeringAddressResolver,
): EngineeringStarProgress {
  const label = `engineering star mirror ${index}`;
  if (!isPlainRecord(value)) throw new TypeError(`${label} must be an object`);
  exactKeys(value, ['key', 'address', 'extractionsTaken'], label);
  if (typeof value.key !== 'string') throw new TypeError(`${label} key must be a string`);
  const address = decodeStarAddressMirror(value.address, resolver);
  if (address.key !== value.key) throw new RangeError(`${label} key does not match its address`);
  return {
    key: address.key,
    address,
    extractionsTaken: checkedExtractions(value.extractionsTaken, `${label} extractionsTaken`),
  };
}

function decodeStateMirror(value: unknown, resolver: EngineeringAddressResolver): EngineeringStateV2 {
  if (!isPlainRecord(value)) throw new TypeError('engineering state mirror must be an object');
  exactKeys(value, ['schema', 'revision', 'worlds', 'stars', 'research'], 'engineering state mirror');
  if (value.schema !== ENGINEERING_STATE_SCHEMA) throw new TypeError('engineering state schema is unsupported');
  if (!Array.isArray(value.worlds) || !Array.isArray(value.stars)) {
    throw new TypeError('engineering source mirrors must be arrays');
  }
  if (value.worlds.length + value.stars.length > MAX_ENGINEERING_SOURCES) {
    throw new RangeError('engineering source count exceeds the compatibility bound');
  }
  const worlds = value.worlds.map((row, index) => decodeWorldProgressMirror(row, index, resolver));
  const stars = value.stars.map((row, index) => decodeStarProgressMirror(row, index, resolver));
  return registerEngineeringState(value.revision, worlds, stars, value.research);
}

export function decodeEngineeringState(
  encoded: string,
  resolver: EngineeringAddressResolver,
): EngineeringStateV2 {
  if (typeof encoded !== 'string'
    || encoded.length < 1
    || utf8ByteLength(encoded) > MAX_ENGINEERING_STATE_JSON_BYTES) {
    throw new RangeError('engineering state JSON is empty or exceeds its compatibility bound');
  }
  let raw: unknown;
  try {
    raw = JSON.parse(encoded);
  } catch {
    throw new TypeError('engineering state JSON is malformed');
  }
  if (!resolver
    || typeof resolver.resolveWorldAddress !== 'function'
    || typeof resolver.resolveStarAddress !== 'function') {
    throw new TypeError('engineering state decode requires an address resolver');
  }
  const state = decodeStateMirror(raw, resolver);
  if (encodeEngineeringState(state) !== encoded) {
    throw new RangeError('engineering state JSON is not canonical');
  }
  return state;
}

/** Production scene-backed resolver. It replays the generator hierarchy and
    never trusts serialized key text or object identity. Callers may wrap this
    with an inventory/cache policy while retaining the same interface. */
export const SCENE_ENGINEERING_ADDRESS_RESOLVER: EngineeringAddressResolver = Object.freeze({
  resolveWorldAddress(candidate: CanonicalCF1WorldAddressMirror): CanonicalCF1WorldAddress | null {
    const resolved = resolveCF1WorldAddress(candidate);
    return resolved.ok ? resolved.address : null;
  },
  resolveStarAddress(candidate: CanonicalCF1StarAddressMirror): CanonicalCF1StarAddress | null {
    const resolved = resolveCF1StarAddress(candidate);
    return resolved.ok ? resolved.address : null;
  },
});

function checkedLegacyRows(value: unknown, label: string): readonly LegacyEngineeringSourceSeedMirrorV1[] {
  if (!Array.isArray(value) || value.length > MAX_ENGINEERING_SOURCES) {
    throw new RangeError(`${label} exceeds the compatibility bound`);
  }
  const rows: LegacyEngineeringSourceSeedMirrorV1[] = [];
  let previous = -1;
  for (let index = 0; index < value.length; index++) {
    const item = value[index];
    if (!isPlainRecord(item)) throw new TypeError(`${label} ${index} must be an object`);
    exactKeys(item, ['seed', 'extractionsTaken'], `${label} ${index}`);
    const seed = checkedUint32(item.seed, `${label} ${index} seed`);
    if (seed <= previous) throw new RangeError(`${label} must have unique ascending seeds`);
    previous = seed;
    rows.push(Object.freeze({
      seed,
      extractionsTaken: checkedExtractions(item.extractionsTaken, `${label} ${index} extractionsTaken`),
    }));
  }
  return Object.freeze(rows);
}

function checkedLegacyMirror(value: unknown): LegacyEngineeringStateSeedMirrorV1 {
  if (!isPlainRecord(value)) throw new TypeError('legacy engineering seed mirror must be an object');
  exactKeys(value, ['schema', 'revision', 'worlds', 'stars', 'research'], 'legacy engineering seed mirror');
  if (value.schema !== LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA) {
    throw new TypeError('legacy engineering seed mirror schema is unsupported');
  }
  if (!Array.isArray(value.research) || value.research.length > 1_000) {
    throw new RangeError('legacy engineering research exceeds the migration bound');
  }
  return Object.freeze({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: checkedRevision(value.revision),
    worlds: checkedLegacyRows(value.worlds, 'legacy engineering worlds'),
    stars: checkedLegacyRows(value.stars, 'legacy engineering stars'),
    research: Object.freeze([...value.research]),
  });
}

function recognizedLegacyResearch(value: readonly unknown[]): readonly ResearchId[] {
  const owned = new Set<ResearchId>();
  for (const candidate of value) {
    if (typeof candidate === 'string' && RESEARCH_IDS.includes(candidate as ResearchId)) {
      owned.add(candidate as ResearchId);
    }
  }
  return Object.freeze(RESEARCH_IDS.filter((id) => owned.has(id)));
}

function oneWorldMatch(
  resolver: LegacyEngineeringSeedResolver,
  seed: number,
): CanonicalCF1WorldAddress {
  const matches = resolver.resolveWorldSeed(seed);
  if (!Array.isArray(matches)) throw new TypeError('legacy world resolver must return an array');
  if (matches.length === 0) throw new RangeError(`legacy world seed ${seed} has no canonical address`);
  if (matches.length !== 1) throw new RangeError(`legacy world seed ${seed} is ambiguous`);
  const address = matches[0];
  if (!isRegisteredWorldAddress(address)) {
    throw new TypeError(`legacy world seed ${seed} resolved to an unregistered address`);
  }
  if (address.planet.seed !== seed) throw new RangeError(`legacy world seed ${seed} resolved to the wrong leaf`);
  return address;
}

function oneStarMatch(
  resolver: LegacyEngineeringSeedResolver,
  seed: number,
): CanonicalCF1StarAddress {
  const matches = resolver.resolveStarSeed(seed);
  if (!Array.isArray(matches)) throw new TypeError('legacy star resolver must return an array');
  if (matches.length === 0) throw new RangeError(`legacy star seed ${seed} has no canonical address`);
  if (matches.length !== 1) throw new RangeError(`legacy star seed ${seed} is ambiguous`);
  const address = matches[0];
  if (!isRegisteredStarAddress(address)) {
    throw new TypeError(`legacy star seed ${seed} resolved to an unregistered address`);
  }
  if (address.star.seed !== seed) throw new RangeError(`legacy star seed ${seed} resolved to the wrong leaf`);
  return address;
}

/** Upgrade a v1 seed mirror only when each seed has exactly one proven CF1
    address. Recognized research is normalized without manufacturing missing
    prerequisites, so sparse veteran ownership survives intact. */
export function migrateLegacyEngineeringState(
  legacyValue: unknown,
  resolver: LegacyEngineeringSeedResolver,
): EngineeringStateV2 {
  if (!resolver
    || typeof resolver.resolveWorldSeed !== 'function'
    || typeof resolver.resolveStarSeed !== 'function') {
    throw new TypeError('legacy engineering migration requires a seed resolver');
  }
  const legacy = checkedLegacyMirror(legacyValue);
  const worlds = legacy.worlds.map((row): EngineeringWorldProgress => {
    const address = oneWorldMatch(resolver, row.seed);
    return {
      key: address.key,
      address,
      extractionsTaken: row.extractionsTaken,
      autoExtractorCursor: null,
    };
  }).sort(compareCanonicalKeys);
  const stars = legacy.stars.map((row): EngineeringStarProgress => {
    const address = oneStarMatch(resolver, row.seed);
    return { key: address.key, address, extractionsTaken: row.extractionsTaken };
  }).sort(compareCanonicalKeys);
  return registerEngineeringState(
    legacy.revision,
    worlds,
    stars,
    recognizedLegacyResearch(legacy.research),
  );
}

/** Convenience resolver for a caller-owned canonical inventory. Duplicate
    matches are intentionally retained so migration refuses seed collisions. */
export function createLegacyEngineeringSeedResolver(
  inventory: LegacyEngineeringAddressInventory,
): LegacyEngineeringSeedResolver {
  if (!inventory || !Array.isArray(inventory.worlds) || !Array.isArray(inventory.stars)) {
    throw new TypeError('legacy engineering address inventory is malformed');
  }
  const worlds = Object.freeze(inventory.worlds.map((address) => {
    if (!isRegisteredWorldAddress(address)) {
      throw new TypeError('legacy world inventory contains an unregistered address');
    }
    return address;
  }));
  const stars = Object.freeze(inventory.stars.map((address) => {
    if (!isRegisteredStarAddress(address)) {
      throw new TypeError('legacy star inventory contains an unregistered address');
    }
    return address;
  }));
  return Object.freeze({
    resolveWorldSeed(seed: number): readonly CanonicalCF1WorldAddress[] {
      checkedUint32(seed, 'legacy world resolver seed');
      return Object.freeze(worlds.filter((address) => address.planet.seed === seed));
    },
    resolveStarSeed(seed: number): readonly CanonicalCF1StarAddress[] {
      checkedUint32(seed, 'legacy star resolver seed');
      return Object.freeze(stars.filter((address) => address.star.seed === seed));
    },
  });
}
