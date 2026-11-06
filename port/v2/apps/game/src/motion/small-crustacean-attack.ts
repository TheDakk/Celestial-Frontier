/** An observed foreleg-tip strike, not a pincer closure. The small-crustacean
 * graph has root/knee/foot chains but no opposing fixed/dactyl finger joints.
 * Named capability intent and attackRepertoire still own admission. */
import { DEG, type KeyPose, type MotionAction } from './actions.js';
import type { BodyCard } from './body-card.js';
import { tAt } from './timing.js';
const bounded = (angle: number, max: number): number => Math.max(-max, Math.min(max, angle));
const angleTo = (x: number, y: number, fx: number, fy: number): number => Math.atan2(x * fy - y * fx, x * fx + y * fy) / DEG;
const P = (t: number, joints: Record<string, number>, ease: KeyPose['ease']): KeyPose => ({ t, joints, ease, root: { dx: 0, dy: 0 } });
export function smallCrustaceanAttackAction(card: BodyCard, action: MotionAction): MotionAction {
  if (card.template.id !== 'crustacean-small' || action.id !== 'melee:claw' || action.family !== 'melee') return action;
  const present = new Set(card.parts.map(p => p.joint));
  const required = ['thorax', 'head', ...['Near', 'Far'].flatMap(s => ['Root', 'Knee', 'Foot'].map(j => 'leg0' + s + j))];
  if (required.some(j => !present.has(j) || !card.landmarks[j])) throw Error('motion: foreleg strike requires observed bilateral root/knee/tip chains');
  const head = card.landmarks.head!, thorax = card.landmarks.thorax!, fx = head[0] - thorax[0], fy = head[1] - thorax[1];
  if (Math.hypot(fx, fy) < 1e-6) throw Error('motion: foreleg strike requires a nondegenerate observed forward axis');
  const gather: Record<string, number> = {}, strike: Record<string, number> = {};
  for (const side of ['Near', 'Far']) {
    const prefix = 'leg0' + side, root = card.landmarks[prefix + 'Root']!, knee = card.landmarks[prefix + 'Knee']!, tip = card.landmarks[prefix + 'Foot']!;
    const a = [knee[0] - root[0], knee[1] - root[1]], b = [tip[0] - knee[0], tip[1] - knee[1]];
    if (Math.hypot(a[0]!, a[1]!) < 1e-6 || Math.hypot(b[0]!, b[1]!) < 1e-6) throw Error('motion: foreleg strike requires nondegenerate observed segments');
    // Rotate the existing upper and distal segments toward the painted forward
    // axis. Source handedness chooses the signs, so mirroring needs no species
    // branch. These small angles do not modify any joint or validator limit.
    const upper = bounded(angleTo(a[0]!, a[1]!, fx, fy), 12);
    const distal = bounded(angleTo(b[0]!, b[1]!, fx, fy) - upper, 18);
    for (const [joint, deg] of [[prefix + 'Knee', upper], [prefix + 'Foot', distal]] as const) {
      const projection = card.projectionSigns?.[joint] ?? 1;
      strike[joint] = deg * projection;
      gather[joint] = -0.6 * strike[joint];
    }
  }
  return Object.freeze({ id: action.id, family: 'melee', loop: false, poses: Object.freeze([
    P(tAt('melee', 'anticipation'), gather, 'ease-in'),
    P(tAt('melee', 'strike'), strike, 'ease-out'),
    P(tAt('melee', 'smear'), strike, 'sine-in-out'),
    P(1, {}, 'sine-in-out'),
  ]) });
}
