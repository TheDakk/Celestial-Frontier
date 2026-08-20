/* species-art-loader.ts — Window-side ownership for the dedicated species-art
   producer. The broker is cheap and safe at boot; the Worker and its heavy
   painter chunk are constructed only after a real owner exists AND the app
   explicitly activates background work after its first serviced turn. */
import {
  SpeciesArtBroker,
  type Portrait440,
  type PortraitListener,
  type PortraitRequest,
  type SpeciesArtBrokerDiagnosticsV1,
  type SpeciesArtDeviceClass,
  type SpeciesArtProducerFactory,
  type SpeciesArtProducerPort,
  type SpeciesArtProducerRequest,
  type SpeciesArtProducerResult,
  type SpeciesArtProducerSink,
  type SpeciesArtTaskScheduler,
  type Thumb132,
  type ThumbLease,
} from '@cf/art/species-broker';
import type { SpeciesVisualKey } from '@cf/art/species-identity';
import {
  SPECIES_ART_WORKER_REQUEST_SCHEMA,
  speciesArtWorkerIdentityMatches,
  validSpeciesArtWorkerResponse,
  type SpeciesArtWorkerPhase,
  type SpeciesArtWorkerResponse,
} from './species-art-protocol.js';

export type {
  Portrait440, PortraitListener, PortraitRequest, SpeciesArtDeviceClass,
  SpeciesVisualKey, Thumb132, ThumbLease,
};

export type SpeciesArtLazyState = 'idle' | 'loading' | 'ready' | 'error';
export interface SpeciesArtLazyDiagnostics {
  readonly schema: 'cf-v2-species-art-worker-diagnostics/v1';
  readonly state: SpeciesArtLazyState;
  /** Historical name retained for the Arc 1A lazy-import contract. Each
   * producer instance owns one fresh worker-local painter import. */
  readonly importStarts: number;
  readonly identity: Readonly<{
    documentToken: string;
    lastProducerEpoch: number;
    lastWorkerInstanceId: number;
  }>;
  readonly lastEvent: Readonly<{
    producerEpoch: number;
    workerInstanceId: number;
    jobId: number;
    kind: 'thumb132' | 'portrait440';
    event: string;
  }> | null;
  readonly worker: Readonly<{
    live: boolean;
    starts: number;
    ready: number;
    disposals: number;
    fatals: number;
    protocolErrors: number;
  }>;
  readonly phases: Readonly<{
    importStarts: number;
    importCompletes: number;
    thumbJobStarts: number;
    thumbRenderCompletes: number;
    thumbEncodeStarts: number;
    thumbEncodeCompletes: number;
    portraitJobStarts: number;
    portraitRenderCompletes: number;
    portraitEncodeStarts: number;
    portraitEncodeCompletes: number;
  }>;
  readonly results: Readonly<{
    count: number;
    maxImportDurationMs: number;
    maxRenderDurationMs: number;
    maxEncodeDurationMs: number;
  }>;
  readonly errors: Readonly<{
    capability: number;
    protocol: number;
    import: number;
    paint: number;
    encode: number;
  }>;
}

export interface SpeciesArtDiagnosticsV1 {
  readonly schema: 'cf-v2-species-art-diagnostics/v1';
  readonly deviceClass: SpeciesArtDeviceClass;
  readonly limits: Readonly<{
    budgetStatus: 'active-measured';
    cacheEntries: number;
    decodedPixels: number;
    decodedBytes: number;
    encodedBytes: number;
    encodedByteBasis: 'utf8-data-url';
    queuedJobs: number;
    activeJobs: number;
    leases: number;
    portraitEntries: number;
    portraitEncodedBytes: number;
  }>;
  readonly live: Readonly<{
    cacheEntries: number;
    decodedPixels: number;
    decodedBytes: number;
    encodedBytes: number;
    queuedJobs: number;
    activeJobs: number;
    leases: number;
    subscribers: number;
    portraitCacheEntries: number;
    portraitEncodedBytes: number;
  }>;
  readonly totals: Readonly<{
    leaseAcquires: number;
    releases: number;
    jobStarts: number;
    jobCompletes: number;
    jobCancels: number;
    jobErrors: number;
    dedupeHits: number;
    disposals: number;
    thumbCanvasRenders: number;
    fullPortraitRendersForThumb: 0;
    fullPortraitDecodesForThumb: 0;
    maxQueuedJobs: number;
    maxActiveJobs: number;
  }>;
  readonly keys: Readonly<{
    leased: readonly string[];
    queued: readonly string[];
    active: readonly string[];
    cached: readonly string[];
  }>;
}

