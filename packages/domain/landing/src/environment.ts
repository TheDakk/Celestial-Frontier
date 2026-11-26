/* A world's fixed environment, its season and its time of day (LEGACY celestial-frontier.html, v1.8.9, inline in
   `openLandingVista`):
   - the environment, made once per world: 13508-13523 (tilt, air, magnetic field, base weather, then the phase, the
     length of the day and the length of the year, drawn in that order from one stream);
   - the season: 13525-13529; the time of day: 13533-13535.
   The tilt is the first draw of the stream the survey card's Seasons row reads (`seasonText` 5049-5055), so a world
   the card calls tilted is the world that has seasons here.

   The clock is an argument, in seconds. The legacy game passes seconds since the page was opened (`perfTime` 6009).
   Pure: no clock, no entropy. */
import { TAU, mulberry32 } from '@cf/domain-rand';
import { EARTH_SEED } from './region.js';

/** The weather a world can have falling. */
export type WeatherToken = 'rain' | 'snow' | 'dust' | 'ash' | 'haze';
export type TimeOfDay = 'day' | 'twilight' | 'night';

export interface WorldEnvironment {
  /** A tilted axis: the world has seasons, if it has air and is not a gas or venus world. */
  readonly tilt: boolean;
  /** Every world but a rocky one has air. */
  readonly hasAir: boolean;
  /** A magnetic field: auroras can crown the poles. */
  readonly hasField: boolean;
  /** The weather of the world's type and climate band, before the season; null on a rocky or gas world. */
  readonly baseWeather: WeatherToken | null;
  /** Where in its day and its year the world stands at second 0, as an angle from 0 to 2π. */
  readonly phase: number;
  /** The length of a day, 70 to 120 seconds. */
  readonly dayLen: number;
  /** The length of a year, 320 to 580 seconds. */
  readonly yearLen: number;
}

function baseWeatherOf(type: string, band: string): WeatherToken | null {
  if (type === 'terran') return band === 'temperate' ? 'rain' : (band === 'hot' ? 'haze' : 'snow');
  if (type === 'ocean') return 'rain';
  if (type === 'ice') return 'snow';
  if (type === 'desert') return 'dust';
  if (type === 'lava') return 'ash';
  if (type === 'venus') return 'haze';
  return null;
}

/** The world's fixed environment in its climate band. */
export function worldEnvironment(planet: { readonly seed: number; readonly type: string }, band: string): WorldEnvironment {
  const { seed, type } = planet;
  const er = mulberry32((seed ^ 0xE57) >>> 0);
  const tilt = er() < 0.8;
  const hasAir = type !== 'rocky';
  const hasField = seed === EARTH_SEED || type === 'gas' ||
    ((type === 'terran' || type === 'ocean') && mulberry32((seed ^ 0xBEEF) >>> 0)() < 0.8);
  const baseWeather = baseWeatherOf(type, band);
  const phase = er() * TAU;
  const dayLen = 70 + er() * 50;
  const yearLen = 320 + er() * 260;
  return { tilt, hasAir, hasField, baseWeather, phase, dayLen, yearLen };
}

/** The part after the point, never negative. */
const frac = (v: number): number => ((v % 1) + 1) % 1;

/** The season, from -1 (deep winter) to 1; 0 on a world with no tilt, no air, or of type gas or venus. */
export function seasonAt(planet: { readonly seed: number; readonly type: string }, env: WorldEnvironment, seconds: number): number {
  if (!(env.tilt && env.hasAir && planet.type !== 'gas' && planet.type !== 'venus')) return 0;
  return Math.sin(frac(seconds / env.yearLen + env.phase / TAU) * TAU);
}

/** Day, twilight or night at this time, by how high the light stands in the world's day. */
export function timeOfDayAt(env: WorldEnvironment, seconds: number): TimeOfDay {
  const light = 0.5 + 0.5 * Math.cos((frac(seconds / env.dayLen + env.phase / TAU) - 0.5) * TAU);
  return light > 0.72 ? 'day' : (light > 0.42 ? 'twilight' : 'night');
}
