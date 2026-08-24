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
  F4_AUTHORITY_NAMESPACE,
  prepareF4AuthorityUpdate,
  readF4Authority,
  type F4AuthorityV1,
} from './active-play.js';
import type { ContentRegistry, SaveStateV2 } from './import-v2.js';
import {
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  prepareV5SaveWrite,
  type PreparedV5SaveWrite,
  type V5ExtensionWrite,
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
  /** A detached, validated snapshot of every current v5 extension. Product
   * policy may inspect it, but changes are accepted only through the checked
   * `extensionWrites` returned by the derivation. */
  readonly extensions: V5Extensions;
}

export interface F4OutcomeDerivation {
  readonly state: SaveStateV2;
  /** Namespaced product replacements. Omission means no product extension
   * change. Each segment/namespace pair may occur at most once. */
  readonly extensionWrites?: readonly V5ExtensionWrite[];
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

type ProductTransactionRejectionStage =
  | 'draft'
  | 'derive'
  | 'extension-writes'
  | 'authority-update'
  | 'product-prepare';

interface ReceiptAuthorityPlan {
  readonly receiptOrdinal: number;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
}

type PlannedProductTransactionOutcome<Plan extends ReceiptAuthorityPlan> =
  | {
    readonly kind: 'committed';
    readonly revision: number;
    readonly plan: Plan;
    readonly receipt: MutationReceipt;
    readonly authority: F4AuthorityV1;
    readonly saved: PreparedV5SaveWrite;
  }
  | {
    readonly kind: 'rejected';
    readonly stage: ProductTransactionRejectionStage;
    readonly message: string;
    readonly plan: Plan;
  }
  | {
    readonly kind: 'stale';
    readonly expectedRevision: number;
    readonly actualRevision: number;
    readonly plan: Plan;
  }
  | {
    readonly kind: 'duplicate-receipt';
    readonly receiptKey: string;
    readonly existing: MutationReceipt;
    readonly plan: Plan;
  }
  | {
    readonly kind: 'lost';
    readonly reason: 'lease-lost' | 'conflict';
    readonly plan: Plan;
  }
  | {
    readonly kind: 'storage-error';
    readonly message: string;
    readonly plan: Plan;
  };

export type F4OutcomeTransactionOutcome =
  | F4OutcomeAuthorityProtection
  | PlannedProductTransactionOutcome<F4OutcomeDrawPlan>;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

/** Validate and detach extension authority without invoking the complete save
 * writer. The complete writer is deliberately reserved for the one final
 * state assembled after product policy and F4 authority have both landed. */
function detachedCanonicalExtensions(value: unknown): V5Extensions {
  return canonicalizeV5Extensions(value);
}

function detachedState(value: unknown): SaveStateV2 {
  if (!isRecord(value)) throw new TypeError('outcome state must be an object');
  const detached = structuredClone(value) as unknown;
  if (!isRecord(detached)) throw new TypeError('outcome state clone must be an object');
  return detached as unknown as SaveStateV2;
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

interface CheckedDerivationEnvelope {
  readonly state: SaveStateV2;
  readonly extensionWrites?: unknown;
  readonly witness: string;
}

function checkedDerivation(value: unknown): CheckedDerivationEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('outcome derivation must return an object');
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const withoutWrites = keys.length === 2 && keys[0] === 'state' && keys[1] === 'witness';
  const withWrites = keys.length === 3
    && keys[0] === 'extensionWrites' && keys[1] === 'state' && keys[2] === 'witness';
  if (!withoutWrites && !withWrites) {
    throw new TypeError('outcome derivation must contain state, witness, and optional extensionWrites');
  }
  if (!record.state || typeof record.state !== 'object' || Array.isArray(record.state)) {
    throw new TypeError('outcome derivation state must be an object');
  }
  return Object.freeze({
    state: record.state as SaveStateV2,
    ...(withWrites ? { extensionWrites: record.extensionWrites } : {}),
    witness: checkedWitness(record.witness),
  });
}

interface PlannedProductCommitInput<Plan extends ReceiptAuthorityPlan> {
  readonly expectedRevision: number;
  readonly fence: ReturnType<typeof tabLeaseFence>;
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly now: number;
  readonly receiptKind: string;
  readonly plan: Plan;
  readonly derive: (draft: SaveStateV2, extensions: V5Extensions) => unknown;
}

/** One shared assembly path for random and deterministic products. Keeping
 * the persistence choreography here prevents the two owners from drifting:
 * detached input, checked product namespaces, final protected F4 authority,
 * one complete save preparation, then one receipt-bearing repository CAS. */
async function commitPlannedProduct<Plan extends ReceiptAuthorityPlan>(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
  input: PlannedProductCommitInput<Plan>,
): Promise<PlannedProductTransactionOutcome<Plan>> {
  let draft: SaveStateV2;
  let extensions: V5Extensions;
  try {
    draft = detachedState(input.writable.state);
    extensions = detachedCanonicalExtensions(input.writable.extensions);
  } catch (error) {
    return { kind: 'rejected', stage: 'draft', message: messageOf(error), plan: input.plan };
  }

  let derivation: CheckedDerivationEnvelope;
  try {
    derivation = checkedDerivation(input.derive(draft, extensions));
  } catch (error) {
    return { kind: 'rejected', stage: 'derive', message: messageOf(error), plan: input.plan };
  }

  let productExtensions: V5Extensions;
  try {
    const applied = applyV5ExtensionWrites(extensions, derivation.extensionWrites === undefined
      ? Object.freeze([]) as readonly V5ExtensionWrite[]
      : derivation.extensionWrites);
    if (applied.writes.some(({ segment, namespace }) => (
      segment === 'player' && namespace === F4_AUTHORITY_NAMESPACE
    ))) throw new Error('product extension writes cannot overwrite player/f4.authority');
    productExtensions = applied.extensions;
  } catch (error) {
    return {
      kind: 'rejected', stage: 'extension-writes', message: messageOf(error), plan: input.plan,
    };
  }

  let update: ReturnType<typeof prepareF4AuthorityUpdate>;
  try {
    /* Product namespaces land first. The sole F4 owner replaces its protected
       namespace last, so product policy cannot shadow it. */
    update = prepareF4AuthorityUpdate(
      productExtensions,
      input.snapshot,
      input.plan.nextSessionRng,
    );
  } catch (error) {
    return {
      kind: 'rejected', stage: 'authority-update', message: messageOf(error), plan: input.plan,
    };
  }

  let saved: PreparedV5SaveWrite;
  try {
    /* The only complete save preparation in this transaction, after both
       product and F4 authority are final. */
    saved = prepareV5SaveWrite(
      { state: derivation.state, extensions: update.extensions },
      registry,
      input.now,
    );
  } catch (error) {
    return {
      kind: 'rejected', stage: 'product-prepare', message: messageOf(error), plan: input.plan,
    };
  }

  const receipt: MutationReceipt = Object.freeze({
    ordinal: input.plan.receiptOrdinal,
    kind: checkedReceiptKind(input.receiptKind),
    witness: derivation.witness,
  });
  try {
    const outcome = await repository.mutate({
      expectedRevision: input.expectedRevision,
      fences: [input.fence],
      writes: saved.operations,
      receipt,
    });
    switch (outcome.kind) {
      case 'committed':
        return {
          kind: 'committed',
          revision: outcome.revision,
          plan: input.plan,
          receipt,
          authority: update.authority,
          saved,
        };
      case 'stale':
        return { ...outcome, plan: input.plan };
      case 'duplicate-receipt':
        return { ...outcome, plan: input.plan };
      case 'fence-lost':
        return { kind: 'lost', reason: 'lease-lost', plan: input.plan };
      case 'conflict':
        return { kind: 'lost', reason: 'conflict', plan: input.plan };
    }
  } catch (error) {
    return { kind: 'storage-error', message: messageOf(error), plan: input.plan };
  }
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
      return commitPlannedProduct(repository, registry, {
        expectedRevision: input.expectedRevision,
        fence,
        writable: input.writable,
        snapshot: input.snapshot,
        now: input.now,
        receiptKind,
        plan,
        derive: (draft, extensions) => input.derive(Object.freeze({
          domain: plan.domain,
          value: plan.value,
          receiptOrdinal: plan.receiptOrdinal,
          draft,
          extensions,
        })),
      });
    },
  });
}

