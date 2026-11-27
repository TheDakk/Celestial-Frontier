/* The census's readers over this game's own world generation, for seeded worlds that have no address: the lifted
   legacy modules and the mining rules a world's snapshot is built with. The descent belongs to the app, so its
   reader is handed in. Addressed worlds are read through the production snapshot, roster, descent policy and card
   instead (apps/game/test/census-support.ts). */
import { moonDescriptor } from '@cf/domain-descriptors';
import { biosphere, civilization } from '@cf/domain-ecology';
import { biomeComposition } from '@cf/domain-landing';
import { NO_WORLD_RULES, worldVeinsBySeed } from '@cf/domain-opportunity';
import { mulberry32 } from '@cf/domain-rand';
import { rarityRoll } from '@cf/domain-speciestraits';
import { biomeFor } from '@cf/domain-strays';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import type { CensusMixEntry, CensusMoon, CensusPlanet, CensusSources, CensusSurvey, CensusSystem } from './census.js';

/** The survey's first three readings, on the one stream the legacy card threads through them (LEGACY 5073-5078). */
export function surveyOf(planet: CensusPlanet, system: CensusSystem): CensusSurvey {
  const band = climateBand(planet.P, system, planet.orb);
  const random = mulberry32((planet.P.seed ^ 0x1234567) >>> 0);
  const life = biosphere(planet.P, system as { sol?: boolean }, band, random);
  const civ = civilization(planet.P, system, band, life, random);
  return { band, life, civ };
}

/** The mix of landing regions, as keys and shares. */
export function mixOf(planet: CensusPlanet, band: string): readonly CensusMixEntry[] | null {
  const mix = biomeComposition(planet.P as { seed: number; type: string; iceAmt?: number | null }, band);
  return mix === null ? null : mix.map(({ biome, pct }) => [biome.k, pct] as const);
}

/** A moon's type and name, as its card gives them. */
export function moonOf(planet: CensusPlanet, index: number): CensusMoon {
  const card = moonDescriptor(planet as unknown as Record<string, unknown>, index as unknown as Record<string, unknown>);
  return { type: String(card.sub), name: card.title };
}

export function gameCensusSources(descent: CensusSources['descent']): CensusSources {
  return {
    system: (starSeed) => systemFor(starSeed) as unknown as CensusSystem,
    survey: surveyOf,
    biome: (planet, band) => {
      const biome = biomeFor(planet.P, band);
      return biome !== null && typeof biome.k === 'string' ? biome.k : null;
    },
    mix: mixOf,
    descent,
    rarity: (planet) => rarityRoll(planet.P.seed, 3),
    veins: (planet, system, survey, biomeKey) => {
      const read = worldVeinsBySeed({
        planetSeed: planet.P.seed,
        planetType: planet.P.type,
        biosphereLevel: survey.life.level,
        biomeKey,
        earth: system.sol === true && planet.P.seed === 133,
        depthBoost: 0,
        tierCap: 14,
        // The census of seeds is the legacy record: no type's rules.
        rules: NO_WORLD_RULES,
      });
      return {
        rawTier: read.rawTier,
        tier: read.effectiveTier,
        deposits: read.deposits,
        biomeVein: read.biomeVein,
        cosmicVein: read.cosmicVein,
        exceptionalVein: read.exceptionalVein,
        reserve: read.reservePulls,
      };
    },
    moon: moonOf,
  };
}
