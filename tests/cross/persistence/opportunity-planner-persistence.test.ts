import { describe, expect, it, vi } from 'vitest';
import {
  prepareArc2LootLegacyMigration,
  readArc2EngineeringLoadout,
} from '@cf/persistence';
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
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  createEngineeringState,
  createLegacyEngineeringSeedResolver,
  isEngineeringActionPlan,
  isWorldMineralRevealProjection,
  migrateLegacyEngineeringState,
  planFixedFabrication,
  planStellarSkim,
  planWorldMining,
  projectStarOpportunity,
  projectWorldMineralReveal,
  projectWorldOpportunity,
  type EngineeringStateV2,
} from '@cf/domain-opportunity';

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

const TIER_10_COSMIC_EXCEPTIONAL_WORLD = {
  galaxy: { seed: 2775120088, x: -15585.946043489894, y: -13862.482918268226 },
  star: { seed: 510510541, x: -550.8509466005489, y: -8.055439678020775 },
  planet: { seed: 3303620273 },
};

const RING_CAPPED_WORLD = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 3_220_308_100, x: 299.8301136358641, y: 263.69488157099113 },
  planet: { seed: 3_327_023_009 },
};

const REMNANT_STAR = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 3363971653, x: -386.2348864697851, y: 453.95830733468756 },
};

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

type LegacyLootAuthority = Parameters<typeof prepareArc2LootLegacyMigration>[0]['legacy'];

function persistedCapabilities(legacy: LegacyLootAuthority) {
  const prepared = prepareArc2LootLegacyMigration({ extensions: {}, legacy, capacity: 8 });
  expect(prepared.kind).toBe('prepared');
  if (prepared.kind !== 'prepared') throw new Error(`Arc 2 fixture was ${prepared.kind}`);
  const read = readArc2EngineeringLoadout(prepared.extensions);
  expect(read.kind).toBe('loaded');
  if (read.kind !== 'loaded') throw new Error(`Arc 2 capability bridge was ${read.kind}`);
  return read.capabilities;
}

const emptyCapabilities = () => persistedCapabilities({ items: [], equip: {}, equipAff: {} });
const systemCapabilities = (...baseIds: string[]) => persistedCapabilities({
  items: baseIds.map((baseId): [string, number] => [baseId, 1]),
  equip: {},
  equipAff: {},
});

function equippedMiningCapabilities() {
  return persistedCapabilities({
    items: [['rig3', 1], ['headlamp', 1], ['autoext', 1]],
    equip: { tool: 'rig3', helmet: 'headlamp' },
    equipAff: { tool: { k: 'yield', v: 0.25, forId: 'rig3' } },
  });
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

function stateAfterWorldExtractions(
  address: CanonicalCF1WorldAddress,
  extractionsTaken: number,
): EngineeringStateV2 {
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: 0,
    worlds: [{ seed: address.planet.seed, extractionsTaken }],
    stars: [],
    research: [],
  }, createLegacyEngineeringSeedResolver({ worlds: [address], stars: [] }));
}

