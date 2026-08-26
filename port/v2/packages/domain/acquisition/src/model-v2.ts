/* Arc 5 ownership V2 foundation.

   Arc 4's registered V1 state remains the immutable discovery/capture source.
   V2 adds living-individual lineage, portable breeding evidence, and explicit
   creature/specimen tombstones without making any breeding, care, timing, or
   capacity decision. A genome identifies biology; it never identifies an
   owned individual. */
import {
  MAX_OWNERSHIP_REVISION,
  MAX_OWNERSHIP_ROWS,
  canonicalGenomeIdentityV1,
  createCreatureInstanceV1,
  createOwnershipSuccessorV1,
  createSpecimenLotV1,
  isOwnershipStateV1,
  isOwnershipSuccessorV1,
  ownershipContentId,
  ownershipStateDigestV1,
  ownershipStateMirrorV1,
  registerOwnershipStateMirrorV1,
  type BiosphereProgressV1,
  type CatalogSpeciesV1,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type DiscoveryRecordId,
  type DiscoveryRecordV1,
  type LegacyBioXEvidenceV1,
  type LegacyOwnershipSourceEvidenceV1,
  type OwnershipAddressResolver,
  type OwnershipStateContentsV1,
  type OwnershipStateMirrorV1,
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

export const OWNERSHIP_STATE_SCHEMA_V2 = 'cf-v2-ownership-state/v2' as const;
export const OWNERSHIP_STATE_VERSION_V2 = 2 as const;
export const BREED_ACTION_KIND_V2 = 'companion-breed' as const;
/** F4 refuses to plan when its current receipt ordinal is uint32 max. */
export const LAST_USABLE_F4_RECEIPT_ORDINAL_V2 = 0xFFFF_FFFE;

export interface F4ReceiptEvidenceV2 {
  /** Save-lifetime F4 receipt identity. */
  readonly ordinal: number;
  /** Bounded semantic action kind, never display copy. */
  readonly actionKind: string;
  /** SHA-256 of the transaction's bounded semantic witness. */
  readonly witnessDigest: string;
}

export interface BredAcquisitionProvenanceV2 {
  readonly kind: 'bred';
  /** Gameplay ancestry. These IDs, not seeds, resolve owned parents. */
  readonly parentCreatureIds: readonly [CreatureInstanceId, CreatureInstanceId];
  /** Ordered CFB/CFB2 portability evidence only. */
  readonly parentSeeds: readonly [number, number];
  /** Portable receipt identity/evidence; the repository receipt is not exported. */
  readonly receipt: F4ReceiptEvidenceV2;
}

export interface BredAcquisitionRecordV2 {
  /** Stable child acquisition identity derived from the F4 evidence. */
  readonly recordId: DiscoveryRecordId;
  readonly speciesId: SpeciesId;
  readonly acquisition: 'breed';
  readonly provenance: BredAcquisitionProvenanceV2;
  /** Breeding owns an individual; it is not a free catalogue observation. */
  readonly firstForSpecies: false;
}

export type AcquisitionRecordV2 = DiscoveryRecordV1 | BredAcquisitionRecordV2;

export interface CreatureTombstoneV2 {
  readonly kind: 'creature';
  readonly creatureId: CreatureInstanceId;
  /** Complete immutable last-live snapshot. */
  readonly snapshot: CreatureInstanceV1;
  readonly disposition: F4ReceiptEvidenceV2;
}

export interface SpecimenTombstoneV2 {
  readonly kind: 'specimen-lot';
  readonly lotId: SpecimenLotId;
  /** Complete immutable last-owned snapshot. */
  readonly snapshot: SpecimenLotV1;
  readonly disposition: F4ReceiptEvidenceV2;
}

export interface OwnershipStateV2 {
  readonly schema: typeof OWNERSHIP_STATE_SCHEMA_V2;
  readonly version: typeof OWNERSHIP_STATE_VERSION_V2;
  readonly revision: number;
  readonly mode: OwnershipStateV1['mode'];
  readonly catalogSpecies: readonly CatalogSpeciesV1[];
  readonly acquisitions: readonly AcquisitionRecordV2[];
  readonly bredAcquisitions: readonly BredAcquisitionRecordV2[];
  readonly creatures: readonly CreatureInstanceV1[];
  readonly creatureTombstones: readonly CreatureTombstoneV2[];
  readonly specimenLots: readonly SpecimenLotV1[];
  readonly specimenTombstones: readonly SpecimenTombstoneV2[];
  readonly biosphereProgress: readonly BiosphereProgressV1[];
  readonly legacyBioX: readonly LegacyBioXEvidenceV1[];
  readonly scoutCreatureId: CreatureInstanceId | null;
  readonly legacyProtection: LegacyOwnershipSourceEvidenceV1 | null;
}

export interface OwnershipStateContentsV2 {
  /** Exact unchanged Arc 4 source, or a V2-minted direct successor of it. */
  readonly source: OwnershipStateV1;
  readonly bredAcquisitions: readonly BredAcquisitionRecordV2[];
  readonly creatures: readonly CreatureInstanceV1[];
  readonly creatureTombstones: readonly CreatureTombstoneV2[];
  readonly specimenLots: readonly SpecimenLotV1[];
  readonly specimenTombstones: readonly SpecimenTombstoneV2[];
  readonly scoutCreatureId: CreatureInstanceId | null;
}

type OwnershipStateRowsV2 = Omit<OwnershipStateContentsV2, 'source'>;

export interface OwnershipStateMirrorV2 {
  readonly schema: typeof OWNERSHIP_STATE_SCHEMA_V2;
  readonly version: typeof OWNERSHIP_STATE_VERSION_V2;
  readonly revision: number;
  /** Registered Arc 4 source. It owns catalogue/world-address truth. */
  readonly source: OwnershipStateMirrorV1;
  readonly bredAcquisitions: readonly BredAcquisitionRecordV2[];
  readonly creatures: readonly CreatureInstanceV1[];
  readonly creatureTombstones: readonly CreatureTombstoneV2[];
  readonly specimenLots: readonly SpecimenLotV1[];
  readonly specimenTombstones: readonly SpecimenTombstoneV2[];
  readonly scoutCreatureId: CreatureInstanceId | null;
}

interface StateRegistration {
  readonly source: OwnershipStateV1;
  readonly mirror: OwnershipStateMirrorV2;
  readonly encoded: string;
  readonly digest: string;
  readonly parent: OwnershipStateV2 | null;
}

const RECEIPTS = new WeakMap<object, F4ReceiptEvidenceV2>();
const BRED_ACQUISITIONS = new WeakMap<object, BredAcquisitionRecordV2>();
const CREATURES = new WeakMap<object, CreatureInstanceV1>();
const SPECIMENS = new WeakMap<object, SpecimenLotV1>();
const CREATURE_TOMBSTONES = new WeakMap<object, CreatureTombstoneV2>();
const SPECIMEN_TOMBSTONES = new WeakMap<object, SpecimenTombstoneV2>();
const STATES = new WeakMap<object, StateRegistration>();
const SOURCE_SUCCESSORS = new WeakMap<object, {
  readonly parent: OwnershipStateV2;
  readonly source: OwnershipStateV1;
}>();

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

function ownPlainFields(
  value: unknown,
  fields: readonly string[],
  label: string,
): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || (Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null)) {
    throw new TypeError(`${label} must be a plain object`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key === 'symbol')) {
    throw new TypeError(`${label} cannot contain symbols`);
  }
  const actual = (keys as string[]).sort();
  const expected = [...fields].sort();
  if (actual.length !== expected.length
    || actual.some((key, index) => key !== expected[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
  const captured: Record<string, unknown> = {};
  for (const field of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (!descriptor || !('value' in descriptor) || descriptor.get !== undefined
      || descriptor.set !== undefined || descriptor.enumerable !== true) {
      throw new TypeError(`${label}.${field} must be an enumerable own data field`);
    }
    captured[field] = descriptor.value;
  }
  return Object.freeze(captured);
}

function checkedUint32(value: CanonicalJson, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)
    || value < 0 || value > 0xFFFF_FFFF) {
    throw new RangeError(`${label} must be a uint32`);
  }
  return value >>> 0;
}

