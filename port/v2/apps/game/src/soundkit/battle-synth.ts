/* PLACEHOLDER battle and ability cue synthesis: labelled, never shippable (Sound Kit §4 says these are
   recorded elemental materials and a recorded battle set, C3). Until those sources exist, every
   ability:<theme>:<phase> and battle:<cue> id renders through one pure, seed-driven DSP recipe so the
   turn can be HEARD with its beats. Deterministic: identical (cueId, seed, amount) → identical bytes.
   Each theme's three phases follow the §4 material words (fire: ignition, roar, scorch; frost: crackle,
   hiss, shatter; …) as filter/tone shapes, so the themes are distinguishable by ear. */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { ABILITY_PHASES, ABILITY_THEMES, BATTLE_CUES, parseCueId, type AbilityPhase, type AbilityTheme } from './cues.js';
import { sha256Hex, stableJson } from './derive.js';
import { SAMPLE_RATE, biquad, envelope, mixLayers, normalizePeak, onePole, type BiquadSpec } from './dsp.js';

export const BATTLE_SYNTH_LABEL = 'placeholder-synthesized-not-a-recording' as const;
export const IMPACT_MAX_SECONDS = 0.6;   /* kit §6: impacts under 600 ms */
export const CUE_MAX_SECONDS = 1.4;
const PEAK = 0.891; /* -1 dBTP */

export interface SynthCue {
  readonly cueId: string; readonly sampleRate: typeof SAMPLE_RATE; readonly samples: Float32Array;
  readonly recipeHash: string; readonly flags: readonly string[]; readonly placeholder: true; readonly shippable: false;
}

interface Recipe {
  readonly s: number;                       /* seconds */
  readonly noise?: { readonly f: BiquadSpec | { readonly lp: number } | { readonly hp: number }; readonly gain: number; readonly grains?: number };
  readonly tone?: { readonly hz: number; readonly to?: number; readonly gain: number; readonly harmonics?: number; readonly decay?: number };
  readonly attack: number; readonly release: number;
  readonly reverse?: boolean;               /* void inhale: envelope grows into the cut */
}
const bp = (f0: number, q: number): BiquadSpec => ({ kind: 'bandpass', f0, q });
const R = (r: Recipe): Recipe => Object.freeze(r);

