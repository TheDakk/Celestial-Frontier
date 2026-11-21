/* Arc 2 source-neutral economy ledger.

   The ledger replays externally supplied, version-bound receipts and exact
   fixed crafts. It deliberately contains no world source table, rate model,
   RNG, clock, or predictive ETA. Arc 3 can supply receipts without changing
   the conversion rules proved here. */
import { LOOT_CATALOGUE_V1 } from './catalogue.js';
import {
  LEGACY_MATERIAL_IDS_V1,
  getFixedRecipePlan,
  quoteFixedRecipe,
  type FixedRecipeInventory,
  type RecipeAuditDefinition,
} from './recipe.js';
import {
  UINT32_MAX,
  assertPlainRecord,
  checkedInteger,
  deepFreeze,
} from './internal.js';

export const ECONOMY_LEDGER_SCHEMA = 2 as const;

export type EconomyResearchId = 'scan1' | 'hull1' | 'lab1' | 'drive1' | 'drive2' | 'drive3';

export interface EconomySinkDefinition {
  readonly id: EconomyResearchId;
  readonly materialCost: Readonly<Record<string, number>>;
  readonly stardustCost: number;
  readonly prerequisiteId: EconomyResearchId | null;
  readonly jumpDriveRequired: boolean;
}

export const LEGACY_RESEARCH_SINKS_V1: readonly EconomySinkDefinition[] = deepFreeze([
  { id: 'scan1', materialCost: { Fe: 6, Si: 4 }, stardustCost: 20, prerequisiteId: null, jumpDriveRequired: true },
  { id: 'hull1', materialCost: { Ti: 5, Fe: 8 }, stardustCost: 40, prerequisiteId: null, jumpDriveRequired: false },
  { id: 'lab1', materialCost: { C: 6, P: 3, H2O: 4 }, stardustCost: 60, prerequisiteId: null, jumpDriveRequired: false },
  { id: 'drive1', materialCost: { H: 8, He3: 2, Fe: 4 }, stardustCost: 40, prerequisiteId: null, jumpDriveRequired: false },
  { id: 'drive2', materialCost: { He3: 6, Pt: 2, U: 2 }, stardustCost: 120, prerequisiteId: 'drive1', jumpDriveRequired: false },
  { id: 'drive3', materialCost: { Pz: 1, Ir: 3, U: 4 }, stardustCost: 300, prerequisiteId: 'drive2', jumpDriveRequired: false },
]);

export interface EconomyCoverageAudit {
  readonly valid: boolean;
  readonly materialCount: number;
  readonly recipeSinkMaterialIds: readonly string[];
  readonly researchSinkMaterialIds: readonly string[];
  readonly combinedSinkMaterialIds: readonly string[];
  readonly sinklessMaterialIds: readonly string[];
  readonly unknownSinkMaterialIds: readonly string[];
  readonly duplicateMaterialIds: readonly string[];
  readonly stardustSinks: Readonly<{
    itemRecipes: number;
    research: number;
    combined: number;
  }>;
  readonly sourceModelStatus: 'absent' | 'registered';
}

export interface EconomyLedgerSnapshot {
  readonly activePlayMs: number;
  readonly materials: Readonly<Record<string, number>>;
  /** Analytical catalogue counts only; this is not the GearInventory schema. */
  readonly itemCounts: Readonly<Record<string, number>>;
  readonly stardust: number;
  readonly signatureIds: readonly string[];
  /** Optional only for schema-1 analytical callers; schema-2 outputs it. */
  readonly researchIds?: readonly EconomyResearchId[];
}

export interface EconomySourceAuthority {
  readonly ownerId: string;
  readonly version: number;
}

export interface EconomySourceReceiptEvent {
  readonly kind: 'source-receipt';
  readonly receiptId: string;
  readonly sourceOwnerId: string;
  readonly sourceVersion: number;
  readonly sourceId: string;
  readonly activePlayMs: number;
  readonly materials: Readonly<Record<string, number>>;
  readonly stardust: number;
}

export interface EconomyCraftEvent {
  readonly kind: 'craft';
  readonly actionId: string;
  readonly activePlayMs: number;
  readonly baseId: string;
}

export interface EconomyResearchEvent {
  readonly kind: 'research';
  readonly actionId: string;
  readonly activePlayMs: number;
  readonly researchId: EconomyResearchId;
}

