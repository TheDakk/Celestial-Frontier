/** One-view Civet authoring proof; not imported by the game or a combat owner.
 * Immutable texture coordinates and connected triangles retain one painted identity.
 * Finite sampled deformation is cosmetic; no RNG, game clock, stats or save writes. */
import { EARTH_RESIDENT_LAYER_PLAN_V1, snapshotEarthLayerDataV1 }
  from '../../packages/art/src/earth-resident-plan.js';

const canonical = EARTH_RESIDENT_LAYER_PLAN_V1.residents.find(row => row.name === 'Civet')!;
const canonicalJSON = JSON.stringify(canonical.genome);
export const CIVET_SOURCE_GENOME_JSON = canonicalJSON;
export const CIVET_RIG_VERSION = 'cf.painted-civet.study.v1' as const;
export const CIVET_COLUMNS = 48;
export const CIVET_ROWS = 32;
export type CivetClip = 'rest' | 'breathe' | 'strike' | 'recoil';
export const CIVET_CLIP_MS = Object.freeze({ rest: 0, breathe: 4200, strike: 1000, recoil: 700 });
export type CivetPose = Readonly<{ breath: number; drive: number; tail: number }>;
const REST: CivetPose = Object.freeze({ breath: 0, drive: 0, tail: 0 });

/** Complete canonical genome admission; a name, seed or shortened phenotype is insufficient. */
export function isPaintedCivetIdentity(genome: unknown): boolean {
  try { return JSON.stringify(snapshotEarthLayerDataV1(genome)) === canonicalJSON; }
  catch { return false; }
}
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

/** No looping or wall-clock reads. A caller owns start, visibility, policy and cancellation. */
export function sampleCivetPose(clip: CivetClip, elapsedMs: number,
  policy: Readonly<{ effectsOn: boolean; fullMotion: boolean; visible: boolean }>): CivetPose {
  if (!Object.hasOwn(CIVET_CLIP_MS, clip) || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new TypeError('invalid finite Civet clip sample');
  }
  if (!policy.effectsOn || !policy.fullMotion || !policy.visible || clip === 'rest') return REST;
  const duration = CIVET_CLIP_MS[clip];
  if (elapsedMs === 0 || elapsedMs >= duration) return REST;
  const t = elapsedMs / duration;
  if (clip === 'breathe') {
    const envelope = Math.sin(Math.PI * t) ** 2;
    return { breath: envelope, drive: 0, tail: envelope * Math.sin(2 * Math.PI * t) };
  }
  const drive = clip === 'strike'
    ? track(t, [[0, 0], [.24, -.65], [.48, 1], [.73, -.24], [1, 0]])
    : track(t, [[0, 0], [.25, -.7], [.62, .13], [1, 0]]);
  return { breath: 0, drive, tail: -drive * .5 };
}

/** Normalized landmarks describe this single painted projection, not world metres or a 3D rig.
 * Retained 768×512 study derivative: solid contact row413 (.8066); all feet
 * meet fixed mesh rows beginning at .75, before the measured paw strip. Keeping
 * whole triangles fixed prevents interpolation from sliding rasterized paw pixels. */
export const CIVET_SKIN = Object.freeze({
  footLockY: .75, legBlendY: .62, headStartX: .64, headRigidX: .76,
  neckPivotX: .69, neckPivotY: .48, tailRootX: .30,
});

export function deformCivetPoint(x: number, y: number, pose: CivetPose): readonly [number, number] {
  if (![x, y, pose.breath, pose.drive, pose.tail].every(Number.isFinite)
    || x < 0 || x > 1 || y < 0 || y > 1
    || pose.breath < 0 || pose.breath > 1 || Math.abs(pose.drive) > 1 || Math.abs(pose.tail) > 1) {
    throw new TypeError('invalid Civet point/pose');
  }
  if ((!pose.breath && !pose.drive && !pose.tail) || y >= CIVET_SKIN.footLockY) return [x, y];
  const planted = 1 - smooth(CIVET_SKIN.legBlendY, CIVET_SKIN.footLockY, y);
  const body = smooth(.25, .38, x) * (1 - smooth(.64, .74, x));
  const head = smooth(CIVET_SKIN.headStartX, CIVET_SKIN.headRigidX, x) * planted;
  const angle = -.034 * pose.drive;
  const dx = x - CIVET_SKIN.neckPivotX, dy = y - CIVET_SKIN.neckPivotY;
  const neckX = Math.cos(angle) * dx - Math.sin(angle) * dy - dx + .018 * pose.drive;
  const neckY = Math.sin(angle) * dx + Math.cos(angle) * dy - dy - .004 * pose.drive;
  const tail = (1 - smooth(.09, CIVET_SKIN.tailRootX, x)) * planted;
  return [x + .007 * pose.drive * planted * body + head * neckX,
    y - .006 * pose.breath * body * planted + head * neckY + .009 * pose.tail * tail];
}

export interface CivetMeshData {
  readonly vertices: Float32Array;
  readonly rest: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint32Array;
}
/** One fixed-size allocation. Authoring UVs are never regenerated from motion or genome fields. */
export function createCivetMesh(genome: unknown): CivetMeshData {
  if (!isPaintedCivetIdentity(genome)) throw new TypeError('unsupported painted Civet identity');
  const count = (CIVET_COLUMNS + 1) * (CIVET_ROWS + 1);
  const rest = new Float32Array(count * 2), indices = new Uint32Array(CIVET_COLUMNS * CIVET_ROWS * 6);
  for (let row = 0; row <= CIVET_ROWS; row++) for (let column = 0; column <= CIVET_COLUMNS; column++) {
    const i = (row * (CIVET_COLUMNS + 1) + column) * 2;
    rest[i] = column / CIVET_COLUMNS; rest[i + 1] = row / CIVET_ROWS;
  }
  let k = 0;
  for (let row = 0; row < CIVET_ROWS; row++) for (let column = 0; column < CIVET_COLUMNS; column++) {
    const a = row * (CIVET_COLUMNS + 1) + column, b = a + 1, d = a + CIVET_COLUMNS + 1, c = d + 1;
    indices.set([a, b, c, a, c, d], k); k += 6;
  }
  return { vertices: rest.slice(), rest, uvs: rest.slice(), indices };
}

export function applyCivetPose(mesh: CivetMeshData, pose: CivetPose): void {
  // Validate even rest: NaN is falsy and must never masquerade as a settled pose.
  deformCivetPoint(0, 0, pose);
  if (!pose.breath && !pose.drive && !pose.tail) { mesh.vertices.set(mesh.rest); return; }
  for (let i = 0; i < mesh.vertices.length; i += 2) {
    const [x, y] = deformCivetPoint(mesh.rest[i]!, mesh.rest[i + 1]!, pose);
    mesh.vertices[i] = x; mesh.vertices[i + 1] = y;
  }
}
