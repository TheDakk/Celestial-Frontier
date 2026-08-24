/* Arc 3 engineering planners.

   These functions are pure preparation boundaries for the existing F3/F4
   one-CAS owner. They never read a clock, DOM, ambient entropy, or mutable app
   singleton. A successful plan returns one registered EngineeringState
   successor and a bounded canonical witness; callers may publish neither
   until the outer transaction commits that exact witness and carrier.

   Source identity is always a full registered CF1 address. Numeric equipment
   bonuses are never accepted: the only capability input is a privately
   registered @cf/domain-loot projection of exact equipped instances and built
   systems. */
import {
  LEGACY_MATERIAL_IDS_V1,
  MAX_LEGACY_ITEM_COUNT,
  LEGACY_RESEARCH_SINKS_V1,
  LEGACY_SIGNATURE_IDS_V1,
  LOOT_CATALOGUE_V1,
  getFixedCraftGenerationPlan,
  getFixedRecipePlan,
  isEngineeringCapabilitySnapshot,
  quoteFixedRecipe,
  type EngineeringCapabilitySnapshot,
  type FixedGearCraftAxes,
  type FixedRecipeInventory,
  type FixedRecipeOutputKind,
  type FixedRecipeQuote,
  type GearGenerationPlan,
} from '@cf/domain-loot';
import {
  AUTO_EXTRACTOR_CADENCE_MS,
  AUTO_EXTRACTOR_MAX_LOADS,
  MAX_ACTIVE_PLAY_MS,
  initializeRecurringAccrual,
  settleRecurringAccrual,
  type ActivePlaySnapshot,
  type RecurringAccrualCursor,
} from '@cf/domain-progression';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import {
  canonicalCF1StarAddressFromNav,
  canonicalCF1WorldAddressFromNav,
  type SurfaceNav,
  type SystemNav,
} from '@cf/scene';
import {
  RARE_VEIN,
  isStarOpportunitySnapshot,
  isWorldOpportunitySnapshot,
  type StarOpportunitySnapshot,
  type WorldOpportunitySnapshot,
} from './snapshot.js';
import {
  MAX_ENGINEERING_REVISION,
  RESEARCH_IDS,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  decodeEngineeringState,
  encodeEngineeringState,
  isEngineeringState,
  type EngineeringStateV2,
  type ResearchId,
} from './state.js';

export const ENGINEERING_WITNESS_SCHEMA = 'cf-v2-engineering-witness/v1' as const;
export const ENGINEERING_OPERATION_SCHEMA = 'cf-v2-engineering-plan/v1' as const;
export const MAX_ENGINEERING_WITNESS_CHARS = 4_096;
const UINT32_MAX = 0xffff_ffff;
const MAX_ASSET_COUNT = 1_000_000_000;
const MAX_MATERIAL_COUNT = 1_000_000;

export interface EngineeringResearchDefinition {
  readonly id: ResearchId;
  readonly name: string;
  readonly description: string;
  readonly materialCost: Readonly<Record<string, number>>;
  readonly stardustCost: number;
  readonly prerequisiteId: ResearchId | null;
  /** No v2 consumer may be claimed until that exact behavior is ported and
      tested. The catalogue remains inspectable while purchase fails closed. */
  readonly consumerStatus: 'unavailable';
}

const RESEARCH_PRESENTATION: Readonly<Record<ResearchId, Readonly<{
  name: string;
  description: string;
  prerequisiteId: ResearchId | null;
}>>> = Object.freeze({
  scan1: Object.freeze({
    name: 'Deep Scanners',
    description: 'Survey cards reveal a world’s mineral veins from orbit',
    prerequisiteId: null,
  }),
  hull1: Object.freeze({
    name: 'Reinforced Hull',
    description: 'Hostile bioscans wound you 25% lighter',
    prerequisiteId: null,
  }),
  lab1: Object.freeze({
    name: 'Xenobotany Lab',
    description: 'Eating flora grows the nourished stat by +1 more',
    prerequisiteId: null,
  }),
  drive1: Object.freeze({
    name: 'Fusion Drive',
    description: 'Hyperlanes run twice as quick',
    prerequisiteId: null,
  }),
  drive2: Object.freeze({
    name: 'Antimatter Drive',
    description: 'Hyperlanes run four times as quick — far jumps stop straining',
    prerequisiteId: 'drive1',
  }),
  drive3: Object.freeze({
    name: 'Warp Fold',
    description: 'Distance becomes a rumor — every jump arrives in a breath',
    prerequisiteId: 'drive2',
  }),
});

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function codeUnitCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function fnv1a32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function fingerprint(prefix: string, value: string): string {
  return `${prefix}:${value.length}:${fnv1a32(value).toString(16).padStart(8, '0')}`;
}

function checkedReceiptOrdinal(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) >= UINT32_MAX) {
    throw new RangeError('engineering receipt ordinal must be an available uint32 ordinal');
  }
  return value as number;
}

