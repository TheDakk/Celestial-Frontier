/* SpeciesArt — browser-only deterministic compatibility ownership.
   Audit and legacy callers retain the exact synchronous 440px URL APIs and
   historical lease diagnostics in this module. The live v2 app imports the
   worker-safe identity/painter/broker subpaths instead; it never imports this
   DOM allocator or its synchronous painter graph. */
import {
  hdPortraitFauna, hdPortraitFaunaCanvas,
  hdPortraitFlora, hdPortraitFloraCanvas,
  hdPortraitFungi, hdPortraitFungiCanvas,
  hdPortraitMicrobe, hdPortraitMicrobeCanvas,
} from './hdart.verbatim.js';
import {
  lineageRenderKingdom, resolveOverrideCanvas,
} from './speciesoverrides.js';
import { resolveOverride } from './speciescompat.js';
import {
  speciesVisualKey,
  snapshotSpeciesGenome,
  type SpeciesVisualKey,
} from './speciesidentity.js';
export { CLIPPED } from './speciesoverrides.js';
export { speciesVisualKey, type SpeciesVisualKey } from './speciesidentity.js';
export { resolveOverride, resolveProcedural } from './speciescompat.js';

const PORTRAIT_SIZE = 440;
const THUMB_SIZE = 132 as const;
const THUMB_PIXELS = THUMB_SIZE * THUMB_SIZE;
const THUMB_DECODED_BYTES = THUMB_PIXELS * 4;
const PHONE_QUERY = '(max-width: 700px)';

export type SpeciesArtDeviceClass = 'phone' | 'desktop';

export interface Thumb132 {
  readonly key: SpeciesVisualKey;
  readonly url: string;
  readonly width: 132;
  readonly height: 132;
  /** UTF-8 bytes retained by the encoded data URL. */
  readonly encodedBytes: number;
  readonly decodedPixels: number;
}

export type ThumbListener = (asset: Thumb132 | null, error?: unknown) => void;

