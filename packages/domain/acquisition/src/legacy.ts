/* Deterministic v1.8.9 ownership migration.

   The persistence adapter supplies already-sanitized, unique Codex rows. This
   module still treats that adapter as hostile data: it accepts exact bounded
   plain JSON only, performs no reward/event work, and never consults entropy,
   a clock, DOM, or ambient global state. */
import {
  OWNERSHIP_DATA_BUDGET,
  canonicalizeData,
  sha256Hex,
  utf8ByteLength,
  type CanonicalJson,
} from './canonical.js';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyBioXEvidenceV1,
  createLegacyDiscoveryRecordV1,
  createSpecimenLotV1,
  ownershipContentId,
  type CatalogSpeciesV1,
  type CompanionBondV1,
  type CreatureAssignmentV1,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type CreatureLineageV1,
  type DiscoveryRecordV1,
  type LegacyBioXEvidenceV1,
  type LegacyOwnershipSourceEvidenceV1,
  type OwnershipStateV1,
  type SpecimenLotV1,
} from './model.js';

export const MAX_LEGACY_OWNERSHIP_CODEX_ROWS = 1_500;
export const MAX_LEGACY_OWNERSHIP_NAMES = 5_000;
export const MAX_LEGACY_OWNERSHIP_BIOX_ROWS = 60_000;

export interface LegacyOwnershipCodexRowV1 {
  readonly legacyCodexId: string;
  readonly genome: CanonicalJson;
  readonly from: string;
  readonly legacyLocation: CanonicalJson | null;
  /** The knowledge-page name and the individual fauna name are independent
      even when a v1 save happened to source both from one `c${id}` key. */
  readonly catalogAlias: string | null;
  readonly faunaNickname: string | null;
}

export interface LegacyOwnershipBioXRowV1 {
  readonly legacyPlanetSeed: number;
  readonly used: number;
  readonly epochStamp: number;
}

export interface LegacyOwnershipInputV1 {
  readonly legacyEpoch: number;
  readonly codexRows: readonly LegacyOwnershipCodexRowV1[];
  readonly bioXRows: readonly LegacyOwnershipBioXRowV1[];
  readonly scoutCodexId: string | null;
}

export interface MigratedLegacyOwnershipV1 {
  readonly state: OwnershipStateV1;
  readonly sourceEvidence: LegacyOwnershipSourceEvidenceV1;
}

function object(value: CanonicalJson, label: string): Readonly<Record<string, CanonicalJson>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as Readonly<Record<string, CanonicalJson>>;
}

function exactKeys(value: Readonly<Record<string, CanonicalJson>>, wanted: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...wanted].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new TypeError(`${label} has unknown or missing fields`);
  }
}

function string(value: CanonicalJson, label: string, maximum: number, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== 'string' || value.length === 0 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function nullableName(value: CanonicalJson, label: string): string | null {
  return string(value, label, 24, true);
}

function finite(value: CanonicalJson, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  return value;
}

function sourceLineage(genome: Readonly<Record<string, CanonicalJson>>): CreatureLineageV1 {
  const generation = typeof genome.gen === 'number' && Number.isSafeInteger(genome.gen)
    && genome.gen >= 0 && genome.gen <= 1_000_000_000 ? genome.gen : 0;
  const parents = genome.parents;
  if (Array.isArray(parents) && parents.length === 2
    && parents.every((seed) => typeof seed === 'number' && Number.isSafeInteger(seed)
      && seed >= 0 && seed <= 0xFFFF_FFFF)) {
    return Object.freeze({
      kind: 'legacy-parent-seeds' as const,
      generation,
      parentSeeds: Object.freeze([parents[0] as number, parents[1] as number] as const),
    });
  }
  return Object.freeze({ kind: 'none' as const, generation });
}

function optionalNumber(
  genome: Readonly<Record<string, CanonicalJson>>,
  key: 'xp' | 'hurt' | 'fed' | 'brood',
): number | null {
  if (!Object.prototype.hasOwnProperty.call(genome, key)) return null;
  const value = genome[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`legacy creature ${key} is invalid`);
  }
  return value;
}

