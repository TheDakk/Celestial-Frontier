import {
  nextPlanetTextureTierPx,
  planetTextureTierForBackingPx,
  planetTextureTierForDemandPx,
  sameSurfacePlanetTextureIdentity,
  type PlanetTextureTierPx,
  type SurfacePlanetTextureIdentity,
} from './planet-texture-demand.js';

export const SURFACE_PLANET_TEXTURE_REFRESH_MS = 31;

/** The narrow mutable surface used by the owner; Pixi is deliberately absent. */
export interface SurfacePlanetTextureTarget<Texture> {
  texture: Texture;
  width: number;
  height: number;
}

/** SceneTextureLease is structurally compatible without coupling this owner to Pixi. */
export interface SurfacePlanetTextureLease<Texture> {
  readonly texture: Texture;
  release(): boolean;
}

export interface SurfacePlanetTextureScheduler<TimerHandle> {
  schedule(callback: () => void, delayMs: number): TimerHandle;
  cancel(handle: TimerHandle): void;
}

export interface SurfacePlanetTextureAttachmentOptions<
  Resource,
  Texture,
  TimerHandle,
> {
  readonly identity: SurfacePlanetTextureIdentity;
  readonly target: SurfacePlanetTextureTarget<Texture>;
  readonly initialLease: SurfacePlanetTextureLease<Texture>;
  readonly diameterCssPx: number;
  /**
   * The first call starts/observes the deterministic painter's requested tier;
   * the scheduled second call reads its completed resource.
   */
  readonly resourceForDemand: (demandPx: number) => Resource;
  readonly acquireLease: (resource: Resource) => SurfacePlanetTextureLease<Texture>;
  readonly textureBackingSize: (texture: Texture) => Readonly<{ width: number; height: number }>;
  readonly currentIdentity: () => SurfacePlanetTextureIdentity | null;
  readonly compact?: () => void;
  readonly refreshDelayMs?: number;
  readonly scheduler?: SurfacePlanetTextureScheduler<TimerHandle>;
}

export interface SurfacePlanetTextureAttachmentSnapshot {
  readonly identity: SurfacePlanetTextureIdentity;
  readonly disposed: boolean;
  readonly leaseOwned: boolean;
  readonly currentTierPx: PlanetTextureTierPx | 0;
  readonly currentBackingWidth: number;
  readonly currentBackingHeight: number;
  readonly requestedTierPx: PlanetTextureTierPx | null;
  readonly pendingDemandPx: number | null;
  readonly retiredLeaseCount: number;
}

type PendingRefresh<TimerHandle> = {
  readonly token: number;
  readonly demandPx: number;
  readonly tierPx: PlanetTextureTierPx;
  readonly handle: TimerHandle;
};

const browserScheduler: SurfacePlanetTextureScheduler<ReturnType<typeof setTimeout>> = {
  schedule: (callback, delayMs) => setTimeout(callback, delayMs),
  cancel: (handle) => clearTimeout(handle),
};

function combinedError(primary: unknown, cleanup: readonly unknown[], message: string): unknown {
  return cleanup.length === 0
    ? primary
    : new AggregateError([primary, ...cleanup], message);
}

/**
 * Owns one displayed surface planet's HD texture attachment.
 *
 * A demand request primes the existing deterministic painter immediately and
 * reads it again after the painter's delay. Publication is transactional: the
 * displayed predecessor remains leased until the successor has been acquired,
 * identity-checked, and attached. Failed attempts leave the published tier
 * unchanged, so an equal demand can be requested again; the owner never retries
 * by itself.
 *
 * Call cancelPending() before destroying the display tree, then dispose() after
 * that tree no longer references the texture. This preserves the scene rule
 * that display objects are destroyed before their final TextureSource.
 */
export class SurfacePlanetTextureAttachment<
  Resource,
  Texture,
  TimerHandle = ReturnType<typeof setTimeout>,
