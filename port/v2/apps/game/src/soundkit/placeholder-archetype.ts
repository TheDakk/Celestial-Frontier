/* PLACEHOLDER quadruped archetype: synthesized, labelled, never shippable.
   Stands in for the C3 recorded masters so derivation can be proven end to
   end. A formant-filtered noise burst plus a decaying tone per cue; fully
   deterministic from a fixed seed. */
import { mulberry32 } from '@cf/domain-rand';
import { SAMPLE_RATE, biquad, envelope, mixLayers, normalizePeak, onePole, sine } from './dsp.js';
import type { SourceLibrary } from './derive.js';

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
