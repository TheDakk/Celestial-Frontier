/* Arc 6 Guardian/Titan acquisition authority.

   Arc 5 deliberately stopped before Guardian provenance. This additive,
   versioned carrier preserves the legacy conquest capture without weakening
   Arc 5's five-shard fixed point: one new Guardian species creates one
   catalogue row, one living creature, and one receipt/world-bound acquisition
   record. Legacy `_storeSpecies` deduplication remains exact: an already-known
   species creates none of those rows. */
import {
  COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
  isCombatSettlementPlanV1,
  type CombatSettlementPlanV1,
  type PrimeSignatureIdV1,
} from '@cf/domain-combatcore';
import {
  getCanonicalCF1AddressKey,
  isCanonicalCF1Address,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  MAX_OWNERSHIP_REVISION,
  MAX_OWNERSHIP_ROWS,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  ownershipContentId,
  type CanonicalCF1WorldAddressMirrorV1,
  type CatalogSpeciesV1,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type DiscoveryRecordId,
  type OwnershipAddressResolver,
  type SpeciesId,
} from './model.js';
import {
  createCreatureInstanceV2,
  createF4ReceiptEvidenceV2,
  isOwnershipStateV2,
  type F4ReceiptEvidenceV2,
  type OwnershipStateV2,
} from './model-v2.js';
import {
  canonicalJson,
  canonicalizeData,
  sha256Hex,
  type CanonicalJson,
} from './canonical.js';

export const GUARDIAN_ACQUISITION_STATE_SCHEMA_V1 = 'cf-v2-guardian-acquisition-state/v1' as const;
export const GUARDIAN_ACQUISITION_STATE_VERSION_V1 = 1 as const;

export interface GuardianConquestProvenanceV1 {
  readonly kind: 'guardian-conquest';
  readonly defenderKind: 'guardian' | 'titan';
  readonly sourceId: string;
  readonly signatureId: PrimeSignatureIdV1 | null;
  readonly worldKey: string;
  readonly worldAddress: CanonicalCF1WorldAddress;
  readonly encounterWitnessDigest: string;
  readonly receipt: F4ReceiptEvidenceV2;
}

export interface GuardianAcquisitionRecordV1 {
  readonly recordId: DiscoveryRecordId;
  readonly speciesId: SpeciesId;
  readonly acquisition: 'guardian-conquest';
  readonly provenance: GuardianConquestProvenanceV1;
  readonly firstForSpecies: true;
}

export interface GuardianAcquisitionEntryV1 {
  readonly acquisition: GuardianAcquisitionRecordV1;
  readonly catalogSpecies: CatalogSpeciesV1;
  readonly creature: CreatureInstanceV1;
}

export interface GuardianAcquisitionStateV1 {
  readonly schema: typeof GUARDIAN_ACQUISITION_STATE_SCHEMA_V1;
  readonly version: typeof GUARDIAN_ACQUISITION_STATE_VERSION_V1;
  readonly revision: number;
  readonly entries: readonly GuardianAcquisitionEntryV1[];
}

interface GuardianConquestProvenanceMirrorV1 extends Omit<GuardianConquestProvenanceV1, 'worldAddress'> {
  readonly worldAddress: CanonicalCF1WorldAddressMirrorV1;
}
interface GuardianAcquisitionRecordMirrorV1 extends Omit<GuardianAcquisitionRecordV1, 'provenance'> {
  readonly provenance: GuardianConquestProvenanceMirrorV1;
}
interface GuardianAcquisitionEntryMirrorV1 extends Omit<GuardianAcquisitionEntryV1, 'acquisition'> {
  readonly acquisition: GuardianAcquisitionRecordMirrorV1;
}
export interface GuardianAcquisitionStateMirrorV1 {
  readonly schema: typeof GUARDIAN_ACQUISITION_STATE_SCHEMA_V1;
  readonly version: typeof GUARDIAN_ACQUISITION_STATE_VERSION_V1;
  readonly revision: number;
  readonly entries: readonly GuardianAcquisitionEntryMirrorV1[];
}

