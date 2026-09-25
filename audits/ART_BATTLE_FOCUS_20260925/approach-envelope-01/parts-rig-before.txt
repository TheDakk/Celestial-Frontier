/** @module battle2/parts-rig [app] — BattleRigV1 kind `'parts'`: the adapter that puts Codex's
 * source paint-skin rig (`creature-rig.ts`, C2) on the battle stage (E1 design §1.1).
 *
 * Every stage pose goes through Codex's performance owner and the contact solver, never straight
 * into `rig.applyPose`, so contacts, joint limits and the paint-skin validation always run. The
 * owner is driven by one synthetic `'stage'` player whose seek replays the pose the stage handed
 * over; the clock it sees is a monotonic frame counter (the stage's turn clock restarts per turn,
 * the owner refuses time running backwards).
 *
 * Contact: the family solver (`createFamilyContactSolver`) for every family; quadruped bindings use
 * the preserved quadruped compatibility solver (the path their candidate-10 acceptance was measured
 * on) until Codex's Civet sentinel passes on the family path (R1c-b). Labelled on the rig.
 *
 * Travel: the arena run-up is the STAGE's displacement. The stage hands the solver the sampled clip's
 * own action id, so during the run-up the family solver cycles the gait (swing feet lift, stance feet
 * hold their targets in body space). Until Codex's R3 `ContactPhase.travel: 'stage'` lands the solver
 * also adds its own stride root dx (≤ one stride per cycle, body units) — a labelled interim
 * double-count next to the stage's run-up, and stance feet plant to the body rather than the ground.
 * The E1 outcome test pins world-space planting as pending R3.
 *
 * Refusal policy (R4/Q3 interim): a refused pose leaves the rig at its last valid pose (Codex's
 * rig validates a complete pose before touching any display), is counted, and never throws into
 * the stage's tick. The count is surfaced for the outcome test that requires zero in play. */
import { familyContractForRecord } from '../../../../tools/creature-animation/family-contracts.mjs';
import { transformPoint } from '../../../../tools/creature-animation/kinematics.js';
import { createSkeletonPoseProgram, type SkeletonPoseProgram } from '../../../../tools/creature-animation/skeleton-pose.mjs';
import { createFamilyContactSolver, createQuadrupedContactSolver, observedContactSupports } from '../creature-rig-contact.js';
import { buildTimeline } from '../motion/timeline.js';
import { sampleClip } from './choreography.js';
import { compileAnatomyAttack } from '../anatomy-attacks.js';
import type { MotionTimeline } from '../motion/timeline.js';
import type { CreaturePartsBindingV1 } from '../creature-rig.js';
import { createCreatureRigPerformance } from '../creature-rig-performance.js';
import type { CreaturePoseV1, CreatureRigRecordV1, CreatureRigV1 as PaintSkinRigV1 } from '../creature-rig.js';
import type { BodyCard } from '../motion/body-card.js';
import { plantedFor } from './choreography.js';
import type { BattleRigV1, PixelBox, RigPartV1, RigPose, RigPoseContext } from './fixture-rig.js';

