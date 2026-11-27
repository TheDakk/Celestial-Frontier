/* The census read through the paths that take the switches: what the game plays of every seeded world, given the
   rules its switches give that world (the descent odds, and the tier, veins and reserve), beside the legacy record
   of the same world. Outside every switched-on slice the two must be equal. */
import { worldVeinsBySeed } from '@cf/domain-opportunity';
import {
  WORLD_TYPES, censusFingerprint, inSlice, playRulesFor, stableText,
  type CensusWorld, type PlayRules, type WorldSwitches, type WorldTypeDefinition,
} from '@cf/domain-worldkinds';
import { descentOdds } from '../../apps/game/src/landing/descent-policy';
import { gameSources } from './census';

export interface PlayedCensus {
  readonly worlds: number;
  /** Worlds that were handed rules. */
  readonly ruled: number;
  /** Worlds inside a switched-on slice that play otherwise than their legacy record. */
  readonly changedInside: number;
  /** Worlds outside every switched-on slice that play otherwise than their legacy record: there must be none. */
  readonly changedOutside: number;
}

/** What the game plays of a world under these rules, in the census's own fields. */
export function played(world: CensusWorld, sol: boolean, rules: PlayRules | null): unknown {
  const { planet, survey } = world;
  const odds = descentOdds({
    planet: planet.P, band: survey.band, stormActive: false, waveOffCount: 0, gearBonus: 0, familyGearBonus: 0, landingGuaranteed: false,
    rules,
  });
  const veins = worldVeinsBySeed({
    planetSeed: planet.P.seed, planetType: planet.P.type, biosphereLevel: survey.life.level, biomeKey: world.biomeKey,
    earth: sol && planet.P.seed === 133, depthBoost: 0, tierCap: 14, rules,
  });
  return {
    biomeKey: odds.biomeKey,
    descent: { percent: odds.successPercent, damageMin: odds.damageMin, damageMax: odds.damageMax },
    lifeKey: rules === null || rules.lifeKey === 'parent' ? survey.life.key : rules.lifeKey,
    veins: {
      rawTier: veins.rawTier, tier: veins.effectiveTier, deposits: veins.deposits, biomeVein: veins.biomeVein,
      cosmicVein: veins.cosmicVein, exceptionalVein: veins.exceptionalVein, reserve: veins.reservePulls,
    },
    trickle: veins.trickle,
  };
}

const recorded = (world: CensusWorld): unknown =>
  ({ biomeKey: world.biomeKey, descent: world.descent, lifeKey: world.survey.life.key, veins: world.veins, trickle: null });

export function playedCensus(
  planets: number,
  switches: WorldSwitches,
  registry: readonly WorldTypeDefinition[] = WORLD_TYPES,
  rulesOf: typeof playRulesFor = playRulesFor,
): PlayedCensus {
  const counts = { worlds: 0, ruled: 0, changedInside: 0, changedOutside: 0 };
  censusFingerprint(gameSources(), planets, (entry) => {
    const sol = entry.system.sol === true;
    for (const world of entry.worlds) {
      const rules = rulesOf({ P: world.planet.P, band: world.survey.band, sol }, switches, registry);
      counts.worlds++;
      if (rules !== null) counts.ruled++;
      if (stableText(played(world, sol, rules)) === stableText(recorded(world))) continue;
      const inside = registry.some((type) => switches[type.key] && inSlice(type, world.planet.P, world.survey.band, sol));
      counts[inside ? 'changedInside' : 'changedOutside']++;
    }
  });
  return counts;
}