const UINT32_MAX = 0xFFFF_FFFF;

/** Generic deterministic product action. It reserves one exact-once receipt
 * ordinal but leaves the seed and every per-domain random draw counter
 * byte-identical. Arc-specific wrappers may narrow `operation` and select a
 * fixed receipt kind without teaching the F4 owner their product vocabulary. */
export interface F4DeterministicProductPlan {
  readonly operation: string;
  readonly receiptOrdinal: number;
  readonly currentAuthority: F4AuthorityV1;
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
}

export type F4DeterministicProductPlanOutcome =
  | F4OutcomeAuthorityProtection
  | { readonly kind: 'protected'; readonly reason: 'receipt-ordinal-exhausted' }
  | { readonly kind: 'planned'; readonly plan: F4DeterministicProductPlan };

export interface F4DeterministicProductDeriveInput {
  readonly operation: string;
  readonly receiptOrdinal: number;
  readonly draft: SaveStateV2;
  readonly extensions: V5Extensions;
}

export interface F4DeterministicProductTransactionInput {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly operation: string;
  readonly receiptKind: string;
  readonly now: number;
  readonly derive: (input: F4DeterministicProductDeriveInput) => F4OutcomeDerivation;
}

export type F4DeterministicProductTransactionOutcome =
  | Exclude<F4DeterministicProductPlanOutcome, { readonly kind: 'planned' }>
  | PlannedProductTransactionOutcome<F4DeterministicProductPlan>;