export const PARTS_RIG_LABEL = 'source paint-skin rig (C2 parts)' as const;
export type PartsContactMode = 'family' | 'quadruped-compat';
/** The record shape both `loadCreatureRigV1` and the contact solvers read (a crab-fits / candidate-10 `record.json`). */
export type PartsRigRecord = CreatureRigRecordV1 & { readonly anatomy?: unknown };
export interface PartsRigOptions {
  readonly record: PartsRigRecord;
  /** Codex's loaded rig for this record + binding. The adapter owns its disposal. */
  readonly rig: PaintSkinRigV1;
  readonly card: BodyCard;
  /** Opaque box of the keyed cut-out in source pixels (the stage sizes combatants by it, as the fixture rig does). */
  readonly alphaBox: PixelBox;
  /** Default `'auto'`: the family solver for every family (the quadruped compatibility solver remains selectable). */
  readonly contact?: PartsContactMode | 'auto';
  /** The parts binding the rig was loaded from. With `contactSupports: 'observed'` the family solver models each
   * painted support by its observed skin weights (`observedContactSupports`, R2c″); the default `'rest'` keeps the
   * rest supports — measured 2026-09-21: observed supports on the crab move foot JOINTS up to 5.3 px under hit
   * loading (the painted surface, not the joint, is what that model pins), a finding handed to Codex. */
  readonly binding?: CreaturePartsBindingV1;
  readonly contactSupports?: 'rest' | 'observed';
  /** Morph M1: per-joint uniform scales (from `jointScalesV1`) — the SAME map the paint-skin rig was loaded with, so
   * `jointPosition`, the tallest-pose and reach probes read the morphed skeleton. */
  readonly jointScale?: Readonly<Record<string, number>>;
  /** Native archetype study measures complete published mesh envelopes on separate rigs. */
  readonly heightProbe?: 'legacy-landmarks' | 'external-painted-envelope';
}
export interface PartsRig extends BattleRigV1 {
  readonly kind: 'parts';
  readonly contactMode: PartsContactMode;
  readonly travelOwner: 'stage';
  /** Poses refused by the owner, the solver or the paint skin since creation; the rig kept its last valid pose each time. */
  refusals(): number;
  lastRefusal(): string | null;
  /** How many poses reached the rig's display (the reduced-motion test asserts exactly one). */
  applied(): number;
  /** Source cut-out pixel size. The rig's DISPLAY units are normalized cut-out units (Codex's paint-skin meshes are 0..1), so
   * `cutout` is 1×1 for the stage's placement math and this is the pixel size for anyone converting. */
  readonly sourceSize: { readonly width: number; readonly height: number };
  /** A joint's position under the last resolved pose, in DISPLAY units (normalized cut-out; multiply by `sourceSize` for pixels). */
  jointPosition(joint: string): { readonly x: number; readonly y: number } | null;
  /** The last pose the solver published (contacts already resolved), or null before the first. */
  lastPose(): CreaturePoseV1 | null;
}

/** The stage's context, or the rest context when a caller applies a bare pose. */
export const restContext = (): RigPoseContext => Object.freeze({ actionId: 'idle', elapsedMs: 0, durationMs: 1, weight: 1, planted: plantedFor('idle'), travel: 'stage' });

