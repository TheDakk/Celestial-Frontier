/* Live home-ground worlds (2026-10-02): the world a live battle is fought on, built from the encounter's own world facts, routes the
 * painted arena set. With only the accepted temperate set registered every live battle draws the same plates as today; a registered
 * set for a biome is chosen for that biome's worlds. Outcome tests over real CF1 worlds (Sol and a deep-galaxy world) and all 43 biomes. */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { BIOME_PROFILE_KEYS_V1, type BiomeProfileKeyV1 } from '@cf/domain-biome-profile';
import { biomeFor } from '@cf/domain-strays';
import { systemFor } from '@cf/domain-worldgen';
import { ARENA_BIOME_WORLD_TYPE, ARENA_FALLBACK_ASSETS, ARENA_FALLBACK_SET_ID, ARENA_SETS, selectArena, type ArenaSetRow } from './battle2/arena-registry.js';
import { compileHabitatBattle } from './battle-habitat.js';
import { defaultArenaWorld } from './battle2/habitat-arena.js';
import { surfaceWater, type PlanetType } from './biome-vista-surface.js';
import { earthDuelWorld, liveArenaWorld, liveBattleArena, liveSettlementEncounter, liveWorldSnapshot, type LiveWorldSnapshotV1 } from './battle2-live-worlds.js';
import { fnv1a32, liveArenaInput } from './battle2-wiring.js';

beforeAll(() => installCaptureHooks());

const SOL = { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 } } as const;
const EARTH = { ...SOL, planet: { seed: 133 } };
const DEEP = { galaxy: { seed: 2775120088, x: -15585.946043489894, y: -13862.482918268226 }, star: { seed: 510510541, x: -550.8509466005489, y: -8.055439678020775 }, planet: { seed: 3303620273 } };
const SOL_OTHERS = systemFor(SOL.star.seed).planets.map((p) => ({ ...SOL, planet: { seed: (p.P as { seed: number }).seed } })).filter((a) => a.planet.seed !== 133);
const snap = (biome: BiomeProfileKeyV1 | null, planetType = biome ? ARENA_BIOME_WORLD_TYPE[biome] : 'rocky', climateBand = 'temperate', key = `w|test|${biome}`): LiveWorldSnapshotV1 =>
  ({ key, address: { galaxy: { seed: 1, x: 0, y: 0 }, star: { seed: 2, x: 0, y: 0 }, planet: { seed: 3, ordinal: 0 } }, source: { planetSeed: 3, planetType, climateBand, biomeKey: biome } });
/* the routing mechanism is tested against the temperate-only registry (the state these invariants describe); the shipped registry is
 * pinned separately below (six C132 sets accepted by Dakk 2026-10-02) */
const TEMPERATE_ONLY = ARENA_SETS.filter((s) => s.id === ARENA_FALLBACK_SET_ID);
const route = (battleId: string, live: ReturnType<typeof liveBattleArena>, sets: readonly ArenaSetRow[] = TEMPERATE_ONLY) =>
  selectArena({ contextId: battleId, ...live.arenaContext, worlds: live.worlds, ...(live.worldPreset === 'earth' ? { earth: true } : {}) }, sets);

