// A world's weather, season and time of day at a clock time, against the legacy game's own answers (LEGACY
// celestial-frontier.html: the environment and its use in openLandingVista 13508-13535 and 13599-13600, the descent
// prompt's storm _descWx 13402-13420, the weather events 11181-11198, the weather words 13094).
// fixtures/v1/recorded/landing-weather.json holds what that code returned; tools/record-v1-fixtures.mjs wrote it.
import { describe, expect, it, vi } from 'vitest';
import { loadRecorded } from '../../../../tests/support/v1-recorded.js';
import {
  WEATHER_EVENT_WORD, WEATHER_ODDS, WEATHER_SPELL_SECONDS, WEATHER_WORD,
  effectiveWeather, legacyPromptWeather, seasonAt, timeOfDayAt, weatherActive, weatherEventAt, weatherNow, worldEnvironment,
} from '@cf/domain-landing';
import type { TimeOfDay, WeatherEvent, WeatherToken } from '@cf/domain-landing';

/** [seconds, season, the token in force, whether it is falling, time of day, the legacy descent prompt's token,
    the event for regions none, stormsea, cryogeyser, hotglow]. */
type At = [number, number, WeatherToken | null, boolean, TimeOfDay, WeatherToken | null, Array<WeatherEvent | null>];
interface World {
  readonly group: 'world';
  readonly input: { seed: number; type: string; band: string };
  readonly env: { tilt: boolean; hasAtmo: boolean; hasField: boolean; wx: WeatherToken | null; ph: number; dayLen: number; yearLen: number };
  readonly at: At[];
}
interface Other { readonly group: 'words' | 'edge'; readonly output: Record<string, unknown> }
const recorded = loadRecorded('landing-weather').cases as Array<World | Other>;
const worlds = recorded.filter((c): c is World => c.group === 'world');
const output = (group: Other['group']): Record<string, unknown> => (recorded.find((c) => c.group === group) as Other).output;
const REGIONS = [null, 'stormsea', 'cryogeyser', 'hotglow'] as const;
const EARTH = { seed: 133, type: 'terran' };
const label = (w: World, a?: At): string => JSON.stringify(a ? { ...w.input, seconds: a[0] } : w.input);

describe("a world's fixed environment", () => {
  it('the fixture holds 8 world types in 4 bands for 8 seeds, each at 29 times', () => {
    expect(worlds.length).toBe(256);
    expect(worlds.every((w) => w.at.length === 29)).toBe(true);
  });

  it('every recorded environment is reproduced', () => {
    for (const w of worlds) {
      expect(worldEnvironment(w.input, w.input.band), label(w)).toEqual({
        tilt: w.env.tilt, hasAir: w.env.hasAtmo, hasField: w.env.hasField, baseWeather: w.env.wx,
        phase: w.env.ph, dayLen: w.env.dayLen, yearLen: w.env.yearLen,
      });
    }
  });

  it('the recorded environments of 1,001 seeds are reproduced for terran, ocean, gas and rocky worlds', () => {
    // fixtures/v1/recorded/landing-environment.json: enough seeds to hold the odds of a tilt and of a field
    // (LEGACY 13510, 13514) to about one part in 1,000.
    type Row = [number, boolean, boolean, boolean, WeatherToken | null, number, number, number];
    const sweeps = loadRecorded('landing-environment').cases as Array<{ input: { type: string; band: string }; output: Row[] }>;
    expect(sweeps.map((c) => [c.input.type, c.output.length])).toEqual([['terran', 1001], ['ocean', 1001], ['gas', 1001], ['rocky', 1001]]);
    for (const { input, output: rows } of sweeps) {
      const got = rows.map(([seed]) => {
        const env = worldEnvironment({ seed, type: input.type }, input.band);
        return [seed, env.tilt, env.hasAir, env.hasField, env.baseWeather, env.phase, env.dayLen, env.yearLen];
      });
      expect(got, input.type).toEqual(rows);
    }
  });

  it("Earth is tilted, shielded and rainy, with a day of 101.63 seconds and a year of 468.73", () => {
    const env = worldEnvironment(EARTH, 'temperate');
    expect([env.tilt, env.hasAir, env.hasField, env.baseWeather]).toEqual([true, true, true, 'rain']);
    expect(env.dayLen).toBeCloseTo(101.63445626851171, 12);
    expect(env.yearLen).toBeCloseTo(468.73212745413184, 12);
  });

  it('rocky and gas worlds have no weather token, and only a rocky world has no air', () => {
    for (const band of ['hot', 'temperate', 'cold', 'frozen']) {
      expect(worldEnvironment({ seed: 7, type: 'rocky' }, band).baseWeather).toBeNull();
      expect(worldEnvironment({ seed: 7, type: 'gas' }, band).baseWeather).toBeNull();
    }
    expect(worldEnvironment({ seed: 7, type: 'rocky' }, 'temperate').hasAir).toBe(false);
    expect(worldEnvironment({ seed: 7, type: 'gas' }, 'temperate').hasAir).toBe(true);
  });

  it('a terran world rains in a temperate band, hazes in a hot one and snows in the others', () => {
    const base = (band: string): unknown => worldEnvironment({ seed: 7, type: 'terran' }, band).baseWeather;
    expect(['temperate', 'hot', 'cold', 'frozen'].map(base)).toEqual(['rain', 'haze', 'snow', 'snow']);
  });
});

