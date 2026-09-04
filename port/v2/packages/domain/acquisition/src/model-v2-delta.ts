/* Internal compact Arc 5 ownership delta.

   Arc 4 remains the exact source of immutable catalogue, acquisition,
   creature, and specimen identity. This codec stores only V2-exclusive rows
   and mutable source-row overrides. Persistence owns manifest revisions,
   digests, and fixed sharding; the domain owns canonical logical rows and
   reconstruction against one exact registered Arc 4 source. */
import {
  MAX_OWNERSHIP_REVISION,
  MAX_OWNERSHIP_ROWS,
  isOwnershipStateV1,
  type CreatureAssignmentV1,
  type CompanionBondV1,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type DiscoveryRecordId,
  type OwnershipStateV1,
  type SpeciesId,
  type SpecimenLotId,
  type SpecimenLotV1,
} from './model.js';
import {
  canonicalJson,
  canonicalizeData,
  sha256Hex,
  type CanonicalJson,
} from './canonical.js';
import {
  createBredAcquisitionRecordV2,
  createCreatureInstanceV2,
  createCreatureTombstoneV2,
  createF4ReceiptEvidenceV2,
  createSpecimenLotV2,
  createSpecimenTombstoneV2,
  isOwnershipStateV2,
  isOwnershipSuccessorV2,
  ownershipSourceStateV1,
  registerOwnershipStateRowsMirrorV2,
  type BredAcquisitionRecordV2,
  type CreatureTombstoneV2,
  type F4ReceiptEvidenceV2,
  type OwnershipStateV2,
  type SpecimenTombstoneV2,
} from './model-v2.js';

export const OWNERSHIP_DELTA_SCHEMA_V2 = 'cf-v2-ownership-delta/v1' as const;
export const OWNERSHIP_DELTA_VERSION_V2 = 1 as const;
export const MAX_OWNERSHIP_DELTA_ROWS_V2 = MAX_OWNERSHIP_ROWS;

export interface BredAcquisitionDeltaRowV2 {
  readonly kind: 'bred-acquisition';
  readonly acquisition: BredAcquisitionRecordV2;
}

interface SourceCreatureMutableFieldsV2 {
  readonly nickname: string | null;
  readonly xp: number | null;
  readonly hurt: number | null;
  readonly fed: number | null;
  readonly brood: number | null;
  readonly assignment: CreatureAssignmentV1 | null;
  readonly bond: CompanionBondV1 | null;
}

export interface SourceCreatureLiveDeltaRowV2 extends SourceCreatureMutableFieldsV2 {
  readonly kind: 'source-creature-live';
  readonly creatureId: CreatureInstanceId;
}

export interface SourceCreatureTombstoneDeltaRowV2 extends SourceCreatureMutableFieldsV2 {
  readonly kind: 'source-creature-tombstone';
  readonly creatureId: CreatureInstanceId;
  readonly disposition: F4ReceiptEvidenceV2;
}

export interface BredCreatureLiveDeltaRowV2 {
  readonly kind: 'bred-creature-live';
  readonly creature: CreatureInstanceV1;
}

export interface BredCreatureTombstoneDeltaRowV2 {
  readonly kind: 'bred-creature-tombstone';
  readonly tombstone: CreatureTombstoneV2;
}

export interface SourceSpecimenLiveDeltaRowV2 {
  readonly kind: 'source-specimen-live';
  readonly lotId: SpecimenLotId;
  readonly quantity: number;
}

export interface SourceSpecimenTombstoneDeltaRowV2 {
  readonly kind: 'source-specimen-tombstone';
  readonly lotId: SpecimenLotId;
  readonly quantity: number;
  readonly disposition: F4ReceiptEvidenceV2;
}

export interface ScoutOverrideDeltaRowV2 {
  readonly kind: 'scout-override';
  /** Row absence means inherit the exact Arc 4 source value. */
  readonly scoutCreatureId: CreatureInstanceId | null;
}

