/* Arc 9 canonical intergalactic travel settlement.

   A galaxy arrival starts from one registered galaxy NavState and derives the
   canonical galaxy ledger key, quasar/dwarf facts, and accepted saved route
   from that source. A wormhole traversal starts from the same registered
   current-galaxy carrier, independently proves that its deterministic galaxy
   owns a wormhole, and accepts only the existing Universe/null saved route.

   One detached deterministic F4 product moves the legacy galaxy ledger,
   event achievements, aggregate progression/best-rank mirror, and route as
   one fixed point. Current fixed points are receipt-free. No caller selects
   an achievement id, no SessionRNG domain is evaluated, no optimistic state
   is published, and no failed or ambiguous transaction is retried. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import { galaxyWormhole } from '@cf/domain-worldgen';
import type { SaveStateV2 } from '@cf/persistence';
import {
  getProvenGalaxyKey,
  navToView,
  resolveViewToNav,
  type NavState,
} from '@cf/scene';
import {
  prepareArc9EventAchievementJoinV1,
  prepareArc9ProgressionRefreshV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
  type Arc9ProgressionProjectionV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC9_TRAVEL_FACT_SCHEMA_V1 = 'cf-v2-arc9-travel-fact/v1' as const;
export const ARC9_TRAVEL_WITNESS_SCHEMA_V1 = 'cf-v2-arc9-travel-witness/v1' as const;
export const ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1 = 'arc9-galaxy-arrival-v1' as const;
export const ARC9_WORMHOLE_TRAVERSAL_RECEIPT_KIND_V1 = 'arc9-wormhole-traversal-v1' as const;

const ARC9_GALAXY_ARRIVAL_OPERATION_PREFIX_V1 = 'arc9.travel:galaxy-arrival:';
const ARC9_WORMHOLE_TRAVERSAL_OPERATION_PREFIX_V1 = 'arc9.travel:wormhole:';
const MAX_GALAXY_LEDGER = 20_000;
const MAX_RANK_INDEX = 9;
const MAX_CLONE_NODES = 1_500_000;

type GalaxyNav = Extract<NavState, { readonly mode: 'galaxy' }>;

export type Arc9TravelActionKindV1 = 'galaxy-arrival' | 'wormhole-traversal';
export type Arc9TravelEventAchievementIdV1 = 'worm' | 'quasar' | 'dwarfg';

interface Arc9TravelFactBaseV1 {
  readonly schema: typeof ARC9_TRAVEL_FACT_SCHEMA_V1;
  readonly actionKind: Arc9TravelActionKindV1;
  readonly galaxyKey: string;
  readonly galaxySeed: number;
  readonly eventAchievementIds: readonly Arc9TravelEventAchievementIdV1[];
}

export interface Arc9GalaxyArrivalFactV1 extends Arc9TravelFactBaseV1 {
  readonly actionKind: 'galaxy-arrival';
  readonly quasar: boolean;
  readonly dwarf: boolean;
}

export interface Arc9WormholeTraversalFactV1 extends Arc9TravelFactBaseV1 {
  readonly actionKind: 'wormhole-traversal';
  readonly wormhole: Readonly<{ readonly x: number; readonly y: number }>;
  readonly eventAchievementIds: readonly ['worm'];
}

export type Arc9TravelFactV1 = Arc9GalaxyArrivalFactV1 | Arc9WormholeTraversalFactV1;

export interface Arc9TravelRouteV1 {
  readonly targetMode: 'galaxy' | 'system' | 'universe';
  readonly acceptedSavedView: Readonly<Record<string, unknown>> | null;
}

export interface Arc9TravelOwnedStateV1 {
  readonly galSeen: readonly unknown[];
  readonly bestRank: number;
  readonly unlocked: readonly string[];
  readonly savedView: Readonly<Record<string, unknown>> | null;
}

export type Arc9TravelProtectionReasonV1 =
  | 'source-unproven'
  | 'source-mismatch'
  | 'wormhole-absent'
  | 'state-shape'
  | 'galaxy-ledger-shape'
  | 'galaxy-ledger-capacity'
  | 'stats-shape'
  | 'saved-route-shape'
  | `achievement:${Arc9ProgressionProjectionProtectionReasonV1}`
  | `progression:${Arc9ProgressionProjectionProtectionReasonV1}`
  | 'progression-fixed-point';

export interface Arc9TravelFixedPointReadyV1 {
  readonly kind: 'ready';
  readonly facts: Arc9TravelFactV1;
  readonly route: Arc9TravelRouteV1;
  readonly source: Arc9TravelOwnedStateV1;
  readonly successor: Arc9TravelOwnedStateV1;
  readonly addedEventAchievementIds: readonly Arc9TravelEventAchievementIdV1[];
  readonly addedAggregateAchievementIds: readonly string[];
  readonly successorState: SaveStateV2;
  readonly projection: Arc9ProgressionProjectionV1;
}

export interface Arc9TravelSettlementReadyV1 extends Arc9TravelFixedPointReadyV1 {
  readonly operation: string;
  readonly receiptKind: typeof ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1
    | typeof ARC9_WORMHOLE_TRAVERSAL_RECEIPT_KIND_V1;
}

export type Arc9GalaxyArrivalJoinPreparationV1 =
  | Arc9TravelFixedPointReadyV1
  | Readonly<{
    kind: 'current';
    facts: Arc9GalaxyArrivalFactV1;
    route: Arc9TravelRouteV1;
    projection: Arc9ProgressionProjectionV1;
  }>
  | Readonly<{ kind: 'protected'; reason: Arc9TravelProtectionReasonV1 }>;

export type Arc9TravelSettlementPreparationV1 =
  | Arc9TravelSettlementReadyV1
  | Readonly<{
    kind: 'current';
    facts: Arc9TravelFactV1;
    route: Arc9TravelRouteV1;
    projection: Arc9ProgressionProjectionV1;
  }>
  | Readonly<{ kind: 'protected'; reason: Arc9TravelProtectionReasonV1 }>;

class TravelProtection extends Error {
  constructor(readonly reason: Arc9TravelProtectionReasonV1) {
    super(reason);
  }
}

function protect(reason: Arc9TravelProtectionReasonV1): never {
  throw new TravelProtection(reason);
}

function plainRecord(value: unknown, reason: Arc9TravelProtectionReasonV1): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) protect(reason);
  const prototype = Object.getPrototypeOf(value);
  if ((prototype !== Object.prototype && prototype !== null)
    || Reflect.ownKeys(value).some((key) => typeof key !== 'string')) protect(reason);
  return value as Record<string, unknown>;
}

function dataValue(
  record: Record<string, unknown>,
  key: string,
  reason: Arc9TravelProtectionReasonV1,
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) protect(reason);
  return descriptor.value;
}

function denseArray(
  value: unknown,
  maximum: number,
  reason: Arc9TravelProtectionReasonV1,
): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > maximum || Reflect.ownKeys(value).length !== value.length + 1) protect(reason);
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) protect(reason);
  }
  return value;
}

interface CloneBudget { count: number; }

function clonePlain(
  value: unknown,
  ancestors: Set<object>,
  budget: CloneBudget,
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object' || depth > 256 || budget.count >= MAX_CLONE_NODES
    || ancestors.has(value)) throw new TypeError('Travel state is not bounded plain data');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype || Reflect.ownKeys(value).length !== value.length + 1) {
        throw new TypeError('Travel arrays must be exact native data');
      }
      const result: unknown[] = [];
      for (let index = 0; index < value.length; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('Travel arrays cannot contain holes or accessors');
        }
        result.push(clonePlain(descriptor.value, ancestors, budget, depth + 1));
      }
      return result;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Travel objects must use a plain prototype');
    }
    const result: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('Travel state cannot contain symbols');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('Travel state cannot contain accessors or hidden fields');
      }
      Object.defineProperty(result, key, {
        value: clonePlain(descriptor.value, ancestors, budget, depth + 1),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return result;
  } finally {
    ancestors.delete(value);
  }
}

function freezeTree<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor && 'value' in descriptor) freezeTree(descriptor.value);
    }
    Object.freeze(value);
  }
  return value;
}

function frozenPlain<T>(value: T, reason: Arc9TravelProtectionReasonV1): T {
  try {
    const clone = clonePlain(value, new Set<object>(), { count: 0 }, 0) as T;
    canonicalJson(clone);
    return freezeTree(clone);
  } catch {
    protect(reason);
  }
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function sameCanonical(left: unknown, right: unknown): boolean {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}

function registeredGalaxyContext(galaxyNav: GalaxyNav): Readonly<{
  galaxyKey: string;
  galaxySeed: number;
  savedView: Readonly<Record<string, unknown>>;
}> {
  try {
    if (!galaxyNav || typeof galaxyNav !== 'object' || galaxyNav.mode !== 'galaxy'
      || galaxyNav.star !== null || galaxyNav.planet !== null) protect('source-unproven');
    const galaxyKey = getProvenGalaxyKey(galaxyNav.gal);
    const savedView = navToView(galaxyNav);
    if (galaxyKey === null || savedView === null) protect('source-unproven');
    return Object.freeze({
      galaxyKey,
      galaxySeed: galaxyNav.gal.seed,
      savedView: frozenPlain(savedView, 'source-mismatch'),
    });
  } catch (error) {
    if (error instanceof TravelProtection) throw error;
    protect('source-unproven');
  }
}

function derivedWormhole(galaxySeed: number): Readonly<{ x: number; y: number }> | null {
  let value: unknown;
  try { value = galaxyWormhole(galaxySeed); } catch { protect('source-mismatch'); }
  if (value === null) return null;
  const record = plainRecord(value, 'source-mismatch');
  const keys = Reflect.ownKeys(record);
  if (keys.length !== 2 || !keys.includes('x') || !keys.includes('y')) protect('source-mismatch');
  const x = dataValue(record, 'x', 'source-mismatch');
  const y = dataValue(record, 'y', 'source-mismatch');
  if (typeof x !== 'number' || !Number.isFinite(x)
    || typeof y !== 'number' || !Number.isFinite(y)) protect('source-mismatch');
  return Object.freeze({ x, y });
}

export function deriveArc9TravelFactV1(
  actionKind: 'galaxy-arrival',
  galaxyNav: GalaxyNav,
): Arc9GalaxyArrivalFactV1;
export function deriveArc9TravelFactV1(
  actionKind: 'wormhole-traversal',
  galaxyNav: GalaxyNav,
): Arc9WormholeTraversalFactV1;
export function deriveArc9TravelFactV1(
  actionKind: Arc9TravelActionKindV1,
  galaxyNav: GalaxyNav,
): Arc9TravelFactV1;
export function deriveArc9TravelFactV1(
  actionKind: Arc9TravelActionKindV1,
  galaxyNav: GalaxyNav,
): Arc9TravelFactV1 {
  const source = registeredGalaxyContext(galaxyNav);
  if (actionKind === 'galaxy-arrival') {
    const eventAchievementIds: Arc9TravelEventAchievementIdV1[] = [];
    if (galaxyNav.gal.quasar) eventAchievementIds.push('quasar');
    if (galaxyNav.gal.dwarf) eventAchievementIds.push('dwarfg');
    return Object.freeze({
      schema: ARC9_TRAVEL_FACT_SCHEMA_V1,
      actionKind,
      galaxyKey: source.galaxyKey,
      galaxySeed: source.galaxySeed,
      quasar: galaxyNav.gal.quasar,
      dwarf: galaxyNav.gal.dwarf,
      eventAchievementIds: Object.freeze(eventAchievementIds),
    });
  }
  if (actionKind !== 'wormhole-traversal') protect('source-mismatch');
  const wormhole = derivedWormhole(source.galaxySeed);
  if (wormhole === null) protect('wormhole-absent');
  return Object.freeze({
    schema: ARC9_TRAVEL_FACT_SCHEMA_V1,
    actionKind,
    galaxyKey: source.galaxyKey,
    galaxySeed: source.galaxySeed,
    wormhole,
    eventAchievementIds: Object.freeze(['worm'] as const),
  });
}

function acceptedGalaxyArrivalRoute(
  galaxyNav: GalaxyNav,
  acceptedSavedView: Readonly<Record<string, unknown>>,
): Arc9TravelRouteV1 {
  const source = registeredGalaxyContext(galaxyNav);
  const detached = frozenPlain(acceptedSavedView, 'saved-route-shape');
  let resolved: ReturnType<typeof resolveViewToNav>;
  try { resolved = resolveViewToNav(detached); } catch { protect('source-mismatch'); }
  if (!resolved.ok || (resolved.state.mode !== 'galaxy' && resolved.state.mode !== 'system')
    || getProvenGalaxyKey(resolved.state.gal) !== source.galaxyKey) protect('source-mismatch');
  return Object.freeze({
    targetMode: resolved.state.mode,
    acceptedSavedView: detached,
  });
}

function directRouteForArc9TravelV1(
  actionKind: Arc9TravelActionKindV1,
  galaxyNav: GalaxyNav,
): Arc9TravelRouteV1 {
  if (actionKind === 'wormhole-traversal') {
    registeredGalaxyContext(galaxyNav);
    return Object.freeze({ targetMode: 'universe', acceptedSavedView: null });
  }
  if (actionKind !== 'galaxy-arrival') protect('source-mismatch');
  const source = registeredGalaxyContext(galaxyNav);
  return acceptedGalaxyArrivalRoute(galaxyNav, source.savedView);
}

export function operationForArc9TravelV1(
  actionKind: Arc9TravelActionKindV1,
  galaxyNav: GalaxyNav,
): string {
  const { galaxyKey } = registeredGalaxyContext(galaxyNav);
  const prefix = actionKind === 'galaxy-arrival'
    ? ARC9_GALAXY_ARRIVAL_OPERATION_PREFIX_V1
    : actionKind === 'wormhole-traversal'
      ? ARC9_WORMHOLE_TRAVERSAL_OPERATION_PREFIX_V1
      : protect('source-mismatch');
  return `${prefix}${sha256Hex(galaxyKey)}`;
}

function checkedGalaxyLedger(value: unknown): readonly unknown[] {
  const rows = denseArray(value, MAX_GALAXY_LEDGER, 'galaxy-ledger-shape');
  return frozenPlain(rows, 'galaxy-ledger-shape');
}

function checkedBestRank(stats: Record<string, unknown>): number {
  const value = dataValue(stats, 'bestRank', 'stats-shape');
  if (typeof value !== 'number' || !Number.isSafeInteger(value)
    || value < 0 || value > MAX_RANK_INDEX) protect('stats-shape');
  return value;
}

function ownedState(
  state: SaveStateV2,
  projection?: Arc9ProgressionProjectionV1,
): Arc9TravelOwnedStateV1 {
  const root = plainRecord(state, 'state-shape');
  const stats = plainRecord(dataValue(root, 'stats', 'stats-shape'), 'stats-shape');
  const unlocked = denseArray(dataValue(root, 'unlocked', 'state-shape'), 200, 'state-shape');
  if (unlocked.some((value) => typeof value !== 'string')) protect('state-shape');
  const savedViewValue = dataValue(root, 'savedView', 'saved-route-shape');
  const savedView = savedViewValue === null
    ? null
    : frozenPlain(plainRecord(savedViewValue, 'saved-route-shape'), 'saved-route-shape');
  const result = Object.freeze({
    galSeen: checkedGalaxyLedger(dataValue(root, 'galSeen', 'galaxy-ledger-shape')),
    bestRank: checkedBestRank(stats),
    unlocked: Object.freeze([...(unlocked as readonly string[])]),
    savedView,
  });
  if (projection && (projection.snapshot.galaxyCount !== result.galSeen.length
    || !sameJson(projection.unlockedIds, result.unlocked)
    || projection.savedBestRankIndex !== result.bestRank)) protect('progression-fixed-point');
  return result;
}

function alreadyRepresentsGalaxy(
  ledger: readonly unknown[],
  galaxyKey: string,
  galaxySeed: number,
): boolean {
  return ledger.some((entry) => entry === galaxyKey || entry === galaxySeed);
}

function prepareTravelFixedPoint(
  state: SaveStateV2,
  facts: Arc9TravelFactV1,
  route: Arc9TravelRouteV1,
): Arc9TravelFixedPointReadyV1 | Extract<
  Arc9TravelSettlementPreparationV1,
  { readonly kind: 'current' }
> {
  const source = ownedState(state);
  let galSeen = source.galSeen;
  if (facts.actionKind === 'galaxy-arrival'
    && !alreadyRepresentsGalaxy(galSeen, facts.galaxyKey, facts.galaxySeed)) {
    if (galSeen.length >= MAX_GALAXY_LEDGER) protect('galaxy-ledger-capacity');
    galSeen = freezeTree([...galSeen, facts.galaxyKey]);
  }
  let successorState: SaveStateV2 = {
    ...state,
    galSeen: [...galSeen],
    savedView: route.acceptedSavedView === null
      ? null
      : clonePlain(
        route.acceptedSavedView,
        new Set<object>(),
        { count: 0 },
        0,
      ) as Record<string, unknown>,
  };
  const addedEventAchievementIds: Arc9TravelEventAchievementIdV1[] = [];
  for (const id of facts.eventAchievementIds) {
    const join = prepareArc9EventAchievementJoinV1(successorState, id);
    if (join.kind !== 'prepared') protect(`achievement:${join.reason}`);
    if (join.added) addedEventAchievementIds.push(id);
    successorState = { ...successorState, unlocked: [...join.nextUnlockedIds] };
  }
  const refresh = prepareArc9ProgressionRefreshV1(successorState);
  if (refresh.kind === 'protected') protect(`progression:${refresh.reason}`);
  const addedAggregateAchievementIds = refresh.kind === 'ready'
    ? refresh.addedAchievementIds : Object.freeze([]);
  if (refresh.kind === 'ready') successorState = refresh.successorState;
  const fixedPoint = prepareArc9ProgressionRefreshV1(successorState);
  if (fixedPoint.kind !== 'current') protect('progression-fixed-point');
  const successor = ownedState(successorState, fixedPoint.projection);
  if (!sameCanonical(successor.savedView, route.acceptedSavedView)) {
    protect('progression-fixed-point');
  }
  for (const id of facts.eventAchievementIds) {
    if (!fixedPoint.projection.unlockedIds.includes(id)
      || fixedPoint.projection.achievements.rows.find((row) => row.id === id)?.status
        !== 'unlocked') protect('progression-fixed-point');
  }
  if (sameCanonical(source, successor)) {
    return Object.freeze({
      kind: 'current', facts, route, projection: fixedPoint.projection,
    });
  }
  return Object.freeze({
    kind: 'ready',
    facts,
    route,
    source,
    successor,
    addedEventAchievementIds: Object.freeze(addedEventAchievementIds),
    addedAggregateAchievementIds: Object.freeze([...addedAggregateAchievementIds]),
    successorState,
    projection: fixedPoint.projection,
  });
}

/** Pure reusable galaxy-arrival join for direct travel and accepted CF1
 * Follow composition. The accepted route is re-proved against the same
 * canonical galaxy, then retained exactly; a star/planet Follow therefore
 * keeps its accepted system route while folding visit/progression into the
 * caller's existing receipt. A legacy numeric seed suppresses only migration-
 * time double credit; canonical strings compare by their complete key. */
