import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SurfacePlanetTurnViewV1, PLANET_SURFACE_TURN_DEADLINE_MS,
  PLANET_SURFACE_TURN_ERROR_SCHEMA } from './planet-surface-turn-view.js';
import { surfaceTurnAngleV1 } from './planet-surface-turn-math.js';
import { PLANET_TURN_ATLAS_WIDTH as WIDTH, PLANET_TURN_ATLAS_HEIGHT as HEIGHT,
  PLANET_TURN_ATLAS_U_EXTENT as EXTENT } from './planet-surface-atlas.js';

// Keep GPU and DOM substitutes at their ownership boundaries; execute the real view and math.
const pixi = vi.hoisted(() => {
  class GlProgram {
    static instances: GlProgram[] = [];
    destroyed = false;
    destroy = vi.fn(() => { this.destroyed = true; });
    constructor(readonly options: unknown) { GlProgram.instances.push(this); }
  }
  class MeshGeometry {
    destroyed = false;
    destroy = vi.fn((_destroyBuffers: boolean) => { this.destroyed = true; });
    constructor(readonly options: {
      positions: Float32Array; uvs: Float32Array; indices: Uint32Array;
    }) {}
  }
  class UniformGroup {
    static instances: UniformGroup[] = [];
    readonly uniforms: Record<string, number>;
    constructor(descriptors: Record<string, { value: number }>) {
      UniformGroup.instances.push(this);
      this.uniforms = Object.fromEntries(Object.entries(descriptors).map(([key, v]) => [key, v.value]));
    }
  }
  class Shader {
    destroyed = false;
    destroy = vi.fn((destroyProgram: boolean) => {
      this.destroyed = true;
      if (destroyProgram) this.options.glProgram.destroy();
    });
    constructor(readonly options: { glProgram: GlProgram;
      resources: { uAtlas: unknown; turnUniforms: UniformGroup } }) {}
  }
  class Mesh {
    destroyed = false;
    visible = true;
    eventMode = 'auto';
    parent: { removeChild(child: object): void } | null = null;
    destroy = vi.fn(() => { this.destroyed = true; });
    removeFromParent = vi.fn(() => { this.parent?.removeChild(this); this.parent = null; });
    constructor(readonly options: { geometry: MeshGeometry; shader: Shader; texture: unknown }) {}
  }
  return { GlProgram, MeshGeometry, UniformGroup, Shader, Mesh };
});
vi.mock('pixi.js', () => pixi);

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor(readonly url: URL, readonly options: unknown) { FakeWorker.instances.push(this); }
  emit(data: unknown): void { this.onmessage?.({ data }); }
}
function makeCanvas() {
  const context = {
    createImageData: vi.fn((width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) })),
    putImageData: vi.fn(),
  };
  return { width: 0, height: 0, getContext: vi.fn(() => context), context };
}
const canvases: ReturnType<typeof makeCanvas>[] = [];
const views: SurfacePlanetTurnViewV1[] = [];
function atlas() {
  const pixels = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  pixels.set([11, 22, 33, 255]); pixels.set([44, 55, 66, 255], pixels.length - 4);
  return { schema: 'cf-earth-turn-result/v1', sourceSeed: 133,
    width: WIDTH, height: HEIGHT, uExtent: EXTENT, pixels };
}
function fixture(material?: boolean) {
  const fallback = { visible: true, destroyed: false }, sibling = {};
  const children: object[] = [fallback, sibling];
  const parent = {
    children,
    getChildIndex: (child: object) => children.indexOf(child),
    addChildAt: (child: InstanceType<typeof pixi.Mesh>, index: number) => {
      children.splice(index, 0, child); child.parent = parent;
    },
    removeChild: (child: object) => { const index = children.indexOf(child); if (index >= 0) children.splice(index, 1); },
  };
  const lease = {
    kind: 'scene-canvas', released: false,
    texture: { source: { pixelWidth: WIDTH, pixelHeight: HEIGHT }, destroyed: false },
    release: vi.fn(() => { if (lease.released) return false; lease.released = true; return true; }),
  };
  const state = { current: true };
  const acquireLease = vi.fn(() => lease);
  const options = { parent, fallback, diameter: 420, planet: { seed: 133, type: 'terran' },
    facts: null, isCurrent: () => state.current, acquireLease,
    ...(material === undefined ? {} : { material }) };
  const view = new SurfacePlanetTurnViewV1(options as unknown as ConstructorParameters<typeof SurfacePlanetTurnViewV1>[0]);
  views.push(view);
  return { view, parent, fallback, sibling, lease, state, acquireLease,
    worker: FakeWorker.instances.at(-1)! };
}
function mounted(material?: boolean) {
  const f = fixture(material); f.worker.emit(atlas());
  const mesh = f.parent.children[1] as InstanceType<typeof pixi.Mesh>;
  expect(mesh).toBeInstanceOf(pixi.Mesh);
  return { ...f, mesh, geometry: mesh.options.geometry, shader: mesh.options.shader,
    uniforms: mesh.options.shader.options.resources.turnUniforms, canvas: canvases.at(-1)! };
}