export type EconomyTraceEvent = EconomySourceReceiptEvent | EconomyCraftEvent | EconomyResearchEvent;

export interface EconomyTarget {
  readonly baseId: string;
  readonly quantity: number;
}

export interface EconomyResearchTarget {
  readonly researchId: EconomyResearchId;
}

export interface EconomyReplayInput {
  readonly initial: EconomyLedgerSnapshot;
  /** Empty means Arc 3 has not supplied a production source model. */
  readonly sourceAuthorities: readonly EconomySourceAuthority[];
  readonly events: readonly EconomyTraceEvent[];
  readonly target: EconomyTarget | EconomyResearchTarget | null;
}

export interface EconomyLedgerState extends EconomyLedgerSnapshot {
  readonly schema: typeof ECONOMY_LEDGER_SCHEMA;
  readonly appliedReceiptIds: readonly string[];
  readonly appliedCraftActionIds: readonly string[];
  readonly appliedResearchActionIds: readonly string[];
  readonly researchIds: readonly EconomyResearchId[];
}

export type EconomyTargetOutcome =
  | Readonly<{
      status: 'source-model-absent';
      baseId: string;
      quantity: number;
      observedAtActivePlayMs: null;
      etaActivePlayMs: null;
    }>
  | Readonly<{
      status: 'source-model-absent' | 'not-reached-in-trace' | 'reached-in-trace';
      researchId: EconomyResearchId;
      observedAtActivePlayMs: number | null;
      etaActivePlayMs: null;
    }>
  | Readonly<{
      status: 'not-reached-in-trace';
      baseId: string;
      quantity: number;
      observedAtActivePlayMs: null;
      etaActivePlayMs: null;
    }>
  | Readonly<{
      status: 'reached-in-trace';
      baseId: string;
      quantity: number;
      observedAtActivePlayMs: number;
      /** A replay observation is evidence, not a predictive ETA. */
      etaActivePlayMs: null;
    }>;

export type EconomyReplayRejectionReason =
  | 'unknown-asset'
  | 'duplicate-receipt'
  | 'duplicate-action'
  | 'backward-active-play'
  | 'unknown-source-owner'
  | 'source-version-mismatch'
  | 'source-authority-conflict'
  | 'quantity-overflow'
  | 'overspend'
  | 'craft-blocked'
  | 'research-blocked';

export type EconomyReplayResult =
  | Readonly<{
      status: 'replayed';
      state: EconomyLedgerState;
      target: EconomyTargetOutcome | null;
    }>
  | Readonly<{
      status: 'rejected';
      reason: EconomyReplayRejectionReason;
      eventIndex: number;
      eventId: string | null;
      detail: string;
    }>;

const MATERIAL_IDS = new Set<string>(LEGACY_MATERIAL_IDS_V1);
const CATALOGUE_IDS = new Set<string>(LOOT_CATALOGUE_V1.map(({ id }) => id));
const SIGNATURE_IDS = new Set<string>(LOOT_CATALOGUE_V1.flatMap(({ signatureId }) => (
  signatureId === null ? [] : [signatureId]
)));
const RESEARCH_IDS: readonly EconomyResearchId[] = Object.freeze(
  LEGACY_RESEARCH_SINKS_V1.map(({ id }) => id),
);
const RESEARCH_ID_SET = new Set<string>(RESEARCH_IDS);

function codeUnitCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortedSet(values: Iterable<string>): string[] {
  return [...new Set(values)].sort(codeUnitCompare);
}