function checkedRevision(value: CanonicalJson): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)
    || value < 0 || value > MAX_OWNERSHIP_REVISION) {
    throw new RangeError('ownership V2 revision is invalid');
  }
  return value;
}

function checkedSpeciesId(value: CanonicalJson): SpeciesId {
  if (typeof value !== 'string' || !/^species-v1:[0-9a-f]{64}$/u.test(value)) {
    throw new TypeError('ownership V2 species ID is malformed');
  }
  return value as SpeciesId;
}

function checkedCreatureId(value: CanonicalJson): CreatureInstanceId {
  if (typeof value !== 'string' || !/^creature-v1:[0-9a-f]{64}$/u.test(value)) {
    throw new TypeError('ownership V2 creature ID is malformed');
  }
  return value as CreatureInstanceId;
}

function checkedSpecimenId(value: CanonicalJson): SpecimenLotId {
  if (typeof value !== 'string' || !/^specimen-v1:[0-9a-f]{64}$/u.test(value)) {
    throw new TypeError('ownership V2 specimen ID is malformed');
  }
  return value as SpecimenLotId;
}

function checkedDiscoveryId(value: CanonicalJson): DiscoveryRecordId {
  if (typeof value !== 'string' || !/^discovery-v1:[0-9a-f]{64}$/u.test(value)) {
    throw new TypeError('ownership V2 acquisition ID is malformed');
  }
  return value as DiscoveryRecordId;
}

function pair<T>(left: T, right: T): readonly [T, T] {
  return Object.freeze([left, right] as const);
}

export function createF4ReceiptEvidenceV2(input: F4ReceiptEvidenceV2): F4ReceiptEvidenceV2 {
  const source = record(canonicalizeData(input), 'F4 receipt evidence');
  exactKeys(source, ['ordinal', 'actionKind', 'witnessDigest'], 'F4 receipt evidence');
  if (typeof source.actionKind !== 'string'
    || !/^[a-z][a-z0-9.-]{0,95}$/u.test(source.actionKind)) {
    throw new TypeError('F4 receipt action kind must be a bounded semantic identifier');
  }
  if (typeof source.witnessDigest !== 'string'
    || !/^[0-9a-f]{64}$/u.test(source.witnessDigest)) {
    throw new TypeError('F4 receipt witness digest must be lowercase hexadecimal SHA-256');
  }
  const ordinal = checkedUint32(source.ordinal!, 'F4 receipt ordinal');
  if (ordinal > LAST_USABLE_F4_RECEIPT_ORDINAL_V2) {
    throw new RangeError('F4 receipt ordinal is exhausted');
  }
  const evidence: F4ReceiptEvidenceV2 = Object.freeze({
    ordinal,
    actionKind: source.actionKind,
    witnessDigest: source.witnessDigest,
  });
  RECEIPTS.set(evidence, evidence);
  return evidence;
}

function registeredReceipt(value: F4ReceiptEvidenceV2, label: string): F4ReceiptEvidenceV2 {
  const receipt = value && typeof value === 'object' ? RECEIPTS.get(value) : undefined;
  if (!receipt) throw new TypeError(`${label} must be registered F4 receipt evidence`);
  return receipt;
}

function bredAcquisitionWitness(receipt: F4ReceiptEvidenceV2): string {
  return canonicalJson({
    schema: 'cf-v2-bred-acquisition-id/v1',
    ordinal: receipt.ordinal,
    actionKind: receipt.actionKind,
    witnessDigest: receipt.witnessDigest,
  });
}

export function bredAcquisitionIdV2(receipt: F4ReceiptEvidenceV2): DiscoveryRecordId {
  const checked = registeredReceipt(receipt, 'bred acquisition receipt');
  return ownershipContentId('discovery', bredAcquisitionWitness(checked)) as DiscoveryRecordId;
}

export function localCreatureIdV2(acquisitionId: DiscoveryRecordId): CreatureInstanceId {
  const checked = checkedDiscoveryId(canonicalizeData(acquisitionId));
  return ownershipContentId(
    'creature',
    canonicalJson({ schema: 'cf-v2-local-creature-id/v1', acquisitionId: checked }),
  ) as CreatureInstanceId;
}

