/* Pure deterministic DSP over Float32Array at 48 kHz. No clock, no
   Math.random; every loop runs in fixed order so identical inputs give
   identical bytes on every engine. The pitch shifter is resampling plus a
   granular OLA stretch that restores the original length; the formant shifter
   is an APPROXIMATION (a peaking biquad bank that lifts the scaled nominal
   formant centres and cuts the unscaled ones, i.e. a spectral-envelope tilt,
   not a true LPC envelope warp). Micro-variation is a seeded slow pitch drift. */
import { mulberry32 } from '@cf/domain-rand';

export const SAMPLE_RATE = 48_000;
const GRAIN = 2048;
const HOP = 512;

export function semitonesToRatio(semitones: number): number { return Math.pow(2, semitones / 12); }

/** Linear-interpolating resampler; ratio > 1 shortens and raises pitch. */
export function resample(x: Float32Array, ratio: number): Float32Array {
  const n = Math.max(1, Math.floor(x.length / ratio));
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * ratio;
    const k = Math.floor(p);
    const f = p - k;
    const a = x[k] ?? 0;
    const b = x[k + 1] ?? a;
    y[i] = a + (b - a) * f;
  }
  return y;
}

/** Hann window of GRAIN samples, computed once in fixed order. */
const HANN = ((): Float32Array => {
  const w = new Float32Array(GRAIN);
  for (let i = 0; i < GRAIN; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / GRAIN);
  return w;
})();

/** Granular OLA time stretch. factor 1.25 makes the output 25 percent longer.
 * Grain read offsets carry a seeded jitter (up to 48 samples) so two seeds
 * never share a grain lattice; output length is exactly round(len * factor). */
export function timeStretch(x: Float32Array, factor: number, seed: number): Float32Array {
  const outLen = Math.max(1, Math.round(x.length * factor));
  if (x.length < GRAIN || Math.abs(factor - 1) < 1e-9) return fitLength(x, outLen);
  const rng = mulberry32(seed >>> 0);
  const y = new Float32Array(outLen);
  const norm = new Float32Array(outLen);
  const grains = Math.ceil(outLen / HOP) + 1;
  for (let gi = 0; gi < grains; gi++) {
    const outPos = gi * HOP;
    const jitter = Math.floor(rng() * 97) - 48;
    let inPos = Math.round(outPos / factor) + jitter;
    if (inPos < 0) inPos = 0;
    if (inPos > x.length - GRAIN) inPos = x.length - GRAIN;
    for (let i = 0; i < GRAIN; i++) {
      const o = outPos + i;
      if (o >= outLen) break;
      const w = HANN[i] ?? 0;
      y[o] = (y[o] ?? 0) + (x[inPos + i] ?? 0) * w;
      norm[o] = (norm[o] ?? 0) + w;
    }
  }
  for (let i = 0; i < outLen; i++) { const n = norm[i] ?? 0; if (n > 1e-6) y[i] = (y[i] ?? 0) / n; }
  return y;
}

/** Pitch shift by semitones with the length preserved to the sample. */
export function pitchShift(x: Float32Array, semitones: number, seed: number): Float32Array {
  if (Math.abs(semitones) < 1e-9) return x.slice();
  const ratio = semitonesToRatio(semitones);
  const shifted = resample(x, ratio);
  return fitLength(timeStretch(shifted, x.length / shifted.length, seed), x.length);
}

export function fitLength(x: Float32Array, length: number): Float32Array {
  if (x.length === length) return x.slice();
  const y = new Float32Array(length);
  y.set(x.subarray(0, Math.min(length, x.length)));
  return y;
}

export type BiquadKind = 'lowpass' | 'highpass' | 'bandpass' | 'peaking' | 'lowshelf' | 'highshelf';
export interface BiquadSpec { readonly kind: BiquadKind; readonly f0: number; readonly q: number; readonly gainDb?: number }

/** RBJ cookbook biquad, direct form I, coefficients in fixed order. */
export function biquad(x: Float32Array, spec: BiquadSpec): Float32Array {
  const w0 = (2 * Math.PI * Math.min(spec.f0, SAMPLE_RATE * 0.45)) / SAMPLE_RATE;
  const cw = Math.cos(w0);
  const sw = Math.sin(w0);
  const A = Math.pow(10, (spec.gainDb ?? 0) / 40);
  const alpha = sw / (2 * spec.q);
  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;
  switch (spec.kind) {
    case 'lowpass': b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
    case 'highpass': b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
    case 'bandpass': b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
    case 'peaking': b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A; break;
    case 'lowshelf': {
      const s = 2 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1) - (A - 1) * cw + s); b1 = 2 * A * ((A - 1) - (A + 1) * cw); b2 = A * ((A + 1) - (A - 1) * cw - s);
      a0 = (A + 1) + (A - 1) * cw + s; a1 = -2 * ((A - 1) + (A + 1) * cw); a2 = (A + 1) + (A - 1) * cw - s; break;
    }
    case 'highshelf': {
      const s = 2 * Math.sqrt(A) * alpha;
      b0 = A * ((A + 1) + (A - 1) * cw + s); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - s);
      a0 = (A + 1) - (A - 1) * cw + s; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - s; break;
    }
  }
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i] ?? 0;
    const yi = (b0 / a0) * xi + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
    x2 = x1; x1 = xi; y2 = y1; y1 = yi;
    y[i] = yi;
  }
  return y;
}

