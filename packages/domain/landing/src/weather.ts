/* A world's weather spell and its weather events (LEGACY celestial-frontier.html, v1.8.9):
   - the token in force, which the season can turn from rain to snow: 13530;
   - the spell, one seeded roll per 90 seconds against the token's odds: 13531-13532; the token the scene is given
     is the one in force while its spell falls, else none: 13599;
   - the nine events and their captions: `wxEventFor` and `WX_EVENT_WORD` 11181-11198;
   - the words of the five tokens: 13094.

   The clock is an argument, in seconds. Pure: no clock, no entropy.

   A NAMED IMPROVEMENT over the legacy game, separate from the conversion (Dakk, 2026-11-26): the legacy descent
   prompt asks its own copy of the spell (`_descWx` 13402-13420), which leaves the season out. In deep winter on a
   rainy world it rolls rain's odds and says rain while the scene rolls snow's odds and shows snow, so the prompt
   can warn of a storm the scene does not show, or stay silent under snowfall. `weatherNow` is the scene's rule;
   the prompt is to ask it too, so the two agree. Outside deep winter the two were always the same. */
import { mulberry32 } from '@cf/domain-rand';
import { seasonAt } from './environment.js';
import type { WeatherToken, WorldEnvironment } from './environment.js';

export type WeatherEvent =
  | 'tornado' | 'hurricane' | 'haboob' | 'icestorm' | 'cryoeruption' | 'virga' | 'volclightning' | 'firewhirl' | 'ironrain';

/** A spell lasts this long; whether it falls is rolled once per spell. */
export const WEATHER_SPELL_SECONDS = 90;

/** The chance that a spell of each token falls. */
export const WEATHER_ODDS: Readonly<Record<WeatherToken, number>> = { rain: 0.42, snow: 0.58, dust: 0.48, ash: 0.68, haze: 0.88 };

/** The scene's word for each token. */
export const WEATHER_WORD: Readonly<Record<WeatherToken, string>> = {
  rain: 'rain', snow: 'snowfall', dust: 'dust storm', ash: 'ashfall', haze: 'haze',
};

/** The caption of each event. */
export const WEATHER_EVENT_WORD: Readonly<Record<WeatherEvent, string>> = {
  tornado: 'a tornado on the horizon', hurricane: 'a hurricane wall closing in',
  haboob: 'a sand wall rolling in', icestorm: 'an ice storm glazing everything',
  cryoeruption: 'a cryogeyser in full eruption', virga: 'acid rain dying in the air',
  volclightning: 'volcanic lightning in the ash', firewhirl: 'fire whirls walking the fields',
  ironrain: 'iron rain glowing as it falls',
};

/** Below this season rain falls as snow. */
const DEEP_WINTER = -0.45;

const spellOf = (seconds: number): number => Math.floor(seconds / WEATHER_SPELL_SECONDS);

/** The token in force: the world's base weather, with rain turned to snow in deep winter. While it is snow, snow
    lies on the ground between falls. */
export function effectiveWeather(env: WorldEnvironment, season: number): WeatherToken | null {
  return env.baseWeather === 'rain' && season < DEEP_WINTER ? 'snow' : env.baseWeather;
}

/** Whether the spell is falling now: one seeded roll per 90 seconds against the token's odds. */
export function weatherActive(seed: number, token: WeatherToken | null, seconds: number): boolean {
  return token !== null && mulberry32((seed ^ 0x77EA ^ spellOf(seconds)) >>> 0)() < WEATHER_ODDS[token];
}

/** The token falling on the world now, or null under a clear sky: the one answer for the scene and for the descent
    prompt (see the named improvement above). */
export function weatherNow(planet: { readonly seed: number; readonly type: string }, env: WorldEnvironment, seconds: number): WeatherToken | null {
  const token = effectiveWeather(env, seasonAt(planet, env, seconds));
  return weatherActive(planet.seed, token, seconds) ? token : null;
}

/** The weather event in the sky now, if any: rarer than the spell, rolled once per 90 seconds, and honest to the
    world's type, the region and the token falling. A roll is drawn only where its condition holds, in this order.
    The legacy scene gives the region the landing rolled and the token falling; on a gas world, and in the descent
    prompt, it gives the world's anchor biome (12991-12992, 13617). */
export function weatherEventAt(
  planet: { readonly seed: number; readonly type: string },
  regionKey: string | null,
  activeToken: WeatherToken | null,
  seconds: number,
): WeatherEvent | null {
  const r = mulberry32((planet.seed ^ 0xE7E7 ^ spellOf(seconds)) >>> 0);
  switch (planet.type) {
    case 'lava':
      if (activeToken === 'ash' && r() < 0.5) return 'volclightning';
      return r() < 0.10 ? 'firewhirl' : null;
    case 'desert':
      return activeToken === 'dust' && r() < 0.5 ? 'haboob' : null;
    case 'ocean':
      if (regionKey === 'stormsea' && r() < 0.7) return 'hurricane';
      return activeToken === 'rain' && r() < 0.22 ? 'hurricane' : null;
    case 'terran':
      if (activeToken === 'rain' && r() < 0.14) return 'tornado';
      return activeToken === 'snow' && r() < 0.25 ? 'icestorm' : null;
    case 'ice':
      if (regionKey === 'cryogeyser' && r() < 0.6) return 'cryoeruption';
      return activeToken === 'snow' && r() < 0.2 ? 'icestorm' : null;
    case 'venus':
      return r() < 0.5 ? 'virga' : null;
    case 'gas':
      return regionKey === 'hotglow' && r() < 0.6 ? 'ironrain' : null;
    default:
      return null;
  }
}
