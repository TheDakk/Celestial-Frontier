/* Arc 2 GearInstance authority.

   Occurrence is deliberately outside this module. Phase 1 owns the strict
   instance shape, canonical legacy content, and receipt-local identity; it does
   not pretend the still-unapproved source/depth pools or recipe/socket tables
   exist. A later source-table owner derives one plan from generation.seed and
   seals it in the F4 receipt transaction. This file has no entropy or clock. */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import {
  GEAR_SLOTS,
  LOOT_CATALOGUE_V1,
  SLOTTED_GEAR_BASES_V1,
  UNIVERSAL_RARITY_TIERS,
  getLootCatalogueDefinition,
  type CatalogueEffects,
  type GearRarity,
  type GearSlot,
  type SlottedCatalogueDefinition,
} from './catalogue.js';
import {
  UINT32_MAX,
  assertExactKeys,
  assertPlainRecord,
  canonicalJson,
  checkedInteger,
  deepFreeze,
  fnv1a32,
} from './internal.js';

export const GEAR_SCHEMA = 1 as const;
export const LOOT_TABLE_VERSION = 1 as const;
export const MAX_RECEIPT_LOCAL_ORDINAL = 65_535;
export const MAX_GEAR_JSON_BYTES = 16_384;
export const MAX_LEGACY_ITEM_COUNT = 999;
export const LEGACY_BASE_ORDINAL_STRIDE = 1_000;

export const GEAR_SOURCE_KINDS = Object.freeze([
  'craft', 'conquest', 'guardian', 'expedition', 'discovery', 'legacy-migration',
] as const);
export type GearSourceKind = (typeof GEAR_SOURCE_KINDS)[number];
export type AffixRole = 'prefix' | 'suffix';
export type GearConstruction = 'generated' | 'legacy';
export type GearBaseDefinition = SlottedCatalogueDefinition;

/** Compatibility alias retained for Arc 2 starter callers. Its contents are
 * now the exact 42-definition legacy manifest. */
export const CORE_GEAR_BASES_V1: readonly GearBaseDefinition[] = SLOTTED_GEAR_BASES_V1;

const SOURCE_PREFIX = 'loot1';
const INSTANCE_PREFIX = 'gear1';
const OPTIONAL_SOURCE_SENTINEL = '';
const MAX_ACTION_COMPONENT_CHARS = 192;
const MAX_PROVENANCE_ID_CHARS = 512;
const MAX_SOURCE_ACTION_ID_CHARS = 2_048;
const LEGACY_RAW_RARITY_TIER_MAX = 14;

export interface GearActionIdentity {
  readonly kind: GearSourceKind;
  readonly ownerId: string;
  readonly actionKey: string;
  readonly worldId?: string;
  readonly missionId?: string;
  readonly receiptId?: string;
}

/** Exact approved Arc 2 provenance surface. Builder-only owner/action
 * components remain inside sourceActionId and are never duplicated here. */
export interface GearProvenance {
  readonly kind: GearSourceKind;
  readonly sourceActionId: string;
  readonly worldId?: string;
  readonly missionId?: string;
  readonly receiptId?: string;
}

export interface LegacyAffixDefinition {
  readonly key: 'yield' | 'strike' | 'scut' | 'contact' | 'land' | 'heal';
  readonly percent: boolean;
  readonly min: number;
  readonly max: number;
  readonly label: string;
}

export interface GearNaturalAffix {
  readonly affixId: LegacyAffixDefinition['key'];
  readonly role: AffixRole;
  readonly value: number;
  readonly tier: number;
}
export type GearAffix = GearNaturalAffix;

export interface GearRecipeModifier {
  readonly affixId: string;
  readonly tier: number;
  readonly value: number;
}

/** Phase-1 construction input. The source-owned loot-table owner will derive
 * this plan from generation.seed in the next batch. Until those tables exist,
 * callers must name the canonical base/axes explicitly; this module invents
 * no source pool, drop weighting, quality curve, recipe, upgrade, or socket. */
export interface GearGenerationPlan {
  readonly baseId: string;
  /** Exact entropy supplied by the source/F4 outcome owner. */
  readonly generationSeed: number;
  readonly itemLevel: number;
  readonly quality: number;
  readonly rarityTier: number;
  readonly naturalAffixes: readonly GearNaturalAffix[];
  readonly craftedModifier: GearRecipeModifier | null;
  readonly drawback: GearRecipeModifier | null;
  readonly upgrade: number;
  readonly sockets: readonly string[];
}

/** A v1 save has one worn affix keyed by slot/base, but no prefix/suffix
 * concept. Keep that truth separate instead of fabricating a position. */
