/** Small renderer-free mathematical primitives, not runtime family integration.
 * Geometry and capabilities must come from the selected anatomy owner. No
 * genome, named animal, body-plan selector, asset, clock, RNG or scheduler. */
export interface Point2 { readonly x: number; readonly y: number; }
/** [a,b,c,d,tx,ty]: x'=a*x+c*y+tx, y'=b*x+d*y+ty. */
export type Affine2 = readonly [number, number, number, number, number, number];
export const IDENTITY_AFFINE: Affine2 = Object.freeze([1, 0, 0, 1, 0, 0]);
export const KINEMATICS_LIMITS = Object.freeze({ maxCoordinate: 1_000_000, minSegment: .000001,
  maxChainPoints: 64, maxDurationMs: 60_000, maxWaveCycles: 8 });
const ZERO = Object.freeze({ x: 0, y: 0 });
function finite(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(label + ' must be finite');
}
function point(value: Point2): Point2 {
  if (!value || typeof value !== 'object') throw new TypeError('point required');
  finite(value.x, 'point x'); finite(value.y, 'point y');
  if (Math.abs(value.x) > KINEMATICS_LIMITS.maxCoordinate || Math.abs(value.y) > KINEMATICS_LIMITS.maxCoordinate) throw new RangeError('point exceeds coordinate bound');
  return Object.freeze({ x: value.x, y: value.y });
}
function affine(value: Affine2): void {
  if (!Array.isArray(value) || value.length !== 6) throw new TypeError('six affine coefficients required');
  for (let i = 0; i < 6; i++) finite(value[i]!, 'affine coefficient');
}
export function transformPoint(matrix: Affine2, input: Point2): Point2 {
  affine(matrix); const p = point(input);
  return point({ x: matrix[0] * p.x + matrix[2] * p.y + matrix[4], y: matrix[1] * p.x + matrix[3] * p.y + matrix[5] });
}
export function composeAffine(parent: Affine2, local: Affine2): Affine2 {
  affine(parent); affine(local);
  const result: Affine2 = [parent[0] * local[0] + parent[2] * local[1], parent[1] * local[0] + parent[3] * local[1],
    parent[0] * local[2] + parent[2] * local[3], parent[1] * local[2] + parent[3] * local[3],
    parent[0] * local[4] + parent[2] * local[5] + parent[4], parent[1] * local[4] + parent[3] * local[5] + parent[5]];
  affine(result); return Object.freeze(result);
}
export function rotationAround(pivot: Point2, radians: number, offset: Point2 = ZERO): Affine2 {
  const p = point(pivot), move = point(offset); finite(radians, 'rotation');
  if (radians === 0 && move.x === 0 && move.y === 0) return IDENTITY_AFFINE;
  const c = Math.cos(radians), s = Math.sin(radians);
  const matrix: Affine2 = [c, s, -s, c, p.x - c * p.x + s * p.y + move.x, p.y - s * p.x - c * p.y + move.y];
  return Object.freeze(matrix);
}
/** Uniform scale about a pivot (the morph system's M1: a sub-tree grows or shrinks about its root joint). */
export function scaleAround(pivot: Point2, scale: number): Affine2 {
  const p = point(pivot); finite(scale, 'scale'); if (!(scale > 0)) throw new RangeError('scale must be positive');
  if (scale === 1) return IDENTITY_AFFINE;
  const matrix: Affine2 = [scale, 0, 0, scale, p.x - scale * p.x, p.y - scale * p.y];
  return Object.freeze(matrix);
}
const length = (a: Point2, b: Point2): number => Math.hypot(b.x - a.x, b.y - a.y);
const same = (a: Point2, b: Point2): boolean => a.x === b.x && a.y === b.y;
function segment(a: Point2, b: Point2): number {
  const value = length(a, b);
  if (value < KINEMATICS_LIMITS.minSegment) throw new RangeError('degenerate chain segment');
  return value;
}
export interface TwoBoneRest { readonly root: Point2; readonly joint: Point2; readonly end: Point2; readonly bend: 1 | -1; }
export interface TwoBonePose {
  readonly root: Point2; readonly joint: Point2; readonly end: Point2;
  readonly upperMatrix: Affine2; readonly lowerMatrix: Affine2;
}
/** A bend sign selects the side of root→end occupied by the joint. A fully
 * extended rest chain needs that explicit sign; the solver never guesses a limb.
 * Unreachable targets are rejected rather than moving a requested fixed contact. */
