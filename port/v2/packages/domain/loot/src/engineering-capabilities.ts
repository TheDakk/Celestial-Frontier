/* Arc 3 engineering capability projection.

   Numeric bonuses are never caller-authored. The projector first replays the
   exact GearInventory codec, follows each equipped instanceId to its one
   canonical instance, and then folds only that instance's authored effects
   and compatible affixes. Ship systems are recognized only from positive,
   canonical stackable counts. The resulting object is frozen and privately
   registered so a structural clone cannot be used as action authority. */
import { getLootCatalogueDefinition } from './catalogue.js';
import { encodeGearInstance } from './gear.js';
import {
  isArc2EngineeringLoadout,
  type Arc2EngineeringLoadout,
} from './engineering-loadout-internal.js';
import { inspectGear } from './presentation.js';
import { deepFreeze, fnv1a32 } from './internal.js';

export const ENGINEERING_CAPABILITY_SCHEMA = 'cf-v2-engineering-capabilities/v1' as const;

export interface EngineeringCapabilitySnapshot {
  readonly schema: typeof ENGINEERING_CAPABILITY_SCHEMA;
  /** Binds the exact equipped instances, their canonical contents, the
      Inventory revision, and every positive system count observed. */
  readonly fingerprint: string;
  readonly inventoryRevision: number;
  readonly equippedInstanceIds: readonly string[];
  readonly systemIds: readonly string[];
  readonly miningYieldBonus: number;
  readonly richStrikeChanceBonus: number;
  readonly autoExtractor: boolean;
  readonly jumpDrive: boolean;
  readonly coronaScoop: boolean;
  readonly stellarSkimBonus: number;
  readonly stellarSkimGuard: boolean;
}

const CAPABILITIES = new WeakSet<object>();

function finiteEffect(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite non-negative authored effect`);
  }
  return value;
}

function fingerprint(parts: readonly string[]): string {
  const canonical = parts.join('\n');
  return `ec1:${canonical.length}:${fnv1a32(canonical).toString(16).padStart(8, '0')}`;
}

/** Derive exactly the engineering capabilities that the legacy runtime reads
 * from worn gear and built systems. Counts above one never multiply a system:
 * legacy `_equipBonus` added a built system once when itemCount(id) was > 0. */
export function projectEngineeringCapabilities(
  loadout: Arc2EngineeringLoadout,
): EngineeringCapabilitySnapshot {
  if (!isArc2EngineeringLoadout(loadout)) {
    throw new TypeError('engineering capability projection requires a registered Arc 2 loadout');
  }
  const { inventory, stackableCounts } = loadout;
  const entryById = new Map(inventory.entries.map(({ instance }) => [instance.instanceId, instance]));
  const totals = new Map<string, number>();
  const sourceParts = [`loadout:${loadout.fingerprint}`, `inventory-revision:${inventory.revision}`];

  const add = (key: string, value: number, label: string): void => {
    totals.set(key, finiteEffect((totals.get(key) ?? 0) + value, label));
  };

  for (const binding of inventory.equipped) {
    const instance = entryById.get(binding.instanceId);
    if (!instance) throw new Error(`equipped engineering instance ${binding.instanceId} is absent`);
    sourceParts.push(`equipped:${binding.slot}:${binding.instanceId}:${fnv1a32(encodeGearInstance(instance))}`);
    for (const effect of inspectGear(instance).effects) {
      add(effect.key, effect.value, `equipped ${binding.instanceId} ${effect.key}`);
    }
  }

  const systemIds: string[] = [];
  for (const row of stackableCounts) {
    const definition = getLootCatalogueDefinition(row.baseId)!;
    sourceParts.push(`stackable:${row.baseId}:${row.count}`);
    if (definition.category !== 'sys') continue;
    systemIds.push(definition.id);
    for (const [key, value] of Object.entries(definition.effects)) {
      if (typeof value === 'number') add(key, value, `system ${definition.id} ${key}`);
    }
  }

  const equippedInstanceIds = inventory.equipped.map(({ instanceId }) => instanceId);
  const hasSystem = (id: string): boolean => systemIds.includes(id);
  const capability: EngineeringCapabilitySnapshot = deepFreeze({
    schema: ENGINEERING_CAPABILITY_SCHEMA,
    fingerprint: fingerprint(sourceParts),
    inventoryRevision: inventory.revision,
    equippedInstanceIds,
    systemIds,
    miningYieldBonus: finiteEffect(totals.get('yield') ?? 0, 'mining yield bonus'),
    richStrikeChanceBonus: finiteEffect(totals.get('strike') ?? 0, 'rich-strike chance bonus'),
    autoExtractor: hasSystem('autoext'),
    jumpDrive: hasSystem('jumpdrive'),
    coronaScoop: hasSystem('cscoop'),
    stellarSkimBonus: finiteEffect(totals.get('skim') ?? 0, 'stellar skim bonus'),
    stellarSkimGuard: (totals.get('skimguard') ?? 0) > 0,
  });
  CAPABILITIES.add(capability);
  return capability;
}

export function isEngineeringCapabilitySnapshot(value: unknown): value is EngineeringCapabilitySnapshot {
  return typeof value === 'object'
    && value !== null
    && CAPABILITIES.has(value)
    && (value as EngineeringCapabilitySnapshot).schema === ENGINEERING_CAPABILITY_SCHEMA;
}