function optionalObject<T>(
  genome: Readonly<Record<string, CanonicalJson>>,
  key: 'assignment' | 'bond',
): T | null {
  if (!Object.prototype.hasOwnProperty.call(genome, key)) return null;
  const value = genome[key];
  if (value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`legacy creature ${key} is invalid`);
  }
  return value as T;
}

function bioXRelation(
  legacyEpoch: number,
  seed: number,
  used: number,
  stamp: number,
): LegacyBioXEvidenceV1['relation'] {
  const valid = Number.isSafeInteger(legacyEpoch) && legacyEpoch >= 0 && legacyEpoch <= 1_000_000_000
    && Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xFFFF_FFFF
    && Number.isSafeInteger(used) && used >= 0 && used <= 999
    && Number.isSafeInteger(stamp) && stamp >= 0 && stamp <= 1_000_000_000;
  if (!valid) return 'impossible';
  return stamp < legacyEpoch ? 'old' : stamp === legacyEpoch ? 'equal' : 'future';
}

/** Migrate every source row. Identical immutable genomes share one catalogue
    identity, but each legacy row still creates its own audit row and owned
    creature/specimen. No first-observation or free reward is synthesized. */
export function migrateLegacyOwnershipStateV1(input: LegacyOwnershipInputV1): MigratedLegacyOwnershipV1 {
  const canonical = object(canonicalizeData(input, Object.freeze({
    ...OWNERSHIP_DATA_BUDGET,
    maxArrayLength: MAX_LEGACY_OWNERSHIP_BIOX_ROWS,
    maxNodes: 500_000,
  })), 'legacy ownership input');
  exactKeys(canonical, ['legacyEpoch', 'codexRows', 'bioXRows', 'scoutCodexId'], 'legacy ownership input');
  const legacyEpoch = finite(canonical.legacyEpoch!, 'legacy epoch');
  if (!Array.isArray(canonical.codexRows)
    || canonical.codexRows.length > MAX_LEGACY_OWNERSHIP_CODEX_ROWS) {
    throw new RangeError('legacy ownership codex exceeds 1,500 rows');
  }
  if (!Array.isArray(canonical.bioXRows)
    || canonical.bioXRows.length > MAX_LEGACY_OWNERSHIP_BIOX_ROWS) {
    throw new RangeError('legacy ownership bioX exceeds 60,000 rows');
  }
  const scoutCodexId = canonical.scoutCodexId === null
    ? null : string(canonical.scoutCodexId!, 'legacy scout id', 96);

  const catalog = new Map<string, CatalogSpeciesV1>();
  const discoveries: DiscoveryRecordV1[] = [];
  const creatures: CreatureInstanceV1[] = [];
  const specimenLots: SpecimenLotV1[] = [];
  const sourceIds = new Set<string>();
  const creatureForSource = new Map<string, CreatureInstanceId>();

  canonical.codexRows.forEach((candidate, sourceIndex) => {
    const row = object(candidate, `legacy codex row ${sourceIndex}`);
    exactKeys(row, [
      'legacyCodexId', 'genome', 'from', 'legacyLocation', 'catalogAlias', 'faunaNickname',
    ], `legacy codex row ${sourceIndex}`);
    const legacyCodexId = string(row.legacyCodexId!, 'legacy codex id', 96)!;
    if (sourceIds.has(legacyCodexId)) throw new TypeError(`legacy codex repeats ${legacyCodexId}`);
    sourceIds.add(legacyCodexId);
    if (typeof row.from !== 'string' || row.from.length > 48
      || /[\u0000-\u001f\u007f]/u.test(row.from)) throw new TypeError('legacy discovery source is invalid');
    const identity = canonicalGenomeIdentityV1(row.genome);
    const recordId = ownershipContentId(
      'discovery',
      JSON.stringify(['legacy-v1.8.9', legacyCodexId, identity.speciesId]),
    ) as DiscoveryRecordV1['recordId'];
    const firstForSpecies = !catalog.has(identity.speciesId);
    const discovery = createLegacyDiscoveryRecordV1({
      recordId,
      speciesId: identity.speciesId,
      legacyCodexId,
      legacySourceIndex: sourceIndex,
      from: row.from,
      legacyLocation: row.legacyLocation ?? null,
      firstForSpecies,
    });
    discoveries.push(discovery);
    if (firstForSpecies) {
      catalog.set(identity.speciesId, createCatalogSpeciesV1({
        identity,
        alias: nullableName(row.catalogAlias!, 'legacy catalogue alias'),
        firstObservationId: recordId,
      }));
    }
    const genome = object(row.genome!, 'legacy genome');
    if (identity.kingdom === 'fauna') {
      const creatureId = ownershipContentId(
        'creature',
        JSON.stringify(['legacy-v1.8.9', legacyCodexId, identity.speciesId]),
      ) as CreatureInstanceId;
      creatures.push(createCreatureInstanceV1({
        creatureId,
        speciesId: identity.speciesId,
        genomeIdentity: identity.genomeIdentity,
        genome: identity.genome,
        nickname: nullableName(row.faunaNickname!, 'legacy fauna nickname'),
        origin: 'legacy',
        acquisitionRecordId: recordId,
        lineage: sourceLineage(genome),
        xp: optionalNumber(genome, 'xp'),
        hurt: optionalNumber(genome, 'hurt'),
        fed: optionalNumber(genome, 'fed'),
        brood: optionalNumber(genome, 'brood'),
        assignment: optionalObject<CreatureAssignmentV1>(genome, 'assignment'),
        bond: optionalObject<CompanionBondV1>(genome, 'bond'),
      }));
      creatureForSource.set(legacyCodexId, creatureId);
    } else {
      specimenLots.push(createSpecimenLotV1({
        lotId: ownershipContentId(
          'specimen',
          JSON.stringify(['legacy-v1.8.9', legacyCodexId, identity.speciesId]),
        ) as SpecimenLotV1['lotId'],
        speciesId: identity.speciesId,
        kind: identity.kingdom,
        quantity: 1,
        origin: 'legacy',
        acquisitionRecordId: recordId,
      }));
    }
  });

  const seenBioX = new Set<number>();
  const legacyBioX = canonical.bioXRows.map((candidate, index): LegacyBioXEvidenceV1 => {
    const row = object(candidate, `legacy bioX row ${index}`);
    exactKeys(row, ['legacyPlanetSeed', 'used', 'epochStamp'], `legacy bioX row ${index}`);
    const legacyPlanetSeed = finite(row.legacyPlanetSeed!, 'legacy bioX planet seed');
    const used = finite(row.used!, 'legacy bioX used');
    const epochStamp = finite(row.epochStamp!, 'legacy bioX epoch stamp');
    if (seenBioX.has(legacyPlanetSeed)) throw new TypeError('legacy bioX repeats a planet seed');
    seenBioX.add(legacyPlanetSeed);
    return createLegacyBioXEvidenceV1({
      legacyPlanetSeed,
      used,
      epochStamp,
      relation: bioXRelation(legacyEpoch, legacyPlanetSeed, used, epochStamp),
      canonicalWorldKey: null,
    });
  });

  const canonicalSource = JSON.stringify(canonical);
  const sourceEvidence: LegacyOwnershipSourceEvidenceV1 = Object.freeze({
    schema: 'cf-v1.8.9-ownership-source/v1',
    digest: sha256Hex(canonicalSource),
    jsonBytes: utf8ByteLength(canonicalSource),
    codexRows: canonical.codexRows.length,
    uniqueSpecies: catalog.size,
    bioXRows: canonical.bioXRows.length,
    scoutCodexId,
  });
  if (scoutCodexId !== null && !creatureForSource.has(scoutCodexId)) {
    throw new TypeError('legacy field scout does not reference an owned fauna row');
  }
  const state = createInitialOwnershipStateV1({
    catalogSpecies: [...catalog.values()],
    discoveries,
    creatures,
    specimenLots,
    biosphereProgress: [],
    legacyBioX,
    scoutCreatureId: scoutCodexId === null ? null : creatureForSource.get(scoutCodexId)!,
  });
  return Object.freeze({ state, sourceEvidence });
}
