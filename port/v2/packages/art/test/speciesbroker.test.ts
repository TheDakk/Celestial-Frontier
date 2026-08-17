import { describe, expect, it } from 'vitest';
import {
  SpeciesArtBroker,
  type Portrait440,
  type SpeciesArtProducerPort,
  type SpeciesArtProducerRequest,
  type SpeciesArtProducerSink,
  type Thumb132,
  type ThumbLease,
} from '../src/speciesbroker.js';

interface ProducerRecord {
  readonly sink: SpeciesArtProducerSink;
  readonly requests: SpeciesArtProducerRequest[];
  readonly disposals: string[];
}

function harness(deviceClass: 'phone' | 'desktop' = 'desktop') {
  let currentDeviceClass = deviceClass;
  const tasks: Array<() => void> = [];
  const producers: ProducerRecord[] = [];
  const broker = new SpeciesArtBroker({
    getDeviceClass: () => currentDeviceClass,
    scheduleTask: (task) => { tasks.push(task); },
    createProducer: (sink) => {
      const record: ProducerRecord = { sink, requests: [], disposals: [] };
      producers.push(record);
      const port: SpeciesArtProducerPort = {
        render: (request) => { record.requests.push(request); },
        dispose: (reason) => { record.disposals.push(reason); },
      };
      return port;
    },
  });
  const runTask = (): void => {
    const task = tasks.shift();
    if (!task) throw new Error('expected a scheduled broker task');
    task();
  };
  const setDeviceClass = (value: 'phone' | 'desktop'): void => {
    currentDeviceClass = value;
    broker.refreshDeviceClass();
  };
  return { broker, producers, tasks, runTask, setDeviceClass };
}

function genome(seed: number): Record<string, unknown> {
  return { seed, kingdom: 'fauna', parents: [seed - 1, seed + 1], form: seed % 7 };
}

function assetFor(request: SpeciesArtProducerRequest): Thumb132 | Portrait440 {
  const url = `data:image/png;base64,job-${request.jobId}-${request.kind}`;
  return request.kind === 'thumb132'
    ? Object.freeze({
      key: request.key,
      url,
      width: 132 as const,
      height: 132 as const,
      encodedBytes: new TextEncoder().encode(url).byteLength,
      decodedPixels: 132 * 132,
    })
    : Object.freeze({
      key: request.key,
      url,
      width: 440 as const,
      height: 440 as const,
      encodedBytes: new TextEncoder().encode(url).byteLength,
      decodedPixels: 440 * 440,
    });
}

function succeed(record: ProducerRecord, request: SpeciesArtProducerRequest): void {
  record.sink.result({
    status: 'success',
    jobId: request.jobId,
    kind: request.kind,
    key: request.key,
    asset: assetFor(request),
  });
}

async function thumbReady(lease: ThumbLease): Promise<Thumb132> {
  if (lease.current) return lease.current;
  return await new Promise((resolve, reject) => {
    const unsubscribe = lease.subscribe((asset, error) => {
      unsubscribe();
      if (asset) resolve(asset);
      else reject(error);
    });
  });
}

