/* Arc 4 truthful ownership model.

   Knowledge, living fauna, consumable non-fauna, immutable acquisition audit,
   and canonical-world biosphere spend are separate records. Public-looking
   structural copies are data only: row and state factories capture canonical
   bytes in private WeakMaps, and only those registered values can become a
   successor or persistence write authority. CFB/CFB2 codes are deliberately
   absent; a reproducible genome is not proof that this expedition owns it. */
import {
  getCanonicalCF1AddressKey,
  isCanonicalCF1Address,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  canonicalJson,
  canonicalizeData,
  sha256Hex,
  type CanonicalJson,
} from './canonical.js';

export const OWNERSHIP_STATE_SCHEMA = 'cf-v2-ownership-state/v1' as const;
export const OWNERSHIP_STATE_VERSION = 1 as const;
export const MAX_OWNERSHIP_REVISION = Number.MAX_SAFE_INTEGER;
export const MAX_OWNERSHIP_ROWS = 20_000;
export const MAX_LEGACY_BIOX_EVIDENCE_ROWS = 60_000;
/* These two values still mirror into v4 `bioX`, whose supported reader clamps
   both fields at the bounds below. Keeping the carrier inside the same exact
   range prevents an ordinary v2 write from publishing a lossy compatibility
   projection. Real per-cycle pools are far smaller. */
export const MAX_BIOSPHERE_USED = 999;
export const MAX_ACTIVE_PLAY_CYCLE = 1_000_000_000;
export const OWNERSHIP_KINGDOMS = Object.freeze(['fauna', 'flora', 'fungi', 'microbe'] as const);
export type OwnershipKingdom = typeof OWNERSHIP_KINGDOMS[number];
export const OWNERSHIP_PROVENANCE_CAPABILITIES_V1 = Object.freeze({
  capture: true,
  breeding: false,
  guardian: false,
} as const);

declare const SPECIES_ID_BRAND: unique symbol;
declare const CREATURE_ID_BRAND: unique symbol;
declare const SPECIMEN_LOT_ID_BRAND: unique symbol;
declare const DISCOVERY_ID_BRAND: unique symbol;
export type SpeciesId = string & { readonly [SPECIES_ID_BRAND]: 'SpeciesId' };
export type CreatureInstanceId = string & { readonly [CREATURE_ID_BRAND]: 'CreatureInstanceId' };
export type SpecimenLotId = string & { readonly [SPECIMEN_LOT_ID_BRAND]: 'SpecimenLotId' };
export type DiscoveryRecordId = string & { readonly [DISCOVERY_ID_BRAND]: 'DiscoveryRecordId' };

export type CanonicalGenomeV1 = Readonly<Record<string, CanonicalJson>>;

export interface CanonicalGenomeIdentityV1 {
  readonly speciesId: SpeciesId;
  readonly genomeIdentity: string;
  readonly kingdom: OwnershipKingdom;
  readonly genome: CanonicalGenomeV1;
}

export interface LegacyLocationEvidenceV1 {
  readonly display: CanonicalJson;
}

export interface LegacyDiscoveryProvenanceV1 {
  readonly kind: 'legacy';
  readonly legacyCodexId: string;
  readonly legacySourceIndex: number;
  readonly from: string;
  readonly canonicalWorldKey: null;
  readonly canonicalWorldAddress: null;
  readonly legacyLocation: LegacyLocationEvidenceV1 | null;
}

export type AcquisitionVerbV1 = 'tame' | 'scavenge' | 'sample';

export interface WorldDiscoveryProvenanceV1 {
  readonly kind: 'world';
  readonly verb: AcquisitionVerbV1;
  readonly worldKey: string;
  readonly worldAddress: CanonicalCF1WorldAddress;
  readonly cycle: number;
  readonly sourceOrdinal: number;
}

export interface ParagonDiscoveryProvenanceV1 {
  readonly kind: 'paragon';
  readonly paragonIndex: number;
  readonly worldKey: string;
  readonly worldAddress: CanonicalCF1WorldAddress;
  readonly receiptOrdinal: number;
}

export type DiscoveryProvenanceV1 =
  | LegacyDiscoveryProvenanceV1
  | WorldDiscoveryProvenanceV1
  | ParagonDiscoveryProvenanceV1;

export interface DiscoveryRecordV1 {
  readonly recordId: DiscoveryRecordId;
  readonly speciesId: SpeciesId;
  readonly acquisition: 'legacy' | AcquisitionVerbV1 | 'paragon';
  readonly provenance: DiscoveryProvenanceV1;
  readonly firstForSpecies: boolean;
}

export interface CatalogSpeciesV1 {
  readonly speciesId: SpeciesId;
  readonly genomeIdentity: string;
  readonly kingdom: OwnershipKingdom;
  readonly genome: CanonicalGenomeV1;
  readonly alias: string | null;
  readonly firstObservationId: DiscoveryRecordId;
}

export type CreatureLineageV1 =
  | { readonly kind: 'none'; readonly generation: number }
  | {
      readonly kind: 'legacy-parent-seeds';
      readonly generation: number;
      readonly parentSeeds: readonly [number, number];
    }
  | {
      readonly kind: 'parent-creatures';
      readonly generation: number;
      readonly parentCreatureIds: readonly [CreatureInstanceId, CreatureInstanceId];
    };

export type CreatureAssignmentV1 =
  | { readonly kind: 'mission'; readonly missionId: string }
  | { readonly kind: 'recovery'; readonly readyAtActivePlayMs: number };

export interface CompanionBondMemoryV1 {
  readonly id: string;
  readonly kind: string;
  readonly worldKey: string | null;
  readonly atActivePlayMs: number;
}

export interface CompanionBondV1 {
  readonly level: number;
  readonly memories: readonly CompanionBondMemoryV1[];
  readonly preferredRole: string | null;
  readonly worldsSurvived: number;
  readonly guardianVictories: number;
  readonly mementoIds: readonly string[];
}

export interface CreatureInstanceV1 {
  readonly creatureId: CreatureInstanceId;
  readonly speciesId: SpeciesId;
  readonly genomeIdentity: string;
  readonly genome: CanonicalGenomeV1;
  readonly nickname: string | null;
  readonly origin: 'wild' | 'bred' | 'guardian' | 'legacy';
  readonly acquisitionRecordId: DiscoveryRecordId;
  readonly lineage: CreatureLineageV1;
  readonly xp: number | null;
  readonly hurt: number | null;
  readonly fed: number | null;
  readonly brood: number | null;
  readonly assignment: CreatureAssignmentV1 | null;
  readonly bond: CompanionBondV1 | null;
}

export interface SpecimenLotV1 {
  readonly lotId: SpecimenLotId;
  readonly speciesId: SpeciesId;
  readonly kind: Exclude<OwnershipKingdom, 'fauna'>;
  readonly quantity: number;
  readonly origin: 'wild' | 'legacy';
  readonly acquisitionRecordId: DiscoveryRecordId;
}

export interface BiosphereSuccessV1 {
  readonly speciesId: SpeciesId;
  readonly source: AcquisitionVerbV1;
}

export interface BiosphereProgressV1 {
  readonly worldKey: string;
  readonly worldAddress: CanonicalCF1WorldAddress;
  readonly cycle: number;
  readonly used: number;
  /** One row per successful species/source in this cycle. The uniqueness
      constraint is the later planner's repeat-eligibility authority. */
  readonly successful: readonly BiosphereSuccessV1[];
}

export type LegacyBioXRelationV1 = 'old' | 'equal' | 'future' | 'impossible';
export interface LegacyBioXEvidenceV1 {
  readonly legacyPlanetSeed: number;
  readonly used: number;
  readonly epochStamp: number;
  readonly relation: LegacyBioXRelationV1;
  readonly canonicalWorldKey: null;
}

export interface LegacyOwnershipSourceEvidenceV1 {
  readonly schema: 'cf-v1.8.9-ownership-source/v1';
  readonly digest: string;
  readonly jsonBytes: number;
  readonly codexRows: number;
  readonly uniqueSpecies: number;
  readonly bioXRows: number;
  readonly scoutCodexId: string | null;
}

export interface OwnershipStateV1 {
  readonly schema: typeof OWNERSHIP_STATE_SCHEMA;
  readonly version: typeof OWNERSHIP_STATE_VERSION;
  readonly revision: number;
  readonly mode: 'current' | 'legacy-protected';
  readonly catalogSpecies: readonly CatalogSpeciesV1[];
  readonly discoveries: readonly DiscoveryRecordV1[];
  readonly creatures: readonly CreatureInstanceV1[];
  readonly specimenLots: readonly SpecimenLotV1[];
  readonly biosphereProgress: readonly BiosphereProgressV1[];
  readonly legacyBioX: readonly LegacyBioXEvidenceV1[];
  readonly scoutCreatureId: CreatureInstanceId | null;
  readonly legacyProtection: LegacyOwnershipSourceEvidenceV1 | null;
}

