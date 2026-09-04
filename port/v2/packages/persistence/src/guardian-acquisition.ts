/* Arc 6 Guardian/Titan acquisition persistence carrier.

   This owner stores the registered acquisition extension and projects the
   exact compatible v4 Compendium row. It also owns the fail-closed composite
   of complete Arc 4 ownership plus these separately-carried individuals, so
   a later Arc 4 reconciliation cannot erase a captured Guardian or Titan. It
   does not write by itself: combat settlement joins its complete replacement
   with conquest, champion, Prime, and receipt authority in the existing
   F4/F3 CAS. */
import {
  isCanonicalCF1Address,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  MAX_LEGACY_OWNERSHIP_CODEX_ROWS,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  canonicalJson,
  canonicalizeData,
  isOwnershipStateV1,
  isOwnershipStateV2,
  type CanonicalJson,
  type OwnershipAddressResolver,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  GUARDIAN_ACQUISITION_STATE_VERSION_V1,
  createEmptyGuardianAcquisitionStateV1,
  decodeGuardianAcquisitionStateV1,
  encodeGuardianAcquisitionStateV1,
  type GuardianAcquisitionEntryV1,
  type GuardianAcquisitionStateV1,
} from '@cf/domain-acquisition/guardian-acquisition-internal';
import {
  projectGuardianCompanionsV1,
} from '@cf/domain-acquisition/guardian-companion-internal';
import {
  classifyRealm,
  describeSpecies,
  sapienceTier,
  type Genome,
} from '@cf/domain-genome';
import { ringGrade } from '@cf/domain-strays';
import type { CodexEntry, SaveStateV2 } from './import-v2.js';
import {
  projectLegacyOwnershipMirror,
  type ProjectedLegacyOwnershipMirrorV1,
} from './arc4-ownership.js';
import {
  V5_SEGMENTS,
  canonicalizeV5Extensions,
  type V5ExtensionWrite,
  type V5Extensions,
} from './migration-v5.js';
import { readGuardianCompanionCarrierV1 } from './guardian-companion.js';

export const GUARDIAN_ACQUISITION_SEGMENT_V1 = 'creatures' as const;
export const GUARDIAN_ACQUISITION_NAMESPACE_V1 = 'arc6.guardian-acquisitions' as const;

export type GuardianAcquisitionCarrierReadOutcomeV1 =
  | Readonly<{ readonly kind: 'loaded'; readonly state: GuardianAcquisitionStateV1 }>
  | Readonly<{
    readonly kind: 'protected';
    readonly reason: 'wrong-segment' | 'future-version' | 'corrupt';
    readonly version?: number;
  }>;

/** Absence is the exact empty pre-Arc-6 state. An owned namespace in another
 * segment, a future version, or any non-fixed-point payload is protected. */
export function readGuardianAcquisitionCarrierV1(
  extensionsValue: unknown,
  resolver: OwnershipAddressResolver = SCENE_OWNERSHIP_ADDRESS_RESOLVER,
): GuardianAcquisitionCarrierReadOutcomeV1 {
  let extensions: V5Extensions;
  try { extensions = canonicalizeV5Extensions(extensionsValue); }
  catch { return Object.freeze({ kind: 'protected', reason: 'corrupt' }); }
  if (V5_SEGMENTS.some((segment) => segment !== GUARDIAN_ACQUISITION_SEGMENT_V1
    && extensions[segment]?.[GUARDIAN_ACQUISITION_NAMESPACE_V1] !== undefined)) {
    return Object.freeze({ kind: 'protected', reason: 'wrong-segment' });
  }
  const carrier = extensions.creatures?.[GUARDIAN_ACQUISITION_NAMESPACE_V1];
  if (carrier === undefined) {
    return Object.freeze({ kind: 'loaded', state: createEmptyGuardianAcquisitionStateV1() });
  }
  if (carrier.version > GUARDIAN_ACQUISITION_STATE_VERSION_V1) {
    return Object.freeze({
      kind: 'protected', reason: 'future-version', version: carrier.version,
    });
  }
  if (carrier.version !== GUARDIAN_ACQUISITION_STATE_VERSION_V1) {
    return Object.freeze({ kind: 'protected', reason: 'corrupt' });
  }
  try {
    return Object.freeze({
      kind: 'loaded',
      state: decodeGuardianAcquisitionStateV1(carrier.json, resolver),
    });
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'corrupt' });
  }
}

export function guardianAcquisitionCarrierWriteV1(
  state: GuardianAcquisitionStateV1,
): V5ExtensionWrite {
  return Object.freeze({
    segment: GUARDIAN_ACQUISITION_SEGMENT_V1,
    namespace: GUARDIAN_ACQUISITION_NAMESPACE_V1,
    carrier: Object.freeze({
      version: GUARDIAN_ACQUISITION_STATE_VERSION_V1,
      json: encodeGuardianAcquisitionStateV1(state),
    }),
  });
}