function checkedActivePlay(snapshot: Pick<ActivePlaySnapshot, 'activePlayMs'>): number {
  if (!snapshot || !Number.isSafeInteger(snapshot.activePlayMs)
    || snapshot.activePlayMs < 0 || snapshot.activePlayMs > MAX_ACTIVE_PLAY_MS) {
    throw new RangeError('engineering action requires a bounded F4 active-play snapshot');
  }
  return snapshot.activePlayMs;
}

function checkedState(value: EngineeringStateV2): EngineeringStateV2 {
  if (!isEngineeringState(value)) {
    throw new TypeError('engineering planner requires registered EngineeringState authority');
  }
  if (value.revision === MAX_ENGINEERING_REVISION) {
    throw new RangeError('engineering state revision is exhausted');
  }
  return value;
}

function checkedCapabilities(value: EngineeringCapabilitySnapshot): EngineeringCapabilitySnapshot {
  if (!isEngineeringCapabilitySnapshot(value)) {
    throw new TypeError('engineering planner requires registered equipment capability authority');
  }
  return value;
}

function stateFingerprint(state: EngineeringStateV2): string {
  return fingerprint('es2', encodeEngineeringState(state));
}

interface MutableAddressMirror {
  readonly format: 'CF1';
  readonly key: string;
  readonly galaxy: Record<string, unknown>;
  readonly star: Record<string, unknown>;
  readonly planet?: Record<string, unknown>;
}

function addressMirror(
  address: WorldOpportunitySnapshot['address'] | StarOpportunitySnapshot['address'],
): MutableAddressMirror {
  const common = {
    format: 'CF1' as const,
    key: address.key,
    galaxy: {
      seed: address.galaxy.seed,
      x: address.galaxy.x,
      y: address.galaxy.y,
      size: address.galaxy.size,
      sp: address.galaxy.sp,
      tilt: address.galaxy.tilt,
      rot: address.galaxy.rot,
      home: address.galaxy.home,
      quasar: address.galaxy.quasar,
      dwarf: address.galaxy.dwarf,
      parentCell: { x: address.galaxy.parentCell.x, y: address.galaxy.parentCell.y },
    },
    star: {
      seed: address.star.seed,
      x: address.star.x,
      y: address.star.y,
      layer: address.star.layer,
      parentCell: { x: address.star.parentCell.x, y: address.star.parentCell.y },
    },
  };
  return 'planet' in address
    ? { ...common, planet: { seed: address.planet.seed, ordinal: address.planet.ordinal } }
    : common;
}

interface MutableEngineeringWorldMirror {
  key: string;
  address: MutableAddressMirror;
  extractionsTaken: number;
  autoExtractorCursor: RecurringAccrualCursor | null;
}

interface MutableEngineeringStarMirror {
  key: string;
  address: MutableAddressMirror;
  extractionsTaken: number;
}

interface MutableEngineeringStateMirror {
  schema: string;
  revision: number;
  worlds: MutableEngineeringWorldMirror[];
  stars: MutableEngineeringStarMirror[];
  research: ResearchId[];
}

/** Internal operation-owned successor. No generic patch/register function is
 * exported: the only callers below supply changes that were derived by the
 * corresponding deterministic operation. The strict codec re-proves every
 * address and registers the resulting state. */
function successorState(
  state: EngineeringStateV2,
  mutate: (draft: MutableEngineeringStateMirror) => void,
): EngineeringStateV2 {
  const draft = JSON.parse(encodeEngineeringState(state)) as MutableEngineeringStateMirror;
  draft.revision = state.revision + 1;
  mutate(draft);
  draft.worlds.sort((left, right) => codeUnitCompare(left.key, right.key));
  draft.stars.sort((left, right) => codeUnitCompare(left.key, right.key));
  return decodeEngineeringState(JSON.stringify(draft), SCENE_ENGINEERING_ADDRESS_RESOLVER);
}

function worldSuccessor(
  state: EngineeringStateV2,
  opportunity: WorldOpportunitySnapshot,
  extractionsTaken: number,
  cursor: RecurringAccrualCursor | null,
): EngineeringStateV2 {
  return successorState(state, (draft) => {
    const existing = draft.worlds.find((row) => row.key === opportunity.key);
    if (existing) {
      existing.extractionsTaken = extractionsTaken;
      existing.autoExtractorCursor = cursor;
      return;
    }
    draft.worlds.push({
      key: opportunity.key,
      address: addressMirror(opportunity.address),
      extractionsTaken,
      autoExtractorCursor: cursor,
    });
  });
}

function starSuccessor(
  state: EngineeringStateV2,
  opportunity: StarOpportunitySnapshot,
  extractionsTaken: number,
): EngineeringStateV2 {
  return successorState(state, (draft) => {
    const existing = draft.stars.find((row) => row.key === opportunity.key);
    if (existing) existing.extractionsTaken = extractionsTaken;
    else draft.stars.push({
      key: opportunity.key,
      address: addressMirror(opportunity.address),
      extractionsTaken,
    });
  });
}

function reanchorAutoExtractorSuccessor(
  state: EngineeringStateV2,
  activePlayMs: number,
): EngineeringStateV2 {
  return successorState(state, (draft) => {
    for (const row of draft.worlds) {
      if (row.extractionsTaken > 0) row.autoExtractorCursor = initializeRecurringAccrual(activePlayMs);
    }
  });
}

