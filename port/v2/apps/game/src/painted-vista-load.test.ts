import { createHash, webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaintedVistaLoadV1, PAINTED_VISTA_MAX_BYTES, PAINTED_VISTA_EXACT_MAX_BYTES,
  type PaintedVistaCommitV1 } from './painted-vista-load.js';
import { retireEarthLayerResourcesV1, type EarthLayerResourceV1 } from './earth-layered-resources.js';

const ABC = new TextEncoder().encode('abc');
const ABC_SHA256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function bitmap(width = 960, height = 430) { return { width, height, close: vi.fn() }; }
const owners: PaintedVistaLoadV1[] = [];
function fixture(options: {
  sha256?: string; expectedBytes?: number; response?: Response | Promise<Response>;
  decoded?: ReturnType<typeof bitmap> | Promise<ReturnType<typeof bitmap>>;
  commit?: (canvas: HTMLCanvasElement) => PaintedVistaCommitV1; copyThrows?: boolean;
  digest?: Promise<ArrayBuffer>; copyAt?: number;
} = {}) {
  const state = { current: true, now: 0 }, image = bitmap();
  const canvases: Array<{ width: number; height: number; getContext: ReturnType<typeof vi.fn> }> = [];
  const drawImage = vi.fn(() => {
    if (options.copyAt !== undefined) state.now = options.copyAt;
    if (options.copyThrows) throw new Error('copy failed');
  });
  const fetch = vi.fn((_url: string, _options: RequestInit) => Promise.resolve(options.response ?? new Response(ABC)));
  const decode = vi.fn((_blob: Blob) => Promise.resolve(options.decoded ?? image));
  const commit = vi.fn(options.commit ?? (() => true));
  const fallbackStops: Array<{ aborted: boolean | null; timers: number }> = [];
  const fallback = vi.fn((_error: unknown) => {
    fallbackStops.push({ aborted: fetch.mock.calls[0]?.[1].signal?.aborted ?? null, timers: vi.getTimerCount() });
  });
  vi.stubGlobal('fetch', fetch); vi.stubGlobal('createImageBitmap', decode);
  vi.stubGlobal('performance', { now: () => state.now });
  const digest = options.digest ? vi.fn(() => options.digest!) : null;
  if (digest) vi.stubGlobal('crypto', { subtle: { digest } });
  vi.stubGlobal('document', { createElement: vi.fn((tag: string) => {
    expect(tag).toBe('canvas');
    const canvas = { width: 0, height: 0, getContext: vi.fn(() => ({ drawImage })) };
    canvases.push(canvas); return canvas;
  }) });
  const loader = new PaintedVistaLoadV1({ url: '/assets/painted.webp', sha256: options.sha256 ?? ABC_SHA256,
    width: 960, height: 430, isCurrent: () => state.current, commit, fallback,
    ...(options.expectedBytes === undefined ? {} : { expectedBytes: options.expectedBytes }) });
  owners.push(loader);
  return { loader, state, image, canvases, drawImage, fetch, decode, digest, commit, fallback, fallbackStops };
}
const waitStatus = async (f: ReturnType<typeof fixture>, status: string): Promise<void> => {
  await vi.waitFor(() => expect(f.loader.snapshot().status).toBe(status), { timeout: 2000, interval: 5 });
  if (status === 'failed') {
    expect(f.fallbackStops).toEqual([{ aborted: f.fetch.mock.calls.length ? true : null, timers: 0 }]);
    expect(f.loader.snapshot().aborted).toBe(true);
  }
};
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => {
  for (const owner of owners.splice(0)) owner.dispose();
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals();
});

