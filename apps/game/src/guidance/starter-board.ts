/* The Starter Charter board as data: one revealed link per chain, the accepted
   rows and the reason a row cannot be accepted
   (ported from SOURCE apps/game/src/starter-charters.ts:229-301). */
import type { SaveStateV2 } from '@cf/persistence';
import { ascStageOf } from '@cf/scene';
import {
  CHAINS,
  STARTER_CHARTER_CAP_V1,
  STARTER_CHARTER_IDS_V1,
  checkedState,
  definitionFor,
  type StarterCharterDefinitionV1,
  type StarterCharterIdV1,
} from './starter-charters';

export interface StarterCharterBoardRowV1 {
  readonly definition: StarterCharterDefinitionV1;
  readonly status: 'available' | 'accepted' | 'unavailable';
  readonly progress: number;
  readonly lockedReason: string | null;
}

export interface StarterCharterBoardV1 {
  readonly schema: 'cf-v2-starter-charters/v1';
  readonly acceptedCount: number;
  readonly cap: typeof STARTER_CHARTER_CAP_V1;
  readonly rows: readonly StarterCharterBoardRowV1[];
  readonly completedIds: readonly StarterCharterIdV1[];
  readonly weeklyBoundary: string;
}

export type StarterCharterBoardProjectionV1 =
  | Readonly<{ kind: 'projected'; board: StarterCharterBoardV1 }>
  | Readonly<{ kind: 'protected'; reason: string }>;

function nextInChain(done: ReadonlySet<string>, chain: 'trades' | 'tour'): StarterCharterIdV1 | null {
  return CHAINS[chain].find((id) => !done.has(id)) ?? null;
}

export function projectStarterCharterBoardV1(state: SaveStateV2): StarterCharterBoardProjectionV1 {
  try {
    const checked = checkedState(state);
    const done = new Set<string>(checked.done);
    const accepted = new Set<string>(checked.accepted);
    const stage = ascStageOf(state.items, state.ascCh);
    const rows: StarterCharterBoardRowV1[] = [];
    for (const id of STARTER_CHARTER_IDS_V1) {
      if (!accepted.has(id)) continue;
      const definition = definitionFor(id);
      rows.push(Object.freeze({
        definition,
        status: definition.availability === 'live' ? 'accepted' : 'unavailable',
        progress: Math.min(checked.progress[id] ?? 0, definition.count),
        lockedReason: definition.availability === 'live'
          ? null : 'This accepted Starter Charter is not yet available in v2.',
      }));
    }
    for (const chain of ['trades', 'tour'] as const) {
      const id = nextInChain(done, chain);
      if (id === null || accepted.has(id)) continue;
      const definition = definitionFor(id);
      const stageLocked = id === 'st-conq' && stage === 0;
      rows.push(Object.freeze({
        definition,
        status: definition.availability === 'live' && !stageLocked ? 'available' : 'unavailable',
        progress: Math.min(checked.progress[id] ?? 0, definition.count),
        lockedReason: definition.availability !== 'live'
          ? 'This Starter Charter remains visible until its exact lifecycle owner is available.'
          : stageLocked ? 'Build the Jump Drive before the conquest trade is revealed.' : null,
      }));
    }
    return Object.freeze({
      kind: 'projected',
      board: Object.freeze({
        schema: 'cf-v2-starter-charters/v1',
        acceptedCount: checked.accepted.length,
        cap: STARTER_CHARTER_CAP_V1,
        rows: Object.freeze(rows),
        completedIds: Object.freeze([...checked.done]),
        weeklyBoundary: 'Weekly Charters run on the expedition\u2019s own active-play clock: a new board every four hours of play; moving the device clock never resets or advances it.',
      }),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'protected', reason: error instanceof Error ? error.message : 'Charter projection failed',
    });
  }
}