/** Truthful v4 route projection from the source-proven world. The legacy
 * fallback title is intentionally `a world`: display title is not immutable
 * combat authority, while this route remains exact and navigable. */
export function projectLegacyGuardianWhereV1(
  entry: GuardianAcquisitionEntryV1,
): Readonly<Record<string, unknown>> {
  return projectLegacyGuardianWorldWhereV1(entry.acquisition.provenance.worldAddress);
}

export function projectLegacyGuardianWorldWhereV1(
  address: CanonicalCF1WorldAddress,
): Readonly<Record<string, unknown>> {
  if (!isCanonicalCF1Address(address) || !('planet' in address)) {
    throw new TypeError('Guardian legacy projection requires a canonical CF1 world');
  }
  const gal: Record<string, unknown> = {
    x: address.galaxy.x,
    y: address.galaxy.y,
    seed: address.galaxy.seed,
    size: address.galaxy.size,
    sp: address.galaxy.sp,
    tilt: address.galaxy.tilt,
    rot: address.galaxy.rot,
  };
  for (const flag of ['home', 'quasar', 'dwarf'] as const) {
    if (address.galaxy[flag]) gal[flag] = true;
  }
  return Object.freeze({
    gal: Object.freeze(gal),
    pseed: address.planet.seed,
    star: Object.freeze({
      x: address.star.x, y: address.star.y, seed: address.star.seed,
    }),
    type: 'planet',
  });
}

/** Exact legacy `_storeSpecies` compatibility surface for a new Guardian.
 * The registered Arc 6 carrier remains canonical ownership/provenance. */
export function projectLegacyGuardianCodexEntryV1(
  entry: GuardianAcquisitionEntryV1,
): CodexEntry {
  return projectLegacyGuardianIndividualCodexEntryV1(entry, entry.creature);
}

function projectLegacyGuardianIndividualCodexEntryV1(
  entry: GuardianAcquisitionEntryV1,
  creature: GuardianAcquisitionEntryV1['creature'],
): CodexEntry {
  const genome = entry.catalogSpecies.genome as unknown as Genome;
  const descriptor = describeSpecies(genome);
  const where = projectLegacyGuardianWhereV1(entry);
  const grade = ringGrade(genome as never, descriptor.grade as never, where);
  const tier = grade && typeof (grade as { tier?: unknown }).tier === 'number'
    ? (grade as { tier: number }).tier
    : null;
  const defender = entry.acquisition.provenance.defenderKind;
  const from = `${defender === 'titan' ? 'Elemental Titan' : 'Apex Guardian'} of a world`;
  const id = `s${genome.seed}`;
  const individualGenome: Record<string, unknown> = { ...entry.catalogSpecies.genome };
  individualGenome.gen = creature.lineage.generation;
  if (creature.lineage.kind === 'legacy-parent-seeds') {
    individualGenome.parents = creature.lineage.parentSeeds;
  }
  for (const field of ['xp', 'hurt', 'fed', 'brood', 'assignment', 'bond'] as const) {
    const value = creature[field];
    if (value !== null) individualGenome[field] = value;
  }
  return {
    id,
    name: descriptor.name,
    kind: descriptor.kind,
    tier,
    realm: classifyRealm(genome),
    sapient: sapienceTier(genome),
    from,
    hybrid: !!individualGenome.parents,
    g: individualGenome,
    where: where as Record<string, unknown>,
  };
}

export type Arc4GuardianLegacyMirrorProtectionReasonV1 =
  | 'arc4-unregistered'
  | 'arc4-legacy-protected'
  | 'arc4-codex-seed-collision'
  | 'arc4-biosphere-seed-collision'
  | 'guardian-wrong-segment'
  | 'guardian-future-version'
  | 'guardian-corrupt'
  | 'guardian-projection-invalid'
  | 'guardian-companion-wrong-segment'
  | 'guardian-companion-future-version'
  | 'guardian-companion-corrupt'
  | 'guardian-companion-detached'
  | 'guardian-companion-collision'
  | 'legacy-capacity-exceeded'
  | 'legacy-id-species-collision'
  | 'ambiguous-species-identity';

export interface ProtectedArc4GuardianLegacyMirrorV1 {
  readonly kind: 'protected';
  readonly reason: Arc4GuardianLegacyMirrorProtectionReasonV1;
  readonly version?: number;
  readonly legacyCodexId?: string;
  readonly speciesIds?: readonly string[];
}

