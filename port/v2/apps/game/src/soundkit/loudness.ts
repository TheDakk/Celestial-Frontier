/* The MEASURED loudness gate (N5 Stage 0, D15; SOUND_KIT.md: "Loudness targets: music -18 LUFS integrated, ambience -22, creature and
   combat cues -14 short-term peak limited to -1 dBTP, ui -20"). Until 2026-09-25 only sample peak was enforced.

   ITU-R BS.1770-4 for a mono signal: K-weighting (the standard high-shelf + high-pass pair, designed for any sample rate), mean square over
   400 ms blocks (momentary, 75 % overlap) and 3 s windows (short-term, 100 ms hop), integrated loudness with the -70 LUFS absolute and
   -10 LU relative gates, and TRUE peak by 4x oversampling (a 48-tap-per-phase windowed-sinc interpolator), in dBTP. Pure and
   deterministic: no clock, no Math.random, no AudioContext. */

export type LoudnessClass = 'creature' | 'combat' | 'music' | 'ambience' | 'ui';

/** The kit's targets and this gate's Stage 0 tolerances (one table; retune here). Cues are judged by their loudest short-term window,
 * beds and music by integrated loudness. Every class is true-peak limited to -1 dBTP. */
export const LOUDNESS_TARGETS_V1: Readonly<Record<LoudnessClass, Readonly<{ measure: 'short-term-max' | 'integrated'; targetLufs: number; maxOverLu: number; maxUnderLu: number; maxTruePeakDb: number }>>> = Object.freeze({
  creature: Object.freeze({ measure: 'short-term-max', targetLufs: -14, maxOverLu: 1, maxUnderLu: 16, maxTruePeakDb: -1 }),
  combat: Object.freeze({ measure: 'short-term-max', targetLufs: -14, maxOverLu: 1, maxUnderLu: 16, maxTruePeakDb: -1 }),
  music: Object.freeze({ measure: 'integrated', targetLufs: -18, maxOverLu: 2, maxUnderLu: 2, maxTruePeakDb: -1 }),
  ambience: Object.freeze({ measure: 'integrated', targetLufs: -22, maxOverLu: 2, maxUnderLu: 2, maxTruePeakDb: -1 }),
  ui: Object.freeze({ measure: 'short-term-max', targetLufs: -20, maxOverLu: 2, maxUnderLu: 12, maxTruePeakDb: -1 }),
});

type Coeffs = readonly [number, number, number, number, number]; // b0 b1 b2 a1 a2 (a0 normalised)
function kWeightingCoefficients(sampleRate: number): readonly [Coeffs, Coeffs] {
  // BS.1770's pre-filter pair by the libebur128 bilinear design, which reproduces the standard's published 48 kHz coefficients
  // (shelf b = 1.53512485958697, -2.69169618940638, 1.19839281085285; a = -1.69065929318241, 0.73248077421585) at any rate
  const shelf = ((): Coeffs => {
    const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196, K = Math.tan((Math.PI * f0) / sampleRate);
    const Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K;
    return [(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0];
  })();
  const highpass = ((): Coeffs => {
    const f0 = 38.13547087602444, Q = 0.5003270373238773, K = Math.tan((Math.PI * f0) / sampleRate), a0 = 1 + K / Q + K * K;
    return [1, -2, 1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0];
  })();
  return [shelf, highpass];
}
export const __kWeightingCoefficientsForTest = kWeightingCoefficients;
function filter(x: Float32Array | Float64Array, [b0, b1, b2, a1, a2]: Coeffs): Float64Array {
  const y = new Float64Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const xi = x[i] ?? 0, yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; y[i] = yi; x2 = x1; x1 = xi; y2 = y1; y1 = yi; }
  return y;
}
const lufs = (meanSquare: number): number => (meanSquare > 0 ? -0.691 + 10 * Math.log10(meanSquare) : -Infinity);

