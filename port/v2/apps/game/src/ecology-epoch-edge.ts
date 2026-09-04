/* F4 ecology-epoch edge authority.

   This owner deliberately accepts only the already-authoritative active-play
   total. Visibility, answerability, lease ownership and monotonic time belong
   to F4RuntimeAuthority; page residence, wall time, render cadence and motion
   preferences cannot enter here.

   A candidate is private until the caller's receipt-free lease/revision CAS
   commits. The exact staged object is the acknowledgement token, so a stale or
   duplicate completion cannot publish a later candidate by structural luck. */
import {
  EPOCH_TICK,
  MAX_ACTIVE_PLAY_MS,
  createEpochClock,
  sanitizeEpoch,
} from '@cf/domain-progression';
import { F3_MAX_REVISION } from '@cf/persistence';

export const ECOLOGY_EPOCH_EDGE_SCHEMA = 'cf-v2-ecology-epoch-edge/v1' as const;

export type EcologyEpochCheckpointIntent = 'ordinary' | 'ecology-edge';

export interface EcologyEpochStage {
  readonly schema: typeof ECOLOGY_EPOCH_EDGE_SCHEMA;
  readonly intent: EcologyEpochCheckpointIntent;
  readonly fromEpoch: number;
  readonly epoch: number;
  readonly crossed: number;
  readonly activePlayMs: number;
}

export interface EcologyEpochPublication {
  readonly schema: typeof ECOLOGY_EPOCH_EDGE_SCHEMA;
  readonly fromEpoch: number;
  readonly epoch: number;
  readonly crossed: number;
  readonly revision: number;
}

export type EcologyEpochProjectionState = 'current' | 'dirty' | 'refreshing' | 'suppressed';

export interface EcologyEpochProjectionRefreshToken {
  readonly schema: typeof ECOLOGY_EPOCH_EDGE_SCHEMA;
  readonly kind: 'projection-refresh';
  readonly epoch: number;
  readonly serial: number;
}

export interface EcologyEpochProjectionSnapshot {
  readonly state: EcologyEpochProjectionState;
  readonly publishedEpoch: number;
  readonly projectedEpoch: number;
  readonly refreshEpoch: number | null;
  readonly refreshSerial: number | null;
}

export type EcologyEpochProjectionBeginOutcome =
  | { readonly kind: 'started'; readonly token: EcologyEpochProjectionRefreshToken }
  | { readonly kind: 'current'; readonly epoch: number }
  | { readonly kind: 'busy'; readonly token: EcologyEpochProjectionRefreshToken }
  | { readonly kind: 'suppressed'; readonly epoch: number };

export type EcologyEpochProjectionSettleOutcome =
  | { readonly kind: 'current'; readonly epoch: number }
  | { readonly kind: 'suppressed'; readonly epoch: number }
  | { readonly kind: 'invalid-token' };

export type EcologyEpochStageOutcome =
  | { readonly kind: 'staged'; readonly stage: EcologyEpochStage }
  | { readonly kind: 'busy'; readonly stage: EcologyEpochStage }
  | { readonly kind: 'no-edge'; readonly epoch: number }
  | { readonly kind: 'retry-suppressed'; readonly epoch: number };

export type EcologyEpochCommitOutcome =
  | { readonly kind: 'published'; readonly publication: EcologyEpochPublication }
  | { readonly kind: 'steady'; readonly epoch: number; readonly revision: number }
  | { readonly kind: 'invalid-stage' };

export type EcologyEpochRejectOutcome =
  | { readonly kind: 'rejected'; readonly epoch: number }
  | { readonly kind: 'invalid-stage' };