export interface CanonicalCF1WorldAddressMirrorV1 {
  readonly format: 'CF1';
  readonly key: string;
  readonly galaxy: {
    readonly seed: number; readonly x: number; readonly y: number;
    readonly size: number; readonly sp: number; readonly tilt: number; readonly rot: number;
    readonly home: boolean; readonly quasar: boolean; readonly dwarf: boolean;
    readonly parentCell: { readonly x: number; readonly y: number };
  };
  readonly star: {
    readonly seed: number; readonly x: number; readonly y: number;
    readonly layer: 'coarse' | 'fine';
    readonly parentCell: { readonly x: number; readonly y: number };
  };
  readonly planet: { readonly seed: number; readonly ordinal: number };
}

export interface OwnershipAddressResolver {
  resolveWorldAddress(mirror: CanonicalCF1WorldAddressMirrorV1): CanonicalCF1WorldAddress | null;
}

interface LegacyDiscoveryProvenanceMirrorV1 extends LegacyDiscoveryProvenanceV1 {}
interface WorldDiscoveryProvenanceMirrorV1 {
  readonly kind: 'world';
  readonly verb: AcquisitionVerbV1;
  readonly worldKey: string;
  readonly worldAddress: CanonicalCF1WorldAddressMirrorV1;
  readonly cycle: number;
  readonly sourceOrdinal: number;
}
interface ParagonDiscoveryProvenanceMirrorV1 {
  readonly kind: 'paragon';
  readonly paragonIndex: number;
  readonly worldKey: string;
  readonly worldAddress: CanonicalCF1WorldAddressMirrorV1;
  readonly receiptOrdinal: number;
}
type DiscoveryProvenanceMirrorV1 =
  | LegacyDiscoveryProvenanceMirrorV1
  | WorldDiscoveryProvenanceMirrorV1
  | ParagonDiscoveryProvenanceMirrorV1;

export interface DiscoveryRecordMirrorV1 extends Omit<DiscoveryRecordV1, 'provenance'> {
  readonly provenance: DiscoveryProvenanceMirrorV1;
}
export interface BiosphereProgressMirrorV1 extends Omit<BiosphereProgressV1, 'worldAddress'> {
  readonly worldAddress: CanonicalCF1WorldAddressMirrorV1;
}
export interface OwnershipStateMirrorV1 {
  readonly schema: typeof OWNERSHIP_STATE_SCHEMA;
  readonly version: typeof OWNERSHIP_STATE_VERSION;
  readonly revision: number;
  readonly mode: OwnershipStateV1['mode'];
  readonly catalogSpecies: readonly CatalogSpeciesV1[];
  readonly discoveries: readonly DiscoveryRecordMirrorV1[];
  readonly creatures: readonly CreatureInstanceV1[];
  readonly specimenLots: readonly SpecimenLotV1[];
  readonly biosphereProgress: readonly BiosphereProgressMirrorV1[];
  readonly legacyBioX: readonly LegacyBioXEvidenceV1[];
  readonly scoutCreatureId: CreatureInstanceId | null;
  readonly legacyProtection: LegacyOwnershipSourceEvidenceV1 | null;
}

export interface OwnershipStateContentsV1 {
  readonly catalogSpecies: readonly CatalogSpeciesV1[];
  readonly discoveries: readonly DiscoveryRecordV1[];
  readonly creatures: readonly CreatureInstanceV1[];
  readonly specimenLots: readonly SpecimenLotV1[];
  readonly biosphereProgress: readonly BiosphereProgressV1[];
  readonly legacyBioX: readonly LegacyBioXEvidenceV1[];
  readonly scoutCreatureId: CreatureInstanceId | null;
}

const CATALOG_ROWS = new WeakMap<object, CatalogSpeciesV1>();
const DISCOVERY_ROWS = new WeakMap<object, DiscoveryRecordMirrorV1>();
const CREATURE_ROWS = new WeakMap<object, CreatureInstanceV1>();
const SPECIMEN_ROWS = new WeakMap<object, SpecimenLotV1>();
const BIOSPHERE_ROWS = new WeakMap<object, BiosphereProgressMirrorV1>();
const LEGACY_BIOX_ROWS = new WeakMap<object, LegacyBioXEvidenceV1>();
const STATES = new WeakMap<object, {
  readonly mirror: OwnershipStateMirrorV1;
  readonly encoded: string;
  readonly digest: string;
  readonly parentDigest: string | null;
}>();

function record(value: CanonicalJson, label: string): Readonly<Record<string, CanonicalJson>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as Readonly<Record<string, CanonicalJson>>;
}

function ownPlainFields(
  value: unknown,
  fields: readonly string[],
  label: string,
): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    throw new TypeError(`${label} must be a plain object`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key === 'symbol')) throw new TypeError(`${label} cannot contain symbols`);
  const names = keys as string[];
  const actual = [...names].sort(), wanted = [...fields].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
  const captured: Record<string, unknown> = {};
  for (const key of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || descriptor.get !== undefined
      || descriptor.set !== undefined || descriptor.enumerable !== true) {
      throw new TypeError(`${label}.${key} must be an enumerable own data field`);
    }
    captured[key] = descriptor.value;
  }
  return Object.freeze(captured);
}

function exactKeys(value: Readonly<Record<string, CanonicalJson>>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...keys].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function stringValue(value: CanonicalJson, label: string, maximum = 256): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`${label} must be a bounded string`);
  return value;
}

function nullableString(value: CanonicalJson, label: string, maximum = 256): string | null {
  return value === null ? null : stringValue(value, label, maximum);
}

