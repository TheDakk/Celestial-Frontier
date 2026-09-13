/* Playback adapter: plays a pure MotionTimeline through gsap onto a PoseTarget.
 * The clock is injected (`now()` in ms); nothing here reads Date/performance.
 * gsap interpolates each joint with the same easing family the pure sampler
 * uses, so gsap playback and sampleTimeline agree (contract-tested). */
import { gsap } from 'gsap';
import type { Ease } from './actions.js';
import { sampleKeys, type Keyframe, type MotionTimeline } from './timeline.js';

export interface PoseTarget { setJoint(name: string, rotation: number, dx: number, dy: number): void; }
export interface MotionPlayerOptions { readonly now: () => number; readonly gsapLib?: typeof gsap; }
export interface MotionPlayer {
  start(): void;
  /** Advance to the injected clock and push the pose; returns progress 0..1 (loops wrap). */
  tick(): number;
  seek(ms: number): void;
  stop(): void;
  readonly timeline: MotionTimeline;
}
export const GSAP_EASE: Readonly<Record<Ease, string>> = Object.freeze({ 'ease-out': 'power1.out', 'ease-in': 'power1.in', 'back-out': 'back.out(1.70158)', 'sine-in-out': 'sine.inOut' });

export function createGsapPlayer(timeline: MotionTimeline, target: PoseTarget, options: MotionPlayerOptions): MotionPlayer {
  const g = options.gsapLib ?? gsap;
  const values: Record<string, { v: number }> = {}, root = { dx: 0, dy: 0 };
  const tl = g.timeline({ paused: true, repeat: timeline.loop ? -1 : 0 });
  const addTrack = (obj: { v: number } | typeof root, key: 'v' | 'dx' | 'dy', keys: readonly Keyframe[]): void => {
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1] as Keyframe, b = keys[i] as Keyframe, dur = Math.max(0, b.ms - a.ms) / 1000;
      tl.to(obj, { [key]: b.value, duration: dur, ease: GSAP_EASE[b.ease], overwrite: false }, a.ms / 1000);
    }
  };
  const secondaryJoints = new Map(timeline.secondary.map((s) => [s.joint, s]));
  for (const [joint, keys] of Object.entries(timeline.tracks)) {
    const s = secondaryJoints.get(joint);
    values[joint] = { v: keys[0]?.value ?? 0 };
    addTrack(values[joint] as { v: number }, 'v', s && !s.rigid ? s.keys : keys);
  }
  addTrack(root, 'dx', timeline.root.dx); addTrack(root, 'dy', timeline.root.dy);
  tl.to({}, { duration: timeline.durationMs / 1000 }, 0); // pin the total length so progress is honest
  const push = (): void => { for (const [joint, cell] of Object.entries(values)) target.setJoint(joint, cell.v, root.dx, root.dy); };
  let startMs = 0, running = false;
  const seek = (ms: number): void => {
    if (timeline.loop) { const w = ((ms % timeline.bodyMs) + timeline.bodyMs) % timeline.bodyMs; tl.time(w / 1000, false);
      // gsap's repeat wraps the body; a looping secondary wraps its own lag, so read it from the pure track.
      for (const s of timeline.secondary) if (!s.rigid) (values[s.joint] as { v: number }).v = sampleKeys(s.keys, ((w - s.lagMs) % timeline.bodyMs + timeline.bodyMs) % timeline.bodyMs + s.lagMs);
    } else tl.time(Math.min(Math.max(ms, 0), timeline.durationMs) / 1000, false);
    push();
  };
  return {
    timeline,
    start() { startMs = options.now(); running = true; seek(0); },
    tick() { if (!running) return 0; const ms = options.now() - startMs; seek(ms); return timeline.loop ? (ms % timeline.bodyMs) / timeline.bodyMs : Math.min(1, ms / timeline.durationMs); },
    seek, stop() { running = false; tl.kill(); },
  };
}