export function prepareArc9GalaxyArrivalJoinV1(
  state: SaveStateV2,
  galaxyNav: GalaxyNav,
  acceptedSavedView: Readonly<Record<string, unknown>>,
): Arc9GalaxyArrivalJoinPreparationV1 {
  try {
    const facts = deriveArc9TravelFactV1('galaxy-arrival', galaxyNav);
    const route = acceptedGalaxyArrivalRoute(galaxyNav, acceptedSavedView);
    const prepared = prepareTravelFixedPoint(state, facts, route);
    return prepared.kind === 'current'
      ? Object.freeze({ ...prepared, facts })
      : prepared;
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof TravelProtection ? error.reason : 'source-mismatch',
    });
  }
}

/** Pure direct-Travel preparation. Follow should call the reusable arrival
 * join above with its already accepted savedView and fold that successor into
 * the existing sharing derivation rather than opening a second receipt. */
export function prepareArc9TravelSettlementV1(
  state: SaveStateV2,
  actionKind: Arc9TravelActionKindV1,
  galaxyNav: GalaxyNav,
): Arc9TravelSettlementPreparationV1 {
  try {
    const facts = deriveArc9TravelFactV1(actionKind, galaxyNav);
    const route = directRouteForArc9TravelV1(actionKind, galaxyNav);
    const prepared = prepareTravelFixedPoint(state, facts, route);
    if (prepared.kind === 'current') return prepared;
    return Object.freeze({
      ...prepared,
      operation: operationForArc9TravelV1(actionKind, galaxyNav),
      receiptKind: actionKind === 'galaxy-arrival'
        ? ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1
        : ARC9_WORMHOLE_TRAVERSAL_RECEIPT_KIND_V1,
    });
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof TravelProtection ? error.reason : 'source-mismatch',
    });
  }
}

