/* A world's rule set worked out for that one world: plain numbers and names, with nothing left to roll. This is what
   the descent, the weather, the snapshot, the planner, the roster and the card are handed. A world outside every
   switched-on slice has none (null), and plays by the legacy rules, untouched. */
import { checkedWorldRules } from '@cf/domain-opportunity';
import { mulberry32 } from '@cf/domain-rand';
import { WORLD_TYPES, rulesFor } from './registry.js';
import type { PlanetNumbers, RuleBiome, WorldRules, WorldTypeDefinition } from './rules.js';
import { ownDraw } from './streams.js';
import type { WorldSwitches } from './switches.js';

export interface PlayRules extends Omit<WorldRules, 'biomes' | 'biomeStream' | 'life'> {
  /** The world's biome of the type's own set; 'parent' keeps the legacy biome; null is no biome. */
  readonly biome: RuleBiome | 'parent' | null;
  /** The world's life key under the type's rule; 'parent' keeps the legacy game's. */
  readonly lifeKey: string;
}

/** The biome of a type's own set for a seed, rolled on the type's own stream as the legacy picker rolls its own
    (LEGACY 13289-13291). */
function ownBiome(seed: number, rules: WorldRules & { biomes: readonly RuleBiome[] }): RuleBiome {
  if (rules.biomeStream === undefined) throw new Error('a type\'s biome set is rolled on its own stream: the rules name none');
  let v = ownDraw(seed, rules.biomeStream) * rules.biomes.reduce((total, biome) => total + biome.w, 0);
  for (const biome of rules.biomes) {
    v -= biome.w;
    if (v <= 0) return biome;
  }
  return rules.biomes[rules.biomes.length - 1]!;
}

/** A type's life rule reads the one value the legacy game's own life roll reads first (LEGACY 4944, 5075), as its
    own thin slices do (4954-4969): nested thresholds on it, so nothing new is drawn. Earth, the rest of Sol and
    seed 134 keep the legacy game's answer, which it gives before any roll (4945-4947). */
function lifeKey(rules: WorldRules, P: PlanetNumbers, band: string, sol: boolean): string {
  if (rules.life === 'parent' || sol || P.seed === 133 || P.seed === 134) return 'parent';
  if (rules.life === 'none') return 'none';
  return rules.life(mulberry32((P.seed ^ 0x1234567) >>> 0)(), band);
}

/** The rules one world plays by; null is the legacy path, untouched. */
export function playRulesFor(
  world: { readonly P: PlanetNumbers; readonly band: string; readonly sol: boolean },
  switches: WorldSwitches,
  registry: readonly WorldTypeDefinition[] = WORLD_TYPES,
): PlayRules | null {
  const rules = rulesFor(world, switches, registry);
  if (rules === null) return null;
  const { biomes, biomeStream: _stream, life: _life, ...rest } = rules;
  // Checked as it is made: a type file that says what the game cannot play is refused by name at its first world.
  return checkedWorldRules(Object.freeze({
    ...rest,
    biome: biomes === 'parent' || biomes === null ? biomes : ownBiome(world.P.seed, { ...rules, biomes }),
    lifeKey: lifeKey(rules, world.P, world.band, world.sol),
  }));
}
