/* The product carriers at boot.

   Four parts of the save are kept in their own versioned carriers beside the state: which worlds have been stood
   on and named (world identity), the gear owned and worn (loot), mining, skimming and research (engineering), and
   the Compendium with its creatures (ownership). Every receipt-bearing action reads and writes them, so a save
   that has none gains them before the first action: each is made from the stored state, the four in one
   checkpoint. A carrier that exists is left byte for byte. A carrier this build cannot read (written by a newer
   build, or damaged) is named and nothing is written.

   The preparers are `@cf/persistence`'s; the order (world identity, loot, engineering, ownership, each seeing the
   extensions the one before left) is the painted port's boot (`main.ts`). Not carried from it, because no save
   needs them yet: the rewrite of the state's own compatibility fields from a carrier just made, and the compact
   ownership carrier that the capture actions add. */
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER } from '@cf/domain-acquisition';
import { MAX_GEAR_CAPACITY } from '@cf/domain-loot';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  createLegacyEngineeringSeedResolver,
  type LegacyEngineeringAddressInventory,
} from '@cf/domain-opportunity';
import {
  prepareArc2LootLegacyMigration,
  prepareArc3EngineeringLegacyBootstrap,
  prepareArc4OwnershipLegacyMigration,
  prepareWorldIdentityBootstrap,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import type { Bus } from '../bus';
import type { GameEvents } from '../events';
import type { SaveRuntime } from './runtime';
import type { SaveLoop } from './save-loop';

export const CARRIERS = Object.freeze(['world-identity', 'loot', 'engineering', 'ownership'] as const);
export type CarrierName = (typeof CARRIERS)[number];
/** `created`: made here from the state. `loaded`: already stored. `refused`: unreadable, or the state could not
 *  be turned into one. `skipped`: an earlier carrier was refused. */
export type CarrierStatus = 'created' | 'loaded' | 'refused' | 'skipped';

export interface CarrierBootstrap {
  readonly status: Readonly<Record<CarrierName, CarrierStatus>>;
  /** The carrier that stopped the pass, and why; null when all four are created or loaded. */
  readonly refused: { readonly carrier: CarrierName; readonly reason: string } | null;
  /** The rows to store, in order; empty when nothing is missing, and when a carrier was refused. */
  readonly writes: readonly V5ExtensionWrite[];
  /** The extensions with those rows applied. */
  readonly extensions: V5Extensions;
}

type Prepared =
  | { readonly kind: 'prepared'; readonly extensions: V5Extensions; readonly writes: readonly V5ExtensionWrite[] }
  | { readonly kind: 'already-loaded' }
  | { readonly kind: 'protected'; readonly reason: string };

const NO_ADDRESSES: LegacyEngineeringAddressInventory = Object.freeze({ worlds: Object.freeze([]), stars: Object.freeze([]) });

/** Prepares every missing carrier from `state`. `known` holds the full addresses already proven for this save
 *  (its route, its Atlas): a world or star the state names by seed alone becomes a carrier row only through one
 *  of them. Pure: nothing is stored. */
export function bootstrapCarriers(
  state: SaveStateV2,
  extensions: V5Extensions,
  known: LegacyEngineeringAddressInventory = NO_ADDRESSES,
): CarrierBootstrap {
  const steps: Record<CarrierName, (current: V5Extensions) => Prepared> = {
    'world-identity': (current) => prepareWorldIdentityBootstrap({ extensions: current, legacy: state, addresses: known.worlds }),
    loot: (current) => {
      const loot = prepareArc2LootLegacyMigration({ extensions: current, legacy: state, capacity: MAX_GEAR_CAPACITY });
      return loot.kind === 'prepared' ? { ...loot, writes: [loot.write] } : loot;
    },
    engineering: (current) => {
      const engineering = prepareArc3EngineeringLegacyBootstrap({
        extensions: current,
        // The wall-clock stamp of the last mining is not carried: a carrier counts active play.
        legacy: {
          schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
          revision: 0,
          worlds: state.mineX.map(([seed, extractionsTaken]) => ({ seed, extractionsTaken })),
          stars: state.skimX.map(([seed, extractionsTaken]) => ({ seed, extractionsTaken })),
          research: [...state.techOwned],
        },
        addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
        legacyResolver: createLegacyEngineeringSeedResolver(known),
      });
      return engineering.kind === 'prepared' ? { ...engineering, writes: [engineering.write] } : engineering;
    },
    ownership: (current) => prepareArc4OwnershipLegacyMigration({ extensions: current, legacy: state, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER }),
  };

  const status = Object.fromEntries(CARRIERS.map((name) => [name, 'skipped'])) as Record<CarrierName, CarrierStatus>;
  const writes: V5ExtensionWrite[] = [];
  let current = extensions;
  for (const carrier of CARRIERS) {
    const prepared = steps[carrier](current);
    if (prepared.kind === 'protected') {
      status[carrier] = 'refused';
      return Object.freeze({ status: Object.freeze(status), refused: Object.freeze({ carrier, reason: prepared.reason }), writes: Object.freeze([]), extensions });
    }
    status[carrier] = prepared.kind === 'prepared' ? 'created' : 'loaded';
    if (prepared.kind === 'prepared') {
      writes.push(...prepared.writes);
      current = prepared.extensions;
    }
  }
  return Object.freeze({ status: Object.freeze(status), refused: null, writes: Object.freeze(writes), extensions: current });
}

export interface CarrierStart {
  /** `ready`: nothing was missing. `created`: the missing carriers are stored. `refused`: one could not be read
   *  or made; nothing was written. `not-stored`: this page may not write now, or the checkpoint did not land. */
  readonly kind: 'ready' | 'created' | 'refused' | 'not-stored';
  /** What was prepared; null when the page may not write and nothing was looked at. */
  readonly boot: CarrierBootstrap | null;
}

/** The boot step: stores the missing carriers of the save this page holds, in one checkpoint. */
export async function startCarriers(deps: { runtime: SaveRuntime; loop: SaveLoop; known?: LegacyEngineeringAddressInventory }): Promise<CarrierStart> {
  const { runtime, loop } = deps;
  const stored = loop.mayWrite() ? runtime.checkpointParent() : null;
  if (stored === null) return { kind: 'not-stored', boot: null };
  const boot = bootstrapCarriers(stored, runtime.extensions, deps.known);
  if (boot.refused !== null) return { kind: 'refused', boot };
  if (boot.writes.length === 0) return { kind: 'ready', boot };
  return { kind: await loop.request('lifecycle', boot.writes) ? 'created' : 'not-stored', boot };
}

/** Starts the carriers the first time this page may write, whenever that is: at the boot heartbeat, or later when
 *  a hidden page is shown or another page gives the save up. `ensure` resolves when a start has run; until the
 *  carriers are stored, read or refused, the next gain of the save tries again. */
export function watchCarriers(deps: { runtime: SaveRuntime; loop: SaveLoop; bus: Bus<GameEvents> }): { ensure(): Promise<void> } {
  let run: Promise<void> | null = null;
  const ensure = (): Promise<void> => run ??= startCarriers(deps)
    .then((start) => { if (start.kind === 'not-stored') run = null; }, () => { run = null; });
  deps.bus.on('save:authority', ({ writable }) => { if (writable) void ensure(); });
  return { ensure };
}
