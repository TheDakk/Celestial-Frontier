/* How a care action is committed: gates before storage, the same staging again on the receipt's own draft, one
   receipt, then a check that what was stored is what the action staged. An action with random values takes them
   from the receipt; one with none takes a receipt ordinal alone. The shape is the landing's and the capture's
   (`landing/landing-action.ts`, `capture/action.ts`), written once for the actions of this folder. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import type {
  F4DeterministicProductDeriveInput,
  F4DeterministicProductTransactionOutcome,
  F4MultiOutcomeDeriveInput,
  F4MultiOutcomeTransactionOutcome,
  F4OutcomeDerivation,
  SaveStateV2,
  V5ExtensionWrite,
  V5Extensions,
} from '@cf/persistence';
import type { CanonicalCF1WorldAddress } from '@cf/scene';

/** A refusal of the action's own, raised before storage or inside the receipt's derivation: nothing is written. */
export class CareRefusal extends Error {
  constructor(readonly detail: string) { super(detail); }
}
export const refuse = (detail: string): never => { throw new CareRefusal(detail); };

type Stored<O extends { readonly kind: string }> =
  | Exclude<O, { readonly kind: 'committed' }>
  | (Extract<O, { readonly kind: 'committed' }> & { readonly state: SaveStateV2 })
  | { readonly kind: 'lease-unavailable' };
/** What the two paths of the save runtime a care action uses answer; the stored state rides on a committed outcome. */
export type CareTransaction = Stored<F4DeterministicProductTransactionOutcome> | Stored<F4MultiOutcomeTransactionOutcome>;
export type CareCommitted = Extract<CareTransaction, { readonly kind: 'committed' }>;
type CareUncommitted = Exclude<CareTransaction, { readonly kind: 'committed' }>;

/** The two paths of the save runtime a care action needs, and the extensions it holds. */
export interface CareAuthority {
  readonly extensions: V5Extensions;
  commitAction(input: {
    readonly state: SaveStateV2; readonly operation: string; readonly receiptKind: string; readonly codecNow: number;
    readonly derive: (input: F4DeterministicProductDeriveInput) => F4OutcomeDerivation;
  }): Promise<CareTransaction>;
  commitMultiOutcome(input: {
    readonly state: SaveStateV2; readonly domains: readonly string[]; readonly receiptKind: string; readonly codecNow: number;
    readonly derive: (input: F4MultiOutcomeDeriveInput) => F4OutcomeDerivation;
  }): Promise<CareTransaction>;
}

export type CareOutcome<Facts> =
  | Readonly<{ kind: 'committed'; state: SaveStateV2; facts: Facts; transaction: CareCommitted }>
  /** Stored, but what was stored is not what this action staged: the page should stop writing and reload. */
  | Readonly<{ kind: 'committed-convergence'; detail: string; transaction: CareCommitted }>
  /** Nothing was written. `transaction` is storage's own answer when the action got that far. */
  | Readonly<{ kind: 'refused'; detail: string; transaction: CareUncommitted | null }>;

/** What the receipt hands a staging: its own draft, the extensions, its ordinal, and its random values in order. */
export interface CareReceipt {
  readonly draft: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly receiptOrdinal: number;
  readonly activePlayMs: number;
  readonly draws: readonly number[];
}
export interface CareStaged<Facts> {
  readonly facts: Facts;
  readonly extensionWrites: readonly V5ExtensionWrite[];
}

export interface CareCommitInput<Facts> {
  readonly runtime: CareAuthority;
  /** The last stored state. */
  readonly state: SaveStateV2;
  readonly codecNow: number;
  readonly receiptKind: string;
  /** An action with no random value names its operation; one with random values names their domains, in order.
      Asked once, after the preflight has passed. */
  readonly route: () => Readonly<{ operation: string }> | Readonly<{ domains: readonly string[] }>;
  /** Everything the action must pass before storage is asked for anything; raises a `CareRefusal`. */
  readonly preflight: (state: SaveStateV2, extensions: V5Extensions) => void;
  /** Stages the action on the receipt's draft; raises a `CareRefusal` to write nothing. */
  readonly stage: (receipt: CareReceipt) => CareStaged<Facts>;
  /** Null when the stored state holds what these facts say; else the first thing that is not there. */
  readonly verify: (stored: SaveStateV2, facts: Facts) => string | null;
}

const detailOf = (error: unknown): string => error instanceof CareRefusal ? error.detail : `staging:${error instanceof Error ? error.message : String(error)}`;
/** What a receipt says of an action: its kind and a digest of its ordinal and facts. */
export const careWitness = (receiptKind: string, receiptOrdinal: number, facts: unknown): string =>
  `${receiptKind}:${sha256Hex(canonicalJson({ receiptOrdinal, facts } as never))}`;

