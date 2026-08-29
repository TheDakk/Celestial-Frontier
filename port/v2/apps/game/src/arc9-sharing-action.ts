/* Arc 9 CF1 sharing/follow durability owner.

   The mature game counts a world Share when its valid CF1 code is prepared
   for the player, independent of whether a clipboard API succeeds. It counts
   a Follow only after the submitted CF1 route has passed navigation policy
   and is accepted. This module owns the corresponding compatibility counter,
   first-event achievement, and (for Follow) its galaxy-arrival progression and
   exact accepted route in one F4 receipt/CAS. CF1 encoding, parsing, source
   proof, and navigation composition remain owned by @cf/scene and Search. */
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import {
  ascend,
  navFromCanonicalCF1Address,
  navToView,
  parseStrictCF1Code,
  resolveCF1GalaxyAddress,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1Address,
  type NavState,
  type StrictCF1CodeResult,
} from '@cf/scene';
import type { SaveStateV2 } from '@cf/persistence';
import {
  prepareArc9EventAchievementJoinV1,
  projectArc9ProgressionStateV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
} from './arc9-progression-projection.js';
import {
  prepareArc9GalaxyArrivalJoinV1,
  type Arc9GalaxyArrivalFactV1,
  type Arc9TravelProtectionReasonV1,
} from './arc9-travel-action.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const ARC9_SHARE_SEND_OPERATION_V1 = 'arc9-share-send-v1';
export const ARC9_SHARE_SEND_RECEIPT_KIND_V1 = 'arc9-share-send-v1';
export const ARC9_SHARE_FOLLOW_OPERATION_V1 = 'arc9-share-follow-v1';
export const ARC9_SHARE_FOLLOW_RECEIPT_KIND_V1 = 'arc9-share-follow-v1';
export const ARC9_SHARING_WITNESS_SCHEMA_V1 = 'cf-v2-arc9-sharing-witness/v1';

const MAX_COUNTER = 1_000_000_000;
const CLONE_LIMIT = 1_500_000;

export type Arc9SharingActionKindV1 = 'send' | 'follow';
export type Arc9SharingCounterKeyV1 = 'shares' | 'jumps';
export type Arc9SharingAchievementIdV1 = 'share' | 'wayfarer';

const OPERATION = Object.freeze({
  send: ARC9_SHARE_SEND_OPERATION_V1,
  follow: ARC9_SHARE_FOLLOW_OPERATION_V1,
} as const);
const RECEIPT_KIND = Object.freeze({
  send: ARC9_SHARE_SEND_RECEIPT_KIND_V1,
  follow: ARC9_SHARE_FOLLOW_RECEIPT_KIND_V1,
} as const);
const COUNTER = Object.freeze({ send: 'shares', follow: 'jumps' } as const);
const ACHIEVEMENT = Object.freeze({ send: 'share', follow: 'wayfarer' } as const);

export type Arc9SharingProtectionReasonV1 =
  | Arc9ProgressionProjectionProtectionReasonV1
  | 'kind-invalid'
  | 'code-invalid'
  | 'code-unresolved'
  | 'send-requires-world-code'
  | 'accepted-route-invalid'
  | 'accepted-route-mismatch'
  | 'counter-shape'
  | 'counter-capacity'
  | `travel:${Arc9TravelProtectionReasonV1}`
  | 'projection-mismatch';

export interface Arc9SharingRouteV1 {
  readonly tier: 'galaxy' | 'star' | 'planet';
  readonly addressKey: string;
  readonly acceptedSavedView: Readonly<Record<string, unknown>>;
}

export interface Arc9SharingFollowArrivalV1 {
  readonly facts: Arc9GalaxyArrivalFactV1;
  readonly sourceGalSeen: readonly unknown[];
  readonly nextGalSeen: readonly unknown[];
  readonly sourceBestRank: number;
  readonly nextBestRank: number;
  readonly addedEventAchievementIds: readonly string[];
  readonly addedAggregateAchievementIds: readonly string[];
}

