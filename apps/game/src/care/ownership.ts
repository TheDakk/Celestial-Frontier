/* The Compendium and its creatures as the save keeps them, for the care actions.

   The legacy game kept one row per species, the creature itself (`codex` 14660-14664). The save keeps the same
   facts in the ownership carrier (a catalogue of species, the creatures, the scout) and mirrors them into the
   state's own Compendium, names and scout. A care action changes the carrier by one step and writes the mirror of
   that step into the draft, so the two never disagree.

   The carrier cannot take a species out of the Compendium, a creature out of the roster, or a plant out of the
   stores (`@cf/domain-acquisition` `validateSuccessor`): the legacy steps that do (a meal consumed, a scout lost)
   are not built on it; see `bioscan-action.ts`. */
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  createOwnershipSuccessorV1,
  type CatalogSpeciesV1,
  type CreatureInstanceV1,
  type OwnershipStateContentsV1,
  type OwnershipStateV1,
} from '@cf/domain-acquisition';
import {
  prepareArc4OwnershipWrite,
  projectLegacyOwnershipMirror,
  readArc4Ownership,
  type CodexEntry,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import { refuse } from './commit';

/** The id the Compendium knows a species by (`codexId` 14661). */
export const compendiumId = (seed: unknown): string => `s${String(seed)}`;

/** The ownership carrier of these extensions; raises a `CareRefusal` when it cannot be read or changed. */
export function ownershipOf(extensions: V5Extensions): OwnershipStateV1 {
  const read = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (read.kind !== 'loaded') return refuse(`ownership:${read.kind}`);
  if (read.state.mode !== 'current') return refuse('ownership:protected');
  return read.state;
}

export interface CompendiumRow {
  readonly species: CatalogSpeciesV1;
  /** The creature this page is: the one the species was first taken with. Null for a plant, a fungus, a microbe,
      and a Paragon, which the carrier keeps as a page alone. */
  readonly creature: CreatureInstanceV1 | null;
}
/** The Compendium page with this id, or null. */
export function compendiumRow(ownership: OwnershipStateV1, id: string): CompendiumRow | null {
  const species = ownership.catalogSpecies.find((row) => compendiumId(row.genome.seed) === id);
  if (species === undefined) return null;
  return { species, creature: ownership.creatures.find((row) => row.acquisitionRecordId === species.firstObservationId) ?? null };
}

/** The carrier's rows, to change some of and hand back. */
export const contentsOf = (ownership: OwnershipStateV1): OwnershipStateContentsV1 => ({
  catalogSpecies: ownership.catalogSpecies, discoveries: ownership.discoveries, creatures: ownership.creatures,
  specimenLots: ownership.specimenLots, biosphereProgress: ownership.biosphereProgress, legacyBioX: ownership.legacyBioX,
  scoutCreatureId: ownership.scoutCreatureId,
});

/** Makes the carrier's next step from `contents`, writes its mirror into the draft and returns the carrier's rows.
    `touched` names the pages whose row in the draft is made again from the carrier; `entryOf` makes a page the
    draft does not hold yet. Raises a `CareRefusal` when the step is not one the carrier allows. */
export function stageOwnership(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  parent: OwnershipStateV1;
  contents: OwnershipStateContentsV1;
  touched: readonly string[];
  entryOf?: (id: string, g: Record<string, unknown>, from: string, where: Record<string, unknown> | null) => CodexEntry;
}>): readonly V5ExtensionWrite[] {
  const { draft } = input;
  let successor: OwnershipStateV1;
  try {
    successor = createOwnershipSuccessorV1(input.parent, input.contents);
  } catch (error) {
    return refuse(`ownership:${error instanceof Error ? error.message : String(error)}`);
  }
  const write = prepareArc4OwnershipWrite({ extensions: input.extensions, state: successor, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (write.kind !== 'prepared') return refuse(`ownership:${write.reason}`);
  const mirror = projectLegacyOwnershipMirror(successor);
  if (mirror.kind !== 'projected') return refuse(`ownership:${mirror.kind}`);
  const held = new Map(draft.codex);
  draft.codex = mirror.codex.map((row) => {
    const was = held.get(row.legacyCodexId);
    const g = row.g as Record<string, unknown>;
    if (was === undefined) {
      if (input.entryOf === undefined) return refuse('ownership:unknown-page');
      return [row.legacyCodexId, input.entryOf(row.legacyCodexId, g, row.f, row.w as Record<string, unknown> | null)];
    }
    return [row.legacyCodexId, input.touched.includes(row.legacyCodexId) ? { ...was, g } : was];
  });
  // The names the carrier owns are the Compendium's; every other name (a world's, a star's) stays where it is.
  const owned = new Set(mirror.codex.map((row) => `c${row.legacyCodexId}`));
  draft.customNames = [...draft.customNames.filter(([key]) => !owned.has(key)), ...mirror.customNames.map(([key, name]): [string, string] => [key, name])];
  draft.scoutId = mirror.scoutId;
  return write.writes;
}
