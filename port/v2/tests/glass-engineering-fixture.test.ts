import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  projectCapturePresentationV1,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
} from '@cf/domain-acquisition';
import { MAX_GEAR_CAPACITY } from '@cf/domain-loot';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { SCENE_ENGINEERING_ADDRESS_RESOLVER } from '@cf/domain-opportunity';
import {
  importSaveV2,
  prepareArc2LootLegacyMigration,
  prepareF4AuthorityUpdate,
  readArc2AcquisitionCapabilities,
  readArc3Engineering,
  readArc4Ownership,
  type ContentRegistry,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import {
  navFromCanonicalCF1Address,
  canonicalCF1WorldAddressFromNav,
  resolveCF1StarAddress,
  resolveViewToNav,
  type NavState,
} from '@cf/scene';
import {
  prepareArc3AppBootstrap,
  type Arc3EngineeringAddressSources,
} from '../apps/game/src/arc3-engineering-actions.js';
import { composeAcquisitionSnapshotV1 } from '../apps/game/src/acquisition-snapshot.js';
import { prepareArc4AppBootstrap } from '../apps/game/src/arc4-capture-action.js';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';
import {
  GLASS_VETERAN_CAPTURE_ORACLE,
  GLASS_VETERAN_PREF_RAW,
  GLASS_VETERAN_PREF_RAW_SHA256,
  glassVeteranPreferenceRaw,
  type GlassEngineeringFixtureVariant,
} from '../tools/glass-engineering-fixture-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(
  fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8'),
) as ContentRegistry;
const NOW = 1_787_622_190_000;
const SOL = Object.freeze({
  galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
  star: Object.freeze({ seed: 424242, x: 560, y: 170 }),
});

beforeAll(() => installCaptureHooks());

function exactGlassSources(
  save: SaveStateV2,
  ingress: Readonly<{
    readonly savedView: unknown;
    readonly atlasWhere: Readonly<{ get(entry: Record<string, unknown>): unknown }>;
  }>,
): Arc3EngineeringAddressSources {
  const currentAddress = resolveCF1StarAddress(SOL);
  if (!currentAddress.ok) throw new Error(`Glass Sol source failed: ${currentAddress.reason}`);
  const current = navFromCanonicalCF1Address(currentAddress.address);
  if (!current.ok || current.state.mode !== 'system') throw new Error('Glass Sol nav source failed');

  const saved = resolveViewToNav(ingress.savedView === undefined ? null : ingress.savedView);
  if (!saved.ok) throw new Error(`Glass saved source failed: ${saved.reason}`);
  const atlas: NavState[] = [];
  for (const [, entry] of save.logMap) {
    const rawWhere = ingress.atlasWhere.get(entry);
    if (rawWhere === null || rawWhere === undefined) continue;
    const route = resolveViewToNav(rawWhere);
    if (route.ok && route.state.mode !== 'universe') atlas.push(route.state);
  }
  return Object.freeze({ current: current.state, saved: saved.state, atlas: Object.freeze(atlas) });
}

