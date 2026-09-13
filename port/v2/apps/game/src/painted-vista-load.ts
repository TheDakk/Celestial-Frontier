export const PAINTED_VISTA_MAX_BYTES = 512 * 1024;
/** Explicit exact-size lossless exports only; existing loads retain 512 KiB. */
export const PAINTED_VISTA_EXACT_MAX_BYTES = 640 * 1024;
export const PAINTED_VISTA_DEADLINE_MS = 8_000;

export type PaintedVistaCommitV1 = boolean | 'retained-failure';

export interface PaintedVistaLoadOptionsV1 {
  readonly url: string;
  readonly sha256: string;
  readonly width: 960;
  readonly height: 430;
  readonly expectedBytes?: number;
  readonly isCurrent: () => boolean;
  readonly commit: (canvas: HTMLCanvasElement) => PaintedVistaCommitV1;
  readonly fallback: (error: unknown) => void;
}

/** One optional, verified local image load. The caller owns eligibility and any
 * successfully committed or explicitly retained-failure canvas; this owner
 * never starts a painter or retries. A throwing commit must leave no live lease. */
export class PaintedVistaLoadV1 {
  private status: 'pending' | 'ready' | 'failed' | 'disposed' = 'pending';
  private error: string | null = null;
  private readonly abort = new AbortController();
  private deadline: ReturnType<typeof setTimeout> | null = null;
  private expiresAt: number | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private fetchStarts = 0;
  private decodePending = false;

  constructor(private readonly options: PaintedVistaLoadOptionsV1) {
    if (!this.current()) return;
    this.expiresAt = performance.now() + PAINTED_VISTA_DEADLINE_MS;
    this.deadline = setTimeout(() => this.fail(new Error('painted vista load timed out')),
      PAINTED_VISTA_DEADLINE_MS);
    void this.load().catch(error => this.fail(error));
  }

  private current(): boolean {
    if (!this.authorized()) return false;
    // Timers can arrive late after throttling or a busy task. The monotonic
    // boundary also governs every settled phase and the final canvas transfer.
    if (this.expiresAt !== null && performance.now() >= this.expiresAt) {
      this.fail(new Error('painted vista load timed out'));
      return false;
    }
    return true;
  }

  private authorized(): boolean {
    if (this.status !== 'pending') return false;
    try { if (this.options.isCurrent()) return true; }
    catch (error) { this.error = String(error).slice(0, 512); }
    this.dispose();
    return false;
  }

  private stop(): void {
    if (this.deadline !== null) clearTimeout(this.deadline);
    this.deadline = null;
    this.abort.abort();
    const reader = this.reader; this.reader = null;
    if (reader) {
      try { void reader.cancel().catch(() => {}); } catch { /* bounded release */ }
      try { reader.releaseLock(); } catch { /* a cancelled read may still settle */ }
    }
  }

  private discardCanvas(): void {
    const canvas = this.canvas; this.canvas = null;
    if (canvas) { canvas.width = 1; canvas.height = 1; }
  }

  private async load(): Promise<void> {
    const o = this.options;
    if (typeof o.url !== 'string' || !o.url || o.url.length > 4096
      || !/^[0-9a-f]{64}$/.test(o.sha256) || o.width !== 960 || o.height !== 430
      || (o.expectedBytes !== undefined && (!Number.isSafeInteger(o.expectedBytes)
        || o.expectedBytes < 1 || o.expectedBytes > PAINTED_VISTA_EXACT_MAX_BYTES))) {
      throw new Error('invalid painted vista asset contract');
    }
    const byteLimit = o.expectedBytes ?? PAINTED_VISTA_MAX_BYTES;
    this.fetchStarts++;
    const response = await fetch(o.url, { signal: this.abort.signal, credentials: 'omit', redirect: 'error' });
    if (!this.current()) {
      try { await response.body?.cancel(); } catch { /* late response is never admitted */ }
      return;
    }
    if (!response.ok) throw new Error(`painted vista HTTP ${response.status}`);
    const length = response.headers.get('content-length');
    if (length !== null && Number(length) > byteLimit) {
      throw new Error('painted vista exceeds byte limit');
    }
    if (!response.body) throw new Error('painted vista response has no body');
    const reader = response.body.getReader(); this.reader = reader;
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (!this.current()) return;
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > byteLimit) throw new Error('painted vista exceeds byte limit');
      chunks.push(chunk.value);
    }
    reader.releaseLock(); this.reader = null;
    if (!size) throw new Error('painted vista response is empty');
    if (o.expectedBytes !== undefined && size !== o.expectedBytes) {
      throw new Error('painted vista byte length mismatch');
    }
    const buffer = new ArrayBuffer(size), bytes = new Uint8Array(buffer); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    if (!this.current()) return;
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== o.sha256) throw new Error('painted vista SHA-256 mismatch');
    let bitmap: ImageBitmap | null = null;
    try {
      this.decodePending = true;
      try { bitmap = await createImageBitmap(new Blob([buffer])); }
      finally { this.decodePending = false; }
      if (!this.current()) return;
      if (bitmap.width !== o.width || bitmap.height !== o.height) throw new Error('painted vista dimensions mismatch');
      const canvas = document.createElement('canvas'); this.canvas = canvas;
      canvas.width = o.width; canvas.height = o.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('painted vista copy context unavailable');
      context.drawImage(bitmap, 0, 0);
      const copied = bitmap; bitmap = null; copied.close();
      if (!this.current()) return;
      // commit is synchronous. Avoid shrinking a canvas accepted by a caller
      // that retires this loader during the ownership transfer itself.
      this.canvas = null;
      let disposition: PaintedVistaCommitV1 = false;
      try { disposition = o.commit(canvas); }
      finally {
        // A failed display owner can still hold a retryable GPU lease. That
        // explicit outcome transfers cleanup authority, without publishing art.
        if (disposition !== true && disposition !== 'retained-failure') {
          canvas.width = 1; canvas.height = 1;
        }
      }
      if (disposition !== true) throw new Error('painted vista commit refused');
      if (this.status === 'pending') this.status = 'ready';
      this.stop();
    } finally {
      if (bitmap) {
        try { bitmap.close(); } catch (error) { this.error ??= String(error).slice(0, 512); }
      }
      this.discardCanvas();
    }
  }

  private fail(error: unknown): void {
    // Check ownership without re-entering the deadline transition.
    if (!this.authorized()) return;
    this.status = 'failed';
    this.error = (error instanceof Error ? error.message : String(error)).slice(0, 512);
    this.stop(); this.discardCanvas();
    try { if (this.status === 'failed' && this.options.isCurrent()) this.options.fallback(error); }
    catch (failure) { this.error = `${this.error}; fallback: ${String(failure)}`.slice(0, 512); }
  }

  snapshot() {
    return Object.freeze({ status: this.status, error: this.error, fetchStarts: this.fetchStarts,
      decodePending: this.decodePending, aborted: this.abort.signal.aborted,
      canvasPixels: (this.canvas?.width ?? 0) * (this.canvas?.height ?? 0) });
  }

  dispose(): void {
    if (this.status === 'disposed') return;
    this.status = 'disposed'; this.stop(); this.discardCanvas();
  }
}
