/* Producer-agnostic species-art ownership. Heavy drawing/encoding belongs to
   a supplied producer; this broker owns bounded queues, dedupe, leases, cache,
   cancellation, lifecycle and protocol validation on the calling realm. */
import {
  snapshotSpeciesGenome,
  speciesVisualKey,
  type SpeciesVisualKey,
} from './speciesidentity.js';

export type SpeciesArtDeviceClass = 'phone' | 'desktop';
export type SpeciesArtRenderKind = 'thumb132' | 'portrait440';

export interface Thumb132 {
  readonly key: SpeciesVisualKey;
  readonly url: string;
  readonly width: 132;
  readonly height: 132;
  readonly encodedBytes: number;
  readonly decodedPixels: number;
}

export interface Portrait440 {
  readonly key: SpeciesVisualKey;
  readonly url: string;
  readonly width: 440;
  readonly height: 440;
  readonly encodedBytes: number;
  readonly decodedPixels: number;
}

export type SpeciesArtAsset = Thumb132 | Portrait440;

export interface SpeciesArtProducerRequest {
  readonly jobId: number;
  readonly kind: SpeciesArtRenderKind;
  readonly key: SpeciesVisualKey;
  readonly genome: Readonly<Record<string, unknown>>;
  /** Evidence-only one-shot routed through the real producer protocol. */
  readonly testFailureMessage?: string;
}

export type SpeciesArtProducerResult =
  | Readonly<{
    status: 'success';
    jobId: number;
    kind: SpeciesArtRenderKind;
    key: SpeciesVisualKey;
    asset: SpeciesArtAsset;
  }>
  | Readonly<{
    status: 'error';
    jobId: number;
    kind: SpeciesArtRenderKind;
    key: SpeciesVisualKey;
    error: unknown;
  }>;

export interface SpeciesArtProducerSink {
  result(result: SpeciesArtProducerResult): void;
  fatal(error: unknown): void;
}

export interface SpeciesArtProducerPort {
  render(request: SpeciesArtProducerRequest): void;
  dispose(reason: string): void;
}

export type SpeciesArtProducerFactory = (sink: SpeciesArtProducerSink) => SpeciesArtProducerPort;
export type SpeciesArtTaskScheduler = (task: () => void) => void;

export type ThumbListener = (asset: Thumb132 | null, error?: unknown) => void;
export interface ThumbLease {
  readonly key: SpeciesVisualKey;
  readonly current: Thumb132 | null;
  subscribe(listener: ThumbListener): () => void;
  release(): void;
}

export type PortraitListener = (asset: Portrait440 | null, error?: unknown) => void;
export interface PortraitRequest {
  readonly key: SpeciesVisualKey;
  readonly current: Portrait440 | null;
  cancel(): void;
}

interface DeviceLimits {
  readonly thumbCacheEntries: number;
  readonly thumbDecodedPixels: number;
  readonly thumbDecodedBytes: number;
  readonly thumbEncodedBytes: number;
  readonly portraitCacheEntries: number;
  readonly portraitEncodedBytes: number;
  readonly queuedJobs: number;
  readonly activeJobs: 1;
  readonly thumbLeases: number;
}

export interface SpeciesArtBrokerDiagnosticsV1 {
  readonly schema: 'cf-v2-species-art-broker-diagnostics/v1';
  readonly state: Readonly<{
    activated: boolean;
    suspended: boolean;
    disposed: boolean;
    producer: 'idle' | 'live';
    deviceClass: SpeciesArtDeviceClass;
  }>;
  readonly limits: Readonly<DeviceLimits & { readonly budgetStatus: 'active-measured' }>;
  readonly live: Readonly<{
    thumbCacheEntries: number;
    thumbDecodedPixels: number;
    thumbDecodedBytes: number;
    thumbEncodedBytes: number;
    portraitCacheEntries: number;
    portraitEncodedBytes: number;
    queuedJobs: number;
    queuedThumbJobs: number;
    queuedPortraitJobs: number;
    activeJobs: number;
    thumbLeases: number;
    thumbSubscribers: number;
    portraitRequests: number;
  }>;
  readonly totals: Readonly<{
    activations: number;
    producerStarts: number;
    producerDisposals: number;
    producerFatals: number;
    leaseAcquires: number;
    leaseReleases: number;
    portraitRequests: number;
    portraitCancels: number;
    jobStarts: number;
    jobCompletes: number;
    jobErrors: number;
    jobCancels: number;
    thumbJobStarts: number;
    thumbJobCompletes: number;
    thumbJobErrors: number;
    thumbJobCancels: number;
    portraitJobStarts: number;
    portraitJobCompletes: number;
    portraitJobErrors: number;
    portraitJobCancels: number;
    jobRequeues: number;
    dedupeHits: number;
    thumbDedupeHits: number;
    portraitDedupeHits: number;
    cacheHits: number;
    thumbCacheHits: number;
    portraitCacheHits: number;
    cacheDisposals: number;
    droppedResults: number;
    protocolErrors: number;
    maxQueuedJobs: number;
    maxActiveJobs: number;
    maxQueuedThumbJobs: number;
    maxActiveThumbJobs: number;
  }>;
  readonly keys: Readonly<{
    leasedThumbs: readonly string[];
    queuedThumbs: readonly string[];
    queuedPortraits: readonly string[];
    active: readonly string[];
    cachedThumbs: readonly string[];
    cachedPortraits: readonly string[];
  }>;
}

