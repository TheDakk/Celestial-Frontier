/* @module soundkit/ambience [domain] — the living bed (D15 Stage 3, Claude 2026-09-26). Ten biome-family beds and four weather layers,
   ORIGINAL (rendered by `organic.ts` from a seed), and the derivation of all 43 biomes onto them: each biome's canonical base (and detail)
   from `PRODUCTION_BIOME_BEDS`, a seeded tint (tone and level) from the biome, a night darkening, and its weather layer from the biome
   profile's weather. Kit §2: "wind, water, insects, distant calls, weather, all seeded and never looping audibly": a bed is a seamless
   crossfade loop of 24 s and the weather loop is 17 s, so the pair repeats only every 408 s. Airless worlds are silence.
   Rendered at 32 kHz (the decoded budget), levelled to the ambience target (−22 LUFS integrated, ≤ −1 dBTP). */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { BIOME_PROFILES_V1, type BiomeProfileKeyV1 } from '@cf/domain-biome-profile';
import { PRODUCTION_BIOME_BEDS } from '../audio-production-plan.js';
import { applyLevelV1, levelGainV1 } from './leveler.js';
import { LEVEL_GAINS_V1 } from './level-gains.generated.js';
import {
  brown, bubbles, clicks, curve, highpass, len, lowpass, mixInto, modal, mulCurve, normalize, pink, resonate, seamlessLoop, stridulate,
  sweepLowpass, syrinx, white,
} from './organic.js';

export const AMBIENCE_RATE = 32_000;
export const BED_SECONDS = 24, WEATHER_SECONDS = 17, LOOP_FADE_SECONDS = 2;
export const AMBIENCE_FAMILIES_V1 = Object.freeze(['temperate', 'jungle', 'coast', 'underwater', 'desert', 'ice', 'volcanic', 'crystal', 'spore', 'gas'] as const);
export type AmbienceFamilyV1 = typeof AMBIENCE_FAMILIES_V1[number];
export const WEATHER_LAYERS_V1 = Object.freeze(['rain', 'wind', 'storm', 'snow-sand'] as const);
export type WeatherLayerV1 = typeof WEATHER_LAYERS_V1[number];

/** The production plan's bed bases (32) folded into the ten families; `silence` = airless. */
export const BASE_FAMILY_V1: Readonly<Record<string, AmbienceFamilyV1 | 'silence'>> = Object.freeze({
  foliage: 'temperate', grass: 'temperate', canyon: 'temperate', rock: 'temperate', fault: 'temperate', cave: 'temperate', carbon: 'temperate',
  canopy: 'jungle', wetland: 'jungle', estuary: 'jungle',
  coast: 'coast', reef: 'coast', bioluminescent: 'coast',
  underwater: 'underwater', pressure: 'underwater',
  salt: 'desert', dunes: 'desert', dust: 'desert',
  tundra: 'ice', glacier: 'ice', packice: 'ice', 'ice-jet': 'ice', blueice: 'ice',
  thermal: 'volcanic', ash: 'volcanic', embers: 'volcanic', magma: 'volcanic', sulfur: 'volcanic', acid: 'volcanic',
  crystal: 'crystal', glass: 'crystal',
  spore: 'spore',
  wind: 'gas', 'ice-cloud': 'gas',
  silence: 'silence',
});

export interface AmbiencePlanV1 {
  readonly biome: BiomeProfileKeyV1;
  readonly family: AmbienceFamilyV1 | 'silence';
  readonly detail: AmbienceFamilyV1 | null;
  readonly weather: WeatherLayerV1 | null;
  /** Seeded tint: the bed's tone (lowpass scale) and level offset (±0.5 dB, inside the ±2 LU window). */
  readonly tint: Readonly<{ tone: number; gainDb: number }>;
  /** Time of day as a PLAYBACK gain (night −1.2 dB, twilight −0.6 dB): the rendered bed is the same buffer. */
  readonly timeOfDayDb: number;
  readonly seed: number;
}
const weatherOf = (w: string): WeatherLayerV1 | null =>
  /squall|cyclone|storm/u.test(w) ? 'storm' : /humid|mist|swell|rain/u.test(w) ? 'rain' : /cold|still-cold|steam-cold/u.test(w) ? 'snow-sand'
    : /dry|mirage|ash|ember|sand|dust/u.test(w) ? 'snow-sand' : /wind|band|trade/u.test(w) ? 'wind' : null;
