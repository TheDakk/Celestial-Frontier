/* Arc 3 Engineering presentation projection.

   This owner turns already-proven Arc 2/Arc 3/navigation authority into a
   detached read model. It cannot authorize an action: every durable press is
   re-derived from freshly read carriers inside F4. */
import {
  ENGINEERING_RESEARCH_CATALOGUE,
  isEngineeringRevisionExhausted,
  projectStarOpportunity,
  projectWorldMineralReveal,
  projectWorldOpportunity,
  type EngineeringStateV2,
} from '@cf/domain-opportunity';
import {
  LOOT_CATALOGUE_V1,
  MAX_LEGACY_ITEM_COUNT,
  MAX_PENDING_GEAR_REWARDS,
  getFixedRecipePlan,
  projectEngineeringCapabilities,
  quoteFixedRecipe,
  type Arc2EngineeringLoadout,
  type LootCatalogueDefinition,
} from '@cf/domain-loot';
import {
  AUTO_EXTRACTOR_CADENCE_MS,
  AUTO_EXTRACTOR_MAX_LOADS,
  settleRecurringAccrual,
} from '@cf/domain-progression';
import {
  canonicalCF1StarAddressFromNav,
  canonicalCF1WorldAddressFromNav,
  type CanonicalCF1WorldAddress,
  type NavState,
  type ShipVisualState,
} from '@cf/scene';
import {
  ENGINEERING_PANEL_READ_MODEL_SCHEMA,
  ENGINEERING_RESEARCH_ORDER,
  type EngineeringFabricationGroupReadModel,
  type EngineeringFabricationRowReadModel,
  type EngineeringPanelCosts,
  type EngineeringPanelReadModelV1,
  type EngineeringResearchRowReadModel,
  type EngineeringRowStatus,
} from './engineering-panel.js';

export interface EngineeringPanelEconomySnapshot {
  readonly cargo: readonly (readonly [string, number])[];
  readonly exceptionalCargo: readonly (readonly [string, number])[];
  readonly stardust: number;
  readonly signatureIds: readonly string[];
  readonly hp: number;
}

export interface EngineeringPanelProjectionInput {
  readonly ship: ShipVisualState;
  readonly nav: NavState;
  readonly engineering: EngineeringStateV2;
  readonly loadout: Arc2EngineeringLoadout;
  readonly economy: EngineeringPanelEconomySnapshot;
  readonly activePlayMs: number;
}

const MATERIAL_NAMES: Readonly<Record<string, string>> = Object.freeze({
  Fe: 'Iron', Si: 'Silicon', Mg: 'Magnesium', Al: 'Aluminium', Ca: 'Calcium', Na: 'Sodium',
  Ni: 'Nickel', Ti: 'Titanium', Cu: 'Copper', Zn: 'Zinc', Sn: 'Tin', Mn: 'Manganese',
  Cr: 'Chromium', Pb: 'Lead', W: 'Tungsten', H: 'Hydrogen', He: 'Helium', C: 'Carbon',
  N: 'Nitrogen', O: 'Oxygen', S: 'Sulfur', P: 'Phosphorus', Cl: 'Chlorine', H2O: 'Water Ice',
  CH4: 'Methane Ice', NH3: 'Ammonia Ice', CO2: 'Dry Ice', He3: 'Helium-3', Ag: 'Silver',
  Au: 'Gold', Pt: 'Platinum', Ir: 'Iridium', U: 'Uranium', Th: 'Thorium', Li: 'Lithium',
  Co: 'Cobalt', Nd: 'Neodymium', Pm: 'Promethium', Vg: 'Voidglass', Pz: 'Prismatium',
  Pls: 'Stellar Plasma', Crn: 'Coronium', Pro: 'Protomatter', Pri: 'Primordial Ice',
  Voe: 'Void Essence', Chr: 'Chronal Shard', Dkm: 'Dark Matter',
});

