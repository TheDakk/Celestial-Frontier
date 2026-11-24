/* The ten Starter Charters: the table and the matching of deeds to rows, as in
   the legacy game (celestial-frontier.html of the live branch, 24719-24741).

   The two chains, accept-to-activate rule, three-slot cap, already-proven
   checks, Stardust, starter gear and event filters are the legacy game's.
   `st-conq` listens for a conquest; the combat settlement completes it. */
import { isCanonicalEarthWorldAddress } from '@cf/domain-opportunity';
import { readWorldIdentity, type SaveStateV2, type V5Extensions } from '@cf/persistence';
import { isSolLandfallAddress, type CanonicalCF1WorldAddress } from '@cf/scene';

export const STARTER_CHARTER_CAP_V1 = 3;
export const STARTER_CHARTER_GEAR_OWNER_V1 = 'legacy-v1.8.9-charters' as const;

export const STARTER_CHARTER_IDS_V1 = Object.freeze([
  'st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq',
  'st-mercury', 'st-mars', 'st-giants', 'st-ice', 'st-comp',
] as const);
export type StarterCharterIdV1 = (typeof STARTER_CHARTER_IDS_V1)[number];

export type StarterCharterEventV1 =
  | Readonly<{ kind: 'landfall'; address: CanonicalCF1WorldAddress }>
  | Readonly<{ kind: 'mined'; address: CanonicalCF1WorldAddress }>
  | Readonly<{ kind: 'bioscan'; address: CanonicalCF1WorldAddress }>
  | Readonly<{ kind: 'scout-set'; scoutId: string }>
  | Readonly<{ kind: 'crafted'; baseId: string; category: string }>;

export interface StarterCharterDefinitionV1 {
  readonly id: StarterCharterIdV1;
  readonly chain: 'trades' | 'tour';
  readonly event: StarterCharterEventV1['kind'] | 'conquest';
  readonly count: number;
  readonly title: string;
  readonly description: string;
  readonly stardust: number;
  readonly gearId: 'headlamp' | 'magboots' | 'meteor' | 'fieldlegs' | 'earpiece' | null;
}

export const STARTER_CHARTER_DEFINITIONS_V1: readonly StarterCharterDefinitionV1[] = Object.freeze([
  Object.freeze({
    id: 'st-land', chain: 'trades', event: 'landfall', count: 1,
    title: 'Make planetfall',
    description: 'Land on any world — press Land on its survey card, or dive in and confirm the descent. A first footfall pays field samples.',
    stardust: 10, gearId: null,
  }),
  Object.freeze({
    id: 'st-mine', chain: 'trades', event: 'mined', count: 1,
    title: 'Prospect a dead world',
    description: 'Land on a lifeless world and press Mine Deposits — the elements stock your Cargo hold for research.',
    stardust: 15, gearId: null,
  }),
  Object.freeze({
    id: 'st-scan', chain: 'trades', event: 'bioscan', count: 1,
    title: 'Discover life',
    description: 'Land on a living world and survey its biosphere — mind the danger percentage, or send a scout. Then tame what you find.',
    stardust: 15, gearId: 'earpiece',
  }),
  Object.freeze({
    id: 'st-scout', chain: 'trades', event: 'scout-set', count: 1,
    title: 'Name a Field Scout',
    description: 'Open one of your fauna in the Compendium and press Scout — it takes the hit when a bioscan turns hostile.',
    stardust: 15, gearId: null,
  }),
  Object.freeze({
    id: 'st-conq', chain: 'trades', event: 'conquest', count: 1,
    title: 'Conquer a world',
    description: 'Press Conquer Planet on a world with fauna and pick a champion — yourself, or one of your beasts.',
    stardust: 25, gearId: null,
  }),
  Object.freeze({
    id: 'st-mercury', chain: 'tour', event: 'landfall', count: 1,
    title: 'First footfall: Mercury',
    description: 'Sol’s innermost world bakes in the glare. Stand on it — the sunward veins run rich.',
    stardust: 10, gearId: 'headlamp',
  }),
  Object.freeze({
    id: 'st-mars', chain: 'tour', event: 'landfall', count: 1,
    title: 'The red neighbor',
    description: 'Mars waited a long age for boots. Land, and read the rust from the ground.',
    stardust: 10, gearId: 'magboots',
  }),
  Object.freeze({
    id: 'st-giants', chain: 'tour', event: 'mined', count: 5,
    title: 'Wells of the giants',
    description: 'Mine Jupiter or Saturn’s deep decks — 5 loads between them.',
    stardust: 15, gearId: 'meteor',
  }),
  Object.freeze({
    id: 'st-ice', chain: 'tour', event: 'landfall', count: 1,
    title: 'The cold frontier',
    description: 'Uranus or Neptune — stand at the edge of Sol’s long dark, where the ices wait.',
    stardust: 10, gearId: 'fieldlegs',
  }),
  Object.freeze({
    id: 'st-comp', chain: 'tour', event: 'crafted', count: 1,
    title: 'A working component',
    description: 'Assemble any T2 component at the Shipyard — the Jump Drive is built from these.',
    stardust: 15, gearId: null,
  }),
]);

