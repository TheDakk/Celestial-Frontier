import { LIMB_COUNTS } from '@cf/art-format';
import { describe, expect, it } from 'vitest';
import { checkPack } from '../tools/check-pack.mjs';
import { errorsOf, onlyScaffolds, planted, PLACEHOLDER_TEXT } from './support/placeholder-check';
import { poseSweepBudget } from './support/budget';

// A pose-sweep file: it drives the pack checker over cuts of the placeholder pack, the sturdy scaffold in each. Its tests take the pose-sweep budget, for the reason written at POSE_SWEEP_BUDGET_MS.
poseSweepBudget();

// Planted faults on cuts of the placeholder pack, in a file of their own so they run beside the scaffold groups.
/** The limbs gene for a leg count. */
const limbGene = (legs: number): number => (LIMB_COUNTS as readonly number[]).indexOf(legs);
/** The sturdy scaffold's rest pose in the placeholder pack (its only pose with this text). */
const STURDY_REST = 'pose rest\nentry torso 0 rest 0 0\nentry nearLimbs 0 rest -1 0 legs=8\n';

describe('checkPack on cuts of the placeholder catalogue, with planted faults', () => {
  it('still reports a head drawn flush against the torso again, on that scaffold only, at the shifts that open the gap', () => {
    // Cut to the sturdy scaffold and one other (the fusiform fish, the control), so the full placeholder check runs once per file.
    const cut = onlyScaffolds(PLACEHOLDER_TEXT, ['quadruped/sturdy/medium', 'fish/fusiform/medium']);
    expect(cut.match(/^scaffold /gm)).toHaveLength(2);
    const flush = planted('part quadruped/torso/sturdy/medium/v0\nframe rest anchor=0,0 attach=head:32,3,', 'part quadruped/torso/sturdy/medium/v0\nframe rest anchor=0,0 attach=head:36,3,', cut);
    const bad = checkPack(flush);
    expect(bad.ok).toBe(false);
    // The eyes and a head feature (a horn on head kinds 3 and 6) hang from the head and come loose with it.
    expect(new Set(bad.detached.map((d) => `${d.scaffold} ${d.off.filter((slot) => slot !== 'eyes' && slot !== 'headFeature').join(',')}`))).toEqual(new Set(['quadruped/sturdy/medium head']));
    expect(errorsOf(bad).filter((l) => l.startsWith('error: detached'))).toHaveLength(1);
    expect(errorsOf(bad).filter((l) => l.startsWith('error: detached head on quadruped/sturdy/medium '))).toHaveLength(1);
    // Rest has no head offset: only a +1 head shift opens the gap there.
    expect(new Set(bad.detached.filter((d) => d.pose === 'rest').map((d) => d.shift.head[0]))).toEqual(new Set([1]));
  });

  it('composes the back parts at two legs: an entry moving them off the body or naming a missing frame there is an error', () => {
    const sturdy = onlyScaffolds(PLACEHOLDER_TEXT, ['quadruped/sturdy/medium']);
    expect(sturdy.match(/^scaffold /gm)).toHaveLength(1);
    const backFinding = (l: string): boolean => /^error: (hidden part quadruped\/back\/\S+|detached back) on quadruped\/sturdy\/medium /.test(l);
    // Unplanted, the sturdy scaffold has neither: scaffold group a (tests/check-pack-placeholder-a.test.ts) has no error at all.
    const moved = checkPack(planted(STURDY_REST, `${STURDY_REST}entry back 0 rest 0 -40 legs=2\n`, sturdy));
    expect(moved.ok).toBe(false);
    expect(errorsOf(moved).filter(backFinding).length).toBeGreaterThan(0);
    const twoLegs = limbGene(2);
    expect([...moved.hidden, ...moved.detached].every((d) => d.genome['limbs'] === twoLegs && d.pose === 'rest')).toBe(true);
    const nosuch = checkPack(planted(STURDY_REST, `${STURDY_REST}entry back 0 nosuch 0 0 legs=2\n`, sturdy));
    expect(nosuch.ok).toBe(false);
    const frameGaps = errorsOf(nosuch).filter((l) => l.startsWith('error: gap frame:'));
    expect(frameGaps.length).toBeGreaterThan(0);
    expect(frameGaps.every((l) => /^error: gap frame:quadruped\/back\/[a-z]+-sturdy\/medium\/v0:nosuch \(x\d+\)$/.test(l))).toBe(true);
  });
});