export interface ThumbLease {
  readonly key: SpeciesVisualKey;
  readonly current: Thumb132 | null;
  subscribe(listener: ThumbListener): () => void;
  release(): void;
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
    fullPortraitRendersForThumb: number;
    fullPortraitDecodesForThumb: number;
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

interface DeviceLimits {
  readonly cacheEntries: number;
  readonly decodedPixels: number;
  readonly decodedBytes: number;
  readonly encodedBytes: number;
  readonly queuedJobs: number;
  readonly activeJobs: number;
  readonly leases: number;
  readonly portraitEntries: number;
  readonly portraitEncodedBytes: number;
}

/* ACTIVE Arc 1A limits, paired against the sealed broken baseline and the
   checked-in three-run phone/desktop calibration authority. A 132px RGBA
   resource is 69,696 decoded bytes. Entry and byte limits are intentionally
   both enforced: neither a lucky compression ratio nor a fixed row count gets
   to stand in for the resource budget. */
const DEVICE_LIMITS: Readonly<Record<SpeciesArtDeviceClass, DeviceLimits>> = Object.freeze({
  phone: Object.freeze({
    cacheEntries: 96,
    decodedPixels: 96 * THUMB_PIXELS,
    decodedBytes: 96 * THUMB_DECODED_BYTES,
    encodedBytes: 96 * THUMB_DECODED_BYTES,
    queuedJobs: 96,
    activeJobs: 1,
    leases: 96,
    portraitEntries: 96,
    portraitEncodedBytes: 64 * 1024 * 1024,
  }),
  desktop: Object.freeze({
    cacheEntries: 256,
    decodedPixels: 256 * THUMB_PIXELS,
    decodedBytes: 256 * THUMB_DECODED_BYTES,
    encodedBytes: 256 * THUMB_DECODED_BYTES,
    queuedJobs: 256,
    activeJobs: 1,
    leases: 256,
    portraitEntries: 256,
    portraitEncodedBytes: 192 * 1024 * 1024,
  }),
});

interface PortraitEntry { readonly url: string; readonly encodedBytes: number }
interface LeaseState {
  readonly key: SpeciesVisualKey;
  released: boolean;
  settled: boolean;
  asset: Thumb132 | null;
  error: unknown | null;
  job: ThumbJob | null;
  readonly listeners: Set<ThumbListener>;
}
interface ThumbJob {
  readonly key: SpeciesVisualKey;
  readonly genome: Record<string, unknown>;
  state: 'queued' | 'running' | 'settled' | 'cancelled';
  readonly leases: Set<LeaseState>;
}

const speciesArtCache = new Map<SpeciesVisualKey, PortraitEntry>();
const speciesThumbCache = new Map<SpeciesVisualKey, Thumb132>();
const thumbJobs = new Map<SpeciesVisualKey, ThumbJob>();
const thumbQueue: ThumbJob[] = [];
const activeLeases = new Set<LeaseState>();
let portraitEncodedBytes = 0;
let thumbEncodedBytes = 0;
let activeJob: ThumbJob | null = null;
let queueTimer: ReturnType<typeof setTimeout> | null = null;
let deviceClassOverride: SpeciesArtDeviceClass | null = null;
let failNextThumbMessage: string | null = null;
let lifecycleEpoch = 0;

const totals = {
  leaseAcquires: 0,
  releases: 0,
  jobStarts: 0,
  jobCompletes: 0,
  jobCancels: 0,
  jobErrors: 0,
  dedupeHits: 0,
  disposals: 0,
  thumbCanvasRenders: 0,
  fullPortraitRendersForThumb: 0,
  fullPortraitDecodesForThumb: 0,
  maxQueuedJobs: 0,
  maxActiveJobs: 0,
};

function currentDeviceClass(): SpeciesArtDeviceClass {
  if (deviceClassOverride) return deviceClassOverride;
  try {
    return typeof matchMedia === 'function' && matchMedia(PHONE_QUERY).matches ? 'phone' : 'desktop';
  } catch { return 'desktop'; }
}
function currentLimits(): DeviceLimits { return DEVICE_LIMITS[currentDeviceClass()]; }

function encodedUrlBytes(url: string): number {
  return new TextEncoder().encode(url).byteLength;
}

function verbatimPortraitCanvas(g: Record<string, unknown>): HTMLCanvasElement {
  const renderKingdom = lineageRenderKingdom(g);
  return renderKingdom === 'fauna' ? hdPortraitFaunaCanvas(g)
    : (renderKingdom === 'flora' ? hdPortraitFloraCanvas(g)
      : (renderKingdom === 'fungi' ? hdPortraitFungiCanvas(g) : hdPortraitMicrobeCanvas(g)));
}
function verbatimPortrait(g: Record<string, unknown>): string {
  const renderKingdom = lineageRenderKingdom(g);
  return renderKingdom === 'fauna' ? hdPortraitFauna(g)
    : (renderKingdom === 'flora' ? hdPortraitFlora(g)
      : (renderKingdom === 'fungi' ? hdPortraitFungi(g) : hdPortraitMicrobe(g)));
}

/** Paints the production portrait without encoding or entering either cache. */
export function renderSpeciesPortraitCanvas(g: Record<string, unknown>): HTMLCanvasElement {
  const canvas = resolveOverrideCanvas(g) ?? verbatimPortraitCanvas(g);
  if (canvas.width !== PORTRAIT_SIZE || canvas.height !== PORTRAIT_SIZE) {
    throw new Error(`species portrait canvas must be ${PORTRAIT_SIZE}x${PORTRAIT_SIZE}`);
  }
  return canvas as unknown as HTMLCanvasElement;
}

/* Browser audit hook for the outcome-level lineage regression check. */
export function verbatimSpeciesPortraitForAudit(g: Record<string, unknown>): string {
  return verbatimPortrait(g);
}

function touchPortrait(key: SpeciesVisualKey, entry: PortraitEntry): void {
  speciesArtCache.delete(key);
  speciesArtCache.set(key, entry);
}
function trimPortraitCache(): void {
  const limits = currentLimits();
  while (speciesArtCache.size > limits.portraitEntries || portraitEncodedBytes > limits.portraitEncodedBytes) {
    const key = speciesArtCache.keys().next().value as SpeciesVisualKey | undefined;
    if (key === undefined) break;
    const entry = speciesArtCache.get(key);
    speciesArtCache.delete(key);
    if (entry) portraitEncodedBytes -= entry.encodedBytes;
  }
}

export function speciesPortrait(g: Record<string, unknown>): string {
  const key = speciesVisualKey(g);
  const hit = speciesArtCache.get(key);
  if (hit) { touchPortrait(key, hit); return hit.url; }
  /* Preserve the compatibility URL route byte-for-byte. The lease route is
     the only caller that consumes the new pre-encoding canvas seam. */
  const url = resolveOverride(g) ?? verbatimPortrait(g);
  const entry = Object.freeze({ url, encodedBytes: encodedUrlBytes(url) });
  speciesArtCache.set(key, entry);
  portraitEncodedBytes += entry.encodedBytes;
  trimPortraitCache();
  return url;
}

function thumbKeyIsLeased(key: SpeciesVisualKey): boolean {
  for (const lease of activeLeases) if (!lease.released && lease.key === key) return true;
  return false;
}
function disposeThumb(key: SpeciesVisualKey): boolean {
  const asset = speciesThumbCache.get(key);
  if (!asset) return false;
  speciesThumbCache.delete(key);
  thumbEncodedBytes -= asset.encodedBytes;
  totals.disposals++;
  return true;
}
function trimThumbCache(): void {
  const limits = currentLimits();
  while (speciesThumbCache.size > limits.cacheEntries || thumbEncodedBytes > limits.encodedBytes) {
    let victim: SpeciesVisualKey | undefined;
    for (const key of speciesThumbCache.keys()) {
      if (!thumbKeyIsLeased(key)) { victim = key; break; }
    }
    if (victim === undefined) break;  // live leases pin their resource
    disposeThumb(victim);
  }
}
function touchThumb(key: SpeciesVisualKey, asset: Thumb132): void {
  speciesThumbCache.delete(key);
  speciesThumbCache.set(key, asset);
}
function cacheThumb(asset: Thumb132): Thumb132 | null {
  const existing = speciesThumbCache.get(asset.key);
  if (existing) { touchThumb(asset.key, existing); return existing; }
  const limits = currentLimits();
  /* Make room before insertion. A pending lease already pins this key, so an
     insert-then-trim strategy could leave a formally over-budget cache when
     every older entry is also leased. */
  while (speciesThumbCache.size + 1 > limits.cacheEntries
    || thumbEncodedBytes + asset.encodedBytes > limits.encodedBytes) {
    let victim: SpeciesVisualKey | undefined;
    for (const key of speciesThumbCache.keys()) {
      if (!thumbKeyIsLeased(key)) { victim = key; break; }
    }
    if (victim === undefined) return null;
    disposeThumb(victim);
  }
  speciesThumbCache.set(asset.key, asset);
  thumbEncodedBytes += asset.encodedBytes;
  return asset;
}

function makeThumbAsset(key: SpeciesVisualKey, portrait: CanvasImageSource): Thumb132 {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = THUMB_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas context unavailable for species thumbnail');
  context.drawImage(portrait, 0, 0, THUMB_SIZE, THUMB_SIZE);
  const url = canvas.toDataURL();
  if (!url || url.length <= 30) throw new Error('species thumbnail encoder returned an empty data URL');
  totals.thumbCanvasRenders++;
  return Object.freeze({
    key,
    url,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    encodedBytes: encodedUrlBytes(url),
    decodedPixels: THUMB_PIXELS,
  });
}

function notifyListener(listener: ThumbListener, asset: Thumb132 | null, error: unknown | null): void {
  try {
    if (error === null) listener(asset);
    else listener(null, error);
  } catch { /* one consumer cannot prevent another lease from settling */ }
}
function deliverSettledLease(state: LeaseState): void {
  if (state.released || !state.settled) return;
  const listeners = [...state.listeners];
  state.listeners.clear();
  for (const listener of listeners) notifyListener(listener, state.asset, state.error);
}
function settleJobSuccess(job: ThumbJob, produced: Thumb132): void {
  const asset = job.leases.size ? cacheThumb(produced) : produced;
  if (job.leases.size && asset === null) {
    settleJobError(job, new Error('species thumbnail resource budget is exhausted'));
    return;
  }
  job.state = 'settled';
  thumbJobs.delete(job.key);
  totals.jobCompletes++;
  for (const lease of job.leases) {
    lease.job = null;
    if (lease.released) continue;
    lease.asset = asset;
    lease.error = null;
    lease.settled = true;
    deliverSettledLease(lease);
  }
  job.leases.clear();
}
function settleJobError(job: ThumbJob, thrown: unknown): void {
  const error = thrown instanceof Error ? thrown : new Error(String(thrown));
  job.state = 'settled';
  thumbJobs.delete(job.key);
  totals.jobErrors++;
  for (const lease of job.leases) {
    lease.job = null;
    if (lease.released) continue;
    lease.asset = null;
    lease.error = error;
    lease.settled = true;
    deliverSettledLease(lease);
  }
  job.leases.clear();
}
function cancelQueuedJob(job: ThumbJob, notify: boolean, reason: string): void {
  if (job.state !== 'queued') return;
  const index = thumbQueue.indexOf(job);
  if (index >= 0) thumbQueue.splice(index, 1);
  if (thumbQueue.length === 0 && activeJob === null && queueTimer !== null) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }
  thumbJobs.delete(job.key);
  job.state = 'cancelled';
  totals.jobCancels++;
  const error = new Error(reason);
  for (const lease of job.leases) {
    lease.job = null;
    if (!lease.released && notify) {
      lease.asset = null;
      lease.error = error;
      lease.settled = true;
      deliverSettledLease(lease);
    }
  }
  job.leases.clear();
}

