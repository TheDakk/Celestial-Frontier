export {
  DESCENT_DAMAGE_DOMAIN_V1,
  DESCENT_HOSTILE_LANDING,
  DESCENT_LEARNED_PER_WAVE_OFF,
  DESCENT_MAX_WAVE_OFFS,
  DESCENT_OUTCOME_DOMAINS_V1,
  DESCENT_POLICY_SCHEMA_V1,
  DESCENT_STORM_PENALTY,
  DESCENT_SUCCESS_DOMAIN_V1,
  DESCENT_TYPE_TIERS_V1,
  descentDamageRangeForBaseSuccessV1,
  descentOdds,
  isDescentApproachPolicyV1,
  projectDescentApproachV1,
  resolveDescentAttemptV1,
  waveOffDamage,
} from './descent-policy';
export type {
  DescentApproachPolicyV1,
  DescentAttemptOutcomeV1,
  DescentBaseTierV1,
  DescentOdds,
  DescentOddsInput,
  DescentOutcomeDrawV1,
  DescentPlanetTypeV1,
  DescentPolicyInputV1,
  DescentSafeReasonV1,
} from './descent-policy';
export { descentStormActive, descentWeather } from './descent-weather';
export type { DescentWeather, DescentWeatherRule } from './descent-weather';
export {
  DESCENT_PROMPT_BUTTONS, DESCENT_STORM_LINE, descentPrompt, descentTierLabel, throughTheFireNotice, waveOffNotice,
} from './descent-prompt';
export type { DescentCopyPart, DescentNotice, DescentPrompt } from './descent-prompt';