export type GuardianAcquisitionPreparationV1 =
  | Readonly<{ readonly kind: 'not-applicable'; readonly reason: 'no-Guardian-capture' }>
  | Readonly<{
    readonly kind: 'deduplicated';
    readonly reason: 'legacy-store-species-deduplication';
    readonly speciesId: SpeciesId;
  }>
  | Readonly<{
    readonly kind: 'prepared';
    readonly entry: GuardianAcquisitionEntryV1;
    readonly successor: GuardianAcquisitionStateV1;
    readonly successorDigest: string;
  }>
  | Readonly<{
    readonly kind: 'refused';
    readonly reason:
      | 'plan-unregistered'
      | 'ownership-unregistered'
      | 'state-unregistered'
      | 'state-protected'
      | 'state-revision-exhausted'
      | 'state-capacity-exhausted'
      | 'capture-shape-mismatch'
      | 'duplicate-receipt'
      | 'duplicate-source-world';
  }>;

interface StateRegistration {
  readonly mirror: GuardianAcquisitionStateMirrorV1;
  readonly encoded: string;
  readonly digest: string;
}

const ACQUISITIONS = new WeakSet<object>();
const ENTRIES = new WeakSet<object>();
const STATES = new WeakMap<object, StateRegistration>();
const DIGEST = /^[0-9a-f]{64}$/u;
const SOURCE_MAX = 512;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: object, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length
    || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function boundedText(value: unknown, label: string, maximum = SOURCE_MAX): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function checkedRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0
    || (value as number) > MAX_OWNERSHIP_REVISION) {
    throw new RangeError('Guardian acquisition revision is invalid');
  }
  return value as number;
}

function checkedSignature(value: unknown): PrimeSignatureIdV1 | null {
  if (value === null) return null;
  if (value !== 'stone' && value !== 'flame' && value !== 'sky' && value !== 'star'
    && value !== 'ocean' && value !== 'mind' && value !== 'life'
    && value !== 'void' && value !== 'prism') {
    throw new TypeError('Guardian acquisition Prime Signature is invalid');
  }
  return value;
}

function checkedWorld(value: unknown): CanonicalCF1WorldAddress {
  if (!isCanonicalCF1Address(value) || !('planet' in value)) {
    throw new TypeError('Guardian acquisition requires a canonical CF1 world');
  }
  const key = getCanonicalCF1AddressKey(value);
  if (key === null || key !== value.key) throw new TypeError('Guardian acquisition world key is unproven');
  return value;
}

function worldMirror(addressValue: CanonicalCF1WorldAddress): CanonicalCF1WorldAddressMirrorV1 {
  const address = checkedWorld(addressValue);
  return Object.freeze({
    format: 'CF1',
    key: address.key,
    galaxy: Object.freeze({
      seed: address.galaxy.seed, x: address.galaxy.x, y: address.galaxy.y,
      size: address.galaxy.size, sp: address.galaxy.sp,
      tilt: address.galaxy.tilt, rot: address.galaxy.rot,
      home: address.galaxy.home, quasar: address.galaxy.quasar, dwarf: address.galaxy.dwarf,
      parentCell: Object.freeze({
        x: address.galaxy.parentCell.x, y: address.galaxy.parentCell.y,
      }),
    }),
    star: Object.freeze({
      seed: address.star.seed, x: address.star.x, y: address.star.y,
      layer: address.star.layer,
      parentCell: Object.freeze({ x: address.star.parentCell.x, y: address.star.parentCell.y }),
    }),
    planet: Object.freeze({ seed: address.planet.seed, ordinal: address.planet.ordinal }),
  });
}

function acquisitionWitness(input: Readonly<{
  defenderKind: 'guardian' | 'titan';
  sourceId: string;
  signatureId: PrimeSignatureIdV1 | null;
  worldKey: string;
  encounterWitnessDigest: string;
  receipt: F4ReceiptEvidenceV2;
}>): string {
  return canonicalJson({ schema: 'cf-v2-guardian-acquisition-id/v1', ...input });
}

