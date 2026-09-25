/* Pure timeline builder and sampler. buildTimeline turns a body card plus an
 * action id and the recipe seed into a plain-JSON MotionTimeline; sampleTimeline
 * evaluates it at any millisecond with the frozen easing family. No clock, no
 * randomness beyond the seeded idle period, no renderer. */
import { DEG, type Ease, type MotionAction } from './actions.js';
import {faintStanceEnvelope,applyStanceEnvelope,type StanceEnvelope} from './stance-envelope.js';
import { actionsFor, MELEE_ALIAS, templateMelees } from './family-actions.js';
import type { BodyCard, Weapon } from './body-card.js';
import { secondaryParams, type SecondaryParams } from './secondary.js';
import { hitstopMs, idlePeriodMs, phaseDurations, type MassClassName } from './timing.js';

export interface Keyframe { readonly ms: number; readonly t: number; readonly value: number; readonly ease: Ease; }
export interface SecondaryTrack extends SecondaryParams { readonly keys: readonly Keyframe[]; }
export interface MotionTimeline {
  readonly kind: 'motion-timeline';
  readonly stanceEnvelope?:StanceEnvelope;
  readonly actionId: string; readonly family: string; readonly loop: boolean;
  readonly seed: number; readonly recipeHash: string | null; readonly massClass: MassClassName;
  readonly bodyMs: number; readonly durationMs: number;
  readonly phases: readonly (readonly [string, number])[];
  readonly tracks: Readonly<Record<string, readonly Keyframe[]>>;
  readonly root: { readonly dx: readonly Keyframe[]; readonly dy: readonly Keyframe[] };
  readonly secondary: readonly SecondaryTrack[];
  readonly deform: { readonly squash: number; readonly stretch: number };
  readonly hitstopMs: number; readonly luminousPulseMs: number;
  readonly limitsRad: Readonly<Record<string, {readonly min:number;readonly max:number}>>;
  readonly clamped: readonly string[]; readonly notes: readonly string[];
  readonly hash: string;
}
export interface MotionPose { readonly ms: number; readonly joints: Readonly<Record<string, number>>; readonly root: { readonly dx: number; readonly dy: number; readonly rotation: number }; readonly scale: { readonly x: number; readonly y: number }; }

/** The frozen easing family; numerically identical to gsap power1.out / power1.in / back.out(1.70158) / sine.inOut. */
export const EASE_FN: Readonly<Record<Ease, (t: number) => number>> = Object.freeze({
  'ease-out': (t) => 1 - (1 - t) * (1 - t),
  'ease-in': (t) => t * t,
  'back-out': (t) => { const s = 1.70158, p = t - 1; return p * p * ((s + 1) * p + s) + 1; },
  'sine-in-out': (t) => -(Math.cos(Math.PI * t) - 1) / 2,
});
/** approach → the card's template gait; melee → the first card weapon the template's library (or its alias table) has a verb for, else the library's first melee verb with a note. */
export function resolveActionId(card: BodyCard, actionId: string): { id: string; note: string | null } {
  if (actionId === 'approach') return { id: 'approach:' + card.locomotion.templateGait, note: null };
  if (actionId === 'melee') {
    const verbs = templateMelees(card.template.id), alias = MELEE_ALIAS[card.template.id] ?? {};
    const w = card.weapons.map((x: Weapon) => alias[x] ?? x).find((x) => verbs.includes(x));
    if(!w)throw Error(`motion: no admitted ${card.template.id} melee for weapons [${card.weapons.join(',')}]`);
    return { id: 'melee:' + w, note: null };
  }
  return { id: actionId, note: null };
}
export function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
export function sampleKeys(keys: readonly Keyframe[], ms: number): number {
  const first = keys[0], last = keys[keys.length - 1];
  if (!first || !last) return 0;
  if (ms <= first.ms) return first.value;
  if (ms >= last.ms) return last.value;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1] as Keyframe, b = keys[i] as Keyframe;
    if (ms <= b.ms) { const span = b.ms - a.ms; return span <= 0 ? b.value : a.value + (b.value - a.value) * EASE_FN[b.ease]((ms - a.ms) / span); }
  }
  return last.value;
}
const REST_KEY: Keyframe = { ms: 0, t: 0, value: 0, ease: 'ease-out' };
const CHAIN_ATTENUATION = 0.6;