const CATEGORY_ORDER = Object.freeze(['part', 'comp', 'sys', 'gear', 'relic'] as const);
const CATEGORY_NAMES: Readonly<Record<(typeof CATEGORY_ORDER)[number], string>> = Object.freeze({
  part: 'Basic parts', comp: 'Components', sys: 'Ship systems', gear: 'Explorer gear', relic: 'Signature relics',
});
const SIGNATURE_NAMES: Readonly<Record<string, string>> = Object.freeze({
  stone: 'Stone', ocean: 'Ocean', flame: 'Flame', sky: 'Sky', life: 'Life',
  mind: 'Mind', star: 'Star', void: 'Void', prism: 'Prism',
});
const LIVE_GEAR_EFFECTS = new Set([
  'yield', 'strike', 'skim', 'skimguard', 'contact', 'scut', 'heal', 'speed',
  'land', 'landfam', 'land100', 'struts',
]);
const MAX_GEAR_INVENTORY_REVISION = 0xffff_ffff;
const EFFECT_NAMES: Readonly<Record<string, string>> = Object.freeze({
  yield: 'mining yield', strike: 'rich-strike chance', skim: 'stellar skim yield',
  skimguard: 'remnant-star shielding', auto: 'Auto-Extractor accrual', contact: 'capture chance',
  scut: 'bioscan protection', land: 'landing safety', landfam: 'biome landing safety',
  land100: 'guaranteed landing', struts: 'landing protection', heal: 'flora healing', speed: 'travel speed',
});
const DEFINITION_BY_ID = new Map(LOOT_CATALOGUE_V1.map((definition) => [definition.id, definition]));

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function quantityMap(rows: readonly (readonly [string, number])[], label: string): Map<string, number> {
  const result = new Map<string, number>();
  for (const [id, count] of rows) {
    if (typeof id !== 'string' || id.length === 0 || result.has(id)
      || !Number.isSafeInteger(count) || count < 0 || count > 1_000_000_000) {
      throw new RangeError(`${label} is not a canonical quantity list`);
    }
    result.set(id, count);
  }
  return result;
}

function labelFor(id: string): string {
  return MATERIAL_NAMES[id] ?? DEFINITION_BY_ID.get(id)?.name ?? id;
}

export interface OrbitalMineralSurveyRow {
  readonly key: 'Mineral veins';
  readonly value: string;
}

/** Presentation-only Deep Scanner consumer. The opportunity/reveal projectors
 * retain provenance and disclosure authority; this adapter only labels the
 * exact orbit-safe ordinary + biome facts and can never authorize mining. */
export function projectOrbitalMineralSurveyRow(input: Readonly<{
  engineering: EngineeringStateV2;
  nav: NavState;
  address: CanonicalCF1WorldAddress;
}>): OrbitalMineralSurveyRow | null {
  if (input.nav.mode !== 'system') return null;
  try {
    const opportunity = projectWorldOpportunity(input.address);
    const reveal = projectWorldMineralReveal({
      state: input.engineering,
      opportunity,
      currentNav: input.nav,
    });
    if (reveal.status !== 'projected'
      || reveal.revealLevel !== 'orbit'
      || reveal.deepScannersOwned !== true
      || reveal.authorizesMining !== false
      || reveal.ordinaryDeposits === null
      || reveal.cosmicVein !== null
      || reveal.exceptionalVein !== null
      || reveal.resolvedGrades !== null
      || reveal.reservePulls !== null
      || reveal.extractionsTaken !== null
      || reveal.pullsRemaining !== null) return null;
    const labels = reveal.ordinaryDeposits.map(labelFor);
    if (reveal.biomeVein !== null) labels.push(`${labelFor(reveal.biomeVein)} ✦`);
    if (labels.length === 0) return null;
    return deepFreeze({ key: 'Mineral veins', value: labels.join(' · ') });
  } catch {
    return null;
  }
}

function costRows(
  cost: Readonly<Record<string, number>>,
  owned: ReadonlyMap<string, number>,
): readonly Readonly<{ id: string; label: string; required: number; owned: number }>[] {
  return Object.freeze(Object.entries(cost).map(([id, required]) => Object.freeze({
    id, label: labelFor(id), required, owned: owned.get(id) ?? 0,
  })));
}

