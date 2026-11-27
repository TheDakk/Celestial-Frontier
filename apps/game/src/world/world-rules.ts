/* The rules a world plays by: a new world type's, where the game's switches turn that type on and the world is in
   its slice; else none, and the world plays by the legacy rules, untouched. One answer for the descent, the
   weather, the snapshot, the roster and the card. */
import { climateBand } from '@cf/domain-surveyphrases';
import { systemFor } from '@cf/domain-worldgen';
import { playRulesFor, type PlanetNumbers, type PlayRules, type WorldSwitches } from '@cf/domain-worldkinds';
import type { CanonicalCF1WorldAddress } from '@cf/scene';
import { WORLD_SWITCHES } from './switches';

export function worldRulesAt(address: CanonicalCF1WorldAddress, switches: WorldSwitches = WORLD_SWITCHES): PlayRules | null {
  const system = systemFor(address.star.seed);
  const planet = system.planets[address.planet.ordinal];
  if (planet === undefined || planet.P.seed !== address.planet.seed) throw new Error('canonical world address no longer matches its source system');
  return playRulesFor({ P: planet.P as PlanetNumbers, band: climateBand(planet.P, system, planet.orb), sol: system.sol === true }, switches);
}
