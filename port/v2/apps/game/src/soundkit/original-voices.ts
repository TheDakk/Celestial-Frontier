/* @module soundkit/original-voices [domain] — the ORIGINAL creature source library (D15, Claude 2026-09-26): one source set per voice
   archetype in the kit's shape (call ×2 takes, alert, attack-vocal, hurt, faint, victory, breath-idle, land-thud, footfall, tame-settle,
   feed-chew), the ten footfall sets and the nine material textures shared by every archetype. Every source is rendered by
   `organic.ts` from a fixed seed; `deriveCue` turns them into each creature's own voice through its voice card, exactly as it did the
   placeholder masters. Provenance: generator `cf-soundkit-original-v1`, seed per source (`sourceSeedV1`), output hash in the manifest
   (`originalSourceManifestV1`) and in AUDIO_LICENSES.md. Lazy: an archetype's set is rendered on first use and kept (a battle needs two). */
import { hashInt } from '@cf/domain-rand';
import { sha256Hex, type SourceLibrary, type SourceSet } from './derive.js';
import { FOOTFALL_SETS, VOICE_ARCHETYPES, VOICE_MATERIALS } from './voice-card.js';
import {
  breathing, bubbles, clicks, curve, drumming, glottal, hiss, len, lowpass, highpass, mix, mixInto, modal, mulCurve, normalize, pink,
  purr, resonate, shape, stridulate, syrinx, thud, whoosh, white, brown, type Formant,
} from './organic.js';
import { synthesizePlaceholderLibrary } from './placeholder-archetype.js';

export const ORIGINAL_SOURCE_GENERATOR = 'cf-soundkit-original-v1' as const;
export const ORIGINAL_SOURCE_RIGHTS = 'original, CC0 by the project (procedural generator in this repository)' as const;
const BASE_SEED = 0x5ca1ab1e;
/** The seed of one source: deterministic from its archetype and key (stable across releases; a key's seed never depends on order). */
export function sourceSeedV1(archetype: string, key: string): number { let h = BASE_SEED; for (const ch of `${archetype}/${key}`) h = hashInt(h, ch.charCodeAt(0), 0x9e37) >>> 0; return h >>> 0; }

type Src = Float32Array | readonly Float32Array[];
type Builder = (seed: (key: string) => number) => Readonly<Record<string, Src>>;
const F = (f: number, bw: number, g: number): Formant => Object.freeze({ f, bw, g });

/* ---------- shared: footfalls and material textures (the same bytes in every archetype's set) ---------- */
const SHARED = 'shared';
const s = (key: string): number => sourceSeedV1(SHARED, key);
function footfallSet(set: string): Float32Array {
  const seed = s(`footfall:${set}`);
  switch (set) {
    case 'pad': return normalize(mix(len(0.12), [[thud(0.12, 0.5, seed), 0.8], [shape(lowpass(pink(len(0.08), seed ^ 1), 1400), 0.002, 0.06), 0.35]]), 0.8);
    case 'hoof': return normalize(mix(len(0.16), [[modal(0.16, 340, [{ ratio: 1, decay: 0.04, amp: 1 }, { ratio: 2.7, decay: 0.02, amp: 0.4 }], 0.9, seed), 1], [thud(0.14, 1.2, seed ^ 2), 0.6]]), 0.85);
    case 'claw': return normalize(mix(len(0.08), [[clicks(0.05, 2, 2600, seed), 0.8], [thud(0.08, 0.4, seed ^ 3), 0.35]]), 0.8);
    case 'hop': return normalize(mix(len(0.2), [[thud(0.2, 0.7, seed), 1], [shape(lowpass(white(len(0.06), seed ^ 4), 900), 0.004, 0.05), 0.3, len(0.02)]]), 0.8);
    case 'slither': return normalize(shape(resonate(white(len(0.3), seed), 1500, 1400), 0.08, 0.14), 0.75);
    case 'scuttle': return normalize(clicks(0.12, 5, 3100, seed), 0.75);
    case 'splash': return normalize(mix(len(0.22), [[shape(lowpass(white(len(0.18), seed), 2600), 0.002, 0.14), 0.8], [bubbles(0.22, 30, 1.2, 4, seed ^ 5), 0.35]]), 0.8);
    case 'wingbeat': return normalize(whoosh(0.14, 350, 180, 300, seed), 0.75);
    case 'jet': return normalize(mix(len(0.3), [[whoosh(0.3, 500, 220, 500, seed), 0.8], [bubbles(0.3, 25, 1, 3, seed ^ 6), 0.3]]), 0.8);
    case 'roll': return normalize(shape(lowpass(brown(len(0.35), seed), 260), 0.05, 0.12), 0.8);
    default: throw new RangeError(`no footfall set ${set}`);
  }
}
function texture(material: string): Float32Array {
  const seed = s(`texture:${material}`), n = len(0.6);
  switch (material) {
    case 'furred': return normalize(lowpass(pink(n, seed), 1300), 0.7);
    case 'feathered': return normalize(mulCurve(highpass(white(n, seed), 1800), Float32Array.from({ length: n }, (_, i) => 0.5 + 0.5 * Math.sin(i / 480) ** 2)), 0.6);
    case 'scaled': return normalize(resonate(white(n, seed), 2600, 1800), 0.6);
    case 'slick': return normalize(mix(n, [[lowpass(white(n, seed), 1600), 0.5], [bubbles(0.6, 22, 0.8, 2.5, seed ^ 7), 0.6]]), 0.65);
    case 'chitinous': return normalize(clicks(0.6, 12, 3600, seed), 0.6);
    case 'plated': return normalize(modal(0.6, 610, [{ ratio: 1, decay: 0.3, amp: 1 }, { ratio: 2.76, decay: 0.22, amp: 0.6 }, { ratio: 5.4, decay: 0.12, amp: 0.35 }, { ratio: 8.93, decay: 0.08, amp: 0.2 }], 0.3, seed), 0.6);
    case 'crystalline': return normalize(modal(0.6, 1840, [{ ratio: 1, decay: 0.35, amp: 1 }, { ratio: 2.32, decay: 0.3, amp: 0.7 }, { ratio: 4.25, decay: 0.2, amp: 0.4 }, { ratio: 6.63, decay: 0.12, amp: 0.25 }], 0.1, seed), 0.55);
    case 'translucent': return normalize(mix(n, [[lowpass(brown(n, seed), 500), 0.7], [bubbles(0.6, 8, 3, 7, seed ^ 8), 0.5]]), 0.6);
    case 'warty': return normalize(mix(n, [[bubbles(0.6, 14, 2, 6, seed), 0.7], [lowpass(white(n, seed ^ 9), 800), 0.3]]), 0.6);
    default: throw new RangeError(`no texture ${material}`);
  }
}
let sharedCache: Readonly<Record<string, Float32Array>> | null = null;
function shared(): Readonly<Record<string, Float32Array>> {
  if (sharedCache) return sharedCache;
  const out: Record<string, Float32Array> = {};
  for (const set of FOOTFALL_SETS) out[`footfall:${set}`] = footfallSet(set);
  for (const m of VOICE_MATERIALS) out[`texture:${m}`] = texture(m);
  return (sharedCache = Object.freeze(out));
}

