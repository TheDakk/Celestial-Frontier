/* Bounded asset-free rendering for one canonical settled combat cue.

   Damage synthesis retains the exact legacy v1.8.9 playHit profile. The one
   legacy presentation-random noise buffer is replaced by cue-keyed local
   hash noise, so playback cannot consume gameplay RNG or change the duel.
   The remaining already-modelled cue families use short authored synthesized
   gestures derived only from their registered cue facts. No renderer runs
   combat, consumes gameplay RNG, or invents a missing transcript event. */
import { boundedAudioKey } from './identity.js';
import {
  isCombatCuePlanV1,
  type CombatCuePlanV1,
  type CombatCueV1,
} from './combat-cues.js';
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

export interface CombatGameplayVoiceRequestInput {
  readonly plan: CombatCuePlanV1;
  readonly cue: CombatCueV1;
  readonly counterpart: AudioCounterpartReceipt;
}

type OscillatorWaveform = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface ExponentialAudioParamLike extends AudioParamLike {
  exponentialRampToValueAtTime(value: number, time: number): unknown;
}

interface SynthesisGainNodeLike extends AudioGainNodeLike {
  readonly gain: ExponentialAudioParamLike;
}

interface SynthesisOscillatorLike extends AudioScheduledSourceLike {
  readonly frequency: ExponentialAudioParamLike;
  type: OscillatorWaveform;
}

interface SynthesisBufferLike {
  getChannelData(channel: number): Float32Array;
}

interface SynthesisBufferSourceLike extends AudioScheduledSourceLike {
  buffer: SynthesisBufferLike | null;
}

interface SynthesisBiquadLike extends AudioNodeLike {
  type: 'bandpass';
  readonly frequency: AudioParamLike;
  readonly Q: AudioParamLike;
}

interface SynthesisContextLike extends AudioContextLike {
  readonly sampleRate: number;
  createOscillator(): SynthesisOscillatorLike;
  createBuffer(channels: number, length: number, sampleRate: number): SynthesisBufferLike;
  createBufferSource(): SynthesisBufferSourceLike;
  createBiquadFilter(): SynthesisBiquadLike;
}

const VOICE_PRIORITY = 80;
const CONCURRENCY_GROUP = 'combat-gameplay-impact';
const MAX_CONCURRENT = 2;

function cuePriority(cue: CombatCueV1): number {
  const motif = cue.guardianMotif?.motif;
  if (motif === 'victory' || motif === 'defeat') return 90;
  if (motif === 'phase') return 88;
  if (motif === 'entrance') return 86;
  if (cue.impact !== null) return VOICE_PRIORITY;
  const primary = cue.families[0];
  if (primary === 'resolution') return 82;
  if (primary === 'burn' || primary === 'regen' || primary === 'defeat') return 76;
  if (primary === 'dodge' || primary === 'stun-skipped') return 72;
  return 60;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: object, expected: readonly string[]): boolean {
  try {
    const actual = Reflect.ownKeys(value);
    return Object.getPrototypeOf(value) === Object.prototype
      && actual.length === expected.length
      && actual.every((key) => typeof key === 'string' && expected.includes(key));
  } catch {
    return false;
  }
}

function canonicalCue(plan: CombatCuePlanV1, cue: CombatCueV1): CombatCueV1 {
  if (!isCombatCuePlanV1(plan)) throw new TypeError('registered combat cue plan is required');
  if (!isRecord(cue) || !plan.cues.includes(cue) || cue.families.length < 1) {
    throw new TypeError('registered settled combat cue is required');
  }
  return cue;
}

function canonicalCounterpart(
  value: AudioCounterpartReceipt,
  cue: CombatCueV1,
): AudioCounterpartReceipt {
  /* One composite voice owns one cue. The plan's first family is its stable
     audible counterpart; later families are modifiers rendered inside that
     same graph, never extra voices that could double a blow or tick. */
  const audible = cue.counterparts[0];
  if (audible === undefined || audible.family !== cue.families[0] || !isRecord(value)
    || !hasExactKeys(value, ['counterpartKey', 'eventKey', 'generation'])
    || value.counterpartKey !== audible.captionToken
    || value.eventKey !== cue.cueId
    || !Number.isSafeInteger(value.generation) || value.generation < 1) {
    throw new TypeError('combat counterpart does not own this settled combat cue');
  }
  return Object.freeze({
    counterpartKey: boundedAudioKey(value.counterpartKey, 'combat counterpart', 192),
    eventKey: boundedAudioKey(value.eventKey, 'combat event', 192),
    generation: value.generation,
  });
}

