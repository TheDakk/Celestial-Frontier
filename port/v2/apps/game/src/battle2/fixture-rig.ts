/** @module battle2/fixture-rig [app] — a CreatureRigV1 (CONTRACTS.md §2) derived from a landmark
 * record and a keyed cut-out, used until Codex's C2 parts rig lands. The cut is PURE: the alpha
 * is partitioned by nearest bone segment (Voronoi over the record's bones in pixel space), then
 * bones are grouped into parts (head group, neck, torso, leg upper/lower/paw, tail segments).
 * Every part is a sprite region pivoting at its parent joint; applyPose runs forward kinematics
 * over the motion template GRAPH (parents first). Labelled everywhere as a fixture. No clock. */
import type { ResolvedAnatomyRecord } from '../motion/body-card.js';
import { QUADRUPED_GRAPH, QUADRUPED_LEGS, type JointName } from '../motion/templates.js';

export const FIXTURE_RIG_LABEL = 'fixture rig (landmark-derived parts)' as const;
export type RigLayer = 'far' | 'near';
export type RigPose = Readonly<Record<string, Readonly<{ rotation: number; dx?: number; dy?: number }>>>;
export interface RigPartV1 { readonly id: string; readonly display: unknown; readonly pivot: { readonly x: number; readonly y: number }; readonly layer: RigLayer; }
/** CONTRACTS.md §2 verbatim. */
export interface CreatureRigV1 {
  readonly recipeHash: string;
  readonly templateId: 'quadruped' | string;
  readonly parts: ReadonlyArray<RigPartV1>;
  readonly root: unknown;
  applyPose(pose: RigPose): void;
  readonly bounds: { readonly width: number; readonly height: number; readonly groundLineY: number };
  dispose(): void;
}
/** What the battle stage needs beyond the contract (a C2 rig gets a thin wrapper adding these). */
export interface BattleRigV1 extends CreatureRigV1 {
  readonly kind: 'fixture' | 'portrait' | 'parts';
  readonly label: string;
  /** Cut-out pixel size; rig display coordinates are cut-out pixels. */
  readonly cutout: { readonly width: number; readonly height: number };
  /** Normalized cut-out point that stands on the arena ground line (under the root landmark). */
  readonly foot: { readonly x: number; readonly y: number };
  readonly bodyLength: number;
}

export interface PixelBox { readonly x: number; readonly y: number; readonly width: number; readonly height: number; }
export interface FixturePartCut {
  readonly id: string;
  /** The bone whose FK transform the part follows. */
  readonly joint: JointName;
  /** The part pivots here (parent joint). */
  readonly parentJoint: JointName;
  readonly pivot: { readonly x: number; readonly y: number };
  readonly layer: RigLayer;
  readonly bones: readonly JointName[];
  readonly box: PixelBox;
  /** 0/255 mask over `box`, row-major. */
  readonly mask: Uint8Array;
  readonly pixelCount: number;
}
export interface FixtureCut {
  readonly label: typeof FIXTURE_RIG_LABEL;
  readonly width: number; readonly height: number;
  readonly alphaCount: number;
  readonly alphaBox: PixelBox;
  readonly parts: readonly FixturePartCut[];
}

interface PartDef { readonly id: string; readonly joint: JointName; readonly parentJoint: JointName; readonly bones: readonly JointName[]; readonly layer: RigLayer; }
const parentOf = (j: JointName): JointName => QUADRUPED_GRAPH.find(([c]) => c === j)?.[1] ?? 'root';
/** Part table: 19 parts, 31 bones, every GRAPH bone assigned exactly once (contract-tested). */
export const FIXTURE_PARTS: readonly PartDef[] = Object.freeze(([
  { id: 'head', joint: 'head', parentJoint: 'neck', bones: ['head', 'jaw', 'earFarRoot', 'earFarTip', 'earNearRoot', 'earNearTip'], layer: 'near' },
  { id: 'neck', joint: 'neck', parentJoint: 'chest', bones: ['neck'], layer: 'near' },
  { id: 'torso', joint: 'spine', parentJoint: 'pelvis', bones: ['pelvis', 'spine', 'chest', ...QUADRUPED_LEGS.map((l) => l + 'Root')], layer: 'near' },
  ...QUADRUPED_LEGS.flatMap((leg): PartDef[] => {
    const layer: RigLayer = leg.endsWith('Far') ? 'far' : 'near';
    return [
      { id: leg + 'Upper', joint: leg + 'Knee', parentJoint: leg + 'Root', bones: [leg + 'Knee'], layer },
      { id: leg + 'Lower', joint: leg + 'Ankle', parentJoint: leg + 'Knee', bones: [leg + 'Ankle'], layer },
      { id: leg + 'Paw', joint: leg + 'Paw', parentJoint: leg + 'Ankle', bones: [leg + 'Paw'], layer },
    ];
  }),
  ...['tail0', 'tail1', 'tail2', 'tail3'].map((t): PartDef => ({ id: t, joint: t, parentJoint: parentOf(t), bones: [t], layer: 'far' })),
] as PartDef[]).map((p) => Object.freeze({ ...p, bones: Object.freeze([...p.bones]) })));

