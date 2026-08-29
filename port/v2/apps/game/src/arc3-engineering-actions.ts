/* Arc 3 app-side authority adapter.

   The domain packages own provenance, opportunity facts, capability policy,
   deterministic planning, and the engineering codec. Persistence owns the
   Arc 2/Arc 3 carriers. This file performs only the app join: bounded boot
   inventory assembly and one detached SaveState derivation suitable for the
   existing F3/F4 receipt/CAS owner. No clock, DOM, ambient entropy, retry, or
   live app singleton crosses this boundary. */
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  MAX_ENGINEERING_SOURCES,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  createLegacyEngineeringSeedResolver,
  encodeEngineeringState,
  planFixedFabrication,
  planResearchPurchase,
  planStellarSkim,
  planWorldMining,
  projectStarOpportunity,
  projectWorldOpportunity,
  type EngineeringStateV2,
  type FixedFabricationResult,
  type MiningResult,
  type ResearchId,
  type ResearchPurchaseResult,
  type StellarSkimResult,
} from '@cf/domain-opportunity';
import {
  LEGACY_SIGNATURE_IDS_V1,
  getLootCatalogueDefinition,
  projectEngineeringCapabilities,
  type Arc2EngineeringLoadout,
} from '@cf/domain-loot';
import {
  applyV5ExtensionWrites,
  arc2LootLegacyMirrorMatches,
  encodeArc2LootCarrier,
  prepareArc2FixedFabrication,
  prepareArc2LootInventoryWrite,
  prepareArc3EngineeringLegacyBootstrap,
  prepareArc3EngineeringWrite,
  projectArc3EngineeringLegacyCompatibility,
  projectArc2LootLegacyMirror,
  readArc2EngineeringLoadout,
  readArc2Loot,
  readArc3Engineering,
  type Arc2FixedFabricationReady,
  type Arc2LootInventoryV1,
  type Arc3EngineeringExtensionWrite,
  type Arc3LegacyEngineeringProjection,
  type Arc3LegacyMinedTimestampIntent,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import {
  ascStageOf,
  ascend,
  bankFixedFabrication,
  bankMinedAction,
  canonicalCF1StarAddressFromNav,
  canonicalCF1WorldAddressFromNav,
  reconcileV2Chapters,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
  type NavState,
  type SurfaceNav,
  type SystemNav,
} from '@cf/scene';
import {
  publishStarterCharterActionFieldsV1,
  stageStarterCharterActionV1,
  type StarterCharterActionFactV1,
} from './starter-charter-action.js';

export const ARC3_APP_BOOT_DIAGNOSTICS_SCHEMA = 'cf-v2-arc3-app-boot/v1' as const;
export const ARC3_APP_DERIVATION_SCHEMA = 'cf-v2-arc3-app-derivation/v1' as const;
export const ARC3_LEGACY_CARGO_MAX = 1_000_000;
const UINT32_MAX = 0xffff_ffff;
const LEGACY_STAT_MAX = 1_000_000_000;
const LEGACY_ESSENCE_MAX = 1_000_000_000;
const LEGACY_ASC_PROGRESS_MAX = 999;
const SIGNATURE_IDS = new Set<string>(LEGACY_SIGNATURE_IDS_V1);

export interface Arc3EngineeringAddressSources {
  readonly current: NavState;
  readonly saved: NavState | null;
  readonly atlas: readonly NavState[];
}

export interface Arc3AddressInventoryDiagnostics {
  readonly schema: typeof ARC3_APP_BOOT_DIAGNOSTICS_SCHEMA;
  readonly candidates: number;
  readonly contributedWorlds: number;
  readonly contributedStars: number;
  readonly duplicateWorldKeys: number;
  readonly duplicateStarKeys: number;
  readonly uniqueWorlds: number;
  readonly uniqueStars: number;
}

export type Arc3AddressInventoryOutcome =
  | Readonly<{
    kind: 'ready';
    worlds: readonly CanonicalCF1WorldAddress[];
    stars: readonly CanonicalCF1StarAddress[];
    diagnostics: Arc3AddressInventoryDiagnostics;
  }>
  | Readonly<{
    kind: 'protected';
    reason: 'unproven-address-source' | 'source-bound-exceeded';
    detail: string;
    diagnostics: Arc3AddressInventoryDiagnostics;
  }>;

function codeUnitCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function diagnostics(input: Readonly<{
  candidates: number;
  contributedWorlds: number;
  contributedStars: number;
  duplicateWorldKeys: number;
  duplicateStarKeys: number;
  uniqueWorlds: number;
  uniqueStars: number;
}>): Arc3AddressInventoryDiagnostics {
  return Object.freeze({ schema: ARC3_APP_BOOT_DIAGNOSTICS_SCHEMA, ...input });
}

/** Assemble only already-proven navigation sidecars. Surface evidence owns
 * both its world and parent star; full keys, never leaf seeds, dedupe rows. */
export function buildArc3EngineeringAddressInventory(
  sources: Arc3EngineeringAddressSources,
): Arc3AddressInventoryOutcome {
  const candidates = [sources.current, ...(sources.saved === null ? [] : [sources.saved]), ...sources.atlas];
  const worlds = new Map<string, CanonicalCF1WorldAddress>();
  const stars = new Map<string, CanonicalCF1StarAddress>();
  let contributedWorlds = 0;
  let contributedStars = 0;
  let duplicateWorldKeys = 0;
  let duplicateStarKeys = 0;

  const snapshotDiagnostics = (): Arc3AddressInventoryDiagnostics => diagnostics({
    candidates: candidates.length,
    contributedWorlds,
    contributedStars,
    duplicateWorldKeys,
    duplicateStarKeys,
    uniqueWorlds: worlds.size,
    uniqueStars: stars.size,
  });
  const addStar = (address: CanonicalCF1StarAddress): void => {
    contributedStars++;
    if (stars.has(address.key)) duplicateStarKeys++;
    else stars.set(address.key, address);
  };

  for (let index = 0; index < candidates.length; index++) {
    const state = candidates[index]!;
    if (state.mode === 'surface') {
      const world = canonicalCF1WorldAddressFromNav(state);
      const parent = ascend(state);
      const star = parent.ok ? canonicalCF1StarAddressFromNav(parent.state) : null;
      if (!world.ok || star === null || !star.ok) {
        const reason = !world.ok
          ? world.reason
          : star === null
            ? 'ascend-failed'
            : !star.ok
              ? star.reason
              : 'unreachable';
        return Object.freeze({
          kind: 'protected', reason: 'unproven-address-source',
          detail: `candidate:${index}:surface:${reason}`,
          diagnostics: snapshotDiagnostics(),
        });
      }
      contributedWorlds++;
      if (worlds.has(world.address.key)) duplicateWorldKeys++;
      else worlds.set(world.address.key, world.address);
      addStar(star.address);
    } else if (state.mode === 'system') {
      const star = canonicalCF1StarAddressFromNav(state);
      if (!star.ok) {
        return Object.freeze({
          kind: 'protected', reason: 'unproven-address-source',
          detail: `candidate:${index}:system:${star.reason}`,
          diagnostics: snapshotDiagnostics(),
        });
      }
      addStar(star.address);
    }
    if (worlds.size + stars.size > MAX_ENGINEERING_SOURCES) {
      return Object.freeze({
        kind: 'protected', reason: 'source-bound-exceeded',
        detail: `unique-sources:${worlds.size + stars.size}`,
        diagnostics: snapshotDiagnostics(),
      });
    }
  }

  return Object.freeze({
    kind: 'ready',
    worlds: Object.freeze([...worlds.values()].sort((left, right) => codeUnitCompare(left.key, right.key))),
    stars: Object.freeze([...stars.values()].sort((left, right) => codeUnitCompare(left.key, right.key))),
    diagnostics: snapshotDiagnostics(),
  });
}

function legacyEngineeringMirror(save: SaveStateV2): unknown {
  /* `mined`/minedw is deliberately absent. A wall timestamp cannot become
     active-play accrual authority; migrated source cursors begin null. */
  return Object.freeze({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: 0,
    worlds: Object.freeze(save.mineX.map(([seed, extractionsTaken]) => Object.freeze({
      seed,
      extractionsTaken,
    }))),
    stars: Object.freeze(save.skimX.map(([seed, extractionsTaken]) => Object.freeze({
      seed,
      extractionsTaken,
    }))),
    research: Object.freeze([...save.techOwned]),
  });
}

interface LegacyResolutionDiagnostics {
  readonly missingWorldSeeds: readonly unknown[];
  readonly ambiguousWorldSeeds: readonly number[];
  readonly missingStarSeeds: readonly unknown[];
  readonly ambiguousStarSeeds: readonly number[];
}

function legacyResolutionDiagnostics(
  save: SaveStateV2,
  inventory: Extract<Arc3AddressInventoryOutcome, { kind: 'ready' }>,
): LegacyResolutionDiagnostics {
  const worldSeeds = new Map<number, number>();
  const starSeeds = new Map<number, number>();
  for (const address of inventory.worlds) {
    worldSeeds.set(address.planet.seed, (worldSeeds.get(address.planet.seed) ?? 0) + 1);
  }
  for (const address of inventory.stars) {
    starSeeds.set(address.star.seed, (starSeeds.get(address.star.seed) ?? 0) + 1);
  }
  const missingWorldSeeds: unknown[] = [];
  const ambiguousWorldSeeds: number[] = [];
  const missingStarSeeds: unknown[] = [];
  const ambiguousStarSeeds: number[] = [];
  for (const [seed] of save.mineX) {
    if (!Number.isInteger(seed) || (seed as number) < 0 || (seed as number) > UINT32_MAX) {
      missingWorldSeeds.push(seed);
    } else if ((worldSeeds.get(seed as number) ?? 0) === 0) missingWorldSeeds.push(seed);
    else if (worldSeeds.get(seed as number)! > 1) ambiguousWorldSeeds.push(seed as number);
  }
  for (const [seed] of save.skimX) {
    if (!Number.isInteger(seed) || (seed as number) < 0 || (seed as number) > UINT32_MAX) {
      missingStarSeeds.push(seed);
    } else if ((starSeeds.get(seed as number) ?? 0) === 0) missingStarSeeds.push(seed);
    else if (starSeeds.get(seed as number)! > 1) ambiguousStarSeeds.push(seed as number);
  }
  return Object.freeze({
    missingWorldSeeds: Object.freeze(missingWorldSeeds),
    ambiguousWorldSeeds: Object.freeze(ambiguousWorldSeeds),
    missingStarSeeds: Object.freeze(missingStarSeeds),
    ambiguousStarSeeds: Object.freeze(ambiguousStarSeeds),
  });
}

export type Arc3AppBootstrapOutcome =
  | Readonly<{
    kind: 'prepared';
    state: EngineeringStateV2;
    write: Arc3EngineeringExtensionWrite;
    extensions: V5Extensions;
    addressDiagnostics: Arc3AddressInventoryDiagnostics;
    legacyDiagnostics: LegacyResolutionDiagnostics;
  }>
  | Readonly<{
    kind: 'already-loaded';
    state: EngineeringStateV2;
    addressDiagnostics: Arc3AddressInventoryDiagnostics | null;
    legacyDiagnostics: LegacyResolutionDiagnostics | null;
  }>
  | Readonly<{
    kind: 'protected';
    reason: string;
    detail: string;
    addressDiagnostics: Arc3AddressInventoryDiagnostics | null;
    legacyDiagnostics: LegacyResolutionDiagnostics | null;
  }>;

/** Classify owned carrier bytes before consulting migration-only route
 * evidence. A loaded/future/corrupt carrier cannot become unavailable merely
 * because an irrelevant legacy address inventory is incomplete or hostile. */
export function prepareArc3AppBootstrap(input: Readonly<{
  extensions: V5Extensions;
  save: SaveStateV2;
  sources: Arc3EngineeringAddressSources;
}>): Arc3AppBootstrapOutcome {
  const current = readArc3Engineering(input.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
  if (current.kind === 'loaded') {
    return Object.freeze({
      kind: 'already-loaded', state: current.state,
      addressDiagnostics: null,
      legacyDiagnostics: null,
    });
  }
  if (current.kind === 'future-version' || current.kind === 'corrupt') {
    return Object.freeze({
      kind: 'protected',
      reason: current.kind,
      detail: current.kind === 'future-version' ? `version:${current.version}` : 'carrier-corrupt',
      addressDiagnostics: null,
      legacyDiagnostics: null,
    });
  }
  const inventory = buildArc3EngineeringAddressInventory(input.sources);
  if (inventory.kind !== 'ready') {
    return Object.freeze({
      kind: 'protected', reason: inventory.reason, detail: inventory.detail,
      addressDiagnostics: inventory.diagnostics, legacyDiagnostics: null,
    });
  }
  const legacyDiagnostics = legacyResolutionDiagnostics(input.save, inventory);
  const prepared = prepareArc3EngineeringLegacyBootstrap({
    extensions: input.extensions,
    legacy: legacyEngineeringMirror(input.save),
    addressResolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
    legacyResolver: createLegacyEngineeringSeedResolver({
      worlds: inventory.worlds,
      stars: inventory.stars,
    }),
  });
  if (prepared.kind === 'prepared') {
    return Object.freeze({
      ...prepared,
      addressDiagnostics: inventory.diagnostics,
      legacyDiagnostics,
    });
  }
  if (prepared.kind === 'already-loaded') {
    return Object.freeze({
      ...prepared,
      addressDiagnostics: inventory.diagnostics,
      legacyDiagnostics,
    });
  }
  const hasMissing = legacyDiagnostics.missingWorldSeeds.length > 0
    || legacyDiagnostics.missingStarSeeds.length > 0;
  const hasAmbiguous = legacyDiagnostics.ambiguousWorldSeeds.length > 0
    || legacyDiagnostics.ambiguousStarSeeds.length > 0;
  return Object.freeze({
    kind: 'protected',
    reason: prepared.reason,
    detail: hasAmbiguous ? 'legacy-seed-ambiguous' : hasMissing ? 'legacy-seed-missing' : prepared.reason,
    addressDiagnostics: inventory.diagnostics,
    legacyDiagnostics,
  });
}

function legacyPrior(save: SaveStateV2) {
  return { mineX: save.mineX, mined: save.mined, skimX: save.skimX };
}

function copyArc3LegacyProjection(
  target: SaveStateV2,
  projection: Arc3LegacyEngineeringProjection,
): void {
  target.mineX = projection.legacy.mineX.map(([seed, count]) => [seed, count]);
  target.mined = projection.legacy.mined.map(([seed, timestamp]) => [seed, timestamp]);
  target.skimX = projection.legacy.skimX.map(([seed, count]) => [seed, count]);
  target.techOwned = [...projection.legacy.techOwned];
}

export type Arc3BootstrapLegacyProjectionIntent =
  | 'legacy-bootstrap'
  | 'loaded-reconciliation';

export type Arc3BootstrapLegacyStage = Readonly<{
  candidate: SaveStateV2;
  projection: Arc3LegacyEngineeringProjection;
  changed: boolean;
}>;

/** Stage the v4 compatibility projection in a detached complete save. An
 * absent-carrier migration refreshes every uniquely representable minedw
 * stamp at codecNow while leaving same-leaf collisions held. Reconciliation
 * of an already-current carrier preserves existing compatibility stamps. */
export function stageArc3BootstrapLegacyProjection(input: Readonly<{
  source: SaveStateV2;
  state: EngineeringStateV2;
  codecNow: number;
  intent: Arc3BootstrapLegacyProjectionIntent;
}>): Arc3BootstrapLegacyStage {
  const candidate = structuredClone(input.source);
  const projection = projectArc3EngineeringLegacyCompatibility({
    state: input.state,
    prior: legacyPrior(input.source),
    codecNow: input.codecNow,
    minedTimestampIntent: input.intent === 'legacy-bootstrap'
      ? { kind: 'refresh-all' }
      : { kind: 'preserve' },
  });
  copyArc3LegacyProjection(candidate, projection);
  const changed = !sameRows(candidate.mineX, input.source.mineX)
    || !sameRows(candidate.mined, input.source.mined)
    || !sameRows(candidate.skimX, input.source.skimX)
    || !sameRows(candidate.techOwned, input.source.techOwned);
  return Object.freeze({ candidate, projection, changed });
}

/** Publish only the four legacy compatibility fields after their carrier and
 * complete save have crossed the shared durable boundary. */
export function publishArc3LegacyCompatibilityFields(
  target: SaveStateV2,
  committed: SaveStateV2,
): void {
  target.mineX = committed.mineX.map(([seed, count]) => [seed, count]);
  target.mined = committed.mined.map(([seed, timestamp]) => [seed, timestamp]);
  target.skimX = committed.skimX.map(([seed, count]) => [seed, count]);
  target.techOwned = [...committed.techOwned];
}

function checkedQuantity(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > ARC3_LEGACY_CARGO_MAX) {
    throw new RangeError(`${label} must be an integer from 0 through ${ARC3_LEGACY_CARGO_MAX}`);
  }
  return value as number;
}

function quantityMap(rows: readonly (readonly [string, number])[], label: string): Map<string, number> {
  const result = new Map<string, number>();
  for (let index = 0; index < rows.length; index++) {
    const [id, count] = rows[index]!;
    if (typeof id !== 'string' || id.length < 1 || id.length > 64 || result.has(id)) {
      throw new RangeError(`${label} row ${index} has an invalid or duplicate id`);
    }
    result.set(id, checkedQuantity(count, `${label} ${id}`));
  }
  return result;
}

function addQuantities(
  target: Map<string, number>,
  rows: readonly Readonly<{ id: string; quantity: number }>[],
  label: string,
): void {
  for (const { id, quantity } of rows) {
    const increment = checkedQuantity(quantity, `${label} increment ${id}`);
    const next = (target.get(id) ?? 0) + increment;
    target.set(id, checkedQuantity(next, `${label} total ${id}`));
  }
}

function stagedCargo(
  save: SaveStateV2,
  materials: readonly Readonly<{ id: string; quantity: number }>[],
  exceptionalMaterials: readonly Readonly<{ id: string; quantity: number }>[],
): Readonly<{ cargo: Array<[string, number]>; cgx: Array<[string, number]> }> {
  const cargo = quantityMap(save.cargo, 'cargo');
  const cgx = quantityMap(save.cgx, 'exceptional cargo');
  addQuantities(cargo, materials, 'cargo');
  addQuantities(cgx, exceptionalMaterials, 'exceptional cargo');
  for (const [id, count] of cgx) {
    if (count > (cargo.get(id) ?? 0)) {
      throw new RangeError(`exceptional cargo ${id} exceeds held cargo`);
    }
  }
  return Object.freeze({ cargo: [...cargo], cgx: [...cgx] });
}

function arc2InventoryState(loadout: Arc2EngineeringLoadout): Arc2LootInventoryV1 {
  return Object.freeze({
    kind: 'inventory',
    inventory: loadout.inventory,
    stackableCounts: loadout.stackableCounts,
  });
}

function requireArc2LegacyParity(loadout: Arc2EngineeringLoadout, save: SaveStateV2): Arc2LootInventoryV1 {
  const state = arc2InventoryState(loadout);
  if (!arc2LootLegacyMirrorMatches(state, save)) {
    throw new Error('arc2-loadout-legacy-mirror-mismatch');
  }
  return state;
}

/** Refuse a product action when the freshly decoded Arc 3 carrier and its
 * current v4 compatibility mirror no longer describe the same expedition.
 * Action planning may advance this projection, but it must never become an
 * implicit repair path for unrelated or stale live bytes. Collision-held
 * leaf rows remain valid because the canonical projector preserves them. */
function requireArc3LegacyParity(
  state: EngineeringStateV2,
  save: SaveStateV2,
  codecNow: number,
): void {
  const projection = projectArc3EngineeringLegacyCompatibility({
    state,
    prior: legacyPrior(save),
    codecNow,
    minedTimestampIntent: { kind: 'preserve' },
  });
  if (!sameRows(projection.legacy.mineX, save.mineX)
    || !sameRows(projection.legacy.mined, save.mined)
    || !sameRows(projection.legacy.skimX, save.skimX)
    || !sameRows(projection.legacy.techOwned, save.techOwned)) {
    throw new Error('arc3-carrier-legacy-projection-mismatch');
  }
}

function quantityRecord(
  rows: readonly (readonly [string, number])[],
  label: string,
): Readonly<Record<string, number>> {
  const entries = [...quantityMap(rows, label)].sort(([left], [right]) => codeUnitCompare(left, right));
  return Object.freeze(Object.fromEntries(entries));
}

function checkedEssence(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > LEGACY_ESSENCE_MAX) {
    throw new RangeError(`legacy Stardust must be an integer from 0 through ${LEGACY_ESSENCE_MAX}`);
  }
  return value as number;
}

