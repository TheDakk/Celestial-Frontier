/* Arc 2 fixed-fabrication settlement adapter.

   The Arc 3 planner owns recipe opportunity and produces one exact, in-memory
   branded action plan. This pure adapter accepts only that registered plan,
   consumes Arc 2-owned parts, and routes its exact output. A decoded, cloned,
   spread, or caller-authored lookalike is not planning authority.
   Cargo, exceptional cargo, and Stardust are not fields of Arc2LootInventoryV1;
   their checked negative deltas are returned for the outer F4 transaction to
   revalidate and apply with the carrier write. No partial state is published.

   A prerequisite or Signature is an ownership gate, never an ingredient.
   Arc 2 can re-prove an item prerequisite from its exact carrier. Signature
   ownership remains external and is returned unchanged as a required gate.
   The outer F4 transaction must re-read and revalidate all three external
   authorities before applying these deltas in the same fenced CAS. */
import {
  FIXED_RECIPE_AUTHORITY,
  LOOT_CATALOGUE_V1,
  MAX_LEGACY_ITEM_COUNT,
  MAX_PENDING_GEAR_REWARDS,
  createGearInstance,
  decodeGearInventory,
  encodeGearInventory,
  equipGear,
  grantGear,
  isArc2EngineeringLoadout,
  makeGearSourceActionId,
  type Arc2EngineeringLoadout,
  type GearInventory,
} from '@cf/domain-loot';
import {
  isEngineeringActionPlan,
  type Arc2FabricationDirective,
  type EngineeringQuantity,
  type EngineeringActionPlan,
  type FixedFabricationResult,
} from '@cf/domain-opportunity';
import {
  projectArc2LootLegacyMirror,
  type Arc2LootInventoryV1,
  type Arc2LootLegacyMirror,
  type Arc2LootStackableCountV1,
} from './arc2-loot.js';

export const ARC2_FIXED_FABRICATION_SETTLEMENT_SCHEMA =
  'cf-v2-arc2-fixed-fabrication-settlement/v1' as const;

const UINT32_MAX = 0xffff_ffff;
const CATALOGUE_ORDER = new Map(LOOT_CATALOGUE_V1.map(({ id }, index) => [id, index]));

export interface Arc2FixedFabricationAssetDelta {
  readonly id: string;
  /** A settlement delta, never an absolute balance. Successful craft spends
      are negative; zero rows are omitted. */
  readonly delta: number;
}

export interface Arc2FixedFabricationEconomyDelta {
  readonly materials: readonly Arc2FixedFabricationAssetDelta[];
  readonly exceptionalMaterials: readonly Arc2FixedFabricationAssetDelta[];
  readonly ordinaryMaterials: readonly Arc2FixedFabricationAssetDelta[];
  readonly itemCounts: readonly Arc2FixedFabricationAssetDelta[];
  readonly stardust: number;
}

export interface Arc2FixedFabricationCompatibilityDelta {
  /** Legacy SaveStateV2.cargo deltas. */
  readonly cargo: readonly Arc2FixedFabricationAssetDelta[];
  /** Legacy SaveStateV2.cgx exceptional-subcount deltas. */
  readonly cgx: readonly Arc2FixedFabricationAssetDelta[];
  /** Legacy SaveStateV2.items deltas. The returned complete mirror remains
      the compatibility write target; these rows let F4 re-prove the change. */
  readonly items: readonly Arc2FixedFabricationAssetDelta[];
  /** Legacy SaveStateV2.essence is the current Stardust balance. */
  readonly essence: number;
}

export type Arc2FixedFabricationOutputLocation =
  | 'stackable'
  | 'system'
  | 'equipped'
  | 'inventory'
  | 'pending';

export interface Arc2FixedFabricationReady {
  readonly schema: typeof ARC2_FIXED_FABRICATION_SETTLEMENT_SCHEMA;
  readonly status: 'ready';
  readonly baseId: string;
  readonly receiptOrdinal: number;
  readonly state: Arc2LootInventoryV1;
  readonly mirror: Arc2LootLegacyMirror;
  readonly outputLocation: Arc2FixedFabricationOutputLocation;
  readonly instanceId: string | null;
  readonly sourceActionId: string | null;
  readonly preservedGates: Readonly<{
    readonly prerequisiteId: string | null;
    readonly signatureId: string | null;
  }>;
  readonly economyDelta: Arc2FixedFabricationEconomyDelta;
  readonly compatibilityDelta: Arc2FixedFabricationCompatibilityDelta;
}

export type Arc2FixedFabricationRefusalReason =
  | 'source-unregistered'
  | 'state-invalid'
  | 'plan-invalid'
  | 'prerequisite-missing'
  | 'parts-insufficient'
  | 'already-built'
  | 'output-count-exhausted'
  | 'duplicate-instance'
  | 'pending-capacity'
  | 'revision-exhausted';

export interface Arc2FixedFabricationRefusal {
  readonly schema: typeof ARC2_FIXED_FABRICATION_SETTLEMENT_SCHEMA;
  readonly status: 'refused';
  readonly reason: Arc2FixedFabricationRefusalReason;
  readonly baseId: string | null;
  readonly instanceId: string | null;
}