const lm = (record: ResolvedAnatomyRecord, j: JointName): readonly [number, number] => {
  const p = record.landmarks[j];
  if (!p || p.length !== 2 || !p.every((v) => Number.isFinite(v))) throw new TypeError(`fixture rig: landmark "${j}" missing`);
  return [p[0] as number, p[1] as number];
};
const segDist2 = (px: number, py: number, ax: number, ay: number, bx: number, by: number): number => {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy;
  const t = l2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * vx + (py - ay) * vy) / l2));
  const dx = px - (ax + vx * t), dy = py - (ay + vy * t);
  return dx * dx + dy * dy;
};

/** Partition the alpha (row-major, length width*height, >0 = painted) into part masks. Pure. */
export function cutFixtureParts(alpha: Uint8Array, width: number, height: number, record: ResolvedAnatomyRecord): FixtureCut {
  if (!(alpha instanceof Uint8Array) || alpha.length !== width * height || !(width > 0) || !(height > 0)) throw new TypeError('fixture rig: alpha must be width*height bytes');
  if (record.template?.id !== 'quadruped') throw new TypeError(`fixture rig: template "${String(record.template?.id)}" is not quadruped`);
  const layers = new Set(record.geometry?.depthLayers?.map((d) => d.id) ?? []);
  if (!layers.has('far') || !layers.has('near')) throw new TypeError('fixture rig: record must declare far and near depth layers');
  const boneToPart = new Map<JointName, number>();
  FIXTURE_PARTS.forEach((p, i) => p.bones.forEach((b) => boneToPart.set(b, i)));
  const segs = QUADRUPED_GRAPH.map(([child, parent]) => {
    const a = lm(record, parent), b = lm(record, child), part = boneToPart.get(child);
    if (part === undefined) throw new TypeError(`fixture rig: bone "${child}" has no part`);
    return { ax: a[0] * width, ay: a[1] * height, bx: b[0] * width, by: b[1] * height, part };
  });
  const owner = new Uint8Array(width * height).fill(255);
  const box = FIXTURE_PARTS.map(() => ({ x0: width, y0: height, x1: -1, y1: -1, n: 0 }));
  const all = { x0: width, y0: height, x1: -1, y1: -1, n: 0 };
  const grow = (b: typeof all, x: number, y: number): void => { if (x < b.x0) b.x0 = x; if (y < b.y0) b.y0 = y; if (x > b.x1) b.x1 = x; if (y > b.y1) b.y1 = y; b.n++; };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    if (!(alpha[i] as number)) continue;
    let best = 0, bestD = Infinity;
    for (let s = 0; s < segs.length; s++) { const sg = segs[s]!, d = segDist2(x + 0.5, y + 0.5, sg.ax, sg.ay, sg.bx, sg.by); if (d < bestD) { bestD = d; best = sg.part; } }
    owner[i] = best; grow(box[best]!, x, y); grow(all, x, y);
  }
  const toBox = (b: typeof all): PixelBox => b.n === 0 ? { x: 0, y: 0, width: 0, height: 0 } : { x: b.x0, y: b.y0, width: b.x1 - b.x0 + 1, height: b.y1 - b.y0 + 1 };
  const parts = FIXTURE_PARTS.map((def, pi): FixturePartCut => {
    const bx = toBox(box[pi]!), mask = new Uint8Array(bx.width * bx.height);
    for (let y = 0; y < bx.height; y++) for (let x = 0; x < bx.width; x++) if (owner[(bx.y + y) * width + bx.x + x] === pi) mask[y * bx.width + x] = 255;
    const pv = lm(record, def.parentJoint);
    return Object.freeze({ id: def.id, joint: def.joint, parentJoint: def.parentJoint, pivot: Object.freeze({ x: pv[0], y: pv[1] }), layer: def.layer, bones: def.bones, box: Object.freeze(bx), mask, pixelCount: box[pi]!.n });
  });
  return Object.freeze({ label: FIXTURE_RIG_LABEL, width, height, alphaCount: all.n, alphaBox: Object.freeze(toBox(all)), parts: Object.freeze(parts) });
}

