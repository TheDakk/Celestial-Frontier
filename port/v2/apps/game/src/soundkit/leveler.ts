/* @module soundkit/leveler [domain] — bring a rendered bed, piece or cue ONTO its class loudness target (D15 Stages 1–3). The Stage 0
   `limitToLoudnessV1` only attenuates, which is right for a creature cue that comes out hot, but a sparse music piece or a quiet bed can
   sit under the ±2 LU window. This levels it: make-up gain toward the target, a smooth look-ahead peak limiter so the make-up never
   pushes the true peak past −1 dBTP, then the Stage 0 attenuate-only stage as the final guarantee. Pure and deterministic. */
import { LOUDNESS_TARGETS_V1, limitToLoudnessV1, measureLoudnessV1, type LoudnessClass } from './loudness.js';

const db2lin = (db: number): number => Math.pow(10, db / 20);
/** Look-ahead gain reduction: every sample's needed gain (ceiling/|x|, capped at 1) is taken as the minimum over the next `ahead`
 *  samples, then released smoothly — so a peak is met by a gain already down, never a clipped edge. */
export function peakLimit(x: Float32Array, ceiling: number, rate: number): Float32Array {
  const n = x.length, ahead = Math.max(1, Math.round(0.005 * rate)), need = new Float32Array(n);
  for (let i = 0; i < n; i++) { const a = Math.abs(x[i]!); need[i] = a > ceiling ? ceiling / a : 1; }
  // sliding minimum over [i, i + ahead] with a monotone deque
  const win = new Float32Array(n), q = new Int32Array(n); let h = 0, t = 0;
  for (let i = n - 1; i >= 0; i--) { while (t > h && need[q[t - 1]!]! >= need[i]!) t--; q[t++] = i; while (q[h]! > i + ahead) h++; win[i] = need[q[h]!]!; }
  const rel = 1 - Math.exp(-1 / (0.08 * rate)), y = new Float32Array(n); let g = 1;
  for (let i = 0; i < n; i++) { const target = win[i]!; g = target < g ? target : g + (target - g) * rel; y[i] = x[i]! * g; }
  return y;
}
/** Level `samples` to the class target (integrated for music/ambience, loudest short-term window for cues). */
export function levelToTargetV1(samples: Float32Array, rate: number, cls: LoudnessClass): { readonly samples: Float32Array; readonly makeupDb: number } {
  const t = LOUDNESS_TARGETS_V1[cls], ceiling = db2lin(t.maxTruePeakDb - 0.6);
  let out = samples, makeup = 0;
  for (let pass = 0; pass < 4; pass++) {
    const m = measureLoudnessV1(out, rate), value = t.measure === 'integrated' ? m.integratedLufs : m.shortTermMaxLufs;
    if (!Number.isFinite(value)) break;
    const delta = t.targetLufs - value;
    if (delta <= 0.25) break;                         // at or over target: the attenuate-only stage below finishes it
    const g = db2lin(Math.min(delta, 18)), boosted = new Float32Array(out.length); for (let i = 0; i < out.length; i++) boosted[i] = out[i]! * g;
    out = peakLimit(boosted, ceiling, rate); makeup += Math.min(delta, 18);
  }
  return { samples: limitToLoudnessV1(out, rate, cls).samples, makeupDb: makeup };
}