/* ---------- a crunching mouthful, shared shape ---------- */
function chew(seconds: number, bite: number, seed: number): Float32Array {
  const n = len(seconds), y = new Float32Array(n), chews = Math.max(2, Math.round(seconds * 3.2));
  for (let c = 0; c < chews; c++) { const at = Math.round((c / chews) * n), grit = shape(resonate(white(len(0.09), seed + c), bite, bite * 0.9), 0.003, 0.06); mixInto(y, grit, 0.8, at); mixInto(y, clicks(0.06, 3, bite * 1.4, (seed ^ 0x40) + c), 0.4, at); }
  return normalize(y, 0.85);
}

/* ---------- the archetypes ---------- */
/** Mammal throat (civet/fox/dog-sized carnivore): a four-formant tract; bark, growl, yelp, sigh, howl, purr. */
const quadruped: Builder = (sd) => {
  const tract = [F(620, 90, 1), F(1320, 110, 0.7), F(2650, 180, 0.35), F(3600, 260, 0.15)];
  return {
    call: [glottal({ seconds: 0.9, f0: [[0, 180], [0.35, 265], [1, 170]], formants: tract, tract: [[0, 0.95], [0.4, 1.15], [1, 0.9]], breath: 0.25, seed: sd('call#1') }),
      glottal({ seconds: 1.0, f0: [[0, 170], [0.5, 245], [1, 160]], formants: tract, tract: [[0, 0.9], [0.5, 1.1], [1, 0.88]], breath: 0.3, jitter: 0.018, seed: sd('call#2') })],
    alert: glottal({ seconds: 0.32, f0: [[0, 310], [0.3, 330], [1, 240]], formants: tract, tract: [[0, 1.2], [1, 1]], open: 0.4, breath: 0.3, attack: 0.004, release: 0.12, seed: sd('alert') }),
    'attack-vocal': glottal({ seconds: 0.7, f0: [[0, 95], [0.4, 135], [1, 88]], formants: tract, tract: [[0, 0.85], [0.5, 1.05], [1, 0.9]], open: 0.45, sub: 0.8, rough: 0.6, breath: 0.35, attack: 0.01, seed: sd('attack-vocal') }),
    hurt: glottal({ seconds: 0.45, f0: [[0, 430], [0.25, 660], [1, 300]], formants: tract, tract: [[0, 1.2], [1, 1]], open: 0.45, breath: 0.3, attack: 0.004, seed: sd('hurt') }),
    faint: glottal({ seconds: 1.4, f0: [[0, 250], [0.4, 210], [1, 130]], formants: tract, tract: [[0, 1], [1, 0.78]], breath: 0.55, jitter: 0.03, seed: sd('faint') }),
    victory: glottal({ seconds: 1.1, f0: [[0, 200], [0.6, 330], [1, 300]], formants: tract, tract: [[0, 0.9], [0.5, 1.2], [1, 1.1]], breath: 0.2, seed: sd('victory') }),
    'breath-idle': breathing(1.6, 0.9, tract, sd('breath-idle')),
    'land-thud': thud(0.3, 1, sd('land-thud')),
    footfall: footfallSet('pad'),
    'tame-settle': purr(0.9, 25, tract, sd('tame-settle')),
    'feed-chew': chew(0.35, 2100, sd('feed-chew')),
  };
};