const biomeSeed = (biome: string): number => { let h = 0x2f1c; for (const c of biome) h = hashInt(h, c.charCodeAt(0), 0x77) >>> 0; return h >>> 0; };
/** The 43-biome derivation (pure). */
export function ambiencePlanV1(biome: BiomeProfileKeyV1, timeOfDay: 'day' | 'twilight' | 'night' = 'day'): AmbiencePlanV1 {
  const profile = BIOME_PROFILES_V1[biome]; if (!profile) throw new RangeError(`no biome profile ${String(biome)}`);
  const [base, detailBase] = PRODUCTION_BIOME_BEDS[biome], family = BASE_FAMILY_V1[base] ?? 'temperate', seed = biomeSeed(biome), r = mulberry32(seed);
  const detailFamily = detailBase ? BASE_FAMILY_V1[detailBase] : undefined, detail = detailFamily && detailFamily !== 'silence' && detailFamily !== family ? detailFamily : null;
  const airless = profile.weather === 'airless' || family === 'silence';
  return Object.freeze({ biome, family: airless ? 'silence' : family, detail: airless ? null : detail, weather: airless || family === 'underwater' ? null : weatherOf(profile.weather),
    tint: Object.freeze({ tone: 0.85 + 0.3 * r(), gainDb: -0.5 + r() }), timeOfDayDb: timeOfDay === 'night' ? -1.2 : timeOfDay === 'twilight' ? -0.6 : 0, seed });
}

/* ---------- layers ---------- */
const R = AMBIENCE_RATE;
const at = (n: number, r: () => number): number => Math.floor(r() * n);
/** Wind: brown noise through a gust-swept lowpass (gusts every 4–9 s). */
function wind(seconds: number, cutoff: number, seed: number): Float32Array {
  const n = len(seconds, R), r = mulberry32(seed), pts: [number, number][] = []; for (let t = 0; t <= 1; t += 0.06 + 0.1 * r()) pts.push([t, 0.35 + 0.65 * r()]); pts.push([1, pts[0]![1]]);
  const gust = curve(pts, n); return normalize(mulCurve(sweepLowpass(brown(n, seed), (i) => cutoff * (0.5 + gust[i]!), R), gust), 0.9);
}
/** Sparse events placed at seeded times (birds, drips, chimes, creaks). */
function events(seconds: number, count: number, make: (k: number) => Float32Array, seed: number, gain = 1): Float32Array {
  const n = len(seconds, R), y = new Float32Array(n), r = mulberry32(seed); for (let k = 0; k < count; k++) { const e = make(k); mixInto(y, e, gain * (0.5 + 0.5 * r()), at(Math.max(1, n - e.length), r)); } return y;
}
const birdPhrase = (seed: number): Float32Array => { const r = mulberry32(seed), f = 1800 + 1400 * r(); return syrinx({ seconds: 0.4 + 0.5 * r(), f: [[0, f], [0.5, f * (0.8 + 0.4 * r())], [1, f * 0.85]], trillHz: 20 + 20 * r(), trillDepth: 0.04, syllables: 2 + Math.floor(3 * r()), breath: 0.2, seed }); };
const downRate = (x: Float32Array): Float32Array => { const ratio = 48_000 / R, n = Math.floor(x.length / ratio), y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = x[Math.floor(i * ratio)]!; return y; };

