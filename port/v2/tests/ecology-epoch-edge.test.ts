import { describe, expect, it } from 'vitest';
import { EPOCH_TICK, MAX_COSMIC_EPOCH } from '@cf/domain-progression';
import { F3_MAX_REVISION } from '@cf/persistence';
import {
  createEcologyEpochEdgeAuthority,
  type EcologyEpochStage,
} from '../apps/game/src/ecology-epoch-edge.js';

const TICK_MS = EPOCH_TICK * 1000;

function stageAt(
  authority: ReturnType<typeof createEcologyEpochEdgeAuthority>,
  activePlayMs: number,
  intent: 'ordinary' | 'ecology-edge' = 'ecology-edge',
): EcologyEpochStage {
  const outcome = authority.stage(activePlayMs, intent);
  if (outcome.kind !== 'staged') throw new Error(`checkpoint was ${outcome.kind}`);
  return outcome.stage;
}

describe('F4 ecology epoch edge authority', () => {
  it('keeps a candidate private until the exact receipt-free CAS stage commits', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 7, activePlayAtBootMs: 500 });
    expect(authority.published()).toBe(7);
    expect(authority.candidate(500 + TICK_MS - 1)).toBe(7);
    expect(authority.autoCheckpointDue(500 + TICK_MS)).toBe(true);

    const stage = stageAt(authority, 500 + TICK_MS);
    expect(stage).toMatchObject({ fromEpoch: 7, epoch: 8, crossed: 1 });
    expect(authority.published()).toBe(7);
    expect(authority.blocksEcology(500 + TICK_MS)).toBe(true);
    expect(authority.stage(500 + TICK_MS, 'ecology-edge')).toEqual({ kind: 'busy', stage });

    expect(authority.commit(stage, 12)).toEqual({
      kind: 'published',
      publication: {
        schema: 'cf-v2-ecology-epoch-edge/v1',
        fromEpoch: 7,
        epoch: 8,
        crossed: 1,
        revision: 12,
      },
    });
    expect(authority.published()).toBe(8);
    expect(authority.blocksEcology(500 + TICK_MS)).toBe(true);
    const refresh = authority.beginProjectionRefresh();
    if (refresh.kind !== 'started') throw new Error(`refresh was ${refresh.kind}`);
    expect(authority.completeProjectionRefresh(refresh.token).kind).toBe('current');
    expect(authority.blocksEcology(500 + TICK_MS)).toBe(false);
  });

  it('coalesces an epoch edge into an ordinary checkpoint without a second stage', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 3, activePlayAtBootMs: 100 });
    const ordinary = stageAt(authority, 100 + TICK_MS, 'ordinary');
    expect(ordinary).toMatchObject({ intent: 'ordinary', fromEpoch: 3, epoch: 4, crossed: 1 });
    expect(authority.commit(ordinary, 1).kind).toBe('published');
    expect(authority.autoCheckpointDue(100 + TICK_MS)).toBe(false);
    expect(authority.stage(100 + TICK_MS, 'ecology-edge')).toEqual({ kind: 'no-edge', epoch: 4 });
    expect(authority.diagnostics(100 + TICK_MS)).toMatchObject({
      stages: 1, commits: 1, publications: 1, publishedEpoch: 4,
    });
  });

  it('publishes the final valid F3 successor at MAX_SAFE_INTEGER', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 3, activePlayAtBootMs: 100 });
    const ordinary = stageAt(authority, 100 + TICK_MS, 'ordinary');
    expect(authority.commit(ordinary, F3_MAX_REVISION)).toEqual({
      kind: 'published',
      publication: {
        schema: 'cf-v2-ecology-epoch-edge/v1',
        fromEpoch: 3,
        epoch: 4,
        crossed: 1,
        revision: F3_MAX_REVISION,
      },
    });
    expect(authority.diagnostics(100 + TICK_MS).lastCommittedRevision)
      .toBe(F3_MAX_REVISION);
  });

  it('keeps a committed publication dirty while hidden, then settles one exact refresh', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 6, activePlayAtBootMs: 0 });
    const stage = stageAt(authority, TICK_MS);
    expect(authority.commit(stage, 1).kind).toBe('published');
    expect(authority.projection()).toEqual({
      state: 'dirty', publishedEpoch: 7, projectedEpoch: 6,
      refreshEpoch: null, refreshSerial: null,
    });
    expect(authority.projectionMayAnswer()).toBe(false);

    /* Visibility is deliberately not an owner input: deferring while hidden
       means no begin/complete call, so the durable publication stays dirty. */
    expect(authority.projection().state).toBe('dirty');
    const begun = authority.beginProjectionRefresh();
    expect(begun.kind).toBe('started');
    if (begun.kind !== 'started') throw new Error(`refresh was ${begun.kind}`);
    expect(authority.beginProjectionRefresh()).toEqual({ kind: 'busy', token: begun.token });
    expect(authority.projection()).toMatchObject({
      state: 'refreshing', refreshEpoch: 7, refreshSerial: begun.token.serial,
    });
    expect(authority.completeProjectionRefresh(begun.token)).toEqual({ kind: 'current', epoch: 7 });
    expect(authority.projectionMayAnswer()).toBe(true);
    expect(authority.projection()).toEqual({
      state: 'current', publishedEpoch: 7, projectedEpoch: 7,
      refreshEpoch: null, refreshSerial: null,
    });
    expect(authority.diagnostics(TICK_MS)).toMatchObject({
      projectionRefreshesStarted: 1,
      projectionRefreshesCompleted: 1,
      projectionRefreshesFailed: 0,
    });
  });

  it('refuses duplicate and stale projection refresh tokens without clearing a newer edge', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 0, activePlayAtBootMs: 0 });
    expect(authority.commit(stageAt(authority, TICK_MS), 1).kind).toBe('published');
    const first = authority.beginProjectionRefresh();
    if (first.kind !== 'started') throw new Error(`refresh was ${first.kind}`);

    expect(authority.commit(stageAt(authority, 2 * TICK_MS), 2).kind).toBe('published');
    expect(authority.completeProjectionRefresh(first.token)).toEqual({ kind: 'invalid-token' });
    expect(authority.projection()).toMatchObject({
      state: 'dirty', publishedEpoch: 2, projectedEpoch: 0,
    });

    const second = authority.beginProjectionRefresh();
    if (second.kind !== 'started') throw new Error(`refresh was ${second.kind}`);
    expect(authority.completeProjectionRefresh(second.token)).toEqual({ kind: 'current', epoch: 2 });
    expect(authority.completeProjectionRefresh(second.token)).toEqual({ kind: 'invalid-token' });
    expect(authority.projectionMayAnswer()).toBe(true);
    expect(authority.diagnostics(2 * TICK_MS).invalidProjectionCompletions).toBe(2);
  });

  it('suppresses a failed refresh until a replacement authority reloads committed bytes', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 2, activePlayAtBootMs: 0 });
    expect(authority.commit(stageAt(authority, TICK_MS), 4).kind).toBe('published');
    const begun = authority.beginProjectionRefresh();
    if (begun.kind !== 'started') throw new Error(`refresh was ${begun.kind}`);
    expect(authority.failProjectionRefresh(begun.token)).toEqual({ kind: 'suppressed', epoch: 3 });
    expect(authority.projectionMayAnswer()).toBe(false);
    expect(authority.blocksEcology(TICK_MS)).toBe(true);
    expect(authority.beginProjectionRefresh()).toEqual({ kind: 'suppressed', epoch: 3 });

    const replacement = createEcologyEpochEdgeAuthority({
      restoredEpoch: authority.published(),
      activePlayAtBootMs: TICK_MS,
    });
    expect(replacement.projection()).toEqual({
      state: 'current', publishedEpoch: 3, projectedEpoch: 3,
      refreshEpoch: null, refreshSerial: null,
    });
    expect(replacement.projectionMayAnswer()).toBe(true);
  });

  it('rejects pre-durable work without optimistic publication or blind same-target retry', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 0, activePlayAtBootMs: 0 });
    const stage = stageAt(authority, TICK_MS);
    expect(authority.reject(stage)).toEqual({ kind: 'rejected', epoch: 1 });
    expect(authority.published()).toBe(0);
    expect(authority.blocksEcology(TICK_MS)).toBe(true);
    expect(authority.autoCheckpointDue(TICK_MS)).toBe(false);
    expect(authority.stage(TICK_MS, 'ecology-edge')).toEqual({ kind: 'retry-suppressed', epoch: 1 });

    /* A separately authorized ordinary checkpoint may coalesce the held edge. */
    const ordinary = stageAt(authority, TICK_MS, 'ordinary');
    expect(authority.commit(ordinary, 4).kind).toBe('published');
    expect(authority.published()).toBe(1);
  });

  it('refuses a stale or duplicate completion token and a non-advancing revision', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 2, activePlayAtBootMs: 0 });
    const first = stageAt(authority, TICK_MS);
    expect(authority.commit(first, 8).kind).toBe('published');
    expect(authority.commit(first, 9)).toEqual({ kind: 'invalid-stage' });

    const second = stageAt(authority, 2 * TICK_MS);
    expect(() => authority.commit(second, 8)).toThrow(/revision did not advance/);
    expect(authority.published()).toBe(3);
    expect(authority.reject(second)).toEqual({ kind: 'rejected', epoch: 4 });
    expect(authority.diagnostics(2 * TICK_MS).invalidStageCompletions).toBe(1);
  });

  it('coalesces a stalled multi-edge observation into one capped publication', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 10, activePlayAtBootMs: 50 });
    const stage = stageAt(authority, 50 + 3 * TICK_MS + 17);
    expect(stage).toMatchObject({ fromEpoch: 10, epoch: 13, crossed: 3 });
    const outcome = authority.commit(stage, 1);
    expect(outcome).toMatchObject({
      kind: 'published', publication: { fromEpoch: 10, epoch: 13, crossed: 3 },
    });

    const capped = createEcologyEpochEdgeAuthority({
      restoredEpoch: MAX_COSMIC_EPOCH - 1,
      activePlayAtBootMs: 0,
    });
    const capStage = stageAt(capped, 20 * TICK_MS);
    expect(capStage).toMatchObject({ epoch: MAX_COSMIC_EPOCH, crossed: 1 });
    expect(capped.commit(capStage, 2).kind).toBe('published');
    expect(capped.autoCheckpointDue(21 * TICK_MS)).toBe(false);
  });

  it('uses only monotonic activePlayMs, so hidden/unanswerable time cannot catch up here', () => {
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 4, activePlayAtBootMs: 9_000 });
    /* A day of page/wall time is deliberately not an input. F4 reports the
       same active-play total while hidden or unanswerable, so nothing moves. */
    expect(authority.candidate(9_000)).toBe(4);
    expect(authority.candidate(9_000)).toBe(4);
    expect(authority.autoCheckpointDue(9_000)).toBe(false);
    expect(authority.candidate(9_000 + TICK_MS)).toBe(5);
    expect(() => authority.candidate(8_999)).toThrow(/monotonic/);
  });

  it('has no motion, wall-clock, receipt, RNG or ordinal input surface', () => {
    const source = createEcologyEpochEdgeAuthority.toString();
    expect(source).not.toMatch(/performance\.now|Date\.now|motionOK|receipt|SessionRNG|ordinal|Math\.random/i);
    const authority = createEcologyEpochEdgeAuthority({ restoredEpoch: 1, activePlayAtBootMs: 0 });
    const stage = stageAt(authority, TICK_MS);
    expect(Object.keys(stage).sort()).toEqual([
      'activePlayMs', 'crossed', 'epoch', 'fromEpoch', 'intent', 'schema',
    ]);
  });
});
