/* Live home-ground worlds (2026-10-02): the world a live battle is fought on, built from the encounter's own world facts, routes the
 * painted arena set. With only the accepted temperate set registered every live battle draws the same plates as today; a registered
 * set for a biome is chosen for that biome's worlds. Outcome tests over real CF1 worlds (Sol and a deep-galaxy world) and all 43 biomes. */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { BIOME_PROFILE_KEYS_V1, type BiomeProfileKeyV1 } from '@cf/domain-biome-profile';
import { biomeFor } from '@cf/domain-strays';
import { systemFor } from '@cf/domain-worldgen';
import { ARENA_BIOME_WORLD_TYPE, ARENA_FALLBACK_ASSETS, ARENA_FALLBACK_SET_ID, ARENA_SETS, parseArenaSets, selectArena, type ArenaSetRow } from './battle2/arena-registry.js';
import { compileHabitatBattle } from './battle-habitat.js';
import { defaultArenaWorld, habitatFightMedium } from './battle2/habitat-arena.js';
import { civetRecord } from '../../../tools/motion-proof/fixtures.js';
import { surfaceWater, type PlanetType } from './biome-vista-surface.js';
import { earthDuelWorld, liveArenaWorld, liveBattleArena, liveSettlementEncounter, liveWorldSnapshot, type LiveWorldSnapshotV1 } from './battle2-live-worlds.js';
import { fnv1a32, liveArenaInput } from './battle2-wiring.js';
import DELIVERIES from '../../../tools/morph/arena-deliveries.json';

beforeAll(() => installCaptureHooks());

const SOL = { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 } } as const;
const EARTH = { ...SOL, planet: { seed: 133 } };
const DEEP = { galaxy: { seed: 2775120088, x: -15585.946043489894, y: -13862.482918268226 }, star: { seed: 510510541, x: -550.8509466005489, y: -8.055439678020775 }, planet: { seed: 3303620273 } };
const SOL_OTHERS = systemFor(SOL.star.seed).planets.map((p) => ({ ...SOL, planet: { seed: (p.P as { seed: number }).seed } })).filter((a) => a.planet.seed !== 133);
const snap = (biome: BiomeProfileKeyV1 | null, planetType = biome ? ARENA_BIOME_WORLD_TYPE[biome] : 'rocky', climateBand = 'temperate', key = `w|test|${biome}`): LiveWorldSnapshotV1 =>
  ({ key, address: { galaxy: { seed: 1, x: 0, y: 0 }, star: { seed: 2, x: 0, y: 0 }, planet: { seed: 3, ordinal: 0 } }, source: { planetSeed: 3, planetType, climateBand, biomeKey: biome } });
/* the routing mechanism is tested against the temperate-only registry (the state these invariants describe); the shipped registry is
 * pinned separately below (all 45 sets accepted by Dakk 2026-10-02, D29) */
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

/* The shipped registry: the temperate fallback, the first C132 registration (six ground + two water sets) and the 36 D29 sets Dakk accepted
 * 2026-10-02 — 45 sets, every one of the 43 biome families painted. In arena-deliveries.json order. */
const SHIPPED_IDS = [ARENA_FALLBACK_SET_ID, 'karst-cave', 'jungle-v2', 'marsh', 'savanna-v2', 'dunesea', 'tundra', 'freshwater-lake-v2', 'coral',
  'abyssal', 'abyssgreen', 'acidhaze', 'ammonia-v2', 'archipelago-v2', 'ashwaste', 'banded-v2', 'blueice', 'boulder-v3', 'canyon', 'carbon', 'cratered-v2',
  'cryogeyser-v2', 'crystalsteppe-v2', 'emberfield', 'fungal', 'geode', 'glacier', 'glass-v3', 'graben', 'hotglow', 'karst', 'magmasea-v2', 'mangrove-v2',
  'milksea-v2', 'obsidian', 'opensea', 'oxide-v2', 'packice-v2', 'saltflat', 'saltpan-r2', 'stormeye', 'stormsea-v2', 'sulfurdeck', 'swamp-v2', 'volcisle'] as const;
const SHIPPED_WATER = [['freshwater-lake-v2', 'temperate'], ['coral', 'coral'], ['abyssal', 'abyssal'], ['milksea-v2', 'milksea'], ['opensea', 'opensea'], ['stormsea-v2', 'stormsea']];
/** Every way the shipped registry can be wrong, named (empty = the pin holds). Run on the shipped rows and on mutants of them. */
function shippedPinFailures(sets: readonly ArenaSetRow[]): string[] {
  const f: string[] = [];
  if (JSON.stringify(sets.map((s) => s.id)) !== JSON.stringify(SHIPPED_IDS)) f.push('ids differ from the 45 accepted sets');
  if (JSON.stringify(sets.map((s) => s.delivery)) !== JSON.stringify(DELIVERIES.deliveries)) f.push('rows are not arena-deliveries.json, in order');
  if (JSON.stringify(sets.filter((s) => s.medium === 'water').map((s) => [s.id, s.biome])) !== JSON.stringify(SHIPPED_WATER)) f.push('water sets differ');
  for (const b of BIOME_PROFILE_KEYS_V1) {
    if (!sets.some((s) => s.biome === b)) f.push(`biome family ${b} has no set`);
    const own = sets.filter((s) => s.biome === b && s.medium === 'ground').map((s) => s.id);
    const r = route('pin-' + b, liveBattleArena('pin-' + b, liveSettlementEncounter('fauna', snap(b))), sets);
    // the painted water sets by the pinned list, not by the rows' own medium (so a medium-blind registry cannot hide one)
    if (r.set.medium !== 'ground' || SHIPPED_WATER.some(([id]) => id === r.set.id)) f.push(`${b}: a ground fight drew the water set ${r.set.id}`);
    else if (own.length && !own.includes(r.set.id)) f.push(`${b}: a ground fight drew ${r.set.id}, not its own ${own.join('/')}`);
    else if (!own.length && r.match !== 'kin') f.push(`${b}: no ground set of its own, yet match ${r.match} (${r.set.id})`);
  }
  return f;
}

