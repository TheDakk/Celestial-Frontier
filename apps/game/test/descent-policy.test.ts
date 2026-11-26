// The descent's odds and its wave-off, against the legacy game's own answers (LEGACY celestial-frontier.html
// `descentFor` 13421-13434, `_descRoll` 13438-13461, `descentSafe` 13435-13437, the gear readers 23224-23244) and
// against the authorities the policy is given. The wrapper's tests are ported from the painted port's
// tests/descent-policy.test.ts.
import { describe, expect, it } from 'vitest';
import { legacyPromptWeather, worldEnvironment } from '@cf/domain-landing';
import {
  createEmptyDescentWaveOffStateV1,
  createLegacyDescentWaveOffStateV1,
  projectWorldOpportunity,
  stageDescentWaveOffOutcomeV1,
} from '@cf/domain-opportunity';
import type { CanonicalCF1WorldAddress } from '@cf/scene';
import {
  DESCENT_DAMAGE_DOMAIN_V1,
  DESCENT_OUTCOME_DOMAINS_V1,
  DESCENT_SUCCESS_DOMAIN_V1,
  DESCENT_TYPE_TIERS_V1,
  descentDamageRangeForBaseSuccessV1,
  descentOdds,
  projectDescentApproachV1,
  resolveDescentAttemptV1,
  waveOffDamage,
} from '../src/landing';
import { landButtonStep } from '../src/world';
import { recorded, wearing, world } from './descent-support';

function policy(
  address: CanonicalCF1WorldAddress,
  options: Partial<{
    stormActive: boolean;
    reinforcedHull: boolean;
    trainingActive: boolean;
    alreadyLanded: boolean;
    waveOffs: ReturnType<typeof createEmptyDescentWaveOffStateV1>;
    capabilities: ReturnType<typeof wearing>;
  }> = {},
) {
  return projectDescentApproachV1({
    address,
    opportunity: projectWorldOpportunity(address),
    capabilities: options.capabilities ?? wearing(),
    waveOffs: options.waveOffs ?? createEmptyDescentWaveOffStateV1(),
    stormActive: options.stormActive ?? false,
    reinforcedHull: options.reinforcedHull ?? false,
    trainingActive: options.trainingActive ?? false,
    alreadyLanded: options.alreadyLanded ?? false,
  });
}

const draws = (success: number, damage: number) => Object.freeze([
  Object.freeze({ domain: DESCENT_SUCCESS_DOMAIN_V1, value: success }),
  Object.freeze({ domain: DESCENT_DAMAGE_DOMAIN_V1, value: damage }),
]);