function exponentialParam(value: AudioParamLike, label: string): ExponentialAudioParamLike {
  if (typeof (value as Partial<ExponentialAudioParamLike>).exponentialRampToValueAtTime !== 'function') {
    throw new TypeError(`combat synthesis requires ${label} automation`);
  }
  return value as ExponentialAudioParamLike;
}

function synthesisContext(value: AudioContextLike): SynthesisContextLike {
  const context = value as Partial<SynthesisContextLike>;
  const sampleRate = context.sampleRate;
  if (typeof context.createOscillator !== 'function'
    || typeof context.createBuffer !== 'function'
    || typeof context.createBufferSource !== 'function'
    || typeof context.createBiquadFilter !== 'function'
    || !Number.isSafeInteger(sampleRate) || typeof sampleRate !== 'number' || sampleRate < 8_000
    || sampleRate > 384_000
    || !Number.isFinite(value.currentTime) || value.currentTime < 0) {
    throw new TypeError('combat synthesis requires an exact Web Audio context');
  }
  return value as SynthesisContextLike;
}

function scheduledSource(
  raw: AudioScheduledSourceLike,
  startTime: number,
  endTime: number,
): AudioScheduledSourceLike {
  let handler: (() => void) | null = null;
  let ended = false;
  let started = false;
  if (!raw || typeof raw.connect !== 'function' || typeof raw.disconnect !== 'function'
    || typeof raw.start !== 'function' || typeof raw.stop !== 'function'
    || raw.onended !== null) {
    try { raw?.disconnect(); } catch { /* invalid source */ }
    throw new TypeError('combat synthesis source is invalid or already owned');
  }
  raw.onended = () => {
    if (ended) return;
    ended = true;
    handler?.();
  };
  return {
    get onended() { return handler; },
    set onended(value: (() => void) | null) { handler = value; },
    connect(destination: AudioNodeLike): unknown { return raw.connect(destination); },
    disconnect(): void {
      handler = null;
      raw.onended = null;
      raw.disconnect();
    },
    start(when?: number): void {
      if (started) throw new Error('combat synthesis source already started');
      started = true;
      raw.start(when ?? startTime);
      if (ended) return;
      try { raw.stop(endTime); }
      catch (error) {
        try { raw.stop(); } catch { /* the scheduling fault remains authoritative */ }
        throw error;
      }
    },
    stop(when?: number): void {
      if (!started || ended) return;
      raw.stop(when);
    },
  };
}