export type Arc2FixedFabricationSettlement =
  | Arc2FixedFabricationReady
  | Arc2FixedFabricationRefusal;

/** A current Arc 2 carrier decoded and privately registered by
 * `readArc2EngineeringLoadout`. Structural lookalikes are not authority. */
export type Arc2FixedFabricationSource = Arc2EngineeringLoadout;

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function codeUnitCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function refusal(
  reason: Arc2FixedFabricationRefusalReason,
  baseId: string | null = null,
  instanceId: string | null = null,
): Arc2FixedFabricationRefusal {
  return deepFreeze({
    schema: ARC2_FIXED_FABRICATION_SETTLEMENT_SCHEMA,
    status: 'refused' as const,
    reason,
    baseId,
    instanceId,
  });
}

function ownedCount(state: Arc2LootInventoryV1, baseId: string): number {
  const stack = state.stackableCounts.find((row) => row.baseId === baseId)?.count ?? 0;
  const entries = state.inventory.entries.reduce((total, { instance }) => (
    instance.baseId === baseId ? total + 1 : total
  ), 0);
  const pending = state.inventory.pendingRewards.reduce((total, { instance }) => (
    instance.baseId === baseId ? total + 1 : total
  ), 0);
  return stack + entries + pending;
}

function incrementedInventoryRevision(inventory: GearInventory): GearInventory | null {
  if (inventory.revision === UINT32_MAX) return null;
  return decodeGearInventory(encodeGearInventory({
    ...inventory,
    revision: inventory.revision + 1,
  }));
}

function stackableRows(counts: ReadonlyMap<string, number>): readonly Arc2LootStackableCountV1[] {
  return deepFreeze([...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => CATALOGUE_ORDER.get(left)! - CATALOGUE_ORDER.get(right)!)
    .map(([baseId, count]) => ({ baseId, count })));
}

function negativeRows(rows: readonly EngineeringQuantity[]): readonly Arc2FixedFabricationAssetDelta[] {
  return deepFreeze(rows.map(({ id, quantity }) => ({ id, delta: -quantity })));
}

function itemDeltas(
  consumed: readonly EngineeringQuantity[],
  outputBaseId: string,
): readonly Arc2FixedFabricationAssetDelta[] {
  const deltas = new Map<string, number>();
  for (const { id, quantity } of consumed) deltas.set(id, (deltas.get(id) ?? 0) - quantity);
  deltas.set(outputBaseId, (deltas.get(outputBaseId) ?? 0) + 1);
  return deepFreeze([...deltas.entries()]
    .filter(([, delta]) => delta !== 0)
    .sort(([left], [right]) => codeUnitCompare(left, right))
    .map(([id, delta]) => ({ id, delta })));
}

function deltasFor(directive: Arc2FabricationDirective): Readonly<{
  economyDelta: Arc2FixedFabricationEconomyDelta;
  compatibilityDelta: Arc2FixedFabricationCompatibilityDelta;
}> {
  const materials = negativeRows(directive.consume.materials);
  const exceptionalMaterials = negativeRows(directive.consume.exceptionalMaterials);
  const exceptionalById = new Map(
    directive.consume.exceptionalMaterials.map(({ id, quantity }) => [id, quantity]),
  );
  const ordinaryMaterials = deepFreeze(directive.consume.materials.flatMap(({ id, quantity }) => {
    const ordinary = quantity - (exceptionalById.get(id) ?? 0);
    return ordinary > 0 ? [{ id, delta: -ordinary }] : [];
  }));
  const items = itemDeltas(directive.consume.itemCounts, directive.baseId);
  const stardust = directive.consume.stardust === 0 ? 0 : -directive.consume.stardust;
  return deepFreeze({
    economyDelta: {
      materials,
      exceptionalMaterials,
      ordinaryMaterials,
      itemCounts: items,
      stardust,
    },
    compatibilityDelta: {
      cargo: materials,
      cgx: exceptionalMaterials,
      items,
      essence: stardust,
    },
  });
}

/** Prepare one Arc 2 fixed-craft settlement. `source` must be the exact
 * persistence-issued loadout returned by a fresh `readArc2EngineeringLoadout`
 * call. WeakSet membership is checked before any source property access, so a
 * Proxy or structural clone cannot become settlement authority or run traps
 * at this boundary. External deltas are declarative: the F4 owner must
 * re-check current cargo/cgx/essence balances and apply them in the same CAS
 * as `state`. A refusal returns no writable fragment. */