export interface LegacyBoundAffix {
  readonly affixId: LegacyAffixDefinition['key'];
  readonly value: number;
  readonly forBaseId: string;
}

export interface GearInstance {
  readonly schema: typeof GEAR_SCHEMA;
  readonly tableVersion: typeof LOOT_TABLE_VERSION;
  readonly construction: GearConstruction;
  readonly instanceId: string;
  readonly baseId: string;
  readonly baseName: string;
  readonly slot: GearSlot;
  readonly baseTier: number;
  readonly itemLevel: number;
  /** Construction quality remains a distinct source-owned integer axis. */
  readonly quality: number;
  readonly rarityTier: number;
  readonly rarity: GearRarity;
  /** Search facets mechanically derived from exact category/slot/effect keys. */
  readonly tags: readonly string[];
  readonly baseEffects: CatalogueEffects;
  /** Exact authored legacy effect keys; no synthetic implicit IDs. */
  readonly implicits: readonly string[];
  readonly naturalAffixes: readonly GearNaturalAffix[];
  readonly craftedModifier?: GearRecipeModifier;
  readonly drawback?: GearRecipeModifier;
  readonly upgrade: number;
  readonly sockets: readonly string[];
  readonly generation: Readonly<{ seed: number; ordinal: number }>;
  /** Explicit migration-only carrier: v1 had no prefix/suffix role. */
  readonly legacyAffix: LegacyBoundAffix | null;
  readonly provenance: GearProvenance;
}

export interface LegacyEquippedAffix {
  readonly k: LegacyAffixDefinition['key'];
  readonly v: number;
  readonly forId: string;
}

export interface LegacyGearMigrationInput {
  readonly sourceActionId: string;
  readonly itemCounts: readonly (readonly [string, number])[];
  readonly equipped: Readonly<Partial<Record<GearSlot, string>>>;
  readonly equippedAffixes: Readonly<Partial<Record<GearSlot, LegacyEquippedAffix>>>;
}

export interface LegacyGearMigrationResult {
  readonly sourceActionId: string;
  readonly instances: readonly GearInstance[];
  readonly equipped: readonly Readonly<{ slot: GearSlot; instanceId: string }>[];
  readonly stackableCounts: readonly Readonly<{ baseId: string; count: number }>[];
}

function checkedIdentityText(value: unknown, maxChars: number, label: string): string {
  const scalars = typeof value === 'string' ? [...value] : [];
  if (typeof value !== 'string' || scalars.length < 1 || scalars.length > maxChars
    || /[\u0000-\u001f\u007f]/.test(value)
    || scalars.some((character) => character.length === 1
      && character.charCodeAt(0) >= 0xd800 && character.charCodeAt(0) <= 0xdfff)) {
    throw new RangeError(`${label} must be 1–${maxChars} printable scalar characters`);
  }
  return value;
}

function encodedIdentityText(value: unknown, maxChars: number, label: string): string {
  return encodeURIComponent(checkedIdentityText(value, maxChars, label));
}

function decodedIdentityText(value: unknown, maxChars: number, label: string): string {
  if (typeof value !== 'string' || value.length < 1) throw new RangeError(`${label} is absent`);
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { throw new RangeError(`${label} is not canonical URI encoding`); }
  const checked = checkedIdentityText(decoded, maxChars, label);
  if (encodeURIComponent(checked) !== value) throw new RangeError(`${label} is not canonical URI encoding`);
  return checked;
}

function optionalEncodedIdentityText(value: unknown, label: string): string {
  return value === undefined
    ? OPTIONAL_SOURCE_SENTINEL
    : encodedIdentityText(value, MAX_PROVENANCE_ID_CHARS, label);
}

function optionalDecodedIdentityText(value: unknown, label: string): string | undefined {
  return value === OPTIONAL_SOURCE_SENTINEL
    ? undefined
    : decodedIdentityText(value, MAX_PROVENANCE_ID_CHARS, label);
}

function checkedSourceKind(value: unknown): GearSourceKind {
  if (typeof value !== 'string' || !(GEAR_SOURCE_KINDS as readonly string[]).includes(value)) {
    throw new RangeError('gear source kind is not supported');
  }
  return value as GearSourceKind;
}

