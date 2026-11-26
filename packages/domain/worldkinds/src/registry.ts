/* The thirteen new world types, and the questions the game asks of them. A switch that is off answers as if its
   type were not there. A type's file is the only place its rules live. */
import type { CensusSystem } from './census.js';
import type { BodyRecord, PlanetNumbers, WorldRules, WorldTypeDefinition } from './rules.js';
import type { WorldSwitches, WorldTypeKey } from './switches.js';
import { artefact } from './types/artefact.js';
import { double } from './types/double.js';
import { dwarf } from './types/dwarf.js';
import { eccentric } from './types/eccentric.js';
import { greatMoon } from './types/greatMoon.js';
import { hycean } from './types/hycean.js';
import { iceGiant } from './types/iceGiant.js';
import { megaEarth } from './types/megaEarth.js';
import { protoplanet } from './types/protoplanet.js';
import { rogue } from './types/rogue.js';
import { shattered } from './types/shattered.js';
import { smallBody } from './types/smallBody.js';
import { trojan } from './types/trojan.js';

/** In the order of `WORLD_TYPE_KEYS`. */
export const WORLD_TYPES: readonly WorldTypeDefinition[] = Object.freeze([
  iceGiant, hycean, megaEarth, dwarf, rogue, double, greatMoon, trojan, protoplanet, shattered, smallBody, artefact, eccentric,
]);

/** How many of a slice's steps a planet passes, in order, stopping at the first it fails. */
export function sliceStepsPassed(type: WorldTypeDefinition, P: PlanetNumbers, band: string, sol: boolean): number {
  if (type.slice === null) return 0;
  let passed = 0;
  while (passed < type.slice.length && type.slice[passed]!.test(P, band, sol)) passed++;
  return passed;
}

/** Whether a planet is in a type's slice, whatever the switches say. */
export function inSlice(type: WorldTypeDefinition, P: PlanetNumbers, band: string, sol: boolean): boolean {
  return type.slice !== null && sliceStepsPassed(type, P, band, sol) === type.slice.length;
}

/** A copy a type cannot write to, all the way down: what the legacy game made is never handed out itself. */
function shown<T>(value: T): T {
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return Object.freeze(value.map(shown)) as T;
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shown(inner)]))) as T;
}

function sliceType(
  P: PlanetNumbers, band: string, sol: boolean, switches: WorldSwitches, registry: readonly WorldTypeDefinition[],
): WorldTypeDefinition | null {
  const asked = registry.filter((type) => switches[type.key] && type.slice !== null);
  if (asked.length === 0) return null;
  const copy = shown(P);
  return asked.find((type) => inSlice(type, copy, band, sol)) ?? null;
}

/** The new type a planet is of: the first switched-on type whose slice holds it, or null. */
export function sliceOf(
  P: PlanetNumbers, band: string, sol: boolean, switches: WorldSwitches, registry: readonly WorldTypeDefinition[] = WORLD_TYPES,
): WorldTypeKey | null {
  return sliceType(P, band, sol, switches, registry)?.key ?? null;
}

/** The rule set a planet plays by; null is the legacy path, untouched. */
export function rulesFor(
  world: { readonly P: PlanetNumbers; readonly band: string; readonly sol: boolean },
  switches: WorldSwitches,
  registry: readonly WorldTypeDefinition[] = WORLD_TYPES,
): WorldRules | null {
  return sliceType(world.P, world.band, world.sol, switches, registry)?.rules ?? null;
}

/** The bodies the switched-on types add to a system, each from its own streams. */
export function extraBodies(
  starSeed: number, sys: CensusSystem, switches: WorldSwitches, registry: readonly WorldTypeDefinition[] = WORLD_TYPES,
): readonly BodyRecord[] {
  const asked = registry.filter((type) => switches[type.key] && type.bodies !== null);
  if (asked.length === 0) return [];
  const copy = shown(sys);
  return asked.flatMap((type) => type.bodies!(starSeed, copy));
}

/** The world of a starless sight of the galaxy map, when a switched-on type makes one. */
export function rogueBody(
  galaxySeed: number, deco: Readonly<Record<string, unknown>>, switches: WorldSwitches, registry: readonly WorldTypeDefinition[] = WORLD_TYPES,
): BodyRecord | null {
  for (const type of registry) {
    const body = switches[type.key] && type.rogue !== null ? type.rogue(galaxySeed, deco) : null;
    if (body !== null) return body;
  }
  return null;
}