export type Arc4GuardianLegacyOwnershipMirrorV1 =
  | ProjectedLegacyOwnershipMirrorV1
  | ProtectedArc4GuardianLegacyMirrorV1;

export type LegacyOwnershipMirrorFields = Pick<
  SaveStateV2,
  'codex' | 'customNames' | 'bioX' | 'scoutId'
>;

function protectedComposite(
  reason: Arc4GuardianLegacyMirrorProtectionReasonV1,
  evidence: Readonly<{
    version?: number;
    legacyCodexId?: string;
    speciesIds?: readonly string[];
  }> = {},
): ProtectedArc4GuardianLegacyMirrorV1 {
  return Object.freeze({ kind: 'protected', reason, ...evidence });
}

/** Complete registered compatibility projection for the two authorities that
 * can own living fauna today. Arc 4 order remains first; the Guardian carrier
 * follows in append-only receipt order. A duplicate species is contradictory
 * because the acquisition writer deduplicates across both sources. A shared
 * legacy `s{seed}` key with different species is unrepresentable rather than
 * silently choosing one. Absence of the Guardian namespace is exactly the
 * empty carrier and therefore returns the ordinary Arc 4 projection. */
export function projectArc4GuardianLegacyOwnershipMirrorV1(
  ownership: OwnershipStateV1,
  extensionsValue: unknown,
  resolver: OwnershipAddressResolver = SCENE_OWNERSHIP_ADDRESS_RESOLVER,
): Arc4GuardianLegacyOwnershipMirrorV1 {
  if (!isOwnershipStateV1(ownership)) return protectedComposite('arc4-unregistered');
  let arc4: ReturnType<typeof projectLegacyOwnershipMirror>;
  try { arc4 = projectLegacyOwnershipMirror(ownership); }
  catch { return protectedComposite('arc4-unregistered'); }
  if (arc4.kind === 'legacy-protected') {
    return protectedComposite('arc4-legacy-protected');
  }
  if (arc4.kind === 'unrepresentable') {
    return protectedComposite(`arc4-${arc4.reason}`);
  }
  const guardian = readGuardianAcquisitionCarrierV1(extensionsValue, resolver);
  if (guardian.kind === 'protected') {
    return protectedComposite(`guardian-${guardian.reason}`, guardian.version === undefined
      ? {}
      : { version: guardian.version });
  }
  const companionRead = readGuardianCompanionCarrierV1(extensionsValue);
  if (companionRead.kind === 'protected') {
    return protectedComposite(
      `guardian-companion-${companionRead.reason}`,
      companionRead.version === undefined ? {} : { version: companionRead.version },
    );
  }
  const companions = projectGuardianCompanionsV1({
    source: guardian.state,
    overlay: companionRead.state,
  });
  if (companions.kind === 'protected') {
    return protectedComposite(companions.reason === 'source-row-duplicated'
      ? 'guardian-companion-collision'
      : 'guardian-companion-detached');
  }
  if (arc4.codex.length + companions.creatures.length > MAX_LEGACY_OWNERSHIP_CODEX_ROWS) {
    return protectedComposite('legacy-capacity-exceeded');
  }

  const liveByRecord = new Map(companions.creatures.map((creature) => (
    [creature.acquisitionRecordId, creature] as const
  )));
  const tombstoneByRecord = new Map(companions.tombstones.map((tombstone) => (
    [tombstone.snapshot.acquisitionRecordId, tombstone] as const
  )));
  if (liveByRecord.size !== companions.creatures.length
    || tombstoneByRecord.size !== companions.tombstones.length
    || [...liveByRecord.keys()].some((recordId) => tombstoneByRecord.has(recordId))) {
    return protectedComposite('guardian-companion-collision');
  }

  const speciesOwners = new Set<string>();
  const legacyOwners = new Map<string, string>();
  for (const species of ownership.catalogSpecies) {
    const legacyCodexId = `s${species.genome.seed}`;
    speciesOwners.add(species.speciesId);
    legacyOwners.set(legacyCodexId, species.speciesId);
  }
  const codex = [...arc4.codex];
  const customNames = [...arc4.customNames];
  try {
    for (const entry of guardian.state.entries) {
      const identity = canonicalGenomeIdentityV1(entry.catalogSpecies.genome);
      const speciesId = entry.acquisition.speciesId;
      const legacyCodexId = `s${identity.genome.seed}`;
      if (identity.speciesId !== speciesId
        || entry.catalogSpecies.speciesId !== speciesId
        || entry.creature.speciesId !== speciesId
        || entry.catalogSpecies.genomeIdentity !== identity.genomeIdentity
        || entry.creature.genomeIdentity !== identity.genomeIdentity) {
        return protectedComposite('guardian-projection-invalid');
      }
      if (speciesOwners.has(speciesId)) {
        return protectedComposite('ambiguous-species-identity', {
          legacyCodexId,
          speciesIds: Object.freeze([speciesId]),
        });
      }
      const priorSpeciesId = legacyOwners.get(legacyCodexId);
      if (priorSpeciesId !== undefined) {
        return protectedComposite('legacy-id-species-collision', {
          legacyCodexId,
          speciesIds: Object.freeze([priorSpeciesId, speciesId]),
        });
      }
      const live = liveByRecord.get(entry.acquisition.recordId);
      const tombstone = tombstoneByRecord.get(entry.acquisition.recordId);
      if ((live === undefined) === (tombstone === undefined)) {
        return protectedComposite('guardian-companion-detached');
      }
      speciesOwners.add(speciesId);
      legacyOwners.set(legacyCodexId, speciesId);
      if (tombstone !== undefined) continue;
      const row = projectLegacyGuardianIndividualCodexEntryV1(entry, live!);
      const rowIdentity = canonicalGenomeIdentityV1(row.g);
      if (row.id !== legacyCodexId || rowIdentity.speciesId !== speciesId) {
        return protectedComposite('guardian-projection-invalid');
      }
      const canonicalGenome = canonicalizeData(row.g);
      const canonicalWhere = canonicalizeData(row.where);
      if (!canonicalGenome || typeof canonicalGenome !== 'object' || Array.isArray(canonicalGenome)
        || (canonicalWhere !== null
          && (typeof canonicalWhere !== 'object' || Array.isArray(canonicalWhere)))) {
        return protectedComposite('guardian-projection-invalid');
      }
      codex.push(Object.freeze({
        legacyCodexId,
        g: canonicalGenome as Readonly<Record<string, CanonicalJson>>,
        f: row.from,
        w: canonicalWhere,
      }));
      if (entry.catalogSpecies.alias !== null) {
        customNames.push(Object.freeze([
          `c${legacyCodexId}`,
          entry.catalogSpecies.alias,
        ] as const));
      }
    }
  } catch {
    return protectedComposite('guardian-projection-invalid');
  }
  return Object.freeze({
    kind: 'projected',
    codex: Object.freeze(codex),
    customNames: Object.freeze(customNames),
    bioX: arc4.bioX,
    scoutId: arc4.scoutId,
  });
}

