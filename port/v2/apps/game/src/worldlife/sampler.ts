/** @module worldlife/sampler [domain] — pure function of (spec, ms). Same inputs → byte-identical
 * state, so a landing or arena replays exactly. No clock reads; the caller owns time. */
import { WorldLifeRefusal, type WorldLifeSpecV1 } from './spec.js';

const TAU = Math.PI * 2;
/** Max sway rotation in radians at amplitude 1.0 (kit "wind"); storm 1.4 reaches ~4.8°. */
export const WORLD_LIFE_SWAY_RADIANS = 0.06;

export interface WorldLifeSampleV1 {
  readonly ms: number;
  /** Flat [x, y, x2, y2, alpha] per streak, normalized to the reference frame. */
  readonly streaks: readonly number[];
  readonly driftOffsets: readonly (readonly [number, number, number, number])[];
  readonly shimmerPhase: number | null;
  readonly shimmerBandPhases: readonly number[];
  readonly swayAngles: readonly number[];
  readonly fliers: readonly (readonly [number, number])[];
  readonly flicker: readonly (readonly [number, number, number])[];
}

function wrap(v: number, span: number): number { const m = v % span; return m < 0 ? m + span : m; }

export function sampleWorldLife(
  spec: WorldLifeSpecV1, ms: number, options: Readonly<{ reducedMotion?: boolean }> = {},
): WorldLifeSampleV1 {
  if (!Number.isFinite(ms) || ms < 0) throw new WorldLifeRefusal('time-invalid', String(ms));
  const t = options.reducedMotion === true ? 0 : ms / 1000;
  const { frame } = spec, aspect = frame.width / frame.height;

  const streaks: number[] = [];
  const p = spec.precipitation;
  if (p) {
    const dx = Math.sin(p.angle), dy = Math.cos(p.angle), f = p.field;
    for (let i = 0; i < p.count; i++) {
      const x0 = f[i * 4]!, y0 = f[i * 4 + 1]!, len = p.length[0] + (p.length[1] - p.length[0]) * f[i * 4 + 2]!, jitter = 0.85 + 0.3 * f[i * 4 + 3]!;
      const travel = p.speed * jitter * t;
      const y = wrap(y0 + travel * dy + len, 1 + 2 * len) - len;
      const x = wrap(x0 + (travel * dx) / aspect + (p.kind === 'snow' ? 0.01 * Math.sin(TAU * (t * 0.3 + f[i * 4 + 3]!)) : 0), 1);
      streaks.push(x, y, x + (len * dx) / aspect, y + len * dy, p.opacity * (0.55 + 0.45 * f[i * 4 + 3]!));
    }
  }

  const driftOffsets = spec.drift.blobs.map(([x0, y0, r, phase]) => {
    const x = wrap(x0 + spec.drift.speedX * t + r, 1 + 2 * r) - r;
    const y = wrap(y0 + spec.drift.speedY * t + 0.01 * Math.sin(TAU * (t * 0.05 + phase)), 1);
    return [x, y, r, spec.drift.opacity * (0.75 + 0.25 * Math.sin(TAU * (t * 0.08 + phase)))] as const;
  });

  const shimmerPhase = spec.shimmer ? wrap(t * spec.shimmer.rippleFrequencyHz, 1) : null;
  const shimmerBandPhases = spec.shimmer ? spec.shimmer.phases.map((ph, i) => wrap(t * spec.shimmer!.rippleFrequencyHz * (1 + 0.15 * i) + ph, 1)) : [];

  const swayAngles = spec.sway.bands.map((b) => WORLD_LIFE_SWAY_RADIANS * b.amplitude
    * (Math.sin(TAU * (t * b.frequencyHz + b.phase)) * 0.8 + Math.sin(TAU * (t * b.frequencyHz * 2.3 + b.phase * 1.7)) * 0.2));

  const fliers = spec.fliers ? spec.fliers.paths.map((f) => [
    wrap(f.x0 + f.direction * f.speed * t + 0.05, 1.1) - 0.05,
    f.y0 + f.bob * Math.sin(TAU * (t * f.bobHz + f.phase)),
  ] as const) : [];

  const flicker = spec.flicker ? spec.flicker.lights.map(([x, y, rate, phase]) => [
    x, y, spec.flicker!.base + (1 - spec.flicker!.base) * (0.5 + 0.35 * Math.sin(TAU * (t * rate + phase)) + 0.15 * Math.sin(TAU * (t * rate * 3.1 + phase * 2.3))),
  ] as const) : [];

  return { ms: t * 1000, streaks, driftOffsets, shimmerPhase, shimmerBandPhases, swayAngles, fliers, flicker };
}
