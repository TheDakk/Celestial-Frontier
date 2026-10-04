/** @module battle2-live-worlds [app] — the world a LIVE battle is fought on (2026-10-02, arena routing's "main.ts does not pass
 * `worlds` yet", audits/ARENA_ROUTING_20261001/README.md). Pure and clock-free: it turns the encounter's own world facts into the
 * painted stage's `worlds` + `arenaContext`, so `selectArena` (battle2/arena-registry.ts) routes every live fight to its home ground.
 *
 * - The world facts are the game's existing world opportunity snapshot (`@cf/domain-opportunity` `projectWorldOpportunity`):
 *   planet seed and type, climate band and the generator biome (`biomeFor`). Nothing is invented here; open water is the biome
 *   vista's own rule (`biome-vista-surface.ts` `surfaceWater`: liquid → water with a surface, frozen/none → no liquid).
 * - Every generated world has solid ground and air: the stage always paints a ground plane and sky, and refusing a ground fighter on
 *   a gas giant (or a flyer on an airless rock) would take away fights that play today. Applying those physical facts is a decision
 *   for Dakk, recorded in the routing README; this module does not make it.
 * - Wild (`fauna` defender) → the wild creature's world; Guardian/Titan → the lair, which is the encounter's world; a duel → host and
 *   visitor worlds, alternating by round from a seeded first host (the habitat compiler's rule, applied by `selectArena`).
 * - Earth (the canonical Sol cradle, seed 133) has no generator biome. An Earth fight keeps `worlds` null (the accepted temperate set
 *   and today's placement, byte for byte) with the `earth` preset: the wiring stages a side that lives in water on the existing lake
 *   world instead of refusing it. In a duel Earth's side is the accepted temperate world.
 * - The arena seed is fnv1a32(battle id), the wiring's own default — never a clock. */
import { BIOME_PROFILE_KEYS_V1, type BiomeProfileKeyV1 } from '@cf/domain-biome-profile';
import { isCanonicalEarthWorldAddress, projectWorldOpportunity, type WorldOpportunitySnapshot } from '@cf/domain-opportunity';
import { resolveCF1WorldAddress } from '@cf/scene';
import type { ArenaWorld } from './battle-habitat.js';
import { surfaceWater, type PlanetType } from './biome-vista-surface.js';
import type { ArenaKind } from './battle2/arena-registry.js';
import { defaultArenaWorld } from './battle2/habitat-arena.js';

/** The part of a world opportunity snapshot this module reads (structural, so tests pass plain facts). */
export interface LiveWorldSnapshotV1 {
  readonly key: string;
  readonly address: unknown;
  readonly source: Pick<WorldOpportunitySnapshot['source'], 'planetSeed' | 'planetType' | 'climateBand' | 'biomeKey'>;
}
export type LiveBattleEncounterV1 =
  | Readonly<{ kind: 'wild' | 'guardian'; world: LiveWorldSnapshotV1 | null }>
  | Readonly<{ kind: 'duel'; host: LiveWorldSnapshotV1 | null; visitor: LiveWorldSnapshotV1 | null; round: number }>;
export interface LiveBattleArenaV1 {
  readonly worlds: Readonly<{ home: ArenaWorld; visitor: ArenaWorld }> | null;
  readonly arenaContext: Readonly<{ kind: ArenaKind; round: number; seed: number }>;
  /** `earth`: an Earth fight (temperate set, lake world for a swimmer). Absent otherwise. */
  readonly worldPreset?: 'earth';
  /** Why these worlds (the stage reports `selectArena`'s own reason once it runs). */
  readonly source: string;
}

const BIOMES: ReadonlySet<string> = new Set(BIOME_PROFILE_KEYS_V1);
const PLANET_TYPES: ReadonlySet<string> = new Set(['terran', 'ocean', 'ice', 'desert', 'rocky', 'venus', 'lava', 'gas']);
/** FNV-1a 32, the wiring's `fnv1a32` (the default arena seed), repeated so this module stays free of the stage. */
const fnv = (s: string): number => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };

/** The encounter world's opportunity snapshot: the CF1 address is resolved by replaying the generator (never trusted as given) and
 * projected; anything that does not resolve gives null (the default arena, as today). */