export function makeGearSourceActionId(identity: GearActionIdentity): string {
  if (!identity || typeof identity !== 'object') throw new TypeError('gear action identity is required');
  const kind = checkedSourceKind(identity.kind);
  const ownerId = encodedIdentityText(identity.ownerId, MAX_ACTION_COMPONENT_CHARS, 'gear source ownerId');
  const actionKey = encodedIdentityText(identity.actionKey, MAX_ACTION_COMPONENT_CHARS, 'gear source actionKey');
  const worldId = optionalEncodedIdentityText(identity.worldId, 'gear provenance worldId');
  const missionId = optionalEncodedIdentityText(identity.missionId, 'gear provenance missionId');
  const receiptId = optionalEncodedIdentityText(identity.receiptId, 'gear provenance receiptId');
  const sourceActionId = `${SOURCE_PREFIX}|${kind}|${ownerId}|${actionKey}|${worldId}|${missionId}|${receiptId}`;
  if (sourceActionId.length > MAX_SOURCE_ACTION_ID_CHARS) {
    throw new RangeError('sourceActionId exceeds its bounded canonical encoding');
  }
  return sourceActionId;
}

export function parseGearSourceActionId(sourceActionId: string): GearActionIdentity {
  if (typeof sourceActionId !== 'string' || sourceActionId.length > MAX_SOURCE_ACTION_ID_CHARS) {
    throw new RangeError('sourceActionId is not a bounded loot receipt identity');
  }
  const parts = sourceActionId.split('|');
  if (parts.length !== 7 || parts[0] !== SOURCE_PREFIX) {
    throw new RangeError('sourceActionId is not a canonical loot1 identity');
  }
  const identity: GearActionIdentity = {
    kind: checkedSourceKind(parts[1]),
    ownerId: decodedIdentityText(parts[2], MAX_ACTION_COMPONENT_CHARS, 'gear source ownerId'),
    actionKey: decodedIdentityText(parts[3], MAX_ACTION_COMPONENT_CHARS, 'gear source actionKey'),
  };
  const worldId = optionalDecodedIdentityText(parts[4], 'gear provenance worldId');
  const missionId = optionalDecodedIdentityText(parts[5], 'gear provenance missionId');
  const receiptId = optionalDecodedIdentityText(parts[6], 'gear provenance receiptId');
  if (worldId !== undefined) (identity as { worldId?: string }).worldId = worldId;
  if (missionId !== undefined) (identity as { missionId?: string }).missionId = missionId;
  if (receiptId !== undefined) (identity as { receiptId?: string }).receiptId = receiptId;
  const canonical = makeGearSourceActionId(identity);
  if (canonical !== sourceActionId) throw new RangeError('sourceActionId is not canonical');
  return deepFreeze(identity);
}

export function gearInstanceId(sourceActionId: string, ordinal: number): string {
  const canonicalSource = makeGearSourceActionId(parseGearSourceActionId(sourceActionId));
  const checkedOrdinal = checkedInteger(ordinal, 0, MAX_RECEIPT_LOCAL_ORDINAL, 'gear receipt-local ordinal');
  /* Components cannot contain `|`, and the ordinal has one canonical decimal
     spelling. This is an encoding, not a hash, so the bounded pair is injective. */
  return `${INSTANCE_PREFIX}|${canonicalSource}|${checkedOrdinal}`;
}

export function parseGearInstanceId(instanceId: string): { readonly sourceActionId: string; readonly ordinal: number } {
  if (typeof instanceId !== 'string' || instanceId.length > 2_096) {
    throw new RangeError('instanceId is not a bounded gear1 identity');
  }
  const parts = instanceId.split('|');
  if (parts.length !== 9 || parts[0] !== INSTANCE_PREFIX) {
    throw new RangeError('instanceId is not a canonical gear1 identity');
  }
  const sourceActionId = parts.slice(1, 8).join('|');
  const ordinalText = parts[8]!;
  if (!/^(0|[1-9][0-9]{0,4})$/.test(ordinalText)) throw new RangeError('gear ordinal is not canonical decimal');
  const ordinal = checkedInteger(Number(ordinalText), 0, MAX_RECEIPT_LOCAL_ORDINAL, 'gear receipt-local ordinal');
  if (gearInstanceId(sourceActionId, ordinal) !== instanceId) throw new RangeError('instanceId is not canonical');
  return deepFreeze({ sourceActionId, ordinal });
}

export const LEGACY_AFFIX_DEFINITIONS: readonly LegacyAffixDefinition[] = deepFreeze([
  { key: 'yield', percent: true, min: 0.10, max: 0.35, label: 'mining yield' },
  { key: 'strike', percent: true, min: 0.02, max: 0.06, label: 'rich-strike chance' },
  { key: 'scut', percent: true, min: 0.08, max: 0.25, label: 'lighter bioscan wounds' },
  { key: 'contact', percent: false, min: 4, max: 12, label: 'first-contact & capture' },
  { key: 'land', percent: false, min: 4, max: 12, label: 'descent safety' },
  { key: 'heal', percent: true, min: 0.08, max: 0.20, label: 'flora healing' },
]);

