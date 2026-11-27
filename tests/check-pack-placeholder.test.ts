import { describe, expect, it } from 'vitest';
import { checkPack, formatReport } from '../tools/check-pack.mjs';
import {
  BARE, composedOf, CRAB, errorsOf, FISH, GROUPS, INSECT, PLACEHOLDER_TEXT, PLAIN_FOUR, STURDY, TENTACLED, WINGED,
} from './support/placeholder-check';
import { poseSweepBudget } from './support/budget';

// A pose-sweep file: it drives the pack checker over the whole placeholder pack. Its tests take the pose-sweep budget, for the reason written at POSE_SWEEP_BUDGET_MS.
poseSweepBudget();

// The checker on the placeholder catalogue, as a whole: everything about the pack that is not one scaffold's creatures.
// The creatures are sampled in tests/check-pack-placeholder-{a,b,c}.test.ts, one scaffold group per file, so the slow
// part runs side by side; the planted faults are in tests/check-pack-placeholder-cut.test.ts.

/** 1 sturdy, 7 other plain four-legged and 2 winged scaffolds; 5 fish and the lobster; the crab; 3 insects; 3 tentacled; 2 serpents, the jelly and 4 radials. */
const PLACEHOLDER_COMPOSED = 7 * (STURDY + 7 * PLAIN_FOUR + 2 * WINGED + 6 * FISH + CRAB + 3 * INSECT + 3 * TENTACLED + 7 * BARE);

describe('checkPack on the placeholder catalogue (the real result, pinned)', () => {
  it('the placeholder pack checks OK with no unreachable line: parses, sums up, has every attach point, pose and fallback', () => {
    // No scaffold's creatures sampled here: the summary, structure, names, palette, fallbacks and unreachable parts and
    // scaffolds are the whole pack's (checkPack's sample option leaves them as they are).
    const r = checkPack(PLACEHOLDER_TEXT, { sample: () => false });
    expect(r.parseError).toBeNull();
    expect(r.summary).toMatchObject({ parts: 288, scaffolds: 30, fallbacks: 44, colours: 60, ramps: 45, byTier: { medium: 255, small: 11, large: 11, guardian: 11 } });
    expect(r.structure).toEqual([]);
    expect(r.unreachable).toEqual([]);
    expect(r.failures).toEqual([]);
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.info).toEqual([]);
    expect(r.neck).toEqual([]);
    expect(formatReport(r).split('\n').filter((l) => l.startsWith('warning:'))).toEqual([]);
    expect(r.composed).toBe(0);
    expect(r.partial).toHaveLength(30);
    expect(formatReport(r).split('\n')[0]).toBe('check-pack: OK (partial: 30 scaffolds not sampled)');
  });

  it('the scaffold groups sample every scaffold exactly once, and their shares add up to the whole pack\'s composed count', () => {
    const scaffolds = [...PLACEHOLDER_TEXT.matchAll(/^scaffold (\S+)/gm)].map((m) => m[1]!).sort();
    const grouped = Object.values(GROUPS).flat();
    expect([...grouped].sort()).toEqual(scaffolds);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([STURDY, PLAIN_FOUR, WINGED, FISH, CRAB, INSECT, TENTACLED, BARE]).toEqual([892, 735, 740, 270, 230, 220, 26, 18]);
    expect(scaffolds.reduce((n, id) => n + composedOf(id), 0)).toBe(PLACEHOLDER_COMPOSED);
    expect(PLACEHOLDER_COMPOSED).toBe(71617);
  });
});
