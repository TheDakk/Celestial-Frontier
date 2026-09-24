/** ONE placement pipeline for a battle (2026-09-24): the app wiring, the film harness and the tests all place both fighters
 * through it, so what the tests prove is what the game draws. Size (combatantPresentation: mass → width cap → tallest pose
 * inside the frame above its stand) → habitat (medium, band, band fit) → drawn scale → each painted box centred on its stand →
 * the wet arena (a full lake, or only the swimmer's half facing a ground fighter). */
import type { ArenaWorld, HabitatRecord } from '../battle-habitat.js';
import type { ArenaLayout } from './arena.js';
import type { BattleRigV1 } from './fixture-rig.js';
import { selectHabitatArena, type HabitatArenaResult } from './habitat-arena.js';
import { combatantPresentation, standCentreShift, type BattleStageOptions } from './stage.js';

export interface PlacementSide { readonly rig: BattleRigV1; readonly mass: number; readonly record: HabitatRecord | null; readonly genome: Readonly<Record<string, unknown>> | null; readonly label: string; }
export interface PlacementInput { readonly contextId: string; readonly seed: number; readonly layout: ArenaLayout; readonly worlds: Readonly<{ home: ArenaWorld; visitor: ArenaWorld }> | null; readonly left: PlacementSide; readonly right: PlacementSide; }
export type Placement =
  | Readonly<{ status: 'UNSUPPORTED'; habitat: Extract<HabitatArenaResult, { status: 'UNSUPPORTED' }> }>
  | Readonly<{ status: 'READY'; habitat: Extract<HabitatArenaResult, { status: 'READY' }>; layout: ArenaLayout;
      /** only when something was capped or fitted — otherwise the stage's own rule gives the same scales */
      presentationScales?: Readonly<{ left: number; right: number }>; water?: NonNullable<BattleStageOptions['water']> }>;

export function placeCombatants(input: PlacementInput): Placement {
  const { layout } = input, frame = layout.frame;
  const pl = combatantPresentation(input.left.rig, input.left.mass, frame, layout.stands.left.y), pr = combatantPresentation(input.right.rig, input.right.mass, frame, layout.stands.right.y);
  const habitat = selectHabitatArena({ contextId: input.contextId, seed: input.seed, round: 0, kind: 'wild', worlds: input.worlds, groundLineY: layout.groundLineY, fitToBand: true,
    left: { record: input.left.record, genome: input.left.genome, label: input.left.label, painted: pl }, right: { record: input.right.record, genome: input.right.genome, label: input.right.label, painted: pr } });
  if (habitat.status === 'UNSUPPORTED') return Object.freeze({ status: 'UNSUPPORTED', habitat });
  const L = habitat.stands.left, R = habitat.stands.right;
  const fitted = pl.capped || pr.capped || L.fit < 1 || R.fit < 1, scales = { left: pl.scale * L.fit, right: pr.scale * R.fit };
  const shift = { left: standCentreShift(input.left.rig, scales.left, frame.width, 1), right: standCentreShift(input.right.rig, scales.right, frame.width, -1) };
  const staged: ArenaLayout = { ...layout, stands: Object.freeze({ left: Object.freeze({ x: layout.stands.left.x + shift.left, y: L.y }), right: Object.freeze({ x: layout.stands.right.x + shift.right, y: R.y }) }) };
  const wet = L.medium === 'water' || R.medium === 'water';
  const side = L.medium === 'water' && R.medium === 'ground' ? ('left' as const) : R.medium === 'water' && L.medium === 'ground' ? ('right' as const) : undefined;
  return Object.freeze({ status: 'READY', habitat, layout: staged, ...(fitted ? { presentationScales: Object.freeze(scales) } : {}), ...(wet ? { water: Object.freeze({ surfaceY: habitat.surfaceY, ...(side ? { side } : {}) }) } : {}) });
}