export function createBredAcquisitionRecordV2(input: Readonly<{
  speciesId: SpeciesId;
  parentCreatureIds: readonly [CreatureInstanceId, CreatureInstanceId];
  parentSeeds: readonly [number, number];
  receipt: F4ReceiptEvidenceV2;
}>): BredAcquisitionRecordV2 {
  const captured = ownPlainFields(
    input,
    ['speciesId', 'parentCreatureIds', 'parentSeeds', 'receipt'],
    'bred acquisition',
  );
  const receipt = registeredReceipt(captured.receipt as F4ReceiptEvidenceV2, 'bred acquisition receipt');
  if (receipt.actionKind !== BREED_ACTION_KIND_V2) {
    throw new TypeError(`bred acquisition receipt kind must be ${BREED_ACTION_KIND_V2}`);
  }
  const simple = record(canonicalizeData({
    speciesId: captured.speciesId,
    parentCreatureIds: captured.parentCreatureIds,
    parentSeeds: captured.parentSeeds,
  }), 'bred acquisition');
  exactKeys(simple, ['speciesId', 'parentCreatureIds', 'parentSeeds'], 'bred acquisition');
  if (!Array.isArray(simple.parentCreatureIds) || simple.parentCreatureIds.length !== 2
    || !Array.isArray(simple.parentSeeds) || simple.parentSeeds.length !== 2) {
    throw new TypeError('bred acquisition parents must be ordered pairs');
  }
  const parentCreatureIds = pair(
    checkedCreatureId(simple.parentCreatureIds[0]!),
    checkedCreatureId(simple.parentCreatureIds[1]!),
  );
  const parentSeeds = pair(
    checkedUint32(simple.parentSeeds[0]!, 'first portable parent seed'),
    checkedUint32(simple.parentSeeds[1]!, 'second portable parent seed'),
  );
  const provenance: BredAcquisitionProvenanceV2 = Object.freeze({
    kind: 'bred', parentCreatureIds, parentSeeds, receipt,
  });
  const row: BredAcquisitionRecordV2 = Object.freeze({
    recordId: bredAcquisitionIdV2(receipt),
    speciesId: checkedSpeciesId(simple.speciesId!),
    acquisition: 'breed',
    provenance,
    firstForSpecies: false,
  });
  BRED_ACQUISITIONS.set(row, row);
  return row;
}

export function createCreatureInstanceV2(
  input: Parameters<typeof createCreatureInstanceV1>[0],
): CreatureInstanceV1 {
  const row = createCreatureInstanceV1(input);
  CREATURES.set(row, row);
  return row;
}

export function createSpecimenLotV2(input: SpecimenLotV1): SpecimenLotV1 {
  const row = createSpecimenLotV1(input);
  SPECIMENS.set(row, row);
  return row;
}

export function createBredCreatureInstanceV2(input: Readonly<{
  acquisition: BredAcquisitionRecordV2;
  genome: unknown;
  generation: number;
  nickname: string | null;
  xp: number | null;
  hurt: number | null;
  fed: number | null;
  brood: number | null;
  assignment: CreatureInstanceV1['assignment'];
  bond: CreatureInstanceV1['bond'];
}>): CreatureInstanceV1 {
  const captured = ownPlainFields(input, [
    'acquisition', 'genome', 'generation', 'nickname', 'xp', 'hurt', 'fed',
    'brood', 'assignment', 'bond',
  ], 'bred creature');
  const acquisition = captured.acquisition as BredAcquisitionRecordV2;
  if (!acquisition || typeof acquisition !== 'object' || !BRED_ACQUISITIONS.has(acquisition)) {
    throw new TypeError('bred creature acquisition must be registered');
  }
  const identity = canonicalGenomeIdentityV1(captured.genome);
  if (identity.speciesId !== acquisition.speciesId) {
    throw new TypeError('bred creature genome does not match its acquisition');
  }
  return createCreatureInstanceV2({
    creatureId: localCreatureIdV2(acquisition.recordId),
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: captured.nickname as string | null,
    origin: 'bred',
    acquisitionRecordId: acquisition.recordId,
    lineage: {
      kind: 'parent-creatures',
      generation: captured.generation as number,
      parentCreatureIds: acquisition.provenance.parentCreatureIds,
    },
    xp: captured.xp as number | null,
    hurt: captured.hurt as number | null,
    fed: captured.fed as number | null,
    brood: captured.brood as number | null,
    assignment: captured.assignment as CreatureInstanceV1['assignment'],
    bond: captured.bond as CreatureInstanceV1['bond'],
  });
}

export function createCreatureTombstoneV2(
  snapshot: CreatureInstanceV1,
  disposition: F4ReceiptEvidenceV2,
): CreatureTombstoneV2 {
  const creature = createCreatureInstanceV2(snapshot);
  const receipt = registeredReceipt(disposition, 'creature tombstone disposition');
  const row: CreatureTombstoneV2 = Object.freeze({
    kind: 'creature', creatureId: creature.creatureId, snapshot: creature, disposition: receipt,
  });
  CREATURE_TOMBSTONES.set(row, row);
  return row;
}

export function createSpecimenTombstoneV2(
  snapshot: SpecimenLotV1,
  disposition: F4ReceiptEvidenceV2,
): SpecimenTombstoneV2 {
  const specimen = createSpecimenLotV2(snapshot);
  const receipt = registeredReceipt(disposition, 'specimen tombstone disposition');
  const row: SpecimenTombstoneV2 = Object.freeze({
    kind: 'specimen-lot', lotId: specimen.lotId, snapshot: specimen, disposition: receipt,
  });
  SPECIMEN_TOMBSTONES.set(row, row);
  return row;
}

interface Registration { has(value: object): boolean }

function registeredRows<T>(
  values: readonly T[],
  registration: Registration,
  keyOf: (row: T) => string,
  label: string,
): readonly T[] {
  if (!Array.isArray(values) || Object.getPrototypeOf(values) !== Array.prototype) {
    throw new TypeError(`${label} must be a native array`);
  }
  const keys = Reflect.ownKeys(values);
  const length = values.length;
  if (length > MAX_OWNERSHIP_ROWS || keys.some((key) => typeof key === 'symbol')
    || keys.length !== length + 1) {
    throw new RangeError(`${label} exceeds the ownership row bound`);
  }
  const rows: T[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(values, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.get !== undefined
      || descriptor.set !== undefined || descriptor.enumerable !== true
      || !descriptor.value || typeof descriptor.value !== 'object'
      || !registration.has(descriptor.value)) {
      throw new TypeError(`${label} must contain registered dense own-data rows`);
    }
    const row = descriptor.value as T;
    const key = keyOf(row);
    if (seen.has(key)) throw new TypeError(`${label} repeats ${key}`);
    seen.add(key);
    rows.push(row);
  }
  rows.sort((left, right) => {
    const a = keyOf(left), b = keyOf(right);
    return a < b ? -1 : a > b ? 1 : 0;
  });
  return Object.freeze(rows);
}