function exerciseGlassFixture(variant: GlassEngineeringFixtureVariant) {
  const raw = glassVeteranPreferenceRaw(variant);
  const imported = importSaveV2(raw, REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Glass ${variant} import failed: ${imported.reason}`);
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: imported.state,
    capacity: MAX_GEAR_CAPACITY,
  });
  if (loot.kind !== 'prepared') throw new Error(`Glass ${variant} Arc 2 migration was ${loot.kind}`);
  const outcome = prepareArc3AppBootstrap({
    extensions: loot.extensions,
    save: imported.state,
    sources: exactGlassSources(imported.state, imported.ingress),
  });
  return Object.freeze({ raw, imported, outcome, extensions: loot.extensions as V5Extensions });
}

function exerciseVeteranCapture(raw = GLASS_VETERAN_PREF_RAW) {
  const imported = importSaveV2(raw, REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Glass capture import failed: ${imported.reason}`);
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: imported.state,
    capacity: MAX_GEAR_CAPACITY,
  });
  if (loot.kind !== 'prepared') throw new Error(`Glass capture Arc 2 migration was ${loot.kind}`);
  const ownership = prepareArc4AppBootstrap({ extensions: loot.extensions, save: imported.state });
  if (ownership.kind !== 'prepared') {
    throw new Error(`Glass capture Arc 4 migration was ${ownership.kind}`);
  }
  const extensions = prepareF4AuthorityUpdate(
    ownership.extensions,
    { activePlayMs: 0 },
    createSessionRNG(68).state(),
  ).extensions;
  const earthEntry = imported.state.logMap.find(([id]) => id === 'p133')?.[1];
  if (!earthEntry) throw new Error('Glass capture Earth Atlas source is absent');
  const earthWhere = imported.ingress.atlasWhere.get(earthEntry);
  const nav = resolveViewToNav(earthWhere);
  if (!nav.ok || nav.state.mode !== 'surface') throw new Error('Glass capture Earth route failed');
  const address = canonicalCF1WorldAddressFromNav(nav.state);
  if (!address.ok) throw new Error(`Glass capture Earth address failed: ${address.reason}`);
  const roster = canonicalWorldRoster(address.address, imported.state.EPOCH_BASE);
  if (!roster.ok) throw new Error(`Glass capture roster failed: ${roster.reason}`);
  const composed = composeAcquisitionSnapshotV1({
    nav: nav.state,
    address: address.address,
    roster: roster.roster,
    ecologyEpoch: roster.roster.ecologyEpoch,
    fullRosterFingerprint: roster.roster.fullRosterFingerprint,
    extensions,
  });
  if (composed.kind !== 'ready') throw new Error(`Glass capture snapshot was ${composed.reason}`);
  const projection = projectCapturePresentationV1(
    composed.snapshot,
    { observedActivePlayMs: 0 },
  );
  if (projection.kind !== 'ready') throw new Error(`Glass capture projection was ${projection.reason}`);
  const capabilities = readArc2AcquisitionCapabilities(extensions);
  if (capabilities.kind !== 'loaded') throw new Error(`Glass capture capabilities were ${capabilities.kind}`);
  const owned = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (owned.kind !== 'loaded') throw new Error(`Glass capture ownership was ${owned.kind}`);
  return { imported, loot, ownership, extensions, address: address.address, roster: roster.roster,
    projection, capabilities: capabilities.capabilities, owned: owned.state };
}

function sourceDerivedVeteranCaptureOracle(raw = GLASS_VETERAN_PREF_RAW) {
  const exercised = exerciseVeteranCapture(raw);
  const aliases = exercised.imported.state.customNames.filter(([key]) => key === 'p133');
  if (aliases.length !== 1) throw new Error('Glass capture Homeworld alias is not unique');
  const odds = (verb: 'tame' | 'scavenge' | 'sample') => {
    const row = exercised.projection.verbs[verb];
    if (row.status !== 'ready' || row.reason !== 'ready' || row.chance === null) {
      throw new Error(`Glass capture ${verb} projection was ${row.status}:${row.reason}`);
    }
    return {
      eligibleCount: row.eligiblePoolCount,
      overallChance: row.chance.arithmeticMean,
      chanceMin: row.chance.minimum,
      chanceMax: row.chance.maximum,
    };
  };
  const contextKey = `${exercised.address.key}|epoch:${exercised.roster.ecologyEpoch}|${exercised.roster.fullRosterFingerprint}`;
  return {
    schema: 'cf-v2-glass-veteran-capture-oracle/v1' as const,
    preferenceRawSha256: createHash('sha256').update(raw).digest('hex'),
    title: aliases[0]![1],
    worldKey: exercised.address.key,
    ecologyEpoch: exercised.roster.ecologyEpoch,
    previewCount: exercised.roster.view.preview.length,
    fullRosterCount: exercised.roster.view.all.length,
    fullRosterFingerprint: exercised.roster.fullRosterFingerprint,
    contextKey,
    contactCapturePoints: exercised.capabilities.contactCaptureBonus,
    biosphereYield: {
      yield: exercised.projection.biosphereYield.total,
      used: exercised.projection.biosphereYield.used,
      remaining: exercised.projection.biosphereYield.remaining,
      cycle: exercised.projection.biosphereYield.cycle,
    },
    odds: {
      tame: odds('tame'),
      scavenge: odds('scavenge'),
      sample: odds('sample'),
    },
  };
}