export interface SpeciesArtUnownedCacheReleaseV1 {
  readonly schema: 'cf-v2-species-art-unowned-cache-release/v1';
  readonly releasedThumbEntries: number;
  readonly releasedPortraitEntries: number;
  readonly releasedEntries: number;
}

export interface SpeciesArtUnownedCacheReleaseOptions {
  /** Preserve this many most-recent unleased thumbnails as a bounded warm
   * route cache. Owned thumbnails are always preserved independently. */
  readonly retainRecentThumbEntries?: number;
}

export interface SpeciesArtBrokerOptions {
  readonly createProducer: SpeciesArtProducerFactory;
  /** Releases any external URL/resource owned by a settled cached asset. */
  readonly disposeAsset?: ((asset: SpeciesArtAsset) => void) | undefined;
  readonly getDeviceClass?: (() => SpeciesArtDeviceClass) | undefined;
  readonly scheduleTask?: SpeciesArtTaskScheduler | undefined;
}

interface ThumbLeaseState {
  readonly key: SpeciesVisualKey;
  released: boolean;
  settled: boolean;
  asset: Thumb132 | null;
  error: Error | null;
  job: BrokerJob | null;
  readonly listeners: Set<ThumbListener>;
}

interface PortraitRequestState {
  readonly owner: string;
  readonly key: SpeciesVisualKey;
  cancelled: boolean;
  settled: boolean;
  asset: Portrait440 | null;
  job: BrokerJob | null;
  readonly listener: PortraitListener;
}

interface BrokerJob {
  readonly mapKey: string;
  readonly kind: SpeciesArtRenderKind;
  readonly key: SpeciesVisualKey;
  readonly genome: Readonly<Record<string, unknown>>;
  state: 'queued' | 'running' | 'settled' | 'cancelled';
  jobId: number | null;
  readonly thumbLeases: Set<ThumbLeaseState>;
  readonly portraitRequests: Set<PortraitRequestState>;
}

const THUMB_SIZE = 132 as const;
const PORTRAIT_SIZE = 440 as const;
const THUMB_PIXELS = THUMB_SIZE * THUMB_SIZE;
const PORTRAIT_PIXELS = PORTRAIT_SIZE * PORTRAIT_SIZE;
const THUMB_DECODED_BYTES = THUMB_PIXELS * 4;

const DEVICE_LIMITS: Readonly<Record<SpeciesArtDeviceClass, DeviceLimits>> = Object.freeze({
  phone: Object.freeze({
    thumbCacheEntries: 96,
    thumbDecodedPixels: 96 * THUMB_PIXELS,
    thumbDecodedBytes: 96 * THUMB_DECODED_BYTES,
    thumbEncodedBytes: 96 * THUMB_DECODED_BYTES,
    portraitCacheEntries: 96,
    portraitEncodedBytes: 64 * 1024 * 1024,
    queuedJobs: 96,
    activeJobs: 1,
    thumbLeases: 96,
  }),
  desktop: Object.freeze({
    thumbCacheEntries: 256,
    thumbDecodedPixels: 256 * THUMB_PIXELS,
    thumbDecodedBytes: 256 * THUMB_DECODED_BYTES,
    thumbEncodedBytes: 256 * THUMB_DECODED_BYTES,
    portraitCacheEntries: 256,
    portraitEncodedBytes: 192 * 1024 * 1024,
    queuedJobs: 256,
    activeJobs: 1,
    thumbLeases: 256,
  }),
});

const defaultScheduleTask: SpeciesArtTaskScheduler = (task) => { setTimeout(task, 0); };
const mapKeyFor = (kind: SpeciesArtRenderKind, key: SpeciesVisualKey): string => `${kind}\u0000${key}`;
const asError = (value: unknown): Error => value instanceof Error ? value : new Error(String(value));

export class SpeciesArtBroker {
  private readonly jobs = new Map<string, BrokerJob>();
  private readonly thumbQueue: BrokerJob[] = [];
  private readonly portraitQueue: BrokerJob[] = [];
  private readonly thumbCache = new Map<SpeciesVisualKey, Thumb132>();
  private readonly portraitCache = new Map<SpeciesVisualKey, Portrait440>();
  private readonly thumbLeases = new Set<ThumbLeaseState>();
  private readonly portraitOwners = new Map<string, PortraitRequestState>();
  private readonly scheduleTask: SpeciesArtTaskScheduler;
  private producer: SpeciesArtProducerPort | null = null;
  private producerGeneration = 0;
  private activeJob: BrokerJob | null = null;
  private nextJobId = 1;
  private pumpScheduled = false;
  private pumpScheduleGeneration = 0;
  private activated = false;
  private suspended = false;
  private disposed = false;
  private deviceClassOverride: SpeciesArtDeviceClass | null = null;
  private failNextMessage: string | null = null;
  private thumbEncodedBytes = 0;
  private portraitEncodedBytes = 0;
  private readonly totals0 = {
    activations: 0,
    producerStarts: 0,
    producerDisposals: 0,
    producerFatals: 0,
    leaseAcquires: 0,
    leaseReleases: 0,
    portraitRequests: 0,
    portraitCancels: 0,
    jobStarts: 0,
    jobCompletes: 0,
    jobErrors: 0,
    jobCancels: 0,
    thumbJobStarts: 0,
    thumbJobCompletes: 0,
    thumbJobErrors: 0,
    thumbJobCancels: 0,
    portraitJobStarts: 0,
    portraitJobCompletes: 0,
    portraitJobErrors: 0,
    portraitJobCancels: 0,
    jobRequeues: 0,
    dedupeHits: 0,
    thumbDedupeHits: 0,
    portraitDedupeHits: 0,
    cacheHits: 0,
    thumbCacheHits: 0,
    portraitCacheHits: 0,
    cacheDisposals: 0,
    droppedResults: 0,
    protocolErrors: 0,
    maxQueuedJobs: 0,
    maxActiveJobs: 0,
    maxQueuedThumbJobs: 0,
    maxActiveThumbJobs: 0,
  };

