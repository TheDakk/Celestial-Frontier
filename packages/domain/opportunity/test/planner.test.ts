import { describe, expect, it, vi } from 'vitest';
import {
  navFromCanonicalCF1Address,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
  type SurfaceNav,
  type SystemNav,
} from '@cf/scene';
import {
  ENGINEERING_RESEARCH_CATALOGUE,
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  createEngineeringState,
  createLegacyEngineeringSeedResolver,
  encodeEngineeringState,
  isEngineeringActionPlan,
  migrateLegacyEngineeringState,
  planFixedFabrication,
  planResearchPurchase,
  projectWorldMineralReveal,
  projectWorldOpportunity,
  type EngineeringStateV2,
} from '../src/index.js';

const SOL = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 424242, x: 560, y: 170 },
};

const TIER_14_LIVING_WORLD = {
  galaxy: { seed: 1012779741, x: -599.7658047693408, y: -6073.942273357868 },
  star: { seed: 3589953231, x: -138.81464905291796, y: -21.96363354055211 },
  planet: { seed: 3533877330 },
};

const BIOME_VEIN_WORLD = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 3037235558, x: -897.1608293121681, y: -86.20030916528776 },
  planet: { seed: 171668249 },
};

const RAW_TIER_WORLD_FIXTURES = Object.freeze([
  { expectedRawTier: 0, galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3906170621, x: -148.41015493869781, y: -101.48448746139184 }, planet: { seed: 945353644 } },
  { expectedRawTier: 1, galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3906170621, x: -148.41015493869781, y: -101.48448746139184 }, planet: { seed: 2566368282 } },
  { expectedRawTier: 2, galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3906170621, x: -148.41015493869781, y: -101.48448746139184 }, planet: { seed: 1976618830 } },
  { expectedRawTier: 3, galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 2552159536, x: -155.4304008563049, y: -110.68640578491613 }, planet: { seed: 2111361750 } },
  { expectedRawTier: 4, galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 4010450807, x: -49.65674504311755, y: -24.91359581053257 }, planet: { seed: 1339394965 } },
  { expectedRawTier: 5, galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 2732166106, x: -154.71280121896416, y: 32.401062158402056 }, planet: { seed: 101846103 } },
  { expectedRawTier: 6, galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3906170621, x: -148.41015493869781, y: -101.48448746139184 }, planet: { seed: 501525795 } },
  { expectedRawTier: 7, galaxy: { seed: 334683355, x: -353.9256348274648, y: 76.0142870247364 }, star: { seed: 3424050282, x: 20.93190941400826, y: 152.28525090264156 }, planet: { seed: 3500238393 } },
  { expectedRawTier: 8, galaxy: { seed: 4217927457, x: 1221.7045278288424, y: -1174.5391761884093 }, star: { seed: 1659036639, x: -81.62780654523522, y: 17.59287801431492 }, planet: { seed: 1799295138 } },
  { expectedRawTier: 9, galaxy: { seed: 687322852, x: 1903.3002374693751, y: -1027.60314848274 }, star: { seed: 2705956153, x: -145.89387523569167, y: 32.628345876932144 }, planet: { seed: 3685298290 } },
  { expectedRawTier: 10, galaxy: { seed: 121725964, x: -2839.856471773237, y: 3305.7031123898923 }, star: { seed: 4090947280, x: -94.33730058884248, y: -12.052213123999536 }, planet: { seed: 3386214749 } },
  { expectedRawTier: 11, galaxy: { seed: 76716534, x: 3285.340159293264, y: -2484.577433858067 }, star: { seed: 2464948777, x: -95.48481664387509, y: -110.73938757972792 }, planet: { seed: 2593759182 } },
  { expectedRawTier: 12, galaxy: { seed: 1502115353, x: 2673.646874818951, y: 6279.057256598026 }, star: { seed: 2745422516, x: 41.44531502015889, y: 68.61616784986109 }, planet: { seed: 3296700423 } },
  { expectedRawTier: 13, galaxy: { seed: 886004438, x: 4055.9559776447713, y: 5288.8648284599185 }, star: { seed: 3171751942, x: 158.4241830362007, y: 93.03661185130477 }, planet: { seed: 3380914553 } },
  { expectedRawTier: 14, galaxy: { seed: 2575626770, x: 5344.4051948376, y: 12925.356413424015 }, star: { seed: 881246414, x: -31.68546670395881, y: 67.76457142550498 }, planet: { seed: 2926988765 } },
] as const);

