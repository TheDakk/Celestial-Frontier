/* @module soundkit/organic [domain] — the ORIGINAL source generators (D15 Stages 1–3, Claude 2026-09-26). Every shipped creature voice,
   combat material, ambience bed and music piece is rendered by these pure functions from a fixed seed: no recording, no download, no
   third-party audio, no AI audio. The code is the master; `AUDIO_LICENSES.md` records "original, CC0 by the project" with the generator
   id, seed and output hash. The Sound Kit's frozen tone rules the design: creature voices are THROAT, BREATH AND BODY (a glottal
   source-filter model, stridulation, a syrinx, swim-bladder drumming, turbulent hiss), impacts are layered (transient + mass-scaled
   body + material tail), beds are wind/water/insects/weather that never loop audibly, and music is sparse, plucked, struck and breathed
   — never a synthesizer bleep. Deterministic: identical arguments give identical bytes (mulberry32 only; no clock, no Math.random). */
import { mulberry32 } from '@cf/domain-rand';
import { SAMPLE_RATE } from './dsp.js';

export const SR = SAMPLE_RATE;
export const len = (seconds: number, rate = SR): number => Math.max(1, Math.round(seconds * rate));
const TAU = Math.PI * 2;

/* ---------- noise ---------- */
export function white(n: number, seed: number): Float32Array { const r = mulberry32(seed >>> 0), y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = r() * 2 - 1; return y; }
/** Pink (Paul Kellet's economy filter): foliage, surf and rain beds. */
export function pink(n: number, seed: number): Float32Array {
  const r = mulberry32(seed >>> 0), y = new Float32Array(n); let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) { const w = r() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; y[i] = (b0 + b1 + b2 + w * 0.1848) * 0.25; }
  return y;
}
/** Brown (leaky integrated white): wind, rumble, surf body. */
export function brown(n: number, seed: number): Float32Array {
  const r = mulberry32(seed >>> 0), y = new Float32Array(n); let v = 0;
  for (let i = 0; i < n; i++) { v = 0.996 * v + (r() * 2 - 1) * 0.06; y[i] = v; }
  return normalize(y, 0.9);
}

/* ---------- shaping ---------- */
export function peak(x: Float32Array): number { let p = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]!); if (a > p) p = a; } return p; }
export function normalize(x: Float32Array, to: number): Float32Array { const p = peak(x); if (!(p > 0)) return x; const g = to / p; const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i]! * g; return y; }
export function gainOf(x: Float32Array, g: number): Float32Array { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i]! * g; return y; }
/** Piecewise-linear curve over normalised time 0..1 (points sorted by t), sampled at n points. */
export function curve(points: readonly (readonly [number, number])[], n: number): Float32Array {
  const y = new Float32Array(n); let k = 0;
  for (let i = 0; i < n; i++) { const t = n <= 1 ? 0 : i / (n - 1); while (k < points.length - 2 && t > points[k + 1]![0]) k++;
    const [t0, v0] = points[k]!, [t1, v1] = points[Math.min(k + 1, points.length - 1)]!; const u = t1 > t0 ? Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) : 0; y[i] = v0 + (v1 - v0) * (u * u * (3 - 2 * u)); }
  return y;
}
/** Attack / release shape (seconds) with a smooth (cosine) attack and an exponential-feeling release. */
export function shape(x: Float32Array, attackS: number, releaseS: number, rate = SR): Float32Array {
  const n = x.length, a = Math.max(1, Math.round(attackS * rate)), r = Math.max(1, Math.round(releaseS * rate)), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { let g = 1; if (i < a) g = 0.5 - 0.5 * Math.cos(Math.PI * i / a); const back = n - 1 - i; if (back < r) g *= Math.pow(back / r, 1.6); y[i] = x[i]! * g; }
  return y;
}
export function mulCurve(x: Float32Array, c: Float32Array): Float32Array { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i]! * (c[i] ?? 0); return y; }
export function mixInto(dst: Float32Array, src: Float32Array, gain = 1, offset = 0): Float32Array { for (let i = 0; i < src.length; i++) { const j = i + offset; if (j >= 0 && j < dst.length) dst[j] = dst[j]! + src[i]! * gain; } return dst; }
export function mix(n: number, layers: readonly (readonly [Float32Array, number, number?])[]): Float32Array { const y = new Float32Array(n); for (const [s, g, o] of layers) mixInto(y, s, g, o ?? 0); return y; }
/** Gentle saturation (tanh) that thickens a thin transient without a hard edge. */
export function saturate(x: Float32Array, drive: number): Float32Array { const y = new Float32Array(x.length), k = Math.tanh(drive); for (let i = 0; i < x.length; i++) y[i] = Math.tanh(x[i]! * drive) / k; return y; }