function costs(
  materialCost: Readonly<Record<string, number>>,
  partCost: Readonly<Record<string, number>>,
  stardustCost: number,
  materialOwned: ReadonlyMap<string, number>,
  itemOwned: ReadonlyMap<string, number>,
  stardustOwned: number,
  signatureId: string | null,
  signatureIds: ReadonlySet<string>,
  prerequisiteId: string | null,
  prerequisiteLabel: string | null = null,
): EngineeringPanelCosts {
  return deepFreeze({
    materials: costRows(materialCost, materialOwned),
    parts: costRows(partCost, itemOwned),
    stardust: { required: stardustCost, owned: stardustOwned },
    signature: signatureId === null ? null : {
      id: signatureId, label: `${SIGNATURE_NAMES[signatureId] ?? signatureId} Signature`, owned: signatureIds.has(signatureId),
    },
    prerequisite: prerequisiteId === null ? null : {
      id: prerequisiteId,
      label: prerequisiteLabel ?? labelFor(prerequisiteId),
      owned: (itemOwned.get(prerequisiteId) ?? 0) > 0,
    },
  });
}

function itemCounts(loadout: Arc2EngineeringLoadout): Map<string, number> {
  const result = new Map(loadout.stackableCounts.map(({ baseId, count }) => [baseId, count]));
  for (const { instance } of loadout.inventory.entries) {
    result.set(instance.baseId, (result.get(instance.baseId) ?? 0) + 1);
  }
  for (const { instance } of loadout.inventory.pendingRewards) {
    result.set(instance.baseId, (result.get(instance.baseId) ?? 0) + 1);
  }
  return result;
}

function missingCostReasons(
  quote: ReturnType<typeof quoteFixedRecipe>,
): string[] {
  const reasons: string[] = [];
  if (quote.missingPrerequisiteId !== null) {
    reasons.push(`Requires ${labelFor(quote.missingPrerequisiteId)}.`);
  }
  if (quote.missingSignatureId !== null) {
    reasons.push(`Requires the ${labelFor(quote.missingSignatureId)} Signature.`);
  }
  for (const row of quote.missingMaterials) reasons.push(`Missing ${row.missing} ${labelFor(row.id)}.`);
  for (const row of quote.missingParts) reasons.push(`Missing ${row.missing} ${labelFor(row.id)}.`);
  if (quote.missingStardust > 0) reasons.push(`Missing ${quote.missingStardust} Stardust.`);
  return reasons;
}

function recipeEffect(definition: LootCatalogueDefinition): Readonly<{
  support: 'live' | 'unavailable'; detail: string;
}> {
  if (definition.category === 'part' || definition.category === 'comp') {
    return Object.freeze({ support: 'live', detail: 'Consumed by fixed Fabricator recipes.' });
  }
  if (definition.category === 'sys') {
    return Object.freeze({ support: 'live', detail: 'This permanent ship system has a live expedition consumer.' });
  }
  const keys = Object.keys(definition.effects);
  const live = keys.filter((key) => LIVE_GEAR_EFFECTS.has(key));
  const dormant = keys.filter((key) => !LIVE_GEAR_EFFECTS.has(key));
  const names = (values: readonly string[]): string => values.map((key) => EFFECT_NAMES[key] ?? key).join(', ');
  if (live.length === 0) {
    return Object.freeze({
      support: 'unavailable',
      detail: dormant.length === 0
        ? 'This output has no connected gameplay effect.'
        : `Unavailable effects: ${names(dormant)}.`,
    });
  }
  return Object.freeze({
    support: 'live',
    detail: dormant.length === 0
      ? `Live effects: ${names(live)}.`
      : `Live effects: ${names(live)}. Unavailable effects: ${names(dormant)}.`,
  });
}