describe('@cf/domain-opportunity — canonical world mining planner', () => {
  it('pins the exact E1F pull and binds capability factors to the canonical witness', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const opportunity = projectWorldOpportunity(mars, null);
    const plain = planWorldMining({
      state: createEngineeringState(),
      opportunity,
      currentSurface: surface(mars),
      capabilities: emptyCapabilities(),
      activePlay: { activePlayMs: 1_000 },
      receiptOrdinal: 3,
    });
    expect(plain.status).toBe('planned');
    if (plain.status !== 'planned') return;
    expect(plain.result).toMatchObject({
      sourceKey: mars.key,
      rawTier: 0,
      effectiveTier: 0,
      reservePulls: 570,
      firstExtractionIndex: 1,
      loads: 1,
      materials: [{ id: 'Ca', quantity: 2 }, { id: 'Cl', quantity: 3 }],
      exceptionalMaterials: [],
      richStrikes: 0,
      cosmicFinds: 0,
      exceptionalFinds: 0,
      extractionsTaken: 1,
      pullsRemaining: 569,
      firstMine: true,
      minedOut: false,
    });
    expect(plain.result.autoExtractor).toEqual({
      online: false,
      initialized: false,
      priorCollectedThroughActivePlayMs: null,
      nextCollectedThroughActivePlayMs: null,
      matured: 0,
      due: 0,
      discardedByBatchCap: 0,
      discardedByReserve: 0,
      capped: false,
      grantedLoads: 0,
    });
    expect(plain.nextState.worlds[0]).toMatchObject({
      key: mars.key,
      extractionsTaken: 1,
      autoExtractorCursor: null,
    });
    expect(plain.nextRevision).toBe(1);
    expect(plain.witness).toContain(mars.key);
    expect(plain.witness.length).toBeLessThanOrEqual(4_096);
    expect(isEngineeringActionPlan(plain)).toBe(true);
    expect(isEngineeringActionPlan({ ...plain })).toBe(false);

    const equipped = planWorldMining({
      state: createEngineeringState(), opportunity, currentSurface: surface(mars),
      capabilities: equippedMiningCapabilities(), activePlay: { activePlayMs: 1_000 }, receiptOrdinal: 3,
    });
    expect(equipped.status).toBe('planned');
    if (equipped.status !== 'planned') return;
    expect(equipped.result.materials).not.toEqual(plain.result.materials);
    expect(equipped.witness).not.toBe(plain.witness);
  });

  it('uses one ring-capped tier for deposits, reserves, haul quantity, rich strikes, and grades', () => {
    const address = world(RING_CAPPED_WORLD);
    const opportunity = projectWorldOpportunity(address, null);
    expect(opportunity).toMatchObject({
      rawTier: expect.any(Number),
      effectiveTier: 5,
      deposits: ['CH4', 'He3', 'NH3', 'Au'],
    });
    expect(opportunity.rawTier).toBeGreaterThan(opportunity.effectiveTier);

    const planned = planWorldMining({
      state: createEngineeringState(),
      opportunity,
      currentSurface: surface(address),
      capabilities: emptyCapabilities(),
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 17,
    });
    expect(planned.status).toBe('planned');
    if (planned.status !== 'planned') return;
    expect(planned.result).toMatchObject({
      rawTier: opportunity.rawTier,
      effectiveTier: 5,
      reservePulls: 1_579,
      materials: [
        { id: 'Au', quantity: 3 },
        { id: 'CH4', quantity: 2 },
        { id: 'U', quantity: 1 },
      ],
      richStrikes: 1,
      traceFingerprint: 'mine-trace-v1:36:d09edabf',
    });
    expect(planned.witness).toContain('"effectiveTier":5');

    const grounded = projectWorldMineralReveal({
      state: createEngineeringState(),
      opportunity,
      currentNav: surface(address),
    });
    expect(grounded).toMatchObject({
      status: 'projected',
      resolvedGrades: [
        { materialId: 'CH4', tier: 1, kind: 'ordinary' },
        { materialId: 'He3', tier: 1, kind: 'ordinary' },
        { materialId: 'NH3', tier: 1, kind: 'ordinary' },
        { materialId: 'Au', tier: 2, kind: 'ordinary' },
      ],
    });
  });

  it('pins positive biome, rich-strike, cosmic, and exceptional planner outputs', () => {
    const biomeAddress = world(BIOME_VEIN_WORLD);
    const biomeOpportunity = projectWorldOpportunity(biomeAddress, null);
    const highAddress = world(TIER_10_COSMIC_EXCEPTIONAL_WORLD);
    const highOpportunity = projectWorldOpportunity(highAddress, null);
    const run = (
      address: CanonicalCF1WorldAddress,
      opportunity: ReturnType<typeof projectWorldOpportunity>,
      priorExtractions: number,
    ) => planWorldMining({
      state: stateAfterWorldExtractions(address, priorExtractions),
      opportunity,
      currentSurface: surface(address),
      capabilities: emptyCapabilities(),
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: priorExtractions,
    });

    const biome = run(biomeAddress, biomeOpportunity, 0);
    expect(biome.status).toBe('planned');
    if (biome.status !== 'planned') return;
    expect(biome.result).toMatchObject({
      firstExtractionIndex: 1,
      materials: [
        { id: 'Al', quantity: 1 }, { id: 'Fe', quantity: 3 }, { id: 'Pm', quantity: 1 },
      ],
      richStrikes: 0,
      traceFingerprint: 'mine-trace-v1:37:5910c75b',
    });

    const rich = run(biomeAddress, biomeOpportunity, 24);
    expect(rich.status).toBe('planned');
    if (rich.status !== 'planned') return;
    expect(rich.result).toMatchObject({
      firstExtractionIndex: 25,
      materials: [
        { id: 'Cr', quantity: 3 }, { id: 'Mg', quantity: 3 }, { id: 'Pm', quantity: 2 },
      ],
      richStrikes: 1,
      traceFingerprint: 'mine-trace-v1:48:70ea83da',
    });

    const exceptional = run(highAddress, highOpportunity, 9);
    expect(exceptional.status).toBe('planned');
    if (exceptional.status !== 'planned') return;
    expect(exceptional.result).toMatchObject({
      firstExtractionIndex: 10,
      materials: [{ id: 'P', quantity: 6 }, { id: 'Pb', quantity: 5 }],
      exceptionalMaterials: [{ id: 'P', quantity: 1 }],
      exceptionalFinds: 1,
      traceFingerprint: 'mine-trace-v1:42:e858c714',
    });

    const cosmic = run(highAddress, highOpportunity, 18);
    expect(cosmic.status).toBe('planned');
    if (cosmic.status !== 'planned') return;
    expect(cosmic.result).toMatchObject({
      firstExtractionIndex: 19,
      materials: [
        { id: 'Pb', quantity: 5 }, { id: 'Voe', quantity: 1 }, { id: 'Zn', quantity: 5 },
      ],
      cosmicFinds: 1,
      traceFingerprint: 'mine-trace-v1:40:68b702c7',
    });
  });

  it('computes capped Auto-Extractor settlement internally and ignores a forged settlement lookalike', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const opportunity = projectWorldOpportunity(mars, null);
    const capabilities = systemCapabilities('autoext');
    const first = planWorldMining({
      state: createEngineeringState(), opportunity, currentSurface: surface(mars), capabilities,
      activePlay: { activePlayMs: 1_000 }, receiptOrdinal: 8,
    });
    expect(first.status).toBe('planned');
    if (first.status !== 'planned') return;
    expect(first.result.autoExtractor).toMatchObject({ initialized: true, due: 0, grantedLoads: 0 });
    expect(first.nextState.worlds[0]!.autoExtractorCursor?.collectedThroughActivePlayMs).toBe(1_000);

    const activePlayMs = 1_000 + 31 * 600_000;
    const ordinaryInput = {
      state: first.nextState, opportunity, currentSurface: surface(mars), capabilities,
      activePlay: { activePlayMs }, receiptOrdinal: 9,
    };
    const settled = planWorldMining(ordinaryInput);
    const forged = planWorldMining({
      ...ordinaryInput,
      settlement: { due: 9_999, next: { collectedThroughActivePlayMs: 0 } },
    } as typeof ordinaryInput);
    expect(settled.status).toBe('planned');
    expect(forged).toEqual(settled);
    if (settled.status !== 'planned') return;
    expect(settled.result.loads).toBe(31);
    expect(settled.result.autoExtractor).toEqual({
      online: true,
      initialized: false,
      priorCollectedThroughActivePlayMs: 1_000,
      nextCollectedThroughActivePlayMs: activePlayMs,
      matured: 31,
      due: 30,
      discardedByBatchCap: 1,
      discardedByReserve: 0,
      capped: true,
      grantedLoads: 30,
    });
    expect(settled.result.extractionsTaken).toBe(32);

    const sameSnapshot = planWorldMining({
      ...ordinaryInput,
      state: settled.nextState,
      receiptOrdinal: 10,
    });
    expect(sameSnapshot.status).toBe('planned');
    if (sameSnapshot.status === 'planned') {
      expect(sameSnapshot.result.autoExtractor).toMatchObject({
        matured: 0, due: 0, grantedLoads: 0,
        priorCollectedThroughActivePlayMs: activePlayMs,
        nextCollectedThroughActivePlayMs: activePlayMs,
      });
      expect(sameSnapshot.result.loads).toBe(1);
    }

    expect(() => planWorldMining({
      ...ordinaryInput,
      state: first.nextState,
      activePlay: { activePlayMs: 999 },
    })).toThrow(/active-play cursor is ahead of the current authority/i);
  });

  it('preserves Auto-Extractor remainders and discards matured loads beyond finite reserves', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const opportunity = projectWorldOpportunity(mars, null);
    const capabilities = systemCapabilities('autoext');
    const anchored = planWorldMining({
      state: createEngineeringState(), opportunity, currentSurface: surface(mars), capabilities,
      activePlay: { activePlayMs: 1_000 }, receiptOrdinal: 0,
    });
    expect(anchored.status).toBe('planned');
    if (anchored.status !== 'planned') return;

    const withRemainder = planWorldMining({
      state: anchored.nextState, opportunity, currentSurface: surface(mars), capabilities,
      activePlay: { activePlayMs: 651_001 }, receiptOrdinal: 1,
    });
    expect(withRemainder.status).toBe('planned');
    if (withRemainder.status !== 'planned') return;
    expect(withRemainder.result.autoExtractor).toMatchObject({
      matured: 1,
      due: 1,
      grantedLoads: 1,
      nextCollectedThroughActivePlayMs: 601_000,
    });
    const remainderReplay = planWorldMining({
      state: withRemainder.nextState, opportunity, currentSurface: surface(mars), capabilities,
      activePlay: { activePlayMs: 1_201_000 }, receiptOrdinal: 2,
    });
    expect(remainderReplay.status).toBe('planned');
    if (remainderReplay.status === 'planned') {
      expect(remainderReplay.result.autoExtractor).toMatchObject({
        priorCollectedThroughActivePlayMs: 601_000,
        matured: 1,
        due: 1,
        grantedLoads: 1,
        nextCollectedThroughActivePlayMs: 1_201_000,
      });
    }

    const almostSpent = stateAfterWorldExtractions(mars, opportunity.reservePulls - 1);
    const installed = planFixedFabrication({
      state: almostSpent,
      baseId: 'autoext',
      assets: {
        materials: {}, exceptionalMaterials: {},
        itemCounts: { servo: 2, navcore: 1, cell: 1 },
        stardust: 40, signatureIds: [],
      },
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 3,
    });
    expect(installed.status).toBe('planned');
    if (installed.status !== 'planned') return;
    const exhausted = planWorldMining({
      state: installed.nextState, opportunity, currentSurface: surface(mars), capabilities,
      activePlay: { activePlayMs: 1_800_000 }, receiptOrdinal: 4,
    });
    expect(exhausted.status).toBe('planned');
    if (exhausted.status === 'planned') {
      expect(exhausted.result.autoExtractor).toMatchObject({
        matured: 3, due: 3, grantedLoads: 0, discardedByReserve: 3,
      });
      expect(exhausted.result).toMatchObject({ loads: 1, minedOut: true, pullsRemaining: 0 });
    }
  });

  it('fails closed on cloned authority, wrong surfaces, Earth, living worlds, and raw tier 14', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const biomeWorld = world(BIOME_VEIN_WORLD);
    const tier14 = world(TIER_14_LIVING_WORLD);
    const earth = world({ ...SOL, planet: { seed: 133 } });
    const base = {
      state: createEngineeringState(),
      opportunity: projectWorldOpportunity(mars, null),
      currentSurface: surface(mars),
      capabilities: emptyCapabilities(),
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 0,
    };
    expect(() => planWorldMining({ ...base, state: { ...base.state } as EngineeringStateV2 }))
      .toThrow(/registered EngineeringState/);
    expect(() => planWorldMining({ ...base, opportunity: { ...base.opportunity } }))
      .toThrow(/registered world opportunity/);
    expect(() => planWorldMining({ ...base, capabilities: { ...base.capabilities } }))
      .toThrow(/registered equipment/);
    expect(planWorldMining({ ...base, currentSurface: { ...base.currentSurface } as SurfaceNav }))
      .toEqual({ status: 'refused', reason: 'current-surface-unproven' });
    expect(planWorldMining({ ...base, currentSurface: surface(biomeWorld) }))
      .toEqual({ status: 'refused', reason: 'current-world-mismatch' });
    expect(planWorldMining({
      ...base, opportunity: projectWorldOpportunity(earth, null), currentSurface: surface(earth),
    })).toEqual({ status: 'refused', reason: 'earth-protected' });
    const tier14Opportunity = projectWorldOpportunity(tier14, null);
    expect(tier14Opportunity.rawTier).toBe(14);
    expect(planWorldMining({
      ...base, opportunity: tier14Opportunity, currentSurface: surface(tier14),
    })).toEqual({ status: 'refused', reason: 'biosphere-present' });

    /* Two legitimate sources remain distinct by complete key. The planner
       cannot reuse Mars authority merely because another current surface is
       shape-compatible or happens to sit under a known parent. */
    const marsPlan = planWorldMining(base);
    expect(marsPlan.status).toBe('planned');
    if (marsPlan.status !== 'planned') return;
    const biomePlan = planWorldMining({
      ...base,
      state: marsPlan.nextState,
      opportunity: projectWorldOpportunity(biomeWorld, null),
      currentSurface: surface(biomeWorld),
      receiptOrdinal: 1,
    });
    expect(biomePlan.status).toBe('planned');
    if (biomePlan.status === 'planned') {
      expect(biomePlan.result.sourceKey).toBe(biomeWorld.key);
      expect(biomePlan.nextState.worlds.map(({ key }) => key).sort()).toEqual(
        [mars.key, biomeWorld.key].sort(),
      );
    }
  });
});

