/* Arc 2 fixed fabrication authority.

   This module translates the exact v1.8.9 ITEMS graph into inspectable pure
   plans. It owns conversion only: material occurrence, opportunity rates,
   clocks, receipt settlement, and non-legacy affix tables belong elsewhere. */
import {
  LOOT_CATALOGUE_V1,
  type CatalogueCategory,
  type CatalogueQuantityMap,
  type LootCatalogueDefinition,
} from './catalogue.js';
import type { GearGenerationPlan } from './gear.js';
import {
  UINT32_MAX,
  assertPlainRecord,
  checkedInteger,
  deepFreeze,
} from './internal.js';

export const FIXED_RECIPE_AUTHORITY = 'legacy-v1.8.9-items' as const;

export const LEGACY_MATERIAL_IDS_V1 = Object.freeze([
  'Fe', 'Si', 'Mg', 'Al', 'Ca', 'Na', 'Ni', 'Ti', 'Cu', 'Zn', 'Sn', 'Mn', 'Cr', 'Pb', 'W',
  'H', 'He', 'C', 'N', 'O', 'S', 'P', 'Cl', 'H2O', 'CH4', 'NH3', 'CO2', 'He3',
  'Ag', 'Au', 'Pt', 'Ir', 'U', 'Th', 'Li', 'Co', 'Nd', 'Pm',
  'Vg', 'Pz',
  'Pls', 'Crn', 'Pro', 'Pri', 'Voe', 'Chr', 'Dkm',
] as const);
export type LegacyMaterialId = (typeof LEGACY_MATERIAL_IDS_V1)[number];

export const LEGACY_SIGNATURE_IDS_V1 = Object.freeze([
  'stone', 'ocean', 'flame', 'sky', 'life', 'mind', 'star', 'void', 'prism',
] as const);

export type FixedRecipeOutputKind = 'stackable' | 'gear-instance' | 'permanent-system';

export interface FixedGearCraftAxes {
  readonly baseId: string;
  readonly itemLevel: number;
  readonly quality: 0;
  readonly rarityTier: number;
  readonly naturalAffixes: readonly [];
  readonly craftedModifier: null;
  readonly drawback: null;
  readonly upgrade: 0;
  readonly sockets: readonly [];
}

export interface FixedRecipePlan {
  readonly authority: typeof FIXED_RECIPE_AUTHORITY;
  readonly baseId: string;
  readonly category: CatalogueCategory;
  readonly outputKind: FixedRecipeOutputKind;
  readonly materialCost: CatalogueQuantityMap;
  readonly partCost: CatalogueQuantityMap;
  readonly stardustCost: number;
  readonly prerequisiteId: string | null;
  readonly signatureId: string | null;
  readonly gearAxes: FixedGearCraftAxes | null;
}

export interface FixedRecipeInventory {
  readonly materials: Readonly<Record<string, number>>;
  readonly itemCounts: Readonly<Record<string, number>>;
  readonly stardust: number;
  readonly signatureIds: readonly string[];
}

export interface RecipeShortfall {
  readonly id: string;
  readonly required: number;
  readonly available: number;
  readonly missing: number;
}

export interface FixedRecipeQuote {
  readonly authority: typeof FIXED_RECIPE_AUTHORITY;
  readonly baseId: string;
  readonly craftable: boolean;
  readonly alreadyBuilt: boolean;
  readonly missingMaterials: readonly RecipeShortfall[];
  readonly missingParts: readonly RecipeShortfall[];
  readonly missingStardust: number;
  readonly missingPrerequisiteId: string | null;
  readonly missingSignatureId: string | null;
}

export interface ExpandedRecipeBill {
  readonly authority: typeof FIXED_RECIPE_AUTHORITY;
  readonly baseId: string;
  readonly materials: CatalogueQuantityMap;
  readonly stardustCost: number;
}