function affixDefinition(key: unknown): LegacyAffixDefinition | undefined {
  return typeof key === 'string'
    ? LEGACY_AFFIX_DEFINITIONS.find((candidate) => candidate.key === key)
    : undefined;
}

function affixMagnitude(definitionValue: LegacyAffixDefinition, magnitudeRoll: number, tier: number): number {
  const normalizedTier = Math.min(1, (tier || 0) / 9);
  const roll = 0.5 + 0.5 * magnitudeRoll;
  const magnitude = definitionValue.min
    + (definitionValue.max - definitionValue.min) * roll * (0.6 + 0.4 * normalizedTier);
  return definitionValue.percent ? Math.round(magnitude * 100) / 100 : Math.round(magnitude);
}

/** Exact v1.8.9 six-definition selection and power curve. The injected seed
 * comes from a receipt identity; this function never decides whether loot occurs. */
export function rollLegacyAffix(seed: number, tier: number): Readonly<{ key: LegacyAffixDefinition['key']; value: number }> {
  const safeSeed = checkedInteger(seed, 0, UINT32_MAX, 'legacy affix seed');
  const safeTier = checkedInteger(tier, 0, LEGACY_RAW_RARITY_TIER_MAX, 'legacy affix tier');
  const random = mulberry32(hashInt(safeSeed >>> 0, 0xaff1, (safeTier || 0) + 1) >>> 0);
  const definitionValue = LEGACY_AFFIX_DEFINITIONS[(random() * LEGACY_AFFIX_DEFINITIONS.length) | 0]!;
  return deepFreeze({ key: definitionValue.key, value: affixMagnitude(definitionValue, random(), safeTier) });
}

/* The legacy runtime intentionally had no slot/key restriction: any one of the
   six definitions could be bound to whichever slotted item conquest selected.
   Compatibility therefore means a canonical base/slot and a canonical affix,
   not a newly invented affinity matrix that would invalidate real saves. */
function compatible(definitionValue: LegacyAffixDefinition, base: GearBaseDefinition): boolean {
  return LEGACY_AFFIX_DEFINITIONS.includes(definitionValue)
    && SLOTTED_GEAR_BASES_V1.some((candidate) => candidate.id === base.id && candidate.slot === base.slot);
}

function baseTags(base: GearBaseDefinition): readonly string[] {
  return deepFreeze([base.category, base.slot, ...Object.keys(base.effects).sort()]);
}

function gearProvenance(sourceActionId: string): GearProvenance {
  const source = parseGearSourceActionId(sourceActionId);
  return deepFreeze({
    kind: source.kind,
    sourceActionId,
    ...(source.worldId === undefined ? {} : { worldId: source.worldId }),
    ...(source.missionId === undefined ? {} : { missionId: source.missionId }),
    ...(source.receiptId === undefined ? {} : { receiptId: source.receiptId }),
  });
}

function instanceCore(
  sourceActionId: string,
  ordinal: number,
  base: GearBaseDefinition,
  construction: GearConstruction,
  itemLevel: number,
  quality: number,
  rarityTier: number,
  naturalAffixesValue: readonly GearAffix[],
  craftedModifier: GearRecipeModifier | null,
  drawback: GearRecipeModifier | null,
  upgrade: number,
  sockets: readonly string[],
  legacyAffix: LegacyBoundAffix | null,
  generationSeed: number,
): GearInstance {
  const provenance = gearProvenance(sourceActionId);
  const checkedOrdinal = checkedInteger(ordinal, 0, MAX_RECEIPT_LOCAL_ORDINAL, 'gear receipt-local ordinal');
  const instanceId = gearInstanceId(sourceActionId, checkedOrdinal);
  const instance: GearInstance = {
    schema: GEAR_SCHEMA,
    tableVersion: LOOT_TABLE_VERSION,
    construction,
    instanceId,
    baseId: base.id,
    baseName: base.name,
    slot: base.slot,
    baseTier: base.tier,
    itemLevel,
    quality,
    rarityTier,
    rarity: UNIVERSAL_RARITY_TIERS[rarityTier]!.id,
    tags: [...baseTags(base)],
    baseEffects: structuredClone(base.effects),
    implicits: [...base.implicits],
    naturalAffixes: [...naturalAffixesValue],
    ...(craftedModifier === null ? {} : { craftedModifier: { ...craftedModifier } }),
    ...(drawback === null ? {} : { drawback: { ...drawback } }),
    upgrade,
    sockets: [...sockets],
    generation: { seed: generationSeed, ordinal: checkedOrdinal },
    legacyAffix,
    provenance,
  };
  if (!hasValidAffixLayout(instance)) throw new RangeError('gear affix layout is incompatible with its exact base');
  return deepFreeze(instance);
}

