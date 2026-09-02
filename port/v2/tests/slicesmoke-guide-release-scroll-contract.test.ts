import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as contractModule from '../tools/slicesmoke-contract.mjs';

interface WheelObservation {
  readonly documentToken: string;
  readonly tailText: string;
  readonly overflowY: string;
  readonly scrollTop: number;
  readonly maxScroll: number;
  readonly visible: boolean;
  readonly tailMatches: boolean;
  readonly hitOwned: boolean;
}

interface WheelState {
  readonly schema: 'cf-v2-guide-release-tail-wheel/v1';
  readonly documentToken: string;
  readonly tailText: string;
  readonly startedAtMs: number;
  readonly attempts: number;
  readonly consecutiveStalls: number;
  readonly lastScrollTop: number;
  readonly lastMaxScroll: number;
}

interface WheelDecision {
  readonly status: 'wheel' | 'reached' | 'failed';
  readonly reason: string;
  readonly deltaY: number | null;
  readonly state: WheelState | null;
  readonly observation: WheelObservation;
}

interface RestorationSnapshot {
  readonly documentToken: string;
  readonly tailText: string;
  readonly scrollTop: number;
  readonly scrollLeft: number;
  readonly overflowYValue: string;
  readonly overflowYPriority: string;
  readonly computedOverflowY: string;
}

const contract = contractModule as unknown as {
  advanceGuideReleaseTailNativeWheel: (
    state: WheelState | null,
    observation: WheelObservation,
    nowMs: number,
    limits?: Readonly<{
      maxDurationMs?: number;
      maxAttempts?: number;
      maxConsecutiveStalls?: number;
      bottomTolerancePx?: number;
      expectedTailText?: string;
    }>,
  ) => WheelDecision;
  assessGuideReleaseTailRestoration: (
    expected: RestorationSnapshot,
    actual: RestorationSnapshot,
  ) => Readonly<{ ok: boolean; reasons: readonly string[] }>;
};

const TAIL = 'DEVELOPMENT PUBLISHING STAYS PARKED';
const runnerSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);
const observation = (
  scrollTop: number,
  maxScroll = 25_829,
  overrides: Partial<WheelObservation> = {},
): WheelObservation => ({
  documentToken: 'guide-scroll-document',
  tailText: TAIL,
  overflowY: 'auto',
  scrollTop,
  maxScroll,
  visible: scrollTop >= maxScroll - 2,
  tailMatches: true,
  hitOwned: true,
  ...overrides,
});

const advance = (
  prior: WheelDecision | null,
  sample: WheelObservation,
  nowMs: number,
  limits?: Parameters<typeof contract.advanceGuideReleaseTailNativeWheel>[3],
): WheelDecision => contract.advanceGuideReleaseTailNativeWheel(
  prior?.state ?? null, sample, nowMs, { expectedTailText: TAIL, ...limits },
);

function replaceExact(source: string, before: string, after: string): string {
  const count = source.split(before).length - 1;
  expect(count, `exact source match for ${JSON.stringify(before)}`).toBe(1);
  return source.replace(before, after);
}

