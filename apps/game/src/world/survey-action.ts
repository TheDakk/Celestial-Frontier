/* A survey, committed: what it adds to the record and one receipt, in one revision or not at all, with no random
   draw. A survey that shows nothing new takes no receipt.

   What a survey writes is the legacy game's `noteSurvey` (LEGACY celestial-frontier.html, v1.8.9, 16451-16462;
   see `survey-fact.ts`). The legacy game says `survey` to the rest of the game at every deliberate survey, new or
   not (`gameEvent('survey')` 13760): here that is `survey:done`.

   Ported from the painted port's `commitArc9SurveySettlementV1` (`arc9-survey-action.ts` 632-754): the preparation
   before storage, the same preparation again on the receipt's own draft, then a check that what was stored is
   what the survey staged. Its third preparation over the stored state is not carried (the stored state is already
   held equal to the staged one), nor its copy of the caller's state and its field-by-field
   publication: the save runtime hands the derivation its own draft, and the save loop writes a committed state
   into the live one by one rule. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import type {
  F4DeterministicProductDeriveInput,
  F4DeterministicProductTransactionOutcome,
  F4OutcomeDerivation,
  SaveStateV2,
} from '@cf/persistence';
import type { Bus } from '../bus';
import type { GameEvents } from '../events';
import { prepareSurveySettlementV1, type SurveyAddressV1, type SurveyFactV1 } from './survey-fact';

export const SURVEY_RECEIPT_KIND_V1 = 'arc9-survey-v1' as const;
export const SURVEY_WITNESS_SCHEMA_V1 = 'cf-v2-survey-witness/v1' as const;
/** The name the save loop and the bus know this action by. */
export const SURVEY_ACTION = 'survey' as const;

/** What the save runtime's action path answers: the stored state rides on a committed outcome. */
export type SurveyTransactionV1 =
  | Exclude<F4DeterministicProductTransactionOutcome, { readonly kind: 'committed' }>
  | (Extract<F4DeterministicProductTransactionOutcome, { readonly kind: 'committed' }> & { readonly state: SaveStateV2 })
  | { readonly kind: 'lease-unavailable' };
type Committed = Extract<SurveyTransactionV1, { readonly kind: 'committed' }>;
/** The one path of the save runtime a survey needs. */
export interface SurveyAuthorityV1 {
  commitAction(input: {
    readonly state: SaveStateV2; readonly operation: string; readonly receiptKind: string; readonly codecNow: number;
    readonly derive: (input: F4DeterministicProductDeriveInput) => F4OutcomeDerivation;
  }): Promise<SurveyTransactionV1>;
}

export interface SurveyActionInputV1 {
  readonly runtime: SurveyAuthorityV1;
  /** The last stored state. */
  readonly state: SaveStateV2;
  readonly address: SurveyAddressV1;
  readonly codecNow: number;
}

export type SurveyActionOutcomeV1 =
  /** Nothing new: nothing written. */
  | Readonly<{ kind: 'current'; facts: SurveyFactV1 }>
  | Readonly<{ kind: 'committed'; state: SaveStateV2; facts: SurveyFactV1; addedAchievementIds: readonly string[]; transaction: Committed }>
  /** Stored, but what was stored is not what this survey staged: the page should stop writing and reload. */
  | Readonly<{ kind: 'committed-convergence'; mismatch: readonly string[]; transaction: Committed }>
  /** Nothing was written. `transaction` is storage's own answer when the survey got that far. */
  | Readonly<{ kind: 'refused'; detail: string; transaction: Exclude<SurveyTransactionV1, { readonly kind: 'committed' }> | null }>;

export function operationForSurveyV1(address: SurveyAddressV1): string {
  return `arc9.survey:${sha256Hex(address.key)}`;
}

interface Plan {
  readonly facts: SurveyFactV1;
  readonly addedAchievementIds: readonly string[];
  readonly witness: string;
  readonly expectedState: string;
}

