import { describe, expect, it } from 'vitest';
import * as acquisitionRoot from '../src/index.js';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createOwnershipSuccessorV1,
  ownershipContentId,
  ownershipStateDigestV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV1,
  type SpecimenLotId,
} from '../src/model.js';
import {
  BREED_ACTION_KIND_V2,
  createBredAcquisitionRecordV2,
  createBredCreatureInstanceV2,
  createCreatureInstanceV2,
  createCreatureTombstoneV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  createSpecimenLotV2,
  createSpecimenTombstoneV2,
  decodeOwnershipStateV2,
  encodeOwnershipStateV2,
  migrateOwnershipStateV1ToV2,
  ownershipSourceStateV1,
  ownershipStateDigestV2,
  type BredAcquisitionRecordV2,
  type OwnershipStateContentsV2,
  type OwnershipStateV2,
} from '../src/model-v2.js';
import {
  EMPTY_OWNERSHIP_DELTA_JSON_V2,
  MAX_OWNERSHIP_DELTA_ROWS_V2,
  OWNERSHIP_DELTA_SCHEMA_V2,
  OWNERSHIP_DELTA_VERSION_V2,
  applyOwnershipDeltaV2,
  decodeOwnershipDeltaV2,
  deriveOwnershipDeltaSuccessorV2,
  deriveOwnershipDeltaV2,
  encodeOwnershipDeltaV2,
  ownershipDeltaDigestV2,
  ownershipDeltaMirrorV2,
} from '../src/ownership-v2-internal.js';
import { canonicalJson, sha256Hex } from '../src/canonical.js';

interface Fixture {
  readonly source: OwnershipStateV1;
  readonly leftId: CreatureInstanceId;
  readonly rightId: CreatureInstanceId;
  readonly extraId: CreatureInstanceId;
  readonly lotId: SpecimenLotId;
}

function fixture(): Fixture {
  const fauna = [11, 22, 33].map((seed, index) => (
    canonicalGenomeIdentityV1({ seed, kingdom: 'fauna', form: index + 1 })
  ));
  const flora = canonicalGenomeIdentityV1({ seed: 44, kingdom: 'flora', form: 4 });
  const identities = [...fauna, flora];
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `delta-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `delta-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  }));
  const catalog = identities.map((identity, index) => createCatalogSpeciesV1({
    identity,
    alias: null,
    firstObservationId: discoveries[index]!.recordId,
  }));
  const creatureIds = ['left', 'right', 'extra'].map((label) => (
    ownershipContentId('creature', `delta-${label}`) as CreatureInstanceId
  ));
  const creatures = fauna.map((identity, index) => createCreatureInstanceV2({
    creatureId: creatureIds[index]!,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: null,
    origin: 'legacy',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: 0 },
    xp: null,
    hurt: null,
    fed: 80,
    brood: null,
    assignment: null,
    bond: null,
  }));
  const lotId = ownershipContentId('specimen', 'delta-flora') as SpecimenLotId;
  const specimen = createSpecimenLotV2({
    lotId,
    speciesId: flora.speciesId,
    kind: 'flora',
    quantity: 3,
    origin: 'legacy',
    acquisitionRecordId: discoveries[3]!.recordId,
  });
  return {
    source: createInitialOwnershipStateV1({
      catalogSpecies: catalog,
      discoveries,
      creatures,
      specimenLots: [specimen],
      biosphereProgress: [],
      legacyBioX: [],
      scoutCreatureId: creatureIds[0]!,
    }),
    leftId: creatureIds[0]!,
    rightId: creatureIds[1]!,
    extraId: creatureIds[2]!,
    lotId,
  };
}

function receipt(ordinal: number, label: string, actionKind: string) {
  return createF4ReceiptEvidenceV2({
    ordinal,
    actionKind,
    witnessDigest: sha256Hex(label),
  });
}

