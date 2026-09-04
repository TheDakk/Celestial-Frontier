/* Pure app join from one proven current-world environment to the audio
   package's already-surfaced distant-ecology plan. It never classifies a
   planet, filters a roster, plays sound, or owns gameplay state. */
import {
  type AudioCounterpartReceipt,
  type DistantEcologyHintPlan,
} from '@cf/audio';
import { createDistantEcologyHintPlan } from '@cf/audio/internal/ecology';
import {
  isCanonicalWorldRoster,
  type CanonicalWorldRoster,
} from './world-roster.js';

export const CURRENT_WORLD_DISTANT_ECOLOGY_PLAYBACK_SCHEMA =
  'cf-v2-current-world-distant-ecology-playback/v1' as const;

export interface CurrentWorldEcologyVisualReceiptV1 {
  readonly generation: number;
  readonly worldKey: string;
  readonly environmentFingerprint: string;
  readonly biosphereKey: string;
  readonly granularity: 'biosphere';
  /** Main may set this only after the matching current-world visual is live. */
  readonly visible: true;
}

export interface CurrentWorldApproachEcologyVisualReceiptV1 {
  readonly generation: number;
  readonly worldKey: string;
  readonly environmentFingerprint: string;
  readonly biosphereKey: string;
  readonly granularity: 'biosphere';
  readonly surface: 'approach';
  /** The caller may set this only while the matching orbital approach lead
   * remains player-visible. */
  readonly visible: true;
}

export interface CurrentWorldDistantEcologyPlaybackV1 {
  readonly schema: typeof CURRENT_WORLD_DISTANT_ECOLOGY_PLAYBACK_SCHEMA;
  readonly generation: number;
  readonly worldKey: string;
  readonly eventKey: string;
  readonly plan: DistantEcologyHintPlan;
  readonly counterpart: AudioCounterpartReceipt;
}

const CURRENT_PLAYBACKS = new WeakSet<object>();

function createCurrentWorldDistantEcologyHintPlanForSource(
  roster: CanonicalWorldRoster,
  source: 'approach-lead' | 'survey-roster',
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
      source,
      evidenceKey: `${source}:${roster.environmentFingerprint}:biosphere:${roster.biosphereKey}`,
      granularity: 'biosphere',
    }),
  });
}

export function createCurrentWorldDistantEcologyHintPlan(
  roster: CanonicalWorldRoster,
): DistantEcologyHintPlan {
  return createCurrentWorldDistantEcologyHintPlanForSource(roster, 'survey-roster');
}

export function createCurrentWorldApproachDistantEcologyHintPlan(
  roster: CanonicalWorldRoster,
): DistantEcologyHintPlan {
  return createCurrentWorldDistantEcologyHintPlanForSource(roster, 'approach-lead');
}

function playbackFor(
  roster: CanonicalWorldRoster,
  visual: CurrentWorldEcologyVisualReceiptV1 | CurrentWorldApproachEcologyVisualReceiptV1,
  source: 'approach-lead' | 'survey-roster',
): CurrentWorldDistantEcologyPlaybackV1 {
  if (!isCanonicalWorldRoster(roster)) {
    throw new TypeError('distant ecology playback requires a canonical current-world roster');
  }
  if (!visual || typeof visual !== 'object') {
    throw new TypeError('distant ecology playback requires its exact visible biosphere counterpart');
  }
  const approachShapeMatches = source !== 'approach-lead'
    || ('surface' in visual && visual.surface === 'approach');
  const surveyShapeMatches = source !== 'survey-roster' || !('surface' in visual);
  if (visual.visible !== true
    || visual.granularity !== 'biosphere'
    || !Number.isSafeInteger(visual.generation) || visual.generation < 1
    || visual.worldKey !== roster.worldKey
    || visual.environmentFingerprint !== roster.environmentFingerprint
    || visual.biosphereKey !== roster.biosphereKey
    || roster.biosphereKey === 'none'
    || !approachShapeMatches || !surveyShapeMatches) {
    throw new TypeError('distant ecology playback requires its exact visible biosphere counterpart');
  }

  const plan = createCurrentWorldDistantEcologyHintPlanForSource(roster, source);
  const eventKey = plan.planId;
  const counterpart = Object.freeze({
    counterpartKey: plan.evidenceKey,
    eventKey,
    generation: visual.generation,
  });
  const playback: CurrentWorldDistantEcologyPlaybackV1 = Object.freeze({
    schema: CURRENT_WORLD_DISTANT_ECOLOGY_PLAYBACK_SCHEMA,
    generation: visual.generation,
    worldKey: roster.worldKey,
    eventKey,
    plan,
    counterpart,
  });
  CURRENT_PLAYBACKS.add(playback);
  return playback;
}

/** Join the pure plan to an exact current-world visual receipt. The plan is
 * deliberately created only after the receipt proves a visible biosphere-
 * level counterpart; this seam carries no species identity, writer or RNG. */
export function createCurrentWorldDistantEcologyPlaybackV1(
  roster: CanonicalWorldRoster,
  visual: CurrentWorldEcologyVisualReceiptV1,
): CurrentWorldDistantEcologyPlaybackV1 {
  return playbackFor(roster, visual, 'survey-roster');
}

/** Bind a pre-landing orbital approach lead to the same generic biosphere
 * renderer. The exact source tag and evidence key keep it distinct from the
 * landed Survey-roster/Planetside owner. */
export function createCurrentWorldApproachDistantEcologyPlaybackV1(
  roster: CanonicalWorldRoster,
  visual: CurrentWorldApproachEcologyVisualReceiptV1,
): CurrentWorldDistantEcologyPlaybackV1 {
  return playbackFor(roster, visual, 'approach-lead');
}

export function isCurrentWorldDistantEcologyPlaybackV1(
  value: unknown,
): value is CurrentWorldDistantEcologyPlaybackV1 {
  return value !== null && typeof value === 'object' && CURRENT_PLAYBACKS.has(value as object);
}