export interface SpeciesArtWorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<unknown>) => void): void;
  addEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void;
}

export type SpeciesArtWorkerFactory = () => SpeciesArtWorkerLike;

export interface SpeciesArtLoaderOptions {
  readonly createProducer?: SpeciesArtProducerFactory;
  readonly workerFactory?: SpeciesArtWorkerFactory;
  readonly getDeviceClass?: () => SpeciesArtDeviceClass;
  readonly subscribeDeviceClassChange?: (listener: () => void) => () => void;
  readonly scheduleTask?: SpeciesArtTaskScheduler;
}

interface WorkerIdentity {
  readonly documentToken: string;
  readonly producerEpoch: number;
  readonly workerInstanceId: number;
}

const defaultDeviceClass = (): SpeciesArtDeviceClass => {
  try { return matchMedia('(max-width: 700px)').matches ? 'phone' : 'desktop'; }
  catch { return 'desktop'; }
};

const defaultSubscribeDeviceClassChange = (listener: () => void): (() => void) => {
  try {
    const query = matchMedia('(max-width: 700px)');
    query.addEventListener('change', listener);
    return () => { query.removeEventListener('change', listener); };
  } catch { return () => {}; }
};

/* A completed worker job can publish several phase/result messages at once.
   Starting the next job from a zero-delay timer lets that message/timer chain
   repeatedly win over renderer input and inspector work on a constrained
   browser. Cross one rendering opportunity and then one later task before every pump;
   subsequent pumps wait for the document's next rendering opportunity. */
const defaultScheduleTask: SpeciesArtTaskScheduler = (task) => {
  requestAnimationFrame(() => { setTimeout(task, 0); });
};

const defaultWorkerFactory: SpeciesArtWorkerFactory = () => new Worker(
  new URL('./species-art.worker.ts', import.meta.url),
  { type: 'module', name: 'cf-species-art' },
);

const workerError = (value: unknown): Error => value instanceof Error
  ? value : new Error(typeof value === 'string' ? value : 'species art worker failed');