  constructor(private readonly options: SpeciesArtBrokerOptions) {
    if (typeof options.createProducer !== 'function') {
      throw new TypeError('species art producer factory must be callable');
    }
    if (options.disposeAsset !== undefined && typeof options.disposeAsset !== 'function') {
      throw new TypeError('species art asset disposer must be callable');
    }
    this.scheduleTask = options.scheduleTask ?? defaultScheduleTask;
    if (typeof this.scheduleTask !== 'function') {
      throw new TypeError('species art task scheduler must be callable');
    }
  }

  activate(): void {
    if (this.disposed || this.activated) return;
    this.activated = true;
    this.totals0.activations++;
    this.schedulePump();
  }

  leaseThumb(genomeValue: Record<string, unknown>): ThumbLease {
    const genome = snapshotSpeciesGenome(genomeValue);
    const key = speciesVisualKey(genome);
    this.totals0.leaseAcquires++;
    const state: ThumbLeaseState = {
      key,
      released: false,
      settled: false,
      asset: null,
      error: null,
      job: null,
      listeners: new Set(),
    };
    if (this.disposed) {
      this.settleDetachedThumb(state, new Error('species art broker is disposed'));
      return this.publicThumbLease(state);
    }
    if (this.thumbLeases.size >= this.limits().thumbLeases) {
      this.settleDetachedThumb(state, new Error('species thumbnail lease budget is exhausted'));
      return this.publicThumbLease(state);
    }
    this.thumbLeases.add(state);

    const cached = this.thumbCache.get(key);
    if (cached) {
      this.totals0.cacheHits++;
      this.totals0.thumbCacheHits++;
      this.touchThumb(key, cached);
      state.asset = cached;
      state.settled = true;
      return this.publicThumbLease(state);
    }

    const mapKey = mapKeyFor('thumb132', key);
    const shared = this.jobs.get(mapKey);
    if (shared) {
      this.totals0.dedupeHits++;
      this.totals0.thumbDedupeHits++;
      state.job = shared;
      shared.thumbLeases.add(state);
      return this.publicThumbLease(state);
    }
    if (this.queuedCount() >= this.limits().queuedJobs) {
      this.settleDetachedThumb(state, new Error('species art queue is at its device limit'));
      return this.publicThumbLease(state);
    }
    const job = this.makeJob('thumb132', key, genome);
    state.job = job;
    job.thumbLeases.add(state);
    this.jobs.set(mapKey, job);
    this.thumbQueue.push(job);
    this.recordQueueHighWater();
    this.schedulePump();
    return this.publicThumbLease(state);
  }

  requestPortrait(
    owner: string,
    genomeValue: Record<string, unknown>,
    listener: PortraitListener,
  ): PortraitRequest {
    if (!owner) throw new TypeError('species portrait owner must be non-empty');
    if (typeof listener !== 'function') throw new TypeError('species portrait listener must be callable');
    this.cancelPortrait(this.portraitOwners.get(owner) ?? null);
    const genome = snapshotSpeciesGenome(genomeValue);
    const key = speciesVisualKey(genome);
    this.totals0.portraitRequests++;
    const state: PortraitRequestState = {
      owner,
      key,
      cancelled: false,
      settled: false,
      asset: null,
      job: null,
      listener,
    };
    if (this.disposed) {
      this.settleDetachedPortrait(state, new Error('species art broker is disposed'));
      return this.publicPortraitRequest(state);
    }
    this.portraitOwners.set(owner, state);
    const cached = this.portraitCache.get(key);
    if (cached) {
      this.totals0.cacheHits++;
      this.totals0.portraitCacheHits++;
      this.touchPortrait(key, cached);
      state.asset = cached;
      state.settled = true;
      this.portraitOwners.delete(owner);
      return this.publicPortraitRequest(state);
    }

    const mapKey = mapKeyFor('portrait440', key);
    const shared = this.jobs.get(mapKey);
    if (shared) {
      this.totals0.dedupeHits++;
      this.totals0.portraitDedupeHits++;
      state.job = shared;
      shared.portraitRequests.add(state);
      return this.publicPortraitRequest(state);
    }
    if (this.queuedCount() >= this.limits().queuedJobs) {
      this.portraitOwners.delete(owner);
      this.settleDetachedPortrait(state, new Error('species art queue is at its device limit'));
      return this.publicPortraitRequest(state);
    }
    const job = this.makeJob('portrait440', key, genome);
    state.job = job;
    job.portraitRequests.add(state);
    this.jobs.set(mapKey, job);
    this.portraitQueue.push(job);
    this.recordQueueHighWater();
    this.schedulePump();
    return this.publicPortraitRequest(state);
  }

  setDeviceClassForTest(value: SpeciesArtDeviceClass | null): void {
    if (value !== null && value !== 'phone' && value !== 'desktop') {
      throw new TypeError('invalid species art device class');
    }
    this.deviceClassOverride = value;
    this.refreshDeviceClass();
  }

  /** Re-applies the current device limits after a real media-query change. */
  refreshDeviceClass(): void {
    this.trimCaches();
    this.trimQueue();
  }

