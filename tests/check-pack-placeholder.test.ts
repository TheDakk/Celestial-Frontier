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
 * The recipes the placeholder pack samples for one scaffold, by SAMPLED (each composed in the scaffold's 7 poses; a shift
 * is drawn as a label picture, never composed). `first` is the first state: H head kinds x T tail options x L leg counts,
 * plus each head at its E eye counts but eight (drawn already), then per head 7 patterns, 1 translucent and 7 back skins
 * at each of B leg counts, and the shift sweep at each of K leg counts (each head alone, then max(H, R) head and tail
 * pairs, R the tail kinds with a part). A `later` state: max(H, T) head and tail pairs x L leg counts, then for the first
 * head only 7 patterns, 1 translucent and 7 back skins x B, and the same shift sweep.
 */
const recipes = (s: { H: number; T: number; R: number; L: number; E: number; B: number; K: number }, later = false): number => later
  ? Math.max(s.H, s.T) * s.L + 7 + 1 + 7 * s.B + (s.H + (s.R > 0 ? Math.max(s.H, s.R) : 0)) * s.K
  : s.H * s.T * s.L + s.H * s.E + s.H * (7 + 1 + 7 * s.B) + (s.H + (s.R > 0 ? Math.max(s.H, s.R) : 0)) * s.K;
/**
 * A four-legged body: 10 heads, tails t0 to t6, 6 leg counts, 5 eye counts beside eight; on land, then airborne (sails).
 * The sturdy scaffold also draws 2 and 8 legs differently (legs= entries, near0_2), so B = 2 (8 and 2 legs) and K = 3
 * (no legs, 2, 8). A winged body airborne folds to 2 legs or none (L = 2), and in water has none (L = 1).
 */
const FOUR = { H: 10, T: 7, R: 7, L: 6, E: 5, B: 1, K: 1 };
const STURDY = recipes({ ...FOUR, B: 2, K: 3 }) + recipes({ ...FOUR, B: 2, K: 3 }, true);
const PLAIN_FOUR = recipes(FOUR) + recipes(FOUR, true);
const WINGED = recipes(FOUR) + recipes({ ...FOUR, L: 2 }, true) + recipes({ ...FOUR, L: 1 }, true);
/** A fish and a lobster: 10 heads, no tail or t2 t3 t5 t6, no legs, eye counts; a crab draws no gene eyes (E = 1: eyes gene 0, a key of its own). */
const FISH = recipes({ H: 10, T: 5, R: 4, L: 1, E: 5, B: 1, K: 1 });
const CRAB = recipes({ H: 10, T: 5, R: 4, L: 1, E: 1, B: 1, K: 1 });
/** An insect: 10 heads, no tail, six legs always. A tentacled body: no head part, its own tails. The rest: no head, tail or legs. */
const INSECT = recipes({ H: 10, T: 1, R: 0, L: 1, E: 5, B: 1, K: 1 });
const TENTACLED = recipes({ H: 1, T: 5, R: 4, L: 1, E: 1, B: 1, K: 1 });
const BARE = recipes({ H: 1, T: 1, R: 0, L: 1, E: 1, B: 1, K: 1 });
/** 1 sturdy, 7 other plain four-legged and 2 winged scaffolds; 5 fish and the lobster; the crab; 3 insects; 3 tentacled; 2 serpents, the jelly and 4 radials. */
const PLACEHOLDER_COMPOSED = 7 * (STURDY + 7 * PLAIN_FOUR + 2 * WINGED + 6 * FISH + CRAB + 3 * INSECT + 3 * TENTACLED + 7 * BARE);
/** The pack text with only the named scaffolds kept; every part and fallback stays. */
const onlyScaffolds = (text: string, keep: readonly string[]): string =>
  text.split('\n\n').filter((block) => { const m = /^scaffold (\S+)/.exec(block.trimStart()); return m === null || keep.includes(m[1]!); }).join('\n\n');
/** The sturdy scaffold's rest pose in the placeholder pack (its only pose with this text). */
const STURDY_REST = 'pose rest\nentry torso 0 rest 0 0\nentry nearLimbs 0 rest -1 0 legs=8\n';

describe('checkPack on the placeholder catalogue (the real result, pinned)', () => {
  let text: string;
  let r: PackReport;
  // A hang guard only, as testTimeout is: the whole placeholder check composes every routed body (about 16 s alone).
  beforeAll(() => { text = readFileSync(PLACEHOLDER, 'utf8'); r = checkPack(text); }, 60_000);

  it('passes clean: parses, sums up, has every attach point, pose and fallback, never touches the edge, nothing comes loose', () => {
    expect(r.parseError).toBeNull();
    expect(r.summary).toMatchObject({ parts: 288, scaffolds: 30, fallbacks: 44, colours: 60, ramps: 45, byTier: { medium: 255, small: 11, large: 11, guardian: 11 } });
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
    expect([STURDY, PLAIN_FOUR, WINGED, FISH, CRAB, INSECT, TENTACLED, BARE]).toEqual([892, 735, 740, 270, 230, 220, 26, 18]);
    expect(r.composed).toBe(PLACEHOLDER_COMPOSED);
    expect(r.info).toEqual([]);
  });

  it('a translucent creature meets a skin: information gap on every torso frame without a translucent layer: all but the sturdy torso, and no radial (it has no skin)', () => {
    const skinGaps = r.gaps.filter((g) => g.gap.startsWith('skin:'));
    expect(skinGaps.every((g) => !g.error)).toBe(true);
    const torsos = skinGaps.map((g) => g.gap.replace(/^skin:/, '').replace(/\/medium\/v0:rest$/, '')).sort();
    const expected = [...text.matchAll(/^scaffold ([a-z]+)\/([a-z]+)\/medium/gm)].map((m) => `${m[1]}/torso/${m[2]}`)
      .filter((id) => id !== 'quadruped/torso/sturdy' && !id.startsWith('radial/')).sort();
    expect(torsos).toEqual(expected);
    expect(torsos).toHaveLength(25);
  });

  it('still reports a head drawn flush against the torso again, on that scaffold only, at the shifts that open the gap', () => {
    // Cut to the sturdy scaffold and one other (the fusiform fish, the control), so the full placeholder check runs once per file.
    const cut = onlyScaffolds(text, ['quadruped/sturdy/medium', 'fish/fusiform/medium']);
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