export function createTwoBoneChain(input: TwoBoneRest) {
  if (!input || (input.bend !== 1 && input.bend !== -1)) throw new TypeError('explicit bend sign required');
  const root = point(input.root), joint = point(input.joint), end = point(input.end), bend = input.bend;
  const upper = segment(root, joint), lower = segment(joint, end), distance = segment(root, end);
  const side = (end.x - root.x) * (joint.y - root.y) - (end.y - root.y) * (joint.x - root.x);
  const tolerance = (upper + lower) * 1e-10;
  if (Math.abs(side) > tolerance * (upper + lower) && Math.sign(side) !== bend) throw new RangeError('bend sign contradicts rest geometry');
  if (distance <= Math.abs(upper - lower) + tolerance) throw new RangeError('folded rest chain has no stable direction');
  const rest: TwoBonePose = Object.freeze({ root, joint, end, upperMatrix: IDENTITY_AFFINE, lowerMatrix: IDENTITY_AFFINE });
  return Object.freeze({ lengths: Object.freeze({ upper, lower }), rest: () => rest,
    solve(targetRoot: Point2, targetEnd: Point2): TwoBonePose {
      const r = point(targetRoot), e = point(targetEnd);
      if (same(r, root) && same(e, end)) return rest;
      const d = length(r, e), min = Math.abs(upper - lower), max = upper + lower;
      if (d < KINEMATICS_LIMITS.minSegment || d < min || d > max) throw new RangeError('target outside two-bone reach');
      const ux = (e.x - r.x) / d, uy = (e.y - r.y) / d;
      const along = (upper * upper - lower * lower + d * d) / (2 * d);
      const altitude = Math.sqrt(Math.max(0, upper * upper - along * along));
      const j = point({ x: r.x + ux * along - uy * altitude * bend, y: r.y + uy * along + ux * altitude * bend });
      const upperAngle = Math.atan2(j.y - r.y, j.x - r.x) - Math.atan2(joint.y - root.y, joint.x - root.x);
      const lowerAngle = Math.atan2(e.y - j.y, e.x - j.x) - Math.atan2(end.y - joint.y, end.x - joint.x);
      return Object.freeze({ root: r, joint: j, end: e,
        upperMatrix: rotationAround(root, upperAngle, { x: r.x - root.x, y: r.y - root.y }),
        lowerMatrix: rotationAround(joint, lowerAngle, { x: j.x - joint.x, y: j.y - joint.y }) });
    },
  });
}
export interface ChainWaveSample {
  readonly elapsedMs: number; readonly durationMs: number; readonly amplitude: number;
  readonly cycles: number; readonly phaseLag: number; readonly enabled: boolean;
}
/** Finite travelling joint rotation, suitable as a primitive for a caller-owned
 * arm/wing/flipper/tail chain. It does not select anatomically appropriate motion.
 * The C2 envelope has zero velocity/acceleration at the finite endpoints. Root
 * and segment lengths are retained; collision/skin/occlusion are adapter duties. */
export function sampleChainWave(restInput: readonly Point2[], sample: ChainWaveSample) {
  if (!Array.isArray(restInput) || restInput.length < 2 || restInput.length > KINEMATICS_LIMITS.maxChainPoints) throw new RangeError('chain point count outside capacity');
  const rest = Array.from(restInput, point);
  for (let i = 1; i < rest.length; i++) segment(rest[i - 1]!, rest[i]!);
  if (!sample || typeof sample.enabled !== 'boolean') throw new TypeError('explicit wave policy required');
  for (const key of ['elapsedMs', 'durationMs', 'amplitude', 'cycles', 'phaseLag'] as const) finite(sample[key], key);
  if (sample.elapsedMs < 0 || sample.durationMs <= 0 || sample.durationMs > KINEMATICS_LIMITS.maxDurationMs
    || Math.abs(sample.amplitude) > Math.PI / 2 || sample.cycles < 0 || sample.cycles > KINEMATICS_LIMITS.maxWaveCycles
    || Math.abs(sample.phaseLag) > Math.PI) throw new RangeError('wave sample outside finite domain');
  const settled = !sample.enabled || sample.elapsedMs === 0 || sample.elapsedMs >= sample.durationMs || sample.amplitude === 0;
  if (settled) return Object.freeze({ points: Object.freeze(rest), matrices: Object.freeze(rest.slice(1).map(() => IDENTITY_AFFINE)),
    localAngles: Object.freeze(rest.slice(1).map(() => 0)), settled: true });
  const t = sample.elapsedMs / sample.durationMs, envelope = 64 * t ** 3 * (1 - t) ** 3;
  const points: Point2[] = [rest[0]!], matrices: Affine2[] = [], localAngles: number[] = [];
  let parent = IDENTITY_AFFINE;
  for (let i = 0; i < rest.length - 1; i++) {
    const angle = sample.amplitude * envelope * Math.sin(2 * Math.PI * sample.cycles * t - sample.phaseLag * i);
    parent = composeAffine(parent, rotationAround(rest[i]!, angle));
    matrices.push(parent); localAngles.push(angle); points.push(transformPoint(parent, rest[i + 1]!));
  }
  return Object.freeze({ points: Object.freeze(points), matrices: Object.freeze(matrices), localAngles: Object.freeze(localAngles), settled: false });
}
