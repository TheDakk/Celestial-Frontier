/* Pure WAV writer/reader for evidence files: 48 kHz, 16-bit PCM, mono. */
export interface WavHeader {
  readonly sampleRate: number; readonly channels: number; readonly bitsPerSample: number;
  readonly dataBytes: number; readonly frames: number;
}

export function encodeWav16(samples: Float32Array, sampleRate = 48_000): Uint8Array {
  const dataBytes = samples.length * 2;
  const out = new Uint8Array(44 + dataBytes);
  const v = new DataView(out.buffer);
  const tag = (o: number, s: string): void => { for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i); };
  tag(0, 'RIFF'); v.setUint32(4, 36 + dataBytes, true); tag(8, 'WAVE');
  tag(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  tag(36, 'data'); v.setUint32(40, dataBytes, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    v.setInt16(44 + i * 2, Math.round(s < 0 ? s * 32768 : s * 32767), true);
  }
  return out;
}

export function readWavHeader(bytes: Uint8Array): WavHeader {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (o: number): string => String.fromCharCode(bytes[o] ?? 0, bytes[o + 1] ?? 0, bytes[o + 2] ?? 0, bytes[o + 3] ?? 0);
  if (bytes.length < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE' || tag(12) !== 'fmt ' || tag(36) !== 'data') {
    throw new RangeError('not a canonical 44-byte-header PCM WAV');
  }
  const channels = v.getUint16(22, true);
  const bitsPerSample = v.getUint16(34, true);
  const dataBytes = v.getUint32(40, true);
  return Object.freeze({
    sampleRate: v.getUint32(24, true), channels, bitsPerSample, dataBytes,
    frames: dataBytes / (channels * (bitsPerSample / 8)),
  });
}
