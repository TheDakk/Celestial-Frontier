/* Deterministic, asset-free rendering for one already-settled fauna
   expression. This owner only translates the canonical profile/plan/cue into
   a bounded runtime request; gameplay event choice and counterpart ownership
   remain with the caller. */
import {
  boundedAudioKey,
  createAudioIdentityProfile,
  createCreatureCallPlan,
  deserializeAudioSignature,
  type AudioIdentityProfile,
  type CreatureCallPlan,
} from './identity.js';
import {
  createCreatureExpressionCue,
  type CreatureExpressionCue,
  type SettledCreatureAudioEvent,
} from './events.js';
import { AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1 } from './runtime.js';
import { finiteVoiceMaxDurationMs } from './finite-voice-lifetime.js';
import type {
  AudioContextLike,
  AudioCounterpartReceipt,
  AudioGainNodeLike,
  AudioNodeLike,
  AudioParamLike,
  AudioScheduledSourceLike,
  AudioVoiceGraph,
  AudioVoiceRequest,
  AudioVoiceReservation,
} from './runtime.js';

export interface CreatureExpressionVoiceRequestInput {
  readonly profile: AudioIdentityProfile;
  readonly callPlan: CreatureCallPlan;
  readonly cue: CreatureExpressionCue;
  readonly counterpart: AudioCounterpartReceipt;
}

type OscillatorWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface RampAudioParamLike extends AudioParamLike {
  linearRampToValueAtTime(value: number, time: number): unknown;
}

interface SynthesisGainNodeLike extends AudioGainNodeLike {
  readonly gain: RampAudioParamLike;
}

interface SynthesisOscillatorLike extends AudioScheduledSourceLike {
  readonly frequency: AudioParamLike;
  type: OscillatorWaveform;
}

interface SynthesisContextLike extends AudioContextLike {
  createOscillator(): SynthesisOscillatorLike;
}

const VOICE_PRIORITY = 40;
const VOICE_NODE_COUNT = 2;
const CONCURRENCY_GROUP = 'creature-expression';

const PALETTE_SYNTHESIS: Readonly<Record<string, Readonly<{
  waveform: OscillatorWaveform;
  peakGain: number;
}>>> = Object.freeze({
  'fauna-resonant': Object.freeze({ waveform: 'sine', peakGain: 0.038 }),
  'fauna-breathy': Object.freeze({ waveform: 'triangle', peakGain: 0.030 }),
  'fauna-percussive': Object.freeze({ waveform: 'sawtooth', peakGain: 0.016 }),
  'fauna-chitter': Object.freeze({ waveform: 'square', peakGain: 0.014 }),
});

