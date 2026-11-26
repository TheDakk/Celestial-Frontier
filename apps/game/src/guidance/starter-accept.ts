/* Accepting a Charter, committed: the accept, the completion it proves on the spot (a claim), its Stardust and
   gear, and one receipt, in one revision or not at all.

   The rules are the legacy game's `chAccept` (LEGACY celestial-frontier.html, v1.8.9, 24878-24906): an accept of
   a Charter already accepted or done does nothing (24884); a fourth is refused with the slate's words (24885);
   the board is inert in training but for the graduation accept (24882-24883); a deed already done completes at
   once (24889-24904, `_chComplete` 24865-24877). Those rules live in `starter-stage.ts` and, for the weekly
   board, in `@cf/persistence`; this file is their one door to storage.

   The shape (a refusal before storage where the board already says no, the staging inside the receipt's own
   derivation, then a check that what was stored is what was staged) is the painted port's
   `commitStarterCharterAcceptV1` and its weekly twin (`starter-charters.ts` 759-916). Its field-by-field
   publication is not carried: the save loop writes a committed state into the live one by one rule. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import {
  WEEKLY_CHARTER_CAP_V1,
  WEEKLY_CHARTER_DEFINITIONS_V1,
  applyV5ExtensionWrites,
  arc2LootLegacyMirrorMatches,
  encodeArc2LootCarrier,
  projectWeeklyCharterBoardV1,
  readArc2Loot,
  stageWeeklyCharterAcceptV1,
  weeklyCharterCycleV1,
  type Arc2LootInventoryV1,
  type F4DeterministicProductDeriveInput,
  type F4DeterministicProductTransactionOutcome,
  type F4OutcomeDerivation,
  type SaveStateV2,
  type V5Extensions,
  type WeeklyCharterIdV1,
} from '@cf/persistence';
import { projectStarterCharterBoardV1 } from './starter-board';
import { STARTER_CHARTER_CAP_V1, checkedState, definitionFor, type StarterCharterIdV1 } from './starter-charters';
import { stageStarterCharterAcceptV1, type StarterCharterStageFactsV1 } from './starter-stage';

export const STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1 = 'arc8-starter-charter-accept-v1' as const;
export const STARTER_CHARTER_ACCEPT_WITNESS_SCHEMA_V1 = 'cf-v2-starter-charter-accept-witness/v1' as const;
/** The name the save loop and the bus know this action by. */
export const CHARTER_ACCEPT_ACTION = 'charter-accept' as const;
const OPERATION_PREFIX = 'arc8.starter-charter-accept:';
const FULL_SLATE = 'Three charters is a full slate — see one through first.';
const INERT = 'the board is inert until training ends';

export type CharterAcceptIdV1 = StarterCharterIdV1 | WeeklyCharterIdV1;
export function isWeeklyCharterIdV1(id: string): id is WeeklyCharterIdV1 {
  return WEEKLY_CHARTER_DEFINITIONS_V1.some((definition) => definition.id === id);
}

/** What the save runtime's action path answers: the stored state rides on a committed outcome. */
type Stored<O extends { readonly kind: string }> =
  | Exclude<O, { readonly kind: 'committed' }>
  | (Extract<O, { readonly kind: 'committed' }> & { readonly state: SaveStateV2 })
  | { readonly kind: 'lease-unavailable' };
export type CharterAcceptTransactionV1 = Stored<F4DeterministicProductTransactionOutcome>;
type Committed = Extract<CharterAcceptTransactionV1, { readonly kind: 'committed' }>;
/** The one path of the save runtime an accept needs. */
export interface CharterAcceptAuthorityV1 {
  commitAction(input: {
    readonly state: SaveStateV2;
    readonly operation: string;
    readonly receiptKind: string;
    readonly codecNow: number;
    readonly derive: (input: F4DeterministicProductDeriveInput) => F4OutcomeDerivation;
  }): Promise<CharterAcceptTransactionV1>;
}

