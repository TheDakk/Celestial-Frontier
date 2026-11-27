// A species can leave the Compendium, and a Paragon is a whole beast.
// LEGACY celestial-frontier.html v1.8.9: `removeFromCodex` 18808-18821 deletes the page whole (a meal consumed
// 18915 and 19341, a scout with nothing left 13154-13159); a Paragon is stored like any beast (14904-14917).
import { describe, expect, it } from 'vitest';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  canonicalGenomeIdentityV1,
  createBiosphereProgressV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createOwnershipSuccessorV1,
  createParagonDiscoveryRecordV1,
  createSpecimenLotV1,
  createWorldDiscoveryRecordV1,
  decodeOwnershipStateV1,
  encodeOwnershipStateV1,
  ownershipContentId,
  withoutSpeciesV1,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateContentsV1,
  type OwnershipStateV1,
  type SpecimenLotId,
} from '../src/index.js';
import { paragonGenomeV1 } from '../src/paragon-internal.js';

const resolved = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 133 } });
if (!resolved.ok) throw new Error(`home address failed: ${resolved.reason}`);
const address = resolved.address;

const contentsOf = (state: OwnershipStateV1): OwnershipStateContentsV1 => ({
  catalogSpecies: state.catalogSpecies, discoveries: state.discoveries, creatures: state.creatures, specimenLots: state.specimenLots,
  biosphereProgress: state.biosphereProgress, legacyBioX: state.legacyBioX, scoutCreatureId: state.scoutCreatureId,
});

/** A beast and a plant taken on one world in one cycle, the beast standing as the scout. */
function held() {
  const beast = canonicalGenomeIdentityV1({ seed: 707, kingdom: 'fauna', form: 1 });
  const plant = canonicalGenomeIdentityV1({ seed: 808, kingdom: 'flora', form: 1 });
  const tamed = createWorldDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', 'tamed') as DiscoveryRecordId, speciesId: beast.speciesId, verb: 'tame',
    worldAddress: address, cycle: 7, sourceOrdinal: 0, firstForSpecies: true,
  });
  const scavenged = createWorldDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', 'scavenged') as DiscoveryRecordId, speciesId: plant.speciesId, verb: 'scavenge',
    worldAddress: address, cycle: 7, sourceOrdinal: 1, firstForSpecies: true,
  });
  const creature = createCreatureInstanceV1({
    creatureId: ownershipContentId('creature', 'tamed') as CreatureInstanceId, speciesId: beast.speciesId, genomeIdentity: beast.genomeIdentity,
    genome: beast.genome, nickname: null, origin: 'wild', acquisitionRecordId: tamed.recordId, lineage: { kind: 'none', generation: 0 },
    xp: 4, hurt: 0.9, fed: null, brood: null, assignment: null, bond: null,
  });
  const lot = createSpecimenLotV1({
    lotId: ownershipContentId('specimen', 'scavenged') as SpecimenLotId, speciesId: plant.speciesId, kind: 'flora', quantity: 1, origin: 'wild',
    acquisitionRecordId: scavenged.recordId,
  });
  const state = createInitialOwnershipStateV1({
    catalogSpecies: [
      createCatalogSpeciesV1({ identity: beast, alias: 'Old Friend', firstObservationId: tamed.recordId }),
      createCatalogSpeciesV1({ identity: plant, alias: null, firstObservationId: scavenged.recordId }),
    ],
    discoveries: [tamed, scavenged], creatures: [creature], specimenLots: [lot],
    biosphereProgress: [createBiosphereProgressV1({
      worldAddress: address, cycle: 7, used: 2,
      successful: [{ speciesId: beast.speciesId, source: 'tame' }, { speciesId: plant.speciesId, source: 'scavenge' }],
    })],
    legacyBioX: [], scoutCreatureId: creature.creatureId,
  });
  // Read back from its stored form, as a save is.
  return { state: decodeOwnershipStateV1(encodeOwnershipStateV1(state), SCENE_OWNERSHIP_ADDRESS_RESOLVER), beast, plant, creature, lot };
}

