/* Sound Kit derivation: deriveCue is a pure function of (voice card, cue id,
   source masters, seed). Identical recipe, identical bytes. The recipe hash is
   the SHA-256 of the stable JSON of (card, cueId, seed, source hashes). */
import { limitToLoudnessV1 } from './loudness.js';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { LocalModelSha256V1 } from '../local-model-sha256.js';
import { CREATURE_CUES, type CreatureCueId } from './cues.js';
import {
  SAMPLE_RATE, biquad, envelope, fitLength, formantShift, microVariation, mixLayers, normalizePeak,
  onePole, pitchShift, sine, timeStretch,
} from './dsp.js';
import type { VoiceCard } from './voice-card.js';

/** archetypeKey -> source key -> one master or several takes. Source keys are
 * the creature cue ids, plus optional `texture:<material>` and `footfall:<set>`. */
export type SourceSet = Readonly<Record<string, Float32Array | readonly Float32Array[]>>;
export type SourceLibrary = Readonly<Record<string, SourceSet>>;

export interface DerivedCue {
  readonly cueId: CreatureCueId;
  readonly sampleRate: typeof SAMPLE_RATE;
  readonly samples: Float32Array;
  readonly recipeHash: string;
  readonly flags: readonly string[];
}

const MAX_CREATURE_SECONDS = 2;
const CREATURE_PEAK = 0.891; /* -1 dBTP */

export function sha256Hex(bytes: Uint8Array): string { return new LocalModelSha256V1().update(bytes).digestHex(); }

/** JSON with recursively sorted object keys; Float32Array is never embedded. */
export function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(',')}}`;
}

function bytesOf(samples: Float32Array): Uint8Array {
  return new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
}

function pickTake(entry: Float32Array | readonly Float32Array[] | undefined, rng: () => number): Float32Array | null {
  if (entry === undefined) return null;
  if (entry instanceof Float32Array) return entry;
  if (entry.length === 0) return null;
  return entry[Math.floor(rng() * entry.length)] ?? null;
}

function mediumFilter(x: Float32Array, card: VoiceCard): Float32Array {
  switch (card.medium) {
    case 'aquatic': return biquad(onePole(x, 1200, 'lowpass'), { kind: 'peaking', f0: 320, q: 1.2, gainDb: 3 });
    case 'aerial': return biquad(x, { kind: 'highshelf', f0: 2400, q: 0.7, gainDb: 2.5 });
    case 'gas-giant': return biquad(onePole(x, 700, 'lowpass'), { kind: 'lowshelf', f0: 160, q: 0.7, gainDb: 4 });
    default: return x;
  }
}

export function deriveCue(card: VoiceCard, cueId: string, sources: SourceLibrary, seed: number): DerivedCue {
  if (!(CREATURE_CUES as readonly string[]).includes(cueId)) {
    throw new RangeError(`deriveCue only derives creature cues; got ${String(cueId)}`);
  }
  const cue = cueId as CreatureCueId;
  const set = sources[card.archetype];
  if (set === undefined) throw new RangeError(`no source set for archetype ${card.archetype}`);
  const recipeSeed = hashInt(seed >>> 0, card.seed | 0, cue.length);
  const rng = mulberry32(recipeSeed);
  const flags: string[] = [...card.flags];
  const used: Record<string, string> = {};
  const use = (key: string, entry: Float32Array | null): Float32Array | null => {
    if (entry !== null) used[key] = sha256Hex(bytesOf(entry));
    return entry;
  };

  const ratio = Math.pow(2, card.pitchSemitones / 12);
  const stretch = card.timePercent / 100;
  let body: Float32Array;
  if (cue === 'footfall-set') {
    const step = use(`footfall:${card.footfall}`, pickTake(set[`footfall:${card.footfall}`], rng))
      ?? use('footfall', pickTake(set.footfall, rng));
    if (step === null) throw new RangeError(`no footfall master for ${card.archetype}/${card.footfall}`);
    const steps = 4 + Math.floor(rng() * 3);
    const gapMs = 140 + Math.floor(rng() * 80);
    const one = timeStretch(step, stretch, recipeSeed);
    const layers = [];
    for (let i = 0; i < steps; i++) {
      const offset = Math.round(((i * gapMs) / 1000) * SAMPLE_RATE) + Math.floor(rng() * 240) - 120;
      layers.push({ samples: one, gain: card.thudGain * (0.8 + rng() * 0.2), offset: Math.max(0, offset) });
    }
    body = mixLayers(layers, Math.round(((steps * gapMs) / 1000) * SAMPLE_RATE) + one.length);
  } else {
    const take = use(cue, pickTake(set[cue], rng));
    if (take === null) throw new RangeError(`no ${cue} master for ${card.archetype}`);
    body = pitchShift(take, card.pitchSemitones, recipeSeed);
    body = formantShift(body, card.formantPercent);
    const cueStretch = cue === 'attack-vocal' ? stretch * (1 - card.aggression * 0.15) : stretch;
    body = timeStretch(body, cueStretch, recipeSeed ^ 0x5a5a);
    if (cue === 'attack-vocal' || cue === 'call' || cue === 'victory') {
      body = envelope(body, cue === 'attack-vocal' ? 0.004 : 0.02, 0.12 + (1 - card.aggression) * 0.2);
    }
    if (cue === 'land-thud') body = mixLayers([{ samples: body, gain: card.thudGain }], body.length);
  }

  const layers = [{ samples: body, gain: 1 }];
  const texture = use(`texture:${card.material}`, pickTake(set[`texture:${card.material}`], rng));
  if (texture !== null) {
    layers.push({ samples: fitLength(timeStretch(texture, body.length / texture.length, recipeSeed ^ 0x77), body.length), gain: 0.18 });
  } else flags.push(`texture-missing:${card.material}`);
  if (card.luminous) {
    const hz = 110 * ratio;
    if (cue === 'breath-idle' || cue === 'call') layers.push({ samples: sine(hz, body.length, 0.05), gain: 1 });
    if (cue === 'attack-vocal') layers.push({ samples: envelope(sine(hz * 2, body.length, 0.12), 0.15, 0.05), gain: 1 });
  }
  let out = mixLayers(layers, body.length);
  out = mediumFilter(out, card);
  out = microVariation(out, recipeSeed ^ 0x3c3c);
  const cap = MAX_CREATURE_SECONDS * SAMPLE_RATE;
  if (out.length > cap) { out = envelope(fitLength(out, cap), 0, 0.05); flags.push('length-capped-2s'); }
  out = normalizePeak(out, CREATURE_PEAK);
  // the MEASURED loudness gate's derivation stage (D15 Stage 0): attenuate to -14 LUFS short-term, true peak under -1 dBTP (loudness.ts)
  const limited = limitToLoudnessV1(out, SAMPLE_RATE, 'creature'); out = limited.samples;
  if (limited.gainDb < 0) flags.push(`loudness-attenuated:${limited.gainDb.toFixed(2)}dB`);

  const recipeHash = sha256Hex(new TextEncoder().encode(stableJson({ card, cueId: cue, seed: seed >>> 0, sources: used, loudness: 'bs1770-v1' })));
  return Object.freeze({ cueId: cue, sampleRate: SAMPLE_RATE, samples: out, recipeHash, flags: Object.freeze(flags) });
}
