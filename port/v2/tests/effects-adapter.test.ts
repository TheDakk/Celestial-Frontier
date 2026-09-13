import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseEffectSequenceAnchors, placeEffectSequence, type EffectSequenceAnchors } from '../apps/game/src/effects/anchors.js';
import { EMITTER_PARTICLE_CAP, EMITTER_PRESETS } from '../apps/game/src/effects/emitter.js';
import {
  EFFECT_FIXED_STEP_MS, EffectSequencePlayer, createPixiEffectHost,
  type EffectParticleLike, type EffectPixiHost, type EffectSpriteLike, type EffectTextureLike,
} from '../apps/game/src/effects/pixi-adapter.js';
import { buildEffectSchedule } from '../apps/game/src/effects/sequencer.js';

const WILD_PATH = fileURLToPath(new URL('../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', import.meta.url));
const wildAnchors = (): EffectSequenceAnchors => {
  const parsed = parseEffectSequenceAnchors(JSON.parse(readFileSync(WILD_PATH, 'utf8')));
  if (!parsed.ok) throw new Error(parsed.reason);
  return parsed.anchors;
};

class FakeSprite implements EffectSpriteLike {
  x = 0; y = 0; rotation = 0; alpha = 1; visible = true;
  anchorSet: [number, number] = [0, 0]; scaleSet: [number, number] = [1, 1];
  readonly anchor = { set: (x: number, y: number): void => { this.anchorSet = [x, y]; } };
  readonly scale = { set: (x: number, y: number): void => { this.scaleSet = [x, y]; } };
  constructor(readonly texture: EffectTextureLike) {}
}
class FakeParticle implements EffectParticleLike {
  x = 0; y = 0; scaleX = 1; scaleY = 1; anchorX = 0; anchorY = 0; rotation = 0; alpha = 1;
  constructor(readonly texture: EffectTextureLike) {}
}
class FakeParticleContainer {
  readonly live = new Set<EffectParticleLike>();
  constructor(readonly options: unknown) {}
  addParticle(...ps: EffectParticleLike[]): void { for (const p of ps) this.live.add(p); }
  removeParticle(...ps: EffectParticleLike[]): void { for (const p of ps) this.live.delete(p); }
}
const fakePixi = { Sprite: FakeSprite, Particle: FakeParticle, ParticleContainer: FakeParticleContainer };
const TEX: EffectTextureLike = { width: 1254, height: 1254 };
const DOT: EffectTextureLike = { width: 8, height: 8 };

function player(host: EffectPixiHost, clock: () => number, seed = 99): EffectSequencePlayer {
  const anchors = wildAnchors();
  const placement = placeEffectSequence(anchors, { attacker: { x: 0.3, y: 0.78 }, target: { x: 0.7, y: 0.78 } });
  const schedule = buildEffectSchedule(anchors, { delivery: 'melee', attackerMassClass: 1 }, placement);
  return new EffectSequencePlayer({ host, schedule, phaseTextures: [TEX, TEX, TEX], particleTexture: DOT, emitters: EMITTER_PRESETS, seed, clock, arena: { width: 1000, height: 600 } });
}

describe('effects pixi adapter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('binds Sprite, Particle and ParticleContainer structurally and drives them from the injected clock only', () => {
    const date = vi.spyOn(Date, 'now'), perf = vi.spyOn(performance, 'now');
    let now = 5000;
    const host = createPixiEffectHost(fakePixi);
    const p = player(host, () => now);
    expect(p.sprites).toHaveLength(3);
    expect((p.sprites[0] as FakeSprite).anchorSet).toEqual([0.18, 0.66]);
    expect((p.sprites[2] as FakeSprite).anchorSet).toEqual([0.8, 0.55]);
    expect(p.tick().sample.phase).toBe('launch');
    now += 100;
    const launch = p.tick();
    expect(launch.sample.phase).toBe('launch');
    expect(p.sprites[0]!.visible).toBe(true);
    expect(p.sprites[0]!.x).toBe(300);
    expect(p.sprites[0]!.y).toBeCloseTo(468, 9);
    expect(launch.liveParticles).toBeGreaterThan(0);
    expect(launch.liveParticles).toBe((p.particles as FakeParticleContainer).live.size);
    now += 130;
    const impact = p.tick();
    expect(impact.sample.phase).toBe('impact');
    expect(p.sprites[2]!.x).toBe(700);
    expect(p.sprites[2]!.y).toBeCloseTo(468, 9);
    expect((p.sprites[2] as FakeSprite).scaleSet[0]).toBeCloseTo((0.4 / 0.6) * 0.85 * 1000 / 1254, 9);
    expect(p.sprites[1]!.visible).toBe(false);
    expect(date).not.toHaveBeenCalled();
    expect(perf).not.toHaveBeenCalled();
  });

  it('keeps the sequence-wide 200-particle budget, mirrors positions in pixels, and drains to done', () => {
    let now = 0;
    const p = player(createPixiEffectHost(fakePixi), () => now);
    let peak = 0, frame = p.tick();
    while (!frame.done && now < 5000) {
      now += 16;
      frame = p.tick();
      peak = Math.max(peak, frame.liveParticles);
      expect(frame.liveParticles).toBeLessThanOrEqual(EMITTER_PARTICLE_CAP);
    }
    expect(frame.done).toBe(true);
    expect(peak).toBeGreaterThan(100);
    expect(peak).toBeLessThanOrEqual(EMITTER_PARTICLE_CAP);
    expect((p.particles as FakeParticleContainer).live.size).toBe(0);
    expect(p.emitterState('impact').particles.every((q) => q.y > 400 && q.y < 700)).toBe(true);
    p.dispose();
    expect(p.sprites.every((s) => !s.visible)).toBe(true);
  });

  it('replays byte-identically under the same seed and clock series; the fixed step is 60 Hz', () => {
    const play = (seed: number): string => {
      let now = 0;
      const p = player(createPixiEffectHost(fakePixi), () => now, seed);
      const states: unknown[] = [];
      for (let i = 0; i < 40; i++) { now += 13; p.tick(); states.push(p.emitterState('launch'), p.emitterState('impact')); }
      return JSON.stringify(states);
    };
    expect(EFFECT_FIXED_STEP_MS).toBeCloseTo(16.6667, 3);
    expect(play(1)).toBe(play(1));
    expect(play(1)).not.toBe(play(2));
    const anchors = wildAnchors();
    const schedule = buildEffectSchedule(anchors, { delivery: 'cast', attackerMassClass: 1 }, placeEffectSequence(anchors, { attacker: { x: 0.2, y: 0.78 }, target: { x: 0.6, y: 0.78 } }));
    expect(() => new EffectSequencePlayer({ host: createPixiEffectHost(fakePixi), schedule, phaseTextures: [TEX], particleTexture: DOT,
      emitters: EMITTER_PRESETS, seed: 1, clock: () => 0, arena: { width: 1, height: 1 } })).toThrow(/one phase texture per schedule track/);
  });
});