function signatureIds(save: SaveStateV2): readonly string[] {
  const source = save.primeFill;
  if (!source || typeof source !== 'object' || Array.isArray(source)
    || Object.getPrototypeOf(source) !== Object.prototype) {
    throw new TypeError('legacy Signature authority must be an exact plain object');
  }
  const result: string[] = [];
  for (const key of Reflect.ownKeys(source)) {
    if (typeof key !== 'string') throw new TypeError('legacy Signature authority has a symbol key');
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
      throw new TypeError(`legacy Signature ${key} must be an enumerable data property`);
    }
    if (!SIGNATURE_IDS.has(key)) throw new RangeError(`legacy Signature ${key} is not recognized`);
    if (!descriptor.value || typeof descriptor.value !== 'object' || Array.isArray(descriptor.value)) {
      throw new TypeError(`legacy Signature ${key} has malformed proof`);
    }
    result.push(key);
  }
  result.sort(codeUnitCompare);
  return Object.freeze(result);
}

interface LegacyAssetDelta {
  readonly id: string;
  readonly delta: number;
}

function applyAssetDeltas(
  target: Map<string, number>,
  deltas: readonly LegacyAssetDelta[],
  label: string,
): void {
  const seen = new Set<string>();
  for (let index = 0; index < deltas.length; index++) {
    const { id, delta } = deltas[index]!;
    if (typeof id !== 'string' || id.length < 1 || id.length > 64 || seen.has(id)) {
      throw new RangeError(`${label} delta ${index} has an invalid or duplicate id`);
    }
    if (!Number.isSafeInteger(delta) || delta > 0 || delta < -ARC3_LEGACY_CARGO_MAX) {
      throw new RangeError(`${label} delta ${id} is not a bounded consumption`);
    }
    seen.add(id);
    const next = (target.get(id) ?? 0) + delta;
    target.set(id, checkedQuantity(next, `${label} balance ${id}`));
  }
}