function checkedNaturalAffix(raw: unknown, index: number): GearNaturalAffix {
  assertPlainRecord(raw, `natural affix ${index}`);
  assertExactKeys(raw, ['affixId', 'tier', 'value', 'role'], `natural affix ${index}`);
  const definitionValue = affixDefinition(raw.affixId);
  if (!definitionValue || !validGeneratedAffixValue(definitionValue, raw.value)) {
    throw new RangeError(`natural affix ${index} is unknown or outside its authored range`);
  }
  if (raw.role !== 'prefix' && raw.role !== 'suffix') {
    throw new RangeError(`natural affix ${index} has unsupported role`);
  }
  return {
    affixId: definitionValue.key,
    tier: checkedInteger(raw.tier, 0, 9, `natural affix ${index} tier`),
    value: raw.value,
    role: raw.role,
  };
}

/** Construct one exact item from a caller-owned deterministic plan. Occurrence
 * and plan selection belong to the future source-table + F4 receipt owner. */
export function createGearInstance(
  sourceActionId: string,
  ordinal: number,
  planValue: GearGenerationPlan,
): GearInstance {
  if (parseGearSourceActionId(sourceActionId).kind === 'legacy-migration') {
    throw new RangeError('migration sourceActionId is reserved for deterministic legacy construction');
  }
  assertPlainRecord(planValue, 'GearGenerationPlan');
  assertExactKeys(planValue, [
    'baseId', 'generationSeed', 'itemLevel', 'quality', 'rarityTier', 'naturalAffixes',
    'craftedModifier', 'drawback', 'upgrade', 'sockets',
  ], 'GearGenerationPlan');
  if (typeof planValue.baseId !== 'string') throw new TypeError('GearGenerationPlan baseId must be a string');
  const base = getLootCatalogueDefinition(planValue.baseId);
  if (!base || base.inventoryShape !== 'slotted') throw new RangeError('GearGenerationPlan base is not canonical slotted gear');
  if (!Array.isArray(planValue.naturalAffixes)) throw new TypeError('GearGenerationPlan naturalAffixes must be an array');
  if (planValue.craftedModifier !== null || planValue.drawback !== null) {
    throw new RangeError('craftedModifier and drawback require a named deterministic recipe table');
  }
  if (planValue.upgrade !== 0) throw new RangeError('upgrade requires an authored upgrade table');
  if (!Array.isArray(planValue.sockets) || planValue.sockets.length !== 0) {
    throw new RangeError('sockets require an authored socket catalogue');
  }
  return instanceCore(
    sourceActionId,
    ordinal,
    base,
    'generated',
    checkedInteger(planValue.itemLevel, 0, UINT32_MAX, 'GearGenerationPlan itemLevel'),
    checkedInteger(planValue.quality, 0, UINT32_MAX, 'GearGenerationPlan quality'),
    checkedInteger(planValue.rarityTier, 0, 9, 'GearGenerationPlan rarityTier'),
    planValue.naturalAffixes.map(checkedNaturalAffix),
    null,
    null,
    0,
    [],
    null,
    checkedInteger(planValue.generationSeed, 0, UINT32_MAX, 'GearGenerationPlan generationSeed'),
  );
}

function validGeneratedAffixValue(definitionValue: LegacyAffixDefinition, value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)
    || value < definitionValue.min || value > definitionValue.max) return false;
  return definitionValue.percent
    ? Math.round(value * 100) / 100 === value
    : Number.isInteger(value);
}

/* importSaveV2 canonicalizes known legacy values with clamp(num(v), 0, hi).
   It does not clamp to the rolled minimum or round again, so zero, below-min,
   and arbitrary finite precision inside that imported interval are valid. */
function validImportedLegacyAffixValue(definitionValue: LegacyAffixDefinition, value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
    && value >= 0 && value <= definitionValue.max;
}

function decodeLegacyBoundAffix(raw: unknown, expectedBaseId?: string): LegacyBoundAffix | null {
  if (raw === null) return null;
  assertPlainRecord(raw, 'legacy bound affix');
  assertExactKeys(raw, ['affixId', 'value', 'forBaseId'], 'legacy bound affix');
  const definitionValue = affixDefinition(raw.affixId);
  if (!definitionValue || !validImportedLegacyAffixValue(definitionValue, raw.value)) {
    throw new RangeError('legacy bound affix is unknown or outside its imported range');
  }
  if (typeof raw.forBaseId !== 'string' || (expectedBaseId !== undefined && raw.forBaseId !== expectedBaseId)) {
    throw new RangeError('legacy bound affix does not bind the equipped base');
  }
  const expected = {
    affixId: definitionValue.key,
    value: raw.value,
    forBaseId: raw.forBaseId,
  };
  if (canonicalJson(raw) !== canonicalJson(expected)) throw new RangeError('legacy bound affix metadata is not canonical');
  return deepFreeze(expected);
}