export interface Arc9SharingReadyV1 {
  readonly kind: 'ready';
  readonly actionKind: Arc9SharingActionKindV1;
  readonly operation: string;
  readonly receiptKind: string;
  readonly counterKey: Arc9SharingCounterKeyV1;
  readonly counterBefore: number;
  readonly counterAfter: number;
  readonly achievementId: Arc9SharingAchievementIdV1;
  readonly achievementAdded: boolean;
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly route: Arc9SharingRouteV1;
  readonly arrival: Arc9SharingFollowArrivalV1 | null;
  readonly sourceSavedView: Readonly<Record<string, unknown>> | null;
  readonly successorState: SaveStateV2;
}

export type Arc9SharingPreparationV1 =
  | Arc9SharingReadyV1
  | Readonly<{ kind: 'protected'; reason: Arc9SharingProtectionReasonV1 }>;

type ValidStrictCF1Code = Extract<StrictCF1CodeResult, { kind: 'valid' }>;

function clonePlain(
  value: unknown,
  ancestors: Set<object>,
  budget: { count: number },
  depth: number,
): unknown {
  if (value === null || value === undefined || typeof value === 'string'
    || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value !== 'object') throw new TypeError('sharing state must contain only plain data');
  if (depth > 256 || budget.count >= CLONE_LIMIT) {
    throw new RangeError('sharing state exceeds the detachment bound');
  }
  if (ancestors.has(value)) throw new TypeError('sharing state cannot contain cycles');
  budget.count++;
  ancestors.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (Array.isArray(value)) {
      if (prototype !== Array.prototype) throw new TypeError('sharing arrays must use the native prototype');
      const length = Object.getOwnPropertyDescriptor(value, 'length');
      const keys = Reflect.ownKeys(value);
      if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
        || length.value < 0 || keys.length !== length.value + 1) {
        throw new TypeError('sharing arrays must be exact dense data');
      }
      const clone: unknown[] = [];
      for (let index = 0; index < length.value; index++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
          throw new TypeError('sharing arrays cannot contain accessors or holes');
        }
        clone.push(clonePlain(descriptor.value, ancestors, budget, depth + 1));
      }
      return clone;
    }
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('sharing objects must use a plain prototype');
    }
    const clone: Record<string, unknown> = Object.create(prototype) as Record<string, unknown>;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new TypeError('sharing state cannot contain symbol keys');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
        throw new TypeError('sharing state cannot contain accessors or hidden fields');
      }
      Object.defineProperty(clone, key, {
        value: clonePlain(descriptor.value, ancestors, budget, depth + 1),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
}

function plainRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  if (Reflect.ownKeys(value).some((key) => typeof key !== 'string')) return null;
  return value as Record<string, unknown>;
}

function dataValue(record: Record<string, unknown>, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && 'value' in descriptor && descriptor.enumerable === true
    ? descriptor.value : undefined;
}

