/* Hand-written types for the auto-lifted WorldGen body (verbatim v1.8.9). */
export interface Gal { x: number; y: number; size: number; sp: number; tilt: number; rot: number; seed: number; home?: boolean; quasar?: boolean; dwarf?: boolean; [k: string]: unknown; }
/** Mutable memoized galaxy array carrying the cell's deterministic web density. */
export interface GalaxyCellGalaxies extends Array<Gal> { web: number; }
export interface SystemPlanet { orb: number; P: Record<string, unknown>; name?: string; [k: string]: unknown; }
export interface StarSystem { planets: SystemPlanet[]; [k: string]: unknown; }
export interface GalaxyStar { x: number; y: number; c: string; s: number; seed: number; sol?: boolean; [k: string]: unknown; }
export interface GalaxyDeco { k: string; x: number; y: number; [k: string]: unknown; }
export interface GalaxyCellContent { stars: GalaxyStar[]; deco: GalaxyDeco[]; }
export interface SupernovaBirth { x: number; y: number; seed: number; }
export type SupernovaRemnant = 'NS' | 'shell' | 'BH';
export interface SupernovaSite {
  x: number;
  y: number;
  remnant: SupernovaRemnant;
  seed: number;
  births: SupernovaBirth[];
}
/**
 * Return the deterministic galaxies for one intergalactic cell.
 *
 * Calls that reach an uncached ordinary generated-galaxy branch require the
 * transitional `GAL_SPRITES` binding to be installed first. Empty,
 * special-only, and already-cached cells do not necessarily read that binding.
 */
export function galaxiesInCell(cx: number, cy: number): GalaxyCellGalaxies;
export function galaxyProfile(seed: number): Record<string, unknown>;
export function galaxyWormhole(seed: number): unknown;
export function starsInCell(seed: number, prof: Record<string, unknown>, cx: number, cy: number): GalaxyCellContent;
export function fineStarsInCell(seed: number, prof: Record<string, unknown>, cx: number, cy: number): unknown;
export function systemFor(seed: number): StarSystem;
/** `epoch` is the deterministic cosmic-time key, not a requested site count. */
export function supernovaSites(galaxySeed: number, epoch: number): SupernovaSite[];
export const FCELL: number;
export const UNOISE: unknown;
