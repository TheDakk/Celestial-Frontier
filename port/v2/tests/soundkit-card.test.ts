import { describe, expect, it } from 'vitest';
import { compileVoiceCard, VOICE_BOUNDS } from '../apps/game/src/soundkit/voice-card.js';

const GENOME = {
  seed: 1597751321, kingdom: 'fauna', color: 6, form: 8, body: 2, loco: 6, trait: 4, size: 4, diet: 0, head: 6,
  limbs: 0, skin: 7, tail: 6, pattern: 7, eyes: 2, behavior: 7, habitat: 11, detail: 8, accent: 2, temper: 7,
  sense: 7, repro: 2, life: 1, metab: 0, lumin: true, gen: 0, heat: 0,
};
const record = (id: string, surface?: string) => ({
  template: { id }, identity: { seed: 5, speciesVisualKey: `k:${id}` }, ...(surface ? { materials: { surface } } : {}),
});

describe('soundkit voice card', () => {
  it('compiles the procedural genome: size, material, temper, breath, footfall, luminous', () => {
    const r = compileVoiceCard(record('quadruped'), GENOME);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.card).toMatchObject({
      archetype: 'quadruped', sizeClass: 'massive', pitchSemitones: -8, formantPercent: -20, thudGain: 1,
      material: 'translucent', aggression: 0.45, breathHz: 0.55, footfall: 'pad', luminous: true, medium: 'none', flags: [],
    });
    expect(r.card.timePercent).toBe(101);
    expect(r.card.seed).toBeGreaterThan(0);
  });

  it('prefers the record surface over the skin gene and defaults size without a genome (flagged)', () => {
    const fox = compileVoiceCard(record('quadruped', 'fur'), null);
    expect(fox.ok && fox.card.material).toBe('furred');
    expect(fox.ok && fox.card.sizeClass).toBe('dog-sized');
    expect(fox.ok && fox.card.flags).toContain('size-defaulted-medium');
    const civet = compileVoiceCard(record('quadruped', 'fur'), { ...GENOME, skin: 8 });
    expect(civet.ok && civet.card.material).toBe('furred');
  });

  it('clamps out-of-bounds pushes and flags each one', () => {
    const r = compileVoiceCard(record('quadruped'), { ...GENOME, size: 0 }, null, { pitchSemitones: 30, formantPercent: 40, timePercent: 90 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.card.pitchSemitones).toBe(VOICE_BOUNDS.pitchSemitones[1]);
    expect(r.card.formantPercent).toBe(VOICE_BOUNDS.formantPercent[1]);
    expect(r.card.timePercent).toBe(VOICE_BOUNDS.timePercent[1]);
    expect(r.card.flags).toEqual(['pitch-clamped', 'formant-clamped', 'time-clamped']);
    const low = compileVoiceCard(record('quadruped'), { ...GENOME, size: 5 }, null, { pitchSemitones: -5, timePercent: -60 });
    expect(low.ok && low.card.pitchSemitones).toBe(-12);
    expect(low.ok && low.card.timePercent).toBe(70);
  });

  it('refuses unknown archetypes, plants and non-fauna with named reasons', () => {
    expect(compileVoiceCard(record('hexapod-tank'), GENOME)).toEqual({ ok: false, reason: 'unknown-archetype:hexapod-tank' });
    expect(compileVoiceCard(record('plant'), null)).toEqual({ ok: false, reason: 'no-voice:plants' });
    expect(compileVoiceCard({ template: {} }, GENOME)).toEqual({ ok: false, reason: 'missing-template-id' });
    expect(compileVoiceCard(record('quadruped'), { ...GENOME, kingdom: 'flora' })).toEqual({ ok: false, reason: 'no-voice:flora' });
  });

  it('medium follows the realm and the system card overrides it', () => {
    const swimmer = compileVoiceCard(record('fish'), { ...GENOME, loco: 4, habitat: 10 });
    expect(swimmer.ok && swimmer.card.medium).toBe('aquatic');
    expect(swimmer.ok && swimmer.card.footfall).toBe('splash');
    const gas = compileVoiceCard(record('quadruped'), GENOME, { medium: 'gas-giant' });
    expect(gas.ok && gas.card.medium).toBe('gas-giant');
  });
});