function sameJson(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function resolvedAddress(parsed: ValidStrictCF1Code): CanonicalCF1Address | null {
  const result = parsed.tier === 'galaxy'
    ? resolveCF1GalaxyAddress(parsed.candidate)
    : parsed.tier === 'star'
      ? resolveCF1StarAddress(parsed.candidate)
      : resolveCF1WorldAddress(parsed.candidate);
  return result.ok ? result.address : null;
}

type GalaxyNav = Extract<NavState, { readonly mode: 'galaxy' }>;

interface Arc9SharingRouteContextV1 {
  readonly route: Arc9SharingRouteV1;
  readonly galaxyNav: GalaxyNav;
}

function navsForAddress(address: CanonicalCF1Address): Readonly<{
  committedNav: Exclude<NavState, { readonly mode: 'surface' | 'universe' }>;
  galaxyNav: GalaxyNav;
}> | null {
  const resolved = navFromCanonicalCF1Address(address);
  if (!resolved.ok) return null;
  const committedNav = resolved.state.mode === 'surface'
    ? ascend(resolved.state)
    : resolved;
  if (!committedNav.ok || (committedNav.state.mode !== 'galaxy'
    && committedNav.state.mode !== 'system')) return null;
  const galaxyNav = committedNav.state.mode === 'galaxy'
    ? committedNav
    : ascend(committedNav.state);
  if (!galaxyNav.ok || galaxyNav.state.mode !== 'galaxy') return null;
  return Object.freeze({ committedNav: committedNav.state, galaxyNav: galaxyNav.state });
}

function routeContextForCode(code: string): Arc9SharingRouteContextV1 | null {
  const parsed = parseStrictCF1Code(code);
  if (parsed.kind !== 'valid') return null;
  const address = resolvedAddress(parsed);
  if (address === null) return null;
  const navs = navsForAddress(address);
  if (navs === null) return null;
  const savedView = navToView(navs.committedNav);
  if (savedView === null) return null;
  return Object.freeze({
    route: Object.freeze({
      tier: parsed.tier,
      addressKey: address.key,
      acceptedSavedView: clonePlain(
        savedView,
        new Set<object>(),
        { count: 0 },
        0,
      ) as Readonly<Record<string, unknown>>,
    }),
    galaxyNav: navs.galaxyNav,
  });
}

function checkedCounter(state: SaveStateV2, key: Arc9SharingCounterKeyV1): number | null {
  const root = plainRecord(state);
  const stats = root === null ? null : plainRecord(dataValue(root, 'stats'));
  const value = stats === null ? undefined : dataValue(stats, key);
  return typeof value === 'number' && Number.isSafeInteger(value)
    && value >= 0 && value <= MAX_COUNTER ? value : null;
}

/** Pure preparation. `acceptedSavedView` is null for native Share and the
 * Search controller's already-authorized committed route for Follow. */
export function prepareArc9SharingActionV1(
  state: SaveStateV2,
  actionKind: Arc9SharingActionKindV1,
  code: string,
  acceptedSavedView: Readonly<Record<string, unknown>> | null,
): Arc9SharingPreparationV1 {
  try {
    if (actionKind !== 'send' && actionKind !== 'follow') {
      return Object.freeze({ kind: 'protected', reason: 'kind-invalid' });
    }
    if (typeof code !== 'string') {
      return Object.freeze({ kind: 'protected', reason: 'code-invalid' });
    }
    const parsed = parseStrictCF1Code(code);
    if (parsed.kind !== 'valid') {
      return Object.freeze({ kind: 'protected', reason: 'code-invalid' });
    }
    const routeContext = routeContextForCode(code);
    if (routeContext === null) {
      return Object.freeze({ kind: 'protected', reason: 'code-unresolved' });
    }
    const { route } = routeContext;
    if (actionKind === 'send' && route.tier !== 'planet') {
      return Object.freeze({ kind: 'protected', reason: 'send-requires-world-code' });
    }
    if (actionKind === 'send' && acceptedSavedView !== null) {
      return Object.freeze({ kind: 'protected', reason: 'accepted-route-invalid' });
    }
    if (actionKind === 'follow') {
      const accepted = plainRecord(acceptedSavedView);
      if (accepted === null) {
        return Object.freeze({ kind: 'protected', reason: 'accepted-route-invalid' });
      }
      const detached = clonePlain(accepted, new Set<object>(), { count: 0 }, 0);
      if (!sameJson(detached, route.acceptedSavedView)) {
        return Object.freeze({ kind: 'protected', reason: 'accepted-route-mismatch' });
      }
    }
    const counterKey = COUNTER[actionKind];
    const counterBefore = checkedCounter(state, counterKey);
    if (counterBefore === null) {
      return Object.freeze({ kind: 'protected', reason: 'counter-shape' });
    }
    if (counterBefore >= MAX_COUNTER) {
      return Object.freeze({ kind: 'protected', reason: 'counter-capacity' });
    }
    const achievementId = ACHIEVEMENT[actionKind];
    const achievement = prepareArc9EventAchievementJoinV1(state, achievementId);
    if (achievement.kind !== 'prepared') return achievement;
    const root = plainRecord(state);
    const stats = root === null ? null : plainRecord(dataValue(root, 'stats'));
    if (root === null || stats === null) {
      return Object.freeze({ kind: 'protected', reason: 'counter-shape' });
    }
    const sourceSavedView = clonePlain(
      state.savedView,
      new Set<object>(),
      { count: 0 },
      0,
    ) as Readonly<Record<string, unknown>> | null;
    const counterAfter = counterBefore + 1;
    let successorState: SaveStateV2 = {
      ...state,
      stats: { ...state.stats, [counterKey]: counterAfter },
      unlocked: [...achievement.nextUnlockedIds],
      ...(actionKind === 'follow'
        ? { savedView: clonePlain(
          route.acceptedSavedView,
          new Set<object>(),
          { count: 0 },
          0,
        ) as Record<string, unknown> }
        : {}),
    };
    let arrival: Arc9SharingFollowArrivalV1 | null = null;
    if (actionKind === 'follow') {
      const joined = prepareArc9GalaxyArrivalJoinV1(
        successorState,
        routeContext.galaxyNav,
        route.acceptedSavedView,
      );
      if (joined.kind === 'protected') {
        return Object.freeze({ kind: 'protected', reason: `travel:${joined.reason}` });
      }
      if (joined.facts.actionKind !== 'galaxy-arrival') {
        return Object.freeze({ kind: 'protected', reason: 'travel:source-mismatch' });
      }
      if (joined.kind === 'ready') successorState = joined.successorState;
      const sourceGalSeen = joined.kind === 'ready'
        ? joined.source.galSeen : successorState.galSeen;
      const nextGalSeen = joined.kind === 'ready'
        ? joined.successor.galSeen : successorState.galSeen;
      const sourceBestRank = joined.kind === 'ready'
        ? joined.source.bestRank : joined.projection.savedBestRankIndex;
      const nextBestRank = joined.kind === 'ready'
        ? joined.successor.bestRank : joined.projection.savedBestRankIndex;
      arrival = Object.freeze({
        facts: joined.facts,
        sourceGalSeen: Object.freeze(clonePlain(
          sourceGalSeen, new Set<object>(), { count: 0 }, 0,
        ) as unknown[]),
        nextGalSeen: Object.freeze(clonePlain(
          nextGalSeen, new Set<object>(), { count: 0 }, 0,
        ) as unknown[]),
        sourceBestRank,
        nextBestRank,
        addedEventAchievementIds: joined.kind === 'ready'
          ? Object.freeze([...joined.addedEventAchievementIds]) : Object.freeze([]),
        addedAggregateAchievementIds: joined.kind === 'ready'
          ? Object.freeze([...joined.addedAggregateAchievementIds]) : Object.freeze([]),
      });
    }
    const projection = projectArc9ProgressionStateV1(successorState);
    const row = projection.kind === 'projected'
      ? projection.projection.achievements.rows.find(({ id }) => id === achievementId)
      : null;
    if (projection.kind !== 'projected'
      || projection.projection.snapshot[
        actionKind === 'send' ? 'sharedCodeCount' : 'followedShareCodeCount'
      ] !== counterAfter
      || row?.status !== 'unlocked') {
      return Object.freeze({ kind: 'protected', reason: 'projection-mismatch' });
    }
    return Object.freeze({
      kind: 'ready',
      actionKind,
      operation: OPERATION[actionKind],
      receiptKind: RECEIPT_KIND[actionKind],
      counterKey,
      counterBefore,
      counterAfter,
      achievementId,
      achievementAdded: achievement.added,
      priorUnlockedIds: Object.freeze([...state.unlocked]),
      nextUnlockedIds: Object.freeze([...successorState.unlocked]),
      route,
      arrival,
      sourceSavedView,
      successorState,
    });
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'projection-mismatch' });
  }
}

