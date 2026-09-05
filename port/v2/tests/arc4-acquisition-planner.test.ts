import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import * as acquisitionRoot from '@cf/domain-acquisition';
import {
  MAX_OWNERSHIP_REVISION,
  ACTIVE_PLAY_CAPTURE_CYCLE_MS,
  CAPTURE_PRESENTATION_SCHEMA,
  CAPTURE_PRESENTATION_FENCE_PREFIX,
  CAPTURE_PLANNER_POLICY_BLOCKERS_V1,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  TAME_ODDS_V1,
  captureChanceV1,
  captureHitV1,
  capturePresentationFenceV1,
  formatCaptureChancePercentV1,
  createBiosphereProgressV1,
  createEmptyOwnershipStateV1,
  createInitialOwnershipStateV1,
  createLegacyBioXEvidenceV1,
  createLegacyProtectedOwnershipStateV1,
  canonicalJson,
  decodeOwnershipStateV1,
  encodeOwnershipStateV1,
  isAcquisitionSnapshotV1,
  isCaptureAttemptPlanV1,
  isCaptureDrawBundleV1,
  isCaptureCapacityScenariosV1,
  isOwnershipSuccessorV1,
  migrateLegacyOwnershipStateV1,
  ownershipStateDigestV1,
  ownershipSourceStateV1,
  ownershipContentId,
  planCaptureV1,
  preflightCaptureV1,
  projectCaptureCapacityScenariosV1,
  projectCapturePresentationV1,
  sha256Hex,
  type AcquisitionCandidateV1,
  type CanonicalJson,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  biosphere,
  planetSpeciesAtEcologyEpoch,
} from '@cf/domain-ecology';
import { _earthNamePass, installCaptureHooks } from '@cf/domain-descriptors';
import { describeSpecies, makeGenome, type Genome } from '@cf/domain-genome';
import { createEngineeringState, planFixedFabrication } from '@cf/domain-opportunity';
import { climateBand } from '@cf/domain-surveyphrases';
import { ASC_RING_R, regionAt, ringGrade } from '@cf/domain-strays';
import { systemFor } from '@cf/domain-worldgen';
import {
  DOMAINS,
  createSessionRNG,
} from '@cf/domain-sessionrng';
import {
  ARC4_OWNERSHIP_MANIFEST_NAMESPACE,
  ARC2_LOOT_NAMESPACE,
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  createF4MultiOutcomePreDrawTransactionOwner,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  encodeArc4Ownership,
  encodeArc2LootCarrier,
  exportSaveV2,
  importSaveV2,
  prepareArc2LootLegacyMigration,
  prepareArc2FixedFabrication,
  prepareArc5CaptureOwnershipMigrationSuccessor,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  projectF4MultiOutcomeDrawAdvance,
  projectLegacyOwnershipMirror,
  readArc2AcquisitionCapabilities,
  readArc2EngineeringLoadout,
  readArc5OwnershipMigration,
  readF4Authority,
  type ContentRegistry,
  type F4MultiOutcomePreDrawInput,
  type F4MultiOutcomePreDrawSaveCodec,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import {
  navFromCanonicalCF1Address,
  resolveCF1WorldAddress,
  galaxyScene,
  systemScene,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  composeAcquisitionSnapshotV1,
  composeCaptureDrawBundleV1,
} from '../apps/game/src/acquisition-snapshot.js';
import { registerAcquisitionSnapshotV1 } from '@cf/domain-acquisition/snapshot-internal';
import { createCaptureOwnershipSourceProjectionSuccessorV2 } from '@cf/domain-acquisition/ownership-v2-internal';
import {
  canonicalWorldRoster,
  canonicalWorldRosterForDiagnostics,
  type CanonicalWorldRoster,
  type WorldRosterSources,
} from '../apps/game/src/world-roster.js';
import {
  ARC4_CAPTURE_DOMAINS,
  certifyArc4CaptureCapacityV1,
  settleCertifiedArc4CaptureV1,
  type Arc4CaptureCapacityCertificateV1,
} from '../apps/game/src/arc4-capture-capacity.js';

beforeAll(() => installCaptureHooks());

const V2_ROOT = fileURLToPath(new URL('../', import.meta.url));
const CAPACITY_REGISTRY = JSON.parse(fs.readFileSync(path.join(
  V2_ROOT,
  '..',
  'baseline-v1.8.9',
  'content-registry.json',
), 'utf8')) as ContentRegistry;
const CAPACITY_NOW = 1_753_900_060_000;
const CAPACITY_CODEC: F4MultiOutcomePreDrawSaveCodec = Object.freeze({
  now: CAPACITY_NOW,
  receiptKind: 'capture-attempt',
  prepare: (writable: Parameters<F4MultiOutcomePreDrawSaveCodec['prepare']>[0]) => (
    prepareV5SaveWrite(writable, CAPACITY_REGISTRY, CAPACITY_NOW)
  ),
  importLegacy: (raw: string) => importSaveV2(raw, CAPACITY_REGISTRY, CAPACITY_NOW),
  exportLegacy: (state: SaveStateV2) => exportSaveV2(state, CAPACITY_NOW),
});
const INTERNAL_SNAPSHOT_IMPORT = '@cf/domain-acquisition/snapshot-internal';
const INTERNAL_SNAPSHOT_BASENAME = 'snapshot-internal';
const SNAPSHOT_REGISTRY_BASENAME = '_snapshot-registry';
const SNAPSHOT_MINT = 'registerAcquisitionSnapshotV1';
const DRAW_MINT = 'registerCaptureDrawBundleV1';
const SNAPSHOT_REGISTRY_MINT = 'registerAcquisitionSnapshotAuthority';
const DRAW_REGISTRY_MINT = 'registerCaptureDrawBundleAuthority';
const CAPTURE_PLAN_ENTRY = 'planCaptureV1';
const APP_COMPOSITOR = 'apps/game/src/acquisition-snapshot.ts';
const INTERNAL_DEFINITION = 'packages/domain/acquisition/src/snapshot-internal.ts';
const REGISTRY_DEFINITION = 'packages/domain/acquisition/src/_snapshot-registry.ts';
const SNAPSHOT_DEFINITION = 'packages/domain/acquisition/src/snapshot.ts';
const CAPTURE_PLANNER_DEFINITION = 'packages/domain/acquisition/src/capture-planner.ts';
const CAPTURE_TRANSACTION_OWNER = 'apps/game/src/arc4-capture-capacity.ts';
const THIS_TEST = 'tests/arc4-acquisition-planner.test.ts';

const MODULE_SOURCE_EXTENSIONS = Object.freeze([
  '.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs',
]);

function TypeScriptFilesUnder(directory: string): readonly string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() && !['node_modules', 'dist', 'coverage'].includes(entry.name)
      ? TypeScriptFilesUnder(absolute)
      : entry.isFile() && MODULE_SOURCE_EXTENSIONS.some((extension) => (
        entry.name.endsWith(extension)
      )) ? [absolute] : [];
  });
}

function relativeV2Path(absolute: string): string {
  return path.relative(V2_ROOT, absolute).split(path.sep).join('/');
}

