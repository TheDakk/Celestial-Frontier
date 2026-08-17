// @vitest-environment jsdom
/* Arc 1A art ownership tests. The fake 2D context records deterministic paint
   operations; browser gates remain responsible for real pixels/naturalWidth. */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGenome } from '@cf/domain-genome';

type SpeciesArt = typeof import('../src/speciesart.js');
type HdArt = typeof import('../src/hdart.verbatim.js');

let speciesArt: SpeciesArt;
let hdArt: HdArt;
let encodedDimensions: Array<readonly [number, number]> = [];
const traces = new WeakMap<HTMLCanvasElement, string[]>();
const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();

function traceHash(parts: readonly string[]): string {
  let hash = 0x811c9dc5;
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      hash ^= part.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, '0');
}
function argToken(value: unknown): string {
  if (value instanceof HTMLCanvasElement) {
    return `canvas:${value.width}x${value.height}:${traceHash(traces.get(value) ?? [])}`;
  }
  if (ArrayBuffer.isView(value)) return `${value.constructor.name}:${value.byteLength}`;
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'string' || typeof value === 'boolean' || value == null) return String(value);
  return Object.prototype.toString.call(value);
}
function fakeContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const hit = contexts.get(canvas);
  if (hit) return hit;
  const trace: string[] = [];
  traces.set(canvas, trace);
  const fields: Record<PropertyKey, unknown> = { canvas, globalAlpha: 1, lineWidth: 1 };
  const method = (name: string) => (...args: unknown[]): unknown => {
    trace.push(`${name}(${args.map(argToken).join(',')})`);
    if (name === 'createLinearGradient' || name === 'createRadialGradient') {
      return { addColorStop: (...stops: unknown[]) => trace.push(`gradient(${stops.map(argToken).join(',')})`) };
    }
    if (name === 'measureText') return { width: String(args[0] ?? '').length * 8 };
    if (name === 'getImageData' || name === 'createImageData') {
      const width = Math.max(0, Number(args[name === 'getImageData' ? 2 : 0]) || 0);
      const height = Math.max(0, Number(args[name === 'getImageData' ? 3 : 1]) || 0);
      return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    }
    if (name === 'getLineDash') return [];
    if (name === 'getTransform') return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    if (name === 'isPointInPath' || name === 'isPointInStroke') return false;
    return undefined;
  };
  const proxy = new Proxy(fields, {
    get(target, property) {
      if (Reflect.has(target, property)) return Reflect.get(target, property);
      if (typeof property !== 'string') return undefined;
      const fn = method(property);
      Reflect.set(target, property, fn);
      return fn;
    },
    set(target, property, value) {
      trace.push(`${String(property)}=${argToken(value)}`);
      return Reflect.set(target, property, value);
    },
  }) as unknown as CanvasRenderingContext2D;
  contexts.set(canvas, proxy);
  return proxy;
}

function genome(seed: number, kingdom = 'fauna'): Record<string, unknown> {
  return {
    ...(makeGenome(seed, kingdom, 0) as unknown as Record<string, unknown>),
    /* A non-reviewed fauna blend forces the compatibility HD route without
       changing any genome fields that the painter consumes. */
    ...(kingdom === 'fauna' ? { _earthBlend: 'Arc 1A compatibility control' } : {}),
  };
}

async function ready(lease: import('../src/speciesart.js').ThumbLease): Promise<import('../src/speciesart.js').Thumb132> {
  if (lease.current) return lease.current;
  return await new Promise((resolve, reject) => {
    const unsubscribe = lease.subscribe((asset, error) => {
      unsubscribe();
      if (asset) resolve(asset);
      else reject(error);
    });
  });
}

beforeAll(async () => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value(this: HTMLCanvasElement, kind: string) {
      return kind === '2d' ? fakeContext(this) : null;
    },
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    configurable: true,
    value(this: HTMLCanvasElement) {
      encodedDimensions.push([this.width, this.height]);
      const hash = traceHash(traces.get(this) ?? []);
      return `data:image/png;width=${this.width};height=${this.height};base64,${hash.padEnd(40, '0')}`;
    },
  });
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: false,
      media: '(max-width: 700px)',
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    }),
  });
  hdArt = await import('../src/hdart.verbatim.js');
  speciesArt = await import('../src/speciesart.js');
});

beforeEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  speciesArt.__setSpeciesArtDeviceClassForTest('desktop');
  encodedDimensions = [];
});

