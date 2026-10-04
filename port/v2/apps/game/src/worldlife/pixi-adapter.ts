/** @module worldlife/pixi-adapter [app] — draws a WorldLifeSampleV1 onto Pixi 8 display objects.
 * Structurally typed against Pixi 8 (Container / Graphics / Sprite fields it touches) so the
 * module needs no pixi import and typechecks under the root config; `main.ts` wiring passes
 * `{ container: () => new Container(), graphics: () => new Graphics() }`. The clock is injected;
 * reduced motion samples at t=0 (same layers, same counts, nothing moves). */
import { sampleWorldLife, type WorldLifeSampleV1 } from './sampler.js';
import type { WorldLifeSpecV1 } from './spec.js';

export interface WorldLifeNodeLike {
  x: number; y: number; alpha: number; rotation: number; visible: boolean;
  destroy(): void;
}
export interface WorldLifeGraphicsLike extends WorldLifeNodeLike {
  clear(): unknown; moveTo(x: number, y: number): unknown; lineTo(x: number, y: number): unknown;
  circle(x: number, y: number, radius: number): unknown;
  stroke(style: Readonly<{ width: number; color: number; alpha: number }>): unknown;
  fill(style: Readonly<{ color: number; alpha: number }>): unknown;
}
export interface WorldLifeContainerLike extends WorldLifeNodeLike {
  addChild(child: WorldLifeNodeLike): unknown; removeChild(child: WorldLifeNodeLike): unknown;
}
export interface WorldLifeDisplayFactoryV1 {
  container(): WorldLifeContainerLike;
  graphics(): WorldLifeGraphicsLike;
  /** Optional textured sprites for drift blobs and fliers; Graphics blobs/dots are the fallback. */
  sprite?(kind: 'drift' | 'flier'): WorldLifeNodeLike;
}
export interface WorldLifeFoliageLike { rotation: number; }

export class WorldLifePixiAdapter {
  readonly container: WorldLifeContainerLike;
  readonly #spec: WorldLifeSpecV1;
  readonly #clock: () => number;
  readonly #origin: number;
  readonly #streaks: WorldLifeGraphicsLike;
  readonly #water: WorldLifeGraphicsLike;
  readonly #lights: WorldLifeGraphicsLike;
  readonly #drift: readonly WorldLifeNodeLike[];
  readonly #fliers: readonly WorldLifeNodeLike[];
  readonly #foliage = new Map<WorldLifeFoliageLike, Readonly<{ band: 0 | 1 | 2; base: number }>>();
  #width: number; #height: number;
  #reduced = false;
  #disposed = false;
  #last: WorldLifeSampleV1 | null = null;

  constructor(options: Readonly<{
    spec: WorldLifeSpecV1; factory: WorldLifeDisplayFactoryV1; clock: () => number;
    width?: number; height?: number; reducedMotion?: boolean;
  }>) {
    this.#spec = options.spec; this.#clock = options.clock; this.#origin = options.clock();
    this.#width = options.width ?? options.spec.frame.width; this.#height = options.height ?? options.spec.frame.height;
    this.#reduced = options.reducedMotion === true;
    const f = options.factory;
    this.container = f.container();
    this.#drift = options.spec.drift.blobs.map(() => this.#node(f, 'drift'));
    this.#water = f.graphics(); this.container.addChild(this.#water);
    this.#lights = f.graphics(); this.container.addChild(this.#lights);
    this.#fliers = (options.spec.fliers?.paths ?? []).map(() => this.#node(f, 'flier'));
    this.#streaks = f.graphics(); this.container.addChild(this.#streaks);
    this.update();
  }

