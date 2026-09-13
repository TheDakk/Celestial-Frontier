import { describe, expect, it } from 'vitest';
import { createAudioRuntime, type AudioContextLike, type AudioNodeLike, type AudioScheduledSourceLike } from '@cf/audio';
import { parsePilotPcm, pilotPcmVoice, PILOT_PCM_FILE_LIMIT } from '../apps/game/src/pilot-pcm.js';

function wav(samples: readonly number[] = [32767, -32768, 0, 16384, -16384, 8192], channels = 2, frames = samples.length / channels): ArrayBuffer {
  const bytes = new ArrayBuffer(44 + frames * channels * 2);
  const v = new DataView(bytes);
  const tag = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  tag(0, 'RIFF'); v.setUint32(4, bytes.byteLength - 8, true); tag(8, 'WAVE'); tag(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, channels, true);
  v.setUint32(24, 48000, true); v.setUint32(28, 48000 * channels * 2, true);
  v.setUint16(32, channels * 2, true); v.setUint16(34, 16, true); tag(36, 'data');
  v.setUint32(40, frames * channels * 2, true);
  for (let i = 0; i < Math.min(samples.length, frames * channels); i++) v.setInt16(44 + i * 2, samples[i]!, true);
  return bytes;
}
function append(bytes: ArrayBuffer, tail: readonly number[]): ArrayBuffer {
  const out = new Uint8Array(bytes.byteLength + tail.length); out.set(new Uint8Array(bytes)); out.set(tail, bytes.byteLength);
  new DataView(out.buffer).setUint32(4, out.byteLength - 8, true); return out.buffer;
}
class Node implements AudioNodeLike {
  readonly destinations: AudioNodeLike[] = []; disconnects = 0;
  connect(node: AudioNodeLike): void { this.destinations.push(node); }
  disconnect(): void { this.disconnects++; }
}
class Param {
  value = 0; readonly events: { kind: string; value: number; time: number }[] = [];
  setValueAtTime(value: number, time: number): void { this.value = value; this.events.push({ kind: 'set', value, time }); }
  linearRampToValueAtTime(value: number, time: number): void { this.value = value; this.events.push({ kind: 'ramp', value, time }); }
}
class Gain extends Node { readonly gain = new Param(); }
class Buffer {
  readonly channels: Float32Array[];
  constructor(channels: number, frames: number) { this.channels = Array.from({ length: channels }, () => new Float32Array(frames)); }
  getChannelData(channel: number): Float32Array { return this.channels[channel]!; }
}
class Source extends Node implements AudioScheduledSourceLike {
  buffer: Buffer | null = null; onended: (() => void) | null = null; starts = 0; stops = 0;
  start(): void { this.starts++; } stop(): void { this.stops++; }
}
class Context implements AudioContextLike {
  currentTime = 2; state = 'running'; readonly destination = new Node();
  readonly buffers: Buffer[] = []; readonly sources: Source[] = []; readonly gains: Gain[] = [];
  createGain(): Gain { const g = new Gain(); this.gains.push(g); return g; }
  createBuffer(channels: number, frames: number, rate: number): Buffer {
    expect(rate).toBe(48000); const b = new Buffer(channels, frames); this.buffers.push(b); return b;
  }
  createBufferSource(): Source { const s = new Source(); this.sources.push(s); return s; }
  createAnalyser() { return Object.assign(new Node(), { fftSize: 32, smoothingTimeConstant: 0,
    frequencyBinCount: 16, getFloatTimeDomainData: (a: Float32Array) => a.fill(0) }); }
  createDynamicsCompressor() { return Object.assign(new Node(), { threshold: new Param(), knee: new Param(),
    ratio: new Param(), attack: new Param(), release: new Param() }); }
  async resume(): Promise<void> { this.state = 'running'; }
  async close(): Promise<void> { this.state = 'closed'; }
}
const reservation = Object.freeze({ id: 'reservation-pcm-test', graphNodes: 2, totalNodes: 3 });
const options = Object.freeze({ mono: false, reducedIntensity: false, gain: 0.8 });

