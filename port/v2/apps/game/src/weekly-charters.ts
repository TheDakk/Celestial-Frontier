/* Bounded v2 weekly-Charter lifecycle.

   This module preserves the exact v1.8.9 pool, wall-week draw, three-active
   cap, accept-to-activate rule, filters and Stardust rewards. The clock is an
   injected F4 codec instant: callers never supply a week. Forward rollover is
   atomic; a backward clock preserves the saved week; an impossible future
   carrier is protected instead of being rewound into replayable work. */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import {
  canonicalJson,
  sha256Hex,
} from '@cf/domain-acquisition';
import {
  isWorldOpportunitySnapshot,
  type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import {
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import {
  getCanonicalCF1AddressKey,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  prepareArc9ProgressionRefreshV1,
  type Arc9ProgressionProjectionV1,
} from './arc9-progression-projection.js';
import {
  STARTER_CHARTER_CAP_V1,
  STARTER_CHARTER_IDS_V1,
} from './starter-charters.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';

export const WEEKLY_CHARTER_MS_V1 = 604_800_000;
export const WEEKLY_CHARTER_DRAW_COUNT_V1 = 3;
export const WEEKLY_CHARTER_ROLLOVER_RECEIPT_KIND_V1 =
  'arc8-weekly-charter-rollover-v1' as const;
export const WEEKLY_CHARTER_ACCEPT_RECEIPT_KIND_V1 =
  'arc8-weekly-charter-accept-v1' as const;
export const WEEKLY_CHARTER_WITNESS_SCHEMA_V1 =
  'cf-v2-weekly-charter-witness/v1' as const;
const WEEKLY_CHARTER_ROLLOVER_OPERATION_PREFIX_V1 = 'arc8.weekly-charter-rollover:';
const WEEKLY_CHARTER_ACCEPT_OPERATION_PREFIX_V1 = 'arc8.weekly-charter-accept:';
const MAX_STARDUST = Number.MAX_SAFE_INTEGER;
const MAX_CHARTER_COUNTER = Number.MAX_SAFE_INTEGER;

export const WEEKLY_CHARTER_IDS_V1 = Object.freeze([
  'wk-land', 'wk-mine', 'wk-scan', 'wk-sp',
  'wk-conq', 'wk-feed', 'wk-breed', 'wk-hostile',
] as const);
export type WeeklyCharterIdV1 = (typeof WEEKLY_CHARTER_IDS_V1)[number];

export type WeeklyCharterEventV1 =
  | Readonly<{
    kind: 'landfall'; opportunity: WorldOpportunitySnapshot; first: boolean;
  }>
  | Readonly<{
    kind: 'mined'; opportunity: WorldOpportunitySnapshot; first: boolean;
  }>
  | Readonly<{
    kind: 'bioscan'; opportunity: WorldOpportunitySnapshot; first: boolean;
  }>
  | Readonly<{ kind: 'species'; codexId: string; first: boolean }>
  | Readonly<{ kind: 'conquest'; address: CanonicalCF1WorldAddress; first: boolean }>
  | Readonly<{ kind: 'fed'; ok: boolean }>
  | Readonly<{ kind: 'bred'; ok: boolean }>;

export interface WeeklyCharterDefinitionV1 {
  readonly id: WeeklyCharterIdV1;
  readonly event: WeeklyCharterEventV1['kind'];
  readonly count: number;
  readonly title: string;
  readonly description: string;
  readonly stardust: number;
}

export const WEEKLY_CHARTER_POOL_V1: readonly WeeklyCharterDefinitionV1[] = Object.freeze([
  Object.freeze({
    id: 'wk-land', event: 'landfall', count: 3,
    title: 'Boots on three worlds',
    description: 'Make planetfall on 3 worlds you have never stood on.', stardust: 20,
  }),
  Object.freeze({
    id: 'wk-mine', event: 'mined', count: 3,
    title: 'Deep veins',
    description: 'Mine deposits on 3 dead worlds you have never mined.', stardust: 25,
  }),
  Object.freeze({
    id: 'wk-scan', event: 'bioscan', count: 3,
    title: 'Field naturalist',
    description: 'Discover life on 3 new worlds.', stardust: 25,
  }),
  Object.freeze({
    id: 'wk-sp', event: 'species', count: 5,
    title: 'Grow the Compendium',
    description: 'Catalogue 5 new species.', stardust: 25,
  }),
  Object.freeze({
    id: 'wk-conq', event: 'conquest', count: 1,
    title: 'Raise a flag', description: 'Conquer a world.', stardust: 30,
  }),
  Object.freeze({
    id: 'wk-feed', event: 'fed', count: 3,
    title: 'Keeper of beasts',
    description: 'Feed your fauna 3 welcome meals.', stardust: 20,
  }),
  Object.freeze({
    id: 'wk-breed', event: 'bred', count: 1,
    title: 'A new bloodline',
    description: 'Breed any pair into a hybrid.', stardust: 30,
  }),
  Object.freeze({
    id: 'wk-hostile', event: 'landfall', count: 1,
    title: 'Down the hard way',
    description: 'Land on a gas giant, a hothouse or a molten world — the descent will fight you.',
    stardust: 35,
  }),
]);

const DEFINITION_BY_ID = new Map(
  WEEKLY_CHARTER_POOL_V1.map((definition) => [definition.id, definition]),
);
const WEEKLY_ID_SET = new Set<string>(WEEKLY_CHARTER_IDS_V1);
const STARTER_ID_SET = new Set<string>(STARTER_CHARTER_IDS_V1);
const TRADES_IDS = Object.freeze([
  'st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq',
] as const);
const HOSTILE_TYPES = new Set(['venus', 'lava', 'gas']);

function checkedInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new RangeError(`${label} is outside its exact integer range`);
  }
  return value as number;
}