interface ProjectedGuardianLegacyCompanionSliceV1 {
  readonly kind: 'projected';
  /** Every immutable Guardian-owned legacy id, including lost/tombstoned rows. */
  readonly ownedLegacyCodexIds: readonly string[];
  readonly identities: readonly Readonly<{
    legacyCodexId: string;
    speciesId: string;
  }>[];
  /** Exact semantic rows used by the fixed-point matcher. */
  readonly codex: ProjectedLegacyOwnershipMirrorV1['codex'];
  /** Complete v4 rows used by the detached slice stager. */
  readonly codexRows: readonly (readonly [string, CodexEntry])[];
  readonly customNames: ProjectedLegacyOwnershipMirrorV1['customNames'];
}

type GuardianLegacyCompanionSliceProjectionV1 =
  | ProjectedGuardianLegacyCompanionSliceV1
  | ProtectedArc4GuardianLegacyMirrorV1;

/** Project only the separately-carried Guardian/Titan compatibility rows.
 * This deliberately has no Arc 4/5 merge policy; callers either compare the
 * owned slice or merge it over a separately validated Arc 5 authority. */
function projectGuardianLegacyCompanionSliceV1(
  extensionsValue: unknown,
  resolver: OwnershipAddressResolver,
): GuardianLegacyCompanionSliceProjectionV1 {
  const guardian = readGuardianAcquisitionCarrierV1(extensionsValue, resolver);
  if (guardian.kind === 'protected') {
    return protectedComposite(`guardian-${guardian.reason}`, guardian.version === undefined
      ? {}
      : { version: guardian.version });
  }
  const companionRead = readGuardianCompanionCarrierV1(extensionsValue);
  if (companionRead.kind === 'protected') {
    return protectedComposite(
      `guardian-companion-${companionRead.reason}`,
      companionRead.version === undefined ? {} : { version: companionRead.version },
    );
  }
  const companions = projectGuardianCompanionsV1({
    source: guardian.state,
    overlay: companionRead.state,
  });
  if (companions.kind === 'protected') {
    return protectedComposite(companions.reason === 'source-row-duplicated'
      ? 'guardian-companion-collision'
      : 'guardian-companion-detached');
  }

  const liveByRecord = new Map(companions.creatures.map((creature) => (
    [creature.acquisitionRecordId, creature] as const
  )));
  const tombstoneByRecord = new Map(companions.tombstones.map((tombstone) => (
    [tombstone.snapshot.acquisitionRecordId, tombstone] as const
  )));
  if (liveByRecord.size !== companions.creatures.length
    || tombstoneByRecord.size !== companions.tombstones.length
    || [...liveByRecord.keys()].some((recordId) => tombstoneByRecord.has(recordId))) {
    return protectedComposite('guardian-companion-collision');
  }

  const speciesOwners = new Set<string>();
  const legacyOwners = new Map<string, string>();
  const ownedLegacyCodexIds: string[] = [];
  const identities: Array<Readonly<{ legacyCodexId: string; speciesId: string }>> = [];
  const codex: ProjectedLegacyOwnershipMirrorV1['codex'][number][] = [];
  const codexRows: Array<readonly [string, CodexEntry]> = [];
  const customNames: ProjectedLegacyOwnershipMirrorV1['customNames'][number][] = [];
  try {
    for (const entry of guardian.state.entries) {
      const identity = canonicalGenomeIdentityV1(entry.catalogSpecies.genome);
      const speciesId = entry.acquisition.speciesId;
      const legacyCodexId = `s${identity.genome.seed}`;
      if (identity.speciesId !== speciesId
        || entry.catalogSpecies.speciesId !== speciesId
        || entry.creature.speciesId !== speciesId
        || entry.catalogSpecies.genomeIdentity !== identity.genomeIdentity
        || entry.creature.genomeIdentity !== identity.genomeIdentity) {
        return protectedComposite('guardian-projection-invalid');
      }
      if (speciesOwners.has(speciesId)) {
        return protectedComposite('ambiguous-species-identity', {
          legacyCodexId,
          speciesIds: Object.freeze([speciesId]),
        });
      }
      const priorSpeciesId = legacyOwners.get(legacyCodexId);
      if (priorSpeciesId !== undefined) {
        return protectedComposite('legacy-id-species-collision', {
          legacyCodexId,
          speciesIds: Object.freeze([priorSpeciesId, speciesId]),
        });
      }
      const live = liveByRecord.get(entry.acquisition.recordId);
      const tombstone = tombstoneByRecord.get(entry.acquisition.recordId);
      if ((live === undefined) === (tombstone === undefined)) {
        return protectedComposite('guardian-companion-detached');
      }
      speciesOwners.add(speciesId);
      legacyOwners.set(legacyCodexId, speciesId);
      ownedLegacyCodexIds.push(legacyCodexId);
      identities.push(Object.freeze({ legacyCodexId, speciesId }));
      if (tombstone !== undefined) continue;

      const row = projectLegacyGuardianIndividualCodexEntryV1(entry, live!);
      const rowIdentity = canonicalGenomeIdentityV1(row.g);
      if (row.id !== legacyCodexId || rowIdentity.speciesId !== speciesId) {
        return protectedComposite('guardian-projection-invalid');
      }
      const canonicalGenome = canonicalizeData(row.g);
      const canonicalWhere = canonicalizeData(row.where);
      if (!canonicalGenome || typeof canonicalGenome !== 'object' || Array.isArray(canonicalGenome)
        || (canonicalWhere !== null
          && (typeof canonicalWhere !== 'object' || Array.isArray(canonicalWhere)))) {
        return protectedComposite('guardian-projection-invalid');
      }
      codex.push(Object.freeze({
        legacyCodexId,
        g: canonicalGenome as Readonly<Record<string, CanonicalJson>>,
        f: row.from,
        w: canonicalWhere,
      }));
      codexRows.push(Object.freeze([legacyCodexId, row] as const));
      if (entry.catalogSpecies.alias !== null) {
        customNames.push(Object.freeze([
          `c${legacyCodexId}`,
          entry.catalogSpecies.alias,
        ] as const));
      }
    }
  } catch {
    return protectedComposite('guardian-projection-invalid');
  }
  return Object.freeze({
    kind: 'projected',
    ownedLegacyCodexIds: Object.freeze(ownedLegacyCodexIds),
    identities: Object.freeze(identities),
    codex: Object.freeze(codex),
    codexRows: Object.freeze(codexRows),
    customNames: Object.freeze(customNames),
  });
}

