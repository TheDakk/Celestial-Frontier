/* F4 exact-outcome transaction seam.

   A player outcome is planned from the persisted F4 SessionRNG authority,
   derived against a detached compatibility-state draft, and then committed
   exactly once through F3. Product rows, the next RNG counters/ordinal, the
   caller's active-play snapshot, immutable receipt, lease fence, and next
   revision share one atomic transaction. There is deliberately no retry:
   after stale storage, lease loss, or I/O failure, a reload sees the old RNG
   authority and therefore replans the same value instead of rerolling. */
import type { ActivePlaySnapshot } from '@cf/domain-progression';
import { planSessionRNGDraw, type SessionRNGState } from '@cf/domain-sessionrng';
import {
  prepareF4AuthorityUpdate,
  readF4Authority,
  type F4AuthorityV1,
} from './active-play.js';
import type { ContentRegistry, SaveStateV2 } from './import-v2.js';
import {
  prepareV5SaveWrite,
  type PreparedV5SaveWrite,
  type V5Extensions,
  type V5WritableState,
} from './migration-v5.js';
import type { MutationReceipt, RevisionedRepository } from './revisioned.js';
import { tabLeaseFence, type TabLeaseGrant } from './tab-lease.js';

export interface F4OutcomeDrawPlan {
  readonly domain: string;
  readonly value: number;
  readonly receiptOrdinal: number;
  readonly currentAuthority: F4AuthorityV1;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
}

export type F4OutcomeAuthorityProtection =
  | { readonly kind: 'protected'; readonly reason: 'authority-absent' | 'authority-corrupt' }
  | { readonly kind: 'protected'; readonly reason: 'authority-future'; readonly version: number };

export type F4OutcomeDrawPlanOutcome =
  | F4OutcomeAuthorityProtection
  | { readonly kind: 'planned'; readonly plan: F4OutcomeDrawPlan };

export interface F4OutcomeDeriveInput {
  readonly domain: string;
  readonly value: number;
  readonly receiptOrdinal: number;
  /** A fresh canonical state owned by this attempt. Mutating and returning
   * this draft cannot alter the caller's currently-rendered/save state. */
  readonly draft: SaveStateV2;
}

export interface F4OutcomeDerivation {
  readonly state: SaveStateV2;
  /** Stable product identity/fingerprint written verbatim into the receipt. */
  readonly witness: string;
}

export interface F4OutcomeTransactionInput {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  /** Exact state/extensions from the current v5 read. */
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly domain: string;
  readonly receiptKind: string;
  /** Injected compatibility-codec input; this owner reads no clock. */
  readonly now: number;
  /** Pure product policy. It receives exactly one detached draft and must
   * return the complete next state plus a bounded semantic witness. */
  readonly derive: (input: F4OutcomeDeriveInput) => F4OutcomeDerivation;
}

export type F4OutcomeTransactionOutcome =
  | F4OutcomeAuthorityProtection
  | {
    readonly kind: 'committed';
    readonly revision: number;
    readonly plan: F4OutcomeDrawPlan;
    readonly receipt: MutationReceipt;
    readonly authority: F4AuthorityV1;
    readonly saved: PreparedV5SaveWrite;
  }
  | {
    readonly kind: 'rejected';
    readonly stage: 'draft' | 'derive' | 'authority-update' | 'product-prepare';
    readonly message: string;
    readonly plan: F4OutcomeDrawPlan;
  }
  | {
    readonly kind: 'stale';
    readonly expectedRevision: number;
    readonly actualRevision: number;
    readonly plan: F4OutcomeDrawPlan;
  }
  | {
    readonly kind: 'duplicate-receipt';
    readonly receiptKey: string;
    readonly existing: MutationReceipt;
    readonly plan: F4OutcomeDrawPlan;
  }
  | {
    readonly kind: 'lost';
    readonly reason: 'lease-lost' | 'conflict';
    readonly plan: F4OutcomeDrawPlan;
  }
  | {
    readonly kind: 'storage-error';
    readonly message: string;
    readonly plan: F4OutcomeDrawPlan;
  };

export interface F4OutcomeTransactionOwner {
  commit(input: F4OutcomeTransactionInput): Promise<F4OutcomeTransactionOutcome>;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function checkedReceiptKind(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 96
    || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RangeError('outcome receipt kind must be 1–96 printable characters');
  }
  return value;
}

function checkedWitness(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 4_096
    || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RangeError('outcome witness must be 1–4096 printable characters');
  }
  return value;
}

