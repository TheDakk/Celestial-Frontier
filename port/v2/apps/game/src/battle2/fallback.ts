/** @module battle2/fallback [app] — whole-portrait staging for a combatant without a landmark
 * record (or an unsupported template). The portrait moves by ROOT OFFSETS ONLY, taken from the
 * action library's own root tracks and the §5 phase table, so its beats land on the same
 * milliseconds as a rigged combatant. Always labelled. Pure clips; no clock. */
import { DEG, QUADRUPED_ACTIONS } from '../motion/actions.js';
import { sampleKeys, type Keyframe } from '../motion/timeline.js';
import { idlePeriodMs, phaseDurations } from '../motion/timing.js';
import type { BattleRigV1, RigContainerLike, RigPose, RigSpriteLike } from './fixture-rig.js';

export const PORTRAIT_RIG_LABEL = 'whole-portrait fallback (no landmark record; hit pose approximated by root offsets)' as const;
export type PortraitAction = 'idle' | 'approach' | 'melee' | 'cast' | 'hit' | 'dodge' | 'faint' | 'victory';
export interface PortraitClip { readonly kind: 'portrait-clip'; readonly actionId: PortraitAction; readonly loop: boolean; readonly durationMs: number; readonly dx: readonly Keyframe[]; readonly dy: readonly Keyframe[]; readonly rot: readonly Keyframe[]; }

const REST: Keyframe = { ms: 0, t: 0, value: 0, ease: 'ease-out' };
const LIBRARY_ID: Readonly<Record<PortraitAction, string>> = Object.freeze({ idle: 'idle', approach: 'approach:walk', melee: 'melee:bite', cast: 'cast', hit: 'hit', dodge: 'dodge', faint: 'faint', victory: 'victory' });

/** Root-only clip: the library action's root dx/dy (body lengths) and root rotation, mass-scaled. */
export function portraitClip(actionId: PortraitAction, mass: number, seed: number): PortraitClip {
  const action = QUADRUPED_ACTIONS[LIBRARY_ID[actionId]];
  if (!action) throw new Error(`portrait fallback: no library action for ${actionId}`);
  const durationMs = action.family === 'idle' ? idlePeriodMs(seed, mass) : phaseDurations(action.family, mass).reduce((s, [, ms]) => s + ms, 0);
  const poses = action.poses;
  const keys = (pick: (p: (typeof poses)[number]) => number): Keyframe[] => [REST, ...poses.map((p) => ({ ms: p.t * durationMs, t: p.t, value: pick(p), ease: p.ease }))];
  return Object.freeze({ kind: 'portrait-clip', actionId, loop: action.loop, durationMs, dx: keys((p) => p.root.dx), dy: keys((p) => p.root.dy), rot: keys((p) => (p.joints.root ?? 0) * DEG) });
}
export function samplePortraitClip(clip: PortraitClip, ms: number): RigPose {
  const at = clip.loop ? ((ms % clip.durationMs) + clip.durationMs) % clip.durationMs : Math.min(Math.max(ms, 0), clip.durationMs);
  return Object.freeze({ root: Object.freeze({ rotation: sampleKeys(clip.rot, at), dx: sampleKeys(clip.dx, at), dy: sampleKeys(clip.dy, at) }) });
}

export interface PortraitRigOptions {
  readonly templateId: string; readonly recipeHash: string;
  readonly cutout: { readonly width: number; readonly height: number };
  /** Alpha bounds of the portrait in cut-out pixels; the foot is its bottom centre. */
  readonly alphaBox: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly groundLineY?: number;
  readonly factory: { container(): RigContainerLike; portraitSprite(): RigSpriteLike };
}
/** A CreatureRigV1 for one whole portrait: one part, pivot at the foot, root offsets only. */
export function createPortraitRig(o: PortraitRigOptions): BattleRigV1 {
  if (!(o.cutout.width > 0) || !(o.cutout.height > 0) || !(o.alphaBox.width > 0) || !(o.alphaBox.height > 0)) throw new TypeError('portrait rig: sizes must be positive');
  const W = o.cutout.width, H = o.cutout.height;
  const footX = (o.alphaBox.x + o.alphaBox.width / 2) / W, footY = o.groundLineY ?? (o.alphaBox.y + o.alphaBox.height) / H;
  const bodyLength = (o.alphaBox.width / W) * 0.6;
  const root = o.factory.container(), sprite = o.factory.portraitSprite();
  sprite.anchor.set(footX, footY); sprite.x = footX * W; sprite.y = footY * H; root.addChild(sprite);
  let disposed = false;
  return {
    kind: 'portrait', label: PORTRAIT_RIG_LABEL, recipeHash: o.recipeHash, templateId: o.templateId,
    parts: Object.freeze([Object.freeze({ id: 'portrait', display: sprite, pivot: { x: footX, y: footY }, layer: 'near' as const })]), root, bodyLength,
    bounds: Object.freeze({ width: o.alphaBox.width / W, height: o.alphaBox.height / H, groundLineY: footY }),
    cutout: Object.freeze({ width: W, height: H }), foot: Object.freeze({ x: footX, y: footY }),
    applyPose(pose) {
      if (disposed) throw new Error('portrait rig is disposed');
      const r = pose.root; sprite.x = (footX + (r?.dx ?? 0) * bodyLength) * W; sprite.y = (footY + (r?.dy ?? 0) * bodyLength) * H; sprite.rotation = r?.rotation ?? 0;
    },
    dispose() { if (disposed) return; root.removeChild(sprite); sprite.destroy(); root.destroy(); disposed = true; },
  };
}
