/* Hand-written types for the auto-lifted CombatCore body (verbatim v1.8.9).
   The .js must not be edited; THIS file is where the typing lives. */
import type { Genome } from '@cf/domain-genome';

export interface BattleStats {
  vit: number; fer: number; res: number; agi: number; ins: number;
  tier: number; total: number; hex: string; name: string;
  cls: string | null; lvl: number; ab: Ability;
  [k: string]: unknown;
}
export interface Ability {
  theme: string; themeLabel: string; col: string;
  [k: string]: string | number | boolean | undefined;
}
export interface Combatant { name: string; genome: Genome | { seed: number }; stats?: BattleStats; [k: string]: unknown; }
export interface DuelResult { [k: string]: unknown; }
export interface CreatureEntry { name?: string; genome: Partial<Genome> | Record<string, unknown>; xp?: number; [k: string]: unknown; }

export function battleStats(g: Genome | Record<string, unknown>): BattleStats;
export function abilityOf(g: Genome | Record<string, unknown>): Ability;
export function abilityTheme(g: Genome | Record<string, unknown>): string;
export function runDuel(a: Combatant, b: Combatant): DuelResult;
export function encodeCreature(entry: CreatureEntry, champ?: boolean): string;
export function decodeCreature(code: string): CreatureEntry | null;
export function normGenome(g: Record<string, unknown>): Genome;
export function levelOf(g: { xp?: unknown }): number;
export function playerCombatant(): Combatant;            /* app-coupled */
export function playerAvatar(): unknown;                 /* app-coupled (document) */
export function paperdollAvatar(): unknown;              /* app-coupled (document) */
export function statBlockHTML(): string;                 /* app-coupled */
export const _statOpen: Set<unknown>;                    /* app-coupled */
export const STAT_NAMES: readonly string[];
export const STAT_HUES: readonly string[];
export const DOLL_ANCHORS: Readonly<Record<string, unknown>>;
export const ABILITY_THEMES: Readonly<Record<string, unknown>>;
export const PLAYER_SEED: number;
