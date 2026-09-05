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
export const ACQUISITION_CAPABILITY_SCHEMA = 'cf-v2-acquisition-capabilities/v1' as const;

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
  /** Raw legacy `_equipBonus('heal')` multiplier from worn gear. */
  readonly explorerMealHealBonus: number;
  /** Legacy `_equipBonus('scut')`, capped before hostile-bioscan damage. */
  readonly bioscanDamageReduction: number;
  /** Raw legacy `_equipBonus('speed')` value added to the research drive multiplier. */
  readonly travelSpeedBonus: number;
}

/** Capture/contact authority derived from the same persistence-issued Arc 2
 * loadout as engineering. Contact is stored as whole legacy points: the
 * acquisition planner owns the later `points * .015` probability rule. */
export interface AcquisitionCapabilitySnapshot {
  readonly schema: typeof ACQUISITION_CAPABILITY_SCHEMA;
  readonly fingerprint: string;
  readonly inventoryRevision: number;
  readonly equippedInstanceIds: readonly string[];
  readonly contactCaptureBonus: number;
}

const CAPABILITIES = new WeakSet<object>();
const ACQUISITION_CAPABILITIES = new WeakSet<object>();

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

interface FoldedLoadoutEffects {
  readonly inventoryRevision: number;
  readonly equippedInstanceIds: readonly string[];
  readonly systemIds: readonly string[];
  readonly totals: ReadonlyMap<string, number>;
  readonly sourceParts: readonly string[];
}

function foldLoadoutEffects(loadout: Arc2EngineeringLoadout): FoldedLoadoutEffects {
  if (!isArc2EngineeringLoadout(loadout)) {
    throw new TypeError('capability projection requires a registered Arc 2 loadout');
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
    if (!instance) throw new Error(`equipped capability instance ${binding.instanceId} is absent`);
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

  return Object.freeze({
    inventoryRevision: inventory.revision,
    equippedInstanceIds: Object.freeze(inventory.equipped.map(({ instanceId }) => instanceId)),
    systemIds: Object.freeze(systemIds),
    totals,
    sourceParts: Object.freeze(sourceParts),
  });
}

/** Derive exactly the engineering capabilities that the legacy runtime reads
 * from worn gear and built systems. Counts above one never multiply a system:
 * legacy `_equipBonus` added a built system once when itemCount(id) was > 0. */
export function projectEngineeringCapabilities(
  loadout: Arc2EngineeringLoadout,
): EngineeringCapabilitySnapshot {
  const folded = foldLoadoutEffects(loadout);
  const { totals, systemIds, sourceParts, equippedInstanceIds, inventoryRevision } = folded;
  const hasSystem = (id: string): boolean => systemIds.includes(id);
  const capability: EngineeringCapabilitySnapshot = deepFreeze({
    schema: ENGINEERING_CAPABILITY_SCHEMA,
    fingerprint: fingerprint(sourceParts),
    inventoryRevision,
    equippedInstanceIds,
    systemIds,
    miningYieldBonus: finiteEffect(totals.get('yield') ?? 0, 'mining yield bonus'),
    richStrikeChanceBonus: finiteEffect(totals.get('strike') ?? 0, 'rich-strike chance bonus'),
    autoExtractor: hasSystem('autoext'),
    jumpDrive: hasSystem('jumpdrive'),
    coronaScoop: hasSystem('cscoop'),
    stellarSkimBonus: finiteEffect(totals.get('skim') ?? 0, 'stellar skim bonus'),
    stellarSkimGuard: (totals.get('skimguard') ?? 0) > 0,
    explorerMealHealBonus: finiteEffect(
      totals.get('heal') ?? 0,
      'explorer meal healing bonus',
    ),
    bioscanDamageReduction: Math.min(
      0.7,
      finiteEffect(totals.get('scut') ?? 0, 'bioscan damage reduction'),
    ),
    travelSpeedBonus: finiteEffect(totals.get('speed') ?? 0, 'travel speed bonus'),
  });
  CAPABILITIES.add(capability);
  return capability;
}

/** Derive capture contact points from exact equipped instances. Unworn gear,
 * caller-authored numbers and structural loadout clones are never authority. */
export function projectAcquisitionCapabilities(
  loadout: Arc2EngineeringLoadout,
): AcquisitionCapabilitySnapshot {
  const folded = foldLoadoutEffects(loadout);
  const capability: AcquisitionCapabilitySnapshot = deepFreeze({
    schema: ACQUISITION_CAPABILITY_SCHEMA,
    fingerprint: fingerprint([
      ...folded.sourceParts,
      `contact:${finiteEffect(folded.totals.get('contact') ?? 0, 'contact capture bonus')}`,
    ]).replace(/^ec1:/u, 'ac1:'),
    inventoryRevision: folded.inventoryRevision,
    equippedInstanceIds: folded.equippedInstanceIds,
    contactCaptureBonus: finiteEffect(
      folded.totals.get('contact') ?? 0,
      'contact capture bonus',
    ),
  });
  ACQUISITION_CAPABILITIES.add(capability);
  return capability;
}

export function isEngineeringCapabilitySnapshot(value: unknown): value is EngineeringCapabilitySnapshot {
  return typeof value === 'object'
    && value !== null
    && CAPABILITIES.has(value)
    && (value as EngineeringCapabilitySnapshot).schema === ENGINEERING_CAPABILITY_SCHEMA;
}

export function isAcquisitionCapabilitySnapshot(
  value: unknown,
): value is AcquisitionCapabilitySnapshot {
  return typeof value === 'object'
    && value !== null
    && ACQUISITION_CAPABILITIES.has(value)
    && (value as AcquisitionCapabilitySnapshot).schema === ACQUISITION_CAPABILITY_SCHEMA;
}
