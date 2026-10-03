/* D15 Stage 0: the MEASURED loudness gate (BS.1770 K-weighted loudness + 4x true peak). Calibrated against the standard's own reference and
   negative-controlled in every direction; then the outcome: every creature cue derivable today (13 archetypes × 11 cues, the labelled
   placeholder sources) passes the creature gate. */
import { describe, expect, it } from 'vitest';
import { __kWeightingCoefficientsForTest, admitLoudnessV1, limitToLoudnessV1, measureLoudnessV1, truePeakLinearV1 } from '../apps/game/src/soundkit/loudness.js';
import { CREATURE_CUES } from '../apps/game/src/soundkit/cues.js';
import { deriveCue } from '../apps/game/src/soundkit/derive.js';
import { synthesizePlaceholderLibrary } from '../apps/game/src/soundkit/placeholder-archetype.js';
import { VOICE_ARCHETYPES, compileVoiceCard } from '../apps/game/src/soundkit/voice-card.js';

const SR = 48_000;
const sine = (hz: number, seconds: number, amp: number, phase = 0) => { const y = new Float32Array(Math.round(seconds * SR)); for (let i = 0; i < y.length; i++) y[i] = amp * Math.sin((2 * Math.PI * hz * i) / SR + phase); return y; };

describe('BS.1770 measurement (calibration and controls)', () => {
  it('the pre-filter reproduces the standard\'s published 48 kHz shelf coefficients', () => {
    const [shelf] = __kWeightingCoefficientsForTest(48_000);
    [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585].forEach((c, i) => expect(shelf[i]).toBeCloseTo(c, 10));
  });
  it('a full-scale 997 Hz mono sine measures -3.01 LUFS (the standard\'s reference); -20 dBFS measures 20 LU lower', () => {
    const full = measureLoudnessV1(sine(997, 5, 1), SR), quiet = measureLoudnessV1(sine(997, 5, 0.1), SR);
    expect(full.integratedLufs).toBeCloseTo(-3.01, 1); expect(full.shortTermMaxLufs).toBeCloseTo(-3.01, 1); expect(full.momentaryMaxLufs).toBeCloseTo(-3.01, 1);
    expect(full.integratedLufs - quiet.integratedLufs).toBeCloseTo(20, 1);
  });
  it('K-weighting is real: a 30 Hz tone reads far quieter than a 997 Hz tone of the same amplitude (the RLB high-pass)', () => {
    expect(measureLoudnessV1(sine(30, 5, 1), SR).integratedLufs).toBeLessThan(measureLoudnessV1(sine(997, 5, 1), SR).integratedLufs - 3);
  });
  it('the gates: silence is -Infinity; a quiet tail under the relative gate does not drag integrated loudness down', () => {
    expect(measureLoudnessV1(new Float32Array(SR), SR).integratedLufs).toBe(-Infinity);
    const loud = sine(997, 3, 1), tail = sine(997, 3, 0.001), both = new Float32Array(loud.length + tail.length); both.set(loud); both.set(tail, loud.length);
    // ungated, the half-silent signal would read ~6 LU down; the gates keep it near the loud part (blocks straddling the edge legitimately count)
    const m = measureLoudnessV1(both, SR); expect(m.integratedLufs).toBeGreaterThan(-3.5); expect(m.integratedLufs).toBeLessThanOrEqual(-3.0);
  });
  it('TRUE peak sees the inter-sample peak a sample-peak meter misses (fs/4 at 45°: samples ±0.707, true ≈ 1.0)', () => {
    const x = sine(SR / 4, 0.5, 1, Math.PI / 4);
    let sp = 0; for (const v of x) sp = Math.max(sp, Math.abs(v));
    expect(sp).toBeCloseTo(Math.SQRT1_2, 3); expect(truePeakLinearV1(x)).toBeGreaterThan(0.97);
  });
});

describe('the admission gate (controls in both directions)', () => {
  const at = (lufsTarget: number, seconds = 1.5) => { const x = sine(997, seconds, 1), m = measureLoudnessV1(x, SR); const g = Math.pow(10, (lufsTarget - m.shortTermMaxLufs) / 20); return x.map((v) => v * g); };
  it('a creature cue at -14 LUFS short-term passes; +2 LU is refused as too loud; -36 LUFS as too quiet; silence as silent; a NaN as non-finite', () => {
    expect(admitLoudnessV1(at(-14), SR, 'creature')).toMatchObject({ ok: true });
    expect(admitLoudnessV1(at(-12), SR, 'creature')).toMatchObject({ ok: false, reason: expect.stringMatching(/^too-loud/) });
    expect(admitLoudnessV1(at(-36), SR, 'creature')).toMatchObject({ ok: false, reason: expect.stringMatching(/^too-quiet/) });
    expect(admitLoudnessV1(new Float32Array(SR), SR, 'creature')).toMatchObject({ ok: false, reason: 'silent' });
    const bad = at(-14); bad[10] = Number.NaN; expect(admitLoudnessV1(bad, SR, 'creature')).toMatchObject({ ok: false, reason: 'non-finite-sample' });
  });
  it('a quiet cue whose true peak is over -1 dBTP is refused (a click on a quiet tone)', () => {
    const x = at(-20); x[100] = 0.99; expect(admitLoudnessV1(x, SR, 'creature')).toMatchObject({ ok: false, reason: expect.stringMatching(/^true-peak/) });
  });
  it('limitToLoudnessV1 only attenuates: a loud cue comes out admissible; a quiet cue is returned unchanged', () => {
    const loud = sine(997, 1.5, 0.95), fixed = limitToLoudnessV1(loud, SR, 'creature');
    expect(admitLoudnessV1(loud, SR, 'creature').ok).toBe(false); expect(fixed.gainDb).toBeLessThan(0); expect(admitLoudnessV1(fixed.samples, SR, 'creature').ok).toBe(true);
    const quiet = at(-24), same = limitToLoudnessV1(quiet, SR, 'creature'); expect(same.gainDb).toBe(0); expect(same.samples).toBe(quiet);
  });
});

describe('OUTCOME: every creature cue derivable today passes the creature gate', () => {
  it('13 archetypes × every creature cue from the placeholder library, at the extreme sizes (tiny and titanic)', () => {
    const { sources } = synthesizePlaceholderLibrary(); let checked = 0; const refused: string[] = [];
    for (const archetype of VOICE_ARCHETYPES) {
      if (sources[archetype] === undefined) continue;
      for (const size of [0, 5]) {
        const r = compileVoiceCard({ template: { id: archetype }, identity: { seed: 7 } }, { seed: 7, kingdom: 'fauna', size } as never); if (!r.ok) continue;
        for (const cue of CREATURE_CUES) { let d; try { d = deriveCue(r.card, cue, sources, 11); } catch { continue; } checked++;
          const a = admitLoudnessV1(d.samples, d.sampleRate, 'creature'); if (!a.ok) refused.push(`${archetype}/${size}/${cue}: ${a.reason}`); }
      }
    }
    if (refused.length) console.error('REFUSED\n' + refused.join('\n'));
    expect(refused).toEqual([]); expect(checked).toBeGreaterThan(100);
  }, 300_000);
});
