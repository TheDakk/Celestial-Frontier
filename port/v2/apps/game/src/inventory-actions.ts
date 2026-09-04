/* Arc 2 app projection.

   Exact-instance Inventory owns the mutation. This adapter mirrors only the
   legacy-v4 fields still consumed by the playable slice, so one F4 product
   transaction can persist both representations without teaching the domain
   package about SaveStateV2 or browser state. */
import {
  claimPendingGear,
  equipGear,
  salvageGear,
  unequipGear,
  type GearInstance,
  type GearInventory,
  type SalvageYield,
} from '@cf/domain-loot';

export type Arc2InventoryOperation = 'equip' | 'unequip' | 'salvage' | 'pending-claim';
export const ARC2_LEGACY_CARGO_MAX = 1_000_000;

export interface Arc2LegacyInventoryProjection {
  items: Array<[string, number]>;
  equip: Record<string, string>;
  equipAff: Record<string, { k: string; v: number; forId: string }>;
  cargo: Array<[string, number]>;
}

export type PlannedArc2InventoryAction = Readonly<{
  kind: 'ready';
  state: GearInventory;
  instance: GearInstance;
  salvageYield: SalvageYield | null;
}> | Readonly<{ kind: 'unchanged' | 'refused'; detail: string }>;

export type Arc2LegacyActionProjectionOutcome = Readonly<
  { kind: 'projected' }
  | { kind: 'refused'; detail: 'cargo-invalid' | 'cargo-capacity' }
>;

export function planArc2InventoryAction(
  inventory: GearInventory,
  operation: Arc2InventoryOperation,
  instanceId: string,
): PlannedArc2InventoryAction {
  const entry = inventory.entries.find((candidate) => candidate.instance.instanceId === instanceId);
  const pending = inventory.pendingRewards.find((candidate) => candidate.instance.instanceId === instanceId);
  if (operation === 'equip') {
    const outcome = equipGear(inventory, inventory.revision, instanceId);
    if (outcome.status === 'unchanged') return { kind: 'unchanged', detail: 'already-equipped' };
    if (outcome.status !== 'committed' || !entry) return { kind: 'refused', detail: outcome.status };
    return { kind: 'ready', state: outcome.state, instance: entry.instance, salvageYield: null };
  }
  if (operation === 'unequip') {
    const outcome = unequipGear(inventory, inventory.revision, instanceId);
    if (outcome.status !== 'committed' || !entry) return { kind: 'refused', detail: outcome.status };
    return { kind: 'ready', state: outcome.state, instance: entry.instance, salvageYield: null };
  }
  if (operation === 'salvage') {
    const outcome = salvageGear(inventory, inventory.revision, instanceId);
    if (outcome.status !== 'committed' || !entry) return { kind: 'refused', detail: outcome.status };
    return { kind: 'ready', state: outcome.state, instance: entry.instance, salvageYield: outcome.yield };
  }
  const outcome = claimPendingGear(inventory, inventory.revision, instanceId);
  if (outcome.status !== 'committed' || !pending) return { kind: 'refused', detail: outcome.status };
  return { kind: 'ready', state: outcome.state, instance: pending.instance, salvageYield: null };
}

/** Apply only the exact compatibility fields implied by the successful
 * instance action. Cargo is preflighted against the legacy 1e6 bound; a
 * salvage that would exceed it refuses without spending the instance or
 * publishing a partial projection. Pending claims need no compatibility edit
 * because ownership was recorded when the reward landed. */
export function projectArc2LegacyAction(
  draft: Arc2LegacyInventoryProjection,
  operation: Arc2InventoryOperation,
  plan: Extract<PlannedArc2InventoryAction, { kind: 'ready' }>,
): Arc2LegacyActionProjectionOutcome {
  const { instance } = plan;
  if (operation === 'equip') {
    draft.equip[instance.slot] = instance.baseId;
    if (instance.legacyAffix) {
      draft.equipAff[instance.slot] = {
        k: instance.legacyAffix.affixId,
        v: instance.legacyAffix.value,
        forId: instance.legacyAffix.forBaseId,
      };
    } else delete draft.equipAff[instance.slot];
    return Object.freeze({ kind: 'projected' });
  }
  if (operation === 'unequip') {
    delete draft.equip[instance.slot];
    delete draft.equipAff[instance.slot];
    return Object.freeze({ kind: 'projected' });
  }
  if (operation !== 'salvage' || !plan.salvageYield) {
    return Object.freeze({ kind: 'projected' });
  }
  const cargo = new Map<string, number>();
  for (const [materialId, quantity] of draft.cargo) {
    if (typeof materialId !== 'string' || materialId.length === 0
      || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > ARC2_LEGACY_CARGO_MAX
      || cargo.has(materialId)) {
      return Object.freeze({ kind: 'refused', detail: 'cargo-invalid' });
    }
    cargo.set(materialId, quantity);
  }
  for (const material of plan.salvageYield.materials) {
    const quantity = (cargo.get(material.materialId) ?? 0) + material.quantity;
    if (!Number.isSafeInteger(quantity) || quantity > ARC2_LEGACY_CARGO_MAX) {
      return Object.freeze({ kind: 'refused', detail: 'cargo-capacity' });
    }
    cargo.set(material.materialId, quantity);
  }
  const items = new Map(draft.items);
  const remaining = (items.get(instance.baseId) ?? 0) - 1;
  if (remaining > 0) items.set(instance.baseId, remaining);
  else items.delete(instance.baseId);
  draft.items = [...items.entries()];
  draft.cargo = [...cargo.entries()];
  return Object.freeze({ kind: 'projected' });
}
