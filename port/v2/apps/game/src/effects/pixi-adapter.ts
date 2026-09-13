/* Thin Pixi 8 adapter: three phase sprites plus one ParticleContainer pool, driven by an injected clock.
 * pixi.js 8.19.0 exports `ParticleContainer`, `Particle` and `Sprite` (lib/scene/index.d.ts); this file
 * types them STRUCTURALLY so the simulation and its tests never import pixi.js (the app tsconfig needs
 * skipLibCheck for pixi's bundled GPU types; the root strict tsconfig does not have it).
 * Bind the real classes with `createPixiEffectHost(pixi)` at the wiring site. The player owns no
 * simulation logic: it samples the schedule, steps the emitters at a fixed 60 Hz cadence and mirrors. */
import type { EffectPhaseName, NormalizedPoint } from './anchors.js';
import { createEmitterState, stepEmitter, type EmitterConfig, type EmitterState } from './emitter.js';
import { sampleSchedule, type EffectSchedule, type EffectSample } from './sequencer.js';

export interface EffectTextureLike { readonly width: number; readonly height: number; }
export interface EffectSpriteLike {
  x: number; y: number; rotation: number; alpha: number; visible: boolean;
  readonly anchor: { set(x: number, y: number): unknown };
  readonly scale: { set(x: number, y: number): unknown };
}
export interface EffectParticleLike {
  x: number; y: number; scaleX: number; scaleY: number; anchorX: number; anchorY: number; rotation: number; alpha: number;
}
export interface EffectParticleContainerLike {
  addParticle(...particles: EffectParticleLike[]): unknown;
  removeParticle(...particles: EffectParticleLike[]): unknown;
}
export interface EffectPixiHost {
  createSprite(texture: EffectTextureLike): EffectSpriteLike;
  createParticleContainer(maxParticles: number): EffectParticleContainerLike;
  createParticle(texture: EffectTextureLike): EffectParticleLike;
}

/** Bind the real pixi.js namespace (or any structural equivalent). */
export function createPixiEffectHost(pixi: {
  Sprite: new (texture: EffectTextureLike) => EffectSpriteLike;
  Particle: new (texture: EffectTextureLike) => EffectParticleLike;
  ParticleContainer: new (options: { dynamicProperties: { position: boolean; rotation: boolean; color: boolean; vertex: boolean } }) => EffectParticleContainerLike;
}): EffectPixiHost {
  const host: EffectPixiHost = {
    createSprite: (texture) => new pixi.Sprite(texture),
    createParticle: (texture) => new pixi.Particle(texture),
    createParticleContainer: () => new pixi.ParticleContainer({ dynamicProperties: { position: true, rotation: true, color: true, vertex: true } }),
  };
  return Object.freeze(host);
}

export const EFFECT_FIXED_STEP_MS = 1000 / 60;

export interface EffectSequencePlayerOptions {
  readonly host: EffectPixiHost;
  readonly schedule: EffectSchedule;
  /** One texture per anchors phase, in phase order. */
  readonly phaseTextures: readonly EffectTextureLike[];
  readonly particleTexture: EffectTextureLike;
  readonly emitters: Readonly<Record<EffectPhaseName, EmitterConfig>>;
  readonly seed: number;
  /** Injected clock in ms; the player never reads Date.now or performance.now itself. */
  readonly clock: () => number;
  readonly arena: { readonly width: number; readonly height: number };
}

export interface EffectPlayerFrame { readonly sample: EffectSample; readonly liveParticles: number; readonly done: boolean; }

export class EffectSequencePlayer {
  readonly sprites: readonly EffectSpriteLike[];
  readonly particles: EffectParticleContainerLike;
  readonly #o: EffectSequencePlayerOptions;
  readonly #pool: EffectParticleLike[] = [];
  readonly #emitters: Map<EffectPhaseName, EmitterState>;
  #startMs: number | null = null;
  #simMs = 0;
  #inUse = 0;