/** Commits one survey. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export async function commitSurveyActionV1(input: SurveyActionInputV1): Promise<SurveyActionOutcomeV1> {
  const preflight = prepareSurveySettlementV1(input.state, input.address);
  if (preflight.kind === 'protected') return Object.freeze({ kind: 'refused', detail: `preflight:${preflight.reason}`, transaction: null });
  if (preflight.kind === 'current') return Object.freeze({ kind: 'current', facts: preflight.facts });
  const operation = operationForSurveyV1(input.address);
  let plan: Plan | null = null;
  const transaction = await input.runtime.commitAction({
    state: input.state, operation, receiptKind: SURVEY_RECEIPT_KIND_V1, codecNow: input.codecNow,
    derive: ({ draft, receiptOrdinal, canonicalizeState }) => {
      const prepared = prepareSurveySettlementV1(draft, input.address);
      if (prepared.kind !== 'ready') throw new Error('the survey\'s parent changed before its receipt');
      const witness = `${SURVEY_WITNESS_SCHEMA_V1}:${sha256Hex(canonicalJson({
        operation, receiptOrdinal, facts: prepared.facts, addedAchievementIds: prepared.addedAchievementIds,
      }))}`;
      plan = {
        facts: prepared.facts, addedAchievementIds: prepared.addedAchievementIds, witness,
        expectedState: canonicalJson(canonicalizeState(prepared.successorState)),
      };
      return { state: prepared.successorState, witness };
    },
  });
  if (transaction.kind !== 'committed') return Object.freeze({ kind: 'refused', detail: transaction.kind, transaction });
  const staged = plan as Plan | null;
  if (staged === null) return Object.freeze({ kind: 'committed-convergence', mismatch: Object.freeze(['plan']), transaction });
  const mismatch = [
    transaction.plan.operation !== operation ? 'operation' : null,
    transaction.plan.receiptOrdinal !== transaction.receipt.ordinal ? 'receipt-ordinal' : null,
    transaction.receipt.kind !== SURVEY_RECEIPT_KIND_V1 ? 'receipt-kind' : null,
    transaction.receipt.witness !== staged.witness ? 'receipt-witness' : null,
    canonicalJson(transaction.state) !== canonicalJson(transaction.saved.canonicalState) ? 'state-not-stored' : null,
    canonicalJson(transaction.state) !== staged.expectedState ? 'successor-state' : null,
  ].filter((value): value is string => value !== null);
  if (mismatch.length > 0) return Object.freeze({ kind: 'committed-convergence', mismatch: Object.freeze(mismatch), transaction });
  return Object.freeze({
    kind: 'committed', state: transaction.state, facts: staged.facts, addedAchievementIds: staged.addedAchievementIds, transaction,
  });
}

/** The save loop's door for a product action, as far as a survey uses it. */
export interface SurveyDoorV1 {
  settle(
    kind: string,
    commit: (runtime: SurveyAuthorityV1, durable: SaveStateV2) => Promise<SurveyTransactionV1 | { readonly kind: 'declined'; readonly reason: string }>,
  ): Promise<SurveyTransactionV1 | { readonly kind: 'declined'; readonly reason: string } | { readonly kind: 'refused'; readonly reason: string }>;
}

export interface SurveySettleDepsV1 {
  readonly door: SurveyDoorV1;
  readonly bus: Bus<GameEvents>;
  /** The state the player sees. */
  live(): SaveStateV2;
}

/** One survey as the page makes it: one product action at a time, never under a write hold, from the last stored
    state. A committed survey is in the live state when this resolves; `survey:done` is said for every survey that
    was made, whether or not it showed anything new. A survey that shows nothing new does not ask for the door at
    all: locking a card twice is not a refused action. */
export async function settleSurveyV1(
  deps: SurveySettleDepsV1,
  input: Pick<SurveyActionInputV1, 'address' | 'codecNow'>,
): Promise<SurveyActionOutcomeV1> {
  const seen = prepareSurveySettlementV1(deps.live(), input.address);
  if (seen.kind === 'current') {
    try { deps.bus.emit('survey:done', { address: input.address }); } catch { /* the listener's own fault */ }
    return Object.freeze({ kind: 'current', facts: seen.facts });
  }
  let own: SurveyActionOutcomeV1 | null = null;
  const answer = await deps.door.settle(SURVEY_ACTION, async (runtime, durable) => {
    const outcome = await commitSurveyActionV1({ ...input, runtime, state: durable });
    own = outcome;
    if (outcome.kind === 'committed' || outcome.kind === 'committed-convergence') return outcome.transaction;
    if (outcome.kind === 'refused' && outcome.transaction !== null) return outcome.transaction;
    return { kind: 'declined', reason: outcome.kind === 'current' ? 'current' : outcome.detail };
  });
  const outcome = own as SurveyActionOutcomeV1 | null;
  if (outcome === null) return Object.freeze({ kind: 'refused', detail: answer.kind === 'refused' ? answer.reason : answer.kind, transaction: null });
  if (outcome.kind === 'committed' || outcome.kind === 'current') {
    try { deps.bus.emit('survey:done', { address: input.address }); } catch { /* the listener's own fault */ }
  }
  return outcome;
}
