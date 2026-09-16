/* Motion Kit §4/§9 action overlay (work package A7). An overlay is a reviewed
 * replacement for ONE action's key-pose table of ONE template — the dev pose
 * editor exports it, a human reviews it like any table change, and the compiler
 * may adopt it as a file under motion/overlays/. It edits TEMPLATE tables only;
 * nothing here knows a creature (kit §9: one interpreter, nobody edits a clip
 * for one creature). Pure and clock-free: no Math.random, no Date.now.
 *
 * NOT imported by the game (index.ts does not re-export it) — the production
 * bundle is unchanged; tests and tools/pose-editor import it directly. */
import { DEG, EASES, QUADRUPED_ACTIONS, type Ease, type KeyPose, type MotionAction } from './actions.js';
import type { BodyCard } from './body-card.js';
import { secondaryParams } from './secondary.js';
import { isMotionFallback, resolveTemplate, type MotionTemplate } from './templates.js';
import { fnv1a, type Keyframe, type MotionTimeline, type SecondaryTrack } from './timeline.js';
import { hitstopMs, idlePeriodMs, phaseDurations } from './timing.js';

export const ACTION_OVERLAY_SCHEMA = 'cf.motion.action-overlay/v1' as const;
/** A table longer than this is a clip, not a key-pose table. */
export const MAX_OVERLAY_POSES = 16;
/** Root offsets are body lengths; a whole body length either way is already off-stage. */
export const ROOT_OFFSET_MAX = 1;

export interface OverlayPose { readonly t: number; readonly ease?: Ease; readonly joints: Readonly<Record<string, number>>; readonly root: { readonly dx: number; readonly dy: number }; }
export interface ActionOverlay {
  readonly schema: typeof ACTION_OVERLAY_SCHEMA;
  readonly templateId: string;
  readonly actionId: string;
  readonly poses: readonly OverlayPose[];
  /** Default easing for poses that carry none; below that, the base pose at the same index, then 'ease-out'. */
  readonly easing?: Ease;
}
export interface OverlayResult {
  /** A new table: every other action is the same object; the overlaid one is rebuilt. */
  readonly table: Readonly<Record<string, MotionAction>>;
  readonly action: MotionAction;
  /** FNV-1a of the resulting action (the recipe hash the compiler would see). */
  readonly hash: string;
  /** FNV-1a of the canonical overlay text (sorted joints, resolved eases). */
  readonly overlayHash: string;
  readonly overlay: ActionOverlay;
}
export type ActionTable = Readonly<Record<string, MotionAction>>;
export class OverlayError extends Error { constructor(detail: string) { super('overlay refused: ' + detail); this.name = 'OverlayError'; } }

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const refuse = (detail: string): never => { throw new OverlayError(detail); };
const sortedJoints = (joints: Readonly<Record<string, number>>): Record<string, number> => Object.fromEntries(Object.keys(joints).sort().map((k) => [k, joints[k] as number]));

/** Validate an untrusted overlay against the template's joints, limits and pose rules; returns the normalized overlay. */
export function validateActionOverlay(input: unknown, table: ActionTable = QUADRUPED_ACTIONS): ActionOverlay {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return refuse('overlay is not an object');
  const o = input as Record<string, unknown>;
  if (o.schema !== ACTION_OVERLAY_SCHEMA) return refuse(`schema "${String(o.schema)}" is not ${ACTION_OVERLAY_SCHEMA}`);
  const template = resolveTemplate(String(o.templateId));
  if (isMotionFallback(template)) return refuse(template.reason);
  const base = typeof o.actionId === 'string' ? table[o.actionId] : undefined;
  if (!base) return refuse(`template "${template.id}" has no action "${String(o.actionId)}" (known: ${Object.keys(table).join(', ')})`);
  if (o.easing !== undefined && !EASES.includes(o.easing as Ease)) return refuse(`easing "${String(o.easing)}" is not one of ${EASES.join(', ')}`);
  if (!Array.isArray(o.poses) || o.poses.length < 1 || o.poses.length > MAX_OVERLAY_POSES) return refuse(`poses must hold 1..${MAX_OVERLAY_POSES} key poses`);
  const known = new Set(template.joints);
  let prevT = 0;
  const poses = o.poses.map((raw, i): OverlayPose => {
    if (!raw || typeof raw !== 'object') return refuse(`pose ${i} is not an object`);
    const p = raw as Record<string, unknown>, at = `pose ${i}`;
    if (!isNum(p.t) || p.t <= 0 || p.t > 1) return refuse(`${at}: t=${String(p.t)} is not in (0, 1]`);
    if (p.t <= prevT) return refuse(`${at}: t=${p.t} is not after ${prevT} (t must strictly increase)`);
    prevT = p.t;
    if (p.ease !== undefined && !EASES.includes(p.ease as Ease)) return refuse(`${at}: ease "${String(p.ease)}" is not one of ${EASES.join(', ')}`);
    if (!p.joints || typeof p.joints !== 'object' || Array.isArray(p.joints)) return refuse(`${at}: joints is not an object`);
    const joints: Record<string, number> = {};
    for (const [name, deg] of Object.entries(p.joints as Record<string, unknown>)) {
      if (!known.has(name)) return refuse(`${at}: joint "${name}" is not in template ${template.id}`);
      const lim = template.limitsDeg[name];
      if (!isNum(deg)) return refuse(`${at}: ${name}=${String(deg)} is not a finite number`);
      if (lim && (deg < lim.min || deg > lim.max)) return refuse(`${at}: ${name}=${deg}° is outside [${lim.min}, ${lim.max}]`);
      joints[name] = deg;
    }
    const r = p.root as Record<string, unknown> | undefined;
    if (!r || typeof r !== 'object' || !isNum(r.dx) || !isNum(r.dy)) return refuse(`${at}: root must be {dx, dy} in body lengths`);
    if (Math.abs(r.dx) > ROOT_OFFSET_MAX || Math.abs(r.dy) > ROOT_OFFSET_MAX) return refuse(`${at}: root offset (${r.dx}, ${r.dy}) exceeds ±${ROOT_OFFSET_MAX} body lengths`);
    return p.ease === undefined ? { t: p.t, joints, root: { dx: r.dx, dy: r.dy } } : { t: p.t, ease: p.ease as Ease, joints, root: { dx: r.dx, dy: r.dy } };
  });
  if ((poses[poses.length - 1] as OverlayPose).t !== 1) return refuse('the last pose must sit at t=1 (the action returns to its terminal pose inside the body time)');
  return o.easing === undefined
    ? { schema: ACTION_OVERLAY_SCHEMA, templateId: template.id, actionId: base.id, poses }
    : { schema: ACTION_OVERLAY_SCHEMA, templateId: template.id, actionId: base.id, poses, easing: o.easing as Ease };
}

