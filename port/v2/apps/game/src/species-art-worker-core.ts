/* Browser-free worker state machine. The WebWorker adapter supplies the
   worker-only canvas encoder and lazy painter import; tests supply fakes. */
import { speciesVisualKey } from '@cf/art/species-identity';
import {
  SPECIES_ART_WORKER_RESPONSE_SCHEMA,
  type SpeciesArtRenderKind,
  type SpeciesArtWorkerErrorResponse,
  type SpeciesArtWorkerPhase,
  type SpeciesArtWorkerResponse,
  validSpeciesArtWorkerRequest,
} from './species-art-protocol.js';

export interface SpeciesArtWorkerCanvas {
  readonly width: number;
  readonly height: number;
}

export interface SpeciesArtWorkerPainter {
  renderSpeciesPortraitCanvas(genome: Record<string, unknown>): SpeciesArtWorkerCanvas;
  renderSpeciesThumbCanvas(genome: Record<string, unknown>): SpeciesArtWorkerCanvas;
}

export interface SpeciesArtEncodedCanvas {
  readonly url: string;
  readonly encodedBytes: number;
  readonly pngBytes: number;
}

export interface SpeciesArtWorkerCoreOptions {
  readonly checkCapabilities?: () => void | Promise<void>;
  readonly loadPainter: () => Promise<SpeciesArtWorkerPainter>;
  readonly encodeCanvas: (canvas: SpeciesArtWorkerCanvas) => Promise<SpeciesArtEncodedCanvas>;
  readonly emit: (response: SpeciesArtWorkerResponse) => void;
  readonly now?: () => number;
}

interface WorkerIdentity {
  readonly documentToken: string;
  readonly producerEpoch: number;
  readonly workerInstanceId: number;
}

const boundedMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  return (message || 'unknown worker error').slice(0, 512);
};

export class SpeciesArtWorkerCore {
  private identity: WorkerIdentity | null = null;
  private painterPromise: Promise<SpeciesArtWorkerPainter> | null = null;
  private painter: SpeciesArtWorkerPainter | null = null;
  private busyJobId: number | null = null;
  private readonly now: () => number;

  constructor(private readonly options: SpeciesArtWorkerCoreOptions) {
    this.now = options.now ?? (() => performance.now());
  }

  private base(): WorkerIdentity & { readonly schema: typeof SPECIES_ART_WORKER_RESPONSE_SCHEMA } {
    if (!this.identity) throw new Error('species-art worker has not been initialized');
    return { schema: SPECIES_ART_WORKER_RESPONSE_SCHEMA, ...this.identity };
  }

  private emitError(
    stage: SpeciesArtWorkerErrorResponse['stage'], code: string, error: unknown,
    request: { readonly jobId: number; readonly kind: SpeciesArtRenderKind; readonly key: string } | null,
  ): void {
    if (!this.identity) return;
    const ownership = request === null
      ? Object.freeze({ jobId: null, kind: null, key: null })
      : request;
    this.options.emit({
      ...this.base(), type: 'error',
      ...ownership,
      stage, code, message: boundedMessage(error),
    });
  }

  private phase(
    request: { readonly jobId: number; readonly kind: SpeciesArtRenderKind; readonly key: string },
    phase: SpeciesArtWorkerPhase,
  ): void {
    this.options.emit({ ...this.base(), type: 'phase', ...request, phase, performanceNow: this.now() });
  }

