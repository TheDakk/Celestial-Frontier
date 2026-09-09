import { describe, expect, it } from 'vitest';
import { composeAffine, createTwoBoneChain, IDENTITY_AFFINE, rotationAround, sampleChainWave, transformPoint,
  type Affine2, type Point2, type TwoBonePose, type TwoBoneRest } from '../tools/creature-animation/kinematics.js';

// Heterogeneous synthetic geometry exercises the mathematics, not a generated
// organism, rendered art, family adapter, real gait or universal runtime coverage.
const fixtures: Array<{ name: string; rest: TwoBoneRest }> = [
  { name: 'short planted leg', rest: { root: { x: 0, y: 0 }, joint: { x: -3, y: 4 }, end: { x: 0, y: 8 }, bend: 1 } },
  { name: 'long arm', rest: { root: { x: 13, y: -8 }, joint: { x: 39, y: 2 }, end: { x: 44, y: 33 }, bend: -1 } },
  { name: 'wide wing', rest: { root: { x: -40, y: 10 }, joint: { x: 25, y: -15 }, end: { x: 100, y: 30 }, bend: -1 } },
  { name: 'short unequal flipper', rest: { root: { x: .02, y: .04 }, joint: { x: .08, y: .025 }, end: { x: .10, y: .05 }, bend: -1 } },
  { name: 'extended synthetic limb', rest: { root: { x: 0, y: 0 }, joint: { x: 3, y: 0 }, end: { x: 5, y: 0 }, bend: 1 } },
];
const distance = (a: Point2, b: Point2) => Math.hypot(a.x - b.x, a.y - b.y);
function findings(rest: TwoBoneRest, solved: TwoBonePose, root: Point2, end: Point2): string[] {
  const result: string[] = [], upper = distance(rest.root, rest.joint), lower = distance(rest.joint, rest.end), epsilon = (upper + lower) * 1e-9;
  if (solved.root.x !== root.x || solved.root.y !== root.y || solved.end.x !== end.x || solved.end.y !== end.y) result.push('contact or root moved');
  if (Math.abs(distance(solved.root, solved.joint) - upper) > epsilon || Math.abs(distance(solved.joint, solved.end) - lower) > epsilon) result.push('segment length changed');
  const side = (solved.end.x - solved.root.x) * (solved.joint.y - solved.root.y) - (solved.end.y - solved.root.y) * (solved.joint.x - solved.root.x);
  if (Math.abs(side) > epsilon * (upper + lower) && Math.sign(side) !== rest.bend) result.push('joint bent to wrong side');
  for (const [matrix, from, to] of [[solved.upperMatrix, rest.root, solved.root], [solved.upperMatrix, rest.joint, solved.joint],
    [solved.lowerMatrix, rest.joint, solved.joint], [solved.lowerMatrix, rest.end, solved.end]] as const) {
    if (distance(transformPoint(matrix, from), to) > epsilon) result.push('rendered segment disconnected');
  }
  return result;
}

describe('generic affine parent/child geometry', () => {
  it('rotates around its declared pivot and applies parent after child', () => {
    const parent = rotationAround({ x: 2, y: 3 }, Math.PI / 2, { x: 10, y: -1 });
    const p = transformPoint(parent, { x: 3, y: 3 }); expect(p.x).toBeCloseTo(12, 12); expect(p.y).toBeCloseTo(3, 12);
    const child: Affine2 = [1, 0, 0, 1, 2, 0], combined = transformPoint(composeAffine(parent, child), { x: 1, y: 3 });
    expect(combined).toEqual(p); expect(transformPoint(composeAffine(child, parent), { x: 1, y: 3 })).not.toEqual(p);
    expect(rotationAround({ x: 20, y: 30 }, 0)).toBe(IDENTITY_AFFINE);
  });
  it('rejects malformed/nonfinite affine and point values', () => {
    for (const value of [[1, 0], [1, 0, 0, 1, NaN, 0], new Array(6)]) expect(() => composeAffine(value as unknown as Affine2, IDENTITY_AFFINE)).toThrow();
    expect(() => transformPoint(IDENTITY_AFFINE, { x: Infinity, y: 1 })).toThrow();
    expect(() => rotationAround({ x: 0, y: 0 }, NaN)).toThrow();
  });
});

