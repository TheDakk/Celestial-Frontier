/* F4 app-side authority join.

   The pure clock, SessionRNG codec, tab lease, and revisioned persistence
   transaction live in their owning packages. This controller only keeps the
   four pieces on one app lifecycle: a page may accrue while visible,
   answerable, and holding its exact lease; a save commits the clock and RNG
   under that same lease and the caller-observed revision. Receipt-bearing
   product policy is injected as one pure detached derivation; the controller
   owns no DOM, wall clock, entropy source, retry, or product rules. */
import { createActivePlayClock, type ActivePlayClock } from '@cf/domain-progression';
import { createSessionRNG, type SessionRNGState } from '@cf/domain-sessionrng';
import {
  createActivePlayPersistenceOwner,
  createF4NoRngProductTransactionOwner,
  createF4OutcomeTransactionOwner,
  createTabLeaseClient,
  type ActivePlayCommitOutcome,
  type ContentRegistry,
  type F4AuthorityV1,
  type F4OutcomeDeriveInput,
  type F4OutcomeDerivation,
  type F4OutcomeTransactionOutcome,
  type F4NoRngProductDeriveInput,
  type F4NoRngProductOperation,
  type F4NoRngProductTransactionOutcome,
  type RevisionedReplacementOutcome,
  type RevisionedRepository,
  type SaveStateV2,
  type StorageBackend,
  type StorageOperation,
  type TabLeaseClient,
  type TabLeaseGrant,
  type V5Extensions,
  type V5WritableState,
} from '@cf/persistence';

export interface F4RuntimeAuthorityInput {
  readonly backend: StorageBackend;
  readonly repository: RevisionedRepository;
  readonly registry: ContentRegistry;
  readonly initialRevision: number;
  readonly initialExtensions: V5Extensions;
  readonly restoredAuthority: F4AuthorityV1 | null;
  /** Caller-minted crypto entropy, used only when no saved authority exists. */
  readonly freshSessionSeed: number;
  readonly ownerId: string;
  readonly token: string;
  readonly leaseTtlMs: number;
  readonly now: () => number;
  readonly visible: boolean;
  readonly answerable: boolean;
}

export interface F4RuntimeDiagnostics {
  readonly schema: 'cf-v2-f4-runtime/v1';
  readonly revision: number;
  readonly visible: boolean;
  readonly answerable: boolean;
  readonly leaseOwned: boolean;
  readonly staleBlocked: boolean;
  readonly leaseHeartbeat: number | null;
  readonly activePlayMs: number;
  readonly accruing: boolean;
  readonly sessionSeed: number;
  readonly sessionOrdinal: number;
  readonly sessionDraws: Readonly<Record<string, number>>;
  readonly commits: number;
  readonly staleWrites: number;
  readonly leaseLosses: number;
}

export type F4RuntimeHeartbeatOutcome =
  | { readonly kind: 'owned'; readonly heartbeat: number }
  | { readonly kind: 'held-by-other'; readonly remainingMs: number }
  | { readonly kind: 'lost' };

export type F4RuntimeCommitOutcome =
  | Extract<ActivePlayCommitOutcome, { readonly kind: 'committed' }>
  | Extract<ActivePlayCommitOutcome, { readonly kind: 'stale' }>
  | Extract<ActivePlayCommitOutcome, { readonly kind: 'lost' }>
  | { readonly kind: 'lease-unavailable' };

export interface F4RuntimeOutcomeInput {
  readonly state: SaveStateV2;
  readonly domain: string;
  readonly receiptKind: string;
  readonly codecNow: number;
  readonly derive: (input: F4OutcomeDeriveInput) => F4OutcomeDerivation;
}

export type F4RuntimeOutcomeCommitOutcome =
  | Exclude<F4OutcomeTransactionOutcome, { readonly kind: 'committed' }>
  | (Extract<F4OutcomeTransactionOutcome, { readonly kind: 'committed' }> & {
    /** Canonical detached state that the caller may publish only after the
        transaction reports committed. */
    readonly state: SaveStateV2;
  })
  | { readonly kind: 'lease-unavailable' };

export interface F4RuntimeProductInput {
  readonly state: SaveStateV2;
  readonly operation: F4NoRngProductOperation;
  readonly codecNow: number;
  readonly derive: (input: F4NoRngProductDeriveInput) => F4OutcomeDerivation;
}

