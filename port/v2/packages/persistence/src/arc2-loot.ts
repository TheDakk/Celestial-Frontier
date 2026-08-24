/* Arc 2 loot persistence owner.

   `inventory/arc2.loot` is a v5-only, independently versioned carrier. It
   never projects into the legacy-v4 compatibility object. A bounded legacy
   save becomes an exact GearInventory only when the caller supplies enough
   truthful capacity and the complete carrier fits the existing extension
   byte authority. Otherwise the original legacy facts remain compact and
   refusal-only; no prefix of the gear expansion is ever made writable.

   This module owns no clock and consumes no entropy. F4 transaction writers
   use the returned single-namespace write and let the shared F3/F4 owner land
   it with the product mutation, receipt, authority, and revision CAS. */
import {
  GEAR_INVENTORY_SCHEMA,
  GEAR_SLOTS,
  LOOT_CATALOGUE_V1,
  MAX_GEAR_CAPACITY,
  MAX_LEGACY_ITEM_COUNT,
  decodeGearInventory,
  getLootCatalogueDefinition,
  makeGearSourceActionId,
  migrateLegacyGear,
  type GearInventory,
  type GearSlot,
  type LegacyEquippedAffix,
  type LegacyGearMigrationInput,
} from '@cf/domain-loot';
import type { SaveStateV2 } from './import-v2.js';
import {
  canonicalizeV5Extensions,
  type V5ExtensionCarrier,
  type V5Extensions,
} from './migration-v5.js';

export const ARC2_LOOT_NAMESPACE = 'arc2.loot' as const;
export const ARC2_LOOT_VERSION = 1 as const;
export const ARC2_LOOT_SEGMENT = 'inventory' as const;
export const ARC2_LOOT_LEGACY_SOURCE_ACTION_ID = makeGearSourceActionId({
  kind: 'legacy-migration',
  ownerId: 'save-v2-user',
  actionKey: 'items-v1',
  receiptId: 'migration:v4-v5',
});

export interface Arc2LootStackableCountV1 {
  readonly baseId: string;
  readonly count: number;
}

export interface Arc2LootInventoryV1 {
  readonly kind: 'inventory';
  readonly inventory: GearInventory;
  readonly stackableCounts: readonly Arc2LootStackableCountV1[];
}

export type Arc2LootLegacyProtectionReason = 'capacity' | 'extension-bytes';

/** Compact source truth. It is deliberately not a GearInventory and therefore
 * cannot be equipped, salvaged, claimed, or partially consumed. */
export interface Arc2LootLegacyProtectedV1 {
  readonly kind: 'legacy-protected';
  readonly reason: Arc2LootLegacyProtectionReason;
  readonly sourceActionId: typeof ARC2_LOOT_LEGACY_SOURCE_ACTION_ID;
  readonly estimatedInstanceCount: number;
  readonly itemCounts: readonly (readonly [string, number])[];
  readonly equipped: Readonly<Partial<Record<GearSlot, string>>>;
  readonly equippedAffixes: Readonly<Partial<Record<GearSlot, LegacyEquippedAffix>>>;
}

export type Arc2LootStateV1 = Arc2LootInventoryV1 | Arc2LootLegacyProtectedV1;

export type Arc2LootReadOutcome =
  | { readonly kind: 'absent' }
  | { readonly kind: 'loaded'; readonly state: Arc2LootStateV1 }
  | { readonly kind: 'future-version'; readonly version: number }
  | { readonly kind: 'corrupt' };

export interface Arc2LootExtensionWrite {
  readonly segment: typeof ARC2_LOOT_SEGMENT;
  readonly namespace: typeof ARC2_LOOT_NAMESPACE;
  readonly carrier: V5ExtensionCarrier;
}

export interface PreparedArc2LootWrite {
  readonly kind: 'prepared';
  readonly state: Arc2LootStateV1;
  readonly write: Arc2LootExtensionWrite;
  /** Complete checked projection supplied for diagnostics/fixed-point tests.
   * F4 writers still return only `write`; their shared owner applies it once. */
  readonly extensions: V5Extensions;
}

export type Arc2LootWriteProtectionReason =
  | 'target-absent'
  | 'target-future'
  | 'target-corrupt'
  | 'legacy-protected'
  | 'legacy-corrupt'
  | 'extensions-corrupt'
  | 'extension-bounds';