/* ---------- filters ---------- */
/** Two-pole resonator (constant skirt) at centre f with bandwidth bw (Hz); `fOf(i)` makes the centre time-varying (a gliding formant). */
export function resonate(x: Float32Array, f: number | ((i: number) => number), bw: number, rate = SR): Float32Array {
  const y = new Float32Array(x.length), r = Math.exp(-Math.PI * bw / rate), b2 = r * r; let y1 = 0, y2 = 0, b1 = 0, a0 = 0;
  const set = (hz: number) => { const c = Math.min(rate * 0.45, Math.max(20, hz)); b1 = 2 * r * Math.cos(TAU * c / rate); a0 = (1 - r) * Math.sqrt(Math.max(1e-9, 1 - 2 * r * Math.cos(2 * TAU * c / rate) + r * r)); };
  if (typeof f === 'number') set(f);
  for (let i = 0; i < x.length; i++) { if (typeof f !== 'number' && (i & 31) === 0) set(f(i)); const v = a0 * x[i]! + b1 * y1 - b2 * y2; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
export function lowpass(x: Float32Array, hz: number, rate = SR): Float32Array { const y = new Float32Array(x.length), a = 1 - Math.exp(-TAU * hz / rate); let v = 0; for (let i = 0; i < x.length; i++) { v += a * (x[i]! - v); y[i] = v; } return y; }
export function highpass(x: Float32Array, hz: number, rate = SR): Float32Array { const lp = lowpass(x, hz, rate), y = new Float32Array(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i]! - lp[i]!; return y; }
/** Time-varying one-pole lowpass (cutoff from `hzOf(i)`), for swells and wind gusts. */
export function sweepLowpass(x: Float32Array, hzOf: (i: number) => number, rate = SR): Float32Array { const y = new Float32Array(x.length); let v = 0, a = 0; for (let i = 0; i < x.length; i++) { if ((i & 31) === 0) a = 1 - Math.exp(-TAU * Math.max(10, hzOf(i)) / rate); v += a * (x[i]! - v); y[i] = v; } return y; }

/* ---------- the throat: a glottal source-filter voice ---------- */
export interface Formant { readonly f: number; readonly bw: number; readonly g: number }
export interface GlottalSpec {
  readonly seconds: number;
  /** f0 in Hz over normalised time. */
  readonly f0: readonly (readonly [number, number])[];
  readonly formants: readonly Formant[];
  /** Formant scale over normalised time (1 = as given); mouth opening/closing. */
  readonly tract?: readonly (readonly [number, number])[];
  readonly breath?: number;       // aspiration 0..1
  readonly jitter?: number;       // period jitter 0..0.1
  readonly shimmer?: number;      // amplitude shimmer 0..0.5
  readonly open?: number;         // open quotient 0.3..0.8 (lower = pressed/brighter)
  readonly sub?: number;          // period-doubling (growl) 0..1
  readonly rough?: number;        // slow amplitude roughness 0..1
  readonly attack?: number; readonly release?: number;
  readonly seed: number;
}
/** A Rosenberg glottal flow per period (jittered, shimmered, optionally period-doubled), its derivative for the voiced source, flow-
 *  modulated aspiration noise, then a parallel bank of formant resonators whose centres follow the tract curve, then lip radiation. */
export function glottal(s: GlottalSpec): Float32Array {
  const n = len(s.seconds), rng = mulberry32(s.seed >>> 0), f0 = curve(s.f0, n), tract = curve(s.tract ?? [[0, 1], [1, 1]], n);
  const open = s.open ?? 0.55, jit = s.jitter ?? 0.012, shim = s.shimmer ?? 0.08, sub = s.sub ?? 0, breath = s.breath ?? 0.25;
  const flow = new Float32Array(n); let phase = 0, period = 0, amp = 1, per = 1;
  for (let i = 0; i < n; i++) {
    phase += (f0[i]! * per) / SR;
    if (phase >= 1) { phase -= 1; period++; per = 1 + jit * (rng() * 2 - 1); amp = (1 - shim * rng()) * (sub > 0 && (period & 1) ? 1 - sub * 0.7 : 1); }
    const p = phase, rise = open * 0.62;
    const g = p < rise ? 0.5 - 0.5 * Math.cos(Math.PI * p / rise) : p < open ? Math.cos((Math.PI / 2) * (p - rise) / (open - rise)) : 0;
    flow[i] = g * amp;
  }
  const src = new Float32Array(n), noise = white(n, s.seed ^ 0x9e37), roughC = s.rough ? lowpass(white(n, s.seed ^ 0x51), 18) : null;
  let prev = 0; for (let i = 0; i < n; i++) { const d = flow[i]! - prev; prev = flow[i]!; const r = roughC ? 1 + s.rough! * 6 * roughC[i]! : 1;
    src[i] = (d * 18 * (1 - breath) + noise[i]! * breath * (0.25 + 0.75 * flow[i]!)) * r; }
  const out = new Float32Array(n);
  for (const fm of s.formants) { const band = resonate(src, (i) => fm.f * (tract[i] ?? 1), fm.bw); mixInto(out, band, fm.g); }
  let last = 0; for (let i = 0; i < n; i++) { const v = out[i]!; out[i] = v - 0.85 * last; last = v; }   // lip radiation (+6 dB/oct tilt)
  return normalize(shape(out, s.attack ?? 0.02, s.release ?? s.seconds * 0.35), 0.9);
}
/** Breath only (idle breathing, snorts, sighs): turbulent noise through the same tract, in inhale/exhale pulses at `rateHz`. */
export function breathing(seconds: number, rateHz: number, formants: readonly Formant[], seed: number): Float32Array {
  const n = len(seconds), base = pink(n, seed), env = new Float32Array(n);
  for (let i = 0; i < n; i++) { const c = (i / SR) * rateHz % 1; env[i] = Math.pow(Math.sin(Math.PI * Math.min(1, c * 1.6)), 2) * (c < 0.62 ? 1 : 0); }
  const shaped = mulCurve(base, env), out = new Float32Array(n);
  for (const fm of formants) mixInto(out, resonate(shaped, fm.f, fm.bw * 2.2), fm.g);
  return normalize(shape(mix(n, [[out, 1], [lowpass(shaped, 900), 0.4]]), 0.05, 0.2), 0.8);
}
/** A purr / rumble: noise amplitude-modulated at the purr rate (≈ 22–28 Hz) through the tract, alternating inhale/exhale strength. */
export function purr(seconds: number, rateHz: number, formants: readonly Formant[], seed: number): Float32Array {
  const n = len(seconds), base = brown(n, seed), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR, am = Math.pow(0.5 + 0.5 * Math.sin(TAU * rateHz * t), 3), breathCycle = 0.6 + 0.4 * Math.sin(TAU * 0.7 * t); y[i] = base[i]! * am * breathCycle; }
  const out = new Float32Array(n); for (const fm of formants) mixInto(out, resonate(y, fm.f * 0.6, fm.bw), fm.g);
  return normalize(shape(mix(n, [[out, 0.7], [lowpass(y, 400), 0.8]]), 0.12, 0.3), 0.85);
}

/* ---------- the body: resonant strikes, thuds, material tails ---------- */
export interface Mode { readonly ratio: number; readonly decay: number; readonly amp: number }
/** Modal synthesis: damped partials (ratio × f0, decay seconds) excited by a short noise strike — wood, bone, plate, crystal, mallet. */
export function modal(seconds: number, f0: number, modes: readonly Mode[], strike: number, seed: number, rate = SR): Float32Array {
  const n = len(seconds, rate), y = new Float32Array(n), r = mulberry32(seed >>> 0);
  for (const m of modes) { const f = f0 * m.ratio; if (f >= rate * 0.45) continue; const ph = r() * TAU, k = 1 / (m.decay * rate);
    for (let i = 0; i < n; i++) y[i] = y[i]! + Math.sin(TAU * f * i / rate + ph) * Math.exp(-i * k) * m.amp; }
  if (strike > 0) { const w = Math.min(n, Math.round(0.004 * rate)), click = white(w, seed ^ 0x33); for (let i = 0; i < w; i++) y[i] = y[i]! + click[i]! * strike * (1 - i / w); }
  return y;
}
/** A body thud: a sine whose pitch drops (the mass), a low noise knock, and the kit's "scaled by mass" through `mass` (0.3..2). */
export function thud(seconds: number, mass: number, seed: number): Float32Array {
  const n = len(seconds), y = new Float32Array(n), f0 = 95 / Math.sqrt(Math.max(0.2, mass)); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, f = f0 * (1 + 1.4 * Math.exp(-t * 38)); ph += TAU * f / SR; y[i] = Math.sin(ph) * Math.exp(-t * (7 / Math.sqrt(mass))); }
  const knock = lowpass(white(len(0.03), seed), 700);
  return normalize(saturate(mix(n, [[y, 1], [shape(knock, 0.0005, 0.025), 0.9]]), 1.6), 0.9);
}
/** Air moving past a body: band-passed noise whose centre glides fStart→fEnd (swish, whiff, wingbeat, approach). */
export function whoosh(seconds: number, fStart: number, fEnd: number, bw: number, seed: number): Float32Array {
  const n = len(seconds), src = white(n, seed), out = resonate(src, (i) => fStart * Math.pow(fEnd / fStart, i / n), bw), env = curve([[0, 0], [0.45, 1], [1, 0]], n);
  return normalize(mulCurve(mix(n, [[out, 1], [lowpass(src, fEnd * 0.6), 0.25]]), env), 0.85);
}

