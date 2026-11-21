/* Pure settled-event expression and the typed boundary consumed by the later
   Web Audio engine. No event here can be synthesized from idle polling,
   absence, wall clock, or mutable creature state. */
import {
  AUDIO_RESOLVER_VERSION,
  audioHash32,
  boundedAudioKey,
  createAudioIdentityProfile,
  createCreatureCallPlan,
  deserializeAudioSignature,
  type CreatureCallPlan,
  type CreaturePhrasePlan,
  type CreaturePhrasePurpose,
  type SerializedAudioSignature,
} from './identity.js';
import type { DistantEcologyHintPlan } from './ecology.js';

interface SettledEventBase {
  /** Stable gameplay receipt/action identity, not a wall-clock timestamp. */
  readonly eventKey: string;
  /** Required visual/text counterpart for this meaningful sound. */
  readonly captionKey: string;
}

export type SettledCreatureAudioEvent =
  | (SettledEventBase & Readonly<{ kind: 'selected' }>)
  | (SettledEventBase & Readonly<{ kind: 'feed-completed'; outcome: 'accepted' | 'refused' }>)
  | (SettledEventBase & Readonly<{ kind: 'injury-applied'; severity: 'minor' | 'major' }>)
  | (SettledEventBase & Readonly<{ kind: 'care-completed'; outcome: 'comforted' | 'recovered' }>)
  | (SettledEventBase & Readonly<{ kind: 'taming-succeeded' }>)
  | (SettledEventBase & Readonly<{ kind: 'mission-returned'; outcome: 'safe' | 'success' }>);

export interface CreatureExpressionCue {
  readonly version: typeof AUDIO_RESOLVER_VERSION;
  readonly cueId: string;
  readonly identityKey: SerializedAudioSignature;
  readonly identityId: string;
  readonly eventKind: SettledCreatureAudioEvent['kind'];
  readonly eventKey: string;
  readonly captionKey: string;
  readonly phrase: CreaturePhrasePlan;
  readonly expression: Readonly<{
    gainPermille: number;
    durationPermille: number;
    pitchOffsetCents: number;
  }>;
}

export type AudioEvent =
  | Readonly<{ type: 'ui.whoosh' }>
  | Readonly<{ type: 'survey.ping' }>
  | Readonly<{ type: 'rarity.sting'; tier: number }>
  | Readonly<{ type: 'creature.expression'; cue: CreatureExpressionCue }>
  | Readonly<{ type: 'ecology.distant-hint'; plan: DistantEcologyHintPlan }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return actual.length === sortedExpected.length
    && actual.every((key, index) => key === sortedExpected[index]);
}

function phraseFor(plan: CreatureCallPlan, purpose: CreaturePhrasePurpose): CreaturePhrasePlan {
  const phrase = plan.phrases.find((candidate) => candidate.purpose === purpose);
  if (!phrase) throw new TypeError(`creature call plan has no ${purpose} phrase`);
  return phrase;
}

function eventPurpose(event: SettledCreatureAudioEvent): CreaturePhrasePurpose {
  switch (event.kind) {
    case 'selected': return 'contact';
    case 'feed-completed': return event.outcome === 'accepted' ? 'contented' : 'subdued';
    case 'injury-applied': return 'subdued';
    case 'care-completed': return 'contented';
    case 'taming-succeeded': return 'greeting';
    case 'mission-returned': return event.outcome === 'success' ? 'celebration' : 'greeting';
  }
}

function eventDetail(event: SettledCreatureAudioEvent): string {
  switch (event.kind) {
    case 'selected':
    case 'taming-succeeded': return event.kind;
    case 'feed-completed':
    case 'care-completed':
    case 'mission-returned': return `${event.kind}:${event.outcome}`;
    case 'injury-applied': return `${event.kind}:${event.severity}`;
  }
}

