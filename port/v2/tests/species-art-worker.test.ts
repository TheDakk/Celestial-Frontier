import { describe, expect, it, vi } from 'vitest';
import type {
  SpeciesArtProducerRequest,
  SpeciesArtProducerSink,
} from '@cf/art/species-broker';
import { speciesVisualKey } from '@cf/art/species-identity';
import {
  SPECIES_ART_WORKER_REQUEST_SCHEMA,
  SPECIES_ART_WORKER_RESPONSE_SCHEMA,
  speciesArtWorkerIdentityMatches,
  type SpeciesArtWorkerPhase,
  type SpeciesArtWorkerRenderRequest,
  type SpeciesArtWorkerResponse,
  validSpeciesArtWorkerRequest,
  validSpeciesArtWorkerResponse,
} from '../apps/game/src/species-art-protocol.js';
import { SpeciesArtWorkerCore } from '../apps/game/src/species-art-worker-core.js';
import {
  SpeciesArtLoader,
  type SpeciesArtWorkerLike,
} from '../apps/game/src/species-art-loader.js';

const IDENTITY = Object.freeze({
  documentToken: 'document-token', producerEpoch: 1, workerInstanceId: 1,
});
const GENOME = Object.freeze({ seed: 133, lin: { kingdom: 'flora' }, size: 0.75 });
const KEY = String(speciesVisualKey(GENOME));
const init = () => ({
  schema: SPECIES_ART_WORKER_REQUEST_SCHEMA,
  type: 'init' as const,
  ...IDENTITY,
});
const render = (overrides: Partial<SpeciesArtWorkerRenderRequest> = {}): SpeciesArtWorkerRenderRequest => ({
  schema: SPECIES_ART_WORKER_REQUEST_SCHEMA,
  type: 'render',
  ...IDENTITY,
  jobId: 1,
  kind: 'thumb132',
  key: KEY,
  genome: GENOME,
  ...overrides,
});

class EvidenceWorker implements SpeciesArtWorkerLike {
  readonly sent: unknown[] = [];
  readonly listeners = new Map<string, Array<(event: MessageEvent<unknown> | Event) => void>>();
  terminated = 0;
  postMessage(message: unknown): void { this.sent.push(message); }
  terminate(): void { this.terminated++; }
  addEventListener(type: 'message' | 'error' | 'messageerror', listener: never): void {
    const group = this.listeners.get(type) ?? [];
    group.push(listener as (event: MessageEvent<unknown> | Event) => void);
    this.listeners.set(type, group);
  }
  emit(data: unknown): void {
    for (const listener of this.listeners.get('message') ?? []) {
      listener({ data } as MessageEvent<unknown>);
    }
  }
  emitEvent(type: 'error' | 'messageerror'): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ type } as Event);
    }
  }
}