/** Standalone Search/Atlas preparation for an already accepted galaxy or
 * system route. Unlike Follow, this owner opens the Travel receipt itself;
 * unlike direct galaxy descent, it retains the exact accepted deeper route. */
export function prepareArc9GalaxyArrivalRouteSettlementV1(
  state: SaveStateV2,
  galaxyNav: GalaxyNav,
  acceptedSavedView: Readonly<Record<string, unknown>>,
): Arc9TravelSettlementPreparationV1 {
  const prepared = prepareArc9GalaxyArrivalJoinV1(state, galaxyNav, acceptedSavedView);
  if (prepared.kind !== 'ready') return prepared;
  return Object.freeze({
    ...prepared,
    operation: operationForArc9TravelV1('galaxy-arrival', galaxyNav),
    receiptKind: ARC9_GALAXY_ARRIVAL_RECEIPT_KIND_V1,
  });
}

export interface Arc9TravelActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly actionKind: Arc9TravelActionKindV1;
  readonly galaxyNav: GalaxyNav;
  readonly codecNow: number;
}

export interface Arc9GalaxyArrivalRouteInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly galaxyNav: GalaxyNav;
  readonly acceptedSavedView: Readonly<Record<string, unknown>>;
  readonly codecNow: number;
}

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly actionKind: Arc9TravelActionKindV1;
  readonly galaxyNav: GalaxyNav;
  readonly acceptedSavedView: Readonly<Record<string, unknown>> | undefined;
  readonly codecNow: number;
}

