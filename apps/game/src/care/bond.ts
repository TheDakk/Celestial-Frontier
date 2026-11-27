/* A companion's bond: its level, read from the firsts it remembers.

   Dakk's decision D13 (2026-09-25); the legacy game had no bond. The levels are Wary 0, Familiar 3, Trusted 8,
   Devoted 15, Kindred 25 and Soulbound 40 memories. A memory is a distinct first (the first meal, a flavour first
   tasted, the first recovery from a real wound); memories are never lost, so a bond never decays, and a level
   opens sidegrades only, never strength in a fight. The table is `@cf/domain-acquisition`'s (`companion-care.ts`),
   the painted port's for D13.

   Also here, by the same decision: how long a Rest takes (2 minutes of active play for each 0.1 of hurt, rounded
   up, 20 at most), what holds a companion from a command (it rests, it is away, it recovers), and what its care
   card shows. A flavour stays hidden on the card until the companion has eaten a flora of it; the legacy card
   showed every taste at once (15135-15136). */
import type { CreatureInstanceV1 } from '@cf/domain-acquisition';
import { projectCompanionAvailabilityV1 } from '@cf/domain-acquisition/companion-availability';
import { COMPANION_BOND_LEVELS_V1, companionRestDurationMsV1, projectCompanionBondV1, projectCompanionTastesV1 } from '@cf/domain-acquisition/companion-care';
import { creatureCondition, type CreatureConditionLabel } from './bioscan-hazard';
import { FLAVOUR_NAMES, type Flavour } from './meals';

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

const MINUTE_MS = 60_000;
/** The minutes of active play a Rest takes for this hurt; 0 for a whole beast. */
export const restMinutes = (hurt: number | null): number => companionRestDurationMsV1(hurt) / MINUTE_MS;

/** What holds a companion from a command: it rests (until its Rest is ready), it is away on a mission, or it
    recovers after a union. A Rest and a mission lock breed, combat, dispatch and Feed; a recovery locks all but
    Feed. */
export type CompanionLock = 'resting' | 'away' | 'recovering';
/** The lock on this companion at this point of active play, or null when it is free. A Rest is over at its
    boundary exactly. */
export function companionLock(creature: Pick<CreatureInstanceV1, 'assignment'>, activePlayMs: number): CompanionLock | null {
  const availability = projectCompanionAvailabilityV1(creature, activePlayMs);
  if (availability.assignment === null) return null;
  if (availability.assignment.kind === 'recovery') return 'recovering';
  return availability.restReadyAtActivePlayMs !== null ? 'resting' : 'away';
}

export interface CompanionCare {
  readonly condition: CreatureConditionLabel;
  readonly resting: boolean;
  /** Minutes of play until a Rest under way is ready, rounded up; 0 when it does not rest. */
  readonly restMinutesLeft: number;
  /** The minutes a Rest pressed now would take; 0 when it is whole or held. */
  readonly restMinutes: number;
  readonly lock: CompanionLock | null;
  /** The two flavours it loves and the one it dislikes, by name; null for one it has not tasted yet. */
  readonly favors: ReadonlyArray<string | null>;
  readonly dislikes: ReadonlyArray<string | null>;
  readonly bond: Bond;
}
/** What a companion's care card shows at this point of active play. */
export function companionCareV1(creature: Pick<CreatureInstanceV1, 'genome' | 'hurt' | 'assignment' | 'bond'>, activePlayMs: number): CompanionCare {
  const lock = companionLock(creature, activePlayMs);
  const availability = projectCompanionAvailabilityV1(creature, activePlayMs);
  const tastes = projectCompanionTastesV1(creature);
  const named = (slot: { readonly flavour: string | null }): string | null => slot.flavour === null ? null : FLAVOUR_NAMES[slot.flavour as Flavour];
  return Object.freeze({
    condition: creatureCondition(creature.hurt).label,
    resting: lock === 'resting',
    restMinutesLeft: lock === 'resting' ? Math.ceil(availability.restRemainingActivePlayMs / MINUTE_MS) : 0,
    restMinutes: lock === null ? restMinutes(creature.hurt) : 0,
    lock,
    favors: Object.freeze(tastes.likes.map(named)),
    dislikes: Object.freeze(tastes.dislikes.map(named)),
    bond: bondOf(creature.bond?.memories.length ?? 0),
  });
}
