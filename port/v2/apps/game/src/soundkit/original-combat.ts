/* @module soundkit/original-combat [domain] — the ORIGINAL battle set, ability themes and material impact tails (D15, Claude 2026-09-26).
   The kit's words are the recipes: battle cues are "quiet, wooden and crisp" (struck wood, a plucked string for the stings, air for the
   whiffs), an impact is "a transient, a body thud scaled by mass, and a material tail", and each ability theme is "elemental materials
   heard up close, with a launch, a travel and an impact". Rendered from `organic.ts` by a fixed seed, levelled to the combat target
   (−14 LUFS short-term, ≤ −1 dBTP). Same call shape as the placeholder `synthesizeBattleCue`, so the turn sink swaps without change;
   a theme without an original set yet falls back to the labelled placeholder and says so in its flags. */
import { hashInt } from '@cf/domain-rand';
import { ABILITY_PHASES, ABILITY_THEMES, BATTLE_CUES, parseCueId, type AbilityPhase, type AbilityTheme } from './cues.js';
import { IMPACT_MAX_SECONDS, CUE_MAX_SECONDS, synthesizeBattleCue } from './battle-synth.js';
import { sha256Hex, stableJson } from './derive.js';
import { SAMPLE_RATE } from './dsp.js';
import { limitToLoudnessV1 } from './loudness.js';
import {
  bowed, breathTone, brown, bubbles, clicks, drum, glottal, hiss, len, lowpass, highpass, mallet, mix, mixInto, modal, mulCurve,
  normalize, pink, pluck, resonate, saturate, shape, sweepLowpass, thud, whoosh, white,
} from './organic.js';
import type { VoiceMaterial } from './voice-card.js';

export const ORIGINAL_COMBAT_GENERATOR = 'cf-soundkit-original-combat-v1' as const;
export interface RenderedCombatCue { readonly cueId: string; readonly sampleRate: typeof SAMPLE_RATE; readonly samples: Float32Array; readonly recipeHash: string; readonly flags: readonly string[]; readonly original: boolean }

const hz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);
const wood = (seconds: number, f0: number, seed: number): Float32Array => modal(seconds, f0, [{ ratio: 1, decay: 0.05, amp: 1 }, { ratio: 2.45, decay: 0.03, amp: 0.45 }, { ratio: 4.6, decay: 0.015, amp: 0.2 }], 0.5, seed);
function arpeggio(notes: readonly number[], stepS: number, seconds: number, seed: number, decay = 1.2): Float32Array {
  const n = len(seconds), y = new Float32Array(n); notes.forEach((m, i) => mixInto(y, pluck(seconds - i * stepS, hz(m), decay, 0.55, seed + i), 0.7, len(i * stepS))); return y;
}

/* ---------- the battle set ---------- */
const BATTLE: Readonly<Record<string, (seed: number, amount: number) => Float32Array>> = Object.freeze({
  'turn-ready': (sd) => mix(len(0.3), [[wood(0.15, 720, sd), 1], [wood(0.15, 960, sd ^ 1), 0.8, len(0.12)]]),
  cursor: (sd) => wood(0.07, 1650, sd),
  confirm: (sd) => mix(len(0.25), [[wood(0.12, 820, sd), 0.9], [wood(0.14, 1095, sd ^ 1), 1, len(0.08)]]),
  cancel: (sd) => lowpass(mix(len(0.25), [[wood(0.13, 620, sd), 1], [wood(0.13, 465, sd ^ 1), 0.8, len(0.08)]]), 1800),
  'approach-start': (sd) => whoosh(0.35, 300, 950, 500, sd),
  'hitstop-thump': (sd) => mix(len(0.4), [[thud(0.4, 1.2, sd), 1], [shape(highpass(white(len(0.012), sd ^ 2), 1500), 0.0003, 0.01), 0.7]]),
  'flash-sting': (sd) => mix(len(0.45), [[modal(0.45, 1480, [{ ratio: 1, decay: 0.2, amp: 1 }, { ratio: 2.76, decay: 0.12, amp: 0.4 }, { ratio: 5.4, decay: 0.06, amp: 0.2 }], 0.3, sd), 0.7], [hiss(0.25, 6000, 5000, sd ^ 3, [[0, 1], [1, 0]]), 0.25]]),
  'shake-rumble': (sd) => { const n = len(0.55), r = lowpass(brown(n, sd), 140); return mulCurve(r, Float32Array.from({ length: n }, (_, i) => (0.6 + 0.4 * Math.sin(i / 300)) * Math.exp(-i / (0.18 * SAMPLE_RATE)))); },
  'damage-tick': (sd, amount) => mallet(0.3, 440 * Math.pow(2, amount / 120), sd),
  'miss-whiff': (sd) => whoosh(0.24, 900, 1900, 900, sd),
  'dodge-swish': (sd) => mix(len(0.34), [[whoosh(0.3, 1500, 480, 700, sd), 1], [shape(highpass(pink(len(0.12), sd ^ 4), 2500), 0.01, 0.08), 0.3, len(0.08)]]),
  'faint-fall': (sd) => mix(len(0.6), [[thud(0.5, 1.6, sd), 1], [shape(resonate(white(len(0.4), sd ^ 5), 900, 900), 0.02, 0.3), 0.4, len(0.08)]]),
  'victory-sting': (sd) => arpeggio([62, 66, 69, 74], 0.09, 1.3, sd),
  'defeat-sting': (sd) => lowpass(arpeggio([57, 53, 50], 0.16, 1.3, sd, 1.6), 2200),
  'battle-start': (sd) => mix(len(1.1), [[drum(0.8, 72, sd, 0.3), 1], [pluck(1.0, hz(45), 1.4, 0.4, sd ^ 6), 0.6], [pluck(1.0, hz(52), 1.4, 0.4, sd ^ 7), 0.45, len(0.02)]]),
  'battle-end': (sd) => mix(len(1.3), [[arpeggio([57, 61, 64, 69], 0.07, 1.3, sd, 1.8), 0.9], [bowed(1.3, hz(45), sd ^ 8), 0.25]]),
});