function productionFabricationGroups(
  loadout: Arc2EngineeringLoadout,
  economy: EngineeringPanelEconomySnapshot,
  engineeringRevisionExhausted: boolean,
): readonly EngineeringFabricationGroupReadModel[] {
  const materials = quantityMap(economy.cargo, 'engineering cargo');
  quantityMap(economy.exceptionalCargo, 'engineering exceptional cargo');
  const owned = itemCounts(loadout);
  const signatures = new Set(economy.signatureIds);
  const inventory = {
    materials: Object.fromEntries(materials),
    itemCounts: Object.fromEntries(owned),
    stardust: economy.stardust,
    signatureIds: [...signatures],
  };
  const gearCapacityRemaining = Math.max(0, loadout.inventory.capacity - loadout.inventory.entries.length)
    + Math.max(0, MAX_PENDING_GEAR_REWARDS - loadout.inventory.pendingRewards.length);

  return Object.freeze(CATEGORY_ORDER.map((category) => {
    const recipes: EngineeringFabricationRowReadModel[] = LOOT_CATALOGUE_V1
      .filter((definition) => definition.category === category)
      .map((definition) => {
        const plan = getFixedRecipePlan(definition.id);
        const quote = quoteFixedRecipe(definition.id, inventory);
        const effect = recipeEffect(definition);
        const current = owned.get(definition.id) ?? 0;
        const capacityRemaining = plan.outputKind === 'stackable'
          ? Math.max(0, MAX_LEGACY_ITEM_COUNT - current)
          : plan.outputKind === 'permanent-system'
            ? current > 0 ? 0 : 1
            : gearCapacityRemaining;
        const autoEquips = plan.outputKind === 'gear-instance'
          && loadout.inventory.entries.length < loadout.inventory.capacity
          && definition.slot !== null
          && !loadout.inventory.equipped.some(({ slot }) => slot === definition.slot);
        const requiredInventoryRevisions = autoEquips ? 2 : 1;
        const inventoryRevisionExhausted = loadout.inventory.revision
          > MAX_GEAR_INVENTORY_REVISION - requiredInventoryRevisions;
        let status: EngineeringRowStatus = 'available';
        let reason: string | null = null;
        if (quote.alreadyBuilt) {
          status = 'owned'; reason = 'Permanent system already built.';
        } else if (effect.support === 'unavailable') {
          status = 'unavailable'; reason = 'Gameplay effect is not connected.';
        } else if (engineeringRevisionExhausted) {
          status = 'unavailable'; reason = 'Engineering record revision is exhausted.';
        } else if (inventoryRevisionExhausted) {
          status = 'unavailable'; reason = 'Inventory record revision is exhausted.';
        } else if (capacityRemaining < 1) {
          status = 'unavailable'; reason = 'Output capacity is full.';
        } else if (!quote.craftable) {
          status = 'unavailable'; reason = missingCostReasons(quote).join(' ') || 'Recipe requirements are not met.';
        }
        return deepFreeze({
          baseId: definition.id,
          name: definition.name,
          category: definition.category,
          status,
          reason,
          costs: costs(
            plan.materialCost, plan.partCost, plan.stardustCost,
            materials, owned, economy.stardust,
            plan.signatureId, signatures, plan.prerequisiteId,
          ),
          effectSupport: effect.support,
          effectDetail: effect.detail,
          outputKind: plan.outputKind,
          owned: current,
          outputQuantity: 1,
          capacityRemaining,
        });
      });
    return deepFreeze({ id: category, name: CATEGORY_NAMES[category], recipes });
  }));
}

function productionResearchRows(
  state: EngineeringStateV2,
  economy: EngineeringPanelEconomySnapshot,
  jumpDriveOwned: boolean,
): readonly EngineeringResearchRowReadModel[] {
  const materials = quantityMap(economy.cargo, 'engineering cargo');
  const researchOwned = new Map(state.research.map((id) => [id, 1]));
  const revisionExhausted = isEngineeringRevisionExhausted(state);
  const definitions = new Map(ENGINEERING_RESEARCH_CATALOGUE.map((definition) => [definition.id, definition]));
  return Object.freeze(ENGINEERING_RESEARCH_ORDER.map((id) => {
    const definition = definitions.get(id)!;
    const owned = state.research.includes(id);
    const prerequisiteOwned = definition.prerequisiteId === null
      || state.research.includes(definition.prerequisiteId);
    const assetsReady = Object.entries(definition.materialCost)
      .every(([materialId, required]) => (materials.get(materialId) ?? 0) >= required)
      && economy.stardust >= definition.stardustCost;
    let status: EngineeringRowStatus = 'available';
    let reason: string | null = null;
    if (owned) {
      status = 'owned'; reason = 'Already researched.';
    } else if (definition.consumerStatus === 'unavailable') {
      status = 'unavailable'; reason = 'Gameplay effect is not connected.';
    } else if (id === 'scan1' && !jumpDriveOwned) {
      status = 'unavailable'; reason = 'Build the Jump Drive first.';
    } else if (revisionExhausted) {
      status = 'unavailable'; reason = 'Engineering record revision is exhausted.';
    } else if (!prerequisiteOwned) {
      status = 'unavailable'; reason = `Requires ${definitions.get(definition.prerequisiteId!)?.name ?? definition.prerequisiteId}.`;
    } else if (!assetsReady) {
      status = 'unavailable';
      const missing = Object.entries(definition.materialCost).flatMap(([materialId, required]) => {
        const amount = required - (materials.get(materialId) ?? 0);
        return amount > 0 ? [`Missing ${amount} ${labelFor(materialId)}.`] : [];
      });
      const missingStardust = Math.max(0, definition.stardustCost - economy.stardust);
      if (missingStardust > 0) missing.push(`Missing ${missingStardust} Stardust.`);
      reason = missing.join(' ');
    }
    return deepFreeze({
      id,
      name: definition.name,
      description: definition.description,
      status,
      reason,
      costs: costs(
        definition.materialCost, {}, definition.stardustCost,
        materials, researchOwned, economy.stardust,
        null, new Set(), definition.prerequisiteId,
        definition.prerequisiteId === null
          ? null
          : definitions.get(definition.prerequisiteId)?.name ?? definition.prerequisiteId,
      ),
    });
  }));
}