function checkedCodecNow(codecNow: number): number {
  return checkedInteger(codecNow, 0, Number.MAX_SAFE_INTEGER, 'weekly Charter codec instant');
}

export function wallWeekForWeeklyChartersV1(codecNow: number): number {
  return Math.floor(checkedCodecNow(codecNow) / WEEKLY_CHARTER_MS_V1);
}

function checkedWeek(value: unknown): number {
  return checkedInteger(value, -1, Number.MAX_SAFE_INTEGER, 'weekly Charter saved week');
}

function definitionFor(id: WeeklyCharterIdV1): WeeklyCharterDefinitionV1 {
  const definition = DEFINITION_BY_ID.get(id);
  if (!definition) throw new RangeError(`unknown weekly Charter ${id}`);
  return definition;
}

function checkedAccepted(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 50) {
    throw new RangeError('accepted Charter bound exceeded');
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || id.length < 1 || id.length >= 24
      || seen.has(id) || (!WEEKLY_ID_SET.has(id) && !STARTER_ID_SET.has(id))) {
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
  if ((prototype !== Object.prototype && prototype !== null)
    || Reflect.ownKeys(value).some((key) => typeof key !== 'string')) {
    throw new TypeError('Charter progress must use a plain string-keyed prototype');
  }
  const result: Record<string, number> = {};
  for (const key of Object.keys(value)) {
    if (key.length < 1 || key.length >= 24) {
      throw new RangeError('Charter progress key is invalid');
    }
    result[key] = checkedInteger(
      (value as Record<string, unknown>)[key], 0, 999, `Charter progress ${key}`,
    );
  }
  return result;
}

function checkedDone(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > STARTER_CHARTER_IDS_V1.length) {
    throw new RangeError('completed starter Charter bound exceeded');
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !STARTER_ID_SET.has(id) || seen.has(id)) {
      throw new RangeError('completed starter Charter carrier is not canonical');
    }
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function weeklyCharterSlateForWeekV1(week: number): readonly WeeklyCharterDefinitionV1[] {
  checkedInteger(week, 0, Number.MAX_SAFE_INTEGER, 'weekly Charter draw week');
  const random = mulberry32(hashInt(0xC4A7, week, 7) >>> 0);
  const pool = [...WEEKLY_CHARTER_POOL_V1];
  const result: WeeklyCharterDefinitionV1[] = [];
  for (let index = 0; index < WEEKLY_CHARTER_DRAW_COUNT_V1 && pool.length > 0; index += 1) {
    result.push(pool.splice((random() * pool.length) | 0, 1)[0]!);
  }
  return Object.freeze(result);
}

export type WeeklyCharterClockStatusV1 =
  | 'initialized'
  | 'forward-rollover'
  | 'same-week'
  | 'backward-preserved';

interface WeeklyAuthorityPlanV1 {
  readonly wallWeek: number;
  readonly sourceWeek: number;
  readonly effectiveWeek: number;
  readonly status: WeeklyCharterClockStatusV1;
  readonly accepted: readonly string[];
  readonly progress: Readonly<Record<string, number>>;
  readonly expiredAcceptedIds: readonly WeeklyCharterIdV1[];
  readonly clearedProgressIds: readonly string[];
  readonly done: readonly string[];
}

