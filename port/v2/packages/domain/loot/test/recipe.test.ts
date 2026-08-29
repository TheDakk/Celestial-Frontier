import { describe, expect, it } from 'vitest';
import {
  LEGACY_MATERIAL_IDS_V1,
  LOOT_CATALOGUE_V1,
  SLOTTED_GEAR_BASES_V1,
  auditFixedCraftSalvageCycle,
  auditFixedRecipeGraph,
  createGearInstance,
  EXCEPTIONAL_CRAFT_MODIFIER_DEFINITIONS_V1,
  expandFixedRecipeBill,
  getFixedCraftGenerationPlan,
  getFixedRecipePlan,
  makeGearSourceActionId,
  previewGearSalvage,
  quoteFixedRecipe,
  type RecipeAuditDefinition,
} from '@cf/domain-loot';

const auditDefinitions = (): RecipeAuditDefinition[] => LOOT_CATALOGUE_V1.map((definition) => ({
  id: definition.id,
  category: definition.category,
  inventoryShape: definition.inventoryShape,
  materialCost: structuredClone(definition.materialCost),
  partCost: structuredClone(definition.partCost),
  stardustCost: definition.stardustCost,
  prerequisiteId: definition.prerequisiteId,
  signatureId: definition.signatureId,
}));

const emptyInventory = () => ({ materials: {}, itemCounts: {}, stardust: 0, signatureIds: [] });

