import { createHash, webcrypto } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateLocalLandfallV1, type LocalAiRuntimeConfigV1 } from '../apps/game/src/local-ai-runtime.js';
import type { AiLandfallInputV1 } from '../apps/game/src/ai-landfall-originals.js';
import type { AiLandfallProgressV1 } from '../apps/game/src/ai-landfall-jobs.js';

// Orchestrator outcomes with synthetic workers/images only. No model inference,
// browser/GPU qualification, pixel fidelity or original-store acceptance implied.
const BYTES = new Uint8Array([1, 3, 7, 15, 31, 63, 127, 255]);
const SHA = createHash('sha256').update(BYTES).digest('hex');
const WIDTH = 1024, HEIGHT = 576, REFERENCE_PIXELS = 480 * 320;
type Stage = 'text' | 'encode' | 'denoise' | 'decode';
type Job = Record<string, unknown> & { stage: Stage };
type Typed = Float32Array | Uint16Array;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(yes => { resolve = yes; });
  return { promise, resolve };
}
const tick = () => delay(10);
const controllers: AbortController[] = [];
beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.abort();
  vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
function fixture(options: {
  intercept?: (worker: FakeWorker, job: Job) => boolean;
  result?: (stage: Stage, value: Typed) => Typed;
  response?: () => Promise<Response>;
  bitmap?: Promise<{ close(): void }>;
  canvasFailure?: 'reference-context' | 'draw' | 'read' | 'painting-context' | 'put' | 'encode';
  closeThrows?: boolean;
  blob?: Blob | Promise<Blob>;
  onProgress?: ((value: AiLandfallProgressV1) => void) | undefined;
} = {}) {
  const workers: FakeWorker[] = [], jobs: { job: Job; transfers: number; detached: boolean }[] = [];
  const progress: AiLandfallProgressV1[] = [];
  let active = 0, peak = 0;
  const config: LocalAiRuntimeConfigV1 = {
    workerUrl: '/__local_ai/stage-worker.mjs', modelRevision: 'a'.repeat(40), q8Block32: true,
    modelFiles: { 'text_encoder_q4.onnx': 'blob:http://game.test/text', 'transformer-q8-block32.onnx': '/__local_ai/transformer' },
    reference: { url: '/__local_ai/platypus.png', sha256: SHA, width: 480, height: 320, speciesVisualKey: 'complete-platypus-identity' },
  };
  const recipe: Record<string, unknown> = { schema: 'cf.ai-landfall-render.v1',
    width: WIDTH, height: HEIGHT, steps: 4, seed: 133, modelRevision: config.modelRevision, q8Block32: true,
    conditioning: { prompt: 'One canonical Platypus in the riverbank.', referenceRequirements: [{ subjectIdentityKey: config.reference.speciesVisualKey }] },
    reference: { sha256: SHA, width: 480, height: 320, speciesVisualKey: config.reference.speciesVisualKey }, qualityAccepted: false };
  const controller = new AbortController(); controllers.push(controller);
  const bitmap = { close: vi.fn(() => { if (options.closeThrows) throw Error('Bitmap close failed'); }) };
  const decodeBitmap = vi.fn(() => options.bitmap ?? Promise.resolve(bitmap));
  const fetcher = vi.fn(() => options.response?.() ?? Promise.resolve(new Response(BYTES)));
  const canvases: FakeCanvas[] = [];
  class FakeCanvas {
    initialWidth: number; initialHeight: number; width: number; height: number;
    puts: Uint8ClampedArray[] = []; fills = 0; draws = 0; encodes = 0;
    constructor(width: number, height: number) {
      this.initialWidth = width; this.initialHeight = height; this.width = width; this.height = height; canvases.push(this);
    }
    getContext() {
      const reference = this.initialWidth === 480;
      if (options.canvasFailure === (reference ? 'reference-context' : 'painting-context')) return null;
      return { fillStyle: '',
        fillRect: () => { this.fills++; },
        drawImage: () => { this.draws++; if (options.canvasFailure === 'draw') throw Error('Draw failed'); },
        getImageData: () => {
          if (options.canvasFailure === 'read') throw Error('Read failed');
          const data = new Uint8ClampedArray(REFERENCE_PIXELS * 4);
          for (let i = 0; i < REFERENCE_PIXELS; i++) data.set([0, 128, 255, 255], i * 4);
          return { data };
        },
        createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
        putImageData: (image: { data: Uint8ClampedArray }) => { if (options.canvasFailure === 'put') throw Error('Put failed'); this.puts.push(image.data); },
      };
    }
    convertToBlob() {
      this.encodes++;
      if (options.canvasFailure === 'encode') return Promise.reject(Error('PNG encode failed'));
      return Promise.resolve(options.blob ?? new Blob(['synthetic-png'], { type: 'image/png' }));
    }
  }
  function output(stage: Stage): Typed {
    const value = stage === 'text' ? new Uint16Array(512 * 7680).fill(0x3c00)
      : stage === 'encode' ? new Float32Array(30 * 20 * 128).fill(.25)
        : stage === 'denoise' ? new Float32Array(64 * 36 * 128).fill(.5)
          : new Float32Array(WIDTH * HEIGHT * 3);
    if (stage === 'decode') { value.fill(-1, 0, WIDTH * HEIGHT); value.fill(1, 2 * WIDTH * HEIGHT); }
    return options.result?.(stage, value) ?? value;
  }
  class FakeWorker {
    onmessage: ((event: MessageEvent<Record<string, unknown>>) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;
    onmessageerror: (() => void) | null = null;
    terminateCount = 0;
    constructor(readonly url: string, readonly settings: WorkerOptions) { workers.push(this); active++; peak = Math.max(peak, active); }
    postMessage(job: Job, transfers: Transferable[]) {
      const buffers = transfers.filter((item): item is ArrayBuffer => item instanceof ArrayBuffer);
      const copy = structuredClone(job, { transfer: transfers });
      jobs.push({ job: copy, transfers: transfers.length, detached: buffers.every(buffer => buffer.byteLength === 0) });
      queueMicrotask(() => { if (!options.intercept?.(this, copy)) this.complete(copy); });
    }
    emit(data: Record<string, unknown>) { this.onmessage?.({ data } as MessageEvent<Record<string, unknown>>); }
    complete(job: Job) {
      this.emit({ type: 'progress', phase: 'loading' }); this.emit({ type: 'progress', phase: 'loaded' });
      if (job.stage === 'denoise') for (let step = 1; step <= 4; step++) this.emit({ type: 'progress', phase: 'step', step, steps: 4 });
      this.emit({ type: 'complete', data: output(job.stage) });
    }
    terminate() { this.terminateCount++; active--; }
  }
  vi.stubGlobal('Worker', FakeWorker); vi.stubGlobal('OffscreenCanvas', FakeCanvas);
  vi.stubGlobal('createImageBitmap', decodeBitmap); vi.stubGlobal('fetch', fetcher);
  const input = (): AiLandfallInputV1 => ({ recipeKey: 'full-recipe-digest', worldKey: 'canonical-world', environmentId: 'environment',
    ecologyEpoch: 0, snapshotDigest: 'snapshot', recipeJson: JSON.stringify(recipe) });
  const run = () => generateLocalLandfallV1(input(), controller.signal, value => { progress.push(value); options.onProgress?.(value); }, config);
  const retired = () => {
    expect(active).toBe(0); expect(workers.every(worker => worker.terminateCount === 1)).toBe(true);
    expect(canvases.every(canvas => canvas.width === 1 && canvas.height === 1)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  };
  return { workers, jobs, progress, config, recipe, controller, bitmap, decodeBitmap, fetcher, canvases, run, retired, peak: () => peak };
}
// Callback surface exposed only inside this test file, not a product debug hook.
type FakeWorker = {
  emit(data: Record<string, unknown>): void;
  complete(job: Job): void;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: (() => void) | null;
};

async function reaches(predicate: () => boolean) {
  for (let turns = 0; turns < 100 && !predicate(); turns++) await tick();
  expect(predicate()).toBe(true);
}

describe('local AI stage orchestrator — synthetic workers, no inference claim', () => {
  it('runs four serial workers, transfers correct tensors and returns a real Blob only after RGBA conversion', async () => {
    const f = fixture(), result = await f.run();
    expect(result).toMatchObject({ width: WIDTH, height: HEIGHT }); expect(result.blob.type).toBe('image/png');
    expect(await result.blob.text()).toBe('synthetic-png');
    expect(f.jobs.map(row => row.job.stage)).toEqual(['text', 'encode', 'denoise', 'decode']);
    expect(f.jobs.map(row => row.transfers)).toEqual([0, 1, 2, 1]); expect(f.jobs.every(row => row.detached)).toBe(true);
    expect(f.peak()).toBe(1); expect(f.workers.every(worker => worker.url === f.config.workerUrl && worker.settings.type === 'module')).toBe(true);
    for (const { job } of f.jobs) { expect(job.modelFiles).toEqual(f.config.modelFiles); expect(job.profile).toBe(false); }
    expect(f.jobs[0]!.job.chatPrompt).toBe('<|im_start|>user\nOne canonical Platypus in the riverbank.<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n');
    const pixels = f.jobs[1]!.job.pixels as Float32Array;
    expect(pixels[0]).toBe(-1); expect(pixels[REFERENCE_PIXELS]).toBeCloseTo(128 / 127.5 - 1, 7); expect(pixels[REFERENCE_PIXELS * 2]).toBe(1);
    expect(f.jobs[2]!.job.q8Block32).toBe(true); expect((f.jobs[2]!.job.embedding as Uint16Array)[0]).toBe(0x3c00);
    const references = f.jobs[2]!.job.references as Array<{ data: Float32Array; width: number; height: number }>;
    expect(references).toHaveLength(1); expect(references[0]!.data[0]).toBe(.25); expect([references[0]!.width, references[0]!.height]).toEqual([480, 320]);
    expect((f.jobs[3]!.job.latents as Float32Array)[0]).toBe(.5);
    expect(f.canvases[1]!.puts[0]!.slice(0, 4)).toEqual(new Uint8ClampedArray([0, 128, 255, 255]));
    expect(f.canvases[1]!.puts[0]!.slice(-4)).toEqual(new Uint8ClampedArray([0, 128, 255, 255]));
    expect(f.bitmap.close).toHaveBeenCalledOnce(); expect(f.decodeBitmap).toHaveBeenCalledOnce(); f.retired();
  });

  it('reports only actual monotonic stage/step work and leaves ready/original retention to its caller', async () => {
    let now = 0; vi.spyOn(performance, 'now').mockImplementation(() => now += 100);
    const f = fixture(); await f.run();
    const drawing = f.progress.filter(row => row.phase.startsWith('Drawing '));
    expect(drawing.map(row => [row.phase, row.completed, row.total, row.etaMs])).toEqual([
      ['Drawing the landfall', 2, 7, null], // Loaded-stage transition is real work, not a denoising step.
      ['Drawing 1 of 4', 3, 7, null], ['Drawing 2 of 4', 4, 7, 200], ['Drawing 3 of 4', 5, 7, 100], ['Drawing 4 of 4', 6, 7, 0],
    ]);
    expect(f.progress.at(-1)).toEqual({ phase: 'Finishing the painting', completed: 7, total: 7, etaMs: null });
    expect(f.progress.every((row, index, list) => row.completed >= (list[index - 1]?.completed ?? 0))).toBe(true);
    expect(f.progress.some(row => /ready/i.test(row.phase))).toBe(false); f.retired();
  });

  it('refuses recipe dimensions, step count, seed, model or derivative changes before any work', async () => {
    for (const [key, value] of [['width', 768], ['height', 432], ['steps', 8], ['seed', -1], ['seed', .5],
      ['modelRevision', 'wrong'], ['q8Block32', false]] as const) {
      const f = fixture(); f.recipe[key] = value; await expect(f.run()).rejects.toThrow(/unavailable/);
      expect(f.workers).toHaveLength(0); expect(f.fetcher).not.toHaveBeenCalled(); f.retired();
    }
  });

  it('refuses changed named identity, reference SHA or reference dimensions before any worker', async () => {
    for (const mutate of [
      (f: ReturnType<typeof fixture>) => { (f.recipe.conditioning as { referenceRequirements: Array<{ subjectIdentityKey: string }> }).referenceRequirements[0]!.subjectIdentityKey = 'wrong-animal'; },
      (f: ReturnType<typeof fixture>) => { (f.recipe.reference as Record<string, unknown>).sha256 = 'b'.repeat(64); },
      (f: ReturnType<typeof fixture>) => { (f.recipe.reference as Record<string, unknown>).width = 320; },
      (f: ReturnType<typeof fixture>) => { (f.recipe.reference as Record<string, unknown>).speciesVisualKey = 'other-identity'; },
    ]) { const f = fixture(); mutate(f); await expect(f.run()).rejects.toThrow(); expect(f.workers).toHaveLength(0); expect(f.fetcher).not.toHaveBeenCalled(); f.retired(); }
  });

  it('rejects a real reference SHA mismatch before bitmap or encoder allocation', async () => {
    const f = fixture({ response: async () => new Response(new Uint8Array([9, 9, 9])) });
    await expect(f.run()).rejects.toThrow(/reference changed/); expect(f.jobs.map(row => row.job.stage)).toEqual(['text']);
    expect(f.decodeBitmap).not.toHaveBeenCalled(); expect(f.canvases).toHaveLength(0); f.retired();
  });

  it('rejects oversized headers and streamed bytes, cancels an oversized stream, and releases its reader', async () => {
    const canceled = vi.fn();
    const streamed = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(16 * 1024 * 1024 + 1)); }, cancel: canceled });
    const f = fixture({ response: async () => new Response(streamed) });
    await expect(f.run()).rejects.toThrow(/oversized/); expect(canceled).toHaveBeenCalledOnce(); expect(streamed.locked).toBe(false);
    expect(f.decodeBitmap).not.toHaveBeenCalled(); f.retired();
    const headerCanceled = vi.fn();
    const headerBody = new ReadableStream({ cancel: headerCanceled });
    const header = fixture({ response: async () => new Response(headerBody, { headers: { 'Content-Length': String(16 * 1024 * 1024 + 1) } }) });
    await expect(header.run()).rejects.toThrow(/oversized/); expect(headerCanceled).toHaveBeenCalledOnce();
    expect(headerBody.locked).toBe(false); expect(header.decodeBitmap).not.toHaveBeenCalled(); header.retired();
  });

  it('cancels a non-OK reference response body before rejecting without image allocation', async () => {
    const canceled = vi.fn(), body = new ReadableStream({ cancel: canceled });
    const f = fixture({ response: async () => new Response(body, { status: 503 }) });
    await expect(f.run()).rejects.toThrow(/reference unavailable/); expect(canceled).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false); expect(f.decodeBitmap).not.toHaveBeenCalled(); f.retired();
  });

  it('rejects wrong typed lengths for every model stage without starting the next stage or publishing', async () => {
    for (const target of ['text', 'encode', 'denoise', 'decode'] as const) {
      const f = fixture({ result: (stage, value) => stage === target ? value.subarray(0, value.length - 1) : value });
      await expect(f.run()).rejects.toThrow(/shape mismatch/);
      expect(f.jobs.map(row => row.job.stage).at(-1)).toBe(target); expect(f.canvases.every(canvas => canvas.encodes === 0)).toBe(true); f.retired();
    }
  });

  it('rejects same-length wrong tensor types rather than trusting length alone', async () => {
    const f = fixture({ result: (stage, value) => stage === 'text' ? new Float32Array(value.length) : value });
    await expect(f.run()).rejects.toThrow(/Text embedding shape mismatch/); expect(f.jobs).toHaveLength(1); f.retired();
  });

  it('rejects missing, duplicate or out-of-order denoising progress using actual stage outcomes', async () => {
    for (const steps of [[1, 1], [2], [1, 2, 3]]) {
      const f = fixture({ intercept: (worker, job) => {
        if (job.stage !== 'denoise') return false;
        worker.emit({ type: 'progress', phase: 'loading' }); worker.emit({ type: 'progress', phase: 'loaded' });
        for (const step of steps) worker.emit({ type: 'progress', phase: 'step', step, steps: 4 });
        worker.emit({ type: 'complete', data: new Float32Array(64 * 36 * 128) }); return true;
      } });
      await expect(f.run()).rejects.toThrow(/Unordered drawing progress|Incomplete local model result/);
      expect(f.jobs.map(row => row.job.stage)).toEqual(['text', 'encode', 'denoise']); f.retired();
    }
  });

  it('rejects early completion and repeated loading; unknown telemetry cannot advance completion', async () => {
    for (const messages of [
      [{ type: 'complete', data: new Uint16Array(512 * 7680) }],
      [{ type: 'progress', phase: 'loading' }, { type: 'progress', phase: 'loading' }],
      [{ type: 'progress', phase: 'telemetry' }, { type: 'complete', data: new Uint16Array(512 * 7680) }],
    ]) {
      const f = fixture({ intercept: worker => { for (const data of messages) worker.emit(data); return true; } });
      await expect(f.run()).rejects.toThrow(/Incomplete|Duplicate/); expect(f.jobs).toHaveLength(1); expect(f.progress.every(row => row.completed === 0)).toBe(true); f.retired();
    }
  });

  it('cancels an active worker once, rejects late results, and creates no next worker', async () => {
    const f = fixture({ intercept: () => true }); const result = f.run(); const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(f.workers).toHaveLength(1); f.controller.abort(); await rejected;
    const before = f.progress.length; f.workers[0]!.emit({ type: 'complete', data: new Uint16Array(512 * 7680) });
    expect(f.progress).toHaveLength(before); expect(f.fetcher).not.toHaveBeenCalled(); f.retired();
  });

  it('allocates nothing for pre-aborted work', async () => {
    const f = fixture(); f.controller.abort(); await expect(f.run()).rejects.toMatchObject({ name: 'AbortError' });
    expect(f.workers).toHaveLength(0); expect(f.fetcher).not.toHaveBeenCalled(); expect(f.decodeBitmap).not.toHaveBeenCalled(); f.retired();
  });

  it('closes a bitmap that arrives after cancellation without canvas/encoder allocation', async () => {
    const held = deferred<{ close(): void }>(), late = { close: vi.fn() };
    const f = fixture({ bitmap: held.promise }); const result = f.run(); const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    await reaches(() => f.decodeBitmap.mock.calls.length === 1); f.controller.abort(); held.resolve(late); await rejected;
    expect(late.close).toHaveBeenCalledOnce(); expect(f.canvases).toHaveLength(0); expect(f.jobs).toHaveLength(1); f.retired();
  });

  it('closes bitmaps and retires scratch canvases through reference failures, including close failure', async () => {
    for (const canvasFailure of ['reference-context', 'draw', 'read'] as const) {
      const f = fixture({ canvasFailure }); await expect(f.run()).rejects.toThrow(); expect(f.bitmap.close).toHaveBeenCalledOnce();
      expect(f.jobs).toHaveLength(1); expect(f.canvases).toHaveLength(1); f.retired();
    }
    const close = fixture({ closeThrows: true }); await expect(close.run()).rejects.toThrow(/Bitmap close failed/);
    expect(close.bitmap.close).toHaveBeenCalledOnce(); expect(close.jobs).toHaveLength(1); close.retired();
  });

  it('retires the final canvas and refuses wrong/oversized PNG blobs or invalid decoded numbers', async () => {
    for (const blob of [new Blob([], { type: 'image/png' }), new Blob(['wrong'], { type: 'image/jpeg' }), new Blob([new Uint8Array(16 * 1024 * 1024 + 1)], { type: 'image/png' })]) {
      const f = fixture({ blob }); await expect(f.run()).rejects.toThrow(/encoded safely/); expect(f.canvases.at(-1)!.encodes).toBe(1); f.retired();
    }
    const nonfinite = fixture({ result: (stage, value) => { if (stage === 'decode') value[3] = NaN; return value; } });
    await expect(nonfinite.run()).rejects.toThrow(/Invalid painting pixels/); expect(nonfinite.canvases.at(-1)!.encodes).toBe(0); nonfinite.retired();
  });

  it('retires the painting canvas if context, pixel upload or PNG conversion fails', async () => {
    for (const canvasFailure of ['painting-context', 'put', 'encode'] as const) {
      const f = fixture({ canvasFailure }); await expect(f.run()).rejects.toThrow(); expect(f.canvases).toHaveLength(2); f.retired();
    }
  });

  it('refuses delayed encoded PNG publication after cancellation and retires its canvas', async () => {
    const held = deferred<Blob>(), f = fixture({ blob: held.promise });
    const result = f.run(); const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
    await reaches(() => f.canvases.some(canvas => canvas.encodes === 1)); f.controller.abort(); held.resolve(new Blob(['late'], { type: 'image/png' })); await rejected;
    expect(f.canvases).toHaveLength(2); f.retired();
  });

  it('fails a ten-minute held worker deadline and clears its timer and abort listener', async () => {
    const f = fixture({ intercept: () => true }); const result = f.run(); const rejected = expect(result).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(600000); await rejected; f.retired(); f.controller.abort(); f.retired();
  });

  it('propagates GPU, worker, deserialization and callback failures with exactly one retirement', async () => {
    for (const failure of ['gpu', 'worker', 'message', 'callback'] as const) {
      const f = fixture({ onProgress: failure === 'callback' ? () => { throw Error('Progress callback failed'); } : undefined,
        intercept: (worker, job) => {
          if (failure === 'gpu') worker.emit({ type: 'progress', phase: 'gpu-error', message: 'GPU lost' });
          else if (failure === 'worker') worker.onerror?.({ message: 'Worker failed' } as ErrorEvent);
          else if (failure === 'message') worker.onmessageerror?.(); else worker.complete(job);
          return true;
        } });
      await expect(f.run()).rejects.toThrow(); expect(f.jobs).toHaveLength(1); expect(f.fetcher).not.toHaveBeenCalled(); f.retired();
    }
  });
});
