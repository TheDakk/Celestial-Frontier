/* One press of Scout on a specimen card, committed: a beast of the Compendium is named the Field Scout, or the
   scout stands down.

   LEGACY celestial-frontier.html, v1.8.9: the button stands on a beast the Compendium holds (15150); a press on
   the scout stands it down, a press on another beast names that one (15198); naming one is the `scout-set` deed,
   standing one down is not (15199, `gameEvent` 25358-25363). The scout takes the strike of a hostile scan
   (`bioscan-action.ts`) and learns from each newly catalogued species (`capture/action.ts`).

   Ported from the painted port's `arc5-scout-action.ts`, which named a creature by its own id and refused an
   unchanged press; here the press is the legacy toggle on the Compendium's page. A Paragon's page has no creature
   behind it in the save's carrier, so it cannot be named the scout (the legacy game could). */
import type { SaveStateV2, V5ExtensionWrite } from '@cf/persistence';
import { commitCare, refuse, settleCare, type CareAuthority, type CareCharterStager, type CareOutcome, type CareSettleDeps } from './commit';
import { compendiumRow, contentsOf, ownershipOf, stageOwnership } from './ownership';

export const SCOUT_ACTION = 'scout' as const;
export const SCOUT_RECEIPT_KIND_V1 = 'care-field-scout-v1' as const;

export interface ScoutFactsV1 {
  readonly speciesId: string;
  readonly scoutBefore: string | null;
  /** The scout after the press; null when it stood down. */
  readonly scoutAfter: string | null;
  /** A scout was named: the deed the Charters hear. */
  readonly named: boolean;
  readonly charters: Readonly<{ progressIds: readonly string[]; completedIds: readonly string[] }>;
}
export type ScoutActionOutcomeV1 = CareOutcome<ScoutFactsV1>;
export interface ScoutActionInputV1 {
  readonly runtime: CareAuthority;
  /** The last stored state. */
  readonly state: SaveStateV2;
  /** The Compendium id of the page the button was pressed on. */
  readonly speciesId: string;
  readonly codecNow: number;
  readonly charters: CareCharterStager;
}

/** Commits one press of Scout. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export function commitScoutV1(input: ScoutActionInputV1): Promise<ScoutActionOutcomeV1> {
  const { speciesId } = input;
  const beast = (extensions: Parameters<typeof ownershipOf>[0]) => {
    const ownership = ownershipOf(extensions);
    const row = compendiumRow(ownership, speciesId);
    if (row === null) return refuse('not-in-compendium');
    if (row.species.kingdom !== 'fauna') return refuse('not-a-beast');
    if (row.creature === null) return refuse('no-creature');
    return { ownership, creature: row.creature };
  };
  return commitCare<ScoutFactsV1>({
    runtime: input.runtime, state: input.state, codecNow: input.codecNow, receiptKind: SCOUT_RECEIPT_KIND_V1,
    route: () => ({ operation: `care.scout:${speciesId}` }),
    preflight: (_state, extensions) => { beast(extensions); },
    stage: ({ draft, extensions, receiptOrdinal, activePlayMs }) => {
      const { ownership, creature } = beast(extensions);
      const scoutBefore = draft.scoutId;
      const standDown = ownership.scoutCreatureId === creature.creatureId;
      const writes: V5ExtensionWrite[] = [...stageOwnership({
        draft, extensions, parent: ownership, contents: { ...contentsOf(ownership), scoutCreatureId: standDown ? null : creature.creatureId }, touched: [],
      })];
      let charters: ScoutFactsV1['charters'] = { progressIds: [], completedIds: [] };
      if (!standDown && draft.tutDone) {
        const staged = input.charters({ draft, extensions, event: { kind: 'scout-set', scoutId: speciesId }, receiptOrdinal, activePlayMs });
        if (staged.kind === 'refused') return refuse(`charter:${staged.reason}`);
        charters = { progressIds: [...staged.facts.progressIds], completedIds: staged.facts.completions.map(({ id }) => id) };
        writes.push(...staged.facts.extensionWrites);
      }
      return { facts: { speciesId, scoutBefore, scoutAfter: draft.scoutId, named: !standDown, charters }, extensionWrites: writes };
    },
    verify: (stored, facts) => stored.scoutId !== facts.scoutAfter ? 'scout'
      : facts.charters.completedIds.some((id) => !stored.chDone.includes(id)) ? 'charters' : null,
  });
}

/** One press of Scout as the page makes it. */
export function settleScoutV1(deps: CareSettleDeps, input: Pick<ScoutActionInputV1, 'speciesId' | 'codecNow'>): Promise<ScoutActionOutcomeV1> {
  return settleCare(deps.door, SCOUT_ACTION, (runtime, durable) => commitScoutV1({ ...input, runtime, state: durable, charters: deps.charters }));
}
