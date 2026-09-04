/* D-TRAIN-2 Forge practice pilot.

   This is deliberately not an F4 writer. It owns one bounded, versioned,
   in-memory Training sandbox, clones the current expedition only to obtain
   registered Arc 2/Arc 3 input authority, and gives that private copy the
   canonical Iron Plate recipe's exact loan. The existing Arc 3 fixed-
   fabrication derivation performs the practice craft. No repository, receipt,
   SessionRNG, save publication, route publication, Charter publication, or
   achievement publication seam exists here. Main may dispatch the returned
   Training-only completion event after it has rendered the compact result. */
import {
  getFixedRecipePlan,
  getLootCatalogueDefinition,
} from '@cf/domain-loot';
import {
  ARC2_LOOT_NAMESPACE,
  ARC2_LOOT_SEGMENT,
  ARC3_ENGINEERING_NAMESPACE,
  ARC3_ENGINEERING_SEGMENT,
  PORTABLE_V5_MAX_CLOCK_MS,
  applyV5ExtensionWrites,
  arc2LootLegacyMirrorMatches,
  prepareArc2LootLegacyRestore,
  readArc2Loot,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import { deriveArc3FixedFabricationAction } from './arc3-engineering-actions.js';

export const TRAINING_FORGE_PRACTICE_SCHEMA_V1 =
  'cf-v2-training-forge-practice/v1' as const;
export const TRAINING_FORGE_PRACTICE_COMPLETION_SCHEMA_V1 =
  'cf-v2-training-forge-practice-completion/v1' as const;
export const TRAINING_FORGE_PRACTICE_EVENT_V1 = 'training-forge-practice' as const;
export const TRAINING_FORGE_IRON_PLATE_BASE_ID_V1 = 'plate' as const;

const LOCAL_ACTIVE_PLAY_MS = 0;
const LOCAL_DERIVATION_ORDINAL = 0;
const PRACTICE_GEAR_CAPACITY = 1;

export interface TrainingForgePracticeMaterialV1 {
  readonly id: string;
  readonly quantity: number;
}

export interface TrainingForgePracticePlanV1 {
  readonly schema: typeof TRAINING_FORGE_PRACTICE_SCHEMA_V1;
  readonly baseId: typeof TRAINING_FORGE_IRON_PLATE_BASE_ID_V1;
  readonly name: string;
  readonly category: 'part';
  readonly outputCount: 1;
  readonly loanedMaterials: readonly TrainingForgePracticeMaterialV1[];
}

function buildPracticePlan(): TrainingForgePracticePlanV1 {
  const recipe = getFixedRecipePlan(TRAINING_FORGE_IRON_PLATE_BASE_ID_V1);
  const definition = getLootCatalogueDefinition(TRAINING_FORGE_IRON_PLATE_BASE_ID_V1);
  if (definition === undefined
    || recipe.baseId !== TRAINING_FORGE_IRON_PLATE_BASE_ID_V1
    || recipe.category !== 'part'
    || recipe.outputKind !== 'stackable'
    || Object.keys(recipe.partCost).length !== 0
    || recipe.stardustCost !== 0
    || recipe.prerequisiteId !== null
    || recipe.signatureId !== null) {
    throw new Error('Training Forge requires the canonical direct-material Iron Plate recipe');
  }
  return Object.freeze({
    schema: TRAINING_FORGE_PRACTICE_SCHEMA_V1,
    baseId: TRAINING_FORGE_IRON_PLATE_BASE_ID_V1,
    name: definition.name,
    category: 'part',
    outputCount: 1,
    loanedMaterials: Object.freeze(Object.entries(recipe.materialCost).map(([id, quantity]) => (
      Object.freeze({ id, quantity })
    ))),
  });
}

const PRACTICE_PLAN = buildPracticePlan();

/** Project the real catalogue/recipe-owned practice instruction. The pilot
 * duplicates no material price: a recipe change changes this projection and
 * the isolated loan together. */
export function projectTrainingForgePracticePlanV1(): TrainingForgePracticePlanV1 {
  return PRACTICE_PLAN;
}

export interface TrainingForgePracticeSourceV1 {
  /** Current canonical save snapshot. It is cloned before any practice edit. */
  readonly state: SaveStateV2;
  /** Current canonical carriers. They are cloned before Arc 2 is sandboxed. */
  readonly extensions: V5Extensions;
  /** Injected compatibility-codec time. This authority reads no clock. */
  readonly codecNow: number;
}

export interface TrainingForgePracticeTicketV1 {
  readonly schema: typeof TRAINING_FORGE_PRACTICE_SCHEMA_V1;
  readonly generation: number;
  readonly openedRevision: number;
}

export interface TrainingForgePracticeEventDetailV1 {
  readonly schema: typeof TRAINING_FORGE_PRACTICE_COMPLETION_SCHEMA_V1;
  readonly generation: number;
  readonly baseId: typeof TRAINING_FORGE_IRON_PLATE_BASE_ID_V1;
  readonly outputCount: 1;
}

export interface TrainingForgePracticeCompletionV1 {
  readonly schema: typeof TRAINING_FORGE_PRACTICE_COMPLETION_SCHEMA_V1;
  readonly generation: number;
  readonly baseId: typeof TRAINING_FORGE_IRON_PLATE_BASE_ID_V1;
  readonly name: string;
  readonly spentMaterials: readonly TrainingForgePracticeMaterialV1[];
  readonly outputCount: 1;
  readonly outputLocation: 'stackable';
  /** The real Arc 3 product witness, retained only as in-memory evidence. */
  readonly derivationWitness: string;
  readonly event: Readonly<{
    type: typeof TRAINING_FORGE_PRACTICE_EVENT_V1;
    detail: TrainingForgePracticeEventDetailV1;
  }>;
  readonly liveEffects: Readonly<{
    persistenceWrites: 0;
    receiptWrites: 0;
    sessionRngDraws: 0;
    inventoryWrites: 0;
    charterWrites: 0;
    achievementWrites: 0;
    routeWrites: 0;
  }>;
}

export type TrainingForgePracticeStatusV1 =
  | 'closed'
  | 'ready'
  | 'completed'
  | 'refused'
  | 'disposed';

export interface TrainingForgePracticeSnapshotV1 {
  readonly schema: typeof TRAINING_FORGE_PRACTICE_SCHEMA_V1;
  readonly revision: number;
  readonly generation: number;
  readonly status: TrainingForgePracticeStatusV1;
  readonly plan: TrainingForgePracticePlanV1;
  readonly completion: TrainingForgePracticeCompletionV1 | null;
  readonly refusalDetail: string | null;
  /** Diagnostics only; the private state/carriers are never exposed. */
  readonly retainedSandboxCount: 0 | 1;
}

export type TrainingForgePracticeOpenOutcomeV1 =
  | Readonly<{
    kind: 'ready';
    ticket: TrainingForgePracticeTicketV1;
    snapshot: TrainingForgePracticeSnapshotV1;
  }>
  | Readonly<{
    kind: 'refused';
    reason: 'disposed' | 'source-protected';
    detail: string;
    snapshot: TrainingForgePracticeSnapshotV1;
  }>;

export type TrainingForgePracticeActionRefusalV1 =
  | 'disposed'
  | 'not-open'
  | 'stale-session'
  | 'already-completed'
  | 'session-terminal'
  | 'derivation-refused'
  | 'fixed-point-mismatch';

export type TrainingForgePracticeActionOutcomeV1 =
  | Readonly<{
    kind: 'completed';
    completion: TrainingForgePracticeCompletionV1;
    snapshot: TrainingForgePracticeSnapshotV1;
  }>
  | Readonly<{
    kind: 'refused';
    reason: TrainingForgePracticeActionRefusalV1;
    detail: string;
    snapshot: TrainingForgePracticeSnapshotV1;
  }>;

export type TrainingForgePracticeCloseOutcomeV1 =
  | Readonly<{ kind: 'closed'; snapshot: TrainingForgePracticeSnapshotV1 }>
  | Readonly<{
    kind: 'refused';
    reason: 'disposed' | 'stale-session';
    snapshot: TrainingForgePracticeSnapshotV1;
  }>;

interface PracticeSandbox {
  readonly state: SaveStateV2;
  readonly extensions: V5Extensions;
  readonly codecNow: number;
  readonly protectedCarriers: string;
}

function checkedCodecNow(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0
    || (value as number) > PORTABLE_V5_MAX_CLOCK_MS) {
    throw new RangeError('Training Forge codecNow is outside the portable v5 clock bound');
  }
  return value as number;
}