describe('the descent odds, against the legacy game', () => {
  it('the type ladder and the damage rung of every percent are the recorded ones', () => {
    const { tiers, damage } = recorded('tiers')[0]!.output;
    expect(Object.fromEntries(Object.entries(DESCENT_TYPE_TIERS_V1).map(([type, t]) => [type, { p: t.successPercent, lo: t.damageMin, hi: t.damageMax }])))
      .toEqual(tiers);
    expect(damage.length).toBe(101);
    expect(damage.map((_, p) => { const r = descentDamageRangeForBaseSuccessV1(p); return [r.damageMin, r.damageMax]; })).toEqual(damage);
  });

  it('every recorded world, weather and wave-off count gives the recorded odds, damage and biome', () => {
    const worlds = recorded('descent');
    expect(worlds.length).toBe(9 * 4 * 8);
    let storms = 0;
    for (const { input, biome, at } of worlds) {
      let i = 0;
      for (const seconds of input.times) for (const waveOffCount of input.waveOffs) {
        const [pct, lo, hi, wx] = at[i++]!;
        if (wx !== null) storms++;
        const odds = descentOdds({
          planet: input, band: input.band, stormActive: wx !== null, waveOffCount, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false,
        });
        const label = JSON.stringify({ ...input, times: undefined, waveOffs: undefined, seconds, waveOffCount });
        expect([odds.successPercent, odds.damageMin, odds.damageMax], label).toEqual([pct, lo, hi]);
        expect(odds.biomeKey === null ? null : [odds.biomeKey, odds.biomeName, odds.biomeLanding], label).toEqual(biome);
      }
      expect(i).toBe(at.length);
    }
    // The fixture holds both weathers in number, so the storm's 5 is exercised.
    expect(storms).toBeGreaterThan(1000);
    expect(storms).toBeLessThan(worlds.length * 20 - 1000);
  });

  it('worn landing gear moves the odds as recorded: the global bonus, the bonus of the world type, the Gravitic Anchor', () => {
    const gear = recorded('gear');
    expect(gear.length).toBe(8 * 2 * 10 * 2);
    const moved = new Set<string>();
    for (const { input, output } of gear) {
      const capabilities = wearing(input.equip);
      const family = capabilities.landingFamilyBonus as Readonly<Record<string, number>>;
      const stormActive = legacyPromptWeather(input, worldEnvironment(input, input.band), 45) !== null;
      const bare = descentOdds({ planet: input, band: input.band, stormActive, waveOffCount: input.waveOffs, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false });
      const odds = descentOdds({
        planet: input, band: input.band, stormActive, waveOffCount: input.waveOffs,
        gearBonus: capabilities.landingSuccessBonus,
        familyGearBonus: family[input.type] ?? 0,
        landingGuaranteed: capabilities.landingGuaranteed,
      });
      expect(odds.successPercent, JSON.stringify(input)).toBe(output);
      if (odds.successPercent !== bare.successPercent) moved.add(JSON.stringify(input.equip));
    }
    // Every worn set but the bare one changed some world's odds.
    expect(moved.size).toBe(9);
  });

  it('every recorded roll lands or waves off, costs the health, and learns the approach as recorded', () => {
    const rolls = recorded('roll');
    expect(rolls.length).toBe(4 * 4 * 2 * 3 * 2 * 3 * 3);
    const seen = { landed: 0, waved: 0, hull: 0, spared: 0 };
    for (const { input, output } of rolls) {
      const capabilities = wearing(input.equip);
      const family = capabilities.landingFamilyBonus as Readonly<Record<string, number>>;
      const at = (waveOffCount: number) => descentOdds({
        planet: input, band: input.band, waveOffCount,
        stormActive: legacyPromptWeather(input, worldEnvironment(input, input.band), 45) !== null,
        gearBonus: capabilities.landingSuccessBonus, familyGearBonus: family[input.type] ?? 0,
        landingGuaranteed: capabilities.landingGuaranteed,
      });
      const odds = at(input.waveOffs);
      const landed = input.success * 100 < odds.successPercent;
      const label = JSON.stringify(input);
      if (landed) {
        seen.landed++;
        expect([true, input.hp, 0, at(0).successPercent], label).toEqual([output[0], output[1], output[2], output[4]]);
        continue;
      }
      seen.waved++;
      const cost = waveOffDamage({
        damageMin: odds.damageMin, damageMax: odds.damageMax, draw: input.damage,
        reinforcedHull: input.hull1, strutReduction: capabilities.waveOffDamageReduction, hp: input.hp,
      });
      const plain = waveOffDamage({
        damageMin: odds.damageMin, damageMax: odds.damageMax, draw: input.damage,
        reinforcedHull: false, strutReduction: capabilities.waveOffDamageReduction, hp: input.hp,
      });
      if (cost.damage !== plain.damage) seen.hull++;
      if (cost.gearAdjustedDamage > cost.damage) seen.spared++;
      const after = Math.min(5, input.waveOffs + 1);
      expect([false, input.hp - cost.damage, after, at(after).successPercent], label).toEqual([output[0], output[1], output[2], output[4]]);
    }
    // Both ends, the reinforced hull and "a wave-off never kills" are each exercised by the recorded cases.
    expect(seen.landed).toBeGreaterThan(100);
    expect(seen.waved).toBeGreaterThan(100);
    expect(seen.hull).toBeGreaterThan(10);
    expect(seen.spared).toBeGreaterThan(10);
  });

  it('a reinforced hull leaves a scrape of 1 alone, and the struts take theirs after it', () => {
    const one = { damageMin: 1, damageMax: 1, draw: 0, strutReduction: 0, hp: 9 };
    expect(waveOffDamage({ ...one, reinforcedHull: true }).damage).toBe(1);
    expect(waveOffDamage({ damageMin: 2, damageMax: 2, draw: 0, strutReduction: 0, hp: 9, reinforcedHull: true }).damage).toBe(1);
    expect(waveOffDamage({ damageMin: 6, damageMax: 8, draw: 0.999, strutReduction: 3, hp: 9, reinforcedHull: true }))
      .toEqual({ rawDamage: 8, gearAdjustedDamage: 4, damage: 4 });
    expect(waveOffDamage({ damageMin: 2, damageMax: 2, draw: 0, strutReduction: 5, hp: 9, reinforcedHull: false }).damage).toBe(0);
  });

  it('the Land button skips the roll exactly where the legacy game calls a descent safe', () => {
    const rows = recorded('safe')[0]!.output;
    expect(rows.length).toBe(16);
    for (const [tutDone, seed, landed, cleared, safe] of rows) {
      const step = landButtonStep({ inView: true, tutDone, earth: seed === 133, landed, cleared: cleared === seed });
      expect(step, JSON.stringify([tutDone, seed, landed, cleared])).toBe(safe ? 'land' : 'roll-descent');
    }
  });
});