  get reducedMotion(): boolean { return this.#reduced; }
  get lastSample(): WorldLifeSampleV1 | null { return this.#last; }

  setReducedMotion(on: boolean): void { this.#assertLive(); this.#reduced = on; this.update(); }
  resize(width: number, height: number): void { this.#assertLive(); this.#width = width; this.#height = height; this.update(); }
  attachFoliage(node: WorldLifeFoliageLike, band: 0 | 1 | 2): void { this.#assertLive(); this.#foliage.set(node, { band, base: node.rotation }); }
  detachFoliage(node: WorldLifeFoliageLike): void { const e = this.#foliage.get(node); if (e) { node.rotation = e.base; this.#foliage.delete(node); } }

  /** Samples the injected clock (relative to construction) and redraws every layer. */
  update(): WorldLifeSampleV1 {
    this.#assertLive();
    const ms = Math.max(0, this.#clock() - this.#origin);
    const s = sampleWorldLife(this.#spec, ms, { reducedMotion: this.#reduced });
    this.#draw(s); this.#last = s; return s;
  }

  dispose(): void {
    if (this.#disposed) return;
    for (const [node, e] of this.#foliage) node.rotation = e.base;
    this.#foliage.clear();
    for (const n of [...this.#drift, ...this.#fliers, this.#water, this.#lights, this.#streaks]) { this.container.removeChild(n); n.destroy(); }
    this.container.destroy();
    this.#last = null; this.#disposed = true;
  }

  #node(f: WorldLifeDisplayFactoryV1, kind: 'drift' | 'flier'): WorldLifeNodeLike {
    const n = f.sprite ? f.sprite(kind) : f.graphics();
    this.container.addChild(n); return n;
  }
  #assertLive(): void { if (this.#disposed) throw new Error('world life adapter is disposed'); }

  #draw(s: WorldLifeSampleV1): void {
    const w = this.#width, h = this.#height, spec = this.#spec;
    const g = this.#streaks; g.clear();
    const p = spec.precipitation;
    if (p) {
      for (let i = 0; i < s.streaks.length; i += 5) { g.moveTo(s.streaks[i]! * w, s.streaks[i + 1]! * h); g.lineTo(s.streaks[i + 2]! * w, s.streaks[i + 3]! * h); }
      if (s.streaks.length) g.stroke({ width: p.kind === 'rain' ? 1 : 2, color: p.color, alpha: p.opacity });
    }
    s.driftOffsets.forEach(([x, y, r, alpha], i) => {
      const n = this.#drift[i]!; n.x = x * w; n.y = y * h; n.alpha = alpha;
      if (isGraphics(n)) { n.clear(); n.circle(0, 0, r * h); n.fill({ color: spec.drift.color, alpha: 1 }); }
    });
    const water = this.#water; water.clear(); water.visible = spec.shimmer !== null;
    if (spec.shimmer) {
      const y0 = spec.frame.groundLine * h, amp = spec.shimmer.amplitude * 0.02 * h;
      s.shimmerBandPhases.forEach((ph, i) => {
        const y = y0 + (i + 1) * 0.03 * h;
        water.moveTo(0, y);
        for (let x = 0; x <= w; x += w / 32) water.lineTo(x, y + amp * Math.sin((x / w) * Math.PI * 2 * (3 + i) + ph * Math.PI * 2));
        water.stroke({ width: 1, color: 0xd8ecf6, alpha: 0.18 * spec.illumination + 0.06 });
      });
    }
    s.fliers.forEach(([x, y], i) => {
      const n = this.#fliers[i]!; n.x = x * w; n.y = y * h; n.visible = x >= 0 && x <= 1;
      if (isGraphics(n)) { n.clear(); n.circle(0, 0, spec.fliers?.kind === 'bird' ? 2 : 3); n.fill({ color: 0x2c3138, alpha: 0.85 }); }
    });
    const lights = this.#lights; lights.clear(); lights.visible = spec.flicker !== null;
    for (const [x, y, k] of s.flicker) { lights.circle(x * w, y * h, 6 + 10 * k); lights.fill({ color: 0xbfe6ff, alpha: 0.35 * k }); }
    for (const [node, e] of this.#foliage) node.rotation = e.base + (s.swayAngles[e.band] ?? 0);
  }
}

function isGraphics(n: WorldLifeNodeLike): n is WorldLifeGraphicsLike {
  return typeof (n as WorldLifeGraphicsLike).circle === 'function' && typeof (n as WorldLifeGraphicsLike).clear === 'function';
}