/** Commits one care action. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export async function commitCare<Facts>(input: CareCommitInput<Facts>): Promise<CareOutcome<Facts>> {
  const refused = (detail: string, transaction: CareUncommitted | null = null): CareOutcome<Facts> => Object.freeze({ kind: 'refused', detail, transaction });
  try {
    input.preflight(input.state, input.runtime.extensions);
  } catch (error) {
    return refused(detailOf(error));
  }
  let staged: { facts: Facts; witness: string } | null = null;
  let ownRefusal: string | null = null;
  const derive = (receipt: CareReceipt): F4OutcomeDerivation => {
    try {
      const result = input.stage(receipt);
      const witness = careWitness(input.receiptKind, receipt.receiptOrdinal, result.facts);
      staged = { facts: result.facts, witness };
      return { state: receipt.draft, extensionWrites: result.extensionWrites, witness };
    } catch (error) {
      ownRefusal = detailOf(error);
      throw error;
    }
  };
  const base = { state: input.state, receiptKind: input.receiptKind, codecNow: input.codecNow };
  const route = input.route();
  const transaction = 'operation' in route
    ? await input.runtime.commitAction({ ...base, operation: route.operation, derive: (receipt) => derive({ ...receipt, draws: [] }) })
    : await input.runtime.commitMultiOutcome({
      ...base, domains: route.domains, derive: (receipt) => derive({ ...receipt, draws: receipt.draws.map(({ value }) => value) }),
    });
  if (transaction.kind !== 'committed') return refused(ownRefusal ?? transaction.kind, transaction);
  const done = staged as { facts: Facts; witness: string } | null;
  if (done === null) return Object.freeze({ kind: 'committed-convergence', detail: 'missing-plan', transaction });
  const { state } = transaction;
  const mismatch = transaction.receipt.kind !== input.receiptKind || transaction.receipt.witness !== done.witness ? 'receipt'
    : JSON.stringify(state) !== JSON.stringify(transaction.saved.canonicalState) ? 'state-not-stored'
      : input.verify(state, done.facts);
  if (mismatch !== null) return Object.freeze({ kind: 'committed-convergence', detail: `postcommit:${mismatch}`, transaction });
  return Object.freeze({ kind: 'committed', state, facts: done.facts, transaction });
}

/** The save loop's door for a product action, as far as a care action uses it. */
export interface CareDoor {
  settle(
    kind: string,
    commit: (runtime: CareAuthority, durable: SaveStateV2) => Promise<CareTransaction | { readonly kind: 'declined'; readonly reason: string }>,
  ): Promise<CareTransaction | { readonly kind: 'declined'; readonly reason: string } | { readonly kind: 'refused'; readonly reason: string }>;
}

/** One care action as the page makes it: one product action at a time, never under a write hold, from the last
    stored state. A committed action is in the live state when this resolves. */
export async function settleCare<Facts>(
  door: CareDoor,
  kind: string,
  commit: (runtime: CareAuthority, durable: SaveStateV2) => Promise<CareOutcome<Facts>>,
): Promise<CareOutcome<Facts>> {
  let own: CareOutcome<Facts> | null = null;
  const answer = await door.settle(kind, async (runtime, durable) => {
    const outcome = await commit(runtime, durable);
    own = outcome;
    return outcome.kind !== 'refused' ? outcome.transaction : outcome.transaction ?? { kind: 'declined', reason: outcome.detail };
  });
  return own ?? Object.freeze({ kind: 'refused', detail: answer.kind === 'refused' ? answer.reason : answer.kind, transaction: null });
}

/** What the guidance system's Charter staging answers, as far as a care action reads it. */
export type CareCharterStage =
  | Readonly<{ kind: 'refused'; reason: string }>
  | Readonly<{ kind: 'ready' | 'current'; facts: Readonly<{ progressIds: readonly string[]; completions: ReadonlyArray<Readonly<{ id: string }>>; extensionWrites: readonly V5ExtensionWrite[] }> }>;
/** Stages a deed on the draft against the Charters accepted: the guidance system's own function. */
export type CareCharterStager = (input: {
  draft: SaveStateV2;
  extensions: V5Extensions;
  event: Readonly<{ kind: 'bioscan'; address: CanonicalCF1WorldAddress }> | Readonly<{ kind: 'scout-set'; scoutId: string }>;
  receiptOrdinal: number;
  activePlayMs?: number;
}) => CareCharterStage;
/** What a care action that says a deed needs of the page: the save loop's door and the Charters' staging. */
export interface CareSettleDeps {
  readonly door: CareDoor;
  readonly charters: CareCharterStager;
}