function createAcquisition(input: Readonly<{
  recordId?: DiscoveryRecordId;
  speciesId: SpeciesId;
  defenderKind: 'guardian' | 'titan';
  sourceId: string;
  signatureId: PrimeSignatureIdV1 | null;
  worldAddress: CanonicalCF1WorldAddress;
  encounterWitnessDigest: string;
  receipt: F4ReceiptEvidenceV2;
}>): GuardianAcquisitionRecordV1 {
  const worldAddress = checkedWorld(input.worldAddress);
  const sourceId = boundedText(input.sourceId, 'Guardian acquisition source');
  if (!DIGEST.test(input.encounterWitnessDigest)) {
    throw new TypeError('Guardian acquisition encounter digest is invalid');
  }
  if (input.receipt.actionKind !== COMBAT_SETTLEMENT_RECEIPT_KIND_V1) {
    throw new TypeError('Guardian acquisition receipt kind is invalid');
  }
  if (input.defenderKind === 'guardian' ? input.signatureId !== null : input.signatureId === null) {
    throw new TypeError('Guardian acquisition defender and Signature disagree');
  }
  const witness = acquisitionWitness({
    defenderKind: input.defenderKind,
    sourceId,
    signatureId: input.signatureId,
    worldKey: worldAddress.key,
    encounterWitnessDigest: input.encounterWitnessDigest,
    receipt: input.receipt,
  });
  const recordId = ownershipContentId('discovery', witness) as DiscoveryRecordId;
  if (input.recordId !== undefined && input.recordId !== recordId) {
    throw new TypeError('Guardian acquisition record id is not receipt-derived');
  }
  const provenance: GuardianConquestProvenanceV1 = Object.freeze({
    kind: 'guardian-conquest',
    defenderKind: input.defenderKind,
    sourceId,
    signatureId: input.signatureId,
    worldKey: worldAddress.key,
    worldAddress,
    encounterWitnessDigest: input.encounterWitnessDigest,
    receipt: input.receipt,
  });
  const record: GuardianAcquisitionRecordV1 = Object.freeze({
    recordId,
    speciesId: input.speciesId,
    acquisition: 'guardian-conquest',
    provenance,
    firstForSpecies: true,
  });
  ACQUISITIONS.add(record);
  return record;
}

function creatureIdFor(recordId: DiscoveryRecordId): CreatureInstanceId {
  return ownershipContentId('creature', canonicalJson({
    schema: 'cf-v2-guardian-creature-id/v1', recordId,
  })) as CreatureInstanceId;
}

function createEntry(
  acquisition: GuardianAcquisitionRecordV1,
  catalogSpecies: CatalogSpeciesV1,
  creature: CreatureInstanceV1,
): GuardianAcquisitionEntryV1 {
  if (!ACQUISITIONS.has(acquisition)
    || catalogSpecies.speciesId !== acquisition.speciesId
    || catalogSpecies.firstObservationId !== acquisition.recordId
    || creature.creatureId !== creatureIdFor(acquisition.recordId)
    || creature.speciesId !== acquisition.speciesId
    || creature.acquisitionRecordId !== acquisition.recordId
    || creature.origin !== 'guardian') {
    throw new TypeError('Guardian acquisition rows do not form one exact ownership entry');
  }
  const entry = Object.freeze({ acquisition, catalogSpecies, creature });
  ENTRIES.add(entry);
  return entry;
}

function entryMirror(entry: GuardianAcquisitionEntryV1): GuardianAcquisitionEntryMirrorV1 {
  if (!ENTRIES.has(entry)) throw new TypeError('Guardian acquisition entry is unregistered');
  const provenance = entry.acquisition.provenance;
  return Object.freeze({
    acquisition: Object.freeze({
      ...entry.acquisition,
      provenance: Object.freeze({ ...provenance, worldAddress: worldMirror(provenance.worldAddress) }),
    }),
    catalogSpecies: entry.catalogSpecies,
    creature: entry.creature,
  });
}