const ARTICULATION_SHAPE: Readonly<Record<string, Readonly<{
  attackRatio: number;
  releaseRatio: number;
}>>> = Object.freeze({
  smooth: Object.freeze({ attackRatio: 0.18, releaseRatio: 0.24 }),
  breathy: Object.freeze({ attackRatio: 0.28, releaseRatio: 0.32 }),
  granular: Object.freeze({ attackRatio: 0.06, releaseRatio: 0.14 }),
  plucked: Object.freeze({ attackRatio: 0.03, releaseRatio: 0.48 }),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sorted = [...expected].sort();
  return actual.length === sorted.length
    && actual.every((key, index) => key === sorted[index]);
}

function sameCanonicalValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function canonicalProfile(value: AudioIdentityProfile): AudioIdentityProfile {
  if (!isRecord(value) || typeof value.identityKey !== 'string') {
    throw new TypeError('current fauna audio identity profile is required');
  }
  const decoded = deserializeAudioSignature(value.identityKey);
  if (decoded.kind !== 'ok') throw new TypeError('current fauna audio identity profile is required');
  const expected = createAudioIdentityProfile(decoded.signature);
  if (!sameCanonicalValue(value, expected) || expected.kingdom !== 'fauna') {
    throw new TypeError('current fauna audio identity profile is required');
  }
  return expected;
}

function canonicalCallPlan(
  value: CreatureCallPlan,
  profile: AudioIdentityProfile,
): CreatureCallPlan {
  const expected = createCreatureCallPlan(profile);
  if (!sameCanonicalValue(value, expected)) {
    throw new TypeError('creature expression call plan does not match its fauna identity');
  }
  return expected;
}

function cueEventCandidates(cue: CreatureExpressionCue): readonly SettledCreatureAudioEvent[] {
  if (!isRecord(cue)) throw new TypeError('current creature expression cue is required');
  const eventKey = boundedAudioKey(cue.eventKey, 'creature expression event key', 192);
  const captionKey = boundedAudioKey(cue.captionKey, 'creature expression caption key', 192);
  const base = { eventKey, captionKey } as const;
  switch (cue.eventKind) {
    case 'selected': return [Object.freeze({ kind: 'selected', ...base })];
    case 'feed-completed': return [
      Object.freeze({ kind: 'feed-completed', ...base, outcome: 'accepted' }),
      Object.freeze({ kind: 'feed-completed', ...base, outcome: 'refused' }),
    ];
    case 'injury-applied': return [
      Object.freeze({ kind: 'injury-applied', ...base, severity: 'minor' }),
      Object.freeze({ kind: 'injury-applied', ...base, severity: 'major' }),
    ];
    case 'care-completed': return [
      Object.freeze({ kind: 'care-completed', ...base, outcome: 'comforted' }),
      Object.freeze({ kind: 'care-completed', ...base, outcome: 'recovered' }),
    ];
    case 'taming-succeeded': return [Object.freeze({ kind: 'taming-succeeded', ...base })];
    case 'mission-returned': return [
      Object.freeze({ kind: 'mission-returned', ...base, outcome: 'safe' }),
      Object.freeze({ kind: 'mission-returned', ...base, outcome: 'success' }),
    ];
    default: throw new TypeError('current creature expression cue is required');
  }
}

function canonicalCue(
  value: CreatureExpressionCue,
  plan: CreatureCallPlan,
): CreatureExpressionCue {
  for (const event of cueEventCandidates(value)) {
    const expected = createCreatureExpressionCue(plan, event);
    if (sameCanonicalValue(value, expected)) return expected;
  }
  throw new TypeError('creature expression cue does not match its call plan and settled event');
}

function canonicalCounterpart(
  value: AudioCounterpartReceipt,
  cue: CreatureExpressionCue,
): AudioCounterpartReceipt {
  if (!isRecord(value) || !hasExactKeys(value, ['counterpartKey', 'eventKey', 'generation'])
    || value.counterpartKey !== cue.captionKey || value.eventKey !== cue.eventKey
    || !Number.isSafeInteger(value.generation) || value.generation < 1) {
    throw new TypeError('creature expression counterpart does not own this settled cue');
  }
  return Object.freeze({
    counterpartKey: boundedAudioKey(value.counterpartKey, 'creature expression counterpart', 192),
    eventKey: boundedAudioKey(value.eventKey, 'creature expression event', 192),
    generation: value.generation,
  });
}

function rampParam(value: AudioParamLike): RampAudioParamLike {
  if (typeof (value as Partial<RampAudioParamLike>).linearRampToValueAtTime !== 'function') {
    throw new TypeError('creature expression synthesis requires gain automation');
  }
  return value as RampAudioParamLike;
}

function synthesisContext(context: AudioContextLike): SynthesisContextLike {
  if (typeof (context as Partial<SynthesisContextLike>).createOscillator !== 'function'
    || !Number.isFinite(context.currentTime) || context.currentTime < 0) {
    throw new TypeError('creature expression synthesis requires an oscillator context');
  }
  return context as SynthesisContextLike;
}

function scheduledSource(
  oscillator: SynthesisOscillatorLike,
  endTime: number,
): AudioScheduledSourceLike {
  let handler: (() => void) | null = null;
  let ended = false;
  let started = false;
  oscillator.onended = () => {
    if (ended) return;
    ended = true;
    handler?.();
  };
  return {
    get onended() { return handler; },
    set onended(value: (() => void) | null) { handler = value; },
    connect(destination: AudioNodeLike): unknown {
      return oscillator.connect(destination);
    },
    disconnect(): void {
      handler = null;
      oscillator.onended = null;
      oscillator.disconnect();
    },
    start(when?: number): void {
      if (started) throw new Error('creature expression source already started');
      started = true;
      oscillator.start(when);
      if (ended) return;
      try {
        oscillator.stop(endTime);
      } catch (error) {
        try { oscillator.stop(); } catch { /* the start fault remains authoritative */ }
        throw error;
      }
    },
    stop(when?: number): void {
      if (ended || !started) return;
      oscillator.stop(when);
    },
  };
}

function noteGapSeconds(rhythm: string, ordinal: number): number {
  switch (rhythm) {
    case 'even': return 0.012;
    case 'syncopated': return ordinal % 2 === 0 ? 0.006 : 0.028;
    case 'clustered': return 0.004;
    case 'spaced': return 0.050;
    default: throw new TypeError('creature expression rhythm is unsupported');
  }
}

function voiceDurationSeconds(profile: AudioIdentityProfile, cue: CreatureExpressionCue): number {
  const scale = cue.expression.durationPermille / 1_000;
  let duration = 0;
  for (let index = 0; index < cue.phrase.durationsMs.length; index++) {
    duration += Math.max(0.040, cue.phrase.durationsMs[index]! * scale / 1_000);
    if (index + 1 < cue.phrase.durationsMs.length) duration += noteGapSeconds(profile.rhythm, index);
  }
  return duration + 0.005;
}

function createVoiceGraph(
  contextValue: AudioContextLike,
  reservation: AudioVoiceReservation,
  profile: AudioIdentityProfile,
  cue: CreatureExpressionCue,
): AudioVoiceGraph {
  const context = synthesisContext(contextValue);
  const owned: AudioNodeLike[] = [];
  try {
    const oscillator = context.createOscillator();
    owned.push(oscillator);
    if (!oscillator || typeof oscillator.frequency?.setValueAtTime !== 'function'
      || oscillator.onended !== null) {
      throw new TypeError('creature expression oscillator is invalid');
    }
    const envelope = context.createGain() as SynthesisGainNodeLike;
    owned.push(envelope);
    const envelopeGain = rampParam(envelope.gain);
    const palette = PALETTE_SYNTHESIS[profile.paletteId];
    const shape = ARTICULATION_SHAPE[profile.articulation];
    if (!palette || !shape || cue.phrase.intervalsSemitones.length < 1
      || cue.phrase.intervalsSemitones.length !== cue.phrase.durationsMs.length) {
      throw new TypeError('creature expression synthesis plan is unsupported');
    }
    oscillator.type = palette.waveform;

    const durationScale = cue.expression.durationPermille / 1_000;
    const peakGain = palette.peakGain
      * (cue.phrase.intensityPermille / 1_000)
      * (cue.expression.gainPermille / 1_000);
    let cursor = context.currentTime;
    for (let index = 0; index < cue.phrase.intervalsSemitones.length; index++) {
      const intervalCents = cue.phrase.intervalsSemitones[index]! * 100
        + cue.expression.pitchOffsetCents;
      const halfSpan = profile.register.spanCents / 2;
      const boundedCents = Math.max(-halfSpan, Math.min(halfSpan, intervalCents));
      const frequency = profile.register.centerHz * (2 ** (boundedCents / 1_200));
      const duration = Math.max(0.040, cue.phrase.durationsMs[index]! * durationScale / 1_000);
      const noteEnd = cursor + duration;
      const attackEnd = cursor + duration * shape.attackRatio;
      const sustainEnd = Math.max(attackEnd, noteEnd - duration * shape.releaseRatio);
      oscillator.frequency.setValueAtTime(frequency, cursor);
      envelopeGain.setValueAtTime(0, cursor);
      envelopeGain.linearRampToValueAtTime(peakGain, attackEnd);
      envelopeGain.setValueAtTime(peakGain, sustainEnd);
      envelopeGain.linearRampToValueAtTime(0, noteEnd);
      cursor = noteEnd;
      if (index + 1 < cue.phrase.intervalsSemitones.length) {
        cursor += noteGapSeconds(profile.rhythm, index);
      }
    }

    const source = scheduledSource(oscillator, cursor + 0.005);
    source.connect(envelope);
    return Object.freeze({
      source,
      sources: Object.freeze([source]),
      output: envelope,
      nodes: Object.freeze([source, envelope]),
      reservation,
    });
  } catch (error) {
    for (let index = owned.length - 1; index >= 0; index--) {
      try { owned[index]!.disconnect(); } catch { /* construction fault remains authoritative */ }
    }
    throw error;
  }
}

/** Convert one canonical, caption-owned fauna expression into the smallest
 * runtime graph: one oscillator and one gain envelope. */
export function createCreatureExpressionVoiceRequest(
  input: CreatureExpressionVoiceRequestInput,
): AudioVoiceRequest {
  if (!isRecord(input) || !hasExactKeys(input, ['profile', 'callPlan', 'cue', 'counterpart'])) {
    throw new TypeError('creature expression voice request input is invalid');
  }
  const profile = canonicalProfile(input.profile);
  const callPlan = canonicalCallPlan(input.callPlan, profile);
  const cue = canonicalCue(input.cue, callPlan);
  const counterpart = canonicalCounterpart(input.counterpart, cue);
  return Object.freeze({
    key: `creature-expression:${cue.cueId}`,
    category: 'creature',
    priority: VOICE_PRIORITY,
    cooldownGroup: callPlan.cooldownGroup,
    cooldownMs: callPlan.cooldownMs,
    concurrencyGroup: CONCURRENCY_GROUP,
    maxConcurrent: 1,
    nodeCount: VOICE_NODE_COUNT,
    maxDurationMs: finiteVoiceMaxDurationMs(voiceDurationSeconds(profile, cue)),
    mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
    meaning: Object.freeze({ kind: 'meaningful', counterpart }),
    create: (context: AudioContextLike, reservation: AudioVoiceReservation) =>
      createVoiceGraph(context, reservation, profile, cue),
  });
}