function contents(
  state: OwnershipStateV2,
  overrides: Partial<OwnershipStateContentsV2> = {},
): OwnershipStateContentsV2 {
  return {
    source: ownershipSourceStateV1(state),
    bredAcquisitions: state.bredAcquisitions,
    creatures: state.creatures,
    creatureTombstones: state.creatureTombstones,
    specimenLots: state.specimenLots,
    specimenTombstones: state.specimenTombstones,
    scoutCreatureId: state.scoutCreatureId,
    ...overrides,
  };
}

function breed(
  state: OwnershipStateV2,
  ordinal: number,
  parentIds: readonly [CreatureInstanceId, CreatureInstanceId],
  parentSeeds: readonly [number, number],
  childSeed: number,
): Readonly<{
  acquisition: BredAcquisitionRecordV2;
  child: ReturnType<typeof createBredCreatureInstanceV2>;
}> {
  const genome = {
    seed: childSeed,
    kingdom: 'fauna',
    form: 9,
    gen: 1,
    parents: parentSeeds,
  };
  const identity = canonicalGenomeIdentityV1(genome);
  const acquisition = createBredAcquisitionRecordV2({
    speciesId: identity.speciesId,
    parentCreatureIds: parentIds,
    parentSeeds,
    receipt: receipt(ordinal, `breed-${ordinal}`, BREED_ACTION_KIND_V2),
  });
  return Object.freeze({
    acquisition,
    child: createBredCreatureInstanceV2({
      acquisition,
      genome,
      generation: 1,
      nickname: `Child ${ordinal}`,
      xp: 0,
      hurt: 0,
      fed: 50,
      brood: 0,
      assignment: null,
      bond: null,
    }),
  });
}

function complexTarget(): Readonly<{
  source: OwnershipStateV1;
  migrated: OwnershipStateV2;
  bred: OwnershipStateV2;
  target: OwnershipStateV2;
}> {
  const base = fixture();
  const migrated = migrateOwnershipStateV1ToV2(base.source);
  const firstBreed = breed(migrated, 100, [base.leftId, base.rightId], [11, 22], 55);
  const changedRight = createCreatureInstanceV2({
    ...migrated.creatures.find((row) => row.creatureId === base.rightId)!,
    nickname: 'Mira',
    xp: 1,
  });
  const changedLot = createSpecimenLotV2({ ...migrated.specimenLots[0]!, quantity: 2 });
  const bred = createOwnershipSuccessorV2(migrated, contents(migrated, {
    bredAcquisitions: [firstBreed.acquisition],
    creatures: [
      ...migrated.creatures.filter((row) => row.creatureId !== base.rightId),
      changedRight,
      firstBreed.child,
    ],
    specimenLots: [changedLot],
    scoutCreatureId: firstBreed.child.creatureId,
  }));

  const secondBreed = breed(bred, 101, [base.rightId, base.extraId], [22, 33], 66);
  const disposition = receipt(102, 'atomic-disposition', 'owned-disposition');
  const left = bred.creatures.find((row) => row.creatureId === base.leftId)!;
  const firstChild = bred.creatures.find((row) => (
    row.acquisitionRecordId === firstBreed.acquisition.recordId
  ))!;
  const target = createOwnershipSuccessorV2(bred, contents(bred, {
    bredAcquisitions: [firstBreed.acquisition, secondBreed.acquisition],
    creatures: [
      ...bred.creatures.filter((row) => (
        row.creatureId !== left.creatureId && row.creatureId !== firstChild.creatureId
      )),
      secondBreed.child,
    ],
    creatureTombstones: [
      createCreatureTombstoneV2(left, disposition),
      createCreatureTombstoneV2(firstChild, disposition),
    ],
    specimenLots: [],
    specimenTombstones: [createSpecimenTombstoneV2(changedLot, disposition)],
    scoutCreatureId: null,
  }));
  return Object.freeze({ source: base.source, migrated, bred, target });
}

function parsedDelta(delta: ReturnType<typeof deriveOwnershipDeltaV2>): {
  schema: string;
  version: number;
  rows: Array<Record<string, unknown>>;
} {
  return JSON.parse(encodeOwnershipDeltaV2(delta)) as {
    schema: string;
    version: number;
    rows: Array<Record<string, unknown>>;
  };
}

