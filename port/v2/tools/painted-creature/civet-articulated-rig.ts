/** Local one-view articulation study. This skins the existing connected painted
 * projection; it does not create hidden anatomy, a walking cycle or a 3D animal.
 * No clock, RNG, renderer, scheduling, cache, gameplay or asset mutation owner. */
import { createCivetMesh as createOriginalMesh, isPaintedCivetIdentity,
  CIVET_SOURCE_GENOME_JSON, type CivetMeshData as OriginalMeshData }
  from './civet-rig.js';
export { isPaintedCivetIdentity, CIVET_SOURCE_GENOME_JSON };

export const CIVET_RIG_VERSION = 'cf.painted-civet.articulated-study.v1' as const;
export const CIVET_COLUMNS = 48;
export const CIVET_ROWS = 32;
export const CIVET_CLIP_MS = Object.freeze({ rest: 0, breathe: 6000, strike: 1600, recoil: 1100 });
export type CivetClip = keyof typeof CIVET_CLIP_MS;
export type CivetPose = Readonly<{ breath: number; drive: number; tail: number }>;
const REST: CivetPose = Object.freeze({ breath: 0, drive: 0, tail: 0 });
export const CIVET_CAPACITY = Object.freeze({ vertices: 1617, triangles: 3072,
  vertexScalars: 3234, indexScalars: 9216, bones: 12, matrixScalars: 72,
  // Three Float32 vertex buffers, one Uint32 topology, one Float64 matrix scratch.
  ownedTypedArrayBytes: 76248 });
/** Source-pixel normalized landmarks measured on the selected 768×512 painting.
 * The left tail is distinct from the four paw support rectangles, whose first
 * intersecting mesh column is 16/48. Lock whole supporting triangles, not merely
 * sampled solid pixels. The tail below .75 must remain free left of that column. */
export const CIVET_SKIN = Object.freeze({ sourceWidth: 768, sourceHeight: 512,
  footLockX: 1 / 3, footLockY: .75, footBlendX: .27, footBlendY: .64,
  neckPivotX: .69, neckPivotY: .40, headStartX: .64, headRigidX: .77,
  tailRootX: .30, tailRootY: .44, tailMidX: .215, tailMidY: .56,
  tailTipJointX: .12, tailTipJointY: .69 });
export const CIVET_REVIEW_TIMES = Object.freeze({ breatheInhale1: 1500, breatheExhale: 3000,
  breatheInhale2: 4500, strikeAnticipation: 448, strikeThrust: 864, recoilPeak: 308 });

const clamp = (x: number): number => Math.max(0, Math.min(1, x));
const smooth = (lo: number, hi: number, x: number): number => {
  const t = clamp((x - lo) / (hi - lo)); return t * t * (3 - 2 * t);
};
function track(t: number, keys: readonly (readonly [number, number])[]): number {
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]!, b = keys[i]!;
    if (t <= b[0]) return a[1] + (b[1] - a[1]) * smooth(a[0], b[0], t);
  }
  return 0;
}
const STRIKE = Object.freeze([[0, 0], [.28, -.85], [.54, 1], [.78, -.22], [1, 0]] as const);
const RECOIL = Object.freeze([[0, 0], [.28, -.85], [.65, .15], [1, 0]] as const);
export function sampleCivetPose(clip: CivetClip, elapsedMs: number,
  policy: Readonly<{ effectsOn: boolean; fullMotion: boolean; visible: boolean }>): CivetPose {
  if (!Object.hasOwn(CIVET_CLIP_MS, clip) || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new TypeError('invalid finite articulated Civet clip sample');
  }
  if (!policy.effectsOn || !policy.fullMotion || !policy.visible || clip === 'rest') return REST;
  const duration = CIVET_CLIP_MS[clip];
  if (elapsedMs === 0 || elapsedMs >= duration) return REST;
  const t = elapsedMs / duration;
  if (clip === 'breathe') return { breath: Math.sin(2 * Math.PI * t) ** 2, drive: 0,
    tail: .25 * Math.sin(Math.PI * t) ** 2 * Math.sin(4 * Math.PI * t - .5) };
  const drive = track(t, clip === 'strike' ? STRIKE : RECOIL);
  return { breath: 0, drive, tail: -drive * .65 };
}
function validPose(pose: CivetPose): void {
  if (!Number.isFinite(pose.breath) || !Number.isFinite(pose.drive) || !Number.isFinite(pose.tail)
    || pose.breath < 0 || pose.breath > 1 || Math.abs(pose.drive) > 1 || Math.abs(pose.tail) > 1) {
    throw new TypeError('invalid articulated Civet pose');
  }
}

