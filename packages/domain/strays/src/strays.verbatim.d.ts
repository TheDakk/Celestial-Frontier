/* Hand-written types for the auto-lifted strays.
   hdGenesFor: the current game's two Earth-bestiary branches, which called
   _earthArt (a free identifier) inside try/catch, are cut from this lift.
   hdGenesFor applies no Earth recipe: an Earth-named or Earth-blended genome
   gets its procedural genes, and an Earth-named one also its _earthName mark.
   No fixture genome's result depended on those branches. */
/* EDITED 2026-11-21 (task m3a-14, Dakk's word): the comment above described the cut _earthArt call; corrected, comment text only. */
import type { Genome } from '@cf/domain-genome';
import type { BattleStats, Combatant } from '@cf/domain-combatcore';

export function _r2(n: number): number;
export interface Where { type: string; gal?: Record<string, unknown>; star?: Record<string, unknown>; pseed?: number; }
export function encodeWhere(w: Where, name?: string): string;
export function decodeWhere(code: string): { where: Where; name: string | null } | null;
export function winEstimate(champ: Partial<Combatant> & { genome?: unknown; stats?: BattleStats }, native: { genome: unknown; stats?: BattleStats; [k: string]: unknown }): number;
export function floraStat(g: { seed?: number } | null | undefined): string;
export const BIOME_SETS: Readonly<Record<string, ReadonlyArray<Record<string, unknown>>>>;
export function biomeFor(P: { seed: number; type?: string }, band: string): Record<string, unknown> | null;
export function hdGenesFor(g: Genome | Record<string, unknown>): Record<string, unknown>;
export function _sanitizeSavedGenome(g: unknown): Record<string, unknown> | null;
/* Phase 2 additions — the codex-import grade path + the view sanitizer */
export function _sanitizeView(v: unknown): Record<string, unknown> | null;
export const REGIONS: ReadonlyArray<{ name: string; sigs: number; r: number }>;
export const RING_SPECTRUM: ReadonlyArray<{ cap: number; n: string; note: string }>;
export const ASC_RING_R: number;
export function regionAt(x: number, y: number): number;
export function gradeCapAt(where: unknown): number;
export function ringGrade(g: Record<string, unknown> | null | undefined, grade: Record<string, unknown> | null | undefined, where: unknown): Record<string, unknown> | null | undefined;
