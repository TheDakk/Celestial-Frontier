/* @cf/domain-landing: where and when a landing touches down, as the legacy game 1.8.9 decides it. */
export { biomeComposition, biomeForLanding, earthLandingComposition, landingSalt } from './region.js';
export type { BiomeSetEntry, BiomeShare, LandingPlanet } from './region.js';
export { SEA_REGIONS, landingSceneRoute } from './route.js';
export type { SceneRoute } from './route.js';
export { seasonAt, timeOfDayAt, worldEnvironment } from './environment.js';
export type { TimeOfDay, WeatherToken, WorldEnvironment } from './environment.js';
export {
  WEATHER_EVENT_WORD, WEATHER_ODDS, WEATHER_SPELL_SECONDS, WEATHER_WORD,
  effectiveWeather, legacyPromptWeather, weatherActive, weatherEventAt, weatherNow,
} from './weather.js';
export type { WeatherEvent } from './weather.js';
