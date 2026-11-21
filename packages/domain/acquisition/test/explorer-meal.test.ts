import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeGenome, speciesGrade } from '@cf/domain-genome';
import { floraStat } from '@cf/domain-strays';
import {
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createSpecimenLotV1,
  ownershipContentId,
  type DiscoveryRecordId,
  type SpecimenLotId,
} from '../src/model.js';
import {
  migrateOwnershipStateV1ToV2,
  ownershipSourceStateV1,
} from '../src/model-v2.js';
import {
  ARC5_EXPLORER_MEAL_ACTION_KIND_V1,
  preflightArc5ExplorerMealV1,
  projectArc5ExplorerMealPreviewV1,
  settleArc5ExplorerMealV1,
  type Arc5ExplorerPhysiologyV1,
  type Arc5ExplorerStatKeyV1,
} from '../src/explorer-meal.js';

function seedFor(stat: Arc5ExplorerStatKeyV1): number {
  for (let seed = 0; seed < 500; seed++) {
    if (floraStat(makeGenome(seed, 'flora', 0.4)) === stat) return seed;
  }
  throw new Error(`no flora seed found for ${stat}`);
}

function fixture(stat: Arc5ExplorerStatKeyV1, quantity = 2) {
  const genome = makeGenome(seedFor(stat), 'flora', 0.4);
  const identity = canonicalGenomeIdentityV1(genome);
  const discovery = createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `explorer-meal-${stat}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `explorer-meal-${stat}`,
    legacySourceIndex: 0,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  });
  const lotId = ownershipContentId('specimen', `explorer-meal-${stat}`) as SpecimenLotId;
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity,
      alias: null,
      firstObservationId: discovery.recordId,
    })],
    discoveries: [discovery],
    creatures: [],
    specimenLots: [createSpecimenLotV1({
      lotId,
      speciesId: identity.speciesId,
      kind: 'flora',
      quantity,
      origin: 'legacy',
      acquisitionRecordId: discovery.recordId,
    })],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
  return Object.freeze({
    state: migrateOwnershipStateV1ToV2(source),
    lotId,
    genome,
  });
}

function physiology(
  hp = 40,
  stats = { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 },
): Arc5ExplorerPhysiologyV1 {
  return { hp, hpMax: Math.max(20, Math.round(stats.vit * 2)), stats };
}

function ready(stat: Arc5ExplorerStatKeyV1, quantity = 2) {
  const prepared = fixture(stat, quantity);
  const result = preflightArc5ExplorerMealV1(prepared.state, { foodLotId: prepared.lotId });
  if (result.kind !== 'ready') throw new Error(result.reason);
  return Object.freeze({ ...prepared, preflight: result.preflight });
}

describe('@cf/domain-acquisition — explorer flora meal', () => {
  it('ports safe heal, deterministic stat nourishment, Xenobotany +1, and one-lot consumption', () => {
    const f = ready('fer');
    const beforeSource = ownershipSourceStateV1(f.state);
    const tier = speciesGrade(f.genome).tier;
    const expectedChance = Math.max(0.05, Math.min(0.6, 0.08 + tier * 0.07));
    const expectedBase = Math.round(12 + tier * 9 + expectedChance * 30);
    const settlement = settleArc5ExplorerMealV1(
      f.preflight,
      physiology(),
      0.35,
      true,
      0.999,
      17,
    );

    expect(settlement.preflight).toMatchObject({
      floraTier: tier,
      nourishedStat: 'fer',
      poisonChance: expectedChance,
      healBase: expectedBase,
      foodQuantityBefore: 2,
      foodQuantityAfter: 1,
    });
    expect(settlement.consequence).toMatchObject({
      poisoned: false,
      hpBefore: 40,
      hpAfter: Math.min(100, 40 + Math.round(expectedBase * 1.35)),
      hpMaxBefore: 100,
      hpMaxAfter: 100,
      healAmount: Math.round(expectedBase * 1.35),
      nourishment: 2 + tier,
      statIncrease: 2 + tier,
      nourishedStat: 'fer',
    });
    expect(settlement.consequence.statsAfter.fer).toBe(52 + tier);
    expect(settlement.foodAfter?.quantity).toBe(1);
    expect(settlement.foodTombstone).toBeNull();
    expect(ownershipSourceStateV1(settlement.successor)).toBe(beforeSource);
    expect(settlement.receiptEvidence).toMatchObject({
      ordinal: 17,
      actionKind: ARC5_EXPLORER_MEAL_ACTION_KIND_V1,
    });
  });

  it('keeps poison nonlethal and bases damage on unboosted healing', () => {
    const f = ready('agi');
    const preview = projectArc5ExplorerMealPreviewV1(
      f.preflight,
      physiology(5),
      4,
      true,
    );
    expect(preview.healAmount).toBe(preview.preflight.healBase * 5);
    const settlement = settleArc5ExplorerMealV1(
      f.preflight,
      physiology(5),
      4,
      true,
      0,
      18,
    );
    expect(settlement.consequence).toMatchObject({
      poisoned: true,
      hpBefore: 5,
      hpAfter: 1,
      damageTaken: 4,
      brink: true,
      statIncrease: 0,
    });
    expect(settlement.consequence.poisonDamage)
      .toBe(Math.ceil(settlement.preflight.healBase * 0.6));
    expect(settlement.consequence.statsAfter).toEqual(settlement.consequence.statsBefore);
  });

  it('caps a nourished stat at 330 and preserves vitality max-HP top-up ordering', () => {
    const f = ready('vit');
    const stats = { vit: 329, fer: 330, res: 330, agi: 330, ins: 330 };
    const settlement = settleArc5ExplorerMealV1(
      f.preflight,
      physiology(500, stats),
      0,
      true,
      0.999,
      19,
    );
    expect(settlement.consequence.statsAfter.vit).toBe(330);
    expect(settlement.consequence.statIncrease).toBe(1);
    expect(settlement.consequence.hpMaxBefore).toBe(658);
    expect(settlement.consequence.hpMaxAfter).toBe(660);
    expect(settlement.consequence.hpAfter).toBe(
      Math.min(658, 500 + settlement.consequence.healAmount) + 2,
    );
    expect(Math.max(...Object.values(settlement.consequence.statsAfter))).toBe(330);
  });

  it('tombstones the last flora specimen without changing creature or genome state', () => {
    const f = ready('ins', 1);
    const parentGenome = f.state.catalogSpecies[0]!.genome;
    const settlement = settleArc5ExplorerMealV1(
      f.preflight,
      physiology(),
      0,
      false,
      0.999,
      20,
    );
    expect(settlement.foodAfter).toBeNull();
    expect(settlement.successor.specimenLots).toEqual([]);
    expect(settlement.foodTombstone).toMatchObject({
      kind: 'specimen-lot',
      lotId: f.lotId,
      snapshot: settlement.foodBefore,
      disposition: settlement.receiptEvidence,
    });
    expect(settlement.successor.creatures).toEqual(f.state.creatures);
    expect(settlement.successor.catalogSpecies[0]!.genome).toEqual(parentGenome);
  });

  it('refuses missing/non-authoritative inputs before settlement', () => {
    const f = ready('res');
    const absent = ownershipContentId('specimen', 'absent-meal') as SpecimenLotId;
    expect(preflightArc5ExplorerMealV1(f.state, { foodLotId: absent }))
      .toEqual({ kind: 'refused', reason: 'food-not-found' });
    expect(() => settleArc5ExplorerMealV1(
      { ...f.preflight }, physiology(), 0, false, 0.9, 21,
    )).toThrow(/owner-minted/u);
    expect(() => projectArc5ExplorerMealPreviewV1(
      f.preflight,
      { ...physiology(), hpMax: 99 },
      0,
      false,
    )).toThrow(/vitality-derived/u);
    expect(() => settleArc5ExplorerMealV1(
      f.preflight, physiology(), 0, false, 1, 21,
    )).toThrow(/\[0, 1\)/u);
  });

  it('contains no ambient entropy, clock, or mutable-global dependency', () => {
    const source = readFileSync(new URL('../src/explorer-meal.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/Math\.random|Date\.|performance\.|globalThis|window\.|document\./u);
  });
});