function frozenSessionRng(state: SessionRNGState): F4AuthorityV1['sessionRng'] {
  const draws = Object.freeze(Object.fromEntries(
    Object.entries(state.draws).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
  ));
  return Object.freeze({ seed: state.seed, ordinal: state.ordinal, draws });
}

/** Plan one draw directly from the persisted extension carrier. Missing,
 * corrupt, and future authority never become a new seed or zero counters. */
export function planF4OutcomeDraw(
  extensions: V5Extensions,
  domain: string,
): F4OutcomeDrawPlanOutcome {
  const current = readF4Authority(extensions);
  if (current.kind === 'absent') return { kind: 'protected', reason: 'authority-absent' };
  if (current.kind === 'corrupt') return { kind: 'protected', reason: 'authority-corrupt' };
  if (current.kind === 'future-version') {
    return { kind: 'protected', reason: 'authority-future', version: current.version };
  }
  const planned = planSessionRNGDraw(current.authority.sessionRng, domain);
  return Object.freeze({
    kind: 'planned',
    plan: Object.freeze({
      domain: planned.domain,
      value: planned.value,
      receiptOrdinal: planned.receiptOrdinal,
      currentAuthority: current.authority,
      nextSessionRng: frozenSessionRng(planned.nextState),
    }),
  });
}

function checkedDerivation(value: unknown): F4OutcomeDerivation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('outcome derivation must return an object');
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== 'state' || keys[1] !== 'witness') {
    throw new TypeError('outcome derivation must contain exactly state and witness');
  }
  if (!record.state || typeof record.state !== 'object' || Array.isArray(record.state)) {
    throw new TypeError('outcome derivation state must be an object');
  }
  return { state: record.state as SaveStateV2, witness: checkedWitness(record.witness) };
}

/** Create the sole F4 outcome writer. The callback is never invoked until the
 * lease grant and receipt kind are validated and current F4 authority has
 * produced one immutable plan. The repository call is attempted once. */
export function createF4OutcomeTransactionOwner(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): F4OutcomeTransactionOwner {
  return Object.freeze({
    async commit(input: F4OutcomeTransactionInput): Promise<F4OutcomeTransactionOutcome> {
      const receiptKind = checkedReceiptKind(input.receiptKind);
      const fence = tabLeaseFence(input.grant);
      const planned = planF4OutcomeDraw(input.writable.extensions, input.domain);
      if (planned.kind !== 'planned') return planned;
      const { plan } = planned;

      let update: ReturnType<typeof prepareF4AuthorityUpdate>;
      try {
        update = prepareF4AuthorityUpdate(
          input.writable.extensions,
          input.snapshot,
          plan.nextSessionRng,
        );
      } catch (error) {
        return { kind: 'rejected', stage: 'authority-update', message: messageOf(error), plan };
      }

      let draft: SaveStateV2;
      try {
        draft = prepareV5SaveWrite(input.writable, registry, input.now).canonicalState;
      } catch (error) {
        return { kind: 'rejected', stage: 'draft', message: messageOf(error), plan };
      }

      let derivation: F4OutcomeDerivation;
      try {
        derivation = checkedDerivation(input.derive(Object.freeze({
          domain: plan.domain,
          value: plan.value,
          receiptOrdinal: plan.receiptOrdinal,
          draft,
        })));
      } catch (error) {
        return { kind: 'rejected', stage: 'derive', message: messageOf(error), plan };
      }

      let saved: PreparedV5SaveWrite;
      try {
        saved = prepareV5SaveWrite(
          { state: derivation.state, extensions: update.extensions },
          registry,
          input.now,
        );
      } catch (error) {
        return { kind: 'rejected', stage: 'product-prepare', message: messageOf(error), plan };
      }

      const receipt: MutationReceipt = Object.freeze({
        ordinal: plan.receiptOrdinal,
        kind: receiptKind,
        witness: derivation.witness,
      });
      try {
        const outcome = await repository.mutate({
          expectedRevision: input.expectedRevision,
          fences: [fence],
          writes: saved.operations,
          receipt,
        });
        switch (outcome.kind) {
          case 'committed':
            return {
              kind: 'committed',
              revision: outcome.revision,
              plan,
              receipt,
              authority: update.authority,
              saved,
            };
          case 'stale':
            return { ...outcome, plan };
          case 'duplicate-receipt':
            return { ...outcome, plan };
          case 'fence-lost':
            return { kind: 'lost', reason: 'lease-lost', plan };
          case 'conflict':
            return { kind: 'lost', reason: 'conflict', plan };
        }
      } catch (error) {
        return { kind: 'storage-error', message: messageOf(error), plan };
      }
    },
  });
}