describe('@cf/domain-opportunity — canonical stellar skimming planner', () => {
  it('requires the actual Jump Drive system and pins the Sol deterministic pass', () => {
    const sol = star(SOL);
    const opportunity = projectStarOpportunity(sol);
    const veteranDriveResearch = legacySparseState(['drive3']);
    expect(planStellarSkim({
      state: veteranDriveResearch,
      opportunity,
      currentSystem: system(sol),
      capabilities: emptyCapabilities(),
      playerHp: 12,
      activePlay: { activePlayMs: 10 },
      receiptOrdinal: 10,
    })).toEqual({ status: 'refused', reason: 'jump-drive-required' });

    const planned = planStellarSkim({
      state: veteranDriveResearch,
      opportunity,
      currentSystem: system(sol),
      capabilities: systemCapabilities('jumpdrive'),
      playerHp: 12,
      activePlay: { activePlayMs: 10 },
      receiptOrdinal: 10,
    });
    expect(planned.status).toBe('planned');
    if (planned.status !== 'planned') return;
    expect(planned.result).toEqual({
      sourceKey: sol.key,
      material: 'Pls',
      quantity: 1,
      rawTier: 3,
      reservePasses: 43,
      extractionIndex: 1,
      extractionsTaken: 1,
      passesRemaining: 42,
      priorHp: 12,
      damage: 0,
      nextHp: 12,
      remnantHazard: false,
      guarded: false,
    });
    expect(planned.nextState.research).toEqual(['drive3']);
    expect(planned.nextState.stars[0]!.key).toBe(sol.key);
    const liveSystem = system(sol);
    expect(planStellarSkim({
      state: veteranDriveResearch,
      opportunity,
      currentSystem: sol as unknown as SystemNav,
      capabilities: systemCapabilities('jumpdrive'),
      playerHp: 12,
      activePlay: { activePlayMs: 10 },
      receiptOrdinal: 10,
    })).toEqual({ status: 'refused', reason: 'current-star-unproven' });
    expect(planStellarSkim({
      state: veteranDriveResearch,
      opportunity,
      currentSystem: { ...liveSystem } as SystemNav,
      capabilities: systemCapabilities('jumpdrive'),
      playerHp: 12,
      activePlay: { activePlayMs: 10 },
      receiptOrdinal: 10,
    })).toEqual({ status: 'refused', reason: 'current-star-unproven' });
    expect(planStellarSkim({
      state: veteranDriveResearch,
      opportunity,
      currentSystem: surface(world({ ...SOL, planet: { seed: 134 } })) as unknown as SystemNav,
      capabilities: systemCapabilities('jumpdrive'),
      playerHp: 12,
      activePlay: { activePlayMs: 10 },
      receiptOrdinal: 10,
    })).toEqual({ status: 'refused', reason: 'current-star-unproven' });
    expect(planStellarSkim({
      state: veteranDriveResearch,
      opportunity,
      currentSystem: system(star(REMNANT_STAR)),
      capabilities: systemCapabilities('jumpdrive'),
      playerHp: 12,
      activePlay: { activePlayMs: 10 },
      receiptOrdinal: 10,
    })).toEqual({ status: 'refused', reason: 'current-star-mismatch' });
  });

  it('binds remnant damage, HP guard, Scoop yield, reserve depth, and shielding', () => {
    const remnant = star(REMNANT_STAR);
    const opportunity = projectStarOpportunity(remnant);
    expect(opportunity).toMatchObject({
      source: { starKind: 'NS' }, material: 'Crn', baseReservePasses: 36, remnantHazard: true,
    });
    const jumpDrive = systemCapabilities('jumpdrive');
    const common = {
      state: createEngineeringState(), opportunity, currentSystem: system(remnant), capabilities: jumpDrive,
      activePlay: { activePlayMs: 5_000 }, receiptOrdinal: 11,
    };
    expect(planStellarSkim({ ...common, playerHp: 4 }))
      .toEqual({ status: 'refused', reason: 'remnant-hp-guard' });
    const burned = planStellarSkim({ ...common, playerHp: 5 });
    expect(burned.status).toBe('planned');
    if (burned.status !== 'planned') return;
    expect(burned.result).toMatchObject({ quantity: 1, reservePasses: 36, damage: 3, nextHp: 2 });

    const guarded = planStellarSkim({
      ...common,
      capabilities: systemCapabilities('jumpdrive', 'cscoop'),
      playerHp: 4,
    });
    expect(guarded.status).toBe('planned');
    if (guarded.status !== 'planned') return;
    expect(guarded.result).toMatchObject({
      quantity: 2,
      reservePasses: 54,
      damage: 0,
      nextHp: 4,
      guarded: true,
    });
    expect(guarded.witness).not.toBe(burned.witness);
  });
});