function world(candidate: unknown): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress(candidate);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result.address;
}

function star(candidate: unknown): CanonicalCF1StarAddress {
  const result = resolveCF1StarAddress(candidate);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result.address;
}

function surface(address: CanonicalCF1WorldAddress): SurfaceNav {
  const result = navFromCanonicalCF1Address(address);
  expect(result.ok).toBe(true);
  if (!result.ok || result.state.mode !== 'surface') throw new Error('world fixture did not produce SurfaceNav');
  return result.state;
}

function system(address: CanonicalCF1StarAddress): SystemNav {
  const result = navFromCanonicalCF1Address(address);
  expect(result.ok).toBe(true);
  if (!result.ok || result.state.mode !== 'system') throw new Error('star fixture did not produce SystemNav');
  return result.state;
}

function legacySparseState(research: readonly unknown[]): EngineeringStateV2 {
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: 4,
    worlds: [],
    stars: [],
    research,
  }, createLegacyEngineeringSeedResolver({ worlds: [], stars: [] }));
}

describe('@cf/domain-opportunity — canonical world mining planner', () => {
  it('pins exact canonical fixtures for every unfolded raw tier 0 through 14', () => {
    expect(RAW_TIER_WORLD_FIXTURES.map((fixture) => {
      const { expectedRawTier, ...candidate } = fixture;
      const address = world(candidate);
      const opportunity = projectWorldOpportunity(address, null);
      return { expectedRawTier, actualRawTier: opportunity.rawTier, sourceKey: opportunity.key };
    })).toEqual(RAW_TIER_WORLD_FIXTURES.map(({ expectedRawTier }) => ({
      expectedRawTier,
      actualRawTier: expectedRawTier,
      sourceKey: expect.stringMatching(/^CF1\|/),
    })));
  });

});

describe('@cf/domain-opportunity — Deep Scanners reveal without mining authority', () => {
  it('rejects cloned authorities and mismatched orbit or ground locations', () => {
    const address = world(BIOME_VEIN_WORLD);
    const opportunity = projectWorldOpportunity(address, null);
    const orbit = system(star({
      galaxy: BIOME_VEIN_WORLD.galaxy,
      star: BIOME_VEIN_WORLD.star,
    }));
    const state = legacySparseState(['scan1']);
    expect(() => projectWorldMineralReveal({
      state: JSON.parse(encodeEngineeringState(state)) as EngineeringStateV2,
      opportunity,
      currentNav: orbit,
    })).toThrow(/registered EngineeringState authority/);
    expect(() => projectWorldMineralReveal({
      state,
      opportunity: { ...opportunity },
      currentNav: orbit,
    })).toThrow(/registered world opportunity snapshot/);
    expect(projectWorldMineralReveal({
      state,
      opportunity,
      currentNav: { ...orbit },
    })).toEqual({ status: 'refused', reason: 'current-location-unproven' });

    const solOrbit = system(star(SOL));
    expect(projectWorldMineralReveal({ state, opportunity, currentNav: solOrbit }))
      .toEqual({ status: 'refused', reason: 'current-system-mismatch' });
    const earth = world({ ...SOL, planet: { seed: 133 } });
    expect(projectWorldMineralReveal({ state, opportunity, currentNav: surface(earth) }))
      .toEqual({ status: 'refused', reason: 'current-world-mismatch' });

    let modeReads = 0;
    const hostileNav = {};
    Object.defineProperty(hostileNav, 'mode', {
      enumerable: true,
      get() {
        modeReads += 1;
        return 'system';
      },
    });
    expect(projectWorldMineralReveal({
      state,
      opportunity,
      currentNav: hostileNav as unknown as SystemNav,
    })).toEqual({ status: 'refused', reason: 'current-location-unproven' });
    expect(modeReads).toBe(0);
  });

  it('keeps the legacy mineral read model exclusive to proven lifeless non-Earth worlds', () => {
    const lifeless = world(BIOME_VEIN_WORLD);
    const lifelessOpportunity = projectWorldOpportunity(lifeless, null);
    const scannedState = legacySparseState(['scan1']);
    expect(lifelessOpportunity.source.biosphereKey).toBe('none');
    expect(projectWorldMineralReveal({
      state: scannedState,
      opportunity: lifelessOpportunity,
      currentNav: surface(lifeless),
    })).toMatchObject({ status: 'projected', revealLevel: 'grounded' });
    expect(projectWorldMineralReveal({
      state: scannedState,
      opportunity: lifelessOpportunity,
      currentNav: system(star({
        galaxy: BIOME_VEIN_WORLD.galaxy,
        star: BIOME_VEIN_WORLD.star,
      })),
    })).toMatchObject({ status: 'projected', revealLevel: 'orbit' });

    const living = world(TIER_14_LIVING_WORLD);
    const livingOpportunity = projectWorldOpportunity(living, null);
    expect(livingOpportunity.source.biosphereKey).not.toBe('none');
    expect(projectWorldMineralReveal({
      state: scannedState,
      opportunity: livingOpportunity,
      currentNav: surface(living),
    })).toEqual({ status: 'refused', reason: 'biosphere-present' });
    expect(projectWorldMineralReveal({
      state: scannedState,
      opportunity: livingOpportunity,
      currentNav: system(star({
        galaxy: TIER_14_LIVING_WORLD.galaxy,
        star: TIER_14_LIVING_WORLD.star,
      })),
    })).toEqual({ status: 'refused', reason: 'biosphere-present' });

    const earth = world({ ...SOL, planet: { seed: 133 } });
    const earthOpportunity = projectWorldOpportunity(earth, null);
    expect(projectWorldMineralReveal({
      state: scannedState,
      opportunity: earthOpportunity,
      currentNav: surface(earth),
    })).toEqual({ status: 'refused', reason: 'earth-protected' });
    expect(projectWorldMineralReveal({
      state: scannedState,
      opportunity: earthOpportunity,
      currentNav: system(star(SOL)),
    })).toEqual({ status: 'refused', reason: 'earth-protected' });
  });
});

