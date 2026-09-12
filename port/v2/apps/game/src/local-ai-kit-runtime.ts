import type { compileEarthKitEngineV4 } from './landfall-conditioning.js';
export type KitLandfallRecipeV4 = ReturnType<typeof compileEarthKitEngineV4>;
export interface KitLandfallResultV4 {
  readonly schema: 'cf.kit-engine-result.v4'; readonly painting: Blob; readonly composite: Blob;
  readonly width: number; readonly height: number; readonly elapsedMs: number;
  readonly captures: readonly { name: string; blob: Blob }[];
  readonly boxes: readonly Record<string, unknown>[];
  readonly measurements: readonly Record<string, unknown>[];
  readonly sessionCreates: Readonly<Record<string, number>>; readonly qualityAccepted: false;
}
/** App-owned worker lifetime: successful landings retain the same engine;
 * cancellation/fault/disposal terminates it and the next landing starts fresh. */
export function createWarmKitLandfallRuntimeV4(workerUrl: string) {
  let worker: Worker | null = null, active = false, sequence = 0, disposed = false;
  const destroy = (): void => { worker?.terminate(); worker = null; };
  let cancelActive: (() => void) | null = null;
  async function generate(recipe: KitLandfallRecipeV4, signal: AbortSignal,
    onEvent: (event: Readonly<Record<string, unknown>>) => void = () => {}): Promise<KitLandfallResultV4> {
    if (disposed) throw Error('Kit runtime disposed');
    if (active) throw Error('Kit runtime already painting');
    if (signal.aborted) throw new DOMException('Landing canceled', 'AbortError');
    active = true;
    try {
      worker ??= new Worker(workerUrl, { type: 'module', name: 'cf-kit-landfall-v4' });
      const current = worker, requestId = ++sequence;
      return await new Promise<KitLandfallResultV4>((resolve, reject) => {
        let settled = false;
        const finish = (error: Error | null, result?: KitLandfallResultV4): void => {
          if (settled) return; settled = true;
          clearTimeout(timer); signal.removeEventListener('abort', abort); cancelActive = null;
          current.onmessage = null; current.onerror = null; current.onmessageerror = null;
          if (error) { destroy(); reject(error); } else resolve(result!);
        };
        const abort = (): void => finish(new DOMException('Landing canceled', 'AbortError'));
        const timer = setTimeout(() => finish(Error('Kit engine run deadline exceeded')), 1_800_000);
        cancelActive = abort; signal.addEventListener('abort', abort, { once: true });
        current.onerror = event => finish(Error(event.message || 'Kit worker failed'));
        current.onmessageerror = () => finish(Error('Kit worker result unreadable'));
        current.onmessage = ({ data }: MessageEvent<Record<string, unknown>>) => {
          if (settled) return;
          if (data.type === 'progress') {
            if (data.phase === 'gpu-error') { finish(Error(String(data.message))); return; }
            try { onEvent(data); } catch { finish(Error('Kit progress observer failed')); }
            return;
          }
          if (data.requestId !== requestId) return;
          if (data.type === 'error') { finish(Error(String(data.message))); return; }
          if (data.type !== 'complete' || data.schema !== 'cf.kit-engine-result.v4'
            || !(data.painting instanceof Blob) || data.painting.type !== 'image/png'
            || !data.painting.size || data.painting.size > 16 * 1024 * 1024
            || data.width !== recipe.width || data.height !== recipe.height || data.qualityAccepted !== false) {
            finish(Error('Kit painting contract mismatch')); return;
          }
          finish(null, data as unknown as KitLandfallResultV4);
        };
        try { current.postMessage({ stage: 'kit-v4', requestId, recipe }); } catch (error) { finish(error instanceof Error ? error : Error(String(error))); }
        if (signal.aborted) abort();
      });
    } finally { active = false; }
  }
  return Object.freeze({ generate, dispose(): void { disposed = true; cancelActive?.(); destroy(); } });
}
