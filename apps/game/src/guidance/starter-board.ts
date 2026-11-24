/* The Starter Charter board as data, as the legacy game lists it
   (celestial-frontier.html of the live branch, 24826-24853 and 25153-25180):
   the accepted rows in the order they were accepted, then the one revealed
   link of each chain, then the note that stands in for a link the expedition
   cannot reach yet, and the count of Charters honoured. */
import type { SaveStateV2, V5Extensions } from '@cf/persistence';
import { ascStageOf } from '@cf/scene';
import type { CopyPart } from './next-step';
import {
  CHAINS,
  STARTER_CHARTER_CAP_V1,
  checkProven,
  checkedState,
  definitionFor,
  type StarterCharterDefinitionV1,
  type StarterCharterIdV1,
} from './starter-charters';

export interface StarterCharterBoardRowV1 {
  readonly definition: StarterCharterDefinitionV1;
  readonly status: 'available' | 'accepted';
  readonly progress: number;
  /** An available row whose deed is already done: accepting it pays on the spot (legacy 25167-25172). */
  readonly claimable: boolean;
}

export interface StarterCharterBoardV1 {
  readonly schema: 'cf-v2-starter-charters/v1';
  readonly acceptedCount: number;
  readonly cap: typeof STARTER_CHARTER_CAP_V1;
  readonly rows: readonly StarterCharterBoardRowV1[];
  readonly completedIds: readonly StarterCharterIdV1[];
  /** Shown when a chain's next link waits for the Jump Drive (legacy 24833-24836); the link itself is left off. */
  readonly lockedNote: readonly CopyPart[] | null;
  /** Charters honoured so far (legacy 25179). */
  readonly honored: number;
  readonly weeklyBoundary: string;
}

export type StarterCharterBoardProjectionV1 =
  | Readonly<{ kind: 'projected'; board: StarterCharterBoardV1 }>
  | Readonly<{ kind: 'protected'; reason: string }>;

const STARTER_IDS: ReadonlySet<StarterCharterIdV1> = new Set(CHAINS.trades.concat(CHAINS.tour));

function nextInChain(done: ReadonlySet<string>, chain: 'trades' | 'tour'): StarterCharterIdV1 | null {
  return CHAINS[chain].find((id) => !done.has(id)) ?? null;
}

const LOCKED_NOTE: readonly CopyPart[] = Object.freeze([
  Object.freeze({ icon: 'ascent' }), ' The next trade awaits the stars — build the ', Object.freeze({ icon: 'jump-drive' }), ' Jump Drive.',
]);

export function projectStarterCharterBoardV1(state: SaveStateV2, extensions: V5Extensions = {}): StarterCharterBoardProjectionV1 {
  try {
    const checked = checkedState(state);
    const done = new Set<string>(checked.done);
    const accepted = new Set<string>(checked.accepted);
    const stage = ascStageOf(state.items, state.ascCh);
    const rows: StarterCharterBoardRowV1[] = [];
    for (const id of checked.accepted) {
      if (!(STARTER_IDS as ReadonlySet<string>).has(id)) continue;
      const definition = definitionFor(id as StarterCharterIdV1);
      rows.push(Object.freeze({
        definition,
        status: 'accepted',
        progress: Math.min(checked.progress[id] ?? 0, definition.count),
        claimable: false,
      }));
    }
    let locked = false;
    for (const chain of ['trades', 'tour'] as const) {
      const id = nextInChain(done, chain);
      if (id === null) continue;
      if (id === 'st-conq' && stage === 0) { locked = true; continue; }
      if (accepted.has(id)) continue;
      const definition = definitionFor(id);
      rows.push(Object.freeze({
        definition,
        status: 'available',
        progress: Math.min(checked.progress[id] ?? 0, definition.count),
        claimable: checkProven(state, extensions, id),
      }));
    }
    const honored = state.stats.charters ?? 0;
    return Object.freeze({
      kind: 'projected',
      board: Object.freeze({
        schema: 'cf-v2-starter-charters/v1',
        acceptedCount: checked.accepted.length,
        cap: STARTER_CHARTER_CAP_V1,
        rows: Object.freeze(rows),
        completedIds: Object.freeze([...checked.done]),
        lockedNote: locked ? LOCKED_NOTE : null,
        honored: Number.isSafeInteger(honored) && honored > 0 ? honored : 0,
        weeklyBoundary: 'Weekly Charters run on the expedition\u2019s own active-play clock: a new board every four hours of play; moving the device clock never resets or advances it.',
      }),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'protected', reason: error instanceof Error ? error.message : 'Charter projection failed',
    });
  }
}
