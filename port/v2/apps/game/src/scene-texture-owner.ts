export type SceneTextureKind =
  | 'scene-canvas'
  | 'galaxy-haze'
  | 'planet-texture'
  | 'ring-texture'
  | 'surface-cloud'
  | 'star-surface';

export interface SceneTextureSourceLike {
  readonly pixelWidth: number;
  readonly pixelHeight: number;
}

export interface SceneTextureLike {
  readonly destroyed: boolean;
  readonly source: SceneTextureSourceLike | null;
  destroy(destroySource?: boolean): void;
}

export interface SceneTextureLease<OwnedTexture extends SceneTextureLike> {
  readonly texture: OwnedTexture;
  readonly kind: SceneTextureKind;
  readonly released: boolean;
  release(): boolean;
}

export interface SceneTextureScopeSnapshot {
  readonly label: string;
  readonly leaseCount: number;
  readonly closed: boolean;
}

export interface SceneTextureSnapshot {
  readonly schema: 'cf-v2-scene-textures/v2';
  readonly observationWindow: number;
  readonly scopeCreations: number;
  readonly scopeDisposals: number;
  readonly activeScopeCount: number;
  readonly leaseAcquisitions: number;
  readonly leaseReleases: number;
  readonly activeLeaseCount: number;
  readonly textureCreations: number;
  readonly textureDisposals: number;
  readonly liveTextureCount: number;
  readonly liveCanvasPixels: number;
  readonly liveCanvasBytes: number;
  readonly peakActiveLeaseCount: number;
  readonly peakLiveTextureCount: number;
  readonly peakLiveCanvasPixels: number;
  readonly peakLiveCanvasBytes: number;
  readonly lifetimePeakActiveLeaseCount: number;
  readonly lifetimePeakLiveTextureCount: number;
  readonly lifetimePeakLiveCanvasPixels: number;
  readonly externalDestroyFaults: number;
  readonly balanced: boolean;
  readonly coherent: boolean;
  readonly liveLeasesByKind: Readonly<Record<SceneTextureKind, number>>;
  readonly liveTexturesByKind: Readonly<Record<SceneTextureKind, number>>;
  readonly activeScopes: readonly SceneTextureScopeSnapshot[];
}

type RegistryEntry<OwnedTexture extends SceneTextureLike> = {
  readonly texture: OwnedTexture;
  readonly kind: SceneTextureKind;
  readonly pixels: number;
  refs: number;
  externalFaulted: boolean;
};

const EMPTY_KIND_COUNTS = (): Record<SceneTextureKind, number> => ({
  'scene-canvas': 0,
  'galaxy-haze': 0,
  'planet-texture': 0,
  'ring-texture': 0,
  'surface-cloud': 0,
  'star-surface': 0,
});

export class SceneTextureScope<
  Resource extends object,
  OwnedTexture extends SceneTextureLike,
> {
  private readonly leases = new Set<SceneTextureLease<OwnedTexture>>();
  private readonly sharedLeases = new Map<Resource, SceneTextureLease<OwnedTexture>>();
  private closed = false;
  private finalized = false;

  constructor(
    private readonly registry: CanvasTextureRegistry<Resource, OwnedTexture>,
    readonly label: string,
  ) {}

  acquire(resource: Resource, kind: SceneTextureKind = 'scene-canvas'): OwnedTexture {
    if (this.closed) throw new Error(`scene texture scope is closed: ${this.label}`);
    const existing = this.sharedLeases.get(resource);
    if (existing) {
      this.registry.assertResourceLive(resource);
      if (existing.kind !== kind) {
        throw new Error(`scene canvas kind changed from ${existing.kind} to ${kind}`);
      }
      return existing.texture;
    }
    const lease = this.acquireLease(resource, kind);
    this.sharedLeases.set(resource, lease);
    return lease.texture;
  }

  acquireLease(
    resource: Resource,
    kind: SceneTextureKind = 'scene-canvas',
  ): SceneTextureLease<OwnedTexture> {
    if (this.closed) throw new Error(`scene texture scope is closed: ${this.label}`);
    let lease!: SceneTextureLease<OwnedTexture>;
    lease = this.registry.acquireLease(resource, kind, () => this.leases.delete(lease));
    this.leases.add(lease);
    return lease;
  }

  dispose(): void {
    if (this.finalized) return;
    this.closed = true;
    const failures: unknown[] = [];
    for (const lease of [...this.leases]) {
      try { lease.release(); }
      catch (error) { failures.push(error); }
    }
    if (failures.length) {
      throw new AggregateError(failures, `scene texture scope failed to dispose: ${this.label}`);
    }
    this.sharedLeases.clear();
    this.finalized = true;
    this.registry.finalizeScope(this);
  }

  snapshot(): SceneTextureScopeSnapshot {
    return Object.freeze({ label: this.label, leaseCount: this.leases.size, closed: this.closed });
  }
}