/** The fields an accept may change. */
interface CharterFields {
  readonly chacc: readonly string[];
  readonly chDone: readonly string[];
  readonly chProg: Readonly<Record<string, number>>;
  readonly chWeek: number;
  readonly essence: number;
  readonly stats: Readonly<Record<string, number>>;
  readonly items: readonly (readonly [string, number])[];
  readonly equip: Readonly<Record<string, string>>;
  readonly equipAff: SaveStateV2['equipAff'];
  readonly unlocked: readonly string[];
}
const fieldsOf = (state: SaveStateV2): CharterFields => ({
  chacc: state.chacc, chDone: state.chDone, chProg: state.chProg, chWeek: state.chWeek, essence: state.essence,
  stats: state.stats, items: state.items, equip: state.equip, equipAff: state.equipAff, unlocked: state.unlocked,
});

export interface StarterCharterAcceptFactsV1 {
  readonly schema: typeof STARTER_CHARTER_ACCEPT_WITNESS_SCHEMA_V1;
  readonly id: CharterAcceptIdV1;
  readonly receiptOrdinal: number;
  readonly stage: StarterCharterStageFactsV1;
  readonly source: CharterFields;
  readonly successor: CharterFields;
}

export type CharterAcceptOutcomeV1 =
  /** Already accepted, or already done: nothing to do, nothing written. */
  | Readonly<{ kind: 'current'; id: CharterAcceptIdV1 }>
  /** Nothing was written. `transaction` is storage's own answer when the accept got that far. */
  | Readonly<{ kind: 'refused'; detail: string; transaction?: Exclude<CharterAcceptTransactionV1, { readonly kind: 'committed' }> }>
  | Readonly<{ kind: 'committed'; state: SaveStateV2; facts: StarterCharterAcceptFactsV1; transaction: Committed }>
  /** Stored, but what was stored is not what this accept staged: the page should stop writing and reload. */
  | Readonly<{ kind: 'committed-convergence'; detail: 'missing-plan' | 'committed-verification-mismatch'; transaction: Committed }>;

export interface CharterAcceptInputV1 {
  /** The last stored state. */
  readonly state: SaveStateV2;
  /** The extensions stored with it: the board reads the worlds landed on from them. */
  readonly extensions: V5Extensions;
  readonly id: CharterAcceptIdV1;
  readonly codecNow: number;
  readonly authority: CharterAcceptAuthorityV1;
  /** The active play the board was shown at. A weekly accept needs it: its cycle names the operation. */
  readonly activePlayMs?: number;
  /** True only for the accept that is the last lesson of training. */
  readonly graduation?: boolean;
}

export function operationForStarterCharterAcceptV1(id: StarterCharterIdV1): string {
  return `${OPERATION_PREFIX}${definitionFor(id).id}`;
}
/** A weekly accept is once a board: the same Charter can be accepted again on a later one. */
export function operationForWeeklyCharterAcceptV1(id: WeeklyCharterIdV1, cycle: number): string {
  if (!isWeeklyCharterIdV1(id) || !Number.isSafeInteger(cycle) || cycle < 0) throw new RangeError('weekly Charter accept operation');
  return `${OPERATION_PREFIX}${id}@${cycle}`;
}

interface Plan {
  readonly facts: StarterCharterAcceptFactsV1;
  readonly witness: string;
  readonly expectedState: string;
  /** The gear carrier the accept leaves, when it granted gear. */
  readonly expectedLoot: Arc2LootInventoryV1 | null;
}
const refused = (detail: string): CharterAcceptOutcomeV1 => Object.freeze({ kind: 'refused', detail });

/** The gear inventory of these extensions, when it is readable and agrees with the state. */
function lootOf(extensions: V5Extensions, state: SaveStateV2): Arc2LootInventoryV1 | null {
  const read = readArc2Loot(extensions);
  return read.kind === 'loaded' && read.state.kind === 'inventory' && arc2LootLegacyMirrorMatches(read.state, state) ? read.state : null;
}