function guideReleaseDeadlineErrors(source: string): string[] {
  const errors: string[] = [];
  const start = source.indexOf('  const guideReleaseActionStartedAt = performance.now();');
  const end = source.indexOf('  const guideFocusBack =', start);
  if (start < 0 || end <= start) return ['missing bounded Guide release campaign'];
  const campaign = source.slice(start, end);
  const actionEnd = campaign.indexOf('  } finally {');
  if (actionEnd < 0) return ['missing Guide release finally boundary'];
  const action = campaign.slice(0, actionEnd);
  for (const marker of [
    'const guideReleaseActionDeadline = guideReleaseActionStartedAt',
    '+ GUIDE_RELEASE_TAIL_NATIVE_WHEEL_DEFAULTS.maxDurationMs;',
    'const remainingMs = guideReleaseActionDeadline - performance.now();',
    'timeoutMs: guideReleaseRemainingMs(label), label,',
    'method, params, sess, { timeoutMs: guideReleaseRemainingMs(label) },',
    'const releaseScrollSetup = await guideReleaseEval(',
    "'Guide release scroll setup'",
    "'Guide release initial scroll reset'",
    'let observation = await guideReleaseEval(',
    "'Guide release initial tail observation'",
    "await guideReleaseSend('Input.dispatchMouseEvent'",
    "'Guide release adaptive native wheel'",
    'observation = await guideReleaseEval(',
    "'Guide release post-wheel observation'",
    "'Guide release hidden-overflow setup'",
    'const hiddenBefore = await guideReleaseEval(',
    "'Guide release hidden-overflow pre-wheel observation'",
    "'Guide release hidden-overflow native wheel'",
    'const hiddenAfter = await guideReleaseEval(',
    "'Guide release hidden-overflow post-wheel observation'",
  ]) {
    if (!action.includes(marker)) errors.push(`unbounded action marker: ${marker}`);
  }
  if (action.includes('await evalIn(')
    || action.includes("await send('Input.dispatchMouseEvent'")) {
    errors.push('Guide release action bypasses its remaining-budget wrappers');
  }
  for (const marker of [
    'const guideReleaseCleanupDeadline = performance.now() + 2_000;',
    'Math.ceil(guideReleaseCleanupDeadline - performance.now())',
    "{ timeoutMs: guideReleaseCleanupRemainingMs(), label: 'Guide release exact restoration' }",
  ]) {
    if (!campaign.includes(marker)) errors.push(`unbounded cleanup marker: ${marker}`);
  }
  return errors;
}

