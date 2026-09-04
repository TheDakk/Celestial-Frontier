import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  createLegacyEngineeringSeedResolver,
  migrateLegacyEngineeringState,
  projectWorldOpportunity,
  type EngineeringStateV2,
} from '@cf/domain-opportunity';
import {
  navFromCanonicalCF1Address,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
  type SystemNav,
  type SurfaceNav,
} from '@cf/scene';
import { projectOrbitalMineralSurveyRow } from '../apps/game/src/engineering-panel-model.js';

const SOL = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 424242, x: 560, y: 170 },
};
const EARTH = { ...SOL, planet: { seed: 133 } };
const BIOME_VEIN_WORLD = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 3037235558, x: -897.1608293121681, y: -86.20030916528776 },
  planet: { seed: 171668249 },
};
const TIER_10_COSMIC_EXCEPTIONAL_WORLD = {
  galaxy: { seed: 2775120088, x: -15585.946043489894, y: -13862.482918268226 },
  star: { seed: 510510541, x: -550.8509466005489, y: -8.055439678020775 },
  planet: { seed: 3303620273 },
};
const TIER_14_LIVING_WORLD = {
  galaxy: { seed: 1012779741, x: -599.7658047693408, y: -6073.942273357868 },
  star: { seed: 3589953231, x: -138.81464905291796, y: -21.96363354055211 },
  planet: { seed: 3533877330 },
};

beforeAll(() => installCaptureHooks());

function world(candidate: unknown): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress(candidate);
  if (!resolved.ok) throw new Error(resolved.reason);
  return resolved.address;
}

function star(candidate: unknown): CanonicalCF1StarAddress {
  const resolved = resolveCF1StarAddress(candidate);
  if (!resolved.ok) throw new Error(resolved.reason);
  return resolved.address;
}

function system(address: CanonicalCF1StarAddress): SystemNav {
  const resolved = navFromCanonicalCF1Address(address);
  if (!resolved.ok || resolved.state.mode !== 'system') throw new Error('system fixture failed');
  return resolved.state;
}

function surface(address: CanonicalCF1WorldAddress): SurfaceNav {
  const resolved = navFromCanonicalCF1Address(address);
  if (!resolved.ok || resolved.state.mode !== 'surface') throw new Error('surface fixture failed');
  return resolved.state;
}

function engineering(research: readonly unknown[] = []): EngineeringStateV2 {
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: 4,
    worlds: [],
    stars: [],
    research,
  }, createLegacyEngineeringSeedResolver({ worlds: [], stars: [] }));
}

describe('v2 Deep Scanner — orbital Survey presentation', () => {
  it('renders the exact ordinary order plus a separate biome marker without RNG or mutation', () => {
    const address = world(BIOME_VEIN_WORLD);
    const nav = system(star(BIOME_VEIN_WORLD));
    const state = engineering(['scan1']);
    const before = JSON.stringify({ state, nav, address });
    const random = vi.spyOn(Math, 'random');
    const now = vi.spyOn(Date, 'now');

    const first = projectOrbitalMineralSurveyRow({ engineering: state, nav, address });
    const second = projectOrbitalMineralSurveyRow({ engineering: state, nav, address });

    expect(first).toEqual({
      key: 'Mineral veins',
      value: 'Chromium · Iron · Calcium · Aluminium · Magnesium · Promethium ✦',
    });
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(JSON.stringify({ state, nav, address })).toBe(before);
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    random.mockRestore();
    now.mockRestore();
  });

  it('fails closed without owned scan1 or exact registered orbit authority', () => {
    const address = world(BIOME_VEIN_WORLD);
    const nav = system(star(BIOME_VEIN_WORLD));
    const state = engineering(['scan1']);

    expect(projectOrbitalMineralSurveyRow({ engineering: engineering(), nav, address })).toBeNull();
    expect(projectOrbitalMineralSurveyRow({ engineering: state, nav: surface(address), address })).toBeNull();
    expect(projectOrbitalMineralSurveyRow({ engineering: state, nav: system(star(SOL)), address })).toBeNull();
    expect(projectOrbitalMineralSurveyRow({
      engineering: JSON.parse(JSON.stringify(state)) as EngineeringStateV2,
      nav,
      address,
    })).toBeNull();
    expect(projectOrbitalMineralSurveyRow({
      engineering: state,
      nav: { ...nav },
      address,
    })).toBeNull();
    expect(projectOrbitalMineralSurveyRow({
      engineering: state,
      nav,
      address: { ...address } as CanonicalCF1WorldAddress,
    })).toBeNull();
  });

  it('keeps Earth, living worlds, special veins, grades, reserves, progress, and mining out of orbit', () => {
    const state = engineering(['scan1']);
    const earth = world(EARTH);
    const living = world(TIER_14_LIVING_WORLD);
    const high = world(TIER_10_COSMIC_EXCEPTIONAL_WORLD);
    const highOpportunity = projectWorldOpportunity(high);

    expect(projectOrbitalMineralSurveyRow({ engineering: state, nav: system(star(SOL)), address: earth }))
      .toBeNull();
    expect(projectOrbitalMineralSurveyRow({
      engineering: state,
      nav: system(star(TIER_14_LIVING_WORLD)),
      address: living,
    })).toBeNull();
    expect(highOpportunity).toMatchObject({
      deposits: ['P', 'CO2', 'Zn', 'Pb'],
      cosmicVein: 'Voe',
      exceptionalVein: 'P',
      reservePulls: 2_714,
    });
    const row = projectOrbitalMineralSurveyRow({
      engineering: state,
      nav: system(star(TIER_10_COSMIC_EXCEPTIONAL_WORLD)),
      address: high,
    });
    expect(row).toEqual({ key: 'Mineral veins', value: 'Phosphorus · Dry Ice · Zinc · Lead' });
    expect(row?.value).not.toMatch(/Voe|Void Essence|exceptional|Tier|grade|pull|reserve|Mine/u);
    expect(row?.value.match(/Phosphorus/gu)).toHaveLength(1);
    expect(row?.value).not.toContain('✦');
  });
});
