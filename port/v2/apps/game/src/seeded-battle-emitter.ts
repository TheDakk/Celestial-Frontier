import { Particle, ParticleContainer, Rectangle, type Texture } from 'pixi.js';

export interface BattleParticleRecipe {
  readonly seed: number;
  readonly phase: 'travel' | 'impact';
  readonly count: number;
  readonly durationMs: number;
  readonly origin: Readonly<{ x: number; y: number }>;
  readonly direction: 1 | -1;
  /** Pixel envelope at the caller's scene scale, independent of device pixel ratio. */
  readonly reach: number;
  readonly spread: number;
  readonly particleScale: number;
}
interface ParticleMotion { born: number; life: number; vx: number; vy: number; gravity: number; angle: number; spin: number; scale: number }
export interface ParticlePose { x: number; y: number; rotation: number; scale: number; alpha: number }

/** Compile finite coefficients from the recipe, never from a ticker or ambient RNG. */
export function compileBattleParticles(input: BattleParticleRecipe) {
  if (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 0xffffffff
    || !['travel', 'impact'].includes(input.phase) || !Number.isInteger(input.count) || input.count < 0 || input.count > 200
    || !Number.isFinite(input.durationMs) || input.durationMs < 60 || input.durationMs > 2000
    || ![input.origin?.x, input.origin?.y].every(Number.isFinite)
    || ![1, -1].includes(input.direction)
    || ![input.reach, input.spread].every(v => Number.isFinite(v) && v >= 0 && v <= 4096)
    || !Number.isFinite(input.particleScale) || input.particleScale <= 0 || input.particleScale > 16)
    throw new Error('Invalid bounded battle particle recipe');
  const recipe = Object.freeze({ ...input, origin: Object.freeze({ ...input.origin }) });
  let seed = (recipe.seed ^ (recipe.phase === 'travel' ? 0x74726176 : 0x696d7061)) >>> 0;
  const random = () => { seed = (seed + 0x6d2b79f5) >>> 0; let n = seed; n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  const coefficients: readonly Readonly<ParticleMotion>[] = Object.freeze(Array.from({ length: recipe.count }, () => {
    const born = recipe.phase === 'travel' ? random() * .25 : random() * .05;
    const life = Math.min(1 - born, .5 + random() * .45);
    return Object.freeze({ born, life, vx: recipe.direction * recipe.reach * (.4 + random() * .6),
      vy: (random() * 2 - 1) * recipe.spread, gravity: recipe.phase === 'impact' ? recipe.spread * .5 : 0,
      angle: random() * Math.PI * 2, spin: (random() * 2 - 1) * 2,
      scale: recipe.particleScale * (.65 + random() * .35) });
  }));
  return Object.freeze({ recipe, coefficients });
}
export type CompiledBattleParticles = ReturnType<typeof compileBattleParticles>;

/** Absolute elapsed time allows seek/replay and gives identical poses at 30/60 Hz. */
export function sampleBattleParticle(compiled: CompiledBattleParticles, index: number, elapsedMs: number): ParticlePose {
  if (!Number.isInteger(index) || !compiled.coefficients[index] || !Number.isFinite(elapsedMs) || elapsedMs < 0)
    throw new Error('Invalid battle particle sample');
  const c = compiled.coefficients[index]!;
  const age = elapsedMs / compiled.recipe.durationMs - c.born;
  const t = Math.max(0, Math.min(c.life, age));
  return { x: compiled.recipe.origin.x + c.vx * t, y: compiled.recipe.origin.y + c.vy * t + c.gravity * t * t,
    rotation: c.angle + c.spin * t, scale: c.scale,
    alpha: age < 0 || age >= c.life ? 0 : Math.min(1, age / .04) * Math.min(1, (c.life - age) / .2) };
}

/** Uses the game's Pixi 8 renderer; caller owns time, painted texture, attachment and disposal. */
export class SeededBattleEmitter {
  readonly container: ParticleContainer<Particle>;
  readonly compiled: CompiledBattleParticles;
  private readonly particles: Particle[];
  private disposed = false;
  constructor(recipe: BattleParticleRecipe, texture: Texture) {
    this.compiled = compileBattleParticles(recipe);
    this.particles = this.compiled.coefficients.map(() => new Particle({ texture, anchorX: .5, anchorY: .5, alpha: 0 }));
    this.container = new ParticleContainer<Particle>({ texture, particles: this.particles,
      dynamicProperties: { position: true, rotation: true, color: true, vertex: false, uvs: false } });
    // Reach/spread + half the painted extent safely bounds every analytic trajectory.
    const extent = Math.max(texture.width, texture.height) * recipe.particleScale;
    const rx = recipe.reach + extent, ry = recipe.spread * 1.5 + extent;
    this.container.boundsArea = new Rectangle(recipe.origin.x - rx, recipe.origin.y - ry, rx * 2, ry * 2);
    this.update(0);
  }
  update(elapsedMs: number): void {
    if (this.disposed) throw new Error('Battle emitter disposed');
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new Error('Invalid battle particle time');
    this.particles.forEach((particle, i) => {
      const pose = sampleBattleParticle(this.compiled, i, elapsedMs);
      particle.x = pose.x; particle.y = pose.y; particle.rotation = pose.rotation;
      particle.scaleX = particle.scaleY = pose.scale; particle.alpha = pose.alpha;
    });
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.container.destroy({ texture: false, textureSource: false });
  }
}
