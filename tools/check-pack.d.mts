export interface CheckedCreature {
  scaffold: string;
  genome: Record<string, unknown>;
  guardian: boolean;
  pose: string;
}
export interface DetachedCreature extends CheckedCreature {
  shift: { head: readonly [number, number]; tail: readonly [number, number] };
  /** Slots drawn outside the body's 4-connected region (torso, tail, farLimbs, nearLimbs, head, eyes, back, headFeature, glow). */
  off: string[];
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
  gaps: { gap: string; count: number; error: boolean }[];
  edge: CheckedCreature[];
  detached: DetachedCreature[];
  structure: string[];
  unreachable: string[];
  /** Distinct compose errors (a missing fallback), each naming the family, tier and the scaffold that needed it. */
  failures: string[];
}
export const REQUIRED_POSES: readonly string[];
export const SAMPLED: string;
/** For a picture assembled from the label catalogue (pixel value = slot label); null when it is one 4-connected region. */
export function detachedSlots(buffer: { w: number; h: number; pixels: Uint8Array }): string[] | null;
export function checkPack(text: string): PackReport;
export function formatReport(report: PackReport): string;