export interface RecipeAuditDefinition {
  readonly id: string;
  readonly category: CatalogueCategory;
  readonly inventoryShape: 'stackable' | 'slotted';
  readonly materialCost: CatalogueQuantityMap;
  readonly partCost: CatalogueQuantityMap | null;
  readonly stardustCost: number | null;
  readonly prerequisiteId: string | null;
  readonly signatureId: string | null;
}

export interface FixedRecipeGraphAudit {
  readonly valid: boolean;
  readonly counts: Readonly<{
    definitions: number;
    parts: number;
    components: number;
    systems: number;
    slotted: number;
    partBearing: number;
    rawOnly: number;
    prerequisites: number;
    signatures: number;
  }>;
  readonly duplicateIds: readonly string[];
  readonly unknownMaterialIds: readonly string[];
  readonly danglingPartIds: readonly Readonly<{ baseId: string; dependencyId: string }>[];
  readonly danglingPrerequisiteIds: readonly Readonly<{ baseId: string; dependencyId: string }>[];
  readonly unknownSignatureIds: readonly Readonly<{ baseId: string; signatureId: string }>[];
  readonly cycles: readonly (readonly string[])[];
}

export interface CraftSalvageCycleAudit {
  readonly safe: boolean;
  readonly baseId: string;
  readonly recursiveMaterialCost: CatalogueQuantityMap;
  readonly salvageMaterials: CatalogueQuantityMap;
  readonly excess: readonly Readonly<{
    materialId: string;
    spent: number;
    returned: number;
    excess: number;
  }>[];
}

const MATERIAL_IDS = new Set<string>(LEGACY_MATERIAL_IDS_V1);
const SIGNATURE_IDS = new Set<string>(LEGACY_SIGNATURE_IDS_V1);
const CATALOGUE_IDS = new Set<string>(LOOT_CATALOGUE_V1.map(({ id }) => id));

function sortedQuantities(value: Readonly<Record<string, number>>, label: string): CatalogueQuantityMap {
  assertPlainRecord(value, label);
  /* Locale collation is ambient host state and cannot own a receipt or
     persistence order. Catalogue ids are canonicalized by code units. */
  const entries = Object.entries(value).sort(([left], [right]) => (
    left < right ? -1 : left > right ? 1 : 0
  ));
  const result: Record<string, number> = {};
  for (const [id, quantity] of entries) {
    if (!id) throw new RangeError(`${label} contains an empty asset id`);
    result[id] = checkedInteger(quantity, 0, Number.MAX_SAFE_INTEGER, `${label} ${id}`);
  }
  return deepFreeze(result);
}

function definitionFor(baseId: string): LootCatalogueDefinition {
  if (typeof baseId !== 'string') throw new TypeError('fixed recipe baseId must be a string');
  const definition = LOOT_CATALOGUE_V1.find((candidate) => candidate.id === baseId);
  if (!definition) throw new RangeError(`unknown fixed recipe ${baseId}`);
  return definition;
}

function outputKindOf(definition: LootCatalogueDefinition): FixedRecipeOutputKind {
  if (definition.inventoryShape === 'slotted') return 'gear-instance';
  return definition.category === 'sys' ? 'permanent-system' : 'stackable';
}

function fixedGearAxes(definition: LootCatalogueDefinition): FixedGearCraftAxes | null {
  if (definition.inventoryShape !== 'slotted') return null;
  return deepFreeze({
    baseId: definition.id,
    itemLevel: definition.tier,
    quality: 0,
    rarityTier: definition.rarityTier,
    naturalAffixes: [],
    craftedModifier: null,
    drawback: null,
    upgrade: 0,
    sockets: [],
  });
}

/** Returns the exact fixed recipe and its non-random output axes. */
export function getFixedRecipePlan(baseId: string): FixedRecipePlan {
  const definition = definitionFor(baseId);
  return deepFreeze({
    authority: FIXED_RECIPE_AUTHORITY,
    baseId: definition.id,
    category: definition.category,
    outputKind: outputKindOf(definition),
    materialCost: sortedQuantities(definition.materialCost, `${baseId} material cost`),
    partCost: sortedQuantities(definition.partCost ?? {}, `${baseId} part cost`),
    stardustCost: definition.stardustCost ?? 0,
    prerequisiteId: definition.prerequisiteId,
    signatureId: definition.signatureId,
    gearAxes: fixedGearAxes(definition),
  });
}

