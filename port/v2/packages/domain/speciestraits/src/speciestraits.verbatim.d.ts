/* Hand-written types for the auto-lifted SpeciesTraits body (verbatim v1.8.9). */
export interface GradeTier { t: number; name: string; pre: string; hex: string; star: string; }
export interface Grade { tier: number; name: string; label: string; hex: string; hue: string; star: string; glow: boolean; }
export interface DisplayRarity { t: number; id: string; name: string; hex: string; }
export const GRADE_TIERS: readonly GradeTier[];
export const RARITY_V17: readonly DisplayRarity[];
export const TIER_MAX: number;
export function displayRarity(rawScore: number): DisplayRarity;
export function rarityRoll(seed: number, salt: number): number;
export function colorGrade(kindHue: number | string, seed: number, opts: { salt?: number; boost?: number; force?: number } | null): Grade;
export function spectral(domain: string, seed: number, opts: { salt?: number; boost?: number; force?: number } | null): Record<string, unknown>;
export function speciesName(seed: number): string;
export function habOf(g: Record<string, unknown>): string;
export function locoOf(g: Record<string, unknown>): string;
export function floraFormOf(g: Record<string, unknown>): string;
export const SPECTRA: Readonly<Record<string, unknown>>;
export const SP_COLOR: readonly unknown[]; export const SP_HEX: readonly string[];
export const FA_BODY: readonly string[]; export const FA_LOCO: readonly string[];
export const FA_TRAIT: readonly string[]; export const FA_SIZE: readonly string[];
export const FA_SIZE_M: readonly number[]; export const FA_DIET: readonly string[];
export const FA_HEAD: readonly string[]; export const FA_LIMBS: readonly unknown[];
export const FA_SKIN: readonly string[]; export const FA_TAIL: readonly string[];
export const FA_PATTERN: readonly string[]; export const FA_EYES: readonly string[];
export const FA_BEHAVIOR: readonly string[]; export const FA_HABITAT: readonly string[];
export const FA_TEMPER: readonly string[]; export const FA_SENSE: readonly string[];
export const FA_REPRO: readonly string[]; export const FA_LIFE: readonly string[];
export const FA_METAB: readonly string[]; export const FLORA_FORM: readonly string[];
export const FLORA_DETAIL: readonly string[]; export const FUNGI_FORM: readonly string[];
export const MICROBE_FORM: readonly string[]; export const EX_HABITAT: readonly string[];
export const EX_LOCO: readonly string[]; export const AQ_FLORA_FORM: readonly string[];
export const AIR_FLORA_FORM: readonly string[];
