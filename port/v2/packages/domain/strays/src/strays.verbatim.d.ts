/* Hand-written types for the auto-lifted strays.
   ⚠ hdGenesFor: the Earth-bestiary branch calls _earthArt (SpeciesArt app
   module, Phase 4 art port) as a free identifier inside try/catch. No fixture
   genome carries _earthName/_earthBlend, so parity is unaffected; an
   Earth-NAMED portrait through THIS lift would silently skip its recipe.
   Recorded gap — closes with the SpeciesArt port, not Gate B. */
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
