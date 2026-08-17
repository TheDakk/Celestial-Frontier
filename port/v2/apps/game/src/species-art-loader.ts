/* species-art-loader.ts — app-shell ownership for the DOM-mutating species
   painter chunk. This module is deliberately safe to import before boot: the
   dynamic import is not evaluated until a mounted app surface requests it. */

export type SpeciesVisualKey = string & { readonly __speciesVisualKey: unique symbol };

export interface Thumb132 {
  readonly key: SpeciesVisualKey;
  readonly url: string;
  readonly width: 132;
  readonly height: 132;
  readonly encodedBytes: number;
  readonly decodedPixels: number;
}

export interface ThumbLease {
  readonly key: SpeciesVisualKey;
  readonly current: Thumb132 | null;
  subscribe(listener: (asset: Thumb132 | null, error?: unknown) => void): () => void;
  release(): void;
}

export interface SpeciesArtModule {
  speciesPortrait(genome: Record<string, unknown>): string;
  /* Compatibility only. Compendium and Planetside must use leaseThumb. */
  speciesThumb(genome: Record<string, unknown>): string;
  leaseThumb(genome: Record<string, unknown>): ThumbLease;
  speciesArtDiagnostics?: () => unknown;
  __setSpeciesArtDeviceClassForTest?: (deviceClass: 'phone' | 'desktop' | null) => unknown;
  __failNextThumbJobForTest?: (message?: string) => unknown;
}

export type SpeciesArtLazyState = 'idle' | 'loading' | 'ready' | 'error';
export interface SpeciesArtLazyDiagnostics {
  readonly state: SpeciesArtLazyState;
  readonly importStarts: number;
}

type SpeciesArtImporter = () => Promise<SpeciesArtModule>;
type ReadyListener = (art: SpeciesArtModule | null, error?: unknown) => void;

const defaultImporter: SpeciesArtImporter = () => import('@cf/art/species')
  .then((module) => module as unknown as SpeciesArtModule);

/** One loader per document. Callers use stable owner keys so a newer request
 * replaces an obsolete callback instead of accumulating Promise reactions. */
export class SpeciesArtLoader {
  private art: SpeciesArtModule | null = null;
  private inFlight: Promise<SpeciesArtModule> | null = null;
  private listeners = new Map<string, ReadyListener>();
  private state0: SpeciesArtLazyState = 'idle';
  private importStarts0 = 0;

  constructor(
    private readonly importer: SpeciesArtImporter = defaultImporter,
    private readonly shellReady: () => boolean = () =>
      typeof document !== 'undefined' && document.body?.isConnected === true,
  ) {}

  current(): SpeciesArtModule | null {
    return this.art;
  }

  diagnostics(): SpeciesArtLazyDiagnostics {
    return Object.freeze({ state: this.state0, importStarts: this.importStarts0 });
  }

  artDiagnostics(): unknown | null {
    return this.art?.speciesArtDiagnostics?.() ?? null;
  }

  /** Returns the already-loaded module synchronously. On a miss, registers
   * one replaceable listener and returns a cancellation function. */
  request(owner: string, listener: ReadyListener): {
    readonly art: SpeciesArtModule | null;
    readonly cancel: () => void;
  } {
    if (this.art) return { art: this.art, cancel: () => {} };
    this.listeners.set(owner, listener);
    const cancel = (): void => {
      if (this.listeners.get(owner) === listener) this.listeners.delete(owner);
    };
    this.start();
    return { art: null, cancel };
  }

  prefetch(): void {
    if (!this.art) this.start();
  }

  trimArtNow(deviceClass: 'phone' | 'desktop'): unknown {
    if (!this.art?.__setSpeciesArtDeviceClassForTest || !this.art.speciesArtDiagnostics) {
      throw new Error('species art is not ready for an evidence trim');
    }
    this.art.__setSpeciesArtDeviceClassForTest(deviceClass);
    return this.art.speciesArtDiagnostics();
  }

  failNextThumb(message?: string): void {
    if (!this.art?.__failNextThumbJobForTest) {
      throw new Error('species art is not ready for a thumbnail failure control');
    }
    this.art.__failNextThumbJobForTest(message);
  }

  private start(): void {
    if (this.art || this.inFlight) return;
    if (!this.shellReady()) {
      throw new Error('species art may load only after the owning document shell exists');
    }
    this.state0 = 'loading';
    this.importStarts0++;
    this.inFlight = this.importer()
      .then((art) => {
        this.art = art;
        this.state0 = 'ready';
        this.inFlight = null;
        const listeners = [...this.listeners.values()];
        this.listeners.clear();
        for (const listener of listeners) {
          try { listener(art); } catch { /* one surface cannot block another */ }
        }
        return art;
      })
      .catch((error: unknown) => {
        this.state0 = 'error';
        this.inFlight = null;
        const listeners = [...this.listeners.values()];
        this.listeners.clear();
        for (const listener of listeners) {
          try { listener(null, error); } catch { /* another surface still hears failure */ }
        }
        throw error;
      });
    void this.inFlight.catch(() => { /* a later request may retry */ });
  }
}

export const speciesArtLoader = new SpeciesArtLoader();

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
  const acquire = (art: SpeciesArtModule | null, error?: unknown): void => {
    if (error !== undefined || !art) {
      if (disposed || !options.isCurrent() || !image.isConnected) stale();
      else {
        image.dataset.thumbState = 'error';
        options.onError?.(error);
      }
      return;
    }
    if (disposed || !options.isCurrent() || !image.isConnected) { stale(); return; }
    try {
      lease = art.leaseThumb(options.genome);
      expectedKey = String(lease.key);
      image.dataset.visualKey = expectedKey;
      if (lease.current) publish(lease.current);
      else unsubscribe = lease.subscribe(publish);
    } catch (leaseError) {
      image.dataset.thumbState = 'error';
      options.onError?.(leaseError);
    }
  };

  const pending = loader.request(options.owner, acquire);
  if (pending.art) acquire(pending.art);

  return Object.freeze({
    visualKey: () => expectedKey,
    release: (): void => {
      if (disposed) return;
      disposed = true;
      pending.cancel();
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