const DIRECT_INPUT_FIELDS = Object.freeze([
  'runtime', 'state', 'actionKind', 'galaxyNav', 'codecNow',
] as const);
const ROUTE_INPUT_FIELDS = Object.freeze([
  'runtime', 'state', 'galaxyNav', 'acceptedSavedView', 'codecNow',
] as const);

type CaptureKind = 'direct' | 'galaxy-arrival-route';

function capture(input: unknown, captureKind: CaptureKind): CapturedInput | null {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(input);
    const names = keys.filter((key): key is string => typeof key === 'string').sort();
    const fields = captureKind === 'direct' ? DIRECT_INPUT_FIELDS : ROUTE_INPUT_FIELDS;
    const expected = [...fields].sort();
    if (keys.length !== expected.length
      || names.some((name, index) => name !== expected[index])) return null;
    const values: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of fields) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      values[field] = descriptor.value;
    }
    const runtime = values.runtime;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)
      || (captureKind === 'direct'
        && values.actionKind !== 'galaxy-arrival' && values.actionKind !== 'wormhole-traversal')
      || typeof values.codecNow !== 'number' || !Number.isSafeInteger(values.codecNow)
      || values.codecNow < 0) return null;
    const commit = Object.getOwnPropertyDescriptor(runtime, 'commitAction');
    if (!commit || !('value' in commit) || typeof commit.value !== 'function') return null;
    registeredGalaxyContext(values.galaxyNav as GalaxyNav);
    const state = clonePlain(values.state, new Set<object>(), { count: 0 }, 0);
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    const acceptedSavedView = captureKind === 'direct'
      ? undefined
      : clonePlain(
        values.acceptedSavedView,
        new Set<object>(),
        { count: 0 },
        0,
      );
    if (captureKind === 'galaxy-arrival-route'
      && (!acceptedSavedView || typeof acceptedSavedView !== 'object'
        || Array.isArray(acceptedSavedView))) return null;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state: state as SaveStateV2,
      actionKind: captureKind === 'direct'
        ? values.actionKind as Arc9TravelActionKindV1
        : 'galaxy-arrival',
      galaxyNav: values.galaxyNav as GalaxyNav,
      acceptedSavedView: acceptedSavedView as Readonly<Record<string, unknown>> | undefined,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function prepareCapturedTravelSettlement(
  state: SaveStateV2,
  captured: CapturedInput,
): Arc9TravelSettlementPreparationV1 {
  return captured.acceptedSavedView === undefined
    ? prepareArc9TravelSettlementV1(state, captured.actionKind, captured.galaxyNav)
    : prepareArc9GalaxyArrivalRouteSettlementV1(
      state,
      captured.galaxyNav,
      captured.acceptedSavedView,
    );
}

