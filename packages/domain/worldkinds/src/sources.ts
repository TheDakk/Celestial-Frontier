/* The census's readers over this game's own world generation: the lifted legacy modules and the mining rules a
   world's snapshot is built with. The descent belongs to the app, so its reader is handed in. */
import { moonDescriptor } from '@cf/domain-descriptors';
import { biosphere, civilization } from '@cf/domain-ecology';
import { worldVeinsBySeed } from '@cf/domain-opportunity';
import { mulberry32 } from '@cf/domain-rand';
import { biomeFor } from '@cf/domain-strays';
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import type { CensusPlanet, CensusSources, CensusSurvey, CensusSystem } from './census.js';

/** The survey's first three readings, on the one stream the legacy card threads through them (LEGACY 5073-5078). */
export function surveyOf(planet: CensusPlanet, system: CensusSystem): CensusSurvey {
  const band = climateBand(planet.P, system, planet.orb);
  const random = mulberry32((planet.P.seed ^ 0x1234567) >>> 0);
  const life = biosphere(planet.P, system as { sol?: boolean }, band, random);
  const civ = civilization(planet.P, system, band, life, random);
  return { band, life, civ };
}

export function gameCensusSources(descent: CensusSources['descent']): CensusSources {
  return {
    system: (starSeed) => systemFor(starSeed) as unknown as CensusSystem,
    survey: surveyOf,
    biome: (planet, band) => {
      const biome = biomeFor(planet.P, band);
      return biome !== null && typeof biome.k === 'string' ? biome.k : null;
    },
    descent,
    veins: (planet, system, survey, biomeKey) => {
      const read = worldVeinsBySeed({
        planetSeed: planet.P.seed,
        planetType: planet.P.type,
        biosphereLevel: survey.life.level,
        biomeKey,
        earth: system.sol === true && planet.P.seed === 133,
        depthBoost: 0,
        tierCap: 14,
      });
      return {
        tier: read.effectiveTier,
        deposits: read.deposits,
        biomeVein: read.biomeVein,
        cosmicVein: read.cosmicVein,
        exceptionalVein: read.exceptionalVein,
        reserve: read.reservePulls,
      };
    },
    moon: (planet, index) => {
      const card = moonDescriptor(planet as unknown as Record<string, unknown>, index as unknown as Record<string, unknown>);
      return { type: String(card.sub), name: card.title };
    },
  };
}