function legacyDiagnostics(
  raw: SpeciesArtBrokerDiagnosticsV1,
  renderCounts: Readonly<{ thumbCanvases: number }>,
): SpeciesArtDiagnosticsV1 {
  return Object.freeze({
    schema: 'cf-v2-species-art-diagnostics/v1' as const,
    deviceClass: raw.state.deviceClass,
    limits: Object.freeze({
      budgetStatus: 'active-measured' as const,
      cacheEntries: raw.limits.thumbCacheEntries,
      decodedPixels: raw.limits.thumbDecodedPixels,
      decodedBytes: raw.limits.thumbDecodedBytes,
      encodedBytes: raw.limits.thumbEncodedBytes,
      encodedByteBasis: 'utf8-data-url' as const,
      queuedJobs: raw.limits.queuedJobs,
      activeJobs: raw.limits.activeJobs,
      leases: raw.limits.thumbLeases,
      portraitEntries: raw.limits.portraitCacheEntries,
      portraitEncodedBytes: raw.limits.portraitEncodedBytes,
    }),
    live: Object.freeze({
      cacheEntries: raw.live.thumbCacheEntries,
      decodedPixels: raw.live.thumbDecodedPixels,
      decodedBytes: raw.live.thumbDecodedBytes,
      encodedBytes: raw.live.thumbEncodedBytes,
      queuedJobs: raw.live.queuedThumbJobs,
      activeJobs: raw.keys.active.some((key) => key.startsWith('thumb132:')) ? 1 : 0,
      leases: raw.live.thumbLeases,
      subscribers: raw.live.thumbSubscribers,
      portraitCacheEntries: raw.live.portraitCacheEntries,
      portraitEncodedBytes: raw.live.portraitEncodedBytes,
    }),
    totals: Object.freeze({
      leaseAcquires: raw.totals.leaseAcquires,
      releases: raw.totals.leaseReleases,
      /* The active Arc 1A compatibility schema predates asynchronous detail
         portraits. Preserve its thumbnail-job meaning; portrait producer work
         remains visible in the broker diagnostics and portrait cache fields. */
      jobStarts: raw.totals.thumbJobStarts,
      jobCompletes: raw.totals.thumbJobCompletes,
      jobCancels: raw.totals.thumbJobCancels,
      jobErrors: raw.totals.thumbJobErrors,
      dedupeHits: raw.totals.thumbDedupeHits + raw.totals.thumbCacheHits,
      disposals: raw.totals.cacheDisposals,
      thumbCanvasRenders: renderCounts.thumbCanvases,
      /* This compatibility field has always counted the forbidden legacy
         speciesThumb() route that publishes/caches a 440px URL for a thumb.
         Worker-local 440->132 scratch rendering is recorded in lazyArt.phases
         and must not be laundered into this legacy counter. */
      fullPortraitRendersForThumb: 0 as const,
      fullPortraitDecodesForThumb: 0 as const,
      maxQueuedJobs: raw.totals.maxQueuedThumbJobs,
      maxActiveJobs: raw.totals.maxActiveThumbJobs,
    }),
    keys: Object.freeze({
      leased: raw.keys.leasedThumbs,
      queued: raw.keys.queuedThumbs,
      active: Object.freeze(raw.keys.active
        .filter((key) => key.startsWith('thumb132:'))
        .map((key) => key.slice('thumb132:'.length))),
      cached: raw.keys.cachedThumbs,
    }),
  });
}