function stagedEconomyDeltas(
  save: SaveStateV2,
  cargoDeltas: readonly LegacyAssetDelta[],
  exceptionalDeltas: readonly LegacyAssetDelta[],
  essenceDelta: number,
): Readonly<{ cargo: Array<[string, number]>; cgx: Array<[string, number]>; essence: number }> {
  const cargo = quantityMap(save.cargo, 'cargo');
  const cgx = quantityMap(save.cgx, 'exceptional cargo');
  for (const [id, count] of cgx) {
    if (count > (cargo.get(id) ?? 0)) throw new RangeError(`exceptional cargo ${id} exceeds held cargo`);
  }
  applyAssetDeltas(cargo, cargoDeltas, 'cargo');
  applyAssetDeltas(cgx, exceptionalDeltas, 'exceptional cargo');
  for (const [id, count] of cgx) {
    if (count > (cargo.get(id) ?? 0)) throw new RangeError(`exceptional cargo ${id} exceeds held cargo`);
  }
  if (!Number.isSafeInteger(essenceDelta) || essenceDelta > 0 || essenceDelta < -LEGACY_ESSENCE_MAX) {
    throw new RangeError('legacy Stardust delta is not a bounded consumption');
  }
  const essence = checkedEssence(checkedEssence(save.essence) + essenceDelta);
  return Object.freeze({ cargo: [...cargo], cgx: [...cgx], essence });
}