function registerState(input: Readonly<{
  revision: number;
  entries: readonly GuardianAcquisitionEntryV1[];
}>): GuardianAcquisitionStateV1 {
  const revision = checkedRevision(input.revision);
  if (!Array.isArray(input.entries) || input.entries.length > MAX_OWNERSHIP_ROWS
    || input.entries.some((entry) => !ENTRIES.has(entry))) {
    throw new TypeError('Guardian acquisition entries are invalid');
  }
  if (revision !== input.entries.length) {
    throw new TypeError('Guardian acquisition revision does not match its append-only history');
  }
  const receiptOrdinals = new Set<number>();
  const speciesIds = new Set<string>();
  const recordIds = new Set<string>();
  const creatureIds = new Set<string>();
  const sourceWorlds = new Set<string>();
  let previousOrdinal = -1;
  for (const entry of input.entries) {
    const ordinal = entry.acquisition.provenance.receipt.ordinal;
    const sourceWorld = canonicalJson({
      sourceId: entry.acquisition.provenance.sourceId,
      worldKey: entry.acquisition.provenance.worldKey,
    });
    if (ordinal <= previousOrdinal || receiptOrdinals.has(ordinal)
      || speciesIds.has(entry.acquisition.speciesId)
      || recordIds.has(entry.acquisition.recordId)
      || creatureIds.has(entry.creature.creatureId)
      || sourceWorlds.has(sourceWorld)) {
      throw new TypeError('Guardian acquisition state repeats or reorders authority');
    }
    previousOrdinal = ordinal;
    receiptOrdinals.add(ordinal);
    speciesIds.add(entry.acquisition.speciesId);
    recordIds.add(entry.acquisition.recordId);
    creatureIds.add(entry.creature.creatureId);
    sourceWorlds.add(sourceWorld);
  }
  const entries = Object.freeze([...input.entries]);
  const state: GuardianAcquisitionStateV1 = Object.freeze({
    schema: GUARDIAN_ACQUISITION_STATE_SCHEMA_V1,
    version: GUARDIAN_ACQUISITION_STATE_VERSION_V1,
    revision,
    entries,
  });
  const mirror: GuardianAcquisitionStateMirrorV1 = Object.freeze({
    schema: state.schema,
    version: state.version,
    revision,
    entries: Object.freeze(entries.map(entryMirror)),
  });
  const encoded = canonicalJson(mirror);
  STATES.set(state, Object.freeze({ mirror, encoded, digest: sha256Hex(encoded) }));
  return state;
}

export function createEmptyGuardianAcquisitionStateV1(): GuardianAcquisitionStateV1 {
  return registerState({ revision: 0, entries: [] });
}

export function isGuardianAcquisitionStateV1(value: unknown): value is GuardianAcquisitionStateV1 {
  return typeof value === 'object' && value !== null && STATES.has(value);
}

export function guardianAcquisitionStateMirrorV1(
  state: GuardianAcquisitionStateV1,
): GuardianAcquisitionStateMirrorV1 {
  const registration = state && typeof state === 'object' ? STATES.get(state) : undefined;
  if (!registration) throw new TypeError('Guardian acquisition state is unregistered');
  return registration.mirror;
}

export function encodeGuardianAcquisitionStateV1(state: GuardianAcquisitionStateV1): string {
  const registration = state && typeof state === 'object' ? STATES.get(state) : undefined;
  if (!registration) throw new TypeError('Guardian acquisition state is unregistered');
  return registration.encoded;
}

export function guardianAcquisitionStateDigestV1(state: GuardianAcquisitionStateV1): string {
  const registration = state && typeof state === 'object' ? STATES.get(state) : undefined;
  if (!registration) throw new TypeError('Guardian acquisition state is unregistered');
  return registration.digest;
}

