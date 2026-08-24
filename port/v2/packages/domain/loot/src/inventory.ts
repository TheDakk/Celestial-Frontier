/* Exact-instance Inventory transitions. Persistence supplies the outer CAS;
   every operation also rejects an observed revision mismatch so a caller
   cannot accidentally prepare a destructive mutation from stale state. */
import { GEAR_SLOTS, getLootCatalogueDefinition, type GearSlot } from './catalogue.js';
import { decodeGearObject, encodeGearInstance, type GearInstance } from './gear.js';
import {
  UINT32_MAX,
  assertExactKeys,
  assertPlainRecord,
  checkedInteger,
  deepFreeze,
} from './internal.js';

export const GEAR_INVENTORY_SCHEMA = 1 as const;
/* Codec/denial-of-service bounds only. There is deliberately no gameplay
   capacity default: the caller supplies the capacity owned by its storage
   policy until Arc 2 has an enforced pack-capacity authority. */
export const MAX_GEAR_CAPACITY = 200;
export const MAX_PENDING_GEAR_REWARDS = 500;
export const MAX_GEAR_INVENTORY_JSON_BYTES = 8 * 1024 * 1024;

export interface GearInventoryEntry {
  readonly instance: GearInstance;
  readonly favorite: boolean;
  readonly locked: boolean;
}

export interface EquippedGear {
  readonly slot: GearSlot;
  readonly instanceId: string;
}

export interface PendingGearReward {
  readonly instance: GearInstance;
  readonly reason: 'capacity';
}

export interface GearInventory {
  readonly schema: typeof GEAR_INVENTORY_SCHEMA;
  readonly revision: number;
  readonly capacity: number;
  readonly entries: readonly GearInventoryEntry[];
  readonly equipped: readonly EquippedGear[];
  readonly pendingRewards: readonly PendingGearReward[];
}

export const GEAR_SALVAGE_POLICY = 'legacy-v1.8.9-direct-material-half' as const;

export interface SalvageMaterialReturn {
  readonly materialId: string;
  readonly quantity: number;
}

export interface SalvageYield {
  readonly policy: typeof GEAR_SALVAGE_POLICY;
  readonly baseId: string;
  readonly materials: readonly SalvageMaterialReturn[];
}

export type InventoryMutationFailure =
  | Readonly<{ status: 'stale'; expectedRevision: number; actualRevision: number }>
  | Readonly<{ status: 'missing'; instanceId: string }>
  | Readonly<{ status: 'duplicate'; instanceId: string }>
  | Readonly<{ status: 'pending-reward'; instanceId: string }>
  | Readonly<{ status: 'capacity'; instanceId: string }>
  | Readonly<{ status: 'not-equipped'; instanceId: string }>
  | Readonly<{ status: 'protected'; instanceId: string; reason: 'equipped' | 'favorite' | 'locked' }>
  | Readonly<{ status: 'revision-exhausted'; actualRevision: number }>;

function sortedEquipment(values: readonly EquippedGear[]): EquippedGear[] {
  const order = new Map<string, number>(GEAR_SLOTS.map((slot, index) => [slot, index]));
  return [...values].sort((left, right) => order.get(left.slot)! - order.get(right.slot)!);
}