/** §4 materials as shapes. launch / travel / impact. */
const THEME_RECIPES: Readonly<Record<AbilityTheme, Readonly<Record<AbilityPhase, Recipe>>>> = Object.freeze({
  fire: { launch: R({ s: 0.35, noise: { f: { hp: 1800 }, gain: 0.6, grains: 6 }, tone: { hz: 90, to: 160, gain: 0.5 }, attack: 0.004, release: 0.2 }), travel: R({ s: 0.5, noise: { f: { lp: 900 }, gain: 1 }, attack: 0.05, release: 0.3 }), impact: R({ s: 0.5, noise: { f: { lp: 2400 }, gain: 0.8, grains: 4 }, tone: { hz: 70, to: 40, gain: 0.7 }, attack: 0.002, release: 0.4 }) },
  frost: { launch: R({ s: 0.4, noise: { f: bp(5200, 6), gain: 1, grains: 14 }, attack: 0.002, release: 0.2 }), travel: R({ s: 0.45, noise: { f: { hp: 3500 }, gain: 1 }, attack: 0.03, release: 0.3 }), impact: R({ s: 0.55, noise: { f: bp(6400, 4), gain: 0.9, grains: 10 }, tone: { hz: 1800, to: 900, gain: 0.4, decay: 12 }, attack: 0.001, release: 0.45 }) },
  storm: { launch: R({ s: 0.5, tone: { hz: 120, to: 480, gain: 0.7, harmonics: 3 }, noise: { f: { hp: 4000 }, gain: 0.3 }, attack: 0.05, release: 0.2 }), travel: R({ s: 0.18, noise: { f: { hp: 1200 }, gain: 1 }, attack: 0.0005, release: 0.12 }), impact: R({ s: 0.6, noise: { f: { lp: 260 }, gain: 1 }, tone: { hz: 48, to: 30, gain: 0.6 }, attack: 0.003, release: 0.5 }) },
  tide: { launch: R({ s: 0.45, noise: { f: { lp: 1400 }, gain: 1 }, attack: 0.2, release: 0.2 }), travel: R({ s: 0.5, noise: { f: bp(900, 1.2), gain: 1 }, attack: 0.08, release: 0.3 }), impact: R({ s: 0.45, noise: { f: { lp: 3200 }, gain: 1, grains: 3 }, tone: { hz: 140, to: 80, gain: 0.3 }, attack: 0.002, release: 0.35 }) },
  stone: { launch: R({ s: 0.4, noise: { f: bp(420, 3), gain: 1 }, attack: 0.02, release: 0.3 }), travel: R({ s: 0.5, noise: { f: bp(260, 2), gain: 1, grains: 8 }, attack: 0.01, release: 0.3 }), impact: R({ s: 0.5, noise: { f: { lp: 700 }, gain: 1, grains: 5 }, tone: { hz: 60, to: 35, gain: 0.8 }, attack: 0.001, release: 0.4 }) },
  venom: { launch: R({ s: 0.4, noise: { f: { hp: 2600 }, gain: 1 }, attack: 0.01, release: 0.3 }), travel: R({ s: 0.4, noise: { f: bp(3200, 2), gain: 1, grains: 12 }, attack: 0.005, release: 0.25 }), impact: R({ s: 0.55, noise: { f: bp(4200, 3), gain: 1, grains: 20 }, attack: 0.002, release: 0.45 }) },
  void: { launch: R({ s: 0.5, noise: { f: { lp: 600 }, gain: 1 }, tone: { hz: 55, gain: 0.5 }, attack: 0.4, release: 0.05, reverse: true }), travel: R({ s: 0.4, noise: { f: bp(1500, 1.5), gain: 1 }, attack: 0.01, release: 0.3 }), impact: R({ s: 0.55, tone: { hz: 200, to: 28, gain: 0.9, harmonics: 2 }, noise: { f: { lp: 400 }, gain: 0.6 }, attack: 0.002, release: 0.45 }) },
  sand: { launch: R({ s: 0.35, noise: { f: bp(2000, 1.2), gain: 1 }, attack: 0.02, release: 0.25 }), travel: R({ s: 0.5, noise: { f: { hp: 1500 }, gain: 1 }, attack: 0.05, release: 0.3 }), impact: R({ s: 0.45, noise: { f: bp(1800, 1.5), gain: 1, grains: 30 }, attack: 0.002, release: 0.35 }) },
  chem: { launch: R({ s: 0.45, noise: { f: { hp: 5000 }, gain: 1, grains: 40 }, attack: 0.01, release: 0.3 }), travel: R({ s: 0.4, noise: { f: bp(2800, 2), gain: 1 }, attack: 0.02, release: 0.25 }), impact: R({ s: 0.55, noise: { f: bp(3600, 1.5), gain: 1, grains: 60 }, tone: { hz: 420, to: 260, gain: 0.2 }, attack: 0.003, release: 0.45 }) },
  psionic: { launch: R({ s: 0.6, tone: { hz: 220, gain: 0.8, harmonics: 4 }, attack: 0.15, release: 0.3 }), travel: R({ s: 0.5, tone: { hz: 330, to: 440, gain: 0.7, harmonics: 2 }, attack: 0.1, release: 0.3 }), impact: R({ s: 0.35, tone: { hz: 880, to: 1760, gain: 0.8, decay: 10 }, noise: { f: { hp: 6000 }, gain: 0.2 }, attack: 0.001, release: 0.25 }) },
  wild: { launch: R({ s: 0.45, noise: { f: bp(700, 2), gain: 0.8 }, tone: { hz: 150, to: 110, gain: 0.5, harmonics: 3 }, attack: 0.01, release: 0.3 }), travel: R({ s: 0.3, noise: { f: bp(1200, 1), gain: 1 }, attack: 0.02, release: 0.2 }), impact: R({ s: 0.4, noise: { f: bp(2600, 2), gain: 1, grains: 5 }, tone: { hz: 90, to: 60, gain: 0.5 }, attack: 0.002, release: 0.3 }) },
});
const BATTLE_RECIPES: Readonly<Record<string, Recipe>> = Object.freeze({
  'turn-ready': R({ s: 0.25, tone: { hz: 660, to: 880, gain: 0.8, decay: 8 }, attack: 0.002, release: 0.15 }),
  cursor: R({ s: 0.08, tone: { hz: 1320, gain: 0.7, decay: 30 }, attack: 0.001, release: 0.05 }),
  confirm: R({ s: 0.14, tone: { hz: 990, to: 1320, gain: 0.8, decay: 14 }, attack: 0.001, release: 0.08 }),
  cancel: R({ s: 0.14, tone: { hz: 660, to: 440, gain: 0.8, decay: 14 }, attack: 0.001, release: 0.08 }),
  'approach-start': R({ s: 0.3, noise: { f: bp(1100, 1), gain: 1 }, attack: 0.05, release: 0.2 }),
  'hitstop-thump': R({ s: 0.22, tone: { hz: 80, to: 40, gain: 1, decay: 10 }, noise: { f: { lp: 300 }, gain: 0.4 }, attack: 0.001, release: 0.15 }),
  'flash-sting': R({ s: 0.18, tone: { hz: 2200, to: 1600, gain: 0.7, decay: 16 }, noise: { f: { hp: 5000 }, gain: 0.3 }, attack: 0.0005, release: 0.12 }),
  'shake-rumble': R({ s: 0.18, noise: { f: { lp: 120 }, gain: 1 }, attack: 0.005, release: 0.14 }),
  'damage-tick': R({ s: 0.12, tone: { hz: 440, gain: 0.8, decay: 18 }, attack: 0.001, release: 0.08 }),
  'miss-whiff': R({ s: 0.25, noise: { f: bp(1600, 0.8), gain: 1 }, attack: 0.03, release: 0.18 }),
  'dodge-swish': R({ s: 0.22, noise: { f: bp(2400, 1), gain: 1 }, attack: 0.02, release: 0.16 }),
  'faint-fall': R({ s: 0.5, tone: { hz: 100, to: 45, gain: 0.8 }, noise: { f: { lp: 500 }, gain: 0.6 }, attack: 0.002, release: 0.4 }),
  'victory-sting': R({ s: 0.9, tone: { hz: 523, to: 1046, gain: 0.8, harmonics: 3 }, attack: 0.01, release: 0.5 }),
  'defeat-sting': R({ s: 0.9, tone: { hz: 392, to: 196, gain: 0.8, harmonics: 3 }, attack: 0.01, release: 0.5 }),
  'battle-start': R({ s: 0.6, tone: { hz: 220, to: 440, gain: 0.8, harmonics: 3 }, noise: { f: { lp: 800 }, gain: 0.3 }, attack: 0.02, release: 0.3 }),
  'battle-end': R({ s: 0.8, tone: { hz: 440, to: 220, gain: 0.8, harmonics: 2 }, attack: 0.05, release: 0.5 }),
});

