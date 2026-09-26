/* Small, bounded PCM intake for the authored pilot. Parsing owns no AudioContext;
   playback is admitted through the game's existing finite-voice runtime. */
import {
  createAudioVoiceMixIntentV1, type AudioCategory, type AudioVoiceRequest,
  type AudioContextLike, type AudioGainNodeLike, type AudioParamLike, type AudioScheduledSourceLike,
} from '@cf/audio';

interface PcmBufferLike { getChannelData(channel: number): Float32Array; }
interface PcmSourceLike extends AudioScheduledSourceLike { buffer: PcmBufferLike | null; }
interface PcmGainLike extends AudioGainNodeLike {
  readonly gain: AudioParamLike & { linearRampToValueAtTime(value: number, time: number): unknown };
}
interface PcmContextLike extends AudioContextLike {
  createBuffer(channels: number, length: number, sampleRate: number): PcmBufferLike;
  createBufferSource(): PcmSourceLike;
  createGain(): PcmGainLike;
}

export interface PilotPcm {
  readonly sampleRate: 48000;
  readonly frames: number;
  /** Planar Float32 samples until the full-channel AudioBuffer is first built;
   * afterwards the buffer's own channel views, so decoded audio is held once
   * (K30). Always frozen, always `frames` long per channel. */
  readonly channels: readonly Float32Array[];
  readonly durationMs: number;
  readonly decodedBytes: number;
}
export const PILOT_PCM_FILE_LIMIT = 4_700_000;

/* K30: the full-channel and mono AudioBuffers are built once per decoded cue and
   reused by every later play. Once the full buffer exists the planar copies are
   released in favour of its channel views. Keyed weakly so a disposed cache
   releases everything. */
interface PilotPcmSlot {
  channels: readonly Float32Array[];
  full: PcmBufferLike | null;
  mono: PcmBufferLike | null;
}
const SLOTS = new WeakMap<PilotPcm, PilotPcmSlot>();
const LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

export function pilotPcmBufferDiagnostics(pcm: PilotPcm): Readonly<{ full: boolean; mono: boolean; planarReleased: boolean }> {
  const slot = SLOTS.get(pcm);
  return Object.freeze({ full: slot?.full !== null && slot?.full !== undefined,
    mono: slot?.mono !== null && slot?.mono !== undefined,
    planarReleased: slot?.full !== null && slot?.full !== undefined });
}

function pilotPcmBuffer(native: PcmContextLike, pcm: PilotPcm, channelCount: number): PcmBufferLike {
  const slot = SLOTS.get(pcm);
  const variant = channelCount === pcm.channels.length ? 'full' : 'mono';
  const cached = slot?.[variant];
  if (cached) return cached;
  const sources = pcm.channels;
  const buffer = native.createBuffer(channelCount, pcm.frames, pcm.sampleRate);
  for (let channel = 0; channel < channelCount; channel++) {
    const target = buffer.getChannelData(channel);
    if (variant === 'mono' && sources.length === 2) {
      const left = sources[0]!, right = sources[1]!;
      for (let frame = 0; frame < pcm.frames; frame++) target[frame] = (left[frame]! + right[frame]!) / 2;
    } else target.set(sources[channel]!);
  }
  if (slot) {
    slot[variant] = buffer;
    if (variant === 'full') {
      slot.channels = Object.freeze(Array.from({ length: channelCount }, (_, channel) => buffer.getChannelData(channel)));
    }
  }
  return buffer;
}
export function parsePilotPcm(bytes: ArrayBuffer, decodedByteLimit = 48_000 * 24 * 2 * 4): PilotPcm {
  if (!Number.isSafeInteger(decodedByteLimit) || decodedByteLimit < 0) throw new RangeError('Pilot decoded byte limit');
  if (bytes.byteLength < 44 || bytes.byteLength > PILOT_PCM_FILE_LIMIT) throw new RangeError('Pilot PCM byte limit');
  const view = new DataView(bytes);
  const tag = (offset: number): string => String.fromCharCode(...new Uint8Array(bytes, offset, 4));
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE' || view.getUint32(4, true) + 8 !== bytes.byteLength) {
    throw new TypeError('Pilot audio requires a complete RIFF WAVE');
  }
  let count = 0, rate = 0, block = 0, start = -1, length = 0;
  let foundFormat = false;
  let offset = 12;
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) throw new RangeError('Truncated pilot PCM chunk header');
    const size = view.getUint32(offset + 4, true);
    if (offset + 8 + size > bytes.byteLength) throw new RangeError('Truncated pilot PCM chunk');
    const name = tag(offset);
    if (name === 'fmt ') {
      if (foundFormat || size < 16 || view.getUint16(offset + 8, true) !== 1) throw new TypeError('Pilot audio must be PCM');
      foundFormat = true;
      count = view.getUint16(offset + 10, true);
      rate = view.getUint32(offset + 12, true);
      block = view.getUint16(offset + 20, true);
      if ((count !== 1 && count !== 2) || rate !== 48000 || block !== count * 2
        || view.getUint16(offset + 22, true) !== 16
        || view.getUint32(offset + 16, true) !== rate * block) throw new TypeError('Unsupported pilot PCM format');
    } else if (name === 'data') {
      if (start !== -1) throw new TypeError('Duplicate pilot PCM data');
      start = offset + 8; length = size;
    }
    offset += 8 + size + (size & 1);
    if (offset > bytes.byteLength) throw new RangeError('Truncated pilot PCM padding');
  }
  const frames = length / block;
  if (!foundFormat || start < 0 || !Number.isInteger(frames) || frames < 1 || frames > 48000 * 24) {
    throw new RangeError('Invalid pilot PCM duration');
  }
  const decodedBytes = frames * count * 4;
  if (decodedBytes > decodedByteLimit) throw new RangeError('Pilot decoded byte limit');
  const channels = Array.from({ length: count }, () => new Float32Array(frames));
  if (LITTLE_ENDIAN && (start & 1) === 0) {
    // K31: one aligned little-endian view over the interleaved data chunk; no
    // per-sample DataView call and no intermediate copy.
    const samples = new Int16Array(bytes, start, frames * count);
    for (let channel = 0; channel < count; channel++) {
      const target = channels[channel]!;
      for (let frame = 0, index = channel; frame < frames; frame++, index += count) {
        target[frame] = samples[index]! / 32768;
      }
    }
  } else {
    for (let frame = 0; frame < frames; frame++) {
      for (let channel = 0; channel < count; channel++) {
        channels[channel]![frame] = view.getInt16(start + (frame * count + channel) * 2, true) / 32768;
      }
    }
  }
  const slot: PilotPcmSlot = { channels: Object.freeze(channels), full: null, mono: null };
  const pcm: PilotPcm = Object.freeze({
    sampleRate: 48000 as const, frames,
    get channels(): readonly Float32Array[] { return slot.channels; },
    durationMs: frames / 48, decodedBytes,
  });
  SLOTS.set(pcm, slot);
  return pcm;
}