function decodeEntry(value: unknown, resolver: OwnershipAddressResolver): GuardianAcquisitionEntryV1 {
  if (!isRecord(value)) throw new TypeError('Guardian acquisition entry must be an object');
  exactKeys(value, ['acquisition', 'catalogSpecies', 'creature'], 'Guardian acquisition entry');
  if (!isRecord(value.acquisition)) throw new TypeError('Guardian acquisition record must be an object');
  exactKeys(value.acquisition, [
    'recordId', 'speciesId', 'acquisition', 'provenance', 'firstForSpecies',
  ], 'Guardian acquisition record');
  if (value.acquisition.acquisition !== 'guardian-conquest'
    || value.acquisition.firstForSpecies !== true
    || !isRecord(value.acquisition.provenance)) {
    throw new TypeError('Guardian acquisition record is invalid');
  }
  const provenance = value.acquisition.provenance;
  exactKeys(provenance, [
    'kind', 'defenderKind', 'sourceId', 'signatureId', 'worldKey', 'worldAddress',
    'encounterWitnessDigest', 'receipt',
  ], 'Guardian acquisition provenance');
  if (provenance.kind !== 'guardian-conquest'
    || (provenance.defenderKind !== 'guardian' && provenance.defenderKind !== 'titan')
    || !isRecord(provenance.receipt)) {
    throw new TypeError('Guardian acquisition provenance is invalid');
  }
  const worldAddress = resolver.resolveWorldAddress(
    provenance.worldAddress as CanonicalCF1WorldAddressMirrorV1,
  );
  if (worldAddress === null || worldAddress.key !== provenance.worldKey) {
    throw new TypeError('Guardian acquisition world mirror does not resolve');
  }
  const receipt = createF4ReceiptEvidenceV2(
    provenance.receipt as unknown as F4ReceiptEvidenceV2,
  );
  const identity = canonicalGenomeIdentityV1(
    (value.catalogSpecies as { genome?: unknown })?.genome,
  );
  if (identity.speciesId !== value.acquisition.speciesId) {
    throw new TypeError('Guardian acquisition species identity is invalid');
  }
  const acquisition = createAcquisition({
    recordId: value.acquisition.recordId as DiscoveryRecordId,
    speciesId: identity.speciesId,
    defenderKind: provenance.defenderKind,
    sourceId: provenance.sourceId as string,
    signatureId: checkedSignature(provenance.signatureId),
    worldAddress,
    encounterWitnessDigest: provenance.encounterWitnessDigest as string,
    receipt,
  });
  const catalogSpecies = createCatalogSpeciesV1({
    identity,
    alias: (value.catalogSpecies as { alias?: unknown }).alias as string | null,
    firstObservationId: acquisition.recordId,
  });
  if (canonicalJson(catalogSpecies) !== canonicalJson(value.catalogSpecies)) {
    throw new TypeError('Guardian catalogue mirror is not canonical');
  }
  const creature = createCreatureInstanceV2(
    value.creature as unknown as Parameters<typeof createCreatureInstanceV2>[0],
  );
  return createEntry(acquisition, catalogSpecies, creature);
}

export function decodeGuardianAcquisitionStateV1(
  encoded: string,
  resolver: OwnershipAddressResolver,
): GuardianAcquisitionStateV1 {
  if (typeof encoded !== 'string' || encoded.length < 1 || encoded.length > 262_144) {
    throw new RangeError('Guardian acquisition carrier bytes are invalid');
  }
  const value = canonicalizeData(JSON.parse(encoded)) as CanonicalJson;
  if (!isRecord(value)) throw new TypeError('Guardian acquisition carrier must be an object');
  exactKeys(value, ['schema', 'version', 'revision', 'entries'], 'Guardian acquisition carrier');
  if (value.schema !== GUARDIAN_ACQUISITION_STATE_SCHEMA_V1
    || value.version !== GUARDIAN_ACQUISITION_STATE_VERSION_V1
    || !Array.isArray(value.entries)) {
    throw new TypeError('Guardian acquisition carrier schema is invalid');
  }
  const state = registerState({
    revision: checkedRevision(value.revision),
    entries: value.entries.map((entry) => decodeEntry(entry, resolver)),
  });
  if (encodeGuardianAcquisitionStateV1(state) !== encoded) {
    throw new TypeError('Guardian acquisition carrier is not canonical');
  }
  return state;
}

function refused(
  reason: Extract<GuardianAcquisitionPreparationV1, { kind: 'refused' }>['reason'],
): GuardianAcquisitionPreparationV1 {
  return Object.freeze({ kind: 'refused', reason });
}

/** Prepare the exact legacy Guardian/Titan capture. The combat plan already
 * owns defender identity and strips battlefield-only modifiers; this seam
 * only binds that evidence to current ownership and a new registered carrier. */