describe.sequential('SpeciesArt canvas seam and thumbnail ownership', () => {
  it('keeps complete canonical identity and separates reversed parents with the same seed', () => {
    const base = genome(91);
    const ab = { ...base, seed: 0xCAFE, parents: [11, 22] };
    const ba = { ...base, seed: 0xCAFE, parents: [22, 11] };
    expect(speciesArt.speciesVisualKey(ab)).not.toBe(speciesArt.speciesVisualKey(ba));

    const reordered = Object.fromEntries(Object.entries(ab).reverse());
    expect(speciesArt.speciesVisualKey(reordered)).toBe(speciesArt.speciesVisualKey(ab));

    /* NEGATIVE CONTROL: the old bare-seed key collides on the reported case. */
    const buggedKey = (g: Record<string, unknown>) => String(g.seed);
    expect(buggedKey(ab)).toBe(buggedKey(ba));
  });

  it('keeps all four 440 URL wrappers identical to their generated canvas painter', () => {
    const cases = [
      [hdArt.hdPortraitFauna, hdArt.hdPortraitFaunaCanvas, genome(101, 'fauna')],
      [hdArt.hdPortraitFlora, hdArt.hdPortraitFloraCanvas, genome(102, 'flora')],
      [hdArt.hdPortraitFungi, hdArt.hdPortraitFungiCanvas, genome(103, 'fungi')],
      [hdArt.hdPortraitMicrobe, hdArt.hdPortraitMicrobeCanvas, genome(104, 'microbe')],
    ] as const;
    for (const [urlPainter, canvasPainter, g] of cases) {
      const expected = urlPainter(g);
      const canvas = canvasPainter(g);
      expect([canvas.width, canvas.height]).toEqual([440, 440]);
      expect(canvas.toDataURL()).toBe(expected);
    }

    /* NEGATIVE CONTROL: the transcript URL distinguishes a wrong dimension. */
    const wrong = document.createElement('canvas');
    wrong.width = wrong.height = 439;
    expect(wrong.toDataURL()).not.toBe(cases[0][0](cases[0][2]));
  });

  it('deduplicates queued producers and cancels only after the final release', () => {
    const before = speciesArt.speciesArtDiagnostics();
    const first = speciesArt.leaseThumb(genome(201));
    const second = speciesArt.leaseThumb(genome(201));
    const live = speciesArt.speciesArtDiagnostics();
    expect(live.live.queuedJobs).toBe(1);
    expect(live.live.leases).toBe(2);
    expect(live.keys.queued).toEqual([first.key]);
    expect(live.totals.dedupeHits - before.totals.dedupeHits).toBe(1);

    /* NEGATIVE CONTROL: an unreleased row is visible as a live lease. */
    expect(live.live.leases).toBeGreaterThan(0);
    first.release();
    expect(speciesArt.speciesArtDiagnostics().live.queuedJobs).toBe(1);
    second.release();
    const after = speciesArt.speciesArtDiagnostics();
    expect(after.live.queuedJobs).toBe(0);
    expect(after.live.leases).toBe(0);
    expect(after.totals.jobCancels - before.totals.jobCancels).toBe(1);
  });

  it('produces an actual 132 asset without a 440 encode/decode or full-cache write', async () => {
    const before = speciesArt.speciesArtDiagnostics();
    const g = genome(301);
    const lease = speciesArt.leaseThumb(g);
    const peer = speciesArt.leaseThumb(g);
    expect(lease.current).toBeNull();
    expect(peer.current).toBeNull();
    const [asset, peerAsset] = await Promise.all([ready(lease), ready(peer)]);
    expect(peerAsset).toBe(asset);
    expect(lease.current).toBe(asset);
    expect([asset.width, asset.height, asset.decodedPixels]).toEqual([132, 132, 132 * 132]);
    expect(asset.encodedBytes).toBe(new TextEncoder().encode(asset.url).byteLength);
    expect(Object.isFrozen(asset)).toBe(true);
    expect(encodedDimensions).toEqual([[132, 132]]);

    const after = speciesArt.speciesArtDiagnostics();
    expect(after.live.portraitCacheEntries).toBe(0);
    expect(after.live.portraitEncodedBytes).toBe(0);
    expect(after.totals.fullPortraitRendersForThumb - before.totals.fullPortraitRendersForThumb).toBe(0);
    expect(after.totals.fullPortraitDecodesForThumb - before.totals.fullPortraitDecodesForThumb).toBe(0);
    expect(after.totals.thumbCanvasRenders - before.totals.thumbCanvasRenders).toBe(1);
    expect(after.totals.jobStarts - before.totals.jobStarts).toBe(1);
    expect(after.totals.jobCompletes - before.totals.jobCompletes).toBe(1);
    expect(Object.isFrozen(after)).toBe(true);
    expect(Object.isFrozen(after.live)).toBe(true);
    expect(Object.isFrozen(after.keys.cached)).toBe(true);

    const releases = after.totals.releases;
    lease.release();
    peer.release();
    lease.release();  // idempotent
    expect(lease.current).toBeNull();
    expect(peer.current).toBeNull();
    expect(speciesArt.speciesArtDiagnostics().totals.releases - releases).toBe(2);
    const warm = speciesArt.leaseThumb(g);
    expect(warm.current).toBe(asset);
    warm.release();

    /* If leaseThumb had polluted the 440 cache, this compatibility request
       would not perform its first and only 440 encode. */
    expect(speciesArt.speciesPortrait(g)).toContain('width=440;height=440');
    expect(encodedDimensions.filter(([width]) => width === 440)).toHaveLength(1);
  });

  it('settles producer errors, leaves no poison, and recovers on retry', async () => {
    const before = speciesArt.speciesArtDiagnostics();
    const g = genome(401);
    speciesArt.__failNextThumbJobForTest('Arc 1A injected failure');
    const failed = speciesArt.leaseThumb(g);
    const error = await new Promise<unknown>((resolve) => {
      failed.subscribe((asset, thrown) => {
        expect(asset).toBeNull();
        resolve(thrown);
      });
    });
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Arc 1A injected failure');
    expect(failed.current).toBeNull();
    const settled = speciesArt.speciesArtDiagnostics();
    expect(settled.live.queuedJobs).toBe(0);
    expect(settled.live.activeJobs).toBe(0);
    expect(settled.keys.cached).not.toContain(failed.key);
    expect(settled.totals.jobErrors - before.totals.jobErrors).toBe(1);
    failed.release();

    const retry = speciesArt.leaseThumb(g);
    expect(await ready(retry)).not.toBeNull();
    retry.release();
  });

  it('renders queued work from its detached acquisition snapshot', async () => {
    vi.useFakeTimers();
    try {
      const original = genome(451, 'fungi');
      /* The painter accepts numeric-like gene values. Keeping this one in a
         mutable array makes the queued render exercise recursive detachment,
         not merely the already-synchronous visual-key calculation. */
      original.color = [2];
      original.lumin = false;
      const referenceLease = speciesArt.leaseThumb({ ...original });
      await vi.runAllTimersAsync();
      const reference = await ready(referenceLease);
      referenceLease.release();

      /* Remove the warm resource so this leg must execute a later queued
         producer rather than merely returning the reference cache hit. */
      window.dispatchEvent(new Event('pagehide'));
      const mutableColor = [...(original.color as unknown[])];
      let postAcquireColorReads = 0;
      const observedColor = new Proxy(mutableColor, {
        get(target, property, receiver) {
          postAcquireColorReads++;
          return Reflect.get(target, property, receiver);
        },
      });
      const mutable: Record<string, unknown> = { ...original, color: observedColor };
      const queued = speciesArt.leaseThumb(mutable);
      const acquiredKey = queued.key;
      mutableColor[0] = 7;
      mutable.lumin = true;
      postAcquireColorReads = 0;
      await vi.runAllTimersAsync();
      const acquired = await ready(queued);
      expect(acquired.key).toBe(acquiredKey);
      expect(acquired.url).toBe(reference.url);
      expect(postAcquireColorReads).toBe(0);
      queued.release();

      window.dispatchEvent(new Event('pagehide'));
      const changedLease = speciesArt.leaseThumb(mutable);
      await vi.runAllTimersAsync();
      const changed = await ready(changedLease);
      expect(changed.key).not.toBe(acquiredKey);
      expect(changed.url).not.toBe(reference.url);
      changedLease.release();
    } finally {
      vi.useRealTimers();
    }
  });

  it('refuses the 97th phone lease without admitting another job', async () => {
    vi.useFakeTimers();
    try {
      speciesArt.__setSpeciesArtDeviceClassForTest('phone');
      const leases = Array.from({ length: 97 }, (_, index) =>
        speciesArt.leaseThumb(genome(4500 + index)));
      const rejected = leases[96]!;
      const capped = speciesArt.speciesArtDiagnostics();
      expect(capped.limits.leases).toBe(96);
      expect(capped.limits.queuedJobs).toBe(96);
      expect(capped.live.leases).toBe(96);
      expect(capped.live.queuedJobs).toBe(96);
      expect(capped.keys.leased).not.toContain(rejected.key);
      expect(capped.keys.queued).not.toContain(rejected.key);
      expect(rejected.current).toBeNull();

      const refusal = new Promise<unknown>((resolve) => {
        rejected.subscribe((asset, error) => {
          expect(asset).toBeNull();
          resolve(error);
        });
      });
      for (const lease of leases.slice(0, 96)) lease.release();
      const released = speciesArt.speciesArtDiagnostics();
      expect(released.live.leases).toBe(0);
      expect(released.live.queuedJobs).toBe(0);
      await vi.runAllTimersAsync();
      const error = await refusal;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('species thumbnail lease budget is exhausted');
      rejected.release();
      expect(speciesArt.speciesArtDiagnostics().live.activeJobs).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('trims a warm desktop cache immediately when the phone candidate cap applies', async () => {
    vi.useFakeTimers();
    try {
      speciesArt.__setSpeciesArtDeviceClassForTest('desktop');
      const leases = Array.from({ length: 97 }, (_, index) => speciesArt.leaseThumb(genome(5000 + index)));
      const queued = speciesArt.speciesArtDiagnostics();
      expect(queued.live.queuedJobs).toBe(97);
      expect(queued.totals.maxQueuedJobs).toBe(97);
      await vi.runAllTimersAsync();
      expect(leases.every((lease) => lease.current?.width === 132)).toBe(true);
      const warm = speciesArt.speciesArtDiagnostics();
      expect(warm.live.cacheEntries).toBe(97);
      expect(warm.live.queuedJobs).toBe(0);
      expect(warm.live.activeJobs).toBe(0);
      expect(warm.totals.maxQueuedJobs).toBe(97);
      expect(warm.totals.maxActiveJobs).toBe(1);
      for (const lease of leases) lease.release();

      const disposals = speciesArt.speciesArtDiagnostics().totals.disposals;
      speciesArt.__setSpeciesArtDeviceClassForTest('phone');
      const phone = speciesArt.speciesArtDiagnostics();
      expect(phone.limits.budgetStatus).toBe('provisional-candidate');
      expect(phone.live.cacheEntries).toBe(phone.limits.cacheEntries);
      expect(phone.live.decodedPixels).toBeLessThanOrEqual(phone.limits.decodedPixels);
      expect(phone.live.decodedBytes).toBeLessThanOrEqual(phone.limits.decodedBytes);
      expect(phone.live.encodedBytes).toBeLessThanOrEqual(phone.limits.encodedBytes);
      expect(phone.totals.maxQueuedJobs).toBe(97);
      expect(phone.totals.maxActiveJobs).toBe(1);
      expect(phone.totals.disposals - disposals).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('retains speciesThumb miss compatibility: the immediate result is the 440 URL', () => {
    const g = genome(601);
    const immediate = speciesArt.speciesThumb(g);
    expect(immediate).toContain('width=440;height=440');
    expect(speciesArt.speciesPortrait(g)).toBe(immediate);
  });

  it('keeps live ownership across bfcache and releases it on final pagehide', async () => {
    const lease = speciesArt.leaseThumb(genome(701));
    const asset = await ready(lease);
    const before = speciesArt.speciesArtDiagnostics();
    expect(before.live.leases).toBe(1);
    expect(before.live.cacheEntries).toBe(1);

    const persisted = new Event('pagehide');
    Object.defineProperty(persisted, 'persisted', { value: true });
    window.dispatchEvent(persisted);
    const suspended = speciesArt.speciesArtDiagnostics();
    expect(suspended.live.leases).toBe(before.live.leases);
    expect(suspended.live.cacheEntries).toBe(before.live.cacheEntries);
    expect(suspended.totals.releases).toBe(before.totals.releases);
    expect(lease.current).toBe(asset);

    /* NEGATIVE CONTROL: a genuine final document teardown must not retain
       the same lease/cache merely because persisted pagehide was ignored. */
    window.dispatchEvent(new Event('pagehide'));
    const tornDown = speciesArt.speciesArtDiagnostics();
    expect(tornDown.live.leases).toBe(0);
    expect(tornDown.live.cacheEntries).toBe(0);
    expect(lease.current).toBeNull();
  });
});