describe('bounded pilot PCM16 decoding', () => {
  it('decodes signed little-endian stereo exactly without mutating the file', () => {
    const bytes = wav(); const before = new Uint8Array(bytes).slice(); const pcm = parsePilotPcm(bytes);
    expect(pcm).toMatchObject({ sampleRate: 48000, frames: 3, durationMs: 3 / 48, decodedBytes: 24 });
    expect([...pcm.channels[0]!]).toEqual([32767 / 32768, 0, -0.5]);
    expect([...pcm.channels[1]!]).toEqual([-1, 0.5, 0.25]);
    expect(new Uint8Array(bytes)).toEqual(before); expect(Object.isFrozen(pcm)).toBe(true);
    expect(Object.isFrozen(pcm.channels)).toBe(true);
    expect([...parsePilotPcm(wav([-32768, 32767], 1)).channels[0]!]).toEqual([-1, 32767 / 32768]);
  });
  it.each([
    ['codec', 20, 3, 2], ['channels', 22, 3, 2], ['rate', 24, 44100, 4],
    ['byte rate', 28, 1, 4], ['block alignment', 32, 2, 2], ['sample width', 34, 8, 2],
  ] as const)('rejects a malformed %s', (_name, offset, value, width) => {
    const bytes = wav(); const view = new DataView(bytes);
    if (width === 2) view.setUint16(offset, value, true); else view.setUint32(offset, value, true);
    expect(() => parsePilotPcm(bytes)).toThrow();
  });
  it('rejects incomplete RIFF, trailing headers, missing padding, duplicate chunks and partial samples', () => {
    expect(() => parsePilotPcm(wav().slice(0, -1))).toThrow();
    const wrongTag = wav(); new DataView(wrongTag).setUint8(0, 0); expect(() => parsePilotPcm(wrongTag)).toThrow();
    expect(() => parsePilotPcm(append(wav(), [1]))).toThrow('chunk header');
    const oddJunk = [74, 85, 78, 75, 1, 0, 0, 0, 7];
    expect(() => parsePilotPcm(append(wav(), oddJunk))).toThrow('padding');
    expect(parsePilotPcm(append(wav(), [...oddJunk, 0])).frames).toBe(3);
    expect(() => parsePilotPcm(append(wav(), [100, 97, 116, 97, 0, 0, 0, 0]))).toThrow('Duplicate');
    const duplicateFmt = [...new Uint8Array(wav()).slice(12, 36)];
    expect(() => parsePilotPcm(append(wav(), duplicateFmt))).toThrow('PCM');
    const overrun = wav(); new DataView(overrun).setUint32(40, 0xffffffff, true);
    expect(() => parsePilotPcm(overrun)).toThrow('Truncated');
    const partial = wav(); new DataView(partial).setUint32(40, 11, true);
    expect(() => parsePilotPcm(partial)).toThrow('duration');
  });
  it('enforces file, frame duration and caller decoded-allocation ceilings', () => {
    expect(() => parsePilotPcm(new ArrayBuffer(PILOT_PCM_FILE_LIMIT + 1))).toThrow('byte limit');
    expect(() => parsePilotPcm(wav([], 1, 0))).toThrow('duration');
    expect(() => parsePilotPcm(wav([], 1, 48_000 * 24 + 1))).toThrow('duration');
    const max = parsePilotPcm(wav([], 2, 48_000 * 24));
    expect(max.decodedBytes).toBe(9_216_000); expect(max.durationMs).toBe(24_000);
    expect(() => parsePilotPcm(wav(), 23)).toThrow('decoded byte limit');
    expect(parsePilotPcm(wav(), 24).decodedBytes).toBe(24);
    expect(() => parsePilotPcm(wav(), Infinity)).toThrow('decoded byte limit');
  });
});