describe('@cf/domain-opportunity — Deep Scanners reveal without mining authority', () => {
  it('withholds orbit minerals without scan1 and reveals only ordinary plus biome veins with it', () => {
    const address = world(BIOME_VEIN_WORLD);
    const opportunity = projectWorldOpportunity(address, null);
    const orbit = system(star({
      galaxy: BIOME_VEIN_WORLD.galaxy,
      star: BIOME_VEIN_WORLD.star,
    }));
    const random = vi.spyOn(Math, 'random');
    const now = vi.spyOn(Date, 'now');

    const hidden = projectWorldMineralReveal({
      state: createEngineeringState(), opportunity, currentNav: orbit,
    });
    expect(hidden).toMatchObject({
      status: 'projected',
      sourceKey: address.key,
      revealLevel: 'withheld',
      deepScannersOwned: false,
      authorizesMining: false,
      ordinaryDeposits: null,
      biomeVein: null,
      cosmicVein: null,
      exceptionalVein: null,
      resolvedGrades: null,
      reservePulls: null,
      extractionsTaken: null,
      pullsRemaining: null,
    });

    const scanned = projectWorldMineralReveal({
      state: legacySparseState(['scan1']), opportunity, currentNav: orbit,
    });
    expect(scanned).toMatchObject({
      status: 'projected',
      revealLevel: 'orbit',
      deepScannersOwned: true,
      authorizesMining: false,
      ordinaryDeposits: opportunity.deposits,
      biomeVein: opportunity.biomeVein,
      cosmicVein: null,
      exceptionalVein: null,
      resolvedGrades: null,
      reservePulls: null,
      extractionsTaken: null,
      pullsRemaining: null,
    });
    expect(opportunity.biomeVein).not.toBeNull();
    expect(isWorldMineralRevealProjection(scanned)).toBe(true);
    expect(isWorldMineralRevealProjection({ ...scanned })).toBe(false);
    expect(() => planWorldMining({
      state: legacySparseState(['scan1']),
      opportunity: scanned as unknown as ReturnType<typeof projectWorldOpportunity>,
      currentSurface: surface(address),
      capabilities: emptyCapabilities(),
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 89,
    })).toThrow(/registered world opportunity snapshot/);
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    random.mockRestore();
    now.mockRestore();
  });

  it('reveals full grounded opportunity, grades, and finite progress without becoming action authority', () => {
    const address = world(TIER_10_COSMIC_EXCEPTIONAL_WORLD);
    const opportunity = projectWorldOpportunity(address, null);
    const state = stateAfterWorldExtractions(address, 9);
    const revealed = projectWorldMineralReveal({
      state,
      opportunity,
      currentNav: surface(address),
    });
    expect(revealed.status).toBe('projected');
    if (revealed.status !== 'projected') return;
    expect(revealed).toMatchObject({
      sourceKey: address.key,
      revealLevel: 'grounded',
      deepScannersOwned: false,
      authorizesMining: false,
      ordinaryDeposits: opportunity.deposits,
      biomeVein: opportunity.biomeVein,
      cosmicVein: opportunity.cosmicVein,
      exceptionalVein: opportunity.exceptionalVein,
      reservePulls: opportunity.reservePulls,
      extractionsTaken: 9,
      pullsRemaining: opportunity.reservePulls - 9,
    });
    expect(revealed.cosmicVein).not.toBeNull();
    expect(revealed.exceptionalVein).not.toBeNull();
    expect(revealed.resolvedGrades).toEqual(expect.arrayContaining([
      { kind: 'ordinary', materialId: 'P', tier: 1 },
      { kind: 'cosmic', materialId: 'Voe', tier: 9 },
      { kind: 'exceptional', materialId: 'P', tier: 1 },
    ]));
    expect(Object.isFrozen(revealed.resolvedGrades)).toBe(true);

    expect(() => planWorldMining({
      state,
      opportunity: revealed as unknown as ReturnType<typeof projectWorldOpportunity>,
      currentSurface: surface(address),
      capabilities: emptyCapabilities(),
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 90,
    })).toThrow(/registered world opportunity snapshot/);
  });
});