function revisionOnlySuccessor(state: EngineeringStateV2): EngineeringStateV2 {
  return successorState(state, () => undefined);
}

function makeWitness(value: unknown): string {
  const witness = JSON.stringify(value);
  if (witness.length < 1 || witness.length > MAX_ENGINEERING_WITNESS_CHARS) {
    throw new RangeError('engineering witness exceeds the F4 receipt bound');
  }
  return witness;
}

export interface EngineeringQuantity {
  readonly id: string;
  readonly quantity: number;
}

function quantities(values: ReadonlyMap<string, number>): readonly EngineeringQuantity[] {
  return deepFreeze([...values.entries()]
    .filter(([, quantity]) => quantity > 0)
    .sort(([left], [right]) => codeUnitCompare(left, right))
    .map(([id, quantity]) => ({ id, quantity })));
}

const ENGINEERING_PLANS = new WeakSet<object>();

export interface EngineeringActionPlan<TResult> {
  readonly schema: typeof ENGINEERING_OPERATION_SCHEMA;
  readonly status: 'planned';
  readonly operation: 'mine-world' | 'skim-star' | 'fabricate-fixed';
  readonly receiptOrdinal: number;
  readonly previousRevision: number;
  readonly nextRevision: number;
  readonly nextState: EngineeringStateV2;
  readonly result: TResult;
  readonly witness: string;
}

export function isEngineeringActionPlan(value: unknown): value is EngineeringActionPlan<unknown> {
  return typeof value === 'object'
    && value !== null
    && ENGINEERING_PLANS.has(value)
    && (value as EngineeringActionPlan<unknown>).schema === ENGINEERING_OPERATION_SCHEMA;
}

function planned<TResult>(
  operation: EngineeringActionPlan<TResult>['operation'],
  receiptOrdinal: number,
  previous: EngineeringStateV2,
  nextState: EngineeringStateV2,
  result: TResult,
  witnessFacts: Record<string, unknown>,
): EngineeringActionPlan<TResult> {
  const witness = makeWitness({
    schema: ENGINEERING_WITNESS_SCHEMA,
    operation,
    receiptOrdinal,
    previousRevision: previous.revision,
    previousState: stateFingerprint(previous),
    nextRevision: nextState.revision,
    nextState: stateFingerprint(nextState),
    ...witnessFacts,
  });
  const plan = deepFreeze({
    schema: ENGINEERING_OPERATION_SCHEMA,
    status: 'planned' as const,
    operation,
    receiptOrdinal,
    previousRevision: previous.revision,
    nextRevision: nextState.revision,
    nextState,
    result,
    witness,
  });
  ENGINEERING_PLANS.add(plan);
  return plan;
}

export type MiningRefusalReason =
  | 'current-surface-unproven'
  | 'current-world-mismatch'
  | 'earth-protected'
  | 'biosphere-present'
  | 'mined-out';

export interface EngineeringRefusal<TReason extends string> {
  readonly status: 'refused';
  readonly reason: TReason;
}

export interface MiningAutoExtractorSettlement {
  readonly online: boolean;
  readonly initialized: boolean;
  readonly priorCollectedThroughActivePlayMs: number | null;
  readonly nextCollectedThroughActivePlayMs: number | null;
  readonly matured: number;
  readonly due: number;
  readonly discardedByBatchCap: number;
  readonly discardedByReserve: number;
  readonly capped: boolean;
  readonly grantedLoads: number;
}

export interface MiningResult {
  readonly sourceKey: string;
  readonly rawTier: number;
  readonly reservePulls: number;
  readonly firstExtractionIndex: number;
  readonly loads: number;
  readonly manualLoads: 1;
  readonly autoExtractor: MiningAutoExtractorSettlement;
  readonly materials: readonly EngineeringQuantity[];
  readonly exceptionalMaterials: readonly EngineeringQuantity[];
  readonly richStrikes: number;
  readonly cosmicFinds: number;
  readonly exceptionalFinds: number;
  readonly traceFingerprint: string;
  readonly extractionsTaken: number;
  readonly pullsRemaining: number;
  readonly firstMine: boolean;
  readonly minedOut: boolean;
}

export interface MineWorldInput {
  readonly state: EngineeringStateV2;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly currentSurface: SurfaceNav;
  readonly capabilities: EngineeringCapabilitySnapshot;
  readonly activePlay: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly receiptOrdinal: number;
}

function worldOpportunityFingerprint(opportunity: WorldOpportunitySnapshot): string {
  return fingerprint('wo2', JSON.stringify({
    key: opportunity.key,
    rawTier: opportunity.rawTier,
    source: opportunity.source,
    deposits: opportunity.deposits,
    biomeVein: opportunity.biomeVein,
    cosmicVein: opportunity.cosmicVein,
    exceptionalVein: opportunity.exceptionalVein,
    reservePulls: opportunity.reservePulls,
  }));
}

/** Plan one manual mining load plus any Auto-Extractor loads matured from the
 * prior source-owned cursor. No caller may supply a settlement or bonus. */
