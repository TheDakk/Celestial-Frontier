/* Arc 2 inspect/compare/filter read models.

   These helpers never collapse gear into a synthetic score. A comparison
   exposes every changed construction field and effect so the UI can explain
   the trade instead of presenting an unexplained green arrow. */
import { GEAR_RARITIES, GEAR_SLOTS, type GearRarity, type GearSlot } from './catalogue.js';
import { LEGACY_AFFIX_DEFINITIONS, type GearInstance } from './gear.js';
import type { GearInventory, GearInventoryEntry } from './inventory.js';
import { deepFreeze } from './internal.js';

export interface GearEffectReadModel {
  readonly key: string;
  readonly value: number;
  readonly source: 'base' | 'legacy' | 'prefix' | 'suffix';
  readonly percent: boolean;
  readonly label: string;
}

export interface GearInspection {
  readonly instanceId: string;
  readonly baseId: string;
  readonly baseName: string;
  readonly slot: GearSlot;
  readonly baseTier: number;
  readonly itemLevel: number;
  readonly quality: number;
  readonly rarityTier: number;
  readonly rarity: GearRarity;
  readonly tags: readonly string[];
  readonly implicits: readonly string[];
  readonly naturalAffixes: GearInstance['naturalAffixes'];
  readonly craftedModifier: GearInstance['craftedModifier'];
  readonly drawback: GearInstance['drawback'];
  readonly upgrade: number;
  readonly sockets: readonly string[];
  readonly generation: GearInstance['generation'];
  readonly effects: readonly GearEffectReadModel[];
  readonly provenance: GearInstance['provenance'];
}

export interface GearComparisonRow {
  readonly key: string;
  readonly equipped: number;
  readonly candidate: number;
  readonly delta: number;
}

export interface GearComparison {
  readonly compatibleSlot: boolean;
  readonly equippedInstanceId: string | null;
  readonly candidateInstanceId: string;
  readonly itemLevelDelta: number;
  readonly qualityDelta: number;
  readonly effects: readonly GearComparisonRow[];
}

export interface GearInventoryFilter {
  readonly slots?: readonly GearSlot[];
  readonly rarities?: readonly GearRarity[];
  readonly tags?: readonly string[];
  readonly protectedOnly?: boolean;
  readonly equippedOnly?: boolean;
  readonly query?: string;
}

const checkedEnumFilter = <T extends string>(
  values: readonly T[] | undefined,
  supported: readonly T[],
  label: string,
): ReadonlySet<T> | null => {
  if (values === undefined) return null;
  if (!Array.isArray(values) || values.some((value) => !supported.includes(value))) {
    throw new RangeError(`${label} filter contains an unsupported value`);
  }
  return new Set(values);
};

const PERCENT_EFFECTS = new Set(['yield', 'strike', 'scut', 'heal', 'speed']);

const affixDefinition = (affixId: string) => LEGACY_AFFIX_DEFINITIONS.find(
  (candidate) => candidate.key === affixId,
);

const effectRows = (instance: GearInstance): readonly GearEffectReadModel[] => {
  const base: GearEffectReadModel[] = [];
  for (const [key, value] of Object.entries(instance.baseEffects)) {
    if (typeof value === 'number') {
      base.push({ key, value, source: 'base', percent: PERCENT_EFFECTS.has(key), label: key });
    } else if (key === 'landfam' && value && typeof value === 'object') {
      for (const [family, amount] of Object.entries(value)) {
        if (typeof amount === 'number') base.push({
          key: `landfam.${family}`, value: amount, source: 'base', percent: false, label: `landing on ${family}`,
        });
      }
    }
  }
  return deepFreeze([
    ...base,
    ...instance.naturalAffixes.map((affix) => {
      const definition = affixDefinition(affix.affixId)!;
      return {
      key: affix.affixId,
      value: affix.value,
      source: affix.role,
      percent: definition.percent,
      label: definition.label,
    };
    }),
    ...(instance.legacyAffix ? (() => {
      const definition = affixDefinition(instance.legacyAffix.affixId)!;
      return [{
      key: instance.legacyAffix.affixId,
      value: instance.legacyAffix.value,
      source: 'legacy' as const,
      percent: definition.percent,
      label: definition.label,
    }];
    })() : []),
  ]);
};

