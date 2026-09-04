/* F3 cross-tab lease for F4 active-play ownership.

   A browser page's monotonic clock has a page-local origin, so its numeric
   timestamps must never be serialized and compared by another tab. Instead,
   each contender times how long the exact persisted heartbeat bytes remain
   unchanged using its own injected monotonic clock. Renewal changes those
   bytes. Once one unchanged observation reaches the TTL, one checked storage
   transaction decides the successor; concurrent contenders cannot both win.

   Tokens are caller-injected session identities. This module intentionally
   owns no random or wall-clock source. A successful grant carries the exact
   storage check that F4 can include in the transaction which advances
   activePlayMs, so a stale owner cannot accrue after losing the lease. */
import type { StorageBackend, StorageCheck } from './repository.js';

export const F3_ACTIVE_PLAY_LEASE_KEY = 'f3:lease:active-play';
const LEASE_STORE = 'meta' as const;
const LEASE_SCHEMA = 1 as const;
const MAX_HEARTBEAT = Number.MAX_SAFE_INTEGER - 1;
const mintedGrants = new WeakSet<object>();

export interface TabLeaseIdentity {
  /** Stable diagnostic identity for this tab, not player-facing copy. */
  readonly ownerId: string;
  /** Unique, opaque identity for this exact tab lifetime. */
  readonly token: string;
}

export interface TabLeaseOptions extends TabLeaseIdentity {
  /** Positive duration measured only by this client's injected clock. */
  readonly ttlMs: number;
  /** Finite, non-negative, nondecreasing monotonic milliseconds. */
  readonly now: () => number;
}

export interface TabLeaseHolder extends TabLeaseIdentity {
  readonly heartbeat: number;
}

/** Exact persisted ownership fence. Include this check in any transaction
 * whose authority depends on the grant (notably F4 active-play accrual). */
export interface TabLeaseGrant extends TabLeaseHolder {
  readonly check: Readonly<StorageCheck> & {
    readonly store: 'meta';
    readonly key: typeof F3_ACTIVE_PLAY_LEASE_KEY;
    readonly value: string;
  };
}

export type TabLeaseAcquireOutcome =
  | { readonly kind: 'acquired'; readonly grant: TabLeaseGrant }
  | { readonly kind: 'renewed'; readonly grant: TabLeaseGrant }
  | { readonly kind: 'held-by-other'; readonly holder: TabLeaseHolder; readonly remainingMs: number }
  | { readonly kind: 'lost'; readonly reason: 'race'; readonly holder: TabLeaseHolder | null };

export type TabLeaseRenewOutcome =
  | { readonly kind: 'renewed'; readonly grant: TabLeaseGrant }
  | { readonly kind: 'lost'; readonly reason: 'not-held' | 'superseded' | 'race'; readonly holder: TabLeaseHolder | null };

export type TabLeaseReleaseOutcome =
  | { readonly kind: 'released'; readonly holder: TabLeaseHolder }
  | { readonly kind: 'lost'; readonly reason: 'not-held' | 'superseded' | 'race'; readonly holder: TabLeaseHolder | null };

export interface TabLeaseClient {
  readonly identity: Readonly<TabLeaseIdentity>;
  /** Acquire an empty/expired lease, or renew this exact token if it owns it. */
  acquire(): Promise<TabLeaseAcquireOutcome>;
  /** Renew only this exact token. A predecessor cannot renew its successor. */
  renew(): Promise<TabLeaseRenewOutcome>;
  /** Release only this exact token. A predecessor cannot delete its successor. */
  release(): Promise<TabLeaseReleaseOutcome>;
}

export class TabLeaseRecordError extends Error {
  constructor(message: string) {
    super(`stored active-play tab lease is corrupt or unsupported: ${message}`);
    this.name = 'TabLeaseRecordError';
  }
}

interface StoredTabLease extends TabLeaseHolder {
  readonly schema: typeof LEASE_SCHEMA;
  readonly held: boolean;
}

interface Observation {
  readonly raw: string;
  readonly sinceMs: number;
}

const VISIBLE_ASCII = /^[\x21-\x7e]+$/;