export type F4RuntimeProductCommitOutcome =
  | Exclude<F4NoRngProductTransactionOutcome, { readonly kind: 'committed' }>
  | (Extract<F4NoRngProductTransactionOutcome, { readonly kind: 'committed' }> & {
    /** Canonical detached state that the caller may publish only after the
        transaction reports committed. */
    readonly state: SaveStateV2;
  })
  | { readonly kind: 'lease-unavailable' };

export type F4RuntimeReplacementOutcome =
  | RevisionedReplacementOutcome
  | { readonly kind: 'lease-unavailable' };

export interface F4RuntimeAuthority {
  /** Acquire or renew this page's lease once. Never retries internally. */
  heartbeat(): Promise<F4RuntimeHeartbeatOutcome>;
  /** Stop accrual before asynchronous release when the document hides. */
  setVisible(visible: boolean): Promise<F4RuntimeHeartbeatOutcome>;
  setAnswerable(answerable: boolean): void;
  commit(state: V5WritableState['state'], codecNow: number): Promise<F4RuntimeCommitOutcome>;
  /** Plan and commit one receipt-bearing product outcome under this
      controller's private revision, lease, active-play and RNG authority. */
  commitOutcome(input: F4RuntimeOutcomeInput): Promise<F4RuntimeOutcomeCommitOutcome>;
  /** Commit one exact-instance product action that consumes a receipt ordinal
      but no random draw. */
  commitProduct(input: F4RuntimeProductInput): Promise<F4RuntimeProductCommitOutcome>;
  /** Whole-expedition replacement under this runtime's private lease/revision.
      The repository atomically resets the old receipt namespace. */
  replace(writes: readonly StorageOperation[]): Promise<F4RuntimeReplacementOutcome>;
  release(): Promise<void>;
  diagnostics(): F4RuntimeDiagnostics;
  readonly revision: number;
  readonly extensions: V5Extensions;
  readonly sessionRng: SessionRNGState;
}

function checkedRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError('F4 initial revision must be a non-negative safe integer below MAX_SAFE_INTEGER');
  }
  return value as number;
}

function checkedSeed(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > 0xFFFF_FFFF) {
    throw new RangeError('F4 fresh SessionRNG seed must be a uint32');
  }
  return value as number;
}

function copySessionRng(value: SessionRNGState): SessionRNGState {
  const canonical = createSessionRNG(value.seed, value.draws, value.ordinal).state();
  return Object.freeze({
    seed: canonical.seed,
    ordinal: canonical.ordinal,
    draws: Object.freeze(Object.fromEntries(
      Object.entries(canonical.draws).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
    )),
  });
}

function copyExtensions(value: V5Extensions): V5Extensions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('F4 v5 extensions are required');
  }
  return value;
}

