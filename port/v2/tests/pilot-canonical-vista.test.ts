import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountPilotEarthVista, pilotEarthVistaRequest } from '../apps/game/src/pilot-canonical-vista.js';
import { BIOME_VISTA_WORKER_RESPONSE_SCHEMA, validBiomeVistaWorkerRenderMessageV1 } from '../apps/game/src/biome-vista-protocol.js';

class Worker {
  static instances: Worker[] = [];
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onerror: (() => void) | null = null;
  readonly terminate = vi.fn(); readonly postMessage = vi.fn();
  constructor(readonly url: URL, readonly options: unknown) { Worker.instances.push(this); }
}
function fixture(missingContext = false) {
  const draws = [vi.fn(), vi.fn()];
  const canvases = draws.map((drawImage) => ({ width: 0, height: 0, dataset: {} as Record<string, string>,
    getContext: () => missingContext ? null : { drawImage } }));
  const status = { textContent: 'loading' };
  const dispose = mountPilotEarthVista(canvases as unknown as HTMLCanvasElement[], status as HTMLElement);
  const worker = Worker.instances.at(-1)!;
  const sent = worker.postMessage.mock.calls[0]![0];
  function result(patch: Record<string, unknown> = {}) {
    const bitmap = { width: 960, height: 430, close: vi.fn() };
    return { schema: BIOME_VISTA_WORKER_RESPONSE_SCHEMA, type: 'result', documentToken: sent.documentToken,
      generation: sent.generation, worldKey: sent.request.worldKey, environmentFingerprint: sent.request.environmentFingerprint,
      profileSchema: sent.request.profileSchema, profileDigest: sent.request.profileDigest, biomeKey: sent.request.biomeKey,
      scene: sent.request.scene, width: 960, height: 430, bitmap, ...patch };
  }
  return { draws, canvases, status, dispose, worker, sent, result,
    deliver: (data: unknown) => worker.onmessage!({ data } as MessageEvent<unknown>) };
}
beforeEach(() => { vi.useFakeTimers(); Worker.instances = []; vi.stubGlobal('Worker', Worker); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('one canonical Earth vista worker for the selected comparison pair', () => {
  it('builds the existing canonical Earth request and copies one bitmap unchanged to both canvases', () => {
    const request = pilotEarthVistaRequest(); expect(pilotEarthVistaRequest()).toEqual(request);
    expect(request).toMatchObject({ biomeKey: 'temperate', scene: 'generic', options: { seed: 133 } });
    const f = fixture(); expect(Worker.instances).toHaveLength(1);
    expect(validBiomeVistaWorkerRenderMessageV1(f.sent)).toBe(true); expect(f.sent.request).toEqual(request);
    const result = f.result(); f.deliver(result);
    for (const draw of f.draws) expect(draw).toHaveBeenCalledExactlyOnceWith(result.bitmap, 0, 0);
    expect(f.canvases.map((canvas) => [canvas.width, canvas.height, canvas.dataset.canonicalVista]))
      .toEqual([[960, 430, 'ready'], [960, 430, 'ready']]);
    expect(result.bitmap.close).toHaveBeenCalledTimes(1); expect(f.worker.terminate).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0); expect(f.status.textContent).toContain('Earth · Sol 424242 · world 133');
    const duplicate = f.result(); f.deliver(duplicate); expect(duplicate.bitmap.close).toHaveBeenCalledTimes(1);
    for (const draw of f.draws) expect(draw).toHaveBeenCalledTimes(1);
    f.worker.onerror!(); expect(f.status.textContent).toContain('canonical temperate roster');
    f.dispose(); f.dispose(); expect(f.worker.terminate).toHaveBeenCalledTimes(1);
    expect(f.canvases.map((canvas) => [canvas.width, canvas.height])).toEqual([[1, 1], [1, 1]]);
  });
  it.each([
    { documentToken: 'stale-document' }, { generation: 2 }, { worldKey: 'another-world' },
    { environmentFingerprint: 'cwe1:133:00000000' }, { biomeKey: 'jungle' }, { scene: 'reef' },
    { profileDigest: 'wrong-profile' }, { schema: 'unsupported-schema' }, { width: 1 },
  ])('closes and refuses a mismatched transferred bitmap: %j', (patch) => {
    const f = fixture(); const stale = f.result(patch); f.deliver(stale);
    expect(stale.bitmap.close).toHaveBeenCalledTimes(1); expect(f.status.textContent).toBe('loading');
    expect(f.draws.every((draw) => draw.mock.calls.length === 0)).toBe(true);
    const correct = f.result(); f.deliver(correct); expect(correct.bitmap.close).toHaveBeenCalledTimes(1);
    expect(f.canvases.every((canvas) => canvas.dataset.canonicalVista === 'ready')).toBe(true); f.dispose();
  });
  it('cleans late completion after disposal and never paints a detached comparison', () => {
    const f = fixture(); f.dispose(); const late = f.result(); f.deliver(late);
    expect(late.bitmap.close).toHaveBeenCalledTimes(1); expect(f.draws.every((draw) => draw.mock.calls.length === 0)).toBe(true);
    expect(f.worker.terminate).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['timeout', 'worker', 'context', 'draw'] as const)('reports incomplete and cleans up on %s failure', (failure) => {
    const f = fixture(failure === 'context');
    let result: ReturnType<typeof f.result> | null = null;
    if (failure === 'timeout') vi.advanceTimersByTime(12000);
    else if (failure === 'worker') f.worker.onerror!();
    else {
      if (failure === 'draw') f.draws[1]!.mockImplementation(() => { throw new Error('lost surface'); });
      result = f.result(); f.deliver(result);
    }
    expect(f.status.textContent).toContain('incomplete');
    expect(f.canvases.every((canvas) => canvas.dataset.canonicalVista === 'error')).toBe(true);
    expect(f.worker.terminate).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
    if (result) expect(result.bitmap.close).toHaveBeenCalledTimes(1);
    f.dispose();
  });
  it('contains native worker construction and post failures without a leaked job', () => {
    vi.stubGlobal('Worker', class { constructor() { throw new Error('unsupported worker'); } });
    const canvas = { width: 0, height: 0, dataset: {} }; const status = { textContent: 'loading' };
    const dispose = mountPilotEarthVista([canvas as unknown as HTMLCanvasElement], status as HTMLElement);
    expect(status.textContent).toContain('incomplete'); expect(vi.getTimerCount()).toBe(0); dispose();
    class BadPost extends Worker { override readonly postMessage = vi.fn(() => { throw new Error('post failed'); }); }
    vi.stubGlobal('Worker', BadPost);
    const second = mountPilotEarthVista([canvas as unknown as HTMLCanvasElement], status as HTMLElement);
    expect(Worker.instances.at(-1)!.terminate).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0); second();
  });
});
