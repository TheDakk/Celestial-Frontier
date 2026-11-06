import { createEarthSurfaceAtlasV1 } from './planet-surface-atlas.js';

const scope = self as DedicatedWorkerGlobalScope;
let consumed = false;
scope.onmessage = (event: MessageEvent<unknown>): void => {
  if (consumed) return;
  consumed = true;
  try {
    const source = event.data as Record<string, unknown> | null;
    if (!source || source.schema !== 'cf-earth-turn-request/v1') throw new Error('invalid atlas request');
    const atlas = createEarthSurfaceAtlasV1(source.planet as Record<string, unknown>,
      source.facts as Record<string, unknown> | null);
    scope.postMessage({ schema: 'cf-earth-turn-result/v1', ...atlas }, [atlas.pixels.buffer]);
  } catch (error) {
    scope.postMessage({ schema: 'cf-earth-turn-error/v1',
      message: (error instanceof Error ? error.message : String(error)).slice(0, 256) });
  }
};