function ownLegacyField(value: unknown, key: keyof LegacyOwnershipMirrorFields): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('legacy compatibility fields must be an object');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('legacy compatibility fields must be plain data');
  }
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !('value' in descriptor) || descriptor.get !== undefined
    || descriptor.set !== undefined || descriptor.enumerable !== true) {
    throw new TypeError(`legacy compatibility ${key} must be an own data field`);
  }
  return descriptor.value;
}

function canonicalObject(
  value: CanonicalJson,
  label: string,
): Readonly<Record<string, CanonicalJson>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Readonly<Record<string, CanonicalJson>>;
}

/** Semantic fixed-point check for the exact composite projection. Unrelated
 * custom-name keys remain outside this ownership boundary; Compendium rows,
 * Arc 4 Biosphere progress, and Scout identity admit no arbitrary extras. */
export function arc4GuardianLegacyOwnershipMirrorMatchesV1(
  ownership: OwnershipStateV1,
  extensionsValue: unknown,
  legacy: LegacyOwnershipMirrorFields,
  resolver: OwnershipAddressResolver = SCENE_OWNERSHIP_ADDRESS_RESOLVER,
): boolean {
  try {
    const mirror = projectArc4GuardianLegacyOwnershipMirrorV1(
      ownership,
      extensionsValue,
      resolver,
    );
    if (mirror.kind !== 'projected') return false;
    const rawCodex = canonicalizeData(ownLegacyField(legacy, 'codex'));
    const rawNames = canonicalizeData(ownLegacyField(legacy, 'customNames'));
    const rawBioX = canonicalizeData(ownLegacyField(legacy, 'bioX'));
    const rawScout = canonicalizeData(ownLegacyField(legacy, 'scoutId'));
    if (!Array.isArray(rawCodex) || !Array.isArray(rawNames) || !Array.isArray(rawBioX)
      || (rawScout !== null && typeof rawScout !== 'string')) return false;
    const actualCodex = rawCodex.map((candidate, index) => {
      if (!Array.isArray(candidate) || candidate.length !== 2 || typeof candidate[0] !== 'string') {
        throw new TypeError(`legacy composite codex pair ${index} is invalid`);
      }
      const entry = canonicalObject(candidate[1], `legacy composite codex entry ${index}`);
      if (!Object.prototype.hasOwnProperty.call(entry, 'id')
        || !Object.prototype.hasOwnProperty.call(entry, 'g')
        || !Object.prototype.hasOwnProperty.call(entry, 'from')
        || !Object.prototype.hasOwnProperty.call(entry, 'where')
        || entry.id !== candidate[0]
        || typeof entry.from !== 'string') {
        throw new TypeError(`legacy composite codex entry ${index} is invalid`);
      }
      const genome = canonicalObject(entry.g!, `legacy composite genome ${index}`);
      const where = entry.where === null
        ? null
        : canonicalObject(entry.where!, `legacy composite location ${index}`);
      return Object.freeze({
        legacyCodexId: candidate[0], g: genome, f: entry.from, w: where,
      });
    });
    const ownedNameKeys = new Set(mirror.codex.map(({ legacyCodexId }) => `c${legacyCodexId}`));
    const actualOwnedNames = rawNames.filter((candidate, index): candidate is CanonicalJson[] => {
      if (!Array.isArray(candidate) || candidate.length !== 2
        || typeof candidate[0] !== 'string' || typeof candidate[1] !== 'string') {
        throw new TypeError(`legacy composite name row ${index} is invalid`);
      }
      return ownedNameKeys.has(candidate[0]);
    });
    return canonicalJson(actualCodex) === canonicalJson(mirror.codex)
      && canonicalJson(actualOwnedNames) === canonicalJson(mirror.customNames)
      && canonicalJson(rawBioX) === canonicalJson(mirror.bioX)
      && rawScout === mirror.scoutId;
  } catch {
    return false;
  }
}