/** One accept through one receipt. `stage` works on the receipt's own draft and returns what it staged. */
async function commit(
  input: CharterAcceptInputV1,
  operation: string,
  stage: (derive: F4DeterministicProductDeriveInput) => Readonly<{ facts: StarterCharterStageFactsV1; gear: boolean }>,
): Promise<CharterAcceptOutcomeV1> {
  let plan: Plan | null = null;
  const transaction = await input.authority.commitAction({
    state: input.state, operation, receiptKind: STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1, codecNow: input.codecNow,
    derive: (derive) => {
      const { draft, extensions, receiptOrdinal, canonicalizeState } = derive;
      const source = structuredClone(fieldsOf(draft));
      const staged = stage(derive);
      const facts: StarterCharterAcceptFactsV1 = Object.freeze({
        schema: STARTER_CHARTER_ACCEPT_WITNESS_SCHEMA_V1, id: input.id, receiptOrdinal,
        stage: staged.facts, source, successor: structuredClone(fieldsOf(draft)),
      });
      let expectedLoot: Arc2LootInventoryV1 | null = null;
      if (staged.gear) {
        expectedLoot = lootOf(applyV5ExtensionWrites(extensions, staged.facts.extensionWrites).extensions, draft);
        if (expectedLoot === null) throw new Error('starter Charter gear was not staged whole');
      }
      const witness = `${STARTER_CHARTER_ACCEPT_WITNESS_SCHEMA_V1}:${sha256Hex(canonicalJson(facts))}`;
      plan = { facts, witness, expectedState: canonicalJson(canonicalizeState(draft)), expectedLoot };
      return { state: draft, extensionWrites: staged.facts.extensionWrites, witness };
    },
  });
  if (transaction.kind !== 'committed') return Object.freeze({ kind: 'refused', detail: transaction.kind, transaction });
  const staged = plan as Plan | null;
  if (staged === null) return Object.freeze({ kind: 'committed-convergence', detail: 'missing-plan', transaction });
  const storedLoot = staged.expectedLoot === null ? null : lootOf(transaction.saved.extensions, transaction.state);
  const same = transaction.plan.operation === operation
    && transaction.plan.receiptOrdinal === staged.facts.receiptOrdinal
    && transaction.receipt.ordinal === staged.facts.receiptOrdinal
    && transaction.receipt.kind === STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1
    && transaction.receipt.witness === staged.witness
    && canonicalJson(transaction.state) === canonicalJson(transaction.saved.canonicalState)
    && canonicalJson(transaction.state) === staged.expectedState
    && (staged.expectedLoot === null || (storedLoot !== null
      && encodeArc2LootCarrier(storedLoot).json === encodeArc2LootCarrier(staged.expectedLoot).json));
  if (!same) return Object.freeze({ kind: 'committed-convergence', detail: 'committed-verification-mismatch', transaction });
  return Object.freeze({ kind: 'committed', state: transaction.state, facts: staged.facts, transaction });
}

function commitStarter(input: CharterAcceptInputV1, id: StarterCharterIdV1): Promise<CharterAcceptOutcomeV1> | CharterAcceptOutcomeV1 {
  const checked = checkedState(input.state);
  if (checked.done.includes(id) || checked.accepted.includes(id)) return Object.freeze({ kind: 'current', id });
  if (!input.state.tutDone && input.graduation !== true) return refused(INERT);
  const board = projectStarterCharterBoardV1(input.state, input.extensions);
  if (board.kind !== 'projected') return refused(board.reason);
  const row = board.board.rows.find(({ definition }) => definition.id === id);
  if (!row || row.status !== 'available') return refused('starter Charter is not revealed');
  if (board.board.acceptedCount >= STARTER_CHARTER_CAP_V1) return refused(FULL_SLATE);
  return commit(input, operationForStarterCharterAcceptV1(id), ({ draft, extensions, receiptOrdinal }) => {
    if (lootOf(extensions, draft) === null) throw new Error('starter Charter gear carrier diverged');
    const staged = stageStarterCharterAcceptV1({
      draft, extensions, id, receiptOrdinal, ...(input.graduation === true ? { graduation: true } : {}),
    });
    if (staged.kind !== 'ready') throw new Error(staged.kind === 'refused' ? staged.reason : 'starter Charter became current');
    return { facts: staged.facts, gear: staged.facts.completions.some(({ gearId }) => gearId !== null) };
  });
}