export interface LoudnessMeasurementV1 {
  readonly schema: 'cf.loudness/v1';
  readonly sampleRate: number;
  readonly durationSeconds: number;
  /** Loudest 400 ms block (LUFS). */
  readonly momentaryMaxLufs: number;
  /** Loudest 3 s window, zero-padded past the end like a meter (LUFS). */
  readonly shortTermMaxLufs: number;
  /** Gated integrated loudness (LUFS); -Infinity when every block is below the absolute gate. */
  readonly integratedLufs: number;
  readonly samplePeakDb: number;
  readonly truePeakDb: number;
}

/** Mean-square energy of the K-weighted signal over [start, start + length) — samples past the end count as silence. */
function windowMeans(z: Float64Array, sampleRate: number, windowSeconds: number, hopSeconds: number): number[] {
  const w = Math.max(1, Math.round(windowSeconds * sampleRate)), hop = Math.max(1, Math.round(hopSeconds * sampleRate)), out: number[] = [];
  const prefix = new Float64Array(z.length + 1); for (let i = 0; i < z.length; i++) prefix[i + 1] = prefix[i]! + z[i]! * z[i]!;
  const last = Math.max(0, z.length - Math.min(w, z.length));
  for (let s = 0; s <= last; s += hop) { const e = Math.min(z.length, s + w); out.push((prefix[e]! - prefix[s]!) / w); }
  return out;
}

const TAPS_PER_PHASE = 48, OVERSAMPLE = 4;
const TRUE_PEAK_KERNEL: readonly Float64Array[] = (() => {
  const half = TAPS_PER_PHASE / 2, phases: Float64Array[] = [];
  for (let p = 0; p < OVERSAMPLE; p++) {
    const k = new Float64Array(TAPS_PER_PHASE), frac = p / OVERSAMPLE;
    for (let t = 0; t < TAPS_PER_PHASE; t++) { const x = t - half + 1 - frac, sinc = Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
      const win = 0.5 * (1 + Math.cos((Math.PI * x) / (half + 1))); k[t] = sinc * (Math.abs(x) <= half + 1 ? win : 0); }
    phases.push(k);
  }
  return phases;
})();
export function truePeakLinearV1(x: Float32Array): number {
  let peak = 0; const half = TAPS_PER_PHASE / 2;
  for (let i = 0; i < x.length; i++) {
    const s = Math.abs(x[i] ?? 0); if (s > peak) peak = s;
    for (let p = 1; p < OVERSAMPLE; p++) { const k = TRUE_PEAK_KERNEL[p]!; let acc = 0;
      for (let t = 0; t < TAPS_PER_PHASE; t++) { const j = i + t - half + 1; if (j >= 0 && j < x.length) acc += (x[j] ?? 0) * k[t]!; }
      const a = Math.abs(acc); if (a > peak) peak = a; }
  }
  return peak;
}
const db = (linear: number): number => (linear > 0 ? 20 * Math.log10(linear) : -Infinity);

export function measureLoudnessV1(samples: Float32Array, sampleRate: number): LoudnessMeasurementV1 {
  if (!(samples instanceof Float32Array)) throw new TypeError('loudness: samples must be a Float32Array');
  if (!Number.isFinite(sampleRate) || sampleRate < 8000) throw new RangeError('loudness: invalid sample rate');
  const [shelf, highpass] = kWeightingCoefficients(sampleRate), z = filter(filter(samples, shelf), highpass);
  const blocks = windowMeans(z, sampleRate, 0.4, 0.1), shortTerm = windowMeans(z, sampleRate, 3, 0.1);
  const absGated = blocks.filter((m) => lufs(m) > -70);
  let integrated = -Infinity;
  if (absGated.length) { const rel = lufs(absGated.reduce((a, b) => a + b, 0) / absGated.length) - 10, gated = absGated.filter((m) => lufs(m) > rel);
    if (gated.length) integrated = lufs(gated.reduce((a, b) => a + b, 0) / gated.length); }
  let samplePeak = 0; for (let i = 0; i < samples.length; i++) samplePeak = Math.max(samplePeak, Math.abs(samples[i] ?? 0));
  return Object.freeze({ schema: 'cf.loudness/v1', sampleRate, durationSeconds: samples.length / sampleRate,
    momentaryMaxLufs: blocks.length ? lufs(Math.max(...blocks)) : -Infinity, shortTermMaxLufs: shortTerm.length ? lufs(Math.max(...shortTerm)) : -Infinity,
    integratedLufs: integrated, samplePeakDb: db(samplePeak), truePeakDb: db(truePeakLinearV1(samples)) });
}