export interface F4DeterministicProductTransactionOwner {
  commit(input: F4DeterministicProductTransactionInput): Promise<F4DeterministicProductTransactionOutcome>;
}

function checkedDeterministicOperation(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 96
    || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RangeError('deterministic product operation must be 1–96 printable characters');
  }
  return value;
}

/** Plan a deterministic product receipt from persisted F4 authority. This is
 * intentionally separate from `planF4OutcomeDraw`: no random domain is
 * evaluated and only the save-lifetime ordinal advances. */
export function planF4DeterministicProductReceipt(
  extensions: V5Extensions,
  operation: string,
): F4DeterministicProductPlanOutcome {
  const checkedOperation = checkedDeterministicOperation(operation);
  const current = readF4Authority(extensions);
  if (current.kind === 'absent') return { kind: 'protected', reason: 'authority-absent' };
  if (current.kind === 'corrupt') return { kind: 'protected', reason: 'authority-corrupt' };
  if (current.kind === 'future-version') {
    return { kind: 'protected', reason: 'authority-future', version: current.version };
  }
  const receiptOrdinal = current.authority.sessionRng.ordinal;
  if (receiptOrdinal >= UINT32_MAX) {
    return { kind: 'protected', reason: 'receipt-ordinal-exhausted' };
  }
  return Object.freeze({
    kind: 'planned',
    plan: Object.freeze({
      operation: checkedOperation,
      receiptOrdinal,
      currentAuthority: current.authority,
      nextSessionRng: frozenSessionRng({
        seed: current.authority.sessionRng.seed,
        draws: { ...current.authority.sessionRng.draws },
        ordinal: receiptOrdinal + 1,
      }),
    }),
  });
}

/** Create the arc-neutral deterministic action owner. Product state,
 * namespaced extensions, active-play authority, receipt, lease fence and next
 * revision still share the same single repository CAS as random outcomes. */
export function createF4DeterministicProductTransactionOwner(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): F4DeterministicProductTransactionOwner {
  return Object.freeze({
    async commit(
      input: F4DeterministicProductTransactionInput,
    ): Promise<F4DeterministicProductTransactionOutcome> {
      const operation = checkedDeterministicOperation(input.operation);
      const receiptKind = checkedReceiptKind(input.receiptKind);
      const fence = tabLeaseFence(input.grant);
      const planned = planF4DeterministicProductReceipt(input.writable.extensions, operation);
      if (planned.kind !== 'planned') return planned;
      const { plan } = planned;
      return commitPlannedProduct(repository, registry, {
        expectedRevision: input.expectedRevision,
        fence,
        writable: input.writable,
        snapshot: input.snapshot,
        now: input.now,
        receiptKind,
        plan,
        derive: (draft, extensions) => input.derive(Object.freeze({
          operation,
          receiptOrdinal: plan.receiptOrdinal,
          draft,
          extensions,
        })),
      });
    },
  });
}

/** Arc 2 operations whose result is fully determined by the observed product
 * state. They still need an immutable exact-once receipt, but must not draw a
 * random value or advance any per-domain SessionRNG counter. */
export const F4_NO_RNG_PRODUCT_OPERATIONS = Object.freeze([
  'equip', 'unequip', 'salvage', 'pending-claim',
] as const);
export type F4NoRngProductOperation = typeof F4_NO_RNG_PRODUCT_OPERATIONS[number];

const NO_RNG_RECEIPT_KIND: Readonly<Record<F4NoRngProductOperation, string>> = Object.freeze({
  equip: 'arc2-equip',
  unequip: 'arc2-unequip',
  salvage: 'arc2-salvage',
  'pending-claim': 'arc2-pending-claim',
});