describe('SpeciesArtBroker producer ownership', () => {
  it('stays dormant until activation, deduplicates leases, and dispatches one producer job', async () => {
    const { broker, producers, tasks, runTask } = harness();
    const first = broker.leaseThumb(genome(101));
    const second = broker.leaseThumb(genome(101));
    expect(broker.diagnostics().live).toMatchObject({ queuedJobs: 1, thumbLeases: 2, activeJobs: 0 });
    expect(producers).toHaveLength(0);
    expect(tasks).toHaveLength(0);

    broker.activate();
    expect(tasks).toHaveLength(1);
    runTask();
    expect(producers).toHaveLength(1);
    expect(producers[0]!.requests).toHaveLength(1);
    expect(broker.diagnostics().live.activeJobs).toBe(1);
    const pending = thumbReady(second);
    first.release();
    const request = producers[0]!.requests[0]!;
    succeed(producers[0]!, request);
    const ready = await pending;
    expect(ready).toBe(second.current);
    expect(first.current).toBeNull();
    expect(broker.diagnostics()).toMatchObject({
      state: { producer: 'idle' },
      live: { activeJobs: 0, queuedJobs: 0, thumbCacheEntries: 1, thumbLeases: 1 },
      totals: {
        producerStarts: 1, producerDisposals: 1,
        jobStarts: 1, jobCompletes: 1, dedupeHits: 1,
      },
    });
    expect(producers[0]!.disposals).toEqual(['idle species-art queue']);
    second.release();
  });

  it('prioritizes an explicit portrait without starting concurrent work', () => {
    const { broker, producers, runTask, tasks } = harness();
    const thumb = broker.leaseThumb(genome(201));
    const portraitEvents: string[] = [];
    const portrait = broker.requestPortrait('detail', genome(202), (asset, error) => {
      portraitEvents.push(asset ? 'ready' : `error:${String(error)}`);
    });
    broker.activate();
    runTask();
    const first = producers[0]!.requests[0]!;
    expect(first.kind).toBe('portrait440');
    expect(broker.diagnostics().live).toMatchObject({ activeJobs: 1, queuedThumbJobs: 1 });
    succeed(producers[0]!, first);
    expect(portraitEvents).toEqual(['ready']);
    expect(portrait.current?.width).toBe(440);
    expect(broker.diagnostics().totals).toMatchObject({
      jobCompletes: 1, portraitJobCompletes: 1, thumbJobCompletes: 0,
    });
    expect(tasks).toHaveLength(1);
    runTask();
    expect(producers[0]!.requests[1]!.kind).toBe('thumb132');
    expect(broker.diagnostics().totals.maxActiveJobs).toBe(1);
    portrait.cancel();
    expect(broker.diagnostics().totals.portraitCancels).toBe(0);
    thumb.release();
  });

  it('cancels an unowned queued job and drops a released running result', () => {
    const { broker, producers, runTask } = harness();
    const queued = broker.leaseThumb(genome(301));
    queued.release();
    expect(broker.diagnostics()).toMatchObject({
      live: { queuedJobs: 0, thumbLeases: 0 },
      totals: { jobCancels: 1 },
    });

    const running = broker.leaseThumb(genome(302));
    broker.activate();
    runTask();
    const request = producers[0]!.requests[0]!;
    running.release();
    succeed(producers[0]!, request);
    expect(broker.diagnostics()).toMatchObject({
      live: { activeJobs: 0, thumbCacheEntries: 0, thumbLeases: 0 },
      totals: { droppedResults: 1 },
    });
  });

  it('routes per-job errors through the producer, releases it at idle, and permits an explicit retry', async () => {
    const { broker, producers, runTask } = harness();
    broker.activate();
    broker.failNextJobForTest('controlled paint failure');
    const failed = broker.leaseThumb(genome(401));
    const failure = new Promise<unknown>((resolve) => {
      failed.subscribe((asset, error) => {
        expect(asset).toBeNull();
        resolve(error);
      });
    });
    runTask();
    const injected = producers[0]!.requests[0]!;
    expect(injected.testFailureMessage).toBe('controlled paint failure');
    producers[0]!.sink.result({
      status: 'error', jobId: injected.jobId, kind: injected.kind, key: injected.key,
      error: new Error(injected.testFailureMessage),
    });
    await expect(failure).resolves.toMatchObject({ message: 'controlled paint failure' });
    expect(producers).toHaveLength(1);
    expect(producers[0]!.requests).toHaveLength(1);
    expect(producers[0]!.disposals).toEqual(['idle species-art queue']);
    expect(broker.diagnostics()).toMatchObject({
      state: { producer: 'idle' },
      totals: { producerStarts: 1, producerDisposals: 1, jobErrors: 1 },
    });
    failed.release();

    const retry = broker.leaseThumb(genome(401));
    runTask();
    expect(producers).toHaveLength(2);
    const request = producers[1]!.requests[0]!;
    const pending = thumbReady(retry);
    succeed(producers[1]!, request);
    await expect(pending).resolves.toMatchObject({ width: 132 });
    expect(broker.diagnostics()).toMatchObject({
      state: { producer: 'idle' },
      totals: {
        producerStarts: 2, producerDisposals: 2,
        jobErrors: 1, jobCompletes: 1,
      },
    });
    retry.release();
  });

  it('fails active and queued consumers on a producer fatal, then starts fresh only for new work', async () => {
    const { broker, producers, runTask } = harness();
    broker.activate();
    const active = broker.leaseThumb(genome(501));
    const queued = broker.leaseThumb(genome(502));
    const activeError = new Promise<unknown>((resolve) => active.subscribe((_asset, error) => resolve(error)));
    const queuedError = new Promise<unknown>((resolve) => queued.subscribe((_asset, error) => resolve(error)));
    runTask();
    producers[0]!.sink.fatal(new Error('worker crashed'));
    await expect(activeError).resolves.toMatchObject({ message: 'worker crashed' });
    await expect(queuedError).resolves.toMatchObject({ message: 'worker crashed' });
    expect(broker.diagnostics()).toMatchObject({
      state: { producer: 'idle' },
      live: { activeJobs: 0, queuedJobs: 0 },
      totals: { producerFatals: 1, jobErrors: 2 },
    });
    active.release();
    queued.release();

    const fresh = broker.leaseThumb(genome(503));
    runTask();
    expect(producers).toHaveLength(2);
    const request = producers[1]!.requests[0]!;
    const pending = thumbReady(fresh);
    succeed(producers[1]!, request);
    await pending;
    fresh.release();
  });

  it('revokes a producer for bfcache, ignores stale output, and requeues live ownership on resume', async () => {
    const { broker, producers, runTask, tasks } = harness();
    broker.activate();
    const lease = broker.leaseThumb(genome(601));
    runTask();
    const staleRequest = producers[0]!.requests[0]!;
    broker.suspendForBfcache();
    expect(producers[0]!.disposals).toEqual(['bfcache suspension']);
    expect(broker.diagnostics()).toMatchObject({
      state: { suspended: true, producer: 'idle' },
      live: { queuedJobs: 1, activeJobs: 0, thumbLeases: 1 },
      totals: { jobRequeues: 1 },
    });
    succeed(producers[0]!, staleRequest);
    expect(lease.current).toBeNull();
    broker.resumeFromBfcache();
    expect(tasks).toHaveLength(1);
    runTask();
    expect(producers).toHaveLength(2);
    const resumedRequest = producers[1]!.requests[0]!;
    expect(resumedRequest.key).toBe(staleRequest.key);
    expect(resumedRequest.jobId).not.toBe(staleRequest.jobId);
    const pending = thumbReady(lease);
    succeed(producers[1]!, resumedRequest);
    await pending;
    lease.release();
  });

  it('treats mismatched producer output as fatal protocol corruption', async () => {
    const { broker, producers, runTask } = harness();
    broker.activate();
    const lease = broker.leaseThumb(genome(701));
    const failure = new Promise<unknown>((resolve) => lease.subscribe((_asset, error) => resolve(error)));
    runTask();
    const request = producers[0]!.requests[0]!;
    producers[0]!.sink.result({
      status: 'success',
      ...request,
      jobId: request.jobId + 1,
      asset: assetFor(request),
    });
    await expect(failure).resolves.toMatchObject({
      message: 'species art producer result did not match the active job',
    });
    expect(broker.diagnostics().totals).toMatchObject({ protocolErrors: 1, producerFatals: 1 });
    lease.release();
  });

  it('enforces the phone lease/queue cap and fully tears down retained state', async () => {
    const { broker } = harness('phone');
    const leases = Array.from({ length: 97 }, (_, index) => broker.leaseThumb(genome(8000 + index)));
    const rejected = leases[96]!;
    const refusal = new Promise<unknown>((resolve) => rejected.subscribe((_asset, error) => resolve(error)));
    await expect(refusal).resolves.toMatchObject({ message: 'species thumbnail lease budget is exhausted' });
    expect(broker.diagnostics()).toMatchObject({
      limits: { thumbLeases: 96, queuedJobs: 96 },
      live: { thumbLeases: 96, queuedJobs: 96 },
    });
    for (const lease of leases) lease.release();
    broker.dispose('final pagehide');
    const final = broker.diagnostics();
    expect(final.state).toMatchObject({ disposed: true, activated: false, producer: 'idle' });
    expect(final.live).toMatchObject({
      thumbCacheEntries: 0,
      portraitCacheEntries: 0,
      queuedJobs: 0,
      activeJobs: 0,
      thumbLeases: 0,
      portraitRequests: 0,
    });
    expect(Object.isFrozen(final)).toBe(true);
    expect(Object.isFrozen(final.live)).toBe(true);
    expect(Object.isFrozen(final.keys.leasedThumbs)).toBe(true);
  });

  it('re-applies real device limits immediately when desktop narrows to phone', () => {
    const { broker, producers, runTask, setDeviceClass } = harness('desktop');
    for (let index = 0; index < 97; index++) {
      broker.requestPortrait(`detail-${index}`, genome(8500 + index), () => {});
    }
    broker.activate();
    for (let index = 0; index < 97; index++) {
      runTask();
      succeed(producers[0]!, producers[0]!.requests[index]!);
    }
    expect(broker.diagnostics()).toMatchObject({
      state: { deviceClass: 'desktop', producer: 'idle' },
      live: { portraitCacheEntries: 97, queuedJobs: 0 },
    });

    const queued = Array.from(
      { length: 97 }, (_, index) => broker.leaseThumb(genome(8700 + index)),
    );
    expect(broker.diagnostics().live.queuedJobs).toBe(97);
    setDeviceClass('phone');
    expect(broker.diagnostics()).toMatchObject({
      state: { deviceClass: 'phone' },
      limits: { portraitCacheEntries: 96, queuedJobs: 96 },
      live: { portraitCacheEntries: 96, queuedJobs: 96 },
      totals: { jobCancels: 1 },
    });

    /* NEGATIVE CONTROL: merely changing the source classification without
       refreshDeviceClass would leave both values at their desktop-era 97. */
    for (const lease of queued) lease.release();
    broker.dispose('device-change test complete');
  });

  it('detaches the producer request from post-acquisition genome mutation', () => {
    const { broker, producers, runTask } = harness();
    const mutableParents = [1, 2];
    const mutable: Record<string, unknown> = { ...genome(901), parents: mutableParents };
    const lease = broker.leaseThumb(mutable);
    const acquiredKey = lease.key;
    mutableParents.reverse();
    mutable.form = 99;
    broker.activate();
    runTask();
    expect(producers[0]!.requests[0]!.key).toBe(acquiredKey);
    expect(producers[0]!.requests[0]!.genome).toMatchObject({ parents: [1, 2], form: 5 });
    lease.release();

    /* NEGATIVE CONTROL: a producer reading the caller object later would see
       the mutation that the broker-owned snapshot deliberately excludes. */
    expect(mutable).toMatchObject({ parents: [2, 1], form: 99 });
  });

  it('contains listener exceptions instead of poisoning queue progression', () => {
    const { broker, producers, runTask, tasks } = harness();
    broker.activate();
    const first = broker.leaseThumb(genome(1001));
    const second = broker.leaseThumb(genome(1002));
    first.subscribe(() => { throw new Error('consumer bug'); });
    runTask();
    succeed(producers[0]!, producers[0]!.requests[0]!);
    expect(tasks).toHaveLength(1);
    runTask();
    expect(producers[0]!.requests).toHaveLength(2);
    first.release();
    second.release();
  });
});
