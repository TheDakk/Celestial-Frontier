/* Exact catalogue-only ownership for the Fifty Paragons.

   The legacy genome recipe is preserved byte-for-byte. A Paragon survey adds
   one canonical catalogue species and one full-address acquisition audit; it
   never pretends to be Tame, creates no owned individual/specimen, and spends
   no Biosphere Yield. This module is consumed only by the registered Bioscan
   settlement owner and the deterministic app finder. */
import { paragonGenomeV1 } from './paragon-internal.js';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createParagonDiscoveryRecordV1,
  ownershipContentId,
  ownershipStateDigestV1,
  type CatalogSpeciesV1,
  type DiscoveryRecordId,
  type DiscoveryRecordV1,
  type OwnershipStateV1,
} from './model.js';
import {
  createOwnershipSourceSuccessorV2,
  isOwnershipStateV2,
  ownershipSourceStateV1,
  type OwnershipStateV2,
} from './model-v2.js';
import { canonicalJson } from './canonical.js';
import { isCanonicalCF1Address, type CanonicalCF1WorldAddress } from '@cf/scene';

export {
  ARC9_PARAGON_COUNT_V1,
  ARC9_PARAGON_MILESTONE_COUNT_V1,
  ARC9_PARAGON_MILESTONE_STARDUST_V1,
  ARC9_PARAGON_MILESTONE_NAME_V1,
  paragonGenomeV1,
  paragonSeedV1,
} from './paragon-internal.js';

export type ParagonCatalogueSourceSettlementV1 =
  | Readonly<{
      kind: 'added';
      index: number;
      sourceParent: OwnershipStateV1;
      sourceSuccessor: OwnershipStateV1;
      discovery: DiscoveryRecordV1;
      catalogue: CatalogSpeciesV1;
    }>
  | Readonly<{
      kind: 'repeat';
      index: number;
      sourceParent: OwnershipStateV1;
      sourceSuccessor: null;
      discovery: null;
      catalogue: CatalogSpeciesV1;
    }>;

/** Mint the Arc 4 half of one exact Paragon Bioscan. The finder owns which
 * index belongs at the current world; this boundary proves that the supplied
 * address and identity are canonical and that the source change is exactly
 * catalogue + audit, with every ownership row otherwise retained. */
export function settleParagonCatalogueSourceV1(input: Readonly<{
  parent: OwnershipStateV2;
  index: number;
  address: CanonicalCF1WorldAddress;
  receiptOrdinal: number;
}>): ParagonCatalogueSourceSettlementV1 {
  if (!isOwnershipStateV2(input.parent) || input.parent.mode !== 'current') {
    throw new TypeError('Paragon catalogue requires a registered current ownership parent');
  }
  const index = input.index;
  const genome = paragonGenomeV1(index);
  if (!isCanonicalCF1Address(input.address) || !('planet' in input.address)) {
    throw new TypeError('Paragon catalogue requires a registered current world');
  }
  if (!Number.isSafeInteger(input.receiptOrdinal) || input.receiptOrdinal < 0
    || input.receiptOrdinal > 0xFFFF_FFFE) {
    throw new RangeError('Paragon catalogue receipt ordinal is invalid');
  }
  const sourceParent = ownershipSourceStateV1(input.parent);
  if (sourceParent.mode !== 'current') {
    throw new TypeError('Paragon catalogue source is protected');
  }
  const identity = canonicalGenomeIdentityV1(genome);
  const seedCollision = sourceParent.catalogSpecies.find((row) => (
    row.genome.seed === identity.genome.seed && row.speciesId !== identity.speciesId
  ));
  if (seedCollision !== undefined) {
    throw new TypeError('Paragon legacy Codex seed collides with another canonical species');
  }
  const existing = sourceParent.catalogSpecies.find((row) => row.speciesId === identity.speciesId);
  if (existing !== undefined) {
    if (existing.genomeIdentity !== identity.genomeIdentity
      || canonicalJson(existing.genome) !== canonicalJson(identity.genome)) {
      throw new TypeError('Paragon catalogue identity is forged or divergent');
    }
    return Object.freeze({
      kind: 'repeat', index, sourceParent, sourceSuccessor: null,
      discovery: null, catalogue: existing,
    });
  }
  const recordId = ownershipContentId('discovery', canonicalJson({
    schema: 'cf-v2-paragon-bioscan-event/v1',
    parentDigest: ownershipStateDigestV1(sourceParent),
    receiptOrdinal: input.receiptOrdinal,
    paragonIndex: index,
    speciesId: identity.speciesId,
    worldKey: input.address.key,
  })) as DiscoveryRecordId;
  const discovery = createParagonDiscoveryRecordV1({
    recordId,
    speciesId: identity.speciesId,
    paragonIndex: index,
    worldAddress: input.address,
    receiptOrdinal: input.receiptOrdinal,
  });
  const catalogue = createCatalogSpeciesV1({
    identity,
    alias: null,
    firstObservationId: recordId,
  });
  const sourceSuccessor = createOwnershipSourceSuccessorV2(input.parent, {
    catalogSpecies: [...sourceParent.catalogSpecies, catalogue],
    discoveries: [...sourceParent.discoveries, discovery],
    creatures: sourceParent.creatures,
    specimenLots: sourceParent.specimenLots,
    biosphereProgress: sourceParent.biosphereProgress,
    legacyBioX: sourceParent.legacyBioX,
    scoutCreatureId: sourceParent.scoutCreatureId,
  });
  return Object.freeze({
    kind: 'added', index, sourceParent, sourceSuccessor, discovery, catalogue,
  });
}