function boundLegacyAffix(raw: unknown, baseId: string): LegacyBoundAffix {
  assertPlainRecord(raw, 'legacy equipped affix');
  assertExactKeys(raw, ['k', 'v', 'forId'], 'legacy equipped affix');
  const definitionValue = affixDefinition(raw.k);
  if (!definitionValue || !validImportedLegacyAffixValue(definitionValue, raw.v)) {
    throw new RangeError('legacy equipped affix is unknown or outside its imported range');
  }
  if (raw.forId !== baseId) throw new RangeError('legacy equipped affix is stale for its equipped base');
  return deepFreeze({
    affixId: definitionValue.key,
    value: raw.v,
    forBaseId: baseId,
  });
}

function createLegacyBaseInstance(
  sourceActionId: string,
  ordinal: number,
  base: GearBaseDefinition,
  legacyAffix: LegacyBoundAffix | null,
): GearInstance {
  const source = parseGearSourceActionId(sourceActionId);
  if (source.kind !== 'legacy-migration') throw new RangeError('legacy gear requires a migration sourceActionId');
  const baseIndex = SLOTTED_GEAR_BASES_V1.findIndex((candidate) => candidate.id === base.id);
  const encodedBaseIndex = Math.floor(ordinal / LEGACY_BASE_ORDINAL_STRIDE);
  const copyIndex = ordinal % LEGACY_BASE_ORDINAL_STRIDE;
  if (baseIndex < 0 || encodedBaseIndex !== baseIndex || copyIndex >= MAX_LEGACY_ITEM_COUNT) {
    throw new RangeError('legacy gear ordinal does not encode its canonical base and copy');
  }
  if (legacyAffix && legacyAffix.forBaseId !== base.id) {
    throw new RangeError('legacy equipped affix does not bind the migrated base');
  }
  /* v1 items had the authored craft tier, no per-copy quality, and no
     prefix/suffix collection. Preserve those facts exactly. */
  return instanceCore(
    sourceActionId,
    ordinal,
    base,
    'legacy',
    base.tier,
    0,
    base.rarityTier,
    [],
    null,
    null,
    0,
    [],
    legacyAffix,
    fnv1a32(gearInstanceId(sourceActionId, ordinal)),
  );
}

function assertSlotRecord(raw: unknown, label: string): asserts raw is Record<string, unknown> {
  assertPlainRecord(raw, label);
  for (const key of Object.keys(raw)) {
    if (!(GEAR_SLOTS as readonly string[]).includes(key)) throw new RangeError(`${label} has unsupported slot ${key}`);
  }
}

/** Deterministically expands the legacy count-map representation into exact
 * instances. Manifest order, never input tuple order, owns local ordinals. */
