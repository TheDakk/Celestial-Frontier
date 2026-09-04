import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  createInitialOwnershipStateV1,
  decodeOwnershipStateV1,
  encodeOwnershipStateV1,
  migrateOwnershipStateV1ToV2,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
} from '../src/index.js';
import { createOwnershipSourceProjectionSuccessorV2 } from '../src/model-v2.js';
import { settleParagonCatalogueSourceV1 } from '../src/paragon.js';

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
