/* Outcomes committed with receipts: the four ways the save runtime settles something that happened.

   Each goes through one receipt-bearing owner of `@cf/persistence`, under the runtime's own lease, revision and
   active-play clock, so the state, the random state and the receipt land in one revision step or not at all:
   - an outcome: one draw from one random domain;
   - a multi-outcome: an ordered group of draws, one receipt;
   - a pre-draw multi-outcome: the same, but the policy may refuse (a full roster) before any value is drawn;
   - an action: no draw, one receipt ordinal.
   A submission is bound to the revision and extensions the page held when its caller submitted it; the queue only
   orders the storage work. A refusal that means this page no longer speaks for the save (a stale revision, a spent
   revision, a receipt already written, a protected authority) blocks the runtime and frees its lease; a lost lease
   clears it. Ported from the painted port's `f4-runtime-authority.ts`, where the four paths were written out
   four times. */
import { MAX_SESSION_RNG_DRAWS_PER_PLAN } from '@cf/domain-sessionrng';
import {
  createF4DeterministicProductTransactionOwner,
  createF4MultiOutcomePreDrawTransactionOwner,
  createF4MultiOutcomeTransactionOwner,
  createF4OutcomeTransactionOwner,
  type ContentRegistry,
  type F4AuthorityV1,
  type F4DeterministicProductDeriveInput,
  type F4DeterministicProductTransactionOutcome,
  type F4MultiOutcomeDeriveInput,
  type F4MultiOutcomePreDrawAuthorizer,
  type F4MultiOutcomePreDrawInput,
  type F4MultiOutcomePreDrawReady,
  type F4MultiOutcomePreDrawRefusal,
  type F4MultiOutcomePreDrawTransactionOutcome,
  type F4MultiOutcomeTransactionOutcome,
  type F4OutcomeDeriveInput,
  type F4OutcomeDerivation,
  type F4OutcomeTransactionOutcome,
  type PreparedV5SaveWrite,
  type RevisionedRepository,
  type SaveStateV2,
  type TabLeaseGrant,
  type V5Extensions,
} from '@cf/persistence';

/** A committed outcome also carries the stored state: the caller publishes that, never its own draft. */
type WithState<O extends { readonly kind: string }> =
  | Exclude<O, { readonly kind: 'committed' }>
  | (Extract<O, { readonly kind: 'committed' }> & { readonly state: SaveStateV2 })
  | { readonly kind: 'lease-unavailable' };

interface OutcomeBase {
  /** The state the outcome starts from. The policy is given a detached draft of it. */
  readonly state: SaveStateV2;
  readonly receiptKind: string;
  /** Wall time for the save codec; the runtime reads no wall clock. */
  readonly codecNow: number;
}
export interface OutcomeInput extends OutcomeBase {
  readonly domain: string;
  readonly derive: (input: F4OutcomeDeriveInput) => F4OutcomeDerivation;
}
export interface MultiOutcomeInput extends OutcomeBase {
  readonly domains: readonly string[];
  readonly derive: (input: F4MultiOutcomeDeriveInput) => F4OutcomeDerivation;
}
export interface PreDrawMultiOutcomeInput<Proof, Reason extends string> extends OutcomeBase {
  readonly domains: readonly string[];
  readonly preDraw: (
    input: F4MultiOutcomePreDrawInput,
    authorizer: F4MultiOutcomePreDrawAuthorizer<Proof>,
  ) => F4MultiOutcomePreDrawReady<Proof> | F4MultiOutcomePreDrawRefusal<Reason>;
}
export interface ActionInput extends OutcomeBase {
  readonly operation: string;
  readonly derive: (input: F4DeterministicProductDeriveInput) => F4OutcomeDerivation;
}

export type OutcomeCommitOutcome = WithState<F4OutcomeTransactionOutcome>;
export type MultiOutcomeCommitOutcome = WithState<F4MultiOutcomeTransactionOutcome>;
export type PreDrawMultiOutcomeCommitOutcome<Reason extends string> = WithState<F4MultiOutcomePreDrawTransactionOutcome<Reason>>;
export type ActionCommitOutcome = WithState<F4DeterministicProductTransactionOutcome>;

export interface OutcomeCommits {
  /** One draw from `domain`, the state it leads to and its receipt, in one revision step. */
  commitOutcome(input: OutcomeInput): Promise<OutcomeCommitOutcome>;
  /** An ordered group of draws under one receipt. The same domain twice is two draws. */
  commitMultiOutcome(input: MultiOutcomeInput): Promise<MultiOutcomeCommitOutcome>;
  /** As `commitMultiOutcome`, but the policy first sees the plan without its values and may refuse; a refusal
      draws nothing and writes nothing. */
  commitPreDrawMultiOutcome<Proof, Reason extends string>(
    input: PreDrawMultiOutcomeInput<Proof, Reason>,
  ): Promise<PreDrawMultiOutcomeCommitOutcome<Reason>>;
  /** A settled action that draws nothing: one receipt ordinal, no random domain advanced. */
  commitAction(input: ActionInput): Promise<ActionCommitOutcome>;
}

