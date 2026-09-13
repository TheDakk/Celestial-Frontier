import { describe, it, expect, vi } from 'vitest';
import { ParticleContainer, Texture } from 'pixi.js';
import { compileBattleParticles, sampleBattleParticle, SeededBattleEmitter, type BattleParticleRecipe } from './seeded-battle-emitter.js';
const recipe: BattleParticleRecipe = { seed: 133, phase: 'impact', count: 24, durationMs: 450,
  origin: { x: 300, y: 200 }, direction: 1, reach: 80, spread: 50, particleScale: .2 };
describe('Pixi 8 seeded battle emitter', () => {
  it('does not read clock or ambient random during compilation; detached recipe replays', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('ambient RNG'); });
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock'); });
    try {
      const a = compileBattleParticles(recipe), b = compileBattleParticles(recipe);
      expect(a).toEqual(b);
      expect(sampleBattleParticle(a, 0, 210)).toEqual(sampleBattleParticle(b, 0, 210));
      expect(compileBattleParticles({ ...recipe, seed: 134 }).coefficients).not.toEqual(a.coefficients);
      expect(compileBattleParticles({ ...recipe, phase: 'travel' }).coefficients).not.toEqual(a.coefficients);
      expect(() => Date.now()).toThrow('clock'); expect(() => Math.random()).toThrow('ambient RNG');
    } finally { random.mockRestore(); clock.mockRestore(); }
  });
  it('updates actual Pixi 8 particles identically through 30 Hz, 60 Hz and seek paths; never owns the texture', () => {
    const a = new SeededBattleEmitter(recipe, Texture.EMPTY), b = new SeededBattleEmitter(recipe, Texture.EMPTY);
    expect(a.container).toBeInstanceOf(ParticleContainer);
    const snapshot = (x: SeededBattleEmitter) => x.container.particleChildren.map(p => ({ x:p.x,y:p.y,rotation:p.rotation,alpha:p.alpha }));
    try {
      for(let frame=0;frame<=12;frame++)a.update(frame*1000/60);
      for(let frame=0;frame<=6;frame++)b.update(frame*1000/30);
      expect(snapshot(a)).toEqual(snapshot(b));
      const initial=snapshot(a);a.update(400);a.update(200);expect(snapshot(a)).toEqual(initial);
      expect(initial.some(p=>p.alpha>0)).toBe(true);a.update(1000);expect(snapshot(a).every(p=>p.alpha===0)).toBe(true);
      expect(() => a.update(NaN)).toThrow();
    } finally { a.destroy(); b.destroy(); }
    expect(Texture.EMPTY.destroyed).toBe(false);expect(()=>a.update(0)).toThrow('disposed');a.destroy();
  });
  it('refuses invalid seeds, phases, budgets and time; zero-count reduced mode is supported', () => {
    for(const patch of [{seed:-1},{seed:1.5},{seed:2**32},{phase:'snow'},{count:201},{durationMs:0},{reach:Infinity},{particleScale:0},{origin:{x:NaN,y:0}}])
      expect(()=>compileBattleParticles({...recipe,...patch} as BattleParticleRecipe)).toThrow('Invalid');
    expect(compileBattleParticles({...recipe,count:0}).coefficients).toHaveLength(0);
    const compiled=compileBattleParticles(recipe);expect(()=>sampleBattleParticle(compiled,24,0)).toThrow();
    expect(()=>sampleBattleParticle(compiled,0,-1)).toThrow();
  });
});
