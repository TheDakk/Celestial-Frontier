/* A Rest, committed: one press on a hurt companion, in one receipt, or nothing at all.

   Dakk's decision D13 (2026-09-25); the legacy game has no Rest ("Wounds never fade on their own", its guide,
   19430). As D13 is written:
   - Rest heals on the clock of active play: 2 minutes for each 0.1 of hurt, rounded up, 20 at most (`restMinutes`);
   - one receipt seals the heal: the hurt goes to nothing at once and the companion is given the assignment
     `rest:<readyAt>`, where `readyAt` is the active play this receipt commits plus the Rest's length. Until the
     clock of active play reaches that boundary the companion is held from breeding, combat, dispatch and Feed
     (`companionLock`); at the boundary exactly it is free. So every reader of its hurt agrees at every moment and
     nothing is written later. Nothing heals while the game is closed, and the device's clock never enters;
   - the first recovery from Injured or worse (0.3) is the bond memory `recovered:injured`.
   A companion that already rests, is away or recovers cannot begin a Rest. The rules' numbers are
   `@cf/domain-acquisition`'s (`companion-care.ts`, `companion-availability.ts`), the painted port's for D13; its
   own action (`rest.ts`) works on the second ownership model and is not used. */
import { createCreatureInstanceV1 } from '@cf/domain-acquisition';
import {
  COMPANION_INJURED_HURT_V1, COMPANION_RECOVERED_MEMORY_V1, companionRestMissionIdV1, withCompanionBondMemoriesV1,
} from '@cf/domain-acquisition/companion-care';
import type { SaveStateV2, V5Extensions } from '@cf/persistence';
import { bondOf, companionLock, restMinutes } from './bond';
import { commitCare, refuse, settleCare, type CareAuthority, type CareDoor, type CareOutcome } from './commit';
import { compendiumRow, contentsOf, ownershipOf, stageOwnership } from './ownership';

export const REST_ACTION = 'rest' as const;
export const REST_RECEIPT_KIND_V1 = 'care-rest-v1' as const;

export interface RestFactsV1 {
  readonly speciesId: string;
  readonly name: string;
  readonly hurtBefore: number;
  /** The Rest's length in minutes of active play. */
  readonly minutes: number;
  /** The active play this receipt committed, and the boundary at which the companion is free again. */
  readonly startedAtActivePlayMs: number;
  readonly readyAtActivePlayMs: number;
  /** This Rest is its first recovery from Injured or worse: a bond memory. */
  readonly recovered: boolean;
  readonly bond: Readonly<{ levelBefore: number; levelAfter: number; memories: number }>;
}
export type RestActionOutcomeV1 = CareOutcome<RestFactsV1>;
export interface RestActionInputV1 {
  readonly runtime: CareAuthority;
  /** The last stored state. */
  readonly state: SaveStateV2;
  /** The Compendium id of the companion. */
  readonly speciesId: string;
  readonly codecNow: number;
}

/** The beast a Rest is for; raises a `CareRefusal` when the Compendium holds no such beast. */
function beastOf(extensions: V5Extensions, speciesId: string) {
  const ownership = ownershipOf(extensions);
  const row = compendiumRow(ownership, speciesId);
  if (row === null) return refuse('not-in-compendium');
  if (row.species.kingdom !== 'fauna') return refuse('not-a-beast');
  if (row.creature === null) return refuse('no-creature');
  return { ownership, creature: row.creature };
}

/** Commits one Rest. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export function commitRestV1(input: RestActionInputV1): Promise<RestActionOutcomeV1> {
  const { speciesId } = input;
  return commitCare<RestFactsV1>({
    runtime: input.runtime, state: input.state, codecNow: input.codecNow, receiptKind: REST_RECEIPT_KIND_V1,
    route: () => ({ operation: `care.rest:${speciesId}` }),
    preflight: (_state, extensions) => { beastOf(extensions, speciesId); },
    stage: ({ draft, extensions, activePlayMs }) => {
      const { ownership, creature } = beastOf(extensions, speciesId);
      // A companion already held is told so before it is told it is whole: a resting beast holds no hurt.
      const lock = companionLock(creature, activePlayMs);
      if (lock !== null) return refuse(lock);
      const hurtBefore = creature.hurt ?? 0;
      const minutes = restMinutes(creature.hurt);
      if (minutes === 0) return refuse('rest:healthy');
      const readyAtActivePlayMs = activePlayMs + minutes * 60_000;
      const recovered = hurtBefore >= COMPANION_INJURED_HURT_V1 && !(creature.bond?.memories ?? []).some(({ id }) => id === COMPANION_RECOVERED_MEMORY_V1);
      const rested = createCreatureInstanceV1({
        ...creature,
        hurt: null,
        assignment: { kind: 'mission', missionId: companionRestMissionIdV1(readyAtActivePlayMs) },
        bond: recovered ? withCompanionBondMemoriesV1(creature.bond, [{ id: COMPANION_RECOVERED_MEMORY_V1, kind: 'recovery' }], activePlayMs) : creature.bond,
      });
      const extensionWrites = stageOwnership({
        draft, extensions, parent: ownership, touched: [speciesId],
        contents: { ...contentsOf(ownership), creatures: ownership.creatures.map((row) => row === creature ? rested : row) },
      });
      return {
        facts: Object.freeze({
          speciesId, name: draft.codex.find(([id]) => id === speciesId)?.[1].name ?? '', hurtBefore, minutes, startedAtActivePlayMs: activePlayMs, readyAtActivePlayMs, recovered,
          bond: Object.freeze({ levelBefore: bondOf(creature.bond?.memories.length ?? 0).level, levelAfter: bondOf(rested.bond?.memories.length ?? 0).level, memories: rested.bond?.memories.length ?? 0 }),
        }),
        extensionWrites,
      };
    },
    verify: (stored, facts) => {
      const g = stored.codex.find(([id]) => id === facts.speciesId)?.[1].g;
      const assignment = g?.assignment as { kind?: unknown; missionId?: unknown } | undefined;
      return g === undefined || (Number(g.hurt) || 0) !== 0 ? 'hurt'
        : assignment?.kind !== 'mission' || assignment.missionId !== companionRestMissionIdV1(facts.readyAtActivePlayMs) ? 'rest'
          : ((g.bond as { memories?: unknown[] } | undefined)?.memories?.length ?? 0) !== facts.bond.memories ? 'bond' : null;
    },
  });
}

/** One Rest as the page makes it. */
export function settleRestV1(deps: Readonly<{ door: CareDoor }>, input: Pick<RestActionInputV1, 'speciesId' | 'codecNow'>): Promise<RestActionOutcomeV1> {
  return settleCare(deps.door, REST_ACTION, (runtime, durable) => commitRestV1({ ...input, runtime, state: durable }));
}
