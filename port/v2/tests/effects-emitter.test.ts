import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EMITTER_PARTICLE_CAP, EMITTER_PRESETS, alphaAt, createEmitterState, normalizeEmitterConfig, stepEmitter, type EmitterState,
} from '../apps/game/src/effects/emitter.js';

const run = (seed: number, steps: number, phase: 'launch' | 'travel' | 'impact' = 'impact', dt = 1000 / 60): EmitterState[] => {
  const states: EmitterState[] = [createEmitterState(EMITTER_PRESETS[phase], seed)];
  for (let i = 0; i < steps; i++) states.push(stepEmitter(states[states.length - 1]!, dt, { x: 0.5, y: 0.78 }));
  return states;
};

describe('effects emitter: seeded, pure, capped', () => {
  afterEach(() => vi.restoreAllMocks());

  it('replays byte-identically for the same seed over 600 steps, and differs for another seed', () => {
    const a = run(0x50A1E5, 600), b = run(0x50A1E5, 600);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a).toEqual(b);
    const c = run(0x50A1E6, 600);
    expect(JSON.stringify(c[1])).not.toBe(JSON.stringify(a[1]));
    expect(a[600]!.stepIndex).toBe(600);
    expect(a[600]!.timeMs).toBeCloseTo(10000, 6);
  });

  it('never mutates its input and returns frozen, fresh arrays', () => {
    const s0 = createEmitterState(EMITTER_PRESETS.launch, 7);
    const snapshot = JSON.stringify(s0);
    const s1 = stepEmitter(s0, 16, { x: 0.2, y: 0.78 });
    const s2 = stepEmitter(s1, 16);
    expect(JSON.stringify(s0)).toBe(snapshot);
    expect(s1.particles).not.toBe(s2.particles);
    expect(Object.isFrozen(s1) && Object.isFrozen(s1.particles) && Object.isFrozen(s1.particles[0])).toBe(true);
    expect(s1.particles.length).toBe(36);
    expect(s1.particles.every((p) => p.x === 0.2 && p.y === 0.78 && p.ageMs === 0)).toBe(true);
    expect(s2.particles.every((p) => p.ageMs === 16 && p.alpha < 1)).toBe(true);
  });

  it('never reads the clock or Math.random (negative control)', () => {
    const date = vi.spyOn(Date, 'now'), perf = vi.spyOn(performance, 'now'), random = vi.spyOn(Math, 'random');
    run(42, 120, 'travel');
    expect(date).not.toHaveBeenCalled();
    expect(perf).not.toHaveBeenCalled();
    expect(random).not.toHaveBeenCalled();
  });

  it('holds the 200-particle budget under an over-eager config and clamps maxParticles', () => {
    const greedy = normalizeEmitterConfig({ ...EMITTER_PRESETS.travel, maxParticles: 5000, rate: 100000, burst: 1000, durationMs: 100000, lifeMs: [5000, 6000] });
    expect(greedy.maxParticles).toBe(EMITTER_PARTICLE_CAP);
    let s = createEmitterState(greedy, 1);
    let peak = 0;
    for (let i = 0; i < 300; i++) { s = stepEmitter(s, 16); peak = Math.max(peak, s.particles.length); }
    expect(peak).toBe(EMITTER_PARTICLE_CAP);
    expect(s.emittedTotal).toBeLessThanOrEqual(EMITTER_PARTICLE_CAP + 300);
  });

  it('phase presets behave as burst, trail and scatter', () => {
    const launch = run(3, 2, 'launch'), travel = run(3, 30, 'travel'), impact = run(3, 2, 'impact');
    expect(launch[1]!.particles.length).toBe(36);
    expect(launch[2]!.emittedTotal).toBe(36);
    expect(travel[1]!.particles.length).toBeGreaterThan(0);
    expect(travel[30]!.emittedTotal).toBeGreaterThan(travel[15]!.emittedTotal);
    expect(impact[1]!.particles.length).toBe(100);
    expect(Object.values(EMITTER_PRESETS).reduce((n, c) => n + c.maxParticles, 0)).toBe(EMITTER_PARTICLE_CAP);
    expect(impact[2]!.particles.some((p) => p.vy > impact[1]!.particles[0]!.vy)).toBe(true);
    expect(alphaAt('flash', 0.1)).toBe(1);
    expect(alphaAt('ease-out', 0.5)).toBeCloseTo(0.25, 12);
    expect(alphaAt('linear', 2)).toBe(0);
  });

  it('refuses malformed configs and steps', () => {
    expect(() => createEmitterState({ ...EMITTER_PRESETS.launch, maxParticles: 0 }, 1)).toThrow(/maxParticles/);
    expect(() => createEmitterState({ ...EMITTER_PRESETS.launch, lifeMs: [0, 10] }, 1)).toThrow(/lifeMs/);
    expect(() => createEmitterState({ ...EMITTER_PRESETS.launch, phase: 'idle' as never }, 1)).toThrow(/unknown phase/);
    expect(() => createEmitterState(EMITTER_PRESETS.launch, 1.5)).toThrow(/seed/);
    expect(() => stepEmitter(createEmitterState(EMITTER_PRESETS.launch, 1), -1)).toThrow(/dtMs/);
  });
});