/** Reports executable sink truth separately from future source/rate claims. */
export function auditEconomyCoverage(
  recipesValue: readonly Pick<RecipeAuditDefinition, 'id' | 'materialCost' | 'stardustCost'>[] = LOOT_CATALOGUE_V1,
  researchValue: readonly EconomySinkDefinition[] = LEGACY_RESEARCH_SINKS_V1,
  materialIdsValue: readonly string[] = LEGACY_MATERIAL_IDS_V1,
  sourceAuthoritiesValue: readonly EconomySourceAuthority[] = Object.freeze([]),
): EconomyCoverageAudit {
  if (!Array.isArray(recipesValue) || !Array.isArray(researchValue)
    || !Array.isArray(materialIdsValue) || !Array.isArray(sourceAuthoritiesValue)) {
    throw new TypeError('economy coverage audit requires recipe, research, material, and source arrays');
  }
  const sourceOwners = new Set<string>();
  for (const authority of sourceAuthoritiesValue) {
    assertPlainRecord(authority, 'economy source authority');
    const ownerId = checkedText(authority.ownerId, 'economy source ownerId');
    checkedInteger(authority.version, 1, UINT32_MAX, `economy source ${ownerId} version`);
    if (sourceOwners.has(ownerId)) throw new RangeError(`economy source owner ${ownerId} is duplicated`);
    sourceOwners.add(ownerId);
  }
  const materialCounts = new Map<string, number>();
  for (const materialId of materialIdsValue) {
    if (typeof materialId !== 'string' || materialId.length === 0) throw new RangeError('material manifest has an invalid id');
    materialCounts.set(materialId, (materialCounts.get(materialId) ?? 0) + 1);
  }
  const materialIds = new Set(materialCounts.keys());
  const duplicateMaterialIds = [...materialCounts].filter(([, count]) => count > 1).map(([id]) => id).sort();
  const recipeSinkMaterialIds = sortedSet(recipesValue.flatMap(({ materialCost }) => Object.keys(materialCost)));
  const researchSinkMaterialIds = sortedSet(researchValue.flatMap(({ materialCost }) => Object.keys(materialCost)));
  const combinedSinkMaterialIds = sortedSet([...recipeSinkMaterialIds, ...researchSinkMaterialIds]);
  const unknownSinkMaterialIds = combinedSinkMaterialIds.filter((materialId) => !materialIds.has(materialId));
  const sinklessMaterialIds = [...materialIds].filter((materialId) => !combinedSinkMaterialIds.includes(materialId));
  const itemStardust = recipesValue.reduce((total, definition) => (
    total + checkedInteger(definition.stardustCost ?? 0, 0, Number.MAX_SAFE_INTEGER, `${definition.id} stardust sink`)
  ), 0);
  const researchStardust = researchValue.reduce((total, sink) => (
    total + checkedInteger(sink.stardustCost, 0, Number.MAX_SAFE_INTEGER, `${sink.id} stardust sink`)
  ), 0);
  return deepFreeze({
    valid: duplicateMaterialIds.length === 0 && unknownSinkMaterialIds.length === 0,
    materialCount: materialIdsValue.length,
    recipeSinkMaterialIds,
    researchSinkMaterialIds,
    combinedSinkMaterialIds,
    sinklessMaterialIds,
    unknownSinkMaterialIds,
    duplicateMaterialIds,
    stardustSinks: {
      itemRecipes: itemStardust,
      research: researchStardust,
      combined: itemStardust + researchStardust,
    },
    sourceModelStatus: sourceOwners.size === 0 ? 'absent' : 'registered',
  });
}

function checkedText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 512
    || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RangeError(`${label} must be 1–512 printable characters`);
  }
  return value;
}

function quantities(value: unknown, label: string): Record<string, number> {
  assertPlainRecord(value, label);
  const result: Record<string, number> = {};
  for (const [id, quantity] of Object.entries(value).sort(([left], [right]) => codeUnitCompare(left, right))) {
    result[id] = checkedInteger(quantity, 0, Number.MAX_SAFE_INTEGER, `${label} ${id}`);
  }
  return result;
}

function positiveQuantities(value: Readonly<Record<string, number>>): Record<string, number> {
  return Object.fromEntries(Object.entries(value).filter(([, quantity]) => quantity > 0)
    .sort(([left], [right]) => codeUnitCompare(left, right)));
}

function rejected(
  reason: EconomyReplayRejectionReason,
  eventIndex: number,
  eventId: string | null,
  detail: string,
): EconomyReplayResult {
  return deepFreeze({ status: 'rejected', reason, eventIndex, eventId, detail });
}