describe('generic two-bone IK across heterogeneous synthetic geometry', () => {
  it.each(fixtures)('retains contacts, lengths, bend side and connected transforms: $name', ({ rest }) => {
    const original = JSON.stringify(rest), chain = createTwoBoneChain(rest), settled = chain.rest();
    expect(chain.solve(rest.root, rest.end)).toBe(settled); expect(settled.joint).toEqual(rest.joint);
    expect(settled.upperMatrix).toBe(IDENTITY_AFFINE); expect(settled.lowerMatrix).toBe(IDENTITY_AFFINE);
    for (let i = 0; i <= 180; i++) {
      const angle = i / 180 * Math.PI * 2, max = chain.lengths.upper + chain.lengths.lower, min = Math.abs(chain.lengths.upper - chain.lengths.lower);
      const reach = min + (max - min) * (.3 + .6 * Math.sin(angle) ** 2);
      const root = { x: rest.root.x + max * .12 * Math.sin(angle), y: rest.root.y + max * .08 * Math.cos(angle) };
      const end = { x: root.x + reach * Math.cos(angle), y: root.y + reach * Math.sin(angle) };
      const posed = chain.solve(root, end); expect(findings(rest, posed, root, end), JSON.stringify({ rest, root, end, posed })).toEqual([]);
    }
    expect(JSON.stringify(rest)).toBe(original); expect(chain.solve(rest.root, rest.end)).toBe(settled);
  });
  it('detaches its rest geometry from later caller edits', () => {
    const input = { root: { x: 0, y: 0 }, joint: { x: -3, y: 4 }, end: { x: 0, y: 8 }, bend: 1 as const };
    const chain = createTwoBoneChain(input); input.joint.x = 100;
    expect(chain.rest().joint.x).toBe(-3); expect(Object.isFrozen(chain.rest().joint)).toBe(true);
  });
  it('refuses degenerate, contradictory and unreachable targets instead of sliding the endpoint', () => {
    const valid = fixtures[0]!.rest;
    for (const rest of [{ ...valid, joint: valid.root }, { ...valid, end: valid.root }, { ...valid, bend: -1 },
      { ...valid, joint: { x: NaN, y: 4 } }, { ...valid, root: { x: 1e7, y: 0 } }]) expect(() => createTwoBoneChain(rest as TwoBoneRest)).toThrow();
    const chain = createTwoBoneChain(fixtures[4]!.rest);
    for (const end of [{ x: 6, y: 0 }, { x: .5, y: 0 }, { x: 0, y: 0 }, { x: Infinity, y: 0 }]) expect(() => chain.solve({ x: 0, y: 0 }, end)).toThrow();
    expect(chain.solve({ x: 0, y: 0 }, { x: 5, y: 0 }).end).toEqual({ x: 5, y: 0 });
  });
  it('the same outcome ruler rejects stretched, mirrored, detached and shifted-contact mutations', () => {
    const rest = fixtures[0]!.rest, chain = createTwoBoneChain(rest), root = { x: 1, y: 0 }, end = { x: 1, y: 7 };
    const good = chain.solve(root, end); expect(findings(rest, good, root, end)).toEqual([]);
    const mutations: Array<{ value: TwoBonePose; finding: string }> = [
      { value: { ...good, joint: { x: good.joint.x - 2, y: good.joint.y } }, finding: 'segment length changed' },
      { value: { ...good, joint: { x: 2 * root.x - good.joint.x, y: good.joint.y } }, finding: 'joint bent to wrong side' },
      { value: { ...good, upperMatrix: IDENTITY_AFFINE }, finding: 'rendered segment disconnected' },
      { value: { ...good, end: { x: end.x + .1, y: end.y } }, finding: 'contact or root moved' },
    ];
    for (const mutation of mutations) expect(findings(rest, mutation.value, root, end)).toContain(mutation.finding);
    expect(findings(rest, chain.solve(root, end), root, end)).toEqual([]);
  });
});