function mutatedPreferenceRaw(mutate: (fixture: Record<string, unknown>) => void): string {
  const fixture = JSON.parse(GLASS_VETERAN_PREF_RAW) as Record<string, unknown>;
  mutate(fixture);
  return JSON.stringify(fixture);
}

interface CaptureOracleComparable {
  readonly schema: string;
  readonly preferenceRawSha256: string;
  readonly title: string;
  readonly worldKey: string;
  readonly ecologyEpoch: number;
  readonly previewCount: number;
  readonly fullRosterCount: number;
  readonly fullRosterFingerprint: string;
  readonly contextKey: string;
  readonly contactCapturePoints: number;
  readonly biosphereYield: Readonly<{
    yield: number; used: number; remaining: number; cycle: number;
  }>;
  readonly odds: Readonly<Record<'tame' | 'scavenge' | 'sample', Readonly<{
    eligibleCount: number; overallChance: number; chanceMin: number; chanceMax: number;
  }>>>;
}

function oracleMismatchReasons(
  actual: CaptureOracleComparable,
  expected: CaptureOracleComparable,
): string[] {
  const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
  const checks = {
    schema: actual.schema === expected.schema,
    preferenceRawSha256: actual.preferenceRawSha256 === expected.preferenceRawSha256,
    title: actual.title === expected.title,
    worldKey: actual.worldKey === expected.worldKey,
    ecologyEpoch: actual.ecologyEpoch === expected.ecologyEpoch,
    previewCount: actual.previewCount === expected.previewCount,
    fullRosterCount: actual.fullRosterCount === expected.fullRosterCount,
    fullRosterFingerprint: actual.fullRosterFingerprint === expected.fullRosterFingerprint,
    contextKey: actual.contextKey === expected.contextKey,
    contactCapturePoints: actual.contactCapturePoints === expected.contactCapturePoints,
    biosphereYield: same(actual.biosphereYield, expected.biosphereYield),
    tameOdds: same(actual.odds.tame, expected.odds.tame),
    scavengeOdds: same(actual.odds.scavenge, expected.odds.scavenge),
    sampleOdds: same(actual.odds.sample, expected.odds.sample),
  };
  return Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
}

function expectDeeplyFrozen(value: unknown, seen = new Set<object>()): void {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && Object.hasOwn(descriptor, 'value')) {
      expectDeeplyFrozen(descriptor.value, seen);
    }
  }
}