const DEFINITION_BY_ID = new Map(STARTER_CHARTER_DEFINITIONS_V1.map((definition) => [definition.id, definition]));
export const CHAINS: Readonly<Record<'trades' | 'tour', readonly StarterCharterIdV1[]>> = Object.freeze({
  trades: Object.freeze([
    'st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq',
  ] as StarterCharterIdV1[]),
  tour: Object.freeze([
    'st-mercury', 'st-mars', 'st-giants', 'st-ice', 'st-comp',
  ] as StarterCharterIdV1[]),
});
export const MAX_STARDUST = Number.MAX_SAFE_INTEGER;
export const MAX_CHARTER_COUNTER = Number.MAX_SAFE_INTEGER;

export function definitionFor(id: StarterCharterIdV1): StarterCharterDefinitionV1 {
  const definition = DEFINITION_BY_ID.get(id);
  if (!definition) throw new RangeError(`unknown starter Charter ${id}`);
  return definition;
}

export function checkedInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new RangeError(`${label} is outside its exact integer range`);
  }
  return value as number;
}

function checkedStarterIds(value: unknown, label: string): StarterCharterIdV1[] {
  if (!Array.isArray(value) || value.length > STARTER_CHARTER_IDS_V1.length) {
    throw new RangeError(`${label} exceeds the starter Charter bound`);
  }
  const known = new Set<string>(STARTER_CHARTER_IDS_V1);
  const seen = new Set<string>();
  const result: StarterCharterIdV1[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !known.has(id) || seen.has(id)) {
      throw new RangeError(`${label} is not canonical`);
    }
    seen.add(id);
    result.push(id as StarterCharterIdV1);
  }
  return result;
}

function checkedAcceptedIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 50) throw new RangeError('accepted Charter bound exceeded');
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || id.length < 1 || id.length > 24 || seen.has(id)) {
      throw new RangeError('accepted Charter carrier is not canonical');
    }
    seen.add(id);
    result.push(id);
  }
  return result;
}

function checkedProgress(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Charter progress must be a plain record');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('Charter progress must use a plain prototype');
  }
  const result: Record<string, number> = {};
  for (const key of Object.keys(value)) {
    if (key.length < 1 || key.length >= 24) throw new RangeError('Charter progress key is invalid');
    result[key] = checkedInteger((value as Record<string, unknown>)[key], 0, 999, `Charter progress ${key}`);
  }
  return result;
}

export function checkedState(state: SaveStateV2): Readonly<{
  done: StarterCharterIdV1[];
  accepted: string[];
  progress: Record<string, number>;
}> {
  const done = checkedStarterIds(state.chDone, 'completed starter Charters');
  const accepted = checkedAcceptedIds(state.chacc);
  if (accepted.some((id) => done.includes(id as StarterCharterIdV1))) {
    throw new RangeError('completed starter Charter remains accepted');
  }
  return Object.freeze({ done, accepted, progress: checkedProgress(state.chProg) });
}

function legacySurfaceSeed(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const seed = Number(value);
  return Number.isSafeInteger(seed) && seed >= 0 && seed <= 0xFFFF_FFFF ? seed : null;
}

function legacySurfaceSeen(state: SaveStateV2, seed: number): boolean {
  return state.surfSeen.some((value) => legacySurfaceSeed(value) === seed);
}