describe('a species leaves the Compendium whole', () => {
  it('an eaten plant takes its page, its lot, its record and its mark on the world with it; the attempt stays spent', () => {
    const { state, plant, beast } = held();
    const next = createOwnershipSuccessorV1(state, withoutSpeciesV1(contentsOf(state), plant.speciesId));
    expect(next.revision).toBe(state.revision + 1);
    expect(next.catalogSpecies.map((row) => row.speciesId)).toEqual([beast.speciesId]);
    expect(next.specimenLots).toEqual([]);
    expect(next.discoveries.map((row) => row.speciesId)).toEqual([beast.speciesId]);
    expect(next.biosphereProgress[0]!.successful).toEqual([{ speciesId: beast.speciesId, source: 'tame' }]);
    expect(next.biosphereProgress[0]!.used).toBe(2);
    // The beast and the scout are untouched.
    expect(next.creatures).toEqual(state.creatures);
    expect(next.scoutCreatureId).toBe(state.scoutCreatureId);
    // What was stored reads back.
    expect(encodeOwnershipStateV1(decodeOwnershipStateV1(encodeOwnershipStateV1(next), SCENE_OWNERSHIP_ADDRESS_RESOLVER))).toBe(encodeOwnershipStateV1(next));
  });

  it('a lost beast takes its page and its creature with it, and stands down as the scout', () => {
    const { state, plant, beast } = held();
    const next = createOwnershipSuccessorV1(state, withoutSpeciesV1(contentsOf(state), beast.speciesId));
    expect(next.catalogSpecies.map((row) => row.speciesId)).toEqual([plant.speciesId]);
    expect(next.creatures).toEqual([]);
    expect(next.scoutCreatureId).toBeNull();
    expect(next.specimenLots).toEqual(state.specimenLots);
    expect(next.biosphereProgress[0]!.successful).toEqual([{ speciesId: plant.speciesId, source: 'scavenge' }]);
  });

  it('a species that left can be taken again as a first find, with a new record', () => {
    const { state, plant } = held();
    const gone = createOwnershipSuccessorV1(state, withoutSpeciesV1(contentsOf(state), plant.speciesId));
    const again = createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'scavenged-again') as DiscoveryRecordId, speciesId: plant.speciesId, verb: 'scavenge',
      worldAddress: address, cycle: 7, sourceOrdinal: 1, firstForSpecies: true,
    });
    const back = createOwnershipSuccessorV1(gone, {
      ...contentsOf(gone),
      catalogSpecies: [...gone.catalogSpecies, createCatalogSpeciesV1({ identity: plant, alias: null, firstObservationId: again.recordId })],
      discoveries: [...gone.discoveries, again],
      specimenLots: [createSpecimenLotV1({
        lotId: ownershipContentId('specimen', 'scavenged-again') as SpecimenLotId, speciesId: plant.speciesId, kind: 'flora', quantity: 1, origin: 'wild',
        acquisitionRecordId: again.recordId,
      })],
      biosphereProgress: [createBiosphereProgressV1({
        worldAddress: address, cycle: 7, used: 3, successful: [...gone.biosphereProgress[0]!.successful, { speciesId: plant.speciesId, source: 'scavenge' }],
      })],
    });
    expect(back.catalogSpecies).toHaveLength(2);
    expect(back.specimenLots).toHaveLength(1);
  });

  it('nothing leaves in part: a creature, a lot, a record or a mark without its species is refused', () => {
    const { state, plant, beast } = held();
    const contents = contentsOf(state);
    expect(() => createOwnershipSuccessorV1(state, { ...contents, creatures: [], scoutCreatureId: null }))
      .toThrow(/a creature leaves only with its species/u);
    expect(() => createOwnershipSuccessorV1(state, { ...contents, specimenLots: [] }))
      .toThrow(/required owned row|a specimen lot leaves only with its species/u);
    expect(() => createOwnershipSuccessorV1(state, {
      ...contents,
      biosphereProgress: [createBiosphereProgressV1({ worldAddress: address, cycle: 7, used: 2, successful: [{ speciesId: beast.speciesId, source: 'tame' }] })],
    })).toThrow(/lacks current-cycle biosphere success|rolled back/u);
    // The page gone but its creature kept.
    expect(() => createOwnershipSuccessorV1(state, { ...contents, catalogSpecies: contents.catalogSpecies.filter((row) => row.speciesId !== beast.speciesId) }))
      .toThrow();
    // The page gone but its lot kept.
    const partly = withoutSpeciesV1(contents, plant.speciesId);
    expect(() => createOwnershipSuccessorV1(state, { ...partly, specimenLots: contents.specimenLots })).toThrow();
    // A plant's lot may still not grow.
    expect(() => createOwnershipSuccessorV1(state, {
      ...contents, specimenLots: contents.specimenLots.map((row) => createSpecimenLotV1({ ...row, quantity: row.quantity + 1 })),
    })).toThrow(/quantity increased/u);
  });

  it('a species that stays keeps its first record: leaving and returning cannot be one step', () => {
    const { state, plant } = held();
    const contents = contentsOf(state);
    const again = createWorldDiscoveryRecordV1({
      recordId: ownershipContentId('discovery', 'swapped') as DiscoveryRecordId, speciesId: plant.speciesId, verb: 'scavenge',
      worldAddress: address, cycle: 7, sourceOrdinal: 1, firstForSpecies: true,
    });
    const swapped = withoutSpeciesV1(contents, plant.speciesId);
    expect(() => createOwnershipSuccessorV1(state, {
      ...swapped,
      catalogSpecies: [...swapped.catalogSpecies, createCatalogSpeciesV1({ identity: plant, alias: null, firstObservationId: again.recordId })],
      discoveries: [...swapped.discoveries, again],
      specimenLots: [createSpecimenLotV1({ ...contents.specimenLots[0]!, lotId: ownershipContentId('specimen', 'swapped') as SpecimenLotId, acquisitionRecordId: again.recordId })],
      biosphereProgress: contents.biosphereProgress,
    })).toThrow(/first observation\/identity is immutable/u);
  });
});