export type OwnershipDeltaRowV2 =
  | BredAcquisitionDeltaRowV2
  | SourceCreatureLiveDeltaRowV2
  | SourceCreatureTombstoneDeltaRowV2
  | BredCreatureLiveDeltaRowV2
  | BredCreatureTombstoneDeltaRowV2
  | SourceSpecimenLiveDeltaRowV2
  | SourceSpecimenTombstoneDeltaRowV2
  | ScoutOverrideDeltaRowV2;

export interface OwnershipDeltaMirrorV2 {
  readonly schema: typeof OWNERSHIP_DELTA_SCHEMA_V2;
  readonly version: typeof OWNERSHIP_DELTA_VERSION_V2;
  readonly rows: readonly OwnershipDeltaRowV2[];
}

/** Registered canonical delta data. It is data authority only when retained
 * by this module's private registration. */
export interface OwnershipDeltaV2 extends OwnershipDeltaMirrorV2 {}

export const EMPTY_OWNERSHIP_DELTA_JSON_V2 =
  '{"rows":[],"schema":"cf-v2-ownership-delta/v1","version":1}' as const;

const ROW_KIND_RANK = Object.freeze({
  'bred-acquisition': 0,
  'source-creature-live': 1,
  'source-creature-tombstone': 2,
  'bred-creature-live': 3,
  'bred-creature-tombstone': 4,
  'source-specimen-live': 5,
  'source-specimen-tombstone': 6,
  'scout-override': 7,
} as const);

interface DeltaRegistration {
  readonly mirror: OwnershipDeltaMirrorV2;
  readonly encoded: string;
  readonly digest: string;
}

const DELTAS = new WeakMap<object, DeltaRegistration>();

function record(value: CanonicalJson, label: string): Readonly<Record<string, CanonicalJson>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Readonly<Record<string, CanonicalJson>>;
}

function exactKeys(
  value: Readonly<Record<string, CanonicalJson>>,
  keys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function checkedCreatureId(value: CanonicalJson): CreatureInstanceId {
  if (typeof value !== 'string' || !/^creature-v1:[0-9a-f]{64}$/u.test(value)) {
    throw new TypeError('ownership delta creature ID is malformed');
  }
  return value as CreatureInstanceId;
}

function checkedSpecimenId(value: CanonicalJson): SpecimenLotId {
  if (typeof value !== 'string' || !/^specimen-v1:[0-9a-f]{64}$/u.test(value)) {
    throw new TypeError('ownership delta specimen ID is malformed');
  }
  return value as SpecimenLotId;
}

function checkedDiscoveryId(value: CanonicalJson): DiscoveryRecordId {
  if (typeof value !== 'string' || !/^discovery-v1:[0-9a-f]{64}$/u.test(value)) {
    throw new TypeError('ownership delta acquisition ID is malformed');
  }
  return value as DiscoveryRecordId;
}

function checkedSpeciesId(value: CanonicalJson): SpeciesId {
  if (typeof value !== 'string' || !/^species-v1:[0-9a-f]{64}$/u.test(value)) {
    throw new TypeError('ownership delta species ID is malformed');
  }
  return value as SpeciesId;
}

function checkedRevision(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_OWNERSHIP_REVISION) {
    throw new RangeError('ownership delta target revision is invalid');
  }
  return value;
}