function exactSolLanding(
  extensions: V5Extensions,
  acceptedSeeds: ReadonlySet<number>,
): boolean {
  const identity = readWorldIdentity(extensions);
  if (identity.kind !== 'loaded') return false;
  return identity.state.records.some(({ address, landed }) => (
    landed && exactSolWorld(address, acceptedSeeds)
  ));
}

function exactSolWorld(
  address: CanonicalCF1WorldAddress,
  acceptedSeeds: ReadonlySet<number>,
): boolean {
  return isSolLandfallAddress(address) && acceptedSeeds.has(address.planet.seed);
}

/** The legacy game's replay at accept (24896-24900): a landfall Charter honours every world already in the
 *  landed set that passes its filter. `st-land` has no filter, so any landed world counts. */
function landedReplay(state: SaveStateV2, id: StarterCharterIdV1): boolean {
  const seeds: ReadonlySet<number> | null = id === 'st-land' ? null
    : id === 'st-mercury' ? new Set([131])
      : id === 'st-mars' ? new Set([134])
        : id === 'st-ice' ? new Set([137, 138]) : new Set<number>();
  return state.landed.some((value) => {
    const seed = legacySurfaceSeed(value);
    return seed !== null && (seeds === null || seeds.has(seed));
  });
}

/** Already done when accepted: the Charter's own check (24721-24740), or the landed replay. */
export function alreadyProven(
  state: SaveStateV2,
  extensions: V5Extensions,
  id: StarterCharterIdV1,
): boolean {
  return checkProven(state, extensions, id) || landedReplay(state, id);
}

/** The Charter's own check alone, with no replay of the landed worlds: what the board reads to offer Claim. */
export function checkProven(
  state: SaveStateV2,
  extensions: V5Extensions,
  id: StarterCharterIdV1,
): boolean {
  switch (id) {
    case 'st-land': {
      const identity = readWorldIdentity(extensions);
      const exact = identity.kind === 'loaded' && identity.state.records.some(({ address, landed }) => (
        landed && !isCanonicalEarthWorldAddress(address)
      ));
      return exact || state.surfSeen.some((seed) => {
        const legacy = legacySurfaceSeed(seed);
        return legacy !== null && legacy !== 133;
      });
    }
    case 'st-mine': return checkedInteger(state.stats.mines ?? 0, 0, MAX_CHARTER_COUNTER, 'mine count') > 0;
    case 'st-scout': return typeof state.scoutId === 'string' && state.scoutId.length > 0;
    case 'st-conq': return state.conquered.some(([key]) => {
      const seed = legacySurfaceSeed(key);
      return seed !== null && seed !== 133;
    });
    case 'st-mercury': return legacySurfaceSeen(state, 131)
      || exactSolLanding(extensions, new Set([131]));
    case 'st-mars': return legacySurfaceSeen(state, 134)
      || exactSolLanding(extensions, new Set([134]));
    case 'st-ice': return legacySurfaceSeen(state, 137) || legacySurfaceSeen(state, 138)
      || exactSolLanding(extensions, new Set([137, 138]));
    case 'st-comp': {
      const componentIds = new Set(['coil', 'navcore', 'hullseg', 'fuelcell', 'servo', 'cryocap']);
      return state.items.some(([baseId, count]) => componentIds.has(baseId) && count > 0);
    }
    case 'st-giants':
    case 'st-scan':
      return false;
  }
}

export function eventMatches(definition: StarterCharterDefinitionV1, event: StarterCharterEventV1): boolean {
  if (definition.event !== event.kind) return false;
  switch (definition.id) {
    case 'st-land': return event.kind === 'landfall';
    case 'st-mine': return event.kind === 'mined';
    case 'st-scout': return event.kind === 'scout-set' && event.scoutId.length > 0;
    case 'st-mercury': return event.kind === 'landfall'
      && exactSolWorld(event.address, new Set([131]));
    case 'st-mars': return event.kind === 'landfall'
      && exactSolWorld(event.address, new Set([134]));
    case 'st-giants': return event.kind === 'mined'
      && exactSolWorld(event.address, new Set([135, 136]));
    case 'st-ice': return event.kind === 'landfall'
      && exactSolWorld(event.address, new Set([137, 138]));
    case 'st-comp': return event.kind === 'crafted' && event.category === 'comp';
    case 'st-scan': return event.kind === 'bioscan';
    case 'st-conq':
      return false;
  }
}