describe('PaintedVistaLoadV1', () => {
  it('verifies real SHA-256 before one decode and transfers the committed canvas without later shrinking it', async () => {
    const f = fixture(); await waitStatus(f, 'ready');
    expect(f.fetch).toHaveBeenCalledOnce();
    expect(f.fetch.mock.calls[0]![1]).toMatchObject({ credentials: 'omit', redirect: 'error' });
    expect(f.decode).toHaveBeenCalledOnce();
    expect(new Uint8Array(await f.decode.mock.calls[0]![0].arrayBuffer())).toEqual(ABC);
    expect(f.drawImage).toHaveBeenCalledWith(f.image, 0, 0);
    expect(f.image.close).toHaveBeenCalledOnce(); expect(f.commit).toHaveBeenCalledWith(f.canvases[0]);
    expect(f.loader.snapshot()).toMatchObject({ status: 'ready', error: null,
      fetchStarts: 1, decodePending: false, canvasPixels: 0 });
    expect(vi.getTimerCount()).toBe(0); expect(f.fallback).not.toHaveBeenCalled();
    f.loader.dispose(); f.loader.dispose();
    expect([f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([960, 430]);
    expect(f.commit).toHaveBeenCalledOnce(); expect(f.image.close).toHaveBeenCalledOnce();
  });

  it('preserves a canvas behind a failed display lease until retryable cleanup actually releases it', async () => {
    let retained: EarthLayerResourceV1[] = [], recovered = false;
    const failure = new Error('temporary texture release failure');
    const lease = { released: false, release: vi.fn((): boolean => {
      if (!recovered) throw failure;
      lease.released = true; return true;
    }) };
    const f = fixture({ commit: canvas => {
      const result = retireEarthLayerResourcesV1([{ canvas, lease }]);
      expect(result.errors).toEqual([failure]);
      retained = result.retained;
      return 'retained-failure';
    } });
    await waitStatus(f, 'failed');
    expect(f.loader.snapshot()).toMatchObject({ canvasPixels: 0, aborted: true, error: 'painted vista commit refused' });
    expect(f.fallback).toHaveBeenCalledOnce();
    expect(retained).toHaveLength(1); expect(retained[0]!.canvas).toBe(f.canvases[0]);
    const assertLiveCanvas = (): void => {
      if (retained[0]!.canvas.width !== 960 || retained[0]!.canvas.height !== 430) {
        throw new Error('live texture lease lost its full backing canvas');
      }
    };
    expect(() => assertLiveCanvas()).not.toThrow();
    f.loader.dispose(); f.loader.dispose();
    expect(() => assertLiveCanvas()).not.toThrow(); expect(lease.released).toBe(false);
    recovered = true;
    expect(retireEarthLayerResourcesV1(retained)).toEqual({ retained: [], errors: [] });
    expect(lease.released).toBe(true); expect(lease.release).toHaveBeenCalledTimes(2);
    expect([f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([1, 1]);
    // The same outcome guard rejects a shrunken backing store; a retained
    // reference or loader status by itself cannot satisfy this check.
    expect(() => assertLiveCanvas()).toThrow('live texture lease lost');
  });

  it.each([true, 'retained-failure'] as const)('does not shrink transferred canvas when commit disposes its loader (%s)', async disposition => {
    let owner: PaintedVistaLoadV1 | null = null;
    const f = fixture({ commit: () => {
      if (!owner) throw new Error('fixture owner unavailable');
      owner.dispose(); return disposition;
    } });
    owner = f.loader;
    await waitStatus(f, 'disposed');
    expect(f.commit).toHaveBeenCalledOnce(); expect(f.fallback).not.toHaveBeenCalled();
    expect(f.loader.snapshot().canvasPixels).toBe(0); expect(vi.getTimerCount()).toBe(0);
    expect([f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([960, 430]);
    expect(f.image.close).toHaveBeenCalledOnce();
  });

  it('rejects changed bytes, declared oversize, HTTP failure and wrong decoded dimensions', async () => {
    const cases = [
      { options: { response: new Response(new TextEncoder().encode('abd')) }, error: 'SHA-256', decoded: false },
      { options: { response: new Response(ABC, { headers: { 'content-length': String(512 * 1024 + 1) } }) }, error: 'byte limit', decoded: false },
      { options: { response: new Response(ABC, { status: 404 }) }, error: 'HTTP 404', decoded: false },
      { options: { decoded: bitmap(959, 430) }, error: 'dimensions', decoded: true },
      { options: { decoded: bitmap(960, 429) }, error: 'dimensions', decoded: true },
    ];
    for (const item of cases) {
      const f = fixture(item.options); await waitStatus(f, 'failed');
      expect(f.loader.snapshot().error).toContain(item.error);
      expect(f.fallback).toHaveBeenCalledOnce(); expect(f.commit).not.toHaveBeenCalled();
      expect(f.canvases).toHaveLength(0);
      expect(f.decode).toHaveBeenCalledTimes(item.decoded ? 1 : 0);
      if (item.options.decoded) expect(item.options.decoded.close).toHaveBeenCalledOnce();
    }
    // The changed-byte case uses the same successful contract as the first test:
    // HTTP 200 and matching fake dimensions cannot hide a changed asset digest.
  });

  it.each([600756, 640 * 1024])('admits an explicit lossless byte count of %s after exact length and real hash checks', async size => {
    const bytes = new Uint8Array(size).fill(82);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const f = fixture({ expectedBytes: size, response: new Response(bytes), sha256 });
    await waitStatus(f, 'ready');
    expect(PAINTED_VISTA_MAX_BYTES).toBe(512 * 1024);
    expect(PAINTED_VISTA_EXACT_MAX_BYTES).toBe(640 * 1024);
    expect(f.fetch).toHaveBeenCalledOnce(); expect(f.decode).toHaveBeenCalledOnce();
    expect(f.decode.mock.calls[0]![0].size).toBe(size); expect(f.commit).toHaveBeenCalledOnce();
    expect([f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([960, 430]);
  });

  it('keeps the older default cap and rejects declared or streamed overflow and truncated exact-size bytes', async () => {
    const bytes = new Uint8Array(600756).fill(82);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const cases = [
      { options: { response: new Response(bytes), sha256 }, message: 'byte limit' },
      { options: { expectedBytes: bytes.length, response: new Response(bytes,
        { headers: { 'content-length': String(bytes.length + 1) } }), sha256 }, message: 'byte limit' },
      { options: { expectedBytes: bytes.length, response: new Response(new Uint8Array(bytes.length + 1)), sha256 }, message: 'byte limit' },
      // Use the short body's correct hash: accepting this would mean the exact
      // size check was omitted, not merely that a digest check failed first.
      { options: { expectedBytes: bytes.length, response: new Response(ABC), sha256: ABC_SHA256 }, message: 'byte length mismatch' },
    ];
    for (const { options, message } of cases) {
      const f = fixture(options); await waitStatus(f, 'failed');
      expect(f.loader.snapshot().error).toContain(message);
      expect(f.fetch).toHaveBeenCalledOnce(); expect(f.decode).not.toHaveBeenCalled();
      expect(f.commit).not.toHaveBeenCalled(); expect(f.canvases).toHaveLength(0);
    }
  });

  it.each([0, -1, 1.5, Number.NaN, Infinity, 640 * 1024 + 1, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid explicit size %s before fetch or decode', async expectedBytes => {
      const f = fixture({ expectedBytes }); await waitStatus(f, 'failed');
      expect(f.loader.snapshot()).toMatchObject({ error: 'invalid painted vista asset contract', fetchStarts: 0 });
      expect(f.fetch).not.toHaveBeenCalled(); expect(f.decode).not.toHaveBeenCalled();
      expect(f.commit).not.toHaveBeenCalled(); expect(f.fallback).toHaveBeenCalledOnce();
    },
  );

  it('bounds streamed bytes without trusting Content-Length and cancels the overflowing reader', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(400 * 1024)); controller.enqueue(new Uint8Array(200 * 1024)); },
      cancel,
    });
    const f = fixture({ response: new Response(body, { headers: { 'content-length': '3' } }) });
    await waitStatus(f, 'failed');
    expect(f.loader.snapshot().error).toContain('byte limit'); expect(cancel).toHaveBeenCalledOnce();
    expect(f.decode).not.toHaveBeenCalled(); expect(f.commit).not.toHaveBeenCalled();
    expect(f.fallback).toHaveBeenCalledOnce();
  });

  it('closes late decoded bitmaps after explicit disposal or loss of current-world authority', async () => {
    for (const explicit of [true, false]) {
      const pending = deferred<ReturnType<typeof bitmap>>(), late = bitmap();
      const f = fixture({ decoded: pending.promise });
      await vi.waitFor(() => expect(f.loader.snapshot().decodePending).toBe(true));
      if (explicit) f.loader.dispose(); else f.state.current = false;
      pending.resolve(late);
      await vi.waitFor(() => expect(late.close).toHaveBeenCalledOnce());
      expect(f.loader.snapshot()).toMatchObject({ status: 'disposed', decodePending: false, aborted: true, canvasPixels: 0 });
      expect(f.commit).not.toHaveBeenCalled(); expect(f.fallback).not.toHaveBeenCalled();
      expect(f.canvases).toHaveLength(0); expect(vi.getTimerCount()).toBe(0);
      f.loader.dispose(); expect(late.close).toHaveBeenCalledOnce();
    }
  });

  it('settles the 8-second timeout once even when fetch or decoding ignores abort', async () => {
    for (const phase of ['fetch', 'decode']) {
      const response = deferred<Response>(), decoded = deferred<ReturnType<typeof bitmap>>();
      const late = bitmap();
      const f = fixture(phase === 'fetch' ? { response: response.promise } : { decoded: decoded.promise });
      if (phase === 'decode') await vi.waitFor(() => expect(f.decode).toHaveBeenCalledOnce());
      vi.advanceTimersByTime(8000);
      expect(f.loader.snapshot()).toMatchObject({ status: 'failed', error: 'painted vista load timed out', aborted: true });
      expect(f.fallbackStops).toEqual([{ aborted: true, timers: 0 }]);
      expect(f.fallback).toHaveBeenCalledOnce(); expect(f.commit).not.toHaveBeenCalled();
      if (phase === 'fetch') {
        const cancelled = vi.fn();
        response.resolve(new Response(new ReadableStream({ cancel: cancelled })));
        await vi.waitFor(() => expect(cancelled).toHaveBeenCalledOnce());
        expect(f.decode).not.toHaveBeenCalled();
      } else {
        decoded.resolve(late); await vi.waitFor(() => expect(late.close).toHaveBeenCalledOnce());
      }
      vi.advanceTimersByTime(8000);
      expect(f.loader.snapshot().status).toBe('failed'); expect(f.fallback).toHaveBeenCalledOnce();
      expect(f.commit).not.toHaveBeenCalled(); expect(f.canvases).toHaveLength(0);
    }
  });

  it.each(['fetch', 'digest', 'decode'] as const)(
    'refuses %s completion at the monotonic deadline before its timer fires', async phase => {
      const response = deferred<Response>(), digest = deferred<ArrayBuffer>();
      const decoded = deferred<ReturnType<typeof bitmap>>(), late = bitmap();
      const f = fixture({
        ...(phase === 'fetch' ? { response: response.promise } : {}),
        ...(phase === 'digest' ? { digest: digest.promise } : {}),
        ...(phase === 'decode' ? { decoded: decoded.promise } : {}),
      });
      if (phase === 'digest') await vi.waitFor(() => expect(f.digest).toHaveBeenCalledOnce());
      if (phase === 'decode') await vi.waitFor(() => expect(f.decode).toHaveBeenCalledOnce());
      // Advancing this independent monotonic clock does not deliver setTimeout.
      f.state.now = 8000;
      expect(f.loader.snapshot().status).toBe('pending'); expect(vi.getTimerCount()).toBe(1);
      const cancelled = vi.fn();
      if (phase === 'fetch') response.resolve(new Response(new ReadableStream({ cancel: cancelled })));
      if (phase === 'digest') digest.resolve(Uint8Array.from(Buffer.from(ABC_SHA256, 'hex')).buffer);
      if (phase === 'decode') decoded.resolve(late);
      await waitStatus(f, 'failed');
      expect(f.loader.snapshot()).toMatchObject({ error: 'painted vista load timed out', canvasPixels: 0 });
      expect(f.commit).not.toHaveBeenCalled(); expect(f.canvases).toHaveLength(0);
      expect(f.fallback).toHaveBeenCalledOnce();
      if (phase === 'fetch') expect(cancelled).toHaveBeenCalledOnce();
      if (phase === 'decode') expect(late.close).toHaveBeenCalledOnce();
      else expect(f.decode).not.toHaveBeenCalled();
      vi.advanceTimersByTime(8000);
      expect(f.fallback).toHaveBeenCalledOnce(); expect(f.commit).not.toHaveBeenCalled();
    },
  );

  it.each([7999, 8000, 8001])('checks the final canvas transfer at monotonic time %s', async copyAt => {
    const f = fixture({ copyAt });
    await waitStatus(f, copyAt < 8000 ? 'ready' : 'failed');
    expect(f.image.close).toHaveBeenCalledOnce(); expect(f.canvases).toHaveLength(1);
    if (copyAt < 8000) {
      expect(f.commit).toHaveBeenCalledOnce(); expect(f.fallback).not.toHaveBeenCalled();
      expect([f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([960, 430]);
    } else {
      expect(f.commit).not.toHaveBeenCalled(); expect(f.fallback).toHaveBeenCalledOnce();
      expect(f.loader.snapshot().error).toBe('painted vista load timed out');
      expect([f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([1, 1]);
    }
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps deadline-expired completions silent after current-world authority is lost', async () => {
    const pending = deferred<ReturnType<typeof bitmap>>(), late = bitmap();
    const f = fixture({ decoded: pending.promise });
    await vi.waitFor(() => expect(f.decode).toHaveBeenCalledOnce());
    f.state.current = false; f.state.now = 8001; pending.resolve(late);
    await waitStatus(f, 'disposed');
    expect(f.commit).not.toHaveBeenCalled(); expect(f.fallback).not.toHaveBeenCalled();
    expect(late.close).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps late fetch success and rejection silent after route loss', async () => {
    for (const reject of [false, true]) {
      const response = deferred<Response>(), f = fixture({ response: response.promise });
      f.state.current = false;
      if (reject) response.reject(new Error('late fetch failure')); else response.resolve(new Response(ABC));
      await waitStatus(f, 'disposed');
      expect(f.fallback).not.toHaveBeenCalled(); expect(f.commit).not.toHaveBeenCalled();
      expect(f.decode).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
    }
  });

  it('closes the decoded bitmap and shrinks uncommitted canvases on copy or commit refusal', async () => {
    for (const options of [{ copyThrows: true }, { commit: () => false },
      { commit: () => { throw new Error('mount failed'); } }]) {
      const f = fixture(options); await waitStatus(f, 'failed');
      expect(f.image.close).toHaveBeenCalledOnce(); expect(f.canvases).toHaveLength(1);
      expect([f.canvases[0]!.width, f.canvases[0]!.height]).toEqual([1, 1]);
      expect(f.fallback).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
      f.loader.dispose(); expect(f.fallback).toHaveBeenCalledOnce();
    }
  });
});