function decodeInventoryValue(raw: unknown): GearInventory {
  assertPlainRecord(raw, 'GearInventory');
  assertExactKeys(raw, ['schema', 'revision', 'capacity', 'entries', 'equipped', 'pendingRewards'], 'GearInventory');
  if (raw.schema !== GEAR_INVENTORY_SCHEMA) throw new RangeError('unsupported GearInventory schema');
  const revision = checkedInteger(raw.revision, 0, UINT32_MAX, 'GearInventory revision');
  const capacity = checkedInteger(raw.capacity, 1, MAX_GEAR_CAPACITY, 'GearInventory capacity');
  if (!Array.isArray(raw.entries)) throw new TypeError('GearInventory entries must be an array');
  if (!Array.isArray(raw.equipped)) throw new TypeError('GearInventory equipped must be an array');
  if (!Array.isArray(raw.pendingRewards)) throw new TypeError('GearInventory pendingRewards must be an array');
  if (raw.entries.length > capacity) throw new RangeError('GearInventory entries exceed capacity');
  if (raw.pendingRewards.length > MAX_PENDING_GEAR_REWARDS) throw new RangeError('GearInventory pending rewards exceed compatibility cap');

  const entries: GearInventoryEntry[] = raw.entries.map((candidate, index) => {
    assertPlainRecord(candidate, `GearInventory entry ${index}`);
    assertExactKeys(candidate, ['instance', 'favorite', 'locked'], `GearInventory entry ${index}`);
    if (typeof candidate.favorite !== 'boolean' || typeof candidate.locked !== 'boolean') {
      throw new TypeError(`GearInventory entry ${index} protection flags must be booleans`);
    }
    return { instance: decodeGearObject(candidate.instance), favorite: candidate.favorite, locked: candidate.locked };
  });

  const pendingRewards: PendingGearReward[] = raw.pendingRewards.map((candidate, index) => {
    assertPlainRecord(candidate, `PendingGearReward ${index}`);
    assertExactKeys(candidate, ['instance', 'reason'], `PendingGearReward ${index}`);
    if (candidate.reason !== 'capacity') throw new RangeError(`PendingGearReward ${index} has unsupported reason`);
    return { instance: decodeGearObject(candidate.instance), reason: 'capacity' };
  });

  const allIds = [...entries.map((entry) => entry.instance.instanceId), ...pendingRewards.map((reward) => reward.instance.instanceId)];
  if (new Set(allIds).size !== allIds.length) throw new RangeError('GearInventory contains a duplicate instanceId');
  const entryById = new Map(entries.map((entry) => [entry.instance.instanceId, entry]));
  const usedSlots = new Set<GearSlot>();
  const equipped: EquippedGear[] = raw.equipped.map((candidate, index) => {
    assertPlainRecord(candidate, `EquippedGear ${index}`);
    assertExactKeys(candidate, ['slot', 'instanceId'], `EquippedGear ${index}`);
    if (typeof candidate.slot !== 'string' || !(GEAR_SLOTS as readonly string[]).includes(candidate.slot)) {
      throw new RangeError(`EquippedGear ${index} has unsupported slot`);
    }
    if (typeof candidate.instanceId !== 'string') throw new TypeError(`EquippedGear ${index} instanceId must be a string`);
    const slot = candidate.slot as GearSlot;
    const entry = entryById.get(candidate.instanceId);
    if (!entry) throw new RangeError(`EquippedGear ${index} references a missing instance`);
    if (entry.instance.slot !== slot) throw new RangeError(`EquippedGear ${index} slot does not match its exact instance`);
    if (usedSlots.has(slot)) throw new RangeError(`GearInventory equips more than one instance in ${slot}`);
    usedSlots.add(slot);
    return { slot, instanceId: candidate.instanceId };
  });

  return deepFreeze({
    schema: GEAR_INVENTORY_SCHEMA,
    revision,
    capacity,
    entries,
    equipped: sortedEquipment(equipped),
    pendingRewards,
  });
}

export function createGearInventory(capacity: number): GearInventory {
  return deepFreeze({
    schema: GEAR_INVENTORY_SCHEMA,
    revision: 0,
    capacity: checkedInteger(capacity, 1, MAX_GEAR_CAPACITY, 'GearInventory capacity'),
    entries: [],
    equipped: [],
    pendingRewards: [],
  });
}

export function encodeGearInventory(inventory: GearInventory): string {
  return JSON.stringify(decodeInventoryValue(inventory));
}

export function decodeGearInventory(encoded: string): GearInventory {
  if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > MAX_GEAR_INVENTORY_JSON_BYTES) {
    throw new RangeError('GearInventory JSON is empty or exceeds its compatibility bound');
  }
  let raw: unknown;
  try { raw = JSON.parse(encoded); } catch { throw new TypeError('GearInventory JSON is malformed'); }
  return decodeInventoryValue(raw);
}

function checkedState(inventory: GearInventory): GearInventory {
  return decodeInventoryValue(inventory);
}

function stale(inventory: GearInventory, expectedRevision: number): InventoryMutationFailure | null {
  const expected = checkedInteger(expectedRevision, 0, UINT32_MAX, 'expected GearInventory revision');
  return expected === inventory.revision
    ? null
    : deepFreeze({ status: 'stale', expectedRevision: expected, actualRevision: inventory.revision });
}

function nextRevision(inventory: GearInventory): number | null {
  return inventory.revision === UINT32_MAX ? null : inventory.revision + 1;
}

function exhausted(inventory: GearInventory): InventoryMutationFailure {
  return deepFreeze({ status: 'revision-exhausted', actualRevision: inventory.revision });
}

function committedState(
  inventory: GearInventory,
  patch: Partial<Pick<GearInventory, 'entries' | 'equipped' | 'pendingRewards'>>,
): GearInventory | null {
  const revision = nextRevision(inventory);
  if (revision === null) return null;
  return decodeInventoryValue({ ...inventory, ...patch, revision });
}