function checkedInitial(value: EconomyLedgerSnapshot): EconomyLedgerSnapshot | EconomyReplayResult {
  assertPlainRecord(value, 'economy initial snapshot');
  const materials = quantities(value.materials, 'economy initial materials');
  for (const id of Object.keys(materials)) {
    if (!MATERIAL_IDS.has(id)) return rejected('unknown-asset', -1, null, `unknown material ${id}`);
  }
  const itemCounts = quantities(value.itemCounts, 'economy initial item counts');
  for (const id of Object.keys(itemCounts)) {
    if (!CATALOGUE_IDS.has(id)) return rejected('unknown-asset', -1, null, `unknown item ${id}`);
  }
  if (!Array.isArray(value.signatureIds)) throw new TypeError('economy initial signatureIds must be an array');
  const signatureIds: string[] = [];
  for (const id of value.signatureIds) {
    if (typeof id !== 'string' || !SIGNATURE_IDS.has(id)) {
      return rejected('unknown-asset', -1, null, `unknown Signature ${String(id)}`);
    }
    if (!signatureIds.includes(id)) signatureIds.push(id);
  }
  const researchValue = value.researchIds ?? [];
  if (!Array.isArray(researchValue)) throw new TypeError('economy initial researchIds must be an array');
  const researchIds: EconomyResearchId[] = [];
  for (const id of researchValue) {
    if (typeof id !== 'string' || !RESEARCH_ID_SET.has(id) || researchIds.includes(id as EconomyResearchId)) {
      return rejected('unknown-asset', -1, null, `unknown or duplicate research ${String(id)}`);
    }
    researchIds.push(id as EconomyResearchId);
  }
  researchIds.sort((left, right) => RESEARCH_IDS.indexOf(left) - RESEARCH_IDS.indexOf(right));
  return deepFreeze({
    activePlayMs: checkedInteger(value.activePlayMs, 0, Number.MAX_SAFE_INTEGER, 'economy initial activePlayMs'),
    materials: positiveQuantities(materials),
    itemCounts: positiveQuantities(itemCounts),
    stardust: checkedInteger(value.stardust, 0, Number.MAX_SAFE_INTEGER, 'economy initial stardust'),
    signatureIds: signatureIds.sort(),
    researchIds,
  });
}

function addChecked(left: number, right: number): number | null {
  const sum = left + right;
  return Number.isSafeInteger(sum) && sum >= 0 ? sum : null;
}

/** Replays one ordered trace. Event order is authoritative; equal active-play
 * stamps are allowed, but time may never move backward. */