describe('live battle worlds from the encounter (battle2-live-worlds.ts)', () => {
  it('real worlds: Earth keeps the temperate set with the earth preset; every other world is its own generator biome on today\'s plates', () => {
    const earth = liveWorldSnapshot(EARTH)!;
    expect(earth).not.toBeNull(); expect(earth.source.biomeKey).toBeNull();
    const e = liveBattleArena('battle-earth', liveSettlementEncounter('fauna', earth));
    expect(e).toMatchObject({ worlds: null, worldPreset: 'earth', arenaContext: { kind: 'wild', round: 0, seed: fnv1a32('battle-earth') } });
    const er = route('battle-earth', e);
    expect(er.assets).toEqual(ARENA_FALLBACK_ASSETS); expect(er.reason).toBe("the wild creature's world is Earth (home world, no generator biome): accepted earth-temperate-v1 plates");
    const worlds = [...SOL_OTHERS, DEEP].map((a) => liveWorldSnapshot(a)!).filter(Boolean);
    expect(worlds.length).toBeGreaterThanOrEqual(5);
    const seen = new Set<string>();
    for (const w of worlds) {
      const live = liveBattleArena(`b-${w.key}`, liveSettlementEncounter('guardian', w));
      const world = live.worlds!.home;
      // the biome is the generator's own (`biomeFor` on the planet and its climate band), never invented
      expect(world.biome).toBe((biomeFor({ seed: w.source.planetSeed, type: w.source.planetType }, w.source.climateBand) as { k: string }).k);
      expect(world.liquid !== null).toBe(surfaceWater(w.source.planetType as PlanetType, w.source.climateBand) === 'liquid');
      expect(live.worlds!.visitor).toBe(world); expect(live.arenaContext.kind).toBe('guardian');
      const r = route(`b-${w.key}`, live);
      expect(r.set.id, w.key).toBe(ARENA_FALLBACK_SET_ID); expect(r.assets).toEqual(ARENA_FALLBACK_ASSETS); // byte-identical plates today
      expect(r.owner).toBe('lair'); expect(r.reason).toContain(`guardian's lair ${w.key} (${world.biome}`);
      seen.add(world.biome);
    }
    expect(seen.size).toBeGreaterThan(1);
    expect(liveWorldSnapshot({ ...SOL, planet: { seed: 1 } })).toBeNull(); expect(liveWorldSnapshot(undefined)).toBeNull(); // unresolvable → today's default
  });

  it('all 43 biomes: wild/guardian mapping, plates equal to the accepted temperate set, and Earth placement unchanged', () => {
    expect(liveSettlementEncounter('fauna', null).kind).toBe('wild');
    expect(liveSettlementEncounter('guardian', null).kind).toBe('guardian'); expect(liveSettlementEncounter('titan', null).kind).toBe('guardian');
    for (const b of BIOME_PROFILE_KEYS_V1) {
      const live = liveBattleArena('battle-x', liveSettlementEncounter('fauna', snap(b)));
      expect(live.worlds!.home.biome).toBe(b);
      const r = route('battle-x', live);
      expect(r.assets, b).toEqual(ARENA_FALLBACK_ASSETS); expect(r.world).toBe(live.worlds!.home);
    }
    // no biome (unknown type) → no worlds, as today
    expect(liveBattleArena('battle-x', liveSettlementEncounter('fauna', snap(null))).worlds).toBeNull();
    // Earth duel side: the accepted temperate world without a ground registration, the same physical facts as the default
    const { groundLineY: _g, ...dflt } = defaultArenaWorld(0.78);
    expect(earthDuelWorld()).toEqual(dflt);
  });

  it('a synthetic second registered set is chosen for its own biome (and as kin for its world type); the others stay on temperate', () => {
    const temperate = ARENA_SETS.find((s) => s.id === ARENA_FALLBACK_SET_ID)!;
    const canyon: ArenaSetRow = Object.freeze({ ...temperate, id: 'canyon-test-v1', biome: 'canyon', recipe: 'audits/CANYON_TEST/arena-recipe.json', far: 'audits/CANYON_TEST/arena-far.png', mid: 'audits/CANYON_TEST/keyed/arena-mid.png', near: 'audits/CANYON_TEST/keyed/arena-near.png' });
    const sets = [...TEMPERATE_ONLY, canyon];
    const at = (b: BiomeProfileKeyV1) => route('battle-y', liveBattleArena('battle-y', liveSettlementEncounter('fauna', snap(b))), sets);
    expect(at('canyon')).toMatchObject({ match: 'biome', set: { id: 'canyon-test-v1' } });
    expect(at('canyon').assets).toEqual({ recipe: '../CANYON_TEST/arena-recipe.json', far: '../CANYON_TEST/arena-far.png', mid: '../CANYON_TEST/keyed/arena-mid.png', near: '../CANYON_TEST/keyed/arena-near.png' });
    expect(at('dunesea')).toMatchObject({ match: 'kin', set: { id: 'canyon-test-v1' } });
    expect(at('packice').set.id).toBe(ARENA_FALLBACK_SET_ID); expect(at('temperate')).toMatchObject({ match: 'biome', set: { id: ARENA_FALLBACK_SET_ID } });
    // Earth never routes to a painted biome set, whatever is registered
    expect(route('battle-y', liveBattleArena('battle-y', liveSettlementEncounter('fauna', liveWorldSnapshot(EARTH))), sets).set.id).toBe(ARENA_FALLBACK_SET_ID);
  });

  it('duels: host and visitor alternate by round from the seeded first host (the habitat compiler\'s rule); Earth\'s side is temperate', () => {
    const host = snap('canyon', 'desert', 'hot', 'w|host'), visitor = liveWorldSnapshot(EARTH)!;
    const picks = [0, 1, 2, 3].map((round) => { const live = liveBattleArena('duel-1', { kind: 'duel', host, visitor, round }); const r = route('duel-1', live);
      const c = compileHabitatBattle({ contextId: 'duel-1', seed: live.arenaContext.seed, round, kind: 'duel', home: live.worlds!.home, visitor: live.worlds!.visitor, left: PH, right: PH });
      expect(c.worldKey).toBe(r.world!.key); return r.owner; });
    expect(new Set(picks)).toEqual(new Set(['host', 'visitor'])); expect(picks[0]).toBe(picks[2]); expect(picks[0]).not.toBe(picks[1]);
    expect(() => liveBattleArena('duel-1', { kind: 'duel', host, visitor, round: -1 })).toThrow(/round/);
  });

  it('deterministic: no clock or Math.random; the arena seed is the battle id\'s fnv1a32', () => {
    const now = vi.spyOn(Date, 'now'), rnd = vi.spyOn(Math, 'random');
    const w = liveWorldSnapshot(DEEP)!, a = liveBattleArena('battle-z', liveSettlementEncounter('fauna', w)), b = liveBattleArena('battle-z', liveSettlementEncounter('fauna', w));
    expect(now).not.toHaveBeenCalled(); expect(rnd).not.toHaveBeenCalled(); vi.restoreAllMocks();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b)); expect(a.arenaContext.seed).toBe(fnv1a32('battle-z'));
    expect(liveBattleArena('battle-q', liveSettlementEncounter('fauna', w)).arenaContext.seed).not.toBe(a.arenaContext.seed);
  });

  it('liveArenaInput (what main.ts spreads into the study): the settled encounter\'s world identity drives it end to end', () => {
    const settlement = (world: unknown, kind: string) => ({ battleId: 'battle-live', encounter: { defender: { battleGenome: {}, kind }, identity: { world } } });
    const deep = liveArenaInput(settlement(DEEP, 'titan'));
    expect(deep.arenaContext).toEqual({ kind: 'guardian', round: 0, seed: fnv1a32('battle-live') });
    expect(deep.worlds!.home).toEqual(liveArenaWorld(liveWorldSnapshot(DEEP)!)); expect(deep.worldPreset).toBeUndefined();
    expect(liveArenaInput(settlement(EARTH, 'fauna'))).toEqual({ worlds: null, arenaContext: { kind: 'wild', round: 0, seed: fnv1a32('battle-live') }, worldPreset: 'earth' });
    // no identity (an older settlement shape) or an unresolvable world: no worlds, exactly today's input
    expect(liveArenaInput({ battleId: 'battle-live', encounter: { defender: { battleGenome: {} } } })).toEqual({ worlds: null, arenaContext: { kind: 'wild', round: 0, seed: fnv1a32('battle-live') } });
  });
});
const PH = Object.freeze({ realm: 'land' as const, preferred: 'ground' as const, allowed: Object.freeze(['ground'] as const), source: 'test', liquid: null });

describe('the shipped arena registry (C132 arenas, Dakk 2026-10-02)', () => {
  it('registers the temperate set plus exactly the six accepted ground arenas; a world of each painted biome draws its own set', () => {
    expect(ARENA_SETS.map((s) => s.id)).toEqual([ARENA_FALLBACK_SET_ID, 'karst-cave', 'jungle-v2', 'marsh', 'savanna-v2', 'dunesea', 'tundra']);
    for (const row of ARENA_SETS.slice(1)) {
      const live = liveBattleArena('b-' + row.id, liveSettlementEncounter('fauna', snap(row.biome as BiomeProfileKeyV1)));
      expect(route('b-' + row.id, live, ARENA_SETS).set.id, row.biome).toBe(row.id);
    }
  });
});