/* ---------- insects, crabs, spiders: stridulation and clicks ---------- */
export interface StridSpec { readonly seconds: number; readonly pulseRate: number; readonly pulseLen: number; readonly toothRate: number; readonly body: number; readonly q: number; readonly seed: number; readonly jitter?: number }
/** A file-and-scraper: pulses (chirps) of tooth impacts, each tooth a tiny impulse, ringing the chitin body resonance. */
export function stridulate(s: StridSpec): Float32Array {
  const n = len(s.seconds), imp = new Float32Array(n), r = mulberry32(s.seed >>> 0), jit = s.jitter ?? 0.15;
  for (let t = 0; t < s.seconds; t += (1 / s.pulseRate) * (1 + jit * (r() * 2 - 1))) {
    const start = Math.round(t * SR), pl = s.pulseLen * (0.8 + 0.4 * r());
    for (let k = 0; k < pl * s.toothRate; k++) { const j = start + Math.round((k / s.toothRate) * SR); if (j < n) imp[j] = imp[j]! + (0.6 + 0.4 * r()) * Math.sin(Math.PI * k / Math.max(1, pl * s.toothRate)); }
  }
  const body = resonate(imp, s.body, s.body / s.q), shell = resonate(imp, s.body * 1.9, s.body / s.q * 1.5);
  return normalize(shape(mix(n, [[body, 1], [shell, 0.45], [highpass(imp, 2000), 0.15]]), 0.003, 0.05), 0.85);
}
/** Sparse dry clicks (claw taps, mandible snaps, pincer clacks): each a short high-damped modal knock. */
export function clicks(seconds: number, count: number, hz: number, seed: number): Float32Array {
  const n = len(seconds), y = new Float32Array(n), r = mulberry32(seed >>> 0);
  for (let c = 0; c < count; c++) { const at = Math.floor(r() * Math.max(1, n - len(0.03))), k = modal(0.03, hz * (0.85 + 0.3 * r()), [{ ratio: 1, decay: 0.006, amp: 1 }, { ratio: 2.3, decay: 0.004, amp: 0.5 }], 0.8, (seed + c * 97) >>> 0); mixInto(y, k, 0.6 + 0.4 * r(), at); }
  return normalize(y, 0.85);
}

