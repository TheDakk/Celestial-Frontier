import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import * as acquisitionRoot from '@cf/domain-acquisition';
import {
  MAX_OWNERSHIP_REVISION,
  CAPTURE_PLANNER_POLICY_BLOCKERS_V1,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  TAME_ODDS_V1,
  captureChanceV1,
  captureHitV1,
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
  isOwnershipSuccessorV1,
  migrateLegacyOwnershipStateV1,
  ownershipStateDigestV1,
  ownershipContentId,
  planCaptureV1,
  preflightCaptureV1,
  sha256Hex,
  type AcquisitionCandidateV1,
  type CanonicalJson,
  type OwnershipStateV1,
} from '@cf/domain-acquisition';
import {
  biosphere,
  planetSpeciesAtEcologyEpoch,
} from '@cf/domain-ecology';
import { _earthNamePass, installCaptureHooks } from '@cf/domain-descriptors';
import { describeSpecies, makeGenome, type Genome } from '@cf/domain-genome';
import { climateBand } from '@cf/domain-surveyphrases';
import { ASC_RING_R, regionAt, ringGrade } from '@cf/domain-strays';
import { systemFor } from '@cf/domain-worldgen';
import {
  DOMAINS,
  createSessionRNG,
} from '@cf/domain-sessionrng';
import {
  ARC4_OWNERSHIP_MANIFEST_NAMESPACE,
  applyV5ExtensionWrites,
  canonicalizeV5Extensions,
  encodeArc4Ownership,
  prepareArc2LootLegacyMigration,
  prepareF4AuthorityUpdate,
  readF4Authority,
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
import {
  canonicalWorldRoster,
  canonicalWorldRosterForDiagnostics,
  type CanonicalWorldRoster,
  type WorldRosterSources,
} from '../apps/game/src/world-roster.js';

beforeAll(() => installCaptureHooks());

const V2_ROOT = fileURLToPath(new URL('../', import.meta.url));
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

function referencesInternalSnapshotModule(source: string): boolean {
  const compact = source.replace(/[\s'"`+]/gu, '');
  return compact.includes(INTERNAL_SNAPSHOT_IMPORT)
    || compact.includes(INTERNAL_SNAPSHOT_BASENAME);
}

function referencesSnapshotRegistryModule(source: string): boolean {
  return source.replace(/[\s'"`+]/gu, '').includes(SNAPSHOT_REGISTRY_BASENAME);
}

function referencesSnapshotMint(source: string): boolean {
  const compact = source.replace(/[\s'"`+]/gu, '');
  return compact.includes(SNAPSHOT_MINT) || compact.includes(DRAW_MINT);
}

function referencesSnapshotRegistryMint(source: string): boolean {
  const compact = source.replace(/[\s'"`+]/gu, '');
  return compact.includes(SNAPSHOT_REGISTRY_MINT) || compact.includes(DRAW_REGISTRY_MINT);
}

function referencesCapturePlanEntry(source: string): boolean {
  return source.replace(/[\s'"`+]/gu, '').includes(CAPTURE_PLAN_ENTRY);
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
  return withOwnership(
    arc2F4Extensions(activePlayMs, seed, draws, ordinal, withContact),
    ownership,
  );
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
    const sourceFiles = [
      ...TypeScriptFilesUnder(path.join(V2_ROOT, 'packages')),
      ...TypeScriptFilesUnder(path.join(V2_ROOT, 'apps')),
      ...TypeScriptFilesUnder(path.join(V2_ROOT, 'tests')),
    ];
    const computedProductionImports = sourceFiles.filter((absolute) => {
      const relative = relativeV2Path(absolute);
      return (relative.startsWith('packages/') || relative.startsWith('apps/'))
        && relative.includes('/src/')
        && hasComputedDynamicImport(fs.readFileSync(absolute, 'utf8'));
    }).map(relativeV2Path).sort();
    expect(computedProductionImports).toEqual([]);
    expect(hasComputedDynamicImport("const authority = import(modulePath)")).toBe(true);
    expect(hasComputedDynamicImport(
      "const authority = import('@cf/domain-acquisition/' + 'snapshot-internal')",
    )).toBe(true);
    expect(hasComputedDynamicImport(
      "const art = import('@cf/art/species-painter')",
    )).toBe(false);
    const moduleReferences = sourceFiles
      .filter((absolute) => referencesInternalSnapshotModule(fs.readFileSync(absolute, 'utf8')))
      .map(relativeV2Path)
      .sort();
    expect(moduleReferences).toEqual([APP_COMPOSITOR, THIS_TEST].sort());
    const mintReferences = sourceFiles
      .filter((absolute) => referencesSnapshotMint(fs.readFileSync(absolute, 'utf8')))
      .map(relativeV2Path)
      .sort();
    expect(mintReferences).toEqual([APP_COMPOSITOR, INTERNAL_DEFINITION, THIS_TEST].sort());
    expect(mintReferences.filter((relative) => relative.includes('/src/'))).toEqual([
      APP_COMPOSITOR,
      INTERNAL_DEFINITION,
    ].sort());
    const registryReferences = sourceFiles
      .filter((absolute) => referencesSnapshotRegistryModule(fs.readFileSync(absolute, 'utf8')))
      .map(relativeV2Path)
      .sort();
    expect(registryReferences).toEqual([
      INTERNAL_DEFINITION, SNAPSHOT_DEFINITION, THIS_TEST,
    ].sort());
    const registryMintReferences = sourceFiles
      .filter((absolute) => referencesSnapshotRegistryMint(fs.readFileSync(absolute, 'utf8')))
      .map(relativeV2Path)
      .sort();
    expect(registryMintReferences).toEqual([
      INTERNAL_DEFINITION, REGISTRY_DEFINITION, THIS_TEST,
    ].sort());
    const capturePlanConsumers = sourceFiles
      .filter((absolute) => referencesCapturePlanEntry(fs.readFileSync(absolute, 'utf8')))
      .map(relativeV2Path)
      .sort();
    expect(capturePlanConsumers).toEqual([
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
    const realSource = fs.readFileSync(path.join(V2_ROOT, APP_COMPOSITOR), 'utf8');
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

describe('Arc 4 exact capture formula and truthful successor', () => {
  it('pins the complete tier/verb/ring/contact formula matrix independently', () => {
    expect(CAPTURE_PLANNER_POLICY_BLOCKERS_V1).toEqual({
      legacyEligibility: 'temporary-v1.8.9-not-catalogued-by-seed',
      reacquisition: 'unresolved',
      encodedExtensionByteCapacity: 'unresolved',
      breedingProvenance: 'unsupported-by-ownership-v1',
      guardianProvenance: 'unsupported-by-ownership-v1',
      writerExposed: false,
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

  it('derives each verb pool from the full roster and temporary exact seed catalogue eligibility', () => {
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