/** Finite playback: the score deliberately returns to silence, never schedules
 * recurring timers or replays a settled action when visibility returns. */
export function pilotPcmVoice(
  id: string, category: AudioCategory, pcm: PilotPcm,
  options: Readonly<{ mono: boolean; reducedIntensity: boolean; gain: number }>,
): AudioVoiceRequest {
  const { mono, reducedIntensity, gain: requestedGain } = options;
  if (!/^cf-pilot-[a-z-]+$/u.test(id) || !['music', 'ambience', 'ui', 'combat-gameplay'].includes(category)
    || typeof mono !== 'boolean' || typeof reducedIntensity !== 'boolean'
    || !Number.isFinite(requestedGain) || requestedGain < 0 || requestedGain > 1
    || pcm.sampleRate !== 48000 || !Number.isInteger(pcm.frames) || pcm.frames < 1 || pcm.frames > 48_000 * 24
    || (pcm.channels.length !== 1 && pcm.channels.length !== 2)
    || pcm.channels.some((channel) => !(channel instanceof Float32Array) || channel.length !== pcm.frames)
    || pcm.durationMs !== pcm.frames / 48 || pcm.decodedBytes !== pcm.frames * pcm.channels.length * 4) {
    throw new TypeError('Invalid pilot voice');
  }
  const request: AudioVoiceRequest = {
    key: id, category, priority: category === 'music' || category === 'ambience' ? 1 : 2,
    cooldownGroup: id, cooldownMs: 180, concurrencyGroup: `cf-pilot-${category}`, maxConcurrent: 1,
    maxDurationMs: Math.ceil(pcm.durationMs) + 100, nodeCount: 2,
    mixIntent: createAudioVoiceMixIntentV1({ music: 1, ambience: 1, creature: 1, 'combat-gameplay': 1, ui: 1 }),
    meaning: Object.freeze({ kind: 'decorative' as const }),
    create: (context, reservation) => {
      const native = context as PcmContextLike;
      const channelCount = mono ? 1 : pcm.channels.length;
      const buffer = pilotPcmBuffer(native, pcm, channelCount);
      const source = native.createBufferSource();
      const gain = native.createGain();
      source.buffer = buffer;
      const level = requestedGain * (reducedIntensity ? 0.55 : 1);
      const duration = pcm.durationMs / 1000;
      const attack = Math.min(0.012, duration / 2);
      gain.gain.setValueAtTime(0, native.currentTime);
      gain.gain.linearRampToValueAtTime(level, native.currentTime + attack);
      gain.gain.setValueAtTime(level, native.currentTime + Math.max(attack, duration - 0.035));
      gain.gain.linearRampToValueAtTime(0, native.currentTime + duration);
      source.connect(gain);
      return { source, sources: [source], output: gain, nodes: [source, gain], reservation };
    },
  };
  return Object.freeze(request);
}