export type Arc2LootWritePreparation =
  | PreparedArc2LootWrite
  | { readonly kind: 'protected'; readonly reason: Arc2LootWriteProtectionReason; readonly version?: number };

export type Arc2LootLegacyMigrationPreparation =
  | PreparedArc2LootWrite
  | { readonly kind: 'already-loaded'; readonly state: Arc2LootStateV1 }
  | { readonly kind: 'protected'; readonly reason: Arc2LootWriteProtectionReason; readonly version?: number };

type LegacyLootFields = Pick<SaveStateV2, 'items' | 'equip' | 'equipAff'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function checkedInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new RangeError(`${label} must be an integer from ${minimum} to ${maximum}`);
  }
  return value as number;
}

const CATALOGUE_ORDER = new Map(LOOT_CATALOGUE_V1.map(({ id }, index) => [id, index]));

function canonicalItemCounts(value: unknown): readonly (readonly [string, number])[] {
  if (!Array.isArray(value) || value.length > LOOT_CATALOGUE_V1.length) {
    throw new RangeError('legacy loot itemCounts exceeds the canonical catalogue');
  }
  const seen = new Set<string>();
  const result = value.map((entry, index): readonly [string, number] => {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string') {
      throw new TypeError(`legacy loot itemCounts entry ${index} must be an exact pair`);
    }
    const definition = getLootCatalogueDefinition(entry[0]);
    if (!definition) throw new RangeError(`legacy loot itemCounts entry ${index} has unknown base`);
    if (seen.has(definition.id)) throw new RangeError(`legacy loot itemCounts repeats ${definition.id}`);
    seen.add(definition.id);
    return Object.freeze([
      definition.id,
      checkedInteger(entry[1], 0, MAX_LEGACY_ITEM_COUNT, `legacy loot ${definition.id} count`),
    ] as const);
  });
  result.sort((left, right) => CATALOGUE_ORDER.get(left[0])! - CATALOGUE_ORDER.get(right[0])!);
  return Object.freeze(result);
}

function canonicalEquipped(value: unknown): Readonly<Partial<Record<GearSlot, string>>> {
  if (!isRecord(value)) throw new TypeError('legacy loot equipped must be an object');
  const unknown = Object.keys(value).find((slot) => !(GEAR_SLOTS as readonly string[]).includes(slot));
  if (unknown !== undefined) throw new RangeError(`legacy loot equipped has unknown slot ${unknown}`);
  const result: Partial<Record<GearSlot, string>> = {};
  for (const slot of GEAR_SLOTS) {
    const baseId = value[slot];
    if (baseId === undefined) continue;
    if (typeof baseId !== 'string') throw new TypeError(`legacy loot equipped ${slot} must be a base id`);
    result[slot] = baseId;
  }
  return Object.freeze(result);
}

function canonicalEquippedAffixes(
  value: unknown,
): Readonly<Partial<Record<GearSlot, LegacyEquippedAffix>>> {
  if (!isRecord(value)) throw new TypeError('legacy loot equippedAffixes must be an object');
  const unknown = Object.keys(value).find((slot) => !(GEAR_SLOTS as readonly string[]).includes(slot));
  if (unknown !== undefined) throw new RangeError(`legacy loot equippedAffixes has unknown slot ${unknown}`);
  const result: Partial<Record<GearSlot, LegacyEquippedAffix>> = {};
  for (const slot of GEAR_SLOTS) {
    const candidate = value[slot];
    if (candidate === undefined) continue;
    if (!isRecord(candidate) || !hasExactKeys(candidate, ['k', 'v', 'forId'])
      || typeof candidate.k !== 'string'
      || typeof candidate.v !== 'number' || !Number.isFinite(candidate.v)
      || typeof candidate.forId !== 'string') {
      throw new TypeError(`legacy loot equippedAffixes ${slot} is malformed`);
    }
    result[slot] = Object.freeze({
      k: candidate.k as LegacyEquippedAffix['k'],
      v: candidate.v,
      forId: candidate.forId,
    });
  }
  return Object.freeze(result);
}

interface CanonicalLegacyFacts {
  readonly itemCounts: readonly (readonly [string, number])[];
  readonly equipped: Readonly<Partial<Record<GearSlot, string>>>;
  readonly equippedAffixes: Readonly<Partial<Record<GearSlot, LegacyEquippedAffix>>>;
  readonly estimatedInstanceCount: number;
}

