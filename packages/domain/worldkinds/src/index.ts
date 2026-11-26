/* @cf/domain-worldkinds: the new world types beside the legacy game's eight, and the census that proves them. */
export {
  CENSUS_SOL_SEED, CENSUS_STREAM, CensusDigest,
  censusDigest, censusFingerprint, censusRow, censusStarSeed, censusSystems, censusWorld, stableText,
} from './census.js';
export type {
  CensusDescent, CensusFingerprint, CensusMoon, CensusPlanet, CensusShares, CensusSources, CensusSurvey, CensusSystem,
  CensusSystemEntry, CensusVeins, CensusWorld,
} from './census.js';
export { gameCensusSources, surveyOf } from './sources.js';
export { SWITCHES_OFF, SWITCHES_ON, WORLD_TYPE_KEYS } from './switches.js';
export type { WorldSwitches, WorldTypeKey } from './switches.js';
export { ownDraw, ownStream } from './rules.js';
export type {
  BodyRecord, LegacyType, PlanetNumbers, RuleBiome, RuleCardRow, SliceStep, SourceStep, WorldRules, WorldTypeDefinition,
} from './rules.js';
export { WORLD_TYPES, extraBodies, inSlice, rogueBody, rulesFor, sliceOf, sliceStepsPassed } from './registry.js';
export { effectiveWorld, legacyFactsOf } from './effective.js';
export type { EffectiveWorld, LegacyWorldFacts } from './effective.js';
