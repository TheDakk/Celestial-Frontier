import { readFileSync } from 'node:fs';
import { LIMB_COUNTS } from '@cf/art-format';
import { beforeAll, describe, expect, it } from 'vitest';
import { checkPack, formatReport, type PackReport } from '../tools/check-pack.mjs';

// The checker on the placeholder catalogue: the slowest check, in its own file so it runs beside the planted-fault tests
// in tests/check-pack.test.ts.
const PLACEHOLDER = new URL('../packages/art-testparts/src/quadruped.txt', import.meta.url);

/** The text with one exact piece replaced; fails the test if the piece is not there exactly once. */
function planted(from: string, to: string, base: string): string {
  expect(base.split(from)).toHaveLength(2);
  return base.replace(from, to);
}
const errorsOf = (report: PackReport): string[] => formatReport(report).split('\n').filter((l) => l.startsWith('error:'));
/** The limbs gene for a leg count. */
const limbGene = (legs: number): number => (LIMB_COUNTS as readonly number[]).indexOf(legs);

/**
 * What the placeholder pack composes: 20580 for the base sample and the no-legs shift sweep, plus the mark and back-part
 * sweep (6 scaffolds x 10 head kinds x (7 patterns + 7 skins) x 7 poses = 5880), plus the shift sweep again on the sturdy
 * scaffold at 2 and 8 legs (its legs= entries and near0_2) (2 leg counts x (10 heads alone + 10 head and tail pairs) x 7 poses = 280),
 * plus the back-part skins again on the sturdy scaffold at two legs (10 heads x 7 skins x 7 poses = 490).
 */
const PLACEHOLDER_COMPOSED = 20580 + 5880 + 280 + 490;
/** The pack text with only the named scaffolds kept; every part and fallback stays. */
const onlyScaffolds = (text: string, keep: readonly string[]): string =>
  text.split('\n\n').filter((block) => { const m = /^scaffold (\S+)/.exec(block.trimStart()); return m === null || keep.includes(m[1]!); }).join('\n\n');
/** The sturdy scaffold's rest pose in the placeholder pack (its only pose with this text). */
const STURDY_REST = 'pose rest\nentry torso 0 rest 0 0\nentry nearLimbs 0 rest -1 0 legs=8\n';

describe('checkPack on the placeholder catalogue (the real result, pinned)', () => {
  let text: string;
  let r: PackReport;
  beforeAll(() => { text = readFileSync(PLACEHOLDER, 'utf8'); r = checkPack(text); });

  it('passes clean: parses, sums up, has every attach point, pose and fallback, never touches the edge, nothing comes loose', () => {
    expect(r.parseError).toBeNull();
    expect(r.summary).toMatchObject({ parts: 153, scaffolds: 6, fallbacks: 60, colours: 16, ramps: 42, byTier: { medium: 108, small: 15, large: 15, guardian: 15 } });
    expect(r.structure).toEqual([]);
    expect(r.unreachable).toEqual([]);
    expect(r.failures).toEqual([]);
    expect(r.edge).toEqual([]);
    expect(r.detached).toEqual([]);
    expect(r.hidden).toEqual([]);
    expect(r.gaps.filter((g) => g.error)).toEqual([]);
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.neck).toEqual([]);
    expect(formatReport(r).split('\n').filter((l) => l.startsWith('warning:'))).toEqual([]);
    expect(r.composed).toBe(PLACEHOLDER_COMPOSED);
  });

  it('still reports a head drawn flush against the torso again, on that scaffold only, at the shifts that open the gap', () => {
    // Cut to the sturdy scaffold and one other (armored, the control), so the full placeholder check runs once per file.
    const cut = onlyScaffolds(text, ['quadruped/sturdy/medium', 'quadruped/armored/medium']);
    expect(cut.match(/^scaffold /gm)).toHaveLength(2);
    const flush = planted('part quadruped/torso/sturdy/medium/v0\nframe rest anchor=0,0 attach=head:32,3,', 'part quadruped/torso/sturdy/medium/v0\nframe rest anchor=0,0 attach=head:36,3,', cut);
    const bad = checkPack(flush);
    expect(bad.ok).toBe(false);
    expect(new Set(bad.detached.map((d) => `${d.scaffold} ${d.off.filter((slot) => slot !== 'eyes').join(',')}`))).toEqual(new Set(['quadruped/sturdy/medium head']));
    expect(errorsOf(bad).filter((l) => l.startsWith('error: detached head on quadruped/sturdy/medium '))).toHaveLength(1);
    // Rest has no head offset: only a +1 head shift opens the gap there.
    expect(new Set(bad.detached.filter((d) => d.pose === 'rest').map((d) => d.shift.head[0]))).toEqual(new Set([1]));
  });

  it('composes the back parts at two legs: an entry moving them off the body or naming a missing frame there is an error', () => {
    const sturdy = onlyScaffolds(text, ['quadruped/sturdy/medium']);
    expect(sturdy.match(/^scaffold /gm)).toHaveLength(1);
    const backFinding = (l: string): boolean => /^error: (hidden part quadruped\/back\/\S+|detached back) on quadruped\/sturdy\/medium /.test(l);
    // The whole pack, unplanted, has neither (pinned above too).
    expect(errorsOf(r).filter(backFinding)).toEqual([]);
    expect(errorsOf(r).filter((l) => l.startsWith('error: gap frame:'))).toEqual([]);
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