  /** Releases cache-only art without disturbing a live lease or request. */
  releaseUnownedCachedArt(
    options: SpeciesArtUnownedCacheReleaseOptions = {},
  ): SpeciesArtUnownedCacheReleaseV1 {
    const requestedRetention = options.retainRecentThumbEntries ?? 0;
    if (!Number.isSafeInteger(requestedRetention) || requestedRetention < 0) {
      throw new RangeError('recent species thumbnail retention must be a non-negative safe integer');
    }
    const retainRecentThumbEntries = Math.min(
      requestedRetention,
      this.limits().thumbCacheEntries,
    );
    let releasedThumbEntries = 0;
    let releasedPortraitEntries = 0;
    const unownedThumbKeys = [...this.thumbCache.keys()]
      .filter((key) => !this.thumbKeyIsLeased(key));
    const releaseThumbCount = Math.max(0, unownedThumbKeys.length - retainRecentThumbEntries);
    for (const key of unownedThumbKeys.slice(0, releaseThumbCount)) {
      if (this.disposeThumbCache(key)) {
        releasedThumbEntries++;
      }
    }
    for (const key of [...this.portraitCache.keys()]) {
      if (!this.portraitKeyIsOwned(key) && this.disposePortraitCache(key)) {
        releasedPortraitEntries++;
      }
    }
    return Object.freeze({
      schema: 'cf-v2-species-art-unowned-cache-release/v1' as const,
      releasedThumbEntries,
      releasedPortraitEntries,
      releasedEntries: releasedThumbEntries + releasedPortraitEntries,
    });
  }

  failNextJobForTest(message = 'injected species art producer failure'): void {
    this.failNextMessage = message;
  }

  suspendForBfcache(): void {
    if (this.disposed || this.suspended) return;
    this.suspended = true;
    this.pumpScheduled = false;
    this.pumpScheduleGeneration++;
    const interrupted = this.activeJob;
    this.activeJob = null;
    this.closeProducer('bfcache suspension');
    if (interrupted) {
      interrupted.jobId = null;
      if (this.jobHasConsumers(interrupted)) {
        interrupted.state = 'queued';
        this.queueFor(interrupted.kind).unshift(interrupted);
        this.totals0.jobRequeues++;
        this.recordQueueHighWater();
      } else {
        this.cancelJob(interrupted, null);
      }
    }
  }

  resumeFromBfcache(): void {
    if (this.disposed || !this.suspended) return;
    this.suspended = false;
    this.schedulePump();
  }

  dispose(reason = 'species art broker disposed'): void {
    if (this.disposed) return;
    this.disposed = true;
    this.suspended = false;
    this.activated = false;
    this.pumpScheduled = false;
    this.pumpScheduleGeneration++;
    this.closeProducer(reason);
    for (const lease of [...this.thumbLeases]) this.releaseThumb(lease);
    for (const request of [...this.portraitOwners.values()]) this.cancelPortrait(request);
    const jobs = [
      ...(this.activeJob ? [this.activeJob] : []),
      ...this.portraitQueue,
      ...this.thumbQueue,
    ];
    this.activeJob = null;
    this.portraitQueue.length = 0;
    this.thumbQueue.length = 0;
    for (const job of jobs) {
      this.jobs.delete(job.mapKey);
      job.state = 'cancelled';
      job.jobId = null;
      job.thumbLeases.clear();
      job.portraitRequests.clear();
    }
    for (const key of [...this.thumbCache.keys()]) this.disposeThumbCache(key);
    for (const key of [...this.portraitCache.keys()]) this.disposePortraitCache(key);
  }

  diagnostics(): SpeciesArtBrokerDiagnosticsV1 {
    let subscribers = 0;
    for (const lease of this.thumbLeases) subscribers += lease.listeners.size;
    const limits = this.limits();
    const active = this.activeJob ? [`${this.activeJob.kind}:${String(this.activeJob.key)}`] : [];
    return Object.freeze({
      schema: 'cf-v2-species-art-broker-diagnostics/v1' as const,
      state: Object.freeze({
        activated: this.activated,
        suspended: this.suspended,
        disposed: this.disposed,
        producer: this.producer ? 'live' as const : 'idle' as const,
        deviceClass: this.deviceClass(),
      }),
      limits: Object.freeze({ budgetStatus: 'active-measured' as const, ...limits }),
      live: Object.freeze({
        thumbCacheEntries: this.thumbCache.size,
        thumbDecodedPixels: this.thumbCache.size * THUMB_PIXELS,
        thumbDecodedBytes: this.thumbCache.size * THUMB_DECODED_BYTES,
        thumbEncodedBytes: this.thumbEncodedBytes,
        portraitCacheEntries: this.portraitCache.size,
        portraitEncodedBytes: this.portraitEncodedBytes,
        queuedJobs: this.queuedCount(),
        queuedThumbJobs: this.thumbQueue.length,
        queuedPortraitJobs: this.portraitQueue.length,
        activeJobs: this.activeJob ? 1 : 0,
        thumbLeases: this.thumbLeases.size,
        thumbSubscribers: subscribers,
        portraitRequests: this.portraitOwners.size,
      }),
      totals: Object.freeze({ ...this.totals0 }),
      keys: Object.freeze({
        leasedThumbs: Object.freeze([...this.thumbLeases].map((lease) => String(lease.key)).sort()),
        queuedThumbs: Object.freeze(this.thumbQueue.map((job) => String(job.key))),
        queuedPortraits: Object.freeze(this.portraitQueue.map((job) => String(job.key))),
        active: Object.freeze(active),
        cachedThumbs: Object.freeze([...this.thumbCache.keys()].map((key) => String(key))),
        cachedPortraits: Object.freeze([...this.portraitCache.keys()].map((key) => String(key))),
      }),
    });
  }