/* ---------- shared shapes for the other archetypes ---------- */
const gate = (x: Float32Array, hz: number, depth = 1): Float32Array => mulCurve(x, Float32Array.from({ length: x.length }, (_, i) => 1 - depth + depth * Math.pow(0.5 + 0.5 * Math.sin((2 * Math.PI * hz * i) / 48_000), 2)));
const fade = (x: Float32Array, pts: readonly (readonly [number, number])[]): Float32Array => mulCurve(x, curve(pts, x.length));
function series(seconds: number, parts: readonly Float32Array[], gains?: readonly number[]): Float32Array {
  const n = len(seconds), y = new Float32Array(n), step = parts.length > 1 ? Math.max(0, n - parts[parts.length - 1]!.length) / (parts.length - 1) : 0;
  parts.forEach((p, k) => mixInto(y, p, gains?.[k] ?? 1, Math.round(k * step))); return normalize(y, 0.9);
}
const clack = (seed: number, hz = 2100): Float32Array => modal(0.09, hz, [{ ratio: 1, decay: 0.02, amp: 1 }, { ratio: 2.9, decay: 0.012, amp: 0.5 }, { ratio: 5.1, decay: 0.006, amp: 0.25 }], 1, seed);
const froth = (seconds: number, perSecond: number, seed: number): Float32Array => normalize(highpass(bubbles(seconds, perSecond, 0.5, 1.8, seed), 900), 0.85);
const waterPulse = (seconds: number, rateHz: number, seed: number): Float32Array => normalize(mix(len(seconds), [[gate(lowpass(brown(len(seconds), seed), 340), rateHz), 1], [bubbles(seconds, 5, 2, 6, seed ^ 0x21), 0.35]]), 0.85);

