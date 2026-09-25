/* PLACEHOLDER quadruped archetype: synthesized, labelled, never shippable.
   Stands in for the C3 recorded masters so derivation can be proven end to
   end. A formant-filtered noise burst plus a decaying tone per cue; fully
   deterministic from a fixed seed. */
import { mulberry32 } from '@cf/domain-rand';
import { SAMPLE_RATE, biquad, envelope, mixLayers, normalizePeak, onePole, sine } from './dsp.js';
import type { SourceLibrary, SourceSet } from './derive.js';

export interface PlaceholderArchetype {
  readonly archetypeKey: 'quadruped';
  readonly placeholder: true;
  readonly shippable: false;
  readonly label: 'placeholder-synthesized-not-a-recording';
  readonly sources: SourceLibrary;
}

function noise(length: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const y = new Float32Array(length);
  for (let i = 0; i < length; i++) y[i] = rng() * 2 - 1;
  return y;
}

function voiced(seconds: number, toneHz: number, formantHz: number, seed: number, breathy: number): Float32Array {
  const n = Math.round(seconds * SAMPLE_RATE);
  let burst = biquad(noise(n, seed), { kind: 'bandpass', f0: formantHz, q: 3 });
  burst = biquad(burst, { kind: 'peaking', f0: formantHz * 2.4, q: 2, gainDb: 6 });
  const tone = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const decay = Math.exp(-3 * t / seconds);
    tone[i] = (Math.sin(2 * Math.PI * toneHz * t) + 0.4 * Math.sin(2 * Math.PI * toneHz * 2 * t) + 0.2 * Math.sin(2 * Math.PI * toneHz * 3 * t)) * decay;
  }
  const shaped = envelope(mixLayers([{ samples: burst, gain: breathy }, { samples: tone, gain: 1 - breathy }], n), 0.012, seconds * 0.4);
  return normalizePeak(onePole(shaped, 6000, 'lowpass'), 0.9);
}

export function synthesizePlaceholderQuadruped(): PlaceholderArchetype {
  const sources: SourceLibrary = Object.freeze({
    quadruped: Object.freeze({
      'call': [voiced(0.9, 220, 900, 0x01, 0.45), voiced(1.0, 205, 950, 0x02, 0.5)],
      'alert': voiced(0.35, 300, 1200, 0x03, 0.6),
      'attack-vocal': voiced(0.7, 160, 700, 0x04, 0.7),
      'hurt': voiced(0.5, 330, 1400, 0x05, 0.55),
      'faint': voiced(1.4, 140, 600, 0x06, 0.4),
      'victory': voiced(1.1, 260, 1000, 0x07, 0.35),
      'breath-idle': voiced(1.6, 90, 500, 0x08, 0.9),
      'land-thud': envelope(onePole(noise(Math.round(0.25 * SAMPLE_RATE), 0x09), 180, 'lowpass'), 0.002, 0.2),
      'footfall': envelope(onePole(noise(Math.round(0.08 * SAMPLE_RATE), 0x0a), 900, 'lowpass'), 0.001, 0.06),
      'tame-settle': voiced(0.8, 180, 650, 0x0b, 0.5),
      'feed-chew': envelope(biquad(noise(Math.round(0.3 * SAMPLE_RATE), 0x0c), { kind: 'bandpass', f0: 2200, q: 2 }), 0.005, 0.2),
      'texture:furred': onePole(noise(Math.round(0.5 * SAMPLE_RATE), 0x0d), 1500, 'lowpass'),
      'texture:crystalline': biquad(noise(Math.round(0.5 * SAMPLE_RATE), 0x0e), { kind: 'bandpass', f0: 5200, q: 8 }),
      'texture:translucent': onePole(sine(38, Math.round(0.5 * SAMPLE_RATE), 0.6), 400, 'lowpass'),
    }),
  });
  return Object.freeze({
    archetypeKey: 'quadruped', placeholder: true, shippable: false,
    label: 'placeholder-synthesized-not-a-recording', sources,
  });
}

/* PLACEHOLDER library for every voiced body plan (2026-09-24): the quadruped set above byte-for-byte, plus one synthesized set
   per other archetype with its own character, so a serpent hisses, an insect clicks, a fish bubbles and a bird chirps instead of
   a battle falling silent (or, before 86c9e3ed, throwing). Same labels: synthesized, never shippable; recorded C3 masters replace
   them. Each set is built lazily on first use (a battle builds at most two). Deterministic from fixed seeds. */
