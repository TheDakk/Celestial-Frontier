/* The name a species comes back under.

   LEGACY celestial-frontier.html, v1.8.9: the player's name for a species lives among the names, apart from the
   Compendium (`customNames`, 15729), and stays there when the species leaves it (`removeFromCodex` 18808-18821: a
   meal eaten, a scout lost). When the species is stored again it takes that name (`_storeSpecies` 14796-14797). */
import { createCatalogSpeciesV1, createOwnershipSuccessorV1, type OwnershipStateV1, type SpeciesId } from '@cf/domain-acquisition';

/** The capture's step with the caught species under the name the player gave it before it left the Compendium
    (`_storeSpecies` 14796-14797). `caught` is the capture's own step after `parent`. */
export function withKeptName(parent: OwnershipStateV1, caught: OwnershipStateV1, species: SpeciesId, name: string): OwnershipStateV1 {
  return createOwnershipSuccessorV1(parent, {
    catalogSpecies: caught.catalogSpecies.map((row) => row.speciesId !== species ? row : createCatalogSpeciesV1({
      identity: { speciesId: row.speciesId, genomeIdentity: row.genomeIdentity, kingdom: row.kingdom, genome: row.genome }, alias: name, firstObservationId: row.firstObservationId,
    })),
    discoveries: caught.discoveries, creatures: caught.creatures, specimenLots: caught.specimenLots, biosphereProgress: caught.biosphereProgress,
    legacyBioX: caught.legacyBioX, scoutCreatureId: caught.scoutCreatureId,
  });
}
