/* Motion Kit §4 action library for the quadruped template. ONE table, in
 * degrees and body lengths, so Nick can tune numbers in one place; the
 * timeline converts to radians. Each action is an ordered list of key poses:
 * normalized time `t` (from the §5 phase boundaries, so mass scaling never
 * moves a key), the easing INTO the pose from the frozen set, joint rotations
 * and root offsets. Unlisted joints are at rest (0). Sign convention is in
 * templates.ts: + dips the front / swings a leg back; jaw open is negative. */
import { tAt } from './timing.js';

export type Ease = 'ease-out' | 'ease-in' | 'back-out' | 'sine-in-out';
export const EASES: readonly Ease[] = Object.freeze(['ease-out', 'ease-in', 'back-out', 'sine-in-out']);
export interface KeyPose { readonly t: number; readonly ease: Ease; readonly joints: Readonly<Record<string, number>>; readonly root: { readonly dx: number; readonly dy: number }; }
export interface MotionAction { readonly id: string; readonly family: string; readonly loop: boolean; readonly rootUnit?: 'body' | 'motion-scale'; readonly poses: readonly KeyPose[]; readonly phaseOwnedJoints?: readonly string[]; }
type J = Record<string, number>;
const P = (t: number, ease: Ease, joints: J, dx = 0, dy = 0): KeyPose => ({ t, ease, joints, root: { dx, dy } });
const REST: J = {};
/** Upper legs (Knee bones) and lower legs (Ankle bones): fore/hind swing, +back / -forward. */
const legs = (foreFar: number, hindFar: number, foreNear = foreFar, hindNear = hindFar, bend = 0): J => ({
  foreFarKnee: foreFar, foreNearKnee: foreNear, hindFarKnee: hindFar, hindNearKnee: hindNear,
  foreFarAnkle: -bend, foreNearAnkle: -bend, hindFarAnkle: bend, hindNearAnkle: bend,
});
const crouch = (depth: number): J => ({ ...legs(-depth * 0.4, depth * 0.5, -depth * 0.4, depth * 0.5, depth), spine: depth * 0.3, tail0: -depth * 0.3 });
const ears = (deg: number): J => ({ earFarTip: deg, earNearTip: deg });
const strideA = (amp: number, bend: number): J => ({ ...legs(-amp, amp, amp, -amp, bend) });
const strideB = (amp: number, bend: number): J => ({ ...legs(amp, -amp, -amp, amp, bend) });
const gaitCycle = (id: 'walk' | 'trot' | 'gallop' | 'hop'): KeyPose[] => {
  if (id === 'walk') return [P(0.25, 'sine-in-out', strideA(18, 8), 0, -0.010), P(0.5, 'sine-in-out', { ...legs(0, 0, 0, 0, 14) }, 0, 0.004), P(0.75, 'sine-in-out', strideB(18, 8), 0, -0.010), P(1, 'sine-in-out', REST)];
  if (id === 'trot') return [P(0.25, 'sine-in-out', { ...strideA(26, 12), spine: -3, neck: -4 }, 0, -0.022), P(0.5, 'sine-in-out', { ...legs(0, 0, 0, 0, 18), spine: 2 }, 0, 0.006), P(0.75, 'sine-in-out', { ...strideB(26, 12), spine: -3, neck: -4 }, 0, -0.022), P(1, 'sine-in-out', REST)];
  if (id === 'gallop') return [P(0.2, 'ease-in', { ...legs(20, -20, 24, -24, 24), spine: 10, chest: 6, neck: 6, tail0: 12 }, 0, 0.020), P(0.45, 'ease-out', { ...legs(-36, 34, -30, 30, 4), spine: -12, chest: -6, neck: -10, head: -6, tail0: -14 }, 0, -0.080), P(0.7, 'ease-in', { ...legs(20, -20, 24, -24, 24), spine: 10, chest: 6, neck: 6, tail0: 12 }, 0, 0.020), P(0.95, 'ease-out', { ...legs(-36, 34, -30, 30, 4), spine: -12, chest: -6, neck: -10, head: -6, tail0: -14 }, 0, -0.080), P(1, 'ease-out', REST)];
  return [P(0.3, 'ease-in', { ...crouch(36), head: 8 }, 0, 0.040), P(0.65, 'ease-out', { ...legs(-30, 34, -30, 34, 0), spine: -6, neck: -8, tail0: -10 }, 0, -0.140), P(1, 'back-out', { ...crouch(16) }, 0, 0.016)];
};
/** Melee: anticipation crouch → launch → strike (one-frame smear) → recover. */
const meleeFor = (strike: J, launch: J = {}, anticipation: J = {}): KeyPose[] => {
  const m = 'melee';
  return [
    P(tAt(m, 'anticipation'), 'ease-in', { ...crouch(30), spine: 12, neck: 8, head: 10, ...anticipation }, -0.04, 0.030),
    P(tAt(m, 'strike'), 'ease-out', { ...legs(-30, 30, -30, 30, -10), spine: -6, neck: -10, head: -6, jaw: -10, tail0: -12, ...launch }, 0.36, -0.050),
    P(tAt(m, 'smear'), 'ease-out', { ...legs(-30, 30, -30, 30, -10), spine: -2, head: 8, ...strike }, 0.40, -0.010),
    P(tAt(m, 'recovery', 0.55), 'back-out', { ...crouch(10), head: 2 }, 0.10, 0.010),
    P(1, 'ease-out', REST),
  ];
};
export const QUADRUPED_ACTIONS: Readonly<Record<string, MotionAction>> = Object.freeze({
  idle: { id: 'idle', family: 'idle', loop: true, poses: [
    P(0.25, 'sine-in-out', { tail0: 4, tail1: 3, pelvis: 1 }, 0.008, -0.004),
    P(0.5, 'sine-in-out', { spine: -2, chest: -2, neck: -3, head: 1, ...ears(-3) }, 0, -0.011),
    P(0.75, 'sine-in-out', { tail0: -4, tail1: -3, pelvis: -1 }, -0.008, -0.004),
    P(1, 'sine-in-out', REST),
  ] },
  alert: { id: 'alert', family: 'alert', loop: false, poses: [P(1, 'back-out', { neck: -12, head: -8, spine: -3, tail0: -6, ...ears(-20) }, 0, -0.006)] },
  'approach:walk': { id: 'approach:walk', family: 'approach', loop: false, poses: gaitCycle('walk') },
  'approach:trot': { id: 'approach:trot', family: 'approach', loop: false, poses: gaitCycle('trot') },
  'approach:gallop': { id: 'approach:gallop', family: 'approach', loop: false, poses: gaitCycle('gallop') },
  'approach:hop': { id: 'approach:hop', family: 'approach', loop: false, poses: gaitCycle('hop') },
  'melee:bite': { id: 'melee:bite', family: 'melee', loop: false, poses: meleeFor({ jaw: -25, head: 12, neck: 6, foreNearKnee: -40 }) },
  'melee:claw': { id: 'melee:claw', family: 'melee', loop: false, poses: meleeFor({ jaw: -8, foreNearKnee: 40, foreNearAnkle: 30, head: 5 }, { foreNearKnee: -55, foreNearAnkle: 30 }) },
  'melee:gore': { id: 'melee:gore', family: 'melee', loop: false, poses: meleeFor({ neck: -25, head: -30, jaw: 0 }, { neck: 20, head: 25, jaw: 0 }, { neck: 18, head: 22 }) },
  'melee:tail': { id: 'melee:tail', family: 'melee', loop: false, poses: meleeFor({ tail0: 35, tail1: 30, tail2: 20, tail3: 12, pelvis: 6, jaw: 0 }, { tail0: -30, tail1: -22, tail2: -12, pelvis: -6, jaw: 0 }, { pelvis: -8, tail0: -20, tail1: -12 }) },
  'melee:headbutt': { id: 'melee:headbutt', family: 'melee', loop: false, poses: meleeFor({ neck: 20, head: 15, jaw: 0 }, { neck: -15, head: -10, jaw: 0 }, { neck: -15, head: -10 }) },
  cast: { id: 'cast', family: 'cast', loop: false, poses: [
    P(tAt('cast', 'rise'), 'ease-in', { pelvis: -5, spine: -18, chest: -15, neck: -12, ...legs(-45, 10, -45, 10, 16), tail0: 8 }, -0.02, -0.060),
    P(tAt('cast', 'hold'), 'sine-in-out', { pelvis: -5, spine: -18, chest: -15, neck: -14, head: -5, ...legs(-42, 12, -48, 12, 16), tail0: 6, ...ears(-8) }, -0.02, -0.064),
    P(tAt('cast', 'release'), 'ease-out', { spine: -10, chest: -6, neck: 10, head: 25, jaw: -15, ...legs(-30, 20, -30, 20, 8) }, 0.06, -0.030),
    P(1, 'back-out', REST),
  ] },
  hit: { id: 'hit', family: 'hit', loop: false, poses: [
    P(tAt('hit', 'recoil'), 'ease-out', { head: -20, neck: -12, spine: 6, chest: -6, pelvis: -4, jaw: -8, ...ears(12), tail0: 10 }, -0.08, 0.020),
    P(tAt('hit', 'stagger'), 'ease-out', { head: -8, neck: -6, spine: 3, hindFarKnee: -12, hindFarAnkle: 18, foreNearKnee: 10, tail0: 6 }, -0.14, 0.012),
    P(1, 'back-out', REST),
  ] },
  dodge: { id: 'dodge', family: 'dodge', loop: false, poses: [
    P(tAt('dodge', 'out'), 'ease-out', { spine: -4, neck: -6, ...legs(-12, 15, -12, 15, 6) }, -0.25, -0.040),
    P(1, 'back-out', REST),
  ] },
  faint: { id: 'faint', family: 'faint', loop: false, poses: [
    P(0.45, 'ease-in', { ...crouch(40), head: 10, neck: 10 }, 0, 0.100),
    P(1, 'ease-out', { ...legs(-20, 30, -20, 30, 60), root: 10, spine: 8, neck: 25, head: 30, tail0: 20, tail1: 12, ...ears(16) }, -0.02, 0.220),
  ] },
  victory: { id: 'victory', family: 'victory', loop: false, poses: [
    P(tAt('victory', 'rear'), 'ease-out', { pelvis: -6, spine: -20, chest: -12, neck: -8, head: -15, jaw: -10, ...legs(-45, 12, -45, 12, 14), tail0: -12 }, 0, -0.080),
    P(tAt('victory', 'toss'), 'back-out', { pelvis: -6, spine: -20, chest: -12, neck: -12, head: -25, ...legs(-40, 12, -50, 12, 14), tail0: -16, ...ears(-15) }, 0, -0.084),
    P(1, 'back-out', REST),
  ] },
  tame: { id: 'tame', family: 'tame', loop: false, poses: [
    P(tAt('tame', 'approach'), 'ease-out', { head: -6, ...strideA(12, 6) }, 0.12, -0.008),
    P(tAt('tame', 'lower'), 'ease-out', { neck: 20, head: 18, spine: 3, ...ears(-10), tail0: 4 }, 0.12, 0.020),
    P(1, 'back-out', { head: 6 }, 0.12, 0.004),
  ] },
  feed: { id: 'feed', family: 'feed', loop: false, poses: [
    P(tAt('feed', 'down'), 'ease-out', { neck: 25, head: 20, foreFarKnee: 5, foreNearKnee: 5 }, 0.02, 0.012),
    P(tAt('feed', 'chew', 0.5), 'sine-in-out', { neck: 25, head: 20, jaw: -14, foreFarKnee: 5, foreNearKnee: 5 }, 0.02, 0.012),
    P(tAt('feed', 'chew'), 'sine-in-out', { neck: 25, head: 20, jaw: -2, foreFarKnee: 5, foreNearKnee: 5 }, 0.02, 0.012),
    P(tAt('feed', 'chew2', 0.5), 'sine-in-out', { neck: 25, head: 20, jaw: -14, foreFarKnee: 5, foreNearKnee: 5 }, 0.02, 0.012),
    P(tAt('feed', 'chew2'), 'sine-in-out', { neck: 25, head: 20, jaw: -2, foreFarKnee: 5, foreNearKnee: 5 }, 0.02, 0.012),
    P(1, 'back-out', REST),
  ] },
});
export const QUADRUPED_ACTION_IDS = Object.freeze(Object.keys(QUADRUPED_ACTIONS));
export const DEG = Math.PI / 180;