function* familyLayerJob(family: AmbienceFamilyV1, seconds: number, seed: number): Generator<void, Float32Array> {
  const n = len(seconds, R), y = new Float32Array(n);
  switch (family) {
    case 'temperate':
      mixInto(y, wind(seconds, 520, seed), 0.7); yield;
      mixInto(y, mulCurve(highpass(pink(n, seed ^ 1), 1500, R), curve([[0, 0.3], [0.3, 0.8], [0.6, 0.4], [1, 0.3]], n)), 0.25); yield;
      mixInto(y, events(seconds, 6, (k) => downRate(birdPhrase(seed + 10 + k)), seed ^ 2, 0.35), 1); yield; break;
    case 'jungle':
      mixInto(y, lowpass(pink(n, seed), 1800, R), 0.45); yield;
      mixInto(y, downRate(stridulate({ seconds, pulseRate: 7, pulseLen: 0.05, toothRate: 520, body: 4600, q: 14, seed: seed ^ 3 })), 0.22); yield;
      mixInto(y, downRate(stridulate({ seconds, pulseRate: 2.2, pulseLen: 0.2, toothRate: 60, body: 900, q: 3, seed: seed ^ 4 })), 0.18); yield;
      mixInto(y, events(seconds, 10, (k) => downRate(bubbles(0.3, 3, 2, 5, seed + 30 + k)), seed ^ 5, 0.4), 1); yield;
      mixInto(y, events(seconds, 4, (k) => downRate(birdPhrase(seed + 40 + k)), seed ^ 6, 0.3), 1); yield; break;
    case 'coast': {
      const swell = curve(Array.from({ length: 9 }, (_, k) => [k / 8, k % 2 ? 1 : 0.25] as [number, number]), n);
      mixInto(y, mulCurve(sweepLowpass(pink(n, seed), (i) => 300 + 2200 * swell[i]!, R), swell), 0.8); yield;
      mixInto(y, mulCurve(highpass(white(n, seed ^ 7), 3000, R), swell), 0.08); yield;
      mixInto(y, events(seconds, 3, (k) => downRate(birdPhrase(seed + 50 + k)), seed ^ 8, 0.2), 1); yield; break; }
    case 'underwater':
      mixInto(y, lowpass(brown(n, seed), 160, R), 0.9); yield;
      mixInto(y, downRate(bubbles(seconds, 1.5, 2, 9, seed ^ 9)), 0.35); yield;
      mixInto(y, mulCurve(lowpass(pink(n, seed ^ 10), 500, R), curve([[0, 0.2], [0.25, 0.8], [0.5, 0.2], [0.75, 0.8], [1, 0.2]], n)), 0.3); yield; break;
    case 'desert':
      mixInto(y, mulCurve(resonate(white(n, seed), 1300, 1100, R), curve([[0, 0.3], [0.2, 0.9], [0.45, 0.4], [0.7, 1], [1, 0.3]], n)), 0.5); yield;
      mixInto(y, downRate(clicks(seconds, Math.round(seconds * 18), 5200, seed ^ 11)), 0.08); yield;
      mixInto(y, wind(seconds, 380, seed ^ 12), 0.35); yield; break;
    case 'ice': {
      const glide = curve([[0, 1], [0.3, 1.25], [0.6, 0.9], [1, 1]], n);
      mixInto(y, resonate(white(n, seed), (i) => 1150 * glide[i]!, 40, R), 0.35); yield;
      mixInto(y, wind(seconds, 700, seed ^ 13), 0.45); yield;
      mixInto(y, events(seconds, 3, (k) => modal(1.4, 70 + 30 * k, [{ ratio: 1, decay: 0.5, amp: 1 }, { ratio: 2.3, decay: 0.3, amp: 0.4 }], 0.2, seed + 60 + k, R), seed ^ 14, 0.3), 1); yield; break; }
    case 'volcanic':
      mixInto(y, lowpass(brown(n, seed), 110, R), 0.9); yield;
      mixInto(y, downRate(bubbles(seconds, 3, 6, 14, seed ^ 15)), 0.35); yield;
      mixInto(y, downRate(clicks(seconds, Math.round(seconds * 6), 2400, seed ^ 16)), 0.12); yield; break;
    case 'crystal':
      mixInto(y, wind(seconds, 900, seed), 0.4); yield;
      mixInto(y, events(seconds, 9, (k) => modal(2.2, 1400 + 380 * (k % 5), [{ ratio: 1, decay: 0.8, amp: 1 }, { ratio: 2.32, decay: 0.6, amp: 0.6 }, { ratio: 4.25, decay: 0.3, amp: 0.3 }], 0.05, seed + 70 + k, R), seed ^ 17, 0.18), 1); yield; break;
    case 'spore':
      mixInto(y, highpass(pink(n, seed), 2500, R), 0.15); yield;
      mixInto(y, downRate(bubbles(seconds, 4, 3, 7, seed ^ 18)), 0.4); yield;
      mixInto(y, lowpass(brown(n, seed ^ 19), 220, R), 0.5); yield; break;
    case 'gas': {
      const glide = curve([[0, 1], [0.5, 1.3], [1, 1]], n);
      mixInto(y, resonate(brown(n, seed), 210, 180, R), 0.9); yield;
      mixInto(y, resonate(white(n, seed ^ 20), (i) => 420 * glide[i]!, 25, R), 0.15); yield;
      mixInto(y, resonate(white(n, seed ^ 21), (i) => 840 * glide[i]!, 35, R), 0.08); yield; break; }
  }
  return y;
}
function* weatherLayerJob(w: WeatherLayerV1, seconds: number, seed: number): Generator<void, Float32Array> {
  const n = len(seconds, R), y = new Float32Array(n);
  switch (w) {
    case 'rain': mixInto(y, downRate(bubbles(seconds, 260, 0.3, 1.2, seed)), 0.35); yield; mixInto(y, lowpass(pink(n, seed ^ 1), 2600, R), 0.6); break;
    case 'wind': mixInto(y, wind(seconds, 900, seed), 0.9); break;
    case 'storm': mixInto(y, downRate(bubbles(seconds, 420, 0.3, 1.4, seed)), 0.35); yield; mixInto(y, lowpass(pink(n, seed ^ 2), 3200, R), 0.7); yield;
      mixInto(y, events(seconds, 2, () => mulCurve(lowpass(brown(len(3, R), seed ^ 3), 90, R), curve([[0, 0], [0.05, 1], [1, 0]], len(3, R))), seed ^ 4, 1.2), 1); break;
    case 'snow-sand': mixInto(y, mulCurve(highpass(white(n, seed), 4000, R), curve([[0, 0.4], [0.3, 1], [0.6, 0.5], [1, 0.4]], n)), 0.5); yield; mixInto(y, wind(seconds, 500, seed ^ 5), 0.3); break;
  }
  yield;
  return y;
}