describe('Guide release-tail native-wheel contract', () => {
  it('integrates one-at-a-time CDP wheels, bounded settlement, a hidden adversary, and exact finally restoration', () => {
    const start = runnerSource.indexOf('  const releaseTailCheck =');
    const end = runnerSource.indexOf('  const guideFocusBack =', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const source = runnerSource.slice(start, end);
    expect(source).toContain('expectedTailText: GUIDE_RELEASE_TAIL_TEXT');
    expect(source).toContain("while (decision.status === 'wheel')");
    expect(source).toContain("type: 'mouseWheel'");
    expect(source).toContain('deltaX: 0, deltaY: decision.deltaY');
    expect(source).toContain('await sleep(25);');
    expect(source).not.toContain('requestAnimationFrame');
    expect(source).not.toContain('for (let i = 0; i < 3; i++)');
    expect(source).toContain('releaseHiddenWheel = { before: hiddenBefore, after: hiddenAfter };');
    expect(source).toContain("releaseTailCtl.reason !== 'not-scrollable'");
    expect(source).toContain('} finally {');
    expect(source).toContain('assessGuideReleaseTailRestoration(');
    const dispatchAt = source.indexOf("type: 'mouseWheel'");
    const settleAt = source.indexOf('await sleep(25);', dispatchAt);
    const observeAt = source.indexOf('observation = await guideReleaseEval(', settleAt);
    expect(dispatchAt).toBeGreaterThanOrEqual(0);
    expect(settleAt).toBeGreaterThan(dispatchAt);
    expect(observeAt).toBeGreaterThan(settleAt);
    expect(guideReleaseDeadlineErrors(runnerSource)).toEqual([]);
  });

  it('clips every Guide CDP action and restoration call to its Node-owned deadline', () => {
    for (const mutant of [
      replaceExact(
        runnerSource,
        'timeoutMs: guideReleaseRemainingMs(label), label,',
        'label,',
      ),
      replaceExact(
        runnerSource,
        'method, params, sess, { timeoutMs: guideReleaseRemainingMs(label) },',
        'method, params, sess,',
      ),
      replaceExact(
        runnerSource,
        'const releaseScrollSetup = await guideReleaseEval(',
        'const releaseScrollSetup = await evalIn(',
      ),
      replaceExact(
        runnerSource,
        'let observation = await guideReleaseEval(',
        'let observation = await evalIn(',
      ),
      replaceExact(
        runnerSource,
        `      observation = await guideReleaseEval(
        releaseTailCheck, 'Guide release post-wheel observation',
      );`,
        `      observation = await evalIn(
        releaseTailCheck, 'Guide release post-wheel observation',
      );`,
      ),
      replaceExact(
        runnerSource,
        'const hiddenBefore = await guideReleaseEval(',
        'const hiddenBefore = await evalIn(',
      ),
      replaceExact(
        runnerSource,
        "{ timeoutMs: guideReleaseCleanupRemainingMs(), label: 'Guide release exact restoration' }",
        "{ label: 'Guide release exact restoration' }",
      ),
    ]) expect(guideReleaseDeadlineErrors(mutant)).not.toEqual([]);
  });

  it('continues the hosted 0 -> 10000 -> 20000 trace until the exact 25829 tail', () => {
    let decision = advance(null, observation(0), 0);
    expect(decision).toMatchObject({ status: 'wheel', reason: 'advance', deltaY: 25_829 });

    decision = advance(decision, observation(10_000), 20);
    expect(decision).toMatchObject({ status: 'wheel', deltaY: 15_829 });

    decision = advance(decision, observation(20_000), 40);
    expect(decision).toMatchObject({ status: 'wheel', deltaY: 5_829 });

    decision = advance(decision, observation(25_829), 60);
    expect(decision).toMatchObject({
      status: 'reached', reason: 'tail-reached', deltaY: null,
      state: { attempts: 3, consecutiveStalls: 0, lastScrollTop: 25_829 },
    });
  });

  it('tolerates one dropped wheel and resumes from the next fresh observation', () => {
    let decision = advance(null, observation(0), 0);
    decision = advance(decision, observation(0), 20);
    expect(decision).toMatchObject({
      status: 'wheel', state: { attempts: 2, consecutiveStalls: 1 },
    });

    decision = advance(decision, observation(10_000), 40);
    expect(decision).toMatchObject({
      status: 'wheel', state: { attempts: 3, consecutiveStalls: 0 },
    });

    decision = advance(decision, observation(25_829), 60);
    expect(decision.status).toBe('reached');
  });

  it('re-reads a growing maxScroll instead of caching a release-length ruler', () => {
    let decision = advance(null, observation(0), 0);
    decision = advance(decision, observation(10_000, 40_000), 20);
    expect(decision).toMatchObject({ status: 'wheel', deltaY: 30_000 });

    decision = advance(decision, observation(40_000, 40_000), 40);
    expect(decision).toMatchObject({
      status: 'reached', state: { lastMaxScroll: 40_000 },
    });
  });

  it('never treats a visible intermediate tail as bottom-reachable', () => {
    const first = advance(null, observation(0), 0);
    const decision = advance(first, observation(20_000, 25_829, { visible: true }), 20);
    expect(decision).toMatchObject({ status: 'wheel', reason: 'advance', deltaY: 5_829 });
    expect(decision.status).not.toBe('reached');
  });

  it('rejects an unproven initial bottom instead of passing without native input', () => {
    expect(advance(null, observation(25_829), 0)).toMatchObject({
      status: 'failed', reason: 'initial-position', deltaY: null,
      state: { attempts: 0 },
    });
  });

  it.each([
    ['page predicate false', observation(0, 25_829, { tailMatches: false }), 'tail-mismatch'],
    ['wrong exact tail', observation(0, 25_829, { tailText: `${TAIL} changed` }), 'tail-mismatch'],
    ['pointer owner drift', observation(0, 25_829, { hitOwned: false }), 'hit-owner'],
    ['impossible overscroll', observation(30_000, 25_829), 'invalid-geometry'],
  ] as const)('rejects %s independently', (_label, sample, reason) => {
    expect(advance(null, sample, 0)).toMatchObject({ status: 'failed', reason });
  });

  it('rejects invalid observations, invalid limits, and malformed prior ownership', () => {
    expect(advance(null, observation(0, 25_829, { documentToken: '' }), 0)).toMatchObject({
      status: 'failed', reason: 'invalid-observation',
    });
    expect(() => contract.advanceGuideReleaseTailNativeWheel(
      null, observation(0), 0, { expectedTailText: '', maxAttempts: 64 },
    )).toThrow(/limits/iu);

    const first = advance(null, observation(0), 0);
    expect(contract.advanceGuideReleaseTailNativeWheel(
      { ...first.state!, lastMaxScroll: -1 }, observation(10_000), 20,
      { expectedTailText: TAIL },
    )).toMatchObject({ status: 'failed', reason: 'owner-drift' });
    expect(contract.advanceGuideReleaseTailNativeWheel(
      first.state, observation(10_000, 25_829, { documentToken: 'replacement' }), 20,
      { expectedTailText: TAIL },
    )).toMatchObject({ status: 'failed', reason: 'owner-drift' });
  });

  it('keeps an at-bottom but invisible tail red', () => {
    let decision = advance(null, observation(0), 0);
    decision = advance(decision, observation(25_829, 25_829, { visible: false }), 20);
    expect(decision).toMatchObject({ status: 'wheel', deltaY: 1 });
    expect(decision.status).not.toBe('reached');
  });

  it('rejects hidden overflow immediately and bounds repeated native-wheel stalls', () => {
    expect(advance(null, observation(0, 25_829, { overflowY: 'hidden' }), 0)).toMatchObject({
      status: 'failed', reason: 'not-scrollable', deltaY: null,
    });

    const limits = { maxConsecutiveStalls: 3 } as const;
    let decision = advance(null, observation(0), 0, limits);
    decision = advance(decision, observation(0), 20, limits);
    expect(decision.status).toBe('wheel');
    decision = advance(decision, observation(0), 40, limits);
    expect(decision.status).toBe('wheel');
    decision = advance(decision, observation(0), 60, limits);
    expect(decision).toMatchObject({
      status: 'failed', reason: 'stalled', deltaY: null,
      state: { attempts: 3, consecutiveStalls: 3 },
    });
  });

  it('also bounds a progressing driver by its monotonic deadline', () => {
    const limits = { maxDurationMs: 50, maxConsecutiveStalls: 10 } as const;
    let decision = advance(null, observation(0), 0, limits);
    decision = advance(decision, observation(10_000), 50, limits);
    expect(decision).toMatchObject({ status: 'failed', reason: 'deadline', deltaY: null });
  });

  it('rejects a bottom observation that arrives after the monotonic deadline', () => {
    const limits = { maxDurationMs: 50, maxConsecutiveStalls: 10 } as const;
    let decision = advance(null, observation(0), 0, limits);
    decision = advance(decision, observation(25_829), 500, limits);
    expect(decision).toMatchObject({ status: 'failed', reason: 'deadline', deltaY: null });
  });

  it('retains an independent attempt ceiling even while every wheel advances', () => {
    const limits = { maxAttempts: 2, maxDurationMs: 4_000 } as const;
    let decision = advance(null, observation(0), 0, limits);
    decision = advance(decision, observation(1_000), 20, limits);
    expect(decision.status).toBe('wheel');
    decision = advance(decision, observation(2_000), 40, limits);
    expect(decision).toMatchObject({
      status: 'failed', reason: 'attempt-limit', deltaY: null,
      state: { attempts: 2, consecutiveStalls: 0 },
    });
  });

  it('requires exact owner, scroll, inline style, priority, and computed-style restoration', () => {
    const expected: RestorationSnapshot = {
      documentToken: 'guide-scroll-document',
      tailText: TAIL,
      scrollTop: 137,
      scrollLeft: 0,
      overflowYValue: '',
      overflowYPriority: '',
      computedOverflowY: 'auto',
    };
    expect(contract.assessGuideReleaseTailRestoration(expected, { ...expected }))
      .toEqual({ ok: true, reasons: [] });
    expect(contract.assessGuideReleaseTailRestoration(
      expected,
      { ...expected, documentToken: '' },
    )).toEqual({ ok: false, reasons: ['restoration shape'] });

    for (const [field, value] of [
      ['documentToken', 'replacement-document'],
      ['tailText', `${TAIL} changed`],
      ['scrollTop', 0],
      ['scrollLeft', 1],
      ['overflowYValue', 'auto'],
      ['overflowYPriority', 'important'],
      ['computedOverflowY', 'hidden'],
    ] as const) {
      const actual = { ...expected, [field]: value } as RestorationSnapshot;
      expect(contract.assessGuideReleaseTailRestoration(expected, actual), field)
        .toEqual({ ok: false, reasons: [field] });
    }
  });
});