describe('the descent policy over its authorities', () => {
  it('lets the biome override the type rung and applies the two storm floors', () => {
    const policies = [131, 132, 134, 135, 136, 137, 138].map((seed) => policy(world(seed)));
    const override = policies.find(({ baseSuccessPercent, typeBase }) => baseSuccessPercent !== typeBase.successPercent);
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
    expect(lowerStorm.successPercent).toBe(lower!.successPercent - 5);
    expect(highStorm.damageMin).toBe(high!.damageMin);
    expect(lowerStorm.damageMax).toBe(lower!.damageMax);
  });

  it('adds exactly 20 per wave-off on that world and only the worn landing effects that match it', () => {
    const venus = world(132);
    const emptyWaveOffs = createEmptyDescentWaveOffStateV1();
    const base = policy(venus, { waveOffs: emptyWaveOffs });
    const failed = resolveDescentAttemptV1(base, draws(0.999, 0), 9);
    expect(failed.kind).toBe('wave-off');
    if (failed.kind !== 'wave-off') return;
    const learned = policy(venus, {
      waveOffs: stageDescentWaveOffOutcomeV1(emptyWaveOffs, venus, failed.persistenceOutcome),
    });
    expect(learned.learnedApproachBonus).toBe(20);
    expect(learned.successPercent).toBe(Math.min(100, base.successPercent + 20));
    // The notice's "next attempt" is the odds the next policy will hold.
    expect(failed.nextSuccessPercent).toBe(learned.successPercent);

    const thermal = wearing({ suit: 'thermal' });
    const geared = policy(venus, { capabilities: thermal });
    expect(geared.globalGearBonus).toBe(10);
    expect(geared.familyGearBonus).toBe(30);
    expect(geared.successPercent).toBe(Math.min(100, base.successPercent + 40));
    const mars = policy(world(134), { capabilities: thermal });
    expect(mars.globalGearBonus).toBe(10);
    expect(mars.familyGearBonus).toBe(0);

    const guaranteed = policy(venus, { capabilities: wearing({ module: 'anchor' }) });
    expect(guaranteed.landingGuaranteed).toBe(true);
    expect(guaranteed.successPercent).toBe(100);
    expect(resolveDescentAttemptV1(guaranteed, draws(0.999_999, 0.999), 9))
      .toMatchObject({ kind: 'landed', hpAfter: 9, persistenceOutcome: 'success' });
  });

  it('takes its two draws once and clears the learned approach on success', () => {
    const mars = world(134);
    const approach = policy(mars, { waveOffs: createLegacyDescentWaveOffStateV1([[134, 2]]) });
    expect(approach.requiredDomains).toEqual(DESCENT_OUTCOME_DOMAINS_V1);
    const first = resolveDescentAttemptV1(approach, draws(0, 0.999), 12);
    expect(resolveDescentAttemptV1(approach, draws(0, 0.999), 12)).toEqual(first);
    expect(first).toMatchObject({
      kind: 'landed', navigation: 'surface', drawsConsumed: 2, damage: 0, hpBefore: 12, hpAfter: 12,
      waveOffCountBefore: 2, waveOffCountAfter: 0, persistenceOutcome: 'success',
    });
    expect(() => resolveDescentAttemptV1(approach, draws(0, 0.999).slice(0, 1), 12)).toThrow(/draw count/);
  });

  it('keeps a failure in orbit, applies worn struts, and never takes the last point of health', () => {
    const venus = world(132);
    const approach = policy(venus, { capabilities: wearing({ module: 'stabil' }) });
    const outcome = resolveDescentAttemptV1(approach, draws(0.999, 0.999), 4);
    expect(outcome.kind).toBe('wave-off');
    if (outcome.kind !== 'wave-off') return;
    expect(outcome).toMatchObject({
      navigation: 'orbit', drawsConsumed: 2, hpBefore: 4, hpAfter: 1,
      gearAdjustedDamage: Math.max(0, outcome.rawDamage - 3),
      damage: 3, waveOffCountBefore: 0, waveOffCountAfter: 1, persistenceOutcome: 'failure',
    });
    expect(resolveDescentAttemptV1(approach, draws(0.999, 0.999), 1))
      .toMatchObject({ kind: 'wave-off', hpBefore: 1, hpAfter: 1, damage: 0 });
  });

  it('a reinforced hull takes 1 off the scrape of a wave-off (the painted port had dropped it)', () => {
    const venus = world(132);
    const bare = resolveDescentAttemptV1(policy(venus), draws(0.999, 0.999), 20);
    const hulled = resolveDescentAttemptV1(policy(venus, { reinforcedHull: true }), draws(0.999, 0.999), 20);
    expect(bare.kind === 'wave-off' && hulled.kind === 'wave-off' && bare.damage - hulled.damage).toBe(1);
  });

  it('a rolled landing on a world whose biome lands at 30 or less is Through the Fire; a gentler one is not', () => {
    const fire = resolveDescentAttemptV1(policy(world(132)), draws(0, 0), 9);
    expect(policy(world(132)).biomeLanding).toBeLessThanOrEqual(30);
    expect(fire).toMatchObject({ kind: 'landed', throughTheFire: true });
    expect(policy(world(134)).biomeLanding).toBeGreaterThan(30);
    expect(resolveDescentAttemptV1(policy(world(134)), draws(0, 0), 9)).toMatchObject({ kind: 'landed', throughTheFire: false });
    // A revisit of the same hostile world takes no roll and is announced by nothing.
    expect(resolveDescentAttemptV1(policy(world(132), { alreadyLanded: true }), [], 9)).toMatchObject({ kind: 'landed', throughTheFire: false });
  });

  it('the learned approach carries a world to 100: Venus, base 30, after its fourth wave-off', () => {
    const venus = world(132);
    expect(policy(venus).baseSuccessPercent).toBe(30);
    const three = policy(venus, { waveOffs: createLegacyDescentWaveOffStateV1([[132, 3]]) });
    expect(three.successPercent).toBe(90);
    expect(resolveDescentAttemptV1(three, draws(0.999, 0), 9)).toMatchObject({ kind: 'wave-off', waveOffCountAfter: 4, nextSuccessPercent: 100 });
    expect(policy(venus, { waveOffs: createLegacyDescentWaveOffStateV1([[132, 5]]) }).successPercent).toBe(100);
  });

  it.each([
    ['earth', 133, {}, 'success', 0],
    ['training', 134, { trainingActive: true }, 'unchanged', 2],
    ['revisit', 134, { alreadyLanded: true }, 'success', 0],
  ] as const)('%s takes no draw, lands at 100 and leaves the learned approach as it should be', (
    reason, seed, options, persistenceOutcome, waveOffCountAfter,
  ) => {
    const address = world(seed);
    const approach = policy(address, { ...options, waveOffs: createLegacyDescentWaveOffStateV1([[address.planet.seed, 2]]) });
    expect(approach.safeReason).toBe(reason);
    expect(approach.successPercent).toBe(100);
    expect(approach.requiredDomains).toEqual([]);
    expect(resolveDescentAttemptV1(approach, [], 9)).toMatchObject({
      kind: 'landed', drawsConsumed: 0, hpAfter: 9, waveOffCountBefore: 2, waveOffCountAfter, persistenceOutcome,
    });
    expect(() => resolveDescentAttemptV1(approach, draws(0, 0), 9)).toThrow(/draw count/);
  });

  it('refuses copies of an address, a capability, a wave-off state or a policy, and malformed draws', () => {
    const mars = world(134);
    const input = {
      address: mars,
      opportunity: projectWorldOpportunity(mars),
      capabilities: wearing(),
      waveOffs: createEmptyDescentWaveOffStateV1(),
      stormActive: false, reinforcedHull: false, trainingActive: false, alreadyLanded: false,
    };
    expect(() => projectDescentApproachV1({ ...input, address: { ...mars } as never })).toThrow(/registered authorities/);
    expect(() => projectDescentApproachV1({ ...input, capabilities: { ...input.capabilities } as never })).toThrow(/registered authorities/);
    expect(() => projectDescentApproachV1({ ...input, waveOffs: { ...input.waveOffs } as never })).toThrow(/registered authorities/);
    expect(() => projectDescentApproachV1({ ...input, extra: 1 } as never)).toThrow(/registered authorities/);
    const approach = projectDescentApproachV1(input);
    expect(() => resolveDescentAttemptV1({ ...approach } as never, draws(0, 0), 8)).toThrow(/owner-projected/);
    expect(() => resolveDescentAttemptV1(approach, [
      { domain: DESCENT_DAMAGE_DOMAIN_V1, value: 0 },
      { domain: DESCENT_SUCCESS_DOMAIN_V1, value: 0 },
    ], 8)).toThrow(/required unit draw/);
  });
});