describe('finite continuous chain waves, without a family or runtime claim', () => {
  const chains: Array<{ name: string; points: Point2[] }> = [
    { name: 'single arm segment', points: [{ x: 0, y: 0 }, { x: 30, y: 50 }] },
    { name: 'bent wing', points: [{ x: -20, y: 0 }, { x: 35, y: -15 }, { x: 70, y: 10 }, { x: 100, y: 8 }] },
    { name: 'short flipper', points: [{ x: 1, y: 2 }, { x: 1.4, y: 2.2 }, { x: 1.65, y: 2.1 }] },
    { name: 'curved tail', points: [{ x: 50, y: 10 }, { x: 30, y: 35 }, { x: 12, y: 50 }, { x: -5, y: 45 }, { x: -20, y: 30 }] },
  ];
  const base = { elapsedMs: 500, durationMs: 1800, amplitude: .3, cycles: 1.5, phaseLag: .45, enabled: true };
  it.each(chains)('preserves root, every segment length, continuity and exact finite rest: $name', ({ points }) => {
    const original = JSON.stringify(points), lengths = points.slice(1).map((p, i) => distance(points[i]!, p)), total = lengths.reduce((a, b) => a + b, 0);
    let previous = sampleChainWave(points, { ...base, elapsedMs: 0 }), maximumTravel = 0;
    for (let elapsedMs = 1; elapsedMs <= 1800; elapsedMs++) {
      const posed = sampleChainWave(points, { ...base, elapsedMs }); expect(posed.points[0]).toEqual(points[0]);
      posed.points.slice(1).forEach((p, i) => {
        expect(Math.abs(distance(posed.points[i]!, p) - lengths[i]!)).toBeLessThan(total * 1e-10);
        expect(distance(transformPoint(posed.matrices[i]!, points[i + 1]!), p)).toBeLessThan(total * 1e-10);
        expect(distance(previous.points[i + 1]!, p)).toBeLessThan(total * .03);
        maximumTravel = Math.max(maximumTravel, distance(points[i + 1]!, p));
      }); previous = posed;
    }
    expect(maximumTravel).toBeGreaterThan(total * .01); expect(previous.points).toEqual(points);
    for (const sample of [{ ...base, elapsedMs: 0 }, { ...base, elapsedMs: 1800 }, { ...base, elapsedMs: 1e9 }, { ...base, enabled: false }, { ...base, amplitude: 0 }]) {
      const rest = sampleChainWave(points, sample); expect(rest.points).toEqual(points); expect(rest.matrices.every(m => m === IDENTITY_AFFINE)).toBe(true);
    }
    expect(distance(sampleChainWave(points, { ...base, elapsedMs: 1 }).points.at(-1)!, points.at(-1)!)).toBeLessThan(total * 1e-7);
    expect(distance(sampleChainWave(points, { ...base, elapsedMs: 1799 }).points.at(-1)!, points.at(-1)!)).toBeLessThan(total * 1e-7);
    expect(JSON.stringify(points)).toBe(original); expect(sampleChainWave(points, base)).toEqual(sampleChainWave(points, base));
  });
  it('rejects malformed geometry and finite-domain violations even with motion disabled', () => {
    for (const points of [[], [{ x: 0, y: 0 }], [{ x: 0, y: 0 }, { x: 0, y: 0 }], new Array(3), Array.from({ length: 65 }, (_, x) => ({ x, y: 0 }))]) expect(() => sampleChainWave(points, base)).toThrow();
    for (const mutation of [{ elapsedMs: NaN }, { elapsedMs: -1 }, { durationMs: 0 }, { durationMs: Infinity }, { amplitude: 2 }, { cycles: 9 }, { phaseLag: 4 }]) {
      expect(() => sampleChainWave(chains[1]!.points, { ...base, ...mutation, enabled: false })).toThrow();
    }
  });
});