/* ---------- the ability themes (launch, travel, impact) ---------- */
type Phase = (seed: number) => Float32Array;
/** A lowpass whose cutoff sweeps from `from` to `to` Hz across the sound (ignitions, draws, rushes). */
const sweepLow = (x: Float32Array, from: number, to: number): Float32Array => sweepLowpass(x, (i) => from * Math.pow(to / from, i / x.length));
/** Irregular amplitude flicker at about `hz` (flame tongues, grinding, tearing). */
const flicker = (x: Float32Array, hz: number, seed: number): Float32Array => { const r = lowpass(white(x.length, seed), hz); let p = 0; for (let i = 0; i < r.length; i++) p = Math.max(p, Math.abs(r[i]!)); return mulCurve(x, Float32Array.from(r, (v) => 0.35 + 0.65 * Math.abs(v) / (p || 1))); };
const reverse = (x: Float32Array): Float32Array => Float32Array.from(x, (_, i) => x[x.length - 1 - i]!);
const crackle = (seconds: number, perSecond: number, seed: number): Float32Array => normalize(clicks(seconds, Math.max(2, Math.round(seconds * perSecond)), 2800, seed), 0.8);
const THEMES: Readonly<Partial<Record<AbilityTheme, Readonly<Record<AbilityPhase, Phase>>>>> = Object.freeze({
  // wild: snarl, rush, rake
  wild: {
    launch: (sd) => glottal({ seconds: 0.4, f0: [[0, 110], [0.5, 150], [1, 100]], formants: [{ f: 560, bw: 110, g: 1 }, { f: 1250, bw: 140, g: 0.6 }, { f: 2500, bw: 220, g: 0.3 }], open: 0.42, sub: 0.9, rough: 0.8, breath: 0.4, attack: 0.008, release: 0.12, seed: sd }),
    travel: (sd) => mix(len(0.45), [[whoosh(0.45, 400, 1200, 700, sd), 1], [shape(highpass(pink(len(0.4), sd ^ 1), 1800), 0.05, 0.2), 0.35]]),
    impact: (sd) => { const y = new Float32Array(len(0.5)); for (let k = 0; k < 3; k++) mixInto(y, shape(resonate(white(len(0.09), sd + k), 3200 - k * 400, 1600), 0.002, 0.07), 0.8, len(k * 0.07)); mixInto(y, thud(0.35, 0.9, sd ^ 9), 0.6); return y; },
  },
  // fire: ignition, roar, scorch
  fire: {
    launch: (sd) => mix(len(0.45), [[shape(sweepLow(pink(len(0.45), sd), 200, 2200), 0.03, 0.2), 1], [crackle(0.45, 30, sd ^ 1), 0.35]]),
    travel: (sd) => mix(len(0.55), [[flicker(resonate(brown(len(0.55), sd), 320, 400), 11, sd ^ 2), 1], [crackle(0.55, 24, sd ^ 3), 0.3]]),
    impact: (sd) => mix(len(0.55), [[thud(0.35, 1, sd), 0.7], [crackle(0.55, 60, sd ^ 4), 0.6], [hiss(0.5, 3800, 3000, sd ^ 5, [[0, 1], [0.3, 0.6], [1, 0]]), 0.45]]),
  },
  // frost: crackle, hiss, shatter
  frost: {
    launch: (sd) => mix(len(0.4), [[clicks(0.4, 22, 4800, sd), 0.9], [hiss(0.4, 6500, 5000, sd ^ 1, [[0, 0], [0.2, 0.4], [1, 0]]), 0.3]]),
    travel: (sd) => hiss(0.45, 7000, 5500, sd, [[0, 0], [0.3, 1], [1, 0]]),
    impact: (sd) => mix(len(0.55), [[modal(0.55, 2100, [{ ratio: 1, decay: 0.22, amp: 1 }, { ratio: 2.32, decay: 0.18, amp: 0.8 }, { ratio: 3.9, decay: 0.12, amp: 0.6 }, { ratio: 6.1, decay: 0.08, amp: 0.4 }], 0.8, sd), 0.8], [clicks(0.5, 20, 4200, sd ^ 2), 0.6]]),
  },
  // storm: charge, crack, thunder
  storm: {
    launch: (sd) => mix(len(0.5), [[crackle(0.5, 50, sd), 0.5], [shape(sweepLow(white(len(0.5), sd ^ 1), 500, 5000), 0.3, 0.05), 0.6]]),
    travel: (sd) => mix(len(0.2), [[shape(highpass(white(len(0.2), sd), 1200), 0.0005, 0.18), 1], [thud(0.2, 0.4, sd ^ 2), 0.3]]),
    impact: (sd) => mix(len(0.6), [[shape(highpass(white(len(0.06), sd), 800), 0.0005, 0.05), 0.9], [shape(lowpass(brown(len(0.6), sd ^ 3), 180), 0.02, 0.45), 1, len(0.03)]]),
  },
  // tide: draw, surge, slap
  tide: {
    launch: (sd) => shape(sweepLow(pink(len(0.45), sd), 2400, 500), 0.25, 0.15),
    travel: (sd) => mix(len(0.5), [[shape(resonate(pink(len(0.5), sd), 800, 900), 0.1, 0.25), 1], [bubbles(0.5, 30, 1, 4, sd ^ 1), 0.4]]),
    impact: (sd) => mix(len(0.45), [[shape(lowpass(white(len(0.15), sd), 3000), 0.001, 0.12), 1], [bubbles(0.45, 60, 1, 5, sd ^ 1), 0.6], [thud(0.25, 0.7, sd ^ 2), 0.4]]),
  },
  // stone: grind, tumble, crunch
  stone: {
    launch: (sd) => shape(flicker(resonate(white(len(0.4), sd), 380, 300), 23, sd ^ 1), 0.05, 0.2),
    travel: (sd) => { const y = new Float32Array(len(0.5)); for (let k = 0; k < 6; k++) mixInto(y, modal(0.12, 180 + 60 * ((k * 7) % 5), [{ ratio: 1, decay: 0.05, amp: 1 }, { ratio: 2.4, decay: 0.03, amp: 0.5 }], 0.8, sd + k), 0.7, len(k * 0.07)); return y; },
    impact: (sd) => mix(len(0.5), [[thud(0.4, 1.4, sd), 0.9], [clicks(0.3, 18, 1800, sd ^ 1), 0.6], [shape(resonate(white(len(0.2), sd ^ 2), 900, 800), 0.001, 0.15), 0.5]]),
  },
  // venom: hiss, spray, sizzle
  venom: {
    launch: (sd) => hiss(0.4, 4200, 3200, sd, [[0, 0], [0.15, 1], [1, 0]]),
    travel: (sd) => mix(len(0.4), [[bubbles(0.4, 60, 0.4, 1.2, sd), 0.8], [hiss(0.4, 5200, 4000, sd ^ 1), 0.4]]),
    impact: (sd) => mix(len(0.55), [[bubbles(0.55, 110, 0.3, 1, sd), 0.8], [hiss(0.55, 6000, 5000, sd ^ 1, [[0, 1], [1, 0]]), 0.5], [thud(0.2, 0.4, sd ^ 2), 0.3]]),
  },
  // void: inhale, tear, collapse
  void: {
    launch: (sd) => reverse(shape(mix(len(0.5), [[lowpass(brown(len(0.5), sd), 500), 1], [resonate(white(len(0.5), sd ^ 1), 900, 700), 0.3]]), 0.01, 0.35)),
    travel: (sd) => flicker(highpass(white(len(0.4), sd), 1500), 38, sd ^ 1),
    impact: (sd) => mix(len(0.6), [[reverse(thud(0.3, 1.5, sd)), 0.8], [shape(lowpass(brown(len(0.4), sd ^ 1), 120), 0.005, 0.3), 1, len(0.28)]]),
  },
  // sand: rasp, rush, scour
  sand: {
    launch: (sd) => shape(flicker(resonate(white(len(0.4), sd), 2800, 2600), 45, sd ^ 1), 0.02, 0.2),
    travel: (sd) => shape(sweepLow(white(len(0.5), sd), 1200, 5500), 0.12, 0.2),
    impact: (sd) => mix(len(0.55), [[clicks(0.5, 70, 3800, sd), 0.6], [shape(highpass(white(len(0.55), sd ^ 1), 2500), 0.001, 0.4), 0.6], [thud(0.25, 0.6, sd ^ 2), 0.4]]),
  },
  // chem: fizz, spray, corrode
  chem: {
    launch: (sd) => bubbles(0.4, 140, 0.2, 0.7, sd),
    travel: (sd) => mix(len(0.4), [[hiss(0.4, 4600, 5200, sd), 0.7], [bubbles(0.4, 80, 0.3, 0.9, sd ^ 1), 0.5]]),
    impact: (sd) => mix(len(0.55), [[bubbles(0.55, 160, 0.2, 0.8, sd), 0.8], [hiss(0.55, 3400, 2600, sd ^ 1, [[0, 1], [0.4, 0.7], [1, 0]]), 0.5]]),
  },
  // psionic: hum, ripple, snap
  psionic: {
    launch: (sd) => mix(len(0.5), [[breathTone(0.5, 196, sd), 0.7], [breathTone(0.5, 197.8, sd ^ 1), 0.6]]),
    travel: (sd) => mulCurve(bowed(0.45, 294, sd), Float32Array.from({ length: len(0.45) }, (_, i) => 0.5 + 0.5 * Math.sin(i / 700))),
    impact: (sd) => mix(len(0.45), [[modal(0.4, 1320, [{ ratio: 1, decay: 0.08, amp: 1 }, { ratio: 1.5, decay: 0.06, amp: 0.5 }], 1, sd), 0.8], [whoosh(0.3, 3000, 600, 800, sd ^ 1), 0.4]]),
  },
});
/** The themes that have ORIGINAL sets today (the rest render through the labelled placeholder). */
export const ORIGINAL_THEMES: readonly AbilityTheme[] = Object.freeze(ABILITY_THEMES.filter((t) => THEMES[t] !== undefined));