export interface Arc9SharingActionInputV1 {
  readonly runtime: Pick<F4RuntimeAuthority, 'commitAction'>;
  readonly state: SaveStateV2;
  readonly actionKind: Arc9SharingActionKindV1;
  readonly code: string;
  readonly acceptedSavedView: Readonly<Record<string, unknown>> | null;
  readonly codecNow: number;
}

export type Arc9SharingActionOutcomeV1 =
  | Readonly<{
    kind: 'committed';
    durability: 'committed';
    convergence: 'none';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
    actionKind: Arc9SharingActionKindV1;
    counterKey: Arc9SharingCounterKeyV1;
    counterBefore: number;
    counterAfter: number;
    achievementId: Arc9SharingAchievementIdV1;
    achievementAdded: boolean;
    priorUnlockedIds: readonly string[];
    nextUnlockedIds: readonly string[];
    route: Arc9SharingRouteV1;
    arrival: Arc9SharingFollowArrivalV1 | null;
    sourceSavedView: Readonly<Record<string, unknown>> | null;
    witness: string;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    durability: 'committed';
    convergence: 'read-only-reload';
    detail: 'committed-sharing-evidence-missing' | 'committed-sharing-fixed-point-mismatch';
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'refused';
    durability: 'none';
    convergence: 'none' | 'read-only-reload';
    detail: 'input:invalid-or-unregistered'
      | `preflight:${Arc9SharingProtectionReasonV1}`
      | `transaction:${string}`;
    transaction: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }> | null;
  }>;

