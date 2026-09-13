/** @module battle2/rig-render [domain] — a pure software render of a fixture cut in a pose, for gates and
 * proofs that must not depend on a browser. Each part's masked pixels are placed by the same forward
 * kinematics the rig uses (`solvePose`), inverse-mapped per destination pixel (nearest neighbour), drawn
 * far layer then near layer and parents before children (`FIXTURE_DRAW_ORDER`). At the rest pose the
 * output equals the keyed master byte for byte, underlap or not, which is the property that makes the
 * underlap safe. No clock, no randomness. */
import type { ResolvedAnatomyRecord } from '../motion/body-card.js';
import type { MotionTimeline } from '../motion/timeline.js';
import { sampleTimeline } from '../motion/timeline.js';
import { FIXTURE_DRAW_ORDER, solvePose, type FixtureCut, type RigPose } from './fixture-rig.js';

/** The rig pose a timeline sample means: joint rotations plus the root offsets (root only, CONTRACTS §2). */
export function poseFromTimeline(tl: MotionTimeline, ms: number): RigPose {
  const p = sampleTimeline(tl, ms), out: Record<string, { rotation: number; dx?: number; dy?: number }> = {};
  for (const [j, r] of Object.entries(p.joints)) if (j !== 'root') out[j] = { rotation: r };
  out.root = { rotation: p.root.rotation, dx: p.root.dx, dy: p.root.dy };
  return out;
}

export interface PosedRender { readonly width: number; readonly height: number; readonly rgba: Uint8ClampedArray; readonly opaque: number; }

/** Render `cut` (over the keyed `rgba` master it was cut from) in `pose`. Output is a fresh RGBA buffer of the cut-out size. */
export function renderPosedCut(cut: FixtureCut, record: ResolvedAnatomyRecord, rgba: Uint8ClampedArray, pose: RigPose): PosedRender {
  const W = cut.width, H = cut.height;
  if (rgba.length !== W * H * 4) throw new TypeError('rig render: rgba must match the cut-out size');
  const pelvis = record.landmarks.pelvis!, chest = record.landmarks.chest!;
  const bodyLength = Math.hypot(chest[0]! - pelvis[0]!, chest[1]! - pelvis[1]!);
  const solved = solvePose(record, bodyLength, pose);
  const out = new Uint8ClampedArray(W * H * 4); let opaque = 0;
  const layers = [...(record.geometry.depthLayers ?? [])].sort((a, b) => a.order - b.order).map((d) => d.id);
  for (const layer of layers) for (const pi of FIXTURE_DRAW_ORDER) {
    const part = cut.parts[pi]!; if (part.layer !== layer || part.box.width === 0) continue;
    const angle = solved.angle[part.joint] ?? 0, pw = solved.position[part.parentJoint]!;
    const px = part.pivot.x * W, py = part.pivot.y * H, tx = pw[0]! * W, ty = pw[1]! * H, c = Math.cos(angle), s = Math.sin(angle);
    // Destination bounds: the part's box corners transformed.
    const src: readonly (readonly [number, number])[] = [[part.box.x, part.box.y], [part.box.x + part.box.width, part.box.y], [part.box.x, part.box.y + part.box.height], [part.box.x + part.box.width, part.box.y + part.box.height]];
    const corners = src.map(([x, y]): readonly [number, number] => [tx + (x - px) * c - (y - py) * s, ty + (x - px) * s + (y - py) * c]);
    const x0 = Math.max(0, Math.floor(Math.min(...corners.map((q) => q[0])))), x1 = Math.min(W - 1, Math.ceil(Math.max(...corners.map((q) => q[0]))));
    const y0 = Math.max(0, Math.floor(Math.min(...corners.map((q) => q[1])))), y1 = Math.min(H - 1, Math.ceil(Math.max(...corners.map((q) => q[1]))));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      // Inverse map the destination pixel centre to the source.
      const dx = x + 0.5 - tx, dy = y + 0.5 - ty, sx = Math.floor(px + dx * c + dy * s), sy = Math.floor(py - dx * s + dy * c);
      const mx = sx - part.box.x, my = sy - part.box.y; if (mx < 0 || my < 0 || mx >= part.box.width || my >= part.box.height) continue;
      if (!part.mask[my * part.box.width + mx]) continue;
      const si = (sy * W + sx) * 4, di = (y * W + x) * 4;
      if (rgba[si + 3]! === 0) continue;
      if (out[di + 3] === 0) opaque++;
      out[di] = rgba[si]!; out[di + 1] = rgba[si + 1]!; out[di + 2] = rgba[si + 2]!; out[di + 3] = rgba[si + 3]!;
    }
  }
  return Object.freeze({ width: W, height: H, rgba: out, opaque });
}

/** Count of visible RGBA channels that differ between two same-size buffers (the "0 changed channels" gate): a pixel
 * transparent on both sides contributes nothing (a keyed master keeps its magenta under alpha 0; the render keeps zeros). */
export function changedChannels(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  if (a.length !== b.length || a.length % 4 !== 0) throw new TypeError('changedChannels: buffers differ in size');
  let n = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] === 0 && b[i + 3] === 0) continue;
    for (let k = 0; k < 4; k++) if (a[i + k] !== b[i + k]) n++;
  }
  return n;
}