/** Production fixed-craft callers supply only receipt entropy; every power
 * axis is derived from the canonical base rather than caller-authored. */
export function getFixedCraftGenerationPlan(baseId: string, generationSeed: number): GearGenerationPlan {
  const recipe = getFixedRecipePlan(baseId);
  if (!recipe.gearAxes) throw new RangeError(`${baseId} does not produce an exact GearInstance`);
  return deepFreeze({
    ...recipe.gearAxes,
    generationSeed: checkedInteger(generationSeed, 0, UINT32_MAX, 'fixed craft generationSeed'),
  });
}

function checkedInventory(value: FixedRecipeInventory): FixedRecipeInventory {
  assertPlainRecord(value, 'fixed recipe inventory');
  const materials = sortedQuantities(value.materials, 'fixed recipe materials');
  const itemCounts = sortedQuantities(value.itemCounts, 'fixed recipe item counts');
  for (const id of Object.keys(materials)) {
    if (!MATERIAL_IDS.has(id)) throw new RangeError(`fixed recipe inventory has unknown material ${id}`);
  }
  for (const id of Object.keys(itemCounts)) {
    if (!CATALOGUE_IDS.has(id)) throw new RangeError(`fixed recipe inventory has unknown item ${id}`);
  }
  if (!Array.isArray(value.signatureIds)) throw new TypeError('fixed recipe signatureIds must be an array');
  const signatureIds: string[] = [];
  for (const id of value.signatureIds) {
    if (typeof id !== 'string' || !SIGNATURE_IDS.has(id)) {
      throw new RangeError(`fixed recipe inventory has unknown Signature ${String(id)}`);
    }
    if (signatureIds.includes(id)) throw new RangeError(`fixed recipe inventory repeats Signature ${id}`);
    signatureIds.push(id);
  }
  return deepFreeze({
    materials,
    itemCounts,
    stardust: checkedInteger(value.stardust, 0, Number.MAX_SAFE_INTEGER, 'fixed recipe stardust'),
    signatureIds,
  });
}

function shortfalls(cost: CatalogueQuantityMap, available: Readonly<Record<string, number>>): RecipeShortfall[] {
  return Object.entries(cost).flatMap(([id, required]) => {
    const present = available[id] ?? 0;
    return present < required ? [{ id, required, available: present, missing: required - present }] : [];
  });
}

/** Quotes immediate v1 costs. Prerequisites and Signatures are ownership
 * gates, not consumed ingredients; permanent systems remain build-once. */
export function quoteFixedRecipe(baseId: string, inventoryValue: FixedRecipeInventory): FixedRecipeQuote {
  const recipe = getFixedRecipePlan(baseId);
  const inventory = checkedInventory(inventoryValue);
  const missingMaterials = shortfalls(recipe.materialCost, inventory.materials);
  const missingParts = shortfalls(recipe.partCost, inventory.itemCounts);
  const missingStardust = Math.max(0, recipe.stardustCost - inventory.stardust);
  const missingPrerequisiteId = recipe.prerequisiteId !== null
    && (inventory.itemCounts[recipe.prerequisiteId] ?? 0) < 1
    ? recipe.prerequisiteId
    : null;
  const missingSignatureId = recipe.signatureId !== null
    && !inventory.signatureIds.includes(recipe.signatureId)
    ? recipe.signatureId
    : null;
  const alreadyBuilt = recipe.outputKind === 'permanent-system'
    && (inventory.itemCounts[recipe.baseId] ?? 0) > 0;
  return deepFreeze({
    authority: FIXED_RECIPE_AUTHORITY,
    baseId: recipe.baseId,
    craftable: !alreadyBuilt && missingMaterials.length === 0 && missingParts.length === 0
      && missingStardust === 0 && missingPrerequisiteId === null && missingSignatureId === null,
    alreadyBuilt,
    missingMaterials,
    missingParts,
    missingStardust,
    missingPrerequisiteId,
    missingSignatureId,
  });
}