/* ---------- forward kinematics over the template GRAPH ---------- */
export interface SolvedPose { readonly order: readonly JointName[]; readonly angle: Readonly<Record<JointName, number>>; readonly position: Readonly<Record<JointName, readonly [number, number]>>; }
/** World angle and normalized position of every joint; root offsets are body-length units. Parents first, GRAPH order. */
export function solvePose(record: ResolvedAnatomyRecord, bodyLength: number, pose: RigPose): SolvedPose {
  const angle: Record<JointName, number> = {}, position: Record<JointName, readonly [number, number]> = {}, order: JointName[] = ['root'];
  const r = lm(record, 'root'), rootPose = pose.root;
  angle.root = rootPose?.rotation ?? 0;
  position.root = [r[0] + (rootPose?.dx ?? 0) * bodyLength, r[1] + (rootPose?.dy ?? 0) * bodyLength];
  for (const [child, parent] of QUADRUPED_GRAPH) {
    const a = (angle[parent] ?? 0) + (pose[child]?.rotation ?? 0), pp = position[parent] as readonly [number, number];
    const c = lm(record, child), p = lm(record, parent), vx = c[0] - p[0] + (pose[child]?.dx ?? 0) * bodyLength, vy = c[1] - p[1] + (pose[child]?.dy ?? 0) * bodyLength;
    angle[child] = a; position[child] = [pp[0] + vx * Math.cos(a) - vy * Math.sin(a), pp[1] + vx * Math.sin(a) + vy * Math.cos(a)]; order.push(child);
  }
  return Object.freeze({ order: Object.freeze(order), angle, position });
}

/* ---------- thin structural Pixi binding ---------- */
export interface RigNodeLike { x: number; y: number; rotation: number; visible: boolean; destroy(): void; }
export interface RigSpriteLike extends RigNodeLike { readonly anchor: { set(x: number, y: number): unknown }; }
export interface RigContainerLike extends RigNodeLike { addChild(child: RigNodeLike): unknown; removeChild(child: RigNodeLike): unknown; }
export interface FixtureDisplayFactory {
  container(): RigContainerLike;
  /** A sprite showing exactly `part.box` of the cut-out with `part.mask` applied (the page builds a canvas per part). */
  partSprite(part: FixturePartCut): RigSpriteLike;
}
export interface FixtureRigOptions { readonly record: ResolvedAnatomyRecord; readonly cut: FixtureCut; readonly factory: FixtureDisplayFactory; }

export function createFixtureRig(options: FixtureRigOptions): BattleRigV1 {
  const { record, cut, factory } = options;
  const W = cut.width, H = cut.height;
  const pelvis = lm(record, 'pelvis'), chest = lm(record, 'chest'), rootLm = lm(record, 'root');
  const bodyLength = Math.hypot(chest[0] - pelvis[0], chest[1] - pelvis[1]);
  const root = factory.container();
  const layerOrder = [...(record.geometry.depthLayers ?? [])].sort((a, b) => a.order - b.order).map((d) => d.id as RigLayer);
  const sprites = new Map<string, RigSpriteLike>();
  const parts: RigPartV1[] = [];
  for (const layer of layerOrder) for (const part of cut.parts) {
    if (part.layer !== layer) continue;
    const sprite = factory.partSprite(part);
    const px = part.pivot.x * W, py = part.pivot.y * H;
    sprite.anchor.set(part.box.width ? (px - part.box.x) / part.box.width : 0, part.box.height ? (py - part.box.y) / part.box.height : 0);
    sprite.visible = part.pixelCount > 0;
    root.addChild(sprite); sprites.set(part.id, sprite);
    parts.push(Object.freeze({ id: part.id, display: sprite, pivot: { x: part.pivot.x, y: part.pivot.y }, layer: part.layer }));
  }
  let disposed = false;
  const rig: BattleRigV1 = {
    kind: 'fixture', label: FIXTURE_RIG_LABEL,
    recipeHash: record.recipeHash ?? record.geometry.cutoutAssetHash, templateId: record.template.id,
    parts: Object.freeze(parts), root, bodyLength,
    bounds: Object.freeze({ width: cut.alphaBox.width / W, height: cut.alphaBox.height / H, groundLineY: record.geometry.groundLineY }),
    cutout: Object.freeze({ width: W, height: H }), foot: Object.freeze({ x: rootLm[0], y: record.geometry.groundLineY }),
    applyPose(pose) {
      if (disposed) throw new Error('fixture rig is disposed');
      const solved = solvePose(record, bodyLength, pose);
      for (const part of cut.parts) {
        const s = sprites.get(part.id)!, p = solved.position[part.parentJoint] as readonly [number, number];
        s.x = p[0] * W; s.y = p[1] * H; s.rotation = solved.angle[part.joint] ?? 0;
      }
    },
    dispose() { if (disposed) return; for (const s of sprites.values()) { root.removeChild(s); s.destroy(); } sprites.clear(); root.destroy(); disposed = true; },
  };
  rig.applyPose({});
  return rig;
}