/* ---------- material impact tails (layered on a hit by the target's body material) ---------- */
export function materialTailV1(material: VoiceMaterial, seed: number): Float32Array {
  switch (material) {
    case 'furred': return shape(lowpass(pink(len(0.22), seed), 900), 0.002, 0.18);
    case 'feathered': return mulCurve(shape(highpass(white(len(0.25), seed), 1500), 0.005, 0.2), Float32Array.from({ length: len(0.25) }, (_, i) => 0.5 + 0.5 * Math.sin(i / 260) ** 2));
    case 'scaled': return shape(resonate(white(len(0.2), seed), 2400, 1600), 0.002, 0.16);
    case 'slick': return mix(len(0.3), [[shape(lowpass(white(len(0.1), seed), 2200), 0.001, 0.08), 0.8], [bubbles(0.3, 40, 1, 3, seed ^ 1), 0.5]]);
    case 'chitinous': return clicks(0.2, 5, 3400, seed);
    case 'plated': return modal(0.5, 520, [{ ratio: 1, decay: 0.35, amp: 1 }, { ratio: 2.76, decay: 0.25, amp: 0.6 }, { ratio: 5.4, decay: 0.15, amp: 0.35 }], 0.6, seed);
    case 'crystalline': return modal(0.5, 1760, [{ ratio: 1, decay: 0.3, amp: 1 }, { ratio: 2.32, decay: 0.25, amp: 0.7 }, { ratio: 4.25, decay: 0.15, amp: 0.4 }], 0.3, seed);
    case 'translucent': return mix(len(0.3), [[lowpass(brown(len(0.25), seed), 600), 0.8], [bubbles(0.3, 12, 3, 7, seed ^ 2), 0.5]]);
    case 'warty': return mix(len(0.3), [[bubbles(0.3, 30, 2, 5, seed), 0.8], [shape(lowpass(white(len(0.1), seed ^ 3), 700), 0.002, 0.08), 0.4]]);
  }
}