function witnessFor(plan: Arc9TravelSettlementReadyV1, receiptOrdinal: number): string {
  return `arc9tv1:${sha256Hex(canonicalJson({
    schema: ARC9_TRAVEL_WITNESS_SCHEMA_V1,
    operation: plan.operation,
    receiptOrdinal,
    facts: plan.facts,
    route: plan.route,
    source: plan.source,
    successor: plan.successor,
    addedEventAchievementIds: plan.addedEventAchievementIds,
    addedAggregateAchievementIds: plan.addedAggregateAchievementIds,
  }))}`;
}

function samePlan(left: Arc9TravelSettlementReadyV1, right: Arc9TravelSettlementReadyV1): boolean {
  return left.operation === right.operation
    && left.receiptKind === right.receiptKind
    && sameCanonical(left.facts, right.facts)
    && sameCanonical(left.route, right.route)
    && sameCanonical(left.source, right.source)
    && sameCanonical(left.successor, right.successor)
    && sameCanonical(left.addedEventAchievementIds, right.addedEventAchievementIds)
    && sameCanonical(left.addedAggregateAchievementIds, right.addedAggregateAchievementIds)
    && sameJson(left.successorState, right.successorState);
}

function sameNoRngPlan(
  plan: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>['plan'],
): boolean {
  return plan.nextSessionRng.seed === plan.currentAuthority.sessionRng.seed
    && plan.nextSessionRng.ordinal === plan.currentAuthority.sessionRng.ordinal + 1
    && sameCanonical(plan.nextSessionRng.draws, plan.currentAuthority.sessionRng.draws);
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): string {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') return outcome.message;
  if (outcome.kind === 'protected') return `protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `lost:${outcome.reason}`;
  return outcome.kind;
}

function needsReload(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): boolean {
  return outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt' || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable' || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

export type Arc9TravelActionOutcomeV1 =
  | Readonly<{
    kind: 'current';
    durability: 'none';
    convergence: 'none';
    facts: Arc9TravelFactV1;
    route: Arc9TravelRouteV1;
    projection: Arc9ProgressionProjectionV1;
    transaction: null;
  }>
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    facts: Arc9TravelFactV1;
    route: Arc9TravelRouteV1;
    source: Arc9TravelOwnedStateV1;
    successor: Arc9TravelOwnedStateV1;
    addedEventAchievementIds: readonly Arc9TravelEventAchievementIdV1[];
    addedAggregateAchievementIds: readonly string[];
    projection: Arc9ProgressionProjectionV1;
    witness: string;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-travel-evidence-missing' | 'committed-travel-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: 'input:invalid-or-unregistered'
      | `preflight:${Arc9TravelProtectionReasonV1}`
      | `transaction:${string}`;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

function invalidTravelInput(): Arc9TravelActionOutcomeV1 {
  return Object.freeze({
    kind: 'refused', durability: 'none', convergence: 'none',
    detail: 'input:invalid-or-unregistered', transaction: null,
  });
}

/** Direct galaxy descent or wormhole traversal: one detached attempt, one
 * immutable receipt, and one revision CAS. */
export async function commitArc9TravelSettlementV1(
  input: Arc9TravelActionInputV1,
): Promise<Arc9TravelActionOutcomeV1> {
  const captured = capture(input, 'direct');
  return captured === null ? invalidTravelInput() : commitCapturedTravelSettlement(captured);
}

/** Standalone accepted Search/Atlas galaxy or system route. Follow must keep
 * using the pure join inside its existing sharing receipt instead. */
export async function commitArc9GalaxyArrivalRouteV1(
  input: Arc9GalaxyArrivalRouteInputV1,
): Promise<Arc9TravelActionOutcomeV1> {
  const captured = capture(input, 'galaxy-arrival-route');
  return captured === null ? invalidTravelInput() : commitCapturedTravelSettlement(captured);
}

async function commitCapturedTravelSettlement(
  captured: CapturedInput,
): Promise<Arc9TravelActionOutcomeV1> {
  const preflight = prepareCapturedTravelSettlement(captured.state, captured);
  if (preflight.kind === 'protected') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `preflight:${preflight.reason}`, transaction: null,
    });
  }
  if (preflight.kind === 'current') {
    return Object.freeze({
      kind: 'current', durability: 'none', convergence: 'none',
      facts: preflight.facts,
      route: preflight.route,
      projection: preflight.projection,
      transaction: null,
    });
  }

  let selected: Readonly<{ plan: Arc9TravelSettlementReadyV1; witness: string }> | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: preflight.operation,
      receiptKind: preflight.receiptKind,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft }) => {
        const plan = prepareCapturedTravelSettlement(draft, captured);
        if (plan.kind !== 'ready' || !samePlan(plan, preflight)) {
          throw new Error('Arc 9 Travel parent changed before derivation');
        }
        const witness = witnessFor(plan, receiptOrdinal);
        selected = Object.freeze({ plan, witness });
        return Object.freeze({
          state: plan.successorState,
          extensionWrites: Object.freeze([]),
          witness,
        });
      },
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: `transaction:${error instanceof Error ? error.message : String(error)}`,
      transaction: null,
    });
  }
  if (transaction.kind !== 'committed') {
    return Object.freeze({
      kind: 'refused', durability: 'none',
      convergence: needsReload(transaction) ? 'read-only-reload' : 'none',
      detail: `transaction:${transactionDetail(transaction)}`,
      transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    plan: Arc9TravelSettlementReadyV1;
    witness: string;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-travel-evidence-missing', transaction,
    });
  }
  const plan = committedSelection.plan;
  const fixedPoint = prepareCapturedTravelSettlement(transaction.state, captured);
  if (fixedPoint.kind !== 'current'
    || transaction.plan.operation !== plan.operation
    || transaction.plan.receiptOrdinal !== transaction.receipt.ordinal
    || transaction.receipt.kind !== plan.receiptKind
    || transaction.receipt.witness !== committedSelection.witness
    || !sameNoRngPlan(transaction.plan)
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(transaction.state, plan.successorState)
    || !sameCanonical(fixedPoint.facts, plan.facts)
    || !sameCanonical(fixedPoint.route, plan.route)
    || !sameCanonical(fixedPoint.projection.unlockedIds, plan.successor.unlocked)
    || !sameCanonical(ownedState(transaction.state, fixedPoint.projection), plan.successor)) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-travel-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    facts: plan.facts,
    route: plan.route,
    source: plan.source,
    successor: plan.successor,
    addedEventAchievementIds: plan.addedEventAchievementIds,
    addedAggregateAchievementIds: plan.addedAggregateAchievementIds,
    projection: fixedPoint.projection,
    witness: committedSelection.witness,
  });
}

/** Publish only the four independently verified compatibility fields and
 * only over the exact live parent used by the committed CAS. */
export function publishArc9TravelFieldsV1(
  target: SaveStateV2,
  outcome: Extract<Arc9TravelActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  const current = ownedState(target);
  if (!sameCanonical(current, outcome.source)) {
    throw new TypeError('Arc 9 Travel publication requires its exact live parent');
  }
  const durable = ownedState(outcome.transaction.state, outcome.projection);
  if (!sameCanonical(durable, outcome.successor)) {
    throw new TypeError('Arc 9 Travel publication requires its committed fixed point');
  }
  target.galSeen = clonePlain(
    outcome.successor.galSeen,
    new Set<object>(),
    { count: 0 },
    0,
  ) as unknown[];
  target.stats = { ...target.stats, bestRank: outcome.successor.bestRank };
  target.unlocked = [...outcome.successor.unlocked];
  target.savedView = outcome.successor.savedView === null
    ? null
    : clonePlain(
      outcome.successor.savedView,
      new Set<object>(),
      { count: 0 },
      0,
    ) as Record<string, unknown>;
}
