/* Pure app join from one proven current-world environment to the audio
   package's already-surfaced distant-ecology plan. It never classifies a
   planet, filters a roster, plays sound, or owns gameplay state. */
import {
  type DistantEcologyHintPlan,
} from '@cf/audio';
import { createDistantEcologyHintPlan } from '@cf/audio/internal/ecology';
import {
  isCanonicalWorldRoster,
  type CanonicalWorldRoster,
} from './world-roster.js';

export function createCurrentWorldDistantEcologyHintPlan(
  roster: CanonicalWorldRoster,
): DistantEcologyHintPlan {
  if (!isCanonicalWorldRoster(roster)) {
    throw new TypeError('distant ecology audio requires a canonical current-world roster');
  }
  if (roster.biosphereKey === 'none') {
    throw new TypeError('distant ecology audio requires an already-surfaced inhabited biosphere');
  }
  return createDistantEcologyHintPlan({
    canonicalWorldKey: roster.worldKey,
    biomeProfile: Object.freeze({
      schema: roster.biomeProfileSchema,
      digest: roster.biomeProfileDigest,
      key: roster.biomeProfileKey,
    }),
    surfaced: Object.freeze({
      source: 'survey-roster',
      evidenceKey: `survey-roster:${roster.environmentFingerprint}:biosphere:${roster.biosphereKey}`,
      granularity: 'biosphere',
    }),
  });
}
