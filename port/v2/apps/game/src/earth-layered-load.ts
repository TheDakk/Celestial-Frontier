import type { EarthResidentLayerPlanV1 } from '@cf/art/earth-resident-layer';
import { PaintedVistaLoadV1 } from './painted-vista-load.js';
import {
  EARTH_LAYER_REQUEST, earthResidentResponseV1, closeEarthResidentBitmapV1,
  type EarthResidentRequestV1,
} from './earth-layered-protocol.js';

export interface EarthLayeredLoadOptionsV1 {
  readonly plan: EarthResidentLayerPlanV1;
  readonly token: string;
  readonly isCurrent: () => boolean;
  readonly commit: (background: HTMLCanvasElement, residents: HTMLCanvasElement) => boolean | 'retained-failure';
  readonly fallback: (error: unknown) => void;
}

/** Both layers are required. Neither is published alone; a failed/stale pair
 * releases everything it owns before the caller restores the canonical scene.
 * Successful commit transfers both canvases to the display owner, without cache. */
export class EarthLayeredLoadV1 {
  private status: 'pending' | 'ready' | 'failed' | 'disposed' = 'pending';
  private worker: Worker | null = null;
  private backgroundLoad: PaintedVistaLoadV1 | null = null;
  private background: HTMLCanvasElement | null = null;
  private residents: HTMLCanvasElement | null = null;
  private deadline: ReturnType<typeof setTimeout> | null = null;
  private error: string | null = null;
  private workerStarts = 0;

  constructor(private readonly options: EarthLayeredLoadOptionsV1) {
    if (!this.current()) return;
    this.deadline = setTimeout(() => this.fail(new Error('Earth resident layer timed out')), 12_000);
    try {
      const worker = new Worker(new URL('./earth-resident.worker.ts', import.meta.url),
        { type: 'module', name: 'cf-earth-residents' });
      this.worker = worker; this.workerStarts++;
      worker.addEventListener('error', event => {
        event.preventDefault(); this.fail(new Error(event.message || 'Earth resident worker failed'));
      });
      worker.addEventListener('messageerror', () => this.fail(new Error('Earth resident message could not be decoded')));
      worker.addEventListener('message', event => this.receive(event.data));
      const request: EarthResidentRequestV1 = { schema: EARTH_LAYER_REQUEST, token: options.token, plan: options.plan };
      worker.postMessage(request);
      this.backgroundLoad = new PaintedVistaLoadV1({
        url: new URL('./assets/painted/earth-riverbank-v1.webp', import.meta.url).href,
        sha256: '2993cd8054a2424f20ba24040717acdb17aa9c7157500cd5b945170cd1f625d8',
        width: 960, height: 430, isCurrent: () => this.current(),
        commit: canvas => {
          if (!this.current()) return false;
          this.background = canvas; this.publish();
          // The pair owner took this canvas even if publication failed and disposed it.
          return true;
        },
        fallback: error => this.fail(error),
      });
    } catch (error) { this.fail(error); }
  }

  private current(): boolean {
    if (this.status !== 'pending') return false;
    try { if (this.options.isCurrent()) return true; }
    catch (error) { this.error = String(error).slice(0, 512); }
    this.dispose(); return false;
  }

  private receive(value: unknown): void {
    if (!this.current() || this.residents !== null) { closeEarthResidentBitmapV1(value); return; }
    const response = earthResidentResponseV1(value, this.options.token);
    if (!response) {
      closeEarthResidentBitmapV1(value); this.fail(new Error('Earth resident response identity/shape mismatch')); return;
    }
    if (response.type === 'error') { this.fail(new Error(response.message)); return; }
    let canvas: HTMLCanvasElement | null = null;
    let copyFailure: unknown;
    let copied = false;
    try {
      canvas = document.createElement('canvas');
      canvas.width = 960; canvas.height = 430;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Earth resident copy context unavailable');
      context.drawImage(response.bitmap, 0, 0);
      this.residents = canvas; copied = true;
    } catch (error) {
      if (canvas) { try { canvas.width = 1; canvas.height = 1; } catch { /* allocation failed */ } }
      copyFailure = error;
    } finally { closeEarthResidentBitmapV1(response); }
    if (!copied) { this.fail(copyFailure); return; }
    this.worker?.terminate(); this.worker = null;
    this.publish();
  }

  private publish(): void {
    if (!this.current() || !this.background || !this.residents) return;
    const background = this.background, residents = this.residents;
    this.background = null; this.residents = null;
    let disposition: boolean | 'retained-failure' = false;
    try { disposition = this.options.commit(background, residents); }
    catch (error) { this.error = String(error).slice(0, 512); }
    if (disposition !== true) {
      // A failed display owner may still hold retryable GPU leases. It owns
      // those canvases until cleanup succeeds; shrinking them here is unsafe.
      if (disposition !== 'retained-failure') {
        background.width = residents.width = 1; background.height = residents.height = 1;
      }
      this.fail(new Error(this.error || 'Earth layered mount refused')); return;
    }
    if (this.status === 'pending') this.status = 'ready';
    this.stop();
  }

  private stop(): void {
    if (this.deadline !== null) clearTimeout(this.deadline);
    this.deadline = null;
    this.worker?.terminate(); this.worker = null;
    this.backgroundLoad?.dispose();
  }

  private discard(): void {
    for (const canvas of [this.background, this.residents]) {
      if (canvas) { canvas.width = 1; canvas.height = 1; }
    }
    this.background = this.residents = null;
  }

  private fail(error: unknown): void {
    if (!this.current()) return;
    this.status = 'failed'; this.error = String(error).slice(0, 512);
    this.stop(); this.discard();
    try { if (this.options.isCurrent()) this.options.fallback(error); }
    catch (failure) { this.error = `${this.error}; fallback: ${String(failure)}`.slice(0, 512); }
  }

  snapshot() {
    return Object.freeze({ status: this.status, error: this.error, workerStarts: this.workerStarts,
      workerActive: this.worker !== null, deadlineActive: this.deadline !== null,
      retainedCanvases: Number(this.background !== null) + Number(this.residents !== null),
      background: this.backgroundLoad?.snapshot() ?? null });
  }

  dispose(): void {
    if (this.status !== 'disposed') { this.status = 'disposed'; this.stop(); this.discard(); }
  }
}