export interface StereoBufferV1 { readonly sampleRate: number; readonly left: Float32Array; readonly right: Float32Array; readonly seconds: number }
/** One render, made a seamless loop; the right channel is the same loop ROTATED by ~37 % (decorrelated, still seamless, half the cost).
 *  One integrated measurement sets the gain (with the plan's tint, ±1 dB), a look-ahead peak limiter holds −1.6 dBFS, and the Stage 0
 *  attenuate-only stage is the final guarantee — the same gain on both channels (a rotation has the same loudness and peaks). */
/** The raw (un-levelled) seamless loop: what the stored level gain was measured on. */
function* rawLoopJob(mono: Float32Array): Generator<void, Float32Array> { const loop = seamlessLoop(mono, LOOP_FADE_SECONDS, R); yield; return loop; }
/** Stored gain (generated, drift-tested) or — for content the table does not know — the real meter, flagged. */
export function ambienceGainV1(key: string, raw: Float32Array, offsetDb: number): { readonly gainDb: number; readonly measured: boolean } {
  const stored = LEVEL_GAINS_V1[key]; return stored !== undefined ? { gainDb: stored, measured: false } : { gainDb: levelGainV1(raw, R, 'ambience', offsetDb), measured: true };
}
function* stereoLevelledJob(key: string, mono: Float32Array, offsetDb = 0): Generator<void, StereoBufferV1> {
  const loop = yield* rawLoopJob(mono), n = loop.length, left = applyLevelV1(loop, R, ambienceGainV1(key, loop, offsetDb).gainDb); yield;
  const shift = Math.floor(n * 0.37), right = new Float32Array(n); for (let i = 0; i < n; i++) right[i] = left[(i + shift) % n]!;
  return Object.freeze({ sampleRate: R, left, right, seconds: n / R });
}
/** Offline (the generator/drift test): the raw loop a bed or weather key is levelled from. */
export function* rawBedJobV1(plan: AmbiencePlanV1): Generator<void, Float32Array | null> {
  if (plan.family === 'silence') return null;
  const total = BED_SECONDS + LOOP_FADE_SECONDS;
  let y = yield* familyLayerJob(plan.family, total, plan.seed);
  if (plan.detail) mixInto(y, yield* familyLayerJob(plan.detail, total, plan.seed ^ 0xde7a), 0.4);
  y = lowpass(y, 9000 * plan.tint.tone, R); yield;
  return yield* rawLoopJob(y);
}
export function* rawWeatherJobV1(w: WeatherLayerV1, seed: number): Generator<void, Float32Array> { return yield* rawLoopJob(yield* weatherLayerJob(w, WEATHER_SECONDS + LOOP_FADE_SECONDS, (seed ^ 0x3a7) >>> 0)); }
export const bedLevelKeyV1 = (plan: AmbiencePlanV1): string => `bed:${plan.biome}`;
export const weatherLevelKeyV1 = (w: WeatherLayerV1): string => `weather:${w}`;
/** A render job yields between its expensive steps, so the soundscape can run it in small slices off the frame (a phone never janks);
 *  `runJobV1` runs one to completion (tests, the Listening page). */