// Matrix convention [a,b,c,d,tx,ty]. Rotations use source-pixel aspect, so a
// painted head or tail segment rotates in the 768×512 image's metric.
function rotation(out: Float64Array, index: number, x: number, y: number, angle: number, dx = 0, dy = 0): void {
  const k = index * 6, a = Math.cos(angle), b = Math.sin(angle) * 1.5, c = -Math.sin(angle) / 1.5;
  out[k] = a; out[k + 1] = b; out[k + 2] = c; out[k + 3] = a;
  out[k + 4] = x - a * x - c * y + dx; out[k + 5] = y - b * x - a * y + dy;
}
/** Child matrix is composed in its parent's local frame; joints inherit their
 * ancestor's rotation/translation instead of independently sliding image strips. */
function inherit(out: Float64Array, child: number, parent: number): void {
  const c = child * 6, p = parent * 6;
  const a = out[c]!, b = out[c + 1]!, cc = out[c + 2]!, d = out[c + 3]!, x = out[c + 4]!, y = out[c + 5]!;
  out[c] = out[p]! * a + out[p + 2]! * b; out[c + 1] = out[p + 1]! * a + out[p + 3]! * b;
  out[c + 2] = out[p]! * cc + out[p + 2]! * d; out[c + 3] = out[p + 1]! * cc + out[p + 3]! * d;
  out[c + 4] = out[p]! * x + out[p + 2]! * y + out[p + 4]!;
  out[c + 5] = out[p + 1]! * x + out[p + 3]! * y + out[p + 5]!;
}
// Hip/knee and shoulder/knee pairs for the four visible limbs, back to front.
const LIMBS = Object.freeze([
  Object.freeze({ x: .385, y: .52, kneeX: .370, kneeY: .675, upper: .10, lower: -.17 }),
  Object.freeze({ x: .433, y: .57, kneeX: .435, kneeY: .700, upper: -.075, lower: .14 }),
  Object.freeze({ x: .568, y: .54, kneeX: .576, kneeY: .695, upper: -.075, lower: .15 }),
  Object.freeze({ x: .620, y: .49, kneeX: .637, kneeY: .675, upper: -.10, lower: .19 }),
]);
function prepare(out: Float64Array, pose: CivetPose): void {
  const crouch = Math.max(0, -pose.drive), thrust = Math.max(0, pose.drive);
  // Bone0 is the neck. Four limb chains use1..8; the tail hierarchy uses9..11.
  rotation(out, 0, .69, .40, -.055 * pose.drive - .012 * pose.breath,
    .033 * pose.drive, .013 * crouch - .008 * thrust - .006 * pose.breath);
  for (let i = 0; i < LIMBS.length; i++) {
    const limb = LIMBS[i]!, upper = 1 + i * 2, lower = upper + 1;
    const effort = crouch - thrust * .6;
    rotation(out, upper, limb.x, limb.y, limb.upper * effort);
    rotation(out, lower, limb.kneeX, limb.kneeY, limb.lower * effort); inherit(out, lower, upper);
  }
  rotation(out, 9, .30, .44, .045 * pose.tail, .007 * pose.drive, .011 * crouch - .006 * pose.breath);
  rotation(out, 10, .215, .56, .085 * pose.tail); inherit(out, 10, 9);
  rotation(out, 11, .12, .69, .14 * pose.tail); inherit(out, 11, 10);
}
function deltaX(bones: Float64Array, bone: number, x: number, y: number): number {
  const k = bone * 6; return bones[k]! * x + bones[k + 2]! * y + bones[k + 4]! - x;
}
function deltaY(bones: Float64Array, bone: number, x: number, y: number): number {
  const k = bone * 6; return bones[k + 1]! * x + bones[k + 3]! * y + bones[k + 5]! - y;
}
function writePoint(out: Float32Array | Float64Array, offset: number, x: number, y: number,
  pose: CivetPose, bones: Float64Array): void {
  if ((!pose.breath && !pose.drive && !pose.tail) || (x >= 1 / 3 && y >= .75)) {
    out[offset] = x; out[offset + 1] = y; return;
  }
  const planted = 1 - smooth(.27, 1 / 3, x) * smooth(.64, .75, y);
  const body = smooth(.22, .34, x) * (1 - smooth(.72, .80, x));
  const head = smooth(.64, .77, x);
  const crouch = Math.max(0, -pose.drive), thrust = Math.max(0, pose.drive);
  let dx = (.011 * pose.drive + .010 * pose.breath * (x - .5)) * body;
  let dy = (.022 * crouch - .008 * thrust - .020 * pose.breath * (1 - smooth(.54, .70, y))) * body;
  let jointX = 0, jointY = 0, totalWeight = 0;
  for (let i = 0; i < LIMBS.length; i++) {
    const limb = LIMBS[i]!, axisX = limb.x + (limb.kneeX - limb.x) * clamp((y - limb.y) / (limb.kneeY - limb.y));
    const weight = .68 * (1 - smooth(.018, .072, Math.abs(x - axisX)))
      * smooth(limb.y - .075, limb.y + .025, y) * (1 - smooth(.715, .75, y));
    const lower = smooth(limb.kneeY - .055, limb.kneeY + .035, y), upperBone = 1 + i * 2;
    jointX += weight * ((1 - lower) * deltaX(bones, upperBone, x, y) + lower * deltaX(bones, upperBone + 1, x, y));
    jointY += weight * ((1 - lower) * deltaY(bones, upperBone, x, y) + lower * deltaY(bones, upperBone + 1, x, y));
    totalWeight += weight;
  }
  dx += jointX / Math.max(1, totalWeight); dy += jointY / Math.max(1, totalWeight);
  dx = dx * (1 - head) + deltaX(bones, 0, x, y) * head;
  dy = dy * (1 - head) + deltaY(bones, 0, x, y) * head;
  const tail = (1 - smooth(.24, .34, x)) * smooth(.30, .48, y);
  const mid = 1 - smooth(.15, .245, x), tip = 1 - smooth(.06, .16, x);
  const tailX = (1 - mid) * deltaX(bones, 9, x, y) + mid * (1 - tip) * deltaX(bones, 10, x, y) + mid * tip * deltaX(bones, 11, x, y);
  const tailY = (1 - mid) * deltaY(bones, 9, x, y) + mid * (1 - tip) * deltaY(bones, 10, x, y) + mid * tip * deltaY(bones, 11, x, y);
  out[offset] = x + planted * (dx * (1 - tail) + tailX * tail);
  out[offset + 1] = y + planted * (dy * (1 - tail) + tailY * tail);
}
export interface CivetMeshData extends OriginalMeshData { readonly bones: Float64Array; }
/** Retains the original complete29-field admission and fixed connected topology.
 * All animation scratch belongs to this mesh and is allocated exactly once. */