function hasPending(inventory: GearInventory, instanceId: string): boolean {
  return inventory.pendingRewards.some((reward) => reward.instance.instanceId === instanceId);
}

export function grantGear(
  inventoryValue: GearInventory,
  expectedRevision: number,
  instanceValue: GearInstance,
): InventoryMutationFailure | Readonly<{ status: 'committed'; state: GearInventory; location: 'inventory' | 'pending' }> {
  const inventory = checkedState(inventoryValue);
  const staleResult = stale(inventory, expectedRevision);
  if (staleResult) return staleResult;
  const instance = decodeGearObject(JSON.parse(encodeGearInstance(instanceValue)));
  if (inventory.entries.some((entry) => entry.instance.instanceId === instance.instanceId) || hasPending(inventory, instance.instanceId)) {
    return deepFreeze({ status: 'duplicate', instanceId: instance.instanceId });
  }
  if (inventory.entries.length < inventory.capacity) {
    const state = committedState(inventory, {
      entries: [...inventory.entries, { instance, favorite: false, locked: false }],
    });
    return state ? deepFreeze({ status: 'committed', state, location: 'inventory' }) : exhausted(inventory);
  }
  if (inventory.pendingRewards.length >= MAX_PENDING_GEAR_REWARDS) {
    throw new RangeError('pending reward compatibility cap reached; settlement must stop before granting');
  }
  const state = committedState(inventory, {
    pendingRewards: [...inventory.pendingRewards, { instance, reason: 'capacity' }],
  });
  return state ? deepFreeze({ status: 'committed', state, location: 'pending' }) : exhausted(inventory);
}

export function equipGear(
  inventoryValue: GearInventory,
  expectedRevision: number,
  instanceId: string,
): InventoryMutationFailure | Readonly<{ status: 'unchanged'; state: GearInventory }> | Readonly<{ status: 'committed'; state: GearInventory; replacedInstanceId: string | null }> {
  const inventory = checkedState(inventoryValue);
  const staleResult = stale(inventory, expectedRevision);
  if (staleResult) return staleResult;
  const entry = inventory.entries.find((candidate) => candidate.instance.instanceId === instanceId);
  if (!entry) {
    return deepFreeze(hasPending(inventory, instanceId)
      ? { status: 'pending-reward', instanceId }
      : { status: 'missing', instanceId });
  }
  const current = inventory.equipped.find((binding) => binding.slot === entry.instance.slot);
  if (current?.instanceId === instanceId) return deepFreeze({ status: 'unchanged', state: inventory });
  const equipped = sortedEquipment([
    ...inventory.equipped.filter((binding) => binding.slot !== entry.instance.slot),
    { slot: entry.instance.slot, instanceId },
  ]);
  const state = committedState(inventory, { equipped });
  return state
    ? deepFreeze({ status: 'committed', state, replacedInstanceId: current?.instanceId ?? null })
    : exhausted(inventory);
}

export function unequipGear(
  inventoryValue: GearInventory,
  expectedRevision: number,
  instanceId: string,
): InventoryMutationFailure | Readonly<{ status: 'committed'; state: GearInventory }> {
  const inventory = checkedState(inventoryValue);
  const staleResult = stale(inventory, expectedRevision);
  if (staleResult) return staleResult;
  if (!inventory.entries.some((entry) => entry.instance.instanceId === instanceId)) {
    return deepFreeze(hasPending(inventory, instanceId)
      ? { status: 'pending-reward', instanceId }
      : { status: 'missing', instanceId });
  }
  if (!inventory.equipped.some((binding) => binding.instanceId === instanceId)) {
    return deepFreeze({ status: 'not-equipped', instanceId });
  }
  const state = committedState(inventory, {
    equipped: inventory.equipped.filter((binding) => binding.instanceId !== instanceId),
  });
  return state ? deepFreeze({ status: 'committed', state }) : exhausted(inventory);
}

export function setGearProtection(
  inventoryValue: GearInventory,
  expectedRevision: number,
  instanceId: string,
  protection: Readonly<{ favorite: boolean; locked: boolean }>,
): InventoryMutationFailure | Readonly<{ status: 'unchanged'; state: GearInventory }> | Readonly<{ status: 'committed'; state: GearInventory }> {
  const inventory = checkedState(inventoryValue);
  const staleResult = stale(inventory, expectedRevision);
  if (staleResult) return staleResult;
  if (!protection || typeof protection.favorite !== 'boolean' || typeof protection.locked !== 'boolean') {
    throw new TypeError('gear protection requires exact favorite and locked booleans');
  }
  const index = inventory.entries.findIndex((entry) => entry.instance.instanceId === instanceId);
  if (index < 0) return deepFreeze(hasPending(inventory, instanceId)
    ? { status: 'pending-reward', instanceId }
    : { status: 'missing', instanceId });
  const prior = inventory.entries[index]!;
  if (prior.favorite === protection.favorite && prior.locked === protection.locked) {
    return deepFreeze({ status: 'unchanged', state: inventory });
  }
  const entries = [...inventory.entries];
  entries[index] = { instance: prior.instance, favorite: protection.favorite, locked: protection.locked };
  const state = committedState(inventory, { entries });
  return state ? deepFreeze({ status: 'committed', state }) : exhausted(inventory);
}