function unavailableMining(detail: string): EngineeringPanelReadModelV1['mining'] {
  return deepFreeze({
    locationLabel: 'No mineable surface selected', status: 'unavailable', detail,
    deposits: [], pullsRemaining: null, autoExtractorDue: null,
  });
}

function miningModel(input: EngineeringPanelProjectionInput): EngineeringPanelReadModelV1['mining'] {
  if (input.nav.mode !== 'surface') return unavailableMining('Land on a lifeless world to mine it.');
  const current = canonicalCF1WorldAddressFromNav(input.nav);
  if (!current.ok) return unavailableMining('The current surface provenance is unavailable.');
  try {
    const opportunity = projectWorldOpportunity(current.address);
    const reveal = projectWorldMineralReveal({
      state: input.engineering, opportunity, currentNav: input.nav,
    });
    if (reveal.status === 'refused') {
      const detail = reveal.reason === 'earth-protected' ? 'Earth is protected from extraction.'
        : reveal.reason === 'biosphere-present' ? 'Living worlds are protected from extraction.'
          : 'The current world cannot be proven for extraction.';
      return deepFreeze({
        locationLabel: `World ${current.address.planet.seed}`, status: 'unavailable', detail,
        deposits: [], pullsRemaining: null, autoExtractorDue: null,
      });
    }
    const capabilities = projectEngineeringCapabilities(input.loadout);
    const prior = input.engineering.worlds.find(({ key }) => key === opportunity.key);
    const pullsRemaining = reveal.pullsRemaining ?? 0;
    let due = 0;
    if (capabilities.autoExtractor && prior?.autoExtractorCursor) {
      const accrued = settleRecurringAccrual(prior.autoExtractorCursor, input.activePlayMs, {
        cadenceMs: AUTO_EXTRACTOR_CADENCE_MS,
        maxBatch: AUTO_EXTRACTOR_MAX_LOADS,
      });
      due = Math.min(accrued.due, Math.max(0, pullsRemaining - 1));
    }
    const gradeByMaterial = new Map((reveal.resolvedGrades ?? []).map((grade) => [grade.materialId, grade.tier]));
    const ids = [
      ...(reveal.ordinaryDeposits ?? []),
      ...(reveal.biomeVein === null ? [] : [reveal.biomeVein]),
      ...(reveal.cosmicVein === null ? [] : [reveal.cosmicVein]),
      ...(reveal.exceptionalVein === null ? [] : [reveal.exceptionalVein]),
    ];
    const deposits = [...new Set(ids)].map((id) => deepFreeze({
      id, label: labelFor(id), grade: gradeByMaterial.has(id) ? `Tier ${gradeByMaterial.get(id)}` : null,
    }));
    const revisionExhausted = isEngineeringRevisionExhausted(input.engineering);
    return deepFreeze({
      locationLabel: `World ${current.address.planet.seed}`,
      status: pullsRemaining > 0
        ? revisionExhausted ? 'unavailable' : 'ready'
        : 'worked-out',
      detail: pullsRemaining > 0
        ? revisionExhausted
          ? 'Engineering record revision is exhausted.'
          : 'A finite extraction action is ready.'
        : 'This world is worked out.',
      deposits,
      pullsRemaining,
      autoExtractorDue: capabilities.autoExtractor ? due : null,
    });
  } catch {
    return unavailableMining('Mining facts could not be re-proven from current authority.');
  }
}

