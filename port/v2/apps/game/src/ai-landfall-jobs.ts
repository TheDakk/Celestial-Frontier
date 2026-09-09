/* One page-owned generation queue. Navigation does not own these jobs; explicit
 * cancel does. Jobs are not reload-durable. Exact originals are durable through
 * the separate original store; completion is neither art acceptance nor game-save
 * authority. Matches code as of 2026-09-09. */
import {
  aiLandfallInputKeyV1, copyAiLandfallInputV1,
  type AiLandfallGeneratedV1, type AiLandfallInputV1,
  type AiLandfallOriginalStoreV1, type AiLandfallOriginalV1,
} from './ai-landfall-originals.js';

export interface AiLandfallProgressV1 {
  readonly phase: string;
  readonly completed: number;
  readonly total: number;
  readonly etaMs: number | null;
}
export type AiLandfallJobStatusV1 = 'queued' | 'generating' | 'retaining' | 'canceling' | 'ready' | 'canceled' | 'failed';
export interface AiLandfallJobV1 {
  readonly jobId: string;
  readonly input: AiLandfallInputV1;
  readonly status: AiLandfallJobStatusV1;
  readonly progress: AiLandfallProgressV1;
  /** null until the original store completed and verified retention. */
  readonly originalId: string | null;
  readonly error: string | null;
}
export interface AiLandfallJobsOptionsV1 {
  readonly store: AiLandfallOriginalStoreV1;
  readonly generate: (input: AiLandfallInputV1, signal: AbortSignal,
    onProgress: (progress: AiLandfallProgressV1) => void) => Promise<AiLandfallGeneratedV1>;
  readonly onChange?: (jobs: readonly AiLandfallJobV1[]) => void;
  readonly onReady?: (job: AiLandfallJobV1, original: AiLandfallOriginalV1) => void;
}
interface MutableJob {
  row: AiLandfallJobV1;
  readonly key: string;
  readonly controller: AbortController;
}
const terminal = (status: AiLandfallJobStatusV1): boolean => ['ready', 'canceled', 'failed'].includes(status);
const progress = (phase: string, completed = 0, total = 1): AiLandfallProgressV1 => Object.freeze({ phase, completed, total, etaMs: null });

export class AiLandfallJobsV1 {
  private readonly rows: MutableJob[] = [];
  private readonly waiting: MutableJob[] = [];
  private active: MutableJob | null = null;
  private sequence = 0;
  private readonly idleWaiters: (() => void)[] = [];
  constructor(private readonly options: AiLandfallJobsOptionsV1) {}

  snapshot(): readonly AiLandfallJobV1[] { return Object.freeze(this.rows.map(job => job.row)); }

  enqueue(input: AiLandfallInputV1): string {
    const identity = copyAiLandfallInputV1(input);
    const key = aiLandfallInputKeyV1(identity);
    const duplicate = this.rows.find(job => job.key === key && !['failed', 'canceled'].includes(job.row.status));
    if (duplicate) {
      if (JSON.stringify(duplicate.row.input) !== JSON.stringify(identity)) throw new Error('Landfall recipe identity collision');
      return duplicate.row.jobId;
    }
    if (this.active !== null && this.waiting.length >= 3) throw new Error('Landfall queue is full');
    if (this.sequence === Number.MAX_SAFE_INTEGER) throw new Error('Landfall job sequence exhausted');
    const job: MutableJob = { key, controller: new AbortController(), row: Object.freeze({
      jobId: `landfall-job-${++this.sequence}`, input: identity, status: 'queued',
      progress: progress('Queued'), originalId: null, error: null,
    }) };
    this.rows.push(job);
    this.waiting.push(job);
    this.pump();
    this.notify();
    return job.row.jobId;
  }

  cancel(jobId: string): boolean {
    const job = this.rows.find(candidate => candidate.row.jobId === jobId);
    if (!job || terminal(job.row.status) || job.controller.signal.aborted) return false;
    job.controller.abort();
    if (job === this.active) this.update(job, { status: 'canceling', progress: progress('Canceling') });
    else {
      this.waiting.splice(this.waiting.indexOf(job), 1);
      this.update(job, { status: 'canceled', progress: progress('Canceled') });
      this.trim();
    }
    this.notify();
    return true;
  }