describe('pilot PCM graph on the shared finite voice runtime', () => {
  it('retains stereo or averages mono, snapshots options, and returns exact unstarted graph ownership', () => {
    const pcm = parsePilotPcm(wav()); const context = new Context();
    const stereo = pilotPcmVoice('cf-pilot-test', 'music', pcm, options);
    const graph = stereo.create(context, reservation);
    expect(context.buffers[0]!.channels).toEqual(pcm.channels);
    expect(graph.nodes).toEqual([context.sources[0], context.gains[0]]);
    expect(graph.sources).toEqual([graph.source]); expect(graph.output).toBe(context.gains[0]);
    expect(graph.reservation).toBe(reservation); expect(context.sources[0]!.starts).toBe(0);
    expect(context.sources[0]!.destinations).toEqual([graph.output]);
    const setting = { mono: true, reducedIntensity: true, gain: 0.8 };
    const mono = pilotPcmVoice('cf-pilot-mono', 'ui', pcm, setting);
    setting.mono = false; setting.reducedIntensity = false; setting.gain = 1;
    mono.create(context, reservation);
    expect(context.buffers[1]!.channels).toHaveLength(1);
    expect([...context.buffers[1]!.channels[0]!]).toEqual([-1 / 65536, 0.25, -0.125]);
    const automation = context.gains[1]!.gain.events;
    expect(automation.map((event) => event.value)).toEqual([0, 0.8 * 0.55, 0.8 * 0.55, 0]);
    expect(automation.map((event) => event.time)).toEqual([...automation.map((event) => event.time)].sort((a, b) => a - b));
    expect(automation.at(-1)!.time).toBe(2 + pcm.durationMs / 1000);
    expect(stereo.maxDurationMs).toBe(101);
  });
  it('cleans all nodes on natural completion and on its deadline with no repeated playback', async () => {
    for (const completion of ['natural', 'deadline'] as const) {
      const context = new Context(); let now = 100; const scheduled = new Map<() => void, number>();
      const runtime = createAudioRuntime({ createContext: () => context, nowMs: () => now, initialMuted: false,
        scheduleVoiceDeadline: (callback, delay) => { scheduled.set(callback, delay); return () => { scheduled.delete(callback); }; } });
      await runtime.activate();
      const started = runtime.playVoice(pilotPcmVoice('cf-pilot-life', 'ui', parsePilotPcm(wav([100], 1)), options));
      expect(started.kind).toBe('started'); expect(context.sources[0]!.starts).toBe(1);
      const output = context.sources[0]!.destinations[0] as Gain;
      if (completion === 'natural') context.sources[0]!.onended!();
      else { now = 201; const callback = [...scheduled.keys()][0]!; scheduled.delete(callback); callback(); }
      expect(runtime.diagnostics().voices).toMatchObject({ active: 0, started: 1 });
      expect(context.sources[0]!.disconnects).toBeGreaterThan(0); expect(output.disconnects).toBeGreaterThan(0);
      expect(scheduled.size).toBe(0); expect(context.sources).toHaveLength(1);
      await runtime.dispose();
    }
  });
  it('rejects wrong categories, invalid gain/options and forged allocation shapes', () => {
    const pcm = parsePilotPcm(wav());
    expect(() => pilotPcmVoice('game-reward', 'ui', pcm, options)).toThrow();
    expect(() => pilotPcmVoice('cf-pilot-test', 'creature', pcm, options)).toThrow();
    for (const gain of [NaN, Infinity, -1, 1.1]) expect(() => pilotPcmVoice('cf-pilot-test', 'ui', pcm, { ...options, gain })).toThrow();
    expect(() => pilotPcmVoice('cf-pilot-test', 'ui', pcm, { ...options, mono: 'yes' } as never)).toThrow();
    for (const patch of [{ frames: 48_000 * 24 + 1 }, { channels: [new Float32Array(2)] }, { durationMs: 1000 }, { decodedBytes: 1 }]) {
      expect(() => pilotPcmVoice('cf-pilot-test', 'ui', { ...pcm, ...patch }, options)).toThrow();
    }
  });
});