describe('Glass veteran Engineering fixture migration', () => {
  it('binds a deeply frozen capture oracle to the exact Glass veteran raw bytes and real owners', () => {
    expect(GLASS_VETERAN_PREF_RAW_SHA256)
      .toBe('3ea92b8b7fbb87357c1c275105fc1f520618aa9e8a14aeda11ad362e871311b0');
    expect(createHash('sha256').update(GLASS_VETERAN_PREF_RAW).digest('hex'))
      .toBe(GLASS_VETERAN_PREF_RAW_SHA256);
    const derived = sourceDerivedVeteranCaptureOracle();
    expect(derived).toEqual(GLASS_VETERAN_CAPTURE_ORACLE);
    expect(oracleMismatchReasons(derived, GLASS_VETERAN_CAPTURE_ORACLE)).toEqual([]);
    expectDeeplyFrozen(GLASS_VETERAN_CAPTURE_ORACLE);
  });

  it('rejects epoch, Homeworld-alias, contact, and Earth-progress mutations semantically', () => {
    const epoch = sourceDerivedVeteranCaptureOracle(mutatedPreferenceRaw((fixture) => {
      fixture.epoch = 13;
    }));
    expect(epoch.ecologyEpoch).toBe(13);
    expect(oracleMismatchReasons(epoch, GLASS_VETERAN_CAPTURE_ORACLE)).toEqual(expect.arrayContaining([
      'preferenceRawSha256', 'ecologyEpoch', 'fullRosterFingerprint', 'contextKey',
    ]));

    const alias = sourceDerivedVeteranCaptureOracle(mutatedPreferenceRaw((fixture) => {
      const names = fixture.names as Array<[string, string]>;
      const home = names.find(([key]) => key === 'p133');
      if (!home) throw new Error('alias mutation target is absent');
      home[1] = 'Former Homeworld';
    }));
    expect(alias.title).toBe('Former Homeworld');
    expect(oracleMismatchReasons(alias, GLASS_VETERAN_CAPTURE_ORACLE))
      .toEqual(['preferenceRawSha256', 'title']);

    const contact = sourceDerivedVeteranCaptureOracle(mutatedPreferenceRaw((fixture) => {
      (fixture.items as Array<[string, number]>).push(['diplobeacon', 1]);
      (fixture.eq as Record<string, string>).necklace = 'diplobeacon';
    }));
    expect(contact.contactCapturePoints).toBe(20);
    expect(oracleMismatchReasons(contact, GLASS_VETERAN_CAPTURE_ORACLE)).toEqual([
      'preferenceRawSha256', 'contactCapturePoints',
      'tameOdds', 'scavengeOdds', 'sampleOdds',
    ]);

    const earthProgressRaw = mutatedPreferenceRaw((fixture) => {
      (fixture.bx as Array<[number, [number, number]]>).push([133, [1, 12]]);
    });
    const earthProgress = exerciseVeteranCapture(earthProgressRaw);
    expect(earthProgress.owned.legacyBioX).toMatchObject([
      { legacyPlanetSeed: 133, used: 1, epochStamp: 12, relation: 'equal' },
      { legacyPlanetSeed: 301, used: 3, epochStamp: 2, relation: 'old' },
    ]);
    for (const verb of ['tame', 'scavenge', 'sample'] as const) {
      expect(earthProgress.projection.verbs[verb]).toMatchObject({
        status: 'unavailable', reason: 'legacy-biosphere-unresolved',
      });
    }
    expect(() => sourceDerivedVeteranCaptureOracle(earthProgressRaw))
      .toThrow(/legacy-biosphere-unresolved/u);
  });

  it('keeps the old epoch-zero/contact-capped Glass oracle red', () => {
    const stale = structuredClone(GLASS_VETERAN_CAPTURE_ORACLE) as unknown as ReturnType<
      typeof sourceDerivedVeteranCaptureOracle
    >;
    Object.assign(stale, {
      ecologyEpoch: 0,
      fullRosterCount: 19,
      fullRosterFingerprint: 'cwr1:19:6305:58e079f2',
      contextKey: `${stale.worldKey}|epoch:0|cwr1:19:6305:58e079f2`,
      contactCapturePoints: 20,
      odds: {
        tame: { eligibleCount: 8, overallChance: 0.6925, chanceMin: 0.61, chanceMax: 0.85 },
        scavenge: { eligibleCount: 8, overallChance: 0.9035, chanceMin: 0.826, chanceMax: 0.95 },
        sample: { eligibleCount: 3, overallChance: 0.8883333333333333, chanceMin: 0.79, chanceMax: 0.95 },
      },
    });
    expect(oracleMismatchReasons(sourceDerivedVeteranCaptureOracle(), stale)).toEqual([
      'ecologyEpoch', 'fullRosterCount', 'fullRosterFingerprint', 'contextKey',
      'contactCapturePoints', 'tameOdds', 'scavengeOdds', 'sampleOdds',
    ]);
  });
  it('binds the exact bytes imported by Glass to the both-cleared contract variant', () => {
    expect(GLASS_VETERAN_PREF_RAW).toBe(glassVeteranPreferenceRaw('cleared'));
    const baselineRaw = JSON.parse(glassVeteranPreferenceRaw('original-orphan')) as Record<string, unknown>;
    for (const variant of ['mx-only', 'minedw-only', 'cleared'] as const) {
      const candidate = JSON.parse(glassVeteranPreferenceRaw(variant)) as Record<string, unknown>;
      const changed = Object.keys(baselineRaw).filter(
        (key) => JSON.stringify(baselineRaw[key]) !== JSON.stringify(candidate[key]),
      );
      expect(changed).toEqual(variant === 'mx-only'
        ? ['minedw'] : variant === 'minedw-only' ? ['mx'] : ['minedw', 'mx']);
    }
  });

  it.each([
    ['original-orphan', [[201, 4]], [[201, 1_753_898_800_000]]],
    ['mx-only', [[201, 4]], []],
    ['minedw-only', [[201, 1]], [[201, 1_753_898_800_000]]],
  ] as const)('%s remains protected on the unresolved world seed', (variant, mineX, mined) => {
    const exercised = exerciseGlassFixture(variant);
    expect(exercised.imported.state.mineX).toEqual(mineX);
    expect(exercised.imported.state.mined).toEqual(mined);
    expect(exercised.imported.state.skimX).toEqual([[424242, 2]]);
    expect(exercised.imported.state.techOwned).toEqual(['scan1', 'hull1']);
    expect(exercised.outcome).toMatchObject({
      kind: 'protected',
      reason: 'legacy-refused',
      detail: 'legacy-seed-missing',
      addressDiagnostics: {
        candidates: 3,
        contributedWorlds: 1,
        contributedStars: 2,
        duplicateWorldKeys: 0,
        duplicateStarKeys: 1,
        uniqueWorlds: 1,
        uniqueStars: 1,
      },
      legacyDiagnostics: {
        missingWorldSeeds: [201],
        ambiguousWorldSeeds: [],
        missingStarSeeds: [],
        ambiguousStarSeeds: [],
      },
    });
  });

  it('prepares only after both orphan Mine rows are cleared and preserves Sol skim/research', () => {
    const exercised = exerciseGlassFixture('cleared');
    expect(exercised.raw).toBe(GLASS_VETERAN_PREF_RAW);
    expect(exercised.imported.state.mineX).toEqual([]);
    expect(exercised.imported.state.mined).toEqual([]);
    expect(exercised.imported.state.skimX).toEqual([[424242, 2]]);
    expect(exercised.imported.state.techOwned).toEqual(['scan1', 'hull1']);
    expect(exercised.outcome).toMatchObject({
      kind: 'prepared',
      addressDiagnostics: {
        candidates: 3,
        contributedWorlds: 1,
        contributedStars: 2,
        duplicateWorldKeys: 0,
        duplicateStarKeys: 1,
        uniqueWorlds: 1,
        uniqueStars: 1,
      },
      legacyDiagnostics: {
        missingWorldSeeds: [],
        ambiguousWorldSeeds: [],
        missingStarSeeds: [],
        ambiguousStarSeeds: [],
      },
      state: {
        worlds: [],
        research: ['scan1', 'hull1'],
      },
    });
    if (exercised.outcome.kind !== 'prepared') throw new Error('cleared Glass fixture was not prepared');
    expect(exercised.outcome.state.stars).toHaveLength(1);
    expect(exercised.outcome.state.stars[0]).toMatchObject({
      address: { star: { seed: 424242 } },
      extractionsTaken: 2,
    });
    const persisted = readArc3Engineering(
      exercised.outcome.extensions,
      SCENE_ENGINEERING_ADDRESS_RESOLVER,
    );
    expect(persisted).toMatchObject({
      kind: 'loaded',
      state: {
        worlds: [],
        stars: [{ address: { star: { seed: 424242 } }, extractionsTaken: 2 }],
        research: ['scan1', 'hull1'],
      },
    });
  });
});
