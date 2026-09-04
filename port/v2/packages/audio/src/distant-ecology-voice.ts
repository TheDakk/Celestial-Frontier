/* Deterministic, asset-free rendering for the current distant-ecology seam.
   This owner accepts only a canonical, already-surfaced generic biosphere
   plan from orbital approach or Survey roster evidence: it cannot turn hidden
   kingdom, family, or species data into an audio channel.
   Route ownership and counterpart registration remain with the caller. */
import {
  createDistantEcologyHintPlan,
  type DistantEcologyHintPlan,
} from './ecology.js';
import { audioHash32, boundedAudioKey } from './identity.js';
import { AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1 } from './runtime.js';
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

export interface DistantEcologyVoiceRequestInput {
  readonly plan: DistantEcologyHintPlan;
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

const VOICE_PRIORITY = 10;
const VOICE_NODE_COUNT = 2;
const CONCURRENCY_GROUP = 'distant-ecology';
const PLAN_KEYS = Object.freeze([
  'version',
  'planId',
  'canonicalWorldKey',
  'biomeProfileSchema',
  'biomeProfileDigest',
  'biomeProfileKey',
  'biomeWeather',
  'biomeHazard',
  'evidenceKey',
  'source',
  'granularity',
  'kingdom',
  'palettePolicy',
  'route',
  'familyKey',
  'identityKey',
] as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: object, expected: readonly string[]): boolean {
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) return false;
    const actual = Reflect.ownKeys(value);
    if (actual.length !== expected.length
      || actual.some((key) => typeof key !== 'string' || !expected.includes(key))) return false;
    return expected.every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor !== undefined
        && Object.hasOwn(descriptor, 'value')
        && descriptor.enumerable === true;
    });
  } catch {
    return false;
  }
}

function sameCanonicalValue(left: unknown, right: unknown): boolean {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function canonicalPlan(value: DistantEcologyHintPlan): DistantEcologyHintPlan {
  if (!isRecord(value) || !hasExactKeys(value, PLAN_KEYS)
    || (value.source !== 'approach-lead' && value.source !== 'survey-roster')
    || value.granularity !== 'biosphere'
    || value.kingdom !== null
    || value.palettePolicy !== 'generic-ecology'
    || value.route !== 'ambience'
    || value.familyKey !== null
    || value.identityKey !== null) {
    throw new TypeError('current generic biosphere ecology plan is required');
  }
  const source = value.source;
  const expected = createDistantEcologyHintPlan({
    canonicalWorldKey: value.canonicalWorldKey,
    biomeProfile: Object.freeze({
      schema: value.biomeProfileSchema,
      digest: value.biomeProfileDigest,
      key: value.biomeProfileKey,
    }),
    surfaced: Object.freeze({
      source,
      evidenceKey: value.evidenceKey,
      granularity: 'biosphere',
    }),
  });
  if (!sameCanonicalValue(value, expected)) {
    throw new TypeError('distant ecology plan does not match its canonical surfaced evidence');
  }
  return expected;
}

function canonicalCounterpart(
  value: AudioCounterpartReceipt,
  plan: DistantEcologyHintPlan,
): AudioCounterpartReceipt {
  if (!isRecord(value) || !hasExactKeys(value, ['counterpartKey', 'eventKey', 'generation'])
    || value.counterpartKey !== plan.evidenceKey
    || value.eventKey !== plan.planId
    || !Number.isSafeInteger(value.generation)
    || value.generation < 1) {
    throw new TypeError('distant ecology counterpart does not own this surfaced biosphere plan');
  }
  return Object.freeze({
    counterpartKey: boundedAudioKey(value.counterpartKey, 'distant ecology counterpart', 192),
    eventKey: boundedAudioKey(value.eventKey, 'distant ecology event', 192),
    generation: value.generation,
  });
}

function rampParam(value: AudioParamLike): RampAudioParamLike {
  if (typeof (value as Partial<RampAudioParamLike>).linearRampToValueAtTime !== 'function') {
    throw new TypeError('distant ecology synthesis requires gain automation');
  }
  return value as RampAudioParamLike;
}

function synthesisContext(context: AudioContextLike): SynthesisContextLike {
  if (typeof (context as Partial<SynthesisContextLike>).createOscillator !== 'function'
    || !Number.isFinite(context.currentTime) || context.currentTime < 0) {
    throw new TypeError('distant ecology synthesis requires an oscillator context');
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
      if (started) throw new Error('distant ecology source already started');
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

function createVoiceGraph(
  contextValue: AudioContextLike,
  reservation: AudioVoiceReservation,
  plan: DistantEcologyHintPlan,
): AudioVoiceGraph {
  const context = synthesisContext(contextValue);
  const owned: AudioNodeLike[] = [];
  try {
    const oscillator = context.createOscillator();
    owned.push(oscillator);
    if (!oscillator || typeof oscillator.frequency?.setValueAtTime !== 'function'
      || oscillator.onended !== null) {
      throw new TypeError('distant ecology oscillator is invalid');
    }
    const envelope = context.createGain() as SynthesisGainNodeLike;
    owned.push(envelope);
    const envelopeGain = rampParam(envelope.gain);

    /* The canonical biosphere plan contains no organism identity. These small
       variations use only its already-surfaced plan ID and remain a generic
       environmental pulse rather than a species or family call. */
    const shape = audioHash32(plan.planId, 0xD15EC0);
    const startTime = context.currentTime;
    const duration = 0.56 + (shape % 121) / 1_000;
    const endTime = startTime + duration;
    const peakTime = startTime + duration * 0.24;
    const settleTime = startTime + duration * 0.62;
    const baseFrequency = 280 + ((shape >>> 8) % 121);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(baseFrequency, startTime);
    oscillator.frequency.setValueAtTime(baseFrequency * 1.125, settleTime);
    envelopeGain.setValueAtTime(0, startTime);
    envelopeGain.linearRampToValueAtTime(0.018, peakTime);
    envelopeGain.setValueAtTime(0.012, settleTime);
    envelopeGain.linearRampToValueAtTime(0, endTime);

    const source = scheduledSource(oscillator, endTime + 0.005);
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

/** Convert one canonical, visibly surfaced biosphere hint into one bounded
 * generic ambience request. More-specific ecology plans fail closed. */
export function createDistantEcologyVoiceRequest(
  input: DistantEcologyVoiceRequestInput,
): AudioVoiceRequest {
  if (!isRecord(input) || !hasExactKeys(input, ['plan', 'counterpart'])) {
    throw new TypeError('distant ecology voice request input is invalid');
  }
  const plan = canonicalPlan(input.plan);
  const counterpart = canonicalCounterpart(input.counterpart, plan);
  return Object.freeze({
    key: `distant-ecology:${plan.planId}`,
    category: 'ambience',
    priority: VOICE_PRIORITY,
    cooldownGroup: `distant-ecology:${plan.planId}`,
    cooldownMs: 0,
    concurrencyGroup: CONCURRENCY_GROUP,
    maxConcurrent: 1,
    nodeCount: VOICE_NODE_COUNT,
    mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
    meaning: Object.freeze({ kind: 'meaningful', counterpart }),
    create: (context: AudioContextLike, reservation: AudioVoiceReservation) =>
      createVoiceGraph(context, reservation, plan),
  });
}