function scheduleQueue(): void {
  if (activeJob || queueTimer !== null || thumbQueue.length === 0) return;
  queueTimer = setTimeout(() => {
    queueTimer = null;
    runNextJob();
  }, 0);
}
function runNextJob(): void {
  if (activeJob) return;
  let job: ThumbJob | undefined;
  while ((job = thumbQueue.shift())) {
    if (job.state === 'queued' && job.leases.size) break;
    if (job.state === 'queued') cancelQueuedJob(job, false, 'species thumbnail job has no leases');
    job = undefined;
  }
  if (!job) return;
  activeJob = job;
  totals.maxActiveJobs = Math.max(totals.maxActiveJobs, 1);
  job.state = 'running';
  totals.jobStarts++;
  try {
    if (failNextThumbMessage !== null) {
      const message = failNextThumbMessage;
      failNextThumbMessage = null;
      throw new Error(message);
    }
    const portrait = renderSpeciesPortraitCanvas(job.genome);
    settleJobSuccess(job, makeThumbAsset(job.key, portrait));
  } catch (error) {
    settleJobError(job, error);
  } finally {
    activeJob = null;
    scheduleQueue();
  }
}

function makeLease(state: LeaseState): ThumbLease {
  const lease: ThumbLease = {
    key: state.key,
    get current(): Thumb132 | null { return state.asset; },
    subscribe(listener: ThumbListener): () => void {
      if (state.released) return () => {};
      state.listeners.add(listener);
      if (state.settled) {
        queueMicrotask(() => {
          if (state.released || !state.listeners.delete(listener)) return;
          notifyListener(listener, state.asset, state.error);
        });
      }
      let subscribed = true;
      return () => {
        if (!subscribed) return;
        subscribed = false;
        state.listeners.delete(listener);
      };
    },
    release(): void { releaseLease(state); },
  };
  return Object.freeze(lease);
}
function releaseLease(state: LeaseState): void {
  if (state.released) return;
  state.released = true;
  totals.releases++;
  state.listeners.clear();
  activeLeases.delete(state);
  state.asset = null;
  state.error = null;
  const job = state.job;
  state.job = null;
  if (job) {
    job.leases.delete(state);
    if (job.state === 'queued' && job.leases.size === 0) {
      cancelQueuedJob(job, false, 'species thumbnail job released before start');
    }
  }
  trimThumbCache();
}