export function planWorldMining(
  input: MineWorldInput,
): EngineeringActionPlan<MiningResult> | EngineeringRefusal<MiningRefusalReason> {
  const state = checkedState(input.state);
  if (!isWorldOpportunitySnapshot(input.opportunity)) {
    throw new TypeError('mining requires a registered world opportunity snapshot');
  }
  const capabilities = checkedCapabilities(input.capabilities);
  const activePlayMs = checkedActivePlay(input.activePlay);
  const receiptOrdinal = checkedReceiptOrdinal(input.receiptOrdinal);
  const current = canonicalCF1WorldAddressFromNav(input.currentSurface);
  if (!current.ok) return deepFreeze({ status: 'refused', reason: 'current-surface-unproven' });
  if (current.address.key !== input.opportunity.key) {
    return deepFreeze({ status: 'refused', reason: 'current-world-mismatch' });
  }
  if (input.opportunity.address.planet.seed === 133) {
    return deepFreeze({ status: 'refused', reason: 'earth-protected' });
  }
  if (input.opportunity.source.biosphereKey !== 'none') {
    return deepFreeze({ status: 'refused', reason: 'biosphere-present' });
  }

  const prior = state.worlds.find(({ key }) => key === input.opportunity.key);
  const taken = Math.min(prior?.extractionsTaken ?? 0, input.opportunity.reservePulls);
  if (taken >= input.opportunity.reservePulls) {
    return deepFreeze({ status: 'refused', reason: 'mined-out' });
  }

  let cursor = prior?.autoExtractorCursor ?? null;
  let settlement: MiningAutoExtractorSettlement;
  if (!capabilities.autoExtractor) {
    settlement = deepFreeze({
      online: false,
      initialized: false,
      priorCollectedThroughActivePlayMs: cursor?.collectedThroughActivePlayMs ?? null,
      nextCollectedThroughActivePlayMs: cursor?.collectedThroughActivePlayMs ?? null,
      matured: 0,
      due: 0,
      discardedByBatchCap: 0,
      discardedByReserve: 0,
      capped: false,
      grantedLoads: 0,
    });
  } else if (cursor === null) {
    cursor = initializeRecurringAccrual(activePlayMs);
    settlement = deepFreeze({
      online: true,
      initialized: true,
      priorCollectedThroughActivePlayMs: null,
      nextCollectedThroughActivePlayMs: activePlayMs,
      matured: 0,
      due: 0,
      discardedByBatchCap: 0,
      discardedByReserve: 0,
      capped: false,
      grantedLoads: 0,
    });
  } else {
    const accrued = settleRecurringAccrual(cursor, activePlayMs, {
      cadenceMs: AUTO_EXTRACTOR_CADENCE_MS,
      maxBatch: AUTO_EXTRACTOR_MAX_LOADS,
    });
    const availableAfterManual = input.opportunity.reservePulls - taken - 1;
    const grantedLoads = Math.min(accrued.due, availableAfterManual);
    cursor = accrued.next;
    settlement = deepFreeze({
      online: true,
      initialized: false,
      priorCollectedThroughActivePlayMs: prior!.autoExtractorCursor!.collectedThroughActivePlayMs,
      nextCollectedThroughActivePlayMs: accrued.next.collectedThroughActivePlayMs,
      matured: accrued.matured,
      due: accrued.due,
      discardedByBatchCap: accrued.discarded,
      discardedByReserve: accrued.due - grantedLoads,
      capped: accrued.capped,
      grantedLoads,
    });
  }

  const loads = 1 + settlement.grantedLoads;
  const materialTotals = new Map<string, number>();
  const exceptionalTotals = new Map<string, number>();
  const trace: string[] = [];
  let richStrikes = 0;
  let cosmicFinds = 0;
  let exceptionalFinds = 0;
  const multiplier = 1 + capabilities.miningYieldBonus;

  for (let offset = 0; offset < loads; offset++) {
    const extractionIndex = taken + offset + 1;
    const random = mulberry32(hashInt(
      input.opportunity.source.planetSeed >>> 0,
      0xE1F,
      extractionIndex,
    ) >>> 0);
    const row: string[] = [`pull:${extractionIndex}`];
    for (let draw = 0; draw < 2 && input.opportunity.deposits.length; draw++) {
      const material = input.opportunity.deposits[(random() * input.opportunity.deposits.length) | 0]!;
      const quantity = Math.max(1, Math.round(
        (1 + random() * 3 + Math.floor(input.opportunity.rawTier / 3)) * multiplier,
      ));
      materialTotals.set(material, (materialTotals.get(material) ?? 0) + quantity);
      row.push(`base:${material}:${quantity}`);
    }
    /* Consumed even without a biome vein: this draw position is legacy
       determinism and must not shift the rich-strike decision below it. */
    const biomeRoll = random();
    if (input.opportunity.biomeVein && biomeRoll < 0.25) {
      const material = input.opportunity.biomeVein;
      materialTotals.set(material, (materialTotals.get(material) ?? 0) + 1);
      row.push(`biome:${material}:1`);
    }
    if (random() < 0.05 + input.opportunity.rawTier * 0.01 + capabilities.richStrikeChanceBonus) {
      const material = input.opportunity.biomeVein
        || RARE_VEIN[Math.min(
          RARE_VEIN.length - 1,
          (random() * (1 + input.opportunity.rawTier)) | 0,
        )]!;
      const quantity = Math.max(1, Math.round(multiplier));
      materialTotals.set(material, (materialTotals.get(material) ?? 0) + quantity);
      richStrikes += 1;
      row.push(`rich:${material}:${quantity}`);
    }
    if (input.opportunity.cosmicVein && random() < 0.04) {
      const material = input.opportunity.cosmicVein;
      const quantity = Math.max(1, Math.round(multiplier));
      materialTotals.set(material, (materialTotals.get(material) ?? 0) + quantity);
      cosmicFinds += 1;
      row.push(`cosmic:${material}:${quantity}`);
    }
    if (input.opportunity.exceptionalVein && random() < 0.10) {
      const material = input.opportunity.exceptionalVein;
      materialTotals.set(material, (materialTotals.get(material) ?? 0) + 1);
      exceptionalTotals.set(material, (exceptionalTotals.get(material) ?? 0) + 1);
      exceptionalFinds += 1;
      row.push(`exceptional:${material}:1`);
    }
    trace.push(row.join('|'));
  }

  const extractionsTaken = taken + loads;
  const nextState = worldSuccessor(state, input.opportunity, extractionsTaken, cursor);
  const result: MiningResult = deepFreeze({
    sourceKey: input.opportunity.key,
    rawTier: input.opportunity.rawTier,
    reservePulls: input.opportunity.reservePulls,
    firstExtractionIndex: taken + 1,
    loads,
    manualLoads: 1,
    autoExtractor: settlement,
    materials: quantities(materialTotals),
    exceptionalMaterials: quantities(exceptionalTotals),
    richStrikes,
    cosmicFinds,
    exceptionalFinds,
    traceFingerprint: fingerprint('mine-trace-v1', trace.join('\n')),
    extractionsTaken,
    pullsRemaining: input.opportunity.reservePulls - extractionsTaken,
    firstMine: (prior?.extractionsTaken ?? 0) === 0,
    minedOut: extractionsTaken === input.opportunity.reservePulls,
  });
  return planned('mine-world', receiptOrdinal, state, nextState, result, {
    sourceKey: input.opportunity.key,
    opportunity: worldOpportunityFingerprint(input.opportunity),
    capabilities: capabilities.fingerprint,
    activePlayMs,
    factors: {
      rawTier: input.opportunity.rawTier,
      reservePulls: input.opportunity.reservePulls,
      deposits: input.opportunity.deposits,
      biomeVein: input.opportunity.biomeVein,
      cosmicVein: input.opportunity.cosmicVein,
      exceptionalVein: input.opportunity.exceptionalVein,
      miningYieldBonus: capabilities.miningYieldBonus,
      richStrikeChanceBonus: capabilities.richStrikeChanceBonus,
    },
    result,
  });
}