export function inspectGear(instance: GearInstance): GearInspection {
  return deepFreeze({
    instanceId: instance.instanceId,
    baseId: instance.baseId,
    baseName: instance.baseName,
    slot: instance.slot,
    baseTier: instance.baseTier,
    itemLevel: instance.itemLevel,
    quality: instance.quality,
    rarityTier: instance.rarityTier,
    rarity: instance.rarity,
    tags: [...instance.tags],
    implicits: [...instance.implicits],
    naturalAffixes: [...instance.naturalAffixes],
    craftedModifier: instance.craftedModifier ? { ...instance.craftedModifier } : undefined,
    drawback: instance.drawback ? { ...instance.drawback } : undefined,
    upgrade: instance.upgrade,
    sockets: [...instance.sockets],
    generation: { ...instance.generation },
    effects: [...effectRows(instance)],
    provenance: { ...instance.provenance },
  });
}

function summedEffects(instance: GearInstance | null): Map<string, number> {
  const values = new Map<string, number>();
  if (!instance) return values;
  for (const effect of effectRows(instance)) {
    values.set(effect.key, (values.get(effect.key) ?? 0) + effect.value);
  }
  return values;
}

export function compareGear(
  candidate: GearInstance,
  equipped: GearInstance | null,
): GearComparison {
  const before = summedEffects(equipped);
  const after = summedEffects(candidate);
  const keys = [...new Set([...before.keys(), ...after.keys()])].sort();
  return deepFreeze({
    compatibleSlot: equipped === null || equipped.slot === candidate.slot,
    equippedInstanceId: equipped?.instanceId ?? null,
    candidateInstanceId: candidate.instanceId,
    itemLevelDelta: candidate.itemLevel - (equipped?.itemLevel ?? 0),
    qualityDelta: candidate.quality - (equipped?.quality ?? 0),
    effects: keys.map((key) => {
      const equippedValue = before.get(key) ?? 0;
      const candidateValue = after.get(key) ?? 0;
      return {
        key,
        equipped: equippedValue,
        candidate: candidateValue,
        delta: candidateValue - equippedValue,
      };
    }),
  });
}

export function filterGearEntries(
  inventory: GearInventory,
  filter: GearInventoryFilter,
): readonly GearInventoryEntry[] {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    throw new TypeError('gear inventory filter must be an object');
  }
  const slots = checkedEnumFilter(filter.slots, GEAR_SLOTS, 'slot');
  const rarities = checkedEnumFilter(filter.rarities, GEAR_RARITIES, 'rarity');
  const tags = filter.tags === undefined ? null : (() => {
    if (!Array.isArray(filter.tags)
      || filter.tags.some((tag) => typeof tag !== 'string' || tag.length < 1 || tag.length > 48)) {
      throw new RangeError('tag filter contains an unsupported value');
    }
    return new Set(filter.tags);
  })();
  if (filter.protectedOnly !== undefined && typeof filter.protectedOnly !== 'boolean') {
    throw new TypeError('protectedOnly filter must be boolean');
  }
  if (filter.equippedOnly !== undefined && typeof filter.equippedOnly !== 'boolean') {
    throw new TypeError('equippedOnly filter must be boolean');
  }
  if (filter.query !== undefined && typeof filter.query !== 'string') {
    throw new TypeError('gear query must be a string');
  }
  const query = filter.query?.trim().toLocaleLowerCase('en-US') ?? '';
  const equippedIds = new Set(inventory.equipped.map((binding) => binding.instanceId));
  return deepFreeze(inventory.entries.filter((entry) => {
    const instance = entry.instance;
    if (slots && !slots.has(instance.slot)) return false;
    if (rarities && !rarities.has(instance.rarity)) return false;
    if (tags && [...tags].some((tag) => !instance.tags.includes(tag))) return false;
    if (filter.protectedOnly && !(entry.favorite || entry.locked || equippedIds.has(instance.instanceId))) return false;
    if (filter.equippedOnly && !equippedIds.has(instance.instanceId)) return false;
    if (query) {
      const searchable = [instance.baseId, instance.baseName, instance.slot, instance.rarity,
        ...instance.tags,
        ...instance.naturalAffixes.map((affix) => affixDefinition(affix.affixId)?.label ?? affix.affixId),
        ...(instance.legacyAffix
          ? [affixDefinition(instance.legacyAffix.affixId)?.label ?? instance.legacyAffix.affixId]
          : [])]
        .join('\n').toLocaleLowerCase('en-US');
      if (!searchable.includes(query)) return false;
    }
    return true;
  }));
}

/** Stable build vocabulary derived only from equipped exact instances. */
export function equippedBuildTags(inventory: GearInventory): readonly string[] {
  const byId = new Map(inventory.entries.map((entry) => [entry.instance.instanceId, entry.instance]));
  return deepFreeze([...new Set(inventory.equipped.flatMap((binding) =>
    byId.get(binding.instanceId)?.tags ?? []))].sort());
}