/** Expands consumed parts recursively. Ownership prerequisites are excluded
 * because the legacy Fabricator never consumed them. */
export function expandFixedRecipeBill(
  baseId: string,
  definitionsValue: readonly RecipeAuditDefinition[] = LOOT_CATALOGUE_V1.map(catalogueAuditDefinition),
): ExpandedRecipeBill {
  const byId = new Map(definitionsValue.map((definition) => [definition.id, definition]));
  const visiting = new Set<string>();
  const expanded = new Map<string, { materials: Record<string, number>; stardust: number }>();
  const visit = (id: string): { materials: Record<string, number>; stardust: number } => {
    const cached = expanded.get(id);
    if (cached) return cached;
    if (visiting.has(id)) throw new RangeError(`fixed recipe graph contains a cycle through ${id}`);
    visiting.add(id);
    const recipe = byId.get(id);
    if (!recipe) throw new RangeError(`unknown fixed recipe ${id}`);
    const materials = { ...recipe.materialCost };
    let stardust = recipe.stardustCost ?? 0;
    for (const [partId, quantity] of Object.entries(recipe.partCost ?? {})) {
      const part = visit(partId);
      for (const [materialId, unitCost] of Object.entries(part.materials)) {
        materials[materialId] = (materials[materialId] ?? 0) + unitCost * quantity;
      }
      stardust += part.stardust * quantity;
    }
    visiting.delete(id);
    const result = { materials, stardust };
    expanded.set(id, result);
    return result;
  };
  const result = visit(baseId);
  return deepFreeze({
    authority: FIXED_RECIPE_AUTHORITY,
    baseId,
    materials: sortedQuantities(result.materials, `${baseId} recursive material bill`),
    stardustCost: checkedInteger(result.stardust, 0, Number.MAX_SAFE_INTEGER, `${baseId} recursive stardust bill`),
  });
}

function catalogueAuditDefinition(definition: LootCatalogueDefinition): RecipeAuditDefinition {
  return {
    id: definition.id,
    category: definition.category,
    inventoryShape: definition.inventoryShape,
    materialCost: definition.materialCost,
    partCost: definition.partCost,
    stardustCost: definition.stardustCost,
    prerequisiteId: definition.prerequisiteId,
    signatureId: definition.signatureId,
  };
}

/** Audits an injectable graph so dangling/cycle negative controls exercise the
 * production evaluator rather than a test-only approximation. */