export function liveWorldSnapshot(world: unknown): WorldOpportunitySnapshot | null {
  if (world === undefined || world === null) return null;
  try { const resolved = resolveCF1WorldAddress(world); return resolved.ok ? projectWorldOpportunity(resolved.address) : null; } catch { return null; }
}

export function isEarthWorld(snapshot: LiveWorldSnapshotV1): boolean { return isCanonicalEarthWorldAddress(snapshot.address); }

/** Earth as one side of a duel: the accepted temperate world, without a ground registration (a ground fighter stands on the plates' composed stand line). */
export function earthDuelWorld(): ArenaWorld {
  const { groundLineY: _ground, ...earth } = defaultArenaWorld(0.78);
  return Object.freeze(earth);
}

/** A generated world as the stage's ArenaWorld, or null when it has no live generator biome (Earth, or an unknown type). */
export function liveArenaWorld(snapshot: LiveWorldSnapshotV1): ArenaWorld | null {
  if (isEarthWorld(snapshot)) return null;
  const { planetSeed, planetType, climateBand, biomeKey } = snapshot.source;
  if (biomeKey === null || !BIOMES.has(biomeKey) || !PLANET_TYPES.has(planetType) || !Number.isSafeInteger(planetSeed)) return null;
  const water = surfaceWater(planetType as PlanetType, climateBand) === 'liquid';
  return Object.freeze({ key: snapshot.key, biome: biomeKey as BiomeProfileKeyV1, seed: planetSeed, solid: true, atmosphere: true,
    liquid: water ? 'water' : null, surfaceWater: water, signature: `${planetType} ${climateBand} ${biomeKey}`, cardHash: `${snapshot.key}#${biomeKey}` });
}

/** The live battle's worlds and arena context. Deterministic: the same battle id and worlds give the same answer. */
export function liveBattleArena(battleId: string, encounter: LiveBattleEncounterV1): LiveBattleArenaV1 {
  if (typeof battleId !== 'string' || !battleId) throw new TypeError('live battle arena: battle id required');
  const seed = fnv(battleId);
  if (encounter.kind === 'duel') {
    if (!Number.isInteger(encounter.round) || encounter.round < 0) throw new TypeError('live battle arena: duel round must be a non-negative integer');
    const side = (s: LiveWorldSnapshotV1 | null): ArenaWorld | null => s === null ? null : isEarthWorld(s) ? earthDuelWorld() : liveArenaWorld(s);
    const home = side(encounter.host), visitor = side(encounter.visitor), arenaContext = Object.freeze({ kind: 'duel' as const, round: encounter.round, seed });
    if (!home || !visitor) return Object.freeze({ worlds: null, arenaContext, source: 'duel: a world without a live biome; accepted temperate plates' });
    return Object.freeze({ worlds: Object.freeze({ home, visitor }), arenaContext, source: `duel: host ${home.key}, visitor ${visitor.key}` });
  }
  const arenaContext = Object.freeze({ kind: encounter.kind, round: 0, seed });
  if (encounter.world === null) return Object.freeze({ worlds: null, arenaContext, source: 'no world facts: accepted temperate plates' });
  if (isEarthWorld(encounter.world)) return Object.freeze({ worlds: null, arenaContext, worldPreset: 'earth' as const, source: 'Earth: accepted temperate plates, lake world for a swimmer' });
  const world = liveArenaWorld(encounter.world);
  if (!world) return Object.freeze({ worlds: null, arenaContext, source: `${encounter.world.key}: no live biome; accepted temperate plates` });
  return Object.freeze({ worlds: Object.freeze({ home: world, visitor: world }), arenaContext, source: `${encounter.kind === 'wild' ? 'wild world' : 'lair'} ${world.key} (${world.biome})` });
}

/** The settled conquest fight's encounter: a `fauna` defender is a wild fight, a Guardian or Titan fights in its lair (the encounter's
 * world). `world` is that world's opportunity snapshot, or null when it could not be projected. */
export function liveSettlementEncounter(defenderKind: string, world: LiveWorldSnapshotV1 | null): LiveBattleEncounterV1 {
  return Object.freeze({ kind: defenderKind === 'guardian' || defenderKind === 'titan' ? 'guardian' as const : 'wild' as const, world });
}
