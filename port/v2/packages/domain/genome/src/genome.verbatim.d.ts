/* Hand-written types for the auto-lifted Genome body (verbatim v1.8.9).
   The .js must not be edited; THIS file is where the typing lives. */
import type { Grade } from '@cf/domain-speciestraits';

export interface Genome {
  seed: number; kingdom: string;
  color: number; form: number; body: number; loco: number; trait: number;
  size: number; diet: number; head: number; limbs: number; skin: number;
  tail: number; pattern: number; eyes: number; behavior: number; habitat: number;
  detail: number; accent: number; temper: number; sense: number; repro: number;
  life: number; metab: number; lumin: boolean; gen: number; heat: number;
  /* fields set later by crossGenome / guardianFor / extremophile spawning —
     absent on a fresh makeGenome output. The golden corpus, not the type
     system, pins their semantics. */
  x?: unknown; wild?: number; apex?: number; par?: number; ep?: number;
  parents?: unknown;
  [k: string]: unknown;
}
export interface SpeciesDesc {
  name: string; kind: string; grade: Grade; desc: string; detail: string;
  /* fauna-only enrichments (faunaDesc) */
  diet?: string; anatomy?: string; pattern?: string; temper?: string;
  sense?: string; repro?: string; life?: string; metab?: string;
  habitat?: string; behavior?: string;
}
export interface Guardian { genome: Genome; tier: number; name: string; }

export function makeGenome(seed: number, kingdom: string, biomeHeat: number): Genome;
export function sapienceTier(g: Genome | null | undefined): number;
export function realmBiome(g: Genome): string;
export function classifyRealm(g: Genome): string;
export function ecologyRole(g: Genome): string;
export function realmModifiers(g: Genome): string[];
export function describeSpecies(g: Genome): SpeciesDesc;
export function faunaDesc(g: Genome): SpeciesDesc;
export function speciesGrade(g: Genome): Grade;
export function guardianFor(pseed: number): Guardian | null;
export function _szOf(g: unknown): number;
export const GUARDIAN_EPITHETS: readonly string[];
export const REALM_ORDER: readonly string[];
export const REALM_ICON: Readonly<Record<string, string>>;
