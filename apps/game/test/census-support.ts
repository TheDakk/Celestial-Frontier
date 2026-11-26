/* The census read through the game's production paths, for worlds that have an address: the opportunity snapshot
   (band, life, biome, tiers, deposits, veins, reserve), the roster (life, band, biome profile), the descent policy
   (odds, damage rung, biome) and the survey card (life, civilisation, title, spectral class). Nothing here works a
   number out for itself: a field the production path gets wrong is wrong in the line.
   fixtures/v1/recorded/census-addressed.json holds the legacy game's lines; tools/census.mjs wrote it. */
import { planetDescriptorAtEcologyEpoch } from '@cf/domain-descriptors';
import { createEmptyDescentWaveOffStateV1, projectWorldOpportunity, type WorldOpportunitySnapshot } from '@cf/domain-opportunity';
import { rarityRoll } from '@cf/domain-speciestraits';
import { systemFor } from '@cf/domain-worldgen';
import { mixOf, moonOf, type CensusPlanet, type CensusSources, type CensusSystem } from '@cf/domain-worldkinds';
import { resolveCF1WorldAddress } from '@cf/scene';
import { projectDescentApproachV1, type DescentApproachPolicyV1 } from '../src/landing';
import { canonicalWorldRoster, type CanonicalWorldRoster } from '../src/world';
import { wearing } from './descent-support';

export interface CensusPlace {
  readonly galaxy: { readonly seed: number; readonly x: number; readonly y: number };
  readonly star: { readonly seed: number; readonly x: number; readonly y: number };
}

interface Produced {
  readonly snapshot: WorldOpportunitySnapshot;
  readonly roster: CanonicalWorldRoster;
  readonly policy: DescentApproachPolicyV1;
  readonly card: ReturnType<typeof planetDescriptorAtEcologyEpoch>;
}

const CARD_ROWS = new Set(['Life', 'Civilization', 'Tech era', 'Local year', 'Population']);

/** The census's readers over the production paths, for the stars of these places. */
export function productionCensusSources(places: readonly CensusPlace[]): CensusSources {
  const placeOf = new Map(places.map((place) => [place.star.seed, place]));
  const starOf = new WeakMap<CensusSystem, number>();
  const produced = new WeakMap<CensusPlanet, Produced>();
  const capabilities = wearing();
  const waveOffs = createEmptyDescentWaveOffStateV1();

  const produce = (planet: CensusPlanet, system: CensusSystem): Produced => {
    const place = placeOf.get(starOf.get(system) ?? -1);
    if (place === undefined) throw new Error('the production census reads only the stars it was given a place for');
    const resolved = resolveCF1WorldAddress({ galaxy: place.galaxy, star: place.star, planet: { seed: planet.P.seed } });
    if (!resolved.ok) throw new Error(`a world did not resolve: ${resolved.reason}`);
    const address = resolved.address;
    const snapshot = projectWorldOpportunity(address);
    const roster = canonicalWorldRoster(address, 0);
    if (!roster.ok) throw new Error(`a roster was refused: ${roster.message}`);
    const policy = projectDescentApproachV1({
      address, opportunity: snapshot, capabilities, waveOffs, stormActive: false, reinforcedHull: false, trainingActive: false, alreadyLanded: false,
    });
    const card = planetDescriptorAtEcologyEpoch(planet.P, system, planet as unknown as Record<string, unknown>, 0);
    const made = { snapshot, roster: roster.roster, policy, card };
    produced.set(planet, made);
    return made;
  };
  const of = (planet: CensusPlanet): Produced => {
    const made = produced.get(planet);
    if (made === undefined) throw new Error('a world is surveyed before it is read');
    return made;
  };

  return {
    system: (starSeed) => {
      const system = systemFor(starSeed) as unknown as CensusSystem;
      starOf.set(system, starSeed);
      return system;
    },
    survey: (planet, system) => {
      const { snapshot, card } = produce(planet, system);
      return {
        band: snapshot.source.climateBand,
        life: { key: snapshot.source.biosphereKey, level: snapshot.source.biosphereLevel },
        civ: { civ: card.rows.some((row) => row[0] === 'Tech era') },
      };
    },
    biome: (planet) => of(planet).snapshot.source.biomeKey,
    mix: mixOf,
    descent: (planet) => {
      const { policy } = of(planet);
      return { percent: policy.baseSuccessPercent, damageMin: policy.damageMin, damageMax: policy.damageMax };
    },
    rarity: (planet) => rarityRoll(planet.P.seed, 3),
    veins: (planet) => {
      const { snapshot } = of(planet);
      return {
        rawTier: snapshot.rawTier,
        tier: snapshot.effectiveTier,
        deposits: snapshot.deposits,
        biomeVein: snapshot.biomeVein,
        cosmicVein: snapshot.cosmicVein,
        exceptionalVein: snapshot.exceptionalVein,
        reserve: snapshot.reservePulls,
      };
    },
    moon: moonOf,
    extras: (planet) => {
      const { snapshot, roster, policy, card } = of(planet);
      const designation = card.designation as { tier: number; label: string; name: string };
      return [
        ['type', snapshot.source.planetType], ['orbit', snapshot.source.orbitalDistance],
        ['descentBiome', policy.biomeKey],
        // A world with no biome of its own (Earth) is given its type's profile; the legacy game has no such key.
        ['rosterBiome', snapshot.source.biomeKey === null ? null : roster.biomeProfileKey],
        ['rosterLife', roster.biosphereKey], ['rosterBand', roster.climateBand],
        ['card', card.rows.filter((row) => CARD_ROWS.has(row[0])).map((row) => [row[0], row[1]])], ['title', card.title],
        ['spectral', [designation.tier, designation.label, designation.name]],
      ];
    },
  };
}