export interface EcologyEpochEdgeDiagnostics {
  readonly schema: typeof ECOLOGY_EPOCH_EDGE_SCHEMA;
  readonly publishedEpoch: number;
  readonly candidateEpoch: number;
  readonly activePlayOriginMs: number;
  readonly observedActivePlayMs: number;
  readonly edgeDue: boolean;
  readonly autoCheckpointDue: boolean;
  readonly inFlight: boolean;
  readonly stagedIntent: EcologyEpochCheckpointIntent | null;
  readonly stagedEpoch: number | null;
  readonly retrySuppressedEpoch: number | null;
  readonly lastCommittedRevision: number | null;
  readonly stages: number;
  readonly commits: number;
  readonly publications: number;
  readonly rejections: number;
  readonly invalidStageCompletions: number;
  readonly projection: EcologyEpochProjectionSnapshot;
  readonly projectionRefreshesStarted: number;
  readonly projectionRefreshesCompleted: number;
  readonly projectionRefreshesFailed: number;
  readonly projectionSuppressions: number;
  readonly invalidProjectionCompletions: number;
}

export interface EcologyEpochEdgeAuthority {
  /** The sole epoch that gameplay and presentation may consume. */
  published(): number;
  /** Observe the private candidate derived from authoritative active play. */
  candidate(activePlayMs: number): number;
  /** True while gameplay would otherwise consume an undurable ecology edge. */
  blocksEcology(activePlayMs: number): boolean;
  /** True only when the automatic edge owner may make one new CAS attempt. */
  autoCheckpointDue(activePlayMs: number): boolean;
  /** Stage a detached checkpoint; never mutates the published epoch. */
  stage(activePlayMs: number, intent: EcologyEpochCheckpointIntent): EcologyEpochStageOutcome;
  /** Acknowledge only the exact stage after its lease/revision CAS committed. */
  commit(stage: EcologyEpochStage, revision: number): EcologyEpochCommitOutcome;
  /** Reject a pre-durable stage. The same automatic target is not blind-retried. */
  reject(stage: EcologyEpochStage): EcologyEpochRejectOutcome;
  /** The executable publication-to-projection lifecycle. */
  projection(): EcologyEpochProjectionSnapshot;
  /** True only when the rendered projection is current with the published epoch. */
  projectionMayAnswer(): boolean;
  /** Mint one exact token for rebuilding the current published epoch. */
  beginProjectionRefresh(): EcologyEpochProjectionBeginOutcome;
  /** Publish current projection only for the exact active token. */
  completeProjectionRefresh(
    token: EcologyEpochProjectionRefreshToken,
  ): EcologyEpochProjectionSettleOutcome;
  /** Suppress projection after the exact active refresh fails. */
  failProjectionRefresh(
    token: EcologyEpochProjectionRefreshToken,
  ): EcologyEpochProjectionSettleOutcome;
  /** Suppress live projection after another post-durable publication fault. */
  suppressProjection(): EcologyEpochProjectionSettleOutcome;
  diagnostics(activePlayMs: number): EcologyEpochEdgeDiagnostics;
}

function checkedActivePlayMs(value: unknown, prior: number): number {
  if (!Number.isSafeInteger(value) || (value as number) < prior
    || (value as number) < 0 || (value as number) > MAX_ACTIVE_PLAY_MS) {
    throw new RangeError(
      `ecology activePlayMs must be a monotonic safe integer from ${prior} through ${MAX_ACTIVE_PLAY_MS}`,
    );
  }
  return value as number;
}

function checkedRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0
    || (value as number) > F3_MAX_REVISION) {
    throw new RangeError(
      `ecology checkpoint revision must be a non-negative safe integer through ${F3_MAX_REVISION}`,
    );
  }
  return value as number;
}

