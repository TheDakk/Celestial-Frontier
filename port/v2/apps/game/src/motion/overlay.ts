/* Motion Kit §4/§9 action overlay (work package A7). An overlay is a reviewed
 * replacement for ONE action's key-pose table of ONE template — the dev pose
 * editor exports it, a human reviews it like any table change, and the compiler
 * may adopt it as a file under motion/overlays/. It edits TEMPLATE tables only;
 * nothing here knows a creature (kit §9: one interpreter, nobody edits a clip
 * for one creature). Pure and clock-free: no Math.random, no Date.now.
 *
 * NOT imported by the game (index.ts does not re-export it) — the production
 * bundle is unchanged; tests and tools/pose-editor import it directly. */
import { EASES, QUADRUPED_ACTIONS, type Ease, type KeyPose, type MotionAction } from './actions.js';
import { isMotionFallback, resolveTemplate, type MotionTemplate } from './templates.js';
import { fnv1a } from './timeline.js';

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

/** The editor and ordinary playback now use exactly one compiler. */
export {buildActionTimeline} from './timeline.js';