function migrationInput(facts: CanonicalLegacyFacts): LegacyGearMigrationInput {
  return Object.freeze({
    sourceActionId: ARC2_LOOT_LEGACY_SOURCE_ACTION_ID,
    itemCounts: facts.itemCounts,
    equipped: facts.equipped,
    equippedAffixes: facts.equippedAffixes,
  });
}

function canonicalLegacyFacts(value: LegacyLootFields): CanonicalLegacyFacts {
  const itemCounts = canonicalItemCounts(value.items);
  const equipped = canonicalEquipped(value.equip);
  const equippedAffixes = canonicalEquippedAffixes(value.equipAff);
  const estimatedInstanceCount = itemCounts.reduce((total, [baseId, count]) => (
    getLootCatalogueDefinition(baseId)?.inventoryShape === 'slotted' ? total + count : total
  ), 0);
  const facts = Object.freeze({ itemCounts, equipped, equippedAffixes, estimatedInstanceCount });

  /* Validate every source fact through the current truthful migration owner
     without materializing an oversized expansion. One representative copy
     proves equipped/affix ownership; the separately checked exact counts own
     the compact carrier and estimated total. */
  const validationFacts: CanonicalLegacyFacts = Object.freeze({
    ...facts,
    itemCounts: Object.freeze(itemCounts.map(([baseId, count]) => Object.freeze([
      baseId,
      getLootCatalogueDefinition(baseId)?.inventoryShape === 'slotted' && count > 0 ? 1 : count,
    ] as const))),
  });
  migrateLegacyGear(migrationInput(validationFacts));
  return facts;
}

function canonicalStackableCounts(value: unknown): readonly Arc2LootStackableCountV1[] {
  if (!Array.isArray(value) || value.length > LOOT_CATALOGUE_V1.length) {
    throw new RangeError('Arc 2 stackable counts exceed the canonical catalogue');
  }
  const seen = new Set<string>();
  const result = value.map((candidate, index): Arc2LootStackableCountV1 => {
    if (!isRecord(candidate) || !hasExactKeys(candidate, ['baseId', 'count'])
      || typeof candidate.baseId !== 'string') {
      throw new TypeError(`Arc 2 stackable count ${index} is malformed`);
    }
    const definition = getLootCatalogueDefinition(candidate.baseId);
    if (!definition || definition.inventoryShape !== 'stackable') {
      throw new RangeError(`Arc 2 stackable count ${index} has a non-stackable base`);
    }
    if (seen.has(definition.id)) throw new RangeError(`Arc 2 stackable counts repeat ${definition.id}`);
    seen.add(definition.id);
    return Object.freeze({
      baseId: definition.id,
      count: checkedInteger(candidate.count, 1, MAX_LEGACY_ITEM_COUNT, `Arc 2 ${definition.id} stack count`),
    });
  });
  result.sort((left, right) => CATALOGUE_ORDER.get(left.baseId)! - CATALOGUE_ORDER.get(right.baseId)!);
  return Object.freeze(result);
}

function inventoryFromMigration(
  migrated: ReturnType<typeof migrateLegacyGear>,
  capacity: number,
): GearInventory {
  return decodeGearInventory(JSON.stringify({
    schema: GEAR_INVENTORY_SCHEMA,
    revision: 0,
    capacity,
    entries: migrated.instances.map((instance) => ({ instance, favorite: false, locked: false })),
    equipped: migrated.equipped,
    pendingRewards: [],
  }));
}

