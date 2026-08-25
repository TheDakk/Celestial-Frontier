import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { MAX_GEAR_CAPACITY } from '@cf/domain-loot';
import { SCENE_ENGINEERING_ADDRESS_RESOLVER } from '@cf/domain-opportunity';
import {
  importSaveV2,
  prepareArc2LootLegacyMigration,
  readArc3Engineering,
  type ContentRegistry,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import {
  navFromCanonicalCF1Address,
  resolveCF1StarAddress,
  resolveViewToNav,
  type NavState,
} from '@cf/scene';
import {
  prepareArc3AppBootstrap,
  type Arc3EngineeringAddressSources,
} from '../apps/game/src/arc3-engineering-actions.js';
import {
  GLASS_VETERAN_PREF_RAW,
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

describe('Glass veteran Engineering fixture migration', () => {
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