  settled(): Promise<void> {
    if (this.active === null && this.waiting.length === 0) return Promise.resolve();
    return new Promise(resolve => this.idleWaiters.push(resolve));
  }

  private update(job: MutableJob, patch: Partial<AiLandfallJobV1>): void {
    job.row = Object.freeze({ ...job.row, ...patch });
  }
  private notify(): void {
    // A presentation listener does not own or roll back a completed storage result.
    try { this.options.onChange?.(this.snapshot()); } catch { /* presentation owner handles its own rendering */ }
  }
  private trim(): void {
    let count = this.rows.filter(job => terminal(job.row.status)).length;
    for (let index = 0; count > 12 && index < this.rows.length;) {
      if (terminal(this.rows[index]!.row.status)) { this.rows.splice(index, 1); count--; }
      else index++;
    }
  }
  private pump(): void {
    if (this.active !== null) return;
    const job = this.waiting.shift();
    if (!job) {
      for (const resolve of this.idleWaiters.splice(0)) resolve();
      return;
    }
    this.active = job;
    void this.run(job);
  }
  private async run(job: MutableJob): Promise<void> {
    const signal = job.controller.signal;
    let lastFraction = 0;
    let progressFailure: Error | null = null;
    try {
      this.update(job, { status: 'generating', progress: progress('Loading model') });
      this.notify();
      // Reload/revisit reuse also verifies stored identity and exact bytes.
      const existing = await this.options.store.find(job.row.input);
      let original = existing;
      if (signal.aborted) throw new Error('Landfall generation canceled');
      if (original === null) {
        const generated = await this.options.generate(job.row.input, signal, value => {
          if (signal.aborted || job.row.status !== 'generating') return;
          if (!value || typeof value !== 'object' || typeof value.phase !== 'string' || !value.phase.length || value.phase.length > 160
            || !Number.isFinite(value.completed) || !Number.isFinite(value.total)
            || value.completed < 0 || value.total <= 0 || value.completed > value.total
            || value.completed / value.total < lastFraction
            || (value.etaMs !== null && (!Number.isFinite(value.etaMs) || value.etaMs < 0))) {
            progressFailure = new Error('Invalid or regressing landfall generation progress');
            throw progressFailure;
          }
          lastFraction = value.completed / value.total;
          // Reserve the last work unit for original retention; generation alone never says ready.
          this.update(job, { progress: Object.freeze({ phase: value.phase,
            completed: lastFraction * 99, total: 100, etaMs: value.etaMs }) });
          this.notify();
        });
        if (progressFailure) throw progressFailure;
        if (signal.aborted) throw new Error('Landfall generation canceled');
        this.update(job, { status: 'retaining', progress: progress('Retaining original', 99, 100) });
        this.notify();
        if (signal.aborted) throw new Error('Landfall generation canceled');
        original = await this.options.store.retain(job.row.input, generated);
      }
      if (signal.aborted) throw new Error('Landfall generation canceled');
      // Store is the only byte-verification owner; keep exact input checks at publication too.
      if (JSON.stringify(original.input) !== JSON.stringify(job.row.input)) throw new Error('Retained landfall identity changed');
      this.update(job, { status: 'ready', progress: progress('Ready', 100, 100), originalId: original.originalId });
      this.notify();
      try { this.options.onReady?.(job.row, original); } catch { /* ready data stays available to the presentation owner */ }
    } catch (error) {
      this.update(job, { status: signal.aborted ? 'canceled' : 'failed',
        progress: progress(signal.aborted ? 'Canceled' : 'Failed'),
        error: signal.aborted ? null : error instanceof Error ? error.message : String(error) });
      this.notify();
    } finally {
      this.active = null;
      this.trim();
      this.notify();
      this.pump();
    }
  }
}