function hash32(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function fillDeterministicCombatNoise(target: Float32Array, cueKey: string): void {
  let state = hash32(cueKey) || 0x6d2b79f5;
  const length = target.length;
  for (let index = 0; index < length; index++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const unit = (state >>> 0) / 4_294_967_296;
    target[index] = (unit * 2 - 1) * (1 - index / length);
  }
}

function nodeCount(cue: CombatCueV1): number {
  if (cue.impact !== null) {
    return 6 + (cue.impact.critical ? 2 : 0) + (cue.impact.abilityProc ? 3 : 0);
  }
  if (cue.guardianMotif !== null) return 7;
  const primary = cue.families[0];
  if (primary === 'initiative' || primary === 'stun-skipped' || primary === 'defeat') return 3;
  if (primary === 'dodge') return 4;
  if (primary === 'resolution') return 5;
  if (primary === 'burn' || primary === 'regen') {
    return 1
      + (cue.families.includes('burn') ? 3 : 0)
      + (cue.families.includes('regen') ? 2 : 0)
      + (cue.families.includes('defeat') ? 2 : 0);
  }
  throw new TypeError(`combat cue family ${String(primary)} has no authored synthesis`);
}

function createVoiceGraph(
  contextValue: AudioContextLike,
  reservation: AudioVoiceReservation,
  cue: CombatCueV1,
): AudioVoiceGraph {
  const context = synthesisContext(contextValue);
  const impact = cue.impact!;
  const nodes: AudioNodeLike[] = [];
  const sources: Array<Readonly<{ source: AudioScheduledSourceLike; endTime: number }>> = [];
  try {
    const output = context.createGain() as SynthesisGainNodeLike;
    nodes.push(output);
    output.gain.value = 1;

    const impactEnvelope = context.createGain() as SynthesisGainNodeLike;
    nodes.push(impactEnvelope);
    const impactGain = exponentialParam(impactEnvelope.gain, 'impact gain');
    impactEnvelope.connect(output);

    const startTime = context.currentTime + 0.01;
    const heavy = Math.max(0.15, Math.min(1, impact.damageFraction || 0.3));
    impactGain.setValueAtTime(0.0001, startTime);
    impactGain.exponentialRampToValueAtTime(0.16 + heavy * 0.3, startTime + 0.008);
    impactGain.exponentialRampToValueAtTime(0.0001, startTime + 0.10 + heavy * 0.22);

    const bodyRaw = context.createOscillator();
    if (!bodyRaw || typeof bodyRaw.frequency?.setValueAtTime !== 'function') {
      try { bodyRaw?.disconnect(); } catch { /* invalid node */ }
      throw new TypeError('combat body oscillator is invalid');
    }
    const bodyEnd = startTime + 0.12 + heavy * 0.22;
    const body = scheduledSource(bodyRaw, startTime, bodyEnd);
    nodes.push(body);
    sources.push(Object.freeze({ source: body, endTime: bodyEnd }));
    bodyRaw.type = 'triangle';
    bodyRaw.frequency.setValueAtTime(220 - heavy * 120, startTime);
    exponentialParam(bodyRaw.frequency, 'body pitch')
      .exponentialRampToValueAtTime(Math.max(40, 70 - heavy * 25), startTime + 0.09 + heavy * 0.14);
    body.connect(impactEnvelope);

    const sampleLength = Math.max(1, Math.floor(context.sampleRate * 0.07));
    const buffer = context.createBuffer(1, sampleLength, context.sampleRate);
    const channel = buffer.getChannelData(0);
    if (!(channel instanceof Float32Array) || channel.length !== sampleLength) {
      throw new TypeError('combat impact buffer is invalid');
    }
    fillDeterministicCombatNoise(channel, cue.cueId);
    const noiseRaw = context.createBufferSource();
    if (!noiseRaw) throw new TypeError('combat impact source is invalid');
    noiseRaw.buffer = buffer;
    const noiseEnd = startTime + 0.08;
    const noise = scheduledSource(noiseRaw, startTime, noiseEnd);
    nodes.push(noise);
    sources.push(Object.freeze({ source: noise, endTime: noiseEnd }));
    const impactBand = context.createBiquadFilter();
    nodes.push(impactBand);
    impactBand.type = 'bandpass';
    impactBand.frequency.value = impact.critical ? 2600 : 900 + heavy * 700;
    impactBand.Q.value = impact.critical ? 2.2 : 1.1;
    const noiseGain = context.createGain() as SynthesisGainNodeLike;
    nodes.push(noiseGain);
    noiseGain.gain.value = impact.critical ? 0.5 : 0.28;
    noise.connect(impactBand);
    impactBand.connect(noiseGain);
    noiseGain.connect(impactEnvelope);

    if (impact.critical) {
      const criticalRaw = context.createOscillator();
      if (!criticalRaw || typeof criticalRaw.frequency?.setValueAtTime !== 'function') {
        try { criticalRaw?.disconnect(); } catch { /* invalid node */ }
        throw new TypeError('combat critical oscillator is invalid');
      }
      const criticalEnd = startTime + 0.22;
      const critical = scheduledSource(criticalRaw, startTime, criticalEnd);
      nodes.push(critical);
      sources.push(Object.freeze({ source: critical, endTime: criticalEnd }));
      criticalRaw.type = 'sine';
      criticalRaw.frequency.setValueAtTime(1760, startTime);
      exponentialParam(criticalRaw.frequency, 'critical pitch')
        .exponentialRampToValueAtTime(2640, startTime + 0.14);
      const criticalGainNode = context.createGain() as SynthesisGainNodeLike;
      nodes.push(criticalGainNode);
      const criticalGain = exponentialParam(criticalGainNode.gain, 'critical gain');
      criticalGain.setValueAtTime(0.0001, startTime);
      criticalGain.exponentialRampToValueAtTime(0.14, startTime + 0.02);
      criticalGain.exponentialRampToValueAtTime(0.0001, startTime + 0.20);
      critical.connect(criticalGainNode);
      criticalGainNode.connect(output);
    }

    if (impact.abilityProc) {
      const abilityRaw = context.createOscillator();
      if (!abilityRaw || typeof abilityRaw.frequency?.setValueAtTime !== 'function') {
        try { abilityRaw?.disconnect(); } catch { /* invalid node */ }
        throw new TypeError('combat ability oscillator is invalid');
      }
      const abilityStart = startTime + 0.02;
      const abilityEnd = startTime + 0.24;
      const ability = scheduledSource(abilityRaw, abilityStart, abilityEnd);
      nodes.push(ability);
      sources.push(Object.freeze({ source: ability, endTime: abilityEnd }));
      abilityRaw.type = 'sawtooth';
      abilityRaw.frequency.setValueAtTime(330, abilityStart);
      exponentialParam(abilityRaw.frequency, 'ability pitch')
        .exponentialRampToValueAtTime(880, startTime + 0.16);
      const abilityBand = context.createBiquadFilter();
      nodes.push(abilityBand);
      abilityBand.type = 'bandpass';
      abilityBand.frequency.value = 1200;
      abilityBand.Q.value = 4;
      const abilityGainNode = context.createGain() as SynthesisGainNodeLike;
      nodes.push(abilityGainNode);
      const abilityGain = exponentialParam(abilityGainNode.gain, 'ability gain');
      abilityGain.setValueAtTime(0.0001, abilityStart);
      abilityGain.exponentialRampToValueAtTime(0.08, startTime + 0.05);
      abilityGain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);
      ability.connect(abilityBand);
      abilityBand.connect(abilityGainNode);
      abilityGainNode.connect(output);
    }

    if (nodes.length !== reservation.graphNodes || nodes.length !== nodeCount(cue)) {
      throw new TypeError('combat graph reservation does not match its exact cue');
    }
    const completion = sources.reduce((latest, candidate) =>
      candidate.endTime > latest.endTime ? candidate : latest);
    return Object.freeze({
      source: completion.source,
      sources: Object.freeze(sources.map((row) => row.source)),
      output,
      nodes: Object.freeze(nodes),
      reservation,
    });
  } catch (error) {
    for (let index = nodes.length - 1; index >= 0; index--) {
      try { nodes[index]!.disconnect(); } catch { /* construction fault remains authoritative */ }
    }
    throw error;
  }
}