describe('species art worker protocol', () => {
  it('accepts only exact request and response shapes', () => {
    expect(validSpeciesArtWorkerRequest(init())).toBe(true);
    expect(validSpeciesArtWorkerRequest(render())).toBe(true);
    expect(validSpeciesArtWorkerRequest(render({ testFailureMessage: 'controlled failure' }))).toBe(true);
    expect(validSpeciesArtWorkerRequest(render({ testFailureMessage: '' }))).toBe(false);
    expect(validSpeciesArtWorkerRequest({ ...render(), retry: 1 })).toBe(false);
    expect(validSpeciesArtWorkerRequest({ ...render(), jobId: 0 })).toBe(false);
    expect(validSpeciesArtWorkerRequest({ ...render(), genome: [] })).toBe(false);

    const ready = { schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready' as const, ...IDENTITY };
    expect(validSpeciesArtWorkerResponse(ready)).toBe(true);
    expect(speciesArtWorkerIdentityMatches(ready, IDENTITY)).toBe(true);
    expect(speciesArtWorkerIdentityMatches(ready, { ...IDENTITY, workerInstanceId: 2 })).toBe(false);
    expect(validSpeciesArtWorkerResponse({ ...ready, copiedPass: true })).toBe(false);

    const structuredError = {
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'error' as const, ...IDENTITY,
      jobId: null, kind: null, key: null,
      stage: 'capability' as const, code: 'worker-capability', message: 'x',
    };
    expect(validSpeciesArtWorkerResponse(structuredError)).toBe(true);
    expect(validSpeciesArtWorkerResponse({ ...structuredError, jobId: 1 })).toBe(false);
    expect(validSpeciesArtWorkerResponse({
      ...structuredError, jobId: 1, kind: 'thumb132', key: KEY,
    })).toBe(true);
    expect(validSpeciesArtWorkerResponse({ ...structuredError, message: 'x'.repeat(512) })).toBe(true);
    expect(validSpeciesArtWorkerResponse({ ...structuredError, message: '' })).toBe(false);
    expect(validSpeciesArtWorkerResponse({ ...structuredError, message: 'x'.repeat(513) })).toBe(false);
  });

  it('publishes a capability failure before readiness or painter import', async () => {
    const emitted: SpeciesArtWorkerResponse[] = [];
    let checks = 0;
    let imports = 0;
    const core = new SpeciesArtWorkerCore({
      checkCapabilities: () => { checks++; throw new Error('OffscreenCanvas unavailable'); },
      emit: (response) => emitted.push(response),
      loadPainter: async () => {
        imports++;
        return {
          renderSpeciesThumbCanvas: () => ({ width: 132, height: 132 }),
          renderSpeciesPortraitCanvas: () => ({ width: 440, height: 440 }),
        };
      },
      encodeCanvas: async () => ({
        url: 'data:image/png;base64,cG5n', encodedBytes: 30, pngBytes: 3,
      }),
    });
    await core.handle(init());
    expect(checks).toBe(1);
    expect(imports).toBe(0);
    expect(emitted).toEqual([expect.objectContaining({
      type: 'error', jobId: null, kind: null, key: null,
      stage: 'capability', code: 'worker-capability',
    })]);
  });

  it('recomputes identity and emits the complete serial phase/result sequence', async () => {
    const emitted: SpeciesArtWorkerResponse[] = [];
    let clock = 0;
    let imports = 0;
    const core = new SpeciesArtWorkerCore({
      emit: (response) => emitted.push(response),
      now: () => clock++,
      loadPainter: async () => {
        imports++;
        return {
          renderSpeciesThumbCanvas: () => ({ width: 132, height: 132 }),
          renderSpeciesPortraitCanvas: () => ({ width: 440, height: 440 }),
        };
      },
      encodeCanvas: async () => ({
        url: 'data:image/png;base64,cG5n', encodedBytes: 30, pngBytes: 3,
      }),
    });

    await core.handle(init());
    await core.handle(render());
    await core.handle(render({ jobId: 2, kind: 'portrait440' }));

    expect(imports).toBe(1);
    expect(emitted.map((entry) => entry.type === 'phase' ? entry.phase : entry.type)).toEqual([
      'ready',
      'import-start', 'import-complete', 'job-start', 'render-complete', 'encode-start', 'encode-complete', 'result',
      'job-start', 'render-complete', 'encode-start', 'encode-complete', 'result',
    ]);
    expect(emitted.every(validSpeciesArtWorkerResponse)).toBe(true);
    const results = emitted.filter((entry) => entry.type === 'result');
    expect(results.map((entry) => [entry.jobId, entry.width, entry.height, entry.decodedPixels])).toEqual([
      [1, 132, 132, 132 * 132], [2, 440, 440, 440 * 440],
    ]);
  });

  it('rejects wrong keys, identities, dimensions and duplicate initialization', async () => {
    const emitted: SpeciesArtWorkerResponse[] = [];
    const core = new SpeciesArtWorkerCore({
      emit: (response) => emitted.push(response),
      loadPainter: async () => ({
        renderSpeciesThumbCanvas: () => ({ width: 440, height: 440 }),
        renderSpeciesPortraitCanvas: () => ({ width: 440, height: 440 }),
      }),
      encodeCanvas: async () => ({ url: 'data:image/png;base64,cG5n', encodedBytes: 30, pngBytes: 3 }),
      now: () => 1,
    });
    await core.handle(init());
    await core.handle({ ...init(), workerInstanceId: 2 });
    await core.handle(render({ jobId: 2, key: `${KEY}:wrong` }));
    await core.handle(render({ jobId: 3, workerInstanceId: 2 }));
    await core.handle(render({ jobId: 4 }));
    expect(emitted.filter((entry) => entry.type === 'error').map((entry) => entry.code)).toEqual([
      'duplicate-init', 'key-mismatch', 'identity-mismatch', 'wrong-dimensions',
    ]);
    expect(emitted.some((entry) => entry.type === 'result')).toBe(false);
  });

  it('rejects concurrent jobs without retrying either request', async () => {
    const emitted: SpeciesArtWorkerResponse[] = [];
    let releaseEncode: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => { releaseEncode = resolve; });
    let encodeCalls = 0;
    const core = new SpeciesArtWorkerCore({
      emit: (response) => emitted.push(response),
      loadPainter: async () => ({
        renderSpeciesThumbCanvas: () => ({ width: 132, height: 132 }),
        renderSpeciesPortraitCanvas: () => ({ width: 440, height: 440 }),
      }),
      encodeCanvas: async () => {
        encodeCalls++;
        await gate;
        return { url: 'data:image/png;base64,cG5n', encodedBytes: 30, pngBytes: 3 };
      },
      now: () => 1,
    });
    await core.handle(init());
    const first = core.handle(render());
    await Promise.resolve();
    await Promise.resolve();
    await core.handle(render({ jobId: 2 }));
    const release = releaseEncode as (() => void) | null;
    release?.();
    await first;
    expect(encodeCalls).toBe(1);
    expect(emitted.filter((entry) => entry.type === 'error').map((entry) => entry.code)).toEqual(['concurrent-job']);
    expect(emitted.filter((entry) => entry.type === 'result').map((entry) => entry.jobId)).toEqual([1]);
  });

  it('keeps import and encode failures structured and terminal for the job', async () => {
    const importEvents: SpeciesArtWorkerResponse[] = [];
    const importCore = new SpeciesArtWorkerCore({
      emit: (response) => importEvents.push(response),
      loadPainter: async () => { throw new Error('import refused'); },
      encodeCanvas: async () => ({ url: 'data:image/png;base64,cG5n', encodedBytes: 30, pngBytes: 3 }),
      now: () => 1,
    });
    await importCore.handle(init());
    await importCore.handle(render());
    expect(importEvents.filter((entry) => entry.type === 'error').map((entry) => [entry.stage, entry.code]))
      .toEqual([['import', 'painter-import']]);
    expect(importEvents.some((entry) => entry.type === 'result')).toBe(false);

    const encodeEvents: SpeciesArtWorkerResponse[] = [];
    const encodeCore = new SpeciesArtWorkerCore({
      emit: (response) => encodeEvents.push(response),
      loadPainter: async () => ({
        renderSpeciesThumbCanvas: () => ({ width: 132, height: 132 }),
        renderSpeciesPortraitCanvas: () => ({ width: 440, height: 440 }),
      }),
      encodeCanvas: async () => { throw new Error('encode refused'); },
      now: () => 1,
    });
    await encodeCore.handle(init());
    await encodeCore.handle(render());
    expect(encodeEvents.filter((entry) => entry.type === 'error').map((entry) => [entry.stage, entry.code]))
      .toEqual([['encode', 'png-encode']]);
    expect(encodeEvents.some((entry) => entry.type === 'result')).toBe(false);
  });

  it('routes the evidence failure through the initialized worker job without painting or retrying', async () => {
    const emitted: SpeciesArtWorkerResponse[] = [];
    let paintCalls = 0;
    let encodeCalls = 0;
    const core = new SpeciesArtWorkerCore({
      emit: (response) => emitted.push(response),
      loadPainter: async () => ({
        renderSpeciesThumbCanvas: () => { paintCalls++; return { width: 132, height: 132 }; },
        renderSpeciesPortraitCanvas: () => { paintCalls++; return { width: 440, height: 440 }; },
      }),
      encodeCanvas: async () => {
        encodeCalls++;
        return { url: 'data:image/png;base64,cG5n', encodedBytes: 30, pngBytes: 3 };
      },
      now: () => 1,
    });
    await core.handle(init());
    await core.handle(render({ testFailureMessage: 'controlled worker paint failure' }));
    expect(emitted.map((entry) => entry.type === 'phase' ? entry.phase : entry.type)).toEqual([
      'ready', 'import-start', 'import-complete', 'job-start', 'error',
    ]);
    expect(emitted.at(-1)).toMatchObject({
      type: 'error', stage: 'paint', code: 'injected-failure',
      message: 'controlled worker paint failure',
    });
    expect(paintCalls).toBe(0);
    expect(encodeCalls).toBe(0);
    expect(emitted.some((entry) => entry.type === 'result')).toBe(false);
  });

  it('binds the real loader port to one exact worker job with no pre-activation construction', () => {
    class FakeWorker implements SpeciesArtWorkerLike {
      readonly sent: unknown[] = [];
      readonly listeners = new Map<string, Array<(event: MessageEvent<unknown> | Event) => void>>();
      terminated = 0;
      postMessage(message: unknown): void { this.sent.push(message); }
      terminate(): void { this.terminated++; }
      addEventListener(type: 'message' | 'error' | 'messageerror', listener: never): void {
        const group = this.listeners.get(type) ?? [];
        group.push(listener as (event: MessageEvent<unknown> | Event) => void);
        this.listeners.set(type, group);
      }
      emitMessage(data: unknown): void {
        for (const listener of this.listeners.get('message') ?? []) {
          listener({ data } as MessageEvent<unknown>);
        }
      }
    }
    const workers: FakeWorker[] = [];
    const tasks: Array<() => void> = [];
    const createThumbObjectUrl = vi.spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:loader-thumb-1');
    const revokeThumbObjectUrl = vi.spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    const loader = new SpeciesArtLoader('loader-document', {
      workerFactory: () => {
        const worker = new FakeWorker();
        workers.push(worker);
        return worker;
      },
      getDeviceClass: () => 'phone',
      scheduleTask: (task) => { tasks.push(task); },
    });
    const received: unknown[] = [];
    const lease = loader.leaseThumb(GENOME);
    lease.subscribe((asset, error) => { received.push(error ?? asset); });
    expect(workers).toHaveLength(0);
    expect(loader.diagnostics()).toMatchObject({
      schema: 'cf-v2-species-art-worker-diagnostics/v2',
      state: 'idle', importStarts: 0,
      lastError: null,
      worker: { live: false, starts: 0, ready: 0, disposals: 0 },
    });
    loader.activate();
    expect(workers).toHaveLength(0);
    expect(tasks).toHaveLength(1);
    tasks.shift()!();
    expect(workers).toHaveLength(1);
    const worker = workers[0]!;
    expect(worker.sent).toHaveLength(1);
    const initRequest = worker.sent[0] as Record<string, unknown>;
    expect(initRequest).toMatchObject({
      schema: SPECIES_ART_WORKER_REQUEST_SCHEMA,
      type: 'init',
      documentToken: 'loader-document',
      producerEpoch: 1,
      workerInstanceId: 1,
    });
    worker.emitMessage({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA,
      type: 'ready',
      documentToken: 'loader-document',
      producerEpoch: 1,
      workerInstanceId: 1,
    });
    expect(loader.diagnostics()).toMatchObject({ state: 'loading', importStarts: 1 });
    expect(worker.sent).toHaveLength(2);
    const renderRequest = worker.sent[1] as SpeciesArtWorkerRenderRequest;
    expect(renderRequest).toMatchObject({ type: 'render', jobId: 1, kind: 'thumb132', key: KEY });
    expect(validSpeciesArtWorkerRequest(renderRequest)).toBe(true);
    const emitPhase = (phase: SpeciesArtWorkerPhase): void => {
      worker.emitMessage({
        schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA,
        type: 'phase',
        documentToken: 'loader-document',
        producerEpoch: 1,
        workerInstanceId: 1,
        jobId: 1,
        kind: 'thumb132',
        key: KEY,
        phase,
        performanceNow: 1,
      });
    };
    emitPhase('import-start');
    expect(loader.diagnostics()).toMatchObject({ state: 'loading', importStarts: 1 });
    emitPhase('import-complete');
    expect(loader.diagnostics()).toMatchObject({ state: 'ready', importStarts: 1 });
    for (const phase of ['job-start', 'render-complete', 'encode-start', 'encode-complete'] as const) {
      emitPhase(phase);
    }
    const url = 'data:image/png;base64,cG5n';
    worker.emitMessage({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA,
      type: 'result',
      documentToken: 'loader-document',
      producerEpoch: 1,
      workerInstanceId: 1,
      jobId: 1,
      kind: 'thumb132',
      key: KEY,
      width: 132,
      height: 132,
      url,
      encodedBytes: new TextEncoder().encode(url).byteLength,
      pngBytes: 3,
      decodedPixels: 132 * 132,
      importDurationMs: 1,
      renderDurationMs: 2,
      encodeDurationMs: 3,
    });
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      key: KEY, width: 132, height: 132, url: 'blob:loader-thumb-1',
    });
    expect(createThumbObjectUrl).toHaveBeenCalledOnce();
    expect(createThumbObjectUrl.mock.calls[0]![0]).toBeInstanceOf(Blob);
    expect(lease.current).toMatchObject({ key: KEY, width: 132, height: 132 });
    expect(loader.artDiagnostics()?.live).toMatchObject({ queuedJobs: 0, activeJobs: 0, leases: 1 });
    expect(loader.diagnostics()).toMatchObject({
      identity: {
        documentToken: 'loader-document', lastProducerEpoch: 1, lastWorkerInstanceId: 1,
      },
      lastEvent: {
        producerEpoch: 1, workerInstanceId: 1, jobId: 1, kind: 'thumb132', event: 'result',
      },
      lastError: null,
      worker: { live: false, starts: 1, ready: 1, disposals: 1, fatals: 0, protocolErrors: 0 },
      phases: {
        importStarts: 1, importCompletes: 1,
        thumbJobStarts: 1, thumbRenderCompletes: 1,
        thumbEncodeStarts: 1, thumbEncodeCompletes: 1,
      },
      results: {
        count: 1, maxImportDurationMs: 1,
        maxRenderDurationMs: 2, maxEncodeDurationMs: 3,
      },
      errors: { capability: 0, protocol: 0, import: 0, paint: 0, encode: 0 },
    });
    lease.release();
    loader.dispose('test complete');
    expect(worker.terminated).toBe(1);
    expect(revokeThumbObjectUrl).toHaveBeenCalledExactlyOnceWith('blob:loader-thumb-1');
    expect(workers).toHaveLength(1);
    vi.restoreAllMocks();
  });

  it('keeps successful portrait worker data URLs outside thumbnail Blob ownership', () => {
    class FakeWorker implements SpeciesArtWorkerLike {
      readonly sent: unknown[] = [];
      readonly listeners = new Map<string, Array<(event: MessageEvent<unknown> | Event) => void>>();
      terminated = 0;
      postMessage(message: unknown): void { this.sent.push(message); }
      terminate(): void { this.terminated++; }
      addEventListener(type: 'message' | 'error' | 'messageerror', listener: never): void {
        const group = this.listeners.get(type) ?? [];
        group.push(listener as (event: MessageEvent<unknown> | Event) => void);
        this.listeners.set(type, group);
      }
      emitMessage(data: unknown): void {
        for (const listener of this.listeners.get('message') ?? []) {
          listener({ data } as MessageEvent<unknown>);
        }
      }
    }
    const workers: FakeWorker[] = [];
    const tasks: Array<() => void> = [];
    // Negative control: either ownership hook becoming reachable for a portrait is terminal.
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('portrait must not acquire a thumbnail Blob URL');
    });
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {
      throw new Error('portrait must not revoke a thumbnail Blob URL');
    });
    try {
      const loader = new SpeciesArtLoader('portrait-document', {
        workerFactory: () => {
          const worker = new FakeWorker();
          workers.push(worker);
          return worker;
        },
        getDeviceClass: () => 'phone',
        scheduleTask: (task) => { tasks.push(task); },
      });
      const received: unknown[] = [];
      const request = loader.requestPortrait('portrait-owner', GENOME, (asset, error) => {
        received.push(error ?? asset);
      });
      loader.activate();
      tasks.shift()!();

      const worker = workers[0]!;
      worker.emitMessage({
        schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA,
        type: 'ready',
        documentToken: 'portrait-document',
        producerEpoch: 1,
        workerInstanceId: 1,
      });
      const renderRequest = worker.sent[1] as SpeciesArtWorkerRenderRequest;
      expect(renderRequest).toMatchObject({
        type: 'render', jobId: 1, kind: 'portrait440', key: KEY,
      });
      const emitPhase = (phase: SpeciesArtWorkerPhase): void => {
        worker.emitMessage({
          schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA,
          type: 'phase',
          documentToken: 'portrait-document',
          producerEpoch: 1,
          workerInstanceId: 1,
          jobId: 1,
          kind: 'portrait440',
          key: KEY,
          phase,
          performanceNow: 1,
        });
      };
      for (const phase of [
        'import-start', 'import-complete', 'job-start',
        'render-complete', 'encode-start', 'encode-complete',
      ] as const) emitPhase(phase);

      const url = 'data:image/png;base64,cG9ydHJhaXQ=';
      worker.emitMessage({
        schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA,
        type: 'result',
        documentToken: 'portrait-document',
        producerEpoch: 1,
        workerInstanceId: 1,
        jobId: 1,
        kind: 'portrait440',
        key: KEY,
        width: 440,
        height: 440,
        url,
        encodedBytes: new TextEncoder().encode(url).byteLength,
        pngBytes: 8,
        decodedPixels: 440 * 440,
        importDurationMs: 1,
        renderDurationMs: 2,
        encodeDurationMs: 3,
      });

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({ key: KEY, width: 440, height: 440, url });
      expect(request.current).toMatchObject({ key: KEY, width: 440, height: 440, url });
      expect(createObjectUrl).not.toHaveBeenCalled();
      loader.dispose('portrait bypass test complete');
      expect(revokeObjectUrl).not.toHaveBeenCalled();
      expect(worker.terminated).toBe(1);
      expect(workers).toHaveLength(1);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('services one animation frame and one later task before every default broker pump', () => {
    vi.useFakeTimers();
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
      frames.push(callback);
      return frames.length;
    });
    try {
      let sink: SpeciesArtProducerSink | null = null;
      const requests: SpeciesArtProducerRequest[] = [];
      const loader = new SpeciesArtLoader('serviced-turn-document', {
        createProducer: (next) => {
          sink = next;
          return {
            render: (request) => { requests.push(request); },
            dispose: () => {},
          };
        },
        getDeviceClass: () => 'phone',
      });
      const first = loader.leaseThumb(GENOME);
      const second = loader.leaseThumb({ ...GENOME, seed: 134 });
      loader.activate();
      expect(requests).toHaveLength(0);
      expect(frames).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);

      vi.runOnlyPendingTimers();
      expect(requests).toHaveLength(0);
      frames.shift()!(0);
      expect(requests).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(1);
      vi.runOnlyPendingTimers();
      expect(requests).toHaveLength(1);

      const completed = requests[0]!;
      const url = 'data:image/png;base64,cG5n';
      sink!.result({
        status: 'success', jobId: completed.jobId, kind: completed.kind, key: completed.key,
        asset: {
          key: completed.key, width: 132, height: 132, url,
          encodedBytes: new TextEncoder().encode(url).byteLength,
          decodedPixels: 132 * 132,
        },
      });
      expect(requests).toHaveLength(1);
      expect(frames).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);

      vi.runOnlyPendingTimers();
      expect(requests).toHaveLength(1);
      frames.shift()!(16);
      expect(requests).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(1);
      vi.runOnlyPendingTimers();
      expect(requests).toHaveLength(2);
      first.release();
      second.release();
      loader.dispose('serviced-turn test complete');
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it('invalidates a pending default pump across bfcache suspension and resumes on a fresh turn', () => {
    vi.useFakeTimers();
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
      frames.push(callback);
      return frames.length;
    });
    try {
      const requests: SpeciesArtProducerRequest[] = [];
      const loader = new SpeciesArtLoader('suspended-turn-document', {
        createProducer: () => ({
          render: (request) => { requests.push(request); },
          dispose: () => {},
        }),
        getDeviceClass: () => 'phone',
      });
      const lease = loader.leaseThumb(GENOME);
      loader.activate();
      expect(frames).toHaveLength(1);

      loader.suspendForBfcache();
      loader.resumeFromBfcache();
      expect(frames).toHaveLength(2);

      frames.shift()!(0);
      vi.runOnlyPendingTimers();
      expect(requests).toHaveLength(0);

      frames.shift()!(16);
      expect(requests).toHaveLength(0);
      vi.runOnlyPendingTimers();
      expect(requests).toHaveLength(1);
      lease.release();
      loader.dispose('suspended-turn test complete');
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it('exposes deterministic unowned-cache release without disturbing a live loader lease', () => {
    let sink: SpeciesArtProducerSink | null = null;
    const requests: SpeciesArtProducerRequest[] = [];
    const tasks: Array<() => void> = [];
    const loader = new SpeciesArtLoader('cache-release-document', {
      createProducer: (next) => {
        sink = next;
        return {
          render: (request) => { requests.push(request); },
          dispose: () => {},
        };
      },
      scheduleTask: (task) => { tasks.push(task); },
    });
    const complete = (request: SpeciesArtProducerRequest): void => {
      const url = `data:image/png;base64,cache-release-${request.jobId}`;
      sink!.result({
        status: 'success', jobId: request.jobId, kind: request.kind, key: request.key,
        asset: {
          key: request.key, width: 132, height: 132, url,
          encodedBytes: new TextEncoder().encode(url).byteLength,
          decodedPixels: 132 * 132,
        },
      });
    };

    const dormant = loader.releaseUnownedCachedArt();
    expect(dormant).toEqual({
      schema: 'cf-v2-species-art-unowned-cache-release/v1',
      releasedThumbEntries: 0,
      releasedPortraitEntries: 0,
      releasedEntries: 0,
    });
    expect(Object.isFrozen(dormant)).toBe(true);
    expect(loader.artDiagnostics()).toBeNull();

    const retained = loader.leaseThumb(GENOME);
    loader.activate();
    tasks.shift()!();
    complete(requests[0]!);
    const retainedAsset = retained.current;
    expect(retainedAsset).not.toBeNull();
    expect(loader.releaseUnownedCachedArt().releasedEntries).toBe(0);
    expect(retained.current).toBe(retainedAsset);

    retained.release();
    expect(loader.releaseUnownedCachedArt()).toEqual({
      schema: 'cf-v2-species-art-unowned-cache-release/v1',
      releasedThumbEntries: 1,
      releasedPortraitEntries: 0,
      releasedEntries: 1,
    });
    expect(loader.releaseUnownedCachedArt().releasedEntries).toBe(0);
    expect(loader.artDiagnostics()).toMatchObject({
      live: { cacheEntries: 0, leases: 0 },
      totals: { disposals: 1 },
    });

    const reacquired = loader.leaseThumb(GENOME);
    expect(reacquired.current).toBeNull();
    tasks.shift()!();
    complete(requests[1]!);
    expect(reacquired.current).not.toBeNull();
    expect(reacquired.current).not.toBe(retainedAsset);
    expect(reacquired.current?.url).not.toBe(retainedAsset?.url);
    reacquired.release();
    loader.dispose('cache release test complete');
  });

  it('owns one real device-class subscription and trims a narrowed queue immediately', () => {
    let deviceClass: 'phone' | 'desktop' = 'desktop';
    let deviceChange: (() => void) | null = null;
    let subscriptions = 0;
    let releases = 0;
    const loader = new SpeciesArtLoader('device-change-document', {
      createProducer: () => ({ render: () => {}, dispose: () => {} }),
      getDeviceClass: () => deviceClass,
      subscribeDeviceClassChange: (listener) => {
        subscriptions++;
        deviceChange = listener;
        return () => { releases++; };
      },
    });
    const leases = Array.from(
      { length: 97 }, (_, index) => loader.leaseThumb({ ...GENOME, seed: 9000 + index }),
    );
    expect(subscriptions).toBe(1);
    expect(loader.artDiagnostics()).toMatchObject({
      deviceClass: 'desktop',
      limits: { queuedJobs: 256 },
      live: { queuedJobs: 97 },
    });

    deviceClass = 'phone';
    const notifyDeviceChange = deviceChange as (() => void) | null;
    notifyDeviceChange?.();
    expect(loader.artDiagnostics()).toMatchObject({
      deviceClass: 'phone',
      limits: { queuedJobs: 96 },
      live: { queuedJobs: 96 },
      totals: { jobCancels: 1 },
    });
    for (const lease of leases) lease.release();
    loader.dispose('device-change test complete');
    loader.dispose('duplicate disposal control');
    expect(releases).toBe(1);
  });

  it('fails a mismatched worker result once and never retries the job', () => {
    class FakeWorker implements SpeciesArtWorkerLike {
      readonly sent: unknown[] = [];
      message: ((event: MessageEvent<unknown>) => void) | null = null;
      terminated = 0;
      postMessage(message: unknown): void { this.sent.push(message); }
      terminate(): void { this.terminated++; }
      addEventListener(type: 'message' | 'error' | 'messageerror', listener: never): void {
        if (type === 'message') this.message = listener as (event: MessageEvent<unknown>) => void;
      }
      emit(data: unknown): void { this.message?.({ data } as MessageEvent<unknown>); }
    }
    const worker = new FakeWorker();
    let workerStarts = 0;
    const tasks: Array<() => void> = [];
    const loader = new SpeciesArtLoader('loader-document', {
      workerFactory: () => { workerStarts++; return worker; },
      scheduleTask: (task) => { tasks.push(task); },
    });
    const errors: unknown[] = [];
    const lease = loader.leaseThumb(GENOME);
    lease.subscribe((_asset, error) => { if (error) errors.push(error); });
    loader.activate();
    tasks.shift()!();
    worker.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready',
      documentToken: 'loader-document', producerEpoch: 1, workerInstanceId: 1,
    });
    const url = 'data:image/png;base64,cG5n';
    worker.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'result',
      documentToken: 'loader-document', producerEpoch: 1, workerInstanceId: 1,
      jobId: 1, kind: 'thumb132', key: `${KEY}:wrong`, width: 132, height: 132,
      url, encodedBytes: new TextEncoder().encode(url).byteLength,
      pngBytes: 3, decodedPixels: 132 * 132,
      importDurationMs: 0, renderDurationMs: 0, encodeDurationMs: 0,
    });
    expect(worker.terminated).toBe(1);
    expect(errors).toHaveLength(1);
    expect(loader.diagnostics()).toMatchObject({
      state: 'error', importStarts: 1,
      lastError: null,
      worker: { live: false, starts: 1, disposals: 1, fatals: 1, protocolErrors: 1 },
    });
    expect(loader.artDiagnostics()?.totals).toMatchObject({ jobStarts: 1, jobErrors: 1 });
    while (tasks.length) tasks.shift()!();
    expect(workerStarts).toBe(1);
    lease.release();
  });

  it('does not trust malformed worker-error evidence as the last structured error', () => {
    const worker = new EvidenceWorker();
    const tasks: Array<() => void> = [];
    const loader = new SpeciesArtLoader('malformed-error-document', {
      workerFactory: () => worker,
      scheduleTask: (task) => { tasks.push(task); },
    });
    const lease = loader.leaseThumb(GENOME);
    loader.activate();
    tasks.shift()!();
    const identity = {
      documentToken: 'malformed-error-document', producerEpoch: 1, workerInstanceId: 1,
    };
    worker.emit({ schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready', ...identity });
    const request = worker.sent[1] as SpeciesArtWorkerRenderRequest;
    worker.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'error', ...identity,
      jobId: request.jobId, kind: request.kind, key: request.key,
      stage: 'import', code: 'painter-import', message: 'x'.repeat(513),
    });
    expect(worker.terminated).toBe(1);
    expect(loader.diagnostics()).toMatchObject({
      state: 'error', lastError: null,
      worker: { live: false, disposals: 1, fatals: 1, protocolErrors: 1 },
      errors: { import: 0 },
    });
    lease.release();
    loader.dispose('malformed error evidence test complete');
  });

  it('replaces immutable structured worker-error evidence only with a later trusted error', () => {
    const worker = new EvidenceWorker();
    const tasks: Array<() => void> = [];
    const loader = new SpeciesArtLoader('successive-error-document', {
      workerFactory: () => worker,
      scheduleTask: (task) => { tasks.push(task); },
    });
    const first = loader.leaseThumb({ ...GENOME, seed: 6101 });
    const second = loader.leaseThumb({ ...GENOME, seed: 6102 });
    loader.activate();
    tasks.shift()!();
    const identity = {
      documentToken: 'successive-error-document', producerEpoch: 1, workerInstanceId: 1,
    };
    worker.emit({ schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready', ...identity });
    const firstRequest = worker.sent[1] as SpeciesArtWorkerRenderRequest;
    const emitPhase = (request: SpeciesArtWorkerRenderRequest, phase: SpeciesArtWorkerPhase): void => {
      worker.emit({
        schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'phase', ...identity,
        jobId: request.jobId, kind: request.kind, key: request.key, phase, performanceNow: 1,
      });
    };
    for (const phase of ['import-start', 'import-complete', 'job-start'] as const) {
      emitPhase(firstRequest, phase);
    }
    worker.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'error', ...identity,
      jobId: firstRequest.jobId, kind: firstRequest.kind, key: firstRequest.key,
      stage: 'paint', code: 'painter-threw', message: 'first painter failure',
    });
    const firstError = loader.diagnostics().lastError;
    expect(firstError).toEqual({
      producerEpoch: 1, workerInstanceId: 1,
      jobId: firstRequest.jobId, kind: firstRequest.kind,
      stage: 'paint', code: 'painter-threw', message: 'first painter failure',
    });
    expect(Object.isFrozen(firstError)).toBe(true);

    expect(tasks).toHaveLength(1);
    tasks.shift()!();
    const secondRequest = worker.sent[2] as SpeciesArtWorkerRenderRequest;
    for (const phase of ['job-start', 'render-complete', 'encode-start'] as const) {
      emitPhase(secondRequest, phase);
    }
    worker.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'error', ...identity,
      jobId: secondRequest.jobId, kind: secondRequest.kind, key: secondRequest.key,
      stage: 'encode', code: 'png-encode', message: 'second encoder failure',
    });
    const secondError = loader.diagnostics().lastError;
    expect(secondError).toEqual({
      producerEpoch: 1, workerInstanceId: 1,
      jobId: secondRequest.jobId, kind: secondRequest.kind,
      stage: 'encode', code: 'png-encode', message: 'second encoder failure',
    });
    expect(secondError).not.toBe(firstError);
    expect(Object.isFrozen(secondError)).toBe(true);
    expect(loader.diagnostics().lastEvent).toMatchObject({
      producerEpoch: 1, workerInstanceId: 1,
      jobId: secondRequest.jobId, kind: secondRequest.kind, event: 'error:encode',
    });
    first.release();
    second.release();
    loader.dispose('successive error evidence test complete');
  });

  it('clears a trusted job error when a later untrusted terminal condition owns the same worker', () => {
    for (const terminal of ['protocol', 'external-fatal'] as const) {
      const worker = new EvidenceWorker();
      const tasks: Array<() => void> = [];
      const loader = new SpeciesArtLoader(`stale-error-${terminal}-document`, {
        workerFactory: () => worker,
        scheduleTask: (task) => { tasks.push(task); },
      });
      const first = loader.leaseThumb({ ...GENOME, seed: 6201 });
      const second = loader.leaseThumb({ ...GENOME, seed: 6202 });
      loader.activate();
      tasks.shift()!();
      const identity = {
        documentToken: `stale-error-${terminal}-document`,
        producerEpoch: 1,
        workerInstanceId: 1,
      };
      worker.emit({ schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready', ...identity });
      const request = worker.sent[1] as SpeciesArtWorkerRenderRequest;
      for (const phase of ['import-start', 'import-complete', 'job-start'] as const) {
        worker.emit({
          schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'phase', ...identity,
          jobId: request.jobId, kind: request.kind, key: request.key,
          phase, performanceNow: 1,
        });
      }
      worker.emit({
        schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'error', ...identity,
        jobId: request.jobId, kind: request.kind, key: request.key,
        stage: 'paint', code: 'painter-threw', message: 'trusted prior paint failure',
      });
      expect(loader.diagnostics().lastError).toMatchObject({
        producerEpoch: 1, workerInstanceId: 1, jobId: request.jobId,
        stage: 'paint', code: 'painter-threw', message: 'trusted prior paint failure',
      });

      if (terminal === 'protocol') {
        worker.emit({ schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready', ...identity });
      } else {
        worker.emitEvent('error');
      }
      expect(worker.terminated).toBe(1);
      expect(loader.diagnostics()).toMatchObject({
        state: 'error',
        lastError: null,
        worker: {
          live: false,
          fatals: 1,
          protocolErrors: terminal === 'protocol' ? 1 : 0,
        },
        errors: { paint: 1 },
      });
      first.release();
      second.release();
      loader.dispose(`stale ${terminal} evidence test complete`);
    }
  });

  it('clears prior producer receipts before a replacement worker can publish', () => {
    const workers: EvidenceWorker[] = [];
    const tasks: Array<() => void> = [];
    const loader = new SpeciesArtLoader('replacement-receipt-document', {
      workerFactory: () => {
        const worker = new EvidenceWorker();
        workers.push(worker);
        return worker;
      },
      scheduleTask: (task) => { tasks.push(task); },
    });
    const firstLease = loader.leaseThumb({ ...GENOME, seed: 6301 });
    loader.activate();
    tasks.shift()!();
    const first = workers[0]!;
    const firstIdentity = {
      documentToken: 'replacement-receipt-document', producerEpoch: 1, workerInstanceId: 1,
    };
    first.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready', ...firstIdentity,
    });
    const firstRequest = first.sent[1] as SpeciesArtWorkerRenderRequest;
    for (const phase of ['import-start', 'import-complete', 'job-start'] as const) {
      first.emit({
        schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'phase', ...firstIdentity,
        jobId: firstRequest.jobId, kind: firstRequest.kind, key: firstRequest.key,
        phase, performanceNow: 1,
      });
    }
    first.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'error', ...firstIdentity,
      jobId: firstRequest.jobId, kind: firstRequest.kind, key: firstRequest.key,
      stage: 'paint', code: 'painter-threw', message: 'prior producer failure',
    });
    expect(first.terminated).toBe(1);
    expect(loader.diagnostics()).toMatchObject({
      lastEvent: { producerEpoch: 1, workerInstanceId: 1, event: 'error:paint' },
      lastError: { producerEpoch: 1, workerInstanceId: 1, stage: 'paint' },
    });

    const secondLease = loader.leaseThumb({ ...GENOME, seed: 6302 });
    expect(tasks).toHaveLength(1);
    tasks.shift()!();
    expect(workers).toHaveLength(2);
    expect(loader.diagnostics()).toMatchObject({
      state: 'loading',
      identity: { lastProducerEpoch: 2, lastWorkerInstanceId: 2 },
      lastEvent: null,
      lastError: null,
    });

    const second = workers[1]!;
    const secondIdentity = {
      documentToken: 'replacement-receipt-document', producerEpoch: 2, workerInstanceId: 2,
    };
    second.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'error', ...secondIdentity,
      jobId: null, kind: null, key: null,
      stage: 'capability', code: 'worker-capability', message: 'replacement lacks canvas',
    });
    expect(second.terminated).toBe(1);
    expect(loader.diagnostics()).toMatchObject({
      state: 'error',
      identity: { lastProducerEpoch: 2, lastWorkerInstanceId: 2 },
      lastEvent: null,
      lastError: {
        producerEpoch: 2, workerInstanceId: 2, jobId: null, kind: null,
        stage: 'capability', code: 'worker-capability', message: 'replacement lacks canvas',
      },
      errors: { capability: 1, paint: 1 },
    });
    firstLease.release();
    secondLease.release();
    loader.dispose('replacement receipt test complete');
  });

  it('settles active and queued owners once on capability or import fatal without retry', () => {
    for (const stage of ['capability', 'import'] as const) {
      class FakeWorker implements SpeciesArtWorkerLike {
        readonly sent: unknown[] = [];
        readonly listeners = new Map<string, Array<(event: MessageEvent<unknown> | Event) => void>>();
        terminated = 0;
        postMessage(message: unknown): void { this.sent.push(message); }
        terminate(): void { this.terminated++; }
        addEventListener(type: 'message' | 'error' | 'messageerror', listener: never): void {
          const group = this.listeners.get(type) ?? [];
          group.push(listener as (event: MessageEvent<unknown> | Event) => void);
          this.listeners.set(type, group);
        }
        emit(data: unknown): void {
          for (const listener of this.listeners.get('message') ?? []) {
            listener({ data } as MessageEvent<unknown>);
          }
        }
      }
      const workers: FakeWorker[] = [];
      const tasks: Array<() => void> = [];
      const loader = new SpeciesArtLoader(`fatal-${stage}-document`, {
        workerFactory: () => {
          const worker = new FakeWorker();
          workers.push(worker);
          return worker;
        },
        scheduleTask: (task) => { tasks.push(task); },
      });
      const errors: unknown[] = [];
      const first = loader.leaseThumb({ ...GENOME, seed: 5101 });
      const second = loader.leaseThumb({ ...GENOME, seed: 5102 });
      first.subscribe((_asset, error) => { if (error) errors.push(error); });
      second.subscribe((_asset, error) => { if (error) errors.push(error); });
      loader.activate();
      expect(tasks).toHaveLength(1);
      tasks.shift()!();
      expect(workers).toHaveLength(1);
      const worker = workers[0]!;
      expect(loader.diagnostics().lastError).toBeNull();
      const identity = {
        documentToken: `fatal-${stage}-document`, producerEpoch: 1, workerInstanceId: 1,
      };
      if (stage === 'capability') {
        worker.emit({
          schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'error', ...identity,
          jobId: null, kind: null, key: null,
          stage, code: 'worker-capability', message: 'OffscreenCanvas unavailable',
        });
      } else {
        worker.emit({
          schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready', ...identity,
        });
        const request = worker.sent[1] as SpeciesArtWorkerRenderRequest;
        worker.emit({
          schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'phase', ...identity,
          jobId: request.jobId, kind: request.kind, key: request.key,
          phase: 'import-start', performanceNow: 1,
        });
        worker.emit({
          schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'error', ...identity,
          jobId: request.jobId, kind: request.kind, key: request.key,
          stage, code: 'painter-import', message: 'painter import refused',
        });
      }
      expect(errors).toHaveLength(2);
      expect(worker.terminated).toBe(1);
      expect(workers).toHaveLength(1);
      expect(worker.sent.filter((message) =>
        (message as { type?: string }).type === 'render')).toHaveLength(stage === 'import' ? 1 : 0);
      const failedRequest = stage === 'import'
        ? worker.sent[1] as SpeciesArtWorkerRenderRequest : null;
      expect(loader.diagnostics()).toMatchObject({
        state: 'error',
        lastError: {
          producerEpoch: 1,
          workerInstanceId: 1,
          jobId: failedRequest?.jobId ?? null,
          kind: failedRequest?.kind ?? null,
          stage,
          code: stage === 'import' ? 'painter-import' : 'worker-capability',
          message: stage === 'import' ? 'painter import refused' : 'OffscreenCanvas unavailable',
        },
        worker: {
          live: false, starts: 1, ready: stage === 'import' ? 1 : 0,
          disposals: 1, fatals: 1, protocolErrors: 0,
        },
        errors: { [stage]: 1 },
      });
      expect(Object.isFrozen(loader.diagnostics().lastError)).toBe(true);
      expect(loader.artDiagnostics()).toMatchObject({
        live: { activeJobs: 0, queuedJobs: 0 },
        totals: { jobStarts: 1, jobErrors: 2 },
      });
      while (tasks.length) tasks.shift()!();
      expect(workers).toHaveLength(1);
      first.release();
      second.release();
      loader.dispose(`fatal ${stage} test complete`);
      expect(worker.terminated).toBe(1);
    }
  });

  it('revokes a suspended worker and accepts only the requeued job from the resumed identity', () => {
    class FakeWorker implements SpeciesArtWorkerLike {
      readonly sent: unknown[] = [];
      message: ((event: MessageEvent<unknown>) => void) | null = null;
      terminated = 0;
      postMessage(message: unknown): void { this.sent.push(message); }
      terminate(): void { this.terminated++; }
      addEventListener(type: 'message' | 'error' | 'messageerror', listener: never): void {
        if (type === 'message') this.message = listener as (event: MessageEvent<unknown>) => void;
      }
      emit(data: unknown): void { this.message?.({ data } as MessageEvent<unknown>); }
    }
    const workers: FakeWorker[] = [];
    const tasks: Array<() => void> = [];
    const loader = new SpeciesArtLoader('loader-document', {
      workerFactory: () => {
        const worker = new FakeWorker();
        workers.push(worker);
        return worker;
      },
      scheduleTask: (task) => { tasks.push(task); },
    });
    const received: unknown[] = [];
    const lease = loader.leaseThumb(GENOME);
    lease.subscribe((asset, error) => { received.push(error ?? asset); });
    loader.activate();
    tasks.shift()!();
    const first = workers[0]!;
    first.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready',
      documentToken: 'loader-document', producerEpoch: 1, workerInstanceId: 1,
    });
    const staleRequest = first.sent[1] as SpeciesArtWorkerRenderRequest;
    loader.suspendForBfcache();
    expect(first.terminated).toBe(1);
    expect(loader.artDiagnostics()?.live).toMatchObject({ activeJobs: 0, queuedJobs: 1, leases: 1 });

    /* NEGATIVE CONTROL: output from the revoked realm cannot publish even
       when every job field matches the former request. */
    const url = 'data:image/png;base64,cG5n';
    first.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'result',
      documentToken: 'loader-document', producerEpoch: 1, workerInstanceId: 1,
      jobId: staleRequest.jobId, kind: staleRequest.kind, key: staleRequest.key,
      width: 132, height: 132, url,
      encodedBytes: new TextEncoder().encode(url).byteLength,
      pngBytes: 3, decodedPixels: 132 * 132,
      importDurationMs: 0, renderDurationMs: 0, encodeDurationMs: 0,
    });
    expect(received).toEqual([]);

    loader.resumeFromBfcache();
    tasks.shift()!();
    const second = workers[1]!;
    expect(second.sent[0]).toMatchObject({
      type: 'init', documentToken: 'loader-document', producerEpoch: 2, workerInstanceId: 2,
    });
    second.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'ready',
      documentToken: 'loader-document', producerEpoch: 2, workerInstanceId: 2,
    });
    const resumed = second.sent[1] as SpeciesArtWorkerRenderRequest;
    expect(resumed).toMatchObject({ kind: 'thumb132', key: staleRequest.key });
    expect(resumed.jobId).not.toBe(staleRequest.jobId);
    const emitPhase = (phase: SpeciesArtWorkerPhase): void => second.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'phase',
      documentToken: 'loader-document', producerEpoch: 2, workerInstanceId: 2,
      jobId: resumed.jobId, kind: resumed.kind, key: resumed.key,
      phase, performanceNow: 1,
    });
    for (const phase of [
      'import-start', 'import-complete', 'job-start',
      'render-complete', 'encode-start', 'encode-complete',
    ] as const) emitPhase(phase);
    second.emit({
      schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, type: 'result',
      documentToken: 'loader-document', producerEpoch: 2, workerInstanceId: 2,
      jobId: resumed.jobId, kind: resumed.kind, key: resumed.key,
      width: 132, height: 132, url,
      encodedBytes: new TextEncoder().encode(url).byteLength,
      pngBytes: 3, decodedPixels: 132 * 132,
      importDurationMs: 1, renderDurationMs: 1, encodeDurationMs: 1,
    });
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ key: KEY, width: 132, height: 132 });
    expect(loader.artDiagnostics()?.totals).toMatchObject({ jobStarts: 2, jobCompletes: 1 });
    lease.release();
    loader.dispose('test complete');
    expect(second.terminated).toBe(1);
  });
});