  private deviceClass(): SpeciesArtDeviceClass {
    if (this.deviceClassOverride) return this.deviceClassOverride;
    try {
      const value = this.options.getDeviceClass?.();
      return value === 'phone' || value === 'desktop' ? value : 'desktop';
    } catch { return 'desktop'; }
  }

  private limits(): DeviceLimits { return DEVICE_LIMITS[this.deviceClass()]; }
  private queuedCount(): number { return this.thumbQueue.length + this.portraitQueue.length; }
  private queueFor(kind: SpeciesArtRenderKind): BrokerJob[] {
    return kind === 'portrait440' ? this.portraitQueue : this.thumbQueue;
  }
  private makeJob(
    kind: SpeciesArtRenderKind,
    key: SpeciesVisualKey,
    genome: Readonly<Record<string, unknown>>,
  ): BrokerJob {
    return {
      mapKey: mapKeyFor(kind, key),
      kind,
      key,
      genome,
      state: 'queued',
      jobId: null,
      thumbLeases: new Set(),
      portraitRequests: new Set(),
    };
  }
  private jobHasConsumers(job: BrokerJob): boolean {
    return job.thumbLeases.size > 0 || job.portraitRequests.size > 0;
  }
  private recordQueueHighWater(): void {
    this.totals0.maxQueuedJobs = Math.max(this.totals0.maxQueuedJobs, this.queuedCount());
    this.totals0.maxQueuedThumbJobs = Math.max(
      this.totals0.maxQueuedThumbJobs, this.thumbQueue.length,
    );
  }

  private publicThumbLease(state: ThumbLeaseState): ThumbLease {
    return Object.freeze({
      key: state.key,
      get current(): Thumb132 | null { return state.asset; },
      subscribe: (listener: ThumbListener): (() => void) => {
        if (typeof listener !== 'function' || state.released) return () => {};
        state.listeners.add(listener);
        if (state.settled) {
          queueMicrotask(() => {
            if (state.released || !state.listeners.delete(listener)) return;
            this.notifyThumb(listener, state.asset, state.error);
          });
        }
        let subscribed = true;
        return (): void => {
          if (!subscribed) return;
          subscribed = false;
          state.listeners.delete(listener);
        };
      },
      release: (): void => { this.releaseThumb(state); },
    });
  }

  private publicPortraitRequest(state: PortraitRequestState): PortraitRequest {
    return Object.freeze({
      key: state.key,
      get current(): Portrait440 | null { return state.asset; },
      cancel: (): void => { this.cancelPortrait(state); },
    });
  }

  private notifyThumb(listener: ThumbListener, asset: Thumb132 | null, error: Error | null): void {
    try {
      if (error) listener(null, error);
      else listener(asset);
    } catch { /* one lease cannot prevent another owner from settling */ }
  }

  private notifyPortrait(state: PortraitRequestState, asset: Portrait440 | null, error: Error | null): void {
    if (state.cancelled) return;
    try {
      if (error) state.listener(null, error);
      else state.listener(asset);
    } catch { /* app callbacks cannot corrupt broker ownership */ }
  }

  private settleDetachedThumb(state: ThumbLeaseState, error: Error): void {
    state.error = error;
    state.settled = true;
  }

  private settleDetachedPortrait(state: PortraitRequestState, error: Error): void {
    state.settled = true;
    queueMicrotask(() => this.notifyPortrait(state, null, error));
  }

  private releaseThumb(state: ThumbLeaseState): void {
    if (state.released) return;
    state.released = true;
    this.totals0.leaseReleases++;
    state.listeners.clear();
    this.thumbLeases.delete(state);
    state.asset = null;
    state.error = null;
    const job = state.job;
    state.job = null;
    if (job) {
      job.thumbLeases.delete(state);
      if (job.state === 'queued' && !this.jobHasConsumers(job)) this.cancelJob(job, null);
    }
    this.trimThumbCache();
  }

  private cancelPortrait(state: PortraitRequestState | null): void {
    /* A completed request no longer owns producer work. Its public cancel
       handle may outlive the callback until a panel closes; that late cleanup
       is intentionally idempotent and must not inflate cancellation totals. */
    if (!state || state.cancelled || state.settled) return;
    state.cancelled = true;
    this.totals0.portraitCancels++;
    if (this.portraitOwners.get(state.owner) === state) this.portraitOwners.delete(state.owner);
    state.asset = null;
    const job = state.job;
    state.job = null;
    if (job) {
      job.portraitRequests.delete(state);
      if (job.state === 'queued' && !this.jobHasConsumers(job)) this.cancelJob(job, null);
    }
  }

  private cancelJob(job: BrokerJob, error: Error | null): void {
    if (job.state !== 'queued' && job.state !== 'running') return;
    if (job.state === 'queued') {
      const queue = this.queueFor(job.kind);
      const index = queue.indexOf(job);
      if (index >= 0) queue.splice(index, 1);
    } else if (this.activeJob === job) {
      this.activeJob = null;
    }
    this.jobs.delete(job.mapKey);
    job.state = 'cancelled';
    job.jobId = null;
    this.totals0.jobCancels++;
    if (job.kind === 'thumb132') this.totals0.thumbJobCancels++;
    else this.totals0.portraitJobCancels++;
    const leases = [...job.thumbLeases];
    const requests = [...job.portraitRequests];
    job.thumbLeases.clear();
    job.portraitRequests.clear();
    for (const lease of leases) {
      lease.job = null;
      if (!lease.released && error) {
        lease.asset = null;
        lease.error = error;
        lease.settled = true;
        this.deliverThumb(lease);
      }
    }
    for (const request of requests) {
      request.job = null;
      if (this.portraitOwners.get(request.owner) === request) this.portraitOwners.delete(request.owner);
      if (!request.cancelled && error) {
        request.settled = true;
        this.notifyPortrait(request, null, error);
      }
    }
  }