/** What the runtime lends: its private lease, revision and clock, and what it does with a result. */
export interface OutcomeHost {
  readonly repository: RevisionedRepository;
  readonly registry: ContentRegistry;
  /** The revision and extensions this page holds now: a submission is bound to them. */
  parent(): { readonly revision: number; readonly extensions: V5Extensions };
  /** The lease, or null when this page may not write. */
  grant(): TabLeaseGrant | null;
  activePlayMs(): number;
  enqueue<T>(work: () => Promise<T>): Promise<T>;
  /** A commit is stored: take its revision, extensions, random state and state. */
  adopt(committed: { readonly revision: number; readonly saved: PreparedV5SaveWrite; readonly authority: F4AuthorityV1 }): void;
  /** This page no longer speaks for the save: block it and free the lease. */
  block(stale: boolean): Promise<void>;
  /** The lease is gone. */
  loseGrant(): void;
}

/** The parts of a submission every owner takes. */
interface Bound {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  readonly writable: { readonly state: SaveStateV2; readonly extensions: V5Extensions };
  readonly snapshot: { readonly activePlayMs: number };
  readonly receiptKind: string;
  readonly now: number;
}
type Settled =
  | { readonly kind: 'committed'; readonly revision: number; readonly saved: PreparedV5SaveWrite; readonly authority: F4AuthorityV1 }
  | { readonly kind: 'protected'; readonly reason: string }
  | { readonly kind: 'stale' | 'revision-exhausted' | 'duplicate-receipt' | 'lost' | 'rejected' | 'storage-error' | 'pre-draw-refused' };

/** The draw order as the caller gave it, copied before anything can yield back to the caller. */
function boundDomains(value: readonly string[], least: number): readonly string[] {
  const count = Array.isArray(value) ? value.length : -1;
  if (count < least || count > MAX_SESSION_RNG_DRAWS_PER_PLAN) {
    throw new RangeError(`SessionRNG draw plan must contain 1–${MAX_SESSION_RNG_DRAWS_PER_PLAN} domains`);
  }
  return Object.freeze([...value]);
}

export function createOutcomeCommits(host: OutcomeHost): OutcomeCommits {
  const outcomes = createF4OutcomeTransactionOwner(host.repository, host.registry);
  const multiOutcomes = createF4MultiOutcomeTransactionOwner(host.repository, host.registry);
  const preDrawOutcomes = createF4MultiOutcomePreDrawTransactionOwner(host.repository, host.registry);
  const actions = createF4DeterministicProductTransactionOwner(host.repository, host.registry);

  const submit = <O extends Settled>(input: OutcomeBase, commit: (bound: Bound) => Promise<O>): Promise<WithState<O>> => {
    const { revision: expectedRevision, extensions } = host.parent();
    const { state, receiptKind, codecNow } = input;
    return host.enqueue(async (): Promise<WithState<O>> => {
      const grant = host.grant();
      if (grant === null) return { kind: 'lease-unavailable' };
      const outcome = await commit({
        expectedRevision, grant, writable: { state, extensions },
        snapshot: { activePlayMs: host.activePlayMs() }, receiptKind, now: codecNow,
      });
      if (outcome.kind === 'committed') {
        host.adopt(outcome);
        return Object.freeze({ ...outcome, state: outcome.saved.canonicalState }) as WithState<O>;
      }
      if (outcome.kind === 'stale') await host.block(true);
      else if (outcome.kind === 'revision-exhausted' || outcome.kind === 'duplicate-receipt') await host.block(false);
      else if (outcome.kind === 'lost') host.loseGrant();
      else if (outcome.kind === 'protected' && outcome.reason !== 'authority-absent') await host.block(false);
      return outcome as WithState<O>;
    });
  };

  return {
    commitOutcome(input) {
      const { domain, derive } = input;
      return submit(input, (bound) => outcomes.commit({ ...bound, domain, derive }));
    },
    commitMultiOutcome(input) {
      const domains = boundDomains(input.domains, 0);
      const { derive } = input;
      return submit(input, (bound) => multiOutcomes.commit({ ...bound, domains, derive }));
    },
    commitPreDrawMultiOutcome(input) {
      const domains = boundDomains(input.domains, 1);
      const { preDraw } = input;
      return submit(input, (bound) => preDrawOutcomes.commit({ ...bound, domains, preDraw }));
    },
    commitAction(input) {
      const { operation, derive } = input;
      return submit(input, (bound) => actions.commit({ ...bound, operation, derive }));
    },
  };
}

/** Why the save loop did not let a product action reach storage. */
export type OutcomeRefusalReason = 'held' | 'reload-required' | 'busy' | 'lease-unavailable';
export interface OutcomeRefused {
  readonly kind: 'refused';
  readonly reason: OutcomeRefusalReason;
}
