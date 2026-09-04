import { describe, expect, it, vi } from 'vitest';
import {
  mountAndCommitBiomeVistaV1,
  mountCachedBiomeVistaV1,
} from '../apps/game/src/biome-vista-cache.js';

describe('biome-vista cache publication', () => {
  it('evicts and disposes a cached canvas whose runtime mount fails', () => {
    const cached = { id: 'cached' };
    const cache = new Map([['world', cached]]);
    const dispose = vi.fn();
    const outcome = mountCachedBiomeVistaV1({
      cache, dispose, mount: () => { throw new Error('context lost'); },
    }, 'world');
    expect(outcome).toBe('fault');
    expect(cache.has('world')).toBe(false);
    expect(dispose).toHaveBeenCalledOnce();
    expect(mountCachedBiomeVistaV1({ cache, dispose, mount: vi.fn() }, 'world')).toBe('miss');
  });

  it('commits a new canvas only after a successful runtime mount', () => {
    const previous = { id: 'previous' };
    const next = { id: 'next' };
    const cache = new Map([['old', previous]]);
    const dispose = vi.fn();
    expect(mountAndCommitBiomeVistaV1({
      cache, dispose, mount: () => { throw new Error('allocation failed'); },
    }, 'new', next)).toBe('fault');
    expect(cache).toEqual(new Map([['old', previous]]));
    expect(dispose).toHaveBeenCalledWith(next);

    dispose.mockClear();
    expect(mountAndCommitBiomeVistaV1({ cache, dispose, mount: vi.fn() }, 'new', next))
      .toBe('mounted');
    expect(cache).toEqual(new Map([['new', next]]));
    expect(dispose).toHaveBeenCalledWith(previous);
  });
});