  private deliverThumb(state: ThumbLeaseState): void {
    if (state.released || !state.settled) return;
    const listeners = [...state.listeners];
    state.listeners.clear();
    for (const listener of listeners) this.notifyThumb(listener, state.asset, state.error);
  }

  private schedulePump(): void {
    if (this.pumpScheduled || this.disposed || this.suspended || !this.activated
      || this.activeJob || this.queuedCount() === 0) return;
    this.pumpScheduled = true;
    const generation = ++this.pumpScheduleGeneration;
    this.scheduleTask(() => {
      if (generation !== this.pumpScheduleGeneration) return;
      this.pumpScheduled = false;
      this.pump();
    });
  }

  private pump(): void {
    if (this.disposed || this.suspended || !this.activated || this.activeJob) return;
    let job: BrokerJob | undefined;
    while ((job = this.portraitQueue.shift() ?? this.thumbQueue.shift())) {
      if (job.state === 'queued' && this.jobHasConsumers(job)) break;
      if (job.state === 'queued') this.cancelJob(job, null);
      job = undefined;
    }
    if (!job) {
      this.closeProducer('idle queue drained');
      return;
    }
    job.state = 'running';
    job.jobId = this.nextJobId++;
    this.activeJob = job;
    this.totals0.jobStarts++;
    if (job.kind === 'thumb132') this.totals0.thumbJobStarts++;
    else this.totals0.portraitJobStarts++;
    this.totals0.maxActiveJobs = Math.max(this.totals0.maxActiveJobs, 1);
    if (job.kind === 'thumb132') this.totals0.maxActiveThumbJobs = 1;
    /* Mark the job active before producer construction. A factory failure is
       therefore terminal for this exact job instead of orphaning it between
       the queue and the producer. */
    if (!this.ensureProducer()) return;
    const failure = this.failNextMessage;
    this.failNextMessage = null;
    try {
      this.producer!.render(Object.freeze({
        jobId: job.jobId,
        kind: job.kind,
        key: job.key,
        genome: job.genome,
        ...(failure === null ? {} : { testFailureMessage: failure }),
      }));
    } catch (error) {
      this.handleProducerFatal(this.producerGeneration, error);
    }
  }

  private ensureProducer(): boolean {
    if (this.producer) return true;
    const generation = ++this.producerGeneration;
    let port: SpeciesArtProducerPort;
    try {
      port = this.options.createProducer(Object.freeze({
        result: (result: SpeciesArtProducerResult): void => {
          if (generation === this.producerGeneration) this.handleProducerResult(result);
          else this.disposeSuccessfulResultAsset(result);
        },
        fatal: (error: unknown): void => { this.handleProducerFatal(generation, error); },
      }));
      if (!port || typeof port.render !== 'function' || typeof port.dispose !== 'function') {
        throw new Error('species art producer factory returned an invalid port');
      }
    } catch (error) {
      this.handleProducerFatal(generation, error);
      return false;
    }
    if (generation !== this.producerGeneration || this.disposed || this.suspended) {
      try { port.dispose('producer became stale during construction'); } catch { /* already unusable */ }
      return false;
    }
    this.producer = port;
    this.totals0.producerStarts++;
    return true;
  }

  private handleProducerResult(result: SpeciesArtProducerResult): void {
    const job = this.activeJob;
    if (!job || job.jobId === null
      || !result || (result.status !== 'success' && result.status !== 'error')
      || result.jobId !== job.jobId || result.kind !== job.kind || result.key !== job.key) {
      this.disposeSuccessfulResultAsset(result);
      this.totals0.protocolErrors++;
      this.handleProducerFatal(this.producerGeneration, new Error('species art producer result did not match the active job'));
      return;
    }
    if (result.status === 'error') {
      this.settleActiveError(job, asError(result.error));
      return;
    }
    const asset = this.validateAsset(job, result.asset);
    if (!asset) {
      this.disposeAsset(result.asset);
      this.totals0.protocolErrors++;
      this.handleProducerFatal(this.producerGeneration, new Error('species art producer returned an invalid asset'));
      return;
    }
    this.settleActiveSuccess(job, asset);
  }

  private validateAsset(job: BrokerJob, candidate: SpeciesArtAsset): SpeciesArtAsset | null {
    const expected = job.kind === 'thumb132' ? THUMB_SIZE : PORTRAIT_SIZE;
    const validUrl = typeof candidate?.url === 'string'
      && ((candidate.url.startsWith('data:image/png;base64,')
          && candidate.url.length > 'data:image/png;base64,'.length)
        || (candidate.url.startsWith('blob:') && candidate.url.length > 'blob:'.length));
    if (!candidate || candidate.key !== job.key || candidate.width !== expected || candidate.height !== expected
      || !validUrl
      || !Number.isSafeInteger(candidate.encodedBytes) || candidate.encodedBytes <= 0
      || candidate.decodedPixels !== expected * expected) return null;
    return job.kind === 'thumb132'
      ? Object.freeze({
        key: job.key,
        url: candidate.url,
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        encodedBytes: candidate.encodedBytes,
        decodedPixels: THUMB_PIXELS,
      })
      : Object.freeze({
        key: job.key,
        url: candidate.url,
        width: PORTRAIT_SIZE,
        height: PORTRAIT_SIZE,
        encodedBytes: candidate.encodedBytes,
        decodedPixels: PORTRAIT_PIXELS,
      });
  }

