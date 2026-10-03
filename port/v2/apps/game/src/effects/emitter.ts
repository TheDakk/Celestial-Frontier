/* Seeded particle emitter — a pure simulation. `stepEmitter(state, dt)` is a function of
 * its arguments only: every random draw comes from mulberry32 seeded by hashInt(seed, stepIndex, phase),
 * so identical (config, seed, dt series) replay byte-identically on any device.
 * Contract: the input state is never mutated; every returned array and particle is fresh.
 * Budget (Motion Kit §8): at most 200 particles per emitter — the cap is clamped, never exceeded. */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { EFFECT_PHASE_NAMES, type EffectPhaseName, type NormalizedPoint } from './anchors.js';

export const EMITTER_PARTICLE_CAP = 200 as const;
export type AlphaCurve = 'linear' | 'ease-out' | 'flash';
export type Range = readonly [min: number, max: number];

export interface EmitterConfig {
  readonly phase: EffectPhaseName;
  readonly maxParticles: number;
  /** Particles per second while the emission window is open. */
  readonly rate: number;
  /** Particles released on the first step. */
  readonly burst: number;
  /** Emission window from the first step; 0 = burst only. */
  readonly durationMs: number;
  readonly lifeMs: Range;
  /** Units per second in the caller's space (arena-normalized or pixels; the caller chooses). */
  readonly speed: Range;
  readonly directionRad: number;
  readonly spreadRad: number;
  readonly gravity: number;
  /** Fraction of velocity lost per second. */
  readonly drag: number;
  readonly size: Range;
  readonly alphaCurve: AlphaCurve;
}

export interface Particle {
  readonly x: number; readonly y: number; readonly vx: number; readonly vy: number;
  readonly ageMs: number; readonly lifeMs: number; readonly size: number;
  readonly rotation: number; readonly spin: number; readonly alpha: number;
}

export interface EmitterState {
  readonly config: EmitterConfig;
  readonly seed: number;
  readonly stepIndex: number;
  readonly timeMs: number;
  readonly emitCarry: number;
  readonly emittedTotal: number;
  readonly particles: readonly Particle[];
}

/** Motion Kit §7 phases: a launch burst, a travel trail, an impact scatter. Speeds are per arena width.
 * The three caps sum to the §8 budget (40 + 60 + 100 = 200) so a whole sequence never exceeds one emitter's worth. */
export const EMITTER_PRESETS: Readonly<Record<EffectPhaseName, EmitterConfig>> = Object.freeze({
  launch: Object.freeze({ phase: 'launch', maxParticles: 40, rate: 0, burst: 36, durationMs: 0, lifeMs: [180, 320], speed: [0.15, 0.45],
    directionRad: 0, spreadRad: 0.9, gravity: 0.3, drag: 2.5, size: [2, 5], alphaCurve: 'ease-out' } as const),
  travel: Object.freeze({ phase: 'travel', maxParticles: 60, rate: 300, burst: 0, durationMs: 400, lifeMs: [120, 200], speed: [0.02, 0.1],
    directionRad: Math.PI, spreadRad: 0.5, gravity: 0.1, drag: 3, size: [1.5, 4], alphaCurve: 'linear' } as const),
  impact: Object.freeze({ phase: 'impact', maxParticles: 100, rate: 0, burst: 100, durationMs: 0, lifeMs: [220, 480], speed: [0.2, 0.8],
    directionRad: -Math.PI / 2, spreadRad: 1.4, gravity: 1.6, drag: 1.2, size: [2, 7], alphaCurve: 'flash' } as const),
});

const isRange = (r: unknown): r is Range => Array.isArray(r) && r.length === 2
  && Number.isFinite(r[0]) && Number.isFinite(r[1]) && (r[0] as number) >= 0 && (r[1] as number) >= (r[0] as number);

