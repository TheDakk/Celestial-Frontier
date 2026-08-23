import { describe, expect, it } from 'vitest';
import {
  SurfacePlanetTextureAttachment,
  type SurfacePlanetTextureLease,
  type SurfacePlanetTextureScheduler,
  type SurfacePlanetTextureTarget,
} from '../apps/game/src/planet-texture-attachment.js';
import type { SurfacePlanetTextureIdentity } from '../apps/game/src/planet-texture-demand.js';

type FakeTexture = Readonly<{ id: string; width: number; height: number }>;
type FakeResource = Readonly<{ demandPx: number }>;

const fakeTexture = (id: string, width: number, height = width): FakeTexture =>
  Object.freeze({ id, width, height });

class FakeLease implements SurfacePlanetTextureLease<FakeTexture> {
  releaseCalls = 0;
  failuresRemaining = 0;
  private released = false;

  constructor(readonly texture: FakeTexture) {}

  release(): boolean {
    this.releaseCalls++;
    if (this.failuresRemaining > 0) {
      this.failuresRemaining--;
      throw new Error(`injected release failure: ${this.texture.id}`);
    }
    if (this.released) return false;
    this.released = true;
    return true;
  }
}

class FakeTarget implements SurfacePlanetTextureTarget<FakeTexture> {
  private currentTexture: FakeTexture;
  private currentWidth = 420;
  private currentHeight = 420;
  textureWrites = 0;
  sizeWrites = 0;
  failTextureIdOnce: string | null = null;

  constructor(texture: FakeTexture) {
    this.currentTexture = texture;
  }

  get texture(): FakeTexture { return this.currentTexture; }
  set texture(texture: FakeTexture) {
    this.textureWrites++;
    this.currentTexture = texture;
    if (this.failTextureIdOnce === texture.id) {
      this.failTextureIdOnce = null;
      throw new Error(`injected publication failure: ${texture.id}`);
    }
  }

  get width(): number { return this.currentWidth; }
  set width(width: number) { this.sizeWrites++; this.currentWidth = width; }
  get height(): number { return this.currentHeight; }
  set height(height: number) { this.sizeWrites++; this.currentHeight = height; }
}

class FakeScheduler implements SurfacePlanetTextureScheduler<number> {
  private nextHandle = 0;
  readonly jobs = new Map<number, () => void>();
  cancelCalls = 0;

  schedule(callback: () => void): number {
    const handle = ++this.nextHandle;
    this.jobs.set(handle, callback);
    return handle;
  }

  cancel(handle: number): void {
    this.cancelCalls++;
    this.jobs.delete(handle);
  }

  runNext(): void {
    const entry = this.jobs.entries().next().value as [number, () => void] | undefined;
    if (!entry) throw new Error('no scheduled surface refresh');
    this.jobs.delete(entry[0]);
    entry[1]();
  }

  runAll(): void {
    while (this.jobs.size > 0) this.runNext();
  }
}

const IDENTITY: SurfacePlanetTextureIdentity = Object.freeze({
  generation: 4,
  planetSeed: 133,
  planetOrdinal: 3,
});

class Fixture {
  readonly initialTexture: FakeTexture = fakeTexture('initial', 512);
  readonly initialLease = new FakeLease(this.initialTexture);
  readonly target = new FakeTarget(this.initialTexture);
  readonly scheduler = new FakeScheduler();
  readonly successorLeases: FakeLease[] = [];
  currentIdentity: SurfacePlanetTextureIdentity | null = IDENTITY;
  resourceCalls = 0;
  acquireCalls = 0;
  acquireFailuresRemaining = 0;
  compactCalls = 0;
  onResource: (() => void) | null = null;

  addSuccessor(id: string, texture = fakeTexture(id, 768)): FakeLease {
    const lease = new FakeLease(texture);
    this.successorLeases.push(lease);
    return lease;
  }

  make(): SurfacePlanetTextureAttachment<FakeResource, FakeTexture, number> {
    return new SurfacePlanetTextureAttachment({
      identity: IDENTITY,
      target: this.target,
      initialLease: this.initialLease,
      diameterCssPx: 420,
      currentIdentity: () => this.currentIdentity,
      resourceForDemand: (demandPx) => {
        this.resourceCalls++;
        this.onResource?.();
        return { demandPx };
      },
      acquireLease: () => {
        this.acquireCalls++;
        if (this.acquireFailuresRemaining > 0) {
          this.acquireFailuresRemaining--;
          throw new Error('injected successor acquisition failure');
        }
        const lease = this.successorLeases.shift();
        if (!lease) throw new Error('fixture has no successor lease');
        return lease;
      },
      textureBackingSize: (texture) => ({ width: texture.width, height: texture.height }),
      compact: () => { this.compactCalls++; },
      refreshDelayMs: 31,
      scheduler: this.scheduler,
    });
  }
}