/** Primate: a vowel-rich throat — hoot series building to a scream, barks, shrieks, lip-smacks. */
const primate: Builder = (sd) => {
  const tract = [F(760, 100, 1), F(1250, 120, 0.75), F(2600, 190, 0.35), F(3400, 260, 0.15)], hoo = [F(380, 80, 1), F(900, 110, 0.6), F(2400, 200, 0.2)];
  const hoots = (seed: number, count: number, from: number, to: number, seconds: number): Float32Array => series(seconds, Array.from({ length: count }, (_, k) => { const f = from + (to - from) * (k / Math.max(1, count - 1));
    return glottal({ seconds: 0.16, f0: [[0, f], [1, f * 1.08]], formants: hoo, breath: 0.35, attack: 0.01, release: 0.06, seed: seed + k }); }), Array.from({ length: count }, (_, k) => 0.5 + 0.5 * (k / Math.max(1, count - 1))));
  const scream = (seed: number, seconds: number, f: number): Float32Array => glottal({ seconds, f0: [[0, f], [0.4, f * 1.25], [1, f * 0.85]], formants: tract, tract: [[0, 1.15], [1, 1.2]], open: 0.38, rough: 0.4, breath: 0.35, attack: 0.006, seed });
  return {
    call: [hoots(sd('call#1'), 6, 220, 420, 1.1), series(1.2, [hoots(sd('call#2'), 4, 240, 360, 0.8), scream(sd('call#2s'), 0.35, 820)], [0.8, 1])],
    alert: glottal({ seconds: 0.3, f0: [[0, 380], [1, 300]], formants: tract, tract: [[0, 0.8], [0.3, 1.2], [1, 1]], open: 0.4, breath: 0.3, attack: 0.004, release: 0.1, seed: sd('alert') }),
    'attack-vocal': scream(sd('attack-vocal'), 0.6, 900),
    hurt: glottal({ seconds: 0.45, f0: [[0, 1200], [0.3, 1500], [1, 700]], formants: tract, tract: [[0, 1.25], [1, 1.1]], open: 0.4, breath: 0.35, attack: 0.004, seed: sd('hurt') }),
    faint: glottal({ seconds: 1.3, f0: [[0, 180], [1, 118]], formants: tract, tract: [[0, 1], [1, 0.85]], breath: 0.5, sub: 0.3, seed: sd('faint') }),
    victory: series(1.3, [hoots(sd('victory'), 7, 260, 520, 1.0), scream(sd('victory-s'), 0.3, 980)], [0.8, 1]),
    'breath-idle': breathing(1.4, 1.1, tract, sd('breath-idle')),
    'land-thud': thud(0.3, 1.1, sd('land-thud')),
    footfall: footfallSet('pad'),
    'tame-settle': mix(len(0.8), [[clicks(0.8, 6, 1500, sd('tame-settle')), 0.6], [glottal({ seconds: 0.25, f0: [[0, 140], [1, 130]], formants: tract, breath: 0.6, seed: sd('tame-grunt') }), 0.8, len(0.45)]]),
    'feed-chew': chew(0.4, 1900, sd('feed-chew')),
  };
};
/** Hopper (frogs, toads): a vocal-sac croak — a low pressed throat gated at the pulse rate, trills, squeaks, a tongue snap. */
const hopper: Builder = (sd) => {
  const tract = [F(420, 120, 1), F(1150, 160, 0.6), F(2300, 240, 0.25)];
  const croak = (seconds: number, from: number, to: number, pulse: number, seed: number): Float32Array => normalize(gate(glottal({ seconds, f0: [[0, from], [1, to]], formants: tract, sub: 0.5, rough: 0.3, breath: 0.2, open: 0.5, seed }), pulse, 0.85), 0.9);
  return {
    call: [croak(0.9, 140, 132, 18, sd('call#1')), croak(1.0, 130, 124, 14, sd('call#2'))],
    alert: croak(0.25, 170, 160, 30, sd('alert')),
    'attack-vocal': mix(len(0.5), [[croak(0.5, 110, 104, 25, sd('attack-vocal')), 0.8], [hiss(0.5, 3600, 2800, sd('attack-hiss')), 0.35]]),
    hurt: glottal({ seconds: 0.3, f0: [[0, 700], [0.4, 920], [1, 600]], formants: tract, tract: [[0, 1.4], [1, 1.3]], open: 0.45, breath: 0.3, attack: 0.004, seed: sd('hurt') }),
    faint: croak(1.3, 150, 88, 10, sd('faint')),
    victory: croak(1.1, 160, 168, 32, sd('victory')),
    'breath-idle': purr(1.2, 5, tract, sd('breath-idle')),
    'land-thud': mix(len(0.3), [[thud(0.25, 0.6, sd('land-thud')), 1], [footfallSet('splash'), 0.4]]),
    footfall: footfallSet('hop'),
    'tame-settle': croak(0.6, 200, 196, 24, sd('tame-settle')),
    'feed-chew': mix(len(0.3), [[clicks(0.15, 1, 1400, sd('feed-chew')), 1], [bubbles(0.3, 20, 0.8, 2.5, sd('feed-wet')), 0.5]]),
  };
};
/** Birds: the syrinx — descending whistled phrases, a chip, a scream, a squawk, a coo; beak clicks. */
const bird: Builder = (sd) => ({
  call: [syrinx({ seconds: 0.9, f: [[0, 2600], [0.5, 2300], [1, 1700]], trillHz: 28, trillDepth: 0.04, syllables: 3, breath: 0.25, seed: sd('call#1') }),
    syrinx({ seconds: 1.0, f: [[0, 2400], [1, 2000]], trillHz: 34, trillDepth: 0.06, syllables: 5, breath: 0.25, seed: sd('call#2') })],
  alert: syrinx({ seconds: 0.2, f: [[0, 3200], [1, 2900]], breath: 0.3, seed: sd('alert') }),
  'attack-vocal': syrinx({ seconds: 0.6, f: [[0, 2300], [0.4, 2600], [1, 1800]], trillHz: 45, trillDepth: 0.07, harmonics: [1, 0.6, 0.35, 0.2], breath: 0.55, seed: sd('attack-vocal') }),
  hurt: syrinx({ seconds: 0.35, f: [[0, 1500], [0.4, 1900], [1, 1300]], trillHz: 60, trillDepth: 0.1, harmonics: [1, 0.7, 0.5, 0.3], breath: 0.7, seed: sd('hurt') }),
  faint: syrinx({ seconds: 1.3, f: [[0, 1900], [1, 700]], syllables: 2, breath: 0.4, seed: sd('faint') }),
  victory: syrinx({ seconds: 1.2, f: [[0, 2200], [1, 3000]], trillHz: 22, trillDepth: 0.05, syllables: 6, breath: 0.2, seed: sd('victory') }),
  'breath-idle': breathing(1.2, 1.6, [F(1800, 300, 1), F(3200, 400, 0.4)], sd('breath-idle')),
  'land-thud': mix(len(0.25), [[thud(0.2, 0.5, sd('land-thud')), 1], [footfallSet('wingbeat'), 0.6]]),
  footfall: footfallSet('claw'),
  'tame-settle': syrinx({ seconds: 0.8, f: [[0, 1100], [1, 1000]], trillHz: 18, trillDepth: 0.08, syllables: 4, breath: 0.3, harmonics: [1, 0.25], seed: sd('tame-settle') }),
  'feed-chew': clicks(0.35, 6, 1900, sd('feed-chew')),
});
/** Fish: swim-bladder drumming (grunts, croaks), bubbles, water rushes and a gulp. */
const fish: Builder = (sd) => ({
  call: [mix(len(0.8), [[drumming(0.8, 55, 170, sd('call#1')), 1], [bubbles(0.8, 6, 1.5, 4, sd('call#1b')), 0.3]]), drumming(0.9, 42, 150, sd('call#2'))],
  alert: drumming(0.25, 90, 220, sd('alert')),
  'attack-vocal': mix(len(0.5), [[lowpass(whoosh(0.5, 250, 600, 400, sd('attack-vocal')), 1500), 0.8], [drumming(0.5, 70, 180, sd('attack-drum')), 0.8]]),
  hurt: mix(len(0.3), [[drumming(0.3, 110, 260, sd('hurt')), 0.8], [bubbles(0.3, 40, 1, 3, sd('hurt-b')), 0.6]]),
  faint: mix(len(1.2), [[fade(drumming(1.2, 30, 140, sd('faint')), [[0, 1], [1, 0]]), 1], [bubbles(1.2, 12, 2, 6, sd('faint-b')), 0.5]]),
  victory: mix(len(1.0), [[drumming(1.0, 65, 190, sd('victory')), 1], [bubbles(1.0, 10, 1.5, 4, sd('victory-b')), 0.4]]),
  'breath-idle': mix(len(1.4), [[bubbles(1.4, 5, 1, 3, sd('breath-idle')), 0.7], [lowpass(brown(len(1.4), sd('breath-water')), 300), 0.4]]),
  'land-thud': mix(len(0.3), [[footfallSet('splash'), 1], [thud(0.25, 0.8, sd('land-thud')), 0.6]]),
  footfall: footfallSet('splash'),
  'tame-settle': bubbles(0.8, 10, 1.5, 4, sd('tame-settle')),
  'feed-chew': mix(len(0.3), [[lowpass(thud(0.15, 0.4, sd('feed-chew')), 900), 0.8], [bubbles(0.3, 20, 1, 2.5, sd('feed-b')), 0.6]]),
});
/** Insects: stridulation chirps, a wing buzz, mandible clicks. */
const insect: Builder = (sd) => ({
  call: [stridulate({ seconds: 0.9, pulseRate: 5, pulseLen: 0.07, toothRate: 450, body: 4300, q: 12, seed: sd('call#1') }), stridulate({ seconds: 1.0, pulseRate: 3.5, pulseLen: 0.12, toothRate: 380, body: 3900, q: 10, seed: sd('call#2') })],
  alert: mix(len(0.35), [[drumming(0.35, 190, 380, sd('alert')), 1], [highpass(white(len(0.35), sd('alert-air')), 3000), 0.08]]),
  'attack-vocal': mix(len(0.5), [[clicks(0.5, 8, 3000, sd('attack-vocal')), 0.8], [drumming(0.5, 220, 420, sd('attack-buzz')), 0.6]]),
  hurt: stridulate({ seconds: 0.35, pulseRate: 14, pulseLen: 0.02, toothRate: 600, body: 4800, q: 8, seed: sd('hurt') }),
  faint: fade(stridulate({ seconds: 1.2, pulseRate: 3, pulseLen: 0.05, toothRate: 250, body: 3600, q: 10, seed: sd('faint') }), [[0, 1], [1, 0]]),
  victory: stridulate({ seconds: 1.1, pulseRate: 8, pulseLen: 0.08, toothRate: 520, body: 4500, q: 14, seed: sd('victory') }),
  'breath-idle': lowpass(drumming(1.2, 160, 360, sd('breath-idle')), 1200),
  'land-thud': mix(len(0.2), [[thud(0.15, 0.3, sd('land-thud')), 1], [clicks(0.1, 3, 3000, sd('land-clicks')), 0.5]]),
  footfall: footfallSet('scuttle'),
  'tame-settle': stridulate({ seconds: 0.7, pulseRate: 2.5, pulseLen: 0.05, toothRate: 300, body: 3800, q: 12, seed: sd('tame-settle') }),
  'feed-chew': clicks(0.35, 10, 3400, sd('feed-chew')),
});
/** Spiders and scorpions: a hissing rasp, clicks, a slow fading rasp. */
const arachnid: Builder = (sd) => ({
  call: [mix(len(0.8), [[stridulate({ seconds: 0.8, pulseRate: 9, pulseLen: 0.05, toothRate: 900, body: 2500, q: 4, seed: sd('call#1') }), 1], [hiss(0.8, 3500, 3000, sd('call#1h')), 0.4]]), stridulate({ seconds: 0.9, pulseRate: 6, pulseLen: 0.08, toothRate: 700, body: 2200, q: 4, seed: sd('call#2') })],
  alert: hiss(0.3, 4200, 3500, sd('alert'), [[0, 0], [0.06, 1], [1, 0]]),
  'attack-vocal': mix(len(0.5), [[hiss(0.5, 3800, 4000, sd('attack-vocal'), [[0, 0], [0.05, 1], [1, 0]]), 0.8], [clicks(0.5, 6, 2400, sd('attack-clicks')), 0.6]]),
  hurt: mix(len(0.3), [[clicks(0.3, 8, 2800, sd('hurt')), 0.8], [hiss(0.2, 4600, 3000, sd('hurt-h')), 0.4]]),
  faint: mix(len(0.9), [[fade(stridulate({ seconds: 0.9, pulseRate: 3, pulseLen: 0.06, toothRate: 500, body: 2100, q: 4, seed: sd('faint') }), [[0, 1], [1, 0]]), 1], [hiss(0.9, 3000, 2500, sd('faint-h'), [[0, 0.5], [1, 0]]), 0.3]]),
  victory: stridulate({ seconds: 1.0, pulseRate: 12, pulseLen: 0.04, toothRate: 1100, body: 2600, q: 5, seed: sd('victory') }),
  'breath-idle': hiss(1.2, 2600, 2000, sd('breath-idle'), [[0, 0], [0.4, 0.5], [0.6, 0.2], [1, 0]]),
  'land-thud': mix(len(0.2), [[thud(0.15, 0.3, sd('land-thud')), 1], [clicks(0.1, 4, 2600, sd('land-clicks')), 0.5]]),
  footfall: footfallSet('scuttle'),
  'tame-settle': clicks(0.6, 5, 2200, sd('tame-settle')),
  'feed-chew': mix(len(0.35), [[clicks(0.35, 9, 2600, sd('feed-chew')), 1], [bubbles(0.35, 20, 0.6, 1.5, sd('feed-wet')), 0.3]]),
});
/** Snakes: hisses of every length, a strike, a rattle, a gulp. */
const serpent: Builder = (sd) => ({
  call: [hiss(0.9, 4600, 3800, sd('call#1')), hiss(1.0, 5200, 4200, sd('call#2'), [[0, 0], [0.2, 1], [0.9, 0.9], [1, 0]])],
  alert: hiss(0.3, 5000, 4000, sd('alert'), [[0, 0], [0.05, 1], [1, 0]]),
  'attack-vocal': mix(len(0.45), [[hiss(0.45, 4400, 4200, sd('attack-vocal'), [[0, 0], [0.04, 1], [1, 0]]), 0.8], [thud(0.25, 0.6, sd('attack-strike')), 0.6]]),
  hurt: mix(len(0.3), [[hiss(0.3, 6000, 5000, sd('hurt'), [[0, 0], [0.05, 1], [1, 0]]), 1], [clicks(0.05, 1, 2000, sd('hurt-c')), 0.4]]),
  faint: mix(len(1.4), [[hiss(1.4, 3600, 3000, sd('faint'), [[0, 0], [0.1, 1], [1, 0]]), 1], [fade(lowpass(brown(len(1.4), sd('faint-body')), 200), [[0, 1], [1, 0]]), 0.4]]),
  victory: stridulate({ seconds: 1.0, pulseRate: 50, pulseLen: 0.01, toothRate: 900, body: 2600, q: 3, seed: sd('victory') }),
  'breath-idle': hiss(1.4, 3000, 2500, sd('breath-idle'), [[0, 0], [0.3, 0.5], [0.5, 0.1], [0.8, 0.5], [1, 0]]),
  'land-thud': mix(len(0.35), [[thud(0.25, 1.1, sd('land-thud')), 1], [footfallSet('slither'), 0.5]]),
  footfall: footfallSet('slither'),
  'tame-settle': hiss(0.7, 3400, 2000, sd('tame-settle'), [[0, 0], [0.3, 0.6], [1, 0]]),
  'feed-chew': mix(len(0.3), [[thud(0.2, 0.6, sd('feed-chew')), 0.8], [shape(lowpass(white(len(0.2), sd('feed-wet')), 800), 0.01, 0.12), 0.5]]),
});
/** Centipedes and millipedes: dense leg ticks and rasps. */
const myriapod: Builder = (sd) => ({
  call: [mix(len(0.8), [[clicks(0.8, 24, 3200, sd('call#1')), 0.8], [stridulate({ seconds: 0.8, pulseRate: 7, pulseLen: 0.06, toothRate: 600, body: 3000, q: 6, seed: sd('call#1s') }), 0.6]]), clicks(0.9, 30, 2900, sd('call#2'))],
  alert: clicks(0.25, 10, 3500, sd('alert')),
  'attack-vocal': mix(len(0.5), [[clicks(0.5, 18, 2600, sd('attack-vocal')), 0.8], [hiss(0.5, 3000, 3000, sd('attack-h')), 0.4]]),
  hurt: clicks(0.3, 14, 3800, sd('hurt')),
  faint: fade(clicks(1.1, 16, 2400, sd('faint')), [[0, 1], [1, 0]]),
  victory: stridulate({ seconds: 1.0, pulseRate: 10, pulseLen: 0.05, toothRate: 800, body: 3300, q: 7, seed: sd('victory') }),
  'breath-idle': lowpass(clicks(1.2, 8, 2600, sd('breath-idle')), 3000),
  'land-thud': mix(len(0.25), [[thud(0.2, 0.4, sd('land-thud')), 1], [footfallSet('scuttle'), 0.5]]),
  footfall: footfallSet('scuttle'),
  'tame-settle': clicks(0.6, 6, 2800, sd('tame-settle')),
  'feed-chew': clicks(0.35, 12, 3000, sd('feed-chew')),
});
/** Jellies and starfish: soft water pulses, a stinging snap, bubbles. */
const radial: Builder = (sd) => ({
  call: [waterPulse(0.9, 1.6, sd('call#1')), waterPulse(1.0, 1.2, sd('call#2'))],
  alert: mix(len(0.3), [[waterPulse(0.3, 4, sd('alert')), 0.8], [bubbles(0.3, 30, 1, 3, sd('alert-b')), 0.5]]),
  'attack-vocal': mix(len(0.45), [[shape(highpass(white(len(0.05), sd('attack-vocal')), 2000), 0.0005, 0.04), 0.9], [whoosh(0.4, 300, 900, 500, sd('attack-w')), 0.5, len(0.03)], [bubbles(0.45, 25, 1, 3, sd('attack-b')), 0.4]]),
  hurt: mix(len(0.35), [[bubbles(0.35, 40, 1, 3, sd('hurt')), 0.8], [waterPulse(0.35, 5, sd('hurt-p')), 0.5]]),
  faint: mix(len(1.3), [[fade(waterPulse(1.3, 0.8, sd('faint')), [[0, 1], [1, 0]]), 1], [bubbles(1.3, 4, 4, 9, sd('faint-b')), 0.5]]),
  victory: mix(len(1.0), [[waterPulse(1.0, 2.4, sd('victory')), 1], [bubbles(1.0, 14, 1, 4, sd('victory-b')), 0.4]]),
  'breath-idle': waterPulse(1.4, 0.9, sd('breath-idle')),
  'land-thud': mix(len(0.3), [[footfallSet('splash'), 1], [thud(0.2, 0.4, sd('land-thud')), 0.4]]),
  footfall: footfallSet('jet'),
  'tame-settle': bubbles(0.7, 8, 2, 5, sd('tame-settle')),
  'feed-chew': mix(len(0.35), [[bubbles(0.35, 30, 1, 2.5, sd('feed-chew')), 0.8], [lowpass(thud(0.15, 0.3, sd('feed-gulp')), 700), 0.5]]),
});
/** Octopus and squid: jets, bubbles, a long exhale, beak clicks. */
const cephalopod: Builder = (sd) => ({
  call: [mix(len(0.9), [[bubbles(0.9, 14, 2, 6, sd('call#1')), 0.8], [fade(lowpass(brown(len(0.9), sd('call#1r')), 250), [[0, 0], [0.4, 1], [1, 0]]), 0.6]]), mix(len(1.0), [[whoosh(1.0, 200, 400, 300, sd('call#2')), 0.8], [bubbles(1.0, 10, 2, 5, sd('call#2b')), 0.5]])],
  alert: mix(len(0.3), [[whoosh(0.3, 300, 800, 500, sd('alert')), 1], [bubbles(0.3, 20, 1, 3, sd('alert-b')), 0.4]]),
  'attack-vocal': mix(len(0.5), [[whoosh(0.5, 250, 900, 600, sd('attack-vocal')), 1], [bubbles(0.5, 30, 1, 4, sd('attack-b')), 0.5]]),
  hurt: bubbles(0.35, 50, 1, 3, sd('hurt')),
  faint: mix(len(1.3), [[whoosh(1.3, 500, 180, 300, sd('faint')), 1], [bubbles(1.3, 8, 3, 8, sd('faint-b')), 0.5]]),
  victory: mix(len(1.0), [[whoosh(1.0, 200, 600, 400, sd('victory')), 0.8], [bubbles(1.0, 20, 1.5, 5, sd('victory-b')), 0.6]]),
  'breath-idle': mix(len(1.4), [[gate(lowpass(brown(len(1.4), sd('breath-idle')), 200), 0.5), 0.8], [bubbles(1.4, 4, 2, 6, sd('breath-b')), 0.4]]),
  'land-thud': mix(len(0.3), [[footfallSet('splash'), 1], [thud(0.25, 0.8, sd('land-thud')), 0.5]]),
  footfall: footfallSet('jet'),
  'tame-settle': bubbles(0.7, 12, 1.5, 4, sd('tame-settle')),
  'feed-chew': mix(len(0.3), [[clicks(0.3, 4, 1600, sd('feed-chew')), 0.8], [bubbles(0.3, 16, 1, 3, sd('feed-b')), 0.5]]),
});
/** Bats and membrane fliers: chitters of short downward sweeps, a screech, wingbeats. */
const flyer: Builder = (sd) => {
  const chitter = (seconds: number, count: number, from: number, to: number, seed: number): Float32Array => series(seconds, Array.from({ length: count }, (_, k) => { const f = from + (to - from) * (k / Math.max(1, count - 1));
    return syrinx({ seconds: 0.03, f: [[0, f], [1, f * 0.62]], breath: 0.3, harmonics: [1, 0.3], seed: seed + k }); }));
  return {
    call: [chitter(0.8, 10, 4200, 3800, sd('call#1')), chitter(0.9, 14, 4600, 3600, sd('call#2'))],
    alert: syrinx({ seconds: 0.15, f: [[0, 4800], [1, 3600]], breath: 0.3, seed: sd('alert') }),
    'attack-vocal': syrinx({ seconds: 0.5, f: [[0, 3400], [0.4, 3900], [1, 2800]], trillHz: 70, trillDepth: 0.08, harmonics: [1, 0.6, 0.4], breath: 0.5, seed: sd('attack-vocal') }),
    hurt: syrinx({ seconds: 0.35, f: [[0, 4200], [0.4, 5200], [1, 3000]], breath: 0.4, seed: sd('hurt') }),
    faint: fade(chitter(1.2, 8, 3800, 1800, sd('faint')), [[0, 1], [1, 0.1]]),
    victory: chitter(1.0, 18, 3600, 4800, sd('victory')),
    'breath-idle': breathing(1.0, 2.2, [F(2400, 400, 1), F(4200, 500, 0.4)], sd('breath-idle')),
    'land-thud': mix(len(0.25), [[footfallSet('wingbeat'), 1], [thud(0.15, 0.3, sd('land-thud')), 0.5]]),
    footfall: footfallSet('wingbeat'),
    'tame-settle': fade(chitter(0.7, 5, 3200, 3000, sd('tame-settle')), [[0, 0.6], [1, 0.4]]),
    'feed-chew': clicks(0.35, 10, 2600, sd('feed-chew')),
  };
};
/** Crabs: claw clacks, a pincer snap, bubbling froth, scuttling. */
const brachyuran: Builder = (sd) => ({
  call: [mix(len(0.8), [[froth(0.8, 60, sd('call#1')), 0.8], [clicks(0.8, 4, 2000, sd('call#1c')), 0.6]]), mix(len(0.9), [[froth(0.9, 45, sd('call#2')), 0.7], [clack(sd('call#2a')), 0.8, len(0.2)], [clack(sd('call#2b')), 0.8, len(0.3)]])],
  alert: mix(len(0.2), [[clack(sd('alert')), 1], [clack(sd('alert2'), 2250), 0.9, len(0.08)]]),
  'attack-vocal': mix(len(0.3), [[modal(0.25, 1800, [{ ratio: 1, decay: 0.04, amp: 1 }, { ratio: 2.9, decay: 0.025, amp: 0.6 }, { ratio: 5.1, decay: 0.012, amp: 0.3 }], 1.2, sd('attack-vocal')), 1], [thud(0.2, 0.5, sd('attack-body')), 0.6], [froth(0.3, 40, sd('attack-f')), 0.3]]),
  hurt: mix(len(0.35), [[froth(0.35, 90, sd('hurt')), 0.8], [clicks(0.35, 5, 2600, sd('hurt-c')), 0.6]]),
  faint: mix(len(1.2), [[fade(froth(1.2, 30, sd('faint')), [[0, 1], [1, 0]]), 1], [clicks(1.2, 4, 1800, sd('faint-c')), 0.4]]),
  victory: clicks(1.0, 12, 2100, sd('victory')),
  'breath-idle': fade(froth(1.3, 20, sd('breath-idle')), [[0, 0.4], [0.5, 1], [1, 0.4]]),
  'land-thud': mix(len(0.25), [[thud(0.2, 0.6, sd('land-thud')), 1], [clicks(0.1, 3, 2400, sd('land-c')), 0.5]]),
  footfall: footfallSet('scuttle'),
  'tame-settle': clicks(0.6, 4, 1900, sd('tame-settle')),
  'feed-chew': mix(len(0.35), [[clicks(0.35, 8, 2400, sd('feed-chew')), 0.8], [froth(0.35, 50, sd('feed-f')), 0.4]]),
});

