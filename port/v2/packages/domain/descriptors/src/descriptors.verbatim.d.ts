/* Hand-written types for the auto-lifted Descriptors body (verbatim v1.8.9).
   The .js must not be edited; THIS file is where the typing lives.
   Descriptor shapes are typed loosely on purpose — the golden corpus and the
   fingerprint, not the type system, pin the exact fields. */

export interface Descriptor {
  title: string; sub?: string; rows: Array<[string, string] | [string, string, string] | [string, string, string, string]>;
  thumb?: unknown; thumbSq?: boolean; logId?: string; notable?: boolean;
  badge?: string | null; designation?: Record<string, unknown>;
  species?: unknown[]; planetSeed?: number; planetName?: string; ptype?: string;
  [k: string]: unknown;
}
type P = Record<string, unknown>;

export function galaxyStats(g: P): Record<string, unknown>;
export function fmtBig(n: number): string;
export function roman(n: number): string;
export function describePick(p: P): Record<string, unknown> | null;
export function slimGal(g: P | null | undefined): Record<string, unknown> | null;
export function starDescriptor(seed: number): Descriptor;
export function planetDescriptor(P: P, sys: P | null | undefined, pl: P | null | undefined): Descriptor;
export function moonDescriptor(pl: P, m: P): Descriptor;
export function galaxyDescriptor(g: P): Descriptor;
export function wormholeDescriptor(): Descriptor;
export function cmbDescriptor(): Descriptor;
export function oortDescriptor(seed: number): Descriptor;
export function kuiperDescriptor(sys: P, seed: number): Descriptor;
export function visitorDescriptor(seed: number): Descriptor;
export function beltDescriptor(sys: P, seed: number): Descriptor;
export const SOL_MOONS: Readonly<Record<string, unknown>>;