describe('surface planet texture attachment', () => {
  it('retains the predecessor until a current successor is atomically published', () => {
    const fixture = new Fixture();
    const successor = fixture.addSuccessor('hd-768');
    const attachment = fixture.make();

    expect(attachment.requestDemand(700)).toBe(true);
    expect(fixture.resourceCalls).toBe(1);
    expect(fixture.acquireCalls).toBe(0);
    expect(fixture.target.texture).toBe(fixture.initialTexture);
    expect(fixture.initialLease.releaseCalls).toBe(0);
    expect(attachment.snapshot()).toMatchObject({
      currentTierPx: 512,
      currentBackingWidth: 512,
      currentBackingHeight: 512,
      requestedTierPx: 768,
      pendingDemandPx: 700,
    });

    fixture.scheduler.runNext();
    expect(fixture.resourceCalls).toBe(2);
    expect(fixture.target.texture).toBe(successor.texture);
    expect(fixture.target.width).toBe(420);
    expect(fixture.target.height).toBe(420);
    expect(fixture.initialLease.releaseCalls).toBe(1);
    expect(successor.releaseCalls).toBe(0);
    expect(attachment.snapshot()).toMatchObject({
      currentTierPx: 768,
      currentBackingWidth: 768,
      currentBackingHeight: 768,
      requestedTierPx: null,
      retiredLeaseCount: 0,
    });
  });

  it('keeps a failed successor acquisition retryable without an automatic retry', () => {
    const fixture = new Fixture();
    const successor = fixture.addSuccessor('hd-768');
    fixture.acquireFailuresRemaining = 1;
    const attachment = fixture.make();

    expect(attachment.requestDemand(700)).toBe(true);
    expect(() => fixture.scheduler.runNext()).toThrow('successor acquisition failure');
    expect(fixture.scheduler.jobs.size).toBe(0);
    expect(fixture.target.texture).toBe(fixture.initialTexture);
    expect(fixture.initialLease.releaseCalls).toBe(0);
    expect(attachment.snapshot()).toMatchObject({
      currentTierPx: 512,
      requestedTierPx: null,
    });

    expect(attachment.requestDemand(700)).toBe(true);
    fixture.scheduler.runNext();
    expect(fixture.target.texture).toBe(successor.texture);
    expect(fixture.acquireCalls).toBe(2);
    expect(attachment.snapshot().currentTierPx).toBe(768);
  });

  it('rolls back a failed publication, releases its successor, and retries the same tier', () => {
    const fixture = new Fixture();
    const failedSuccessor = fixture.addSuccessor('hd-fails');
    const retrySuccessor = fixture.addSuccessor('hd-retry');
    fixture.target.failTextureIdOnce = failedSuccessor.texture.id;
    const attachment = fixture.make();

    expect(attachment.requestDemand(700)).toBe(true);
    expect(() => fixture.scheduler.runNext()).toThrow('publication failure');
    expect(fixture.target.texture).toBe(fixture.initialTexture);
    expect(fixture.target.width).toBe(420);
    expect(fixture.target.height).toBe(420);
    expect(failedSuccessor.releaseCalls).toBe(1);
    expect(fixture.initialLease.releaseCalls).toBe(0);
    expect(attachment.snapshot()).toMatchObject({
      currentTierPx: 512,
      requestedTierPx: null,
      retiredLeaseCount: 0,
    });

    expect(attachment.requestDemand(700)).toBe(true);
    fixture.scheduler.runNext();
    expect(fixture.target.texture).toBe(retrySuccessor.texture);
    expect(fixture.initialLease.releaseCalls).toBe(1);
    expect(attachment.snapshot().currentTierPx).toBe(768);
  });

  it('does not claim an HD tier for an undersized same-texture result and remains retryable', () => {
    const fixture = new Fixture();
    const successor = fixture.addSuccessor('same', fixture.initialTexture);
    const published = fixture.addSuccessor('hd-768');
    const attachment = fixture.make();

    expect(attachment.requestDemand(700)).toBe(true);
    fixture.scheduler.runNext();

    expect(fixture.target.texture).toBe(fixture.initialTexture);
    expect(fixture.target.textureWrites).toBe(0);
    expect(fixture.target.sizeWrites).toBe(0);
    expect(fixture.initialLease.releaseCalls).toBe(0);
    expect(successor.releaseCalls).toBe(1);
    expect(attachment.snapshot()).toMatchObject({
      currentTierPx: 512,
      currentBackingWidth: 512,
      currentBackingHeight: 512,
      requestedTierPx: null,
    });

    expect(attachment.requestDemand(700)).toBe(true);
    fixture.scheduler.runNext();
    expect(fixture.target.texture).toBe(published.texture);
    expect(attachment.snapshot()).toMatchObject({
      currentTierPx: 768,
      currentBackingWidth: 768,
      currentBackingHeight: 768,
    });
  });

  it('rejects a completion that becomes stale while resolving and permits a later request', () => {
    const fixture = new Fixture();
    const successor = fixture.addSuccessor('hd-768');
    fixture.onResource = () => {
      if (fixture.resourceCalls === 2) {
        fixture.currentIdentity = { ...IDENTITY, planetOrdinal: 4 };
      }
    };
    const attachment = fixture.make();

    expect(attachment.requestDemand(700)).toBe(true);
    fixture.scheduler.runNext();
    expect(fixture.acquireCalls).toBe(0);
    expect(fixture.target.texture).toBe(fixture.initialTexture);
    expect(fixture.initialLease.releaseCalls).toBe(0);
    expect(attachment.snapshot()).toMatchObject({
      currentTierPx: 512,
      requestedTierPx: null,
    });

    fixture.currentIdentity = IDENTITY;
    expect(attachment.requestDemand(700)).toBe(true);
    fixture.scheduler.runNext();
    expect(fixture.acquireCalls).toBe(1);
    expect(fixture.target.texture).toBe(successor.texture);
  });

  it('cancels scheduled reads separately and disposes its lease exactly once', () => {
    const fixture = new Fixture();
    const attachment = fixture.make();

    expect(attachment.requestDemand(700)).toBe(true);
    expect(attachment.cancelPending()).toBe(true);
    expect(attachment.cancelPending()).toBe(false);
    expect(fixture.scheduler.jobs.size).toBe(0);

    expect(attachment.scheduleRefresh(609)).toBe(true);
    expect(fixture.scheduler.jobs.size).toBe(1);
    expect(attachment.dispose()).toBe(true);
    expect(fixture.scheduler.cancelCalls).toBe(2);
    expect(fixture.scheduler.jobs.size).toBe(0);
    expect(fixture.initialLease.releaseCalls).toBe(1);
    expect(attachment.dispose()).toBe(false);
    expect(fixture.initialLease.releaseCalls).toBe(1);
    expect(attachment.requestDemand(700)).toBe(false);
    fixture.scheduler.runAll();
    expect(fixture.acquireCalls).toBe(0);
  });

  it('retains a failed disposal lease for an explicit idempotent retry', () => {
    const fixture = new Fixture();
    fixture.initialLease.failuresRemaining = 1;
    const attachment = fixture.make();

    expect(() => attachment.dispose()).toThrow(
      'surface planet texture attachment failed to dispose',
    );
    expect(attachment.snapshot()).toMatchObject({ disposed: true, leaseOwned: true });
    expect(fixture.initialLease.releaseCalls).toBe(1);

    expect(attachment.dispose()).toBe(true);
    expect(fixture.initialLease.releaseCalls).toBe(2);
    expect(attachment.snapshot()).toMatchObject({ disposed: true, leaseOwned: false });
    expect(attachment.dispose()).toBe(false);
  });

  it('commits a successor before retiring a failed predecessor and retries cleanup explicitly', () => {
    const fixture = new Fixture();
    const successor = fixture.addSuccessor('hd-768');
    fixture.initialLease.failuresRemaining = 1;
    const attachment = fixture.make();

    expect(attachment.requestDemand(700)).toBe(true);
    expect(() => fixture.scheduler.runNext()).toThrow('injected release failure: initial');
    expect(fixture.target.texture).toBe(successor.texture);
    expect(attachment.snapshot()).toMatchObject({
      currentTierPx: 768,
      retiredLeaseCount: 1,
    });

    // No second render is needed: the next ordinary request first retries the
    // retired predecessor, then observes that the requested tier is current.
    expect(attachment.requestDemand(700)).toBe(false);
    expect(fixture.initialLease.releaseCalls).toBe(2);
    expect(attachment.snapshot().retiredLeaseCount).toBe(0);
    expect(fixture.acquireCalls).toBe(1);
  });
});