function noise(n: number, seed: number): Float32Array { const rng = mulberry32(seed), y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = rng() * 2 - 1; return y; }
function toneOf(n: number, t: NonNullable<Recipe['tone']>): Float32Array {
  const y = new Float32Array(n), h = t.harmonics ?? 1, decay = t.decay ?? 3, to = t.to ?? t.hz;
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n, hz = t.hz * Math.pow(to / t.hz, u);
    phase += (2 * Math.PI * hz) / SAMPLE_RATE;
    let v = 0; for (let k = 1; k <= h; k++) v += Math.sin(phase * k) / k;
    y[i] = v * Math.exp(-decay * u) * t.gain;
  }
  return y;
}
function filtered(x: Float32Array, f: NonNullable<Recipe['noise']>['f']): Float32Array {
  if ('lp' in f) return onePole(x, f.lp, 'lowpass');
  if ('hp' in f) return onePole(x, f.hp, 'highpass');
  return biquad(x, f);
}
function grains(n: number, count: number, rng: () => number, seed: number): Float32Array {
  /* crackle / grit: `count` short bursts scattered over the cue, each 6..24 ms */
  const y = new Float32Array(n);
  for (let g = 0; g < count; g++) {
    const len = Math.round((0.006 + rng() * 0.018) * SAMPLE_RATE), at = Math.floor(rng() * Math.max(1, n - len)), burst = envelope(noise(len, hashInt(seed, g, 0x6a)), 0.0005, len / SAMPLE_RATE * 0.5), gain = 0.5 + rng() * 0.5;
    for (let i = 0; i < len && at + i < n; i++) y[at + i] = (y[at + i] ?? 0) + (burst[i] ?? 0) * gain;
  }
  return y;
}