describe('the season', () => {
  it('every recorded season is reproduced', () => {
    for (const w of worlds) {
      const env = worldEnvironment(w.input, w.input.band);
      for (const a of w.at) expect(seasonAt(w.input, env, a[0]), label(w, a)).toBe(a[1]);
    }
  });

  it('a world with no tilt, a world with no air, a gas world and a venus world have no season', () => {
    const tilted = worldEnvironment(EARTH, 'temperate');
    expect(seasonAt(EARTH, tilted, 0)).not.toBe(0);
    expect(seasonAt(EARTH, { ...tilted, tilt: false }, 0)).toBe(0);
    expect(seasonAt(EARTH, { ...tilted, hasAir: false }, 0)).toBe(0);
    expect(seasonAt({ seed: 133, type: 'gas' }, tilted, 0)).toBe(0);
    expect(seasonAt({ seed: 133, type: 'venus' }, tilted, 0)).toBe(0);
  });

  it('the season comes round again after one year', () => {
    const env = worldEnvironment(EARTH, 'temperate');
    expect(seasonAt(EARTH, env, 100 + env.yearLen)).toBeCloseTo(seasonAt(EARTH, env, 100), 9);
    expect(seasonAt(EARTH, env, 100 + env.yearLen / 2)).toBeCloseTo(-seasonAt(EARTH, env, 100), 9);
  });

  it('rain is snow in deep winter and rain otherwise', () => {
    const env = worldEnvironment(EARTH, 'temperate');
    expect(effectiveWeather(env, -0.46)).toBe('snow');
    expect(effectiveWeather(env, -0.45)).toBe('rain');
    expect(effectiveWeather(env, 1)).toBe('rain');
  });

  it('only rain turns with the season', () => {
    expect(effectiveWeather(worldEnvironment({ seed: 7, type: 'desert' }, 'hot'), -1)).toBe('dust');
    expect(effectiveWeather(worldEnvironment({ seed: 7, type: 'terran' }, 'hot'), -1)).toBe('haze');
    expect(effectiveWeather(worldEnvironment({ seed: 7, type: 'rocky' }, 'hot'), -1)).toBeNull();
  });

  it('every recorded token in force is reproduced', () => {
    for (const w of worlds) {
      const env = worldEnvironment(w.input, w.input.band);
      for (const a of w.at) expect(effectiveWeather(env, seasonAt(w.input, env, a[0])), label(w, a)).toBe(a[2]);
    }
  });
});