/** Verify only the Guardian-owned Compendium slice against the current
 * acquisition + mutable companion carriers. Arc 5 may legitimately change
 * its own compatibility rows while the immutable Arc 4 source remains
 * unchanged, so post-Guardian-combat verification must not demand a full
 * Arc-4 mirror fixed point. Live Guardian rows must match exactly, tombstones
 * must be absent, and no Guardian-owned alias key may be duplicated or left
 * behind. Unrelated Arc 4/5 rows remain outside this narrow check. */
export function guardianLegacyCompanionSliceMatchesV1(
  extensionsValue: unknown,
  legacy: Pick<LegacyOwnershipMirrorFields, 'codex' | 'customNames'>,
  resolver: OwnershipAddressResolver = SCENE_OWNERSHIP_ADDRESS_RESOLVER,
): boolean {
  try {
    const projection = projectGuardianLegacyCompanionSliceV1(extensionsValue, resolver);
    if (projection.kind !== 'projected') return false;
    const guardianIds = new Set(projection.ownedLegacyCodexIds);

    const rawCodex = canonicalizeData(ownLegacyField(legacy, 'codex'));
    const rawNames = canonicalizeData(ownLegacyField(legacy, 'customNames'));
    if (!Array.isArray(rawCodex) || !Array.isArray(rawNames)) return false;
    const actualCodex = rawCodex.flatMap((candidate, index) => {
      if (!Array.isArray(candidate) || candidate.length !== 2
        || typeof candidate[0] !== 'string') {
        throw new TypeError(`Guardian slice codex pair ${index} is invalid`);
      }
      if (!guardianIds.has(candidate[0])) return [];
      const entry = canonicalObject(candidate[1], `Guardian slice codex entry ${index}`);
      if (entry.id !== candidate[0] || typeof entry.from !== 'string'
        || !Object.prototype.hasOwnProperty.call(entry, 'g')
        || !Object.prototype.hasOwnProperty.call(entry, 'where')) {
        throw new TypeError(`Guardian slice codex entry ${index} is invalid`);
      }
      return [Object.freeze({
        legacyCodexId: candidate[0],
        g: canonicalObject(entry.g!, `Guardian slice actual genome ${index}`),
        f: entry.from,
        w: entry.where === null
          ? null
          : canonicalObject(entry.where!, `Guardian slice actual location ${index}`),
      })];
    });
    const ownedNameKeys = new Set([...guardianIds].map((id) => `c${id}`));
    const actualNames = rawNames.filter((candidate, index): candidate is CanonicalJson[] => {
      if (!Array.isArray(candidate) || candidate.length !== 2
        || typeof candidate[0] !== 'string' || typeof candidate[1] !== 'string') {
        throw new TypeError(`Guardian slice name row ${index} is invalid`);
      }
      return ownedNameKeys.has(candidate[0]);
    });
    return canonicalJson(actualCodex) === canonicalJson(projection.codex)
      && canonicalJson(actualNames) === canonicalJson(projection.customNames);
  } catch {
    return false;
  }
}

