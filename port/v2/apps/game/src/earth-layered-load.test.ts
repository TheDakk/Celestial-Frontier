import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EarthResidentLayerPlanV1 } from '@cf/art/earth-resident-layer';
import type { PaintedVistaLoadOptionsV1 } from './painted-vista-load.js';
import { EarthLayeredLoadV1 } from './earth-layered-load.js';
import { EARTH_LAYER_REQUEST, EARTH_LAYER_RESPONSE } from './earth-layered-protocol.js';

const painted = vi.hoisted(() => ({
  instances: [] as Array<{ options: PaintedVistaLoadOptionsV1; dispose: ReturnType<typeof vi.fn> }>,
  constructorThrows: false,
}));
vi.mock('./painted-vista-load.js', () => ({
  PaintedVistaLoadV1: class {
    readonly dispose = vi.fn();
    constructor(readonly options: PaintedVistaLoadOptionsV1) {
      if (painted.constructorThrows) throw new Error('background constructor failed');
      painted.instances.push(this);
    }
    snapshot() { return { disposed: this.dispose.mock.calls.length > 0 }; }
  },
}));

const PLAN: EarthResidentLayerPlanV1 = {
  schema: 'cf.art.earth-resident-layer.v1', sceneId: 'painted-earth-riverbank-v1',
  width: 960, height: 430, worldKey: 'fixture-earth',
  environmentFingerprint: 'fixture-environment', fullRosterFingerprint: 'fixture-roster', residents: [],
};
const TOKEN = 'earth-layer-fixture';
type FakeCanvas = { width: number; height: number; getContext: ReturnType<typeof vi.fn> };
type Listener = (event: { data?: unknown; message?: string; preventDefault: ReturnType<typeof vi.fn> }) => void;
const workers: FakeWorker[] = [];
const faults = { construct: false, post: false };
class FakeWorker {
  readonly listeners = new Map<string, Listener>();
  readonly terminate = vi.fn();
  readonly postMessage = vi.fn((_request: unknown) => {
    if (faults.post) throw new Error('worker post failed');
  });
  constructor(_url: URL, readonly options: WorkerOptions) {
    if (faults.construct) throw new Error('worker constructor failed');
    workers.push(this);
  }
  addEventListener(type: string, listener: Listener) { this.listeners.set(type, listener); }
  emit(type: string, data?: unknown) {
    const event = { data, message: 'resident painter failed', preventDefault: vi.fn() };
    this.listeners.get(type)?.(event); return event;
  }
}
function bitmap(width = 960, height = 430) { return { width, height, close: vi.fn() }; }
function result(image = bitmap(), token = TOKEN) {
  return { schema: EARTH_LAYER_RESPONSE, token, type: 'result', bitmap: image };
}
const owners: EarthLayeredLoadV1[] = [];
function fixture(options: {
  current?: boolean; currentThrows?: boolean; createThrows?: boolean;
  contextMissing?: boolean; copyThrows?: boolean;
  commit?: (background: HTMLCanvasElement, residents: HTMLCanvasElement) => boolean | 'retained-failure';
  fallbackThrows?: boolean;
} = {}) {
  const state = { current: options.current ?? true, currentThrows: options.currentThrows ?? false };
  const canvases: FakeCanvas[] = [];
  const drawImage = vi.fn(() => { if (options.copyThrows) throw new Error('resident copy failed'); });
  vi.stubGlobal('document', { createElement: vi.fn((tag: string) => {
    expect(tag).toBe('canvas');
    if (options.createThrows) throw new Error('resident canvas allocation failed');
    const canvas = { width: 0, height: 0,
      getContext: vi.fn(() => options.contextMissing ? null : { drawImage }) };
    canvases.push(canvas); return canvas;
  }) });
  const commit = vi.fn(options.commit ?? (() => true));
  const fallbackStops: Array<{ timers: number; workerStopped: boolean; backgroundStopped: boolean }> = [];
  const fallback = vi.fn((_error: unknown) => {
    fallbackStops.push({ timers: vi.getTimerCount(),
      workerStopped: workers.every(worker => worker.terminate.mock.calls.length === 1),
      backgroundStopped: painted.instances.every(load => load.dispose.mock.calls.length > 0) });
    if (options.fallbackThrows) throw new Error('fallback mount failed');
  });
  const loader = new EarthLayeredLoadV1({ plan: PLAN, token: TOKEN,
    isCurrent: () => { if (state.currentThrows) throw new Error('route check failed'); return state.current; },
    commit, fallback });
  owners.push(loader);
  return { loader, state, canvases, drawImage, commit, fallback, fallbackStops,
    worker: workers.at(-1), backgroundLoad: painted.instances.at(-1) };
}
function background(f: ReturnType<typeof fixture>) {
  const canvas = { width: 960, height: 430 } as HTMLCanvasElement;
  // Model only the painted loader's public ownership contract: a refused
  // canvas stays with that loader and is released; an accepted one transfers.
  const accepted = f.backgroundLoad!.options.commit(canvas);
  if (!accepted) { canvas.width = 1; canvas.height = 1; }
  return { canvas, accepted };
}
function failed(f: ReturnType<typeof fixture>) {
  expect(f.loader.snapshot()).toMatchObject({ status: 'failed', workerActive: false,
    deadlineActive: false, retainedCanvases: 0 });
  expect(f.fallback).toHaveBeenCalledOnce();
  expect(f.fallbackStops).toEqual([{ timers: 0, workerStopped: true, backgroundStopped: true }]);
  expect(vi.getTimerCount()).toBe(0);
}
beforeEach(() => {
  vi.useFakeTimers(); vi.stubGlobal('Worker', FakeWorker);
  workers.length = 0; painted.instances.length = 0;
  faults.construct = faults.post = painted.constructorThrows = false;
});
afterEach(() => {
  for (const owner of owners.splice(0)) owner.dispose();
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals();
});