export type StellarSkimRefusalReason =
  | 'current-star-unproven'
  | 'current-star-mismatch'
  | 'unsupported-star-class'
  | 'jump-drive-required'
  | 'corona-spent'
  | 'remnant-hp-guard';

export interface StellarSkimResult {
  readonly sourceKey: string;
  readonly material: 'Pls' | 'Crn';
  readonly quantity: number;
  readonly rawTier: number;
  readonly reservePasses: number;
  readonly extractionIndex: number;
  readonly extractionsTaken: number;
  readonly passesRemaining: number;
  readonly priorHp: number;
  readonly damage: 0 | 3;
  readonly nextHp: number;
  readonly remnantHazard: boolean;
  readonly guarded: boolean;
}

export interface SkimStarInput {
  readonly state: EngineeringStateV2;
  readonly opportunity: StarOpportunitySnapshot;
  readonly currentSystem: SystemNav;
  readonly capabilities: EngineeringCapabilitySnapshot;
  readonly playerHp: number;
  readonly activePlay: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly receiptOrdinal: number;
}

function checkedPlayerHp(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > MAX_ASSET_COUNT) {
    throw new RangeError('stellar skim playerHp must be a bounded non-negative integer');
  }
  return value as number;
}

function starOpportunityFingerprint(opportunity: StarOpportunitySnapshot): string {
  return fingerprint('so2', JSON.stringify({
    key: opportunity.key,
    source: opportunity.source,
    rawTier: opportunity.rawTier,
    material: opportunity.material,
    baseReservePasses: opportunity.baseReservePasses,
    remnantHazard: opportunity.remnantHazard,
    requiresJumpDrive: opportunity.requiresJumpDrive,
  }));
}

