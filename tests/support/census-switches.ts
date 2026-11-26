/* The census taken with new-type switches set: the legacy layer of every world, read after every type has been
   asked about it, and the effective layer of every world, compared with the switches off. */
import {
  SWITCHES_OFF, WORLD_TYPES, censusFingerprint, effectiveWorld, extraBodies, inSlice, legacyFactsOf, sliceOf, stableText,
  type CensusFingerprint, type WorldSwitches, type WorldTypeDefinition,
} from '@cf/domain-worldkinds';
import { gameSources } from './census';

export interface SwitchCensus {
  /** The legacy layer: the census fingerprint, each line read after the switched-on types saw its system and planet. */
  readonly legacy: CensusFingerprint;
  /** The planets inside each switched-on type's slice. */
  readonly inside: Readonly<Record<string, number>>;
  /** Worlds inside a switched-on slice whose effective layer differs from the one with every switch off. */
  readonly changedInside: number;
  /** Worlds outside every switched-on slice whose effective layer differs: there must be none. */
  readonly changedOutside: number;
  /** Worlds whose effective layer with every switch off is not their legacy record: there must be none. */
  readonly movedWhenOff: number;
  /** The bodies the switched-on types added. */
  readonly bodies: number;
}

export function switchCensus(
  planets: number,
  switches: WorldSwitches,
  registry: readonly WorldTypeDefinition[] = WORLD_TYPES,
  effective: typeof effectiveWorld = effectiveWorld,
): SwitchCensus {
  const game = gameSources();
  const inside: Record<string, number> = {};
  for (const type of registry) if (switches[type.key] && type.slice !== null) inside[type.key] = 0;
  const counts = { changedInside: 0, changedOutside: 0, movedWhenOff: 0, bodies: 0 };
  // Every type is asked before the line is written, so a type that writes what it was shown is seen in the line.
  const legacy = censusFingerprint({
    ...game,
    system: (starSeed) => {
      const system = game.system(starSeed);
      counts.bodies += extraBodies(starSeed, system, switches, registry).length;
      return system;
    },
    survey: (planet, system) => {
      const survey = game.survey(planet, system);
      sliceOf(planet.P, survey.band, system.sol === true, switches, registry);
      return survey;
    },
  }, planets, (entry) => {
    const sol = entry.system.sol === true;
    for (const world of entry.worlds) {
      const facts = legacyFactsOf(world, sol);
      const off = effective(facts, entry.system, SWITCHES_OFF, registry);
      const on = effective(facts, entry.system, switches, registry);
      if (stableText(off) !== stableText({ ...facts, type: null, label: null })) counts.movedWhenOff++;
      const members = registry.filter((type) => switches[type.key] && inSlice(type, world.planet.P, world.survey.band, sol));
      for (const type of members) inside[type.key] = (inside[type.key] ?? 0) + 1;
      // Which type a world is of is the slice itself; what it plays by is every other field.
      if (stableText({ ...on, type: null }) !== stableText(off)) counts[members.length > 0 ? 'changedInside' : 'changedOutside']++;
    }
  });
  return { legacy, inside, ...counts };
}