function compactStaticAuthoritySource(source: string): string {
  return source.replace(/[\s'"`+]/gu, '');
}

function referencesInternalSnapshotCompact(compact: string): boolean {
  return compact.includes(INTERNAL_SNAPSHOT_IMPORT)
    || compact.includes(INTERNAL_SNAPSHOT_BASENAME);
}

function referencesInternalSnapshotModule(source: string): boolean {
  return referencesInternalSnapshotCompact(compactStaticAuthoritySource(source));
}

function referencesSnapshotRegistryCompact(compact: string): boolean {
  return compact.includes(SNAPSHOT_REGISTRY_BASENAME);
}

function referencesSnapshotRegistryModule(source: string): boolean {
  return referencesSnapshotRegistryCompact(compactStaticAuthoritySource(source));
}

function referencesSnapshotMintCompact(compact: string): boolean {
  return compact.includes(SNAPSHOT_MINT) || compact.includes(DRAW_MINT);
}

function referencesSnapshotMint(source: string): boolean {
  return referencesSnapshotMintCompact(compactStaticAuthoritySource(source));
}

function referencesSnapshotRegistryMintCompact(compact: string): boolean {
  return compact.includes(SNAPSHOT_REGISTRY_MINT) || compact.includes(DRAW_REGISTRY_MINT);
}

function referencesSnapshotRegistryMint(source: string): boolean {
  return referencesSnapshotRegistryMintCompact(compactStaticAuthoritySource(source));
}

function referencesCapturePlanEntryCompact(compact: string): boolean {
  return compact.includes(CAPTURE_PLAN_ENTRY);
}

function referencesCapturePlanEntry(source: string): boolean {
  return referencesCapturePlanEntryCompact(compactStaticAuthoritySource(source));
}

function forbiddenSnapshotAuthorityReference(relativePath: string, source: string): boolean {
  return (referencesInternalSnapshotModule(source)
      && relativePath !== APP_COMPOSITOR
      && relativePath !== THIS_TEST)
    || (referencesSnapshotMint(source)
      && relativePath !== INTERNAL_DEFINITION
      && relativePath !== APP_COMPOSITOR
      && relativePath !== THIS_TEST);
}

function forbiddenSnapshotRegistryReference(relativePath: string, source: string): boolean {
  return (referencesSnapshotRegistryModule(source)
      && relativePath !== REGISTRY_DEFINITION
      && relativePath !== SNAPSHOT_DEFINITION
      && relativePath !== INTERNAL_DEFINITION
      && relativePath !== THIS_TEST)
    || (referencesSnapshotRegistryMint(source)
      && relativePath !== REGISTRY_DEFINITION
      && relativePath !== INTERNAL_DEFINITION
      && relativePath !== THIS_TEST);
}

function hasComputedDynamicImport(source: string): boolean {
  const calls = source.matchAll(/\bimport\s*\(\s*([^)]*?)\s*\)/gu);
  const literal = /^(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\$]|\$(?!\{))*`)$/u;
  for (const match of calls) {
    if (!literal.test(match[1]?.trim() ?? '')) return true;
  }
  return false;
}

const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL = Object.freeze({ seed: 424242, x: 560, y: 170 });
const FOREIGN_GALAXY = Object.freeze({ seed: 394332036, x: -300.95, y: 175.47 });
const FOREIGN_STAR = Object.freeze({ seed: 676840317, x: 27.3, y: -24.6 });
const RING3_WORLD = Object.freeze({
  galaxy: Object.freeze({ seed: 2168115821, x: -1104.3939002789557, y: -1400.6738864816725 }),
  star: Object.freeze({ seed: 2404948836, x: 79.28673347271979, y: 172.30901278089732 }),
  planetSeed: 2525295284,
});
const RING4_WORLD = Object.freeze({
  galaxy: Object.freeze({ seed: 742431365, x: 357.33832279220223, y: 1882.66924303025 }),
  star: Object.freeze({ seed: 134687484, x: 219.1186681254767, y: -157.20003835111856 }),
  planetSeed: 2525295284,
});
const DEEP_LIVING_WORLD = Object.freeze({
  galaxy: Object.freeze({
    seed: 1012779741,
    x: -599.7658047693408,
    y: -6073.942273357868,
  }),
  star: Object.freeze({
    seed: 3589953231,
    x: -138.81464905291796,
    y: -21.96363354055211,
  }),
  planetSeed: 3533877330,
});

function addressOf(
  galaxy: { seed: number; x: number; y: number },
  star: { seed: number; x: number; y: number },
  planetSeed: number,
): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress({ galaxy, star, planet: { seed: planetSeed } });
  if (!resolved.ok) throw new Error(`world fixture did not prove: ${resolved.reason}`);
  return resolved.address;
}

function rosterOf(address: CanonicalCF1WorldAddress, ecologyEpoch = 0): CanonicalWorldRoster {
  const result = canonicalWorldRoster(address, ecologyEpoch);
  if (!result.ok) throw new Error(`roster fixture failed: ${result.reason}:${result.message}`);
  return result.roster;
}

function arc2F4Extensions(
  activePlayMs = 0,
  seed = 12_345,
  draws: Record<string, number> = {},
  ordinal = 0,
  withContact = true,
): V5Extensions {
  const arc2 = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: {
      items: withContact
        ? [['earpiece', 1], ['diplobeacon', 1], ['prismpendant', 1]]
        : [],
      equip: withContact ? { ears: 'earpiece', necklace: 'diplobeacon' } : {},
      equipAff: withContact ? { ears: { k: 'contact', v: 7, forId: 'earpiece' } } : {},
    },
    capacity: 6,
  });
  if (arc2.kind !== 'prepared') throw new Error(`Arc 2 fixture was ${arc2.kind}`);
  return prepareF4AuthorityUpdate(
    arc2.extensions,
    { activePlayMs },
    createSessionRNG(seed, draws, ordinal).state(),
  ).extensions;
}

function withOwnership(
  extensions: V5Extensions,
  ownership: OwnershipStateV1,
): V5Extensions {
  return applyV5ExtensionWrites(extensions, encodeArc4Ownership(ownership).writes).extensions;
}

function authorityExtensions(
  activePlayMs = 0,
  seed = 12_345,
  draws: Record<string, number> = {},
  ordinal = 0,
  withContact = true,
  ownership: OwnershipStateV1 = createEmptyOwnershipStateV1(),
): V5Extensions {
  const arc4 = withOwnership(
    arc2F4Extensions(activePlayMs, seed, draws, ordinal, withContact),
    ownership,
  );
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(`Arc 5 fixture was ${arc5.kind}`);
  return arc5.extensions;
}

function exceptionalContactAuthorityExtensions(): V5Extensions {
  const empty = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: [], equip: {}, equipAff: {} },
    capacity: 6,
  });
  if (empty.kind !== 'prepared') throw new Error(`exceptional Arc 2 fixture was ${empty.kind}`);
  const source = readArc2EngineeringLoadout(empty.extensions);
  if (source.kind !== 'loaded') throw new Error(`exceptional loadout was ${source.kind}`);
  const plan = planFixedFabrication({
    state: createEngineeringState(),
    baseId: 'meteor',
    assets: {
      materials: { C: 1, Ni: 2 },
      exceptionalMaterials: { C: 1, Ni: 2 },
      itemCounts: {}, stardust: 0, signatureIds: [],
    },
    activePlay: { activePlayMs: 0 },
    receiptOrdinal: 4,
  });
  if (plan.status !== 'planned') throw new Error(`exceptional plan was ${plan.reason}`);
  const settled = prepareArc2FixedFabrication(source.loadout, plan);
  if (settled.status !== 'ready') throw new Error(`exceptional settlement was ${settled.reason}`);
  const crafted = canonicalizeV5Extensions({
    ...empty.extensions,
    inventory: {
      ...empty.extensions.inventory,
      [ARC2_LOOT_NAMESPACE]: encodeArc2LootCarrier(settled.state),
    },
  });
  const f4 = prepareF4AuthorityUpdate(
    crafted,
    { activePlayMs: 0 },
    createSessionRNG(12_345).state(),
  ).extensions;
  const arc4 = withOwnership(f4, createEmptyOwnershipStateV1());
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(`exceptional Arc 5 fixture was ${arc5.kind}`);
  return arc5.extensions;
}

function currentArc5Parent(extensions: V5Extensions): OwnershipStateV2 {
  const loaded = readArc5OwnershipMigration(
    extensions,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  );
  if (loaded.kind !== 'loaded'
    || loaded.evidence.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION) {
    throw new Error(`Arc 5 planner parent fixture was ${loaded.kind}`);
  }
  return loaded.state;
}

function extensionJsonBytes(extensions: V5Extensions): number {
  const encoder = new TextEncoder();
  return Object.values(extensions).reduce((total, segment) => (
    total + Object.values(segment ?? {}).reduce((segmentTotal, carrier) => (
      segmentTotal + encoder.encode(carrier.json).byteLength
    ), 0)
  ), 0);
}

function jsonObjectOfExactBytes(bytes: number): string {
  const shellBytes = JSON.stringify({ p: '' }).length;
  if (bytes < shellBytes || bytes > V5_MAX_EXTENSION_JSON_BYTES) {
    throw new RangeError('capacity padding carrier length is invalid');
  }
  const raw = JSON.stringify({ p: 'x'.repeat(bytes - shellBytes) });
  if (new TextEncoder().encode(raw).byteLength !== bytes) {
    throw new Error('capacity padding carrier changed byte length');
  }
  return raw;
}

function padExtensionsToGlobalByteLimit(extensions: V5Extensions): V5Extensions {
  const padded = structuredClone(extensions) as Record<
    string,
    Record<string, { version: number; json: string }>
  >;
  const settings = (padded.settings ??= {});
  let remaining = V5_MAX_EXTENSION_TOTAL_BYTES - extensionJsonBytes(extensions);
  let index = 0;
  while (remaining > 0) {
    const bytes = Math.min(remaining, V5_MAX_EXTENSION_JSON_BYTES);
    if (bytes < JSON.stringify({ p: '' }).length) {
      throw new Error('capacity padding left an unrepresentable tail');
    }
    settings[`test.arc4-capacity-pad-${index++}`] = {
      version: 99,
      json: jsonObjectOfExactBytes(bytes),
    };
    remaining -= bytes;
  }
  const canonical = canonicalizeV5Extensions(padded);
  if (extensionJsonBytes(canonical) !== V5_MAX_EXTENSION_TOTAL_BYTES) {
    throw new Error('capacity padding did not reach the exact global byte limit');
  }
  return canonical;
}

function navOf(address: CanonicalCF1WorldAddress) {
  const result = navFromCanonicalCF1Address(address);
  if (!result.ok || result.state.mode !== 'surface') {
    throw new Error(`surface Nav fixture failed: ${result.ok ? result.state.mode : result.reason}`);
  }
  return result.state;
}

function readySnapshot(
  address: CanonicalCF1WorldAddress,
  roster: CanonicalWorldRoster,
  extensions: V5Extensions,
) {
  const result = composeAcquisitionSnapshotV1({
    nav: navOf(address),
    address,
    roster,
    ecologyEpoch: roster.ecologyEpoch,
    fullRosterFingerprint: roster.fullRosterFingerprint,
    extensions,
  });
  if (result.kind !== 'ready') throw new Error(`snapshot fixture was ${result.reason}`);
  return result.snapshot;
}

function registeredSnapshotFromRows(
  address: CanonicalCF1WorldAddress,
  rosterRows: readonly Readonly<Record<string, unknown>>[],
  extensions: V5Extensions,
  ownership: OwnershipStateV1,
  ecologyEpoch = 0,
) {
  const capabilities = readArc2AcquisitionCapabilities(extensions);
  const f4 = readF4Authority(extensions);
  if (capabilities.kind !== 'loaded' || f4.kind !== 'loaded') {
    throw new Error('direct snapshot fixture lacks Arc 2/F4 authority');
  }
  return registerAcquisitionSnapshotV1({
    address,
    worldKey: address.key,
    ecologyEpoch,
    fullRosterFingerprint: `test-roster:${address.key}:${ecologyEpoch}:${rosterRows.length}`,
    biosphereKey: `test-${address.planet.seed}`,
    rosterRows,
    capabilities: capabilities.capabilities,
    ownership,
    f4Authority: f4.authority,
  });
}

function compatibilityStateForOwnership(ownership: OwnershipStateV1): SaveStateV2 {
  const base = importSaveV2('{}', CAPACITY_REGISTRY, CAPACITY_NOW);
  if (!base.ok) throw new Error(`capacity v4 base was ${base.reason}`);
  const mirror = projectLegacyOwnershipMirror(ownership);
  if (mirror.kind !== 'projected') throw new Error(`capacity mirror was ${mirror.kind}`);
  const envelope = JSON.parse(exportSaveV2(base.state, CAPACITY_NOW)) as Record<string, unknown>;
  envelope.codex = mirror.codex.map((row) => ({ g: row.g, f: row.f, w: row.w }));
  envelope.names = mirror.customNames.map(([key, value]) => [key, value]);
  envelope.bx = mirror.bioX.map(([seed, progress]) => [seed, [...progress]]);
  envelope.scout = mirror.scoutId;
  const imported = importSaveV2(JSON.stringify(envelope), CAPACITY_REGISTRY, CAPACITY_NOW);
  if (!imported.ok) throw new Error(`capacity v4 mirror import was ${imported.reason}`);
  return imported.state;
}

function capacityPreDrawInput(
  state: SaveStateV2,
  extensions: V5Extensions,
  activePlayMs: number,
): F4MultiOutcomePreDrawInput {
  const projected = projectF4MultiOutcomeDrawAdvance(extensions, ARC4_CAPTURE_DOMAINS);
  if (projected.kind !== 'projected') throw new Error(`capacity projection was ${projected.reason}`);
  return Object.freeze({
    domains: projected.plan.domains,
    counters: projected.plan.counters,
    receiptOrdinal: projected.plan.receiptOrdinal,
    activePlayMs,
    currentAuthority: projected.plan.currentAuthority,
    nextSessionRng: projected.plan.nextSessionRng,
    codec: CAPACITY_CODEC,
    draft: state,
    extensions,
  });
}

async function settleCapacityThroughGenuineOwner(
  preflight: Extract<ReturnType<typeof preflightCaptureV1>, { kind: 'ready' }>,
  state: SaveStateV2,
  extensions: V5Extensions,
  activePlayMs: number,
): Promise<Extract<ReturnType<typeof settleCertifiedArc4CaptureV1>, { kind: 'derived' }>> {
  const backend = createMemoryBackend();
  const lease = createTabLeaseClient(backend, {
    ownerId: 'arc4-planner-genuine-settlement',
    token: 'arc4-planner-genuine-settlement-session',
    ttlMs: 1_000,
    now: () => 0,
  });
  const acquired = await lease.acquire();
  if (acquired.kind !== 'acquired') throw new Error(`planner settlement lease was ${acquired.kind}`);
  const owner = createF4MultiOutcomePreDrawTransactionOwner(
    createRevisionedRepository(backend),
    CAPACITY_REGISTRY,
  );
  const settlements: ReturnType<typeof settleCertifiedArc4CaptureV1>[] = [];
  const outcome = await owner.commit<Arc4CaptureCapacityCertificateV1, string>({
    expectedRevision: 0,
    grant: acquired.grant,
    writable: { state, extensions },
    snapshot: { activePlayMs },
    domains: ARC4_CAPTURE_DOMAINS,
    receiptKind: 'capture-attempt',
    now: CAPACITY_NOW,
    preDraw: (input, authorizer) => {
      const certified = certifyArc4CaptureCapacityV1({
        preflight, parent: currentArc5Parent(extensions), preDraw: input,
      });
      if (certified.kind !== 'certified') {
        return { kind: 'refused' as const, reason: certified.reason };
      }
      return authorizer.ready(certified.certificate, (draw, settlementAuthorizer) => {
        const settled = settleCertifiedArc4CaptureV1({
          preflight,
          draw,
          authorizer: settlementAuthorizer,
        });
        settlements.push(settled);
        if (settled.kind !== 'derived') throw new Error(`planner settlement was ${settled.reason}`);
        return settled.authorization;
      });
    },
  });
  if (outcome.kind !== 'committed') throw new Error(`planner settlement commit was ${outcome.kind}`);
  const settled = settlements[0];
  if (settled?.kind !== 'derived') throw new Error('planner settlement result disappeared');
  return settled;
}

function firstBarrenSolWorld(): CanonicalCF1WorldAddress {
  const planet = systemScene(SOL.seed).planets.find((row) => row.seed !== 133);
  if (!planet) throw new Error('Sol fixture lacks a barren non-Earth planet');
  return addressOf(HOME_GALAXY, SOL, planet.seed);
}

function firstLivingForeignWorld(): Readonly<{
  address: CanonicalCF1WorldAddress;
  roster: CanonicalWorldRoster;
}> {
  for (const planet of systemScene(FOREIGN_STAR.seed).planets) {
    const address = addressOf(FOREIGN_GALAXY, FOREIGN_STAR, planet.seed);
    const roster = rosterOf(address);
    if (roster.view.total > 0) return Object.freeze({ address, roster });
  }
  throw new Error('foreign system fixture has no living world');
}

function seedForSuccessDraw(predicate: (value: number) => boolean): number {
  for (let seed = 0; seed < 100_000; seed++) {
    if (predicate(createSessionRNG(seed).at(DOMAINS.captureSuccess, 0))) return seed;
  }
  throw new Error('could not find bounded SessionRNG test seed');
}

const HIT_SEED = seedForSuccessDraw((value) => value < 0.001);
const MISS_SEED = seedForSuccessDraw((value) => value > 0.99);

function independentBiosphereYield(planetSeed: number, rosterSize: number): number {
  if (rosterSize === 0) return 0;
  const random = (() => {
    let h = planetSeed | 0;
    h = Math.imul(h ^ 0xB105, 374761393);
    h = Math.imul(h ^ 5, 668265263);
    h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13;
    let a = h >>> 0;
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  })();
  return Math.max(3, Math.min(16,
    3 + Math.round(rosterSize * 1.2) + Math.round((random() - 0.5) * 4),
  ));
}

function independentCaptureTier(
  snapshot: ReturnType<typeof readySnapshot>,
  candidate: AcquisitionCandidateV1,
): number {
  const genome = candidate.identity.genome as unknown as Genome;
  const grade = describeSpecies(genome).grade as unknown as Record<string, unknown>;
  const graded = ringGrade(genome, grade, {
    gal: {
      seed: snapshot.address.galaxy.seed,
      x: snapshot.address.galaxy.x,
      y: snapshot.address.galaxy.y,
    },
    star: {
      seed: snapshot.address.star.seed,
      x: snapshot.address.star.x,
      y: snapshot.address.star.y,
    },
    pseed: snapshot.planetSeed,
  });
  return typeof graded?.tier === 'number' ? graded.tier : 0;
}

function denseCapacityState(targetRows = 20_000): OwnershipStateV1 {
  if (!Number.isInteger(targetRows) || targetRows < 3 || targetRows > 20_000) {
    throw new RangeError('dense capacity target is invalid');
  }
  const creatureRows = Math.ceil(targetRows / 131);
  let mementosRemaining = targetRows - creatureRows * 3;
  /* Compact mementos bring the three mandatory legacy rows per creature to
     the requested global count while still fitting the settled carrier's
     existing byte ceiling. This exercises the model ceiling without deciding
     the planner's separate unresolved successor-byte policy. */
  const codexRows = Array.from({ length: creatureRows }, (_, index) => {
    const genome = makeGenome(1_000_000 + index, 'fauna', 0.5);
    const count = Math.min(128, mementosRemaining);
    mementosRemaining -= count;
    genome.bond = {
      level: 0,
      memories: [],
      preferredRole: null,
      worldsSurvived: 0,
      guardianVictories: 0,
      mementoIds: Array.from({ length: count }, (__, memento) => `m${memento.toString(36)}`),
    };
    return {
      legacyCodexId: `capacity-${index}`,
      genome: genome as unknown as CanonicalJson,
      from: 'capacity control',
      legacyLocation: null,
      catalogAlias: null,
      faunaNickname: null,
    };
  });
  if (mementosRemaining !== 0) throw new Error('dense capacity fixture did not allocate exactly');
  return migrateLegacyOwnershipStateV1({
    legacyEpoch: 0,
    codexRows,
    bioXRows: [],
    scoutCodexId: null,
  }).state;
}

describe('Arc 4 registered acquisition snapshot ownership', () => {
  it('keeps both mints statically owned by the one app compositor with non-vacuous controls', () => {
    const sourceRows = [
      ...TypeScriptFilesUnder(path.join(V2_ROOT, 'packages')),
      ...TypeScriptFilesUnder(path.join(V2_ROOT, 'apps')),
      ...TypeScriptFilesUnder(path.join(V2_ROOT, 'tests')),
    ].map((absolute) => ({
      absolute,
      relative: relativeV2Path(absolute),
      source: fs.readFileSync(absolute, 'utf8'),
    })).map((row) => ({
      ...row,
      compact: compactStaticAuthoritySource(row.source),
    }));
    const computedProductionImports = sourceRows.filter(({ relative, source }) => {
      return (relative.startsWith('packages/') || relative.startsWith('apps/'))
        && relative.includes('/src/')
        && hasComputedDynamicImport(source);
    }).map(({ relative }) => relative).sort();
    expect(computedProductionImports).toEqual([]);
    expect(hasComputedDynamicImport("const authority = import(modulePath)")).toBe(true);
    expect(hasComputedDynamicImport(
      "const authority = import('@cf/domain-acquisition/' + 'snapshot-internal')",
    )).toBe(true);
    expect(hasComputedDynamicImport(
      "const art = import('@cf/art/species-painter')",
    )).toBe(false);
    const moduleReferences = sourceRows
      .filter(({ compact }) => referencesInternalSnapshotCompact(compact))
      .map(({ relative }) => relative)
      .sort();
    expect(moduleReferences).toEqual([APP_COMPOSITOR, THIS_TEST].sort());
    const mintReferences = sourceRows
      .filter(({ compact }) => referencesSnapshotMintCompact(compact))
      .map(({ relative }) => relative)
      .sort();
    expect(mintReferences).toEqual([APP_COMPOSITOR, INTERNAL_DEFINITION, THIS_TEST].sort());
    expect(mintReferences.filter((relative) => relative.includes('/src/'))).toEqual([
      APP_COMPOSITOR,
      INTERNAL_DEFINITION,
    ].sort());
    const registryReferences = sourceRows
      .filter(({ compact }) => referencesSnapshotRegistryCompact(compact))
      .map(({ relative }) => relative)
      .sort();
    expect(registryReferences).toEqual([
      INTERNAL_DEFINITION, SNAPSHOT_DEFINITION, THIS_TEST,
    ].sort());
    const registryMintReferences = sourceRows
      .filter(({ compact }) => referencesSnapshotRegistryMintCompact(compact))
      .map(({ relative }) => relative)
      .sort();
    expect(registryMintReferences).toEqual([
      INTERNAL_DEFINITION, REGISTRY_DEFINITION, THIS_TEST,
    ].sort());
    const capturePlanConsumers = sourceRows
      .filter(({ compact }) => referencesCapturePlanEntryCompact(compact))
      .map(({ relative }) => relative)
      .sort();
    expect(capturePlanConsumers).toEqual([
      CAPTURE_TRANSACTION_OWNER,
      CAPTURE_PLANNER_DEFINITION,
      THIS_TEST,
    ].sort());
    expect(referencesCapturePlanEntry(
      "acquisition['plan' + 'CaptureV1'](preflight, draws)",
    )).toBe(true);

    for (const synthetic of [
      "import { registerAcquisitionSnapshotV1 } from '@cf/domain-acquisition/snapshot-internal';",
      "import { registerCaptureDrawBundleV1 } from '@cf/domain-acquisition/snapshot-internal'",
      "const authority = await import('@cf/domain-acquisition/snapshot-internal')",
      "export * from '@cf/domain-acquisition/snapshot-internal'",
      "import * as authority from '../../../packages/domain/acquisition/src/snapshot-internal.js'",
      "const authority = await import('@cf/domain-acquisition/' + 'snapshot-' +\n'internal')",
      "export { registerAcquisitionSnapshotV1 }\nfrom '@cf/domain-acquisition/snapshot-internal'",
    ]) {
      expect(forbiddenSnapshotAuthorityReference('apps/game/src/forbidden.ts', synthetic)).toBe(true);
    }
    for (const synthetic of [
      "import { registerAcquisitionSnapshotAuthority } from './_snapshot-registry.js'",
      "const registry = await import('../../../packages/domain/acquisition/src/' +\n'_snapshot-' + 'registry.js')",
      "export *\nfrom '../../../packages/domain/acquisition/src/_snapshot-registry.js'",
      "registry['register' + 'CaptureDrawBundleAuthority'](clone)",
    ]) {
      expect(forbiddenSnapshotRegistryReference('apps/game/src/forbidden.ts', synthetic)).toBe(true);
    }
    const realSource = sourceRows.find(({ relative }) => relative === APP_COMPOSITOR)?.source;
    if (realSource === undefined) throw new Error('app acquisition compositor source is missing');
    expect(realSource).toContain(`from '${INTERNAL_SNAPSHOT_IMPORT}';`);
    expect(forbiddenSnapshotAuthorityReference(APP_COMPOSITOR, realSource)).toBe(false);
    expect(SNAPSHOT_MINT in acquisitionRoot).toBe(false);
    expect(DRAW_MINT in acquisitionRoot).toBe(false);
    expect(SNAPSHOT_REGISTRY_MINT in acquisitionRoot).toBe(false);
    expect(DRAW_REGISTRY_MINT in acquisitionRoot).toBe(false);
    const manifest = JSON.parse(fs.readFileSync(
      path.join(V2_ROOT, 'packages/domain/acquisition/package.json'),
      'utf8',
    )) as { exports: Record<string, string> };
    expect(manifest.exports).toEqual({
      '.': './src/index.ts',
      './snapshot-internal': './src/snapshot-internal.ts',
      './ownership-v2-internal': './src/ownership-v2-internal.ts',
      './feed-internal': './src/feed.ts',
      './explorer-meal-internal': './src/explorer-meal.ts',
      './bioscan-internal': './src/bioscan.ts',
      './paragon-internal': './src/paragon-internal.ts',
      './breed-internal': './src/breed.ts',
      './rename-internal': './src/rename.ts',
      './combat-settlement-internal': './src/combat-settlement-internal.ts',
      './guardian-acquisition-internal': './src/guardian-acquisition.ts',
      './guardian-companion-internal': './src/guardian-companion.ts',
      './companion-availability': './src/companion-availability.ts',
      './scout-internal': './src/scout.ts',
    });
  });

  it('composes Earth only from live nav + exact CF1 + full production roster + Arc2/F4/ownership', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const extensions = authorityExtensions(2_400_123);
    const snapshot = readySnapshot(earth, roster, extensions);
    expect(isAcquisitionSnapshotV1(snapshot)).toBe(true);
    expect(snapshot).toMatchObject({
      worldKey: earth.key,
      planetSeed: 133,
      ecologyEpoch: 0,
      fullRosterFingerprint: 'cwr1:19:6305:58e079f2',
      biosphereKey: 'earth',
      captureRing: 0,
      contactCapturePoints: 37,
      activePlayMs: 2_400_123,
      cycle: 2,
    });
    expect(snapshot.candidates).toHaveLength(roster.view.all.length);
    expect(snapshot.candidates.map((row) => row.sourceOrdinal))
      .toEqual(roster.view.all.map((__, index) => index));
    expect(snapshot.biosphereYield).toBe(independentBiosphereYield(133, 19));
    expect(preflightCaptureV1({ ...snapshot }, 'tame')).toEqual({
      kind: 'refused', reason: 'snapshot-unregistered',
    });
  });

  it('rejects duplicate full-species identities while registering the bounded roster', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const ownership = createEmptyOwnershipStateV1();
    const extensions = authorityExtensions(0, HIT_SEED, {}, 0, true, ownership);
    const duplicate = roster.view.all[0];
    if (duplicate === undefined) throw new Error('Earth duplicate-roster fixture is empty');
    expect(() => registeredSnapshotFromRows(
      earth,
      Object.freeze([duplicate, duplicate]),
      extensions,
      ownership,
    )).toThrow(/repeats a species identity/);
  });

  it('binds a real foreign living world and derives its legacy ring and yield internally', () => {
    const living = firstLivingForeignWorld();
    const snapshot = readySnapshot(
      living.address,
      living.roster,
      authorityExtensions(),
    );
    expect(snapshot.captureRing).toBe(
      2 + Math.max(0, Math.min(3, regionAt(
        living.address.galaxy.x,
        living.address.galaxy.y,
      ))),
    );
    expect(snapshot.candidates.length).toBeGreaterThan(0);
    expect(snapshot.biosphereYield).toBe(independentBiosphereYield(
      living.address.planet.seed,
      living.roster.view.all.length,
    ));

    const deepAddress = addressOf(
      DEEP_LIVING_WORLD.galaxy,
      DEEP_LIVING_WORLD.star,
      DEEP_LIVING_WORLD.planetSeed,
    );
    const deepRoster = rosterOf(deepAddress);
    expect(deepRoster.view.total).toBeGreaterThan(0);
    const deepSnapshot = readySnapshot(
      deepAddress,
      deepRoster,
      authorityExtensions(),
    );
    expect(deepSnapshot.captureRing).toBe(
      2 + Math.max(0, Math.min(3, regionAt(
        deepAddress.galaxy.x,
        deepAddress.galaxy.y,
      ))),
    );

    const remoteStar = galaxyScene(HOME_GALAXY.seed).stars.find((candidate) => (
      candidate.seed !== SOL.seed
      && Math.hypot(candidate.x - SOL.x, candidate.y - SOL.y) > ASC_RING_R
      && systemScene(candidate.seed).planets.length > 0
    ));
    if (!remoteStar) throw new Error('home galaxy fixture has no remote planetary star');
    const remotePlanet = systemScene(remoteStar.seed).planets[0]!;
    const remoteAddress = addressOf(HOME_GALAXY, remoteStar, remotePlanet.seed);
    expect(readySnapshot(
      remoteAddress, rosterOf(remoteAddress), authorityExtensions(),
    ).captureRing).toBe(1);

    for (const [fixture, expectedRing] of [
      [RING3_WORLD, 3],
      [RING4_WORLD, 4],
    ] as const) {
      const address = addressOf(fixture.galaxy, fixture.star, fixture.planetSeed);
      expect(readySnapshot(address, rosterOf(address), authorityExtensions()).captureRing)
        .toBe(expectedRing);
    }
  });

  it('rejects wrong/clone nav, wrong canonical address, preview, roster clone, and real diagnostic authority', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const barren = firstBarrenSolWorld();
    const roster = rosterOf(earth);
    const extensions = authorityExtensions();
    const base = {
      nav: navOf(earth), address: earth, roster,
      ecologyEpoch: roster.ecologyEpoch,
      fullRosterFingerprint: roster.fullRosterFingerprint,
      extensions,
    };
    expect(composeAcquisitionSnapshotV1({ ...base, nav: { ...navOf(earth) } }))
      .toEqual({ kind: 'protected', reason: 'surface-nav-required' });
    expect(composeAcquisitionSnapshotV1({ ...base, nav: navOf(barren) }))
      .toEqual({ kind: 'protected', reason: 'navigation-address-mismatch' });
    expect(composeAcquisitionSnapshotV1({ ...base, address: barren }))
      .toEqual({ kind: 'protected', reason: 'navigation-address-mismatch' });
    expect(composeAcquisitionSnapshotV1({ ...base, roster: roster.view.preview }))
      .toEqual({ kind: 'protected', reason: 'production-full-roster-required' });
    expect(composeAcquisitionSnapshotV1({ ...base, roster: { ...roster } }))
      .toEqual({ kind: 'protected', reason: 'production-full-roster-required' });
    expect(composeAcquisitionSnapshotV1({ ...base, roster: new Proxy(roster, {}) }))
      .toEqual({ kind: 'protected', reason: 'production-full-roster-required' });

    const sources: WorldRosterSources = {
      systemFor: systemFor as unknown as WorldRosterSources['systemFor'],
      climateBand: climateBand as unknown as WorldRosterSources['climateBand'],
      biosphere: biosphere as unknown as WorldRosterSources['biosphere'],
      planetSpecies: planetSpeciesAtEcologyEpoch as unknown as WorldRosterSources['planetSpecies'],
      nameEarth: _earthNamePass,
    };
    const diagnostic = canonicalWorldRosterForDiagnostics(earth, 0, sources);
    expect(diagnostic.ok).toBe(true);
    if (diagnostic.ok) {
      expect(composeAcquisitionSnapshotV1({ ...base, roster: diagnostic.roster }))
        .toEqual({ kind: 'protected', reason: 'production-full-roster-required' });
    }
    expect(composeAcquisitionSnapshotV1({ ...base, ecologyEpoch: 1 }))
      .toEqual({ kind: 'protected', reason: 'ecology-epoch-mismatch' });
    expect(composeAcquisitionSnapshotV1({ ...base, fullRosterFingerprint: 'preview' }))
      .toEqual({ kind: 'protected', reason: 'full-roster-fingerprint-mismatch' });
    expect(composeAcquisitionSnapshotV1({
      ...base,
      ownership: createEmptyOwnershipStateV1(),
    } as unknown as Parameters<typeof composeAcquisitionSnapshotV1>[0]))
      .toEqual({ kind: 'protected', reason: 'composition-input-invalid' });
  });

  it('captures hostile caller data once and derives ownership only from one canonical carrier', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const progress = createBiosphereProgressV1({
      worldAddress: earth, cycle: 0, used: 1, successful: [],
    });
    const carrierState = createInitialOwnershipStateV1({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [progress], legacyBioX: [], scoutCreatureId: null,
    });
    const extensions = authorityExtensions(0, 12_345, {}, 0, true, carrierState);
    const base = {
      nav: navOf(earth), address: earth, roster,
      ecologyEpoch: roster.ecologyEpoch,
      fullRosterFingerprint: roster.fullRosterFingerprint,
      extensions,
    };
    const ready = composeAcquisitionSnapshotV1(base);
    expect(ready.kind).toBe('ready');
    if (ready.kind === 'ready') {
      expect(ownershipStateDigestV1(ready.snapshot.ownership))
        .toBe(ownershipStateDigestV1(carrierState));
      expect(ready.snapshot.ownership).not.toBe(carrierState);
      expect(ready.snapshot.ownership.biosphereProgress[0]?.used).toBe(1);
    }

    let rosterReads = 0;
    const fakeRoster = { ...roster, view: { ...roster.view, all: [] } };
    const alternating = new Proxy(base, {
      get(target, key, receiver) {
        if (key === 'roster') {
          rosterReads++;
          return rosterReads === 1 ? roster : fakeRoster;
        }
        return Reflect.get(target, key, receiver);
      },
    });
    const captured = composeAcquisitionSnapshotV1(alternating);
    expect(captured.kind).toBe('ready');
    if (captured.kind === 'ready') {
      expect(captured.snapshot.candidates).toHaveLength(roster.view.all.length);
      expect(captured.snapshot.fullRosterFingerprint).toBe(roster.fullRosterFingerprint);
    }
    expect(rosterReads).toBe(0);

    let getterReads = 0;
    const accessor = { ...base } as Record<string, unknown>;
    Object.defineProperty(accessor, 'roster', {
      enumerable: true,
      get() { getterReads++; return roster; },
    });
    expect(composeAcquisitionSnapshotV1(
      accessor as unknown as Parameters<typeof composeAcquisitionSnapshotV1>[0],
    )).toEqual({ kind: 'protected', reason: 'composition-input-invalid' });
    expect(getterReads).toBe(0);

    let extensionGetterReads = 0;
    const accessorExtensions = { ...extensions } as Record<string, unknown>;
    Object.defineProperty(accessorExtensions, 'player', {
      enumerable: true,
      get() { extensionGetterReads++; return extensions.player; },
    });
    expect(composeAcquisitionSnapshotV1({ ...base, extensions: accessorExtensions }))
      .toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
    expect(extensionGetterReads).toBe(0);

    const cyclic: Record<string, unknown> = {};
    cyclic.player = cyclic;
    expect(composeAcquisitionSnapshotV1({ ...base, extensions: cyclic }))
      .toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
    expect(composeCaptureDrawBundleV1({}, cyclic))
      .toEqual({ kind: 'protected', reason: 'preflight-unregistered' });
    if (ready.kind === 'ready') {
      const preflight = preflightCaptureV1(ready.snapshot, 'tame');
      if (preflight.kind !== 'ready') throw new Error(`hostile extension preflight was ${preflight.reason}`);
      expect(composeCaptureDrawBundleV1(preflight, cyclic))
        .toEqual({ kind: 'protected', reason: 'extensions-corrupt' });
    }
  });

  it('protects absent, partial, future, and legacy-protected ownership carrier states', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const base = {
      nav: navOf(earth), address: earth, roster,
      ecologyEpoch: roster.ecologyEpoch,
      fullRosterFingerprint: roster.fullRosterFingerprint,
      extensions: arc2F4Extensions(),
    };
    expect(composeAcquisitionSnapshotV1(base))
      .toEqual({ kind: 'protected', reason: 'ownership-absent' });
    const partial = canonicalizeV5Extensions({
      ...base.extensions,
      player: {
        ...(base.extensions.player ?? {}),
        [ARC4_OWNERSHIP_MANIFEST_NAMESPACE]: { version: 1, json: '{}' },
      },
    });
    expect(composeAcquisitionSnapshotV1({ ...base, extensions: partial }))
      .toEqual({ kind: 'protected', reason: 'ownership-corrupt' });

    const current = authorityExtensions();
    const manifest = current.player?.[ARC4_OWNERSHIP_MANIFEST_NAMESPACE];
    if (!manifest) throw new Error('ownership fixture lacks its manifest');
    const future = canonicalizeV5Extensions({
      ...current,
      player: {
        ...(current.player ?? {}),
        [ARC4_OWNERSHIP_MANIFEST_NAMESPACE]: { ...manifest, version: 2 },
      },
    });
    expect(composeAcquisitionSnapshotV1({ ...base, extensions: future }))
      .toEqual({ kind: 'protected', reason: 'ownership-future' });

    const protectedState = createLegacyProtectedOwnershipStateV1({
      schema: 'cf-v1.8.9-ownership-source/v1',
      digest: '0'.repeat(64),
      jsonBytes: 2,
      codexRows: 0,
      uniqueSpecies: 0,
      bioXRows: 0,
      scoutCodexId: null,
    });
    expect(composeAcquisitionSnapshotV1({
      ...base,
      extensions: withOwnership(arc2F4Extensions(), protectedState),
    })).toEqual({ kind: 'protected', reason: 'ownership-protected' });
  });
});

describe('Arc 4 pure capture presentation', () => {
  it('projects every full-roster verb pool and exact chance summary without a draw or write', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const ownership = createEmptyOwnershipStateV1();
    const activePlayMs = 400_123;
    const extensions = authorityExtensions(
      activePlayMs, HIT_SEED, {}, 0, true, ownership,
    );
    const snapshot = readySnapshot(earth, roster, extensions);
    const ownershipBefore = encodeOwnershipStateV1(ownership);
    const f4Before = readF4Authority(extensions);
    const projected = projectCapturePresentationV1(
      snapshot,
      { observedActivePlayMs: activePlayMs },
    );
    expect(projected.kind).toBe('ready');
    if (projected.kind !== 'ready') return;
    expect(projected).toMatchObject({
      schema: CAPTURE_PRESENTATION_SCHEMA,
      snapshotFingerprint: snapshot.fingerprint,
      worldKey: earth.key,
      observedActivePlayMs: activePlayMs,
      fullRosterCount: snapshot.candidates.length,
      biosphereYield: {
        total: snapshot.biosphereYield,
        used: 0,
        remaining: snapshot.biosphereYield,
        cycle: 0,
        cycleDurationActivePlayMs: ACTIVE_PLAY_CAPTURE_CYCLE_MS,
        recoveredSinceSnapshot: false,
        nextCycleAtActivePlayMs: ACTIVE_PLAY_CAPTURE_CYCLE_MS,
        activePlayMsUntilNextCycle: ACTIVE_PLAY_CAPTURE_CYCLE_MS - activePlayMs,
      },
    });
    const accepts = {
      tame: (kingdom: string) => kingdom === 'fauna',
      scavenge: (kingdom: string) => kingdom === 'flora' || kingdom === 'fungi',
      sample: (kingdom: string) => kingdom === 'microbe',
    } as const;
    for (const verb of ['tame', 'scavenge', 'sample'] as const) {
      const candidates = snapshot.candidates.filter((candidate) => (
        accepts[verb](candidate.identity.kingdom)
      ));
      const chances = candidates.map((candidate) => captureChanceV1({
        verb,
        tier: independentCaptureTier(snapshot, candidate) as Parameters<
          typeof captureChanceV1
        >[0]['tier'],
        ring: snapshot.captureRing,
        contactCapturePoints: snapshot.contactCapturePoints,
      }));
      const minimum = Math.min(...chances);
      const maximum = Math.max(...chances);
      const arithmeticMean = chances.reduce((sum, chance) => sum + chance, 0) / chances.length;
      expect(projected.verbs[verb]).toEqual({
        verb,
        fullRosterCount: snapshot.candidates.length,
        naturalPoolCount: candidates.length,
        eligiblePoolCount: candidates.length,
        successfulExclusionCount: 0,
        status: 'ready',
        reason: 'ready',
        chance: {
          minimum,
          maximum,
          arithmeticMean,
          minimumPercent: formatCaptureChancePercentV1(minimum),
          maximumPercent: formatCaptureChancePercentV1(maximum),
          arithmeticMeanPercent: formatCaptureChancePercentV1(arithmeticMean),
        },
      });
      const preflight = preflightCaptureV1(snapshot, verb);
      if (preflight.kind !== 'ready') throw new Error(`${verb} presentation fixture was empty`);
      expect(projected.verbs[verb].eligiblePoolCount).toBe(preflight.pool.length);
    }
    expect(Object.isFrozen(projected)).toBe(true);
    expect(Object.isFrozen(projected.biosphereYield)).toBe(true);
    expect(Object.isFrozen(projected.verbs)).toBe(true);
    expect(Object.isFrozen(projected.verbs.tame)).toBe(true);
    expect(Object.isFrozen(projected.verbs.tame.chance)).toBe(true);
    expect(JSON.stringify(projected)).not.toMatch(/candidateDraw|successDraw|successor/u);
    expect(encodeOwnershipStateV1(ownership)).toBe(ownershipBefore);
    expect(readF4Authority(extensions)).toEqual(f4Before);
  });

  it('uses a reloaded equipped exceptional contact modifier in the shown Tame odds', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const plainSnapshot = readySnapshot(
      earth,
      roster,
      authorityExtensions(0, 12_345, {}, 0, false),
    );
    const exceptionalSnapshot = readySnapshot(
      earth,
      roster,
      exceptionalContactAuthorityExtensions(),
    );
    expect(plainSnapshot.contactCapturePoints).toBe(0);
    expect(exceptionalSnapshot.contactCapturePoints).toBe(9);

    const plain = projectCapturePresentationV1(
      plainSnapshot,
      { observedActivePlayMs: 0 },
    );
    const exceptional = projectCapturePresentationV1(
      exceptionalSnapshot,
      { observedActivePlayMs: 0 },
    );
    if (plain.kind !== 'ready' || exceptional.kind !== 'ready'
      || plain.verbs.tame.chance === null || exceptional.verbs.tame.chance === null) {
      throw new Error('exceptional contact presentation fixture was unavailable');
    }
    expect(exceptional.verbs.tame.chance.arithmeticMean)
      .toBeGreaterThan(plain.verbs.tame.chance.arithmeticMean);
    expect(exceptional.verbs.tame.chance.minimumPercent)
      .not.toBe(plain.verbs.tame.chance.minimumPercent);
  });

  it('distinguishes natural emptiness from same-cycle completion', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const fauna = roster.view.all.find((row) => row.kingdom === 'fauna');
    if (!fauna) throw new Error('Earth presentation fixture has no fauna');
    const ownership = createEmptyOwnershipStateV1();
    const extensions = authorityExtensions(0, HIT_SEED, {}, 0, true, ownership);
    const snapshot = registeredSnapshotFromRows(
      earth, Object.freeze([fauna]), extensions, ownership,
    );
    const preflight = preflightCaptureV1(snapshot, 'tame');
    if (preflight.kind !== 'ready') throw new Error(`single-fauna preflight was ${preflight.reason}`);
    const draws = composeCaptureDrawBundleV1(preflight, extensions);
    if (draws.kind !== 'planned') throw new Error(`single-fauna draws were ${draws.reason}`);
    const capture = planCaptureV1(preflight, draws.bundle);
    if (capture.kind !== 'planned' || !capture.plan.hit) {
      throw new Error('single-fauna completion fixture did not hit');
    }
    const settledExtensions = authorityExtensions(
      0, HIT_SEED, {}, 0, true, capture.plan.successor,
    );
    const settledSnapshot = registeredSnapshotFromRows(
      earth,
      Object.freeze([fauna]),
      settledExtensions,
      capture.plan.successor,
    );
    const projected = projectCapturePresentationV1(
      settledSnapshot,
      { observedActivePlayMs: 0 },
    );
    if (projected.kind !== 'ready') throw new Error(`completion projection was ${projected.reason}`);
    expect(projected.biosphereYield).toMatchObject({
      total: 3, used: 1, remaining: 2,
    });
    expect(projected.verbs.tame).toMatchObject({
      naturalPoolCount: 1,
      eligiblePoolCount: 0,
      successfulExclusionCount: 1,
      status: 'completed',
      reason: 'completed-this-cycle',
      chance: null,
    });
    expect(projected.verbs.scavenge).toMatchObject({
      naturalPoolCount: 0,
      eligiblePoolCount: 0,
      successfulExclusionCount: 0,
      status: 'empty',
      reason: 'natural-pool-empty',
      chance: null,
    });
    expect(projected.verbs.sample.status).toBe('empty');
    expect(preflightCaptureV1(settledSnapshot, 'tame'))
      .toEqual({ kind: 'refused', reason: 'empty' });
  });

  it('projects finite shared-yield depletion and active-play-only recovery without persisting it', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const initial = readySnapshot(earth, roster, authorityExtensions());
    const depletedOwnership = createInitialOwnershipStateV1({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [createBiosphereProgressV1({
        worldAddress: earth,
        cycle: 0,
        used: initial.biosphereYield,
        successful: [],
      })],
      legacyBioX: [], scoutCreatureId: null,
    });
    const extensions = authorityExtensions(
      0, HIT_SEED, {}, 0, true, depletedOwnership,
    );
    const snapshot = readySnapshot(earth, roster, extensions);
    const ownershipBefore = encodeOwnershipStateV1(depletedOwnership);
    const f4Before = readF4Authority(extensions);
    const depleted = projectCapturePresentationV1(
      snapshot,
      { observedActivePlayMs: 0 },
    );
    if (depleted.kind !== 'ready') throw new Error(`depleted projection was ${depleted.reason}`);
    expect(depleted.biosphereYield).toMatchObject({
      total: snapshot.biosphereYield,
      used: snapshot.biosphereYield,
      remaining: 0,
      cycle: 0,
      recoveredSinceSnapshot: false,
      nextCycleAtActivePlayMs: ACTIVE_PLAY_CAPTURE_CYCLE_MS,
      activePlayMsUntilNextCycle: ACTIVE_PLAY_CAPTURE_CYCLE_MS,
    });
    expect(depleted.verbs.tame).toMatchObject({
      status: 'depleted', reason: 'biosphere-yield-depleted',
    });
    const recovered = projectCapturePresentationV1(
      snapshot,
      { observedActivePlayMs: ACTIVE_PLAY_CAPTURE_CYCLE_MS },
    );
    if (recovered.kind !== 'ready') throw new Error(`recovery projection was ${recovered.reason}`);
    expect(recovered.biosphereYield).toMatchObject({
      total: snapshot.biosphereYield,
      used: 0,
      remaining: snapshot.biosphereYield,
      cycle: 1,
      recoveredSinceSnapshot: true,
      nextCycleAtActivePlayMs: 2 * ACTIVE_PLAY_CAPTURE_CYCLE_MS,
      activePlayMsUntilNextCycle: ACTIVE_PLAY_CAPTURE_CYCLE_MS,
    });
    expect(recovered.verbs.tame).toMatchObject({ status: 'ready', reason: 'ready' });
    expect(preflightCaptureV1(snapshot, 'tame'))
      .toEqual({ kind: 'refused', reason: 'depleted' });
    expect(encodeOwnershipStateV1(depletedOwnership)).toBe(ownershipBefore);
    expect(readF4Authority(extensions)).toEqual(f4Before);
  });

  it('rejects unregistered authority and malformed observations, and formats low chances honestly', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const snapshot = readySnapshot(earth, roster, authorityExtensions(10));
    expect(projectCapturePresentationV1(
      { ...snapshot }, { observedActivePlayMs: 10 },
    )).toEqual({ kind: 'refused', reason: 'snapshot-unregistered' });
    expect(projectCapturePresentationV1(
      snapshot, { observedActivePlayMs: 9 },
    )).toEqual({ kind: 'refused', reason: 'observation-before-snapshot' });
    const invalidObservations: unknown[] = [
      null,
      {},
      { observedActivePlayMs: 10, extra: true },
      { observedActivePlayMs: 10.5 },
      { observedActivePlayMs: Number.MAX_SAFE_INTEGER },
      Object.assign(Object.create({}), { observedActivePlayMs: 10 }),
      { observedActivePlayMs: 10, [Symbol('forged')]: true },
      new Proxy({ observedActivePlayMs: 10 }, {
        ownKeys: () => { throw new Error('forged observation trap ran'); },
      }),
    ];
    for (const observation of invalidObservations) {
      expect(projectCapturePresentationV1(snapshot, observation))
        .toEqual({ kind: 'refused', reason: 'observation-invalid' });
    }
    let accessorRead = false;
    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, 'observedActivePlayMs', {
      enumerable: true,
      get: () => {
        accessorRead = true;
        throw new Error('presentation observation getter ran');
      },
    });
    expect(projectCapturePresentationV1(snapshot, accessor))
      .toEqual({ kind: 'refused', reason: 'observation-invalid' });
    expect(accessorRead).toBe(false);
    expect(formatCaptureChancePercentV1(0)).toBe('0%');
    expect(formatCaptureChancePercentV1(0.000_001)).toBe('<0.01%');
    expect(formatCaptureChancePercentV1(0.0025)).toBe('0.25%');
    expect(formatCaptureChancePercentV1(0.95)).toBe('95%');
    expect(() => formatCaptureChancePercentV1(Number.NaN)).toThrow(/capture chance/u);
    expect(() => formatCaptureChancePercentV1(1.01)).toThrow(/capture chance/u);
  });

  it('fences exact displayed semantics while ignoring countdown and SessionRNG-only drift', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const ownership = createEmptyOwnershipStateV1();
    const activePlayMs = 400_123;
    const snapshot = readySnapshot(earth, roster, authorityExtensions(
      activePlayMs, 12_345, {}, 0, true, ownership,
    ));
    const fence = capturePresentationFenceV1(
      snapshot,
      { observedActivePlayMs: activePlayMs },
    );
    expect(fence).toMatch(new RegExp(`^${CAPTURE_PRESENTATION_FENCE_PREFIX}[0-9a-f]{64}$`, 'u'));
    expect(capturePresentationFenceV1(
      snapshot,
      { observedActivePlayMs: activePlayMs + 20_000 },
    )).toBe(fence);

    const rngOnly = readySnapshot(earth, roster, authorityExtensions(
      activePlayMs, 98_765, { unrelated: 4 }, 19, true, ownership,
    ));
    expect(rngOnly.f4AuthorityFingerprint).not.toBe(snapshot.f4AuthorityFingerprint);
    expect(capturePresentationFenceV1(
      rngOnly,
      { observedActivePlayMs: activePlayMs + 20_000 },
    )).toBe(fence);

    const noContact = readySnapshot(earth, roster, authorityExtensions(
      activePlayMs, 12_345, {}, 0, false, ownership,
    ));
    expect(noContact.contactCapturePoints).not.toBe(snapshot.contactCapturePoints);
    expect(capturePresentationFenceV1(
      noContact,
      { observedActivePlayMs: activePlayMs },
    )).not.toBe(fence);

    const usedOwnership = createInitialOwnershipStateV1({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [createBiosphereProgressV1({
        worldAddress: earth,
        cycle: 0,
        used: 1,
        successful: [],
      })],
      legacyBioX: [], scoutCreatureId: null,
    });
    const used = readySnapshot(earth, roster, authorityExtensions(
      activePlayMs, 12_345, {}, 0, true, usedOwnership,
    ));
    expect(capturePresentationFenceV1(
      used,
      { observedActivePlayMs: activePlayMs },
    )).not.toBe(fence);

    expect(capturePresentationFenceV1(
      snapshot,
      { observedActivePlayMs: ACTIVE_PLAY_CAPTURE_CYCLE_MS },
    )).not.toBe(fence);
    const nextRoster = rosterOf(earth, 1);
    const nextEpoch = readySnapshot(earth, nextRoster, authorityExtensions(
      activePlayMs, 12_345, {}, 0, true, ownership,
    ));
    expect(capturePresentationFenceV1(
      nextEpoch,
      { observedActivePlayMs: activePlayMs },
    )).not.toBe(fence);

    expect(capturePresentationFenceV1(
      { ...snapshot },
      { observedActivePlayMs: activePlayMs },
    )).toBeNull();
    let getterReads = 0;
    const accessor: Record<string, unknown> = {};
    Object.defineProperty(accessor, 'observedActivePlayMs', {
      enumerable: true,
      get() { getterReads++; return activePlayMs; },
    });
    expect(capturePresentationFenceV1(snapshot, accessor)).toBeNull();
    expect(getterReads).toBe(0);
  });
});

describe('Arc 4 exact capture formula and truthful successor', () => {
  it('pins the complete tier/verb/ring/contact formula matrix independently', () => {
    expect(CAPTURE_PLANNER_POLICY_BLOCKERS_V1).toEqual({
      legacyEligibility: 'same-full-world-current-cycle-successful-species-and-verb-only',
      reacquisition: 'new-individual-or-lot-with-first-only-catalogue',
      encodedExtensionByteCapacity: 'registered-all-scenario-certificate-required-before-draw',
      breedingProvenance: 'unsupported-by-ownership-v1',
      guardianProvenance: 'unsupported-by-ownership-v1',
      writerExposed: true,
      playerControlExposed: true,
    });
    expect(TAME_ODDS_V1).toEqual([
      0.60, 0.45, 0.36, 0.27, 0.19, 0.13, 0.09, 0.06, 0.04, 0.025,
      0.015, 0.010, 0.006, 0.004, 0.0025,
    ]);
    const values: string[] = [];
    for (const verb of ['tame', 'scavenge', 'sample'] as const) {
      for (let tier = 0; tier <= 14; tier++) {
        for (let ring = 0; ring <= 5; ring++) {
          for (const contactCapturePoints of [0, 1, 7, 16, 17, 37]) {
            values.push(captureChanceV1({
              verb,
              tier: tier as Parameters<typeof captureChanceV1>[0]['tier'],
              ring: ring as Parameters<typeof captureChanceV1>[0]['ring'],
              contactCapturePoints,
            }).toPrecision(17));
          }
        }
      }
    }
    expect(values).toHaveLength(1_620);
    expect(createHash('sha256').update(JSON.stringify(values)).digest('hex'))
      .toBe('2ab5d04b9bd55611191d588c235313cf7084684634adf64bce3b4c4fba6e0bc5');
    expect(captureChanceV1({ verb: 'tame', tier: 0, ring: 0, contactCapturePoints: 0 }))
      .toBe(0.6);
    expect(captureChanceV1({ verb: 'scavenge', tier: 0, ring: 0, contactCapturePoints: 0 }))
      .toBe(0.95);
    expect(captureChanceV1({ verb: 'sample', tier: 0, ring: 0, contactCapturePoints: 0 }))
      .toBe(0.8999999999999999);
    expect(captureChanceV1({ verb: 'tame', tier: 14, ring: 5, contactCapturePoints: 0 }))
      .toBe(0.02);
    const noGear = captureChanceV1({ verb: 'tame', tier: 5, ring: 0, contactCapturePoints: 0 });
    const commsEarpiece = captureChanceV1({
      verb: 'tame', tier: 5, ring: 0, contactCapturePoints: 10,
    });
    const cappedContact = captureChanceV1({
      verb: 'tame', tier: 5, ring: 0, contactCapturePoints: 17,
    });
    expect(commsEarpiece - noGear).toBeCloseTo(0.15, 12);
    expect(cappedContact - noGear).toBeCloseTo(0.25, 12);
    expect(captureChanceV1({ verb: 'tame', tier: 5, ring: 0, contactCapturePoints: 37 }))
      .toBe(cappedContact);
    expect(captureChanceV1({ verb: 'scavenge', tier: 0, ring: 0, contactCapturePoints: 10 }))
      .toBe(captureChanceV1({ verb: 'scavenge', tier: 0, ring: 0, contactCapturePoints: 0 }));
    expect(captureChanceV1({ verb: 'tame', tier: 14, ring: 5, contactCapturePoints: 17 }))
      .toBeCloseTo(0.251476225, 12);
    expect(() => captureChanceV1({
      verb: 'tame', tier: 0, ring: 0, contactCapturePoints: 0.5,
    })).toThrow(/whole/);
    for (const tier of [-1, 15, 0.5]) {
      expect(() => captureChanceV1({
        verb: 'tame', tier, ring: 0, contactCapturePoints: 0,
      } as never)).toThrow(/tier/);
    }
    for (const ring of [-1, 6, 0.5]) {
      expect(() => captureChanceV1({
        verb: 'tame', tier: 0, ring, contactCapturePoints: 0,
      } as never)).toThrow(/ring/);
    }
    expect(() => captureChanceV1({
      verb: 'capture', tier: 0, ring: 0, contactCapturePoints: 0,
    } as never)).toThrow(/verb/);
    expect(captureHitV1(0.5, 0.5)).toBe(false);
    expect(captureHitV1(0.499999999, 0.5)).toBe(true);
    expect(() => captureHitV1(1, 0.5)).toThrow(/draw/);
    expect(() => captureHitV1(0, 1.01)).toThrow(/chance/);
  });

  it('derives each verb pool and excludes only same-world/current-cycle successful pairs', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const extensions = authorityExtensions(0, HIT_SEED);
    const snapshot = readySnapshot(earth, roster, extensions);
    const accepts = {
      tame: (kingdom: string) => kingdom === 'fauna',
      scavenge: (kingdom: string) => kingdom === 'flora' || kingdom === 'fungi',
      sample: (kingdom: string) => kingdom === 'microbe',
    } as const;
    for (const verb of ['tame', 'scavenge', 'sample'] as const) {
      const preflight = preflightCaptureV1(snapshot, verb);
      expect(preflight.kind).toBe('ready');
      if (preflight.kind !== 'ready') continue;
      expect(preflight.pool.map((row) => row.sourceOrdinal)).toEqual(
        snapshot.candidates
          .filter((row) => accepts[verb](row.identity.kingdom))
          .map((row) => row.sourceOrdinal),
      );
    }

    const preflight = preflightCaptureV1(snapshot, 'tame');
    if (preflight.kind !== 'ready') throw new Error('catalogue eligibility fixture has no fauna');
    const draws = composeCaptureDrawBundleV1(preflight, extensions);
    if (draws.kind !== 'planned') throw new Error(`catalogue eligibility draws were ${draws.reason}`);
    const planned = planCaptureV1(preflight, draws.bundle);
    if (planned.kind !== 'planned' || !planned.plan.hit) {
      throw new Error('catalogue eligibility fixture did not hit');
    }
    const nextExtensions = authorityExtensions(
      0, HIT_SEED, {}, 0, true, planned.plan.successor,
    );
    const nextSnapshot = readySnapshot(earth, roster, nextExtensions);
    const next = preflightCaptureV1(nextSnapshot, 'tame');
    if (next.kind !== 'ready') throw new Error(`remaining fauna pool was ${next.reason}`);
    expect(next.pool.some((row) => (
      row.legacyCatalogueId === planned.plan.candidate.legacyCatalogueId
    ))).toBe(false);
    expect(next.pool).toHaveLength(preflight.pool.length - 1);
  });

  it('keeps misses eligible and creates repeat ownership only on another world or later cycle', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);

    const missOwnership = createEmptyOwnershipStateV1();
    const missExtensions = authorityExtensions(0, MISS_SEED, {}, 0, true, missOwnership);
    const missSnapshot = readySnapshot(earth, roster, missExtensions);
    const missPreflight = preflightCaptureV1(missSnapshot, 'tame');
    if (missPreflight.kind !== 'ready') throw new Error(`miss repeat preflight was ${missPreflight.reason}`);
    const missDraws = composeCaptureDrawBundleV1(missPreflight, missExtensions);
    if (missDraws.kind !== 'planned') throw new Error(`miss repeat draws were ${missDraws.reason}`);
    const missed = planCaptureV1(missPreflight, missDraws.bundle);
    if (missed.kind !== 'planned' || missed.plan.hit) throw new Error('miss repeat fixture did not miss');
    const afterMissExtensions = authorityExtensions(
      0,
      MISS_SEED,
      missDraws.bundle.nextSessionRng.draws,
      missDraws.bundle.nextSessionRng.ordinal,
      true,
      missed.plan.successor,
    );
    const afterMiss = preflightCaptureV1(
      readySnapshot(earth, roster, afterMissExtensions),
      'tame',
    );
    if (afterMiss.kind !== 'ready') throw new Error(`post-miss preflight was ${afterMiss.reason}`);
    expect(afterMiss.pool.map((row) => row.identity.speciesId))
      .toEqual(missPreflight.pool.map((row) => row.identity.speciesId));
    expect(afterMiss.used).toBe(1);
    expect(afterMiss.successful).toEqual([]);

    const firstOwnership = createEmptyOwnershipStateV1();
    const firstExtensions = authorityExtensions(0, HIT_SEED, {}, 0, true, firstOwnership);
    const firstSnapshot = readySnapshot(earth, roster, firstExtensions);
    const firstPreflight = preflightCaptureV1(firstSnapshot, 'tame');
    if (firstPreflight.kind !== 'ready') throw new Error(`first repeat preflight was ${firstPreflight.reason}`);
    const firstDraws = composeCaptureDrawBundleV1(firstPreflight, firstExtensions);
    if (firstDraws.kind !== 'planned') throw new Error(`first repeat draws were ${firstDraws.reason}`);
    const first = planCaptureV1(firstPreflight, firstDraws.bundle);
    if (first.kind !== 'planned' || !first.plan.hit) throw new Error('first repeat fixture did not hit');
    const originalRosterRow = roster.view.all[first.plan.candidate.sourceOrdinal];
    if (originalRosterRow === undefined) throw new Error('selected repeat roster row is absent');
    const firstObservationId = first.plan.successor.catalogSpecies[0]?.firstObservationId;

    const laterExtensions = authorityExtensions(
      ACTIVE_PLAY_CAPTURE_CYCLE_MS,
      HIT_SEED,
      {},
      1,
      true,
      first.plan.successor,
    );
    const laterSnapshot = registeredSnapshotFromRows(
      earth,
      Object.freeze([originalRosterRow]),
      laterExtensions,
      first.plan.successor,
      1,
    );
    const laterPreflight = preflightCaptureV1(laterSnapshot, 'tame');
    if (laterPreflight.kind !== 'ready') throw new Error(`later-cycle repeat was ${laterPreflight.reason}`);
    expect(laterPreflight.pool).toHaveLength(1);
    expect(laterPreflight.requiredHitHeadroom).toBe(3);
    const laterDraws = composeCaptureDrawBundleV1(laterPreflight, laterExtensions);
    if (laterDraws.kind !== 'planned') throw new Error(`later-cycle draws were ${laterDraws.reason}`);
    const later = planCaptureV1(laterPreflight, laterDraws.bundle);
    if (later.kind !== 'planned' || !later.plan.hit) throw new Error('later-cycle repeat did not hit');
    expect(later.plan.firstForSpecies).toBe(false);
    expect(later.plan.successor.catalogSpecies).toEqual(first.plan.successor.catalogSpecies);
    expect(later.plan.successor.discoveries).toHaveLength(2);
    expect(later.plan.successor.creatures).toHaveLength(2);
    expect(later.plan.successor.discoveries.find(
      (row) => row.recordId === later.plan.discoveryRecordId,
    )).toMatchObject({
      firstForSpecies: false,
      provenance: { kind: 'world', worldKey: earth.key, cycle: 1, verb: 'tame' },
    });
    expect(later.plan.successor.catalogSpecies[0]?.firstObservationId)
      .toBe(firstObservationId);

    const foreign = firstLivingForeignWorld().address;
    const otherExtensions = authorityExtensions(
      0,
      HIT_SEED,
      {},
      1,
      true,
      first.plan.successor,
    );
    const otherSnapshot = registeredSnapshotFromRows(
      foreign,
      Object.freeze([originalRosterRow]),
      otherExtensions,
      first.plan.successor,
    );
    const otherPreflight = preflightCaptureV1(otherSnapshot, 'tame');
    if (otherPreflight.kind !== 'ready') throw new Error(`other-world repeat was ${otherPreflight.reason}`);
    const otherDraws = composeCaptureDrawBundleV1(otherPreflight, otherExtensions);
    if (otherDraws.kind !== 'planned') throw new Error(`other-world draws were ${otherDraws.reason}`);
    const other = planCaptureV1(otherPreflight, otherDraws.bundle);
    if (other.kind !== 'planned' || !other.plan.hit) throw new Error('other-world repeat did not hit');
    expect(other.plan.firstForSpecies).toBe(false);
    expect(other.plan.successor.catalogSpecies).toEqual(first.plan.successor.catalogSpecies);
    expect(other.plan.successor.discoveries).toHaveLength(2);
    expect(other.plan.successor.creatures).toHaveLength(2);
    expect(other.plan.successor.discoveries.find(
      (row) => row.recordId === other.plan.discoveryRecordId,
    )).toMatchObject({
      firstForSpecies: false,
      provenance: { kind: 'world', worldKey: foreign.key, cycle: 0, verb: 'tame' },
    });
    expect(other.plan.successor.biosphereProgress.map((row) => row.worldKey).sort())
      .toEqual([earth.key, foreign.key].sort());
  });

  it('registers one miss plus every ordered hit and the selected plan matches its scenario', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const ownership = createEmptyOwnershipStateV1();
    const extensions = authorityExtensions(0, HIT_SEED, {}, 0, true, ownership);
    const snapshot = readySnapshot(earth, roster, extensions);
    const preflight = preflightCaptureV1(snapshot, 'tame');
    if (preflight.kind !== 'ready') throw new Error(`scenario preflight was ${preflight.reason}`);
    const projected = projectCaptureCapacityScenariosV1(preflight, 0);
    expect(isCaptureCapacityScenariosV1(projected)).toBe(true);
    expect(isCaptureCapacityScenariosV1({ ...projected })).toBe(false);
    expect(projected.candidateOrder).toEqual(
      preflight.pool.map((row) => row.identity.speciesId),
    );
    expect(projected.scenarios).toHaveLength(preflight.pool.length + 1);
    expect(projected.scenarios[0]).toMatchObject({
      kind: 'miss', candidate: null, tier: null, firstForSpecies: false,
      discoveryRecordId: null, ownedRowId: null,
    });
    expect(projected.scenarios.slice(1).map((scenario) => scenario.candidate))
      .toEqual(preflight.pool);
    expect(projected.scenarios.every((scenario) => !('candidateDraw' in scenario)
      && !('successDraw' in scenario))).toBe(true);
    const parent = currentArc5Parent(extensions);
    const projectedHit = createCaptureOwnershipSourceProjectionSuccessorV2(parent, projected, 1);
    expect(projectedHit.revision).toBe(parent.revision + 1);
    expect(ownershipStateDigestV1(ownershipSourceStateV1(projectedHit)))
      .toBe(projected.scenarios[1]?.successorDigest);
    expect(() => createCaptureOwnershipSourceProjectionSuccessorV2(
      parent,
      { ...projected },
      1,
    )).toThrow(/registered scenario authority/u);
    expect(() => createCaptureOwnershipSourceProjectionSuccessorV2(
      parent,
      projected,
      projected.scenarios.length,
    )).toThrow(/out of range/u);
    expect(prepareArc5CaptureOwnershipMigrationSuccessor({
      baseExtensions: extensions,
      parent: { ...parent } as OwnershipStateV2,
      successorExtensions: extensions,
      scenarios: projected,
      scenarioIndex: 1,
      resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    })).toEqual({ kind: 'protected', reason: 'base-corrupt' });

    const draws = composeCaptureDrawBundleV1(preflight, extensions);
    if (draws.kind !== 'planned') throw new Error(`scenario draws were ${draws.reason}`);
    const planned = planCaptureV1(preflight, draws.bundle);
    if (planned.kind !== 'planned' || !planned.plan.hit) throw new Error('scenario fixture did not hit');
    const scenario = projected.scenarios.find((row) => (
      row.kind === 'hit' && row.candidate === planned.plan.candidate
    ));
    expect(scenario).toMatchObject({
      kind: 'hit',
      tier: planned.plan.tier,
      firstForSpecies: planned.plan.firstForSpecies,
      discoveryRecordId: planned.plan.discoveryRecordId,
      ownedRowId: planned.plan.ownedRowId,
      successorDigest: ownershipStateDigestV1(planned.plan.successor),
    });
    const missExtensions = authorityExtensions(0, MISS_SEED, {}, 0, true, ownership);
    const missSnapshot = readySnapshot(earth, roster, missExtensions);
    const missPreflight = preflightCaptureV1(missSnapshot, 'tame');
    if (missPreflight.kind !== 'ready') throw new Error(`scenario miss preflight was ${missPreflight.reason}`);
    const missProjection = projectCaptureCapacityScenariosV1(missPreflight, 0);
    const missDraws = composeCaptureDrawBundleV1(missPreflight, missExtensions);
    if (missDraws.kind !== 'planned') throw new Error(`scenario miss draws were ${missDraws.reason}`);
    const missed = planCaptureV1(missPreflight, missDraws.bundle);
    if (missed.kind !== 'planned' || missed.plan.hit) throw new Error('scenario miss did not miss');
    expect(missProjection.scenarios[0]?.successorDigest)
      .toBe(ownershipStateDigestV1(missed.plan.successor));
  });

  it.each([
    ['tame', 'creature'],
    ['scavenge', 'specimen'],
    ['sample', 'specimen'],
  ] as const)('settles a %s hit as exactly one truthful %s acquisition', (verb, ownedKind) => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const ownership = createEmptyOwnershipStateV1();
    const extensions = authorityExtensions(0, HIT_SEED, {}, 0, true, ownership);
    const snapshot = readySnapshot(earth, roster, extensions);
    const preflight = preflightCaptureV1(snapshot, verb);
    expect(preflight.kind).toBe('ready');
    if (preflight.kind !== 'ready') return;
    const draws = composeCaptureDrawBundleV1(preflight, extensions);
    expect(draws.kind).toBe('planned');
    if (draws.kind !== 'planned') return;
    expect(isCaptureDrawBundleV1(draws.bundle)).toBe(true);
    expect(draws.bundle.draws.map((row) => row.domain)).toEqual([
      DOMAINS.captureCandidate, DOMAINS.captureSuccess,
    ]);
    const outcome = planCaptureV1(preflight, draws.bundle);
    expect(outcome.kind).toBe('planned');
    if (outcome.kind !== 'planned') return;
    const plan = outcome.plan;
    expect(isCaptureAttemptPlanV1(plan)).toBe(true);
    expect(plan.hit).toBe(true);
    expect(plan.spent).toBe(1);
    expect(plan.tier).toBe(independentCaptureTier(snapshot, plan.candidate));
    expect(plan.successor.revision).toBe(1);
    expect(plan.successor.catalogSpecies).toHaveLength(1);
    expect(plan.successor.discoveries).toHaveLength(1);
    expect(plan.successor.biosphereProgress).toHaveLength(1);
    expect(plan.successor.biosphereProgress[0]).toMatchObject({
      worldKey: earth.key, cycle: 0, used: 1,
      successful: [{ speciesId: plan.candidate.identity.speciesId, source: verb }],
    });
    expect(plan.successor.catalogSpecies[0]?.speciesId).toBe(plan.candidate.identity.speciesId);
    expect(plan.successor.discoveries[0]).toMatchObject({
      recordId: plan.discoveryRecordId,
      speciesId: plan.candidate.identity.speciesId,
      acquisition: verb,
      firstForSpecies: true,
      provenance: {
        kind: 'world', verb, worldKey: earth.key, cycle: 0,
        sourceOrdinal: plan.candidate.sourceOrdinal,
      },
    });
    const eventWitness = canonicalJson({
      schema: 'cf-v2-capture-event/v1',
      parentDigest: ownershipStateDigestV1(snapshot.ownership),
      snapshotFingerprint: snapshot.fingerprint,
      f4AuthorityFingerprint: draws.bundle.f4AuthorityFingerprint,
      receiptOrdinal: draws.bundle.receiptOrdinal,
      worldKey: snapshot.worldKey,
      ecologyEpoch: snapshot.ecologyEpoch,
      fullRosterFingerprint: snapshot.fullRosterFingerprint,
      cycle: snapshot.cycle,
      verb,
      sourceOrdinal: plan.candidate.sourceOrdinal,
      speciesId: plan.candidate.identity.speciesId,
    });
    expect(plan.discoveryRecordId).toBe(ownershipContentId('discovery', eventWitness));
    if (ownedKind === 'creature') {
      expect(plan.successor.creatures).toHaveLength(1);
      expect(plan.successor.specimenLots).toHaveLength(0);
      expect(plan.successor.creatures[0]).toMatchObject({
        creatureId: plan.ownedRowId,
        speciesId: plan.candidate.identity.speciesId,
        origin: 'wild',
        acquisitionRecordId: plan.discoveryRecordId,
        nickname: null,
        xp: null,
        assignment: null,
        bond: null,
      });
    } else {
      expect(plan.successor.creatures).toHaveLength(0);
      expect(plan.successor.specimenLots).toHaveLength(1);
      expect(plan.successor.specimenLots[0]).toMatchObject({
        lotId: plan.ownedRowId,
        speciesId: plan.candidate.identity.speciesId,
        quantity: 1,
        origin: 'wild',
        acquisitionRecordId: plan.discoveryRecordId,
      });
    }
    expect(plan.ownedRowId).toBe(ownershipContentId(
      ownedKind === 'creature' ? 'creature' : 'specimen',
      `${eventWitness}:${ownedKind}`,
    ));
    expect(plan.witness).toBe(canonicalJson({
      schema: 'cf-v2-capture-plan-witness/v1',
      event: sha256Hex(eventWitness),
      candidateDraw: plan.candidateDraw,
      successDraw: plan.successDraw,
      chance: plan.chance,
      hit: true,
      spent: 1,
      successorDigest: ownershipStateDigestV1(plan.successor),
    }));
    expect(ownershipStateDigestV1(snapshot.ownership)).toBe(ownershipStateDigestV1(ownership));
    expect(snapshot.ownership).not.toBe(ownership);
    expect(isOwnershipSuccessorV1(plan.successor, snapshot.ownership)).toBe(true);
    expect(plan.witness.length).toBeLessThanOrEqual(4_096);
  });

  it('spends exactly one on a miss without granting catalogue, owned, discovery, hybrid, page, or reward rows', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const ownership = createEmptyOwnershipStateV1();
    const extensions = authorityExtensions(0, MISS_SEED, {}, 0, true, ownership);
    const beforeState = encodeOwnershipStateV1(ownership);
    const beforeAuthority = readF4Authority(extensions);
    const snapshot = readySnapshot(earth, roster, extensions);
    const preflight = preflightCaptureV1(snapshot, 'tame');
    if (preflight.kind !== 'ready') throw new Error(`miss preflight was ${preflight.reason}`);
    const draws = composeCaptureDrawBundleV1(preflight, extensions);
    if (draws.kind !== 'planned') throw new Error(`miss draws were ${draws.reason}`);
    const outcome = planCaptureV1(preflight, draws.bundle);
    if (outcome.kind !== 'planned') throw new Error(`miss plan was ${outcome.reason}`);
    expect(outcome.plan.hit).toBe(false);
    expect(outcome.plan.spent).toBe(1);
    expect(outcome.plan.discoveryRecordId).toBeNull();
    expect(outcome.plan.ownedRowId).toBeNull();
    expect(outcome.plan.successor).toMatchObject({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [{ cycle: 0, used: 1, successful: [] }],
    });
    expect(encodeOwnershipStateV1(ownership)).toBe(beforeState);
    expect(readF4Authority(extensions)).toEqual(beforeAuthority);
  });
});

describe('Arc 4 refusal, capacity, replay, and no-reroll controls', () => {
  it('returns empty before depleted and requests no F4 bundle or ownership spend', () => {
    const barren = firstBarrenSolWorld();
    const roster = rosterOf(barren);
    const ownership = createEmptyOwnershipStateV1();
    const extensions = authorityExtensions(0, 12_345, {}, 0, true, ownership);
    const before = readF4Authority(extensions);
    const snapshot = readySnapshot(barren, roster, extensions);
    expect(snapshot.biosphereYield).toBe(0);
    const preflight = preflightCaptureV1(snapshot, 'tame');
    expect(preflight).toEqual({ kind: 'refused', reason: 'empty' });
    expect(composeCaptureDrawBundleV1(preflight, extensions))
      .toEqual({ kind: 'protected', reason: 'preflight-unregistered' });
    expect(readF4Authority(extensions)).toEqual(before);
    expect(ownership.revision).toBe(0);
  });

  it('refuses depleted, future-cycle, unresolved legacy, and exhausted revision before draws', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const extensions = authorityExtensions();
    const emptySnapshot = readySnapshot(earth, roster, extensions);
    const depletedProgress = createBiosphereProgressV1({
      worldAddress: earth,
      cycle: 0,
      used: emptySnapshot.biosphereYield,
      successful: [],
    });
    const depletedState = createInitialOwnershipStateV1({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [depletedProgress], legacyBioX: [], scoutCreatureId: null,
    });
    const depletedExtensions = authorityExtensions(0, 12_345, {}, 0, true, depletedState);
    expect(preflightCaptureV1(
      readySnapshot(earth, roster, depletedExtensions), 'tame',
    )).toEqual({ kind: 'refused', reason: 'depleted' });

    const recoveredExtensions = authorityExtensions(2_400_000, 12_345, {}, 0, true, depletedState);
    const recovered = preflightCaptureV1(
      readySnapshot(earth, roster, recoveredExtensions),
      'tame',
    );
    expect(recovered).toMatchObject({
      kind: 'ready', used: 0, remainingBefore: emptySnapshot.biosphereYield,
    });
    if (recovered.kind !== 'ready') throw new Error('recovered cycle did not become ready');
    const recoveredDraws = composeCaptureDrawBundleV1(recovered, recoveredExtensions);
    if (recoveredDraws.kind !== 'planned') {
      throw new Error(`recovered cycle draws were ${recoveredDraws.reason}`);
    }
    const recoveredPlan = planCaptureV1(recovered, recoveredDraws.bundle);
    if (recoveredPlan.kind !== 'planned') {
      throw new Error(`recovered cycle plan was ${recoveredPlan.reason}`);
    }
    expect(recoveredPlan.plan.successor.biosphereProgress).toHaveLength(1);
    expect(recoveredPlan.plan.successor.biosphereProgress[0]).toMatchObject({
      worldKey: earth.key, cycle: 2, used: 1,
    });

    const futureProgress = createBiosphereProgressV1({
      worldAddress: earth, cycle: 1, used: 0, successful: [],
    });
    const futureState = createInitialOwnershipStateV1({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [futureProgress], legacyBioX: [], scoutCreatureId: null,
    });
    const futureExtensions = authorityExtensions(0, 12_345, {}, 0, true, futureState);
    expect(preflightCaptureV1(
      readySnapshot(earth, roster, futureExtensions), 'tame',
    )).toEqual({ kind: 'refused', reason: 'future-cycle-progress' });

    const legacyState = createInitialOwnershipStateV1({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [], biosphereProgress: [],
      legacyBioX: [createLegacyBioXEvidenceV1({
        legacyPlanetSeed: 133, used: 1, epochStamp: 0,
        relation: 'equal', canonicalWorldKey: null,
      })],
      scoutCreatureId: null,
    });
    const legacyExtensions = authorityExtensions(0, 12_345, {}, 0, true, legacyState);
    expect(preflightCaptureV1(
      readySnapshot(earth, roster, legacyExtensions), 'tame',
    )).toEqual({ kind: 'refused', reason: 'legacy-biosphere-unresolved' });

    const mirror = JSON.parse(encodeOwnershipStateV1(createEmptyOwnershipStateV1())) as {
      revision: number;
    };
    mirror.revision = MAX_OWNERSHIP_REVISION;
    const exhausted = decodeOwnershipStateV1(
      JSON.stringify(mirror),
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    const exhaustedExtensions = authorityExtensions(0, 12_345, {}, 0, true, exhausted);
    expect(preflightCaptureV1(
      readySnapshot(earth, roster, exhaustedExtensions), 'tame',
    )).toEqual({ kind: 'refused', reason: 'revision-exhausted' });
  });

  it('refuses the carrier model row ceiling before either draw', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const ownership = denseCapacityState();
    const extensions = authorityExtensions(0, 12_345, {}, 0, true, ownership);
    const rows = ownership.catalogSpecies.length + ownership.discoveries.length
      + ownership.creatures.length + ownership.specimenLots.length
      + ownership.biosphereProgress.length
      + ownership.biosphereProgress.reduce((sum, row) => sum + row.successful.length, 0)
      + ownership.creatures.reduce((sum, row) => sum + (row.bond === null
        ? 0 : row.bond.memories.length + row.bond.mementoIds.length), 0);
    expect(rows).toBe(20_000);
    const before = readF4Authority(extensions);
    const snapshot = readySnapshot(earth, roster, extensions);
    const preflight = preflightCaptureV1(snapshot, 'tame');
    expect(preflight).toEqual({ kind: 'refused', reason: 'model-row-capacity' });
    expect(composeCaptureDrawBundleV1(preflight, extensions))
      .toEqual({ kind: 'protected', reason: 'preflight-unregistered' });
    expect(readF4Authority(extensions)).toEqual(before);

    const exactHeadroom = denseCapacityState(19_995);
    const exactHeadroomExtensions = authorityExtensions(
      0, 12_345, {}, 0, true, exactHeadroom,
    );
    expect(preflightCaptureV1(
      readySnapshot(earth, roster, exactHeadroomExtensions),
      'tame',
    )).toMatchObject({ kind: 'ready', requiredHitHeadroom: 5 });

    const progress = createBiosphereProgressV1({
      worldAddress: earth, cycle: 0, used: 0, successful: [],
    });
    const replacementHeadroom = createInitialOwnershipStateV1({
      catalogSpecies: exactHeadroom.catalogSpecies,
      discoveries: exactHeadroom.discoveries,
      creatures: exactHeadroom.creatures,
      specimenLots: exactHeadroom.specimenLots,
      biosphereProgress: [progress],
      legacyBioX: exactHeadroom.legacyBioX,
      scoutCreatureId: exactHeadroom.scoutCreatureId,
    });
    const replacementHeadroomExtensions = authorityExtensions(
      0, 12_345, {}, 0, true, replacementHeadroom,
    );
    expect(preflightCaptureV1(
      readySnapshot(earth, roster, replacementHeadroomExtensions),
      'tame',
    )).toMatchObject({ kind: 'ready', requiredHitHeadroom: 4 });

    const oneRowTooMany = denseCapacityState(19_996);
    const oneRowTooManyExtensions = authorityExtensions(
      0, 12_345, {}, 0, true, oneRowTooMany,
    );
    expect(preflightCaptureV1(
      readySnapshot(earth, roster, oneRowTooManyExtensions),
      'tame',
    )).toEqual({ kind: 'refused', reason: 'model-row-capacity' });
  }, 20_000);

  it('refuses all 64 candidates when the last possible hit alone cannot mirror to v4', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const collidingSeed = 909_090;
    const existingGenome = makeGenome(collidingSeed, 'fauna', 0.35);
    const ownership = migrateLegacyOwnershipStateV1({
      legacyEpoch: 0,
      codexRows: [{
        legacyCodexId: `s${collidingSeed}`,
        genome: existingGenome as unknown as CanonicalJson,
        from: 'capacity collision control',
        legacyLocation: null,
        catalogAlias: 'Capacity Known',
        faunaNickname: null,
      }],
      bioXRows: [],
      scoutCodexId: null,
    }).state;
    const extensions = authorityExtensions(0, HIT_SEED, {}, 0, true, ownership);
    const unsafeBase = makeGenome(collidingSeed, 'fauna', 0.35) as Genome & { color: number };
    const unsafe = Object.freeze({
      ...unsafeBase,
      color: unsafeBase.color + 1,
    });
    const rows = Object.freeze([
      ...Array.from({ length: 63 }, (_, index) => (
        makeGenome(1_100_000 + index, 'fauna', 0.5)
      )),
      unsafe,
    ]);
    const snapshot = registeredSnapshotFromRows(earth, rows, extensions, ownership);
    const preflight = preflightCaptureV1(snapshot, 'tame');
    if (preflight.kind !== 'ready') throw new Error(`64-candidate preflight was ${preflight.reason}`);
    expect(preflight.pool).toHaveLength(64);
    expect(preflight.pool[63]?.identity.genome.seed).toBe(collidingSeed);
    expect(preflight.pool[63]?.identity.speciesId)
      .not.toBe(ownership.catalogSpecies[0]?.speciesId);
    const state = compatibilityStateForOwnership(ownership);
    expect(state.customNames).toContainEqual([`cs${collidingSeed}`, 'Capacity Known']);
    const preDraw = capacityPreDrawInput(state, extensions, 0);
    const beforeF4 = readF4Authority(extensions);
    const certified = certifyArc4CaptureCapacityV1({
      preflight,
      parent: currentArc5Parent(extensions),
      preDraw,
    });
    expect(certified).toEqual({
      kind: 'refused',
      reason: 'legacy-mirror-unrepresentable',
      scenario: {
        kind: 'hit',
        candidateSpeciesId: preflight.pool[63]?.identity.speciesId,
        sourceOrdinal: 63,
      },
    });
    expect(readF4Authority(extensions)).toEqual(beforeF4);
    expect(ownership.revision).toBe(0);
  }, 20_000);

  it('fails closed before draws when a new world would collide in legacy bioX by leaf seed', () => {
    const firstWorld = addressOf(
      RING3_WORLD.galaxy,
      RING3_WORLD.star,
      RING3_WORLD.planetSeed,
    );
    const collidingWorld = addressOf(
      RING4_WORLD.galaxy,
      RING4_WORLD.star,
      RING4_WORLD.planetSeed,
    );
    expect(firstWorld.key).not.toBe(collidingWorld.key);
    expect(firstWorld.planet.seed).toBe(collidingWorld.planet.seed);
    const priorProgress = createBiosphereProgressV1({
      worldAddress: firstWorld,
      cycle: 0,
      used: 1,
      successful: [],
    });
    const ownership = createInitialOwnershipStateV1({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [priorProgress], legacyBioX: [], scoutCreatureId: null,
    });
    expect(projectLegacyOwnershipMirror(ownership)).toMatchObject({ kind: 'projected' });
    const extensions = authorityExtensions(0, HIT_SEED, {}, 0, true, ownership);
    const snapshot = registeredSnapshotFromRows(
      collidingWorld,
      Object.freeze([makeGenome(7_070_707, 'flora', 0.5)]),
      extensions,
      ownership,
    );
    const preflight = preflightCaptureV1(snapshot, 'scavenge');
    if (preflight.kind !== 'ready') throw new Error(`bioX collision preflight was ${preflight.reason}`);
    const state = compatibilityStateForOwnership(ownership);
    const beforeF4 = readF4Authority(extensions);
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      parent: currentArc5Parent(extensions),
      preDraw: capacityPreDrawInput(state, extensions, 0),
    })).toEqual({
      kind: 'refused',
      reason: 'legacy-mirror-unrepresentable',
      scenario: { kind: 'miss', candidateSpeciesId: null, sourceOrdinal: null },
    });
    expect(readF4Authority(extensions)).toEqual(beforeF4);
    expect(ownership.revision).toBe(0);
  }, 20_000);

  it('certifies the global extension byte ceiling against the miss before draws', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const ownership = createEmptyOwnershipStateV1();
    const extensions = padExtensionsToGlobalByteLimit(
      authorityExtensions(0, HIT_SEED, {}, 0, true, ownership),
    );
    const snapshot = registeredSnapshotFromRows(
      earth,
      Object.freeze([makeGenome(8_080_808, 'flora', 0.5)]),
      extensions,
      ownership,
    );
    const preflight = preflightCaptureV1(snapshot, 'scavenge');
    if (preflight.kind !== 'ready') throw new Error(`extension capacity preflight was ${preflight.reason}`);
    const state = compatibilityStateForOwnership(ownership);
    const beforeF4 = readF4Authority(extensions);
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      parent: currentArc5Parent(extensions),
      preDraw: capacityPreDrawInput(state, extensions, 0),
    })).toEqual({
      kind: 'refused',
      reason: 'extension-capacity-exceeded',
      scenario: { kind: 'miss', candidateSpeciesId: null, sourceOrdinal: null },
    });
    expect(readF4Authority(extensions)).toEqual(beforeF4);
    expect(ownership.revision).toBe(0);
  }, 20_000);

  it('awards exact rare-find Stardust once, then later-cycle repeat ownership earns none', async () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const empty = createEmptyOwnershipStateV1();
    const probeExtensions = authorityExtensions(0, HIT_SEED, {}, 0, true, empty);
    let rows: readonly Genome[] | null = null;
    let rareIndex = -1;
    let rareTier = -1;
    for (let batch = 0; batch < 16 && rows === null; batch++) {
      const candidates = Object.freeze(Array.from({ length: 64 }, (_, index) => (
        makeGenome(2_000_000 + batch * 64 + index, 'fauna', 0.5)
      )));
      const snapshot = registeredSnapshotFromRows(earth, candidates, probeExtensions, empty, batch);
      const preflight = preflightCaptureV1(snapshot, 'tame');
      if (preflight.kind !== 'ready') throw new Error(`rare probe preflight was ${preflight.reason}`);
      const scenarios = projectCaptureCapacityScenariosV1(preflight, 0);
      const index = scenarios.scenarios.findIndex((scenario) => (
        scenario.kind === 'hit' && scenario.tier !== null && scenario.tier >= 5
      ));
      if (index > 0) {
        rows = candidates;
        rareIndex = index - 1;
        rareTier = scenarios.scenarios[index]!.tier!;
      }
    }
    if (rows === null || rareIndex < 0 || rareTier < 5) {
      throw new Error('bounded rare candidate search found no tier >= 5');
    }
    const chance = captureChanceV1({
      verb: 'tame',
      tier: rareTier as Parameters<typeof captureChanceV1>[0]['tier'],
      ring: 0,
      contactCapturePoints: 37,
    });
    let selectedSeed = -1;
    for (let seed = 0; seed < 1_000_000; seed++) {
      const rng = createSessionRNG(seed);
      const candidateIndex = Math.floor(rng.at(DOMAINS.captureCandidate, 0) * rows.length);
      if (candidateIndex === rareIndex
        && rng.at(DOMAINS.captureSuccess, 0) < chance
        && rng.at(DOMAINS.captureSuccess, 1) < chance) {
        selectedSeed = seed;
        break;
      }
    }
    if (selectedSeed < 0) throw new Error('bounded rare selection seed search failed');
    const extensions = authorityExtensions(0, selectedSeed, {}, 0, true, empty);
    const snapshot = registeredSnapshotFromRows(earth, rows, extensions, empty);
    const preflight = preflightCaptureV1(snapshot, 'tame');
    if (preflight.kind !== 'ready') throw new Error(`rare preflight was ${preflight.reason}`);
    const state = compatibilityStateForOwnership(empty);
    const preDraw = capacityPreDrawInput(state, extensions, 0);
    const cappedState = structuredClone(state);
    cappedState.essence = 1_000_000_000;
    cappedState.stats.essenceEarned = 1_000_000_000;
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      parent: currentArc5Parent(extensions),
      preDraw: capacityPreDrawInput(cappedState, extensions, 0),
    })).toEqual({
      kind: 'refused',
      reason: 'stardust-overflow',
      scenario: {
        kind: 'hit',
        candidateSpeciesId: preflight.pool[rareIndex]?.identity.speciesId,
        sourceOrdinal: rareIndex,
      },
    });
    const certified = certifyArc4CaptureCapacityV1({
      preflight, parent: currentArc5Parent(extensions), preDraw,
    });
    if (certified.kind !== 'certified') throw new Error(`rare certificate was ${certified.reason}`);
    const settled = await settleCapacityThroughGenuineOwner(
      preflight,
      state,
      extensions,
      0,
    );
    expect(settled.plan.hit).toBe(true);
    expect(settled.plan.candidate).toBe(preflight.pool[rareIndex]);
    expect(settled.plan.tier).toBe(rareTier);
    expect(settled.plan.firstForSpecies).toBe(true);
    expect(settled.stardustReward).toBe(rareTier - 3);
    expect(settled.derivation.state.essence).toBe(state.essence + rareTier - 3);
    expect(settled.derivation.state.stats.essenceEarned).toBe(
      (state.stats.essenceEarned ?? 0) + rareTier - 3,
    );

    const product = applyV5ExtensionWrites(
      extensions,
      settled.derivation.extensionWrites ?? [],
    );
    const afterFirst = prepareF4AuthorityUpdate(
      product.extensions,
      { activePlayMs: 0 },
      preDraw.nextSessionRng,
    );
    const laterExtensions = prepareF4AuthorityUpdate(
      afterFirst.extensions,
      { activePlayMs: ACTIVE_PLAY_CAPTURE_CYCLE_MS },
      afterFirst.authority.sessionRng,
    ).extensions;
    const rareRow = rows[rareIndex];
    if (rareRow === undefined) throw new Error('rare roster row disappeared');
    const laterSnapshot = registeredSnapshotFromRows(
      earth,
      Object.freeze([rareRow]),
      laterExtensions,
      settled.plan.successor,
    );
    const laterPreflight = preflightCaptureV1(laterSnapshot, 'tame');
    if (laterPreflight.kind !== 'ready') throw new Error(`rare repeat preflight was ${laterPreflight.reason}`);
    expect(laterPreflight.requiredHitHeadroom).toBe(3);
    const laterPreDraw = capacityPreDrawInput(
      settled.derivation.state,
      laterExtensions,
      ACTIVE_PLAY_CAPTURE_CYCLE_MS,
    );
    const laterCertified = certifyArc4CaptureCapacityV1({
      preflight: laterPreflight,
      parent: currentArc5Parent(laterExtensions),
      preDraw: laterPreDraw,
    });
    if (laterCertified.kind !== 'certified') {
      throw new Error(`rare repeat certificate was ${laterCertified.reason}`);
    }
    const repeated = await settleCapacityThroughGenuineOwner(
      laterPreflight,
      settled.derivation.state,
      laterExtensions,
      ACTIVE_PLAY_CAPTURE_CYCLE_MS,
    );
    expect(repeated.plan.hit).toBe(true);
    expect(repeated.plan.firstForSpecies).toBe(false);
    expect(repeated.stardustReward).toBe(0);
    expect(repeated.derivation.state.essence).toBe(settled.derivation.state.essence);
    expect(repeated.derivation.state.stats.essenceEarned)
      .toBe(settled.derivation.state.stats.essenceEarned);
    expect(repeated.plan.successor.catalogSpecies).toEqual(settled.plan.successor.catalogSpecies);
    expect(repeated.plan.successor.discoveries).toHaveLength(2);
    expect(repeated.plan.successor.creatures).toHaveLength(2);
    expect(repeated.plan.successor.discoveries.find(
      (row) => row.recordId === repeated.plan.discoveryRecordId,
    )?.firstForSpecies).toBe(false);
  }, 30_000);

  it('materializes first-species hybrid/best/generation stats and pins their red controls', async () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const ownership = createEmptyOwnershipStateV1();
    const hybridSeed = 9_191_919;
    const hybrid = Object.freeze({
      ...makeGenome(hybridSeed, 'fauna', 0.5),
      gen: 7,
      parents: Object.freeze(['s-parent-a', 's-parent-b']),
    }) as Genome;
    const extensions = authorityExtensions(0, HIT_SEED, {}, 0, true, ownership);
    const snapshot = registeredSnapshotFromRows(
      earth,
      Object.freeze([hybrid]),
      extensions,
      ownership,
    );
    const preflight = preflightCaptureV1(snapshot, 'tame');
    if (preflight.kind !== 'ready') throw new Error(`hybrid preflight was ${preflight.reason}`);
    const state = compatibilityStateForOwnership(ownership);
    const preDraw = capacityPreDrawInput(state, extensions, 0);
    const certified = certifyArc4CaptureCapacityV1({
      preflight, parent: currentArc5Parent(extensions), preDraw,
    });
    if (certified.kind !== 'certified') throw new Error(`hybrid certificate was ${certified.reason}`);
    const settled = await settleCapacityThroughGenuineOwner(
      preflight,
      state,
      extensions,
      0,
    );
    expect(settled.plan).toMatchObject({ hit: true, firstForSpecies: true });
    const capturedEntry = settled.derivation.state.codex.find(([id]) => id === `s${hybridSeed}`)?.[1];
    if (capturedEntry === undefined || capturedEntry.tier === null) {
      throw new Error('hybrid Compendium entry was not materialized with a tier');
    }
    const expectedBest = Math.max(state.stats.best ?? 0, capturedEntry.tier);
    const rankScore = (state.stats.surveys ?? 0) * 4
      + settled.derivation.state.codex.length * 2
      + expectedBest * 12
      + state.unlocked.length * 6
      + 1
      + state.galSeen.length * 3;
    const rankFloors = [0, 30, 90, 220, 460, 900, 1700, 3000, 5200, 8200];
    const expectedBestRank = rankFloors.reduce(
      (rank, floor, index) => rankScore >= floor ? index : rank,
      0,
    );
    const reflectsLegacySpeciesEffects = (candidate: SaveStateV2): boolean => {
      const entry = candidate.codex.find(([id]) => id === `s${hybridSeed}`)?.[1];
      return entry?.hybrid === true
        && JSON.stringify(entry.g.parents) === JSON.stringify(['s-parent-a', 's-parent-b'])
        && candidate.stats.hybrids === 1
        && candidate.stats.maxGen === 7
        && candidate.stats.best === expectedBest
        && candidate.stats.bestRank === expectedBestRank
        && JSON.stringify(candidate.unlocked) === JSON.stringify(state.unlocked);
    };
    expect(reflectsLegacySpeciesEffects(settled.derivation.state)).toBe(true);
    expect(capturedEntry.g.gen).toBe(7);
    expect(capturedEntry.g.parents).toEqual(['s-parent-a', 's-parent-b']);
    expect(settled.derivation.state.unlocked).toEqual(state.unlocked);

    const missingParents = structuredClone(settled.derivation.state);
    const missingParentsEntry = missingParents.codex.find(([id]) => id === `s${hybridSeed}`)?.[1];
    if (missingParentsEntry === undefined) throw new Error('hybrid red-control row disappeared');
    delete missingParentsEntry.g.parents;
    expect(reflectsLegacySpeciesEffects(missingParents)).toBe(false);
    const wrongParents = structuredClone(settled.derivation.state);
    const wrongParentsEntry = wrongParents.codex.find(([id]) => id === `s${hybridSeed}`)?.[1];
    if (wrongParentsEntry === undefined) throw new Error('hybrid lineage red-control row disappeared');
    wrongParentsEntry.g.parents = ['s-parent-b', 's-parent-a'];
    expect(reflectsLegacySpeciesEffects(wrongParents)).toBe(false);
    for (const field of ['hybrids', 'maxGen', 'best'] as const) {
      const regressed = structuredClone(settled.derivation.state);
      regressed.stats[field] = 0;
      expect(reflectsLegacySpeciesEffects(regressed)).toBe(false);
    }
    const wrongRank = structuredClone(settled.derivation.state);
    wrongRank.stats.bestRank = expectedBestRank === rankFloors.length - 1
      ? expectedBestRank - 1 : expectedBestRank + 1;
    expect(reflectsLegacySpeciesEffects(wrongRank)).toBe(false);
    const changedAchievements = structuredClone(settled.derivation.state);
    changedAchievements.unlocked.push('arc4-unexpected-achievement');
    expect(reflectsLegacySpeciesEffects(changedAchievements)).toBe(false);
  }, 20_000);

  it('replays byte-identically, binds successor to its exact parent, and never mutates/rerolls authority', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const ownership = createEmptyOwnershipStateV1();
    const extensions = authorityExtensions(0, HIT_SEED, {}, 0, true, ownership);
    const beforeAuthority = readF4Authority(extensions);
    const snapshot = readySnapshot(earth, roster, extensions);
    const preflight = preflightCaptureV1(snapshot, 'tame');
    if (preflight.kind !== 'ready') throw new Error(`replay preflight was ${preflight.reason}`);
    const firstDraws = composeCaptureDrawBundleV1(preflight, extensions);
    const secondDraws = composeCaptureDrawBundleV1(preflight, extensions);
    if (firstDraws.kind !== 'planned' || secondDraws.kind !== 'planned') {
      throw new Error('replay F4 bridge did not plan');
    }
    expect(secondDraws.bundle).toEqual(firstDraws.bundle);
    expect(firstDraws.bundle.nextSessionRng).toMatchObject({
      ordinal: 1,
      draws: { [DOMAINS.captureCandidate]: 1, [DOMAINS.captureSuccess]: 1 },
    });
    expect(readF4Authority(extensions)).toEqual(beforeAuthority);
    const first = planCaptureV1(preflight, firstDraws.bundle);
    const second = planCaptureV1(preflight, secondDraws.bundle);
    if (first.kind !== 'planned' || second.kind !== 'planned') throw new Error('replay plan refused');
    expect(second.plan.witness).toBe(first.plan.witness);
    expect(second.plan.discoveryRecordId).toBe(first.plan.discoveryRecordId);
    expect(second.plan.ownedRowId).toBe(first.plan.ownedRowId);
    expect(encodeOwnershipStateV1(second.plan.successor))
      .toBe(encodeOwnershipStateV1(first.plan.successor));
    expect(isOwnershipSuccessorV1(first.plan.successor, snapshot.ownership)).toBe(true);
    expect(isOwnershipSuccessorV1(first.plan.successor, second.plan.successor)).toBe(false);
    expect(ownership.revision).toBe(0);
  });

  it('isolates unrelated counters, refuses stale F4 authority, and never accepts a loose draw clone', () => {
    const earth = addressOf(HOME_GALAXY, SOL, 133);
    const roster = rosterOf(earth);
    const state = createEmptyOwnershipStateV1();
    const baseExtensions = authorityExtensions(0, HIT_SEED, {}, 0, true, state);
    const unrelatedExtensions = authorityExtensions(0, HIT_SEED, {
      [DOMAINS.surveyHazard]: 999,
    }, 0, true, state);
    const baseSnapshot = readySnapshot(earth, roster, baseExtensions);
    const unrelatedSnapshot = readySnapshot(earth, roster, unrelatedExtensions);
    const basePreflight = preflightCaptureV1(baseSnapshot, 'tame');
    const unrelatedPreflight = preflightCaptureV1(unrelatedSnapshot, 'tame');
    if (basePreflight.kind !== 'ready' || unrelatedPreflight.kind !== 'ready') {
      throw new Error('counter-isolation preflight refused');
    }
    const baseDraws = composeCaptureDrawBundleV1(basePreflight, baseExtensions);
    const unrelatedDraws = composeCaptureDrawBundleV1(unrelatedPreflight, unrelatedExtensions);
    if (baseDraws.kind !== 'planned' || unrelatedDraws.kind !== 'planned') {
      throw new Error('counter-isolation F4 bridge refused');
    }
    expect(unrelatedDraws.bundle.draws).toEqual(baseDraws.bundle.draws);
    expect(unrelatedDraws.bundle.nextSessionRng.draws[DOMAINS.surveyHazard]).toBe(999);
    expect(baseDraws.bundle.snapshotFingerprint).toBe(baseSnapshot.fingerprint);
    expect(composeCaptureDrawBundleV1(basePreflight, unrelatedExtensions))
      .toEqual({ kind: 'protected', reason: 'snapshot-authority-mismatch' });
    expect(composeCaptureDrawBundleV1(basePreflight, arc2F4Extensions(0, HIT_SEED)))
      .toEqual({ kind: 'protected', reason: 'snapshot-ownership-protected' });
    const changedOwnership = createInitialOwnershipStateV1({
      catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
      biosphereProgress: [createBiosphereProgressV1({
        worldAddress: earth, cycle: 0, used: 1, successful: [],
      })],
      legacyBioX: [], scoutCreatureId: null,
    });
    const changedOwnershipExtensions = authorityExtensions(
      0, HIT_SEED, {}, 0, true, changedOwnership,
    );
    expect(composeCaptureDrawBundleV1(basePreflight, changedOwnershipExtensions))
      .toEqual({ kind: 'protected', reason: 'snapshot-ownership-mismatch' });
    const changedCapabilityExtensions = authorityExtensions(0, HIT_SEED, {}, 0, false, state);
    expect(composeCaptureDrawBundleV1(basePreflight, changedCapabilityExtensions))
      .toEqual({ kind: 'protected', reason: 'snapshot-capability-mismatch' });
    expect(planCaptureV1(basePreflight, { ...baseDraws.bundle }))
      .toEqual({ kind: 'refused', reason: 'draw-bundle-unregistered' });
    expect(planCaptureV1(basePreflight, new Proxy(baseDraws.bundle, {})))
      .toEqual({ kind: 'refused', reason: 'draw-bundle-unregistered' });
    expect(planCaptureV1(new Proxy(basePreflight, {}), baseDraws.bundle))
      .toEqual({ kind: 'refused', reason: 'preflight-unregistered' });

    const laterRoster = rosterOf(earth, 1);
    const laterSnapshot = readySnapshot(earth, laterRoster, baseExtensions);
    const laterPreflight = preflightCaptureV1(laterSnapshot, 'tame');
    if (laterPreflight.kind !== 'ready') throw new Error(`later-epoch preflight was ${laterPreflight.reason}`);
    expect(planCaptureV1(laterPreflight, baseDraws.bundle))
      .toEqual({ kind: 'refused', reason: 'snapshot-authority-mismatch' });

    const exhaustedOrdinalExtensions = authorityExtensions(
      0, HIT_SEED, {}, 0xFFFF_FFFF, true, state,
    );
    const exhaustedOrdinalSnapshot = readySnapshot(earth, roster, exhaustedOrdinalExtensions);
    const exhaustedOrdinalPreflight = preflightCaptureV1(exhaustedOrdinalSnapshot, 'tame');
    if (exhaustedOrdinalPreflight.kind !== 'ready') {
      throw new Error(`ordinal exhaustion preflight was ${exhaustedOrdinalPreflight.reason}`);
    }
    const beforeExhaustedOrdinal = readF4Authority(exhaustedOrdinalExtensions);
    expect(composeCaptureDrawBundleV1(
      exhaustedOrdinalPreflight,
      exhaustedOrdinalExtensions,
    )).toEqual({ kind: 'protected', reason: 'receipt-ordinal-exhausted' });
    expect(readF4Authority(exhaustedOrdinalExtensions)).toEqual(beforeExhaustedOrdinal);

    const exhaustedCounterExtensions = authorityExtensions(
      0, HIT_SEED, { [DOMAINS.captureCandidate]: 0xFFFF_FFFF }, 0, true, state,
    );
    const exhaustedCounterSnapshot = readySnapshot(earth, roster, exhaustedCounterExtensions);
    const exhaustedCounterPreflight = preflightCaptureV1(exhaustedCounterSnapshot, 'tame');
    if (exhaustedCounterPreflight.kind !== 'ready') {
      throw new Error(`counter exhaustion preflight was ${exhaustedCounterPreflight.reason}`);
    }
    const beforeExhaustedCounter = readF4Authority(exhaustedCounterExtensions);
    expect(composeCaptureDrawBundleV1(
      exhaustedCounterPreflight,
      exhaustedCounterExtensions,
    )).toEqual({
      kind: 'protected', reason: 'draw-counter-exhausted', domain: DOMAINS.captureCandidate,
    });
    expect(readF4Authority(exhaustedCounterExtensions)).toEqual(beforeExhaustedCounter);
  });
});
