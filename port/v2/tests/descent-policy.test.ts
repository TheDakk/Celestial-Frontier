import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  createGearInventory,
  decodeGearInventory,
  makeGearSourceActionId,
  migrateLegacyGear,
  projectEngineeringCapabilities,
  type GearSlot,
} from '@cf/domain-loot';
import { registerArc2EngineeringLoadout } from '@cf/domain-loot/engineering-internal';
import {
  createEmptyDescentWaveOffStateV1,
  createLegacyDescentWaveOffStateV1,
  projectWorldOpportunity,
  stageDescentWaveOffOutcomeV1,
} from '@cf/domain-opportunity';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import {
  DESCENT_DAMAGE_DOMAIN_V1,
  DESCENT_OUTCOME_DOMAINS_V1,
  DESCENT_SUCCESS_DOMAIN_V1,
  DESCENT_TYPE_TIERS_V1,
  descentDamageRangeForBaseSuccessV1,
  projectDescentApproachV1,
  resolveDescentAttemptV1,
} from '../apps/game/src/descent-policy.js';

beforeAll(() => installCaptureHooks());

const HOME = { seed: 999, x: 90, y: -60 };
const SOL = { seed: 424_242, x: 560, y: 170 };
const sourceActionId = makeGearSourceActionId({
  kind: 'legacy-migration', ownerId: 'descent-domain-test',
  actionKey: 'landing-gear', receiptId: 'migration:v4-v5',
});

function world(seed: number): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress({ galaxy: HOME, star: SOL, planet: { seed } });
  if (!result.ok) throw new Error(`descent fixture did not resolve: ${result.reason}`);
  return result.address;
}

function capabilities(
  itemCounts: readonly (readonly [string, number])[] = [],
  equipped: Partial<Record<GearSlot, string>> = {},
) {
  if (itemCounts.length === 0) {
    return projectEngineeringCapabilities(registerArc2EngineeringLoadout(
      createGearInventory(1), [],
    ));
  }
  const migrated = migrateLegacyGear({ sourceActionId, itemCounts, equipped, equippedAffixes: {} });
  const inventory = decodeGearInventory(JSON.stringify({
    schema: 1, revision: 4, capacity: 12,
    entries: migrated.instances.map((instance) => ({ instance, favorite: false, locked: false })),
    equipped: migrated.equipped, pendingRewards: [],
  }));
  return projectEngineeringCapabilities(registerArc2EngineeringLoadout(inventory, []));
}

function policy(
  address: CanonicalCF1WorldAddress,
  options: Partial<{
    stormActive: boolean;
    trainingActive: boolean;
    alreadyLanded: boolean;
    waveOffs: ReturnType<typeof createEmptyDescentWaveOffStateV1>;
    capabilities: ReturnType<typeof capabilities>;
  }> = {},
) {
  return projectDescentApproachV1({
    address,
    opportunity: projectWorldOpportunity(address),
    capabilities: options.capabilities ?? capabilities(),
    waveOffs: options.waveOffs ?? createEmptyDescentWaveOffStateV1(),
    stormActive: options.stormActive ?? false,
    trainingActive: options.trainingActive ?? false,
    alreadyLanded: options.alreadyLanded ?? false,
  });
}

const draws = (success: number, damage: number) => Object.freeze([
  Object.freeze({ domain: DESCENT_SUCCESS_DOMAIN_V1, value: success }),
  Object.freeze({ domain: DESCENT_DAMAGE_DOMAIN_V1, value: damage }),
]);