/** An impact with the struck body's material tail layered under it (kit §2), then held to the combat target (attenuate only). */
export function withMaterialTailV1(cue: Readonly<{ samples: Float32Array; sampleRate: typeof SAMPLE_RATE }>, material: VoiceMaterial, seed: number): { readonly samples: Float32Array; readonly sampleRate: typeof SAMPLE_RATE } {
  const tail = materialTailV1(material, (hashInt(seed >>> 0, material.length, material.charCodeAt(0)) >>> 0)), n = Math.min(Math.round(IMPACT_MAX_SECONDS * cue.sampleRate), Math.max(cue.samples.length, tail.length));
  const y = new Float32Array(n); mixInto(y, cue.samples, 1); mixInto(y, normalize(tail, 0.6), 0.55, Math.round(0.004 * cue.sampleRate));
  return Object.freeze({ samples: limitToLoudnessV1(normalize(y, 0.89), cue.sampleRate, 'combat').samples, sampleRate: cue.sampleRate });
}
function fromPlaceholder(cueId: string, seed: number, amount: number, reason: string): RenderedCombatCue {
  const p = synthesizeBattleCue(cueId, seed, amount ? { amount } : {});
  return Object.freeze({ cueId, sampleRate: SAMPLE_RATE, samples: p.samples, recipeHash: p.recipeHash, flags: Object.freeze([...p.flags, reason]), original: false });
}
/** Render one `battle:<cue>` or `ability:<theme>:<phase>` id. Creature cues belong to deriveCue and are refused. */
export function renderCombatCueV1(cueId: string, seed: number, options: { readonly amount?: number } = {}): RenderedCombatCue {
  const cue = parseCueId(cueId);
  if (cue === null) throw new RangeError(`sound kit cue id is outside the closed vocabulary: ${String(cueId)}`);
  let render: ((sd: number) => Float32Array) | null = null, amount = 0;
  if (cue.group === 'battle') {
    if (!BATTLE_CUES.includes(cue.key as typeof BATTLE_CUES[number])) throw new RangeError(`battle cue ${cueId} is not in the set`);
    if (cue.key === 'damage-tick') amount = Math.max(0, Math.min(200, Math.round(options.amount ?? 0)));
    const b = BATTLE[cue.key]; if (b) render = (sd) => b(sd, amount);
  } else if (cue.group === 'ability') {
    const [theme, phase] = cue.key.split(':') as [AbilityTheme, AbilityPhase];
    if (!ABILITY_THEMES.includes(theme) || !ABILITY_PHASES.includes(phase)) throw new RangeError(`ability cue ${cueId} names no theme/phase`);
    const t = THEMES[theme]; if (!t) return fromPlaceholder(cueId, seed, 0, `original-pending:${theme}`); render = t[phase];
  } else throw new RangeError(`renderCombatCueV1 renders ability and battle cues only; got ${cueId} (${cue.group})`);
  if (!render) return fromPlaceholder(cueId, seed, amount, 'original-pending');
  const cap = cue.impact ? IMPACT_MAX_SECONDS : CUE_MAX_SECONDS, recipeSeed = hashInt(seed >>> 0, cueId.length * 131 + amount, cue.key.charCodeAt(0)) >>> 0;
  let x = render(recipeSeed);
  if (x.length > Math.round(cap * SAMPLE_RATE)) x = shape(x.subarray(0, Math.round(cap * SAMPLE_RATE)).slice(), 0, 0.04);
  // cues ATTENUATE only (a 70 ms tick must never be pushed to a 3 s window's target); beds and music use the leveler
  const out = limitToLoudnessV1(normalize(saturate(x, 1.2), 0.89), SAMPLE_RATE, 'combat').samples;
  const recipeHash = sha256Hex(new TextEncoder().encode(stableJson({ generator: ORIGINAL_COMBAT_GENERATOR, cueId, seed: seed >>> 0, amount, loudness: 'bs1770-v1' })));
  return Object.freeze({ cueId, sampleRate: SAMPLE_RATE, samples: out, recipeHash, flags: Object.freeze([ORIGINAL_COMBAT_GENERATOR]), original: true });
}
export const COMBAT_CUE_IDS_V1: readonly string[] = Object.freeze([
  ...ABILITY_THEMES.flatMap((t) => ABILITY_PHASES.map((p) => `ability:${t}:${p}`)),
  ...BATTLE_CUES.map((c) => `battle:${c}`),
]);