export function planStellarSkim(
  input: SkimStarInput,
): EngineeringActionPlan<StellarSkimResult> | EngineeringRefusal<StellarSkimRefusalReason> {
  const state = checkedState(input.state);
  if (!isStarOpportunitySnapshot(input.opportunity)) {
    throw new TypeError('stellar skimming requires a registered star opportunity snapshot');
  }
  const capabilities = checkedCapabilities(input.capabilities);
  const activePlayMs = checkedActivePlay(input.activePlay);
  const receiptOrdinal = checkedReceiptOrdinal(input.receiptOrdinal);
  const priorHp = checkedPlayerHp(input.playerHp);
  const current = canonicalCF1StarAddressFromNav(input.currentSystem);
  if (!current.ok) return deepFreeze({ status: 'refused', reason: 'current-star-unproven' });
  if (current.address.key !== input.opportunity.key) {
    return deepFreeze({ status: 'refused', reason: 'current-star-mismatch' });
  }
  if (input.opportunity.material === null) {
    return deepFreeze({ status: 'refused', reason: 'unsupported-star-class' });
  }
  if (!capabilities.jumpDrive) {
    return deepFreeze({ status: 'refused', reason: 'jump-drive-required' });
  }
  const reservePasses = Math.round(
    input.opportunity.baseReservePasses * (1 + 0.5 * capabilities.stellarSkimBonus),
  );
  const prior = state.stars.find(({ key }) => key === input.opportunity.key);
  const taken = Math.min(prior?.extractionsTaken ?? 0, reservePasses);
  if (taken >= reservePasses) return deepFreeze({ status: 'refused', reason: 'corona-spent' });
  const guarded = capabilities.stellarSkimGuard;
  if (input.opportunity.remnantHazard && !guarded && priorHp <= 4) {
    return deepFreeze({ status: 'refused', reason: 'remnant-hp-guard' });
  }
  const damage: 0 | 3 = input.opportunity.remnantHazard && !guarded ? 3 : 0;
  const random = mulberry32(hashInt(
    input.opportunity.source.starSeed >>> 0,
    0x5C2,
    taken + 1,
  ) >>> 0);
  const quantity = 1 + ((random() * 2) | 0) + capabilities.stellarSkimBonus;
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError('stellar skim capability produced a non-integer legacy quantity');
  }
  const extractionsTaken = taken + 1;
  const nextState = starSuccessor(state, input.opportunity, extractionsTaken);
  const result: StellarSkimResult = deepFreeze({
    sourceKey: input.opportunity.key,
    material: input.opportunity.material,
    quantity,
    rawTier: input.opportunity.rawTier,
    reservePasses,
    extractionIndex: extractionsTaken,
    extractionsTaken,
    passesRemaining: reservePasses - extractionsTaken,
    priorHp,
    damage,
    nextHp: priorHp - damage,
    remnantHazard: input.opportunity.remnantHazard,
    guarded,
  });
  return planned('skim-star', receiptOrdinal, state, nextState, result, {
    sourceKey: input.opportunity.key,
    opportunity: starOpportunityFingerprint(input.opportunity),
    capabilities: capabilities.fingerprint,
    activePlayMs,
    factors: {
      stellarSkimBonus: capabilities.stellarSkimBonus,
      stellarSkimGuard: capabilities.stellarSkimGuard,
      jumpDrive: capabilities.jumpDrive,
      priorHp,
    },
    result,
  });
}

const researchSinkById = new Map(LEGACY_RESEARCH_SINKS_V1.map((sink) => [sink.id, sink]));

export const ENGINEERING_RESEARCH_CATALOGUE: readonly EngineeringResearchDefinition[] = deepFreeze(
  RESEARCH_IDS.map((id) => {
    const sink = researchSinkById.get(id);
    if (!sink) throw new Error(`research ${id} has no exact economy sink`);
    return {
      id,
      ...RESEARCH_PRESENTATION[id],
      materialCost: sink.materialCost,
      stardustCost: sink.stardustCost,
      consumerStatus: 'unavailable' as const,
    };
  }),
);

export interface EngineeringResearchAssets {
  readonly materials: Readonly<Record<string, number>>;
  readonly stardust: number;
}

export interface EngineeringResearchQuote {
  readonly id: ResearchId;
  readonly owned: boolean;
  readonly prerequisiteId: ResearchId | null;
  readonly missingPrerequisiteId: ResearchId | null;
  readonly missingMaterials: readonly Readonly<{
    id: string;
    required: number;
    available: number;
    missing: number;
  }>[];
  readonly missingStardust: number;
  readonly consumerStatus: 'unavailable';
}

export type ResearchRefusalReason =
  | 'already-owned'
  | 'prerequisite-missing'
  | 'insufficient-assets'
  | 'consumer-unavailable';

export interface ResearchRefusal extends EngineeringRefusal<ResearchRefusalReason> {
  readonly quote: EngineeringResearchQuote;
}

function checkedQuantityMap(
  value: Readonly<Record<string, number>>,
  allowed: ReadonlySet<string>,
  label: string,
  maximum = MAX_MATERIAL_COUNT,
): Readonly<Record<string, number>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be a quantity map`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain quantity map`);
  }
  const result: Record<string, number> = {};
  for (const id of Object.keys(value).sort(codeUnitCompare)) {
    if (!allowed.has(id)) throw new RangeError(`${label} contains unknown id ${id}`);
    const quantity = value[id];
    if (!Number.isSafeInteger(quantity) || quantity! < 0 || quantity! > maximum) {
      throw new RangeError(`${label} ${id} must be a bounded non-negative integer`);
    }
    result[id] = quantity!;
  }
  return Object.freeze(result);
}