function sortedCarrierRows(extensions: V5Extensions): readonly unknown[] {
  const rows: Array<readonly [string, string, number, string]> = [];
  for (const [segment, namespaces] of Object.entries(extensions)) {
    for (const [namespace, carrier] of Object.entries(namespaces ?? {})) {
      if ((segment === ARC2_LOOT_SEGMENT && namespace === ARC2_LOOT_NAMESPACE)
        || (segment === ARC3_ENGINEERING_SEGMENT && namespace === ARC3_ENGINEERING_NAMESPACE)) {
        continue;
      }
      rows.push(Object.freeze([segment, namespace, carrier.version, carrier.json] as const));
    }
  }
  rows.sort((left, right) => {
    const leftKey = `${left[0]}\u0000${left[1]}`;
    const rightKey = `${right[0]}\u0000${right[1]}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  return Object.freeze(rows);
}

function protectedCarrierFingerprint(extensions: V5Extensions): string {
  return JSON.stringify(sortedCarrierRows(extensions));
}

function practiceCargo(): SaveStateV2['cargo'] {
  return PRACTICE_PLAN.loanedMaterials.map(({ id, quantity }) => [id, quantity]);
}

function prepareSandbox(source: TrainingForgePracticeSourceV1): PracticeSandbox {
  const codecNow = checkedCodecNow(source.codecNow);
  const state = structuredClone(source.state);
  const sourceExtensions = structuredClone(source.extensions);

  /* All action-owned surfaces are private practice facts. Carrier fields that
     Arc 3 uses for compatibility (mineX/mined/skimX/techOwned) remain cloned
     from the source so the real derivation can independently validate them. */
  state.cargo = practiceCargo();
  state.cgx = [];
  state.essence = 0;
  state.items = [];
  state.equip = {};
  state.equipAff = {};
  state.pinnedRecipe = TRAINING_FORGE_IRON_PLATE_BASE_ID_V1;
  state.stats = { ...state.stats, crafts: 0, charters: 0 };
  state.ascCh = 0;
  state.ascProg = {};
  state.chWeek = -1;
  state.chProg = {};
  state.chacc = [];
  state.chDone = [];
  state.unlocked = [];

  const restored = prepareArc2LootLegacyRestore({
    extensions: sourceExtensions,
    legacy: { items: state.items, equip: state.equip, equipAff: state.equipAff },
    capacity: PRACTICE_GEAR_CAPACITY,
  });
  if (restored.kind !== 'prepared' || restored.state.kind !== 'inventory') {
    const reason = restored.kind === 'protected' ? restored.reason : 'unknown';
    throw new Error(`Training Forge Arc 2 sandbox is protected: ${reason}`);
  }
  if (!arc2LootLegacyMirrorMatches(restored.state, state)) {
    throw new Error('Training Forge Arc 2 sandbox does not match its private legacy mirror');
  }
  return {
    state,
    extensions: restored.extensions,
    codecNow,
    protectedCarriers: protectedCarrierFingerprint(restored.extensions),
  };
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function fixedPointCompletion(
  generation: number,
  sandbox: PracticeSandbox,
): TrainingForgePracticeCompletionV1 {
  const outcome = deriveArc3FixedFabricationAction({
    draft: sandbox.state,
    extensions: sandbox.extensions,
    baseId: TRAINING_FORGE_IRON_PLATE_BASE_ID_V1,
    activePlayMs: LOCAL_ACTIVE_PLAY_MS,
    receiptOrdinal: LOCAL_DERIVATION_ORDINAL,
    codecNow: sandbox.codecNow,
  });
  if (outcome.kind !== 'ready') throw new Error(`derive:${outcome.detail}`);
  const derived = outcome.derivation;
  const result = derived.result;
  const settlement = derived.arc2Settlement;
  if (derived.operation !== 'fabricate-fixed'
    || derived.receiptOrdinal !== LOCAL_DERIVATION_ORDINAL
    || !('baseId' in result) || result.baseId !== TRAINING_FORGE_IRON_PLATE_BASE_ID_V1
    || !('arc2' in result)
    || settlement === null
    || settlement.baseId !== TRAINING_FORGE_IRON_PLATE_BASE_ID_V1
    || settlement.outputLocation !== 'stackable'
    || settlement.instanceId !== null
    || settlement.sourceActionId !== null
    || derived.nextArc2State === null) {
    throw new Error('fixed-point:the real derivation did not produce one stackable Iron Plate');
  }
  const spentMaterials = settlement.economyDelta.materials.map(({ id, delta }) => (
    Object.freeze({ id, quantity: -delta })
  ));
  if (!sameJson(spentMaterials, PRACTICE_PLAN.loanedMaterials)
    || !sameJson(result.arc2.consume.materials, PRACTICE_PLAN.loanedMaterials)
    || result.arc2.consume.exceptionalMaterials.length !== 0
    || result.arc2.consume.itemCounts.length !== 0
    || result.arc2.consume.stardust !== 0
    || !sameJson(derived.state.cargo, PRACTICE_PLAN.loanedMaterials.map(({ id }) => [id, 0]))
    || derived.state.cgx.length !== 0
    || derived.state.essence !== 0
    || !sameJson(derived.state.items, [[TRAINING_FORGE_IRON_PLATE_BASE_ID_V1, 1]])
    || derived.state.stats.crafts !== 1
    || derived.starterCharter?.changed !== false
    || derived.starterCharter.addedAchievementIds.length !== 0
    || derived.weeklyCharter !== null) {
    throw new Error('fixed-point:the isolated Iron Plate economy result diverged');
  }
  const writeKeys = derived.extensionWrites.map(({ segment, namespace }) => (
    `${segment}\u0000${namespace}`
  )).sort();
  const expectedWriteKeys = [
    `${ARC2_LOOT_SEGMENT}\u0000${ARC2_LOOT_NAMESPACE}`,
    `${ARC3_ENGINEERING_SEGMENT}\u0000${ARC3_ENGINEERING_NAMESPACE}`,
  ].sort();
  if (!sameJson(writeKeys, expectedWriteKeys)
    || protectedCarrierFingerprint(sandbox.extensions) !== sandbox.protectedCarriers) {
    throw new Error('fixed-point:practice attempted to replace a non-Forge carrier');
  }
  const applied = applyV5ExtensionWrites(sandbox.extensions, derived.extensionWrites).extensions;
  if (protectedCarrierFingerprint(applied) !== sandbox.protectedCarriers) {
    throw new Error('fixed-point:practice changed protected carrier bytes');
  }
  const exactLoot = readArc2Loot(applied);
  if (exactLoot.kind !== 'loaded' || exactLoot.state.kind !== 'inventory'
    || !arc2LootLegacyMirrorMatches(exactLoot.state, derived.state)
    || !sameJson(exactLoot.state.stackableCounts, [{
      baseId: TRAINING_FORGE_IRON_PLATE_BASE_ID_V1,
      count: 1,
    }])) {
    throw new Error('fixed-point:the exact Arc 2 Iron Plate successor is unavailable');
  }

  const detail: TrainingForgePracticeEventDetailV1 = Object.freeze({
    schema: TRAINING_FORGE_PRACTICE_COMPLETION_SCHEMA_V1,
    generation,
    baseId: TRAINING_FORGE_IRON_PLATE_BASE_ID_V1,
    outputCount: 1,
  });
  return Object.freeze({
    schema: TRAINING_FORGE_PRACTICE_COMPLETION_SCHEMA_V1,
    generation,
    baseId: TRAINING_FORGE_IRON_PLATE_BASE_ID_V1,
    name: PRACTICE_PLAN.name,
    spentMaterials: Object.freeze(spentMaterials),
    outputCount: 1,
    outputLocation: 'stackable',
    derivationWitness: derived.witness,
    event: Object.freeze({ type: TRAINING_FORGE_PRACTICE_EVENT_V1, detail }),
    liveEffects: Object.freeze({
      persistenceWrites: 0,
      receiptWrites: 0,
      sessionRngDraws: 0,
      inventoryWrites: 0,
      charterWrites: 0,
      achievementWrites: 0,
      routeWrites: 0,
    }),
  });
}

/** One bounded practice owner. Exact ticket identity—not a caller-authored
 * generation lookalike—owns each action and cleanup transition. */
export class TrainingForgePracticeAuthorityV1 {
  #revision = 0;
  #generation = 0;
  #status: TrainingForgePracticeStatusV1 = 'closed';
  #sandbox: PracticeSandbox | null = null;
  #ticket: TrainingForgePracticeTicketV1 | null = null;
  #completion: TrainingForgePracticeCompletionV1 | null = null;
  #refusalDetail: string | null = null;
  readonly #tickets = new WeakSet<object>();

  snapshot(): TrainingForgePracticeSnapshotV1 {
    return Object.freeze({
      schema: TRAINING_FORGE_PRACTICE_SCHEMA_V1,
      revision: this.#revision,
      generation: this.#generation,
      status: this.#status,
      plan: PRACTICE_PLAN,
      completion: this.#completion,
      refusalDetail: this.#refusalDetail,
      retainedSandboxCount: this.#sandbox === null ? 0 : 1,
    });
  }

  open(source: TrainingForgePracticeSourceV1): TrainingForgePracticeOpenOutcomeV1 {
    if (this.#status === 'disposed') {
      return Object.freeze({
        kind: 'refused', reason: 'disposed', detail: 'Training Forge practice is disposed',
        snapshot: this.snapshot(),
      });
    }
    if (this.#generation === Number.MAX_SAFE_INTEGER
      || this.#revision === Number.MAX_SAFE_INTEGER) {
      this.dispose();
      return Object.freeze({
        kind: 'refused', reason: 'disposed', detail: 'Training Forge lifecycle is exhausted',
        snapshot: this.snapshot(),
      });
    }
    this.#generation += 1;
    this.#revision += 1;
    this.#sandbox = null;
    this.#ticket = null;
    this.#completion = null;
    this.#refusalDetail = null;
    try {
      this.#sandbox = prepareSandbox(source);
      this.#status = 'ready';
      const ticket: TrainingForgePracticeTicketV1 = Object.freeze({
        schema: TRAINING_FORGE_PRACTICE_SCHEMA_V1,
        generation: this.#generation,
        openedRevision: this.#revision,
      });
      this.#tickets.add(ticket);
      this.#ticket = ticket;
      return Object.freeze({ kind: 'ready', ticket, snapshot: this.snapshot() });
    } catch (error) {
      this.#status = 'refused';
      this.#sandbox = null;
      this.#refusalDetail = error instanceof Error ? error.message : String(error);
      return Object.freeze({
        kind: 'refused', reason: 'source-protected', detail: this.#refusalDetail,
        snapshot: this.snapshot(),
      });
    }
  }

  fabricate(ticket: TrainingForgePracticeTicketV1): TrainingForgePracticeActionOutcomeV1 {
    if (this.#status === 'disposed') return this.#actionRefusal('disposed', 'practice is disposed');
    if (ticket === null || typeof ticket !== 'object' || !this.#tickets.has(ticket)
      || ticket !== this.#ticket) {
      return this.#actionRefusal('stale-session', 'practice ticket is stale or foreign');
    }
    if (this.#status === 'completed') {
      return this.#actionRefusal('already-completed', 'practice craft already completed');
    }
    if (this.#status !== 'ready' || this.#sandbox === null) {
      return this.#actionRefusal('session-terminal', 'practice session is not actionable');
    }
    try {
      const completion = fixedPointCompletion(this.#generation, this.#sandbox);
      this.#sandbox = null;
      this.#completion = completion;
      this.#status = 'completed';
      this.#refusalDetail = null;
      this.#revision += 1;
      return Object.freeze({ kind: 'completed', completion, snapshot: this.snapshot() });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.#sandbox = null;
      this.#completion = null;
      this.#status = 'refused';
      this.#refusalDetail = detail;
      this.#revision += 1;
      return this.#actionRefusal(
        detail.startsWith('derive:') ? 'derivation-refused' : 'fixed-point-mismatch',
        detail,
      );
    }
  }

  close(ticket: TrainingForgePracticeTicketV1): TrainingForgePracticeCloseOutcomeV1 {
    if (this.#status === 'disposed') {
      return Object.freeze({ kind: 'refused', reason: 'disposed', snapshot: this.snapshot() });
    }
    if (ticket === null || typeof ticket !== 'object' || !this.#tickets.has(ticket)
      || ticket !== this.#ticket) {
      return Object.freeze({ kind: 'refused', reason: 'stale-session', snapshot: this.snapshot() });
    }
    this.#sandbox = null;
    this.#ticket = null;
    this.#completion = null;
    this.#refusalDetail = null;
    this.#status = 'closed';
    this.#revision += 1;
    return Object.freeze({ kind: 'closed', snapshot: this.snapshot() });
  }

  dispose(): TrainingForgePracticeSnapshotV1 {
    if (this.#status === 'disposed') return this.snapshot();
    this.#sandbox = null;
    this.#ticket = null;
    this.#completion = null;
    this.#refusalDetail = null;
    this.#status = 'disposed';
    if (this.#generation < Number.MAX_SAFE_INTEGER) this.#generation += 1;
    if (this.#revision < Number.MAX_SAFE_INTEGER) this.#revision += 1;
    return this.snapshot();
  }

  #actionRefusal(
    reason: TrainingForgePracticeActionRefusalV1,
    detail: string,
  ): TrainingForgePracticeActionOutcomeV1 {
    return Object.freeze({ kind: 'refused', reason, detail, snapshot: this.snapshot() });
  }
}

/** Main/Training convenience adapter. It retains only the current branded
 * ticket. `fabricate()` returns a Training-specific event for the lesson bus;
 * the host still owns presentation and must call `exit()` on Back/Close and
 * `dispose()` at app teardown. */
export interface TrainingForgePracticeAdapterV1 {
  readonly enter: (source: TrainingForgePracticeSourceV1) => TrainingForgePracticeOpenOutcomeV1;
  readonly fabricate: () => TrainingForgePracticeActionOutcomeV1;
  readonly exit: () => TrainingForgePracticeSnapshotV1;
  readonly snapshot: () => TrainingForgePracticeSnapshotV1;
  readonly dispose: () => TrainingForgePracticeSnapshotV1;
}

export function createTrainingForgePracticeAdapterV1(): TrainingForgePracticeAdapterV1 {
  const authority = new TrainingForgePracticeAuthorityV1();
  let ticket: TrainingForgePracticeTicketV1 | null = null;
  return Object.freeze({
    enter(source: TrainingForgePracticeSourceV1): TrainingForgePracticeOpenOutcomeV1 {
      const outcome = authority.open(source);
      ticket = outcome.kind === 'ready' ? outcome.ticket : null;
      return outcome;
    },
    fabricate(): TrainingForgePracticeActionOutcomeV1 {
      if (ticket === null) {
        const snapshot = authority.snapshot();
        const reason: TrainingForgePracticeActionRefusalV1 = snapshot.status === 'disposed'
          ? 'disposed' : 'not-open';
        return Object.freeze({
          kind: 'refused', reason, detail: 'no current Training Forge session', snapshot,
        });
      }
      return authority.fabricate(ticket);
    },
    exit(): TrainingForgePracticeSnapshotV1 {
      if (ticket !== null) authority.close(ticket);
      ticket = null;
      return authority.snapshot();
    },
    snapshot(): TrainingForgePracticeSnapshotV1 { return authority.snapshot(); },
    dispose(): TrainingForgePracticeSnapshotV1 {
      ticket = null;
      return authority.dispose();
    },
  });
}