function createWorkerProducer(
  workerFactory: SpeciesArtWorkerFactory,
  identity: WorkerIdentity,
  sink: SpeciesArtProducerSink,
  onWorkerReady: () => void,
  onPhase: (response: Extract<SpeciesArtWorkerResponse, { readonly type: 'phase' }>) => void,
  onResult: (response: Extract<SpeciesArtWorkerResponse, { readonly type: 'result' }>) => void,
  onJobError: (response: Extract<SpeciesArtWorkerResponse, { readonly type: 'error' }>) => void,
  onProtocolError: () => void,
  onFatal: (error: Error) => void,
): SpeciesArtProducerPort {
  const worker = workerFactory();
  let disposed = false;
  let ready = false;
  let pending: SpeciesArtProducerRequest | null = null;
  let painterImported = false;
  let phasePlan: readonly SpeciesArtWorkerPhase[] = Object.freeze([]);
  let phaseIndex = 0;

  const terminateFatal = (value: unknown): void => {
    if (disposed) return;
    const error = workerError(value);
    disposed = true;
    try { worker.terminate(); } catch { /* ownership is already revoked */ }
    onFatal(error);
    sink.fatal(error);
  };
  const exactPending = (response: {
    readonly jobId: number; readonly kind: string; readonly key: string;
  }): boolean => pending !== null
    && response.jobId === pending.jobId
    && response.kind === pending.kind
    && response.key === pending.key;
  const postRender = (): void => {
    if (!ready || !pending || disposed) return;
    worker.postMessage(Object.freeze({
      schema: SPECIES_ART_WORKER_REQUEST_SCHEMA,
      type: 'render' as const,
      ...identity,
      jobId: pending.jobId,
      kind: pending.kind,
      key: String(pending.key),
      genome: pending.genome,
      ...(pending.testFailureMessage === undefined
        ? {} : { testFailureMessage: pending.testFailureMessage }),
    }));
  };

  worker.addEventListener('message', (event) => {
    if (disposed || !validSpeciesArtWorkerResponse(event.data)
      || !speciesArtWorkerIdentityMatches(event.data, identity)) {
      onProtocolError();
      terminateFatal(new Error('species art worker returned invalid or stale protocol evidence'));
      return;
    }
    const response: SpeciesArtWorkerResponse = event.data;
    if (response.type === 'ready') {
      if (ready) {
        onProtocolError();
        terminateFatal(new Error('species art worker published duplicate readiness'));
        return;
      }
      ready = true;
      onWorkerReady();
      try { postRender(); } catch (error) { terminateFatal(error); }
      return;
    }
    if (response.type === 'phase') {
      const expected = phasePlan[phaseIndex];
      if (!ready || !exactPending(response) || response.phase !== expected) {
        onProtocolError();
        terminateFatal(new Error(
          `species art worker phase did not match the active job (${String(expected)} -> ${response.phase})`,
        ));
        return;
      }
      phaseIndex++;
      if (response.phase === 'import-complete') painterImported = true;
      onPhase(response);
      return;
    }
    if (response.type === 'error') {
      const error = new Error(`${response.stage}/${response.code}: ${response.message}`);
      if (response.jobId === null || response.kind === null || response.key === null) {
        onJobError(response);
        terminateFatal(error);
        return;
      }
      const request = pending;
      if (!ready || request === null
        || response.jobId !== request.jobId
        || response.kind !== request.kind
        || response.key !== request.key) {
        onProtocolError();
        terminateFatal(new Error('species art worker error did not match the active job'));
        return;
      }
      const requiredPreviousPhase = response.stage === 'import' ? 'import-start'
        : response.stage === 'paint' ? 'job-start'
          : response.stage === 'encode' ? 'encode-start' : null;
      if ((requiredPreviousPhase !== null
        && phasePlan[phaseIndex - 1] !== requiredPreviousPhase)
        || (requiredPreviousPhase === null
          && response.stage !== 'capability' && response.stage !== 'protocol')) {
        onProtocolError();
        terminateFatal(new Error(
          `species art worker ${response.stage} error arrived outside its exact phase boundary`,
        ));
        return;
      }
      onJobError(response);
      if (response.stage === 'capability'
        || response.stage === 'protocol' || response.stage === 'import') {
        terminateFatal(error);
        return;
      }
      pending = null;
      phasePlan = Object.freeze([]);
      phaseIndex = 0;
      sink.result(Object.freeze({
        status: 'error', jobId: request.jobId, kind: request.kind, key: request.key, error,
      }));
      return;
    }
    const request = pending;
    if (!ready || request === null || !exactPending(response)
      || phaseIndex !== phasePlan.length
      || new TextEncoder().encode(response.url).byteLength !== response.encodedBytes) {
      onProtocolError();
      terminateFatal(new Error('species art worker result did not match the active job or encoded bytes'));
      return;
    }
    pending = null;
    phasePlan = Object.freeze([]);
    phaseIndex = 0;
    const result: SpeciesArtProducerResult = Object.freeze({
      status: 'success', jobId: request.jobId, kind: request.kind, key: request.key,
      asset: Object.freeze({
        key: request.key,
        url: response.url,
        width: response.width,
        height: response.height,
        encodedBytes: response.encodedBytes,
        decodedPixels: response.decodedPixels,
      }) as Thumb132 | Portrait440,
    });
    onResult(response);
    sink.result(result);
  });
  worker.addEventListener('error', (event) => terminateFatal(event));
  worker.addEventListener('messageerror', (event) => terminateFatal(event));
  worker.postMessage(Object.freeze({
    schema: SPECIES_ART_WORKER_REQUEST_SCHEMA,
    type: 'init' as const,
    ...identity,
  }));

  return Object.freeze({
    render: (request: SpeciesArtProducerRequest): void => {
      if (disposed) throw new Error('species art worker producer is disposed');
      if (pending !== null) throw new Error('species art worker producer already owns an active job');
      pending = request;
      phasePlan = Object.freeze(painterImported
        ? ['job-start', 'render-complete', 'encode-start', 'encode-complete']
        : ['import-start', 'import-complete', 'job-start', 'render-complete', 'encode-start', 'encode-complete']);
      phaseIndex = 0;
      try { postRender(); } catch (error) { terminateFatal(error); }
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      pending = null;
      worker.terminate();
    },
  });
}

/** One broker/worker owner per document. Requests may queue before activate,
 * but no Worker is created until both an owner and explicit activation exist. */