interface ToneProfile {
  readonly waveform: OscillatorWaveform;
  readonly startHz: number;
  readonly endHz: number;
  readonly startOffset: number;
  readonly duration: number;
  readonly peak: number;
  readonly label: string;
}

function createNonImpactVoiceGraph(
  contextValue: AudioContextLike,
  reservation: AudioVoiceReservation,
  cue: CombatCueV1,
): AudioVoiceGraph {
  const context = synthesisContext(contextValue);
  const nodes: AudioNodeLike[] = [];
  const sources: Array<Readonly<{ source: AudioScheduledSourceLike; endTime: number }>> = [];
  try {
    const output = context.createGain() as SynthesisGainNodeLike;
    nodes.push(output);
    output.gain.value = 1;
    const baseTime = context.currentTime + 0.01;

    const addTone = (profile: ToneProfile): void => {
      const raw = context.createOscillator();
      if (!raw || typeof raw.frequency?.setValueAtTime !== 'function') {
        try { raw?.disconnect(); } catch { /* invalid node */ }
        throw new TypeError(`combat ${profile.label} oscillator is invalid`);
      }
      const start = baseTime + profile.startOffset;
      const end = start + profile.duration;
      const source = scheduledSource(raw, start, end);
      nodes.push(source);
      sources.push(Object.freeze({ source, endTime: end }));
      raw.type = profile.waveform;
      raw.frequency.setValueAtTime(profile.startHz, start);
      exponentialParam(raw.frequency, `${profile.label} pitch`)
        .exponentialRampToValueAtTime(profile.endHz, end - 0.01);
      const gainNode = context.createGain() as SynthesisGainNodeLike;
      nodes.push(gainNode);
      const gain = exponentialParam(gainNode.gain, `${profile.label} gain`);
      gain.setValueAtTime(0.0001, start);
      gain.exponentialRampToValueAtTime(profile.peak, start + Math.min(0.018, profile.duration / 3));
      gain.exponentialRampToValueAtTime(0.0001, end - 0.005);
      source.connect(gainNode);
      gainNode.connect(output);
    };

    const addNoise = (input: Readonly<{
      label: string;
      duration: number;
      frequency: number;
      q: number;
      peak: number;
    }>): void => {
      const sampleLength = Math.max(1, Math.floor(context.sampleRate * input.duration));
      const buffer = context.createBuffer(1, sampleLength, context.sampleRate);
      const channel = buffer.getChannelData(0);
      if (!(channel instanceof Float32Array) || channel.length !== sampleLength) {
        throw new TypeError(`combat ${input.label} buffer is invalid`);
      }
      fillDeterministicCombatNoise(channel, `${cue.cueId}:${input.label}`);
      const raw = context.createBufferSource();
      if (!raw) throw new TypeError(`combat ${input.label} source is invalid`);
      raw.buffer = buffer;
      const end = baseTime + input.duration;
      const source = scheduledSource(raw, baseTime, end);
      nodes.push(source);
      sources.push(Object.freeze({ source, endTime: end }));
      const band = context.createBiquadFilter();
      nodes.push(band);
      band.type = 'bandpass';
      band.frequency.value = input.frequency;
      band.Q.value = input.q;
      const gainNode = context.createGain() as SynthesisGainNodeLike;
      nodes.push(gainNode);
      const gain = exponentialParam(gainNode.gain, `${input.label} gain`);
      gain.setValueAtTime(0.0001, baseTime);
      gain.exponentialRampToValueAtTime(input.peak, baseTime + 0.012);
      gain.exponentialRampToValueAtTime(0.0001, end - 0.005);
      source.connect(band);
      band.connect(gainNode);
      gainNode.connect(output);
    };

    if (cue.guardianMotif !== null) {
      const fact = cue.guardianMotif;
      const theme = hash32(`${fact.kind}:${fact.abilityTheme}:${fact.signatureId ?? fact.epithet}`);
      const root = 42 + (theme % 29) + Math.min(28, fact.tier * 2);
      const contour = fact.motif === 'entrance' ? 0.72
        : fact.motif === 'phase' ? 1.48
          : fact.motif === 'victory' ? 1.82 : 0.54;
      const duration = fact.motif === 'entrance' ? 0.72 : 0.54;
      addTone({
        waveform: 'triangle', startHz: root, endHz: Math.max(28, root * contour),
        startOffset: 0, duration, peak: 0.18, label: 'guardian-root',
      });
      addTone({
        waveform: fact.kind === 'titan' ? 'sawtooth' : 'square',
        startHz: root * 1.5, endHz: Math.max(36, root * 1.5 * contour),
        startOffset: 0.025, duration: duration * 0.82, peak: 0.075,
        label: 'guardian-overtone',
      });
      addTone({
        waveform: 'sine', startHz: root * 3, endHz: Math.max(52, root * 3 * contour),
        startOffset: 0.06, duration: duration * 0.62, peak: 0.05,
        label: 'guardian-sigil',
      });
    } else {
      const primary = cue.families[0];
      if (primary === 'initiative') {
        const sideLift = cue.actorSide === 'A' ? 1 : 1.18;
        addTone({
          waveform: 'triangle', startHz: 420 * sideLift, endHz: 840 * sideLift,
          startOffset: 0, duration: 0.16, peak: 0.11, label: 'initiative',
        });
      } else if (primary === 'dodge') {
        addNoise({ label: 'dodge', duration: 0.12, frequency: 2200, q: 1.8, peak: 0.12 });
      } else if (primary === 'stun-skipped') {
        addTone({
          waveform: 'square', startHz: 310, endHz: 92,
          startOffset: 0, duration: 0.2, peak: 0.08, label: 'stun-skipped',
        });
      } else if (primary === 'burn' || primary === 'regen') {
        if (cue.families.includes('burn')) {
          addNoise({ label: 'burn', duration: 0.2, frequency: 1450, q: 2.6, peak: 0.1 });
        }
        if (cue.families.includes('regen')) {
          addTone({
            waveform: 'sine', startHz: 260, endHz: 720,
            startOffset: 0.02, duration: 0.24, peak: 0.085, label: 'regen',
          });
        }
        if (cue.families.includes('defeat')) {
          addTone({
            waveform: 'triangle', startHz: 150, endHz: 42,
            startOffset: 0.01, duration: 0.34, peak: 0.13, label: 'tick-defeat',
          });
        }
      } else if (primary === 'defeat') {
        addTone({
          waveform: 'triangle', startHz: 150, endHz: 42,
          startOffset: 0, duration: 0.34, peak: 0.13, label: 'defeat',
        });
      } else if (primary === 'resolution') {
        const victory = cue.actorSide !== null;
        addTone({
          waveform: 'triangle', startHz: victory ? 330 : 260, endHz: victory ? 660 : 260,
          startOffset: 0, duration: 0.28, peak: 0.1, label: 'resolution-root',
        });
        addTone({
          waveform: 'sine', startHz: victory ? 495 : 390, endHz: victory ? 990 : 390,
          startOffset: 0.055, duration: 0.32, peak: 0.075, label: 'resolution-crown',
        });
      } else {
        throw new TypeError(`combat cue family ${String(primary)} has no authored synthesis`);
      }
    }

    if (sources.length < 1 || nodes.length !== reservation.graphNodes
      || nodes.length !== nodeCount(cue)) {
      throw new TypeError('combat graph reservation does not match its exact cue');
    }
    const completion = sources.reduce((latest, candidate) => (
      candidate.endTime > latest.endTime ? candidate : latest
    ));
    return Object.freeze({
      source: completion.source,
      sources: Object.freeze(sources.map((row) => row.source)),
      output,
      nodes: Object.freeze(nodes),
      reservation,
    });
  } catch (error) {
    for (let index = nodes.length - 1; index >= 0; index--) {
      try { nodes[index]!.disconnect(); } catch { /* construction fault remains authoritative */ }
    }
    throw error;
  }
}