/** Pure: a new action table with `overlay.actionId` replaced, the rebuilt action, and its recipe hash. */
export function applyActionOverlay(table: ActionTable, input: unknown): OverlayResult {
  const overlay = validateActionOverlay(input, table);
  const base = table[overlay.actionId] as MotionAction;
  const poses: KeyPose[] = overlay.poses.map((p, i) => ({
    t: p.t, ease: p.ease ?? overlay.easing ?? base.poses[i]?.ease ?? 'ease-out',
    joints: Object.freeze(sortedJoints(p.joints)), root: Object.freeze({ dx: p.root.dx, dy: p.root.dy }),
  }));
  const action: MotionAction = Object.freeze({ id: base.id, family: base.family, loop: base.loop, poses: Object.freeze(poses) });
  const canonical = { schema: overlay.schema, templateId: overlay.templateId, actionId: overlay.actionId, poses: poses.map((p) => ({ t: p.t, ease: p.ease, joints: p.joints, root: p.root })) };
  return { table: Object.freeze({ ...table, [action.id]: action }), action, hash: fnv1a(JSON.stringify(action)), overlayHash: fnv1a(JSON.stringify(canonical)), overlay };
}

/** The inverse: the current table entry as an overlay (the editor's starting point). Applying it rebuilds the same timeline hash. */
export function overlayFromAction(template: MotionTemplate, action: MotionAction): ActionOverlay {
  return { schema: ACTION_OVERLAY_SCHEMA, templateId: template.id, actionId: action.id, poses: action.poses.map((p) => ({ t: p.t, ease: p.ease, joints: sortedJoints(p.joints), root: { dx: p.root.dx, dy: p.root.dy } })) };
}

/* ---------- preview timeline ----------
 * timeline.ts#buildTimeline reads the frozen QUADRUPED_ACTIONS by id, so an edited table cannot reach it
 * without a signature change (timeline.ts is outside A7's write set). This is the same construction over
 * an explicit action; tests/motion-overlay.test.ts holds it to buildTimeline hash-for-hash on every
 * shipped action, so a preview in the editor is the runtime recipe. Fold into buildTimeline when it is
 * next touched. */
const REST_KEY: Keyframe = { ms: 0, t: 0, value: 0, ease: 'ease-out' };
const CHAIN_ATTENUATION = 0.6;
export function buildActionTimeline(card: BodyCard, action: MotionAction, seed: number, notesIn: readonly string[] = card.notes): MotionTimeline {
  const mass = card.massClass.multiplier, notes = [...notesIn];
  const phases = action.family === 'idle' ? [['period', idlePeriodMs(seed, mass)] as const] : phaseDurations(action.family, mass);
  const bodyMs = phases.reduce((s, [, ms]) => s + ms, 0);
  const clamped: string[] = [];
  const tracks: Record<string, Keyframe[]> = {};
  for (const joint of ['root', ...card.parts.map((p) => p.joint)]) {
    const lim = card.bounds.limitsDeg[joint];
    tracks[joint] = [REST_KEY, ...action.poses.map((pose) => {
      let deg = pose.joints[joint] ?? 0;
      if (lim && (deg < lim.min || deg > lim.max)) { clamped.push(`${action.id}/${joint}@${pose.t.toFixed(3)}:${deg}`); deg = Math.min(lim.max, Math.max(lim.min, deg)); }
      return { ms: pose.t * bodyMs, t: pose.t, value: deg * DEG, ease: pose.ease };
    })];
  }
  const rootKeys = (pick: 'dx' | 'dy'): Keyframe[] => [REST_KEY, ...action.poses.map((p) => ({ ms: p.t * bodyMs, t: p.t, value: p.root[pick], ease: p.ease }))];
  const secondary: SecondaryTrack[] = [];
  let maxLag = 0;
  for (const part of card.secondaryParts) {
    let prev: readonly Keyframe[] = [REST_KEY];
    for (const prm of secondaryParams(part, card.realm, card.luminous)) {
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
    bodyMs, durationMs: action.loop ? bodyMs : bodyMs + maxLag, phases, tracks, root: { dx: rootKeys('dx'), dy: rootKeys('dy') }, secondary,
    deform: { squash: rule?.squash ?? 0, stretch: rule?.stretch ?? 0 },
    hitstopMs: action.family === 'melee' ? hitstopMs(mass) : 0, luminousPulseMs: card.luminous ? 1800 : 0, clamped, notes,
  };
  return { ...body, hash: fnv1a(JSON.stringify(body)) };
}