describe('@cf/domain-opportunity — exact research and fixed fabrication plans', () => {
  it('returns an Arc2 mutation directive, re-anchors Auto-Extractor with zero retroactive loads, and consumes no RNG input', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const mined = planWorldMining({
      state: createEngineeringState(),
      opportunity: projectWorldOpportunity(mars, null),
      currentSurface: surface(mars),
      capabilities: emptyCapabilities(),
      activePlay: { activePlayMs: 100 },
      receiptOrdinal: 20,
    });
    expect(mined.status).toBe('planned');
    if (mined.status !== 'planned') return;
    expect(mined.nextState.worlds[0]!.autoExtractorCursor).toBeNull();

    const crafted = planFixedFabrication({
      state: mined.nextState,
      baseId: 'autoext',
      assets: {
        materials: {},
        exceptionalMaterials: {},
        itemCounts: { servo: 2, navcore: 1, cell: 1 },
        stardust: 40,
        signatureIds: [],
      },
      activePlay: { activePlayMs: 90_000 },
      receiptOrdinal: 21,
    });
    expect(crafted.status).toBe('planned');
    if (crafted.status !== 'planned') return;
    expect(crafted.result.arc2).toMatchObject({
      baseId: 'autoext',
      outputKind: 'permanent-system',
      consume: {
        materials: [],
        exceptionalMaterials: [],
        itemCounts: [
          { id: 'cell', quantity: 1 },
          { id: 'navcore', quantity: 1 },
          { id: 'servo', quantity: 2 },
        ],
        stardust: 40,
      },
      grantCount: 1,
      gearGenerationPlan: null,
      autoExtractorReanchoredWorlds: 1,
    });
    expect(crafted.nextState.worlds[0]!.autoExtractorCursor).toEqual({
      schema: 'cf-v2-recurring-accrual-cursor/v1',
      collectedThroughActivePlayMs: 90_000,
    });
    expect(crafted.nextState.worlds[0]!.extractionsTaken).toBe(1);
    expect(crafted.witness).not.toContain('sessionRng');
    expect(crafted.witness).not.toContain('random');
  });
});