  async handle(raw: unknown): Promise<void> {
    if (!validSpeciesArtWorkerRequest(raw)) {
      this.emitError('protocol', 'invalid-request', 'worker request failed schema validation', null);
      return;
    }
    if (raw.type === 'init') {
      const incoming = {
        documentToken: raw.documentToken,
        producerEpoch: raw.producerEpoch,
        workerInstanceId: raw.workerInstanceId,
      };
      if (this.identity !== null) {
        const same = Object.keys(incoming).every((key) =>
          incoming[key as keyof WorkerIdentity] === this.identity?.[key as keyof WorkerIdentity]);
        if (!same) this.emitError('protocol', 'duplicate-init', 'worker identity changed after initialization', null);
        return;
      }
      this.identity = incoming;
      try { await this.options.checkCapabilities?.(); }
      catch (error) {
        this.emitError('capability', 'worker-capability', error, null);
        return;
      }
      this.options.emit({ ...this.base(), type: 'ready' });
      return;
    }

    const request = { jobId: raw.jobId, kind: raw.kind, key: raw.key };
    if (!this.identity
      || raw.documentToken !== this.identity.documentToken
      || raw.producerEpoch !== this.identity.producerEpoch
      || raw.workerInstanceId !== this.identity.workerInstanceId) {
      this.emitError('protocol', 'identity-mismatch', 'render request did not match initialized worker identity', request);
      return;
    }
    if (this.busyJobId !== null) {
      this.emitError('protocol', 'concurrent-job', `worker is already processing job ${this.busyJobId}`, request);
      return;
    }
    let canonicalKey: string;
    try { canonicalKey = String(speciesVisualKey(raw.genome)); }
    catch (error) {
      this.emitError('protocol', 'invalid-genome', error, request);
      return;
    }
    if (canonicalKey !== raw.key) {
      this.emitError('protocol', 'key-mismatch', 'worker recomputed a different species visual key', request);
      return;
    }

    this.busyJobId = raw.jobId;
    let importDurationMs = 0;
    try {
      if (!this.painter) {
        this.phase(request, 'import-start');
        const importStarted = this.now();
        this.painterPromise ??= this.options.loadPainter();
        try { this.painter = await this.painterPromise; }
        catch (error) {
          this.painterPromise = null;
          this.emitError('import', 'painter-import', error, request);
          return;
        }
        importDurationMs = Math.max(0, this.now() - importStarted);
        this.phase(request, 'import-complete');
      }

      this.phase(request, 'job-start');
      if (raw.testFailureMessage !== undefined) {
        this.emitError('paint', 'injected-failure', raw.testFailureMessage, request);
        return;
      }
      const renderStarted = this.now();
      let canvas: SpeciesArtWorkerCanvas;
      try {
        canvas = raw.kind === 'thumb132'
          ? this.painter.renderSpeciesThumbCanvas(raw.genome)
          : this.painter.renderSpeciesPortraitCanvas(raw.genome);
      } catch (error) {
        this.emitError('paint', 'painter-threw', error, request);
        return;
      }
      const expectedSize = raw.kind === 'thumb132' ? 132 : 440;
      if (canvas.width !== expectedSize || canvas.height !== expectedSize) {
        this.emitError('paint', 'wrong-dimensions',
          `painter returned ${canvas.width}x${canvas.height}, expected ${expectedSize}x${expectedSize}`, request);
        return;
      }
      const renderDurationMs = Math.max(0, this.now() - renderStarted);
      this.phase(request, 'render-complete');
      this.phase(request, 'encode-start');
      const encodeStarted = this.now();
      let encoded: SpeciesArtEncodedCanvas;
      try { encoded = await this.options.encodeCanvas(canvas); }
      catch (error) {
        this.emitError('encode', 'png-encode', error, request);
        return;
      }
      const encodeDurationMs = Math.max(0, this.now() - encodeStarted);
      if (!encoded.url.startsWith('data:image/png;base64,')
        || !Number.isSafeInteger(encoded.encodedBytes) || encoded.encodedBytes <= 0
        || !Number.isSafeInteger(encoded.pngBytes) || encoded.pngBytes <= 0) {
        this.emitError('encode', 'invalid-png-result', 'PNG encoder returned invalid metadata', request);
        return;
      }
      this.phase(request, 'encode-complete');
      this.options.emit({
        ...this.base(), type: 'result', ...request,
        width: expectedSize, height: expectedSize, url: encoded.url,
        encodedBytes: encoded.encodedBytes, pngBytes: encoded.pngBytes,
        decodedPixels: expectedSize * expectedSize,
        importDurationMs, renderDurationMs, encodeDurationMs,
      });
    } finally {
      this.busyJobId = null;
    }
  }
}
