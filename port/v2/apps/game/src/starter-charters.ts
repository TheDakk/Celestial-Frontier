/* Bounded v2 starter-Charter lifecycle.

   The canonical two chains, accept-to-activate rule, three-slot cap, already-
   proven checks, Stardust, starter gear and exact event filters are preserved.
   `st-scan` stays visible but unavailable until an accepted bioscan owner is
   authorized; weekly rows are preserved but never rolled or paid here. */
import { hashInt } from '@cf/domain-rand';
import { isCanonicalEarthWorldAddress } from '@cf/domain-opportunity';
import {
  canonicalJson,
  sha256Hex,
} from '@cf/domain-acquisition';
import {
  createGearInstance,
  equipGear,
  getFixedCraftGenerationPlan,
  grantGear,
  makeGearSourceActionId,
} from '@cf/domain-loot';
import {
  prepareArc2LootInventoryWrite,
  projectArc2LootLegacyMirror,
  readArc2Loot,
  readWorldIdentity,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import {
  ascStageOf,
  isSolLandfallAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  prepareArc9ProgressionRefreshV1,
  type Arc9ProgressionProjectionV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const STARTER_CHARTER_CAP_V1 = 3;
export const STARTER_CHARTER_GEAR_OWNER_V1 = 'legacy-v1.8.9-charters' as const;
export const STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1 =
  'arc8-starter-charter-accept-v1' as const;
export const STARTER_CHARTER_ACCEPT_WITNESS_SCHEMA_V1 =
  'cf-v2-starter-charter-accept-witness/v1' as const;
const STARTER_CHARTER_ACCEPT_OPERATION_PREFIX_V1 = 'arc8.starter-charter-accept:';

export const STARTER_CHARTER_IDS_V1 = Object.freeze([
  'st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq',
  'st-mercury', 'st-mars', 'st-giants', 'st-ice', 'st-comp',
] as const);
export type StarterCharterIdV1 = (typeof STARTER_CHARTER_IDS_V1)[number];

export type StarterCharterEventV1 =
  | Readonly<{ kind: 'landfall'; address: CanonicalCF1WorldAddress }>
  | Readonly<{ kind: 'mined'; address: CanonicalCF1WorldAddress }>
  | Readonly<{ kind: 'scout-set'; scoutId: string }>
  | Readonly<{ kind: 'crafted'; baseId: string; category: string }>;

export interface StarterCharterDefinitionV1 {
  readonly id: StarterCharterIdV1;
  readonly chain: 'trades' | 'tour';
  readonly event: StarterCharterEventV1['kind'];
  readonly count: number;
  readonly title: string;
  readonly description: string;
  readonly stardust: number;
  readonly gearId: 'headlamp' | 'magboots' | 'meteor' | 'fieldlegs' | 'earpiece' | null;
  readonly availability: 'live' | 'unavailable';
}

const DEFINITIONS: readonly StarterCharterDefinitionV1[] = Object.freeze([
  Object.freeze({
    id: 'st-land', chain: 'trades', event: 'landfall', count: 1,
    title: 'Make planetfall',
    description: 'Land on any world. A first field contract starts with boots on the ground.',
    stardust: 10, gearId: null, availability: 'live',
  }),
  Object.freeze({
    id: 'st-mine', chain: 'trades', event: 'mined', count: 1,
    title: 'Prospect a dead world',
    description: 'Land on a lifeless world and complete one Mine action.',
    stardust: 15, gearId: null, availability: 'live',
  }),
  Object.freeze({
    id: 'st-scan', chain: 'trades', event: 'landfall', count: 1,
    title: 'Discover life',
    description: 'The accepted bioscan Charter owner is not yet available in v2.',
    stardust: 15, gearId: 'earpiece', availability: 'unavailable',
  }),
  Object.freeze({
    id: 'st-scout', chain: 'trades', event: 'scout-set', count: 1,
    title: 'Name a Field Scout',
    description: 'Assign one exact owned fauna companion as Field Scout.',
    stardust: 15, gearId: null, availability: 'live',
  }),
  Object.freeze({
    id: 'st-conq', chain: 'trades', event: 'landfall', count: 1,
    title: 'Conquer a world',
    description: 'Win one verified Surface conquest beyond the training world.',
    stardust: 25, gearId: null, availability: 'live',
  }),
  Object.freeze({
    id: 'st-mercury', chain: 'tour', event: 'landfall', count: 1,
    title: 'First footfall: Mercury',
    description: 'Stand on Sol’s innermost world.',
    stardust: 10, gearId: 'headlamp', availability: 'live',
  }),
  Object.freeze({
    id: 'st-mars', chain: 'tour', event: 'landfall', count: 1,
    title: 'The red neighbor',
    description: 'Make planetfall on Mars.',
    stardust: 10, gearId: 'magboots', availability: 'live',
  }),
  Object.freeze({
    id: 'st-giants', chain: 'tour', event: 'mined', count: 5,
    title: 'Wells of the giants',
    description: 'Complete five Mine actions on Jupiter or Saturn.',
    stardust: 15, gearId: 'meteor', availability: 'live',
  }),
  Object.freeze({
    id: 'st-ice', chain: 'tour', event: 'landfall', count: 1,
    title: 'The cold frontier',
    description: 'Make planetfall on Uranus or Neptune.',
    stardust: 10, gearId: 'fieldlegs', availability: 'live',
  }),
  Object.freeze({
    id: 'st-comp', chain: 'tour', event: 'crafted', count: 1,
    title: 'A working component',
    description: 'Fabricate any canonical T2 component.',
    stardust: 15, gearId: null, availability: 'live',
  }),
]);

const DEFINITION_BY_ID = new Map(DEFINITIONS.map((definition) => [definition.id, definition]));
const CHAINS: Readonly<Record<'trades' | 'tour', readonly StarterCharterIdV1[]>> = Object.freeze({
  trades: Object.freeze([
    'st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq',
  ] as StarterCharterIdV1[]),
  tour: Object.freeze([
    'st-mercury', 'st-mars', 'st-giants', 'st-ice', 'st-comp',
  ] as StarterCharterIdV1[]),
});
const MAX_STARDUST = Number.MAX_SAFE_INTEGER;
const MAX_CHARTER_COUNTER = Number.MAX_SAFE_INTEGER;

function definitionFor(id: StarterCharterIdV1): StarterCharterDefinitionV1 {
  const definition = DEFINITION_BY_ID.get(id);
  if (!definition) throw new RangeError(`unknown starter Charter ${id}`);
  return definition;
}

function checkedInteger(value: unknown, minimum: number, maximum: number, label: string): number {
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

function checkedState(state: SaveStateV2): Readonly<{
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
          ? null : 'Accepted bioscan Charter settlement is not available in v2.',
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
          ? 'Discover Life remains visible but cannot be accepted until its exact lifecycle owner exists.'
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
        weeklyBoundary: 'Weekly Charters remain protected until wall-week, slate and rollover authority are ported.',
      }),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'protected', reason: error instanceof Error ? error.message : 'Charter projection failed',
    });
  }
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