/** A2 stance-reach probe cap, body lengths per stance (one body length per gait cycle). */
export const STANCE_REACH_CAP = 0.5;
export function createPartsRig(options: PartsRigOptions): PartsRig {
  const { record, rig, card, alphaBox } = options;
  const W = record.geometry.width, H = record.geometry.height;
  if (!(W > 0) || !(H > 0)) throw new TypeError('parts rig: record geometry must be positive');
  if (rig.recipeHash !== record.recipeHash || rig.templateId !== record.template.id) throw new TypeError('parts rig: record/rig identity mismatch');
  if (card.recipeHash !== null && card.recipeHash !== record.recipeHash) throw new TypeError('parts rig: card/record identity mismatch');
  const root = record.landmarks.root;
  if (!root) throw new TypeError('parts rig: record has no root landmark');
  // 'auto' = the family solver for EVERY family since the R3 re-merge (2026-09-22: the Civet runs it with 0.0000 px
  // idle paw drift and zero refusals across idle/approach/hit/faint/victory); 'quadruped-compat' stays selectable
  const contactMode: PartsContactMode = options.contact === undefined || options.contact === 'auto' ? 'family' : options.contact;
  // R3 re-merge (2026-09-21): the family solver models the painted support by its observed skin weights
  // (`observedContactSupports(record, binding)`, Codex's R2c″ rule) and owns nothing of the run-up when the context
  // says `travel: 'stage'`.
  // A record that DECLARES adhesive contact pads (Codex's Tree Frog) is only solvable on its observed painted supports — the
  // pad contract says so — so it defaults to them; every other record keeps the rest-support default unchanged (2026-09-24,
  // found when the whole painted library was staged: the Tree Frog was the one archetype that could not load in the arena).
  const supports = options.contactSupports ?? (record.geometry.contactPads ? 'observed' : 'rest');
  const family = contactMode === 'family' ? createFamilyContactSolver(record, supports === 'observed' && options.binding ? observedContactSupports(record, options.binding) : {}) : null;
  const compat = contactMode === 'quadruped-compat' ? createQuadrupedContactSolver(record) : null;
  const program: SkeletonPoseProgram = createSkeletonPoseProgram(familyContractForRecord(record as { template: { id: string } }), record.landmarks, options.jointScale ? { jointScale: options.jointScale } : {});
  let pending: RigPose = {}, frame = 0, refused = 0, lastError: string | null = null, applied = 0, last: CreaturePoseV1 | null = null, disposed = false;
  // Source-declared adhesive pads use the same solve result for prepublication
  // mesh admission; old rigs retain the original performance target unchanged.
  let resolvedPads: ReturnType<NonNullable<typeof family>['resolve']> | null = null;
  if(record.geometry.contactPads&&(!family||!rig.applyContactPose))throw Error('Terminal pad publication guard required');
  const performanceRig=record.geometry.contactPads?{...rig,applyPose(pose:CreaturePoseV1){if(!resolvedPads)throw Error('Matching pad targets required');rig.applyContactPose!(pose,resolvedPads.contacts);}}:rig;
  const owner = createCreatureRigPerformance(record, performanceRig, [{
    id: 'stage', durationMs: 1e12, loop: false, dispose() { /* the adapter owns the rig */ },
    seek(_ms, target) { for (const [j, k] of Object.entries(pending)) target.setJoint(j, k.rotation, k.dx ?? 0, k.dy ?? 0); },
  }]);
  owner.play('stage', 0, 0);
  const resolve = (pose: CreaturePoseV1, context: RigPoseContext): CreaturePoseV1 => {
    if (compat) return compat.resolve(pose, context.planted).pose;
    // `stageDisplacement` is already in signed body lengths since the stance boundary (Codex's cadence contract) and
    // goes to the solver unchanged; the solver recedes stance targets by it (d8787235)
    const phase = { actionId: context.actionId, elapsedMs: context.elapsedMs, durationMs: context.durationMs, weight: context.weight, realm: card.realm, travel: context.travel, ...(context.stageDisplacement !== undefined ? { stageDisplacement: context.stageDisplacement } : {}) };
    const solved=family!.resolve(pose, phase as Parameters<NonNullable<typeof family>['resolve']>[1]);
    if(record.geometry.contactPads)resolvedPads=solved;
    return solved.pose;
  };
  // A2: the rig's stance reach — the largest stage displacement (body lengths) the family solver accepts at three
  // stance samples of the approach gait (binary search to 1/256 body length); the caller-side measurement until
  // Codex's `measureStanceReach(record)` lands. Measured 2026-09-22: crab/coconut 0.2, freshwater 0.1, mud/vent 0.07.
  let stanceReach: number | undefined;
  if (family) {
    try {
      const approach = buildTimeline(card, 'approach', 5), clip = { source: 'timeline' as const, timeline: approach };
      // cap: one body length per gait cycle (0.5 per stance) — a choreography bound, not a measurement limit. Codex's
      // 121-phase helper reads the declared-folded mud/vent fits at 0.507/0.837 forward (2026-09-22); the stage walks them
      // at the cap (0.45 after the margin) so a crab never crosses more than a body length per cycle.
      let reach = STANCE_REACH_CAP;
      // both half-cycles: each half is the other leg group's stance (the far legs that bound the reach stand in one of
      // them), then a 10 % margin — the first probe sampled one half and the freshwater/mud/vent rigs refused 14–20×
      for (const frac of [0.05, 0.25, 0.45, 0.55, 0.75, 0.95]) {
        const ms = approach.durationMs * frac, pose = sampleClip(clip, ms);
        const ok = (d: number): boolean => { try { family.resolve(pose, { actionId: approach.actionId, elapsedMs: ms, durationMs: approach.durationMs, weight: 1, realm: card.realm, travel: 'stage', stageDisplacement: d }); return true; } catch { return false; } };
        let lo = 0, hi = reach; if (ok(hi)) { reach = hi; continue; }
        for (let i = 0; i < 8; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
        reach = Math.min(reach, lo);
      }
      stanceReach = reach * 0.9;
    } catch { stanceReach = undefined; }
  }
  const bounds = Object.freeze({ width: alphaBox.width / W, height: alphaBox.height / H, groundLineY: record.geometry.groundLineY });
  const parts: readonly RigPartV1[] = Object.freeze(rig.parts.map((p) => Object.freeze({ id: p.id, display: p.display, pivot: Object.freeze({ x: p.pivot.x, y: p.pivot.y }), layer: p.layer })));
  if (!(bounds.height > 0) || bounds.height > 1 || !(bounds.width > 0) || bounds.width > 1) throw new TypeError('parts rig: alpha box must lie inside the cut-out');
  const out: PartsRig = {
    kind: 'parts', label: `${PARTS_RIG_LABEL} · contact: ${contactMode} · travel: stage`, contactMode,
    travelOwner: 'stage',
    recipeHash: rig.recipeHash, templateId: rig.templateId, parts, root: rig.root, bounds,
    // E1.5 finding: the stage treats `cutout` as the rig's display-unit size; the paint-skin mesh is normalized, so it is 1×1 here.
    cutout: Object.freeze({ width: 1, height: 1 }), sourceSize: Object.freeze({ width: W, height: H }), foot: Object.freeze({ x: root[0], y: record.geometry.groundLineY }), extent: Object.freeze({ left: root[0] - alphaBox.x / W, right: (alphaBox.x + alphaBox.width) / W - root[0], up: record.geometry.groundLineY - alphaBox.y / H }), bodyLength: card.scaleLength, tallestHeight: bounds.height, ...(stanceReach !== undefined ? { stanceReach } : {}), ...((record as { guardian?: BattleRigV1['guardian'] }).guardian ? { guardian: Object.freeze({ ...(record as { guardian?: BattleRigV1['guardian'] }).guardian }) } : {}),
    applyPose(pose: RigPose, context: RigPoseContext = restContext()): void {
      if (disposed) throw new Error('parts rig is disposed');
      pending = pose; frame += 1;
      try { last = owner.update(frame, (p) => resolve(p, context)); applied += 1; }
      catch (error) { refused += 1; lastError = error instanceof Error ? error.message : String(error); }
    },
    refusals: () => refused, lastRefusal: () => lastError, applied: () => applied, lastPose: () => last,
    jointPosition(joint) {
      const lm = record.landmarks[joint]; if (!lm) return null;
      const m = program.evaluate(last ?? {})[joint]; if (!m) return null;
      const p = transformPoint(m, { x: lm[0], y: lm[1] });
      return Object.freeze({ x: p.x, y: p.y });
    },
    dispose(): void { if (disposed) return; disposed = true; owner.dispose(); rig.dispose(); },
  };
  // D2 G6 eye finding (bear-vs-crab-01): a rearing melee lifted the head out of the frame when the REST height filled
  // it. The rig measures its TALLEST pose once at load through its own public path (applyPose → jointPosition, the
  // path the stage drives): the largest upward rise of any landmark across the clips the stage plays (approach, the
  // anatomy attacks, hit, dodge, faint, victory), added to the rest bounds. Cut-out units. Universal: measured for
  // every parts rig, applied by the stage only where a fill rule asks for it. Probe refusals are not the stage's.
  if (options.heightProbe === 'external-painted-envelope') { out.applyPose({}, restContext()); return out; }
  const topOf = (): number => { let y = Infinity; for (const j of Object.keys(record.landmarks)) { const p = out.jointPosition(j); if (p && p.y < y) y = p.y; } return y; };
  const timelines: MotionTimeline[] = [];
  for (const id of ['approach', 'hit', 'dodge', 'faint', 'victory']) { try { timelines.push(buildTimeline(card, id, 5)); } catch { /* not an action of this family */ } }
  for (let k = 0; k < 3; k++) { try { timelines.push(compileAnatomyAttack(card, 'ground', k).timeline); } catch { break; } }
  out.applyPose({}, restContext()); const restTop = topOf(); let rise = 0;
  for (const tl of timelines) for (let i = 0; i <= 12; i++) {
    const ms = tl.durationMs * (i / 12);
    out.applyPose(sampleClip({ source: 'timeline', timeline: tl }, ms), { actionId: tl.actionId, elapsedMs: ms, durationMs: tl.durationMs, weight: 1, planted: plantedFor(tl.actionId), travel: 'stage' });
    const r = restTop - topOf(); if (r > rise) rise = r;
  }
  out.applyPose({}, restContext()); refused = 0; applied = 0; lastError = null; last = null;
  Object.assign(out, { tallestHeight: bounds.height + rise });
  return out;
}
