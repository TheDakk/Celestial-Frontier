import { describe, expect, it } from 'vitest';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createCreatureInstanceV1,
  createOwnershipSuccessorV1,
  createSpecimenLotV1,
  ownershipContentId,
  ownershipStateDigestV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV1,
  type SpecimenLotId,
} from '../src/model.js';
import { sha256Hex } from '../src/canonical.js';
import {
  BREED_ACTION_KIND_V2,
  LAST_USABLE_F4_RECEIPT_ORDINAL_V2,
  bredAcquisitionIdV2,
  createBredAcquisitionRecordV2,
  createBredCreatureInstanceV2,
  createCreatureTombstoneV2,
  createCreatureInstanceV2,
  createF4ReceiptEvidenceV2,
  createOwnershipSuccessorV2,
  createOwnershipSourceSuccessorV2,
  createSpecimenTombstoneV2,
  decodeOwnershipStateV2,
  encodeOwnershipStateV2,
  isOwnershipStateV2,
  isOwnershipSuccessorV2,
  localCreatureIdV2,
  migrateOwnershipStateV1ToV2,
  ownershipStateDigestV2,
  ownershipStateMirrorV2,
  ownershipSourceStateV1,
  registerOwnershipStateMirrorV2,
  type BredAcquisitionRecordV2,
  type F4ReceiptEvidenceV2,
  type OwnershipStateContentsV2,
  type OwnershipStateV2,
} from '../src/model-v2.js';
import {
  createOwnershipSourceProjectionSuccessorV2,
} from '../src/ownership-v2-internal.js';

interface Fixture {
  readonly source: OwnershipStateV1;
  readonly leftId: CreatureInstanceId;
  readonly twinId: CreatureInstanceId;
  readonly rightId: CreatureInstanceId;
  readonly lotId: SpecimenLotId;
}

function fixture(): Fixture {
  const fauna = canonicalGenomeIdentityV1({ seed: 11, kingdom: 'fauna', form: 3 });
  const otherFauna = canonicalGenomeIdentityV1({ seed: 22, kingdom: 'fauna', form: 7 });
  const flora = canonicalGenomeIdentityV1({ seed: 29, kingdom: 'flora', form: 1 });
  const discovery = (witness: string, speciesId: typeof fauna.speciesId, index: number, first: boolean) => (
    createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', witness) as DiscoveryRecordId,
      speciesId,
      legacyCodexId: witness,
      legacySourceIndex: index,
      from: 'Legacy',
      legacyLocation: null,
      firstForSpecies: first,
    })
  );
  const leftDiscovery = discovery('v2-left', fauna.speciesId, 0, true);
  const twinDiscovery = discovery('v2-twin', fauna.speciesId, 1, false);
  const rightDiscovery = discovery('v2-right', otherFauna.speciesId, 2, true);
  const floraDiscovery = discovery('v2-flora', flora.speciesId, 3, true);
  const faunaSpecies = createCatalogSpeciesV1({
    identity: fauna, alias: 'Twins', firstObservationId: leftDiscovery.recordId,
  });
  const floraSpecies = createCatalogSpeciesV1({
    identity: flora, alias: null, firstObservationId: floraDiscovery.recordId,
  });
  const otherFaunaSpecies = createCatalogSpeciesV1({
    identity: otherFauna, alias: null, firstObservationId: rightDiscovery.recordId,
  });
  const leftId = ownershipContentId('creature', 'v2-left') as CreatureInstanceId;
  const twinId = ownershipContentId('creature', 'v2-twin') as CreatureInstanceId;
  const rightId = ownershipContentId('creature', 'v2-right') as CreatureInstanceId;
  const common = (identity: typeof fauna) => ({
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname: null,
    origin: 'legacy' as const,
    xp: null,
    hurt: null,
    fed: 80,
    brood: null,
    assignment: null,
    bond: null,
  });
  const left = createCreatureInstanceV1({
    ...common(fauna),
    creatureId: leftId,
    acquisitionRecordId: leftDiscovery.recordId,
    lineage: { kind: 'legacy-parent-seeds', generation: 4, parentSeeds: [1, 2] },
  });
  const twin = createCreatureInstanceV1({
    ...common(fauna),
    creatureId: twinId,
    acquisitionRecordId: twinDiscovery.recordId,
    lineage: { kind: 'none', generation: 0 },
  });
  const right = createCreatureInstanceV1({
    ...common(otherFauna),
    creatureId: rightId,
    acquisitionRecordId: rightDiscovery.recordId,
    lineage: { kind: 'none', generation: 2 },
  });
  const lotId = ownershipContentId('specimen', 'v2-flora') as SpecimenLotId;
  const lot = createSpecimenLotV1({
    lotId,
    speciesId: flora.speciesId,
    kind: 'flora',
    quantity: 3,
    origin: 'legacy',
    acquisitionRecordId: floraDiscovery.recordId,
  });
  return {
    source: createInitialOwnershipStateV1({
      catalogSpecies: [faunaSpecies, otherFaunaSpecies, floraSpecies],
      discoveries: [leftDiscovery, twinDiscovery, rightDiscovery, floraDiscovery],
      creatures: [left, twin, right],
      specimenLots: [lot],
      biosphereProgress: [],
      legacyBioX: [],
      scoutCreatureId: left.creatureId,
    }),
    leftId,
    twinId,
    rightId,
    lotId,
  };
}

