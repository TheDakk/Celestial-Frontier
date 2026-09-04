import { describe, expect, it, vi } from 'vitest';
import { createFrameCoalescer } from '../apps/game/src/frame-coalescer.js';

function harness() {
  let nextHandle = 0;
  const callbacks = new Map<number, () => void>();
  const schedule = vi.fn((callback: () => void) => {
    const handle = nextHandle++;
    callbacks.set(handle, callback);
    return handle;
  });
  const cancel = vi.fn((handle: number) => { callbacks.delete(handle); });
  const run = vi.fn();
  const owner = createFrameCoalescer(schedule, cancel, run);
  const flush = (handle: number): void => {
    const callback = callbacks.get(handle);
    if (!callback) throw new Error(`scheduled frame ${handle} is unavailable`);
    callbacks.delete(handle);
    callback();
  };
  return { owner, schedule, cancel, run, callbacks, flush };
}

describe('one-owner frame coalescing', () => {
  it('collapses a resize burst into one frame and samples work only at flush', () => {
    const h = harness();
    h.owner.request();
    h.owner.request();
    h.owner.request();
    expect(h.schedule).toHaveBeenCalledOnce();
    expect(h.run).not.toHaveBeenCalled();
    expect(h.owner.pending()).toBe(true);

    h.flush(0);
    expect(h.run).toHaveBeenCalledOnce();
    expect(h.owner.pending()).toBe(false);
  });

  it('clears ownership before running so the frame can request one later frame', () => {
    const h = harness();
    h.run.mockImplementationOnce(() => { h.owner.request(); });
    h.owner.request();
    h.flush(0);
    expect(h.schedule).toHaveBeenCalledTimes(2);
    expect(h.owner.pending()).toBe(true);
    h.flush(1);
    expect(h.run).toHaveBeenCalledTimes(2);
    expect(h.owner.pending()).toBe(false);
  });

  it('cancels a pending frame exactly once and permits a fresh request', () => {
    const h = harness();
    h.owner.request();
    h.owner.cancel();
    h.owner.cancel();
    expect(h.cancel).toHaveBeenCalledOnce();
    expect(h.run).not.toHaveBeenCalled();
    expect(h.owner.pending()).toBe(false);

    h.owner.request();
    expect(h.schedule).toHaveBeenCalledTimes(2);
    h.flush(1);
    expect(h.run).toHaveBeenCalledOnce();
  });
});