function checkedNullableString(value: CanonicalJson, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > 24 || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} must be a bounded nullable string`);
  }
  return value;
}

function checkedNullableNumber(
  value: CanonicalJson,
  label: string,
  maximum: number,
): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum) {
    throw new RangeError(`${label} is outside its bounded nullable range`);
  }
  return value;
}

function checkedQuantity(value: CanonicalJson): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)
    || value < 1 || value > 1_000_000_000) {
    throw new RangeError('ownership delta specimen quantity is invalid');
  }
  return value;
}

function checkedNullableRecord(
  value: CanonicalJson,
  label: string,
): CanonicalJson {
  if (value === null) return null;
  return record(value, label) as CanonicalJson;
}

function decodeReceipt(value: CanonicalJson, label: string): F4ReceiptEvidenceV2 {
  return createF4ReceiptEvidenceV2(
    record(value, label) as unknown as F4ReceiptEvidenceV2,
  );
}

function decodeBredAcquisition(value: CanonicalJson): BredAcquisitionRecordV2 {
  const source = record(value, 'ownership delta bred acquisition');
  exactKeys(source, [
    'recordId', 'speciesId', 'acquisition', 'provenance', 'firstForSpecies',
  ], 'ownership delta bred acquisition');
  if (source.acquisition !== 'breed' || source.firstForSpecies !== false) {
    throw new TypeError('ownership delta bred acquisition semantics are invalid');
  }
  const provenance = record(source.provenance!, 'ownership delta bred provenance');
  exactKeys(provenance, [
    'kind', 'parentCreatureIds', 'parentSeeds', 'receipt',
  ], 'ownership delta bred provenance');
  if (provenance.kind !== 'bred'
    || !Array.isArray(provenance.parentCreatureIds)
    || provenance.parentCreatureIds.length !== 2
    || !Array.isArray(provenance.parentSeeds)
    || provenance.parentSeeds.length !== 2) {
    throw new TypeError('ownership delta bred provenance is invalid');
  }
  const acquisition = createBredAcquisitionRecordV2({
    speciesId: checkedSpeciesId(source.speciesId!),
    parentCreatureIds: [
      checkedCreatureId(provenance.parentCreatureIds[0]!),
      checkedCreatureId(provenance.parentCreatureIds[1]!),
    ],
    parentSeeds: provenance.parentSeeds as unknown as readonly [number, number],
    receipt: decodeReceipt(provenance.receipt!, 'ownership delta bred receipt'),
  });
  if (acquisition.recordId !== checkedDiscoveryId(source.recordId!)) {
    throw new TypeError('ownership delta bred acquisition is not receipt-bound');
  }
  return acquisition;
}

function decodeCreature(value: CanonicalJson, label: string): CreatureInstanceV1 {
  return createCreatureInstanceV2(
    record(value, label) as unknown as CreatureInstanceV1,
  );
}

function decodeCreatureTombstone(value: CanonicalJson): CreatureTombstoneV2 {
  const source = record(value, 'ownership delta bred creature tombstone');
  exactKeys(source, [
    'kind', 'creatureId', 'snapshot', 'disposition',
  ], 'ownership delta bred creature tombstone');
  if (source.kind !== 'creature') {
    throw new TypeError('ownership delta creature tombstone kind is invalid');
  }
  const tombstone = createCreatureTombstoneV2(
    decodeCreature(source.snapshot!, 'ownership delta creature tombstone snapshot'),
    decodeReceipt(source.disposition!, 'ownership delta creature disposition'),
  );
  if (tombstone.creatureId !== checkedCreatureId(source.creatureId!)) {
    throw new TypeError('ownership delta creature tombstone identity mismatches');
  }
  return tombstone;
}

function sourceCreatureFields(
  source: Readonly<Record<string, CanonicalJson>>,
): SourceCreatureMutableFieldsV2 {
  return Object.freeze({
    nickname: checkedNullableString(source.nickname!, 'ownership delta creature nickname'),
    xp: checkedNullableNumber(source.xp!, 'ownership delta creature XP', 486),
    hurt: checkedNullableNumber(source.hurt!, 'ownership delta creature hurt', 1),
    fed: checkedNullableNumber(source.fed!, 'ownership delta creature fed', 200),
    brood: checkedNullableNumber(source.brood!, 'ownership delta creature brood', 200),
    assignment: checkedNullableRecord(
      source.assignment!, 'ownership delta creature assignment',
    ) as unknown as CreatureAssignmentV1 | null,
    bond: checkedNullableRecord(
      source.bond!, 'ownership delta creature bond',
    ) as unknown as CompanionBondV1 | null,
  });
}

function decodeRow(value: CanonicalJson): OwnershipDeltaRowV2 {
  const source = record(value, 'ownership delta row');
  const kind = source.kind;
  if (kind === 'bred-acquisition') {
    exactKeys(source, ['kind', 'acquisition'], 'bred acquisition delta row');
    return Object.freeze({ kind, acquisition: decodeBredAcquisition(source.acquisition!) });
  }
  if (kind === 'source-creature-live' || kind === 'source-creature-tombstone') {
    const fields = [
      'kind', 'creatureId', 'nickname', 'xp', 'hurt', 'fed', 'brood',
      'assignment', 'bond',
    ];
    exactKeys(
      source,
      kind === 'source-creature-tombstone' ? [...fields, 'disposition'] : fields,
      `${kind} delta row`,
    );
    const mutable = sourceCreatureFields(source);
    if (kind === 'source-creature-live') {
      return Object.freeze({
        kind,
        creatureId: checkedCreatureId(source.creatureId!),
        ...mutable,
      });
    }
    return Object.freeze({
      kind,
      creatureId: checkedCreatureId(source.creatureId!),
      ...mutable,
      disposition: decodeReceipt(
        source.disposition!, 'ownership delta source creature disposition',
      ),
    });
  }
  if (kind === 'bred-creature-live') {
    exactKeys(source, ['kind', 'creature'], 'bred creature live delta row');
    return Object.freeze({
      kind,
      creature: decodeCreature(source.creature!, 'ownership delta bred creature'),
    });
  }
  if (kind === 'bred-creature-tombstone') {
    exactKeys(source, ['kind', 'tombstone'], 'bred creature tombstone delta row');
    return Object.freeze({ kind, tombstone: decodeCreatureTombstone(source.tombstone!) });
  }
  if (kind === 'source-specimen-live' || kind === 'source-specimen-tombstone') {
    exactKeys(
      source,
      kind === 'source-specimen-tombstone'
        ? ['kind', 'lotId', 'quantity', 'disposition']
        : ['kind', 'lotId', 'quantity'],
      `${kind} delta row`,
    );
    if (kind === 'source-specimen-live') {
      return Object.freeze({
        kind,
        lotId: checkedSpecimenId(source.lotId!),
        quantity: checkedQuantity(source.quantity!),
      });
    }
    return Object.freeze({
      kind,
      lotId: checkedSpecimenId(source.lotId!),
      quantity: checkedQuantity(source.quantity!),
      disposition: decodeReceipt(
        source.disposition!, 'ownership delta source specimen disposition',
      ),
    });
  }
  if (kind === 'scout-override') {
    exactKeys(source, ['kind', 'scoutCreatureId'], 'scout override delta row');
    return Object.freeze({
      kind,
      scoutCreatureId: source.scoutCreatureId === null
        ? null : checkedCreatureId(source.scoutCreatureId!),
    });
  }
  throw new TypeError('ownership delta row kind is unsupported');
}

function rowIntrinsicId(row: OwnershipDeltaRowV2): string {
  switch (row.kind) {
    case 'bred-acquisition': return row.acquisition.recordId;
    case 'source-creature-live':
    case 'source-creature-tombstone': return row.creatureId;
    case 'bred-creature-live': return row.creature.creatureId;
    case 'bred-creature-tombstone': return row.tombstone.creatureId;
    case 'source-specimen-live':
    case 'source-specimen-tombstone': return row.lotId;
    case 'scout-override': return '';
  }
}

function compareRows(left: OwnershipDeltaRowV2, right: OwnershipDeltaRowV2): number {
  const rank = ROW_KIND_RANK[left.kind] - ROW_KIND_RANK[right.kind];
  if (rank !== 0) return rank;
  const a = rowIntrinsicId(left), b = rowIntrinsicId(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

function validateRowOrderAndIdentity(rows: readonly OwnershipDeltaRowV2[]): void {
  const acquisitions = new Set<DiscoveryRecordId>();
  const creatures = new Set<CreatureInstanceId>();
  const specimens = new Set<SpecimenLotId>();
  let scout = false;
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!;
    if (index > 0 && compareRows(rows[index - 1]!, row) >= 0) {
      throw new TypeError('ownership delta rows are not in strict canonical order');
    }
    switch (row.kind) {
      case 'bred-acquisition':
        if (acquisitions.has(row.acquisition.recordId)) {
          throw new TypeError('ownership delta repeats a bred acquisition');
        }
        acquisitions.add(row.acquisition.recordId);
        break;
      case 'source-creature-live':
      case 'source-creature-tombstone':
      case 'bred-creature-live':
      case 'bred-creature-tombstone': {
        const id = row.kind === 'source-creature-live' || row.kind === 'source-creature-tombstone'
          ? row.creatureId
          : row.kind === 'bred-creature-live'
            ? row.creature.creatureId : row.tombstone.creatureId;
        if (creatures.has(id)) {
          throw new TypeError('ownership delta creature identity conflicts across live/tombstone rows');
        }
        creatures.add(id);
        break;
      }
      case 'source-specimen-live':
      case 'source-specimen-tombstone':
        if (specimens.has(row.lotId)) {
          throw new TypeError('ownership delta specimen identity conflicts across live/tombstone rows');
        }
        specimens.add(row.lotId);
        break;
      case 'scout-override':
        if (scout) throw new TypeError('ownership delta repeats its scout override');
        scout = true;
        break;
    }
  }
}

function registerDeltaMirror(value: unknown): OwnershipDeltaV2 {
  const source = record(canonicalizeData(value), 'ownership delta');
  exactKeys(source, ['schema', 'version', 'rows'], 'ownership delta');
  if (source.schema !== OWNERSHIP_DELTA_SCHEMA_V2
    || source.version !== OWNERSHIP_DELTA_VERSION_V2) {
    throw new TypeError('ownership delta version is unsupported');
  }
  if (!Array.isArray(source.rows) || source.rows.length > MAX_OWNERSHIP_DELTA_ROWS_V2) {
    throw new RangeError('ownership delta row bound is invalid');
  }
  const rows = Object.freeze(source.rows.map(decodeRow));
  validateRowOrderAndIdentity(rows);
  const delta: OwnershipDeltaV2 = Object.freeze({
    schema: OWNERSHIP_DELTA_SCHEMA_V2,
    version: OWNERSHIP_DELTA_VERSION_V2,
    rows,
  });
  const encoded = canonicalJson(delta);
  DELTAS.set(delta, Object.freeze({
    mirror: delta,
    encoded,
    digest: sha256Hex(encoded),
  }));
  return delta;
}

function creatureMutable(row: CreatureInstanceV1): SourceCreatureMutableFieldsV2 {
  return Object.freeze({
    nickname: row.nickname,
    xp: row.xp,
    hurt: row.hurt,
    fed: row.fed,
    brood: row.brood,
    assignment: row.assignment,
    bond: row.bond,
  });
}

function sourceCreatureRow(
  kind: 'source-creature-live' | 'source-creature-tombstone',
  creature: CreatureInstanceV1,
  disposition?: F4ReceiptEvidenceV2,
): SourceCreatureLiveDeltaRowV2 | SourceCreatureTombstoneDeltaRowV2 {
  const mutable = creatureMutable(creature);
  return kind === 'source-creature-live'
    ? Object.freeze({ kind, creatureId: creature.creatureId, ...mutable })
    : Object.freeze({
      kind,
      creatureId: creature.creatureId,
      ...mutable,
      disposition: disposition!,
    });
}

export function deriveOwnershipDeltaV2(
  source: OwnershipStateV1,
  target: OwnershipStateV2,
): OwnershipDeltaV2 {
  if (!isOwnershipStateV1(source)) {
    throw new TypeError('ownership delta source must be registered');
  }
  if (!isOwnershipStateV2(target)) {
    throw new TypeError('ownership delta target must be registered');
  }
  if (ownershipSourceStateV1(target) !== source) {
    throw new TypeError('ownership delta target must retain the exact registered Arc 4 source');
  }
  if (target.revision < source.revision) {
    throw new RangeError('ownership delta target revision precedes its source');
  }

  const rows: OwnershipDeltaRowV2[] = [];
  for (const acquisition of target.bredAcquisitions) {
    rows.push(Object.freeze({ kind: 'bred-acquisition', acquisition }));
  }
  const sourceCreatures = new Map(source.creatures.map((row) => [row.creatureId, row]));
  for (const creature of target.creatures) {
    const prior = sourceCreatures.get(creature.creatureId);
    if (prior !== undefined) {
      if (canonicalJson(creatureMutable(creature)) !== canonicalJson(creatureMutable(prior))) {
        rows.push(sourceCreatureRow('source-creature-live', creature));
      }
    } else {
      rows.push(Object.freeze({ kind: 'bred-creature-live', creature }));
    }
  }
  for (const tombstone of target.creatureTombstones) {
    rows.push(sourceCreatures.has(tombstone.creatureId)
      ? sourceCreatureRow(
        'source-creature-tombstone', tombstone.snapshot, tombstone.disposition,
      )
      : Object.freeze({ kind: 'bred-creature-tombstone', tombstone }));
  }

  const sourceSpecimens = new Map(source.specimenLots.map((row) => [row.lotId, row]));
  for (const specimen of target.specimenLots) {
    const prior = sourceSpecimens.get(specimen.lotId);
    if (prior === undefined) {
      throw new TypeError('ownership delta cannot store a specimen absent from Arc 4 source');
    }
    if (specimen.quantity !== prior.quantity) {
      rows.push(Object.freeze({
        kind: 'source-specimen-live', lotId: specimen.lotId, quantity: specimen.quantity,
      }));
    }
  }
  for (const tombstone of target.specimenTombstones) {
    if (!sourceSpecimens.has(tombstone.lotId)) {
      throw new TypeError('ownership delta specimen tombstone lacks Arc 4 source identity');
    }
    rows.push(Object.freeze({
      kind: 'source-specimen-tombstone',
      lotId: tombstone.lotId,
      quantity: tombstone.snapshot.quantity,
      disposition: tombstone.disposition,
    }));
  }
  if (target.scoutCreatureId !== source.scoutCreatureId) {
    rows.push(Object.freeze({
      kind: 'scout-override', scoutCreatureId: target.scoutCreatureId,
    }));
  }
  rows.sort(compareRows);
  return registerDeltaMirror({
    schema: OWNERSHIP_DELTA_SCHEMA_V2,
    version: OWNERSHIP_DELTA_VERSION_V2,
    rows,
  });
}

/** Project only an exact registered +1 child. This is the persistence-facing
 * hook that prevents an arbitrary registered V2 target from masquerading as
 * the successor of a loaded parent. */
export function deriveOwnershipDeltaSuccessorV2(
  parent: OwnershipStateV2,
  target: OwnershipStateV2,
): OwnershipDeltaV2 {
  if (!isOwnershipSuccessorV2(target, parent)) {
    throw new TypeError('ownership delta successor must be the exact registered V2 +1 child');
  }
  return deriveOwnershipDeltaV2(ownershipSourceStateV1(target), target);
}

export function ownershipDeltaMirrorV2(delta: OwnershipDeltaV2): OwnershipDeltaMirrorV2 {
  const registered = DELTAS.get(delta);
  if (!registered) throw new TypeError('only registered ownership delta has a mirror');
  return registered.mirror;
}

export function encodeOwnershipDeltaV2(delta: OwnershipDeltaV2): string {
  const registered = DELTAS.get(delta);
  if (!registered) throw new TypeError('only registered ownership delta can be encoded');
  return registered.encoded;
}

export function ownershipDeltaDigestV2(delta: OwnershipDeltaV2): string {
  const registered = DELTAS.get(delta);
  if (!registered) throw new TypeError('only registered ownership delta has a digest');
  return registered.digest;
}

export function decodeOwnershipDeltaV2(raw: string): OwnershipDeltaV2 {
  if (typeof raw !== 'string' || raw.length > 4_000_000) {
    throw new RangeError('ownership delta JSON is too large');
  }
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; }
  catch { throw new TypeError('ownership delta JSON is invalid'); }
  const delta = registerDeltaMirror(parsed);
  if (encodeOwnershipDeltaV2(delta) !== raw) {
    throw new TypeError('ownership delta is not its canonical fixed point');
  }
  return delta;
}

function mutableCreatureFromSource(
  source: CreatureInstanceV1,
  row: SourceCreatureLiveDeltaRowV2 | SourceCreatureTombstoneDeltaRowV2,
): CreatureInstanceV1 {
  return createCreatureInstanceV2({
    ...source,
    nickname: row.nickname,
    xp: row.xp,
    hurt: row.hurt,
    fed: row.fed,
    brood: row.brood,
    assignment: row.assignment,
    bond: row.bond,
  });
}

function specimenFromSource(
  source: SpecimenLotV1,
  quantity: number,
): SpecimenLotV1 {
  return createSpecimenLotV2({ ...source, quantity });
}

export function applyOwnershipDeltaV2(
  source: OwnershipStateV1,
  targetRevision: number,
  delta: OwnershipDeltaV2,
): OwnershipStateV2 {
  if (!isOwnershipStateV1(source)) {
    throw new TypeError('ownership delta application source must be registered');
  }
  const registered = DELTAS.get(delta);
  if (!registered) throw new TypeError('ownership delta application requires registered delta');
  const revision = checkedRevision(targetRevision);
  if (revision < source.revision) {
    throw new RangeError('ownership delta target revision precedes its exact source');
  }

  const acquisitions: BredAcquisitionRecordV2[] = [];
  const sourceCreatureLive = new Map<CreatureInstanceId, SourceCreatureLiveDeltaRowV2>();
  const sourceCreatureDead = new Map<CreatureInstanceId, SourceCreatureTombstoneDeltaRowV2>();
  const bredCreatureLive: CreatureInstanceV1[] = [];
  const bredCreatureDead: CreatureTombstoneV2[] = [];
  const sourceSpecimenLive = new Map<SpecimenLotId, SourceSpecimenLiveDeltaRowV2>();
  const sourceSpecimenDead = new Map<SpecimenLotId, SourceSpecimenTombstoneDeltaRowV2>();
  let scoutOverride: ScoutOverrideDeltaRowV2 | null = null;
  for (const row of registered.mirror.rows) {
    switch (row.kind) {
      case 'bred-acquisition': acquisitions.push(row.acquisition); break;
      case 'source-creature-live': sourceCreatureLive.set(row.creatureId, row); break;
      case 'source-creature-tombstone': sourceCreatureDead.set(row.creatureId, row); break;
      case 'bred-creature-live': bredCreatureLive.push(row.creature); break;
      case 'bred-creature-tombstone': bredCreatureDead.push(row.tombstone); break;
      case 'source-specimen-live': sourceSpecimenLive.set(row.lotId, row); break;
      case 'source-specimen-tombstone': sourceSpecimenDead.set(row.lotId, row); break;
      case 'scout-override': scoutOverride = row; break;
    }
  }

  const sourceCreatureById = new Map(source.creatures.map((row) => [row.creatureId, row]));
  for (const id of [...sourceCreatureLive.keys(), ...sourceCreatureDead.keys()]) {
    if (!sourceCreatureById.has(id)) {
      throw new TypeError('ownership delta source creature row lacks exact Arc 4 identity');
    }
  }
  const bredAcquisitionIds = new Set(acquisitions.map((row) => row.recordId));
  const backedAcquisitions = new Set<DiscoveryRecordId>();
  for (const creature of bredCreatureLive) {
    if (sourceCreatureById.has(creature.creatureId) || creature.origin !== 'bred'
      || !bredAcquisitionIds.has(creature.acquisitionRecordId)) {
      throw new TypeError('ownership delta bred live creature lacks exact bred acquisition backing');
    }
    backedAcquisitions.add(creature.acquisitionRecordId);
  }
  for (const tombstone of bredCreatureDead) {
    const creature = tombstone.snapshot;
    if (sourceCreatureById.has(creature.creatureId) || creature.origin !== 'bred'
      || !bredAcquisitionIds.has(creature.acquisitionRecordId)) {
      throw new TypeError('ownership delta bred tombstone lacks exact bred acquisition backing');
    }
    backedAcquisitions.add(creature.acquisitionRecordId);
  }
  if (backedAcquisitions.size !== acquisitions.length
    || acquisitions.some((row) => !backedAcquisitions.has(row.recordId))) {
    throw new TypeError('each ownership delta bred acquisition requires exactly one backed child');
  }

  const creatures: CreatureInstanceV1[] = [];
  const creatureTombstones: CreatureTombstoneV2[] = [];
  for (const prior of source.creatures) {
    const dead = sourceCreatureDead.get(prior.creatureId);
    if (dead !== undefined) {
      creatureTombstones.push(createCreatureTombstoneV2(
        mutableCreatureFromSource(prior, dead), dead.disposition,
      ));
      continue;
    }
    const live = sourceCreatureLive.get(prior.creatureId);
    if (live !== undefined) {
      const changed = mutableCreatureFromSource(prior, live);
      if (canonicalJson(creatureMutable(changed)) === canonicalJson(creatureMutable(prior))) {
        throw new TypeError('ownership delta stores an unchanged Arc 4 creature projection');
      }
      creatures.push(changed);
    } else creatures.push(createCreatureInstanceV2(prior));
  }
  creatures.push(...bredCreatureLive);
  creatureTombstones.push(...bredCreatureDead);

  const sourceSpecimenById = new Map(source.specimenLots.map((row) => [row.lotId, row]));
  for (const id of [...sourceSpecimenLive.keys(), ...sourceSpecimenDead.keys()]) {
    if (!sourceSpecimenById.has(id)) {
      throw new TypeError('ownership delta source specimen row lacks exact Arc 4 identity');
    }
  }
  const specimenLots: SpecimenLotV1[] = [];
  const specimenTombstones: SpecimenTombstoneV2[] = [];
  for (const prior of source.specimenLots) {
    const dead = sourceSpecimenDead.get(prior.lotId);
    if (dead !== undefined) {
      specimenTombstones.push(createSpecimenTombstoneV2(
        specimenFromSource(prior, dead.quantity), dead.disposition,
      ));
      continue;
    }
    const live = sourceSpecimenLive.get(prior.lotId);
    if (live !== undefined) {
      if (live.quantity === prior.quantity) {
        throw new TypeError('ownership delta stores an unchanged Arc 4 specimen projection');
      }
      specimenLots.push(specimenFromSource(prior, live.quantity));
    } else specimenLots.push(createSpecimenLotV2(prior));
  }

  const scoutCreatureId = scoutOverride === null
    ? source.scoutCreatureId : scoutOverride.scoutCreatureId;
  if (scoutOverride !== null && scoutCreatureId === source.scoutCreatureId) {
    throw new TypeError('ownership delta stores an unchanged Arc 4 scout projection');
  }
  const target = registerOwnershipStateRowsMirrorV2(source, {
    revision,
    bredAcquisitions: acquisitions,
    creatures,
    creatureTombstones,
    specimenLots,
    specimenTombstones,
    scoutCreatureId,
  });
  const fixed = deriveOwnershipDeltaV2(source, target);
  if (encodeOwnershipDeltaV2(fixed) !== registered.encoded) {
    throw new TypeError('ownership delta reconstruction is not its exact projection fixed point');
  }
  return target;
}

if (canonicalJson({
  schema: OWNERSHIP_DELTA_SCHEMA_V2,
  version: OWNERSHIP_DELTA_VERSION_V2,
  rows: [],
}) !== EMPTY_OWNERSHIP_DELTA_JSON_V2) {
  throw new Error('empty ownership delta canonical bytes drifted');
}