export function prepareArc2FixedFabrication(
  source: Arc2FixedFabricationSource,
  candidatePlan: EngineeringActionPlan<FixedFabricationResult>,
): Arc2FixedFabricationSettlement {
  if (!isArc2EngineeringLoadout(source)) return refusal('source-unregistered');
  if (!isEngineeringActionPlan(candidatePlan)
    || candidatePlan.operation !== 'fabricate-fixed') {
    return refusal('plan-invalid');
  }
  const state: Arc2LootInventoryV1 = Object.freeze({
    kind: 'inventory',
    inventory: source.inventory,
    stackableCounts: source.stackableCounts,
  });
  const plan = candidatePlan as EngineeringActionPlan<FixedFabricationResult>;
  const directive = plan.result.arc2;
  const receiptOrdinal = plan.receiptOrdinal;
  if (plan.result.baseId !== directive.baseId) return refusal('plan-invalid');
  const generationPlan = directive.gearGenerationPlan;

  if (directive.preservePrerequisiteId !== null
    && ownedCount(state, directive.preservePrerequisiteId) < 1) {
    return refusal('prerequisite-missing', directive.baseId);
  }

  const counts = new Map(state.stackableCounts.map(({ baseId, count }) => [baseId, count]));
  if (directive.outputKind === 'permanent-system'
    && (counts.get(directive.baseId) ?? 0) > 0) {
    return refusal('already-built', directive.baseId);
  }
  if ((directive.outputKind === 'stackable' || directive.outputKind === 'permanent-system')
    && (counts.get(directive.baseId) ?? 0) >= MAX_LEGACY_ITEM_COUNT) {
    return refusal('output-count-exhausted', directive.baseId);
  }
  for (const { id, quantity } of directive.consume.itemCounts) {
    const current = counts.get(id) ?? 0;
    if (current < quantity) return refusal('parts-insufficient', directive.baseId);
    const next = current - quantity;
    if (next > 0) counts.set(id, next); else counts.delete(id);
  }

  let inventory = state.inventory;
  let outputLocation: Arc2FixedFabricationOutputLocation;
  let instanceId: string | null = null;
  let sourceActionId: string | null = null;

  if (directive.outputKind === 'stackable' || directive.outputKind === 'permanent-system') {
    const current = counts.get(directive.baseId) ?? 0;
    const nextInventory = incrementedInventoryRevision(inventory);
    if (!nextInventory) return refusal('revision-exhausted', directive.baseId);
    inventory = nextInventory;
    counts.set(directive.baseId, current + 1);
    outputLocation = directive.outputKind === 'permanent-system' ? 'system' : 'stackable';
  } else {
    if (!generationPlan) return refusal('plan-invalid', directive.baseId);
    sourceActionId = makeGearSourceActionId({
      kind: 'craft',
      ownerId: FIXED_RECIPE_AUTHORITY,
      actionKey: `recipe:${directive.baseId}`,
      receiptId: `receipt:${receiptOrdinal}`,
    });
    let instance;
    try { instance = createGearInstance(sourceActionId, 0, generationPlan); } catch {
      return refusal('plan-invalid', directive.baseId);
    }
    instanceId = instance.instanceId;
    if (inventory.entries.some(({ instance: candidate }) => candidate.instanceId === instanceId)
      || inventory.pendingRewards.some(({ instance: candidate }) => candidate.instanceId === instanceId)) {
      return refusal('duplicate-instance', directive.baseId, instanceId);
    }
    const hasStorage = inventory.entries.length < inventory.capacity;
    const slotEmpty = !inventory.equipped.some(({ slot }) => slot === instance.slot);
    if (!hasStorage && inventory.pendingRewards.length >= MAX_PENDING_GEAR_REWARDS) {
      return refusal('pending-capacity', directive.baseId, instanceId);
    }
    const requiredRevisions = hasStorage && slotEmpty ? 2 : 1;
    if (inventory.revision > UINT32_MAX - requiredRevisions) {
      return refusal('revision-exhausted', directive.baseId, instanceId);
    }
    const granted = grantGear(inventory, inventory.revision, instance);
    if (granted.status !== 'committed') {
      return refusal(
        granted.status === 'duplicate' ? 'duplicate-instance' : 'state-invalid',
        directive.baseId,
        instanceId,
      );
    }
    inventory = granted.state;
    if (granted.location === 'pending') {
      outputLocation = 'pending';
    } else if (slotEmpty) {
      const equipped = equipGear(inventory, inventory.revision, instanceId);
      if (equipped.status !== 'committed') return refusal('state-invalid', directive.baseId, instanceId);
      inventory = equipped.state;
      outputLocation = 'equipped';
    } else {
      outputLocation = 'inventory';
    }
  }

  const nextState = deepFreeze({
    kind: 'inventory' as const,
    inventory,
    stackableCounts: stackableRows(counts),
  });
  const mirror = projectArc2LootLegacyMirror(nextState);
  const deltas = deltasFor(directive);
  return deepFreeze({
    schema: ARC2_FIXED_FABRICATION_SETTLEMENT_SCHEMA,
    status: 'ready' as const,
    baseId: directive.baseId,
    receiptOrdinal,
    state: nextState,
    mirror,
    outputLocation,
    instanceId,
    sourceActionId,
    preservedGates: {
      prerequisiteId: directive.preservePrerequisiteId,
      signatureId: directive.preserveSignatureId,
    },
    ...deltas,
  });
}