/* ---------- water: bubbles and swim-bladder drumming ---------- */
/** Minnaert bubbles: each a damped sine at f = 3.26 m·Hz / radius, rising slightly as it pinches off. */
export function bubbles(seconds: number, perSecond: number, rMinMm: number, rMaxMm: number, seed: number, rate = SR): Float32Array {
  const n = len(seconds, rate), y = new Float32Array(n), r = mulberry32(seed >>> 0), count = Math.max(1, Math.round(seconds * perSecond));
  for (let b = 0; b < count; b++) { const rad = (rMinMm + (rMaxMm - rMinMm) * r() * r()) / 1000, f = 3.26 / rad, d = 0.043 * f + 0.0014 * Math.pow(f, 1.5), at = Math.floor(r() * n), w = Math.min(n - at, Math.round((5 / d) * rate)), a = 0.4 + 0.6 * r();
    for (let k = 0; k < w; k++) { const t = k / rate; y[at + k] = y[at + k]! + Math.sin(TAU * f * t * (1 + 0.1 * d * t)) * Math.exp(-d * t) * a; } }
  return y;
}
/** Swim-bladder drumming (fish grunts, croakers): a train of low damped knocks at the sonic-muscle rate through a soft resonance. */
export function drumming(seconds: number, knockHz: number, bodyHz: number, seed: number): Float32Array {
  const n = len(seconds), imp = new Float32Array(n), r = mulberry32(seed >>> 0), env = curve([[0, 0], [0.15, 1], [0.8, 0.8], [1, 0]], n);
  for (let t = 0; t < seconds; t += (1 / knockHz) * (0.9 + 0.2 * r())) { const j = Math.round(t * SR); if (j < n) imp[j] = 1; }
  return normalize(mulCurve(mix(n, [[resonate(imp, bodyHz, bodyHz * 0.5), 1], [resonate(imp, bodyHz * 2.6, bodyHz), 0.3]]), env), 0.85);
}