describe('EarthLayeredLoadV1 pair ownership', () => {
  it.each(['background', 'residents'] as const)('publishes atomically with %s first and transfers both canvases', first => {
    const f = fixture(), image = bitmap();
    expect(f.worker!.postMessage).toHaveBeenCalledExactlyOnceWith({ schema: EARTH_LAYER_REQUEST, token: TOKEN, plan: PLAN });
    expect(f.worker!.options).toEqual({ type: 'module', name: 'cf-earth-residents' });
    expect(f.backgroundLoad!.options).toMatchObject({ width: 960, height: 430 });
    expect(vi.getTimerCount()).toBe(1);
    let scenery!: HTMLCanvasElement;
    if (first === 'background') scenery = background(f).canvas;
    else f.worker!.emit('message', result(image));
    expect(f.commit).not.toHaveBeenCalled();
    expect(f.loader.snapshot()).toMatchObject({ status: 'pending', retainedCanvases: 1, deadlineActive: true });
    if (first === 'background') f.worker!.emit('message', result(image));
    else scenery = background(f).canvas;
    expect(f.commit).toHaveBeenCalledExactlyOnceWith(scenery, f.canvases[0]);
    expect(f.drawImage).toHaveBeenCalledExactlyOnceWith(image, 0, 0);
    expect(image.close).toHaveBeenCalledOnce(); expect(f.worker!.terminate).toHaveBeenCalledOnce();
    expect(f.backgroundLoad!.dispose).toHaveBeenCalledOnce();
    expect(f.loader.snapshot()).toMatchObject({ status: 'ready', workerActive: false, deadlineActive: false, retainedCanvases: 0 });
    expect(vi.getTimerCount()).toBe(0); expect(f.fallback).not.toHaveBeenCalled();
    f.loader.dispose(); f.loader.dispose();
    expect([scenery.width, scenery.height, f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([960, 430, 960, 430]);
    expect(f.commit).toHaveBeenCalledOnce();
  });

  it('keeps the accepted pair intact when its display owner retires the loader during commit', () => {
    let owner!: EarthLayeredLoadV1;
    const f = fixture({ commit: () => { owner.dispose(); return true; } }); owner = f.loader;
    const scenery = background(f).canvas, image = bitmap();
    f.worker!.emit('message', result(image));
    expect(f.commit).toHaveBeenCalledExactlyOnceWith(scenery, f.canvases[0]);
    expect(f.loader.snapshot()).toMatchObject({ status: 'disposed', workerActive: false,
      deadlineActive: false, retainedCanvases: 0 });
    expect([scenery.width, scenery.height, f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([960, 430, 960, 430]);
    expect(image.close).toHaveBeenCalledOnce(); expect(f.fallback).not.toHaveBeenCalled();
    expect(f.worker!.terminate).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
    const late = bitmap(); f.worker!.emit('message', result(late));
    expect(late.close).toHaveBeenCalledOnce(); expect(f.commit).toHaveBeenCalledOnce();
  });

  it.each(['background', 'residents'] as const)('discards the retained %s when its partner fails', retained => {
    const f = fixture();
    const canvas = retained === 'background' ? background(f).canvas : null;
    if (retained === 'residents') {
      const image = bitmap(); f.worker!.emit('message', result(image));
      expect(image.close).toHaveBeenCalledOnce();
      f.backgroundLoad!.options.fallback(new Error('image integrity mismatch'));
    } else f.worker!.emit('message', { schema: EARTH_LAYER_RESPONSE, token: TOKEN, type: 'error', message: 'painter failed' });
    failed(f); expect(f.commit).not.toHaveBeenCalled();
    const owned = canvas ?? f.canvases[0]!;
    expect([owned.width, owned.height]).toEqual([1, 1]);
    const late = bitmap(); f.worker!.emit('message', result(late));
    expect(late.close).toHaveBeenCalledOnce(); expect(f.fallback).toHaveBeenCalledOnce();
  });

  it.each(['worker constructor', 'worker post', 'background constructor'] as const)('settles %s failure before fallback', fault => {
    faults.construct = fault === 'worker constructor'; faults.post = fault === 'worker post';
    painted.constructorThrows = fault === 'background constructor';
    const f = fixture(); failed(f); expect(f.commit).not.toHaveBeenCalled();
    expect(painted.instances).toHaveLength(0);
    expect(f.loader.snapshot().workerStarts).toBe(fault === 'worker constructor' ? 0 : 1);
  });

  it.each(['error', 'messageerror'] as const)('settles a worker %s once and releases a pending background', type => {
    const f = fixture(), scenery = background(f).canvas;
    const event = f.worker!.emit(type); failed(f);
    if (type === 'error') expect(event.preventDefault).toHaveBeenCalledOnce();
    expect([scenery.width, scenery.height]).toEqual([1, 1]);
    f.worker!.emit(type); vi.advanceTimersByTime(24_000);
    expect(f.fallback).toHaveBeenCalledOnce(); expect(f.commit).not.toHaveBeenCalled();
  });

  it.each(['wrong token', 'wrong width', 'wrong height', 'wrong schema', 'extra field'] as const)('closes %s output and never publishes a partial pair', fault => {
    const f = fixture(), scenery = background(f).canvas;
    const image = bitmap(fault === 'wrong width' ? 959 : 960, fault === 'wrong height' ? 429 : 430);
    const response: Record<string, unknown> = result(image, fault === 'wrong token' ? 'another-scene' : TOKEN);
    if (fault === 'wrong schema') response.schema = 'future';
    if (fault === 'extra field') response.extra = true;
    f.worker!.emit('message', response); failed(f);
    expect(image.close).toHaveBeenCalledOnce(); expect(f.canvases).toHaveLength(0);
    expect([scenery.width, scenery.height]).toEqual([1, 1]); expect(f.commit).not.toHaveBeenCalled();
  });

  it.each(['create', 'context', 'copy'] as const)('releases the received bitmap and owned canvas when resident %s fails', fault => {
    const f = fixture({ createThrows: fault === 'create', contextMissing: fault === 'context', copyThrows: fault === 'copy' });
    const scenery = background(f).canvas, image = bitmap();
    expect(() => f.worker!.emit('message', result(image))).not.toThrow(); failed(f);
    expect(image.close).toHaveBeenCalledOnce(); expect(f.commit).not.toHaveBeenCalled();
    expect([scenery.width, scenery.height]).toEqual([1, 1]);
    for (const canvas of f.canvases) expect([canvas.width, canvas.height]).toEqual([1, 1]);
  });

  it.each(['refuse', 'throw'] as const)('releases both canvases when the pair mount must %s', action => {
    const f = fixture({ commit: () => { if (action === 'throw') throw new Error('mount failed'); return false; } });
    const scenery = background(f).canvas, image = bitmap(); f.worker!.emit('message', result(image));
    failed(f); expect(f.commit).toHaveBeenCalledOnce(); expect(image.close).toHaveBeenCalledOnce();
    expect([scenery.width, scenery.height, f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([1, 1, 1, 1]);
  });

  it.each(['background', 'residents'] as const)('leaves both canvases with a failed display owner for cleanup retry with %s first', first => {
    const transferred: HTMLCanvasElement[] = [];
    const f = fixture({ commit: (scenery, residents) => {
      transferred.push(scenery, residents); return 'retained-failure';
    } });
    const image = bitmap(); let scenery!: HTMLCanvasElement;
    if (first === 'background') scenery = background(f).canvas;
    else f.worker!.emit('message', result(image));
    expect(f.commit).not.toHaveBeenCalled();
    if (first === 'background') f.worker!.emit('message', result(image));
    else scenery = background(f).canvas;
    failed(f);
    expect(f.commit).toHaveBeenCalledExactlyOnceWith(scenery, f.canvases[0]);
    expect(transferred).toEqual([scenery, f.canvases[0]]);
    expect(image.close).toHaveBeenCalledOnce(); expect(f.worker!.terminate).toHaveBeenCalledOnce();
    expect(f.backgroundLoad!.dispose).toHaveBeenCalled();
    expect([scenery.width, scenery.height, f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([960, 430, 960, 430]);
    f.loader.dispose(); f.loader.dispose();
    expect([scenery.width, scenery.height, f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([960, 430, 960, 430]);
    expect(f.fallback).toHaveBeenCalledOnce();
  });

  it.each(['dispose', 'route loss', 'route throw'] as const)('releases retained layers and late output after %s without fallback', loss => {
    const f = fixture(), scenery = background(f).canvas;
    if (loss === 'dispose') f.loader.dispose();
    else if (loss === 'route loss') f.state.current = false;
    else f.state.currentThrows = true;
    const late = bitmap(); f.worker!.emit('message', result(late));
    expect(late.close).toHaveBeenCalledOnce();
    expect([scenery.width, scenery.height]).toEqual([1, 1]);
    expect(f.loader.snapshot()).toMatchObject({ status: 'disposed', workerActive: false, deadlineActive: false, retainedCanvases: 0 });
    expect(f.worker!.terminate).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
    expect(f.commit).not.toHaveBeenCalled(); expect(f.fallback).not.toHaveBeenCalled();
    const lateBackground = background(f);
    expect(lateBackground.accepted).toBe(false);
    expect([lateBackground.canvas.width, lateBackground.canvas.height]).toEqual([1, 1]);
  });

  it('allocates no work when current-world authority is already absent', () => {
    const f = fixture({ current: false });
    expect(f.loader.snapshot()).toMatchObject({ status: 'disposed', workerStarts: 0 });
    expect(workers).toHaveLength(0); expect(painted.instances).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0); expect(f.fallback).not.toHaveBeenCalled();
  });

  it.each(['background', 'residents'] as const)('enforces one 12-second deadline while waiting for %s', missing => {
    const f = fixture(); let held: HTMLCanvasElement | FakeCanvas;
    if (missing === 'residents') held = background(f).canvas;
    else { f.worker!.emit('message', result()); held = f.canvases[0]!; }
    vi.advanceTimersByTime(11_999);
    expect(f.fallback).not.toHaveBeenCalled(); expect(f.loader.snapshot().status).toBe('pending');
    vi.advanceTimersByTime(1); failed(f);
    expect(f.loader.snapshot().error).toContain('timed out');
    expect([held.width, held.height]).toEqual([1, 1]);
    const late = bitmap(); f.worker!.emit('message', result(late));
    expect(late.close).toHaveBeenCalledOnce();
    const lateBackground = background(f); expect(lateBackground.accepted).toBe(false);
    vi.advanceTimersByTime(24_000); expect(f.fallback).toHaveBeenCalledOnce(); expect(f.commit).not.toHaveBeenCalled();
  });

  it('does not leak or replace an admitted resident canvas when another result is delivered before the background', () => {
    const f = fixture(), first = bitmap(), duplicate = bitmap();
    f.worker!.emit('message', result(first)); const original = f.canvases[0]!;
    f.worker!.emit('message', result(duplicate));
    expect(first.close).toHaveBeenCalledOnce(); expect(duplicate.close).toHaveBeenCalledOnce();
    expect(f.canvases).toHaveLength(1); expect(f.drawImage).toHaveBeenCalledOnce();
    expect(f.loader.snapshot().retainedCanvases).toBe(1);
    const scenery = background(f).canvas;
    expect(f.commit).toHaveBeenCalledExactlyOnceWith(scenery, original);
    expect([original.width, original.height]).toEqual([960, 430]); expect(f.fallback).not.toHaveBeenCalled();
  });

  it('closes an invalid bitmap with a throwing dimension getter without escaping the message owner', () => {
    const f = fixture(), image = bitmap();
    Object.defineProperty(image, 'width', { get: () => { throw new Error('bad bitmap dimensions'); } });
    expect(() => f.worker!.emit('message', result(image))).not.toThrow();
    failed(f); expect(image.close).toHaveBeenCalledOnce(); expect(f.commit).not.toHaveBeenCalled();
  });

  it('retains a fallback exception after stopping all owned work', () => {
    const f = fixture({ fallbackThrows: true });
    expect(() => f.worker!.emit('error')).not.toThrow(); failed(f);
    expect(f.loader.snapshot().error).toContain('fallback mount failed');
  });
});