describe('Arc 0 pure deterministic descent policy', () => {
  it('pins the complete type ladder and biome-derived damage thresholds', () => {
    expect(DESCENT_TYPE_TIERS_V1).toEqual({
      terran: { successPercent: 95, damageMin: 2, damageMax: 2 },
      ocean: { successPercent: 90, damageMin: 2, damageMax: 2 },
      rocky: { successPercent: 90, damageMin: 2, damageMax: 2 },
      ice: { successPercent: 85, damageMin: 3, damageMax: 4 },
      desert: { successPercent: 85, damageMin: 3, damageMax: 4 },
      gas: { successPercent: 65, damageMin: 4, damageMax: 6 },
      venus: { successPercent: 25, damageMin: 5, damageMax: 7 },
      lava: { successPercent: 20, damageMin: 6, damageMax: 8 },
    });
    expect([100, 90, 89, 75, 74, 55, 54, 30, 29, 5].map((percent) => (
      [percent, descentDamageRangeForBaseSuccessV1(percent)]
    ))).toEqual([
      [100, { damageMin: 2, damageMax: 2 }],
      [90, { damageMin: 2, damageMax: 2 }],
      [89, { damageMin: 3, damageMax: 4 }],
      [75, { damageMin: 3, damageMax: 4 }],
      [74, { damageMin: 4, damageMax: 6 }],
      [55, { damageMin: 4, damageMax: 6 }],
      [54, { damageMin: 5, damageMax: 7 }],
      [30, { damageMin: 5, damageMax: 7 }],
      [29, { damageMin: 6, damageMax: 8 }],
      [5, { damageMin: 6, damageMax: 8 }],
    ]);
  });

  it('lets the authored biome override the type rung and applies the two storm floors', () => {
    const policies = [131, 132, 134, 135, 136, 137, 138].map((seed) => policy(world(seed)));
    const override = policies.find(({ baseSuccessPercent, typeBase }) => (
      baseSuccessPercent !== typeBase.successPercent
    ));
    expect(override).toBeDefined();
    expect(override?.biomeKey).not.toBeNull();

    const high = policies.find(({ baseSuccessPercent }) => baseSuccessPercent >= 90);
    const lower = policies.find(({ baseSuccessPercent }) => baseSuccessPercent < 90);
    expect(high).toBeDefined();
    expect(lower).toBeDefined();
    const highStorm = policy(high!.address, { stormActive: true });
    const lowerStorm = policy(lower!.address, { stormActive: true });
    expect(highStorm.stormAdjustedPercent).toBe(Math.max(90, high!.baseSuccessPercent - 5));
    expect(lowerStorm.stormAdjustedPercent).toBe(Math.max(5, lower!.baseSuccessPercent - 5));
    expect(highStorm.damageMin).toBe(high!.damageMin);
    expect(lowerStorm.damageMax).toBe(lower!.damageMax);
  });

  it('adds exactly +20 per exact-world wave-off and only matching worn landing effects', () => {
    const venus = world(132);
    const emptyWaveOffs = createEmptyDescentWaveOffStateV1();
    const base = policy(venus, { waveOffs: emptyWaveOffs });
    const failed = resolveDescentAttemptV1(base, draws(0.999, 0), 9);
    expect(failed.kind).toBe('wave-off');
    if (failed.kind !== 'wave-off') return;
    const learned = policy(venus, {
      waveOffs: stageDescentWaveOffOutcomeV1(
        emptyWaveOffs,
        venus,
        failed.persistenceOutcome,
      ),
    });
    expect(learned.learnedApproachBonus).toBe(20);
    expect(learned.successPercent).toBe(Math.min(100, base.successPercent + 20));

    const thermal = capabilities([['thermal', 1]], { suit: 'thermal' });
    const geared = policy(venus, { capabilities: thermal });
    expect(geared.globalGearBonus).toBe(10);
    expect(geared.familyGearBonus).toBe(30);
    expect(geared.successPercent).toBe(Math.min(100, base.successPercent + 40));
    const mars = policy(world(134), { capabilities: thermal });
    expect(mars.globalGearBonus).toBe(10);
    expect(mars.familyGearBonus).toBe(0);

    const anchor = capabilities([['anchor', 1]], { module: 'anchor' });
    const guaranteed = policy(venus, { capabilities: anchor });
    expect(guaranteed.landingGuaranteed).toBe(true);
    expect(guaranteed.successPercent).toBe(100);
    expect(resolveDescentAttemptV1(guaranteed, draws(0.999_999, 0.999), 9))
      .toMatchObject({ kind: 'landed', hpAfter: 9, persistenceOutcome: 'success' });
  });

  it('reserves the two isolated outcome domains once and deterministically clears on success', () => {
    const mars = world(134);
    const approach = policy(mars, {
      waveOffs: createLegacyDescentWaveOffStateV1([[134, 2]]),
    });
    expect(approach.requiredDomains).toEqual(DESCENT_OUTCOME_DOMAINS_V1);
    const first = resolveDescentAttemptV1(approach, draws(0, 0.999), 12);
    const replay = resolveDescentAttemptV1(approach, draws(0, 0.999), 12);
    expect(replay).toEqual(first);
    expect(first).toMatchObject({
      kind: 'landed', navigation: 'surface', drawsConsumed: 2,
      damage: 0, hpBefore: 12, hpAfter: 12,
      waveOffCountBefore: 2, waveOffCountAfter: 0,
      persistenceOutcome: 'success',
    });
    expect(() => resolveDescentAttemptV1(approach, draws(0, 0.999).slice(0, 1), 12))
      .toThrow(/draw count/);
  });

  it('keeps failure in orbit, applies worn struts, and never reduces HP below one', () => {
    const venus = world(132);
    const braced = capabilities([['stabil', 1]], { module: 'stabil' });
    const approach = policy(venus, { capabilities: braced });
    const outcome = resolveDescentAttemptV1(approach, draws(0.999, 0.999), 4);
    expect(outcome.kind).toBe('wave-off');
    if (outcome.kind !== 'wave-off') return;
    expect(outcome).toMatchObject({
      navigation: 'orbit', drawsConsumed: 2, hpBefore: 4, hpAfter: 1,
      gearAdjustedDamage: Math.max(0, outcome.rawDamage - 3),
      damage: 3, waveOffCountBefore: 0, waveOffCountAfter: 1,
      persistenceOutcome: 'failure',
    });
    const critical = resolveDescentAttemptV1(approach, draws(0.999, 0.999), 1);
    expect(critical).toMatchObject({ kind: 'wave-off', hpBefore: 1, hpAfter: 1, damage: 0 });
  });

  it.each([
    ['earth', 133, {}, 'success', 0],
    ['training', 134, { trainingActive: true }, 'unchanged', 2],
    ['revisit', 134, { alreadyLanded: true }, 'success', 0],
  ] as const)('%s is an explicit zero-draw path with the exact progress disposition', (
    reason, seed, options, persistenceOutcome, waveOffCountAfter,
  ) => {
    const address = world(seed);
    const approach = policy(address, {
      ...options,
      waveOffs: createLegacyDescentWaveOffStateV1([[address.planet.seed, 2]]),
    });
    expect(approach.safeReason).toBe(reason);
    expect(approach.requiredDomains).toEqual([]);
    expect(resolveDescentAttemptV1(approach, [], 9)).toMatchObject({
      kind: 'landed', drawsConsumed: 0, hpAfter: 9,
      waveOffCountBefore: 2, waveOffCountAfter,
      persistenceOutcome,
    });
    expect(() => resolveDescentAttemptV1(approach, draws(0, 0), 9)).toThrow(/draw count/);
  });

  it('rejects address/capability/state/policy clones and malformed draws before an outcome', () => {
    const mars = world(134);
    const input = {
      address: mars,
      opportunity: projectWorldOpportunity(mars),
      capabilities: capabilities(),
      waveOffs: createEmptyDescentWaveOffStateV1(),
      stormActive: false, trainingActive: false, alreadyLanded: false,
    };
    expect(() => projectDescentApproachV1({ ...input, address: { ...mars } as never }))
      .toThrow(/registered authorities/);
    expect(() => projectDescentApproachV1({
      ...input, capabilities: { ...input.capabilities } as never,
    })).toThrow(/registered authorities/);
    expect(() => projectDescentApproachV1({ ...input, waveOffs: { ...input.waveOffs } as never }))
      .toThrow(/registered authorities/);
    const approach = projectDescentApproachV1(input);
    expect(() => resolveDescentAttemptV1({ ...approach } as never, draws(0, 0), 8))
      .toThrow(/owner-projected/);
    expect(() => resolveDescentAttemptV1(approach, [
      { domain: DESCENT_DAMAGE_DOMAIN_V1, value: 0 },
      { domain: DESCENT_SUCCESS_DOMAIN_V1, value: 0 },
    ], 8)).toThrow(/required unit draw/);
  });
});