interface CapturedInput {
  readonly commit: F4RuntimeAuthority['commitAction'];
  readonly state: SaveStateV2;
  readonly actionKind: Arc9SharingActionKindV1;
  readonly code: string;
  readonly acceptedSavedView: Readonly<Record<string, unknown>> | null;
  readonly codecNow: number;
}

const INPUT_FIELDS = Object.freeze([
  'runtime', 'state', 'actionKind', 'code', 'acceptedSavedView', 'codecNow',
] as const);

function capture(input: Arc9SharingActionInputV1): CapturedInput | null {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(input);
    const names = keys.filter((key): key is string => typeof key === 'string').sort();
    const expected = [...INPUT_FIELDS].sort();
    if (keys.length !== expected.length
      || names.some((name, index) => name !== expected[index])) return null;
    const values: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const field of INPUT_FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) return null;
      values[field] = descriptor.value;
    }
    const runtime = values.runtime;
    if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)) return null;
    const commit = Object.getOwnPropertyDescriptor(runtime, 'commitAction');
    if (!commit || !('value' in commit) || typeof commit.value !== 'function') return null;
    if (!values.state || typeof values.state !== 'object' || Array.isArray(values.state)
      || (values.actionKind !== 'send' && values.actionKind !== 'follow')
      || typeof values.code !== 'string'
      || typeof values.codecNow !== 'number' || !Number.isFinite(values.codecNow)) return null;
    const acceptedSavedView = values.acceptedSavedView === null
      ? null
      : clonePlain(values.acceptedSavedView, new Set<object>(), { count: 0 }, 0) as Readonly<Record<string, unknown>>;
    return Object.freeze({
      commit: commit.value.bind(runtime) as F4RuntimeAuthority['commitAction'],
      state: clonePlain(values.state, new Set<object>(), { count: 0 }, 0) as SaveStateV2,
      actionKind: values.actionKind,
      code: values.code,
      acceptedSavedView,
      codecNow: values.codecNow,
    });
  } catch {
    return null;
  }
}

function witnessFor(plan: Arc9SharingReadyV1, code: string, receiptOrdinal: number): string {
  return `arc9s1:${sha256Hex(canonicalJson({
    schema: ARC9_SHARING_WITNESS_SCHEMA_V1,
    operation: plan.operation,
    receiptOrdinal,
    actionKind: plan.actionKind,
    codeDigest: sha256Hex(code),
    route: plan.route,
    counterKey: plan.counterKey,
    counterBefore: plan.counterBefore,
    counterAfter: plan.counterAfter,
    achievementId: plan.achievementId,
    achievementAdded: plan.achievementAdded,
    ...(plan.arrival === null ? {} : { arrival: plan.arrival }),
  }))}`;
}

function transactionDetail(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): `transaction:${string}` {
  if (outcome.kind === 'rejected' || outcome.kind === 'storage-error') {
    return `transaction:${outcome.message}`;
  }
  if (outcome.kind === 'protected') return `transaction:protected:${outcome.reason}`;
  if (outcome.kind === 'lost') return `transaction:lost:${outcome.reason}`;
  return `transaction:${outcome.kind}`;
}

function needsReload(
  outcome: Exclude<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>,
): boolean {
  return outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
    || outcome.kind === 'duplicate-receipt' || outcome.kind === 'lost'
    || outcome.kind === 'lease-unavailable' || outcome.kind === 'protected'
    || outcome.kind === 'storage-error';
}

