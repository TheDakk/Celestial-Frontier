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

/** READY spacing (C15 2026-09-25, Codex's Sturgeon/Cougar/Otter/Bear/Reef Shark finding: wide painted bodies overlapped on the 1/3–2/3 stands
 * before anyone moved, and the run-up collapsed to its 0.15 floor — ±0.018 of the frame). The two painted boxes at rest keep at least
 * READY_GAP of the frame between them and EDGE_MARGIN from the frame's sides: the stands spread outward first; only when the frame
 * cannot hold both do the non-guardian bodies scale down (a guardian keeps its decided fill, D2). Frame-width fractions. */
export const READY_GAP = 0.10, EDGE_MARGIN = 0.02;
export interface ReadySpacing { readonly centres: Readonly<{ left: number; right: number }>; readonly fit: Readonly<{ left: number; right: number }>; }
/** Pure: box centres cL < cR and half-widths at the drawn scale → spread centres (and a scale factor per side when the frame is too narrow). */
export function readySpacing(cL: number, cR: number, hwL: number, hwR: number, guardian: Readonly<{ left: boolean; right: boolean }> = { left: false, right: false }): ReadySpacing {
  let fL = 1, fR = 1;
  const room = 1 - 2 * EDGE_MARGIN - READY_GAP; // the frame holds both full boxes plus the gap only if 2·(hwL + hwR) ≤ room
  if (2 * (hwL + hwR) > room) {
    const fixed = (guardian.left ? hwL : 0) + (guardian.right ? hwR : 0), scalable = (guardian.left ? 0 : hwL) + (guardian.right ? 0 : hwR);
    const f = scalable > 0 ? Math.max(0, Math.min(1, (room / 2 - fixed) / scalable)) : 1;
    if (!guardian.left) fL = f; if (!guardian.right) fR = f;
  }
  const hl = hwL * fL, hr = hwR * fR, need = hl + hr + READY_GAP;
  if (cR - cL >= need) return Object.freeze({ centres: Object.freeze({ left: cL, right: cR }), fit: Object.freeze({ left: fL, right: fR }) });
  const minL = EDGE_MARGIN + hl, maxR = 1 - EDGE_MARGIN - hr, extra = need - (cR - cL);
  let l = cL - extra / 2, r = cR + extra / 2;
  if (l < minL) { r += minL - l; l = minL; } if (r > maxR) { l -= r - maxR; r = maxR; } if (l < minL) l = minL; // a guardian that alone overfills keeps the best spread
  return Object.freeze({ centres: Object.freeze({ left: l, right: r }), fit: Object.freeze({ left: fL, right: fR }) });
}

export function placeCombatants(input: PlacementInput): Placement {
  const { layout } = input, frame = layout.frame;
  const pl = combatantPresentation(input.left.rig, input.left.mass, frame, layout.stands.left.y), pr = combatantPresentation(input.right.rig, input.right.mass, frame, layout.stands.right.y);
  const habitat = selectHabitatArena({ contextId: input.contextId, seed: input.seed, round: 0, kind: 'wild', worlds: input.worlds, groundLineY: layout.groundLineY, fitToBand: true,
    left: { record: input.left.record, genome: input.left.genome, label: input.left.label, painted: pl }, right: { record: input.right.record, genome: input.right.genome, label: input.right.label, painted: pr } });
  if (habitat.status === 'UNSUPPORTED') return Object.freeze({ status: 'UNSUPPORTED', habitat });
  const L = habitat.stands.left, R = habitat.stands.right;
  const hw0 = (rig: BattleRigV1, k: number) => (rig.bounds.width * rig.cutout.width * k) / (2 * frame.width);
  const ready = readySpacing(layout.stands.left.x, layout.stands.right.x, hw0(input.left.rig, pl.scale * L.fit), hw0(input.right.rig, pr.scale * R.fit), { left: Boolean(input.left.rig.guardian), right: Boolean(input.right.rig.guardian) });
  const fitted = pl.capped || pr.capped || L.fit < 1 || R.fit < 1 || ready.fit.left < 1 || ready.fit.right < 1, scales = { left: pl.scale * L.fit * ready.fit.left, right: pr.scale * R.fit * ready.fit.right };
  const shift = { left: standCentreShift(input.left.rig, scales.left, frame.width, 1), right: standCentreShift(input.right.rig, scales.right, frame.width, -1) };
  // a GROUND fighter stands on its composed stand line (the ground line, or a guardian's foreground line); air/water take their band
  const yOf = (side: 'left' | 'right', h: typeof L) => (h.medium === 'ground' ? layout.stands[side].y : h.y);
  const staged: ArenaLayout = { ...layout, stands: Object.freeze({ left: Object.freeze({ x: ready.centres.left + shift.left, y: yOf('left', L) }), right: Object.freeze({ x: ready.centres.right + shift.right, y: yOf('right', R) }) }) };
  const wet = L.medium === 'water' || R.medium === 'water';
  const side = L.medium === 'water' && R.medium === 'ground' ? ('left' as const) : R.medium === 'water' && L.medium === 'ground' ? ('right' as const) : undefined;
  return Object.freeze({ status: 'READY', habitat, layout: staged, ...(fitted ? { presentationScales: Object.freeze(scales) } : {}), ...(wet ? { water: Object.freeze({ surfaceY: habitat.surfaceY, ...(side ? { side } : {}) }) } : {}) });
}