export type GuardianLegacyCompanionSliceStageProtectionReasonV1 =
  | Arc4GuardianLegacyMirrorProtectionReasonV1
  | 'arc5-unregistered'
  | 'arc5-legacy-protected'
  | 'legacy-source-invalid';

export type GuardianLegacyCompanionSliceStageV1<
  T extends LegacyOwnershipMirrorFields = LegacyOwnershipMirrorFields,
> =
  | Readonly<{
    readonly kind: 'staged';
    readonly candidate: T;
    readonly changed: boolean;
  }>
  | Readonly<{
    readonly kind: 'protected';
    readonly reason: GuardianLegacyCompanionSliceStageProtectionReasonV1;
    readonly version?: number;
    readonly legacyCodexId?: string;
    readonly speciesIds?: readonly string[];
  }>;

function protectedGuardianSliceStage<T extends LegacyOwnershipMirrorFields>(
  reason: GuardianLegacyCompanionSliceStageProtectionReasonV1,
  evidence: Readonly<{
    version?: number;
    legacyCodexId?: string;
    speciesIds?: readonly string[];
  }> = {},
): GuardianLegacyCompanionSliceStageV1<T> {
  return Object.freeze({ kind: 'protected', reason, ...evidence });
}

/** Reconcile only Guardian/Titan-owned v4 Compendium rows over an exact,
 * separately validated Arc 5 authority. Every unrelated Codex row, nickname,
 * Biosphere value, Scout pointer, and outer save field is retained byte-for-
 * byte in a detached candidate. Immutable Guardian ids are removed before the
 * current live overlay is appended; tombstones therefore cannot resurrect.
 * Any Arc 5/Guardian species or legacy-id collision protects instead of
 * choosing an owner. */
export function stageGuardianLegacyCompanionSliceV1<
  T extends LegacyOwnershipMirrorFields,