/* ---------- birds: the syrinx ---------- */
export interface SyrinxSpec { readonly seconds: number; readonly f: readonly (readonly [number, number])[]; readonly trillHz?: number; readonly trillDepth?: number; readonly harmonics?: readonly number[]; readonly breath?: number; readonly syllables?: number; readonly seed: number }
/** Two coupled membranes read as a tonal source with a trill (frequency modulation), a few harmonics for body, breath noise, and
 *  syllable gating — a whistle made of air, not an oscillator bleep (the harmonic weights fall and the pitch never sits still). */
export function syrinx(s: SyrinxSpec): Float32Array {
  const n = len(s.seconds), fc = curve(s.f, n), r = mulberry32(s.seed >>> 0), hs = s.harmonics ?? [1, 0.35, 0.12], y = new Float32Array(n);
  let ph = 0; const drift = lowpass(white(n, s.seed ^ 0x77), 6);
  for (let i = 0; i < n; i++) { const t = i / SR, f = fc[i]! * (1 + (s.trillDepth ?? 0) * Math.sin(TAU * (s.trillHz ?? 0) * t) + 0.02 * drift[i]! * 8); ph += TAU * f / SR;
    let v = 0; for (let h = 0; h < hs.length; h++) v += Math.sin(ph * (h + 1)) * hs[h]!; y[i] = v; }
  const syl = Math.max(1, s.syllables ?? 1), gate = new Float32Array(n);
  for (let i = 0; i < n; i++) { const u = (i / n) * syl, frac = u % 1, gap = 0.18 + 0.1 * r() * 0; gate[i] = frac < 1 - gap ? Math.sin(Math.PI * frac / (1 - gap)) : 0; }
  const air = resonate(white(n, s.seed ^ 0x19), (i) => fc[i]!, 400);
  return normalize(shape(mulCurve(mix(n, [[y, 1], [air, s.breath ?? 0.2]]), gate), 0.006, 0.05), 0.85);
}

/* ---------- hiss (serpents, venom, steam) ---------- */
export function hiss(seconds: number, centre: number, bw: number, seed: number, env?: readonly (readonly [number, number])[]): Float32Array {
  const n = len(seconds), src = white(n, seed), band = resonate(src, centre, bw), air = highpass(src, centre * 0.8);
  return normalize(mulCurve(mix(n, [[band, 1], [air, 0.35]]), curve(env ?? [[0, 0], [0.12, 1], [0.75, 0.8], [1, 0]], n)), 0.85);
}