function canonicalState(value: unknown): Arc2LootStateV1 {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    throw new TypeError('Arc 2 loot state must be an object with a kind');
  }
  if (value.kind === 'inventory') {
    if (!hasExactKeys(value, ['kind', 'inventory', 'stackableCounts'])) {
      throw new TypeError('Arc 2 inventory state has unknown or missing fields');
    }
    const inventory = decodeGearInventory(JSON.stringify(value.inventory));
    const stackableCounts = canonicalStackableCounts(value.stackableCounts);
    return Object.freeze({ kind: 'inventory', inventory, stackableCounts });
  }
  if (value.kind === 'legacy-protected') {
    if (!hasExactKeys(value, [
      'kind', 'reason', 'sourceActionId', 'estimatedInstanceCount',
      'itemCounts', 'equipped', 'equippedAffixes',
    ])) throw new TypeError('Arc 2 legacy-protected state has unknown or missing fields');
    if (value.reason !== 'capacity' && value.reason !== 'extension-bytes') {
      throw new RangeError('Arc 2 legacy protection reason is unsupported');
    }
    if (value.sourceActionId !== ARC2_LOOT_LEGACY_SOURCE_ACTION_ID) {
      throw new RangeError('Arc 2 legacy migration source identity changed');
    }
    const facts = canonicalLegacyFacts({
      items: value.itemCounts as SaveStateV2['items'],
      equip: value.equipped as SaveStateV2['equip'],
      equipAff: value.equippedAffixes as SaveStateV2['equipAff'],
    });
    if (value.estimatedInstanceCount !== facts.estimatedInstanceCount) {
      throw new RangeError('Arc 2 legacy estimated instance count is not exact');
    }
    return Object.freeze({
      kind: 'legacy-protected',
      reason: value.reason,
      sourceActionId: ARC2_LOOT_LEGACY_SOURCE_ACTION_ID,
      estimatedInstanceCount: facts.estimatedInstanceCount,
      itemCounts: facts.itemCounts,
      equipped: facts.equipped,
      equippedAffixes: facts.equippedAffixes,
    });
  }
  throw new RangeError(`unknown Arc 2 loot state kind ${JSON.stringify(value.kind)}`);
}

function uncheckedCarrier(state: Arc2LootStateV1): V5ExtensionCarrier {
  return Object.freeze({ version: ARC2_LOOT_VERSION, json: JSON.stringify(state) });
}

/** Strict v1 encoder. The isolated v5 validator enforces namespace and UTF-8
 * byte bounds in addition to the product codec's exact fixed point. */
export function encodeArc2LootCarrier(value: Arc2LootStateV1): V5ExtensionCarrier {
  const state = canonicalState(value);
  const carrier = uncheckedCarrier(state);
  const checked = canonicalizeV5Extensions({
    [ARC2_LOOT_SEGMENT]: { [ARC2_LOOT_NAMESPACE]: carrier },
  })[ARC2_LOOT_SEGMENT]?.[ARC2_LOOT_NAMESPACE];
  if (!checked) throw new Error('Arc 2 loot carrier was not retained');
  return checked;
}

/** Classify only the owned namespace. Other namespaces remain opaque and are
 * neither interpreted nor normalized by this reader. */
export function readArc2Loot(extensions: V5Extensions): Arc2LootReadOutcome {
  const rawCarrier = extensions[ARC2_LOOT_SEGMENT]?.[ARC2_LOOT_NAMESPACE] as unknown;
  if (rawCarrier === undefined) return Object.freeze({ kind: 'absent' });
  let carrier: V5ExtensionCarrier;
  try {
    const isolated = canonicalizeV5Extensions({
      [ARC2_LOOT_SEGMENT]: { [ARC2_LOOT_NAMESPACE]: rawCarrier },
    });
    const checked = isolated[ARC2_LOOT_SEGMENT]?.[ARC2_LOOT_NAMESPACE];
    if (!checked) return Object.freeze({ kind: 'corrupt' });
    carrier = checked;
  } catch {
    return Object.freeze({ kind: 'corrupt' });
  }
  if (carrier.version > ARC2_LOOT_VERSION) {
    return Object.freeze({ kind: 'future-version', version: carrier.version });
  }
  if (carrier.version !== ARC2_LOOT_VERSION) return Object.freeze({ kind: 'corrupt' });
  try {
    const state = canonicalState(JSON.parse(carrier.json) as unknown);
    if (JSON.stringify(state) !== carrier.json) return Object.freeze({ kind: 'corrupt' });
    return Object.freeze({ kind: 'loaded', state });
  } catch {
    return Object.freeze({ kind: 'corrupt' });
  }
}

function canonicalBase(extensions: V5Extensions): V5Extensions | null {
  try { return canonicalizeV5Extensions(extensions); } catch { return null; }
}

function withCarrier(base: V5Extensions, carrier: V5ExtensionCarrier): V5Extensions {
  return canonicalizeV5Extensions({
    ...base,
    [ARC2_LOOT_SEGMENT]: {
      ...(base[ARC2_LOOT_SEGMENT] ?? {}),
      [ARC2_LOOT_NAMESPACE]: carrier,
    },
  });
}

function prepared(base: V5Extensions, state: Arc2LootStateV1): PreparedArc2LootWrite | null {
  try {
    const carrier = encodeArc2LootCarrier(state);
    const extensions = withCarrier(base, carrier);
    return Object.freeze({
      kind: 'prepared',
      state,
      write: Object.freeze({
        segment: ARC2_LOOT_SEGMENT,
        namespace: ARC2_LOOT_NAMESPACE,
        carrier,
      }),
      extensions,
    });
  } catch {
    return null;
  }
}

