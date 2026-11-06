import { describe, expect, it, vi } from 'vitest';
import { retireEarthLayerResourcesV1, type EarthLayerResourceV1 } from './earth-layered-resources.js';

function resource(id: string) {
  const canvas = { width: 960, height: 430, detail: id };
  const lease = { id, released: false, release: vi.fn((): boolean => { lease.released = true; return true; }) };
  return { canvas, lease };
}

describe('retireEarthLayerResourcesV1', () => {
  it('retains a failed lease and its untouched canvas while still retiring the next entry', () => {
    const first = resource('background'), next = resource('residents');
    const failure = new Error('texture owner unavailable'), order: string[] = [];
    first.lease.release.mockImplementation(() => { order.push('background'); throw failure; });
    next.lease.release.mockImplementation(() => { order.push('residents'); next.lease.released = true; return true; });
    const entries = Object.freeze([first, next]);
    const result = retireEarthLayerResourcesV1(entries);
    expect(order).toEqual(['background', 'residents']);
    expect(result.retained).toEqual([first]); expect(result.retained[0]).toBe(first);
    expect(result.errors).toEqual([failure]);
    expect([first.canvas.width, first.canvas.height, next.canvas.width, next.canvas.height]).toEqual([960, 430, 1, 1]);
    expect(first.lease.released).toBe(false); expect(next.lease.released).toBe(true);
    expect(entries).toEqual([first, next]);
    // The generic result preserves the real canvas/lease subtype for the app.
    const typed: typeof first = result.retained[0]!;
    expect(typed.canvas.detail).toBe('background'); expect(typed.lease.id).toBe('background');
  });

  it('retries the retained reference after its underlying lease recovers', () => {
    const entry = resource('background'), failure = new Error('temporary release failure');
    let recovered = false;
    entry.lease.release.mockImplementation(() => {
      if (!recovered) throw failure;
      entry.lease.released = true; return true;
    });
    const initial = retireEarthLayerResourcesV1([entry]);
    expect(initial.retained[0]).toBe(entry); expect(initial.errors).toEqual([failure]);
    expect([entry.canvas.width, entry.canvas.height]).toEqual([960, 430]);
    recovered = true;
    const retry = retireEarthLayerResourcesV1(initial.retained);
    expect(retry).toEqual({ retained: [], errors: [] });
    expect(entry.lease.release).toHaveBeenCalledTimes(2); expect(entry.lease.released).toBe(true);
    expect([entry.canvas.width, entry.canvas.height]).toEqual([1, 1]);
  });

  it('never calls an already released lease again', () => {
    const entry = resource('residents'); entry.lease.released = true;
    expect(retireEarthLayerResourcesV1([entry])).toEqual({ retained: [], errors: [] });
    expect(entry.lease.release).not.toHaveBeenCalled();
    expect([entry.canvas.width, entry.canvas.height]).toEqual([1, 1]);
    expect(retireEarthLayerResourcesV1([entry])).toEqual({ retained: [], errors: [] });
    expect(entry.lease.release).not.toHaveBeenCalled();
  });

  it('disposes a canvas that never acquired a lease', () => {
    const entry: EarthLayerResourceV1 = { canvas: { width: 960, height: 430 }, lease: null };
    expect(retireEarthLayerResourcesV1([entry])).toEqual({ retained: [], errors: [] });
    expect([entry.canvas.width, entry.canvas.height]).toEqual([1, 1]);
  });

  it.each([false, true])('requires actual lease retirement when release returns %s', returned => {
    const entry = resource('background'); entry.lease.release.mockReturnValue(returned);
    const result = retireEarthLayerResourcesV1([entry]);
    expect(result.retained).toEqual([entry]); expect(result.errors).toHaveLength(1);
    expect(String(result.errors[0])).toContain('lease remains active');
    expect([entry.canvas.width, entry.canvas.height]).toEqual([960, 430]);
    expect(entry.lease.released).toBe(false);
  });

  it('preserves a failed canvas setter for retry without releasing its retired lease twice', () => {
    const first = resource('background'), next = resource('residents');
    const failure = new Error('canvas resize unavailable'); let blocked = true, height = 430;
    Object.defineProperty(first.canvas, 'height', {
      enumerable: true, get: () => height,
      set: (value: number) => { if (blocked) throw failure; height = value; },
    });
    const initial = retireEarthLayerResourcesV1([first, next]);
    expect(initial.retained).toEqual([first]); expect(initial.errors).toEqual([failure]);
    expect(first.lease.released).toBe(true); expect(first.lease.release).toHaveBeenCalledOnce();
    expect([first.canvas.width, first.canvas.height, next.canvas.width, next.canvas.height]).toEqual([1, 430, 1, 1]);
    blocked = false;
    expect(retireEarthLayerResourcesV1(initial.retained)).toEqual({ retained: [], errors: [] });
    expect(first.lease.release).toHaveBeenCalledOnce();
    expect([first.canvas.width, first.canvas.height]).toEqual([1, 1]);
  });

  it('keeps thrown release failures retryable even when release changed its flag before throwing', () => {
    const entry = resource('background'), failure = new Error('retirement notification failed');
    entry.lease.release.mockImplementation(() => { entry.lease.released = true; throw failure; });
    const initial = retireEarthLayerResourcesV1([entry]);
    expect(initial.retained).toEqual([entry]); expect(initial.errors).toEqual([failure]);
    expect([entry.canvas.width, entry.canvas.height]).toEqual([960, 430]);
    expect(retireEarthLayerResourcesV1(initial.retained)).toEqual({ retained: [], errors: [] });
    expect(entry.lease.release).toHaveBeenCalledOnce(); expect([entry.canvas.width, entry.canvas.height]).toEqual([1, 1]);
  });
});
