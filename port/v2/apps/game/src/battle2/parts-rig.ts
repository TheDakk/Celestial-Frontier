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
  /** Default `'auto'`: quadruped records use the compatibility solver, every other family the family solver. */
  readonly contact?: PartsContactMode | 'auto';
  /** The parts binding the rig was loaded from. With `contactSupports: 'observed'` the family solver models each
   * painted support by its observed skin weights (`observedContactSupports`, R2c″); the default `'rest'` keeps the
   * rest supports — measured 2026-09-21: observed supports on the crab move foot JOINTS up to 5.3 px under hit
   * loading (the painted surface, not the joint, is what that model pins), a finding handed to Codex. */
  readonly binding?: CreaturePartsBindingV1;
  readonly contactSupports?: 'rest' | 'observed';
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

export function createPartsRig(options: PartsRigOptions): PartsRig {
  const { record, rig, card, alphaBox } = options;
  const W = record.geometry.width, H = record.geometry.height;
  if (!(W > 0) || !(H > 0)) throw new TypeError('parts rig: record geometry must be positive');
  if (rig.recipeHash !== record.recipeHash || rig.templateId !== record.template.id) throw new TypeError('parts rig: record/rig identity mismatch');
  if (card.recipeHash !== null && card.recipeHash !== record.recipeHash) throw new TypeError('parts rig: card/record identity mismatch');
  const root = record.landmarks.root;
  if (!root) throw new TypeError('parts rig: record has no root landmark');
  const contactMode: PartsContactMode = options.contact === undefined || options.contact === 'auto' ? (record.template.id === 'quadruped' ? 'quadruped-compat' : 'family') : options.contact;
  // R3 re-merge (2026-09-21): the family solver models the painted support by its observed skin weights
  // (`observedContactSupports(record, binding)`, Codex's R2c″ rule) and owns nothing of the run-up when the context
  // says `travel: 'stage'`.
  const family = contactMode === 'family' ? createFamilyContactSolver(record, options.contactSupports === 'observed' && options.binding ? observedContactSupports(record, options.binding) : {}) : null;
  const compat = contactMode === 'quadruped-compat' ? createQuadrupedContactSolver(record) : null;
  const program: SkeletonPoseProgram = createSkeletonPoseProgram(familyContractForRecord(record as { template: { id: string } }), record.landmarks);
  let pending: RigPose = {}, frame = 0, refused = 0, lastError: string | null = null, applied = 0, last: CreaturePoseV1 | null = null, disposed = false;
  const owner = createCreatureRigPerformance(record, rig, [{
    id: 'stage', durationMs: 1e12, loop: false, dispose() { /* the adapter owns the rig */ },
    seek(_ms, target) { for (const [j, k] of Object.entries(pending)) target.setJoint(j, k.rotation, k.dx ?? 0, k.dy ?? 0); },
  }]);
  owner.play('stage', 0, 0);
  const resolve = (pose: CreaturePoseV1, context: RigPoseContext): CreaturePoseV1 => {
    if (compat) return compat.resolve(pose, context.planted).pose;
    // `stageDisplacement` (converted to body-length units) rides along for the solver's arena-planting contract;
    // today's solver ignores it — the one ask left for Codex (see the parts-rig test pin)
    const phase = { actionId: context.actionId, elapsedMs: context.elapsedMs, durationMs: context.durationMs, weight: context.weight, realm: card.realm, travel: context.travel, ...(context.stageDisplacement !== undefined ? { stageDisplacement: context.stageDisplacement / card.scaleLength } : {}) };
    return family!.resolve(pose, phase as Parameters<NonNullable<typeof family>['resolve']>[1]).pose;
  };
  const parts: readonly RigPartV1[] = Object.freeze(rig.parts.map((p) => Object.freeze({ id: p.id, display: p.display, pivot: Object.freeze({ x: p.pivot.x, y: p.pivot.y }), layer: p.layer })));
  const bounds = Object.freeze({ width: alphaBox.width / W, height: alphaBox.height / H, groundLineY: record.geometry.groundLineY });
  if (!(bounds.height > 0) || bounds.height > 1 || !(bounds.width > 0) || bounds.width > 1) throw new TypeError('parts rig: alpha box must lie inside the cut-out');
  const out: PartsRig = {
    kind: 'parts', label: `${PARTS_RIG_LABEL} · contact: ${contactMode} · travel: stage`, contactMode,
    travelOwner: 'stage',
    recipeHash: rig.recipeHash, templateId: rig.templateId, parts, root: rig.root, bounds,
    // E1.5 finding: the stage treats `cutout` as the rig's display-unit size; the paint-skin mesh is normalized, so it is 1×1 here.
    cutout: Object.freeze({ width: 1, height: 1 }), sourceSize: Object.freeze({ width: W, height: H }), foot: Object.freeze({ x: root[0], y: record.geometry.groundLineY }), bodyLength: card.scaleLength,
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
  return out;
}