  private settleActiveSuccess(job: BrokerJob, assetValue: SpeciesArtAsset): void {
    if (this.activeJob !== job) return;
    this.activeJob = null;
    this.jobs.delete(job.mapKey);
    job.state = 'settled';
    job.jobId = null;
    this.totals0.jobCompletes++;
    if (job.kind === 'thumb132') this.totals0.thumbJobCompletes++;
    else this.totals0.portraitJobCompletes++;
    if (!this.jobHasConsumers(job)) {
      this.totals0.droppedResults++;
      this.disposeAsset(assetValue);
      job.thumbLeases.clear();
      job.portraitRequests.clear();
      this.continueOrReleaseProducer();
      return;
    }
    if (job.kind === 'thumb132') {
      const asset = assetValue as Thumb132;
      const cachedAsset = this.cacheThumb(asset);
      if (cachedAsset === null) {
        this.disposeAsset(asset);
        this.settleCompletedJobError(job, new Error('species thumbnail resource budget is exhausted'));
        return;
      }
      const leases = [...job.thumbLeases];
      job.thumbLeases.clear();
      for (const lease of leases) {
        lease.job = null;
        if (lease.released) continue;
        lease.asset = cachedAsset;
        lease.error = null;
        lease.settled = true;
        this.deliverThumb(lease);
      }
    } else {
      const asset = assetValue as Portrait440;
      const cachedAsset = this.cachePortrait(asset);
      if (cachedAsset === null) {
        this.disposeAsset(asset);
        this.settleCompletedJobError(job, new Error('species portrait resource budget is exhausted'));
        return;
      }
      const requests = [...job.portraitRequests];
      job.portraitRequests.clear();
      for (const request of requests) {
        request.job = null;
        if (this.portraitOwners.get(request.owner) === request) this.portraitOwners.delete(request.owner);
        if (request.cancelled) continue;
        request.asset = cachedAsset;
        request.settled = true;
        this.notifyPortrait(request, cachedAsset, null);
      }
    }
    this.continueOrReleaseProducer();
  }

  private settleActiveError(job: BrokerJob, error: Error): void {
    if (this.activeJob !== job) return;
    this.activeJob = null;
    this.jobs.delete(job.mapKey);
    job.state = 'settled';
    job.jobId = null;
    this.totals0.jobErrors++;
    if (job.kind === 'thumb132') this.totals0.thumbJobErrors++;
    else this.totals0.portraitJobErrors++;
    this.settleJobConsumersError(job, error);
    this.continueOrReleaseProducer();
  }

  private settleCompletedJobError(job: BrokerJob, error: Error): void {
    this.totals0.jobCompletes--;
    this.totals0.jobErrors++;
    if (job.kind === 'thumb132') {
      this.totals0.thumbJobCompletes--;
      this.totals0.thumbJobErrors++;
    } else {
      this.totals0.portraitJobCompletes--;
      this.totals0.portraitJobErrors++;
    }
    this.settleJobConsumersError(job, error);
    this.continueOrReleaseProducer();
  }

  private settleJobConsumersError(job: BrokerJob, error: Error): void {
    const leases = [...job.thumbLeases];
    const requests = [...job.portraitRequests];
    job.thumbLeases.clear();
    job.portraitRequests.clear();
    for (const lease of leases) {
      lease.job = null;
      if (lease.released) continue;
      lease.asset = null;
      lease.error = error;
      lease.settled = true;
      this.deliverThumb(lease);
    }
    for (const request of requests) {
      request.job = null;
      if (this.portraitOwners.get(request.owner) === request) this.portraitOwners.delete(request.owner);
      if (request.cancelled) continue;
      request.settled = true;
      this.notifyPortrait(request, null, error);
    }
  }

  private handleProducerFatal(generation: number, value: unknown): void {
    if (generation !== this.producerGeneration || this.disposed) return;
    const error = asError(value);
    this.totals0.producerFatals++;
    const doomed = [
      ...(this.activeJob ? [this.activeJob] : []),
      ...this.portraitQueue,
      ...this.thumbQueue,
    ];
    this.activeJob = null;
    this.portraitQueue.length = 0;
    this.thumbQueue.length = 0;
    this.closeProducer('producer fatal error');
    for (const job of doomed) {
      if (job.state === 'settled' || job.state === 'cancelled') continue;
      this.jobs.delete(job.mapKey);
      job.state = 'settled';
      job.jobId = null;
      this.totals0.jobErrors++;
      if (job.kind === 'thumb132') this.totals0.thumbJobErrors++;
      else this.totals0.portraitJobErrors++;
      this.settleJobConsumersError(job, error);
    }
    /* Error callbacks may have submitted fresh work after the old queues were
       detached. Future requests may start a new producer; failed jobs do not
       retry themselves. */
    this.schedulePump();
  }

  private closeProducer(reason: string): void {
    const port = this.producer;
    this.producer = null;
    this.producerGeneration++;
    if (!port) return;
    this.totals0.producerDisposals++;
    try { port.dispose(reason); } catch { /* ownership is already revoked */ }
  }

