import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createParagonDiscoveryRecordV1,
  createInitialOwnershipStateV1,
  decodeOwnershipStateV1,
  encodeOwnershipStateV1,
  migrateOwnershipStateV1ToV2,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
} from '../src/index.js';
import { createOwnershipSourceProjectionSuccessorV2 } from '../src/model-v2.js';
import { paragonGenomeV1, settleParagonCatalogueSourceV1 } from '../src/paragon.js';

beforeAll(() => installCaptureHooks());

function emptyOwnership() {
  return createInitialOwnershipStateV1({
    catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  });
}

function registeredWorld() {
  const resolved = resolveCF1WorldAddress({
    galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 424242, x: 560, y: 170 },
    planet: { seed: 133 },
  });
  if (!resolved.ok) throw new Error(resolved.reason);
  return resolved.address;
}

describe('@cf/domain-acquisition — Paragon catalogue provenance', () => {
  it('round-trips an older current state unchanged after the additive provenance variant', () => {
    const older = emptyOwnership();
    const encoded = encodeOwnershipStateV1(older);
    const decoded = decodeOwnershipStateV1(encoded, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(encodeOwnershipStateV1(decoded)).toBe(encoded);
    expect(ownershipStateDigestV1(decoded)).toBe(ownershipStateDigestV1(older));
  });

  it('adds one catalogue-only audit, round-trips its full address, and repeats at a fixed point', () => {
    const address = registeredWorld();
    const parent = migrateOwnershipStateV1ToV2(emptyOwnership());
    const added = settleParagonCatalogueSourceV1({
      parent, index: 7, address, receiptOrdinal: 42,
    });
    expect(added.kind).toBe('added');
    if (added.kind !== 'added') return;
    expect(added.sourceSuccessor).toMatchObject({ revision: 1, scoutCreatureId: null });
    expect(added.sourceSuccessor.catalogSpecies).toHaveLength(1);
    expect(added.sourceSuccessor.discoveries).toHaveLength(1);
    expect(added.sourceSuccessor.discoveries[0]).toMatchObject({
      acquisition: 'paragon', firstForSpecies: true,
      provenance: {
        kind: 'paragon', paragonIndex: 7,
        worldKey: address.key, worldAddress: address, receiptOrdinal: 42,
      },
    });
    expect(added.sourceSuccessor.creatures).toEqual([]);
    expect(added.sourceSuccessor.specimenLots).toEqual([]);
    expect(added.sourceSuccessor.biosphereProgress).toEqual([]);

    const encoded = encodeOwnershipStateV1(added.sourceSuccessor);
    const decoded = decodeOwnershipStateV1(encoded, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(encodeOwnershipStateV1(decoded)).toBe(encoded);
    expect(ownershipStateDigestV1(decoded)).toBe(ownershipStateDigestV1(added.sourceSuccessor));

    const current = createOwnershipSourceProjectionSuccessorV2(parent, added.sourceSuccessor);
    const repeat = settleParagonCatalogueSourceV1({
      parent: current, index: 7, address, receiptOrdinal: 43,
    });
    expect(repeat).toMatchObject({
      kind: 'repeat', index: 7, sourceSuccessor: null, discovery: null,
    });
    expect(ownershipSourceStateV1(current)).toEqual(added.sourceSuccessor);
  });

  it('binds new provenance to the exact indexed genome in state creation and persisted decode', () => {
    const address = registeredWorld();
    const added = settleParagonCatalogueSourceV1({
      parent: migrateOwnershipStateV1ToV2(emptyOwnership()),
      index: 0, address, receiptOrdinal: 42,
    });
    expect(added.kind).toBe('added');
    if (added.kind !== 'added') return;
    const encoded = encodeOwnershipStateV1(added.sourceSuccessor);
    const exactGenome = paragonGenomeV1(0);
    const controls = [
      { index: 1, genome: exactGenome },
      { index: 0, genome: { ...exactGenome, size: exactGenome.size + 1 } },
    ];
    for (const control of controls) {
      const identity = canonicalGenomeIdentityV1(control.genome);
      const catalogue = createCatalogSpeciesV1({
        identity, alias: null, firstObservationId: added.discovery.recordId,
      });
      const discovery = createParagonDiscoveryRecordV1({
        recordId: added.discovery.recordId, speciesId: identity.speciesId,
        paragonIndex: control.index, worldAddress: address, receiptOrdinal: 42,
      });
      expect(() => createInitialOwnershipStateV1({
        catalogSpecies: [catalogue], discoveries: [discovery],
        creatures: [], specimenLots: [], biosphereProgress: [], legacyBioX: [],
        scoutCreatureId: null,
      })).toThrow('Paragon catalogue provenance does not match its exact indexed genome');
      // Keep the row identity internally canonical: this must reject its
      // Paragon binding, not merely a stale species hash or malformed JSON.
      const persisted = JSON.parse(encoded);
      persisted.catalogSpecies = [catalogue];
      persisted.discoveries[0].speciesId = identity.speciesId;
      persisted.discoveries[0].provenance.paragonIndex = control.index;
      expect(() => decodeOwnershipStateV1(
        JSON.stringify(persisted), SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      )).toThrow('Paragon catalogue provenance does not match its exact indexed genome');
    }
    const restored = decodeOwnershipStateV1(encoded, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(encodeOwnershipStateV1(restored)).toBe(encoded);
    expect(ownershipStateDigestV1(restored)).toBe(ownershipStateDigestV1(added.sourceSuccessor));
    expect(restored.creatures).toEqual([]);
    expect(restored.specimenLots).toEqual([]);
    expect(restored.biosphereProgress).toEqual([]);
  });

  it('rejects cloned state or world provenance before producing a catalogue row', () => {
    const address = registeredWorld();
    const parent = migrateOwnershipStateV1ToV2(emptyOwnership());
    expect(() => settleParagonCatalogueSourceV1({
      parent: structuredClone(parent), index: 0, address, receiptOrdinal: 0,
    })).toThrow('registered current ownership parent');
    expect(() => settleParagonCatalogueSourceV1({
      parent, index: 0, address: structuredClone(address), receiptOrdinal: 0,
    })).toThrow('registered current world');
  });
});
