import { describe, expect, it } from 'vitest';
import {
  compileWorldLife, WorldLifePixiAdapter,
  type WorldLifeCardV1, type WorldLifeContainerLike, type WorldLifeDisplayFactoryV1, type WorldLifeGraphicsLike, type WorldLifeNodeLike,
} from '../apps/game/src/worldlife/index.js';

// Structural Pixi 8 doubles: the adapter only touches the fields these expose.
class FakeNode implements WorldLifeNodeLike {
  x = 0; y = 0; alpha = 1; rotation = 0; visible = true; destroyed = false;
  destroy(): void { this.destroyed = true; }
}
class FakeGraphics extends FakeNode implements WorldLifeGraphicsLike {
  calls: string[] = [];
  clear(): this { this.calls = []; return this; }
  moveTo(x: number, y: number): this { this.calls.push(`M${x.toFixed(3)},${y.toFixed(3)}`); return this; }
  lineTo(x: number, y: number): this { this.calls.push(`L${x.toFixed(3)},${y.toFixed(3)}`); return this; }
  circle(x: number, y: number, r: number): this { this.calls.push(`C${x.toFixed(3)},${y.toFixed(3)},${r.toFixed(3)}`); return this; }
  stroke(s: { width: number; color: number; alpha: number }): this { this.calls.push(`S${s.width},${s.color},${s.alpha.toFixed(4)}`); return this; }
  fill(s: { color: number; alpha: number }): this { this.calls.push(`F${s.color},${s.alpha.toFixed(4)}`); return this; }
}
class FakeContainer extends FakeNode implements WorldLifeContainerLike {
  children = new Set<WorldLifeNodeLike>();
  addChild(c: WorldLifeNodeLike): void { this.children.add(c); }
  removeChild(c: WorldLifeNodeLike): void { this.children.delete(c); }
}
const makeFactory = (withSprites = false) => {
  const made: FakeNode[] = [];
  const factory: WorldLifeDisplayFactoryV1 = {
    container: () => { const c = new FakeContainer(); made.push(c); return c; },
    graphics: () => { const g = new FakeGraphics(); made.push(g); return g; },
    ...(withSprites ? { sprite: () => { const s = new FakeNode(); made.push(s); return s; } } : {}),
  };
  return { factory, made };
};
const TEMPERATE: WorldLifeCardV1 = { biome: 'temperate', weather: 'rain', water: 'liquid', timeOfDay: 'day' };
const SEED = 593405465;
const snapshot = (made: readonly FakeNode[]): string => JSON.stringify(made.map((n) => [n.x, n.y, n.alpha, n.rotation, n.visible, (n as FakeGraphics).calls ?? null]));

describe('worldlife pixi adapter', () => {
  it('draws every compiled layer from the injected clock and redraws as it advances', () => {
    const spec = compileWorldLife(TEMPERATE, SEED, 'landfall');
    let now = 1000; const { factory, made } = makeFactory();
    const adapter = new WorldLifePixiAdapter({ spec, factory, clock: () => now, width: 800, height: 450 });
    const container = adapter.container as FakeContainer;
    expect(container.children.size).toBe(spec.drift.count + spec.fliers!.count + 3);
    const first = snapshot(made);
    const streakGraphics = [...container.children].filter((c) => c instanceof FakeGraphics && c.calls.some((k) => k.startsWith(`S1,${spec.precipitation!.color},`)));
    expect(streakGraphics.length).toBe(1);
    expect((streakGraphics[0] as FakeGraphics).calls.filter((k) => k.startsWith('M')).length).toBe(spec.precipitation!.count);
    now = 1500; adapter.update();
    expect(snapshot(made)).not.toBe(first);
    expect(adapter.lastSample?.ms).toBe(500);
  });
  it('setReducedMotion(true) freezes at t=0 without changing what is drawn', () => {
    const spec = compileWorldLife(TEMPERATE, SEED, 'arena');
    const still = makeFactory(); const a0 = new WorldLifePixiAdapter({ spec, factory: still.factory, clock: () => 0 });
    const atZero = snapshot(still.made); a0.dispose();
    let now = 0; const live = makeFactory();
    const adapter = new WorldLifePixiAdapter({ spec, factory: live.factory, clock: () => now });
    now = 4321; adapter.setReducedMotion(true);
    expect(snapshot(live.made)).toBe(atZero);
    now = 9999; adapter.update();
    expect(snapshot(live.made)).toBe(atZero);
    expect((adapter.container as FakeContainer).children.size).toBe(spec.drift.count + spec.fliers!.count + 3); // same layers, same counts
    adapter.setReducedMotion(false); adapter.update();
    expect(snapshot(live.made)).not.toBe(atZero); // negative control: motion resumes
  });
  it('sways attached foliage by band and restores base rotation on detach and dispose', () => {
    const spec = compileWorldLife({ ...TEMPERATE, strength: 'storm' }, SEED, 'landfall');
    let now = 0; const { factory } = makeFactory();
    const adapter = new WorldLifePixiAdapter({ spec, factory, clock: () => now });
    const near = { rotation: 0.3 }, far = { rotation: -0.1 };
    adapter.attachFoliage(near, 0); adapter.attachFoliage(far, 2);
    let moved = false;
    for (now = 0; now < 3000; now += 100) {
      const s = adapter.update();
      expect(near.rotation).toBeCloseTo(0.3 + s.swayAngles[0]!, 12); expect(far.rotation).toBeCloseTo(-0.1 + s.swayAngles[2]!, 12);
      if (Math.abs(near.rotation - 0.3) > 0.01) moved = true;
    }
    expect(moved).toBe(true);
    adapter.detachFoliage(far); expect(far.rotation).toBe(-0.1);
    adapter.dispose(); expect(near.rotation).toBe(0.3);
  });
  it('uses factory sprites for drift and fliers when offered', () => {
    const spec = compileWorldLife(TEMPERATE, 11, 'landfall');
    const { factory, made } = makeFactory(true);
    new WorldLifePixiAdapter({ spec, factory, clock: () => 0 });
    expect(made.filter((n) => !(n instanceof FakeGraphics) && !(n instanceof FakeContainer)).length).toBe(spec.drift.count + spec.fliers!.count);
  });
  it('dispose releases every display object and refuses further use', () => {
    const spec = compileWorldLife(TEMPERATE, SEED, 'landfall');
    const { factory, made } = makeFactory();
    const adapter = new WorldLifePixiAdapter({ spec, factory, clock: () => 0 });
    adapter.dispose();
    expect(made.every((n) => n.destroyed)).toBe(true);
    expect((adapter.container as FakeContainer).children.size).toBe(0);
    expect(adapter.lastSample).toBeNull();
    expect(() => adapter.update()).toThrow(/disposed/);
    expect(() => adapter.dispose()).not.toThrow();
  });
});