function alreadyProven(
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

function eventMatches(definition: StarterCharterDefinitionV1, event: StarterCharterEventV1): boolean {
  if (definition.event !== event.kind) return false;
  switch (definition.id) {
    case 'st-land': return event.kind === 'landfall'
      && !isCanonicalEarthWorldAddress(event.address);
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
    case 'st-conq':
    case 'st-scan':
      return false;
  }
}

export interface StarterCharterCompletionV1 {
  readonly id: StarterCharterIdV1;
  readonly title: string;
  readonly stardust: number;
  readonly gearId: StarterCharterDefinitionV1['gearId'];
  readonly alreadyProven: boolean;
}

export interface StarterCharterStageFactsV1 {
  readonly changed: boolean;
  readonly acceptedId: StarterCharterIdV1 | null;
  readonly progressIds: readonly StarterCharterIdV1[];
  readonly completions: readonly StarterCharterCompletionV1[];
  readonly extensionWrites: readonly V5ExtensionWrite[];
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly addedAchievementIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
  readonly projection: Arc9ProgressionProjectionV1 | null;
}

export type StarterCharterStageOutcomeV1 =
  | Readonly<{ kind: 'ready'; facts: StarterCharterStageFactsV1 }>
  | Readonly<{ kind: 'current'; facts: StarterCharterStageFactsV1 }>
  | Readonly<{ kind: 'refused'; reason: string }>;

function grantStarterGear(
  draft: SaveStateV2,
  extensions: V5Extensions,
  definition: StarterCharterDefinitionV1,
  receiptOrdinal: number,
): readonly V5ExtensionWrite[] {
  const gearId = definition.gearId;
  if (gearId === null) return Object.freeze([]);
  const read = readArc2Loot(extensions);
  if (read.kind !== 'loaded' || read.state.kind !== 'inventory') {
    throw new Error(`starter-gear:${read.kind === 'loaded' ? read.state.kind : read.kind}`);
  }
  const sourceActionId = makeGearSourceActionId({
    kind: 'expedition',
    ownerId: STARTER_CHARTER_GEAR_OWNER_V1,
    actionKey: `starter:${definition.id}`,
    receiptId: `f4:${receiptOrdinal}`,
  });
  const definitionIndex = STARTER_CHARTER_IDS_V1.indexOf(definition.id);
  const instance = createGearInstance(sourceActionId, 0, getFixedCraftGenerationPlan(
    gearId,
    hashInt(0xC4A7, receiptOrdinal, definitionIndex) >>> 0,
  ));
  const grant = grantGear(read.state.inventory, read.state.inventory.revision, instance);
  if (grant.status !== 'committed') throw new Error(`starter-gear:${grant.status}`);
  let inventory = grant.state;
  if (grant.location === 'inventory'
    && !inventory.equipped.some(({ slot }) => slot === instance.slot)) {
    const equip = equipGear(inventory, inventory.revision, instance.instanceId);
    if (equip.status !== 'committed' && equip.status !== 'unchanged') {
      throw new Error(`starter-gear:equip-${equip.status}`);
    }
    inventory = equip.state;
  }
  const nextState = Object.freeze({
    kind: 'inventory' as const,
    inventory,
    stackableCounts: read.state.stackableCounts,
  });
  const prepared = prepareArc2LootInventoryWrite({
    extensions,
    inventory: nextState.inventory,
    stackableCounts: nextState.stackableCounts,
  });
  if (prepared.kind !== 'prepared' || prepared.state.kind !== 'inventory') {
    throw new Error(`starter-gear:write-${prepared.kind === 'protected' ? prepared.reason : 'shape'}`);
  }
  const mirror = projectArc2LootLegacyMirror(prepared.state);
  draft.items = mirror.items.map(([id, count]) => [id, count]);
  draft.equip = { ...mirror.equip };
  draft.equipAff = { ...mirror.equipAff };
  return Object.freeze([prepared.write]);
}

function complete(
  draft: SaveStateV2,
  extensions: V5Extensions,
  definition: StarterCharterDefinitionV1,
  receiptOrdinal: number,
  proven: boolean,
): Readonly<{ completion: StarterCharterCompletionV1; extensionWrites: readonly V5ExtensionWrite[] }> {
  const checked = checkedState(draft);
  if (checked.done.includes(definition.id)) throw new Error('starter Charter is already complete');
  const essence = checkedInteger(draft.essence, 0, MAX_STARDUST, 'current Stardust');
  const earned = checkedInteger(draft.stats.essenceEarned ?? 0, 0, MAX_STARDUST, 'lifetime Stardust');
  const honored = checkedInteger(draft.stats.charters ?? 0, 0, MAX_CHARTER_COUNTER, 'honored Charters');
  if (essence > MAX_STARDUST - definition.stardust
    || earned > MAX_STARDUST - definition.stardust
    || honored === MAX_CHARTER_COUNTER) {
    throw new RangeError('starter Charter reward would overflow');
  }
  draft.chDone = [...checked.done, definition.id];
  draft.chacc = checked.accepted.filter((id) => id !== definition.id);
  draft.essence = essence + definition.stardust;
  draft.stats = {
    ...draft.stats,
    essenceEarned: earned + definition.stardust,
    charters: honored + 1,
  };
  const extensionWrites = grantStarterGear(draft, extensions, definition, receiptOrdinal);
  return Object.freeze({
    completion: Object.freeze({
      id: definition.id,
      title: definition.title,
      stardust: definition.stardust,
      gearId: definition.gearId,
      alreadyProven: proven,
    }),
    extensionWrites,
  });
}

function settleProgression(draft: SaveStateV2): Readonly<{
  priorUnlockedIds: readonly string[];
  nextUnlockedIds: readonly string[];
  addedAchievementIds: readonly string[];
  priorBestRankIndex: number;
  nextBestRankIndex: number;
  projection: Arc9ProgressionProjectionV1;
}> {
  const refresh = prepareArc9ProgressionRefreshV1(draft);
  if (refresh.kind === 'protected') throw new Error(`starter-progression:${refresh.reason}`);
  if (refresh.kind === 'ready') {
    draft.unlocked = [...refresh.successorState.unlocked];
    draft.stats = { ...refresh.successorState.stats };
    return Object.freeze({
      priorUnlockedIds: refresh.source.unlockedIds,
      nextUnlockedIds: refresh.successor.unlockedIds,
      addedAchievementIds: refresh.addedAchievementIds,
      priorBestRankIndex: refresh.priorBestRankIndex,
      nextBestRankIndex: refresh.nextBestRankIndex,
      projection: refresh.successor,
    });
  }
  return Object.freeze({
    priorUnlockedIds: refresh.projection.unlockedIds,
    nextUnlockedIds: refresh.projection.unlockedIds,
    addedAchievementIds: Object.freeze([]),
    priorBestRankIndex: refresh.projection.savedBestRankIndex,
    nextBestRankIndex: refresh.projection.rewards.bestRankIndex,
    projection: refresh.projection,
  });
}

function facts(
  changed: boolean,
  acceptedId: StarterCharterIdV1 | null,
  progressIds: readonly StarterCharterIdV1[],
  completions: readonly StarterCharterCompletionV1[],
  extensionWrites: readonly V5ExtensionWrite[],
  progression: ReturnType<typeof settleProgression> | null,
): StarterCharterStageFactsV1 {
  return Object.freeze({
    changed,
    acceptedId,
    progressIds: Object.freeze([...progressIds]),
    completions: Object.freeze([...completions]),
    extensionWrites: Object.freeze([...extensionWrites]),
    priorUnlockedIds: progression?.priorUnlockedIds ?? Object.freeze([]),
    nextUnlockedIds: progression?.nextUnlockedIds ?? Object.freeze([]),
    addedAchievementIds: progression?.addedAchievementIds ?? Object.freeze([]),
    priorBestRankIndex: progression?.priorBestRankIndex ?? 0,
    nextBestRankIndex: progression?.nextBestRankIndex ?? 0,
    projection: progression?.projection ?? null,
  });
}

export function stageStarterCharterAcceptV1(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  id: StarterCharterIdV1;
  receiptOrdinal: number;
}>): StarterCharterStageOutcomeV1 {
  try {
    const board = projectStarterCharterBoardV1(input.draft);
    if (board.kind !== 'projected') return Object.freeze({ kind: 'refused', reason: board.reason });
    const row = board.board.rows.find(({ definition }) => definition.id === input.id);
    if (!row || row.status !== 'available') {
      return Object.freeze({ kind: 'refused', reason: row?.lockedReason ?? 'starter Charter is not revealed' });
    }
    if (board.board.acceptedCount >= STARTER_CHARTER_CAP_V1) {
      return Object.freeze({ kind: 'refused', reason: 'three accepted Charters is the exact cap' });
    }
    const definition = row.definition;
    const checked = checkedState(input.draft);
    input.draft.chacc = [...checked.accepted, definition.id];
    let completions: readonly StarterCharterCompletionV1[] = Object.freeze([]);
    let extensionWrites: readonly V5ExtensionWrite[] = Object.freeze([]);
    if (alreadyProven(input.draft, input.extensions, definition.id)) {
      const completed = complete(
        input.draft, input.extensions, definition, input.receiptOrdinal, true,
      );
      completions = Object.freeze([completed.completion]);
      extensionWrites = completed.extensionWrites;
    }
    const progression = settleProgression(input.draft);
    return Object.freeze({
      kind: 'ready',
      facts: facts(true, definition.id, Object.freeze([]), completions, extensionWrites, progression),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', reason: error instanceof Error ? error.message : 'starter Charter acceptance failed',
    });
  }
}

