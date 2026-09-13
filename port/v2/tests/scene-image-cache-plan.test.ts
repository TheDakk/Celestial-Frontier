import { describe, expect, it, vi } from 'vitest';
import {
  planSceneImageCacheV1,
  type SceneImageCacheEntryKindV1, type SceneImageCacheEntryV1,
  type SceneImageCachePlanInputV1, type SceneImageCachePlanV1, type SceneImageExactCopyV1,
} from '../apps/game/src/scene-image-cache-plan.js';

const HASH = 'a'.repeat(64), WRONG_HASH = 'b'.repeat(64);
function copy(id: string, bytes: number): SceneImageExactCopyV1 {
  return { kind: 'verified-exact-copy', copyId: `outside-${id}`, domain: 'outside-origin',
    contentSha256: HASH, bytes, receiptId: `verified-${id}`, protected: true };
}
function entry(id: string, bytes: number, lastUseSequence = 0,
  kind: SceneImageCacheEntryKindV1 = 'scene-variant'): SceneImageCacheEntryV1 {
  return { id, kind, bytes, contentSha256: HASH, lastUseSequence,
    pinned: false, leased: false, inFlight: false, exactCopy: copy(id, bytes) };
}
function input(overrides: Partial<SceneImageCachePlanInputV1> = {}): SceneImageCachePlanInputV1 {
  return { inventoryRevision: 17, reservationRevision: 4, profile: 'conservative', desktopCeilingBytes: null,
    estimate: { usageBytes: 0, quotaBytes: 10_000_000_000 }, safetyHeadroomBytes: 0,
    saveAndUpdateReserveBytes: 0, otherReservationsBytes: 0, entries: [],
    candidate: { id: 'incoming', bytes: 10, contentSha256: HASH, peakStagingBytes: 0,
      exactCopy: copy('incoming', 10) }, ...overrides };
}

/** Independent outcome ruler for these fixtures: count selected physical blobs
 * and check both actual budget inequalities, not reported reclaimed totals.
 * Fixtures used with this ruler have separately verified external copies. */
function budgetsFit(source: SceneImageCachePlanInputV1, plan: SceneImageCachePlanV1, sceneCap: number): boolean {
  if (plan.status !== 'admit' || !source.estimate || new Set(plan.evictionIds).size !== plan.evictionIds.length) return false;
  let removed = 0;
  for (const id of plan.evictionIds) {
    const row = source.entries.find(item => item.id === id);
    if (!row || row.kind !== 'scene-variant' || row.pinned || row.leased || row.inFlight) return false;
    removed += row.bytes;
  }
  const scenes = source.entries.filter(row => row.kind === 'scene-variant').reduce((n, row) => n + row.bytes, 0);
  return scenes - removed + source.candidate.bytes <= sceneCap
    && source.estimate.usageBytes - removed + source.candidate.bytes + source.candidate.peakStagingBytes
      + source.safetyHeadroomBytes + source.saveAndUpdateReserveBytes + source.otherReservationsBytes <= source.estimate.quotaBytes;
}

function expectPaused(plan: SceneImageCachePlanV1, reason: SceneImageCachePlanV1['reason']): void {
  expect(plan.status).toBe('pause'); expect(plan.reason).toBe(reason);
  expect(plan.advisory).toBe(true); expect(plan.evictionIds).toEqual([]); expect(plan.reclaimedBytes).toBe(0);
}