const MATERIAL_IDS = new Set<string>(LEGACY_MATERIAL_IDS_V1);
const ITEM_IDS = new Set<string>(LOOT_CATALOGUE_V1.map(({ id }) => id));
const SIGNATURE_IDS = new Set<string>(LEGACY_SIGNATURE_IDS_V1);

export function planResearchPurchase(
  stateValue: EngineeringStateV2,
  researchId: ResearchId,
  assetsValue: EngineeringResearchAssets,
): ResearchRefusal {
  const state = checkedState(stateValue);
  if (typeof researchId !== 'string' || !RESEARCH_IDS.includes(researchId)) {
    throw new RangeError('engineering research id is not recognized');
  }
  const definition = ENGINEERING_RESEARCH_CATALOGUE.find(({ id }) => id === researchId)!;
  const materials = checkedQuantityMap(assetsValue?.materials, MATERIAL_IDS, 'research materials');
  if (!Number.isSafeInteger(assetsValue?.stardust)
    || assetsValue.stardust < 0 || assetsValue.stardust > MAX_ASSET_COUNT) {
    throw new RangeError('research stardust must be a bounded non-negative integer');
  }
  const missingMaterials = Object.entries(definition.materialCost).flatMap(([id, required]) => {
    const available = materials[id] ?? 0;
    return available < required ? [{ id, required, available, missing: required - available }] : [];
  });
  const owned = state.research.includes(researchId);
  const missingPrerequisiteId = definition.prerequisiteId !== null
    && !state.research.includes(definition.prerequisiteId)
    ? definition.prerequisiteId
    : null;
  const missingStardust = Math.max(0, definition.stardustCost - assetsValue.stardust);
  const quote: EngineeringResearchQuote = deepFreeze({
    id: researchId,
    owned,
    prerequisiteId: definition.prerequisiteId,
    missingPrerequisiteId,
    missingMaterials,
    missingStardust,
    consumerStatus: 'unavailable',
  });
  const reason: ResearchRefusalReason = owned
    ? 'already-owned'
    : missingPrerequisiteId !== null
      ? 'prerequisite-missing'
      : missingMaterials.length > 0 || missingStardust > 0
        ? 'insufficient-assets'
        : 'consumer-unavailable';
  return deepFreeze({ status: 'refused', reason, quote });
}

export interface FixedFabricationAssets extends FixedRecipeInventory {
  /** Exceptional units are a checked sub-count of materials. They spend
      first. A fully exceptional slotted craft is refused until the exact
      crafted-affix consumer is implemented. */
  readonly exceptionalMaterials: Readonly<Record<string, number>>;
}

export interface FixedFabricationConsumption {
  readonly materials: readonly EngineeringQuantity[];
  readonly exceptionalMaterials: readonly EngineeringQuantity[];
  readonly itemCounts: readonly EngineeringQuantity[];
  readonly stardust: number;
}

export interface Arc2FabricationDirective {
  readonly authority: 'legacy-v1.8.9-items';
  readonly baseId: string;
  readonly outputKind: FixedRecipeOutputKind;
  readonly consume: FixedFabricationConsumption;
  readonly preservePrerequisiteId: string | null;
  readonly preserveSignatureId: string | null;
  readonly grantCount: 1;
  readonly gearAxes: FixedGearCraftAxes | null;
  readonly gearGenerationPlan: GearGenerationPlan | null;
  readonly autoExtractorReanchoredWorlds: number;
}

export interface FixedFabricationResult {
  readonly baseId: string;
  readonly quote: FixedRecipeQuote;
  readonly arc2: Arc2FabricationDirective;
}

export type FixedFabricationRefusalReason =
  | 'already-built'
  | 'prerequisite-missing'
  | 'signature-missing'
  | 'insufficient-assets'
  | 'output-count-exhausted'
  | 'exceptional-slotted-policy-unavailable';

export interface FixedFabricationRefusal extends EngineeringRefusal<FixedFabricationRefusalReason> {
  readonly quote: FixedRecipeQuote;
}

export interface FixedFabricationInput {
  readonly state: EngineeringStateV2;
  readonly baseId: string;
  readonly assets: FixedFabricationAssets;
  readonly activePlay: Pick<ActivePlaySnapshot, 'activePlayMs'>;
  readonly receiptOrdinal: number;
}