/** Acquire one consumer reference to an exact 132px visual resource. */
export function leaseThumb(g: Record<string, unknown>): ThumbLease {
  const genome = snapshotSpeciesGenome(g);
  const key = speciesVisualKey(genome);
  totals.leaseAcquires++;
  const state: LeaseState = {
    key,
    released: false,
    settled: false,
    asset: null,
    error: null,
    job: null,
    listeners: new Set(),
  };
  if (activeLeases.size >= currentLimits().leases) {
    state.settled = true;
    state.error = new Error('species thumbnail lease budget is exhausted');
    return makeLease(state);
  }
  activeLeases.add(state);

  const cached = speciesThumbCache.get(key);
  if (cached) {
    totals.dedupeHits++;
    touchThumb(key, cached);
    state.asset = cached;
    state.settled = true;
    return makeLease(state);
  }

  const shared = thumbJobs.get(key);
  if (shared) {
    totals.dedupeHits++;
    state.job = shared;
    shared.leases.add(state);
    return makeLease(state);
  }

  if (thumbQueue.length >= currentLimits().queuedJobs) {
    state.settled = true;
    state.error = new Error('species thumbnail queue is at its device limit');
    return makeLease(state);
  }
  const job: ThumbJob = { key, genome, state: 'queued', leases: new Set([state]) };
  state.job = job;
  thumbJobs.set(key, job);
  thumbQueue.push(job);
  totals.maxQueuedJobs = Math.max(totals.maxQueuedJobs, thumbQueue.length);
  scheduleQueue();
  return makeLease(state);
}