/* Exact v1.8.9 _SALVAGE_GATED keys. These materials may still return their
   ordinary floored half when a recipe spends at least two; they are excluded
   only from the one-unit fallback that follows an otherwise empty refund. */
const LEGACY_SALVAGE_GATED_MATERIALS: ReadonlySet<string> = new Set([
  'Nd', 'Pm', 'Vg', 'Pz', 'Pls', 'Crn', 'Pro', 'Pri', 'Voe', 'Chr', 'Dkm',
  'Au', 'Pt', 'Ir', 'U', 'Th',
]);

export function previewGearSalvage(instanceValue: GearInstance): SalvageYield {
  const instance = decodeGearObject(JSON.parse(encodeGearInstance(instanceValue)));
  const base = getLootCatalogueDefinition(instance.baseId);
  if (!base || base.inventoryShape !== 'slotted') {
    throw new RangeError('gear salvage requires canonical slotted base recipe authority');
  }
  const materials: SalvageMaterialReturn[] = [];
  for (const [materialId, cost] of Object.entries(base.materialCost)) {
    const quantity = Math.floor(cost * 0.5);
    if (quantity > 0) materials.push({ materialId, quantity });
  }
  if (materials.length === 0) {
    const fallbackId = Object.keys(base.materialCost)
      .find((materialId) => !LEGACY_SALVAGE_GATED_MATERIALS.has(materialId));
    if (fallbackId !== undefined) materials.push({ materialId: fallbackId, quantity: 1 });
  }
  return deepFreeze({
    policy: GEAR_SALVAGE_POLICY,
    baseId: instance.baseId,
    materials,
  });
}

export function salvageGear(
  inventoryValue: GearInventory,
  expectedRevision: number,
  instanceId: string,
): InventoryMutationFailure | Readonly<{ status: 'committed'; state: GearInventory; yield: SalvageYield }> {
  const inventory = checkedState(inventoryValue);
  const staleResult = stale(inventory, expectedRevision);
  if (staleResult) return staleResult;
  const entry = inventory.entries.find((candidate) => candidate.instance.instanceId === instanceId);
  if (!entry) return deepFreeze(hasPending(inventory, instanceId)
    ? { status: 'pending-reward', instanceId }
    : { status: 'missing', instanceId });
  if (inventory.equipped.some((binding) => binding.instanceId === instanceId)) {
    return deepFreeze({ status: 'protected', instanceId, reason: 'equipped' });
  }
  if (entry.favorite) return deepFreeze({ status: 'protected', instanceId, reason: 'favorite' });
  if (entry.locked) return deepFreeze({ status: 'protected', instanceId, reason: 'locked' });
  const state = committedState(inventory, {
    entries: inventory.entries.filter((candidate) => candidate.instance.instanceId !== instanceId),
  });
  return state
    ? deepFreeze({ status: 'committed', state, yield: previewGearSalvage(entry.instance) })
    : exhausted(inventory);
}

export function claimPendingGear(
  inventoryValue: GearInventory,
  expectedRevision: number,
  instanceId: string,
): InventoryMutationFailure | Readonly<{ status: 'committed'; state: GearInventory }> {
  const inventory = checkedState(inventoryValue);
  const staleResult = stale(inventory, expectedRevision);
  if (staleResult) return staleResult;
  const pending = inventory.pendingRewards.find((reward) => reward.instance.instanceId === instanceId);
  if (!pending) {
    return deepFreeze(inventory.entries.some((entry) => entry.instance.instanceId === instanceId)
      ? { status: 'duplicate', instanceId }
      : { status: 'missing', instanceId });
  }
  if (inventory.entries.length >= inventory.capacity) return deepFreeze({ status: 'capacity', instanceId });
  const state = committedState(inventory, {
    entries: [...inventory.entries, { instance: pending.instance, favorite: false, locked: false }],
    pendingRewards: inventory.pendingRewards.filter((reward) => reward.instance.instanceId !== instanceId),
  });
  return state ? deepFreeze({ status: 'committed', state }) : exhausted(inventory);
}