function validateEvent(value: SettledCreatureAudioEvent): SettledCreatureAudioEvent {
  if (!isRecord(value)) throw new TypeError('settled creature audio event is required');
  boundedAudioKey(value.eventKey, 'settled creature event key', 192);
  boundedAudioKey(value.captionKey, 'creature expression caption key', 192);
  switch (value.kind) {
    case 'selected':
    case 'taming-succeeded':
      if (hasExactKeys(value, ['kind', 'eventKey', 'captionKey'])) return value as SettledCreatureAudioEvent;
      break;
    case 'feed-completed':
      if (hasExactKeys(value, ['kind', 'eventKey', 'captionKey', 'outcome'])
        && (value.outcome === 'accepted' || value.outcome === 'refused')) return value as SettledCreatureAudioEvent;
      break;
    case 'injury-applied':
      if (hasExactKeys(value, ['kind', 'eventKey', 'captionKey', 'severity'])
        && (value.severity === 'minor' || value.severity === 'major')) return value as SettledCreatureAudioEvent;
      break;
    case 'care-completed':
      if (hasExactKeys(value, ['kind', 'eventKey', 'captionKey', 'outcome'])
        && (value.outcome === 'comforted' || value.outcome === 'recovered')) return value as SettledCreatureAudioEvent;
      break;
    case 'mission-returned':
      if (hasExactKeys(value, ['kind', 'eventKey', 'captionKey', 'outcome'])
        && (value.outcome === 'safe' || value.outcome === 'success')) return value as SettledCreatureAudioEvent;
      break;
  }
  throw new TypeError('creature audio event is not a completed supported event');
}

function currentCallPlan(plan: CreatureCallPlan): CreatureCallPlan {
  if (!isRecord(plan) || plan.version !== AUDIO_RESOLVER_VERSION
    || typeof plan.identityKey !== 'string') throw new TypeError('current creature call plan is required');
  const decoded = deserializeAudioSignature(plan.identityKey);
  if (decoded.kind !== 'ok') throw new TypeError('current creature call plan is required');
  const expected = createCreatureCallPlan(createAudioIdentityProfile(decoded.signature));
  if (JSON.stringify(plan) !== JSON.stringify(expected)) {
    throw new TypeError('creature call plan does not match its immutable identity');
  }
  return expected;
}

function hex32(value: number): string {
  return (value >>> 0).toString(16).padStart(8, '0');
}

/** Select transient articulation without changing the stable call plan. */
export function createCreatureExpressionCue(
  plan: CreatureCallPlan,
  settledEvent: SettledCreatureAudioEvent,
): CreatureExpressionCue {
  const currentPlan = currentCallPlan(plan);
  const event = validateEvent(settledEvent);
  const eventKey = boundedAudioKey(event.eventKey, 'settled creature event key', 192);
  const captionKey = boundedAudioKey(event.captionKey, 'creature expression caption key', 192);
  const detail = eventDetail(event);
  const phrase = phraseFor(currentPlan, eventPurpose(event));
  const key = JSON.stringify([AUDIO_RESOLVER_VERSION, currentPlan.identityKey, eventKey, detail]);
  const hash = audioHash32(key, 0xE7010);
  const injury = event.kind === 'injury-applied';
  return Object.freeze({
    version: AUDIO_RESOLVER_VERSION,
    cueId: `cec1-${hex32(hash)}${hex32(audioHash32(key, 0xE7011))}`,
    identityKey: currentPlan.identityKey,
    identityId: currentPlan.identityId,
    eventKind: event.kind,
    eventKey,
    captionKey,
    phrase,
    expression: Object.freeze({
      gainPermille: injury ? (event.severity === 'major' ? 620 : 760) : 850 + (hash % 101),
      durationPermille: injury ? (event.severity === 'major' ? 720 : 850) : 900 + ((hash >>> 8) % 201),
      pitchOffsetCents: injury ? -80 : ((hash >>> 16) % 81) - 40,
    }),
  });
}

export function creatureExpressionAudioEvent(cue: CreatureExpressionCue): AudioEvent {
  return Object.freeze({ type: 'creature.expression', cue });
}

export function distantEcologyAudioEvent(plan: DistantEcologyHintPlan): AudioEvent {
  return Object.freeze({ type: 'ecology.distant-hint', plan });
}
