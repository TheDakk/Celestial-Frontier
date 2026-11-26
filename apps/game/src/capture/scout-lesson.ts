/* What a newly catalogued species teaches the Field Scout.

   LEGACY celestial-frontier.html, v1.8.9: when a capture puts a new species in the Compendium, a scout that still
   stands there and is not that species gains 2 experience (`discoverSpecies` 14941-14942), added as all
   experience is: to a beast only (`awardXP` 18224-18228). A creature's level is read from its experience and
   stops at the ninth, at 486 (`levelOf` 17567); the legacy game let the number run on unseen to 1,000,000, the
   save holds it to 486. */
import { createCreatureInstanceV1, createOwnershipSuccessorV1, type OwnershipStateV1, type SpeciesId } from '@cf/domain-acquisition';

export const SCOUT_LESSON_XP = 2;
export const CREATURE_XP_MAX = 486;
/** A creature's experience after a lesson of `n`. */
export const scoutLessonXp = (xp: number | null, n: number = SCOUT_LESSON_XP): number => Math.min(CREATURE_XP_MAX, (Number(xp) || 0) + n);

export interface ScoutLesson {
  /** The step after `parent` that holds the capture and the lesson together. */
  readonly successor: OwnershipStateV1;
  /** The seed of the scout's species: its page in the Compendium. */
  readonly scoutSeed: unknown;
  readonly xp: number;
}
/** The capture's step with the scout taught, or null when no scout stands or the scout is the species caught.
    `caught` is the capture's own step after `parent`. */
export function teachScout(parent: OwnershipStateV1, caught: OwnershipStateV1, caughtSpecies: SpeciesId): ScoutLesson | null {
  const scout = caught.scoutCreatureId === null ? undefined : caught.creatures.find((row) => row.creatureId === caught.scoutCreatureId);
  if (scout === undefined || scout.speciesId === caughtSpecies) return null;
  const xp = scoutLessonXp(scout.xp);
  const successor = createOwnershipSuccessorV1(parent, {
    catalogSpecies: caught.catalogSpecies, discoveries: caught.discoveries,
    creatures: caught.creatures.map((row) => row === scout ? createCreatureInstanceV1({ ...scout, xp }) : row),
    specimenLots: caught.specimenLots, biosphereProgress: caught.biosphereProgress, legacyBioX: caught.legacyBioX, scoutCreatureId: caught.scoutCreatureId,
  });
  return { successor, scoutSeed: scout.genome.seed, xp };
}
