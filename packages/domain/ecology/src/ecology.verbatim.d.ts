/* Hand-written types for the auto-lifted Ecology body (verbatim v1.8.9).
   The .js must not be edited; THIS file is where the typing lives.

   ⚠ COSMIC_EPOCH: the body reads the capped ecology/world-presentation epoch
   through a typeof guard. Isolated fixture probes intentionally see 0, which
   is their captured baseline. The browser app now publishes the value from its
   injected monotonic elapsed-session clock; hidden-time and exact edge policy
   remain F4. The domain body stays verbatim.

   ⚠ planetSpecies is MEMOIZED (48-entry FIFO keyed seed_band_level_epoch) —
   the port lesson: memoized generators make call order observable. Callers
   must never mutate a returned roster. */
import type { Genome } from '@cf/domain-genome';

export interface Biosphere { level: string; key: string; }
export interface CivEra { key: string; name: string; tech: string; life: string; span: [number, number]; }
export interface Civilization {
  civ: boolean; wild?: boolean; name?: string; era?: CivEra; year?: number;
  yearLabel?: string; pop?: string; note?: string;
}
/** P is a PlanetParams-shaped object; sys a systemFor() result. r is the
    CALLER's rng stream (the survey path threads one rng through biosphere →
    civilization — consumption counts are part of the determinism contract). */
export function biosphere(P: { seed: number; type?: string }, sys: { sol?: boolean } | null | undefined, band: string, r: () => number): Biosphere;
export function civilization(P: { seed: number }, sys: unknown, band: string, bio: Biosphere, r: () => number): Civilization;
export function planetSpecies(P: { seed: number }, sys: unknown, band: string, level: string | number): Genome[];
