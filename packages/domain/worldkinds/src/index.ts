/* @cf/domain-worldkinds: the new world types beside the legacy game's eight, and the census that proves them. */
export {
  CENSUS_SOL_SEED, CENSUS_STREAM, CensusDigest,
  CensusHitCounter, censusDigest, censusFingerprint, censusRow, censusStarSeed, censusSystem, censusSystemDigest, censusSystems,
  censusWorld, stableText,
} from './census.js';
export type {
  CensusDescent, CensusFingerprint, CensusHits, CensusMixEntry, CensusMoon, CensusPlanet, CensusShares, CensusSources, CensusSurvey, CensusSystem,
  CensusSystemEntry, CensusVeins, CensusWorld,
} from './census.js';
export { gameCensusSources, mixOf, moonOf, surveyOf } from './sources.js';
export { SWITCHES_OFF, SWITCHES_ON, WORLD_TYPE_KEYS } from './switches.js';
export type { WorldSwitches, WorldTypeKey } from './switches.js';
export { LEGACY_FIRST_SALTS, declareStream, declaredStreams, isLegacyStream, ownDraw, ownStream } from './streams.js';
export type { TypeStream } from './streams.js';
export type {
  BodyRecord, LegacyType, PlanetNumbers, RuleBiome, RuleCardRow, SliceStep, SourceStep, SystemFacts, WorldRules, WorldTypeDefinition,
} from './rules.js';
export { WORLD_TYPES, extraBodies, inSlice, rogueBody, rulesFor, sliceOf, sliceStepsPassed, sourceCounts } from './registry.js';
export { effectiveWorld, legacyFactsOf } from './effective.js';
export { playRulesFor } from './play.js';
export type { PlayRules } from './play.js';
export type { EffectiveWorld, LegacyWorldFacts } from './effective.js';