export class SpeciesArtLoader {
  private readonly broker: SpeciesArtBroker;
  private readonly workerFactory: SpeciesArtWorkerFactory;
  private readonly releaseDeviceClassChange: () => void;
  private disposed = false;
  private state0: SpeciesArtLazyState = 'idle';
  private importStarts0 = 0;
  private requested = false;
  private producerEpoch = 0;
  private workerInstanceId = 0;
  private thumbCanvasRenders0 = 0;
  private workerReady0 = 0;
  private adapterProtocolErrors0 = 0;
  private lastProducerEpoch0 = 0;
  private lastWorkerInstanceId0 = 0;
  private lastEvent0: SpeciesArtLazyDiagnostics['lastEvent'] = null;
  private readonly phases0 = {
    importStarts: 0,
    importCompletes: 0,
    thumbJobStarts: 0,
    thumbRenderCompletes: 0,
    thumbEncodeStarts: 0,
    thumbEncodeCompletes: 0,
    portraitJobStarts: 0,
    portraitRenderCompletes: 0,
    portraitEncodeStarts: 0,
    portraitEncodeCompletes: 0,
  };
  private readonly results0 = {
    count: 0,
    maxImportDurationMs: 0,
    maxRenderDurationMs: 0,
    maxEncodeDurationMs: 0,
  };
  private readonly errors0 = {
    capability: 0,
    protocol: 0,
    import: 0,
    paint: 0,
    encode: 0,
  };

  constructor(
    private readonly documentToken: string,
    options: SpeciesArtLoaderOptions = {},
  ) {
    if (!documentToken) throw new TypeError('species art document token must be non-empty');
    this.workerFactory = options.workerFactory ?? defaultWorkerFactory;
    const createProducer: SpeciesArtProducerFactory = options.createProducer
      ? (sink) => {
        this.state0 = 'loading';
        this.importStarts0++;
        try {
          const port = options.createProducer!(sink);
          this.state0 = 'ready';
          return port;
        } catch (error) {
          this.state0 = 'error';
          throw error;
        }
      }
      : (sink) => {
        const identity = Object.freeze({
          documentToken: this.documentToken,
          producerEpoch: ++this.producerEpoch,
          workerInstanceId: ++this.workerInstanceId,
        });
        this.lastProducerEpoch0 = identity.producerEpoch;
        this.lastWorkerInstanceId0 = identity.workerInstanceId;
        this.state0 = 'loading';
        this.importStarts0++;
        try {
          return createWorkerProducer(
            this.workerFactory, identity, sink,
            () => { this.workerReady0++; },
            (response) => {
              const { phase, kind } = response;
              this.lastEvent0 = Object.freeze({
                producerEpoch: identity.producerEpoch,
                workerInstanceId: identity.workerInstanceId,
                jobId: response.jobId,
                kind,
                event: `phase:${phase}`,
              });
              if (phase === 'import-start') this.state0 = 'loading';
              else if (phase === 'import-complete') this.state0 = 'ready';
              const prefix = kind === 'thumb132' ? 'thumb' : 'portrait';
              if (phase === 'import-start') this.phases0.importStarts++;
              else if (phase === 'import-complete') this.phases0.importCompletes++;
              else if (phase === 'job-start') this.phases0[`${prefix}JobStarts`]++;
              else if (phase === 'render-complete') this.phases0[`${prefix}RenderCompletes`]++;
              else if (phase === 'encode-start') this.phases0[`${prefix}EncodeStarts`]++;
              else if (phase === 'encode-complete') this.phases0[`${prefix}EncodeCompletes`]++;
              if (kind === 'thumb132' && phase === 'encode-complete') this.thumbCanvasRenders0++;
            },
            (response) => {
              this.lastEvent0 = Object.freeze({
                producerEpoch: identity.producerEpoch,
                workerInstanceId: identity.workerInstanceId,
                jobId: response.jobId,
                kind: response.kind,
                event: 'result',
              });
              this.results0.count++;
              this.results0.maxImportDurationMs = Math.max(
                this.results0.maxImportDurationMs, response.importDurationMs,
              );
              this.results0.maxRenderDurationMs = Math.max(
                this.results0.maxRenderDurationMs, response.renderDurationMs,
              );
              this.results0.maxEncodeDurationMs = Math.max(
                this.results0.maxEncodeDurationMs, response.encodeDurationMs,
              );
            },
            (response) => {
              const { stage } = response;
              if (response.jobId !== null && response.kind !== null) {
                this.lastEvent0 = Object.freeze({
                  producerEpoch: identity.producerEpoch,
                  workerInstanceId: identity.workerInstanceId,
                  jobId: response.jobId,
                  kind: response.kind,
                  event: `error:${stage}`,
                });
              }
              this.errors0[stage]++;
              if (stage === 'import') this.state0 = 'error';
            },
            () => { this.adapterProtocolErrors0++; },
            () => { this.state0 = 'error'; },
          );
        } catch (error) {
          this.state0 = 'error';
          throw error;
        }
      };
    this.broker = new SpeciesArtBroker({
      createProducer,
      getDeviceClass: options.getDeviceClass ?? defaultDeviceClass,
      scheduleTask: options.scheduleTask ?? defaultScheduleTask,
    });
    const subscribeDeviceClassChange = options.subscribeDeviceClassChange
      ?? (options.getDeviceClass ? null : defaultSubscribeDeviceClassChange);
    try {
      this.releaseDeviceClassChange = subscribeDeviceClassChange
        ? subscribeDeviceClassChange(() => { this.broker.refreshDeviceClass(); })
        : () => {};
    } catch {
      this.releaseDeviceClassChange = () => {};
    }
  }