function unavailableSkimming(detail: string): EngineeringPanelReadModelV1['skimming'] {
  return deepFreeze({
    starLabel: 'No stellar corona selected', status: 'unavailable', detail,
    material: null, passesRemaining: null, nextDamage: null,
  });
}

function skimmingModel(input: EngineeringPanelProjectionInput): EngineeringPanelReadModelV1['skimming'] {
  if (input.nav.mode !== 'system') return unavailableSkimming('Enter a star system to inspect its corona.');
  const current = canonicalCF1StarAddressFromNav(input.nav);
  if (!current.ok) return unavailableSkimming('The current star provenance is unavailable.');
  try {
    const opportunity = projectStarOpportunity(current.address);
    const capabilities = projectEngineeringCapabilities(input.loadout);
    const reserve = Math.round(opportunity.baseReservePasses * (1 + 0.5 * capabilities.stellarSkimBonus));
    const prior = input.engineering.stars.find(({ key }) => key === opportunity.key);
    const taken = Math.min(prior?.extractionsTaken ?? 0, reserve);
    const remaining = reserve - taken;
    const guarded = capabilities.stellarSkimGuard;
    const damage = opportunity.remnantHazard && !guarded ? 3 : 0;
    let status: EngineeringPanelReadModelV1['skimming']['status'] = 'ready';
    let detail = 'One finite corona pass is ready.';
    if (opportunity.material === null) {
      status = 'unavailable'; detail = 'This star class has no skimmable legacy material.';
    } else if (!capabilities.jumpDrive) {
      status = 'unavailable'; detail = 'Build the Jump Drive before stellar skimming.';
    } else if (remaining === 0) {
      status = 'worked-out'; detail = 'This corona is worked out.';
    } else if (damage > 0 && input.economy.hp <= 4) {
      status = 'unavailable'; detail = 'Hull integrity is too low for this remnant star.';
    } else if (isEngineeringRevisionExhausted(input.engineering)) {
      status = 'unavailable'; detail = 'Engineering record revision is exhausted.';
    }
    return deepFreeze({
      starLabel: `Star ${current.address.star.seed}`,
      status,
      detail,
      material: opportunity.material === null ? null : labelFor(opportunity.material),
      passesRemaining: opportunity.material === null ? null : remaining,
      nextDamage: opportunity.material === null ? null : damage,
    });
  } catch {
    return unavailableSkimming('Skimming facts could not be re-proven from current authority.');
  }
}

export function projectEngineeringPanelReadModel(
  input: EngineeringPanelProjectionInput,
): EngineeringPanelReadModelV1 {
  if (!Number.isSafeInteger(input.activePlayMs) || input.activePlayMs < 0) {
    throw new RangeError('engineering panel activePlayMs must be a non-negative safe integer');
  }
  if (!Number.isSafeInteger(input.economy.stardust) || input.economy.stardust < 0
    || !Number.isSafeInteger(input.economy.hp) || input.economy.hp < 0) {
    throw new RangeError('engineering panel economy is malformed');
  }
  /* The capability projector is also the private loadout-brand check. Its
     exact positive system fold owns the temporary Jump-Drive-first product
     policy; ship art and loose item mirrors are never qualification. */
  const capabilities = projectEngineeringCapabilities(input.loadout);
  const engineeringRevisionExhausted = isEngineeringRevisionExhausted(input.engineering);
  const model: EngineeringPanelReadModelV1 = {
    schema: ENGINEERING_PANEL_READ_MODEL_SCHEMA,
    ship: input.ship,
    mining: miningModel(input),
    skimming: skimmingModel(input),
    research: productionResearchRows(input.engineering, input.economy, capabilities.jumpDrive),
    fabricationGroups: productionFabricationGroups(
      input.loadout,
      input.economy,
      engineeringRevisionExhausted,
    ),
  };
  return deepFreeze(model);
}
