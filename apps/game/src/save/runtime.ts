/* The save runtime: one page's hold on the save.

   The active-play clock, the session random state, the tab lease and the revisioned transaction live in
   their own packages. This keeps the four on one page lifecycle: a page accrues active play only while
   visible, answerable and holding its exact lease, and a checkpoint commits the clock and random state under
   that same lease and the revision its caller saw. It owns no DOM, wall clock, entropy source or retry. */
import { createActivePlayClock, type ActivePlayClock } from '@cf/domain-progression';
import { createSessionRNG, type SessionRNGState } from '@cf/domain-sessionrng';
import {
  createActivePlayPersistenceOwner,
  createRevisionedRepository,
  createTabLeaseClient,
  F3_MAX_REVISION,
  type ActivePlayCommitOutcome,
  type ContentRegistry,
  type F4AuthorityV1,
  type RevisionedReplacementOutcome,
  type SaveStateV2,
  type StorageBackend,
  type StorageOperation,
  type TabLeaseClient,
  type TabLeaseGrant,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';

/** How long a tab's lease on the save lasts without a heartbeat, and how often a page renews it. */
export const LEASE_TTL_MS = 10_000;
export const HEARTBEAT_MS = LEASE_TTL_MS / 2;

export interface SaveRuntimeInput {
  readonly backend: StorageBackend;
  readonly registry: ContentRegistry;
  readonly initialRevision: number;
  readonly initialExtensions: V5Extensions;
  /** The stored state at boot: the parent of the first checkpoint. */
  readonly initialState: SaveStateV2;
  readonly restoredAuthority: F4AuthorityV1 | null;
  /** Caller-minted entropy, used only when no authority is stored. */
  readonly freshSessionSeed: number;
  readonly ownerId: string;
  readonly token: string;
  readonly leaseTtlMs: number;
  /** A monotonic clock in ms. */
  readonly now: () => number;
  readonly visible: boolean;
  readonly answerable: boolean;
}

export interface SaveRuntimeDiagnostics {
  readonly revision: number;
  readonly visible: boolean;
  readonly answerable: boolean;
  readonly leaseOwned: boolean;
  readonly staleBlocked: boolean;
  readonly leaseHeartbeat: number | null;
  readonly activePlayMs: number;
  readonly accruing: boolean;
  readonly sessionSeed: number;
  /** False while the seed is one this page minted and no checkpoint has yet stored it. */
  readonly seedStored: boolean;
  readonly sessionOrdinal: number;
  readonly sessionDraws: Readonly<Record<string, number>>;
  readonly commits: number;
  readonly staleWrites: number;
  readonly leaseLosses: number;
}

export type HeartbeatOutcome =
  | { readonly kind: 'owned'; readonly heartbeat: number }
  | { readonly kind: 'held-by-other'; readonly remainingMs: number }
  | {
      readonly kind: 'storage-error';
      readonly operation: 'acquire' | 'renew';
      readonly message: string;
    }
  | { readonly kind: 'lost' };

export type CommitOutcome =
  | Extract<ActivePlayCommitOutcome, { readonly kind: 'committed' }>
  | Extract<ActivePlayCommitOutcome, { readonly kind: 'stale' }>
  | Extract<ActivePlayCommitOutcome, { readonly kind: 'revision-exhausted' }>
  | Extract<ActivePlayCommitOutcome, { readonly kind: 'lost' }>
  | { readonly kind: 'lease-unavailable' };

export type ReplacementOutcome =
  | RevisionedReplacementOutcome
  | { readonly kind: 'lease-unavailable' };

export interface SaveRuntime {
  /** Acquire or renew this page's lease once. Never retries internally. */
  heartbeat(): Promise<HeartbeatOutcome>;
  /** Stop accrual before asynchronous release when the document hides. */
  setVisible(visible: boolean): Promise<HeartbeatOutcome>;
  setAnswerable(answerable: boolean): void;
  /** Commit a receipt-free checkpoint. Optional namespaced replacements land
      in the same lease/revision CAS as state, clock and unchanged RNG. */
  commit(
    state: SaveStateV2,
    wallNow: number,
    extensionWrites?: readonly V5ExtensionWrite[],
  ): Promise<CommitOutcome>;
  /** Whole-expedition replacement under this runtime's private lease/revision.
      The repository atomically resets the old receipt namespace. */
  replace(writes: readonly StorageOperation[]): Promise<ReplacementOutcome>;
  /** Detached last durable canonical state. Null means an opaque replacement committed. */
  checkpointParent(): SaveStateV2 | null;
  /** The one source of the active-play clock for every later system. */
  activePlayMs(): number;
  release(): Promise<void>;
  diagnostics(): SaveRuntimeDiagnostics;
  readonly revision: number;
  readonly extensions: V5Extensions;
}

function checkedRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > F3_MAX_REVISION) {
    throw new RangeError('F4 initial revision must be a non-negative safe integer at most MAX_SAFE_INTEGER');
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

function copyCanonicalState(value: SaveStateV2): SaveStateV2 {
  return structuredClone(value);
}

export function createSaveRuntime(input: SaveRuntimeInput): SaveRuntime {
  if (typeof input.now !== 'function') throw new TypeError('F4 runtime requires an injected monotonic clock');
  let revision = checkedRevision(input.initialRevision);
  let extensions = copyExtensions(input.initialExtensions);
  let checkpointParent: SaveStateV2 | null = copyCanonicalState(input.initialState);
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
  let seedStored = input.restoredAuthority !== null;
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
  const repository = createRevisionedRepository(input.backend);
  const owner = createActivePlayPersistenceOwner(repository, input.registry);
  const publishCheckpointParent = (state: SaveStateV2): void => {
    checkpointParent = copyCanonicalState(state);
  };

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

  const heartbeatUnsafe = async (): Promise<HeartbeatOutcome> => {
    if (staleBlocked || released || releasePending) return { kind: 'lost' };
    if (!visible) {
      return { kind: 'lost' };
    }
    const operation = grant === null ? 'acquire' : 'renew';
    let outcome: Awaited<ReturnType<TabLeaseClient['acquire'] | TabLeaseClient['renew']>>;
    try {
      outcome = operation === 'acquire' ? await lease.acquire() : await lease.renew();
    } catch (error) {
      /* Storage failure makes the durable lease state unknowable. Revoke the
         local grant synchronously so neither active-play nor any caller can
         continue under authority that was not re-proven. A later explicit
         heartbeat may reacquire; this owner never retries by itself. */
      clearGrant(true);
      return Object.freeze({
        kind: 'storage-error',
        operation,
        message: error instanceof Error ? error.message : String(error),
      });
    }
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
    state: SaveStateV2,
    wallNow: number,
    expectedRevision: number,
    expectedExtensions: V5Extensions,
    expectedSessionRng: SessionRNGState,
    extensionWrites: readonly V5ExtensionWrite[],
  ): Promise<CommitOutcome> => {
    if (grant === null || staleBlocked || released) return { kind: 'lease-unavailable' };
    const outcome = await owner.commit({
      expectedRevision,
      grant,
      writable: { state, extensions: expectedExtensions },
      snapshot: clock.current(input.now()),
      sessionRng: expectedSessionRng,
      extensionWrites,
      now: wallNow,
    });
    if (outcome.kind === 'committed') {
      revision = outcome.revision;
      extensions = outcome.saved.extensions;
      sessionRng = copySessionRng(outcome.authority.sessionRng);
      seedStored = true;
      publishCheckpointParent(outcome.saved.canonicalState);
      commits++;
    } else if (outcome.kind === 'stale') {
      await blockAndRelease(true);
    } else if (outcome.kind === 'revision-exhausted') {
      await blockAndRelease(false);
    } else {
      clearGrant(true);
    }
    return outcome;
  };

  return Object.freeze({
    heartbeat(): Promise<HeartbeatOutcome> {
      return enqueue(heartbeatUnsafe);
    },
    setVisible(nextVisible: boolean): Promise<HeartbeatOutcome> {
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
      state: SaveStateV2,
      wallNow: number,
      extensionWrites: readonly V5ExtensionWrite[] = Object.freeze([]),
    ): Promise<CommitOutcome> {
      /* Bind a write to the exact parent visible when its caller submitted it.
         The queue orders I/O and lifecycle transitions; it must never turn a
         second same-parent action into a child of an earlier queued commit. */
      const expectedRevision = revision;
      const expectedExtensions = extensions;
      const expectedSessionRng = sessionRng;
      return enqueue(() => commitUnsafe(
        state, wallNow, expectedRevision, expectedExtensions, expectedSessionRng, extensionWrites,
      ));
    },
    replace(writes: readonly StorageOperation[]): Promise<ReplacementOutcome> {
      const expectedRevision = revision;
      return enqueue(async () => {
        if (grant === null || staleBlocked || released) return { kind: 'lease-unavailable' };
        const outcome = await repository.replace({
          expectedRevision,
          fences: [grant.check],
          writes,
        });
        if (outcome.kind === 'committed') {
          revision = outcome.revision;
          checkpointParent = null;
          commits++;
        } else if (outcome.kind === 'stale') {
          await blockAndRelease(true);
        } else if (outcome.kind === 'revision-exhausted') {
          await blockAndRelease(false);
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
    checkpointParent(): SaveStateV2 | null {
      return checkpointParent === null ? null : copyCanonicalState(checkpointParent);
    },
    activePlayMs(): number {
      return clock.current(input.now()).activePlayMs;
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
    diagnostics(): SaveRuntimeDiagnostics {
      const snapshot = clock.current(input.now());
      return Object.freeze({
        revision,
        visible,
        answerable,
        leaseOwned: grant !== null,
        staleBlocked,
        leaseHeartbeat: grant?.heartbeat ?? null,
        activePlayMs: snapshot.activePlayMs,
        accruing: snapshot.eligible,
        sessionSeed: sessionRng.seed,
        seedStored,
        sessionOrdinal: sessionRng.ordinal,
        sessionDraws: Object.freeze({ ...sessionRng.draws }),
        commits,
        staleWrites,
        leaseLosses,
      });
    },
    get revision(): number { return revision; },
    get extensions(): V5Extensions { return extensions; },
  });
}