function boundedDisplayString(value: CanonicalJson, label: string, maximum: number): string {
  if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} must be a bounded display string`);
  }
  return value;
}

function integer(value: CanonicalJson, label: string, maximum = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new RangeError(`${label} must be an integer from 0 to ${maximum}`);
  }
  return value;
}

function boundedNumber(value: CanonicalJson, label: string, maximum: number): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum) {
    throw new RangeError(`${label} must be null or a number from 0 to ${maximum}`);
  }
  return value;
}

function uint32(value: CanonicalJson, label: string): number {
  return integer(value, label, 0xFFFF_FFFF) >>> 0;
}

function id<T extends string>(value: CanonicalJson, prefix: string, label: string): T {
  const checked = stringValue(value, label, 96);
  if (!new RegExp(`^${prefix}:[0-9a-f]{64}$`, 'u').test(checked)) throw new TypeError(`${label} is malformed`);
  return checked as T;
}

function speciesId(value: CanonicalJson): SpeciesId { return id<SpeciesId>(value, 'species-v1', 'speciesId'); }
function creatureId(value: CanonicalJson): CreatureInstanceId { return id<CreatureInstanceId>(value, 'creature-v1', 'creatureId'); }
function specimenId(value: CanonicalJson): SpecimenLotId { return id<SpecimenLotId>(value, 'specimen-v1', 'lotId'); }
function discoveryId(value: CanonicalJson): DiscoveryRecordId { return id<DiscoveryRecordId>(value, 'discovery-v1', 'recordId'); }

function kingdom(value: CanonicalJson): OwnershipKingdom {
  if (typeof value !== 'string' || !(OWNERSHIP_KINGDOMS as readonly string[]).includes(value)) {
    throw new TypeError('ownership kingdom is invalid');
  }
  return value as OwnershipKingdom;
}

function freezePair<T>(left: T, right: T): readonly [T, T] {
  return Object.freeze([left, right] as const);
}

const NON_SPECIES_GENOME_FIELDS = new Set([
  'xp', 'hurt', 'fed', 'brood', 'assignment', 'bond',
]);

/** Canonical species identity is the complete immutable genome, never its
    bare seed or display name. Mutable owned-creature fields are projected out
    one at a time before hashing. */
export function canonicalGenomeIdentityV1(value: unknown): CanonicalGenomeIdentityV1 {
  const source = record(canonicalizeData(value), 'genome');
  const seed = uint32(source.seed ?? null, 'genome seed');
  const kind = kingdom(source.kingdom ?? null);
  const genome: Record<string, CanonicalJson> = {};
  for (const key of Object.keys(source)) {
    if (!NON_SPECIES_GENOME_FIELDS.has(key)) genome[key] = source[key]!;
  }
  genome.seed = seed;
  genome.kingdom = kind;
  const canonical = JSON.stringify(genome);
  const digest = sha256Hex(canonical);
  return Object.freeze({
    speciesId: `species-v1:${digest}` as SpeciesId,
    genomeIdentity: `genome-v1:${digest}`,
    kingdom: kind,
    genome: Object.freeze(genome),
  });
}

export function ownershipContentId(
  kind: 'creature' | 'specimen' | 'discovery',
  witness: string,
): CreatureInstanceId | SpecimenLotId | DiscoveryRecordId {
  if (typeof witness !== 'string' || witness.length === 0 || witness.length > 1_000_000) {
    throw new RangeError('ownership id witness is invalid');
  }
  return `${kind}-v1:${sha256Hex(witness)}` as CreatureInstanceId | SpecimenLotId | DiscoveryRecordId;
}

function addressMirror(address: CanonicalCF1WorldAddress): CanonicalCF1WorldAddressMirrorV1 {
  if (!isCanonicalCF1Address(address) || !('planet' in address)) {
    throw new TypeError('ownership world address must be runtime-proven');
  }
  const key = getCanonicalCF1AddressKey(address);
  if (key === null || key !== address.key) throw new TypeError('ownership world address key is unproven');
  return Object.freeze({
    format: 'CF1', key,
    galaxy: Object.freeze({
      seed: address.galaxy.seed, x: address.galaxy.x, y: address.galaxy.y,
      size: address.galaxy.size, sp: address.galaxy.sp, tilt: address.galaxy.tilt, rot: address.galaxy.rot,
      home: address.galaxy.home, quasar: address.galaxy.quasar, dwarf: address.galaxy.dwarf,
      parentCell: Object.freeze({ x: address.galaxy.parentCell.x, y: address.galaxy.parentCell.y }),
    }),
    star: Object.freeze({
      seed: address.star.seed, x: address.star.x, y: address.star.y, layer: address.star.layer,
      parentCell: Object.freeze({ x: address.star.parentCell.x, y: address.star.parentCell.y }),
    }),
    planet: Object.freeze({ seed: address.planet.seed, ordinal: address.planet.ordinal }),
  });
}

export const SCENE_OWNERSHIP_ADDRESS_RESOLVER: OwnershipAddressResolver = Object.freeze({
  resolveWorldAddress(mirror: CanonicalCF1WorldAddressMirrorV1): CanonicalCF1WorldAddress | null {
    try {
      const detached = addressMirrorFromJson(canonicalizeData(mirror));
      const resolved = resolveCF1WorldAddress({
        galaxy: { seed: detached.galaxy.seed, x: detached.galaxy.x, y: detached.galaxy.y },
        star: { seed: detached.star.seed, x: detached.star.x, y: detached.star.y },
        planet: { seed: detached.planet.seed },
      });
      if (!resolved.ok
        || canonicalJson(addressMirror(resolved.address)) !== canonicalJson(detached)) return null;
      return resolved.address;
    } catch { return null; }
  },
});

export function createLegacyDiscoveryRecordV1(input: Readonly<{
  recordId: DiscoveryRecordId;
  speciesId: SpeciesId;
  legacyCodexId: string;
  legacySourceIndex: number;
  from: string;
  legacyLocation: CanonicalJson | null;
  firstForSpecies: boolean;
}>): DiscoveryRecordV1 {
  const raw = record(canonicalizeData(input), 'legacy discovery');
  exactKeys(raw, ['recordId', 'speciesId', 'legacyCodexId', 'legacySourceIndex', 'from', 'legacyLocation', 'firstForSpecies'], 'legacy discovery');
  const location = raw.legacyLocation === null ? null : Object.freeze({ display: raw.legacyLocation! });
  const provenance: LegacyDiscoveryProvenanceV1 = Object.freeze({
    kind: 'legacy',
    legacyCodexId: stringValue(raw.legacyCodexId!, 'legacy codex id', 96),
    legacySourceIndex: integer(raw.legacySourceIndex!, 'legacy source index', 1_499),
    from: boundedDisplayString(raw.from!, 'legacy discovery source', 48),
    canonicalWorldKey: null,
    canonicalWorldAddress: null,
    legacyLocation: location,
  });
  if (typeof raw.firstForSpecies !== 'boolean') throw new TypeError('firstForSpecies must be boolean');
  const row: DiscoveryRecordV1 = Object.freeze({
    recordId: discoveryId(raw.recordId!), speciesId: speciesId(raw.speciesId!),
    acquisition: 'legacy', provenance, firstForSpecies: raw.firstForSpecies,
  });
  DISCOVERY_ROWS.set(row, Object.freeze({ ...row, provenance }));
  return row;
}

export function createWorldDiscoveryRecordV1(input: Readonly<{
  recordId: DiscoveryRecordId;
  speciesId: SpeciesId;
  verb: AcquisitionVerbV1;
  worldAddress: CanonicalCF1WorldAddress;
  cycle: number;
  sourceOrdinal: number;
  firstForSpecies: boolean;
}>): DiscoveryRecordV1 {
  const captured = ownPlainFields(input, [
    'recordId', 'speciesId', 'verb', 'worldAddress', 'cycle', 'sourceOrdinal', 'firstForSpecies',
  ], 'world discovery');
  const worldAddress = captured.worldAddress;
  if (!isCanonicalCF1Address(worldAddress) || !('planet' in worldAddress)) {
    throw new TypeError('world discovery requires a runtime-proven world address');
  }
  const simple = record(canonicalizeData({
    recordId: captured.recordId, speciesId: captured.speciesId, verb: captured.verb,
    cycle: captured.cycle, sourceOrdinal: captured.sourceOrdinal, firstForSpecies: captured.firstForSpecies,
  }), 'world discovery');
  exactKeys(simple, ['recordId', 'speciesId', 'verb', 'cycle', 'sourceOrdinal', 'firstForSpecies'], 'world discovery');
  if (simple.verb !== 'tame' && simple.verb !== 'scavenge' && simple.verb !== 'sample') {
    throw new TypeError('world discovery verb is invalid');
  }
  if (typeof simple.firstForSpecies !== 'boolean') throw new TypeError('firstForSpecies must be boolean');
  const mirror = addressMirror(worldAddress);
  const provenance: WorldDiscoveryProvenanceV1 = Object.freeze({
    kind: 'world', verb: simple.verb,
    worldKey: mirror.key, worldAddress,
    cycle: integer(simple.cycle!, 'world discovery cycle'),
    sourceOrdinal: integer(simple.sourceOrdinal!, 'world discovery source ordinal', MAX_OWNERSHIP_ROWS),
  });
  const row: DiscoveryRecordV1 = Object.freeze({
    recordId: discoveryId(simple.recordId!), speciesId: speciesId(simple.speciesId!),
    acquisition: simple.verb, provenance, firstForSpecies: simple.firstForSpecies,
  });
  DISCOVERY_ROWS.set(row, Object.freeze({
    ...row,
    provenance: Object.freeze({ ...provenance, worldAddress: mirror }),
  }));
  return row;
}

/** Catalogue-only observation of one of the fixed Fifty Paragons. This is
 * deliberately not a capture verb: it owns no creature, specimen lot, or
 * Biosphere Yield row. The caller must still prove the exact Paragon genome
 * and home-world binding before this registered provenance is constructed. */
export function createParagonDiscoveryRecordV1(input: Readonly<{
  recordId: DiscoveryRecordId;
  speciesId: SpeciesId;
  paragonIndex: number;
  worldAddress: CanonicalCF1WorldAddress;
  receiptOrdinal: number;
}>): DiscoveryRecordV1 {
  const captured = ownPlainFields(input, [
    'recordId', 'speciesId', 'paragonIndex', 'worldAddress', 'receiptOrdinal',
  ], 'Paragon discovery');
  const worldAddress = captured.worldAddress;
  if (!isCanonicalCF1Address(worldAddress) || !('planet' in worldAddress)) {
    throw new TypeError('Paragon discovery requires a runtime-proven world address');
  }
  const simple = record(canonicalizeData({
    recordId: captured.recordId,
    speciesId: captured.speciesId,
    paragonIndex: captured.paragonIndex,
    receiptOrdinal: captured.receiptOrdinal,
  }), 'Paragon discovery');
  exactKeys(simple, [
    'recordId', 'speciesId', 'paragonIndex', 'receiptOrdinal',
  ], 'Paragon discovery');
  const mirror = addressMirror(worldAddress);
  const provenance: ParagonDiscoveryProvenanceV1 = Object.freeze({
    kind: 'paragon',
    paragonIndex: integer(simple.paragonIndex!, 'Paragon index', 49),
    worldKey: mirror.key,
    worldAddress,
    receiptOrdinal: integer(simple.receiptOrdinal!, 'Paragon receipt ordinal', 0xFFFF_FFFE),
  });
  const row: DiscoveryRecordV1 = Object.freeze({
    recordId: discoveryId(simple.recordId!),
    speciesId: speciesId(simple.speciesId!),
    acquisition: 'paragon',
    provenance,
    firstForSpecies: true,
  });
  DISCOVERY_ROWS.set(row, Object.freeze({
    ...row,
    provenance: Object.freeze({ ...provenance, worldAddress: mirror }),
  }));
  return row;
}

export function createCatalogSpeciesV1(input: Readonly<{
  identity: CanonicalGenomeIdentityV1;
  alias: string | null;
  firstObservationId: DiscoveryRecordId;
}>): CatalogSpeciesV1 {
  const raw = record(canonicalizeData(input), 'catalogue species input');
  exactKeys(raw, ['identity', 'alias', 'firstObservationId'], 'catalogue species input');
  const claimed = record(raw.identity!, 'catalogue genome identity');
  exactKeys(claimed, ['speciesId', 'genomeIdentity', 'kingdom', 'genome'], 'catalogue genome identity');
  const identity = canonicalGenomeIdentityV1(claimed.genome);
  if (identity.speciesId !== claimed.speciesId
    || identity.genomeIdentity !== claimed.genomeIdentity
    || identity.kingdom !== claimed.kingdom) throw new TypeError('catalogue genome identity mismatch');
  const alias = nullableString(raw.alias!, 'catalogue alias', 24);
  const first = discoveryId(raw.firstObservationId!);
  const row: CatalogSpeciesV1 = Object.freeze({ ...identity, alias, firstObservationId: first });
  CATALOG_ROWS.set(row, row);
  return row;
}

function lineage(value: CanonicalJson): CreatureLineageV1 {
  const source = record(value, 'creature lineage');
  const kind = source.kind;
  if (kind === 'none') {
    exactKeys(source, ['kind', 'generation'], 'no-lineage');
    return Object.freeze({ kind, generation: integer(source.generation!, 'lineage generation', 1_000_000_000) });
  }
  if (kind === 'legacy-parent-seeds') {
    exactKeys(source, ['kind', 'generation', 'parentSeeds'], 'legacy lineage');
    if (!Array.isArray(source.parentSeeds) || source.parentSeeds.length !== 2) throw new TypeError('legacy parent seeds must be an ordered pair');
    return Object.freeze({
      kind, generation: integer(source.generation!, 'lineage generation', 1_000_000_000),
      parentSeeds: freezePair(uint32(source.parentSeeds[0]!, 'first parent seed'), uint32(source.parentSeeds[1]!, 'second parent seed')),
    });
  }
  if (kind === 'parent-creatures') {
    exactKeys(source, ['kind', 'generation', 'parentCreatureIds'], 'creature lineage');
    if (!Array.isArray(source.parentCreatureIds) || source.parentCreatureIds.length !== 2) {
      throw new TypeError('parent creature IDs must be an ordered pair');
    }
    return Object.freeze({
      kind, generation: integer(source.generation!, 'lineage generation', 1_000_000_000),
      parentCreatureIds: freezePair(
        creatureId(source.parentCreatureIds[0]!), creatureId(source.parentCreatureIds[1]!),
      ),
    });
  }
  throw new TypeError('creature lineage kind is invalid');
}

function assignment(value: CanonicalJson): CreatureAssignmentV1 | null {
  if (value === null) return null;
  const source = record(value, 'creature assignment');
  if (source.kind === 'mission') {
    exactKeys(source, ['kind', 'missionId'], 'mission assignment');
    return Object.freeze({ kind: 'mission', missionId: stringValue(source.missionId!, 'mission id', 128) });
  }
  if (source.kind === 'recovery') {
    exactKeys(source, ['kind', 'readyAtActivePlayMs'], 'recovery assignment');
    return Object.freeze({
      kind: 'recovery', readyAtActivePlayMs: integer(source.readyAtActivePlayMs!, 'recovery active-play time'),
    });
  }
  throw new TypeError('creature assignment kind is invalid');
}

function bond(value: CanonicalJson): CompanionBondV1 | null {
  if (value === null) return null;
  const source = record(value, 'companion bond');
  exactKeys(source, ['level', 'memories', 'preferredRole', 'worldsSurvived', 'guardianVictories', 'mementoIds'], 'companion bond');
  if (!Array.isArray(source.memories) || source.memories.length > 128) throw new TypeError('bond memories are invalid');
  const memoryIds = new Set<string>();
  const memories = source.memories.map((candidate, index): CompanionBondMemoryV1 => {
    const memory = record(candidate, `bond memory ${index}`);
    exactKeys(memory, ['id', 'kind', 'worldKey', 'atActivePlayMs'], `bond memory ${index}`);
    const id = stringValue(memory.id!, 'bond memory id', 128);
    if (memoryIds.has(id)) throw new TypeError('bond memory IDs repeat');
    memoryIds.add(id);
    return Object.freeze({
      id,
      kind: stringValue(memory.kind!, 'bond memory kind', 64),
      worldKey: nullableString(memory.worldKey!, 'bond memory world key', 512),
      atActivePlayMs: integer(memory.atActivePlayMs!, 'bond memory active-play time'),
    });
  });
  if (!Array.isArray(source.mementoIds) || source.mementoIds.length > 128) throw new TypeError('bond mementos are invalid');
  const mementos = source.mementoIds.map((candidate) => stringValue(candidate, 'bond memento id', 128));
  if (new Set(mementos).size !== mementos.length) throw new TypeError('bond mementos repeat');
  return Object.freeze({
    level: integer(source.level!, 'bond level', 1_000_000),
    memories: Object.freeze(memories),
    preferredRole: nullableString(source.preferredRole!, 'bond preferred role', 64),
    worldsSurvived: integer(source.worldsSurvived!, 'bond worlds survived', 1_000_000_000),
    guardianVictories: integer(source.guardianVictories!, 'bond guardian victories', 1_000_000_000),
    mementoIds: Object.freeze(mementos),
  });
}

export function createCreatureInstanceV1(input: Readonly<{
  creatureId: CreatureInstanceId;
  speciesId: SpeciesId;
  genomeIdentity: string;
  genome: CanonicalGenomeV1;
  nickname: string | null;
  origin: CreatureInstanceV1['origin'];
  acquisitionRecordId: DiscoveryRecordId;
  lineage: CreatureLineageV1;
  xp: number | null;
  hurt: number | null;
  fed: number | null;
  brood: number | null;
  assignment: CreatureAssignmentV1 | null;
  bond: CompanionBondV1 | null;
}>): CreatureInstanceV1 {
  const source = record(canonicalizeData(input), 'creature instance');
  exactKeys(source, [
    'creatureId', 'speciesId', 'genomeIdentity', 'genome', 'nickname', 'origin',
    'acquisitionRecordId', 'lineage', 'xp', 'hurt', 'fed', 'brood', 'assignment', 'bond',
  ], 'creature instance');
  const identity = canonicalGenomeIdentityV1(source.genome);
  const sid = speciesId(source.speciesId!);
  if (identity.speciesId !== sid || source.genomeIdentity !== identity.genomeIdentity) {
    throw new TypeError('creature genome identity does not match species');
  }
  if (source.origin !== 'wild' && source.origin !== 'bred'
    && source.origin !== 'guardian' && source.origin !== 'legacy') throw new TypeError('creature origin is invalid');
  const checkedLineage = lineage(source.lineage!);
  if ((source.origin === 'bred') !== (checkedLineage.kind === 'parent-creatures')
    || (checkedLineage.kind === 'legacy-parent-seeds' && source.origin !== 'legacy')) {
    throw new TypeError('creature origin and lineage are inconsistent');
  }
  const row: CreatureInstanceV1 = Object.freeze({
    creatureId: creatureId(source.creatureId!), speciesId: sid,
    genomeIdentity: identity.genomeIdentity, genome: identity.genome,
    nickname: nullableString(source.nickname!, 'creature nickname', 24),
    origin: source.origin,
    acquisitionRecordId: discoveryId(source.acquisitionRecordId!),
    lineage: checkedLineage,
    xp: boundedNumber(source.xp!, 'creature xp', 486),
    hurt: boundedNumber(source.hurt!, 'creature hurt', 1),
    fed: boundedNumber(source.fed!, 'creature fed', 200),
    brood: boundedNumber(source.brood!, 'creature brood', 200),
    assignment: assignment(source.assignment!),
    bond: bond(source.bond!),
  });
  CREATURE_ROWS.set(row, row);
  return row;
}

export function createSpecimenLotV1(input: SpecimenLotV1): SpecimenLotV1 {
  const source = record(canonicalizeData(input), 'specimen lot');
  exactKeys(source, ['lotId', 'speciesId', 'kind', 'quantity', 'origin', 'acquisitionRecordId'], 'specimen lot');
  const kind = kingdom(source.kind!);
  if (kind === 'fauna') throw new TypeError('fauna cannot be a specimen lot');
  if (source.origin !== 'wild' && source.origin !== 'legacy') throw new TypeError('specimen origin is invalid');
  const row: SpecimenLotV1 = Object.freeze({
    lotId: specimenId(source.lotId!), speciesId: speciesId(source.speciesId!), kind,
    quantity: integer(source.quantity!, 'specimen quantity', 1_000_000_000),
    origin: source.origin, acquisitionRecordId: discoveryId(source.acquisitionRecordId!),
  });
  if (row.quantity < 1) throw new RangeError('specimen quantity must be positive');
  SPECIMEN_ROWS.set(row, row);
  return row;
}

export function createBiosphereProgressV1(input: Readonly<{
  worldAddress: CanonicalCF1WorldAddress;
  cycle: number;
  used: number;
  successful: readonly BiosphereSuccessV1[];
}>): BiosphereProgressV1 {
  const captured = ownPlainFields(input, ['worldAddress', 'cycle', 'used', 'successful'], 'biosphere progress');
  const worldAddress = captured.worldAddress;
  if (!isCanonicalCF1Address(worldAddress) || !('planet' in worldAddress)) {
    throw new TypeError('biosphere progress requires a runtime-proven world address');
  }
  const mirror = addressMirror(worldAddress);
  const simple = record(canonicalizeData({
    cycle: captured.cycle, used: captured.used, successful: captured.successful,
  }), 'biosphere progress');
  exactKeys(simple, ['cycle', 'used', 'successful'], 'biosphere progress');
  if (!Array.isArray(simple.successful) || simple.successful.length > MAX_OWNERSHIP_ROWS) {
    throw new RangeError('biosphere successful rows exceed the ownership bound');
  }
  const seen = new Set<string>();
  const successful = simple.successful.map((candidate, index): BiosphereSuccessV1 => {
    const row = record(candidate, `biosphere success ${index}`);
    exactKeys(row, ['speciesId', 'source'], `biosphere success ${index}`);
    const sid = speciesId(row.speciesId!);
    if (row.source !== 'tame' && row.source !== 'scavenge' && row.source !== 'sample') {
      throw new TypeError('biosphere success source is invalid');
    }
    const key = `${sid}\u0000${row.source}`;
    if (seen.has(key)) throw new TypeError('biosphere success repeats species/source in one cycle');
    seen.add(key);
    return Object.freeze({ speciesId: sid, source: row.source });
  }).sort((left, right) => {
    const a = `${left.speciesId}\u0000${left.source}`;
    const b = `${right.speciesId}\u0000${right.source}`;
    return a < b ? -1 : a > b ? 1 : 0;
  });
  const row: BiosphereProgressV1 = Object.freeze({
    worldKey: mirror.key, worldAddress,
    cycle: integer(simple.cycle!, 'biosphere cycle', MAX_ACTIVE_PLAY_CYCLE),
    used: integer(simple.used!, 'biosphere used', MAX_BIOSPHERE_USED),
    successful: Object.freeze(successful),
  });
  if (row.used < row.successful.length) {
    throw new TypeError('biosphere success cannot exceed spent attempts');
  }
  BIOSPHERE_ROWS.set(row, Object.freeze({ ...row, worldAddress: mirror }));
  return row;
}

export function createLegacyBioXEvidenceV1(input: LegacyBioXEvidenceV1): LegacyBioXEvidenceV1 {
  const source = record(canonicalizeData(input), 'legacy bioX evidence');
  exactKeys(source, ['legacyPlanetSeed', 'used', 'epochStamp', 'relation', 'canonicalWorldKey'], 'legacy bioX evidence');
  if (source.canonicalWorldKey !== null) throw new TypeError('legacy bioX cannot claim a canonical world');
  if (source.relation !== 'old' && source.relation !== 'equal'
    && source.relation !== 'future' && source.relation !== 'impossible') throw new TypeError('legacy bioX relation is invalid');
  if (typeof source.legacyPlanetSeed !== 'number' || !Number.isFinite(source.legacyPlanetSeed)
    || typeof source.used !== 'number' || !Number.isFinite(source.used)
    || typeof source.epochStamp !== 'number' || !Number.isFinite(source.epochStamp)) {
    throw new TypeError('legacy bioX evidence must contain finite numeric bytes');
  }
  const row: LegacyBioXEvidenceV1 = Object.freeze({
    legacyPlanetSeed: source.legacyPlanetSeed,
    used: source.used,
    epochStamp: source.epochStamp,
    relation: source.relation,
    canonicalWorldKey: null,
  });
  LEGACY_BIOX_ROWS.set(row, row);
  return row;
}

interface Registration { has(value: object): boolean }

function registered<T>(map: Registration, value: T, label: string): T {
  if (!value || typeof value !== 'object') throw new TypeError(`${label} must be registered`);
  if (!map.has(value)) throw new TypeError(`${label} must be registered`);
  return value;
}

function sortedUnique<T>(
  values: readonly T[],
  map: Registration,
  keyOf: (value: T) => string,
  label: string,
  maximum = MAX_OWNERSHIP_ROWS,
): readonly T[] {
  if (!Array.isArray(values) || Object.getPrototypeOf(values) !== Array.prototype) {
    throw new RangeError(`${label} exceeds the ownership row bound`);
  }
  const keys = Reflect.ownKeys(values);
  if (keys.some((key) => typeof key === 'symbol')) throw new TypeError(`${label} cannot contain symbols`);
  const lengthDescriptor = Object.getOwnPropertyDescriptor(values, 'length');
  if (!lengthDescriptor || !('value' in lengthDescriptor)
    || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0
    || lengthDescriptor.value > maximum || keys.length !== lengthDescriptor.value + 1) {
    throw new RangeError(`${label} exceeds the ownership row bound`);
  }
  const length = lengthDescriptor.value as number;
  const seen = new Set<string>();
  const rows: T[] = [];
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(values, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.get !== undefined
      || descriptor.set !== undefined || descriptor.enumerable !== true) {
      throw new TypeError(`${label} must be a dense own-data array`);
    }
    rows.push(registered(map, descriptor.value as T, label));
  }
  for (const row of rows) {
    const key = keyOf(row);
    if (seen.has(key)) throw new TypeError(`${label} repeats ${key}`);
    seen.add(key);
  }
  rows.sort((left, right) => {
    const a = keyOf(left), b = keyOf(right);
    return a < b ? -1 : a > b ? 1 : 0;
  });
  return Object.freeze(rows);
}

function sourceMirror(row: DiscoveryRecordV1): DiscoveryRecordMirrorV1 {
  const mirror = DISCOVERY_ROWS.get(row);
  if (!mirror) throw new TypeError('discovery record must be registered');
  return mirror;
}

function progressMirror(row: BiosphereProgressV1): BiosphereProgressMirrorV1 {
  const mirror = BIOSPHERE_ROWS.get(row);
  if (!mirror) throw new TypeError('biosphere progress must be registered');
  return mirror;
}

function sourceEvidence(value: unknown): LegacyOwnershipSourceEvidenceV1 {
  const source = record(canonicalizeData(value), 'legacy source evidence');
  exactKeys(source, ['schema', 'digest', 'jsonBytes', 'codexRows', 'uniqueSpecies', 'bioXRows', 'scoutCodexId'], 'legacy source evidence');
  if (source.schema !== 'cf-v1.8.9-ownership-source/v1'
    || typeof source.digest !== 'string' || !/^[0-9a-f]{64}$/u.test(source.digest)) {
    throw new TypeError('legacy source evidence identity is invalid');
  }
  return Object.freeze({
    schema: source.schema,
    digest: source.digest,
    jsonBytes: integer(source.jsonBytes!, 'legacy source JSON bytes', 16_000_000),
    codexRows: integer(source.codexRows!, 'legacy source codex rows', 1_500),
    uniqueSpecies: integer(source.uniqueSpecies!, 'legacy source unique species', 1_500),
    bioXRows: integer(source.bioXRows!, 'legacy source bioX rows', 60_000),
    scoutCodexId: nullableString(source.scoutCodexId!, 'legacy scout codex id', 96),
  });
}

function expectedVerb(kind: OwnershipKingdom): AcquisitionVerbV1 {
  if (kind === 'fauna') return 'tame';
  if (kind === 'microbe') return 'sample';
  return 'scavenge';
}

function validateGlobalRowBound(state: OwnershipStateV1): void {
  let rows = state.catalogSpecies.length + state.discoveries.length + state.creatures.length
    + state.specimenLots.length + state.biosphereProgress.length;
  for (const progress of state.biosphereProgress) rows += progress.successful.length;
  for (const creature of state.creatures) {
    if (creature.bond !== null) {
      rows += creature.bond.memories.length + creature.bond.mementoIds.length;
    }
  }
  if (rows > MAX_OWNERSHIP_ROWS) {
    throw new RangeError('ownership state exceeds the global row bound');
  }
}

function validateRelationships(state: OwnershipStateV1): void {
  const catalog = new Map(state.catalogSpecies.map((row) => [row.speciesId, row]));
  const discoveries = new Map(state.discoveries.map((row) => [row.recordId, row]));
  const progressByWorld = new Map(state.biosphereProgress.map((row) => [row.worldKey, row]));
  const currentProgressSuccesses = new Set<string>();
  for (const progress of state.biosphereProgress) {
    for (const success of progress.successful) {
      currentProgressSuccesses.add(
        `${success.speciesId}\u0000${progress.worldKey}\u0000${success.source}\u0000${progress.cycle}`,
      );
    }
  }
  const firstObservations = new Map<SpeciesId, number>();
  const discoverySuccesses = new Set<string>();
  const paragonIndices = new Set<number>();
  for (const row of state.discoveries) {
    const species = catalog.get(row.speciesId);
    if (!species) throw new TypeError('discovery references an absent species');
    if (row.firstForSpecies) {
      firstObservations.set(row.speciesId, (firstObservations.get(row.speciesId) ?? 0) + 1);
    }
    if (row.provenance.kind === 'paragon') {
      if (species.kingdom !== 'fauna' || row.acquisition !== 'paragon'
        || !row.firstForSpecies || paragonIndices.has(row.provenance.paragonIndex)) {
        throw new TypeError('Paragon catalogue provenance is invalid or repeated');
      }
      paragonIndices.add(row.provenance.paragonIndex);
      continue;
    }
    if (row.provenance.kind !== 'world') continue;
    if (row.provenance.verb !== expectedVerb(species.kingdom)) {
      throw new TypeError('world acquisition verb does not match the species kingdom');
    }
    const key = `${row.speciesId}\u0000${row.provenance.worldKey}\u0000${row.provenance.verb}\u0000${row.provenance.cycle}`;
    const progress = progressByWorld.get(row.provenance.worldKey);
    if (!progress || row.provenance.cycle > progress.cycle) {
      throw new TypeError('world acquisition lacks matching biosphere progress');
    }
    if (row.provenance.cycle === progress.cycle && !currentProgressSuccesses.has(key)) {
      throw new TypeError('world acquisition lacks current-cycle biosphere success');
    }
    if (discoverySuccesses.has(key)) throw new TypeError('species/source/cycle acquisition repeats');
    discoverySuccesses.add(key);
  }
  for (const row of state.catalogSpecies) {
    const first = discoveries.get(row.firstObservationId);
    if (!first || first.speciesId !== row.speciesId || !first.firstForSpecies) {
      throw new TypeError('catalogue first observation is absent or mismatched');
    }
    if (firstObservations.get(row.speciesId) !== 1) {
      throw new TypeError('catalogue species must have exactly one first observation');
    }
  }

  const creatures = new Map(state.creatures.map((row) => [row.creatureId, row]));
  const acquisitionOwners = new Set<DiscoveryRecordId>();
  for (const row of state.creatures) {
    const species = catalog.get(row.speciesId);
    const acquisition = discoveries.get(row.acquisitionRecordId);
    if (!species || species.kingdom !== 'fauna'
      || species.genomeIdentity !== row.genomeIdentity
      || JSON.stringify(species.genome) !== JSON.stringify(row.genome)
      || !acquisition || acquisition.speciesId !== row.speciesId) {
      throw new TypeError('creature ownership relationship is invalid');
    }
    if (acquisitionOwners.has(row.acquisitionRecordId)) {
      throw new TypeError('one acquisition record cannot create duplicate owned rows');
    }
    acquisitionOwners.add(row.acquisitionRecordId);
    if (row.lineage.kind === 'parent-creatures') {
      const [leftId, rightId] = row.lineage.parentCreatureIds;
      const left = creatures.get(leftId), right = creatures.get(rightId);
      if (!left || !right || left === row || right === row || left === right
        || row.lineage.generation !== Math.max(left.lineage.generation, right.lineage.generation) + 1) {
        throw new TypeError('creature lineage must reference two real owned parents');
      }
    }
    if (row.origin === 'bred') {
      throw new TypeError('bred ownership requires an Arc 5 carrier/provenance extension');
    }
    if (row.origin === 'guardian') {
      throw new TypeError('guardian ownership requires a future carrier/provenance extension');
    }
    if ((row.origin === 'legacy') !== (acquisition.provenance.kind === 'legacy')) {
      throw new TypeError('creature origin does not match acquisition provenance');
    }
  }
  for (const row of state.specimenLots) {
    const species = catalog.get(row.speciesId);
    const acquisition = discoveries.get(row.acquisitionRecordId);
    if (!species || species.kingdom !== row.kind
      || !acquisition || acquisition.speciesId !== row.speciesId) {
      throw new TypeError('specimen ownership relationship is invalid');
    }
    if (acquisitionOwners.has(row.acquisitionRecordId)) {
      throw new TypeError('one acquisition record cannot create duplicate owned rows');
    }
    acquisitionOwners.add(row.acquisitionRecordId);
    if ((row.origin === 'legacy') !== (acquisition.provenance.kind === 'legacy')) {
      throw new TypeError('specimen origin does not match acquisition provenance');
    }
  }
  for (const row of state.discoveries) {
    const species = catalog.get(row.speciesId)!;
    if (row.provenance.kind === 'paragon' && acquisitionOwners.has(row.recordId)) {
      throw new TypeError('Paragon catalogue observation cannot own an individual or specimen');
    }
    if ((row.provenance.kind === 'legacy' || species.kingdom !== 'fauna')
      && !acquisitionOwners.has(row.recordId)) {
      throw new TypeError('acquisition audit row lacks its required owned row');
    }
  }
  if (state.scoutCreatureId !== null && !creatures.has(state.scoutCreatureId)) {
    throw new TypeError('field scout must be an owned creature instance');
  }
  for (const progress of state.biosphereProgress) {
    for (const success of progress.successful) {
      const key = `${success.speciesId}\u0000${progress.worldKey}\u0000${success.source}\u0000${progress.cycle}`;
      if (!discoverySuccesses.has(key)) throw new TypeError('biosphere success lacks an acquisition audit row');
    }
  }
}

function buildState(
  revision: number,
  mode: OwnershipStateV1['mode'],
  contents: OwnershipStateContentsV1,
  protection: LegacyOwnershipSourceEvidenceV1 | null,
  parentDigest: string | null,
): OwnershipStateV1 {
  if (!Number.isSafeInteger(revision) || revision < 0 || revision > MAX_OWNERSHIP_REVISION) {
    throw new RangeError('ownership revision is invalid');
  }
  const captured = ownPlainFields(contents, [
    'catalogSpecies', 'discoveries', 'creatures', 'specimenLots',
    'biosphereProgress', 'legacyBioX', 'scoutCreatureId',
  ], 'ownership state contents');
  const catalogSpecies = sortedUnique(captured.catalogSpecies as readonly CatalogSpeciesV1[], CATALOG_ROWS, (row) => row.speciesId, 'catalogue species');
  const discoveries = sortedUnique(captured.discoveries as readonly DiscoveryRecordV1[], DISCOVERY_ROWS, (row) => row.recordId, 'discovery records');
  const creatures = sortedUnique(captured.creatures as readonly CreatureInstanceV1[], CREATURE_ROWS, (row) => row.creatureId, 'creature instances');
  const specimenLots = sortedUnique(captured.specimenLots as readonly SpecimenLotV1[], SPECIMEN_ROWS, (row) => row.lotId, 'specimen lots');
  const biosphereProgress = sortedUnique(captured.biosphereProgress as readonly BiosphereProgressV1[], BIOSPHERE_ROWS, (row) => row.worldKey, 'biosphere progress');
  const legacyBioX = sortedUnique(captured.legacyBioX as readonly LegacyBioXEvidenceV1[], LEGACY_BIOX_ROWS, (row) => (
    String(row.legacyPlanetSeed)
  ), 'legacy bioX evidence', MAX_LEGACY_BIOX_EVIDENCE_ROWS);
  const scoutCreatureId = captured.scoutCreatureId === null
    ? null : creatureId(canonicalizeData(captured.scoutCreatureId));
  if (mode === 'legacy-protected') {
    if (protection === null || catalogSpecies.length || discoveries.length || creatures.length
      || specimenLots.length || biosphereProgress.length || legacyBioX.length || scoutCreatureId !== null) {
      throw new TypeError('legacy-protected ownership must contain only exact source evidence');
    }
  } else if (protection !== null) throw new TypeError('current ownership cannot carry protection evidence');
  const state: OwnershipStateV1 = Object.freeze({
    schema: OWNERSHIP_STATE_SCHEMA, version: OWNERSHIP_STATE_VERSION, revision, mode,
    catalogSpecies, discoveries, creatures, specimenLots, biosphereProgress, legacyBioX,
    scoutCreatureId, legacyProtection: protection,
  });
  validateGlobalRowBound(state);
  validateRelationships(state);
  const mirror: OwnershipStateMirrorV1 = Object.freeze({
    schema: state.schema, version: state.version, revision: state.revision, mode: state.mode,
    catalogSpecies,
    discoveries: Object.freeze(discoveries.map(sourceMirror)),
    creatures,
    specimenLots,
    biosphereProgress: Object.freeze(biosphereProgress.map(progressMirror)),
    legacyBioX,
    scoutCreatureId,
    legacyProtection: protection,
  });
  const encoded = JSON.stringify(mirror);
  STATES.set(state, Object.freeze({ mirror, encoded, digest: sha256Hex(encoded), parentDigest }));
  return state;
}

export function createEmptyOwnershipStateV1(): OwnershipStateV1 {
  return buildState(0, 'current', {
    catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  }, null, null);
}

export function createInitialOwnershipStateV1(contents: OwnershipStateContentsV1): OwnershipStateV1 {
  return buildState(0, 'current', contents, null, null);
}

export function createLegacyProtectedOwnershipStateV1(
  evidence: LegacyOwnershipSourceEvidenceV1,
): OwnershipStateV1 {
  return buildState(0, 'legacy-protected', {
    catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  }, sourceEvidence(evidence), null);
}

function rowMap<T>(values: readonly T[], keyOf: (value: T) => string): Map<string, T> {
  return new Map(values.map((value) => [keyOf(value), value]));
}

function same(left: unknown, right: unknown): boolean { return JSON.stringify(left) === JSON.stringify(right); }

function catalogImmutable(row: CatalogSpeciesV1): unknown {
  return {
    speciesId: row.speciesId, genomeIdentity: row.genomeIdentity, kingdom: row.kingdom,
    genome: row.genome, firstObservationId: row.firstObservationId,
  };
}

function creatureImmutable(row: CreatureInstanceV1): unknown {
  return {
    creatureId: row.creatureId, speciesId: row.speciesId, genomeIdentity: row.genomeIdentity,
    genome: row.genome, origin: row.origin, acquisitionRecordId: row.acquisitionRecordId,
    lineage: row.lineage,
  };
}

function specimenImmutable(row: SpecimenLotV1): unknown {
  return {
    lotId: row.lotId, speciesId: row.speciesId, kind: row.kind,
    origin: row.origin, acquisitionRecordId: row.acquisitionRecordId,
  };
}

function validateCreatureHistory(prior: CreatureInstanceV1, current: CreatureInstanceV1): void {
  if (prior.xp !== null && (current.xp === null || current.xp < prior.xp)) {
    throw new TypeError('creature XP history rolled back');
  }
  if (prior.bond === null) return;
  if (current.bond === null
    || current.bond.level < prior.bond.level
    || current.bond.worldsSurvived < prior.bond.worldsSurvived
    || current.bond.guardianVictories < prior.bond.guardianVictories) {
    throw new TypeError('companion bond history rolled back');
  }
  const memories = new Map(current.bond.memories.map((memory) => [memory.id, memory]));
  for (let index = 0; index < prior.bond.memories.length; index++) {
    const memory = prior.bond.memories[index]!;
    if (!same(memory, memories.get(memory.id)) || !same(memory, current.bond.memories[index])) {
      throw new TypeError('companion memory history changed, moved, or disappeared');
    }
  }
  for (let index = 0; index < prior.bond.mementoIds.length; index++) {
    if (prior.bond.mementoIds[index] !== current.bond.mementoIds[index]) {
      throw new TypeError('companion memento history changed, moved, or disappeared');
    }
  }
}

function validateSuccessor(parent: OwnershipStateV1, next: OwnershipStateV1): void {
  if (parent.mode !== 'current' || next.mode !== 'current') throw new TypeError('protected ownership has no ordinary successor');
  const catalogs = rowMap(next.catalogSpecies, (row) => row.speciesId);
  for (const row of parent.catalogSpecies) {
    const current = catalogs.get(row.speciesId);
    if (!current || !same(catalogImmutable(row), catalogImmutable(current))) {
    throw new TypeError('catalogue first observation/identity is immutable');
    }
  }
  const discoveries = rowMap(next.discoveries, (row) => row.recordId);
  for (const row of parent.discoveries) if (!same(sourceMirror(row), discoveries.get(row.recordId) && sourceMirror(discoveries.get(row.recordId)!))) {
    throw new TypeError('discovery audit rows are immutable and cannot be removed');
  }
  const parentDiscoveryIds = new Set(parent.discoveries.map((row) => row.recordId));
  for (const row of next.discoveries) {
    if (!parentDiscoveryIds.has(row.recordId) && row.provenance.kind === 'legacy') {
      throw new TypeError('legacy discovery evidence cannot be added after initial migration');
    }
  }
  const creatures = rowMap(next.creatures, (row) => row.creatureId);
  for (const prior of parent.creatures) {
    const current = creatures.get(prior.creatureId);
    if (!current) throw new TypeError('creature rows cannot be removed without a future tombstone schema');
    if (!same(creatureImmutable(prior), creatureImmutable(current))) {
      throw new TypeError('creature immutable identity changed');
    }
    validateCreatureHistory(prior, current);
  }
  const parentCreatureIds = new Set(parent.creatures.map((row) => row.creatureId));
  for (const current of next.creatures) {
    if (!parentCreatureIds.has(current.creatureId)
      && parentDiscoveryIds.has(current.acquisitionRecordId)) {
      throw new TypeError('new creature ownership must settle with a new acquisition audit row');
    }
  }
  const specimens = rowMap(next.specimenLots, (row) => row.lotId);
  for (const prior of parent.specimenLots) {
    const current = specimens.get(prior.lotId);
    if (!current) throw new TypeError('specimen rows cannot be removed without a future tombstone schema');
    if (!same(specimenImmutable(prior), specimenImmutable(current)) || current.quantity > prior.quantity) {
      throw new TypeError('specimen lot identity changed or quantity increased');
    }
  }
  const parentSpecimenIds = new Set(parent.specimenLots.map((row) => row.lotId));
  for (const current of next.specimenLots) {
    if (!parentSpecimenIds.has(current.lotId)
      && parentDiscoveryIds.has(current.acquisitionRecordId)) {
      throw new TypeError('new specimen ownership must settle with a new acquisition audit row');
    }
  }
  const progress = rowMap(next.biosphereProgress, (row) => row.worldKey);
  for (const prior of parent.biosphereProgress) {
    const current = progress.get(prior.worldKey);
    if (!current || current.cycle < prior.cycle
      || (current.cycle === prior.cycle && current.used < prior.used)) {
      throw new TypeError('biosphere progress rolled back or disappeared');
    }
    if (current.cycle === prior.cycle) {
      const keys = new Set(current.successful.map((row) => `${row.speciesId}\u0000${row.source}`));
      if (prior.successful.some((row) => !keys.has(`${row.speciesId}\u0000${row.source}`))) {
        throw new TypeError('biosphere successful acquisition rolled back');
      }
    }
  }
  if (!same(parent.legacyBioX, next.legacyBioX)) throw new TypeError('legacy bioX evidence is immutable');
}

/** The later action planner supplies a complete next snapshot. This hook is
    deliberately planner-neutral, but it enforces revision +1 and all Arc 4
    immutable/monotonic ownership laws before registering the successor. */
export function createOwnershipSuccessorV1(
  parent: OwnershipStateV1,
  contents: OwnershipStateContentsV1,
): OwnershipStateV1 {
  const prior = STATES.get(parent);
  if (!prior) throw new TypeError('ownership parent must be registered');
  if (parent.revision === MAX_OWNERSHIP_REVISION) throw new RangeError('ownership revision is exhausted');
  const next = buildState(parent.revision + 1, 'current', contents, null, prior.digest);
  validateSuccessor(parent, next);
  return next;
}

export function isOwnershipStateV1(value: unknown): value is OwnershipStateV1 {
  return !!value && typeof value === 'object' && STATES.has(value);
}

export function isOwnershipSuccessorV1(next: unknown, parent: unknown): boolean {
  if (!next || typeof next !== 'object' || !parent || typeof parent !== 'object') return false;
  const child = STATES.get(next), prior = STATES.get(parent);
  return child !== undefined && prior !== undefined
    && child.parentDigest === prior.digest
    && (next as OwnershipStateV1).revision === (parent as OwnershipStateV1).revision + 1;
}

export function encodeOwnershipStateV1(state: OwnershipStateV1): string {
  const registeredState = STATES.get(state);
  if (!registeredState) throw new TypeError('only registered ownership state can be encoded');
  return registeredState.encoded;
}

export function ownershipStateDigestV1(state: OwnershipStateV1): string {
  const registeredState = STATES.get(state);
  if (!registeredState) throw new TypeError('only registered ownership state has a digest');
  return registeredState.digest;
}

export function ownershipStateMirrorV1(state: OwnershipStateV1): OwnershipStateMirrorV1 {
  const registeredState = STATES.get(state);
  if (!registeredState) throw new TypeError('only registered ownership state has a persistence mirror');
  return registeredState.mirror;
}

function addressMirrorFromJson(value: CanonicalJson): CanonicalCF1WorldAddressMirrorV1 {
  const source = record(value, 'world address mirror');
  exactKeys(source, ['format', 'key', 'galaxy', 'star', 'planet'], 'world address mirror');
  if (source.format !== 'CF1') throw new TypeError('world address format is invalid');
  /* CanonicalizeData already provides the hostile-shape boundary. The
     rebound helper below compares every nested mirror field against the
     runtime-proven result, independent of the injected resolver. */
  return source as unknown as CanonicalCF1WorldAddressMirrorV1;
}

function reboundWorldAddress(
  mirror: CanonicalCF1WorldAddressMirrorV1,
  resolver: OwnershipAddressResolver,
  label: string,
): CanonicalCF1WorldAddress {
  const address = resolver.resolveWorldAddress(mirror);
  if (!address || !isCanonicalCF1Address(address) || !('planet' in address)
    || canonicalJson(addressMirror(address)) !== canonicalJson(mirror)) {
    throw new TypeError(`${label} could not be rebound`);
  }
  return address;
}

function decodeDiscovery(value: CanonicalJson, resolver: OwnershipAddressResolver): DiscoveryRecordV1 {
  const source = record(value, 'discovery record');
  exactKeys(source, ['recordId', 'speciesId', 'acquisition', 'provenance', 'firstForSpecies'], 'discovery record');
  const provenance = record(source.provenance!, 'discovery provenance');
  if (provenance.kind === 'legacy') {
    exactKeys(provenance, ['kind', 'legacyCodexId', 'legacySourceIndex', 'from', 'canonicalWorldKey', 'canonicalWorldAddress', 'legacyLocation'], 'legacy provenance');
    if (source.acquisition !== 'legacy' || provenance.canonicalWorldKey !== null || provenance.canonicalWorldAddress !== null) {
      throw new TypeError('legacy provenance cannot claim current ownership');
    }
    let location: CanonicalJson | null = null;
    const rawLocation = provenance.legacyLocation;
    if (rawLocation === undefined) throw new TypeError('legacy location is missing');
    if (rawLocation !== null) {
      const legacyLocation = record(rawLocation, 'legacy location');
      exactKeys(legacyLocation, ['display'], 'legacy location');
      location = legacyLocation.display!;
    }
    return createLegacyDiscoveryRecordV1({
      recordId: discoveryId(source.recordId!), speciesId: speciesId(source.speciesId!),
      legacyCodexId: stringValue(provenance.legacyCodexId!, 'legacy codex id', 96),
      legacySourceIndex: integer(provenance.legacySourceIndex!, 'legacy source index', 1_499),
      from: typeof provenance.from === 'string' ? provenance.from : '',
      legacyLocation: location,
      firstForSpecies: source.firstForSpecies === true,
    });
  }
  if (provenance.kind === 'paragon') {
    if (source.acquisition !== 'paragon' || source.firstForSpecies !== true) {
      throw new TypeError('Paragon discovery semantics are invalid');
    }
    exactKeys(provenance, [
      'kind', 'paragonIndex', 'worldKey', 'worldAddress', 'receiptOrdinal',
    ], 'Paragon provenance');
    const mirror = addressMirrorFromJson(provenance.worldAddress!);
    const address = reboundWorldAddress(mirror, resolver, 'Paragon provenance');
    if (address.key !== provenance.worldKey) {
      throw new TypeError('Paragon provenance could not be rebound');
    }
    return createParagonDiscoveryRecordV1({
      recordId: discoveryId(source.recordId!),
      speciesId: speciesId(source.speciesId!),
      paragonIndex: integer(provenance.paragonIndex!, 'Paragon index', 49),
      worldAddress: address,
      receiptOrdinal: integer(
        provenance.receiptOrdinal!, 'Paragon receipt ordinal', 0xFFFF_FFFE,
      ),
    });
  }
  if (provenance.kind !== 'world' || (source.acquisition !== 'tame'
    && source.acquisition !== 'scavenge' && source.acquisition !== 'sample')) {
    throw new TypeError('world discovery is invalid');
  }
  exactKeys(provenance, ['kind', 'verb', 'worldKey', 'worldAddress', 'cycle', 'sourceOrdinal'], 'world provenance');
  if (provenance.verb !== source.acquisition) throw new TypeError('world acquisition verb mismatch');
  const mirror = addressMirrorFromJson(provenance.worldAddress!);
  const address = reboundWorldAddress(mirror, resolver, 'world provenance');
  if (address.key !== provenance.worldKey) throw new TypeError('world provenance could not be rebound');
  return createWorldDiscoveryRecordV1({
    recordId: discoveryId(source.recordId!), speciesId: speciesId(source.speciesId!),
    verb: source.acquisition, worldAddress: address,
    cycle: integer(provenance.cycle!, 'world discovery cycle'),
    sourceOrdinal: integer(provenance.sourceOrdinal!, 'world source ordinal', MAX_OWNERSHIP_ROWS),
    firstForSpecies: source.firstForSpecies === true,
  });
}

/** Register one detached persistence mirror after revalidating every row and
    rebinding every canonical address. Carrier owners use this after their own
    strict byte fixed point; callers that own one monolithic JSON string should
    prefer `decodeOwnershipStateV1`. */
export function registerOwnershipStateMirrorV1(
  value: unknown,
  resolver: OwnershipAddressResolver,
): OwnershipStateV1 {
  const source = record(canonicalizeData(value), 'ownership state');
  exactKeys(source, [
    'schema', 'version', 'revision', 'mode', 'catalogSpecies', 'discoveries', 'creatures',
    'specimenLots', 'biosphereProgress', 'legacyBioX', 'scoutCreatureId', 'legacyProtection',
  ], 'ownership state');
  if (source.schema !== OWNERSHIP_STATE_SCHEMA || source.version !== OWNERSHIP_STATE_VERSION) {
    throw new TypeError('ownership state version is unsupported');
  }
  const revision = integer(source.revision!, 'ownership revision');
  if (source.mode !== 'current' && source.mode !== 'legacy-protected') throw new TypeError('ownership mode is invalid');
  for (const key of ['catalogSpecies', 'discoveries', 'creatures', 'specimenLots', 'biosphereProgress', 'legacyBioX'] as const) {
    const maximum = key === 'legacyBioX' ? MAX_LEGACY_BIOX_EVIDENCE_ROWS : MAX_OWNERSHIP_ROWS;
    if (!Array.isArray(source[key]) || source[key].length > maximum) {
      throw new RangeError(`ownership ${key} rows are invalid`);
    }
  }
  const discoveryCandidates = source.discoveries as CanonicalJson[];
  const catalogCandidates = source.catalogSpecies as CanonicalJson[];
  const creatureCandidates = source.creatures as CanonicalJson[];
  const specimenCandidates = source.specimenLots as CanonicalJson[];
  const progressCandidates = source.biosphereProgress as CanonicalJson[];
  const legacyBioXCandidates = source.legacyBioX as CanonicalJson[];
  const discoveries = discoveryCandidates.map((row) => decodeDiscovery(row, resolver));
  const catalogSpecies = catalogCandidates.map((candidate): CatalogSpeciesV1 => {
    const row = record(candidate, 'catalogue species');
    exactKeys(row, ['speciesId', 'genomeIdentity', 'kingdom', 'genome', 'alias', 'firstObservationId'], 'catalogue species');
    const identity = canonicalGenomeIdentityV1(row.genome);
    if (identity.speciesId !== row.speciesId || identity.genomeIdentity !== row.genomeIdentity || identity.kingdom !== row.kingdom) {
      throw new TypeError('catalogue genome identity mismatch');
    }
    return createCatalogSpeciesV1({
      identity, alias: nullableString(row.alias!, 'catalogue alias', 24),
      firstObservationId: discoveryId(row.firstObservationId!),
    });
  });
  const creatures = creatureCandidates.map((candidate) => {
    const row = record(candidate, 'creature instance');
    return createCreatureInstanceV1(row as unknown as Parameters<typeof createCreatureInstanceV1>[0]);
  });
  const specimenLots = specimenCandidates.map((candidate) => (
    createSpecimenLotV1(record(candidate, 'specimen lot') as unknown as SpecimenLotV1)
  ));
  const biosphereProgress = progressCandidates.map((candidate): BiosphereProgressV1 => {
    const row = record(candidate, 'biosphere progress');
    exactKeys(row, ['worldKey', 'worldAddress', 'cycle', 'used', 'successful'], 'biosphere progress');
    const mirror = addressMirrorFromJson(row.worldAddress!);
    const address = reboundWorldAddress(mirror, resolver, 'biosphere world');
    if (address.key !== row.worldKey) throw new TypeError('biosphere world could not be rebound');
    return createBiosphereProgressV1({
      worldAddress: address,
      cycle: integer(row.cycle!, 'biosphere cycle'), used: integer(row.used!, 'biosphere used', MAX_BIOSPHERE_USED),
      successful: row.successful as unknown as readonly BiosphereSuccessV1[],
    });
  });
  const legacyBioX = legacyBioXCandidates.map((candidate) => (
    createLegacyBioXEvidenceV1(record(candidate, 'legacy bioX') as unknown as LegacyBioXEvidenceV1)
  ));
  const scoutCreatureId = source.scoutCreatureId === null ? null : creatureId(source.scoutCreatureId!);
  const protection = source.legacyProtection === null ? null : sourceEvidence(source.legacyProtection);
  const state = buildState(revision, source.mode, {
    catalogSpecies, discoveries, creatures, specimenLots, biosphereProgress, legacyBioX, scoutCreatureId,
  }, protection, null);
  return state;
}

/** Decode one strict canonical state fixed point and rebind every canonical
    address through the supplied F2 resolver. */
export function decodeOwnershipStateV1(
  raw: string,
  resolver: OwnershipAddressResolver,
): OwnershipStateV1 {
  if (typeof raw !== 'string' || raw.length > 16_000_000) throw new RangeError('ownership state JSON is too large');
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; } catch { throw new TypeError('ownership state JSON is invalid'); }
  const state = registerOwnershipStateMirrorV1(parsed, resolver);
  if (encodeOwnershipStateV1(state) !== raw) throw new TypeError('ownership state is not its canonical fixed point');
  return state;
}