function receipt(
  ordinal: number,
  label: string,
  actionKind: string = BREED_ACTION_KIND_V2,
): F4ReceiptEvidenceV2 {
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

function plannedBreed(
  state: OwnershipStateV2,
  ordinal = 7,
  seedPair: readonly [number, number] = [11, 22],
  parentIds?: readonly [CreatureInstanceId, CreatureInstanceId],
): { readonly acquisition: BredAcquisitionRecordV2; readonly child: ReturnType<typeof createBredCreatureInstanceV2> } {
  const defaultLeft = state.creatures.find((row) => (
    row.genome.seed === 11 && row.lineage.generation === 4
  ));
  const defaultRight = state.creatures.find((row) => row.genome.seed === 22);
  if (!defaultLeft || !defaultRight) throw new Error('parent fixture changed');
  const checkedParentIds = parentIds ?? [defaultLeft.creatureId, defaultRight.creatureId] as const;
  const childGenome = { seed: 77, kingdom: 'fauna', form: 9, gen: 5, parents: seedPair };
  const childIdentity = canonicalGenomeIdentityV1(childGenome);
  const acquisition = createBredAcquisitionRecordV2({
    speciesId: childIdentity.speciesId,
    parentCreatureIds: checkedParentIds,
    parentSeeds: seedPair,
    receipt: receipt(ordinal, `breed-${ordinal}`),
  });
  const child = createBredCreatureInstanceV2({
    acquisition,
    genome: childGenome,
    generation: 5,
    nickname: 'Nova',
    xp: 0,
    hurt: 0,
    fed: 40,
    brood: 0,
    assignment: null,
    bond: null,
  });
  return { acquisition, child };
}

describe('@cf/domain-acquisition — Arc 5 ownership V2 foundation', () => {
  it('deterministically migrates V1 without fabricating breeding evidence', () => {
    const { source, leftId, twinId, rightId } = fixture();
    const first = migrateOwnershipStateV1ToV2(source);
    const second = migrateOwnershipStateV1ToV2(source);
    expect(isOwnershipStateV2(first)).toBe(true);
    expect(first.revision).toBe(source.revision);
    expect(first.bredAcquisitions).toEqual([]);
    expect(first.acquisitions).toEqual(source.discoveries);
    expect(encodeOwnershipStateV2(second)).toBe(encodeOwnershipStateV2(first));
    expect(ownershipStateDigestV2(second)).toBe(ownershipStateDigestV2(first));
    expect(first.creatures.map((row) => row.creatureId).sort()).toEqual([leftId, twinId, rightId].sort());
    const left = first.creatures.find((row) => row.creatureId === leftId)!;
    const twin = first.creatures.find((row) => row.creatureId === twinId)!;
    expect(left.genomeIdentity).toBe(twin.genomeIdentity);
    expect(left.creatureId).not.toBe(twin.creatureId);
    expect(first.creatures.find((row) => row.creatureId === leftId)?.lineage).toEqual({
      kind: 'legacy-parent-seeds', generation: 4, parentSeeds: [1, 2],
    });
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.creatures)).toBe(true);
    expect(Object.isFrozen(first.creatures[0]!.genome)).toBe(true);
    expect(() => migrateOwnershipStateV1ToV2({ ...source })).toThrow(/registered/u);
  });

  it('gives same-genome individuals stable distinct local IDs and embeds ordered receipt-backed ancestry', () => {
    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const { acquisition, child } = plannedBreed(migrated);
    const next = createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [acquisition],
      creatures: [...migrated.creatures, child],
    }));
    expect(next.revision).toBe(migrated.revision + 1);
    expect(isOwnershipSuccessorV2(next, migrated)).toBe(true);
    expect(next.creatures).toContain(migrated.creatures[0]);
    expect(next.creatures).toContain(migrated.creatures[1]);
    const [leftParentId, rightParentId] = acquisition.provenance.parentCreatureIds;
    expect(migrated.creatures.find((row) => row.creatureId === leftParentId)?.genome.seed).toBe(11);
    expect(migrated.creatures.find((row) => row.creatureId === rightParentId)?.genome.seed).toBe(22);
    expect(acquisition.provenance).toMatchObject({
      kind: 'bred',
      parentSeeds: [11, 22],
      receipt: {
        ordinal: 7,
        actionKind: BREED_ACTION_KIND_V2,
        witnessDigest: sha256Hex('breed-7'),
      },
    });
    expect(child.creatureId).toBe(localCreatureIdV2(acquisition.recordId));
    expect(acquisition.recordId).toBe(bredAcquisitionIdV2(acquisition.provenance.receipt));
    expect(next.catalogSpecies.some((row) => row.speciesId === child.speciesId)).toBe(false);
    expect(acquisition.firstForSpecies).toBe(false);
    expect(Object.isFrozen(acquisition.provenance.parentCreatureIds)).toBe(true);
    expect(Object.isFrozen(acquisition.provenance.parentSeeds)).toBe(true);
    expect(Object.isFrozen(acquisition.provenance.receipt)).toBe(true);

    const repeated = plannedBreed(migrated);
    expect(repeated.acquisition.recordId).toBe(acquisition.recordId);
    expect(repeated.child.creatureId).toBe(child.creatureId);
    const distinct = plannedBreed(migrated, 8);
    expect(distinct.child.genomeIdentity).toBe(child.genomeIdentity);
    expect(distinct.acquisition.recordId).not.toBe(acquisition.recordId);
    expect(distinct.child.creatureId).not.toBe(child.creatureId);
  });

  it('uses creature IDs as parent authority and treats seed tuples only as checked portability evidence', () => {
    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const leftParent = migrated.creatures.find((row) => (
      row.genome.seed === 11 && row.lineage.generation === 4
    ))!;
    const sameParent = plannedBreed(
      migrated,
      9,
      [11, 11],
      [leftParent.creatureId, leftParent.creatureId],
    );
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [sameParent.acquisition],
      creatures: [...migrated.creatures, sameParent.child],
    }))).toThrow(/two distinct parent individuals/u);

    const wrongSeeds = plannedBreed(migrated, 10, [11, 12]);
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [wrongSeeds.acquisition],
      creatures: [...migrated.creatures, wrongSeeds.child],
    }))).toThrow(/portable parent seeds/u);

    const normal = plannedBreed(migrated, 11);
    const left = migrated.creatures.find((row) => (
      row.creatureId === normal.acquisition.provenance.parentCreatureIds[0]
    ))!;
    const removed = createCreatureTombstoneV2(left, receipt(12, 'nonlethal-control', 'creature-retire'));
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [normal.acquisition],
      creatures: [...migrated.creatures.filter((row) => row.creatureId !== left.creatureId), normal.child],
      creatureTombstones: [removed],
      scoutCreatureId: null,
    }))).toThrow(/normal breeding is nonlethal/u);
  });

  it('binds child identity, fauna kind, ordered genome parents, and genome generation', () => {
    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const normal = plannedBreed(migrated, 20);
    const wrongId = createCreatureInstanceV2({
      ...normal.child,
      creatureId: ownershipContentId('creature', 'wrong-v2-child-id') as CreatureInstanceId,
    });
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [normal.acquisition],
      creatures: [...migrated.creatures, wrongId],
    }))).toThrow(/matching child/u);

    const makeVariant = (
      ordinal: number,
      genome: Readonly<Record<string, unknown>>,
      parentSeeds: readonly [number, number],
      generation: number,
    ) => {
      const identity = canonicalGenomeIdentityV1(genome);
      const acquisition = createBredAcquisitionRecordV2({
        speciesId: identity.speciesId,
        parentCreatureIds: normal.acquisition.provenance.parentCreatureIds,
        parentSeeds,
        receipt: receipt(ordinal, `variant-${ordinal}`),
      });
      return {
        acquisition,
        child: createBredCreatureInstanceV2({
          acquisition,
          genome,
          generation,
          nickname: null,
          xp: 0,
          hurt: 0,
          fed: 0,
          brood: 0,
          assignment: null,
          bond: null,
        }),
      };
    };
    const flora = makeVariant(
      21,
      { seed: 78, kingdom: 'flora', form: 1, gen: 5, parents: [11, 22] },
      [11, 22],
      5,
    );
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [flora.acquisition],
      creatures: [...migrated.creatures, flora.child],
    }))).toThrow(/only fauna/u);

    const reversed = makeVariant(
      22,
      { seed: 79, kingdom: 'fauna', form: 1, gen: 5, parents: [22, 11] },
      [22, 11],
      5,
    );
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [reversed.acquisition],
      creatures: [...migrated.creatures, reversed.child],
    }))).toThrow(/portable parent seeds/u);

    const genomeOrderMismatch = makeVariant(
      23,
      { seed: 80, kingdom: 'fauna', form: 1, gen: 5, parents: [22, 11] },
      [11, 22],
      5,
    );
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [genomeOrderMismatch.acquisition],
      creatures: [...migrated.creatures, genomeOrderMismatch.child],
    }))).toThrow(/genome parents.*ordered/u);

    const genomeGenerationMismatch = makeVariant(
      24,
      { seed: 81, kingdom: 'fauna', form: 1, gen: 4, parents: [11, 22] },
      [11, 22],
      5,
    );
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [genomeGenerationMismatch.acquisition],
      creatures: [...migrated.creatures, genomeGenerationMismatch.child],
    }))).toThrow(/genome generation/u);
  });

  it('keeps bred receipt ordinals unique and rejects the exhausted F4 ordinal generically', () => {
    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const normal = plannedBreed(migrated, 25);
    const otherGenome = { seed: 82, kingdom: 'fauna', form: 2, gen: 5, parents: [11, 22] };
    const otherIdentity = canonicalGenomeIdentityV1(otherGenome);
    const duplicateOrdinal = createBredAcquisitionRecordV2({
      speciesId: otherIdentity.speciesId,
      parentCreatureIds: normal.acquisition.provenance.parentCreatureIds,
      parentSeeds: [11, 22],
      receipt: receipt(25, 'different-witness-same-ordinal'),
    });
    const otherChild = createBredCreatureInstanceV2({
      acquisition: duplicateOrdinal,
      genome: otherGenome,
      generation: 5,
      nickname: null,
      xp: 0,
      hurt: 0,
      fed: 0,
      brood: 0,
      assignment: null,
      bond: null,
    });
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [normal.acquisition, duplicateOrdinal],
      creatures: [...migrated.creatures, normal.child, otherChild],
    }))).toThrow(/repeat a save-lifetime F4 receipt ordinal/u);

    const childIdentity = canonicalGenomeIdentityV1({
      seed: 83, kingdom: 'fauna', form: 1, gen: 5, parents: [11, 22],
    });
    expect(() => receipt(
      0xFFFF_FFFF,
      'exhausted-generic',
      'specimen-consume',
    )).toThrow(/ordinal is exhausted/u);
    const lastGeneric = receipt(
      LAST_USABLE_F4_RECEIPT_ORDINAL_V2,
      'last-generic',
      'specimen-consume',
    );
    expect(lastGeneric.ordinal).toBe(0xFFFF_FFFE);
    const lastUsable = createBredAcquisitionRecordV2({
      speciesId: childIdentity.speciesId,
      parentCreatureIds: normal.acquisition.provenance.parentCreatureIds,
      parentSeeds: [11, 22],
      receipt: receipt(LAST_USABLE_F4_RECEIPT_ORDINAL_V2, 'last-usable'),
    });
    expect(lastUsable.provenance.receipt.ordinal).toBe(0xFFFF_FFFE);
    const genericDisposition = receipt(25, 'generic-disposition', 'creature-retire');
    expect(genericDisposition.actionKind).toBe('creature-retire');
  });

  it('maps each embedded F4 ordinal to one exact canonical evidence tuple', () => {
    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const breed = plannedBreed(migrated, 30);
    const bred = createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [breed.acquisition],
      creatures: [...migrated.creatures, breed.child],
    }));
    const lot = bred.specimenLots[0]!;
    const breedSpecimenConflict = createSpecimenTombstoneV2(
      lot,
      receipt(30, 'breed-specimen-conflict', 'specimen-consume'),
    );
    expect(() => createOwnershipSuccessorV2(bred, contents(bred, {
      specimenLots: [],
      specimenTombstones: [breedSpecimenConflict],
    }))).toThrow(/ordinal.*conflicting canonical evidence/u);

    const unusedTwin = bred.creatures.find((row) => (
      row.genome.seed === 11 && row.lineage.generation === 0
    ))!;
    const breedCreatureConflict = createCreatureTombstoneV2(
      unusedTwin,
      receipt(30, 'breed-creature-conflict', 'creature-retire'),
    );
    expect(() => createOwnershipSuccessorV2(bred, contents(bred, {
      creatures: bred.creatures.filter((row) => row.creatureId !== unusedTwin.creatureId),
      creatureTombstones: [breedCreatureConflict],
    }))).toThrow(/ordinal.*conflicting canonical evidence/u);

    const crossKind = migrateOwnershipStateV1ToV2(fixture().source);
    const crossCreature = crossKind.creatures.find((row) => (
      row.genome.seed === 11 && row.lineage.generation === 0
    ))!;
    const crossLot = crossKind.specimenLots[0]!;
    const creatureDisposition = createCreatureTombstoneV2(
      crossCreature,
      receipt(31, 'creature-side', 'owned-disposition'),
    );
    const specimenDisposition = createSpecimenTombstoneV2(
      crossLot,
      receipt(31, 'specimen-side', 'owned-disposition'),
    );
    expect(() => createOwnershipSuccessorV2(crossKind, contents(crossKind, {
      creatures: crossKind.creatures.filter((row) => row.creatureId !== crossCreature.creatureId),
      creatureTombstones: [creatureDisposition],
      specimenLots: [],
      specimenTombstones: [specimenDisposition],
    }))).toThrow(/ordinal.*conflicting canonical evidence/u);

    const sameKind = migrateOwnershipStateV1ToV2(fixture().source);
    const sameKindCreatures = sameKind.creatures.filter((row) => row.creatureId !== sameKind.scoutCreatureId);
    const firstCreatureDisposition = createCreatureTombstoneV2(
      sameKindCreatures[0]!,
      receipt(32, 'first-creature', 'owned-disposition'),
    );
    const secondCreatureDisposition = createCreatureTombstoneV2(
      sameKindCreatures[1]!,
      receipt(32, 'second-creature', 'owned-disposition'),
    );
    expect(() => createOwnershipSuccessorV2(sameKind, contents(sameKind, {
      creatures: sameKind.creatures.filter((row) => (
        row.creatureId !== sameKindCreatures[0]!.creatureId
        && row.creatureId !== sameKindCreatures[1]!.creatureId
      )),
      creatureTombstones: [firstCreatureDisposition, secondCreatureDisposition],
    }))).toThrow(/ordinal.*conflicting canonical evidence/u);

    const shared = migrateOwnershipStateV1ToV2(fixture().source);
    const sharedCreatures = shared.creatures.filter((row) => row.creatureId !== shared.scoutCreatureId);
    const sharedLot = shared.specimenLots[0]!;
    const sharedCreatureTombstones = sharedCreatures.map((row) => createCreatureTombstoneV2(
      row,
      receipt(33, 'one-atomic-disposition', 'owned-disposition'),
    ));
    const sharedSpecimenTombstone = createSpecimenTombstoneV2(
      sharedLot,
      receipt(33, 'one-atomic-disposition', 'owned-disposition'),
    );
    const sharedOutcome = createOwnershipSuccessorV2(shared, contents(shared, {
      creatures: shared.creatures.filter((row) => row.creatureId === shared.scoutCreatureId),
      creatureTombstones: sharedCreatureTombstones,
      specimenLots: [],
      specimenTombstones: [sharedSpecimenTombstone],
    }));
    expect(sharedOutcome.creatureTombstones).toHaveLength(2);
    expect(sharedOutcome.specimenTombstones).toHaveLength(1);
    expect(new Set([
      ...sharedOutcome.creatureTombstones.map((row) => row.disposition.witnessDigest),
      ...sharedOutcome.specimenTombstones.map((row) => row.disposition.witnessDigest),
    ]).size).toBe(1);
  });

  it('requires an immutable creature tombstone and keeps ancestry resolvable after later removal', () => {
    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const breed = plannedBreed(migrated, 13);
    const bred = createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [breed.acquisition],
      creatures: [...migrated.creatures, breed.child],
    }));
    const left = bred.creatures.find((row) => (
      row.creatureId === breed.acquisition.provenance.parentCreatureIds[0]
    ))!;
    expect(() => createOwnershipSuccessorV2(bred, contents(bred, {
      creatures: bred.creatures.filter((row) => row.creatureId !== left.creatureId),
      scoutCreatureId: null,
    }))).toThrow(/resolve live|tombstone/u);

    const tombstone = createCreatureTombstoneV2(left, receipt(14, 'retire-left', 'creature-retire'));
    const removed = createOwnershipSuccessorV2(bred, contents(bred, {
      creatures: bred.creatures.filter((row) => row.creatureId !== left.creatureId),
      creatureTombstones: [tombstone],
      scoutCreatureId: null,
    }));
    expect(removed.creatureTombstones[0]!.snapshot.creatureId).toBe(left.creatureId);
    expect(removed.creatures).toContain(breed.child);
    expect(() => createOwnershipSuccessorV2(removed, contents(removed, {
      creatureTombstones: [],
    }))).toThrow(/resolve live|parents must resolve|immutable/u);
    expect(() => createOwnershipSuccessorV2(removed, contents(removed, {
      creatures: [...removed.creatures, left],
    }))).toThrow(/both live and tombstoned|resurrect/u);

    const changedSnapshot = createCreatureInstanceV1({ ...left, nickname: 'Changed after removal' });
    const changed = createCreatureTombstoneV2(
      changedSnapshot,
      tombstone.disposition,
    );
    expect(() => createOwnershipSuccessorV2(removed, contents(removed, {
      creatureTombstones: [changed],
    }))).toThrow(/immutable/u);
  });

  it('uses a distinct immutable non-fauna tombstone for specimen deletion', () => {
    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const lot = migrated.specimenLots[0]!;
    expect(() => createOwnershipSuccessorV2(migrated, contents(migrated, {
      specimenLots: [],
    }))).toThrow(/specimen.*resolve|tombstone/u);
    const tombstone = createSpecimenTombstoneV2(
      lot,
      receipt(15, 'consume-flora', 'specimen-consume'),
    );
    const removed = createOwnershipSuccessorV2(migrated, contents(migrated, {
      specimenLots: [],
      specimenTombstones: [tombstone],
    }));
    expect(tombstone.kind).toBe('specimen-lot');
    expect('creatureId' in tombstone).toBe(false);
    expect(tombstone.lotId).toBe(lot.lotId);
    expect(() => createOwnershipSuccessorV2(removed, contents(removed, {
      specimenTombstones: [],
    }))).toThrow(/immutable|resolve/u);
    expect(() => createOwnershipSuccessorV2(removed, contents(removed, {
      specimenLots: [lot],
    }))).toThrow(/both live and tombstoned|resurrect/u);
  });

  it('round-trips as an exact canonical fixed point and re-registers reload-shaped authority', () => {
    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const breed = plannedBreed(migrated, 16);
    const bred = createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [breed.acquisition],
      creatures: [...migrated.creatures, breed.child],
    }));
    const encoded = encodeOwnershipStateV2(bred);
    const loaded = decodeOwnershipStateV2(encoded, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(isOwnershipStateV2(loaded)).toBe(true);
    expect(encodeOwnershipStateV2(loaded)).toBe(encoded);
    expect(ownershipStateDigestV2(loaded)).toBe(ownershipStateDigestV2(bred));
    expect(isOwnershipSuccessorV2(loaded, migrated)).toBe(false);

    const mirrorClone = structuredClone(ownershipStateMirrorV2(bred));
    const registered = registerOwnershipStateMirrorV2(
      mirrorClone,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(encodeOwnershipStateV2(registered)).toBe(encoded);
    expect(() => encodeOwnershipStateV2({ ...loaded })).toThrow(/registered/u);
    expect(() => createOwnershipSuccessorV2(
      { ...loaded } as OwnershipStateV2,
      contents(loaded),
    )).toThrow(/parent must be registered/u);

    const parsed = JSON.parse(encoded) as Record<string, unknown>;
    const nonCanonical = JSON.stringify({
      version: parsed.version,
      schema: parsed.schema,
      revision: parsed.revision,
      source: parsed.source,
      bredAcquisitions: parsed.bredAcquisitions,
      creatures: parsed.creatures,
      creatureTombstones: parsed.creatureTombstones,
      specimenLots: parsed.specimenLots,
      specimenTombstones: parsed.specimenTombstones,
      scoutCreatureId: parsed.scoutCreatureId,
    });
    expect(nonCanonical).not.toBe(encoded);
    expect(() => decodeOwnershipStateV2(
      nonCanonical,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toThrow(/canonical fixed point/u);
  });

  it('composes a reload-shaped V2 +1 only with its unchanged source or exact minted Arc 4 +1', () => {
    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const loaded = decodeOwnershipStateV2(
      encodeOwnershipStateV2(migrated),
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    const source = ownershipSourceStateV1(loaded);
    const priorCreature = source.creatures.find((row) => row.genome.seed === 22)!;
    const changedV1 = createCreatureInstanceV1({ ...priorCreature, nickname: 'Reload-bound' });
    const sourceContents = {
      catalogSpecies: source.catalogSpecies,
      discoveries: source.discoveries,
      creatures: source.creatures.map((row) => (
        row.creatureId === changedV1.creatureId ? changedV1 : row
      )),
      specimenLots: source.specimenLots,
      biosphereProgress: source.biosphereProgress,
      legacyBioX: source.legacyBioX,
      scoutCreatureId: source.scoutCreatureId,
    };
    const exactSourceSuccessor = createOwnershipSourceSuccessorV2(loaded, sourceContents);
    const changedV2 = createCreatureInstanceV2(changedV1);
    const next = createOwnershipSuccessorV2(loaded, contents(loaded, {
      source: exactSourceSuccessor,
      creatures: loaded.creatures.map((row) => (
        row.creatureId === changedV2.creatureId ? changedV2 : row
      )),
    }));
    expect(next.revision).toBe(loaded.revision + 1);
    expect(isOwnershipSuccessorV2(next, loaded)).toBe(true);
    expect(isOwnershipSuccessorV2(next, migrated)).toBe(false);
    expect(ownershipSourceStateV1(next)).toBe(exactSourceSuccessor);
    expect(exactSourceSuccessor.revision).toBe(source.revision + 1);
    expect(next.creatures.find((row) => row.creatureId === changedV2.creatureId)?.nickname).toBe('Reload-bound');

    const arbitrary = fixture().source;
    expect(() => createOwnershipSuccessorV2(loaded, contents(loaded, {
      source: arbitrary,
    }))).toThrow(/exact minted direct successor/u);

    const rebasedParent = fixture().source;
    const rebasedPrior = rebasedParent.creatures.find((row) => row.genome.seed === 22)!;
    const rebasedChanged = createCreatureInstanceV1({ ...rebasedPrior, nickname: 'Reload-bound' });
    const rebased = createOwnershipSuccessorV1(rebasedParent, {
      catalogSpecies: rebasedParent.catalogSpecies,
      discoveries: rebasedParent.discoveries,
      creatures: rebasedParent.creatures.map((row) => (
        row.creatureId === rebasedChanged.creatureId ? rebasedChanged : row
      )),
      specimenLots: rebasedParent.specimenLots,
      biosphereProgress: rebasedParent.biosphereProgress,
      legacyBioX: rebasedParent.legacyBioX,
      scoutCreatureId: rebasedParent.scoutCreatureId,
    });
    expect(() => createOwnershipSuccessorV2(loaded, contents(loaded, {
      source: rebased,
    }))).toThrow(/exact minted direct successor/u);
  });

  it('remints one externally prepared direct Arc 4 successor through the internal source-projection seam', () => {
    const source = fixture().source;
    const parent = migrateOwnershipStateV1ToV2(source);
    const successor = createOwnershipSuccessorV1(source, {
      catalogSpecies: source.catalogSpecies,
      discoveries: source.discoveries,
      creatures: source.creatures,
      specimenLots: source.specimenLots,
      biosphereProgress: source.biosphereProgress,
      legacyBioX: source.legacyBioX,
      scoutCreatureId: source.scoutCreatureId,
    });
    const projected = createOwnershipSourceProjectionSuccessorV2(parent, successor);
    expect(isOwnershipSuccessorV2(projected, parent)).toBe(true);
    expect(ownershipSourceStateV1(projected)).not.toBe(successor);
    expect(ownershipStateDigestV1(ownershipSourceStateV1(projected)))
      .toBe(ownershipStateDigestV1(successor));
    expect(projected.revision).toBe(parent.revision + 1);
    expect(ownershipStateDigestV2(projected))
      .toBe(ownershipStateDigestV2(migrateOwnershipStateV1ToV2(successor)));
    expect(() => createOwnershipSuccessorV2(parent, contents(parent, { source: successor })))
      .toThrow(/exact minted direct successor/u);
    expect(() => createOwnershipSourceProjectionSuccessorV2(parent, { ...successor }))
      .toThrow(/exact registered Arc 4 successor/u);
    expect(() => createOwnershipSourceProjectionSuccessorV2({ ...parent }, successor))
      .toThrow(/parent must be registered/u);
  });

  it('fails hostile structures, forged registration, malformed witnesses, and drifted identities closed', () => {
    let touched = false;
    const hostile = {} as Record<string, unknown>;
    Object.defineProperties(hostile, {
      ordinal: { enumerable: true, value: 1 },
      actionKind: { enumerable: true, value: BREED_ACTION_KIND_V2 },
      witnessDigest: {
        enumerable: true,
        get() { touched = true; return sha256Hex('hostile'); },
      },
    });
    expect(() => createF4ReceiptEvidenceV2(hostile as unknown as F4ReceiptEvidenceV2)).toThrow(/own data property/u);
    expect(touched).toBe(false);
    expect(() => createF4ReceiptEvidenceV2({
      ordinal: 1,
      actionKind: BREED_ACTION_KIND_V2,
      witnessDigest: sha256Hex('upper').toUpperCase(),
    })).toThrow(/lowercase hexadecimal/u);
    expect(() => createF4ReceiptEvidenceV2({
      ordinal: 1,
      actionKind: 'Display copy!',
      witnessDigest: sha256Hex('kind'),
    })).toThrow(/semantic identifier/u);

    const migrated = migrateOwnershipStateV1ToV2(fixture().source);
    const validReceipt = receipt(18, 'forged-receipt');
    expect(() => createBredAcquisitionRecordV2({
      speciesId: migrated.catalogSpecies[0]!.speciesId,
      parentCreatureIds: [migrated.creatures[0]!.creatureId, migrated.creatures[1]!.creatureId],
      parentSeeds: [11, 11],
      receipt: { ...validReceipt },
    })).toThrow(/registered F4 receipt/u);
    expect(() => createBredAcquisitionRecordV2({
      speciesId: migrated.catalogSpecies[0]!.speciesId,
      parentCreatureIds: [migrated.creatures[0]!.creatureId, migrated.creatures[1]!.creatureId],
      parentSeeds: [11, 11],
      receipt: receipt(18, 'wrong-kind', 'creature-retire'),
    })).toThrow(/receipt kind must be companion-breed/u);
    expect(() => createOwnershipSuccessorV2(migrated, {
      ...contents(migrated),
      acquisitions: migrated.acquisitions,
    } as unknown as OwnershipStateContentsV2)).toThrow(/unknown or missing fields/u);

    const mirror = structuredClone(ownershipStateMirrorV2(migrated)) as unknown as Record<string, unknown>;
    mirror.extra = true;
    expect(() => registerOwnershipStateMirrorV2(
      mirror,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toThrow(/unknown or missing fields/u);

    const breed = plannedBreed(migrated, 19);
    const bred = createOwnershipSuccessorV2(migrated, contents(migrated, {
      bredAcquisitions: [breed.acquisition],
      creatures: [...migrated.creatures, breed.child],
    }));
    const drifted = structuredClone(ownershipStateMirrorV2(bred)) as unknown as {
      bredAcquisitions: Array<{ recordId: DiscoveryRecordId }>;
    };
    drifted.bredAcquisitions[0]!.recordId = ownershipContentId(
      'discovery', 'drifted-bred-id',
    ) as DiscoveryRecordId;
    expect(() => registerOwnershipStateMirrorV2(
      drifted,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toThrow(/does not match its F4 evidence/u);
  });
});