/** First-order filter; kind 'lowpass' or 'highpass' at the given cutoff. */
export function onePole(x: Float32Array, cutoffHz: number, kind: 'lowpass' | 'highpass'): Float32Array {
  const a = Math.exp((-2 * Math.PI * cutoffHz) / SAMPLE_RATE);
  const y = new Float32Array(x.length);
  let lp = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i] ?? 0;
    lp = (1 - a) * xi + a * lp;
    y[i] = kind === 'lowpass' ? lp : xi - lp;
  }
  return y;
}

/** Formant shift approximation: nominal centres 500/1500/2500 Hz scaled by
 * (1 + percent/100) are lifted and the unscaled centres cut, Q 2.2, 5 dB. */
export function formantShift(x: Float32Array, percent: number): Float32Array {
  if (Math.abs(percent) < 1e-9) return x.slice();
  const scale = 1 + percent / 100;
  let y = x;
  for (const f of [500, 1500, 2500]) {
    y = biquad(y, { kind: 'peaking', f0: f * scale, q: 2.2, gainDb: 5 });
    y = biquad(y, { kind: 'peaking', f0: f, q: 2.2, gainDb: -3.5 });
  }
  return y;
}

export interface Layer { readonly samples: Float32Array; readonly gain: number; readonly offset?: number }
/** Sum layers into a buffer of the given length, in list order. */
export function mixLayers(layers: readonly Layer[], length: number): Float32Array {
  const y = new Float32Array(length);
  for (const layer of layers) {
    const off = layer.offset ?? 0;
    for (let i = 0; i < layer.samples.length; i++) {
      const o = i + off;
      if (o < 0 || o >= length) continue;
      y[o] = (y[o] ?? 0) + (layer.samples[i] ?? 0) * layer.gain;
    }
  }
  return y;
}

/** Linear attack / exponential release envelope, in seconds. */
export function envelope(x: Float32Array, attackS: number, releaseS: number): Float32Array {
  const y = new Float32Array(x.length);
  const atk = Math.max(1, Math.round(attackS * SAMPLE_RATE));
  const rel = Math.max(1, Math.round(releaseS * SAMPLE_RATE));
  const relStart = Math.max(0, x.length - rel);
  for (let i = 0; i < x.length; i++) {
    let g = i < atk ? i / atk : 1;
    if (i >= relStart) g *= Math.exp((-5 * (i - relStart)) / rel);
    y[i] = (x[i] ?? 0) * g;
  }
  return y;
}

export function scale(x: Float32Array, gain: number): Float32Array {
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = (x[i] ?? 0) * gain;
  return y;
}

export function peakOf(x: Float32Array): number {
  let p = 0;
  for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i] ?? 0); if (v > p) p = v; }
  return p;
}

export function normalizePeak(x: Float32Array, peak: number): Float32Array {
  const p = peakOf(x);
  return p < 1e-9 ? x.slice() : scale(x, peak / p);
}

/** Seeded micro-variation: a fixed per-seed detune (up to 15 cents) plus a
 * slow sinusoidal drift (up to 8 cents, 0.4..1.4 Hz) applied as a variable-rate
 * read; length is preserved. Grain lattices elsewhere take the same seed. */
export function microVariation(x: Float32Array, seed: number): Float32Array {
  const rng = mulberry32(seed >>> 0);
  const detune = (rng() * 2 - 1) * 15;
  const depth = rng() * 8;
  const rate = 0.4 + rng();
  const phase = rng() * 2 * Math.PI;
  const y = new Float32Array(x.length);
  let pos = 0;
  for (let i = 0; i < x.length; i++) {
    const k = Math.floor(pos);
    const f = pos - k;
    const a = x[k] ?? 0;
    const b = x[k + 1] ?? a;
    y[i] = a + (b - a) * f;
    const cents = detune + depth * Math.sin(phase + (2 * Math.PI * rate * i) / SAMPLE_RATE);
    pos += Math.pow(2, cents / 1200);
  }
  return y;
}

/** Deterministic tone helper for luminous hums (a derived tonal layer, not a source). */
export function sine(frequencyHz: number, length: number, gain: number): Float32Array {
  const y = new Float32Array(length);
  for (let i = 0; i < length; i++) y[i] = Math.sin((2 * Math.PI * frequencyHz * i) / SAMPLE_RATE) * gain;
  return y;
}