function samePlan(left: Arc9SharingReadyV1, right: Arc9SharingReadyV1): boolean {
  return left.actionKind === right.actionKind
    && left.operation === right.operation
    && left.receiptKind === right.receiptKind
    && left.counterKey === right.counterKey
    && left.counterBefore === right.counterBefore
    && left.counterAfter === right.counterAfter
    && left.achievementId === right.achievementId
    && left.achievementAdded === right.achievementAdded
    && sameJson(left.priorUnlockedIds, right.priorUnlockedIds)
    && sameJson(left.nextUnlockedIds, right.nextUnlockedIds)
    && sameJson(left.route, right.route)
    && sameJson(left.arrival, right.arrival)
    && sameJson(left.sourceSavedView, right.sourceSavedView)
    && sameJson(left.successorState, right.successorState);
}

function sameNoRngPlan(
  plan: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>['plan'],
): boolean {
  return plan.nextSessionRng.seed === plan.currentAuthority.sessionRng.seed
    && plan.nextSessionRng.ordinal === plan.currentAuthority.sessionRng.ordinal + 1
    && sameJson(plan.nextSessionRng.draws, plan.currentAuthority.sessionRng.draws);
}

function committedArrivalIsFixedPoint(
  state: SaveStateV2,
  plan: Arc9SharingReadyV1,
  code: string,
): boolean {
  if (plan.actionKind === 'send') return plan.arrival === null;
  if (plan.arrival === null) return false;
  const context = routeContextForCode(code);
  if (context === null) return false;
  const fixedPoint = prepareArc9GalaxyArrivalJoinV1(
    state,
    context.galaxyNav,
    plan.route.acceptedSavedView,
  );
  return fixedPoint.kind === 'current'
    && fixedPoint.facts.actionKind === 'galaxy-arrival'
    && sameJson(fixedPoint.facts, plan.arrival.facts)
    && sameJson(state.galSeen, plan.arrival.nextGalSeen)
    && state.stats.bestRank === plan.arrival.nextBestRank
    && sameJson(fixedPoint.projection.unlockedIds, plan.nextUnlockedIds)
    && fixedPoint.projection.savedBestRankIndex === plan.arrival.nextBestRank
    && plan.arrival.facts.eventAchievementIds.every((id) =>
      fixedPoint.projection.achievements.rows.find((row) => row.id === id)?.status === 'unlocked');
}

/** One detached attempt, one receipt, one CAS, no retry or precommit publication. */
export async function commitArc9SharingActionV1(
  input: Arc9SharingActionInputV1,
): Promise<Arc9SharingActionOutcomeV1> {
  const captured = capture(input);
  if (captured === null) {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
  }
  const preflight = prepareArc9SharingActionV1(
    captured.state,
    captured.actionKind,
    captured.code,
    captured.acceptedSavedView,
  );
  if (preflight.kind !== 'ready') {
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: `preflight:${preflight.reason}`, transaction: null,
    });
  }

  let selected: Readonly<{ plan: Arc9SharingReadyV1; witness: string }> | null = null;
  let transaction: F4RuntimeActionCommitOutcome;
  try {
    transaction = await captured.commit({
      state: captured.state,
      operation: preflight.operation,
      receiptKind: preflight.receiptKind,
      codecNow: captured.codecNow,
      derive: ({ receiptOrdinal, draft }) => {
        const plan = prepareArc9SharingActionV1(
          draft,
          captured.actionKind,
          captured.code,
          captured.acceptedSavedView,
        );
        if (plan.kind !== 'ready' || !samePlan(plan, preflight)) {
          throw new Error('Arc 9 sharing parent changed before derivation');
        }
        const witness = witnessFor(plan, captured.code, receiptOrdinal);
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
      detail: transactionDetail(transaction), transaction,
    });
  }
  const committedSelection = selected as Readonly<{
    plan: Arc9SharingReadyV1;
    witness: string;
  }> | null;
  if (committedSelection === null) {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-sharing-evidence-missing', transaction,
    });
  }
  const plan = committedSelection.plan;
  const projection = projectArc9ProgressionStateV1(transaction.state);
  const row = projection.kind === 'projected'
    ? projection.projection.achievements.rows.find(({ id }) => id === plan.achievementId)
    : null;
  const projectedCounter = projection.kind === 'projected'
    ? projection.projection.snapshot[
      plan.actionKind === 'send' ? 'sharedCodeCount' : 'followedShareCodeCount'
    ] : null;
  if (transaction.plan.operation !== plan.operation
    || transaction.plan.receiptOrdinal !== transaction.receipt.ordinal
    || transaction.receipt.kind !== plan.receiptKind
    || transaction.receipt.witness !== committedSelection.witness
    || !sameNoRngPlan(transaction.plan)
    || !sameJson(transaction.state, transaction.saved.canonicalState)
    || !sameJson(transaction.state, plan.successorState)
    || transaction.state.stats[plan.counterKey] !== plan.counterAfter
    || !sameJson(transaction.state.unlocked, plan.nextUnlockedIds)
    || (plan.actionKind === 'follow'
      && !sameJson(transaction.state.savedView, plan.route.acceptedSavedView))
    || !committedArrivalIsFixedPoint(transaction.state, plan, captured.code)
    || projection.kind !== 'projected'
    || projectedCounter !== plan.counterAfter
    || row?.status !== 'unlocked') {
    return Object.freeze({
      kind: 'committed-convergence', durability: 'committed',
      convergence: 'read-only-reload', detail: 'committed-sharing-fixed-point-mismatch', transaction,
    });
  }
  return Object.freeze({
    kind: 'committed', durability: 'committed', convergence: 'none', transaction,
    actionKind: plan.actionKind,
    counterKey: plan.counterKey,
    counterBefore: plan.counterBefore,
    counterAfter: plan.counterAfter,
    achievementId: plan.achievementId,
    achievementAdded: plan.achievementAdded,
    priorUnlockedIds: plan.priorUnlockedIds,
    nextUnlockedIds: plan.nextUnlockedIds,
    route: plan.route,
    arrival: plan.arrival,
    sourceSavedView: plan.sourceSavedView,
    witness: committedSelection.witness,
  });
}