  diagnostics(): SpeciesArtLazyDiagnostics {
    const broker = this.broker.diagnostics();
    return Object.freeze({
      schema: 'cf-v2-species-art-worker-diagnostics/v1' as const,
      state: this.state0,
      importStarts: this.importStarts0,
      identity: Object.freeze({
        documentToken: this.documentToken,
        lastProducerEpoch: this.lastProducerEpoch0,
        lastWorkerInstanceId: this.lastWorkerInstanceId0,
      }),
      lastEvent: this.lastEvent0,
      worker: Object.freeze({
        live: broker.state.producer === 'live',
        starts: broker.totals.producerStarts,
        ready: this.workerReady0,
        disposals: broker.totals.producerDisposals,
        fatals: broker.totals.producerFatals,
        protocolErrors: broker.totals.protocolErrors + this.adapterProtocolErrors0,
      }),
      phases: Object.freeze({ ...this.phases0 }),
      results: Object.freeze({ ...this.results0 }),
      errors: Object.freeze({ ...this.errors0 }),
    });
  }

  artDiagnostics(): SpeciesArtDiagnosticsV1 | null {
    return this.requested ? legacyDiagnostics(this.broker.diagnostics(), {
      thumbCanvases: this.thumbCanvasRenders0,
    }) : null;
  }

  activate(): void { this.broker.activate(); }

  leaseThumb(genome: Record<string, unknown>): ThumbLease {
    this.requested = true;
    return this.broker.leaseThumb(genome);
  }

  requestPortrait(
    owner: string,
    genome: Record<string, unknown>,
    listener: PortraitListener,
  ): PortraitRequest {
    this.requested = true;
    return this.broker.requestPortrait(owner, genome, listener);
  }

  trimArtNow(deviceClass: SpeciesArtDeviceClass): SpeciesArtDiagnosticsV1 {
    if (!this.requested) throw new Error('species art has no owner to trim');
    this.broker.setDeviceClassForTest(deviceClass);
    return legacyDiagnostics(this.broker.diagnostics(), {
      thumbCanvases: this.thumbCanvasRenders0,
    });
  }

  failNextThumb(message?: string): void {
    if (!this.requested) throw new Error('species art has no owner for a failure control');
    this.broker.failNextJobForTest(message);
  }

  suspendForBfcache(): void { this.broker.suspendForBfcache(); }
  resumeFromBfcache(): void { this.broker.resumeFromBfcache(); }
  dispose(reason?: string): void {
    if (this.disposed) return;
    this.disposed = true;
    this.releaseDeviceClassChange();
    this.broker.dispose(reason);
  }
}

