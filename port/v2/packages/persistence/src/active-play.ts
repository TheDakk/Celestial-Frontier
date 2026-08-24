/* F3/F4 join — persist one active-play snapshot only while both authorities
   remain current: the caller-observed save revision and an exact minted tab
   lease fence. The F4 authority lives inside the versioned v5 player
   extension and carries SessionRNG beside activePlayMs; no bare parallel row
   can drift outside the fixed-point v5 read/write path. */
import { MAX_ACTIVE_PLAY_MS, type ActivePlaySnapshot } from '@cf/domain-progression';
import { createSessionRNG, type SessionRNGState } from '@cf/domain-sessionrng';
import type { ContentRegistry } from './import-v2.js';
import {
  prepareV5SaveWrite,
  type PreparedV5SaveWrite,
  type V5ExtensionCarrier,
  type V5Extensions,
  type V5WritableState,
} from './migration-v5.js';
import type { RevisionedRepository } from './revisioned.js';
import { tabLeaseFence, type TabLeaseGrant } from './tab-lease.js';

export const F4_AUTHORITY_NAMESPACE = 'f4.authority';
export const F4_AUTHORITY_VERSION = 1;

export interface F4AuthorityV1 {
  readonly activePlayMs: number;
  readonly sessionRng: Readonly<SessionRNGState> & {
    readonly draws: Readonly<Record<string, number>>;
  };
}

export type F4AuthorityReadOutcome =
  | { readonly kind: 'absent' }
  | { readonly kind: 'loaded'; readonly authority: F4AuthorityV1 }
  | { readonly kind: 'future-version'; readonly version: number }
  | { readonly kind: 'corrupt' };

export interface ActivePlayCommit {
  readonly expectedRevision: number;
  readonly grant: TabLeaseGrant;
  /** Exact state/extensions returned by the v5 reader (or fresh bootstrap). */
  readonly writable: V5WritableState;
  /** Explicit snapshot from the injected visible/answerable domain clock. */
  readonly snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  /** The sibling save-lifetime outcome authority; never silently defaulted. */
  readonly sessionRng: SessionRNGState;
  /** Injected compatibility-codec input; this adapter owns no time source. */
  readonly now: number;
}

export type ActivePlayCommitOutcome =
  | {
    readonly kind: 'committed';
    readonly revision: number;
    readonly authority: F4AuthorityV1;
    readonly saved: PreparedV5SaveWrite;
  }
  | { readonly kind: 'stale'; readonly expectedRevision: number; readonly actualRevision: number }
  | { readonly kind: 'lost'; readonly reason: 'lease-lost' | 'conflict' };

export interface ActivePlayPersistenceOwner {
  commit(input: ActivePlayCommit): Promise<ActivePlayCommitOutcome>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function checkedActivePlayMs(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_ACTIVE_PLAY_MS) {
    throw new RangeError(`activePlayMs must be a safe integer from 0 through ${MAX_ACTIVE_PLAY_MS}`);
  }
  return value as number;
}

function checkedSessionRng(value: unknown): F4AuthorityV1['sessionRng'] {
  if (!isRecord(value) || !hasExactKeys(value, ['seed', 'ordinal', 'draws']) || !isRecord(value.draws)) {
    throw new Error('SessionRNG authority must contain exactly seed, ordinal, and map-shaped draws');
  }
  const state = createSessionRNG(
    value.seed as number,
    value.draws as Record<string, number>,
    value.ordinal as number,
  ).state();
  const draws = Object.freeze(Object.fromEntries(
    Object.entries(state.draws).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0),
  ));
  return Object.freeze({ seed: state.seed, ordinal: state.ordinal, draws });
}

function checkedAuthority(activePlayMs: unknown, sessionRng: unknown): F4AuthorityV1 {
  return Object.freeze({
    activePlayMs: checkedActivePlayMs(activePlayMs),
    sessionRng: checkedSessionRng(sessionRng),
  });
}

function carrierFor(authority: F4AuthorityV1): V5ExtensionCarrier {
  return Object.freeze({
    version: F4_AUTHORITY_VERSION,
    json: JSON.stringify({
      activePlayMs: authority.activePlayMs,
      sessionRng: {
        seed: authority.sessionRng.seed,
        ordinal: authority.sessionRng.ordinal,
        draws: authority.sessionRng.draws,
      },
    }),
  });
}

/** Decode only the namespaced v5 authority. Unknown future versions remain
 * protected; malformed current bytes never become zero/default progress. */
export function readF4Authority(extensions: V5Extensions): F4AuthorityReadOutcome {
  const carrier = extensions.player?.[F4_AUTHORITY_NAMESPACE];
  if (carrier === undefined) return { kind: 'absent' };
  if (!Number.isSafeInteger(carrier.version) || carrier.version < 1) return { kind: 'corrupt' };
  if (carrier.version > F4_AUTHORITY_VERSION) return { kind: 'future-version', version: carrier.version };
  try {
    const decoded = JSON.parse(carrier.json) as unknown;
    if (!isRecord(decoded) || !hasExactKeys(decoded, ['activePlayMs', 'sessionRng'])) return { kind: 'corrupt' };
    return { kind: 'loaded', authority: checkedAuthority(decoded.activePlayMs, decoded.sessionRng) };
  } catch {
    return { kind: 'corrupt' };
  }
}

export function createActivePlayPersistenceOwner(
  repository: Pick<RevisionedRepository, 'mutate'>,
  registry: ContentRegistry,
): ActivePlayPersistenceOwner {
  return Object.freeze({
    async commit(input: ActivePlayCommit): Promise<ActivePlayCommitOutcome> {
      const authority = checkedAuthority(input.snapshot.activePlayMs, input.sessionRng);
      const existing = readF4Authority(input.writable.extensions);
      if (existing.kind === 'future-version') throw new Error('cannot overwrite future F4 authority');
      if (existing.kind === 'corrupt') throw new Error('cannot overwrite corrupt F4 authority');
      if (existing.kind === 'loaded' && authority.activePlayMs < existing.authority.activePlayMs) {
        throw new RangeError('activePlayMs cannot move backwards');
      }
      const fence = tabLeaseFence(input.grant);
      const extensions: V5Extensions = Object.freeze({
        ...input.writable.extensions,
        player: Object.freeze({
          ...(input.writable.extensions.player ?? {}),
          [F4_AUTHORITY_NAMESPACE]: carrierFor(authority),
        }),
      });
      const saved = prepareV5SaveWrite({ state: input.writable.state, extensions }, registry, input.now);
      const outcome = await repository.mutate({
        expectedRevision: input.expectedRevision,
        fences: [fence],
        writes: saved.operations,
      });
      switch (outcome.kind) {
        case 'committed':
          return { kind: 'committed', revision: outcome.revision, authority, saved };
        case 'stale':
          return outcome;
        case 'fence-lost':
          return { kind: 'lost', reason: 'lease-lost' };
        case 'conflict':
          return { kind: 'lost', reason: 'conflict' };
        case 'duplicate-receipt':
          throw new Error('active-play persistence unexpectedly collided with a receipt');
      }
    },
  });
}