/* Compatibility API: a miss still returns the exact 440px URL immediately
   and fills the 132px cache after Image decode, matching existing callers.
   Arc 1A list/Planetside code must use leaseThumb and therefore never enters
   this legacy full-cache/full-decode route. */
export function speciesThumb(g: Record<string, unknown>): string {
  const key = speciesVisualKey(g);
  const hit = speciesThumbCache.get(key);
  if (hit) { touchThumb(key, hit); return hit.url; }
  const portraitWasCached = speciesArtCache.has(key);
  const full = speciesPortrait(g);
  if (!portraitWasCached) totals.fullPortraitRendersForThumb++;
  const epoch = lifecycleEpoch;
  try {
    const image = new Image();
    image.onload = () => {
      if (epoch !== lifecycleEpoch || speciesThumbCache.has(key)) return;
      try {
        totals.fullPortraitDecodesForThumb++;
        void cacheThumb(makeThumbAsset(key, image));
      } catch { /* compatibility caller keeps the already-returned 440px URL */ }
    };
    image.src = full;
  } catch { /* compatibility caller keeps the already-returned 440px URL */ }
  return full;
}

function trimQueuedJobsToCurrentLimit(): void {
  const cap = currentLimits().queuedJobs;
  while (thumbQueue.length > cap) {
    const job = thumbQueue[thumbQueue.length - 1];
    if (!job) break;
    cancelQueuedJob(job, true, 'species thumbnail job cancelled by device-cap shrink');
  }
}
function trimAllToCurrentLimits(): void {
  trimPortraitCache();
  trimThumbCache();
  trimQueuedJobsToCurrentLimit();
}