function targetProtection(read: Arc2LootReadOutcome): Arc2LootWritePreparation | null {
  if (read.kind === 'future-version') {
    return Object.freeze({ kind: 'protected', reason: 'target-future', version: read.version });
  }
  if (read.kind === 'corrupt') return Object.freeze({ kind: 'protected', reason: 'target-corrupt' });
  return null;
}

/** Seed the Arc 2 namespace from the already-sanitized legacy-v4 item fields.
 * Existing current/future/corrupt target bytes are never overwritten. */
export function prepareArc2LootLegacyMigration(input: Readonly<{
  extensions: V5Extensions;
  legacy: LegacyLootFields;
  capacity: number;
}>): Arc2LootLegacyMigrationPreparation {
  const base = canonicalBase(input.extensions);
  if (!base) return Object.freeze({ kind: 'protected', reason: 'extensions-corrupt' });
  const read = readArc2Loot(base);
  const protection = targetProtection(read);
  if (protection) return protection;
  if (read.kind === 'loaded') return Object.freeze({ kind: 'already-loaded', state: read.state });

  const capacity = checkedInteger(input.capacity, 1, MAX_GEAR_CAPACITY, 'Arc 2 caller capacity');
  let facts: CanonicalLegacyFacts;
  try {
    facts = canonicalLegacyFacts(input.legacy);
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'legacy-corrupt' });
  }

  if (facts.estimatedInstanceCount <= capacity) {
    try {
      /* This is the only path that emits an editable inventory, and it uses
         the complete current migration result—never a locally reimplemented
         or prefix-limited projection. */
      const migrated = migrateLegacyGear(migrationInput(facts));
      const state: Arc2LootInventoryV1 = Object.freeze({
        kind: 'inventory',
        inventory: inventoryFromMigration(migrated, capacity),
        stackableCounts: canonicalStackableCounts(migrated.stackableCounts),
      });
      const full = prepared(base, state);
      if (full) return full;
    } catch {
      return Object.freeze({ kind: 'protected', reason: 'legacy-corrupt' });
    }
  }

  const protectedState: Arc2LootLegacyProtectedV1 = Object.freeze({
    kind: 'legacy-protected',
    reason: facts.estimatedInstanceCount > capacity ? 'capacity' : 'extension-bytes',
    sourceActionId: ARC2_LOOT_LEGACY_SOURCE_ACTION_ID,
    estimatedInstanceCount: facts.estimatedInstanceCount,
    itemCounts: facts.itemCounts,
    equipped: facts.equipped,
    equippedAffixes: facts.equippedAffixes,
  });
  return prepared(base, protectedState)
    ?? Object.freeze({ kind: 'protected', reason: 'extension-bounds' });
}

/** Prepare one replacement for an already-editable inventory. This is the
 * direct structural input expected by F4 `extensionWrites`; it cannot create
 * a missing inventory or consume a compact protected migration. */
export function prepareArc2LootInventoryWrite(input: Readonly<{
  extensions: V5Extensions;
  inventory: GearInventory;
  stackableCounts: readonly Arc2LootStackableCountV1[];
}>): Arc2LootWritePreparation {
  const base = canonicalBase(input.extensions);
  if (!base) return Object.freeze({ kind: 'protected', reason: 'extensions-corrupt' });
  const read = readArc2Loot(base);
  const protection = targetProtection(read);
  if (protection) return protection;
  if (read.kind === 'absent') return Object.freeze({ kind: 'protected', reason: 'target-absent' });
  if (read.kind !== 'loaded') return Object.freeze({ kind: 'protected', reason: 'target-corrupt' });
  if (read.state.kind !== 'inventory') {
    return Object.freeze({ kind: 'protected', reason: 'legacy-protected' });
  }
  let state: Arc2LootInventoryV1;
  try {
    state = canonicalState({
      kind: 'inventory',
      inventory: input.inventory,
      stackableCounts: input.stackableCounts,
    }) as Arc2LootInventoryV1;
  } catch {
    return Object.freeze({ kind: 'protected', reason: 'target-corrupt' });
  }
  return prepared(base, state)
    ?? Object.freeze({ kind: 'protected', reason: 'extension-bounds' });
}