export function createEcologyEpochEdgeAuthority(input: {
  readonly restoredEpoch: unknown;
  readonly activePlayAtBootMs: unknown;
}): EcologyEpochEdgeAuthority {
  const restoredEpoch = sanitizeEpoch(input.restoredEpoch);
  const activePlayOriginMs = checkedActivePlayMs(input.activePlayAtBootMs, 0);
  let observedActivePlayMs = activePlayOriginMs;
  const clock = createEpochClock(
    restoredEpoch,
    () => (observedActivePlayMs - activePlayOriginMs) / 1000,
    EPOCH_TICK,
  );
  let publishedEpoch = restoredEpoch;
  let staged: EcologyEpochStage | null = null;
  let retrySuppressedEpoch: number | null = null;
  let lastCommittedRevision: number | null = null;
  let stages = 0;
  let commits = 0;
  let publications = 0;
  let rejections = 0;
  let invalidStageCompletions = 0;
  let projectionState: EcologyEpochProjectionState = 'current';
  let projectedEpoch = restoredEpoch;
  let projectionRefresh: EcologyEpochProjectionRefreshToken | null = null;
  let nextProjectionRefreshSerial = 1;
  let projectionRefreshesStarted = 0;
  let projectionRefreshesCompleted = 0;
  let projectionRefreshesFailed = 0;
  let projectionSuppressions = 0;
  let invalidProjectionCompletions = 0;

  const observe = (activePlayMs: number): number => {
    observedActivePlayMs = checkedActivePlayMs(activePlayMs, observedActivePlayMs);
    return clock.current();
  };

  const automaticDue = (candidateEpoch: number): boolean => (
    candidateEpoch > publishedEpoch && candidateEpoch !== retrySuppressedEpoch
  );

  const projectionSnapshot = (): EcologyEpochProjectionSnapshot => Object.freeze({
    state: projectionState,
    publishedEpoch,
    projectedEpoch,
    refreshEpoch: projectionRefresh?.epoch ?? null,
    refreshSerial: projectionRefresh?.serial ?? null,
  });

  const projectionIsCurrent = (): boolean => (
    projectionState === 'current' && projectedEpoch === publishedEpoch
  );

  const markProjectionDirty = (): void => {
    projectionRefresh = null;
    projectionState = 'dirty';
  };

  return Object.freeze({
    published(): number { return publishedEpoch; },
    candidate(activePlayMs: number): number { return observe(activePlayMs); },
    blocksEcology(activePlayMs: number): boolean {
      const projectionBlocked = projectionState === 'dirty' || projectionState === 'suppressed';
      return projectionBlocked || staged !== null || observe(activePlayMs) > publishedEpoch;
    },
    autoCheckpointDue(activePlayMs: number): boolean {
      return staged === null && automaticDue(observe(activePlayMs));
    },
    stage(
      activePlayMs: number,
      intent: EcologyEpochCheckpointIntent,
    ): EcologyEpochStageOutcome {
      const candidateEpoch = observe(activePlayMs);
      if (staged !== null) return Object.freeze({ kind: 'busy', stage: staged });
      if (intent === 'ecology-edge') {
        if (candidateEpoch <= publishedEpoch) {
          return Object.freeze({ kind: 'no-edge', epoch: publishedEpoch });
        }
        if (candidateEpoch === retrySuppressedEpoch) {
          return Object.freeze({ kind: 'retry-suppressed', epoch: candidateEpoch });
        }
      }
      staged = Object.freeze({
        schema: ECOLOGY_EPOCH_EDGE_SCHEMA,
        intent,
        fromEpoch: publishedEpoch,
        epoch: candidateEpoch,
        crossed: candidateEpoch - publishedEpoch,
        activePlayMs: observedActivePlayMs,
      });
      stages++;
      return Object.freeze({ kind: 'staged', stage: staged });
    },
    commit(stage: EcologyEpochStage, revision: number): EcologyEpochCommitOutcome {
      const committedRevision = checkedRevision(revision);
      if (staged !== stage) {
        invalidStageCompletions++;
        return Object.freeze({ kind: 'invalid-stage' });
      }
      if (lastCommittedRevision !== null && committedRevision <= lastCommittedRevision) {
        throw new RangeError('ecology checkpoint revision did not advance');
      }
      const priorEpoch = publishedEpoch;
      if (stage.fromEpoch !== priorEpoch || stage.epoch < priorEpoch) {
        throw new Error('ecology checkpoint stage no longer matches the published epoch');
      }
      staged = null;
      retrySuppressedEpoch = null;
      lastCommittedRevision = committedRevision;
      commits++;
      if (stage.epoch === priorEpoch) {
        return Object.freeze({ kind: 'steady', epoch: priorEpoch, revision: committedRevision });
      }
      publishedEpoch = stage.epoch;
      markProjectionDirty();
      publications++;
      return Object.freeze({
        kind: 'published',
        publication: Object.freeze({
          schema: ECOLOGY_EPOCH_EDGE_SCHEMA,
          fromEpoch: priorEpoch,
          epoch: publishedEpoch,
          crossed: publishedEpoch - priorEpoch,
          revision: committedRevision,
        }),
      });
    },
    reject(stage: EcologyEpochStage): EcologyEpochRejectOutcome {
      if (staged !== stage) {
        invalidStageCompletions++;
        return Object.freeze({ kind: 'invalid-stage' });
      }
      staged = null;
      rejections++;
      if (stage.intent === 'ecology-edge') retrySuppressedEpoch = stage.epoch;
      return Object.freeze({ kind: 'rejected', epoch: stage.epoch });
    },
    projection(): EcologyEpochProjectionSnapshot { return projectionSnapshot(); },
    projectionMayAnswer(): boolean { return projectionIsCurrent(); },
    beginProjectionRefresh(): EcologyEpochProjectionBeginOutcome {
      if (projectionIsCurrent()) {
        return Object.freeze({ kind: 'current', epoch: publishedEpoch });
      }
      if (projectionState === 'suppressed') {
        return Object.freeze({ kind: 'suppressed', epoch: publishedEpoch });
      }
      if (projectionState === 'refreshing' && projectionRefresh !== null) {
        return Object.freeze({ kind: 'busy', token: projectionRefresh });
      }
      projectionRefresh = Object.freeze({
        schema: ECOLOGY_EPOCH_EDGE_SCHEMA,
        kind: 'projection-refresh',
        epoch: publishedEpoch,
        serial: nextProjectionRefreshSerial++,
      });
      projectionState = 'refreshing';
      projectionRefreshesStarted++;
      return Object.freeze({ kind: 'started', token: projectionRefresh });
    },
    completeProjectionRefresh(
      token: EcologyEpochProjectionRefreshToken,
    ): EcologyEpochProjectionSettleOutcome {
      if (projectionState !== 'refreshing' || projectionRefresh !== token
        || token.epoch !== publishedEpoch) {
        invalidProjectionCompletions++;
        return Object.freeze({ kind: 'invalid-token' });
      }
      projectionRefresh = null;
      projectedEpoch = token.epoch;
      projectionState = 'current';
      projectionRefreshesCompleted++;
      return Object.freeze({ kind: 'current', epoch: projectedEpoch });
    },
    failProjectionRefresh(
      token: EcologyEpochProjectionRefreshToken,
    ): EcologyEpochProjectionSettleOutcome {
      if (projectionState !== 'refreshing' || projectionRefresh !== token) {
        invalidProjectionCompletions++;
        return Object.freeze({ kind: 'invalid-token' });
      }
      projectionRefresh = null;
      projectionState = 'suppressed';
      projectionRefreshesFailed++;
      return Object.freeze({ kind: 'suppressed', epoch: publishedEpoch });
    },
    suppressProjection(): EcologyEpochProjectionSettleOutcome {
      projectionRefresh = null;
      if (projectionState !== 'suppressed') projectionSuppressions++;
      projectionState = 'suppressed';
      return Object.freeze({ kind: 'suppressed', epoch: publishedEpoch });
    },
    diagnostics(activePlayMs: number): EcologyEpochEdgeDiagnostics {
      const candidateEpoch = observe(activePlayMs);
      return Object.freeze({
        schema: ECOLOGY_EPOCH_EDGE_SCHEMA,
        publishedEpoch,
        candidateEpoch,
        activePlayOriginMs,
        observedActivePlayMs,
        edgeDue: candidateEpoch > publishedEpoch,
        autoCheckpointDue: staged === null && automaticDue(candidateEpoch),
        inFlight: staged !== null,
        stagedIntent: staged?.intent ?? null,
        stagedEpoch: staged?.epoch ?? null,
        retrySuppressedEpoch,
        lastCommittedRevision,
        stages,
        commits,
        publications,
        rejections,
        invalidStageCompletions,
        projection: projectionSnapshot(),
        projectionRefreshesStarted,
        projectionRefreshesCompleted,
        projectionRefreshesFailed,
        projectionSuppressions,
        invalidProjectionCompletions,
      });
    },
  });
}