/** Publish only the independently verified sharing/arrival compatibility
 * fields. All unrelated live object identities remain existing-system owned. */
export function publishArc9SharingFieldsV1(
  target: SaveStateV2,
  outcome: Extract<Arc9SharingActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  if (checkedCounter(target, outcome.counterKey) !== outcome.counterBefore
    || !sameJson(target.unlocked, outcome.priorUnlockedIds)
    || (outcome.actionKind === 'follow'
      && (outcome.arrival === null
        || !sameJson(target.savedView, outcome.sourceSavedView)
        || !sameJson(target.galSeen, outcome.arrival.sourceGalSeen)
        || target.stats.bestRank !== outcome.arrival.sourceBestRank))) {
    throw new TypeError('Arc 9 sharing publication requires its exact live parent');
  }
  const committed = outcome.transaction.state;
  if (committed.stats[outcome.counterKey] !== outcome.counterAfter
    || !sameJson(committed.unlocked, outcome.nextUnlockedIds)
    || (outcome.actionKind === 'follow'
      && (outcome.arrival === null
        || !sameJson(committed.savedView, outcome.route.acceptedSavedView)
        || !sameJson(committed.galSeen, outcome.arrival.nextGalSeen)
        || committed.stats.bestRank !== outcome.arrival.nextBestRank))) {
    throw new TypeError('Arc 9 sharing publication requires its committed fixed point');
  }
  let nextGalSeen: unknown[] | null = null;
  let nextSavedView: Record<string, unknown> | null = null;
  if (outcome.actionKind === 'follow') {
    if (outcome.arrival === null) {
      throw new TypeError('Arc 9 sharing publication requires its committed arrival');
    }
    nextGalSeen = clonePlain(
      outcome.arrival.nextGalSeen,
      new Set<object>(),
      { count: 0 },
      0,
    ) as unknown[];
    nextSavedView = clonePlain(
      outcome.route.acceptedSavedView,
      new Set<object>(),
      { count: 0 },
      0,
    ) as Record<string, unknown>;
  }
  target.stats = {
    ...target.stats,
    [outcome.counterKey]: outcome.counterAfter,
    ...(outcome.arrival === null ? {} : { bestRank: outcome.arrival.nextBestRank }),
  };
  target.unlocked = [...outcome.nextUnlockedIds];
  if (outcome.actionKind === 'follow') {
    if (nextGalSeen === null || nextSavedView === null) {
      throw new TypeError('Arc 9 sharing publication requires its committed arrival');
    }
    target.galSeen = nextGalSeen;
    target.savedView = nextSavedView;
  }
}