export function replayEconomyTrace(input: EconomyReplayInput): EconomyReplayResult {
  assertPlainRecord(input, 'economy replay input');
  if (!Array.isArray(input.sourceAuthorities) || !Array.isArray(input.events)) {
    throw new TypeError('economy replay requires authority and event arrays');
  }
  const initialResult = checkedInitial(input.initial);
  if ('status' in initialResult) return initialResult;

  const authorityVersions = new Map<string, number>();
  for (const authority of input.sourceAuthorities) {
    assertPlainRecord(authority, 'economy source authority');
    const ownerId = checkedText(authority.ownerId, 'economy source ownerId');
    const version = checkedInteger(authority.version, 1, UINT32_MAX, `economy source ${ownerId} version`);
    if (authorityVersions.has(ownerId)) {
      return rejected('source-authority-conflict', -1, null, `source owner ${ownerId} is declared more than once`);
    }
    authorityVersions.set(ownerId, version);
  }

  let target: EconomyTarget | EconomyResearchTarget | null = null;
  if (input.target !== null) {
    assertPlainRecord(input.target, 'economy target');
    if ('baseId' in input.target && !('researchId' in input.target)) {
      if (typeof input.target.baseId !== 'string' || !CATALOGUE_IDS.has(input.target.baseId)) {
        return rejected('unknown-asset', -1, null, `unknown target ${String(input.target.baseId)}`);
      }
      target = {
        baseId: input.target.baseId,
        quantity: checkedInteger(input.target.quantity, 1, Number.MAX_SAFE_INTEGER, 'economy target quantity'),
      };
    } else if ('researchId' in input.target && !('baseId' in input.target)
      && typeof input.target.researchId === 'string'
      && RESEARCH_ID_SET.has(input.target.researchId)) {
      target = { researchId: input.target.researchId as EconomyResearchId };
    } else {
      return rejected('unknown-asset', -1, null, 'economy target is neither one item nor one research row');
    }
  }

  const materials = { ...initialResult.materials };
  const itemCounts = { ...initialResult.itemCounts };
  const researchIds = [...(initialResult.researchIds ?? [])];
  let stardust = initialResult.stardust;
  let activePlayMs = initialResult.activePlayMs;
  const receiptIds = new Set<string>();
  const appliedReceiptIds: string[] = [];
  const appliedCraftActionIds: string[] = [];
  const appliedResearchActionIds: string[] = [];
  const actionIds = new Set<string>();
  let targetObservedAt = target === null
    ? null
    : 'baseId' in target
      ? (itemCounts[target.baseId] ?? 0) >= target.quantity ? activePlayMs : null
      : researchIds.includes(target.researchId) ? activePlayMs : null;

  for (const [eventIndex, event] of input.events.entries()) {
    const rawEvent: unknown = event;
    assertPlainRecord(rawEvent, `economy event ${eventIndex}`);
    if (rawEvent.kind !== 'source-receipt' && rawEvent.kind !== 'craft'
      && rawEvent.kind !== 'research') {
      return rejected('unknown-asset', eventIndex, null, 'unknown economy event kind');
    }
    const eventId = checkedText(
      rawEvent.kind === 'source-receipt' ? rawEvent.receiptId : rawEvent.actionId,
      `economy event ${eventIndex} id`,
    );
    const eventTime = checkedInteger(event.activePlayMs, 0, Number.MAX_SAFE_INTEGER, `economy event ${eventIndex} activePlayMs`);
    if (eventTime < activePlayMs) {
      return rejected('backward-active-play', eventIndex, eventId, `${eventTime} is before ${activePlayMs}`);
    }
    activePlayMs = eventTime;

    if (event.kind === 'source-receipt') {
      const ownerId = checkedText(event.sourceOwnerId, `economy receipt ${event.receiptId} sourceOwnerId`);
      checkedText(event.sourceId, `economy receipt ${event.receiptId} sourceId`);
      if (receiptIds.has(eventId)) {
        return rejected('duplicate-receipt', eventIndex, eventId, `receipt ${eventId} was already applied`);
      }
      const expectedVersion = authorityVersions.get(ownerId);
      if (expectedVersion === undefined) {
        return rejected('unknown-source-owner', eventIndex, eventId, `source owner ${ownerId} is not bound`);
      }
      const sourceVersion = checkedInteger(event.sourceVersion, 1, UINT32_MAX, `economy receipt ${event.receiptId} sourceVersion`);
      if (sourceVersion !== expectedVersion) {
        return rejected('source-version-mismatch', eventIndex, eventId, `source owner ${ownerId} expected v${expectedVersion}, received v${sourceVersion}`);
      }
      const gains = quantities(event.materials, `economy receipt ${event.receiptId} materials`);
      for (const materialId of Object.keys(gains)) {
        if (!MATERIAL_IDS.has(materialId)) {
          return rejected('unknown-asset', eventIndex, eventId, `unknown material ${materialId}`);
        }
      }
      for (const [materialId, quantity] of Object.entries(gains)) {
        const next = addChecked(materials[materialId] ?? 0, quantity);
        if (next === null) return rejected('quantity-overflow', eventIndex, eventId, `${materialId} exceeds safe integer storage`);
        if (next > 0) materials[materialId] = next;
      }
      const stardustGain = checkedInteger(event.stardust, 0, Number.MAX_SAFE_INTEGER, `economy receipt ${event.receiptId} stardust`);
      const nextStardust = addChecked(stardust, stardustGain);
      if (nextStardust === null) return rejected('quantity-overflow', eventIndex, eventId, 'stardust exceeds safe integer storage');
      stardust = nextStardust;
      receiptIds.add(eventId);
      appliedReceiptIds.push(eventId);
    } else if (event.kind === 'craft') {
      if (actionIds.has(eventId)) {
        return rejected('duplicate-action', eventIndex, eventId, `action ${eventId} was already applied`);
      }
      if (typeof event.baseId !== 'string' || !CATALOGUE_IDS.has(event.baseId)) {
        return rejected('unknown-asset', eventIndex, eventId, `unknown craft output ${String(event.baseId)}`);
      }
      const inventory: FixedRecipeInventory = {
        materials,
        itemCounts,
        stardust,
        signatureIds: initialResult.signatureIds,
      };
      const quote = quoteFixedRecipe(event.baseId, inventory);
      if (!quote.craftable) {
        const resourceShortfall = quote.missingMaterials.length > 0
          || quote.missingParts.length > 0 || quote.missingStardust > 0;
        return rejected(
          resourceShortfall ? 'overspend' : 'craft-blocked',
          eventIndex,
          eventId,
          resourceShortfall
            ? `craft ${event.baseId} exceeds available resources`
            : `craft ${event.baseId} is blocked by ownership or build-once gates`,
        );
      }
      const recipe = getFixedRecipePlan(event.baseId);
      for (const [materialId, quantity] of Object.entries(recipe.materialCost)) {
        const next = materials[materialId]! - quantity;
        if (next > 0) materials[materialId] = next; else delete materials[materialId];
      }
      for (const [partId, quantity] of Object.entries(recipe.partCost)) {
        const next = itemCounts[partId]! - quantity;
        if (next > 0) itemCounts[partId] = next; else delete itemCounts[partId];
      }
      stardust -= recipe.stardustCost;
      const nextCount = addChecked(itemCounts[event.baseId] ?? 0, 1);
      if (nextCount === null) return rejected('quantity-overflow', eventIndex, eventId, `${event.baseId} exceeds safe integer storage`);
      itemCounts[event.baseId] = nextCount;
      actionIds.add(eventId);
      appliedCraftActionIds.push(eventId);
      if (target !== null && targetObservedAt === null
        && 'baseId' in target && event.baseId === target.baseId && nextCount >= target.quantity) {
        targetObservedAt = activePlayMs;
      }
    } else {
      if (actionIds.has(eventId)) {
        return rejected('duplicate-action', eventIndex, eventId, `action ${eventId} was already applied`);
      }
      if (typeof event.researchId !== 'string' || !RESEARCH_ID_SET.has(event.researchId)) {
        return rejected('unknown-asset', eventIndex, eventId, 'research event is not canonical');
      }
      const researchId = event.researchId as EconomyResearchId;
      const sink = LEGACY_RESEARCH_SINKS_V1.find(({ id }) => id === researchId)!;
      if (researchIds.includes(researchId)
        || (sink.jumpDriveRequired && (itemCounts.jumpdrive ?? 0) < 1)
        || (sink.prerequisiteId !== null && !researchIds.includes(sink.prerequisiteId))) {
        return rejected('research-blocked', eventIndex, eventId, `research ${researchId} is already owned or prerequisite-blocked`);
      }
      if (Object.entries(sink.materialCost).some(([id, quantity]) => (materials[id] ?? 0) < quantity)
        || stardust < sink.stardustCost) {
        return rejected('overspend', eventIndex, eventId, `research ${researchId} exceeds available resources`);
      }
      for (const [materialId, quantity] of Object.entries(sink.materialCost)) {
        const next = materials[materialId]! - quantity;
        if (next > 0) materials[materialId] = next; else delete materials[materialId];
      }
      stardust -= sink.stardustCost;
      researchIds.push(researchId);
      researchIds.sort((left, right) => RESEARCH_IDS.indexOf(left) - RESEARCH_IDS.indexOf(right));
      actionIds.add(eventId);
      appliedResearchActionIds.push(eventId);
      if (target !== null && targetObservedAt === null
        && 'researchId' in target && target.researchId === researchId) {
        targetObservedAt = activePlayMs;
      }
    }
  }

  const state: EconomyLedgerState = deepFreeze({
    schema: ECONOMY_LEDGER_SCHEMA,
    activePlayMs,
    materials: positiveQuantities(materials),
    itemCounts: positiveQuantities(itemCounts),
    stardust,
    signatureIds: [...initialResult.signatureIds],
    researchIds,
    appliedReceiptIds,
    appliedCraftActionIds,
    appliedResearchActionIds,
  });
  let targetOutcome: EconomyTargetOutcome | null = null;
  if (target !== null) {
    if ('researchId' in target) {
      targetOutcome = deepFreeze({
        status: targetObservedAt !== null
          ? 'reached-in-trace'
          : authorityVersions.size === 0 ? 'source-model-absent' : 'not-reached-in-trace',
        researchId: target.researchId,
        observedAtActivePlayMs: targetObservedAt,
        etaActivePlayMs: null,
      });
    } else targetOutcome = targetObservedAt !== null
      ? deepFreeze({
          status: 'reached-in-trace',
          baseId: target.baseId,
          quantity: target.quantity,
          observedAtActivePlayMs: targetObservedAt,
          etaActivePlayMs: null,
        })
      : authorityVersions.size === 0
        ? deepFreeze({
            status: 'source-model-absent',
            baseId: target.baseId,
            quantity: target.quantity,
            observedAtActivePlayMs: null,
            etaActivePlayMs: null,
          })
        : deepFreeze({
            status: 'not-reached-in-trace',
            baseId: target.baseId,
            quantity: target.quantity,
            observedAtActivePlayMs: null,
            etaActivePlayMs: null,
          });
  }
  return deepFreeze({ status: 'replayed', state, target: targetOutcome });
}
