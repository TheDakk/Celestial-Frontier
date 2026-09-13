/** @module worldlife [app] — A5 world-life layer: spec compiler, pure sampler, Pixi 8 adapter. */
export {
  compileWorldLife, parseWorldLifeCard, WorldLifeRefusal, WORLD_LIFE_SPEC_SCHEMA_V1, WORLD_LIFE_FRAME,
  WORLD_LIFE_STREAK_CAP, WORLD_LIFE_ARENA_DENSITY,
  type WorldLifeCardV1, type WorldLifeSpecV1, type WorldLifeWeatherV1, type WorldLifeWaterV1, type WorldLifeTimeOfDayV1,
  type WorldLifeStrengthV1, type WorldLifeSurfaceV1, type WorldLifeTierV1, type WorldLifePrecipKindV1,
  type WorldLifePrecipitationV1, type WorldLifeDriftV1, type WorldLifeShimmerV1, type WorldLifeSwayBandV1,
  type WorldLifeFliersV1, type WorldLifeFlierPathV1, type WorldLifeFlickerV1,
} from './spec.js';
export { sampleWorldLife, WORLD_LIFE_SWAY_RADIANS, type WorldLifeSampleV1 } from './sampler.js';
export {
  WorldLifePixiAdapter, type WorldLifeDisplayFactoryV1, type WorldLifeNodeLike, type WorldLifeGraphicsLike,
  type WorldLifeContainerLike, type WorldLifeFoliageLike,
} from './pixi-adapter.js';