describe('advisory encoded scene cache budget, not storage execution or RAM qualification', () => {
  it.each([
    ['conservative', null, 500_000_000], ['qualified-phone', null, 1_000_000_000],
    ['qualified-desktop', null, 2_000_000_000], ['qualified-desktop', 5_000_000_000, 5_000_000_000],
    ['qualified-desktop', 100, 100],
  ] as const)('uses the explicit provisional decimal profile %s / %s', (profile, desktopCeilingBytes, ceiling) => {
    const plan = planSceneImageCacheV1(input({ profile, desktopCeilingBytes }));
    expect(plan.status).toBe('admit'); expect(plan.reason).toBe('within-budget');
    expect(plan.requestedSceneCeilingBytes).toBe(ceiling); expect(plan.effectiveSceneCeilingBytes).toBe(ceiling);
    expect(plan.inventoryRevision).toBe(17); expect(plan.reservationRevision).toBe(4);
  });

  it('counts installed protected/model/build bytes once and preserves unknown origin usage', () => {
    const source = input({ entries: [entry('model', 1000, 0, 'model'), entry('build', 200, 0, 'build'),
      entry('save', 10, 0, 'save'), entry('original', 20, 0, 'original'), entry('variant', 20)],
    estimate: { usageBytes: 1300, quotaBytes: 1400 }, safetyHeadroomBytes: 10,
    saveAndUpdateReserveBytes: 20, otherReservationsBytes: 20,
    candidate: { ...input().candidate, peakStagingBytes: 5 } });
    const plan = planSceneImageCacheV1(source);
    expect(plan.status).toBe('admit'); expect(plan.evictionIds).toEqual([]);
    expect(plan.effectiveSceneCeilingBytes).toBe(65);
    expect(plan.accounting).toMatchObject({ inventoriedBytes: 1250, originUsageBytes: 1300,
      otherCommittedOriginBytes: 1280, currentSceneBytes: 20, candidateBytes: 10,
      futureReserveBytes: 50, projectedSceneBytes: 30, projectedPeakOriginBytes: 1365 });
    expect(budgetsFit(source, plan, 500_000_000)).toBe(true);
  });

  it('chooses the shortest eligible LRU prefix with code-unit ties, independent of input order', () => {
    const rows = [entry('a', 40, 1), entry('B', 50, 1), entry('c', 30, 0)];
    const source = input({ profile: 'qualified-desktop', desktopCeilingBytes: 100,
      entries: rows, estimate: { usageBytes: 120, quotaBytes: 1000 },
      candidate: { ...input().candidate, bytes: 20, exactCopy: copy('incoming', 20) } });
    const baseline = planSceneImageCacheV1(source);
    expect(baseline.status).toBe('admit'); expect(baseline.evictionIds).toEqual(['c', 'B']);
    expect(baseline.reclaimedBytes).toBe(80); expect(baseline.remainingShortfallBytes).toBe(0);
    expect(baseline.accounting).toMatchObject({ requiredReclaimBytes: 40, projectedSceneBytes: 60 });
    for (const entries of [[rows[2]!, rows[1]!, rows[0]!], [rows[1]!, rows[0]!, rows[2]!]]) {
      expect(planSceneImageCacheV1({ ...source, entries })).toEqual(baseline);
    }
    expect(budgetsFit(source, baseline, 100)).toBe(true);
    expect(budgetsFit(source, { ...baseline, evictionIds: ['c'] }, 100)).toBe(false);
  });

  it('includes final bytes, additional staging and all disjoint reserves in peak admission', () => {
    const source = input({ entries: [entry('old', 70, 1), entry('new', 50, 2), entry('model', 380, 0, 'model')],
      estimate: { usageBytes: 500, quotaBytes: 550 }, safetyHeadroomBytes: 10,
      saveAndUpdateReserveBytes: 20, otherReservationsBytes: 30,
      candidate: { ...input().candidate, bytes: 20, peakStagingBytes: 50, exactCopy: copy('incoming', 20) } });
    const plan = planSceneImageCacheV1(source);
    expect(plan.evictionIds).toEqual(['old', 'new']); expect(plan.effectiveSceneCeilingBytes).toBe(60);
    expect(plan.accounting).toMatchObject({ requiredReclaimBytes: 80, projectedSceneBytes: 20,
      projectedPeakOriginBytes: 510, futureReserveBytes: 60, peakStagingBytes: 50 });
    expect(budgetsFit(source, plan, 500_000_000)).toBe(true);
    // Same outcome ruler rejects a rest/zero-eviction report and deleting a
    // protected model instead, even though the latter would fit numerically.
    expect(budgetsFit(source, { ...plan, evictionIds: [] }, 500_000_000)).toBe(false);
    expect(budgetsFit(source, { ...plan, evictionIds: ['model'] }, 500_000_000)).toBe(false);
    expect(planSceneImageCacheV1({ ...source, candidate: { ...source.candidate, peakStagingBytes: 0 } }).evictionIds).toEqual(['old']);
    expect(planSceneImageCacheV1({ ...source, safetyHeadroomBytes: 0,
      saveAndUpdateReserveBytes: 0, otherReservationsBytes: 0 }).evictionIds).toEqual(['old']);
  });

  it.each(['original', 'recipe', 'save', 'build', 'model'] as const)('never proposes %s eviction even with exact-copy evidence', kind => {
    const protectedEntry = entry('protected', 20, 0, kind);
    const source = input({ entries: [protectedEntry], estimate: { usageBytes: 20, quotaBytes: 20 } });
    expectPaused(planSceneImageCacheV1(source), 'insufficient-disposable-space');
    expect(planSceneImageCacheV1({ ...source, entries: [{ ...protectedEntry, kind: 'scene-variant' }] }).evictionIds).toEqual(['protected']);
  });

  it.each(['pinned', 'leased', 'inFlight'] as const)('protects a %s variant from eviction', flag => {
    const row = { ...entry('locked', 20), [flag]: true };
    const source = input({ entries: [row], estimate: { usageBytes: 20, quotaBytes: 20 } });
    const plan = planSceneImageCacheV1(source);
    expectPaused(plan, 'insufficient-disposable-space');
    expect(plan.accounting).toMatchObject({ protectedSceneBytes: 20, eligibleSceneBytes: 0 });
    expect(planSceneImageCacheV1({ ...source, entries: [{ ...row, [flag]: false }] }).evictionIds).toEqual(['locked']);
  });

  it('requires a distinct protected exact-copy witness for eviction and rejects stale/mismatched evidence', () => {
    const original = entry('master', 20, 0, 'original');
    const variant = { ...entry('variant', 20), exactCopy: { ...copy('variant', 20), domain: 'origin' as const, copyId: 'master' } };
    const source = input({ entries: [original, variant], estimate: { usageBytes: 40, quotaBytes: 40 } });
    expect(planSceneImageCacheV1(source).evictionIds).toEqual(['variant']);
    const invalidWitnesses = [null, { ...variant.exactCopy, contentSha256: WRONG_HASH },
      { ...variant.exactCopy, bytes: 19 }, { ...variant.exactCopy, copyId: 'missing' },
      { ...variant.exactCopy, copyId: 'variant' }, { ...variant.exactCopy, copyId: 'incoming' }];
    for (const exactCopy of invalidWitnesses) {
      expectPaused(planSceneImageCacheV1({ ...source, entries: [original, { ...variant, exactCopy }] }), 'insufficient-disposable-space');
    }
    expectPaused(planSceneImageCacheV1({ ...source, entries: [{ ...original, inFlight: true }, variant] }), 'insufficient-disposable-space');
    // Another deletable scene is not a protected survivor, even if it happens
    // to share the digest and is newer in LRU order.
    expect(planSceneImageCacheV1({ ...source, entries: [{ ...original, kind: 'scene-variant' }, variant] }).evictionIds).toEqual(['master']);
  });

  it('requires consistent bytes for a shared surviving-copy identity across candidate and evictions', () => {
    const witness = { ...copy('shared', 20), copyId: 'shared-survivor' };
    const variant = { ...entry('variant', 20), exactCopy: witness };
    const candidate = { ...input().candidate, bytes: 20, exactCopy: witness };
    const source = input({ entries: [variant], candidate, estimate: { usageBytes: 20, quotaBytes: 20 } });
    expect(planSceneImageCacheV1(source).evictionIds).toEqual(['variant']);
    expectPaused(planSceneImageCacheV1({ ...source, candidate: { ...candidate, bytes: 10,
      exactCopy: { ...witness, bytes: 10 } } }), 'invalid-input');
    expectPaused(planSceneImageCacheV1({ ...source, candidate: { ...candidate, contentSha256: WRONG_HASH,
      exactCopy: { ...witness, contentSha256: WRONG_HASH } } }), 'invalid-input');
  });

  it('refuses to classify a sole candidate as disposable despite ample quota', () => {
    const source = input();
    for (const exactCopy of [null, { ...copy('incoming', 10), contentSha256: WRONG_HASH },
      { ...copy('incoming', 10), bytes: 11 }, { ...copy('incoming', 10), copyId: 'incoming' }]) {
      expectPaused(planSceneImageCacheV1({ ...source, candidate: { ...source.candidate, exactCopy } }), 'protected-retention-required');
    }
    const seedOnly = { ...source.candidate, exactCopy: { kind: 'seed-only', seed: 133 } };
    expectPaused(planSceneImageCacheV1({ ...source, candidate: seedOnly }), 'invalid-input');
    const original = entry('master', 10, 0, 'original');
    const candidate = { ...source.candidate, exactCopy: { ...copy('incoming', 10), domain: 'origin' as const, copyId: 'master' } };
    expect(planSceneImageCacheV1({ ...source, candidate, entries: [original], estimate: { usageBytes: 10, quotaBytes: 100 } }).status).toBe('admit');
  });

  it('does not turn a zero effective ceiling or lower cap into an impossible admission', () => {
    const source = input({ profile: 'qualified-desktop', desktopCeilingBytes: 0,
      entries: [entry('locked', 20)], estimate: { usageBytes: 20, quotaBytes: 10 } });
    const plan = planSceneImageCacheV1(source);
    expectPaused(plan, 'insufficient-disposable-space');
    expect(plan.effectiveSceneCeilingBytes).toBe(0); expect(plan.remainingShortfallBytes).toBe(30);
    expect(plan.accounting?.eligibleSceneBytes).toBe(20);
    const fixed = input({ entries: [entry('model', 100, 0, 'model')], estimate: { usageBytes: 100, quotaBytes: 90 } });
    expectPaused(planSceneImageCacheV1(fixed), 'insufficient-disposable-space');
  });

  it('pauses on missing estimates, unknown profiles and invalid desktop override without capability inference', () => {
    expectPaused(planSceneImageCacheV1(input({ estimate: null })), 'missing-estimate');
    for (const change of [{ profile: 'Mac' }, { deviceMemory: 24 }, { desktopCeilingBytes: 1_000_000_000 },
      { profile: 'qualified-desktop', desktopCeilingBytes: 5_000_000_001 }]) {
      expectPaused(planSceneImageCacheV1({ ...input(), ...change }), 'invalid-input');
    }
  });

  it('rejects unsafe individual and aggregate byte arithmetic, revisions, duplicate IDs and inconsistent usage', () => {
    for (const invalid of [NaN, Infinity, -1, -0, .5, Number.MAX_SAFE_INTEGER + 1]) {
      expectPaused(planSceneImageCacheV1({ ...input(), inventoryRevision: invalid }), 'invalid-input');
      expectPaused(planSceneImageCacheV1({ ...input(), reservationRevision: invalid }), 'invalid-input');
      expectPaused(planSceneImageCacheV1({ ...input(), safetyHeadroomBytes: invalid }), 'invalid-input');
      expectPaused(planSceneImageCacheV1({ ...input(), estimate: { usageBytes: 0, quotaBytes: invalid } }), 'invalid-input');
    }
    expectPaused(planSceneImageCacheV1(input({ safetyHeadroomBytes: Number.MAX_SAFE_INTEGER, otherReservationsBytes: 1 })), 'invalid-input');
    expectPaused(planSceneImageCacheV1(input({ estimate: { usageBytes: Number.MAX_SAFE_INTEGER, quotaBytes: Number.MAX_SAFE_INTEGER } })), 'invalid-input');
    expectPaused(planSceneImageCacheV1(input({ entries: [entry('huge', Number.MAX_SAFE_INTEGER), entry('extra', 1)] })), 'invalid-input');
    expectPaused(planSceneImageCacheV1(input({ entries: [entry('same', 1), entry('same', 1)] })), 'invalid-input');
    expectPaused(planSceneImageCacheV1(input({ entries: [entry('incoming', 1)] })), 'invalid-input');
    expectPaused(planSceneImageCacheV1(input({ entries: [entry('stored', 1)] })), 'inconsistent-accounting');
  });

  it('does not invoke getter/toJSON inputs and bounds dense inventory processing', () => {
    const getter = vi.fn(() => 0), toJSON = vi.fn(() => input());
    const hostile = { ...input() };
    Object.defineProperty(hostile, 'safetyHeadroomBytes', { enumerable: true, get: getter });
    expectPaused(planSceneImageCacheV1(hostile), 'invalid-input');
    expectPaused(planSceneImageCacheV1({ ...input(), toJSON }), 'invalid-input');
    expect(getter).not.toHaveBeenCalled(); expect(toJSON).not.toHaveBeenCalled();
    const toString = vi.fn(() => 'scene-variant');
    expectPaused(planSceneImageCacheV1({ ...input(), entries: [{ ...entry('kind-hook', 1),
      kind: { toString } }] }), 'invalid-input');
    expect(toString).not.toHaveBeenCalled();
    const sparse = new Array(2); sparse[1] = entry('one', 1);
    expectPaused(planSceneImageCacheV1({ ...input(), entries: sparse }), 'invalid-input');
    expectPaused(planSceneImageCacheV1({ ...input(), entries: new Array(4097) }), 'invalid-input');
    const revoked = Proxy.revocable(input(), {}); revoked.revoke();
    expectPaused(planSceneImageCacheV1(revoked.proxy), 'invalid-input');
  });

  it('preserves source arrays/objects and returns deterministic frozen advisory data', () => {
    const source = input({ entries: [entry('newer', 40, 2), entry('older', 60, 1)],
      estimate: { usageBytes: 100, quotaBytes: 100 } });
    const before = JSON.stringify(source), order = source.entries.map(row => row.id);
    const first = planSceneImageCacheV1(source), second = planSceneImageCacheV1(structuredClone(source));
    expect(first).toEqual(second); expect(JSON.stringify(source)).toBe(before);
    expect(source.entries.map(row => row.id)).toEqual(order);
    expect(Object.isFrozen(first)).toBe(true); expect(Object.isFrozen(first.evictionIds)).toBe(true);
    expect(Object.isFrozen(first.accounting)).toBe(true);
    expect(first.evictionIds).not.toBe(source.entries);
    expect(first.inventoryRevision).toBe(17); expect(first.reservationRevision).toBe(4);
    expect(Reflect.set(first, 'advisory', false)).toBe(false);
  });
});