type Timbre = 'voiced' | 'croak' | 'chirp' | 'hiss' | 'click' | 'bubble' | 'squeak';
interface Profile { readonly timbre: Timbre; readonly toneHz: number; readonly formantHz: number; readonly breathy: number; readonly step: 'pad' | 'tap' | 'slide' | 'splash' | 'flap'; }
const PROFILES: Readonly<Record<string, Profile>> = Object.freeze({
  hopper: { timbre: 'croak', toneHz: 110, formantHz: 700, breathy: 0.35, step: 'splash' },
  'biped-bird': { timbre: 'chirp', toneHz: 1800, formantHz: 3200, breathy: 0.25, step: 'tap' },
  fish: { timbre: 'bubble', toneHz: 240, formantHz: 600, breathy: 0.3, step: 'splash' },
  insect: { timbre: 'click', toneHz: 3800, formantHz: 4200, breathy: 0.6, step: 'tap' },
  arachnid: { timbre: 'click', toneHz: 2600, formantHz: 3000, breathy: 0.75, step: 'tap' },
  serpent: { timbre: 'hiss', toneHz: 120, formantHz: 5200, breathy: 0.9, step: 'slide' },
  myriapod: { timbre: 'click', toneHz: 3200, formantHz: 3600, breathy: 0.7, step: 'slide' },
  radial: { timbre: 'bubble', toneHz: 160, formantHz: 420, breathy: 0.5, step: 'slide' },
  cephalopod: { timbre: 'bubble', toneHz: 190, formantHz: 520, breathy: 0.45, step: 'splash' },
  'flyer-membrane': { timbre: 'squeak', toneHz: 2400, formantHz: 4800, breathy: 0.3, step: 'flap' },
  primate: { timbre: 'voiced', toneHz: 380, formantHz: 1500, breathy: 0.4, step: 'pad' },
  brachyuran: { timbre: 'click', toneHz: 1900, formantHz: 2400, breathy: 0.55, step: 'tap' },
});
const n = (seconds: number): number => Math.round(seconds * SAMPLE_RATE);
function sweep(seconds: number, fromHz: number, toHz: number, seed: number, breathy: number, formantHz: number): Float32Array {
  const len = n(seconds), y = new Float32Array(len); let phase = 0;
  for (let i = 0; i < len; i++) { const u = i / len, f = fromHz * Math.pow(toHz / fromHz, u); phase += 2 * Math.PI * f / SAMPLE_RATE; y[i] = Math.sin(phase) * Math.sin(Math.PI * Math.min(1, u * 4)) * Math.exp(-2 * u); }
  const air = biquad(noise(len, seed), { kind: 'bandpass', f0: formantHz, q: 2 });
  return normalizePeak(envelope(mixLayers([{ samples: y, gain: 1 - breathy }, { samples: air, gain: breathy }], len), 0.004, seconds * 0.3), 0.9);
}
function hiss(seconds: number, formantHz: number, seed: number): Float32Array {
  const len = n(seconds);
  return normalizePeak(envelope(onePole(biquad(noise(len, seed), { kind: 'bandpass', f0: formantHz, q: 0.8 }), 1800, 'highpass'), 0.05, seconds * 0.5), 0.8);
}
function clicks(seconds: number, rateHz: number, toneHz: number, seed: number): Float32Array {
  const len = n(seconds), y = new Float32Array(len), rng = mulberry32(seed), period = Math.max(1, Math.round(SAMPLE_RATE / rateHz)), w = n(0.004);
  for (let s = 0; s < len; s += Math.max(1, Math.round(period * (0.7 + 0.6 * rng())))) for (let k = 0; k < w && s + k < len; k++) y[s + k] = y[s + k]! + Math.sin(2 * Math.PI * toneHz * k / SAMPLE_RATE) * (1 - k / w);
  return normalizePeak(envelope(y, 0.002, seconds * 0.2), 0.85);
}
function bubbles(seconds: number, toneHz: number, seed: number): Float32Array {
  const len = n(seconds), y = new Float32Array(len), rng = mulberry32(seed), count = Math.max(2, Math.round(seconds * 9)), w = n(0.07);
  for (let b = 0; b < count; b++) { const at = Math.floor(rng() * Math.max(1, len - w)), f0 = toneHz * (0.7 + 0.8 * rng());
    for (let k = 0; k < w && at + k < len; k++) { const u = k / w; y[at + k] = y[at + k]! + Math.sin(2 * Math.PI * f0 * (1 + 1.5 * u) * k / SAMPLE_RATE) * Math.exp(-5 * u); } }
  return normalizePeak(onePole(y, 2400, 'lowpass'), 0.85);
}
function croak(seconds: number, toneHz: number, formantHz: number, seed: number, breathy: number): Float32Array {
  const base = voiced(seconds, toneHz, formantHz, seed, breathy), len = base.length, y = new Float32Array(len), pulse = SAMPLE_RATE / 22;
  for (let i = 0; i < len; i++) y[i] = base[i]! * (0.55 + 0.45 * Math.sign(Math.sin(2 * Math.PI * i / pulse)));
  return normalizePeak(y, 0.9);
}
function vocal(p: Profile, seconds: number, pitch: number, seed: number, breathyAdd = 0): Float32Array {
  const hz = p.toneHz * pitch, b = Math.min(0.95, p.breathy + breathyAdd);
  switch (p.timbre) {
    case 'voiced': return voiced(seconds, hz, p.formantHz, seed, b);
    case 'croak': return croak(seconds, hz, p.formantHz, seed, b);
    case 'chirp': return sweep(seconds, hz, hz * (pitch >= 1 ? 1.6 : 0.6), seed, b, p.formantHz);
    case 'squeak': return sweep(seconds, hz * 1.3, hz * 0.8, seed, b, p.formantHz);
    case 'hiss': return hiss(seconds, p.formantHz * pitch, seed);
    case 'click': return clicks(seconds, 18 * pitch, hz, seed);
    case 'bubble': return bubbles(seconds, hz, seed);
  }
}
function footstep(p: Profile, seed: number): Float32Array {
  switch (p.step) {
    case 'pad': return envelope(onePole(noise(n(0.08), seed), 900, 'lowpass'), 0.001, 0.06);
    case 'tap': return envelope(biquad(noise(n(0.03), seed), { kind: 'bandpass', f0: 3000, q: 3 }), 0.0005, 0.025);
    case 'slide': return envelope(biquad(noise(n(0.25), seed), { kind: 'bandpass', f0: 1400, q: 0.9 }), 0.04, 0.15);
    case 'splash': return normalizePeak(envelope(mixLayers([{ samples: onePole(noise(n(0.18), seed), 2600, 'lowpass'), gain: 0.7 }, { samples: bubbles(0.18, 300, seed ^ 0x55), gain: 0.3 }], n(0.18)), 0.002, 0.14), 0.8);
    case 'flap': return envelope(onePole(noise(n(0.12), seed), 700, 'lowpass'), 0.02, 0.08);
  }
}
function placeholderSet(archetype: string, p: Profile): SourceSet {
  const s = 0x1000 * (Object.keys(PROFILES).indexOf(archetype) + 2);
  return Object.freeze({
    'call': [vocal(p, 0.9, 1, s + 1), vocal(p, 1.0, 0.94, s + 2)],
    'alert': vocal(p, 0.35, 1.35, s + 3, 0.1),
    'attack-vocal': vocal(p, 0.7, 0.75, s + 4, 0.2),
    'hurt': vocal(p, 0.5, 1.5, s + 5, 0.1),
    'faint': vocal(p, 1.4, 0.6, s + 6),
    'victory': vocal(p, 1.1, 1.15, s + 7),
    'breath-idle': p.timbre === 'hiss' ? hiss(1.2, p.formantHz * 0.6, s + 8) : vocal(p, 1.2, 0.5, s + 8, 0.4),
    'land-thud': envelope(onePole(noise(n(0.25), s + 9), p.step === 'splash' ? 600 : 180, 'lowpass'), 0.002, 0.2),
    'footfall': footstep(p, s + 10),
    'tame-settle': vocal(p, 0.8, 0.85, s + 11),
    'feed-chew': envelope(biquad(noise(n(0.3), s + 12), { kind: 'bandpass', f0: p.timbre === 'click' ? 3400 : 2200, q: 2 }), 0.005, 0.2),
  });
}
export interface PlaceholderLibrary { readonly placeholder: true; readonly shippable: false; readonly label: 'placeholder-synthesized-not-a-recording'; readonly sources: SourceLibrary; }
/** Every voiced body plan (VOICE_ARCHETYPES); the quadruped is synthesizePlaceholderQuadruped()'s set unchanged. Lazy per archetype. */
export function synthesizePlaceholderLibrary(): PlaceholderLibrary {
  const sources: Record<string, SourceSet> = {}, cache = new Map<string, SourceSet>();
  Object.defineProperty(sources, 'quadruped', { enumerable: true, get: () => { let v = cache.get('quadruped'); if (!v) { v = synthesizePlaceholderQuadruped().sources.quadruped!; cache.set('quadruped', v); } return v; } });
  for (const [archetype, profile] of Object.entries(PROFILES)) Object.defineProperty(sources, archetype, { enumerable: true, get: () => { let v = cache.get(archetype); if (!v) { v = placeholderSet(archetype, profile); cache.set(archetype, v); } return v; } });
  return Object.freeze({ placeholder: true, shippable: false, label: 'placeholder-synthesized-not-a-recording', sources: Object.freeze(sources) });
}