function checkedIdentityPart(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maxLength || !VISIBLE_ASCII.test(value)) {
    throw new RangeError(`${label} must be 1–${maxLength} visible ASCII characters`);
  }
  return value;
}

function checkedHeartbeat(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_HEARTBEAT) {
    throw new RangeError(`heartbeat must be a safe integer from 0 through ${MAX_HEARTBEAT}`);
  }
  return value as number;
}

function holderOf(record: StoredTabLease): TabLeaseHolder {
  return Object.freeze({ ownerId: record.ownerId, token: record.token, heartbeat: record.heartbeat });
}

function encode(record: StoredTabLease): string {
  return JSON.stringify(record);
}

function decode(raw: string): StoredTabLease {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('record must be an object');
    const keys = Object.keys(value).sort();
    if (keys.join(',') !== 'heartbeat,held,ownerId,schema,token') throw new Error('record has unknown or missing fields');
    if (value.schema !== LEASE_SCHEMA) throw new Error(`schema must equal ${LEASE_SCHEMA}`);
    if (typeof value.held !== 'boolean') throw new Error('held must be a boolean');
    return Object.freeze({
      schema: LEASE_SCHEMA,
      held: value.held,
      ownerId: checkedIdentityPart(value.ownerId, 'stored ownerId', 64),
      token: checkedIdentityPart(value.token, 'stored token', 128),
      heartbeat: checkedHeartbeat(value.heartbeat),
    });
  } catch (error) {
    if (error instanceof TabLeaseRecordError) throw error;
    throw new TabLeaseRecordError(error instanceof Error ? error.message : String(error));
  }
}

function owns(record: StoredTabLease, identity: TabLeaseIdentity): boolean {
  return record.ownerId === identity.ownerId && record.token === identity.token;
}

function grantOf(record: StoredTabLease, raw: string): TabLeaseGrant {
  const grant = Object.freeze({
    ...holderOf(record),
    check: Object.freeze({ store: LEASE_STORE, key: F3_ACTIVE_PLAY_LEASE_KEY, value: raw }),
  });
  mintedGrants.add(grant);
  return grant;
}

/** Return a grant's fence only when this module minted that exact immutable
 * object. Structural lookalikes must not authorize active-play persistence. */
export function tabLeaseFence(grant: TabLeaseGrant): TabLeaseGrant['check'] {
  if (typeof grant !== 'object' || grant === null || !mintedGrants.has(grant)) {
    throw new Error('tab lease grant was not minted by this lease owner');
  }
  return grant.check;
}

