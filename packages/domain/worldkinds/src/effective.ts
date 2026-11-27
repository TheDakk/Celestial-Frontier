/* The effective world: what the game plays, once a new type's rules have been laid over the legacy game's record.

   The legacy record is never written. A world outside every switched-on slice comes back as it went in. Applied
   here: the type, its label, its own biome and a fixed landing, as the census of switches reads them. What a world
   plays by is `playRulesFor` (play.ts): the descent, the weather, the snapshot, the planner and the roster are each
   handed that. */
import type { CensusSystem, CensusWorld } from './census.js';
import { playRulesFor } from './play.js';
import { WORLD_TYPES, sliceOf } from './registry.js';
import type { PlanetNumbers, WorldTypeDefinition } from './rules.js';
import type { WorldSwitches, WorldTypeKey } from './switches.js';

/** A planet as the legacy rules have it: what the descent, the snapshot and the roster say today. */
export interface LegacyWorldFacts {
  readonly P: PlanetNumbers;
  readonly band: string;
  readonly sol: boolean;
  readonly biomeKey: string | null;
  /** A first landing: no storm, no wave-off, no gear. */
  readonly landing: { readonly percent: number; readonly damageMin: number; readonly damageMax: number };
  readonly lifeKey: string;
  readonly tier: number;
  readonly deposits: readonly string[];
  readonly biomeVein: string | null;
  readonly cosmicVein: string | null;
  readonly exceptionalVein: string | null;
  readonly reserve: number;
}

export interface EffectiveWorld extends LegacyWorldFacts {
  /** The new type the planet is of; null for a legacy world. */
  readonly type: WorldTypeKey | null;
  /** The type's label, once it has rules; null reads the legacy label. */
  readonly label: string | null;
}

/** The legacy facts of a world the census read. */
export function legacyFactsOf(world: CensusWorld, sol: boolean): LegacyWorldFacts {
  return {
    P: world.planet.P,
    band: world.survey.band,
    sol,
    biomeKey: world.biomeKey,
    landing: world.descent,
    lifeKey: world.survey.life.key,
    tier: world.veins.tier,
    deposits: world.veins.deposits,
    biomeVein: world.veins.biomeVein,
    cosmicVein: world.veins.cosmicVein,
    exceptionalVein: world.veins.exceptionalVein,
    reserve: world.veins.reserve,
  };
}

/** The world as the game plays it. The system is handed in for the rules that will read it; none does yet. */
export function effectiveWorld(
  world: LegacyWorldFacts,
  _sys: CensusSystem,
  switches: WorldSwitches,
  registry: readonly WorldTypeDefinition[] = WORLD_TYPES,
): EffectiveWorld {
  const type = sliceOf(world.P, world.band, world.sol, switches, registry);
  const rules = type === null ? null : playRulesFor(world, switches, registry);
  if (rules === null) return { ...world, type, label: null };
  const biomeKey = rules.biome === 'parent' ? world.biomeKey : rules.biome === null ? null : rules.biome.k;
  const fixed = rules.landing?.fixed;
  const landing = fixed === undefined ? world.landing : { percent: fixed.p, damageMin: fixed.lo, damageMax: fixed.hi };
  return { ...world, type, label: rules.label, biomeKey, landing };
}