export interface SpeciesThumbBindingOptions {
  readonly owner: string;
  readonly image: HTMLImageElement;
  readonly genome: Record<string, unknown>;
  readonly isCurrent: () => boolean;
  readonly onCommit?: (asset: Thumb132) => void;
  readonly onStale?: () => void;
  readonly onError?: (error: unknown) => void;
}

export interface SpeciesThumbBinding {
  readonly visualKey: () => string | null;
  release(): void;
}

/** Small surface owner used by Planetside: replacing or hiding the strip has
 * one auditable release operation instead of a parallel array discipline. */
export class SpeciesThumbLeaseGroup {
  private readonly bindings = new Set<SpeciesThumbBinding>();

  constructor(private readonly maximum = Number.MAX_SAFE_INTEGER) {
    if (!Number.isInteger(maximum) || maximum < 1) throw new Error('thumbnail lease-group maximum must be positive');
  }

  get size(): number { return this.bindings.size; }

  add(binding: SpeciesThumbBinding): SpeciesThumbBinding {
    if (this.bindings.size >= this.maximum) {
      binding.release();
      throw new Error(`thumbnail lease-group exceeded its ${this.maximum}-item bound`);
    }
    this.bindings.add(binding);
    return binding;
  }

  clear(): void {
    for (const binding of this.bindings) binding.release();
    this.bindings.clear();
  }
}

/** Bind one neutral image tile to one lease. Every asynchronous publication
 * must still belong to the same generation, connected element, lease key,
 * and row visual key before it may mutate the DOM. */
export function bindSpeciesThumb(
  loader: SpeciesArtLoader,
  options: SpeciesThumbBindingOptions,
): SpeciesThumbBinding {
  const image = options.image;
  const owner = options.owner;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.removeAttribute('src');
  image.dataset.thumbOwner = owner;
  image.dataset.thumbState = 'placeholder';
  let disposed = false;
  let expectedKey: string | null = null;
  let lease: ThumbLease | null = null;
  let unsubscribe: (() => void) | null = null;

  const stale = (): void => { options.onStale?.(); };
  const validTarget = (): boolean => !disposed
    && options.isCurrent()
    && image.isConnected
    && image.dataset.thumbOwner === owner
    && expectedKey !== null
    && image.dataset.visualKey === expectedKey;
  const publish = (asset: Thumb132 | null, error?: unknown): void => {
    if (error !== undefined) {
      if (!validTarget()) { stale(); return; }
      image.dataset.thumbState = 'error';
      options.onError?.(error);
      return;
    }
    if (!asset || !validTarget()
      || String(asset.key) !== expectedKey
      || asset.width !== 132 || asset.height !== 132) {
      stale();
      return;
    }
    image.src = asset.url;
    image.dataset.thumbState = 'ready';
    options.onCommit?.(asset);
  };
  const acquire = (): void => {
    if (disposed || !options.isCurrent() || !image.isConnected) { stale(); return; }
    try {
      const acquired = loader.leaseThumb(options.genome);
      lease = acquired;
      expectedKey = String(acquired.key);
      image.dataset.visualKey = expectedKey;
      if (acquired.current) publish(acquired.current);
      else unsubscribe = acquired.subscribe(publish);
    } catch (leaseError) {
      image.dataset.thumbState = 'error';
      options.onError?.(leaseError);
    }
  };
  acquire();

  return Object.freeze({
    visualKey: () => expectedKey,
    release: (): void => {
      if (disposed) return;
      disposed = true;
      unsubscribe?.();
      unsubscribe = null;
      lease?.release();
      lease = null;
      /* Hidden Planetside keeps its structural chips for a later reveal. The
         lease release must also relinquish that retained DOM image's decoded
         data URL. Guard ownership so a late obsolete cleanup cannot blank a
         newer binding that reused the same image element. */
      if (image.dataset.thumbOwner === owner) {
        image.removeAttribute('src');
        delete image.dataset.visualKey;
        delete image.dataset.thumbOwner;
        image.dataset.thumbState = 'released';
      }
    },
  });
}
