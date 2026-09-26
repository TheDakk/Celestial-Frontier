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
  bowed, breathTone, brown, bubbles, clicks, curve, drum, glottal, hiss, len, lowpass, highpass, mallet, mix, mixInto, modal, mulCurve,
  normalize, pink, pluck, resonate, saturate, shape, stridulate, thud, whoosh, white,
} from './organic.js';
import { VOICE_MATERIALS, type VoiceMaterial } from './voice-card.js';

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
const crackle = (seconds: number, perSecond: number, seed: number): Float32Array => normalize(clicks(seconds, Math.max(2, Math.round(seconds * perSecond)), 2800, seed), 0.8);
const THEMES: Readonly<Partial<Record<AbilityTheme, Readonly<Record<AbilityPhase, Phase>>>>> = Object.freeze({
  // wild: snarl, rush, rake
  wild: {
    launch: (sd) => glottal({ seconds: 0.4, f0: [[0, 110], [0.5, 150], [1, 100]], formants: [{ f: 560, bw: 110, g: 1 }, { f: 1250, bw: 140, g: 0.6 }, { f: 2500, bw: 220, g: 0.3 }], open: 0.42, sub: 0.9, rough: 0.8, breath: 0.4, attack: 0.008, release: 0.12, seed: sd }),
    travel: (sd) => mix(len(0.45), [[whoosh(0.45, 400, 1200, 700, sd), 1], [shape(highpass(pink(len(0.4), sd ^ 1), 1800), 0.05, 0.2), 0.35]]),
    impact: (sd) => { const y = new Float32Array(len(0.5)); for (let k = 0; k < 3; k++) mixInto(y, shape(resonate(white(len(0.09), sd + k), 3200 - k * 400, 1600), 0.002, 0.07), 0.8, len(k * 0.07)); mixInto(y, thud(0.35, 0.9, sd ^ 9), 0.6); return y; },
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
void breathTone; void stridulate; void curve; void VOICE_MATERIALS; void crackle;