describe('@cf/domain-acquisition — compact Arc 5 ownership V2 delta', () => {
  it('keeps empty bytes independent of Arc 4 row volume and reconstructs at any valid target revision', () => {
    const source = fixture().source;
    const migrated = migrateOwnershipStateV1ToV2(source);
    const delta = deriveOwnershipDeltaV2(source, migrated);
    expect(ownershipDeltaMirrorV2(delta)).toMatchObject({
      schema: OWNERSHIP_DELTA_SCHEMA_V2,
      version: OWNERSHIP_DELTA_VERSION_V2,
      rows: [],
    });
    expect(encodeOwnershipDeltaV2(delta)).toBe(EMPTY_OWNERSHIP_DELTA_JSON_V2);
    expect(ownershipDeltaDigestV2(delta)).toBe(sha256Hex(EMPTY_OWNERSHIP_DELTA_JSON_V2));

    const other = createInitialOwnershipStateV1({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    });
    expect(encodeOwnershipDeltaV2(
      deriveOwnershipDeltaV2(other, migrateOwnershipStateV1ToV2(other)),
    )).toBe(EMPTY_OWNERSHIP_DELTA_JSON_V2);

    const loaded = decodeOwnershipDeltaV2(EMPTY_OWNERSHIP_DELTA_JSON_V2);
    const reconstructed = applyOwnershipDeltaV2(source, source.revision + 5, loaded);
    expect(reconstructed.revision).toBe(source.revision + 5);
    expect(ownershipSourceStateV1(reconstructed)).toBe(source);
    expect(encodeOwnershipDeltaV2(deriveOwnershipDeltaV2(source, reconstructed)))
      .toBe(EMPTY_OWNERSHIP_DELTA_JSON_V2);
  });

  it('projects every logical row kind in fixed rank/ID order without duplicating Arc 4 immutable rows', () => {
    const { source, target } = complexTarget();
    const delta = deriveOwnershipDeltaV2(source, target);
    const mirror = ownershipDeltaMirrorV2(delta);
    expect(mirror.rows.map((row) => row.kind)).toEqual([
      'bred-acquisition',
      'bred-acquisition',
      'source-creature-live',
      'source-creature-tombstone',
      'bred-creature-live',
      'bred-creature-tombstone',
      'source-specimen-tombstone',
      'scout-override',
    ]);
    const sourceRows = parsedDelta(delta).rows.filter((row) => (
      String(row.kind).startsWith('source-')
    ));
    for (const row of sourceRows) {
      expect(row).not.toHaveProperty('speciesId');
      expect(row).not.toHaveProperty('genomeIdentity');
      expect(row).not.toHaveProperty('genome');
      expect(row).not.toHaveProperty('origin');
      expect(row).not.toHaveProperty('acquisitionRecordId');
      expect(row).not.toHaveProperty('lineage');
      expect(row).not.toHaveProperty('snapshot');
      expect(row).not.toHaveProperty('creature');
      expect(row).not.toHaveProperty('specimen');
      expect(row).not.toHaveProperty('tombstone');
    }
    expect(sourceRows.find((row) => row.kind === 'source-specimen-tombstone'))
      .toMatchObject({ quantity: 2 });
    expect(mirror.rows.at(-1)).toEqual({ kind: 'scout-override', scoutCreatureId: null });

    const raw = encodeOwnershipDeltaV2(delta);
    const loaded = decodeOwnershipDeltaV2(raw);
    const reconstructed = applyOwnershipDeltaV2(source, target.revision, loaded);
    expect(encodeOwnershipDeltaV2(loaded)).toBe(raw);
    expect(ownershipDeltaDigestV2(loaded)).toBe(sha256Hex(raw));
    expect(ownershipStateDigestV2(reconstructed)).toBe(ownershipStateDigestV2(target));
    expect(ownershipSourceStateV1(reconstructed)).toBe(source);
    expect(encodeOwnershipDeltaV2(deriveOwnershipDeltaV2(source, reconstructed))).toBe(raw);
  });

  it('projects a changed live source specimen, bred live child, and explicit scout ID compactly', () => {
    const { source, bred } = complexTarget();
    const delta = deriveOwnershipDeltaV2(source, bred);
    expect(ownershipDeltaMirrorV2(delta).rows.map((row) => row.kind)).toEqual([
      'bred-acquisition',
      'source-creature-live',
      'bred-creature-live',
      'source-specimen-live',
      'scout-override',
    ]);
    const parsed = parsedDelta(delta);
    expect(parsed.rows.find((row) => row.kind === 'source-specimen-live'))
      .toEqual({ kind: 'source-specimen-live', lotId: fixture().lotId, quantity: 2 });
    const scout = parsed.rows.find((row) => row.kind === 'scout-override');
    expect(scout?.scoutCreatureId).toMatch(/^creature-v1:/u);
    const reconstructed = applyOwnershipDeltaV2(
      source, bred.revision, decodeOwnershipDeltaV2(encodeOwnershipDeltaV2(delta)),
    );
    expect(ownershipStateDigestV2(reconstructed)).toBe(ownershipStateDigestV2(bred));
  });

  it('requires exact source identity and exact registered +1 successor authority', () => {
    const { source, migrated, bred } = complexTarget();
    const equivalent = fixture().source;
    expect(ownershipStateDigestV1(equivalent)).toBe(ownershipStateDigestV1(source));
    expect(equivalent).not.toBe(source);
    expect(() => deriveOwnershipDeltaV2(equivalent, migrated)).toThrow(/exact registered Arc 4 source/u);
    expect(() => deriveOwnershipDeltaSuccessorV2(migrated, bred)).not.toThrow();

    const reloaded = decodeOwnershipStateV2(
      encodeOwnershipStateV2(bred), SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(() => deriveOwnershipDeltaSuccessorV2(migrated, reloaded))
      .toThrow(/exact registered V2 \+1 child/u);
    expect(() => deriveOwnershipDeltaSuccessorV2(bred, migrated))
      .toThrow(/exact registered V2 \+1 child/u);
  });

  it('rejects noncanonical ordering, entity conflicts, unknown fields, and noncanonical envelope bytes', () => {
    const { source, target } = complexTarget();
    const delta = deriveOwnershipDeltaV2(source, target);
    const parsed = parsedDelta(delta);
    [parsed.rows[0], parsed.rows[1]] = [parsed.rows[1]!, parsed.rows[0]!];
    expect(() => decodeOwnershipDeltaV2(canonicalJson(parsed)))
      .toThrow(/strict canonical order/u);

    const clean = parsedDelta(delta);
    const tombstone = clean.rows.find((row) => row.kind === 'source-creature-tombstone')!;
    const live: Record<string, unknown> = {
      ...tombstone, kind: 'source-creature-live',
    };
    delete live.disposition;
    clean.rows.push(live);
    const rank: Record<string, number> = {
      'bred-acquisition': 0,
      'source-creature-live': 1,
      'source-creature-tombstone': 2,
      'bred-creature-live': 3,
      'bred-creature-tombstone': 4,
      'source-specimen-live': 5,
      'source-specimen-tombstone': 6,
      'scout-override': 7,
    };
    clean.rows.sort((left, right) => {
      const ranked = rank[String(left.kind)]! - rank[String(right.kind)]!;
      if (ranked !== 0) return ranked;
      const id = (row: Record<string, unknown>) => String(
        row.creatureId ?? row.lotId
          ?? (row.acquisition as { recordId?: unknown } | undefined)?.recordId
          ?? (row.creature as { creatureId?: unknown } | undefined)?.creatureId
          ?? (row.tombstone as { creatureId?: unknown } | undefined)?.creatureId
          ?? '',
      );
      return id(left).localeCompare(id(right));
    });
    expect(() => decodeOwnershipDeltaV2(canonicalJson(clean)))
      .toThrow(/creature identity conflicts/u);

    const extra = parsedDelta(delta);
    extra.rows[0]!.extra = true;
    expect(() => decodeOwnershipDeltaV2(canonicalJson(extra))).toThrow(/unknown or missing fields/u);
    const canonical = encodeOwnershipDeltaV2(delta);
    const data = JSON.parse(canonical) as Record<string, unknown>;
    const nonCanonical = JSON.stringify({
      schema: data.schema, version: data.version, rows: data.rows,
    });
    expect(nonCanonical).not.toBe(canonical);
    expect(() => decodeOwnershipDeltaV2(nonCanonical)).toThrow(/canonical fixed point/u);
  });

  it('rejects redundant/unknown source projections and arbitrary unbacked bred rows at apply', () => {
    const source = fixture().source;
    const left = source.creatures[0]!;
    const redundantRaw = canonicalJson({
      schema: OWNERSHIP_DELTA_SCHEMA_V2,
      version: OWNERSHIP_DELTA_VERSION_V2,
      rows: [{
        kind: 'source-creature-live',
        creatureId: left.creatureId,
        nickname: left.nickname,
        xp: left.xp,
        hurt: left.hurt,
        fed: left.fed,
        brood: left.brood,
        assignment: left.assignment,
        bond: left.bond,
      }],
    });
    expect(() => applyOwnershipDeltaV2(
      source, source.revision, decodeOwnershipDeltaV2(redundantRaw),
    )).toThrow(/unchanged Arc 4 creature/u);

    const specimen = source.specimenLots[0]!;
    const redundantSpecimen = decodeOwnershipDeltaV2(canonicalJson({
      schema: OWNERSHIP_DELTA_SCHEMA_V2,
      version: OWNERSHIP_DELTA_VERSION_V2,
      rows: [{
        kind: 'source-specimen-live',
        lotId: specimen.lotId,
        quantity: specimen.quantity,
      }],
    }));
    expect(() => applyOwnershipDeltaV2(source, source.revision, redundantSpecimen))
      .toThrow(/unchanged Arc 4 specimen/u);

    const redundantScout = decodeOwnershipDeltaV2(canonicalJson({
      schema: OWNERSHIP_DELTA_SCHEMA_V2,
      version: OWNERSHIP_DELTA_VERSION_V2,
      rows: [{ kind: 'scout-override', scoutCreatureId: source.scoutCreatureId }],
    }));
    expect(() => applyOwnershipDeltaV2(source, source.revision, redundantScout))
      .toThrow(/unchanged Arc 4 scout/u);

    const unknownRaw = canonicalJson({
      schema: OWNERSHIP_DELTA_SCHEMA_V2,
      version: OWNERSHIP_DELTA_VERSION_V2,
      rows: [{
        kind: 'source-creature-live',
        creatureId: ownershipContentId('creature', 'delta-unknown'),
        nickname: 'Unknown', xp: null, hurt: null, fed: 1, brood: null,
        assignment: null, bond: null,
      }],
    });
    expect(() => applyOwnershipDeltaV2(
      source, source.revision, decodeOwnershipDeltaV2(unknownRaw),
    )).toThrow(/lacks exact Arc 4 identity/u);

    const complex = complexTarget();
    const bredDelta = parsedDelta(deriveOwnershipDeltaV2(complex.source, complex.bred));
    bredDelta.rows = bredDelta.rows.filter((row) => row.kind !== 'bred-acquisition');
    expect(() => applyOwnershipDeltaV2(
      complex.source,
      complex.bred.revision,
      decodeOwnershipDeltaV2(canonicalJson(bredDelta)),
    )).toThrow(/bred live creature lacks exact bred acquisition backing/u);

    const noChild = parsedDelta(deriveOwnershipDeltaV2(complex.source, complex.bred));
    noChild.rows = noChild.rows.filter((row) => row.kind !== 'bred-creature-live');
    expect(() => applyOwnershipDeltaV2(
      complex.source,
      complex.bred.revision,
      decodeOwnershipDeltaV2(canonicalJson(noChild)),
    )).toThrow(/bred acquisition requires exactly one backed child/u);
  });

  it('keeps acquisition IDs and tombstone ordinals bound to exact canonical receipt evidence', () => {
    const { source, target } = complexTarget();
    const acquisitionTamper = parsedDelta(deriveOwnershipDeltaV2(source, target));
    const acquisition = acquisitionTamper.rows.find((row) => row.kind === 'bred-acquisition')!;
    const provenance = (acquisition.acquisition as { provenance: {
      receipt: { witnessDigest: string };
    } }).provenance;
    provenance.receipt.witnessDigest = sha256Hex('different-breed-witness');
    expect(() => decodeOwnershipDeltaV2(canonicalJson(acquisitionTamper)))
      .toThrow(/not receipt-bound/u);

    const conflict = parsedDelta(deriveOwnershipDeltaV2(source, target));
    const sourceCreature = conflict.rows.find((row) => row.kind === 'source-creature-tombstone')!;
    const sourceSpecimen = conflict.rows.find((row) => row.kind === 'source-specimen-tombstone')!;
    const creatureDisposition = sourceCreature.disposition as { ordinal: number };
    const specimenDisposition = sourceSpecimen.disposition as {
      ordinal: number; witnessDigest: string;
    };
    specimenDisposition.ordinal = creatureDisposition.ordinal;
    specimenDisposition.witnessDigest = sha256Hex('conflicting-disposition');
    const decoded = decodeOwnershipDeltaV2(canonicalJson(conflict));
    expect(() => applyOwnershipDeltaV2(source, target.revision, decoded))
      .toThrow(/ordinal.*conflicting canonical evidence/u);
  });

  it('fails revision exhaustion, forged registrations, row overflow, malformed semantics, and public leakage closed', () => {
    const source = fixture().source;
    const empty = decodeOwnershipDeltaV2(EMPTY_OWNERSHIP_DELTA_JSON_V2);
    expect(() => applyOwnershipDeltaV2(source, -1, empty)).toThrow(/revision is invalid/u);
    const advanced = createOwnershipSuccessorV1(source, {
      catalogSpecies: source.catalogSpecies,
      discoveries: source.discoveries,
      creatures: source.creatures,
      specimenLots: source.specimenLots,
      biosphereProgress: source.biosphereProgress,
      legacyBioX: source.legacyBioX,
      scoutCreatureId: source.scoutCreatureId,
    });
    expect(() => applyOwnershipDeltaV2(advanced, source.revision, empty))
      .toThrow(/precedes its exact source/u);
    expect(() => applyOwnershipDeltaV2(
      source,
      source.revision,
      { ...empty },
    )).toThrow(/registered delta/u);

    const repeated = Array.from({ length: MAX_OWNERSHIP_DELTA_ROWS_V2 + 1 }, () => ({
      kind: 'scout-override', scoutCreatureId: null,
    }));
    expect(() => decodeOwnershipDeltaV2(canonicalJson({
      schema: OWNERSHIP_DELTA_SCHEMA_V2,
      version: OWNERSHIP_DELTA_VERSION_V2,
      rows: repeated,
    }))).toThrow(/array is too long|row bound/u);

    const malformedAssignment = decodeOwnershipDeltaV2(canonicalJson({
      schema: OWNERSHIP_DELTA_SCHEMA_V2,
      version: OWNERSHIP_DELTA_VERSION_V2,
      rows: [{
        kind: 'source-creature-live',
        creatureId: source.creatures[0]!.creatureId,
        nickname: 'Changed', xp: null, hurt: null, fed: 1, brood: null,
        assignment: { kind: 'unknown' }, bond: null,
      }],
    }));
    expect(() => applyOwnershipDeltaV2(source, source.revision, malformedAssignment))
      .toThrow(/assignment kind is invalid/u);

    for (const internal of [
      'OWNERSHIP_DELTA_SCHEMA_V2',
      'OWNERSHIP_DELTA_VERSION_V2',
      'MAX_OWNERSHIP_DELTA_ROWS_V2',
      'EMPTY_OWNERSHIP_DELTA_JSON_V2',
      'deriveOwnershipDeltaV2',
      'deriveOwnershipDeltaSuccessorV2',
      'ownershipDeltaMirrorV2',
      'encodeOwnershipDeltaV2',
      'decodeOwnershipDeltaV2',
      'applyOwnershipDeltaV2',
      'ownershipDeltaDigestV2',
    ]) expect(internal in acquisitionRoot, internal).toBe(false);
  });
});