function planAuthority(state: SaveStateV2, codecNow: number): WeeklyAuthorityPlanV1 {
  const wallWeek = wallWeekForWeeklyChartersV1(codecNow);
  const sourceWeek = checkedWeek(state.chWeek);
  const accepted = checkedAccepted(state.chacc);
  const progress = checkedProgress(state.chProg);
  const done = checkedDone(state.chDone);
  if (accepted.some((id) => done.includes(id))) {
    throw new RangeError('completed starter Charter remains accepted');
  }
  if (accepted.some((id) => WEEKLY_ID_SET.has(id))
    && !TRADES_IDS.every((id) => done.includes(id))) {
    throw new RangeError('accepted weekly Charter predates the completed trades gate');
  }
  if (sourceWeek > wallWeek + 1) {
    throw new RangeError('weekly Charter saved week is impossibly ahead of the wall week');
  }
  const rollover = sourceWeek === -1 || wallWeek > sourceWeek;
  if (rollover) {
    const expiredAcceptedIds = accepted.filter((id): id is WeeklyCharterIdV1 => WEEKLY_ID_SET.has(id));
    const clearedProgressIds = Object.keys(progress).filter((id) => id.startsWith('w'));
    return Object.freeze({
      wallWeek,
      sourceWeek,
      effectiveWeek: wallWeek,
      status: sourceWeek === -1 ? 'initialized' : 'forward-rollover',
      accepted: Object.freeze(accepted.filter((id) => !id.startsWith('w'))),
      progress: Object.freeze(Object.fromEntries(
        Object.entries(progress).filter(([id]) => !id.startsWith('w')),
      )),
      expiredAcceptedIds: Object.freeze(expiredAcceptedIds),
      clearedProgressIds: Object.freeze(clearedProgressIds),
      done: Object.freeze(done),
    });
  }
  const slateIds = new Set(weeklyCharterSlateForWeekV1(sourceWeek).map(({ id }) => id));
  for (const id of accepted) {
    if (WEEKLY_ID_SET.has(id) && !slateIds.has(id as WeeklyCharterIdV1)) {
      throw new RangeError('accepted weekly Charter is outside its saved-week slate');
    }
    const definition = DEFINITION_BY_ID.get(id as WeeklyCharterIdV1);
    if (definition && (progress[id] ?? 0) >= definition.count) {
      throw new RangeError('completed weekly Charter remains accepted');
    }
  }
  for (const id of Object.keys(progress)) {
    if (id.startsWith('w') && (!WEEKLY_ID_SET.has(id) || !slateIds.has(id as WeeklyCharterIdV1))) {
      throw new RangeError('weekly Charter progress is outside its saved-week slate');
    }
  }
  return Object.freeze({
    wallWeek,
    sourceWeek,
    effectiveWeek: sourceWeek,
    status: sourceWeek === wallWeek ? 'same-week' : 'backward-preserved',
    accepted: Object.freeze(accepted),
    progress: Object.freeze(progress),
    expiredAcceptedIds: Object.freeze([]),
    clearedProgressIds: Object.freeze([]),
    done: Object.freeze(done),
  });
}

export interface WeeklyCharterRolloverFactsV1 {
  readonly wallWeek: number;
  readonly sourceWeek: number;
  readonly effectiveWeek: number;
  readonly status: WeeklyCharterClockStatusV1;
  readonly expiredAcceptedIds: readonly WeeklyCharterIdV1[];
  readonly clearedProgressIds: readonly string[];
}

export type WeeklyCharterRolloverStageOutcomeV1 =
  | Readonly<{ kind: 'ready'; facts: WeeklyCharterRolloverFactsV1 }>
  | Readonly<{ kind: 'current'; facts: WeeklyCharterRolloverFactsV1 }>
  | Readonly<{ kind: 'refused'; reason: string }>;

function rolloverFacts(plan: WeeklyAuthorityPlanV1): WeeklyCharterRolloverFactsV1 {
  return Object.freeze({
    wallWeek: plan.wallWeek,
    sourceWeek: plan.sourceWeek,
    effectiveWeek: plan.effectiveWeek,
    status: plan.status,
    expiredAcceptedIds: plan.expiredAcceptedIds,
    clearedProgressIds: plan.clearedProgressIds,
  });
}

function applyAuthorityPlan(draft: SaveStateV2, plan: WeeklyAuthorityPlanV1): boolean {
  if (plan.status !== 'initialized' && plan.status !== 'forward-rollover') return false;
  draft.chWeek = plan.effectiveWeek;
  draft.chacc = [...plan.accepted];
  draft.chProg = { ...plan.progress };
  return true;
}

export function stageWeeklyCharterRolloverV1(input: Readonly<{
  draft: SaveStateV2;
  codecNow: number;
}>): WeeklyCharterRolloverStageOutcomeV1 {
  try {
    const plan = planAuthority(input.draft, input.codecNow);
    const changed = applyAuthorityPlan(input.draft, plan);
    return Object.freeze({ kind: changed ? 'ready' : 'current', facts: rolloverFacts(plan) });
  } catch (error) {
    return Object.freeze({
      kind: 'refused',
      reason: error instanceof Error ? error.message : 'weekly Charter rollover failed',
    });
  }
}

export interface WeeklyCharterBoardRowV1 {
  readonly definition: WeeklyCharterDefinitionV1;
  readonly status: 'available' | 'accepted' | 'complete';
  readonly progress: number;
}

