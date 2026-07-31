/* Hand-written types for the auto-lifted CombatCore body (verbatim v1.8.9).
   The .js must not be edited; THIS file is where the typing lives. */
import type { Genome } from '@cf/domain-genome';

export interface BattleStats {
  vit: number; fer: number; res: number; agi: number; ins: number;
  [k: string]: unknown;
}
export interface Combatant { name: string; genome: Genome | { seed: number }; stats: BattleStats; [k: string]: unknown; }
export interface DuelResult { [k: string]: unknown; }
export interface CreatureEntry { name?: string; genome: Partial<Genome> | Record<string, unknown>; xp?: number; [k: string]: unknown; }

export function battleStats(g: Genome | Record<string, unknown>): BattleStats;
export function abilityOf(g: Genome | Record<string, unknown>): Record<string, unknown>;
export function abilityTheme(g: Genome | Record<string, unknown>): Record<string, unknown>;
export function runDuel(a: Combatant, b: Combatant): DuelResult;
export function encodeCreature(entry: CreatureEntry, champ?: boolean): string;
export function decodeCreature(code: string): CreatureEntry | null;
export function normGenome(g: Record<string, unknown>): Genome;
export function levelOf(xp: number): number;
export function playerCombatant(): Combatant;            /* app-coupled */
export function playerAvatar(): unknown;                 /* app-coupled (document) */
export function paperdollAvatar(): unknown;              /* app-coupled (document) */
export function statBlockHTML(): string;                 /* app-coupled */
export function _statOpen(...args: unknown[]): unknown;  /* app-coupled */
export const STAT_NAMES: readonly string[];
export const STAT_HUES: readonly string[];
export const DOLL_ANCHORS: Readonly<Record<string, unknown>>;
export const ABILITY_THEMES: Readonly<Record<string, unknown>>;
export const PLAYER_SEED: number;
