export interface CheckedCreature {
  scaffold: string;
  genome: Record<string, unknown>;
  pose: string;
  /** Set when the creature was composed with a forced variant: that variant's part id. */
  variant?: string;
  /** Set when the finding came from the shift sweep. */
  shift?: { head: readonly [number, number]; tail: readonly [number, number] };
}
export interface DetachedCreature extends CheckedCreature {
  shift: { head: readonly [number, number]; tail: readonly [number, number] };
  /** Slots drawn outside the body's 4-connected region (torso, tail, farLimbs, nearLimbs, head, eyes, back, headFeature, glow). */
  off: string[];
}
export interface HiddenPart extends CheckedCreature {
  shift: { head: readonly [number, number]; tail: readonly [number, number] };
  /** The requested part that shows too little, compared with the same recipe minus that part. */
  partId: string;
  /** Pixels that change when the part is removed (counted up to `needed`). */
  visible: number;
  /** HIDDEN_MIN, or the part's own drawn pixel count when that is smaller. */
  needed: number;
}
export interface PackSummary {
  parts: number;
  byFamily: Record<string, number>;
  bySlot: Record<string, number>;
  byTier: Record<string, number>;
  scaffolds: number;
  fallbacks: number;
  colours: number;
  ramps: number;
}
export interface PackReport {
  ok: boolean;
  parseError: string | null;
  summary: PackSummary | null;
  sampled: string;
  composed: number;
  /** Forced variants composed (one creature each, in every pose): part types with more than one variant. */
  variants: number;
  gaps: { gap: string; count: number; error: boolean }[];
  edge: CheckedCreature[];
  detached: DetachedCreature[];
  /** Requested parts that show too few pixels in a composed pose and shift. */
  hidden: HiddenPart[];
  structure: string[];
  unreachable: string[];
  /** Distinct compose errors (a missing fallback), each naming the family, tier and the scaffold that needed it. */
  failures: string[];
}
export const REQUIRED_POSES: readonly string[];
export const SAMPLED: string;
export const HIDDEN_MIN: number;
/** For a picture assembled from the label catalogue (pixel value = slot label); null when it is one 4-connected region. */
export function detachedSlots(buffer: { w: number; h: number; pixels: Uint8Array }): string[] | null;
export function checkPack(text: string): PackReport;
export function formatReport(report: PackReport): string;