/* ---------- strings, bars and breath for music ---------- */
/** Karplus-Strong plucked string with a two-point damping average and a brightness-controlled excitation. */
export function pluck(seconds: number, hz: number, decay: number, brightness: number, seed: number, rate = SR): Float32Array {
  const n = len(seconds, rate), period = rate / hz, L = Math.max(2, Math.floor(period)), frac = period - L, buf = new Float32Array(L + 2), exc = white(L + 2, seed);
  let lp = 0; const a = Math.max(0.05, Math.min(1, brightness)); for (let i = 0; i < buf.length; i++) { lp += a * (exc[i]! - lp); buf[i] = lp; }
  const y = new Float32Array(n), fb = Math.pow(0.001, 1 / (decay * hz)); let idx = 0, prev = 0;
  for (let i = 0; i < n; i++) { const j = idx % (L + 1), k = (idx + 1) % (L + 1), v = buf[j]! * (1 - frac) + buf[k]! * frac, out = 0.5 * (v + prev) * fb; prev = v; buf[j] = out; y[i] = v; idx++; }
  return shape(y, 0.002, Math.min(seconds * 0.5, 0.3), rate);
}
/** A soft wooden mallet on a tuned bar (marimba-like modes 1 : 3.93 : 9.54). */
export function mallet(seconds: number, hz: number, seed: number, rate = SR): Float32Array {
  return modal(seconds, hz, [{ ratio: 1, decay: 0.55, amp: 1 }, { ratio: 3.93, decay: 0.12, amp: 0.3 }, { ratio: 9.54, decay: 0.04, amp: 0.1 }], 0.15, seed, rate);
}
/** A breathed tone (wooden flute / ocarina): a sine with slow vibrato plus band-passed breath noise, swelling in and out. */
export function breathTone(seconds: number, hz: number, seed: number, rate = SR): Float32Array {
  const n = len(seconds, rate), y = new Float32Array(n), air = resonate(white(n, seed, ), hz, hz * 0.08, rate); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / rate, vib = 1 + 0.006 * Math.sin(TAU * 5.2 * t) * Math.min(1, t * 2); ph += TAU * hz * vib / rate; y[i] = Math.sin(ph) + 0.18 * Math.sin(2 * ph); }
  return shape(mix(n, [[y, 0.8], [normalize(air, 0.9), 0.25]]), Math.min(0.25, seconds * 0.3), Math.min(0.5, seconds * 0.4), rate);
}
/** A bowed drone: several detuned plucks re-excited continuously by filtered noise (a string held by a bow), swelling slowly. */
export function bowed(seconds: number, hz: number, seed: number, rate = SR): Float32Array {
  const n = len(seconds, rate), src = lowpass(white(n, seed), hz * 3, rate), y = new Float32Array(n);
  for (const [det, g] of [[1, 1], [1.004, 0.6], [0.997, 0.6], [2.001, 0.25]] as const) mixInto(y, resonate(src, hz * det, hz * 0.004 + 1, rate), g);
  return shape(normalize(y, 0.9), Math.min(1.2, seconds * 0.3), Math.min(1.5, seconds * 0.4), rate);
}
/** A frame drum / low membrane: a pitch-dropping body, a skin-slap noise, and a wooden rim when `rim` > 0. */
export function drum(seconds: number, hz: number, seed: number, rim = 0, rate = SR): Float32Array {
  const n = len(seconds, rate), y = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / rate, f = hz * (1 + 0.6 * Math.exp(-t * 30)); ph += TAU * f / rate; y[i] = Math.sin(ph) * Math.exp(-t * 6); }
  const slap = shape(lowpass(white(len(0.05, rate), seed), 2200, rate), 0.0005, 0.04, rate);
  const out = mix(n, [[y, 1], [slap, 0.5]]);
  if (rim > 0) mixInto(out, modal(0.12, 820, [{ ratio: 1, decay: 0.03, amp: 1 }, { ratio: 2.6, decay: 0.02, amp: 0.4 }], 0.4, seed ^ 0x5, rate), rim);
  return out;
}

/* ---------- loops ---------- */
/** A seamless loop: the last `fadeS` seconds cross-fade (equal power) into the head, and the result is that much shorter. The loop point
 *  is inaudible by construction (the seam IS a crossfade of two parts of the same texture). */
export function seamlessLoop(x: Float32Array, fadeS: number, rate = SR): Float32Array {
  const f = Math.min(Math.floor(x.length / 3), Math.round(fadeS * rate)), m = x.length - f, y = new Float32Array(m);
  for (let i = 0; i < m; i++) y[i] = x[i]!;
  for (let i = 0; i < f; i++) { const u = i / f; y[i] = x[i]! * Math.sin((Math.PI / 2) * u) + x[m + i]! * Math.cos((Math.PI / 2) * u); }
  return y;
}