/** Deterministic evidence seam; null resumes the real media-query class. */
export function __setSpeciesArtDeviceClassForTest(value: SpeciesArtDeviceClass | null): void {
  deviceClassOverride = value;
  trimAllToCurrentLimits();
}

/** One-shot negative control for producer error settlement. */
export function __failNextThumbJobForTest(message = 'injected species thumbnail failure'): void {
  failNextThumbMessage = message;
}

export function speciesArtDiagnostics(): SpeciesArtDiagnosticsV1 {
  /* Cache plus ready leases is the complete set of retained logical 132px
     resources. Count a shared key once even when several rows lease it. */
  const retained = new Map<SpeciesVisualKey, Thumb132>(speciesThumbCache);
  let subscribers = 0;
  const leased: SpeciesVisualKey[] = [];
  for (const lease of activeLeases) {
    leased.push(lease.key);
    subscribers += lease.listeners.size;
    if (lease.asset) retained.set(lease.key, lease.asset);
  }
  let decodedPixels = 0, decodedBytes = 0, encodedBytes = 0;
  for (const asset of retained.values()) {
    decodedPixels += asset.decodedPixels;
    decodedBytes += asset.decodedPixels * 4;
    encodedBytes += asset.encodedBytes;
  }
  const limits = currentLimits();
  return Object.freeze({
    schema: 'cf-v2-species-art-diagnostics/v1' as const,
    deviceClass: currentDeviceClass(),
    limits: Object.freeze({
      budgetStatus: 'active-measured' as const,
      cacheEntries: limits.cacheEntries,
      decodedPixels: limits.decodedPixels,
      decodedBytes: limits.decodedBytes,
      encodedBytes: limits.encodedBytes,
      encodedByteBasis: 'utf8-data-url' as const,
      queuedJobs: limits.queuedJobs,
      activeJobs: limits.activeJobs,
      leases: limits.leases,
      portraitEntries: limits.portraitEntries,
      portraitEncodedBytes: limits.portraitEncodedBytes,
    }),
    live: Object.freeze({
      cacheEntries: speciesThumbCache.size,
      decodedPixels,
      decodedBytes,
      encodedBytes,
      queuedJobs: thumbQueue.length,
      activeJobs: activeJob ? 1 : 0,
      leases: activeLeases.size,
      subscribers,
      portraitCacheEntries: speciesArtCache.size,
      portraitEncodedBytes,
    }),
    totals: Object.freeze({ ...totals }),
    keys: Object.freeze({
      leased: Object.freeze(leased.sort()),
      queued: Object.freeze(thumbQueue.map((job) => job.key)),
      active: Object.freeze(activeJob ? [activeJob.key] : []),
      cached: Object.freeze([...speciesThumbCache.keys()]),
    }),
  });
}

function disposeAllForPagehide(): void {
  lifecycleEpoch++;
  if (queueTimer !== null) { clearTimeout(queueTimer); queueTimer = null; }
  for (const lease of [...activeLeases]) releaseLease(lease);
  for (const job of [...thumbQueue]) cancelQueuedJob(job, false, 'document pagehide');
  for (const key of [...speciesThumbCache.keys()]) disposeThumb(key);
  speciesArtCache.clear();
  portraitEncodedBytes = 0;
}

function onPagehide(event: PageTransitionEvent): void {
  /* A persisted pagehide suspends this exact document for bfcache. Its app
     bindings resume with the same lease objects on pageshow, so disposing
     them here would strand otherwise-live DOM without a reacquisition path.
     A non-persisted pagehide is final document teardown and releases all
     package-owned resources. */
  if (event.persisted) return;
  disposeAllForPagehide();
}

try {
  window.addEventListener('pagehide', onPagehide);
  if (typeof matchMedia === 'function') {
    const query = matchMedia(PHONE_QUERY);
    query.addEventListener?.('change', () => {
      if (deviceClassOverride === null) trimAllToCurrentLimits();
    });
  }
} catch { /* imported only after shell/document ownership exists */ }