> {
  readonly identity: SurfacePlanetTextureIdentity;

  private readonly target: SurfacePlanetTextureTarget<Texture>;
  private readonly diameterCssPx: number;
  private readonly resourceForDemand: (demandPx: number) => Resource;
  private readonly acquireLease: (
    resource: Resource,
  ) => SurfacePlanetTextureLease<Texture>;
  private readonly textureBackingSize: (
    texture: Texture,
  ) => Readonly<{ width: number; height: number }>;
  private readonly currentIdentity: () => SurfacePlanetTextureIdentity | null;
  private readonly compact: () => void;
  private readonly refreshDelayMs: number;
  private readonly scheduler: SurfacePlanetTextureScheduler<TimerHandle>;

  private lease: SurfacePlanetTextureLease<Texture> | null;
  private tierPx: PlanetTextureTierPx | 0;
  private backingWidth: number;
  private backingHeight: number;
  private pending: PendingRefresh<TimerHandle> | null = null;
  private nextToken = 0;
  private disposed = false;
  private readonly retiredLeases = new Set<SurfacePlanetTextureLease<Texture>>();

  constructor(options: SurfacePlanetTextureAttachmentOptions<Resource, Texture, TimerHandle>) {
    if (!Number.isFinite(options.diameterCssPx) || options.diameterCssPx <= 0) {
      throw new RangeError('surface planet texture diameter must be finite and positive');
    }
    const refreshDelayMs = options.refreshDelayMs ?? SURFACE_PLANET_TEXTURE_REFRESH_MS;
    if (!Number.isFinite(refreshDelayMs) || refreshDelayMs < 0) {
      throw new RangeError('surface planet texture refresh delay must be finite and nonnegative');
    }
    if (!Object.is(options.target.texture, options.initialLease.texture)) {
      throw new Error('surface planet texture target does not hold its initial lease');
    }

    this.identity = Object.freeze({ ...options.identity });
    this.target = options.target;
    this.lease = options.initialLease;
    this.textureBackingSize = options.textureBackingSize;
    const initialBacking = this.readBacking(options.initialLease.texture);
    this.backingWidth = initialBacking.width;
    this.backingHeight = initialBacking.height;
    this.tierPx = planetTextureTierForBackingPx(initialBacking.width, initialBacking.height);
    this.diameterCssPx = options.diameterCssPx;
    this.resourceForDemand = options.resourceForDemand;
    this.acquireLease = options.acquireLease;
    this.currentIdentity = options.currentIdentity;
    this.compact = options.compact ?? (() => undefined);
    this.refreshDelayMs = refreshDelayMs;
    this.scheduler = options.scheduler
      ?? (browserScheduler as SurfacePlanetTextureScheduler<TimerHandle>);
  }

  snapshot(): SurfacePlanetTextureAttachmentSnapshot {
    return Object.freeze({
      identity: this.identity,
      disposed: this.disposed,
      leaseOwned: this.lease !== null,
      currentTierPx: this.tierPx,
      currentBackingWidth: this.backingWidth,
      currentBackingHeight: this.backingHeight,
      requestedTierPx: this.pending?.tierPx ?? null,
      pendingDemandPx: this.pending?.demandPx ?? null,
      retiredLeaseCount: this.retiredLeases.size,
    });
  }

  /** Queue only a genuinely higher displayed tier. */
  requestDemand(demandPx: number): boolean {
    if (!this.isCurrent()) return false;
    this.retryRetiredReleases();
    const comparisonTierPx = Math.max(this.tierPx, this.pending?.tierPx ?? 0);
    const nextTierPx = nextPlanetTextureTierPx(comparisonTierPx, demandPx);
    if (nextTierPx === null) return false;

    // Prime the painter before committing a pending request. If this throws,
    // the previous request remains intact and this same demand stays retryable.
    this.resourceForDemand(demandPx);
    if (!this.isCurrent()) return false;
    this.queueRefresh(demandPx, nextTierPx);
    return true;
  }

  /**
   * Queue the post-bake read for an already-primed demand (including the
   * initial fitted surface tier).
   */
  scheduleRefresh(demandPx: number): boolean {
    if (!this.isCurrent()) return false;
    this.retryRetiredReleases();
    const demandTierPx = planetTextureTierForDemandPx(demandPx);
    const refreshTierPx = Math.max(this.tierPx, demandTierPx) as PlanetTextureTierPx;
    if (this.pending && this.pending.tierPx >= refreshTierPx) return false;
    this.queueRefresh(demandPx, refreshTierPx);
    return true;
  }

  /** Cancel async work without releasing a texture still referenced by the display tree. */
  cancelPending(): boolean {
    const pending = this.pending;
    if (!pending) return false;
    this.scheduler.cancel(pending.handle);
    if (this.pending === pending) this.pending = null;
    return true;
  }

  /**
   * Release all leases. A failed release remains owned and a later dispose()
   * retries it; successful repeated calls are no-ops.
   */
  dispose(): boolean {
    const hadWork = !this.disposed
      || this.pending !== null
      || this.lease !== null
      || this.retiredLeases.size > 0;
    if (!hadWork) return false;
    this.disposed = true;

    const failures: unknown[] = [];
    try { this.cancelPending(); }
    catch (error) { failures.push(error); }
    try { this.retryRetiredReleases(); }
    catch (error) { failures.push(error); }

    const lease = this.lease;
    if (lease) {
      try {
        lease.release();
        if (this.lease === lease) this.lease = null;
        this.compact();
      } catch (error) {
        failures.push(error);
      }
    }

    if (failures.length > 0) {
      throw new AggregateError(failures, 'surface planet texture attachment failed to dispose');
    }
    return true;
  }

  private isCurrent(): boolean {
    return !this.disposed
      && sameSurfacePlanetTextureIdentity(this.identity, this.currentIdentity());
  }

  private queueRefresh(demandPx: number, tierPx: PlanetTextureTierPx): void {
    this.cancelPending();
    const token = ++this.nextToken;
    const handle = this.scheduler.schedule(
      () => this.completeRefresh(token),
      this.refreshDelayMs,
    );
    this.pending = { token, demandPx, tierPx, handle };
  }

  private completeRefresh(token: number): void {
    const pending = this.pending;
    if (!pending || pending.token !== token) return;
    this.pending = null;
    if (!this.isCurrent()) return;

    this.retryRetiredReleases();
    const resource = this.resourceForDemand(pending.demandPx);
    if (!this.isCurrent()) return;

    const successor = this.acquireLease(resource);
    if (!this.isCurrent()) {
      this.releaseUncommitted(successor);
      return;
    }
    const backing = this.readBacking(successor.texture);
    const actualTierPx = planetTextureTierForBackingPx(backing.width, backing.height);
    if (actualTierPx === 0 || actualTierPx < pending.tierPx) {
      this.releaseUncommitted(successor);
      return;
    }
    this.publishSuccessor(successor, actualTierPx, backing);
  }

  private publishSuccessor(
    successor: SurfacePlanetTextureLease<Texture>,
    tierPx: PlanetTextureTierPx,
    backing: Readonly<{ width: number; height: number }>,
  ): void {
    const predecessor = this.lease;
    if (!predecessor) {
      this.releaseUncommitted(successor);
      throw new Error('surface planet texture attachment has no live predecessor');
    }
    if (!Object.is(this.target.texture, predecessor.texture)) {
      this.releaseUncommitted(successor);
      throw new Error('surface planet texture target changed outside its attachment owner');
    }

    if (successor === predecessor) {
      this.tierPx = tierPx;
      this.backingWidth = backing.width;
      this.backingHeight = backing.height;
      return;
    }
    if (Object.is(successor.texture, predecessor.texture)) {
      this.releaseUncommitted(successor);
      this.tierPx = tierPx;
      this.backingWidth = backing.width;
      this.backingHeight = backing.height;
      return;
    }

    const previousTexture = this.target.texture;
    const previousWidth = this.target.width;
    const previousHeight = this.target.height;
    let stillCurrent: boolean;
    try {
      this.target.width = this.diameterCssPx;
      this.target.height = this.diameterCssPx;
      this.target.texture = successor.texture;
      stillCurrent = this.isCurrent();
    } catch (error) {
      const cleanup: unknown[] = [];
      try { this.restoreTarget(previousTexture, previousWidth, previousHeight); }
      catch (rollbackError) { cleanup.push(rollbackError); }
      try { this.releaseUncommitted(successor); }
      catch (releaseError) { cleanup.push(releaseError); }
      throw combinedError(error, cleanup, 'surface planet texture publication failed');
    }
    if (!stillCurrent) {
      const cleanup: unknown[] = [];
      try { this.restoreTarget(previousTexture, previousWidth, previousHeight); }
      catch (rollbackError) { cleanup.push(rollbackError); }
      try { this.releaseUncommitted(successor); }
      catch (releaseError) { cleanup.push(releaseError); }
      if (cleanup.length > 0) {
        throw new AggregateError(cleanup, 'stale surface planet texture cleanup failed');
      }
      return;
    }

    this.lease = successor;
    this.tierPx = tierPx;
    this.backingWidth = backing.width;
    this.backingHeight = backing.height;
    try {
      predecessor.release();
      this.compact();
    } catch (error) {
      this.retiredLeases.add(predecessor);
      throw error;
    }
  }

  private restoreTarget(texture: Texture, width: number, height: number): void {
    this.target.texture = texture;
    this.target.width = width;
    this.target.height = height;
  }

  private readBacking(texture: Texture): Readonly<{ width: number; height: number }> {
    const backing = this.textureBackingSize(texture);
    const width = Number(backing?.width);
    const height = Number(backing?.height);
    if (!Number.isSafeInteger(width) || width <= 0
      || !Number.isSafeInteger(height) || height <= 0
      || !Number.isSafeInteger(width * height)) {
      throw new RangeError('surface planet texture backing dimensions are invalid');
    }
    return Object.freeze({ width, height });
  }

  private releaseUncommitted(lease: SurfacePlanetTextureLease<Texture>): void {
    if (lease === this.lease) return;
    try {
      lease.release();
      this.compact();
    } catch (error) {
      this.retiredLeases.add(lease);
      throw error;
    }
  }

  private retryRetiredReleases(): void {
    if (this.retiredLeases.size === 0) return;
    const failures: unknown[] = [];
    let releasedAny = false;
    for (const lease of [...this.retiredLeases]) {
      try {
        lease.release();
        this.retiredLeases.delete(lease);
        releasedAny = true;
      } catch (error) {
        failures.push(error);
      }
    }
    if (releasedAny) this.compact();
    if (failures.length > 0) {
      throw new AggregateError(failures, 'surface planet texture retired lease release failed');
    }
  }
}