const BUILDERS: Readonly<Record<string, Builder>> = Object.freeze({
  quadruped, hopper, 'biped-bird': bird, fish, insect, arachnid, serpent, myriapod, radial, cephalopod, 'flyer-membrane': flyer, primate, brachyuran,
});
/** Archetypes that have ORIGINAL sources today; the rest still draw from the labelled placeholder until their set lands. */
export const ORIGINAL_ARCHETYPES: readonly string[] = Object.freeze(Object.keys(BUILDERS));

function buildSet(archetype: string): SourceSet {
  const b = BUILDERS[archetype]; if (!b) throw new RangeError(`no original source set for ${archetype}`);
  return Object.freeze({ ...shared(), ...b((key) => sourceSeedV1(archetype, key)) });
}

export interface OriginalSourceLibrary { readonly generator: typeof ORIGINAL_SOURCE_GENERATOR; readonly rights: typeof ORIGINAL_SOURCE_RIGHTS; readonly original: readonly string[]; readonly sources: SourceLibrary }
/** The library the player hears: an ORIGINAL set for every archetype in ORIGINAL_ARCHETYPES and, until the rest land, the labelled
 *  placeholder set for the others (listed in `original` so the Listening page and tests can tell them apart). Lazy per archetype. */
export function originalSourceLibraryV1(): OriginalSourceLibrary {
  const sources: Record<string, SourceSet> = {}, cache = new Map<string, SourceSet>(); let placeholder: SourceLibrary | null = null;
  for (const a of VOICE_ARCHETYPES) Object.defineProperty(sources, a, { enumerable: true, get: () => {
    let v = cache.get(a); if (v) return v;
    v = BUILDERS[a] ? buildSet(a) : (placeholder ??= synthesizePlaceholderLibrary().sources)[a]!; cache.set(a, v); return v; } });
  return Object.freeze({ generator: ORIGINAL_SOURCE_GENERATOR, rights: ORIGINAL_SOURCE_RIGHTS, original: ORIGINAL_ARCHETYPES, sources: Object.freeze(sources) });
}
const bytes = (x: Float32Array): Uint8Array => new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
export interface SourceManifestRowV1 { readonly archetype: string; readonly key: string; readonly take: number; readonly seed: number; readonly samples: number; readonly sha256: string }
/** Provenance: every original source's seed and output hash (the AUDIO_LICENSES.md rows are generated from this). */
export function originalSourceManifestV1(archetypes: readonly string[] = ORIGINAL_ARCHETYPES): readonly SourceManifestRowV1[] {
  const rows: SourceManifestRowV1[] = [];
  for (const a of archetypes) { const set = buildSet(a);
    for (const key of Object.keys(set).sort()) { if (key === 'footfall') continue; // an alias of one shared footfall set (its row is that set's)
      const v = set[key]!, takes = v instanceof Float32Array ? [v] : v, owner = key.startsWith('footfall:') || key.startsWith('texture:') ? SHARED : a;
      takes.forEach((x, i) => rows.push(Object.freeze({ archetype: owner, key, take: i, seed: sourceSeedV1(owner, key), samples: x.length, sha256: sha256Hex(bytes(x)) }))); } }
  const seen = new Set<string>(); return Object.freeze(rows.filter((r) => { const k = `${r.archetype}/${r.key}/${r.take}`; if (seen.has(k)) return false; seen.add(k); return true; }));
}