export type LoudnessAdmissionV1 = Readonly<{ ok: true; measurement: LoudnessMeasurementV1 }> | Readonly<{ ok: false; reason: string; measurement: LoudnessMeasurementV1 }>;
/** The gate: a named refusal for silence, a non-finite sample, too loud, too quiet, or over the true-peak ceiling. */
export function admitLoudnessV1(samples: Float32Array, sampleRate: number, cls: LoudnessClass): LoudnessAdmissionV1 {
  for (let i = 0; i < samples.length; i++) if (!Number.isFinite(samples[i])) return Object.freeze({ ok: false, reason: 'non-finite-sample', measurement: measureLoudnessV1(new Float32Array(0), sampleRate) });
  const m = measureLoudnessV1(samples, sampleRate), t = LOUDNESS_TARGETS_V1[cls], value = t.measure === 'integrated' ? m.integratedLufs : m.shortTermMaxLufs;
  const refuse = (reason: string) => Object.freeze({ ok: false as const, reason, measurement: m });
  if (!Number.isFinite(value)) return refuse('silent');
  if (value > t.targetLufs + t.maxOverLu) return refuse(`too-loud:${value.toFixed(2)}>${t.targetLufs + t.maxOverLu}`);
  // the floor catches a broken (near-silent) render; a SHORT percussive cue (a land-thud) reads low over a 3 s window by nature, so cue
  // classes judge the floor on their loudest 400 ms block — the ceiling above stays the kit's short-term target
  const floorValue = t.measure === 'integrated' ? value : m.momentaryMaxLufs;
  if (floorValue < t.targetLufs - t.maxUnderLu) return refuse(`too-quiet:${floorValue.toFixed(2)}<${t.targetLufs - t.maxUnderLu}`);
  if (m.truePeakDb > t.maxTruePeakDb) return refuse(`true-peak:${m.truePeakDb.toFixed(2)}>${t.maxTruePeakDb}`);
  return Object.freeze({ ok: true as const, measurement: m });
}

/** The derivation's final stage: ATTENUATE (never boost) so the loudest short-term window sits at the class target and the true peak at
 * or under its ceiling. Returns the gain applied (≤ 1). */
export function limitToLoudnessV1(samples: Float32Array, sampleRate: number, cls: LoudnessClass): { readonly samples: Float32Array; readonly gainDb: number } {
  const t = LOUDNESS_TARGETS_V1[cls], m = measureLoudnessV1(samples, sampleRate), value = t.measure === 'integrated' ? m.integratedLufs : m.shortTermMaxLufs;
  let gainDb = 0;
  if (Number.isFinite(value) && value > t.targetLufs) gainDb = Math.min(gainDb, t.targetLufs - value);
  // 0.05 dB margin under the ceiling: the oversampled estimate is itself an approximation of the continuous signal
  if (Number.isFinite(m.truePeakDb) && m.truePeakDb + gainDb > t.maxTruePeakDb - 0.05) gainDb = Math.min(gainDb, t.maxTruePeakDb - 0.05 - m.truePeakDb);
  if (gainDb === 0) return { samples, gainDb: 0 };
  const g = Math.pow(10, gainDb / 20), out = new Float32Array(samples.length); for (let i = 0; i < samples.length; i++) out[i] = (samples[i] ?? 0) * g;
  return { samples: out, gainDb };
}