export function auditFixedRecipeGraph(
  definitionsValue: readonly RecipeAuditDefinition[] = LOOT_CATALOGUE_V1.map(catalogueAuditDefinition),
  materialIdsValue: readonly string[] = LEGACY_MATERIAL_IDS_V1,
): FixedRecipeGraphAudit {
  if (!Array.isArray(definitionsValue) || !Array.isArray(materialIdsValue)) {
    throw new TypeError('fixed recipe audit requires definition and material arrays');
  }
  const materialIds = new Set(materialIdsValue);
  const signatureIds = new Set<string>(LEGACY_SIGNATURE_IDS_V1);
  const countsById = new Map<string, number>();
  for (const definition of definitionsValue) countsById.set(definition.id, (countsById.get(definition.id) ?? 0) + 1);
  const duplicateIds = [...countsById].filter(([, count]) => count > 1).map(([id]) => id).sort();
  const byId = new Map(definitionsValue.map((definition) => [definition.id, definition]));
  const unknownMaterialIds = new Set<string>();
  const danglingPartIds: Array<{ baseId: string; dependencyId: string }> = [];
  const danglingPrerequisiteIds: Array<{ baseId: string; dependencyId: string }> = [];
  const unknownSignatureIds: Array<{ baseId: string; signatureId: string }> = [];
  for (const definition of definitionsValue) {
    for (const materialId of Object.keys(definition.materialCost)) {
      if (!materialIds.has(materialId)) unknownMaterialIds.add(materialId);
    }
    for (const dependencyId of Object.keys(definition.partCost ?? {})) {
      if (!byId.has(dependencyId)) danglingPartIds.push({ baseId: definition.id, dependencyId });
    }
    if (definition.prerequisiteId !== null && !byId.has(definition.prerequisiteId)) {
      danglingPrerequisiteIds.push({ baseId: definition.id, dependencyId: definition.prerequisiteId });
    }
    if (definition.signatureId !== null && !signatureIds.has(definition.signatureId)) {
      unknownSignatureIds.push({ baseId: definition.id, signatureId: definition.signatureId });
    }
  }

  const colors = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const cycleKeys = new Set<string>();
  const cycles: string[][] = [];
  const visit = (id: string): void => {
    if (colors.get(id) === 2) return;
    if (colors.get(id) === 1) {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      const key = cycle.join('>');
      if (!cycleKeys.has(key)) { cycleKeys.add(key); cycles.push(cycle); }
      return;
    }
    colors.set(id, 1);
    stack.push(id);
    const definition = byId.get(id);
    if (definition) {
      const dependencies = [
        ...Object.keys(definition.partCost ?? {}),
        ...(definition.prerequisiteId === null ? [] : [definition.prerequisiteId]),
      ].filter((dependencyId) => byId.has(dependencyId));
      for (const dependencyId of dependencies) visit(dependencyId);
    }
    stack.pop();
    colors.set(id, 2);
  };
  for (const definition of definitionsValue) visit(definition.id);

  const counts = {
    definitions: definitionsValue.length,
    parts: definitionsValue.filter(({ category }) => category === 'part').length,
    components: definitionsValue.filter(({ category }) => category === 'comp').length,
    systems: definitionsValue.filter(({ category }) => category === 'sys').length,
    slotted: definitionsValue.filter(({ inventoryShape }) => inventoryShape === 'slotted').length,
    partBearing: definitionsValue.filter(({ partCost }) => partCost !== null).length,
    rawOnly: definitionsValue.filter(({ partCost }) => partCost === null).length,
    prerequisites: definitionsValue.filter(({ prerequisiteId }) => prerequisiteId !== null).length,
    signatures: definitionsValue.filter(({ signatureId }) => signatureId !== null).length,
  };
  return deepFreeze({
    valid: duplicateIds.length === 0 && unknownMaterialIds.size === 0
      && danglingPartIds.length === 0 && danglingPrerequisiteIds.length === 0
      && unknownSignatureIds.length === 0 && cycles.length === 0,
    counts,
    duplicateIds,
    unknownMaterialIds: [...unknownMaterialIds].sort(),
    danglingPartIds,
    danglingPrerequisiteIds,
    unknownSignatureIds,
    cycles,
  });
}

/** Proves a supplied salvage projection cannot return more of any raw
 * material than one recursively fabricated copy consumed. */
export function auditFixedCraftSalvageCycle(
  baseId: string,
  salvageMaterialsValue: Readonly<Record<string, number>>,
): CraftSalvageCycleAudit {
  const recipe = getFixedRecipePlan(baseId);
  if (recipe.outputKind !== 'gear-instance') throw new RangeError('craft/salvage audit requires a slotted base');
  const salvageMaterials = sortedQuantities(salvageMaterialsValue, `${baseId} salvage projection`);
  const bill = expandFixedRecipeBill(baseId).materials;
  const excess: Array<{ materialId: string; spent: number; returned: number; excess: number }> = [];
  for (const [materialId, returned] of Object.entries(salvageMaterials)) {
    if (!MATERIAL_IDS.has(materialId)) throw new RangeError(`salvage projection has unknown material ${materialId}`);
    const spent = bill[materialId] ?? 0;
    if (returned > spent) excess.push({ materialId, spent, returned, excess: returned - spent });
  }
  return deepFreeze({
    safe: excess.length === 0,
    baseId,
    recursiveMaterialCost: bill,
    salvageMaterials,
    excess,
  });
}
