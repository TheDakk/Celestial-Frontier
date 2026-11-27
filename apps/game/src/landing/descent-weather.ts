/* The storm the descent sees: whether one is in progress, its token, and the weather event beside it.

   LEGACY celestial-frontier.html, v1.8.9: the descent asks its own copy of the weather spell (`_descWx`
   13402-13420), takes 5 off the odds while it falls (`descentFor` 13428-13430), and the prompt shows the storm line
   and the event of that token over the world's anchor biome (`openDescentBox` 13617, 13620-13621).

   TWO RULES, AND THE DESCENT IS WIRED TO THE REPAIRED ONE (Dakk's ruling of 2026-11-26, a named improvement,
   separate from the conversion):
   - `repaired`: the descent sees the weather the landing scene will show (`weatherNow`: the season is in it, so
     rain falls as snow in deep winter). This is the default.
   - `legacy`: the legacy prompt's own rule (`legacyPromptWeather`: no season). Kept reachable and tested.
   The two agree everywhere but in deep winter (season below -0.45) on a world whose weather is rain, a temperate
   terran world or any ocean world with a tilted axis. There the same roll is read against snow's odds (0.58)
   instead of rain's (0.42), so:
   - where the legacy prompt saw a storm, the repaired one sees it too, as snow: the same 5 off, the same storm
     line; only the event can differ (on a terran world an ice storm, 1 spell in 4, where the legacy prompt could
     show a tornado, about 1 in 7; on an ocean world no rain hurricane);
   - in about 1 spell in 6 (a roll from 0.42 to 0.58) the legacy prompt saw clear sky while snow fell on the
     scene; the repaired one shows "storm in progress −5" and takes the 5 off (a base of 90 to 94 is held at 90),
     so a wave-off's "next attempt" is 5 lower too; and because the event is now asked with snow where the legacy
     prompt asked with no weather at all, a terran world's prompt can also gain the ice-storm line (1 in 4 of
     these spells), where the legacy prompt showed no event.
   The repaired rule never loses a storm the legacy prompt had.

   The clock is an argument: seconds of active play. The legacy game used seconds since the page opened, so which
   spell a player is in at a given moment differs from the legacy game on every world (a named improvement of its
   own: the weather is the same after a reload). */
import {
  legacyPromptWeather, weatherEventAt, weatherNow, worldEnvironment,
  type WeatherEvent, type WeatherToken,
} from '@cf/domain-landing';
import { biomeFor } from '@cf/domain-strays';

export type DescentWeatherRule = 'repaired' | 'legacy';

export interface DescentWeather {
  readonly rule: DescentWeatherRule;
  /** The weather falling, or null under a clear sky. */
  readonly token: WeatherToken | null;
  readonly stormActive: boolean;
  /** The weather event the prompt names, if any. */
  readonly event: WeatherEvent | null;
}

/** What a new world type's rules change of a world's weather: its base weather (the parent type's, none, or one
    named) and its biome, the anchor of a weather event. */
export interface WeatherRules {
  readonly weather: 'parent' | 'none' | WeatherToken;
  readonly biome: { readonly k: string } | 'parent' | null;
}

/** The weather of a descent to this world in its climate band at this time of active play. `rules` are a new world
    type's for this world; with none it is the legacy game's weather. */
export function descentWeather(
  planet: { readonly seed: number; readonly type: string },
  band: string,
  activePlaySeconds: number,
  rule: DescentWeatherRule = 'repaired',
  rules: WeatherRules | null = null,
): DescentWeather {
  const legacyEnv = worldEnvironment(planet, band);
  const env = rules === null || rules.weather === 'parent' ? legacyEnv
    : { ...legacyEnv, baseWeather: rules.weather === 'none' ? null : rules.weather };
  const token = (rule === 'legacy' ? legacyPromptWeather : weatherNow)(planet, env, activePlaySeconds);
  const anchor = rules === null || rules.biome === 'parent' ? biomeFor(planet, band) : rules.biome;
  return Object.freeze({
    rule,
    token,
    stormActive: token !== null,
    event: weatherEventAt(planet, anchor && typeof anchor.k === 'string' ? anchor.k : null, token, activePlaySeconds),
  });
}

/** Whether a storm is in progress for the descent at this time of active play: one answer for the prompt, the
    odds and the scene. */
export function descentStormActive(
  planet: { readonly seed: number; readonly type: string },
  band: string,
  activePlaySeconds: number,
  rules: WeatherRules | null = null,
): boolean {
  return descentWeather(planet, band, activePlaySeconds, 'repaired', rules).stormActive;
}