/** Render one registered cue through its stable first-family counterpart.
 * Multi-family rows (for example burn+regen+defeat or a critical ability
 * strike) remain one composite voice, preventing duplicate semantics. */
export function createCombatGameplayVoiceRequest(
  input: CombatGameplayVoiceRequestInput,
): AudioVoiceRequest {
  if (!isRecord(input) || !hasExactKeys(input, ['plan', 'cue', 'counterpart'])) {
    throw new TypeError('combat gameplay voice request input is invalid');
  }
  const cue = canonicalCue(input.plan, input.cue);
  const counterpart = canonicalCounterpart(input.counterpart, cue);
  return Object.freeze({
    key: `combat-gameplay:${cue.cueId}`,
    category: 'combat-gameplay',
    priority: cuePriority(cue),
    cooldownGroup: `combat-gameplay:${cue.cueId}`,
    cooldownMs: 0,
    concurrencyGroup: CONCURRENCY_GROUP,
    maxConcurrent: MAX_CONCURRENT,
    nodeCount: nodeCount(cue),
    mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
    meaning: Object.freeze({ kind: 'meaningful', counterpart }),
    create: (context: AudioContextLike, reservation: AudioVoiceReservation) => (
      cue.impact === null
        ? createNonImpactVoiceGraph(context, reservation, cue)
        : createVoiceGraph(context, reservation, cue)
    ),
  });
}
