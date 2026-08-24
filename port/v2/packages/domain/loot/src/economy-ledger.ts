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

export const ECONOMY_LEDGER_SCHEMA = 1 as const;

export interface EconomySinkDefinition {
  readonly id: string;
  readonly materialCost: Readonly<Record<string, number>>;
  readonly stardustCost: number;
}

export const LEGACY_RESEARCH_SINKS_V1: readonly EconomySinkDefinition[] = deepFreeze([
  { id: 'scan1', materialCost: { Fe: 6, Si: 4 }, stardustCost: 20 },
  { id: 'hull1', materialCost: { Ti: 5, Fe: 8 }, stardustCost: 40 },
  { id: 'lab1', materialCost: { C: 6, P: 3, H2O: 4 }, stardustCost: 60 },
  { id: 'drive1', materialCost: { H: 8, He3: 2, Fe: 4 }, stardustCost: 40 },
  { id: 'drive2', materialCost: { He3: 6, Pt: 2, U: 2 }, stardustCost: 120 },
  { id: 'drive3', materialCost: { Pz: 1, Ir: 3, U: 4 }, stardustCost: 300 },
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
  readonly sourceModelStatus: 'arc3-deferred';
}

export interface EconomyLedgerSnapshot {
  readonly activePlayMs: number;
  readonly materials: Readonly<Record<string, number>>;
  /** Analytical catalogue counts only; this is not the GearInventory schema. */
  readonly itemCounts: Readonly<Record<string, number>>;
  readonly stardust: number;
  readonly signatureIds: readonly string[];
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

export type EconomyTraceEvent = EconomySourceReceiptEvent | EconomyCraftEvent;

export interface EconomyTarget {
  readonly baseId: string;
  readonly quantity: number;
}

export interface EconomyReplayInput {
  readonly initial: EconomyLedgerSnapshot;
  /** Empty means Arc 3 has not supplied a production source model. */
  readonly sourceAuthorities: readonly EconomySourceAuthority[];
  readonly events: readonly EconomyTraceEvent[];
  readonly target: EconomyTarget | null;
}

export interface EconomyLedgerState extends EconomyLedgerSnapshot {
  readonly schema: typeof ECONOMY_LEDGER_SCHEMA;
  readonly appliedReceiptIds: readonly string[];
  readonly appliedCraftActionIds: readonly string[];
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
  | 'backward-active-play'
  | 'unknown-source-owner'
  | 'source-version-mismatch'
  | 'source-authority-conflict'
  | 'quantity-overflow'
  | 'overspend'
  | 'craft-blocked';

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

function sortedSet(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/** Reports executable sink truth separately from future source/rate claims. */
export function auditEconomyCoverage(
  recipesValue: readonly Pick<RecipeAuditDefinition, 'id' | 'materialCost' | 'stardustCost'>[] = LOOT_CATALOGUE_V1,
  researchValue: readonly EconomySinkDefinition[] = LEGACY_RESEARCH_SINKS_V1,
  materialIdsValue: readonly string[] = LEGACY_MATERIAL_IDS_V1,
): EconomyCoverageAudit {
  if (!Array.isArray(recipesValue) || !Array.isArray(researchValue) || !Array.isArray(materialIdsValue)) {
    throw new TypeError('economy coverage audit requires recipe, research, and material arrays');
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
    sourceModelStatus: 'arc3-deferred',
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
  for (const [id, quantity] of Object.entries(value).sort(([left], [right]) => left.localeCompare(right))) {
    result[id] = checkedInteger(quantity, 0, Number.MAX_SAFE_INTEGER, `${label} ${id}`);
  }
  return result;
}

function positiveQuantities(value: Readonly<Record<string, number>>): Record<string, number> {
  return Object.fromEntries(Object.entries(value).filter(([, quantity]) => quantity > 0)
    .sort(([left], [right]) => left.localeCompare(right)));
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
  return deepFreeze({
    activePlayMs: checkedInteger(value.activePlayMs, 0, Number.MAX_SAFE_INTEGER, 'economy initial activePlayMs'),
    materials: positiveQuantities(materials),
    itemCounts: positiveQuantities(itemCounts),
    stardust: checkedInteger(value.stardust, 0, Number.MAX_SAFE_INTEGER, 'economy initial stardust'),
    signatureIds: signatureIds.sort(),
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

  let target: EconomyTarget | null = null;
  if (input.target !== null) {
    assertPlainRecord(input.target, 'economy target');
    if (typeof input.target.baseId !== 'string' || !CATALOGUE_IDS.has(input.target.baseId)) {
      return rejected('unknown-asset', -1, null, `unknown target ${String(input.target.baseId)}`);
    }
    target = {
      baseId: input.target.baseId,
      quantity: checkedInteger(input.target.quantity, 1, Number.MAX_SAFE_INTEGER, 'economy target quantity'),
    };
  }

  const materials = { ...initialResult.materials };
  const itemCounts = { ...initialResult.itemCounts };
  let stardust = initialResult.stardust;
  let activePlayMs = initialResult.activePlayMs;
  const receiptIds = new Set<string>();
  const appliedReceiptIds: string[] = [];
  const appliedCraftActionIds: string[] = [];
  let targetObservedAt = target !== null && (itemCounts[target.baseId] ?? 0) >= target.quantity
    ? activePlayMs
    : null;

  for (const [eventIndex, event] of input.events.entries()) {
    const rawEvent: unknown = event;
    assertPlainRecord(rawEvent, `economy event ${eventIndex}`);
    if (rawEvent.kind !== 'source-receipt' && rawEvent.kind !== 'craft') {
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
      appliedCraftActionIds.push(eventId);
      if (target !== null && targetObservedAt === null
        && event.baseId === target.baseId && nextCount >= target.quantity) {
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
    appliedReceiptIds,
    appliedCraftActionIds,
  });
  let targetOutcome: EconomyTargetOutcome | null = null;
  if (target !== null) {
    targetOutcome = targetObservedAt !== null
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