export function migrateLegacyGear(inputValue: LegacyGearMigrationInput): LegacyGearMigrationResult {
  assertPlainRecord(inputValue, 'legacy gear migration input');
  assertExactKeys(inputValue, ['sourceActionId', 'itemCounts', 'equipped', 'equippedAffixes'], 'legacy gear migration input');
  if (typeof inputValue.sourceActionId !== 'string') throw new TypeError('legacy migration sourceActionId must be a string');
  const source = parseGearSourceActionId(inputValue.sourceActionId);
  if (source.kind !== 'legacy-migration') throw new RangeError('legacy migration requires a migration sourceActionId');
  if (!Array.isArray(inputValue.itemCounts)) throw new TypeError('legacy itemCounts must be an array');
  if (inputValue.itemCounts.length > 62) throw new RangeError('legacy itemCounts exceeds the canonical catalogue');

  const counts = new Map<string, number>();
  for (const [index, entry] of inputValue.itemCounts.entries()) {
    if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string') {
      throw new TypeError(`legacy itemCounts entry ${index} must be an exact [baseId,count] pair`);
    }
    const base = getLootCatalogueDefinition(entry[0]);
    if (!base) throw new RangeError(`legacy itemCounts entry ${index} has unknown base ${entry[0]}`);
    if (counts.has(base.id)) throw new RangeError(`legacy itemCounts repeats base ${base.id}`);
    counts.set(base.id, checkedInteger(entry[1], 0, MAX_LEGACY_ITEM_COUNT, `legacy ${base.id} count`));
  }

  const totalSlotted = SLOTTED_GEAR_BASES_V1.reduce((total, base) => total + (counts.get(base.id) ?? 0), 0);
  if (totalSlotted > MAX_RECEIPT_LOCAL_ORDINAL + 1) {
    throw new RangeError('legacy gear copies exceed the receipt-local ordinal space');
  }
  assertSlotRecord(inputValue.equipped, 'legacy equipped map');
  assertSlotRecord(inputValue.equippedAffixes, 'legacy equipped-affix map');

  const equippedBaseBySlot = new Map<GearSlot, GearBaseDefinition>();
  const legacyAffixBySlot = new Map<GearSlot, LegacyBoundAffix>();
  for (const slot of GEAR_SLOTS) {
    const equippedId = inputValue.equipped[slot];
    if (equippedId !== undefined) {
      if (typeof equippedId !== 'string') throw new TypeError(`legacy equipped ${slot} must be a base id`);
      const base = getLootCatalogueDefinition(equippedId);
      if (!base || base.inventoryShape !== 'slotted' || base.slot !== slot) {
        throw new RangeError(`legacy equipped ${slot} does not name a canonical base for that slot`);
      }
      if ((counts.get(base.id) ?? 0) < 1) throw new RangeError(`legacy equipped ${slot} is not owned`);
      equippedBaseBySlot.set(slot, base);
    }
    const affixValue = inputValue.equippedAffixes[slot];
    if (affixValue !== undefined) {
      const base = equippedBaseBySlot.get(slot);
      if (!base) throw new RangeError(`legacy equipped-affix ${slot} has no equipped base`);
      legacyAffixBySlot.set(slot, boundLegacyAffix(affixValue, base.id));
    }
  }

  const instances: GearInstance[] = [];
  const firstInstanceByBase = new Map<string, GearInstance>();
  for (const [baseIndex, base] of SLOTTED_GEAR_BASES_V1.entries()) {
    const count = counts.get(base.id) ?? 0;
    for (let copy = 0; copy < count; copy++) {
      const isEquippedCopy = copy === 0 && equippedBaseBySlot.get(base.slot)?.id === base.id;
      const instance = createLegacyBaseInstance(
        inputValue.sourceActionId,
        baseIndex * LEGACY_BASE_ORDINAL_STRIDE + copy,
        base,
        isEquippedCopy ? (legacyAffixBySlot.get(base.slot) ?? null) : null,
      );
      instances.push(instance);
      if (copy === 0) firstInstanceByBase.set(base.id, instance);
    }
  }

  const equipped = GEAR_SLOTS.flatMap((slot) => {
    const base = equippedBaseBySlot.get(slot);
    if (!base) return [];
    const instance = firstInstanceByBase.get(base.id);
    if (!instance) throw new RangeError(`legacy equipped ${slot} could not bind an exact copy`);
    return [{ slot, instanceId: instance.instanceId }];
  });
  const catalogueOrder = new Map(LOOT_CATALOGUE_V1.map(({ id }, index) => [id, index]));
  const stackableCounts = [...counts.entries()].flatMap(([baseId, count]) => {
    const base = getLootCatalogueDefinition(baseId);
    return base?.inventoryShape === 'stackable' && count > 0 ? [{ baseId, count }] : [];
  }).sort((left, right) => catalogueOrder.get(left.baseId)! - catalogueOrder.get(right.baseId)!);

  const ids = instances.map((instance) => instance.instanceId);
  if (new Set(ids).size !== ids.length) throw new RangeError('legacy migration produced duplicate instance ids');
  return deepFreeze({ sourceActionId: inputValue.sourceActionId, instances, equipped, stackableCounts });
}

function affixMetadataMatches(affix: GearAffix | LegacyBoundAffix, definitionValue: LegacyAffixDefinition): boolean {
  return ('forBaseId' in affix
      ? validImportedLegacyAffixValue(definitionValue, affix.value)
      : validGeneratedAffixValue(definitionValue, affix.value));
}

export function isAffixCompatible(instance: GearInstance, affix: GearAffix | LegacyBoundAffix): boolean {
  const definitionValue = affixDefinition(affix.affixId);
  const base = SLOTTED_GEAR_BASES_V1.find((candidate) => candidate.id === instance.baseId);
  return !!definitionValue && !!base && base.slot === instance.slot
    && compatible(definitionValue, base)
    && affixMetadataMatches(affix, definitionValue)
    && (!('forBaseId' in affix) || affix.forBaseId === base.id);
}

