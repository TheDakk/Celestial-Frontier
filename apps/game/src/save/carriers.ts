/* The product carriers at boot.

   Four parts of the save are kept in their own versioned carriers beside the state: which worlds have been stood
   on and named (world identity), the gear owned and worn (loot), mining, skimming and research (engineering), and
   the Compendium with its creatures (ownership). Every receipt-bearing action reads and writes them, so a save
   that has none gains them before the first action: each is made from the stored state, the four in one
   checkpoint. A carrier that exists is left byte for byte.

   The four are independent: one that cannot be read or made is refused alone, said on the bus
   (`save:carrier-refused`) at every boot, and the others are stored. The one exception is a carrier written by a
   newer build: then nothing is written and the whole page is held, by the rule the boot already keeps for a newer
   save (`boot.ts`): an older build does not advance a save a newer one wrote. A carrier that is damaged, or that
   cannot be made from the state (a world the state names by seed alone and no known address places), holds
   nothing: the system that needs it asks `ready` and waits.

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
/** `created`: made here from the state, its rows are in `writes`. `loaded`: already stored. `refused`: unreadable,
 *  or the state could not be turned into one. `waiting`: missing and makeable, but not written, because another
 *  carrier of this save was written by a newer build. */
export type CarrierStatus = 'created' | 'loaded' | 'refused' | 'waiting';
export interface CarrierRefusal {
  readonly carrier: CarrierName;
  /** The preparer's own word: `target-future` (a newer build's), `target-corrupt`, `legacy-refused`, ... */
  readonly reason: string;
}

export interface CarrierBootstrap {
  readonly status: Readonly<Record<CarrierName, CarrierStatus>>;
  /** Every carrier that could not be read or made, in order; empty when all four are created or loaded. */
  readonly refused: readonly CarrierRefusal[];
  /** A refused carrier was written by a newer build: nothing is to be written. */
  readonly newer: boolean;
  /** The rows to store, in order; empty when nothing is missing, and when `newer`. */
  readonly writes: readonly V5ExtensionWrite[];
  /** The extensions with those rows applied. */
  readonly extensions: V5Extensions;
}

/** The preparers' word for a carrier a newer build wrote. */
const NEWER_BUILD = 'target-future';

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

  const status = {} as Record<CarrierName, CarrierStatus>;
  const refused: CarrierRefusal[] = [];
  const writes: V5ExtensionWrite[] = [];
  let current = extensions;
  for (const carrier of CARRIERS) {
    const prepared = steps[carrier](current);
    if (prepared.kind === 'protected') {
      status[carrier] = 'refused';
      refused.push(Object.freeze({ carrier, reason: prepared.reason }));
    } else if (prepared.kind === 'prepared') {
      status[carrier] = 'created';
      writes.push(...prepared.writes);
      current = prepared.extensions;
    } else status[carrier] = 'loaded';
  }
  const newer = refused.some(({ reason }) => reason === NEWER_BUILD);
  if (newer) for (const carrier of CARRIERS) if (status[carrier] === 'created') status[carrier] = 'waiting';
  return Object.freeze({
    status: Object.freeze(status),
    refused: Object.freeze(refused),
    newer,
    writes: Object.freeze(newer ? [] : writes),
    extensions: newer ? extensions : current,
  });
}

export interface CarrierStart {
  /** `ready`: all four are stored. `created`: the missing ones that could be made are now stored (`boot.refused`
   *  lists any that could not). `refused`: nothing could be stored and at least one is refused. `held`: a carrier
   *  is a newer build's; nothing was written and the page is held. `not-stored`: this page may not write now, or
   *  the checkpoint did not land. */
  readonly kind: 'ready' | 'created' | 'refused' | 'held' | 'not-stored';
  /** What was prepared; null when the page may not write and nothing was looked at. */
  readonly boot: CarrierBootstrap | null;
}

type StartDeps = { runtime: SaveRuntime; loop: SaveLoop; bus?: Bus<GameEvents>; known?: LegacyEngineeringAddressInventory };

/** The boot step: stores the missing carriers of the save this page holds, in one checkpoint, and says each
 *  refusal on the bus. */
export async function startCarriers(deps: StartDeps): Promise<CarrierStart> {
  const { runtime, loop } = deps;
  const stored = loop.mayWrite() ? runtime.checkpointParent() : null;
  if (stored === null) return { kind: 'not-stored', boot: null };
  const boot = bootstrapCarriers(stored, runtime.extensions, deps.known);
  let kind: CarrierStart['kind'];
  if (boot.newer) {
    loop.protect('a part of this expedition was written by a newer build');
    kind = 'held';
  } else if (boot.writes.length === 0) kind = boot.refused.length === 0 ? 'ready' : 'refused';
  else kind = await loop.request('lifecycle', boot.writes) ? 'created' : 'not-stored';
  if (kind !== 'not-stored') {
    for (const { carrier, reason } of boot.refused) {
      try { deps.bus?.emit('save:carrier-refused', { carrier, reason }); } catch { /* the listener's own fault */ }
    }
  }
  return { kind, boot };
}

export interface CarrierWatch {
  /** Resolves when a start has run. */
  ensure(): Promise<void>;
  /** What the last start that stored or read the carriers found; null until one has. */
  state(): CarrierStart | null;
  /** Whether this carrier is stored and readable, so a system that needs it may act. */
  ready(carrier: CarrierName): boolean;
}

/** Starts the carriers the first time this page may write, whenever that is: at the boot heartbeat, or later when
 *  a hidden page is shown or another page gives the save up. Until a start has stored, read or refused them, the
 *  next gain of the save tries again. */
export function watchCarriers(deps: { runtime: SaveRuntime; loop: SaveLoop; bus: Bus<GameEvents>; known?: LegacyEngineeringAddressInventory }): CarrierWatch {
  let run: Promise<void> | null = null;
  let last: CarrierStart | null = null;
  const ensure = (): Promise<void> => run ??= startCarriers(deps).then((start) => {
    if (start.kind === 'not-stored') run = null;
    else last = start;
  }, () => { run = null; });
  deps.bus.on('save:authority', ({ writable }) => { if (writable) void ensure(); });
  // `last` is only ever a start that stored or read: a status of created or loaded there is a stored carrier.
  const ready = (carrier: CarrierName): boolean => {
    const status = last?.boot?.status[carrier];
    return status === 'created' || status === 'loaded';
  };
  return { ensure, state: () => last, ready };
}