describe('@cf/domain-opportunity — exact research and fixed fabrication plans', () => {
  it('makes all six implemented research consumers available in the inspectable catalogue', () => {
    expect(ENGINEERING_RESEARCH_CATALOGUE.map((entry) => ({
      id: entry.id,
      materialCost: entry.materialCost,
      stardustCost: entry.stardustCost,
      prerequisiteId: entry.prerequisiteId,
      jumpDriveRequired: entry.jumpDriveRequired,
      consumerStatus: entry.consumerStatus,
    }))).toEqual([
      { id: 'scan1', materialCost: { Fe: 6, Si: 4 }, stardustCost: 20, prerequisiteId: null, jumpDriveRequired: true, consumerStatus: 'available' },
      { id: 'hull1', materialCost: { Ti: 5, Fe: 8 }, stardustCost: 40, prerequisiteId: null, jumpDriveRequired: false, consumerStatus: 'available' },
      { id: 'lab1', materialCost: { C: 6, P: 3, H2O: 4 }, stardustCost: 60, prerequisiteId: null, jumpDriveRequired: false, consumerStatus: 'available' },
      { id: 'drive1', materialCost: { H: 8, He3: 2, Fe: 4 }, stardustCost: 40, prerequisiteId: null, jumpDriveRequired: false, consumerStatus: 'available' },
      { id: 'drive2', materialCost: { He3: 6, Pt: 2, U: 2 }, stardustCost: 120, prerequisiteId: 'drive1', jumpDriveRequired: false, consumerStatus: 'available' },
      { id: 'drive3', materialCost: { Pz: 1, Ir: 3, U: 4 }, stardustCost: 300, prerequisiteId: 'drive2', jumpDriveRequired: false, consumerStatus: 'available' },
    ]);
  });

  it('plans exact receipt-bound Deep Scanners consumption and preserves a sparse veteran subset', () => {
    const sparse = legacySparseState(['drive2']);
    const input = {
      state: sparse,
      researchId: 'scan1' as const,
      jumpDriveOwned: true,
      assets: { materials: { Fe: 6, Si: 4 }, stardust: 20 },
      receiptOrdinal: 31,
    };
    const beforeState = encodeEngineeringState(sparse);
    const beforeAssets = JSON.stringify(input.assets);
    const plan = planResearchPurchase(input);
    expect(plan.status).toBe('planned');
    if (plan.status !== 'planned') return;
    expect(plan).toMatchObject({
      operation: 'purchase-research',
      receiptOrdinal: 31,
      previousRevision: 4,
      nextRevision: 5,
      result: {
        researchId: 'scan1',
        quote: {
          id: 'scan1',
          owned: false,
          jumpDriveOwned: true,
          prerequisiteId: null,
          missingPrerequisiteId: null,
          missingMaterials: [],
          missingStardust: 0,
          consumerStatus: 'available',
        },
        consume: {
          materials: [{ id: 'Fe', quantity: 6 }, { id: 'Si', quantity: 4 }],
          stardust: 20,
        },
      },
    });
    expect(plan.nextState.research).toEqual(['scan1', 'drive2']);
    expect(encodeEngineeringState(plan.nextState)).toContain('"revision":5');
    expect(isEngineeringActionPlan(plan)).toBe(true);
    expect(plan.witness).toContain('research:scan1');
    expect(plan.witness).toContain('"jumpDriveOwned":true');
    expect(plan.witness.length).toBeLessThanOrEqual(4_096);
    expect(encodeEngineeringState(sparse)).toBe(beforeState);
    expect(JSON.stringify(input.assets)).toBe(beforeAssets);

    const same = planResearchPurchase(input);
    expect(same).toEqual(plan);
    const replay = planResearchPurchase({ ...input, state: plan.nextState, receiptOrdinal: 32 });
    expect(replay).toMatchObject({
      status: 'refused',
      reason: 'already-owned',
      quote: { owned: true, consumerStatus: 'available' },
    });
    expect(encodeEngineeringState(plan.nextState)).toContain('"research":["scan1","drive2"]');
  });

  it('keeps owned, prerequisite, and asset refusals exact while planning the complete ladder', () => {
    expect(() => planResearchPurchase({
      state: JSON.parse(encodeEngineeringState(createEngineeringState())) as EngineeringStateV2,
      researchId: 'scan1',
      jumpDriveOwned: true,
      assets: { materials: { Fe: 6, Si: 4 }, stardust: 20 },
      receiptOrdinal: 0,
    })).toThrow(/registered EngineeringState authority/);

    const owned = planResearchPurchase({
      state: legacySparseState(['scan1']),
      researchId: 'scan1',
      jumpDriveOwned: false,
      assets: { materials: { Fe: 6, Si: 4 }, stardust: 20 },
      receiptOrdinal: 1,
    });
    expect(owned).toMatchObject({
      status: 'refused', reason: 'already-owned', quote: { owned: true, jumpDriveOwned: false },
    });

    const progressionLockedState = createEngineeringState();
    const progressionLockedBefore = encodeEngineeringState(progressionLockedState);
    const progressionLocked = planResearchPurchase({
      state: progressionLockedState,
      researchId: 'scan1',
      jumpDriveOwned: false,
      assets: { materials: { Fe: 6, Si: 4 }, stardust: 20 },
      receiptOrdinal: 2,
    });
    expect(progressionLocked).toMatchObject({
      status: 'refused',
      reason: 'progression-locked',
      quote: {
        id: 'scan1',
        owned: false,
        jumpDriveOwned: false,
        prerequisiteId: null,
        missingPrerequisiteId: null,
        missingMaterials: [],
        missingStardust: 0,
        consumerStatus: 'available',
      },
    });
    expect(encodeEngineeringState(progressionLockedState)).toBe(progressionLockedBefore);

    const prerequisite = planResearchPurchase({
      state: createEngineeringState(),
      researchId: 'drive2',
      jumpDriveOwned: true,
      assets: { materials: { He3: 6, Pt: 2, U: 2 }, stardust: 120 },
      receiptOrdinal: 2,
    });
    expect(prerequisite).toMatchObject({
      status: 'refused',
      reason: 'prerequisite-missing',
      quote: { missingPrerequisiteId: 'drive1', consumerStatus: 'available' },
    });

    const insufficient = planResearchPurchase({
      state: createEngineeringState(),
      researchId: 'scan1',
      jumpDriveOwned: true,
      assets: { materials: { Fe: 2 }, stardust: 7 },
      receiptOrdinal: 3,
    });
    expect(insufficient).toMatchObject({
      status: 'refused',
      reason: 'insufficient-assets',
      quote: {
        missingMaterials: [
          { id: 'Fe', required: 6, available: 2, missing: 4 },
          { id: 'Si', required: 4, available: 0, missing: 4 },
        ],
        missingStardust: 13,
        consumerStatus: 'available',
      },
    });

    const sparse = legacySparseState(['drive2']);
    const finalDrive = planResearchPurchase({
      state: sparse,
      researchId: 'drive3',
      jumpDriveOwned: true,
      assets: { materials: { Pz: 1, Ir: 3, U: 4 }, stardust: 300 },
      receiptOrdinal: 4,
    });
    expect(finalDrive).toMatchObject({
      status: 'planned',
      result: {
        researchId: 'drive3',
        quote: { missingPrerequisiteId: null, missingMaterials: [], missingStardust: 0 },
        consume: {
          materials: [
            { id: 'Ir', quantity: 3 },
            { id: 'Pz', quantity: 1 },
            { id: 'U', quantity: 4 },
          ],
          stardust: 300,
        },
      },
    });
    if (finalDrive.status === 'planned') expect(finalDrive.nextState.research).toEqual(['drive2', 'drive3']);
    expect(encodeEngineeringState(sparse)).toContain('"research":["drive2"]');
  });

  it('rejects hostile research authority without invoking accessors or toJSON', () => {
    const state = createEngineeringState();
    const materials = { Fe: 6, Si: 4 };
    const assets = { materials, stardust: 20 };
    const input = {
      state,
      researchId: 'scan1' as const,
      jumpDriveOwned: true,
      assets,
      receiptOrdinal: 5,
    };
    const reject = (value: unknown, diagnosis: RegExp) => expect(() => planResearchPurchase(
      value as Parameters<typeof planResearchPurchase>[0],
    )).toThrow(diagnosis);

    let inputGetterReads = 0;
    const accessorInput: Record<string, unknown> = {
      researchId: 'scan1', jumpDriveOwned: true, assets, receiptOrdinal: 5,
    };
    Object.defineProperty(accessorInput, 'state', {
      enumerable: true,
      get() {
        inputGetterReads += 1;
        return state;
      },
    });
    reject(accessorInput, /state must be an enumerable data property/);
    expect(inputGetterReads).toBe(0);

    let assetGetterReads = 0;
    const accessorAssets: Record<string, unknown> = { materials };
    Object.defineProperty(accessorAssets, 'stardust', {
      enumerable: true,
      get() {
        assetGetterReads += 1;
        return 20;
      },
    });
    reject({ ...input, assets: accessorAssets }, /stardust must be an enumerable data property/);
    expect(assetGetterReads).toBe(0);

    let materialGetterReads = 0;
    const accessorMaterials: Record<string, unknown> = { Si: 4 };
    Object.defineProperty(accessorMaterials, 'Fe', {
      enumerable: true,
      get() {
        materialGetterReads += 1;
        return 6;
      },
    });
    reject(
      { ...input, assets: { materials: accessorMaterials, stardust: 20 } },
      /Fe must be an enumerable data property/,
    );
    expect(materialGetterReads).toBe(0);

    const toJSON = vi.fn(() => ({ materials, stardust: 20 }));
    reject({ ...input, assets: { materials, stardust: 20, toJSON } }, /unknown or missing fields/);
    expect(toJSON).not.toHaveBeenCalled();

    const nonEnumerableAssets: Record<string, unknown> = { materials };
    Object.defineProperty(nonEnumerableAssets, 'stardust', {
      enumerable: false,
      value: 20,
    });
    reject({ ...input, assets: nonEnumerableAssets }, /stardust must be an enumerable data property/);

    for (const jumpDriveOwned of [0, 1, 'true', null, new Boolean(true)]) {
      reject({ ...input, jumpDriveOwned }, /Jump Drive ownership must be an exact boolean/);
    }

    reject({
      ...input,
      assets: { materials: { ...materials, [Symbol('forged')]: 1 }, stardust: 20 },
    }, /symbol key/);
    reject({
      ...input,
      assets: Object.assign(Object.create({ forged: true }), { materials, stardust: 20 }),
    }, /exact plain data object/);
  });

  it('binds each research receipt factor without ambient RNG or clock reads', () => {
    const random = vi.spyOn(Math, 'random');
    const now = vi.spyOn(Date, 'now');
    const base = {
      state: createEngineeringState(),
      researchId: 'scan1' as const,
      jumpDriveOwned: true,
      assets: { materials: { Fe: 6, Si: 4 }, stardust: 20 },
      receiptOrdinal: 11,
    };
    const planned = planResearchPurchase(base);
    const receiptChanged = planResearchPurchase({ ...base, receiptOrdinal: 12 });
    const assetsChanged = planResearchPurchase({
      ...base,
      assets: { materials: { Fe: 7, Si: 4 }, stardust: 20 },
    });
    expect(planned.status).toBe('planned');
    expect(receiptChanged.status).toBe('planned');
    expect(assetsChanged.status).toBe('planned');
    if (planned.status !== 'planned'
      || receiptChanged.status !== 'planned'
      || assetsChanged.status !== 'planned') return;
    expect(receiptChanged.witness).not.toBe(planned.witness);
    expect(assetsChanged.witness).not.toBe(planned.witness);
    expect(receiptChanged.result).toEqual(planned.result);
    expect(assetsChanged.result).toEqual(planned.result);
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    random.mockRestore();
    now.mockRestore();
  });

  it('plans fully exceptional exact gear and leaves mixed-spend fixed gear ordinary', () => {
    const common = {
      state: createEngineeringState(),
      baseId: 'meteor',
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 33,
    };
    const exceptional = planFixedFabrication({
      ...common,
      assets: {
        materials: { Ni: 2, C: 1 },
        exceptionalMaterials: { Ni: 2, C: 1 },
        itemCounts: {}, stardust: 0, signatureIds: [],
      },
    });
    expect(exceptional.status).toBe('planned');
    if (exceptional.status !== 'planned') return;
    expect(exceptional.result.arc2.consume).toEqual({
      materials: [{ id: 'C', quantity: 1 }, { id: 'Ni', quantity: 2 }],
      exceptionalMaterials: [{ id: 'C', quantity: 1 }, { id: 'Ni', quantity: 2 }],
      itemCounts: [],
      stardust: 0,
    });
    expect(exceptional.result.arc2.gearGenerationPlan).toMatchObject({
      baseId: 'meteor', naturalAffixes: [], drawback: null,
      craftedModifier: { affixId: expect.stringMatching(/^exceptional-v1:/) },
    });
    expect(planFixedFabrication({
      ...common,
      assets: {
        materials: { Ni: 2, C: 1 },
        exceptionalMaterials: { Ni: 2, C: 1 },
        itemCounts: {}, stardust: 0, signatureIds: [],
      },
    })).toEqual(exceptional);

    const ordinaryInput = {
      ...common,
      assets: {
        materials: { Ni: 2, C: 1 },
        exceptionalMaterials: { Ni: 1 },
        itemCounts: {}, stardust: 0, signatureIds: [],
      },
    };
    const localeCompare = vi.spyOn(String.prototype, 'localeCompare')
      .mockImplementation(() => { throw new Error('ambient locale collation consulted'); });
    let ordinary: ReturnType<typeof planFixedFabrication>;
    let replay: ReturnType<typeof planFixedFabrication>;
    try {
      ordinary = planFixedFabrication(ordinaryInput);
      replay = planFixedFabrication(ordinaryInput);
    } finally {
      localeCompare.mockRestore();
    }
    expect(ordinary).toEqual(replay);
    expect(ordinary.status).toBe('planned');
    if (ordinary.status !== 'planned') return;
    expect(ordinary.result.arc2.consume).toEqual({
      materials: [{ id: 'C', quantity: 1 }, { id: 'Ni', quantity: 2 }],
      exceptionalMaterials: [{ id: 'Ni', quantity: 1 }],
      itemCounts: [],
      stardust: 0,
    });
    expect(ordinary.result.arc2.gearGenerationPlan).toMatchObject({
      baseId: 'meteor', naturalAffixes: [], craftedModifier: null, drawback: null,
    });
    expect(ordinary.result.arc2.gearGenerationPlan?.generationSeed)
      .toBe(exceptional.result.arc2.gearGenerationPlan?.generationSeed);
    expect(ordinary.nextRevision).toBe(1);
    expect(Object.isFrozen(ordinary.result.arc2)).toBe(true);
    expect(() => planFixedFabrication({
      ...ordinaryInput,
      assets: { ...ordinaryInput.assets, exceptionalMaterials: { Ni: 3 } },
    })).toThrow(/exceeds total material/);
    expect(planFixedFabrication({
      ...common,
      baseId: 'plate',
      assets: {
        materials: { Fe: 4 }, exceptionalMaterials: {}, itemCounts: { plate: 999 },
        stardust: 0, signatureIds: [],
      },
    })).toMatchObject({ status: 'refused', reason: 'output-count-exhausted' });
  });
});
