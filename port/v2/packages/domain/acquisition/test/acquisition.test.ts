import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import {
  OWNERSHIP_PROVENANCE_CAPABILITIES_V1,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  createBiosphereProgressV1,
  canonicalGenomeIdentityV1,
  canonicalizeData,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createOwnershipSuccessorV1,
  createSpecimenLotV1,
  createWorldDiscoveryRecordV1,
  decodeOwnershipStateV1,
  encodeOwnershipStateV1,
  isOwnershipStateV1,
  isOwnershipSuccessorV1,
  migrateLegacyOwnershipStateV1,
  ownershipContentId,
  ownershipStateMirrorV1,
  registerOwnershipStateMirrorV1,
  sha256Hex,
  type CanonicalJson,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type LegacyOwnershipInputV1,
  type SpecimenLotId,
} from '../src/index.js';

beforeAll(() => installCaptureHooks());

function input(): LegacyOwnershipInputV1 {
  const bond = {
    level: 2,
    memories: [{ id: 'first-return', kind: 'return', worldKey: null, atActivePlayMs: 12 }],
    preferredRole: 'scout',
    worldsSurvived: 3,
    guardianVictories: 1,
    mementoIds: ['stone'],
  };
  return {
    legacyEpoch: 20,
    codexRows: [
      {
        legacyCodexId: 's7',
        genome: {
          seed: 7, kingdom: 'fauna', form: 1, color: 2, gen: 4, parents: [11, 22],
          xp: 81, hurt: 0.25, fed: 33, brood: 44,
          assignment: { kind: 'mission', missionId: 'mission-7' }, bond,
        },
        from: 'Earth', legacyLocation: { type: 'planet', pseed: 133 },
        catalogAlias: 'Cloudcat', faunaNickname: 'Milo',
      },
      {
        legacyCodexId: 's7b',
        genome: { seed: 7, kingdom: 'fauna', form: 2, color: 2 },
        from: 'Europa', legacyLocation: null,
        catalogAlias: 'Cloudcat', faunaNickname: 'Juniper',
      },
      {
        legacyCodexId: 's8',
        genome: { seed: 8, kingdom: 'flora', form: 1 },
        from: 'Earth', legacyLocation: { pseed: 133 },
        catalogAlias: 'Greenwake', faunaNickname: null,
      },
      {
        legacyCodexId: 's9',
        genome: { seed: 9, kingdom: 'fungi', form: 1 },
        from: 'Earth', legacyLocation: null,
        catalogAlias: null, faunaNickname: null,
      },
      {
        legacyCodexId: 's10',
        genome: { seed: 10, kingdom: 'microbe', form: 1 },
        from: 'Earth', legacyLocation: null,
        catalogAlias: null, faunaNickname: null,
      },
      {
        legacyCodexId: 'copy-of-s8',
        genome: { form: 1, kingdom: 'flora', seed: 8 },
        from: 'Copy', legacyLocation: null,
        catalogAlias: 'Later alias', faunaNickname: null,
      },
    ],
    bioXRows: [
      { legacyPlanetSeed: 1, used: 2, epochStamp: 19 },
      { legacyPlanetSeed: 2, used: 3, epochStamp: 20 },
      { legacyPlanetSeed: 3, used: 4, epochStamp: 21 },
      { legacyPlanetSeed: -1, used: 1000, epochStamp: -2 },
    ],
    scoutCodexId: 's7',
  };
}

