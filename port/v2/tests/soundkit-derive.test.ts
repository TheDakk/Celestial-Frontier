import { admitLoudnessV1 } from '../apps/game/src/soundkit/loudness.js';
import { describe, expect, it, vi } from 'vitest';
import { compileVoiceCard, type VoiceCard } from '../apps/game/src/soundkit/voice-card.js';
import { deriveCue, sha256Hex, stableJson } from '../apps/game/src/soundkit/derive.js';
import { SAMPLE_RATE, pitchShift, resample, sine, timeStretch } from '../apps/game/src/soundkit/dsp.js';
import { synthesizePlaceholderQuadruped } from '../apps/game/src/soundkit/placeholder-archetype.js';

const CIVET_GENOME = {
  seed: 3212817920, kingdom: 'fauna', color: 14, form: 12, body: 13, loco: 6, trait: 14, size: 4, diet: 5,
  head: 5, limbs: 3, skin: 8, tail: 1, pattern: 0, eyes: 5, behavior: 9, habitat: 5, detail: 4, accent: 3,
  temper: 1, sense: 7, repro: 7, life: 5, metab: 4, lumin: true, gen: 0, heat: 1,
};
const RECORD = { template: { id: 'quadruped' }, identity: { seed: 3212817920, speciesVisualKey: 'civet' }, materials: { surface: 'fur' } };
const placeholder = synthesizePlaceholderQuadruped();
const bytes = (f: Float32Array): Uint8Array => new Uint8Array(f.buffer, f.byteOffset, f.byteLength);
function card(): VoiceCard {
  const r = compileVoiceCard(RECORD, CIVET_GENOME);
  if (!r.ok) throw new Error(r.reason);
  return r.card;
}
function zeroCrossings(x: Float32Array): number {
  let n = 0;
  for (let i = 1; i < x.length; i++) if ((x[i - 1] ?? 0) < 0 !== (x[i] ?? 0) < 0) n++;
  return n;
}

describe('soundkit derivation', () => {
  it('replays byte-identical output for the same card, seed and sources', () => {
    const a = deriveCue(card(), 'call', placeholder.sources, 7);
    const b = deriveCue(card(), 'call', placeholder.sources, 7);
    expect(Buffer.from(bytes(a.samples)).equals(Buffer.from(bytes(b.samples)))).toBe(true);
    expect(a.recipeHash).toBe(b.recipeHash);
    expect(a.recipeHash).toMatch(/^[0-9a-f]{64}$/u);
    expect(a.sampleRate).toBe(SAMPLE_RATE);
  });

  it('different seeds give different bytes and different recipe hashes', () => {
    const a = deriveCue(card(), 'call', placeholder.sources, 7);
    const b = deriveCue(card(), 'call', placeholder.sources, 8);
    expect(a.samples.length).toBe(b.samples.length);
    expect(Buffer.from(bytes(a.samples)).equals(Buffer.from(bytes(b.samples)))).toBe(false);
    expect(a.recipeHash).not.toBe(b.recipeHash);
  });

  it('recipe hash tracks the source bytes', () => {
    const altered = new Float32Array(placeholder.sources.quadruped?.hurt as Float32Array);
    altered[10] = (altered[10] ?? 0) + 0.001;
    const a = deriveCue(card(), 'hurt', placeholder.sources, 1);
    const b = deriveCue(card(), 'hurt', { quadruped: { ...placeholder.sources.quadruped, hurt: altered } }, 1);
    expect(a.recipeHash).not.toBe(b.recipeHash);
  });

  it('never reads a clock during derivation (negative control)', () => {
    const now = vi.spyOn(Date, 'now');
    const perf = vi.spyOn(performance, 'now');
    try {
      for (const cue of ['call', 'attack-vocal', 'hurt', 'breath-idle', 'footfall-set', 'land-thud']) {
        deriveCue(card(), cue, placeholder.sources, 3);
      }
      expect(now).not.toHaveBeenCalled();
      expect(perf).not.toHaveBeenCalled();
    } finally { now.mockRestore(); perf.mockRestore(); }
  });

  it('refuses a non-creature cue and a missing archetype set', () => {
    expect(() => deriveCue(card(), 'battle:cursor', placeholder.sources, 1)).toThrow(/creature cues/u);
    expect(() => deriveCue(card(), 'call', {}, 1)).toThrow(/no source set/u);
  });

  it('pitch shift moves a sine fundamental in the expected direction and keeps length', () => {
    const tone = sine(220, SAMPLE_RATE, 0.8);
    const up = pitchShift(tone, 12, 5);
    const down = pitchShift(tone, -12, 5);
    expect(up.length).toBe(tone.length);
    expect(down.length).toBe(tone.length);
    const base = zeroCrossings(tone);
    expect(zeroCrossings(up)).toBeGreaterThan(base * 1.8);
    expect(zeroCrossings(down)).toBeLessThan(base * 0.6);
    expect(resample(tone, 2).length).toBe(tone.length / 2);
  });

  it('time stretch lands within one sample of the target length', () => {
    const tone = sine(440, 20_000, 0.5);
    for (const f of [0.7, 1, 1.4]) expect(Math.abs(timeStretch(tone, f, 9).length - tone.length * f)).toBeLessThanOrEqual(1);
  });

  it('caps creature cues at two seconds, peak-limits to -1 dBTP and flags missing textures', () => {
    /* scaled skin, no record surface: the placeholder has no scaled texture; 140 percent time pushes 1.6 s past the cap */
    const r = compileVoiceCard({ template: { id: 'quadruped' } }, { ...CIVET_GENOME, skin: 0 }, null, { timePercent: 60 });
    if (!r.ok) throw new Error(r.reason);
    expect(r.card.timePercent).toBe(140);
    const faint = deriveCue(r.card, 'breath-idle', placeholder.sources, 2);
    expect(faint.samples.length).toBe(2 * SAMPLE_RATE);
    expect(faint.flags).toContain('length-capped-2s');
    let peak = 0;
    for (const v of faint.samples) peak = Math.max(peak, Math.abs(v));
    // D15 Stage 0: peak-normalised to -1 dBFS, then the measured loudness stage may only ATTENUATE (short-term ≤ -14 LUFS, true peak ≤ -1 dBTP)
    expect(peak).toBeLessThanOrEqual(0.891 + 1e-6); expect(admitLoudnessV1(faint.samples, faint.sampleRate, 'creature')).toMatchObject({ ok: true });
    expect(faint.flags).toContain('texture-missing:scaled');
  });

  it('stableJson sorts keys and sha256 matches a known vector', () => {
    expect(stableJson({ b: 1, a: [{ d: 2, c: 3 }] })).toBe('{"a":[{"c":3,"d":2}],"b":1}');
    expect(sha256Hex(new TextEncoder().encode('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
