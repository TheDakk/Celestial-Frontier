/* F4 app-side authority join.

   The pure clock, SessionRNG codec, tab lease, and revisioned persistence
   transaction live in their owning packages. This controller only keeps the
   four pieces on one app lifecycle: a page may accrue while visible,
   answerable, and holding its exact lease; a save commits the clock and RNG
   under that same lease and the caller-observed revision. It owns no DOM,
   wall clock, entropy source, retry, or product mutation. */
import { createActivePlayClock, type ActivePlayClock } from '@cf/domain-progression';
import { createSessionRNG, type SessionRNGState } from '@cf/domain-sessionrng';
import {
  createActivePlayPersistenceOwner,
  createTabLeaseClient,
  type ActivePlayCommitOutcome,
  type ContentRegistry,
  type F4AuthorityV1,
  type RevisionedRepository,
  type StorageBackend,
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

export interface F4RuntimeAuthority {
  /** Acquire or renew this page's lease once. Never retries internally. */
  heartbeat(): Promise<F4RuntimeHeartbeatOutcome>;
  /** Stop accrual before asynchronous release when the document hides. */
  setVisible(visible: boolean): Promise<F4RuntimeHeartbeatOutcome>;
  setAnswerable(answerable: boolean): void;
  commit(state: V5WritableState['state'], codecNow: number): Promise<F4RuntimeCommitOutcome>;
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
  let answerable = input.answerable === true;
  let grant: TabLeaseGrant | null = null;
  let commits = 0;
  let staleWrites = 0;
  let leaseLosses = 0;
  let staleBlocked = false;

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

  const setClockEligibility = (): void => {
    clock.setEligibility({ visible, answerable, leaseOwned: grant !== null }, input.now());
  };
  const clearGrant = (): void => {
    if (grant !== null) leaseLosses++;
    grant = null;
    setClockEligibility();
  };

  const heartbeat = async (): Promise<F4RuntimeHeartbeatOutcome> => {
    if (staleBlocked) return { kind: 'lost' };
    if (!visible) {
      if (grant !== null) clearGrant();
      return { kind: 'lost' };
    }
    const outcome = grant === null ? await lease.acquire() : await lease.renew();
    if (outcome.kind === 'acquired' || outcome.kind === 'renewed') {
      grant = outcome.grant;
      setClockEligibility();
      return { kind: 'owned', heartbeat: grant.heartbeat };
    }
    if (outcome.kind === 'held-by-other') {
      if (grant !== null) clearGrant();
      return { kind: 'held-by-other', remainingMs: outcome.remainingMs };
    }
    clearGrant();
    return { kind: 'lost' };
  };

  return Object.freeze({
    heartbeat,
    async setVisible(nextVisible: boolean): Promise<F4RuntimeHeartbeatOutcome> {
      visible = nextVisible === true;
      setClockEligibility();
      if (visible) return heartbeat();
      const prior = grant;
      grant = null;
      setClockEligibility();
      if (prior !== null) {
        const outcome = await lease.release();
        if (outcome.kind !== 'released') leaseLosses++;
      }
      return { kind: 'lost' };
    },
    setAnswerable(nextAnswerable: boolean): void {
      answerable = nextAnswerable === true;
      setClockEligibility();
    },
    async commit(
      state: V5WritableState['state'],
      codecNow: number,
    ): Promise<F4RuntimeCommitOutcome> {
      if (grant === null) return { kind: 'lease-unavailable' };
      const outcome = await owner.commit({
        expectedRevision: revision,
        grant,
        writable: { state, extensions },
        snapshot: clock.current(input.now()),
        sessionRng,
        now: codecNow,
      });
      if (outcome.kind === 'committed') {
        revision = outcome.revision;
        extensions = outcome.saved.extensions;
        sessionRng = copySessionRng(outcome.authority.sessionRng);
        commits++;
      } else if (outcome.kind === 'stale') {
        staleWrites++;
        staleBlocked = true;
        clock.setEligibility({ visible, answerable, leaseOwned: false }, input.now());
        const prior = grant;
        grant = null;
        if (prior !== null) {
          const release = await lease.release();
          if (release.kind !== 'released') leaseLosses++;
        }
      } else {
        clearGrant();
      }
      return outcome;
    },
    async release(): Promise<void> {
      clock.setEligibility({ visible: false, answerable: false, leaseOwned: false }, input.now());
      visible = false;
      answerable = false;
      const prior = grant;
      grant = null;
      if (prior !== null) {
        const outcome = await lease.release();
        if (outcome.kind !== 'released') leaseLosses++;
      }
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