describe('@cf/domain-opportunity — canonical witness factor binding', () => {
  it('changes for each one-factor mutation: receipt, clock, cursor, source, capability, HP, assets, and recipe', () => {
    const mars = world({ ...SOL, planet: { seed: 134 } });
    const marsOpportunity = projectWorldOpportunity(mars, null);
    const baseMiningInput = {
      state: createEngineeringState(),
      opportunity: marsOpportunity,
      currentSurface: surface(mars),
      capabilities: emptyCapabilities(),
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 0,
    };
    const witnessOf = (outcome: { readonly status: string; readonly witness?: string }): string => {
      expect(outcome.status).toBe('planned');
      if (outcome.status !== 'planned' || outcome.witness === undefined) {
        throw new Error(`expected planned witness, got ${outcome.status}`);
      }
      return outcome.witness;
    };

    const miningBaseline = witnessOf(planWorldMining(baseMiningInput));
    const receiptMutation = witnessOf(planWorldMining({ ...baseMiningInput, receiptOrdinal: 1 }));
    const activePlayMutation = witnessOf(planWorldMining({
      ...baseMiningInput, activePlay: { activePlayMs: 1 },
    }));

    const autoAssets = {
      materials: {}, exceptionalMaterials: {},
      itemCounts: { servo: 2, navcore: 1, cell: 1 },
      stardust: 40, signatureIds: [],
    } as const;
    const cursorSource = stateAfterWorldExtractions(mars, 1);
    const cursorAtZero = planFixedFabrication({
      state: cursorSource, baseId: 'autoext', assets: autoAssets,
      activePlay: { activePlayMs: 0 }, receiptOrdinal: 2,
    });
    const cursorAtOne = planFixedFabrication({
      state: cursorSource, baseId: 'autoext', assets: autoAssets,
      activePlay: { activePlayMs: 1 }, receiptOrdinal: 2,
    });
    expect(cursorAtZero.status).toBe('planned');
    expect(cursorAtOne.status).toBe('planned');
    if (cursorAtZero.status !== 'planned' || cursorAtOne.status !== 'planned') return;
    const autoCapabilities = systemCapabilities('autoext');
    const priorCursorBaseline = witnessOf(planWorldMining({
      state: cursorAtZero.nextState, opportunity: marsOpportunity, currentSurface: surface(mars),
      capabilities: autoCapabilities, activePlay: { activePlayMs: 600_001 }, receiptOrdinal: 3,
    }));
    const priorCursorMutation = witnessOf(planWorldMining({
      state: cursorAtOne.nextState, opportunity: marsOpportunity, currentSurface: surface(mars),
      capabilities: autoCapabilities, activePlay: { activePlayMs: 600_001 }, receiptOrdinal: 3,
    }));

    const other = world(BIOME_VEIN_WORLD);
    const sourceMutation = witnessOf(planWorldMining({
      ...baseMiningInput,
      opportunity: projectWorldOpportunity(other, null),
      currentSurface: surface(other),
    }));
    const capabilityMutation = witnessOf(planWorldMining({
      ...baseMiningInput,
      capabilities: systemCapabilities('autoext'),
    }));

    const sol = star(SOL);
    const skimBase = {
      state: createEngineeringState(),
      opportunity: projectStarOpportunity(sol),
      currentSystem: system(sol),
      capabilities: systemCapabilities('jumpdrive'),
      playerHp: 12,
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 4,
    };
    const hpBaseline = witnessOf(planStellarSkim(skimBase));
    const hpMutation = witnessOf(planStellarSkim({ ...skimBase, playerHp: 13 }));

    const fabricationBase = {
      state: createEngineeringState(),
      baseId: 'plate',
      assets: {
        materials: { Fe: 4, Al: 3 }, exceptionalMaterials: {}, itemCounts: {},
        stardust: 0, signatureIds: [],
      },
      activePlay: { activePlayMs: 0 },
      receiptOrdinal: 5,
    } as const;
    const fabricationBaseline = witnessOf(planFixedFabrication(fabricationBase));
    const fabricationAssetsMutation = witnessOf(planFixedFabrication({
      ...fabricationBase,
      assets: { ...fabricationBase.assets, materials: { Fe: 5, Al: 3 } },
    }));
    const fabricationRecipeMutation = witnessOf(planFixedFabrication({
      ...fabricationBase,
      baseId: 'wire',
    }));

    const matrix = [
      ['receiptOrdinal', miningBaseline, receiptMutation],
      ['activePlayMs', miningBaseline, activePlayMutation],
      ['priorCursor', priorCursorBaseline, priorCursorMutation],
      ['sourceKey', miningBaseline, sourceMutation],
      ['capabilityFingerprint', miningBaseline, capabilityMutation],
      ['playerHp', hpBaseline, hpMutation],
      ['fabricationAssets', fabricationBaseline, fabricationAssetsMutation],
      ['fabricationRecipe', fabricationBaseline, fabricationRecipeMutation],
    ] as const;
    expect(matrix.map(([factor, baseline, mutation]) => ({
      factor,
      changed: baseline !== mutation,
      bounded: mutation.length <= 4_096,
    }))).toEqual(matrix.map(([factor]) => ({ factor, changed: true, bounded: true })));
  });
});
