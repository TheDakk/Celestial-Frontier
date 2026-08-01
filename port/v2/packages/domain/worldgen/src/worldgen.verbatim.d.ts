/* Hand-written types for the auto-lifted WorldGen body (verbatim v1.8.9). */
export interface Gal { x: number; y: number; size: number; sp: number; tilt: number; rot: number; seed: number; home?: boolean; quasar?: boolean; dwarf?: boolean; [k: string]: unknown; }
export interface SystemPlanet { orb: number; P: Record<string, unknown>; name?: string; [k: string]: unknown; }
export interface StarSystem { planets: SystemPlanet[]; [k: string]: unknown; }
export function galaxiesInCell(cx: number, cy: number): Gal[];
export function galaxyProfile(seed: number): Record<string, unknown>;
export function galaxyWormhole(seed: number): unknown;
export function starsInCell(seed: number, prof: Record<string, unknown>, cx: number, cy: number): unknown[];
export function fineStarsInCell(seed: number, prof: Record<string, unknown>, cx: number, cy: number): unknown;
export function systemFor(seed: number): StarSystem;
export function supernovaSites(seed: number, n: number): unknown;
export function galaxyHaze(seed: number, prof: Record<string, unknown>): unknown;   /* browser-only (canvas) — the lint's documented exception */
export const FCELL: number;
export const UNOISE: unknown;