const clock = { now: 0 };
beforeEach(() => {
  vi.useFakeTimers(); FakeWorker.instances.length = 0; canvases.length = 0;
  vi.stubGlobal('Worker', FakeWorker);
  clock.now = 0; vi.stubGlobal('performance', { now: () => clock.now });
  vi.stubGlobal('document', { createElement: vi.fn((tag: string) => {
    expect(tag).toBe('canvas'); const canvas = makeCanvas(); canvases.push(canvas); return canvas;
  }) });
});
afterEach(() => {
  for (const view of views.splice(0)) view.dispose();
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals();
});

describe('SurfacePlanetTurnViewV1 lifetime', () => {
  it('cancels a pending worker and deadline, and cannot mount a queued late result', () => {
    const f = fixture(), queued = f.worker.onmessage!;
    expect(f.worker.postMessage).toHaveBeenCalledWith({ schema: 'cf-earth-turn-request/v1',
      planet: { seed: 133, type: 'terran' }, facts: null });
    expect(f.worker.options).toEqual({ type: 'module', name: 'cf-earth-surface-turn' });
    expect(vi.getTimerCount()).toBe(1);
    f.view.dispose();
    expect(f.worker.terminate).toHaveBeenCalledTimes(1);
    expect(f.worker.onmessage).toBeNull(); expect(f.worker.onerror).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    queued({ data: atlas() }); vi.advanceTimersByTime(12000); f.view.dispose();
    expect(f.view.snapshot()).toMatchObject({ status: 'disposed', error: null,
      workerActive: false, meshLive: false, textureLive: false, canvasPixels: 0, canonicalVisible: true });
    expect(f.parent.children).toEqual([f.fallback, f.sibling]);
    expect(f.acquireLease).not.toHaveBeenCalled(); expect(canvases).toHaveLength(0);
    expect(f.worker.terminate).toHaveBeenCalledTimes(1);
  });

  it('mounts the real-shaped atlas and pauses, resets and settles through actual ticks', () => {
    const f = mounted();
    expect(f.worker.terminate).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
    expect(f.parent.children).toEqual([f.fallback, f.mesh, f.sibling]);
    expect(f.mesh.eventMode).toBe('none'); expect(f.mesh.visible).toBe(false);
    expect(f.acquireLease).toHaveBeenCalledWith(f.canvas);
    const copied = f.canvas.context.putImageData.mock.calls[0]![0] as { data: Uint8ClampedArray };
    expect(Array.from(copied.data.slice(0, 4))).toEqual([11, 22, 33, 255]);
    expect(Array.from(copied.data.slice(-4))).toEqual([44, 55, 66, 255]);
    expect(Array.from(f.geometry.options.positions)).toEqual([-210, -210, 210, -210, 210, 210, -210, 210]);
    expect(f.shader.options.resources.uAtlas).toBe(f.lease.texture.source);
    expect(f.view.snapshot()).toMatchObject({ status: 'ready', meshLive: true,
      textureLive: true, canvasPixels: WIDTH * HEIGHT, canonicalVisible: true, workerStarts: 1 });
    f.view.tick(100, true, true, true);
    expect(f.view.snapshot().elapsedSeconds).toBe(0.1);
    expect(f.view.snapshot().angle).toBe(surfaceTurnAngleV1(0.1));
    expect(f.uniforms.uniforms.uAngle).toBeGreaterThan(0);
    expect(f.mesh.visible).toBe(true); expect(f.fallback.visible).toBe(false);
    f.view.tick(100, false, true, true);
    expect(f.view.snapshot().elapsedSeconds).toBe(0.1);
    expect(f.mesh.visible).toBe(false); expect(f.fallback.visible).toBe(true);
    f.view.tick(100, true, true, true);
    expect(f.view.snapshot().elapsedSeconds).toBe(0.2);
    for (const [motion, effects] of [[false, true], [true, false]] as const) {
      f.view.tick(100, true, motion, effects);
      expect(f.view.snapshot()).toMatchObject({ elapsedSeconds: 0, angle: 0, shown: false, canonicalVisible: true });
      expect(f.uniforms.uniforms.uAngle).toBe(0);
      f.view.tick(1000, true, true, true); // A long frame advances only the bounded 100 ms.
      expect(f.view.snapshot().elapsedSeconds).toBe(0.1);
    }
    for (const invalid of [NaN, Infinity, -1, 0]) f.view.tick(invalid, true, true, true);
    expect(f.view.snapshot().elapsedSeconds).toBe(0.1);
    for (let i = 0; i < 181; i++) f.view.tick(100, true, true, true);
    expect(f.view.snapshot()).toMatchObject({ elapsedSeconds: 18, angle: 0 });
    f.view.tick(1000, true, true, true);
    expect(f.view.snapshot()).toMatchObject({ elapsedSeconds: 18, angle: 0, workerStarts: 1 });
    expect(f.uniforms.uniforms.uAngle).toBe(0);
  });

  it('refuses wrong dimensions, world identity or pixel shape while retaining the canonical sprite', () => {
    const valid = atlas();
    for (const mutation of [{ width: WIDTH - 1 }, { height: HEIGHT - 1 }, { sourceSeed: 132 },
      { uExtent: EXTENT + 0.1 }, { pixels: new Uint8ClampedArray(4) }, { pixels: [] }]) {
      const f = fixture(); f.worker.emit({ ...valid, ...mutation });
      expect(f.view.snapshot()).toMatchObject({ status: 'failed', error: 'invalid Earth surface atlas response',
        workerActive: false, meshLive: false, textureLive: false, canvasPixels: 0, canonicalVisible: true });
      expect(f.worker.terminate).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
      expect(f.acquireLease).not.toHaveBeenCalled();
      expect(f.parent.children).toEqual([f.fallback, f.sibling]);
    }
    expect(canvases).toHaveLength(0);
  });

  it('releases mounted ownership on route loss and stays disposed through repeated and late work', () => {
    const f = fixture(), queued = f.worker.onmessage!; f.worker.emit(atlas());
    const mesh = f.parent.children[1] as InstanceType<typeof pixi.Mesh>;
    const { shader, geometry } = mesh.options, canvas = canvases.at(-1)!;
    f.view.tick(100, true, true, true); f.state.current = false; f.view.tick(100, true, true, true);
    expect(mesh.destroyed).toBe(true); expect(mesh.parent).toBeNull();
    expect(shader.destroyed).toBe(true); expect(geometry.destroyed).toBe(true);
    expect(shader.destroy).toHaveBeenCalledWith(false);
    expect(geometry.destroy).toHaveBeenCalledWith(true);
    expect(shader.options.glProgram.destroyed).toBe(false);
    expect(shader.options.glProgram.destroy).not.toHaveBeenCalled();
    expect(f.lease.released).toBe(true); expect([canvas.width, canvas.height]).toEqual([1, 1]);
    expect(f.parent.children).toEqual([f.fallback, f.sibling]);
    expect(f.view.snapshot()).toMatchObject({ status: 'disposed', shown: false,
      meshLive: false, textureLive: false, canvasPixels: 0, canonicalVisible: true });
    queued({ data: atlas() }); f.view.tick(100, true, true, true); f.view.dispose();
    for (const release of [mesh.destroy, shader.destroy, geometry.destroy, f.lease.release]) {
      expect(release).toHaveBeenCalledTimes(1);
    }
    expect(f.acquireLease).toHaveBeenCalledTimes(1); expect(canvases).toHaveLength(1);
    const next = mounted();
    expect(next.shader).not.toBe(shader); expect(next.geometry).not.toBe(geometry);
    expect(next.shader.options.glProgram).toBe(shader.options.glProgram);
    expect(next.uniforms).toBe(shader.options.resources.turnUniforms);
    expect(next.uniforms.uniforms.uAngle).toBe(0);
    expect(pixi.GlProgram.instances).toHaveLength(1);
    expect(pixi.UniformGroup.instances).toHaveLength(1);
    next.view.tick(100, true, true, true);
    expect(next.uniforms.uniforms.uAngle).toBe(surfaceTurnAngleV1(0.1));
    next.view.dispose();
    expect(next.shader.destroy).toHaveBeenCalledWith(false);
    expect(next.geometry.destroy).toHaveBeenCalledWith(true);
    expect(next.shader.options.glProgram.destroy).not.toHaveBeenCalled();
  });

  it('resets the shared material uniform through enabled, omitted and explicitly false views', () => {
    const expectMaterial = (f: ReturnType<typeof mounted>, enabled: boolean): void => {
      expect(f.view.snapshot().materialEnabled).toBe(enabled);
      expect(f.uniforms.uniforms.uMaterial).toBe(enabled ? 1 : 0);
    };
    let shared: ReturnType<typeof mounted> | null = null;
    for (const material of [true, undefined, false]) {
      const f = mounted(material), enabled = material === true;
      expectMaterial(f, enabled);
      if (shared) {
        expect(f.shader.options.glProgram).toBe(shared.shader.options.glProgram);
        expect(f.uniforms).toBe(shared.uniforms);
        expect(f.mesh).not.toBe(shared.mesh); expect(f.shader).not.toBe(shared.shader);
      }
      shared = f;
      f.view.tick(100, true, true, true);
      expectMaterial(f, enabled);
      expect(f.view.snapshot()).toMatchObject({ status: 'ready', shown: true,
        meshLive: true, textureLive: true, canonicalVisible: false });
      // The same observer must reject both a missing enabled material and leaked
      // predecessor state on a default/false view, even though its option is correct.
      const correct = f.uniforms.uniforms.uMaterial!;
      try {
        f.uniforms.uniforms.uMaterial = enabled ? 0 : 1;
        expect(() => expectMaterial(f, enabled)).toThrow();
      } finally { f.uniforms.uniforms.uMaterial = correct; }
      expectMaterial(f, enabled);
      f.view.dispose();
      expect(f.view.snapshot()).toMatchObject({ status: 'disposed', error: null,
        materialEnabled: enabled, meshLive: false, textureLive: false,
        canvasPixels: 0, canonicalVisible: true });
      expect(f.parent.children).toEqual([f.fallback, f.sibling]);
      expect(f.mesh.destroyed).toBe(true); expect(f.geometry.destroyed).toBe(true);
      expect(f.shader.destroy).toHaveBeenCalledWith(false);
      expect(f.geometry.destroy).toHaveBeenCalledWith(true);
      expect(f.lease.release).toHaveBeenCalledTimes(1); expect(f.lease.released).toBe(true);
      expect([f.canvas.width, f.canvas.height]).toEqual([1, 1]);
      expect(f.shader.options.glProgram.destroy).not.toHaveBeenCalled();
    }
    expect(pixi.GlProgram.instances).toHaveLength(1);
    expect(pixi.UniformGroup.instances).toHaveLength(1);
    expect(FakeWorker.instances).toHaveLength(3);
    for (const worker of FakeWorker.instances) expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('contains a destructor fault while releasing every remaining owner and recording the error', () => {
    const f = mounted(); f.view.tick(100, true, true, true);
    f.mesh.destroy.mockImplementation(() => { throw new Error('injected mesh destruction'); });
    expect(() => f.view.dispose()).not.toThrow();
    expect(f.parent.children).toEqual([f.fallback, f.sibling]);
    expect(f.shader.destroy).toHaveBeenCalledWith(false); expect(f.shader.destroyed).toBe(true);
    expect(f.shader.options.glProgram.destroy).not.toHaveBeenCalled();
    expect(f.geometry.destroy).toHaveBeenCalledWith(true);
    expect(f.geometry.destroyed).toBe(true); expect(f.lease.released).toBe(true);
    expect([f.canvas.width, f.canvas.height]).toEqual([1, 1]);
    expect(f.view.snapshot()).toMatchObject({ status: 'disposed', meshLive: false, textureLive: false,
      canvasPixels: 0, shown: false, canonicalVisible: true });
    expect(f.view.snapshot().error).toContain('injected mesh destruction');
    f.view.dispose();
    for (const release of [f.mesh.destroy, f.shader.destroy, f.geometry.destroy, f.lease.release]) {
      expect(release).toHaveBeenCalledTimes(1);
    }
  });
});

describe('K27/K28: monotonic deadline and the worker error reason', () => {
  it('refuses an atlas at the monotonic deadline before the throttled timer fires', () => {
    const f = fixture();
    expect(PLANET_SURFACE_TURN_DEADLINE_MS).toBe(12_000);
    clock.now = PLANET_SURFACE_TURN_DEADLINE_MS;
    expect(vi.getTimerCount()).toBe(1);
    f.worker.emit(atlas());
    expect(f.view.snapshot()).toMatchObject({ status: 'failed', error: 'Earth surface atlas timed out',
      workerActive: false, meshLive: false, textureLive: false, canvasPixels: 0, canonicalVisible: true });
    expect(f.worker.terminate).toHaveBeenCalledOnce();
    expect(f.acquireLease).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(PLANET_SURFACE_TURN_DEADLINE_MS);
    expect(f.view.snapshot()).toMatchObject({ status: 'failed', error: 'Earth surface atlas timed out' });
    expect(f.parent.children).toEqual([f.fallback, f.sibling]);
  });

  it('mounts an atlas one millisecond before the boundary (direction control)', () => {
    const f = fixture();
    clock.now = PLANET_SURFACE_TURN_DEADLINE_MS - 1;
    f.worker.emit(atlas());
    expect(f.view.snapshot()).toMatchObject({ status: 'ready', workerActive: false, meshLive: true, textureLive: true });
    expect(f.acquireLease).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('surfaces the worker error reason instead of the generic shape refusal', () => {
    const f = fixture();
    f.worker.emit({ schema: PLANET_SURFACE_TURN_ERROR_SCHEMA, message: 'atlas facts refused: missing coastline' });
    expect(f.view.snapshot()).toMatchObject({ status: 'failed',
      error: 'Earth surface atlas worker error: atlas facts refused: missing coastline',
      workerActive: false, meshLive: false, canonicalVisible: true });
    expect(f.acquireLease).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    const blank = fixture();
    blank.worker.emit({ schema: PLANET_SURFACE_TURN_ERROR_SCHEMA, message: 42 });
    expect(blank.view.snapshot().error).toBe('Earth surface atlas worker error: no reason given');
    const long = fixture();
    long.worker.emit({ schema: PLANET_SURFACE_TURN_ERROR_SCHEMA, message: 'x'.repeat(400) });
    expect(long.view.snapshot().error).toHaveLength(256);
    // Negative control: a message under any other schema is still the shape refusal.
    const other = fixture();
    other.worker.emit({ schema: 'cf-earth-turn-error/v2', message: 'atlas facts refused' });
    expect(other.view.snapshot().error).toBe('invalid Earth surface atlas response');
  });
});