export function hasValidAffixLayout(instance: GearInstance): boolean {
  const prefixes = instance.naturalAffixes.filter((affix) => affix.role === 'prefix');
  const suffixes = instance.naturalAffixes.filter((affix) => affix.role === 'suffix');
  const keys = [
    ...instance.naturalAffixes.map((affix) => affix.affixId),
    ...(instance.legacyAffix ? [instance.legacyAffix.affixId] : []),
  ];
  return prefixes.length <= 2
    && suffixes.length <= 2
    && prefixes.length + suffixes.length === instance.naturalAffixes.length
    && new Set(keys).size === keys.length
    && instance.naturalAffixes.every((affix) => Number.isInteger(affix.tier)
      && affix.tier >= 0 && affix.tier <= 9 && isAffixCompatible(instance, affix))
    && (instance.legacyAffix === null || isAffixCompatible(instance, instance.legacyAffix));
}

export function encodeGearInstance(instance: GearInstance): string {
  const decoded = decodeGearValue(instance);
  return JSON.stringify(decoded);
}

function decodeGearValue(raw: unknown): GearInstance {
  assertPlainRecord(raw, 'GearInstance');
  assertExactKeys(raw, [
    'schema', 'tableVersion', 'construction', 'instanceId', 'baseId', 'baseName',
    'slot', 'baseTier', 'itemLevel', 'quality', 'rarityTier', 'rarity', 'tags',
    'baseEffects', 'implicits', 'naturalAffixes', 'upgrade', 'sockets',
    'generation', 'legacyAffix', 'provenance',
  ], 'GearInstance');
  if (raw.schema !== GEAR_SCHEMA) throw new RangeError('unsupported GearInstance schema');
  if (raw.tableVersion !== LOOT_TABLE_VERSION) throw new RangeError('unsupported loot table version');
  assertPlainRecord(raw.provenance, 'GearInstance provenance');
  if (typeof raw.provenance.sourceActionId !== 'string') throw new TypeError('GearInstance sourceActionId must be a string');
  const expectedProvenance = gearProvenance(raw.provenance.sourceActionId);
  assertExactKeys(raw.provenance, Object.keys(expectedProvenance), 'GearInstance provenance');
  if (canonicalJson(raw.provenance) !== canonicalJson(expectedProvenance)) {
    throw new RangeError('GearInstance provenance does not match sourceActionId');
  }
  assertPlainRecord(raw.generation, 'GearInstance generation');
  assertExactKeys(raw.generation, ['seed', 'ordinal'], 'GearInstance generation');
  const ordinal = checkedInteger(raw.generation.ordinal, 0, MAX_RECEIPT_LOCAL_ORDINAL, 'GearInstance ordinal');

  let expected: GearInstance;
  if (raw.construction === 'generated') {
    if (typeof raw.baseId !== 'string') throw new TypeError('generated GearInstance baseId must be a string');
    if (!Array.isArray(raw.naturalAffixes)) throw new TypeError('generated GearInstance naturalAffixes must be an array');
    if (!Array.isArray(raw.sockets)) throw new TypeError('generated GearInstance sockets must be an array');
    expected = createGearInstance(raw.provenance.sourceActionId, ordinal, {
      baseId: raw.baseId,
      generationSeed: raw.generation.seed as number,
      itemLevel: raw.itemLevel as number,
      quality: raw.quality as number,
      rarityTier: raw.rarityTier as number,
      naturalAffixes: raw.naturalAffixes as unknown as readonly GearNaturalAffix[],
      craftedModifier: null,
      drawback: null,
      upgrade: raw.upgrade as number,
      sockets: raw.sockets as string[],
    });
  } else if (raw.construction === 'legacy') {
    if (typeof raw.baseId !== 'string') throw new TypeError('legacy GearInstance baseId must be a string');
    const base = getLootCatalogueDefinition(raw.baseId);
    if (!base || base.inventoryShape !== 'slotted') throw new RangeError('legacy GearInstance base is not canonical slotted gear');
    expected = createLegacyBaseInstance(
      raw.provenance.sourceActionId,
      ordinal,
      base,
      decodeLegacyBoundAffix(raw.legacyAffix, base.id),
    );
  } else {
    throw new RangeError('unsupported GearInstance construction');
  }
  if (canonicalJson(raw) !== canonicalJson(expected)) {
    throw new RangeError('GearInstance content does not match its receipt identity and construction');
  }
  return expected;
}

export function decodeGearInstance(encoded: string): GearInstance {
  if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > MAX_GEAR_JSON_BYTES) {
    throw new RangeError('GearInstance JSON is empty or exceeds its compatibility bound');
  }
  let raw: unknown;
  try { raw = JSON.parse(encoded); } catch { throw new TypeError('GearInstance JSON is malformed'); }
  return decodeGearValue(raw);
}

/** Used by the versioned Inventory codec while retaining the same strict gear boundary. */
export function decodeGearObject(raw: unknown): GearInstance {
  return decodeGearValue(raw);
}