describe('the weather spell', () => {
  it('every recorded spell is reproduced: falling or not', () => {
    for (const w of worlds) for (const a of w.at) expect(weatherActive(w.input.seed, a[2], a[0]), label(w, a)).toBe(a[3]);
  });

  it('the token falling now is the recorded one at every recorded time', () => {
    for (const w of worlds) {
      const env = worldEnvironment(w.input, w.input.band);
      for (const a of w.at) expect(weatherNow(w.input, env, a[0]), label(w, a)).toBe(a[3] ? a[2] : null);
    }
  });

  it('the spell changes only at a 90-second boundary', () => {
    expect(WEATHER_SPELL_SECONDS).toBe(90);
    for (const seed of [133, 131, 7, 8, 9]) {
      for (let bucket = 0; bucket < 30; bucket++) {
        const first = weatherActive(seed, 'rain', bucket * 90);
        expect(weatherActive(seed, 'rain', bucket * 90 + 89.999)).toBe(first);
        expect(weatherActive(seed, 'rain', bucket * 90 + 45)).toBe(first);
      }
    }
    const flags = Array.from({ length: 30 }, (_, bucket) => weatherActive(133, 'rain', bucket * 90));
    expect(new Set(flags).size).toBe(2);
  });

  it('no token, no spell', () => {
    for (let bucket = 0; bucket < 30; bucket++) expect(weatherActive(133, null, bucket * 90)).toBe(false);
  });

  it('the odds and the words are the recorded ones', () => {
    const words = output('words');
    expect(WEATHER_ODDS).toEqual(words.odds);
    expect(WEATHER_WORD).toEqual(words.weather);
  });

  it('over many spells each token falls about as often as its odds say', () => {
    for (const token of ['rain', 'snow', 'dust', 'ash', 'haze'] as const) {
      let falling = 0;
      for (let bucket = 0; bucket < 4000; bucket++) if (weatherActive(51464061, token, bucket * 90)) falling++;
      expect(Math.abs(falling / 4000 - WEATHER_ODDS[token]), token).toBeLessThan(0.03);
    }
  });
});

describe('the descent prompt and the scene agree (a named improvement over the legacy game)', () => {
  // LEGACY 13402-13420: the prompt's storm ignores the season, so in deep winter it rolls rain's odds (0.42) and
  // says rain while the scene rolls snow's (0.58) and shows snow. weatherNow is the scene's rule, for both.
  const deepWinter = (w: World, a: At): boolean => w.env.wx === 'rain' && a[2] === 'snow';

  it("the legacy prompt's own rule is kept, and gives the recorded prompt token at every recorded time", () => {
    for (const w of worlds) {
      const env = worldEnvironment(w.input, w.input.band);
      for (const a of w.at) expect(legacyPromptWeather(w.input, env, a[0]), label(w, a)).toBe(a[5]);
    }
  });

  it('outside deep winter the legacy prompt and the token falling now are the same at every recorded time', () => {
    let compared = 0;
    for (const w of worlds) {
      const env = worldEnvironment(w.input, w.input.band);
      for (const a of w.at) {
        if (deepWinter(w, a)) continue;
        expect(weatherNow(w.input, env, a[0]), label(w, a)).toBe(a[5]);
        compared++;
      }
    }
    expect(compared).toBe(7059);
  });

  it('in deep winter the legacy prompt never said snow; the token falling now is the snow the scene shows', () => {
    let winters = 0;
    let promptWrong = 0;
    for (const w of worlds) {
      const env = worldEnvironment(w.input, w.input.band);
      for (const a of w.at) {
        if (!deepWinter(w, a)) continue;
        winters++;
        expect(a[5] === null || a[5] === 'rain', label(w, a)).toBe(true);
        const now = weatherNow(w.input, env, a[0]);
        expect(now === null || now === 'snow', label(w, a)).toBe(true);
        if (now !== a[5]) promptWrong++;
      }
    }
    expect([winters, promptWrong]).toEqual([365, 255]);
  });
});

describe('the time of day', () => {
  it('every recorded time of day is reproduced', () => {
    for (const w of worlds) {
      const env = worldEnvironment(w.input, w.input.band);
      for (const a of w.at) expect(timeOfDayAt(env, a[0]), label(w, a)).toBe(a[4]);
    }
  });

  it('one day holds day, twilight and night, and comes round again', () => {
    const env = worldEnvironment(EARTH, 'temperate');
    const day = Array.from({ length: 100 }, (_, i) => timeOfDayAt(env, (i / 100) * env.dayLen));
    expect(new Set(day)).toEqual(new Set(['day', 'twilight', 'night']));
    expect(Array.from({ length: 100 }, (_, i) => timeOfDayAt(env, (i / 100 + 3) * env.dayLen))).toEqual(day);
  });
});

