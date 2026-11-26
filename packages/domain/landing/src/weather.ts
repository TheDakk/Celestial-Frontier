/* A world's weather spell and its weather events (LEGACY celestial-frontier.html, v1.8.9):
   - the token in force, which the season can turn from rain to snow: 13530;
   - the spell, one seeded roll per 90 seconds against the token's odds: 13531-13532; the token the scene is given
     is the one in force while its spell falls, else none: 13599;
   - the nine events and their captions: `wxEventFor` and `WX_EVENT_WORD` 11181-11198;
   - the words of the five tokens: 13094.

   The clock is an argument, in seconds. Pure: no clock, no entropy.

   TWO RULES ARE HELD HERE, AND NOTHING IN THIS PACKAGE CHOOSES BETWEEN THEM.
   The legacy descent prompt asks its own copy of the spell (`_descWx` 13402-13420), which leaves the season out:
   that is `legacyPromptWeather`. The legacy scene asks the rule with the season in it: that is `weatherNow`.
   Outside deep winter the two always agree. In deep winter on a rainy world the prompt rolls rain's odds (0.42) and
   says rain while the scene rolls snow's odds (0.58) and shows snow.

   A NAMED IMPROVEMENT, separate from the conversion, AWAITING DAKK'S WORD before the descent prompt is wired: the
   prompt asks `weatherNow` too, so prompt and scene agree. In deep winter on a rainy world that moves three things,
   not only the prompt's words:
   - the "storm in progress" line (13620) follows the snow the scene shows;
   - the storm's 5 off descent success (`descentFor` 13428-13430) is in force on snow's odds, 0.58, instead of
     rain's, 0.42: more often;
   - the prompt's weather event (13617) is asked with snow, so a terran world can show the ice storm (0.25) where
     the legacy prompt could show the tornado (0.14).
   Until he says, a caller that must match the legacy game exactly asks `legacyPromptWeather` for the prompt. */
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

/** The token falling on the world now, or null under a clear sky: the legacy scene's rule (13530-13532, 13599), and
    with the named improvement above the descent prompt's too. */
export function weatherNow(planet: { readonly seed: number; readonly type: string }, env: WorldEnvironment, seconds: number): WeatherToken | null {
  const token = effectiveWeather(env, seasonAt(planet, env, seconds));
  return weatherActive(planet.seed, token, seconds) ? token : null;
}

/** The storm the legacy descent prompt sees (`_descWx` 13402-13420): the world's base weather while its spell falls,
    with no season in it, so never snow on a rainy world. It decides the legacy prompt's "storm in progress" line,
    the 5 off descent success and the token of the prompt's event. */
export function legacyPromptWeather(planet: { readonly seed: number; readonly type: string }, env: WorldEnvironment, seconds: number): WeatherToken | null {
  return weatherActive(planet.seed, env.baseWeather, seconds) ? env.baseWeather : null;
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