function researchEconomy(
  save: SaveStateV2,
  result: ResearchPurchaseResult,
): Readonly<{ cargo: Array<[string, number]>; cgx: Array<[string, number]>; essence: number }> {
  const exceptional = quantityMap(save.cgx, 'exceptional cargo');
  const cargoDeltas = result.consume.materials.map(({ id, quantity }) => ({ id, delta: -quantity }));
  const exceptionalDeltas = result.consume.materials.flatMap(({ id, quantity }) => {
    const spend = Math.min(exceptional.get(id) ?? 0, quantity);
    return spend > 0 ? [{ id, delta: -spend }] : [];
  });
  return stagedEconomyDeltas(save, cargoDeltas, exceptionalDeltas, -result.consume.stardust);
}

function checkedCharterProgress(save: SaveStateV2): Record<string, number> {
  if (!Number.isInteger(save.ascCh) || save.ascCh < 0 || save.ascCh > 3) {
    throw new RangeError('legacy Charter chapter is out of range');
  }
  const source = save.ascProg;
  if (!source || typeof source !== 'object' || Array.isArray(source)
    || Object.getPrototypeOf(source) !== Object.prototype) {
    throw new TypeError('legacy Charter progress must be an exact plain object');
  }
  const result: Record<string, number> = {};
  for (const key of Reflect.ownKeys(source)) {
    if (typeof key !== 'string' || key.length < 1 || key.length >= 24) {
      throw new RangeError('legacy Charter progress has an invalid goal id');
    }
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true
      || !Number.isSafeInteger(descriptor.value) || descriptor.value < 0
      || descriptor.value > LEGACY_ASC_PROGRESS_MAX) {
      throw new RangeError(`legacy Charter progress ${key} is malformed`);
    }
    result[key] = descriptor.value as number;
  }
  return result;
}

function reconciledCharter(
  save: SaveStateV2,
  progress: Record<string, number>,
  actualItems: readonly (readonly [string, number])[],
): Readonly<{ ascCh: number; ascProg: Record<string, number> }> {
  const stage = ascStageOf(actualItems.map(([id, count]) => [id, count]), save.ascCh);
  const reconciliation = reconcileV2Chapters(save.ascCh, progress, stage);
  if (reconciliation === null) throw new Error('legacy Charter reconciliation refused');
  return Object.freeze({ ascCh: reconciliation.nextChapter, ascProg: progress });
}

function copyArc2LegacyMirror(target: SaveStateV2, mirror: Arc2FixedFabricationReady['mirror']): void {
  target.items = mirror.items.map(([id, count]) => [id, count]);
  target.equip = { ...mirror.equip };
  target.equipAff = Object.fromEntries(Object.entries(mirror.equipAff).map(([slot, affix]) => [
    slot, { ...affix },
  ]));
}

function stagedStats(
  save: SaveStateV2,
  increments: Readonly<Record<string, number>>,
): Record<string, number> {
  const stats = { ...save.stats };
  for (const [id, increment] of Object.entries(increments)) {
    const prior = stats[id] ?? 0;
    const next = prior + increment;
    if (!Number.isSafeInteger(prior) || prior < 0 || !Number.isSafeInteger(increment)
      || increment < 0 || !Number.isSafeInteger(next) || next > LEGACY_STAT_MAX) {
      throw new RangeError(`legacy statistic ${id} cannot represent the Arc 3 result`);
    }
    stats[id] = next;
  }
  return stats;
}

export type Arc3AppDerivation = Readonly<{
  schema: typeof ARC3_APP_DERIVATION_SCHEMA;
  operation: 'mine-world' | 'skim-star' | 'purchase-research' | 'fabricate-fixed';
  receiptOrdinal: number;
  state: SaveStateV2;
  extensionWrites: readonly V5ExtensionWrite[];
  witness: string;
  nextEngineeringState: EngineeringStateV2;
  nextArc2State: Arc2LootInventoryV1 | null;
  arc2Settlement: Arc2FixedFabricationReady | null;
  starterCharter: StarterCharterActionFactV1 | null;
  projection: Arc3LegacyEngineeringProjection;
  minedTimestampIntent: Arc3LegacyMinedTimestampIntent;
  result: MiningResult | StellarSkimResult | ResearchPurchaseResult | FixedFabricationResult;
}>;

export type Arc3AppDerivationOutcome =
  | Readonly<{ kind: 'ready'; derivation: Arc3AppDerivation }>
  | Readonly<{ kind: 'refused'; detail: string }>;

function refused(detail: string): Arc3AppDerivationOutcome {
  return Object.freeze({ kind: 'refused', detail });
}