  constructor(options: EffectSequencePlayerOptions) {
    if (options.phaseTextures.length !== options.schedule.tracks.length) throw new TypeError('one phase texture per schedule track is required');
    this.#o = options;
    this.sprites = Object.freeze(options.phaseTextures.map((texture, i) => {
      const sprite = options.host.createSprite(texture);
      const anchor = options.schedule.tracks[i]!.anchor;
      sprite.anchor.set(anchor.x, anchor.y);
      sprite.visible = false;
      return sprite;
    }));
    this.#emitters = new Map((['launch', 'travel', 'impact'] as const).map((phase, i) => [phase, createEmitterState(options.emitters[phase], (options.seed + i * 7919) | 0)]));
    const cap = Math.max(...[...this.#emitters.values()].map((s) => s.config.maxParticles));
    this.particles = options.host.createParticleContainer(cap);
  }

  /** Advance to the injected clock's now; idempotent per clock value. */
  tick(): EffectPlayerFrame {
    const now = this.#o.clock();
    if (this.#startMs === null) this.#startMs = now;
    const ms = Math.max(0, now - this.#startMs);
    const { schedule, arena } = this.#o;
    while (this.#simMs + EFFECT_FIXED_STEP_MS <= ms) {
      const at = sampleSchedule(schedule, this.#simMs);
      const origin: NormalizedPoint = { x: at.transform.x * arena.width, y: at.transform.y * arena.height };
      for (const [phase, state] of this.#emitters) {
        const emitting = at.emitterPhase === phase;
        if (!emitting && state.stepIndex === 0) continue;
        const scaled = { ...state.config, speed: [state.config.speed[0] * arena.width, state.config.speed[1] * arena.width] as const,
          gravity: state.config.gravity * arena.width };
        const next = stepEmitter({ ...state, config: scaled }, EFFECT_FIXED_STEP_MS, origin);
        this.#emitters.set(phase, { ...next, config: state.config });
      }
      this.#simMs += EFFECT_FIXED_STEP_MS;
    }
    const sample = sampleSchedule(schedule, ms);
    sample.tracks.forEach((t, i) => {
      const sprite = this.sprites[i]!, texture = this.#o.phaseTextures[i]!;
      sprite.visible = t.visible;
      sprite.x = t.transform.x * arena.width; sprite.y = t.transform.y * arena.height;
      const s = (t.transform.scale * arena.width) / texture.width;
      sprite.scale.set(t.transform.flipX ? -s : s, s);
      sprite.rotation = t.transform.rotation; sprite.alpha = t.transform.alpha;
    });
    const live = this.#mirror();
    return Object.freeze({ sample, liveParticles: live, done: ms >= schedule.durationMs && live === 0 });
  }

  #mirror(): number {
    let n = 0;
    const { particleTexture, host } = this.#o;
    for (const state of this.#emitters.values()) {
      for (const p of state.particles) {
        let view = this.#pool[n];
        if (!view) { view = host.createParticle(particleTexture); view.anchorX = 0.5; view.anchorY = 0.5; this.#pool.push(view); }
        if (n >= this.#inUse) this.particles.addParticle(view);
        view.x = p.x; view.y = p.y; view.rotation = p.rotation; view.alpha = p.alpha;
        const s = p.size / particleTexture.width; view.scaleX = s; view.scaleY = s;
        n++;
      }
    }
    for (let i = n; i < this.#inUse; i++) this.particles.removeParticle(this.#pool[i]!);
    this.#inUse = n;
    return n;
  }

  emitterState(phase: EffectPhaseName): EmitterState { return this.#emitters.get(phase)!; }

  dispose(): void {
    for (let i = 0; i < this.#inUse; i++) this.particles.removeParticle(this.#pool[i]!);
    this.#inUse = 0; this.#pool.length = 0;
    for (const sprite of this.sprites) sprite.visible = false;
  }
}