function canonicalFabricationAssets(value: FixedFabricationAssets): FixedFabricationAssets {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('fixed fabrication assets must be an object');
  }
  const materials = checkedQuantityMap(value.materials, MATERIAL_IDS, 'fixed fabrication materials');
  const itemCounts = checkedQuantityMap(
    value.itemCounts,
    ITEM_IDS,
    'fixed fabrication item counts',
    MAX_LEGACY_ITEM_COUNT,
  );
  const exceptionalMaterials = checkedQuantityMap(
    value.exceptionalMaterials,
    MATERIAL_IDS,
    'fixed fabrication exceptional materials',
  );
  for (const [id, quantity] of Object.entries(exceptionalMaterials)) {
    if (quantity > (materials[id] ?? 0)) {
      throw new RangeError(`exceptional ${id} exceeds total material authority`);
    }
  }
  if (!Number.isSafeInteger(value.stardust) || value.stardust < 0 || value.stardust > MAX_ASSET_COUNT) {
    throw new RangeError('fixed fabrication stardust must be a bounded non-negative integer');
  }
  if (!Array.isArray(value.signatureIds) || value.signatureIds.length > LEGACY_SIGNATURE_IDS_V1.length) {
    throw new RangeError('fixed fabrication Signatures exceed the canonical catalogue');
  }
  const signatureIds: string[] = [];
  for (const id of value.signatureIds) {
    if (typeof id !== 'string' || !SIGNATURE_IDS.has(id)) {
      throw new RangeError(`fixed fabrication has unknown Signature ${String(id)}`);
    }
    if (signatureIds.includes(id)) throw new RangeError(`fixed fabrication repeats Signature ${id}`);
    signatureIds.push(id);
  }
  signatureIds.sort(codeUnitCompare);
  return deepFreeze({ materials, itemCounts, stardust: value.stardust, signatureIds, exceptionalMaterials });
}

function mapFromRecord(value: Readonly<Record<string, number>>): Map<string, number> {
  return new Map(Object.entries(value));
}

function fabricationRefusalReason(quote: FixedRecipeQuote): FixedFabricationRefusalReason {
  if (quote.alreadyBuilt) return 'already-built';
  if (quote.missingPrerequisiteId !== null) return 'prerequisite-missing';
  if (quote.missingSignatureId !== null) return 'signature-missing';
  return 'insufficient-assets';
}

/** Prepare one fixed legacy craft. This consumes no SessionRNG draw. The F4
 * receipt ordinal deterministically binds generated-gear metadata while the
 * outer Arc2 owner remains responsible for exact inventory mutation. */
export function planFixedFabrication(
  input: FixedFabricationInput,
): EngineeringActionPlan<FixedFabricationResult> | FixedFabricationRefusal {
  const state = checkedState(input.state);
  const activePlayMs = checkedActivePlay(input.activePlay);
  const receiptOrdinal = checkedReceiptOrdinal(input.receiptOrdinal);
  const assets = canonicalFabricationAssets(input.assets);
  const recipe = getFixedRecipePlan(input.baseId);
  const quote = quoteFixedRecipe(input.baseId, assets);
  if (!quote.craftable) {
    return deepFreeze({ status: 'refused', reason: fabricationRefusalReason(quote), quote });
  }
  if (recipe.outputKind === 'stackable'
    && (assets.itemCounts[recipe.baseId] ?? 0) >= MAX_LEGACY_ITEM_COUNT) {
    return deepFreeze({ status: 'refused', reason: 'output-count-exhausted', quote });
  }

  const materialCost = Object.entries(recipe.materialCost);
  const fullyExceptional = materialCost.length > 0
    && materialCost.every(([id, quantity]) => (assets.exceptionalMaterials[id] ?? 0) >= quantity);
  if (recipe.outputKind === 'gear-instance' && fullyExceptional) {
    return deepFreeze({
      status: 'refused',
      reason: 'exceptional-slotted-policy-unavailable',
      quote,
    });
  }

  const exceptionalSpend = new Map<string, number>();
  for (const [id, quantity] of materialCost) {
    exceptionalSpend.set(id, Math.min(quantity, assets.exceptionalMaterials[id] ?? 0));
  }
  const generationSeed = hashInt(
    fnv1a32(recipe.baseId),
    receiptOrdinal,
    state.revision + 1,
  ) >>> 0;
  const generationPlan = recipe.outputKind === 'gear-instance'
    ? getFixedCraftGenerationPlan(recipe.baseId, generationSeed)
    : null;
  const autoExtractorReanchoredWorlds = recipe.baseId === 'autoext'
    ? state.worlds.filter(({ extractionsTaken }) => extractionsTaken > 0).length
    : 0;
  const nextState = recipe.baseId === 'autoext'
    ? reanchorAutoExtractorSuccessor(state, activePlayMs)
    : revisionOnlySuccessor(state);
  const arc2: Arc2FabricationDirective = deepFreeze({
    authority: recipe.authority,
    baseId: recipe.baseId,
    outputKind: recipe.outputKind,
    consume: {
      materials: quantities(mapFromRecord(recipe.materialCost)),
      exceptionalMaterials: quantities(exceptionalSpend),
      itemCounts: quantities(mapFromRecord(recipe.partCost)),
      stardust: recipe.stardustCost,
    },
    preservePrerequisiteId: recipe.prerequisiteId,
    preserveSignatureId: recipe.signatureId,
    grantCount: 1,
    gearAxes: recipe.gearAxes,
    gearGenerationPlan: generationPlan,
    autoExtractorReanchoredWorlds,
  });
  const result: FixedFabricationResult = deepFreeze({ baseId: recipe.baseId, quote, arc2 });
  return planned('fabricate-fixed', receiptOrdinal, state, nextState, result, {
    sourceKey: `recipe:${recipe.baseId}`,
    activePlayMs,
    assets: fingerprint('fabrication-assets-v1', JSON.stringify(assets)),
    recipe: fingerprint('fixed-recipe-v1', JSON.stringify(recipe)),
    result,
  });
}