describe('the weather events', () => {
  it('every recorded event is reproduced, for no region and for the three regions that have their own', () => {
    for (const w of worlds) {
      for (const a of w.at) {
        const token = a[3] ? a[2] : null;
        expect(REGIONS.map((region) => weatherEventAt(w.input, region, token, a[0])), label(w, a)).toEqual(a[6]);
      }
    }
  });

  it('over 1,000 recorded spells each world shows each event in the recorded spells and no other', () => {
    // fixtures/v1/recorded/landing-weather-events.json: 4,000 rolls for each pair of region and token, so each
    // event's odds are held to about one part in 4,000.
    interface Sweep { input: { type: string; seed: number; region: string | null; token: WeatherToken | null }; output: Record<string, number[]> }
    const sweeps = loadRecorded('landing-weather-events').cases as Sweep[];
    expect(sweeps.length).toBe(80);
    for (const { input, output: want } of sweeps) {
      const got: Record<string, number[]> = {};
      for (let spell = 0; spell < 1000; spell++) {
        const event = weatherEventAt(input, input.region, input.token, spell * 90 + 45);
        if (event !== null) (got[event] ??= []).push(spell);
      }
      expect(got, JSON.stringify(input)).toEqual(want);
    }
  });

  it('all nine events occur in the recorded cases', () => {
    const seen = new Set(worlds.flatMap((w) => w.at.flatMap((a) => a[6])).filter((e) => e !== null));
    expect([...seen].sort()).toEqual(Object.keys(WEATHER_EVENT_WORD).sort());
  });

  it('the nine captions are the recorded words', () => {
    expect(WEATHER_EVENT_WORD).toEqual(output('words').events);
    expect(Object.keys(WEATHER_EVENT_WORD).length).toBe(9);
  });

  it('a rocky world has no event, and a calm terran sky has none', () => {
    for (let bucket = 0; bucket < 200; bucket++) {
      expect(weatherEventAt({ seed: 9, type: 'rocky' }, 'cratered', null, bucket * 90)).toBeNull();
      expect(weatherEventAt(EARTH, 'temperate', null, bucket * 90)).toBeNull();
    }
  });

  it('Earth sees tornadoes only in rain and ice storms only in snow', () => {
    const at = (token: WeatherToken): Set<unknown> =>
      new Set(Array.from({ length: 400 }, (_, bucket) => weatherEventAt(EARTH, 'temperate', token, bucket * 90)));
    expect(at('rain')).toEqual(new Set([null, 'tornado']));
    expect(at('snow')).toEqual(new Set([null, 'icestorm']));
  });
});

describe('the clock is an argument', () => {
  it('the same seconds give the same answers on a second call and after the functions are re-imported', async () => {
    const answers = (m: typeof import('@cf/domain-landing')): unknown[] => [133, 131, 1757105165].flatMap((seed) => {
      const planet = { seed, type: 'terran' };
      const env = m.worldEnvironment(planet, 'temperate');
      return [0, 89.5, 1234.5, 86400].map((t) => [
        env, m.seasonAt(planet, env, t), m.weatherNow(planet, env, t), m.timeOfDayAt(env, t), m.weatherEventAt(planet, null, 'rain', t),
      ]);
    });
    const first = answers(await import('@cf/domain-landing'));
    expect(answers(await import('@cf/domain-landing'))).toEqual(first);
    vi.resetModules();
    expect(answers(await import('@cf/domain-landing'))).toEqual(first);
  });

  it('no recorded season or light level sits within one part in a million of its threshold', () => {
    // Engines may round Math.sin and Math.cos differently; this close to a threshold another browser could differ.
    const edge = output('edge') as { season: number; day: number; twilight: number };
    expect(Math.min(edge.season, edge.day, edge.twilight)).toBeGreaterThan(1e-6);
  });
});