export interface WeeklyCharterBoardV1 {
  readonly schema: 'cf-v2-weekly-charters/v1';
  readonly week: number;
  readonly wallWeek: number;
  readonly clockStatus: WeeklyCharterClockStatusV1;
  readonly rolloverRequired: boolean;
  readonly acceptedCount: number;
  readonly cap: typeof STARTER_CHARTER_CAP_V1;
  readonly tradesComplete: boolean;
  readonly rows: readonly WeeklyCharterBoardRowV1[];
}

export type WeeklyCharterBoardProjectionV1 =
  | Readonly<{ kind: 'projected'; board: WeeklyCharterBoardV1 }>
  | Readonly<{ kind: 'protected'; reason: string }>;

export function projectWeeklyCharterBoardV1(
  state: SaveStateV2,
  codecNow: number,
): WeeklyCharterBoardProjectionV1 {
  try {
    const plan = planAuthority(state, codecNow);
    const tradesComplete = TRADES_IDS.every((id) => plan.done.includes(id));
    const accepted = new Set(plan.accepted);
    const rows = tradesComplete
      ? weeklyCharterSlateForWeekV1(plan.effectiveWeek).map((definition) => {
        const progress = Math.min(plan.progress[definition.id] ?? 0, definition.count);
        return Object.freeze({
          definition,
          status: progress >= definition.count
            ? 'complete' as const
            : accepted.has(definition.id) ? 'accepted' as const : 'available' as const,
          progress,
        });
      })
      : [];
    return Object.freeze({
      kind: 'projected',
      board: Object.freeze({
        schema: 'cf-v2-weekly-charters/v1',
        week: plan.effectiveWeek,
        wallWeek: plan.wallWeek,
        clockStatus: plan.status,
        rolloverRequired: plan.status === 'initialized' || plan.status === 'forward-rollover',
        acceptedCount: plan.accepted.length,
        cap: STARTER_CHARTER_CAP_V1,
        tradesComplete,
        rows: Object.freeze(rows),
      }),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof Error ? error.message : 'weekly Charter projection failed',
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function weeklyClockCopy(board: WeeklyCharterBoardV1): string {
  switch (board.clockStatus) {
    case 'initialized':
      return `Week ${board.week} is ready to initialize through one durable weekly action.`;
    case 'forward-rollover':
      return `Week ${board.week} is ready; prior weekly work expires only when rollover commits.`;
    case 'backward-preserved':
      return `Saved week ${board.week} is preserved while the wall clock reports week ${board.wallWeek}.`;
    case 'same-week':
      return `Week ${board.week} is current.`;
  }
}

/** Pure semantic board markup. Protected projections are handled by Main;
 * this renderer never rolls, accepts, rewards, or reads a clock. */
export function renderWeeklyCharterBoardV1(board: WeeklyCharterBoardV1): string {
  const clock = weeklyClockCopy(board);
  if (!board.tradesComplete) {
    return `<section data-weekly-charter-board data-weekly-week="${board.week}" data-weekly-clock-status="${board.clockStatus}">`
      + '<h3>Weekly Charters</h3>'
      + '<div class="empty" data-weekly-charter-locked>Finish the five Trades starter Charters to unlock the weekly slate.</div>'
      + `<div class="sub" data-weekly-charter-clock>${escapeHtml(clock)}</div></section>`;
  }
  const rows = board.rows.map((row) => {
    const id = escapeHtml(row.definition.id);
    const status = row.status;
    const action = status === 'available'
      ? `<button type="button" data-weekly-charter-accept="${id}">Accept</button>`
      : status === 'accepted'
        ? '<span class="binder-claimed">active</span>'
        : '<span class="binder-claimed">complete this week</span>';
    return `<div class="centry starter-charter weekly-charter" data-weekly-charter="${id}" data-charter-status="${status}">`
      + `<b>${escapeHtml(row.definition.title)}</b>`
      + `<div class="sub">${escapeHtml(row.definition.description)}</div>`
      + `<div class="starter-charter-actions"><span class="sub">${row.progress} / ${row.definition.count}`
      + ` · +${row.definition.stardust} ✦</span>${action}</div></div>`;
  }).join('');
  return `<section data-weekly-charter-board data-weekly-week="${board.week}" data-weekly-clock-status="${board.clockStatus}">`
    + `<h3>Weekly Charters <span class="sub">${board.acceptedCount} / ${board.cap} active</span></h3>`
    + rows
    + `<div class="sub" data-weekly-charter-clock>${escapeHtml(clock)}</div></section>`;
}

function checkedWorldOpportunity(opportunity: WorldOpportunitySnapshot): WorldOpportunitySnapshot {
  if (!isWorldOpportunitySnapshot(opportunity)
    || getCanonicalCF1AddressKey(opportunity.address) !== opportunity.key) {
    throw new TypeError('weekly Charter event requires a registered world opportunity');
  }
  return opportunity;
}

function eventMatches(
  definition: WeeklyCharterDefinitionV1,
  event: WeeklyCharterEventV1,
): boolean {
  if (definition.event !== event.kind) return false;
  switch (definition.id) {
    case 'wk-land':
      return event.kind === 'landfall' && checkedWorldOpportunity(event.opportunity) !== null
        && event.first === true;
    case 'wk-mine':
      return event.kind === 'mined' && checkedWorldOpportunity(event.opportunity) !== null
        && event.first === true;
    case 'wk-scan':
      return event.kind === 'bioscan' && checkedWorldOpportunity(event.opportunity) !== null
        && event.first === true;
    case 'wk-sp':
      return event.kind === 'species' && event.first === true
        && typeof event.codexId === 'string' && event.codexId.length > 0 && event.codexId.length <= 160;
    case 'wk-conq':
      return event.kind === 'conquest' && event.first === true
        && getCanonicalCF1AddressKey(event.address) === event.address.key;
    case 'wk-feed': return event.kind === 'fed' && event.ok === true;
    case 'wk-breed': return event.kind === 'bred' && event.ok === true;
    case 'wk-hostile':
      return event.kind === 'landfall' && checkedWorldOpportunity(event.opportunity) !== null
        && event.first === true && HOSTILE_TYPES.has(event.opportunity.source.planetType);
  }
}

export interface WeeklyCharterCompletionV1 {
  readonly id: WeeklyCharterIdV1;
  readonly title: string;
  readonly stardust: number;
}

export interface WeeklyCharterStageFactsV1 {
  readonly changed: boolean;
  readonly acceptedId: WeeklyCharterIdV1 | null;
  readonly rollover: WeeklyCharterRolloverFactsV1;
  readonly progressIds: readonly WeeklyCharterIdV1[];
  readonly completions: readonly WeeklyCharterCompletionV1[];
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly addedAchievementIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
  readonly projection: Arc9ProgressionProjectionV1 | null;
}

export type WeeklyCharterStageOutcomeV1 =
  | Readonly<{ kind: 'ready'; facts: WeeklyCharterStageFactsV1 }>
  | Readonly<{ kind: 'current'; facts: WeeklyCharterStageFactsV1 }>
  | Readonly<{ kind: 'refused'; reason: string }>;

function settleProgression(draft: SaveStateV2): Readonly<{
  priorUnlockedIds: readonly string[];
  nextUnlockedIds: readonly string[];
  addedAchievementIds: readonly string[];
  priorBestRankIndex: number;
  nextBestRankIndex: number;
  projection: Arc9ProgressionProjectionV1;
}> {
  const refresh = prepareArc9ProgressionRefreshV1(draft);
  if (refresh.kind === 'protected') throw new Error(`weekly-charter-progression:${refresh.reason}`);
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

function stageFacts(input: Readonly<{
  changed: boolean;
  acceptedId?: WeeklyCharterIdV1 | null;
  rollover: WeeklyCharterRolloverFactsV1;
  progressIds?: readonly WeeklyCharterIdV1[];
  completions?: readonly WeeklyCharterCompletionV1[];
  progression?: ReturnType<typeof settleProgression> | null;
}>): WeeklyCharterStageFactsV1 {
  return Object.freeze({
    changed: input.changed,
    acceptedId: input.acceptedId ?? null,
    rollover: input.rollover,
    progressIds: Object.freeze([...(input.progressIds ?? [])]),
    completions: Object.freeze([...(input.completions ?? [])]),
    priorUnlockedIds: Object.freeze([...(input.progression?.priorUnlockedIds ?? [])]),
    nextUnlockedIds: Object.freeze([...(input.progression?.nextUnlockedIds ?? [])]),
    addedAchievementIds: Object.freeze([...(input.progression?.addedAchievementIds ?? [])]),
    priorBestRankIndex: input.progression?.priorBestRankIndex ?? 0,
    nextBestRankIndex: input.progression?.nextBestRankIndex ?? 0,
    projection: input.progression?.projection ?? null,
  });
}

function rewardWeeklyCharter(
  draft: SaveStateV2,
  definition: WeeklyCharterDefinitionV1,
): WeeklyCharterCompletionV1 {
  const essence = checkedInteger(draft.essence, 0, MAX_STARDUST, 'current Stardust');
  const earned = checkedInteger(
    draft.stats.essenceEarned ?? 0, 0, MAX_STARDUST, 'lifetime Stardust',
  );
  const honored = checkedInteger(
    draft.stats.charters ?? 0, 0, MAX_CHARTER_COUNTER, 'honored Charters',
  );
  if (essence > MAX_STARDUST - definition.stardust
    || earned > MAX_STARDUST - definition.stardust
    || honored === MAX_CHARTER_COUNTER) {
    throw new RangeError('weekly Charter reward would overflow');
  }
  draft.chProg = { ...draft.chProg, [definition.id]: definition.count };
  draft.chacc = draft.chacc.filter((id) => id !== definition.id);
  draft.essence = essence + definition.stardust;
  draft.stats = {
    ...draft.stats,
    essenceEarned: earned + definition.stardust,
    charters: honored + 1,
  };
  return Object.freeze({
    id: definition.id, title: definition.title, stardust: definition.stardust,
  });
}

export function stageWeeklyCharterAcceptV1(input: Readonly<{
  draft: SaveStateV2;
  id: WeeklyCharterIdV1;
  codecNow: number;
}>): WeeklyCharterStageOutcomeV1 {
  try {
    definitionFor(input.id);
    const plan = planAuthority(input.draft, input.codecNow);
    const definition = weeklyCharterSlateForWeekV1(plan.effectiveWeek)
      .find(({ id }) => id === input.id);
    if (!TRADES_IDS.every((id) => plan.done.includes(id))) {
      return Object.freeze({ kind: 'refused', reason: 'finish the five trades before weekly Charters' });
    }
    if (!definition) {
      return Object.freeze({ kind: 'refused', reason: 'weekly Charter is outside the current slate' });
    }
    if (plan.accepted.includes(input.id) || (plan.progress[input.id] ?? 0) >= definition.count) {
      return Object.freeze({
        kind: 'current',
        facts: stageFacts({ changed: false, acceptedId: input.id, rollover: rolloverFacts(plan) }),
      });
    }
    if (plan.accepted.length >= STARTER_CHARTER_CAP_V1) {
      return Object.freeze({ kind: 'refused', reason: 'three accepted Charters is the exact cap' });
    }
    applyAuthorityPlan(input.draft, plan);
    input.draft.chacc = [...plan.accepted, input.id];
    return Object.freeze({
      kind: 'ready',
      facts: stageFacts({ changed: true, acceptedId: input.id, rollover: rolloverFacts(plan) }),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', reason: error instanceof Error ? error.message : 'weekly Charter acceptance failed',
    });
  }
}

export function stageWeeklyCharterEventsV1(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  events: readonly WeeklyCharterEventV1[];
  codecNow: number;
}>): WeeklyCharterStageOutcomeV1 {
  try {
    void input.extensions;
    if (!Array.isArray(input.events) || input.events.length < 1 || input.events.length > 8) {
      throw new RangeError('weekly Charter product event batch is outside its exact bound');
    }
    const plan = planAuthority(input.draft, input.codecNow);
    if (!TRADES_IDS.every((id) => plan.done.includes(id))) {
      return Object.freeze({
        kind: 'current', facts: stageFacts({ changed: false, rollover: rolloverFacts(plan) }),
      });
    }
    const rolloverChanged = applyAuthorityPlan(input.draft, plan);
    const slate = new Map(
      weeklyCharterSlateForWeekV1(plan.effectiveWeek).map((definition) => [definition.id, definition]),
    );
    const progressIds: WeeklyCharterIdV1[] = [];
    const completions: WeeklyCharterCompletionV1[] = [];
    for (const event of input.events) {
      for (const id of [...input.draft.chacc]) {
        if (!WEEKLY_ID_SET.has(id)) continue;
        const definition = slate.get(id as WeeklyCharterIdV1);
        if (!definition || !eventMatches(definition, event)) continue;
        const next = Math.min(definition.count, (input.draft.chProg[id] ?? 0) + 1);
        input.draft.chProg = { ...input.draft.chProg, [id]: next };
        progressIds.push(definition.id);
        if (next >= definition.count) completions.push(rewardWeeklyCharter(input.draft, definition));
      }
    }
    const changed = rolloverChanged || progressIds.length > 0;
    if (!changed) {
      return Object.freeze({
        kind: 'current', facts: stageFacts({ changed: false, rollover: rolloverFacts(plan) }),
      });
    }
    const progression = completions.length > 0 ? settleProgression(input.draft) : null;
    return Object.freeze({
      kind: 'ready',
      facts: stageFacts({
        changed: true,
        rollover: rolloverFacts(plan),
        progressIds,
        completions,
        progression,
      }),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', reason: error instanceof Error ? error.message : 'weekly Charter event failed',
    });
  }
}

export function stageWeeklyCharterEventV1(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  event: WeeklyCharterEventV1;
  codecNow: number;
}>): WeeklyCharterStageOutcomeV1 {
  return stageWeeklyCharterEventsV1({
    draft: input.draft,
    extensions: input.extensions,
    events: Object.freeze([input.event]),
    codecNow: input.codecNow,
  });
}

interface WeeklyCharterPublicationFieldsV1 {
  readonly chWeek: number;
  readonly chProg: Readonly<Record<string, number>>;
  readonly chacc: readonly string[];
  readonly chDone: readonly string[];
  readonly essence: number;
  readonly stats: Readonly<Record<string, number>>;
  readonly unlocked: readonly string[];
}

function publicationFields(state: SaveStateV2): WeeklyCharterPublicationFieldsV1 {
  return Object.freeze({
    chWeek: state.chWeek,
    chProg: Object.freeze({ ...state.chProg }),
    chacc: Object.freeze([...state.chacc]),
    chDone: Object.freeze([...state.chDone]),
    essence: state.essence,
    stats: Object.freeze({ ...state.stats }),
    unlocked: Object.freeze([...state.unlocked]),
  });
}

export interface WeeklyCharterActionFactsV1 {
  readonly schema: typeof WEEKLY_CHARTER_WITNESS_SCHEMA_V1;
  readonly action: 'rollover' | 'accept';
  readonly id: WeeklyCharterIdV1 | null;
  readonly receiptOrdinal: number;
  readonly stage: WeeklyCharterStageFactsV1 | WeeklyCharterRolloverFactsV1;
  readonly source: WeeklyCharterPublicationFieldsV1;
  readonly successor: WeeklyCharterPublicationFieldsV1;
}

type CommittedF4Action = Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;

export type WeeklyCharterActionOutcomeV1 =
  | Readonly<{ kind: 'current'; week: number; id: WeeklyCharterIdV1 | null }>
  | Readonly<{ kind: 'refused'; detail: string; transaction?: F4RuntimeActionCommitOutcome }>
  | Readonly<{
    kind: 'committed'; state: SaveStateV2; facts: WeeklyCharterActionFactsV1;
    transaction: CommittedF4Action;
  }>
  | Readonly<{
    kind: 'committed-convergence'; detail: string; transaction: CommittedF4Action;
  }>;

export function operationForWeeklyCharterRolloverV1(codecNow: number): string {
  return `${WEEKLY_CHARTER_ROLLOVER_OPERATION_PREFIX_V1}${wallWeekForWeeklyChartersV1(codecNow)}`;
}

export function operationForWeeklyCharterAcceptV1(
  state: SaveStateV2,
  codecNow: number,
  id: WeeklyCharterIdV1,
): string {
  definitionFor(id);
  const week = planAuthority(state, codecNow).effectiveWeek;
  return `${WEEKLY_CHARTER_ACCEPT_OPERATION_PREFIX_V1}${week}:${id}`;
}

function verifiedCommit(
  transaction: CommittedF4Action,
  operation: string,
  receiptKind: string,
  plan: Readonly<{
    facts: WeeklyCharterActionFactsV1;
    witness: string;
    expectedStateJson: string;
  }>,
): boolean {
  return transaction.plan.operation === operation
    && transaction.plan.receiptOrdinal === plan.facts.receiptOrdinal
    && transaction.receipt.ordinal === plan.facts.receiptOrdinal
    && transaction.receipt.kind === receiptKind
    && transaction.receipt.witness === plan.witness
    && canonicalJson(transaction.state) === canonicalJson(transaction.saved.canonicalState)
    && canonicalJson(transaction.state) === plan.expectedStateJson
    && canonicalJson(publicationFields(transaction.state)) === canonicalJson(plan.facts.successor);
}

export async function commitWeeklyCharterRolloverV1(input: Readonly<{
  state: SaveStateV2;
  codecNow: number;
  authority: Pick<F4RuntimeAuthority, 'commitAction'>;
}>): Promise<WeeklyCharterActionOutcomeV1> {
  const projected = projectWeeklyCharterBoardV1(input.state, input.codecNow);
  if (projected.kind === 'protected') {
    return Object.freeze({ kind: 'refused', detail: projected.reason });
  }
  if (!projected.board.rolloverRequired) {
    return Object.freeze({ kind: 'current', week: projected.board.week, id: null });
  }
  const operation = operationForWeeklyCharterRolloverV1(input.codecNow);
  let selected: Readonly<{
    facts: WeeklyCharterActionFactsV1; witness: string; expectedStateJson: string;
  }> | null = null;
  const transaction = await input.authority.commitAction({
    state: input.state,
    operation,
    receiptKind: WEEKLY_CHARTER_ROLLOVER_RECEIPT_KIND_V1,
    codecNow: input.codecNow,
    derive: ({ draft, receiptOrdinal, canonicalizeState }) => {
      const source = publicationFields(draft);
      const staged = stageWeeklyCharterRolloverV1({ draft, codecNow: input.codecNow });
      if (staged.kind !== 'ready') {
        throw new Error(staged.kind === 'refused' ? staged.reason : 'weekly Charter rollover became current');
      }
      const facts: WeeklyCharterActionFactsV1 = Object.freeze({
        schema: WEEKLY_CHARTER_WITNESS_SCHEMA_V1,
        action: 'rollover', id: null, receiptOrdinal,
        stage: staged.facts,
        source,
        successor: publicationFields(draft),
      });
      const witness = `${WEEKLY_CHARTER_WITNESS_SCHEMA_V1}:${sha256Hex(canonicalJson(facts))}`;
      selected = Object.freeze({
        facts, witness, expectedStateJson: canonicalJson(canonicalizeState(draft)),
      });
      return Object.freeze({ state: draft, extensionWrites: Object.freeze([]), witness });
    },
  });
  if (transaction.kind !== 'committed') {
    return Object.freeze({ kind: 'refused', detail: transaction.kind, transaction });
  }
  const plan = selected as Readonly<{
    facts: WeeklyCharterActionFactsV1; witness: string; expectedStateJson: string;
  }> | null;
  if (!plan) return Object.freeze({ kind: 'committed-convergence', detail: 'missing-plan', transaction });
  if (!verifiedCommit(
    transaction, operation, WEEKLY_CHARTER_ROLLOVER_RECEIPT_KIND_V1, plan,
  )) {
    return Object.freeze({
      kind: 'committed-convergence', detail: 'committed-verification-mismatch', transaction,
    });
  }
  return Object.freeze({ kind: 'committed', state: transaction.state, facts: plan.facts, transaction });
}

export async function commitWeeklyCharterAcceptV1(input: Readonly<{
  state: SaveStateV2;
  id: WeeklyCharterIdV1;
  codecNow: number;
  authority: Pick<F4RuntimeAuthority, 'commitAction'>;
}>): Promise<WeeklyCharterActionOutcomeV1> {
  const projected = projectWeeklyCharterBoardV1(input.state, input.codecNow);
  if (projected.kind === 'protected') {
    return Object.freeze({ kind: 'refused', detail: projected.reason });
  }
  const row = projected.board.rows.find(({ definition }) => definition.id === input.id);
  if (row?.status === 'accepted' || row?.status === 'complete') {
    return Object.freeze({ kind: 'current', week: projected.board.week, id: input.id });
  }
  if (!projected.board.tradesComplete || !row) {
    return Object.freeze({ kind: 'refused', detail: !projected.board.tradesComplete
      ? 'finish the five trades before weekly Charters'
      : 'weekly Charter is outside the current slate' });
  }
  if (projected.board.acceptedCount >= STARTER_CHARTER_CAP_V1) {
    return Object.freeze({ kind: 'refused', detail: 'three accepted Charters is the exact cap' });
  }
  const operation = operationForWeeklyCharterAcceptV1(input.state, input.codecNow, input.id);
  let selected: Readonly<{
    facts: WeeklyCharterActionFactsV1; witness: string; expectedStateJson: string;
  }> | null = null;
  const transaction = await input.authority.commitAction({
    state: input.state,
    operation,
    receiptKind: WEEKLY_CHARTER_ACCEPT_RECEIPT_KIND_V1,
    codecNow: input.codecNow,
    derive: ({ draft, receiptOrdinal, canonicalizeState }) => {
      const source = publicationFields(draft);
      const staged = stageWeeklyCharterAcceptV1({
        draft, id: input.id, codecNow: input.codecNow,
      });
      if (staged.kind !== 'ready') {
        throw new Error(staged.kind === 'refused' ? staged.reason : 'weekly Charter acceptance became current');
      }
      const facts: WeeklyCharterActionFactsV1 = Object.freeze({
        schema: WEEKLY_CHARTER_WITNESS_SCHEMA_V1,
        action: 'accept', id: input.id, receiptOrdinal,
        stage: staged.facts,
        source,
        successor: publicationFields(draft),
      });
      const witness = `${WEEKLY_CHARTER_WITNESS_SCHEMA_V1}:${sha256Hex(canonicalJson(facts))}`;
      selected = Object.freeze({
        facts, witness, expectedStateJson: canonicalJson(canonicalizeState(draft)),
      });
      return Object.freeze({ state: draft, extensionWrites: Object.freeze([]), witness });
    },
  });
  if (transaction.kind !== 'committed') {
    return Object.freeze({ kind: 'refused', detail: transaction.kind, transaction });
  }
  const plan = selected as Readonly<{
    facts: WeeklyCharterActionFactsV1; witness: string; expectedStateJson: string;
  }> | null;
  if (!plan) return Object.freeze({ kind: 'committed-convergence', detail: 'missing-plan', transaction });
  if (!verifiedCommit(transaction, operation, WEEKLY_CHARTER_ACCEPT_RECEIPT_KIND_V1, plan)) {
    return Object.freeze({
      kind: 'committed-convergence', detail: 'committed-verification-mismatch', transaction,
    });
  }
  return Object.freeze({ kind: 'committed', state: transaction.state, facts: plan.facts, transaction });
}

export function publishWeeklyCharterFieldsV1(
  target: SaveStateV2,
  outcome: Extract<WeeklyCharterActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  if (canonicalJson(publicationFields(target)) !== canonicalJson(outcome.facts.source)) {
    throw new TypeError('weekly Charter publication requires its exact live parent');
  }
  target.chWeek = outcome.state.chWeek;
  target.chProg = { ...outcome.state.chProg };
  target.chacc = [...outcome.state.chacc];
  target.essence = outcome.state.essence;
  target.stats = { ...outcome.state.stats };
  target.unlocked = [...outcome.state.unlocked];
}