export function stageStarterCharterEventV1(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  event: StarterCharterEventV1;
  receiptOrdinal: number;
}>): StarterCharterStageOutcomeV1 {
  try {
    const checked = checkedState(input.draft);
    const progress = { ...checked.progress };
    const progressIds: StarterCharterIdV1[] = [];
    const completions: StarterCharterCompletionV1[] = [];
    const extensionWrites: V5ExtensionWrite[] = [];
    for (const id of checked.accepted) {
      if (!(STARTER_CHARTER_IDS_V1 as readonly string[]).includes(id)) continue;
      const definition = definitionFor(id as StarterCharterIdV1);
      if (definition.availability !== 'live' || !eventMatches(definition, input.event)) continue;
      const next = Math.min(definition.count, (progress[definition.id] ?? 0) + 1);
      progress[definition.id] = next;
      progressIds.push(definition.id);
      if (next >= definition.count) {
        input.draft.chProg = progress;
        const completed = complete(
          input.draft, input.extensions, definition, input.receiptOrdinal, false,
        );
        completions.push(completed.completion);
        extensionWrites.push(...completed.extensionWrites);
      }
    }
    if (progressIds.length === 0) {
      return Object.freeze({
        kind: 'current', facts: facts(false, null, [], [], [], null),
      });
    }
    input.draft.chProg = progress;
    const progression = settleProgression(input.draft);
    return Object.freeze({
      kind: 'ready',
      facts: facts(true, null, progressIds, completions, extensionWrites, progression),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', reason: error instanceof Error ? error.message : 'starter Charter event failed',
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

export function renderStarterCharterBoardV1(board: StarterCharterBoardV1): string {
  const completed = board.completedIds.length === 0 ? ''
    : `<div class="sub" data-starter-charter-complete>Completed: ${board.completedIds.length} / ${STARTER_CHARTER_IDS_V1.length}</div>`;
  const rows = board.rows.map((row) => {
    const accepted = row.status === 'accepted';
    const progress = `${row.progress} / ${row.definition.count}`;
    return `<div class="centry starter-charter" data-starter-charter="${escapeHtml(row.definition.id)}" data-charter-status="${row.status}">`
      + `<b>${escapeHtml(row.definition.title)}</b><div class="sub">${escapeHtml(row.definition.description)}</div>`
      + `<div class="starter-charter-actions"><span class="sub">${progress} · +${row.definition.stardust} ✦`
      + (row.definition.gearId ? ` · ${escapeHtml(row.definition.gearId)}` : '') + '</span>'
      + (row.status === 'available'
        ? `<button type="button" data-starter-charter-accept="${escapeHtml(row.definition.id)}">Accept</button>`
        : accepted ? '<span class="binder-claimed">active</span>'
          : `<span class="sub">${escapeHtml(row.lockedReason ?? 'Unavailable')}</span>`)
      + '</div></div>';
  }).join('');
  return '<section data-starter-charter-board><h3>Starter Charters '
    + `<span class="sub">${board.acceptedCount} / ${board.cap} active</span></h3>`
    + completed + (rows || '<div class="empty">Every currently supported starter Charter is complete.</div>')
    + `<div class="sub" data-weekly-charter-boundary>${escapeHtml(board.weeklyBoundary)}</div></section>`;
}

interface StarterCharterPublicationFieldsV1 {
  readonly chacc: readonly string[];
  readonly chDone: readonly string[];
  readonly chProg: Readonly<Record<string, number>>;
  readonly essence: number;
  readonly stats: Readonly<Record<string, number>>;
  readonly items: readonly (readonly [string, number])[];
  readonly equip: Readonly<Record<string, string>>;
  readonly equipAff: Readonly<Record<string, Readonly<{ k: string; v: number; forId: string }>>>;
  readonly unlocked: readonly string[];
}

export interface StarterCharterAcceptFactsV1 {
  readonly schema: typeof STARTER_CHARTER_ACCEPT_WITNESS_SCHEMA_V1;
  readonly id: StarterCharterIdV1;
  readonly receiptOrdinal: number;
  readonly stage: StarterCharterStageFactsV1;
  readonly source: StarterCharterPublicationFieldsV1;
  readonly successor: StarterCharterPublicationFieldsV1;
}

export type StarterCharterAcceptActionOutcomeV1 =
  | Readonly<{ kind: 'current'; id: StarterCharterIdV1 }>
  | Readonly<{ kind: 'refused'; detail: string; transaction?: F4RuntimeActionCommitOutcome }>
  | Readonly<{
    kind: 'committed';
    state: SaveStateV2;
    facts: StarterCharterAcceptFactsV1;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    detail: string;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>;

function publicationFields(state: SaveStateV2): StarterCharterPublicationFieldsV1 {
  return Object.freeze({
    chacc: Object.freeze([...state.chacc]),
    chDone: Object.freeze([...state.chDone]),
    chProg: Object.freeze({ ...state.chProg }),
    essence: state.essence,
    stats: Object.freeze({ ...state.stats }),
    items: Object.freeze(state.items.map(([id, count]) => Object.freeze([id, count] as const))),
    equip: Object.freeze({ ...state.equip }),
    equipAff: Object.freeze(Object.fromEntries(Object.entries(state.equipAff).map(([slot, affix]) => [
      slot, Object.freeze({ ...affix }),
    ]))),
    unlocked: Object.freeze([...state.unlocked]),
  });
}

export function operationForStarterCharterAcceptV1(id: StarterCharterIdV1): string {
  definitionFor(id);
  return `${STARTER_CHARTER_ACCEPT_OPERATION_PREFIX_V1}${id}`;
}

export async function commitStarterCharterAcceptV1(input: Readonly<{
  state: SaveStateV2;
  id: StarterCharterIdV1;
  codecNow: number;
  authority: Pick<F4RuntimeAuthority, 'commitAction'>;
}>): Promise<StarterCharterAcceptActionOutcomeV1> {
  const checked = checkedState(input.state);
  if (checked.done.includes(input.id) || checked.accepted.includes(input.id)) {
    return Object.freeze({ kind: 'current', id: input.id });
  }
  const board = projectStarterCharterBoardV1(input.state);
  if (board.kind !== 'projected') return Object.freeze({ kind: 'refused', detail: board.reason });
  const row = board.board.rows.find(({ definition }) => definition.id === input.id);
  if (!row || row.status !== 'available') {
    return Object.freeze({
      kind: 'refused', detail: row?.lockedReason ?? 'starter Charter is not revealed',
    });
  }
  if (board.board.acceptedCount >= STARTER_CHARTER_CAP_V1) {
    return Object.freeze({ kind: 'refused', detail: 'three accepted Charters is the exact cap' });
  }
  let selected: Readonly<{
    facts: StarterCharterAcceptFactsV1;
    witness: string;
    expectedStateJson: string;
  }> | null = null;
  const transaction = await input.authority.commitAction({
    state: input.state,
    operation: operationForStarterCharterAcceptV1(input.id),
    receiptKind: STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1,
    codecNow: input.codecNow,
    derive: ({ draft, extensions, receiptOrdinal, canonicalizeState }) => {
      const source = publicationFields(draft);
      const staged = stageStarterCharterAcceptV1({
        draft, extensions, id: input.id, receiptOrdinal,
      });
      if (staged.kind !== 'ready') {
        throw new Error(staged.kind === 'refused' ? staged.reason : 'starter Charter became current');
      }
      const facts: StarterCharterAcceptFactsV1 = Object.freeze({
        schema: STARTER_CHARTER_ACCEPT_WITNESS_SCHEMA_V1,
        id: input.id,
        receiptOrdinal,
        stage: staged.facts,
        source,
        successor: publicationFields(draft),
      });
      const witness = `${STARTER_CHARTER_ACCEPT_WITNESS_SCHEMA_V1}:${sha256Hex(canonicalJson(facts))}`;
      selected = Object.freeze({
        facts,
        witness,
        expectedStateJson: canonicalJson(canonicalizeState(draft)),
      });
      return Object.freeze({
        state: draft,
        extensionWrites: staged.facts.extensionWrites,
        witness,
      });
    },
  });
  if (transaction.kind !== 'committed') {
    return Object.freeze({ kind: 'refused', detail: transaction.kind, transaction });
  }
  const plan = selected as Readonly<{
    facts: StarterCharterAcceptFactsV1;
    witness: string;
    expectedStateJson: string;
  }> | null;
  if (!plan) return Object.freeze({ kind: 'committed-convergence', detail: 'missing-plan', transaction });
  if (transaction.plan.operation !== operationForStarterCharterAcceptV1(input.id)
    || transaction.plan.receiptOrdinal !== plan.facts.receiptOrdinal
    || transaction.receipt.ordinal !== plan.facts.receiptOrdinal
    || transaction.receipt.kind !== STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1
    || transaction.receipt.witness !== plan.witness
    || canonicalJson(transaction.state) !== canonicalJson(transaction.saved.canonicalState)
    || canonicalJson(transaction.state) !== plan.expectedStateJson
    || canonicalJson(publicationFields(transaction.state)) !== canonicalJson(plan.facts.successor)) {
    return Object.freeze({
      kind: 'committed-convergence', detail: 'committed-verification-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', state: transaction.state, facts: plan.facts, transaction,
  });
}

export function publishStarterCharterAcceptFieldsV1(
  target: SaveStateV2,
  outcome: Extract<StarterCharterAcceptActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  if (canonicalJson(publicationFields(target)) !== canonicalJson(outcome.facts.source)) {
    throw new TypeError('starter Charter publication requires its exact live parent');
  }
  target.chacc = [...outcome.state.chacc];
  target.chDone = [...outcome.state.chDone];
  target.chProg = { ...outcome.state.chProg };
  target.essence = outcome.state.essence;
  target.stats = { ...outcome.state.stats };
  target.items = outcome.state.items.map(([id, count]) => [id, count]);
  target.equip = { ...outcome.state.equip };
  target.equipAff = Object.fromEntries(Object.entries(outcome.state.equipAff).map(([slot, affix]) => [
    slot, { ...affix },
  ]));
  target.unlocked = [...outcome.state.unlocked];
}