export interface F4NoRngProductPlan {
  readonly operation: F4NoRngProductOperation;
  readonly receiptOrdinal: number;
  readonly currentAuthority: F4AuthorityV1;
  /** Same seed and per-domain counters; only the shared exact-once receipt
   * ordinal advances. No SessionRNG value is generated. */
  readonly nextSessionRng: F4AuthorityV1['sessionRng'];
}

export type F4NoRngProductPlanOutcome =
  | F4OutcomeAuthorityProtection
  | { readonly kind: 'protected'; readonly reason: 'receipt-ordinal-exhausted' }
  | { readonly kind: 'planned'; readonly plan: F4NoRngProductPlan };

export interface F4NoRngProductDeriveInput {
  readonly operation: F4NoRngProductOperation;
  readonly receiptOrdinal: number;
  readonly draft: SaveStateV2;
  readonly extensions: V5Extensions;
}

export interface F4NoRngProductTransactionInput {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  readonly writable: V5WritableState;
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly operation: F4NoRngProductOperation;
  readonly now: number;
  readonly derive: (input: F4NoRngProductDeriveInput) => F4OutcomeDerivation;
}

export type F4NoRngProductTransactionOutcome =
  | Exclude<F4NoRngProductPlanOutcome, { readonly kind: 'planned' }>
  | PlannedProductTransactionOutcome<F4NoRngProductPlan>;

export interface F4NoRngProductTransactionOwner {
  commit(input: F4NoRngProductTransactionInput): Promise<F4NoRngProductTransactionOutcome>;
}

function checkedNoRngOperation(value: unknown): F4NoRngProductOperation {
  if (typeof value !== 'string'
    || !(F4_NO_RNG_PRODUCT_OPERATIONS as readonly string[]).includes(value)) {
    throw new RangeError(`unknown no-RNG product operation ${JSON.stringify(value)}`);
  }
  return value as F4NoRngProductOperation;
}

/** Reserve the next globally unique receipt identity without evaluating a
 * random domain. Receipt uniqueness and random-draw consumption are separate:
 * this increments only the save-lifetime ordinal and leaves every draw
 * counter untouched. */
export function planF4NoRngProductReceipt(
  extensions: V5Extensions,
  operation: F4NoRngProductOperation,
): F4NoRngProductPlanOutcome {
  const checkedOperation = checkedNoRngOperation(operation);
  const current = readF4Authority(extensions);
  if (current.kind === 'absent') return { kind: 'protected', reason: 'authority-absent' };
  if (current.kind === 'corrupt') return { kind: 'protected', reason: 'authority-corrupt' };
  if (current.kind === 'future-version') {
    return { kind: 'protected', reason: 'authority-future', version: current.version };
  }
  const receiptOrdinal = current.authority.sessionRng.ordinal;
  if (receiptOrdinal >= UINT32_MAX) {
    return { kind: 'protected', reason: 'receipt-ordinal-exhausted' };
  }
  return Object.freeze({
    kind: 'planned',
    plan: Object.freeze({
      operation: checkedOperation,
      receiptOrdinal,
      currentAuthority: current.authority,
      nextSessionRng: frozenSessionRng({
        seed: current.authority.sessionRng.seed,
        draws: { ...current.authority.sessionRng.draws },
        ordinal: receiptOrdinal + 1,
      }),
    }),
  });
}

/** Create the deterministic Arc 2 action owner. Equip, unequip, salvage and
 * pending-claim use the same revision/lease/receipt atomic boundary as random
 * outcomes, but reserve only a receipt ordinal and never ask SessionRNG for a
 * value. The repository is attempted once and never internally retried. */
export function createF4NoRngProductTransactionOwner(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): F4NoRngProductTransactionOwner {
  return Object.freeze({
    async commit(input: F4NoRngProductTransactionInput): Promise<F4NoRngProductTransactionOutcome> {
      const operation = checkedNoRngOperation(input.operation);
      const fence = tabLeaseFence(input.grant);
      const planned = planF4NoRngProductReceipt(input.writable.extensions, operation);
      if (planned.kind !== 'planned') return planned;
      const { plan } = planned;
      return commitPlannedProduct(repository, registry, {
        expectedRevision: input.expectedRevision,
        fence,
        writable: input.writable,
        snapshot: input.snapshot,
        now: input.now,
        receiptKind: NO_RNG_RECEIPT_KIND[operation],
        plan,
        derive: (draft, extensions) => input.derive(Object.freeze({
          operation,
          receiptOrdinal: plan.receiptOrdinal,
          draft,
          extensions,
        })),
      });
    },
  });
}