export function buildTimeline(card: BodyCard, actionId: string, seed: number): MotionTimeline {
  const resolved = resolveActionId(card, actionId);
  const action: MotionAction | undefined = actionsFor(card.template.id,card.anatomy)?.[resolved.id];
  if (!action) throw new Error(`motion: ${card.template.id} has no action "${resolved.id}"`);
  return buildActionTimeline(card,action,seed,resolved.note?[...card.notes,resolved.note]:card.notes);
}
/** Shared constructor for ordinary playback and reviewed editor overlays. */
export function buildActionTimeline(card:BodyCard,action:MotionAction,seed:number,notesIn:readonly string[]=card.notes):MotionTimeline {
  const mass=card.massClass.multiplier,notes=[...notesIn];
  const phases = action.family === 'idle' || action.family === 'sway' ? [['period', idlePeriodMs(seed, mass)] as const] : phaseDurations(action.family, mass);
  const bodyMs = phases.reduce((s, [, ms]) => s + ms, 0);
  const clamped: string[] = [];
  const tracks: Record<string, Keyframe[]> = {};
  const joints = ['root', ...card.parts.map((p) => p.joint)];
  for (const joint of joints) {
    const lim = card.bounds.limitsDeg[joint];
    tracks[joint] = [REST_KEY, ...action.poses.map((pose) => {
      let deg = (pose.joints[joint] ?? 0) * (card.amplitudeProfile?.scales[joint] ?? 1) * (card.projectionScales?.[joint] ?? 1);
      if (lim && (deg < lim.min || deg > lim.max)) { clamped.push(`${action.id}/${joint}@${pose.t.toFixed(3)}:${deg}`); deg = Math.min(lim.max, Math.max(lim.min, deg)); }
      return { ms: pose.t * bodyMs, t: pose.t, value: deg * DEG * (card.projectionSigns?.[joint] ?? 1), ease: pose.ease };
    })];
  }
  const rootKeys = (pick: 'dx' | 'dy'): Keyframe[] => [REST_KEY, ...action.poses.map((p) => ({ ms: p.t * bodyMs, t: p.t, value: p.root[pick] * (action.rootUnit==='motion-scale'?card.scaleLength/card.bodyLength:1), ease: p.ease }))];
  // Secondary: the authored joint track arrives lagMs late, overshoots by the material's fraction, then settles.
  const secondary: SecondaryTrack[] = [];
  let maxLag = 0;
  for (const part of card.secondaryParts) {
    let prev: readonly Keyframe[] = [REST_KEY];
    for (const prm of secondaryParams(part, card.realm, card.luminous)) {
      // A travelling-wave owner already supplies physical chain phase. Adding
      // material lag again changes its wavelength and doubles the caudal delay.
      if (action.phaseOwnedJoints?.includes(prm.joint)) continue;
      // A chain joint with no authored keys inherits its predecessor's motion, attenuated, so the chain lashes base→tip.
      const own = tracks[prm.joint] ?? [REST_KEY];
      const src: readonly Keyframe[] = own.some((k) => k.value !== 0) ? own : prev.map((k) => ({ ...k, value: k.value * CHAIN_ATTENUATION }));
      prev = src;
      const keys: Keyframe[] = [];
      for (const k of src) {
        keys.push({ ...k, ms: k.ms + prm.lagMs, t: bodyMs ? (k.ms + prm.lagMs) / bodyMs : 0, value: k.value * (1 + prm.overshoot) });
        if (prm.overshoot > 0 && k.value !== 0) keys.push({ ms: k.ms + prm.lagMs * 1.6, t: bodyMs ? (k.ms + prm.lagMs * 1.6) / bodyMs : 0, value: k.value, ease: 'sine-in-out' });
      }
      if (!action.loop) { keys[0] = { ...(keys[0] as Keyframe), ms: 0, t: 0 }; keys.push({ ms: bodyMs + prm.lagMs * 1.6, t: 1, value: 0, ease: 'ease-out' }); }
      keys.sort((a, b) => a.ms - b.ms);
      maxLag = Math.max(maxLag, prm.lagMs * 1.6);
      secondary.push({ ...prm, keys });
    }
  }
  const rule = secondary[0];
  const body: Omit<MotionTimeline, 'hash'> = {
    kind: 'motion-timeline', actionId: action.id, family: action.family, loop: action.loop, seed, recipeHash: card.recipeHash, massClass: card.massClass.name,
    limitsRad: Object.fromEntries(Object.entries(card.bounds.limitsDeg).map(([j,l])=>[j,card.projectionSigns?.[j]===-1?{min:-l.max*DEG,max:-l.min*DEG}:{min:l.min*DEG,max:l.max*DEG}])),
    bodyMs, durationMs: action.loop ? bodyMs : bodyMs + maxLag, phases, tracks, root: { dx: rootKeys('dx'), dy: rootKeys('dy') }, secondary,
    deform: { squash: rule?.squash ?? 0, stretch: rule?.stretch ?? 0 },
    hitstopMs: action.family === 'melee' ? hitstopMs(mass) : 0, luminousPulseMs: card.luminous ? 1800 : 0, clamped, notes,
  };
  const base:MotionTimeline={...body,hash:fnv1a(JSON.stringify(body))};
  const envelope=faintStanceEnvelope(card,base,ms=>sampleTimeline(base,ms));
  if(!envelope)return base;
  const adapted=applyStanceEnvelope(base,envelope);
  return {...adapted,hash:fnv1a(JSON.stringify(adapted))};
}
const wrap = (tl: MotionTimeline, ms: number): number => tl.loop ? ((ms % tl.bodyMs) + tl.bodyMs) % tl.bodyMs : Math.min(Math.max(ms, 0), tl.durationMs);
/** Limits apply after easing and material overshoot, in the projected joint basis. */
export function boundedJoint(tl:MotionTimeline,joint:string,value:number):number{
 const l=tl.limitsRad[joint];if(!l||!Number.isFinite(value))throw Error('motion: invalid joint sample '+joint);
 return Math.max(l.min,Math.min(l.max,value));
}
export function sampleTimeline(tl: MotionTimeline, ms: number): MotionPose {
  const at = wrap(tl, ms), joints: Record<string, number> = {};
  for (const [joint, keys] of Object.entries(tl.tracks)) joints[joint] = sampleKeys(keys, at);
  for (const s of tl.secondary) {
    // Looping secondaries wrap their lag; one-shots extend past the body's last key.
    const t = tl.loop ? ((at - s.lagMs) % tl.bodyMs + tl.bodyMs) % tl.bodyMs + s.lagMs : at;
    joints[s.joint] = s.rigid ? sampleKeys(tl.tracks[s.joint] ?? [], at) : sampleKeys(s.keys, t);
  }
  for(const j of Object.keys(joints))joints[j]=boundedJoint(tl,j,joints[j]!);
  const dx = sampleKeys(tl.root.dx, at), dy = sampleKeys(tl.root.dy, at);
  const vx = sampleKeys(tl.root.dx, Math.min(at + 1, tl.durationMs)) - dx, vy = dy - sampleKeys(tl.root.dy, Math.max(at - 1, 0));
  const launch = Math.min(1, Math.max(0, vx / 0.004)), land = dy >= -0.001 ? Math.min(1, Math.max(0, vy / 0.001)) : 0;
  const stretch = tl.deform.stretch * launch, squash = tl.deform.squash * land;
  return { ms: at, joints, root: { dx, dy, rotation: joints.root ?? 0 }, scale: { x: 1 + stretch - squash * 0.5, y: 1 - stretch + squash } };
}