export function createF4RuntimeAuthority(input: F4RuntimeAuthorityInput): F4RuntimeAuthority {
  if (typeof input.now !== 'function') throw new TypeError('F4 runtime requires an injected monotonic clock');
  let revision = checkedRevision(input.initialRevision);
  let extensions = copyExtensions(input.initialExtensions);
  let sessionRng = copySessionRng(input.restoredAuthority?.sessionRng
    ?? createSessionRNG(checkedSeed(input.freshSessionSeed)).state());
  let visible = input.visible === true;
  let requestedVisible = visible;
  let visibilityGeneration = 0;
  let answerable = input.answerable === true;
  let grant: TabLeaseGrant | null = null;
  let releasePending = false;
  let commits = 0;
  let staleWrites = 0;
  let leaseLosses = 0;
  let staleBlocked = false;
  let released = false;
  let serialized: Promise<void> = Promise.resolve();

  const initialNow = input.now();
  const clock: ActivePlayClock = createActivePlayClock(
    input.restoredAuthority?.activePlayMs ?? 0,
    { visible, answerable, leaseOwned: false },
    initialNow,
  );
  const lease: TabLeaseClient = createTabLeaseClient(input.backend, {
    ownerId: input.ownerId,
    token: input.token,
    ttlMs: input.leaseTtlMs,
    now: input.now,
  });
  const owner = createActivePlayPersistenceOwner(input.repository, input.registry);
  const outcomeOwner = createF4OutcomeTransactionOwner(input.repository, input.registry);
  const productOwner = createF4NoRngProductTransactionOwner(input.repository, input.registry);

  const enqueue = <T>(work: () => Promise<T>): Promise<T> => {
    const run = serialized.then(work, work);
    serialized = run.then(() => undefined, () => undefined);
    return run;
  };

  const setClockEligibility = (): void => {
    clock.setEligibility({ visible, answerable, leaseOwned: grant !== null && !released }, input.now());
  };
  const clearGrant = (lost: boolean): void => {
    if (lost && grant !== null) leaseLosses++;
    grant = null;
    setClockEligibility();
  };
  const releaseGrant = async (): Promise<void> => {
    if (!releasePending) {
      if (grant === null) return;
      /* Revoke local authority before the asynchronous storage write, but keep
         a retry bit until that exact token is durably released. A rejected
         pagehide release can then be retried by the caller's final fallback
         without ever resuming accrual or retaining a usable grant. */
      releasePending = true;
      clearGrant(false);
    }
    const outcome = await lease.release();
    releasePending = false;
    if (outcome.kind !== 'released') leaseLosses++;
  };
  const blockAndRelease = async (stale: boolean): Promise<void> => {
    if (stale) staleWrites++;
    staleBlocked = true;
    await releaseGrant();
  };

  const heartbeatUnsafe = async (): Promise<F4RuntimeHeartbeatOutcome> => {
    if (staleBlocked || released || releasePending) return { kind: 'lost' };
    if (!visible) {
      return { kind: 'lost' };
    }
    const outcome = grant === null ? await lease.acquire() : await lease.renew();
    if (outcome.kind === 'acquired' || outcome.kind === 'renewed') {
      /* A hide/release call can synchronously revoke eligibility while the
         storage request is pending. Do not publish that late grant; release
         it before the queued successor transition runs. */
      if (!visible || staleBlocked || released) {
        grant = outcome.grant;
        await releaseGrant();
        return { kind: 'lost' };
      }
      grant = outcome.grant;
      setClockEligibility();
      return { kind: 'owned', heartbeat: grant.heartbeat };
    }
    if (outcome.kind === 'held-by-other') {
      if (grant !== null) clearGrant(true);
      return { kind: 'held-by-other', remainingMs: outcome.remainingMs };
    }
    clearGrant(true);
    return { kind: 'lost' };
  };

  const commitUnsafe = async (
    state: V5WritableState['state'],
    codecNow: number,
    expectedRevision: number,
    expectedExtensions: V5Extensions,
    expectedSessionRng: SessionRNGState,
  ): Promise<F4RuntimeCommitOutcome> => {
    if (grant === null || staleBlocked || released) return { kind: 'lease-unavailable' };
    const outcome = await owner.commit({
      expectedRevision,
      grant,
      writable: { state, extensions: expectedExtensions },
      snapshot: clock.current(input.now()),
      sessionRng: expectedSessionRng,
      now: codecNow,
    });
    if (outcome.kind === 'committed') {
      revision = outcome.revision;
      extensions = outcome.saved.extensions;
      sessionRng = copySessionRng(outcome.authority.sessionRng);
      commits++;
    } else if (outcome.kind === 'stale') {
      await blockAndRelease(true);
    } else {
      clearGrant(true);
    }
    return outcome;
  };

  return Object.freeze({
    heartbeat(): Promise<F4RuntimeHeartbeatOutcome> {
      return enqueue(heartbeatUnsafe);
    },
    setVisible(nextVisible: boolean): Promise<F4RuntimeHeartbeatOutcome> {
      const next = nextVisible === true;
      requestedVisible = next;
      const generation = ++visibilityGeneration;
      /* Hiding revokes accrual synchronously, before any asynchronous lease
         release. Showing becomes effective only after earlier transitions. */
      if (!next) visible = false;
      setClockEligibility();
      return enqueue(async () => {
        if (!next) {
          visible = false;
          await releaseGrant();
          return { kind: 'lost' };
        }
        if (generation !== visibilityGeneration || !requestedVisible || staleBlocked || released) {
          return { kind: 'lost' };
        }
        visible = true;
        setClockEligibility();
        return heartbeatUnsafe();
      });
    },
    setAnswerable(nextAnswerable: boolean): void {
      answerable = nextAnswerable === true;
      setClockEligibility();
    },
    commit(
      state: V5WritableState['state'],
      codecNow: number,
    ): Promise<F4RuntimeCommitOutcome> {
      /* Bind a write to the exact parent visible when its caller submitted it.
         The queue orders I/O and lifecycle transitions; it must never turn a
         second same-parent action into a child of an earlier queued commit. */
      const expectedRevision = revision;
      const expectedExtensions = extensions;
      const expectedSessionRng = sessionRng;
      return enqueue(() => commitUnsafe(
        state, codecNow, expectedRevision, expectedExtensions, expectedSessionRng,
      ));
    },
    commitOutcome(outcomeInput: F4RuntimeOutcomeInput): Promise<F4RuntimeOutcomeCommitOutcome> {
      const expectedRevision = revision;
      const expectedExtensions = extensions;
      return enqueue(async () => {
        if (grant === null || staleBlocked || released) return { kind: 'lease-unavailable' };
        const outcome = await outcomeOwner.commit({
          expectedRevision,
          grant,
          writable: { state: outcomeInput.state, extensions: expectedExtensions },
          snapshot: clock.current(input.now()),
          domain: outcomeInput.domain,
          receiptKind: outcomeInput.receiptKind,
          now: outcomeInput.codecNow,
          derive: outcomeInput.derive,
        });
        if (outcome.kind === 'committed') {
          revision = outcome.revision;
          extensions = outcome.saved.extensions;
          sessionRng = copySessionRng(outcome.authority.sessionRng);
          commits++;
          return Object.freeze({ ...outcome, state: outcome.saved.canonicalState });
        }
        if (outcome.kind === 'stale') await blockAndRelease(true);
        else if (outcome.kind === 'duplicate-receipt') await blockAndRelease(false);
        else if (outcome.kind === 'lost') clearGrant(true);
        else if (outcome.kind === 'protected' && outcome.reason !== 'authority-absent') {
          await blockAndRelease(false);
        }
        return outcome;
      });
    },
    commitProduct(productInput: F4RuntimeProductInput): Promise<F4RuntimeProductCommitOutcome> {
      const expectedRevision = revision;
      const expectedExtensions = extensions;
      return enqueue(async () => {
        if (grant === null || staleBlocked || released) return { kind: 'lease-unavailable' };
        const outcome = await productOwner.commit({
          expectedRevision,
          grant,
          writable: { state: productInput.state, extensions: expectedExtensions },
          snapshot: clock.current(input.now()),
          operation: productInput.operation,
          now: productInput.codecNow,
          derive: productInput.derive,
        });
        if (outcome.kind === 'committed') {
          revision = outcome.revision;
          extensions = outcome.saved.extensions;
          sessionRng = copySessionRng(outcome.authority.sessionRng);
          commits++;
          return Object.freeze({ ...outcome, state: outcome.saved.canonicalState });
        }
        if (outcome.kind === 'stale') await blockAndRelease(true);
        else if (outcome.kind === 'duplicate-receipt') await blockAndRelease(false);
        else if (outcome.kind === 'lost') clearGrant(true);
        else if (outcome.kind === 'protected' && outcome.reason !== 'authority-absent') {
          await blockAndRelease(false);
        }
        return outcome;
      });
    },
    replace(writes: readonly StorageOperation[]): Promise<F4RuntimeReplacementOutcome> {
      const expectedRevision = revision;
      return enqueue(async () => {
        if (grant === null || staleBlocked || released) return { kind: 'lease-unavailable' };
        const outcome = await input.repository.replace({
          expectedRevision,
          fences: [grant.check],
          writes,
        });
        if (outcome.kind === 'committed') {
          revision = outcome.revision;
          commits++;
        } else if (outcome.kind === 'stale') {
          await blockAndRelease(true);
        } else if (outcome.kind === 'conflict') {
          /* Revision and lease still matched after the ambiguous CAS refusal.
             Block this runtime and release that exact lease; clear-only would
             leave an invisible owner until TTL. */
          await blockAndRelease(false);
        } else {
          clearGrant(true);
        }
        return outcome;
      });
    },
    release(): Promise<void> {
      released = true;
      clock.setEligibility({ visible: false, answerable: false, leaseOwned: false }, input.now());
      visible = false;
      requestedVisible = false;
      visibilityGeneration++;
      answerable = false;
      return enqueue(releaseGrant);
    },
    diagnostics(): F4RuntimeDiagnostics {
      const snapshot = clock.current(input.now());
      return Object.freeze({
        schema: 'cf-v2-f4-runtime/v1',
        revision,
        visible,
        answerable,
        leaseOwned: grant !== null,
        staleBlocked,
        leaseHeartbeat: grant?.heartbeat ?? null,
        activePlayMs: snapshot.activePlayMs,
        accruing: snapshot.eligible,
        sessionSeed: sessionRng.seed,
        sessionOrdinal: sessionRng.ordinal,
        sessionDraws: Object.freeze({ ...sessionRng.draws }),
        commits,
        staleWrites,
        leaseLosses,
      });
    },
    get revision(): number { return revision; },
    get extensions(): V5Extensions { return extensions; },
    get sessionRng(): SessionRNGState { return copySessionRng(sessionRng); },
  });
}
