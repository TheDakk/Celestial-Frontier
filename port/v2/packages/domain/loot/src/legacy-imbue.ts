/* Pure evidence for the two v1.8.9 earned-affix paths.

   These resolvers return compatibility plans only. They do not create or
   mutate GearInstance because the current schema has no truthful per-instance
   carrier for a post-construction, role-less legacy imbue. */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import {
  GEAR_SLOTS,
  getLootCatalogueDefinition,
  type GearSlot,
} from './catalogue.js';
import {
  rollLegacyAffix,
  type LegacyAffixDefinition,
} from './gear.js';
import { LEGACY_MATERIAL_IDS_V1 } from './recipe.js';
import {
  UINT32_MAX,
  assertPlainRecord,
  checkedInteger,
  deepFreeze,
} from './internal.js';

export const LEGACY_IMBUE_EVIDENCE_AUTHORITY = 'legacy-v1.8.9-earned-affix-plan' as const;

export interface LegacyWornBase {
  readonly slot: GearSlot;
  readonly baseId: string;
}

export interface LegacyImbuePlan {
  readonly authority: typeof LEGACY_IMBUE_EVIDENCE_AUTHORITY;
  readonly status: 'planned';
  readonly source: 'conquest' | 'exceptional-craft';
  /** Exact legacy effect, deliberately without a fabricated prefix/suffix. */
  readonly affix: Readonly<{
    key: LegacyAffixDefinition['key'];
    value: number;
  }>;
  readonly affixSeed: number;
  readonly slot: GearSlot;
  readonly baseId: string;
  readonly legacyApplication: 'replace-slot-bound-affix' | 'set-empty-slot-bound-affix';
}

export interface LegacyImbueMiss {
  readonly authority: typeof LEGACY_IMBUE_EVIDENCE_AUTHORITY;
  readonly status: 'not-planned';
  readonly source: 'conquest' | 'exceptional-craft';
  readonly reason:
    | 'no-equipped-gear'
    | 'conquest-gate-missed'
    | 'direct-material-cost-absent'
    | 'direct-materials-not-all-exceptional'
    | 'matching-slot-was-occupied'
    | 'live-slot-affix-would-be-clobbered';
}

export type LegacyImbueEvidence = LegacyImbuePlan | LegacyImbueMiss;

function miss(source: LegacyImbueMiss['source'], reason: LegacyImbueMiss['reason']): LegacyImbueMiss {
  return deepFreeze({
    authority: LEGACY_IMBUE_EVIDENCE_AUTHORITY,
    status: 'not-planned',
    source,
    reason,
  });
}

/** Exact conquest gate, canonical worn-slot selection, and legacy roll. */
export function resolveLegacyConquestImbuePlan(input: Readonly<{
  planetSeed: number;
  worldTier: number;
  equipped: readonly LegacyWornBase[];
}>): LegacyImbueEvidence {
  assertPlainRecord(input, 'legacy conquest imbue input');
  const planetSeed = checkedInteger(input.planetSeed, 0, UINT32_MAX, 'legacy conquest planetSeed');
  const worldTier = checkedInteger(input.worldTier, 0, 14, 'legacy conquest worldTier');
  if (!Array.isArray(input.equipped)) throw new TypeError('legacy conquest equipped must be an array');
  const bySlot = new Map<GearSlot, LegacyWornBase>();
  for (const entry of input.equipped) {
    assertPlainRecord(entry, 'legacy conquest worn base');
    if (typeof entry.slot !== 'string' || !(GEAR_SLOTS as readonly string[]).includes(entry.slot)) {
      throw new RangeError('legacy conquest worn base has an unknown slot');
    }
    if (typeof entry.baseId !== 'string') throw new TypeError('legacy conquest worn baseId must be a string');
    const base = getLootCatalogueDefinition(entry.baseId);
    if (!base || base.inventoryShape !== 'slotted' || base.slot !== entry.slot) {
      throw new RangeError('legacy conquest worn base does not match its canonical slot');
    }
    const slot = entry.slot as GearSlot;
    if (bySlot.has(slot)) throw new RangeError(`legacy conquest repeats equipped slot ${slot}`);
    bySlot.set(slot, { slot, baseId: base.id });
  }
  const worn = GEAR_SLOTS.flatMap((slot) => {
    const entry = bySlot.get(slot);
    return entry ? [entry] : [];
  });
  if (worn.length === 0) return miss('conquest', 'no-equipped-gear');
  const gate = mulberry32(hashInt(planetSeed >>> 0, 0x5901, 2) >>> 0);
  if (gate() >= 0.4) return miss('conquest', 'conquest-gate-missed');
  const selection = mulberry32(hashInt(planetSeed >>> 0, 0x5902, 3) >>> 0);
  const chosen = worn[(selection() * worn.length) | 0]!;
  return deepFreeze({
    authority: LEGACY_IMBUE_EVIDENCE_AUTHORITY,
    status: 'planned',
    source: 'conquest',
    affix: rollLegacyAffix(planetSeed, worldTier),
    affixSeed: planetSeed,
    slot: chosen.slot,
    baseId: chosen.baseId,
    legacyApplication: 'replace-slot-bound-affix',
  });
}