export function createTabLeaseClient(backend: StorageBackend, options: TabLeaseOptions): TabLeaseClient {
  const identity = Object.freeze({
    ownerId: checkedIdentityPart(options.ownerId, 'ownerId', 64),
    token: checkedIdentityPart(options.token, 'token', 128),
  });
  const ttlMs = options.ttlMs;
  const now = options.now;
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new RangeError('ttlMs must be finite and greater than zero');
  }
  if (typeof now !== 'function') throw new TypeError('now must be an injected monotonic clock');

  let lastNowMs: number | undefined;
  let observation: Observation | null = null;

  const monotonicNow = (): number => {
    const value = now();
    if (!Number.isFinite(value) || value < 0) throw new RangeError('monotonic clock must return a finite non-negative value');
    if (lastNowMs !== undefined && value < lastNowMs) throw new RangeError('monotonic clock moved backwards');
    lastNowMs = value;
    return value;
  };

  const read = async (): Promise<{ raw: string; record: StoredTabLease } | null> => {
    const raw = await backend.get(LEASE_STORE, F3_ACTIVE_PLAY_LEASE_KEY);
    return raw === undefined ? null : { raw, record: decode(raw) };
  };

  const forgetObservation = (): void => { observation = null; };

  const heldByOther = (raw: string, record: StoredTabLease, nowMs: number): {
    readonly kind: 'held-by-other';
    readonly holder: TabLeaseHolder;
    readonly remainingMs: number;
  } => {
    if (observation === null || observation.raw !== raw) observation = { raw, sinceMs: nowMs };
    const elapsed = nowMs - observation.sinceMs;
    return {
      kind: 'held-by-other',
      holder: holderOf(record),
      remainingMs: Math.max(0, ttlMs - elapsed),
    };
  };

  const lossAfterRace = async (): Promise<{
    readonly kind: 'lost';
    readonly reason: 'race';
    readonly holder: TabLeaseHolder | null;
  }> => {
    const current = await read();
    return {
      kind: 'lost',
      reason: 'race',
      holder: current === null || !current.record.held ? null : holderOf(current.record),
    };
  };

  const replace = async (
    expectedRaw: string | undefined,
    record: StoredTabLease,
  ): Promise<TabLeaseGrant | null> => {
    const raw = encode(record);
    const committed = await backend.compareAndApply(
      [{ store: LEASE_STORE, key: F3_ACTIVE_PLAY_LEASE_KEY, value: expectedRaw }],
      [{ store: LEASE_STORE, key: F3_ACTIVE_PLAY_LEASE_KEY, value: raw }],
    );
    if (!committed) return null;
    forgetObservation();
    return grantOf(record, raw);
  };

  const nextOwnRecord = (heartbeat: number): StoredTabLease => Object.freeze({
    schema: LEASE_SCHEMA,
    held: true,
    ownerId: identity.ownerId,
    token: identity.token,
    heartbeat: checkedHeartbeat(heartbeat),
  });

  return Object.freeze({
    identity,
    async acquire(): Promise<TabLeaseAcquireOutcome> {
      const nowMs = monotonicNow();
      const current = await read();
      if (current === null) {
        const grant = await replace(undefined, nextOwnRecord(0));
        return grant === null ? lossAfterRace() : { kind: 'acquired', grant };
      }
      if (!current.record.held) {
        const grant = await replace(current.raw, nextOwnRecord(current.record.heartbeat + 1));
        return grant === null ? lossAfterRace() : { kind: 'acquired', grant };
      }
      if (owns(current.record, identity)) {
        const grant = await replace(current.raw, nextOwnRecord(current.record.heartbeat + 1));
        return grant === null ? lossAfterRace() : { kind: 'renewed', grant };
      }

      const held = heldByOther(current.raw, current.record, nowMs);
      if (held.remainingMs > 0) return held;
      const grant = await replace(current.raw, nextOwnRecord(current.record.heartbeat + 1));
      if (grant !== null) return { kind: 'acquired', grant };
      return lossAfterRace();
    },
    async renew(): Promise<TabLeaseRenewOutcome> {
      monotonicNow();
      const current = await read();
      if (current === null || !current.record.held) {
        forgetObservation();
        return { kind: 'lost', reason: 'not-held', holder: null };
      }
      if (!owns(current.record, identity)) {
        return { kind: 'lost', reason: 'superseded', holder: holderOf(current.record) };
      }
      const grant = await replace(current.raw, nextOwnRecord(current.record.heartbeat + 1));
      return grant === null ? lossAfterRace() : { kind: 'renewed', grant };
    },
    async release(): Promise<TabLeaseReleaseOutcome> {
      monotonicNow();
      const current = await read();
      if (current === null || !current.record.held) {
        forgetObservation();
        return { kind: 'lost', reason: 'not-held', holder: null };
      }
      if (!owns(current.record, identity)) {
        return { kind: 'lost', reason: 'superseded', holder: holderOf(current.record) };
      }
      const released = holderOf(current.record);
      const releasedRecord: StoredTabLease = Object.freeze({
        schema: LEASE_SCHEMA,
        held: false,
        ownerId: identity.ownerId,
        token: identity.token,
        heartbeat: checkedHeartbeat(current.record.heartbeat + 1),
      });
      const committed = await backend.compareAndApply(
        [{ store: LEASE_STORE, key: F3_ACTIVE_PLAY_LEASE_KEY, value: current.raw }],
        [{ store: LEASE_STORE, key: F3_ACTIVE_PLAY_LEASE_KEY, value: encode(releasedRecord) }],
      );
      if (!committed) return lossAfterRace();
      forgetObservation();
      return { kind: 'released', holder: released };
    },
  });
}