function commitWeekly(input: CharterAcceptInputV1, id: WeeklyCharterIdV1): Promise<CharterAcceptOutcomeV1> | CharterAcceptOutcomeV1 {
  if (input.activePlayMs === undefined) return refused('weekly Charter acceptance needs the live active-play clock');
  if (!input.state.tutDone) return refused(INERT);
  const board = projectWeeklyCharterBoardV1(input.state, input.activePlayMs);
  const row = board.rows.find((candidate) => candidate.definition.id === id);
  if (row?.status === 'accepted' || row?.status === 'completed') return Object.freeze({ kind: 'current', id });
  if (!board.open || !row || row.status !== 'available') return refused(row?.lockedReason ?? 'that Charter is not on this week’s board');
  if (input.state.chacc.length >= WEEKLY_CHARTER_CAP_V1) return refused(FULL_SLATE);
  return commit(input, operationForWeeklyCharterAcceptV1(id, board.cycle), ({ draft, activePlayMs }) => {
    if (weeklyCharterCycleV1(activePlayMs) !== board.cycle) throw new Error('the weekly board rolled before this acceptance committed');
    const staged = stageWeeklyCharterAcceptV1({ draft, id, activePlayMs });
    if (staged.kind !== 'ready') throw new Error(staged.reason);
    const facts: StarterCharterStageFactsV1 = Object.freeze({
      changed: true, acceptedId: null, progressIds: [], completions: [], extensionWrites: [],
      priorUnlockedIds: [], nextUnlockedIds: [], addedAchievementIds: [], priorBestRankIndex: 0, nextBestRankIndex: 0,
      projection: null, weekly: staged.facts,
    });
    return { facts, gear: false };
  });
}

/** Accepts one Charter of the starter chains or of the weekly board, through one receipt. */
export async function commitStarterCharterAcceptV1(input: CharterAcceptInputV1): Promise<CharterAcceptOutcomeV1> {
  try {
    return await (isWeeklyCharterIdV1(input.id) ? commitWeekly(input, input.id) : commitStarter(input, input.id));
  } catch (error) {
    return refused(error instanceof Error ? error.message : 'Charter acceptance failed');
  }
}

/** The save loop's door for a product action, as far as an accept uses it. */
export interface CharterAcceptDoorV1 {
  settle(
    kind: string,
    commit: (runtime: CharterAcceptAuthorityV1 & { readonly extensions: V5Extensions }, durable: SaveStateV2) => Promise<CharterAcceptTransactionV1 | { readonly kind: 'declined'; readonly reason: string }>,
  ): Promise<CharterAcceptTransactionV1 | { readonly kind: 'declined'; readonly reason: string } | { readonly kind: 'refused'; readonly reason: string }>;
}

/** The accept as the page makes it: one product action at a time, never under a write hold, from the last stored
    state; a committed accept is in the live state, and said on the bus, when this resolves. */
export async function settleCharterAcceptV1(
  door: CharterAcceptDoorV1,
  input: Pick<CharterAcceptInputV1, 'id' | 'codecNow' | 'activePlayMs' | 'graduation'>,
): Promise<CharterAcceptOutcomeV1> {
  let own: CharterAcceptOutcomeV1 | null = null;
  const answer = await door.settle(CHARTER_ACCEPT_ACTION, async (runtime, durable) => {
    const outcome = await commitStarterCharterAcceptV1({ ...input, state: durable, extensions: runtime.extensions, authority: runtime });
    own = outcome;
    if (outcome.kind === 'committed' || outcome.kind === 'committed-convergence') return outcome.transaction;
    if (outcome.kind === 'refused' && outcome.transaction !== undefined) return outcome.transaction;
    return { kind: 'declined', reason: outcome.kind === 'current' ? 'current' : outcome.detail };
  });
  return own ?? refused(answer.kind === 'refused' ? answer.reason : answer.kind);
}