>(input: Readonly<{
  readonly source: T;
  readonly ownership: OwnershipStateV2;
  readonly extensions: unknown;
  readonly resolver?: OwnershipAddressResolver;
}>): GuardianLegacyCompanionSliceStageV1<T> {
  try {
    if (!isOwnershipStateV2(input?.ownership)) {
      return protectedGuardianSliceStage<T>('arc5-unregistered');
    }
    if (input.ownership.mode !== 'current') {
      return protectedGuardianSliceStage<T>('arc5-legacy-protected');
    }
    const resolver = input.resolver ?? SCENE_OWNERSHIP_ADDRESS_RESOLVER;
    const projection = projectGuardianLegacyCompanionSliceV1(input.extensions, resolver);
    if (projection.kind === 'protected') return projection;

    const arc5SpeciesOwners = new Set<string>();
    const arc5LegacyOwners = new Map<string, string>();
    for (const species of input.ownership.catalogSpecies) {
      const identity = canonicalGenomeIdentityV1(species.genome);
      if (identity.speciesId !== species.speciesId
        || identity.genomeIdentity !== species.genomeIdentity) {
        return protectedGuardianSliceStage<T>('arc5-unregistered');
      }
      const legacyCodexId = `s${identity.genome.seed}`;
      if (arc5SpeciesOwners.has(species.speciesId)) {
        return protectedGuardianSliceStage<T>('ambiguous-species-identity', {
          legacyCodexId,
          speciesIds: Object.freeze([species.speciesId]),
        });
      }
      const priorSpeciesId = arc5LegacyOwners.get(legacyCodexId);
      if (priorSpeciesId !== undefined) {
        return protectedGuardianSliceStage<T>('legacy-id-species-collision', {
          legacyCodexId,
          speciesIds: Object.freeze([priorSpeciesId, species.speciesId]),
        });
      }
      arc5SpeciesOwners.add(species.speciesId);
      arc5LegacyOwners.set(legacyCodexId, species.speciesId);
    }
    for (const identity of projection.identities) {
      if (arc5SpeciesOwners.has(identity.speciesId)) {
        return protectedGuardianSliceStage<T>('ambiguous-species-identity', {
          legacyCodexId: identity.legacyCodexId,
          speciesIds: Object.freeze([identity.speciesId]),
        });
      }
      const priorSpeciesId = arc5LegacyOwners.get(identity.legacyCodexId);
      if (priorSpeciesId !== undefined) {
        return protectedGuardianSliceStage<T>('legacy-id-species-collision', {
          legacyCodexId: identity.legacyCodexId,
          speciesIds: Object.freeze([priorSpeciesId, identity.speciesId]),
        });
      }
      arc5SpeciesOwners.add(identity.speciesId);
      arc5LegacyOwners.set(identity.legacyCodexId, identity.speciesId);
    }

    /* Validate the exact source arrays before cloning or filtering them. */
    const rawCodex = canonicalizeData(ownLegacyField(input.source, 'codex'));
    const rawNames = canonicalizeData(ownLegacyField(input.source, 'customNames'));
    const rawBioX = canonicalizeData(ownLegacyField(input.source, 'bioX'));
    const rawScout = canonicalizeData(ownLegacyField(input.source, 'scoutId'));
    if (!Array.isArray(rawCodex) || !Array.isArray(rawNames) || !Array.isArray(rawBioX)
      || (rawScout !== null && typeof rawScout !== 'string')) {
      return protectedGuardianSliceStage<T>('legacy-source-invalid');
    }
    const guardianIds = new Set(projection.ownedLegacyCodexIds);
    const guardianNameKeys = new Set(
      projection.ownedLegacyCodexIds.map((legacyCodexId) => `c${legacyCodexId}`),
    );
    const keptCodexIndices: number[] = [];
    for (let index = 0; index < rawCodex.length; index++) {
      const row = rawCodex[index];
      if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string'
        || !row[1] || typeof row[1] !== 'object' || Array.isArray(row[1])) {
        return protectedGuardianSliceStage<T>('legacy-source-invalid');
      }
      if (!guardianIds.has(row[0])) keptCodexIndices.push(index);
    }
    const keptNameIndices: number[] = [];
    for (let index = 0; index < rawNames.length; index++) {
      const row = rawNames[index];
      if (!Array.isArray(row) || row.length !== 2
        || typeof row[0] !== 'string' || typeof row[1] !== 'string') {
        return protectedGuardianSliceStage<T>('legacy-source-invalid');
      }
      if (!guardianNameKeys.has(row[0])) keptNameIndices.push(index);
    }
    if (keptCodexIndices.length + projection.codexRows.length
      > MAX_LEGACY_OWNERSHIP_CODEX_ROWS) {
      return protectedGuardianSliceStage<T>('legacy-capacity-exceeded');
    }

    const candidate = structuredClone(input.source) as T;
    const mutable = candidate as LegacyOwnershipMirrorFields;
    mutable.codex = [
      ...keptCodexIndices.map((index) => mutable.codex[index]!),
      ...projection.codexRows.map(([legacyCodexId, row]) => (
        [legacyCodexId, structuredClone(row)] as [string, CodexEntry]
      )),
    ];
    mutable.customNames = [
      ...keptNameIndices.map((index) => mutable.customNames[index]!),
      ...projection.customNames.map(([key, value]) => [key, value] as [string, string]),
    ];
    if (!guardianLegacyCompanionSliceMatchesV1(input.extensions, mutable, resolver)) {
      return protectedGuardianSliceStage<T>('guardian-projection-invalid');
    }
    const changed = canonicalJson(rawCodex) !== canonicalJson(canonicalizeData(mutable.codex))
      || canonicalJson(rawNames) !== canonicalJson(canonicalizeData(mutable.customNames));
    return Object.freeze({ kind: 'staged', candidate, changed });
  } catch {
    return protectedGuardianSliceStage<T>('legacy-source-invalid');
  }
}
