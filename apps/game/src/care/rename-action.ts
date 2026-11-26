/* A species of the Compendium renamed, committed.

   LEGACY celestial-frontier.html, v1.8.9: the edit mark stands by the name of any page the Compendium holds
   (15039-15045); the name is cleaned (`cleanName` 15732: the characters < > & " ' dropped, the ends trimmed, 24
   characters kept) and a name with nothing left changes nothing (24618); otherwise it becomes the page's name, is
   kept in the names under `c` and the page's id, and unlocks `namer`; then the achievements are looked at, which
   count the names (`commitExplorerName` 24615-24626, `names5` and `names15` 16443-16444). The page's own name is
   not written here: the save's writer names every page from the names (the legacy rule, 14796-14797).

   Ported from the painted port's `arc5-rename-action.ts`, which named a living beast alone; the legacy game names
   any page. A name already the page's own is not stored a second time. */
import { createCatalogSpeciesV1 } from '@cf/domain-acquisition';
import { cleanName } from '@cf/domain-naming';
import { prepareArc9EventAchievementJoinV1, prepareArc9ProgressionRefreshV1, type SaveStateV2, type V5ExtensionWrite } from '@cf/persistence';
import { commitCare, refuse, settleCare, type CareAuthority, type CareDoor, type CareOutcome } from './commit';
import { compendiumRow, contentsOf, ownershipOf, stageOwnership } from './ownership';

export const RENAME_ACTION = 'rename' as const;
export const RENAME_RECEIPT_KIND_V1 = 'care-rename-v1' as const;
/** The characters a name keeps at most. */
export const SPECIES_NAME_MAX = 24;
/** The name as it will be stored; empty when nothing of it is left. Cleaned twice: the cut to 24 characters can
    leave a space at the end, which the save's reader trims when it cleans every name again (16674-16675; the legacy
    game showed that space until the next load). */
export const cleanSpeciesName = (raw: string): string => cleanName(cleanName(raw, SPECIES_NAME_MAX), SPECIES_NAME_MAX);

export interface RenameFactsV1 {
  readonly speciesId: string;
  readonly name: string;
  readonly achievementIds: readonly string[];
}
export type RenameActionOutcomeV1 =
  | CareOutcome<RenameFactsV1>
  /** Nothing to store: the name was empty after cleaning, or is the page's own already. Nothing was asked of storage. */
  | Readonly<{ kind: 'current'; reason: 'empty' | 'unchanged' }>;
export interface RenameActionInputV1 {
  readonly runtime: CareAuthority;
  /** The last stored state. */
  readonly state: SaveStateV2;
  readonly speciesId: string;
  readonly rawName: string;
  readonly codecNow: number;
}

/** Why a rename would store nothing in this state, or null when it would store something. */
function nothingToStore(state: SaveStateV2, speciesId: string, name: string): 'empty' | 'unchanged' | null {
  if (name === '') return 'empty';
  const kept = state.customNames.find(([key]) => key === `c${speciesId}`)?.[1];
  return kept === name && state.unlocked.includes('namer') ? 'unchanged' : null;
}

/** Commits one rename. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export async function commitRenameV1(input: RenameActionInputV1): Promise<RenameActionOutcomeV1> {
  const { speciesId } = input;
  const name = cleanSpeciesName(input.rawName);
  const nothing = nothingToStore(input.state, speciesId, name);
  if (nothing !== null) return Object.freeze({ kind: 'current', reason: nothing });
  return commitCare<RenameFactsV1>({
    runtime: input.runtime, state: input.state, codecNow: input.codecNow, receiptKind: RENAME_RECEIPT_KIND_V1,
    route: () => ({ operation: `care.rename:${speciesId}` }),
    preflight: (_state, extensions) => { if (compendiumRow(ownershipOf(extensions), speciesId) === null) refuse('not-in-compendium'); },
    stage: ({ draft, extensions }) => {
      const ownership = ownershipOf(extensions);
      const row = compendiumRow(ownership, speciesId);
      if (row === null) return refuse('not-in-compendium');
      if (nothingToStore(draft, speciesId, name) !== null) return refuse('name:changed-before-its-receipt');
      const unlockedBefore = new Set(draft.unlocked);
      const writes: V5ExtensionWrite[] = [];
      if (row.species.alias !== name) {
        const { speciesId: id, genomeIdentity, kingdom, genome, firstObservationId } = row.species;
        const renamed = createCatalogSpeciesV1({ identity: { speciesId: id, genomeIdentity, kingdom, genome }, alias: name, firstObservationId });
        writes.push(...stageOwnership({
          draft, extensions, parent: ownership, touched: [],
          contents: { ...contentsOf(ownership), catalogSpecies: ownership.catalogSpecies.map((species) => species === row.species ? renamed : species) },
        }));
      }
      const namer = prepareArc9EventAchievementJoinV1(draft, 'namer');
      if (namer.kind !== 'prepared') return refuse(`achievement:${namer.reason}`);
      draft.unlocked = [...namer.nextUnlockedIds];
      const refresh = prepareArc9ProgressionRefreshV1(draft);
      if (refresh.kind === 'protected') return refuse(`progression:${refresh.reason}`);
      if (refresh.kind === 'ready') {
        draft.unlocked = [...refresh.successorState.unlocked];
        draft.stats = { ...refresh.successorState.stats };
      }
      return { facts: { speciesId, name, achievementIds: draft.unlocked.filter((id) => !unlockedBefore.has(id)) }, extensionWrites: writes };
    },
    verify: (stored, facts) => stored.customNames.find(([key]) => key === `c${facts.speciesId}`)?.[1] !== facts.name ? 'name'
      : stored.codex.find(([id]) => id === facts.speciesId)?.[1].name !== facts.name ? 'page'
        : !stored.unlocked.includes('namer') ? 'achievements' : null,
  });
}

export interface RenameSettleDeps {
  readonly door: CareDoor;
  /** The state the player sees. */
  live(): SaveStateV2;
}
/** One rename as the page makes it. A name that would store nothing does not ask for the door at all: closing
    the box on an empty name is not a refused action. */
export async function settleRenameV1(deps: RenameSettleDeps, input: Pick<RenameActionInputV1, 'speciesId' | 'rawName' | 'codecNow'>): Promise<RenameActionOutcomeV1> {
  const nothing = nothingToStore(deps.live(), input.speciesId, cleanSpeciesName(input.rawName));
  if (nothing !== null) return Object.freeze({ kind: 'current', reason: nothing });
  let current: Extract<RenameActionOutcomeV1, { readonly kind: 'current' }> | null = null;
  const outcome = await settleCare<RenameFactsV1>(deps.door, RENAME_ACTION, async (runtime, durable) => {
    const settled = await commitRenameV1({ ...input, runtime, state: durable });
    if (settled.kind !== 'current') return settled;
    current = settled;
    return Object.freeze({ kind: 'refused', detail: `current:${settled.reason}`, transaction: null });
  });
  return current ?? outcome;
}