export function createCivetMesh(genome: unknown): CivetMeshData {
  return { ...createOriginalMesh(genome), bones: new Float64Array(CIVET_CAPACITY.matrixScalars) };
}
export function deformCivetPoint(x: number, y: number, pose: CivetPose): readonly [number, number] {
  validPose(pose);
  if (![x, y].every(Number.isFinite) || x < 0 || x > 1 || y < 0 || y > 1) throw new TypeError('invalid articulated Civet point');
  const bones = new Float64Array(CIVET_CAPACITY.matrixScalars), result = new Float64Array(2);
  prepare(bones, pose); writePoint(result, 0, x, y, pose, bones); return [result[0]!, result[1]!];
}
/** Reuses the mesh's output and matrix storage; source UVs/rest/indices are read
 * only, and applying rest always restores their exact Float32 positions. */
export function applyCivetPose(mesh: CivetMeshData, pose: CivetPose): void {
  validPose(pose);
  if (!pose.breath && !pose.drive && !pose.tail) { mesh.vertices.set(mesh.rest); return; }
  prepare(mesh.bones, pose);
  for (let i = 0; i < mesh.vertices.length; i += 2) writePoint(mesh.vertices, i, mesh.rest[i]!, mesh.rest[i + 1]!, pose, mesh.bones);
}