export class CanvasTextureRegistry<
  Resource extends object,
  OwnedTexture extends SceneTextureLike,
> {
  private readonly entries = new Map<Resource, RegistryEntry<OwnedTexture>>();
  private readonly scopes = new Set<SceneTextureScope<Resource, OwnedTexture>>();
  private scopeCreations = 0;
  private scopeDisposals = 0;
  private leaseAcquisitions = 0;
  private leaseReleases = 0;
  private textureCreations = 0;
  private textureDisposals = 0;
  private liveCanvasPixels = 0;
  private externalDestroyFaults = 0;
  private observationWindow = 0;
  private peakActiveLeaseCount = 0;
  private peakLiveTextureCount = 0;
  private peakLiveCanvasPixels = 0;
  private lifetimePeakActiveLeaseCount = 0;
  private lifetimePeakLiveTextureCount = 0;
  private lifetimePeakLiveCanvasPixels = 0;

  constructor(private readonly createTexture: (resource: Resource) => OwnedTexture) {}

  createScope(label: string): SceneTextureScope<Resource, OwnedTexture> {
    if (!label.trim()) throw new Error('scene texture scope label must not be empty');
    const scope = new SceneTextureScope(this, label);
    this.scopes.add(scope);
    this.scopeCreations++;
    return scope;
  }

  assertResourceLive(resource: Resource): void {
    const entry = this.entries.get(resource);
    if (entry && this.noteExternalDestroy(entry)) {
      throw new Error('live scene texture was destroyed outside its registry');
    }
  }

  acquireLease(
    resource: Resource,
    kind: SceneTextureKind = 'scene-canvas',
    onRelease: () => void = () => undefined,
  ): SceneTextureLease<OwnedTexture> {
    let entry = this.entries.get(resource);
    if (entry) {
      if (this.noteExternalDestroy(entry)) {
        throw new Error('live scene texture was destroyed outside its registry');
      }
      if (entry.kind !== kind) {
        throw new Error(`scene canvas kind changed from ${entry.kind} to ${kind}`);
      }
    } else {
      const texture = this.createTexture(resource);
      if (texture.destroyed || texture.source === null) {
        this.rejectCreatedTexture(texture, 'scene texture factory returned a destroyed texture');
      }
      const { pixelWidth, pixelHeight } = texture.source;
      if (!Number.isInteger(pixelWidth) || pixelWidth <= 0
        || !Number.isInteger(pixelHeight) || pixelHeight <= 0) {
        this.rejectCreatedTexture(texture, 'scene texture source has invalid backing dimensions');
      }
      const pixels = pixelWidth * pixelHeight;
      if (!Number.isSafeInteger(pixels)) {
        this.rejectCreatedTexture(
          texture,
          'scene texture source exceeds the safe backing-pixel range',
        );
      }
      entry = { texture, kind, pixels, refs: 0, externalFaulted: false };
      this.entries.set(resource, entry);
      this.textureCreations++;
      this.liveCanvasPixels += pixels;
    }

    entry.refs++;
    this.leaseAcquisitions++;
    this.recordPeaks();
    let released = false;
    const registry = this;
    return Object.freeze({
      texture: entry.texture,
      kind,
      get released(): boolean { return released; },
      release(): boolean {
        if (released) return false;
        registry.releaseEntry(resource, entry!);
        released = true;
        onRelease();
        return true;
      },
    });
  }

  finalizeScope(scope: SceneTextureScope<Resource, OwnedTexture>): void {
    if (!this.scopes.delete(scope)) return;
    this.scopeDisposals++;
  }

  beginObservationWindow(): number {
    this.observationWindow++;
    this.peakActiveLeaseCount = this.activeLeaseCount();
    this.peakLiveTextureCount = this.entries.size;
    this.peakLiveCanvasPixels = this.liveCanvasPixels;
    return this.observationWindow;
  }

  snapshot(): SceneTextureSnapshot {
    const liveLeasesByKind = EMPTY_KIND_COUNTS();
    const liveTexturesByKind = EMPTY_KIND_COUNTS();
    for (const entry of this.entries.values()) {
      liveLeasesByKind[entry.kind] += entry.refs;
      liveTexturesByKind[entry.kind]++;
      this.noteExternalDestroy(entry);
    }
    const activeLeaseCount = this.activeLeaseCount();
    const balanced = this.leaseAcquisitions - this.leaseReleases === activeLeaseCount
      && this.textureCreations - this.textureDisposals === this.entries.size
      && this.scopeCreations - this.scopeDisposals === this.scopes.size;
    return Object.freeze({
      schema: 'cf-v2-scene-textures/v2',
      observationWindow: this.observationWindow,
      scopeCreations: this.scopeCreations,
      scopeDisposals: this.scopeDisposals,
      activeScopeCount: this.scopes.size,
      leaseAcquisitions: this.leaseAcquisitions,
      leaseReleases: this.leaseReleases,
      activeLeaseCount,
      textureCreations: this.textureCreations,
      textureDisposals: this.textureDisposals,
      liveTextureCount: this.entries.size,
      liveCanvasPixels: this.liveCanvasPixels,
      liveCanvasBytes: this.liveCanvasPixels * 4,
      peakActiveLeaseCount: this.peakActiveLeaseCount,
      peakLiveTextureCount: this.peakLiveTextureCount,
      peakLiveCanvasPixels: this.peakLiveCanvasPixels,
      peakLiveCanvasBytes: this.peakLiveCanvasPixels * 4,
      lifetimePeakActiveLeaseCount: this.lifetimePeakActiveLeaseCount,
      lifetimePeakLiveTextureCount: this.lifetimePeakLiveTextureCount,
      lifetimePeakLiveCanvasPixels: this.lifetimePeakLiveCanvasPixels,
      externalDestroyFaults: this.externalDestroyFaults,
      balanced,
      coherent: balanced && this.externalDestroyFaults === 0,
      liveLeasesByKind: Object.freeze(liveLeasesByKind),
      liveTexturesByKind: Object.freeze(liveTexturesByKind),
      activeScopes: Object.freeze([...this.scopes].map((scope) => scope.snapshot())),
    });
  }

  private activeLeaseCount(): number {
    let total = 0;
    for (const entry of this.entries.values()) total += entry.refs;
    return total;
  }

  private recordPeaks(): void {
    const leases = this.activeLeaseCount();
    this.peakActiveLeaseCount = Math.max(this.peakActiveLeaseCount, leases);
    this.peakLiveTextureCount = Math.max(this.peakLiveTextureCount, this.entries.size);
    this.peakLiveCanvasPixels = Math.max(this.peakLiveCanvasPixels, this.liveCanvasPixels);
    this.lifetimePeakActiveLeaseCount = Math.max(this.lifetimePeakActiveLeaseCount, leases);
    this.lifetimePeakLiveTextureCount = Math.max(this.lifetimePeakLiveTextureCount, this.entries.size);
    this.lifetimePeakLiveCanvasPixels = Math.max(
      this.lifetimePeakLiveCanvasPixels,
      this.liveCanvasPixels,
    );
  }

  private releaseEntry(resource: Resource, expected: RegistryEntry<OwnedTexture>): void {
    const entry = this.entries.get(resource);
    if (entry !== expected || entry.refs <= 0) {
      throw new Error('scene texture lease underflow or stale release');
    }
    const externallyDestroyed = this.noteExternalDestroy(entry);
    if (entry.refs > 1) {
      entry.refs--;
      this.leaseReleases++;
      return;
    }
    if (!externallyDestroyed) {
      entry.texture.destroy(true);
      if (!entry.texture.destroyed || entry.texture.source !== null) {
        throw new Error('scene texture destroy did not release its source');
      }
    }
    entry.refs = 0;
    this.entries.delete(resource);
    this.liveCanvasPixels -= entry.pixels;
    this.leaseReleases++;
    this.textureDisposals++;
  }

  private noteExternalDestroy(entry: RegistryEntry<OwnedTexture>): boolean {
    const destroyed = entry.texture.destroyed || entry.texture.source === null;
    if (destroyed && !entry.externalFaulted) {
      entry.externalFaulted = true;
      this.externalDestroyFaults++;
    }
    return destroyed;
  }

  private rejectCreatedTexture(texture: OwnedTexture, message: string): never {
    let cleanupError: unknown;
    if (!texture.destroyed || texture.source !== null) {
      try { texture.destroy(true); }
      catch (error) { cleanupError = error; }
    }
    const validationError = new Error(message);
    if (cleanupError !== undefined) {
      throw new AggregateError(
        [validationError, cleanupError],
        'invalid scene texture and cleanup both failed',
      );
    }
    throw validationError;
  }
}
