import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  compileWorldLife, parseWorldLifeCard, WorldLifeRefusal, WORLD_LIFE_ARENA_DENSITY, WORLD_LIFE_STREAK_CAP,
  type WorldLifeCardV1, type WorldLifeWeatherV1,
} from '../apps/game/src/worldlife/index.js';

const EARTH_CARD = readFileSync(fileURLToPath(new URL('../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/system-card.txt', import.meta.url)), 'utf8');
const RECIPE_SEED = 593405465; // audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json
const TEMPERATE: WorldLifeCardV1 = { biome: 'temperate', weather: 'rain', water: 'liquid', timeOfDay: 'day' };
const card = (patch: Partial<WorldLifeCardV1>): WorldLifeCardV1 => ({ ...TEMPERATE, ...patch });
const refusal = (fn: () => unknown): string => {
  try { fn(); } catch (error) { if (error instanceof WorldLifeRefusal) return error.reason; throw error; }
  throw new Error('expected a WorldLifeRefusal');
};

describe('worldlife spec: system card', () => {
  it('reads the compiled Earth temperate rain card', () => {
    expect(parseWorldLifeCard(EARTH_CARD)).toEqual({ biome: 'temperate', weather: 'rain', water: 'liquid', timeOfDay: 'day', luminous: false });
    const spec = compileWorldLife(EARTH_CARD, RECIPE_SEED, 'landfall');
    expect(spec.card.strength).toBe('mild'); // profile 'mild' floor-raised by rain stays mild
    expect(spec.precipitation?.kind).toBe('rain');
    expect(spec.shimmer).not.toBeNull();
    expect(spec.sway.amplitude).toBe(0.5);
    expect(spec.fliers?.kind).toBe('bird');
    expect(spec.flicker).toBeNull();
  });
  it('refuses ambiguous, unknown or unreadable cards with named reasons', () => {
    expect(refusal(() => parseWorldLifeCard(EARTH_CARD + '\n  Light: night; clear'))).toBe('card-ambiguous');
    expect(refusal(() => compileWorldLife(EARTH_CARD.replace('weather rain', 'weather sleet'), 1, 'landfall'))).toBe('weather-unknown');
    expect(refusal(() => compileWorldLife(EARTH_CARD.replace('water liquid', 'water plasma'), 1, 'landfall'))).toBe('water-unknown');
    expect(refusal(() => compileWorldLife(EARTH_CARD.replace('climate temperate', 'climate lunar'), 1, 'landfall'))).toBe('biome-unknown');
    expect(refusal(() => parseWorldLifeCard(EARTH_CARD.replace('Light: day;', 'Light: noon;')))).toBe('time-of-day-unknown');
    expect(refusal(() => compileWorldLife(card({ weather: 'fog' as WorldLifeWeatherV1 }), 1, 'landfall'))).toBe('weather-unknown');
    expect(refusal(() => compileWorldLife(TEMPERATE, 1.5, 'landfall'))).toBe('seed-invalid');
    expect(refusal(() => compileWorldLife(TEMPERATE, 1, 'orbit' as 'arena'))).toBe('surface-unknown');
  });
});

describe('worldlife spec: weather mapping table', () => {
  const rows: readonly [WorldLifeWeatherV1, string | null, number][] = [
    ['rain', 'rain', 0.0018], ['snow', 'snow', 0.0013], ['dust', 'dust', 0.0015 * 1.35], ['ash', 'ash', 0.0011], ['haze', null, 0], [null, null, 0],
  ];
  for (const [weather, kind, density] of rows) {
    it(`${String(weather)} -> ${String(kind)} at density ${density}`, () => {
      const spec = compileWorldLife(card({ weather }), 7, 'landfall');
      expect(spec.precipitation?.kind ?? null).toBe(kind);
      expect(spec.precipitation?.density ?? 0).toBeCloseTo(density, 9);
      if (spec.precipitation) expect(spec.precipitation.field.length).toBe(spec.precipitation.count * 4);
    });
  }
  it('arena runs precipitation and drift at reduced density', () => {
    const land = compileWorldLife(TEMPERATE, 7, 'landfall'), arena = compileWorldLife(TEMPERATE, 7, 'arena');
    expect(arena.precipitation!.density).toBeCloseTo(land.precipitation!.density * WORLD_LIFE_ARENA_DENSITY, 12);
    expect(arena.precipitation!.requestedCount).toBeLessThan(land.precipitation!.requestedCount);
    expect(arena.drift.count).toBe(Math.round(land.drift.count * WORLD_LIFE_ARENA_DENSITY));
  });
  it('haze raises drift and dust carries dust colour', () => {
    expect(compileWorldLife(card({ weather: 'haze' }), 7, 'landfall').drift.count).toBeGreaterThan(compileWorldLife(card({ weather: null }), 7, 'landfall').drift.count);
    expect(compileWorldLife(card({ weather: 'dust' }), 7, 'landfall').drift.color).toBe(0xa99778);
  });
  it('sway amplitude follows weather strength', () => {
    const amp = (strength: WorldLifeCardV1['strength']) => compileWorldLife(card({ weather: null, ...(strength ? { strength } : {}) }), 7, 'landfall').sway;
    expect([amp('still').amplitude, amp('mild').amplitude, amp('wind').amplitude, amp('storm').amplitude]).toEqual([0.2, 0.5, 1.0, 1.4]);
    expect(amp('storm').frequencyBand).toEqual([0.6, 1.1]);
    expect(amp('storm').bands.map((b) => b.frequencyHz >= 0.6 && b.frequencyHz <= 1.1)).toEqual([true, true, true]);
    expect(compileWorldLife({ biome: 'stormsea', weather: 'rain', water: 'liquid', timeOfDay: 'night' }, 7, 'landfall').card.strength).toBe('storm');
    expect(compileWorldLife({ biome: 'geode', weather: 'dust', water: 'none', timeOfDay: 'day' }, 7, 'landfall').card.strength).toBe('wind');
  });
});

