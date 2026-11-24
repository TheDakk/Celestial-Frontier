/* Staging a Starter Charter acceptance or deed on a draft state: progress,
   completion, Stardust, starter gear, and the achievement and rank refresh, all
   in the caller's one transaction. The rules are the legacy game's
   (celestial-frontier.html of the live branch: accept 24878-24906, a deed
   24907-24918, completion 24865-24877). */
import { hashInt } from '@cf/domain-rand';
import {
  createGearInstance,
  equipGear,
  getFixedCraftGenerationPlan,
  grantGear,
  makeGearSourceActionId,
} from '@cf/domain-loot';
import {
  prepareArc2LootInventoryWrite,
  prepareArc9ProgressionRefreshV1,
  projectArc2LootLegacyMirror,
  readArc2Loot,
  stageWeeklyCharterEventV1,
  type Arc9ProgressionProjectionV1,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
  type WeeklyCharterStageFactsV1,
} from '@cf/persistence';
import { projectStarterCharterBoardV1 } from './starter-board';
import {
  MAX_CHARTER_COUNTER,
  MAX_STARDUST,
  STARTER_CHARTER_CAP_V1,
  STARTER_CHARTER_GEAR_OWNER_V1,
  STARTER_CHARTER_IDS_V1,
  alreadyProven,
  checkedInteger,
  checkedState,
  definitionFor,
  eventMatches,
  type StarterCharterDefinitionV1,
  type StarterCharterEventV1,
  type StarterCharterIdV1,
} from './starter-charters';

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
  /** The weekly board's roll/progress/completions in the same transaction (the package's weekly-charters.ts); null when the caller passed no
   *  active-play snapshot. */
  readonly weekly?: WeeklyCharterStageFactsV1 | null;
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
  /** True only for the accept that is the last lesson of training (legacy 24882). */
  graduation?: boolean;
}>): StarterCharterStageOutcomeV1 {
  try {
    if (!input.draft.tutDone && input.graduation !== true) {
      return Object.freeze({ kind: 'refused', reason: 'the board is inert until training ends' });
    }
    const board = projectStarterCharterBoardV1(input.draft, input.extensions);
    if (board.kind !== 'projected') return Object.freeze({ kind: 'refused', reason: board.reason });
    const row = board.board.rows.find(({ definition }) => definition.id === input.id);
    if (!row || row.status !== 'available') {
      return Object.freeze({ kind: 'refused', reason: 'starter Charter is not revealed' });
    }
    if (board.board.acceptedCount >= STARTER_CHARTER_CAP_V1) {
      return Object.freeze({ kind: 'refused', reason: 'Three charters is a full slate — see one through first.' });
    }
    const definition = row.definition;
    const checked = checkedState(input.draft);
    input.draft.chacc = [...checked.accepted, definition.id];
    let completions: readonly StarterCharterCompletionV1[] = Object.freeze([]);
    let extensionWrites: readonly V5ExtensionWrite[] = Object.freeze([]);
    /* never already proven from training's sandbox: deeds count only after graduation (legacy 24889-24891) */
    if (input.draft.tutDone && alreadyProven(input.draft, input.extensions, definition.id)) {
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
  /** This transaction's committed active-play snapshot: when present the weekly board rolls and counts here too. */
  activePlayMs?: number;
}>): StarterCharterStageOutcomeV1 {
  try {
    if (!input.draft.tutDone) {
      return Object.freeze({ kind: 'current', facts: Object.freeze({ ...facts(false, null, [], [], [], null), weekly: null }) });
    }
    const checked = checkedState(input.draft);
    const progress = { ...checked.progress };
    const progressIds: StarterCharterIdV1[] = [];
    const completions: StarterCharterCompletionV1[] = [];
    const extensionWrites: V5ExtensionWrite[] = [];
    for (const id of checked.accepted) {
      if (!(STARTER_CHARTER_IDS_V1 as readonly string[]).includes(id)) continue;
      const definition = definitionFor(id as StarterCharterIdV1);
      if (!eventMatches(definition, input.event)) continue;
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
    if (progressIds.length > 0) input.draft.chProg = progress;
    let weekly: WeeklyCharterStageFactsV1 | null = null;
    if (input.activePlayMs !== undefined) {
      const staged = stageWeeklyCharterEventV1({ draft: input.draft, event: input.event, activePlayMs: input.activePlayMs });
      if (staged.kind === 'refused') return Object.freeze({ kind: 'refused', reason: `weekly Charter: ${staged.reason}` });
      weekly = staged.facts;
    }
    if (progressIds.length === 0 && !weekly?.changed) {
      return Object.freeze({
        kind: 'current', facts: Object.freeze({ ...facts(false, null, [], [], [], null), weekly }),
      });
    }
    const progression = settleProgression(input.draft);
    return Object.freeze({
      kind: 'ready',
      facts: Object.freeze({ ...facts(true, null, progressIds, completions, extensionWrites, progression), weekly }),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused', reason: error instanceof Error ? error.message : 'starter Charter event failed',
    });
  }
}
