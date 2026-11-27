/* A companion's bond: its level, read from the firsts it remembers.

   Dakk's decision D13 (2026-09-25); the legacy game had no bond. The levels are Wary 0, Familiar 3, Trusted 8,
   Devoted 15, Kindred 25 and Soulbound 40 memories. A memory is a distinct first (the first meal, a flavour first
   tasted, the first recovery from a real wound); memories are never lost, so a bond never decays, and a level
   opens sidegrades only, never strength in a fight. The table is `@cf/domain-acquisition`'s (`companion-care.ts`),
   the painted port's for D13. */
import { COMPANION_BOND_LEVELS_V1, projectCompanionBondV1 } from '@cf/domain-acquisition/companion-care';

export interface BondLevel { readonly level: number; readonly name: string; readonly memories: number; readonly unlock: string | null }
/** The six levels and the memories each asks. */
export const BOND_LEVELS: readonly BondLevel[] = COMPANION_BOND_LEVELS_V1;

export interface Bond {
  readonly level: number;
  readonly name: string;
  readonly memories: number;
  /** The level above and how many memories it still asks; null at the last. */
  readonly next: Readonly<{ level: number; name: string; memories: number; remaining: number; unlock: string }> | null;
}
/** The bond of a companion that holds this many memories. */
export function bondOf(memories: number): Bond {
  const stand = { length: memories } as unknown as never[];
  return projectCompanionBondV1({ level: 0, memories: stand, preferredRole: null, worldsSurvived: 0, guardianVictories: 0, mementoIds: [] });
}