describe('@cf/domain-loot — fixed recipe authority', () => {
  it('proves the complete exact graph shape, references, and acyclicity', () => {
    const audit = auditFixedRecipeGraph();
    expect(audit.valid).toBe(true);
    expect(audit.counts).toEqual({
      definitions: 62,
      parts: 9,
      components: 6,
      systems: 5,
      slotted: 42,
      partBearing: 52,
      rawOnly: 10,
      prerequisites: 16,
      signatures: 9,
    });
    expect(audit).toMatchObject({
      duplicateIds: [],
      unknownMaterialIds: [],
      danglingPartIds: [],
      danglingPrerequisiteIds: [],
      unknownSignatureIds: [],
      cycles: [],
    });
    expect(LEGACY_MATERIAL_IDS_V1).toHaveLength(47);
  });

  it('fails the production graph evaluator for dangling and cyclic mutations', () => {
    const dangling = auditDefinitions().map((definition) => definition.id === 'plate'
      ? { ...definition, partCost: { missingPart: 1 } }
      : definition);
    expect(auditFixedRecipeGraph(dangling)).toMatchObject({
      valid: false,
      danglingPartIds: [{ baseId: 'plate', dependencyId: 'missingPart' }],
    });

    const cyclic = auditDefinitions().map((definition) => definition.id === 'plate'
      ? { ...definition, partCost: { wire: 1 } }
      : definition.id === 'wire'
        ? { ...definition, partCost: { plate: 1 } }
        : definition);
    const cycleAudit = auditFixedRecipeGraph(cyclic);
    expect(cycleAudit.valid).toBe(false);
    expect(cycleAudit.cycles.some((cycle) => cycle.includes('plate') && cycle.includes('wire'))).toBe(true);
    expect(() => expandFixedRecipeBill('plate', cyclic)).toThrow('cycle');
  });

  it('expands exact recursive material bills without consuming ownership gates', () => {
    expect(expandFixedRecipeBill('rig1')).toMatchObject({
      baseId: 'rig1', materials: { Al: 3, Fe: 8, H: 2, O: 2 }, stardustCost: 0,
    });
    expect(expandFixedRecipeBill('jumpdrive')).toMatchObject({
      baseId: 'jumpdrive',
      materials: { Al: 12, CH4: 2, Ca: 1, Fe: 8, H: 8, O: 2, Si: 8 },
      stardustCost: 30,
    });
    expect(expandFixedRecipeBill('array')).toMatchObject({
      baseId: 'array', materials: { Ca: 3, H: 2, O: 2, Si: 18 }, stardustCost: 60,
    });
    expect(expandFixedRecipeBill('igdrive')).toMatchObject({
      baseId: 'igdrive',
      materials: { Al: 18, CH4: 4, Ca: 1, Fe: 12, H: 16, O: 4, Pt: 2, Si: 8 },
      stardustCost: 150,
    });
    expect(expandFixedRecipeBill('autoext')).toMatchObject({
      baseId: 'autoext', materials: { Al: 6, Ca: 1, Fe: 8, H: 6, O: 6, Si: 8 }, stardustCost: 40,
    });
    expect(expandFixedRecipeBill('cscoop')).toMatchObject({
      baseId: 'cscoop',
      materials: { Al: 12, Ca: 1, Fe: 8, H: 2, O: 2, Pls: 1, Si: 2 },
      stardustCost: 40,
    });

    const quantityDrift = auditDefinitions().map((definition) => definition.id === 'plate'
      ? { ...definition, materialCost: { Fe: 5 } }
      : definition);
    expect(expandFixedRecipeBill('rig1', quantityDrift).materials).toEqual({ Al: 3, Fe: 10, H: 2, O: 2 });
    expect(expandFixedRecipeBill('rig1', quantityDrift).materials)
      .not.toEqual(expandFixedRecipeBill('rig1').materials);
  });

  it('quotes every immediate cost and non-consumed gate fail closed', () => {
    const blocked = quoteFixedRecipe('igdrive', {
      materials: { Pt: 1 },
      itemCounts: { coil: 3, fuelcell: 1, navcore: 1 },
      stardust: 149,
      signatureIds: [],
    });
    expect(blocked).toMatchObject({
      craftable: false,
      missingMaterials: [{ id: 'Pt', required: 2, available: 1, missing: 1 }],
      missingParts: [{ id: 'fuelcell', required: 2, available: 1, missing: 1 }],
      missingStardust: 1,
      missingPrerequisiteId: 'array',
      missingSignatureId: null,
      alreadyBuilt: false,
    });
    const ready = {
      materials: { Pt: 2 },
      itemCounts: { coil: 3, fuelcell: 2, navcore: 1, array: 1 },
      stardust: 150,
      signatureIds: [],
    };
    expect(quoteFixedRecipe('igdrive', ready).craftable).toBe(true);
    expect(quoteFixedRecipe('igdrive', {
      ...ready,
      itemCounts: { ...ready.itemCounts, igdrive: 1 },
    })).toMatchObject({ craftable: false, alreadyBuilt: true });

    const relic = getFixedRecipePlan('rl-star');
    expect(quoteFixedRecipe('rl-star', {
      materials: relic.materialCost,
      itemCounts: relic.partCost,
      stardust: 0,
      signatureIds: [],
    })).toMatchObject({ craftable: false, missingSignatureId: 'star' });
    expect(quoteFixedRecipe('rl-star', {
      materials: relic.materialCost,
      itemCounts: relic.partCost,
      stardust: 0,
      signatureIds: ['star'],
    }).craftable).toBe(true);
    expect(() => quoteFixedRecipe('plate', {
      ...emptyInventory(), materials: { Unobtainium: 1 },
    })).toThrow('unknown material');
  });

  it('derives every fixed crafted GearInstance axis from its canonical base', () => {
    const base = SLOTTED_GEAR_BASES_V1.find(({ id }) => id === 'cg-dark')!;
    const plan = getFixedCraftGenerationPlan(base.id, 0x1234_5678);
    expect(plan).toEqual({
      baseId: base.id,
      generationSeed: 0x1234_5678,
      itemLevel: base.tier,
      quality: 0,
      rarityTier: base.rarityTier,
      naturalAffixes: [],
      craftedModifier: null,
      drawback: null,
      upgrade: 0,
      sockets: [],
    });
    expect(Object.isFrozen(plan)).toBe(true);
    const exceptionalSource = makeGearSourceActionId({
      kind: 'craft', ownerId: 'legacy-v1.8.9-items', actionKey: `recipe:${base.id}`,
      receiptId: 'receipt:19',
    });
    const exceptional = getFixedCraftGenerationPlan(base.id, 0x1234_5678, exceptionalSource);
    const exceptionalReplay = getFixedCraftGenerationPlan(base.id, 0x1234_5678, exceptionalSource);
    const modifierDefinition = EXCEPTIONAL_CRAFT_MODIFIER_DEFINITIONS_V1.find(
      ({ id }) => id === exceptional.craftedModifier?.affixId,
    );
    expect(exceptionalReplay).toEqual(exceptional);
    expect(exceptional.craftedModifier).toBeDefined();
    expect(modifierDefinition).toBeDefined();
    expect(exceptional.craftedModifier!.value).toBeGreaterThanOrEqual(modifierDefinition!.min);
    expect(exceptional.craftedModifier!.value).toBeLessThanOrEqual(modifierDefinition!.max);
    expect(plan.craftedModifier).toBeNull();
    expect(() => getFixedCraftGenerationPlan(base.id, 1, makeGearSourceActionId({
      kind: 'craft', ownerId: 'other-authority', actionKey: `recipe:${base.id}`,
      receiptId: 'receipt:19',
    }))).toThrow('recipe authority');
    expect(() => getFixedCraftGenerationPlan('jumpdrive', 1)).toThrow('GearInstance');
    expect(() => getFixedCraftGenerationPlan('rig1', -1)).toThrow('generationSeed');
  });

  it('audits all 42 exact salvage projections and rejects a positive cycle', () => {
    const source = makeGearSourceActionId({
      kind: 'craft', ownerId: 'arc2-fixed-recipe', actionKey: 'salvage-audit', receiptId: 'fixture',
    });
    const zero: string[] = [];
    const positive: string[] = [];
    for (const [ordinal, base] of SLOTTED_GEAR_BASES_V1.entries()) {
      const instance = createGearInstance(source, ordinal, getFixedCraftGenerationPlan(base.id, ordinal));
      const salvage = previewGearSalvage(instance);
      expect(salvage).not.toHaveProperty('parts');
      expect(salvage).not.toHaveProperty('stardust');
      const projection = Object.fromEntries(salvage.materials.map(({ materialId, quantity }) => [materialId, quantity]));
      expect(auditFixedCraftSalvageCycle(base.id, projection).safe).toBe(true);
      (salvage.materials.length === 0 ? zero : positive).push(base.id);
    }
    expect(zero).toEqual([
      'rig1', 'fieldsuit', 'cryoline', 'struts', 'stabil', 'anchor', 'headlamp', 'visor',
      'voidhelm', 'earpiece', 'resonator', 'diplobeacon', 'prismpendant', 'gripgloves',
      'surgeon', 'fieldlegs', 'greaves', 'magboots', 'gravboots', 'rl-prism',
    ]);
    expect(positive).toHaveLength(22);
    expect(auditFixedCraftSalvageCycle('rig1', { Fe: 9 })).toMatchObject({
      safe: false,
      excess: [{ materialId: 'Fe', spent: 8, returned: 9, excess: 1 }],
    });
  });
});