function prepareEngineeringWrite(
  extensions: V5Extensions,
  state: EngineeringStateV2,
): Arc3EngineeringExtensionWrite | null {
  const prepared = prepareArc3EngineeringWrite({
    extensions,
    state,
    resolver: SCENE_ENGINEERING_ADDRESS_RESOLVER,
  });
  return prepared.kind === 'prepared' ? prepared.write : null;
}

/** Derive one exact mining transaction from freshly decoded Arc 2/Arc 3
 * carriers and the registered SurfaceNav captured when the action began. */
export function deriveArc3MineAction(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  currentSurface: SurfaceNav;
  activePlayMs: number;
  receiptOrdinal: number;
  codecNow: number;
}>): Arc3AppDerivationOutcome {
  try {
    const loadout = readArc2EngineeringLoadout(input.extensions);
    if (loadout.kind !== 'loaded') return refused(`arc2-loadout-${loadout.kind}`);
    const arc2State = requireArc2LegacyParity(loadout.loadout, input.draft);
    const arc2Mirror = projectArc2LootLegacyMirror(arc2State);
    const engineering = readArc3Engineering(input.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    if (engineering.kind !== 'loaded') return refused(`arc3-carrier-${engineering.kind}`);
    requireArc3LegacyParity(engineering.state, input.draft, input.codecNow);
    const current = canonicalCF1WorldAddressFromNav(input.currentSurface);
    if (!current.ok) return refused(`mine-address-${current.reason}`);
    const plan = planWorldMining({
      state: engineering.state,
      opportunity: projectWorldOpportunity(current.address),
      currentSurface: input.currentSurface,
      capabilities: loadout.capabilities,
      activePlay: { activePlayMs: input.activePlayMs },
      receiptOrdinal: input.receiptOrdinal,
    });
    if (plan.status !== 'planned') return refused(`mine-${plan.reason}`);

    const cargo = stagedCargo(input.draft, plan.result.materials, plan.result.exceptionalMaterials);
    const stats = stagedStats(input.draft, {
      mines: plan.result.loads,
      cosmics: plan.result.cosmicFinds,
      minedout: plan.result.minedOut ? 1 : 0,
    });
    const ascProg = checkedCharterProgress(input.draft);
    bankMinedAction(input.draft.ascCh, ascProg, current.address);
    const charter = reconciledCharter(input.draft, ascProg, arc2Mirror.items);
    const intent: Arc3LegacyMinedTimestampIntent = {
      kind: 'touched-world', worldKey: plan.result.sourceKey,
    };
    const projection = projectArc3EngineeringLegacyCompatibility({
      state: plan.nextState,
      prior: legacyPrior(input.draft),
      codecNow: input.codecNow,
      minedTimestampIntent: intent,
    });
    const write = prepareEngineeringWrite(input.extensions, plan.nextState);
    if (write === null) return refused('mine-carrier-write-protected');

    const candidate = structuredClone(input.draft);
    candidate.cargo = cargo.cargo;
    candidate.cgx = cargo.cgx;
    candidate.stats = stats;
    candidate.ascCh = charter.ascCh;
    candidate.ascProg = charter.ascProg;
    copyArc3LegacyProjection(candidate, projection);
    const starterCharter = stageStarterCharterActionV1({
      draft: candidate,
      extensions: input.extensions,
      predecessorWrites: Object.freeze([write]),
      predecessorWitness: plan.witness,
      event: { kind: 'mined', address: current.address },
      receiptOrdinal: input.receiptOrdinal,
    });
    if (starterCharter.kind === 'refused') {
      return refused(`starter-charter-${starterCharter.reason}`);
    }
    let nextArc2State: Arc2LootInventoryV1 | null = null;
    if (starterCharter.fact.completions.some(({ gearId }) => gearId !== null)) {
      const finalArc2 = readArc2Loot(starterCharter.extensions);
      if (finalArc2.kind !== 'loaded' || finalArc2.state.kind !== 'inventory') {
        return refused(`starter-charter-arc2-${finalArc2.kind}`);
      }
      if (!arc2LootLegacyMirrorMatches(finalArc2.state, candidate)) {
        return refused('starter-charter-arc2-legacy-mirror-mismatch');
      }
      nextArc2State = finalArc2.state;
    }

    input.draft.cargo = candidate.cargo;
    input.draft.cgx = candidate.cgx;
    input.draft.ascCh = candidate.ascCh;
    input.draft.ascProg = { ...candidate.ascProg };
    publishStarterCharterActionFieldsV1(input.draft, candidate);
    copyArc3LegacyProjection(input.draft, projection);
    return Object.freeze({
      kind: 'ready',
      derivation: Object.freeze({
        schema: ARC3_APP_DERIVATION_SCHEMA,
        operation: 'mine-world',
        receiptOrdinal: input.receiptOrdinal,
        state: input.draft,
        extensionWrites: starterCharter.extensionWrites,
        witness: starterCharter.witness,
        nextEngineeringState: plan.nextState,
        nextArc2State,
        arc2Settlement: null,
        starterCharter: starterCharter.fact,
        projection,
        minedTimestampIntent: intent,
        result: plan.result,
      }),
    });
  } catch (error) {
    return refused(error instanceof Error ? error.message : String(error));
  }
}

/** Derive one exact stellar-skim transaction. Cargo is fully preflighted
 * before the detached HP field changes, so overflow cannot inflict damage. */
export function deriveArc3SkimAction(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  currentSystem: SystemNav;
  activePlayMs: number;
  receiptOrdinal: number;
  codecNow: number;
}>): Arc3AppDerivationOutcome {
  try {
    const loadout = readArc2EngineeringLoadout(input.extensions);
    if (loadout.kind !== 'loaded') return refused(`arc2-loadout-${loadout.kind}`);
    requireArc2LegacyParity(loadout.loadout, input.draft);
    const engineering = readArc3Engineering(input.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    if (engineering.kind !== 'loaded') return refused(`arc3-carrier-${engineering.kind}`);
    requireArc3LegacyParity(engineering.state, input.draft, input.codecNow);
    const current = canonicalCF1StarAddressFromNav(input.currentSystem);
    if (!current.ok) return refused(`skim-address-${current.reason}`);
    const plan = planStellarSkim({
      state: engineering.state,
      opportunity: projectStarOpportunity(current.address),
      currentSystem: input.currentSystem,
      capabilities: loadout.capabilities,
      playerHp: input.draft.hp,
      activePlay: { activePlayMs: input.activePlayMs },
      receiptOrdinal: input.receiptOrdinal,
    });
    if (plan.status !== 'planned') return refused(`skim-${plan.reason}`);

    const cargo = stagedCargo(input.draft, [{
      id: plan.result.material, quantity: plan.result.quantity,
    }], []);
    const stats = stagedStats(input.draft, { skims: 1, cosmics: 1 });
    const projection = projectArc3EngineeringLegacyCompatibility({
      state: plan.nextState,
      prior: legacyPrior(input.draft),
      codecNow: input.codecNow,
      minedTimestampIntent: { kind: 'preserve' },
    });
    const write = prepareEngineeringWrite(input.extensions, plan.nextState);
    if (write === null) return refused('skim-carrier-write-protected');

    input.draft.cargo = cargo.cargo;
    input.draft.cgx = cargo.cgx;
    input.draft.stats = stats;
    input.draft.hp = plan.result.nextHp;
    copyArc3LegacyProjection(input.draft, projection);
    return Object.freeze({
      kind: 'ready',
      derivation: Object.freeze({
        schema: ARC3_APP_DERIVATION_SCHEMA,
        operation: 'skim-star',
        receiptOrdinal: input.receiptOrdinal,
        state: input.draft,
        extensionWrites: Object.freeze([write]) as readonly [Arc3EngineeringExtensionWrite],
        witness: plan.witness,
        nextEngineeringState: plan.nextState,
        nextArc2State: null,
        arc2Settlement: null,
        starterCharter: null,
        projection,
        minedTimestampIntent: Object.freeze({ kind: 'preserve' }),
        result: plan.result,
      }),
    });
  } catch (error) {
    return refused(error instanceof Error ? error.message : String(error));
  }
}

/** Purchase one currently consumable research node. Arc 2 is freshly decoded
 * to keep the product join fail-closed, while material/Stardust authority and
 * the Arc 3 research revision are re-read from this exact detached candidate.
 * Research deliberately emits no Charter fabrication event. */
export function deriveArc3ResearchAction(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  researchId: string;
  receiptOrdinal: number;
  codecNow: number;
}>): Arc3AppDerivationOutcome {
  try {
    const loadout = readArc2EngineeringLoadout(input.extensions);
    if (loadout.kind !== 'loaded') return refused(`arc2-loadout-${loadout.kind}`);
    requireArc2LegacyParity(loadout.loadout, input.draft);
    const capabilities = projectEngineeringCapabilities(loadout.loadout);
    const engineering = readArc3Engineering(input.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    if (engineering.kind !== 'loaded') return refused(`arc3-carrier-${engineering.kind}`);
    requireArc3LegacyParity(engineering.state, input.draft, input.codecNow);
    const plan = planResearchPurchase({
      state: engineering.state,
      /* The planner performs the runtime catalogue check; this cast only
         bridges the app's untrusted string request into that checked seam. */
      researchId: input.researchId as ResearchId,
      jumpDriveOwned: capabilities.jumpDrive,
      assets: {
        materials: quantityRecord(input.draft.cargo, 'cargo'),
        stardust: checkedEssence(input.draft.essence),
      },
      receiptOrdinal: input.receiptOrdinal,
    });
    if (plan.status !== 'planned') return refused(`research-${plan.reason}`);

    const economy = researchEconomy(input.draft, plan.result);
    const intent: Arc3LegacyMinedTimestampIntent = Object.freeze({ kind: 'preserve' });
    const projection = projectArc3EngineeringLegacyCompatibility({
      state: plan.nextState,
      prior: legacyPrior(input.draft),
      codecNow: input.codecNow,
      minedTimestampIntent: intent,
    });
    const write = prepareEngineeringWrite(input.extensions, plan.nextState);
    if (write === null) return refused('research-carrier-write-protected');
    applyV5ExtensionWrites(input.extensions, [write]);

    input.draft.cargo = economy.cargo;
    input.draft.cgx = economy.cgx;
    input.draft.essence = economy.essence;
    copyArc3LegacyProjection(input.draft, projection);
    return Object.freeze({
      kind: 'ready',
      derivation: Object.freeze({
        schema: ARC3_APP_DERIVATION_SCHEMA,
        operation: 'purchase-research',
        receiptOrdinal: input.receiptOrdinal,
        state: input.draft,
        extensionWrites: Object.freeze([write]),
        witness: plan.witness,
        nextEngineeringState: plan.nextState,
        nextArc2State: null,
        arc2Settlement: null,
        starterCharter: null,
        projection,
        minedTimestampIntent: intent,
        result: plan.result,
      }),
    });
  } catch (error) {
    return refused(error instanceof Error ? error.message : String(error));
  }
}

/** Derive one fixed Fabricator transaction. The Arc 3 plan is passed directly
 * to Arc 2 settlement without cloning or structural reconstitution, then both
 * namespace replacements and every compatibility field are preflighted before
 * the detached draft is touched. */
export function deriveArc3FixedFabricationAction(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  baseId: string;
  activePlayMs: number;
  receiptOrdinal: number;
  codecNow: number;
}>): Arc3AppDerivationOutcome {
  try {
    const loadout = readArc2EngineeringLoadout(input.extensions);
    if (loadout.kind !== 'loaded') return refused(`arc2-loadout-${loadout.kind}`);
    const currentArc2 = requireArc2LegacyParity(loadout.loadout, input.draft);
    const currentMirror = projectArc2LootLegacyMirror(currentArc2);
    const engineering = readArc3Engineering(input.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    if (engineering.kind !== 'loaded') return refused(`arc3-carrier-${engineering.kind}`);
    requireArc3LegacyParity(engineering.state, input.draft, input.codecNow);
    const liveSignatures = signatureIds(input.draft);
    const itemCounts = quantityRecord(currentMirror.items, 'Arc 2 item mirror');
    const plan = planFixedFabrication({
      state: engineering.state,
      baseId: input.baseId,
      assets: {
        materials: quantityRecord(input.draft.cargo, 'cargo'),
        exceptionalMaterials: quantityRecord(input.draft.cgx, 'exceptional cargo'),
        itemCounts,
        stardust: checkedEssence(input.draft.essence),
        signatureIds: liveSignatures,
      },
      activePlay: { activePlayMs: input.activePlayMs },
      receiptOrdinal: input.receiptOrdinal,
    });
    if (plan.status !== 'planned') return refused(`fabrication-${plan.reason}`);
    const settlement = prepareArc2FixedFabrication(loadout.loadout, plan);
    if (settlement.status !== 'ready') return refused(`fabrication-arc2-${settlement.reason}`);
    if (settlement.preservedGates.prerequisiteId !== null
      && (itemCounts[settlement.preservedGates.prerequisiteId] ?? 0) < 1) {
      return refused('fabrication-prerequisite-recheck-failed');
    }
    if (settlement.preservedGates.signatureId !== null
      && !liveSignatures.includes(settlement.preservedGates.signatureId)) {
      return refused('fabrication-signature-recheck-failed');
    }

    const economy = stagedEconomyDeltas(
      input.draft,
      settlement.compatibilityDelta.cargo,
      settlement.compatibilityDelta.cgx,
      settlement.compatibilityDelta.essence,
    );
    const stats = stagedStats(input.draft, { crafts: 1 });
    const definition = getLootCatalogueDefinition(settlement.baseId);
    if (definition === undefined) return refused('fabrication-result-unknown');
    const ascProg = checkedCharterProgress(input.draft);
    bankFixedFabrication(input.draft.ascCh, ascProg, {
      id: definition.id,
      category: definition.category,
    });
    const charter = reconciledCharter(input.draft, ascProg, settlement.mirror.items);

    const intent: Arc3LegacyMinedTimestampIntent = plan.result.baseId === 'autoext'
      ? Object.freeze({ kind: 'refresh-all' })
      : Object.freeze({ kind: 'preserve' });
    const projection = projectArc3EngineeringLegacyCompatibility({
      state: plan.nextState,
      prior: legacyPrior(input.draft),
      codecNow: input.codecNow,
      minedTimestampIntent: intent,
    });
    const engineeringWrite = prepareEngineeringWrite(input.extensions, plan.nextState);
    if (engineeringWrite === null) return refused('fabrication-arc3-write-protected');
    const arc2Write = prepareArc2LootInventoryWrite({
      extensions: input.extensions,
      inventory: settlement.state.inventory,
      stackableCounts: settlement.state.stackableCounts,
    });
    if (arc2Write.kind !== 'prepared') return refused(`fabrication-arc2-write-${arc2Write.reason}`);
    if (arc2Write.state.kind !== 'inventory'
      || encodeArc2LootCarrier(arc2Write.state).json !== encodeArc2LootCarrier(settlement.state).json) {
      return refused('fabrication-arc2-write-state-mismatch');
    }
    const fabricationWrites: readonly V5ExtensionWrite[] = Object.freeze([
      engineeringWrite,
      arc2Write.write,
    ]);
    const candidate = structuredClone(input.draft);
    candidate.cargo = economy.cargo;
    candidate.cgx = economy.cgx;
    candidate.essence = economy.essence;
    copyArc2LegacyMirror(candidate, settlement.mirror);
    candidate.stats = stats;
    candidate.ascCh = charter.ascCh;
    candidate.ascProg = charter.ascProg;
    copyArc3LegacyProjection(candidate, projection);
    const starterCharter = stageStarterCharterActionV1({
      draft: candidate,
      extensions: input.extensions,
      predecessorWrites: fabricationWrites,
      predecessorWitness: plan.witness,
      event: { kind: 'crafted', baseId: definition.id, category: definition.category },
      receiptOrdinal: input.receiptOrdinal,
    });
    if (starterCharter.kind === 'refused') {
      return refused(`starter-charter-${starterCharter.reason}`);
    }
    const finalArc2 = readArc2Loot(starterCharter.extensions);
    if (finalArc2.kind !== 'loaded' || finalArc2.state.kind !== 'inventory') {
      return refused(`starter-charter-arc2-${finalArc2.kind}`);
    }
    if (!arc2LootLegacyMirrorMatches(finalArc2.state, candidate)) {
      return refused('starter-charter-arc2-legacy-mirror-mismatch');
    }

    input.draft.cargo = candidate.cargo;
    input.draft.cgx = candidate.cgx;
    input.draft.ascCh = candidate.ascCh;
    input.draft.ascProg = { ...candidate.ascProg };
    publishStarterCharterActionFieldsV1(input.draft, candidate);
    copyArc3LegacyProjection(input.draft, projection);
    return Object.freeze({
      kind: 'ready',
      derivation: Object.freeze({
        schema: ARC3_APP_DERIVATION_SCHEMA,
        operation: 'fabricate-fixed',
        receiptOrdinal: input.receiptOrdinal,
        state: input.draft,
        extensionWrites: starterCharter.extensionWrites,
        witness: starterCharter.witness,
        nextEngineeringState: plan.nextState,
        nextArc2State: finalArc2.state,
        arc2Settlement: settlement,
        starterCharter: starterCharter.fact,
        projection,
        minedTimestampIntent: intent,
        result: plan.result,
      }),
    });
  } catch (error) {
    return refused(error instanceof Error ? error.message : String(error));
  }
}

function sameRows(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export type Arc3CommittedVerification =
  | Readonly<{
    kind: 'verified';
    state: EngineeringStateV2;
    projection: Arc3LegacyEngineeringProjection;
  }>
  | Readonly<{ kind: 'mismatch'; detail: string }>;

/** Re-read the committed carrier and independently project its compatibility
 * fields before the app publishes any owned live field. */
export function verifyArc3CommittedAction(input: Readonly<{
  extensions: V5Extensions;
  committed: SaveStateV2;
  expectedState: EngineeringStateV2;
  codecNow: number;
  minedTimestampIntent: Arc3LegacyMinedTimestampIntent;
}>): Arc3CommittedVerification {
  try {
    const loaded = readArc3Engineering(input.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
    if (loaded.kind !== 'loaded') return Object.freeze({ kind: 'mismatch', detail: `carrier-${loaded.kind}` });
    if (encodeEngineeringState(loaded.state) !== encodeEngineeringState(input.expectedState)) {
      return Object.freeze({ kind: 'mismatch', detail: 'carrier-state-mismatch' });
    }
    const projection = projectArc3EngineeringLegacyCompatibility({
      state: loaded.state,
      prior: legacyPrior(input.committed),
      codecNow: input.codecNow,
      minedTimestampIntent: input.minedTimestampIntent,
    });
    if (!sameRows(projection.legacy.mineX, input.committed.mineX)
      || !sameRows(projection.legacy.mined, input.committed.mined)
      || !sameRows(projection.legacy.skimX, input.committed.skimX)
      || !sameRows(projection.legacy.techOwned, input.committed.techOwned)) {
      return Object.freeze({ kind: 'mismatch', detail: 'carrier-legacy-projection-mismatch' });
    }
    return Object.freeze({ kind: 'verified', state: loaded.state, projection });
  } catch (error) {
    return Object.freeze({
      kind: 'mismatch', detail: error instanceof Error ? error.message : String(error),
    });
  }
}

type OwnedField = keyof SaveStateV2;

function verifyOwnedFields(
  committed: SaveStateV2,
  expected: SaveStateV2,
  fields: readonly OwnedField[],
  label: string,
): string | null {
  for (const field of fields) {
    if (!sameRows(committed[field], expected[field])) return `${label}-${String(field)}-mismatch`;
  }
  return null;
}

const RESEARCH_OWNED_FIELDS = Object.freeze([
  'cargo', 'cgx', 'essence', 'mineX', 'mined', 'skimX', 'techOwned',
] as const satisfies readonly OwnedField[]);
const MINE_OWNED_FIELDS = Object.freeze([
  'cargo', 'cgx', 'essence', 'items', 'equip', 'equipAff', 'stats', 'ascCh', 'ascProg',
  'chacc', 'chDone', 'chProg', 'unlocked', 'mineX', 'mined', 'skimX', 'techOwned',
] as const satisfies readonly OwnedField[]);
const FIXED_FABRICATION_OWNED_FIELDS = Object.freeze([
  'cargo', 'cgx', 'essence', 'items', 'equip', 'equipAff', 'stats', 'ascCh', 'ascProg',
  'chacc', 'chDone', 'chProg', 'unlocked', 'mineX', 'mined', 'skimX', 'techOwned',
] as const satisfies readonly OwnedField[]);

/** Post-durable research verification is deliberately independent of the
 * derivation path: re-decode Arc 3, rebuild its compatibility projection, and
 * compare each research-owned field with the pre-CAS expected candidate. */
export function verifyArc3CommittedResearchAction(input: Readonly<{
  extensions: V5Extensions;
  committed: SaveStateV2;
  expectedOwnedState: SaveStateV2;
  expectedState: EngineeringStateV2;
  codecNow: number;
  minedTimestampIntent: Arc3LegacyMinedTimestampIntent;
}>): Arc3CommittedVerification {
  const carrier = verifyArc3CommittedAction(input);
  if (carrier.kind !== 'verified') return carrier;
  const mismatch = verifyOwnedFields(
    input.committed,
    input.expectedOwnedState,
    RESEARCH_OWNED_FIELDS,
    'research-owned',
  );
  return mismatch === null ? carrier : Object.freeze({ kind: 'mismatch', detail: mismatch });
}

export type Arc3MineCommittedVerification =
  | Readonly<{
    kind: 'verified';
    state: EngineeringStateV2;
    arc2State: Arc2LootInventoryV1 | null;
    projection: Arc3LegacyEngineeringProjection;
  }>
  | Readonly<{ kind: 'mismatch'; detail: string }>;

/** Verify the complete Mine successor, including any same-CAS Starter
 * Charter reward/progression state and its optional Arc 2 gear carrier. */
export function verifyArc3CommittedMineAction(input: Readonly<{
  extensions: V5Extensions;
  committed: SaveStateV2;
  expectedOwnedState: SaveStateV2;
  expectedEngineeringState: EngineeringStateV2;
  expectedArc2State: Arc2LootInventoryV1 | null;
  codecNow: number;
  minedTimestampIntent: Arc3LegacyMinedTimestampIntent;
}>): Arc3MineCommittedVerification {
  const engineering = verifyArc3CommittedAction({
    extensions: input.extensions,
    committed: input.committed,
    expectedState: input.expectedEngineeringState,
    codecNow: input.codecNow,
    minedTimestampIntent: input.minedTimestampIntent,
  });
  if (engineering.kind !== 'verified') return engineering;
  try {
    let arc2State: Arc2LootInventoryV1 | null = null;
    if (input.expectedArc2State !== null) {
      const arc2 = readArc2Loot(input.extensions);
      if (arc2.kind !== 'loaded') {
        return Object.freeze({ kind: 'mismatch', detail: `arc2-carrier-${arc2.kind}` });
      }
      if (arc2.state.kind !== 'inventory') {
        return Object.freeze({ kind: 'mismatch', detail: 'arc2-carrier-legacy-protected' });
      }
      if (!sameRows(encodeArc2LootCarrier(arc2.state), encodeArc2LootCarrier(input.expectedArc2State))) {
        return Object.freeze({ kind: 'mismatch', detail: 'arc2-carrier-state-mismatch' });
      }
      if (!arc2LootLegacyMirrorMatches(arc2.state, input.committed)) {
        return Object.freeze({ kind: 'mismatch', detail: 'arc2-carrier-legacy-projection-mismatch' });
      }
      arc2State = arc2.state;
    }
    const mismatch = verifyOwnedFields(
      input.committed,
      input.expectedOwnedState,
      MINE_OWNED_FIELDS,
      'mine-owned',
    );
    if (mismatch !== null) return Object.freeze({ kind: 'mismatch', detail: mismatch });
    return Object.freeze({
      kind: 'verified', state: engineering.state, arc2State, projection: engineering.projection,
    });
  } catch (error) {
    return Object.freeze({
      kind: 'mismatch', detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export type Arc3FixedCommittedVerification =
  | Readonly<{
    kind: 'verified';
    state: EngineeringStateV2;
    arc2State: Arc2LootInventoryV1;
    projection: Arc3LegacyEngineeringProjection;
  }>
  | Readonly<{ kind: 'mismatch'; detail: string }>;

/** Re-read and prove both committed carriers and both legacy projections.
 * Any mismatch is terminal for this action: the coordinator reloads durable
 * truth and must never retry the already-receipted craft. */
export function verifyArc3CommittedFixedFabricationAction(input: Readonly<{
  extensions: V5Extensions;
  committed: SaveStateV2;
  expectedOwnedState: SaveStateV2;
  expectedEngineeringState: EngineeringStateV2;
  expectedArc2State: Arc2LootInventoryV1;
  codecNow: number;
  minedTimestampIntent: Arc3LegacyMinedTimestampIntent;
}>): Arc3FixedCommittedVerification {
  const engineering = verifyArc3CommittedAction({
    extensions: input.extensions,
    committed: input.committed,
    expectedState: input.expectedEngineeringState,
    codecNow: input.codecNow,
    minedTimestampIntent: input.minedTimestampIntent,
  });
  if (engineering.kind !== 'verified') return engineering;
  try {
    const arc2 = readArc2Loot(input.extensions);
    if (arc2.kind !== 'loaded') {
      return Object.freeze({ kind: 'mismatch', detail: `arc2-carrier-${arc2.kind}` });
    }
    if (arc2.state.kind !== 'inventory') {
      return Object.freeze({ kind: 'mismatch', detail: 'arc2-carrier-legacy-protected' });
    }
    if (!sameRows(encodeArc2LootCarrier(arc2.state), encodeArc2LootCarrier(input.expectedArc2State))) {
      return Object.freeze({ kind: 'mismatch', detail: 'arc2-carrier-state-mismatch' });
    }
    if (!arc2LootLegacyMirrorMatches(arc2.state, input.committed)) {
      return Object.freeze({ kind: 'mismatch', detail: 'arc2-carrier-legacy-projection-mismatch' });
    }
    const mismatch = verifyOwnedFields(
      input.committed,
      input.expectedOwnedState,
      FIXED_FABRICATION_OWNED_FIELDS,
      'fixed-owned',
    );
    if (mismatch !== null) return Object.freeze({ kind: 'mismatch', detail: mismatch });
    return Object.freeze({
      kind: 'verified',
      state: engineering.state,
      arc2State: arc2.state,
      projection: engineering.projection,
    });
  } catch (error) {
    return Object.freeze({
      kind: 'mismatch', detail: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Publish only mining-owned legacy compatibility fields. The outer SaveState
 * object and its Atlas/log identities remain intact. */
export function publishArc3MiningFields(target: SaveStateV2, committed: SaveStateV2): void {
  target.cargo = committed.cargo.map(([id, count]) => [id, count]);
  target.cgx = committed.cgx.map(([id, count]) => [id, count]);
  target.ascCh = committed.ascCh;
  target.ascProg = { ...committed.ascProg };
  publishStarterCharterActionFieldsV1(target, committed);
  publishArc3LegacyCompatibilityFields(target, committed);
}

/** Publish only stellar-skim-owned legacy compatibility fields. */
export function publishArc3SkimFields(target: SaveStateV2, committed: SaveStateV2): void {
  target.cargo = committed.cargo.map(([id, count]) => [id, count]);
  target.cgx = committed.cgx.map(([id, count]) => [id, count]);
  target.stats = { ...committed.stats };
  target.hp = committed.hp;
  publishArc3LegacyCompatibilityFields(target, committed);
}

/** Publish only the research-owned economy and Arc 3 compatibility fields. */
export function publishArc3ResearchFields(target: SaveStateV2, committed: SaveStateV2): void {
  target.cargo = committed.cargo.map(([id, count]) => [id, count]);
  target.cgx = committed.cgx.map(([id, count]) => [id, count]);
  target.essence = committed.essence;
  publishArc3LegacyCompatibilityFields(target, committed);
}

/** Publish only fixed-fabrication-owned fields. The outer SaveState and every
 * unrelated Atlas/log collection retain their live identities. */
export function publishArc3FixedFabricationFields(target: SaveStateV2, committed: SaveStateV2): void {
  target.cargo = committed.cargo.map(([id, count]) => [id, count]);
  target.cgx = committed.cgx.map(([id, count]) => [id, count]);
  target.ascCh = committed.ascCh;
  target.ascProg = { ...committed.ascProg };
  publishStarterCharterActionFieldsV1(target, committed);
  publishArc3LegacyCompatibilityFields(target, committed);
}