describe('a Paragon is a whole beast', () => {
  const genome = paragonGenomeV1(0);
  const identity = canonicalGenomeIdentityV1(genome);
  const record = createParagonDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', 'paragon-0') as DiscoveryRecordId, speciesId: identity.speciesId, paragonIndex: 0, worldAddress: address, receiptOrdinal: 3,
  });
  const page = createCatalogSpeciesV1({ identity, alias: null, firstObservationId: record.recordId });
  const beast = createCreatureInstanceV1({
    creatureId: ownershipContentId('creature', 'paragon-0') as CreatureInstanceId, speciesId: identity.speciesId, genomeIdentity: identity.genomeIdentity,
    genome: identity.genome, nickname: null, origin: 'wild', acquisitionRecordId: record.recordId, lineage: { kind: 'none', generation: 0 },
    xp: null, hurt: null, fed: null, brood: null, assignment: null, bond: null,
  });
  const empty = { specimenLots: [], biosphereProgress: [], legacyBioX: [] };

  it('its record owns a creature, which can be named the scout', () => {
    const state = createInitialOwnershipStateV1({ ...empty, catalogSpecies: [page], discoveries: [record], creatures: [beast], scoutCreatureId: beast.creatureId });
    expect(state.creatures).toHaveLength(1);
    const read = decodeOwnershipStateV1(encodeOwnershipStateV1(state), SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(read.scoutCreatureId).toBe(beast.creatureId);
  });

  it('a Paragon stored as a page alone, as the first format stored it, still reads', () => {
    const state = createInitialOwnershipStateV1({ ...empty, catalogSpecies: [page], discoveries: [record], creatures: [], scoutCreatureId: null });
    expect(decodeOwnershipStateV1(encodeOwnershipStateV1(state), SCENE_OWNERSHIP_ADDRESS_RESOLVER).catalogSpecies).toHaveLength(1);
  });

  it('one Paragon is still one beast: a second creature on its record is refused', () => {
    const twin = createCreatureInstanceV1({ ...beast, creatureId: ownershipContentId('creature', 'paragon-0-twin') as CreatureInstanceId });
    expect(() => createInitialOwnershipStateV1({ ...empty, catalogSpecies: [page], discoveries: [record], creatures: [beast, twin], scoutCreatureId: null }))
      .toThrow(/one acquisition record cannot create duplicate owned rows/u);
  });
});
