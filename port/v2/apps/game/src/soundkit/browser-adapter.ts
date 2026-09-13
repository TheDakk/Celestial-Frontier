/* Thin browser edge: derived Float32 samples -> AudioBuffer, and a request
   factory that schedules one derived cue through the existing runtime's
   AudioVoiceRequest shape (buffer source -> gain). Types only; no runtime edits. */
import type {
  AudioContextLike, AudioGainNodeLike, AudioNodeLike, AudioScheduledSourceLike, AudioVoiceGraph,
  AudioVoiceMeaning, AudioVoiceRequest, AudioVoiceReservation,
} from '@cf/audio';
import type { DerivedCue } from './derive.js';
import type { SoundKitVoiceIntent } from './mix.js';

export interface AudioBufferLike { copyToChannel(source: Float32Array, channel: number): void }
export interface BufferSourceLike extends AudioScheduledSourceLike { buffer: AudioBufferLike | null }
export interface BufferContextLike extends AudioContextLike {
  createBuffer(channels: number, length: number, sampleRate: number): AudioBufferLike;
  createBufferSource(): BufferSourceLike;
}

export function toAudioBuffer(context: BufferContextLike, derived: DerivedCue): AudioBufferLike {
  const buffer = context.createBuffer(1, derived.samples.length, derived.sampleRate);
  buffer.copyToChannel(derived.samples, 0);
  return buffer;
}

/** Build a runtime request whose graph is one buffer source into one gain (nodeCount 2). */
export function createDerivedVoiceRequest(
  intent: SoundKitVoiceIntent,
  derived: DerivedCue,
  meaning: AudioVoiceMeaning = { kind: 'decorative' },
  gain = 1,
): AudioVoiceRequest {
  const { cueId: _cueId, ...request } = intent;
  return Object.freeze({
    ...request,
    nodeCount: 2,
    maxDurationMs: intent.maxDurationMs ?? Math.ceil((derived.samples.length / derived.sampleRate) * 1000) + 100,
    meaning,
    create: (context: AudioContextLike, reservation: AudioVoiceReservation): AudioVoiceGraph => {
      const ctx = context as BufferContextLike;
      const source = ctx.createBufferSource();
      source.buffer = toAudioBuffer(ctx, derived);
      const out: AudioGainNodeLike = ctx.createGain();
      out.gain.setValueAtTime(gain, ctx.currentTime);
      source.connect(out);
      const nodes: readonly AudioNodeLike[] = Object.freeze([source, out]);
      return Object.freeze({ source, sources: Object.freeze([source]), output: out, nodes, reservation });
    },
  });
}