describe('worldlife spec: water, fliers, flicker, budget', () => {
  it('water none or frozen -> no shimmer and no swimmers', () => {
    expect(compileWorldLife(card({ water: 'none' }), 7, 'landfall').shimmer).toBeNull();
    expect(compileWorldLife(card({ water: 'frozen' }), 7, 'landfall').shimmer).toBeNull();
    expect(compileWorldLife({ biome: 'opensea', weather: null, water: 'none', timeOfDay: 'day' }, 7, 'landfall').fliers).toBeNull();
    expect(compileWorldLife({ biome: 'opensea', weather: null, water: 'liquid', timeOfDay: 'day' }, 7, 'landfall').fliers?.kind).toBe('swimmer');
  });
  it('fliers only for biomes whose families include bird, marine or fish; count seeded 0..3', () => {
    expect(compileWorldLife({ biome: 'geode', weather: null, water: 'liquid', timeOfDay: 'day' }, 7, 'landfall').fliers).toBeNull();
    expect(compileWorldLife({ biome: 'fungal', weather: null, water: 'liquid', timeOfDay: 'day' }, 7, 'landfall').fliers).toBeNull();
    const counts = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const f = compileWorldLife(TEMPERATE, seed, 'landfall').fliers!;
      expect(f.count).toBeGreaterThanOrEqual(0); expect(f.count).toBeLessThanOrEqual(3); expect(f.paths.length).toBe(f.count); counts.add(f.count);
    }
    expect(counts.size).toBeGreaterThan(1);
  });
  it('luminous flicker for fungal/milksea/geode or the luminous flag only', () => {
    expect(compileWorldLife({ biome: 'fungal', weather: null, water: 'none', timeOfDay: 'night' }, 7, 'landfall').flicker?.lights.length).toBe(6);
    expect(compileWorldLife({ biome: 'milksea', weather: null, water: 'liquid', timeOfDay: 'night' }, 7, 'arena').flicker?.lights.length).toBe(4);
    expect(compileWorldLife(card({ luminous: true }), 7, 'landfall').flicker).not.toBeNull();
    expect(compileWorldLife(TEMPERATE, 7, 'landfall').flicker).toBeNull();
  });
  it('streak count is capped per tier and the cap is recorded', () => {
    const storm = card({ strength: 'storm' });
    const desktop = compileWorldLife(storm, 7, 'landfall'), phone = compileWorldLife(storm, 7, 'landfall', { tier: 'phone' });
    expect(desktop.precipitation!.requestedCount).toBeGreaterThan(WORLD_LIFE_STREAK_CAP.desktop);
    expect(desktop.precipitation!.count).toBe(400); expect(desktop.precipitation!.overBudget).toBe(true);
    expect(phone.precipitation!.count).toBe(200); expect(phone.budget.streakCap).toBe(200);
    const mild = compileWorldLife(TEMPERATE, 7, 'landfall').precipitation!;
    expect(mild.overBudget).toBe(false); expect(mild.count).toBe(mild.requestedCount);
    expect(mild.count).toBeLessThanOrEqual(400);
  });
  it('same seed compiles byte-identically; different seeds differ', () => {
    expect(JSON.stringify(compileWorldLife(EARTH_CARD, RECIPE_SEED, 'arena'))).toBe(JSON.stringify(compileWorldLife(EARTH_CARD, RECIPE_SEED, 'arena')));
    expect(JSON.stringify(compileWorldLife(EARTH_CARD, RECIPE_SEED, 'arena'))).not.toBe(JSON.stringify(compileWorldLife(EARTH_CARD, RECIPE_SEED + 1, 'arena')));
  });
});