/** Motion Kit §8 phone budget: the same effect with half the particles (cap, burst and rate), same lives, speeds and sizes. */
export const PHONE_PARTICLE_SCALE = 0.5 as const;
export function scaleEmitterBudget(config: EmitterConfig, scale: number): EmitterConfig {
  if (!Number.isFinite(scale) || scale <= 0 || scale > 1) throw new RangeError(`emitter budget scale ${String(scale)}: expected 0 < scale <= 1`);
  if (scale === 1) return config;
  return normalizeEmitterConfig({ ...config, maxParticles: Math.max(1, Math.round(config.maxParticles * scale)), burst: Math.round(config.burst * scale), rate: config.rate * scale });
}
/** Validate and freeze a config; the particle cap is clamped to the budget, everything else must be sane. */
export function normalizeEmitterConfig(config: EmitterConfig): EmitterConfig {
  if (!EFFECT_PHASE_NAMES.includes(config.phase)) throw new TypeError(`emitter.phase: unknown phase ${String(config.phase)}`);
  if (!Number.isSafeInteger(config.maxParticles) || config.maxParticles < 1) throw new TypeError('emitter.maxParticles: expected a positive integer');
  for (const key of ['rate', 'burst', 'durationMs', 'gravity', 'drag', 'directionRad', 'spreadRad'] as const) {
    if (!Number.isFinite(config[key])) throw new TypeError(`emitter.${key}: expected a finite number`);
  }
  if (config.rate < 0 || config.burst < 0 || config.durationMs < 0 || config.drag < 0 || config.spreadRad < 0) throw new TypeError('emitter: rate, burst, durationMs, drag and spreadRad must be non-negative');
  if (!isRange(config.lifeMs) || config.lifeMs[0] <= 0) throw new TypeError('emitter.lifeMs: expected [min, max] with min > 0');
  if (!isRange(config.speed) || !isRange(config.size)) throw new TypeError('emitter.speed/size: expected [min, max] ranges');
  if (!['linear', 'ease-out', 'flash'].includes(config.alphaCurve)) throw new TypeError('emitter.alphaCurve: unknown curve');
  return Object.freeze({ ...config, maxParticles: Math.min(config.maxParticles, EMITTER_PARTICLE_CAP),
    lifeMs: Object.freeze([...config.lifeMs]) as unknown as Range, speed: Object.freeze([...config.speed]) as unknown as Range,
    size: Object.freeze([...config.size]) as unknown as Range });
}

export function createEmitterState(config: EmitterConfig, seed: number): EmitterState {
  if (!Number.isSafeInteger(seed)) throw new TypeError('emitter seed: expected a safe integer');
  return Object.freeze({ config: normalizeEmitterConfig(config), seed: seed | 0, stepIndex: 0, timeMs: 0, emitCarry: 0, emittedTotal: 0, particles: Object.freeze([]) });
}

export function alphaAt(curve: AlphaCurve, t: number): number {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  if (curve === 'linear') return 1 - u;
  if (curve === 'ease-out') return (1 - u) * (1 - u);
  return u < 0.15 ? 1 : (1 - (u - 0.15) / 0.85);
}

const lerp = (r: Range, t: number): number => r[0] + (r[1] - r[0]) * t;

/** Advance by dtMs, spawning from `origin`. Pure: same (state, dt, origin) → deep-equal result. */
export function stepEmitter(state: EmitterState, dtMs: number, origin: NormalizedPoint = { x: 0, y: 0 }): EmitterState {
  if (!Number.isFinite(dtMs) || dtMs < 0) throw new TypeError('stepEmitter: dtMs must be a finite non-negative number');
  const { config } = state;
  const dt = dtMs / 1000;
  const keep = 1 - Math.min(1, config.drag * dt);
  const survivors: Particle[] = [];
  for (const p of state.particles) {
    const ageMs = p.ageMs + dtMs;
    if (ageMs >= p.lifeMs) continue;
    const vx = p.vx * keep, vy = (p.vy + config.gravity * dt) * keep;
    survivors.push(Object.freeze({ x: p.x + vx * dt, y: p.y + vy * dt, vx, vy, ageMs, lifeMs: p.lifeMs, size: p.size,
      rotation: p.rotation + p.spin * dt, spin: p.spin, alpha: alphaAt(config.alphaCurve, ageMs / p.lifeMs) }));
  }
  let carry = state.emitCarry;
  let wanted = state.stepIndex === 0 ? config.burst : 0;
  if (state.timeMs < config.durationMs) { carry += config.rate * dt; const n = Math.floor(carry); carry -= n; wanted += n; }
  const room = config.maxParticles - survivors.length;
  const count = Math.max(0, Math.min(wanted, room));
  const rng = mulberry32(hashInt(state.seed, state.stepIndex, EFFECT_PHASE_NAMES.indexOf(config.phase)));
  for (let i = 0; i < count; i++) {
    const angle = config.directionRad + (rng() * 2 - 1) * config.spreadRad;
    const speed = lerp(config.speed, rng());
    const lifeMs = lerp(config.lifeMs, rng());
    const size = lerp(config.size, rng());
    const spin = (rng() - 0.5) * 6;
    survivors.push(Object.freeze({ x: origin.x, y: origin.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ageMs: 0, lifeMs, size,
      rotation: rng() * Math.PI * 2, spin, alpha: alphaAt(config.alphaCurve, 0) }));
  }
  return Object.freeze({ config, seed: state.seed, stepIndex: state.stepIndex + 1, timeMs: state.timeMs + dtMs, emitCarry: carry,
    emittedTotal: state.emittedTotal + count, particles: Object.freeze(survivors) });
}