function render(recipe: Recipe, seed: number): Float32Array {
  const n = Math.round(recipe.s * SAMPLE_RATE), rng = mulberry32(seed), layers = [];
  if (recipe.noise) {
    const base = recipe.noise.grains ? mixLayers([{ samples: noise(n, seed ^ 0x11), gain: 0.35 }, { samples: grains(n, recipe.noise.grains, rng, seed), gain: 1 }], n) : noise(n, seed ^ 0x11);
    layers.push({ samples: filtered(base, recipe.noise.f), gain: recipe.noise.gain });
  }
  if (recipe.tone) layers.push({ samples: toneOf(n, recipe.tone), gain: 1 });
  let out = envelope(mixLayers(layers, n), recipe.attack, recipe.release);
  if (recipe.reverse) out = Float32Array.from(out, (_, i) => out[n - 1 - i] ?? 0);
  return normalizePeak(out, PEAK);
}

/** Synthesize one `ability:<theme>:<phase>` or `battle:<cue>` id. Creature cues belong to deriveCue and are refused here. */
export function synthesizeBattleCue(cueId: string, seed: number, options: { readonly amount?: number } = {}): SynthCue {
  const cue = parseCueId(cueId);
  if (cue === null) throw new RangeError(`sound kit cue id is outside the closed vocabulary: ${String(cueId)}`);
  let recipe: Recipe, amount = 0;
  if (cue.group === 'ability') {
    const [theme, phase] = cue.key.split(':') as [AbilityTheme, AbilityPhase];
    if (!ABILITY_THEMES.includes(theme) || !ABILITY_PHASES.includes(phase)) throw new RangeError(`ability cue ${cueId} names no theme/phase`);
    recipe = THEME_RECIPES[theme][phase];
  } else if (cue.group === 'battle') {
    if (!BATTLE_CUES.includes(cue.key as typeof BATTLE_CUES[number])) throw new RangeError(`battle cue ${cueId} is not in the set`);
    recipe = BATTLE_RECIPES[cue.key]!;
    if (cue.key === 'damage-tick') { amount = Math.max(0, Math.min(200, Math.round(options.amount ?? 0))); recipe = { ...recipe, tone: { ...recipe.tone!, hz: 440 * Math.pow(2, amount / 120) } }; }
  } else throw new RangeError(`synthesizeBattleCue renders ability and battle cues only; got ${cueId} (${cue.group})`);
  const cap = cue.impact ? IMPACT_MAX_SECONDS : CUE_MAX_SECONDS;
  if (recipe.s > cap) throw new RangeError(`recipe for ${cueId} is ${recipe.s}s, over the ${cap}s cap`);
  const recipeSeed = hashInt(seed >>> 0, cueId.length * 131 + amount, cue.key.charCodeAt(0));
  const samples = render(recipe, recipeSeed);
  const recipeHash = sha256Hex(new TextEncoder().encode(stableJson({ cueId, seed: seed >>> 0, amount, recipe })));
  return Object.freeze({ cueId, sampleRate: SAMPLE_RATE, samples, recipeHash, flags: Object.freeze([BATTLE_SYNTH_LABEL]), placeholder: true, shippable: false });
}
export const BATTLE_SYNTH_CUE_IDS: readonly string[] = Object.freeze([
  ...ABILITY_THEMES.flatMap((t) => ABILITY_PHASES.map((p) => `ability:${t}:${p}`)),
  ...BATTLE_CUES.map((c) => `battle:${c}`),
]);