/** Exact exceptional-stock eligibility and craft-count seed. The caller
 * supplies the exceptional stock observed before the successful craft; parts
 * never contribute to this test. */
export function resolveLegacyExceptionalCraftImbuePlan(input: Readonly<{
  baseId: string;
  completedCraftCount: number;
  exceptionalMaterialStock: Readonly<Record<string, number>>;
  matchingSlotWasEmpty: boolean;
  liveSlotAffixPresentAfterAutoEquip: boolean;
}>): LegacyImbueEvidence {
  assertPlainRecord(input, 'legacy exceptional craft imbue input');
  if (typeof input.baseId !== 'string') throw new TypeError('legacy exceptional craft baseId must be a string');
  const base = getLootCatalogueDefinition(input.baseId);
  if (!base || base.inventoryShape !== 'slotted') {
    throw new RangeError('legacy exceptional craft requires a canonical slotted base');
  }
  if (typeof input.matchingSlotWasEmpty !== 'boolean'
    || typeof input.liveSlotAffixPresentAfterAutoEquip !== 'boolean') {
    throw new TypeError('legacy exceptional craft slot facts must be booleans');
  }
  const completedCraftCount = checkedInteger(
    input.completedCraftCount,
    0,
    UINT32_MAX,
    'legacy exceptional completedCraftCount',
  );
  assertPlainRecord(input.exceptionalMaterialStock, 'legacy exceptional material stock');
  const knownMaterials = new Set<string>(LEGACY_MATERIAL_IDS_V1);
  const exceptionalStock: Record<string, number> = {};
  for (const [materialId, quantity] of Object.entries(input.exceptionalMaterialStock)) {
    if (!knownMaterials.has(materialId)) throw new RangeError(`legacy exceptional stock has unknown material ${materialId}`);
    exceptionalStock[materialId] = checkedInteger(
      quantity,
      0,
      Number.MAX_SAFE_INTEGER,
      `legacy exceptional stock ${materialId}`,
    );
  }
  const directCosts = Object.entries(base.materialCost);
  if (directCosts.length === 0) return miss('exceptional-craft', 'direct-material-cost-absent');
  if (directCosts.some(([materialId, quantity]) => (exceptionalStock[materialId] ?? 0) < quantity)) {
    return miss('exceptional-craft', 'direct-materials-not-all-exceptional');
  }
  if (!input.matchingSlotWasEmpty) return miss('exceptional-craft', 'matching-slot-was-occupied');
  if (input.liveSlotAffixPresentAfterAutoEquip) {
    return miss('exceptional-craft', 'live-slot-affix-would-be-clobbered');
  }
  /* Legacy called hashInt with an omitted third argument; `(undefined | 0)`
     is zero, made explicit at this typed parity boundary. */
  const affixSeed = hashInt(0xF07E, completedCraftCount, 0) >>> 0;
  return deepFreeze({
    authority: LEGACY_IMBUE_EVIDENCE_AUTHORITY,
    status: 'planned',
    source: 'exceptional-craft',
    affix: rollLegacyAffix(affixSeed, base.tier),
    affixSeed,
    slot: base.slot,
    baseId: base.id,
    legacyApplication: 'set-empty-slot-bound-affix',
  });
}