function same(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function immutableCreature(row: CreatureInstanceV1): CanonicalJson {
  return canonicalizeData({
    creatureId: row.creatureId,
    speciesId: row.speciesId,
    genomeIdentity: row.genomeIdentity,
    genome: row.genome,
    origin: row.origin,
    acquisitionRecordId: row.acquisitionRecordId,
    lineage: row.lineage,
  });
}

function validateCreatureHistory(prior: CreatureInstanceV1, current: CreatureInstanceV1): void {
  if (!same(immutableCreature(prior), immutableCreature(current))) {
    throw new TypeError('creature immutable identity changed');
  }
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
  for (let index = 0; index < prior.bond.memories.length; index++) {
    if (!same(prior.bond.memories[index], current.bond.memories[index])) {
      throw new TypeError('companion memory history changed, moved, or disappeared');
    }
  }
  for (let index = 0; index < prior.bond.mementoIds.length; index++) {
    if (prior.bond.mementoIds[index] !== current.bond.mementoIds[index]) {
      throw new TypeError('companion memento history changed, moved, or disappeared');
    }
  }
}

function genomeSeed(row: CreatureInstanceV1): number {
  const seed = row.genome.seed;
  if (typeof seed !== 'number' || !Number.isSafeInteger(seed)
    || seed < 0 || seed > 0xFFFF_FFFF) {
    throw new TypeError('owned creature genome seed is invalid');
  }
  return seed >>> 0;
}

function validateGlobalBound(state: OwnershipStateV2): void {
  let rows = state.catalogSpecies.length + state.acquisitions.length
    + state.creatures.length + state.creatureTombstones.length
    + state.specimenLots.length + state.specimenTombstones.length
    + state.biosphereProgress.length;
  for (const progress of state.biosphereProgress) rows += progress.successful.length;
  for (const creature of state.creatures) {
    if (creature.bond !== null) rows += creature.bond.memories.length + creature.bond.mementoIds.length;
  }
  for (const tombstone of state.creatureTombstones) {
    const bond = tombstone.snapshot.bond;
    if (bond !== null) rows += bond.memories.length + bond.mementoIds.length;
  }
  if (rows > MAX_OWNERSHIP_ROWS) throw new RangeError('ownership V2 state exceeds the global row bound');
}

function validateRelationships(state: OwnershipStateV2, source: OwnershipStateV1): void {
  if (source.mode === 'legacy-protected') {
    if (state.bredAcquisitions.length || state.creatures.length
      || state.creatureTombstones.length || state.specimenLots.length
      || state.specimenTombstones.length || state.scoutCreatureId !== null) {
      throw new TypeError('legacy-protected ownership V2 cannot contain owned rows');
    }
    return;
  }
  const liveCreatures = new Map(state.creatures.map((row) => [row.creatureId, row]));
  const deadCreatures = new Map(state.creatureTombstones.map((row) => [row.creatureId, row]));
  for (const id of liveCreatures.keys()) {
    if (deadCreatures.has(id)) throw new TypeError('creature identity cannot be both live and tombstoned');
  }
  const liveSpecimens = new Map(state.specimenLots.map((row) => [row.lotId, row]));
  const deadSpecimens = new Map(state.specimenTombstones.map((row) => [row.lotId, row]));
  for (const id of liveSpecimens.keys()) {
    if (deadSpecimens.has(id)) throw new TypeError('specimen identity cannot be both live and tombstoned');
  }

  const sourceCreatures = new Map(source.creatures.map((row) => [row.creatureId, row]));
  for (const prior of source.creatures) {
    const live = liveCreatures.get(prior.creatureId);
    const dead = deadCreatures.get(prior.creatureId)?.snapshot;
    if ((live ? 1 : 0) + (dead ? 1 : 0) !== 1) {
      throw new TypeError('each Arc 4 creature must resolve live or to one tombstone');
    }
    validateCreatureHistory(prior, live ?? dead!);
  }
  const sourceSpecimens = new Map(source.specimenLots.map((row) => [row.lotId, row]));
  for (const prior of source.specimenLots) {
    const live = liveSpecimens.get(prior.lotId);
    const dead = deadSpecimens.get(prior.lotId)?.snapshot;
    if ((live ? 1 : 0) + (dead ? 1 : 0) !== 1) {
      throw new TypeError('each Arc 4 specimen must resolve live or to one tombstone');
    }
    const current = live ?? dead!;
    if (current.speciesId !== prior.speciesId || current.kind !== prior.kind
      || current.origin !== prior.origin || current.acquisitionRecordId !== prior.acquisitionRecordId
      || current.quantity > prior.quantity) {
      throw new TypeError('specimen immutable identity changed or quantity increased');
    }
  }

  const bred = new Map(state.bredAcquisitions.map((row) => [row.recordId, row]));
  const bredOrdinals = new Set<number>();
  for (const acquisition of state.bredAcquisitions) {
    const ordinal = acquisition.provenance.receipt.ordinal;
    if (bredOrdinals.has(ordinal)) {
      throw new TypeError('bred acquisitions repeat a save-lifetime F4 receipt ordinal');
    }
    bredOrdinals.add(ordinal);
  }
  const receipts = new Map<number, F4ReceiptEvidenceV2>();
  const observeReceipt = (evidence: F4ReceiptEvidenceV2): void => {
    const prior = receipts.get(evidence.ordinal);
    if (prior && !same(prior, evidence)) {
      throw new TypeError('one F4 receipt ordinal cannot carry conflicting canonical evidence');
    }
    receipts.set(evidence.ordinal, evidence);
  };
  for (const acquisition of state.bredAcquisitions) observeReceipt(acquisition.provenance.receipt);
  for (const tombstone of state.creatureTombstones) observeReceipt(tombstone.disposition);
  for (const tombstone of state.specimenTombstones) observeReceipt(tombstone.disposition);
  const acquisitionOwners = new Map<DiscoveryRecordId, CreatureInstanceV1>();
  for (const row of state.creatures) {
    if (acquisitionOwners.has(row.acquisitionRecordId)) {
      throw new TypeError('one acquisition cannot own duplicate creatures');
    }
    acquisitionOwners.set(row.acquisitionRecordId, row);
    if (row.origin === 'bred') {
      if (!bred.has(row.acquisitionRecordId)) throw new TypeError('bred creature lacks bred acquisition evidence');
    } else if (!sourceCreatures.has(row.creatureId)) {
      throw new TypeError('new non-bred creature lacks Arc 4 acquisition authority');
    }
  }
  for (const tombstone of state.creatureTombstones) {
    const row = tombstone.snapshot;
    if (acquisitionOwners.has(row.acquisitionRecordId)) {
      throw new TypeError('one acquisition cannot own duplicate live/tombstoned creatures');
    }
    acquisitionOwners.set(row.acquisitionRecordId, row);
    if (row.origin === 'bred') {
      if (!bred.has(row.acquisitionRecordId)) throw new TypeError('bred tombstone lacks bred acquisition evidence');
    } else if (!sourceCreatures.has(row.creatureId)) {
      throw new TypeError('non-bred tombstone lacks Arc 4 acquisition authority');
    }
  }
  for (const row of state.specimenLots) {
    if (!sourceSpecimens.has(row.lotId)) throw new TypeError('new specimens require Arc 4 acquisition authority');
  }
  for (const row of state.specimenTombstones) {
    if (!sourceSpecimens.has(row.lotId)) throw new TypeError('specimen tombstone lacks Arc 4 acquisition authority');
  }

  const allCreatures = new Map<CreatureInstanceId, CreatureInstanceV1>([
    ...state.creatures.map((row) => [row.creatureId, row] as const),
    ...state.creatureTombstones.map((row) => [row.creatureId, row.snapshot] as const),
  ]);
  for (const acquisition of state.bredAcquisitions) {
    const child = acquisitionOwners.get(acquisition.recordId);
    if (!child || child.speciesId !== acquisition.speciesId || child.origin !== 'bred'
      || child.acquisitionRecordId !== acquisition.recordId
      || child.creatureId !== localCreatureIdV2(acquisition.recordId)
      || child.lineage.kind !== 'parent-creatures'
      || !same(child.lineage.parentCreatureIds, acquisition.provenance.parentCreatureIds)) {
      throw new TypeError('bred acquisition must resolve exactly one matching child');
    }
    const childIdentity = canonicalGenomeIdentityV1(child.genome);
    if (childIdentity.kingdom !== 'fauna') {
      throw new TypeError('only fauna can be a bred living child');
    }
    const genomeParents = child.genome.parents;
    if (!Array.isArray(genomeParents) || genomeParents.length !== 2
      || genomeParents[0] !== acquisition.provenance.parentSeeds[0]
      || genomeParents[1] !== acquisition.provenance.parentSeeds[1]) {
      throw new TypeError('bred child genome parents must match the ordered portability tuple');
    }
    if (child.genome.gen !== child.lineage.generation) {
      throw new TypeError('bred child genome generation must match owned lineage generation');
    }
    const [leftId, rightId] = acquisition.provenance.parentCreatureIds;
    if (leftId === rightId || child.creatureId === leftId || child.creatureId === rightId) {
      throw new TypeError('bred lineage requires two distinct parent individuals');
    }
    const left = allCreatures.get(leftId), right = allCreatures.get(rightId);
    if (!left || !right) throw new TypeError('bred parents must resolve live or to immutable tombstones');
    if (acquisition.provenance.parentSeeds[0] !== genomeSeed(left)
      || acquisition.provenance.parentSeeds[1] !== genomeSeed(right)) {
      throw new TypeError('portable parent seeds do not match ordered parent identities');
    }
    if (child.lineage.generation !== Math.max(left.lineage.generation, right.lineage.generation) + 1) {
      throw new TypeError('bred child generation does not follow its parent identities');
    }
  }
  if (state.scoutCreatureId !== null && !liveCreatures.has(state.scoutCreatureId)) {
    throw new TypeError('field scout must resolve to a live creature');
  }
}

function buildState(
  source: OwnershipStateV1,
  revision: number,
  contents: OwnershipStateRowsV2,
  parent: OwnershipStateV2 | null,
): OwnershipStateV2 {
  if (!isOwnershipStateV1(source)) throw new TypeError('ownership V2 source must be registered');
  if (revision < source.revision) throw new TypeError('ownership V2 revision cannot precede its Arc 4 source');
  const captured = ownPlainFields(contents, [
    'bredAcquisitions', 'creatures', 'creatureTombstones', 'specimenLots',
    'specimenTombstones', 'scoutCreatureId',
  ], 'ownership V2 contents');
  const bredAcquisitions = registeredRows(
    captured.bredAcquisitions as readonly BredAcquisitionRecordV2[],
    BRED_ACQUISITIONS,
    (row) => row.recordId,
    'bred acquisitions',
  );
  const creatures = registeredRows(
    captured.creatures as readonly CreatureInstanceV1[], CREATURES,
    (row) => row.creatureId, 'creatures',
  );
  const creatureTombstones = registeredRows(
    captured.creatureTombstones as readonly CreatureTombstoneV2[], CREATURE_TOMBSTONES,
    (row) => row.creatureId, 'creature tombstones',
  );
  const specimenLots = registeredRows(
    captured.specimenLots as readonly SpecimenLotV1[], SPECIMENS,
    (row) => row.lotId, 'specimen lots',
  );
  const specimenTombstones = registeredRows(
    captured.specimenTombstones as readonly SpecimenTombstoneV2[], SPECIMEN_TOMBSTONES,
    (row) => row.lotId, 'specimen tombstones',
  );
  const scoutCreatureId = captured.scoutCreatureId === null
    ? null : checkedCreatureId(canonicalizeData(captured.scoutCreatureId));
  const acquisitions: AcquisitionRecordV2[] = [...source.discoveries, ...bredAcquisitions];
  acquisitions.sort((left, right) => left.recordId < right.recordId ? -1 : left.recordId > right.recordId ? 1 : 0);
  for (let index = 1; index < acquisitions.length; index++) {
    if (acquisitions[index - 1]!.recordId === acquisitions[index]!.recordId) {
      throw new TypeError('ownership V2 acquisition IDs repeat');
    }
  }
  const state: OwnershipStateV2 = Object.freeze({
    schema: OWNERSHIP_STATE_SCHEMA_V2,
    version: OWNERSHIP_STATE_VERSION_V2,
    revision: checkedRevision(canonicalizeData(revision)),
    mode: source.mode,
    catalogSpecies: source.catalogSpecies,
    acquisitions: Object.freeze(acquisitions),
    bredAcquisitions,
    creatures,
    creatureTombstones,
    specimenLots,
    specimenTombstones,
    biosphereProgress: source.biosphereProgress,
    legacyBioX: source.legacyBioX,
    scoutCreatureId,
    legacyProtection: source.legacyProtection,
  });
  validateGlobalBound(state);
  validateRelationships(state, source);
  const mirror: OwnershipStateMirrorV2 = Object.freeze({
    schema: state.schema,
    version: state.version,
    revision: state.revision,
    source: ownershipStateMirrorV1(source),
    bredAcquisitions,
    creatures,
    creatureTombstones,
    specimenLots,
    specimenTombstones,
    scoutCreatureId,
  });
  const encoded = JSON.stringify(mirror);
  STATES.set(state, Object.freeze({
    source, mirror, encoded, digest: sha256Hex(encoded), parent,
  }));
  return state;
}

export function migrateOwnershipStateV1ToV2(source: OwnershipStateV1): OwnershipStateV2 {
  if (!isOwnershipStateV1(source)) throw new TypeError('ownership V1 migration source must be registered');
  return buildState(source, source.revision, {
    bredAcquisitions: [],
    creatures: source.creatures.map((row) => createCreatureInstanceV2(row)),
    creatureTombstones: [],
    specimenLots: source.specimenLots.map((row) => createSpecimenLotV2(row)),
    specimenTombstones: [],
    scoutCreatureId: source.scoutCreatureId,
  }, null);
}

function validateSuccessor(parent: OwnershipStateV2, next: OwnershipStateV2): void {
  const previousBred = new Map(parent.bredAcquisitions.map((row) => [row.recordId, row]));
  const nextBred = new Map(next.bredAcquisitions.map((row) => [row.recordId, row]));
  for (const row of parent.bredAcquisitions) {
    if (!same(row, nextBred.get(row.recordId))) {
      throw new TypeError('bred acquisition evidence is immutable and cannot be removed');
    }
  }
  const priorLive = new Map(parent.creatures.map((row) => [row.creatureId, row]));
  const currentLive = new Map(next.creatures.map((row) => [row.creatureId, row]));
  const priorDead = new Map(parent.creatureTombstones.map((row) => [row.creatureId, row]));
  const currentDead = new Map(next.creatureTombstones.map((row) => [row.creatureId, row]));
  for (const prior of parent.creatures) {
    const current = currentLive.get(prior.creatureId);
    const tombstone = currentDead.get(prior.creatureId);
    if (current) validateCreatureHistory(prior, current);
    else if (!tombstone || !same(tombstone.snapshot, prior)) {
      throw new TypeError('creature deletion requires an exact last-live tombstone');
    }
  }
  for (const prior of parent.creatureTombstones) {
    if (!same(prior, currentDead.get(prior.creatureId)) || currentLive.has(prior.creatureId)) {
      throw new TypeError('creature tombstones are immutable and cannot resurrect');
    }
  }
  for (const tombstone of next.creatureTombstones) {
    if (!priorDead.has(tombstone.creatureId) && !priorLive.has(tombstone.creatureId)) {
      throw new TypeError('a creature tombstone may only replace a parent-state live row');
    }
  }

  const priorLots = new Map(parent.specimenLots.map((row) => [row.lotId, row]));
  const currentLots = new Map(next.specimenLots.map((row) => [row.lotId, row]));
  const priorLotTombstones = new Map(parent.specimenTombstones.map((row) => [row.lotId, row]));
  const currentLotTombstones = new Map(next.specimenTombstones.map((row) => [row.lotId, row]));
  for (const prior of parent.specimenLots) {
    const current = currentLots.get(prior.lotId);
    const tombstone = currentLotTombstones.get(prior.lotId);
    if (current) {
      if (current.speciesId !== prior.speciesId || current.kind !== prior.kind
        || current.origin !== prior.origin || current.acquisitionRecordId !== prior.acquisitionRecordId
        || current.quantity > prior.quantity) {
        throw new TypeError('specimen identity changed or quantity increased');
      }
    } else if (!tombstone || !same(tombstone.snapshot, prior)) {
      throw new TypeError('specimen deletion requires an exact last-owned tombstone');
    }
  }
  for (const prior of parent.specimenTombstones) {
    if (!same(prior, currentLotTombstones.get(prior.lotId)) || currentLots.has(prior.lotId)) {
      throw new TypeError('specimen tombstones are immutable and cannot resurrect');
    }
  }
  for (const tombstone of next.specimenTombstones) {
    if (!priorLotTombstones.has(tombstone.lotId) && !priorLots.has(tombstone.lotId)) {
      throw new TypeError('a specimen tombstone may only replace a parent-state live row');
    }
  }

  for (const acquisition of next.bredAcquisitions) {
    if (previousBred.has(acquisition.recordId)) continue;
    const [leftId, rightId] = acquisition.provenance.parentCreatureIds;
    if (!priorLive.has(leftId) || !priorLive.has(rightId)
      || !currentLive.has(leftId) || !currentLive.has(rightId)) {
      throw new TypeError('normal breeding is nonlethal and requires two parent-state live parents');
    }
    const child = next.creatures.find((row) => row.acquisitionRecordId === acquisition.recordId);
    if (!child || priorLive.has(child.creatureId)) {
      throw new TypeError('new bred acquisition must create one new live child');
    }
  }
}

export function createOwnershipSuccessorV2(
  parent: OwnershipStateV2,
  contents: OwnershipStateContentsV2,
): OwnershipStateV2 {
  const prior = STATES.get(parent);
  if (!prior) throw new TypeError('ownership V2 parent must be registered');
  if (parent.mode !== 'current') throw new TypeError('protected ownership V2 has no ordinary successor');
  if (parent.revision === MAX_OWNERSHIP_REVISION) throw new RangeError('ownership V2 revision is exhausted');
  const captured = ownPlainFields(contents, [
    'source', 'bredAcquisitions', 'creatures', 'creatureTombstones', 'specimenLots',
    'specimenTombstones', 'scoutCreatureId',
  ], 'ownership V2 successor contents');
  const source = captured.source as OwnershipStateV1;
  if (!isOwnershipStateV1(source)) {
    throw new TypeError('ownership V2 successor source must be registered');
  }
  if (source !== prior.source) {
    const authority = SOURCE_SUCCESSORS.get(source);
    if (!authority || authority.parent !== parent || authority.source !== prior.source
      || !isOwnershipSuccessorV1(source, prior.source)) {
      throw new TypeError('ownership V2 source must be unchanged or its exact minted direct successor');
    }
  }
  const next = buildState(source, parent.revision + 1, {
    bredAcquisitions: captured.bredAcquisitions as readonly BredAcquisitionRecordV2[],
    creatures: captured.creatures as readonly CreatureInstanceV1[],
    creatureTombstones: captured.creatureTombstones as readonly CreatureTombstoneV2[],
    specimenLots: captured.specimenLots as readonly SpecimenLotV1[],
    specimenTombstones: captured.specimenTombstones as readonly SpecimenTombstoneV2[],
    scoutCreatureId: captured.scoutCreatureId as CreatureInstanceId | null,
  }, parent);
  validateSuccessor(parent, next);
  return next;
}

/** Return the exact registered Arc 4 source behind this V2 state. Callers may
 * read it or keep it unchanged. Arc 4 advancement must use the paired mint
 * below so a byte-identical successor rebased from another object cannot gain
 * this V2 parent's authority. */
export function ownershipSourceStateV1(state: OwnershipStateV2): OwnershipStateV1 {
  const registered = STATES.get(state);
  if (!registered) throw new TypeError('only registered ownership V2 has an Arc 4 source');
  return registered.source;
}

/** Mint one exact direct Arc 4 successor for this registered V2 parent. The
 * returned V1 state is accepted only by a V2 +1 successor of this exact parent. */
export function createOwnershipSourceSuccessorV2(
  parent: OwnershipStateV2,
  contents: OwnershipStateContentsV1,
): OwnershipStateV1 {
  const registered = STATES.get(parent);
  if (!registered) throw new TypeError('ownership V2 source parent must be registered');
  const successor = createOwnershipSuccessorV1(registered.source, contents);
  SOURCE_SUCCESSORS.set(successor, Object.freeze({ parent, source: registered.source }));
  return successor;
}

/** Internal persistence bridge for an Arc 4-only product action. The caller
 * supplies the exact registered direct V1 successor that will be persisted;
 * this bridge remints the same contents through the exact V2 parent without
 * granting authority to the caller's object, carries the existing V2
 * projection, and registers only genuinely new Arc 4 creature/specimen rows.
 * The compact-delta persistence owner still refuses any V2 state that its
 * fixed carrier inventory cannot represent. This bridge is exported solely through the package's
 * `ownership-v2-internal` subpath, never from the public root. */
export function createOwnershipSourceProjectionSuccessorV2(
  parent: OwnershipStateV2,
  sourceSuccessor: OwnershipStateV1,
): OwnershipStateV2 {
  const registered = STATES.get(parent);
  if (!registered) throw new TypeError('ownership V2 source parent must be registered');
  if (parent.mode !== 'current') {
    throw new TypeError('protected ownership V2 has no source-projection successor');
  }
  if (!isOwnershipSuccessorV1(sourceSuccessor, registered.source)) {
    throw new TypeError('ownership V2 source projection requires the exact registered Arc 4 successor');
  }
  const pairedSource = createOwnershipSourceSuccessorV2(parent, {
    catalogSpecies: sourceSuccessor.catalogSpecies,
    discoveries: sourceSuccessor.discoveries,
    creatures: sourceSuccessor.creatures,
    specimenLots: sourceSuccessor.specimenLots,
    biosphereProgress: sourceSuccessor.biosphereProgress,
    legacyBioX: sourceSuccessor.legacyBioX,
    scoutCreatureId: sourceSuccessor.scoutCreatureId,
  });
  if (ownershipStateDigestV1(pairedSource) !== ownershipStateDigestV1(sourceSuccessor)) {
    throw new TypeError('paired ownership V2 source does not match the persisted Arc 4 successor');
  }

  const priorCreatureIds = new Set(registered.source.creatures.map((row) => row.creatureId));
  const creatures = [...parent.creatures];
  for (const row of pairedSource.creatures) {
    if (!priorCreatureIds.has(row.creatureId)) creatures.push(createCreatureInstanceV2(row));
  }
  const priorSpecimenIds = new Set(registered.source.specimenLots.map((row) => row.lotId));
  const specimenLots = [...parent.specimenLots];
  for (const row of pairedSource.specimenLots) {
    if (!priorSpecimenIds.has(row.lotId)) specimenLots.push(createSpecimenLotV2(row));
  }

  return createOwnershipSuccessorV2(parent, {
    source: pairedSource,
    bredAcquisitions: parent.bredAcquisitions,
    creatures,
    creatureTombstones: parent.creatureTombstones,
    specimenLots,
    specimenTombstones: parent.specimenTombstones,
    scoutCreatureId: parent.scoutCreatureId,
  });
}

export function isOwnershipStateV2(value: unknown): value is OwnershipStateV2 {
  return !!value && typeof value === 'object' && STATES.has(value);
}

export function isOwnershipSuccessorV2(next: unknown, parent: unknown): boolean {
  if (!next || typeof next !== 'object' || !parent || typeof parent !== 'object') return false;
  const child = STATES.get(next), prior = STATES.get(parent);
  return child !== undefined && prior !== undefined
    && child.parent === parent
    && (next as OwnershipStateV2).revision === (parent as OwnershipStateV2).revision + 1;
}

export function ownershipStateMirrorV2(state: OwnershipStateV2): OwnershipStateMirrorV2 {
  const registered = STATES.get(state);
  if (!registered) throw new TypeError('only registered ownership V2 has a persistence mirror');
  return registered.mirror;
}

export function encodeOwnershipStateV2(state: OwnershipStateV2): string {
  const registered = STATES.get(state);
  if (!registered) throw new TypeError('only registered ownership V2 can be encoded');
  return registered.encoded;
}

export function ownershipStateDigestV2(state: OwnershipStateV2): string {
  const registered = STATES.get(state);
  if (!registered) throw new TypeError('only registered ownership V2 has a digest');
  return registered.digest;
}

function decodeBredAcquisition(value: CanonicalJson): BredAcquisitionRecordV2 {
  const row = record(value, 'bred acquisition mirror');
  exactKeys(row, ['recordId', 'speciesId', 'acquisition', 'provenance', 'firstForSpecies'], 'bred acquisition mirror');
  if (row.acquisition !== 'breed' || row.firstForSpecies !== false) {
    throw new TypeError('bred acquisition mirror semantics are invalid');
  }
  const provenance = record(row.provenance!, 'bred acquisition provenance');
  exactKeys(provenance, ['kind', 'parentCreatureIds', 'parentSeeds', 'receipt'], 'bred acquisition provenance');
  if (provenance.kind !== 'bred' || !Array.isArray(provenance.parentCreatureIds)
    || provenance.parentCreatureIds.length !== 2 || !Array.isArray(provenance.parentSeeds)
    || provenance.parentSeeds.length !== 2) {
    throw new TypeError('bred acquisition provenance is invalid');
  }
  const receiptData = record(provenance.receipt!, 'bred acquisition receipt');
  const receipt = createF4ReceiptEvidenceV2(receiptData as unknown as F4ReceiptEvidenceV2);
  const acquisition = createBredAcquisitionRecordV2({
    speciesId: checkedSpeciesId(row.speciesId!),
    parentCreatureIds: [
      checkedCreatureId(provenance.parentCreatureIds[0]!),
      checkedCreatureId(provenance.parentCreatureIds[1]!),
    ],
    parentSeeds: [
      checkedUint32(provenance.parentSeeds[0]!, 'first portable parent seed'),
      checkedUint32(provenance.parentSeeds[1]!, 'second portable parent seed'),
    ],
    receipt,
  });
  if (acquisition.recordId !== checkedDiscoveryId(row.recordId!)) {
    throw new TypeError('bred acquisition ID does not match its F4 evidence');
  }
  return acquisition;
}

function decodeCreatureTombstone(value: CanonicalJson): CreatureTombstoneV2 {
  const row = record(value, 'creature tombstone');
  exactKeys(row, ['kind', 'creatureId', 'snapshot', 'disposition'], 'creature tombstone');
  if (row.kind !== 'creature') throw new TypeError('creature tombstone kind is invalid');
  const receipt = createF4ReceiptEvidenceV2(
    record(row.disposition!, 'creature tombstone disposition') as unknown as F4ReceiptEvidenceV2,
  );
  const tombstone = createCreatureTombstoneV2(
    record(row.snapshot!, 'creature tombstone snapshot') as unknown as CreatureInstanceV1,
    receipt,
  );
  if (tombstone.creatureId !== checkedCreatureId(row.creatureId!)) {
    throw new TypeError('creature tombstone identity mismatch');
  }
  return tombstone;
}

function decodeSpecimenTombstone(value: CanonicalJson): SpecimenTombstoneV2 {
  const row = record(value, 'specimen tombstone');
  exactKeys(row, ['kind', 'lotId', 'snapshot', 'disposition'], 'specimen tombstone');
  if (row.kind !== 'specimen-lot') throw new TypeError('specimen tombstone kind is invalid');
  const receipt = createF4ReceiptEvidenceV2(
    record(row.disposition!, 'specimen tombstone disposition') as unknown as F4ReceiptEvidenceV2,
  );
  const tombstone = createSpecimenTombstoneV2(
    record(row.snapshot!, 'specimen tombstone snapshot') as unknown as SpecimenLotV1,
    receipt,
  );
  if (tombstone.lotId !== checkedSpecimenId(row.lotId!)) {
    throw new TypeError('specimen tombstone identity mismatch');
  }
  return tombstone;
}

/** Internal row-registration seam used by the compact Arc 5 delta codec.
 * The caller must supply the exact registered Arc 4 source; unlike the full
 * persistence mirror decoder, this path never re-registers or substitutes a
 * digest-equivalent source object. It is intentionally absent from the public
 * acquisition root and the package's internal export surface. */
export function registerOwnershipStateRowsMirrorV2(
  sourceState: OwnershipStateV1,
  value: unknown,
): OwnershipStateV2 {
  if (!isOwnershipStateV1(sourceState)) {
    throw new TypeError('ownership V2 row source must be registered');
  }
  const source = record(canonicalizeData(value), 'ownership V2 state rows');
  exactKeys(source, [
    'revision', 'bredAcquisitions', 'creatures', 'creatureTombstones',
    'specimenLots', 'specimenTombstones', 'scoutCreatureId',
  ], 'ownership V2 state rows');
  for (const key of [
    'bredAcquisitions', 'creatures', 'creatureTombstones',
    'specimenLots', 'specimenTombstones',
  ] as const) {
    if (!Array.isArray(source[key]) || source[key].length > MAX_OWNERSHIP_ROWS) {
      throw new RangeError(`ownership V2 ${key} rows are invalid`);
    }
  }
  const bredAcquisitions = (source.bredAcquisitions as CanonicalJson[]).map(decodeBredAcquisition);
  const creatures = (source.creatures as CanonicalJson[]).map((candidate) => (
    createCreatureInstanceV2(record(candidate, 'creature') as unknown as CreatureInstanceV1)
  ));
  const creatureTombstones = (source.creatureTombstones as CanonicalJson[]).map(decodeCreatureTombstone);
  const specimenLots = (source.specimenLots as CanonicalJson[]).map((candidate) => (
    createSpecimenLotV2(record(candidate, 'specimen lot') as unknown as SpecimenLotV1)
  ));
  const specimenTombstones = (source.specimenTombstones as CanonicalJson[]).map(decodeSpecimenTombstone);
  return buildState(sourceState, checkedRevision(source.revision!), {
    bredAcquisitions,
    creatures,
    creatureTombstones,
    specimenLots,
    specimenTombstones,
    scoutCreatureId: source.scoutCreatureId === null
      ? null : checkedCreatureId(source.scoutCreatureId!),
  }, null);
}

export function registerOwnershipStateMirrorV2(
  value: unknown,
  resolver: OwnershipAddressResolver,
): OwnershipStateV2 {
  const source = record(canonicalizeData(value), 'ownership V2 state');
  exactKeys(source, [
    'schema', 'version', 'revision', 'source', 'bredAcquisitions', 'creatures',
    'creatureTombstones', 'specimenLots', 'specimenTombstones', 'scoutCreatureId',
  ], 'ownership V2 state');
  if (source.schema !== OWNERSHIP_STATE_SCHEMA_V2 || source.version !== OWNERSHIP_STATE_VERSION_V2) {
    throw new TypeError('ownership V2 state version is unsupported');
  }
  const sourceState = registerOwnershipStateMirrorV1(source.source, resolver);
  return registerOwnershipStateRowsMirrorV2(sourceState, {
    revision: source.revision,
    bredAcquisitions: source.bredAcquisitions,
    creatures: source.creatures,
    creatureTombstones: source.creatureTombstones,
    specimenLots: source.specimenLots,
    specimenTombstones: source.specimenTombstones,
    scoutCreatureId: source.scoutCreatureId,
  });
}

export function decodeOwnershipStateV2(
  raw: string,
  resolver: OwnershipAddressResolver,
): OwnershipStateV2 {
  if (typeof raw !== 'string' || raw.length > 16_000_000) {
    throw new RangeError('ownership V2 state JSON is too large');
  }
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; }
  catch { throw new TypeError('ownership V2 state JSON is invalid'); }
  const state = registerOwnershipStateMirrorV2(parsed, resolver);
  if (encodeOwnershipStateV2(state) !== raw) {
    throw new TypeError('ownership V2 state is not its canonical fixed point');
  }
  return state;
}
