/* Internal Arc 2 -> Arc 3 authority seam.

   Only the persistence bridge may turn a freshly decoded `arc2.loot`
   inventory carrier into an engineering loadout.  The ordinary package root
   deliberately does not export `registerArc2EngineeringLoadout`: app code
   can inspect a registered source, but cannot mint one from loose inventory
   and count arguments. */
import { LOOT_CATALOGUE_V1, getLootCatalogueDefinition } from './catalogue.js';
import { MAX_LEGACY_ITEM_COUNT } from './gear.js';
import {
  decodeGearInventory,
  encodeGearInventory,
  type GearInventory,
} from './inventory.js';
import { checkedInteger, deepFreeze, fnv1a32 } from './internal.js';

export const ENGINEERING_LOADOUT_SCHEMA = 'cf-v2-engineering-loadout/v1' as const;

export interface EngineeringStackableCount {
  readonly baseId: string;
  readonly count: number;
}

export interface Arc2EngineeringLoadout {
  readonly schema: typeof ENGINEERING_LOADOUT_SCHEMA;
  /** Binds the complete freshly decoded Arc 2 source carrier. */
  readonly fingerprint: string;
  readonly inventory: GearInventory;
  readonly stackableCounts: readonly EngineeringStackableCount[];
}

const LOADOUTS = new WeakSet<object>();
const CATALOGUE_ORDER = new Map(LOOT_CATALOGUE_V1.map(({ id }, index) => [id, index]));

function canonicalStackableCounts(
  value: readonly EngineeringStackableCount[],
): readonly EngineeringStackableCount[] {
  if (!Array.isArray(value) || value.length > LOOT_CATALOGUE_V1.length) {
    throw new RangeError('engineering stackable counts exceed the canonical catalogue');
  }
  const seen = new Set<string>();
  const rows = value.map((candidate, index): EngineeringStackableCount => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)
      || Object.keys(candidate).length !== 2
      || !Object.prototype.hasOwnProperty.call(candidate, 'baseId')
      || !Object.prototype.hasOwnProperty.call(candidate, 'count')
      || typeof candidate.baseId !== 'string') {
      throw new TypeError(`engineering stackable count ${index} is malformed`);
    }
    const definition = getLootCatalogueDefinition(candidate.baseId);
    if (!definition || definition.inventoryShape !== 'stackable') {
      throw new RangeError(`engineering stackable count ${index} is not a canonical stackable`);
    }
    if (seen.has(definition.id)) {
      throw new RangeError(`engineering stackable counts repeat ${definition.id}`);
    }
    seen.add(definition.id);
    return Object.freeze({
      baseId: definition.id,
      count: checkedInteger(
        candidate.count,
        1,
        MAX_LEGACY_ITEM_COUNT,
        `engineering ${definition.id} stack count`,
      ),
    });
  });
  rows.sort((left, right) => CATALOGUE_ORDER.get(left.baseId)! - CATALOGUE_ORDER.get(right.baseId)!);
  return Object.freeze(rows);
}

function fingerprint(inventoryJson: string, counts: readonly EngineeringStackableCount[]): string {
  const canonical = `${inventoryJson}\n${JSON.stringify(counts)}`;
  return `el1:${canonical.length}:${fnv1a32(canonical).toString(16).padStart(8, '0')}`;
}

/** Persistence-only registration after its strict carrier reader has
 * classified the source as a current editable Arc 2 inventory. */
export function registerArc2EngineeringLoadout(
  inventoryValue: GearInventory,
  stackableCountsValue: readonly EngineeringStackableCount[],
): Arc2EngineeringLoadout {
  const inventoryJson = encodeGearInventory(inventoryValue);
  const inventory = decodeGearInventory(inventoryJson);
  const stackableCounts = canonicalStackableCounts(stackableCountsValue);
  const loadout: Arc2EngineeringLoadout = deepFreeze({
    schema: ENGINEERING_LOADOUT_SCHEMA,
    fingerprint: fingerprint(inventoryJson, stackableCounts),
    inventory,
    stackableCounts,
  });
  LOADOUTS.add(loadout);
  return loadout;
}

export function isArc2EngineeringLoadout(value: unknown): value is Arc2EngineeringLoadout {
  return typeof value === 'object'
    && value !== null
    && LOADOUTS.has(value)
    && (value as Arc2EngineeringLoadout).schema === ENGINEERING_LOADOUT_SCHEMA;
}