export function prepareGuardianAcquisitionV1(input: Readonly<{
  readonly parent: GuardianAcquisitionStateV1;
  readonly ownership: OwnershipStateV2;
  readonly plan: CombatSettlementPlanV1;
}>): GuardianAcquisitionPreparationV1 {
  if (!input || typeof input !== 'object' || !isCombatSettlementPlanV1(input.plan)) {
    return refused('plan-unregistered');
  }
  if (!isOwnershipStateV2(input.ownership)) return refused('ownership-unregistered');
  if (!isGuardianAcquisitionStateV1(input.parent)) return refused('state-unregistered');
  if (input.ownership.mode !== 'current') return refused('state-protected');
  const capture = input.plan.guardianCapture;
  if (capture.status === 'none') {
    return Object.freeze({ kind: 'not-applicable', reason: 'no-Guardian-capture' });
  }
  const defenderKind = input.plan.encounter.defender.kind;
  const signatureId = input.plan.encounter.defender.signatureId;
  let world: CanonicalCF1WorldAddress;
  try { world = checkedWorld(input.plan.encounter.identity.world); }
  catch { return refused('capture-shape-mismatch'); }
  if (input.plan.outcome !== 'champion-win'
    || input.plan.conquest.status !== 'settle'
    || (defenderKind !== 'guardian' && defenderKind !== 'titan')
    || capture.sourceId !== input.plan.encounter.defender.sourceId
    || capture.source !== (defenderKind === 'titan' ? 'Elemental Titan' : 'Apex Guardian')
    || capture.battlefieldModifiersStripped !== true
    || capture.cataloguePolicy !== 'legacy-store-species-deduplication'
    || (defenderKind === 'guardian' ? signatureId !== null : signatureId === null)
    || capture.portableGenome._mult !== undefined
    || capture.portableGenome._wf !== undefined) {
    return refused('capture-shape-mismatch');
  }
  if (input.parent.revision === MAX_OWNERSHIP_REVISION) {
    return refused('state-revision-exhausted');
  }
  if (input.parent.entries.length >= MAX_OWNERSHIP_ROWS) {
    return refused('state-capacity-exhausted');
  }
  if (input.parent.entries.some((entry) => (
    entry.acquisition.provenance.receipt.ordinal === input.plan.receiptOrdinal
  ))) return refused('duplicate-receipt');
  if (input.parent.entries.some((entry) => (
    entry.acquisition.provenance.sourceId === capture.sourceId
      && entry.acquisition.provenance.worldKey === world.key
  ))) return refused('duplicate-source-world');
  try {
    const identity = canonicalGenomeIdentityV1(capture.portableGenome);
    if (identity.kingdom !== 'fauna') return refused('capture-shape-mismatch');
    if (input.ownership.catalogSpecies.some((row) => row.speciesId === identity.speciesId)
      || input.parent.entries.some((row) => row.acquisition.speciesId === identity.speciesId)) {
      return Object.freeze({
        kind: 'deduplicated',
        reason: 'legacy-store-species-deduplication',
        speciesId: identity.speciesId,
      });
    }
    const receipt = createF4ReceiptEvidenceV2({
      ordinal: input.plan.receiptOrdinal,
      actionKind: COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
      witnessDigest: sha256Hex(input.plan.witness),
    });
    const acquisition = createAcquisition({
      speciesId: identity.speciesId,
      defenderKind,
      sourceId: capture.sourceId,
      signatureId,
      worldAddress: world,
      encounterWitnessDigest: sha256Hex(input.plan.encounter.witness),
      receipt,
    });
    const catalogSpecies = createCatalogSpeciesV1({
      identity,
      alias: null,
      firstObservationId: acquisition.recordId,
    });
    const generation = Number.isSafeInteger(capture.portableGenome.gen)
      && (capture.portableGenome.gen as number) >= 0
      && (capture.portableGenome.gen as number) <= 1_000_000_000
      ? capture.portableGenome.gen as number
      : 0;
    const creature = createCreatureInstanceV2({
      creatureId: creatureIdFor(acquisition.recordId),
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: null,
      origin: 'guardian',
      acquisitionRecordId: acquisition.recordId,
      lineage: Object.freeze({ kind: 'none', generation }),
      xp: null,
      hurt: null,
      fed: null,
      brood: null,
      assignment: null,
      bond: null,
    });
    const entry = createEntry(acquisition, catalogSpecies, creature);
    const successor = registerState({
      revision: input.parent.revision + 1,
      entries: [...input.parent.entries, entry],
    });
    return Object.freeze({
      kind: 'prepared',
      entry,
      successor,
      successorDigest: guardianAcquisitionStateDigestV1(successor),
    });
  } catch {
    return refused('capture-shape-mismatch');
  }
}