describe('@cf/domain-acquisition — truthful Arc 4 ownership', () => {
  it('has stable dependency-free SHA-256 and structural-genome identity', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const a = canonicalGenomeIdentityV1({ seed: 7, kingdom: 'fauna', form: 1, xp: 486 });
    const copy = canonicalGenomeIdentityV1({ xp: 0, form: 1, kingdom: 'fauna', seed: 7 });
    const otherGenome = canonicalGenomeIdentityV1({ seed: 7, kingdom: 'fauna', form: 2 });
    const otherLineage = canonicalGenomeIdentityV1({
      seed: 7, kingdom: 'fauna', form: 1, gen: 99, parents: [200, 300],
    });
    expect(copy.speciesId).toBe(a.speciesId);
    expect(copy.genomeIdentity).toBe(a.genomeIdentity);
    expect(otherGenome.speciesId).not.toBe(a.speciesId);
    expect(otherLineage.speciesId).not.toBe(a.speciesId);
  });

  it('migrates every fauna/flora/fungi/microbe row without conflating knowledge and ownership', () => {
    const migrated = migrateLegacyOwnershipStateV1(input());
    const { state } = migrated;
    expect(isOwnershipStateV1(state)).toBe(true);
    expect(state.revision).toBe(0);
    expect(state.discoveries).toHaveLength(6);
    expect(state.catalogSpecies).toHaveLength(5);
    expect(state.creatures).toHaveLength(2);
    expect(state.specimenLots).toHaveLength(4);
    expect(state.specimenLots.every((lot) => lot.quantity === 1 && lot.origin === 'legacy')).toBe(true);
    expect(state.specimenLots.map((lot) => lot.kind).sort()).toEqual(['flora', 'flora', 'fungi', 'microbe']);
    const creature = state.creatures.find((row) => row.nickname === 'Milo')!;
    expect(creature).toMatchObject({
      origin: 'legacy', xp: 81, hurt: 0.25, fed: 33, brood: 44,
      assignment: { kind: 'mission', missionId: 'mission-7' },
      lineage: { kind: 'legacy-parent-seeds', generation: 4, parentSeeds: [11, 22] },
    });
    expect(creature.bond).toMatchObject({ level: 2, preferredRole: 'scout', worldsSurvived: 3 });
    expect(state.scoutCreatureId).toBe(creature.creatureId);
    expect(state.catalogSpecies.find((row) => row.speciesId === creature.speciesId)?.alias).toBe('Cloudcat');
    expect(creature.nickname).not.toBe('Cloudcat');
    expect(Object.fromEntries(state.legacyBioX.map((row) => [row.legacyPlanetSeed, row.relation]))).toEqual({
      '-1': 'impossible', 1: 'old', 2: 'equal', 3: 'future',
    });
    expect(state.legacyBioX.every((row) => row.canonicalWorldKey === null)).toBe(true);
    expect(migrated.sourceEvidence).toMatchObject({
      schema: 'cf-v1.8.9-ownership-source/v1', codexRows: 6, uniqueSpecies: 5,
      bioXRows: 4, scoutCodexId: 's7',
    });
  });

  it('shares structural genome identity but retains one owned row per sanitized legacy row', () => {
    const { state } = migrateLegacyOwnershipStateV1(input());
    const floraDiscoveries = state.discoveries.filter((row) => (
      state.catalogSpecies.find((species) => species.speciesId === row.speciesId)?.kingdom === 'flora'
    ));
    expect(floraDiscoveries).toHaveLength(2);
    expect(new Set(floraDiscoveries.map((row) => row.speciesId)).size).toBe(1);
    expect(floraDiscoveries.filter((row) => row.firstForSpecies)).toHaveLength(1);
    expect(floraDiscoveries.find((row) => row.firstForSpecies)?.provenance).toMatchObject({
      kind: 'legacy', legacyCodexId: 's8', legacySourceIndex: 2,
    });
    const flora = state.catalogSpecies.find((row) => row.kingdom === 'flora')!;
    expect(flora.alias).toBe('Greenwake');
  });

  it('registers only validated +1 successors and leaves structural clones powerless', () => {
    const parent = migrateLegacyOwnershipStateV1(input()).state;
    const creature = parent.creatures[0]!;
    const changed = createCreatureInstanceV1({ ...creature, nickname: 'Aster' });
    const aliasChanged = parent.catalogSpecies.map((row, index) => index === 0
      ? createCatalogSpeciesV1({
          identity: canonicalGenomeIdentityV1(row.genome), alias: 'New alias',
          firstObservationId: row.firstObservationId,
        })
      : row);
    const next = createOwnershipSuccessorV1(parent, {
      catalogSpecies: aliasChanged,
      discoveries: parent.discoveries,
      creatures: [changed, ...parent.creatures.slice(1)],
      specimenLots: parent.specimenLots,
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    });
    expect(next.revision).toBe(1);
    expect(isOwnershipSuccessorV1(next, parent)).toBe(true);
    expect(isOwnershipStateV1({ ...next })).toBe(false);
    expect(isOwnershipSuccessorV1({ ...next }, parent)).toBe(false);
    const priorDiscovery = parent.discoveries[0]!;
    if (priorDiscovery.provenance.kind !== 'legacy') throw new Error('legacy fixture changed');
    const rewrittenDiscovery = createLegacyDiscoveryRecordV1({
      recordId: priorDiscovery.recordId,
      speciesId: priorDiscovery.speciesId,
      legacyCodexId: priorDiscovery.provenance.legacyCodexId,
      legacySourceIndex: priorDiscovery.provenance.legacySourceIndex,
      from: `${priorDiscovery.provenance.from} changed`,
      legacyLocation: priorDiscovery.provenance.legacyLocation?.display ?? null,
      firstForSpecies: priorDiscovery.firstForSpecies,
    });
    expect(() => createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: parent.discoveries.map((row) => (
        row.recordId === priorDiscovery.recordId ? rewrittenDiscovery : row
      )),
      creatures: parent.creatures,
      specimenLots: parent.specimenLots,
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    })).toThrow(/audit rows are immutable/u);
    const bonded = parent.creatures.find((row) => row.bond !== null)!;
    const droppedHistory = createCreatureInstanceV1({ ...bonded, bond: null });
    expect(() => createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: parent.discoveries,
      creatures: parent.creatures.map((row) => (
        row.creatureId === bonded.creatureId ? droppedHistory : row
      )),
      specimenLots: parent.specimenLots,
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    })).toThrow(/bond history rolled back/u);
    expect(() => createCreatureInstanceV1({
      ...bonded,
      bond: {
        ...bonded.bond!,
        memories: [bonded.bond!.memories[0]!, bonded.bond!.memories[0]!],
      },
    })).toThrow(/memory IDs repeat/u);
    const expandedHistory = createCreatureInstanceV1({
      ...bonded,
      bond: {
        ...bonded.bond!,
        memories: [
          ...bonded.bond!.memories,
          { id: 'second-return', kind: 'return', worldKey: null, atActivePlayMs: 24 },
        ],
        mementoIds: [...bonded.bond!.mementoIds, 'shell'],
      },
    });
    const withExpandedHistory = createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: parent.discoveries,
      creatures: parent.creatures.map((row) => (
        row.creatureId === bonded.creatureId ? expandedHistory : row
      )),
      specimenLots: parent.specimenLots,
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    });
    const reorderedHistory = createCreatureInstanceV1({
      ...expandedHistory,
      bond: {
        ...expandedHistory.bond!,
        memories: [...expandedHistory.bond!.memories].reverse(),
        mementoIds: [...expandedHistory.bond!.mementoIds].reverse(),
      },
    });
    expect(() => createOwnershipSuccessorV1(withExpandedHistory, {
      catalogSpecies: withExpandedHistory.catalogSpecies,
      discoveries: withExpandedHistory.discoveries,
      creatures: withExpandedHistory.creatures.map((row) => (
        row.creatureId === expandedHistory.creatureId ? reorderedHistory : row
      )),
      specimenLots: withExpandedHistory.specimenLots,
      biosphereProgress: withExpandedHistory.biosphereProgress,
      legacyBioX: withExpandedHistory.legacyBioX,
      scoutCreatureId: withExpandedHistory.scoutCreatureId,
    })).toThrow(/history changed, moved, or disappeared/u);
    const reorderedMementos = createCreatureInstanceV1({
      ...expandedHistory,
      bond: {
        ...expandedHistory.bond!,
        mementoIds: [...expandedHistory.bond!.mementoIds].reverse(),
      },
    });
    expect(() => createOwnershipSuccessorV1(withExpandedHistory, {
      catalogSpecies: withExpandedHistory.catalogSpecies,
      discoveries: withExpandedHistory.discoveries,
      creatures: withExpandedHistory.creatures.map((row) => (
        row.creatureId === expandedHistory.creatureId ? reorderedMementos : row
      )),
      specimenLots: withExpandedHistory.specimenLots,
      biosphereProgress: withExpandedHistory.biosphereProgress,
      legacyBioX: withExpandedHistory.legacyBioX,
      scoutCreatureId: withExpandedHistory.scoutCreatureId,
    })).toThrow(/memento history changed, moved, or disappeared/u);
    const specimen = parent.specimenLots[0]!;
    expect(() => createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: parent.discoveries,
      creatures: parent.creatures,
      specimenLots: parent.specimenLots.filter((row) => row.lotId !== specimen.lotId),
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    })).toThrow(/required owned row|future tombstone schema/u);
    const replenished = createSpecimenLotV1({ ...specimen, quantity: specimen.quantity + 1 });
    expect(() => createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: parent.discoveries,
      creatures: parent.creatures,
      specimenLots: parent.specimenLots.map((row) => (
        row.lotId === specimen.lotId ? replenished : row
      )),
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    })).toThrow(/quantity increased/u);
    const lateLegacyDiscovery = createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'late-legacy') as DiscoveryRecordId,
      speciesId: specimen.speciesId,
      legacyCodexId: 'late-legacy',
      legacySourceIndex: 99,
      from: 'Legacy',
      legacyLocation: null,
      firstForSpecies: false,
    });
    const lateLegacySpecimen = createSpecimenLotV1({
      lotId: ownershipContentId('specimen', 'late-legacy') as SpecimenLotId,
      speciesId: specimen.speciesId,
      kind: specimen.kind,
      quantity: 1,
      origin: 'legacy',
      acquisitionRecordId: lateLegacyDiscovery.recordId,
    });
    expect(() => createOwnershipSuccessorV1(parent, {
      catalogSpecies: parent.catalogSpecies,
      discoveries: [...parent.discoveries, lateLegacyDiscovery],
      creatures: parent.creatures,
      specimenLots: [...parent.specimenLots, lateLegacySpecimen],
      biosphereProgress: parent.biosphereProgress,
      legacyBioX: parent.legacyBioX,
      scoutCreatureId: parent.scoutCreatureId,
    })).toThrow(/cannot be added after initial migration/u);
    expect(() => createOwnershipSuccessorV1({ ...parent }, {
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/registered/u);
  });

  it('requires real owned parent creature IDs for new ancestry', () => {
    expect(OWNERSHIP_PROVENANCE_CAPABILITIES_V1).toEqual({
      capture: true,
      breeding: false,
      guardian: false,
    });
    const identity = canonicalGenomeIdentityV1({ seed: 55, kingdom: 'fauna', form: 1 });
    const discovery = (suffix: string, index: number, firstForSpecies: boolean) => createLegacyDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', suffix) as DiscoveryRecordId,
      speciesId: identity.speciesId,
      legacyCodexId: suffix,
      legacySourceIndex: index,
      from: 'Legacy', legacyLocation: null, firstForSpecies,
    });
    const d0 = discovery('p0', 0, true), d1 = discovery('p1', 1, false), d2 = discovery('child', 2, false);
    const species = createCatalogSpeciesV1({ identity, alias: null, firstObservationId: d0.recordId });
    const make = (id: string, acquisitionRecordId: DiscoveryRecordId) => createCreatureInstanceV1({
      creatureId: ownershipContentId('creature', id) as CreatureInstanceId,
      speciesId: identity.speciesId, genomeIdentity: identity.genomeIdentity, genome: identity.genome,
      nickname: null, origin: 'legacy', acquisitionRecordId,
      lineage: { kind: 'none', generation: 0 },
      xp: null, hurt: null, fed: null, brood: null, assignment: null, bond: null,
    });
    const p0 = make('p0', d0.recordId), p1 = make('p1', d1.recordId);
    expect(() => createCreatureInstanceV1({
      ...p0,
      origin: 'bred',
      lineage: { kind: 'none', generation: 0 },
    })).toThrow(/origin and lineage are inconsistent/u);
    expect(() => createCreatureInstanceV1({
      ...p0,
      origin: 'wild',
      lineage: {
        kind: 'parent-creatures', generation: 1,
        parentCreatureIds: [p0.creatureId, p1.creatureId],
      },
    })).toThrow(/origin and lineage are inconsistent/u);
    const child = createCreatureInstanceV1({
      ...make('child', d2.recordId), origin: 'bred',
      lineage: {
        kind: 'parent-creatures', generation: 1,
        parentCreatureIds: [p0.creatureId, p1.creatureId],
      },
    });
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [d0, d1, d2], creatures: [p0, child],
      specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/real owned parents/u);
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [d0, d1, d2], creatures: [p0, p1, child],
      specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/Arc 5 carrier\/provenance extension/u);
    const guardian = createCreatureInstanceV1({
      ...make('guardian', d2.recordId), origin: 'guardian',
    });
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [d0, d1, d2], creatures: [p0, p1, guardian],
      specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/future carrier\/provenance extension/u);
    const falselyWild = createCreatureInstanceV1({ ...p0, origin: 'wild' });
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [d0], creatures: [falselyWild],
      specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/origin does not match acquisition provenance/u);
  });

  it('binds each owned row to one acquisition and keeps acquisition verbs kingdom-truthful', () => {
    const migrated = migrateLegacyOwnershipStateV1(input()).state;
    const original = migrated.creatures[0]!;
    const duplicate = createCreatureInstanceV1({
      ...original,
      creatureId: ownershipContentId('creature', 'duplicate-acquisition') as CreatureInstanceId,
    });
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: migrated.catalogSpecies,
      discoveries: migrated.discoveries,
      creatures: [...migrated.creatures, duplicate],
      specimenLots: migrated.specimenLots,
      biosphereProgress: migrated.biosphereProgress,
      legacyBioX: migrated.legacyBioX,
      scoutCreatureId: migrated.scoutCreatureId,
    })).toThrow(/duplicate owned rows/u);
    const legacySpecimen = migrated.specimenLots[0]!;
    const falselyWildSpecimen = createSpecimenLotV1({ ...legacySpecimen, origin: 'wild' });
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: migrated.catalogSpecies,
      discoveries: migrated.discoveries,
      creatures: migrated.creatures,
      specimenLots: migrated.specimenLots.map((row) => (
        row.lotId === legacySpecimen.lotId ? falselyWildSpecimen : row
      )),
      biosphereProgress: migrated.biosphereProgress,
      legacyBioX: migrated.legacyBioX,
      scoutCreatureId: migrated.scoutCreatureId,
    })).toThrow(/origin does not match acquisition provenance/u);

    const resolved = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 },
      planet: { seed: 133 },
    });
    if (!resolved.ok) throw new Error(`home address failed: ${resolved.reason}`);
    const identity = canonicalGenomeIdentityV1({ seed: 808, kingdom: 'fauna', form: 1 });
    const wrongVerb = createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'wrong-fauna-verb') as DiscoveryRecordId,
      speciesId: identity.speciesId,
      verb: 'sample',
      worldAddress: resolved.address,
      cycle: 1,
      sourceOrdinal: 0,
      firstForSpecies: true,
    });
    const species = createCatalogSpeciesV1({
      identity, alias: null, firstObservationId: wrongVerb.recordId,
    });
    const creature = createCreatureInstanceV1({
      creatureId: ownershipContentId('creature', 'wrong-fauna-verb') as CreatureInstanceId,
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: null,
      origin: 'wild',
      acquisitionRecordId: wrongVerb.recordId,
      lineage: { kind: 'none', generation: 0 },
      xp: null, hurt: null, fed: null, brood: null, assignment: null, bond: null,
    });
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [wrongVerb], creatures: [creature],
      specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/verb does not match/u);
  });

  it('enforces one aggregate row budget without rejecting a just-below registered state', () => {
    const identity = canonicalGenomeIdentityV1({ seed: 909, kingdom: 'fauna', form: 1 });
    const makeRows = (count: number) => {
      const discoveries = [];
      const creatures = [];
      for (let index = 0; index < count; index++) {
        const discovery = createLegacyDiscoveryRecordV1({
          recordId: ownershipContentId('discovery', `global-bound-${index}`) as DiscoveryRecordId,
          speciesId: identity.speciesId,
          legacyCodexId: `s${9000 + index}`,
          legacySourceIndex: index,
          from: 'Legacy',
          legacyLocation: null,
          firstForSpecies: index === 0,
        });
        discoveries.push(discovery);
        creatures.push(createCreatureInstanceV1({
          creatureId: ownershipContentId('creature', `global-bound-${index}`) as CreatureInstanceId,
          speciesId: identity.speciesId,
          genomeIdentity: identity.genomeIdentity,
          genome: identity.genome,
          nickname: null,
          origin: 'legacy',
          acquisitionRecordId: discovery.recordId,
          lineage: { kind: 'none', generation: 0 },
          xp: null, hurt: null, fed: null, brood: null, assignment: null,
          bond: {
            level: 0,
            memories: Array.from({ length: 128 }, (_, offset) => ({
              id: `memory-${index}-${offset}`,
              kind: 'legacy',
              worldKey: null,
              atActivePlayMs: offset,
            })),
            preferredRole: null,
            worldsSurvived: 0,
            guardianVictories: 0,
            mementoIds: Array.from({ length: 128 }, (_, offset) => `memento-${index}-${offset}`),
          },
        }));
      }
      const species = createCatalogSpeciesV1({
        identity, alias: null, firstObservationId: discoveries[0]!.recordId,
      });
      return { species, discoveries, creatures };
    };
    const below = makeRows(77);
    expect(createInitialOwnershipStateV1({
      catalogSpecies: [below.species], discoveries: below.discoveries, creatures: below.creatures,
      specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    }).creatures).toHaveLength(77);
    const above = makeRows(78);
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: [above.species], discoveries: above.discoveries, creatures: above.creatures,
      specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/global row bound/u);
  });

  it('keys cycle/used and repeat evidence to one runtime-proven full CF1 world address', () => {
    const resolved = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 },
      planet: { seed: 133 },
    });
    if (!resolved.ok) throw new Error(`home address failed: ${resolved.reason}`);
    const identity = canonicalGenomeIdentityV1({ seed: 101, kingdom: 'flora', form: 3 });
    const first = createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'world-first') as DiscoveryRecordId,
      speciesId: identity.speciesId, verb: 'scavenge', worldAddress: resolved.address,
      cycle: 4, sourceOrdinal: 0, firstForSpecies: true,
    });
    const species = createCatalogSpeciesV1({ identity, alias: null, firstObservationId: first.recordId });
    const lot = createSpecimenLotV1({
      lotId: ownershipContentId('specimen', 'world-first') as SpecimenLotId,
      speciesId: identity.speciesId, kind: 'flora', quantity: 1, origin: 'wild',
      acquisitionRecordId: first.recordId,
    });
    const progress = createBiosphereProgressV1({
      worldAddress: resolved.address, cycle: 4, used: 1,
      successful: [{ speciesId: identity.speciesId, source: 'scavenge' }],
    });
    expect(() => createBiosphereProgressV1({
      worldAddress: resolved.address, cycle: 4, used: 0,
      successful: [{ speciesId: identity.speciesId, source: 'scavenge' }],
    })).toThrow(/spent attempts/u);
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [first], creatures: [], specimenLots: [lot],
      biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/matching biosphere progress/u);
    const missingSuccess = createBiosphereProgressV1({
      worldAddress: resolved.address, cycle: 4, used: 1, successful: [],
    });
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [first], creatures: [], specimenLots: [lot],
      biosphereProgress: [missingSuccess], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/current-cycle biosphere success/u);
    const state = createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [first], creatures: [], specimenLots: [lot],
      biosphereProgress: [progress], legacyBioX: [], scoutCreatureId: null,
    });
    expect(state.biosphereProgress[0]).toMatchObject({
      worldKey: 'CF1|g:999@90,-60|s:424242@560,170|p:133#2', cycle: 4, used: 1,
    });
    const structuralClone = {
      ...resolved.address,
      galaxy: { ...resolved.address.galaxy },
      star: { ...resolved.address.star },
      planet: { ...resolved.address.planet },
    } as unknown as CanonicalCF1WorldAddress;
    expect(() => createBiosphereProgressV1({
      worldAddress: structuralClone, cycle: 4, used: 1, successful: [],
    })).toThrow(/runtime-proven/u);

    const mirror = JSON.parse(JSON.stringify(ownershipStateMirrorV1(state))) as {
      biosphereProgress: Array<{ worldAddress: { galaxy: { size: number } } }>;
    };
    mirror.biosphereProgress[0]!.worldAddress.galaxy.size += 1;
    expect(() => registerOwnershipStateMirrorV1(mirror, {
      resolveWorldAddress: () => resolved.address,
    })).toThrow(/could not be rebound/u);
    expect(() => registerOwnershipStateMirrorV1(mirror, SCENE_OWNERSHIP_ADDRESS_RESOLVER))
      .toThrow(/could not be rebound/u);

    const repeated = createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'world-repeat') as DiscoveryRecordId,
      speciesId: identity.speciesId, verb: 'scavenge', worldAddress: resolved.address,
      cycle: 4, sourceOrdinal: 1, firstForSpecies: false,
    });
    const repeatedLot = createSpecimenLotV1({
      lotId: ownershipContentId('specimen', 'world-repeat') as SpecimenLotId,
      speciesId: identity.speciesId, kind: 'flora', quantity: 1, origin: 'wild',
      acquisitionRecordId: repeated.recordId,
    });
    expect(() => createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [first, repeated], creatures: [],
      specimenLots: [lot, repeatedLot], biosphereProgress: [progress], legacyBioX: [], scoutCreatureId: null,
    })).toThrow(/species\/source\/cycle/u);
  });

  it('prevents removal and delayed ownership resurrection across a decoded checkpoint', () => {
    const resolved = resolveCF1WorldAddress({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 },
      planet: { seed: 133 },
    });
    if (!resolved.ok) throw new Error(`home address failed: ${resolved.reason}`);
    const identity = canonicalGenomeIdentityV1({ seed: 707, kingdom: 'fauna', form: 1 });
    const discovery = createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'delayed-creature') as DiscoveryRecordId,
      speciesId: identity.speciesId,
      verb: 'tame',
      worldAddress: resolved.address,
      cycle: 7,
      sourceOrdinal: 0,
      firstForSpecies: true,
    });
    const species = createCatalogSpeciesV1({
      identity, alias: null, firstObservationId: discovery.recordId,
    });
    const progress = createBiosphereProgressV1({
      worldAddress: resolved.address,
      cycle: 7,
      used: 1,
      successful: [{ speciesId: identity.speciesId, source: 'tame' }],
    });
    const creature = createCreatureInstanceV1({
      creatureId: ownershipContentId('creature', 'delayed-creature') as CreatureInstanceId,
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: null,
      origin: 'wild',
      acquisitionRecordId: discovery.recordId,
      lineage: { kind: 'none', generation: 0 },
      xp: null, hurt: null, fed: null, brood: null, assignment: null, bond: null,
    });

    const orphan = createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [discovery], creatures: [],
      specimenLots: [], biosphereProgress: [progress], legacyBioX: [], scoutCreatureId: null,
    });
    const decodedOrphan = decodeOwnershipStateV1(
      encodeOwnershipStateV1(orphan),
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(() => createOwnershipSuccessorV1(decodedOrphan, {
      catalogSpecies: decodedOrphan.catalogSpecies,
      discoveries: decodedOrphan.discoveries,
      creatures: [creature],
      specimenLots: decodedOrphan.specimenLots,
      biosphereProgress: decodedOrphan.biosphereProgress,
      legacyBioX: decodedOrphan.legacyBioX,
      scoutCreatureId: null,
    })).toThrow(/must settle with a new acquisition audit row/u);

    const owned = createInitialOwnershipStateV1({
      catalogSpecies: [species], discoveries: [discovery], creatures: [creature],
      specimenLots: [], biosphereProgress: [progress], legacyBioX: [], scoutCreatureId: null,
    });
    const decodedOwned = decodeOwnershipStateV1(
      encodeOwnershipStateV1(owned),
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(() => createOwnershipSuccessorV1(decodedOwned, {
      catalogSpecies: decodedOwned.catalogSpecies,
      discoveries: decodedOwned.discoveries,
      creatures: [],
      specimenLots: decodedOwned.specimenLots,
      biosphereProgress: decodedOwned.biosphereProgress,
      legacyBioX: decodedOwned.legacyBioX,
      scoutCreatureId: null,
    })).toThrow(/cannot be removed without a future tombstone schema/u);
  });

  it('rejects accessors, symbols, non-enumerable data, custom prototypes, sparse arrays, and cycles', () => {
    const accessor = Object.defineProperty({}, 'seed', { enumerable: true, get: () => 7 });
    expect(() => canonicalizeData(accessor)).toThrow(/own data/u);
    const symbol = { seed: 7, [Symbol('x')]: 1 };
    expect(() => canonicalizeData(symbol)).toThrow(/symbols/u);
    const hidden = Object.defineProperty({}, 'seed', { enumerable: false, value: 7 });
    expect(() => canonicalizeData(hidden)).toThrow(/enumerable/u);
    expect(() => canonicalizeData(Object.create({ seed: 7 }))).toThrow(/plain prototype/u);
    expect(() => canonicalizeData(new Array(2))).toThrow(/dense/u);
    const cycle: Record<string, CanonicalJson | unknown> = {};
    cycle.self = cycle;
    expect(() => canonicalizeData(cycle)).toThrow(/acyclic/u);
    const protoKey = Object.defineProperty({ seed: 7 }, '__proto__', {
      enumerable: true,
      value: { retained: true },
    });
    const canonical = canonicalizeData(protoKey) as Readonly<Record<string, CanonicalJson>>;
    expect(Object.getPrototypeOf(canonical)).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(canonical, '__proto__')).toBe(true);
    expect(canonical.__proto__).toEqual({ retained: true });
  });
});