describe('the shipped arena registry (C132 arenas, Dakk 2026-10-02; all 45 sets with D29)', () => {
  it('registers exactly the 45 accepted sets in arena-deliveries.json order; every biome family has a set; a ground fight on each biome draws its own ground set (a water-only ocean biome: a ground kin)', () => {
    expect(ARENA_SETS.map((s) => s.id)).toEqual(SHIPPED_IDS);
    expect(ARENA_SETS).toHaveLength(45); expect(DELIVERIES.deliveries).toHaveLength(45);
    expect(new Set(ARENA_SETS.map((s) => s.biome))).toEqual(new Set(BIOME_PROFILE_KEYS_V1));
    expect(ARENA_SETS.filter((s) => s.medium === 'water').map((s) => [s.id, s.biome])).toEqual(SHIPPED_WATER);
    expect(shippedPinFailures(ARENA_SETS)).toEqual([]);
    // the biome with two ground sets (karst: karst-cave, karst) draws one of them, stable per world
    const k = route('b-karst', liveBattleArena('b-karst', liveSettlementEncounter('fauna', snap('karst'))), ARENA_SETS);
    expect(['karst-cave', 'karst']).toContain(k.set.id); expect(k.match).toBe('biome');
    // Earth still never routes to a painted biome set
    expect(route('b-earth', liveBattleArena('b-earth', liveSettlementEncounter('fauna', liveWorldSnapshot(EARTH))), ARENA_SETS).set.id).toBe(ARENA_FALLBACK_SET_ID);
  });
  it('negative controls: the pin fails, by name, on a dropped set, a reordered registry, a mislabelled biome and a medium-blind registry', () => {
    const reparse = (rows: readonly object[]) => parseArenaSets({ schema: 'cf.arena-sets/v1', sets: rows });
    expect(shippedPinFailures(reparse(ARENA_SETS.filter((s) => s.id !== 'canyon')))).toEqual(expect.arrayContaining(['ids differ from the 45 accepted sets', 'biome family canyon has no set']));
    expect(shippedPinFailures(reparse([...ARENA_SETS].reverse()))).toEqual(expect.arrayContaining(['rows are not arena-deliveries.json, in order']));
    expect(shippedPinFailures(reparse(ARENA_SETS.map((s) => (s.id === 'canyon' ? { ...s, biome: 'dunesea' } : s))))).toEqual(expect.arrayContaining(['biome family canyon has no set']));
    const blind = shippedPinFailures(reparse(ARENA_SETS.map((s) => ({ ...s, medium: 'ground' }))));
    expect(blind).toContain('water sets differ'); expect(blind.some((m) => /^(coral|opensea|abyssal|milksea|stormsea): a ground fight drew /.test(m)), blind.join('; ')).toBe(true);
  });
  // the fight's medium from the habitat compiler on the live world, exactly as the wiring computes it
  const land = civetRecord(), swimmer = { ...civetRecord(), habitat: { realm: 'aquatic' as const, source: 'test: declared swimmer' } };
  const fightOn = (biome: BiomeProfileKeyV1, left: typeof land, right: typeof land, sets: readonly ArenaSetRow[] = ARENA_SETS) => {
    const live = liveBattleArena('b-' + biome, liveSettlementEncounter('fauna', snap(biome)));
    const m = habitatFightMedium({ contextId: 'b-' + biome, seed: live.arenaContext.seed, world: live.worlds!.home, groundLineY: 0.78, left: { record: left, genome: null }, right: { record: right, genome: null } });
    return { m, r: selectArena({ contextId: 'b-' + biome, ...live.arenaContext, worlds: live.worlds, medium: m.medium }, sets), world: live.worlds!.home };
  };
  /* the medium MECHANISM over a FIXED subset (the first C132 registration: no ocean ground set, so the coral land fight's fallback and its
   * reason stay exercised); the shipped 45-set registry is checked by the next test */
  const NINE = SHIPPED_IDS.slice(0, 9).map((id) => ARENA_SETS.find((s) => s.id === id)!);
  it('a LAND fight on a temperate or coral world never draws a water set; a SWIMMER fight there draws its painted water set (fixed subset)', () => {
    for (const [biome, wet] of [['temperate', 'freshwater-lake-v2'], ['coral', 'coral']] as const) {
      const dry = fightOn(biome, land, land, NINE);
      expect(dry.m.medium, dry.m.reason).toBe('ground'); expect(dry.r.set.medium).toBe('ground'); expect(dry.r.set.id).not.toBe(wet);
      const mixed = fightOn(biome, swimmer, land, NINE); // a swimmer facing a land fighter: the land fighter keeps its floor (half lake), never underwater
      expect(mixed.r.set.medium, `${biome}: ${mixed.m.reason}`).toBe('ground');
      const fish = fightOn(biome, swimmer, swimmer, NINE);
      expect(fish.world.liquid).toBe('water'); expect(fish.m.medium, fish.m.reason).toBe('water');
      expect(fish.r.set.id).toBe(wet); expect(fish.r.match).toBe('biome'); expect(fish.r.reason).toMatch(/water fight/);
    }
    // the temperate land fight keeps the accepted temperate plates; the coral land fight falls back (no ocean ground set) and names the water set it skipped
    expect(fightOn('temperate', land, land, NINE).r.set.id).toBe(ARENA_FALLBACK_SET_ID);
    expect(fightOn('coral', land, land, NINE).r).toMatchObject({ match: 'fallback', set: { id: ARENA_FALLBACK_SET_ID } });
    expect(fightOn('coral', land, land, NINE).r.reason).toMatch(/not a water fight: the water set coral is drawn only when both combatants are in water/);
  });
  it('shipped (45 sets): on every world of a painted water set, a land or mixed fight draws a GROUND set; a swimmer fight draws that water set', () => {
    for (const [wet, biome] of SHIPPED_WATER as [string, BiomeProfileKeyV1][]) {
      const dry = fightOn(biome, land, land), mixed = fightOn(biome, swimmer, land), fish = fightOn(biome, swimmer, swimmer);
      expect(dry.m.medium, dry.m.reason).toBe('ground'); expect(dry.r.set.medium, biome).toBe('ground'); expect(dry.r.set.id).not.toBe(wet);
      expect(dry.r.reason, biome).toMatch(new RegExp(`not a water fight: the water sets? (.*, )?${wet}(, .*)? (is|are) drawn only when both combatants are in water`));
      expect(mixed.r.set.medium, `${biome}: ${mixed.m.reason}`).toBe('ground');
      expect(fish.world.liquid, biome).toBe('water'); expect(fish.m.medium, fish.m.reason).toBe('water');
      expect([fish.r.set.id, fish.r.match], biome).toEqual([wet, 'biome']); expect(fish.r.reason).toMatch(/water fight/);
    }
    // the ocean land fight now takes an ocean ground kin (archipelago, mangrove or volcanic isle), never the fallback
    expect(fightOn('coral', land, land).r).toMatchObject({ match: 'kin', set: { medium: 'ground' } });
    expect(ARENA_BIOME_WORLD_TYPE[fightOn('coral', land, land).r.set.biome]).toBe('ocean');
    expect(fightOn('temperate', land, land).r.set.id).toBe(ARENA_FALLBACK_SET_ID);
  });
  it('negative control: a medium-blind registry (the water rows relabelled ground) puts the land fighters underwater — the check sees it', () => {
    for (const sets of [NINE, ARENA_SETS]) {
      const blind = parseArenaSets({ schema: 'cf.arena-sets/v1', sets: sets.map((s) => ({ ...s, medium: 'ground' })) });
      expect(fightOn('coral', land, land, blind).r.set.id).toBe('coral');
      expect(fightOn('temperate', land, land, blind).r.set.id).toBeOneOf([ARENA_FALLBACK_SET_ID, 'freshwater-lake-v2']);
    }
    const blindShipped = parseArenaSets({ schema: 'cf.arena-sets/v1', sets: ARENA_SETS.map((s) => ({ ...s, medium: 'ground' })) });
    for (const [wet, biome] of SHIPPED_WATER.slice(1) as [string, BiomeProfileKeyV1][]) expect(fightOn(biome, land, land, blindShipped).r.set.id, biome).toBe(wet);
    // and without a water set for its biome or world type, a swimmer fight keeps the ground route with the procedural water, labelled:
    // over the subset that is the fallback; over the shipped ground sets, the coral world's ocean ground kin
    const fish = fightOn('coral', swimmer, swimmer, NINE.filter((s) => s.medium === 'ground'));
    expect(fish.m.medium).toBe('water'); expect(fish.r.set.id).toBe(ARENA_FALLBACK_SET_ID); expect(fish.r.reason).toMatch(/procedural wet arena draws the water/);
    const fishShipped = fightOn('coral', swimmer, swimmer, ARENA_SETS.filter((s) => s.medium === 'ground'));
    expect(fishShipped.m.medium).toBe('water'); expect(fishShipped.r).toMatchObject({ match: 'kin', set: { medium: 'ground' } }); expect(fishShipped.r.reason).toMatch(/procedural wet arena draws the water/);
  });
});