  private continueOrReleaseProducer(): void {
    if (this.queuedCount() > 0) this.schedulePump();
    else if (!this.activeJob) this.closeProducer('idle species-art queue');
  }

  private touchThumb(key: SpeciesVisualKey, asset: Thumb132): void {
    this.thumbCache.delete(key);
    this.thumbCache.set(key, asset);
  }
  private touchPortrait(key: SpeciesVisualKey, asset: Portrait440): void {
    this.portraitCache.delete(key);
    this.portraitCache.set(key, asset);
  }
  private thumbKeyIsLeased(key: SpeciesVisualKey): boolean {
    for (const lease of this.thumbLeases) if (!lease.released && lease.key === key) return true;
    return false;
  }
  private portraitKeyIsOwned(key: SpeciesVisualKey): boolean {
    for (const request of this.portraitOwners.values()) {
      if (!request.cancelled && !request.settled && request.key === key) return true;
    }
    return false;
  }
  private disposeThumbCache(key: SpeciesVisualKey): boolean {
    const asset = this.thumbCache.get(key);
    if (!asset) return false;
    this.thumbCache.delete(key);
    this.thumbEncodedBytes -= asset.encodedBytes;
    this.totals0.cacheDisposals++;
    this.disposeAsset(asset);
    return true;
  }
  private disposePortraitCache(key: SpeciesVisualKey): boolean {
    const asset = this.portraitCache.get(key);
    if (!asset) return false;
    this.portraitCache.delete(key);
    this.portraitEncodedBytes -= asset.encodedBytes;
    this.totals0.cacheDisposals++;
    this.disposeAsset(asset);
    return true;
  }
  private disposeAsset(asset: SpeciesArtAsset): void {
    try { this.options.disposeAsset?.(asset); } catch { /* ownership is already revoked */ }
  }
  private disposeSuccessfulResultAsset(result: SpeciesArtProducerResult): void {
    if (result?.status === 'success') this.disposeAsset(result.asset);
  }
  private cacheThumb(asset: Thumb132): Thumb132 | null {
    const existing = this.thumbCache.get(asset.key);
    if (existing) {
      this.touchThumb(asset.key, existing);
      this.disposeAsset(asset);
      return existing;
    }
    const limits = this.limits();
    if (asset.encodedBytes > limits.thumbEncodedBytes) return null;
    while (this.thumbCache.size + 1 > limits.thumbCacheEntries
      || this.thumbCache.size * THUMB_PIXELS + THUMB_PIXELS > limits.thumbDecodedPixels
      || this.thumbCache.size * THUMB_DECODED_BYTES + THUMB_DECODED_BYTES > limits.thumbDecodedBytes
      || this.thumbEncodedBytes + asset.encodedBytes > limits.thumbEncodedBytes) {
      let victim: SpeciesVisualKey | undefined;
      for (const key of this.thumbCache.keys()) {
        if (!this.thumbKeyIsLeased(key)) { victim = key; break; }
      }
      if (victim === undefined) return null;
      this.disposeThumbCache(victim);
    }
    this.thumbCache.set(asset.key, asset);
    this.thumbEncodedBytes += asset.encodedBytes;
    return asset;
  }
  private cachePortrait(asset: Portrait440): Portrait440 | null {
    const existing = this.portraitCache.get(asset.key);
    if (existing) {
      this.touchPortrait(asset.key, existing);
      this.disposeAsset(asset);
      return existing;
    }
    const limits = this.limits();
    if (asset.encodedBytes > limits.portraitEncodedBytes) return null;
    while (this.portraitCache.size + 1 > limits.portraitCacheEntries
      || this.portraitEncodedBytes + asset.encodedBytes > limits.portraitEncodedBytes) {
      const victim = this.portraitCache.keys().next().value as SpeciesVisualKey | undefined;
      if (victim === undefined) return null;
      this.disposePortraitCache(victim);
    }
    this.portraitCache.set(asset.key, asset);
    this.portraitEncodedBytes += asset.encodedBytes;
    return asset;
  }
  private trimThumbCache(): void {
    const limits = this.limits();
    while (this.thumbCache.size > limits.thumbCacheEntries
      || this.thumbCache.size * THUMB_PIXELS > limits.thumbDecodedPixels
      || this.thumbCache.size * THUMB_DECODED_BYTES > limits.thumbDecodedBytes
      || this.thumbEncodedBytes > limits.thumbEncodedBytes) {
      let victim: SpeciesVisualKey | undefined;
      for (const key of this.thumbCache.keys()) {
        if (!this.thumbKeyIsLeased(key)) { victim = key; break; }
      }
      if (victim === undefined) break;
      this.disposeThumbCache(victim);
    }
  }
  private trimPortraitCache(): void {
    const limits = this.limits();
    while (this.portraitCache.size > limits.portraitCacheEntries
      || this.portraitEncodedBytes > limits.portraitEncodedBytes) {
      const victim = this.portraitCache.keys().next().value as SpeciesVisualKey | undefined;
      if (victim === undefined) break;
      this.disposePortraitCache(victim);
    }
  }
  private trimCaches(): void {
    this.trimThumbCache();
    this.trimPortraitCache();
  }
  private trimQueue(): void {
    const cap = this.limits().queuedJobs;
    const error = new Error('species art job cancelled by device-cap shrink');
    while (this.queuedCount() > cap) {
      const job = this.thumbQueue[this.thumbQueue.length - 1]
        ?? this.portraitQueue[this.portraitQueue.length - 1];
      if (!job) break;
      this.cancelJob(job, error);
    }
  }
}