export function runJobV1<T>(job: Generator<void, T>): T { for (;;) { const s = job.next(); if (s.done) return s.value; } }
/** The bed job for a plan: its family (plus its detail family at −8 dB), tinted, 24 s seamless loop, stereo, levelled. */
export function* bedJobV1(plan: AmbiencePlanV1): Generator<void, StereoBufferV1 | null> {
  if (plan.family === 'silence') return null;
  const total = BED_SECONDS + LOOP_FADE_SECONDS;
  let y = yield* familyLayerJob(plan.family, total, plan.seed);
  if (plan.detail) mixInto(y, yield* familyLayerJob(plan.detail, total, plan.seed ^ 0xde7a), 0.4);
  y = lowpass(y, 9000 * plan.tint.tone, R); yield;
  return yield* stereoLevelledJob(bedLevelKeyV1(plan), y, plan.tint.gainDb);
}
export function* weatherJobV1(w: WeatherLayerV1, seed: number): Generator<void, StereoBufferV1> {
  return yield* stereoLevelledJob(weatherLevelKeyV1(w), yield* weatherLayerJob(w, WEATHER_SECONDS + LOOP_FADE_SECONDS, (seed ^ 0x3a7) >>> 0));
}
export const renderBedV1 = (plan: AmbiencePlanV1): StereoBufferV1 | null => runJobV1(bedJobV1(plan));
export const renderWeatherV1 = (w: WeatherLayerV1, seed: number): StereoBufferV1 => runJobV1(weatherJobV1(w, seed));
export const bedBytesV1 = (b: StereoBufferV1 | null): number => (b ? (b.left.byteLength + b.right.byteLength) : 0);
